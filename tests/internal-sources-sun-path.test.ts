/**
 * `sun-path`'s query parameters, independent of each other.
 *
 * `span` decides the window width and `at` decides where it sits — every
 * combination has to work the same regardless of what the others say. `?year=`
 * is a convenience that moves `at` to that year (as 1 July); it must not also
 * change what `span` defaults to, which was the bug this pins: `?year=2026`
 * alone used to force a full calendar year, silently overriding a `span` that
 * had not even been asked about, and `?year=2026&span=solstice-to-solstice`
 * had no way to ask for anything but the year regardless.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { INTERNAL_SOURCES } from '../src/utils/internal-sources';

function run(at: Date, qs: string) {
    const fc = INTERNAL_SOURCES['sun-path']({ at, query: new URLSearchParams(qs) } as never);
    const dates = fc.features.map(f => f.properties!.date as string).sort();
    return { n: fc.features.length, first: dates[0], last: dates[dates.length - 1] };
}

const at = new Date('2026-09-15T12:00:00Z');

test('no parameters: the solstice-to-solstice half around the current moment', () => {
    const r = run(at, '');
    assert.ok(r.n > 180 && r.n < 187, `${r.n} lines`);
});

test('span alone picks the window, whatever year happens to be current', () => {
    assert.equal(run(at, 'span=day').n, 1);
    assert.equal(run(at, 'span=half-year').n, 183);
    assert.equal(run(at, 'span=year').n, 365);
});

test('year moves the anchor to that year, without changing the default span', () => {
    const pinned = run(at, 'year=2020');
    // Both must default to solstice-to-solstice: a half-year window, not a
    // fixed count — the exact length wanders by a day depending on which
    // year's solstices are being straddled, so the invariant is the range,
    // not equality with the unpinned case.
    assert.ok(pinned.n > 180 && pinned.n < 187, `expected a solstice-to-solstice window, got ${pinned.n} lines`);
    assert.ok(pinned.first!.startsWith('2019') || pinned.first!.startsWith('2020'), `expected 2019/2020, got ${pinned.first}`);
});

test('year and span combine instead of one silently winning', () => {
    assert.equal(run(at, 'year=2020&span=day').n, 1);
    assert.equal(run(at, 'year=2020&span=day').first, '2020-07-01');

    const wholeYear = run(at, 'year=2020&span=year');
    assert.equal(wholeYear.first, '2020-01-01');
    assert.equal(wholeYear.last, '2020-12-31');

    // The order the parameters are written in must not matter, and asking for
    // a year without also saying span=year must not silently produce one.
    const notForcedToYear = run(at, 'year=2020&span=solstice-to-solstice');
    assert.notEqual(notForcedToYear.n, 365, 'span=solstice-to-solstice must survive year being present');
});
