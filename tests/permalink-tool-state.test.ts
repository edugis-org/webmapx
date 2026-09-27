/**
 * Tools that own layers, in a permalink.
 *
 * A layer a tool added (the sea level tool's coastal zones, the deep-time
 * tool's coastlines) is known to no catalog, and the engine opening the link
 * may need it in another format — so a link must not list it for the catalog
 * to look up, which reported it as "could not be restored". The tool's state
 * travels instead, and the tool rebuilds the layer from it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const location = { href: 'https://example.org/map/?config=demo.json', search: '?config=demo.json' };
(globalThis as unknown as { window: unknown }).window = { location };
(globalThis as unknown as { btoa?: typeof btoa }).btoa ??= (s: string) => Buffer.from(s, 'binary').toString('base64');
(globalThis as unknown as { atob?: typeof atob }).atob ??= (s: string) => Buffer.from(s, 'base64').toString('binary');

const { permalinkStateFrom, encodePermalink, decodePermalink } = await import('../src/utils/permalink');
const { snapshotMapForPermalink } = await import('../src/utils/permalink-state');

/** Just enough of an adapter for `snapshotMapForPermalink`. */
function adapterWith(state: Record<string, unknown>) {
    return {
        store: { getState: () => state },
        isTerrainEnabled: () => false,
        getViewportState: () => ({ center: [0, 0] as [number, number], zoom: 2, bearing: 0, pitch: 0 }),
        getProjection: () => null,
    } as never;
}

test("a tool's own layers are left out of the layer list, and its state travels instead", () => {
    const snapshot = snapshotMapForPermalink(adapterWith({
        mapLayers: {
            osm: {},
            'coastal-zones': { ownerTool: 'sealevel', visible: false },
            'deeptime-coastlines': { ownerTool: 'deeptime', dynamic: true },
            upload: { dynamic: true },
        },
        toolStates: { sealevel: { lv: -60 }, deeptime: { ma: 250, m: 'muller2019', c: 1 } },
        mapTime: { mode: 'live' },
    }));

    assert.deepEqual(snapshot.layerIds, ['osm', 'upload']);
    // Not "could not be carried" either: the tool carries it.
    assert.deepEqual(snapshot.dynamicLayerIds, ['upload']);
    assert.deepEqual(snapshot.hiddenLayerIds, []);
    assert.deepEqual(snapshot.tools, { sealevel: { lv: -60 }, deeptime: { ma: 250, m: 'muller2019', c: 1 } });

    const decoded = decodePermalink(encodePermalink(permalinkStateFrom(snapshot)));
    assert.deepEqual(decoded?.x, snapshot.tools);
    assert.deepEqual(decoded?.l, ['osm', 'upload']);
});

test('a map without tool state writes no x', () => {
    const snapshot = snapshotMapForPermalink(adapterWith({ mapLayers: { osm: {} }, mapTime: { mode: 'live' } }));
    assert.equal(permalinkStateFrom(snapshot).x, undefined);
});
