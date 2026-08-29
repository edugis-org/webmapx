/**
 * Reconstructing coastlines from one present-day geometry plus a rotation table.
 *
 * The properties tested here are the ones a picture cannot show. A wrong
 * interpolation still puts every plate in the right place at every sampled age,
 * so it looks correct whenever you pause and only misbehaves while moving; a
 * ring that wraps the antimeridian the long way round looks like a rendering
 * problem rather than a data one.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPlateModel, reconstruct, slerp, type PlateRotationFile } from '../src/utils/plate-rotation';

/** A rotation of `angle` degrees about the axis through (lon, lat). */
function quaternion(lon: number, lat: number, angle: number): [number, number, number, number] {
    const rad = Math.PI / 180;
    const half = (angle * rad) / 2;
    const s = Math.sin(half);
    const cos = Math.cos(lat * rad);
    return [Math.cos(half), s * cos * Math.cos(lon * rad), s * cos * Math.sin(lon * rad), s * Math.sin(lat * rad)];
}

function point(lon: number, lat: number, props: Record<string, unknown>): GeoJSON.Feature {
    // A little square, so there is a ring to unwrap.
    return {
        type: 'Feature',
        properties: props,
        geometry: {
            type: 'Polygon',
            coordinates: [[[lon, lat], [lon + 1, lat], [lon + 1, lat + 1], [lon, lat + 1], [lon, lat]]],
        },
    };
}

function model(features: GeoJSON.Feature[], rotations: PlateRotationFile['rotations'], ages = [0, 50, 100]) {
    return buildPlateModel(
        { type: 'FeatureCollection', features },
        { model: 'TEST', ages, rotations },
    );
}

const IDENTITY: [number, number, number, number] = [1, 0, 0, 0];

test('at present day the geometry is unchanged', () => {
    const m = model([point(10, 20, { plateId: 1 })], { 1: [IDENTITY, quaternion(0, 90, 40), quaternion(0, 90, 80)] });
    const out = reconstruct(m, 0);
    const ring = (out.features[0].geometry as GeoJSON.Polygon).coordinates[0];
    assert.ok(Math.abs(ring[0][0] - 10) < 1e-9, `lon ${ring[0][0]}`);
    assert.ok(Math.abs(ring[0][1] - 20) < 1e-9, `lat ${ring[0][1]}`);
});

test('a sampled age reproduces its own rotation exactly', () => {
    const m = model([point(10, 20, { plateId: 1 })], { 1: [IDENTITY, quaternion(0, 90, 40), quaternion(0, 90, 80)] });
    const ring = (reconstruct(m, 50).features[0].geometry as GeoJSON.Polygon).coordinates[0];
    // A rotation about the pole is a pure shift in longitude.
    assert.ok(Math.abs(ring[0][0] - 50) < 1e-6, `lon ${ring[0][0]}`);
    assert.ok(Math.abs(ring[0][1] - 20) < 1e-6, `lat ${ring[0][1]}`);
});

test('between two ages the motion is steady, not merely correct at the ends', () => {
    // 0 -> 80 degrees of spin over 100 Ma. Half way must be 40, and a quarter 20:
    // component-wise interpolation gets the ends right and these wrong.
    const m = model([point(0, 0, { plateId: 1 })], { 1: [IDENTITY, quaternion(0, 90, 40), quaternion(0, 90, 80)] });
    for (const [age, expected] of [[25, 20], [50, 40], [75, 60]] as const) {
        const ring = (reconstruct(m, age).features[0].geometry as GeoJSON.Polygon).coordinates[0];
        assert.ok(Math.abs(ring[0][0] - expected) < 1e-6, `at ${age} Ma expected ${expected}, got ${ring[0][0]}`);
    }
});

test('slerp takes the short way round', () => {
    // q and -q are the same rotation; interpolating naively towards -q travels
    // almost all the way round the globe and back.
    const a = quaternion(0, 90, 10);
    const b = quaternion(0, 90, 20).map(v => -v) as [number, number, number, number];
    const mid = slerp(a, b, 0.5);
    const angle = 2 * Math.acos(Math.min(1, Math.abs(mid[0]))) * (180 / Math.PI);
    assert.ok(Math.abs(angle - 15) < 1e-6, `expected 15 degrees, got ${angle}`);
});

test('a ring carried across the antimeridian stays a small ring', () => {
    // Rotated to sit astride 180: read literally its longitudes would jump from
    // +179 to -179 and the polygon would span the whole planet.
    const m = model([point(178, 0, { plateId: 1 })], { 1: [IDENTITY, quaternion(0, 90, 3), quaternion(0, 90, 6)] });
    const ring = (reconstruct(m, 50).features[0].geometry as GeoJSON.Polygon).coordinates[0];
    const lons = ring.map(p => p[0]);
    const width = Math.max(...lons) - Math.min(...lons);
    assert.ok(width < 5, `ring spans ${width} degrees of longitude`);
});

