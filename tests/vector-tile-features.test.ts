/**
 * Tests for the shared vector-tile feature assembly.
 *
 * The cases that matter are the two that look alike and must not be confused:
 * a world copy (same feature, drawn again because the map shows more than one
 * world) has to disappear, while a feature a tile border cut in half has to
 * survive as both halves and be stitched back together.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { assembleTileFeatures, normalizeGeometryWrap, type TileFeatureRecord } from '../src/map/vector-tile-features';

const square = (w: number, s: number, e: number, n: number): GeoJSON.Polygon => ({
    type: 'Polygon',
    coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]],
});

const record = (
    geometry: GeoJSON.Geometry,
    tile: TileFeatureRecord['tile'],
    props: Record<string, unknown>,
    id?: string | number,
): TileFeatureRecord => ({
    feature: { type: 'Feature', geometry, properties: props },
    tile,
    id,
});

test('world copies of the same tile collapse to one feature', () => {
    // MapLibre reports canonical tile coords, so both copies of Japan arrive
    // with identical tile and identical geometry.
    const geom = square(135, 34, 140, 38);
    const tile = { z: 2, x: 3, y: 1 };
    const out = assembleTileFeatures([
        record(geom, tile, { name: 'JP' }, 1),
        record(geom, tile, { name: 'JP' }, 1),
        record(geom, tile, { name: 'JP' }, 1),
    ]);
    assert.equal(out.features.length, 1);
});

test('world copies shifted a whole world apart also collapse', () => {
    // OpenLayers serialises a wrapped copy at its shifted longitude.
    const tile = { z: 2, x: 3, y: 1 };
    const out = assembleTileFeatures([
        record(square(135, 34, 140, 38), tile, { name: 'JP' }, 1),
        record(square(135 - 360, 34, 140 - 360, 38), tile, { name: 'JP' }, 1),
        record(square(135 + 360, 34, 140 + 360, 38), tile, { name: 'JP' }, 1),
    ]);
    assert.equal(out.features.length, 1);
    const [w] = (out.features[0].geometry as GeoJSON.Polygon).coordinates[0][0];
    assert.ok(w >= -180 && w <= 180, `expected unwrapped longitude, got ${w}`);
});

test('duplicates without an id are still recognised', () => {
    const geom = square(10, 10, 20, 20);
    const tile = { z: 4, x: 8, y: 5 };
    const out = assembleTileFeatures([
        record(geom, tile, { name: 'x' }),
        record(geom, tile, { name: 'x' }),
    ]);
    assert.equal(out.features.length, 1);
});

test('two halves split by a tile border are merged, not deduplicated', () => {
    // z=1 tile boundary sits at longitude 0; a feature straddling it arrives
    // once per tile with the same id but different geometry.
    const west = { z: 1, x: 0, y: 0 };
    const east = { z: 1, x: 1, y: 0 };
    const out = assembleTileFeatures([
        record(square(-10, 10, 0, 20), west, { name: 'split' }, 7),
        record(square(0, 10, 10, 20), east, { name: 'split' }, 7),
    ]);
    assert.equal(out.features.length, 1);
    const geom = out.features[0].geometry as GeoJSON.Polygon;
    const lons = geom.coordinates[0].map(c => c[0]);
    assert.equal(Math.min(...lons), -10);
    assert.equal(Math.max(...lons), 10);
});

test('neighbouring features with different attributes are kept apart', () => {
    const west = { z: 1, x: 0, y: 0 };
    const east = { z: 1, x: 1, y: 0 };
    const out = assembleTileFeatures([
        record(square(-10, 10, 0, 20), west, { name: 'a' }, 1),
        record(square(0, 10, 10, 20), east, { name: 'b' }, 2),
    ]);
    assert.equal(out.features.length, 2);
});

test('records without tile info are deduplicated but not clipped or merged', () => {
    const geom = square(10, 10, 20, 20);
    const out = assembleTileFeatures([
        { feature: { type: 'Feature', geometry: geom, properties: { a: 1 } }, id: 3 },
        { feature: { type: 'Feature', geometry: geom, properties: { a: 1 } }, id: 3 },
        { feature: { type: 'Feature', geometry: square(20, 10, 30, 20), properties: { a: 1 } }, id: 3 },
    ]);
    assert.equal(out.features.length, 2);
});

test('the same source layer name is required for a duplicate to collapse', () => {
    const geom = square(10, 10, 20, 20);
    const tile = { z: 4, x: 8, y: 5 };
    const out = assembleTileFeatures([
        { feature: { type: 'Feature', geometry: geom, properties: {} }, tile, sourceLayer: 'water', id: 1 },
        { feature: { type: 'Feature', geometry: geom, properties: {} }, tile, sourceLayer: 'landuse', id: 1 },
    ]);
    assert.equal(out.features.length, 2);
});

test('geometry crossing the antimeridian is shifted whole, never torn', () => {
    // Continuous coordinates running past 180 must stay continuous.
    const geom = square(175, 10, 185, 20);
    const shifted = normalizeGeometryWrap(geom) as GeoJSON.Polygon;
    assert.deepEqual(shifted.coordinates, geom.coordinates);
});

test('an empty input yields an empty collection', () => {
    assert.deepEqual(assembleTileFeatures([]), { type: 'FeatureCollection', features: [] });
});
