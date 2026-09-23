/**
 * Main-thread side of the Segment Anything worker.
 *
 * One worker per page, created on first use and kept, since a loaded model is
 * expensive to rebuild. Requests are **serialised**: the worker's handlers are
 * async, so a decode sent while an encode is still awaiting would otherwise
 * run against the previous image's embedding — the outline of an object from
 * a view the user has already left.
 */

import type { SamOutlineOptions, SamPrompt, SamResult } from '../../workers/sam-runner';
import type { SamCapabilities, SamWorkerRequest, SamWorkerResponse } from '../../workers/sam.worker';
import type { ResolvedSamModel } from './sam-models';
import type { EverythingOptions, EverythingResult } from '../../workers/sam-everything';

type Pending = {
    resolve: (value: any) => void;
    reject: (err: Error) => void;
    onProgress?: (loaded: number, total: number) => void;
};

// Distributes Omit over the union, so each request keeps its own fields.
type WithoutId<T> = T extends unknown ? Omit<T, 'id'> : never;

/** The operation was cancelled by the user: a notice, not a failure. */
export class SamCancelledError extends Error {
    constructor() {
        super('Cancelled.');
        this.name = 'SamCancelledError';
    }
}

let worker: Worker | null = null;
const pending = new Map<number, Pending>();
let counter = 0;
let queue: Promise<unknown> = Promise.resolve();

function failAll(err: Error): void {
    for (const p of pending.values()) p.reject(err);
    pending.clear();
}

function getWorker(): Worker {
    if (worker) return worker;
    const w = new Worker(new URL('../../workers/sam.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<SamWorkerResponse>) => {
        const msg = e.data;
        const p = pending.get(msg.id);
        if (!p) return;
        if (msg.status === 'progress') {
            p.onProgress?.(msg.loaded, msg.total);
            return;
        }
        pending.delete(msg.id);
        if (msg.status === 'ok') p.resolve(msg.result);
        else p.reject(msg.cancelled ? new SamCancelledError() : new Error(msg.message));
    };
    w.onerror = (e: ErrorEvent) => {
        // Usually out of memory while building a large model's session.
        failAll(new Error(e.message || 'The segmentation worker crashed.'));
        worker = null;
    };
    worker = w;
    return w;
}

function request<T>(
    msg: WithoutId<SamWorkerRequest>,
    options: { transfer?: Transferable[]; onProgress?: Pending['onProgress'] } = {},
): Promise<T> {
    const run = () => new Promise<T>((resolve, reject) => {
        const id = ++counter;
        pending.set(id, { resolve, reject, onProgress: options.onProgress });
        getWorker().postMessage({ ...msg, id }, options.transfer ?? []);
    });
    const result = queue.then(run, run);
    queue = result.catch(() => undefined);
    return result;
}

export function probeSam(): Promise<SamCapabilities> {
    return request({ op: 'probe' });
}

export function isSamModelCached(model: ResolvedSamModel): Promise<boolean> {
    return request({ op: 'cached', urls: [...model.encoder, ...model.decoder] });
}

export function loadSamModel(
    model: ResolvedSamModel,
    backend: 'webgpu' | 'wasm',
    onProgress?: (loaded: number, total: number) => void,
): Promise<{ backend: string }> {
    return request({ op: 'load', model, backend }, { onProgress });
}

/** Encodes an image; the bitmap is transferred and unusable afterwards. */
export function encodeSamImage(image: ImageBitmap): Promise<{ ms: number }> {
    return request({ op: 'encode', image }, { transfer: [image] });
}

export function decodeSamPrompt(prompt: SamPrompt, outline: SamOutlineOptions = {}): Promise<SamResult> {
    return request({ op: 'decode', prompt, outline });
}

/** Re-outlines the last decoded masks — another granularity or threshold, no inference. */
export function outlineSamMasks(outline: SamOutlineOptions): Promise<SamResult> {
    return request({ op: 'outline', outline });
}

/** Segments the whole encoded view; `onProgress` counts prompts run. */
export function segmentEverythingSam(
    options: EverythingOptions & { k: number },
    onProgress?: (done: number, total: number) => void,
): Promise<EverythingResult> {
    return request({ op: 'everything', options }, { onProgress });
}

/** Regroups the last "segment everything" into `k` groups; no model run. */
export function regroupSam(k: number): Promise<number[]> {
    return request({ op: 'regroup', k });
}

/**
 * Stops a running "segment everything" at its next prompt. Sent straight to
 * the worker, not queued: queued, it would only arrive after the operation
 * it is meant to stop.
 */
export function cancelSam(): void {
    worker?.postMessage({ id: 0, op: 'cancel' });
}

/** Starts the worker and asks what the browser can run — the panel needs that before offering models. */
export function prewarmSam(): void {
    void probeSam().catch(() => undefined);
}
