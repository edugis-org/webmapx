import test from 'node:test';
import assert from 'node:assert/strict';

import { DeferredQueryService } from '../src/map/deferred-query-service';
import { fetchWMSFeatureInfo } from '../src/map/wms-feature-info';
import type { IQueryService, QueryLocation, FeatureInfo } from '../src/map/IQueryService';
import type { WMSSourceConfig } from '../src/config/types';

// ─── DeferredQueryService ────────────────────────────────────────────────────

test('DeferredQueryService returns empty array before bind', async () => {
    const deferred = new DeferredQueryService();
    const location: QueryLocation = { pixel: [100, 200], lngLat: [4.9, 52.3] };
    const result = await deferred.queryFeatures(location);
    assert.deepEqual(result, []);
});

test('DeferredQueryService delegates to bound service after bind', async () => {
    const deferred = new DeferredQueryService();

    const fakeFeature: FeatureInfo = {
        layerId: 'earthquakes',
        properties: { mag: 5.2 },
        source: 'vector',
    };

    const fakeService: IQueryService = {
        async queryFeatures(_loc, _opts) {
            return [fakeFeature];
        },
    };

    deferred.bind(fakeService);

    const location: QueryLocation = { pixel: [100, 200], lngLat: [4.9, 52.3] };
    const result = await deferred.queryFeatures(location);
    assert.deepEqual(result, [fakeFeature]);
});

test('DeferredQueryService forwards QueryOptions to bound service', async () => {
    const deferred = new DeferredQueryService();

    let capturedOptions: unknown;
    const fakeService: IQueryService = {
        async queryFeatures(_loc, opts) {
            capturedOptions = opts;
            return [];
        },
    };

    deferred.bind(fakeService);

    const location: QueryLocation = { pixel: [0, 0], lngLat: [0, 0] };
    await deferred.queryFeatures(location, { tolerancePx: 8, includeWMS: true });

    assert.deepEqual(capturedOptions, { tolerancePx: 8, includeWMS: true });
});

// ─── fetchWMSFeatureInfo URL building ────────────────────────────────────────

function makeWMSConfig(overrides: Partial<WMSSourceConfig> = {}): WMSSourceConfig {
    return {
        id: 'test-wms',
        type: 'raster',
        service: 'wms',
        url: 'https://example.com/wms',
        layers: 'layer1',
        version: '1.3.0',
        ...overrides,
    };
}

function captureLastFetchUrl(): { getUrl(): string | null; restore(): void } {
    let lastUrl: string | null = null;
    const original = (globalThis as any).fetch;
    (globalThis as any).fetch = async (url: string) => {
        lastUrl = url;
        return {
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => ({ type: 'FeatureCollection', features: [] }),
        };
    };
    return {
        getUrl: () => lastUrl,
        restore: () => { (globalThis as any).fetch = original; },
    };
}

test('fetchWMSFeatureInfo builds correct WMS 1.3.0 URL with CRS:84', async () => {
    const spy = captureLastFetchUrl();
    try {
        await fetchWMSFeatureInfo({
            sourceConfig: makeWMSConfig({ version: '1.3.0', crs: 'CRS:84' }),
            layerId: 'test-layer',
            bounds: { west: 4.0, south: 52.0, east: 5.0, north: 53.0 },
            containerWidth: 800,
            containerHeight: 600,
            pixelX: 400,
            pixelY: 300,
        });

        const url = new URL(spy.getUrl()!);
        assert.equal(url.searchParams.get('SERVICE'), 'WMS');
        assert.equal(url.searchParams.get('REQUEST'), 'GetFeatureInfo');
        assert.equal(url.searchParams.get('VERSION'), '1.3.0');
        assert.equal(url.searchParams.get('CRS'), 'CRS:84');
        // CRS:84 uses lon/lat order (not swapped)
        assert.equal(url.searchParams.get('BBOX'), '4,52,5,53');
        assert.equal(url.searchParams.get('I'), '400');
        assert.equal(url.searchParams.get('J'), '300');
        assert.equal(url.searchParams.get('WIDTH'), '800');
        assert.equal(url.searchParams.get('HEIGHT'), '600');
        assert.equal(url.searchParams.get('LAYERS'), 'layer1');
        assert.equal(url.searchParams.get('QUERY_LAYERS'), 'layer1');
    } finally {
        spy.restore();
    }
});

