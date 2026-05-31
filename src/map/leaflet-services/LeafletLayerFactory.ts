// src/map/leaflet-services/LeafletLayerFactory.ts

import * as L from 'leaflet';
import type { AnyLayerConfig, StandardLayerConfig, SourceConfig, WMSSourceConfig, SubLayerSpec } from '../../config/types';

export interface LeafletLayerSpec {
    id: string;
    type: 'raster' | 'geojson';
    layer: L.Layer;
}

export class LeafletLayerFactory {
    static createXYZLayer(layerId: string, sourceConfig: SourceConfig): LeafletLayerSpec | null {
        if (sourceConfig.type !== 'raster' || sourceConfig.service !== 'xyz') return null;
        const url = Array.isArray(sourceConfig.url) ? sourceConfig.url[0] : sourceConfig.url;
        const layer = L.tileLayer(url, {
            attribution: sourceConfig.attribution,
            tileSize: sourceConfig.tileSize || 256,
            minZoom: sourceConfig.minzoom,
            maxNativeZoom: sourceConfig.maxzoom,
        });
        return { id: `${layerId}-raster-xyz`, type: 'raster', layer };
    }

    static createWMSLayer(layerId: string, sourceConfig: SourceConfig): LeafletLayerSpec | null {
        if (sourceConfig.type !== 'raster' || sourceConfig.service !== 'wms') return null;
        const wmsConfig = sourceConfig as WMSSourceConfig;
        const baseUrl = Array.isArray(wmsConfig.url) ? wmsConfig.url[0] : wmsConfig.url;
        const layer = L.tileLayer.wms(baseUrl, {
            layers: wmsConfig.layers || '',
            styles: wmsConfig.styles || '',
            format: wmsConfig.format || 'image/png',
            transparent: wmsConfig.transparent ?? true,
            version: wmsConfig.version || '1.1.1',
            crs: wmsConfig.crs === 'EPSG:4326' ? L.CRS.EPSG4326 : L.CRS.EPSG3857,
            attribution: wmsConfig.attribution,
            minZoom: wmsConfig.minzoom,
            maxNativeZoom: wmsConfig.maxzoom,
        });
        return { id: `${layerId}-raster-wms`, type: 'raster', layer };
    }

