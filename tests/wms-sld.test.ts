/**
 * Styling a WMS by handing it an SLD.
 *
 * The claims here are the ones that are invisible until a real service reads
 * the document: that a rule's filter says what the panel said, that the bands
 * of a graduated style are half-open and the top one unbounded, and that the
 * document survives the trip through a tile url with the engines' own
 * placeholders intact. A service draws whatever it is sent, so a wrong document
 * comes back as a picture, never as an error.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildSld,
    categoricalSld,
    graduatedSld,
    legendGraphicUrl,
    toSldColor,
    withSldBodyUrl,
} from '../src/utils/wms-sld';

const TILE_URL = 'https://example.org/wms?SERVICE=WMS&REQUEST=GetMap&LAYERS=pand&STYLES=default&BBOX={bbox-epsg-3857}';

test('a single colour is one rule with no filter', () => {
    const sld = buildSld('pand', 'polygon', { kind: 'single', color: '#ff0000' });
    assert.equal((sld.match(/<Rule>/g) ?? []).length, 1);
    assert.ok(!sld.includes('<ogc:Filter>'));
    assert.ok(sld.includes('<Name>pand</Name>'));
    assert.match(sld, /name="fill">#ff0000</);
});

test('the picker\'s own colours reach the service in a spelling it accepts', () => {
    // Reported from the app: the first draw worked and the next drew the
    // service's grey. SLD 1.0 takes a hex colour and nothing else, and a
    // service handed `rgba(0,170,0,1)` does not complain — it quietly falls
    // back to its default style, which reads as "the style did not work".
    assert.deepEqual(toSldColor('rgba(0,170,0,1)'), { color: '#00aa00', opacity: 1 });
    assert.deepEqual(toSldColor('rgb(255, 0, 255)'), { color: '#ff00ff', opacity: 1 });
    assert.deepEqual(toSldColor('#ff00ff'), { color: '#ff00ff', opacity: 1 });
    assert.deepEqual(toSldColor('#f0f'), { color: '#ff00ff', opacity: 1 });
    const sld = buildSld('x', 'polygon', { kind: 'single', color: 'rgba(0,170,0,1)' });
    assert.match(sld, /name="fill">#00aa00</);
    assert.ok(!sld.includes('rgba'));
});

test('alpha travels as SLD\'s own parameter, since a hex colour cannot carry it', () => {
    assert.equal(toSldColor('rgba(0,0,0,0.5)').opacity, 0.5);
    assert.equal(toSldColor('#00000080').opacity, 128 / 255);
    const sld = buildSld('x', 'polygon', { kind: 'single', color: 'rgba(255,0,0,0.4)' });
    assert.match(sld, /name="fill">#ff0000</);
    assert.match(sld, /name="fill-opacity">0\.4</);
});

test('an outline picked as rgba is converted too', () => {
    const sld = buildSld('x', 'polygon', { kind: 'single', color: '#ffffff', strokeColor: 'rgba(17,34,51,1)' });
    assert.match(sld, /name="stroke">#112233</);
    assert.ok(!sld.includes('rgba'));
});

test('geometry decides the symbolizer, and a line is coloured by its stroke', () => {
    const style = { kind: 'single', color: '#00ff00' } as const;
    assert.match(buildSld('l', 'polygon', style), /<PolygonSymbolizer>/);
    assert.match(buildSld('l', 'point', style), /<PointSymbolizer>/);
    const line = buildSld('l', 'line', style);
    assert.match(line, /<LineSymbolizer>/);
    // A line has no fill, so the style's colour must reach its stroke — a
    // LineSymbolizer with only a Fill draws nothing at all.
    assert.match(line, /name="stroke">#00ff00</);
});

test('an unknown geometry draws whatever the data turns out to be', () => {
    // A rule carrying only a PolygonSymbolizer draws nothing at all on a point
    // layer, and the service still reports success — so where the schema did
    // not say, every symbolizer is sent.
    const sld = buildSld('x', 'unknown', { kind: 'single', color: '#ff0000' });
    assert.match(sld, /<PolygonSymbolizer>/);
    assert.match(sld, /<LineSymbolizer>/);
    assert.match(sld, /<PointSymbolizer>/);
    // A known geometry stays exact: one symbolizer, no stray centroid marks.
    const point = buildSld('x', 'point', { kind: 'single', color: '#ff0000' });
    assert.ok(!point.includes('<PolygonSymbolizer>'));
});

test('categories filter on the value, and "other" is an ElseFilter', () => {
    const sld = buildSld('pand', 'polygon', categoricalSld('status', ['in gebruik', 'sloopvergunning'], ['#111111', '#222222'], { otherColor: '#cccccc' }));
    assert.match(sld, /<ogc:PropertyIsEqualTo><ogc:PropertyName>status<\/ogc:PropertyName><ogc:Literal>in gebruik<\/ogc:Literal>/);
    assert.equal((sld.match(/<Rule>/g) ?? []).length, 3);
    assert.match(sld, /<ElseFilter\/>/);
});

test('without an "other" colour the unmatched features are simply not drawn', () => {
    const sld = buildSld('pand', 'polygon', categoricalSld('status', ['a'], ['#111111']));
    assert.ok(!sld.includes('ElseFilter'));
    assert.equal((sld.match(/<Rule>/g) ?? []).length, 1);
});

test('graduated bands are half-open, and the top band has no upper bound', () => {
    const sld = buildSld('pand', 'polygon', graduatedSld('bouwjaar', [
        { min: 1800, max: 1900 }, { min: 1900, max: 1970 }, { min: 1970, max: 2024 },
    ], ['#2166ac', '#f7f7f7', '#b2182b']));
    // The lowest band has no lower bound: a value below the sample's minimum is
    // still data, and leaving it unfiltered is what draws it.
    const rules = sld.split('<Rule>').slice(1);
    assert.equal(rules.length, 3);
    assert.ok(!rules[0].includes('GreaterThanOrEqualTo'), 'the first band must not exclude values below the sample');
    assert.match(rules[0], /PropertyIsLessThan><ogc:PropertyName>bouwjaar<\/ogc:PropertyName><ogc:Literal>1900</);
    assert.match(rules[1], /<ogc:And>/);
    assert.match(rules[2], /PropertyIsGreaterThanOrEqualTo[\s\S]*1970/);
    assert.ok(!rules[2].includes('PropertyIsLessThan'), 'the top band must be open-ended');
});

test('a value with XML in it cannot break the document', () => {
    const sld = buildSld('pand', 'polygon', categoricalSld('name', ['a & <b>"c"'], ['#000000']));
    assert.match(sld, /<ogc:Literal>a &amp; &lt;b&gt;&quot;c&quot;<\/ogc:Literal>/);
});

test('the tile url carries the document, empties STYLES and keeps its placeholders', () => {
    const sld = buildSld('pand', 'polygon', { kind: 'single', color: '#ff0000' });
    const url = withSldBodyUrl(TILE_URL, sld);
    assert.ok(url.includes('{bbox-epsg-3857}'), 'the engine\'s own placeholder must survive');
    // A named style and a user style together is undefined between services.
    assert.match(url, /STYLES=(&|$)/);
    const sent = new URL(url).searchParams.get('SLD_BODY');
    assert.equal(sent, sld);
});

test('a colour in a decoded url does not cut the query short', () => {
    // An engine may hand back a decoded url, and a decoded SLD carries `#ff00ff`
    // — which parses as a fragment. Reported from the app as a style that would
    // not change: every later rewrite kept the old document's tail as a hash.
    const decoded = 'https://x.org/wms?LAYERS=pand&SLD_BODY=<Fill><CssParameter name="fill">#ff00ff</CssParameter></Fill>';
    const next = withSldBodyUrl(decoded, buildSld('pand', 'polygon', { kind: 'single', color: '#00ff00' }));
    assert.ok(!next.includes('#ff00ff') && !next.includes('%23ff00ff'), 'the old document must be gone entirely');
    assert.match(decodeURIComponent(new URL(next).searchParams.get('SLD_BODY') ?? ''), /#00ff00/);
    assert.equal(new URL(next).hash, '', 'nothing may be left riding along as a fragment');
});

test('replacing a style does not stack documents, and null removes it', () => {
    const first = withSldBodyUrl(TILE_URL, buildSld('pand', 'polygon', { kind: 'single', color: '#ff0000' }));
    const second = withSldBodyUrl(first, buildSld('pand', 'polygon', { kind: 'single', color: '#00ff00' }));
    assert.equal((second.match(/SLD_BODY=/g) ?? []).length, 1);
    assert.match(new URL(second).searchParams.get('SLD_BODY') ?? '', /#00ff00/);
    assert.ok(!withSldBodyUrl(second, null).includes('SLD_BODY'));
});

test('a legend request is composed only from what addresses a legend', () => {
    // The endpoint may already carry a GetMap's parameters; a legend request
    // that inherited its BBOX, WIDTH and HEIGHT asks the service for something
    // else entirely.
    const endpoint = 'https://x.org/wms?SERVICE=WMS&REQUEST=GetMap&LAYERS=pand&STYLES=&WIDTH=256&HEIGHT=256&BBOX=1,2,3,4&KEY=abc';
    const url = new URL(legendGraphicUrl(endpoint, 'pand', { sld: '<sld/>', version: '1.1.1' }));
    assert.equal(url.searchParams.get('REQUEST'), 'GetLegendGraphic');
    assert.equal(url.searchParams.get('LAYER'), 'pand');
    assert.equal(url.searchParams.get('SLD_BODY'), '<sld/>');
    assert.equal(url.searchParams.get('BBOX'), null);
    assert.equal(url.searchParams.get('WIDTH'), null);
    // Anything the service needs that is not ours to touch survives.
    assert.equal(url.searchParams.get('KEY'), 'abc');
});

test('a named style is asked for by name, not by document', () => {
    const url = new URL(legendGraphicUrl('https://x.org/wms', 'pand', { style: 'pand_gefilterd' }));
    assert.equal(url.searchParams.get('STYLE'), 'pand_gefilterd');
    assert.equal(url.searchParams.get('SLD_BODY'), null);
});
