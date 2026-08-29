/**
 * A computed source's `data=` directory is config-relative, and its `{ma}`
 * placeholder has to survive being resolved.
 *
 * Both halves fail silently. A directory resolved against the page instead of
 * the config points somewhere that may happen to exist, and a placeholder
 * escaped to `%7Bma%7D` still looks like a perfectly good url — it just stops
 * matching, so the layer is never recognised as following the map's clock and
 * never redrawn. It draws once and sits there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { parseAndValidateConfig } from '../src/config/loader';

const CONFIG_URL = 'http://example.org/config/demo.json';

function configWith(data: string) {
    return parseAndValidateConfig({
        version: 1,
        map: { type: 'maplibre', center: [0, 0], zoom: 2 },
        layerData: {
            sources: [{ id: 'paleo-source', type: 'geojson', data }],
            layers: [],
        },
    }, 'test', CONFIG_URL);
}

function sourceData(data: string): string {
    const config = configWith(data);
    const source = (config.layerData?.sources as unknown as Array<Record<string, unknown>>)[0];
    return source.data as string;
}

test('the data directory is resolved against the config, not the page', () => {
    const url = sourceData('internalfunc://paleo-coastlines?data=../data/paleo/merdith2021&ma={ma}');
    assert.ok(
        url.includes('data=http%3A%2F%2Fexample.org%2Fdata%2Fpaleo%2Fmerdith2021')
        || url.includes('data=http://example.org/data/paleo/merdith2021'),
        `directory not resolved against the config: ${url}`,
    );
});

test('a map-state placeholder survives resolution unescaped', () => {
    const url = sourceData('internalfunc://paleo-coastlines?data=../data/paleo/merdith2021&ma={ma}');
    assert.ok(url.includes('{ma}'), `the placeholder was escaped away: ${url}`);
    assert.ok(!/%7B/i.test(url), `the placeholder is percent-encoded: ${url}`);
});

test('a computed source with no data directory is left exactly as written', () => {
    const written = 'internalfunc://day-night?refresh=auto';
    assert.equal(sourceData(written), written);
});
