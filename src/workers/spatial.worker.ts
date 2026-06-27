/**
 * Spatial analysis web worker — singleton, shared across all spatial tools.
 *
 * Uses gdal3.js (GDAL compiled to WASM) as the computation engine.
 * GDAL is lazy-loaded on first operation; subsequent ops reuse the same instance.
 *
 * Protocol: every message in/out carries an opId so the manager can route
 * responses back to the correct caller even if multiple ops are in flight.
 *
 * Buffer strategy (3-step):
 *   1. ogr2ogr input WGS84 → EPSG:3857 (GDAL native reprojection, meters)
 *   2. ST_Buffer in EPSG:3857 meters via SQLite spatial dialect
 *   3. ogr2ogr EPSG:3857 → WGS84
 */

import initGdalJs from 'gdal3.js';
import wasmUrl from 'gdal3.js/dist/package/gdal3WebAssembly.wasm?url';
import dataUrl from 'gdal3.js/dist/package/gdal3WebAssembly.data?url';
import workerJsUrl from 'gdal3.js/dist/package/gdal3.js?url';

// ─── Message types (re-exported so the manager can import them) ───────────────

export type SpatialOp =
    | { op: 'buffer'; distanceMeters: number; segments?: number; input: GeoJSON.FeatureCollection }
    | { op: 'ping' };

export interface SpatialRequest {
    opId: string;
    operation: SpatialOp;
}

export type SpatialResponse =
    | { opId: string; status: 'ok'; result: GeoJSON.FeatureCollection }
    | { opId: string; status: 'error'; message: string }
    | { opId: string; status: 'ready' };

// ─── GDAL singleton ───────────────────────────────────────────────────────────

type GdalInstance = Awaited<ReturnType<typeof initGdalJs>>;

let gdalInstance: GdalInstance | null = null;
let gdalLoading: Promise<GdalInstance> | null = null;

function getGdal(): Promise<GdalInstance> {
    if (gdalInstance) return Promise.resolve(gdalInstance);
    if (gdalLoading) return gdalLoading;

    gdalLoading = initGdalJs({
        paths: {
            wasm: wasmUrl,
            data: dataUrl,
            js: workerJsUrl,
        },
    }).then((gdal: GdalInstance) => {
        gdalInstance = gdal;
        return gdal;
    });

    return gdalLoading;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function featureCollectionToFile(fc: GeoJSON.FeatureCollection, name: string): Promise<File> {
    const json = JSON.stringify(fc);
    const blob = new Blob([json], { type: 'application/json' });
    return new File([blob], `${name}.geojson`);
}

async function filePathToFeatureCollection(gdal: GdalInstance, filePath: string | { local: string; real: string }): Promise<GeoJSON.FeatureCollection> {
    const bytes = await gdal.getFileBytes(filePath as string | Parameters<GdalInstance['getFileBytes']>[0]);
    const text = new TextDecoder().decode(bytes);
    return JSON.parse(text) as GeoJSON.FeatureCollection;
}

// ─── Operations ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function openDataset(gdal: GdalInstance, path: string): Promise<any> {
    const { datasets, errors } = await gdal.open(path);
    const ds = datasets[0];
    if (!ds) throw new Error(`Failed to open ${path}: ${errors.join('; ')}`);
    return ds;
}

async function buffer(
    gdal: GdalInstance,
    input: GeoJSON.FeatureCollection,
    distanceMeters: number,
    segments: number = 16,
): Promise<GeoJSON.FeatureCollection> {
    // Step 1: write input GeoJSON and open it
    const inputFile = await featureCollectionToFile(input, 'spatialinput');
    const { datasets: inputDatasets, errors: inputErrors } = await gdal.open(inputFile);
    const inputDataset = inputDatasets[0];
    if (!inputDataset) throw new Error(`Failed to open input: ${inputErrors.join('; ')}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ds3857: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dsBuf: any;

    try {
        // Step 2: reproject WGS84 → EPSG:3857 (unit: metres).
        // -nln forces the layer name inside the output GeoJSON to 'spatialbuf_3857'
        // so the SQLite table name in step 3 matches the SQL query.
        const reproj3857Path = await gdal.ogr2ogr(inputDataset, [
            '-f', 'GeoJSON',
            '-t_srs', 'EPSG:3857',
            '-nln', 'spatialbuf_3857',
        ], 'spatialbuf_3857');

        // Step 3: buffer in metres using SpatiaLite ST_Buffer.
        // Must reopen as Dataset — ogr2ogr rejects raw path strings.
        ds3857 = await openDataset(gdal, reproj3857Path.local);
        const sql = `SELECT ST_Buffer(geometry, ${distanceMeters}, ${segments}) AS geometry FROM "spatialbuf_3857"`;
        const bufferedPath = await gdal.ogr2ogr(ds3857, [
            '-f', 'GeoJSON',
            '-dialect', 'SQLITE',
            '-sql', sql,
        ], 'spatialbuf_buffered');

        // Step 4: reproject EPSG:3857 → WGS84
        dsBuf = await openDataset(gdal, bufferedPath.local);
        const outputPath = await gdal.ogr2ogr(dsBuf, [
            '-f', 'GeoJSON',
            '-t_srs', 'EPSG:4326',
        ], 'spatialbuf_output');

        return filePathToFeatureCollection(gdal, outputPath);
    } finally {
        if (dsBuf) await gdal.close(dsBuf);
        if (ds3857) await gdal.close(ds3857);
        await gdal.close(inputDataset);
    }
}

// ─── Message handler ─────────────────────────────────────────────────────────

function reply(msg: SpatialResponse): void {
    (self as unknown as Worker).postMessage(msg);
}

self.onmessage = async (e: MessageEvent<SpatialRequest>) => {
    const { opId, operation } = e.data;

    if (operation.op === 'ping') {
        reply({ opId, status: 'ready' });
        return;
    }

    try {
        const gdal = await getGdal();
        let result: GeoJSON.FeatureCollection;

        switch (operation.op) {
            case 'buffer':
                result = await buffer(gdal, operation.input, operation.distanceMeters, operation.segments);
                break;
            default:
                throw new Error(`Unknown spatial operation: ${(operation as SpatialOp).op}`);
        }

        reply({ opId, status: 'ok', result });
    } catch (err) {
        reply({
            opId,
            status: 'error',
            message: err instanceof Error ? err.message : String(err),
        });
    }
};
