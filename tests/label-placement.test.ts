import test from 'node:test';
import assert from 'node:assert/strict';
import { placeLabels } from '../src/map/label-placement';

const box = (left: number, top: number, width = 10, height = 10) => ({ left, top, right: left + width, bottom: top + height });

test('overlapping labels: the lowest sort key is kept, whatever the input order', () => {
    const shown = placeLabels([
        { item: 'b', sortKey: 2, box: box(5, 5) },
        { item: 'a', sortKey: 1, box: box(0, 0) },
    ]);
    assert.deepEqual([...shown], ['a']);
});

test('labels that do not touch are all shown', () => {
    const shown = placeLabels([
        { item: 'a', sortKey: 0, box: box(0, 0) },
        { item: 'b', sortKey: 0, box: box(20, 0) },
        { item: 'c', sortKey: 0, box: box(0, 20) },
    ]);
    assert.deepEqual([...shown].sort(), ['a', 'b', 'c']);
});

test('a hidden label does not block a later one', () => {
    // b loses to a; c overlaps only b, so c is shown.
    const shown = placeLabels([
        { item: 'a', sortKey: 1, box: box(0, 0) },
        { item: 'b', sortKey: 2, box: box(8, 0) },
        { item: 'c', sortKey: 3, box: box(16, 0) },
    ]);
    assert.deepEqual([...shown].sort(), ['a', 'c']);
});

test('touching edges count as overlapping, as before the extraction', () => {
    const shown = placeLabels([
        { item: 'a', sortKey: 1, box: box(0, 0) },
        { item: 'b', sortKey: 2, box: box(10, 0) },
    ]);
    assert.deepEqual([...shown], ['a']);
});
