/**
 * Day, twilight and night, checked against the astronomy rather than against a
 * picture.
 *
 * Every assertion here samples points over the whole globe and asks two
 * questions of each: what the sun's altitude is there, and which band the
 * geometry puts it in. A terminator can look perfectly plausible and be an hour
 * out, or be drawn the long way round the Pacific — neither shows up in a
 * screenshot the way it shows up in a count of misplaced points.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    DAYLIGHT_BANDS,
    daylightBands,
    solarAltitude,
    sphericalCapRings,
    subsolarPoint,
    subsolarTimeAtLongitude,
    sunPathLines,
    sunPositionFeature,
} from '../src/utils/solar';

/** Ray casting on a lon/lat ring: good enough away from the seam, which is where we sample. */
function inRing(ring: number[][], lon: number, lat: number): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

function inFeature(feature: GeoJSON.Feature, lon: number, lat: number): boolean {
    const geometry = feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
    const polygons: number[][][][] = geometry.type === 'Polygon'
        ? [geometry.coordinates as number[][][]]
        : (geometry.coordinates as number[][][][]);
    for (const rings of polygons) {
        if (!inRing(rings[0], lon, lat)) continue;
        const inHole = rings.slice(1).some((hole) => inRing(hole, lon, lat));
        if (!inHole) return true;
    }
    return false;
}

/**
 * The moment of the March 2024 equinox, to the minute (NOAA). The sun stands
 * over the equator then, which is the one position that can be checked without
 * trusting the same formulas that produced it.
 */
const EQUINOX = new Date(Date.UTC(2024, 2, 20, 3, 6));

test('the subsolar point is on the equator at the equinox', () => {
    const sun = subsolarPoint(EQUINOX);
    assert.ok(Math.abs(sun.declination) < 0.02, `declination ${sun.declination}`);
});

test('the subsolar point tracks solar noon, equation of time included', () => {
    // At 12:00 UTC the sun is over Greenwich give or take the equation of time,
    // which in February runs to a quarter of an hour — four degrees.
    const february = subsolarPoint(new Date(Date.UTC(2024, 1, 11, 12, 0)));
    assert.ok(Math.abs(february.lon) < 5, `lon ${february.lon}`);
    assert.ok(february.equationOfTime < -13, `equation of time ${february.equationOfTime}`);
    // A day is 360 degrees: six hours later it is a quarter of the world west.
    const sixLater = subsolarPoint(new Date(Date.UTC(2024, 1, 11, 18, 0)));
    const moved = ((february.lon - sixLater.lon) + 360) % 360;
    assert.ok(Math.abs(moved - 90) < 0.2, `moved ${moved} degrees in six hours`);
});

test('the solstice sun stands over the tropics', () => {
    const june = subsolarPoint(new Date(Date.UTC(2024, 5, 20, 20, 51)));
    assert.ok(Math.abs(june.declination - 23.44) < 0.05, `June ${june.declination}`);
    const december = subsolarPoint(new Date(Date.UTC(2024, 11, 21, 9, 20)));
    assert.ok(Math.abs(december.declination + 23.44) < 0.05, `December ${december.declination}`);
});

test('a cap that reaches over a pole is closed along it, not left open', () => {
    // Centred near the north pole, so the cap contains it.
    const rings = sphericalCapRings(0, 80, 30);
    assert.equal(rings.length, 1, 'a pole-enclosing cap is one ring');
    const ring = rings[0];
    assert.ok(ring.some(([, lat]) => lat === 90), 'the ring never reaches the pole it encloses');
    assert.ok(ring.every(([lon]) => lon >= -180 && lon <= 180), 'a coordinate escaped the world');
    // The Esri data stops at ±85 and leaves the cap open; this one must not.
    const north = ring.filter(([, lat]) => lat > 85).length;
    assert.ok(north > 0, 'nothing above 85 degrees');
});

test('a cap crossing the antimeridian is cut there rather than drawn round the world', () => {
    const rings = sphericalCapRings(180, 0, 20);
    assert.equal(rings.length, 2, `expected two halves, got ${rings.length}`);
    for (const ring of rings) {
        const lons = ring.map(([lon]) => lon);
        // Each half stays on its own side: no segment may jump the seam.
        for (let i = 1; i < lons.length; i++) {
            assert.ok(Math.abs(lons[i] - lons[i - 1]) < 180,
                `a segment jumps from ${lons[i - 1]} to ${lons[i]}`);
        }
    }
});

/**
 * The real test: for a grid of points over the whole globe, the band the
 * geometry puts a point in must be the band its sun altitude says it is in.
 */
