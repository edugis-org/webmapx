import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { portolanTarget, resolvePortolanSources } from '../src/map/portolan-sources';

const BASE = 'https://data.source.coop/portolan-mirrors/portolan-spec-examples/portolan-reference/main';
const PROVINCES = `${BASE}/boundaries/netherlands-provinces/collection.json`;
const COUNTRIES = `${BASE}/reference/natural-earth-countries/collection.json`;

async function fixture(name: string): Promise<string> {
    return readFile(path.join(process.cwd(), 'tests', 'fixtures', 'portolan', name), 'utf8');
}

/** Answers collection URLs from the fixtures, counting requests. */
async function withFetch<T>(run: (asked: string[]) => Promise<T>): Promise<T> {
    const docs: Record<string, string> = {
        [PROVINCES]: await fixture('netherlands-provinces/collection.json'),
        [COUNTRIES]: await fixture('natural-earth-countries/collection.json'),
    };
    const asked: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: string | URL) => {
        const url = String(input);
        asked.push(url);
        return url in docs ? new Response(docs[url], { status: 200 }) : new Response('not found', { status: 404 });
    }) as typeof fetch;
    try {
        return await run(asked);
    } finally {
        globalThis.fetch = original;
    }
}

test('portolan:// names a collection, and optionally one of its styles', () => {
    assert.deepEqual(portolanTarget(`portolan://${PROVINCES}`), { collectionUrl: PROVINCES });
    assert.deepEqual(portolanTarget(`portolan://${PROVINCES}#style-labeled`), { collectionUrl: PROVINCES, styleKey: 'style-labeled' });
    assert.equal(portolanTarget(PROVINCES), null, 'a bare URL is not a portolan:// reference');
    assert.equal(portolanTarget('portolan://../relative/collection.json'), null, 'must be absolute once the config is loaded');
});

test('a portolan:// source becomes the collection\'s current PMTiles, with its attribution', async () => {
    await withFetch(async () => {
        const configured = { type: 'vector', url: `portolan://${PROVINCES}` };
        const sources: Record<string, any> = { provinces: configured };
        await resolvePortolanSources(sources);

        assert.equal(sources.provinces.type, 'vector');
        assert.equal(sources.provinces.url, `pmtiles://${BASE}/boundaries/netherlands-provinces/netherlands-provinces.pmtiles`);
        assert.equal(sources.provinces.attribution, '© Kadaster / PDOK, CC-BY-4.0');
        assert.equal(configured.url, `portolan://${PROVINCES}`, 'the config\'s own object still says portolan:// — a saved config must not pin a hashed file');
    });
});

test('a small collection without PMTiles becomes a GeoJSON source read from its GeoParquet', async () => {
    await withFetch(async () => {
        const sources: Record<string, any> = { countries: { type: 'vector', url: `portolan://${COUNTRIES}`, attribution: 'Mine' } };
        await resolvePortolanSources(sources);

        assert.equal(sources.countries.type, 'geojson');
        assert.equal(sources.countries.url, undefined);
        assert.equal(sources.countries.data, `geoparquet://${BASE}/reference/natural-earth-countries/natural-earth-countries.parquet`);
        assert.equal(sources.countries.attribution, 'Mine', 'an attribution the config gives wins');
    });
});

test('a collection is read once however many sources name it; other sources are untouched', async () => {
    await withFetch(async (asked) => {
        const osm = { type: 'raster', url: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'] };
        const sources: Record<string, any> = {
            a: { type: 'vector', url: `portolan://${PROVINCES}` },
            b: { type: 'vector', url: `portolan://${PROVINCES}` },
            osm,
        };
        await resolvePortolanSources(sources);
        await resolvePortolanSources({ c: { type: 'vector', url: `portolan://${PROVINCES}` } });

        // At most once: the cache lives for the page, so an earlier test may already have read it.
        assert.ok(asked.filter((u) => u === PROVINCES).length <= 1);
        assert.equal(sources.osm, osm);
        assert.equal(sources.a.url, sources.b.url);
    });
});

test('an unreadable collection leaves the source alone rather than throwing', async () => {
    await withFetch(async () => {
        const missing = `${BASE}/nope/collection.json`;
        const sources: Record<string, any> = { x: { type: 'vector', url: `portolan://${missing}` } };
        await resolvePortolanSources(sources);
        assert.equal(sources.x.url, `portolan://${missing}`);
    });
});
