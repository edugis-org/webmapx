import test from 'node:test';
import assert from 'node:assert/strict';

import {
    isInternalFuncUrl,
    resolveInternalFuncUrl,
    resolveInternalSources,
} from '../src/utils/internal-sources';

test('an internalfunc url resolves to the data it stands for', () => {
    const bands = resolveInternalFuncUrl('internalfunc://day-night?at=2024-06-21T12:00:00Z');
    assert.equal(bands.type, 'FeatureCollection');
    assert.equal(bands.features.length, 4);
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
    assert.equal(resolved.sources.daynight.data.features.length, 4);
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
