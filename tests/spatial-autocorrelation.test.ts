import test from 'node:test';
import assert from 'node:assert/strict';

import { buildWeights, globalMoran, localMoran, significantAfterFdr } from '../src/utils/spatial-autocorrelation';
import { identicalAttributeGroups } from '../src/utils/thematic-map';

/** An n×n mosaic of unit squares sharing their corners exactly. */
function grid(size: number): GeoJSON.Geometry[] {
    const cells: GeoJSON.Geometry[] = [];
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            cells.push({ type: 'Polygon', coordinates: [[[col, row], [col + 1, row], [col + 1, row + 1], [col, row + 1], [col, row]]] });
        }
    }
    return cells;
}

const identity = (n: number) => Array.from({ length: n }, (_, i) => i);

test('a mosaic gets its neighbours from shared vertices', () => {
    const weights = buildWeights(grid(3), identity(9), 9);
    assert.equal(weights.method, 'contiguity');
    assert.equal(weights.neighbours[4].length, 8, 'the centre cell touches all eight others');
    assert.equal(weights.neighbours[0].length, 3, 'a corner cell touches three');
});

test('points, which touch nothing, get nearest neighbours', () => {
    const points: GeoJSON.Geometry[] = identity(20).map(i => ({ type: 'Point', coordinates: [i % 5, Math.floor(i / 5)] }));
    const weights = buildWeights(points, identity(20), 20);
    assert.equal(weights.method, 'nearest');
    assert.ok(weights.neighbours.every(list => list.length === 6));
});

test('scattered polygons that do not form a mosaic switch to nearest neighbours', () => {
    const apart: GeoJSON.Geometry[] = identity(10).map(i => ({
        type: 'Polygon', coordinates: [[[i * 3, 0], [i * 3 + 1, 0], [i * 3 + 1, 1], [i * 3, 1], [i * 3, 0]]],
    }));
    assert.equal(buildWeights(apart, identity(10), 10).method, 'nearest');
});

test('exploded parts are one unit, not each other\'s neighbours', () => {
    const cells = grid(2);
    const features: GeoJSON.Feature[] = cells.map((geometry, i) => ({
        type: 'Feature', geometry, properties: i < 2 ? { name: 'A', v: 5 } : { name: `B${i}`, v: i },
    }));
    const { groups, unitCount } = identicalAttributeGroups(features);
    assert.equal(unitCount, 3);
    assert.equal(groups[0], groups[1]);
    const weights = buildWeights(cells, groups, unitCount);
    assert.ok(!weights.neighbours[groups[0]].includes(groups[0]));
});

test('a lone identical value is not evidence of exploding', () => {
    const features: GeoJSON.Feature[] = grid(2).map(geometry => ({ type: 'Feature', geometry, properties: { v: 1 } }));
    assert.equal(identicalAttributeGroups(features).unitCount, 4);
});

test('Moran\'s I is strongly positive for two halves and negative for alternating stripes', () => {
    const size = 10;
    const weights = buildWeights(grid(size), identity(size * size), size * size);
    const halves = identity(size * size).map(i => (i % size < size / 2 ? 1 : 10));
    // Not a checkerboard: with corner neighbours counted, a checkerboard cell has
    // four alike and four unlike neighbours, and I ≈ 0 is the right answer. In
    // one-cell stripes six of eight neighbours are unlike.
    const checker = identity(size * size).map(i => (i % size) % 2);

    const clustered = globalMoran(weights, halves)!;
    assert.ok(clustered.i > 0.5 && clustered.p < 0.001, `halves: I=${clustered.i} p=${clustered.p}`);
    const dispersed = globalMoran(weights, checker)!;
    assert.ok(dispersed.i < -0.1 && dispersed.p < 0.001, `stripes: I=${dispersed.i} p=${dispersed.p}`);
});

test('random values on a grid are usually not significant', () => {
    const size = 20;
    const weights = buildWeights(grid(size), identity(size * size), size * size);
    let seed = 7;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    let significant = 0;
    for (let run = 0; run < 20; run++) {
        const result = globalMoran(weights, identity(size * size).map(() => random()))!;
        if (result.p < 0.05) significant++;
    }
    assert.ok(significant <= 3, `${significant} of 20 random layers came out significant`);
});

test('missing values take no part and cannot be neighbours', () => {
    const size = 6;
    const weights = buildWeights(grid(size), identity(size * size), size * size);
    const values = identity(size * size).map(i => (i === 7 ? NaN : i % size));
    const result = globalMoran(weights, values)!;
    assert.equal(result.n, size * size - 1);
});

test('Benjamini–Hochberg keeps the small p-values and drops the chance ones', () => {
    assert.deepEqual(significantAfterFdr([0.001, 0.8, 0.012, 0.04, 0.6], 0.05), [true, false, true, false, false]);
});

test('LISA finds the hot and cold halves and calls random data insignificant', () => {
    const size = 12;
    const weights = buildWeights(grid(size), identity(size * size), size * size);
    const halves = identity(size * size).map(i => (i % size < size / 2 ? 1 : 10) + ((i * 7) % 3) * 0.1);
    const { classes, counts } = localMoran(weights, halves);
    assert.equal(classes[size * 3 + 1], 'low-low', 'a cell deep in the low half');
    assert.equal(classes[size * 3 + size - 2], 'high-high', 'a cell deep in the high half');
    assert.ok(counts['high-high'] > 30 && counts['low-low'] > 30);

    let seed = 3;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const noise = localMoran(weights, identity(size * size).map(() => random()));
    const flagged = noise.counts['high-high'] + noise.counts['low-low'] + noise.counts['high-low'] + noise.counts['low-high'];
    assert.ok(flagged <= size * size * 0.02, `${flagged} random cells flagged`);
});

test('LISA is reproducible for the same layer', () => {
    const size = 8;
    const weights = buildWeights(grid(size), identity(size * size), size * size);
    const values = identity(size * size).map(i => Math.sin(i));
    assert.deepEqual(localMoran(weights, values).classes, localMoran(weights, values).classes);
});

test('a moderately clustered column on a large layer still finds its clusters', () => {
    // The case permutations failed: ~2500 units, a soft gradient plus noise.
    // With a p-value floor of 1/(permutations + 1), FDR let nothing through.
    const size = 50;
    const weights = buildWeights(grid(size), identity(size * size), size * size);
    let seed = 5;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const values = identity(size * size).map(i => (i % size) / size + random() * 1.5);
    const moran = globalMoran(weights, values)!;
    assert.ok(moran.i > 0.05 && moran.i < 0.4, `a moderate pattern: I=${moran.i}`);
    const { counts } = localMoran(weights, values);
    assert.ok(counts['high-high'] > 0 && counts['low-low'] > 0, JSON.stringify(counts));
});
