// src/utils/spatial-autocorrelation.ts
//
// Is a column's pattern on the map clustered, random or dispersed — and where
// are the clusters? Global Moran's I answers the first per column, local
// Moran's I (LISA) the second per feature.
//
// Nothing here reads a column *name*: which neighbours a feature has comes
// from geometry, which values count comes from the values. Datasets differ in
// every way that matters — points or polygons, a clean mosaic or scattered
// shapes, exploded multipolygons, their own no-data codes — so each of those
// is detected rather than assumed.

import Flatbush from 'flatbush';

/** Row-standardised spatial weights as neighbour lists: w_ij = 1 / neighbours[i].length. */
export interface SpatialWeights {
    neighbours: number[][];
    /** How the neighbours were found, for the panel to say. */
    method: 'contiguity' | 'nearest';
}

/** Neighbours a feature without touching neighbours gets. */
const NEAREST_K = 6;

/**
 * Below this share of features with a touching neighbour, the layer is not a
 * mosaic and every feature gets nearest neighbours instead. Mixing the two
 * would compare a neighbourhood of 6 touching shapes with a neighbourhood of
 * 6 shapes miles away.
 */
const MIN_CONTIGUOUS_SHARE = 0.8;

function positionsOf(geometry: GeoJSON.Geometry | null | undefined, out: GeoJSON.Position[] = []): GeoJSON.Position[] {
    if (!geometry) return out;
    switch (geometry.type) {
        case 'Point': out.push(geometry.coordinates); break;
        case 'MultiPoint':
        case 'LineString': out.push(...geometry.coordinates); break;
        case 'MultiLineString':
        case 'Polygon': for (const part of geometry.coordinates) out.push(...part); break;
        case 'MultiPolygon': for (const polygon of geometry.coordinates) for (const ring of polygon) out.push(...ring); break;
        case 'GeometryCollection': for (const g of geometry.geometries) positionsOf(g, out); break;
    }
    return out;
}

/** Mean of a feature's coordinates: only used to find nearby features, never to measure. */
function centreOf(geometry: GeoJSON.Geometry | null | undefined): [number, number] | null {
    const positions = positionsOf(geometry);
    if (positions.length === 0) return null;
    let x = 0;
    let y = 0;
    for (const p of positions) { x += p[0]; y += p[1]; }
    return [x / positions.length, y / positions.length];
}

/**
 * Neighbours per *unit*, where a unit is one or more features.
 *
 * `groups[i]` names the unit feature i belongs to, so the parts of an exploded
 * polygon are one unit whose neighbours are the union of its parts' neighbours
 * — otherwise the parts would be each other's neighbours, and identical values
 * next to each other are exactly what Moran's I reads as clustering.
 *
 * Polygons and lines touch when they share a coordinate. That is exact for a
 * mosaic cut from one source and fails for anything else (points, separately
 * simplified borders, scattered shapes), so a unit that touches nothing gets
 * its nearest units, and a layer where most units touch nothing is switched to
 * nearest neighbours entirely.
 */
