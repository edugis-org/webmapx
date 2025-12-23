// src/map/leaflet-services/MapLayerService.ts

import { ILayerService } from '../IMapInterfaces';
import type { LayerConfig, SourceConfig, WMSSourceConfig, GeoJSONSourceConfig } from '../../config/types';
import { MapStateStore } from '../../store/map-state-store';
import * as L from 'leaflet';
import { LeafletLayerFactory } from './LeafletLayerFactory';

const WARPEDMAP_PROTOCOL = 'warpedmap://';

export class MapLayerService implements ILayerService {
    private map: L.Map;
    private store: MapStateStore;
    private logicalToNative: Map<string, string[]> = new Map();
    // Track native layer instances for removal
    private nativeLayerInstances: Map<string, L.Layer> = new Map();
    // Track WarpedMapLayer instances for cleanup (if @allmaps/leaflet is used)
    private warpedMapLayers: Map<string, any> = new Map();
    private catalog: any;
    private sourceIdCounter = 0;

    constructor(map: L.Map, store: MapStateStore) {
        this.map = map;
        this.store = store;
    }

    setCatalog(catalog: any): void {
        this.catalog = catalog;
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
     * Note: Requires @allmaps/leaflet to be installed for full support.
     */
    private async addWarpedMapLayer(layerId: string, sourceConfig: SourceConfig): Promise<boolean> {
        const url = 'url' in sourceConfig
            ? (Array.isArray(sourceConfig.url) ? sourceConfig.url[0] : sourceConfig.url)
            : '';
        const annotationUrl = this.parseWarpedMapUrl(url);

        try {
            // Dynamic import of @allmaps/leaflet
            const { WarpedMapLayer } = await import('@allmaps/leaflet');

            // Create a unique layer ID for the WarpedMapLayer
            const warpedLayerId = `warpedmap-${layerId}`;

            // Create and configure the WarpedMapLayer
            const warpedMapLayer = new WarpedMapLayer();

            // Add the layer to the map
            warpedMapLayer.addTo(this.map);

            // Load the georeference annotation
            await warpedMapLayer.addGeoreferenceAnnotationByUrl(annotationUrl);

            // Track the layer
            this.warpedMapLayers.set(layerId, warpedMapLayer);
            this.nativeLayerInstances.set(warpedLayerId, warpedMapLayer);
            this.logicalToNative.set(layerId, [warpedLayerId]);

            return true;
        } catch (error) {
            console.warn('[LEAFLET LAYER SERVICE] @allmaps/leaflet not available or error loading warped map:', error);
            return false;
        }
    }

    async addLayer(layerId: string, layerConfig: LayerConfig, sourceConfig: SourceConfig): Promise<boolean> {
        // Check for warpedmap:// protocol
        if (this.isWarpedMapSource(sourceConfig)) {
            return this.addWarpedMapLayer(layerId, sourceConfig);
        }

        const nativeLayerIds: string[] = [];

        // Handle different source types
        if (sourceConfig.type === 'raster') {
            const layerSpecs = LeafletLayerFactory.createLayers(layerConfig, sourceConfig);

            for (const spec of layerSpecs) {
                if (!this.nativeLayerInstances.has(spec.id)) {
                    spec.layer.addTo(this.map);
                    this.nativeLayerInstances.set(spec.id, spec.layer);
                    nativeLayerIds.push(spec.id);
                }
            }
        } else if (sourceConfig.type === 'geojson') {
            // Load GeoJSON data
            const geoJsonConfig = sourceConfig as GeoJSONSourceConfig;
            let data: GeoJSON.FeatureCollection | GeoJSON.Feature;

            if (typeof geoJsonConfig.data === 'string') {
                // Fetch from URL
                try {
                    const response = await fetch(geoJsonConfig.data);
                    data = await response.json();
                } catch (error) {
                    console.error('[LEAFLET LAYER SERVICE] Failed to fetch GeoJSON:', error);
                    return false;
                }
            } else {
                data = geoJsonConfig.data;
            }

            const layerSpecs = LeafletLayerFactory.createGeoJSONLayer(layerConfig, sourceConfig, data);

            for (const spec of layerSpecs) {
                if (!this.nativeLayerInstances.has(spec.id)) {
                    spec.layer.addTo(this.map);
                    this.nativeLayerInstances.set(spec.id, spec.layer);
                    nativeLayerIds.push(spec.id);
                }
            }
        } else if (sourceConfig.type === 'vector') {
            // Vector tile sources require additional plugins like Leaflet.VectorGrid
            console.warn('[LEAFLET LAYER SERVICE] Vector tile sources require leaflet.vectorgrid plugin');
            return false;
        }

        this.logicalToNative.set(layerId, nativeLayerIds);
        return true;
    }

    removeLayer(layerId: string): void {
        // Check if this is a WarpedMapLayer
        if (this.warpedMapLayers.has(layerId)) {
            const warpedLayer = this.warpedMapLayers.get(layerId);
            if (warpedLayer) {
                this.map.removeLayer(warpedLayer);
            }
            this.warpedMapLayers.delete(layerId);
        }

        const nativeIds = this.logicalToNative.get(layerId) || [];

        for (const id of nativeIds) {
            const layer = this.nativeLayerInstances.get(id);
            if (layer) {
                this.map.removeLayer(layer);
                this.nativeLayerInstances.delete(id);
            }
        }

        this.logicalToNative.delete(layerId);
    }

    getVisibleLayers(): string[] {
        return Array.from(this.logicalToNative.keys());
    }

    isLayerVisible(layerId: string): boolean {
        return this.logicalToNative.has(layerId);
    }
}
