/**
 * End-to-end tests for the geoprocessing pipeline.
 *
 * These run the *real* GDAL/SpatiaLite WASM build — the same one the browser
 * worker loads — against small hand-built geometries. That is the point: the SQL
 * templates in `utils/geoprocessing-operations.ts` are only correct if
 * SpatiaLite accepts them, and no amount of string assertion proves that.
 *
 * gdal3.js's Node build takes file *paths* where the browser build takes `File`
 * objects, so `nodeGdal()` below adapts one to the other. Everything else is the
 * production code path.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { pathToFileURL } from 'node:url';
import { runGeoprocess, type GdalLike } from '../src/workers/geoprocessing-runner';
import { GEO_OPERATIONS, defaultParams, getOperation } from '../src/utils/geoprocessing-operations';

// ─── Fixtures ────────────────────────────────────────────────────────────────

type FC = GeoJSON.FeatureCollection;

function square(x: number, y: number, size: number, props: Record<string, unknown>): GeoJSON.Feature {
    return {
        type: 'Feature',
        properties: props,
        geometry: {
            type: 'Polygon',
            coordinates: [[[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]]],
        },
    };
}

function fc(...features: GeoJSON.Feature[]): FC {
    return { type: 'FeatureCollection', features };
}

/** Two 2°-squares: `left` at 0..2, `right` at 1..3 — they overlap on 1..2. */
const LEFT: FC = fc(square(0, 0, 2, { name: 'left', pop: 100 }));
const RIGHT: FC = fc(square(1, 1, 2, { name: 'right', zone: 'B' }));
/** Three points: inside LEFT, inside the overlap, far away. */
const POINTS: FC = fc(
    { type: 'Feature', properties: { id: 'p1' }, geometry: { type: 'Point', coordinates: [0.5, 0.5] } },
    { type: 'Feature', properties: { id: 'p2' }, geometry: { type: 'Point', coordinates: [1.5, 1.5] } },
    { type: 'Feature', properties: { id: 'p3' }, geometry: { type: 'Point', coordinates: [10, 10] } },
);
/** Two adjacent squares sharing an edge, in two groups. */
const ADJACENT: FC = fc(
    square(0, 0, 1, { region: 'north', name: 'a' }),
    square(1, 0, 1, { region: 'north', name: 'b' }),
    square(5, 5, 1, { region: 'south', name: 'c' }),
);

// ─── GDAL adapter ────────────────────────────────────────────────────────────

let gdalPromise: Promise<GdalLike> | null = null;

function nodeGdal(): Promise<GdalLike> {
    if (gdalPromise) return gdalPromise;

    const scratch = mkdtempSync(path.join(tmpdir(), 'webmapx-gp-'));

    // Imported through a runtime URL, not a static specifier: the Node build of
    // gdal3.js is CommonJS and `require()`s node builtins, which esbuild cannot
    // bundle into the ESM test file.
    const nodeBuild = pathToFileURL(path.resolve(process.cwd(), 'node_modules/gdal3.js/node.js')).href;

    gdalPromise = import(nodeBuild)
        .then((mod: any) => (mod.default ?? mod)({
            path: 'node_modules/gdal3.js/dist/package',
            useWorker: false,
        }))
        .then((gdal: any): GdalLike => ({
        async open(file: unknown) {
            // The runner hands us browser `File`s; the Node build wants a path.
            if (typeof File !== 'undefined' && file instanceof File) {
                const target = path.join(scratch, file.name);
                writeFileSync(target, Buffer.from(await file.arrayBuffer()));
                return gdal.open(target);
            }
            return gdal.open(file);
        },
        close: (ds: unknown) => gdal.close(ds),
        ogr2ogr: (ds: unknown, args: string[], name?: string) => gdal.ogr2ogr(ds, args, name),
        getFileBytes: (p: unknown) => gdal.getFileBytes(p),
    }));

    return gdalPromise;
}

async function run(operationId: string, inputA: FC, inputB?: FC, params: Record<string, string | number> = {}): Promise<FC> {
    const op = getOperation(operationId);
    assert.ok(op, `no such operation: ${operationId}`);
    const gdal = await nodeGdal();
    return runGeoprocess(gdal, {
        operationId,
        inputA,
        inputB,
        params: { ...defaultParams(op!), ...params },
        centerLat: 1,
    });
}

/** Geometry area in square degrees — enough to compare relative sizes. */
function ringArea(feature: GeoJSON.Feature): number {
    const g = feature.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates]
        : g.type === 'MultiPolygon' ? g.coordinates
        : [];
    let total = 0;
    for (const poly of polys) {
        for (const ring of poly) {
            let sum = 0;
            for (let i = 0; i < ring.length - 1; i++) {
                sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
            }
            total += Math.abs(sum) / 2;
        }
    }
    return total;
}

/** Ray-casting point-in-polygon, enough for the convex cells tested here. */
function contains(feature: GeoJSON.Feature, x: number, y: number): boolean {
    const g = feature.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    let inside = false;
    for (const poly of polys) {
        const ring = poly[0];
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i];
            const [xj, yj] = ring[j];
            if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
    }
    return inside;
}

function totalArea(collection: FC): number {
    return collection.features.reduce((sum, f) => sum + ringArea(f), 0);
}

// The WASM module takes a few seconds to instantiate on first use.
const TIMEOUT = 120_000;

// ─── Registry sanity ─────────────────────────────────────────────────────────

test('every operation declares at least one input and a unique id', () => {
    const ids = new Set<string>();
    for (const op of GEO_OPERATIONS) {
        assert.ok(op.inputs.length >= 1 && op.inputs.length <= 2, `${op.id}: bad arity`);
        assert.equal(op.inputs[0].key, 'a', `${op.id}: first input must be slot a`);
        assert.ok(!ids.has(op.id), `duplicate operation id: ${op.id}`);
        ids.add(op.id);
    }
});

test('every operation is computed either by SQL or in JS, never both or neither', () => {
    for (const op of GEO_OPERATIONS) {
        const ways = [op.buildSql, op.compute].filter(Boolean).length;
        assert.equal(ways, 1, `${op.id}: expected exactly one of buildSql/compute, found ${ways}`);
    }
});

test('two-input operations reject a missing second layer', { timeout: TIMEOUT }, async () => {
    await assert.rejects(() => run('clip', LEFT), /two input layers/);
});

// ─── Two-input operations ────────────────────────────────────────────────────

test('clip keeps only the overlap and the input attributes', { timeout: TIMEOUT }, async () => {
    const out = await run('clip', LEFT, RIGHT);
    assert.equal(out.features.length, 1);
    assert.equal(out.features[0].properties?.name, 'left');
    assert.equal(out.features[0].properties?.pop, 100);
    // Attributes of the clip layer must not leak in.
    assert.ok(!('zone' in (out.features[0].properties ?? {})));
    // Overlap is 1x1 of a 2x2 input.
    assert.ok(Math.abs(ringArea(out.features[0]) - 1) < 0.05, `expected ~1, got ${ringArea(out.features[0])}`);
});

test('clip keeps the input feature count when the clip layer has many parts', { timeout: TIMEOUT }, async () => {
    // Two separate clip shapes both overlapping the one input feature. Clipping
    // per pair would emit two features; clip must emit one (possibly multipart).
    const twoMasks = fc(square(1, 0.2, 1, { m: 1 }), square(1, 1.4, 1, { m: 2 }));
    const out = await run('clip', LEFT, twoMasks);
    assert.equal(out.features.length, 1, 'clip must not multiply the input features');
    assert.equal(out.features[0].properties?.name, 'left');
    // Both masks contributed: the first lies fully inside the input (1.0), the
    // second sticks out past its top edge and contributes only 0.6.
    assert.ok(Math.abs(ringArea(out.features[0]) - 1.6) < 0.15, `expected ~1.6, got ${ringArea(out.features[0])}`);
});

test('intersect splits per overlapping pair, unlike clip', { timeout: TIMEOUT }, async () => {
    // The distinction between the two operations: same geometry, different
    // feature count, because intersect carries the second layer's attributes.
    const twoZones = fc(square(1, 0.2, 1, { zone: 'north' }), square(1, 1.4, 1, { zone: 'south' }));
    const clipped = await run('clip', LEFT, twoZones);
    const intersected = await run('intersect', LEFT, twoZones);

    assert.equal(clipped.features.length, 1);
    assert.equal(intersected.features.length, 2);
    assert.deepEqual(
        intersected.features.map(f => f.properties?.zone).sort(),
        ['north', 'south'],
        'each intersect feature carries its own second-layer attributes',
    );
});