export function buildWeights(geometries: readonly (GeoJSON.Geometry | null)[], groups: readonly number[], unitCount: number): SpatialWeights {
    const touching: Set<number>[] = Array.from({ length: unitCount }, () => new Set<number>());
    const byVertex = new Map<string, number[]>();
    let polygonal = false;
    geometries.forEach((geometry, index) => {
        if (!geometry || geometry.type === 'Point' || geometry.type === 'MultiPoint') return;
        polygonal = true;
        const unit = groups[index];
        const seen = new Set<string>();
        for (const p of positionsOf(geometry)) {
            const key = `${p[0]},${p[1]}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const units = byVertex.get(key);
            if (units) { if (!units.includes(unit)) units.push(unit); } else byVertex.set(key, [unit]);
        }
    });
    for (const units of byVertex.values()) {
        if (units.length < 2) continue;
        for (const a of units) for (const b of units) if (a !== b) touching[a].add(b);
    }

    const touchingShare = touching.filter(set => set.size > 0).length / Math.max(1, unitCount);
    const contiguity = polygonal && touchingShare >= MIN_CONTIGUOUS_SHARE;

    const centres: Array<[number, number] | null> = Array.from({ length: unitCount }, () => null);
    const sums = Array.from({ length: unitCount }, () => [0, 0, 0]);
    geometries.forEach((geometry, index) => {
        const centre = centreOf(geometry);
        if (!centre) return;
        const sum = sums[groups[index]];
        sum[0] += centre[0]; sum[1] += centre[1]; sum[2]++;
    });
    sums.forEach((sum, unit) => { if (sum[2] > 0) centres[unit] = [sum[0] / sum[2], sum[1] / sum[2]]; });

    const needsNearest = touching.map(set => !contiguity || set.size === 0);
    if (needsNearest.some(Boolean)) {
        const located = centres.map((c, unit) => (c ? unit : -1)).filter(unit => unit >= 0);
        if (located.length > 1) {
            const index = new Flatbush(located.length);
            for (const unit of located) {
                const [x, y] = centres[unit]!;
                index.add(x, y, x, y);
            }
            index.finish();
            for (const unit of located) {
                if (!needsNearest[unit]) continue;
                const [x, y] = centres[unit]!;
                const found = index.neighbors(x, y, NEAREST_K + 1).map(i => located[i]).filter(other => other !== unit).slice(0, NEAREST_K);
                touching[unit] = new Set(found);
            }
        }
    }

    return { neighbours: touching.map(set => [...set]), method: contiguity ? 'contiguity' : 'nearest' };
}

/**
 * Weights restricted to the units that have a value: a unit without data is
 * nobody's neighbour, and a unit left with no neighbours takes no part.
 */
function restrict(weights: SpatialWeights, values: readonly number[]): { index: number[]; neighbours: number[][] } {
    let index: number[] = [];
    values.forEach((value, unit) => { if (Number.isFinite(value)) index.push(unit); });
    // Repeated until stable: dropping a unit with no neighbours can leave a
    // unit whose only neighbour it was with none either.
    for (;;) {
        const position = new Map(index.map((unit, i) => [unit, i]));
        const neighbours = index.map(unit => weights.neighbours[unit]
            .map(other => position.get(other))
            .filter((p): p is number => p !== undefined));
        if (neighbours.every(list => list.length > 0)) return { index, neighbours };
        index = index.filter((_, i) => neighbours[i].length > 0);
    }
}

export interface GlobalMoran {
    /** Moran's I: above the expectation is clustered, below is dispersed. */
    i: number;
    expected: number;
    z: number;
    /** Two-sided, from the normal approximation under randomisation. */
    p: number;
    /** Units that took part: a value and at least one neighbour with a value. */
    n: number;
}

/** Complementary error function (Numerical Recipes), for normal p-values. */
function erfc(x: number): number {
    const z = Math.abs(x);
    const t = 1 / (1 + 0.5 * z);
    const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418
        + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587
        + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
}

/**
 * Global Moran's I with its analytic significance under randomisation.
 *
 * Analytic rather than permuted because this runs for every column to rank
 * them, and the normal approximation is sound at the sizes worth mapping. The
 * randomisation variance (not the normality one) is used because it accounts
 * for the column's own kurtosis — rainfall and oil probabilities are rarely
 * normal.
 */
export function globalMoran(weights: SpatialWeights, values: readonly number[]): GlobalMoran | null {
    const { index, neighbours } = restrict(weights, values);
    const n = index.length;
    if (n < 4) return null;
    const x = index.map(unit => values[unit]);
    const mean = x.reduce((a, b) => a + b, 0) / n;
    const z = x.map(v => v - mean);
    const m2 = z.reduce((a, b) => a + b * b, 0);
    if (m2 === 0) return null;
    const m4 = z.reduce((a, b) => a + b ** 4, 0);

    let cross = 0;
    const inWeight = new Float64Array(n);
    const lookup = neighbours.map(list => new Set(list));
    let s1 = 0;
    for (let i = 0; i < n; i++) {
        const w = 1 / neighbours[i].length;
        let lag = 0;
        for (const j of neighbours[i]) {
            lag += z[j];
            inWeight[j] += w;
            const wji = lookup[j].has(i) ? 1 / neighbours[j].length : 0;
            // S1 sums (w_ij + w_ji)² over every ordered pair. A mutual pair is
            // reached from both ends here; a one-way pair (nearest neighbours)
            // only from i, so its reverse is added below.
            s1 += (w + wji) ** 2;
        }
        cross += z[i] * lag * w;
    }
    let oneWay = 0;
    for (let i = 0; i < n; i++) {
        for (const j of neighbours[i]) {
            if (!lookup[j].has(i)) oneWay += (1 / neighbours[i].length) ** 2;
        }
    }
    s1 = (s1 + oneWay) / 2;
    const s0 = n;
    let s2 = 0;
    for (let i = 0; i < n; i++) s2 += (1 + inWeight[i]) ** 2;

    const i = (n / s0) * (cross / m2);
    const expected = -1 / (n - 1);
    const b2 = (n * m4) / (m2 * m2);
    const variance = (n * ((n * n - 3 * n + 3) * s1 - n * s2 + 3 * s0 * s0)
        - b2 * ((n * n - n) * s1 - 2 * n * s2 + 6 * s0 * s0))
        / ((n - 1) * (n - 2) * (n - 3) * s0 * s0) - expected * expected;
    const zScore = variance > 0 ? (i - expected) / Math.sqrt(variance) : 0;
    return { i, expected, z: zScore, p: erfc(Math.abs(zScore) / Math.SQRT2), n };
}

export type LisaClass = 'high-high' | 'low-low' | 'high-low' | 'low-high' | 'not-significant' | 'no-data';

export interface LocalMoran {
    /** One class per unit, in unit order. */
    classes: LisaClass[];
    counts: Record<LisaClass, number>;
}

/**
 * Benjamini–Hochberg: which p-values stay significant at false discovery rate
 * `q`. Without it a local test at 5% calls one feature in twenty a cluster in
 * perfectly random data.
 */
export function significantAfterFdr(pValues: readonly number[], q = 0.05): boolean[] {
    const order = pValues.map((p, index) => ({ p, index })).sort((a, b) => a.p - b.p);
    const m = order.length;
    let cutoff = -1;
    order.forEach(({ p }, rank) => { if (p <= ((rank + 1) / m) * q) cutoff = rank; });
    const result = new Array<boolean>(m).fill(false);
    for (let rank = 0; rank <= cutoff; rank++) result[order[rank].index] = true;
    return result;
}

/**
 * Local Moran's I with analytic significance and FDR control.
 *
 * The expectation and variance of each I_i under randomisation (Anselin 1995)
 * give a z-score and a two-sided p-value per unit. Analytic rather than
 * permuted for a reason measured on 14 513 neighbourhoods: with 499
 * permutations the smallest possible p is 0.002, and Benjamini–Hochberg over
 * ~13 000 tests needs hundreds of units at that floor before any is
 * significant — moderately clustered columns came back with no clusters at all.
 * Analytic p-values have no floor, are deterministic, and cost nothing.
 * Strongly skewed values are what this approximation handles worst, which is
 * what the log option is for.
 */
export function localMoran(weights: SpatialWeights, values: readonly number[]): LocalMoran {
    const classes: LisaClass[] = values.map(() => 'no-data');
    const counts: Record<LisaClass, number> = { 'high-high': 0, 'low-low': 0, 'high-low': 0, 'low-high': 0, 'not-significant': 0, 'no-data': 0 };
    const { index, neighbours } = restrict(weights, values);
    const n = index.length;
    const finish = (): LocalMoran => {
        values.forEach((value, unit) => { if (Number.isFinite(value) && classes[unit] === 'no-data') classes[unit] = 'not-significant'; });
        for (const c of classes) counts[c]++;
        return { classes, counts };
    };
    if (n < 4) return finish();

    const x = index.map(unit => values[unit]);
    const mean = x.reduce((a, b) => a + b, 0) / n;
    const z = x.map(v => v - mean);
    const m2 = z.reduce((a, b) => a + b * b, 0) / n;
    if (m2 === 0) return finish();
    const m4 = z.reduce((a, b) => a + b ** 4, 0) / n;
    const b2 = m4 / (m2 * m2);

    const pValues = new Array<number>(n);
    const lags = new Array<number>(n);
    for (let i = 0; i < n; i++) {
        const k = neighbours[i].length;
        // Row-standardised: w_ij = 1/k, so w_i = 1, w_i(2) = Σ w_ij² = 1/k and
        // 2·w_i(kh) = Σ_{k≠h} w_ik·w_ih = 1 − 1/k.
        const lag = neighbours[i].reduce((sum, j) => sum + z[j], 0) / k;
        lags[i] = lag;
        const local = (z[i] / m2) * lag;
        const expected = -1 / (n - 1);
        const variance = (1 / k) * (n - b2) / (n - 1)
            + (1 - 1 / k) * (2 * b2 - n) / ((n - 1) * (n - 2))
            - expected * expected;
        const zScore = variance > 0 ? (local - expected) / Math.sqrt(variance) : 0;
        pValues[i] = erfc(Math.abs(zScore) / Math.SQRT2);
    }

    const significant = significantAfterFdr(pValues);
    for (let i = 0; i < n; i++) {
        const unit = index[i];
        if (!significant[i]) { classes[unit] = 'not-significant'; continue; }
        classes[unit] = z[i] >= 0 ? (lags[i] >= 0 ? 'high-high' : 'high-low') : (lags[i] >= 0 ? 'low-high' : 'low-low');
    }
    return finish();
}
