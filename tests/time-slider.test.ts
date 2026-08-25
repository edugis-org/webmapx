/**
 * The arithmetic under the two sliders.
 *
 * Everything here is UTC on purpose. The generators compute in UTC, and a local
 * day is the one place a time control quietly breaks: on a DST boundary one
 * local day is 23 or 25 hours long, so a slider measured in local days would
 * skip an hour in spring and offer the same hour twice in autumn.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    dayOffset,
    formatMinute,
    formatUtcDate,
    instantAt,
    minuteOfUtcDay,
    shiftYears,
    startOfUtcDay,
} from '../src/utils/time-slider-math';

const JUNE_SOLSTICE = Date.UTC(2026, 5, 21, 12, 30, 0);

test('a day starts at UTC midnight', () => {
    assert.equal(startOfUtcDay(JUNE_SOLSTICE), Date.UTC(2026, 5, 21));
    assert.equal(startOfUtcDay(Date.UTC(2026, 5, 21)), Date.UTC(2026, 5, 21), 'midnight is its own start');
});

test('the minute slider reads minutes past UTC midnight', () => {
    assert.equal(minuteOfUtcDay(JUNE_SOLSTICE), 12 * 60 + 30);
    assert.equal(minuteOfUtcDay(Date.UTC(2026, 5, 21, 0, 0, 0)), 0);
    assert.equal(minuteOfUtcDay(Date.UTC(2026, 5, 21, 23, 59, 0)), 24 * 60 - 1);
});

test('the date slider counts whole days either way', () => {
    const origin = Date.UTC(2026, 5, 21, 8, 0, 0);
    assert.equal(dayOffset(origin, Date.UTC(2026, 5, 21, 23, 0, 0)), 0, 'same day, later hour');
    assert.equal(dayOffset(origin, Date.UTC(2026, 5, 22, 1, 0, 0)), 1);
    assert.equal(dayOffset(origin, Date.UTC(2026, 5, 20, 23, 0, 0)), -1);
    assert.equal(dayOffset(origin, Date.UTC(2026, 11, 21, 12, 0, 0)), 183, 'half a year, the slider\'s reach');
});

test('the two sliders compose into one instant', () => {
    const origin = Date.UTC(2026, 5, 21, 8, 0, 0);
    const at = instantAt(origin, 5, 13 * 60 + 45);
    assert.equal(at, Date.UTC(2026, 5, 26, 13, 45, 0));
    // And back out again, which is what makes dragging one slider leave the
    // other where it was.
    assert.equal(dayOffset(origin, at), 5);
    assert.equal(minuteOfUtcDay(at), 13 * 60 + 45);
});

test('moving one slider does not disturb the other, across a DST boundary', () => {
    // Europe/Amsterdam springs forward on 29 March 2026; in UTC nothing happens,
    // which is exactly why the sliders are measured there.
    const origin = Date.UTC(2026, 2, 28, 12, 0, 0);
    const minute = 2 * 60 + 30;
    const before = instantAt(origin, 0, minute);
    const after = instantAt(origin, 1, minute);
    assert.equal(after - before, 24 * 60 * 60 * 1000, 'every day on the slider is 24 hours long');
    assert.equal(minuteOfUtcDay(after), minute, 'the time of day survives a change of date');
});

test('a moment reads as the date and clock the computations use', () => {
    assert.equal(formatUtcDate(JUNE_SOLSTICE), '2026-06-21');
    assert.equal(formatMinute(minuteOfUtcDay(JUNE_SOLSTICE)), '12:30');
    assert.equal(formatMinute(0), '00:00');
    assert.equal(formatMinute(24 * 60 - 1), '23:59');
});

test('a minute past the end of a day wraps rather than reading 24:00', () => {
    // Play advances the pinned moment freely, so the reading has to survive a
    // value that has run past midnight before the date catches up.
    assert.equal(formatMinute(24 * 60), '00:00');
    assert.equal(formatMinute(-1), '23:59');
});

/**
 * Wrapping the player at the end of its range.
 *
 * By a calendar year, not by a number of days: the point of looping is to see
 * the same season come round, and only the calendar keeps a date meaning the
 * same part of the year. 366 days a lap would walk the seasons forward by about
 * three quarters of a day, 365 would walk them back by a quarter.
 */
test('a year back is the same date and the same time of day', () => {
    const at = Date.UTC(2026, 1, 2, 18, 20);
    const back = shiftYears(at, -1);
    assert.equal(new Date(back).toISOString(), '2025-02-02T18:20:00.000Z');
    assert.equal(minuteOfUtcDay(back), minuteOfUtcDay(at), 'the time of day is untouched');
    // And it is reversible, which is what makes wrapping either way symmetric.
    assert.equal(shiftYears(back, 1), at);
});

test('a leap day wraps to the day after, having nowhere else to go', () => {
    const leapDay = Date.UTC(2028, 1, 29, 12, 0);
    assert.equal(new Date(shiftYears(leapDay, -1)).toISOString(), '2027-03-01T12:00:00.000Z');
});
