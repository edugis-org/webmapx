import test from 'node:test';
import assert from 'node:assert/strict';

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

test('latLngBoundsToEpsg3857Bbox formats a LatLngBounds as minx,miny,maxx,maxy in EPSG:3857 meters', async () => {
  const restore = installLeafletDomShim();
  try {
    const [L, { latLngBoundsToEpsg3857Bbox }] = await Promise.all([
      import('leaflet'),
      import('../src/map/leaflet-services/LeafletLayerFactory'),
    ]);

    const bounds = (L as any).latLngBounds((L as any).latLng(0, 0), (L as any).latLng(1, 1));
    const bbox = latLngBoundsToEpsg3857Bbox(bounds);
    const parts = bbox.split(',').map(Number);

    assert.equal(parts.length, 4);
    const [minx, miny, maxx, maxy] = parts;
    // EPSG:3857 origin is at (0,0) for (lat 0, lng 0); 1 degree lng ~ 111319.49 meters at the equator.
    assert.ok(Math.abs(minx - 0) < 1e-6);
    assert.ok(Math.abs(miny - 0) < 1e-6);
    assert.ok(Math.abs(maxx - 111319.49) < 1);
    assert.ok(maxy > maxx, 'mercator y-stretch makes northing exceed easting away from the equator');
  } finally {
    restore();
  }
});

test('LeafletLayerFactory.createXYZLayer substitutes {bbox-epsg-3857} in the produced tile url', async () => {
  const restore = installLeafletDomShim();
  try {
    const { LeafletLayerFactory } = await import('../src/map/leaflet-services/LeafletLayerFactory');
    const L = await import('leaflet');

    const spec = LeafletLayerFactory.createXYZLayer('bevolking2015', {
      id: 'bevolking2015-source',
      type: 'raster',
      service: 'xyz',
      url: 'https://t1.example.com/tilecache.py?LAYERS=x&bbox={bbox-epsg-3857}',
    } as any);

    assert.ok(spec);
    const layer = spec!.layer as any;
    // Stub _tileCoordsToBounds — exercising Leaflet's full _map.unproject chain needs a
    // real DOM map; the substitution wiring under test only depends on this returning bounds.
    const stubBounds = (L as any).latLngBounds((L as any).latLng(0, 0), (L as any).latLng(1, 1));
    layer._tileCoordsToBounds = () => stubBounds;

    const url = layer.getTileUrl({ x: 2, y: 1, z: 2 });
    assert.ok(!url.includes('{bbox-epsg-3857}'), 'placeholder must be substituted');
    assert.match(url, /^https:\/\/t1\.example\.com\/tilecache\.py\?LAYERS=x&bbox=-?[\d.]+,-?[\d.]+,-?[\d.]+,-?[\d.]+$/);
  } finally {
    restore();
  }
});
