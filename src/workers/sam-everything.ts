/**
 * "Segment everything": the whole view as a partition into segments, each
 * coloured by what kind of thing it looks like.
 *
 * SAM's own automatic mask generator, reduced to what runs in a browser:
 *  1. **A grid of single-point prompts** over the image, one decoder run each.
 *     Batching them into one run was measured and buys nothing on the CPU
 *     (16 prompts: 625 ms batched, 16 × 40 ms apart), and SAM 2's export cannot
 *     batch points at all, so it is a plain loop that reports progress and can
 *     be cancelled between prompts.
 *  2. **Keep confident, stable masks.** Each prompt yields three candidates;
 *     one is kept if the model's IoU estimate clears `minScore` and it is
 *     *stable* — the mask at logit +1 is most of the mask at −1 — which is
 *     what separates real objects from texture.
 *  3. **Drop duplicates** by box overlap (non-maximum suppression, best score
 *     first), as SAM's generator does: many grid points land on one roof.
 *  4. **Partition.** Masks still overlap (a building and its roof face), so
 *     they are painted into one label grid, largest first, so that a smaller
 *     mask inside a larger one survives as its own segment.
 *  4b. **Fill the gaps.** On aerial imagery SAM is unsure of most of what it
 *     sees — measured over a 16×16 grid on an Amsterdam orthophoto, the median
 *     IoU estimate was 0.28 — so confident masks cover only about half the
 *     view even with the thresholds below. Each connected patch nobody claimed
 *     becomes a segment of its own (`kind: 'fill'`), so the view is covered
 *     completely and grouping still colours those patches by what they look
 *     like. They are marked, because their outline is where *other* segments
 *     stop, not a boundary the model found.
 *  5. **Group.** SAM does not know what anything *is*, but its image embedding
 *     places similar-looking material close together. Each segment's
 *     embedding vectors are averaged and the segments clustered (k-means,
 *     cosine), so roofs, trees, water and streets tend to come out as
 *     separate groups — unnamed. Regrouping with another k needs no model.
 *
 * Outlines come from contouring each segment's cells at 0.5, so two
 * neighbouring segments trace exactly the same line between them.
 */

import type { Ort, SamEmbedding, SamSessions } from './sam-runner';
import { runDecoder } from './sam-runner';
import { maskToRings } from '../utils/sam/mask-to-polygon';

export interface EverythingOptions {
    /** Grid of prompts: this many per side. */
    pointsPerSide?: number;
    /** Minimum IoU estimate for a candidate. */
    minScore?: number;
    /** Minimum stability (area at logit +1 ÷ area at −1). */
    minStability?: number;
    /** Box IoU above which the weaker of two candidates is a duplicate. */
    nmsIou?: number;
    /** Segments smaller than this many mask cells are dropped. */
    minAreaCells?: number;
    /** Turn the unclaimed patches into segments too, so the view is covered completely. */
    fillGaps?: boolean;
}

export interface EverythingSegment {
    /** Outer ring then holes, in image pixels; one entry per part. */
    polygons: [number, number][][][];
    score: number;
    /** Share of the image. */
    coverage: number;
    /** `mask`: an outline SAM found. `fill`: a patch between them no mask claimed. */
    kind: 'mask' | 'fill';
}

export interface EverythingResult {
    segments: EverythingSegment[];
    /** Group per segment, 0 = the group covering most area. */
    groups: number[];
    k: number;
    /** Prompts run, candidates kept, and what was cut, for the status line. */
    stats: { prompts: number; candidates: number; afterNms: number; segments: number; filled: number };
}

export class SamOperationCancelled extends Error {
    constructor() {
        super('Cancelled.');
        this.name = 'SamOperationCancelled';
    }
}

interface Candidate {
    cells: Uint8Array;
    area: number;
    score: number;
    box: [number, number, number, number];
}

/**
 * Tuned on aerial imagery (SAM 2.1 Tiny, 16×16 prompts, 1024×822 view): at
 * 0.7/0.8 — close to SAM's own defaults, made for photographs — 51 segments
 * covered 28% of the view; at 0.5/0.7, 113 covered 48% without visible junk;
 * stability 0.9 drops coverage to 16% whatever the score.
 */
const DEFAULTS: Required<EverythingOptions> = {
    pointsPerSide: 16,
    minScore: 0.5,
    minStability: 0.7,
    nmsIou: 0.7,
    minAreaCells: 12,
    fillGaps: true,
};

// ─── Candidates ──────────────────────────────────────────────────────────────

