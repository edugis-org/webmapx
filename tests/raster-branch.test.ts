/**
 * Which question the styler may ask about a raster layer.
 *
 * The claim being tested is that the four answers are told apart by what the
 * source and the engine can actually do — not that the wording renders. Two of
 * them are indistinguishable on screen from a bug: a style list offered where
 * the engine cannot repoint a source clicks and does nothing, and a bare
 * endpoint rewritten instead of the engine's own GetMap url points the layer at
 * a request with no bbox.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { rasterBranch, wmsStyleTiles } from '../src/components/styler/raster-branch';
import type { RasterStyleTarget, SourceControl } from '../src/components/styler/style-context';

const WMS_URL = 'https://example.org/wms?SERVICE=WMS&REQUEST=GetMap&LAYERS=top10&STYLES=&BBOX={bbox-epsg-3857}';

function raster(sourceConfig: Record<string, unknown> | null): RasterStyleTarget {
    return { sourceId: 'src', sourceConfig };
}

function control(tiles: string[] | null): SourceControl & { written: string[][] } {
    const written: string[][] = [];
    return {
        written,
        getTiles: () => tiles,
        setTiles: (_id, next) => { written.push(next); return true; },
        setLayerOpacity: () => {},
    };
}

const STYLES = [
    { name: 'default', title: 'Default' },
    { name: 'grey', title: 'Greyscale' },
];

test('a source that is not WMS is finished pictures, whatever the engine can do', () => {
    const branch = rasterBranch(raster({ type: 'raster', tiles: ['https://tiles/{z}/{x}/{y}.png'] }), control([]), STYLES);
    assert.equal(branch.kind, 'tiles');
});

test('a WMS the engine cannot report urls for is fixed, not a choice', () => {
    const noUrls = { setTiles: () => false, setLayerOpacity: () => {} } as SourceControl;
    assert.equal(rasterBranch(raster({ url: WMS_URL }), noUrls, STYLES).kind, 'fixed');
    assert.equal(rasterBranch(raster({ url: WMS_URL }), control(null), STYLES).kind, 'fixed');
});

test('fewer than two styles is not a choice, and names the one it draws', () => {
    const none = rasterBranch(raster({ url: WMS_URL }), control([WMS_URL]), []);
    assert.equal(none.kind, 'single');
    assert.equal(none.only, undefined);
    const one = rasterBranch(raster({ url: WMS_URL }), control([WMS_URL]), [STYLES[0]]);
    assert.equal(one.kind, 'single');
    assert.equal(one.only?.title, 'Default');
});

test('styles not read yet are not reported as an absence', () => {
    // null is "has not answered", and answering "one way only" before the
    // service has replied is a claim the panel cannot make yet.
    assert.equal(rasterBranch(raster({ url: WMS_URL }), control([WMS_URL]), null).kind, 'single');
});

test('two styles over a repointable source is a choice', () => {
    assert.equal(rasterBranch(raster({ url: WMS_URL }), control([WMS_URL]), STYLES).kind, 'choice');
});

test('the urls rewritten are the ones the engine is requesting, not the declared endpoint', () => {
    // The bare-endpoint spelling: the config names no GetMap url at all, so the
    // only place STYLES can be changed is the url the engine assembled.
    const target = raster({ url: 'https://example.org/wms', layers: 'top10' });
    const tiles = wmsStyleTiles(target, control([WMS_URL]), 'grey');
    assert.equal(tiles.length, 1);
    assert.match(tiles[0], /STYLES=grey/);
    assert.match(tiles[0], /BBOX=\{bbox-epsg-3857\}/);
});

test('choosing a named style takes a style of our own back off', () => {
    // A user style and a named style in one request is undefined between
    // services, and in practice the document wins — so picking one of the
    // service's own styles appears to do nothing while SLD_BODY is still there.
    const withOwnStyle = `${WMS_URL}&SLD_BODY=%3CStyledLayerDescriptor%2F%3E`;
    const tiles = wmsStyleTiles(raster({ url: WMS_URL }), control([withOwnStyle]), 'grey');
    assert.ok(!/SLD_BODY/i.test(tiles[0]), 'the document must be removed');
    assert.match(tiles[0], /STYLES=grey/);
});

test('every subdomain url is rewritten, and a source with none is left alone', () => {
    const target = raster({ tiles: [WMS_URL, WMS_URL.replace('example.org', 'b.example.org')] });
    const tiles = wmsStyleTiles(target, { setTiles: () => true, setLayerOpacity: () => {} }, 'grey');
    assert.equal(tiles.length, 2);
    assert.ok(tiles.every((url) => /STYLES=grey/.test(url)));
    assert.deepEqual(wmsStyleTiles(raster({}), null, 'grey'), []);
});