test('erase removes the overlapping part', { timeout: TIMEOUT }, async () => {
    const out = await run('erase', LEFT, RIGHT);
    assert.equal(out.features.length, 1);
    assert.equal(out.features[0].properties?.name, 'left');
    // 2x2 minus the 1x1 overlap.
    assert.ok(Math.abs(ringArea(out.features[0]) - 3) < 0.1, `expected ~3, got ${ringArea(out.features[0])}`);
});

test('erase does not duplicate features when the erase layer has many parts', { timeout: TIMEOUT }, async () => {
    const manyErasers = fc(square(1, 1, 1, { n: 1 }), square(0, 0, 0.5, { n: 2 }));
    const out = await run('erase', LEFT, manyErasers);
    assert.equal(out.features.length, 1, 'one input feature must yield one output feature');
});

test('intersect combines attributes from both layers', { timeout: TIMEOUT }, async () => {
    const out = await run('intersect', LEFT, RIGHT);
    assert.equal(out.features.length, 1);
    const props = out.features[0].properties ?? {};
    assert.equal(props.name, 'left');
    assert.equal(props.zone, 'B');
    assert.equal(props.pop, 100);
});

test('intersect disambiguates colliding attribute names', { timeout: TIMEOUT }, async () => {
    const other = fc(square(1, 1, 2, { name: 'right' }));
    const out = await run('intersect', LEFT, other);
    const props = out.features[0].properties ?? {};
    assert.equal(props.name, 'left');
    assert.equal(props.name_2, 'right');
});

test('union splits into first-only, second-only and both', { timeout: TIMEOUT }, async () => {
    const out = await run('union', LEFT, RIGHT);
    const parts = out.features.map(f => f.properties?.part).sort();
    assert.deepEqual(parts, ['both', 'first', 'second']);
    // The three pieces tile the union without overlapping: 4 + 4 - 1 = 7.
    assert.ok(Math.abs(totalArea(out) - 7) < 0.2, `expected ~7, got ${totalArea(out)}`);
});

test('union carries the attributes of whichever layers a piece came from', { timeout: TIMEOUT }, async () => {
    const out = await run('union', LEFT, RIGHT);
    const byPart = new Map(out.features.map(f => [f.properties?.part, f.properties ?? {}]));

    // The overlap belongs to both inputs, so it carries both sets of attributes.
    assert.equal(byPart.get('both')?.name, 'left');
    assert.equal(byPart.get('both')?.pop, 100);
    assert.equal(byPart.get('both')?.zone, 'B');

    // An A-only piece keeps A's attributes and has NULL for B's.
    assert.equal(byPart.get('first')?.name, 'left');
    assert.equal(byPart.get('first')?.zone ?? null, null);

    // And the mirror image for B-only.
    assert.equal(byPart.get('second')?.zone, 'B');
    assert.equal(byPart.get('second')?.name ?? null, null);
});

test('union keeps colliding attribute names apart', { timeout: TIMEOUT }, async () => {
    // Both layers have a `name`; B's must land in name_2 in every branch, or a
    // positional UNION would file B's values under A's heading.
    const other = fc(square(1, 1, 2, { name: 'right' }));
    const out = await run('union', LEFT, other);
    const byPart = new Map(out.features.map(f => [f.properties?.part, f.properties ?? {}]));

    assert.equal(byPart.get('both')?.name, 'left');
    assert.equal(byPart.get('both')?.name_2, 'right');
    assert.equal(byPart.get('first')?.name, 'left');
    assert.equal(byPart.get('first')?.name_2 ?? null, null);
    assert.equal(byPart.get('second')?.name ?? null, null);
    assert.equal(byPart.get('second')?.name_2, 'right');
});

test('select by location keeps whole features, unchanged', { timeout: TIMEOUT }, async () => {
    const out = await run('selectByLocation', POINTS, LEFT, { mode: 'intersects' });
    const ids = out.features.map(f => f.properties?.id).sort();
    assert.deepEqual(ids, ['p1', 'p2']);
    assert.equal(out.features[0].geometry.type, 'Point');
});

test('select by location "disjoint" inverts the selection', { timeout: TIMEOUT }, async () => {
    const out = await run('selectByLocation', POINTS, LEFT, { mode: 'disjoint' });
    assert.deepEqual(out.features.map(f => f.properties?.id), ['p3']);
});

test('select by location "within" excludes partial overlaps', { timeout: TIMEOUT }, async () => {
    // RIGHT sticks out of LEFT, so it is not fully within it.
    const out = await run('selectByLocation', RIGHT, LEFT, { mode: 'within' });
    assert.equal(out.features.length, 0);
});

test('spatial join copies attributes and keeps every input feature', { timeout: TIMEOUT }, async () => {
    const out = await run('spatialJoin', POINTS, LEFT, { relation: 'within' });
    assert.equal(out.features.length, 3, 'left join must keep unmatched features');
    const byId = new Map(out.features.map(f => [f.properties?.id, f.properties]));
    assert.equal(byId.get('p1')?.name, 'left');
    assert.equal(byId.get('p3')?.name ?? null, null, 'unmatched feature must have no joined value');
});

/**
 * `contains` and `within` are opposites, and the argument order is the whole
 * difference between them.
 *
 * `ST_Within(A, B)` and `ST_Contains(B, A)` are the same statement, so writing
 * the `contains` predicate as `ST_Contains(b, a)` made the two menu options run
 * an identical query: both answered "the first layer's feature lies inside the
 * second", and the option labelled *contains* could never say anything the one
 * labelled *lies inside* had not already said.
 *
 * Found by generating the documentation from real runs — the worked example put
 * the two side by side and they came out identical, on data where they must
 * differ. The fixture below is deliberately asymmetric: BIG contains SMALL, and
 * SMALL does not contain BIG, so a predicate pointing the wrong way is a
 * different answer rather than the same one.
 */
const BIG: FC = fc(square(0, 0, 10, { name: 'big' }));
const SMALL: FC = fc(square(4, 4, 2, { name: 'small' }));

test('spatial join: contains and within are opposites, not synonyms', { timeout: TIMEOUT }, async () => {
    // The big square contains the small one, so joining big→small on `contains`
    // matches, and on `within` does not.
    const bigContainsSmall = await run('spatialJoin', BIG, SMALL, { relation: 'contains' });
    assert.equal(bigContainsSmall.features[0].properties?.name_2, 'small',
        'BIG contains SMALL, so `contains` must match');

    const bigWithinSmall = await run('spatialJoin', BIG, SMALL, { relation: 'within' });
    assert.equal(bigWithinSmall.features[0].properties?.name_2 ?? null, null,
        'BIG is not inside SMALL, so `within` must not match');

    // And the mirror image, so neither direction is right by accident.
    const smallWithinBig = await run('spatialJoin', SMALL, BIG, { relation: 'within' });
    assert.equal(smallWithinBig.features[0].properties?.name_2, 'big',
        'SMALL is inside BIG, so `within` must match');

    const smallContainsBig = await run('spatialJoin', SMALL, BIG, { relation: 'contains' });
    assert.equal(smallContainsBig.features[0].properties?.name_2 ?? null, null,
        'SMALL does not contain BIG, so `contains` must not match');
});

test('spatial join keeps every feature whatever the relation matches', { timeout: TIMEOUT }, async () => {
    // A left join: a feature that matches nothing still comes back, with the
    // second layer's columns empty. Otherwise "no match" and "lost feature"
    // would look the same in the output.
    for (const relation of ['intersects', 'within', 'contains']) {
        const out = await run('spatialJoin', SMALL, BIG, { relation });
        assert.equal(out.features.length, 1, `${relation} must keep the input feature`);
        assert.equal(out.features[0].properties?.name, 'small');
    }
});

/**
 * A layer's contents must not depend on the order its features sit in.
 *
 * Erase leaves nothing behind for a feature the erase layer covers completely,
 * and clip leaves nothing for one the clip layer never touches. That row's
 * geometry is empty — and GDAL derives the output layer's geometry type from
 * the first feature it writes, so an empty one gave it nothing to go on and
 * **every later feature was dropped with it**. Erasing two points with a box
 * over the first returned nothing at all; the same two points in the other
 * order returned the survivor.
 *
 * `dropEmptyGeometries` in the runner cannot catch this: by the time it sees
 * the collection, the rows were never written. The empties have to be filtered
 * in SQL, before the file exists.
 */
