/**
 * A `type: 'style'` layer's `url` points at a style document, and it is
 * config-relative like every other path in a config.
 *
 * It was the one relative resource the loader passed through untouched, and the
 * failure is silent: `webmapx-map` fetches it with `fetch(styleUrl)`, which the
 * browser resolves against the *page*, so a config in /config/ referencing
 * `styles/osmbright.json` had it requested from whatever directory the app's
 * HTML happened to sit in. Measured on the demo layout, where the app is served
 * from /demo/:
 *
 *   200  /styles/openmaptiles/osmbright.json          (where the file is)
 *   404  /demo/styles/openmaptiles/osmbright.json     (what was requested)
 *
 * The background just never appeared. It also made a cross-origin config
 * impossible — `?config=https://raw.githubusercontent.com/…/world.json` looked
 * for the styles on localhost — which is exactly how a config repository is
 * meant to be tested against a local build.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { parseAndValidateConfig } from '../src/config/loader';

const CONFIG_URL = 'http://example.org/config/world.json';

function styleLayerUrl(url: string, configUrl = CONFIG_URL): string | undefined {
    const config = parseAndValidateConfig({
        version: 0,
        map: { type: 'maplibre', center: [0, 0], zoom: 2 },
        layerData: {
            sources: [],
            layers: [{ id: 'osmbright', title: 'Bright', type: 'style', url }],
        },
    }, 'test', configUrl);

    const layer = config.layerData.layers?.find((entry) => entry.id === 'osmbright');
    return (layer as { url?: string } | undefined)?.url;
}

test('a style url is resolved against the config, not the page', () => {
    assert.equal(
        styleLayerUrl('../styles/openmaptiles/osmbright.json'),
        'http://example.org/styles/openmaptiles/osmbright.json',
    );
    assert.equal(
        styleLayerUrl('styles/osmbright.json'),
        'http://example.org/config/styles/osmbright.json',
    );
});

test('a style url survives a config loaded from another origin', () => {
    // The point of the fix: the styles travel with the config.
    assert.equal(
        styleLayerUrl(
            '../styles/openmaptiles/osmbright.json',
            'https://raw.githubusercontent.com/edugis-org/webmapx-configs/main/configs/world.json',
        ),
        'https://raw.githubusercontent.com/edugis-org/webmapx-configs/main/styles/openmaptiles/osmbright.json',
    );
});

test('an absolute style url is left alone', () => {
    assert.equal(
        styleLayerUrl('https://tiles.openfreemap.org/styles/liberty'),
        'https://tiles.openfreemap.org/styles/liberty',
    );
    assert.equal(styleLayerUrl('//example.net/style.json'), '//example.net/style.json');
});

test('a legacy inline style object resolves its url too', () => {
    const config = parseAndValidateConfig({
        version: 0,
        map: { type: 'maplibre', center: [0, 0], zoom: 2 },
        layerData: {
            sources: [],
            layers: [{ id: 'legacy', title: 'Legacy', style: { url: '../styles/legacy.json' } }],
        },
    }, 'test', CONFIG_URL);

    const layer = config.layerData.layers?.find((entry) => entry.id === 'legacy');
    assert.equal((layer as { url?: string }).url, 'http://example.org/styles/legacy.json');
});

/**
 * A style layer's own `sources` are config-relative too. The loader already
 * resolved them into the scoped copies it registers (`<layerId>:<key>`), but
 * handed the layer back with the *raw* map, and adding the layer reads that
 * one: a `data/x.topojson` in a config under /config/ was fetched from
 * /data/x.topojson, where the dev server answers with index.html.
 */
function styleLayerSources(layer: Record<string, unknown>): Record<string, Record<string, unknown>> {
    const config = parseAndValidateConfig({
        version: 0,
        map: { type: 'maplibre', center: [0, 0], zoom: 2 },
        layerData: { sources: [], layers: [layer] },
    }, 'test', CONFIG_URL);

    const found = config.layerData.layers?.find((entry) => entry.id === layer.id);
    return (found as { sources?: Record<string, Record<string, unknown>> }).sources ?? {};
}

test("a style layer's own sources are resolved against the config", () => {
    const sources = styleLayerSources({
        id: 'borders',
        title: 'Borders',
        type: 'style',
        sources: {
            shapes: { type: 'geojson', data: 'data/borders.topojson#borders' },
            tiles: { type: 'raster', tiles: ['tiles/{z}/{x}/{y}.png'] },
        },
        layers: [{ id: 'borders-line', type: 'line', source: 'shapes' }],
    });

    assert.equal(sources.shapes.data, 'http://example.org/config/data/borders.topojson#borders');
    assert.deepEqual(sources.tiles.tiles, ['http://example.org/config/tiles/{z}/{x}/{y}.png']);
});

test("a legacy inline style object's sources are resolved too", () => {
    const sources = styleLayerSources({
        id: 'legacy-borders',
        title: 'Legacy borders',
        style: {
            sources: { shapes: { type: 'geojson', data: '../data/borders.geojson' } },
            layers: [{ id: 'legacy-line', type: 'line', source: 'shapes' }],
        },
    });

    assert.equal(sources.shapes.data, 'http://example.org/data/borders.geojson');
});

test('a relative tile template keeps its placeholders', () => {
    // `new URL` percent-encodes braces, and `%7Bz%7D` is a literal to every engine.
    const config = parseAndValidateConfig({
        version: 0,
        map: { type: 'maplibre', center: [0, 0], zoom: 2 },
        layerData: {
            sources: [{ id: 'local-tiles', type: 'raster', tiles: ['tiles/{z}/{x}/{y}.png'] }],
            layers: [{ id: 'local', title: 'Local', type: 'raster', source: 'local-tiles' }],
        },
    }, 'test', CONFIG_URL);

    const source = config.layerData.sources?.find((entry) => entry.id === 'local-tiles') as { tiles?: string[]; url?: string | string[] };
    const urls = [source.tiles ?? [], source.url ?? []].flat();
    assert.ok(urls.length > 0);
    for (const url of urls) assert.equal(url, 'http://example.org/config/tiles/{z}/{x}/{y}.png');
});
