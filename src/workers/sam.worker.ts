/**
 * Segment Anything worker: downloads and caches a model, encodes a map image,
 * and answers prompts against it.
 *
 * Encoding takes from half a second (SAM 2 on WebGPU) to tens of seconds (on
 * the CPU), so it has to be off the main thread; and the embedding it produces
 * is tens of megabytes of tensors, so it stays here and only prompts and
 * outlines cross the boundary. The inference itself is `sam-runner.ts`.
 *
 * Model files are kept in the Cache API under their url, so a model is
 * downloaded once per browser and switching back to one costs nothing. The
 * worker is created on first use (the panel opening), so a visitor who never
 * opens the segment tool fetches neither ONNX Runtime's 27 MB of wasm nor a model.
 */

import * as ort from 'onnxruntime-web/webgpu';
import ortWasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm?url';
import {
    createSamSessions, encodeImage, outlineMask, runDecoder,
    type ModelBytes, type SamEmbedding, type SamMasks, type SamOutlineOptions, type SamPrompt, type SamSessions,
} from './sam-runner';
import type { ResolvedSamModel } from '../utils/sam/sam-models';

// Vite emits the wasm as a hashed asset; ORT's own guess (beside its module)
// is wrong both in dev, where dependencies are pre-bundled, and in the library build.
ort.env.wasm.wasmPaths = { wasm: new URL(ortWasmUrl, self.location.href).href };

const CACHE_NAME = 'webmapx-sam-models-v1';

export interface SamCapabilities {
    webgpu: boolean;
    /** WebGPU adapter supports half precision, so the fp16 variants can run. */
    fp16: boolean;
}

export type SamWorkerRequest =
    | { id: number; op: 'probe' }
    | { id: number; op: 'cached'; urls: string[] }
    | { id: number; op: 'load'; model: ResolvedSamModel; backend: 'webgpu' | 'wasm' }
    | { id: number; op: 'encode'; image: ImageBitmap }
    | { id: number; op: 'decode'; prompt: SamPrompt; outline: SamOutlineOptions }
    | { id: number; op: 'outline'; outline: SamOutlineOptions };

export type SamWorkerResponse =
    | { id: number; status: 'ok'; result: unknown }
    | { id: number; status: 'progress'; loaded: number; total: number }
    | { id: number; status: 'error'; message: string };

let sessions: SamSessions | null = null;
let loadedModelId: string | null = null;
let embedding: SamEmbedding | null = null;
/** The last decoder answer, so granularity and threshold can change without rerunning it. */
let masks: SamMasks | null = null;

function post(msg: SamWorkerResponse): void {
    (self as unknown as Worker).postMessage(msg);
}

async function probe(): Promise<SamCapabilities> {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<{ features: Set<string> } | null> } }).gpu;
    if (!gpu) return { webgpu: false, fp16: false };
    try {
        const adapter = await gpu.requestAdapter();
        return { webgpu: !!adapter, fp16: !!adapter?.features.has('shader-f16') };
    } catch {
        return { webgpu: false, fp16: false };
    }
}

async function openCache(): Promise<Cache | null> {
    try {
        return await caches.open(CACHE_NAME);
    } catch {
        return null; // not a secure context, or storage blocked: download every time
    }
}

async function isCached(urls: string[]): Promise<boolean> {
    const cache = await openCache();
    if (!cache) return false;
    for (const url of urls) {
        const hit = await cache.match(url);
        if (!hit) return false;
        // Peek, do not read: a real encoder is hundreds of megabytes.
        const reader = hit.body?.getReader();
        const first = reader ? (await reader.read()).value : undefined;
        await reader?.cancel();
        if (!first || looksLikeWebPage(first, hit.headers.get('content-type'))) {
            await cache.delete(url);
            return false;
        }
    }
    return true;
}

/**
 * A missing file is not always a 404. A single-page server — the Vite dev
 * server, most static hosts with a fallback — answers any unknown path with
 * its index.html and status 200, and ONNX Runtime then reports that page as
 * "protobuf parsing failed", nowhere near the cause. An ONNX file is binary
 * protobuf and never starts with `<`.
 */
function looksLikeWebPage(data: Uint8Array, contentType: string | null): boolean {
    if (contentType?.includes('text/html')) return true;
    let i = 0;
    while (i < data.length && i < 64 && (data[i] === 0x20 || data[i] === 0x0a || data[i] === 0x0d || data[i] === 0x09)) i++;
    return data[i] === 0x3c; // '<'
}

function notAModelError(url: string): Error {
    return new Error(`Model file not found: ${url} — the server answered with a web page. `
        + 'Download the model there (npm run models:sam), or set tools.segment.modelBaseUrl '
        + 'to https://huggingface.co/{repo}/resolve/main/.');
}

