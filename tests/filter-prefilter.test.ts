/**
 * The pre-filter that narrows a filtered GeoJSON sublayer's source in
 * OpenLayers. It may keep too much — the style function applies the real
 * filter afterwards — but it must never drop a feature the filter would draw.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mayMatchFilter, isSelectiveFilter } from '../src/map/openlayers-services/filter-prefilter';

const zone = { flood_level: -60, name: 'Doggerland' };

test('an equality on a property narrows exactly', () => {
    assert.equal(mayMatchFilter(['==', ['get', 'flood_level'], -60], zone), true);
    assert.equal(mayMatchFilter(['==', ['get', 'flood_level'], -55], zone), false);
    assert.equal(mayMatchFilter(['==', 'flood_level', -55], zone), false, 'legacy syntax');
    assert.equal(isSelectiveFilter(['==', ['get', 'flood_level'], -60]), true);
});

test('comparisons follow MapLibre: no coercion between types', () => {
    assert.equal(mayMatchFilter(['<', ['get', 'flood_level'], 0], zone), true);
    assert.equal(mayMatchFilter(['>=', ['get', 'flood_level'], 0], zone), false);
    assert.equal(mayMatchFilter(['==', ['get', 'flood_level'], '-60'], zone), false);
    assert.equal(mayMatchFilter(['<', ['get', 'name'], 5], zone), false);
});

test('all and any combine, and only a certain rejection drops a feature', () => {
    assert.equal(mayMatchFilter(['all', ['==', ['get', 'name'], 'Doggerland'], ['<', ['get', 'flood_level'], -50]], zone), true);
    assert.equal(mayMatchFilter(['all', ['==', ['get', 'name'], 'Doggerland'], ['>', ['get', 'flood_level'], -50]], zone), false);
    assert.equal(mayMatchFilter(['any', ['==', ['get', 'name'], 'Elsewhere'], ['<', ['get', 'flood_level'], -50]], zone), true);
    // Undecidable parts keep the feature.
    assert.equal(mayMatchFilter(['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'flood_level'], -60]], zone), true);
    assert.equal(mayMatchFilter(['any', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'flood_level'], 0]], zone), true);
});

test('anything it cannot evaluate keeps the feature', () => {
    assert.equal(mayMatchFilter(['match', ['get', 'name'], ['X'], true, false], zone), true);
    assert.equal(mayMatchFilter(['<', ['zoom'], 5], zone), true);
    // In an expression a bare string is a string, not a property name.
    assert.equal(mayMatchFilter(['==', 'name', ['literal', 'name']], zone), true);
    assert.equal(isSelectiveFilter(['==', ['geometry-type'], 'Point']), false);
    assert.equal(mayMatchFilter(['==', '$type', 'Point'], zone), true, 'legacy geometry type');
    assert.equal(isSelectiveFilter(['any', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'x'], 1]]), false);
});
