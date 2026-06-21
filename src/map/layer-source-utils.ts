import type { SourceConfig, XYZSourceConfig, WMSSourceConfig, GeoJSONSourceConfig, VectorSourceConfig, LayerDataConfig } from '../config/types';

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

        // Detect WMS: explicit service='wms', OR url has no tile placeholders ({x}/{y}/{z})
        const hasTilePlaceholders = (url: string) => /\{x\}|\{y\}|\{z\}|\{-y\}|\{s\}/i.test(url);
        const explicitService = typeof def.service === 'string' ? def.service : undefined;
        const isWms = explicitService === 'wms' || (!explicitService && tiles.length > 0 && !hasTilePlaceholders(tiles[0]) && tiles[0].includes('?'));
        if (isWms) {
            // WMS: the url is a base WMS URL; MapLayerService will call buildWMSGetMapUrl to complete it.
            const baseUrl = tiles[0];
            return {
                id: logicalId,
                type: 'raster',
                service: 'wms',
                url: baseUrl,
                ...(typeof def.layers === 'string' ? { layers: def.layers } : {}),
                ...(typeof def.version === 'string' ? { version: def.version } : {}),
                ...(typeof def.format === 'string' ? { format: def.format } : {}),
                ...(typeof def.attribution === 'string' ? { attribution: def.attribution } : {}),
                ...(def.tileSize !== undefined ? { tileSize: def.tileSize as number } : {}),
                ...(def.minzoom !== undefined ? { minzoom: def.minzoom as number } : {}),
                ...(def.maxzoom !== undefined ? { maxzoom: def.maxzoom as number } : {}),
                ...(def.bounds !== undefined ? { bounds: def.bounds as [number, number, number, number] } : {}),
            } as WMSSourceConfig;
        }

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
