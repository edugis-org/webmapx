/**
 * Geoprocessing operation registry — the single source of truth for what the
 * geoprocessing tool can do.
 *
 * Every operation is the same pipeline (reproject inputs → one SQL statement in
 * GDAL's SQLite/SpatiaLite dialect → reproject back), so an operation is *data*,
 * not code: an arity, a parameter list, and an SQL builder.
 *
 * This module is pure (no DOM, no GDAL, no Lit) because it is imported from
 * both sides of the worker boundary:
 *   - `components/webmapx-geoprocessing-tool.ts` renders `inputs`/`params`
 *   - `workers/spatial.worker.ts` calls `buildSql` to produce the ogr2ogr `-sql`
 *
 * Geometry is always processed in EPSG:3857 so distance/tolerance parameters are
 * in metres. See `spatial.worker.ts` for the latitude scale correction.
 */

import polylabel from 'polylabel';
import { Delaunay } from 'd3-delaunay';
import { cartogram } from './cartogram';
import { topology } from 'topojson-server';
import { presimplify } from 'topojson-simplify';
import { feature as topoFeature } from 'topojson-client';

// ─── Types ───────────────────────────────────────────────────────────────────

export type GeoOperationId =
    | 'labelPoint'
    | 'buffer'
    | 'voronoi'
    | 'delaunay'
    | 'cartogram'
    | 'statistics'
    | 'clip'
    | 'erase'
    | 'intersect'
    | 'union'
    | 'selectByLocation'
    | 'spatialJoin'
    | 'dissolve'
    | 'centroid'
    | 'convexHull'
    | 'simplify';

export type GeoOperationCategory = 'overlay' | 'selection' | 'aggregate' | 'transform';

/** One layer slot in the tool UI. `role` is what the student is told it means. */
export interface GeoInputSpec {
    /** Slot key — `a` is always the primary input, `b` the overlay/mask. */
    key: 'a' | 'b';
    /** Field label, e.g. "Layer to clip" / "Clip with". */
    label: string;
    /** One-line explanation shown under the select. */
    hint?: string;
}

/**
 * `showWhen` hides a parameter that another parameter's value makes irrelevant,
 * so the panel never asks for a number nobody will read. Hidden parameters keep
 * their default value — the operation still receives them.
 */
export type GeoParamSpec = GeoParamSpecBase & {
    showWhen?: (params: GeoParamValues) => boolean;
};

type GeoParamSpecBase =
    | {
          kind: 'number';
          key: string;
          label: string;
          default: number;
          min?: number;
          max?: number;
          step?: number;
          /** Suffix shown in the input, e.g. "m". */
          unit?: string;
          hint?: string;
      }
    | {
          kind: 'select';
          key: string;
          label: string;
          default: string;
          options: Array<{ value: string; label: string }>;
          hint?: string;
      }
    | {
          kind: 'field';
          key: string;
          label: string;
          /** Which input slot's attributes to offer. */
          from: 'a' | 'b';
          /** Allow "(none)" — dissolve everything into one feature. */
          optional?: boolean;
          /**
           * Offer only fields observed to hold numbers. Same rule the
           * aggregations list uses for `total`/`average`: a field that is a
           * number in some features and text in others does not count.
           */
          numericOnly?: boolean;
          hint?: string;
      }
    | {
          /**
           * A repeatable list of field + function rows, the equivalent of writing
           * `SUM(...)`, `AVG(...)` by hand in a GROUP BY query.
           */
          kind: 'aggregations';
          key: string;
          label: string;
          from: 'a' | 'b';
          hint?: string;
      };

/** One "summarise this field this way" row. */
export interface AggregationSpec {
    field: string;
    fn: AggregationFn;
    /** `list` only: what to put between the values. */
    separator?: string;
    /** `list` only: drop repeated values. */
    unique?: boolean;
    /** `list` only: sort order of the values. */
    order?: 'asc' | 'desc';
}

export type AggregationFn = 'sum' | 'mean' | 'min' | 'max' | 'count' | 'list';

export const AGGREGATION_FUNCTIONS: Array<{
    value: AggregationFn;
    label: string;
    sql: string;
    /** Suffix added to the field name to form the output column. */
    suffix: string;
    /** Only offered for fields that actually hold numbers. */
    numericOnly?: boolean;
}> = [
    { value: 'sum', label: 'total', sql: 'SUM', suffix: 'total', numericOnly: true },
    { value: 'mean', label: 'average', sql: 'AVG', suffix: 'average', numericOnly: true },
    { value: 'min', label: 'lowest', sql: 'MIN', suffix: 'min' },
    { value: 'max', label: 'highest', sql: 'MAX', suffix: 'max' },
    { value: 'count', label: 'number of values', sql: 'COUNT', suffix: 'count' },
    { value: 'list', label: 'list the values', sql: '', suffix: 'list' },
];

/** Defaults for the `list` function, mirroring PostgreSQL's `string_agg`. */
export const DEFAULT_LIST_SEPARATOR = ', ';

export type GeoParamValues = Record<string, string | number | AggregationSpec[]>;

/** Everything `buildSql` needs, assembled by the worker. */
export interface GeoSqlContext {
    /** Table name of input A in the working database. */
    layerA: string;
    /** Table name of input B, or null for one-input operations. */
    refB: string | null;
    /** Attribute names of input A (geometry column excluded). */
    fieldsA: string[];
    /** Attribute names of input B (geometry column excluded). */
    fieldsB: string[];
    params: GeoParamValues;
}

/**
 * An operation computed in JavaScript instead of SQL, for algorithms SpatiaLite
 * does not have. It receives the input already reprojected to EPSG:3857 (so
 * metric parameters are directly usable) and must return features in that same
 * projection; the runner reprojects the result back.
 */
export type GeoCompute = (
    input: GeoJSON.FeatureCollection,
    params: GeoParamValues,
    context: GeoComputeContext,
) => ComputedCollection | Promise<ComputedCollection>;

/**
 * A `compute` result, optionally saying what the caller should be told about it.
 *
 * The runner already reports what it can see from outside — features dropped,
 * counts in and out — but only the operation knows whether its own answer is any
 * good. An approximate method that quietly returns a bad approximation is worse
 * than one that fails, so it says so here and the runner passes it on.
 */
export interface ComputedCollection extends GeoJSON.FeatureCollection {
    warnings?: string[];
}

/**
 * What a `compute` operation needs from its host and cannot import itself.
 *
 * Only asset URLs so far: a WASM binary is renamed by the bundler, so the file
 * that owns the `?url` import (the worker) has to hand the address down. The
 * runner stays free of bundler syntax that way, which is what lets the tests run
 * it under plain Node — where the package resolves its own binary and this is
 * left empty.
 */
export interface GeoComputeContext {
    /** Address of go-cart's `cart.wasm`, used by the diffusion cartogram. */
    goCartWasmUrl?: string;
}

/** Same contract as `GeoCompute`, but applied to a result rather than an input. */
export type GeoPostProcess = GeoCompute;

export interface GeoOperation {
    id: GeoOperationId;
    label: string;
    category: GeoOperationCategory;
    /** One sentence, shown next to the diagram. */
    description: string;
    inputs: GeoInputSpec[];
    params: GeoParamSpec[];
    /**
     * Geometry type of the result, used to style the output layer.
     * `same` keeps the input's rendering type; `table` means the operation
     * produces attribute rows with no geometry, shown in the panel instead of
     * being added to the map.
     */
    outputGeometry: 'polygon' | 'point' | 'same' | 'table';
    /** Default output layer name, given the input layer labels. */
    outputName: (labelA: string, labelB?: string) => string;
    /**
     * Exactly one of `buildSql` / `compute` must be set — SQL for anything
     * SpatiaLite can express, `compute` for algorithms it lacks. The registry
     * test enforces this, and the runner throws if an operation has neither.
     */
    buildSql?: (ctx: GeoSqlContext) => string;
    compute?: GeoCompute;
    /**
     * Which coordinates `compute` wants. The default is EPSG:3857, because a
     * planar algorithm needs metres and most of these do.
     *
     * `'lonlat'` hands the operation the input untouched and takes its output as
     * the result, skipping both reprojections. It is for an operation that
     * measures on the *sphere* and would otherwise have to undo the projection
     * itself — the cartogram, which sizes shapes by ground area and for which
     * Mercator's 1/cos²(lat) inflation is the whole problem. Metric parameters
     * are not scaled in this mode, since there is no projection to scale into.
     */
    computeSpace?: 'metric' | 'lonlat';
    /**
     * Cleanup applied to the *result*, in EPSG:3857, before it is reprojected
     * back. Not a third computation branch: `buildSql`/`compute` answer the
     * question, this tidies the answer up (see `removeSmallHoles`), so the
     * exactly-one invariant between those two still holds.
     *
     * Only run when `postProcessNeeded` says so — reading the result back into
     * JS costs a parse of the whole output, which is wasted when the cleanup is
     * switched off.
     */
    postProcess?: GeoPostProcess;
    postProcessNeeded?: (params: GeoParamValues) => boolean;
}

// ─── SQL helpers ─────────────────────────────────────────────────────────────

