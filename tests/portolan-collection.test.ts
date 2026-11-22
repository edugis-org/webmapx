import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
    bindStyleToCollection,
    collectionStyles,
    fallbackStyle,
    isStacCollection,
    MAX_SOURCE_ROWS,
    ownStyleLayers,
    readPortolanCollection,
    resolveWrappedUrl,
} from '../src/utils/portolan-collection';

/** The spec's reference catalog, as hosted; fixtures are its documents (tests/fixtures/portolan/NOTICE.md). */
const BASE = 'https://data.source.coop/portolan-mirrors/portolan-spec-examples/portolan-reference/main';
const PROVINCES_URL = `${BASE}/boundaries/netherlands-provinces/collection.json`;
const COUNTRIES_URL = `${BASE}/reference/natural-earth-countries/collection.json`;

async function fixture(name: string): Promise<Record<string, unknown>> {
    return JSON.parse(await readFile(path.join(process.cwd(), 'tests', 'fixtures', 'portolan', name), 'utf8'));
}

test('a wrapped URL is resolved inside its wrapper, not mangled by URL', () => {
    const style = `${BASE}/boundaries/netherlands-provinces/styles/provinces.json`;
    assert.equal(
        resolveWrappedUrl('pmtiles://../netherlands-provinces.pmtiles', style),
        `pmtiles://${BASE}/boundaries/netherlands-provinces/netherlands-provinces.pmtiles`,
    );
    assert.equal(resolveWrappedUrl('pmtiles://https://a.org/x.pmtiles', style), 'pmtiles://https://a.org/x.pmtiles');
    assert.equal(resolveWrappedUrl('https://t.org/{z}/{x}/{y}.png', style), 'https://t.org/{z}/{x}/{y}.png');
});

test('a vector collection with a visual asset is drawn from its PMTiles', async () => {
    const doc = await fixture('netherlands-provinces/collection.json');
    assert.ok(isStacCollection(doc));
    const info = readPortolanCollection(doc, PROVINCES_URL);

    assert.equal(info.renderPath, 'tiles');
    assert.equal(info.visual?.href, `${BASE}/boundaries/netherlands-provinces/netherlands-provinces.pmtiles`);
    assert.deepEqual(info.visual?.layers, ['netherlands-provinces']);
    assert.equal(info.data?.format, 'geoparquet');
    assert.equal(info.title, 'Netherlands Provinces');
    assert.deepEqual(info.bbox, [3.307938, 50.750367, 7.227498, 53.576423]);
    assert.equal(info.attribution, '© Kadaster / PDOK, CC-BY-4.0');
    assert.equal(info.rowCount, 12);
    assert.ok(info.columns.some((c) => c.name === 'naam'));
});

test('styles are the style-role assets, the default first, each with its title', async () => {
    const styles = collectionStyles(await fixture('netherlands-provinces/collection.json'), PROVINCES_URL);

    assert.deepEqual(styles.map((s) => s.key), ['style-provinces', 'style-labeled', 'style-randstad', 'style-boundaries']);
    assert.equal(styles[0].isDefault, true);
    assert.equal(styles.filter((s) => s.isDefault).length, 1);
    assert.equal(styles[0].title, 'Provinces by name');
    assert.equal(styles[1].href, `${BASE}/boundaries/netherlands-provinces/styles/labeled.json`);
});

test('the default is found by role, wherever it sits; a lone unmarked style is the default', () => {
    const asset = (roles: string[], title: string) => ({ href: `./styles/${title}.json`, type: 'application/vnd.mapbox.style+json', roles, title });
    const marked = collectionStyles({ type: 'Collection', assets: { a: asset(['style'], 'a'), b: asset(['style', 'default'], 'b') } }, PROVINCES_URL);
    assert.deepEqual(marked.map((s) => [s.key, s.isDefault]), [['b', true], ['a', false]]);

    const lone = collectionStyles({ type: 'Collection', assets: { only: asset(['style'], 'only') } }, PROVINCES_URL);
    assert.equal(lone[0].isDefault, true);
});

test('a style href that is not http(s) is never offered', () => {
    const styles = collectionStyles({
        type: 'Collection',
        assets: {
            evil: { href: 'javascript:alert(1)', roles: ['style'] },
            data: { href: 'data:application/json,{}', roles: ['style'] },
            ok: { href: './ok.json', roles: ['style'] },
        },
    }, PROVINCES_URL);
    assert.deepEqual(styles.map((s) => s.key), ['ok']);
});

test('styles named only in a legacy portolan:styles manifest are still found', () => {
    const styles = collectionStyles({
        type: 'Collection',
        'portolan:styles': [{ name: 'old', href: './styles/old.json' }],
        assets: { 'style-new': { href: './styles/new.json', roles: ['style'], title: 'New' } },
    }, PROVINCES_URL);
    assert.deepEqual(styles.map((s) => s.key), ['style-new', 'old']);
});

test('the default style is bound to the collection PMTiles, its relative source resolved', async () => {
    const info = readPortolanCollection(await fixture('netherlands-provinces/collection.json'), PROVINCES_URL);
    const styleUrl = info.styles[0].href;
    const bound = bindStyleToCollection(await fixture('netherlands-provinces/styles/labeled.json'), styleUrl, info);

    assert.deepEqual((bound?.sources as Record<string, unknown>).data, {
        type: 'vector',
        url: `pmtiles://${info.visual?.href}`,
        attribution: '© Kadaster / PDOK, CC-BY-4.0',
    });
    const layers = bound?.layers as Array<Record<string, unknown>>;
    assert.deepEqual(layers.map((l) => l.type), ['fill', 'symbol']);
    assert.equal(layers[0]['source-layer'], 'netherlands-provinces');
});

