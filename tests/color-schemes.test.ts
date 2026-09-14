/**
 * Colour schemes.
 *
 * The point of carrying ColorBrewer as data is the usage flags, so most of what
 * is worth asserting is about filtering on them.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    colorSchemesFor,
    maxClassesFor,
    rampScheme,
    schemeByName,
    schemeNames,
} from '../src/utils/color-schemes';

test('a scheme comes back with exactly the number of colours asked for', () => {
    for (let classes = 1; classes <= 9; classes++) {
        for (const scheme of colorSchemesFor(classes, 'seq')) {
            assert.equal(scheme.colors.length, classes, `${scheme.name} at ${classes} classes`);
        }
    }
});

test('one and two classes are cut from the three-class set, low to high', () => {
    const [three] = colorSchemesFor(3, 'seq').filter(s => s.name === 'Blues');
    const [two] = colorSchemesFor(2, 'seq').filter(s => s.name === 'Blues');
    const [one] = colorSchemesFor(1, 'seq').filter(s => s.name === 'Blues');

    assert.deepEqual(two.colors, [three.colors[0], three.colors[2]]);
    // One class takes the strong end, not the washed-out middle.
    assert.deepEqual(one.colors, [three.colors[2]]);
});

test('reversing turns the ramp round without changing which colours are in it', () => {
    const [forward] = colorSchemesFor(5, 'seq').filter(s => s.name === 'YlOrRd');
    const [backward] = colorSchemesFor(5, 'seq', { reversed: true }).filter(s => s.name === 'YlOrRd');
    assert.deepEqual([...backward.colors], [...forward.colors].reverse());
});

test('requiring colour-blind safety removes schemes, and never invents one', () => {
    const all = colorSchemesFor(5, 'div');
    const safe = colorSchemesFor(5, 'div', { usage: { blind: 'ok' } });

    assert.ok(safe.length > 0, 'some diverging scheme is colour-blind safe at 5 classes');
    assert.ok(safe.length < all.length, 'and not all of them are');
    assert.ok(safe.every(scheme => scheme.blind === 'ok'));
});

test("'maybe' accepts a scheme rated maybe, 'ok' does not", () => {
    const maybe = colorSchemesFor(3, 'div', { usage: { blind: 'maybe' } }).map(s => s.name);
    const strict = colorSchemesFor(3, 'div', { usage: { blind: 'ok' } }).map(s => s.name);
    assert.ok(maybe.length > strict.length);
    assert.ok(strict.every(name => maybe.includes(name)));
});

test('an unrated scheme is not offered as safe', () => {
    // ColorBrewer leaves the 12-colour qualitative sets unrated. Unknown is not
    // evidence of safety, so a filter must drop them.
    const twelve = colorSchemesFor(12, 'qual');
    assert.ok(twelve.some(scheme => scheme.blind === 'unknown'), 'the unrated sets exist');
    assert.ok(colorSchemesFor(12, 'qual', { usage: { blind: 'maybe' } })
        .every(scheme => scheme.blind !== 'unknown'));
});

test('an impossible request returns nothing rather than a fallback colour', () => {
    // The UI can say "no scheme does that — use fewer classes"; a silent
    // fallback to one red would be a lie about the classification.
    assert.deepEqual(colorSchemesFor(99, 'seq'), []);
    assert.deepEqual(colorSchemesFor(0, 'seq'), []);
});

test('every scheme is a list of hex colours', () => {
    for (const type of ['seq', 'div', 'qual'] as const) {
        for (const name of schemeNames(type)) {
            const scheme = schemeByName(name, 3);
            assert.ok(scheme, `${name} at 3 classes`);
            assert.ok(scheme.colors.every(color => /^#[0-9a-f]{6}$/i.test(color)), name);
        }
    }
});

test('maxClassesFor reports how far a type goes', () => {
    assert.ok(maxClassesFor('seq') >= 9);
    assert.equal(colorSchemesFor(maxClassesFor('seq'), 'seq').length > 0, true);
    assert.deepEqual(colorSchemesFor(maxClassesFor('seq') + 1, 'seq'), []);
});

test('a two-stop ramp runs from the first colour to the last', () => {
    const ramp = rampScheme(['#000000', '#ffffff'], 3);
    assert.deepEqual([...ramp.colors], ['#000000', '#808080', '#ffffff']);
});

test('a three-stop ramp passes through the middle colour', () => {
    const ramp = rampScheme(['#ff0000', '#ffffff', '#0000ff'], 5);
    assert.equal(ramp.colors[0], '#ff0000');
    assert.equal(ramp.colors[2], '#ffffff');
    assert.equal(ramp.colors[4], '#0000ff');
    assert.equal(ramp.type, 'div');
});

test('a custom ramp reports its usage as unknown, never as safe', () => {
    const ramp = rampScheme(['#000', '#fff'], 4);
    assert.equal(ramp.blind, 'unknown');
    assert.equal(ramp.colors.length, 4);
});

test('a ramp rejects anything that is not a colour', () => {
    assert.throws(() => rampScheme(['red', '#fff'], 3), /hex colours/);
});

test('colour-blind-safe qualitative palettes exist beyond four colours', () => {
    // ColorBrewer rates none above four; Okabe–Ito and Paul Tol's palettes were
    // designed for this, and are what "colour-blind safe" draws with from five.
    const safeNames = (count: number) =>
        colorSchemesFor(count, 'qual', { usage: { blind: 'ok' } }).map((scheme) => scheme.name);
    assert.deepEqual(safeNames(4), ['Paired', 'OkabeIto', 'TolBright', 'TolMuted']);
    for (const count of [5, 6, 7]) assert.deepEqual(safeNames(count), ['OkabeIto', 'TolBright', 'TolMuted'], `${count}`);
    assert.deepEqual(safeNames(8), ['OkabeIto', 'TolMuted']);
    assert.deepEqual(safeNames(9), ['TolMuted']);
    assert.deepEqual(safeNames(10), []);
});

test('Okabe–Ito keeps black for the eighth colour only', () => {
    // Black is a poor area fill, so the order puts it last: seven colours or
    // fewer never contain it.
    for (let count = 3; count <= 7; count++) {
        assert.ok(!schemeByName('OkabeIto', count)!.colors.includes('#000000'), `${count}`);
    }
    assert.equal(schemeByName('OkabeIto', 8)!.colors[7], '#000000');
});

test('the added palettes are not claimed safe for print or photocopy', () => {
    // Designed for colour vision and screens, not rated for paper: unknown is
    // not evidence of safety, so asking for print leaves them out.
    const print = colorSchemesFor(5, 'qual', { usage: { print: 'maybe' } }).map((scheme) => scheme.name);
    assert.ok(!print.includes('OkabeIto') && !print.includes('TolBright') && !print.includes('TolMuted'));
});

test('ColorBrewer still comes first, so a palette list opens on the same scheme', () => {
    assert.equal(colorSchemesFor(5, 'qual')[0].name, 'Set2');
    assert.equal(colorSchemesFor(7, 'qual').length, 11);
});
