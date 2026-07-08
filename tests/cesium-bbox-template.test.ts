import test from 'node:test';
import assert from 'node:assert/strict';

import { MapLayerService } from '../src/map/cesium-services/MapLayerService';
import { MapStateStore } from '../src/store/map-state-store';
import type { AnyLayerConfig } from '../src/config/types';

function installCesiumMock() {
  const previous = (globalThis as any).Cesium;

  class UrlTemplateImageryProvider {
    constructor(public readonly config: any) {}
  }

  class WebMercatorTilingScheme {}

  class ImageryLayerClass {
    public show = true;
    public id = '';
    constructor(public readonly provider: UrlTemplateImageryProvider) {}
  }

  (globalThis as any).Cesium = {
    UrlTemplateImageryProvider,
    WebMercatorTilingScheme,
    ImageryLayer: ImageryLayerClass,
  };

  return () => {
    (globalThis as any).Cesium = previous;
  };
}

function createViewer() {
  const layers: { provider: any }[] = [];
  return {
    imageryLayers: {
      add(layer: any, index?: number) {
        if (typeof index === 'number' && Number.isFinite(index)) {
          layers.splice(Math.max(0, Math.min(index, layers.length)), 0, layer);
        } else {
          layers.push(layer);
        }
        return layer;
      },
      remove(layer: any) {
        const idx = layers.indexOf(layer);
        if (idx >= 0) layers.splice(idx, 1);
        return true;
      },
      indexOf(layer: any) { return layers.indexOf(layer); },
    },
    dataSources: { async add(d: unknown) { return d; }, remove() { return true; } },
    scene: {
      globe: { tileLoadProgressEvent: { addEventListener() {} } },
      postRender: { addEventListener() {} },
    },
    camera: { changed: { addEventListener() {} } },
    layers,
  };
}

function makeBboxRasterLayer(id: string): AnyLayerConfig {
  return {
    id,
    type: 'raster',
    source: `${id}-source`,
    metadata: { legendRole: 'overlay' },
    sources: {
      [`${id}-source`]: {
        id: `${id}-source`,
        type: 'raster',
        service: 'xyz',
        url: 'https://t1.example.com/tilecache.py?LAYERS=x&bbox={bbox-epsg-3857}',
      },
    },
  } as any;
}

test('Cesium MapLayerService rewrites {bbox-epsg-3857} into projected template vars + WebMercatorTilingScheme', async () => {
  const restore = installCesiumMock();
  try {
    const viewer = createViewer();
    const service = new MapLayerService(viewer as any, new MapStateStore());
    await service.addLayer(makeBboxRasterLayer('bevolking2015'));

    assert.equal(viewer.layers.length, 1);
    const { config } = viewer.layers[0].provider;
    assert.equal(
      config.url,
      'https://t1.example.com/tilecache.py?LAYERS=x&bbox={westProjected},{southProjected},{eastProjected},{northProjected}'
    );
    assert.ok(!config.url.includes('{bbox-epsg-3857}'), 'placeholder must be rewritten');
    assert.ok(config.tilingScheme instanceof (globalThis as any).Cesium.WebMercatorTilingScheme);
  } finally {
    restore();
  }
});

test('Cesium MapLayerService leaves plain XYZ url templates and tiling scheme untouched', async () => {
  const restore = installCesiumMock();
  try {
    const viewer = createViewer();
    const service = new MapLayerService(viewer as any, new MapStateStore());
    await service.addLayer({
      id: 'plain',
      type: 'raster',
      source: 'plain-source',
      metadata: { legendRole: 'overlay' },
      sources: {
        'plain-source': { id: 'plain-source', type: 'raster', service: 'xyz', url: 'https://example.com/{z}/{x}/{y}.png' },
      },
    } as any);

    const { config } = viewer.layers[0].provider;
    assert.equal(config.url, 'https://example.com/{z}/{x}/{y}.png');
    assert.equal(config.tilingScheme, undefined);
  } finally {
    restore();
  }
});
