/**
 * A tool's `data` path is config-relative, which is what lets a dataset belong
 * to the configuration that uses it rather than to webmapx itself.
 *
 * The paleotime tool reads `tools.paleotime.data` and fetches the plate model
 * from it at runtime. Unresolved, that fetch goes through the browser's own
 * resolution — against the *page* — so the same value meant different
 * directories depending on where the app's HTML sat, and a config loaded from
 * another origin looked for its 4.4 MB of plate data on the app's host rather
 * than beside the config that asked for it.
 *
 * The source-level spelling (`internalfunc://paleo-coastlines?data=…` in
 * layerData) has always been config-relative; this makes the tool section agree.
 * Tool data is a config *asset* — it lives under the config directory and
 * travels with the config, which is what lets a configurator add a tool in
 * setup.html and have preview.html find its data.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { parseAndValidateConfig } from '../src/config/loader';

const CONFIG_URL = 'http://example.org/configs/deeptime.json';

function toolData(tools: Record<string, unknown>, configUrl = CONFIG_URL): unknown {
    const config = parseAndValidateConfig({
        version: 0,
        map: { type: 'maplibre', center: [0, 0], zoom: 2 },
        layerData: { sources: [], layers: [] },
        tools,
    }, 'test', configUrl);
    return config.tools;
}

test("a tool's data directory resolves against the config", () => {
    const tools = toolData({ paleotime: { enabled: true, data: 'data/paleo/merdith2021', to: 1000 } }) as
        Record<string, { data: string; to: number }>;
    assert.equal(tools.paleotime.data, 'http://example.org/configs/data/paleo/merdith2021');
    // Everything else in the section is left exactly as it was.
    assert.equal(tools.paleotime.to, 1000);
});

test('the data travels with a config loaded from another origin', () => {
    const tools = toolData(
        { paleotime: { enabled: true, data: 'data/paleo/merdith2021' } },
        'https://raw.githubusercontent.com/edugis-org/webmapx-configs/main/configs/deeptime.json',
    ) as Record<string, { data: string }>;
    assert.equal(
        tools.paleotime.data,
        'https://raw.githubusercontent.com/edugis-org/webmapx-configs/main/configs/data/paleo/merdith2021',
    );
});

test('an absolute data url is left alone', () => {
    const tools = toolData({ paleotime: { enabled: true, data: 'https://cdn.example.net/paleo' } }) as
        Record<string, { data: string }>;
    assert.equal(tools.paleotime.data, 'https://cdn.example.net/paleo');
});

test('a tool nested in a toolbar item resolves its own data', () => {
    const tools = toolData({
        mainToolbar: {
            type: 'toolbar', enabled: true,
            items: [{ type: 'paleotime', id: 'paleotime', enabled: true, data: 'data/paleo/merdith2021' }],
        },
    }) as Record<string, { items: Array<{ data: string }> }>;
    assert.equal(tools.mainToolbar.items[0].data, 'http://example.org/configs/data/paleo/merdith2021');
});

test('a tool section without data is untouched', () => {
    const tools = toolData({ search: { enabled: true, provider: 'nominatim' } }) as
        Record<string, Record<string, unknown>>;
    assert.deepEqual(tools.search, { enabled: true, provider: 'nominatim' });
});
