/**
 * Shared by `generate:config-thumbnails` (thumbnails only) and `configs:index`
 * (index + the thumbnails it is missing): capturing a config as the setup gallery's
 * thumbnail, and reading/writing the config repository's index.json.
 *
 * A config is captured in testpages/preview.html on a running dev server — the page
 * setup previews with, which mounts the config with its own URL (so relative data
 * paths resolve) and its own engine. The whole app is captured, toolbars included:
 * what a config offers is part of what tells two configs apart. Downscaling and WebP
 * encoding happen in Chromium, which encodes WebP without a Node dependency.
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Page } from 'playwright';

export interface IndexEntry {
    file: string;
    title?: string;
    description?: string;
    thumbnail?: string;
    /** Hash of the config the thumbnail was made from; a different hash means it is stale. */
    thumbnailOf?: string;
    [key: string]: unknown;
}

export interface ConfigIndex {
    description?: string;
    /** Configs in the repository that are deliberately not offered. */
    exclude?: string[];
    configs: IndexEntry[];
    [key: string]: unknown;
}

export interface CaptureOptions {
    configsDir: string;
    baseUrl: string;
    waitMs: number;
    width: number;
    quality: number;
}

export const CAPTURE_DEFAULTS = { baseUrl: 'http://localhost:5173', waitMs: 5000, width: 480, quality: 0.78 };

/** The capture viewport: a laptop-sized window, so toolbars sit where they normally do. */
const VIEWPORT = { width: 1280, height: 800 };

export function configHash(text: string): string {
    return createHash('sha256').update(text).digest('hex').slice(0, 12);
}

export async function readIndex(indexPath: string): Promise<ConfigIndex> {
    const index = JSON.parse(await readFile(indexPath, 'utf8'));
    if (!Array.isArray(index?.configs)) throw new Error(`${indexPath} has no "configs" array`);
    return index;
}

/**
 * One entry per line, like a hand-written file, so a re-run diffs as one line per
 * changed config and the file stays pleasant to edit by hand.
 */
export function formatIndex(index: ConfigIndex): string {
    const inline = (v: unknown): string => {
        if (Array.isArray(v)) return `[${v.map(inline).join(', ')}]`;
        if (v && typeof v === 'object') {
            const parts = Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => `${JSON.stringify(k)}: ${inline(x)}`);
            return parts.length ? `{ ${parts.join(', ')} }` : '{}';
        }
        return JSON.stringify(v);
    };
    const head = Object.entries(index)
        .filter(([k]) => k !== 'configs')
        .map(([k, v]) => `  ${JSON.stringify(k)}: ${inline(v)},`);
    const entries = index.configs.map((c, i) => `    ${inline(c)}${i < index.configs.length - 1 ? ',' : ''}`);
    return `{\n${head.join('\n')}${head.length ? '\n' : ''}  "configs": [\n${entries.join('\n')}\n  ]\n}\n`;
}

export async function writeIndex(indexPath: string, index: ConfigIndex): Promise<void> {
    await writeFile(indexPath, formatIndex(index));
}

export async function assertDevServer(baseUrl: string): Promise<void> {
    try {
        const res = await fetch(`${baseUrl}/testpages/preview.html`);
        if (!res.ok) throw new Error(String(res.status));
    } catch {
        throw new Error(`No dev server at ${baseUrl} — start one with "npm run dev" (or pass --base-url).`);
    }
}

async function capture(page: Page, url: string, waitMs: number): Promise<{ png: Buffer; errors: string[] }> {
    const errors: string[] = [];
    const onError = (e: Error) => errors.push(e.message);
    page.on('pageerror', onError);
    try {
        await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
        // Tiles keep arriving after load; "quiet" is the best available signal, capped
        // because some maps (animated layers, live feeds) are never quiet.
        await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
        await page.waitForTimeout(waitMs);
        return { png: await page.screenshot({ type: 'png' }), errors };
    } finally {
        page.off('pageerror', onError);
    }
}

async function toWebp(page: Page, png: Buffer, width: number, quality: number): Promise<Buffer> {
    const height = Math.round(width * 10 / 16);
    const dataUrl = await page.evaluate(async ({ b64, width, height, quality }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        // Crop to 16:10 from the centre, then scale.
        const srcRatio = img.width / img.height;
        const dstRatio = width / height;
        let sw = img.width, sh = img.height, sx = 0, sy = 0;
        if (srcRatio > dstRatio) { sw = img.height * dstRatio; sx = (img.width - sw) / 2; }
        else { sh = img.width / dstRatio; sy = (img.height - sh) / 2; }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
        return canvas.toDataURL('image/webp', quality);
    }, { b64: png.toString('base64'), width, height, quality });
    return Buffer.from(dataUrl.split(',')[1], 'base64');
}

export interface CaptureResult { entry: IndexEntry; bytes?: number; errors: string[]; failed?: string }

/**
 * Captures each entry. With `write`, saves `thumbnails/<name>.webp` and sets the
 * entry's `thumbnail` and `thumbnailOf` (the caller writes index.json).
 */
export async function captureThumbnails(
    opts: CaptureOptions,
    entries: IndexEntry[],
    write: boolean,
    onResult: (r: CaptureResult) => void = () => {},
): Promise<CaptureResult[]> {
    const { mkdir } = await import('node:fs/promises');
    const configsDir = path.resolve(opts.configsDir);
    // preview.html lives in testpages/ and resolves ?config= against itself.
    const configsUrlPath = path.relative(path.resolve('testpages'), configsDir).split(path.sep).join('/');
    if (write) await mkdir(path.join(configsDir, 'thumbnails'), { recursive: true });

    const results: CaptureResult[] = [];
    const browser = await chromium.launch();
    try {
        for (const entry of entries) {
            // A fresh context per config: preview.html prefers a config in localStorage,
            // and the engine choice is remembered there too.
            const context = await browser.newContext({ viewport: VIEWPORT });
            const page = await context.newPage();
            const url = `${opts.baseUrl}/testpages/preview.html?config=${encodeURIComponent(`${configsUrlPath}/${entry.file}`)}`;
            let result: CaptureResult;
            try {
                const configText = await readFile(path.join(configsDir, entry.file), 'utf8');
                const { png, errors } = await capture(page, url, opts.waitMs);
                const webp = await toWebp(page, png, opts.width, opts.quality);
                if (write) {
                    const rel = `thumbnails/${entry.file.replace(/\.json$/i, '')}.webp`;
                    await writeFile(path.join(configsDir, rel), webp);
                    entry.thumbnail = rel;
                    entry.thumbnailOf = configHash(configText);
                }
                result = { entry, bytes: webp.length, errors };
            } catch (err) {
                result = { entry, errors: [], failed: (err as Error).message };
            } finally {
                await context.close();
            }
            results.push(result);
            onResult(result);
        }
    } finally {
        await browser.close();
    }
    return results;
}

export function describeResult(r: CaptureResult): string {
    if (r.failed) return `${r.entry.file.padEnd(28)} FAILED: ${r.failed}`;
    const errs = r.errors.length ? `  (${r.errors.length} page error(s): ${r.errors[0].slice(0, 80)})` : '';
    return `${r.entry.file.padEnd(28)} ${((r.bytes ?? 0) / 1024).toFixed(1).padStart(6)} KB${errs}`;
}
