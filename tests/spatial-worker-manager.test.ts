/**
 * Tests for spatial-worker-manager.ts — the singleton worker proxy used by
 * the buffer tool to run GDAL WASM operations.
 *
 * We replace the global Worker with a FakeWorker so no real worker is created.
 * The module uses module-level singletons; terminateSpatialWorker() resets them
 * between tests.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// ── Fake Worker ──────────────────────────────────────────────────────────────

type MessageHandler = (e: { data: unknown }) => void;
type ErrorHandler = (e: { message: string }) => void;

class FakeWorker {
    static instances: FakeWorker[] = [];

    onmessage: MessageHandler | null = null;
    onerror: ErrorHandler | null = null;
    posted: unknown[] = [];
    terminated = false;

    constructor(_url: unknown, _opts?: unknown) {
        FakeWorker.instances.push(this);
    }

    postMessage(msg: unknown) {
        this.posted.push(msg);
    }

    terminate() {
        this.terminated = true;
    }

    /** Simulate a successful response from the GDAL worker. */
    replyOk(opId: string, result: GeoJSON.FeatureCollection) {
        this.onmessage?.({ data: { opId, status: 'ok', result } });
    }

    /** Simulate an error response from the GDAL worker. */
    replyError(opId: string, message: string) {
        this.onmessage?.({ data: { opId, status: 'error', message } });
    }

    /** Simulate a worker crash (fires onerror). */
    crash(message = 'Worker crashed') {
        this.onerror?.({ message });
    }
}

// Patch Worker globally before importing the manager module.
(globalThis as Record<string, unknown>)['Worker'] = FakeWorker;

// Patch URL constructor to avoid file-system lookups (the manager does `new URL(...)`)
const OrigURL = globalThis.URL;
(globalThis as Record<string, unknown>)['URL'] = class FakeURL {
    href: string;
    constructor(path: string, _base?: string) { this.href = path; }
    toString() { return this.href; }
    static createObjectURL = OrigURL?.createObjectURL?.bind(OrigURL);
    static revokeObjectURL = OrigURL?.revokeObjectURL?.bind(OrigURL);
};

const { runSpatialOp, terminateSpatialWorker } = await import('../src/utils/spatial-worker-manager.js');

// ── Helpers ──────────────────────────────────────────────────────────────────

const emptyFC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

function latestWorker(): FakeWorker {
    return FakeWorker.instances[FakeWorker.instances.length - 1];
}

function setup() {
    FakeWorker.instances.length = 0;
    terminateSpatialWorker();
}

// ── Tests ────────────────────────────────────────────────────────────────────

test('runSpatialOp: resolves when worker replies ok', async () => {
    setup();

    const promise = runSpatialOp({ op: 'buffer', input: emptyFC, distanceMeters: 100, segments: 8 });
    const w = latestWorker();
    assert.ok(w, 'worker created');
    assert.equal(w.posted.length, 1);

    const req = w.posted[0] as { opId: string };
    w.replyOk(req.opId, emptyFC);

    const result = await promise;
    assert.equal(result.type, 'FeatureCollection');
});

test('runSpatialOp: rejects when worker replies error', async () => {
    setup();

    const promise = runSpatialOp({ op: 'buffer', input: emptyFC, distanceMeters: 100, segments: 8 });
    const w = latestWorker();
    const req = w.posted[0] as { opId: string };
    w.replyError(req.opId, 'GDAL failed');

    await assert.rejects(promise, (err: Error) => {
        assert.match(err.message, /GDAL failed/);
        return true;
    });
});

test('runSpatialOp: worker crash rejects in-flight op and resets worker', async () => {
    setup();

    const promise = runSpatialOp({ op: 'buffer', input: emptyFC, distanceMeters: 100, segments: 8 });
    const w = latestWorker();
    w.crash('out of memory');

    await assert.rejects(promise, (err: Error) => {
        assert.match(err.message, /out of memory/);
        return true;
    });

    // Next call must recreate the worker
    const promise2 = runSpatialOp({ op: 'buffer', input: emptyFC, distanceMeters: 100, segments: 8 });
    const w2 = latestWorker();
    assert.notEqual(w2, w, 'new worker instance created after crash');

    const req2 = w2.posted[0] as { opId: string };
    w2.replyOk(req2.opId, emptyFC);
    await promise2;
});

test('runSpatialOp: multiple concurrent ops each resolve independently', async () => {
    setup();

    const p1 = runSpatialOp({ op: 'buffer', input: emptyFC, distanceMeters: 100, segments: 8 });
    const p2 = runSpatialOp({ op: 'buffer', input: emptyFC, distanceMeters: 200, segments: 16 });
    const w = latestWorker();

    const [req1, req2] = w.posted as Array<{ opId: string }>;
    const result1: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { n: 1 } }] };
    w.replyOk(req2.opId, emptyFC);   // resolve second first
    w.replyOk(req1.opId, result1);   // then first

    const [r1, r2] = await Promise.all([p1, p2]);
    assert.equal(r1.features[0].properties?.n, 1);
    assert.equal(r2.features.length, 0);
});

test('terminateSpatialWorker: rejects pending ops', async () => {
    setup();

    const promise = runSpatialOp({ op: 'buffer', input: emptyFC, distanceMeters: 100, segments: 8 });
    terminateSpatialWorker();

    await assert.rejects(promise, (err: Error) => {
        assert.match(err.message, /terminated/);
        return true;
    });
});

test('terminateSpatialWorker: terminates the underlying Worker', () => {
    setup();

    runSpatialOp({ op: 'buffer', input: emptyFC, distanceMeters: 100, segments: 8 }).catch(() => {});
    const w = latestWorker();
    terminateSpatialWorker();

    assert.equal(w.terminated, true);
});
