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
 * So this tool does it up front: fetch one representative tile, downscale it
 * hard, and store it as a data: URL. The stored image is deliberately TINY —
 * 8px square by default — for two reasons. Every byte lives in the config that
 * each visitor downloads, and detail is not what a swatch is for: at swatch
 * size a tile reads as its own average colour with a hint of structure, and the
 * browser smooths the upscale for free. Storing 24px instead tripled the config
 * cost to show texture nobody can see, and at that size basemap lettering
 * survived the downscale and baked in as glyph-shaped noise. Pass --size to
 * trade config bytes for detail. The result is
 * self-contained — no runtime network, and it works offline.
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
    resolveRasterPreviewUrls,
    resolveWmsPreviewUrls,
} from './lib/layer-preview';
import { NEUTRAL_SWATCH, deriveLayerSwatch } from '../src/utils/layer-swatch';
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
        size: 8,
        quality: 0.85,
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
  --size <px>       stored swatch resolution  (default 8)
  --quality <0-1>   webp quality              (default 0.85)
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

/**
 * Loads `config/apikeys.json` — the same fixed location `src/config/apikeys.ts`
 * fetches at runtime, resolved on disk instead.
 *
 * Without it, every source whose url carries a `{key-…}` placeholder is
 * requested with the placeholder still in it and comes back 401 or 403, so the
 * layer silently ends up without a swatch. The keys are used to build requests
 * and never written anywhere: only the resulting image goes into the config.
 */
async function loadApiKeys(configPath: string): Promise<Record<string, string> | null> {
    let dir = path.dirname(configPath);
    for (let up = 0; up < 4; up++) {
        for (const candidate of ['apikeys.json', path.join('config', 'apikeys.json')]) {
            try {
                const parsed = JSON.parse(await readFile(path.resolve(dir, candidate), 'utf8'));
                if (parsed && typeof parsed === 'object') return parsed as Record<string, string>;
            } catch {
                // keep looking
            }
        }
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return null;
}

/** `substituteApiKeysDeep` from `src/config/apikeys.ts`, for plain JS values. */
function substituteApiKeysDeep<T>(value: T, keys: Record<string, string> | null): T {
    if (!keys) return value;
    if (typeof value === 'string') {
        return value.replace(/\{key-([^}]+)\}/g, (match, name: string) => keys[name] ?? match) as unknown as T;
    }
    if (Array.isArray(value)) return value.map(v => substituteApiKeysDeep(v, keys)) as unknown as T;
    if (value !== null && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            out[k] = substituteApiKeysDeep(v, keys);
        }
        return out as T;
    }
    return value;
}

/**
 * Reads a style document, which the config may address relatively.
 *
 * A layer's `url` is resolved by the app against the config's own location
 * (`resolveConfigRelativeUrl` in `src/config/loader.ts`), so a config can ship
 * its styles beside itself — `styles/openmaptiles/osmbright.json`. Handing that
 * string straight to fetch() fails, which is why every vector basemap in
 * nl.json reported "style: fetch failed" and got no swatch. Offline we resolve
 * the same reference against the config file on disk instead, and only fall
 * back to the network for an absolute URL.
 */
async function readStyleDocument(
    url: string,
    configPath: string,
    baseUrl: string | null,
    timeoutMs: number,
): Promise<unknown | null> {
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return fetchJson(url, timeoutMs);

    // In the browser the reference resolves against the site root, which on
    // disk is some ancestor of the config file — webmapx-demo keeps configs in
    // config/ and styles in styles/, siblings under the served root. We do not
    // know the root, so walk up from the config until the file turns up.
    let dir = path.dirname(configPath);
    for (let up = 0; up < 4; up++) {
        try {
            return JSON.parse(await readFile(path.resolve(dir, url), 'utf8'));
        } catch {
            const parent = path.dirname(dir);
            if (parent === dir) break;
            dir = parent;
        }
    }

    // Not on disk at all: try the URL the config claims to live at.
    if (!baseUrl) return null;
    try {
        return await fetchJson(new URL(url, baseUrl).toString(), timeoutMs);
    } catch {
        return null;
    }
}

/**
 * How much of a tile is actually drawn on: the fraction of pixels that are
 * neither transparent nor near-white.
 *
 * A tile inside a layer's declared bounds can still be empty — AHN's extent
 * includes the North Sea — and an empty tile bakes a blank swatch that looks
 * like a bug. Scoring lets the caller walk to a neighbouring tile instead.
 */
const MIN_TILE_COVERAGE = 0.25;

