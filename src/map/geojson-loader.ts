import * as topojson from 'topojson-client';

/**
 * A paged source whose first page is already in `sources[id].data`. Call
 * `run(onUpdate)` to continue fetching subsequent pages in the background;
 * `onUpdate` is called with the accumulated FeatureCollection after each page.
 * Only call `run` once the source has actually been added to the map (so
 * `onUpdate`/`setSourceData` has a live source to target).
 */
export interface PagedSourceContinuation {
    id: string;
    run: (onUpdate: (data: GeoJSON.FeatureCollection) => boolean) => void;
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
export async function resolveGeoJSONSources(sources: Record<string, any>): Promise<PagedSourceContinuation[]> {
    const continuations: PagedSourceContinuation[] = [];

    const pending = Object.values(sources).filter(
        s => s && s.type === 'geojson' && typeof s.data === 'string'
    );
    await Promise.all(pending.map(async s => {
        if (s.service === 'wfs') {
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

// Page size for paged WFS/Esri requests.
const PAGE_SIZE = 10_000;

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
 * Fetches a WFS GeoJSON source's first page, sets `s.data` to it, and (if
 * the service supports paging and more features remain) returns a
 * continuation that fetches the rest in the background, calling `onUpdate`
 * with the growing FeatureCollection after each page — until either all
 * features are loaded or the combined vertex count exceeds `VERTEX_CAP`.
 */
async function fetchWFSFeatures(s: any): Promise<PagedSourceContinuation | null> {
    const supportsPaging: boolean = Boolean(s.wfsSupportsPaging);
    const isWfs2 = s.wfsVersion === '2.0.0';
    const pageSizeKey = isWfs2 ? 'COUNT' : 'MAXFEATURES';

    const baseUrl: string = s.data;
    const buildUrl = (startIndex: number): URL => {
        const url = new URL(baseUrl);
        // Strip any case-variant of the standard paging keys (the discovery
        // URL already carries one of these for the first page).
        for (const key of [...url.searchParams.keys()]) {
            if (['maxfeatures', 'count', 'startindex'].includes(key.toLowerCase())) {
                url.searchParams.delete(key);
            }
        }
        url.searchParams.set(pageSizeKey, String(PAGE_SIZE));
        if (supportsPaging && startIndex > 0) url.searchParams.set('STARTINDEX', String(startIndex));
        return url;
    };

    type Page = GeoJSON.FeatureCollection & { crs?: unknown; numberMatched?: number; numberReturned?: number };

    const fetchPage = async (startIndex: number): Promise<Page> => {
        const url = buildUrl(startIndex);
        const resp = await fetch(url.toString());
        if (!resp.ok) throw new Error(`geojson-loader: failed to fetch ${url}: ${resp.status}`);
        return await resp.json() as Page;
    };

    const first = await fetchPage(0);
    const features: GeoJSON.Feature[] = [...(first.features ?? [])];
    const crs = first.crs;
    let numberMatched = first.numberMatched;
    let vertices = 0;
    for (const f of features) vertices += countVertices(f.geometry);

    // Reported by the service in the first page's response; lets callers see
    // the true total even when truncated by `VERTEX_CAP`.
    if (numberMatched !== undefined) s.featureCount = numberMatched;

    s.data = { type: 'FeatureCollection', features, ...(crs ? { crs } : {}) } as GeoJSON.FeatureCollection;

    const reachedTotal = numberMatched !== undefined && features.length >= numberMatched;
    if (!supportsPaging || (first.features?.length ?? 0) === 0 || reachedTotal || vertices >= VERTEX_CAP) {
        return null;
    }

    return {
        id: s.id,
        run: (onUpdate) => {
            void (async () => {
                let startIndex = features.length;
                for (;;) {
                    const page = await fetchPage(startIndex);
                    const pageFeatures = page.features ?? [];
                    features.push(...pageFeatures);
                    for (const f of pageFeatures) vertices += countVertices(f.geometry);
                    numberMatched = numberMatched ?? page.numberMatched;
                    if (numberMatched !== undefined) s.featureCount = numberMatched;

                    const collection = { type: 'FeatureCollection', features, ...(crs ? { crs } : {}) } as GeoJSON.FeatureCollection;
                    s.data = collection;
                    if (!onUpdate(collection)) break; // layer removed; abort paging

                    const done = pageFeatures.length === 0
                        || (numberMatched !== undefined && features.length >= numberMatched)
                        || vertices >= VERTEX_CAP;
                    if (done) break;
                    startIndex += pageFeatures.length;
                }
            })();
        },
    };
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
