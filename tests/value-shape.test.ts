import test from 'node:test';
import assert from 'node:assert/strict';

import { logTransform, looksLikeArea, skewness, spearman, suggestsLog } from '../src/utils/value-shape';

test('skewness is near zero for symmetric data and large for a long right tail', () => {
    assert.ok(Math.abs(skewness([1, 2, 3, 4, 5, 6, 7, 8, 9])) < 1e-9);
    const tail = [...Array.from({ length: 95 }, (_, i) => 10 + (i % 7)), 400, 900, 2500, 6000, 12000];
    assert.ok(skewness(tail) > 2);
    assert.equal(suggestsLog(tail), true);
});

test('a log scale is not suggested with negative values or for symmetric data', () => {
    assert.equal(suggestsLog([-5, 1, 2, 3, 5000]), false);
    assert.equal(suggestsLog([10, 11, 12, 13, 14, 15]), false);
});

test('the log transform keeps zeros finite and does not depend on the unit', () => {
    const metres = [0, 2, 20, 200, 2000];
    const km = metres.map(v => v / 1000);
    const a = logTransform(metres);
    const b = logTransform(km);
    assert.ok(a.every(Number.isFinite));
    // Same data in another unit differs only by a constant after the transform.
    const shift = a[0] - b[0];
    a.forEach((v, i) => assert.ok(Math.abs(v - b[i] - shift) < 1e-9));
    assert.ok(Number.isNaN(logTransform([-1, 3])[0]));
});

test('spearman is 1 for any monotone relation and handles ties', () => {
    assert.ok(Math.abs(spearman([1, 2, 3, 4], [10, 100, 1000, 10000]) - 1) < 1e-12);
    assert.ok(Math.abs(spearman([1, 2, 3, 4], [4, 3, 2, 1]) + 1) < 1e-12);
    assert.ok(Math.abs(spearman([1, 1, 2, 3], [5, 5, 6, 7]) - 1) < 1e-12);
});

test('an area in hectares is recognised as an area, a population is not', () => {
    let seed = 11;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const areasKm2 = Array.from({ length: 300 }, () => 0.05 + random() * 40);
    const hectares = areasKm2.map(a => Math.round(a * 100 * (0.97 + random() * 0.06)));
    const inhabitants = areasKm2.map(a => Math.round(random() * 8000 + a * 30));
    assert.equal(looksLikeArea(hectares, areasKm2), true);
    assert.equal(looksLikeArea(inhabitants, areasKm2), false);
});
