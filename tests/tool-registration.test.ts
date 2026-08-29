/**
 * A tool has to be registered in several places, and missing one fails quietly.
 *
 * `TOOL_ELEMENT_TAGS` decides which element a config's tool type builds,
 * `TOOL_LOADERS` decides whether that element's module is ever imported,
 * and `KNOWN_TOOLS` is what the setup page offers. Each omission has its own
 * symptom and none of them is an error: a tool absent from the loader map renders an inert
 * toolbar button (the bug `tool-buffer.mjs` exists for), and one absent from
 * `KNOWN_TOOLS` simply cannot be added in the setup UI at all — which is how
 * the paleotime tool came to work everywhere except in the one place a user would
 * go to switch it on.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { KNOWN_TOOLS, TOOL_ELEMENT_TAGS } from '../src/utils/dynamic-layout';

/**
 * The loader map (`TOOL_MAP`) is read as text rather than imported.
 *
 * Its values are `() => import('…')` for every tool component, and a bundler
 * follows those: importing it here pulls in Leaflet, Cesium and their CSS, and
 * the test build fails on an image the test has no interest in. The registration
 * is a list of keys, and the keys are what this checks.
 */
function loaderIds(): Set<string> {
    const source = readFileSync(path.join(process.cwd(), 'src/bootstrap/tool-loader.ts'), 'utf8');
    const start = source.indexOf('const TOOL_MAP');
    if (start < 0) throw new Error('tool-loader.ts no longer declares TOOL_MAP');
    const body = source.slice(start);
    const ids = new Set<string>();
    for (const match of body.matchAll(/^\s*'?([A-Za-z0-9_-]+)'?\s*:\s*\(\)\s*=>/gm)) {
        ids.add(match[1]);
    }
    return ids;
}

/**
 * The elements the core bundle imports outright.
 *
 * A handful of components are part of every map rather than loaded on demand —
 * the catalog and the legend, and the two sub-tool containers, which have to
 * exist before anything they hold can be slotted into them. They are registered
 * by being imported, so they need no loader entry, and checking the bundle
 * rather than listing their names keeps this honest if that set changes.
 */
function eagerlyBundledTags(): Set<string> {
    const source = readFileSync(path.join(process.cwd(), 'src/bootstrap/webmapx-core-bundle.ts'), 'utf8');
    const tags = new Set<string>();
    for (const match of source.matchAll(/import\s+'\.\.\/components\/([a-z0-9-]+)\.js'/g)) {
        tags.add(match[1]);
    }
    return tags;
}

/**
 * Tools that are deliberately not offered in the setup page's tool list.
 *
 * Standalone map furniture (a scale bar, the attribution) is configured
 * elsewhere in that UI, and a few types are aliases kept so old configs keep
 * working rather than things to offer afresh.
 */
const NOT_OFFERED = new Set([
    'layers', 'catalog', 'datacatalog', 'geolocate', 'legend', 'view-mode',
    'time-slider', 'settings', 'insetMap', 'activeAdapter',
]);

test('every tool the setup page offers can actually be built', () => {
    const missing = KNOWN_TOOLS
        .filter((tool) => !tool.standalone)
        .map((tool) => tool.id)
        .filter((id) => !TOOL_ELEMENT_TAGS[id]);
    assert.deepEqual(missing, [], `offered in setup but no element tag: ${missing.join(', ')}`);
});

test('every tool element the layout can build is also loaded', () => {
    const loaders = loaderIds();
    const bundled = eagerlyBundledTags();
    assert.ok(loaders.size > 10, `only found ${loaders.size} loaders — has the file's shape changed?`);
    assert.ok(bundled.size > 3, `only found ${bundled.size} bundled components — has the file's shape changed?`);
    const missing = Object.entries(TOOL_ELEMENT_TAGS)
        .filter(([id, tag]) => !loaders.has(id) && !bundled.has(tag))
        .map(([id]) => id);
    // Without a loader the custom element never upgrades: the button appears
    // and does nothing at all when clicked.
    assert.deepEqual(missing, [], `no loader for: ${missing.join(', ')}`);
});

test('every buildable tool is offered in the setup page, unless deliberately not', () => {
    const offered = new Set(KNOWN_TOOLS.map((tool) => tool.id));
    const missing = Object.keys(TOOL_ELEMENT_TAGS)
        .filter((id) => !offered.has(id) && !NOT_OFFERED.has(id));
    assert.deepEqual(missing, [], `buildable but not offered in setup: ${missing.join(', ')}`);
});
