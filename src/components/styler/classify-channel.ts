/**
 * Level 4: turning a column and a method into a channel the map can draw.
 *
 * The arithmetic already exists — `classification.ts` works out the breaks,
 * `color-schemes.ts` supplies the palette — so what is here is the join between
 * them and the styler's channel model, and the defaults that let level 4 open
 * *already answered*. That last part is the requirement: a classification the
 * user has to assemble before anything appears on the map is a form; one that
 * arrives at quantiles over five classes in a colour-blind-safe scheme, and
 * invites them to disagree, is a map they are already looking at.
 *
 * Deliberately no rendering and no engine: the same settings produce the same
 * channel in a test as in the panel.
 */
import {
    classifyCategorical,
    classifyNumeric,
    numericValues,
    suggestSchemeType,
    type ClassificationMethod,
} from '../../utils/classification';
import {
    colorSchemesFor,
    maxClassesFor,
    type ColorScheme,
    type SchemeType,
} from '../../utils/color-schemes';
import { NO_DATA_COLOR, buildProportionalRadius } from '../../utils/style-builder';
import { colorGroupsByAdjacency } from '../../utils/topological-coloring';
import type { AttributeChannel } from '../../utils/layer-style-model';

/** The level-4 answers, as the panel holds them per channel. */
export interface ClassifySettings {
    attribute: string;
    method: ClassificationMethod;
    classCount: number;
    schemeName: string | null;
    reversed: boolean;
    /** Restrict the palette list to schemes that survive colour blindness. */
    blindSafe: boolean;
    /** Categories only: how many get a colour of their own before the tail shares one. */
    maxCategories: number;
    /**
 * Categories only: every value gets a colour, repeating the palette.
     *
     * `null` means use the styler default: repeat. The old alternative greyed
     * out the tail, which was a filtering operation disguised as classification.
     */
    cycle: boolean | null;
    /**
     * What a feature with no value for the column is painted.
     *
     * Held here rather than read back off the classification because every
     * change on this panel rebuilds the channel from these settings: a colour
     * left in the expression alone would be overwritten by the default the
     * moment the user moved any other control.
     */
    noDataColor: string;
    /** Round breaks even where a few features change class (`roundBreaks`). */
    niceBreaks?: boolean;
}

export const DEFAULT_CLASS_COUNT = 5;
export const DEFAULT_MAX_CATEGORIES = 8;

export const METHOD_LABELS: Record<ClassificationMethod, string> = {
    naturalBreaks: 'Natural breaks',
    quantile: 'Equal count',
    geometric: 'Each class a step bigger',
    equalInterval: 'Equal intervals',
    standardDeviation: 'Standard deviation',
    manual: 'Manual',
};

export const METHOD_HINTS: Record<ClassificationMethod, string> = {
    naturalBreaks: 'Puts the boundaries where the data has gaps. A good first choice.',
    quantile: 'Every class holds the same number of features. Always a full-looking map.',
    geometric: 'Each class covers a multiple of the one below. For data with a long tail.',
    equalInterval: 'Classes of equal width. Honest, but skewed data crowds into one class.',
    standardDeviation: 'Distance from the average. For data spread evenly around a middle.',
    manual: 'Type the boundaries yourself.',
};

/** Methods the panel offers, in the order it offers them. Manual needs an editor this build has not got. */
export const OFFERED_METHODS: ClassificationMethod[] = [
    'naturalBreaks', 'quantile', 'geometric', 'equalInterval', 'standardDeviation',
];

/**
 * When one class holds this much of the layer, the map is one colour with a few
 * specks and the method chosen is telling the student nothing.
 */
export const CROWDED_CLASS_SHARE = 0.8;

export function defaultSettings(attribute: string): ClassifySettings {
    return {
        attribute,
        method: 'quantile',
        classCount: DEFAULT_CLASS_COUNT,
        schemeName: null,
        reversed: false,
        blindSafe: false,
        maxCategories: DEFAULT_MAX_CATEGORIES,
        cycle: null,
        noDataColor: NO_DATA_COLOR,
    };
}

/** Whether a column holds numbers, judged from the type the attribute scan inferred. */
export function isNumericType(type: string | undefined): boolean {
    return type === 'number' || type === 'integer' || type === 'float';
}

/** The palettes on offer for a given number of classes. */
export function schemesFor(
    colorCount: number,
    type: SchemeType,
    settings: Pick<ClassifySettings, 'reversed' | 'blindSafe'>,
): ColorScheme[] {
    return colorSchemesFor(colorCount, type, {
        reversed: settings.reversed,
        usage: settings.blindSafe ? { blind: 'ok' } : undefined,
    });
}

