/**
 * The *More* tier of a label: font, placement, position and overlap.
 *
 * Kept out of the component because every answer here is a mapping between a
 * choice a reader makes and the GL keys that express it, and each mapping has
 * a way to go silently wrong that a unit test can pin:
 *
 * - **A font is a face the glyph server has, or no text at all.** MapLibre
 *   draws `text-font` from pre-rendered glyphs, so bold is a different *face*
 *   (`Noto Sans Bold`), and naming one the server lacks draws nothing and
 *   reports nothing. No engine can list what a glyph server holds, so the only
 *   faces offered are ones another layer on this map already draws with —
 *   evidence, not a guess.
 * - **Position is two keys and one decision.** "Above the point" is
 *   `text-anchor: bottom` *and* a negative y offset; either alone is either no
 *   gap or the label sitting on its point.
 */
import type { ChannelState, StyleEntry } from '../../utils/layer-style-model';

/**
 * Engines that honour the *More* tier.
 *
 * MapLibre natively; OpenLayers through `ol-mapbox-style`, which reads
 * `text-font`, `symbol-placement` (including `line-center`), `text-anchor`,
 * `text-offset` and `text-allow-overlap`. Leaflet and Cesium draw a label as
 * one plain font centred on its point and read none of them, so offering the
 * controls there would tick boxes that change nothing.
 */
const MORE_ENGINES = new Set(['maplibre', 'openlayers']);

export function labelMoreSupported(engine: string | undefined): boolean {
    return engine === undefined || MORE_ENGINES.has(engine);
}

/**
 * Every font stack the map's own layers draw with, one per leading face.
 *
 * A stack is kept whole because its later faces are the fallbacks the author
 * chose for glyphs the first lacks. Expressions are skipped: a `text-font`
 * that depends on the feature names no face that is known to exist.
 */
export function collectFontStacks(sublayerLists: Iterable<ReadonlyArray<unknown> | null | undefined>): string[][] {
    const byFace = new Map<string, string[]>();
    for (const list of sublayerLists) {
        for (const sublayer of list ?? []) {
            const layout = (sublayer as { layout?: Record<string, unknown> } | null)?.layout;
            const stack = layout?.['text-font'];
            if (!isFontStackValue(stack)) continue;
            if (!byFace.has(stack[0])) byFace.set(stack[0], [...stack]);
        }
    }
    return [...byFace.values()].sort((a, b) => a[0].localeCompare(b[0]));
}

/**
 * Faces, not an expression — the same test the decoder applies: a face name
 * has a space in it (`Noto Sans Regular`), and no GL operator does, so
 * `['get', 'font']` is not mistaken for two faces called "get" and "font".
 */
function isFontStackValue(value: unknown): value is string[] {
    return Array.isArray(value) && value.length > 0
        && value.every((face) => typeof face === 'string' && face.length > 0)
        && value.some((face) => (face as string).includes(' '));
}

/** The stack a font channel holds, or null for the map's default or an expression. */
export function fontStackOf(state: ChannelState | undefined): string[] | null {
    return state?.driver === 'single' && isFontStackValue(state.value) ? [...state.value] : null;
}

export type LabelPlacement = 'point' | 'line' | 'line-center';

/**
 * Where a label may sit, in words that fit the geometry.
 *
 * Points have no choice to make. On areas `line-center` is left out: the middle
 * of a ring is an arbitrary spot on its edge, not a place anyone asks for.
 */
export function placementOptions(geometryTypes: readonly string[]): Array<{ value: LabelPlacement; label: string }> {
    if (geometryTypes.some((type) => /polygon/i.test(type))) {
        return [
            { value: 'point', label: 'Inside the area' },
            { value: 'line', label: 'Along the edge' },
        ];
    }
    if (geometryTypes.some((type) => /line/i.test(type))) {
        return [
            { value: 'point', label: 'Flat, at one spot' },
            { value: 'line', label: 'Along the line, repeated' },
            { value: 'line-center', label: 'Along the line, once' },
        ];
    }
    return [];
}

