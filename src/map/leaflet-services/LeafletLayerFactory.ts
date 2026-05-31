// src/map/leaflet-services/LeafletLayerFactory.ts

import * as L from 'leaflet';
import type { LayerConfig, SourceConfig, WMSSourceConfig } from '../../config/types';
import { buildWMSGetMapUrl } from '../../utils/wms-url-builder';

/**
 * Layer specification for Leaflet layers.
 */
export interface LeafletLayerSpec {
    id: string;
    type: 'raster' | 'geojson';
    layer: L.Layer;
}

/**
 * Factory to compose Leaflet layers from logical LayerConfig and SourceConfig.
 */
export class LeafletLayerFactory {
    /**
     * Create a raster tile layer for XYZ sources.
     */
    static createXYZLayer(layerConfig: LayerConfig, sourceConfig: SourceConfig): LeafletLayerSpec | null {
        if (sourceConfig.type !== 'raster' || sourceConfig.service !== 'xyz') {
            return null;
        }

        const url = Array.isArray(sourceConfig.url) ? sourceConfig.url[0] : sourceConfig.url;

        const layer = L.tileLayer(url, {
            attribution: sourceConfig.attribution,
            tileSize: sourceConfig.tileSize || 256,
            minZoom: sourceConfig.minzoom,
            maxNativeZoom: sourceConfig.maxzoom,
        });

        return {
            id: `${layerConfig.id}-raster-xyz`,
            type: 'raster',
            layer
        };
    }

    /**
     * Create a WMS tile layer.
     */
    static createWMSLayer(layerConfig: LayerConfig, sourceConfig: SourceConfig): LeafletLayerSpec | null {
        if (sourceConfig.type !== 'raster' || sourceConfig.service !== 'wms') {
            return null;
        }

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

        return {
            id: `${layerConfig.id}-raster-wms`,
            type: 'raster',
            layer
        };
    }

    /**
     * Create a GeoJSON layer with appropriate styling.
     */
    static createGeoJSONLayer(
        layerConfig: any, // Can be LayerConfig or a single layer spec
        sourceConfig: SourceConfig,
        data: GeoJSON.FeatureCollection | GeoJSON.Feature
    ): LeafletLayerSpec[] {
        const specs: LeafletLayerSpec[] = [];
        const styles = layerConfig.layerset || [layerConfig]; // Handle both structures

        for (const style of styles) {
            if (!['fill', 'line', 'circle', 'symbol'].includes(style.type)) {
                continue;
            }

            const filterFunction = LeafletLayerFactory.createFilterFunction(style.filter);

            const layer = L.geoJSON(data as GeoJSON.GeoJsonObject, {
                style: (feature) => LeafletLayerFactory.convertPaintToLeafletStyle(style, feature),
                pointToLayer: (feature, latlng) => {
                    if (style.type === 'circle') {
                        const radius = LeafletLayerFactory.resolveNumberExpression(
                            (style.paint as any)?.['circle-radius'],
                            feature,
                            6
                        );
                        const leafletStyle = LeafletLayerFactory.convertPaintToLeafletStyle(style, feature);
                        return L.circleMarker(latlng, {
                            radius,
                            ...leafletStyle,
                            interactive: true // Re-enable interactivity for circle markers
                        });
                    }
                    // For line/polygon features, Leaflet uses the 'style' option.
                    // We must return a layer for Point features, but we don't want a visible marker.
                    return L.marker(latlng, { opacity: 0, interactive: false });
                },
                filter: filterFunction,
                interactive: true // Re-enable interactivity for GeoJSON layer
            });

            const layerId = layerConfig.layerset ? layerConfig.id : style.id;
            specs.push({
                id: `${layerId}-${style.type}`,
                type: 'geojson',
                layer
            });
        }

        return specs;
    }

