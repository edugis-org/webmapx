/**
 * WFS requests per view and per click, and how a WFS GetFeature URL in a
 * GeoJSON source is recognised (the layer repository writes them that way).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    boxContains, clickBox, growBox, parseHitCount, viewBox, wfsBboxParam,
    wfsGetFeatureInfo, wfsHitsUrl, wfsPageUrl,
} from '../src/map/wfs-requests';
import { parseAndValidateConfig } from '../src/config/loader';

const LIGPLAATS = 'https://service.pdok.nl/lv/bag/wfs/v2_0?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature'
    + '&TYPENAMES=bag%3Aligplaats&OUTPUTFORMAT=application/json&COUNT=1000&SRSNAME=EPSG:4326';

test('a GetFeature URL is recognised, other requests are not', () => {
    assert.deepEqual(wfsGetFeatureInfo(LIGPLAATS), { version: '2.0.0', typeName: 'bag:ligplaats' });
    assert.equal(wfsGetFeatureInfo('https://x.test/wms?SERVICE=WMS&REQUEST=GetMap&LAYERS=a'), null);
    assert.equal(wfsGetFeatureInfo('https://x.test/data.geojson'), null);
});

test('BBOX is latitude first for 1.1/2.0 URNs, longitude first for 1.0', () => {
    assert.equal(wfsBboxParam('2.0.0', [4.87, 52.36, 4.9, 52.38]), '52.36,4.87,52.38,4.9,urn:ogc:def:crs:EPSG::4326');
    assert.equal(wfsBboxParam('1.0.0', [4.87, 52.36, 4.9, 52.38]), '4.87,52.36,4.9,52.38,EPSG:4326');
});

test('a page replaces COUNT and keeps everything else', () => {
    const url = new URL(wfsPageUrl(LIGPLAATS, { version: '2.0.0', pageSize: 1000, startIndex: 2000, box: [4, 52, 5, 53] }));
    assert.equal(url.searchParams.getAll('COUNT').join(), '1000');
    assert.equal(url.searchParams.get('STARTINDEX'), '2000');
    assert.equal(url.searchParams.get('TYPENAMES'), 'bag:ligplaats');
    assert.equal(url.searchParams.get('SRSNAME'), 'EPSG:4326');
    assert.equal(url.searchParams.get('BBOX'), '52,4,53,5,urn:ogc:def:crs:EPSG::4326');
    const v1 = new URL(wfsPageUrl(LIGPLAATS.replace('2.0.0', '1.1.0'), { version: '1.1.0', pageSize: 50 }));
    assert.equal(v1.searchParams.get('MAXFEATURES'), '50');
    assert.equal(v1.searchParams.has('COUNT'), false);
});

test('a hits request drops the output format and paging', () => {
    const url = new URL(wfsHitsUrl(LIGPLAATS, { version: '2.0.0' }));
    assert.equal(url.searchParams.get('RESULTTYPE'), 'hits');
    assert.equal(url.searchParams.has('OUTPUTFORMAT'), false);
    assert.equal(url.searchParams.has('COUNT'), false);
});

test('hit counts are read from 2.0 and 1.1 answers; "unknown" is no count', () => {
    assert.equal(parseHitCount('<wfs:FeatureCollection numberMatched="11453084" numberReturned="0">'), 11453084);
    assert.equal(parseHitCount('<wfs:FeatureCollection numberOfFeatures="12760">'), 12760);
    assert.equal(parseHitCount('<wfs:FeatureCollection numberMatched="unknown" numberReturned="0">'), undefined);
});

test('boxes: view, click, growth and containment', () => {
    const v = viewBox([4.8846, 52.3705], 17.5, 1200, 900);
    assert.ok(v[0] < 4.8846 && v[2] > 4.8846 && v[1] < 52.3705 && v[3] > 52.3705);
    assert.ok(v[2] - v[0] < 0.02, 'a street-level view is a few hundred metres wide');
    const c = clickBox([4.88, 52.37], 17, 6);
    assert.ok(c[2] - c[0] < 0.0005);
    assert.ok(boxContains(growBox(v, 0.25), v));
    assert.equal(boxContains(v, growBox(v, 0.25)), false);
});

test('the loader marks a GetFeature GeoJSON source as WFS and gives the layer a query URL', () => {
    const config = parseAndValidateConfig({
        version: 0,
        map: { type: 'maplibre', center: [0, 0], zoom: 2 },
        layerData: {
            sources: [{ id: 'lp', type: 'geojson', data: LIGPLAATS, attribution: 'PDOK' }],
            layers: [
                { id: 'a', type: 'fill', source: 'lp' },
                { id: 'b', type: 'fill', source: 'lp', metadata: { queryable: false } },
            ],
        },
    }, 'test', 'http://example.org/config.json');
    const source = config.layerData.sources?.find((s) => s.id === 'lp') as unknown as Record<string, unknown>;
    assert.equal(source.service, 'wfs');
    assert.equal(source.wfsVersion, '2.0.0');
    const meta = (id: string) => ((config.layerData.layers ?? []).find((l) => (l as { id?: string }).id === id) as { metadata?: Record<string, unknown> }).metadata ?? {};
    assert.equal(meta('a').wfsQueryUrl, LIGPLAATS);
    assert.equal(meta('b').wfsQueryUrl, undefined);
});
