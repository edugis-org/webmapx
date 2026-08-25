/**
 * The computed layers, checked against what they claim rather than against a
 * picture. Every one of these can look entirely convincing and be wrong: a
 * graticule with the tropics in last century's place, an indicatrix that is not
 * a true circle, a UTM grid that misses the Norway exception, a great circle
 * drawn the long way round.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { axialTilt, dayLengthLines, daylightBands, solarAltitude, subsolarPoint } from '../src/utils/solar';
import { graticule, referenceCircles } from '../src/utils/graticule';
import { antipode, destination, greatCircleRoute, rangeRings, tissotIndicatrix } from '../src/utils/geodesy-features';
import { moonAlongMeridian, moonInSkyAt, moonPathLines, moonPhaseDisc, moonPosition, phaseName } from '../src/utils/moon';
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

/**
 * The seam is a line, not a wedge.
 *
 * A cap ring is walked as a cycle, so one of its antimeridian crossings can
 * fall on the step from the last sampled point back to the first. Treating the
 * ring as a line loses that crossing's two seam points: the piece is closed
 * straight across instead, and a strip along ±180 drops out of the band. It is
 * most visible near an equinox, when the antisolar point passes close to the
 * antimeridian — 22 September 2026 11:20 UTC is such a moment.
 *
 * Checked by asking the polygon the question the polygon exists to answer —
 * is this point in darkness — and comparing with the angular distance from the
 * antisolar point, which is what darkness *is*. Before the fix this reported
 * hundreds of points along the seam as lit when they were not.
 */
test('a daylight band has no gap along the antimeridian', () => {
    const at = new Date('2026-09-22T11:20:00Z');
    const sun = subsolarPoint(at);
    const antiLon = ((sun.lon + 180 + 540) % 360) - 180;
    const antiLat = -sun.lat;
    const night = daylightBands(at).features.find((f) => (f.properties as any).id === 'night')!;
    // `night` runs from an 18° depression down, so its edge is 90 + 18 from the
    // antisolar point.
    const radius = 108 - 36;

    const inRing = (ring: number[][], x: number, y: number): boolean => {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i];
            const [xj, yj] = ring[j];
            if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
        return inside;
    };
    const covers = (x: number, y: number): boolean => {
        const geometry = night.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
        const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
        return polygons.some((poly) => inRing(poly[0], x, y)
            && !poly.slice(1).some((hole) => inRing(hole, x, y)));
    };
    const DEG = Math.PI / 180;
    const distance = (lon: number, lat: number): number => {
        const cos = Math.sin(antiLat * DEG) * Math.sin(lat * DEG)
            + Math.cos(antiLat * DEG) * Math.cos(lat * DEG) * Math.cos((lon - antiLon) * DEG);
        return Math.acos(Math.min(1, Math.max(-1, cos))) / DEG;
    };

    // A dense line of samples either side of the seam, which is where the wedge was.
    const wrong: string[] = [];
    for (let lat = -85; lat <= 85; lat += 0.5) {
        for (const lon of [-179.99, -179.9, -179.5, -179, 179, 179.5, 179.9, 179.99]) {
            const d = distance(lon, lat);
            // Skip the edge itself: which side of it a sampled ring falls on is
            // a matter of the sampling step, not of the seam.
            if (Math.abs(d - radius) < 0.5) continue;
            if (covers(lon, lat) !== (d < radius)) wrong.push(`${lon},${lat.toFixed(1)}`);
        }
    }
    assert.deepEqual(wrong, [], `points misreported along the antimeridian: ${wrong.slice(0, 5).join(' ')}`);
});

/**
 * The twilight bands are rings, and a ring cut at the seam keeps its hole.
 *
 * Each band is an outer cap with the next band's cap as a hole. Cutting both at
 * the antimeridian gives two outer pieces and two holes, and the hole was
 * matched to its piece by testing the hole's *first* vertex — which, for a cut
 * ring, sits exactly on ±180 and so lies on the boundary of the very piece it
 * is being tested against. Ray casting answers that either way: one side kept
 * its hole, the other lost it and drew its whole cap, so night, astronomical
 * and nautical twilight were painted on top of each other down one side.
 */
