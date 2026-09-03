/**
 * Builds the worked example behind the analysis documentation page.
 *
 * Two things come out of here, and both are *computed* rather than drawn:
 *
 *   docs/data/analysis-inputs.json    the two input layers
 *   docs/data/analysis-results.json   what every two-input operation returns
 *
 * The results are produced by running the real operations through the real
 * `runGeoprocess` against the real GDAL/SpatiaLite WASM — the same code the
 * browser runs. A hand-drawn diagram of what clip "should" do is a claim about
 * the code that nothing checks; this is the code answering for itself, so the
 * page cannot drift from the tool.
 *
 * Inputs are Natural Earth admin-0 countries, taken from the same tile service
 * the demo configs use, so the shapes are recognisable and the attributes
 * (`name`, `pop_est`) are real. The rectangle is authored: it contains Ireland
 * completely, cuts the United Kingdom, and misses the Netherlands, Belgium and
 * France entirely — so every predicate has a visible positive *and* negative
 * case in one picture.
 *
 *   npm run build:analysis-examples
 */
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { VectorTile } from '@mapbox/vector-tile';
import Pbf from 'pbf';

import { assembleTileFeatures, type TileFeatureRecord } from '../src/map/vector-tile-features';
import { runGeoprocess, type GdalLike } from '../src/workers/geoprocessing-runner';
import { GEO_OPERATIONS, defaultParams, getOperation } from '../src/utils/geoprocessing-operations';

type FC = GeoJSON.FeatureCollection;

const OUT_DIR = path.resolve(process.cwd(), '..', 'webmapx-demo', 'docs', 'data');
const TILES = 'https://tiles.edugis.nl/data/public.ne_10m_admin_0_countries/mvt/{z}/{x}/{y}?geom_column=geom&columns=name,pop_est&include_nulls=0';
const Z = 4;
const COUNTRIES = ['United Kingdom', 'Ireland', 'Netherlands', 'Belgium', 'France'];

/**
 * An attribute worth grouping by.
 *
 * `pop_est` is a number and `name` is unique to each feature, so neither shows
 * what a dissolve is for. EU membership puts these five into two groups that a
 * reader already knows the answer to — and one of them, the United Kingdom, is
 * a group of exactly one, which is what stops "dissolve" being confused with
 * "merge everything".
 */
const EU_MEMBER: Record<string, 'yes' | 'no'> = {
    'United Kingdom': 'no',
    Ireland: 'yes',
    Netherlands: 'yes',
    Belgium: 'yes',
    France: 'yes',
};

/** The study area: contains Ireland, cuts the UK, misses the mainland three. */
const RECTANGLE: [number, number, number, number] = [-11, 51, -4, 56];

/** Detail kept in the figure, in metres. The picture spans ~1500 km. */
const SIMPLIFY_M = 3000;