export function placementOf(state: ChannelState | undefined): LabelPlacement | null {
    if (!state) return 'point';
    if (state.driver !== 'single') return null;
    return state.value === 'point' || state.value === 'line' || state.value === 'line-center' ? state.value : null;
}

export type LabelDirection = 'center' | 'above' | 'below' | 'right' | 'left';

export const DIRECTION_LABELS: Record<LabelDirection, string> = {
    center: 'On the spot',
    above: 'Above',
    below: 'Below',
    right: 'Right',
    left: 'Left',
};

/** The anchor that puts a label on that side: the label hangs from its opposite edge. */
const ANCHOR_OF: Record<LabelDirection, string> = {
    center: 'center',
    above: 'bottom',
    below: 'top',
    right: 'left',
    left: 'right',
};

/** A unit step in em, y growing downwards as the GL spec has it. */
const OFFSET_OF: Record<LabelDirection, [number, number]> = {
    center: [0, 0],
    above: [0, -1],
    below: [0, 1],
    right: [1, 0],
    left: [-1, 0],
};

export interface LabelPosition {
    direction: LabelDirection;
    /** In em, the unit `text-offset` is measured in. */
    distance: number;
}

/**
 * The position two keys describe, or null when they say something else.
 *
 * Null covers an expression, a diagonal anchor, and an offset that points away
 * from its anchor's side — all real in authored styles, none a choice this
 * control can make, so they are shown and not rewritten.
 */
export function readPosition(anchor: ChannelState | undefined, offset: ChannelState | undefined): LabelPosition | null {
    const anchorValue = anchor === undefined ? 'center' : anchor.driver === 'single' ? anchor.value : null;
    const direction = (Object.keys(ANCHOR_OF) as LabelDirection[]).find((key) => ANCHOR_OF[key] === anchorValue);
    if (!direction) return null;

    let vector: [number, number] = [0, 0];
    if (offset !== undefined) {
        if (offset.driver !== 'single' || !Array.isArray(offset.value) || offset.value.length !== 2) return null;
        const [x, y] = offset.value as number[];
        if (typeof x !== 'number' || typeof y !== 'number') return null;
        vector = [x, y];
    }
    if (direction === 'center') return vector[0] === 0 && vector[1] === 0 ? { direction, distance: 0 } : null;

    const [ux, uy] = OFFSET_OF[direction];
    const distance = vector[0] * ux + vector[1] * uy;
    // Along the side the anchor names and nowhere else: an offset with a
    // sideways part, or pointing back across the point, is not "above".
    const sideways = vector[0] * uy - vector[1] * ux;
    if (distance < 0 || sideways !== 0) return null;
    return { direction, distance };
}

/** The two channel states a position is written as; `undefined` removes the key. */
export function writePosition(position: LabelPosition): { anchor?: ChannelState; offset?: ChannelState } {
    if (position.direction === 'center') return {};
    const [ux, uy] = OFFSET_OF[position.direction];
    const distance = Math.max(0, position.distance);
    return {
        anchor: { driver: 'single', value: ANCHOR_OF[position.direction] },
        ...(distance === 0 ? {} : {
            // `+ 0` turns the -0 of a zero component into 0, which a JSON
            // comparison would otherwise count as a different offset.
            offset: { driver: 'single', value: [ux * distance + 0, uy * distance + 0] },
        }),
    };
}

/**
 * Whether the tier holds anything but the defaults — the dot on the `⋯`.
 *
 * Without it a panel showing defaults and one showing a layer carrying
 * overrides the reader cannot see look the same.
 */
export function hasMoreOverrides(entry: StyleEntry): boolean {
    const { font, placement, anchor, offset, allowOverlap } = entry.channels;
    if (font !== undefined) return true;
    if (placement !== undefined && placementOf(placement) !== 'point') return true;
    const position = readPosition(anchor, offset);
    if (!position || position.direction !== 'center') return true;
    return allowOverlap !== undefined && !(allowOverlap.driver === 'single' && allowOverlap.value === false);
}
