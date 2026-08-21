import test from 'node:test';
import assert from 'node:assert/strict';

import type Projection from 'ol/proj/Projection';
import type { TileCoord } from 'ol/tilecoord';
import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import { MapLayerService } from '../src/map/openlayers-services/MapLayerService';
import { MapStateStore } from '../src/store/map-state-store';
import type { AnyLayerConfig, CompositeStyleLayerConfig, SourceConfig } from '../src/config/types';

type TestMapStub = {
  addLayer(): void;
  removeLayer(): void;
  getLayers(): { removeAt(): void; insertAt(): void; getLength(): number };
};

type TestVectorTileLayer = {
  __layerId?: string;
  getSource(): {
    getTileGrid(): { getMaxZoom(): number | undefined } | null;
    getTileUrlFunction(): (tileCoord: TileCoord, pixelRatio: number, projection: Projection | null) => string | undefined;
  };
};

function createTestMap(): TestMapStub {
  return {
    addLayer() {},
    removeLayer() {},
    getLayers: () => ({ removeAt() {}, insertAt() {}, getLength: () => 0 }),
  };
}

function createService(): MapLayerService {
  return new MapLayerService(createTestMap() as never, new MapStateStore());
}

function accessServiceInternals<T>(service: MapLayerService): T {
  return service as unknown as T;
}

test('MapLayerService creates a GeoJSON layer with stylefunction', () => {
  const service = accessServiceInternals<{
    createGeoJSONLayer: (layerId: string, sourceConfig: unknown, style: unknown) => unknown;
  }>(createService());

  const layer = service.createGeoJSONLayer('test-layer', {
    id: 'test-source',
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  }, {
    id: 'test-style',
    type: 'fill',
    source: 'test-source',
    paint: {
      'fill-color': ['case', ['<', ['get', 'value'], 10], '#ff0000', '#0000ff'],
      'fill-opacity': 0.8,
    },
  });

  assert.ok(layer);
});

test('MapLayerService merges native ids across per-source adds for one logical layer', async () => {
  const service = createService();
  const internal = accessServiceInternals<{
    createLayer: (nativeLayerId: string) => Promise<{ __layerId: string }>;
    createStyleBackedVectorTileLayer: (nativeLayerId: string) => Promise<{ layer: any; mapboxLayerIds: any[]; spriteResources: null } | null>;
    logicalToNative: Map<string, string[]>;
  }>(service);

  internal.createLayer = async (nativeLayerId: string) => ({ __layerId: nativeLayerId });
  internal.createStyleBackedVectorTileLayer = async (nativeLayerId: string) => ({
    layer: { __layerId: nativeLayerId } as any,
    mapboxLayerIds: [],
    spriteResources: null,
  });

  const compositeLayer: CompositeStyleLayerConfig = {
    id: 'openfreemap-liberty',
    type: 'style',
    metadata: { styleUrl: 'https://tiles.openfreemap.org/styles/liberty' },
    sources: {
      'style:openfreemap-liberty:ne2_shaded': { id: 'style:openfreemap-liberty:ne2_shaded', type: 'raster', service: 'xyz', url: 'https://example.test/{z}/{x}/{y}.png' },
      'style:openfreemap-liberty:openmaptiles': { id: 'style:openfreemap-liberty:openmaptiles', type: 'vector', url: 'https://example.test/tiles.json' },
    },
    layers: [
      { id: 'natural-earth', type: 'raster', source: 'style:openfreemap-liberty:ne2_shaded' },
      { id: 'style:road_motorway', type: 'line', source: 'style:openfreemap-liberty:openmaptiles' },
    ],
  };

  await service.addLayer(compositeLayer);

  assert.ok(internal.logicalToNative.has('openfreemap-liberty'));
});

