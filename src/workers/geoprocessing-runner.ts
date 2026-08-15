/**
 * Geoprocessing pipeline — one generic runner for every operation in
 * `utils/geoprocessing-operations.ts`.
 *
 * The GDAL instance is passed in rather than imported, so this module stays free
 * of Vite's `?url` asset imports and can run under plain Node in tests
 * (`scripts/test-geoprocessing.ts`) against the same gdal3.js build.
 *
 * Pipeline, identical for all operations:
 *   1. inputs → GeoJSON files → reproject to EPSG:3857 (metric, conformal)
 *   2. the operation's `buildSql` through `ogr2ogr -dialect SQLITE -sql`, or its
 *      `compute` in JS for algorithms SpatiaLite lacks (see `labelPoint`)
 *   3. reproject the result back to EPSG:4326
 *
 * Why EPSG:3857 rather than running the SQL on lon/lat directly: SpatiaLite's
 * predicates are planar, so a tolerance or a distance expressed in degrees means
 * different things at different latitudes. 3857 is conformal, so a single
 * `1/cos(lat)` scale (the same correction `buffer()` applies) converts metres
 * into projection units.
 */

import {
    METRIC_PARAMS,
    getOperation,
    type GeoParamValues,
} from '../utils/geoprocessing-operations';

export interface GeoprocessRequest {
    operationId: string;
    /** Primary input. */
    inputA: GeoJSON.FeatureCollection;
    /** Overlay/mask input — required for two-input operations. */
    inputB?: GeoJSON.FeatureCollection;
    params: GeoParamValues;
    /** Map centre latitude, used to scale metric parameters into 3857 units. */
    centerLat?: number;
}

/**
 * A result collection, optionally carrying what the pipeline had to leave out.
 *
 * Warnings ride along as a GeoJSON foreign member rather than a separate return
 * value because the collection is what crosses the worker boundary — the worker
 * protocol's `ok` response carries one `FeatureCollection` and nothing else, and
 * a foreign member survives structured clone untouched.
 */
export interface GeoprocessResult extends GeoJSON.FeatureCollection {
    warnings?: string[];
}

function withWarnings(fc: GeoJSON.FeatureCollection, warnings: string[]): GeoprocessResult {
    if (!warnings.length) return fc;
    return { ...fc, warnings };
}

/** Minimal shape of the gdal3.js instance this runner uses. */
export interface GdalLike {
    open(file: unknown): Promise<{ datasets: any[]; errors: string[] }>;
    close(dataset: unknown): Promise<unknown>;
    ogr2ogr(dataset: unknown, args: string[], outputName?: string): Promise<any>;
    getFileBytes(path: unknown): Promise<Uint8Array>;
}

const LAYER_A = 'gp_a';
const LAYER_B = 'gp_b';

// ─── GeoJSON helpers ─────────────────────────────────────────────────────────

/**
 * Recursively drops Z/M coordinates. GDAL's SQLite dialect can hard-abort the
 * WASM module on 3D input, and none of these operations need a third dimension.
 */
function dropZ(coords: unknown): unknown {
    if (!Array.isArray(coords)) return coords;
    if (typeof coords[0] === 'number') return coords.slice(0, 2);
    return coords.map(dropZ);
}

function flattenTo2D(fc: GeoJSON.FeatureCollection): GeoJSON.FeatureCollection {
    return {
        ...fc,
        features: fc.features.map(f => {
            if (!f.geometry || !('coordinates' in f.geometry)) return f;
            return { ...f, geometry: { ...f.geometry, coordinates: dropZ(f.geometry.coordinates) } as GeoJSON.Geometry };
        }),
    };
}

/**
 * Attribute names present anywhere in the collection.
 *
 * The SQL builders need these because `SELECT a.*` would emit a second geometry
 * column and GDAL then writes the wrong one. Names that GDAL cannot represent as
 * a field (empty, or the reserved geometry column) are dropped.
 */
function fieldNames(fc: GeoJSON.FeatureCollection | undefined): string[] {
    if (!fc) return [];
    const names: string[] = [];
    const seen = new Set<string>(['geometry', 'geom']);
    for (const f of fc.features) {
        for (const key of Object.keys(f.properties ?? {})) {
            if (!key || seen.has(key)) continue;
            // Nested objects/arrays survive a GeoJSON round-trip but not a SQL
            // column, and GDAL turns them into unusable JSON strings.
            const value = (f.properties as Record<string, unknown>)[key];
            if (value !== null && typeof value === 'object') continue;
            seen.add(key);
            names.push(key);
        }
    }
    return names;
}

