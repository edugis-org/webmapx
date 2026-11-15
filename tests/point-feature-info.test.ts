import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildPointInfoUrl,
    fetchPointFeatureInfo,
    flattenJson,
    isPointInfoUrl,
} from '../src/utils/point-feature-info';

const url = 'https://api.example.org/v1/current.json?key=k&q={latitude},{longitude}';

test('{latitude}/{longitude} mark a point request; a WMS url is not one', () => {
    assert.equal(isPointInfoUrl(url), true);
    assert.equal(isPointInfoUrl('https://wms.example.org/?SERVICE=WMS&REQUEST=GetFeatureInfo&LAYERS=a'), false);
});

test('the clicked point is filled in as lat,lon with five decimals', () => {
    assert.equal(
        buildPointInfoUrl(url, [4.8912345678, 52.3712345678]),
        'https://api.example.org/v1/current.json?key=k&q=52.37123,4.89123',
    );
});

test('a click on a world copy past the date line asks about the real longitude', () => {
    const q = (lng: number) => buildPointInfoUrl('{latitude},{longitude}', [lng, 52.37]);
    assert.equal(q(4.89 + 360), '52.37000,4.89000');
    assert.equal(q(4.89 - 720), '52.37000,4.89000');
    assert.equal(q(-190), '52.37000,170.00000');
    assert.equal(q(190), '52.37000,-170.00000');
    assert.equal(q(180), '52.37000,-180.00000');
});

test('nested answers become dotted keys; plain arrays are joined', () => {
    assert.deepEqual(
        flattenJson({ location: { name: 'Amsterdam' }, current: { temp_c: 2.1, condition: { text: 'Bewolkt' } }, tags: ['a', 'b'] }),
        { 'location.name': 'Amsterdam', 'current.temp_c': 2.1, 'current.condition.text': 'Bewolkt', tags: 'a, b' },
    );
});

test('layers naming the same service share one request and each get a result', async () => {
    const calls: string[] = [];
    const fakeFetch = (async (input: string) => {
        calls.push(input);
        return new Response(JSON.stringify({ current: { temp_c: 2.1, precip_mm: 0 } }), { status: 200 });
    }) as unknown as typeof fetch;
    const lngLat: [number, number] = [4.89, 52.37];
    const out = await fetchPointFeatureInfo([
        { url, layerId: 'temp', layerTitle: 'Temperatuur', lngLat },
        { url, layerId: 'precip', layerTitle: 'Neerslag', lngLat },
    ], fakeFetch);
    assert.equal(calls.length, 1);
    assert.deepEqual(out.map((f) => f.layerId), ['temp', 'precip']);
    assert.equal(out[0].properties['current.temp_c'], 2.1);
    assert.equal(out[0].source, 'point');
});

test('a failing service yields nothing instead of throwing', async () => {
    const lngLat: [number, number] = [0, 0];
    const refused = (async () => new Response('{"error":"key"}', { status: 401 })) as unknown as typeof fetch;
    const down = (async () => { throw new TypeError('network'); }) as unknown as typeof fetch;
    assert.deepEqual(await fetchPointFeatureInfo([{ url, layerId: 'a', layerTitle: 'A', lngLat }], refused), []);
    assert.deepEqual(await fetchPointFeatureInfo([{ url, layerId: 'a', layerTitle: 'A', lngLat }], down), []);
});
