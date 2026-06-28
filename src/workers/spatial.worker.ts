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

export interface GpkgLayerInfo {
    name: string;
    featureCount: number;
}

export type SpatialOp =
    | { op: 'buffer'; distanceMeters: number; segments?: number; input: GeoJSON.FeatureCollection; centerLat?: number }
    | { op: 'convertToGeoJSON'; data: ArrayBuffer; filename: string }
    | { op: 'inspectFile'; data: ArrayBuffer; filename: string }
    | { op: 'convertFileLayer'; sessionKey: string; layerName: string }
    | { op: 'closeFile'; sessionKey: string }
    | { op: 'ping' };

export interface SpatialRequest {
    opId: string;
    operation: SpatialOp;
}

export type SpatialResponse =
    | { opId: string; status: 'ok'; result: GeoJSON.FeatureCollection }
    | { opId: string; status: 'inspected'; sessionKey: string; layers: GpkgLayerInfo[] }
    | { opId: string; status: 'closed' }
    | { opId: string; status: 'error'; message: string }
    | { opId: string; status: 'ready' };

// ─── GDAL singleton ───────────────────────────────────────────────────────────

type GdalInstance = Awaited<ReturnType<typeof initGdalJs>>;

let gdalInstance: GdalInstance | null = null;
let gdalLoading: Promise<GdalInstance> | null = null;

function handleOutput(stream: 'stdout' | 'stderr', text: string): void {
    if (stream === 'stderr') console.warn('[gdal]', text);
}

