/**
 * Computes the geographic extent of an Allmaps (georeferenced map) layer.
 * Driven by scripts/allmaps-bounds.ts (`npm run allmaps:bounds`).
 *
 * A georeference annotation does not state its extent directly. It carries
 * ground control points plus a *resource mask* — a polygon in image-pixel
 * coordinates marking the map face inside the scan, excluding margins, title
 * cartouches and torn edges. The real footprint is that mask warped through the
 * GCP transformation into lon/lat.
 *
 * Taking the bbox of the GCPs instead would be wrong in both directions: GCPs
 * sit inside the map face, so the extent comes out too small, and a scan with
 * clustered control points can be off badly.
 *
 * An annotation page may describe several maps (a sheet cut into pieces); the
 * result is the union, which is what a single layer draws.
 */

import { parseAnnotation } from '@allmaps/annotation';
import { GcpTransformer } from '@allmaps/transform';

export type Bounds = [number, number, number, number];

/** Extends `bounds` in place to include `point`. */
function extend(bounds: Bounds | null, [lon, lat]: [number, number]): Bounds {
    if (!bounds) return [lon, lat, lon, lat];
    return [
        Math.min(bounds[0], lon),
        Math.min(bounds[1], lat),
        Math.max(bounds[2], lon),
        Math.max(bounds[3], lat),
    ];
}

/**
 * @param annotation a parsed georeference annotation or annotation page
 * @returns [west, south, east, north] in EPSG:4326, or null if nothing usable
 */
export function boundsFromAnnotation(annotation: unknown): Bounds | null {
    const maps = parseAnnotation(annotation as never);
    let bounds: Bounds | null = null;

    for (const map of maps) {
        const transformer = new GcpTransformer(map.gcps, map.transformation?.type);
        // The mask is a ring of resource (pixel) coordinates; warping each
        // vertex gives the map face's real outline on the globe. `toGeo`
        // densifies edges, so a curved projection is not cut across.
        const ring = transformer.transformToGeo([map.resourceMask]);
        for (const polygon of ring) {
            for (const point of polygon) {
                bounds = extend(bounds, point as [number, number]);
            }
        }
    }

    return bounds;
}

/** Rounds to ~1 m so config diffs stay readable. */
export function roundBounds(bounds: Bounds, decimals = 5): Bounds {
    const f = 10 ** decimals;
    return bounds.map(v => Math.round(v * f) / f) as Bounds;
}