/**
 * Per-channel standard deviation below which a tile counts as one flat colour.
 *
 * Detail in a swatch is worth very little — it is 18 CSS pixels — but it costs
 * ~400 bytes of base64 in a config every visitor downloads, and base64 does not
 * compress. Below this line the 8px image and the mean colour are
 * indistinguishable at display size, so the colour wins on seven bytes.
 *
 * 60 is measured, not guessed: rendering both side by side over demo.json's
 * rasters, only elevation (sd 93), cadastral parcels (103) and shaded relief
 * (63) read differently as an image. Everything paler — grey and pastel
 * basemaps (13-46), aerials, population choropleths — looked the same either
 * way. Every run prints the measured sd per layer, so re-measure rather
 * than nudging this by feel.
 */
const FLAT_SPREAD = 60;

/**
 * Pixel size to REQUEST an image at, as opposed to the size we store.
 *
 * These must not be the same number. A WMS asked for an 8x8 GetMap renders a
 * map eight pixels wide — no lines, no fill, effectively blank — and the
 * swatch then bakes that blankness. Ask for a normal tile and downscale it
 * ourselves, which is also how the tiled path already works.
 */
const REQUEST_SIZE = 256;

/** Extra zoom levels to try when every tile at the previous step was blank. */
const ZOOM_ESCALATION = [0, 2, 4, 8];

/** Decodes and downscales in Chromium, returning a webp data: URL. */
async function toSwatchDataUrl(
    browser: Browser,
    image: { base64: string; mime: string },
    size: number,
    quality: number,
): Promise<string | null> {
    return (await toSwatch(browser, image, size, quality))?.dataUrl ?? null;
}

