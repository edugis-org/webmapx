/**
 * The inverse of `style-builder.ts`: a paint spec read back as the decisions
 * that would have produced it.
 *
 * Every control in the styler must open showing what the layer currently *is*,
 * and today only three fragments of that exist in the dialog (`authoredColor`,
 * `adoptAuthoredOutline`, `sizeIsAuthoredExpression`), each guessing from one
 * paint key. This reads the expressions themselves.
 *
 * The branch that matters most is the one that gives up. An expression this
 * file does not recognise becomes driver `custom`, carrying the raw JSON, and
 * nothing overwrites it unless the user changes that channel's driver
 * themselves — because silently replacing a hand-authored expression nobody can
 * get back is the worst outcome the styler can produce.
 */
import {
    CHANNEL_KEYS,
    NEIGHBOUR_COLOR_FIELD,
    allChannelsOf,
    type AttributeChannel,
    type ChannelId,
    type ChannelState,
    type SourceStyleModel,
    type StyleEntry,
    type StyleRole,
    type StyleSubLayer,
} from './layer-style-model';
import { metadataLabel } from './layer-label';
import { COMPOSITE_KEY_SEPARATOR, type ColoringKey } from './topological-coloring';
import { schemeByName, schemeNames, type SchemeType } from './color-schemes';

/** The role a GL layer type is drawn as. A `line` over a polygon source is an outline, which the type alone cannot say. */
const ROLE_OF_TYPE: Record<string, StyleRole> = {
    fill: 'fill',
    line: 'line',
    circle: 'circle',
    symbol: 'label',
    background: 'background',
};

export function roleOfLayerType(type: string | undefined, geometry?: string): StyleRole {
    const role = ROLE_OF_TYPE[type ?? ''] ?? 'fill';
    // A line drawn over areas is the polygon's outline, and calling it a `line`
    // would offer it the wrong neighbours in the level-2 dropdown. The source's
    // geometry is the only thing that can tell the two apart.
    if (role === 'line' && geometry && /polygon/i.test(geometry)) return 'outline';
    return role;
}

/** Reads one channel's GL value back as a driver plus its parameters. */
export function decodeChannel(value: unknown): ChannelState | undefined {
    if (value === undefined) return undefined;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return { driver: 'single', value };
    }
    if (Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === 'number')) {
        // A dash array or a text offset is a list of numbers and not an expression at all.
        return { driver: 'single', value: value as number[] };
    }
    if (Array.isArray(value) && isFontStack(value)) {
        return { driver: 'single', value: value as string[] };
    }
    if (!Array.isArray(value)) return { driver: 'custom', expression: value };

    const decoded = decodeExpression(value);
    return decoded ?? { driver: 'custom', expression: value };
}

/**
 * A `text-font` stack: faces, not an expression.
 *
 * Both are arrays whose first element is a string, so the test is whether that
 * string is an operator. A face name has a space in it (`Noto Sans Regular`);
 * no GL operator does, and a one-word face that happens to be an operator's
 * name is not a face any glyph server publishes.
 */
function isFontStack(value: unknown[]): boolean {
    return value.every((entry) => typeof entry === 'string')
        && value.some((entry) => (entry as string).includes(' '));
}

function decodeExpression(expression: unknown[]): ChannelState | undefined {
    const [operator] = expression;
    if (operator === 'case') return decodeCase(expression);
    if (operator === 'step') return decodeStep(expression, undefined);
    if (operator === 'match') return decodeMatch(expression);
    if (operator === '*') return decodeProportional(expression);
    if (operator === 'interpolate') return decodeGrowingProportional(expression) ?? decodeZoomInterpolation(expression);
    return undefined;
}

/**
 * A size that grows with the zoom: `interpolate(linear, zoom, z1, v1, …)`.
 *
 * Half the authored styles in the wild write line width, circle radius and text
 * size this way, and read as `custom` every one of them was read-only — the
 * dike layer's lines could not be made thicker at all without throwing the zoom
 * behaviour away. Only a *linear* interpolation over zoom into numbers is taken:
 * an exponential one, or one over a column, or one producing colours, is a
 * different thing and stays `custom` rather than being flattened into this.
 */
