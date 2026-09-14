import test from 'node:test';
import assert from 'node:assert/strict';

import { AREA_FIELD, areaUnitFactor, densityFeatures, geometryKind, measureKind, substituteField, withZeroClass, zeroClass } from '../src/utils/thematic-map';
import { featureArea } from '../src/utils/geo-calculations';

function square(lon: number, lat: number, size: number, properties: Record<string, unknown>, id?: string): GeoJSON.Feature {
    return {
        type: 'Feature',
        ...(id ? { id } : {}),
        properties,
        geometry: {
            type: 'Polygon',
            coordinates: [[[lon, lat], [lon + size, lat], [lon + size, lat + size], [lon, lat + size], [lon, lat]]],
        },
    };
}

test('counts are absolute, rates and shares are relative', () => {
    assert.equal(measureKind('pop_est', [98840, 10839514, 1400000000]), 'absolute');
    assert.equal(measureKind('bevolkingsdichtheid', [12, 400]), 'relative');
    assert.equal(measureKind('p_65_plus', [3.5, 22.1]), 'relative');
    assert.equal(measureKind('fraction', [0.1, 0.9]), 'relative');
    assert.equal(measureKind('inwoners', [120, 5000], ' inh/km²'), 'relative');
    assert.equal(measureKind('inwoners', [120, 5000], ' inh'), 'absolute');
});

test('geometry kind collapses multi-types and reports mixtures', () => {
    assert.equal(geometryKind([square(0, 0, 1, {})]), 'polygon');
    assert.equal(geometryKind([square(0, 0, 1, {}), { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } }]), 'mixed');
});

test('density divides by the area in km²', () => {
    const [feature] = densityFeatures([square(0, 0, 1, { name: 'a', pop: 1000 })], 'pop').features;
    const km2 = featureArea(feature.geometry) / 1e6;
    assert.ok(Math.abs((feature.properties![AREA_FIELD] as number) - km2) / km2 < 1e-5);
    assert.ok(Math.abs((feature.properties!.pop_per_km2 as number) - 1000 / km2) / (1000 / km2) < 1e-5);
});

test('exploded parts with identical attributes share one area and one density', () => {
    const result = densityFeatures([
        square(0, 0, 2, { name: 'Fiji', pop: 900000 }, 'part-1'),
        square(5, 0, 0.1, { name: 'Fiji', pop: 900000 }, 'part-2'),
        square(10, 0, 1, { name: 'Tonga', pop: 100000 }),
    ], 'pop');
    assert.equal(result.partCount, 3);
    assert.equal(result.groupCount, 2);
    const [main, islet] = result.features;
    assert.equal(main.properties!.pop_per_km2, islet.properties!.pop_per_km2, 'the islet gets the country density, not its own');
});

test('a shared province code is not evidence of exploding', () => {
    const result = densityFeatures([
        square(0, 0, 1, { gemeente: 'A', provincie: 'Utrecht', pop: 500 }),
        square(1, 0, 1, { gemeente: 'B', provincie: 'Utrecht', pop: 500 }),
    ], 'pop');
    assert.equal(result.groupCount, 2);
});

test('with nothing but the mapped value there is no evidence to group on', () => {
    const result = densityFeatures([
        square(0, 0, 1, { pop: 500 }),
        square(3, 0, 2, { pop: 500 }),
    ], 'pop');
    assert.equal(result.groupCount, 2);
    assert.notEqual(result.features[0].properties!.pop_per_km2, result.features[1].properties!.pop_per_km2);
    assert.ok(result.groupingSkipped);
});

test('a missing value gets no density rather than zero', () => {
    const [feature] = densityFeatures([square(0, 0, 1, { name: 'x', pop: null })], 'pop').features;
    assert.equal(feature.properties!.pop_per_km2, null);
});

test('zero becomes its own class next to positive values', () => {
    const features = [0, 0, 3, 8, 120].map((pop, i) => square(i, 0, 1, { name: `f${i}`, pop }));
    const { split, zeroCount, rest } = zeroClass(features, 'pop');
    assert.equal(split, true);
    assert.equal(zeroCount, 2);
    assert.deepEqual(rest.map(f => f.properties!.pop), [3, 8, 120], 'the classes are computed without the zeros');
});

test('zero is not split off when the data has negatives or no positives', () => {
    assert.equal(zeroClass([-2, 0, 5].map(v => square(0, 0, 1, { v })), 'v').split, false);
    assert.equal(zeroClass([0, 0].map(v => square(0, 0, 1, { v })), 'v').split, false);
    assert.equal(zeroClass([1, 2].map(v => square(0, 0, 1, { v })), 'v').split, false);
});

test('the zero branch sits after the no-data guards and before the classes', () => {
    const step = ['step', ['to-number', ['get', 'v']], '#a', 10, '#b'];
    const guarded = ['case', ['!', ['has', 'v']], '#ccc', ['==', ['get', 'v'], null], '#ccc', step];
    assert.deepEqual(withZeroClass('v', guarded, '#fff'), [
        'case', ['!', ['has', 'v']], '#ccc', ['==', ['get', 'v'], null], '#ccc', ['==', ['get', 'v'], 0], '#fff', step,
    ]);
    assert.deepEqual(withZeroClass('v', step, '#fff'), ['case', ['==', ['get', 'v'], 0], '#fff', step]);
});

test('snake_case per-unit names and small ordinal codes are not counts', () => {
    assert.equal(measureKind('stedelijkheid_adressen_per_km2', [1, 2, 3, 4, 5]), 'relative');
    assert.equal(measureKind('klasse', [1, 2, 3, 4, 5, 1, 2]), 'relative');
    assert.equal(measureKind('adressen_per_km2', [120, 4400]), 'relative');
    assert.equal(measureKind('tulpen', [0, 3, 250, 12000]), 'absolute');
});

test('a computed field in a style becomes the expression that computes it', () => {
    const value = ['/', ['to-number', ['get', 'pop']], ['*', ['to-number', ['get', 'area_ha']], 0.01]];
    const has = ['all', ['has', 'pop'], ['has', 'area_ha']];
    const style = { paint: { 'fill-color': ['case', ['!', ['has', 'pop_per_km2']], '#ccc', ['step', ['to-number', ['get', 'pop_per_km2']], '#a', 10, '#b']] } };
    assert.deepEqual(substituteField(style, 'pop_per_km2', value, has), {
        paint: { 'fill-color': ['case', ['!', has], '#ccc', ['step', ['to-number', value], '#a', 10, '#b']] },
    });
    assert.deepEqual(substituteField(['==', ['get', 'pop_per_km2'], null], 'pop_per_km2', value, has), ['!', has]);
});

test('the unit of an area field is found from the measured areas', () => {
    const km2 = featureArea(square(5, 52, 0.1, {}).geometry) / 1e6;
    const features = [square(5, 52, 0.1, { opp_ha: km2 * 100 }), square(6, 52, 0.1, { opp_ha: (featureArea(square(6, 52, 0.1, {}).geometry) / 1e6) * 100 })];
    assert.equal(areaUnitFactor(features, 'opp_ha'), 0.01);
    // Simplified tile geometry measures 20% small: still hectares.
    const rough = [square(5, 52, 0.1, { opp_ha: km2 * 100 * 1.2 })];
    assert.equal(areaUnitFactor(rough, 'opp_ha'), 0.01);
    assert.equal(areaUnitFactor([square(0, 0, 1, { a: 0 })], 'a'), null);
});