test('fetchWMSFeatureInfo swaps BBOX axes for EPSG:4326 in WMS 1.3.0', async () => {
    const spy = captureLastFetchUrl();
    try {
        await fetchWMSFeatureInfo({
            sourceConfig: makeWMSConfig({ version: '1.3.0', crs: 'EPSG:4326' }),
            layerId: 'test-layer',
            bounds: { west: 4.0, south: 52.0, east: 5.0, north: 53.0 },
            containerWidth: 800,
            containerHeight: 600,
            pixelX: 400,
            pixelY: 300,
        });

        const url = new URL(spy.getUrl()!);
        // EPSG:4326 → lat/lon axis order: south,west,north,east
        assert.equal(url.searchParams.get('BBOX'), '52,4,53,5');
    } finally {
        spy.restore();
    }
});

test('fetchWMSFeatureInfo uses SRS and X/Y for WMS 1.1.1', async () => {
    const spy = captureLastFetchUrl();
    try {
        await fetchWMSFeatureInfo({
            sourceConfig: makeWMSConfig({ version: '1.1.1' }),
            layerId: 'test-layer',
            bounds: { west: 4.0, south: 52.0, east: 5.0, north: 53.0 },
            containerWidth: 800,
            containerHeight: 600,
            pixelX: 123,
            pixelY: 456,
        });

        const url = new URL(spy.getUrl()!);
        assert.equal(url.searchParams.get('VERSION'), '1.1.1');
        assert.ok(url.searchParams.has('SRS'), 'WMS 1.1.1 should use SRS not CRS');
        assert.ok(!url.searchParams.has('CRS'), 'WMS 1.1.1 should not have CRS');
        // 1.1.1 always lon/lat: west,south,east,north
        assert.equal(url.searchParams.get('BBOX'), '4,52,5,53');
        assert.equal(url.searchParams.get('X'), '123');
        assert.equal(url.searchParams.get('Y'), '456');
        assert.ok(!url.searchParams.has('I'), 'WMS 1.1.1 should not have I');
    } finally {
        spy.restore();
    }
});

test('fetchWMSFeatureInfo returns empty array on non-ok HTTP response', async () => {
    const original = (globalThis as any).fetch;
    (globalThis as any).fetch = async () => ({ ok: false });
    try {
        const result = await fetchWMSFeatureInfo({
            sourceConfig: makeWMSConfig(),
            layerId: 'test-layer',
            bounds: { west: 0, south: 0, east: 1, north: 1 },
            containerWidth: 100,
            containerHeight: 100,
            pixelX: 50,
            pixelY: 50,
        });
        assert.deepEqual(result, []);
    } finally {
        (globalThis as any).fetch = original;
    }
});

test('fetchWMSFeatureInfo parses GeoJSON FeatureCollection response', async () => {
    const original = (globalThis as any).fetch;
    (globalThis as any).fetch = async () => ({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', properties: { name: 'Amsterdam', pop: 900000 }, geometry: null },
            ],
        }),
    });
    try {
        const result = await fetchWMSFeatureInfo({
            sourceConfig: makeWMSConfig(),
            layerId: 'cities',
            layerTitle: 'Cities',
            bounds: { west: 0, south: 0, east: 1, north: 1 },
            containerWidth: 100,
            containerHeight: 100,
            pixelX: 50,
            pixelY: 50,
        });
        assert.equal(result.length, 1);
        assert.equal(result[0].layerId, 'cities');
        assert.equal(result[0].layerTitle, 'Cities');
        assert.equal(result[0].source, 'wms');
        assert.deepEqual(result[0].properties, { name: 'Amsterdam', pop: 900000 });
    } finally {
        (globalThis as any).fetch = original;
    }
});

test('fetchWMSFeatureInfo returns empty array for empty FeatureCollection', async () => {
    const original = (globalThis as any).fetch;
    (globalThis as any).fetch = async () => ({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ type: 'FeatureCollection', features: [] }),
    });
    try {
        const result = await fetchWMSFeatureInfo({
            sourceConfig: makeWMSConfig(),
            layerId: 'test-layer',
            bounds: { west: 0, south: 0, east: 1, north: 1 },
            containerWidth: 100,
            containerHeight: 100,
            pixelX: 50,
            pixelY: 50,
        });
        assert.deepEqual(result, []);
    } finally {
        (globalThis as any).fetch = original;
    }
});

test('fetchWMSFeatureInfo returns empty array on fetch error', async () => {
    const original = (globalThis as any).fetch;
    (globalThis as any).fetch = async () => { throw new Error('network error'); };
    try {
        const result = await fetchWMSFeatureInfo({
            sourceConfig: makeWMSConfig(),
            layerId: 'test-layer',
            bounds: { west: 0, south: 0, east: 1, north: 1 },
            containerWidth: 100,
            containerHeight: 100,
            pixelX: 50,
            pixelY: 50,
        });
        assert.deepEqual(result, []);
    } finally {
        (globalThis as any).fetch = original;
    }
});
