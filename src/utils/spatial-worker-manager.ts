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

import type { SpatialOp, SpatialRequest, SpatialResponse } from '../workers/spatial.worker';

type PendingOp = {
    resolve: (fc: GeoJSON.FeatureCollection) => void;
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
        } else {
            op.reject(new Error(msg.message ?? 'Spatial operation failed'));
        }
    };

    w.onerror = (e: ErrorEvent) => {
        // Worker crashed — reject all pending ops and reset so next call recreates it
        const err = new Error(e.message ?? 'Spatial worker crashed');
        for (const op of pending.values()) op.reject(err);
        pending.clear();
        worker = null;
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
