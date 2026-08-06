/**
 * CLI: print the geographic extent of one or more Allmaps georeference
 * annotations, ready to paste into a layer's `metadata.bounds`.
 *
 *   npm run allmaps:bounds -- https://annotations.allmaps.org/maps/<id>
 *
 * The computation lives in ./lib/allmaps-bounds so it can be unit-tested
 * without this file's top-level `await main()` running on import.
 */

import { boundsFromAnnotation, roundBounds } from './lib/allmaps-bounds';

async function main(): Promise<void> {
    const urls = process.argv.slice(2);
    if (urls.length === 0) {
        console.error('Usage: npm run allmaps:bounds -- <annotation-url> [...]');
        process.exitCode = 1;
        return;
    }

    for (const url of urls) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
            if (!res.ok) {
                console.error(`${url}\n  HTTP ${res.status}`);
                process.exitCode = 1;
                continue;
            }

            const bounds = boundsFromAnnotation(await res.json());
            if (!bounds) {
                console.error(`${url}\n  no georeferenced maps found`);
                process.exitCode = 1;
                continue;
            }

            console.log(`${url}\n  "bounds": [${roundBounds(bounds).join(', ')}]`);
        } catch (err) {
            console.error(`${url}\n  ${err instanceof Error ? err.message : String(err)}`);
            process.exitCode = 1;
        }
    }
}

await main();
