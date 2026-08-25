/**
 * What moving a map's clock does to the layers already on it.
 *
 * The rule the time slider rests on: pinning a moment redraws *every* computed
 * source, whether or not it asked to refresh itself, and leaves alone the ones
 * that name their own moment. A `sun-path` layer never refreshes — it is the
 * same picture all day — and still has to change when the slider moves six
 * months.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { BaseAdapter } from '../src/map/base-adapter';
import type { LayerInsertOptions } from '../src/map/IMapInterfaces';
import { subsolarPoint } from '../src/utils/solar';

const JUNE_SOLSTICE = Date.UTC(2026, 5, 21, 12, 0, 0);
const DECEMBER_SOLSTICE = Date.UTC(2026, 11, 21, 12, 0, 0);

/** A source that records what it was last drawn with, standing in for the engine's. */
class StubSource {
    data: GeoJSON.FeatureCollection | null = null;
    setDataCalls = 0;
    setData(data: GeoJSON.FeatureCollection): void {
        this.data = data;
        this.setDataCalls += 1;
    }
}

class StubAdapter extends BaseAdapter {
    readonly sources = new Map<string, StubSource>();

    protected async engineAddLayer(_layer: any, _options?: LayerInsertOptions): Promise<boolean> {
        return true;
    }
    protected engineRemoveLayer(_id: string): void {}
    protected engineRemoveSource(id: string): void {
        this.sources.delete(id);
    }
    protected engineAddSource(id: string, _config: any): void {
        this.sources.set(id, new StubSource());
    }
    getSource(id: string): any {
        return this.sources.get(id);
    }
    protected getCore(): any {
        return null;
    }
    protected getLogicalLayerExecutor(): any {
        return { moveLayer() {} };
    }
    protected getMarkerService(): any {
        return null;
    }
    setLayerOpacity(_layerId: string, _opacity: number): void {}
}

function sunLatitude(source: StubSource): number {
    const feature = source.data?.features[0];
    return (feature?.geometry as GeoJSON.Point).coordinates[1];
}

test('pinning the clock redraws computed sources that do not refresh themselves', () => {
    const adapter = new StubAdapter();
    // No `?refresh=auto`: this source would never be touched by the refresh loop.
    adapter.addSource('sun', { type: 'geojson', data: 'internalfunc://sun-position' });
    const source = adapter.sources.get('sun')!;
    assert.equal(source.setDataCalls, 0, 'added, not yet redrawn');

    adapter.store.dispatch({ mapTime: { mode: 'pinned', at: JUNE_SOLSTICE } }, 'UI');
    assert.ok(sunLatitude(source) > 23, `expected a northern sun, got ${sunLatitude(source)}`);

    adapter.store.dispatch({ mapTime: { mode: 'pinned', at: DECEMBER_SOLSTICE } }, 'UI');
    assert.ok(sunLatitude(source) < -23, `expected a southern sun, got ${sunLatitude(source)}`);
});

test('a source that names its own moment is left where it is', () => {
    const adapter = new StubAdapter();
    adapter.addSource('sun', {
        type: 'geojson',
        data: 'internalfunc://sun-position?at=2026-06-21T12:00:00Z',
    });
    const source = adapter.sources.get('sun')!;

    adapter.store.dispatch({ mapTime: { mode: 'pinned', at: DECEMBER_SOLSTICE } }, 'UI');
    assert.equal(source.setDataCalls, 0, 'a story that pinned a moment must not drift');
});

test('an unrelated store update costs no redraw', () => {
    const adapter = new StubAdapter();
    adapter.addSource('sun', { type: 'geojson', data: 'internalfunc://sun-position' });
    const source = adapter.sources.get('sun')!;

    adapter.store.dispatch({ mapTime: { mode: 'pinned', at: JUNE_SOLSTICE } }, 'UI');
    const afterPin = source.setDataCalls;

    adapter.store.dispatch({ zoomLevel: 7 }, 'MAP');
    adapter.store.dispatch({ mapBearing: 30 }, 'MAP');
    assert.equal(source.setDataCalls, afterPin, 'panning and zooming are not clock changes');

    // The same instant twice is the same picture.
    adapter.store.dispatch({ mapTime: { mode: 'pinned', at: JUNE_SOLSTICE } }, 'UI');
    assert.equal(source.setDataCalls, afterPin);
});

test('a layer added while pinned is drawn for the pinned moment', async () => {
    const adapter = new StubAdapter();
    adapter.store.dispatch({ mapTime: { mode: 'pinned', at: DECEMBER_SOLSTICE } }, 'UI');

    await adapter.addLayer({
        id: 'sun',
        type: 'style',
        sources: { sun: { type: 'geojson', data: 'internalfunc://sun-position' } },
        layers: [{ id: 'dot', type: 'circle', source: 'sun' }],
    });

    // Resolved on the way in, so the data is already right without a redraw.
    const resolved = adapter.getLayerConfigs().get('sun') as any;
    const data = resolved?.sources?.sun?.data as GeoJSON.FeatureCollection;
    const lat = (data.features[0].geometry as GeoJSON.Point).coordinates[1];
    assert.ok(lat < -23, `expected a southern sun, got ${lat}`);
});

test('going back to now redraws, rather than leaving a layer at the moment it was let go of', () => {
    const adapter = new StubAdapter();
    // No `?refresh=auto`, so the refresh loop would never touch this one.
    adapter.addSource('sun', { type: 'geojson', data: 'internalfunc://sun-position' });
    const source = adapter.sources.get('sun')!;

    adapter.store.dispatch({ mapTime: { mode: 'pinned', at: JUNE_SOLSTICE } }, 'UI');
    assert.ok(sunLatitude(source) > 23, 'pinned to the June solstice');

    adapter.store.dispatch({ mapTime: { mode: 'live' } }, 'UI');
    const today = subsolarPoint(new Date()).declination;
    assert.ok(
        Math.abs(sunLatitude(source) - today) < 0.01,
        `expected today's sun at ${today}, got ${sunLatitude(source)}`,
    );
});
