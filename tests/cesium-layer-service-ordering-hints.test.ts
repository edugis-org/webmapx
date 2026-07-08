import test from 'node:test';
import assert from 'node:assert/strict';

import { MapLayerService } from '../src/map/cesium-services/MapLayerService';
import { MapStateStore } from '../src/store/map-state-store';
import type { AnyLayerConfig, SourceConfig } from '../src/config/types';

type ImageryLayer = { id: string; provider: unknown; show: boolean };

function createImageryCollection() {
  const layers: ImageryLayer[] = [];

  return {
    add(layer: ImageryLayer, index?: number) {
      if (typeof index === 'number' && Number.isFinite(index)) {
        const clamped = Math.max(0, Math.min(index, layers.length));
        layers.splice(clamped, 0, layer);
      } else {
        layers.push(layer);
      }
      return layer;
    },
    remove(layer: ImageryLayer) {
      const idx = layers.indexOf(layer);
      if (idx >= 0) {
        layers.splice(idx, 1);
        return true;
      }
      return false;
    },
    indexOf(layer: ImageryLayer) {
      return layers.indexOf(layer);
    },
    getOrder() {
      return layers.map((layer) => layer.id);
    },
  };
}

function installCesiumMock() {
  const previous = (globalThis as any).Cesium;

  class UrlTemplateImageryProvider {
    constructor(public readonly config: unknown) {}
  }

  class WebMapServiceImageryProvider {
    constructor(public readonly config: unknown) {}
  }

  class ImageryLayerClass {
    public show = true;
    public id = '';
    constructor(public readonly provider: unknown) {}
  }

  class GeoJsonDataSource {
    static async load(): Promise<{ entities: { values: unknown[] } }> {
      return { entities: { values: [] } };
    }
  }

  (globalThis as any).Cesium = {
    UrlTemplateImageryProvider,
    WebMapServiceImageryProvider,
    ImageryLayer: ImageryLayerClass,
    GeoJsonDataSource,
  };

  return () => {
    (globalThis as any).Cesium = previous;
  };
}

function createViewer() {
  const imageryLayers = createImageryCollection();

  return {
    imageryLayers,
    dataSources: {
      async add(dataSource: unknown) { return dataSource; },
      remove() { return true; },
    },
    scene: {
      globe: {
        tileLoadProgressEvent: {
          addEventListener() {},
        },
      },
      postRender: { addEventListener() {} },
    },
    camera: { changed: { addEventListener() {} } },
  };
}

function makeLayer(id: string): AnyLayerConfig {
  return {
    id,
    type: 'raster',
    source: `${id}-source`,
    metadata: { legendRole: 'overlay' },
    sources: {
      [`${id}-source`]: { id: `${id}-source`, type: 'raster', service: 'xyz', url: `https://example.com/${id}/{z}/{x}/{y}.png` },
    },
  } as any;
}

async function addRaster(service: MapLayerService, layerId: string, options?: { beforeLayerId?: string; afterLayerId?: string }) {
  await service.addLayer(makeLayer(layerId), options);
  const internal = service as unknown as { handles: Map<string, { kind: string; imageryLayer?: ImageryLayer }> };
  const handle = internal.handles.get(`${layerId}::${layerId}-source`);
  if (handle?.kind === 'imagery' && handle.imageryLayer) {
    handle.imageryLayer.id = layerId;
  }
}

test('Cesium MapLayerService applies beforeLayerId using logical ids', async () => {
  const restore = installCesiumMock();
  try {
    const viewer = createViewer();
    const service = new MapLayerService(viewer as any, new MapStateStore());
    await addRaster(service, 'a');
    await addRaster(service, 'b');
    await addRaster(service, 'c', { beforeLayerId: 'a' });

    assert.deepEqual(viewer.imageryLayers.getOrder(), ['c', 'a', 'b']);
  } finally {
    restore();
  }
});

test('Cesium MapLayerService applies afterLayerId using logical ids', async () => {
  const restore = installCesiumMock();
  try {
    const viewer = createViewer();
    const service = new MapLayerService(viewer as any, new MapStateStore());
    await addRaster(service, 'a');
    await addRaster(service, 'b');
    await addRaster(service, 'c', { afterLayerId: 'a' });

    assert.deepEqual(viewer.imageryLayers.getOrder(), ['a', 'c', 'b']);
  } finally {
    restore();
  }
});
