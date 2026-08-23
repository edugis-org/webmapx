/**
 * Writes the day/twilight/night bands, and the sun's position, as GeoJSON.
 *
 * The same arithmetic the app runs (`src/utils/solar.ts`), on the command line,
 * for a configuration that wants the bands as a file rather than as something
 * computed in the browser — a story fixed to one moment, or a printed map.
 *
 *   npm run generate:daynight -- --out public/data
 *   npm run generate:daynight -- --at 2024-06-21T12:00:00Z --out /tmp
 *
 * Run without `--out` it prints a summary and writes nothing.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { DAYLIGHT_BANDS, daylightBands, subsolarPoint, sunPositionFeature } from '../src/utils/solar';

interface Options {
    at: Date;
    out: string | null;
    steps: number;
    pretty: boolean;
}

function parseArgs(argv: string[]): Options {
    const options: Options = { at: new Date(), out: null, steps: 720, pretty: false };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--help' || arg === '-h') {
            console.log(`Usage: npm run generate:daynight -- [options]

  --at <iso>     The moment to draw, e.g. 2024-06-21T12:00:00Z. Default: now.
  --out <dir>    Where to write day-night.geojson and sun-position.geojson.
                 Without it nothing is written.
  --pretty       Indent the JSON. Costs about three times the bytes.
  --help         This.`);
            process.exit(0);
        }
        if (arg === '--at') {
            const value = new Date(argv[++i] ?? '');
            if (Number.isNaN(value.getTime())) throw new Error(`--at is not a date: ${argv[i]}`);
            options.at = value;
            continue;
        }
        if (arg === '--out') { options.out = argv[++i] ?? null; continue; }
        if (arg === '--pretty') { options.pretty = true; continue; }
    }
    return options;
}

async function main(): Promise<void> {
    const options = parseArgs(process.argv.slice(2));
    const sun = subsolarPoint(options.at);
    const bands = daylightBands(options.at);
    const position = sunPositionFeature(options.at);

    console.log(`Sun at ${options.at.toISOString()}`);
    console.log(`  overhead at ${sun.lon.toFixed(3)}, ${sun.lat.toFixed(3)}`);
    console.log(`  declination ${sun.declination.toFixed(3)}°, equation of time ${sun.equationOfTime.toFixed(2)} min`);
    for (const feature of bands.features) {
        const geometry = feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
        const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat();
        const points = rings.reduce((sum, ring) => sum + ring.length, 0);
        const band = DAYLIGHT_BANDS.find((entry) => entry.id === feature.properties?.id);
        console.log(`  ${String(band?.description).padEnd(22)} ${geometry.type.padEnd(12)}`
            + ` ${String(rings.length).padStart(2)} ring(s), ${String(points).padStart(5)} points`);
    }

    if (!options.out) {
        console.log('\nNothing written (pass --out <dir>).');
        return;
    }
    await mkdir(options.out, { recursive: true });
    const indent = options.pretty ? 2 : 0;
    const files: Array<[string, unknown]> = [
        ['day-night.geojson', bands],
        ['sun-position.geojson', position],
    ];
    for (const [name, data] of files) {
        const file = path.join(options.out, name);
        await writeFile(file, JSON.stringify(data, null, indent));
        console.log(`Wrote ${file}`);
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
