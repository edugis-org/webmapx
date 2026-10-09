/**
 * Maintains the branch preview site's root: the manifest (`previews.json`),
 * the index page, `CNAME` and `.nojekyll`. Used by
 * `.github/workflows/previews.yml`; copying the build into its folder is the
 * workflow's job, this only records it.
 *
 *   node scripts/run-ts.mjs scripts/preview-site.ts slug <branch>
 *   node scripts/run-ts.mjs scripts/preview-site.ts share <preview-dir> <shared-dir> <shared.json>
 *   node scripts/run-ts.mjs scripts/preview-site.ts add <site-dir> <slug> <branch> <sha> <bytes> [<shared.json>]
 *   node scripts/run-ts.mjs scripts/preview-site.ts remove <site-dir> <slug>
 *   node scripts/run-ts.mjs scripts/preview-site.ts shared-names <site-dir>
 *
 * `share` moves the preview's large binaries into the shared folder (see
 * lib/preview-shared-assets.ts) and writes what it moved to <shared.json>, which
 * `add` records in the manifest. `shared-names` prints every shared file the
 * manifest still refers to, one per line: the workflow keeps those and drops
 * the rest.
 *
 * `add` exits non-zero when the site would exceed its budget, listing the
 * previews by size so it is clear which branch to delete.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { shareLargeBinaries } from './lib/preview-shared-assets';
import {
    SITE_BUDGET_BYTES,
    branchSlug,
    renderIndex,
    sharedBytes,
    sharedFiles,
    totalBytes,
    withPreview,
    withoutPreview,
    type PreviewEntry,
} from './lib/preview-site';

const DOMAIN = 'preview.webmapx.com';
const REPO_URL = 'https://github.com/edugis-org/webmapx';

function readManifest(site: string): PreviewEntry[] {
    const file = path.join(site, 'previews.json');
    return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) as PreviewEntry[] : [];
}

function writeRoot(site: string, entries: PreviewEntry[]): void {
    writeFileSync(path.join(site, 'previews.json'), `${JSON.stringify(entries, null, 2)}\n`);
    writeFileSync(path.join(site, 'index.html'), renderIndex(entries, REPO_URL));
    writeFileSync(path.join(site, 'CNAME'), `${DOMAIN}\n`);
    // Without it Pages runs Jekyll, which skips every path starting with "_".
    writeFileSync(path.join(site, '.nojekyll'), '');
}

const [command, ...args] = process.argv.slice(2);

if (command === 'slug') {
    const slug = branchSlug(args[0] ?? '');
    if (!slug) {
        console.error(`Branch "${args[0]}" has no letters or digits to name a folder after.`);
        process.exit(1);
    }
    console.log(slug);
} else if (command === 'share') {
    const [previewDir, sharedDir, out] = args;
    const { shared, kept } = shareLargeBinaries(previewDir, sharedDir);
    for (const [name, bytes] of Object.entries(shared)) console.log(`shared ${(bytes / 1048576).toFixed(1)} MB as ${name}`);
    for (const { file, reason } of kept) console.log(`kept ${file}: ${reason}`);
    writeFileSync(out, `${JSON.stringify(shared, null, 2)}\n`);
} else if (command === 'add') {
    const [site, slug, branch, sha, bytes, sharedJson] = args;
    const shared = sharedJson ? JSON.parse(readFileSync(sharedJson, 'utf8')) as Record<string, number> : undefined;
    const entries = withPreview(readManifest(site), {
        slug, branch, sha, deployed: new Date().toISOString(), bytes: Number(bytes), shared,
    });
    const total = totalBytes(entries);
    if (total > SITE_BUDGET_BYTES) {
        console.error(`The preview site would be ${(total / 1048576).toFixed(0)} MB, over its `
            + `${(SITE_BUDGET_BYTES / 1048576).toFixed(0)} MB budget (GitHub Pages stops at 1 GB). `
            + 'Delete a branch you no longer need to free its preview:');
        for (const e of [...entries].sort((a, b) => b.bytes - a.bytes)) {
            console.error(`  ${(e.bytes / 1048576).toFixed(0).padStart(5)} MB  ${e.branch}  (deployed ${e.deployed})`);
        }
        console.error(`  ${(sharedBytes(entries) / 1048576).toFixed(0).padStart(5)} MB  shared between them`);
        process.exit(2);
    }
    writeRoot(site, entries);
} else if (command === 'remove') {
    const [site, slug] = args;
    writeRoot(site, withoutPreview(readManifest(site), slug));
} else if (command === 'shared-names') {
    for (const name of sharedFiles(readManifest(args[0])).keys()) console.log(name);
} else {
    console.error('Usage: preview-site.ts slug <branch> | share <preview> <shared> <shared.json> '
        + '| add <site> <slug> <branch> <sha> <bytes> [<shared.json>] | remove <site> <slug> | shared-names <site>');
    process.exit(1);
}
