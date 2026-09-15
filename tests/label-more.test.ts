/**
 * A label's *More* tier: the mapping between what a reader chooses and the GL
 * keys that say it, including the authored shapes it must refuse to rewrite.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    collectFontStacks,
    fontStackOf,
    hasMoreOverrides,
    labelMoreSupported,
    placementOf,
    placementOptions,
    readPosition,
    writePosition,
} from '../src/components/styler/label-more';
import { encodeStyleEntry, type StyleSubLayer } from '../src/utils/layer-style-model';
import { decodeStyleEntry } from '../src/utils/style-decoder';

test('font stacks come from the map, one per leading face, expressions skipped', () => {
    const stacks = collectFontStacks([
        [
            { type: 'symbol', layout: { 'text-font': ['Noto Sans Regular'] } },
            { type: 'symbol', layout: { 'text-font': ['Noto Sans Bold', 'Arial Unicode MS Bold'] } },
            { type: 'symbol', layout: { 'text-font': ['get', 'font'] } },
        ],
        null,
        [
            { type: 'fill', paint: {} },
            // Same leading face, different fallback: the first seen wins.
            { type: 'symbol', layout: { 'text-font': ['Noto Sans Bold'] } },
        ],
    ]);
    assert.deepEqual(stacks, [['Noto Sans Bold', 'Arial Unicode MS Bold'], ['Noto Sans Regular']]);
});

test('a font stack decodes as a value, not an expression, and round-trips', () => {
    const sublayer: StyleSubLayer = {
        id: 'labels', type: 'symbol',
        layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Italic'], 'text-allow-overlap': true },
    };
    const entry = decodeStyleEntry(sublayer);
    assert.deepEqual(fontStackOf(entry.channels.font), ['Noto Sans Italic']);
    assert.deepEqual(entry.channels.allowOverlap, { driver: 'single', value: true });
    assert.deepEqual(encodeStyleEntry(entry), sublayer);
});

test('an operator is not mistaken for a font stack', () => {
    const entry = decodeStyleEntry({ id: 'l', type: 'symbol', layout: { 'text-font': ['literal', ['Noto Sans Regular']] } });
    assert.equal(entry.channels.font?.driver, 'custom');
    assert.equal(fontStackOf(entry.channels.font), null);
});

test('placement is offered in words that fit the geometry', () => {
    assert.deepEqual(placementOptions(['Point']), []);
    assert.deepEqual(placementOptions(['MultiPolygon']).map((option) => option.value), ['point', 'line']);
    assert.deepEqual(placementOptions(['LineString']).map((option) => option.value), ['point', 'line', 'line-center']);
    assert.equal(placementOf(undefined), 'point');
    assert.equal(placementOf({ driver: 'custom', expression: ['step', ['zoom'], 'point', 10, 'line'] }), null);
});

test('a position is two keys, and both are written together', () => {
    assert.deepEqual(writePosition({ direction: 'above', distance: 1.5 }), {
        anchor: { driver: 'single', value: 'bottom' },
        offset: { driver: 'single', value: [0, -1.5] },
    });
    assert.deepEqual(writePosition({ direction: 'right', distance: 0 }), { anchor: { driver: 'single', value: 'left' } });
    // Centre removes both, so the layer goes back to saying nothing.
    assert.deepEqual(writePosition({ direction: 'center', distance: 2 }), {});

    for (const direction of ['above', 'below', 'left', 'right'] as const) {
        const { anchor, offset } = writePosition({ direction, distance: 0.75 });
        assert.deepEqual(readPosition(anchor, offset), { direction, distance: 0.75 });
    }
});

test('an authored position this control cannot express is not read as one', () => {
    const single = (value: unknown) => ({ driver: 'single', value }) as never;
    assert.equal(readPosition(single('top-left'), undefined), null, 'diagonal anchor');
    assert.equal(readPosition(single('bottom'), single([0.5, -1])), null, 'offset with a sideways part');
    assert.equal(readPosition(single('bottom'), single([0, 1])), null, 'offset pointing back across the point');
    assert.equal(readPosition(undefined, single([1, 0])), null, 'centred but pushed aside');
    assert.deepEqual(readPosition(undefined, undefined), { direction: 'center', distance: 0 });
});

test('the dot on the ⋯ marks anything but the defaults', () => {
    const entry = (layout: Record<string, unknown>) => decodeStyleEntry({ id: 'l', type: 'symbol', layout });
    assert.equal(hasMoreOverrides(entry({ 'text-field': '{name}' })), false);
    // Authored explicitly, but at the default: nothing hidden to warn about.
    assert.equal(hasMoreOverrides(entry({ 'symbol-placement': 'point', 'text-allow-overlap': false, 'text-anchor': 'center' })), false);
    assert.equal(hasMoreOverrides(entry({ 'text-font': ['Noto Sans Bold'] })), true);
    assert.equal(hasMoreOverrides(entry({ 'symbol-placement': 'line' })), true);
    assert.equal(hasMoreOverrides(entry({ 'text-anchor': 'top', 'text-offset': [0, 1] })), true);
    assert.equal(hasMoreOverrides(entry({ 'text-allow-overlap': true })), true);
});

test('only engines that read the keys are offered them', () => {
    assert.equal(labelMoreSupported('maplibre'), true);
    assert.equal(labelMoreSupported('openlayers'), true);
    assert.equal(labelMoreSupported('leaflet'), false);
    assert.equal(labelMoreSupported('cesium'), false);
});
