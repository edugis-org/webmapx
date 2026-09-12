/**
 * The object model the layer styler is built on: a source, a list of styles on
 * it, a role per style, and a driver per visual channel.
 *
 * This is the piece `docs/developer/layer-styler-specification.md` says is
 * missing. `webmapx-layer-style-dialog.ts` holds a flat state bag styling one
 * sublayer at a time, so composite layers, casing pairs (a 2px white dashed
 * line over a 4px black one) and labels are bolted on as boolean flags rather
 * than being what they are: several styles over one source.
 *
 * Nothing here renders, and nothing here talks to an engine. A `StyleEntry`
 * encodes to exactly the sublayer shape a `type: 'style'` layer already holds
 * (`{ id, type, paint, layout, filter, minzoom, maxzoom }`), which is what every
 * adapter already consumes.
 *
 * The one non-obvious rule is **origin preservation**. Invariant 4 of the
 * specification — opening the styler on a layer and closing it again leaves the
 * paint byte-identical — cannot be met by a decode/encode pair alone: a decoder
 * that understands `step` can rebuild it, but it cannot rebuild the formatting,
 * the key order, or the paint keys it has no channel for. So an entry keeps the
 * sublayer it was decoded from (`origin`) and `encodeStyleEntry` writes *only*
 * the channels whose state differs from the one that was decoded. An untouched
 * entry therefore re-emits its origin object unchanged, and a touched one keeps
 * every key the styler does not model.
 */
import {
    ROLE_COLOR_KEY,
    ROLE_LAYER_TYPE,
    ROLE_OPACITY_KEY,
    type StyleRole,
} from './style-builder';
import { metadataLabel } from './layer-label';

export type { StyleRole };

/**
 * Property the neighbour colouring writes its class index into.
 *
 * Named to be recognisable as machinery rather than data if it is ever seen in
 * an info popup or an export: it is not a fact about the region, it is which of
 * six colours this run of the algorithm gave it.
 */
export const NEIGHBOUR_COLOR_FIELD = '__webmapx_neighbour_class';

/**
 * One adjustable visual property of a role.
 *
 * Not one per paint key: `halo` is two keys (colour and width) but one decision,
 * and `stroke` likewise. Names are the styler's language, not MapLibre's — the
 * mapping to paint keys is `CHANNEL_KEYS`.
 */
export type ChannelId =
    | 'color'
    | 'opacity'
    | 'width'
    | 'radius'
    | 'dash'
    | 'lineJoin'
    | 'lineCap'
    | 'fillOutline'
    | 'strokeColor'
    | 'strokeWidth'
    | 'text'
    | 'textSize'
    | 'haloColor'
    | 'haloWidth';

/** Where a channel's value lives in a GL layer. Layout is not paint, and mixing the two silently drops the value. */
export type ChannelSlot = 'paint' | 'layout';

export interface ChannelKey {
    key: string;
    slot: ChannelSlot;
}

/**
 * Which GL property each channel of each role writes.
 *
 * A role offers exactly the channels listed for it: a channel absent from a
 * role has no key to write, so it cannot be edited there. `fill` has no size —
 * an area's size is its geometry — and `background` has neither size nor
 * anything to classify.
 */
export const CHANNEL_KEYS: Record<StyleRole, Partial<Record<ChannelId, ChannelKey>>> = {
    fill: {
        color: { key: ROLE_COLOR_KEY.fill, slot: 'paint' },
        opacity: { key: ROLE_OPACITY_KEY.fill, slot: 'paint' },
        // A fill's own edge. Always ~1px and not widenable — a thicker boundary
        // is an `outline` entry of its own, which is why both exist.
        fillOutline: { key: 'fill-outline-color', slot: 'paint' },
    },
    outline: {
        color: { key: ROLE_COLOR_KEY.outline, slot: 'paint' },
        opacity: { key: ROLE_OPACITY_KEY.outline, slot: 'paint' },
        width: { key: 'line-width', slot: 'paint' },
        dash: { key: 'line-dasharray', slot: 'paint' },
        // Layout, not paint, and the two are one decision to a reader: the GL
        // defaults (miter join, butt cap) turn every corner of a thick line
        // into a spike and cut its ends off square.
        lineJoin: { key: 'line-join', slot: 'layout' },
        lineCap: { key: 'line-cap', slot: 'layout' },
    },
    line: {
        color: { key: ROLE_COLOR_KEY.line, slot: 'paint' },
        opacity: { key: ROLE_OPACITY_KEY.line, slot: 'paint' },
        width: { key: 'line-width', slot: 'paint' },
        dash: { key: 'line-dasharray', slot: 'paint' },
        // Layout, not paint, and the two are one decision to a reader: the GL
        // defaults (miter join, butt cap) turn every corner of a thick line
        // into a spike and cut its ends off square.
        lineJoin: { key: 'line-join', slot: 'layout' },
        lineCap: { key: 'line-cap', slot: 'layout' },
    },
    circle: {
        color: { key: ROLE_COLOR_KEY.circle, slot: 'paint' },
        opacity: { key: ROLE_OPACITY_KEY.circle, slot: 'paint' },
        radius: { key: 'circle-radius', slot: 'paint' },
        strokeColor: { key: 'circle-stroke-color', slot: 'paint' },
        strokeWidth: { key: 'circle-stroke-width', slot: 'paint' },
    },
    label: {
        color: { key: ROLE_COLOR_KEY.label, slot: 'paint' },
        opacity: { key: ROLE_OPACITY_KEY.label, slot: 'paint' },
        haloColor: { key: 'text-halo-color', slot: 'paint' },
        haloWidth: { key: 'text-halo-width', slot: 'paint' },
        // Both of these are layout properties in the GL spec, not paint. Writing
        // them into `paint` is accepted by nothing and reported by nothing.
        text: { key: 'text-field', slot: 'layout' },
        textSize: { key: 'text-size', slot: 'layout' },
    },
    background: {
        color: { key: ROLE_COLOR_KEY.background, slot: 'paint' },
        opacity: { key: ROLE_OPACITY_KEY.background, slot: 'paint' },
    },
};

