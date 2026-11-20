import * as topojson from 'topojson-client';
import { isInternalFuncUrl, resolveInternalFuncUrl } from '../utils/internal-sources';
import {
    FALLBACK_PAGE_SIZE, HITS_TIMEOUT_MS, MAX_FULL_PAGES, boxContains, fetchHitCount, growBox,
    wfsGetFeatureInfo, wfsHitsUrl, wfsPageUrl, type LonLatBox,
} from './wfs-requests';

/**
 * A paged source whose first page is already in `sources[id].data`. Call
 * `run(onUpdate)` to continue fetching subsequent pages in the background;
 * `onUpdate` is called with the accumulated FeatureCollection after each page.
 * Only call `run` once the source has actually been added to the map (so
 * `onUpdate`/`setSourceData` has a live source to target).
 */
export interface PagedSourceContinuation {
    id: string;
    /**
     * `view` lets a source follow the map: a WFS too large to load whole
     * loads what is in view, and again after every move. Without it such a
     * source stays empty.
     */
    run: (onUpdate: (data: GeoJSON.FeatureCollection) => boolean, view?: MapViewContext) => void;
}

/** What a source that follows the map view needs from the map. */
export interface MapViewContext {
    /** The map view now, as [west, south, east, north]. */
    currentBox(): LonLatBox;
    /** Calls back after every finished move; returns an unsubscribe. */
    onViewEnd(callback: (box: LonLatBox) => void): () => void;
    /** A notice for the person looking at the map. */
    notify(message: string): void;
}

/**
 * Resolves all geojson sources whose `data` is a URL string.
 * Fetches the URL, auto-detects GeoJSON vs TopoJSON by checking `type === 'Topology'`,
 * converts TopoJSON to GeoJSON if needed, and replaces `data` with the inline
 * FeatureCollection. Engines always receive inline data, never a URL.
 *
 * For TopoJSON, the URL fragment selects the object name:
 *   ./data/world.topojson#ne_50m_admin_0_map_units
 * If no fragment, uses the first object in the topology.
 *
 * For paged sources (WFS, Esri query), only the first page is awaited; the
 * returned `PagedSourceContinuation[]` lets the caller stream in further
 * pages via `setSourceData` after the source/layer has been added to the map.
 */
export async function resolveGeoJSONSources(
    sources: Record<string, any>,
    now: Date = new Date(),
    /** Fills in map-state placeholders such as `{click}`; see internal-sources. */
    prepareUrl: (url: string) => string = (url) => url,
): Promise<PagedSourceContinuation[]> {
    const continuations: PagedSourceContinuation[] = [];

    const pending = Object.values(sources).filter(
        s => s && s.type === 'geojson' && typeof s.data === 'string'
    );
    await Promise.all(pending.map(async s => {
        // Computed, not fetched: `internalfunc://day-night` and the like are
        // answered by code here rather than being sent to the network, where
        // they would fail as an unknown protocol.
        if (isInternalFuncUrl(s.data)) {
            const url = s.data;
            // Drawn for the map's own moment, not for the wall clock. A layer
            // added while the time slider holds the map at some other moment
            // would otherwise arrive showing now — the moon in the wrong place
            // and the wrong phase — and only correct itself on the next move of
            // the slider, which is the one thing nobody would think to try.
            s.data = resolveInternalFuncUrl(prepareUrl(url), now);
            // Where it came from, so a source that asked to keep itself current
            // can be asked again: once the url is replaced by the data, nothing
            // else says this source was computed.
            s.internalFuncUrl = url;
            return;
        }

        // `geoparquet://<url>`: the pmtiles:// convention, read here because
        // engines are handed inline data and never see the url.
        if (s.data.startsWith('geoparquet://')) {
            const { geoParquetUrlToGeoJSON } = await import('../utils/geoparquet');
            s.data = await geoParquetUrlToGeoJSON(s.data.slice('geoparquet://'.length));
            return;
        }

        // A GetFeature URL is a WFS whether or not the config says so.
        if (s.service === 'wfs' || (s.service === undefined && wfsGetFeatureInfo(s.data))) {
            const continuation = await fetchWFSFeatures(s);
            if (continuation) continuations.push(continuation);
            return;
        }

        if (s.service === 'esri-feature') {
            const continuation = await fetchEsriFeatures(s);
            if (continuation) continuations.push(continuation);
            return;
        }

        const url: string = s.data;
        const hashIdx = url.indexOf('#');
        const fetchUrl = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
        const objectName = hashIdx >= 0 ? url.slice(hashIdx + 1) : null;

        const resp = await fetch(fetchUrl);
        if (!resp.ok) throw new Error(`geojson-loader: failed to fetch ${fetchUrl}: ${resp.status}`);
        const json = await resp.json() as any;

        if (json?.type === 'Topology') {
            const objects = json.objects as Record<string, any>;
            const key = objectName ?? Object.keys(objects)[0];
            if (!key || !objects[key]) throw new Error(`geojson-loader: object "${key}" not found in ${fetchUrl}`);
            s.data = topojson.feature(json, objects[key]) as unknown as GeoJSON.FeatureCollection;
        } else {
            s.data = json as GeoJSON.FeatureCollection;
        }
    }));

    return continuations;
}