const COVERED_FIRST: FC = fc(
    { type: 'Feature', properties: { id: 'covered' }, geometry: { type: 'Point', coordinates: [0.5, 0.5] } },
    { type: 'Feature', properties: { id: 'survivor' }, geometry: { type: 'Point', coordinates: [8, 8] } },
);
const COVERED_LAST: FC = fc(
    { type: 'Feature', properties: { id: 'survivor' }, geometry: { type: 'Point', coordinates: [8, 8] } },
    { type: 'Feature', properties: { id: 'covered' }, geometry: { type: 'Point', coordinates: [0.5, 0.5] } },
);

test('erase keeps the survivors whichever order they arrive in', { timeout: TIMEOUT }, async () => {
    for (const [label, input] of [['covered first', COVERED_FIRST], ['covered last', COVERED_LAST]] as const) {
        const out = await run('erase', input, LEFT);
        assert.equal(out.features.length, 1, `${label}: the point outside the erase shape must survive`);
        assert.equal(out.features[0].properties?.id, 'survivor', label);
    }
});

test('clip keeps the overlapping features whichever order they arrive in', { timeout: TIMEOUT }, async () => {
    // The mirror image: for clip it is the feature *outside* that comes back
    // empty, so a layer whose first feature misses the clip shape used to lose
    // the ones that hit it.
    const missFirst: FC = fc(
        { type: 'Feature', properties: { id: 'miss' }, geometry: { type: 'Point', coordinates: [8, 8] } },
        { type: 'Feature', properties: { id: 'hit' }, geometry: { type: 'Point', coordinates: [0.5, 0.5] } },
    );
    const out = await run('clip', missFirst, LEFT);
    assert.equal(out.features.length, 1, 'the point inside the clip shape must survive');
    assert.equal(out.features[0].properties?.id, 'hit');
});

// ─── Single-input operations ─────────────────────────────────────────────────

test('dissolve without a group merges everything into one feature', { timeout: TIMEOUT }, async () => {
    const out = await run('dissolve', ADJACENT, undefined, { groupBy: '' });
    assert.equal(out.features.length, 1);
    assert.equal(out.features[0].properties?.feature_count, 3);
});

test('dissolve by attribute merges adjacent shapes per group', { timeout: TIMEOUT }, async () => {
    const out = await run('dissolve', ADJACENT, undefined, { groupBy: 'region' });
    assert.equal(out.features.length, 2);
    const north = out.features.find(f => f.properties?.region === 'north');
    assert.ok(north, 'expected a "north" group');
    assert.equal(north!.properties?.feature_count, 2);
    // The shared edge is gone: two 1x1 squares become one 2x1 rectangle.
    assert.equal(north!.geometry.type, 'Polygon');
    assert.ok(Math.abs(ringArea(north!) - 2) < 0.05, `expected ~2, got ${ringArea(north!)}`);
});

/** Two groups with numbers to add up — provinces into countries, in miniature. */
const REGIONS: FC = fc(
    square(0, 0, 1, { country: 'X', pop: 100, year: 1990 }),
    square(1, 0, 1, { country: 'X', pop: 250, year: 1970 }),
    square(5, 5, 1, { country: 'Y', pop: 40, year: 2001 }),
);

test('dissolve summarises attributes per group', { timeout: TIMEOUT }, async () => {
    const out = await run('dissolve', REGIONS, undefined, {
        groupBy: 'country',
        stats: [
            { field: 'pop', fn: 'sum' },
            { field: 'pop', fn: 'mean' },
            { field: 'year', fn: 'min' },
        ] as never,
    });

    assert.equal(out.features.length, 2);
    const x = out.features.find(f => f.properties?.country === 'X')!.properties!;
    assert.equal(x.feature_count, 2);
    assert.equal(x.pop_total, 350);
    assert.equal(x.pop_average, 175);
    assert.equal(x.year_min, 1970);

    const y = out.features.find(f => f.properties?.country === 'Y')!.properties!;
    assert.equal(y.pop_total, 40);
    // The merged geometry is still there — this is dissolve, not statistics.
    assert.ok(out.features.every(f => f.geometry), 'dissolve must keep geometry');
});

test('dissolve without aggregations still reports the feature count', { timeout: TIMEOUT }, async () => {
    const out = await run('dissolve', REGIONS, undefined, { groupBy: 'country', stats: [] as never });
    const x = out.features.find(f => f.properties?.country === 'X')!.properties!;
    assert.equal(x.feature_count, 2);
    assert.ok(!('pop_total' in x));
});

test('statistics returns rows without geometry', { timeout: TIMEOUT }, async () => {
    const out = await run('statistics', REGIONS, undefined, {
        groupBy: 'country',
        stats: [{ field: 'pop', fn: 'sum' }, { field: 'pop', fn: 'max' }] as never,
    });

    assert.equal(out.features.length, 2);
    // Geometry-free rows must survive the pipeline: the normal path drops
    // features without geometry, which would empty this result entirely.
    assert.ok(out.features.every(f => f.geometry == null), 'statistics must not produce geometry');

    const x = out.features.find(f => f.properties?.country === 'X')!.properties!;
    assert.equal(x.feature_count, 2);
    assert.equal(x.pop_total, 350);
    assert.equal(x.pop_max, 250);
});

/** Text values with a duplicate, to exercise listing/uniqueness/order. */
const NAMED: FC = fc(
    square(0, 0, 1, { country: 'X', admin: 'Bravo' }),
    square(1, 0, 1, { country: 'X', admin: 'Alfa' }),
    square(2, 0, 1, { country: 'X', admin: 'Alfa' }),
    square(5, 5, 1, { country: 'Y', admin: 'Charlie' }),
);

test('statistics lists text values per group', { timeout: TIMEOUT }, async () => {
    const out = await run('statistics', NAMED, undefined, {
        groupBy: 'country',
        stats: [{ field: 'admin', fn: 'list' }] as never,
    });
    const x = out.features.find(f => f.properties?.country === 'X')!.properties!;
    // Sorted ascending by default, duplicates kept.
    assert.equal(x.admin_list, 'Alfa, Alfa, Bravo');
    assert.equal(out.features.find(f => f.properties?.country === 'Y')!.properties!.admin_list, 'Charlie');
});

test('statistics honours separator, uniqueness and order when listing', { timeout: TIMEOUT }, async () => {
    // SQLite refuses `group_concat(DISTINCT x, sep)` and `ORDER BY` inside the
    // aggregate, so all three together only work via the correlated subquery.
    const out = await run('statistics', NAMED, undefined, {
        groupBy: 'country',
        stats: [{ field: 'admin', fn: 'list', separator: ' | ', unique: true, order: 'desc' }] as never,
    });
    const x = out.features.find(f => f.properties?.country === 'X')!.properties!;
    assert.equal(x.admin_list, 'Bravo | Alfa');
});

test('dissolve can list the names it merged', { timeout: TIMEOUT }, async () => {
    const out = await run('dissolve', NAMED, undefined, {
        groupBy: 'country',
        stats: [{ field: 'admin', fn: 'list', unique: true }] as never,
    });
    const x = out.features.find(f => f.properties?.country === 'X')!.properties!;
    assert.equal(x.admin_list, 'Alfa, Bravo');
    assert.ok(out.features.every(f => f.geometry), 'dissolve still produces geometry');
});

test('listing without a group covers the whole layer', { timeout: TIMEOUT }, async () => {
    const out = await run('statistics', NAMED, undefined, {
        groupBy: '',
        stats: [{ field: 'admin', fn: 'list', unique: true }] as never,
    });
    assert.equal(out.features.length, 1);
    assert.equal(out.features[0].properties?.admin_list, 'Alfa, Bravo, Charlie');
});

test('min and max work on text fields', { timeout: TIMEOUT }, async () => {
    const out = await run('statistics', NAMED, undefined, {
        groupBy: 'country',
        stats: [{ field: 'admin', fn: 'min' }, { field: 'admin', fn: 'max' }] as never,
    });
    const x = out.features.find(f => f.properties?.country === 'X')!.properties!;
    assert.equal(x.admin_min, 'Alfa');
    assert.equal(x.admin_max, 'Bravo');
});

test('statistics without a group gives one row for the whole layer', { timeout: TIMEOUT }, async () => {
    const out = await run('statistics', REGIONS, undefined, {
        groupBy: '',
        stats: [{ field: 'pop', fn: 'sum' }] as never,
    });
    assert.equal(out.features.length, 1);
    assert.equal(out.features[0].properties?.feature_count, 3);
    assert.equal(out.features[0].properties?.pop_total, 390);
});