    /**
     * Creates a filter function for a GeoJSON layer from a MapLibre-style filter array.
     * Supports all/==/!= filters on geometry-type and feature properties.
     */
    static createFilterFunction(filter: any[]): ((feature: GeoJSON.Feature) => boolean) | undefined {
        if (!filter || !Array.isArray(filter)) {
            return undefined;
        }

        return (feature: GeoJSON.Feature) => LeafletLayerFactory.matchesFilter(feature, filter);
    }

    private static matchesFilter(feature: GeoJSON.Feature, filter: any): boolean {
        if (!Array.isArray(filter) || filter.length < 1) {
            return true;
        }

        const [operator, ...rest] = filter;
        if (operator === 'all') {
            return rest.every((clause) => LeafletLayerFactory.matchesFilter(feature, clause));
        }

        if ((operator === '==' || operator === '!=') && rest.length >= 2) {
            const lhs = LeafletLayerFactory.resolveFilterOperand(feature, rest[0]);
            const rhs = rest[1];
            const matched = lhs === rhs;
            return operator === '==' ? matched : !matched;
        }

        return true;
    }

    private static resolveFilterOperand(feature: GeoJSON.Feature, operand: any): unknown {
        if (!Array.isArray(operand)) {
            return operand;
        }

        const [op, ...args] = operand;
        if (op === 'geometry-type') {
            return feature.geometry?.type;
        }
        if (op === 'get') {
            const propertyName = args[0];
            return typeof propertyName === 'string' ? feature.properties?.[propertyName] : undefined;
        }

        return undefined;
    }

    private static resolveExpression(expression: unknown, feature?: GeoJSON.Feature): unknown {
        if (!Array.isArray(expression)) {
            return expression;
        }

        const [operator, ...args] = expression;
        if (operator === 'get' && typeof args[0] === 'string') {
            return feature?.properties?.[args[0]];
        }
        if (operator === 'to-number') {
            const value = LeafletLayerFactory.resolveExpression(args[0], feature);
            const numberValue = Number(value);
            return Number.isFinite(numberValue) ? numberValue : null;
        }
        if (operator === 'coalesce') {
            for (const arg of args) {
                const value = LeafletLayerFactory.resolveExpression(arg, feature);
                if (value !== null && value !== undefined && !(typeof value === 'number' && !Number.isFinite(value))) {
                    return value;
                }
            }
            return null;
        }
        if (operator === 'interpolate') {
            return LeafletLayerFactory.resolveInterpolateExpression(expression, feature);
        }

        return null;
    }

    private static resolveInterpolateExpression(expression: unknown[], feature?: GeoJSON.Feature): unknown {
        if (expression.length < 6) return null;

        const [, interpolation, inputExpression, ...stops] = expression;
        const input = Number(LeafletLayerFactory.resolveExpression(inputExpression, feature));
        if (!Number.isFinite(input)) return null;

        let base = 1;
        if (Array.isArray(interpolation) && interpolation[0] === 'exponential' && typeof interpolation[1] === 'number') {
            base = interpolation[1];
        }

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

            if (typeof prev.value === 'number' && typeof next.value === 'number') {
                return prev.value + (next.value - prev.value) * t;
            }

            if (typeof prev.value === 'string' && typeof next.value === 'string') {
                const c1 = LeafletLayerFactory.parseHexColor(prev.value);
                const c2 = LeafletLayerFactory.parseHexColor(next.value);
                if (c1 && c2) {
                    const r = Math.round(c1.r + (c2.r - c1.r) * t);
                    const g = Math.round(c1.g + (c2.g - c1.g) * t);
                    const b = Math.round(c1.b + (c2.b - c1.b) * t);
                    return `rgb(${r}, ${g}, ${b})`;
                }
            }

            return prev.value;
        }

