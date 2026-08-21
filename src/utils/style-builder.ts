/**
 * Turning a classification plus a colour scheme into a paint spec.
 *
 * The output is a MapLibre GL paint object, because that is what every engine
 * here already consumes: MapLibre and OpenLayers natively, Leaflet and Cesium
 * through `utils/maplibre-expression-evaluator.ts`. Nothing engine-specific
 * belongs in this file — a style that only one engine can draw is a style the
 * UI must not offer (see `docs/developer/layer-style-ui.md`, §7).
 *
 * Two expression shapes, and the difference matters:
 *
 * - Ranges use **`step`**: `['step', value, c0, b1, c1, b2, c2]` — everything
 *   below `b1` is `c0`, and there is no gap. A value outside the classified
 *   range still gets a colour, which is what makes a tiled layer honest when
 *   panning brings in values the classification never saw.
 * - Categories use **`match`**: `['match', value, k1, c1, k2, c2, fallback]`.
 *   `match` requires its fallback, and that fallback is what an unseen category
 *   is drawn with.
 *
 * The legend reads both shapes already (`deriveLayerSwatch`, and the legend's
 * own `match`/`case` handling), including the convention that a class labelled
 * `''` is hidden from it.
 */
import type { CategoricalClassification, NumericClassification } from './classification';
import type { ColorScheme } from './color-schemes';

/**
 * What a layer is being drawn as. Not the same thing as the geometry: one
 * polygon source can be drawn as areas *and* as outlines, which is two roles
 * over one source and the reason a layer can hold several sublayers.
 */
export type StyleRole = 'fill' | 'outline' | 'line' | 'circle' | 'label';

/** The GL layer type each role becomes. */
export const ROLE_LAYER_TYPE: Record<StyleRole, string> = {
    fill: 'fill',
    outline: 'line',
    line: 'line',
    circle: 'circle',
    label: 'symbol',
};

/** The paint property each role colours. */
export const ROLE_COLOR_KEY: Record<StyleRole, string> = {
    fill: 'fill-color',
    outline: 'line-color',
    line: 'line-color',
    circle: 'circle-color',
    label: 'text-color',
};

/** The paint property each role fades. */
export const ROLE_OPACITY_KEY: Record<StyleRole, string> = {
    fill: 'fill-opacity',
    outline: 'line-opacity',
    line: 'line-opacity',
    circle: 'circle-opacity',
    label: 'text-opacity',
};

/**
 * The paint property that sets each role's *size*, and the range a UI should
 * offer for it. Fill has none: an area's size is its geometry.
 */
export const ROLE_SIZE: Partial<Record<StyleRole, { key: string; min: number; max: number; step: number; label: string; unit: string }>> = {
    outline: { key: 'line-width', min: 0.5, max: 12, step: 0.5, label: 'Width', unit: ' px' },
    line: { key: 'line-width', min: 0.5, max: 12, step: 0.5, label: 'Width', unit: ' px' },
    circle: { key: 'circle-radius', min: 1, max: 30, step: 1, label: 'Size', unit: ' px' },
    label: { key: 'text-size', min: 8, max: 40, step: 1, label: 'Text size', unit: ' px' },
};

/**
 * Colour for features the classification says nothing about: a missing value, a
 * category not in the list, or — on a tiled layer — a value that arrived after
 * the classes were made. Deliberately a light grey rather than a scheme colour,
 * so "no data" never reads as a value.
 */
export const NO_DATA_COLOR = '#cccccc';

export interface LegendEntry {
    color: string;
    /** Shown in the legend. `''` hides the entry — the existing convention. */
    label: string;
}

export interface BuiltStyle {
    /** GL layer type for this role. */
    type: string;
    paint: Record<string, unknown>;
    /** What the legend should list, in draw order. */
    legend: LegendEntry[];
}

export interface NumericStyleOptions {
    role: StyleRole;
    field: string;
    classification: NumericClassification;
    scheme: ColorScheme;
    /** Formats a class bound for its legend label. Default: a short number. */
    formatValue?: (value: number) => string;
    /** Unit appended to every class label. Convention: it carries its own leading space. */
    unit?: string;
    /**
     * Whether to show a legend entry for features with no value. Off by default:
     * on a complete dataset there are none, and an entry nothing matches is
     * noise. The *colour* is applied either way.
     */
    showNoData?: boolean;
    noDataColor?: string;
    opacity?: number;
}

export interface CategoricalStyleOptions {
    role: StyleRole;
    field: string;
    classification: CategoricalClassification;
    scheme: ColorScheme;
    /** Turns a raw value into a legend label — where a `valuemap` is applied. */
    formatCategory?: (value: string | number | boolean) => string;
    /** Label for everything past the category limit. `''` hides it. */
    otherLabel?: string;
    otherColor?: string;
    opacity?: number;
}

/**
 * Ranges → a `step` expression.
 *
 * `step` needs one more colour than it has breaks; a scheme with the wrong
 * count is an error rather than something to pad, because padding would put two
 * classes in one colour and the map would silently lie about how many there are.
 */