function decodeZoomInterpolation(expression: unknown[]): ChannelState | undefined {
    const [, interpolation, input] = expression;
    if (!Array.isArray(interpolation) || interpolation[0] !== 'linear') return undefined;
    if (!Array.isArray(input) || input[0] !== 'zoom') return undefined;
    const tail = expression.slice(3);
    if (tail.length < 4 || tail.length % 2 !== 0) return undefined;

    const stops: Array<[number, number]> = [];
    for (let i = 0; i < tail.length; i += 2) {
        const zoom = tail[i];
        const value = tail[i + 1];
        if (typeof zoom !== 'number' || typeof value !== 'number') return undefined;
        if (stops.length > 0 && zoom <= stops[stops.length - 1][0]) return undefined;
        stops.push([zoom, value]);
    }
    return { driver: 'zoom', stops };
}

/**
 * The missing-value guard `buildNumericStyle` wraps a `step` in.
 *
 * `to-number` turns null into 0, which would otherwise draw a feature with no
 * value as the lowest class rather than as no data — so the guard is not
 * decoration, and recognising it is what recovers the no-data colour.
 */
function decodeCase(expression: unknown[]): ChannelState | undefined {
    if (expression.length === 6) {
        const [, hasTest, noData, nullTest, noDataAgain, step] = expression;
        const field = fieldOfHasTest(hasTest);
        if (field && noData === noDataAgain && typeof noData === 'string'
            && isNullTest(nullTest, field)
            && Array.isArray(step) && step[0] === 'step') {
            return decodeStep(step, noData);
        }
    }
    return decodeComparisonLadder(expression);
}

/**
 * Classes written as a ladder of comparisons rather than as a `step`.
 *
 * This is the shape real configs are full of — EduGIS wrote every choropleth
 * this way — and not reading it is not a cosmetic loss: the panel showed
 * `a custom expression`, which means no attribute, no class count, no palette
 * and, the reason this was found, **no no-data colour to edit**. The layer in
 * hand paints 49 of 409 neighbourhoods light grey for want of the column, and
 * the only control that could have recoloured them was behind this decode.
 *
 * The ladder is `[guard…] (test, colour)… fallback`, where each test compares
 * one field against an ascending number. It reads as N breaks and N+1 colours:
 * the last colour is the fallback, which is what a `step` paints above its
 * highest break. One difference survives on purpose — a `<=` test includes its
 * own boundary and `step` does not, so a feature sitting exactly on the last
 * boundary moves one class. Rewriting it as two nested expressions to keep that
 * would cost every other control the shape they read.
 */
function decodeComparisonLadder(expression: unknown[]): ChannelState | undefined {
    if (expression.length < 4 || expression.length % 2 !== 0) return undefined;

    let index = 1;
    let field: string | null = null;
    let noDataColor: string | undefined;
    // The guards come first and are about the absence of the value, so they
    // name the field before any comparison does.
    for (;;) {
        const test = expression[index];
        const color = expression[index + 1];
        if (typeof color !== 'string') return undefined;
        const guarded = fieldOfHasTest(test) ?? fieldOfNullTest(test);
        if (!guarded) break;
        if (field && guarded !== field) return undefined;
        // Two guards painting different colours are two different statements,
        // and the styler has one no-data colour: hand the whole thing back.
        if (noDataColor !== undefined && noDataColor !== color) return undefined;
        field = guarded;
        noDataColor = color;
        index += 2;
    }

    const breaks: number[] = [];
    const colors: string[] = [];
    for (; index < expression.length - 1; index += 2) {
        const test = expression[index];
        const color = expression[index + 1];
        if (typeof color !== 'string') return undefined;
        if (!Array.isArray(test) || (test[0] !== '<' && test[0] !== '<=')) return undefined;
        const read = test[1];
        const bound = test[2];
        const name = fieldOfInput(read);
        if (!name || typeof bound !== 'number') return undefined;
        if (field && name !== field) return undefined;
        // Ascending, because that is what makes the ladder a set of ranges at
        // all: an unordered one paints something a `step` cannot express.
        if (breaks.length > 0 && bound <= breaks[breaks.length - 1]) return undefined;
        field = name;
        breaks.push(bound);
        colors.push(color);
    }

    const fallback = expression[expression.length - 1];
    if (!field || colors.length === 0 || typeof fallback !== 'string') return undefined;
    colors.push(fallback);
    return attributeChannel(field, {
        kind: 'ranges', breaks, colors,
        ...(noDataColor === undefined ? {} : { noDataColor }),
    });
}

