/**
 * A config names tools, and the app drops a name it does not recognise without
 * a word — `appendSubTools` skips a toolbar item whose `type` has no element,
 * `buildStandalone` skips a section with no tag. The map loads, one tool short.
 *
 * That silence is what makes a config and a build drift apart unnoticed: a typo
 * and a tool from a newer webmapx look identical, and neither is reported. The
 * validator is where that becomes visible, so these tests pin both what must
 * warn and — just as much — what must not, since a validator that cries wolf on
 * every shipped config is one people stop reading.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { validateConfig } from '../src/config/validator';

interface Tools {
    [name: string]: unknown;
}

/** A config with just enough around `tools` to validate cleanly. */
function configWith(tools: Tools): unknown {
    return {
        version: 1,
        map: { center: [0, 0], zoom: 2, type: 'maplibre' },
        layerData: { sources: [], layers: [] },
        tools,
    };
}

function toolWarnings(tools: Tools): string[] {
    const result = validateConfig(configWith(tools));
    return [...result.errors, ...result.warnings]
        .filter((message) => message.path.startsWith('tools'))
        .filter((message) => !message.message.startsWith('Unknown key'))
        .filter((message) => !message.message.includes('missing "enabled"'))
        .map((message) => `${message.path}: ${message.message}`);
}

const toolbar = (items: unknown[]): Tools => ({
    mainToolbar: { type: 'toolbar', enabled: true, position: 'top-left', items },
});

test('an unknown toolbar item is reported', () => {
    const warnings = toolWarnings(toolbar([{ type: 'sheetimport', enabled: true }]));
    assert.equal(warnings.length, 1, warnings.join('\n'));
    assert.match(warnings[0], /Unknown tool "sheetimport"/);
    assert.match(warnings[0], /mainToolbar\.items\[0\]\.type/);
});

test('an unknown tools section is reported', () => {
    const warnings = toolWarnings({ pitch: { enabled: true } });
    assert.equal(warnings.length, 1, warnings.join('\n'));
    assert.match(warnings[0], /Unknown tool "pitch"/);
});

test('a toolbar item with no type is reported', () => {
    const warnings = toolWarnings(toolbar([{ id: 'something', enabled: true }]));
    assert.equal(warnings.length, 1, warnings.join('\n'));
    assert.match(warnings[0], /missing "type"/);
});

test('a standalone control used as a toolbar item is reported', () => {
    // It builds nothing there: buildStandalone is only reached for a top-level
    // section, so a scale bar listed among toolbar items silently vanishes.
    const warnings = toolWarnings(toolbar([{ type: 'scale', enabled: true }]));
    assert.equal(warnings.length, 1, warnings.join('\n'));
    assert.match(warnings[0], /standalone map control/);
});

test('an unknown tool nested deep inside a toolbox is still found', () => {
    const warnings = toolWarnings(toolbar([
        {
            type: 'toolbox', enabled: true, items: [
                { type: 'menu', enabled: true, items: [{ type: 'nosuchtool', enabled: true }] },
            ],
        },
    ]));
    assert.equal(warnings.length, 1, warnings.join('\n'));
    assert.match(warnings[0], /Unknown tool "nosuchtool"/);
    assert.match(warnings[0], /items\[0\]\.items\[0\]\.items\[0\]\.type/);
});

test('a section carrying a toolbar tool\'s own parameters does not warn', () => {
    // demo.json does exactly this: the button comes from a toolbar's items,
    // while `tools.search` holds the provider the tool reads at runtime.
    assert.deepEqual(toolWarnings({
        search: { enabled: true, provider: 'nominatim' },
        buffer: { enabled: true, label: 'Buffer' },
    }), []);
});

test('standalone furniture, containers, spacers and aliases do not warn', () => {
    assert.deepEqual(toolWarnings({
        scale: { type: 'scale', enabled: true, position: 'bottom-left' },
        activeAdapter: { type: 'activeAdapter', enabled: true, position: 'top-right' },
        'active-adapter': { type: 'active-adapter', enabled: true, position: 'top-right' },
        ...toolbar([
            { type: 'spacer' },
            { type: 'view-mode', enabled: true },
            { type: 'time-slider', enabled: true },
            { type: 'toolbox', enabled: true, items: [{ type: 'measure', enabled: true }] },
        ]),
    }), []);
});
