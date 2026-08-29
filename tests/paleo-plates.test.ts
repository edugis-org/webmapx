/**
 * Plate boundaries are sampled, not reconstructed.
 *
 * The coastlines get a rotation table and interpolate, because a coastline
 * rides one plate. A boundary cannot: boundaries are born, die and change in
 * number, so 60 Ma is not 50 Ma moved a little. The layer therefore reads the
 * nearest snapshot, and these tests pin the two behaviours that follow from
 * that — which snapshot is chosen, and what is shown while it is being fetched.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { paleoPlates } from '../src/utils/paleo-plates';

const BASE = 'http://example.org/config/data/paleo/muller2019/plates';

interface Fetched { url: string }

/** Serves an index of 0…250 every 10 Ma, and a snapshot naming its own age. */
function serve(calls: Fetched[]): typeof globalThis.fetch {
    const ages = Array.from({ length: 26 }, (_, i) => i * 10);
    return (async (input: RequestInfo | URL) => {
        const url = String(input);
        calls.push({ url });
        if (url.endsWith('plates-index.json')) {
            return new Response(JSON.stringify({ model: 'MULLER2019', step: 10, ages }), { status: 200 });
        }
        const age = Number(/plates-(\d+)\.geojson$/.exec(url)?.[1] ?? NaN);
        if (!Number.isFinite(age)) return new Response('nope', { status: 404 });
        return new Response(JSON.stringify({
            type: 'FeatureCollection',
            features: [{ type: 'Feature', properties: { ma: age, deforming: true }, geometry: null }],
        }), { status: 200 });
    }) as typeof globalThis.fetch;
}

/**
 * Runs the generator until the age asked for has arrived.
 *
 * `expected` matters: while a snapshot is being fetched the layer deliberately
 * keeps showing the nearest one it already has, so a test that stops at "any
 * features" reads the *previous* step and calls it the answer.
 */
async function settle(query: string, expected: number, tries = 40): Promise<GeoJSON.FeatureCollection> {
    let result: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
    for (let i = 0; i < tries; i++) {
        result = paleoPlates(new URLSearchParams(query));
        if (result.features[0]?.properties?.ma === expected) return result;
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return result;
}

test('a url without a directory draws nothing rather than guessing', () => {
    const empty = paleoPlates(new URLSearchParams('ma=50'));
    assert.deepEqual(empty.features, []);
});

test('an age lands on the nearest sampled step', async () => {
    const calls: Fetched[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = serve(calls);
    try {
        // 47 Ma is nearer 50 than 40; the layer must not silently show 40.
        const at47 = await settle(`data=${BASE}&ma=47`, 50);
        assert.equal(at47.features[0]?.properties?.ma, 50);

        const at44 = await settle(`data=${BASE}&ma=44`, 40);
        assert.equal(at44.features[0]?.properties?.ma, 40);

        // Beyond the model: the oldest step, not nothing.
        const at999 = await settle(`data=${BASE}&ma=999`, 250);
        assert.equal(at999.features[0]?.properties?.ma, 250);
    } finally {
        globalThis.fetch = original;
    }
});

test('while a step is loading, the nearest one already held is shown', async () => {
    const calls: Fetched[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = serve(calls);
    try {
        await settle(`data=${BASE}&ma=200`, 200);
        // 190 is not loaded yet, so the first call must answer with 200 rather
        // than an empty collection: a layer that blinks out on every drag of
        // the slider is worse than one a step behind.
        const immediate = paleoPlates(new URLSearchParams(`data=${BASE}&ma=190`));
        assert.equal(immediate.features[0]?.properties?.ma, 200);
        const settled = await settle(`data=${BASE}&ma=190`, 190);
        assert.equal(settled.features[0]?.properties?.ma, 190);
    } finally {
        globalThis.fetch = original;
    }
});

test('a snapshot is fetched once and then reused', async () => {
    const calls: Fetched[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = serve(calls);
    try {
        await settle(`data=${BASE}&ma=120`, 120);
        const before = calls.filter((c) => c.url.includes('plates-0120')).length;
        for (let i = 0; i < 5; i++) paleoPlates(new URLSearchParams(`data=${BASE}&ma=120`));
        const after = calls.filter((c) => c.url.includes('plates-0120')).length;
        assert.equal(after, before, 'the same age should not be fetched again');
    } finally {
        globalThis.fetch = original;
    }
});