function fieldOfNullTest(test: unknown): string | null {
    if (!Array.isArray(test) || test[0] !== '==' || test[2] !== null) return null;
    const read = test[1];
    return Array.isArray(read) && read[0] === 'get' && typeof read[1] === 'string' ? read[1] : null;
}

function fieldOfHasTest(test: unknown): string | null {
    if (!Array.isArray(test) || test[0] !== '!' ) return null;
    const inner = test[1];
    if (!Array.isArray(inner) || inner[0] !== 'has' || typeof inner[1] !== 'string') return null;
    return inner[1];
}

function isNullTest(test: unknown, field: string): boolean {
    return Array.isArray(test) && test[0] === '==' && test[2] === null
        && Array.isArray(test[1]) && test[1][0] === 'get' && test[1][1] === field;
}

function decodeStep(expression: unknown[], noDataColor: string | undefined): ChannelState | undefined {
    const field = fieldOfInput(expression[1]);
    // `step` alternates break and colour after its first colour, so the tail is
    // always even; an odd one is an expression shaped like a step but written by
    // someone else, and guessing at it would be worse than handing it back whole.
    if (!field || expression.length < 3 || (expression.length - 3) % 2 !== 0) return undefined;
    const colors: string[] = [];
    const breaks: number[] = [];
    if (typeof expression[2] !== 'string') return undefined;
    colors.push(expression[2]);
    for (let i = 3; i < expression.length; i += 2) {
        const brk = expression[i];
        const color = expression[i + 1];
        if (typeof brk !== 'number' || typeof color !== 'string') return undefined;
        breaks.push(brk);
        colors.push(color);
    }
    return attributeChannel(field, { kind: 'ranges', breaks, colors, ...(noDataColor === undefined ? {} : { noDataColor }) });
}

/**
 * The feature key a keyed neighbour colouring matches on, or null.
 *
 * The inverse of `coloringKeyExpression`: a feature's id as a string, or a
 * `concat` of columns joined by the composite separator — including the
 * one-column `concat` that marks a key rather than a category.
 */
function coloringKeyOfInput(input: unknown): ColoringKey | null {
    if (!Array.isArray(input)) return null;
    if (input[0] === 'to-string' && Array.isArray(input[1]) && input[1][0] === 'id' && input[1].length === 1) {
        return { kind: 'id' };
    }
    if (input[0] !== 'concat' || input.length < 2 || input.length % 2 !== 0) return null;
    const names: string[] = [];
    for (let i = 1; i < input.length; i++) {
        const part = input[i];
        // Columns at odd positions, the separator between them.
        if (i % 2 === 0) {
            if (part !== COMPOSITE_KEY_SEPARATOR) return null;
            continue;
        }
        if (!Array.isArray(part) || part[0] !== 'to-string') return null;
        const get = part[1];
        if (!Array.isArray(get) || get[0] !== 'get' || typeof get[1] !== 'string' || get.length !== 2) return null;
        names.push(get[1]);
    }
    if (names.length === 0) return null;
    return names.length === 1 ? { kind: 'property', name: names[0] } : { kind: 'properties', names };
}

