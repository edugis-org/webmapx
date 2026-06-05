import test from 'node:test';
import assert from 'node:assert/strict';

import { flatVertices, flatEdges, findSnap } from '../src/utils/snap-utils';
import type { DrawFeature } from '../src/components/webmapx-draw-tool';

// Identity project: geographic coords map 1:1 to pixel space (lng=x, lat=y)
const identityProject = (v: [number, number]): [number, number] => [v[0], v[1]];

function makeFeature(type: DrawFeature['type'], coordinates: any): DrawFeature {
    return { id: 'f1', layerId: 'l1', type, coordinates, properties: {} };
}

// ─── flatVertices ─────────────────────────────────────────────────────────────

test('flatVertices: Point returns single vertex', () => {
    const f = makeFeature('Point', [10, 20]);
    assert.deepEqual(flatVertices(f), [[10, 20]]);
});

test('flatVertices: MultiPoint returns all vertices', () => {
    const f = makeFeature('MultiPoint', [[1, 2], [3, 4]]);
    assert.deepEqual(flatVertices(f), [[1, 2], [3, 4]]);
});

test('flatVertices: LineString returns all vertices', () => {
    const f = makeFeature('LineString', [[0, 0], [1, 0], [1, 1]]);
    assert.deepEqual(flatVertices(f), [[0, 0], [1, 0], [1, 1]]);
});

test('flatVertices: Polygon includes closing vertex', () => {
    const ring = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
    const f = makeFeature('Polygon', [ring]);
    assert.deepEqual(flatVertices(f), ring);
});

test('flatVertices: MultiPolygon flattens all rings', () => {
    const r1 = [[0, 0], [1, 0], [1, 1], [0, 0]];
    const r2 = [[5, 5], [6, 5], [6, 6], [5, 5]];
    const f = makeFeature('MultiPolygon', [[r1], [r2]]);
    assert.equal(flatVertices(f).length, r1.length + r2.length);
});

// ─── flatEdges ────────────────────────────────────────────────────────────────

test('flatEdges: Point returns no edges', () => {
    const f = makeFeature('Point', [0, 0]);
    assert.equal(flatEdges(f).length, 0);
});

test('flatEdges: LineString with 3 vertices returns 2 edges', () => {
    const f = makeFeature('LineString', [[0, 0], [1, 0], [2, 0]]);
    assert.equal(flatEdges(f).length, 2);
    assert.deepEqual(flatEdges(f)[0], [[0, 0], [1, 0]]);
    assert.deepEqual(flatEdges(f)[1], [[1, 0], [2, 0]]);
});

test('flatEdges: Polygon ring [A,B,C,A] returns 3 edges (closing included via duplicate)', () => {
    // Ring has 4 coords where first == last, giving 3 real edges
    const ring = [[0, 0], [10, 0], [10, 10], [0, 0]];
    const f = makeFeature('Polygon', [ring]);
    assert.equal(flatEdges(f).length, 3);
});

test('flatEdges: MultiLineString returns edges from all lines', () => {
    const f = makeFeature('MultiLineString', [[[0, 0], [1, 0]], [[5, 5], [6, 5], [7, 5]]]);
    assert.equal(flatEdges(f).length, 3); // 1 + 2
});

// ─── findSnap: vertex snapping ────────────────────────────────────────────────

test('findSnap: returns null when no features', () => {
    const result = findSnap([5, 5], [], identityProject);
    assert.equal(result, null);
});

test('findSnap: returns null when cursor is beyond threshold', () => {
    const f = makeFeature('Point', [0, 0]);
    const result = findSnap([100, 100], [f], identityProject, { threshold: 16 });
    assert.equal(result, null);
});

test('findSnap: snaps to nearest vertex within threshold', () => {
    const f = makeFeature('LineString', [[0, 0], [20, 0]]);
    // Cursor 5px from [0,0], 15px from [20,0]
    const result = findSnap([5, 0], [f], identityProject, { threshold: 16 });
    assert.deepEqual(result, [0, 0]);
});

test('findSnap: snaps to closest of two vertices', () => {
    const f = makeFeature('LineString', [[0, 0], [10, 0]]);
    // Cursor at [8, 0] — 8px from [10,0], 8px from [0,0]... actually closer to [10,0]
    const result = findSnap([9, 0], [f], identityProject, { threshold: 16 });
    assert.deepEqual(result, [10, 0]);
});