function ringsOf(feature: GeoJSON.Feature): GeoJSON.Position[][] {
    const out: GeoJSON.Position[][] = [];
    const walk = (node: unknown): void => {
        if (!Array.isArray(node) || node.length === 0) return;
        if (typeof (node[0] as number[])[0] === 'number') { out.push(node as GeoJSON.Position[]); return; }
        for (const child of node) walk(child);
    };
    walk((feature.geometry as { coordinates?: unknown }).coordinates);
    return out;
}

test('nothing is emitted outside the world', () => {
    // Longitudes past ±180 are harmless on Mercator and on a globe, which wrap
    // them. On an equal-area projection such as Equal Earth, ±180 is the curved
    // outer edge of the map, and anything beyond it lands outside the world or
    // folded into the wrong hemisphere — which looked like the projection was
    // not equal-area near the poles, when the geometry was simply off the map.
    const m = model([point(178.5, 60, { plateId: 1 })], { 1: [IDENTITY, quaternion(0, 90, 3), quaternion(0, 90, 6)] });
    for (const age of [0, 25, 50, 75, 100]) {
        for (const feature of reconstruct(m, age).features) {
            for (const ring of ringsOf(feature)) {
                for (const [lon] of ring) {
                    assert.ok(lon >= -180.001 && lon <= 180.001, `longitude ${lon} at ${age} Ma is outside the world`);
                }
            }
        }
    }
});

test('a ring crossing the antimeridian comes back as two pieces', () => {
    const m = model([point(179.5, 10, { plateId: 1 })], { 1: [IDENTITY, IDENTITY, IDENTITY] });
    const feature = reconstruct(m, 0).features[0];
    assert.equal(feature.geometry.type, 'MultiPolygon', 'a straddling ring should be split, not left whole');
    // And the pieces sit on opposite sides.
    const sides = new Set(ringsOf(feature).map(ring => (ring[0][0] > 0 ? 'east' : 'west')));
    assert.equal(sides.size, 2, 'both pieces ended up on the same side');
});

test('no edge is long enough to cut a chord across a curved meridian', () => {
    // A GeoJSON edge is drawn straight in whatever plane the engine projects
    // into. Antarctica's ring closes with a single 180-degree step, which on
    // Equal Earth or Mollweide cuts visibly across the curve near the pole.
    const wide: GeoJSON.Feature = {
        type: 'Feature',
        properties: { plateId: 1 },
        geometry: { type: 'Polygon', coordinates: [[[-170, 80], [170, 80], [170, 84], [-170, 84], [-170, 80]]] },
    };
    const m = model([wide], { 1: [IDENTITY, IDENTITY, IDENTITY] });
    for (const ring of ringsOf(reconstruct(m, 30).features[0])) {
        for (let i = 1; i < ring.length; i++) {
            const step = Math.max(Math.abs(ring[i][0] - ring[i - 1][0]), Math.abs(ring[i][1] - ring[i - 1][1]));
            assert.ok(step <= 2.001, `a ${step.toFixed(1)} degree edge survived densification`);
        }
    }
});

test('land that has not formed yet is absent, not frozen', () => {
    const m = model(
        [point(0, 0, { plateId: 1, fromAge: 20 }), point(30, 0, { plateId: 1 })],
        { 1: [IDENTITY, IDENTITY, IDENTITY] },
    );
    assert.equal(reconstruct(m, 10).features.length, 2);
    assert.equal(reconstruct(m, 50).features.length, 1);
    // And it comes back when the slider returns.
    assert.equal(reconstruct(m, 0).features.length, 2);
});

test('each reconstruction is its own object, not the previous one rewritten', () => {
    // A shared, overwritten result hands an engine the identical object it
    // already holds, so nothing tells it to redraw — and every assertion made
    // by reading the source back still passes, because it is reading the very
    // object that was mutated. The map sits still and the tests stay green.
    const m = model([point(0, 0, { plateId: 1 })], { 1: [IDENTITY, quaternion(0, 90, 40), quaternion(0, 90, 80)] });
    const first = reconstruct(m, 0);
    const firstRing = (first.features[0].geometry as GeoJSON.Polygon).coordinates[0];
    const before = firstRing.map(p => [...p]);

    const second = reconstruct(m, 50);
    assert.notEqual(first, second, 'the same collection object came back twice');
    assert.notEqual(first.features[0], second.features[0], 'the same feature object came back twice');
    assert.notEqual(firstRing, (second.features[0].geometry as GeoJSON.Polygon).coordinates[0]);
    // And the earlier result still says what it said.
    assert.deepEqual(firstRing.map(p => [...p]), before, 'the earlier result was rewritten underneath');
});

test('features keep the properties they were given', () => {
    const m = model([point(0, 0, { plateId: 1, continent: 'Africa' })], { 1: [IDENTITY, IDENTITY, IDENTITY] });
    assert.equal(reconstruct(m, 30).features[0].properties?.continent, 'Africa');
});

test('a plate with no rotation entry is left where it is rather than dropped', () => {
    const m = model([point(10, 20, { plateId: 999 })], { 1: [IDENTITY, IDENTITY, IDENTITY] });
    const out = reconstruct(m, 60);
    assert.equal(out.features.length, 1);
    const ring = (out.features[0].geometry as GeoJSON.Polygon).coordinates[0];
    assert.ok(Math.abs(ring[0][0] - 10) < 1e-9);
});
