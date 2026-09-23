/**
 * Segment Anything pipeline tests.
 *
 * The geometry half (logits → polygons) runs always. The inference half runs
 * the *real* ONNX models through onnxruntime-web's Node build — the same
 * runner code the browser worker uses — but the models are hundreds of
 * megabytes and not in the repository, so it runs only when they are found:
 * set `SAM_MODELS_DIR` to a directory laid out like HuggingFace
 * (`<dir>/Xenova/slimsam-77-uniform/onnx/...`), which is what
 * `npm run models:sam -- --out <dir>` produces. Without it those tests skip.
 *
 * The image is synthetic on purpose: a disc and a rectangle on a flat ground
 * have one right answer, so the assertion can be about area and position
 * rather than "it returned something".
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as ort from 'onnxruntime-web';

import {
    boxAsPoints, createSamSessions, decodeMask, encodeImage, inputFootprint, outlineMask, rankCandidates,
    runDecoder, type ModelBytes, type RgbaImage, type SamMasks, type SamResult,
} from '../src/workers/sam-runner';
import { maskToRings, ringArea, rewindPolygon, simplifyRing } from '../src/utils/sam/mask-to-polygon';
import { SAM_MODELS, type SamModelEntry } from '../src/utils/sam/sam-models';

// ─── Geometry ────────────────────────────────────────────────────────────────

function discLogits(size: number, cx: number, cy: number, r: number): Float32Array {
    const g = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // Signed distance, positive inside, like a logit that changes sign at the edge.
            g[y * size + x] = r - Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        }
    }
    return g;
}

test('maskToRings traces a disc at sub-cell accuracy', () => {
    const { polygons, coverage } = maskToRings(discLogits(64, 32, 32, 20), 64, 64, 64);
    assert.equal(polygons.length, 1);
    const area = Math.abs(ringArea(polygons[0][0]));
    assert.ok(Math.abs(area - Math.PI * 400) / (Math.PI * 400) < 0.02, `area ${area}`);
    assert.ok(Math.abs(coverage - Math.PI * 400 / 4096) < 0.01);
});

test('maskToRings keeps holes and drops speckle', () => {
    const g = discLogits(64, 32, 32, 20);
    const ring = discLogits(64, 32, 32, 8);
    for (let i = 0; i < g.length; i++) g[i] = Math.min(g[i], -ring[i]); // annulus
    g[2 * 64 + 60] = 1; // a single positive cell far away
    const { polygons } = maskToRings(g, 64, 64, 64);
    assert.equal(polygons.length, 1, 'the one-cell speck is not an object');
    assert.equal(polygons[0].length, 2, 'outer ring plus hole');
});

test('maskToRings only reads the columns and rows covering the image', () => {
    const g = new Float32Array(16 * 16).fill(-1);
    for (let y = 0; y < 16; y++) for (let x = 10; x < 16; x++) g[y * 16 + x] = 1; // positive only in "padding"
    assert.equal(maskToRings(g, 16, 8, 16).polygons.length, 0);
});

test('rewindPolygon gives RFC 7946 winding', () => {
    const cw: [number, number][] = [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]];
    const [outer, hole] = rewindPolygon([cw, [...cw].reverse()]);
    assert.ok(ringArea(outer) > 0, 'exterior counterclockwise');
    assert.ok(ringArea(hole) < 0, 'hole clockwise');
});

test('simplifyRing removes collinear points but keeps corners', () => {
    const ring: [number, number][] = [];
    for (let i = 0; i <= 10; i++) ring.push([i, 0]);
    for (let i = 1; i <= 10; i++) ring.push([10, i]);
    for (let i = 9; i >= 0; i--) ring.push([i, 10]);
    for (let i = 9; i >= 0; i--) ring.push([0, i]);
    const s = simplifyRing(ring, 0.3);
    assert.equal(s.length, 5);
    assert.equal(Math.abs(ringArea(s)), 100);
});

test('inputFootprint stretches for SAM 2 and keeps the aspect for SAM', () => {
    assert.deepEqual(inputFootprint('sam2', 800, 400), { w: 1024, h: 1024 });
    assert.deepEqual(inputFootprint('sam', 800, 400), { w: 1024, h: 512 });
});

test('boxAsPoints puts one positive inside and four negatives outside', () => {
    const pts = boxAsPoints({ x0: 10, y0: 20, x1: 110, y1: 70 });
    assert.equal(pts.filter(p => p.positive).length, 1);
    for (const p of pts.filter(q => !q.positive)) {
        assert.ok(p.x < 10 || p.x > 110);
        assert.ok(p.y < 20 || p.y > 70);
    }
});

// ─── Candidates and threshold ────────────────────────────────────────────────

/** Three candidate masks, deliberately *not* in size order: radii 8, 20, 14. */
function nestedCandidates(scores: number[]): SamMasks {
    const size = 64;
    const logits = new Float32Array(3 * size * size);
    [8, 20, 14].forEach((r, i) => logits.set(discLogits(size, 32, 32, r), i * size * size));
    return { logits, scores, maskW: size, maskH: size, cols: size, rows: size, cellX: 1, cellY: 1, empty: false };
}

