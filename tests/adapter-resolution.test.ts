import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getMapScopedStorageKey,
  normalizeAdapterName,
  resolveAdapterSelection,
} from '../src/config/adapter-resolution.ts';
import {
  clearConfigCache,
  parseAttributeConfig,
  resolveMapConfig,
} from '../src/config/index.ts';

test('normalizeAdapterName resolves built-in aliases and lowercases custom names', () => {
  assert.equal(normalizeAdapterName('ol'), 'openlayers');
  assert.equal(normalizeAdapterName('L'), 'leaflet');
  assert.equal(normalizeAdapterName('c'), 'cesium');
  assert.equal(normalizeAdapterName('MapLibre'), 'maplibre');
  assert.equal(normalizeAdapterName('CustomEngine'), 'customengine');
  assert.equal(normalizeAdapterName(null), null);
});

test('getMapScopedStorageKey scopes preferences by map id', () => {
  assert.equal(getMapScopedStorageKey('main-map', 'adapter'), 'webmapx-adapter:main-map');
  assert.equal(getMapScopedStorageKey('main-map', 'viewport'), 'webmapx-viewport:main-map');
  assert.equal(getMapScopedStorageKey('', 'adapter'), null);
  assert.equal(getMapScopedStorageKey(undefined, 'viewport'), null);
});

test('resolveAdapterSelection applies explicit, saved, configured, default precedence', () => {
  assert.equal(resolveAdapterSelection({
    explicitAdapter: 'leaflet',
    savedAdapter: 'openlayers',
    configuredAdapter: 'cesium',
    defaultAdapter: 'maplibre',
  }), 'openlayers');

  assert.equal(resolveAdapterSelection({
    explicitAdapter: null,
    savedAdapter: 'ol',
    configuredAdapter: 'cesium',
    defaultAdapter: 'maplibre',
  }), 'openlayers');

  assert.equal(resolveAdapterSelection({
    explicitAdapter: null,
    savedAdapter: null,
    configuredAdapter: 'cesium',
    defaultAdapter: 'maplibre',
  }), 'cesium');

  assert.equal(resolveAdapterSelection({
    explicitAdapter: null,
    savedAdapter: null,
    configuredAdapter: null,
    defaultAdapter: 'maplibre',
  }), 'maplibre');
});

function createElement(attributes: Record<string, string> = {}): HTMLElement {
  return {
    getAttribute(name: string) {
      return attributes[name] ?? null;
    },
  } as unknown as HTMLElement;
}

test('parseAttributeConfig normalizes adapter aliases and prefers adapter over type', () => {
  const mapElement = createElement({
    adapter: 'ol',
    type: 'cesium',
    center: '[5,52]',
    zoom: '8',
  });

  assert.deepEqual(parseAttributeConfig(mapElement), {
    center: [5, 52],
    zoom: 8,
    type: 'openlayers',
  });
});

test('resolveMapConfig keeps app config values but lets explicit adapter attribute override map.type', async () => {
  const mapElement = createElement({ adapter: 'leaflet' });
  const resolved = await resolveMapConfig(mapElement, {
    map: {
      center: [1, 2],
      zoom: 3,
      type: 'maplibre',
      maxZoom: 18,
    },
  });

  assert.deepEqual(resolved, {
    center: [1, 2],
    zoom: 3,
    minZoom: 0,
    maxZoom: 18,
    type: 'leaflet',
  });
});

test('resolveMapConfig loads per-map src config and still applies explicit adapter alias', async () => {
  clearConfigCache();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      map: {
        center: [10, 20],
        zoom: 6,
        type: 'maplibre',
      },
      catalog: {
        tree: [],
        sources: [],
        layers: [],
      },
    }),
  }) as Response;

  try {
    const mapElement = createElement({
      src: '/config/demo.json',
      adapter: 'c',
    });

    const resolved = await resolveMapConfig(mapElement);
    assert.deepEqual(resolved, {
      center: [10, 20],
      zoom: 6,
      minZoom: 0,
      maxZoom: 22,
      type: 'cesium',
    });
  } finally {
    globalThis.fetch = originalFetch;
    clearConfigCache();
  }
});