        return parsedStops[parsedStops.length - 1].value;
    }

    private static parseHexColor(value: string): { r: number; g: number; b: number } | null {
        const hex = value.trim();
        if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
        return {
            r: parseInt(hex.slice(1, 3), 16),
            g: parseInt(hex.slice(3, 5), 16),
            b: parseInt(hex.slice(5, 7), 16),
        };
    }

    private static resolveNumberExpression(expression: unknown, feature: GeoJSON.Feature | undefined, fallback: number): number {
        const resolved = LeafletLayerFactory.resolveExpression(expression, feature);
        return typeof resolved === 'number' && Number.isFinite(resolved) ? resolved : fallback;
    }

    private static resolveColorExpression(expression: unknown, feature: GeoJSON.Feature | undefined, fallback: string): string {
        const resolved = LeafletLayerFactory.resolveExpression(expression, feature);
        return typeof resolved === 'string' && resolved.length > 0 ? resolved : fallback;
    }

    /**
     * Convert MapLibre-style paint properties to Leaflet PathOptions.
     */
    static convertPaintToLeafletStyle(styleConfig: any, feature?: GeoJSON.Feature): L.PathOptions {
        const paint = styleConfig.paint || {};
        const style: L.PathOptions = {};

        switch (styleConfig.type) {
            case 'fill':
                style.fillColor = LeafletLayerFactory.resolveColorExpression(paint['fill-color'], feature, '#3388ff');
                style.fillOpacity = LeafletLayerFactory.resolveNumberExpression(paint['fill-opacity'], feature, 0.5);
                style.color = LeafletLayerFactory.resolveColorExpression(
                    paint['fill-outline-color'],
                    feature,
                    LeafletLayerFactory.resolveColorExpression(paint['fill-color'], feature, '#3388ff')
                );
                style.weight = 1;
                style.opacity = 1;
                break;

            case 'line':
                style.color = LeafletLayerFactory.resolveColorExpression(paint['line-color'], feature, '#3388ff');
                style.weight = LeafletLayerFactory.resolveNumberExpression(paint['line-width'], feature, 3);
                style.opacity = LeafletLayerFactory.resolveNumberExpression(paint['line-opacity'], feature, 1);
                style.fill = false;
                if (paint['line-dasharray']) {
                    style.dashArray = Array.isArray(paint['line-dasharray'])
                        ? paint['line-dasharray'].join(' ')
                        : paint['line-dasharray'];
                }
                break;

            case 'circle':
                style.fillColor = LeafletLayerFactory.resolveColorExpression(paint['circle-color'], feature, '#3388ff');
                style.fillOpacity = LeafletLayerFactory.resolveNumberExpression(paint['circle-opacity'], feature, 1);
                style.color = LeafletLayerFactory.resolveColorExpression(
                    paint['circle-stroke-color'],
                    feature,
                    LeafletLayerFactory.resolveColorExpression(paint['circle-color'], feature, '#3388ff')
                );
                style.weight = LeafletLayerFactory.resolveNumberExpression(paint['circle-stroke-width'], feature, 1);
                style.opacity = LeafletLayerFactory.resolveNumberExpression(paint['circle-stroke-opacity'], feature, 1);
                break;

            case 'symbol':
                // Symbols are handled differently in Leaflet (via markers)
                break;
        }

        return style;
    }

    /**
     * Compose one or more Leaflet layer specs for a logical layer and source.
     * Returns an array because some logical layers may map to multiple native layers.
     */
    static createLayers(layerConfig: LayerConfig, sourceConfig: SourceConfig): LeafletLayerSpec[] {
        const layers: LeafletLayerSpec[] = [];

        for (const style of layerConfig.layerset) {
            // Raster
            if (style.type === 'raster' && sourceConfig.type === 'raster') {
                if (sourceConfig.service === 'xyz') {
                    const spec = LeafletLayerFactory.createXYZLayer(layerConfig, sourceConfig);
                    if (spec) layers.push(spec);
                } else if (sourceConfig.service === 'wms') {
                    const spec = LeafletLayerFactory.createWMSLayer(layerConfig, sourceConfig);
                    if (spec) layers.push(spec);
                }
            }
            // Vector/GeoJSON - handled separately via createGeoJSONLayer
        }

        return layers;
    }
}
