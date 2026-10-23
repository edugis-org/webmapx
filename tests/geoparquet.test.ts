import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import type { AddressInfo } from 'node:net';

import { geoParquetToGeoJSON } from '../src/utils/geoparquet';
import { parseAndValidateConfig } from '../src/config/loader';
import { resolveGeoJSONSources } from '../src/map/geojson-loader';

/** Fixtures are small hand-built GeoParquet files; tests run bundled from a temp dir, so resolve from the repo root. */
async function fixture(name: string): Promise<ArrayBuffer> {
    const bytes = await readFile(path.join(process.cwd(), 'tests', 'fixtures', name));
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

test('a GeoParquet file without a crs is read as CRS84, untouched', async () => {
    const fc = await geoParquetToGeoJSON(await fixture('geoparquet-crs84.parquet'));

    assert.equal(fc.features.length, 2, 'the row without geometry is dropped');
    const [first] = fc.features;
    assert.deepEqual(first.geometry, { type: 'Point', coordinates: [4.405, 51.698] });
    assert.equal(first.properties?.name, 'Volkeraksluizen');
    assert.equal('geometry' in (first.properties ?? {}), false);
});

test('INT64 and timestamps become values a GeoJSON source can carry', async () => {
    const fc = await geoParquetToGeoJSON(await fixture('geoparquet-crs84.parquet'));
    const [small, huge] = fc.features.map((f) => f.properties ?? {});

    assert.equal(small.id, 1);
    assert.equal(huge.id, '9007199254740993', 'beyond Number.MAX_SAFE_INTEGER it is kept exact, as text');
    assert.equal(small.opened, '2026-10-01T00:00:00.000Z');
    assert.doesNotThrow(() => JSON.stringify(fc));
});

test('a projected crs is reprojected to WGS84', async () => {
    const fc = await geoParquetToGeoJSON(await fixture('geoparquet-rd.parquet'));
    const [lon, lat] = (fc.features[0].geometry as GeoJSON.Point).coordinates;

    // The RD origin, Amersfoort's Onze Lieve Vrouwetoren.
    assert.ok(Math.abs(lon - 5.3876) < 0.001, `lon ${lon}`);
    assert.ok(Math.abs(lat - 52.1552) < 0.001, `lat ${lat}`);
});

function geojsonSourceData(data: string): unknown {
    const config = parseAndValidateConfig({
        version: 0,
        map: { type: 'maplibre', center: [0, 0], zoom: 2 },
        layerData: {
            sources: [{ id: 'locks', type: 'geojson', data, attribution: 'test' }],
            layers: [],
        },
    }, 'test', 'http://example.org/config/world.json');
    return (config.layerData.sources?.find((entry) => entry.id === 'locks') as { data?: unknown } | undefined)?.data;
}

test('a relative geoparquet:// file is resolved against the config, like pmtiles://', () => {
    assert.equal(geojsonSourceData('geoparquet://../data/locks.parquet'), 'geoparquet://http://example.org/data/locks.parquet');
    assert.equal(
        geojsonSourceData('geoparquet://https://data.example.net/locks.parquet'),
        'geoparquet://https://data.example.net/locks.parquet',
    );
});

/** A static file server that answers HEAD and byte ranges, which is all a GeoParquet reader asks of a host. */
async function serveFixtures(): Promise<{ base: string; close: () => void }> {
    const server = http.createServer(async (req, res) => {
        const bytes = await readFile(path.join(process.cwd(), 'tests', 'fixtures', path.basename(req.url ?? '')));
        const range = /bytes=(\d+)-(\d*)/.exec(req.headers.range ?? '');
        if (range) {
            const start = Number(range[1]);
            const end = range[2] ? Number(range[2]) : bytes.length - 1;
            res.writeHead(206, { 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${bytes.length}` });
            res.end(req.method === 'HEAD' ? undefined : bytes.subarray(start, end + 1));
            return;
        }
        res.writeHead(200, { 'Content-Length': bytes.length, 'Accept-Ranges': 'bytes' });
        res.end(req.method === 'HEAD' ? undefined : bytes);
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    return { base: `http://127.0.0.1:${port}`, close: () => server.close() };
}

test('a geojson source naming geoparquet:// reaches the engines as inline GeoJSON', async () => {
    const { base, close } = await serveFixtures();
    try {
        const sources: Record<string, { type: string; data: unknown }> = {
            locks: { type: 'geojson', data: `geoparquet://${base}/geoparquet-crs84.parquet` },
        };
        await resolveGeoJSONSources(sources);
        const data = sources.locks.data as GeoJSON.FeatureCollection;

        assert.equal(data.type, 'FeatureCollection');
        assert.equal(data.features.length, 2);
        assert.equal(data.features[0].properties?.name, 'Volkeraksluizen');
    } finally {
        close();
    }
});