test('daylight bands do not overlap where they cross the antimeridian', () => {
    const at = new Date('2026-09-22T11:20:00Z');
    const bands = daylightBands(at).features;

    const inRing = (ring: number[][], x: number, y: number): boolean => {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i];
            const [xj, yj] = ring[j];
            if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
        return inside;
    };
    const covers = (feature: GeoJSON.Feature, x: number, y: number): boolean => {
        const geometry = feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
        const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
        return polygons.some((poly) => inRing(poly[0], x, y)
            && !poly.slice(1).some((hole) => inRing(hole, x, y)));
    };

    // Both sides of the seam, since only one of them lost its hole.
    const overlaps: string[] = [];
    for (let lat = -85; lat <= 85; lat += 2.5) {
        for (let lon = -180; lon <= 180; lon += 2.5) {
            const hit = bands.filter((band) => covers(band, lon, lat));
            if (hit.length > 1) {
                overlaps.push(`${lon},${lat}: ${hit.map((b) => (b.properties as any).id).join('+')}`);
            }
        }
    }
    assert.deepEqual(overlaps, [], `bands overlap: ${overlaps.slice(0, 5).join(' ')}`);
});

/**
 * The sunset band is the disagreement between two definitions of sunset.
 *
 * The polar circles are geometric: at a solstice they are exactly where the
 * sun's centre grazes the horizon at local midnight. Sunset as everyone
 * observes it is the sun's upper limb going, refraction included, which is
 * 0.833° further on — and that gap is why the day side reaches past the circles
 * and the picture looks wrong to anyone who knows where the Arctic Circle is.
 *
 * So the band straddles the geometric horizon rather than sitting under it, and
 * its middle *is* the polar circle at a solstice. That is the claim under test,
 * and it is worth testing because it only holds if the band stays symmetric
 * about altitude zero.
 */
test('the sunset band is centred on the polar circle at a solstice', () => {
    for (const iso of ['2026-06-21T12:00:00Z', '2026-12-21T12:00:00Z']) {
        const at = new Date(iso);
        const circle = 90 - axialTilt(at);
        const northern = subsolarPoint(at).lat > 0;
        const band = daylightBands(at).features.find((f) => (f.properties as any).id === 'sunset')!;
        const geometry = band.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
        const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;

        // The band's two edges at the extreme the lit pole is on: the outer ring
        // and the hole, at their furthest reach.
        const pick = (ring: number[][]) => (northern
            ? Math.max(...ring.map(([, lat]) => lat))
            : Math.min(...ring.map(([, lat]) => lat)));
        const outer = northern
            ? Math.max(...polygons.map((poly) => pick(poly[0])))
            : Math.min(...polygons.map((poly) => pick(poly[0])));
        const inner = northern
            ? Math.max(...polygons.filter((poly) => poly[1]).map((poly) => pick(poly[1])))
            : Math.min(...polygons.filter((poly) => poly[1]).map((poly) => pick(poly[1])));

        const middle = (outer + inner) / 2;
        const expected = northern ? circle : -circle;
        assert.ok(
            Math.abs(middle - expected) < 0.01,
            `${iso}: band middle ${middle.toFixed(4)} against the polar circle ${expected.toFixed(4)}`,
        );
        // And it really is a band around the horizon, not one below it.
        assert.ok(Math.abs(Math.abs(outer - inner) - 2 * 0.833) < 0.01, `${iso}: band width`);
    }
});

/**
 * The moon drawn as a shape rather than picked from a set of icons.
 *
 * Two claims worth testing, because both look plausible when wrong: the lit
 * area really is the illuminated fraction, and the lit side faces the sun. An
 * icon set gets the first wrong by rounding to eighths and the second wrong
 * always, since an icon cannot know where the sun is.
 */
function ringArea(geometry: GeoJSON.Geometry): number {
    const polygons = geometry.type === 'Polygon'
        ? [(geometry as GeoJSON.Polygon).coordinates]
        : (geometry as GeoJSON.MultiPolygon).coordinates;
    let total = 0;
    for (const polygon of polygons) {
        const ring = polygon[0];
        let twiceArea = 0;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            twiceArea += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
        }
        total += Math.abs(twiceArea / 2);
    }
    return total;
}

test('the lit area of the drawn moon is the illuminated fraction', () => {
    for (const iso of [
        '2026-01-18T12:00:00Z', // new
        '2026-01-26T12:00:00Z', // first quarter
        '2026-02-01T12:00:00Z', // waxing gibbous
        '2026-01-03T12:00:00Z', // full
        '2026-01-10T12:00:00Z', // last quarter
    ]) {
        const at = new Date(iso);
        const { illumination } = moonPosition(at);
        const [disc, lit] = moonPhaseDisc(at).features;
        const drawn = ringArea(lit.geometry) / ringArea(disc.geometry);
        assert.ok(Math.abs(drawn - illumination) < 0.05,
            `${iso}: drew ${(drawn * 100).toFixed(1)}% lit for an illumination of ${(illumination * 100).toFixed(1)}%`);
    }
});

