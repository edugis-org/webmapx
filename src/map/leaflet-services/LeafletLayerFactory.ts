// src/map/leaflet-services/LeafletLayerFactory.ts

import * as L from 'leaflet';
import type { AnyLayerConfig, StandardLayerConfig, SourceConfig, WMSSourceConfig, SubLayerSpec } from '../../config/types';
import { evaluateColor, evaluateNumber, evaluateString, matchesFilter } from '../../utils/maplibre-expression-evaluator';
import { setupLabelCollision } from './label-collision';

if (typeof document !== 'undefined' && typeof document.getElementById === 'function' && !document.getElementById('webmapx-symbol-label-style')) {
    const style = document.createElement('style');
    style.id = 'webmapx-symbol-label-style';
    style.textContent = '.webmapx-symbol-label { background: none; border: none; }';
    document.head.appendChild(style);
}

function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

/** Formats a Leaflet LatLngBounds as a `minx,miny,maxx,maxy` EPSG:3857 (meters) bbox string —
 *  the format WMS-tile-cache servers expect for the `{bbox-epsg-3857}` template var. */
export function latLngBoundsToEpsg3857Bbox(bounds: L.LatLngBounds): string {
    const sw = L.CRS.EPSG3857.project(bounds.getSouthWest());
    const ne = L.CRS.EPSG3857.project(bounds.getNorthEast());
    return [sw.x, sw.y, ne.x, ne.y].join(',');
}

/** Tile layer for WMS-tile-cache style templates using `{bbox-epsg-3857}`
 *  (a MapLibre/Mapbox raster-source convention Leaflet's TileLayer doesn't expand). */
const BboxTileLayer = L.TileLayer.extend({
    getTileUrl(this: L.TileLayer & { _url: string }, coords: L.Coords): string {
        const bounds = (this as any)._tileCoordsToBounds(coords);
        return this._url.replace('{bbox-epsg-3857}', latLngBoundsToEpsg3857Bbox(bounds));
    },
}) as unknown as new (urlTemplate: string, options?: L.TileLayerOptions) => L.TileLayer;

export interface LeafletLayerSpec {
    id: string;
    type: 'raster' | 'geojson';
    layer: L.Layer;
}

export class LeafletLayerFactory {
    static createXYZLayer(layerId: string, sourceConfig: SourceConfig, pane?: string): LeafletLayerSpec | null {
        if (sourceConfig.type !== 'raster' || sourceConfig.service !== 'xyz') return null;
        const url = Array.isArray(sourceConfig.url) ? sourceConfig.url[0] : sourceConfig.url;
        const tileSize = sourceConfig.tileSize || 256;
        const options = {
            attribution: sourceConfig.attribution,
            tileSize,
            // 512px tiles in a {z}/{x}/{y} scheme cover the area of one coarser leaflet zoom level (256px)
            zoomOffset: tileSize === 512 ? -1 : 0,
            minZoom: sourceConfig.minzoom,
            maxNativeZoom: sourceConfig.maxzoom,
            ...(pane ? { pane } : {}),
        };
        const layer = url.includes('{bbox-epsg-3857}')
            ? new BboxTileLayer(url, options)
            : L.tileLayer(url, options);
        return { id: `${layerId}-raster-xyz`, type: 'raster', layer };
    }

