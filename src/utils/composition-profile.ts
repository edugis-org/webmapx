// src/utils/composition-profile.ts
//
// Area types from a composition: fields that are parts of one whole (age
// groups, origin groups, land use shares). Each feature becomes a vector of
// shares, the shares are clustered, and each cluster is described by which
// parts it has more or less of than the layer as a whole — "65+ ×1.9, 0–15 ×0.6".
//
// Shares cannot be clustered as they are: they sum to one, so one part going up
// forces another down, and distances between raw shares mostly measure that
// arithmetic. The centred log-ratio transform (Aitchison) is the standard way
// out, and it is what makes "relatively many elderly" a direction in space
// rather than a side effect of "relatively few children".

export interface CompositionTypes {
    /** Cluster index per row, or -1 for a row that could not be used. */
    assignments: number[];
    /** Mean share per part, per cluster, in field order. */
    centres: number[][];
    /** Mean share per part over all used rows. */
    overall: number[];
    /** Rows per cluster. */
    sizes: number[];
    /** Mean silhouette of the chosen clustering, on a sample: near 1 is well separated, near 0 is soup. */
    silhouette: number;
}

/** Smallest and largest number of types offered; outside this a legend stops being readable or useful. */
export const MIN_TYPES = 3;
export const MAX_TYPES = 6;
/** Silhouette is O(n²); a sample of this size is plenty to compare k. */
const SILHOUETTE_SAMPLE = 1500;

function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Rows of part values → shares, or null for a row that cannot be a composition
 * (a missing or negative part, or nothing at all). Units do not matter:
 * percentages, counts and fractions all close to the same shares.
 */
export function toShares(rows: readonly (readonly number[])[]): Array<number[] | null> {
    return rows.map(row => {
        if (row.some(v => !Number.isFinite(v) || v < 0)) return null;
        const total = row.reduce((a, b) => a + b, 0);
        return total > 0 ? row.map(v => v / total) : null;
    });
}

/**
 * Centred log-ratio of each share vector. A zero share has no logarithm, so
 * zeros are replaced by half the smallest positive share in the data and the
 * row closed again — the usual multiplicative replacement, small enough not to
 * invent a pattern.
 */
export function clr(shares: readonly (readonly number[])[]): number[][] {
    let smallest = Infinity;
    for (const row of shares) for (const v of row) if (v > 0 && v < smallest) smallest = v;
    const delta = Number.isFinite(smallest) ? smallest / 2 : 1e-6;
    return shares.map(row => {
        const replaced = row.map(v => (v > 0 ? v : delta));
        const total = replaced.reduce((a, b) => a + b, 0);
        const logs = replaced.map(v => Math.log(v / total));
        const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
        return logs.map(v => v - mean);
    });
}

function distance2(a: readonly number[], b: readonly number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
    return sum;
}

/** k-means with k-means++ seeding; deterministic for a given seed. */
export function kMeans(points: readonly (readonly number[])[], k: number, seed = 1, iterations = 50): { assignments: number[]; centres: number[][] } {
    const random = mulberry32(seed);
    const n = points.length;
    const dims = points[0]?.length ?? 0;
    const centres: number[][] = [];
    if (n === 0) return { assignments: [], centres };
    centres.push([...points[Math.floor(random() * n)]]);
    const nearest = points.map(p => distance2(p, centres[0]));
    while (centres.length < Math.min(k, n)) {
        const total = nearest.reduce((a, b) => a + b, 0);
        let target = random() * total;
        let chosen = 0;
        for (; chosen < n - 1; chosen++) {
            target -= nearest[chosen];
            if (target <= 0) break;
        }
        centres.push([...points[chosen]]);
        const added = centres[centres.length - 1];
        points.forEach((p, i) => { nearest[i] = Math.min(nearest[i], distance2(p, added)); });
    }

    const assignments = new Array<number>(n).fill(0);
    for (let iteration = 0; iteration < iterations; iteration++) {
        let changed = false;
        points.forEach((p, i) => {
            let best = 0;
            let bestDistance = Infinity;
            centres.forEach((c, j) => {
                const d = distance2(p, c);
                if (d < bestDistance) { bestDistance = d; best = j; }
            });
            if (assignments[i] !== best) { assignments[i] = best; changed = true; }
        });
        const sums = centres.map(() => new Array<number>(dims).fill(0));
        const counts = new Array<number>(centres.length).fill(0);
        points.forEach((p, i) => {
            counts[assignments[i]]++;
            for (let d = 0; d < dims; d++) sums[assignments[i]][d] += p[d];
        });
        centres.forEach((c, j) => { if (counts[j] > 0) for (let d = 0; d < dims; d++) c[d] = sums[j][d] / counts[j]; });
        if (!changed && iteration > 0) break;
    }
    return { assignments, centres };
}

