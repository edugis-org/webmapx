import test from 'node:test';
import assert from 'node:assert/strict';

import { InternalSourceRefresher, refreshIntervalMs } from '../src/map/internal-source-refresh';
import { collectRefreshableSources } from '../src/utils/internal-sources';

/**
 * How often a moving layer is worth redrawing is a property of the view, not a
 * number someone picks: the terminator crosses a pixel every 21 ms at z14 and
 * every five minutes at z0, and either extreme is wrong for the other zoom.
 */
test('the refresh interval follows the zoom, one pixel of movement at a time', () => {
    const z14 = refreshIntervalMs(14, 0);
    const z10 = refreshIntervalMs(10, 0);
    const z6 = refreshIntervalMs(6, 0);

    // Measured against the ground speed of the terminator, 464 m/s.
    assert.ok(Math.abs(z14 - 21) < 3, `z14 ${z14} ms`);
    assert.ok(Math.abs(z10 - 330) < 20, `z10 ${z10} ms`);
    assert.ok(Math.abs(z6 - 5270) < 200, `z6 ${z6} ms`);
    // Four zoom levels is sixteen times the ground per pixel, and so sixteen
    // times the interval.
    assert.ok(Math.abs(z10 / z14 - 16) < 0.5, `${z10} / ${z14}`);
});

test('a Mercator pixel covers less ground away from the equator, so the interval shortens', () => {
    assert.ok(refreshIntervalMs(12, 60) < refreshIntervalMs(12, 0));
    // cos(60°) = 0.5, so half the ground, half the interval.
    assert.ok(Math.abs(refreshIntervalMs(12, 60) / refreshIntervalMs(12, 0) - 0.5) < 0.02);
});

test('the interval never runs faster than a frame or slower than a minute', () => {
    assert.equal(refreshIntervalMs(22, 0), 16, 'a deep zoom would ask for more than one redraw per frame');
    assert.equal(refreshIntervalMs(0, 0), 60_000, 'a world view would otherwise sit still for five minutes');
});

test('only a source that asked to refresh is watched', () => {
    const sources = {
        moving: { id: 'moving', type: 'geojson', data: 'internalfunc://day-night?refresh=auto' },
        pinned: { id: 'pinned', type: 'geojson', data: 'internalfunc://day-night?at=2024-06-21T12:00:00Z' },
        plain: { id: 'plain', type: 'geojson', data: 'internalfunc://sun-position' },
        remote: { id: 'remote', type: 'geojson', data: 'https://example.org/x.geojson' },
    };
    const found = collectRefreshableSources({ id: 'daynight', sources }, 'daynight');
    const urls = [...new Set(found.map((entry) => entry.url))];
    assert.deepEqual(urls, ['internalfunc://day-night?refresh=auto']);
    // Both spellings the engines use, so the caller can pick the live one.
    assert.deepEqual(found.map((entry) => entry.sourceId).sort(), ['daynight:moving', 'moving']);
});

/**
 * An animated layer re-reads its source several times a second; every one of
 * those is a load the engine reports, so without per-source suppression the
 * busy spinner blinks for as long as the layer is on the map.
 */
test('a watched source is silenced for the spinner, and only until its last layer goes', () => {
    const silenced: Array<[string, boolean]> = [];
    const refresher = new InternalSourceRefresher({
        getSource: () => undefined,
        getZoom: () => 3,
        getCentreLatitude: () => 0,
        setSourceSilent: (sourceId, silent) => silenced.push([sourceId, silent]),
        store: { getState: () => ({ mapLayers: {} }) } as never,
    });

    refresher.watch('a', [{ sourceId: 'sun', url: 'internalfunc://sun-position?refresh=auto' }]);
    refresher.watch('b', [{ sourceId: 'sun', url: 'internalfunc://sun-position?refresh=auto' }]);
    assert.deepEqual(silenced, [['sun', true], ['sun', true]]);

    // The source is still driven by layer b, so the spinner stays out of it.
    refresher.unwatch('a');
    assert.equal(silenced.length, 2);

    refresher.unwatch('b');
    assert.deepEqual(silenced[silenced.length - 1], ['sun', false]);
});

/**
 * A pinned map has no wall clock, so `?refresh=auto` has nothing to keep up
 * with. The loop stops outright rather than redrawing the same instant forever;
 * the adapter redraws those sources once when the slider moves.
 */
test('the refresh loop stops while the map clock is pinned', () => {
    const frames: Array<() => void> = [];
    const originalRaf = globalThis.requestAnimationFrame;
    const originalCaf = globalThis.cancelAnimationFrame;
    let cancelled = 0;
    globalThis.requestAnimationFrame = ((fn: () => void) => {
        frames.push(fn);
        return frames.length;
    }) as never;
    globalThis.cancelAnimationFrame = (() => { cancelled += 1; }) as never;

    try {
        const refresher = new InternalSourceRefresher({
            getSource: () => undefined,
            getZoom: () => 3,
            getCentreLatitude: () => 0,
            setSourceSilent: () => {},
            store: { getState: () => ({ mapLayers: {} }) } as never,
        });

        refresher.watch('a', [{ sourceId: 'sun', url: 'internalfunc://sun-position?refresh=auto' }]);
        assert.equal(frames.length, 1, 'a live map runs the loop');

        refresher.setLive(false);
        assert.equal(cancelled, 1, 'pinning stops the loop');

        // A layer added while pinned must not restart it.
        refresher.watch('b', [{ sourceId: 'moon', url: 'internalfunc://moon-position?refresh=auto' }]);
        assert.equal(frames.length, 1, 'watching while pinned does not start the loop');

        refresher.setLive(true);
        assert.equal(frames.length, 2, 'going live starts it again');
        // Setting the same state twice is not a second start.
        refresher.setLive(true);
        assert.equal(frames.length, 2);
    } finally {
        globalThis.requestAnimationFrame = originalRaf;
        globalThis.cancelAnimationFrame = originalCaf;
    }
});