function toFile(fc: GeoJSON.FeatureCollection, name: string): File {
    const blob = new Blob([JSON.stringify(fc)], { type: 'application/json' });
    return new File([blob], `${name}.geojson`);
}

function pathOf(result: string | { local: string; real: string }): string {
    return typeof result === 'string' ? result : result.local;
}

/**
 * An operation can legitimately produce empty geometries — erasing a feature
 * completely, for instance. They render as nothing and break bounds fitting, so
 * they are dropped once here rather than per caller.
 *
 * But an empty geometry is also what SpatiaLite returns when GEOS gives up on a
 * row, so this is where a failed calculation would disappear without a trace.
 * The count goes into the warnings for that reason: "233 in, 229 out" needs an
 * explanation, and "erased completely" and "could not be calculated" look
 * identical from here.
 */
function dropEmptyGeometries(fc: GeoJSON.FeatureCollection, warnings: string[]): GeoJSON.FeatureCollection {
    const before = fc.features.length;
    fc.features = fc.features.filter(f => f.geometry != null);
    const dropped = before - fc.features.length;
    if (dropped > 0) {
        warnings.push(`${dropped} ${dropped === 1 ? 'result' : 'results'} had no geometry left and were dropped — either the operation removed everything, or that shape could not be calculated.`);
    }
    return fc;
}

// ─── Pipeline ────────────────────────────────────────────────────────────────

async function readFeatureCollection(gdal: GdalLike, path: string): Promise<GeoJSON.FeatureCollection> {
    const bytes = await gdal.getFileBytes(path);
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as GeoJSON.FeatureCollection & { crs?: unknown };

    // GDAL writes the legacy `crs` member RFC 7946 removed — for a WGS84 result
    // it is `urn:ogc:def:crs:OGC:1.3:CRS84`, which says exactly what the spec
    // already guarantees. It is not harmless: OpenLayers honours it as the data
    // projection when reading the layer, and cannot then build a transform from
    // that spelling into a proj4-registered view projection, so adding the
    // result to a map in an equal-area projection died with "transformFn is not
    // a function" — a failure in the *map*, several steps away from here, and
    // only ever on a non-Mercator view.
    delete parsed.crs;
    return parsed;
}

/**
 * Feature count of a GeoJSON file, without parsing it.
 *
 * The reprojected inputs can be tens of megabytes, and this is only needed to
 * tell the user how many features GDAL threw away — not worth a full `JSON.parse`
 * of a document the SQL branch never otherwise reads into JS.
 */
async function countFeatures(gdal: GdalLike, path: string): Promise<number> {
    const text = new TextDecoder().decode(await gdal.getFileBytes(path));
    return (text.match(/"type"\s*:\s*"Feature"/g) ?? []).length;
}

/**
 * Reproject a JS-computed collection back to lon/lat.
 *
 * `-s_srs` is required and not optional politeness: the file is written as plain
 * GeoJSON, which GDAL reads as WGS84 by default, and these coordinates are 3857
 * metres. Without it every result lands in the Gulf of Guinea.
 */
async function backToWgs84(gdal: GdalLike, fc: GeoJSON.FeatureCollection, warnings: string[]): Promise<GeoJSON.FeatureCollection> {
    const { datasets, errors } = await gdal.open(toFile(fc, 'gp_computed'));
    const dataset = datasets[0];
    if (!dataset) throw new Error(`Could not read the computed result: ${errors.join('; ')}`);

    try {
        const back = await gdal.ogr2ogr(dataset, [
            '-f', 'GeoJSON',
            '-s_srs', 'EPSG:3857',
            '-t_srs', 'EPSG:4326',
            '-wrapdateline',
            '-skipfailures',
        ], 'gp_output');
        return dropEmptyGeometries(await readFeatureCollection(gdal, pathOf(back)), warnings);
    } finally {
        await gdal.close(dataset);
    }
}

/**
 * Reproject one input to EPSG:3857 GeoJSON and return the file path.
 *
 * Two ogr2ogr passes, and the split is load-bearing: `-makevalid` in the same
 * call as `-clipsrc` runs *after* the clip, so an invalid polygon still throws
 * `TopologyException` inside GEOS while being clipped and `-skipfailures` then
 * drops the feature without a word. Tile-derived data hits this constantly —
 * dissolving MVT fragments leaves rings that touch along tile edges. Measured on
 * a 233-country dissolve of a vector-tile layer: one pass kept 192 features
 * (and turned 29 of those into `GeometryCollection`s), repairing first keeps all
 * 233 as clean Polygon/MultiPolygon.
 */