    static createWMSLayer(layerId: string, sourceConfig: SourceConfig, pane?: string): LeafletLayerSpec | null {
        if (sourceConfig.type !== 'raster' || sourceConfig.service !== 'wms') return null;
        const wmsConfig = sourceConfig as WMSSourceConfig;
        const baseUrl = Array.isArray(wmsConfig.url) ? wmsConfig.url[0] : wmsConfig.url;

        // Discovered/ad-hoc WMS layers (layer-discovery.ts) hand us an already-complete GetMap
        // URL template (built for MapLibre, with a literal `{bbox-epsg-3857}` placeholder baked
        // into its query string) rather than a bare WMS endpoint. Feeding that into
        // `L.tileLayer.wms` is wrong on two counts: it re-derives its own LAYERS/etc params
        // (redundant, already handled below) AND its `getTileUrl` runs the whole url through
        // Leaflet's generic `{s}/{x}/{y}/{z}` template substitution, which throws
        // "No value provided for variable {bbox-epsg-3857}" on the unrecognized token. Treat it
        // as an already-built template instead, same as the XYZ path's `BboxTileLayer`.
        if (baseUrl.includes('{bbox-epsg-3857}')) {
            const layer = new BboxTileLayer(baseUrl, {
                attribution: wmsConfig.attribution,
                minZoom: wmsConfig.minzoom,
                maxNativeZoom: wmsConfig.maxzoom,
                ...(pane ? { pane } : {}),
            });
            return { id: `${layerId}-raster-wms`, type: 'raster', layer };
        }

        // Some configs bake LAYERS (and other GetMap params) into the base url's query string
        // instead of setting an explicit `layers` field. L.tileLayer.wms always appends its own
        // LAYERS param, which would duplicate/override the baked-in one with an empty value.
        const urlLayers = (() => {
            const q = baseUrl.split('?')[1];
            if (!q) return undefined;
            const match = new URLSearchParams(q).get('layers') ?? new URLSearchParams(q).get('LAYERS');
            return match ?? undefined;
        })();
        const layer = L.tileLayer.wms(baseUrl, {
            layers: wmsConfig.layers || urlLayers || '',
            styles: wmsConfig.styles || '',
            format: wmsConfig.format || 'image/png',
            transparent: wmsConfig.transparent ?? true,
            version: wmsConfig.version || '1.1.1',
            crs: wmsConfig.crs === 'EPSG:4326' ? L.CRS.EPSG4326 : L.CRS.EPSG3857,
            attribution: wmsConfig.attribution,
            minZoom: wmsConfig.minzoom,
            maxNativeZoom: wmsConfig.maxzoom,
            ...(pane ? { pane } : {}),
        });
        return { id: `${layerId}-raster-wms`, type: 'raster', layer };
    }

    static createGeoJSONLayer(
        logicalLayerId: string,
        sourceConfig: SourceConfig,
        data: GeoJSON.FeatureCollection | GeoJSON.Feature,
        subLayers: SubLayerSpec[],
        pane?: string,
        map?: L.Map,
    ): LeafletLayerSpec[] {
        const specs: LeafletLayerSpec[] = [];
        const paneOption = pane ? { pane } : {};

        for (const style of subLayers) {
            if (!['fill', 'line', 'circle', 'symbol'].includes(style.type)) continue;

            const filterFunction = LeafletLayerFactory.createFilterFunction(style.filter as any[]);
            const layer = L.geoJSON(data as GeoJSON.GeoJsonObject, {
                style: (feature) => LeafletLayerFactory.convertPaintToLeafletStyle(style, feature),
                pointToLayer: (feature, latlng) => {
                    if (style.type === 'circle') {
                        const radius = LeafletLayerFactory.resolveNumberExpression(
                            (style.paint as any)?.['circle-radius'], feature, 6
                        );
                        return L.circleMarker(latlng, {
                            radius,
                            ...LeafletLayerFactory.convertPaintToLeafletStyle(style, feature),
                            interactive: true,
                            ...paneOption
                        });
                    }
                    if (style.type === 'symbol') {
                        const marker = L.marker(latlng, { icon: LeafletLayerFactory.createTextLabelIcon(style, feature), interactive: false, ...paneOption });
                        const sortKey = evaluateNumber((style.layout as any)?.['symbol-sort-key'], feature ?? { properties: {} }, 0, 0);
                        (marker as any)._webmapxSortKey = sortKey;
                        return marker;
                    }
                    return L.marker(latlng, { opacity: 0, interactive: false, ...paneOption });
                },
                filter: filterFunction,
                interactive: true,
                ...paneOption
            });
            const specId = style.id ? `${logicalLayerId}-${style.id}` : `${logicalLayerId}-${style.type}-${specs.length}`;
            specs.push({ id: specId, type: 'geojson', layer });

            if (style.type === 'symbol' && map) {
                setupLabelCollision(layer, map);
            }
        }

        return specs;
    }

