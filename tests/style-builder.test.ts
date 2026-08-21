/**
 * Paint specs built from a classification.
 *
 * The expressions are not asserted as arrays — a shape assertion passes on an
 * expression that renders nothing. They are **evaluated through the real
 * MapLibre expression engine** (the same one Leaflet and Cesium use here), so
 * what is tested is the colour a given feature actually gets.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateColor } from '../src/utils/maplibre-expression-evaluator';
import { classifyCategorical, classifyNumeric } from '../src/utils/classification';
import { colorSchemesFor, rampScheme, schemeByName } from '../src/utils/color-schemes';
import {
    NO_DATA_COLOR,
    ROLE_COLOR_KEY,
    ROLE_LAYER_TYPE,
    buildCategoricalStyle,
    buildNumericStyle,
    buildSingleStyle,
} from '../src/utils/style-builder';

const feature = (properties: GeoJSON.GeoJsonProperties) =>
    ({ type: 'Feature' as const, properties, geometry: { type: 'Polygon' as const, coordinates: [] } });

/** Colour a feature would be painted, resolved to lowercase hex. */
function colorOf(paint: Record<string, unknown>, key: string, properties: GeoJSON.GeoJsonProperties): string {
    const result = evaluateColor(paint[key], feature(properties), 6, '#000000');
    return normalise(result);
}

function normalise(color: string): string {
    const rgb = /rgba?\(([^)]+)\)/.exec(color);
    if (!rgb) return color.toLowerCase();
    const [r, g, b] = rgb[1].split(',').map(part => Math.round(Number(part.trim())));
    return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

const VALUES = [1, 2, 3, 50, 51, 52, 100, 101, 102];

test('a value in each class is painted that class\'s colour', () => {
    const classification = classifyNumeric(VALUES, { method: 'naturalBreaks', classCount: 3 });
    const scheme = schemeByName('YlOrRd', 3)!;
    const style = buildNumericStyle({ role: 'fill', field: 'v', classification, scheme });

    assert.equal(style.type, 'fill');
    assert.equal(colorOf(style.paint, 'fill-color', { v: 2 }), scheme.colors[0]);
    assert.equal(colorOf(style.paint, 'fill-color', { v: 51 }), scheme.colors[1]);
    assert.equal(colorOf(style.paint, 'fill-color', { v: 101 }), scheme.colors[2]);
});

test('a value below or above the classified range still gets a colour', () => {
    // This is what makes a tiled layer honest: panning brings in values the
    // classification never saw, and they must be drawn as the nearest class
    // rather than disappear.
    const classification = classifyNumeric(VALUES, { method: 'naturalBreaks', classCount: 3 });
    const scheme = schemeByName('YlOrRd', 3)!;
    const style = buildNumericStyle({ role: 'fill', field: 'v', classification, scheme });

    assert.equal(colorOf(style.paint, 'fill-color', { v: -1000 }), scheme.colors[0]);
    assert.equal(colorOf(style.paint, 'fill-color', { v: 1e9 }), scheme.colors[2]);
});

test('a missing value is painted as no data, not as the lowest class', () => {
    // `to-number` turns null into 0, so without the explicit guard every feature
    // with no value would join the bottom class and the map would report data
    // that does not exist.
    const classification = classifyNumeric(VALUES, { method: 'equalInterval', classCount: 3 });
    const scheme = schemeByName('Blues', 3)!;
    const style = buildNumericStyle({ role: 'fill', field: 'v', classification, scheme });

    assert.equal(colorOf(style.paint, 'fill-color', { v: null }), NO_DATA_COLOR);
    assert.equal(colorOf(style.paint, 'fill-color', {}), NO_DATA_COLOR);
    assert.notEqual(colorOf(style.paint, 'fill-color', { v: null }), scheme.colors[0]);
});

test('one class is a plain colour, not an expression', () => {
    const classification = classifyNumeric([5, 5, 5], { method: 'equalInterval', classCount: 4 });
    const style = buildNumericStyle({
        role: 'fill', field: 'v', classification, scheme: schemeByName('Blues', 1)!,
    });
    assert.equal(typeof style.paint['fill-color'], 'string');
});

test('the legend has one entry per class, labelled with its bounds', () => {
    const classification = classifyNumeric([0, 25, 50, 75, 100], { method: 'equalInterval', classCount: 4 });
    const style = buildNumericStyle({
        role: 'fill',
        field: 'v',
        classification,
        scheme: schemeByName('Blues', 4)!,
        unit: ' inh/km²',
    });

    assert.equal(style.legend.length, 4);
    assert.equal(style.legend[0].label, '0 – 25 inh/km²');
    assert.equal(style.legend[3].label, '75 – 100 inh/km²');
    // Unit strings carry their own leading space; the builder must not add one.
    assert.ok(!style.legend[0].label.includes('  '));
});

test('the no-data entry is off by default and labelled when asked for', () => {
    const classification = classifyNumeric([1, 2, 3], { method: 'equalInterval', classCount: 2 });
    const scheme = schemeByName('Blues', 2)!;
    const plain = buildNumericStyle({ role: 'fill', field: 'v', classification, scheme });
    const shown = buildNumericStyle({ role: 'fill', field: 'v', classification, scheme, showNoData: true });

    assert.equal(plain.legend.length, 2);
    assert.deepEqual(shown.legend[2], { color: NO_DATA_COLOR, label: 'no data' });
});

