/**
 * The buffer pipeline, apart from the worker so it can run against the real
 * GDAL WASM under Node (`tests/buffer.test.ts`), the way `geoprocessing-runner`
 * does. Takes the GDAL instance as an argument for the same reason: no Vite
 * `?url` imports here.
 *
 *   1. ogr2ogr WGS84 → EPSG:3857 (Web Mercator, metric, conformal)
 *   2. ST_Buffer in metres via SQLite spatial dialect
 *   3. ogr2ogr EPSG:3857 → WGS84
 *   EPSG:3857 is conformal so circles in metre-space are circles in reality.
 *   Clip to ±84° to avoid polar PROJ errors.
 */

import { parseGdalGeoJSON } from '../utils/geojson-crs';
import type { GdalLike } from './geoprocessing-runner';

/**
 * The input row each shape came from, the only attribute GDAL is given.
 *
 * Results cannot be matched to inputs by position: the ±84° clip and
 * `-skipfailures` drop features, and every result after a dropped one then
 * carried its neighbour's attributes. Not called `id`: an integer `id` column
 * collides with the hidden key column GDAL's SQLite dialect names `id`, and the
 * buffer step then returns no dataset at all.
 */
const ROW = 'wmx_row';

/**
 * Recursively drops a Z/M coordinate from every position in a geometry.
 * GDAL's SQLite dialect (ST_MakeValid/ST_Buffer) can hard-abort the WASM
 * module on 3D input — e.g. USGS earthquake feeds encode depth as
 * coordinates[2]. Buffering only needs 2D input regardless, so strip any
 * extra dimensions before anything reaches GDAL.
 */
function dropZ(coords: unknown): unknown {
    if (!Array.isArray(coords)) return coords;
    if (typeof coords[0] === 'number') return coords.slice(0, 2);
    return coords.map(dropZ);
}

function flattenTo2D(fc: GeoJSON.FeatureCollection): GeoJSON.FeatureCollection {
    return {
        ...fc,
        features: fc.features.map((f) => {
            if (!f.geometry || !('coordinates' in f.geometry)) return f;
            return { ...f, geometry: { ...f.geometry, coordinates: dropZ(f.geometry.coordinates) } as GeoJSON.Geometry };
        }),
    };
}

function pathOf(result: string | { local: string; real: string }): string {
    return typeof result === 'string' ? result : result.local;
}

async function openDataset(gdal: GdalLike, path: string): Promise<any> {
    const { datasets, errors } = await gdal.open(path);
    const ds = datasets[0];
    if (!ds) throw new Error(`Failed to open ${path}: ${errors.join('; ')}`);
    return ds;
}

export async function bufferFeatures(
    gdal: GdalLike,
    rawInput: GeoJSON.FeatureCollection,
    distanceMeters: number,
    segments: number = 16,
    centerLat: number = 0,
): Promise<GeoJSON.FeatureCollection> {
    const input = flattenTo2D(rawInput);

    // EPSG:3857 unit = meters at equator, scaled by 1/cos(lat) elsewhere.
    // Divide by cos(lat) so ST_Buffer in 3857-space produces correct real-world size.
    const scale = Math.cos(centerLat * Math.PI / 180);
    const dist3857 = distanceMeters / (scale || 1);

    // GDAL gets the shapes and their row number only; the attributes are put
    // back from the input afterwards, by that row number (see `ROW`).
    const shapes: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: input.features.map((feature, row) => ({ type: 'Feature', geometry: feature.geometry, properties: { [ROW]: row } })),
    };
    const inputFile = new File([new Blob([JSON.stringify(shapes)], { type: 'application/json' })], 'spatialinput.geojson');
    const { datasets: inputDatasets, errors: inputErrors } = await gdal.open(inputFile);
    const inputDataset = inputDatasets[0];
    if (!inputDataset) throw new Error(`Failed to open input: ${inputErrors.join('; ')}`);

    let ds3857: any;
    let dsBuf: any;

    try {
        const reproj3857Path = await gdal.ogr2ogr(inputDataset, [
            '-f', 'GeoJSON',
            '-t_srs', 'EPSG:3857',
            '-clipsrc', '-180', '-84', '180', '84',
            '-makevalid',
            '-skipfailures',
            '-nln', 'spatialbuf_3857',
        ], 'spatialbuf_3857');

        ds3857 = await openDataset(gdal, pathOf(reproj3857Path));
        const sql = `SELECT "${ROW}", ST_Buffer(ST_MakeValid(geometry), ${dist3857}, ${segments}) AS geometry FROM "spatialbuf_3857"`;
        const bufferedPath = await gdal.ogr2ogr(ds3857, [
            '-f', 'GeoJSON',
            '-dialect', 'SQLITE',
            '-sql', sql,
            '-skipfailures',
        ], 'spatialbuf_buf');

        dsBuf = await openDataset(gdal, pathOf(bufferedPath));
        const outputPath = await gdal.ogr2ogr(dsBuf, [
            '-f', 'GeoJSON',
            '-t_srs', 'EPSG:4326',
            '-wrapdateline',
            '-skipfailures',
        ], 'spatialbuf_output');

        // Not a plain JSON.parse: GDAL writes a legacy `crs` member that stops the
        // layer being added to a map in any projection but Web Mercator. See
        // `utils/geojson-crs.ts`.
        const result = parseGdalGeoJSON(new TextDecoder().decode(await gdal.getFileBytes(outputPath)));
        result.features = result.features.flatMap((f) => {
            const row = f.properties?.[ROW];
            const source = typeof row === 'number' ? input.features[row] : undefined;
            if (!source || !f.geometry) return [];
            return [{ ...f, properties: { ...(source.properties ?? {}) } }];
        });
        return result;
    } finally {
        if (dsBuf) await gdal.close(dsBuf);
        if (ds3857) await gdal.close(ds3857);
        await gdal.close(inputDataset);
    }
}
