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
