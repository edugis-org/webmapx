// src/utils/value-shape.ts
//
// What a column's values look like, measured rather than guessed from its name:
// how skewed they are, a log transform that does not depend on the unit, and
// whether they are really an area measurement in disguise.

/** Sample skewness (Fisher–Pearson); 0 for fewer than three values or no spread. */
export function skewness(values: readonly number[]): number {
    const finite = values.filter(Number.isFinite);
    const n = finite.length;
    if (n < 3) return 0;
    const mean = finite.reduce((a, b) => a + b, 0) / n;
    let m2 = 0;
    let m3 = 0;
    for (const v of finite) {
        const d = v - mean;
        m2 += d * d;
        m3 += d * d * d;
    }
    m2 /= n;
    m3 /= n;
    return m2 > 0 ? m3 / m2 ** 1.5 : 0;
}

/**
 * Above this skewness a log scale is suggested. Population, address or tulip
 * counts per area routinely reach 5–20; a symmetric column sits near 0.
 */
export const SKEWED = 2;

/** Whether a log scale is possible and would help: no negatives, and strongly right-skewed. */
export function suggestsLog(values: readonly number[]): boolean {
    const finite = values.filter(Number.isFinite);
    if (finite.length < 3 || finite.some(v => v < 0)) return false;
    return skewness(finite) > SKEWED;
}

/**
 * `log(x + c)` with `c` half the smallest positive value.
 *
 * A fixed `log(1 + x)` depends on the unit: it is nearly linear for densities
 * of 0.003 and nearly logarithmic for 4000, so the same data in other units
 * would give other clusters. Tying `c` to the data keeps zeros finite and makes
 * the transform the same whatever the unit. Negative or missing values become NaN.
 */
export function logTransform(values: readonly number[]): number[] {
    let smallest = Infinity;
    for (const v of values) if (Number.isFinite(v) && v > 0 && v < smallest) smallest = v;
    const offset = Number.isFinite(smallest) ? smallest / 2 : 1;
    return values.map(v => (Number.isFinite(v) && v >= 0 ? Math.log(v + offset) : NaN));
}

/** Ranks with ties averaged, NaN kept out. */
function ranks(values: readonly number[]): number[] {
    const order = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const result = new Array<number>(values.length);
    for (let start = 0; start < order.length;) {
        let end = start;
        while (end + 1 < order.length && order[end + 1].v === order[start].v) end++;
        const rank = (start + end) / 2;
        for (let k = start; k <= end; k++) result[order[k].i] = rank;
        start = end + 1;
    }
    return result;
}

/** Spearman rank correlation over the pairs where both values are finite. */
export function spearman(a: readonly number[], b: readonly number[]): number {
    const pairs: Array<[number, number]> = [];
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (Number.isFinite(a[i]) && Number.isFinite(b[i])) pairs.push([a[i], b[i]]);
    }
    const n = pairs.length;
    if (n < 3) return 0;
    const ra = ranks(pairs.map(p => p[0]));
    const rb = ranks(pairs.map(p => p[1]));
    const mean = (n - 1) / 2;
    let num = 0;
    let da = 0;
    let db = 0;
    for (let i = 0; i < n; i++) {
        num += (ra[i] - mean) * (rb[i] - mean);
        da += (ra[i] - mean) ** 2;
        db += (rb[i] - mean) ** 2;
    }
    return da > 0 && db > 0 ? num / Math.sqrt(da * db) : 0;
}

/**
 * A rank correlation this close to 1 with the measured area means the column
 * *is* an area, in whatever unit (ha, m², acres). Correlation, not equality:
 * the measured area is an estimate from drawn geometry — simplified tiles, and
 * small polygons in a large extent worst of all — so it only has to *follow*
 * the field. Rank rather than Pearson because areas are heavily skewed and a
 * few big ones would dominate Pearson. A count of inhabitants or tulips follows
 * area far more loosely.
 */
export const AREA_CORRELATION = 0.9;

export function looksLikeArea(values: readonly number[], areas: readonly number[]): boolean {
    return spearman(values, areas) >= AREA_CORRELATION;
}
