/**
 * A `background` layer survives config normalization.
 *
 * It is the one render type with no data behind it: it paints a flat colour,
 * which is how a map gives its sea a colour of its own. `map.backgroundColor`
 * cannot do that job alone on MapLibre, because the same colour is also the
 * canvas clear colour and would paint the space around the globe as well.
 *
 * `normalizeLayerSpec` used to require `source` to be a string, so such a layer
 * matched none of its branches and normalization returned `null`. The null then
 * sat in `layerData.layers` and the *validator* reported it — "Layer must be an
 * object" — which reads as a broken config rather than a loader gap, and the
 * map refused to mount at all.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAndValidateConfig } from '../src/config/loader.js';

const CONFIG = {
    version: 0,
    map: { type: 'maplibre', center: [0, 0], zoom: 1, backgroundColor: '#05070f' },
    layerData: {
        sources: [{ id: 'pts', type: 'geojson', data: { type: 'FeatureCollection', features: [] }, attribution: 'test' }],
        layers: [
            { id: 'sea', type: 'background', title: 'Sea', paint: { 'background-color': '#0b3d66' } },
            { id: 'dots', type: 'circle', source: 'pts' },
        ],
    },
    state: { activeLayers: [{ ref: 'sea', visible: true }, { ref: 'dots', visible: true }] },
};

test('a sourceless background layer normalizes to a layer, not to null', () => {
    const config: any = parseAndValidateConfig(
        structuredClone(CONFIG), 'test', 'https://example.org/config/demo.json',
    );

    const layers = config.layerData?.layers ?? [];
    assert.equal(layers.length, 2, 'both layers must survive normalization');

    const sea = layers.find((l: any) => l?.id === 'sea');
    assert.ok(sea, 'the background layer must still be there');
    assert.equal(sea.type, 'background');
    assert.equal(sea.paint['background-color'], '#0b3d66', 'its colour is what the layer is for');
    assert.equal(sea.source, undefined, 'and it must not have acquired a source');
});

test('a background layer raises no validation warning either', () => {
    // Asking a background layer for a source is a warning every such config
    // would otherwise carry, and warnings are what a config repository's CI
    // gates on with --strict.
    const warnings: string[] = [];
    const original = console.warn;
    console.warn = (...args: unknown[]) => { warnings.push(args.join(' ')); };
    try {
        parseAndValidateConfig(structuredClone(CONFIG), 'test', 'https://example.org/config/demo.json');
    } finally {
        console.warn = original;
    }
    assert.deepEqual(warnings, [], `unexpected warnings: ${warnings.join(' | ')}`);
});
