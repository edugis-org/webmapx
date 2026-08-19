/**
 * The `GeoJSON` format to use everywhere in the OpenLayers services.
 *
 * It differs from `ol/format/GeoJSON` in one respect: it normalizes the CRS a
 * file declares before looking it up. OpenLayers takes the `crs` member
 * literally, and a projection is only found if the exact spelling happens to be
 * registered — so `urn:ogc:def:crs:OGC:1.3:CRS84`, which is what QGIS, ogr2ogr
 * and Natural Earth write, resolves to an OL projection object that proj4 has
 * never heard of. There is then no transform from it into a proj4-registered
 * view projection, and adding the layer threw `transformFn is not a function`
 * from inside OL geometry code — on an Equal Earth map only, because Web
 * Mercator gets that transform built in.
 *
 * `normalizeCrsIdentifier` turns every such spelling back into a plain EPSG
 * code, which both libraries understand. A file that declares nothing is
 * lon/lat, as RFC 7946 requires.
 *
 * Subclassing rather than passing `dataProjection` at each call site because a
 * source that loads from a url reads the data itself, long after the format was
 * built: the override is the only hook that covers both.
 */

import GeoJSON from 'ol/format/GeoJSON';
import { get as getProjection } from 'ol/proj';
import type Projection from 'ol/proj/Projection';
import { normalizeCrsIdentifier } from '../../utils/crs-identifier';

const WGS84 = 'EPSG:4326';

export class WebmapxGeoJSON extends GeoJSON {
    override readProjectionFromObject(object: object): Projection {
        return getProjection(geoJsonDataProjectionCode(object))
            ?? getProjection(WGS84)!;
    }
}

/**
 * The projection code GeoJSON data is in.
 *
 * Coordinates are never reordered on the strength of it. Some registries call
 * EPSG:4326 latitude-first; the world's files are longitude-first, and swapping
 * a pair because of a string in a header is how data ends up in the wrong ocean.
 */
export function geoJsonDataProjectionCode(data: unknown): string {
    const named = crsNameOf(data);
    if (!named) return WGS84;

    const code = normalizeCrsIdentifier(named);
    if (!code || code === WGS84) return WGS84;

    if (!getProjection(code)) {
        // Not fatal: reading it as lon/lat puts the layer somewhere, which is
        // recoverable, where throwing leaves the user with an empty map and a
        // stack trace pointing at OL internals.
        console.warn(`[projection] GeoJSON declares "${named}" (${code}), which this build has no definition for; reading it as ${WGS84}.`);
        return WGS84;
    }
    return code;
}

/** The `crs` member RFC 7946 removed, in the two shapes OL also accepts. */
function crsNameOf(data: unknown): string | null {
    if (!data || typeof data !== 'object') return null;
    const crs = (data as { crs?: unknown }).crs;
    if (!crs || typeof crs !== 'object') return null;
    const { type, properties } = crs as { type?: unknown; properties?: Record<string, unknown> };
    if (!properties) return null;
    if (type === 'name' && typeof properties.name === 'string') return properties.name;
    if (type === 'EPSG' && properties.code != null) return `EPSG:${String(properties.code)}`;
    return null;
}
