import type { SourceConfig, XYZSourceConfig, GeoJSONSourceConfig, VectorSourceConfig, LayerDataConfig } from '../config/types';

export function resolveSource(catalog: LayerDataConfig | null | undefined, sourceId: string): SourceConfig | null {
    return catalog?.sources?.find((s) => s.id === sourceId) ?? null;
}

export function normalizeRawSource(logicalId: string, rawDef: unknown): SourceConfig | null {
    if (typeof rawDef !== 'object' || rawDef === null) return null;
    const def = rawDef as Record<string, unknown>;
    // Already a fully normalized SourceConfig (inlined by generic layer) — use directly
    if (typeof def.id === 'string' && def.id.length > 0) {
        return { ...def, id: logicalId } as SourceConfig;
    }
    if (def.type === 'raster') {
        const tiles = Array.isArray(def.tiles)
            ? def.tiles.filter((t): t is string => typeof t === 'string')
            : Array.isArray(def.url)
                ? def.url.filter((t): t is string => typeof t === 'string')
                : (typeof def.url === 'string' ? [def.url] : []);
        if (tiles.length === 0) return null;
        return { id: logicalId, type: 'raster', service: 'xyz', url: tiles, ...(def.attribution ? { attribution: def.attribution as string } : {}) } as XYZSourceConfig;
    }
    if (def.type === 'geojson') {
        const data = def.data;
        if (typeof data !== 'string' && typeof data !== 'object') return null;
        return { id: logicalId, type: 'geojson', data: data as string } as GeoJSONSourceConfig;
    }
    if (def.type === 'vector') {
        if (typeof def.url !== 'string') return null;
        return { id: logicalId, type: 'vector', url: def.url } as VectorSourceConfig;
    }
    return null;
}
