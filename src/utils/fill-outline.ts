/**
 * A polygon's outline as one setting, whatever width it has.
 *
 * GL styles give a fill an edge of its own, `fill-outline-color`, but it is
 * always about 1px wide and its alpha is multiplied by `fill-opacity`. Any
 * other outline needs a second `line` sublayer over the same features. That is
 * a detail of the style format, not a choice anyone makes when styling: the
 * legend's fill editor offers one outline (colour and width), and this module
 * decides how to store it.
 *
 * - no outline: the fill alone, without `fill-outline-color` (which then
 *   defaults to the fill colour on every engine);
 * - an outline `fill-outline-color` can draw exactly — 1px, undashed, at the
 *   fill's own opacity: the fill alone, carrying `fill-outline-color`;
 * - anything else: the fill with its edge left at its own colour, followed
 *   by a `line` sublayer — the *companion* — drawing the outline.
 *
 * Nothing here renders or talks to an engine; the input and output are
 * sublayer lists as `getSubLayers`/`setSubLayers` hold them.
 */

type Sublayer = Record<string, unknown>;

export interface FillOutline {
    color: string;
    /** Pixels. `0` means no outline. */
    width: number;
    /** Opacity of the outline itself, 0..1. */
    opacity: number;
}

/** Written on a companion this module creates, so it is recognised again even if the fill's filter changes. */
export const OUTLINE_OF_KEY = 'outlineOf';

function paintOf(sub: Sublayer | undefined): Record<string, unknown> {
    const paint = sub?.paint;
    return paint && typeof paint === 'object' && !Array.isArray(paint) ? paint as Record<string, unknown> : {};
}

function metadataOf(sub: Sublayer | undefined): Record<string, unknown> {
    const metadata = sub?.metadata;
    return metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata as Record<string, unknown> : {};
}