// ─── GDAL, the Node way ──────────────────────────────────────────────────────
// gdal3.js's Node build takes file paths where the browser build takes `File`
// objects; everything else is identical. Same adapter as tests/geoprocessing.
let gdalPromise: Promise<GdalLike> | null = null;
function nodeGdal(): Promise<GdalLike> {
    if (gdalPromise) return gdalPromise;
    const scratch = mkdtempSync(path.join(tmpdir(), 'webmapx-examples-'));
    const nodeBuild = pathToFileURL(path.resolve(process.cwd(), 'node_modules/gdal3.js/node.js')).href;
    gdalPromise = import(nodeBuild)
        .then((mod: any) => (mod.default ?? mod)({ path: 'node_modules/gdal3.js/dist/package', useWorker: false }))
        .then((gdal: any): GdalLike => ({
            async open(file: unknown) {
                if (typeof File !== 'undefined' && file instanceof File) {
                    const target = path.join(scratch, (file as File).name);
                    writeFileSync(target, Buffer.from(await (file as File).arrayBuffer()));
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
    if (!op) throw new Error(`no such operation: ${operationId}`);
    const gdal = await nodeGdal();
    return runGeoprocess(gdal, {
        operationId, inputA, inputB,
        params: { ...defaultParams(op), ...params },
        centerLat: 53,
    });
}

// ─── inputs ──────────────────────────────────────────────────────────────────

const lon2x = (lon: number, z: number) => Math.floor((lon + 180) / 360 * 2 ** z);
const lat2y = (lat: number, z: number) =>
    Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * 2 ** z);

async function fetchCountries(): Promise<FC> {
    const records: TileFeatureRecord[] = [];
    for (let x = lon2x(-12, Z); x <= lon2x(9, Z); x++) {
        for (let y = lat2y(62, Z); y <= lat2y(41, Z); y++) {
            const res = await fetch(TILES.replace('{z}', String(Z)).replace('{x}', String(x)).replace('{y}', String(y)));
            if (!res.ok) continue;
            const buf = new Uint8Array(await res.arrayBuffer());
            if (!buf.length) continue;
            const tile = new VectorTile(new Pbf(buf));
            for (const name of Object.keys(tile.layers)) {
                const layer = tile.layers[name];
                for (let i = 0; i < layer.length; i++) {
                    const f = layer.feature(i);
                    records.push({ feature: f.toGeoJSON(x, y, Z) as GeoJSON.Feature, tile: { z: Z, x, y }, sourceLayer: name, id: f.id });
                }
            }
        }
    }
    const all = assembleTileFeatures(records);
    return {
        type: 'FeatureCollection',
        features: COUNTRIES.map((name) => {
            const found = all.features.find(f => String((f.properties as any)?.name) === name);
            if (!found) throw new Error(`country not in the tiles: ${name}`);
            return {
                type: 'Feature' as const,
                properties: { name, eu: EU_MEMBER[name], pop_est: Number((found.properties as any).pop_est) },
                geometry: dropSlivers(found.geometry as GeoJSON.Geometry, 0.02),
            };
        }),
    };
}

/**
 * Keeps the parts worth drawing at this scale.
 *
 * A figure is not a dataset: the United Kingdom's fifty-odd Atlantic islets are
 * invisible here and cost more bytes than the mainland does.
 */
function dropSlivers(geometry: GeoJSON.Geometry, minShare: number): GeoJSON.Geometry {
    if (geometry.type !== 'MultiPolygon') return geometry;
    const ringArea = (ring: number[][]) => Math.abs(ring.reduce((sum, p, i) => {
        const q = ring[(i + 1) % ring.length];
        return sum + (p[0] * q[1] - q[0] * p[1]);
    }, 0) / 2);
    const parts = geometry.coordinates.map(p => ({ p, a: ringArea(p[0] as number[][]) }));
    const total = parts.reduce((s, x) => s + x.a, 0);
    const kept = parts.filter(x => x.a / total >= minShare).map(x => x.p);
    return kept.length === 1
        ? { type: 'Polygon', coordinates: kept[0] }
        : { type: 'MultiPolygon', coordinates: kept };
}

function roundCoords<T>(value: T, places = 3): T {
    const factor = 10 ** places;
    const roundPosition = (c: any): any => {
        if (typeof c[0] === 'number') {
            return [Math.round(c[0] * factor) / factor, Math.round(c[1] * factor) / factor];
        }
        const mapped = c.map(roundPosition);
        // Rounding lands neighbouring points on the same coordinate, and a
        // coastline has a great many neighbours: dropping the duplicates takes
        // the committed results from 1.3 MB to a fraction of it without moving
        // a single line on the page. A ring keeps its closing point.
        if (typeof mapped[0]?.[0] === 'number') {
            const out = mapped.filter((p: number[], i: number) =>
                i === 0 || p[0] !== mapped[i - 1][0] || p[1] !== mapped[i - 1][1]);
            return out.length >= 4 || out.length === mapped.length ? out : mapped;
        }
        return mapped;
    };
    const walk = (v: any): any => {
        if (Array.isArray(v)) return v.map(walk);
        if (v && typeof v === 'object') {
            const out: Record<string, unknown> = {};
            for (const [k, x] of Object.entries(v)) out[k] = k === 'coordinates' ? roundPosition(x) : walk(x);
            return out;
        }
        return v;
    };
    return walk(value) as T;
}

const rectangleLayer = (): FC => ({
    type: 'FeatureCollection',
    features: [{
        type: 'Feature',
        properties: { name: 'rectangle', note: 'study area' },
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [RECTANGLE[0], RECTANGLE[1]], [RECTANGLE[2], RECTANGLE[1]],
                [RECTANGLE[2], RECTANGLE[3]], [RECTANGLE[0], RECTANGLE[3]],
                [RECTANGLE[0], RECTANGLE[1]],
            ]],
        },
    }],
});

// ─── what each operation accepts ─────────────────────────────────────────────
// Nothing in the registry declares which geometry an operation takes: the input
// spec carries a label and a hint, and the tool offers every layer on the map.
// What actually works is therefore a property of the SQL, and the only honest
// way to write it down is to run it. Each cell below is one real call.

const PROBE: Record<string, FC> = {
    point: { type: 'FeatureCollection', features: [
        { type: 'Feature', properties: { name: 'p1', pop: 10 }, geometry: { type: 'Point', coordinates: [1, 1] } },
        { type: 'Feature', properties: { name: 'p2', pop: 20 }, geometry: { type: 'Point', coordinates: [3, 3] } },
        { type: 'Feature', properties: { name: 'p3', pop: 30 }, geometry: { type: 'Point', coordinates: [1, 3] } },
    ] },
    // Three of each, with distinct centres, deliberately. An operation that
    // needs three points to mean anything — delaunay wants three for a triangle,
    // and takes a non-point feature's centre — would otherwise be recorded as
    // "does not accept lines" when the truth is "was not given three distinct
    // ones": two of these lines crossed at their midpoints, so three lines
    // yielded two points and the triangulation was empty.
    line: { type: 'FeatureCollection', features: [
        { type: 'Feature', properties: { name: 'l1', pop: 10 }, geometry: { type: 'LineString', coordinates: [[0, 0], [4, 4]] } },
        { type: 'Feature', properties: { name: 'l2', pop: 20 }, geometry: { type: 'LineString', coordinates: [[0, 4], [4, 2]] } },
        { type: 'Feature', properties: { name: 'l3', pop: 30 }, geometry: { type: 'LineString', coordinates: [[6, 0], [9, 3]] } },
    ] },
    polygon: { type: 'FeatureCollection', features: [
        { type: 'Feature', properties: { name: 'a', pop: 10 }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]] } },
        { type: 'Feature', properties: { name: 'b', pop: 20 }, geometry: { type: 'Polygon', coordinates: [[[6, 0], [9, 0], [9, 3], [6, 3], [6, 0]]] } },
        { type: 'Feature', properties: { name: 'c', pop: 30 }, geometry: { type: 'Polygon', coordinates: [[[6, 6], [9, 6], [9, 9], [6, 9], [6, 6]]] } },
    ] },
};
/** A shape overlapping the probe fixtures, used as the second input. */
const PROBE_B: Record<string, FC> = {
    point: { type: 'FeatureCollection', features: [
        { type: 'Feature', properties: { name: 'bp', zone: 'z' }, geometry: { type: 'Point', coordinates: [1, 1] } },
    ] },
    line: { type: 'FeatureCollection', features: [
        { type: 'Feature', properties: { name: 'bl', zone: 'z' }, geometry: { type: 'LineString', coordinates: [[-1, 1], [5, 1]] } },
    ] },
    polygon: { type: 'FeatureCollection', features: [
        { type: 'Feature', properties: { name: 'bp', zone: 'z' }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]] } },
    ] },
};

