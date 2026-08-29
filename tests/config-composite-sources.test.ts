/**
 * A composite layer (`type: 'style'`) carries its own `sources` map, and its
 * sublayers name those rather than the config's top-level sources — that is what
 * makes such a layer self-contained, and what `inlineLayerSources` resolves
 * before an engine sees the spec.
 *
 * The validator used to check every sublayer against the top-level sources
 * alone, so each self-contained composite layer was reported as broken: 122
 * errors on nl.json, all of them wrong. A validator that fails a shipped config
 * is worse than no validator, because it cannot be used as a gate.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { validateConfig } from '../src/config/validator';

function configWithLayer(layer: unknown, topLevelSources: unknown[] = []): unknown {
    return {
        map: { center: [0, 0], zoom: 2, type: 'maplibre' },
        layerData: { sources: topLevelSources, layers: [layer] },
    };
}

const compositeLayer = (sources: Record<string, unknown>, source: string) => ({
    id: 'provinces',
    type: 'style',
    title: 'Provinces',
    sources,
    layers: [{ id: 'provinces-fill', type: 'fill', source, 'source-layer': 'provinces' }],
});

const vectorSource = { type: 'vector', tiles: ['https://example.org/{z}/{x}/{y}.pbf'] };

test('a sublayer may name a source the composite layer defines itself', () => {
    const result = validateConfig(configWithLayer(
        compositeLayer({ provincesource: vectorSource }, 'provincesource'),
    ));
    assert.deepEqual(result.errors, []);
    assert.equal(result.valid, true);
});

test('a sublayer naming no source at all is still an error', () => {
    const result = validateConfig(configWithLayer(
        compositeLayer({ provincesource: vectorSource }, 'typo-source'),
    ));
    const messages = result.errors.map((e) => e.message);
    assert.equal(messages.length, 1, messages.join('\n'));
    assert.match(messages[0], /Source "typo-source" not found/);
});

test('a composite layer can still use a top-level source', () => {
    const result = validateConfig(configWithLayer(
        {
            id: 'provinces', type: 'style', title: 'Provinces',
            layers: [{ id: 'fill', type: 'fill', source: 'shared', 'source-layer': 'p' }],
        },
        [{ id: 'shared', ...vectorSource, attribution: 'test' }],
    ));
    assert.deepEqual(result.errors, []);
});
