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

test('pretty breaks are numbers a person would say out loud', () => {
    const result = classifyNumeric([0, 37, 61, 94, 98.7], { method: 'pretty', classCount: 5 });
    for (const value of result.breaks) {
        assert.equal(value, Number(value.toFixed(6)), `${value} is not a tidy number`);
    }
    assert.deepEqual(result.breaks, [20, 40, 60, 80]);
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
