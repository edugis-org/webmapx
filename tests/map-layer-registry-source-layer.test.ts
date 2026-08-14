/**
 * `source-layer` has to reach store.mapLayers.
 *
 * MapLibre's `querySourceFeatures` returns nothing for a vector source unless
 * it is told which source layer to read, so a legend panel that only knows the
 * source id samples zero features and reports "0 loaded visible features" for a
 * layer that is plainly drawn on the map.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { registerMapLayer } from '../src/map/map-layer-registry';
import { MapStateStore } from '../src/store/map-state-store';

const newStore = () => new MapStateStore();

test('registerMapLayer captures source-layer from a vector-tile layer spec', () => {
    const store = newStore();
    registerMapLayer(store, {
        id: 'populationdensity',
        type: 'fill',
        source: 'populationdensity-source',
        'source-layer': 'public.ne_10m_admin_1_states_provinces_lakes_pop',
    });
    const entry = store.getState().mapLayers!['populationdensity'];
    assert.equal(entry.sourceId, 'populationdensity-source');
    assert.equal(entry.sourceLayer, 'public.ne_10m_admin_1_states_provinces_lakes_pop');
});

test('a layer without source-layer leaves the field unset', () => {
    const store = newStore();
    registerMapLayer(store, { id: 'osm', type: 'raster', source: 'osm-source' });
    assert.equal(store.getState().mapLayers!['osm'].sourceLayer, undefined);
});

test('re-registering a layer keeps a source-layer it already had', () => {
    const store = newStore();
    registerMapLayer(store, { id: 'roads', type: 'line', source: 'roads-source', 'source-layer': 'transportation' });
    registerMapLayer(store, { id: 'roads', type: 'line', source: 'roads-source' });
    assert.equal(store.getState().mapLayers!['roads'].sourceLayer, 'transportation');
});
