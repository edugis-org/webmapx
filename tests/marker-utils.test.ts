/**
 * The information marker is drawn in the same 24×36 box as the pin, so
 * every engine's bottom-centre anchor stays right, and in the colour asked for.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { pinDataUrl, pinSvg } from '../src/map/marker-utils';

test('the info glyph keeps the pin\'s box and takes the colour', () => {
    const pin = pinSvg('#0f62fe');
    const sign = pinSvg('#0f62fe', 'info');
    assert.notEqual(sign, pin);
    for (const svg of [pin, sign]) {
        assert.match(svg, /viewBox="0 0 24 36"/);
        assert.match(svg, /width="24" height="36"/);
        assert.match(svg, /fill="#0f62fe"/);
    }
});

test('without a glyph the pin is unchanged, also as a data URL', () => {
    assert.equal(pinSvg('#e63946', undefined), pinSvg('#e63946'));
    assert.equal(decodeURIComponent(pinDataUrl('#e63946', 'info').split(',')[1]), pinSvg('#e63946', 'info'));
});