const GEOMETRIES = ['point', 'line', 'polygon'] as const;
type GeomKind = (typeof GEOMETRIES)[number];

/** Parameters an operation needs before it will do anything at all. */
const PROBE_PARAMS: Record<string, Record<string, string | number>> = {
    buffer: { distance: 50000 },
    simplify: { tolerance: 1000 },
    dissolve: { groupBy: '' },
    statistics: { groupBy: '' },
    cartogram: { field: 'pop', method: 'scaled' },
    voronoi: {},
    delaunay: {},
};

type Support = 'ok' | 'empty' | 'error';
interface SupportRow { operation: string; label: string; twoInput: boolean; cells: Record<string, Support>; }

async function probeSupport(): Promise<SupportRow[]> {
    const rows: SupportRow[] = [];
    for (const op of GEO_OPERATIONS) {
        const twoInput = op.inputs.some(i => i.key === 'b');
        const cells: Record<string, Support> = {};
        for (const a of GEOMETRIES) {
            const bKinds: (GeomKind | null)[] = twoInput ? [...GEOMETRIES] : [null];
            for (const bKind of bKinds) {
                const key = bKind ? `${a}/${bKind}` : a;
                try {
                    const out = await run(op.id, PROBE[a], bKind ? PROBE_B[bKind] : undefined, PROBE_PARAMS[op.id] ?? {});
                    cells[key] = out.features.length > 0 ? 'ok' : 'empty';
                } catch {
                    cells[key] = 'error';
                }
            }
        }
        rows.push({ operation: op.id, label: op.label, twoInput, cells });
        const summary = Object.entries(cells).map(([k, v]) => `${k}:${v}`).join(' ');
        console.log(`  ${op.id.padEnd(18)} ${summary}`);
    }
    return rows;
}

