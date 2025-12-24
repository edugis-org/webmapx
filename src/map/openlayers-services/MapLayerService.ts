// src/map/openlayers-services/MapLayerService.ts

import { ILayerService } from '../IMapInterfaces';
import type { LayerConfig, SourceConfig, WMSSourceConfig, CatalogConfig } from '../../config/types';
import { MapStateStore } from '../../store/map-state-store';
import OLMap from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Style, Circle as CircleStyle } from 'ol/style';
import ImageWMS from 'ol/source/ImageWMS';
import ImageLayer from 'ol/layer/Image';
import TileWMS from 'ol/source/TileWMS';
import { createXYZ } from 'ol/tilegrid';
import type BaseLayer from 'ol/layer/Base';
import type { WarpedMapLayer } from '@allmaps/openlayers';

const WARPEDMAP_PROTOCOL = 'warpedmap://';

export class MapLayerService implements ILayerService {
    private map: OLMap;
    private store: MapStateStore;
    private logicalToNative: Map<string, string[]> = new Map();
    private logicalSourceToNative: Map<string, string> = new Map();
    private nativeLayerToSource: Map<string, string> = new Map();
    private nativeLayerInstances: Map<string, BaseLayer> = new Map();
    // Track WarpedMapLayer instances for cleanup
    private warpedMapLayers: Map<string, WarpedMapLayer> = new Map();
    private catalog: CatalogConfig | null = null;
    private sourceIdCounter = 0;

    constructor(map: OLMap, store: MapStateStore) {
        this.map = map;
        this.store = store;
    }

    setCatalog(catalog: CatalogConfig): void {
        this.catalog = catalog;
    }

    private getOrCreateNativeSourceId(sourceConfig: SourceConfig): string {
        if (this.logicalSourceToNative.has(sourceConfig.id)) {
            return this.logicalSourceToNative.get(sourceConfig.id)!;
        }
        const nativeSourceId = `src-${sourceConfig.id}-${this.sourceIdCounter++}`;
        this.logicalSourceToNative.set(sourceConfig.id, nativeSourceId);
        return nativeSourceId;
    }

    /**
     * Check if a source URL uses the warpedmap:// protocol.
     */
    private isWarpedMapSource(sourceConfig: SourceConfig): boolean {
        if (sourceConfig.type === 'raster' && 'url' in sourceConfig) {
            const url = Array.isArray(sourceConfig.url) ? sourceConfig.url[0] : sourceConfig.url;
            return url.startsWith(WARPEDMAP_PROTOCOL);
        }
        return false;
    }

    /**
     * Parse a warpedmap:// URL and return the annotation URL.
     */
    private parseWarpedMapUrl(url: string): string {
        if (url.startsWith(WARPEDMAP_PROTOCOL)) {
            return 'https://' + url.slice(WARPEDMAP_PROTOCOL.length);
        }
        return url;
    }

    /**
     * Create and add a WarpedMapLayer for Allmaps georeferenced images.
     */
    private async addWarpedMapLayer(layerId: string, sourceConfig: SourceConfig): Promise<boolean> {
        const { WarpedMapLayer } = await import('@allmaps/openlayers');
        const url = 'url' in sourceConfig
            ? (Array.isArray(sourceConfig.url) ? sourceConfig.url[0] : sourceConfig.url)
            : '';
        const annotationUrl = this.parseWarpedMapUrl(url);

        // Create a unique layer ID for the WarpedMapLayer
        const warpedLayerId = `warpedmap-${layerId}`;

        // Create and configure the WarpedMapLayer
        const warpedMapLayer = new WarpedMapLayer();

        // Compatibility shim: @allmaps/openlayers uses OL 8.x which lacks methods required by OL 10.x
        const layer = warpedMapLayer as any;
        if (typeof layer.getDeclutter !== 'function') {
            layer.getDeclutter = () => false;
        }
        if (typeof layer.renderDeferred !== 'function') {
            layer.renderDeferred = () => {};
        }

        // Add the layer to the map
        // Type assertion needed due to OL type version differences between project and @allmaps/openlayers
        this.map.addLayer(warpedMapLayer as unknown as BaseLayer);

        // Load the georeference annotation
        await warpedMapLayer.addGeoreferenceAnnotationByUrl(annotationUrl);

        // Track the layer
        this.warpedMapLayers.set(layerId, warpedMapLayer);
        this.nativeLayerInstances.set(warpedLayerId, warpedMapLayer as unknown as BaseLayer);
        this.logicalToNative.set(layerId, [warpedLayerId]);

        return true;
    }

