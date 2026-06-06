import test from 'node:test';
import assert from 'node:assert/strict';

import type Projection from 'ol/proj/Projection';
import type { TileCoord } from 'ol/tilecoord';
import { MapLayerService } from '../src/map/openlayers-services/MapLayerService';
import { MapStateStore } from '../src/store/map-state-store';
import type { AnyLayerConfig, CompositeStyleLayerConfig, SourceConfig } from '../src/config/types';

type TestMapStub = {
  addLayer(): void;
  removeLayer(): void;
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
  };
}

function createService(): MapLayerService {
  return new MapLayerService(createTestMap() as never, new MapStateStore());
}

function accessServiceInternals<T>(service: MapLayerService): T {
  return service as unknown as T;
}

test('MapLayerService tolerates expression paint values for OpenLayers fallback styling', () => {
  const service = accessServiceInternals<{
    createStyle: (style: unknown) => unknown;
  }>(createService());

  const style = service.createStyle({
    type: 'fill',
    paint: {
      'fill-color': ['interpolate', ['linear'], ['zoom'], 9, '#ffffff', 12, '#000000'],
      'fill-opacity': ['step', ['zoom'], 0.3, 10, 0.8],
      'fill-outline-color': ['get', 'outline'],
    },
  });

  assert.ok(style);
});

test('MapLayerService merges native ids across per-source adds for one logical layer', async () => {
  const service = createService();
  const internal = accessServiceInternals<{
    createLayer: (nativeLayerId: string) => Promise<{ __layerId: string }>;
    createStyleBackedVectorTileLayer: (nativeLayerId: string) => Promise<{ __layerId: string }>;
    logicalToNative: Map<string, string[]>;
  }>(service);

  internal.createLayer = async (nativeLayerId: string) => ({ __layerId: nativeLayerId });
  internal.createStyleBackedVectorTileLayer = async (nativeLayerId: string) => ({ __layerId: nativeLayerId });

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

  const layer = await service.createStyleBackedVectorTileLayer(
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

  assert.ok(layer);
  assert.equal(layer.getSource().getTileGrid()?.getMaxZoom(), 14);
  assert.equal(
    layer.getSource().getTileUrlFunction()([15, 16830, 10768], 1, null),
    'https://tiles.openfreemap.org/planet/14/8415/5384.pbf'
  );
});