async function main(): Promise<void> {
    mkdirSync(OUT_DIR, { recursive: true });
    const inputsPath = path.join(OUT_DIR, 'analysis-inputs.json');

    let inputs: { countries: FC; rectangle: FC };
    if (existsSync(inputsPath) && !process.argv.includes('--refetch')) {
        inputs = JSON.parse(readFileSync(inputsPath, 'utf8'));
        console.log('inputs: reusing', path.relative(process.cwd(), inputsPath), '(--refetch to rebuild)');
    } else {
        console.log('inputs: fetching Natural Earth countries …');
        const raw = await fetchCountries();
        // Simplified by the tool's own simplify operation, which builds a
        // topology first — so the Netherlands, Belgium and France keep matching
        // borders instead of growing slivers between them.
        const simplified = await run('simplify', raw, undefined, { tolerance: SIMPLIFY_M });
        inputs = { countries: roundCoords(simplified, 2), rectangle: rectangleLayer() };
        writeFileSync(inputsPath, writeJson(inputs));
        console.log('inputs: wrote', path.relative(process.cwd(), inputsPath));
    }

    for (const f of inputs.countries.features) {
        const g: any = f.geometry;
        console.log(`  ${String((f.properties as any).name).padEnd(16)} ${g.type.padEnd(13)} parts ${String(g.type === 'MultiPolygon' ? g.coordinates.length : 1).padStart(2)}`);
    }
    console.log('  rectangle', JSON.stringify(RECTANGLE));

    const { countries, rectangle } = inputs;
    const results: ExampleResult[] = [];
    for (const example of [...EXAMPLES, ...SINGLE_EXAMPLES]) {
        const started = Date.now();
        const out = await run(example.operation, countries, example.twoInput ? rectangle : undefined, example.params ?? {});
        results.push({
            ...example,
            featureCount: out.features.length,
            fields: fieldsOf(out),
            // Two decimals: about a kilometre, and the figures are 300px across
            // some 24 degrees, so a pixel is ~0.08° — eight times coarser than
            // this. More precision would be invisible and permanent, since the
            // file is committed.
            result: roundCoords(out, 2) as FC,
        });
        console.log(`  ${example.id.padEnd(26)} ${String(out.features.length).padStart(2)} features  ${Date.now() - started} ms  [${fieldsOf(out).join(', ')}]`);
    }
    console.log('probing which geometry each operation accepts …');
    const support = await probeSupport();

    const resultsPath = path.join(OUT_DIR, 'analysis-results.json');
    writeFileSync(resultsPath, writeJson({ generatedFrom: 'npm run build:analysis-examples', results, support }));
    console.log('results: wrote', path.relative(process.cwd(), resultsPath));
}

