/**
 * Pure helpers for baking layer swatches into a webmapx config file.
 *
 * The swatch belongs to the layer — "what this layer looks like on a map" — so
 * it is written onto the layer definition itself. Every panel that lists layers
 * reads the same value; none of them owns it.
 *
 * These edit the config as TEXT rather than parse/re-serialise it. A
 * JSON.stringify round-trip of demo.json rewrites unrelated lines (inline
 * coordinate arrays become multi-line), which buries a handful of real changes
 * in an unreviewable diff. Editing the text touches only the lines we add.
 *
 * Kept separate from the CLI so the fiddly part is unit-testable without a
 * browser or the network.
 */

import { deriveLayerSwatch } from '../../src/utils/layer-swatch';

export interface TextRange {
    start: number;
    end: number;
}

/**
 * Walks `text` up to `index`, returning the offsets of the JSON objects that
 * are still open there — outermost first. String contents are skipped so a
 * brace inside a URL or a label cannot corrupt the nesting.
 */
function openObjectsAt(text: string, index: number): number[] {
    const stack: number[] = [];
    let inString = false;
    let escaped = false;

    for (let i = 0; i < index; i++) {
        const ch = text[i];

        if (inString) {
            if (escaped) escaped = false;
            else if (ch === '\\') escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }

        if (ch === '"') inString = true;
        else if (ch === '{') stack.push(i);
        else if (ch === '}') stack.pop();
    }

    return stack;
}

/** Offset just past the `}` that closes the object opening at `start`. */
function endOfObject(text: string, start: number): number {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < text.length; i++) {
        const ch = text[i];

        if (inString) {
            if (escaped) escaped = false;
            else if (ch === '\\') escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }

        if (ch === '"') inString = true;
        else if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) return i + 1;
        }
    }

    throw new Error(`Unterminated object starting at offset ${start}`);
}

const escapeForRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Locates the object literal for a given layer id.
 *
 * Matches on `"id": "<layerId>"` and then takes the innermost object still open
 * at that point, which is the layer object itself.
 */
export function findLayerObjectRange(text: string, layerId: string): TextRange | null {
    const idPattern = new RegExp(`"id"\\s*:\\s*"${escapeForRegex(layerId)}"`, 'g');

    for (let match = idPattern.exec(text); match; match = idPattern.exec(text)) {
        const open = openObjectsAt(text, match.index);
        const start = open[open.length - 1];
        if (start === undefined) continue;
        return { start, end: endOfObject(text, start) };
    }

    return null;
}

/** Leading whitespace of the line containing `index`. */
function indentAt(text: string, index: number): string {
    const lineStart = text.lastIndexOf('\n', index) + 1;
    const line = text.slice(lineStart, index);
    return /^\s*/.exec(line)?.[0] ?? '';
}

/**
 * Writes `metadata.swatch` on one layer, preserving surrounding formatting.
 *
 * Handles the three shapes a layer can be in: already has a swatch (replace the
 * value), has a metadata object (add a key to it), has no metadata at all (add
 * the object). Returns the text unchanged when the layer cannot be found.
 */
export function injectLayerSwatch(text: string, layerId: string, swatch: string): string {
    const range = findLayerObjectRange(text, layerId);
    if (!range) return text;

    const object = text.slice(range.start, range.end);
    const encoded = JSON.stringify(swatch);

    // 1. An existing swatch: replace just its value.
    const existing = /"swatch"\s*:\s*"(?:[^"\\]|\\.)*"/.exec(object);
    if (existing) {
        const at = range.start + existing.index;
        return text.slice(0, at) + `"swatch": ${encoded}` + text.slice(at + existing[0].length);
    }

    // 2. An existing metadata object: add the key at its top.
    const metadata = /"metadata"\s*:\s*\{/.exec(object);
    if (metadata) {
        const insertAt = range.start + metadata.index + metadata[0].length;
        const keyIndent = indentAt(text, range.start + metadata.index) + '  ';
        const isEmpty = /^\s*\}/.test(text.slice(insertAt));
        const inserted = isEmpty
            ? `\n${keyIndent}"swatch": ${encoded}\n${indentAt(text, range.start + metadata.index)}`
            : `\n${keyIndent}"swatch": ${encoded},`;
        const tail = isEmpty ? text.slice(insertAt).replace(/^\s*\}/, '}') : text.slice(insertAt);
        return text.slice(0, insertAt) + inserted + tail;
    }

    // 3. No metadata: add one as the last property of the layer object.
    const closeIndex = range.end - 1;
    const closeIndent = indentAt(text, closeIndex);
    const keyIndent = closeIndent + '  ';
    const before = text.slice(0, closeIndex).replace(/\s*$/, '');
    const addition = `,\n${keyIndent}"metadata": {\n${keyIndent}  "swatch": ${encoded}\n${keyIndent}}\n${closeIndent}`;
    return before + addition + text.slice(closeIndex);
}

export interface SwatchTarget {
    id: string;
    /** Why this layer needs baking, for the CLI's report. */
    reason: 'raster' | 'unknown';
}

interface LayerRecord {
    id?: unknown;
    metadata?: { swatch?: unknown } | unknown;
}

/**
 * Selects the layers worth baking: those whose colour cannot be derived from a
 * paint spec. A fill layer already shows its real fill, so baking it would add
 * bytes and could go stale against the layer's own style.
 */
export function selectSwatchTargets(layers: unknown, opts: { force?: boolean; only?: string[] } = {}): SwatchTarget[] {
    if (!Array.isArray(layers)) return [];

    const only = opts.only && opts.only.length > 0 ? new Set(opts.only) : null;
    const targets: SwatchTarget[] = [];

    for (const layer of layers as LayerRecord[]) {
        const id = typeof layer?.id === 'string' ? layer.id : null;
        if (!id) continue;
        if (only && !only.has(id)) continue;

        const existing = (layer.metadata as { swatch?: unknown } | undefined)?.swatch;
        if (typeof existing === 'string' && existing.length > 0 && !opts.force) continue;

        // Ask the runtime deriver, so the CLI and the app always agree on which
        // layers are unresolvable — no second copy of that judgement.
        const derived = deriveLayerSwatch(stripBakedSwatch(layer));
        if (derived.kind === 'raster' || derived.kind === 'unknown') {
            targets.push({ id, reason: derived.kind });
        }
    }

    return targets;
}

/**
 * A layer that already carries a baked swatch would short-circuit
 * deriveLayerSwatch, so `--force` could never re-evaluate it. Strip it first.
 */
function stripBakedSwatch(layer: LayerRecord): unknown {
    const meta = layer.metadata as Record<string, unknown> | undefined;
    if (!meta || typeof meta !== 'object' || !('swatch' in meta)) return layer;
    const { swatch: _dropped, ...rest } = meta;
    return { ...layer, metadata: rest };
}
