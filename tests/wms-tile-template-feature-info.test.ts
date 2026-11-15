/**
 * A raster source given as a WMS GetMap tile template is a WMS, and the info
 * tool can ask it about a pixel without the config saying so.
 *
 * The layer repository (and anybody copying a GetMap URL out of a viewer)
 * writes WMS layers as `{ type: 'raster', tiles: ['…REQUEST=GetMap&LAYERS=…'] }`
 * with no `service`. Only `service: 'wms'` used to get a GetFeatureInfo URL, so
 * those layers drew but never answered the info tool.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { parseAndValidateConfig } from '../src/config/loader';

const PAND = 'https://service.pdok.nl/lv/bag/wms/v2_0?LAYERS=pand&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap'
    + '&FORMAT=image/png&TRANSPARENT=true&STYLES=bag%3Apand&SRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256';

function layerMetadata(source: Record<string, unknown>, metadata?: Record<string, unknown>): Record<string, unknown> {
    const config = parseAndValidateConfig({
        version: 0,
        map: { type: 'maplibre', center: [0, 0], zoom: 2 },
        layerData: {
            sources: [{ id: 'src', ...source }],
            layers: [{ id: 'pand', type: 'raster', source: 'src', ...(metadata ? { metadata } : {}) }],
        },
    }, 'test', 'http://example.org/config.json');
    const layer = config.layerData.layers?.find((entry) => (entry as { id?: string }).id === 'pand');
    return ((layer as { metadata?: Record<string, unknown> } | undefined)?.metadata) ?? {};
}

test('a GetMap tile template gets a GetFeatureInfo URL', () => {
    const url = new URL(String(layerMetadata({ type: 'raster', tiles: [PAND] }).getFeatureInfoUrl));
    assert.equal(url.origin + url.pathname, 'https://service.pdok.nl/lv/bag/wms/v2_0');
    assert.equal(url.searchParams.get('REQUEST'), 'GetFeatureInfo');
    assert.equal(url.searchParams.get('LAYERS'), 'pand');
    assert.equal(url.searchParams.get('QUERY_LAYERS'), 'pand');
    assert.equal(url.searchParams.get('VERSION'), '1.1.1');
    for (const gone of ['BBOX', 'WIDTH', 'HEIGHT', 'FORMAT', 'STYLES', 'TRANSPARENT']) {
        assert.equal(url.searchParams.has(gone), false, gone);
    }
});

test('vendor parameters and unresolved TIME are handled', () => {
    const template = 'https://example.org/cgi-bin/mapserv?map=/srv/x.map&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap'
        + '&LAYERS=a,b&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&TIME={time}';
    const url = new URL(String(layerMetadata({ type: 'raster', tiles: [template] }).getFeatureInfoUrl));
    assert.equal(url.searchParams.get('map'), '/srv/x.map');
    assert.equal(url.searchParams.get('CRS'), 'EPSG:3857');
    assert.equal(url.searchParams.get('QUERY_LAYERS'), 'a,b');
    assert.equal(url.searchParams.has('TIME'), false);
});

test('an override, queryable:false and plain XYZ tiles are left alone', () => {
    assert.equal(layerMetadata({ type: 'raster', tiles: [PAND] }, { getFeatureInfoUrl: 'https://x.test/gfi' }).getFeatureInfoUrl,
        'https://x.test/gfi');
    assert.equal(layerMetadata({ type: 'raster', tiles: [PAND] }, { queryable: false }).getFeatureInfoUrl, undefined);
    assert.equal(layerMetadata({ type: 'raster', tiles: ['https://tile.example.org/{z}/{x}/{y}.png'] }).getFeatureInfoUrl,
        undefined);
});
