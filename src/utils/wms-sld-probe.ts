/**
 * Does this service draw a style of our own?
 *
 * The capabilities document is supposed to say — `<UserDefinedSymbolization
 * SupportSLD="1" UserStyle="1">` — and measured against our own configs it is
 * worthless: of twenty WMS endpoints in `nl.json` and `world.json`, the only
 * four that declare the element declare `0`, while the two that actually honour
 * `SLD_BODY` (PDOK's physical-geographic regions, RCE's monuments) declare
 * nothing at all. So the flag is read as a hint and the answer is *measured*:
 * the same GetMap twice, once plain and once with a user style that paints the
 * layer one flat colour, and the images compared.
 *
 * Two ways that goes wrong, both of which return "no" when the truth is "yes":
 *
 * - **A blank sample.** A layer that draws nothing here — BAG buildings at
 *   country zoom, where the service's own minimum scale suppresses them —
 *   returns the same empty tile both times. So the sample must be checked for
 *   ink before the comparison is believed, and that same inked pixel is what
 *   `wms-attributes` needs for a GetFeatureInfo that hits something.
 * - **A service exception.** Answered as an image by some services and as XML
 *   by others; either way it is not evidence about SLD.
 */
import { buildSld, withSldBodyUrl, URL_TOO_LONG_STATUS, type SldGeometry } from './wms-sld';
import type { WmsSourceInfo } from './wms-source';

export interface SldProbeSample {
    /** `west,south,east,north` in EPSG:3857, the area drawn for the probe. */
    bbox: [number, number, number, number];
    /**
     * The image size to ask for, which is what fixes the *scale* of the
     * request — and scale, not place, is what a WMS usually withholds data by.
     * Measured against PDOK's BAG: the same downtown bbox is blank at 256
     * pixels (1:15576) and drawn at 384 (1:10384), because the service
     * suppresses buildings above about 1:12000. A probe that always asked for
     * 256 pixels was therefore coarser than the map's own tiles and came back
     * empty about a screen full of buildings.
     */
    size?: [number, number];
}

export interface SldProbeResult {
    supported: boolean;
    /** Why not, when not — the panel says this rather than staying silent. */
    reason?: 'no-ink' | 'ignored' | 'error';
    /**
     * Where the sample had ink, for a GetFeatureInfo that hits a feature. The
     * image size travels with it: a pixel means nothing without the request it
     * was found in.
     */
    hit?: { i: number; j: number; bbox: [number, number, number, number]; size: [number, number] };
    /**
     * What the layer draws, learned from which symbolizer changed the picture.
     *
     * A WMS never says, and it cannot be guessed: a style carrying only a
     * PolygonSymbolizer draws *nothing* on a line layer (PDOK's roads come back
     * blank), while a style carrying all three puts a circle on every vertex of
     * a polygon. Since the probe is already drawing the layer twice, it settles
     * this at the same time — one request per candidate, once per service.
     */
    geometry?: SldGeometry;
}

const PROBE_SIZE = 256;
/**
 * Opaque enough to be a feature rather than its antialiased edge.
 *
 * Two thresholds, because the question is asked twice for different reasons: a
 * pixel *to ask GetFeatureInfo about* must be solidly inside a feature, while
 * "does this layer draw anything here" must still say yes for a view drawn into
 * a small image, where a thin building survives only as a faint smear.
 */
const INK_ALPHA = 200;
const FAINT_ALPHA = 48;
/** Below this share of drawn pixels, a sample counts as blank. */
const BLANK_FRACTION = 0.002;
/** The same judgement without a decoder: a blank PNG is a few hundred bytes. */
const BLANK_BYTES = 4000;

/** Probing is a request to a third-party service, so it is done once. */
const cache = new Map<string, Promise<SldProbeResult>>();

function probeCacheKey(info: WmsSourceInfo): string {
    return `${info.endpoint}|${info.layers}`;
}

/** A GetMap for the probe: one tile, transparent, in the area given. */
export function probeGetMapUrl(
    info: WmsSourceInfo,
    bbox: [number, number, number, number],
    extra: Record<string, string> = {},
    size: [number, number] = [PROBE_SIZE, PROBE_SIZE],
): string {
    const url = new URL(info.endpoint);
    const version = info.version && /^1\.[0-3]\.\d$/.test(info.version) ? info.version : '1.3.0';
    const params: Record<string, string> = {
        SERVICE: 'WMS', VERSION: version, REQUEST: 'GetMap',
        LAYERS: info.layers, STYLES: '', FORMAT: 'image/png', TRANSPARENT: 'true',
        WIDTH: String(Math.round(size[0])), HEIGHT: String(Math.round(size[1])),
        // EPSG:3857 is axis-order-free, unlike 4326, whose axes swap between
        // WMS 1.1 and 1.3 — a swapped bbox draws the wrong place and looks
        // exactly like a layer with no data.
        [version === '1.3.0' ? 'CRS' : 'SRS']: 'EPSG:3857',
        BBOX: bbox.join(','),
        ...extra,
    };
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    return url.href;
}

