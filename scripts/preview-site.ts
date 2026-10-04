/**
 * Maintains the branch preview site's root: the manifest (`previews.json`),
 * the index page, `CNAME` and `.nojekyll`. Used by
 * `.github/workflows/previews.yml`; copying the build into its folder is the
 * workflow's job, this only records it.
 *
 *   node scripts/run-ts.mjs scripts/preview-site.ts slug <branch>
 *   node scripts/run-ts.mjs scripts/preview-site.ts add <site-dir> <slug> <branch> <sha> <bytes>
 *   node scripts/run-ts.mjs scripts/preview-site.ts remove <site-dir> <slug>
 *
 * `add` exits non-zero when the site would exceed its budget, listing the
 * previews by size so it is clear which branch to delete.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
    SITE_BUDGET_BYTES,
    branchSlug,
    renderIndex,
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
} else if (command === 'add') {
    const [site, slug, branch, sha, bytes] = args;
    const entries = withPreview(readManifest(site), {
        slug, branch, sha, deployed: new Date().toISOString(), bytes: Number(bytes),
    });
    const total = totalBytes(entries);
    if (total > SITE_BUDGET_BYTES) {
        console.error(`The preview site would be ${(total / 1048576).toFixed(0)} MB, over its `
            + `${(SITE_BUDGET_BYTES / 1048576).toFixed(0)} MB budget (GitHub Pages stops at 1 GB). `
            + 'Delete a branch you no longer need to free its preview:');
        for (const e of [...entries].sort((a, b) => b.bytes - a.bytes)) {
            console.error(`  ${(e.bytes / 1048576).toFixed(0).padStart(5)} MB  ${e.branch}  (deployed ${e.deployed})`);
        }
        process.exit(2);
    }
    writeRoot(site, entries);
} else if (command === 'remove') {
    const [site, slug] = args;
    writeRoot(site, withoutPreview(readManifest(site), slug));
} else {
    console.error('Usage: preview-site.ts slug <branch> | add <site> <slug> <branch> <sha> <bytes> | remove <site> <slug>');
    process.exit(1);
}
