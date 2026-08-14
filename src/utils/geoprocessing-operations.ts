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
import { topology } from 'topojson-server';
import { presimplify } from 'topojson-simplify';
import { feature as topoFeature } from 'topojson-client';

// ─── Types ───────────────────────────────────────────────────────────────────

export type GeoOperationId =
    | 'labelPoint'
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
) => GeoJSON.FeatureCollection;

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

const PREDICATES: Record<string, (a: string, b: string) => string> = {
    intersects: (a, b) => `ST_Intersects(${a}, ${b})`,
    contains: (a, b) => `ST_Contains(${b}, ${a})`,
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
        buildSql: ({ layerA, refB, fieldsA }) => `
            SELECT ${selectList(cols('a', fieldsA), `ST_Intersection(a.geometry, (SELECT ${unionValid('geometry')} FROM ${refB})) AS geometry`)}
            FROM ${q(layerA)} a`,
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
        buildSql: ({ layerA, refB, fieldsA }) => `
            SELECT ${selectList(cols('a', fieldsA), `${differenceFromAll('a.geometry', refB)} AS geometry`)}
            FROM ${q(layerA)} a`,
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
export const METRIC_PARAMS = new Set(['tolerance', 'precision', 'holeSize']);

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