/**
 * The opaque pixel nearest the centre of an image, or null if it carries none.
 *
 * Nearest the centre because the middle of a drawn area is more likely to be a
 * whole feature than the edge of the image is, and a server asked about a pixel
 * on a feature's boundary may answer with nothing.
 */
export function inkedPixel(
    pixels: Uint8ClampedArray | Uint8Array,
    width: number,
    height: number,
    minAlpha: number = INK_ALPHA,
): { i: number; j: number } | null {
    let best: { i: number; j: number; d: number } | null = null;
    const cx = width / 2;
    const cy = height / 2;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const at = (y * width + x) * 4;
            if (pixels[at + 3] < minAlpha) continue;
            const d = (x - cx) ** 2 + (y - cy) ** 2;
            if (!best || d < best.d) best = { i: x, j: y, d };
        }
    }
    return best ? { i: best.i, j: best.j } : null;
}

/** Decodes a PNG the browser has already fetched. Null where there is no DOM. */
async function pixelsOf(blob: Blob): Promise<{ data: Uint8ClampedArray; width: number; height: number } | null> {
    if (typeof createImageBitmap !== 'function') return null;
    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(blob);
    } catch (_) {
        return null;
    }
    const canvas = typeof OffscreenCanvas === 'function'
        ? new OffscreenCanvas(bitmap.width, bitmap.height)
        : Object.assign(document.createElement('canvas'), { width: bitmap.width, height: bitmap.height });
    const context = (canvas as OffscreenCanvas).getContext('2d') as
        OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
    if (!context) return null;
    context.drawImage(bitmap, 0, 0);
    const image = context.getImageData(0, 0, bitmap.width, bitmap.height);
    bitmap.close?.();
    return { data: image.data, width: image.width, height: image.height };
}

async function bytesOf(response: Response): Promise<{ blob: Blob; bytes: Uint8Array } | null> {
    if (!response.ok) return null;
    const type = response.headers.get('content-type') ?? '';
    // A service exception is not evidence either way, whatever it is dressed as.
    if (/xml|text|html/.test(type)) return null;
    const buffer = await response.arrayBuffer();
    return { blob: new Blob([buffer], { type }), bytes: new Uint8Array(buffer) };
}