test('a scheme with the wrong number of colours is refused, not padded', () => {
    // Padding would put two classes in one colour, and the map would silently
    // claim fewer classes than the legend lists.
    const classification = classifyNumeric(VALUES, { method: 'quantile', classCount: 5 });
    assert.throws(
        () => buildNumericStyle({ role: 'fill', field: 'v', classification, scheme: schemeByName('Blues', 3)! }),
        /3 colours for 5 classes/,
    );
});

test('each category is painted its own colour, and anything else the fallback', () => {
    const features = [
        ...Array(4).fill(0).map(() => feature({ kind: 'road' })),
        ...Array(3).fill(0).map(() => feature({ kind: 'rail' })),
        feature({ kind: 'ferry' }),
    ];
    const classification = classifyCategorical(features, 'kind', { maxCategories: 2 });
    const scheme = colorSchemesFor(2, 'qual')[0];
    const style = buildCategoricalStyle({ role: 'line', field: 'kind', classification, scheme });

    assert.equal(style.type, 'line');
    assert.equal(colorOf(style.paint, 'line-color', { kind: 'road' }), scheme.colors[0]);
    assert.equal(colorOf(style.paint, 'line-color', { kind: 'rail' }), scheme.colors[1]);
    assert.equal(colorOf(style.paint, 'line-color', { kind: 'ferry' }), NO_DATA_COLOR);
    assert.equal(colorOf(style.paint, 'line-color', {}), NO_DATA_COLOR);
});

test('a category stored as a number matches whether it arrives as 3 or "3"', () => {
    // Mixed types in one column are the norm in real data, not an edge case.
    const features = [feature({ code: 3 }), feature({ code: '3' }), feature({ code: 4 })];
    const classification = classifyCategorical(features, 'code');
    const scheme = colorSchemesFor(3, 'qual')[0];
    const style = buildCategoricalStyle({ role: 'fill', field: 'code', classification, scheme });

    assert.equal(classification.categories[0].count, 2, 'both spellings are one category');
    assert.equal(
        colorOf(style.paint, 'fill-color', { code: 3 }),
        colorOf(style.paint, 'fill-color', { code: '3' }),
    );
});

test('the "other" entry appears only when something can fall into it', () => {
    const two = [feature({ k: 'a' }), feature({ k: 'b' })];
    const complete = classifyCategorical(two, 'k', { maxCategories: 5 });
    const truncated = classifyCategorical(two, 'k', { maxCategories: 1 });
    const scheme = colorSchemesFor(3, 'qual')[0];

    assert.equal(buildCategoricalStyle({
        role: 'fill', field: 'k', classification: complete, scheme,
    }).legend.length, 2);

    const withOther = buildCategoricalStyle({ role: 'fill', field: 'k', classification: truncated, scheme });
    assert.equal(withOther.legend.length, 2);
    assert.equal(withOther.legend[1].label, 'other');
});

test('an empty label hides the fallback from the legend, as the convention says', () => {
    const features = [feature({ k: 'a' }), feature({ k: 'b' })];
    const classification = classifyCategorical(features, 'k', { maxCategories: 1 });
    const style = buildCategoricalStyle({
        role: 'fill',
        field: 'k',
        classification,
        scheme: colorSchemesFor(3, 'qual')[0],
        otherLabel: '',
    });
    assert.equal(style.legend.length, 1);
});

test('a label formatter is where a valuemap is applied', () => {
    const features = [feature({ code: 'nl' }), feature({ code: 'be' })];
    const classification = classifyCategorical(features, 'code');
    const style = buildCategoricalStyle({
        role: 'fill',
        field: 'code',
        classification,
        scheme: colorSchemesFor(2, 'qual')[0],
        formatCategory: value => ({ nl: 'Netherlands', be: 'Belgium' })[String(value)] ?? String(value),
    });
    // Equal counts fall back to the raw value's own order, so 'be' precedes 'nl'
    // whatever the labels say — a legend that reorders itself when a label is
    // edited would be worse.
    assert.deepEqual(style.legend.map(entry => entry.label), ['Belgium', 'Netherlands']);
});

test('every role paints the property its own layer type uses', () => {
    for (const role of ['fill', 'outline', 'line', 'circle', 'label'] as const) {
        const style = buildSingleStyle(role, '#123456', 0.5);
        assert.equal(style.type, ROLE_LAYER_TYPE[role]);
        assert.equal(style.paint[ROLE_COLOR_KEY[role]], '#123456');
        assert.ok(Object.keys(style.paint).some(key => key.endsWith('-opacity')));
    }
});

test('a custom ramp styles a map the same way a named scheme does', () => {
    const classification = classifyNumeric(VALUES, { method: 'quantile', classCount: 3 });
    const style = buildNumericStyle({
        role: 'fill', field: 'v', classification, scheme: rampScheme(['#ffffff', '#000000'], 3),
    });
    assert.equal(colorOf(style.paint, 'fill-color', { v: 1 }), '#ffffff');
    assert.equal(colorOf(style.paint, 'fill-color', { v: 102 }), '#000000');
});
