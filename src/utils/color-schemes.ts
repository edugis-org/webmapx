/**
 * Colour schemes for classified layers.
 *
 * The data is ColorBrewer's, kept as data rather than pulled from
 * `d3-scale-chromatic` because of the **usage flags** — whether a scheme still
 * reads correctly for a colour-blind reader, in print, on screen, or after a
 * photocopier. Those flags are the most valuable part of ColorBrewer for a
 * teaching product and no popular package ships them.
 *
 * The flags are per *set*, not per scheme: Spectral is fine with three classes
 * and not with nine, so a filter has to know how many classes are being asked
 * for. That is why `colorSchemesFor` takes the class count.
 */
import { COLOR_BREWER } from './color-schemes-data';

/**
 * How well a scheme serves one purpose.
 *
 * `unknown` is ColorBrewer's own silence — the large qualitative sets are
 * unrated — and is kept as itself rather than folded into `bad`, so the UI can
 * say "not rated" instead of claiming the scheme fails. A filter treats it as
 * not meeting the requirement, since an unrated scheme is not evidence of
 * safety.
 */
export type UsageRating = 'ok' | 'maybe' | 'bad' | 'unknown';

/**
 * What a scheme's colours mean.
 *
 * - `seq` (sequential): low → high. One hue, getting darker.
 * - `div` (diverging): low → middle → high, where the middle is meaningful
 *   (zero, an average, a break-even point).
 * - `qual` (qualitative): unordered categories. Distinct hues, no ranking.
 */
export type SchemeType = 'seq' | 'div' | 'qual';

export interface SchemeSet {
    colors: readonly string[];
    blind: UsageRating;
    print: UsageRating;
    screen: UsageRating;
    copy: UsageRating;
}

export interface RawColorScheme {
    name: string;
    type: SchemeType;
    /** Sets from 3 classes upwards: `sets[n - 3]` holds n colours. */
    sets: readonly SchemeSet[];
}

/** One scheme resolved to a concrete number of colours. */
export interface ColorScheme extends SchemeSet {
    name: string;
    type: SchemeType;
    colors: readonly string[];
}

/**
 * What the caller needs the scheme to survive.
 *
 * Per purpose: `'bad'` (the default) means "do not care", `'maybe'` means the
 * scheme must not be outright bad at it, `'ok'` means it must be good at it.
 * Asking for `'ok'` on everything leaves very few schemes, which is honest —
 * a scheme that survives a photocopier and colour blindness at nine classes
 * essentially does not exist.
 */
export interface UsageRequirement {
    blind?: UsageRating;
    print?: UsageRating;
    screen?: UsageRating;
    copy?: UsageRating;
}

export interface SchemeQuery {
    /** Reverses each scheme's colours (dark → light instead of light → dark). */
    reversed?: boolean;
    usage?: UsageRequirement;
}

const USAGE_KEYS = ['blind', 'print', 'screen', 'copy'] as const;

/** The smallest set ColorBrewer defines. Fewer classes are cut out of it. */
const MIN_SET_CLASSES = 3;

function satisfies(set: SchemeSet, usage: UsageRequirement | undefined): boolean {
    if (!usage) return true;
    return USAGE_KEYS.every((key) => {
        const required = usage[key] ?? 'bad';
        if (required === 'bad') return true;
        if (required === 'maybe') return set[key] === 'ok' || set[key] === 'maybe';
        return set[key] === 'ok';
    });
}

function resolve(scheme: RawColorScheme, set: SchemeSet, colors: readonly string[], reversed: boolean): ColorScheme {
    return {
        ...set,
        name: scheme.name,
        type: scheme.type,
        colors: reversed ? [...colors].reverse() : colors,
    };
}

/**
 * Every scheme of `type` that can supply exactly `classCount` colours and meets
 * the usage requirement, in ColorBrewer's own order (which runs roughly from
 * most to least generally useful).
 *
 * One and two classes are cut from the three-class set — ColorBrewer defines
 * nothing smaller — taking the extremes for two and the dark end for one, so a
 * two-class map still reads as low versus high.
 *
 * Returns an empty array rather than a fallback colour: an empty list is a fact
 * the UI can report ("no colour-blind-safe scheme has 9 classes — try fewer"),
 * where a silent fallback to red is a lie.
 */
