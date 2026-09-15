/**
 * Qualitative palettes designed to stay distinguishable for colour-blind
 * readers, beyond what ColorBrewer rates.
 *
 * ColorBrewer rates no qualitative scheme colour-blind safe above four colours
 * (Set2, Dark2 and Paired at three, only Paired at four), so a neighbour
 * colouring or a categorical map that ticked "colour-blind safe" had nothing to
 * draw with past four. These palettes were designed for exactly that purpose:
 *
 * - **Okabe–Ito** (Okabe & Ito 2002, "Color Universal Design"): eight colours,
 *   including black. Black is listed last, so a map of seven colours or fewer
 *   does not fill areas with it; it appears only when all eight are asked for.
 * - **Tol bright** and **Tol muted** (Paul Tol, SRON technical note
 *   SRON/EPS/TN/09-002): seven and nine colours. Tol's pale grey for "no data"
 *   is left out of muted, since the styler has a no-data colour of its own.
 *
 * Rated `blind: 'ok'` and `screen: 'ok'` because that is what they were
 * designed and tested for. Print and photocopy are `unknown`, as ColorBrewer
 * records a scheme it did not rate: an unrated scheme is not evidence of
 * safety, so a filter asking for either leaves these out.
 *
 * A set of n colours is the palette's first n, in the designer's own order,
 * which is the order meant to keep small subsets distinct.
 */
import type { RawColorScheme, SchemeSet } from './color-schemes';

function setsOf(colors: readonly string[]): SchemeSet[] {
    const sets: SchemeSet[] = [];
    for (let count = 3; count <= colors.length; count++) {
        sets.push({ colors: colors.slice(0, count), blind: 'ok', print: 'unknown', screen: 'ok', copy: 'unknown' });
    }
    return sets;
}

export const CVD_SAFE_QUALITATIVE: readonly RawColorScheme[] = [
    {
        name: 'OkabeIto',
        type: 'qual',
        sets: setsOf(['#e69f00', '#56b4e9', '#009e73', '#f0e442', '#0072b2', '#d55e00', '#cc79a7', '#000000']),
    },
    {
        name: 'TolBright',
        type: 'qual',
        sets: setsOf(['#4477aa', '#ee6677', '#228833', '#ccbb44', '#66ccee', '#aa3377', '#bbbbbb']),
    },
    {
        name: 'TolMuted',
        type: 'qual',
        sets: setsOf(['#cc6677', '#332288', '#ddcc77', '#117733', '#88ccee', '#882255', '#44aa99', '#999933', '#aa4499']),
    },
];
