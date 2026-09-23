/**
 * A plugin's tool must land in every table a built-in tool does — tag maps,
 * toolbar metadata, the setup page's list, canonical ids, the "already loaded"
 * set — or it fails in one of the silent ways tool-registry.ts describes. And a
 * plugin must never be able to take over a tool configs already rely on.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    BUNDLED_TOOL_IDS,
    DEFAULT_TOOL_METADATA,
    KNOWN_TOOLS,
    STANDALONE_TAGS,
    TOOL_ELEMENT_TAGS,
    TOOL_REGISTRY,
    canonicalToolId,
    registerTool,
} from '../src/tools/tool-registry';
import { validateConfig } from '../src/config/validator';
import { resolvePluginUrl } from '../src/bootstrap/plugin-url';

const quietly = <T>(fn: () => T): T => {
    const warn = console.warn;
    console.warn = () => {};
    try { return fn(); } finally { console.warn = warn; }
};

test('a registered toolbar tool appears in every derived table', () => {
    const before = TOOL_REGISTRY.length;
    assert.equal(registerTool({ id: 'pluginA', tag: 'plugin-a-tool', placement: 'toolbar', label: 'Plugin A', icon: 'star' }), true);

    assert.equal(TOOL_REGISTRY.length, before + 1);
    assert.equal(TOOL_ELEMENT_TAGS.pluginA, 'plugin-a-tool');
    assert.equal(STANDALONE_TAGS.pluginA, undefined);
    assert.deepEqual(DEFAULT_TOOL_METADATA.pluginA, { label: 'Plugin A', icon: 'star' });
    assert.ok(BUNDLED_TOOL_IDS.has('pluginA'), 'a plugin tool is already defined, so it needs no lazy loader');
    assert.equal(canonicalToolId('pluginA'), 'pluginA');
    const known = KNOWN_TOOLS.find((tool) => tool.id === 'pluginA');
    assert.deepEqual(known, { id: 'pluginA', label: 'Plugin A', icon: 'star', plugin: true });
});

test('a registered standalone tool is placed by its section and gets no button metadata', () => {
    assert.equal(registerTool({ id: 'pluginB', tag: 'plugin-b-control', placement: 'standalone', label: 'Plugin B' }), true);
    assert.equal(STANDALONE_TAGS.pluginB, 'plugin-b-control');
    assert.equal(TOOL_ELEMENT_TAGS.pluginB, undefined);
    assert.equal(DEFAULT_TOOL_METADATA.pluginB, undefined);
    assert.equal(KNOWN_TOOLS.find((tool) => tool.id === 'pluginB')?.standalone, true);
});

test('a plugin cannot take over a built-in id, alias or tag', () => {
    quietly(() => {
        assert.equal(registerTool({ id: 'draw', tag: 'evil-draw', placement: 'toolbar', label: 'Draw' }), false);
        assert.equal(registerTool({ id: 'layers', tag: 'evil-layers', placement: 'toolbar', label: 'Layers' }), false, 'metadata alias of layerTree');
        assert.equal(registerTool({ id: 'myDraw', tag: 'webmapx-draw-tool', placement: 'toolbar', label: 'Draw' }), false);
        assert.equal(registerTool({ id: 'ok', tag: 'x-ok', placement: 'toolbar', label: 'Ok', aliases: ['measure'] }), false);
    });
    assert.equal(TOOL_ELEMENT_TAGS.draw, 'webmapx-draw-tool');
    assert.equal(canonicalToolId('layers'), 'layerTree');
});

test('registering the same plugin twice is a no-op, a conflicting re-registration is refused', () => {
    const entry = { id: 'pluginC', tag: 'plugin-c-tool', placement: 'toolbar' as const, label: 'Plugin C' };
    assert.equal(registerTool(entry), true);
    const count = TOOL_REGISTRY.length;
    assert.equal(registerTool(entry), true);
    assert.equal(TOOL_REGISTRY.length, count);
    assert.equal(quietly(() => registerTool({ ...entry, tag: 'plugin-c-other' })), false);
    assert.equal(TOOL_ELEMENT_TAGS.pluginC, 'plugin-c-tool');
});

test('malformed entries are refused', () => {
    quietly(() => {
        assert.equal(registerTool({ id: 'noHyphen', tag: 'nohyphen', placement: 'toolbar', label: 'x' }), false);
        assert.equal(registerTool({ id: '', tag: 'x-y', placement: 'toolbar', label: 'x' }), false);
        assert.equal(registerTool({ id: 'badPlacement', tag: 'x-z', placement: 'floating' as never, label: 'x' }), false);
        assert.equal(registerTool({ id: 'noLabel', tag: 'x-w', placement: 'toolbar', label: '' }), false);
    });
});

test('the validator accepts a registered plugin tool and the plugins key', () => {
    registerTool({ id: 'pluginD', tag: 'plugin-d-tool', placement: 'toolbar', label: 'Plugin D' });
    const config = {
        map: { type: 'maplibre', center: [0, 0], zoom: 2 },
        layerData: { sources: [], layers: [] },
        plugins: ['plugins/d.js'],
        tools: { main: { type: 'toolbar', enabled: true, items: [{ type: 'pluginD' }, { type: 'notLoaded' }] } },
    };
    const result = validateConfig(config);
    const messages = result.warnings.map((w) => `${w.path}: ${w.message}`);
    assert.ok(!messages.some((m) => m.includes('pluginD')), messages.join('\n'));
    assert.ok(!messages.some((m) => m.startsWith('plugins')), messages.join('\n'));
    const unknown = messages.find((m) => m.includes('notLoaded'));
    assert.ok(unknown?.includes('plugin that has not been loaded'), unknown);
});

test('plugin URLs: same origin (relative to the config) or a trusted CDN only', () => {
    const page = 'https://maps.example.org';
    const config = 'https://maps.example.org/app/config/nl.json';
    assert.equal(resolvePluginUrl('../plugins/b.js', config, page), 'https://maps.example.org/app/plugins/b.js');
    assert.equal(resolvePluginUrl('https://cdn.jsdelivr.net/npm/x@1/p.js', config, page), 'https://cdn.jsdelivr.net/npm/x@1/p.js');
    assert.equal(resolvePluginUrl('https://evil.example.com/p.js', config, page), null);
    // A config loaded from elsewhere cannot reach this origin's trust with a relative path.
    assert.equal(resolvePluginUrl('p.js', 'https://evil.example.com/c.json', page), null);
    // Prefix matching is on the resolved URL, so a look-alike host does not pass.
    assert.equal(resolvePluginUrl('https://unpkg.com.evil.example/p.js', config, page), null);
});
