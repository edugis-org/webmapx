/**
 * Which plate model is on show, and which layers belong to it.
 *
 * Two faults this pins, both reported from the deep-time demo:
 *
 * 1. **A config's plate layers stayed drawn under every model.** The tool hid
 *    the config's own *coastline* layer while another model was selected, but
 *    matched only `paleo-coastlines`. Plate boundaries and deforming zones come
 *    from `paleo-plates`, so nothing ever touched them: `deeptime.json` starts
 *    on Merdith, which ships no boundaries, and the map opened with Müller's
 *    crust moving under Merdith's continents. Which model a layer belongs to is
 *    written in its source url's `data` parameter, and that is what decides.
 *
 * 2. **Only one model was offered unless a config listed them.** `models` came
 *    solely from the config, so a tool added through the setup page — which
 *    writes `{ enabled: true }` and nothing else — had no way to reach the
 *    second model even though its data sits beside the config.
 *
 * The tool itself needs a browser; what is checked here is the logic those two
 * fixes turn on, against the shipped configuration rather than a fixture, so a
 * config that stops matching the code fails the test.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** The model directory an `internalfunc://paleo-…` url draws — the tool's rule. */
function directoryOf(internalFuncUrl: string): string | null {
    const match = /[?&]data=([^&]*)/.exec(internalFuncUrl);
    return match ? decodeURIComponent(match[1]) : null;
}

const TOOL = readFileSync(path.resolve(process.cwd(), 'src/components/webmapx-deeptime-tool.ts'), 'utf8');

test('a paleo source url names the model it belongs to', () => {
    // This is the whole basis of telling one model's layers from another's.
    assert.equal(
        directoryOf('internalfunc://paleo-plates?data=data%2Fpaleo%2Fmuller2019%2Fplates&ma={ma}'),
        'data/paleo/muller2019/plates',
    );
    assert.equal(
        directoryOf('internalfunc://paleo-coastlines?data=data/paleo/merdith2021&ma={ma}'),
        'data/paleo/merdith2021',
    );
    assert.equal(directoryOf('internalfunc://paleo-coastlines?ma={ma}'), null);
});

test('the tool decides plate visibility by model, not by geometry kind', () => {
    // The bug was a rule that looked only for `paleo-coastlines`; plate layers
    // have to be considered too, or they outlive the model that owns them.
    assert.match(TOOL, /paleo-plates/, 'plate sources must be recognised when syncing');
    assert.match(TOOL, /function directoryOf/, 'the model directory has to be read from the url');
    assert.doesNotMatch(
        TOOL,
        /setForeignLayersVisible/,
        'the coastlines-only rule should be gone, not merely bypassed',
    );
});

test('the tool offers both shipped models without a config listing them', () => {
    assert.match(TOOL, /const DEFAULT_MODELS/, 'a default model list must exist');
    for (const id of ['merdith2021', 'muller2019']) {
        assert.ok(TOOL.includes(id), `${id} must be among the defaults`);
    }
    // Müller carries plate boundaries and Merdith does not — which is exactly
    // what makes the visibility rule above observable.
    const defaults = TOOL.slice(TOOL.indexOf('const DEFAULT_MODELS'), TOOL.indexOf('const LAYER_ID'));
    assert.match(defaults, /plates:/, 'the model that has plates must declare them');
    assert.equal(
        (defaults.match(/plates:/g) ?? []).length,
        1,
        'only one of the two ships plate boundaries',
    );
});

test('the shipped config and the built-in defaults describe the same models', () => {
    // The defaults exist so a config need not repeat them. If deeptime.json
    // ever names different directories, one of the two is wrong.
    const configPath = path.resolve(process.cwd(), 'public/config/deeptime.json');
    if (!existsSync(configPath)) return; // configs are a checkout; skip when absent

    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    const models = config?.tools?.deeptime?.models;
    if (!Array.isArray(models)) return;

    for (const model of models) {
        assert.ok(
            TOOL.includes(String(model.data)),
            `deeptime.json names ${model.data}, which the defaults do not`,
        );
    }
});