// Stop paging once the loaded features' combined vertex count exceeds this.
const VERTEX_CAP = 6_000_000;

// Page size for paged Esri requests.
const PAGE_SIZE = 10_000;

/** A feature's identity for de-duplicating pages: its id, or the whole feature when it has none. */
function featureKey(f: GeoJSON.Feature): string {
    return f.id !== undefined ? `id:${f.id}` : JSON.stringify(f);
}

export function countFeatureCollectionVertices(fc: GeoJSON.FeatureCollection): number {
    return (fc.features ?? []).reduce((sum, f) => sum + countVertices(f.geometry), 0);
}

function countVertices(geometry: GeoJSON.Geometry | null | undefined): number {
    if (!geometry) return 0;
    switch (geometry.type) {
        case 'GeometryCollection':
            return geometry.geometries.reduce((sum, g) => sum + countVertices(g), 0);
        case 'Point':
            return 1;
        case 'MultiPoint':
        case 'LineString':
            return geometry.coordinates.length;
        case 'MultiLineString':
        case 'Polygon':
            return geometry.coordinates.reduce((sum, ring) => sum + ring.length, 0);
        case 'MultiPolygon':
            return geometry.coordinates.reduce((sum, poly) => sum + poly.reduce((s, ring) => s + ring.length, 0), 0);
        default:
            return 0;
    }
}

/**
 * Fetches a WFS source, whole or per map view.
 *
 * Whole: when the layer's total (`featureCount`, or a hit count asked here)
 * fits in `MAX_FULL_PAGES` of the server's own page size (`wfsPageSize`, its
 * published CountDefault), the first page is awaited and the rest stream in
 * through the continuation.
 *
 * Per view: otherwise — and when the total is unknown, or too slow to count —
 * `s.data` starts empty and the continuation loads what is in the map view,
 * again whole if it fits in `MAX_FULL_PAGES` pages and one page otherwise,
 * with a notice that there is more to see when zoomed in.
 */
