/**
 * Turning a column of values into classes.
 *
 * Everything here is pure: values in, breaks out. It knows nothing about maps,
 * colours or engines, which is what makes it testable against real data — and
 * the classification is exactly the part a visual check cannot judge.
 *
 * A note on what these methods are *for*, since choosing between them is the
 * decision the UI is really asking a student to make:
 *
 * - **equal interval** — classes of equal width. Honest about the numbers,
 *   often useless on skewed data (one class holds 95% of the features).
 * - **quantile** — equal *count* per class. Always a full-looking map, but the
 *   class widths vary wildly and neighbouring values can land either side of a
 *   break.
 * - **natural breaks** — minimises variance within each class, so the breaks
 *   fall in the gaps the data actually has. The default worth having.
 * - **standard deviation** — classes measured in σ from the mean. Only
 *   meaningful for roughly symmetric data.
 * - **geometric** — equal intervals in *ratio* rather than in width, so each
 *   class is the same multiple of the one below it. This is the answer for the
 *   skewed columns a thematic map is usually made of: population density runs
 *   0–100 for most regions and to several thousand for a city state, and every
 *   width-based method then files 90% of the map in one class.
 * - **manual** — the breaks the author chose. Every other method is a starting
 *   point for this one.
 *
 * Rounding is **not** a method but an option on all of them (`rounded`): "0–20,
 * 20–40" beats "0–19.7381" on a legend a child has to read, and that is just as
 * true of natural breaks as of equal intervals. It used to be a method of its
 * own ("pretty"), which meant asking for readable numbers also meant giving up
 * on choosing how the data was divided.
 */

export type ClassificationMethod =
    | 'equalInterval'
    | 'quantile'
    | 'naturalBreaks'
    | 'standardDeviation'
    | 'geometric'
    | 'manual';

export interface NumericClass {
    /** Inclusive lower bound. */
    min: number;
    /** Upper bound: exclusive, except in the last class where it is inclusive. */
    max: number;
    /** How many values fall in this class. */
    count: number;
}

export interface NumericClassification {
    method: ClassificationMethod;
    /** Inner break points: `classes.length - 1` of them, ascending. */
    breaks: number[];
    classes: NumericClass[];
    min: number;
    max: number;
    /** Values that were not numbers, and so are in no class. */
    missing: number;
}

export interface CategoryClass {
    value: string | number | boolean;
    count: number;
}

export interface CategoricalClassification {
    categories: CategoryClass[];
    /** Distinct values beyond the requested maximum, lumped into "other". */
    otherCount: number;
    otherValues: number;
    missing: number;
}

export interface HistogramBin {
    min: number;
    max: number;
    count: number;
}

/** Sample size above which the O(k·n²) natural-breaks solver is fed a sample. */
export const NATURAL_BREAKS_SAMPLE_LIMIT = 3000;

/**
 * Reads one field as numbers, and says how many values it could not use.
 *
 * `null`, `undefined`, `''` and anything non-numeric are counted as missing
 * rather than coerced: `Number('')` is 0, and a column of blanks would
 * otherwise classify as a mountain of zeroes. Booleans are refused for the same
 * reason the cartogram refuses them — `true` is not the number 1 here, it means
 * the wrong field was chosen.
 */
export function numericValues(
    features: readonly GeoJSON.Feature[],
    field: string,
): { values: number[]; missing: number } {
    const values: number[] = [];
    let missing = 0;
    for (const feature of features) {
        const raw = feature.properties?.[field];
        const value = typeof raw === 'number' || (typeof raw === 'string' && raw.trim() !== '') ? Number(raw) : NaN;
        if (Number.isFinite(value)) values.push(value);
        else missing++;
    }
    return { values, missing };
}

/**
 * Classifies numbers into `classCount` classes.
 *
 * Fewer distinct values than classes asked for is not an error: the result has
 * as many classes as the data can support, and the caller reports that rather
 * than drawing empty classes with identical bounds. `manual` requires
 * `options.breaks`.
 */
