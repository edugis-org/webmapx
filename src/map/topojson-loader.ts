import * as topojson from 'topojson-client';
import type { LayerDataConfig } from '../config/types';

const PROTO = 'topojson://';

/**
 * Pre-resolves any geojson source whose `data` starts with `topojson://`.
 * Fetches the TopoJSON file, converts the first (or named) object to a
 * GeoJSON FeatureCollection, and replaces `data` with the inline collection.
 * Mutates the catalog sources in place so engines never see the custom protocol.
 *
 * URL format:  topojson://<path>[#<objectName>]
 * Example:     topojson://./data/world.topojson#ne_50m_admin_0_map_units
 */
export async function resolveTopojsonSources(catalog: LayerDataConfig): Promise<void> {
    const pending = (catalog.sources ?? []).filter(
        s => s.type === 'geojson' && typeof (s as any).data === 'string' && (s as any).data.startsWith(PROTO)
    );
    await Promise.all(pending.map(async s => {
        const raw: string = (s as any).data;
        const withoutProto = raw.slice(PROTO.length);
        const hashIdx = withoutProto.indexOf('#');
        const path = hashIdx >= 0 ? withoutProto.slice(0, hashIdx) : withoutProto;
        const objectName = hashIdx >= 0 ? withoutProto.slice(hashIdx + 1) : null;

        const resp = await fetch(path);
        if (!resp.ok) throw new Error(`topojson-loader: failed to fetch ${path}: ${resp.status}`);
        const topo = await resp.json() as any;

        const objects = topo.objects as Record<string, any>;
        const key = objectName ?? Object.keys(objects)[0];
        if (!key || !objects[key]) throw new Error(`topojson-loader: object "${key}" not found in ${path}`);

        const fc = topojson.feature(topo, objects[key]) as unknown as GeoJSON.FeatureCollection;
        (s as any).data = fc;
    }));
}
