/**
 * The branch preview site (preview.webmapx.com): one folder per branch, a
 * manifest of what is in each, and an index page listing them.
 *
 * Every branch, main included, lives in a folder of its own rather than main
 * taking the root: a branch called `assets` or `config` would otherwise land
 * on top of the app's own folders.
 */

/** A deployed preview, as recorded in `previews.json` at the site root. */
export interface PreviewEntry {
    slug: string;
    branch: string;
    sha: string;
    /** ISO time of the deploy. */
    deployed: string;
    /** Size of the folder in bytes, so the site total can be checked without reading it. */
    bytes: number;
    /**
     * Files of this preview that live in {@link SHARED_DIR} instead of its own
     * folder, by name, with their size. Absent for a preview deployed before
     * sharing existed, which simply holds its own copies.
     */
    shared?: Record<string, number>;
}

/**
 * Top-level folder holding the large binaries previews have in common (GDAL's
 * WASM, mostly), each stored once under a name derived from its content. No
 * branch can land on it: a slug never contains `_`.
 */
export const SHARED_DIR = '_shared';

/**
 * GitHub Pages refuses to publish a site over 1 GB. The guard sits below it so
 * a deploy fails with a list of what to delete, instead of Pages failing later
 * with nothing more than "too large".
 */
export const SITE_BUDGET_BYTES = 950 * 1024 * 1024;

const MAX_SLUG_LENGTH = 60;

/**
 * A branch name as a URL folder: `feat/New_Legend` → `feat-new-legend`.
 * Lower case because Pages paths are case-sensitive and a URL read out loud is
 * not; anything outside [a-z0-9] becomes one hyphen. Returns '' for a name with
 * nothing usable in it, which the caller must refuse.
 */
export function branchSlug(branch: string): string {
    return branch
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, MAX_SLUG_LENGTH)
        .replace(/-+$/, '');
}

/** The manifest with `entry` added, replacing any earlier deploy of the same slug. */
export function withPreview(entries: PreviewEntry[], entry: PreviewEntry): PreviewEntry[] {
    return [...entries.filter((e) => e.slug !== entry.slug), entry]
        .sort((a, b) => a.slug.localeCompare(b.slug));
}

export function withoutPreview(entries: PreviewEntry[], slug: string): PreviewEntry[] {
    return entries.filter((e) => e.slug !== slug);
}

/** Every shared file some preview still refers to, with its size. */
export function sharedFiles(entries: PreviewEntry[]): Map<string, number> {
    const files = new Map<string, number>();
    for (const e of entries) for (const [name, bytes] of Object.entries(e.shared ?? {})) files.set(name, bytes);
    return files;
}

export function sharedBytes(entries: PreviewEntry[]): number {
    let sum = 0;
    for (const bytes of sharedFiles(entries).values()) sum += bytes;
    return sum;
}

/** The site's size: each preview's own folder, plus each shared file once. */
export function totalBytes(entries: PreviewEntry[]): number {
    return entries.reduce((sum, e) => sum + e.bytes, 0) + sharedBytes(entries);
}

function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function megabytes(bytes: number): string {
    return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}

/** The root page: one row per preview, main first, then the newest deploys. */
export function renderIndex(entries: PreviewEntry[], repoUrl: string): string {
    const ordered = [...entries].sort((a, b) =>
        (a.slug === 'main' ? -1 : b.slug === 'main' ? 1 : b.deployed.localeCompare(a.deployed)));
    const rows = ordered.map((e) => `
      <li>
        <a href="./${encodeURIComponent(e.slug)}/">${escapeHtml(e.branch)}</a>
        <span class="meta">
          <a href="${escapeHtml(repoUrl)}/commit/${escapeHtml(e.sha)}"><code>${escapeHtml(e.sha.slice(0, 7))}</code></a>
          · <time datetime="${escapeHtml(e.deployed)}">${escapeHtml(e.deployed.slice(0, 16).replace('T', ' '))} UTC</time>
          · ${megabytes(e.bytes)}
        </span>
      </li>`).join('');
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>webmapx previews</title>
  <style>
    :root { color-scheme: light dark; --muted: #5a6773; --link: #1f5f82; }
    @media (prefers-color-scheme: dark) { :root { --muted: #a3afba; --link: #8cc4e6; } }
    body { font: 16px/1.5 system-ui, sans-serif; max-width: 44rem; margin: 2rem auto; padding: 0 1rem; }
    a { color: var(--link); }
    ul { list-style: none; padding: 0; }
    li { padding: 0.5rem 0; border-bottom: 1px solid color-mix(in srgb, currentColor 15%, transparent); }
    li > a { font-weight: 600; }
    .meta { display: block; color: var(--muted); font-size: 0.875rem; }
    p { color: var(--muted); }
  </style>
</head>
<body>
  <h1>webmapx previews</h1>
  <p>One build per branch of <a href="${escapeHtml(repoUrl)}">webmapx</a>, updated on every push and
     removed when the branch is deleted. Unreviewed work: not the published site, which is
     <a href="https://webmapx.com/">webmapx.com</a>. All previews share this origin, so they
     also share browser storage.</p>
  <ul>${rows || '\n      <li>No previews yet.</li>'}
  </ul>
  <p>${entries.length} preview(s), ${megabytes(totalBytes(entries))} of ${megabytes(SITE_BUDGET_BYTES)},
     of which ${megabytes(sharedBytes(entries))} is shared between them.</p>
</body>
</html>
`;
}