for (const when of [
    new Date(Date.UTC(2024, 5, 21, 12, 0)),   // northern summer: the Arctic never sets
    new Date(Date.UTC(2024, 11, 21, 0, 0)),   // southern summer, and the seam over Europe
    new Date(Date.UTC(2024, 2, 20, 3, 6)),    // equinox: the terminator through both poles
]) {
    test(`the bands agree with the sun's altitude at ${when.toISOString()}`, () => {
        const collection = daylightBands(when);
        assert.equal(collection.features.length, DAYLIGHT_BANDS.length);

        let checked = 0;
        let wrong = 0;
        for (let lat = -85; lat <= 85; lat += 5) {
            for (let lon = -175; lon <= 175; lon += 5) {
                const altitude = solarAltitude(lon, lat, when);
                // Points within a tenth of a degree of a boundary are the ring
                // itself; which side they fall on is not a fact worth asserting.
                const boundaries = [-0.833, -6, -12, -18];
                if (boundaries.some((edge) => Math.abs(altitude - edge) < 0.15)) continue;

                const expected = altitude > -0.833 ? null
                    : altitude > -6 ? 'civil'
                    : altitude > -12 ? 'nautical'
                    : altitude > -18 ? 'astronomical'
                    : 'night';

                const found = collection.features
                    .filter((feature) => inFeature(feature, lon, lat))
                    .map((feature) => feature.properties?.id as string);

                checked += 1;
                const hit = expected === null ? found.length === 0 : found.includes(expected);
                if (!hit) wrong += 1;
            }
        }
        assert.ok(checked > 1500, `only ${checked} points were checked`);
        assert.equal(wrong, 0, `${wrong} of ${checked} points fell in the wrong band`);
    });
}

test('the sun position is a point where the sun is overhead', () => {
    const when = new Date(Date.UTC(2024, 6, 4, 9, 30));
    const [feature] = sunPositionFeature(when).features;
    const [lon, lat] = (feature.geometry as GeoJSON.Point).coordinates;
    assert.ok(Math.abs(solarAltitude(lon, lat, when) - 90) < 0.01, 'the sun is not overhead at its own position');
});

test('a sun path is one line per day, each crossing the whole world', () => {
    const year = sunPathLines(new Date(Date.UTC(2026, 6, 1)), { stepDegrees: 10 });
    // Solstice to solstice by default: the return half of the year retraces the
    // same latitudes, so those lines would land on top of ones already drawn.
    assert.ok(year.features.length > 180 && year.features.length < 187, `${year.features.length} lines`);
    assert.equal(year.features[0].properties?.solstice, 'june');
    assert.equal(year.features[year.features.length - 1].properties?.solstice, 'december');
    assert.equal(sunPathLines(new Date(Date.UTC(2026, 6, 1)), { stepDegrees: 30, span: 'year' }).features.length, 365);
    assert.equal(sunPathLines(new Date(Date.UTC(2024, 6, 1)), { stepDegrees: 30, span: 'year' }).features.length, 366, 'a leap year has one more');

    for (const feature of year.features) {
        const line = (feature.geometry as GeoJSON.LineString).coordinates;
        assert.equal(line[0][0], -180, 'a line starts short of the antimeridian');
        assert.equal(line[line.length - 1][0], 180, 'a line stops short of the antimeridian');
        // Longitude only ever increases: no wrap, no cut, one stroke.
        for (let i = 1; i < line.length; i++) {
            assert.ok(line[i][0] > line[i - 1][0], `longitude went backwards at ${line[i][0]}`);
        }
    }
});

test('the paths stay between the tropics and turn at the solstices', () => {
    const year = sunPathLines(new Date(Date.UTC(2026, 6, 1)), { stepDegrees: 10 });
    const lats = year.features.flatMap((f) => (f.geometry as GeoJSON.LineString).coordinates.map((c) => c[1]));
    assert.ok(Math.max(...lats) <= 23.44 && Math.max(...lats) > 23.4, `north ${Math.max(...lats)}`);
    assert.ok(Math.min(...lats) >= -23.44 && Math.min(...lats) < -23.4, `south ${Math.min(...lats)}`);

    // The lines crowd at the solstices, where declination barely changes, and
    // spread at the equinoxes. That is the shape of the whole picture.
    const gap = (index: number) => Math.abs(
        (year.features[index].properties?.declination as number)
        - (year.features[index - 1].properties?.declination as number));
    const solstice = gap(2);                       // just after the June solstice
    const equinox = gap(Math.floor(year.features.length / 2));  // the September crossing
    assert.ok(equinox > solstice * 5, `equinox ${equinox} vs solstice ${solstice}`);
});

/**
 * The line is only worth drawing if the sun really is overhead along it: a
 * plausible-looking sinusoid can be an hour out and nothing would show.
 */
test('the sun stands overhead at every point of a sun path', () => {
    const year = sunPathLines(new Date(Date.UTC(2026, 6, 1)), { stepDegrees: 30 });
    for (const index of [0, 45, 90, 135, year.features.length - 1]) {
        const feature = year.features[index];
        // From the date the line names: the half-cycle can straddle New Year,
        // where a day-of-year number would mean two different things.
        const dayStart = Date.parse(`${feature.properties?.date}T00:00:00Z`);
        for (const [lon, lat] of (feature.geometry as GeoJSON.LineString).coordinates) {
            const when = subsolarTimeAtLongitude(dayStart, lon);
            const altitude = solarAltitude(lon, lat, when);
            assert.ok(Math.abs(altitude - 90) < 0.05,
                `${feature.properties?.date} at ${lon}: sun ${altitude.toFixed(3)}° above the horizon, not overhead`);
        }
    }
});
