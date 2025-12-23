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
            maxZoom: sourceConfig.maxzoom,
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

            const leafletStyle = LeafletLayerFactory.convertPaintToLeafletStyle(style);
            const filterFunction = LeafletLayerFactory.createFilterFunction(style.filter);

            const layer = L.geoJSON(data as GeoJSON.GeoJsonObject, {
                style: () => leafletStyle,
                pointToLayer: (feature, latlng) => {
                    if (style.type === 'circle') {
                        const radius = (style.paint as any)?.['circle-radius'] || 6;
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
     * Supports simple '==' filters on geometry-type and properties.
     */
    static createFilterFunction(filter: any[]): ((feature: GeoJSON.Feature) => boolean) | undefined {
        if (!filter || !Array.isArray(filter) || filter.length !== 3) {
            return undefined;
        }

        const [operator, operand1, operand2] = filter;

        if (operator === '==') {
            if (Array.isArray(operand1) && operand1[0] === 'geometry-type') {
                const geometryType = operand2;
                return (feature: GeoJSON.Feature) => feature.geometry.type === geometryType;
            }
            
            if (Array.isArray(operand1) && operand1[0] === 'get') {
                const propertyName = operand1[1];
                const propertyValue = operand2;
                return (feature: GeoJSON.Feature) => feature.properties?.[propertyName] === propertyValue;
            }
        }

        return undefined;
    }

    /**
     * Convert MapLibre-style paint properties to Leaflet PathOptions.
     */
    static convertPaintToLeafletStyle(styleConfig: any): L.PathOptions {
        const paint = styleConfig.paint || {};
        const style: L.PathOptions = {};

        switch (styleConfig.type) {
            case 'fill':
                style.fillColor = paint['fill-color'] || '#3388ff';
                style.fillOpacity = paint['fill-opacity'] ?? 0.5;
                style.color = paint['fill-outline-color'] || paint['fill-color'] || '#3388ff';
                style.weight = 1;
                style.opacity = 1;
                break;

            case 'line':
                style.color = paint['line-color'] || '#3388ff';
                style.weight = paint['line-width'] || 3;
                style.opacity = paint['line-opacity'] ?? 1;
                style.fill = false;
                if (paint['line-dasharray']) {
                    style.dashArray = Array.isArray(paint['line-dasharray'])
                        ? paint['line-dasharray'].join(' ')
                        : paint['line-dasharray'];
                }
                break;

            case 'circle':
                style.fillColor = paint['circle-color'] || '#3388ff';
                style.fillOpacity = paint['circle-opacity'] ?? 0.5;
                style.color = paint['circle-stroke-color'] || paint['circle-color'] || '#3388ff';
                style.weight = paint['circle-stroke-width'] || 1;
                style.opacity = paint['circle-stroke-opacity'] ?? 1;
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
