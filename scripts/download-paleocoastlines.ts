/**
 * Downloads reconstructed palaeo-coastlines, one GeoJSON file per time step.
 *
 * The data comes from the GPlates Web Service (gws.gplates.org), run by
 * EarthByte at the University of Sydney: a plate-motion model turned into
 * geometry on request, so `?time=100` returns the world's coastlines as they
 * are reconstructed for 100 million years ago.
 *
 * It is fetched once and stored rather than called from the map, for three
 * reasons measured against the live service: a single step is ~2 MB and takes
 * ~6 s, which no time slider can wait for; the service sends no caching
 * headers, so every viewer would pay that again; and it is an academic server
 * that should not carry a classroom's traffic.
 *
 * A step of 5 Ma is the default because it is what the data supports. The
 * service interpolates continuously between the model's rotation poles, so any
 * fractional time is *accepted* but carries no extra information — the poles
 * themselves are typically 5–10 Ma apart. Measured on MERDITH2021 at 100 Ma, a
 * 5 Ma step moves a coastline 217 km on average (max 313 km), which still reads
 * as a smooth animation, while 1 Ma moves it 43 km and costs five times the
 * storage for motion below a pixel at world scale.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * How far back each model actually reconstructs, in Ma.
 *
 * This is a hard limit and not a formality. The service does NOT refuse an age
 * past a model's range: asking CAO2024 for 2500 Ma returns HTTP 200 with fewer
 * features (1800 Ma → 624, 2500 → 475, 4000 → 48) and moved coordinates. That
 * is the residue of whichever plates happen to have a rotation defined that far
 * back, not a reconstruction, and it would be indistinguishable from real data
 * once it is sitting in a folder of files.
 *
 * Nothing reconstructs the whole of Earth history: the oldest ocean floor is
 * ~180 Ma and everything before that is inferred from continental rock, which
 * runs out. 1800 Ma is the far end of what anyone claims.
 */
const MODEL_RANGE: Record<string, number> = {
    CAO2024: 1800,
    MERDITH2021: 1000,
    MULLER2022: 1000,
    PALEOMAP: 750,
    TorsvikCocks2017: 540,
    GOLONKA: 550,
    MULLER2019: 250,
    MULLER2016: 230,
    SETON2012: 200,
    MATTHEWS2016_mantle_ref: 410,
    MATTHEWS2016_pmag_ref: 410,
    ZAHIROVIC2022: 410,
    CLENNETT2020: 170,
    ALFONSO2024: 170,
};

const SERVICE = 'https://gws.gplates.org/reconstruct';

interface Options {
    model: string;
    step: number;
    from: number;
    to: number;
    layer: string;
    outDir: string;
    timeoutMs: number;
    retries: number;
    force: boolean;
}

function usage(): void {
    console.log(`Download reconstructed palaeo-coastlines, one file per time step.

  node scripts/run-ts.mjs scripts/download-paleocoastlines.ts [options]

  --model <name>    plate model                (default MERDITH2021)
  --step <Ma>       time step                  (default 5)
  --from <Ma>       youngest age               (default 0)
  --to <Ma>         oldest age                 (default the model's limit)
  --layer <name>    coastlines | static_polygons | topologies  (default coastlines)
  --out <dir>       output directory           (default public/data/paleo)
  --timeout <ms>    per-request timeout        (default 120000)
  --retries <n>     retries per step           (default 3)
  --force           re-download existing files

Models and how far back they reconstruct:
${Object.entries(MODEL_RANGE).map(([m, r]) => `  ${m.padEnd(26)} 0-${r} Ma`).join('\n')}`);
}

