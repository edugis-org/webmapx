import test from 'node:test';
import assert from 'node:assert/strict';

import {
    isInternalFuncUrl,
    resolveInternalFuncUrl,
    resolveInternalSources,
} from '../src/utils/internal-sources';
import { DAYLIGHT_BANDS } from '../src/utils/solar';

test('an internalfunc url resolves to the data it stands for', () => {
    const bands = resolveInternalFuncUrl('internalfunc://day-night?at=2024-06-21T12:00:00Z');
    assert.equal(bands.type, 'FeatureCollection');
    assert.equal(bands.features.length, DAYLIGHT_BANDS.length);
    assert.equal(bands.features[0].properties?.timestamp, '2024-06-21T12:00:00.000Z');
});

test('a moment can be pinned, and a bad one falls back to now rather than failing', () => {
    const pinned = resolveInternalFuncUrl('internalfunc://sun-position?at=2024-01-01T00:00:00Z');
    const [feature] = pinned.features;
    assert.equal(feature.properties?.timestamp, '2024-01-01T00:00:00.000Z');

    const nonsense = resolveInternalFuncUrl('internalfunc://sun-position?at=yesterday-ish');
    assert.equal(nonsense.features.length, 1, 'an unreadable date should not empty the layer');
});

test('an unknown generator is an empty layer, not a broken map', () => {
    // One mistyped name in a configuration must not stop everything else loading.
    const missing = resolveInternalFuncUrl('internalfunc://not-a-thing');
    assert.deepEqual(missing, { type: 'FeatureCollection', features: [] });
});

test('a layer config has its computed sources replaced, at any depth', () => {
    const layer = {
        id: 'daynight',
        type: 'style',
        sources: {
            daynight: { id: 'daynight', type: 'geojson', data: 'internalfunc://day-night?at=2024-06-21T12:00:00Z' },
            static: { id: 'static', type: 'geojson', data: 'https://example.org/x.geojson' },
        },
        layers: [{ id: 'fill', type: 'fill', source: 'daynight' }],
    };
    const resolved = resolveInternalSources(layer) as typeof layer & {
        sources: { daynight: { data: GeoJSON.FeatureCollection }; static: { data: string } };
    };

    assert.equal(typeof resolved.sources.daynight.data, 'object');
    assert.equal(resolved.sources.daynight.data.features.length, DAYLIGHT_BANDS.length);
    // Everything else is left exactly as it was.
    assert.equal(resolved.sources.static.data, 'https://example.org/x.geojson');
    assert.deepEqual(resolved.layers, layer.layers);
});

test('a config with nothing computed in it is returned unchanged', () => {
    // Identity, not a copy: every layer added goes through this, and rebuilding
    // each one would throw away object identity the engines rely on.
    const layer = { id: 'plain', type: 'fill', source: 'x' };
    assert.equal(resolveInternalSources(layer), layer);
});

test('only the internalfunc protocol is treated as computed', () => {
    assert.ok(isInternalFuncUrl('internalfunc://day-night'));
    assert.ok(!isInternalFuncUrl('https://example.org/internalfunc://day-night'));
    assert.ok(!isInternalFuncUrl('internalfunc:day-night'));
    assert.ok(!isInternalFuncUrl(42));
});

test('a layer with nothing to resolve comes back as it was, and inline data is never copied', () => {
    // This runs on every layer added. It used to copy every array it walked —
    // every coordinate of inline GeoJSON — and a layer split into 51 classes is
    // added 51 times: a gigabyte for the sea level zones.
    const data = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [5, 52] } }] };
    const layer = { id: 'l', type: 'style', sources: { s: { type: 'geojson', data } }, layers: [{ id: 'a', source: 's', paint: { 'fill-color': ['case', ['<=', ['get', 'x'], 1], '#fff', '#000'] } }] };
    assert.equal(resolveInternalSources(layer), layer);

    const computed = { ...layer, sources: { ...layer.sources, c: { type: 'geojson', data: 'internalfunc://sun-position?at=2024-01-01T00:00:00Z' } } };
    const resolved = resolveInternalSources(computed) as typeof computed;
    assert.notEqual(resolved, computed, 'a computed source is resolved');
    assert.equal(resolved.sources.s.data, data, 'inline data is passed on, not copied');
    assert.equal(resolved.layers, computed.layers, 'unchanged arrays are shared');
});