test('centroid produces one point per feature, keeping attributes', { timeout: TIMEOUT }, async () => {
    const out = await run('centroid', ADJACENT);
    assert.equal(out.features.length, 3);
    assert.ok(out.features.every(f => f.geometry.type === 'Point'));
    assert.deepEqual(out.features.map(f => f.properties?.name).sort(), ['a', 'b', 'c']);
});

/** A C-shape (crescent) whose centroid falls in the notch, outside the polygon. */
const CRESCENT: FC = fc({
    type: 'Feature',
    properties: { name: 'bay' },
    geometry: {
        type: 'Polygon',
        coordinates: [[
            [0, 0], [3, 0], [3, 1], [1, 1], [1, 2], [3, 2], [3, 3], [0, 3], [0, 0],
        ]],
    },
});

/** Ray casting — the label point must be *inside*, which is the whole claim. */
function pointInRing(point: GeoJSON.Position, ring: GeoJSON.Position[]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        const intersects = (yi > point[1]) !== (yj > point[1])
            && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
        if (intersects) inside = !inside;
    }
    return inside;
}

test('label point lands inside a shape whose centroid does not', { timeout: TIMEOUT }, async () => {
    const ring = (CRESCENT.features[0].geometry as GeoJSON.Polygon).coordinates[0];

    const centroids = await run('centroid', CRESCENT);
    const centroid = (centroids.features[0].geometry as GeoJSON.Point).coordinates;
    assert.ok(!pointInRing(centroid, ring), 'fixture is pointless unless the centroid falls outside');

    const labels = await run('labelPoint', CRESCENT, undefined, { precision: 1000 });
    assert.equal(labels.features.length, 1);
    const label = (labels.features[0].geometry as GeoJSON.Point).coordinates;
    assert.ok(pointInRing(label, ring), `label point ${label} must lie inside the polygon`);
    assert.equal(labels.features[0].properties?.name, 'bay', 'attributes must survive');
});

test('label point gives one point per feature and skips non-polygons', { timeout: TIMEOUT }, async () => {
    const mixed = fc(
        square(0, 0, 2, { id: 'poly' }),
        { type: 'Feature', properties: { id: 'point' }, geometry: { type: 'Point', coordinates: [8, 8] } },
    );
    const out = await run('labelPoint', mixed, undefined, { precision: 1000 });
    assert.equal(out.features.length, 1, 'the point feature has no interior to label');
    assert.equal(out.features[0].properties?.id, 'poly');
    // Dropping a feature has to be said out loud; silence reads as a bug in the
    // operation rather than as an input the operation cannot use.
    assert.match((out as { warnings?: string[] }).warnings?.join(' ') ?? '', /1 feature .*skipped/);
});

test('label point places a multipolygon label in its largest part', { timeout: TIMEOUT }, async () => {
    const archipelago = fc({
        type: 'Feature',
        properties: { name: 'islands' },
        geometry: {
            type: 'MultiPolygon',
            coordinates: [
                [[[0, 0], [0.4, 0], [0.4, 0.4], [0, 0.4], [0, 0]]],
                [[[5, 5], [8, 5], [8, 8], [5, 8], [5, 5]]],
            ],
        },
    });
    const out = await run('labelPoint', archipelago, undefined, { precision: 500 });
    assert.equal(out.features.length, 1, 'one label per feature, not per part');
    const [x, y] = (out.features[0].geometry as GeoJSON.Point).coordinates;
    assert.ok(x > 4 && y > 4, `expected the label in the big island, got ${x},${y}`);
});

/**
 * Invalid input geometry must be repaired, not silently dropped.
 *
 * `-makevalid` in the same ogr2ogr call as `-clipsrc` runs *after* the clip, so
 * a self-intersecting polygon threw `TopologyException` while being clipped and
 * `-skipfailures` discarded the feature. Real symptom: dissolving a vector-tile
 * layer into 233 countries produced only 163 label points, with France, Germany
 * and Spain missing — the big multi-tile countries, which are exactly the ones
 * whose unioned tile fragments come out invalid.
 */
test('label point keeps features whose geometry is invalid', { timeout: TIMEOUT }, async () => {
    const bowtie = (x: number, id: string): GeoJSON.Feature => ({
        type: 'Feature',
        properties: { id },
        geometry: { type: 'Polygon', coordinates: [[[x, 0], [x + 2, 2], [x, 2], [x + 2, 0], [x, 0]]] },
    });
    const out = await run('labelPoint', fc(bowtie(0, 'a'), bowtie(10, 'b'), square(20, 0, 2, { id: 'c' })), undefined, { precision: 1000 });
    assert.equal(out.features.length, 3, 'self-intersecting polygons must be repaired, not dropped');
    assert.deepEqual(out.features.map(f => f.properties?.id).sort(), ['a', 'b', 'c']);
});

/**
 * Dissolving tile-derived data leaves quantisation gaps between neighbours that
 * did not quite meet. They are valid geometry — `ST_MakeValid` does not touch
 * them — so they have to be removed by size, without eating a real lake.
 *
 * The fixture is four neighbours that enclose a small gap, plus one of them
 * carrying a big lake: the two cases that must come out differently.
 */
function holeRingsOf(feature: GeoJSON.Feature): GeoJSON.Position[][] {
    const g = feature.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    return polys.flatMap(p => p.slice(1));
}