    /** Renders a maplibre `symbol` layer's `text-field` as a label-only divIcon marker. */
    static createTextLabelIcon(style: SubLayerSpec | any, feature?: GeoJSON.Feature): L.DivIcon {
        const f = feature ?? { properties: {} };
        const layout = style.layout || {};
        const paint = style.paint || {};
        const text = evaluateString(layout['text-field'], f, 0, '');
        const textColor = evaluateColor(paint['text-color'], f, 0, '#000');
        const haloColor = evaluateColor(paint['text-halo-color'], f, 0, 'transparent');
        const haloWidth = evaluateNumber(paint['text-halo-width'], f, 0, 0);
        const fontSize = evaluateNumber(layout['text-size'], f, 0, 12);
        const textShadow = haloWidth > 0
            ? [[-1, -1], [1, -1], [-1, 1], [1, 1]]
                .map(([x, y]) => `${x * haloWidth}px ${y * haloWidth}px 0 ${haloColor}`)
                .join(', ')
            : 'none';
        const html = `<span style="color:${textColor};font-size:${fontSize}px;text-shadow:${textShadow};white-space:nowrap;">${escapeHtml(text)}</span>`;
        return L.divIcon({ className: 'webmapx-symbol-label', html, iconSize: [0, 0] });
    }

    static createFilterFunction(filter: any[]): ((feature: GeoJSON.Feature) => boolean) | undefined {
        if (!filter || !Array.isArray(filter)) return undefined;
        return (feature: GeoJSON.Feature) => matchesFilter(filter, feature);
    }

    static resolveNumberExpression(expression: unknown, feature: GeoJSON.Feature | undefined, fallback: number): number {
        return evaluateNumber(expression, feature ?? { properties: {} }, 0, fallback);
    }

    static resolveColorExpression(expression: unknown, feature: GeoJSON.Feature | undefined, fallback: string): string {
        return evaluateColor(expression, feature ?? { properties: {} }, 0, fallback);
    }

    static convertPaintToLeafletStyle(styleConfig: SubLayerSpec | any, feature?: GeoJSON.Feature): L.PathOptions {
        const paint = styleConfig.paint || {};
        const f = feature ?? { properties: {} };
        const style: L.PathOptions = {};
        switch (styleConfig.type) {
            case 'fill':
                style.fillColor = evaluateColor(paint['fill-color'], f, 0, '#3388ff');
                style.fillOpacity = evaluateNumber(paint['fill-opacity'], f, 0, 0.5);
                style.color = evaluateColor(paint['fill-outline-color'], f, 0, style.fillColor!);
                style.weight = 1;
                style.opacity = 1;
                break;
            case 'line':
                style.color = evaluateColor(paint['line-color'], f, 0, '#3388ff');
                style.weight = evaluateNumber(paint['line-width'], f, 0, 3);
                style.opacity = evaluateNumber(paint['line-opacity'], f, 0, 1);
                style.fill = false;
                if (paint['line-dasharray']) {
                    style.dashArray = Array.isArray(paint['line-dasharray']) ? paint['line-dasharray'].join(' ') : paint['line-dasharray'];
                }
                break;
            case 'circle':
                style.fillColor = evaluateColor(paint['circle-color'], f, 0, '#3388ff');
                style.fillOpacity = evaluateNumber(paint['circle-opacity'], f, 0, 1);
                style.color = evaluateColor(paint['circle-stroke-color'], f, 0, style.fillColor!);
                style.weight = evaluateNumber(paint['circle-stroke-width'], f, 0, 1);
                style.opacity = evaluateNumber(paint['circle-stroke-opacity'], f, 0, 1);
                break;
        }
        return style;
    }
}
