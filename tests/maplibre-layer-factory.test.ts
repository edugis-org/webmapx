import test from 'node:test';
import assert from 'node:assert/strict';

import { MapLibreLayerFactory } from '../src/map/maplibre-services/MapLibreLayerFactory.ts';
import type { LayerConfig, SourceConfig } from '../src/config/types.ts';

test('MapLibreLayerFactory preserves filter and zoom range for style-backed vector layers', () => {
  const layerConfig: LayerConfig = {
    id: 'style-layer',
    layerset: [{
      id: 'road-major',
      type: 'line',
      source: 'style:test-source',
      sourceLayer: 'transportation',
      minZoom: 6,
      maxZoom: 14,
      filter: ['==', ['get', 'class'], 'primary'],
      paint: {
        'line-color': '#ff9900',
        'line-width': 2,
      },
      layout: {
        'line-cap': 'round',
      },
    }],
  };

  const sourceConfig = {
    id: 'style:test-source',
    type: 'vector',
    url: 'https://example.test/tiles.json',
  } as SourceConfig;

  const [layerSpec] = MapLibreLayerFactory.createLayers(layerConfig, sourceConfig, 'native-source-id');
  assert.ok(layerSpec);
  assert.equal(layerSpec.id, 'style-layer-road-major');
  assert.equal((layerSpec as any).source, 'native-source-id');
  assert.equal((layerSpec as any)['source-layer'], 'transportation');
  assert.deepEqual((layerSpec as any).filter, ['==', ['get', 'class'], 'primary']);
  assert.equal((layerSpec as any).minzoom, 6);
  assert.equal((layerSpec as any).maxzoom, 14);
});

test('MapLibreLayerFactory supports fill-extrusion vector layers', () => {
  const layerConfig: LayerConfig = {
    id: 'style-layer',
    layerset: [{
      id: 'building-extrusion',
      type: 'fill-extrusion',
      source: 'style:test-source',
      sourceLayer: 'building',
      minZoom: 13,
      maxZoom: 20,
      filter: ['==', ['get', 'render_height'], 1],
      paint: {
        'fill-extrusion-color': '#d9d3c9',
        'fill-extrusion-height': 20,
        'fill-extrusion-base': 0,
      },
    }],
  };

  const sourceConfig = {
    id: 'style:test-source',
    type: 'vector',
    url: 'https://example.test/tiles.json',
  } as SourceConfig;

  const [layerSpec] = MapLibreLayerFactory.createLayers(layerConfig, sourceConfig, 'native-source-id');
  assert.ok(layerSpec);
  assert.equal(layerSpec.id, 'style-layer-building-extrusion');
  assert.equal((layerSpec as any).type, 'fill-extrusion');
  assert.equal((layerSpec as any).source, 'native-source-id');
  assert.equal((layerSpec as any)['source-layer'], 'building');
  assert.deepEqual((layerSpec as any).filter, ['==', ['get', 'render_height'], 1]);
  assert.equal((layerSpec as any).minzoom, 13);
  assert.equal((layerSpec as any).maxzoom, 20);
});