/**
 * Where the lit shape sits, not just how big it is.
 *
 * Area alone cannot catch an orientation bug: a lit half turned 90° from the
 * sun has exactly the same area as the right one, and looks like a moon split
 * down the middle rather than a crescent. Measured along the moon-to-sun axis,
 * a crescent reaches all the way to the sun-facing rim and barely past the
 * middle, while a gibbous moon reaches nearly to the far rim.
 */
test('the lit shape lies on the sun side, and is a crescent when it should be', () => {
    const DEGREES = Math.PI / 180;
    const RADIUS = 7;

    /** How far a point lies towards the sun, in disc radii: 1 is the near rim, -1 the far one. */
    const towardsSun = (lon: number, lat: number, moonLon: number, moonLat: number, sunBearing: number) => {
        const dLon = (lon - moonLon) * DEGREES;
        const y = Math.sin(dLon) * Math.cos(lat * DEGREES);
        const x = Math.cos(moonLat * DEGREES) * Math.sin(lat * DEGREES)
            - Math.sin(moonLat * DEGREES) * Math.cos(lat * DEGREES) * Math.cos(dLon);
        const bearing = Math.atan2(y, x) / DEGREES;
        const cos = Math.sin(moonLat * DEGREES) * Math.sin(lat * DEGREES)
            + Math.cos(moonLat * DEGREES) * Math.cos(lat * DEGREES) * Math.cos(dLon);
        const distance = Math.acos(Math.min(1, Math.max(-1, cos))) / DEGREES;
        return (distance / RADIUS) * Math.cos((bearing - sunBearing) * DEGREES);
    };

    const reach = (iso: string) => {
        const at = new Date(iso);
        const moon = moonPosition(at);
        const sun = subsolarPoint(at);
        const dLon = (sun.lon - moon.lon) * DEGREES;
        const sunBearing = Math.atan2(
            Math.sin(dLon) * Math.cos(sun.lat * DEGREES),
            Math.cos(moon.lat * DEGREES) * Math.sin(sun.lat * DEGREES)
                - Math.sin(moon.lat * DEGREES) * Math.cos(sun.lat * DEGREES) * Math.cos(dLon),
        ) / DEGREES;

        const geometry = moonPhaseDisc(at).features[1].geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
        const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
        const values = polygons.flatMap((polygon) => polygon[0]
            .map(([lon, lat]) => towardsSun(lon, lat, moon.lon, moon.lat, sunBearing)));
        return { near: Math.max(...values), far: Math.min(...values), illumination: moon.illumination };
    };

    const crescent = reach('2026-01-20T12:00:00Z');
    assert.ok(crescent.illumination < 0.1, `expected a thin crescent, got ${crescent.illumination}`);
    assert.ok(crescent.near > 0.9, `a crescent should touch the sun-facing rim, reached ${crescent.near.toFixed(2)}`);
    assert.ok(crescent.far > -0.2, `a crescent should not reach the far side, reached ${crescent.far.toFixed(2)}`);

    const gibbous = reach('2026-01-29T12:00:00Z');
    assert.ok(gibbous.illumination > 0.8, `expected a gibbous moon, got ${gibbous.illumination}`);
    assert.ok(gibbous.far < -0.5, `a gibbous moon should reach past the middle, reached ${gibbous.far.toFixed(2)}`);
});

test('a new moon draws nothing lit, a full moon draws the whole disc', () => {
    const newMoon = moonPhaseDisc(new Date('2026-01-18T12:00:00Z')).features[1];
    assert.ok(ringArea(newMoon.geometry) < 0.01, 'a new moon should be dark');

    const [disc, lit] = moonPhaseDisc(new Date('2026-01-03T12:00:00Z')).features;
    assert.ok(ringArea(lit.geometry) / ringArea(disc.geometry) > 0.95, 'a full moon should be lit all over');
});

/**
 * The moon's track over a month, which is where its north-south swing becomes
 * one picture rather than a dot that has to be watched.
 *
 * The swing itself is the assertion worth making: 5.1° of orbital tilt against
 * 23.4° of the Earth's, adding or partly cancelling as the orbit's nodes turn
 * round over 18.6 years. 2024 is a major standstill and 2034 a minor one, so
 * the same month drawn ten years apart reaches ten degrees further.
 */
