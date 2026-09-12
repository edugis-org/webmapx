/**
 * Level 4, as the styler asks it: a column and a method in, a drawable channel
 * out.
 *
 * The assertions are about what the *map* ends up drawing — the breaks, the
 * palette, and the round trip back through the decoder — because a
 * classification that looks plausible in the panel and paints something else is
 * the failure this layer of code exists to prevent.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    classifyColorChannel,
    cyclesCategories,
    classifySizeChannel,
    defaultSettings,
    isNumericType,
    schemesFor,
} from '../src/components/styler/classify-channel';
import { encodeChannel } from '../src/utils/layer-style-model';
import { decodeChannel } from '../src/utils/style-decoder';

const feature = (properties: GeoJSON.GeoJsonProperties): GeoJSON.Feature =>
    ({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: [0, 0] } });

const numbers = [1, 2, 3, 4, 5, 10, 50, 400, 9000].map((pop) => feature({ pop, region: pop > 100 ? 'north' : 'south' }));

test('a numeric column classifies into breaks and a palette, ready to draw', () => {
    const result = classifyColorChannel(numbers, true, { ...defaultSettings('pop'), classCount: 4 });
    assert.ok(result?.channel);
    assert.equal(result.channel.driver, 'attribute');
    assert.equal(result.channel.classification.kind, 'ranges');
    if (result.channel.classification.kind !== 'ranges') return;
    assert.equal(result.channel.classification.colors.length, 4);
    assert.equal(result.channel.classification.breaks.length, 3);
    // The guard that stops a missing value being drawn as the lowest class.
    assert.equal(result.channel.classification.noDataColor, '#cccccc');
    assert.equal(result.legend.length, 4);
});

test('what level 4 produces is what the decoder reads back', () => {
    const result = classifyColorChannel(numbers, true, defaultSettings('pop'));
    assert.ok(result?.channel);
    const painted = encodeChannel(result.channel);
    // The panel must reopen on the classification it just applied, or every
    // second visit to a layer starts from defaults.
    assert.deepEqual(decodeChannel(painted), result.channel);
});

test('a skewed column says so instead of drawing one colour in silence', () => {
    // Natural breaks on a long tail puts nearly everything in one class; that is
    // the normal case for real data, not an edge case.
    const skewed = [...Array(40).keys()].map((i) => feature({ v: i < 38 ? 1 : 5000 }));
    const result = classifyColorChannel(skewed, true, { ...defaultSettings('v'), method: 'naturalBreaks' });
    assert.ok(result?.channel);
    assert.match(result.warning ?? '', /One class holds/);
});

test('repeating is decided from the data: on when values would be greyed out, off when they fit', () => {
    const fits = ['a', 'b', 'c'].map((code) => feature({ code }));
    const spills = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map((code) => feature({ code }));

    // Everything fits the palette: repeating would cost the legend and change
    // no colour, which is the one case where it is the wrong answer.
    assert.equal(cyclesCategories(fits, { ...defaultSettings('code'), maxCategories: 8 }), false);
    // A tail would otherwise be one grey — not a map of ten values.
    assert.equal(cyclesCategories(spills, { ...defaultSettings('code'), maxCategories: 4 }), true);
    // An explicit answer always wins over the guess.
    assert.equal(cyclesCategories(spills, { ...defaultSettings('code'), maxCategories: 4, cycle: false }), false);
});

test('a text column becomes categories, and the tail is reported rather than hidden', () => {
    const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map((code) => feature({ code }));
    const result = classifyColorChannel(many, false, { ...defaultSettings('code'), maxCategories: 4, cycle: false });
    assert.ok(result?.channel);
    assert.equal(result.channel.classification.kind, 'categories');
    if (result.channel.classification.kind !== 'categories') return;
    assert.equal(result.channel.classification.values.length, 4);
    assert.match(result.warning ?? '', /share one grey/);
    // The fallback earns a legend row only because something falls into it.
    assert.equal(result.legend[result.legend.length - 1].label, 'other');
});

test('cycling gives every value a colour, names them, and says what repeats', () => {
    const many = [...Array(30).keys()].map((i) => feature({ code: `c${i}` }));
    const result = classifyColorChannel(many, false, { ...defaultSettings('code'), cycle: true });
    assert.ok(result?.channel);
    if (result.channel.classification.kind !== 'categories') return;
    assert.equal(result.channel.classification.values.length, 30);
    // Every colour is still labelled with the value it draws: the paint is a
    // `match` on that value, so the legend reads the keys straight back.
    assert.equal(result.legend.length, 30);
    assert.equal(result.legend[0].label, result.channel.classification.values[0]);
    assert.equal(result.legend[0].color, result.channel.classification.colors[0]);
    // The honest caveat is about distant repeats, not about naming.
    assert.match(result.warning ?? '', /share \d+ colours/);
});

test('cycled colours are assigned so that touching areas differ', () => {
    // Two rows of three squares, each its own value. Cycling by position with a
    // three-colour palette would hand the same colour to squares that share an
    // edge; the graph colouring is what stops a border vanishing.
    const squares = [];
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
            squares.push({
                type: 'Feature' as const,
                properties: { code: `r${row}c${col}` },
                geometry: {
                    type: 'Polygon' as const,
                    coordinates: [[[col, row], [col + 1, row], [col + 1, row + 1], [col, row + 1], [col, row]]],
                },
            });
        }
    }
    const result = classifyColorChannel(squares, false, { ...defaultSettings('code'), cycle: true });
    assert.ok(result?.channel);
    if (result.channel.classification.kind !== 'categories') return;

    const colorOf = new Map(result.channel.classification.values
        .map((value, index) => [value, result.channel.classification.kind === 'categories' ? result.channel.classification.colors[index] : '']));
    const touching: [string, string][] = [
        ['r0c0', 'r0c1'], ['r0c1', 'r0c2'],
        ['r1c0', 'r1c1'], ['r1c1', 'r1c2'],
        ['r0c0', 'r1c0'], ['r0c1', 'r1c1'], ['r0c2', 'r1c2'],
    ];
    for (const [a, b] of touching) {
        assert.notEqual(colorOf.get(a), colorOf.get(b), `${a} and ${b} share a border and a colour`);
    }
});

test('a column with nothing usable in it is an empty answer, not a grey map', () => {
    const empty = [feature({ pop: 'many' }), feature({ pop: null })];
    assert.equal(classifyColorChannel(empty, true, defaultSettings('pop')), null);
});

test('a size channel is a coefficient, and survives the decoder', () => {
    const result = classifySizeChannel(numbers, 'pop', 28);
    assert.ok(result);
    assert.equal(result.channel.classification.kind, 'proportional');
    assert.deepEqual(decodeChannel(encodeChannel(result.channel)), result.channel);
    // Nothing to size by is not a circle of radius zero.
    assert.equal(classifySizeChannel([feature({ pop: 0 })], 'pop', 28), null);
});

test('the colour-blind filter narrows diverging and qualitative, never sequential', () => {
    // Measured against the ColorBrewer ratings rather than assumed: every
    // sequential scheme is rated safe, so the filter changes nothing there and a
    // test asserting it narrows would be asserting a wish.
    assert.equal(schemesFor(5, 'seq', { reversed: false, blindSafe: true }).length,
        schemesFor(5, 'seq', { reversed: false, blindSafe: false }).length);
    assert.ok(schemesFor(5, 'div', { reversed: false, blindSafe: true }).length
        < schemesFor(5, 'div', { reversed: false, blindSafe: false }).length);
    // Reversing is a property of the colours handed out, not of the list.
    const forward = schemesFor(5, 'seq', { reversed: false, blindSafe: false })[0];
    const backward = schemesFor(5, 'seq', { reversed: true, blindSafe: false })[0];
    assert.deepEqual([...backward.colors], [...forward.colors].reverse());
});

test('asking for a palette that does not exist says so instead of going quiet', () => {
    // ColorBrewer rates no qualitative scheme colour-blind-safe above four
    // colours, so this combination is one a student can walk into: five
    // categories and the filter ticked leaves nothing to draw with.
    const many = ['a', 'b', 'c', 'd', 'e'].map((code) => feature({ code }));
    const outcome = classifyColorChannel(many, false, { ...defaultSettings('code'), blindSafe: true });
    assert.ok(outcome);
    assert.equal(outcome.channel, null);
    if (outcome.channel !== null) return;
    assert.match(outcome.problem, /colour-blind-safe/);
    assert.match(outcome.problem, /fewer categories|turn the filter off/);
});

test('a chosen palette that cannot serve the class count falls back instead of failing', () => {
    // Losing the palette is a smaller surprise than losing the map.
    const result = classifyColorChannel(numbers, true, {
        ...defaultSettings('pop'), classCount: 9, schemeName: 'nonexistent-scheme',
    });
    assert.ok(result?.channel);
    assert.ok(result.channel.schemeName && result.channel.schemeName !== 'nonexistent-scheme');
});

test('attribute types are judged by name, so an integer column is numeric', () => {
    assert.equal(isNumericType('number'), true);
    assert.equal(isNumericType('integer'), true);
    assert.equal(isNumericType('string'), false);
});
