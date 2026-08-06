/**
 * Bakes layer swatches into a webmapx config, once, offline.
 *
 * A swatch is a property of the LAYER, not of any one panel: it says what this
 * layer looks like on a map. The catalog is simply the first consumer — the
 * legend, the info panel and any host application can render the same value.
 * That is why it lives in `metadata.swatch` on the layer definition and travels
 * with it, rather than in a lookup table owned by a component.
 *
 * Layers with a paint spec (fill, line, circle) already derive a swatch at
 * runtime for free. Raster basemaps, remote vector styles and Allmaps overlays
 * do not — and resolving those in the browser means opening a layer list fires
 * requests at third-party tile hosts for layers the user never added, which is
 * both a privacy leak and a tile-usage-policy problem.
 *
 * So this tool does it up front: fetch one representative tile, downscale it to
 * swatch size, and store it as a data: URL. At ~24px the tile reads as its own
 * average colour, which is what a swatch wants. The result is self-contained —
 * no runtime network, and it works offline.
 *
 *   npm run generate:swatches -- --help
 *
 * Chromium (via playwright, already a dev dependency) does the decode and
 * resize: it handles every image format a browser can display, which is
 * precisely the set of formats a tile server might return. Bytes are fetched in
 * Node and handed to the page as base64, so there is no CORS constraint and no
 * tainted-canvas failure.
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Browser } from 'playwright';

import {
    backgroundColorFromStyle,
    resolveRasterPreviewUrl,
    resolveWmsPreviewUrl,
} from './lib/layer-preview';
import { deriveLayerSwatch } from '../src/utils/layer-swatch';
import { injectLayerSwatch, selectSwatchTargets } from './lib/config-swatches';

interface Options {
    configPath: string;
    write: boolean;
    force: boolean;
    only: string[];
    size: number;
    quality: number;
    timeoutMs: number;
}

function parseArgs(argv: string[]): Options | null {
    const opts: Options = {
        configPath: 'public/config/demo.json',
        write: false,
        force: false,
        only: [],
        size: 24,
        quality: 0.75,
        timeoutMs: 15000,
    };

    const positional: string[] = [];

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const value = () => argv[++i];

        switch (arg) {
            case '--help':
            case '-h':
                return null;
            case '--write': opts.write = true; break;
            case '--force': opts.force = true; break;
            case '--only': opts.only = (value() ?? '').split(',').map(s => s.trim()).filter(Boolean); break;
            case '--size': opts.size = Number(value()); break;
            case '--quality': opts.quality = Number(value()); break;
            case '--timeout': opts.timeoutMs = Number(value()); break;
            default:
                if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`);
                positional.push(arg);
        }
    }

    if (positional[0]) opts.configPath = positional[0];
    return opts;
}

function usage(): void {
    console.log(`
Bake layer swatches into a webmapx config.

  node scripts/run-ts.mjs scripts/generate-layer-swatches.ts [config] [options]

  config            path to the config JSON   (default public/config/demo.json)
  --write           persist changes; without it the run is a dry run
  --force           re-bake layers that already have a swatch
  --only a,b        restrict to these layer ids
  --size <px>       swatch edge length        (default 24)
  --quality <0-1>   webp quality              (default 0.75)
  --timeout <ms>    per-request timeout       (default 15000)
`.trim());
}

/** Node-side fetch: no CORS, and we can report a real status on failure. */
async function fetchBytes(url: string, timeoutMs: number): Promise<{ base64: string; mime: string } | string> {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
        if (!res.ok) return `HTTP ${res.status}`;
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.byteLength === 0) return 'empty response';
        const mime = res.headers.get('content-type')?.split(';')[0] ?? 'image/png';
        if (!mime.startsWith('image/')) return `not an image (${mime})`;
        return { base64: buf.toString('base64'), mime };
    } catch (err) {
        return err instanceof Error ? err.message : 'fetch failed';
    }
}

async function fetchJson(url: string, timeoutMs: number): Promise<unknown | null> {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
        return res.ok ? await res.json() : null;
    } catch {
        return null;
    }
}

/** Decodes and downscales in Chromium, returning a webp data: URL. */
async function toSwatchDataUrl(
    browser: Browser,
    image: { base64: string; mime: string },
    size: number,
    quality: number,
): Promise<string | null> {
    const page = await browser.newPage();
    try {
        return await page.evaluate(async ({ base64, mime, size, quality }) => {
            const blob = await (await fetch(`data:${mime};base64,${base64}`)).blob();
            const bitmap = await createImageBitmap(blob);
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            // Cover-crop the centre, matching how the swatch is displayed.
            const side = Math.min(bitmap.width, bitmap.height);
            const sx = (bitmap.width - side) / 2;
            const sy = (bitmap.height - side) / 2;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
            bitmap.close();
            const webp = canvas.toDataURL('image/webp', quality);
            // Some builds silently fall back to png when webp is unavailable;
            // either is fine, both are self-contained.
            return webp.startsWith('data:image/') ? webp : canvas.toDataURL('image/png');
        }, { base64: image.base64, mime: image.mime, size, quality });
    } finally {
        await page.close();
    }
}

/**
 * Allmaps overlays are georeference annotations, which name the scanned image
 * as a IIIF image service at `target.source.id`. A IIIF server can render a
 * thumbnail at any size, so we ask it for one directly.
 *
 * Read structurally, not by pattern-matching URLs: an earlier version searched
 * for any id containing "iiif" or an "images" path segment, and matched the
 * AnnotationPage's own URL on annotations.allmaps.org, producing a 404.
 */