test('a small collection without PMTiles is drawn from its GeoParquet as GeoJSON', async () => {
    const info = readPortolanCollection(await fixture('natural-earth-countries/collection.json'), COUNTRIES_URL);
    assert.equal(info.renderPath, 'geoparquet');

    // The reference style points a `vector` source at the .parquet file, which MapLibre cannot read.
    const bound = bindStyleToCollection(await fixture('natural-earth-countries/styles/continents.json'), info.styles[0].href, info);
    assert.deepEqual((bound?.sources as Record<string, unknown>).data, {
        type: 'geojson',
        data: `geoparquet://${BASE}/reference/natural-earth-countries/natural-earth-countries.parquet`,
        attribution: info.attribution,
    });
    assert.ok((bound?.layers as Array<Record<string, unknown>>).every((l) => !('source-layer' in l)));
});

test('a large collection without PMTiles is not drawn at all', async () => {
    const doc = await fixture('natural-earth-countries/collection.json');
    const info = readPortolanCollection({ ...doc, 'table:row_count': MAX_SOURCE_ROWS + 1 }, COUNTRIES_URL);
    assert.equal(info.renderPath, 'none');
    assert.match(info.notDrawable ?? '', /too large/);
});

test('a source the collection does not own is kept, resolved against the style', async () => {
    const info = readPortolanCollection(await fixture('netherlands-provinces/collection.json'), PROVINCES_URL);
    const bound = bindStyleToCollection({
        version: 8,
        sources: { data: { type: 'vector', url: 'pmtiles://../netherlands-provinces.pmtiles' }, base: { type: 'raster', tiles: ['../tiles/{z}/{x}/{y}.png'] } },
        layers: [],
    }, info.styles[0].href, info);
    assert.deepEqual((bound?.sources as Record<string, Record<string, unknown>>).base.tiles, [`${BASE}/boundaries/netherlands-provinces/tiles/{z}/{x}/{y}.png`]);
});

test('raster and table-only collections say why they are not drawn', async () => {
    const cog = readPortolanCollection(await fixture('sample-cog/collection.json'), `${BASE}/raster/sample-cog/collection.json`);
    assert.equal(cog.renderPath, 'raster');
    assert.equal(cog.data?.format, 'cog');
    assert.match(cog.notDrawable ?? '', /not supported yet/);

    const table = readPortolanCollection(await fixture('eurostat-electricity-prices/collection.json'), `${BASE}/tabular/eurostat-electricity-prices/collection.json`);
    assert.equal(table.renderPath, 'none');
    assert.equal(table.data?.format, 'parquet');
    assert.equal(fallbackStyle(table), null);
});

test('a collection without styles gets one unstyled layer per geometry kind', async () => {
    const doc = await fixture('netherlands-provinces/collection.json');
    const assets = Object.fromEntries(Object.entries(doc.assets as Record<string, { roles: string[] }>).filter(([, a]) => !a.roles.includes('style')));
    const info = readPortolanCollection({ ...doc, assets }, PROVINCES_URL);
    assert.equal(info.styles.length, 0);

    const style = fallbackStyle(info);
    const layers = style?.layers as Array<Record<string, unknown>>;
    assert.deepEqual(layers.map((l) => l.type), ['fill', 'line', 'circle']);
    assert.ok(layers.every((l) => l['source-layer'] === 'netherlands-provinces' && !('paint' in l)));
});

test('own style: the publisher layers are copied onto the config source, paint and source-layer intact', async () => {
    const info = readPortolanCollection(await fixture('netherlands-provinces/collection.json'), PROVINCES_URL);
    const doc = await fixture('netherlands-provinces/styles/labeled.json');
    const own = ownStyleLayers(info, 'provinces-source', { doc, url: info.styles[0].href });

    assert.equal(own?.dropped, 0);
    assert.deepEqual(own?.layers.map((l) => [l.type, l.source, l['source-layer']]), [
        ['fill', 'provinces-source', 'netherlands-provinces'],
        ['symbol', 'provinces-source', 'netherlands-provinces'],
    ]);
    const original = (doc.layers as Array<Record<string, unknown>>)[0];
    assert.deepEqual(own?.layers[0].paint, original.paint);
});

test('own style: a background and a basemap the style leans on are dropped, not copied', async () => {
    const info = readPortolanCollection(await fixture('netherlands-provinces/collection.json'), PROVINCES_URL);
    const own = ownStyleLayers(info, 's', {
        url: info.styles[0].href,
        doc: {
            version: 8,
            sources: { data: { type: 'vector', url: 'pmtiles://../netherlands-provinces.pmtiles' }, base: { type: 'raster', tiles: ['../t/{z}/{x}/{y}.png'] } },
            layers: [
                { id: 'bg', type: 'background' },
                { id: 'base', type: 'raster', source: 'base' },
                { id: 'fill', type: 'fill', source: 'data', 'source-layer': 'netherlands-provinces' },
            ],
        },
    });
    assert.deepEqual(own?.layers.map((l) => l.id), ['fill']);
    assert.equal(own?.dropped, 2);
});

test('own style: a GeoParquet collection loses source-layer, and no style falls back to plain layers', async () => {
    const info = readPortolanCollection(await fixture('natural-earth-countries/collection.json'), COUNTRIES_URL);
    const styled = ownStyleLayers(info, 's', { doc: await fixture('natural-earth-countries/styles/continents.json'), url: info.styles[0].href });
    assert.ok(styled && styled.layers.length > 0);
    assert.ok(styled.layers.every((l) => !('source-layer' in l) && l.source === 's'));

    const plain = ownStyleLayers(info, 's', null);
    assert.deepEqual(plain?.layers.map((l) => l.type), ['fill', 'line', 'circle']);
});