/** A `match` on a feature key: a neighbour colouring the data could not carry. */
function decodeKeyedNeighbours(expression: unknown[], key: ColoringKey): ChannelState | undefined {
    if (expression.length < 5 || expression.length % 2 !== 1) return undefined;
    const colors: string[] = [];
    const assignments: Array<[string, number]> = [];
    for (let i = 2; i < expression.length - 1; i += 2) {
        const value = expression[i];
        const color = expression[i + 1];
        if (typeof value !== 'string' || typeof color !== 'string') return undefined;
        let index = colors.indexOf(color);
        if (index < 0) index = colors.push(color) - 1;
        assignments.push([value, index]);
    }
    const fallback = expression[expression.length - 1];
    return {
        driver: 'neighbours',
        key,
        assignments,
        colors,
        ...(typeof fallback === 'string' ? { fallbackColor: fallback } : {}),
    };
}

function decodeMatch(expression: unknown[]): ChannelState | undefined {
    const input = expression[1];
    const key = coloringKeyOfInput(input);
    if (key) return decodeKeyedNeighbours(expression, key);
    const raw = Array.isArray(input) && input[0] === 'get' && typeof input[1] === 'string';
    const field = raw ? (input as unknown[])[1] as string : fieldOfInput(input);
    // A `match` is input, then key/value pairs, then its required fallback.
    if (!field || expression.length < 5 || expression.length % 2 !== 1) return undefined;

    const values: string[] = [];
    const colors: string[] = [];
    for (let i = 2; i < expression.length - 1; i += 2) {
        const key = expression[i];
        const color = expression[i + 1];
        if (typeof color !== 'string') return undefined;
        if (typeof key !== 'string' && typeof key !== 'number') return undefined;
        values.push(String(key));
        colors.push(color);
    }
    const fallback = expression[expression.length - 1];
    const fallbackColor = typeof fallback === 'string' ? fallback : undefined;

    // The neighbour colouring writes a class index into the data and matches on
    // it raw. It is a driver of its own because a colour there names no value:
    // it has a colour count instead of a class count, and no legend.
    if (raw && field === NEIGHBOUR_COLOR_FIELD) {
        return { driver: 'neighbours', attribute: field, colors, ...(fallbackColor === undefined ? {} : { fallbackColor }) };
    }
    return attributeChannel(field, {
        kind: 'categories',
        values,
        colors,
        ...(fallbackColor === undefined ? {} : { fallbackColor }),
        ...(raw ? { rawKeys: true } : {}),
    });
}

/** `coefficient × √value` — a proportional symbol, which has no classes by design. */
function decodeProportional(expression: unknown[]): ChannelState | undefined {
    if (expression.length !== 3 || typeof expression[1] !== 'number') return undefined;
    const sqrt = expression[2];
    if (!Array.isArray(sqrt) || sqrt[0] !== 'sqrt') return undefined;
    const get = sqrt[1];
    if (!Array.isArray(get) || get[0] !== 'get' || typeof get[1] !== 'string') return undefined;
    return attributeChannel(get[1], { kind: 'proportional', coefficient: expression[1] });
}

/**
 * A proportional symbol that grows with zoom: two zoom stops of the same
 * column, whose coefficients differ by exactly the interpolation's base per
 * level. Anything else zoom-driven is left to the other decoders.
 */
function decodeGrowingProportional(expression: unknown[]): ChannelState | undefined {
    if (expression.length !== 7) return undefined;
    const [, interpolation, input, z0, low, z1, high] = expression;
    if (!Array.isArray(interpolation) || interpolation[0] !== 'exponential' || typeof interpolation[1] !== 'number') return undefined;
    if (!Array.isArray(input) || input[0] !== 'zoom') return undefined;
    if (typeof z0 !== 'number' || typeof z1 !== 'number' || z1 <= z0) return undefined;
    const a = Array.isArray(low) ? decodeProportional(low) : undefined;
    const b = Array.isArray(high) ? decodeProportional(high) : undefined;
    if (a?.driver !== 'attribute' || b?.driver !== 'attribute' || a.attribute !== b.attribute) return undefined;
    if (a.classification.kind !== 'proportional' || b.classification.kind !== 'proportional') return undefined;
    const zoomFactor = interpolation[1];
    const c0 = a.classification.coefficient;
    const expected = c0 * zoomFactor ** (z1 - z0);
    if (Math.abs(b.classification.coefficient - expected) > 1e-9 * Math.abs(expected)) return undefined;
    return attributeChannel(a.attribute, { kind: 'proportional', coefficient: c0 / zoomFactor ** z0, zoomFactor });
}