export interface ClassifyResult {
    channel: AttributeChannel;
    /** Labels for the classes, in draw order — what a legend would list. */
    legend: { color: string; label: string }[];
    /** Said out loud rather than left to be noticed on the map. */
    warning?: string;
}

/**
 * Why no classification could be made, in words the panel can show.
 *
 * A separate outcome rather than `null`, because the two causes need different
 * answers from the user and one of them is easy to walk into: ColorBrewer rates
 * **no** qualitative scheme colour-blind-safe above four classes, and the palettes added for it stop at nine, so ticking
 * that box on a categorical map leaves nothing to draw with. Returning nothing
 * at all there is a panel that stops responding for a reason it knows and will
 * not say.
 */
export interface ClassifyProblem {
    channel: null;
    problem: string;
}

export type ClassifyOutcome = ClassifyResult | ClassifyProblem;

function noScheme(colorCount: number, type: SchemeType, settings: ClassifySettings): ClassifyProblem {
    if (settings.blindSafe) {
        return {
            channel: null,
            problem: type === 'qual'
                ? `No colour-blind-safe palette has ${colorCount} distinct colours — the largest colour-blind-safe palette (Tol muted) has nine. Use fewer categories, or turn the filter off.`
                : `No colour-blind-safe palette has ${colorCount} classes. Use fewer, or turn the filter off.`,
        };
    }
    return { channel: null, problem: `No palette has ${colorCount} classes. Use fewer.` };
}

/**
 * A colour channel driven by a column.
 *
 * Returns `null` rather than a grey fallback when the column has nothing usable
 * in it: an empty answer is a fact the panel can report, where a silent
 * fallback is a map that lies about its data.
 */
export function classifyColorChannel(
    features: readonly GeoJSON.Feature[],
    numeric: boolean,
    settings: ClassifySettings,
): ClassifyOutcome | null {
    return numeric ? numericChannel(features, settings) : categoricalChannel(features, settings);
}

function numericChannel(features: readonly GeoJSON.Feature[], settings: ClassifySettings): ClassifyOutcome | null {
    const { values, missing } = numericValues(features, settings.attribute);
    if (values.length === 0) return null;

    const classification = classifyNumeric(values, {
        method: settings.method,
        classCount: settings.classCount,
        missing,
        niceBreaks: settings.niceBreaks,
    });
    const classes = classification.classes;
    if (classes.length === 0) return null;

    // A diverging scheme when the data crosses zero, because the middle then
    // means something; sequential otherwise.
    const type = suggestSchemeType(classification);
    const scheme = pickScheme(classes.length, type, settings);
    if (!scheme) return noScheme(classes.length, type, settings);

    const colors = [...scheme.colors];
    const channel: AttributeChannel = {
        driver: 'attribute',
        attribute: settings.attribute,
        classification: {
            kind: 'ranges',
            breaks: [...classification.breaks],
            colors,
            // The guard that makes a missing value read as no data rather than
            // as the lowest class — `to-number` turns null into 0.
            noDataColor: settings.noDataColor,
        },
        schemeName: scheme.name,
    };

    const legend = classes.map((cls, index) => ({
        color: colors[index],
        label: `${formatBound(cls.min)} – ${formatBound(cls.max)}`,
    }));

    // Skew is the normal case, not an edge case: natural breaks puts 64 of 73
    // countries in one class on population density. A map that is one colour
    // with a few specks is worth saying out loud.
    const total = classes.reduce((sum, cls) => sum + cls.count, 0);
    const biggest = Math.max(...classes.map((cls) => cls.count));
    const crowded = total > 0 && biggest / total > CROWDED_CLASS_SHARE;
    return {
        channel,
        legend,
        ...(crowded
            ? { warning: `One class holds ${Math.round((biggest / total) * 100)}% of the features. Try another method, or fewer classes.` }
            : {}),
    };
}

/**
 * Whether every value gets a colour. The styler default is to repeat colours:
 * no categorical value silently falls into a grey tail.
 */
export function cyclesCategories(
    _features: readonly GeoJSON.Feature[],
    settings: ClassifySettings,
): boolean {
    if (settings.cycle !== null) return settings.cycle;
    return true;
}

export function categoricalPaletteColorCount(
    features: readonly GeoJSON.Feature[],
    settings: ClassifySettings,
): number {
    if (cyclesCategories(features, settings)) {
        return Math.min(settings.maxCategories, maxClassesFor('qual'));
    }
    const classification = classifyCategorical(features, settings.attribute, { maxCategories: settings.maxCategories });
    return classification.categories.length;
}

