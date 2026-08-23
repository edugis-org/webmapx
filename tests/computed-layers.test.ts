/**
 * The computed layers, checked against what they claim rather than against a
 * picture. Every one of these can look entirely convincing and be wrong: a
 * graticule with the tropics in last century's place, an indicatrix that is not
 * a true circle, a UTM grid that misses the Norway exception, a great circle
 * drawn the long way round.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { axialTilt, dayLengthLines, solarAltitude, subsolarPoint } from '../src/utils/solar';
import { graticule, referenceCircles } from '../src/utils/graticule';
import { antipode, destination, greatCircleRoute, rangeRings, tissotIndicatrix } from '../src/utils/geodesy-features';
import { moonPosition, phaseName } from '../src/utils/moon';
import { utmZoneBoxes, utmZones } from '../src/utils/utm-zones';

const EARTH_RADIUS_M = 6_371_008.8;

/** Great-circle distance in metres, for checking the shapes that claim one. */
function haversine(a: number[], b: number[]): number {
    const [λ1, φ1] = [a[0] * Math.PI / 180, a[1] * Math.PI / 180];
    const [λ2, φ2] = [b[0] * Math.PI / 180, b[1] * Math.PI / 180];
    const h = Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2;
    return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

// ── The lines drawn on the Earth ─────────────────────────────────────────────

test('the tropics and polar circles follow the tilt of the axis, not a constant', () => {
    const now = referenceCircles(new Date(Date.UTC(2026, 0, 1)));
    const cancer = now.features.find((f) => f.properties?.id === 'cancer');
    const arctic = now.features.find((f) => f.properties?.id === 'arctic');
    const tilt = axialTilt(new Date(Date.UTC(2026, 0, 1)));

    assert.ok(Math.abs((cancer?.properties?.latitude as number) - tilt) < 1e-4);
    assert.ok(Math.abs((arctic?.properties?.latitude as number) - (90 - tilt)) < 1e-4);
    assert.ok(Math.abs(tilt - 23.436) < 0.01, `tilt ${tilt}`);

    // Drifting, which is the reason not to store these as a file: the Arctic
    // Circle moves about 14 metres a year.
    const then = axialTilt(new Date(Date.UTC(1926, 0, 1)));
    const metresPerYear = ((then - tilt) * 111_195) / 100;
    assert.ok(metresPerYear > 8 && metresPerYear < 20, `${metresPerYear} m/year`);
});

test('a graticule meridian is sampled, so it can curve where the projection curves', () => {
    const lines = graticule({ spacingDegrees: 30 });
    const meridian = lines.features.find((f) => f.properties?.kind === 'meridian');
    const coordinates = (meridian!.geometry as GeoJSON.LineString).coordinates;
    assert.ok(coordinates.length > 50, `${coordinates.length} points — a two-point meridian cuts corners`);
    assert.equal(coordinates[0][1], -90);
    assert.equal(coordinates[coordinates.length - 1][1], 90);
    assert.equal(lines.features.filter((f) => f.properties?.kind === 'meridian').length, 12);
});

// ── What a projection does ───────────────────────────────────────────────────

test('every Tissot circle is a true circle on the ground', () => {
    const circles = tissotIndicatrix({ spacingDegrees: 30, radiusKm: 500 });
    assert.ok(circles.features.length > 40, `${circles.features.length} circles`);
    for (const feature of circles.features) {
        const centre = feature.properties?.centre as number[];
        const ring = (feature.geometry as GeoJSON.Polygon).coordinates[0];
        for (const point of ring) {
            const km = haversine(centre, point) / 1000;
            // A circle drawn in lon/lat degrees instead would be a third out at
            // 60°N and completely wrong near the poles.
            assert.ok(Math.abs(km - 500) < 1, `${km.toFixed(1)} km from ${centre} at ${point}`);
        }
    }
});

// ── Spherical geometry about a place ─────────────────────────────────────────

test('a great circle is the short way round, and is cut at the seam', () => {
    // Amsterdam to Tokyo: 9 300 km over Siberia, not 12 000 the other way.
    const route = greatCircleRoute([4.9, 52.4], [139.7, 35.7]);
    const distance = route.features[0].properties?.distanceKm as number;
    assert.ok(Math.abs(distance - 9285) < 40, `${distance} km`);

    const geometry = route.features[0].geometry as GeoJSON.LineString | GeoJSON.MultiLineString;
    const parts = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates;
    for (const part of parts) {
        for (let i = 1; i < part.length; i++) {
            assert.ok(Math.abs(part[i][0] - part[i - 1][0]) < 180,
                `a segment jumps the antimeridian: ${part[i - 1][0]} → ${part[i][0]}`);
        }
    }
    // It really is the great circle: the route passes well north of both ends.
    const maxLat = Math.max(...parts.flat().map((p) => p[1]));
    assert.ok(maxLat > 60, `highest latitude ${maxLat} — that is a rhumb line, not a great circle`);
});

test('range rings are the distance they say', () => {
    const rings = rangeRings(5, 52, [100, 1000]);
    for (const feature of rings.features) {
        const km = feature.properties?.radiusKm as number;
        const geometry = feature.geometry as GeoJSON.LineString | GeoJSON.MultiLineString;
        const parts = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates;
        for (const point of parts.flat()) {
            assert.ok(Math.abs(haversine([5, 52], point) / 1000 - km) < 1, `${km} km ring is off at ${point}`);
        }
    }
});

test('an antipode is exactly half a world away', () => {
    const pair = antipode(4.9, 52.4);
    const [here, there] = pair.features.map((f) => (f.geometry as GeoJSON.Point).coordinates);
    const km = haversine(here, there) / 1000;
    assert.ok(Math.abs(km - Math.PI * EARTH_RADIUS_M / 1000) < 1, `${km} km apart`);
});

test('destination and distance agree with each other', () => {
    // A thousand kilometres north-east of Amsterdam, back-checked.
    const point = destination(4.9, 52.4, 45, 1_000_000);
    assert.ok(Math.abs(haversine([4.9, 52.4], point) - 1_000_000) < 100, `${haversine([4.9, 52.4], point)} m`);
});

// ── Sun and moon ─────────────────────────────────────────────────────────────

test('a day-length line really gets that many hours of daylight', () => {
    const when = new Date(Date.UTC(2026, 4, 15, 12));
    const lines = dayLengthLines(when, { hours: [8, 12, 16, 24] });
    assert.equal(lines.features.length, 4);

    for (const feature of lines.features) {
        const hours = feature.properties?.hours as number;
        const [, lat] = (feature.geometry as GeoJSON.LineString).coordinates[0];
        // Count the hours the sun is above the horizon at that latitude by
        // walking the day — the geometry claims it, so make it prove it.
        // Day length does not depend on longitude, so walk one whole UTC day at
        // the prime meridian. (Sampling a *moving* longitude would follow the
        // sun round the world and count 24 hours everywhere.)
        let up = 0;
        for (let minute = 0; minute < 1440; minute += 2) {
            const at = new Date(Date.UTC(2026, 4, 15) + minute * 60_000);
            if (solarAltitude(0, lat, at) > -0.833) up += 2;
        }
        assert.ok(Math.abs(up / 60 - hours) < 0.4, `${hours}h line at ${lat}° gets ${(up / 60).toFixed(2)}h`);
    }
});

test('the moon is somewhere sensible, and its phase agrees with the sun', () => {
    // Full moon: 2026-01-03 10:03 UTC (a published almanac time).
    const full = moonPosition(new Date(Date.UTC(2026, 0, 3, 10, 3)));
    assert.ok(full.illumination > 0.97, `illumination ${full.illumination}`);
    assert.equal(phaseName(full.phase), 'Full moon');

    // New moon a fortnight earlier: 2025-12-20 01:43 UTC.
    const isNew = moonPosition(new Date(Date.UTC(2025, 11, 20, 1, 43)));
    assert.ok(isNew.illumination < 0.03, `illumination ${isNew.illumination}`);

    // The moon stays within about 28.5° of the equator, and its distance stays
    // inside the known range of the orbit.
    for (let day = 0; day < 30; day++) {
        const moon = moonPosition(new Date(Date.UTC(2026, 0, 1) + day * 86_400_000));
        assert.ok(Math.abs(moon.lat) < 29, `sublunar latitude ${moon.lat}`);
        assert.ok(moon.distanceKm > 355_000 && moon.distanceKm < 407_000, `distance ${moon.distanceKm}`);
    }

    // And it falls behind the Earth's turn: the sublunar point shifts east by
    // roughly 12° a day, which is why moonrise is about fifty minutes later
    // each night. The rate varies from 10° to 16° over a month — the moon's
    // orbit is an ellipse — so the month's average is what can be asserted.
    const drifts: number[] = [];
    for (let day = 0; day < 28; day++) {
        const a = moonPosition(new Date(Date.UTC(2026, 0, 1 + day)));
        const b = moonPosition(new Date(Date.UTC(2026, 0, 2 + day)));
        drifts.push(((a.lon - b.lon) + 540) % 360 - 180);
    }
    const mean = drifts.reduce((sum, value) => sum + value, 0) / drifts.length;
    assert.ok(drifts.every((d) => d < 0), 'the sublunar point should shift east each day');
    assert.ok(Math.abs(mean + 12.2) < 0.5, `mean drift ${mean.toFixed(2)}° a day`);
});

// ── Grids defined by rules ───────────────────────────────────────────────────

test('the UTM grid keeps its hand-made exceptions', () => {
    const boxes = utmZoneBoxes();

    // Norway: 32V is widened at the expense of 31V, or Bergen lands in the
    // wrong zone — the exception every from-the-rule implementation misses.
    const v31 = boxes.find((b) => b.zone === 31 && b.band === 'V')!;
    const v32 = boxes.find((b) => b.zone === 32 && b.band === 'V')!;
    assert.equal(v31.east, 3, 'zone 31V was not narrowed');
    assert.equal(v32.west, 3, 'zone 32V was not widened');
    assert.equal(v32.east - v32.west, 9, 'zone 32V should be nine degrees wide');

    // Svalbard: three zones do not exist at all.
    for (const zone of [32, 34, 36]) {
        assert.equal(boxes.find((b) => b.zone === zone && b.band === 'X'), undefined, `zone ${zone}X exists`);
    }
    assert.equal(boxes.find((b) => b.zone === 33 && b.band === 'X')!.east, 21);

    // Row X reaches 84°N and is twelve degrees tall; I and O are not used.
    const x = boxes.find((b) => b.band === 'X')!;
    assert.equal(x.north, 84);
    assert.equal(x.north - x.south, 12);
    assert.equal(boxes.some((b) => b.band === 'I' || b.band === 'O'), false);
});

test('every UTM zone names the EPSG code that projects it', () => {
    const zones = utmZones();
    const north = zones.features.find((f) => f.properties?.designation === '31U')!;
    const south = zones.features.find((f) => f.properties?.designation === '31J')!;
    assert.equal(north.properties?.epsg, 32631, 'northern zone 31 is EPSG:32631');
    assert.equal(south.properties?.epsg, 32731, 'southern zone 31 is EPSG:32731');
    // Sixty zones over twenty bands, less the three Svalbard gaps.
    assert.equal(zones.features.length, 60 * 20 - 3);
});

test('the subsolar point and the graticule agree about the equator', () => {
    // A trivial-looking check that catches a whole class of sign errors: at the
    // equinox the sun is over the equator, which is where the graticule puts it.
    const equinox = new Date(Date.UTC(2026, 2, 20, 14, 46));
    assert.ok(Math.abs(subsolarPoint(equinox).lat) < 0.02);
    const equator = referenceCircles(equinox).features.find((f) => f.properties?.id === 'equator');
    assert.equal(equator?.properties?.latitude, 0);
});