function getGdal(): Promise<GdalInstance> {
    if (gdalInstance) return Promise.resolve(gdalInstance);
    if (gdalLoading) return gdalLoading;

    gdalLoading = initGdalJs({
        paths: {
            wasm: wasmUrl,
            data: dataUrl,
            js: workerJsUrl,
        },
        // We are already inside a Web Worker, so disable gdal3.js's own inner
        // WorkerWrapper. Without this, initGdalJs tries to postMessage the config
        // (including errorHandler) to a nested worker, which fails because functions
        // can't be structured-cloned. Running WASM directly here is equivalent.
        useWorker: false,
        logHandler: (text: string) => handleOutput('stdout', text),
        errorHandler: (text: string) => handleOutput('stderr', text),
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

        const result = await filePathToFeatureCollection(gdal, outputPath);
        result.features.forEach((f, i) => {
            if (input.features[i]?.properties) {
                f.properties = { ...input.features[i].properties, ...(f.properties ?? {}) };
            }
        });
        return result;
    } finally {
        if (dsBuf) await gdal.close(dsBuf);
        if (ds3857) await gdal.close(ds3857);
        await gdal.close(inputDataset);
    }
}

async function convertToGeoJSON(
    gdal: GdalInstance,
    data: ArrayBuffer,
    filename: string,
): Promise<GeoJSON.FeatureCollection> {
    const gdalName = filename.split('/').pop()!;
    const inputFile = new File([data], gdalName);
    const { datasets, errors } = await gdal.open(inputFile);
    const inputDs = datasets[0];
    if (!inputDs) throw new Error(`GDAL could not open "${filename}": ${errors.join('; ')}`);

    const isGml = /\.gml$/i.test(gdalName);
    const detectedSrs = isGml ? detectGmlSrs(data) : null;
    const sSrsArgs: string[] = detectedSrs ? ['-s_srs', detectedSrs] : [];

    try {
        const outputPath = await gdal.ogr2ogr(inputDs, [
            '--config', 'OGR_ENABLE_PARTIAL_REPROJECTION', 'YES',
            '-f', 'GeoJSON',
            ...sSrsArgs,
            '-t_srs', 'EPSG:4326',
            '-makevalid',
            '-skipfailures',
        ], 'converted_output');
        const fc = await filePathToFeatureCollection(gdal, outputPath);
        console.log(`[convertToGeoJSON] "${filename}" → ${fc.features.length} features`);
        return fc;
    } finally {
        await gdal.close(inputDs);
    }
}

// ─── GML source CRS detection ────────────────────────────────────────────────

function parseSrsName(srsName: string): string | null {
    // bare number: "28992"
    const bare = srsName.match(/^(\d{4,6})$/);
    if (bare) return `EPSG:${bare[1]}`;
    // EPSG:28992
    const epsg = srsName.match(/^EPSG:(\d+)$/i);
    if (epsg) return `EPSG:${epsg[1]}`;
    // urn:ogc:def:crs:EPSG::28992  or  urn:ogc:def:crs:EPSG:6.6:28992
    const urn = srsName.match(/urn:ogc:def:crs:EPSG[^:]*::?(\d+)/i);
    if (urn) return `EPSG:${urn[1]}`;
    // http://www.opengis.net/def/crs/EPSG/0/28992
    const url = srsName.match(/\/EPSG\/[^/]+\/(\d+)/i);
    if (url) return `EPSG:${url[1]}`;
    return null;
}

/** Scan the first 32 KB of a GML file for the first srsName attribute. */
function detectGmlSrs(data: ArrayBuffer): string | null {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(data.slice(0, 32768));
    const m = text.match(/srsName=["']([^"']+)["']/);
    return m ? parseSrsName(m[1]) : null;
}

// ─── Multi-layer file session store ──────────────────────────────────────────

// Sessions store the raw file data so each layer can be opened independently
// using GDAL's TABLE= open option — avoiding -sql which suppresses -progress.
const fileSessions = new Map<string, { data: ArrayBuffer; filename: string; totalLayers: number }>();
let sessionCounter = 0;

async function inspectFile(
    gdal: GdalInstance,
    data: ArrayBuffer,
    filename: string,
): Promise<{ sessionKey: string; layers: GpkgLayerInfo[] }> {
    // Strip path separators: gdal3.js WORKERFS mounts by file.name and can't create subdirs
    const gdalName = filename.split('/').pop()!;
    const inputFile = new File([data], gdalName);
    const { datasets, errors } = await gdal.open(inputFile);
    const dataset = datasets[0];
    if (!dataset) throw new Error(`GDAL could not open "${filename}": ${errors.join('; ')}`);

    const info = await gdal.getInfo(dataset);
    await gdal.close(dataset);

    // Filter QGIS/GPKG metadata tables that aren't real data layers
    const METADATA_TABLES = new Set(['layer_styles', 'layer_metadata', 'qgis_projects', 'qgis_3d_styles']);
    const layers: GpkgLayerInfo[] = (info.layers ?? [])
        .filter((l) => !METADATA_TABLES.has(l.name.toLowerCase()))
        .map((l) => ({ name: l.name, featureCount: l.featureCount }));

    console.log(`[inspectFile] "${filename}" → layers:`, layers.map(l => `${l.name}(${l.featureCount})`).join(', ') || '(none)');

    const sessionKey = `fs-${++sessionCounter}`;
    fileSessions.set(sessionKey, { data, filename: gdalName, totalLayers: layers.length });
    return { sessionKey, layers };
}

async function convertFileLayer(
    gdal: GdalInstance,
    sessionKey: string,
    layerName: string,
): Promise<GeoJSON.FeatureCollection> {
    const session = fileSessions.get(sessionKey);
    if (!session) throw new Error(`No open file session: ${sessionKey}`);

    // Safe output name: WASM FS path must not contain spaces or special chars
    const safeName = layerName.replace(/[^a-zA-Z0-9_-]/g, '_');

    const { datasets, errors } = await gdal.open(new File([session.data], session.filename));
    const ds = datasets[0];
    if (!ds) throw new Error(`GDAL could not open "${session.filename}": ${errors.join('; ')}`);

    // For GML: GDAL's driver may not find the source CRS when srsName appears
    // only on individual feature geometries (not the root element). Scan the
    // first 32 KB for any srsName and pass it as -s_srs explicitly.
    const isGml = /\.gml$/i.test(session.filename);
    const detectedSrs = isGml ? detectGmlSrs(session.data) : null;
    if (isGml) console.log(`[convertFileLayer] GML detected SRS: ${detectedSrs ?? '(none)'}`);

    const sSrsArgs: string[] = detectedSrs ? ['-s_srs', detectedSrs] : [];

    // Allow ballpark CRS transformations so PROJ doesn't silently drop features
    // when exact grid shift files (e.g. nl_rdnap for EPSG:28992) are absent in WASM.
    const commonArgs = [
        '--config', 'OGR_ENABLE_PARTIAL_REPROJECTION', 'YES',
        '-f', 'GeoJSON',
        ...sSrsArgs,
        '-t_srs', 'EPSG:4326',
        '-makevalid',
        '-skipfailures',
    ];

    try {
        let outputPath: string | { local: string; real: string };
        if (session.totalLayers <= 1) {
            outputPath = await gdal.ogr2ogr(ds, commonArgs, `converted_${safeName}`);
        } else {
            outputPath = await gdal.ogr2ogr(ds, [
                ...commonArgs,
                '-sql', `SELECT * FROM "${layerName.replace(/"/g, '""')}"`,
                '-dialect', 'OGRSQL',
                '-nln', safeName,
            ], `converted_${safeName}`);
        }
        const fc = await filePathToFeatureCollection(gdal, outputPath);
        console.log(`[convertFileLayer] "${layerName}" → ${fc.features.length} features`);
        return fc;
    } finally {
        await gdal.close(ds);
    }
}

function closeFile(sessionKey: string): void {
    fileSessions.delete(sessionKey);
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

        if (operation.op === 'inspectFile') {
            const { sessionKey, layers } = await inspectFile(gdal, operation.data, operation.filename);
            reply({ opId, status: 'inspected', sessionKey, layers });
            return;
        }
        if (operation.op === 'closeFile') {
            closeFile(operation.sessionKey);
            reply({ opId, status: 'closed' });
            return;
        }

        let result: GeoJSON.FeatureCollection;
        switch (operation.op) {
            case 'buffer':
                result = await buffer(gdal, operation.input, operation.distanceMeters, operation.segments, operation.centerLat);
                break;
            case 'convertToGeoJSON':
                result = await convertToGeoJSON(gdal, operation.data, operation.filename);
                break;
            case 'convertFileLayer':
                result = await convertFileLayer(gdal, operation.sessionKey, operation.layerName);
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
