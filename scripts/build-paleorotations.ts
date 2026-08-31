/**
 * Builds the two files needed to animate plate tectonics continuously, out of
 * the 200-odd per-time-step GeoJSON files that `download-paleocoastlines.ts`
 * fetches:
 *
 *   coastlines-present.geojson   present-day coastlines, each feature tagged
 *                                with the plate it rides on (`plateId`)
 *   rotations-<model>.json       per plate, the finite rotation from present
 *                                day back to each sampled age, as a quaternion
 *
 * Together they are ~3 MB against ~300 MB of snapshots, and — unlike snapshots
 * — they interpolate: slerp between two sampled quaternions and you have a
 * smooth time slider instead of a flipbook.
 *
 * The snapshots cannot be turned into this, which is why the geometry is
 * re-derived rather than reused: the GPlates Web Service strips *all* feature
 * properties from a reconstruction, so a downloaded step is a bag of anonymous
 * polygons with nothing to say which plate moved them. The plate assignment has
 * to be asked for separately, against present-day positions.
 *
 * ROTATION CONVENTION. A quaternion here is the *finite* rotation taking a
 * present-day position to its position at that age, in the model's absolute
 * reference frame (anchor plate 0) — not a stage rotation between consecutive
 * ages, and not relative to the plate's parent. So a position is reconstructed
 * with one rotation, and consecutive entries are directly interpolatable. At
 * age 0 every plate is the identity [1, 0, 0, 0]; the service also returns
 * identity for a plate that does not exist at a given age, which is why the
 * output records each plate's `validTo` (see below) rather than leaving the
 * caller to read "no rotation" as "no motion".
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadContinentLookup } from './lib/continent-lookup';

const SERVICE = 'https://gws.gplates.org';

/** Quaternion component precision. 1e-6 of a unit quaternion is ~6 mm on Earth. */
const QUAT_DECIMALS = 6;

/**
 * Features per plate-ID request.
 *
 * The assignment endpoint takes the geometry as a form field, so this is
 * bounded by request size rather than by count: 200 real coastline features are
 * 157 kB and succeed, 100 leaves room for a denser input.
 */
const ASSIGN_CHUNK = 100;

interface Options {
    model: string;
    step: number;
    from: number;
    to: number;
    inFile: string;
    outDir: string;
    timeoutMs: number;
    retries: number;
    precision: number;
    snapshotDir: string;
    skipValidTimes: boolean;
    countriesFile: string;
}

function usage(): void {
    console.log(`Build present-day coastlines plus a plate-rotation table.

  node scripts/run-ts.mjs scripts/build-paleorotations.ts [options]

  --model <name>    plate model                  (default MERDITH2021)
  --step <Ma>       rotation sampling interval    (default 5)
  --from <Ma>       youngest age                  (default 0)
  --to <Ma>         oldest age                    (default 1000)
  --in <file>       present-day coastlines        (default <out>/coastlines-0Ma.geojson,
                                                   fetched from the service if absent)
  --out <dir>       output directory              (default public/data/paleo/<model>)
  --timeout <ms>    per-request timeout           (default 120000)
  --retries <n>     retries per request           (default 3)
  --precision <n>   quaternion decimals           (default ${QUAT_DECIMALS})
  --snapshots <dir> per-age snapshots to read appearance ages from
                                                  (default alongside --in)
  --no-valid-times  skip the appearance-age pass
  --countries <f>   present-day country outlines, for naming continents
                                                  (default ${DEFAULT_COUNTRIES})

The sampling interval is not a resolution limit the way it is for snapshots:
rotations interpolate, so 5 Ma samples still give a continuous slider. It only
has to be fine enough that slerp between two samples does not cut a corner off
a plate's real path.`);
}