/** A ring around (x0,y0)-(x1,y1), wound so it reads as a hole when nested. */
function box(x0: number, y0: number, x1: number, y1: number): GeoJSON.Position[] {
    return [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
}

const GAP = 0.02; // ~2 km, the size real tile gaps came out at
const TILED: FC = fc(
    { type: 'Feature', properties: { k: 'x' }, geometry: { type: 'Polygon', coordinates: [box(0, 0, 1, 2 + GAP)] } },
    { type: 'Feature', properties: { k: 'x' }, geometry: { type: 'Polygon', coordinates: [box(1, 0, 2, 1)] } },
    { type: 'Feature', properties: { k: 'x' }, geometry: { type: 'Polygon', coordinates: [box(1 + GAP, 1, 2, 2 + GAP)] } },
    // The fourth neighbour has a real lake in it, an order of magnitude bigger.
    {
        type: 'Feature',
        properties: { k: 'x' },
        geometry: { type: 'Polygon', coordinates: [box(1, 1 + GAP, 1 + GAP, 2 + GAP)] },
    },
    {
        type: 'Feature',
        properties: { k: 'x' },
        geometry: { type: 'Polygon', coordinates: [box(2, 0, 4, 2 + GAP), box(2.5, 0.5, 3.5, 1.5)] },
    },
);

/**
 * A union is all-or-nothing: GEOS giving up on one member makes SpatiaLite
 * return NULL for the whole group, which the runner then drops — one bad
 * province costs the entire country. On the 233-country case that silently lost
 * India, Mozambique, Russia and Vietnam.
 */
test('dissolve keeps a group whose parts are invalid', { timeout: TIMEOUT }, async () => {
    const bowtie = (x: number, group: string): GeoJSON.Feature => ({
        type: 'Feature',
        properties: { k: group },
        geometry: { type: 'Polygon', coordinates: [[[x, 0], [x + 2, 2], [x, 2], [x + 2, 0], [x, 0]]] },
    });
    const input = fc(
        bowtie(0, 'left'), square(3, 0, 2, { k: 'left' }),
        bowtie(10, 'right'), bowtie(13, 'right'),
    );
    const out = await run('dissolve', input, undefined, { groupBy: 'k', holes: 'keep' });
    assert.deepEqual(out.features.map(f => f.properties?.k).sort(), ['left', 'right']);
    for (const f of out.features) {
        assert.ok(f.geometry, `group ${f.properties?.k} came back without geometry`);
    }
});

test('a result that loses its geometry is reported, not silently missing', { timeout: TIMEOUT }, async () => {
    // Erasing a shape with itself leaves nothing at all. The empty row is
    // filtered in SQL now — it has to be, or GDAL drops everything behind it —
    // so the report is about the result as a whole rather than about the row.
    const out = await run('erase', LEFT, LEFT);
    assert.equal(out.features.length, 0);
    assert.match((out as { warnings?: string[] }).warnings?.join(' ') ?? '', /no geometry left/);
});

test('dissolve keeps every hole when asked to', { timeout: TIMEOUT }, async () => {
    const out = await run('dissolve', TILED, undefined, { groupBy: 'k', holes: 'keep' });
    assert.equal(out.features.length, 1);
    assert.equal(holeRingsOf(out.features[0]).length, 2, 'the gap and the lake are both holes');
});

test('dissolve removes quantisation gaps but keeps a real lake', { timeout: TIMEOUT }, async () => {
    const out = await run('dissolve', TILED, undefined, { groupBy: 'k', holes: 'auto' });
    const holes = holeRingsOf(out.features[0]);
    assert.equal(holes.length, 1, 'only the lake may survive');
    // Back in lon/lat here: the lake is 1° wide, the gap 0.02°.
    const width = Math.max(...holes[0].map(p => p[0])) - Math.min(...holes[0].map(p => p[0]));
    assert.ok(width > 0.5, `expected the lake, got a ${width}° wide ring`);
});

test('dissolve can remove gaps by width instead', { timeout: TIMEOUT }, async () => {
    const narrow = await run('dissolve', TILED, undefined, { groupBy: 'k', holes: 'size', holeSize: 5000 });
    assert.equal(holeRingsOf(narrow.features[0]).length, 1, '5 km removes the 2 km gap, not the lake');

    const wide = await run('dissolve', TILED, undefined, { groupBy: 'k', holes: 'size', holeSize: 500_000 });
    assert.equal(holeRingsOf(wide.features[0]).length, 0, 'a big enough width removes the lake too');
});

test('convex hull wraps all features in one polygon', { timeout: TIMEOUT }, async () => {
    const out = await run('convexHull', ADJACENT, undefined, { scope: 'all' });
    assert.equal(out.features.length, 1);
    assert.equal(out.features[0].properties?.feature_count, 3);
    // The hull spans the far-apart squares, so it is much larger than their sum.
    assert.ok(ringArea(out.features[0]) > 10, `expected a large hull, got ${ringArea(out.features[0])}`);
});

test('convex hull per feature keeps the feature count', { timeout: TIMEOUT }, async () => {
    const out = await run('convexHull', ADJACENT, undefined, { scope: 'each' });
    assert.equal(out.features.length, 3);
});

test('results carry no legacy crs member', { timeout: TIMEOUT }, async () => {
    // GDAL writes `crs: urn:ogc:def:crs:OGC:1.3:CRS84` into every output. RFC 7946
    // removed that member, and OpenLayers honours it as the data projection when
    // the layer is added — it could not build a transform from that spelling into
    // a proj4-registered view projection, so a result added to an equal-area map
    // failed with "transformFn is not a function", a whole subsystem away.
    const out = await run('centroid', LEFT) as GeoJSON.FeatureCollection & { crs?: unknown };
    assert.equal(out.crs, undefined);
});

test('cartogram resizes features by an attribute, end to end', { timeout: TIMEOUT }, async () => {
    // Through the real pipeline rather than the pure function (tests/cartogram.test.ts
    // covers the maths): what this proves is that the result survives the GeoJSON
    // round trip and comes back as usable polygons with their attributes.
    const input = fc(
        square(0, 0, 1, { name: 'small', pop: 100 }),
        square(3, 0, 1, { name: 'large', pop: 400 }),
    );
    const out = await run('cartogram', input, undefined, { field: 'pop', method: 'scaled' });
    assert.equal(out.features.length, 2);

    const areaOf = (name: string) => ringArea(out.features.find(f => f.properties?.name === name)!);
    // Four times the value, four times the area — measured after the projection
    // round trip, so a few percent of slack for the reprojection.
    const ratio = areaOf('large') / areaOf('small');
    assert.ok(Math.abs(ratio - 4) < 0.1, `expected ~4, got ${ratio}`);
    assert.equal(out.features[0].properties?.pop, 100);
});

test('the flow cartogram reports progress while it runs', { timeout: TIMEOUT }, async () => {
    // The one operation that can run for minutes: sizing the grid from the data
    // so a city gets a cell makes a world layer a two-minute wait, and a spinner
    // with only an elapsed clock beside it is indistinguishable from a hang.
    //
    // Asserted through the runner rather than the library because the whole point
    // is the chain — the library's per-iteration callback has to reach a caller
    // that passed nothing but a `GeoComputeContext`. Every link in it is silent
    // when broken: the panel simply shows no progress and still returns a map.
    const input = fc(
        square(0, 0, 1, { name: 'small', pop: 100 }),
        square(3, 0, 1, { name: 'large', pop: 400 }),
    );
    const op = getOperation('cartogram');
    const messages: string[] = [];
    const gdal = await nodeGdal();
    const out = await runGeoprocess(gdal, {
        operationId: 'cartogram',
        inputA: input,
        params: { ...defaultParams(op!), field: 'pop', method: 'flow' },
        centerLat: 1,
    }, { onProgress: message => { messages.push(message); } });

    assert.equal(out.features.length, 2);
    assert.ok(messages.length > 0, 'the flow cartogram reported no progress at all');
    // The text is what the panel puts on screen, so it has to say something a
    // reader can act on: which pass the solver has reached.
    assert.match(messages[0]!, /pass \d+/);
});

test('cartogram keeps lon/lat coordinates and honours the minimum value', { timeout: TIMEOUT }, async () => {
    // The cartogram skips the pipeline's metric round trip (`computeSpace`), so
    // this is what proves its output is still lon/lat rather than 3857 metres —
    // a mistake that would put every result in the Gulf of Guinea.
    const input = fc(
        square(10, 40, 1, { name: 'big', pop: 900 }),
        square(13, 40, 1, { name: 'medium', pop: 96 }),
        square(16, 40, 1, { name: 'tiny', pop: 4 }),
    );

    const out = await run('cartogram', input, undefined, { field: 'pop', method: 'scaled', minValuePercent: 0.5 });
    assert.deepEqual(out.features.map(f => f.properties?.name), ['big', 'medium']);

    const [lon, lat] = (out.features[0].geometry as GeoJSON.Polygon).coordinates[0][0];
    assert.ok(Math.abs(lon - 10) < 1 && Math.abs(lat - 40) < 1, `expected lon/lat near 10,40 — got ${lon}, ${lat}`);
});

test('a cartogram that did not converge says so', { timeout: TIMEOUT }, async () => {
    // Called directly rather than through GDAL: this is about the operation's own
    // report, and a warning is the only thing standing between a student and a
    // map whose areas mean nothing.
    const op = getOperation('cartogram')!;
    const input = fc(
        square(0, 0, 1, { name: 'a', pop: 1 }),
        square(3, 0, 1, { name: 'b', pop: 1 }),
        square(6, 0, 1, { name: 'c', pop: 400 }),
    );

    const barely = await op.compute!(input, { field: 'pop', method: 'contiguous', passes: 1 }, {});
    assert.ok(barely.warnings?.length, 'one pass cannot size these and must say so');
    assert.match(barely.warnings![0], /away from the values/);

    const exact = await op.compute!(input, { field: 'pop', method: 'scaled' }, {});
    assert.equal(exact.warnings, undefined, 'an exact method warns about nothing');
});

test('cartogram in circle mode returns one circle per feature', { timeout: TIMEOUT }, async () => {
    const input = fc(
        square(0, 0, 1, { name: 'a', pop: 100 }),
        square(2, 0, 1, { name: 'b', pop: 400 }),
    );
    const out = await run('cartogram', input, undefined, { field: 'pop', method: 'dorling', iterations: 100 });
    assert.equal(out.features.length, 2);
    for (const feature of out.features) {
        assert.ok(Number(feature.properties?.cartogram_radius_m) > 0, 'each circle reports its radius in metres');
        const ring = (feature.geometry as GeoJSON.Polygon).coordinates[0];
        assert.ok(ring.length > 30, `expected a circle, got ${ring.length} points`);
    }
});

test('buffer grows every feature and keeps its attributes', { timeout: TIMEOUT }, async () => {
    const out = await run('buffer', ADJACENT, undefined, { distance: 20_000, merge: 'separate' });
    assert.equal(out.features.length, 3);
    assert.deepEqual(out.features.map(f => f.properties?.name).sort(), ['a', 'b', 'c']);
    // Each 1x1 square grows by roughly 0.2° on every side.
    assert.ok(ringArea(out.features[0]) > 1.5, `expected a grown square, got ${ringArea(out.features[0])}`);
});

test('buffer merges overlapping zones into one feature', { timeout: TIMEOUT }, async () => {
    // The two adjacent squares merge; the far-away one joins them in the same
    // multipart feature, because merging is a single ST_Union over everything.
    const out = await run('buffer', ADJACENT, undefined, { distance: 20_000, merge: 'merged' });
    assert.equal(out.features.length, 1);
    assert.equal(out.features[0].properties?.feature_count, 3);
});

test('a negative buffer shrinks polygons', { timeout: TIMEOUT }, async () => {
    const out = await run('buffer', LEFT, undefined, { distance: -20_000, merge: 'separate' });
    assert.equal(out.features.length, 1);
    assert.ok(ringArea(out.features[0]) < 4, `expected a shrunken square, got ${ringArea(out.features[0])}`);
});

test('voronoi gives one cell per point, carrying that point’s attributes', { timeout: TIMEOUT }, async () => {
    const out = await run('voronoi', POINTS);
    assert.equal(out.features.length, 3);
    assert.deepEqual(out.features.map(f => f.properties?.id).sort(), ['p1', 'p2', 'p3']);
    // Cells tile their padded bounding box: no gaps, no overlaps, so the total
    // area is that box exactly.
    assert.ok(totalArea(out) > 100, `expected the cells to cover the area, got ${totalArea(out)}`);
});

test('each voronoi cell contains its own point and no other', { timeout: TIMEOUT }, async () => {
    // The defining property of the diagram, and the one thing worth asserting:
    // every point falls in exactly the cell that carries its attributes.
    const out = await run('voronoi', POINTS);
    for (const point of POINTS.features) {
        const [x, y] = (point.geometry as GeoJSON.Point).coordinates;
        const containing = out.features.filter(cell => contains(cell, x, y));
        assert.equal(containing.length, 1, `${point.properties?.id} lies in one cell`);
        assert.equal(containing[0].properties?.id, point.properties?.id);
    }
});

/** Four points around the antimeridian, two either side of it. */
const DATELINE_POINTS: FC = fc(
    { type: 'Feature', properties: { id: 'w1' }, geometry: { type: 'Point', coordinates: [178, 0] } },
    { type: 'Feature', properties: { id: 'w2' }, geometry: { type: 'Point', coordinates: [179, 2] } },
    { type: 'Feature', properties: { id: 'e1' }, geometry: { type: 'Point', coordinates: [-179, 0] } },
    { type: 'Feature', properties: { id: 'e2' }, geometry: { type: 'Point', coordinates: [-178, 2] } },
);

test('voronoi cells stay local when the points straddle the antimeridian', { timeout: TIMEOUT }, async () => {
    const out = await run('voronoi', DATELINE_POINTS);
    assert.equal(out.features.length, 4);

    // Without unwrapping, the two groups look half a planet apart and their
    // cells span the whole Pacific. Each cell must stay within a few degrees of
    // the date line — measured per part, since a cell crossing ±180° is split
    // into two pieces by -wrapdateline and each piece hugs its own edge.
    for (const cell of out.features) {
        const g = cell.geometry;
        const polys = g.type === 'Polygon' ? [g.coordinates] : (g as GeoJSON.MultiPolygon).coordinates;
        for (const poly of polys) {
            const xs = poly[0].map(p => p[0]);
            const width = Math.max(...xs) - Math.min(...xs);
            assert.ok(width < 20, `${cell.properties?.id}: cell spans ${width}°, so it wrapped the wrong way`);
        }
    }
});

test('each point still lands in its own cell across the antimeridian', { timeout: TIMEOUT }, async () => {
    const out = await run('voronoi', DATELINE_POINTS);
    for (const point of DATELINE_POINTS.features) {
        const [x, y] = (point.geometry as GeoJSON.Point).coordinates;
        const containing = out.features.filter(cell => contains(cell, x, y));
        assert.equal(containing.length, 1, `${point.properties?.id} lies in one cell`);
        assert.equal(containing[0].properties?.id, point.properties?.id);
    }
});

test('delaunay connects the right neighbours across the antimeridian', { timeout: TIMEOUT }, async () => {
    // Geometry alone cannot show this: `-wrapdateline` makes even a wrong-way
    // triangle come back looking local. What differs is *which* points are
    // neighbours, so the test counts the triangles that join the two sides —
    // 4 of the 5 in the correct frame, 3 when the sides look a planet apart.
    const strip: FC = fc(
        ...[[178, 0], [179, 3], [178, 6], [-179, 0], [-178, 3], [-179, 6]].map(([lon, lat], i) => ({
            type: 'Feature' as const,
            properties: { id: i + 1 },
            geometry: { type: 'Point' as const, coordinates: [lon, lat] },
        })),
    );
    const out = await run('delaunay', strip);
    assert.equal(out.features.length, 5);

    const crossing = out.features.filter(f => {
        const corners = [f.properties?.point_1, f.properties?.point_2, f.properties?.point_3].map(Number);
        // Points 1-3 are west of the line, 4-6 east of it.
        return corners.some(c => c <= 3) && corners.some(c => c >= 4);
    });
    assert.equal(crossing.length, 4, 'the mesh must span the date line, not run around the globe');
});

/**
 * Points right round the globe — the case unwrapping cannot help with, because
 * there is no empty side to rotate the seam into. Three rows of twelve, offset
 * by half a step so that the cells interlock rather than forming a grid.
 *
 * The two points flanking the date line sit at opposite latitudes on purpose:
 * that makes the boundary between them a slanted bisector, which is what tells a
 * diagram that treats the line as a join apart from one merely cut off at the
 * edge of its box (the box edge is a straight vertical line in exactly the same
 * place, so a symmetric fixture agrees with both and tests nothing).
 */
function worldRow(startLon: number, lat: number, special: Record<number, number> = {}): GeoJSON.Feature[] {
    const row: GeoJSON.Feature[] = [];
    for (let lon = startLon; lon < 180; lon += 30) {
        const at = special[lon] ?? lat;
        row.push({
            type: 'Feature',
            properties: { id: `${lon}/${at}` },
            geometry: { type: 'Point', coordinates: [lon, at] },
        });
    }
    return row;
}

const WORLDWIDE_POINTS: FC = fc(
    ...worldRow(-180, 0, { 150: 50, [-180]: -50 }),
    ...worldRow(-165, 45),
    ...worldRow(-165, -45),
);

test('a worldwide voronoi tiles the map without overlaps or wrapped cells', { timeout: TIMEOUT }, async () => {
    const out = await run('voronoi', WORLDWIDE_POINTS);
    assert.equal(out.features.length, WORLDWIDE_POINTS.features.length);

    for (const cell of out.features) {
        const g = cell.geometry;
        const polys = g.type === 'Polygon' ? [g.coordinates] : (g as GeoJSON.MultiPolygon).coordinates;
        for (const poly of polys) {
            const xs = poly[0].map(p => p[0]);
            // A cell that reached past the date line and was folded back rather
            // than cut comes out as a sliver spanning almost the whole world.
            assert.ok(Math.max(...xs) <= 180.001 && Math.min(...xs) >= -180.001, 'cell stays inside the world');
            assert.ok(Math.max(...xs) - Math.min(...xs) < 120, `cell spans ${Math.max(...xs) - Math.min(...xs)}°`);
        }
    }

    // Cells must partition the area: every sample point belongs to exactly one.
    for (let lon = -175; lon < 180; lon += 11) {
        for (let lat = -35; lat <= 35; lat += 11) {
            const hits = out.features.filter(cell => contains(cell, lon, lat));
            assert.equal(hits.length, 1, `${lon},${lat} is covered by ${hits.length} cells`);
        }
    }
});

test('a worldwide voronoi makes neighbours of the points either side of the date line', { timeout: TIMEOUT }, async () => {
    const out = await run('voronoi', WORLDWIDE_POINTS);
    // 175°E, 20°N is nearest to the point at 165°E, 45°N — but it lies beyond
    // the edge of the box, in the strip that has to be wrapped back into the
    // world. Wrap it without joining the two sides first and the ground ends up
    // filed under the point on the *other* side of the line, at 165°W.
    const owners = out.features.filter(cell => contains(cell, 175, 20)).map(cell => cell.properties?.id);
    assert.deepEqual(owners, ['165/45'], 'ground by the date line belongs to its true nearest point');
});

test('a worldwide delaunay closes the mesh across the date line', { timeout: TIMEOUT }, async () => {
    const out = await run('delaunay', WORLDWIDE_POINTS);
    // Each row starts just west of the date line and ends just east of it, so
    // the first and last point of a row are 30° apart across the line and 330°
    // apart on a plane with a seam in it. Those are the pairs that must be
    // joined.
    const westOfLine = new Set([1, 13, 25]);
    const eastOfLine = new Set([12, 24, 36]);
    const joined = out.features.filter(f => {
        const corners = [f.properties?.point_1, f.properties?.point_2, f.properties?.point_3].map(Number);
        return corners.some(c => westOfLine.has(c)) && corners.some(c => eastOfLine.has(c));
    });
    assert.ok(joined.length >= 2, `expected the mesh to close, got ${joined.length} triangles across the line`);

    for (const triangle of out.features) {
        const g = triangle.geometry;
        const polys = g.type === 'Polygon' ? [g.coordinates] : (g as GeoJSON.MultiPolygon).coordinates;
        for (const poly of polys) {
            const xs = poly[0].map(p => p[0]);
            // Wide triangles are legitimate here — three near-parallel rows of
            // points have huge circumcircles — but a triangle taking the long
            // way round the globe spans more than half the world, and none of
            // the honest ones come close.
            assert.ok(Math.max(...xs) - Math.min(...xs) < 200, 'no triangle runs the long way round');
        }
    }
});

test('voronoi uses the centre of non-point features', { timeout: TIMEOUT }, async () => {
    const out = await run('voronoi', ADJACENT);
    assert.equal(out.features.length, 3, 'polygons take part through their centre');
});

test('delaunay triangulates the points and records their corners', { timeout: TIMEOUT }, async () => {
    const out = await run('delaunay', POINTS);
    // Three points make exactly one triangle.
    assert.equal(out.features.length, 1);
    const props = out.features[0].properties ?? {};
    assert.deepEqual([props.point_1, props.point_2, props.point_3].sort(), [1, 2, 3]);
});

test('delaunay refuses input it cannot triangulate', { timeout: TIMEOUT }, async () => {
    const two = fc(POINTS.features[0], POINTS.features[1]);
    await assert.rejects(() => run('delaunay', two), /at least three points/);

    const collinear = fc(
        { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } },
        { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [1, 0] } },
        { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [2, 0] } },
    );
    await assert.rejects(() => run('delaunay', collinear), /one line/);
});

