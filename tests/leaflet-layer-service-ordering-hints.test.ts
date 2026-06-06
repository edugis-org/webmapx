import test from 'node:test';
import assert from 'node:assert/strict';

import { MapStateStore } from '../src/store/map-state-store';
import type { AnyLayerConfig } from '../src/config/types';

function installLeafletDomShim(): () => void {
  const previousWindow = (globalThis as any).window;
  const previousDocument = (globalThis as any).document;
  const previousNavigator = (globalThis as any).navigator;

  const w: any = {};
  w.setTimeout = setTimeout;
  w.clearTimeout = clearTimeout;
  w.requestAnimationFrame = (cb: (...args: unknown[]) => void) => setTimeout(cb, 0);
  w.cancelAnimationFrame = clearTimeout;
  w.devicePixelRatio = 1;
  w.screen = { deviceXDPI: 96, logicalXDPI: 96 };
  w.navigator = { userAgent: 'node', platform: 'node' };
  w.document = {
    documentElement: { style: {} },
    createElement: () => ({
      style: {},
      appendChild() {},
      setAttribute() {},
      getContext: () => null,
    }),
    createElementNS: () => ({
      style: {},
      appendChild() {},
      setAttribute() {},
      getContext: () => null,
    }),
    body: { appendChild() {} },
  };

  (globalThis as any).window = w;
  (globalThis as any).document = w.document;
  try {
    (globalThis as any).navigator = w.navigator;
  } catch {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      writable: true,
      value: w.navigator,
    });
  }

  return () => {
    (globalThis as any).window = previousWindow;
    (globalThis as any).document = previousDocument;
    try {
      (globalThis as any).navigator = previousNavigator;
    } catch {
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        writable: true,
        value: previousNavigator,
      });
    }
  };
}

class FakeLeafletLayer {
  constructor(public readonly id: string) {}

  addTo(map: { addLayer: (layer: FakeLeafletLayer) => void }) {
    map.addLayer(this);
    return this;
  }
}

function createLeafletMapStub() {
  const layers: FakeLeafletLayer[] = [];

  return {
    map: {
      addLayer(layer: FakeLeafletLayer) {
        if (!layers.includes(layer)) {
          layers.push(layer);
        }
      },
      removeLayer(layer: FakeLeafletLayer) {
        const idx = layers.indexOf(layer);
        if (idx >= 0) {
          layers.splice(idx, 1);
        }
      },
      hasLayer(layer: FakeLeafletLayer) {
        return layers.includes(layer);
      },
    },
    getOrder: () => layers.map((entry) => entry.id),
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

test('Leaflet MapLayerService applies beforeLayerId using logical ids', async () => {
  const restore = installLeafletDomShim();
  try {
    const [{ MapLayerService }, { LeafletLayerFactory }] = await Promise.all([
      import('../src/map/leaflet-services/MapLayerService'),
      import('../src/map/leaflet-services/LeafletLayerFactory'),
    ]);

    const originalCreateXYZ = LeafletLayerFactory.createXYZLayer;
    LeafletLayerFactory.createXYZLayer = (layerId: string) => ({
      id: `${layerId}-raster-xyz`,
      type: 'raster',
      layer: new FakeLeafletLayer(layerId),
    }) as any;

    try {
      const { map, getOrder } = createLeafletMapStub();
      const service = new MapLayerService(map as any, new MapStateStore());
      await service.addLayer(makeLayer('a'));
      await service.addLayer(makeLayer('b'));
      await service.addLayer(makeLayer('c'), { beforeLayerId: 'a' });

      assert.deepEqual(getOrder(), ['c', 'a', 'b']);
    } finally {
      LeafletLayerFactory.createXYZLayer = originalCreateXYZ;
    }
  } finally {
    restore();
  }
});

test('Leaflet MapLayerService applies afterLayerId using logical ids', async () => {
  const restore = installLeafletDomShim();
  try {
    const [{ MapLayerService }, { LeafletLayerFactory }] = await Promise.all([
      import('../src/map/leaflet-services/MapLayerService'),
      import('../src/map/leaflet-services/LeafletLayerFactory'),
    ]);

    const originalCreateXYZ = LeafletLayerFactory.createXYZLayer;
    LeafletLayerFactory.createXYZLayer = (layerId: string) => ({
      id: `${layerId}-raster-xyz`,
      type: 'raster',
      layer: new FakeLeafletLayer(layerId),
    }) as any;

    try {
      const { map, getOrder } = createLeafletMapStub();
      const service = new MapLayerService(map as any, new MapStateStore());
      await service.addLayer(makeLayer('a'));
      await service.addLayer(makeLayer('b'));
      await service.addLayer(makeLayer('c'), { afterLayerId: 'a' });

      assert.deepEqual(getOrder(), ['a', 'c', 'b']);
    } finally {
      LeafletLayerFactory.createXYZLayer = originalCreateXYZ;
    }
  } finally {
    restore();
  }
});
