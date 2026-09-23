/**
 * Naming segments with CLIP: which word from a list best fits an image region.
 *
 * SAM finds shapes and cannot say what they are; CLIP was trained on image–
 * caption pairs and scores how well an image matches a sentence, for any
 * sentence. So each segment is cut out of the view, embedded, and compared
 * with "an aerial photograph of <label>" for each label; the best match names
 * it. The list is the user's, which is the point: "building, tree, water"
 * for one map, "greenhouse, meadow, ditch" for another, no retraining.
 *
 * Like `sam-runner.ts` this takes ONNX Runtime as an argument and touches no
 * DOM, so the tests run it in Node with the real model.
 *
 * - **The region is masked, not just boxed.** A segment's bounding box on an
 *   aerial photo is mostly *other* things — a canal's box is half houses — so
 *   pixels outside the segment are replaced by CLIP's mean colour (which
 *   normalises to zero, i.e. "no information") before embedding. A little
 *   context is kept around the edge (`contextCells`), since a roof with no
 *   surroundings at all is harder to tell from a road.
 * - **Square, then resized**: the crop is padded to a square around the
 *   segment rather than centre-cropped the way CLIP's preprocessor does for
 *   photos, which would cut off the ends of anything long — a canal, a street.
 * - Texts are embedded one at a time, unpadded: the Xenova text export takes
 *   only `input_ids` and pools at the end-of-text token, so batching would
 *   need padding the model has no mask for.
 */

import type * as OrtNamespace from 'onnxruntime-web';
import type { RgbaImage } from './sam-runner';

type Ort = typeof OrtNamespace;
type Session = OrtNamespace.InferenceSession;

const SIZE = 224;
const MEAN = [0.48145466, 0.4578275, 0.40821073];
const STD = [0.26862954, 0.26130258, 0.27577711];
/** CLIP's logit scale: cosine similarity × 100 before the softmax. */
const LOGIT_SCALE = 100;

export interface ClipSessions {
    vision: Session;
    text: Session;
}

/** What the tokenizer needs to provide; `@huggingface/tokenizers`' Tokenizer does. */
export interface ClipTokenizer {
    encode(text: string): { ids: number[] };
}

export async function createClipSessions(
    ort: Ort,
    vision: Uint8Array,
    text: Uint8Array,
    executionProviders: string[],
): Promise<ClipSessions> {
    const options = { executionProviders, graphOptimizationLevel: 'all' as const };
    return {
        vision: await ort.InferenceSession.create(vision, options),
        text: await ort.InferenceSession.create(text, options),
    };
}

function normalise(v: Float32Array): Float32Array {
    let n = 0;
    for (const x of v) n += x * x;
    n = Math.sqrt(n) || 1;
    return v.map(x => x / n);
}

export const DEFAULT_TEMPLATE = 'an aerial photograph of {label}.';

/** CLIP's text context: every export reads at most this many tokens. */
const CONTEXT_LENGTH = 77;
/** CLIP's end-of-text token, the highest id in its vocabulary. */
const END_OF_TEXT = 49407;

/**
 * Pads to CLIP's full context with zeros. open_clip exports (RemoteCLIP) are
 * traced at exactly 77 tokens; the Xenova export takes any length. Both pool
 * at the end-of-text token under a causal mask, so zeros after it change
 * nothing, and one shape serves both. Overlong text is cut, keeping its end token.
 */
export function padIds(ids: number[]): number[] {
    const out = ids.slice(0, CONTEXT_LENGTH);
    if (ids.length > CONTEXT_LENGTH) out[CONTEXT_LENGTH - 1] = END_OF_TEXT;
    while (out.length < CONTEXT_LENGTH) out.push(0);
    return out;
}

export async function embedTexts(
    ort: Ort, sessions: ClipSessions, tokenizer: ClipTokenizer, texts: string[],
): Promise<Float32Array[]> {
    const out: Float32Array[] = [];
    for (const text of texts) {
        const ids = padIds(tokenizer.encode(text).ids);
        const result = await sessions.text.run({
            input_ids: new ort.Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
        });
        out.push(normalise(Float32Array.from(result.text_embeds.data as Float32Array)));
    }
    return out;
}

/**
 * A region of the image as CLIP input: the square around `box` (image
 * pixels, [x0, y0, x1, y1]) grown by `margin` on each side, with every pixel
 * for which `inside(x, y)` is false set to the mean — zero after normalising.
 */
export function regionTensor(
    image: RgbaImage,
    box: [number, number, number, number],
    inside: (x: number, y: number) => boolean,
    margin = 0,
): Float32Array {
    const [bx0, by0, bx1, by1] = box;
    const side = Math.max(bx1 - bx0, by1 - by0) + 2 * margin;
    const cx = (bx0 + bx1) / 2;
    const cy = (by0 + by1) / 2;
    const x0 = cx - side / 2;
    const y0 = cy - side / 2;
    const scale = side / SIZE;
    const plane = SIZE * SIZE;
    const out = new Float32Array(3 * plane); // zeros: the mean colour
    for (let y = 0; y < SIZE; y++) {
        const sy = Math.floor(y0 + (y + 0.5) * scale);
        if (sy < 0 || sy >= image.height) continue;
        for (let x = 0; x < SIZE; x++) {
            const sx = Math.floor(x0 + (x + 0.5) * scale);
            if (sx < 0 || sx >= image.width || !inside(sx, sy)) continue;
            const i = (sy * image.width + sx) * 4;
            for (let c = 0; c < 3; c++) {
                out[c * plane + y * SIZE + x] = (image.data[i + c] / 255 - MEAN[c]) / STD[c];
            }
        }
    }
    return out;
}

export async function embedRegion(ort: Ort, sessions: ClipSessions, pixels: Float32Array): Promise<Float32Array> {
    const result = await sessions.vision.run({
        pixel_values: new ort.Tensor('float32', pixels, [1, 3, SIZE, SIZE]),
    });
    return normalise(Float32Array.from(result.image_embeds.data as Float32Array));
}

/**
 * A segment's embedding: the region cut out (everything else set to the mean)
 * averaged with the square around it as it is. Measured on an Amsterdam
 * orthophoto with RemoteCLIP, each alone gets one thing wrong — cut out, the
 * water of a narrow canal reads as roof; with its surroundings, a small roof
 * reads as the street beside it — and the average names both. It costs two
 * image embeddings per segment (~10 s for 125 segments on the CPU).
 */
export async function embedSegment(
    ort: Ort,
    sessions: ClipSessions,
    image: RgbaImage,
    box: [number, number, number, number],
    inside: (x: number, y: number) => boolean,
): Promise<Float32Array> {
    const cutOut = await embedRegion(ort, sessions, regionTensor(image, box, inside));
    const withSurroundings = await embedRegion(ort, sessions, regionTensor(image, box, () => true));
    return normalise(cutOut.map((v, i) => v + withSurroundings[i]));
}

/** Best label per region, with CLIP's softmax probability for it. */
export function classify(regions: Float32Array[], labels: Float32Array[]): { label: number; probability: number }[] {
    return regions.map(r => {
        const logits = labels.map(l => {
            let s = 0;
            for (let i = 0; i < r.length; i++) s += r[i] * l[i];
            return s * LOGIT_SCALE;
        });
        const max = Math.max(...logits);
        const exp = logits.map(v => Math.exp(v - max));
        const sum = exp.reduce((a, b) => a + b, 0);
        let best = 0;
        for (let i = 1; i < exp.length; i++) if (exp[i] > exp[best]) best = i;
        return { label: best, probability: exp[best] / sum };
    });
}
