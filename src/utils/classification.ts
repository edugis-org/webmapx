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
 * **Breaks are tidied only where that changes nothing** (`tidyBreaks`). "10 –
 * 15" beats "9.7 – 14.94" to a child reading it, and the two are the same
 * classification as long as no value lies between the old break and the new
 * one — so a break is moved only inside the empty gap it already sits in, and
 * left alone when that gap holds no tidier number. Snapping to a round number
 * regardless of the data is what this replaced: measured on building years it
 * put the breaks on century boundaries, so nine classes came back as five, each
 * holding a century however the years were really distributed.
 *
 * What is left untidy after that is the legend's to *display* well, not this
 * module's to move: the legend prints the breaks it is given, to as many digits
 * as it takes to keep neighbours apart.
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
    // Tidied, but only within the gap each break sits in — the author's own
    // numbers are left exactly as they are.
    const breaks = options.method === 'manual' ? raw : tidyBreaks(sorted, raw);

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
 * The same division of the data, written in numbers a person would say.
 *
 * "9.7 – 14.94" is ugly where "10 – 15" would do, and the two are the *same
 * classification* as long as no value lies between the old break and the new
 * one. That is the whole rule here, and it is what makes this safe where
 * snapping to a round number was not: a break is moved only inside the gap it
 * already sits in — above the largest value below it, and no higher than the
 * smallest value at or above it — so every feature stays in the class the
 * method put it in. Nothing is moved when the gap holds no tidier number.
 *
 * (Earlier this rounded to the scale of the break itself, regardless of the
 * data. Measured on building years that put the breaks on century boundaries:
 * nine classes came back as five, each holding a century however the years were
 * really distributed.)
 *
 * The gap is bounded by *data*, not by the neighbouring breaks, so a tidier
 * number cannot cross a neighbour: it would have to pass every value between
 * them first.
 *
 * One caveat, and it belongs to the sample rather than to this function: on a
 * viewport-limited source the gap is only empty in the data the map has drawn.
 * A feature off-screen with a value between 9.7 and 10 would have been on the
 * other side of the tidied break — the same sampling caveat that governs the
 * breaks themselves.
 */
export function tidyBreaks(sorted: readonly number[], breaks: readonly number[]): number[] {
    if (sorted.length === 0) return [...breaks];
    const edges = [sorted[0], ...breaks, sorted[sorted.length - 1]];
    const finest = dataPrecision(sorted);
    return breaks.map((value, index) => {
        if (!Number.isFinite(value)) return value;
        // Two limits, and both are needed. The gap is what keeps the
        // classification identical; the fraction of the class width is what
        // keeps the break *representative* — 25 sitting in an empty stretch
        // could legally become 50, which is a break on top of its neighbour and
        // equal intervals that are no longer equal.
        const room = MAX_TIDY_SHIFT * Math.min(value - edges[index], edges[index + 2] - value);
        const low = Math.max(largestBelow(sorted, value) ?? -Infinity, value - room);
        const high = Math.min(smallestAtOrAbove(sorted, value) ?? Infinity, value + room);
        // Open below, closed above: a break equal to a value keeps that value
        // in the upper class, which is how `countInto` reads it.
        return tidiestWithin(low, high, value, finest);
    });
}

/**
 * The smallest step the data itself is written in — 1 for whole numbers, 0.01
 * for two decimals, and so on.
 *
 * This is the only thing here that knows anything about what the numbers *are*,
 * and it knows it by measuring rather than by guessing: nothing in a column of
 * numbers says whether they are years, metres, degrees or euros, but a column
 * whose every value is whole cannot contain 1722.5, so a break there is written
 * in a precision the data does not have. Capped at six decimals, past which the
 * distinction stops meaning anything.
 */
function dataPrecision(sorted: readonly number[]): number {
    for (let decimals = 0; decimals < 6; decimals++) {
        const step = 10 ** -decimals;
        if (sorted.every((value) => Math.abs(value / step - Math.round(value / step)) < 1e-9)) {
            return step;
        }
    }
    return 10 ** -6;
}

/**
 * How far a break may be moved, as a fraction of the room between it and its
 * neighbours. Small on purpose: this is a nicer spelling of the same break, not
 * a second opinion about where it belongs.
 */
const MAX_TIDY_SHIFT = 0.25;

/** The tidiest multiple of a power-of-ten step in `(low, high]`, or `value` if none is. */
function tidiestWithin(low: number, high: number, value: number, finest: number): number {
    if (!(high > low)) return value;
    // Coarsest first — 100 beats 50 beats 25 beats 10 — because the coarser
    // number is the one a reader takes in at a glance. Starting above the
    // break's own magnitude costs nothing, since no multiple of it can land
    // inside the window, and the search stops at the precision the data is
    // written in.
    const start = Math.ceil(Math.log10(Math.max(Math.abs(value), high - low))) + 1;
    const stop = Math.floor(Math.log10(finest));
    for (let exponent = start; exponent >= stop; exponent--) {
        const decade = 10 ** exponent;
        for (const multiple of [1, 0.5, 0.25]) {
            const step = decade * multiple;
            const candidate = round(Math.round(value / step) * step, step);
            // Written in the precision the data is written in. A step of 2.5 is
            // coarser than 1, so it is tried first, and on a column of whole
            // numbers it offers 1722.5 where 1723 was available — a number that
            // column cannot hold. The test belongs on the candidate, not on the
            // step: it is the *result* that has to be a value the data could
            // have had. This is the only thing here that needs to know anything
            // about the numbers, and it measures rather than assumes.
            if (Math.abs(candidate / finest - Math.round(candidate / finest)) > 1e-9) continue;
            if (candidate > low && candidate <= high) return candidate;
        }
    }
    return value;
}

/** Guards against 0.30000000000000004 appearing on a legend. */
function round(value: number, step: number): number {
    const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
    return Number(value.toFixed(Math.min(12, decimals)));
}

function largestBelow(sorted: readonly number[], value: number): number | null {
    let low = 0;
    let high = sorted.length;
    while (low < high) {
        const mid = (low + high) >> 1;
        if (sorted[mid] < value) low = mid + 1;
        else high = mid;
    }
    return low > 0 ? sorted[low - 1] : null;
}

function smallestAtOrAbove(sorted: readonly number[], value: number): number | null {
    let low = 0;
    let high = sorted.length;
    while (low < high) {
        const mid = (low + high) >> 1;
        if (sorted[mid] < value) low = mid + 1;
        else high = mid;
    }
    return low < sorted.length ? sorted[low] : null;
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