async function toMetric(
    gdal: GdalLike,
    fc: GeoJSON.FeatureCollection,
    layerName: string,
): Promise<{ path: string; dropped: number }> {
    const { datasets, errors } = await gdal.open(toFile(flattenTo2D(fc), layerName));
    const source = datasets[0];
    if (!source) throw new Error(`Could not read input layer: ${errors.join('; ')}`);

    let repairedPath: string;
    try {
        const repaired = await gdal.ogr2ogr(source, [
            '-f', 'GeoJSON',
            '-makevalid',
            '-skipfailures',
            '-nln', layerName,
        ], `${layerName}_valid`);
        repairedPath = pathOf(repaired);
    } finally {
        await gdal.close(source);
    }

    const opened = await gdal.open(repairedPath);
    const repairedDataset = opened.datasets[0];
    if (!repairedDataset) throw new Error(`Could not repair input layer: ${opened.errors.join('; ')}`);

    try {
        const out = await gdal.ogr2ogr(repairedDataset, [
            '-f', 'GeoJSON',
            '-t_srs', 'EPSG:3857',
            // PROJ fails on the poles; 3857 is undefined beyond ±85° anyway.
            '-clipsrc', '-180', '-84', '180', '84',
            '-skipfailures',
            '-nln', layerName,
        ], `${layerName}_3857`);
        const path = pathOf(out);
        return { path, dropped: Math.max(fc.features.length - await countFeatures(gdal, path), 0) };
    } finally {
        await gdal.close(repairedDataset);
    }
}

/**
 * Materialises the reprojected inputs as tables in one SpatiaLite database.
 *
 * This is the single biggest thing standing between a usable tool and a minute
 * of frozen UI. Running the SQL straight against the GeoJSON files means OGR's
 * SQLite dialect re-parses geometry out of JSON on every access: 144 x 576
 * polygons of 401 vertices took 19.8 s that way, and 1.3 s once the same data
 * sat in native SpatiaLite storage — the algorithm was never the problem.
 * `SPATIALITE=YES` additionally builds an R-tree per table, which `indexedPairs`
 * uses to skip most candidate pairs (1.33 s → 0.75 s on the same data).
 *
 * Both inputs must land in *one* database: cross-database SQL works only while
 * the outer dataset is a GeoJSON/VirtualOGR one, and gdal3.js cannot append to
 * an existing database. An OGR VRT solves it by presenting the two separate
 * files as one multi-layer source, which ogr2ogr then converts in a single pass.
 */
async function buildWorkingDatabase(
    gdal: GdalLike,
    inputs: Array<{ layer: string; path: string }>,
): Promise<{ dataset: any; close: () => Promise<void> }> {
    const layers = inputs
        .map(({ layer, path }) => `<OGRVRTLayer name="${layer}">`
            + `<SrcDataSource relativeToVRT="0">${path}</SrcDataSource>`
            + `<SrcLayer>${layer}</SrcLayer></OGRVRTLayer>`)
        .join('');
    const vrt = `<OGRVRTDataSource>${layers}</OGRVRTDataSource>`;

    const vrtFile = new File([new Blob([vrt], { type: 'application/xml' })], 'gp_inputs.vrt');
    const { datasets, errors } = await gdal.open(vrtFile);
    const vrtDataset = datasets[0];
    if (!vrtDataset) throw new Error(`Could not assemble the working dataset: ${errors.join('; ')}`);

    try {
        const dbPath = await gdal.ogr2ogr(vrtDataset, [
            '-f', 'SQLite',
            '-dsco', 'SPATIALITE=YES',
            '-skipfailures',
        ], 'gp_working');

        const opened = await gdal.open(pathOf(dbPath));
        const dataset = opened.datasets[0];
        if (!dataset) throw new Error(`Could not open the working database: ${opened.errors.join('; ')}`);
        return { dataset, close: async () => { await gdal.close(dataset); } };
    } finally {
        await gdal.close(vrtDataset);
    }
}

/**
 * Scale metric parameters into EPSG:3857 units.
 *
 * 3857's unit is a metre only at the equator; elsewhere it is inflated by
 * 1/cos(lat). Dividing by cos(lat) makes a "500 m" tolerance mean 500 m on the
 * ground near the current view.
 */
function scaleMetricParams(params: GeoParamValues, centerLat: number): GeoParamValues {
    const scale = Math.cos((centerLat * Math.PI) / 180) || 1;
    const scaled: GeoParamValues = { ...params };
    for (const key of Object.keys(scaled)) {
        if (!METRIC_PARAMS.has(key)) continue;
        const value = Number(scaled[key]);
        if (Number.isFinite(value)) scaled[key] = value / scale;
    }
    return scaled;
}

