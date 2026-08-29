/**
 * Downloads plate boundaries — including the deforming networks — one file per
 * age, for `internalfunc://paleo-plates` to draw.
 *
 * This is deliberately NOT the treatment the coastlines get. A coastline rides
 * one plate, so a rotation table plus slerp reconstructs it at any moment and
 * animates smoothly. A plate *boundary* has no such continuity: boundaries are
 * born, die, jump and change how many there are, so the set of features at
 * 60 Ma is not the set at 50 Ma moved a little. There is nothing to interpolate,
 * and a snapshot per step is the honest representation.
 *
 * The step is therefore a real resolution limit here, unlike for the
 * coastlines, and 10 Ma is the compromise this data supports: the collision
 * that builds the Himalaya plays out over ~50 Ma, so 10 Ma steps show it
 * beginning, deforming and locking, at 4.6 MB for the whole 250 Ma. Halving the
 * step doubles the bytes for motion that is still a jump.
 *
 * MULLER2019 is the model worth fetching. Its topologies carry the deforming
 * networks — `Greater_India_East_Mesh`, `Alpine_Deforming_Mesh` — where
 * MERDITH2021 offers plate boundaries alone: 119 features against 46 at
 * present, and the difference is exactly the deformation.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SERVICE = 'https://gws.gplates.org/topology/plate_polygons/';

/** Properties worth keeping: what a feature is, what it is called, its plate. */
const KEEP = new Set(['name', 'type', 'pid']);

/**
 * Coordinate decimals.
 *
 * Two is about a kilometre, which is finer than a plate boundary is known and
 * far finer than any view of a whole world resolves. It takes a step from
 * 269 kB to 195 kB, and gzip from 89 kB to 61 kB.
 */
const DECIMALS = 2;

interface Options {
    model: string;
    from: number;
    to: number;
    step: number;
    out: string;
    timeout: number;
    retries: number;
}

function usage(): void {
    console.log(`Download plate boundaries per age.

  node scripts/run-ts.mjs scripts/build-plate-topologies.ts [options]

  --model <name>   plate model                 (default MULLER2019)
  --from <Ma>      youngest age                (default 0)
  --to <Ma>        oldest age                  (default 250)
  --step <Ma>      interval                    (default 10)
  --out <dir>      output directory            (default public/config/data/paleo/<model>/plates)
  --timeout <ms>   per request                 (default 120000)
  --retries <n>    per request                 (default 3)

MULLER2019 is the only model here that carries deforming networks; the others
return plate boundaries alone.`);
}

function parseArgs(argv: string[]): Options | null {
    const options: Options = {
        model: 'MULLER2019', from: 0, to: 250, step: 10,
        out: '', timeout: 120_000, retries: 3,
    };
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        const value = argv[i + 1];
        if (arg === '-h' || arg === '--help') return null;
        else if (arg === '--model') { options.model = value; i += 1; }
        else if (arg === '--from') { options.from = Number(value); i += 1; }
        else if (arg === '--to') { options.to = Number(value); i += 1; }
        else if (arg === '--step') { options.step = Number(value); i += 1; }
        else if (arg === '--out') { options.out = value; i += 1; }
        else if (arg === '--timeout') { options.timeout = Number(value); i += 1; }
        else if (arg === '--retries') { options.retries = Number(value); i += 1; }
        else { console.error(`Unknown option: ${arg}`); return null; }
    }
    options.out ||= path.join('public', 'config', 'data', 'paleo', options.model.toLowerCase(), 'plates');
    return options;
}

type Coordinates = number | number[] | number[][] | number[][][] | number[][][][];

function round(value: Coordinates): Coordinates {
    if (typeof value === 'number') return Number(value.toFixed(DECIMALS));
    return (value as Coordinates[]).map(round) as Coordinates;
}

async function fetchAge(options: Options, age: number): Promise<GeoJSON.FeatureCollection> {
    const url = `${SERVICE}?time=${age}&model=${options.model}`;
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= options.retries; attempt += 1) {
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(options.timeout) });
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
            return await response.json() as GeoJSON.FeatureCollection;
        } catch (error) {
            lastError = error;
            // The service is one academic server; a failed step is usually load,
            // so back off rather than hammering it.
            if (attempt < options.retries) await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        }
    }
    throw new Error(`${age} Ma: ${String(lastError)}`);
}

function slim(collection: GeoJSON.FeatureCollection, age: number): GeoJSON.FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: collection.features.map((feature) => {
            const source = (feature.properties ?? {}) as Record<string, unknown>;
            const properties: Record<string, unknown> = { ma: age };
            for (const [key, value] of Object.entries(source)) if (KEEP.has(key)) properties[key] = value;
            // A deforming network is the point of this layer, so say so plainly
            // rather than leaving it in a gpml: type string.
            properties.deforming = String(source.type ?? '').endsWith('TopologicalNetwork');
            return {
                type: 'Feature',
                properties,
                geometry: {
                    ...feature.geometry,
                    coordinates: round((feature.geometry as { coordinates: Coordinates }).coordinates),
                },
            } as GeoJSON.Feature;
        }),
    };
}

const options = parseArgs(process.argv.slice(2));
if (!options) {
    usage();
    process.exitCode = 2;
} else {
    await mkdir(options.out, { recursive: true });

    const ages: number[] = [];
    for (let age = options.from; age <= options.to; age += options.step) ages.push(age);

    console.log(`${options.model}: ${ages.length} ages, ${options.from}-${options.to} Ma every ${options.step} Ma`);
    console.log(`-> ${options.out}\n`);

    let total = 0;
    for (const age of ages) {
        const raw = await fetchAge(options, age);
        const doc = slim(raw, age);
        const body = JSON.stringify(doc);
        await writeFile(path.join(options.out, `plates-${String(age).padStart(4, '0')}.geojson`), body);
        total += body.length;
        const deforming = doc.features.filter((f) => (f.properties as Record<string, unknown>)?.deforming).length;
        console.log(`  ${String(age).padStart(4)} Ma  ${String(doc.features.length).padStart(3)} features`
            + `  ${String(deforming).padStart(3)} deforming  ${(body.length / 1024).toFixed(0)} kB`);
    }

    // The index is what the map reads first: it says which ages exist, so the
    // renderer can pick the nearest without probing for files that are not there.
    await writeFile(
        path.join(options.out, 'plates-index.json'),
        `${JSON.stringify({ model: options.model, step: options.step, ages }, null, 2)}\n`,
    );

    console.log(`\n${ages.length} files, ${(total / 1048576).toFixed(1)} MB, plus plates-index.json`);
}

export {};
