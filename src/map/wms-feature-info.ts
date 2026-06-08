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

    // The configured base URL may already carry standard WMS keys in arbitrary case
    // (e.g. mapserver-style `srs=EPSG:900913&version=1.1.1`). URLSearchParams.set() is
    // case-sensitive, so setting 'SRS' wouldn't replace an existing 'srs' — it would add
    // a conflicting duplicate that confuses the server. Strip any case-variant of the
    // standard keys we're about to set ourselves; vendor-specific params (e.g. `map=`)
    // are left untouched.
    const STANDARD_KEYS = [
        'service', 'request', 'version', 'layers', 'query_layers', 'width', 'height',
        'feature_count', 'info_format', 'crs', 'srs', 'bbox', 'i', 'j', 'x', 'y', 'styles',
    ];
    for (const key of [...url.searchParams.keys()]) {
        if (STANDARD_KEYS.includes(key.toLowerCase())) url.searchParams.delete(key);
    }

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
 * Parse GML/XML GetFeatureInfo response into key-value properties.
 * Handles WMS_MS_FeatureInfoResponse, FeatureInfoResponse, and plain GML feature elements.
 */
function parseGMLResponse(xml: string, layerId: string, layerTitle?: string): FeatureInfo[] {
    let doc: Document;
    try {
        doc = new DOMParser().parseFromString(xml, 'text/xml');
    } catch {
        return [{ layerId, layerTitle, properties: { _raw: xml }, source: 'wms' }];
    }

    // Collect all leaf-text elements that look like feature attributes.
    // Strategy: find elements whose text content has no element children (= leaf nodes with values).
    const results: FeatureInfo[] = [];
    const featureNodes = findFeatureNodes(doc.documentElement);

    for (const featureEl of featureNodes) {
        const props: Record<string, unknown> = {};
        for (let i = 0; i < featureEl.children.length; i++) {
            const child = featureEl.children[i];
            // Skip containers and gml namespace elements (boundedBy, name, etc.)
            if (child.children.length > 0) continue;
            if (child.namespaceURI === 'http://www.opengis.net/gml') continue;
            const localName = child.localName ?? child.nodeName.replace(/^[^:]+:/, '');
            const val = child.textContent?.trim() ?? '';
            if (localName && val) props[localName] = isNaN(Number(val)) || val === '' ? val : Number(val);
        }
        if (Object.keys(props).length > 0) {
            results.push({ layerId, layerTitle, properties: props, source: 'wms' });
        }
    }

    if (results.length === 0 && xml.trim()) {
        // Last resort: naive regex extraction of <tag>value</tag> pairs
        const props: Record<string, unknown> = {};
        const re = /<([A-Za-z_][A-Za-z0-9_:]*)(?:\s[^>]*)?>([^<]+)<\/\1>/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(xml)) !== null) {
            const key = m[1].replace(/^[^:]+:/, '');
            const val = m[2].trim();
            if (val) props[key] = isNaN(Number(val)) || val === '' ? val : Number(val);
        }
        if (Object.keys(props).length > 0) results.push({ layerId, layerTitle, properties: props, source: 'wms' });
    }

    return results;
}

/** Find elements that represent individual features in a GML response. */
function findFeatureNodes(root: Element): Element[] {
    // Common GML patterns: gml:featureMember > *, FIELDS element, or direct child elements with leaf children
    const featureMembers = root.getElementsByTagNameNS('http://www.opengis.net/gml', 'featureMember');
    if (featureMembers.length > 0) {
        const nodes: Element[] = [];
        for (let i = 0; i < featureMembers.length; i++) {
            const child = featureMembers[i].children[0];
            if (child) nodes.push(child);
        }
        return nodes;
    }
    // MapServer msGMLOutput: each feature element contains a gml:boundedBy child.
    // The feature element itself (boundedBy's parentElement) holds the attribute children.
    const boundedBys = root.getElementsByTagNameNS('http://www.opengis.net/gml', 'boundedBy');
    if (boundedBys.length > 0) {
        const nodes: Element[] = [];
        for (let i = 0; i < boundedBys.length; i++) {
            const parent = boundedBys[i].parentElement;
            if (parent) nodes.push(parent);
        }
        return nodes;
    }
    // ESRI / MapServer style: <FIELDS ...> or <Layer> with <Field> children
    const fields = root.querySelectorAll('FIELDS, Layer');
    if (fields.length > 0) return Array.from(fields);
    // MapServer / QGIS: direct Layer element with attribute children
    if (root.children.length > 0 && root.children[0].children.length > 0) {
        return [root.children[0]];
    }
    return [root];
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

        // GML / XML fallback: parse attributes from XML
        const text = await response.text();
        if (!text.trim() || text.includes('no features') || text.includes('ServiceException')) {
            return [];
        }
        return parseGMLResponse(text, params.layerId, params.layerTitle);
    } catch {
        return [];
    }
}
