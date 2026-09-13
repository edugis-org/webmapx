/**
 * Numbers as a legend should say them.
 *
 * Rounding happens **here and nowhere else**. `classification.ts` hands over the
 * breaks it actually divided the data with, because moving a break to a tidier
 * number moves features between classes — the classification answering a
 * question nobody asked. Measured on building years: snapping the breaks put
 * them on century boundaries, so nine classes came back as five, and the legend
 * then read "2K – 2K" three rows running, which is both wrong and meaningless.
 *
 * So the legend rounds for display only, under two rules. Neither assumes
 * anything about what the numbers *mean* — nothing in a column says whether it
 * holds years, metres, degrees or euros:
 *
 * - **Two different breaks never print the same.** That is what decides how
 *   many decimals are shown, and whether a compact suffix may be used at all:
 *   "2K" for both 1723 and 1985 is two classes claiming the same bounds, and a
 *   suffix is allowed only where it survives that test. Measured against the
 *   set, not assumed from the magnitude.
 * - **Four digits are printed without a thousands separator**, the SI
 *   convention, so 1650 does not read as a different kind of number than 650.
 */

/**
 * Below this, a number is printed without a thousands separator.
 *
 * The SI convention: groups of three above four digits, four digits left alone.
 */
const GROUPING_FLOOR = 1e4;

/** Past this, decimals are longer than the panel and invisible to the eye. */
const MAX_DECIMALS = 4;

export interface LegendNumberOptions {
    /** Appended verbatim — unit strings carry their own leading space. */
    unit?: string;
    /** Decimals to show, usually from `decimalsToDistinguish`. */
    decimals?: number;
    /** False forbids a `M`/`B` suffix, for a set where one would collide. */
    compact?: boolean;
}

export function formatLegendNumber(value: number, options: LegendNumberOptions = {}): string {
    const unit = options.unit ?? '';
    if (!Number.isFinite(value)) return `?${unit}`;
    const magnitude = Math.abs(value);
    const places = options.decimals ?? (magnitude >= 100 ? 0 : magnitude >= 1 ? 1 : 3);

    if (options.compact !== false) {
        const compact = compactForm(value, unit);
        if (compact) return compact;
    }
    return `${Number(value.toFixed(places)).toLocaleString('en-US', {
        minimumFractionDigits: places,
        maximumFractionDigits: places,
        useGrouping: magnitude >= GROUPING_FLOOR,
    })}${unit}`;
}

/** `1.3M`, `2.4B` — or null where a suffix has nothing to offer. */
function compactForm(value: number, unit: string): string | null {
    const magnitude = Math.abs(value);
    if (magnitude >= 1e9) return `${Number((value / 1e9).toFixed(1))}B${unit}`;
    if (magnitude >= 1e6) return `${Number((value / 1e6).toFixed(1))}M${unit}`;
    return null;
}

/**
 * One formatter for a whole set of breaks, which is the only scale at which the
 * rules can be applied: whether a suffix is readable or misleading, and how many
 * decimals are needed, are both facts about the *set*, not about one number.
 */
export function legendNumberFormatter(
    breaks: readonly number[],
    unit?: string,
): (value: number) => string {
    const decimals = decimalsToDistinguish(breaks);
    // A suffix is offered only where it still tells every break from every
    // other: 1.25M and 1.26M both come out as "1.3M", which is the same failure
    // as "2K – 2K", a thousand times larger.
    const compactForms = breaks.map((value) => compactForm(value, ''));
    const compact = compactForms.every((form) => form !== null)
        && new Set(compactForms).size === breaks.length;
    return (value: number) => formatLegendNumber(value, { unit, decimals, compact });
}

/** How many decimals it takes to print every one of these breaks differently. */
export function decimalsToDistinguish(breaks: readonly number[]): number {
    for (let places = 0; places <= MAX_DECIMALS; places++) {
        const shown = breaks.map((value) => value.toFixed(places));
        if (new Set(shown).size === breaks.length) return places;
    }
    return MAX_DECIMALS;
}
