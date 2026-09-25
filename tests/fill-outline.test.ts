/**
 * One outline setting for a fill, stored as whatever the style format needs:
 * `fill-outline-color` where that draws it exactly, a companion line otherwise.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    outlineCompanionIndex,
    outlineCompanionIds,
    readFillOutline,
    withFillOutline,
} from '../src/utils/fill-outline';

const fill = (paint: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
    id: 'countries', type: 'fill', source: 'src', 'source-layer': 'admin', paint, ...extra,
});
const line = (paint: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
    id: 'countries-line', type: 'line', source: 'src', 'source-layer': 'admin', paint, ...extra,
});

test('a 1px outline at the fill opacity is stored on the fill itself', () => {
    const out = withFillOutline([fill({ 'fill-color': '#f00', 'fill-opacity': 1 })], 'countries',
        { color: '#000', width: 1, opacity: 1 });
    assert.equal(out.length, 1);
    assert.equal((out[0].paint as Record<string, unknown>)['fill-outline-color'], '#000');
});

test('a wider outline becomes a line directly above the fill, over the same features', () => {
    const out = withFillOutline([fill({ 'fill-color': '#f00', 'fill-outline-color': '#000' }, { filter: ['==', 'a', 1], minzoom: 3 })],
        'countries', { color: '#00f', width: 3, opacity: 1 });
    assert.equal(out.length, 2);
    assert.equal((out[0].paint as Record<string, unknown>)['fill-outline-color'], undefined);
    assert.equal(out[1].type, 'line');
    assert.equal(out[1].source, 'src');
    assert.equal(out[1]['source-layer'], 'admin');
    assert.deepEqual(out[1].filter, ['==', 'a', 1]);
    assert.equal(out[1].minzoom, 3);
    assert.deepEqual(out[1].paint, { 'line-color': '#00f', 'line-width': 3 });
    assert.deepEqual(out[1].layout, { 'line-join': 'round', 'line-cap': 'round' });
    assert.equal(outlineCompanionIndex(out, 0), 1);
});

test('narrowing back to 1px folds the line into the fill again', () => {
    const wide = withFillOutline([fill({ 'fill-color': '#f00' })], 'countries', { color: '#00f', width: 3, opacity: 1 });
    const narrow = withFillOutline(wide, 'countries', { color: '#00f', width: 1, opacity: 1 });
    assert.equal(narrow.length, 1);
    assert.equal((narrow[0].paint as Record<string, unknown>)['fill-outline-color'], '#00f');
});

test('1px stays a line when the fill is translucent and the outline is not', () => {
    // fill-outline-color is multiplied by fill-opacity: it would fade the outline.
    const out = withFillOutline([fill({ 'fill-color': '#f00', 'fill-opacity': 0.2 }), line({ 'line-color': '#000', 'line-width': 2 })],
        'countries', { color: '#000', width: 1, opacity: 1 });
    assert.equal(out.length, 2);
    assert.equal((out[1].paint as Record<string, unknown>)['line-width'], 1);
});

test('a dashed outline is never folded into the fill', () => {
    const out = withFillOutline([fill({ 'fill-color': '#f00' }), line({ 'line-color': '#000', 'line-width': 2, 'line-dasharray': [2, 1] })],
        'countries', { color: '#000', width: 1, opacity: 1 });
    assert.equal(out.length, 2);
    assert.deepEqual((out[1].paint as Record<string, unknown>)['line-dasharray'], [2, 1]);
});

test('width 0 removes the outline in either form', () => {
    for (const input of [
        [fill({ 'fill-color': '#f00', 'fill-outline-color': '#000' })],
        [fill({ 'fill-color': '#f00' }), line({ 'line-color': '#000', 'line-width': 3 })],
    ]) {
        const out = withFillOutline(input, 'countries', { color: '#000', width: 0, opacity: 1 });
        assert.equal(out.length, 1);
        assert.equal((out[0].paint as Record<string, unknown>)['fill-outline-color'], undefined);
    }
});

test('a hand-written fill + line pair is read as one outline', () => {
    const subs = [fill({ 'fill-color': '#4a90d9', 'fill-opacity': 0.2 }), line({ 'line-color': '#2c6fad', 'line-width': 1 })];
    assert.equal(outlineCompanionIndex(subs, 0), 1);
    assert.deepEqual(readFillOutline(subs[0], subs[1]), { color: '#2c6fad', width: 1, opacity: 1 });
    assert.deepEqual([...outlineCompanionIds(subs)], [['countries', 'countries-line']]);
});

test('a line over other features, or with a name of its own, is not an outline', () => {
    assert.equal(outlineCompanionIndex([fill({}), line({}, { filter: ['==', 'b', 2] })], 0), -1);
    assert.equal(outlineCompanionIndex([fill({}), line({}, { source: 'other' })], 0), -1);
    assert.equal(outlineCompanionIndex([fill({}), line({}, { metadata: { label: 'Borders' } })], 0), -1);
    assert.equal(outlineCompanionIndex([fill({}), line({ 'line-width': ['get', 'w'] })], 0), -1);
});

test('reading a fill without a companion', () => {
    assert.deepEqual(readFillOutline(fill({ 'fill-color': '#f00', 'fill-outline-color': '#000', 'fill-opacity': 0.5 }), null),
        { color: '#000', width: 1, opacity: 0.5 });
    assert.equal(readFillOutline(fill({ 'fill-color': '#f00' }), null).width, 0);
});

test('keeps every other sublayer where it was', () => {
    const label = { id: 'labels', type: 'symbol', source: 'src' };
    const out = withFillOutline([fill({ 'fill-color': '#f00' }), label], 'countries', { color: '#000', width: 2, opacity: 1 });
    assert.deepEqual(out.map((sub) => sub.id), ['countries', 'countries-outline', 'labels']);
});

test('an outline line gets round joins and caps unless it says otherwise', () => {
    const out = withFillOutline([fill({ 'fill-color': '#f00' }), line({ 'line-color': '#000', 'line-width': 2 }, { layout: { 'line-join': 'bevel' } })],
        'countries', { color: '#000', width: 4, opacity: 1 });
    assert.deepEqual(out[1].layout, { 'line-join': 'bevel', 'line-cap': 'round' });
});