function sameValue(a: unknown, b: unknown): boolean {
    return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/** A named sublayer is a style of its own that happens to be a line, not somebody's outline. */
function hasOwnName(sub: Sublayer): boolean {
    const metadata = metadataOf(sub);
    return ['label', 'title', 'name', 'legend'].some((key) => metadata[key] !== undefined);
}

/**
 * Index of the line sublayer drawing `sublayers[fillIndex]`'s outline, or -1.
 *
 * Either one this module created (`metadata.outlineOf`), or — so configs
 * written by hand as "a fill and its line" are understood the same way — the
 * sublayer directly above the fill when it is an unnamed line over exactly the
 * same features, with a literal colour and width that could be edited in place.
 */
export function outlineCompanionIndex(sublayers: Sublayer[], fillIndex: number): number {
    const fill = sublayers[fillIndex];
    const next = sublayers[fillIndex + 1];
    if (!fill || fill.type !== 'fill' || !next || next.type !== 'line') return -1;
    if (metadataOf(next)[OUTLINE_OF_KEY] === fill.id) return fillIndex + 1;
    if (hasOwnName(next)) return -1;
    for (const key of ['source', 'source-layer', 'filter', 'minzoom', 'maxzoom']) {
        if (!sameValue(fill[key], next[key])) return -1;
    }
    const paint = paintOf(next);
    if (typeof (paint['line-color'] ?? '#000000') !== 'string') return -1;
    if (typeof (paint['line-width'] ?? 1) !== 'number') return -1;
    if (paint['line-opacity'] !== undefined && typeof paint['line-opacity'] !== 'number') return -1;
    return fillIndex + 1;
}

/** Ids of every sublayer that is some fill's outline companion. */
export function outlineCompanionIds(sublayers: Sublayer[]): Map<string, string> {
    const byFill = new Map<string, string>();
    sublayers.forEach((sub, index) => {
        const companion = outlineCompanionIndex(sublayers, index);
        if (companion >= 0) byFill.set(String(sub.id ?? ''), String(sublayers[companion].id ?? ''));
    });
    return byFill;
}

function fillOpacityOf(fill: Sublayer): number | null {
    const value = paintOf(fill)['fill-opacity'] ?? 1;
    return typeof value === 'number' ? value : null;
}

/** The outline a fill is drawn with today, from the fill and its companion (if any). */
export function readFillOutline(fill: Sublayer, companion: Sublayer | null): FillOutline {
    if (companion) {
        const paint = paintOf(companion);
        return {
            color: String(paint['line-color'] ?? '#000000'),
            width: Number(paint['line-width'] ?? 1),
            opacity: Number(paint['line-opacity'] ?? 1),
        };
    }
    const edge = paintOf(fill)['fill-outline-color'];
    if (typeof edge === 'string') {
        return { color: edge, width: 1, opacity: fillOpacityOf(fill) ?? 1 };
    }
    // No outline yet: one that is asked for starts in the fill's colour, but
    // opaque — at a translucent fill's opacity it would barely show.
    const fillColor = paintOf(fill)['fill-color'];
    return { color: typeof fillColor === 'string' ? fillColor : '#000000', width: 0, opacity: 1 };
}

/** Whether `fill-outline-color` alone draws this outline exactly. */
function edgeCanDraw(fill: Sublayer, outline: FillOutline, companion: Sublayer | null): boolean {
    if (outline.width !== 1) return false;
    if (fillOpacityOf(fill) !== outline.opacity) return false;
    // A dash, a blur or an offset is a line's to draw; collapsing would drop it.
    const extra = Object.keys(paintOf(companion ?? undefined))
        .filter((key) => !['line-color', 'line-width', 'line-opacity'].includes(key));
    return extra.length === 0;
}

function uniqueId(sublayers: Sublayer[], wanted: string): string {
    const taken = new Set(sublayers.map((sub) => String(sub.id ?? '')));
    if (!taken.has(wanted)) return wanted;
    for (let n = 2; ; n += 1) {
        if (!taken.has(`${wanted}-${n}`)) return `${wanted}-${n}`;
    }
}

/**
 * The sublayer list that draws `fillId` with `outline`.
 *
 * Returns a new list; the input is not modified. Every other sublayer, and
 * every key of the fill and companion this module does not own, is kept.
 */
export function withFillOutline(sublayers: Sublayer[], fillId: string, outline: FillOutline): Sublayer[] {
    const fillIndex = sublayers.findIndex((sub) => String(sub.id ?? '') === fillId && sub.type === 'fill');
    if (fillIndex < 0) return sublayers;
    const fill = sublayers[fillIndex];
    const companionIndex = outlineCompanionIndex(sublayers, fillIndex);
    const companion = companionIndex >= 0 ? sublayers[companionIndex] : null;
    const rest = sublayers.filter((_, index) => index !== companionIndex);

    const fillPaint = { ...paintOf(fill) };
    let companionOut: Sublayer | null = null;

    if (outline.width <= 0) {
        delete fillPaint['fill-outline-color'];
    } else if (edgeCanDraw(fill, outline, companion)) {
        fillPaint['fill-outline-color'] = outline.color;
    } else {
        // The fill's own edge goes back to the fill colour; the line draws the outline.
        delete fillPaint['fill-outline-color'];
        const base: Sublayer = companion ?? {
            id: uniqueId(rest, `${fillId}-outline`),
            type: 'line',
            ...Object.fromEntries(['source', 'source-layer', 'filter', 'minzoom', 'maxzoom']
                .filter((key) => fill[key] !== undefined)
                .map((key) => [key, fill[key]])),
            metadata: { [OUTLINE_OF_KEY]: fillId },
        };
        const paint: Record<string, unknown> = {
            ...paintOf(base),
            'line-color': outline.color,
            'line-width': outline.width,
        };
        if (outline.opacity !== 1 || paint['line-opacity'] !== undefined) paint['line-opacity'] = outline.opacity;
        // Round unless the style says otherwise: the GL defaults (miter join,
        // butt cap) turn every corner of a thick outline into a spike and
        // leave a notch where a ring closes.
        const layout = (base.layout && typeof base.layout === 'object') ? base.layout as Record<string, unknown> : {};
        companionOut = { ...base, layout: { 'line-join': 'round', 'line-cap': 'round', ...layout }, paint };
    }

    const nextFill: Sublayer = { ...fill, paint: fillPaint };
    const result = rest.map((sub) => (sub === fill ? nextFill : sub));
    if (companionOut) result.splice(result.indexOf(nextFill) + 1, 0, companionOut);
    return result;
}