/** What decides a channel's value. Level 3 of the hierarchy. */
export type ChannelDriver = 'single' | 'attribute' | 'neighbours' | 'custom';

/** A channel that is one value for every feature. */
export interface SingleChannel {
    driver: 'single';
    value: string | number | readonly number[];
}

/** Ranges of a number, drawn as a `step` expression. */
export interface RangesClassification {
    kind: 'ranges';
    /** Ascending inner breaks: one fewer than there are colours. */
    breaks: number[];
    colors: string[];
    /** Colour for a feature whose value is missing, when the expression guards for one. */
    noDataColor?: string;
}

/** Named values, drawn as a `match` expression. */
export interface CategoriesClassification {
    kind: 'categories';
    /** Compared as strings, exactly as `buildCategoricalStyle` writes them. */
    values: string[];
    colors: string[];
    fallbackColor?: string;
    /**
     * True when the keys were read straight off the attribute rather than
     * stringified — the shape `buildIndexedColorStyle` writes. It changes how
     * the expression is rebuilt, so it cannot be inferred back from the values.
     */
    rawKeys?: boolean;
}

/** A size straight from a value, with no classes: `coefficient × √value`. */
export interface ProportionalClassification {
    kind: 'proportional';
    coefficient: number;
}

export type ChannelClassification =
    | RangesClassification
    | CategoriesClassification
    | ProportionalClassification;

/** A channel whose value comes from a column, through a classification. */
export interface AttributeChannel {
    driver: 'attribute';
    attribute: string;
    classification: ChannelClassification;
    /**
     * The colour scheme the palette came from, when the colours match one of the
     * catalog's. Display only: the colours themselves are in the classification,
     * so a palette that matches nothing costs nothing.
     */
    schemeName?: string;
}

/** A colour per feature from a graph colouring — no two touching areas alike. */
export interface NeighbourChannel {
    driver: 'neighbours';
    /** The property carrying the class index, or the key expression for a keyed colouring. */
    attribute: string;
    colors: string[];
    fallbackColor?: string;
}

/**
 * An expression the decoder does not recognise, kept verbatim.
 *
 * Without this branch, opening the styler on a hand-authored config silently
 * replaces an expression nobody can get back — the worst outcome this panel can
 * produce. Nothing writes over a `custom` channel unless the user changes its
 * driver themselves.
 */
export interface CustomChannel {
    driver: 'custom';
    expression: unknown;
}

export type ChannelState =
    | SingleChannel
    | AttributeChannel
    | NeighbourChannel
    | CustomChannel;

/** A sublayer as the map holds it — what an entry is decoded from and encoded to. */
export interface StyleSubLayer {
    id?: string;
    type?: string;
    paint?: Record<string, unknown>;
    layout?: Record<string, unknown>;
    filter?: unknown;
    minzoom?: number;
    maxzoom?: number;
    [key: string]: unknown;
}

/**
 * One style on one source: level 1 of the hierarchy, and one sublayer on the map.
 *
 * A rule in the QGIS sense is an entry carrying a `filter` and a zoom range;
 * every engine already honours both on a sublayer, so rules cost a field here
 * rather than a mechanism.
 */
