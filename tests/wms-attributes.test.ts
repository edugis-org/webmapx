/**
 * What a WMS layer's columns are, when the layer is only pictures.
 *
 * Two of these claims are corrections of bugs that a live service found and a
 * plausible-looking unit test would not have: the WFS version must be read from
 * the capabilities element rather than from the first `version="…"` in the
 * document (the XML declaration's own 1.0, which gets a service exception and
 * reads as "there is no WFS"), and the schema's declaration of the feature type
 * itself is not a column.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    attributesFromProperties,
    parseGeometryType,
    attributesFromWfs,
    discoverWmsAttributes,
    matchTypeName,
    parseDescribeFeatureType,
    parseFeatureInfoProperties,
    parseWfsTypeNames,
    valuesFromWfs,
    wfsCandidates,
} from '../src/utils/wms-attributes';

const SCHEMA = `<?xml version='1.0' encoding="UTF-8" ?>
<schema targetNamespace="http://bag.geonovum.nl" xmlns="http://www.w3.org/2001/XMLSchema">
  <element name="geom" type="gml:GeometryPropertyType" minOccurs="0"/>
  <element name="identificatie" minOccurs="0" type="string"/>
  <element name="bouwjaar" minOccurs="0" type="long"/>
  <element name="oppervlakte_min" minOccurs="0" type="double"/>
  <element name="pand" type="bag:pandType" substitutionGroup="gml:_Feature"/>
</schema>`;

const CAPS = `<?xml version="1.0" encoding="UTF-8"?>
<wfs:WFS_Capabilities version="2.0.0" xmlns:wfs="http://www.opengis.net/wfs/2.0">
 <FeatureTypeList>
  <FeatureType><Name>bag:pand</Name></FeatureType>
  <FeatureType><Name>bag:woonplaats</Name></FeatureType>
 </FeatureTypeList>
</wfs:WFS_Capabilities>`;

test('the schema gives names and types, geometry excluded', () => {
    const attributes = parseDescribeFeatureType(SCHEMA);
    assert.deepEqual(attributes.map((a) => a.name), ['identificatie', 'bouwjaar', 'oppervlakte_min']);
    assert.deepEqual(attributes.map((a) => a.numeric), [false, true, true]);
});

test('the feature type\'s own declaration is not a column', () => {
    // `<element name="pand" type="bag:pandType"/>` is the container. Offering
    // it as something to classify by produces an SLD that matches nothing.
    assert.ok(!parseDescribeFeatureType(SCHEMA).some((a) => a.name === 'pand'));
});

test('the schema says what the layer draws, and says nothing when it does not know', () => {
    assert.equal(parseGeometryType(SCHEMA), null, 'gml:GeometryPropertyType means "some geometry"');
    assert.equal(parseGeometryType('<element name="g" type="gml:PointPropertyType"/>'), 'point');
    assert.equal(parseGeometryType('<element name="g" type="gml:MultiSurfacePropertyType"/>'), 'polygon');
    assert.equal(parseGeometryType('<element name="g" type="gml:MultiCurvePropertyType"/>'), 'line');
});

test('a feature type is matched with or without its namespace prefix', () => {
    const names = parseWfsTypeNames(CAPS);
    assert.ok(names.includes('bag:pand'));
    assert.equal(matchTypeName(names, 'pand'), 'bag:pand');
    assert.equal(matchTypeName(names, 'bag:pand'), 'bag:pand');
    assert.equal(matchTypeName(names, 'nothing'), null);
});

test('the sibling WFS is looked for at the wms→wfs path, then at the endpoint itself', () => {
    assert.deepEqual(wfsCandidates('https://service.pdok.nl/lv/bag/wms/v2_0'), [
        'https://service.pdok.nl/lv/bag/wfs/v2_0',
        'https://service.pdok.nl/lv/bag/wms/v2_0',
    ]);
    assert.deepEqual(wfsCandidates('https://example.org/geoserver/ows'), ['https://example.org/geoserver/ows']);
});

/** A fetch that answers from a table of url substrings, and records the calls. */
function stubFetch(routes: Array<[RegExp, string, number?]>) {
    const calls: string[] = [];
    const impl = (async (input: RequestInfo | URL) => {
        const url = String(input);
        calls.push(url);
        const hit = routes.find(([pattern]) => pattern.test(url));
        if (!hit) return new Response('', { status: 404 });
        return new Response(hit[1], { status: hit[2] ?? 200 });
    }) as typeof fetch;
    return Object.assign(impl, { calls });
}

