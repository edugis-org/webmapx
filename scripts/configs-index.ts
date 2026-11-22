/**
 * Keeps the config repository's index.json — the list the setup page's Open menu
 * and gallery offer — in step with the configs actually in the repository.
 *
 *   npm run dev            # in another terminal, for thumbnails
 *   npm run configs:index
 *
 * index.json stays the place where people decide what is offered and how it reads:
 * its order, titles and descriptions are never rewritten. This command only
 *   - adds a config that is in the repository but not in the index (at the end,
 *     titled from its own `project.title` / `project.description`),
 *   - drops an entry whose file is gone, and deletes thumbnails no entry uses,
 *   - leaves out anything in the index's `exclude` list, or whose config says
 *     `"project": { "listed": false }`,
 *   - captures a thumbnail for every entry that has none, or whose config changed
 *     since its thumbnail was made (`thumbnailOf` holds a hash of the config, not a
 *     date: a fresh clone gives every file the same date).
 * and lists entries whose wording would show badly in the gallery.
 *
 * Without a dev server the index is still updated; the thumbnails it could not make
 * are reported, and the gallery shows a placeholder until the next run.
 */

import { readdir, readFile, access, rm } from 'node:fs/promises';
import path from 'node:path';
import {
    CAPTURE_DEFAULTS, assertDevServer, captureThumbnails, configHash, describeResult,
    formatIndex, readIndex, writeIndex, type ConfigIndex, type IndexEntry,
} from './lib/config-thumbnails';

/** JSON files beside the configs that are not configs (mirrors the configs repo's validate.mjs). */
const NOT_A_CONFIG = new Set(['package.json', 'package-lock.json', 'apikeys.json', 'apikeys.example.json', 'configs.lock', 'index.json']);

/** Descriptions that say nothing about the map, from bulk conversions. */
const UNINFORMATIVE_DESCRIPTIONS = new Set(['converted from an edugis map configuration.']);

const HELP = `Usage: npm run configs:index -- [options]

Adds new configs to <configs-dir>/index.json, drops removed ones, and captures
thumbnails for new or changed configs (needs "npm run dev" running).

Options:
  --configs-dir <dir>   Config repository checkout (default: public/config)
  --base-url <url>      Running dev server (default: ${CAPTURE_DEFAULTS.baseUrl})
  --no-thumbnails       Update the index only
  --check               Change nothing; exit 1 if the index is out of date
  --help                Show this help`;

interface Options { configsDir: string; baseUrl: string; thumbnails: boolean; check: boolean }

function parseArgs(argv: string[]): Options | null {
    const opts: Options = { configsDir: 'public/config', baseUrl: CAPTURE_DEFAULTS.baseUrl, thumbnails: true, check: false };
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
            case '--no-thumbnails': opts.thumbnails = false; break;
            case '--check': opts.check = true; break;
            default: throw new Error(`Unknown option ${arg} (see --help)`);
        }
    }
    return opts;
}

interface FoundConfig { file: string; text: string; config: Record<string, any> }

async function findConfigs(dir: string): Promise<{ found: FoundConfig[]; unreadable: string[] }> {
    const found: FoundConfig[] = [];
    const unreadable: string[] = [];
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
        if (!e.isFile() || !e.name.endsWith('.json') || NOT_A_CONFIG.has(e.name)) continue;
        const text = await readFile(path.join(dir, e.name), 'utf8');
        let config: unknown;
        try { config = JSON.parse(text); } catch { unreadable.push(e.name); continue; }
        // A config is something with a map; anything else here is not ours to list.
        if (config && typeof config === 'object' && 'map' in config) found.push({ file: e.name, text, config: config as Record<string, any> });
    }
    found.sort((a, b) => a.file.localeCompare(b.file));
    return { found, unreadable };
}

async function exists(p: string): Promise<boolean> {
    try { await access(p); return true; } catch { return false; }
}

function wordingProblems(entry: IndexEntry): string[] {
    const problems: string[] = [];
    const base = entry.file.replace(/\.json$/i, '');
    const title = (entry.title ?? '').trim();
    if (!title || title === base || title.toLowerCase() === 'layers') problems.push(`title "${title || '(none)'}"`);
    const description = (entry.description ?? '').trim();
    if (!description) problems.push('no description');
    else if (UNINFORMATIVE_DESCRIPTIONS.has(description.toLowerCase())) problems.push(`description "${description}"`);
    return problems;
}

