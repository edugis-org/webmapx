import test from 'node:test';
import assert from 'node:assert/strict';

import { substituteTimeTokens, substituteTimeTokensDeep } from '../src/config/time-tokens';

const url = 'https://example.org/tmp2m/tiles/{utcdatehour}/{z}/{x}/{y}.png';

test('{utcdatehour} is yyyyMMddHH in UTC, zero-padded', () => {
    assert.equal(
        substituteTimeTokens(url, new Date(Date.UTC(2026, 0, 2, 3, 59))),
        'https://example.org/tmp2m/tiles/2026010203/{z}/{x}/{y}.png',
    );
});

test('the UTC date is used, not the local one', () => {
    // 23:30 UTC is already the next day east of Greenwich.
    assert.equal(substituteTimeTokens('{utcdatehour}', new Date('2026-12-31T23:30:00Z')), '2026123123');
});

test('every occurrence in a layer is filled in, and tile placeholders survive', () => {
    const layer = { id: 'a', source: { type: 'raster', url: [url, url] } };
    const out = substituteTimeTokensDeep(layer, new Date(Date.UTC(2026, 10, 2, 11)));
    assert.deepEqual(out.source.url, Array(2).fill('https://example.org/tmp2m/tiles/2026110211/{z}/{x}/{y}.png'));
    assert.equal(layer.source.url[0], url, 'the configured layer itself is not rewritten');
});

test('a layer without the token is returned as it was, inline GeoJSON untouched', () => {
    const layer = { id: 'a', source: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } };
    assert.equal(substituteTimeTokensDeep(layer, new Date()), layer);
});