test('the WFS is asked at the version its capabilities declare, not the XML declaration\'s', async () => {
    const fetchImpl = stubFetch([
        [/wfs.*GetCapabilities/i, CAPS],
        [/DescribeFeatureType/i, SCHEMA],
    ]);
    const found = await attributesFromWfs(
        { endpoint: 'https://service.pdok.nl/lv/bag/wms/v2_0', layers: 'pand', style: '' },
        fetchImpl,
    );
    assert.equal(found?.from, 'wfs');
    assert.equal(found?.wfs?.typeName, 'bag:pand');
    const describe = fetchImpl.calls.find((url) => /DescribeFeatureType/i.test(url)) ?? '';
    assert.match(describe, /VERSION=2\.0\.0/);
    assert.equal(found?.attributes.length, 3);
});

test('no WFS is an ordinary answer, and the pixel is asked instead', async () => {
    const fetchImpl = stubFetch([
        [/GetFeatureInfo/i, JSON.stringify({ features: [{ properties: { naam: 'Delft', inwoners: 103000 } }] })],
    ]);
    const found = await discoverWmsAttributes(
        { endpoint: 'https://example.org/wms', layers: 'x', style: '' },
        { i: 10, j: 12, bbox: [0, 0, 1, 1] },
        fetchImpl,
    );
    assert.equal(found?.from, 'featureinfo');
    assert.deepEqual(found?.attributes.map((a) => [a.name, a.numeric]), [['naam', false], ['inwoners', true]]);
    const asked = fetchImpl.calls.find((url) => /GetFeatureInfo/i.test(url)) ?? '';
    // Both spellings of the pixel: 1.3.0 says I/J, 1.1.x says X/Y.
    assert.match(asked, /[?&]I=10/);
    assert.match(asked, /[?&]X=10/);
});

test('a GML answer is read when JSON is not offered', () => {
    const gml = `<msGMLOutput><layer><feature><gml:boundedBy><gml:Box/></gml:boundedBy>
      <naam>Delft</naam><inwoners>103000</inwoners></feature></layer></msGMLOutput>`;
    const properties = parseFeatureInfoProperties(gml);
    assert.equal(properties?.naam, 'Delft');
    assert.equal(properties?.inwoners, '103000');
    assert.ok(!('boundedBy' in (properties ?? {})));
});

test('a numeric string from GML still counts as numeric', () => {
    const attributes = attributesFromProperties({ naam: 'Delft', inwoners: '103000', leeg: '' });
    assert.deepEqual(attributes.map((a) => [a.name, a.numeric]), [['naam', false], ['inwoners', true], ['leeg', false]]);
});

test('values come back for the one column asked about', async () => {
    const fetchImpl = stubFetch([[/GetFeature/i, JSON.stringify({
        features: [{ properties: { bouwjaar: 1991 } }, { properties: { bouwjaar: 1925 } }],
    })]]);
    const values = await valuesFromWfs({ url: 'https://example.org/wfs', typeName: 'bag:pand', version: '2.0.0' }, 'bouwjaar', 500, fetchImpl);
    assert.deepEqual(values, [1991, 1925]);
    const asked = fetchImpl.calls[0];
    assert.match(asked, /PROPERTYNAME=bouwjaar/);
    // WFS 2 spells the limit COUNT; sending MAXFEATURES gets everything.
    assert.match(asked, /COUNT=500/);
    assert.match(asked, /TYPENAMES=bag%3Apand/);
});

test('a WFS 1.1 service is asked in its own spelling', async () => {
    const fetchImpl = stubFetch([[/GetFeature/i, JSON.stringify({ features: [] })]]);
    await valuesFromWfs({ url: 'https://example.org/wfs', typeName: 'x', version: '1.1.0' }, 'a', 10, fetchImpl);
    assert.match(fetchImpl.calls[0], /MAXFEATURES=10/);
    assert.match(fetchImpl.calls[0], /TYPENAME=x/);
});
