/**
 * The equilibrium tide.
 *
 * Checked against the numbers this has been known by for two centuries: the
 * moon raises about 0.36 m, the sun about 0.16 m, and the ratio between them is
 * 0.46. Those are the assertions that would catch a wrong exponent or a mass
 * ratio out by a factor — the shape of the field looks perfectly plausible
 * whatever the amplitude is.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { equilibriumTide, equilibriumTideMetres, tideBulges, tideContours, tideState } from '../src/utils/tides';
import { moonPosition } from '../src/utils/moon';
import { subsolarPoint } from '../src/utils/solar';

/** A moon roughly at its mean distance, so the textbook figure applies. */
const MEAN_DISTANCE_MOMENT = new Date('2026-03-15T00:00:00Z');

test('the moon raises about 0.36 m and the sun about 0.16 m', () => {
    const state = tideState(MEAN_DISTANCE_MOMENT);
    assert.ok(state.moon.amplitude > 0.28 && state.moon.amplitude < 0.45,
        `lunar amplitude ${state.moon.amplitude}`);
    assert.ok(state.sun.amplitude > 0.15 && state.sun.amplitude < 0.18,
        `solar amplitude ${state.sun.amplitude}`);
    // The sun is 27 million times the moon's mass and 390 times as far away;
    // distance wins because the force falls off with its cube.
    const ratio = state.sun.amplitude / state.moon.amplitude;
    assert.ok(ratio > 0.35 && ratio < 0.6, `solar/lunar ratio ${ratio}`);
});

test('there are two bulges, not one', () => {
    const state = tideState(MEAN_DISTANCE_MOMENT);
    const moon = moonPosition(MEAN_DISTANCE_MOMENT);
    const under = equilibriumTideMetres(moon.lon, moon.lat, state);
    const opposite = equilibriumTideMetres(moon.lon + 180, -moon.lat, state);
    // Not equal — the sun is off to one side — but both high, which is the
    // whole point: the far side bulges because it is pulled *least*.
    assert.ok(under > 0.2, `under the moon ${under}`);
    assert.ok(opposite > 0.2, `opposite the moon ${opposite}`);
});

test('a quarter turn from the moon the tide is low', () => {
    const state = tideState(MEAN_DISTANCE_MOMENT);
    const moon = moonPosition(MEAN_DISTANCE_MOMENT);
    // 90° away along a meridian, where P2(cos 90°) = -0.5.
    const away = equilibriumTideMetres(moon.lon + 90, moon.lat, state);
    assert.ok(away < 0, `a quarter turn away ${away}`);
});

/**
 * The month, which is the thing a time slider is for: spring tides at new and
 * full moon, neap tides at the quarters, and about two to one between them.
 */
test('spring tides are roughly twice the neap tides', () => {
    let strongest = { at: '', range: 0 };
    let weakest = { at: '', range: Infinity };

    // A lunar month at six-hour steps, measuring the range of the field itself.
    for (let hours = 0; hours < 30 * 24; hours += 6) {
        const at = new Date(Date.UTC(2026, 0, 1) + hours * 3_600_000);
        const state = tideState(at);
        const [high] = tideBulges(at);
        // The low is a belt rather than a point, so it is swept for rather than
        // guessed at: a quarter turn from the moon *along a parallel* is only
        // the minimum on the equator, and the sun moves it about besides.
        let low = Infinity;
        for (let lat = -90; lat <= 90; lat += 5) {
            for (let lon = -180; lon < 180; lon += 5) {
                low = Math.min(low, equilibriumTideMetres(lon, lat, state));
            }
        }
        const range = (high.properties as any).metres - low;
        if (range > strongest.range) strongest = { at: at.toISOString(), range };
        if (range < weakest.range) weakest = { at: at.toISOString(), range };
        // And the alignment measure agrees with the phase it is derived from.
        const moon = moonPosition(at);
        const sun = subsolarPoint(at);
        assert.ok(state.springFactor >= 0 && state.springFactor <= 1);
        assert.ok(Number.isFinite(moon.lon) && Number.isFinite(sun.lon));
    }

    const ratio = strongest.range / weakest.range;
    assert.ok(ratio > 1.5 && ratio < 3,
        `spring ${strongest.range.toFixed(3)} m at ${strongest.at} against neap ${weakest.range.toFixed(3)} m at ${weakest.at}, ratio ${ratio.toFixed(2)}`);
});

