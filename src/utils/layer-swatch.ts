/**
 * Derives a small visual preview for a layer from the paint spec it already
 * carries — no rendering, no network, no config authoring.
 *
 * A catalog that lists layers as bare labels reads as a file tree. One 26px
 * swatch per row turns it into a list of *map things*, which is most of the
 * difference between "GIS config screen" and "map app". The cheap derivation
 * here is deliberate: it is approximate by design, and a layer that cannot be
 * summarised falls back to a neutral glyph rather than guessing.
 *
 * Data-driven expressions collapse to their colour stops, in stack order:
 *   ['interpolate', …, v0, c0, v1, c1]  -> smooth gradient c0 → c1
 *   ['step', input, c0, v1, c1, …]      -> hard-edged bands
 *   ['match'|'case', …]                 -> hard-edged bands of the case colours
 */

export type SwatchKind = 'fill' | 'line' | 'circle' | 'raster' | 'unknown' | 'preview';

export interface LayerSwatch {
    /** Ready-to-use CSS `background` shorthand value. */
    background: string;
    /** What the layer draws, so the caller can pick a shape/border treatment. */
    kind: SwatchKind;
}

/** Colours webmapx falls back to when a layer exposes nothing usable. */
const NEUTRAL = 'var(--color-background-tertiary, #e9edf1)';

const MAX_STOPS = 5;

/**
 * A colour literal, as opposed to an expression input.
 *
 * Deliberately strict about named colours: a `match` expression's keys are
 * arbitrary strings ("a", "urban", "nl"), and a loose `[a-z]+` test would
 * happily read those as CSS colour names and put category keys into the
 * swatch. Only the CSS names that actually turn up in map styles are honoured.
 */
const NAMED_COLORS = new Set([
    'black', 'silver', 'gray', 'grey', 'white', 'maroon', 'red', 'purple', 'fuchsia',
    'green', 'lime', 'olive', 'yellow', 'navy', 'blue', 'teal', 'aqua', 'cyan',
    'orange', 'brown', 'pink', 'gold', 'beige', 'tan', 'transparent',
    'steelblue', 'darkblue', 'lightblue', 'darkgreen', 'lightgreen', 'darkred',
]);

