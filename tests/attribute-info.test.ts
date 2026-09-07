import test from 'node:test';
import assert from 'node:assert/strict';

import { collectAttributeInfo } from '../src/utils/attribute-info';

/**
 * A file sorted by region id, the shape the NUTS 2024 download has: the first
 * 200 features carry 8 country codes and the whole file carries 39. Counting
 * from a sample of the head is not a smaller answer, it is a wrong one.
 */
function sortedRegions(): GeoJSON.Feature[] {
    const countries = Array.from({ length: 39 }, (_, i) => `C${String(i).padStart(2, '0')}`);
    const features: GeoJSON.Feature[] = [];
    for (const country of countries) {
        // 25 regions each: the first 8 countries already fill 200 features.
        for (let n = 0; n < 25; n++) {
            features.push({
                type: 'Feature',
                properties: { CNTR_CODE: country, NUTS_ID: `${country}${n}` },
                geometry: { type: 'Point', coordinates: [0, 0] },
            });
        }
    }
    return features;
}

test('distinct values are counted over every feature, not the first 200', () => {
    const features = sortedRegions();
    assert.equal(features.length, 975);

    const attributes = collectAttributeInfo(features);
    const code = attributes.find((a) => a.name === 'CNTR_CODE');

    assert.ok(code);
    assert.equal(code.uniqueCount, 39);
    assert.equal(code.presentCount, features.length);
    assert.equal(code.missingCount, 0);
});

test('a key column is recognised by its real cardinality', () => {
    const attributes = collectAttributeInfo(sortedRegions());
    const id = attributes.find((a) => a.name === 'NUTS_ID');

    // One value per feature — what makes the panel dismiss it as a key rather
    // than offer it as something to colour by.
    assert.equal(id?.uniqueCount, 975);
});

test('missing values are counted against every feature', () => {
    const features: GeoJSON.Feature[] = Array.from({ length: 300 }, (_, i) => ({
        type: 'Feature',
        properties: i < 100 ? { name: `n${i}` } : {},
        geometry: { type: 'Point', coordinates: [0, 0] },
    }));

    const name = collectAttributeInfo(features).find((a) => a.name === 'name');
    assert.equal(name?.presentCount, 100);
    assert.equal(name?.missingCount, 200);
});

test('the type sample is bounded but the counts are not', () => {
    const features: GeoJSON.Feature[] = Array.from({ length: 5000 }, (_, i) => ({
        type: 'Feature',
        properties: { label: `v${i}` },
        geometry: { type: 'Point', coordinates: [0, 0] },
    }));

    const label = collectAttributeInfo(features).find((a) => a.name === 'label');
    assert.equal(label?.uniqueCount, 5000);
    assert.equal(label?.values.length, 200);
    assert.equal(label?.type, 'string');
});
