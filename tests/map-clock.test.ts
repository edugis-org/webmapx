/**
 * The clock a map draws its computed layers for.
 *
 * These assert the two things the rest of the time slider rests on: that a
 * pinned moment actually reaches the generators, and that an explicit `?at=`
 * in a config outranks it — a story that names a moment must not drift when
 * someone moves a slider.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { isLive, isSamePinnedTime, timeOf } from '../src/utils/map-clock';
import { resolveInternalFuncUrl, resolveInternalSources } from '../src/utils/internal-sources';
import { subsolarPoint } from '../src/utils/solar';

const JUNE_SOLSTICE = Date.UTC(2026, 5, 21, 12, 0, 0);
const DECEMBER_SOLSTICE = Date.UTC(2026, 11, 21, 12, 0, 0);

test('live is the wall clock', () => {
    const before = Date.now();
    const at = timeOf({ mode: 'live' }).getTime();
    assert.ok(at >= before && at <= Date.now());
    assert.equal(isLive({ mode: 'live' }), true);
    // An absent clock is a live one: a map that predates the field, or a store
    // stub in a test, must behave exactly as it did before.
    assert.equal(isLive(undefined), true);
});

test('pinned is the instant it was given', () => {
    assert.equal(timeOf({ mode: 'pinned', at: JUNE_SOLSTICE }).getTime(), JUNE_SOLSTICE);
    assert.equal(isLive({ mode: 'pinned', at: JUNE_SOLSTICE }), false);
});

test('an unusable pinned time falls back to now rather than an Invalid Date', () => {
    // Every generator downstream would return an empty collection for an
    // Invalid Date, which reads as a broken layer rather than a broken clock.
    const at = timeOf({ mode: 'pinned', at: Number.NaN }).getTime();
    assert.ok(Number.isFinite(at));
});

test('two pinned moments are only the same when the instant is', () => {
    assert.equal(isSamePinnedTime({ mode: 'pinned', at: 1 }, { mode: 'pinned', at: 1 }), true);
    assert.equal(isSamePinnedTime({ mode: 'pinned', at: 1 }, { mode: 'pinned', at: 2 }), false);
    // Live is never "unchanged": a live map is moving, so nothing can claim it
    // would draw the same picture twice.
    assert.equal(isSamePinnedTime({ mode: 'live' }, { mode: 'live' }), false);
});

test('a computed source is drawn for the moment it is given', () => {
    const june = resolveInternalFuncUrl('internalfunc://sun-position', new Date(JUNE_SOLSTICE));
    const december = resolveInternalFuncUrl('internalfunc://sun-position', new Date(DECEMBER_SOLSTICE));

    const latOf = (fc: GeoJSON.FeatureCollection) =>
        (fc.features[0].geometry as GeoJSON.Point).coordinates[1];

    // The subsolar point sits on the tropics at the solstices, one each side.
    assert.ok(latOf(june) > 23, `expected a northern sun, got ${latOf(june)}`);
    assert.ok(latOf(december) < -23, `expected a southern sun, got ${latOf(december)}`);
    assert.ok(Math.abs(latOf(june) - subsolarPoint(new Date(JUNE_SOLSTICE)).declination) < 0.01);
});

test('an explicit ?at= outranks the clock it is resolved with', () => {
    const pinnedInUrl = 'internalfunc://sun-position?at=2026-06-21T12:00:00Z';
    const drawnInDecember = resolveInternalFuncUrl(pinnedInUrl, new Date(DECEMBER_SOLSTICE));
    const lat = (drawnInDecember.features[0].geometry as GeoJSON.Point).coordinates[1];
    assert.ok(lat > 23, `the url's own moment should win, got ${lat}`);
});

test('the moment reaches every source in a nested layer', () => {
    const layer = {
        id: 'day-length',
        type: 'style',
        sources: {
            'a': { type: 'geojson', data: 'internalfunc://sun-position' },
            'b': { type: 'geojson', data: 'internalfunc://sun-position?at=2026-06-21T12:00:00Z' },
        },
    };
    const resolved = resolveInternalSources(layer, new Date(DECEMBER_SOLSTICE)) as typeof layer & {
        sources: Record<string, { data: GeoJSON.FeatureCollection }>;
    };

    const latOf = (key: string) =>
        (resolved.sources[key].data.features[0].geometry as GeoJSON.Point).coordinates[1];

    assert.ok(latOf('a') < -23, 'a source with no ?at= follows the clock');
    assert.ok(latOf('b') > 23, 'a source with ?at= keeps its own moment');
});

test('no clock at all still means now', () => {
    // The default argument is what keeps every existing caller working while
    // only some of them have been taught about the map's clock.
    const fc = resolveInternalFuncUrl('internalfunc://sun-position');
    assert.equal(fc.features.length, 1);
});
