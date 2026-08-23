/**
 * Reading and rewriting the WMS request a raster source stands for.
 *
 * A WMS source is spelled two ways in real configs — a bare endpoint with
 * `layers` as a sibling key, or the GetMap query already baked into the url —
 * and the second is by far the more common. Both must be understood, and a
 * rewrite must keep every other parameter the service was given.
 *
 * The url itself is a string, an array of strings (one per subdomain), or lives
 * under `tiles`; missing one of those shapes silently drops a layer.
 */

export interface WmsSourceInfo {
    /** GetCapabilities/GetMap endpoint, without the request parameters. */
    endpoint: string;
    /** The WMS layer(s) this source draws, as the `layers` parameter spells them. */
    layers: string;
    /** The named style in force. Empty string is the service's default. */
    style: string;
    version?: string;
}

/**
 * A source url may be relative to the page (webmapx must run from any
 * subdirectory), and this module is also read by tests with no document, so the
 * base is taken from the document only when there is one.
 */
function toUrl(raw: string): URL {
    const base = typeof window !== 'undefined' ? window.location.href : 'http://localhost/';
    return new URL(raw, base);
}

/** Where a source keeps its url, and in what shape. */
type UrlSlot = { key: 'url' | 'tiles'; array: boolean };

function urlsOf(source: Record<string, unknown>): { urls: string[]; slot: UrlSlot } | null {
    for (const key of ['url', 'tiles'] as const) {
        const value = source[key];
        if (typeof value === 'string') return { urls: [value], slot: { key, array: false } };
        if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
            return { urls: value as string[], slot: { key, array: true } };
        }
    }
    return null;
}

/** Case-insensitive read of a query parameter, since WMS spells them any way. */
function param(params: URLSearchParams, name: string): string | null {
    for (const [key, value] of params.entries()) {
        if (key.toLowerCase() === name) return value;
    }
    return null;
}

/**
 * What WMS request this source stands for, or `null` when it is not WMS at all.
 * A source that names no layer cannot be restyled and counts as not-WMS here.
 */
export function readWmsSource(source: Record<string, unknown> | null | undefined): WmsSourceInfo | null {
    if (!source || typeof source !== 'object') return null;
    const found = urlsOf(source);
    if (!found) return null;

    const [first] = found.urls;
    let url: URL;
    try {
        url = toUrl(first);
    } catch (_) {
        return null;
    }
    const params = url.searchParams;
    const service = param(params, 'service');
    const request = param(params, 'request');
    const declared = typeof source.service === 'string' ? source.service.toLowerCase() : '';

    const looksWms = declared === 'wms'
        || service?.toLowerCase() === 'wms'
        || request?.toLowerCase() === 'getmap';
    if (!looksWms) return null;

    // The sibling key wins only when the url carries no `layers` of its own:
    // a baked GetMap url is what the service is actually being asked for.
    const layers = param(params, 'layers')
        ?? (typeof source.layers === 'string' ? source.layers : '');
    if (!layers) return null;

    const endpoint = new URL(url.href);
    endpoint.search = '';
    return {
        endpoint: endpoint.href,
        layers,
        style: param(params, 'styles') ?? (typeof source.styles === 'string' ? source.styles : ''),
        version: param(params, 'version') ?? (typeof source.version === 'string' ? source.version : undefined),
    };
}

/**
 * The same source asking for a different named style.
 *
 * Every other parameter is left exactly as it was: a WMS url carries width,
 * height, bbox placeholders and service-specific extras that the map depends on,
 * and rebuilding the url from parts would quietly drop them.
 */
/**
 * One GetMap url asking for a different named style.
 *
 * Used on the urls the *engine* built as well as on the ones the config
 * declared: the bare-endpoint spelling has no request url of its own, so the
 * only place its `STYLES` can be changed is the url the engine assembled.
 */
export function withWmsStyleUrl(raw: string, style: string): string {
    let url: URL;
    try {
        url = toUrl(raw);
    } catch (_) {
        return raw;
    }
    let had = false;
    for (const key of [...url.searchParams.keys()]) {
        if (key.toLowerCase() === 'styles') {
            url.searchParams.set(key, style);
            had = true;
        }
    }
    if (!had) url.searchParams.set('STYLES', style);
    // `{bbox-epsg-3857}` and friends must survive: URL encodes the braces.
    return decodeURIComponent(url.href);
}

export function withWmsStyle(
    source: Record<string, unknown>,
    style: string,
): Record<string, unknown> {
    const found = urlsOf(source);
    if (!found) return { ...source, styles: style };

    const rewritten = found.urls.map((raw) => withWmsStyleUrl(raw, style));

    const next = { ...source };
    next[found.slot.key] = found.slot.array ? rewritten : rewritten[0];
    // The bare-endpoint spelling keeps its parameters as sibling keys, and the
    // engine builds the request from those rather than from the url.
    if (typeof source.styles === 'string' || !source.url || !String(source.url).includes('?')) {
        next.styles = style;
    }
    return next;
}

export interface WmsStyleOption {
    name: string;
    title: string;
    legendUrl?: string;
}

/**
 * The named styles the service advertises for this layer.
 *
 * Read from GetCapabilities on demand — a style list is only wanted when
 * someone opens the panel on a WMS layer, and fetching it up front would put a
 * request to a third-party service behind every layer that is merely listed.
 */
export async function fetchWmsStyles(info: WmsSourceInfo): Promise<WmsStyleOption[]> {
    const { WmsEndpoint } = await import('@camptocamp/ogc-client');
    const endpoint = await new WmsEndpoint(info.endpoint).isReady();
    // `layers` may name several; the first is the one whose styles apply to all.
    const first = info.layers.split(',')[0].trim();
    const layer = endpoint.getLayerByName(first);
    return (layer?.styles ?? []).map((style) => ({
        name: style.name,
        title: style.title || style.name,
        ...(style.legendUrl ? { legendUrl: style.legendUrl } : {}),
    }));
}