function categoricalChannel(features: readonly GeoJSON.Feature[], settings: ClassifySettings): ClassifyOutcome | null {
    if (cyclesCategories(features, settings)) {
        // Every value gets a colour, repeating the palette: the map is complete
        // and the legend is meaningless, which is the honest trade for a layer
        // of 250 regions nobody is going to read off a key.
        const all = classifyCategorical(features, settings.attribute, { maxCategories: Number.MAX_SAFE_INTEGER });
        if (all.categories.length === 0) return null;
        const wanted = Math.min(settings.maxCategories, maxClassesFor('qual'));
        const scheme = pickScheme(wanted, 'qual', settings);
        if (!scheme) return noScheme(wanted, 'qual', settings);

        const values = all.categories.map((category) => String(category.value));
        // Which palette colour each value takes, worked out so that values whose
        // features *touch* land on different colours — the same graph colouring
        // `By neighbours` uses, applied to the groups a column defines. Cycling
        // by position instead puts the same colour either side of a border often
        // enough to be the normal case, and a border that vanishes is the one
        // thing the map exists to show.
        const indexOfValue = new Map(values.map((value, index) => [value, index]));
        const byAdjacency = colorGroupsByAdjacency(
            features,
            (feature) => indexOfValue.get(String(feature.properties?.[settings.attribute])) ?? null,
            values.length,
            scheme.colors.length,
        );
        const colors = values.map((_, index) =>
            scheme.colors[(byAdjacency?.[index] ?? index) % scheme.colors.length]);

        return {
            channel: {
                driver: 'attribute',
                attribute: settings.attribute,
                classification: {
                    kind: 'categories',
                    values,
                    colors,
                    fallbackColor: settings.noDataColor,
                },
                schemeName: scheme.name,
            },
            // Named after all: the paint is a `match` on the value, so the legend
            // reads the keys back and labels each colour with the value it draws
            // — the colours repeat, but every entry still says what it is.
            legend: values.map((value, index) => ({ color: colors[index], label: value })),
            ...(values.length > scheme.colors.length
                ? { warning: `${values.length} values share ${scheme.colors.length} colours, so two areas far apart may match. Touching ones do not.` }
                : {}),
        };
    }

    const classification = classifyCategorical(features, settings.attribute, { maxCategories: settings.maxCategories });
    if (classification.categories.length === 0) return null;
    const scheme = pickScheme(classification.categories.length, 'qual', settings);
    if (!scheme) return noScheme(classification.categories.length, 'qual', settings);

    const colors = [...scheme.colors].slice(0, classification.categories.length);
    const legend = classification.categories.map((category, index) => ({
        color: colors[index],
        label: String(category.value),
    }));
    const tail = classification.otherValues;
    if (tail > 0) legend.push({ color: settings.noDataColor, label: 'other' });

    return {
        channel: {
            driver: 'attribute',
            attribute: settings.attribute,
            classification: {
                kind: 'categories',
                values: classification.categories.map((category) => String(category.value)),
                colors,
                fallbackColor: settings.noDataColor,
            },
            schemeName: scheme.name,
        },
        legend,
        ...(tail > 0
            ? { warning: `${tail} more value${tail === 1 ? '' : 's'} share one grey. Raise the limit, or give every value a colour.` }
            : {}),
    };
}

/**
 * A size channel driven by a column: `coefficient × √value`, no classes.
 *
 * A quantity drawn as a circle does not want breaks — twice the value should
 * draw twice the *area*, and a class boundary throws that reading away.
 */
export function classifySizeChannel(
    features: readonly GeoJSON.Feature[],
    attribute: string,
    maxRadius: number,
): ClassifyResult | null {
    const { values } = numericValues(features, attribute);
    const max = Math.max(...values, 0);
    if (values.length === 0 || max <= 0) return null;
    const { coefficient } = buildProportionalRadius({ field: attribute, maxValue: max, maxRadius });
    return {
        channel: {
            driver: 'attribute',
            attribute,
            classification: { kind: 'proportional', coefficient },
        },
        legend: [],
    };
}

/**
 * The scheme to use: the one asked for, else the first that fits.
 *
 * Falls back rather than failing, because the class count can move out from
 * under a chosen scheme — a palette that stops at 8 cannot serve 9 classes —
 * and losing the palette is a smaller surprise than losing the map.
 */
function pickScheme(colorCount: number, type: SchemeType, settings: ClassifySettings): ColorScheme | null {
    const schemes = schemesFor(colorCount, type, settings);
    if (schemes.length === 0) return null;
    return schemes.find((scheme) => scheme.name === settings.schemeName) ?? schemes[0];
}

/** A class bound as a legend would say it: no exponent, no fifteen decimals. */
function formatBound(value: number): string {
    if (!Number.isFinite(value)) return '?';
    const magnitude = Math.abs(value);
    const decimals = magnitude >= 100 ? 0 : magnitude >= 1 ? 1 : 3;
    return Number(value.toFixed(decimals)).toLocaleString('en-US');
}