test('the moon path swings from tropic to tropic, by an amount that depends on the decade', () => {
    const wide = moonPathLines(new Date('2024-06-01T00:00:00Z')).features[0];
    const narrow = moonPathLines(new Date('2034-06-01T00:00:00Z')).features[0];

    const north = (feature: GeoJSON.Feature) => (feature.properties as any).northernmost as number;
    const south = (feature: GeoJSON.Feature) => (feature.properties as any).southernmost as number;

    assert.ok(north(wide) > 28 && north(wide) < 29, `major standstill reached ${north(wide)}`);
    assert.ok(north(narrow) > 18 && north(narrow) < 19, `minor standstill reached ${north(narrow)}`);
    // Symmetric about the equator, because the tilt is about the orbit, not the Earth.
    assert.ok(Math.abs(north(wide) + south(wide)) < 0.5, 'the swing should be symmetric');
});

test('the moon path is cut at the antimeridian and left open', () => {
    const track = moonPathLines(new Date('2026-01-01T00:00:00Z')).features[0];
    const lines = (track.geometry as GeoJSON.MultiLineString).coordinates;
    // A month is about 28 westward laps, so about that many pieces.
    assert.ok(lines.length > 20 && lines.length < 35, `${lines.length} pieces`);

    for (const line of lines) {
        for (let i = 1; i < line.length; i++) {
            assert.ok(Math.abs(line[i][0] - line[i - 1][0]) < 180,
                `a segment spans the seam: ${line[i - 1][0]} to ${line[i][0]}`);
        }
        // Open, not closed: a track has ends, and closing it would draw lenses.
        const [first] = line;
        const last = line[line.length - 1];
        assert.ok(first[0] !== last[0] || first[1] !== last[1], 'the track should not be closed');
    }
});

/**
 * The same crescent seen from different latitudes.
 *
 * The lit side always faces the sun, so what changes from place to place is
 * where the sun sits relative to the observer's horizon. In the tropics the
 * sun's path meets the horizon steeply and a young moon hangs with its horns
 * straight up — the "boat moon"; at 52° north that path is shallow and the same
 * crescent stands on its edge. It is a real difference of tens of degrees, and
 * a map that draws the moon turned towards the sun as seen from the centre of
 * the Earth cannot show it.
 */
test('the crescent hangs at a different angle in the tropics than in Europe', () => {
    const at = new Date('2026-01-21T17:30:00Z'); // a young crescent, evening in Europe
    const nairobi = moonInSkyAt(36.8, -1.3, at);
    const amsterdam = moonInSkyAt(4.9, 52.4, at);

    // 180° means the lit side points straight down and the horns are level.
    assert.ok(Math.abs(nairobi.tilt - 180) < 30,
        `near the equator the horns should point up, tilt ${nairobi.tilt.toFixed(0)}`);
    assert.ok(Math.abs(amsterdam.tilt - 180) > 30,
        `at 52°N the crescent should stand on its edge, tilt ${amsterdam.tilt.toFixed(0)}`);
    assert.ok(Math.abs(amsterdam.tilt - nairobi.tilt) > 45,
        'the two views should differ by tens of degrees');
});

test('the row of moons turns steadily with latitude, and skips what is below the horizon', () => {
    const at = new Date('2026-01-21T17:30:00Z');
    const features = moonAlongMeridian(at, { stepLat: 15 }).features;

    const discs = features.filter((f) => (f.properties as any).id === 'disc');
    const lits = features.filter((f) => (f.properties as any).id === 'lit');
    assert.equal(discs.length, lits.length, 'every moon needs both its disc and its lit part');

    for (const disc of discs) {
        assert.ok((disc.properties as any).altitude > 0,
            'a moon below the horizon is not a view anyone has');
    }

    // The tilt turns steadily as you go north — one way, with no jump. Which
    // way round is not the claim: the angle is measured as the observer sees
    // it, so it runs the opposite way to a compass bearing.
    const byLatitude = discs
        .map((f) => f.properties as any)
        .sort((a, b) => a.latitude - b.latitude);
    const steps = byLatitude.slice(1).map((entry, i) => {
        const raw = entry.tilt - byLatitude[i].tilt;
        return ((raw + 540) % 360) - 180;
    });
    assert.ok(steps.every((step) => Math.abs(step) < 45),
        `the tilt jumps between neighbours: ${steps.map((s) => s.toFixed(0)).join(', ')}`);
    assert.ok(steps.every((step) => Math.sign(step) === Math.sign(steps[0])),
        `the tilt should turn one way, got ${steps.map((s) => s.toFixed(0)).join(', ')}`);
    assert.ok(Math.abs(steps.reduce((total, step) => total + step, 0)) > 90,
        'the whole row should cover a wide range of angles');
});

