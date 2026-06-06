import test from 'node:test';
import assert from 'node:assert/strict';

import { MapLayerService } from '../src/map/openlayers-services/MapLayerService';
import { MapStateStore } from '../src/store/map-state-store';
import type { AnyLayerConfig } from '../src/config/types';

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

function makeLayer(id: string): AnyLayerConfig {
  return {
    id,
    type: 'raster',
    source: `${id}-source`,
    metadata: { legendRole: 'overlay' },
    sources: {
      [`${id}-source`]: { id: `${id}-source`, type: 'raster', service: 'xyz', url: 'https://example.com/{z}/{x}/{y}.png' },
    },
  } as any;
}

test('OpenLayers MapLayerService applies beforeLayerId using logical ids', async () => {
  const { map, getOrder } = createMapStub();
  const service = new MapLayerService(map as never, new MapStateStore());
  const internal = service as unknown as {
    createXYZLayer: (nativeLayerId: string, sourceConfig: unknown, style: unknown) => { __layerId: string };
  };
  internal.createXYZLayer = (nativeLayerId: string) => ({ __layerId: nativeLayerId.split('-')[0] });

  await service.addLayer(makeLayer('a'));
  await service.addLayer(makeLayer('b'));
  await service.addLayer(makeLayer('c'), { beforeLayerId: 'a' });

  assert.ok(getOrder().indexOf('c') < getOrder().indexOf('a'), 'c should come before a');
  assert.ok(getOrder().indexOf('a') < getOrder().indexOf('b'), 'a should come before b');
});

test('OpenLayers MapLayerService applies afterLayerId using logical ids', async () => {
  const { map, getOrder } = createMapStub();
  const service = new MapLayerService(map as never, new MapStateStore());
  const internal = service as unknown as {
    createXYZLayer: (nativeLayerId: string, sourceConfig: unknown, style: unknown) => { __layerId: string };
  };
  internal.createXYZLayer = (nativeLayerId: string) => ({ __layerId: nativeLayerId.split('-')[0] });

  await service.addLayer(makeLayer('a'));
  await service.addLayer(makeLayer('b'));
  await service.addLayer(makeLayer('c'), { afterLayerId: 'a' });

  assert.ok(getOrder().indexOf('a') < getOrder().indexOf('c'), 'a should come before c');
  assert.ok(getOrder().indexOf('c') < getOrder().indexOf('b'), 'c should come before b');
});