/**
 * Generated data, written compactly.
 *
 * Indenting is for files people edit, and a coordinate pair costs more in
 * indentation than it does in digits: pretty-printing these results took 351 KB
 * of data to 1.3 MB of file, all of it whitespace around `[x, y]`.
 */
function writeJson(value: unknown): string {
    return JSON.stringify(value) + '\n';
}

/** Attribute names the result carries, in the order the first feature lists them. */
function fieldsOf(fc: FC): string[] {
    return Object.keys(fc.features[0]?.properties ?? {});
}

interface Example {
    id: string;
    operation: string;
    title: string;
    twoInput: boolean;
    params?: Record<string, string | number>;
    /** What the reader should take from this one. */
    note: string;
}
interface ExampleResult extends Example {
    featureCount: number;
    fields: string[];
    result: FC;
}

const EXAMPLES: Example[] = [
    { id: 'clip', operation: 'clip', title: 'Clip', twoInput: true,
      note: 'Keeps the parts of the countries that fall inside the rectangle. One country stays one feature, and only the countries’ own attributes come through.' },
    { id: 'erase', operation: 'erase', title: 'Erase', twoInput: true,
      note: 'The opposite of clip: everything the rectangle covers is cut away. Ireland disappears entirely, because the rectangle contains all of it.' },
    { id: 'intersect', operation: 'intersect', title: 'Intersect', twoInput: true,
      note: 'The same geometry as clip, but one feature per overlapping pair — and the rectangle’s attributes travel with it. Its `name` collides with the countries’ `name`, so it arrives as `name_2`.' },
    { id: 'union', operation: 'union', title: 'Union (overlay)', twoInput: true,
      note: 'Every piece of both layers: the overlap, the countries outside the rectangle, and the rectangle outside the countries. `part` says which of the three a feature is, and a piece with no counterpart has NULL where the other layer’s fields would be.' },
    { id: 'select-intersects', operation: 'selectByLocation', title: 'Select by location — touch or overlap', twoInput: true, params: { mode: 'intersects' },
      note: 'Keeps whole features that touch the rectangle at all. Geometry is untouched — this filters, it does not cut.' },
    { id: 'select-within', operation: 'selectByLocation', title: 'Select by location — lie completely inside', twoInput: true, params: { mode: 'within' },
      note: 'Stricter: only Ireland qualifies, because the United Kingdom sticks out of the rectangle.' },
    { id: 'select-disjoint', operation: 'selectByLocation', title: 'Select by location — do not touch', twoInput: true, params: { mode: 'disjoint' },
      note: 'The negation: the three mainland countries, which the rectangle never reaches.' },
    { id: 'join-intersects', operation: 'spatialJoin', title: 'Spatial join — touches or overlaps', twoInput: true, params: { relation: 'intersects' },
      note: 'Every country keeps its own geometry and gains the rectangle’s attributes where the two meet. Countries that do not meet it keep their geometry and get nothing.' },
    { id: 'join-within', operation: 'spatialJoin', title: 'Spatial join — lies inside', twoInput: true, params: { relation: 'within' },
      note: 'Only a country that lies entirely within the rectangle picks up its attributes.' },
    { id: 'join-contains', operation: 'spatialJoin', title: 'Spatial join — contains', twoInput: true, params: { relation: 'contains' },
      note: 'The mirror image: the country would have to contain the rectangle. None does, so nothing is matched — the same layer back, with empty columns.' },
];

