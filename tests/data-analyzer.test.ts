import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeDataset } from '../src/utils/data-analyzer';

function feature(properties: Record<string, unknown>): GeoJSON.Feature {
    return { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties };
}

test('data analyzer detects CBS no-data codes and excludes ID-like fields', () => {
    const features = [
        feature({ buurtcode: 'BU0001', gemiddeld_inkomen: 30, autos_per_huishouden: 1.1 }),
        feature({ buurtcode: 'BU0002', gemiddeld_inkomen: 32, autos_per_huishouden: 1.2 }),
        feature({ buurtcode: 'BU0003', gemiddeld_inkomen: 99997, autos_per_huishouden: 1.8 }),
        feature({ buurtcode: 'BU0004', gemiddeld_inkomen: 35, autos_per_huishouden: 1.9 }),
    ];

    const analysis = analyzeDataset(features);
    const income = analysis.profiles.find(profile => profile.name === 'gemiddeld_inkomen');
    const code = analysis.profiles.find(profile => profile.name === 'buurtcode');

    assert.equal(income?.family, 'Income');
    assert.equal(income?.dataType, 'integer');
    assert.equal(income?.suspectedNoData[0]?.value, 99997);
    assert.equal(income?.stats?.min, 30);
    assert.equal(income?.stats?.max, 35);
    assert.equal(income?.stats?.mean, 32.333333333333336);
    assert.equal(income?.stats?.median, 32);
    assert.equal(code?.role, 'id');
    assert.ok(!analysis.usableNumericFields.includes('buurtcode'));
    assert.ok(analysis.suggestions.some(suggestion => suggestion.kind === 'hygiene'));
});

test('data analyzer ranks strong correlations as relationship suggestions', () => {
    const features = Array.from({ length: 12 }, (_, index) => feature({
        kinderen_pct: index,
        autos_per_huishouden: index * 2,
        willekeurig: index % 3,
    }));

    const analysis = analyzeDataset(features);

    assert.ok(analysis.correlations.some(correlation =>
        correlation.a === 'kinderen_pct' &&
        correlation.b === 'autos_per_huishouden' &&
        correlation.r > 0.99,
    ));
    assert.ok(analysis.suggestions.some(suggestion =>
        suggestion.kind === 'relationship' &&
        suggestion.fields.includes('kinderen_pct') &&
        suggestion.fields.includes('autos_per_huishouden'),
    ));
});

test('data analyzer keeps high-cardinality numeric measures usable', () => {
    const features = Array.from({ length: 20 }, (_, index) => feature({
        objectid: index + 1,
        inkomen_score: index * 3.7,
    }));

    const analysis = analyzeDataset(features);

    assert.equal(analysis.profiles.find(profile => profile.name === 'objectid')?.role, 'id');
    assert.equal(analysis.profiles.find(profile => profile.name === 'objectid')?.dataType, 'integer');
    assert.equal(analysis.profiles.find(profile => profile.name === 'inkomen_score')?.role, 'measure');
    assert.equal(analysis.profiles.find(profile => profile.name === 'inkomen_score')?.dataType, 'number');
    assert.ok(analysis.usableNumericFields.includes('inkomen_score'));
});

test('data analyzer does not infer no-data from repeated decimal extremes', () => {
    const features = [
        feature({ measurement: 1.2 }),
        feature({ measurement: 1.3 }),
        feature({ measurement: 1.4 }),
        feature({ measurement: 999999.9999 }),
        feature({ measurement: 999999.9999 }),
    ];

    const profile = analyzeDataset(features).profiles.find(item => item.name === 'measurement');
    assert.deepEqual(profile?.suspectedNoData, []);
});

test('data analyzer detects totals and percentage composition families', () => {
    const features = [
        feature({ bevolking: 100, mannen: 48, vrouwen: 52, pct_0_14: 20, pct_15_64: 60, pct_65_plus: 20 }),
        feature({ bevolking: 80, mannen: 39, vrouwen: 41, pct_0_14: 15, pct_15_64: 55, pct_65_plus: 30 }),
        feature({ bevolking: 120, mannen: 58, vrouwen: 62, pct_0_14: 25, pct_15_64: 58, pct_65_plus: 17 }),
        feature({ bevolking: 90, mannen: 44, vrouwen: 46, pct_0_14: 18, pct_15_64: 62, pct_65_plus: 20 }),
    ];

    const analysis = analyzeDataset(features);

    assert.ok(analysis.families.some(family =>
        family.reason === 'parts add up to this total' &&
        family.fields.includes('bevolking') &&
        family.fields.includes('mannen') &&
        family.fields.includes('vrouwen'),
    ));
    assert.ok(analysis.families.some(family =>
        family.reason === 'fields add up to about 100%' &&
        family.fields.includes('pct_0_14') &&
        family.fields.includes('pct_15_64') &&
        family.fields.includes('pct_65_plus'),
    ));
});

