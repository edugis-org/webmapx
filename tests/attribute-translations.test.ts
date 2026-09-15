/**
 * What a column is called, in words.
 *
 * The legend has always read `metadata.attributes.translations`; the styler had
 * not, so a panel offered "mean" where the legend said "Gemiddelde neerslag" —
 * a column the user could not recognise on a layer whose one column it was.
 * Both read this now, which is the point of it being here.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { attributeChoiceLabel, attributeTranslations } from '../src/utils/attribute-translations';

const inline = {
    translations: [
        { name: 'mean', translation: 'Gemiddelde neerslag', unit: ' mm/jaar' },
        { name: 'code', translation: '', unit: '' },
    ],
};

test('a layer names its own columns', () => {
    const map = attributeTranslations(inline);
    assert.equal(map.get('mean')?.label, 'Gemiddelde neerslag');
    assert.equal(map.get('mean')?.unit, ' mm/jaar');
});

test('a column with no words of its own keeps its own name', () => {
    // Never blank: a missing label must not hide which column is being styled.
    assert.equal(attributeTranslations(inline).get('code')?.label, 'code');
    assert.equal(attributeChoiceLabel('code', attributeTranslations(inline)), 'code');
});

test('a shared definition is resolved by name', () => {
    // Many layers with the same column names share one set of labels, named in
    // `layerData.attributeMetadata` and referred to as a string.
    const map = attributeTranslations('pop_dens', { pop_dens: inline });
    assert.equal(map.get('mean')?.label, 'Gemiddelde neerslag');
    // A name nothing defines is not an error: the columns keep their own names.
    assert.equal(attributeTranslations('missing', { pop_dens: inline }).size, 0);
});

test('choosing a column shows both the words and the column', () => {
    // The label is what the reader understands; the column name is what they
    // will see in the data, in an info popup and in every expression written.
    assert.equal(attributeChoiceLabel('mean', attributeTranslations(inline)), 'Gemiddelde neerslag (mean)');
    assert.equal(attributeChoiceLabel('mean'), 'mean');
});

test('nothing to read is an empty map, not a throw', () => {
    for (const value of [undefined, null, {}, { translations: 'no' }, { translations: [null, { name: 5 }] }]) {
        assert.equal(attributeTranslations(value).size, 0, JSON.stringify(value));
    }
});
