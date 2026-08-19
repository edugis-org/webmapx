import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeCrsIdentifier, isWgs84 } from '../src/utils/crs-identifier';

test('every spelling of WGS84 comes back as EPSG:4326', () => {
    // The whole reason this module exists: OpenLayers registers a projection for
    // some of these and proj4 for others, so which one a layer is tagged with
    // decided whether it could be drawn on a non-Mercator map.
    for (const name of [
        'EPSG:4326',
        'EPSG::4326',
        '4326',
        'CRS:84',
        'urn:ogc:def:crs:OGC:1.3:CRS84',
        'urn:ogc:def:crs:OGC:2:84',
        'urn:x-ogc:def:crs:EPSG::4326',
        'urn:ogc:def:crs:EPSG::4326',
        'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
        'http://www.opengis.net/def/crs/EPSG/0/4326',
        'http://www.opengis.net/gml/srs/epsg.xml#4326',
    ]) {
        assert.equal(normalizeCrsIdentifier(name), 'EPSG:4326', name);
        assert.ok(isWgs84(name), name);
    }
});

test('other authorities keep their own code', () => {
    assert.equal(normalizeCrsIdentifier('urn:ogc:def:crs:EPSG::28992'), 'EPSG:28992');
    assert.equal(normalizeCrsIdentifier('EPSG:3857'), 'EPSG:3857');
    assert.equal(normalizeCrsIdentifier('http://www.opengis.net/def/crs/EPSG/0/3035'), 'EPSG:3035');
    assert.equal(normalizeCrsIdentifier('ESRI:54009'), 'ESRI:54009');
    assert.equal(normalizeCrsIdentifier('esri:54009'), 'ESRI:54009');
});

test('the OGC-minted codes are not EPSG numbers and are mapped by name', () => {
    assert.equal(normalizeCrsIdentifier('urn:ogc:def:crs:OGC:1.3:CRS83'), 'EPSG:4269');
    assert.equal(normalizeCrsIdentifier('urn:ogc:def:crs:OGC:1.3:CRS27'), 'EPSG:4267');
});

test('nonsense is reported as unknown rather than guessed at', () => {
    assert.equal(normalizeCrsIdentifier(''), null);
    assert.equal(normalizeCrsIdentifier(null), null);
    assert.equal(normalizeCrsIdentifier('who knows'), null);
    assert.equal(isWgs84('who knows'), false);
});
