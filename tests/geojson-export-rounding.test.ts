/**
 * Coordinate rounding on export.
 *
 * Anything computed in JS carries full double precision, which is most of the
 * exported file and none of the information: seven decimals is ~1.1 cm.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { roundGeometryForExport, writeGeoJSONForExport } from '../src/components/webmapx-save-layers-dialog';

const feature = (geometry: GeoJSON.Geometry, properties: GeoJSON.GeoJsonProperties = {}): GeoJSON.Feature =>
    ({ type: 'Feature', properties, geometry });

test('coordinates are rounded to seven decimals, at every nesting depth', () => {
    const rounded = roundGeometryForExport({
        type: 'Polygon',
        coordinates: [[[4.12345678901234, 52.98765432109876], [5.000000049, 53.5], [4.1, 52.9], [4.12345678901234, 52.98765432109876]]],
    });

    assert.deepEqual((rounded as GeoJSON.Polygon).coordinates, [[
        [4.1234568, 52.9876543],
        [5.0, 53.5],
        [4.1, 52.9],
        [4.1234568, 52.9876543],
    ]]);
});

test('a GeometryCollection is rounded through its members', () => {
    const rounded = roundGeometryForExport({
        type: 'GeometryCollection',
        geometries: [{ type: 'Point', coordinates: [1.123456789, 2.987654321] }],
    }) as GeoJSON.GeometryCollection;

    assert.deepEqual(rounded.geometries[0], { type: 'Point', coordinates: [1.1234568, 2.9876543] });
});

test('properties are never rounded — they are the user\'s own numbers', () => {
    // A JSON replacer would round these too, which is a data change rather than
    // a saving: seven decimals means centimetres for a coordinate and nothing
    // at all for a measurement.
    const text = writeGeoJSONForExport({
        type: 'FeatureCollection',
        features: [feature({ type: 'Point', coordinates: [1.123456789, 2.5] }, { reading: 0.123456789012345 })],
    }, true);

    const parsed = JSON.parse(text) as GeoJSON.FeatureCollection;
    assert.equal(parsed.features[0].properties!.reading, 0.123456789012345);
    assert.deepEqual((parsed.features[0].geometry as GeoJSON.Point).coordinates, [1.1234568, 2.5]);
});

test('rounding off leaves every digit alone, and neither mode indents', () => {
    const fc: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [feature({ type: 'Point', coordinates: [1.123456789012345, 2.5] })],
    };

    assert.match(writeGeoJSONForExport(fc, false), /1\.123456789012345/);
    assert.equal(writeGeoJSONForExport(fc, false).split('\n').length, 1);
    assert.equal(writeGeoJSONForExport(fc, true).split('\n').length, 1);
});

test('a feature without geometry survives the round trip', () => {
    const text = writeGeoJSONForExport({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: { name: 'no shape' }, geometry: null as unknown as GeoJSON.Geometry }],
    }, true);

    assert.equal((JSON.parse(text) as GeoJSON.FeatureCollection).features[0].geometry, null);
});
