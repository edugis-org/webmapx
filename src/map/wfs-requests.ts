// src/map/wfs-requests.ts
// WFS GetFeature URLs for a bounding box, page or hit count, and reading the
// count back. Engine-agnostic: plain URLs and strings only.

/** [west, south, east, north] in WGS84 degrees. */
export type LonLatBox = [number, number, number, number];

/**
 * The most pages a layer may take to load in full. More than this and it loads
 * per map view instead, one page per view. It counts requests, not features: a
 * server that pages points by 100,000 and one that pages detailed polygons by
 * 100 are both judged by what their own publisher thought one request should
 * carry.
 */
export const MAX_FULL_PAGES = 5;

/**
 * The page size for a server that publishes none (WFS 1.x has no CountDefault,
 * and some 2.0 servers leave it out). The number the layer repository falls
 * back to as well.
 */
export const FALLBACK_PAGE_SIZE = 1000;

/** How long a hit count may take before it is read as "a great many". */
export const HITS_TIMEOUT_MS = 3000;

const PAGING_KEYS = ['count', 'maxfeatures', 'startindex', 'resulttype', 'bbox'];

function getParam(url: URL, name: string): string | undefined {
    for (const [k, v] of url.searchParams) if (k.toLowerCase() === name) return v;
    return undefined;
}

function deleteParams(url: URL, names: string[]): void {
    for (const key of [...url.searchParams.keys()]) {
        if (names.includes(key.toLowerCase())) url.searchParams.delete(key);
    }
}

/**
 * Whether a URL is a WFS GetFeature request, and for which version. Used for
 * GeoJSON sources written as a plain GetFeature URL, with no `service: 'wfs'`.
 */
export function wfsGetFeatureInfo(urlText: string): { version: string; typeName: string } | null {
    let url: URL;
    try { url = new URL(urlText); } catch { return null; }
    if (getParam(url, 'request')?.toLowerCase() !== 'getfeature') return null;
    const service = getParam(url, 'service');
    if (service && service.toUpperCase() !== 'WFS') return null;
    const typeName = getParam(url, 'typenames') ?? getParam(url, 'typename');
    if (!typeName) return null;
    return { version: getParam(url, 'version') ?? '2.0.0', typeName };
}

/**
 * BBOX in the form each version reads without argument. 1.1 and 2.0 take a
 * CRS URN, and EPSG::4326 as a URN is latitude first; 1.0 takes EPSG:4326 in
 * longitude-first order.
 */
export function wfsBboxParam(version: string, box: LonLatBox): string {
    const [w, s, e, n] = box;
    if (version.startsWith('1.0')) return `${w},${s},${e},${n},EPSG:4326`;
    return `${s},${w},${n},${e},urn:ogc:def:crs:EPSG::4326`;
}

/** A GetFeature for one page, optionally limited to a box. */
export function wfsPageUrl(base: string, opts: {
    version: string; pageSize: number; startIndex?: number; box?: LonLatBox;
}): string {
    const url = new URL(base);
    deleteParams(url, PAGING_KEYS);
    const is2 = opts.version.startsWith('2');
    url.searchParams.set(is2 ? 'COUNT' : 'MAXFEATURES', String(opts.pageSize));
    if (opts.startIndex) url.searchParams.set('STARTINDEX', String(opts.startIndex));
    if (opts.box) url.searchParams.set('BBOX', wfsBboxParam(opts.version, opts.box));
    return url.toString();
}

/**
 * A hit count, optionally for a box. The output format is dropped: a count
 * comes back as GML whatever is asked, and some servers answer a JSON hits
 * request with an empty FeatureCollection and no number at all.
 */
export function wfsHitsUrl(base: string, opts: { version: string; box?: LonLatBox }): string {
    const url = new URL(base);
    deleteParams(url, [...PAGING_KEYS, 'outputformat']);
    url.searchParams.set('RESULTTYPE', 'hits');
    if (opts.box) url.searchParams.set('BBOX', wfsBboxParam(opts.version, opts.box));
    return url.toString();
}

/** numberMatched (2.0) or numberOfFeatures (1.1) from a hits answer; undefined when "unknown" or absent. */
export function parseHitCount(xml: string): number | undefined {
    const m = /\bnumber(?:Matched|OfFeatures)\s*=\s*"(\d+)"/.exec(xml);
    return m ? Number(m[1]) : undefined;
}

/** Fetch a hit count, giving up after `timeoutMs`. Undefined: unknown, failed or too slow. */
export async function fetchHitCount(url: string, timeoutMs = HITS_TIMEOUT_MS, signal?: AbortSignal): Promise<number | undefined> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const onAbort = () => ctrl.abort();
    signal?.addEventListener('abort', onAbort);
    try {
        const resp = await fetch(url, { signal: ctrl.signal });
        if (!resp.ok) return undefined;
        return parseHitCount(await resp.text());
    } catch {
        return undefined;
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
    }
}

/** A box around a clicked point, `tolerancePx` screen pixels each way at web-mercator `zoom` (512-px tiles). */
export function clickBox(lngLat: [number, number], zoom: number, tolerancePx: number): LonLatBox {
    const degPerPx = 360 / (512 * Math.pow(2, zoom));
    const dLon = tolerancePx * degPerPx;
    const dLat = dLon * Math.cos(lngLat[1] * Math.PI / 180);
    return [lngLat[0] - dLon, lngLat[1] - dLat, lngLat[0] + dLon, lngLat[1] + dLat];
}

/**
 * The map view as a box, from its centre, zoom and size in CSS pixels
 * (web-mercator, 512-px tiles, as every engine reports zoom here). Used only
 * until the map reports its first real bounds.
 */
export function viewBox(center: [number, number], zoom: number, width: number, height: number): LonLatBox {
    const R = 6378137;
    const mPerPx = 2 * Math.PI * R / (512 * Math.pow(2, zoom));
    const cx = center[0] * Math.PI / 180 * R;
    const cy = Math.log(Math.tan(Math.PI / 4 + center[1] * Math.PI / 360)) * R;
    const toLon = (x: number) => Math.max(-180, Math.min(180, x / R * 180 / Math.PI));
    const toLat = (y: number) => Math.max(-85.0511, Math.min(85.0511, (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * 180 / Math.PI));
    return [toLon(cx - width / 2 * mPerPx), toLat(cy - height / 2 * mPerPx), toLon(cx + width / 2 * mPerPx), toLat(cy + height / 2 * mPerPx)];
}

/** `outer` contains `inner` entirely. */
export function boxContains(outer: LonLatBox, inner: LonLatBox): boolean {
    return outer[0] <= inner[0] && outer[1] <= inner[1] && outer[2] >= inner[2] && outer[3] >= inner[3];
}

/** `box` grown by `fraction` of its width and height on every side. */
export function growBox(box: LonLatBox, fraction: number): LonLatBox {
    const dx = (box[2] - box[0]) * fraction, dy = (box[3] - box[1]) * fraction;
    return [Math.max(-180, box[0] - dx), Math.max(-90, box[1] - dy), Math.min(180, box[2] + dx), Math.min(90, box[3] + dy)];
}
