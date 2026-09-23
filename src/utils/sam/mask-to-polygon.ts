/**
 * A SAM mask as polygons.
 *
 * The decoder returns *logits* on a 256×256 grid, not a binary image, and that
 * is worth keeping: contouring the logits at 0 with linear interpolation
 * (d3-contour's marching squares) places each edge between cells where the
 * model's own boundary lies, so a 256-cell grid over a 1000-pixel view gives a
 * smooth outline rather than a 4-pixel staircase. It is also what SAM itself
 * does, upsampling the logits before thresholding.
 */

import { contours } from 'd3-contour';

type Ring = [number, number][];

/** Polygons smaller than this many grid cells are speckle, not objects. */
const MIN_AREA_CELLS = 2;
/** Douglas–Peucker tolerance in cells: removes marching-squares jitter only. */
const SIMPLIFY_CELLS = 0.3;

/** Signed shoelace area: positive for a counterclockwise ring with y pointing up. */
export function ringArea(ring: Ring): number {
    let a = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        a += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
    }
    return a / 2;
}

function perpendicularDistanceSq(p: [number, number], a: [number, number], b: [number, number]): number {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = dx * dx + dy * dy;
    let t = len ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len : 0;
    t = Math.max(0, Math.min(1, t));
    const ex = a[0] + t * dx - p[0];
    const ey = a[1] + t * dy - p[1];
    return ex * ex + ey * ey;
}

/** Douglas–Peucker on a closed ring (first point repeated last), iterative. */
export function simplifyRing(ring: Ring, tolerance: number): Ring {
    if (ring.length <= 5) return ring;
    const tolSq = tolerance * tolerance;
    const keep = new Uint8Array(ring.length);
    keep[0] = keep[ring.length - 1] = 1;
    // A closed ring's endpoints coincide, so split it at the point farthest from the start.
    let far = 0;
    let farD = -1;
    for (let i = 1; i < ring.length - 1; i++) {
        const d = (ring[i][0] - ring[0][0]) ** 2 + (ring[i][1] - ring[0][1]) ** 2;
        if (d > farD) { farD = d; far = i; }
    }
    keep[far] = 1;
    const stack: [number, number][] = [[0, far], [far, ring.length - 1]];
    while (stack.length) {
        const [s, e] = stack.pop()!;
        let idx = -1;
        let max = tolSq;
        for (let i = s + 1; i < e; i++) {
            const d = perpendicularDistanceSq(ring[i], ring[s], ring[e]);
            if (d > max) { max = d; idx = i; }
        }
        if (idx >= 0) {
            keep[idx] = 1;
            stack.push([s, idx], [idx, e]);
        }
    }
    const out: Ring = [];
    for (let i = 0; i < ring.length; i++) if (keep[i]) out.push(ring[i]);
    return out.length >= 4 ? out : ring;
}

/**
 * Contours the part of a logit grid that covers the image.
 *
 * @param logits   Row-major grid, `stride` cells wide.
 * @param stride   Full width of the grid.
 * @param cols     Columns covering the image (SAM's zero padding lies beyond).
 * @param rows     Rows covering the image.
 * @param threshold Logit at which the outline is drawn (0: the model's boundary).
 * @returns Polygons (outer ring, then holes) in grid-cell coordinates, where
 *          cell (i, j) spans [i, i+1]×[j, j+1]; and the share of cells inside.
 */
export function maskToRings(
    logits: ArrayLike<number>,
    stride: number,
    cols: number,
    rows: number,
    threshold = 0,
): { polygons: Ring[][]; coverage: number } {
    const grid = new Float64Array(cols * rows);
    let inside = 0;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const v = logits[y * stride + x];
            grid[y * cols + x] = v;
            if (v > threshold) inside++;
        }
    }
    if (!inside) return { polygons: [], coverage: 0 };

    const [multi] = contours().size([cols, rows]).thresholds([threshold])(Array.from(grid));
    const polygons: Ring[][] = [];
    for (const polygon of multi.coordinates as Ring[][]) {
        const [outer, ...holes] = polygon;
        if (Math.abs(ringArea(outer)) < MIN_AREA_CELLS) continue;
        polygons.push([
            simplifyRing(outer, SIMPLIFY_CELLS),
            ...holes
                .filter(h => Math.abs(ringArea(h)) >= MIN_AREA_CELLS)
                .map(h => simplifyRing(h, SIMPLIFY_CELLS)),
        ]);
    }
    return { polygons, coverage: inside / (cols * rows) };
}

/**
 * RFC 7946 winding for a polygon in lon/lat: exterior counterclockwise, holes
 * clockwise. Screen space runs y downwards, so an outline traced there comes
 * out mirrored once it is in geographic coordinates.
 */
export function rewindPolygon(polygon: Ring[]): Ring[] {
    return polygon.map((ring, i) => {
        const ccw = ringArea(ring) > 0;
        return (i === 0) === ccw ? ring : [...ring].reverse();
    });
}