/** The column an expression reads, through `to-number` or `to-string` or neither. */
function fieldOfInput(input: unknown): string | null {
    if (!Array.isArray(input)) return null;
    if (input[0] === 'get') return typeof input[1] === 'string' ? input[1] : null;
    if (input[0] === 'to-number' || input[0] === 'to-string') return fieldOfInput(input[1]);
    return null;
}

function attributeChannel(attribute: string, classification: AttributeChannel['classification']): AttributeChannel {
    const colors = classification.kind === 'proportional' ? [] : classification.colors;
    const schemeName = schemeNameFor(colors);
    return { driver: 'attribute', attribute, classification, ...(schemeName ? { schemeName } : {}) };
}

const SCHEME_TYPES: SchemeType[] = ['seq', 'div', 'qual'];

/**
 * Which catalog scheme a palette came from, if any.
 *
 * Display only — the colours themselves are already in the classification — so
 * a palette that matches nothing (a ramp the user built, a hand-picked list)
 * costs nothing and simply has no name.
 */
export function schemeNameFor(colors: readonly string[]): string | null {
    if (colors.length < 3) return null;
    for (const type of SCHEME_TYPES) {
        for (const name of schemeNames(type)) {
            const scheme = schemeByName(name, colors.length);
            if (!scheme) continue;
            if (scheme.colors.length !== colors.length) continue;
            if (scheme.colors.every((color, i) => sameColor(color, colors[i]))) return name;
        }
    }
    return null;
}

function sameColor(a: string, b: string): boolean {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** One sublayer read back as a style entry. */
export function decodeStyleEntry(sublayer: StyleSubLayer, geometry?: string): StyleEntry {
    const role = roleOfLayerType(sublayer.type, geometry);
    const keys = CHANNEL_KEYS[role] ?? {};
    const channels: Partial<Record<ChannelId, ChannelState>> = {};
    for (const channel of allChannelsOf(role)) {
        const target = keys[channel];
        if (!target) continue;
        const bag = target.slot === 'layout' ? sublayer.layout : sublayer.paint;
        const state = decodeChannel(bag?.[target.key]);
        if (state) channels[channel] = state;
    }
    const entry: StyleEntry = {
        id: sublayer.id ?? '',
        role,
        channels,
        origin: sublayer,
        // A copy, so an edit to `channels` cannot reach through and make the
        // entry look untouched — which would silently drop the user's change.
        originChannels: JSON.parse(JSON.stringify(channels)) as Partial<Record<ChannelId, ChannelState>>,
    };
    // The name and the no-data wording are the sublayer's own metadata, which is
    // where the legend reads them from — so the panel opens on what the legend
    // is already showing rather than on a second copy of it.
    const metadata = sublayer.metadata && typeof sublayer.metadata === 'object'
        ? sublayer.metadata as Record<string, unknown>
        : null;
    const title = metadataLabel(metadata);
    if (title) entry.title = title;
    if (typeof metadata?.noDataLabel === 'string' && metadata.noDataLabel.length > 0) {
        entry.noDataLabel = metadata.noDataLabel;
    }
    if (sublayer.filter !== undefined) entry.filter = sublayer.filter;
    if (typeof sublayer.minzoom === 'number') entry.minzoom = sublayer.minzoom;
    if (typeof sublayer.maxzoom === 'number') entry.maxzoom = sublayer.maxzoom;
    return entry;
}

/** Every sublayer drawn from one source, as the level-1 style list. */
export function decodeSourceStyles(
    sourceId: string,
    sublayers: readonly StyleSubLayer[],
    options: { geometry?: string; completeData?: boolean } = {},
): SourceStyleModel {
    return {
        sourceId,
        entries: sublayers.map((sublayer) => decodeStyleEntry(sublayer, options.geometry)),
        ...(options.completeData === undefined ? {} : { completeData: options.completeData }),
    };
}
