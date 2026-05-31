import test from 'node:test';
import assert from 'node:assert/strict';

import { MapLayerService } from '../src/map/openlayers-services/MapLayerService';
import { MapStateStore } from '../src/store/map-state-store';
import type { LayerConfig, SourceConfig } from '../src/config/types';

type LayerArrayWrapper = {
  getArray: () => unknown[];
  getLength: () => number;
  insertAt: (index: number, layer: unknown) => void;
};

type OpenLayersMapStub = {
  addLayer: (layer: unknown) => void;
  removeLayer: (layer: unknown) => void;
  getLayers: () => LayerArrayWrapper;
};

function createMapStub() {
  const layers: unknown[] = [];

  const wrapper: LayerArrayWrapper = {
    getArray: () => layers,
    getLength: () => layers.length,
    insertAt: (index: number, layer: unknown) => {
      layers.splice(index, 0, layer);
    },
  };

  const map: OpenLayersMapStub = {
    addLayer(layer: unknown) {
      layers.push(layer);
    },
    removeLayer(layer: unknown) {
      const index = layers.indexOf(layer);
      if (index >= 0) {
        layers.splice(index, 1);
      }
    },
    getLayers() {
      return wrapper;
    },
  };

  return {
    map,
    getOrder: () => layers.map((entry: any) => entry.__layerId),
  };
}

function makeLayer(id: string): LayerConfig {
  return {
    id,
    metadata: { legendRole: 'overlay' },
    layerset: [{ id: 'r', type: 'raster', source: `${id}-source` }],
  };
}

function makeSource(id: string): SourceConfig {
  return {
    id: `${id}-source`,
    type: 'raster',
    service: 'xyz',
    url: 'https://example.com/{z}/{x}/{y}.png',
  };
}

test('OpenLayers MapLayerService applies beforeLayerId using logical ids', async () => {
  const { map, getOrder } = createMapStub();
  const service = new MapLayerService(map as never, new MapStateStore());
  const internal = service as unknown as {
    createLayer: (nativeLayerId: string) => Promise<{ __layerId: string }>;
  };

  internal.createLayer = async (nativeLayerId: string) => ({ __layerId: nativeLayerId });

  await service.addLayer('a', makeLayer('a'), makeSource('a'));
  await service.addLayer('b', makeLayer('b'), makeSource('b'));
  await service.addLayer('c', makeLayer('c'), makeSource('c'), { beforeLayerId: 'a' });

  assert.deepEqual(getOrder(), ['c-r', 'a-r', 'b-r']);
});

test('OpenLayers MapLayerService applies afterLayerId using logical ids', async () => {
  const { map, getOrder } = createMapStub();
  const service = new MapLayerService(map as never, new MapStateStore());
  const internal = service as unknown as {
    createLayer: (nativeLayerId: string) => Promise<{ __layerId: string }>;
  };

  internal.createLayer = async (nativeLayerId: string) => ({ __layerId: nativeLayerId });

  await service.addLayer('a', makeLayer('a'), makeSource('a'));
  await service.addLayer('b', makeLayer('b'), makeSource('b'));
  await service.addLayer('c', makeLayer('c'), makeSource('c'), { afterLayerId: 'a' });

  assert.deepEqual(getOrder(), ['a-r', 'c-r', 'b-r']);
});
