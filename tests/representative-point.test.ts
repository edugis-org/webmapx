/**
 * Which point stands in for a non-point feature in voronoi / delaunay.
 *
 * The rule is that the site must be a property of the *shape*, never of how the
 * shape was digitised, so these tests are about invariance: densify one side of
 * a polygon and the site must not move. All coordinates are EPSG:3857 metres,
 * which is what the runner hands a `compute`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { representativePoint } from '../src/utils/geoprocessing-operations';

const WORLD_WIDTH = 2 * 20037508.342789244;

/** Mean of every coordinate — what the site used to be, kept here as the thing being ruled out. */
function coordinateMean(ring: number[][]): number[] {
    const points = ring.slice(0, -1);
    return [
        points.reduce((sum, [x]) => sum + x, 0) / points.length,
        points.reduce((sum, [, y]) => sum + y, 0) / points.length,
    ];
}

/** Extra vertices along one edge, adding detail without changing the shape. */
function densifyEdge(from: number[], to: number[], steps: number): number[][] {
    const out: number[][] = [];
    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        out.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]);
    }
    return out;
}

test('a polygon site is its area centroid, unmoved by vertices added along one edge', () => {
    const square = [[0, 0], [1000, 0], [1000, 1000], [0, 1000], [0, 0]];
    // The Niger case in miniature: one border traced finely, the rest drawn with
    // two points each. The shape is identical; only the vertex count differs.
    const rocky = [
        ...densifyEdge([0, 0], [1000, 0], 200),
        [1000, 0], [1000, 1000], [0, 1000], [0, 0],
    ];

    const plain = representativePoint({ type: 'Polygon', coordinates: [square] });
    const detailed = representativePoint({ type: 'Polygon', coordinates: [rocky] });

    assert.ok(plain && detailed);
    assert.ok(Math.abs(plain[0] - 500) < 1e-6 && Math.abs(plain[1] - 500) < 1e-6, `centre of the square, got ${plain}`);
    assert.ok(Math.abs(detailed[0] - plain[0]) < 1e-6, 'densifying an edge must not move the site sideways');
    assert.ok(Math.abs(detailed[1] - plain[1]) < 1e-6, 'densifying an edge must not move the site towards that edge');

    // The fixture has to be capable of showing the bug, or the test proves nothing:
    // the coordinate mean is dragged most of the way to the detailed edge.
    assert.ok(coordinateMean(rocky)[1] < 100, `fixture is not biased enough to be a test, mean at ${coordinateMean(rocky)}`);
});

test('a polygon site accounts for holes and for the relative size of its parts', () => {
    const bigWest = [[0, 0], [1000, 0], [1000, 1000], [0, 1000], [0, 0]];
    const smallEast = [[3000, 0], [3200, 0], [3200, 200], [3000, 200], [3000, 0]];
    const site = representativePoint({ type: 'MultiPolygon', coordinates: [[bigWest], [smallEast]] });

    assert.ok(site);
    // Area weighting: 1 000 000 m² at x=500 against 40 000 m² at x=3100.
    const expected = (1e6 * 500 + 4e4 * 3100) / (1e6 + 4e4);
    assert.ok(Math.abs(site[0] - expected) < 1e-6, `parts weighted by area, expected ${expected}, got ${site[0]}`);

    // A hole in the west half pulls the centroid east; the coordinate mean cannot
    // see a hole at all, since it counts a hole's vertices like any others.
    const holed = representativePoint({
        type: 'Polygon',
        coordinates: [bigWest, [[100, 100], [500, 100], [500, 900], [100, 900], [100, 100]]],
    });
    assert.ok(holed && holed[0] > 500, `a hole in the west must move the site east, got ${holed?.[0]}`);
});

test('a line site lies on the line, halfway along it', () => {
    // An L: a length-weighted mean of the vertices sits in the empty corner.
    const line: GeoJSON.Geometry = { type: 'LineString', coordinates: [[0, 0], [0, 1000], [1000, 1000]] };
    const site = representativePoint(line);

    assert.ok(site);
    // Total length 2000, so halfway is the corner itself.
    assert.deepEqual(site, [0, 1000]);

    // Longer first leg: the halfway point is on that leg, not at the bend.
    const uneven = representativePoint({ type: 'LineString', coordinates: [[0, 0], [0, 3000], [1000, 3000]] });
    assert.ok(uneven);
    assert.deepEqual(uneven, [0, 2000]);
    assert.equal(uneven[0], 0, 'the site must be on the line, not beside it');
});

test('a multi-part line measures halfway along the total, landing on one part', () => {
    const site = representativePoint({
        type: 'MultiLineString',
        coordinates: [[[0, 0], [1000, 0]], [[5000, 0], [6000, 0]]],
    });

    assert.ok(site);
    // 2000 m of line in two reaches: halfway is the end of the first, not the
    // 3000 m of open water between the midpoints of each.
    assert.deepEqual(site, [1000, 0]);
});

test('a shape split at the antimeridian keeps its site out there, not on the prime meridian', () => {
    const east = 20037508.342789244;
    const halves: GeoJSON.Position[][][] = [
        [[[east - 200000, 0], [east, 0], [east, 200000], [east - 200000, 200000], [east - 200000, 0]]],
        [[[-east, 0], [-east + 200000, 0], [-east + 200000, 200000], [-east, 200000], [-east, 0]]],
    ];
    const site = representativePoint({ type: 'MultiPolygon', coordinates: halves });

    assert.ok(site);
    // The two halves are equal, so the centre is the date line itself — which is
    // ±half a world in metres, never 0.
    assert.ok(Math.abs(Math.abs(site[0]) - WORLD_WIDTH / 2) < 1, `expected the date line, got ${site[0]}`);
    assert.ok(Math.abs(site[1] - 100000) < 1e-6, `latitude is unaffected by the wrap, got ${site[1]}`);
});
