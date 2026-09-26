import test from 'node:test';
import assert from 'node:assert/strict';

import { curveSpan, parseSeaLevelCurve, seaLevelAt } from '../src/utils/sea-level-curve';

const curve = parseSeaLevelCurve({
    name: 'test',
    // deliberately unsorted, with one malformed point
    points: [[0, 0], [21, -134], [14.5, -96], [14, -76], ['x', 1]],
})!;

test('a curve is sorted from oldest to youngest and ignores malformed points', () => {
    assert.deepEqual(curve.points, [[21, -134], [14.5, -96], [14, -76], [0, 0]]);
    assert.deepEqual(curveSpan(curve), { oldest: 21, youngest: 0 });
});

test('levels are interpolated linearly between points', () => {
    assert.equal(seaLevelAt(curve, 21), -134);
    assert.equal(seaLevelAt(curve, 14.25), -86);
    assert.equal(seaLevelAt(curve, 7), -38);
});

test('ages outside the curve are clamped to its ends', () => {
    assert.equal(seaLevelAt(curve, 30), -134);
    assert.equal(seaLevelAt(curve, -1), 0);
});

test('a document without two usable points is no curve', () => {
    assert.equal(parseSeaLevelCurve({ points: [[1, 2]] }), null);
    assert.equal(parseSeaLevelCurve(null), null);
});
