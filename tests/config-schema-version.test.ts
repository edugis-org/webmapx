/**
 * The config schema version is 0, and that number is the point.
 *
 * webmapx is pre-1.0: nothing is promised about the config format yet, and a
 * tool can still be renamed as long as our own configs are renamed with it.
 * The version exists anyway because it can be bumped and never unbumped —
 * starting at the floor keeps every number above it free, 1 included, so 1 can
 * mean the schema release 1 actually supports rather than being spent on a
 * legacy literal.
 *
 * These tests hold that line: 0 stays the floor until someone deliberately
 * changes it, a config from the future warns instead of failing, and a config
 * that says nothing is left alone.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { CONFIG_SCHEMA_VERSION, configVersionStatus } from '../src/config/schema-version';
import { validateConfig } from '../src/config/validator';

function configWith(version: unknown): unknown {
    const config: Record<string, unknown> = {
        map: { center: [0, 0], zoom: 2, type: 'maplibre' },
        layerData: { sources: [], layers: [] },
    };
    if (version !== undefined) config.version = version;
    return config;
}

function versionWarnings(version: unknown): string[] {
    const result = validateConfig(configWith(version));
    return result.warnings.filter((w) => w.path === 'version').map((w) => w.message);
}

test('the schema version is below 1, so it promises nothing yet', () => {
    // Bumping this is a deliberate act with consequences for every config in
    // the wild; it should never move as a side effect of another change.
    assert.equal(CONFIG_SCHEMA_VERSION, 0);
});

test('a version is classified against this build', () => {
    assert.equal(configVersionStatus(CONFIG_SCHEMA_VERSION), 'current');
    assert.equal(configVersionStatus(CONFIG_SCHEMA_VERSION + 1), 'newer');
    assert.equal(configVersionStatus(CONFIG_SCHEMA_VERSION - 1), 'older');
    assert.equal(configVersionStatus(undefined), 'missing');
    assert.equal(configVersionStatus(null), 'missing');
    assert.equal(configVersionStatus('1'), 'invalid');
    assert.equal(configVersionStatus(Number.NaN), 'invalid');
});

test('a config from a newer build warns but stays valid', () => {
    const result = validateConfig(configWith(99));
    // Loading it must still be possible: a map missing one feature beats no map.
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
    assert.match(versionWarnings(99)[0], /schema version 99/);
});

test('a current, older or absent version says nothing', () => {
    assert.deepEqual(versionWarnings(CONFIG_SCHEMA_VERSION), []);
    assert.deepEqual(versionWarnings(undefined), []);
    // 0 is the floor, so there is nothing below it to migrate from yet.
    assert.deepEqual(versionWarnings(-1), []);
});

test('a non-numeric version is reported', () => {
    assert.match(versionWarnings('1')[0], /should be a number/);
});
