/**
 * Where the segment tool fetches each model from.
 *
 * HuggingFace by default, so trying the tool needs no set-up; a mirror only for
 * a model that exists solely as our own export, or when the config names one.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    CLIP_MODELS, DEFAULT_MIRROR_BASE_URL, HUGGINGFACE_MODEL_BASE_URL, SAM_MODELS, modelBaseFor, resolveClipModel,
    resolveSamModel,
} from '../src/utils/sam/sam-models';
import { CLIP_SUGGESTION_VOCABULARY } from '../src/utils/sam/clip-vocabulary';

const slimsam = SAM_MODELS.find(m => m.id === 'slimsam-77')!;
const remoteclip = CLIP_MODELS.find(m => m.id === 'remoteclip')!;
const clip = CLIP_MODELS.find(m => m.id === 'clip')!;

test('a model HuggingFace hosts is fetched from HuggingFace by default', () => {
    assert.equal(modelBaseFor(slimsam, undefined), HUGGINGFACE_MODEL_BASE_URL);
    assert.equal(modelBaseFor(clip, undefined), HUGGINGFACE_MODEL_BASE_URL);
    const resolved = resolveSamModel(slimsam, modelBaseFor(slimsam, undefined), false);
    assert.equal(resolved.encoder[0],
        'https://huggingface.co/Xenova/slimsam-77-uniform/resolve/main/onnx/vision_encoder_quantized.onnx');
});

test('every SAM model is on HuggingFace', () => {
    assert.deepEqual(SAM_MODELS.filter(m => m.mirrorOnly).map(m => m.id), []);
});

test('a model only we export defaults to the config-relative mirror', () => {
    assert.equal(modelBaseFor(remoteclip, undefined), DEFAULT_MIRROR_BASE_URL);
    const resolved = resolveClipModel(remoteclip, modelBaseFor(remoteclip, undefined),
        p => new URL(p, 'https://example.org/config/demo.json').toString());
    assert.equal(resolved.vision,
        'https://example.org/config/models/webmapx/remoteclip-vit-b-32/onnx/vision_model_quantized.onnx');
});

test('a configured mirror serves every model', () => {
    const mirror = 'https://models.example.org/{repo}/';
    assert.equal(modelBaseFor(slimsam, mirror), mirror);
    assert.equal(modelBaseFor(remoteclip, mirror), mirror);
});

test('the suggestion vocabulary has no repeats and no blanks', () => {
    const lower = CLIP_SUGGESTION_VOCABULARY.map(w => w.trim().toLowerCase());
    assert.equal(new Set(lower).size, lower.length);
    assert.ok(lower.every(Boolean));
});
