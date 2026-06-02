// src/map/wms-feature-info.ts
// Engine-agnostic WMS GetFeatureInfo fetcher.
// All parameters are primitives — no engine imports.

import type { WMSSourceConfig } from '../config/types';
import type { FeatureInfo } from './IQueryService';

export interface WMSQueryParams {
    sourceConfig: WMSSourceConfig;
    layerId: string;
    layerTitle?: string;
    /** Current map bounds [west, south, east, north] in WGS84. */
    bounds: { west: number; south: number; east: number; north: number };
    /** Map container size in CSS pixels. */
    containerWidth: number;
    containerHeight: number;
    /** Click/query pixel relative to map container [x, y]. */
    pixelX: number;
    pixelY: number;
    /** Number of features to return. Default: 1. */
    featureCount?: number;
}

/**
 * Builds a WMS GetFeatureInfo URL.
 * Handles WMS 1.1.1 (SRS/X/Y) and 1.3.0 (CRS/I/J with axis-order fix for EPSG:4326).
 */
function buildGetFeatureInfoUrl(params: WMSQueryParams): string {
    const cfg = params.sourceConfig;
    const version = cfg.version ?? '1.3.0';
    const baseUrl = Array.isArray(cfg.url) ? cfg.url[0] : cfg.url;
    const layers = cfg.layers ?? '';
    const { bounds, containerWidth, containerHeight, pixelX, pixelY } = params;

    const url = new URL(baseUrl);
    url.searchParams.set('SERVICE', 'WMS');
    url.searchParams.set('REQUEST', 'GetFeatureInfo');
    url.searchParams.set('VERSION', version);
    url.searchParams.set('LAYERS', layers);
    url.searchParams.set('QUERY_LAYERS', layers);
    url.searchParams.set('WIDTH', String(Math.round(containerWidth)));
    url.searchParams.set('HEIGHT', String(Math.round(containerHeight)));
    url.searchParams.set('FEATURE_COUNT', String(params.featureCount ?? 1));

    // Try JSON first, fall back to GML
    const infoFormat = cfg.format === 'image/png' || !cfg.format
        ? 'application/json'
        : cfg.format;
    url.searchParams.set('INFO_FORMAT', infoFormat);

    const { west, south, east, north } = bounds;

    if (version.startsWith('1.3')) {
        // WMS 1.3.0: CRS, I/J params
        // EPSG:4326 has lat/lon axis order — swap to south,west,north,east
        const crs = cfg.crs ?? 'CRS:84';
        url.searchParams.set('CRS', crs);
        const isEPSG4326 = crs === 'EPSG:4326';
        url.searchParams.set(
            'BBOX',
            isEPSG4326
                ? `${south},${west},${north},${east}`
                : `${west},${south},${east},${north}`
        );
        url.searchParams.set('I', String(Math.round(pixelX)));
        url.searchParams.set('J', String(Math.round(pixelY)));
    } else {
        // WMS 1.1.1: SRS, X/Y params — always lon/lat order
        url.searchParams.set('SRS', cfg.crs ?? 'EPSG:4326');
        url.searchParams.set('BBOX', `${west},${south},${east},${north}`);
        url.searchParams.set('X', String(Math.round(pixelX)));
        url.searchParams.set('Y', String(Math.round(pixelY)));
    }

    if (cfg.styles) url.searchParams.set('STYLES', cfg.styles);

    return url.toString();
}

function parseGeoJSONResponse(
    json: unknown,
    layerId: string,
    layerTitle?: string
): FeatureInfo[] {
    if (
        typeof json !== 'object' ||
        json === null ||
        (json as any).type !== 'FeatureCollection'
    ) {
        return [];
    }
    const fc = json as GeoJSON.FeatureCollection;
    return (fc.features ?? []).map((f) => ({
        layerId,
        layerTitle,
        properties: (f.properties as Record<string, unknown>) ?? {},
        geometry: f.geometry ?? undefined,
        source: 'wms' as const,
    }));
}

/**
 * Fetches WMS GetFeatureInfo for a single WMS layer.
 * Returns an empty array on network error or unparseable response.
 */
export async function fetchWMSFeatureInfo(params: WMSQueryParams): Promise<FeatureInfo[]> {
    let url: string;
    try {
        url = buildGetFeatureInfoUrl(params);
    } catch {
        return [];
    }

    try {
        const response = await fetch(url);
        if (!response.ok) return [];

        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json') || contentType.includes('text/json')) {
            const json = await response.json();
            return parseGeoJSONResponse(json, params.layerId, params.layerTitle);
        }

        // GML / XML fallback: extract text properties naively
        const text = await response.text();
        if (!text.trim() || text.includes('no features') || text.includes('ServiceException')) {
            return [];
        }
        // Return raw text as a single property for display
        return [{
            layerId: params.layerId,
            layerTitle: params.layerTitle,
            properties: { _raw: text },
            source: 'wms',
        }];
    } catch {
        return [];
    }
}