export function classifyNumeric(
    values: readonly number[],
    options: {
        method: ClassificationMethod;
        classCount?: number;
        breaks?: readonly number[];
        missing?: number;
        /** Snap the breaks to numbers a person would say out loud. */
        rounded?: boolean;
    },
): NumericClassification {
    const sorted = [...values].filter(Number.isFinite).sort((a, b) => a - b);
    const missing = options.missing ?? 0;
    if (sorted.length === 0) {
        return { method: options.method, breaks: [], classes: [], min: NaN, max: NaN, missing };
    }

    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const distinct = new Set(sorted).size;
    const requested = Math.max(1, Math.floor(options.classCount ?? 5));
    // More classes than distinct values would produce classes that cannot
    // contain anything — a legend with entries no feature will ever match.
    const classCount = options.method === 'manual' ? (options.breaks?.length ?? 0) + 1 : Math.min(requested, distinct);

    const raw = options.method === 'manual'
        ? [...(options.breaks ?? [])].map(Number).filter(Number.isFinite).sort((a, b) => a - b)
        : innerBreaks(sorted, classCount, options.method, min, max);
    // Rounding applies to whatever method produced the breaks: a legend is read
    // by a person whichever way the data was divided. Manual breaks are the
    // author's own numbers and are left alone.
    const breaks = options.rounded && options.method !== 'manual' ? roundBreaks(raw, min, max) : raw;

    return {
        method: options.method,
        breaks,
        classes: countInto(sorted, breaks, min, max),
        min,
        max,
        missing,
    };
}

function innerBreaks(
    sorted: readonly number[],
    classCount: number,
    method: ClassificationMethod,
    min: number,
    max: number,
): number[] {
    if (classCount <= 1 || min === max) return [];
    switch (method) {
        case 'equalInterval':
            return equalIntervalBreaks(min, max, classCount);
        case 'geometric':
            return geometricBreaks(sorted, classCount, min, max);
        case 'quantile':
            return quantileBreaks(sorted, classCount);
        case 'standardDeviation':
            return standardDeviationBreaks(sorted, classCount);
        case 'naturalBreaks':
        default:
            return naturalBreaks(sorted, classCount);
    }
}

function equalIntervalBreaks(min: number, max: number, classCount: number): number[] {
    const step = (max - min) / classCount;
    return Array.from({ length: classCount - 1 }, (_, i) => min + step * (i + 1));
}

/**
 * Equal intervals in *ratio*: each class spans the same multiple of the one
 * below it, so a column that runs 0–100 for most of its features and to several
 * thousand for a handful still divides into classes that all hold something.
 *
 * Zero and negative values have no logarithm, so the scale starts at the
 * smallest value above zero (or a hundredth of the maximum, whichever is
 * larger, so one absurdly small value cannot stretch the scale over ten
 * decades); anything at or below that lands in the opening class, which is
 * where "no people at all" belongs anyway. A column with negatives in it is not
 * a ratio scale at all, and falls back to equal intervals rather than pretending.
 */
function geometricBreaks(sorted: readonly number[], classCount: number, min: number, max: number): number[] {
    if (min < 0 || max <= 0) return equalIntervalBreaks(min, max, classCount);
    const smallestPositive = sorted.find((value) => value > 0) ?? max;
    const start = Math.max(smallestPositive, max / 100);
    if (start >= max) return equalIntervalBreaks(min, max, classCount);

    const ratio = (max / start) ** (1 / classCount);
    const breaks: number[] = [];
    for (let i = 1; i < classCount; i++) {
        breaks.push(start * ratio ** i);
    }
    return dedupe(breaks.map((value) => Number(value.toFixed(6)))).filter((value) => value > min && value < max);
}

/**
 * The breaks, snapped to numbers a person would say out loud — 1, 2, 2.5 or 5
 * times a power of ten, the same family of steps an axis uses.
 *
 * Each break is rounded on its own scale rather than to one shared step, since
 * the methods worth rounding produce unevenly spaced breaks: rounding 30, 82,
 * 106, 216 to a single step of 50 would throw away what quantile just worked
 * out. A break that rounds onto its neighbour, or out of the data's range, is
 * dropped — an empty class is a worse legend than an unrounded number.
 */
