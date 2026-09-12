import test from 'node:test';
import assert from 'node:assert/strict';

import { legendSublayerLabel } from '../src/utils/layer-label';

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
