/**
 * Classification: values in, breaks out.
 *
 * The assertions are about *where the breaks land*, because that is what a
 * visual check cannot judge — two classifications of the same column look
 * equally plausible on a map and put different countries in different classes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    classifyCategorical,
    classifyNumeric,
    histogram,
    naturalBreaks,
    numericValues,
    suggestSchemeType,
    roundBreaks,
    tidyBreaks,
} from '../src/utils/classification';

const feature = (properties: GeoJSON.GeoJsonProperties): GeoJSON.Feature =>
    ({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: [0, 0] } });

test('numericValues counts what it cannot use rather than coercing it', () => {
    const { values, missing } = numericValues([
        feature({ v: 5 }),
        feature({ v: '7' }),
        feature({ v: 0 }),
        feature({ v: '' }),
        feature({ v: null }),
        feature({ v: 'many' }),
        feature({}),
        feature({ v: true }),
    ], 'v');

    // 0 is a value; '' and true are not. Number('') is 0 and Number(true) is 1,
    // which is exactly the coercion that would turn a column of blanks into a
    // mountain of zeroes.
    assert.deepEqual(values, [5, 7, 0]);
    assert.equal(missing, 5);
});

test('equal interval divides the range, not the features', () => {
    const result = classifyNumeric([0, 1, 2, 3, 90, 100], { method: 'equalInterval', classCount: 4 });
    assert.deepEqual(result.breaks, [25, 50, 75]);
    assert.deepEqual(result.classes.map(c => c.count), [4, 0, 0, 2]);
});

test('quantile divides the features, not the range', () => {
    const result = classifyNumeric([1, 2, 3, 4, 5, 6, 7, 8], { method: 'quantile', classCount: 4 });
    assert.deepEqual(result.classes.map(c => c.count), [2, 2, 2, 2]);
});

test('quantile does not emit a break twice when values repeat', () => {
    // Half the column is the same number: naive quantiles put a break on it more
    // than once, which would be classes that cannot contain anything.
    const values = [...Array(10).fill(5), 1, 2, 3, 8, 9];
    const result = classifyNumeric(values, { method: 'quantile', classCount: 5 });
    assert.equal(new Set(result.breaks).size, result.breaks.length);
    assert.equal(result.classes.length, result.breaks.length + 1);
});

test('natural breaks land in the gaps the data has', () => {
    // Three obvious clusters. Any method that ignores the distribution (equal
    // interval, quantile) splits them differently.
    const values = [1, 2, 3, 50, 51, 52, 100, 101, 102];
    const result = classifyNumeric(values, { method: 'naturalBreaks', classCount: 3 });

    assert.equal(result.classes.length, 3);
    assert.deepEqual(result.classes.map(c => c.count), [3, 3, 3]);
    assert.ok(result.breaks[0] > 3 && result.breaks[0] < 50, `first break ${result.breaks[0]}`);
    assert.ok(result.breaks[1] > 52 && result.breaks[1] < 100, `second break ${result.breaks[1]}`);
});

test('natural breaks find the optimal split, not a plausible one', () => {
    // Ckmeans is exact, so this is checkable: for these values the split that
    // minimises within-class variance is {1,2,3} | {8,9,10}, total 4. A greedy
    // or iterative solver can settle on {1,2} | {3,8,9,10}, total 30.5.
    const values = [1, 2, 3, 8, 9, 10];
    const breaks = naturalBreaks(values, 2);
    assert.equal(breaks.length, 1);
    assert.ok(breaks[0] > 3 && breaks[0] < 8, `break at ${breaks[0]}`);
});

test('natural breaks on a big column agree with the full solve', () => {
    // Sampling keeps the shape: a lognormal-ish column of 20 000 values, whose
    // breaks must not move meaningfully compared with 3000 of them.
    let seed = 42;
    const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    const values = Array.from({ length: 20000 }, () => Math.exp(random() * 6));
    const sorted = [...values].sort((a, b) => a - b);

    const sampled = naturalBreaks(sorted, 5);
    const full = naturalBreaks(sorted.filter((_, i) => i % 10 === 0), 5);

    assert.equal(sampled.length, 4);
    for (let i = 0; i < sampled.length; i++) {
        const relative = Math.abs(sampled[i] - full[i]) / full[i];
        assert.ok(relative < 0.1, `break ${i}: ${sampled[i]} vs ${full[i]}`);
    }
});

test('breaks are tidied only where no feature changes class', () => {
    // "10 – 15" beats "9.7 – 14.94" on a legend, and the two are the same
    // classification exactly when no value lies between the old break and the
    // new one. So the tidying is judged by the partition, not by the numbers.
    const partition = (values: readonly number[], breaks: readonly number[]): number[] =>
        values.map((value) => breaks.filter((edge) => value >= edge).length);

    const values = Array.from({ length: 400 }, (_, i) => Math.round(Math.sin(i) * 5000 + 5000) / 7);
    const sorted = [...values].sort((a, b) => a - b);
    for (const method of ['quantile', 'naturalBreaks', 'equalInterval', 'geometric', 'standardDeviation'] as const) {
        const result = classifyNumeric(values, { method, classCount: 7 });
        const untidied = result.breaks.map((value) => value + 0);
        assert.deepEqual(
            partition(values, tidyBreaks(sorted, untidied)),
            partition(values, untidied),
            `${method} moved a feature between classes`,
        );
    }
});

test('a break with room to move lands on a number a person would say', () => {
    // Room is the empty gap in the data *and* a quarter of the way to the
    // neighbouring break: 14.94 becomes 15, and 6.5 becomes 7 rather than
    // wandering off to 10, which the gap alone would have allowed.
    const sorted = [1, 2, 3, 4, 5, 6, 11, 12, 13, 16, 18, 20, 24, 30, 44];
    assert.deepEqual(tidyBreaks(sorted, [6.5, 14.94]), [7, 15]);
});

test('a break with no room is left exactly where the method put it', () => {
    // 9.7 is hemmed in by 9.6 and 9.8: every tidier number is on the far side
    // of a feature, so moving there would move that feature too.
    const sorted = [9.6, 9.8, 20, 30];
    assert.deepEqual(tidyBreaks(sorted, [9.7]), [9.7]);
});

test('tidying never crosses a neighbouring break', () => {
    // It cannot: the gap is bounded by data, and a neighbour has data between
    // it and this break, or it would not be a separate class.
    const sorted = [1, 2, 3, 10, 11, 12, 30, 31, 32];
    const tidied = tidyBreaks(sorted, [6, 21]);
    assert.ok(tidied[0] < tidied[1], JSON.stringify(tidied));
    assert.deepEqual(tidied, [5, 20]);
});

test("the author's own breaks are never tidied", () => {
    const result = classifyNumeric([1, 5, 9, 14, 22], { method: 'manual', breaks: [4.7, 13.2] });
    assert.deepEqual(result.breaks, [4.7, 13.2]);
});

/**
 * Real numbers from the demo's "Population density | Countries" layer: a median
 * of 99 and a maximum of 4298. Width-based methods put nearly every country in
 * the first class, and so does natural breaks, which gives the outliers classes
 * of their own. Geometric intervals are the ones that survive that shape.
 */
