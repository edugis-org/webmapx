/**
 * Inline SVG diagrams for the geoprocessing tool — the PostGIS-manual idea:
 * show the operation instead of describing it.
 *
 * Inline (not <img>) because these must follow the theme *and* be animated from
 * the component's stylesheet: they use `currentColor` and the shared data-colour
 * tokens, so they stay legible in light, dark and forced-colors mode.
 *
 * Structure every diagram follows, because the hover animation depends on it:
 *   .gp-a       first input   — blue,  left
 *   .gp-b       second input  — red,   right (absent for one-input operations)
 *   .gp-result  the output    — green
 * On hover the tool's stylesheet reveals them in that order, so the picture
 * reads as "A … plus B … gives this". At rest all three are visible at once.
 *
 * All diagrams share one 100x52 viewBox and the same left/right placement, so
 * switching between operations in the grid changes the *result*, not the layout.
 */

import { svg, type TemplateResult } from 'lit';
import type { GeoOperationId } from '../../utils/geoprocessing-operations';

const A = 'var(--webmapx-data-tool, #0f62fe)';
const B = 'var(--webmapx-data-end, #e63946)';
const RESULT = 'var(--webmapx-data-start, #22c55e)';

/** Left square, right square: the two inputs every overlay diagram starts from. */
const SQUARE_A = 'M14 10 H58 V44 H14 Z';
const SQUARE_B = 'M42 10 H86 V44 H42 Z';
/** Their overlap, and the parts unique to each. */
const OVERLAP = 'M42 10 H58 V44 H42 Z';
const ONLY_A = 'M14 10 H42 V44 H14 Z';
const ONLY_B = 'M58 10 H86 V44 H58 Z';

function frame(content: TemplateResult): TemplateResult {
    return svg`
        <svg viewBox="0 0 100 52" role="img" aria-hidden="true" focusable="false">
            ${content}
        </svg>`;
}

/** An input outline: dashed, in that input's colour. */
function input(cls: 'gp-a' | 'gp-b', d: string, color: string): TemplateResult {
    return svg`<path class=${cls} d=${d} fill="none" stroke=${color} stroke-width="1.5" stroke-dasharray="3 2" />`;
}

const inputA = input('gp-a', SQUARE_A, A);
const inputB = input('gp-b', SQUARE_B, B);

/** A filled result shape. */
function result(d: string): TemplateResult {
    return svg`<path class="gp-result" d=${d} fill=${RESULT} fill-opacity="0.55" stroke=${RESULT} stroke-width="2" />`;
}