export interface StyleEntry {
    /** The sublayer id. Stable, because it is what a paint change is applied to. */
    id: string;
    role: StyleRole;
    channels: Partial<Record<ChannelId, ChannelState>>;
    filter?: unknown;
    minzoom?: number;
    maxzoom?: number;
    /**
     * What this style is called, in the legend and in this panel's own list.
     *
     * A style is named by its sublayer's `metadata.label`, which the legend
     * already reads (`legendSublayerLabel`), so naming one here is the same
     * fact the legend shows rather than a second one. Absent means the name is
     * derived from the id, exactly as it was before it could be typed.
     */
    title?: string;
    /**
     * What the legend calls the features a classification has no class for —
     * a missing value, and for categories anything outside the list.
     *
     * Empty (or absent) means the legend shows no row for them, which is the
     * repo's empty-label convention, not a special case of it: the colour is
     * still drawn on the map, it simply is not explained. The colour itself
     * lives in the classification (`noDataColor` / `fallbackColor`), because
     * that is what the paint expression needs; only the words are here.
     */
    noDataLabel?: string;
    /**
     * The sublayer this entry was decoded from, and the reason an untouched
     * entry re-encodes byte-identically. Absent on an entry the user added.
     */
    origin?: StyleSubLayer;
    /**
     * The channel states as decoded, so `encodeStyleEntry` can tell what the
     * user changed from what it merely understood. Absent on a new entry, which
     * has nothing to leave alone.
     */
    originChannels?: Partial<Record<ChannelId, ChannelState>>;
}

/** One source and every style drawn from it: levels 0 and 1. */
export interface SourceStyleModel {
    sourceId: string;
    entries: StyleEntry[];
    /**
     * False when the features are only what the map has drawn (a tiled source),
     * which changes the answer as the user pans. A property of the source, not
     * of any style on it — which is why it lives here and not on an entry.
     */
    completeData?: boolean;
}

/** Every source a layer draws, plus the one value that spans all of them. */
export interface LayerStyleModel {
    layerId: string;
    sources: SourceStyleModel[];
    /**
     * `adapter.setLayerOpacity`, the same value the legend slider shows. Layer
     * opacity is layer-global, so it cannot sit inside a style entry — a user
     * who set it there would reasonably expect it to apply to that entry alone.
     */
    layerOpacity?: number;
}

/** Channels a role offers, in the order the specification lists them. */
const ROLE_CHANNEL_ORDER: Record<StyleRole, ChannelId[]> = {
    fill: ['color', 'fillOutline', 'opacity'],
    // `lineCap` is deliberately not listed: it is set with `lineJoin` by one
    // control, because a rounded corner with a square end is not a choice
    // anybody makes on purpose.
    //
    // Neither is `dash`, and that one is about the data rather than the control:
    // every polygon carries the whole of its own ring, so a border shared by two
    // areas is in the layer twice and is stroked twice, with independent dash
    // phase and opposite traversal. The dashes interleave and the border reads
    // as noise — a dashed *outline* is a promise the geometry cannot keep. It
    // stays on `line`, where a feature's line is drawn once. The key mapping
    // below is kept so an authored dash is decoded as part of the origin and
    // survives untouched rather than being quietly stripped.
    outline: ['width', 'lineJoin', 'color', 'opacity'],
    line: ['width', 'dash', 'lineJoin', 'color', 'opacity'],
    circle: ['color', 'radius', 'strokeColor', 'strokeWidth', 'opacity'],
    label: ['text', 'textSize', 'color', 'haloColor', 'haloWidth', 'opacity'],
    background: ['color', 'opacity'],
};

export function channelsOf(role: StyleRole): ChannelId[] {
    return ROLE_CHANNEL_ORDER[role] ?? [];
}

/** True when the role can draw the channel at all. */
export function roleHasChannel(role: StyleRole, channel: ChannelId): boolean {
    return CHANNEL_KEYS[role]?.[channel] !== undefined;
}

/**
 * A channel state as a GL value.
 *
 * `undefined` means "write nothing": a single-value channel with no value is
 * how an entry says it leaves the authored value alone, which is what
 * `authoredSize` in today's dialog means by returning `null`.
 */
export function encodeChannel(channel: ChannelState): unknown {
    switch (channel.driver) {
        case 'single':
            return channel.value;
        case 'custom':
            return channel.expression;
        case 'neighbours':
            return [
                'match',
                ['get', channel.attribute],
                ...channel.colors.flatMap((color, index) => [index, color]),
                channel.fallbackColor ?? NO_DATA,
            ];
        case 'attribute':
            return encodeAttributeChannel(channel);
    }
}

/** Kept local rather than imported so this module has no reason to pull in the builders. */
const NO_DATA = '#cccccc';

