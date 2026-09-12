/**
 * The decoder is the inverse of `style-builder.ts`, and this is what says so.
 *
 * Two different claims are tested, and only the first is about expressions:
 *
 * - **Every builder's output decodes to the decisions that produced it** — the
 *   attribute, the breaks, the palette — and re-encodes to the same expression.
 *   String assertions over the built paint would pass while the styler opened
 *   on defaults, which is the bug this whole model exists to fix.
 * - **Invariant 4: opening the styler and closing it changes nothing.** An
 *   entry nobody touched must re-encode byte-identically, paint keys the styler
 *   does not model included. That is stronger than "decodes correctly", and it
 *   is the one a user notices when a hand-authored config is quietly rewritten.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyCategorical, classifyNumeric, numericValues } from '../src/utils/classification';
import { schemeByName } from '../src/utils/color-schemes';
import {
    buildCategoricalStyle,
    buildIndexedColorStyle,
    buildNumericStyle,
    buildProportionalRadius,
    buildSingleStyle,
} from '../src/utils/style-builder';
import {
    encodeChannel,
    encodeStyleEntry,
    NEIGHBOUR_COLOR_FIELD,
    type StyleSubLayer,
} from '../src/utils/layer-style-model';
import { decodeChannel, decodeStyleEntry, roleOfLayerType, schemeNameFor } from '../src/utils/style-decoder';

const feature = (properties: GeoJSON.GeoJsonProperties): GeoJSON.Feature =>
    ({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: [0, 0] } });

const numericFeatures = [1, 4, 9, 16, 25, 36, 49, 64].map((v) => feature({ pop: v }));

test('a classified range decodes to its attribute, breaks and palette', () => {
    const { values, missing } = numericValues(numericFeatures, 'pop');
    const classification = classifyNumeric(values, { method: 'quantile', classCount: 4, missing });
    const scheme = schemeByName('YlOrRd', 4);
    assert.ok(scheme);
    const built = buildNumericStyle({ role: 'fill', field: 'pop', classification, scheme });

    const state = decodeChannel(built.paint['fill-color']);
    assert.equal(state?.driver, 'attribute');
    if (state?.driver !== 'attribute') return;
    assert.equal(state.attribute, 'pop');
    assert.equal(state.classification.kind, 'ranges');
    if (state.classification.kind !== 'ranges') return;
    assert.deepEqual(state.classification.breaks, classification.breaks);
    assert.deepEqual(state.classification.colors, [...scheme.colors]);
    // The guard around the step is what makes a missing value read as no data
    // rather than as the lowest class, so losing it would change the map.
    assert.equal(state.classification.noDataColor, '#cccccc');
    assert.equal(state.schemeName, 'YlOrRd');

    assert.deepEqual(encodeChannel(state), built.paint['fill-color']);
});

test('a single class is a plain colour on the way out as well as in', () => {
    const classification = classifyNumeric([3], { method: 'equalInterval', classCount: 1 });
    const scheme = schemeByName('YlOrRd', 3);
    assert.ok(scheme);
    const built = buildNumericStyle({
        role: 'fill', field: 'pop', classification,
        scheme: { ...scheme, colors: scheme.colors.slice(0, classification.classes.length) },
    });
    assert.equal(typeof built.paint['fill-color'], 'string');

    const state = decodeChannel(built.paint['fill-color']);
    assert.equal(state?.driver, 'single');
});

test('categories decode to their raw keys, not their labels', () => {
    const features = ['nl', 'be', 'de', 'de'].map((code) => feature({ iso: code }));
    const classification = classifyCategorical(features, 'iso', { maxCategories: 8 });
    const scheme = schemeByName('Set2', 3);
    assert.ok(scheme);
    const built = buildCategoricalStyle({
        role: 'fill', field: 'iso', classification,
        scheme,
        formatCategory: (value) => `country ${value}`,
    });

    const state = decodeChannel(built.paint['fill-color']);
    assert.equal(state?.driver, 'attribute');
    if (state?.driver !== 'attribute' || state.classification.kind !== 'categories') return;
    assert.deepEqual(state.classification.values, classification.categories.map((c) => String(c.value)));
    assert.equal(state.classification.rawKeys, undefined);
    assert.deepEqual(encodeChannel(state), built.paint['fill-color']);
});

test('a neighbour colouring is its own driver, not a category list', () => {
    const scheme = schemeByName('Set2', 4);
    assert.ok(scheme);
    const built = buildIndexedColorStyle({
        role: 'fill', field: NEIGHBOUR_COLOR_FIELD, colorCount: 4, scheme,
    });

    const state = decodeChannel(built.paint['fill-color']);
    assert.equal(state?.driver, 'neighbours');
    if (state?.driver !== 'neighbours') return;
    assert.equal(state.colors.length, 4);
    assert.deepEqual(encodeChannel(state), built.paint['fill-color']);
});

test('an indexed colouring on an ordinary column stays a category list', () => {
    const scheme = schemeByName('Set2', 3);
    assert.ok(scheme);
    const built = buildIndexedColorStyle({ role: 'fill', field: 'cls', colorCount: 3, scheme });

    const state = decodeChannel(built.paint['fill-color']);
    assert.equal(state?.driver, 'attribute');
    if (state?.driver !== 'attribute' || state.classification.kind !== 'categories') return;
    assert.equal(state.classification.rawKeys, true);
    assert.deepEqual(encodeChannel(state), built.paint['fill-color']);
});

test('a proportional radius decodes as a coefficient, with no classes', () => {
    const { expression, coefficient } = buildProportionalRadius({ field: 'pop', maxValue: 900, maxRadius: 30 });

    const state = decodeChannel(expression);
    assert.equal(state?.driver, 'attribute');
    if (state?.driver !== 'attribute' || state.classification.kind !== 'proportional') return;
    assert.equal(state.classification.coefficient, coefficient);
    assert.deepEqual(encodeChannel(state), expression);
});

test('a single colour and a dash array are both single values', () => {
    const built = buildSingleStyle('line', '#ff0000', 0.5);
    assert.deepEqual(decodeChannel(built.paint['line-color']), { driver: 'single', value: '#ff0000' });
    assert.deepEqual(decodeChannel(built.paint['line-opacity']), { driver: 'single', value: 0.5 });
    assert.deepEqual(decodeChannel([2, 4]), { driver: 'single', value: [2, 4] });
});

test('an expression the decoder does not know is handed back whole', () => {
    const authored = ['interpolate', ['linear'], ['zoom'], 5, '#fff', 12, '#000'];
    const state = decodeChannel(authored);
    assert.deepEqual(state, { driver: 'custom', expression: authored });
    assert.deepEqual(encodeChannel(state!), authored);
});

test('a step whose tail is not break/colour pairs is custom, not half-read', () => {
    const odd = ['step', ['get', 'pop'], '#111', 10];
    assert.equal(decodeChannel(odd)?.driver, 'custom');
});

test('a line over polygons is an outline, over lines a line', () => {
    assert.equal(roleOfLayerType('line', 'MultiPolygon'), 'outline');
    assert.equal(roleOfLayerType('line', 'LineString'), 'line');
    assert.equal(roleOfLayerType('symbol'), 'label');
});

test('a palette that matches no catalog scheme simply has no name', () => {
    assert.equal(schemeNameFor(['#123456', '#654321', '#abcdef']), null);
    assert.equal(schemeNameFor(schemeByName('YlGnBu', 5)!.colors), 'YlGnBu');
});

test('invariant 4: an untouched entry re-encodes byte-identically', () => {
    const sublayer: StyleSubLayer = {
        id: 'roads',
        type: 'line',
        // Keys the styler has no channel for, and an expression it cannot read:
        // both must survive a decode/encode round trip untouched.
        paint: {
            'line-color': ['interpolate', ['linear'], ['zoom'], 5, '#888', 12, '#222'],
            'line-width': 2,
            'line-blur': 0.5,
        },
        layout: { 'line-cap': 'round' },
        filter: ['==', ['get', 'class'], 'motorway'],
        minzoom: 6,
        metadata: { authored: true },
    };

    const entry = decodeStyleEntry(sublayer);
    assert.deepEqual(encodeStyleEntry(entry), sublayer);
    assert.equal(JSON.stringify(encodeStyleEntry(entry)), JSON.stringify(sublayer));
});

test('a changed channel is the only key that moves', () => {
    const sublayer: StyleSubLayer = {
        id: 'areas',
        type: 'fill',
        paint: { 'fill-color': '#ff0000', 'fill-opacity': 0.7, 'fill-antialias': false },
    };
    const entry = decodeStyleEntry(sublayer);
    entry.channels.color = { driver: 'single', value: '#00ff00' };

    assert.deepEqual(encodeStyleEntry(entry), {
        id: 'areas',
        type: 'fill',
        paint: { 'fill-color': '#00ff00', 'fill-opacity': 0.7, 'fill-antialias': false },
    });
});

test('a label entry writes text and size to layout, never to paint', () => {
    const sublayer: StyleSubLayer = { id: 'names', type: 'symbol', layout: { 'text-field': ['get', 'name'], 'text-size': 12 } };
    const entry = decodeStyleEntry(sublayer);
    assert.equal(entry.role, 'label');
    assert.deepEqual(entry.channels.textSize, { driver: 'single', value: 12 });
    // `['get', 'name']` is not a classification, so it stays an expression the
    // text channel hands back rather than something the styler rewrites.
    assert.equal(entry.channels.text?.driver, 'custom');

    entry.channels.textSize = { driver: 'single', value: 16 };
    const encoded = encodeStyleEntry(entry);
    assert.equal((encoded.layout as Record<string, unknown>)['text-size'], 16);
    assert.equal(encoded.paint, undefined);
});

test('filter and zoom range are entry properties, and removing one removes the key', () => {
    const sublayer: StyleSubLayer = { id: 'x', type: 'fill', filter: ['==', 'a', 1], minzoom: 4, maxzoom: 10 };
    const entry = decodeStyleEntry(sublayer);
    assert.deepEqual(entry.filter, ['==', 'a', 1]);
    delete entry.filter;
    delete entry.maxzoom;
    const encoded = encodeStyleEntry(entry);
    assert.equal('filter' in encoded, false);
    assert.equal('maxzoom' in encoded, false);
    assert.equal(encoded.minzoom, 4);
});

test('removing a channel removes its paint key', () => {
    const sublayer: StyleSubLayer = {
        id: 'roads', type: 'line',
        paint: { 'line-color': '#000000', 'line-width': 2, 'line-dasharray': [2, 2] },
    };
    const entry = decodeStyleEntry(sublayer);
    delete entry.channels.dash;

    const encoded = encodeStyleEntry(entry);
    // Iterating only over the channels that remain would leave the key exactly
    // as it was, which is how a dashed line stayed dashed after being set back
    // to solid.
    assert.equal('line-dasharray' in (encoded.paint as Record<string, unknown>), false);
    assert.equal((encoded.paint as Record<string, unknown>)['line-color'], '#000000');
});

test('a style carries its own name, and clearing it takes the authored one away too', () => {
    const sublayer: StyleSubLayer = {
        id: 'areas', type: 'fill',
        metadata: { label: 'Population density', reference: true },
        paint: { 'fill-color': '#ff0000' },
    };
    const entry = decodeStyleEntry(sublayer);
    assert.equal(entry.title, 'Population density');

    entry.title = 'Inhabitants per km²';
    const renamed = encodeStyleEntry(entry);
    assert.equal((renamed.metadata as Record<string, unknown>).label, 'Inhabitants per km²');
    // Everything else the sublayer's metadata carried is not ours to drop.
    assert.equal((renamed.metadata as Record<string, unknown>).reference, true);

    delete entry.title;
    const cleared = encodeStyleEntry(entry);
    assert.equal('label' in (cleared.metadata as Record<string, unknown>), false);
    assert.equal((cleared.metadata as Record<string, unknown>).reference, true);
});

test('a title typed over an authored `title` key wins, rather than losing to it', () => {
    // `metadataLabel` reads label, then title: writing only `label` would leave
    // the old `title` in place and the two would disagree about the name.
    const entry = decodeStyleEntry({ id: 'areas', type: 'fill', metadata: { title: 'Old' } });
    assert.equal(entry.title, 'Old');
    entry.title = '';
    const encoded = encodeStyleEntry(entry);
    assert.equal(encoded.metadata, undefined);
});

test('the no-data wording is metadata, and an empty one leaves no key behind', () => {
    const entry = decodeStyleEntry({ id: 'areas', type: 'fill', paint: { 'fill-color': '#ff0000' } });
    assert.equal(entry.noDataLabel, undefined);

    entry.noDataLabel = 'no data';
    assert.equal((encodeStyleEntry(entry).metadata as Record<string, unknown>).noDataLabel, 'no data');

    entry.noDataLabel = '   ';
    assert.equal(encodeStyleEntry(entry).metadata, undefined);
});

test('naming nothing changes nothing: invariant 4 holds for an unnamed entry', () => {
    const sublayer: StyleSubLayer = { id: 'areas', type: 'fill', paint: { 'fill-color': '#ff0000' } };
    assert.equal(JSON.stringify(encodeStyleEntry(decodeStyleEntry(sublayer))), JSON.stringify(sublayer));
});
