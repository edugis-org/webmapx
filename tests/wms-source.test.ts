import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readWmsSource, withWmsStyle } from '../src/utils/wms-source';

/**
 * A WMS source is spelled two ways in real configs, and both turn up in
 * demo.json: a bare endpoint with `layers` as a sibling key (pdok-bag-source),
 * and the GetMap query baked into the url (bevolking2015-source). Handling only
 * one of them leaves half the raster layers unstyleable, which is exactly the
 * failure the swatch baker hit before it learned both.
 */

const BAKED = {
    id: 'bevolking2015-source',
    type: 'raster',
    tiles: ['https://t1.example.org/tiles?map=population.map&LAYERS=Bevolkingsdichtheid_2015'
        + '&TRANSPARENT=true&FORMAT=image%2Fpng&SERVICE=WMS&VERSION=1.1.1&STYLES=&REQUEST=GetMap'
        + '&SRS=EPSG%3A3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256'],
};

const ENDPOINT = {
    id: 'pdok-bag-source',
    type: 'raster',
    service: 'wms',
    url: 'https://service.example.org/lv/bag/wms/v2_0',
    layers: 'pand',
    version: '1.1.1',
};

test('reads the WMS request out of a baked GetMap url', () => {
    const info = readWmsSource(BAKED);
    assert.ok(info);
    assert.equal(info.layers, 'Bevolkingsdichtheid_2015');
    assert.equal(info.style, '');
    assert.equal(info.version, '1.1.1');
    assert.equal(info.endpoint, 'https://t1.example.org/tiles');
});

test('reads the WMS request out of a bare endpoint with sibling keys', () => {
    const info = readWmsSource(ENDPOINT);
    assert.ok(info);
    assert.equal(info.layers, 'pand');
    assert.equal(info.endpoint, 'https://service.example.org/lv/bag/wms/v2_0');
});

test('a plain tile source is not WMS', () => {
    assert.equal(readWmsSource({ type: 'raster', tiles: ['https://tile.example.org/{z}/{x}/{y}.png'] }), null);
    // A WMS endpoint naming no layer cannot be asked for a different style.
    assert.equal(readWmsSource({ type: 'raster', service: 'wms', url: 'https://example.org/wms' }), null);
});

test('changing the style keeps every other parameter, placeholders included', () => {
    const next = withWmsStyle(BAKED, 'grijs');
    const [url] = next.tiles as string[];
    assert.match(url, /STYLES=grijs/);
    // The placeholder the engine substitutes must survive verbatim.
    assert.ok(url.includes('{bbox-epsg-3857}'), url);
    for (const kept of ['WIDTH=256', 'HEIGHT=256', 'VERSION=1.1.1', 'LAYERS=Bevolkingsdichtheid_2015']) {
        assert.ok(url.includes(kept), `${kept} was dropped: ${url}`);
    }
    assert.equal(readWmsSource(next)?.style, 'grijs');
});

test('changing the style on a bare endpoint writes the sibling key', () => {
    const next = withWmsStyle(ENDPOINT, 'grijs');
    assert.equal(next.styles, 'grijs');
    assert.equal(next.layers, 'pand');
    assert.equal(readWmsSource(next)?.style, 'grijs');
});

test('a multi-subdomain source keeps all of its urls', () => {
    const source = {
        type: 'raster',
        service: 'wms',
        url: ['https://a.example.org/wms?SERVICE=WMS&LAYERS=x&STYLES=one',
              'https://b.example.org/wms?SERVICE=WMS&LAYERS=x&STYLES=one'],
    };
    const next = withWmsStyle(source, 'two') as { url: string[] };
    assert.equal(next.url.length, 2);
    assert.ok(next.url.every((url) => url.includes('STYLES=two')), next.url.join(' '));
    assert.ok(next.url[1].startsWith('https://b.example.org/'), next.url[1]);
});
