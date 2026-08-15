/**
 * Installing a view projection into OpenLayers, and reading coordinates in
 * whichever projection the view currently uses.
 *
 * Two jobs, both consequences of the same decision — that the OL view is no
 * longer necessarily EPSG:3857:
 *
 * 1. `ensureViewProjection` teaches OL a projection through proj4, including the
 *    extent it covers, which OL needs to work out zoom levels and to wrap the
 *    world horizontally.
 * 2. `toMapCoord`/`toLonLatCoord`/`featureProjectionOf` replace `fromLonLat` and
 *    `toLonLat`, which are hardcoded to EPSG:3857 and would silently place every
 *    coordinate in the wrong place the moment the view is something else. They
 *    take the map and ask *it* which projection is in force, so sub-maps (the
 *    inset built by `MapFactoryService`) keep their own answer rather than
 *    inheriting a global one.
 */

import type OLMap from 'ol/Map';
import type { Coordinate } from 'ol/coordinate';
import Projection from 'ol/proj/Projection';
import { get as getProjection, transform, transformExtent } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';

import { DEFAULT_VIEW_PROJECTION, getViewProjectionDef, latitudeRangeOf } from '../../utils/view-projections';

const WGS84 = 'EPSG:4326';

/** Projections whose proj4 definition has already been handed to OL. */
const registered = new Set<string>();

/**
 * Makes a projection usable as an OL view projection, returning it.
 *
 * Returns null for an unknown id rather than throwing: a projection id can come
 * from a config file or a permalink, and an unrecognised one should leave the
 * map on the projection it already had.
 */
export function ensureViewProjection(id: string): Projection | null {
    if (registered.has(id)) return getProjection(id);

    const def = getViewProjectionDef(id);
    if (def?.proj4) {
        proj4.defs(id, def.proj4);
        register(proj4);
    }

    const projection = getProjection(id);
    if (!projection) return null;

    // Checked for every projection, including the ones OL ships with, because
    // this is the trap that hangs the tab: a view in degrees freezes the map as
    // soon as a vector-tile layer is on it. `ol/source/VectorTile.js` scales the
    // source resolution with `resolution / sourceMetersPerUnit /
    // viewMetersPerUnit`, so a degree view divides by ~111 319 where it should
    // multiply, asks the source for its deepest zoom level, and then enumerates
    // millions of tiles for one screen. Hence EPSG:4326 is not in the catalog at
    // all and ESRI:54001 — the same picture in metres — takes its place.
    if (projection.getUnits() === 'degrees') {
        console.error(`[projection] ${id} uses degrees; a view in degrees breaks vector-tile scaling in OpenLayers.`);
        return null;
    }

    if (def?.proj4) {
        const extent = worldExtentOf(id);
        if (!extent) return null;
        projection.setExtent(extent);
        // Only a full-width cylindrical projection can repeat horizontally; a
        // polar one wrapped sideways would draw the Arctic next to itself.
        projection.setGlobal(GLOBAL_WRAPPING.has(id));
    }

    registered.add(id);
    return projection;
}

/** Cylindrical, full-width projections — the ones that may repeat horizontally. */
const GLOBAL_WRAPPING = new Set(['EPSG:6933', 'ESRI:54009', 'EPSG:8857', 'ESRI:54001']);

/**
 * The extent the projection covers, measured rather than tabulated.
 *
 * Transforming the four corners of the world is not enough — Mollweide's widest
 * point is at the equator, Equal Earth's is not at ±90°, and a polar projection
 * has no meaningful "corner" at all — so this samples a coarse graticule and
 * takes the bounding box. It runs once per projection.
 */
function worldExtentOf(id: string): [number, number, number, number] | null {
    const project = proj4(WGS84, id);
    const [south, north] = latitudeRangeOf(id);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (let lon = -180; lon <= 180; lon += 2) {
        for (let lat = south; lat <= north; lat += 2) {
            let point: number[];
            try {
                point = project.forward([lon, lat]);
            } catch {
                continue;
            }
            if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) continue;
            minX = Math.min(minX, point[0]);
            maxX = Math.max(maxX, point[0]);
            minY = Math.min(minY, point[1]);
            maxY = Math.max(maxY, point[1]);
        }
    }

    // A last line of defence, because getting this wrong does not look like a
    // bug — it looks like the map freezing. OL derives its resolutions from this
    // extent, so an absurd one asks the renderer to lay out a tile grid for a
    // world billions of times too large. Nothing legitimate here is wider than
    // one Earth circumference plus slack.
    const width = maxX - minX;
    const height = maxY - minY;
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || width > MAX_SANE_EXTENT) {
        console.error(`[projection] ${id} has no usable extent (${width} x ${height}); check its latitudeRange.`);
        return null;
    }
    return [minX, minY, maxX, maxY];
}

/** Earth's circumference with room to spare; anything wider is a broken definition. */
const MAX_SANE_EXTENT = 60_000_000;

/** The projection the map's view is currently in. */
export function viewProjectionOf(map: OLMap | null | undefined): string {
    // Guarded rather than assumed: this is called from services that are handed
    // the map before it has a view (and from tests with a stub map), and the
    // right answer there is the default the map will be created with.
    if (typeof map?.getView !== 'function') return DEFAULT_VIEW_PROJECTION;
    return map.getView()?.getProjection()?.getCode() ?? DEFAULT_VIEW_PROJECTION;
}

/**
 * The projection to hand `GeoJSON` read/write as `featureProjection`.
 *
 * GeoJSON data is always WGS84 on the wire; `featureProjection` is what it is
 * turned into for rendering, which is the view's projection and nothing else.
 */
export function featureProjectionOf(map: OLMap | null | undefined): string {
    return viewProjectionOf(map);
}

/** lon/lat → map coordinates, the view-aware replacement for `fromLonLat`. */
export function toMapCoord(map: OLMap | null | undefined, lonLat: number[]): Coordinate {
    return transform([lonLat[0], lonLat[1]], WGS84, viewProjectionOf(map));
}

/** map coordinates → lon/lat, the view-aware replacement for `toLonLat`. */
export function toLonLatCoord(map: OLMap | null | undefined, coord: Coordinate | number[]): [number, number] {
    return transform([coord[0], coord[1]], viewProjectionOf(map), WGS84) as [number, number];
}

/** lon/lat bbox → an extent in the view's projection. */
export function toMapExtent(
    map: OLMap | null | undefined,
    bbox: [number, number, number, number],
): [number, number, number, number] {
    return transformExtent(bbox, WGS84, viewProjectionOf(map)) as [number, number, number, number];
}