/** Binarises one candidate at 0 and measures its stability, inside the image cells only. */
function candidateFrom(
    logits: Float32Array, stride: number, cols: number, rows: number, score: number,
): { candidate: Candidate; stability: number } | null {
    const cells = new Uint8Array(cols * rows);
    let area = 0;
    let loose = 0;
    let tight = 0;
    let x0 = cols, y0 = rows, x1 = -1, y1 = -1;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const v = logits[y * stride + x];
            if (v > -1) loose++;
            if (v > 1) tight++;
            if (v > 0) {
                cells[y * cols + x] = 1;
                area++;
                if (x < x0) x0 = x;
                if (x > x1) x1 = x;
                if (y < y0) y0 = y;
                if (y > y1) y1 = y;
            }
        }
    }
    if (!area) return null;
    return { candidate: { cells, area, score, box: [x0, y0, x1 + 1, y1 + 1] }, stability: loose ? tight / loose : 0 };
}

export function boxIou(a: Candidate['box'], b: Candidate['box']): number {
    const ix = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0]));
    const iy = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
    const inter = ix * iy;
    const union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter;
    return union ? inter / union : 0;
}

/** Best score first; a candidate whose box overlaps a kept one too much is a duplicate. */
export function suppressDuplicates<T extends { score: number; box: Candidate['box'] }>(candidates: T[], iou: number): T[] {
    const kept: T[] = [];
    for (const c of [...candidates].sort((a, b) => b.score - a.score)) {
        if (!kept.some(k => boxIou(k.box, c.box) > iou)) kept.push(c);
    }
    return kept;
}

// ─── Partition ───────────────────────────────────────────────────────────────

/**
 * Paints masks into one label grid, largest first so a mask nested in a
 * larger one keeps its own cells. Returns the grid and each label's area;
 * labels whose surviving area is below `minArea` are erased.
 */
export function partition(
    masks: { cells: Uint8Array; area: number }[], cols: number, rows: number, minArea: number,
): { labels: Int32Array; order: number[] } {
    const labels = new Int32Array(cols * rows).fill(-1);
    const byArea = masks.map((m, i) => i).sort((a, b) => masks[b].area - masks[a].area);
    for (const i of byArea) {
        const cells = masks[i].cells;
        for (let c = 0; c < cells.length; c++) if (cells[c]) labels[c] = i;
    }
    const area = new Int32Array(masks.length);
    for (const l of labels) if (l >= 0) area[l]++;
    for (let c = 0; c < labels.length; c++) if (labels[c] >= 0 && area[labels[c]] < minArea) labels[c] = -1;
    const order = byArea.filter(i => area[i] >= minArea);
    return { labels, order };
}

/**
 * Labels each 4-connected patch of unclaimed cells, from `firstLabel` on;
 * patches smaller than `minArea` stay unclaimed. Returns the labels added.
 */
export function fillGaps(labels: Int32Array, cols: number, rows: number, minArea: number, firstLabel: number): number[] {
    const added: number[] = [];
    const stack: number[] = [];
    const patch: number[] = [];
    const seen = new Uint8Array(labels.length);
    let next = firstLabel;
    for (let start = 0; start < labels.length; start++) {
        if (labels[start] !== -1 || seen[start]) continue;
        patch.length = 0;
        stack.push(start);
        seen[start] = 1;
        while (stack.length) {
            const c = stack.pop()!;
            patch.push(c);
            const x = c % cols;
            const y = (c - x) / cols;
            const visit = (n: number) => {
                if (!seen[n] && labels[n] === -1) { seen[n] = 1; stack.push(n); }
            };
            if (x > 0) visit(c - 1);
            if (x < cols - 1) visit(c + 1);
            if (y > 0) visit(c - cols);
            if (y < rows - 1) visit(c + cols);
        }
        if (patch.length < minArea) continue;
        for (const c of patch) labels[c] = next;
        added.push(next++);
    }
    return added;
}

/** Contours one label of the grid, cropped to its extent, in grid-cell coordinates. */
function outlineLabel(labels: Int32Array, cols: number, rows: number, label: number): [number, number][][][] {
    let x0 = cols, y0 = rows, x1 = -1, y1 = -1;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (labels[y * cols + x] !== label) continue;
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
        }
    }
    if (x1 < 0) return [];
    // One empty cell of margin on every side, so rings close inside the crop.
    const ox = x0 - 1, oy = y0 - 1;
    const w = x1 - x0 + 3, h = y1 - y0 + 3;
    const crop = new Float32Array(w * h);
    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            if (labels[y * cols + x] === label) crop[(y - oy) * w + (x - ox)] = 1;
        }
    }
    return maskToRings(crop, w, w, h, 0.5).polygons
        .map(poly => poly.map(ring => ring.map(([x, y]) => [x + ox, y + oy] as [number, number])));
}

