import test from 'node:test';
import assert from 'node:assert/strict';

import { classColor, classSubLayers, defaultZoneLevels, TRANSPARENT } from '../src/utils/sea-level-style';

const OPTIONS = { attribute: 'flood_level', today: -1, water: '#aad3df', land: '#f2efe9' };

test('the default levels are the coastal zones ETL\'s', () => {
    const levels = defaultZoneLevels(-134, 70);
    assert.deepEqual(levels.slice(0, 3), [-134, -130, -125]);
    assert.deepEqual(levels.slice(levels.indexOf(-5), levels.indexOf(15) + 1),
        [-5, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15]);
    assert.equal(levels[levels.length - 1], 70);
    assert.equal(levels.length, 51);
});

test('at today\'s level only the sea is drawn', () => {
    assert.equal(classColor(-1, -1, OPTIONS), '#aad3df');
    assert.equal(classColor(0, -1, OPTIONS), TRANSPARENT);
});

test('below today the exposed sea floor is drawn as land', () => {
    assert.equal(classColor(-120, -120, OPTIONS), '#aad3df');
    assert.equal(classColor(-60, -120, OPTIONS), '#f2efe9');
    assert.equal(classColor(-1, -120, OPTIONS), '#f2efe9');
    assert.equal(classColor(5, -120, OPTIONS), TRANSPARENT);
});

test('above today land that stays dry is left to the basemap', () => {
    assert.equal(classColor(25, 25, OPTIONS), '#aad3df');
    assert.equal(classColor(30, 25, OPTIONS), TRANSPARENT);
});

test('class sublayers cover every flood level between the listed ones', () => {
    const base = { source: 'zones-source', 'source-layer': 'zones' };
    const subs = classSubLayers('coast', base, [-130, -125, -1], -1, OPTIONS);
    assert.deepEqual(subs.map((s) => s.id), ['coast--130', 'coast--125', 'coast--1']);
    assert.deepEqual(subs[0].filter, ['<=', ['get', 'flood_level'], -130]);
    assert.deepEqual(subs[1].filter, ['all', ['>', ['get', 'flood_level'], -130], ['<=', ['get', 'flood_level'], -125]]);
    assert.equal(subs[2].source, 'zones-source');
    assert.equal(subs[2]['source-layer'], 'zones');
    assert.deepEqual(subs[2].paint, { 'fill-color': '#aad3df', 'fill-antialias': false });
});
