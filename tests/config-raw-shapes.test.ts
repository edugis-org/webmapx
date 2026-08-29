/**
 * The validator runs in two places that see different things.
 *
 * In the app it runs *after* `fetchConfig` has normalised the file: an
 * object-keyed `layers` map has become an array with ids injected, and a
 * source's `tiles` has become `url`. A CI gate, or the `webmapx-validate` CLI,
 * necessarily runs over the raw file instead — and both raw spellings are legal
 * input, so rejecting them fails configs the app loads perfectly well. It did:
 * `webmapx-config.json` and `config-laptop.json` reported 37 errors each.
 *
 * These tests pin the raw shapes, so the validator stays usable as a gate.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { validateConfig } from '../src/config/validator';

const rasterTiles = ['https://example.org/{z}/{x}/{y}.png'];

function configWith(layerData: unknown): unknown {
    return { map: { center: [0, 0], zoom: 2, type: 'maplibre' }, layerData };
}

test('layerData may be keyed by id instead of an array', () => {
    const result = validateConfig(configWith({
        sources: { osmsource: { type: 'raster', tiles: rasterTiles, attribution: 'OSM' } },
        layers: { osm: { type: 'raster', source: 'osmsource', title: 'OpenStreetMap' } },
    }));
    assert.deepEqual(result.errors, []);
    assert.equal(result.valid, true);
});

test('an id-keyed entry is reported by key, not by index', () => {
    // "layers[3]" would mean counting keys in the file to find the culprit.
    const result = validateConfig(configWith({
        sources: {},
        layers: { osm: { type: 'nosuchtype', source: 'missing' } },
    }));
    assert.ok(
        result.errors.some((error) => error.path.startsWith('layerData.layers.osm')),
        result.errors.map((error) => error.path).join(', '),
    );
});

test('a raster source may spell its templates "tiles"', () => {
    // The MapLibre spelling, which the loader rewrites to `url`.
    const result = validateConfig(configWith({
        sources: [{ id: 'landcover', type: 'raster', tiles: rasterTiles, tileSize: 256, attribution: 'GLCNMO' }],
        layers: [],
    }));
    assert.deepEqual(result.errors, []);
});

test('a raster source with neither url nor tiles is still an error', () => {
    const result = validateConfig(configWith({
        sources: [{ id: 'broken', type: 'raster', attribution: 'none' }],
        layers: [],
    }));
    assert.equal(result.errors.length, 1, result.errors.map((e) => e.message).join('\n'));
    assert.match(result.errors[0].message, /requires a non-empty "url".*or "tiles"/);
});

test('layerData that is neither array nor object is reported', () => {
    const result = validateConfig(configWith({ sources: 'nope', layers: 42 }));
    assert.equal(result.errors.length, 2);
    for (const error of result.errors) assert.match(error.message, /must be an array, or an object keyed by/);
});