function roundBreaks(breaks: readonly number[], min: number, max: number): number[] {
    const edges = [min, ...breaks, max];
    const snapped = breaks.map((value, index) => {
        if (!Number.isFinite(value) || value === 0) return value;
        // Rounded on the scale of the break itself — 108 to 100, 1711 to 1500 —
        // not on the scale of the gap beside it. A gap-sized step is what a
        // ruler uses, and it is far too coarse where the breaks are unevenly
        // spaced: on geometric intervals it moved the first break by most of
        // its own value and rounded the second onto it, which is one class
        // fewer than the student asked for.
        const magnitude = 10 ** Math.floor(Math.log10(Math.abs(value)));
        const gap = Math.min(value - edges[index], edges[index + 2] - value);
        // Never round by more than the room the break has: a fine step keeps
        // tightly packed breaks apart, a coarse one reads better.
        const step = gap > 0 && magnitude / 2 > gap ? magnitude / 10 : magnitude / 2;
        return round(Math.round(value / step) * step, step);
    });
    return dedupe(snapped).filter((value) => value > min && value < max);
}

/** Guards against 0.30000000000000004 appearing on a legend. */
function round(value: number, step: number): number {
    const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
    return Number(value.toFixed(Math.min(12, decimals)));
}

function quantileBreaks(sorted: readonly number[], classCount: number): number[] {
    const breaks: number[] = [];
    for (let i = 1; i < classCount; i++) {
        const position = (sorted.length * i) / classCount;
        const lower = Math.floor(position);
        // Interpolating between the two neighbouring values (rather than taking
        // one of them) keeps the break off an actual data value, so a run of
        // identical values does not land half on each side of it.
        const value = position === lower
            ? (sorted[lower - 1] + sorted[lower]) / 2
            : sorted[Math.min(lower, sorted.length - 1)];
        breaks.push(value);
    }
    // Repeated values (a column where half the features share one number)
    // produce repeated breaks, which would be empty classes.
    return dedupe(breaks);
}

function standardDeviationBreaks(sorted: readonly number[], classCount: number): number[] {
    const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
    const variance = sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0) / sorted.length;
    const sd = Math.sqrt(variance);
    if (sd === 0) return [];

    // Classes are centred on the mean: an even count puts a break exactly on it,
    // an odd count gives the mean a class of its own straddling ±0.5σ.
    const breaks: number[] = [];
    for (let i = 1; i < classCount; i++) {
        breaks.push(mean + (i - classCount / 2) * sd);
    }
    // A break outside the data would open or close with an empty class.
    return dedupe(breaks.map((value) => Number(value.toFixed(12))))
        .filter((value) => value > sorted[0] && value < sorted[sorted.length - 1]);
}

/**
 * Natural breaks: Ckmeans 1-D clustering (Wang & Song 2011), which finds the
 * partition that minimises within-class variance **exactly**, unlike the
 * iterative Jenks–Fisher approximation usually shipped under this name.
 *
 * The dynamic program is O(k·n²) in time and O(k·n) in memory, so a big layer is
 * sampled first (evenly, not randomly, so the sample keeps the distribution's
 * shape and the result is reproducible). At the class counts a map uses — under
 * ten — the breaks from a 3000-point sample and from the full column agree to
 * well inside a legend's rounding.
 */
export function naturalBreaks(sorted: readonly number[], classCount: number): number[] {
    const sample = sorted.length > NATURAL_BREAKS_SAMPLE_LIMIT ? evenSample(sorted, NATURAL_BREAKS_SAMPLE_LIMIT) : sorted;
    const n = sample.length;
    const k = Math.min(classCount, new Set(sample).size);
    if (k <= 1) return [];

    // cost[j][i] = smallest total within-class sum of squares for the first i+1
    // values split into j+1 classes; split[j][i] = where that last class starts.
    const cost: Float64Array[] = [];
    const split: Int32Array[] = [];
    for (let j = 0; j < k; j++) {
        cost.push(new Float64Array(n).fill(Infinity));
        split.push(new Int32Array(n));
    }

    const prefix = new Float64Array(n + 1);
    const prefixSq = new Float64Array(n + 1);
    for (let i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] + sample[i];
        prefixSq[i + 1] = prefixSq[i] + sample[i] * sample[i];
    }
    /** Within-class sum of squares for sample[from..to], in constant time. */
    const ssq = (from: number, to: number): number => {
        const count = to - from + 1;
        const sum = prefix[to + 1] - prefix[from];
        return Math.max(0, prefixSq[to + 1] - prefixSq[from] - (sum * sum) / count);
    };

    for (let i = 0; i < n; i++) cost[0][i] = ssq(0, i);
    for (let j = 1; j < k; j++) {
        for (let i = j; i < n; i++) {
            let best = Infinity;
            let bestStart = j;
            for (let start = j; start <= i; start++) {
                const candidate = cost[j - 1][start - 1] + ssq(start, i);
                if (candidate < best) {
                    best = candidate;
                    bestStart = start;
                }
            }
            cost[j][i] = best;
            split[j][i] = bestStart;
        }
    }

    const breaks: number[] = [];
    let end = n - 1;
    for (let j = k - 1; j > 0; j--) {
        const start = split[j][end];
        // The break sits between the last value of one class and the first of
        // the next, so no value is ambiguous about which class it is in.
        breaks.unshift((sample[start - 1] + sample[start]) / 2);
        end = start - 1;
    }
    return dedupe(breaks);
}