test('geometric intervals spread a long-tailed column that defeats the others', () => {
    const values = [
        0, 2, 3, 3, 4, 8, 9, 14, 16, 18, 21, 23, 25, 30, 33, 36, 40, 44, 52, 57,
        63, 68, 72, 77, 82, 88, 94, 99, 104, 110, 115, 120, 128, 135, 143, 150,
        160, 172, 185, 199, 216, 235, 260, 290, 330, 380, 429, 520, 660, 900,
        1300, 2100, 4298,
    ];
    const crowded = (method: 'naturalBreaks' | 'equalInterval' | 'geometric') => {
        const result = classifyNumeric(values, { method, classCount: 5 });
        const total = result.classes.reduce((sum, entry) => sum + entry.count, 0);
        return Math.max(...result.classes.map((entry) => entry.count)) / total;
    };
    assert.ok(crowded('naturalBreaks') > 0.75, `natural breaks: ${crowded('naturalBreaks')}`);
    assert.ok(crowded('equalInterval') > 0.75, `equal intervals: ${crowded('equalInterval')}`);
    assert.ok(crowded('geometric') < 0.6, `geometric: ${crowded('geometric')}`);
    // The point is not just a smaller biggest class but that every class is on
    // the map: equal intervals leave one empty here.
    const geometric = classifyNumeric(values, { method: 'geometric', classCount: 5 });
    assert.ok(geometric.classes.every((entry) => entry.count > 0), JSON.stringify(geometric.classes));
});

test('geometric intervals fall back rather than take the log of a negative', () => {
    const withNegatives = classifyNumeric([-40, -10, 0, 5, 60], { method: 'geometric', classCount: 4 });
    assert.equal(withNegatives.breaks.length, 3);
    assert.ok(withNegatives.breaks.every(Number.isFinite), `${withNegatives.breaks}`);
    // Zeros are not a reason to fall back: they belong in the opening class.
    const withZeros = classifyNumeric([0, 0, 1, 10, 100, 1000], { method: 'geometric', classCount: 4 });
    assert.ok(withZeros.breaks.every((value) => value > 0), `${withZeros.breaks}`);
    assert.equal(withZeros.classes[0].min, 0);
});

test('standard deviation classes are centred on the mean', () => {
    const values = [10, 20, 30, 40, 50, 60, 70, 80, 90];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const result = classifyNumeric(values, { method: 'standardDeviation', classCount: 4 });
    // An even class count puts a break exactly on the mean.
    assert.ok(result.breaks.some(brk => Math.abs(brk - mean) < 1e-9), `breaks ${result.breaks}`);
});

