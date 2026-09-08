/**
 * A layer that arrives without paint gets webmapx's unstyled look, once.
 *
 * The map and its legend must agree about what colour a layer is, and the only
 * way they can is to read the same paint off the layer itself — filled in here
 * before any engine sees it, rather than by four separate fallbacks each
 * guessing (MapLibre's spec default is opaque black, which covers the map).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    DEFAULT_DATA_COLOR,
    DEFAULT_FILL_OPACITY,
    DEFAULT_OUTLINE_COLOR,
    withDefaultPaint,
} from '../src/map/default-paint';

test('an unstyled polygon is a dark outline over a translucent fill', () => {
    const layer = withDefaultPaint({ id: 'wfs', type: 'fill', source: 'wfs' }) as Record<string, any>;
    assert.deepEqual(layer.paint, {
        'fill-color': DEFAULT_DATA_COLOR,
        'fill-opacity': DEFAULT_FILL_OPACITY,
        'fill-outline-color': DEFAULT_OUTLINE_COLOR,
    });
    // The outline rides on the fill: no second layer is ever invented.
    assert.equal(layer.layers, undefined);
});

test('an empty paint object counts as no paint', () => {
    const layer = withDefaultPaint({ id: 'l', type: 'line', paint: {} }) as Record<string, any>;
    assert.equal(layer.paint['line-color'], DEFAULT_DATA_COLOR);
});

test('one property of its own means the rest was left to the spec deliberately', () => {
    const authored = { id: 'l', type: 'fill', paint: { 'fill-color': '#ff0000' } };
    assert.equal(withDefaultPaint(authored), authored);
});

test('a composite layer is filled in sublayer by sublayer', () => {
    const composite = withDefaultPaint({
        id: 'c',
        type: 'style',
        layers: [
            { id: 'a', type: 'fill' },
            { id: 'b', type: 'circle', paint: { 'circle-radius': 12 } },
        ],
    }) as Record<string, any>;
    assert.equal(composite.layers[0].paint['fill-color'], DEFAULT_DATA_COLOR);
    assert.deepEqual(composite.layers[1].paint, { 'circle-radius': 12 });
});

test('a raster or symbol layer has no default of ours to give it', () => {
    const raster = { id: 'r', type: 'raster' };
    assert.equal(withDefaultPaint(raster), raster);
});