// ─── Grouping ────────────────────────────────────────────────────────────────

/**
 * Averages the image embedding over each segment's cells. The embedding grid
 * (64²) is a quarter of the mask grid's resolution in each direction over the
 * same model input, so embedding cell (ex, ey) is judged by the label at the
 * centre of the mask cells it covers.
 */
export function segmentFeatures(
    embedding: Float32Array, channels: number, embW: number, embH: number,
    labels: Int32Array, cols: number, rows: number, order: number[], maskW: number,
): Float32Array[] {
    const scale = maskW / embW;
    const index = new Map(order.map((label, i) => [label, i]));
    const sums = order.map(() => new Float32Array(channels));
    const counts = new Int32Array(order.length);
    const plane = embW * embH;
    for (let ey = 0; ey < embH; ey++) {
        const my = Math.floor((ey + 0.5) * scale);
        if (my >= rows) continue;
        for (let ex = 0; ex < embW; ex++) {
            const mx = Math.floor((ex + 0.5) * scale);
            if (mx >= cols) continue;
            const i = index.get(labels[my * cols + mx]);
            if (i === undefined) continue;
            counts[i]++;
            const sum = sums[i];
            for (let c = 0; c < channels; c++) sum[c] += embedding[c * plane + ey * embW + ex];
        }
    }
    // A segment too small to own an embedding cell's centre borrows the cell under its first pixel.
    order.forEach((label, i) => {
        if (counts[i]) return;
        const cell = labels.indexOf(label);
        const ex = Math.min(embW - 1, Math.floor((cell % cols) / scale));
        const ey = Math.min(embH - 1, Math.floor(Math.floor(cell / cols) / scale));
        for (let c = 0; c < channels; c++) sums[i][c] = embedding[c * plane + ey * embW + ex];
    });
    return sums.map(v => normalise(v));
}

function normalise(v: Float32Array): Float32Array {
    let n = 0;
    for (const x of v) n += x * x;
    n = Math.sqrt(n) || 1;
    for (let i = 0; i < v.length; i++) v[i] /= n;
    return v;
}

function dot(a: Float32Array, b: Float32Array): number {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
}

/**
 * Spherical k-means (cosine similarity on unit vectors), k-means++ seeding
 * with a fixed seed so the same view groups the same way twice. Groups are
 * renumbered by the total weight they cover, so group 0 — and the first
 * colour — is always the dominant material.
 */
export function clusterFeatures(features: Float32Array[], weights: number[], k: number, seed = 1): number[] {
    const n = features.length;
    if (!n) return [];
    k = Math.max(1, Math.min(k, n));
    let s = seed;
    const random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;

    const centres: Float32Array[] = [Float32Array.from(features[Math.floor(random() * n)])];
    const dist = new Float64Array(n).fill(Infinity);
    while (centres.length < k) {
        let total = 0;
        for (let i = 0; i < n; i++) {
            dist[i] = Math.min(dist[i], 1 - dot(features[i], centres[centres.length - 1]));
            total += dist[i] * weights[i];
        }
        let r = random() * total;
        let pick = n - 1;
        for (let i = 0; i < n; i++) {
            r -= dist[i] * weights[i];
            if (r <= 0) { pick = i; break; }
        }
        centres.push(Float32Array.from(features[pick]));
    }

    const assign = new Int32Array(n).fill(-1);
    for (let iter = 0; iter < 30; iter++) {
        let changed = false;
        for (let i = 0; i < n; i++) {
            let best = 0;
            let bestSim = -Infinity;
            for (let c = 0; c < k; c++) {
                const sim = dot(features[i], centres[c]);
                if (sim > bestSim) { bestSim = sim; best = c; }
            }
            if (assign[i] !== best) { assign[i] = best; changed = true; }
        }
        if (!changed) break;
        for (let c = 0; c < k; c++) {
            const sum = new Float32Array(features[0].length);
            let any = false;
            for (let i = 0; i < n; i++) {
                if (assign[i] !== c) continue;
                any = true;
                for (let d = 0; d < sum.length; d++) sum[d] += features[i][d] * weights[i];
            }
            if (any) centres[c] = normalise(sum);
        }
    }

    const weightOf = new Float64Array(k);
    for (let i = 0; i < n; i++) weightOf[assign[i]] += weights[i];
    const rank = Array.from({ length: k }, (_, c) => c).sort((a, b) => weightOf[b] - weightOf[a]);
    const renumber = new Int32Array(k);
    rank.forEach((c, i) => { renumber[c] = i; });
    return Array.from(assign, c => renumber[c]);
}

// ─── The whole thing ─────────────────────────────────────────────────────────

