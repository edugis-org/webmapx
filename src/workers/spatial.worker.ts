/**
 * Spatial analysis web worker — singleton, shared across all spatial tools.
 *
 * Uses gdal3.js (GDAL compiled to WASM) as the computation engine.
 * GDAL is lazy-loaded on first operation; subsequent ops reuse the same instance.
 *
 * Protocol: every message in/out carries an opId so the manager can route
 * responses back to the correct caller even if multiple ops are in flight.
 *
 * Buffer strategy:
 *   1. ogr2ogr WGS84 → EPSG:3857 (Web Mercator, metric, conformal)
 *   2. ST_Buffer in metres via SQLite spatial dialect
 *   3. ogr2ogr EPSG:3857 → WGS84
 *   EPSG:3857 is conformal so circles in metre-space are circles in reality.
 *   Clip to ±84° to avoid polar PROJ errors.
 */

import initGdalJs from 'gdal3.js';
import wasmUrl from 'gdal3.js/dist/package/gdal3WebAssembly.wasm?url';
import dataUrl from 'gdal3.js/dist/package/gdal3WebAssembly.data?url';
import workerJsUrl from 'gdal3.js/dist/package/gdal3.js?url';

// ─── Message types (re-exported so the manager can import them) ───────────────

export type SpatialOp =
    | { op: 'buffer'; distanceMeters: number; segments?: number; input: GeoJSON.FeatureCollection; centerLat?: number }
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
    centerLat: number = 0,
): Promise<GeoJSON.FeatureCollection> {
    // EPSG:3857 unit = meters at equator, scaled by 1/cos(lat) elsewhere.
    // Divide by cos(lat) so ST_Buffer in 3857-space produces correct real-world size.
    const scale = Math.cos(centerLat * Math.PI / 180);
    const dist3857 = distanceMeters / (scale || 1);

    const inputFile = await featureCollectionToFile(input, 'spatialinput');
    const { datasets: inputDatasets, errors: inputErrors } = await gdal.open(inputFile);
    const inputDataset = inputDatasets[0];
    if (!inputDataset) throw new Error(`Failed to open input: ${inputErrors.join('; ')}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ds3857: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dsBuf: any;

    try {
        const reproj3857Path = await gdal.ogr2ogr(inputDataset, [
            '-f', 'GeoJSON',
            '-t_srs', 'EPSG:3857',
            '-clipsrc', '-180', '-84', '180', '84',
            '-makevalid',
            '-skipfailures',
            '-nln', 'spatialbuf_3857',
        ], 'spatialbuf_3857');

        ds3857 = await openDataset(gdal, reproj3857Path.local);
        const sql = `SELECT ST_Buffer(ST_MakeValid(geometry), ${dist3857}, ${segments}) AS geometry FROM "spatialbuf_3857"`;
        const bufferedPath = await gdal.ogr2ogr(ds3857, [
            '-f', 'GeoJSON',
            '-dialect', 'SQLITE',
            '-sql', sql,
            '-skipfailures',
        ], 'spatialbuf_buf');

        dsBuf = await openDataset(gdal, bufferedPath.local);
        const outputPath = await gdal.ogr2ogr(dsBuf, [
            '-f', 'GeoJSON',
            '-t_srs', 'EPSG:4326',
            '-wrapdateline',
            '-skipfailures',
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
                result = await buffer(gdal, operation.input, operation.distanceMeters, operation.segments, operation.centerLat);
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