function parseArgs(argv: string[]): Options | null {
    const opts: Options = {
        model: 'MERDITH2021',
        step: 5,
        from: 0,
        to: 1000,
        inFile: '',
        outDir: '',
        timeoutMs: 120_000,
        retries: 3,
        precision: QUAT_DECIMALS,
        snapshotDir: '',
        skipValidTimes: false,
        countriesFile: DEFAULT_COUNTRIES,
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const value = () => {
            const v = argv[++i];
            if (v === undefined) throw new Error(`${arg} needs a value`);
            return v;
        };
        switch (arg) {
            case '--help': case '-h': return null;
            case '--model': opts.model = value(); break;
            case '--step': opts.step = Number(value()); break;
            case '--from': opts.from = Number(value()); break;
            case '--to': opts.to = Number(value()); break;
            case '--in': opts.inFile = value(); break;
            case '--out': opts.outDir = value(); break;
            case '--timeout': opts.timeoutMs = Number(value()); break;
            case '--retries': opts.retries = Number(value()); break;
            case '--precision': opts.precision = Number(value()); break;
            case '--snapshots': opts.snapshotDir = value(); break;
            case '--no-valid-times': opts.skipValidTimes = true; break;
            case '--countries': opts.countriesFile = value(); break;
            default: throw new Error(`unknown option ${arg}`);
        }
    }

    if (!(opts.step > 0)) throw new Error('--step must be positive');
    if (opts.from > opts.to) throw new Error('--from must not be older than --to');
    if (!opts.outDir) opts.outDir = path.join('public/data/paleo', opts.model.toLowerCase());
    if (!opts.inFile) opts.inFile = path.join(opts.outDir, 'coastlines-0Ma.geojson');
    if (!opts.snapshotDir) opts.snapshotDir = path.dirname(opts.inFile);
    return opts;
}