/** Quote an SQL identifier. Layer/field names come from user data. */
export function q(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`;
}

/** `a."field1", a."field2"` — never `a.*`, which would duplicate the geometry column. */
function cols(alias: string, fields: string[], prefix = ''): string {
    if (!fields.length) return '';
    return fields
        .map(f => `${alias}.${q(f)} AS ${q(prefix + f)}`)
        .join(', ');
}

/**
 * `SUM(a."pop") AS "pop_total"`, one per requested row.
 *
 * The output name carries the function (`pop_total`, `pop_average`) because a
 * user can summarise the same field twice, and two columns called `pop` would
 * silently collapse into one.
 */
function aggregationColumns(alias: string, value: unknown, table: string, groupBy: string): string {
    if (!Array.isArray(value)) return '';
    return (value as AggregationSpec[])
        .filter(spec => spec?.field)
        .map(spec => {
            const fn = AGGREGATION_FUNCTIONS.find(f => f.value === spec.fn) ?? AGGREGATION_FUNCTIONS[0];
            const output = q(`${spec.field}_${fn.suffix}`);
            return spec.fn === 'list'
                ? `${listExpression(alias, spec, table, groupBy)} AS ${output}`
                : `${fn.sql}(${alias}.${q(spec.field)}) AS ${output}`;
        })
        .join(', ');
}

/**
 * PostgreSQL's `string_agg(field, sep ORDER BY … )`, rebuilt for SQLite 3.45.
 *
 * SQLite's `group_concat` cannot do what one expression needs to do here: it
 * rejects `ORDER BY` inside the aggregate, and `DISTINCT` and a custom separator
 * are mutually exclusive (`group_concat(DISTINCT x, ' | ')` is a syntax error).
 * Both were verified against the bundled build rather than assumed.
 *
 * A correlated subquery sidesteps all of it: sort and deduplicate the values
 * first, then concatenate. Correlating per *group* is cheap — there are few
 * groups — unlike correlating per row, which is what makes other queries crawl.
 */
function listExpression(alias: string, spec: AggregationSpec, table: string, groupBy: string): string {
    const separator = spec.separator ?? DEFAULT_LIST_SEPARATOR;
    const distinct = spec.unique ? 'DISTINCT ' : '';
    const direction = spec.order === 'desc' ? 'DESC' : 'ASC';
    // Grouped queries need the subquery limited to the current group; an
    // ungrouped one summarises everything, so it has no condition to add.
    const scope = groupBy
        ? `WHERE inner_row.${q(groupBy)} IS ${alias}.${q(groupBy)}`
        : '';
    return `(SELECT group_concat(v, ${sqlText(separator)}) FROM (
                SELECT ${distinct}inner_row.${q(spec.field)} AS v
                FROM ${q(table)} inner_row ${scope}
                ORDER BY v ${direction}))`;
}

/** Quote a string literal for SQL. */
function sqlText(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
}

/** Joins non-empty SQL fragments with commas. */
function selectList(...parts: string[]): string {
    return parts.filter(p => p.length > 0).join(', ');
}

/** Output name for one of B's fields — suffixed when it would collide with A's. */
function outputNameForB(fieldsA: string[], field: string): string {
    return fieldsA.includes(field) ? `${field}_2` : field;
}

/** Suffix B's field names when they would collide with A's. */
function disambiguate(fieldsA: string[], fieldsB: string[]): string {
    return fieldsB.map(f => `b.${q(f)} AS ${q(outputNameForB(fieldsA, f))}`).join(', ');
}

/**
 * The same column list for every branch of a UNION ALL: A's fields, then B's,
 * then `part`. A branch that has no value for a column selects NULL for it, so
 * all branches agree on column count, order and name — SQLite matches by
 * position, so a mismatch would silently file B's values under A's headings.
 */
function unionBranch(
    fieldsA: string[],
    fieldsB: string[],
    available: 'a' | 'b' | 'both',
    part: string,
    geometry: string,
): string {
    const fromA = fieldsA.map(f => (available === 'b' ? `NULL AS ${q(f)}` : `a.${q(f)} AS ${q(f)}`));
    const fromB = fieldsB.map(f => {
        const alias = q(outputNameForB(fieldsA, f));
        return available === 'a' ? `NULL AS ${alias}` : `b.${q(f)} AS ${alias}`;
    });
    return selectList(...fromA, ...fromB, `'${part}' AS part`, `${geometry} AS geometry`);
}

// ─── Gap cleanup ─────────────────────────────────────────────────────────────

/**
 * Hole area below which `auto` calls a hole a gap, as a fraction of the ring it
 * sits in.
 *
 * Measured, not guessed. Dissolving a vector-tile layer into 233 countries left
 * 8906 holes; relative to their own polygon they are p50 3.4e-6, p90 4.4e-5,
 * p99 5.2e-4. Lake Winnipeg is 2.5e-3 of Canada — the largest real lake most
 * likely to be mistaken for a gap, and still 2.5x above this line. At 1e-3,
 * 8833 of the 8906 go and the lake stays.
 */
const AUTO_HOLE_FRACTION = 1e-3;

/**
 * Median area error above which a cartogram is reported as not having worked.
 *
 * 10% is the point where reading the map gives the wrong answer: a region shown
 * a tenth too large is no longer comparable with its neighbour. The contiguous
 * method's own promise is a few percent at the median, so this does not fire on
 * a normal run.
 */
const MISLEADING_AREA_ERROR = 0.1;

/**
 * Share of a layer's area that has to go into dropped islands before the
 * cartogram says so.
 *
 * The default threshold costs 0.29% on the demo's world-population layer, well
 * under this, so a normal run stays quiet; 2% means the reader has lost
 * something they would notice was missing.
 */
const NOTABLE_DROPPED_AREA = 0.02;


function ringSignedArea(ring: GeoJSON.Position[]): number {
    let sum = 0;
    for (let i = 0; i < ring.length - 1; i++) {
        sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    }
    return Math.abs(sum / 2);
}

/** Longest side of a ring's bounding box — how wide the gap reads on the map. */
function ringExtent(ring: GeoJSON.Position[]): number {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of ring) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }
    return Math.max(maxX - minX, maxY - minY);
}

/**
 * Drops the holes that are quantisation gaps and keeps the ones that are lakes.
 *
 * Dissolving vector-tile data leaves holes wherever two neighbours' simplified
 * borders fail to meet. They are not invalid geometry — `ST_MakeValid` repairs a
 * geometry against itself and never moves one geometry onto another — so they
 * survive the union as genuine empty space: blocky 4-6 point rectangles on the
 * tile's quantisation grid (measured on France: 229 holes, p50 3.3 km across).
 *
 * Two ways to say which holes are gaps, because the right answer depends on
 * scale and only the user knows the data:
 *   - `auto` compares each hole with the ring that contains it, which is
 *     scale-free: it means the same thing for Dutch municipalities merged into a
 *     province and for world regions merged into countries.
 *   - `size` takes a width in metres, for when the relative rule guesses wrong —
 *     a large country's real lake is relatively small, a small province's gap is
 *     relatively large.
 *
 * Comparing against the containing ring rather than the whole feature matters
 * for archipelagos: a lake on a small island is a large fraction of that island
 * and a vanishing fraction of the country.
 */
function removeSmallHoles(input: GeoJSON.FeatureCollection, params: GeoParamValues): GeoJSON.FeatureCollection {
    const mode = String(params.holes ?? 'keep');
    if (mode !== 'auto' && mode !== 'size') return input;
    // Already scaled from metres into 3857 units by the runner (METRIC_PARAMS).
    const maxExtent = Number(params.holeSize) || 0;

    const keepHole = (hole: GeoJSON.Position[], outerArea: number): boolean =>
        mode === 'auto'
            ? ringSignedArea(hole) >= AUTO_HOLE_FRACTION * outerArea
            : ringExtent(hole) >= maxExtent;

    const cleanPolygon = (polygon: GeoJSON.Position[][]): GeoJSON.Position[][] => {
        if (polygon.length < 2) return polygon;
        const outerArea = ringSignedArea(polygon[0]);
        return [polygon[0], ...polygon.slice(1).filter(hole => keepHole(hole, outerArea))];
    };

    return {
        ...input,
        features: input.features.map(feature => {
            const geometry = feature.geometry;
            if (geometry?.type === 'Polygon') {
                return { ...feature, geometry: { ...geometry, coordinates: cleanPolygon(geometry.coordinates) } };
            }
            if (geometry?.type === 'MultiPolygon') {
                return { ...feature, geometry: { ...geometry, coordinates: geometry.coordinates.map(cleanPolygon) } };
            }
            return feature;
        }),
    };
}

/** Parameters every operation that can leave gaps behind offers. */
const HOLE_PARAMS: GeoParamSpec[] = [
    {
        kind: 'select',
        key: 'holes',
        label: 'Small gaps',
        default: 'auto',
        options: [
            { value: 'auto', label: 'remove (relative to each shape)' },
            { value: 'size', label: 'remove up to a given width' },
            { value: 'keep', label: 'keep every hole' },
        ],
        hint: 'Merging tile-based data leaves gaps where neighbouring borders do not meet exactly. Real holes such as a large lake are kept.',
    },
    {
        kind: 'number',
        key: 'holeSize',
        label: 'Gaps narrower than',
        default: 1000,
        min: 0,
        step: 100,
        unit: 'm',
        showWhen: params => params.holes === 'size',
    },
];

// ─── polylabel ───────────────────────────────────────────────────────────────

/**
 * Pole of inaccessibility for one polygon: the point furthest from any edge.
 *
 * Coordinates are EPSG:3857 metres here (the runner reprojects before calling),
 * so `precision` is a real-world distance and polylabel's planar assumptions hold.
 */
function poleOfInaccessibility(
    polygon: GeoJSON.Position[][],
    precision: number,
): { point: GeoJSON.Position; distance: number } | null {
    if (!polygon.length || polygon[0].length < 4) return null;
    const result = polylabel(polygon as number[][][], precision) as number[] & { distance: number };
    if (!Number.isFinite(result[0]) || !Number.isFinite(result[1])) return null;
    return { point: [result[0], result[1]], distance: result.distance };
}

/**
 * Every polygon inside a geometry, whatever wrapper it arrived in.
 *
 * GeometryCollection is not an exotic case here: repairing an invalid polygon
 * (`ogr2ogr -makevalid`) routinely returns the repaired areas *plus* the
 * collapsed slivers as lines, wrapped in a collection. Treating that as "not a
 * polygon" is what made whole countries vanish from a label layer. The
 * non-areal members are ignored — there is no inside to be furthest from.
 */
function polygonsOf(geometry: GeoJSON.Geometry | null | undefined): GeoJSON.Position[][][] {
    if (!geometry) return [];
    if (geometry.type === 'Polygon') return [geometry.coordinates];
    if (geometry.type === 'MultiPolygon') return geometry.coordinates;
    if (geometry.type === 'GeometryCollection') return geometry.geometries.flatMap(polygonsOf);
    return [];
}

/**
 * One label point per feature.
 *
 * A MultiPolygon gets a single point, placed in whichever part has the most room
 * — labelling every island of an archipelago separately is a different operation,
 * and one label per feature is what a legend or a map label expects.
 * Non-polygon features are skipped: there is no "inside" to be furthest from.
 */
function labelPoints(input: GeoJSON.FeatureCollection, params: GeoParamValues): GeoJSON.FeatureCollection {
    const precision = Math.max(Number(params.precision) || 1, 0.001);
    const features: GeoJSON.Feature[] = [];

    for (const feature of input.features) {
        const polygons = polygonsOf(feature.geometry);

        let best: { point: GeoJSON.Position; distance: number } | null = null;
        for (const polygon of polygons) {
            const candidate = poleOfInaccessibility(polygon, precision);
            if (candidate && (!best || candidate.distance > best.distance)) best = candidate;
        }
        if (!best) continue;

        features.push({
            type: 'Feature',
            properties: { ...(feature.properties ?? {}) },
            geometry: { type: 'Point', coordinates: best.point },
        });
    }

    return { type: 'FeatureCollection', features };
}

// ─── Voronoi / Delaunay ──────────────────────────────────────────────────────

/**
 * The point a feature is represented by when it takes part in a triangulation.
 *
 * Both operations are defined on points, but a student will hand them anything
 * that is on the map. Rather than silently dropping polygons — which looks like
 * half the layer disappeared — every feature contributes the average of its
 * coordinates: for a Point that *is* the point, for anything else its rough
 * centre, which is what "the Voronoi diagram of these municipalities" means.
 */
function representativePoint(geometry: GeoJSON.Geometry | null | undefined): GeoJSON.Position | null {
    if (!geometry) return null;
    if (geometry.type === 'GeometryCollection') {
        const points = geometry.geometries.map(representativePoint).filter(Boolean) as GeoJSON.Position[];
        if (!points.length) return null;
        return averagePosition(points);
    }
    const points: GeoJSON.Position[] = [];
    const walk = (coords: unknown): void => {
        if (!Array.isArray(coords)) return;
        if (typeof coords[0] === 'number') {
            points.push([coords[0] as number, coords[1] as number]);
            return;
        }
        for (const child of coords) walk(child);
    };
    walk((geometry as { coordinates?: unknown }).coordinates);
    if (!points.length) return null;
    return averagePosition(points);
}

/**
 * Mean of a set of coordinates, computed in a frame where they are contiguous.
 *
 * The averaging matters at the antimeridian for the same reason the whole layer
 * does: a country split across ±180° (Fiji, Russia, Kiribati — and any polygon
 * the runner's `-clipsrc` cut in half at the line) has half its coordinates at
 * +20 037 508 and half at -20 037 508, so a naive mean puts its "centre" on the
 * prime meridian, off the coast of Africa. Averaging in the shifted frame and
 * wrapping the answer back puts it in the Pacific where it belongs.
 */
function averagePosition(points: GeoJSON.Position[]): GeoJSON.Position {
    let sumX = 0, sumY = 0, shiftedSumX = 0;
    let min = Infinity, max = -Infinity, shiftedMin = Infinity, shiftedMax = -Infinity;
    for (const [x, y] of points) {
        const shifted = x < 0 ? x + WORLD_WIDTH : x;
        sumX += x;
        shiftedSumX += shifted;
        sumY += y;
        min = Math.min(min, x);
        max = Math.max(max, x);
        shiftedMin = Math.min(shiftedMin, shifted);
        shiftedMax = Math.max(shiftedMax, shifted);
    }
    const useShifted = shiftedMax - shiftedMin < max - min;
    const x = (useShifted ? shiftedSumX : sumX) / points.length;
    const y = sumY / points.length;
    // Back into the canonical range, so the whole-layer unwrap that follows sees
    // every site expressed the same way.
    const half = WORLD_WIDTH / 2;
    return [x > half ? x - WORLD_WIDTH : x, y];
}

interface Site {
    point: GeoJSON.Position;
    feature: GeoJSON.Feature;
    /** 1-based position in the input, used to name a triangle's corners. */
    index: number;
}

/** Width of the world in EPSG:3857 metres — the jump across the antimeridian. */
const WORLD_WIDTH = 2 * 20037508.342789244;

/**
 * Moves the western points one world east when that makes the group narrower.
 *
 * A planar triangulation has no idea that x = +20 037 508 and x = -20 037 508 are
 * the same meridian, so a group of points straddling the antimeridian — Fiji,
 * the Aleutians, the Chatham Islands — looks like two clusters half a planet
 * apart. The Voronoi cells then run right across the Pacific instead of meeting
 * at the date line, and the Delaunay triangles connect the wrong neighbours.
 *
 * The fix is to work in a frame where the group is contiguous: shift every
 * negative-x point by one world width and keep that layout if it is narrower
 * than the original. The result is coordinates beyond ±180° after the inverse
 * projection, which is exactly what `ogr2ogr -wrapdateline` (already in the
 * runner's way back to WGS84) exists to normalise — it wraps the coordinates and
 * splits any geometry that crosses the line.
 *
 * A genuinely worldwide layer is left alone: shifting it makes it no narrower,
 * so the test fails and nothing moves.
 */
function unwrapAcrossDateline(sites: Site[]): void {
    if (sites.length < 2) return;

    let min = Infinity, max = -Infinity;
    let shiftedMin = Infinity, shiftedMax = -Infinity;
    for (const { point } of sites) {
        const shifted = point[0] < 0 ? point[0] + WORLD_WIDTH : point[0];
        min = Math.min(min, point[0]);
        max = Math.max(max, point[0]);
        shiftedMin = Math.min(shiftedMin, shifted);
        shiftedMax = Math.max(shiftedMax, shifted);
    }
    if (shiftedMax - shiftedMin >= max - min) return;

    for (const site of sites) {
        if (site.point[0] < 0) site.point = [site.point[0] + WORLD_WIDTH, site.point[1]];
    }
}

function sitesOf(input: GeoJSON.FeatureCollection): Site[] {
    const sites: Site[] = [];
    input.features.forEach((feature, i) => {
        const point = representativePoint(feature.geometry);
        if (point && Number.isFinite(point[0]) && Number.isFinite(point[1])) {
            sites.push({ point, feature, index: i + 1 });
        }
    });
    unwrapAcrossDateline(sites);
    return sites;
}

/**
 * The three copies of the world a triangulation is built on: one world west, the
 * real one, one world east.
 *
 * Unwrapping (above) puts a *local* group of points into one contiguous frame,
 * but it cannot help a worldwide layer, where the points genuinely span the
 * globe: there the plane still has an artificial seam down the middle of the
 * Pacific, so the two countries either side of the date line are not neighbours
 * and their cells run out to the edge of the diagram instead of meeting.
 * Reprojection then wraps that overhang round to the far side of the map, which
 * is what shows up as cells overlapping and edges streaking across the world.
 *
 * Copying every point one world east and west closes the seam: a point near
 * +180° now has the eastern points as real neighbours (through their western
 * copies), so the bisector between them lands on the date line where it belongs.
 * The copies exist only to shape the cells — no feature is emitted for them.
 * The cost is 3x the points, which is nothing next to what the map does with the
 * result.
 */
const REPLICA_OFFSETS = [-WORLD_WIDTH, 0, WORLD_WIDTH];

/** Horizontal span of the points, and the middle of it. */
function xExtent(sites: Site[]): { min: number; max: number; middle: number } {
    let min = Infinity, max = -Infinity;
    for (const { point } of sites) {
        min = Math.min(min, point[0]);
        max = Math.max(max, point[0]);
    }
    return { min, max, middle: (min + max) / 2 };
}

/**
 * The copies of the world to triangulate on: three for a layer that wraps the
 * globe, one for anything smaller.
 *
 * Only a layer wide enough to reach both sides of the date line has a seam to
 * close. Copying a local layer's points would change its result for no reason —
 * and does, in near-degenerate cases: three almost collinear points have a
 * circumcircle thousands of kilometres wide, big enough for a copy one world
 * away to fall inside it and suppress the triangle.
 */
function worldCopies(sites: Site[]): number[] {
    const { min, max } = xExtent(sites);
    return max - min > WORLD_WIDTH / 2 ? REPLICA_OFFSETS : [0];
}

function replicatedPoints(sites: Site[], offsets: number[]): Array<[number, number]> {
    return offsets.flatMap(offset =>
        sites.map(s => [s.point[0] + offset, s.point[1]] as [number, number]));
}

/**
 * The rectangle a Voronoi diagram is cut off at.
 *
 * A Voronoi diagram is infinite, so it only exists inside a boundary. The
 * bounding box of the points themselves would clip the outer cells hard against
 * the outermost points, so it is padded — by a distance the user gives, falling
 * back to a fraction of the extent when they leave it at 0.
 *
 * The padded box is then capped at one world wide, centred on the points. Beyond
 * that the diagram would cover the same ground twice — the same longitudes,
 * reached by going the other way round — which is exactly the overlap this
 * operation is trying not to produce. Vertically it is capped at Mercator's own
 * limit, since y is not periodic and there is nothing past it.
 */
function siteWindow(sites: Site[], params: GeoParamValues): [number, number, number, number] {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const { point } of sites) {
        minX = Math.min(minX, point[0]);
        maxX = Math.max(maxX, point[0]);
        minY = Math.min(minY, point[1]);
        maxY = Math.max(maxY, point[1]);
    }
    const padding = Math.max(Number(params.padding) || 0, 0)
        || Math.max(maxX - minX, maxY - minY) * 0.1
        || 1000;

    const half = WORLD_WIDTH / 2;
    const middle = (minX + maxX) / 2;
    return [
        Math.max(minX - padding, middle - half),
        Math.max(minY - padding, -half),
        Math.min(maxX + padding, middle + half),
        Math.min(maxY + padding, half),
    ];
}

/**
 * Cuts a convex ring at the antimeridian and brings every piece back inside the
 * world, as one or more rings.
 *
 * This has to happen here rather than being left to `ogr2ogr -wrapdateline` on
 * the way home. A cell built on the copied worlds can reach past ±180°, and
 * reprojection folds those coordinates back into range *without* splitting the
 * ring first: a cell hugging the date line comes back as a polygon stretched
 * 355° the wrong way round the map. Measured on 257 world centroids, ten cells
 * came back like that — which is exactly what "overlapping cells and lines
 * across the whole globe" looks like.
 *
 * Both shapes this is used on (Voronoi cells, triangles) are convex, so
 * Sutherland–Hodgman against the two meridians is exact, and clipping the ring
 * shifted one world either way collects the pieces that belong on the far side.
 */
function splitAtDateline(ring: GeoJSON.Position[]): GeoJSON.Position[][] {
    const half = WORLD_WIDTH / 2;
    const parts: GeoJSON.Position[][] = [];
    // A GeoJSON ring repeats its first point; the clipper walks edges itself and
    // would treat the repeat as a zero-length one.
    const open = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
        ? ring.slice(0, -1)
        : ring;

    for (const shift of [-WORLD_WIDTH, 0, WORLD_WIDTH]) {
        let clipped = open.map(([x, y]) => [x + shift, y] as GeoJSON.Position);
        clipped = clipHalfPlane(clipped, -half, true);
        clipped = clipHalfPlane(clipped, half, false);
        if (clipped.length < 3) continue;

        const closed = [...clipped, clipped[0]];
        // Rings that survive only as a sliver on the cut line are floating-point
        // residue, not geometry: 1 m² against cells of millions of km².
        if (ringSignedArea(closed) < 1) continue;
        parts.push(closed);
    }
    return parts;
}

/** One Sutherland–Hodgman pass: keep what is east (`keepAbove`) or west of `x`. */
function clipHalfPlane(ring: GeoJSON.Position[], x: number, keepAbove: boolean): GeoJSON.Position[] {
    const inside = (p: GeoJSON.Position) => (keepAbove ? p[0] >= x : p[0] <= x);
    const out: GeoJSON.Position[] = [];

    for (let i = 0; i < ring.length; i++) {
        const current = ring[i];
        const previous = ring[(i + ring.length - 1) % ring.length];
        const currentIn = inside(current);
        if (currentIn !== inside(previous)) {
            const t = (x - previous[0]) / (current[0] - previous[0]);
            out.push([x, previous[1] + t * (current[1] - previous[1])]);
        }
        if (currentIn) out.push(current);
    }
    return out;
}

/**
 * Voronoi cells: the area closer to each point than to any other point.
 *
 * SpatiaLite 5.1 does have `VoronojDiagram`, but it returns the whole diagram as
 * one collection, and splitting that back into one row per input point — which
 * is the only way the cell can keep its point's attributes — needs the
 * `ElementaryGeometries` virtual table that gdal3.js does not expose. d3-delaunay
 * gives the cells *indexed by input point*, so the join is free.
 *
 * Coordinates are EPSG:3857 metres here, which is what makes a planar
 * triangulation the right thing to compute at all.
 */
function voronoiCells(input: GeoJSON.FeatureCollection, params: GeoParamValues): GeoJSON.FeatureCollection {
    const sites = sitesOf(input);
    if (!sites.length) throw new Error('Voronoi needs at least one point.');

    const window = siteWindow(sites, params);
    const offsets = worldCopies(sites);
    const points = replicatedPoints(sites, offsets);
    const voronoi = Delaunay.from(points).voronoi(window);

    const features: GeoJSON.Feature[] = [];
    sites.forEach((site, i) => {
        // A cell is collected from every copy of its point, because the piece of
        // it that reaches past the date line belongs to the copy one world over.
        // Null for a point that coincides exactly with an earlier one: it has no
        // area of its own. The runner reports the difference in feature counts.
        const parts: GeoJSON.Position[][][] = [];
        for (let copy = 0; copy < offsets.length; copy++) {
            const cell = voronoi.cellPolygon(copy * sites.length + i);
            if (!cell || cell.length < 4) continue;
            for (const ring of splitAtDateline(cell.map(([x, y]) => [x, y] as GeoJSON.Position))) {
                parts.push([ring]);
            }
        }
        if (!parts.length) return;
        features.push({
            type: 'Feature',
            properties: { ...(site.feature.properties ?? {}) },
            geometry: parts.length === 1
                ? { type: 'Polygon', coordinates: parts[0] }
                : { type: 'MultiPolygon', coordinates: parts },
        });
    });

    return { type: 'FeatureCollection', features };
}

/**
 * Delaunay triangulation: the triangles whose circumcircles contain no other
 * point — the "most equilateral" way to connect the points, and the dual of the
 * Voronoi diagram above (same `Delaunay` object, other side of it).
 *
 * A triangle belongs to three input features rather than one, so it cannot carry
 * their attributes; it carries their position in the input instead, which is
 * what lets a result be traced back to its corners.
 */
function delaunayTriangles(input: GeoJSON.FeatureCollection): GeoJSON.FeatureCollection {
    const sites = sitesOf(input);
    if (sites.length < 3) throw new Error('A Delaunay triangulation needs at least three points.');

    // Built on the same three copies of the world as the Voronoi diagram, and
    // for the same reason: without them the points either side of the date line
    // are not neighbours, so the mesh joins them the long way round the globe.
    const offsets = worldCopies(sites);
    const points = replicatedPoints(sites, offsets);
    const delaunay = Delaunay.from(points);
    // Points on one line have no triangulation. d3 does not say so: it jitters
    // them and hands back a zero-area triangle, which would be added to the map
    // as an invisible layer. `collinear` is how it flags that it had to.
    // `collinear` is set by the implementation but missing from its type
    // definitions, hence the cast.
    if ((delaunay as unknown as { collinear?: ArrayLike<number> }).collinear) {
        throw new Error('All points lie on one line, so there are no triangles to build.');
    }

    const features: GeoJSON.Feature[] = [];
    const half = WORLD_WIDTH / 2;
    const middle = xExtent(sites).middle;

    for (let t = 0; t < delaunay.triangles.length; t += 3) {
        const corners = [delaunay.triangles[t], delaunay.triangles[t + 1], delaunay.triangles[t + 2]];
        const xs = corners.map(c => points[c][0]);

        if (offsets.length > 1) {
            // On three copies of the world every triangle exists three times, so
            // two of each have to go. Keeping the one whose centre falls in the
            // middle world does it without assuming anything about which copy a
            // corner came from — a triangle straddling the date line has corners
            // from two copies by definition.
            const centre = (xs[0] + xs[1] + xs[2]) / 3;
            if (centre < middle - half || centre >= middle + half) continue;

            // A triangle joining a point to a *distant* copy of another one is
            // the artificial kind: it reaches round the globe rather than across
            // the date line. Anything wider than half the world is one of those.
            if (Math.max(...xs) - Math.min(...xs) > half) continue;
        }

        // A triangle whose corners come from two copies of the world crosses the
        // date line, so it is cut there — one part either side, as a multipart
        // feature — rather than being left to wrap into a 355°-wide sliver.
        const ring = corners.map(c => [points[c][0], points[c][1]] as GeoJSON.Position);
        const rings = splitAtDateline([...ring, ring[0]]);
        if (!rings.length) continue;

        features.push({
            type: 'Feature',
            properties: {
                triangle: features.length + 1,
                point_1: sites[corners[0] % sites.length].index,
                point_2: sites[corners[1] % sites.length].index,
                point_3: sites[corners[2] % sites.length].index,
            },
            geometry: rings.length === 1
                ? { type: 'Polygon', coordinates: [rings[0]] }
                : { type: 'MultiPolygon', coordinates: rings.map(r => [r]) },
        });
    }

    return { type: 'FeatureCollection', features };
}

// ─── Performance helpers ─────────────────────────────────────────────────────

/**
 * Restricts `b` to the features whose bounding box meets `aGeom`, using the
 * SpatiaLite R-tree the runner builds for every input table.
 *
 * Measured on 144 x 576 polygons of 401 vertices: a plain cross join takes
 * 1.33 s, this 0.75 s. An `MbrIntersects` filter in the WHERE clause instead —
 * the obvious alternative — is worth only 6%, because it still visits every pair
 * and the cost is dominated by deserialising each geometry, not by the test.
 *
 * `alias` is the alias used in the query; `table` must be the real table name,
 * since SpatiaLite's index registry is keyed by table, not by alias.
 */
/**
 * `target` minus the whole of `table`, dissolved.
 *
 * The subtrahend is deliberately the *entire* other layer rather than each row's
 * neighbours. Narrowing it looks like the obvious win and is not: measured on
 * 4000 regions against 257 countries, a per-row union of R-tree neighbours takes
 * 96 s and an aggregate over a join the same, against 30 s for this. A
 * correlated subquery is re-run per row, and that costs far more than the larger
 * geometry does. Skipping rows with no neighbour at all (a cheap index EXISTS,
 * keeping the global union) saves only 8% — not worth the extra SQL.
 */
/**
 * `ST_Union` over many geometries, repairing each one on the way in.
 *
 * A union is all-or-nothing: GEOS throwing on a single member makes SpatiaLite
 * return NULL for the whole group, and the runner then drops that row — so one
 * bad province silently costs you the entire country. Measured on a 233-country
 * dissolve of vector-tile data, four countries (India, Mozambique, Russia,
 * Vietnam) came out NULL without this and none with it.
 *
 * Repairing the inputs before the SQL is not enough: reprojection to EPSG:3857
 * and clipping round coordinates, which can make a repaired geometry invalid
 * again. `ST_Buffer(geom, 0)` fixes the same rows more cheaply (+40% against
 * +85%) but is a side effect of an unrelated operation, and it alters
 * geometry rather than repairing it.
 */
function unionValid(expression: string): string {
    return `ST_Union(ST_MakeValid(${expression}))`;
}

/**
 * Drops rows whose geometry came out empty, in SQL rather than afterwards.
 *
 * An operation that cuts one layer by another leaves nothing behind for a
 * feature the other layer covers completely (erase) or never touches (clip).
 * That row's geometry is empty, and an empty geometry is not merely useless —
 * GDAL derives the output layer's geometry type from what it writes first, and
 * an empty one gives it nothing to go on, so **every later feature is dropped
 * too**. Measured: erasing two points with a box over the first returned
 * nothing at all, while putting the same two points in the other order returned
 * the survivor. A layer's contents are not supposed to depend on the order its
 * features happen to sit in.
 *
 * `dropEmptyGeometries` in the runner cannot fix this — by the time it sees the
 * collection, GDAL has already declined to write the rows. The empty ones have
 * to be gone before the file is written.
 */
function withoutEmptyGeometry(inner: string, fields: string[]): string {
    const carried = fields.map(f => q(f)).join(', ');
    return `SELECT ${selectList(carried, 'geometry')} FROM (${inner})`
        + ` WHERE geometry IS NOT NULL AND NOT ST_IsEmpty(geometry)`;
}

function differenceFromAll(target: string, table: string | null): string {
    return `ST_Difference(${target}, (SELECT ${unionValid('geometry')} FROM ${table}))`;
}

function indexedPairs(table: string | null, alias: string, aGeom: string): string {
    // The runner rejects a missing second input long before this, so a null here
    // is a registry mistake (a two-input operation declared with one input).
    if (!table) throw new Error('indexedPairs called without a second input table');
    return `${alias}.ROWID IN (SELECT ROWID FROM SpatialIndex`
        + ` WHERE f_table_name='${table}' AND search_frame=${aGeom})`;
}

// ─── Topology-aware simplification ───────────────────────────────────────────

/**
 * How often an arc may get detail back before repair gives up.
 *
 * Each pass quarters the area threshold (halving the linear tolerance), so eight
 * passes take a border from the requested tolerance down to 1/256th of it; the
 * final pass restores the arc completely rather than leaving a known crossing.
 */
const MAX_REPAIR_PASSES = 8;

/** Rings above this many points are not checked — see `selfIntersects`. */
const MAX_INTERSECTION_CHECK_POINTS = 4000;

/** The subset of the TopoJSON geometry shapes this code walks. */
type TopoGeometry =
    | { type: 'GeometryCollection'; geometries: TopoGeometry[] }
    | { type: 'Polygon'; arcs: number[][] }
    | { type: 'MultiPolygon'; arcs: number[][][] }
    | { type: string; arcs?: unknown };

/** Every ring in the object, as its list of (possibly negated) arc indices. */
function ringArcIndices(geometry: TopoGeometry): number[][] {
    if (geometry.type === 'GeometryCollection') {
        return (geometry as { geometries: TopoGeometry[] }).geometries.flatMap(ringArcIndices);
    }
    if (geometry.type === 'Polygon') return (geometry as { arcs: number[][] }).arcs;
    if (geometry.type === 'MultiPolygon') return (geometry as { arcs: number[][][] }).arcs.flat();
    return [];
}

/**
 * Rebuilds one ring's coordinates from the current arcs.
 *
 * A negative index means the arc is traversed backwards — that is how TopoJSON
 * lets two neighbours share one border — and the first point of each subsequent
 * arc repeats the previous arc's last point.
 */
function stitchRing(arcIndices: number[], arcs: GeoJSON.Position[][]): GeoJSON.Position[] {
    const ring: GeoJSON.Position[] = [];
    for (const index of arcIndices) {
        const arc = index < 0 ? [...arcs[~index]].reverse() : arcs[index];
        ring.push(...(ring.length ? arc.slice(1) : arc));
    }
    return ring;
}

/** True when segments ab and cd properly cross (touching at an endpoint doesn't count). */
function segmentsCross(a: GeoJSON.Position, b: GeoJSON.Position, c: GeoJSON.Position, d: GeoJSON.Position): boolean {
    const side = (p: GeoJSON.Position, q: GeoJSON.Position, r: GeoJSON.Position) =>
        Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    const o1 = side(a, b, c);
    const o2 = side(a, b, d);
    const o3 = side(c, d, a);
    const o4 = side(c, d, b);
    // Collinear overlaps are left alone: they render fine and chasing them makes
    // repair oscillate on borders that legitimately double back.
    return o1 !== o2 && o3 !== o4 && o1 !== 0 && o2 !== 0 && o3 !== 0 && o4 !== 0;
}

/**
 * Does this ring cross itself?
 *
 * These crossings are what a large tolerance produces and what the user sees as
 * stray triangles: the outline folds over itself, and the renderer fills the fold.
 *
 * Brute force over segment pairs, which is fine because it only ever runs on
 * *simplified* rings — the whole point is that they are short. A ring that is
 * still enormous is skipped rather than allowed to cost seconds: it has barely
 * been simplified, so it is the least likely to have been broken by simplifying.
 */
function selfIntersects(ring: GeoJSON.Position[]): boolean {
    const n = ring.length - 1;
    if (n < 4 || ring.length > MAX_INTERSECTION_CHECK_POINTS) return false;

    for (let i = 0; i < n; i++) {
        for (let j = i + 2; j < n; j++) {
            // The first and last segments of a closed ring share a point.
            if (i === 0 && j === n - 1) continue;
            if (segmentsCross(ring[i], ring[i + 1], ring[j], ring[j + 1])) return true;
        }
    }
    return false;
}

/**
 * Simplify every feature while keeping shared borders identical.
 *
 * `ST_Simplify`/`ST_SimplifyPreserveTopology` are the obvious tools and are wrong
 * for a layer of neighbours: they see one geometry at a time, so the border
 * between two municipalities is simplified twice, independently, and the two
 * results no longer match — slivers and overlaps along every shared edge.
 * "PreserveTopology" only promises each polygon stays valid on its own.
 *
 * Building a topology first is what mapshaper does and what fixes it: coincident
 * boundaries become one shared arc, simplified once, so both neighbours keep the
 * exact same points. mapshaper itself is 15 MB unpacked and pulls in GeoPackage
 * and zstd-wasm, which has no place in a map bundle; the topojson modules are the
 * same algorithm (Visvalingam on shared arcs) in ~60 KB.
 *
 * Coordinates are EPSG:3857 metres here, so `planarTriangleArea` is the right
 * weight and the tolerance can be read as a real-world distance.
 */
function simplifyShared(input: GeoJSON.FeatureCollection, params: GeoParamValues): GeoJSON.FeatureCollection {
    const tolerance = Math.max(Number(params.tolerance) || 0, 0);
    if (!tolerance) return input;

    // Visvalingam removes a point when the triangle it forms with its neighbours
    // is smaller than a threshold *area*, so a tolerance expressed as a distance
    // becomes that distance squared: a wiggle t wide and t deep has area ~t².
    const minArea = tolerance * tolerance;

    // No quantization: quantizing would snap coordinates to a grid, which is a
    // second, invisible kind of simplification on top of the requested one.
    const topo = topology({ layer: input });
    const weighted = presimplify(topo);

    // One threshold per arc rather than one for the whole topology, so repair can
    // give detail back to a single guilty border without touching the rest.
    const thresholds = weighted.arcs.map(() => minArea);
    const applyThresholds = (): GeoJSON.Position[][] => weighted.arcs.map((arc, i) => {
        const kept = (arc as unknown as number[][]).filter(point => point[2] >= thresholds[i]);
        return kept.map(([x, y]) => [x, y] as GeoJSON.Position);
    });

    const rings = ringArcIndices(weighted.objects.layer as unknown as TopoGeometry);
    let arcs = applyThresholds();
    let suspect = rings;

    for (let pass = 0; pass < MAX_REPAIR_PASSES && suspect.length; pass++) {
        const broken = suspect.filter(ring => selfIntersects(stitchRing(ring, arcs)));
        if (!broken.length) break;

        // Restore detail on exactly the arcs that produced a crossing. Quartering
        // the area threshold halves the linear tolerance, so a border recovers in
        // steps instead of jumping straight back to full detail.
        const lastPass = pass === MAX_REPAIR_PASSES - 1;
        for (const ring of broken) {
            for (const index of ring) {
                const arc = index < 0 ? ~index : index;
                thresholds[arc] = lastPass ? 0 : thresholds[arc] / 4;
            }
        }
        arcs = applyThresholds();
        suspect = broken;
    }

    // A GeometryCollection object comes back as a FeatureCollection; anything
    // else as a single Feature. The input is always a collection, but the typing
    // cannot know that.
    const result: GeoJSON.Feature | GeoJSON.FeatureCollection =
        topoFeature({ ...weighted, arcs } as never, weighted.objects.layer) as GeoJSON.Feature | GeoJSON.FeatureCollection;

    return result.type === 'FeatureCollection'
        ? result
        : { type: 'FeatureCollection', features: [result] };
}

/**
 * The spatial tests a join can match on, as SQL.
 *
 * `contains` and `within` are opposites and the argument order is the whole
 * difference between them: `ST_Within(A, B)` and `ST_Contains(B, A)` are the
 * same statement, so writing `contains` as `ST_Contains(b, a)` made the two menu
 * options run an identical query. Both then answered "the first layer's feature
 * lies inside the second", and the option labelled *contains* could never say
 * anything the one labelled *lies inside* had not already said.
 *
 * The label is what settles the direction: "Match when the first layer's feature
 * contains" means A contains B.
 */
const PREDICATES: Record<string, (a: string, b: string) => string> = {
    intersects: (a, b) => `ST_Intersects(${a}, ${b})`,
    contains: (a, b) => `ST_Contains(${a}, ${b})`,
    within: (a, b) => `ST_Within(${a}, ${b})`,
};

function predicate(name: unknown, a: string, b: string): string {
    const fn = PREDICATES[String(name)] ?? PREDICATES.intersects;
    return fn(a, b);
}

// ─── Operations ──────────────────────────────────────────────────────────────

export const GEO_OPERATIONS: GeoOperation[] = [
    {
        id: 'clip',
        label: 'Clip',
        category: 'overlay',
        description: 'Cuts the input layer down to the area covered by the clip layer, like a cookie cutter. Keeps the input’s features and attributes — only their shape changes.',
        inputs: [
            { key: 'a', label: 'Layer to clip', hint: 'Its features and attributes are kept' },
            { key: 'b', label: 'Clip with', hint: 'Used as one shape; its attributes are ignored' },
        ],
        params: [],
        outputGeometry: 'same',
        outputName: (a, b) => `${a} clipped by ${b}`,
        // Same ST_Union-first trick as erase, and for the same reason: clipping
        // against each b feature separately would emit one output feature per
        // overlapping pair, turning one input feature into several. That
        // per-pair behaviour is what `intersect` is for; clip must preserve the
        // input's feature count.
        buildSql: ({ layerA, refB, fieldsA }) => withoutEmptyGeometry(`
            SELECT ${selectList(cols('a', fieldsA), `ST_Intersection(a.geometry, (SELECT ${unionValid('geometry')} FROM ${refB})) AS geometry`)}
            FROM ${q(layerA)} a`, fieldsA),
    },
    {
        id: 'erase',
        label: 'Erase',
        category: 'overlay',
        description: 'Removes from the input layer everything covered by the erase layer. The opposite of clip.',
        inputs: [
            { key: 'a', label: 'Layer to erase from', hint: 'Its attributes are kept' },
            { key: 'b', label: 'Erase with', hint: 'These areas are cut away' },
        ],
        params: [],
        outputGeometry: 'same',
        outputName: (a, b) => `${a} minus ${b}`,
        // ST_Union over b collapses all erase features first: erasing against each
        // b feature separately would multiply a's features instead of subtracting.
        buildSql: ({ layerA, refB, fieldsA }) => withoutEmptyGeometry(`
            SELECT ${selectList(cols('a', fieldsA), `${differenceFromAll('a.geometry', refB)} AS geometry`)}
            FROM ${q(layerA)} a`, fieldsA),
    },
    {
        id: 'intersect',
        label: 'Intersect',
        category: 'overlay',
        description: 'Keeps the overlapping parts of both layers and combines their attributes: every pair that overlaps becomes its own feature, so one input feature can be split into several.',
        inputs: [
            { key: 'a', label: 'First layer', hint: 'Both layers’ attributes end up in the result' },
            { key: 'b', label: 'Second layer' },
        ],
        params: [],
        outputGeometry: 'polygon',
        outputName: (a, b) => `${a} ∩ ${b}`,
        // One feature per overlapping pair — deliberately not ST_Union'd like
        // clip, because carrying b's attributes only makes sense per pair.
        buildSql: ({ layerA, refB, fieldsA, fieldsB }) => `
            SELECT ${selectList(cols('a', fieldsA), disambiguate(fieldsA, fieldsB), `ST_Intersection(a.geometry, b.geometry) AS geometry`)}
            FROM ${q(layerA)} a
            JOIN ${refB} b ON ${indexedPairs(refB, 'b', 'a.geometry')}
            WHERE ST_Intersects(a.geometry, b.geometry)`,
    },
    {
        id: 'union',
        label: 'Union (overlay)',
        category: 'overlay',
        description: 'Combines both layers and splits them where they overlap. Every piece keeps the attributes of the layers it came from, and a "part" column saying whether it belongs to the first layer, the second, or both.',
        inputs: [
            { key: 'a', label: 'First layer' },
            { key: 'b', label: 'Second layer' },
        ],
        params: [],
        outputGeometry: 'polygon',
        outputName: (a, b) => `${a} ∪ ${b}`,
        // Three disjoint pieces from two inputs: the overlap, A-only, B-only.
        // Each is a separate SELECT, and every branch emits the same columns —
        // A's fields, B's fields, `part` — filling in NULL where a piece has no
        // value, so an A-only piece still carries A's attributes.
        buildSql: ({ layerA, refB, fieldsA, fieldsB }) => `
            SELECT ${unionBranch(fieldsA, fieldsB, 'both', 'both', 'ST_Intersection(a.geometry, b.geometry)')}
            FROM ${q(layerA)} a
            JOIN ${refB} b ON ${indexedPairs(refB, 'b', 'a.geometry')}
            WHERE ST_Intersects(a.geometry, b.geometry)
            UNION ALL
            SELECT ${unionBranch(fieldsA, fieldsB, 'a', 'first', differenceFromAll('a.geometry', refB))}
            FROM ${q(layerA)} a
            UNION ALL
            SELECT ${unionBranch(fieldsA, fieldsB, 'b', 'second', differenceFromAll('b.geometry', layerA))}
            FROM ${refB} b`,
    },
    {
        id: 'selectByLocation',
        label: 'Select by location',
        category: 'selection',
        description: 'Keeps whole features from the input layer based on how they sit relative to the second layer. Geometry is not changed.',
        inputs: [
            { key: 'a', label: 'Layer to select from' },
            { key: 'b', label: 'Compare with' },
        ],
        params: [
            {
                kind: 'select',
                key: 'mode',
                label: 'Keep features that',
                default: 'intersects',
                options: [
                    { value: 'intersects', label: 'touch or overlap the second layer' },
                    { value: 'within', label: 'lie completely inside the second layer' },
                    { value: 'disjoint', label: 'do not touch the second layer' },
                ],
            },
        ],
        outputGeometry: 'same',
        outputName: (a, b) => `${a} selected by ${b}`,
        buildSql: ({ layerA, refB, fieldsA, params }) => {
            const test = params.mode === 'within'
                ? `ST_Within(a.geometry, b.geometry)`
                : `ST_Intersects(a.geometry, b.geometry)`;
            // A bbox hit is a necessary condition for both `intersects` and
            // `within`, so narrowing by the index is safe for all three modes —
            // including `disjoint`, which is the negation of the same EXISTS.
            const exists = `${params.mode === 'disjoint' ? 'NOT EXISTS' : 'EXISTS'} `
                + `(SELECT 1 FROM ${refB} b WHERE ${indexedPairs(refB, 'b', 'a.geometry')} AND ${test})`;
            return `
            SELECT ${selectList(cols('a', fieldsA), 'a.geometry AS geometry')}
            FROM ${q(layerA)} a
            WHERE ${exists}`;
        },
    },
    {
        id: 'spatialJoin',
        label: 'Spatial join',
        category: 'selection',
        description: 'Copies attributes from the second layer onto features of the first, based on their spatial relationship. Geometry is not changed.',
        inputs: [
            { key: 'a', label: 'Layer to add attributes to' },
            { key: 'b', label: 'Take attributes from' },
        ],
        params: [
            {
                kind: 'select',
                key: 'relation',
                label: 'Match when the first layer’s feature',
                default: 'intersects',
                options: [
                    { value: 'intersects', label: 'touches or overlaps' },
                    { value: 'within', label: 'lies inside' },
                    { value: 'contains', label: 'contains' },
                ],
            },
        ],
        outputGeometry: 'same',
        outputName: (a, b) => `${a} joined with ${b}`,
        buildSql: ({ layerA, refB, fieldsA, fieldsB, params }) => `
            SELECT ${selectList(cols('a', fieldsA), disambiguate(fieldsA, fieldsB), 'a.geometry AS geometry')}
            FROM ${q(layerA)} a
            LEFT JOIN ${refB} b
              ON ${indexedPairs(refB, 'b', 'a.geometry')} AND ${predicate(params.relation, 'a.geometry', 'b.geometry')}`,
    },
    {
        id: 'dissolve',
        label: 'Dissolve',
        category: 'aggregate',
        description: 'Merges features into one shape, removing the boundaries between them. Group by an attribute to get one shape per value — municipalities into provinces, for example.',
        inputs: [{ key: 'a', label: 'Layer to dissolve' }],
        params: [
            {
                kind: 'field',
                key: 'groupBy',
                label: 'Group by attribute',
                from: 'a',
                optional: true,
                hint: 'Leave empty to merge everything into one feature',
            },
            {
                kind: 'aggregations',
                key: 'stats',
                label: 'Summarise attributes',
                from: 'a',
                hint: 'Merging provinces into countries usually means adding up their populations',
            },
            ...HOLE_PARAMS,
        ],
        outputGeometry: 'polygon',
        outputName: a => `${a} dissolved`,
        postProcess: removeSmallHoles,
        postProcessNeeded: params => params.holes === 'auto' || params.holes === 'size',
        buildSql: ({ layerA, params }) => {
            const field = String(params.groupBy ?? '');
            const stats = aggregationColumns('a', params.stats, layerA, field);
            // feature_count comes free and answers the first question anyone asks
            // of a merged shape: how many things went into it?
            const columns = selectList(
                field ? `a.${q(field)} AS ${q(field)}` : '',
                'COUNT(*) AS feature_count',
                stats,
                `${unionValid('a.geometry')} AS geometry`,
            );
            return `
            SELECT ${columns}
            FROM ${q(layerA)} a
            ${field ? `GROUP BY a.${q(field)}` : ''}`;
        },
    },
    {
        id: 'statistics',
        label: 'Statistics',
        category: 'aggregate',
        description: 'Counts and summarises attributes per group and shows the result as a table. Nothing is drawn on the map — use this to answer questions like “how many inhabitants per continent?”.',
        inputs: [{ key: 'a', label: 'Input layer' }],
        params: [
            {
                kind: 'field',
                key: 'groupBy',
                label: 'Group by attribute',
                from: 'a',
                optional: true,
                hint: 'Leave empty for one row covering the whole layer',
            },
            {
                kind: 'aggregations',
                key: 'stats',
                label: 'Summarise attributes',
                from: 'a',
            },
        ],
        outputGeometry: 'table',
        outputName: a => `${a} statistics`,
        // Same grouping as dissolve minus the geometry, which is the whole point:
        // no ST_Union means no expensive geometry work for a question that is
        // really about the attribute table.
        buildSql: ({ layerA, params }) => {
            const field = String(params.groupBy ?? '');
            const stats = aggregationColumns('a', params.stats, layerA, field);
            const columns = selectList(
                field ? `a.${q(field)} AS ${q(field)}` : '',
                'COUNT(*) AS feature_count',
                stats,
            );
            return `
            SELECT ${columns}
            FROM ${q(layerA)} a
            ${field ? `GROUP BY a.${q(field)}` : ''}`;
        },
    },
    {
        id: 'centroid',
        label: 'Centroid',
        category: 'transform',
        description: 'Replaces each feature by a single point at its centre, keeping all attributes.',
        inputs: [{ key: 'a', label: 'Input layer' }],
        params: [],
        outputGeometry: 'point',
        outputName: a => `${a} centroids`,
        buildSql: ({ layerA, fieldsA }) => `
            SELECT ${selectList(cols('a', fieldsA), 'ST_Centroid(a.geometry) AS geometry')}
            FROM ${q(layerA)} a`,
    },
    {
        id: 'labelPoint',
        label: 'Label point',
        category: 'transform',
        description: 'Puts a point at the roomiest spot inside each polygon — the best place for a label. Unlike a centroid, it is always inside the shape, even for a crescent or a country with a long inlet.',
        inputs: [{ key: 'a', label: 'Input layer', hint: 'Polygons only; other geometry is skipped' }],
        params: [
            {
                kind: 'number',
                key: 'precision',
                label: 'Precision',
                default: 100,
                min: 1,
                step: 10,
                unit: 'm',
                hint: 'Smaller is more exact but slower',
            },
        ],
        outputGeometry: 'point',
        outputName: a => `${a} label points`,
        // SpatiaLite's ST_PointOnSurface also guarantees a point inside, but it
        // picks any such point — often hard against an edge. polylabel maximises
        // the distance to the nearest edge, which is what a label wants.
        compute: labelPoints,
    },
    {
        id: 'buffer',
        label: 'Buffer',
        category: 'transform',
        description: 'Draws a zone at a fixed distance around every feature — the area within 500 m of a road, for example. A negative distance shrinks polygons instead.',
        inputs: [{ key: 'a', label: 'Input layer' }],
        params: [
            {
                kind: 'number',
                key: 'distance',
                label: 'Distance',
                default: 1000,
                step: 100,
                unit: 'm',
                hint: 'Negative shrinks polygons inwards',
            },
            {
                kind: 'select',
                key: 'merge',
                label: 'Overlapping zones',
                default: 'separate',
                options: [
                    { value: 'separate', label: 'one buffer per feature, keeping its attributes' },
                    { value: 'merged', label: 'merge everything into one zone' },
                ],
                hint: 'Merging answers “which area is within this distance of anything?”; separate buffers answer it per feature.',
            },
        ],
        outputGeometry: 'polygon',
        outputName: a => `${a} buffer`,
        // Distance is in metres and reaches buildSql already scaled into 3857
        // units by the runner (METRIC_PARAMS), like every other metric parameter.
        buildSql: ({ layerA, fieldsA, params }) => {
            const distance = Number(params.distance) || 0;
            if (params.merge === 'merged') {
                return `SELECT COUNT(*) AS feature_count, ${unionValid(`ST_Buffer(geometry, ${distance})`)} AS geometry FROM ${q(layerA)}`;
            }
            return `
            SELECT ${selectList(cols('a', fieldsA), `ST_Buffer(a.geometry, ${distance}) AS geometry`)}
            FROM ${q(layerA)} a`;
        },
    },
    {
        id: 'cartogram',
        label: 'Cartogram',
        category: 'transform',
        description: 'Resizes every polygon so that its area shows a number — population, production, votes — instead of showing ground area. The map keeps its total size, so only the distribution changes.',
        inputs: [{ key: 'a', label: 'Input layer', hint: 'Polygons with a number to size them by' }],
        params: [
            {
                kind: 'field',
                key: 'field',
                label: 'Size by',
                from: 'a',
                numericOnly: true,
                hint: 'Features without a positive number in this attribute are left out',
            },
            {
                kind: 'select',
                key: 'method',
                label: 'Cartogram type',
                default: 'flow',
                options: [
                    { value: 'flow', label: 'keep the map joined up, exact areas' },
                    { value: 'contiguous', label: 'keep the map joined up (classic, faster)' },
                    { value: 'diffusion', label: 'keep the map joined up, exact areas (go-cart WASM)' },
                    { value: 'scaled', label: 'resize each shape on the spot' },
                    { value: 'dorling', label: 'replace each by a circle (Dorling)' },
                ],
                hint: 'The joined-up types stretch one sheet, so countries still touch. The default solves the flow that equalises the areas, and matches the numbers to a percent or two; the classic one pushes boundaries around instead — quicker, and rougher. The last two leave gaps but keep every shape exactly.',
            },
            {
                kind: 'number',
                key: 'passes',
                label: 'Detail',
                default: 12,
                min: 1,
                max: 40,
                step: 1,
                showWhen: params => (params.method ?? 'flow') === 'contiguous',
                hint: 'More passes fit the areas better and take longer',
            },
            {
                kind: 'number',
                key: 'minValuePercent',
                label: 'Leave out anything below',
                default: 0,
                min: 0,
                max: 5,
                step: 0.001,
                unit: '%',
                hint: 'Share of the layer total. A region asked to shrink ten-thousandfold cannot get there, and it drags the rest of the map with it. 0 keeps every feature.',
            },
            {
                kind: 'number',
                key: 'minPartPercent',
                label: 'Leave out islands smaller than',
                default: 0.05,
                min: 0,
                max: 5,
                step: 0.01,
                unit: '%',
                showWhen: params => (params.method ?? 'flow') !== 'scaled' && params.method !== 'dorling',
                hint: 'Share of the country (or region) the island belongs to. The joined-up types stretch a small island into a thread instead of shrinking it, which is what draws lines across the map. 0 keeps every island.',
            },
            {
                kind: 'number',
                key: 'iterations',
                label: 'Separation rounds',
                default: 60,
                min: 0,
                max: 500,
                step: 10,
                showWhen: params => params.method === 'dorling',
                hint: 'How hard overlapping circles are pushed apart',
            },
        ],
        outputGeometry: 'polygon',
        outputName: a => `${a} cartogram`,
        // Three methods, and the default is the contiguous one: a cartogram that
        // still reads as a map is what people picture when they ask for one, and
        // the gaps a per-feature method leaves are what made the first version
        // look wrong. The other two remain because they keep every shape exactly,
        // which the rubber sheet does not.
        //
        // A cartogram is about *ground area*, and Mercator inflates that by
        // 1/cos²(latitude) — sizing Greenland from a Mercator area would start
        // four times too big — so this measures on the sphere from lon/lat and
        // asks the runner for the input untouched. It used to undo the pipeline's
        // Mercator round trip itself, which was correct but paid for two full
        // GDAL reprojections of the layer to arrive back where it started: 16 of
        // the 26 seconds a 562 000-vertex world layer took end to end.
        computeSpace: 'lonlat',
        compute: async (input, params, context) => {
            const result = await cartogram(input, {
            field: String(params.field ?? ''),
            method: params.method === 'dorling' ? 'dorling'
                : params.method === 'scaled' ? 'scaled'
                : params.method === 'diffusion' ? 'diffusion'
                : params.method === 'contiguous' ? 'contiguous'
                : 'flow',
            iterations: Number(params.iterations) || undefined,
            passes: Number(params.passes) || undefined,
                minValuePercent: Number(params.minValuePercent) || 0,
                // `?? undefined` rather than `|| undefined`: 0 is a real answer
                // here — "keep every island" — and `||` would read it as unset
                // and hand back the default, so the box could not be turned off.
                minPartPercent: Number.isFinite(Number(params.minPartPercent))
                    ? Number(params.minPartPercent)
                    : undefined,
                // The plane the flow method warps in is fixed inside
                // `cartogram.ts` and deliberately not the map's own projection:
                // a cartogram is a statement about *ground* area, so the same
                // layer and the same attribute must give the same map whatever
                // the reader happens to be looking at.
                wasmUrl: context.goCartWasmUrl,
            });

            // Both joined-up methods only approximate, and both can return a map
            // that looks right and is not: the rubber sheet may need more passes
            // than it was given, and diffusion may have hit its own iteration cap
            // — measured at a median error of 87% on a world layer whose values
            // spanned five orders of magnitude, with nothing said about it.
            const error = result.medianAreaError;
            const warnings: string[] = [];
            if (error > MISLEADING_AREA_ERROR) {
                warnings.push(`The areas are still about ${(error * 100).toFixed(0)}% away from the values. ${params.method !== 'contiguous'
                    ? 'This method struggles when a layer mixes very large values with very small ones — try the classic method, or leave the smallest features out.'
                    : 'Raise "Detail" for more rounds, or leave the smallest features out.'}`);
            }

            // A cartogram that quietly returns fewer features than it was given
            // reads as a bug in the data ("where did those countries go?"), so
            // every reason a feature was left out is named. Zero is reported
            // separately from a missing value: it is a real number that asks for
            // an area of nothing, which is a fact about the layer worth knowing.
            const { skipped } = result;
            const left = (n: number, reason: string) =>
                `${n} ${n === 1 ? 'feature' : 'features'} ${n === 1 ? 'was' : 'were'} left out: ${reason}`;
            if (skipped.zeroValue > 0) {
                warnings.push(left(skipped.zeroValue, 'a value of 0. A cartogram sizes a shape by its value, so there is nothing left to draw.'));
            }
            if (skipped.negativeValue > 0) {
                warnings.push(left(skipped.negativeValue, 'a negative value, and an area cannot be negative.'));
            }
            if (skipped.missingValue > 0) {
                warnings.push(left(skipped.missingValue, 'no number in this field.'));
            }
            if (skipped.noArea > 0) {
                warnings.push(left(skipped.noArea, 'no area to resize (a point or a line).'));
            }
            if (skipped.belowMinimum > 0) {
                warnings.push(left(skipped.belowMinimum, 'a value below the minimum share.'));
            }
            // Islands are dropped on every world layer, so saying so every time
            // would be a warning nobody reads. It is only worth a line when the
            // threshold has taken enough of the map to change what it shows.
            if (result.droppedParts.count > 0 && result.droppedParts.areaShare > NOTABLE_DROPPED_AREA) {
                warnings.push(`${result.droppedParts.count} small islands were left out, ${(result.droppedParts.areaShare * 100).toFixed(0)}% of the layer's area. Lower "Leave out islands smaller than" to keep more of them.`);
            }

            return { ...result.features, warnings: warnings.length ? warnings : undefined };
        },
    },
    {
        id: 'voronoi',
        label: 'Voronoi',
        category: 'transform',
        description: 'Divides the map into one area per point, each covering everything that is closer to that point than to any other — catchment areas of shops, schools or weather stations.',
        inputs: [{ key: 'a', label: 'Input layer', hint: 'Points; other features use their centre' }],
        params: [
            {
                kind: 'number',
                key: 'padding',
                label: 'Extend beyond the points by',
                default: 0,
                min: 0,
                step: 1000,
                unit: 'm',
                hint: 'The diagram is infinite, so it is cut off here. 0 uses a tenth of the area covered by the points.',
            },
        ],
        outputGeometry: 'polygon',
        outputName: a => `${a} Voronoi`,
        compute: voronoiCells,
    },
    {
        id: 'delaunay',
        label: 'Delaunay',
        category: 'transform',
        description: 'Connects the points into triangles, avoiding thin slivers wherever possible. The mirror image of the Voronoi diagram, and the usual first step in building a surface from measurements.',
        inputs: [{ key: 'a', label: 'Input layer', hint: 'Points; other features use their centre' }],
        params: [],
        outputGeometry: 'polygon',
        outputName: a => `${a} triangles`,
        compute: delaunayTriangles,
    },
    {
        id: 'convexHull',
        label: 'Convex hull',
        category: 'aggregate',
        description: 'Draws the smallest polygon that contains all features — like stretching an elastic band around them.',
        inputs: [{ key: 'a', label: 'Input layer' }],
        params: [
            {
                kind: 'select',
                key: 'scope',
                label: 'Compute',
                default: 'all',
                options: [
                    { value: 'all', label: 'one hull around all features' },
                    { value: 'each', label: 'a hull per feature' },
                ],
            },
        ],
        outputGeometry: 'polygon',
        outputName: a => `${a} convex hull`,
        buildSql: ({ layerA, fieldsA, params }) => {
            if (params.scope === 'each') {
                return `
            SELECT ${selectList(cols('a', fieldsA), 'ST_ConvexHull(a.geometry) AS geometry')}
            FROM ${q(layerA)} a`;
            }
            return `SELECT COUNT(*) AS feature_count, ST_ConvexHull(ST_Collect(geometry)) AS geometry FROM ${q(layerA)}`;
        },
    },
    {
        id: 'simplify',
        label: 'Simplify',
        category: 'transform',
        description: 'Removes detail from lines and outlines, keeping the overall shape. Borders shared by neighbouring polygons stay identical on both sides, so no gaps or overlaps appear.',
        inputs: [{ key: 'a', label: 'Input layer' }],
        params: [
            {
                kind: 'number',
                key: 'tolerance',
                label: 'Tolerance',
                default: 100,
                min: 1,
                step: 10,
                unit: 'm',
                // Visvalingam judges a bend by its *area*, so this behaves like
                // mapshaper's `interval=`: a narrow bend of this size goes, a wide
                // shallow curve of the same depth stays.
                hint: 'Bends smaller than this disappear',
            },
        ],
        outputGeometry: 'same',
        // No "fast vs. topology-preserving" choice any more: the fast option was
        // simply the broken one, and offering it invited students to produce
        // layers riddled with slivers.
        outputName: a => `${a} simplified`,
        compute: simplifyShared,
    },
];

// ─── Lookups ─────────────────────────────────────────────────────────────────

export function getOperation(id: string): GeoOperation | undefined {
    return GEO_OPERATIONS.find(op => op.id === id);
}

/** Parameters whose value is a length in metres, and so must be scaled for EPSG:3857. */
export const METRIC_PARAMS = new Set(['tolerance', 'precision', 'holeSize', 'distance', 'padding']);

export function defaultParams(op: GeoOperation): GeoParamValues {
    const values: GeoParamValues = {};
    for (const p of op.params) {
        if (p.kind === 'field') values[p.key] = '';
        else if (p.kind === 'aggregations') values[p.key] = [];
        else values[p.key] = p.default;
    }
    return values;
}

export const CATEGORY_LABELS: Record<GeoOperationCategory, string> = {
    overlay: 'Combine two layers',
    selection: 'Select and join',
    aggregate: 'Summarise',
    transform: 'Reshape',
};
