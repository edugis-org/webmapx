/**
 * Segment Anything inference: image in, mask outline out.
 *
 * Takes the ONNX Runtime module as an argument rather than importing it, the
 * way `geoprocessing-runner.ts` takes GDAL: the worker hands it the WebGPU
 * build with its wasm addressed through Vite, and `tests/sam-runner.test.ts`
 * hands it the Node build and runs the real models. Nothing here touches the
 * DOM, so resizing is done by hand rather than with a canvas.
 *
 * Two model families, one pipeline. They differ in exactly three places:
 *  - **Resizing.** SAM 2 stretches the image to 1024×1024; SAM (SlimSAM) keeps
 *    the aspect ratio, scales the longest edge to 1024 and pads the rest with
 *    zeros. Prompts and the mask are mapped through the same per-axis scale,
 *    so everything downstream only knows `scaleX`/`scaleY`.
 *  - **Embeddings.** SAM 2's encoder returns three feature levels
 *    (`image_embeddings.0..2`); SAM's returns `image_embeddings` and
 *    `image_positional_embeddings`. They are kept as a bag of tensors and fed
 *    to the decoder by name, so the decoder call is family-agnostic.
 *  - **Boxes.** SAM 2's decoder takes `input_boxes`. SlimSAM's export has no
 *    box input at all (its point labels only mean include/exclude), so a box is
 *    turned into a positive point at its centre plus negatives just outside
 *    its corners — a much weaker prompt, which is why SAM 2 is the default
 *    wherever WebGPU makes it affordable.
 */

import type * as OrtNamespace from 'onnxruntime-web';
import type { SamFamily } from '../utils/sam/sam-models';
import { maskToRings } from '../utils/sam/mask-to-polygon';

export type Ort = typeof OrtNamespace;
type Session = OrtNamespace.InferenceSession;
type Tensor = OrtNamespace.Tensor;

const INPUT_SIZE = 1024;
const MASK_SIZE = 256;
const IMAGE_MEAN = [0.485, 0.456, 0.406];
const IMAGE_STD = [0.229, 0.224, 0.225];

export interface RgbaImage {
    data: Uint8ClampedArray | Uint8Array;
    width: number;
    height: number;
}

export interface SamSessions {
    family: SamFamily;
    encoder: Session;
    decoder: Session;
}

export interface SamEmbedding {
    family: SamFamily;
    tensors: Record<string, Tensor>;
    width: number;
    height: number;
    /** Model-input pixels per image pixel, per axis. */
    scaleX: number;
    scaleY: number;
}

/** A point prompt in image pixels; `positive` false means "not this". */
export interface SamPoint {
    x: number;
    y: number;
    positive: boolean;
}

