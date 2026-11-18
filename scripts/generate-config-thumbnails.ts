/**
 * Bakes a thumbnail for configs listed in the config repository's index.json, for
 * the setup page's "Open a config" gallery. Usually you want `npm run configs:index`
 * instead, which also adds new configs to the index and only re-captures what
 * changed; this one re-captures whatever you name, e.g. after a basemap changed
 * upstream and the config itself did not.
 *
 * Like layer swatches (generate-layer-swatches.ts), this is done up front rather than
 * in the browser: rendering a dozen maps when someone opens a gallery would be slow,
 * and would fire requests at third-party tile hosts for maps nobody chose to open.
 *
 *   npm run dev                                  # in another terminal
 *   npm run generate:config-thumbnails -- --help
 *
 * Dry run unless --write.
 */

import path from 'node:path';
import {
    CAPTURE_DEFAULTS, assertDevServer, captureThumbnails, describeResult, readIndex, writeIndex,
    type CaptureOptions,
} from './lib/config-thumbnails';

const HELP = `Usage: npm run generate:config-thumbnails -- [options]

Captures configs in <configs-dir>/index.json through a running dev server and stores
a WebP thumbnail per config in <configs-dir>/thumbnails/. To add new configs to the
index and refresh only what changed, use "npm run configs:index" instead.

Options:
  --configs-dir <dir>   Config repository checkout (default: public/config)
  --base-url <url>      Running dev server (default: ${CAPTURE_DEFAULTS.baseUrl})
  --only <file,...>     Only these configs, e.g. --only nl.json,demo.json
  --wait <ms>           Settle time after the page goes quiet (default: ${CAPTURE_DEFAULTS.waitMs})
  --width <px>          Thumbnail width; height follows 16:10 (default: ${CAPTURE_DEFAULTS.width})
  --quality <0-1>       WebP quality (default: ${CAPTURE_DEFAULTS.quality})
  --write               Write thumbnails and index.json (default: dry run)
  --help                Show this help`;

function parseArgs(argv: string[]): (CaptureOptions & { only: string[]; write: boolean }) | null {
    const opts = { configsDir: 'public/config', ...CAPTURE_DEFAULTS, only: [] as string[], write: false };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const next = () => {
            const v = argv[++i];
            if (v === undefined) throw new Error(`${arg} needs a value`);
            return v;
        };
        switch (arg) {
            case '--help': return null;
            case '--configs-dir': opts.configsDir = next(); break;
            case '--base-url': opts.baseUrl = next().replace(/\/$/, ''); break;
            case '--only': opts.only = next().split(',').map(s => s.trim()).filter(Boolean); break;
            case '--wait': opts.waitMs = Number(next()); break;
            case '--width': opts.width = Number(next()); break;
            case '--quality': opts.quality = Number(next()); break;
            case '--write': opts.write = true; break;
            default: throw new Error(`Unknown option ${arg} (see --help)`);
        }
    }
    return opts;
}

async function main(): Promise<void> {
    const opts = parseArgs(process.argv.slice(2));
    if (!opts) { console.log(HELP); return; }

    const indexPath = path.join(path.resolve(opts.configsDir), 'index.json');
    const index = await readIndex(indexPath);
    const targets = index.configs.filter(c => !opts.only.length || opts.only.includes(c.file));
    if (!targets.length) { console.log('Nothing to do.'); return; }

    await assertDevServer(opts.baseUrl);
    const results = await captureThumbnails(opts, targets, opts.write, r => console.log(describeResult(r)));
    const failed = results.filter(r => r.failed).length;

    if (opts.write) {
        await writeIndex(indexPath, index);
        console.log(`\nWrote ${results.length - failed} thumbnail(s) and updated index.json.`);
    } else {
        console.log('\nDry run — pass --write to save thumbnails and update index.json.');
    }
    if (failed) process.exitCode = 1;
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