/**
 * The one-layer operations, on the same countries.
 *
 * No second layer and no rectangle: these reshape or summarise what they are
 * given. The parameters are the ones the panel offers, at values that show
 * something at this scale.
 */
const SINGLE_EXAMPLES: Example[] = [
    { id: 'dissolve', operation: 'dissolve', title: 'Dissolve', twoInput: false, params: { groupBy: 'eu' },
      note: 'Merges features that share a value and removes the boundaries between them — here the `eu` attribute, so the four members become one shape and the United Kingdom stays its own. The members are not all adjacent, so their shape is one feature in several pieces: Ireland is an island, and dissolving does not pretend otherwise. Leave the grouping empty to merge the whole layer into one.' },
    { id: 'statistics', operation: 'statistics', title: 'Statistics', twoInput: false, params: { groupBy: 'eu' },
      note: 'The same grouping as dissolve, without the geometry: a table rather than a layer. Nothing is drawn, which is the point — no expensive geometry work when the answer is a count.' },
    { id: 'centroid', operation: 'centroid', title: 'Centroid', twoInput: false,
      note: 'One point per feature, at its centre of area. A centroid can fall outside its own shape — a crescent’s does — which is what the label point is for.' },
    { id: 'labelPoint', operation: 'labelPoint', title: 'Label point', twoInput: false,
      note: 'One point per feature, guaranteed *inside* it and as far from the edges as possible. Where you would put the name.' },
    { id: 'buffer', operation: 'buffer', title: 'Buffer', twoInput: false, params: { distance: 50000 },
      note: 'A zone at a fixed distance on the ground — 50 km here. Measured in metres, not degrees, so it is the same width at every latitude.' },
    { id: 'convexHull', operation: 'convexHull', title: 'Convex hull', twoInput: false,
      note: 'The smallest shape with no dents that still contains everything — an elastic band round the layer.' },
    { id: 'simplify', operation: 'simplify', title: 'Simplify', twoInput: false, params: { tolerance: 25000 },
      note: 'Fewer points, same map. A shared border is simplified once and both neighbours keep identical points, so no slivers open up between them.' },
    // No `method`: the operation's own default is `flow`, and the default is
    // what the page should show. Passing `scaled` gave a picture full of gaps
    // and overlaps — each shape resized about its own centre, with nothing
    // holding the map together — which is exactly what the joined-up default
    // exists to avoid.
    { id: 'cartogram', operation: 'cartogram', title: 'Cartogram', twoInput: false, params: { field: 'pop_est' },
      note: 'Each country resized so its *area* shows its population rather than its ground area: Ireland shrinks, the United Kingdom and France grow. The default method stretches one sheet, so neighbours stay attached — Belgium and the Netherlands do not come apart, and no gaps open along the borders.' },
    { id: 'voronoi', operation: 'voronoi', title: 'Voronoi', twoInput: false,
      note: 'Defined on points: one cell per point, covering everything closer to it than to any other. Hand it polygons or lines and each feature is first reduced to one point — a polygon’s area centroid, or the point halfway along a line — and the cells are built from those, so a layer of countries gives one cell per country.' },
    { id: 'delaunay', operation: 'delaunay', title: 'Delaunay', twoInput: false,
      note: 'The mirror image of Voronoi, and defined on points in the same way: triangles joining the points that are neighbours. A polygon or line input is reduced to one point per feature first — a polygon’s area centroid, or the point halfway along a line — and the triangles join those. Every input point ends up a corner of at least one triangle, which is why the distinct corners number exactly as many as the inputs. It is not merely a step towards Voronoi: a triangulation is the usual way to turn spot heights into a terrain surface (a TIN, and the contours and slopes read off it), to interpolate between measurements, and to ask which points are neighbours without choosing a distance — the neighbour graph spatial statistics builds its weights from. What comes back here is only the triangles and the indices of the points at their corners, with no attributes carried over and no height, so in this tool it answers the neighbour-and-spacing question rather than the surface one.' },
];

void main();