/**
 * A row that is never empty.
 *
 * The row is drawn on the meridian where the sun has just set, which is when a
 * crescent is looked at — but near new moon the moon sets with the sun and
 * there is nothing up there to see. An empty layer is indistinguishable from a
 * broken one, and that is exactly how it was reported: switched on while the
 * clock was held still, nothing appeared; nudge the time and it came back.
 */
test('the row of moons is never empty, at any hour of a month', () => {
    let fewest = { at: '', moons: Infinity };
    for (let hours = 0; hours < 30 * 24; hours += 3) {
        const at = new Date(Date.UTC(2026, 0, 1) + hours * 3_600_000);
        const features = moonAlongMeridian(at).features;
        // Three features per moon: the disc, the lit part and a horizon.
        assert.equal(features.length % 3, 0);
        const moons = features.length / 3;
        if (moons < fewest.moons) fewest = { at: at.toISOString(), moons };
    }
    assert.ok(fewest.moons >= 3,
        `only ${fewest.moons} moons at ${fewest.at}`);
});

/**
 * The two ways of drawing the moon agree where they are about the same
 * observer.
 *
 * The moon marker is a position, turned along the bearing to the sun over the
 * ground; the row of little moons are views, turned from each observer's own
 * zenith. They differ by the parallactic angle, which is large away from the
 * moon's own meridian — and that difference is the point of the row. But for
 * someone standing directly under the moon the two are the same question, so
 * the answers have to match, and that is what makes the difference elsewhere a
 * fact rather than a bug.
 */
test('at the point the moon stands over, view and position agree', () => {
    const DEGREES = Math.PI / 180;
    for (const iso of ['2026-08-26T09:00:00Z', '2026-01-21T17:30:00Z', '2026-05-05T03:00:00Z']) {
        const at = new Date(iso);
        const moon = moonPosition(at);
        const sun = subsolarPoint(at);

        const dLon = (sun.lon - moon.lon) * DEGREES;
        const bearingToSun = ((Math.atan2(
            Math.sin(dLon) * Math.cos(sun.lat * DEGREES),
            Math.cos(moon.lat * DEGREES) * Math.sin(sun.lat * DEGREES)
                - Math.sin(moon.lat * DEGREES) * Math.cos(sun.lat * DEGREES) * Math.cos(dLon),
        ) / DEGREES) + 360) % 360;

        const { tilt, altitude } = moonInSkyAt(moon.lon, moon.lat, at);
        assert.ok(altitude > 89.9, `the moon should be overhead here, got ${altitude.toFixed(2)}`);
        const difference = Math.abs(((tilt - bearingToSun + 540) % 360) - 180);
        assert.ok(difference < 0.5,
            `${iso}: view ${tilt.toFixed(1)} against position ${bearingToSun.toFixed(1)}`);
    }
});

/**
 * Horizons are cut at the seam like everything else.
 *
 * A horizon is two points a few degrees apart. Put the row on the antimeridian
 * and those two points land either side of ±180, so a renderer draws the line
 * the long way round: a stripe across the whole world under each moon.
 */
test('a horizon line never spans the world', () => {
    // An explicit meridian is taken as given, so these are chosen where the
    // moon is actually up at this moment — otherwise there is nothing to draw
    // and nothing to assert.
    for (const lon of [179, -179, 180]) {
        const horizons = moonAlongMeridian(new Date('2026-08-26T09:00:00Z'), { lon })
            .features.filter((f) => (f.properties as any).id === 'horizon');
        assert.ok(horizons.length > 0, `no horizons drawn at ${lon}`);

        for (const horizon of horizons) {
            for (const line of (horizon.geometry as GeoJSON.MultiLineString).coordinates) {
                const lons = line.map(([x]) => x);
                assert.ok(Math.max(...lons) - Math.min(...lons) < 30,
                    `a horizon at ${lon} spans ${(Math.max(...lons) - Math.min(...lons)).toFixed(0)}°`);
            }
        }
    }
});