/** Keeps the distribution's shape, unlike taking the first N values. */
function evenSample(sorted: readonly number[], size: number): number[] {
    const step = (sorted.length - 1) / (size - 1);
    return Array.from({ length: size }, (_, i) => sorted[Math.round(i * step)]);
}

function dedupe(values: readonly number[]): number[] {
    return [...new Set(values)].sort((a, b) => a - b);
}

function countInto(sorted: readonly number[], breaks: readonly number[], min: number, max: number): NumericClass[] {
    const bounds = [min, ...breaks, max];
    const classes: NumericClass[] = [];
    for (let i = 0; i < bounds.length - 1; i++) {
        classes.push({ min: bounds[i], max: bounds[i + 1], count: 0 });
    }
    if (classes.length === 0) return classes;
    for (const value of sorted) {
        // The last class owns its upper bound; every other is [min, max).
        let index = classes.findIndex((cls) => value >= cls.min && value < cls.max);
        if (index === -1) index = classes.length - 1;
        classes[index].count++;
    }
    return classes;
}

/**
 * Distinct values of a field, most frequent first, with everything past
 * `maxCategories` reported as "other" rather than silently dropped.
 *
 * Most frequent first because a legend of forty categories is read from the top
 * and abandoned; the ones that cover the map should be the ones that are seen.
 */
export function classifyCategorical(
    features: readonly GeoJSON.Feature[],
    field: string,
    options: { maxCategories?: number } = {},
): CategoricalClassification {
    const max = Math.max(1, Math.floor(options.maxCategories ?? 12));
    const counts = new Map<string, { value: string | number | boolean; count: number }>();
    let missing = 0;

    for (const feature of features) {
        const raw = feature.properties?.[field];
        if (raw === null || raw === undefined || raw === '') {
            missing++;
            continue;
        }
        if (typeof raw === 'object') {
            // A nested value has no sensible legend entry, and JSON.stringify
            // would make one that nothing can match.
            missing++;
            continue;
        }
        const key = String(raw);
        const entry = counts.get(key);
        if (entry) entry.count++;
        else counts.set(key, { value: raw as string | number | boolean, count: 1 });
    }

    const sorted = [...counts.values()].sort((a, b) =>
        b.count - a.count || String(a.value).localeCompare(String(b.value)));
    const categories = sorted.slice(0, max);
    const rest = sorted.slice(max);

    return {
        categories,
        otherCount: rest.reduce((sum, entry) => sum + entry.count, 0),
        otherValues: rest.length,
        missing,
    };
}

/**
 * Equal-width bins for the histogram that shows what a classification did.
 *
 * The histogram is the widget that teaches: breaks drawn over it show at a
 * glance why quantile and natural breaks disagree on skewed data.
 */
export function histogram(values: readonly number[], binCount = 30): HistogramBin[] {
    const usable = values.filter(Number.isFinite);
    if (usable.length === 0) return [];
    const min = Math.min(...usable);
    const max = Math.max(...usable);
    const bins = Math.max(1, Math.floor(binCount));
    if (min === max) return [{ min, max, count: usable.length }];

    const width = (max - min) / bins;
    const result: HistogramBin[] = Array.from({ length: bins }, (_, i) => ({
        min: min + width * i,
        max: min + width * (i + 1),
        count: 0,
    }));
    for (const value of usable) {
        const index = Math.min(bins - 1, Math.floor((value - min) / width));
        result[index].count++;
    }
    return result;
}

/**
 * Whether a diverging scheme is the sensible default: the data crosses zero, so
 * there is a meaningful middle for the neutral colour to sit on.
 */
export function suggestSchemeType(classification: NumericClassification): 'seq' | 'div' {
    return classification.min < 0 && classification.max > 0 ? 'div' : 'seq';
}
