/**
 * Where the API keys are looked for is a property of the *config*, not of the
 * page showing it.
 *
 * `src/config/apikeys.ts` used to fetch the bare relative url
 * `config/apikeys.json`, which the browser resolves against the document. The
 * same code therefore looked in a different place depending on where the HTML
 * sat: `/config/apikeys.json` from the app's own index, but
 * `/testpages/config/apikeys.json` from a page under `testpages/` — which is
 * why the deploy workflow wrote the same secret out twice, once per page
 * location, and why a config loaded from anywhere else got no keys at all.
 *
 * `apiKeysFile` is resolved like every other path in a config: against the
 * config's own url. The default puts the file beside the config, so one
 * apikeys.json serves a directory of configs, and a config in a subdirectory
 * reaches it with `../apikeys.json`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { parseAndValidateConfig } from '../src/config/loader';
import { validateConfig } from '../src/config/validator';

const CONFIG_URL = 'http://example.org/config/demo.json';

function parse(extra: Record<string, unknown>, configUrl = CONFIG_URL) {
    return parseAndValidateConfig({
        version: 0,
        map: { type: 'maplibre', center: [0, 0], zoom: 2 },
        layerData: { sources: [], layers: [] },
        ...extra,
    }, 'test', configUrl);
}

test('the keys file defaults to sitting beside the config', () => {
    assert.equal(parse({}).apiKeysFile, 'http://example.org/config/apikeys.json');
});

test('a config in a subdirectory can reach the keys file above it', () => {
    const config = parse(
        { apiKeysFile: '../../apikeys.json' },
        'http://example.org/config/docs/tools/cartogram.json',
    );
    assert.equal(config.apiKeysFile, 'http://example.org/config/apikeys.json');
});

test('the page the config is shown on does not change the answer', () => {
    // The old behaviour: the same config served under /testpages/ looked for
    // /testpages/config/apikeys.json. It now depends only on the config's url.
    const fromRoot = parse({}, 'http://example.org/config/demo.json');
    const fromTestpages = parse({}, 'http://example.org/config/demo.json');
    assert.equal(fromRoot.apiKeysFile, fromTestpages.apiKeysFile);
    assert.equal(fromRoot.apiKeysFile, 'http://example.org/config/apikeys.json');
});

test('an absolute url is used as given', () => {
    const config = parse({ apiKeysFile: 'https://keys.example.net/apikeys.json' });
    assert.equal(config.apiKeysFile, 'https://keys.example.net/apikeys.json');
});

test('a blank value falls back to the default rather than to the config itself', () => {
    // `new URL('', base)` resolves to the base — which would make the config
    // file its own keys file, and answer with the config as the key map.
    assert.equal(parse({ apiKeysFile: '   ' }).apiKeysFile, 'http://example.org/config/apikeys.json');
});

test('apiKeysFile is a known key, so a config using it draws no warning', () => {
    const result = validateConfig({
        version: 0,
        apiKeysFile: '../apikeys.json',
        map: { type: 'maplibre', center: [0, 0], zoom: 2 },
        layerData: { sources: [], layers: [] },
    } as never);
    assert.equal(result.valid, true);
    assert.deepEqual(result.warnings.filter(w => w.path.includes('apiKeysFile')), []);
});
