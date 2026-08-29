/**
 * Singleton manager for the spatial web worker.
 *
 * The worker is created on first use and kept alive.
 * If it crashes, it is recreated on the next call.
 *
 * Usage:
 *   import { runSpatialOp } from '../utils/spatial-worker-manager';
 *
 *   const result = await runSpatialOp({
 *     op: 'buffer',
 *     input: featureCollection,
 *     distanceMeters: 500,
 *   });
 */

import type { GpkgLayerInfo, SpatialOp, SpatialRequest, SpatialResponse } from '../workers/spatial.worker';

type PendingOp = {
    resolve: (value: any) => void;
    reject: (err: Error) => void;
};

let worker: Worker | null = null;
const pending = new Map<string, PendingOp>();
let opCounter = 0;

function createWorker(): Worker {
    const w = new Worker(
        new URL('../workers/spatial.worker.ts', import.meta.url),
        { type: 'module' },
    );

    w.onmessage = (e: MessageEvent<SpatialResponse>) => {
        const msg = e.data;
        if (msg.status === 'ready') return; // ping/pong — no pending op to resolve

        const op = pending.get(msg.opId);
        if (!op) return;

        pending.delete(msg.opId);

        if (msg.status === 'ok') {
            op.resolve(msg.result);
        } else if (msg.status === 'inspected') {
            op.resolve({ sessionKey: msg.sessionKey, layers: msg.layers });
        } else if (msg.status === 'closed') {
            op.resolve(undefined);
        } else {
            op.reject(new Error(msg.message ?? 'Spatial operation failed'));
        }
    };

    w.onerror = (e: ErrorEvent) => {
        // Worker crashed — reject all pending ops and reset so next call recreates it
        const err = new Error(e.message || 'The spatial worker crashed. Try again with fewer features.');
        for (const op of pending.values()) op.reject(err);
        pending.clear();
        worker = null;
    };

    // A response that cannot be structured-cloned back (an enormous result, or a
    // value holding something uncloneable) fires this instead of onmessage. Left
    // unhandled it looks exactly like a hang: the caller waits forever.
    w.onmessageerror = () => {
        const err = new Error('The result could not be transferred from the worker — it may be too large.');
        for (const op of pending.values()) op.reject(err);
        pending.clear();
    };

    return w;
}

function getWorker(): Worker {
    if (!worker) worker = createWorker();
    return worker;
}

/**
 * Run a spatial operation in the shared worker.
 * GDAL WASM is loaded lazily on the first call (~3 s on first page load,
 * instant thereafter thanks to browser WASM compilation cache).
 */
export function runSpatialOp(operation: SpatialOp): Promise<GeoJSON.FeatureCollection> {
    const opId = `sop-${++opCounter}`;

    return new Promise<GeoJSON.FeatureCollection>((resolve, reject) => {
        pending.set(opId, { resolve, reject });
        try {
            getWorker().postMessage({ opId, operation } satisfies SpatialRequest);
        } catch (err) {
            pending.delete(opId);
            reject(err instanceof Error ? err : new Error(String(err)));
        }
    });
}

/**
 * Inspect a binary GIS file in the worker. Returns available layer names and
 * a sessionKey to use for subsequent convertFileLayer / closeFile calls.
 * The file is kept open in the worker until closeFile is called.
 */
export function runInspectFile(data: ArrayBuffer, filename: string): Promise<{ sessionKey: string; layers: GpkgLayerInfo[] }> {
    const opId = `sop-${++opCounter}`;

    return new Promise((resolve, reject) => {
        pending.set(opId, { resolve, reject });
        try {
            getWorker().postMessage(
                { opId, operation: { op: 'inspectFile', data, filename } } satisfies SpatialRequest,
                [data],
            );
        } catch (err) {
            pending.delete(opId);
            reject(err instanceof Error ? err : new Error(String(err)));
        }
    });
}

/** Convert one layer from an open file session (obtained via runInspectFile) to GeoJSON. */
export function runConvertFileLayer(
    sessionKey: string,
    layerName: string,
): Promise<GeoJSON.FeatureCollection> {
    const opId = `sop-${++opCounter}`;

    return new Promise<GeoJSON.FeatureCollection>((resolve, reject) => {
        pending.set(opId, { resolve, reject });
        try {
            getWorker().postMessage(
                { opId, operation: { op: 'convertFileLayer', sessionKey, layerName } } satisfies SpatialRequest,
            );
        } catch (err) {
            pending.delete(opId);
            reject(err instanceof Error ? err : new Error(String(err)));
        }
    });
}

/** Close a file session opened by runInspectFile, freeing worker memory. */
export function runCloseFile(sessionKey: string): void {
    const opId = `sop-${++opCounter}`;
    pending.set(opId, { resolve: () => {}, reject: () => {} });
    try {
        getWorker().postMessage(
            { opId, operation: { op: 'closeFile', sessionKey } } satisfies SpatialRequest,
        );
    } catch { /* best-effort cleanup */ }
}

/**
 * Convert a binary GIS file (e.g. GeoPackage) to a GeoJSON FeatureCollection
 * via GDAL in the shared worker. Reprojects to EPSG:4326.
 */
export function runConvertToGeoJSON(data: ArrayBuffer, filename: string): Promise<GeoJSON.FeatureCollection> {
    const opId = `sop-${++opCounter}`;

    return new Promise<GeoJSON.FeatureCollection>((resolve, reject) => {
        pending.set(opId, { resolve, reject });
        try {
            getWorker().postMessage(
                { opId, operation: { op: 'convertToGeoJSON', data, filename } } satisfies SpatialRequest,
                [data],
            );
        } catch (err) {
            pending.delete(opId);
            reject(err instanceof Error ? err : new Error(String(err)));
        }
    });
}

/**
 * Pre-warm: trigger GDAL WASM load in the background so the first real
 * operation feels instant. Call this once when the app starts.
 */
export function prewarmSpatialWorker(): void {
    const opId = `sop-${++opCounter}`;
    // 'ping' resolves immediately with status:'ready'; no pending promise needed
    getWorker().postMessage({ opId, operation: { op: 'ping' } } satisfies SpatialRequest);
}

/**
 * Terminate the worker (e.g. when the map is destroyed).
 * Rejects any in-flight operations.
 */
export function terminateSpatialWorker(): void {
    if (!worker) return;
    const err = new Error('Spatial worker terminated');
    for (const op of pending.values()) op.reject(err);
    pending.clear();
    worker.terminate();
    worker = null;
}

/** Thrown into pending operations by `cancelSpatialOps` — not a failure. */
export class SpatialOperationCancelled extends Error {
    constructor() {
        super('Calculation cancelled');
        this.name = 'SpatialOperationCancelled';
    }
}

/**
 * Abort everything currently running.
 *
 * Terminating the worker is the only way to stop work that has already reached
 * GDAL: the WASM module runs a single synchronous call that ignores further
 * messages, so there is nothing to politely ask. The next operation recreates
 * the worker and reloads GDAL (~3 s), which is the price of being able to escape
 * a computation that would otherwise freeze the panel indefinitely.
 *
 * The worker is shared, so this also cancels unrelated spatial work (a file
 * import, say). Callers should therefore only cancel on an explicit user action.
 *
 * @returns the number of operations that were cancelled.
 */
export function cancelSpatialOps(): number {
    const count = pending.size;
    if (!count) return 0;

    const err = new SpatialOperationCancelled();
    for (const op of pending.values()) op.reject(err);
    pending.clear();
    worker?.terminate();
    worker = null;
    return count;
}
