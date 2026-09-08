/**
 * A layer handed on carries what the user changed about it.
 *
 * A style edit reaches the engine and `store.mapLayers`, never the config the
 * layer came from — so copying a layer's config out of the configuration it was
 * loaded from returns the colours it had before the user touched it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildLayerDefinition } from '../src/utils/layer-definition';

test('the live paint wins over the paint the layer was configured with', () => {
    const result = buildLayerDefinition(
        'vrbg',
        { paint: { 'fill-color': '#ff0000' }, layerType: 'fill' },
        { id: 'vrbg', type: 'fill', source: 'vrbg', paint: { 'fill-color': '#444444' } },
    );
    assert.equal((result!.layer.paint as Record<string, unknown>)['fill-color'], '#ff0000');
    // Everything the config said and the user did not change is still there.
    assert.equal(result!.layer.source, 'vrbg');
});

test('a composite carries its sublayers, including one the style dialog added', () => {
    const result = buildLayerDefinition('c', {
        layerType: 'fill',
        sublayers: [
            { id: 'c-fill', type: 'fill', paint: { 'fill-color': '#00ff00' } },
            { id: 'c-labels', type: 'symbol', layout: { 'text-field': ['get', 'naam'] } },
        ],
    }, { id: 'c', type: 'style', layers: [{ id: 'c-fill', type: 'fill' }] });

    const layers = result!.layer.layers as Record<string, unknown>[];
    assert.equal(layers.length, 2);
    assert.equal(layers[1].id, 'c-labels');
});

test('a runtime layer nobody configured is rebuilt from the store alone', () => {
    const result = buildLayerDefinition('drawn', {
        layerType: 'circle',
        sourceId: 'drawn:points',
        paint: { 'circle-radius': 9 },
    });
    assert.equal(result!.layer.id, 'drawn');
    assert.equal(result!.layer.type, 'circle');
    assert.equal(result!.layer.source, 'drawn:points');
});

test('visibility and opacity are reported beside the layer, not folded into it', () => {
    const result = buildLayerDefinition('l', { layerType: 'fill', visible: false, transparency: 40 });
    assert.equal(result!.visible, false);
    assert.equal(result!.transparency, 40);
    assert.equal('visible' in result!.layer, false);
    assert.equal('transparency' in result!.layer, false);
});

test('a rename in the legend travels as the layer title', () => {
    const result = buildLayerDefinition('l', { layerType: 'fill', label: 'Gewesten' },
        { id: 'l', type: 'fill', metadata: { title: 'Gewest', abstract: 'keep me' } });
    const metadata = result!.layer.metadata as Record<string, unknown>;
    assert.equal(metadata.title, 'Gewesten');
    assert.equal(metadata.abstract, 'keep me');
});

test('the result is a copy, so editing it cannot write into live state', () => {
    const entry = { layerType: 'fill', paint: { 'fill-color': '#444444' } };
    const result = buildLayerDefinition('l', entry)!;
    (result.layer.paint as Record<string, unknown>)['fill-color'] = '#ff0000';
    assert.equal(entry.paint['fill-color'], '#444444');
});

test('a layer the map does not have has no definition', () => {
    assert.equal(buildLayerDefinition('missing', undefined), null);
});
