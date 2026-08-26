/**
 * The map's clock in a permalink.
 *
 * A link is the only way one person hands a map to another, so anything the
 * map is *showing* has to survive it — and once computed layers are a function
 * of time, the moment is part of what it is showing. These assert the three
 * decisions that shape the encoding: "now" is an absence rather than a value,
 * a pinned moment survives to the second, and a play speed only travels with a
 * moment for it to move.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// permalink.ts reads window.location; a stub is enough (no jsdom dependency).
const location = { href: 'https://example.org/map/?config=demo.json', search: '?config=demo.json' };
(globalThis as unknown as { window: unknown }).window = { location };
(globalThis as unknown as { btoa?: typeof btoa }).btoa ??= (s: string) => Buffer.from(s, 'binary').toString('base64');
(globalThis as unknown as { atob?: typeof atob }).atob ??= (s: string) => Buffer.from(s, 'base64').toString('binary');

const { buildPermalinkUrl, decodePermalink, PERMALINK_PARAM } = await import('../src/utils/permalink');

const VIEWPORT = { center: [5, 52] as [number, number], zoom: 7, bearing: 0, pitch: 0 };
const MOMENT = Date.UTC(2026, 5, 21, 12, 30, 15);

function stateOf(url: string) {
    const param = new URL(url).searchParams.get(PERMALINK_PARAM);
    assert.ok(param, 'permalink param missing');
    const state = decodePermalink(param);
    assert.ok(state, 'permalink did not decode');
    return state;
}

test('a live map stores no moment', () => {
    const state = stateOf(buildPermalinkUrl(0, ['a'], [], VIEWPORT, new Map(), null, null, false, null));
    // Absence is the encoding of "now": a link shared today has to still mean
    // now when it is opened next year.
    assert.equal(state.tm, undefined);
    assert.equal(state.tp, undefined);
});

test('a pinned moment survives to the second', () => {
    const state = stateOf(buildPermalinkUrl(0, ['a'], [], VIEWPORT, new Map(), null, null, false, { at: MOMENT }));
    assert.equal(state.tm, MOMENT / 1000);
    assert.equal(state.tm! * 1000, MOMENT);
    assert.equal(state.tp, undefined, 'a paused map stores no speed');
});

test('sub-second precision is rounded, not carried', () => {
    const state = stateOf(buildPermalinkUrl(0, ['a'], [], VIEWPORT, new Map(), null, null, false, { at: MOMENT + 400 }));
    assert.equal(state.tm, MOMENT / 1000);
});

test('play speed travels in seconds per second, only while pinned', () => {
    const hourPerSecond = 60 * 60 * 1000;
    const playing = stateOf(
        buildPermalinkUrl(0, ['a'], [], VIEWPORT, new Map(), null, null, false, { at: MOMENT, play: hourPerSecond }),
    );
    assert.equal(playing.tp, 3600);

    // A live map cannot be playing — there is no moment for a speed to move.
    const live = stateOf(
        buildPermalinkUrl(0, ['a'], [], VIEWPORT, new Map(), null, null, false, { at: null, play: hourPerSecond }),
    );
    assert.equal(live.tp, undefined);
    assert.equal(live.tm, undefined);
});

test('the clock does not disturb the rest of the state', () => {
    const withTime = stateOf(
        buildPermalinkUrl(0, ['a', 'b'], ['b'], VIEWPORT, new Map([['a', 40]]), 'globe', null, true, { at: MOMENT }),
    );
    assert.deepEqual(withTime.l, ['a', 'b']);
    assert.deepEqual(withTime.h, ['b']);
    assert.deepEqual(withTime.t, { a: 40 });
    assert.equal(withTime.p, 'globe');
    assert.equal(withTime.terrain, true);
    assert.deepEqual(withTime.v, [5, 52, 7, 0, 0]);
});

test('a permalink written before the clock existed still decodes', () => {
    const legacy = { l: ['a'], v: [5, 52, 7, 0, 0] };
    const state = decodePermalink(btoa(JSON.stringify(legacy)));
    assert.ok(state);
    // No moment means live, which is what every map did before there was a clock.
    assert.equal(state.tm, undefined);
});