    async addLayer(layerId: string, layerConfig: LayerConfig, sourceConfig: SourceConfig): Promise<boolean> {
        // Check for warpedmap:// protocol
        if (this.isWarpedMapSource(sourceConfig)) {
            return this.addWarpedMapLayer(layerId, sourceConfig);
        }
        const nativeSourceId = this.getOrCreateNativeSourceId(sourceConfig);
        const nativeLayerIds: string[] = [];

        for (const style of layerConfig.layerset) {
            const nativeLayerId = `${layerConfig.id}-${style.type}`;

            if (!this.nativeLayerInstances.has(nativeLayerId)) {
                const layer = this.createLayer(nativeLayerId, style, sourceConfig);
                if (layer) {
                    this.map.addLayer(layer);
                    this.nativeLayerInstances.set(nativeLayerId, layer);
                }
            }

            nativeLayerIds.push(nativeLayerId);
            this.nativeLayerToSource.set(nativeLayerId, nativeSourceId);
        }

        this.logicalToNative.set(layerId, nativeLayerIds);
        return true;
    }

    private createLayer(
        layerId: string,
        style: LayerConfig['layerset'][0],
        sourceConfig: SourceConfig
    ): BaseLayer | null {
        // Raster layers
        if (style.type === 'raster' && sourceConfig.type === 'raster') {
            if (sourceConfig.service === 'xyz') {
                return this.createXYZLayer(layerId, sourceConfig, style);
            } else if (sourceConfig.service === 'wms') {
                return this.createWMSLayer(layerId, sourceConfig as WMSSourceConfig, style);
            }
        }
        // Vector/GeoJSON layers
        else if (['fill', 'line', 'circle'].includes(style.type) && sourceConfig.type === 'geojson') {
            return this.createGeoJSONLayer(layerId, sourceConfig, style);
        }
        return null;
    }

    private createXYZLayer(
        layerId: string,
        sourceConfig: SourceConfig & { type: 'raster'; service: 'xyz' },
        style: LayerConfig['layerset'][0]
    ): TileLayer<XYZ> {
        const urls = Array.isArray(sourceConfig.url) ? sourceConfig.url : [sourceConfig.url];

        const source = new XYZ({
            urls,
            tileSize: sourceConfig.tileSize,
            attributions: sourceConfig.attribution
        });

        const layer = new TileLayer({
            source,
            minZoom: style.minZoom,
            maxZoom: style.maxZoom,
            opacity: (style.paint as any)?.['raster-opacity'] ?? 1
        });

        (layer as any).__layerId = layerId;
        return layer;
    }

    private createWMSLayer(
        layerId: string,
        sourceConfig: WMSSourceConfig,
        style: LayerConfig['layerset'][0]
    ): BaseLayer {
        const fullUrl = Array.isArray(sourceConfig.url) ? sourceConfig.url[0] : sourceConfig.url;

        // Parse URL and extract all existing parameters
        const { baseUrl, params } = this.parseUrlParams(fullUrl);

        // Add additional WMS parameters only if not already present (case-insensitive check)
        const paramsLower = new Set(Object.keys(params).map(k => k.toLowerCase()));

        if (!paramsLower.has('format')) {
            params['FORMAT'] = sourceConfig.format || 'image/png';
        }
        if (!paramsLower.has('transparent')) {
            params['TRANSPARENT'] = sourceConfig.transparent !== false ? 'true' : 'false';
        }
        if (sourceConfig.layers && !paramsLower.has('layers')) {
            params['LAYERS'] = sourceConfig.layers;
        }
        if (sourceConfig.styles && !paramsLower.has('styles')) {
            params['STYLES'] = sourceConfig.styles;
        }
        if (sourceConfig.version && !paramsLower.has('version')) {
            params['VERSION'] = sourceConfig.version;
        }

        let layer: BaseLayer;

        // Use TileWMS if tileSize is defined (for browser caching), otherwise ImageWMS
        if (sourceConfig.tileSize) {
            const tileGrid = createXYZ({
                tileSize: sourceConfig.tileSize
            });

            const source = new TileWMS({
                url: baseUrl,
                params,
                attributions: sourceConfig.attribution,
                tileGrid
            });

            layer = new TileLayer({
                source,
                minZoom: style.minZoom,
                maxZoom: style.maxZoom,
                opacity: (style.paint as any)?.['raster-opacity'] ?? 1
            });
        } else {
            const source = new ImageWMS({
                url: baseUrl,
                params,
                attributions: sourceConfig.attribution,
                ratio: 1
            });

            layer = new ImageLayer({
                source,
                minZoom: style.minZoom,
                maxZoom: style.maxZoom,
                opacity: (style.paint as any)?.['raster-opacity'] ?? 1
            });
        }

        (layer as any).__layerId = layerId;
        return layer;
    }

    /**
     * Parse URL into base URL and parameters object.
     * All original parameters are preserved.
     */
    private parseUrlParams(url: string): { baseUrl: string; params: Record<string, string> } {
        const questionIndex = url.indexOf('?');
        if (questionIndex === -1) {
            return { baseUrl: url, params: {} };
        }

        const baseUrl = url.substring(0, questionIndex);
        const queryString = url.substring(questionIndex + 1);
        const params: Record<string, string> = {};

        for (const param of queryString.split('&')) {
            const eqIndex = param.indexOf('=');
            if (eqIndex !== -1) {
                const key = param.substring(0, eqIndex);
                const value = decodeURIComponent(param.substring(eqIndex + 1));
                params[key] = value;
            } else if (param) {
                params[param] = '';
            }
        }

        return { baseUrl, params };
    }