test('candidates are named by the area they cover, not by output order', () => {
    const ranked = rankCandidates(nestedCandidates([0.9, 0.8, 0.7]));
    assert.deepEqual(ranked.map(c => [c.granularity, c.index]), [['whole', 1], ['part', 2], ['detail', 0]]);
});

test('outlineMask picks by granularity, or by score for auto', () => {
    const masks = nestedCandidates([0.7, 0.8, 0.95]);
    const area = (r: SamResult) => Math.abs(ringArea(r.polygons[0][0]));
    assert.ok(Math.abs(area(outlineMask(masks, { granularity: 'whole' })) - Math.PI * 400) < 20);
    assert.ok(Math.abs(area(outlineMask(masks, { granularity: 'detail' })) - Math.PI * 64) < 10);
    const auto = outlineMask(masks);
    assert.equal(auto.granularity, 'part', 'the best-scored candidate is the radius-14 one');
    assert.equal(auto.candidates.length, 3);
});

test('a lower threshold draws a looser outline, a higher one a tighter', () => {
    const masks = nestedCandidates([0.9, 0.9, 0.9]);
    const area = (threshold: number) =>
        Math.abs(ringArea(outlineMask(masks, { granularity: 'whole', threshold }).polygons[0][0]));
    // The fixture's logit is a signed distance, so a threshold of ±3 moves the edge 3 cells.
    assert.ok(Math.abs(area(-3) - Math.PI * 23 ** 2) / (Math.PI * 23 ** 2) < 0.02);
    assert.ok(Math.abs(area(3) - Math.PI * 17 ** 2) / (Math.PI * 17 ** 2) < 0.02);
});

test('an empty verdict outlines nothing at any granularity', () => {
    const masks = { ...nestedCandidates([0.9, 0.9, 0.9]), empty: true };
    assert.equal(outlineMask(masks, { granularity: 'whole' }).polygons.length, 0);
});

// ─── Inference with the real models ──────────────────────────────────────────

const MODELS_DIR = process.env.SAM_MODELS_DIR;

function loadBytes(entry: SamModelEntry, files: string[]): ModelBytes {
    return {
        files: files.map(f => ({
            name: path.basename(f),
            data: new Uint8Array(readFileSync(path.join(MODELS_DIR!, entry.repo, f))),
        })),
    };
}

function available(entry: SamModelEntry): boolean {
    if (!MODELS_DIR) return false;
    const { encoder, decoder } = entry.default.files;
    return [...encoder, ...decoder].every(f => existsSync(path.join(MODELS_DIR, entry.repo, f)));
}

const W = 640;
const H = 400;
const DISC = { cx: 200, cy: 200, r: 70 };
const RECT = { x0: 400, y0: 110, x1: 560, y1: 300 };

/** Grey ground with a red disc and a blue rectangle, plus mild noise so it is not unnaturally flat. */
function scene(): RgbaImage {
    const data = new Uint8ClampedArray(W * H * 4);
    let seed = 7;
    const noise = () => ((seed = (seed * 16807) % 2147483647) % 17) - 8;
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4;
            let rgb = [150, 150, 140];
            if (Math.hypot(x - DISC.cx, y - DISC.cy) <= DISC.r) rgb = [200, 40, 40];
            else if (x >= RECT.x0 && x < RECT.x1 && y >= RECT.y0 && y < RECT.y1) rgb = [40, 60, 200];
            data[i] = rgb[0] + noise();
            data[i + 1] = rgb[1] + noise();
            data[i + 2] = rgb[2] + noise();
            data[i + 3] = 255;
        }
    }
    return { data, width: W, height: H };
}