/** As `toSwatchDataUrl`, plus the source tile's ink coverage. */
async function toSwatch(
    browser: Browser,
    image: { base64: string; mime: string },
    size: number,
    quality: number,
): Promise<{ dataUrl: string; coverage: number; flat: boolean; spread: number } | null> {
    const page = await browser.newPage();
    try {
        return await page.evaluate(async ({ base64, mime, size, quality, flatSpread }) => {
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

            // Coverage is measured on the full-resolution crop, not the coarse
            // one: averaging fades thin ink (parcel outlines) into the paper.
            const probe = document.createElement('canvas');
            const probeSize = 64;
            probe.width = probeSize;
            probe.height = probeSize;
            const probeCtx = probe.getContext('2d', { willReadFrequently: true });
            let coverage = 1;
            // Mean colour and how far the tile strays from it. A tile that
            // barely strays has no structure worth storing as an image.
            let mean: [number, number, number] = [255, 255, 255];
            let spread = 255;
            if (probeCtx) {
                probeCtx.drawImage(bitmap, sx, sy, side, side, 0, 0, probeSize, probeSize);
                const { data } = probeCtx.getImageData(0, 0, probeSize, probeSize);
                const total = probeSize * probeSize;
                let inked = 0;
                const sum = [0, 0, 0];
                const sumSq = [0, 0, 0];
                for (let i = 0; i < data.length; i += 4) {
                    const a = data[i + 3];
                    // Transparent pixels are composited against the panel, which
                    // is light, so they count as white for both statistics.
                    const rgb = a < 16 ? [255, 255, 255] : [data[i], data[i + 1], data[i + 2]];
                    for (let c = 0; c < 3; c++) {
                        sum[c] += rgb[c];
                        sumSq[c] += rgb[c] * rgb[c];
                    }
                    if (a < 16) continue;
                    const nearWhite = data[i] > 244 && data[i + 1] > 244 && data[i + 2] > 244;
                    if (!nearWhite) inked++;
                }
                coverage = inked / total;
                mean = [0, 1, 2].map(c => Math.round(sum[c] / total)) as [number, number, number];
                spread = Math.max(...[0, 1, 2].map(c =>
                    Math.sqrt(Math.max(0, sumSq[c] / total - (sum[c] / total) ** 2))));
            }
            bitmap.close();

            // A near-uniform tile is stored as its mean colour: seven bytes
            // instead of ~400, for a swatch that looks the same. A catalog of a
            // few hundred pale WMS overlays is otherwise almost entirely
            // base64, which does not compress.
            if (spread <= flatSpread) {
                const hex = '#' + mean.map(v => v.toString(16).padStart(2, '0')).join('');
                return { dataUrl: hex, coverage, flat: true, spread };
            }

            // Whichever encoding is smaller wins — and at swatch size that is
            // always png. A webp file carries ~740 bytes of container before
            // any pixels, so an 8px webp costs four times an 8px png; the
            // format that wins for a photo loses badly for a thumbnail. Both
            // are self-contained data: URLs, so nothing downstream cares.
            const candidates = [
                canvas.toDataURL('image/png'),
                canvas.toDataURL('image/webp', quality),
            ].filter(u => u.startsWith('data:image/'));
            candidates.sort((a, b) => a.length - b.length);
            return candidates[0] ? { dataUrl: candidates[0], coverage, flat: false, spread } : null;
        }, { base64: image.base64, mime: image.mime, size, quality, flatSpread: FLAT_SPREAD });
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
        return `${id.replace(/\/$/, '')}/full/!${size},${size}/0/default.jpg`;
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
    const config = JSON.parse(raw) as {
        baseUrl?: unknown;
        layerData?: { layers?: unknown; sources?: unknown };
    };
    const baseUrl = typeof config.baseUrl === 'string' ? config.baseUrl : null;

    // Substitute keys into the working copy only. The config TEXT we edit and
    // write back is untouched, so a key can never leak into a committed config.
    const apiKeys = await loadApiKeys(configPath);
    const layers = substituteApiKeysDeep(config.layerData?.layers, apiKeys);
    const sources = Array.isArray(config.layerData?.sources)
        ? substituteApiKeysDeep(config.layerData!.sources as LayerRecord[], apiKeys)
        : [];
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

            const isTiled = resolveRasterPreviewUrls(layer, source ?? null, 1).length > 0;
            const isWms = !isTiled && resolveWmsPreviewUrls(layer, source ?? null, REQUEST_SIZE, 1).length > 0;
            if (isTiled || isWms) {
                const kind = isTiled ? 'tile' : 'wms';
                let best: { dataUrl: string; coverage: number; flat: boolean; spread: number } | null = null;
                let lastError = 'no candidate tile';

                // Two ways a tile comes back blank, so two escapes. A tile can
                // sit in the empty part of the extent (AHN's bounds include the
                // North Sea) — walk outward to a neighbour. Or the layer's ink
                // only exists further in (cadastral parcels are hairlines that
                // vanish at regional zoom) — step the zoom in and try again.
                const tried = new Set<string>();
                for (const zoomBoost of ZOOM_ESCALATION) {
                    const urls = isTiled
                        ? resolveRasterPreviewUrls(layer, source ?? null, 9, zoomBoost)
                        : resolveWmsPreviewUrls(layer, source ?? null, REQUEST_SIZE, 9, zoomBoost);
                    // A boost past the source's maxzoom lands on the same tiles
                    // as the previous round; do not pay for them twice.
                    if (urls.length === 0 || tried.has(urls[0])) continue;
                    urls.forEach(u => tried.add(u));

                    for (const [index, url] of urls.entries()) {
                        const image = await fetchBytes(url, options.timeoutMs);
                        if (typeof image === 'string') {
                            lastError = image;
                            continue;
                        }
                        const candidate = await toSwatch(browser, image, options.size, options.quality);
                        if (!candidate) continue;
                        if (!best || candidate.coverage > best.coverage) {
                            best = candidate;
                            detail = kind
                                + (zoomBoost ? ` z+${zoomBoost}` : '')
                                + (index ? ` +${index}` : '')
                                + (candidate.flat ? ' flat' : ` spread ${candidate.spread.toFixed(0)}`);
                        }
                        if (candidate.coverage >= MIN_TILE_COVERAGE) break;
                    }
                    if (best && best.coverage >= MIN_TILE_COVERAGE) break;
                }

                swatch = best?.dataUrl ?? null;
                if (!swatch) detail = `${kind}: ${lastError}`;
            } else if (layer.type === 'style' && typeof layer.url === 'string') {
                const style = await readStyleDocument(layer.url, configPath, baseUrl, options.timeoutMs);
                swatch = style ? backgroundColorFromStyle(style) : null;
                detail = 'style background';
                if (!swatch && style) {
                    // No background layer (common for overlay styles like BAG/BGT):
                    // fall back to the same "most representative sublayer" rule the
                    // runtime uses for inline style containers.
                    //
                    // Two nestings occur. A plain maplibre style document has
                    // `layers` at the top; webmapx's own layer documents wrap
                    // the whole style under `source` (sources + layers), which
                    // is how EduGIS publishes them. Reading only the first left
                    // every osmbright-derived overlay without a colour.
                    const doc = style as { layers?: unknown; source?: { layers?: unknown } };
                    const styleLayers = doc.layers ?? doc.source?.layers;
                    const derived = deriveLayerSwatch({ type: 'style', layers: styleLayers });
                    // Judge the colour, not the kind: a style made only of
                    // symbol layers (every label overlay: place names, road
                    // names, water names) reports kind `unknown` while carrying
                    // a perfectly good text-colour.
                    if (derived.background !== NEUTRAL_SWATCH) {
                        swatch = derived.background;
                        detail = `style ${derived.kind}`;
                    }
                }
                if (!swatch) detail = style ? 'style: no derivable colour' : 'style: fetch failed';
            } else if (layer.type === 'allmaps' && typeof layer.annotation === 'string') {
                const annotation = await fetchJson(layer.annotation, options.timeoutMs);
                const thumb = annotation ? iiifThumbnailFromAnnotation(annotation, REQUEST_SIZE) : null;
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
