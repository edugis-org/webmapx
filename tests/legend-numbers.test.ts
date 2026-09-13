/**
 * The legend's own rounding — the only rounding there is.
 *
 * `classification.ts` deliberately hands over the breaks it divided the data
 * with, however untidy, because moving a break moves features between classes.
 * Everything readable about the numbers therefore has to happen here, and the
 * failure it exists to prevent is a legend that prints two different breaks as
 * the same number.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { decimalsToDistinguish, formatLegendNumber, legendNumberFormatter } from '../src/utils/legend-numbers';

test('a four-digit number is printed in full, with no separator', () => {
    // A suffix keeps one or two significant digits: 1723 and 1985 both come
    // out as "2K", so two classes claim the same bounds. The separator is left
    // off four-digit numbers by the SI convention.
    assert.equal(formatLegendNumber(1965, { decimals: 0 }), '1965');
    assert.equal(formatLegendNumber(3000, { decimals: 0 }), '3000');
    assert.equal(formatLegendNumber(1650, { decimals: 0 }), '1650');
});

test('five digits and up are grouped, millions get a suffix', () => {
    assert.equal(formatLegendNumber(12500, { decimals: 0 }), '12,500');
    assert.equal(formatLegendNumber(1_250_000), '1.3M');
    assert.equal(formatLegendNumber(2_400_000_000), '2.4B');
});

test('a unit is appended verbatim, leading space and all', () => {
    // Unit strings in this repo carry their own leading space.
    assert.equal(formatLegendNumber(42, { unit: ' inh/km²', decimals: 0 }), '42 inh/km²');
});

test('decimals are chosen so no two breaks print the same', () => {
    assert.equal(decimalsToDistinguish([1650, 1723, 1985]), 0);
    // Whole numbers would print these three as "0", "0" and "1"; one decimal
    // already tells them apart, and a legend says no more than it has to.
    assert.equal(decimalsToDistinguish([0.12, 0.34, 0.9]), 1);
    // Two is enough here, because rounding already separates them: 1.005 prints
    // as "1.00" and 1.006 as "1.01". Distinguishable is the test, not faithful —
    // a legend rounds, and this is the rule that keeps it from rounding two
    // different breaks onto one number.
    assert.equal(decimalsToDistinguish([1.005, 1.006]), 2);
});

test('breaks closer together than the cap still print, rather than hanging', () => {
    const breaks = [1.000001, 1.000002];
    const places = decimalsToDistinguish(breaks);
    assert.equal(places, 4);
    // They do collide at that point — the honest outcome for two breaks a
    // millionth apart — but the legend renders instead of searching forever.
    assert.equal(formatLegendNumber(breaks[0], { decimals: places }), '1.0000');
});

test('a formatted break carries the digits the set needs, not the ones it has', () => {
    // One decimal separates these, so that is what is shown — the same number
    // of places on every row, so the column reads as one scale.
    const breaks = [10.25, 10.5, 11];
    assert.equal(decimalsToDistinguish(breaks), 1);
    assert.deepEqual(breaks.map((value) => formatLegendNumber(value, { decimals: 1 })),
        ['10.3', '10.5', '11.0']);

    // Where one decimal would collide, more are used: 10.21 and 10.23 both
    // print as "10.2" at one place.
    const closer = [10.21, 10.23, 11];
    assert.equal(decimalsToDistinguish(closer), 2);
    assert.deepEqual(closer.map((value) => formatLegendNumber(value, { decimals: 2 })),
        ['10.21', '10.23', '11.00']);
});

test('a suffix is offered only where it still tells the breaks apart', () => {
    // Far apart: the suffix is readable and loses nothing that matters.
    const wide = legendNumberFormatter([1_000_000, 5_000_000, 20_000_000]);
    assert.deepEqual([1_000_000, 5_000_000, 20_000_000].map(wide), ['1M', '5M', '20M']);

    // Close together: "1.3M" three times over is "2K – 2K" a thousand times
    // larger, so the full numbers are printed instead.
    const close = legendNumberFormatter([1_250_000, 1_260_000, 1_270_000]);
    assert.deepEqual([1_250_000, 1_260_000, 1_270_000].map(close),
        ['1,250,000', '1,260,000', '1,270,000']);
});

test('a set that straddles a million prints one way, not two', () => {
    // Half the rows with a suffix and half without reads as two scales.
    const format = legendNumberFormatter([900_000, 1_100_000, 3_000_000]);
    assert.deepEqual([900_000, 1_100_000, 3_000_000].map(format),
        ['900,000', '1,100,000', '3,000,000']);
});

test('the formatter carries the unit onto every row', () => {
    const format = legendNumberFormatter([10, 20, 30], ' inh/km²');
    assert.deepEqual([10, 20, 30].map(format), ['10 inh/km²', '20 inh/km²', '30 inh/km²']);
});