test('manual breaks are used exactly as given, sorted', () => {
    const result = classifyNumeric([1, 5, 12, 40], { method: 'manual', breaks: [10, 3] });
    assert.deepEqual(result.breaks, [3, 10]);
    assert.deepEqual(result.classes.map(c => c.count), [1, 1, 2]);
});

test('asking for more classes than the data has distinct values gives fewer', () => {
    // Otherwise the legend lists entries no feature can ever match.
    const result = classifyNumeric([1, 1, 1, 2, 2], { method: 'naturalBreaks', classCount: 7 });
    assert.equal(result.classes.length, 2);
    assert.ok(result.classes.every(c => c.count > 0));
});

test('every value lands in exactly one class, the last one owning its top end', () => {
    const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = classifyNumeric(values, { method: 'equalInterval', classCount: 4 });
    assert.equal(result.classes.reduce((sum, c) => sum + c.count, 0), values.length);
    assert.equal(result.classes[result.classes.length - 1].max, 10);
});

test('an empty column classifies to nothing rather than throwing', () => {
    const result = classifyNumeric([], { method: 'naturalBreaks', classCount: 5, missing: 12 });
    assert.deepEqual(result.classes, []);
    assert.equal(result.missing, 12);
});

test('categories come back most frequent first, with the rest counted', () => {
    const features = [
        ...Array(5).fill(0).map(() => feature({ kind: 'a' })),
        ...Array(3).fill(0).map(() => feature({ kind: 'b' })),
        feature({ kind: 'c' }),
        feature({ kind: 'd' }),
        feature({ kind: null }),
    ];
    const result = classifyCategorical(features, 'kind', { maxCategories: 2 });

    assert.deepEqual(result.categories, [{ value: 'a', count: 5 }, { value: 'b', count: 3 }]);
    assert.equal(result.otherValues, 2);
    assert.equal(result.otherCount, 2);
    assert.equal(result.missing, 1);
});

test('a diverging scheme is suggested only when the data crosses zero', () => {
    assert.equal(suggestSchemeType(classifyNumeric([-5, 0, 8], { method: 'equalInterval', classCount: 3 })), 'div');
    assert.equal(suggestSchemeType(classifyNumeric([1, 5, 8], { method: 'equalInterval', classCount: 3 })), 'seq');
});

test('the histogram covers every value and nothing else', () => {
    const values = [1, 1, 2, 3, 5, 8, 13];
    const bins = histogram(values, 4);
    assert.equal(bins.length, 4);
    assert.equal(bins.reduce((sum, bin) => sum + bin.count, 0), values.length);
    assert.equal(bins[0].min, 1);
    assert.equal(bins[bins.length - 1].max, 13);
});

test('a tidied break is written in the precision the data is written in', () => {
    // Nothing in a column says whether it holds years, metres or euros, but a
    // column of whole numbers cannot contain 1722.5 — so a break there is
    // written in a precision the data does not have. Measured, not assumed:
    // the same rule leaves a column of cents free to land on 14.9.
    assert.deepEqual(tidyBreaks([1650, 1700, 1722, 1723, 1740, 1757], [1722.5]), [1723]);
    assert.deepEqual(tidyBreaks([1.05, 2.25, 9.7, 14.94, 22.5], [9.72]), [10]);
    // Thousandths in the data, so a break may be written in thousandths too.
    assert.deepEqual(tidyBreaks([1.05, 2.255, 9.7, 14.94, 30, 40], [9.996]), [10]);
});

test('rounded breaks read like a legend when only a few features change class', () => {
    // A dense column: every integer from 1 to 600 once, so no break has an
    // empty gap to move through and tidyBreaks leaves them all alone.
    const sorted = Array.from({ length: 600 }, (_, i) => i + 1);
    const breaks = [24, 62, 128, 351];
    assert.deepEqual(tidyBreaks(sorted, breaks), breaks);
    assert.deepEqual(roundBreaks(sorted, breaks), [25, 60, 125, 350]);
});

test('a rounded break stays put when it would move too many features', () => {
    // 40 values packed at 24.5, just above the break: 25 is rounder but would
    // carry all of them into the lower class, far more than a tenth of either
    // class. A rounder number *below* them moves nothing and is fine.
    const sorted = [...Array.from({ length: 20 }, (_, i) => i), ...Array.from({ length: 40 }, () => 24.5), ...Array.from({ length: 20 }, (_, i) => 30 + i)];
    const [rounded] = roundBreaks(sorted, [24.2]);
    assert.ok(rounded <= 24.5 && rounded > 19, `break ${rounded} moved the cluster at 24.5`);
});

test('rounded breaks stay in order and inside the data', () => {
    const sorted = Array.from({ length: 1000 }, (_, i) => (i * i) / 100);
    const result = roundBreaks(sorted, [3.1, 17.9, 91.4, 402.7]);
    for (let i = 1; i < result.length; i++) assert.ok(result[i] > result[i - 1]);
    assert.ok(result[0] > sorted[0] && result[result.length - 1] < sorted[sorted.length - 1]);
});