function totalArea(result: SamResult): number {
    return result.polygons.reduce((sum, [outer, ...holes]) =>
        sum + Math.abs(ringArea(outer)) - holes.reduce((s, h) => s + Math.abs(ringArea(h)), 0), 0);
}

function bbox(result: SamResult): [number, number, number, number] {
    const pts = result.polygons.flatMap(p => p[0]);
    return [
        Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])),
        Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1])),
    ];
}

for (const id of ['slimsam-77', 'sam2.1-tiny']) {
    const entry = SAM_MODELS.find(m => m.id === id)!;
    test(`${id}: a click on the disc outlines the disc, a box outlines the rectangle`, {
        skip: available(entry) ? false : 'set SAM_MODELS_DIR to run against the real model',
        timeout: 300_000,
    }, async () => {
        ort.env.wasm.numThreads = 1;
        // The test is bundled into a temp directory, away from the wasm that
        // ORT otherwise looks for beside itself.
        ort.env.wasm.wasmPaths = `${pathToFileURL(path.resolve('node_modules/onnxruntime-web/dist')).href}/`;
        const sessions = await createSamSessions(
            ort, entry.family,
            loadBytes(entry, entry.default.files.encoder),
            loadBytes(entry, entry.default.files.decoder),
            ['wasm'],
        );
        const embedding = await encodeImage(ort, sessions, scene());

        const disc = await decodeMask(ort, sessions, embedding, {
            points: [{ x: DISC.cx, y: DISC.cy, positive: true }],
        });
        const discArea = Math.PI * DISC.r ** 2;
        assert.ok(Math.abs(totalArea(disc) - discArea) / discArea < 0.15,
            `disc area ${totalArea(disc).toFixed(0)} vs ${discArea.toFixed(0)}`);
        const [dx0, , dx1] = bbox(disc);
        assert.ok(dx1 < RECT.x0, 'the disc mask does not reach the rectangle');
        assert.ok(Math.abs((dx0 + dx1) / 2 - DISC.cx) < 8, 'centred on the disc');

        const rect = await decodeMask(ort, sessions, embedding, {
            points: [],
            box: { x0: RECT.x0 - 10, y0: RECT.y0 - 10, x1: RECT.x1 + 10, y1: RECT.y1 + 10 },
        });
        const rectArea = (RECT.x1 - RECT.x0) * (RECT.y1 - RECT.y0);
        assert.ok(Math.abs(totalArea(rect) - rectArea) / rectArea < 0.15,
            `rectangle area ${totalArea(rect).toFixed(0)} vs ${rectArea}`);
        // Candidates on a real mask: whole ⊇ part ⊇ detail by area, and the
        // threshold moves the edge the way the slider says.
        const masks = await runDecoder(ort, sessions, embedding, { points: [{ x: DISC.cx, y: DISC.cy, positive: true }] });
        const [whole, part, detail] = rankCandidates(masks).map(c => c.coverage);
        assert.ok(whole >= part && part >= detail, `coverage ${whole} ≥ ${part} ≥ ${detail}`);
        const looser = totalArea(outlineMask(masks, { granularity: 'whole', threshold: -2 }));
        const tighter = totalArea(outlineMask(masks, { granularity: 'whole', threshold: 2 }));
        assert.ok(looser > tighter, `looser ${looser.toFixed(0)} > tighter ${tighter.toFixed(0)}`);

        const [rx0, ry0, rx1, ry1] = bbox(rect);
        assert.ok(Math.abs(rx0 - RECT.x0) < 8 && Math.abs(rx1 - RECT.x1) < 8
            && Math.abs(ry0 - RECT.y0) < 8 && Math.abs(ry1 - RECT.y1) < 8,
        `rectangle outline ${[rx0, ry0, rx1, ry1].map(Math.round)} in image pixels`);
    });
}