async function main(): Promise<void> {
    const opts = parseArgs(process.argv.slice(2));
    if (!opts) { console.log(HELP); return; }

    const configsDir = path.resolve(opts.configsDir);
    const indexPath = path.join(configsDir, 'index.json');
    const index: ConfigIndex = (await exists(indexPath))
        ? await readIndex(indexPath)
        : { description: 'The configs offered by the setup page\'s Open menu, in this order.', exclude: [], configs: [] };
    const before = formatIndex(index);

    const { found, unreadable } = await findConfigs(configsDir);
    const byFile = new Map(found.map(f => [f.file, f]));
    const excluded = new Set(index.exclude ?? []);
    for (const f of found) if (f.config.project?.listed === false) excluded.add(f.file);

    // Drop what is gone or excluded; keep everything else exactly as written.
    const dropped: string[] = [];
    index.configs = index.configs.filter(entry => {
        const keep = byFile.has(entry.file) && !excluded.has(entry.file);
        if (!keep) dropped.push(entry.file);
        return keep;
    });

    // Add what is new, at the end, worded from the config itself.
    const listed = new Set(index.configs.map(e => e.file));
    const added: IndexEntry[] = [];
    for (const f of found) {
        if (listed.has(f.file) || excluded.has(f.file)) continue;
        const project = f.config.project ?? {};
        const description = typeof project.description === 'string' ? project.description.trim() : '';
        const entry: IndexEntry = {
            file: f.file,
            title: (typeof project.title === 'string' && project.title.trim()) || f.file.replace(/\.json$/i, ''),
            description: UNINFORMATIVE_DESCRIPTIONS.has(description.toLowerCase()) ? '' : description,
        };
        index.configs.push(entry);
        added.push(entry);
    }

    // Thumbnails. An existing thumbnail made before hashes were recorded is taken to be
    // of the config as it is now — the alternative is re-capturing every config once.
    const stale: IndexEntry[] = [];
    for (const entry of index.configs) {
        const hash = configHash(byFile.get(entry.file)!.text);
        const has = entry.thumbnail && await exists(path.join(configsDir, entry.thumbnail));
        if (has && !entry.thumbnailOf) entry.thumbnailOf = hash;
        if (!has || entry.thumbnailOf !== hash) stale.push(entry);
    }

    for (const f of added) console.log(`added     ${f.file}  (“${f.title}”)`);
    for (const f of dropped) console.log(`dropped   ${f}`);
    for (const f of unreadable) console.log(`skipped   ${f}: not valid JSON`);

    if (opts.check) {
        // Hash bookkeeping alone is not "out of date": only membership and thumbnails are.
        const outOfDate = added.length || dropped.length || stale.length;
        for (const e of stale) console.log(`thumbnail ${e.file}: missing or stale`);
        console.log(outOfDate ? '\nindex.json is out of date — run "npm run configs:index".' : 'index.json is up to date.');
        if (outOfDate) process.exitCode = 1;
        return;
    }

    let thumbsMissing = stale;
    if (opts.thumbnails && stale.length) {
        try {
            await assertDevServer(opts.baseUrl);
            console.log(`\nCapturing ${stale.length} thumbnail(s)…`);
            const results = await captureThumbnails({ configsDir, ...CAPTURE_DEFAULTS, baseUrl: opts.baseUrl }, stale, true,
                r => console.log(`  ${describeResult(r)}`));
            thumbsMissing = results.filter(r => r.failed).map(r => r.entry);
        } catch (err) {
            console.log(`\n${(err as Error).message}`);
        }
    }

    const after = formatIndex(index);
    if (after !== before) await writeIndex(indexPath, index);

    // A thumbnail no entry points at belongs to a config that was dropped or renamed.
    const used = new Set(index.configs.map(e => e.thumbnail).filter(Boolean));
    const thumbsDir = path.join(configsDir, 'thumbnails');
    if (await exists(thumbsDir)) {
        for (const name of await readdir(thumbsDir)) {
            if (used.has(`thumbnails/${name}`)) continue;
            await rm(path.join(thumbsDir, name));
            console.log(`removed   thumbnails/${name} (no config uses it)`);
        }
    }

    const wording = index.configs.map(e => [e, wordingProblems(e)] as const).filter(([, p]) => p.length);
    if (wording.length) {
        console.log('\nWording that will show badly in the gallery (edit it in index.json):');
        for (const [e, p] of wording) console.log(`  ${e.file.padEnd(28)} ${p.join(', ')}`);
    }
    if (thumbsMissing.length) {
        console.log(`\nNo thumbnail yet for: ${thumbsMissing.map(e => e.file).join(', ')} — the gallery shows a placeholder. `
            + 'Run again with "npm run dev" running.');
    }
    console.log(after !== before ? '\nindex.json updated.' : '\nindex.json unchanged.');
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