/**
 * Two polygons sharing a wiggly border — the case that exposes per-geometry
 * simplification. `west` and `east` both trace the same zigzag between them.
 */
function neighbours(): FC {
    const border: GeoJSON.Position[] = [];
    for (let i = 0; i <= 20; i++) {
        // A zigzag fine enough that a coarse tolerance must remove points from it.
        border.push([1 + (i % 2 === 0 ? 0 : 0.01), i * 0.1]);
    }
    const reversed = [...border].reverse();
    return fc(
        {
            type: 'Feature',
            properties: { name: 'west' },
            geometry: { type: 'Polygon', coordinates: [[[0, 0], ...border, [0, 2], [0, 0]]] },
        },
        {
            type: 'Feature',
            properties: { name: 'east' },
            geometry: { type: 'Polygon', coordinates: [[[3, 0], [3, 2], ...reversed, [3, 0]]] },
        },
    );
}

/**
 * Points of `feature` on the shared border (x ≈ 1), deduplicated: a ring repeats
 * its first point at the end, which would otherwise look like a difference
 * between the two neighbours purely because their rings start in different
 * places.
 */
function borderPoints(feature: GeoJSON.Feature): string[] {
    const ring = (feature.geometry as GeoJSON.Polygon).coordinates[0];
    const keys = ring
        .filter(([x]) => Math.abs(x - 1) < 0.5)
        .map(([x, y]) => `${x.toFixed(6)},${y.toFixed(6)}`);
    return [...new Set(keys)].sort();
}