export function colorSchemesFor(classCount: number, type: SchemeType, query: SchemeQuery = {}): ColorScheme[] {
    const count = Math.floor(classCount);
    if (!Number.isFinite(count) || count < 1) return [];
    const reversed = query.reversed ?? false;

    if (count < MIN_SET_CLASSES) {
        return COLOR_BREWER
            .filter((scheme) => scheme.type === type && satisfies(scheme.sets[0], query.usage))
            .map((scheme) => {
                const [low, , high] = scheme.sets[0].colors;
                // One class takes the far end, so a single-colour map is the
                // strong end of the ramp rather than its washed-out middle.
                const colors = count === 1 ? [high] : [low, high];
                return resolve(scheme, scheme.sets[0], colors, reversed);
            });
    }

    const index = count - MIN_SET_CLASSES;
    return COLOR_BREWER
        .filter((scheme) => scheme.type === type && scheme.sets.length > index && satisfies(scheme.sets[index], query.usage))
        .map((scheme) => resolve(scheme, scheme.sets[index], scheme.sets[index].colors, reversed));
}

/** The largest class count `type` can serve at all, ignoring usage. */
export function maxClassesFor(type: SchemeType): number {
    return COLOR_BREWER
        .filter((scheme) => scheme.type === type)
        .reduce((max, scheme) => Math.max(max, scheme.sets.length + MIN_SET_CLASSES - 1), 0);
}

/** One named scheme at one class count, or null if it does not go that far. */
export function schemeByName(name: string, classCount: number, query: SchemeQuery = {}): ColorScheme | null {
    const scheme = COLOR_BREWER.find((candidate) => candidate.name === name);
    if (!scheme) return null;
    return colorSchemesFor(classCount, scheme.type, query).find((candidate) => candidate.name === name) ?? null;
}

/** All scheme names of one type, for a picker that lists names before colours. */
export function schemeNames(type: SchemeType): string[] {
    return COLOR_BREWER.filter((scheme) => scheme.type === type).map((scheme) => scheme.name);
}

/**
 * A scheme built from the caller's own colours: two stops (from → to) or three
 * (from → via → to), interpolated in sRGB.
 *
 * Deliberately not a dependency. Interpolating in Lab would be smoother, but a
 * ramp between two chosen colours is a straight line however it is drawn, and
 * carrying a colour-science library for fifteen lines is not a trade worth
 * making. The usage flags come back `unknown`: nobody has rated these colours,
 * and claiming otherwise would defeat the point of carrying the ratings.
 */
export function rampScheme(stops: readonly string[], classCount: number): ColorScheme {
    const count = Math.max(1, Math.floor(classCount));
    const points = stops.map(parseHex);
    if (points.some((point) => point === null)) {
        throw new Error(`A colour ramp needs hex colours; got ${stops.join(', ')}.`);
    }
    const known = points as [number, number, number][];
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
        // A single class takes the last stop, matching colorSchemesFor's rule
        // that one colour means the strong end of the ramp.
        const t = count === 1 ? 1 : i / (count - 1);
        colors.push(toHex(interpolate(known, t)));
    }
    return {
        name: 'Custom',
        type: known.length > 2 ? 'div' : 'seq',
        colors,
        blind: 'unknown',
        print: 'unknown',
        screen: 'unknown',
        copy: 'unknown',
    };
}

function interpolate(points: [number, number, number][], t: number): [number, number, number] {
    if (points.length === 1) return points[0];
    const span = 1 / (points.length - 1);
    const segment = Math.min(points.length - 2, Math.floor(t / span));
    const local = (t - segment * span) / span;
    const from = points[segment];
    const to = points[segment + 1];
    return [0, 1, 2].map((i) => from[i] + (to[i] - from[i]) * local) as [number, number, number];
}

function parseHex(color: string): [number, number, number] | null {
    const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
    if (!match) return null;
    const hex = match[1].length === 3 ? match[1].replace(/./g, (c) => c + c) : match[1];
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function toHex(rgb: [number, number, number]): string {
    return `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;
}