const DIAGRAMS: Record<GeoOperationId, TemplateResult> = {
    // Clip and intersect produce the same *geometry*, so the diagrams have to
    // show what actually differs: how many features come out. Clip's B is one
    // shape and one piece comes out; intersect's B is two features and the
    // overlap comes out as two, each carrying that B feature's attributes.
    clip: frame(svg`
        ${inputA}${inputB}
        ${result(OVERLAP)}`),

    erase: frame(svg`
        ${inputA}${inputB}
        ${result(ONLY_A)}`),

    intersect: frame(svg`
        ${inputA}
        <g class="gp-b">
            <path d="M42 10 H86 V26 H42 Z" fill="none" stroke=${B} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M42 28 H86 V44 H42 Z" fill="none" stroke=${B} stroke-width="1.5" stroke-dasharray="3 2" />
        </g>
        <g class="gp-result">
            <path d="M42 10 H58 V26 H42 Z" fill=${RESULT} fill-opacity="0.55" stroke=${RESULT} stroke-width="2" />
            <path d="M42 28 H58 V44 H42 Z" fill=${RESULT} fill-opacity="0.55" stroke=${RESULT} stroke-width="2" />
        </g>`),

    union: frame(svg`
        ${inputA}${inputB}
        <g class="gp-result">
            <path d=${ONLY_A} fill=${RESULT} fill-opacity="0.3" stroke=${RESULT} stroke-width="2" />
            <path d=${OVERLAP} fill=${RESULT} fill-opacity="0.7" stroke=${RESULT} stroke-width="2" />
            <path d=${ONLY_B} fill=${RESULT} fill-opacity="0.3" stroke=${RESULT} stroke-width="2" />
        </g>`),

    selectByLocation: frame(svg`
        <g class="gp-a">
            <circle cx="20" cy="16" r="3.5" fill="none" stroke=${A} stroke-width="1.5" />
            <circle cx="24" cy="38" r="3.5" fill="none" stroke=${A} stroke-width="1.5" />
            <circle cx="52" cy="20" r="3.5" fill="none" stroke=${A} stroke-width="1.5" />
            <circle cx="62" cy="34" r="3.5" fill="none" stroke=${A} stroke-width="1.5" />
            <circle cx="76" cy="22" r="3.5" fill="none" stroke=${A} stroke-width="1.5" />
        </g>
        ${input('gp-b', SQUARE_B, B)}
        <g class="gp-result">
            <circle cx="52" cy="20" r="3.5" fill=${RESULT} />
            <circle cx="62" cy="34" r="3.5" fill=${RESULT} />
            <circle cx="76" cy="22" r="3.5" fill=${RESULT} />
        </g>`),

    spatialJoin: frame(svg`
        <g class="gp-a">
            <circle cx="18" cy="20" r="3.5" fill="none" stroke=${A} stroke-width="1.5" />
            <circle cx="18" cy="36" r="3.5" fill="none" stroke=${A} stroke-width="1.5" />
        </g>
        <g class="gp-b">
            <path d=${SQUARE_B} fill=${B} fill-opacity="0.12" stroke=${B} stroke-width="1.5" stroke-dasharray="3 2" />
            <text x="48" y="17" font-size="8" fill=${B}>abc</text>
        </g>
        <g class="gp-result">
            <circle cx="56" cy="30" r="3.5" fill=${RESULT} />
            <circle cx="70" cy="36" r="3.5" fill=${RESULT} />
            <text x="52" y="48" font-size="8" fill=${RESULT}>abc</text>
        </g>`),

    // Inputs drawn *over* the result here, unlike the overlay diagrams: the whole
    // point of dissolve is the internal boundary disappearing, and a filled result
    // on top would hide the very line the reader needs to see vanish.
    dissolve: frame(svg`
        ${result('M14 10 H86 V44 H14 Z')}
        <g class="gp-a">
            <path d="M14 10 H50 V44 H14 Z" fill="none" stroke=${A} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M50 10 H86 V44 H50 Z" fill="none" stroke=${A} stroke-width="1.5" stroke-dasharray="3 2" />
        </g>`),

    // A U-shape, not a crescent: the point of this operation is that the label
    // lands in the roomiest part of the polygon rather than at its centre of
    // gravity, which for a U sits in the notch — outside the shape entirely. A
    // rectilinear U makes both the interior and the notch unmistakable at 52px
    // tall, where a crescent's thin horns read as ambiguous.
    labelPoint: frame(svg`
        <g class="gp-a">
            <path d="M12 12 H28 V30 H44 V12 H60 V42 H12 Z"
                  fill="none" stroke=${A} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M70 14 H88 V40 H70 Z" fill="none" stroke=${A} stroke-width="1.5" stroke-dasharray="3 2" />
        </g>
        <g class="gp-result">
            <circle cx="20" cy="25" r="4" fill=${RESULT} />
            <circle cx="79" cy="27" r="4" fill=${RESULT} />
        </g>`),

    // Shapes in, numbers out: the only diagram whose result is not a geometry, so
    // it deliberately breaks the visual pattern rather than pretending otherwise.
    statistics: frame(svg`
        <g class="gp-a">
            <path d="M10 12 H30 V26 H10 Z" fill="none" stroke=${A} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M10 30 H30 V44 H10 Z" fill="none" stroke=${A} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M34 12 H50 V44 H34 Z" fill="none" stroke=${A} stroke-width="1.5" stroke-dasharray="3 2" />
        </g>
        <g class="gp-result">
            <path d="M60 12 H92 M60 22 H92 M60 32 H92 M60 42 H92" stroke=${RESULT} stroke-width="1.5" opacity="0.5" />
            <path d="M60 12 V44" stroke=${RESULT} stroke-width="1.5" opacity="0.5" />
            <rect x="62" y="15" width="12" height="4" fill=${RESULT} />
            <rect x="78" y="15" width="10" height="4" fill=${RESULT} />
            <rect x="62" y="25" width="8" height="4" fill=${RESULT} />
            <rect x="78" y="25" width="13" height="4" fill=${RESULT} />
            <rect x="62" y="35" width="14" height="4" fill=${RESULT} />
            <rect x="78" y="35" width="7" height="4" fill=${RESULT} />
        </g>`),

    centroid: frame(svg`
        <g class="gp-a">
            <path d="M14 10 H50 V44 H14 Z" fill="none" stroke=${A} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M54 10 H86 V44 H54 Z" fill="none" stroke=${A} stroke-width="1.5" stroke-dasharray="3 2" />
        </g>
        <g class="gp-result">
            <circle cx="32" cy="27" r="4" fill=${RESULT} />
            <circle cx="70" cy="27" r="4" fill=${RESULT} />
        </g>`),

    convexHull: frame(svg`
        <g class="gp-a">
            <circle cx="20" cy="34" r="2.5" fill=${A} />
            <circle cx="34" cy="12" r="2.5" fill=${A} />
            <circle cx="62" cy="10" r="2.5" fill=${A} />
            <circle cx="84" cy="26" r="2.5" fill=${A} />
            <circle cx="66" cy="44" r="2.5" fill=${A} />
            <circle cx="30" cy="42" r="2.5" fill=${A} />
            <circle cx="48" cy="26" r="2.5" fill=${A} />
            <circle cx="58" cy="32" r="2.5" fill=${A} />
        </g>
        <path class="gp-result" d="M20 34 L34 12 L62 10 L84 26 L66 44 L30 42 Z"
              fill=${RESULT} fill-opacity="0.35" stroke=${RESULT} stroke-width="2" />`),

    simplify: frame(svg`
        <path class="gp-a" d="M12 38 L22 18 L30 30 L38 12 L48 32 L58 14 L68 34 L78 16 L88 30"
              fill="none" stroke=${A} stroke-width="1.5" stroke-dasharray="3 2" />
        <path class="gp-result" d="M12 38 L38 14 L68 32 L88 18" fill="none" stroke=${RESULT} stroke-width="2.5" />`),
};

export function operationDiagram(id: GeoOperationId): TemplateResult | null {
    return DIAGRAMS[id] ?? null;
}