    private createGeoJSONLayer(
        layerId: string,
        sourceConfig: SourceConfig & { type: 'geojson' },
        style: LayerConfig['layerset'][0]
    ): VectorLayer<VectorSource> {
        const source = new VectorSource({
            features: typeof sourceConfig.data === 'string'
                ? undefined
                : new GeoJSON().readFeatures(sourceConfig.data, {
                    featureProjection: 'EPSG:3857'
                }),
            url: typeof sourceConfig.data === 'string' ? sourceConfig.data : undefined,
            format: typeof sourceConfig.data === 'string' ? new GeoJSON() : undefined,
            attributions: sourceConfig.attribution
        });

        const olStyle = this.createStyle(style);

        const layer = new VectorLayer({
            source,
            style: olStyle,
            minZoom: style.minZoom,
            maxZoom: style.maxZoom
        });

        (layer as any).__layerId = layerId;
        return layer;
    }

    private createStyle(style: LayerConfig['layerset'][0]): Style {
        const paint = style.paint || {};

        switch (style.type) {
            case 'fill':
                return new Style({
                    fill: new Fill({
                        color: this.toRgba(
                            (paint as any)['fill-color'] || '#000000',
                            (paint as any)['fill-opacity'] ?? 1
                        )
                    }),
                    stroke: new Stroke({
                        color: this.toRgba(
                            (paint as any)['fill-outline-color'] || (paint as any)['fill-color'] || '#000000',
                            (paint as any)['fill-opacity'] ?? 1
                        ),
                        width: 1
                    })
                });

            case 'line':
                return new Style({
                    stroke: new Stroke({
                        color: this.toRgba(
                            (paint as any)['line-color'] || '#000000',
                            (paint as any)['line-opacity'] ?? 1
                        ),
                        width: (paint as any)['line-width'] || 1
                    })
                });

            case 'circle':
                return new Style({
                    image: new CircleStyle({
                        radius: (paint as any)['circle-radius'] || 5,
                        fill: new Fill({
                            color: this.toRgba(
                                (paint as any)['circle-color'] || '#3399CC',
                                (paint as any)['circle-opacity'] ?? 1
                            )
                        }),
                        stroke: new Stroke({
                            color: this.toRgba(
                                (paint as any)['circle-stroke-color'] || '#ffffff',
                                (paint as any)['circle-stroke-opacity'] ?? 1
                            ),
                            width: (paint as any)['circle-stroke-width'] || 1
                        })
                    })
                });

            default:
                return new Style();
        }
    }

    private toRgba(color: string, opacity: number): string {
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return color;
    }

    removeLayer(layerId: string): void {
        // Check if this is a WarpedMapLayer
        if (this.warpedMapLayers.has(layerId)) {
            const warpedMapLayer = this.warpedMapLayers.get(layerId)!;
            // Type assertion needed due to OL type version differences
            this.map.removeLayer(warpedMapLayer as unknown as BaseLayer);

            const nativeIds = this.logicalToNative.get(layerId) || [];
            for (const id of nativeIds) {
                this.nativeLayerInstances.delete(id);
            }
            this.warpedMapLayers.delete(layerId);
            this.logicalToNative.delete(layerId);
            return;
        }

        const nativeIds = this.logicalToNative.get(layerId) || [];
        const nativeSourceIds = new Set<string>();

        for (const id of nativeIds) {
            const sourceId = this.nativeLayerToSource.get(id);
            if (sourceId) {
                nativeSourceIds.add(sourceId);
            }

            const layer = this.nativeLayerInstances.get(id);
            if (layer) {
                this.map.removeLayer(layer);
                this.nativeLayerInstances.delete(id);
            }
            this.nativeLayerToSource.delete(id);
        }

        this.logicalToNative.delete(layerId);

        for (const sourceId of nativeSourceIds) {
            let stillUsed = false;
            for (const usedSourceId of this.nativeLayerToSource.values()) {
                if (usedSourceId === sourceId) {
                    stillUsed = true;
                    break;
                }
            }
            if (!stillUsed) {
                for (const [logicalId, nativeId] of this.logicalSourceToNative.entries()) {
                    if (nativeId === sourceId) {
                        this.logicalSourceToNative.delete(logicalId);
                        break;
                    }
                }
            }
        }
    }

    getVisibleLayers(): string[] {
        return Array.from(this.logicalToNative.keys());
    }

    isLayerVisible(layerId: string): boolean {
        return this.logicalToNative.has(layerId);
    }
}
