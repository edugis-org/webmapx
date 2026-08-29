/**
 * A tool is declared once, in `tools/tool-registry.ts`, and every registry the
 * app uses is derived from it. These tests guard the two things that derivation
 * cannot enforce on its own.
 *
 * The first is the loader map in `tool-loader.ts`, which has to stay hand-written
 * because only a literal `import()` specifier is statically analysable by the
 * bundler. A registry entry with neither a loader nor a place in the core bundle
 * renders a toolbar button that does nothing at all when clicked — the bug
 * `tool-buffer.mjs` exists for — and nothing about that is an error at runtime.
 *
 * The second is that the registry describes tools that actually exist: a `tag`
 * naming a component file that is not there fails only when someone opens that
 * tool.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import {
    DEFAULT_TOOL_METADATA,
    KNOWN_TOOLS,
    STANDALONE_TAGS,
    TOOL_ELEMENT_TAGS,
    TOOL_REGISTRY,
    canonicalToolId,
} from '../src/tools/tool-registry';

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
 * by being imported, so they need no loader entry, and reading the bundle rather
 * than trusting the registry's own `bundled` flag is what makes that flag
 * checkable.
 */
function eagerlyBundledTags(): Set<string> {
    const source = readFileSync(path.join(process.cwd(), 'src/bootstrap/webmapx-core-bundle.ts'), 'utf8');
    const tags = new Set<string>();
    for (const match of source.matchAll(/import\s+'\.\.\/components\/([a-z0-9-]+)\.js'/g)) {
        tags.add(match[1]);
    }
    return tags;
}

test('every tool can actually be loaded', () => {
    const loaders = loaderIds();
    const bundled = eagerlyBundledTags();
    assert.ok(loaders.size > 10, `only found ${loaders.size} loaders — has the file's shape changed?`);
    assert.ok(bundled.size > 3, `only found ${bundled.size} bundled components — has the file's shape changed?`);

    const missing = TOOL_REGISTRY
        .filter((entry) => entry.tag && !loaders.has(entry.id) && !bundled.has(entry.tag))
        .map((entry) => entry.id);
    assert.deepEqual(missing, [], `no loader and not bundled: ${missing.join(', ')}`);
});

test("a tool's bundled flag matches what the core bundle imports", () => {
    const bundled = eagerlyBundledTags();
    const wrong = TOOL_REGISTRY
        .filter((entry) => entry.tag && Boolean(entry.bundled) !== bundled.has(entry.tag))
        .map((entry) => `${entry.id} (bundled: ${entry.bundled === true}, in core bundle: ${bundled.has(entry.tag!)})`);
    // A tool wrongly marked bundled has no loader and never upgrades; one
    // wrongly marked lazy is merely loaded twice, which is harmless but a lie.
    assert.deepEqual(wrong, [], `bundled flag disagrees with the core bundle: ${wrong.join(', ')}`);
});

test('the loader has no entry for a tool the registry does not know', () => {
    const unknown = [...loaderIds()].filter((id) => canonicalToolId(id) === id
        && !TOOL_REGISTRY.some((entry) => entry.id === id));
    assert.deepEqual(unknown, [], `loaded but unregistered: ${unknown.join(', ')}`);
});

test('every registered tag names a component that exists', () => {
    const missing = TOOL_REGISTRY
        .filter((entry) => entry.tag && !existsSync(path.join(process.cwd(), 'src/components', `${entry.tag}.ts`)))
        .map((entry) => `${entry.id} → ${entry.tag}`);
    assert.deepEqual(missing, [], `no component file for: ${missing.join(', ')}`);
});

test('an alias resolves everywhere its canonical id does', () => {
    for (const entry of TOOL_REGISTRY) {
        for (const alias of entry.aliases ?? []) {
            assert.equal(canonicalToolId(alias), entry.id, `${alias} should canonicalise to ${entry.id}`);
            if (!entry.tag) continue;
            const maps = entry.placement === 'standalone' ? [STANDALONE_TAGS] : [TOOL_ELEMENT_TAGS];
            if (entry.placement === 'both') maps.push(STANDALONE_TAGS);
            for (const map of maps) {
                assert.equal(map[alias], entry.tag, `${alias} should build ${entry.tag}`);
            }
        }
    }
});

test('the setup page offers every tool a user can add, and no alias', () => {
    const offered = KNOWN_TOOLS.map((tool) => tool.id);
    assert.deepEqual(
        offered,
        TOOL_REGISTRY.filter((entry) => entry.offered !== false && entry.tag).map((entry) => entry.id),
        'KNOWN_TOOLS should be exactly the offered entries, in registry order',
    );

    const aliases = TOOL_REGISTRY.flatMap((entry) => entry.aliases ?? []);
    const offeredAliases = offered.filter((id) => aliases.includes(id));
    assert.deepEqual(offeredAliases, [], `aliases offered as separate tools: ${offeredAliases.join(', ')}`);
});

test('label and icon defaults cover every toolbar tool but no standalone one', () => {
    for (const entry of TOOL_REGISTRY) {
        if (entry.offered === false) continue;
        if (entry.placement === 'standalone') {
            // Standalone furniture is placed by its own config section, not by a
            // button: giving the scale bar a default label would caption it.
            assert.equal(DEFAULT_TOOL_METADATA[entry.id], undefined, `${entry.id} should have no toolbar metadata`);
            continue;
        }
        assert.equal(DEFAULT_TOOL_METADATA[entry.id]?.label, entry.label, `${entry.id} label`);
        for (const name of entry.metadataAliases ?? []) {
            assert.equal(DEFAULT_TOOL_METADATA[name]?.label, entry.label, `${name} should share ${entry.id}'s label`);
        }
    }
});
