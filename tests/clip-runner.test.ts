/**
 * Naming segments with CLIP.
 *
 * The pure parts always run. The model test runs the real Xenova CLIP through
 * onnxruntime-web's Node build when `SAM_MODELS_DIR` holds
 * `Xenova/clip-vit-base-patch32` (tokenizer.json, tokenizer_config.json and
 * the two `*_quantized.onnx` files), and skips otherwise. Its scene has one
 * right answer — a red disc and a blue square — so the assertion is which
 * word each region gets, not that some word came back.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as ort from 'onnxruntime-web';
import { Tokenizer } from '@huggingface/tokenizers';

import {
    classify, createClipSessions, embedSegment, embedTexts, padIds, regionTensor,
} from '../src/workers/clip-runner';

test('padIds pads to 77 with zeros and keeps the end token on overlong text', () => {
    const short = padIds([49406, 320, 49407]);
    assert.equal(short.length, 77);
    assert.deepEqual(short.slice(0, 4), [49406, 320, 49407, 0]);
    const long = padIds(Array.from({ length: 100 }, (_, i) => i + 1));
    assert.equal(long.length, 77);
    assert.equal(long[76], 49407);
});

test('classify picks the most similar label and reports its softmax probability', () => {
    const unit = (v: number[]) => { const n = Math.hypot(...v); return Float32Array.from(v.map(x => x / n)); };
    const labels = [unit([1, 0]), unit([0, 1])];
    const [a, b] = classify([unit([0.9, 0.1]), unit([0.2, 0.8])], labels);
    assert.equal(a.label, 0);
    assert.equal(b.label, 1);
    assert.ok(a.probability > 0.99, 'a logit scale of 100 makes a clear winner near-certain');
});

test('regionTensor blanks what lies outside the region to the mean, i.e. zero', () => {
    const w = 10, h = 10;
    const data = new Uint8ClampedArray(w * h * 4).fill(255);
    const t = regionTensor({ data, width: w, height: h }, [0, 0, 10, 10], x => x < 5);
    const plane = 224 * 224;
    assert.ok(t[0] > 1, 'left half is white');
    assert.equal(t[223], 0, 'right half is blanked');
    assert.equal(t.length, 3 * plane);
});

const MODELS_DIR = process.env.SAM_MODELS_DIR;
const CLIP_DIR = MODELS_DIR ? path.join(MODELS_DIR, 'Xenova/clip-vit-base-patch32') : '';
const available = !!MODELS_DIR && ['tokenizer.json', 'tokenizer_config.json', 'onnx/vision_model_quantized.onnx', 'onnx/text_model_quantized.onnx']
    .every(f => existsSync(path.join(CLIP_DIR, f)));

test('CLIP names a red disc and a blue square correctly', {
    skip: available ? false : 'set SAM_MODELS_DIR to run against the real model',
    timeout: 300_000,
}, async () => {
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.wasmPaths = `${pathToFileURL(path.resolve('node_modules/onnxruntime-web/dist')).href}/`;
    const sessions = await createClipSessions(ort,
        new Uint8Array(readFileSync(path.join(CLIP_DIR, 'onnx/vision_model_quantized.onnx'))),
        new Uint8Array(readFileSync(path.join(CLIP_DIR, 'onnx/text_model_quantized.onnx'))),
        ['wasm']);
    const tokenizer = new Tokenizer(
        JSON.parse(readFileSync(path.join(CLIP_DIR, 'tokenizer.json'), 'utf8')),
        JSON.parse(readFileSync(path.join(CLIP_DIR, 'tokenizer_config.json'), 'utf8')));

    const W = 400, H = 200;
    const data = new Uint8ClampedArray(W * H * 4);
    const inDisc = (x: number, y: number) => Math.hypot(x - 100, y - 100) < 70;
    const inSquare = (x: number, y: number) => x >= 230 && x < 370 && y >= 30 && y < 170;
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4;
            const rgb = inDisc(x, y) ? [220, 30, 30] : inSquare(x, y) ? [30, 50, 220] : [235, 235, 235];
            data.set([...rgb, 255], i);
        }
    }
    const image = { data, width: W, height: H };
    const regions = [
        await embedSegment(ort, sessions, image, [30, 30, 170, 170], inDisc),
        await embedSegment(ort, sessions, image, [230, 30, 370, 170], inSquare),
    ];
    const labels = ['a red circle', 'a blue square'];
    const texts = await embedTexts(ort, sessions, tokenizer, labels.map(l => `a picture of ${l}.`));
    const [disc, square] = classify(regions, texts);
    assert.equal(labels[disc.label], 'a red circle');
    assert.equal(labels[square.label], 'a blue square');
});
