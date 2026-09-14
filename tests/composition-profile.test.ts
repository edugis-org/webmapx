import test from 'node:test';
import assert from 'node:assert/strict';

import { clr, compositionTypes, describeType, kMeans, shortPartNames, toShares } from '../src/utils/composition-profile';

test('shares close any unit to the same composition and reject unusable rows', () => {
    const [percent, counts, missing, empty] = toShares([[20, 30, 50], [200, 300, 500], [20, NaN, 50], [0, 0, 0]]);
    assert.deepEqual(percent, [0.2, 0.3, 0.5]);
    assert.deepEqual(counts, [0.2, 0.3, 0.5]);
    assert.equal(missing, null);
    assert.equal(empty, null);
});

test('clr rows sum to zero and a zero share stays finite', () => {
    for (const row of clr([[0.2, 0.3, 0.5], [0, 0.4, 0.6]])) {
        assert.ok(row.every(Number.isFinite));
        assert.ok(Math.abs(row.reduce((a, b) => a + b, 0)) < 1e-12);
    }
});

test('k-means separates obvious groups and is reproducible', () => {
    const points = [[0, 0], [0.1, 0], [0, 0.1], [5, 5], [5.1, 5], [5, 5.1]];
    const a = kMeans(points, 2, 3);
    assert.equal(new Set(a.assignments.slice(0, 3)).size, 1);
    assert.equal(new Set(a.assignments.slice(3)).size, 1);
    assert.notEqual(a.assignments[0], a.assignments[3]);
    assert.deepEqual(kMeans(points, 2, 3).assignments, a.assignments);
});

test('three kinds of neighbourhood come back as types with telling labels', () => {
    let seed = 9;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const jitter = (row: number[]) => row.map(v => v * (0.9 + random() * 0.2));
    // Parts: young, working age, elderly.
    const families = Array.from({ length: 60 }, () => jitter([30, 55, 15]));
    const elderly = Array.from({ length: 40 }, () => jitter([10, 45, 45]));
    const students = Array.from({ length: 30 }, () => jitter([8, 85, 7]));
    const rows = [...families, ...elderly, ...students, [NaN, 50, 50]];

    const types = compositionTypes(rows)!;
    assert.ok(types);
    assert.equal(types.assignments[rows.length - 1], -1, 'a row with a missing part is not typed');
    // Each generated group lands in one type of its own.
    const typeOf = (from: number, to: number) => new Set(types.assignments.slice(from, to));
    for (const [from, to] of [[0, 60], [60, 100], [100, 130]]) {
        const set = typeOf(from, to);
        assert.ok(set.size <= 2, `group ${from}-${to} spread over ${set.size} types`);
    }
    assert.equal(types.sizes[0], Math.max(...types.sizes), 'the largest type is first');
    assert.ok(types.silhouette > 0.3, `silhouette ${types.silhouette}`);

    const names = ['young', 'working', 'elderly'];
    const elderlyType = types.assignments[70];
    assert.match(describeType(types.centres[elderlyType], types.overall, names), /^elderly ×/);
});

test('shared name prefixes are dropped for labels only', () => {
    assert.deepEqual(
        shortPartNames(['percentage_personen_0_tot_15_jaar', 'percentage_personen_15_tot_25_jaar', 'percentage_personen_65_jaar_en_ouder']),
        ['0_tot_15_jaar', '15_tot_25_jaar', '65_jaar_en_ouder'],
    );
    assert.deepEqual(shortPartNames(['αγρός', 'δάσος']), ['αγρός', 'δάσος']);
});
