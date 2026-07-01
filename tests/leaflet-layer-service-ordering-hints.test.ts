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
  const panes = new Map<string, { style: { zIndex?: string }; remove: () => void }>();

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
      createPane(name: string) {
        const pane = { style: {} as { zIndex?: string }, remove: () => panes.delete(name) };
        panes.set(name, pane);
        return pane;
      },
      getPane(name: string) {
        return panes.get(name);
      },
    },
    getOrder: () => layers.map((entry) => entry.id),
    // Visual stacking order: layer ids sorted by their pane's z-index (bottom first).
    getZOrder: () =>
      [...panes.entries()]
        .filter(([, pane]) => pane.style.zIndex !== undefined)
        .sort((a, b) => Number(a[1].style.zIndex) - Number(b[1].style.zIndex))
        .map(([name]) => name.replace(/^webmapx-/, '')),
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
      const { map, getZOrder } = createLeafletMapStub();
      const service = new MapLayerService(map as any, new MapStateStore());
      await service.addLayer(makeLayer('a'));
      await service.addLayer(makeLayer('b'));
      await service.addLayer(makeLayer('c'), { beforeLayerId: 'a' });

      assert.deepEqual(getZOrder(), ['c', 'a', 'b']);
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
      const { map, getZOrder } = createLeafletMapStub();
      const service = new MapLayerService(map as any, new MapStateStore());
      await service.addLayer(makeLayer('a'));
      await service.addLayer(makeLayer('b'));
      await service.addLayer(makeLayer('c'), { afterLayerId: 'a' });

      assert.deepEqual(getZOrder(), ['a', 'c', 'b']);
    } finally {
      LeafletLayerFactory.createXYZLayer = originalCreateXYZ;
    }
  } finally {
    restore();
  }
});

test('Leaflet MapLayerService moveLayer restacks pane z-indexes without re-adding layers', async () => {
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
      const { map, getOrder, getZOrder } = createLeafletMapStub();
      const service = new MapLayerService(map as any, new MapStateStore());
      await service.addLayer(makeLayer('a'));
      await service.addLayer(makeLayer('b'));
      await service.addLayer(makeLayer('c'));

      service.moveLayer('c', 'a');

      assert.deepEqual(getZOrder(), ['c', 'a', 'b']);
      // Layers stay in their panes — reorder must not remove/re-add them.
      assert.deepEqual(getOrder(), ['a', 'b', 'c']);
    } finally {
      LeafletLayerFactory.createXYZLayer = originalCreateXYZ;
    }
  } finally {
    restore();
  }
});