test('simplify keeps a shared border identical on both sides', { timeout: TIMEOUT }, async () => {
    const input = neighbours();
    const out = await run('simplify', input, undefined, { tolerance: 20000 });
    assert.equal(out.features.length, 2);

    const west = out.features.find(f => f.properties?.name === 'west')!;
    const east = out.features.find(f => f.properties?.name === 'east')!;

    const westBorder = borderPoints(west);
    const eastBorder = borderPoints(east);
    assert.ok(westBorder.length > 1, 'the shared border should still have points');
    assert.deepEqual(
        westBorder,
        eastBorder,
        'both neighbours must trace the exact same simplified border — otherwise slivers appear between them',
    );

    // And the border really was simplified, not merely left alone.
    const before = borderPoints(input.features[0]).length;
    assert.ok(westBorder.length < before, `expected fewer than ${before} border points, got ${westBorder.length}`);
});

test('simplify removes detail but keeps the feature count', { timeout: TIMEOUT }, async () => {
    // A square with a redundant midpoint on each edge.
    const detailed = fc({
        type: 'Feature',
        properties: { name: 'noisy' },
        geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [0.5, 0.001], [1, 0], [1, 0.5], [1, 1], [0.5, 1], [0, 1], [0, 0.5], [0, 0]]],
        },
    });
    const before = (detailed.features[0].geometry as GeoJSON.Polygon).coordinates[0].length;
    const out = await run('simplify', detailed, undefined, { tolerance: 20000 });
    assert.equal(out.features.length, 1);
    assert.equal(out.features[0].properties?.name, 'noisy');
    const after = (out.features[0].geometry as GeoJSON.Polygon).coordinates[0].length;
    assert.ok(after < before, `expected fewer than ${before} vertices, got ${after}`);
});

/** Segments ab and cd properly cross (touching at an endpoint does not count). */
function segmentsCross(a: GeoJSON.Position, b: GeoJSON.Position, c: GeoJSON.Position, d: GeoJSON.Position): boolean {
    const side = (p: GeoJSON.Position, q: GeoJSON.Position, r: GeoJSON.Position) =>
        Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    const o1 = side(a, b, c), o2 = side(a, b, d), o3 = side(c, d, a), o4 = side(c, d, b);
    return o1 !== o2 && o3 !== o4 && o1 !== 0 && o2 !== 0 && o3 !== 0 && o4 !== 0;
}

function ringsOf(feature: GeoJSON.Feature): GeoJSON.Position[][] {
    const g = feature.geometry;
    if (!g) return [];
    if (g.type === 'Polygon') return g.coordinates;
    if (g.type === 'MultiPolygon') return g.coordinates.flat();
    return [];
}

function countCrossings(collection: FC): number {
    let crossings = 0;
    for (const feature of collection.features) {
        for (const ring of ringsOf(feature)) {
            const n = ring.length - 1;
            for (let i = 0; i < n; i++) {
                for (let j = i + 2; j < n; j++) {
                    if (i === 0 && j === n - 1) continue;
                    if (segmentsCross(ring[i], ring[i + 1], ring[j], ring[j + 1])) crossings++;
                }
            }
        }
    }
    return crossings;
}

/** Decodes the repo's TopoJSON of world countries — real borders, real artefacts. */
function worldCountries(): FC {
    const topo = JSON.parse(readFileSync('public/data/world-countries-simplified.topojson', 'utf8'));
    const { scale, translate } = topo.transform;
    const arcs: GeoJSON.Position[][] = topo.arcs.map((arc: number[][]) => {
        let x = 0, y = 0;
        return arc.map(([dx, dy]) => {
            x += dx; y += dy;
            return [x * scale[0] + translate[0], y * scale[1] + translate[1]] as GeoJSON.Position;
        });
    });
    const ring = (indices: number[]): GeoJSON.Position[] => {
        const out: GeoJSON.Position[] = [];
        for (const index of indices) {
            const arc = index < 0 ? [...arcs[~index]].reverse() : arcs[index];
            out.push(...(out.length ? arc.slice(1) : arc));
        }
        return out;
    };
    return {
        type: 'FeatureCollection',
        features: topo.objects['world-countries-simplified2'].geometries.map((g: never) => {
            const geom = g as { type: string; arcs: number[][] & number[][][]; properties?: GeoJSON.GeoJsonProperties };
            return {
                type: 'Feature',
                properties: geom.properties ?? {},
                geometry: geom.type === 'Polygon'
                    ? { type: 'Polygon', coordinates: geom.arcs.map(ring) }
                    : { type: 'MultiPolygon', coordinates: geom.arcs.map((p: number[][]) => p.map(ring)) },
            } as GeoJSON.Feature;
        }),
    };
}

/**
 * A big tolerance folds an outline over itself, and the renderer fills the fold —
 * the stray triangles seen along the Morocco/Mauritania and Chad/Nigeria borders.
 * Simplifying alone produces them; the repair pass is what removes them, which is
 * why this runs on real borders rather than a contrived shape.
 */
