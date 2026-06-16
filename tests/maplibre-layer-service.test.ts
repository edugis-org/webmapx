import test from 'node:test';
import assert from 'node:assert/strict';

// Node has no requestAnimationFrame — provide a synchronous stub so RAF-throttled
// code can be exercised without a browser environment.
let _rafCallbacks: Array<() => void> = [];
(globalThis as any).requestAnimationFrame = (cb: () => void) => {
    _rafCallbacks.push(cb);
    return _rafCallbacks.length - 1;
};
(globalThis as any).cancelAnimationFrame = (id: number) => { _rafCallbacks[id] = () => {}; };
function flushRaf() { const cbs = _rafCallbacks.splice(0); cbs.forEach(cb => cb()); }

import { normalizeRawSource } from '../src/map/layer-source-utils';
import { MapLayerService } from '../src/map/maplibre-services/MapLayerService';
import { MapStateStore } from '../src/store/map-state-store';

// ---------------------------------------------------------------------------
// Minimal maplibre Map mock
// ---------------------------------------------------------------------------
type PaintCall = { layerId: string; key: string; value: unknown };
type LayoutCall = { layerId: string; key: string; value: unknown };

function makeMapMock(existingLayers: string[] = [], existingSources: string[] = []) {
    const paintCalls: PaintCall[] = [];
    const layoutCalls: LayoutCall[] = [];
    const addedLayers: { spec: any; before?: string }[] = [];
    const addedSources: { id: string; spec: any }[] = [];
    const layers = new Set(existingLayers);
    const sources = new Set(existingSources);

    return {
        paintCalls,
        layoutCalls,
        addedLayers,
        addedSources,
        getLayer: (id: string) => layers.has(id) ? { id, source: `${id}-source`, type: 'hillshade' } : undefined,
        getSource: (id: string) => sources.has(id) ? {} : undefined,
        getStyle: () => ({ layers: [...layers].map(id => ({ id })) }),
        addLayer: (spec: any, before?: string) => { layers.add(spec.id); addedLayers.push({ spec, before }); },
        addSource: (id: string, spec: any) => { sources.add(id); addedSources.push({ id, spec }); },
        removeLayer: (id: string) => layers.delete(id),
        removeSource: (id: string) => sources.delete(id),
        setPaintProperty: (layerId: string, key: string, value: unknown) => paintCalls.push({ layerId, key, value }),
        setLayoutProperty: (layerId: string, key: string, value: unknown) => layoutCalls.push({ layerId, key, value }),
        getPaintProperty: () => undefined,
        getTerrain: () => undefined,
        triggerRepaint: () => {},
    } as any;
}

function makeStore() {
    return new MapStateStore();
}

// ---------------------------------------------------------------------------
// normalizeRawSource
// ---------------------------------------------------------------------------

test('normalizeRawSource: raster-dem passthrough preserves tiles/encoding/tileSize (when id present)', () => {
    // normalizeRawSource passes through any source type when the raw def already has an `id` field
    const result = normalizeRawSource('dem-src', {
        id: 'original-id',
        type: 'raster-dem',
        tiles: ['https://example.com/{z}/{x}/{y}.png'],
        encoding: 'mapzen',
        tileSize: 512,
        maxzoom: 15,
    });
    assert.ok(result);
    // logicalId replaces the embedded id
    assert.equal(result.id, 'dem-src');
    assert.equal((result as any).type, 'raster-dem');
    assert.deepEqual((result as any).tiles, ['https://example.com/{z}/{x}/{y}.png']);
    assert.equal((result as any).encoding, 'mapzen');
    assert.equal((result as any).tileSize, 512);
    assert.equal((result as any).maxzoom, 15);
});

test('normalizeRawSource: raster-dem without id field returns null (not handled by normalizeRawSource)', () => {
    // raster-dem must be passed with an inline `id` to be recognised as already-normalized
    const result = normalizeRawSource('dem-src', {
        type: 'raster-dem',
        tiles: ['https://example.com/{z}/{x}/{y}.png'],
    });
    assert.equal(result, null);
});

test('normalizeRawSource: raster source with tiles array', () => {
    const result = normalizeRawSource('raster-src', {
        type: 'raster',
        tiles: ['https://tiles.example.com/{z}/{x}/{y}.png'],
    });
    assert.ok(result);
    assert.equal(result.id, 'raster-src');
    assert.equal(result.type, 'raster');
});

test('normalizeRawSource: raster source with url string normalised to array', () => {
    const result = normalizeRawSource('raster-url', {
        type: 'raster',
        url: 'https://tiles.example.com/{z}/{x}/{y}.png',
    });
    assert.ok(result);
    assert.equal(result.type, 'raster');
});

test('normalizeRawSource: geojson source', () => {
    const result = normalizeRawSource('geojson-src', {
        type: 'geojson',
        data: 'https://example.com/data.geojson',
    });
    assert.ok(result);
    assert.equal(result.type, 'geojson');
    assert.equal((result as any).data, 'https://example.com/data.geojson');
});

test('normalizeRawSource: returns null for unknown type', () => {
    const result = normalizeRawSource('unknown-src', { type: 'video' });
    assert.equal(result, null);
});

test('normalizeRawSource: already-normalized source (has id field) uses logicalId as id', () => {
    const result = normalizeRawSource('logical-id', {
        id: 'original-id',
        type: 'raster-dem',
        tiles: ['https://example.com/{z}/{x}/{y}.png'],
    });
    assert.ok(result);
    assert.equal(result.id, 'logical-id');
});