/** A box prompt in image pixels. */
export interface SamBox {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

export interface SamPrompt {
    points: SamPoint[];
    box?: SamBox;
}

/** How much of the object to outline; `auto` takes the candidate the model scores highest. */
export type SamGranularity = 'auto' | SamGranularityLevel;
export type SamGranularityLevel = 'whole' | 'part' | 'detail';

export interface SamOutlineOptions {
    granularity?: SamGranularity;
    /** Logit at which the outline is drawn; 0 is the model's boundary. */
    threshold?: number;
}

/** The decoder's raw answer: three candidate masks as logits on a coarse grid. */
export interface SamMasks {
    /** Three planes of `maskW`×`maskH` logits, back to back. */
    logits: Float32Array;
    /** The model's IoU estimate per plane. */
    scores: number[];
    maskW: number;
    maskH: number;
    /** Columns and rows covering the image; beyond them is SAM's padding. */
    cols: number;
    rows: number;
    /** Image pixels per grid cell. */
    cellX: number;
    cellY: number;
    /** SAM 2 judged there is no object at the prompt. */
    empty: boolean;
}

interface SamCandidate {
    index: number;
    score: number;
    coverage: number;
    granularity: SamGranularityLevel;
}

export interface SamResult {
    /** Outer rings and holes in image pixels, as d3-contour returns them: one polygon per entry. */
    polygons: [number, number][][][];
    /** The model's own estimate of the mask's quality (IoU), 0–1. */
    score: number;
    /** Share of the image the mask covers, 0–1. */
    coverage: number;
    /** Which candidate was outlined. */
    granularity: SamGranularityLevel;
    /** All three candidates, largest first, so a UI can say what the others would give. */
    candidates: { granularity: SamGranularityLevel; score: number; coverage: number }[];
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export interface ModelBytes {
    /** Graph first, then external-data files, as in `SamModelFiles`. */
    files: { name: string; data: Uint8Array }[];
}

async function createSession(ort: Ort, bytes: ModelBytes, executionProviders: string[]): Promise<Session> {
    const [graph, ...external] = bytes.files;
    return ort.InferenceSession.create(graph.data, {
        executionProviders,
        graphOptimizationLevel: 'all',
        ...(external.length ? { externalData: external.map(f => ({ path: f.name, data: f.data })) } : {}),
    });
}

export async function createSamSessions(
    ort: Ort,
    family: SamFamily,
    encoder: ModelBytes,
    decoder: ModelBytes,
    executionProviders: string[],
): Promise<SamSessions> {
    return {
        family,
        encoder: await createSession(ort, encoder, executionProviders),
        // Same backend for the decoder: the fp16 variant is picked for WebGPU,
        // and half-precision weights are not something to hand the CPU backend.
        decoder: await createSession(ort, decoder, executionProviders),
    };
}

// ─── Encoding ────────────────────────────────────────────────────────────────

/**
 * Bilinear resample of an RGBA image into a normalised CHW float tensor of
 * INPUT_SIZE², with `outW`×`outH` of it filled and the rest left at zero —
 * which after normalisation is what SAM's own padding produces.
 */
export function preprocess(image: RgbaImage, outW: number, outH: number): Float32Array {
    const { data, width, height } = image;
    const plane = INPUT_SIZE * INPUT_SIZE;
    const out = new Float32Array(3 * plane);
    const sx = width / outW;
    const sy = height / outH;
    for (let y = 0; y < outH; y++) {
        const fy = Math.min(height - 1, Math.max(0, (y + 0.5) * sy - 0.5));
        const y0 = Math.floor(fy);
        const y1 = Math.min(height - 1, y0 + 1);
        const wy = fy - y0;
        for (let x = 0; x < outW; x++) {
            const fx = Math.min(width - 1, Math.max(0, (x + 0.5) * sx - 0.5));
            const x0 = Math.floor(fx);
            const x1 = Math.min(width - 1, x0 + 1);
            const wx = fx - x0;
            const i00 = (y0 * width + x0) * 4;
            const i01 = (y0 * width + x1) * 4;
            const i10 = (y1 * width + x0) * 4;
            const i11 = (y1 * width + x1) * 4;
            const o = y * INPUT_SIZE + x;
            for (let c = 0; c < 3; c++) {
                const top = data[i00 + c] * (1 - wx) + data[i01 + c] * wx;
                const bottom = data[i10 + c] * (1 - wx) + data[i11 + c] * wx;
                const v = (top * (1 - wy) + bottom * wy) / 255;
                out[c * plane + o] = (v - IMAGE_MEAN[c]) / IMAGE_STD[c];
            }
        }
    }
    return out;
}

/** Model-input size the image occupies: stretched for SAM 2, aspect-kept for SAM. */
export function inputFootprint(family: SamFamily, width: number, height: number): { w: number; h: number } {
    if (family === 'sam2') return { w: INPUT_SIZE, h: INPUT_SIZE };
    const s = INPUT_SIZE / Math.max(width, height);
    return { w: Math.round(width * s), h: Math.round(height * s) };
}

export async function encodeImage(ort: Ort, sessions: SamSessions, image: RgbaImage): Promise<SamEmbedding> {
    const { w, h } = inputFootprint(sessions.family, image.width, image.height);
    const pixels = preprocess(image, w, h);
    const outputs = await sessions.encoder.run({
        pixel_values: new ort.Tensor('float32', pixels, [1, 3, INPUT_SIZE, INPUT_SIZE]),
    });
    return {
        family: sessions.family,
        tensors: outputs,
        width: image.width,
        height: image.height,
        scaleX: w / image.width,
        scaleY: h / image.height,
    };
}

// ─── Decoding ────────────────────────────────────────────────────────────────

/**
 * SlimSAM cannot take a box, so a box becomes points: its centre as "this",
 * and four points just outside its corners as "not this", which is what keeps
 * the mask from spilling over the edges the user drew.
 */
export function boxAsPoints(box: SamBox): SamPoint[] {
    const cx = (box.x0 + box.x1) / 2;
    const cy = (box.y0 + box.y1) / 2;
    const mx = Math.abs(box.x1 - box.x0) * 0.05;
    const my = Math.abs(box.y1 - box.y0) * 0.05;
    const [left, right] = [Math.min(box.x0, box.x1) - mx, Math.max(box.x0, box.x1) + mx];
    const [top, bottom] = [Math.min(box.y0, box.y1) - my, Math.max(box.y0, box.y1) + my];
    return [
        { x: cx, y: cy, positive: true },
        { x: left, y: top, positive: false },
        { x: right, y: top, positive: false },
        { x: left, y: bottom, positive: false },
        { x: right, y: bottom, positive: false },
    ];
}

/**
 * Runs the decoder and returns all three candidate masks as logits, which the
 * worker keeps so that granularity and threshold can change without a rerun.
 */
export async function runDecoder(
    ort: Ort,
    sessions: SamSessions,
    embedding: SamEmbedding,
    prompt: SamPrompt,
): Promise<SamMasks> {
    const { scaleX, scaleY } = embedding;
    let points = prompt.points;
    let box = prompt.box;
    if (box && embedding.family === 'sam') {
        points = [...points, ...boxAsPoints(box)];
        box = undefined;
    }
    if (!points.length && !box) throw new Error('A prompt needs at least one point or a box.');

    const n = points.length;
    const coords = new Float32Array(n * 2);
    const labels = new BigInt64Array(n);
    points.forEach((p, i) => {
        coords[i * 2] = p.x * scaleX;
        coords[i * 2 + 1] = p.y * scaleY;
        labels[i] = p.positive ? 1n : 0n;
    });

    const feeds: Record<string, Tensor> = {
        input_points: new ort.Tensor('float32', coords, [1, 1, n, 2]),
        input_labels: new ort.Tensor('int64', labels, [1, 1, n]),
    };
    if (embedding.family === 'sam2') {
        feeds.input_boxes = box
            ? new ort.Tensor('float32', new Float32Array([
                Math.min(box.x0, box.x1) * scaleX, Math.min(box.y0, box.y1) * scaleY,
                Math.max(box.x0, box.x1) * scaleX, Math.max(box.y0, box.y1) * scaleY,
            ]), [1, 1, 4])
            : new ort.Tensor('float32', new Float32Array(0), [1, 0, 4]);
    }
    for (const name of sessions.decoder.inputNames) {
        if (!feeds[name]) {
            const t = embedding.tensors[name];
            if (!t) throw new Error(`Decoder input "${name}" has no matching encoder output.`);
            feeds[name] = t;
        }
    }

    const out = await sessions.decoder.run(feeds);
    const [maskH, maskW] = out.pred_masks.dims.slice(-2) as number[];
    // Mask cells covering the image (SAM's padding lies beyond them), and how
    // many image pixels one cell spans.
    const cellX = (INPUT_SIZE / maskW) / scaleX;
    const cellY = (INPUT_SIZE / maskH) / scaleY;
    // An object SAM 2 is confident is not there still comes with masks —
    // usually noise. Report nothing rather than polygons made of it.
    const objectLogit = out.object_score_logits?.data[0] as number | undefined;
    return {
        logits: out.pred_masks.data as Float32Array,
        scores: Array.from(out.iou_scores.data as Float32Array),
        maskW,
        maskH,
        cols: Math.min(maskW, Math.ceil(embedding.width / cellX)),
        rows: Math.min(maskH, Math.ceil(embedding.height / cellY)),
        cellX,
        cellY,
        empty: objectLogit !== undefined && objectLogit < 0,
    };
}

function countAbove(logits: Float32Array, stride: number, cols: number, rows: number, threshold: number): number {
    let n = 0;
    for (let y = 0; y < rows; y++) {
        const row = y * stride;
        for (let x = 0; x < cols; x++) if (logits[row + x] > threshold) n++;
    }
    return n;
}

/**
 * Ranks the decoder's candidates by the area they cover at `threshold`:
 * largest is the whole object, smallest the detail. SAM's three outputs are
 * trained as whole/part/subpart, but their *order* is not part of any
 * contract, so it is read from the masks rather than assumed.
 */
export function rankCandidates(masks: SamMasks, threshold = 0): SamCandidate[] {
    const plane = masks.maskW * masks.maskH;
    const cells = masks.cols * masks.rows;
    const byArea = masks.scores
        .map((score, index) => ({
            index,
            score,
            coverage: countAbove(masks.logits.subarray(index * plane, (index + 1) * plane), masks.maskW, masks.cols, masks.rows, threshold) / cells,
        }))
        .sort((a, b) => b.coverage - a.coverage);
    const names: SamGranularityLevel[] = ['whole', 'part', 'detail'];
    return byArea.map((c, rank) => ({ ...c, granularity: names[Math.min(rank, names.length - 1)] }));
}

/**
 * Outlines one of the decoder's candidates. Cheap — a contour, no inference —
 * so changing granularity or threshold redraws without running the model.
 *
 * `threshold` is in logits: 0 is the model's own boundary, negative grows the
 * outline (take in pixels the model is less sure of), positive shrinks it.
 */
export function outlineMask(masks: SamMasks, options: SamOutlineOptions = {}): SamResult {
    const threshold = options.threshold ?? 0;
    const candidates = rankCandidates(masks, threshold);
    const summary = candidates.map(({ granularity, score, coverage }) => ({ granularity, score, coverage }));
    if (masks.empty) return { polygons: [], score: 0, coverage: 0, granularity: 'whole', candidates: summary };

    const wanted = options.granularity ?? 'auto';
    const chosen = wanted === 'auto'
        ? candidates.reduce((best, c) => (c.score > best.score ? c : best))
        : candidates.find(c => c.granularity === wanted) ?? candidates[0];

    const plane = masks.maskW * masks.maskH;
    const logits = masks.logits.subarray(chosen.index * plane, (chosen.index + 1) * plane);
    const { polygons, coverage } = maskToRings(logits, masks.maskW, masks.cols, masks.rows, threshold);
    return {
        polygons: polygons.map(poly => poly.map(ring => ring.map(([x, y]) => [x * masks.cellX, y * masks.cellY] as [number, number]))),
        score: chosen.score,
        coverage,
        granularity: chosen.granularity,
        candidates: summary,
    };
}

/** Decoder run plus outline in one call, for callers that do not keep the masks. */
export async function decodeMask(
    ort: Ort,
    sessions: SamSessions,
    embedding: SamEmbedding,
    prompt: SamPrompt,
    options?: SamOutlineOptions,
): Promise<SamResult> {
    return outlineMask(await runDecoder(ort, sessions, embedding, prompt), options);
}

export { INPUT_SIZE as SAM_INPUT_SIZE, MASK_SIZE as SAM_MASK_SIZE };