async function fetchFile(url: string, cache: Cache | null, onBytes: (n: number) => void): Promise<Uint8Array> {
    const hit = await cache?.match(url);
    if (hit) {
        const data = new Uint8Array(await hit.arrayBuffer());
        if (!looksLikeWebPage(data, hit.headers.get('content-type'))) {
            onBytes(data.byteLength);
            return data;
        }
        // Cached by an earlier version that did not check; fetch it again.
        await cache?.delete(url);
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not download ${url}: ${response.status} ${response.statusText}`);
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/html')) throw notAModelError(url);
    let data: Uint8Array;
    if (response.body) {
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let size = 0;
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            size += value.byteLength;
            onBytes(value.byteLength);
        }
        data = new Uint8Array(size);
        let offset = 0;
        for (const c of chunks) { data.set(c, offset); offset += c.byteLength; }
    } else {
        data = new Uint8Array(await response.arrayBuffer());
        onBytes(data.byteLength);
    }
    if (looksLikeWebPage(data, contentType)) throw notAModelError(url);
    try {
        await cache?.put(url, new Response(data as Uint8Array<ArrayBuffer>, {
            headers: { 'content-type': 'application/octet-stream' },
        }));
    } catch (err) {
        // Out of quota is not a reason to fail: the model works, it just is not kept.
        console.warn('[segment] model file not cached:', url, err);
    }
    return data;
}

async function load(id: number, model: ResolvedSamModel, backend: 'webgpu' | 'wasm'): Promise<{ backend: string }> {
    const key = `${model.id}@${backend}`;
    if (sessions && loadedModelId === key) return { backend };

    const cache = await openCache();
    const total = model.sizeMB * 1e6;
    let loaded = 0;
    let lastPost = 0;
    const onBytes = (n: number) => {
        loaded += n;
        const now = performance.now();
        if (now - lastPost > 100) {
            lastPost = now;
            post({ id, status: 'progress', loaded, total: Math.max(total, loaded) });
        }
    };
    const bytes = async (urls: string[]): Promise<ModelBytes> => ({
        files: await Promise.all(urls.map(async url => ({
            name: decodeURIComponent(new URL(url).pathname.split('/').pop() ?? ''),
            data: await fetchFile(url, cache, onBytes),
        }))),
    });
    const encoderBytes = await bytes(model.encoder);
    const decoderBytes = await bytes(model.decoder);
    post({ id, status: 'progress', loaded: total, total });

    await release();
    try {
        sessions = await createSamSessions(
            ort, model.family, encoderBytes, decoderBytes,
            backend === 'webgpu' ? ['webgpu', 'wasm'] : ['wasm'],
        );
    } catch (err) {
        // Whatever is cached for this model did not build; do not serve it again.
        await Promise.all([...model.encoder, ...model.decoder].map(url => cache?.delete(url)));
        throw err;
    }
    loadedModelId = key;
    return { backend };
}

async function release(): Promise<void> {
    embedding = null;
    masks = null;
    if (!sessions) return;
    const old = sessions;
    sessions = null;
    loadedModelId = null;
    await Promise.allSettled([old.encoder.release(), old.decoder.release()]);
}

async function encode(image: ImageBitmap): Promise<{ ms: number }> {
    if (!sessions) throw new Error('No model loaded.');
    const t0 = performance.now();
    const canvas = new OffscreenCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2D canvas in this worker.');
    ctx.drawImage(image, 0, 0);
    image.close();
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    embedding = null;
    masks = null;
    embedding = await encodeImage(ort, sessions, pixels);
    return { ms: Math.round(performance.now() - t0) };
}

async function decode(prompt: SamPrompt, options: SamOutlineOptions) {
    if (!sessions || !embedding) throw new Error('No image encoded.');
    masks = await runDecoder(ort, sessions, embedding, prompt);
    return outlineMask(masks, options);
}

function outline(options: SamOutlineOptions) {
    if (!masks) throw new Error('Nothing decoded yet.');
    return outlineMask(masks, options);
}

self.onmessage = async (e: MessageEvent<SamWorkerRequest>) => {
    const msg = e.data;
    try {
        let result: unknown;
        switch (msg.op) {
            case 'probe': result = await probe(); break;
            case 'cached': result = await isCached(msg.urls); break;
            case 'load': result = await load(msg.id, msg.model, msg.backend); break;
            case 'encode': result = await encode(msg.image); break;
            case 'decode': result = await decode(msg.prompt, msg.outline); break;
            case 'outline': result = outline(msg.outline); break;
        }
        post({ id: msg.id, status: 'ok', result });
    } catch (err) {
        post({ id: msg.id, status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
};