export function iiifThumbnailFromAnnotation(annotation: unknown, size: number): string | null {
    const root = annotation as Record<string, unknown> | null;
    if (!root || typeof root !== 'object') return null;

    // An AnnotationPage wraps one or more Annotations; either may arrive here.
    const annotations = Array.isArray(root.items) ? root.items : [root];

    for (const item of annotations) {
        const target = (item as { target?: unknown })?.target as { source?: unknown } | undefined;
        const source = target?.source as { id?: unknown; type?: unknown } | undefined;
        const id = source?.id;
        if (typeof id !== 'string' || id.length === 0) continue;
        // `!w,h` asks for "fit inside these dimensions", supported by both the
        // IIIF Image API 2 and 3 services Allmaps references.
        return `${id.replace(/\/$/, '')}/full/!${size * 4},${size * 4}/0/default.jpg`;
    }

    return null;
}

interface LayerRecord {
    id?: unknown;
    type?: unknown;
    source?: unknown;
    url?: unknown;
    annotation?: unknown;
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

    const configPath = path.resolve(process.cwd(), options.configPath);
    const raw = await readFile(configPath, 'utf8');
    const config = JSON.parse(raw) as { layerData?: { layers?: unknown; sources?: unknown } };

    const layers = config.layerData?.layers;
    const sources = Array.isArray(config.layerData?.sources) ? config.layerData!.sources as LayerRecord[] : [];
    const targets = selectSwatchTargets(layers, { force: options.force, only: options.only });

    if (targets.length === 0) {
        console.log('Nothing to bake — every layer either derives a swatch already or has one.');
        return;
    }

    console.log(`${targets.length} layer(s) need a swatch in ${options.configPath}\n`);

    const browser = await chromium.launch();
    const results: { id: string; status: string; detail: string; bytes: number }[] = [];
    let text = raw;

    try {
        for (const target of targets) {
            const layer = (layers as LayerRecord[]).find(l => l.id === target.id)!;
            const source = typeof layer.source === 'string'
                ? sources.find(s => s.id === layer.source)
                : undefined;

            let swatch: string | null = null;
            let detail = '';

            const imageUrl = resolveRasterPreviewUrl(layer, source ?? null)
                ?? resolveWmsPreviewUrl(layer, source ?? null);
            if (imageUrl) {
                const kind = resolveRasterPreviewUrl(layer, source ?? null) ? 'tile' : 'wms';
                const image = await fetchBytes(imageUrl, options.timeoutMs);
                if (typeof image === 'string') {
                    detail = `${kind}: ${image}`;
                } else {
                    swatch = await toSwatchDataUrl(browser, image, options.size, options.quality);
                    detail = kind;
                }
            } else if (layer.type === 'style' && typeof layer.url === 'string') {
                const style = await fetchJson(layer.url, options.timeoutMs);
                swatch = style ? backgroundColorFromStyle(style) : null;
                detail = 'style background';
                if (!swatch && style) {
                    // No background layer (common for overlay styles like BAG/BGT):
                    // fall back to the same "most representative sublayer" rule the
                    // runtime uses for inline style containers.
                    const derived = deriveLayerSwatch({ type: 'style', layers: (style as { layers?: unknown }).layers });
                    if (derived.kind !== 'raster' && derived.kind !== 'unknown') {
                        swatch = derived.background;
                        detail = `style ${derived.kind}`;
                    }
                }
                if (!swatch) detail = style ? 'style: no derivable colour' : 'style: fetch failed';
            } else if (layer.type === 'allmaps' && typeof layer.annotation === 'string') {
                const annotation = await fetchJson(layer.annotation, options.timeoutMs);
                const thumb = annotation ? iiifThumbnailFromAnnotation(annotation, options.size) : null;
                if (!thumb) {
                    detail = 'allmaps: no IIIF image found';
                } else {
                    const image = await fetchBytes(thumb, options.timeoutMs);
                    if (typeof image === 'string') detail = `allmaps thumbnail: ${image}`;
                    else {
                        swatch = await toSwatchDataUrl(browser, image, options.size, options.quality);
                        detail = 'allmaps thumbnail';
                    }
                }
            } else {
                detail = 'no tile template, style url or annotation';
            }

            if (swatch) {
                text = injectLayerSwatch(text, target.id, swatch);
                results.push({ id: target.id, status: 'ok', detail, bytes: swatch.length });
            } else {
                results.push({ id: target.id, status: 'skip', detail, bytes: 0 });
            }
            process.stdout.write(`  ${swatch ? '✓' : '·'} ${target.id}\n`);
        }
    } finally {
        await browser.close();
    }

    const ok = results.filter(r => r.status === 'ok');
    const added = text.length - raw.length;

    console.log('\n' + results
        .map(r => `  ${r.status === 'ok' ? '✓' : '·'} ${r.id.padEnd(32)} ${r.detail}${r.bytes ? ` (${r.bytes} B)` : ''}`)
        .join('\n'));
    console.log(`\n${ok.length}/${results.length} baked, config grows by ${(added / 1024).toFixed(1)} kB`);

    if (!options.write) {
        console.log('\nDry run — pass --write to save.');
        return;
    }

    // Re-parse before writing: a formatting-preserving text edit must still
    // produce valid JSON, and it is cheap to prove rather than assume.
    JSON.parse(text);
    await writeFile(configPath, text, 'utf8');
    console.log(`\nWrote ${options.configPath}`);
}

await main();
