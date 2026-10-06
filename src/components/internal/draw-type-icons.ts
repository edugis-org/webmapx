/**
 * Type-picker icons for the draw tool's "Points" / "Lines" / "Polygons" cards.
 *
 * A single dot/line/pentagon glyph reads as "draw one shape"; these instead
 * show the same six vertices three times — as scattered points, connected
 * into an open line, and closed into a filled polygon — so the three cards
 * read as one progression rather than three unrelated icons. Same visual
 * language as the geoprocessing tool's diagrams (`geoprocessing-diagrams.ts`):
 * inline SVG (not <img>) using the shared data-colour tokens, blue for the
 * vertices (matching the colour a new draw layer's geometry actually gets)
 * and green for the connecting edges/fill (the geoprocessing tool's result
 * colour), so it stays legible in light, dark and forced-colors mode.
 */

import { svg, type TemplateResult } from 'lit';
import type { GeometryType } from '../webmapx-draw-layer-dialog';
import { DATA_TOOL, DATA_START } from '../../theme/data-colors';

const NODE = `var(--webmapx-data-tool, ${DATA_TOOL})`;
const EDGE = `var(--webmapx-data-start, ${DATA_START})`;

/**
 * Six vertices, hand-placed once and reused by all three icons. `LINE_ORDER`
 * connects them in the order they'd naturally be clicked while drawing a line
 * (a scattered, occasionally-crossing path); `POLYGON_ORDER` is the same six
 * points walked around their hull, so the closed shape comes out simple.
 */
const NODES = {
    a: [14, 10], b: [34, 8], c: [54, 18],
    d: [10, 26], e: [20, 36], f: [46, 34],
} as const;

const LINE_ORDER = ['a', 'b', 'c', 'd', 'e', 'f'] as const;
const POLYGON_ORDER = ['f', 'e', 'd', 'a', 'b', 'c'] as const;

function pathFrom(order: readonly (keyof typeof NODES)[], close: boolean): string {
    const [start, ...rest] = order.map(k => NODES[k]);
    return `M${start[0]} ${start[1]} ` + rest.map(([x, y]) => `L${x} ${y}`).join(' ') + (close ? ' Z' : '');
}

function frame(content: TemplateResult): TemplateResult {
    return svg`
        <svg viewBox="0 0 64 44" role="img" aria-hidden="true" focusable="false">
            ${content}
        </svg>`;
}

const dots = svg`
    ${Object.values(NODES).map(([x, y]) => svg`<circle cx=${x} cy=${y} r="2.6" fill=${NODE} />`)}
`;

const POINTS = frame(dots);

const LINES = frame(svg`
    <path d=${pathFrom(LINE_ORDER, false)} fill="none" stroke=${EDGE} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    ${dots}
`);

const POLYGONS = frame(svg`
    <path d=${pathFrom(POLYGON_ORDER, true)} fill=${EDGE} fill-opacity="0.3" stroke=${EDGE} stroke-width="2" stroke-linejoin="round" />
    ${dots}
`);

export function drawTypeIcon(type: GeometryType): TemplateResult {
    return type === 'Point' ? POINTS : type === 'LineString' ? LINES : POLYGONS;
}