export interface EverythingState {
    features: Float32Array[];
    weights: number[];
    /** The label grid and which label each segment is, so a segment's cells can be found again. */
    labels: Int32Array;
    order: number[];
    cols: number;
    rows: number;
    /** Image pixels per grid cell. */
    cellX: number;
    cellY: number;
}

/**
 * One segment as an image region: its bounding box in image pixels and a
 * test for whether a pixel belongs to it — for cutting it out to name it.
 */
export function segmentRegion(state: EverythingState, index: number): {
    box: [number, number, number, number];
    inside: (x: number, y: number) => boolean;
} {
    const { labels, cols, rows, cellX, cellY } = state;
    const label = state.order[index];
    let x0 = cols, y0 = rows, x1 = -1, y1 = -1;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (labels[y * cols + x] !== label) continue;
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
        }
    }
    return {
        box: [x0 * cellX, y0 * cellY, (x1 + 1) * cellX, (y1 + 1) * cellY],
        inside: (x, y) => {
            const gx = Math.floor(x / cellX);
            const gy = Math.floor(y / cellY);
            return gx >= 0 && gy >= 0 && gx < cols && gy < rows && labels[gy * cols + gx] === label;
        },
    };
}

/** The embedding tensor holding one 256-channel vector per 64² cell, whichever family. */
function pooledEmbedding(embedding: SamEmbedding): { data: Float32Array; channels: number; w: number; h: number } {
    const t = embedding.tensors['image_embeddings.2'] ?? embedding.tensors.image_embeddings;
    if (!t) throw new Error('The encoder produced no image embedding to group by.');
    const [, channels, h, w] = t.dims as number[];
    return { data: t.data as Float32Array, channels, w, h };
}

export async function segmentEverything(
    ort: Ort,
    sessions: SamSessions,
    embedding: SamEmbedding,
    options: EverythingOptions & { k: number },
    hooks: { onProgress?: (done: number, total: number) => void; cancelled?: () => boolean } = {},
): Promise<{ result: EverythingResult; state: EverythingState }> {
    const o = { ...DEFAULTS, ...options };
    const n = o.pointsPerSide;
    const kept: Candidate[] = [];
    let cols = 0, rows = 0, cellX = 1, cellY = 1, maskW = 256;

    const total = n * n;
    for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
            if (hooks.cancelled?.()) throw new SamOperationCancelled();
            const x = ((i + 0.5) / n) * embedding.width;
            const y = ((j + 0.5) / n) * embedding.height;
            const masks = await runDecoder(ort, sessions, embedding, { points: [{ x, y, positive: true }] });
            ({ cols, rows, cellX, cellY, maskW } = masks);
            if (!masks.empty) {
                const plane = masks.maskW * masks.maskH;
                masks.scores.forEach((score, m) => {
                    if (score < o.minScore) return;
                    const c = candidateFrom(masks.logits.subarray(m * plane, (m + 1) * plane), masks.maskW, cols, rows, score);
                    if (c && c.stability >= o.minStability && c.candidate.area >= o.minAreaCells) kept.push(c.candidate);
                });
            }
            hooks.onProgress?.(j * n + i + 1, total);
        }
    }

    const unique = suppressDuplicates(kept, o.nmsIou);
    const { labels, order } = partition(unique, cols, rows, o.minAreaCells);
    if (o.fillGaps) order.push(...fillGaps(labels, cols, rows, o.minAreaCells, unique.length));
    const cells = cols * rows;
    const segments: EverythingSegment[] = order.map(label => ({
        polygons: outlineLabel(labels, cols, rows, label)
            .map(poly => poly.map(ring => ring.map(([x, y]) => [x * cellX, y * cellY] as [number, number]))),
        score: label < unique.length ? unique[label].score : 0,
        coverage: 0,
        kind: label < unique.length ? 'mask' : 'fill',
    }));
    const weights = order.map(() => 0);
    const index = new Map(order.map((label, i) => [label, i]));
    for (const l of labels) {
        const i = index.get(l);
        if (i !== undefined) weights[i]++;
    }
    segments.forEach((s, i) => { s.coverage = weights[i] / cells; });

    const emb = pooledEmbedding(embedding);
    const features = segmentFeatures(emb.data, emb.channels, emb.w, emb.h, labels, cols, rows, order, maskW);
    const groups = clusterFeatures(features, weights, options.k);
    return {
        result: {
            segments,
            groups,
            k: Math.min(options.k, segments.length),
            stats: {
                prompts: total,
                candidates: kept.length,
                afterNms: unique.length,
                segments: segments.length,
                filled: segments.filter(s => s.kind === 'fill').length,
            },
        },
        state: { features, weights, labels, order, cols, rows, cellX, cellY },
    };
}
