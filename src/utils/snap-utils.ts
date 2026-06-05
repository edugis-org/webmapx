import type { LngLat } from '../store/map-events';
import type { DrawFeature } from '../components/webmapx-draw-tool';

export interface SnapOptions {
    threshold?: number;   // px, default 16
    edgePenalty?: number; // px, default 8 — edges must be this much closer than a vertex to win
}

export type ProjectFn = (coords: LngLat) => [number, number];

/** Flatten all vertex coordinates of a feature into a LngLat array. */
export function flatVertices(f: DrawFeature): LngLat[] {
    type LL = LngLat;
    if (f.type === 'Point') return [f.coordinates as LL];
    if (f.type === 'MultiPoint') return f.coordinates as LL[];
    if (f.type === 'LineString') return f.coordinates as LL[];
    if (f.type === 'MultiLineString') return (f.coordinates as LL[][]).flat();
    if (f.type === 'Polygon') return (f.coordinates as LL[][]).flat();
    if (f.type === 'MultiPolygon') return (f.coordinates as LL[][][]).flat(2);
    return [];
}

/** Return all sequential edges [A, B] of a feature. */
export function flatEdges(f: DrawFeature): [LngLat, LngLat][] {
    type LL = LngLat;
    const edges: [LL, LL][] = [];
    const addRing = (ring: LL[]) => {
        for (let i = 0; i < ring.length - 1; i++) edges.push([ring[i], ring[i + 1]]);
    };
    if (f.type === 'LineString') addRing(f.coordinates as LL[]);
    else if (f.type === 'MultiLineString') (f.coordinates as LL[][]).forEach(l => addRing(l));
    else if (f.type === 'Polygon') (f.coordinates as LL[][]).forEach(r => addRing(r));
    else if (f.type === 'MultiPolygon') (f.coordinates as LL[][][]).forEach(p => p.forEach(r => addRing(r)));
    return edges;
}

/**
 * Find the best snap candidate for the given cursor pixel position.
 * Vertices beat edges when within `edgePenalty` px.
 * Returns null when nothing is within `threshold` px.
 */
export function findSnap(
    cursorPx: [number, number],
    features: DrawFeature[],
    project: ProjectFn,
    options: SnapOptions = {}
): LngLat | null {
    const threshold = options.threshold ?? 16;
    const edgePenalty = options.edgePenalty ?? 8;
    let best: LngLat | null = null;
    let bestDist = threshold;

    for (const f of features) {
        for (const v of flatVertices(f)) {
            const px = project(v);
            const d = Math.hypot(px[0] - cursorPx[0], px[1] - cursorPx[1]);
            if (d < bestDist) { bestDist = d; best = v; }
        }
        for (const [a, b] of flatEdges(f)) {
            const pa = project(a);
            const pb = project(b);
            const dx = pb[0] - pa[0], dy = pb[1] - pa[1];
            const len2 = dx * dx + dy * dy;
            if (len2 === 0) continue;
            const t = Math.max(0, Math.min(1, ((cursorPx[0] - pa[0]) * dx + (cursorPx[1] - pa[1]) * dy) / len2));
            const d = Math.hypot(pa[0] + t * dx - cursorPx[0], pa[1] + t * dy - cursorPx[1]);
            if (d + edgePenalty < bestDist) {
                bestDist = d + edgePenalty;
                best = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
            }
        }
    }
    return best;
}
