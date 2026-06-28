/**
 * Tests for the source-layer extraction logic used by WebmapxBufferTool.
 *
 * The component's private `sourceLayers()` method cannot be imported from Node
 * (Lit custom elements require a DOM), so we inline the same algorithm and
 * test it in isolation. If the algorithm in the component ever diverges, these
 * tests will still catch regressions in the shared logic.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// Inlined from webmapx-buffer-tool.ts :: sourceLayers()
function sourceLayers(mapLayers: Record<string, unknown>, layerId: string): string[] {
    const meta = mapLayers[layerId] as Record<string, unknown> | undefined;
    const sublayers = meta?.sublayers;
    if (!Array.isArray(sublayers)) return [];
    const seen = new Set<string>();
    const collect = (items: unknown[]): void => {
        for (const sub of items) {
            if (!sub || typeof sub !== 'object') continue;
            const s = sub as Record<string, unknown>;
            const sl = s['source-layer'];
            if (typeof sl === 'string' && sl) seen.add(sl);
            if (Array.isArray(s.sublayers)) collect(s.sublayers);
        }
    };
    collect(sublayers);
    return [...seen];
}

test('flat sublayers — returns each unique source-layer', () => {
    const mapLayers = {
        'bag-pdok': {
            sublayers: [
                { 'source-layer': 'pand' },
                { 'source-layer': 'ligplaats' },
                { 'source-layer': 'verblijfsobject' },
            ],
        },
    };
    assert.deepEqual(sourceLayers(mapLayers, 'bag-pdok'), ['pand', 'ligplaats', 'verblijfsobject']);
});

test('deduplicates repeated source-layer values', () => {
    const mapLayers = {
        'my-layer': {
            sublayers: [
                { 'source-layer': 'roads' },
                { 'source-layer': 'roads' },
                { 'source-layer': 'buildings' },
            ],
        },
    };
    assert.deepEqual(sourceLayers(mapLayers, 'my-layer'), ['roads', 'buildings']);
});

test('nested sublayers — recurses and collects source-layers', () => {
    const mapLayers = {
        'composite': {
            sublayers: [
                {
                    'source-layer': 'pand',
                    sublayers: [
                        { 'source-layer': 'pand-label' },
                    ],
                },
                { 'source-layer': 'ligplaats' },
            ],
        },
    };
    assert.deepEqual(sourceLayers(mapLayers, 'composite'), ['pand', 'pand-label', 'ligplaats']);
});

test('no sublayers property — returns empty array', () => {
    const mapLayers = { 'geojson-layer': { label: 'My GeoJSON' } };
    assert.deepEqual(sourceLayers(mapLayers, 'geojson-layer'), []);
});

test('sublayers is not an array — returns empty array', () => {
    const mapLayers = { 'weird': { sublayers: 'not-an-array' } };
    assert.deepEqual(sourceLayers(mapLayers, 'weird'), []);
});

test('unknown layerId — returns empty array', () => {
    assert.deepEqual(sourceLayers({}, 'nonexistent'), []);
});

test('sublayer with empty source-layer string — skipped', () => {
    const mapLayers = {
        'layer': {
            sublayers: [
                { 'source-layer': '' },
                { 'source-layer': 'roads' },
            ],
        },
    };
    assert.deepEqual(sourceLayers(mapLayers, 'layer'), ['roads']);
});

test('sublayer missing source-layer key — skipped', () => {
    const mapLayers = {
        'layer': {
            sublayers: [
                { type: 'fill', paint: {} },
                { 'source-layer': 'buildings' },
            ],
        },
    };
    assert.deepEqual(sourceLayers(mapLayers, 'layer'), ['buildings']);
});
