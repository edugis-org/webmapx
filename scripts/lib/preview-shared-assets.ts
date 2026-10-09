/**
 * Moves a preview's large binaries into the site's shared folder, so a file
 * every preview carries (GDAL's 28 MB WASM and 12 MB data file, twice per
 * build: the app's and the library's) is stored once for the whole site
 * instead of once per branch.
 *
 * This happens to the assembled preview only, after the build: webmapx's own
 * build, the npm package, webmapx.com and every config are untouched. It works
 * because Vite addresses such a file in exactly one way — by name, relative to
 * the script that loads it:
 *
 *   new URL(`gdal3WebAssembly-DRcsV-5Y.wasm`, self.location.href)
 *   new URL(`./spatial.worker-CfG1-GRz-inlined-0.wasm`, self.location.href)
 *
 * so that name is rewritten to a relative path into the shared folder. A file
 * is shared only when *every* mention of its name anywhere in the preview is
 * one of those references; anything else (Cesium finds its own WASM by other
 * means) leaves the file where it is. The worst a new kind of reference can do
 * is cost space, never break a preview.
 *
 * Shared names are a hash of the content, so two previews can only share a file
 * that is byte for byte the same, and the app's and the library's copies of
 * GDAL become one.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/** Below this a file is not worth the rewrite. */
export const MIN_SHARED_BYTES = 256 * 1024;

const SHAREABLE = /\.(wasm|data|bin)$/;
const TEXT = /\.(js|mjs|html|css|json|map)$/;

function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * `<first 20 hex of sha256>.wasm|.bin`: the same bytes always get the same
 * name. The extension is kept only where it matters — a `.wasm` is served as
 * `application/wasm`, which streaming compilation requires — so GDAL's data
 * file, `.data` in the app and `.bin` in the library, is stored once.
 */
export function sharedName(bytes: Uint8Array, fileName: string): string {
    const extension = path.extname(fileName) === '.wasm' ? '.wasm' : '.bin';
    return `${createHash('sha256').update(bytes).digest('hex').slice(0, 20)}${extension}`;
}

/**
 * `source` with every script-relative reference to `fileName` pointed at
 * `target`, and how many it changed. Only a reference resolved against the
 * script's own location qualifies: `import.meta.url`, or `self.location.href`
 * in a worker (which is the worker script's URL).
 */
export function rewriteReferences(source: string, fileName: string, target: string): { text: string; count: number } {
    const pattern = new RegExp(
        `(new URL\\(\\s*)([\`'"])(?:\\./)?${escapeRegExp(fileName)}\\2(\\s*,\\s*(?:import\\.meta\\.url|self\\.location\\.href)\\b)`,
        'g',
    );
    let count = 0;
    const text = source.replace(pattern, (_m, open: string, quote: string, base: string) => {
        count += 1;
        return `${open}${quote}${target}${quote}${base}`;
    });
    return { text, count };
}

function filesUnder(dir: string): string[] {
    return readdirSync(dir, { recursive: true, withFileTypes: true })
        .filter((d) => d.isFile())
        .map((d) => path.join(d.parentPath, d.name));
}

/** Path from `fromDir` to `to`, with `/` separators, as a URL wants it. */
function relativeUrl(fromDir: string, to: string): string {
    return path.relative(fromDir, to).split(path.sep).join('/');
}

export interface ShareResult {
    /** Shared file name → size, for the manifest. */
    shared: Record<string, number>;
    /** Large binaries left in the preview, and why. */
    kept: { file: string; reason: string }[];
}

/**
 * Moves every shareable binary of `previewDir` into `sharedDir` and rewrites
 * the references to it. `sharedDir` must be where it will sit on the site
 * relative to `previewDir` (site root `_shared/` beside the preview's folder),
 * since the rewritten paths are relative.
 */
export function shareLargeBinaries(previewDir: string, sharedDir: string): ShareResult {
    const files = filesUnder(previewDir);
    const texts = new Map(files.filter((f) => TEXT.test(f)).map((f) => [f, readFileSync(f, 'utf8')]));
    const changed = new Set<string>();
    const result: ShareResult = { shared: {}, kept: [] };

    for (const file of files) {
        if (!SHAREABLE.test(file)) continue;
        const size = statSync(file).size;
        if (size < MIN_SHARED_BYTES) continue;
        const fileName = path.basename(file);
        const bytes = readFileSync(file);
        const name = sharedName(bytes, fileName);
        const target = relativeUrl(path.dirname(file), path.join(sharedDir, name));

        // Only a script beside the file can address it by bare name; do the
        // rewrite on copies and keep it only if no other mention is left.
        const rewritten = new Map<string, string>();
        let references = 0;
        for (const [textFile, text] of texts) {
            if (!text.includes(fileName)) continue;
            if (path.dirname(textFile) !== path.dirname(file)) {
                rewritten.set(textFile, text);
                continue;
            }
            const { text: next, count } = rewriteReferences(text, fileName, target);
            references += count;
            rewritten.set(textFile, next);
        }
        const leftover = [...rewritten].filter(([, text]) => text.includes(fileName)).map(([f]) => f);
        if (references === 0 || leftover.length > 0) {
            result.kept.push({
                file: relativeUrl(previewDir, file),
                reason: references === 0
                    ? 'no script-relative reference to it'
                    : `also named in ${leftover.map((f) => relativeUrl(previewDir, f)).join(', ')}`,
            });
            continue;
        }

        for (const [textFile, text] of rewritten) {
            texts.set(textFile, text);
            changed.add(textFile);
        }
        mkdirSync(sharedDir, { recursive: true });
        const destination = path.join(sharedDir, name);
        if (existsSync(destination)) rmSync(file);
        else renameSync(file, destination);
        result.shared[name] = size;
    }

    for (const textFile of changed) writeFileSync(textFile, texts.get(textFile)!);
    return result;
}