function parseArgs(argv: string[]): Options | null {
    const opts: Options = {
        model: 'MERDITH2021',
        step: 5,
        from: 0,
        to: NaN,
        layer: 'coastlines',
        outDir: 'public/data/paleo',
        timeoutMs: 120_000,
        retries: 3,
        force: false,
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
            case '--layer': opts.layer = value(); break;
            case '--out': opts.outDir = value(); break;
            case '--timeout': opts.timeoutMs = Number(value()); break;
            case '--retries': opts.retries = Number(value()); break;
            case '--force': opts.force = true; break;
            default: throw new Error(`unknown option ${arg}`);
        }
    }

    const limit = MODEL_RANGE[opts.model];
    if (limit === undefined) {
        throw new Error(`unknown model ${opts.model} — one of ${Object.keys(MODEL_RANGE).join(', ')}`);
    }
    if (Number.isNaN(opts.to)) opts.to = limit;
    if (opts.to > limit) {
        // Refused rather than clamped: an age past the range comes back as a
        // successful-looking file of nonsense, so silently narrowing the request
        // would hide the very thing worth knowing.
        throw new Error(`${opts.model} only reconstructs to ${limit} Ma; --to ${opts.to} would download fabricated geometry`);
    }
    if (!(opts.step > 0)) throw new Error('--step must be positive');
    if (opts.from > opts.to) throw new Error('--from must not be older than --to');
    return opts;
}

/** `0`, `5`, `12.5` — a filename that sorts and reads as an age. */
function ageLabel(age: number): string {
    return Number.isInteger(age) ? String(age) : String(Number(age.toFixed(3)));
}

async function fetchStep(url: string, timeoutMs: number): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal });
        const body = await response.text();
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${body.slice(0, 120)}`);
        // The service answers an out-of-range age with a 200 and a plain-text
        // message, so status alone does not prove this is geometry.
        if (!body.startsWith('{')) throw new Error(`not JSON: ${body.slice(0, 120)}`);
        return body;
    } finally {
        clearTimeout(timer);
    }
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

    const outDir = path.resolve(process.cwd(), options.outDir, options.model.toLowerCase());
    await mkdir(outDir, { recursive: true });

    const ages: number[] = [];
    for (let age = options.from; age <= options.to + 1e-9; age += options.step) {
        ages.push(Number(age.toFixed(6)));
    }

    console.log(`${options.model} ${options.layer}: ${ages.length} steps, ${options.from}-${options.to} Ma every ${options.step} Ma`);
    console.log(`-> ${outDir}\n`);

    const started = Date.now();
    let downloaded = 0;
    let skipped = 0;
    let bytes = 0;
    const failed: number[] = [];

    for (const age of ages) {
        const file = path.join(outDir, `${options.layer}-${ageLabel(age)}Ma.geojson`);

        if (!options.force) {
            // Resume rather than restart: this is hundreds of requests against
            // someone else's server, and a run interrupted at step 150 should
            // not ask for the first 150 again.
            try {
                const existing = await readFile(file, 'utf8');
                if (existing.startsWith('{')) {
                    skipped++;
                    bytes += Buffer.byteLength(existing);
                    continue;
                }
            } catch { /* not there yet */ }
        }

        const url = `${SERVICE}/${options.layer}/?time=${age}&model=${options.model}`;
        let lastError = '';
        let body: string | null = null;

        for (let attempt = 0; attempt <= options.retries && body === null; attempt++) {
            if (attempt > 0) await new Promise(r => setTimeout(r, 2000 * attempt));
            try {
                body = await fetchStep(url, options.timeoutMs);
            } catch (err) {
                lastError = err instanceof Error ? err.message : String(err);
            }
        }

        if (body === null) {
            failed.push(age);
            console.log(`  ✗ ${ageLabel(age).padStart(6)} Ma  ${lastError}`);
            continue;
        }

        await writeFile(file, body);
        downloaded++;
        bytes += Buffer.byteLength(body);
        const features = (body.match(/"type": ?"Feature"/g) ?? []).length;
        console.log(`  ✓ ${ageLabel(age).padStart(6)} Ma  ${(Buffer.byteLength(body) / 1e6).toFixed(2)} MB  ${features} features`);
    }

    const minutes = (Date.now() - started) / 60000;
    console.log(`\n${downloaded} downloaded, ${skipped} already present, ${failed.length} failed`);
    console.log(`${(bytes / 1e6).toFixed(0)} MB total in ${minutes.toFixed(1)} min`);
    if (failed.length > 0) {
        console.log(`failed ages: ${failed.map(ageLabel).join(', ')} — run again to retry just those`);
        process.exitCode = 1;
    }
}

void main();
