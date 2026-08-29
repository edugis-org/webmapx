/**
 * `map.backgroundColor` is what a map with no basemap is made of.
 *
 * Every engine has its own default for that, and they disagree: black for a
 * Cesium globe and the space around it, near-black for a MapLibre globe, a
 * paper colour forced with `!important` in Leaflet, the page showing through a
 * transparent canvas in OpenLayers. A palaeogeography map has no basemap by
 * definition, so without this the sea is whichever accident the engine picked.
 *
 * These tests cover the config path — that the value reaches the adapter, and
 * that an adapter remembers it. What colour actually lands on the screen is a
 * question about four rendering pipelines and is answered by measuring pixels
 * in a browser, not here.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { parseAndValidateConfig } from '../src/config/loader';
import { resolveInitOptions } from '../src/bootstrap/resolve-init-options';
import { validateConfig } from '../src/config/validator';

const baseMap = { type: 'maplibre' as const, center: [0, 0] as [number, number], zoom: 2 };

test('a background colour survives config parsing', () => {
    const config = parseAndValidateConfig({
        version: 0,
        map: { ...baseMap, backgroundColor: '#0b3d66' },
        layerData: { sources: [], layers: [] },
    }, 'test', 'http://example.org/config/deeptime.json');

    assert.equal(config.map.backgroundColor, '#0b3d66');
});

test('the validator accepts it rather than calling it an unknown key', () => {
    const result = validateConfig({
        version: 0,
        map: { ...baseMap, backgroundColor: 'marineblue' },
        layerData: { sources: [], layers: [] },
    });
    const complaints = [...result.errors, ...result.warnings]
        .filter((message) => message.path.startsWith('map'));
    assert.deepEqual(complaints, []);
});

test('it reaches the adapter through the init options', async () => {
    const options = await resolveInitOptions({
        mapConfig: { center: [0, 0], zoom: 2, backgroundColor: '#0b3d66' },
    });
    assert.equal(options.backgroundColor, '#0b3d66');
});

test('a config without one asks for nothing', async () => {
    const options = await resolveInitOptions({ mapConfig: { center: [0, 0], zoom: 2 } });
    assert.ok(!('backgroundColor' in options), 'no colour should mean no option at all');
});

test('an adapter remembers the colour it was given', async () => {
    // The engine half is stubbed: this is about the bookkeeping in BaseAdapter,
    // which is what lets a colour survive an engine switch under the same map.
    const { BaseAdapter } = await import('../src/map/base-adapter');

    class StubAdapter extends (BaseAdapter as unknown as new () => Record<string, unknown>) {
        applied: Array<string | null> = [];
        protected engineSetBackgroundColor(color: string | null): boolean {
            (this as unknown as StubAdapter).applied.push(color);
            return true;
        }
    }

    const adapter = new StubAdapter() as unknown as {
        setBackgroundColor(color: string | null): boolean;
        getBackgroundColor(): string | null;
        applied: Array<string | null>;
    };

    assert.equal(adapter.getBackgroundColor(), null);
    assert.equal(adapter.setBackgroundColor('#0b3d66'), true);
    assert.equal(adapter.getBackgroundColor(), '#0b3d66');
    adapter.setBackgroundColor(null);
    assert.equal(adapter.getBackgroundColor(), null);
    assert.deepEqual(adapter.applied, ['#0b3d66', null]);
});
