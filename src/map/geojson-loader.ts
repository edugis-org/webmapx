import * as topojson from 'topojson-client';

/**
 * Resolves all geojson sources whose `data` is a URL string.
 * Fetches the URL, auto-detects GeoJSON vs TopoJSON by checking `type === 'Topology'`,
 * converts TopoJSON to GeoJSON if needed, and replaces `data` with the inline
 * FeatureCollection. Engines always receive inline data, never a URL.
 *
 * For TopoJSON, the URL fragment selects the object name:
 *   ./data/world.topojson#ne_50m_admin_0_map_units
 * If no fragment, uses the first object in the topology.
 */
export async function resolveGeoJSONSources(sources: Record<string, any>): Promise<void> {
    const pending = Object.values(sources).filter(
        s => s && s.type === 'geojson' && typeof s.data === 'string'
    );
    await Promise.all(pending.map(async s => {
        if (s.service === 'wfs') {
            s.data = await fetchWFSFeatures(s);
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
}

/**
 * Fetches a WFS GeoJSON source, paging via startIndex when the service
 * supports it (`wfsSupportsPaging`) until either all features are returned
 * or `wfsMaxFeatures` is reached. The source's `data` URL already requests
 * `maxFeatures`/`COUNT` of one page (set by layer-discovery); each subsequent
 * page reuses that URL with startIndex/COUNT or STARTINDEX/MAXFEATURES
 * overridden depending on WFS version.
 */
async function fetchWFSFeatures(s: any): Promise<GeoJSON.FeatureCollection> {
    const cap: number = s.wfsMaxFeatures ?? Infinity;
    const supportsPaging: boolean = Boolean(s.wfsSupportsPaging);
    const isWfs2 = s.wfsVersion === '2.0.0';
    const pageSizeKey = isWfs2 ? 'COUNT' : 'MAXFEATURES';

    const features: GeoJSON.Feature[] = [];
    let startIndex = 0;
    let crs: unknown;
    let numberMatched: number | undefined;

    for (;;) {
        const url = new URL(s.data);
        // Strip any case-variant of the standard paging keys (the discovery
        // URL already carries one of these for the first page).
        for (const key of [...url.searchParams.keys()]) {
            if (['maxfeatures', 'count', 'startindex'].includes(key.toLowerCase())) {
                url.searchParams.delete(key);
            }
        }
        const remaining = cap - features.length;
        // Ask for as many as we still need — the server may impose its own
        // (smaller) page-size limit, in which case we adapt below.
        url.searchParams.set(pageSizeKey, String(remaining));
        if (supportsPaging && startIndex > 0) url.searchParams.set('STARTINDEX', String(startIndex));

        const resp = await fetch(url.toString());
        if (!resp.ok) throw new Error(`geojson-loader: failed to fetch ${url}: ${resp.status}`);
        const json = await resp.json() as GeoJSON.FeatureCollection & { crs?: unknown; numberMatched?: number; numberReturned?: number };

        const page = json.features ?? [];
        features.push(...page);
        crs = crs ?? json.crs;
        numberMatched = numberMatched ?? json.numberMatched;

        const total = numberMatched !== undefined ? Math.min(numberMatched, cap) : cap;
        if (!supportsPaging || page.length === 0 || features.length >= total) break;
        startIndex += page.length;
    }

    // Reported by the service in the first page's response; lets callers see
    // the true total even when truncated by `cap`.
    if (numberMatched !== undefined) s.featureCount = numberMatched;

    return { type: 'FeatureCollection', features, ...(crs ? { crs } : {}) } as GeoJSON.FeatureCollection;
}
