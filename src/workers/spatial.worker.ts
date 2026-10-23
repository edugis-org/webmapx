/**
 * Spatial analysis web worker — singleton, shared across all spatial tools.
 *
 * Uses gdal3.js (GDAL compiled to WASM) as the computation engine.
 * GDAL is lazy-loaded on first operation; subsequent ops reuse the same instance.
 *
 * Protocol: every message in/out carries an opId so the manager can route
 * responses back to the correct caller even if multiple ops are in flight.
 *
 * The buffer pipeline itself lives in `buffer-runner.ts`.
 */

import initGdalJs from 'gdal3.js';
import { runGeoprocess, type GdalLike, type GeoprocessRequest } from './geoprocessing-runner';
import { bufferFeatures } from './buffer-runner';
import { parseGdalGeoJSON } from '../utils/geojson-crs';
import wasmUrl from 'gdal3.js/dist/package/gdal3WebAssembly.wasm?url';
import dataUrl from 'gdal3.js/dist/package/gdal3WebAssembly.data?url';
import workerJsUrl from 'gdal3.js/dist/package/gdal3.js?url';
// The diffusion cartogram's WASM. Imported for its address only — the module
// itself is loaded lazily, inside `cartogram()`, so a session that never builds
// one never fetches it.
import goCartWasmUrl from 'go-cart-wasm/dist/cart.wasm?url';

// ─── Message types (re-exported so the manager can import them) ───────────────

export interface GpkgLayerInfo {
    name: string;
    featureCount: number;
}

export type SpatialOp =
    | { op: 'buffer'; distanceMeters: number; segments?: number; input: GeoJSON.FeatureCollection; centerLat?: number }
    | ({ op: 'geoprocess' } & GeoprocessRequest)
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
    | { opId: string; status: 'progress'; message: string }
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

async function filePathToFeatureCollection(gdal: GdalInstance, filePath: string | { local: string; real: string }): Promise<GeoJSON.FeatureCollection> {
    const bytes = await gdal.getFileBytes(filePath as string | Parameters<GdalInstance['getFileBytes']>[0]);
    const text = new TextDecoder().decode(bytes);
    // Not a plain JSON.parse: GDAL writes a legacy `crs` member that stops the
    // layer being added to a map in any projection but Web Mercator. See
    // `utils/geojson-crs.ts`.
    return parseGdalGeoJSON(text);
}

// ─── Operations ──────────────────────────────────────────────────────────────

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

/** How often a running operation may report progress. */
const PROGRESS_INTERVAL_MS = 250;

/**
 * Lets a call through at most once per interval, dropping the rest.
 *
 * Leading-edge on purpose: the first callback arrives the moment the solver
 * starts, so the status line changes as soon as there is anything to say rather
 * than a quarter-second into a two-minute wait. Nothing is queued — a dropped
 * progress message is one the next one supersedes.
 */
function throttle<T extends unknown[]>(fn: (...args: T) => void, intervalMs: number): (...args: T) => void {
    let last = 0;
    return (...args: T) => {
        const now = Date.now();
        if (now - last < intervalMs) return;
        last = now;
        fn(...args);
    };
}

self.onmessage = async (e: MessageEvent<SpatialRequest>) => {
    const { opId, operation } = e.data;

    if (operation.op === 'ping') {
        // Answer first: the caller only wants to know the worker is alive.
        reply({ opId, status: 'ready' });
        // Then start loading GDAL, which is the whole point of a prewarm. The
        // wasm is ~27 MB and takes seconds to fetch and instantiate; a ping that
        // merely replied left that cost to the first real operation, i.e. to the
        // moment the user presses Calculate — exactly the wait prewarming was
        // meant to hide behind reading and filling in the form.
        // Failures are ignored here: an operation that needs GDAL reports them.
        void getGdal().catch(() => undefined);
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
                result = await bufferFeatures(gdal as unknown as GdalLike, operation.input, operation.distanceMeters, operation.segments, operation.centerLat);
                break;
            case 'geoprocess':
                result = await runGeoprocess(gdal as unknown as GdalLike, operation, {
                    goCartWasmUrl,
                    // Throttled, because the flow calls back on every iteration
                    // and there are hundreds of them: a postMessage each would
                    // cost more than the solver and flood the panel with renders
                    // nobody can read. A quarter-second is faster than the eye
                    // needs and slow enough to be free.
                    onProgress: throttle(message => reply({ opId, status: 'progress', message }), PROGRESS_INTERVAL_MS),
                });
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
            message: errorMessage(err),
        });
    }
};

/**
 * gdal3.js rejects with plain objects (`{ message }`, or an array of them),
 * not Errors — `String(err)` turned every GDAL failure into "[object Object]".
 */
function errorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (Array.isArray(err)) return err.map(errorMessage).filter(Boolean).join('; ') || 'Spatial operation failed';
    if (err && typeof err === 'object') {
        const o = err as Record<string, unknown>;
        if (typeof o.message === 'string' && o.message) return o.message;
        if (Array.isArray(o.errors)) return errorMessage(o.errors);
        try { return JSON.stringify(err); } catch { /* fall through */ }
    }
    return String(err);
}
