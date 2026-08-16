/**
 * The legacy `crs` member, and why everything GDAL produces has to lose it.
 *
 * RFC 7946 removed `crs` and fixed GeoJSON as WGS84 lon/lat. GDAL still writes
 * the member the old spec had — for a WGS84 result that is
 * `urn:ogc:def:crs:OGC:1.3:CRS84`, which says exactly what the current spec
 * already guarantees, so it looks like harmless noise.
 *
 * It is not. OpenLayers reads the member and honours it as the *data*
 * projection, and it cannot then build a transform from that spelling into a
 * projection registered through proj4. `getTransform` returns undefined, OL
 * calls it anyway, and the layer dies with `transformFn is not a function` —
 * thrown from inside OL's geometry code, nowhere near the tool that produced
 * the data, and only ever when the view is something other than Web Mercator.
 * That symptom cost two separate debugging sessions: once for geoprocessing
 * results, once for imported files.
 *
 * So it is stripped at every point where GDAL output enters the application,
 * and this module exists so that "every point" is one function rather than a
 * habit each caller has to remember.
 */

/** GeoJSON as GDAL writes it: the current spec plus the member it dropped. */
type WithLegacyCrs = GeoJSON.FeatureCollection & { crs?: unknown };

/**
 * Removes the legacy `crs` member. Mutates and returns the same object — these
 * collections can be tens of megabytes, and copying one to delete a key is not
 * a trade worth making.
 */
export function stripLegacyCrs(collection: GeoJSON.FeatureCollection): GeoJSON.FeatureCollection {
    delete (collection as WithLegacyCrs).crs;
    return collection;
}

/** Parses GDAL's GeoJSON output, without the member it should not have written. */
export function parseGdalGeoJSON(text: string): GeoJSON.FeatureCollection {
    return stripLegacyCrs(JSON.parse(text) as GeoJSON.FeatureCollection);
}