// ---------------------------------------------------------------------------
// MapLayerService.updateLayerStyle — type-based native layer lookup
// ---------------------------------------------------------------------------

test('updateLayerStyle: sets paint property on correct native layer by type suffix', () => {
    const map = makeMapMock(
        ['layer-a-src-hillshade', 'layer-a-src-fill'],
        ['src']
    );
    const svc = new MapLayerService(map, makeStore());
    // Manually register the logical→native mapping (mirrors what addLayer does internally)
    (svc as any).logicalToNative.set('layer-a', ['layer-a-src-hillshade', 'layer-a-src-fill']);

    const updated = svc.updateLayerStyle('layer-a', 'layer-a', { 'fill-color': '#ff0000' });
    assert.ok(updated);
    assert.equal(map.paintCalls.length, 1);
    assert.equal(map.paintCalls[0].layerId, 'layer-a-src-fill');
    assert.equal(map.paintCalls[0].key, 'fill-color');
    assert.equal(map.paintCalls[0].value, '#ff0000');
});

test('updateLayerStyle: hillshade-exaggeration is RAF-throttled, not called synchronously', () => {
    _rafCallbacks = [];
    const map = makeMapMock(['layer-h-src-hillshade'], ['src']);
    const svc = new MapLayerService(map, makeStore());
    (svc as any).logicalToNative.set('layer-h', ['layer-h-src-hillshade']);

    svc.updateLayerStyle('layer-h', 'layer-h', { 'hillshade-exaggeration': 0.5 });
    // No synchronous setPaintProperty call
    assert.equal(map.paintCalls.length, 0);
    // Pending entry should exist with correct value
    assert.ok((svc as any)._pendingHillshade.has('layer-h-src-hillshade'));
    assert.equal((svc as any)._pendingHillshade.get('layer-h-src-hillshade').value, 0.5);

    // After RAF flush, setPaintProperty fires with correct value
    flushRaf();
    assert.equal(map.paintCalls.length, 1);
    assert.equal(map.paintCalls[0].value, 0.5);
    assert.ok(!(svc as any)._pendingHillshade.has('layer-h-src-hillshade'));
});

test('updateLayerStyle: rapid hillshade-exaggeration calls coalesce to last value', () => {
    _rafCallbacks = [];
    const map = makeMapMock(['layer-h-src-hillshade'], ['src']);
    const svc = new MapLayerService(map, makeStore());
    (svc as any).logicalToNative.set('layer-h', ['layer-h-src-hillshade']);

    svc.updateLayerStyle('layer-h', 'layer-h', { 'hillshade-exaggeration': 0.2 });
    svc.updateLayerStyle('layer-h', 'layer-h', { 'hillshade-exaggeration': 0.5 });
    svc.updateLayerStyle('layer-h', 'layer-h', { 'hillshade-exaggeration': 0.9 });

    // Still no synchronous paint call, last value wins in pending
    assert.equal(map.paintCalls.length, 0);
    assert.equal((svc as any)._pendingHillshade.get('layer-h-src-hillshade').value, 0.9);

    // One RAF fires with last value
    flushRaf();
    assert.equal(map.paintCalls.length, 1);
    assert.equal(map.paintCalls[0].value, 0.9);
});

test('updateLayerStyle: direct composite nativeLayerId match calls setPaintProperty immediately', () => {
    // composite layers get nativeLayerId = `${styleId}-${subLayerId}`
    const compositeId = 'style-a-sub-b';
    const map = makeMapMock([compositeId], []);
    const svc = new MapLayerService(map, makeStore());

    // Direct match path (styleId !== subLayerId)
    const updated = svc.updateLayerStyle('style-a', 'sub-b', { 'line-color': '#00ff00' });
    assert.ok(updated);
    assert.equal(map.paintCalls.length, 1);
    assert.equal(map.paintCalls[0].layerId, compositeId);
    assert.equal(map.paintCalls[0].value, '#00ff00');
});

test('updateLayerStyle: returns false when layer not found', () => {
    const map = makeMapMock([], []);
    const svc = new MapLayerService(map, makeStore());
    const updated = svc.updateLayerStyle('nonexistent', 'nonexistent', { 'fill-color': '#000' });
    assert.equal(updated, false);
});

// ---------------------------------------------------------------------------
// MapLayerService.addLayer — hillshade: transition disabled on add
// ---------------------------------------------------------------------------

test('addLayer hillshade: sets hillshade-exaggeration-transition to {duration:0,delay:0}', async () => {
    const map = makeMapMock([], []);
    const svc = new MapLayerService(map, makeStore());

    const layerConfig = {
        id: 'hs-layer',
        type: 'hillshade',
        source: 'dem-src',
        sources: {
            'dem-src': {
                // id field required so normalizeRawSource recognises it as already-normalized
                id: 'dem-src',
                type: 'raster-dem',
                tiles: ['https://example.com/{z}/{x}/{y}.png'],
                encoding: 'mapzen',
            },
        },
    };

    const ok = await svc.addLayer(layerConfig as any);
    assert.ok(ok);
    const transitionCall = map.paintCalls.find(
        (c: PaintCall) => c.key === 'hillshade-exaggeration-transition'
    );
    assert.ok(transitionCall, 'hillshade-exaggeration-transition must be set on add');
    assert.deepEqual(transitionCall!.value, { duration: 0, delay: 0 });
});