    static createGeoJSONLayer(
        logicalLayerId: string,
        sourceConfig: SourceConfig,
        data: GeoJSON.FeatureCollection | GeoJSON.Feature,
        subLayers: SubLayerSpec[],
    ): LeafletLayerSpec[] {
        const specs: LeafletLayerSpec[] = [];

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
                            interactive: true
                        });
                    }
                    return L.marker(latlng, { opacity: 0, interactive: false });
                },
                filter: filterFunction,
                interactive: true
            });
            const specId = style.id ? `${logicalLayerId}-${style.id}` : `${logicalLayerId}-${style.type}-${specs.length}`;
            specs.push({ id: specId, type: 'geojson', layer });
        }

        return specs;
    }

    static createFilterFunction(filter: any[]): ((feature: GeoJSON.Feature) => boolean) | undefined {
        if (!filter || !Array.isArray(filter)) return undefined;
        return (feature: GeoJSON.Feature) => LeafletLayerFactory.matchesFilter(feature, filter);
    }

    private static matchesFilter(feature: GeoJSON.Feature, filter: any): boolean {
        if (!Array.isArray(filter) || filter.length < 1) return true;
        const [operator, ...rest] = filter;
        if (operator === 'all') return rest.every((clause) => LeafletLayerFactory.matchesFilter(feature, clause));
        if ((operator === '==' || operator === '!=') && rest.length >= 2) {
            const matched = LeafletLayerFactory.resolveFilterOperand(feature, rest[0]) === rest[1];
            return operator === '==' ? matched : !matched;
        }
        return true;
    }

    private static resolveFilterOperand(feature: GeoJSON.Feature, operand: any): unknown {
        if (operand === '$type') return feature.geometry?.type;
        if (!Array.isArray(operand)) return operand;
        const [op, ...args] = operand;
        if (op === 'geometry-type') return feature.geometry?.type;
        if (op === 'get') return typeof args[0] === 'string' ? feature.properties?.[args[0]] : undefined;
        return undefined;
    }

    private static resolveExpression(expression: unknown, feature?: GeoJSON.Feature): unknown {
        if (!Array.isArray(expression)) return expression;
        const [operator, ...args] = expression;
        if (operator === 'get' && typeof args[0] === 'string') return feature?.properties?.[args[0]];
        if (operator === 'to-number') {
            const value = LeafletLayerFactory.resolveExpression(args[0], feature);
            const n = Number(value);
            return Number.isFinite(n) ? n : null;
        }
        if (operator === 'coalesce') {
            for (const arg of args) {
                const value = LeafletLayerFactory.resolveExpression(arg, feature);
                if (value !== null && value !== undefined && !(typeof value === 'number' && !Number.isFinite(value))) return value;
            }
            return null;
        }
        if (operator === 'interpolate') return LeafletLayerFactory.resolveInterpolateExpression(expression, feature);
        return null;
    }

    private static resolveInterpolateExpression(expression: unknown[], feature?: GeoJSON.Feature): unknown {
        if (expression.length < 6) return null;
        const [, interpolation, inputExpression, ...stops] = expression;
        const input = Number(LeafletLayerFactory.resolveExpression(inputExpression, feature));
        if (!Number.isFinite(input)) return null;
        let base = 1;
        if (Array.isArray(interpolation) && interpolation[0] === 'exponential' && typeof interpolation[1] === 'number') base = interpolation[1];
        const parsedStops: Array<{ stop: number; value: unknown }> = [];
        for (let i = 0; i + 1 < stops.length; i += 2) {
            const stop = Number(stops[i]);
            if (!Number.isFinite(stop)) continue;
            parsedStops.push({ stop, value: stops[i + 1] });
        }
        if (!parsedStops.length) return null;
        if (input <= parsedStops[0].stop) return parsedStops[0].value;
        if (input >= parsedStops[parsedStops.length - 1].stop) return parsedStops[parsedStops.length - 1].value;
        for (let i = 1; i < parsedStops.length; i++) {
            const prev = parsedStops[i - 1];
            const next = parsedStops[i];
            if (input > next.stop) continue;
            const tLinear = (input - prev.stop) / (next.stop - prev.stop);
            const t = base === 1 ? tLinear : (Math.pow(base, tLinear) - 1) / (base - 1);
            if (typeof prev.value === 'number' && typeof next.value === 'number') return prev.value + (next.value - prev.value) * t;
            if (typeof prev.value === 'string' && typeof next.value === 'string') {
                const c1 = LeafletLayerFactory.parseHexColor(prev.value);
                const c2 = LeafletLayerFactory.parseHexColor(next.value);
                if (c1 && c2) {
                    return `rgb(${Math.round(c1.r + (c2.r - c1.r) * t)}, ${Math.round(c1.g + (c2.g - c1.g) * t)}, ${Math.round(c1.b + (c2.b - c1.b) * t)})`;
                }
            }
            return prev.value;
        }
        return parsedStops[parsedStops.length - 1].value;
    }

    private static parseHexColor(value: string): { r: number; g: number; b: number } | null {
        const hex = value.trim();
        if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
        return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
    }

    static resolveNumberExpression(expression: unknown, feature: GeoJSON.Feature | undefined, fallback: number): number {
        const resolved = LeafletLayerFactory.resolveExpression(expression, feature);
        return typeof resolved === 'number' && Number.isFinite(resolved) ? resolved : fallback;
    }

    static resolveColorExpression(expression: unknown, feature: GeoJSON.Feature | undefined, fallback: string): string {
        const resolved = LeafletLayerFactory.resolveExpression(expression, feature);
        return typeof resolved === 'string' && resolved.length > 0 ? resolved : fallback;
    }

    static convertPaintToLeafletStyle(styleConfig: SubLayerSpec | any, feature?: GeoJSON.Feature): L.PathOptions {
        const paint = styleConfig.paint || {};
        const style: L.PathOptions = {};
        switch (styleConfig.type) {
            case 'fill':
                style.fillColor = LeafletLayerFactory.resolveColorExpression(paint['fill-color'], feature, '#3388ff');
                style.fillOpacity = LeafletLayerFactory.resolveNumberExpression(paint['fill-opacity'], feature, 0.5);
                style.color = LeafletLayerFactory.resolveColorExpression(paint['fill-outline-color'], feature, style.fillColor!);
                style.weight = 1;
                style.opacity = 1;
                break;
            case 'line':
                style.color = LeafletLayerFactory.resolveColorExpression(paint['line-color'], feature, '#3388ff');
                style.weight = LeafletLayerFactory.resolveNumberExpression(paint['line-width'], feature, 3);
                style.opacity = LeafletLayerFactory.resolveNumberExpression(paint['line-opacity'], feature, 1);
                style.fill = false;
                if (paint['line-dasharray']) {
                    style.dashArray = Array.isArray(paint['line-dasharray']) ? paint['line-dasharray'].join(' ') : paint['line-dasharray'];
                }
                break;
            case 'circle':
                style.fillColor = LeafletLayerFactory.resolveColorExpression(paint['circle-color'], feature, '#3388ff');
                style.fillOpacity = LeafletLayerFactory.resolveNumberExpression(paint['circle-opacity'], feature, 1);
                style.color = LeafletLayerFactory.resolveColorExpression(paint['circle-stroke-color'], feature, style.fillColor!);
                style.weight = LeafletLayerFactory.resolveNumberExpression(paint['circle-stroke-width'], feature, 1);
                style.opacity = LeafletLayerFactory.resolveNumberExpression(paint['circle-stroke-opacity'], feature, 1);
                break;
        }
        return style;
    }
}
