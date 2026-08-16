/**
 * The legacy `crs` member GDAL writes, and which every entry point has to drop.
 *
 * This looks like trivia and is not: leaving the member on made OpenLayers treat
 * it as the data projection, fail to build a transform into a proj4-registered
 * view, and throw `transformFn is not a function` from inside its geometry code.
 * It cost two debugging sessions — once on geoprocessing results, once on
 * imported files — because the symptom appears in the map, nowhere near the data.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { parseGdalGeoJSON, stripLegacyCrs } from '../src/utils/geojson-crs';

/** What GDAL actually writes for a WGS84 result. */
const GDAL_OUTPUT = JSON.stringify({
    type: 'FeatureCollection',
    name: 'converted_output',
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
    features: [
        { type: 'Feature', properties: { id: 1 }, geometry: { type: 'Point', coordinates: [4.9, 52.4] } },
    ],
});

test('parsing GDAL output drops the crs member and keeps everything else', () => {
    const parsed = parseGdalGeoJSON(GDAL_OUTPUT) as GeoJSON.FeatureCollection & { crs?: unknown; name?: string };
    assert.equal(parsed.crs, undefined);
    assert.equal(parsed.type, 'FeatureCollection');
    assert.equal(parsed.name, 'converted_output', 'other members are left alone');
    assert.equal(parsed.features.length, 1);
    assert.deepEqual((parsed.features[0].geometry as GeoJSON.Point).coordinates, [4.9, 52.4]);
});

test('stripping is safe on a collection that never had one', () => {
    const plain: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
    assert.equal(stripLegacyCrs(plain), plain, 'the same object comes back');
    assert.equal((plain as GeoJSON.FeatureCollection & { crs?: unknown }).crs, undefined);
});

test('stripping mutates rather than copying', () => {
    // Deliberate: these collections reach tens of megabytes, and copying one to
    // delete a single key is not a trade worth making.
    const collection = JSON.parse(GDAL_OUTPUT) as GeoJSON.FeatureCollection;
    const returned = stripLegacyCrs(collection);
    assert.equal(returned, collection);
});