async function request(url: string, timeoutMs: number, retries: number, body?: URLSearchParams): Promise<string> {
    let lastError = '';
    for (let attempt = 0; attempt <= retries; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 2000 * attempt));
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                ...(body ? { method: 'POST', body } : {}),
            });
            const text = await response.text();
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.slice(0, 120)}`);
            // The service answers some bad requests with a 200 and an HTML error
            // page, so status alone does not prove this is data.
            if (!/^[[{]/.test(text.trim())) throw new Error(`not JSON: ${text.slice(0, 120)}`);
            return text;
        } catch (err) {
            lastError = err instanceof Error ? err.message : String(err);
        } finally {
            clearTimeout(timer);
        }
    }
    throw new Error(lastError);
}

interface Feature {
    type: 'Feature';
    properties?: Record<string, unknown> | null;
    geometry: unknown;
}
interface FeatureCollection {
    type: 'FeatureCollection';
    features: Feature[];
}

async function loadPresentDayCoastlines(opts: Options): Promise<FeatureCollection> {
    try {
        const text = await readFile(path.resolve(opts.inFile), 'utf8');
        console.log(`coastlines: ${opts.inFile}`);
        return JSON.parse(text) as FeatureCollection;
    } catch {
        const url = `${SERVICE}/reconstruct/coastlines/?time=0&model=${opts.model}`;
        console.log(`coastlines: ${opts.inFile} not found, fetching ${url}`);
        return JSON.parse(await request(url, opts.timeoutMs, opts.retries)) as FeatureCollection;
    }
}

/**
 * Tags every feature with the plate it belongs to.
 *
 * The endpoint answers with a bare array of plate IDs positionally matching the
 * features sent, so the chunks must be reassembled in order and a short answer
 * is a hard error rather than something to pad — a silent off-by-one here would
 * move whole coastlines onto the wrong continent.
 */
async function assignPlateIds(fc: FeatureCollection, opts: Options): Promise<number[]> {
    const url = `${SERVICE}/reconstruct/assign_geojson_plate_ids`;
    const ids: number[] = [];

    for (let start = 0; start < fc.features.length; start += ASSIGN_CHUNK) {
        const chunk = fc.features.slice(start, start + ASSIGN_CHUNK);
        const body = new URLSearchParams({
            model: opts.model,
            feature_collection: JSON.stringify({ type: 'FeatureCollection', features: chunk }),
        });
        const answer = JSON.parse(await request(url, opts.timeoutMs, opts.retries, body)) as number[];
        if (!Array.isArray(answer) || answer.length !== chunk.length) {
            throw new Error(`plate-id assignment returned ${Array.isArray(answer) ? answer.length : 'non-array'} for ${chunk.length} features`);
        }
        ids.push(...answer);
        process.stdout.write(`\r  assigned ${ids.length}/${fc.features.length}`);
    }
    process.stdout.write('\n');
    return ids;
}

type Quaternion = [number, number, number, number];
const IDENTITY: Quaternion = [1, 0, 0, 0];

function isIdentity(q: Quaternion): boolean {
    return q[0] === 1 && q[1] === 0 && q[2] === 0 && q[3] === 0;
}

function round(q: Quaternion, decimals: number): Quaternion {
    return q.map(v => Number(v.toFixed(decimals))) as Quaternion;
}

/**
 * Fetches the finite rotation of every plate at every sampled age.
 *
 * One request per age, with all plate IDs — not one request per plate — because
 * the answer is keyed by age and then by plate, so a batch stays unambiguous.
 * `group_by_pid=1` would halve the request count and is a trap: it returns each
 * plate's rotations as a bare array ordered by the *string* form of the ages, so
 * asking for 0,5,10 answers 0,10,5 and every rotation past 9 Ma silently lands
 * on the wrong age. Verified against the live service, not assumed.
 */
async function fetchRotations(
    plateIds: number[],
    ages: number[],
    opts: Options,
): Promise<Map<number, Quaternion[]>> {
    const pids = plateIds.join(',');
    const table = new Map<number, Quaternion[]>(plateIds.map(id => [id, []]));

    for (const age of ages) {
        const url = `${SERVICE}/rotation/get_quaternions?times=${age}&pids=${pids}&model=${opts.model}`;
        const answer = JSON.parse(await request(url, opts.timeoutMs, opts.retries)) as
            Record<string, Record<string, Quaternion>>;
        // Keyed by age as the service spells it ("100.0"), and there is only one.
        const byPlate = Object.values(answer)[0] ?? {};
        for (const id of plateIds) {
            table.get(id)!.push(round(byPlate[String(id)] ?? IDENTITY, opts.precision));
        }
        process.stdout.write(`\r  rotations at ${String(age).padStart(6)} Ma`);
    }
    process.stdout.write('\n');
    return table;
}

/**
 * The oldest age at which a plate still moves.
 *
 * The service returns the identity rotation both for "this plate has not moved"
 * and for "this plate does not exist yet", which are very different things for
 * an animation: the second means the feature should not be drawn at all. A
 * plate's entries are identity from some age onwards and stay that way, so the
 * last non-identity sample is where it stops being reconstructed. Reported per
 * plate so the renderer can hide a feature rather than freeze it in place.
 */
function validTo(quaternions: Quaternion[], ages: number[]): number {
    for (let i = quaternions.length - 1; i > 0; i--) {
        if (!isIdentity(quaternions[i])) return ages[i];
    }
    return ages[0];
}

/* ------------------------------------------------------------------ *
 * Continents
 * ------------------------------------------------------------------ */

/**
 * Present-day country outlines, used only to name a continent.
 *
 * The TopoJSON, not the GeoJSON of the same name: it is what
 * `scripts/prepare-country-data.sh` writes today, it is committed, and it is
 * clean. The GeoJSON is an uncommitted leftover of an earlier run of that
 * script whose Antarctic ring reaches +-657 degrees of longitude -- which made
 * its bounding box cover the planet and had the continent lookup answering
 * "Antarctica" a long way from it.
 */
const DEFAULT_COUNTRIES = 'public/data/world-countries-simplified.topojson';

/**
 * A point that stands for a whole coastline feature.
 *
 * The mean of its coordinates rather than a vertex: a vertex sits on the coast,
 * where "which country is this" is exactly the question a simplified outline
 * answers least reliably. Longitudes are averaged relative to the first one so
 * an island group either side of the date line does not average out into the
 * middle of the wrong ocean.
 */
function representativePoint(geometry: unknown): [number, number] | null {
    const points: number[][] = [];
    const walk = (node: unknown): void => {
        if (!Array.isArray(node) || node.length === 0) return;
        if (typeof node[0] === 'number') { points.push(node as number[]); return; }
        for (const child of node) walk(child);
    };
    walk((geometry as { coordinates?: unknown }).coordinates);
    if (points.length === 0) return null;

    const anchor = points[0][0];
    let sumLon = 0;
    let sumLat = 0;
    for (const [lon, lat] of points) {
        let d = lon - anchor;
        if (d > 180) d -= 360;
        else if (d < -180) d += 360;
        sumLon += d;
        sumLat += lat;
    }
    let lon = anchor + sumLon / points.length;
    if (lon > 180) lon -= 360;
    else if (lon < -180) lon += 360;
    return [lon, sumLat / points.length];
}

/* ------------------------------------------------------------------ *
 * Appearance ages
 * ------------------------------------------------------------------ */

/**
 * How close a rotated vertex must land to count as the same vertex, in km.
 *
 * Not a rounding tolerance: rotation reproduces a snapshot's coordinates to
 * well under a kilometre (measured: 93% of features inside 1 km at 20 Ma). The
 * slack is for the service's own dateline wrapping, which resamples a ring that
 * crosses the line and moves its vertices a little.
 */
const MATCH_TOLERANCE_KM = 25;

/** Grid cell for the vertex index, in degrees. Must exceed the tolerance. */
const CELL_DEGREES = 1;

const EARTH_RADIUS_KM = 6371;

type Vector = [number, number, number];

function toVector(lon: number, lat: number): Vector {
    const lo = (lon * Math.PI) / 180;
    const la = (lat * Math.PI) / 180;
    return [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
}

function toLonLat(v: Vector): [number, number] {
    return [
        (Math.atan2(v[1], v[0]) * 180) / Math.PI,
        (Math.asin(Math.max(-1, Math.min(1, v[2]))) * 180) / Math.PI,
    ];
}

/** Rotates a unit vector by a quaternion (v' = q v q*), written out to stay allocation-free. */
function rotate(q: Quaternion, v: Vector): Vector {
    const [w, x, y, z] = q;
    const tx = 2 * (y * v[2] - z * v[1]);
    const ty = 2 * (z * v[0] - x * v[2]);
    const tz = 2 * (x * v[1] - y * v[0]);
    return [
        v[0] + w * tx + (y * tz - z * ty),
        v[1] + w * ty + (z * tx - x * tz),
        v[2] + w * tz + (x * ty - y * tx),
    ];
}

/** Every coordinate of a GeoJSON geometry, at any nesting depth. */
function coordinatesOf(geometry: unknown): [number, number][] {
    const out: [number, number][] = [];
    const walk = (node: unknown): void => {
        if (!Array.isArray(node)) return;
        if (typeof node[0] === 'number') out.push([node[0], node[1] as number]);
        else for (const child of node) walk(child);
    };
    walk((geometry as { coordinates?: unknown }).coordinates);
    return out;
}

/**
 * Three vertices standing in for a whole feature.
 *
 * One is not enough: a feature that has died is tested against every *other*
 * coastline in the snapshot, and a single point near a neighbouring shore
 * (Panama against Colombia) reads as a match. Requiring three spread-out
 * vertices to land together makes a coincidence vanishingly unlikely, at a
 * third of the cost of comparing whole rings.
 */
function samplePoints(geometry: unknown): Vector[] {
    const coords = coordinatesOf(geometry);
    if (coords.length === 0) return [];
    const picks = [0, coords.length >> 1, coords.length - 1];
    return [...new Set(picks)].map(i => toVector(coords[i][0], coords[i][1]));
}

/**
 * Vertices of one snapshot, bucketed by whole degree of longitude and latitude
 * so a lookup touches a handful of points instead of the million-odd in the file.
 */
class VertexIndex {
    private readonly cells = new Map<string, Vector[]>();

    constructor(fc: FeatureCollection) {
        for (const feature of fc.features) {
            for (const [lon, lat] of coordinatesOf(feature.geometry)) {
                const key = VertexIndex.key(lon, lat);
                const cell = this.cells.get(key);
                if (cell) cell.push(toVector(lon, lat));
                else this.cells.set(key, [toVector(lon, lat)]);
            }
        }
    }

    private static key(lon: number, lat: number): string {
        return `${Math.floor(lon / CELL_DEGREES)}:${Math.floor(lat / CELL_DEGREES)}`;
    }

    /** True if any indexed vertex lies within the tolerance of `v`. */
    has(v: Vector): boolean {
        const [lon, lat] = toLonLat(v);
        const minCosine = Math.cos(MATCH_TOLERANCE_KM / EARTH_RADIUS_KM);
        for (let dLon = -1; dLon <= 1; dLon++) {
            for (let dLat = -1; dLat <= 1; dLat++) {
                // Wrapped so a lookup beside the date line still sees the cells
                // on the far side, where a rotated vertex very often lands.
                const cell = this.cells.get(
                    VertexIndex.key(((lon + dLon * CELL_DEGREES + 540) % 360) - 180, lat + dLat * CELL_DEGREES),
                );
                if (!cell) continue;
                for (const u of cell) {
                    if (u[0] * v[0] + u[1] * v[1] + u[2] * v[2] >= minCosine) return true;
                }
            }
        }
        return false;
    }
}

/**
 * The oldest age at which each feature still exists.
 *
 * A coastline is not eternal: the Galapagos are ~4 Ma old and the Isthmus of
 * Panama closed ~3 Ma, so GPlates simply omits those features from an older
 * reconstruction. That birth age lives in the model's own feature attributes,
 * which the web service strips from everything it returns — but the downloaded
 * per-age snapshots record it implicitly, by containing the feature or not, and
 * they are already on disk. So the ages are recovered by rotating each feature
 * to each age and asking whether the snapshot for that age has it.
 *
 * Without this a feature that does not exist yet does not vanish, it drifts:
 * an animation of 200 Ma would show the Galapagos riding the Pacific.
 *
 * Scanning stops at a feature's first absence — features appear going forward
 * in time and do not come back — which is also what keeps the pass affordable.
 */
async function deriveAppearanceAges(
    tagged: FeatureCollection,
    rotations: Map<number, Quaternion[]>,
    ages: number[],
    opts: Options,
): Promise<(number | null)[]> {
    let files: string[];
    try {
        files = await readdir(opts.snapshotDir);
    } catch {
        console.log(`  no snapshots at ${opts.snapshotDir}, skipping appearance ages`);
        return tagged.features.map(() => null);
    }

    const samples = tagged.features.map(f => samplePoints(f.geometry));
    const appearance: (number | null)[] = tagged.features.map(() => null);
    const alive = new Set(tagged.features.map((_, i) => i));
    let scanned = 0;

    for (let ageIndex = 0; ageIndex < ages.length && alive.size > 0; ageIndex++) {
        const age = ages[ageIndex];
        const label = Number.isInteger(age) ? String(age) : String(Number(age.toFixed(3)));
        const name = files.find(f => f.endsWith(`-${label}Ma.geojson`));
        if (!name) continue;

        const snapshot = JSON.parse(
            await readFile(path.join(opts.snapshotDir, name), 'utf8'),
        ) as FeatureCollection;
        const index = new VertexIndex(snapshot);
        scanned++;

        for (const i of [...alive]) {
            const q = rotations.get(tagged.features[i].properties?.plateId as number);
            const points = samples[i];
            const present = q !== undefined && points.length > 0
                && points.every(p => index.has(rotate(q[ageIndex], p)));
            if (present) appearance[i] = age;
            else alive.delete(i);
        }
        process.stdout.write(`\r  appearance ages: ${label} Ma, ${alive.size} features still present`);
    }
    process.stdout.write('\n');
    if (scanned === 0) console.log(`  no snapshot files matched in ${opts.snapshotDir}`);
    return appearance;
}

async function main(): Promise<void> {
    let options: Options | null;
    try {
        options = parseArgs(process.argv.slice(2));
    } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        process.exitCode = 1;
        return;
    }
    if (!options) return usage();
    const opts = options;

    const outDir = path.resolve(process.cwd(), opts.outDir);
    await mkdir(outDir, { recursive: true });

    const ages: number[] = [];
    for (let age = opts.from; age <= opts.to + 1e-9; age += opts.step) {
        ages.push(Number(age.toFixed(6)));
    }
    console.log(`${opts.model}: ${ages.length} ages, ${opts.from}-${opts.to} Ma every ${opts.step} Ma`);
    console.log(`-> ${outDir}\n`);

    const fc = await loadPresentDayCoastlines(opts);
    console.log(`  ${fc.features.length} features`);

    const ids = await assignPlateIds(fc, opts);
    const tagged: FeatureCollection = {
        type: 'FeatureCollection',
        features: fc.features.map((feature, i) => ({
            type: 'Feature',
            properties: { ...(feature.properties ?? {}), plateId: ids[i] },
            geometry: feature.geometry,
        })),
    };
    const plateIds = [...new Set(ids)].sort((a, b) => a - b);
    console.log(`  ${plateIds.length} distinct plates`);

    try {
        const lookup = await loadContinentLookup(path.resolve(opts.countriesFile));
        if (lookup.unmapped.length > 0) {
            console.log(`  countries with no continent in the table: ${lookup.unmapped.join(', ')}`);
        }
        const tally = new Map<string, number>();
        for (const feature of tagged.features) {
            const point = representativePoint(feature.geometry);
            const continent = point ? lookup.at(point[0], point[1]) : null;
            if (continent === null) continue;
            feature.properties!.continent = continent;
            tally.set(continent, (tally.get(continent) ?? 0) + 1);
        }
        const named = [...tally].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`);
        console.log(`  continents: ${named.join(', ')}`);
    } catch (err) {
        // A colour is not worth failing a long run over: the layer still
        // animates, it just draws in one colour.
        console.log(`  could not name continents (${err instanceof Error ? err.message : String(err)})`);
    }
    console.log('');

    const table = await fetchRotations(plateIds, ages, opts);

    if (!opts.skipValidTimes) {
        const appearance = await deriveAppearanceAges(tagged, table, ages, opts);
        for (let i = 0; i < tagged.features.length; i++) {
            // Recorded even when it is the whole range, so a consumer can tell
            // "exists throughout" from "this pass never ran".
            if (appearance[i] !== null) tagged.features[i].properties!.fromAge = appearance[i];
        }
        const young = appearance.filter(a => a !== null && a < ages[ages.length - 1]).length;
        console.log(`  ${young} features appear after ${ages[ages.length - 1]} Ma`);
    }

    const geometryFile = path.join(outDir, 'coastlines-present.geojson');
    await writeFile(geometryFile, JSON.stringify(tagged));

    const rotations: Record<string, Quaternion[]> = {};
    const validity: Record<string, number> = {};
    for (const id of plateIds) {
        const quaternions = table.get(id)!;
        rotations[id] = quaternions;
        validity[id] = validTo(quaternions, ages);
    }

    const rotationFile = path.join(outDir, `rotations-${opts.model.toLowerCase()}.json`);
    await writeFile(rotationFile, JSON.stringify({
        model: opts.model,
        source: `${SERVICE}/rotation/get_quaternions`,
        // Absolute finite rotations from present day, anchor plate 0; see the
        // rotation convention note at the top of this file.
        convention: 'finite rotation from present day to age, quaternion [w, x, y, z], anchor plate 0',
        ages,
        validTo: validity,
        rotations,
    }));

    const sizeOf = async (file: string) =>
        `${(Buffer.byteLength(await readFile(file, 'utf8')) / 1e6).toFixed(2)} MB`;
    console.log(`\n${path.basename(geometryFile)}  ${await sizeOf(geometryFile)}`);
    console.log(`${path.basename(rotationFile)}  ${await sizeOf(rotationFile)}`);
}

void main();
