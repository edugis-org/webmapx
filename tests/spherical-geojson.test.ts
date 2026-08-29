/**
 * Making a rotated ring safe for a flat renderer.
 *
 * Three separate failures hide behind one symptom — a polygon that swallows the
 * map — and each was mistaken for the others across two earlier attempts:
 *
 *  1. **Winding.** On a sphere a ring divides the surface in two, and which half
 *     is inside is decided by winding alone. d3 takes the interior to be on the
 *     left, so a clockwise ring means *everything except* the shape. A triangle
 *     one degree across then reports an area of 4π and fills the world.
 *  2. **Degenerate rings.** A path that goes out and comes back along itself
 *     encloses nothing, so its winding is undefined and a clipper may return
 *     either half.
 *  3. **The pole itself.** A cap closed exactly along ±90 renders inside out in
 *     OpenLayers; held back by even 0.0001° it is correct.
 *
 * Mercator and the globe never showed any of it, because nothing there goes
 * through a spherical clipper — which is why "check equirectangular *and* Equal
 * Earth" is written into these tests rather than left to memory.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { geoArea } from 'd3-geo';

import { clipToSphere, needsSphericalClip } from '../src/utils/spherical-geojson';

const polygon = (ring: GeoJSON.Position[]): GeoJSON.Geometry =>
    ({ type: 'Polygon', coordinates: [ring] });

function latitudes(geometry: GeoJSON.Geometry): number[] {
    const rings = geometry.type === 'Polygon' ? geometry.coordinates
        : geometry.type === 'MultiPolygon' ? geometry.coordinates.flat() : [];
    return rings.flat().map((point) => point[1]);
}

function longitudes(geometry: GeoJSON.Geometry): number[] {
    const rings = geometry.type === 'Polygon' ? geometry.coordinates
        : geometry.type === 'MultiPolygon' ? geometry.coordinates.flat() : [];
    return rings.flat().map((point) => point[0]);
}

test('a clockwise ring is not read as the whole world', () => {
    // The exact shape that broke this feature twice: small, ordinary, and wound
    // the way half the world's GeoJSON is wound.
    const clockwise: GeoJSON.Position[] = [[0, 0], [1, 0], [1, 1], [0, 0]];
    // The complement of the triangle: the whole sphere bar a sliver.
    assert.ok(geoArea(polygon(clockwise) as never) > 4 * Math.PI - 0.001,
        'precondition: d3 reads this ring as the complement');

    const clipped = clipToSphere(polygon(clockwise));
    assert.ok(clipped, 'a real triangle should survive');
    assert.ok(geoArea(clipped as never) < 0.01,
        `expected a small shape, got ${geoArea(clipped as never)} steradians`);
});

test('a ring enclosing nothing is dropped rather than guessed at', () => {
    const outAndBack: GeoJSON.Position[] = [
        [-11.51, -78.63], [-11.41, -78.49], [-11.22, -77.87], [-11.41, -78.49], [-11.51, -78.63],
    ];
    assert.equal(clipToSphere(polygon(outAndBack)), null);

    const twoPoints: GeoJSON.Position[] = [[0, 0], [1, 1], [0, 0]];
    assert.equal(clipToSphere(polygon(twoPoints)), null);
});

test('a cap around the pole stops just short of it', () => {
    // A ring encircling the south pole: longitudes sweep the whole way round.
    const cap: GeoJSON.Position[] = [];
    for (let lon = -180; lon <= 180; lon += 30) cap.push([lon, -85]);
    cap.push(cap[0]);

    const clipped = clipToSphere(polygon(cap));
    assert.ok(clipped, 'the cap should survive');

    const lats = latitudes(clipped as GeoJSON.Geometry);
    const lowest = Math.min(...lats);
    assert.ok(lowest < -89.99, `the cap should reach the pole, got ${lowest}`);
    assert.ok(lowest > -90, 'a ring closed exactly on ±90 renders inside out in OpenLayers');
});

test('a ring crossing the antimeridian comes back inside ±180', () => {
    const across: GeoJSON.Position[] = [[170, 10], [-170, 10], [-170, 20], [170, 20], [170, 10]];
    const clipped = clipToSphere(polygon(across));
    assert.ok(clipped);

    for (const lon of longitudes(clipped as GeoJSON.Geometry)) {
        assert.ok(lon >= -180.0001 && lon <= 180.0001, `longitude ${lon} is outside the world`);
    }
    // Cut at the antimeridian, so it arrives as two pieces rather than one
    // stretched the wrong way round the map.
    assert.equal((clipped as GeoJSON.Geometry).type, 'MultiPolygon');
});

test('an ordinary ring is left alone', () => {
    const ring: GeoJSON.Position[] = [[10, 10], [10, 20], [20, 20], [20, 10], [10, 10]];
    assert.equal(needsSphericalClip(ring), false,
        'a ring far from the poles and the antimeridian should not pay for the clipper');
});

test('rings that need the clipper are recognised', () => {
    assert.equal(needsSphericalClip([[170, 0], [-170, 0], [-170, 5], [170, 0]]), true, 'antimeridian');
    assert.equal(needsSphericalClip([[0, -88], [10, -88], [10, -85], [0, -88]]), true, 'near the pole');
});

test('a ring carried past the edge of the world is recognised at any latitude', () => {
    // Rotation does not wrap what it produces, so a piece that has drifted over
    // the antimeridian keeps counting: 204°, -201°. There is no jump between
    // neighbouring points to give it away, and it need not be anywhere near a
    // pole — the rings that left bands across the map at 382 Ma sat between 60°S
    // and 79°S, under the latitude test and with steps of a few degrees.
    const drifted: GeoJSON.Position[] = [[195, -65], [201, -66], [204, -63], [198, -62], [195, -65]];
    assert.equal(needsSphericalClip(drifted), true);

    const clipped = clipToSphere(polygon(drifted));
    assert.ok(clipped, 'the ring should survive being brought back');
    for (const lon of longitudes(clipped as GeoJSON.Geometry)) {
        assert.ok(lon >= -180.0001 && lon <= 180.0001, `longitude ${lon} is still outside the world`);
    }
});