test('simplify repairs the crossings a large tolerance creates', { timeout: TIMEOUT }, async () => {
    const countries = worldCountries();
    const op = getOperation('simplify');
    assert.ok(op?.compute, 'simplify must be a JS operation');

    // Degrees here (calling compute directly), so these stand in for the metre
    // tolerances the app passes after reprojection.
    for (const tolerance of [0.1, 0.5, 0.9]) {
        const out = await op!.compute!(countries, { tolerance }, {}) as FC;
        assert.equal(countCrossings(out), 0, `tolerance ${tolerance} left self-intersections`);
    }
});

test('simplify still removes most points despite repair', { timeout: TIMEOUT }, async () => {
    const countries = worldCountries();
    const op = getOperation('simplify');
    const points = (c: FC) => c.features.reduce((sum, f) => sum + ringsOf(f).reduce((s, r) => s + r.length, 0), 0);

    const out = await op!.compute!(countries, { tolerance: 0.5 }, {}) as FC;
    const kept = points(out) / points(countries);
    // Repair gives detail back only to the guilty arcs; if it ever starts
    // restoring everything, simplification silently stops doing anything.
    assert.ok(kept < 0.2, `expected well under 20% of points kept, got ${(kept * 100).toFixed(1)}%`);
    assert.equal(out.features.length, countries.features.length);
});

test('simplify tolerance is interpreted in metres', { timeout: TIMEOUT }, async () => {
    // A narrow spike: ~2 km across and ~11 km deep, so its Visvalingam area is
    // around 1.2e7 m². A 100 m tolerance (1e4 m²) must keep it, a 20 km one
    // (4e8 m²) must remove it. This is what proves the EPSG:3857 scaling works.
    const spiked = fc({
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0.51, 1], [0.5, 0.9], [0.49, 1], [0, 1], [0, 0]]],
        },
    });
    const fine = await run('simplify', spiked, undefined, { tolerance: 100 });
    const coarse = await run('simplify', spiked, undefined, { tolerance: 20000 });
    const count = (c: FC) => (c.features[0].geometry as GeoJSON.Polygon).coordinates[0].length;
    assert.ok(count(fine) > count(coarse), `fine=${count(fine)} coarse=${count(coarse)}`);
});

test('simplify drops a small island rather than shrinking it to a point', { timeout: TIMEOUT }, async () => {
    // A mainland far larger than the tolerance, plus one small detached island
    // — small enough that Visvalingam collapses its ring onto a single vertex
    // well before the mainland's own outline is touched.
    const mainland: GeoJSON.Feature = {
        type: 'Feature', properties: { name: 'mainland' },
        geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
    };
    const island: GeoJSON.Feature = {
        type: 'Feature', properties: { name: 'island' },
        geometry: {
            type: 'Polygon',
            coordinates: [[[10, 10], [10.001, 10], [10.0015, 10.0005], [10.001, 10.001], [10, 10.001], [10, 10]]],
        },
    };
    const out = await run('simplify', fc(mainland, island), undefined, { tolerance: 20000 });

    assert.equal(out.features.length, 1, 'the degenerated island must be dropped, not kept as a zero-area shape');
    assert.equal(out.features[0].properties?.name, 'mainland');
    const warnings = (out as GeoJSON.FeatureCollection & { warnings?: string[] }).warnings;
    assert.ok(
        warnings?.some((w: string) => /no geometry left/.test(w)),
        `expected a dropped-geometry warning, got ${JSON.stringify(warnings)}`,
    );
});

test('simplify drops a lake that collapses, keeping the rest of the polygon', { timeout: TIMEOUT }, async () => {
    // A large outer ring with one small hole (a lake) far smaller than the
    // tolerance being applied — the hole should disappear, the polygon should not.
    const withLake: GeoJSON.Feature = {
        type: 'Feature', properties: { name: 'country' },
        geometry: {
            type: 'Polygon',
            coordinates: [
                [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]],
                [[0.5, 0.5], [0.5001, 0.5], [0.50015, 0.50005], [0.5001, 0.5001], [0.5, 0.5001], [0.5, 0.5]],
            ],
        },
    };
    const out = await run('simplify', fc(withLake), undefined, { tolerance: 20000 });

    assert.equal(out.features.length, 1, 'the outer shape must survive even though its lake collapsed');
    const rings = (out.features[0].geometry as GeoJSON.Polygon).coordinates;
    assert.equal(rings.length, 1, `expected the collapsed lake to be dropped, kept ${rings.length - 1} hole(s)`);
});

test('simplify snap merges a border that only nearly matches, into one shared arc', { timeout: TIMEOUT }, async () => {
    // The same zigzag border as `neighbours()`, but the east side's copy is off
    // by 0.3 m in EPSG:3857 (about 3e-6 degrees) at every vertex — the way two
    // layers pulled from different sources trace "the same" border differently.
    const border: GeoJSON.Position[] = [];
    for (let i = 0; i <= 20; i++) border.push([1 + (i % 2 === 0 ? 0 : 0.01), i * 0.1]);
    const jitter = 0.000003; // ~0.3 m at this latitude
    const borderFromTheOtherSource = border.map(([x, y]) => [x + jitter, y - jitter]);
    const input = fc(
        {
            type: 'Feature', properties: { name: 'west' },
            geometry: { type: 'Polygon', coordinates: [[[0, 0], ...border, [0, 2], [0, 0]]] },
        },
        {
            type: 'Feature', properties: { name: 'east' },
            geometry: { type: 'Polygon', coordinates: [[[3, 0], [3, 2], ...[...borderFromTheOtherSource].reverse(), [3, 0]]] },
        },
    );

    const unsnapped = await run('simplify', input, undefined, { tolerance: 20000, snap: 0 });
    const westUnsnapped = borderPoints(unsnapped.features.find(f => f.properties?.name === 'west')!);
    const eastUnsnapped = borderPoints(unsnapped.features.find(f => f.properties?.name === 'east')!);
    assert.notDeepEqual(westUnsnapped, eastUnsnapped, 'the fixture must not already agree, or snap proves nothing');

    // 1 m is comfortably wider than the 0.3 m jitter and far narrower than the
    // ~11 km the 0.01°-deep zigzag stands on, so it cannot be mistaken for the
    // simplification tolerance doing this on its own.
    const snapped = await run('simplify', input, undefined, { tolerance: 20000, snap: 1 });
    const westSnapped = borderPoints(snapped.features.find(f => f.properties?.name === 'west')!);
    const eastSnapped = borderPoints(snapped.features.find(f => f.properties?.name === 'east')!);
    assert.deepEqual(westSnapped, eastSnapped, 'a 1 m snap should have merged the two traces into one shared border');
});

test('a snap distance wider than a real gap pinches the ring, and is reported', { timeout: TIMEOUT }, async () => {
    // An hourglass: a narrow 40 m neck within one ring, where the two sides
    // never touch. A snap wider than that gap pulls both sides onto the same
    // grid point, before topology is even built — a defect no repair pass can
    // undo, since it can only restore points the snap did not already merge.
    const hourglass: GeoJSON.Feature = {
        type: 'Feature', properties: { name: 'peninsula' },
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [0, 0], [1000, 0], [1000, 1000], [520, 1000], [520, 1100], [1000, 1100], [1000, 2000],
                [0, 2000], [0, 1100], [480, 1100], [480, 1000], [0, 1000], [0, 0],
            ]],
        },
    };
    const input = fc(hourglass);
    const op = getOperation('simplify')!;

    const narrow = await op.compute!(input, { tolerance: 1, snap: 30 }, {}) as GeoJSON.FeatureCollection & { warnings?: string[] };
    assert.equal(narrow.warnings, undefined, 'a snap narrower than the neck must not warn');

    const wide = await op.compute!(input, { tolerance: 1, snap: 100 }, {}) as GeoJSON.FeatureCollection & { warnings?: string[] };
    assert.ok(wide.warnings?.length, 'a snap wider than the neck must be reported, not shipped silently');
    assert.match(wide.warnings![0], /self-intersect/);
});

// ─── Robustness ──────────────────────────────────────────────────────────────

test('an empty input is rejected with a readable message', { timeout: TIMEOUT }, async () => {
    await assert.rejects(() => run('centroid', fc()), /no features/);
});

test('features with nested properties do not break the SQL', { timeout: TIMEOUT }, async () => {
    const nested = fc({
        type: 'Feature',
        properties: { name: 'x', nested: { a: 1 }, list: [1, 2] },
        geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
    });
    const out = await run('centroid', nested);
    assert.equal(out.features.length, 1);
    assert.equal(out.features[0].properties?.name, 'x');
});