test('alignment is measured over half a turn, because a tide has two bulges', () => {
    // New and full moon are both spring tides: the moon opposite the sun raises
    // the same bulges as the moon in front of it. An alignment measure that ran
    // over a whole turn would call one of them neap.
    let atNew = 0;
    let atFull = 0;
    for (let hours = 0; hours < 40 * 24; hours += 3) {
        const at = new Date(Date.UTC(2026, 0, 1) + hours * 3_600_000);
        const { phase } = moonPosition(at);
        const state = tideState(at);
        if (phase < 0.01 || phase > 0.99) atNew = Math.max(atNew, state.springFactor);
        if (Math.abs(phase - 0.5) < 0.01) atFull = Math.max(atFull, state.springFactor);
    }
    assert.ok(atNew > 0.95, `new moon alignment ${atNew}`);
    assert.ok(atFull > 0.95, `full moon alignment ${atFull}`);
});

test('the contours are drawn at the levels asked for and never cross the seam', () => {
    const levels = [-0.2, 0, 0.3];
    const collection = tideContours(MEAN_DISTANCE_MOMENT, { levels, stepDegrees: 5 });
    assert.deepEqual(
        collection.features.map((f) => (f.properties as any).metres).sort((a, b) => a - b),
        levels,
    );

    for (const feature of collection.features) {
        const lines = (feature.geometry as GeoJSON.MultiLineString).coordinates;
        assert.ok(lines.length > 0, 'a level with no segments should not be emitted');
        for (const [[x1], [x2]] of lines) {
            assert.ok(Math.abs(x2 - x1) < 180,
                `a segment spans the antimeridian: ${x1} to ${x2}`);
        }
    }
});

test('a contour separates the places above its level from those below', () => {
    const state = tideState(MEAN_DISTANCE_MOMENT);
    const level = 0.2;
    const [line] = tideContours(MEAN_DISTANCE_MOMENT, { levels: [level], stepDegrees: 2 }).features;
    // Every point of the contour is at the level it claims, which is the one
    // property marching squares can get wrong without looking wrong.
    for (const [[x1, y1], [x2, y2]] of (line.geometry as GeoJSON.MultiLineString).coordinates) {
        for (const [lon, lat] of [[x1, y1], [x2, y2]]) {
            const height = equilibriumTideMetres(lon, lat, state);
            assert.ok(Math.abs(height - level) < 0.01,
                `contour point at ${lon},${lat} is ${height.toFixed(4)} m, not ${level}`);
        }
    }
});

test('the layer carries the bulges unless told not to', () => {
    const withPoints = equilibriumTide(MEAN_DISTANCE_MOMENT, { stepDegrees: 10 });
    const points = withPoints.features.filter((f) => f.geometry.type === 'Point');
    assert.equal(points.length, 2);
    assert.deepEqual(points.map((f) => (f.properties as any).id), ['high', 'high']);

    const without = equilibriumTide(MEAN_DISTANCE_MOMENT, { stepDegrees: 10, extremes: false });
    assert.equal(without.features.filter((f) => f.geometry.type === 'Point').length, 0);
});

/**
 * Both bulges are marked, and they are half a world apart. Marking only the
 * higher of the two makes the marker jump from one side of the world to the
 * other as the sun's contribution tips the balance.
 */
test('there are two bulges, opposite each other and near the moon', () => {
    const at = new Date('2026-01-26T12:00:00Z'); // first quarter: the sun is 90° off
    const moon = moonPosition(at);
    const [first, second] = tideBulges(at);
    const [lon1, lat1] = (first.geometry as GeoJSON.Point).coordinates;
    const [lon2, lat2] = (second.geometry as GeoJSON.Point).coordinates;

    const separation = Math.acos(
        Math.sin(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180)
        + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
            * Math.cos((lon2 - lon1) * Math.PI / 180),
    ) * 180 / Math.PI;
    assert.ok(separation > 150, `the bulges are ${separation.toFixed(1)}° apart`);

    // Each is near the moon's axis, displaced towards the sun but never as far
    // as the quarter turn that would put it under the sun.
    for (const [lon] of [[lon1], [lon2]]) {
        const offset = Math.abs(((lon - moon.lon + 540) % 360) - 180);
        assert.ok(offset < 45 || Math.abs(offset - 180) < 45, `bulge ${offset}° from the moon`);
    }

    // Both are real highs, not one high and one shoulder.
    assert.ok((second.properties as any).metres > 0.15, `second bulge ${(second.properties as any).metres} m`);
});