/** How much of an image is drawn on, for telling a blank answer from a real one. */
function inkCount(pixels: Uint8ClampedArray): number {
    let count = 0;
    for (let at = 3; at < pixels.length; at += 4) {
        if (pixels[at] >= FAINT_ALPHA) count++;
    }
    return count;
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

/**
 * Asks the service, over each area in turn until one of them has ink.
 *
 * The areas are the caller's: the current view first, since that is what the
 * user is looking at, then the layer's own extent. A layer that draws nothing
 * in either is reported as `no-ink` rather than as unsupported — the difference
 * matters, because the first is "move the map and try again".
 */
export async function probeSldSupport(
    info: WmsSourceInfo,
    samples: SldProbeSample[],
    fetchImpl: typeof fetch = fetch,
): Promise<SldProbeResult> {
    for (const sample of samples) {
        try {
            const size = sample.size ?? [PROBE_SIZE, PROBE_SIZE];
            const plain = await bytesOf(await fetchImpl(probeGetMapUrl(info, sample.bbox, {}, size)));
            if (!plain) continue;
            const decoded = await pixelsOf(plain.blob);
            // Without a decoder there is no way to tell blank from drawn, so
            // the comparison is made anyway: a false "ignored" is recoverable,
            // and this path is only reached outside a browser.
            // A solid pixel is wanted, but any ink at all is enough to know the
            // layer draws here — and a view scaled into one small image leaves
            // little that is solid.
            const hit = decoded
                ? inkedPixel(decoded.data, decoded.width, decoded.height)
                    ?? inkedPixel(decoded.data, decoded.width, decoded.height, FAINT_ALPHA)
                : { i: Math.round(size[0] / 2), j: Math.round(size[1] / 2) };
            if (!hit) continue;

            const layer = info.layers.split(',')[0].trim();
            const draw = async (geometry: SldGeometry) => {
                const sld = buildSld(layer, geometry, {
                    kind: 'single', color: '#ff00ff', strokeColor: '#ff00ff', strokeWidth: 4, size: 12,
                });
                return bytesOf(await fetchImpl(withSldBodyUrl(probeGetMapUrl(info, sample.bbox, {}, size), sld)));
            };

            // `unknown` carries every symbolizer as its own rule, so it draws
            // whatever the data turns out to be: one request settles whether
            // the service honours a style of ours at all.
            const styled = await draw('unknown');
            if (!styled) return { supported: false, reason: 'error' };
            if (sameBytes(plain.bytes, styled.bytes)) return { supported: false, reason: 'ignored' };

            // Then *which* geometry, by elimination in order of specificity.
            // Two readings had to be discarded first, both measured: comparing
            // with the service's own style calls every layer a polygon (a
            // blank answer differs from the default just as much as a correct
            // one), and taking whichever candidate draws the *most* calls a
            // road layer points (a circle on every vertex out-inks a thin
            // line). What holds is that a symbolizer draws nothing at all on
            // geometry it does not match: areas only fill polygons, strokes
            // follow lines and polygon outlines, marks land on any vertex. So
            // the first candidate that draws anything is the answer.
            let geometry: SldGeometry = 'unknown';
            for (const candidate of ['polygon', 'line', 'point'] as const) {
                const attempt = await draw(candidate);
                if (!attempt) continue;
                const pixels = await pixelsOf(attempt.blob);
                const drew = pixels
                    ? inkCount(pixels.data) > pixels.width * pixels.height * BLANK_FRACTION
                    // Without a decoder, a blank PNG's size is the only signal:
                    // a few hundred bytes against tens of thousands.
                    : attempt.bytes.length > BLANK_BYTES;
                if (drew) {
                    geometry = candidate;
                    break;
                }
            }
            return { supported: true, geometry, hit: { ...hit, bbox: sample.bbox, size } };
        } catch (_) {
            return { supported: false, reason: 'error' };
        }
    }
    return { supported: false, reason: 'no-ink' };
}

/**
 * The same question, asked once per service — but only once it has an answer
 * *about the service*.
 *
 * `supported` and `ignored` are properties of the service and hold for the
 * session. `no-ink` and `error` are properties of the moment: the layer drew
 * nothing where the map happened to be looking, or a request failed. Caching
 * those poisons the whole session — a panel opened before zooming in would
 * answer "this layer draws nothing here" for good, and reopening it after
 * zooming to the buildings would repeat the stale answer rather than look
 * again. So a momentary answer is dropped from the cache and the next open
 * re-probes.
 */
export function probeSldSupportCached(
    info: WmsSourceInfo,
    samples: SldProbeSample[],
    fetchImpl: typeof fetch = fetch,
    options: { force?: boolean } = {},
): Promise<SldProbeResult> {
    const key = probeCacheKey(info);
    // "Look again" must reach the service, whatever is remembered: a remembered
    // answer is the one thing the user is disagreeing with when they press it.
    if (options.force) cache.delete(key);
    const known = options.force ? undefined : cache.get(key);
    if (known) return known;
    const probe = probeSldSupport(info, samples, fetchImpl).then((result) => {
        if (!result.supported && result.reason !== 'ignored') cache.delete(key);
        return result;
    });
    cache.set(key, probe);
    return probe;
}

/** Testing seam: a probe result must not outlive the test that made it. */
export function clearSldProbeCache(): void {
    cache.clear();
}

export type StyledRequestProblem = 'too-long' | 'rejected' | 'unreachable';

export interface StyledRequestCheck {
    ok: boolean;
    problem?: StyledRequestProblem;
    /** The service's own words, when it gave any. */
    detail?: string;
    status?: number;
}

/**
 * Whether the service will answer the request this style produces.
 *
 * Run *after* the style is applied and only then — the alternative was a
 * guessed url-length ceiling, which is a number this code cannot know: it
 * differs per service and per endpoint. This is one request, for a tile the map
 * is about to ask for anyway, so it warms the service's cache rather than
 * adding anything to it.
 *
 * A refusal is read as a length problem only when the service says so (414 or
 * 431): every other failure is about the document or the network, and telling a
 * user to use fewer classes when their SLD is malformed sends them the wrong
 * way entirely.
 */
export async function verifyStyledRequest(
    url: string,
    fetchImpl: typeof fetch = fetch,
): Promise<StyledRequestCheck> {
    let response: Response;
    try {
        response = await fetchImpl(url);
    } catch (error) {
        // A url long enough to be refused at the front door often fails as a
        // network error in the browser rather than as a status, so length is
        // reported whenever the request was one of the very long ones.
        return {
            ok: false,
            problem: url.length > 7000 ? 'too-long' : 'unreachable',
            detail: String((error as Error)?.message ?? error),
        };
    }
    if (URL_TOO_LONG_STATUS.includes(response.status)) {
        return { ok: false, problem: 'too-long', status: response.status };
    }
    const type = response.headers.get('content-type') ?? '';
    if (!response.ok) {
        return { ok: false, problem: 'rejected', status: response.status };
    }
    if (/xml|text|html/.test(type)) {
        const body = await response.text();
        // A WMS exception is the service explaining what it disliked; its own
        // words beat anything this code could infer.
        // `[^>]*` alone also matches `<ServiceExceptionReport>`, whose content
        // starts with the exception's own opening tag.
        const said = /<ServiceException(?:\s[^>]*)?>([\s\S]*?)<\/ServiceException>/i.exec(body)?.[1]?.trim();
        return { ok: false, problem: 'rejected', detail: said?.replace(/\s+/g, ' ').slice(0, 200) };
    }
    return { ok: true };
}