export function buildNumericStyle(options: NumericStyleOptions): BuiltStyle {
    const { classification, scheme, field, role } = options;
    const classes = classification.classes;
    const colors = scheme.colors;
    if (classes.length === 0) {
        throw new Error('Nothing to classify: the field has no usable numbers.');
    }
    if (colors.length !== classes.length) {
        throw new Error(`The scheme has ${colors.length} colours for ${classes.length} classes.`);
    }

    const noDataColor = options.noDataColor ?? NO_DATA_COLOR;
    const value: unknown[] = ['to-number', ['get', field]];

    // Single class: no expression at all. A one-colour layer should be a plain
    // colour, so a legend and a swatch can read it without evaluating anything.
    const colorExpression: unknown = classes.length === 1
        ? colors[0]
        : [
            'case',
            // Missing values first: `to-number` turns null into 0, which would
            // otherwise be drawn as the lowest class rather than as no data.
            ['!', ['has', field]], noDataColor,
            ['==', ['get', field], null], noDataColor,
            ['step', value, colors[0], ...classification.breaks.flatMap((brk, i) => [brk, colors[i + 1]])],
        ];

    const format = options.formatValue ?? defaultFormat;
    const unit = options.unit ?? '';
    const legend: LegendEntry[] = classes.map((cls, i) => ({
        color: colors[i],
        label: `${format(cls.min)} – ${format(cls.max)}${unit}`,
    }));
    if (options.showNoData) legend.push({ color: noDataColor, label: 'no data' });

    return {
        type: ROLE_LAYER_TYPE[role],
        paint: withOpacity({ [ROLE_COLOR_KEY[role]]: colorExpression }, role, options.opacity),
        legend,
    };
}

/**
 * Categories → a `match` expression.
 *
 * The keys are the raw values, not their labels: `match` compares against what
 * the data holds. Labels are the legend's business, which is what makes a
 * `valuemap` (or a translation) a display concern only.
 */
export function buildCategoricalStyle(options: CategoricalStyleOptions): BuiltStyle {
    const { classification, scheme, field, role } = options;
    const categories = classification.categories;
    const colors = scheme.colors;
    if (categories.length === 0) {
        throw new Error('Nothing to classify: the field has no usable values.');
    }
    if (colors.length < categories.length) {
        throw new Error(`The scheme has ${colors.length} colours for ${categories.length} categories.`);
    }

    const otherColor = options.otherColor ?? NO_DATA_COLOR;
    // Compared as strings so that a numeric code stored as 3 in one feature and
    // "3" in another lands in the same class — mixed types in one column are the
    // norm in real data, not an edge case.
    const colorExpression: unknown = ['match', ['to-string', ['get', field]],
        ...categories.flatMap((category, i) => [String(category.value), colors[i]]),
        otherColor];

    const format = options.formatCategory ?? ((value: string | number | boolean) => String(value));
    const legend: LegendEntry[] = categories.map((category, i) => ({
        color: colors[i],
        label: format(category.value),
    }));

    // The fallback is only worth a legend entry when something can fall into it.
    // Its label follows the existing convention: '' keeps it off the legend.
    const hasOther = classification.otherCount > 0 || classification.missing > 0;
    if (hasOther) {
        const label = options.otherLabel ?? 'other';
        if (label !== '') legend.push({ color: otherColor, label });
    }

    return {
        type: ROLE_LAYER_TYPE[role],
        paint: withOpacity({ [ROLE_COLOR_KEY[role]]: colorExpression }, role, options.opacity),
        legend,
    };
}

export interface KeyedColorOptions {
    role: StyleRole;
    /** How the expression names a feature: its GeoJSON id, or a unique property. */
    key: { kind: 'id' } | { kind: 'property'; name: string };
    /** One entry per feature: the key value, and which scheme colour it takes. */
    entries: readonly { key: string | number; colorIndex: number }[];
    scheme: ColorScheme;
    /** Colour for a feature the list does not mention. */
    fallbackColor?: string;
    opacity?: number;
}

/**
 * A colour per feature, addressed by key — what a topological colouring needs.
 *
 * The legend is deliberately empty: the colours mean nothing individually, so a
 * legend listing them would be a list of noise. That is the existing convention
 * (a class labelled `''` is hidden) applied to a whole style.
 *
 * A layer of thousands of regions produces a `match` with thousands of branches.
 * That is fine for MapLibre (the expression is compiled once) but it is a large
 * style document, so the caller should think twice before saving one to a config
 * for a layer of that size.
 */
export function buildKeyedColorStyle(options: KeyedColorOptions): BuiltStyle {
    const { role, key, entries, scheme } = options;
    if (entries.length === 0) {
        throw new Error('Nothing to colour: no features were given a colour index.');
    }
    const fallback = options.fallbackColor ?? NO_DATA_COLOR;
    const input = key.kind === 'id' ? ['to-string', ['id']] : ['to-string', ['get', key.name]];

    const colorExpression: unknown = ['match', input,
        ...entries.flatMap((entry) => [String(entry.key), scheme.colors[entry.colorIndex % scheme.colors.length]]),
        fallback];

    return {
        type: ROLE_LAYER_TYPE[role],
        paint: withOpacity({ [ROLE_COLOR_KEY[role]]: colorExpression }, role, options.opacity),
        legend: [],
    };
}

/** One colour for the whole layer — the simple tier, and every engine can draw it. */
export function buildSingleStyle(role: StyleRole, color: string, opacity?: number): BuiltStyle {
    return {
        type: ROLE_LAYER_TYPE[role],
        paint: withOpacity({ [ROLE_COLOR_KEY[role]]: color }, role, opacity),
        legend: [{ color, label: '' }],
    };
}

function withOpacity(paint: Record<string, unknown>, role: StyleRole, opacity?: number): Record<string, unknown> {
    if (opacity === undefined) return paint;
    return { ...paint, [ROLE_OPACITY_KEY[role]]: Math.min(1, Math.max(0, opacity)) };
}

/**
 * A number as a legend would say it: no exponent, no fifteen decimals, and
 * thousands separated so 1250000 does not have to be counted digit by digit.
 */
function defaultFormat(value: number): string {
    if (!Number.isFinite(value)) return '?';
    const magnitude = Math.abs(value);
    const decimals = magnitude >= 100 ? 0 : magnitude >= 1 ? 1 : 3;
    return Number(value.toFixed(decimals)).toLocaleString('en-US');
}