async function fetchWFSFeatures(s: any): Promise<PagedSourceContinuation | null> {
    const baseUrl: string = s.data;
    const version: string = String(s.wfsVersion ?? wfsGetFeatureInfo(baseUrl)?.version ?? '2.0.0');
    const pageSize: number = Number(s.wfsPageSize) > 0 ? Number(s.wfsPageSize) : FALLBACK_PAGE_SIZE;
    // Paging (STARTINDEX) is part of WFS 2.0; a 1.x server may support it as
    // a vendor extension, which discovery reports through wfsSupportsPaging.
    const supportsPaging: boolean = s.wfsSupportsPaging ?? version.startsWith('2');

    type Page = GeoJSON.FeatureCollection & { crs?: unknown; numberMatched?: number; numberReturned?: number };
    const fetchPage = async (startIndex: number, box?: LonLatBox, signal?: AbortSignal): Promise<Page> => {
        const url = wfsPageUrl(baseUrl, { version, pageSize, startIndex, box });
        const resp = await fetch(url, { signal });
        if (!resp.ok) throw new Error(`geojson-loader: failed to fetch ${url}: ${resp.status}`);
        return await resp.json() as Page;
    };
    const collection = (features: GeoJSON.Feature[], crs?: unknown) =>
        ({ type: 'FeatureCollection', features, ...(crs ? { crs } : {}) }) as GeoJSON.FeatureCollection;

    const total: number | undefined = Number.isFinite(s.featureCount)
        ? Number(s.featureCount)
        : await fetchHitCount(wfsHitsUrl(baseUrl, { version }));
    if (total !== undefined) s.featureCount = total;

    if (total === undefined || Math.ceil(total / pageSize) > MAX_FULL_PAGES) {
        s.data = collection([]);
        s.wfsPerView = true;
        return { id: s.id, run: (onUpdate, view) => runPerView(onUpdate, view) };
    }

    const first = await fetchPage(0);
    const features: GeoJSON.Feature[] = [...(first.features ?? [])];
    const crs = first.crs;
    let vertices = 0;
    for (const f of features) vertices += countVertices(f.geometry);
    s.data = collection(features, crs);

    if (!supportsPaging || features.length === 0 || total <= pageSize || vertices >= VERTEX_CAP) {
        return null;
    }

    return {
        id: s.id,
        run: (onUpdate) => {
            void (async () => {
                // By the page size, as in the per-view loop below.
                const seen = new Set(features.map(featureKey));
                for (let start = pageSize; start < total; start += pageSize) {
                    const page = await fetchPage(start);
                    const pageFeatures = (page.features ?? []).filter((f) => {
                        const key = featureKey(f);
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    });
                    if (!page.features?.length) break;
                    features.push(...pageFeatures);
                    for (const f of pageFeatures) vertices += countVertices(f.geometry);
                    s.data = collection(features, crs);
                    if (!onUpdate(s.data)) break; // layer removed; abort paging
                    if (vertices >= VERTEX_CAP) break;
                }
            })();
        },
    };

    function runPerView(onUpdate: (data: GeoJSON.FeatureCollection) => boolean, view?: MapViewContext): void {
        if (!view) return; // nothing to follow: the source stays empty
        // The box last loaded in full. A view inside it needs no request: what
        // is drawn is already everything there is.
        let covered: LonLatBox | null = null;
        let generation = 0;
        let ctrl: AbortController | null = null;
        let warned = false;
        let unsubscribe: (() => void) | null = null;

        const load = async (viewBox: LonLatBox): Promise<void> => {
            if (covered && boxContains(covered, viewBox)) return;
            // A margin, so a small pan stays inside what was loaded.
            const box = growBox(viewBox, 0.25);
            const mine = ++generation;
            ctrl?.abort();
            ctrl = new AbortController();
            const signal = ctrl.signal;

            // Counted alongside the first page, not after it. A page short of
            // COUNT does not prove the view complete: MapServer (PDOK) fills a
            // page from index candidates and then drops the ones whose geometry
            // misses the box, so 1000 asked can come back as 984 out of 69,343 —
            // with numberMatched="984" on the page itself.
            const hitsCtrl = new AbortController();
            signal.addEventListener('abort', () => hitsCtrl.abort());
            const hits = fetchHitCount(wfsHitsUrl(baseUrl, { version, box }), HITS_TIMEOUT_MS, hitsCtrl.signal);

            const first = await fetchPage(0, box, signal);
            if (mine !== generation) { hitsCtrl.abort(); return; }
            const features: GeoJSON.Feature[] = [...(first.features ?? [])];
            // A page less than half full was not cut off by the page size; the
            // count, possibly slow, is not needed. Otherwise the count decides,
            // and one that takes too long is answer enough: a great many.
            let n: number | undefined;
            if (features.length < pageSize / 2) {
                hitsCtrl.abort();
                n = features.length;
            } else {
                n = await hits;
            }
            if (mine !== generation) return;
            let complete = n !== undefined && (features.length >= n || n <= pageSize);

            if (!complete && n !== undefined && supportsPaging && Math.ceil(n / pageSize) <= MAX_FULL_PAGES) {
                // Step by the page size, not by what came back: a page cut short
                // by the server's own filtering still used up its index range.
                const seen = new Set(features.map(featureKey));
                for (let start = pageSize; start < n; start += pageSize) {
                    const page = await fetchPage(start, box, signal);
                    if (mine !== generation) return;
                    if (!page.features?.length) break;
                    for (const f of page.features) {
                        const key = featureKey(f);
                        if (!seen.has(key)) { seen.add(key); features.push(f); }
                    }
                }
                complete = true;
            }

            s.data = collection(features, first.crs);
            if (!onUpdate(s.data)) { stop(); return; }
            covered = complete ? box : null;
            if (complete) {
                warned = false;
            } else if (!warned) {
                warned = true;
                view.notify(n !== undefined
                    ? `${features.length.toLocaleString()} of ${n.toLocaleString()} features shown. Zoom in to see them all.`
                    : `Showing the first ${features.length.toLocaleString()} features here. Zoom in to see them all.`);
            }
        };
        const stop = () => { unsubscribe?.(); unsubscribe = null; ctrl?.abort(); };
        const run = (box: LonLatBox) => { load(box).catch(() => { /* aborted or failed: the next view tries again */ }); };
        unsubscribe = view.onViewEnd(run);
        run(view.currentBox());
    }
}

