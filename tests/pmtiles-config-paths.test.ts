/**
 * A `pmtiles://` vector source url wraps the archive's own URL, and that inner
 * URL is config-relative like every other path in a config.
 *
 * The scheme alone would make the loader treat it as absolute and pass it
 * through, after which the pmtiles protocol fetches `data/zones.pmtiles`
 * relative to the *page* — the same silent 404 a relative style url used to
 * give (see style-layer-config-paths.test.ts).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { parseAndValidateConfig } from '../src/config/loader';

const CONFIG_URL = 'http://example.org/config/world.json';

function vectorSourceUrl(url: string, configUrl = CONFIG_URL): string | undefined {
    const config = parseAndValidateConfig({
        version: 0,
        map: { type: 'maplibre', center: [0, 0], zoom: 2 },
        layerData: {
            sources: [{ id: 'zones', type: 'vector', url, attribution: 'test' }],
            layers: [],
        },
    }, 'test', configUrl);

    const source = config.layerData.sources?.find((entry) => entry.id === 'zones');
    return (source as { url?: string } | undefined)?.url;
}

test('a relative pmtiles archive is resolved against the config', () => {
    assert.equal(
        vectorSourceUrl('pmtiles://../data/zones.pmtiles'),
        'pmtiles://http://example.org/data/zones.pmtiles',
    );
    assert.equal(
        vectorSourceUrl('pmtiles://zones.pmtiles'),
        'pmtiles://http://example.org/config/zones.pmtiles',
    );
});

test('an absolute pmtiles archive is left alone', () => {
    assert.equal(
        vectorSourceUrl('pmtiles://https://tiles.example.net/zones.pmtiles'),
        'pmtiles://https://tiles.example.net/zones.pmtiles',
    );
});