// ─── findSnap: edge snapping ─────────────────────────────────────────────────

test('findSnap: snaps to edge midpoint when far from vertices', () => {
    // Line from [0,0] to [20,0]. Cursor at [10, 3] — 10px from each vertex, 3px from edge.
    // edgePenalty=8: edge effective dist = 3+8=11, vertex dist=~10.05 → vertex wins? No:
    // vertex at [0,0]: dist = sqrt(100+9) ≈ 10.44
    // vertex at [20,0]: dist = sqrt(100+9) ≈ 10.44
    // edge at t=0.5: point=[10,0], dist=3, effective=3+8=11 > 10.44 → vertex wins
    // So cursor must be farther from vertices to get edge snap.
    // Use cursor [10, 2]: same vertex dist ~10.2, edge effective=2+8=10 < 10.2 → edge wins
    const f = makeFeature('LineString', [[0, 0], [20, 0]]);
    const result = findSnap([10, 2], [f], identityProject, { threshold: 16, edgePenalty: 8 });
    assert.ok(result !== null);
    assert.ok(Math.abs(result![0] - 10) < 0.01, `expected x≈10, got ${result![0]}`);
    assert.ok(Math.abs(result![1] - 0) < 0.01, `expected y≈0, got ${result![1]}`);
});

test('findSnap: vertex beats edge when cursor is near both', () => {
    // Cursor is 6px from vertex [0,0] and 3px from the edge.
    // edgePenalty=8: edge effective=3+8=11 > 6 → vertex wins.
    const f = makeFeature('LineString', [[0, 0], [100, 0]]);
    const result = findSnap([6, 0], [f], identityProject, { threshold: 16, edgePenalty: 8 });
    assert.deepEqual(result, [0, 0]);
});

test('findSnap: edge beats vertex only when significantly closer', () => {
    // Line [0,0]→[100,0]. Cursor at [50,1].
    // Nearest vertex: [0,0] dist=~50.01, [100,0] dist=~50.01
    // Edge at t=0.5: point=[50,0] dist=1, effective=1+8=9 < 50 → edge wins
    const f = makeFeature('LineString', [[0, 0], [100, 0]]);
    const result = findSnap([50, 1], [f], identityProject, { threshold: 16, edgePenalty: 8 });
    assert.ok(result !== null);
    assert.ok(Math.abs(result![0] - 50) < 0.01);
});

// ─── findSnap: multiple features ─────────────────────────────────────────────

test('findSnap: snaps to nearest vertex across multiple features', () => {
    const f1 = makeFeature('Point', [10, 0]);
    const f2 = makeFeature('Point', [5, 0]);
    (f2 as any).id = 'f2';
    // Cursor at [4,0]: 6px from f2[5,0], 6px from... wait [4,0] to [5,0]=1, to [10,0]=6
    const result = findSnap([4, 0], [f1, f2], identityProject, { threshold: 16 });
    assert.deepEqual(result, [5, 0]);
});

test('findSnap: excludes feature by id via pre-filter', () => {
    // Simulate excludeFeatureId by filtering before passing to findSnap
    const f1 = makeFeature('Point', [5, 0]);
    const f2 = makeFeature('Point', [20, 0]);
    (f2 as any).id = 'f2';
    const result = findSnap([4, 0], [f2], identityProject, { threshold: 16 });
    // f1 excluded — only f2 remains, which is 16px away (just at threshold boundary, exclusive)
    assert.equal(result, null);
});

// ─── findSnap: geographic interpolation on edges ─────────────────────────────

test('findSnap: interpolates geographic coordinates on edge snap', () => {
    // Line in geo coords [0,0]→[10,0]. Cursor in px at [5,1].
    // With identity project: snaps to geo [5, 0].
    const f = makeFeature('LineString', [[0, 0], [10, 0]]);
    const result = findSnap([5, 1], [f], identityProject, { threshold: 16, edgePenalty: 0 });
    assert.ok(result !== null);
    assert.ok(Math.abs(result![0] - 5) < 0.01);
    assert.ok(Math.abs(result![1] - 0) < 0.01);
});
