import test from 'node:test';
import assert from 'node:assert/strict';

import { legendSublayerLabel, readableSublayerId, sublayerDataLabel } from '../src/utils/layer-label';

test('legend and styler labels prefer metadata, then layer type, then id fallback', () => {
    assert.equal(
        legendSublayerLabel({ label: 'Provincienamen (2023)' }, { id: 'uuid-layer', type: 'symbol' }, 'uuid-layer', true),
        'Provincienamen (2023)',
    );
    assert.equal(
        legendSublayerLabel(null, { id: '4f7b7c9b-8896-4c64-8a0a-9fd041795765', type: 'fill' }, '4f7b7c9b-8896-4c64-8a0a-9fd041795765', true),
        'fill',
    );
    assert.equal(
        legendSublayerLabel(null, { id: '4f7b7c9b-8896-4c64-8a0a-9fd041795765', type: 'line' }, '4f7b7c9b-8896-4c64-8a0a-9fd041795765', false),
        'line',
    );
});

test('a single sublayer renamed in the styler is called by its own name, not the layer’s', () => {
    assert.equal(
        legendSublayerLabel(
            { label: 'Provincienamen (2023)' },
            { id: 'provincienamen2023-layer', type: 'symbol', metadata: { label: 'Provinces' } },
            'provincienamen2023-layer',
            true,
        ),
        'Provinces',
    );
});

test('a hand-written style is labelled by its ids, read as words', () => {
    const cases: Array<[string, string, string]> = [
        ['landuse_residential', 'fill', 'landuse residential'],
        ['road_motorway_link_casing', 'line', 'road motorway link casing'],
        ['park_outline', 'line', 'park outline'],
        ['water', 'fill', 'water'],
        ['boundary_3', 'line', 'boundary 3'],
    ];
    for (const [id, type, expected] of cases) {
        assert.equal(legendSublayerLabel(null, { id, type }, id, false, 'openfreemap-liberty'), expected);
    }
});

test('a generated id is never shown; what the sublayer draws is, else its type', () => {
    assert.equal(readableSublayerId('aacf212ue3f_edit_layer3__'), null);
    assert.equal(readableSublayerId('4f7b7c9b-8896-4c64-8a0a-9fd041795765'), null);
    assert.equal(readableSublayerId('xkcdq_fill'), null);
    assert.equal(
        legendSublayerLabel(null, {
            id: 'aacf212ue3f_edit_layer3__', type: 'fill', 'source-layer': 'landcover',
            filter: ['==', ['get', 'class'], 'wood'],
        }, 'aacf212ue3f_edit_layer3__', false),
        'landcover: wood',
    );
    assert.equal(legendSublayerLabel(null, { id: 'aacf212ue3f', type: 'line' }, 'aacf212ue3f', false), 'line');
});

test('an id that only repeats the layer and the type says the type', () => {
    for (const [id, type] of [['world-countries-fill', 'fill'], ['world-countries-line', 'line'], ['world-countries:NUTS_RG_01M_2024-line', 'line']]) {
        assert.equal(legendSublayerLabel(null, { id, type }, id, false, 'world-countries'), type);
    }
});

test('filter values come from the forms styles use', () => {
    assert.equal(sublayerDataLabel({ 'source-layer': 'landuse', filter: ['all', ['==', ['get', 'class'], 'park'], ['!=', ['get', 'brunnel'], 'tunnel']] }), 'landuse: park');
    assert.equal(sublayerDataLabel({ 'source-layer': 'landcover', filter: ['==', 'class', 'wood'] }), 'landcover: wood');
    assert.equal(sublayerDataLabel({ 'source-layer': 'water_name', filter: ['match', ['get', 'class'], ['lake', 'sea'], true, false] }), 'water name: lake, sea');
    assert.equal(sublayerDataLabel({ 'source-layer': 'water', filter: ['==', '$type', 'Polygon'] }), 'water');
    assert.equal(sublayerDataLabel({ id: 'x' }), null);
});