export async function runGeoprocess(
    gdal: GdalLike,
    request: GeoprocessRequest,
): Promise<GeoprocessResult> {
    const operation = getOperation(request.operationId);
    if (!operation) throw new Error(`Unknown geoprocessing operation: ${request.operationId}`);

    const needsB = operation.inputs.some(i => i.key === 'b');
    if (needsB && !request.inputB) throw new Error(`"${operation.label}" needs two input layers.`);
    if (!request.inputA.features.length) throw new Error('The input layer has no features.');
    if (needsB && !request.inputB!.features.length) throw new Error('The second layer has no features.');

    const metricA = await toMetric(gdal, request.inputA, LAYER_A);
    const metricB = needsB ? await toMetric(gdal, request.inputB!, LAYER_B) : null;
    const pathA = metricA.path;
    const pathB = metricB?.path ?? null;
    const params = scaleMetricParams(request.params, request.centerLat ?? 0);

    // Features GDAL could not carry into the metric projection are gone before
    // the operation starts, so the result silently answers a smaller question.
    // Saying so is the whole point: a missing country in a label layer looks
    // like a bug in the operation, not like an unrepairable input geometry.
    const warnings: string[] = [];
    const reportDropped = (dropped: number, which: string) => {
        if (dropped > 0) warnings.push(`${dropped} ${dropped === 1 ? 'feature' : 'features'} of ${which} could not be repaired and were left out.`);
    };
    reportDropped(metricA.dropped, needsB ? 'the first layer' : 'the input layer');
    if (metricB) reportDropped(metricB.dropped, 'the second layer');

    // Operations SpatiaLite cannot express run in JS on the reprojected features
    // instead of through -sql, and need no database at all. Everything either
    // side — the 3857 round trip, the metric scaling, the empty-geometry filter —
    // is the same, so a JS operation is not a second pipeline.
    if (operation.compute) {
        const metric = await readFeatureCollection(gdal, pathA);
        const computed = operation.compute(metric, params);
        const skipped = metric.features.length - computed.features.length;
        if (skipped > 0) {
            warnings.push(`${skipped} ${skipped === 1 ? 'feature' : 'features'} were skipped by ${operation.label} — their geometry is not of a type it can use.`);
        }
        return withWarnings(await backToWgs84(gdal, computed, warnings), warnings);
    }

    if (!operation.buildSql) {
        throw new Error(`Operation "${operation.id}" defines neither buildSql nor compute.`);
    }

    const inputs = [{ layer: LAYER_A, path: pathA }];
    if (pathB) inputs.push({ layer: LAYER_B, path: pathB });
    const db = await buildWorkingDatabase(gdal, inputs);

    let resultDataset: any = null;
    try {
        const sql = operation.buildSql({
            layerA: LAYER_A,
            refB: pathB ? LAYER_B : null,
            fieldsA: fieldNames(request.inputA),
            fieldsB: fieldNames(request.inputB),
            params,
        }).trim();

        const computed = await gdal.ogr2ogr(db.dataset, [
            '-f', 'GeoJSON',
            '-dialect', 'SQLITE',
            '-sql', sql,
            '-skipfailures',
            '-nln', 'gp_result',
        ], 'gp_result');

        // A table operation returns attribute rows with no geometry. There is
        // nothing to reproject, and `dropEmptyGeometries` would throw every row
        // away, so it is read back as-is.
        if (operation.outputGeometry === 'table') {
            return withWarnings(await readFeatureCollection(gdal, pathOf(computed)), warnings);
        }

        // Result cleanup runs here, on the SQL output, still in EPSG:3857 — the
        // same coordinates a `compute` operation sees, so metric parameters mean
        // the same thing in both. It costs a parse of the whole result, hence
        // the `postProcessNeeded` gate rather than running it unconditionally.
        if (operation.postProcess && operation.postProcessNeeded?.(params) !== false) {
            const cleaned = operation.postProcess(await readFeatureCollection(gdal, pathOf(computed)), params);
            return withWarnings(await backToWgs84(gdal, cleaned, warnings), warnings);
        }

        const opened = await gdal.open(pathOf(computed));
        resultDataset = opened.datasets[0];
        if (!resultDataset) throw new Error(`Operation produced no readable result: ${opened.errors.join('; ')}`);

        const back = await gdal.ogr2ogr(resultDataset, [
            '-f', 'GeoJSON',
            '-t_srs', 'EPSG:4326',
            '-wrapdateline',
            '-skipfailures',
        ], 'gp_output');

        return withWarnings(dropEmptyGeometries(await readFeatureCollection(gdal, pathOf(back)), warnings), warnings);
    } finally {
        if (resultDataset) await gdal.close(resultDataset);
        await db.close();
    }
}