test('MapLayerService builds a GL style document with sprite and glyph metadata', () => {
  const service = accessServiceInternals<{
    buildStyleBackedGlStyle: (layerConfig: AnyLayerConfig, sourceConfig: SourceConfig & { type: 'vector' }) => Record<string, unknown>;
  }>(createService());

  const glStyle = service.buildStyleBackedGlStyle(
    {
      id: 'openfreemap-liberty',
      type: 'style',
      metadata: {
        styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
        styleSpriteUrl: 'https://tiles.openfreemap.org/sprites/ofm',
        styleGlyphsUrl: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
      },
      layers: [{
        id: 'style:road_motorway',
        type: 'line',
        'source-layer': 'transportation',
        paint: { 'line-color': '#fc8' },
        layout: { 'line-cap': 'round' },
        filter: ['==', ['get', 'class'], 'motorway'],
      }],
    },
    {
      id: 'style:openfreemap-liberty:openmaptiles',
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
    }
  );

  const glStyleRecord = glStyle as {
    sprite?: string;
    glyphs?: string;
    layers: Array<Record<string, unknown>>;
    sources: Record<string, Record<string, unknown>>;
  };

  assert.equal(glStyleRecord.sprite, 'https://tiles.openfreemap.org/sprites/ofm');
  assert.equal(glStyleRecord.glyphs, 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf');
  assert.equal(glStyleRecord.layers[0].source, 'style:openfreemap-liberty:openmaptiles');
  assert.equal(glStyleRecord.layers[0]['source-layer'], 'transportation');
  assert.equal(glStyleRecord.sources['style:openfreemap-liberty:openmaptiles'].maxzoom, undefined);
});

test('MapLayerService resolves sprite manifest and png URL for OpenLayers style-backed layers', async () => {
  const service = accessServiceInternals<{
    resolveStyleSpriteResources: (metadata: Record<string, unknown>) => Promise<{
      spriteData: Record<string, unknown>;
      spriteImageUrl: string;
    } | null>;
  }>(createService());
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: string | URL | Request) => {
    const url = String(input);
    assert.equal(url, 'https://tiles.openfreemap.org/sprites/ofm.json');
    return {
      ok: true,
      json: async () => ({
        airport_11: { x: 0, y: 0, width: 24, height: 24, pixelRatio: 1 },
      }),
    } as Response;
  };

  try {
    const spriteResources = await service.resolveStyleSpriteResources({
      styleSpriteUrl: 'https://tiles.openfreemap.org/sprites/ofm',
    });

    assert.deepEqual(spriteResources, {
      spriteData: {
        airport_11: { x: 0, y: 0, width: 24, height: 24, pixelRatio: 1 },
      },
      spriteImageUrl: 'https://tiles.openfreemap.org/sprites/ofm.png',
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('MapLayerService preserves fill-extrusion layers for OpenLayers style-backed GL styles', () => {
  const service = accessServiceInternals<{
    buildStyleBackedGlStyle: (layerConfig: AnyLayerConfig, sourceConfig: SourceConfig & { type: 'vector' }) => Record<string, unknown>;
  }>(createService());

  const glStyle = service.buildStyleBackedGlStyle(
    {
      id: 'openfreemap-liberty',
      type: 'style',
      metadata: { styleUrl: 'https://tiles.openfreemap.org/styles/liberty' },
      layers: [
        { id: 'style:building', type: 'fill', 'source-layer': 'building' },
        { id: 'style:building-3d', type: 'fill-extrusion', 'source-layer': 'building' },
      ],
    },
    {
      id: 'style:openfreemap-liberty:openmaptiles',
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
    }
  );

  const glStyleRecord = glStyle as { layers: Array<Record<string, unknown>> };
  assert.deepEqual(glStyleRecord.layers.map((layer) => layer.id), ['style:building', 'style:building-3d']);
  assert.equal(glStyleRecord.layers[1].type, 'fill-extrusion');
});

test('MapLayerService caps style-backed vector source tile grid at source maxzoom while preserving overzoom requests', async () => {
  const service = accessServiceInternals<{
    resolveVectorTileSourceInfo: () => Promise<{ urlTemplate: string; minZoom: number; maxZoom: number }>;
    createStyleBackedVectorTileLayer: (layerId: string, layerConfig: AnyLayerConfig, sourceConfig: SourceConfig & { type: 'vector'; minzoom?: number; maxzoom?: number }) => Promise<TestVectorTileLayer | null>;
  }>(createService());
  service.resolveVectorTileSourceInfo = async () => ({
    urlTemplate: 'https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf',
    minZoom: 0,
    maxZoom: 14,
  });

  const result = await service.createStyleBackedVectorTileLayer(
    'openfreemap-liberty-openmaptiles-vector-style',
    {
      id: 'openfreemap-liberty',
      type: 'style',
      metadata: { styleUrl: 'https://tiles.openfreemap.org/styles/liberty' },
      layers: [{ id: 'style:road_motorway', type: 'line' }],
    },
    {
      id: 'style:openfreemap-liberty:openmaptiles',
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
      minzoom: 0,
      maxzoom: 14,
    }
  );

  assert.ok(result);
  const layer = (result as any).layer ?? result;
  assert.equal(layer.getSource().getTileGrid()?.getMaxZoom(), 14);
  assert.equal(
    layer.getSource().getTileUrlFunction()([15, 16830, 10768], 1, null),
    'https://tiles.openfreemap.org/planet/14/8415/5384.pbf'
  );
});

test('MapLayerService expands {bbox-epsg-3857} XYZ url templates into EPSG:3857 tile extents', () => {
  const service = accessServiceInternals<{
    createXYZLayer: (layerId: string, sourceConfig: SourceConfig & { type: 'raster'; service: 'xyz' }, style: { type: string }) => TestVectorTileLayer;
  }>(createService());

  const layer = service.createXYZLayer('bevolking2015', {
    id: 'bevolking2015-source',
    type: 'raster',
    service: 'xyz',
    url: [
      'https://t1.example.com/tilecache.py?...&bbox={bbox-epsg-3857}',
      'https://t2.example.com/tilecache.py?...&bbox={bbox-epsg-3857}',
    ],
  } as SourceConfig & { type: 'raster'; service: 'xyz' }, { type: 'raster' });

  const url = layer.getSource().getTileUrlFunction()([10, 530, 335], 1, null);
  assert.ok(url, 'expected a url to be produced');
  assert.match(url!, /^https:\/\/t[12]\.example\.com\/tilecache\.py\?\.\.\.&bbox=-?[\d.]+,-?[\d.]+,-?[\d.]+,-?[\d.]+$/);
  assert.ok(!url!.includes('{bbox-epsg-3857}'), 'placeholder must be substituted');
});

test('queryLayerFeatures reads each source once, however many sublayers draw it', async () => {
  // A fill+outline layer is two native layers, and `createGeoJSONLayer` gives
  // each its own VectorSource holding its own copy of the data. Reading both
  // returned every feature twice — invisible on the map, since the copies draw
  // on top of each other, but it doubled every export and every analysis built
  // from the answer.
  const service = createService();
  const internal = accessServiceInternals<{
    logicalToNative: Map<string, string[]>;
    nativeLayerToSource: Map<string, string>;
    nativeLayerInstances: Map<string, unknown>;
  }>(service);

  const data: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: ['a', 'b', 'c'].map((name, i) => ({
      type: 'Feature',
      properties: { name },
      geometry: { type: 'Point', coordinates: [i, i] },
    })),
  };

  const layerFor = () => ({
    getSource: () => new VectorSource({ features: new GeoJSON().readFeatures(data) }),
  });

  internal.logicalToNative.set('world', ['world:fill', 'world:outline']);
  internal.nativeLayerToSource.set('world:fill', 'source:world');
  internal.nativeLayerToSource.set('world:outline', 'source:world');
  internal.nativeLayerInstances.set('world:fill', layerFor());
  internal.nativeLayerInstances.set('world:outline', layerFor());

  const result = await service.queryLayerFeatures('world');

  assert.equal(result.features.length, data.features.length);
  const names = result.features.map(f => String(f.properties?.name));
  assert.deepEqual([...new Set(names)].sort(), ['a', 'b', 'c']);
});

test('queryLayerFeatures keeps both layers when a logical layer really has two sources', async () => {
  const service = createService();
  const internal = accessServiceInternals<{
    logicalToNative: Map<string, string[]>;
    nativeLayerToSource: Map<string, string>;
    nativeLayerInstances: Map<string, unknown>;
  }>(service);

  const pointNamed = (name: string): GeoJSON.FeatureCollection => ({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: { name }, geometry: { type: 'Point', coordinates: [0, 0] } }],
  });
  const layerFor = (fc: GeoJSON.FeatureCollection) => ({
    getSource: () => new VectorSource({ features: new GeoJSON().readFeatures(fc) }),
  });

  internal.logicalToNative.set('combined', ['combined:one', 'combined:two']);
  internal.nativeLayerToSource.set('combined:one', 'source:one');
  internal.nativeLayerToSource.set('combined:two', 'source:two');
  internal.nativeLayerInstances.set('combined:one', layerFor(pointNamed('one')));
  internal.nativeLayerInstances.set('combined:two', layerFor(pointNamed('two')));

  const result = await service.queryLayerFeatures('combined');

  assert.deepEqual(result.features.map(f => String(f.properties?.name)).sort(), ['one', 'two']);
});

test('updateLayerStyle repaints a standard layer, not just composite sublayers', async () => {
  // The legend addresses a layer with no sublayers as (layerId, layerId), while
  // a standard layer is registered as `${layerId}-${sourceId}-${type}`. Without
  // the standard-layer branch every colour and opacity edit on a geoprocessing
  // result was accepted by the UI and dropped by the engine.
  const service = createService();
  const internal = accessServiceInternals<{
    logicalToNative: Map<string, string[]>;
    compositeSubLayerCache: Map<string, { spec: Record<string, unknown>; sourceConfig: unknown }>;
    nativeLayerInstances: Map<string, unknown>;
    createLayer: (nativeLayerId: string, spec: Record<string, unknown>) => Promise<unknown>;
    findLayerIndexByInstance: () => number;
  }>(service);

  const built: Array<Record<string, unknown>> = [];
  internal.createLayer = async (_nativeLayerId, spec) => {
    built.push(spec);
    return { __layerId: _nativeLayerId };
  };
  internal.findLayerIndexByInstance = () => -1;

  const nativeId = 'gp:cartogram:world-source:gp:cartogram:world-fill';
  internal.logicalToNative.set('gp:cartogram:world', [nativeId]);
  internal.nativeLayerInstances.set(nativeId, { __layerId: nativeId });
  internal.compositeSubLayerCache.set(nativeId, {
    spec: { id: 'gp:cartogram:world', type: 'fill', paint: { 'fill-color': '#ff0000', 'fill-opacity': 0.35 } },
    sourceConfig: { id: 'source', type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
  });

  const applied = service.updateLayerStyle('gp:cartogram:world', 'gp:cartogram:world', { 'fill-color': '#00ff00' });
  await Promise.resolve();

  assert.equal(applied, true);
  assert.equal(built.length, 1);
  assert.deepEqual(built[0].paint, { 'fill-color': '#00ff00', 'fill-opacity': 0.35 });
});

test('updateLayerStyle sends each paint key to the native layer of its own type', async () => {
  const service = createService();
  const internal = accessServiceInternals<{
    logicalToNative: Map<string, string[]>;
    compositeSubLayerCache: Map<string, { spec: Record<string, unknown>; sourceConfig: unknown }>;
    nativeLayerInstances: Map<string, unknown>;
    createLayer: (nativeLayerId: string, spec: Record<string, unknown>) => Promise<unknown>;
    findLayerIndexByInstance: () => number;
  }>(service);

  const built: Array<{ nativeId: string; spec: Record<string, unknown> }> = [];
  internal.createLayer = async (nativeId, spec) => {
    built.push({ nativeId, spec });
    return { __layerId: nativeId };
  };
  internal.findLayerIndexByInstance = () => -1;

  for (const type of ['fill', 'line']) {
    const nativeId = `roads-source-${type}`;
    internal.logicalToNative.set('roads', [...(internal.logicalToNative.get('roads') ?? []), nativeId]);
    internal.nativeLayerInstances.set(nativeId, { __layerId: nativeId });
    internal.compositeSubLayerCache.set(nativeId, {
      spec: { id: 'roads', type, paint: {} },
      sourceConfig: { id: 'source', type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
    });
  }

  service.updateLayerStyle('roads', 'roads', { 'line-color': '#0000ff' });
  await Promise.resolve();

  assert.deepEqual(built.map(b => b.nativeId), ['roads-source-line']);
});