function isColorString(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    const v = value.trim().toLowerCase();
    if (/^#[0-9a-f]{3,8}$/.test(v)) return true;
    if (/^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(/.test(v)) return true;
    return NAMED_COLORS.has(v);
}

/** Keeps only real colours, so a malformed spec degrades to the neutral swatch. */
function colorsAt(value: unknown[], indices: number[]): string[] {
    const out: string[] = [];
    for (const i of indices) {
        const c = value[i];
        if (isColorString(c)) out.push(c);
    }
    return out;
}

/**
 * Pulls the colour literals out of a maplibre expression, in the order they
 * would appear along the value axis. Returns [] for anything unrecognised —
 * callers treat that as "no swatch available" rather than inventing one.
 *
 * Colours are read by POSITION rather than by filtering the whole array,
 * because the non-colour slots (category keys, thresholds, conditions) are
 * arbitrary author data and must never be mistaken for colours.
 */
export function extractColorStops(value: unknown): string[] {
    if (isColorString(value)) return [value];
    if (!Array.isArray(value) || value.length === 0) return [];

    const op = value[0];
    if (typeof op !== 'string') return [];

    const range = (start: number, step: number): number[] => {
        const idx: number[] = [];
        for (let i = start; i < value.length; i += step) idx.push(i);
        return idx;
    };

    // ['interpolate', interpolation, input, stop0, color0, stop1, color1, …]
    if (op === 'interpolate' || op === 'interpolate-hcl' || op === 'interpolate-lab') {
        return colorsAt(value, range(4, 2)).slice(0, MAX_STOPS);
    }

    // ['step', input, color0, stop1, color1, stop2, color2, …]
    if (op === 'step') {
        return colorsAt(value, [2, ...range(4, 2)]).slice(0, MAX_STOPS);
    }

    // ['match', input, key1, color1, …, fallbackColor]
    if (op === 'match') {
        return colorsAt(value, [...range(3, 2), value.length - 1]).slice(0, MAX_STOPS);
    }

    // ['case', condition1, color1, …, fallbackColor]
    if (op === 'case') {
        return colorsAt(value, [...range(2, 2), value.length - 1]).slice(0, MAX_STOPS);
    }

    // ['get', …], ['coalesce', …] and friends: recurse one level in case a
    // colour is nested inside, but do not chase arbitrary depth.
    if (op === 'coalesce' || op === 'to-color') {
        for (const item of value.slice(1)) {
            const found = extractColorStops(item);
            if (found.length) return found;
        }
    }

    return [];
}

/** Smooth ramp for continuous data, hard bands for categorical/stepped data. */
function stopsToBackground(stops: string[], smooth: boolean): string {
    if (stops.length === 0) return NEUTRAL;
    if (stops.length === 1) return stops[0];

    if (smooth) {
        return `linear-gradient(135deg, ${stops.join(', ')})`;
    }

    const step = 100 / stops.length;
    const bands = stops.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`);
    return `linear-gradient(135deg, ${bands.join(', ')})`;
}

interface LayerLike {
    type?: string;
    paint?: Record<string, unknown>;
    layers?: unknown[];
    metadata?: unknown;
}

/**
 * Reads `metadata.swatch` — either a data: URL of a downscaled tile, or a
 * plain colour. Anything else (a remote URL, a javascript: scheme) is ignored:
 * the swatch is injected straight into a style attribute, so only
 * self-contained values are accepted.
 */
function readBakedSwatch(spec: LayerLike): LayerSwatch | null {
    const meta = spec.metadata as { swatch?: unknown } | undefined;
    const value = meta?.swatch;
    if (typeof value !== 'string' || value.length === 0) return null;

    const v = value.trim();
    if (v.startsWith('data:image/')) return { background: `url("${v}")`, kind: 'preview' };
    if (isColorString(v)) return { background: v, kind: 'preview' };
    return null;
}

/**
 * How representative a sublayer is of the whole layer, for picking which one
 * a single swatch should show. A fill communicates a layer's identity better
 * than the hairline that outlines it, and both beat a label colour.
 */
const KIND_RANK: Record<string, number> = {
    fill: 5,
    'fill-extrusion': 5,
    circle: 4,
    line: 3,
    symbol: 1,
};

function paintedKind(layer: unknown): string {
    const t = (layer as LayerLike | null)?.type;
    return typeof t === 'string' ? t : '';
}

/**
 * @param layer   a layer spec as it appears in webmapx config (mapbox/maplibre shaped)
 * @returns       a swatch, or a neutral one when nothing can be derived
 */
export function deriveLayerSwatch(layer: unknown): LayerSwatch {
    const spec = (layer ?? {}) as LayerLike;
    const paint = spec.paint ?? {};
    const type = typeof spec.type === 'string' ? spec.type : '';

    // A swatch baked onto the layer always wins: raster basemaps, remote vector
    // styles and Allmaps overlays have no paint to read, and the alternative is
    // fetching a tile at runtime — which makes listing layers send requests to
    // third-party hosts for layers the user never added.
    // `scripts/generate-layer-swatches.ts` bakes these in offline.
    const baked = readBakedSwatch(spec);
    if (baked) return baked;

    const pick = (key: string): { stops: string[]; smooth: boolean } => {
        const raw = paint[key];
        const op = Array.isArray(raw) ? raw[0] : null;
        return {
            stops: extractColorStops(raw),
            smooth: typeof op === 'string' && op.startsWith('interpolate'),
        };
    };

    // webmapx catalog entries are usually `type: 'style'` — a container whose
    // real paint lives in a nested `layers` array of mapbox-style fragments.
    // Summarise the container by its most representative painted sublayer,
    // otherwise every vector layer in the catalog derives to "unknown".
    if (Array.isArray(spec.layers) && spec.layers.length > 0) {
        let best: { swatch: LayerSwatch; rank: number } | null = null;
        for (const sub of spec.layers) {
            const rank = KIND_RANK[paintedKind(sub)] ?? 0;
            if (rank === 0) continue;
            const swatch = deriveLayerSwatch(sub);
            if (swatch.background === NEUTRAL) continue;
            if (!best || rank > best.rank) best = { swatch, rank };
        }
        if (best) return best.swatch;
        // A style container with no derivable paint (e.g. a remote style URL)
        // is a raster-ish unknown, not a blank fill.
        return { background: NEUTRAL, kind: type === 'style' ? 'raster' : 'unknown' };
    }

    // A style container with nothing to summarise (remote style URL, empty
    // fragment list) is still map imagery — hatch it like a raster rather
    // than leaving a blank square.
    if (type === 'raster' || type === 'raster-dem' || type === 'hillshade' || type === 'style') {
        return { background: NEUTRAL, kind: 'raster' };
    }

    if (type === 'fill' || type === 'fill-extrusion') {
        const { stops, smooth } = pick(type === 'fill' ? 'fill-color' : 'fill-extrusion-color');
        return { background: stopsToBackground(stops, smooth), kind: 'fill' };
    }

    if (type === 'line') {
        const { stops, smooth } = pick('line-color');
        return { background: stopsToBackground(stops, smooth), kind: 'line' };
    }

    if (type === 'circle') {
        const { stops, smooth } = pick('circle-color');
        return { background: stopsToBackground(stops, smooth), kind: 'circle' };
    }

    if (type === 'symbol') {
        const { stops, smooth } = pick('text-color');
        return { background: stopsToBackground(stops, smooth), kind: 'unknown' };
    }

    return { background: NEUTRAL, kind: 'unknown' };
}

/**
 * Splits a catalog title into a human name and its technical qualifier.
 *
 * Config titles routinely read "OpenStreetMap (xyz)", "Hoogte (AHN)",
 * "BAG panden (raster)" — the parenthetical is the engine's vocabulary
 * leaking into the UI. Showing it as a muted subtitle keeps the information
 * for people who want it while letting the row scan as a place or a subject.
 *
 * Only a trailing parenthetical is treated this way, and only when the name
 * before it is non-empty, so "(concept) Bevolkingsdichtheid" is left alone.
 */
export function splitLayerTitle(title: string): { name: string; qualifier: string } {
    const match = /^(.*\S)\s*\(([^()]+)\)\s*$/.exec(title ?? '');
    if (!match) return { name: title ?? '', qualifier: '' };
    return { name: match[1], qualifier: match[2] };
}