/**
 * Fetches an Esri MapServer/FeatureServer `query` GeoJSON source's first
 * page, sets `s.data` to it, and (if the service reports
 * `exceededTransferLimit`) returns a continuation that pages via
 * `resultOffset`/`resultRecordCount` in the background, calling `onUpdate`
 * with the growing FeatureCollection after each page.
 */
async function fetchEsriFeatures(s: any): Promise<PagedSourceContinuation | null> {
    type Page = GeoJSON.FeatureCollection & { exceededTransferLimit?: boolean };

    const baseUrl: string = s.data;
    const fetchPage = async (resultOffset: number): Promise<Page> => {
        const url = new URL(baseUrl);
        url.searchParams.set('resultRecordCount', String(PAGE_SIZE));
        url.searchParams.set('resultOffset', String(resultOffset));
        const resp = await fetch(url.toString());
        if (!resp.ok) throw new Error(`geojson-loader: failed to fetch ${url}: ${resp.status}`);
        return await resp.json() as Page;
    };

    const first = await fetchPage(0);
    const features: GeoJSON.Feature[] = [...(first.features ?? [])];
    let vertices = 0;
    for (const f of features) vertices += countVertices(f.geometry);

    s.data = { type: 'FeatureCollection', features } as GeoJSON.FeatureCollection;

    if (!first.exceededTransferLimit || features.length === 0 || vertices >= VERTEX_CAP) {
        return null;
    }

    return {
        id: s.id,
        run: (onUpdate) => {
            void (async () => {
                let resultOffset = features.length;
                for (;;) {
                    const page = await fetchPage(resultOffset);
                    const pageFeatures = page.features ?? [];
                    features.push(...pageFeatures);
                    for (const f of pageFeatures) vertices += countVertices(f.geometry);

                    const collection = { type: 'FeatureCollection', features } as GeoJSON.FeatureCollection;
                    s.data = collection;
                    if (!onUpdate(collection)) break; // layer removed; abort paging

                    const done = !page.exceededTransferLimit || pageFeatures.length === 0 || vertices >= VERTEX_CAP;
                    if (done) break;
                    resultOffset += pageFeatures.length;
                }
            })();
        },
    };
}