/** Mean silhouette over (a sample of) the points. */
export function silhouette(points: readonly (readonly number[])[], assignments: readonly number[], k: number, seed = 2): number {
    const random = mulberry32(seed);
    const n = points.length;
    const sample = n <= SILHOUETTE_SAMPLE
        ? points.map((_, i) => i)
        : Array.from({ length: SILHOUETTE_SAMPLE }, () => Math.floor(random() * n));
    let total = 0;
    let counted = 0;
    for (const i of sample) {
        const sums = new Array<number>(k).fill(0);
        const counts = new Array<number>(k).fill(0);
        for (const j of sample) {
            if (i === j) continue;
            sums[assignments[j]] += Math.sqrt(distance2(points[i], points[j]));
            counts[assignments[j]]++;
        }
        const own = assignments[i];
        if (counts[own] === 0) continue;
        const a = sums[own] / counts[own];
        let b = Infinity;
        for (let c = 0; c < k; c++) if (c !== own && counts[c] > 0) b = Math.min(b, sums[c] / counts[c]);
        if (!Number.isFinite(b)) continue;
        total += Math.max(a, b) > 0 ? (b - a) / Math.max(a, b) : 0;
        counted++;
    }
    return counted ? total / counted : 0;
}

/**
 * Types of composition: the clustering with the best silhouette between
 * `MIN_TYPES` and `MAX_TYPES` clusters.
 */
export function compositionTypes(rows: readonly (readonly number[])[], seed = 1): CompositionTypes | null {
    const shares = toShares(rows);
    const usable = shares.map((s, i) => (s ? i : -1)).filter(i => i >= 0);
    if (usable.length < MIN_TYPES * 3) return null;
    const usedShares = usable.map(i => shares[i]!);
    const points = clr(usedShares);

    let best: { assignments: number[]; k: number; score: number } | null = null;
    for (let k = MIN_TYPES; k <= Math.min(MAX_TYPES, usable.length - 1); k++) {
        const { assignments } = kMeans(points, k, seed + k);
        const score = silhouette(points, assignments, k);
        if (!best || score > best.score) best = { assignments, k, score };
    }
    if (!best) return null;

    const parts = rows[0]?.length ?? 0;
    const centres = Array.from({ length: best.k }, () => new Array<number>(parts).fill(0));
    const sizes = new Array<number>(best.k).fill(0);
    const overall = new Array<number>(parts).fill(0);
    usedShares.forEach((row, index) => {
        const cluster = best!.assignments[index];
        sizes[cluster]++;
        row.forEach((v, d) => { centres[cluster][d] += v; overall[d] += v; });
    });
    centres.forEach((c, j) => c.forEach((_, d) => { c[d] = sizes[j] ? c[d] / sizes[j] : 0; }));
    overall.forEach((_, d) => { overall[d] /= usedShares.length; });

    // Largest type first, so "A" is the common case and the legend reads top-down.
    const order = sizes.map((size, j) => ({ size, j })).sort((a, b) => b.size - a.size).map(entry => entry.j);
    const renumber = new Map(order.map((j, rank) => [j, rank]));
    const assignments = new Array<number>(rows.length).fill(-1);
    usable.forEach((rowIndex, index) => { assignments[rowIndex] = renumber.get(best!.assignments[index])!; });
    return {
        assignments,
        centres: order.map(j => centres[j]),
        sizes: order.map(j => sizes[j]),
        overall,
        silhouette: best.score,
    };
}

/**
 * The words for a type: parts it has clearly more (and less) of than the layer
 * as a whole, as ratios. Parts within 15% of average are left out — a label
 * listing every part says nothing.
 */
export function describeType(centre: readonly number[], overall: readonly number[], names: readonly string[], maxParts = 2): string {
    const ratios = centre.map((v, d) => ({ name: names[d], ratio: overall[d] > 0 ? v / overall[d] : 1 }));
    const over = ratios.filter(r => r.ratio >= 1.15).sort((a, b) => b.ratio - a.ratio).slice(0, maxParts);
    const under = ratios.filter(r => r.ratio <= 1 / 1.15).sort((a, b) => a.ratio - b.ratio).slice(0, 1);
    const words = [...over, ...under].map(r => `${r.name} ×${r.ratio.toFixed(1)}`);
    return words.length ? words.join(', ') : 'close to average';
}

/**
 * Field names without what they all share, for labels only: `percentage_personen_0_tot_15_jaar`
 * and its siblings read as `0_tot_15_jaar`. Nothing is computed from names.
 */
export function shortPartNames(names: readonly string[]): string[] {
    if (names.length < 2) return [...names];
    let prefix = names[0];
    for (const name of names) while (!name.startsWith(prefix)) prefix = prefix.slice(0, -1);
    // Cut at a separator so a shared first letter of the distinct part survives.
    const cut = Math.max(prefix.lastIndexOf('_'), prefix.lastIndexOf(' '), prefix.lastIndexOf('-')) + 1;
    return names.map(name => name.slice(cut) || name);
}