test('data analyzer finds families from data even with multilingual field names', () => {
    const features = [
        feature({ bevolking: 100, mannen: 48, vrouwen: 52, vaesto: 100, miehet: 48, naiset: 52, poblacion: 100, hombres: 48, mujeres: 52, πληθυσμος: 100, ανδρες: 48, γυναικες: 52 }),
        feature({ bevolking: 80, mannen: 39, vrouwen: 41, vaesto: 80, miehet: 39, naiset: 41, poblacion: 80, hombres: 39, mujeres: 41, πληθυσμος: 80, ανδρες: 39, γυναικες: 41 }),
        feature({ bevolking: 120, mannen: 58, vrouwen: 62, vaesto: 120, miehet: 58, naiset: 62, poblacion: 120, hombres: 58, mujeres: 62, πληθυσμος: 120, ανδρες: 58, γυναικες: 62 }),
        feature({ bevolking: 90, mannen: 44, vrouwen: 46, vaesto: 90, miehet: 44, naiset: 46, poblacion: 90, hombres: 44, mujeres: 46, πληθυσμος: 90, ανδρες: 44, γυναικες: 46 }),
    ];

    const analysis = analyzeDataset(features);

    assert.ok(analysis.families.some(family =>
        family.reason === 'parts add up to this total' &&
        family.fields.includes('vaesto') &&
        family.fields.includes('miehet') &&
        family.fields.includes('naiset'),
    ));
    assert.ok(analysis.families.some(family =>
        family.reason === 'parts add up to this total' &&
        family.fields.includes('poblacion') &&
        family.fields.includes('hombres') &&
        family.fields.includes('mujeres'),
    ));
    assert.ok(analysis.families.some(family =>
        family.reason === 'fields move together across the data' &&
        family.fields.includes('bevolking') &&
        family.fields.includes('vaesto') &&
        family.fields.includes('poblacion'),
    ));
    assert.ok(analysis.families.some(family =>
        family.reason === 'parts add up to this total' &&
        family.fields.includes('πληθυσμος') &&
        family.fields.includes('ανδρες') &&
        family.fields.includes('γυναικες'),
    ));
});

test('data analyzer detects unnamed percentage compositions from values', () => {
    const features = [
        feature({ ryhma_a: 20, ryhma_b: 60, ryhma_c: 20 }),
        feature({ ryhma_a: 15, ryhma_b: 55, ryhma_c: 30 }),
        feature({ ryhma_a: 25, ryhma_b: 58, ryhma_c: 17 }),
        feature({ ryhma_a: 18, ryhma_b: 62, ryhma_c: 20 }),
    ];

    const analysis = analyzeDataset(features);

    assert.ok(analysis.families.some(family =>
        family.reason === 'fields add up to about 100%' &&
        family.fields.includes('ryhma_a') &&
        family.fields.includes('ryhma_b') &&
        family.fields.includes('ryhma_c'),
    ));
});

test('data analyzer finds likely borders in ordered attribute blocks', () => {
    const features = [
        feature({ buurtcode: 'BU0001', bevolking: 100, mannen: 48, vrouwen: 52, pct_0_14: 20, pct_15_64: 60, pct_65_plus: 20, inkomen: 32 }),
        feature({ buurtcode: 'BU0002', bevolking: 80, mannen: 39, vrouwen: 41, pct_0_14: 15, pct_15_64: 55, pct_65_plus: 30, inkomen: 35 }),
        feature({ buurtcode: 'BU0003', bevolking: 120, mannen: 58, vrouwen: 62, pct_0_14: 25, pct_15_64: 58, pct_65_plus: 17, inkomen: 44 }),
        feature({ buurtcode: 'BU0004', bevolking: 90, mannen: 44, vrouwen: 46, pct_0_14: 18, pct_15_64: 62, pct_65_plus: 20, inkomen: 31 }),
    ];

    const analysis = analyzeDataset(features);

    assert.ok(analysis.familyBorders.some(border =>
        border.afterField === 'buurtcode' &&
        border.beforeField === 'bevolking',
    ));
    assert.ok(analysis.familyBorders.some(border =>
        border.afterField === 'pct_65_plus' &&
        border.beforeField === 'inkomen',
    ));
    assert.ok(!analysis.familyBorders.some(border =>
        border.afterField === 'mannen' &&
        border.beforeField === 'vrouwen',
    ));
});

test('data analyzer prefers profiles over raw total parts in suggestions', () => {
    const features = [
        feature({ aantal_inwoners: 100, mannen: 48, vrouwen: 52, percentage_personen_0_tot_15_jaar: 20, percentage_personen_15_tot_65_jaar: 60, percentage_personen_65_jaar_en_ouder: 20, omgevingsadressendichtheid: 1200 }),
        feature({ aantal_inwoners: 80, mannen: 39, vrouwen: 41, percentage_personen_0_tot_15_jaar: 15, percentage_personen_15_tot_65_jaar: 55, percentage_personen_65_jaar_en_ouder: 30, omgevingsadressendichtheid: 600 }),
        feature({ aantal_inwoners: 120, mannen: 58, vrouwen: 62, percentage_personen_0_tot_15_jaar: 25, percentage_personen_15_tot_65_jaar: 58, percentage_personen_65_jaar_en_ouder: 17, omgevingsadressendichtheid: 3000 }),
        feature({ aantal_inwoners: 90, mannen: 44, vrouwen: 46, percentage_personen_0_tot_15_jaar: 18, percentage_personen_15_tot_65_jaar: 62, percentage_personen_65_jaar_en_ouder: 20, omgevingsadressendichtheid: 900 }),
    ];

    const analysis = analyzeDataset(features);
    const top = analysis.suggestions.slice(0, 5);

    assert.ok(top.some(suggestion =>
        suggestion.kind === 'family' &&
        suggestion.fields.includes('percentage_personen_0_tot_15_jaar') &&
        suggestion.fields.includes('percentage_personen_65_jaar_en_ouder'),
    ));
    assert.ok(!top.some(suggestion =>
        suggestion.kind === 'map' &&
        (suggestion.fields.includes('mannen') || suggestion.fields.includes('vrouwen')),
    ));
});
