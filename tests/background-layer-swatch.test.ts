/**
 * A background layer is a colour, and the UI has to treat it as one.
 *
 * `background` is the one render type with no data behind it: it paints a flat
 * colour under everything, which is what a map with no basemap uses for its
 * sea. Three places had no case for it and each fell back to something wrong:
 * the derived swatch fell through to the neutral "nothing derivable" square,
 * the legend lumped it in with raster/hillshade and drew the checkerboard that
 * means "this is imagery", and the style role table had no colour key for it —
 * so it was the only layer type in the legend with no colour picker, despite
 * being the one whose entire definition is a colour.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveLayerSwatch, NEUTRAL_SWATCH } from '../src/utils/layer-swatch.js';
import { ROLE_COLOR_KEY, ROLE_OPACITY_KEY, ROLE_LAYER_TYPE } from '../src/utils/style-builder.js';

test('a background layer derives its own colour as its swatch', () => {
    const swatch = deriveLayerSwatch({
        id: 'sea', type: 'background', paint: { 'background-color': '#aad3df' },
    } as never);

    assert.equal(swatch.background, '#aad3df', 'the swatch is the colour the layer paints');
    assert.equal(swatch.kind, 'fill', 'it is a flat area, not imagery');
    assert.notEqual(swatch.background, NEUTRAL_SWATCH, 'the neutral square means "nothing derivable"');
});

test('a background layer with no colour still does not read as imagery', () => {
    const swatch = deriveLayerSwatch({ id: 'sea', type: 'background' } as never);
    assert.notEqual(swatch.kind, 'raster', 'a raster swatch claims tiles that do not exist');
});

test('the background role names the paint properties the picker edits', () => {
    // The legend's colour picker writes through these, so a missing entry is
    // what made the type uneditable.
    assert.equal(ROLE_COLOR_KEY.background, 'background-color');
    assert.equal(ROLE_OPACITY_KEY.background, 'background-opacity');
    assert.equal(ROLE_LAYER_TYPE.background, 'background');
});