/**
 * The row goes where the moon can actually be seen.
 *
 * It used to sit on the evening terminator and, when the moon was not up there,
 * fall back to a meridian 60° from the moon — which near new moon is the middle
 * of the day. Reported from the map: on 8 August 2026 at 01:52 UTC the row of
 * moons stood in broad daylight, and it was never in the night.
 */
test('the row is drawn where the sky is dark, when there is such a place', () => {
    const at = new Date('2026-08-08T01:52:00Z');
    const discs = moonAlongMeridian(at).features.filter((f) => (f.properties as any).id === 'disc');
    assert.ok(discs.length > 0, 'the row should not be empty');

    const dark = discs.filter((f) => !(f.properties as any).daylight);
    assert.ok(dark.length >= discs.length - 1,
        `${dark.length} of ${discs.length} moons in a dark sky`);
    for (const disc of dark) {
        assert.ok((disc.properties as any).sunAltitude < 0);
        assert.ok((disc.properties as any).altitude > 0);
    }
});

test('a daytime row happens only around new moon', () => {
    let daylightOnly = 0;
    let sampled = 0;
    for (let hours = 0; hours < 30 * 24; hours += 3) {
        const at = new Date(Date.UTC(2026, 7, 1) + hours * 3_600_000);
        const discs = moonAlongMeridian(at).features.filter((f) => (f.properties as any).id === 'disc');
        sampled += 1;
        if (discs.every((f) => (f.properties as any).daylight)) daylightOnly += 1;
    }
    // Near new moon the moon is only ever up in daylight, which is a fact about
    // the month rather than a failure — but it should be rare.
    assert.ok(daylightOnly / sampled < 0.05,
        `the row was in daylight at ${daylightOnly} of ${sampled} moments`);
});

/**
 * Overhead, the tilt is real but unstable.
 *
 * The zenith has no azimuth, so for an observer with the moon almost straight
 * up, a step of a degree turns the crescent by up to 180°. The number drawn is
 * right for that exact spot and says nothing about the next one — which is why
 * a moon in the row can disagree sharply with the moon drawn at the point it
 * stands over, a few degrees away.
 */
test('near the zenith a degree of latitude can turn the crescent right round', () => {
    const at = new Date('2026-08-26T09:00:00Z');
    const moon = moonPosition(at);

    const north = moonInSkyAt(moon.lon, moon.lat + 1, at);
    const south = moonInSkyAt(moon.lon, moon.lat - 1, at);
    assert.ok(north.altitude > 88 && south.altitude > 88, 'both are all but overhead');

    const apart = Math.abs(((north.tilt - south.tilt + 540) % 360) - 180);
    assert.ok(apart > 150, `one degree apart, the tilts differ by ${apart.toFixed(0)}°`);

    // And the row says so, rather than leaving it to be discovered.
    const overhead = moonAlongMeridian(at, { lon: moon.lon, fromLat: moon.lat, toLat: moon.lat, stepLat: 1 })
        .features.find((f) => (f.properties as any).id === 'disc');
    assert.equal((overhead?.properties as any).nearZenith, true);
});

/**
 * The sky is seen from the inside, the map from above.
 *
 * A position angle runs from north towards east on the sky, where east lies
 * anticlockwise because the observer is inside the sphere looking up. A compass
 * bearing runs from north towards east on the ground, where east lies
 * clockwise. Same words, opposite handedness — so drawing a sky angle as a
 * bearing renders the moon as its own mirror image, and no amount of checking
 * the formulas finds it, because the formulas are right.
 *
 * Pinned against the real sky: on 26 August 2026 the moon was 96% lit and, from
 * Amsterdam late in the evening, its dark sliver sat at the top *left*.
 */
test('the crescent is drawn as the observer sees it, not mirrored', () => {
    const at = new Date('2026-08-25T23:40:00Z');
    const { illumination } = moonPosition(at);
    assert.ok(illumination > 0.9, `expected an almost full moon, got ${illumination.toFixed(2)}`);

    const { tilt, altitude } = moonInSkyAt(4.9, 52.4, at);
    assert.ok(altitude > 0, 'the moon was up over Amsterdam');

    // The dark sliver lies opposite the lit side. Top left is between 270° and
    // 360° measured clockwise from straight up.
    const dark = (tilt + 180) % 360;
    assert.ok(dark > 270 && dark < 360,
        `the dark sliver should be at the top left, drawn at ${dark.toFixed(0)}° (lit side ${tilt.toFixed(0)}°)`);
});