function encodeAttributeChannel(channel: AttributeChannel): unknown {
    const { attribute, classification } = channel;
    if (classification.kind === 'proportional') {
        return ['*', classification.coefficient, ['sqrt', ['get', attribute]]];
    }
    if (classification.kind === 'ranges') {
        const { breaks, colors, noDataColor } = classification;
        // One class is a plain colour and not an expression at all, exactly as
        // `buildNumericStyle` writes it: a one-colour layer should be readable
        // by a legend and a swatch without evaluating anything.
        if (colors.length === 1) return colors[0];
        const step = ['step', ['to-number', ['get', attribute]], colors[0],
            ...breaks.flatMap((brk, i) => [brk, colors[i + 1]])];
        if (noDataColor === undefined) return step;
        return [
            'case',
            ['!', ['has', attribute]], noDataColor,
            ['==', ['get', attribute], null], noDataColor,
            step,
        ];
    }
    const input = classification.rawKeys ? ['get', attribute] : ['to-string', ['get', attribute]];
    const keys: (string | number)[] = classification.rawKeys
        ? classification.values.map((value) => Number(value))
        : classification.values;
    return [
        'match',
        input,
        ...keys.flatMap((key, i) => [key, classification.colors[i]]),
        classification.fallbackColor ?? NO_DATA,
    ];
}

/**
 * An entry as a sublayer, changing as little as possible.
 *
 * Only channels whose state differs from `originChannels` are written, so an
 * entry nobody touched comes back as the object it was decoded from — keys the
 * styler does not model included.
 */
export function encodeStyleEntry(entry: StyleEntry): StyleSubLayer {
    const origin = entry.origin ?? {};
    const paint: Record<string, unknown> = { ...(origin.paint ?? {}) };
    const layout: Record<string, unknown> = { ...(origin.layout ?? {}) };
    const keys = CHANNEL_KEYS[entry.role] ?? {};

    // The union of both sides, not just the channels the entry still has: a
    // channel that was decoded and is now gone is a *removal*, and iterating
    // only over what is left would leave the key exactly as it was — which is
    // how setting a dashed line back to solid left it dashed.
    const touched = new Set<ChannelId>([
        ...Object.keys(entry.channels) as ChannelId[],
        ...Object.keys(entry.originChannels ?? {}) as ChannelId[],
    ]);
    for (const name of touched) {
        const target = keys[name];
        if (!target) continue;
        const state = entry.channels[name];
        if (sameChannel(entry.originChannels?.[name], state)) continue;
        const bag = target.slot === 'layout' ? layout : paint;
        const value = state ? encodeChannel(state) : undefined;
        if (value === undefined) delete bag[target.key];
        else bag[target.key] = value;
    }

    const encoded: StyleSubLayer = {
        ...origin,
        id: entry.id,
        type: origin.type ?? ROLE_LAYER_TYPE[entry.role],
    };
    if (Object.keys(paint).length > 0 || origin.paint) encoded.paint = paint;
    if (Object.keys(layout).length > 0 || origin.layout) encoded.layout = layout;
    encodeMetadata(encoded, origin, entry);
    setOrDelete(encoded, 'filter', entry.filter);
    setOrDelete(encoded, 'minzoom', entry.minzoom);
    setOrDelete(encoded, 'maxzoom', entry.maxzoom);
    return encoded;
}

/**
 * The two things a style says about itself rather than about its paint.
 *
 * Written into the sublayer's own `metadata`, which is where the legend already
 * looks for a name, and copied rather than mutated: `origin` is the object the
 * layer is still drawing from, so writing through it would make an entry the
 * user did change look untouched.
 */
function encodeMetadata(encoded: StyleSubLayer, origin: StyleSubLayer, entry: StyleEntry): void {
    const current = origin.metadata && typeof origin.metadata === 'object'
        ? origin.metadata as Record<string, unknown>
        : null;
    const authored = metadataLabel(current);
    const title = entry.title?.trim() ?? '';
    const label = entry.noDataLabel?.trim() ?? '';
    if (title === (authored ?? '') && label === String(current?.noDataLabel ?? '')) return;

    const metadata: Record<string, unknown> = { ...(current ?? {}) };
    // `label` is the key the legend reads first, so a title typed here has to
    // land on it even when the sublayer was authored with a `title` instead —
    // otherwise the old one keeps winning and the rename does nothing.
    if (title) metadata.label = title;
    else { delete metadata.label; delete metadata.title; delete metadata['webmapx:title']; }
    if (label) metadata.noDataLabel = label;
    else delete metadata.noDataLabel;

    if (Object.keys(metadata).length > 0) encoded.metadata = metadata;
    else delete encoded.metadata;
}

function setOrDelete(target: StyleSubLayer, key: string, value: unknown): void {
    if (value === undefined) delete target[key];
    else target[key] = value;
}

/**
 * Structural equality over channel states.
 *
 * Deliberately a JSON comparison: a channel state is a small plain object of
 * values that came out of a style document, so there is nothing in one that
 * JSON cannot see, and a hand-written comparison per driver would be four
 * places to forget a field.
 */
export function sameChannel(a: ChannelState | undefined, b: ChannelState | undefined): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    return JSON.stringify(a) === JSON.stringify(b);
}
