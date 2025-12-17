// src/map/maplibre-services/MapLayerService.ts

import { ILayerService } from '../IMapInterfaces';
import type { LayerConfig, SourceConfig, WMSSourceConfig } from '../../config/types';
import { MapStateStore } from '../../store/map-state-store';
import * as maplibregl from 'maplibre-gl';
import { MapLibreLayerFactory } from './MapLibreLayerFactory';
import { buildWMSGetMapUrl } from '../../utils/wms-url-builder';

export class MapLayerService implements ILayerService {
    private map: maplibregl.Map;
    private store: MapStateStore;
    private logicalToNative: Map<string, string[]> = new Map();
    private logicalSourceToNative: Map<string, string> = new Map();
    // Map native layer id to native source id
    private nativeLayerToSource: Map<string, string> = new Map();
    private catalog: any;
    private sourceIdCounter = 0;

    constructor(map: maplibregl.Map, store: MapStateStore) {
        this.map = map;
        this.store = store;
    }

    setCatalog(catalog: any): void {
        this.catalog = catalog;
    }

    /**
     * Generate a unique native source id for a logical source id.
     */
    private getOrCreateNativeSourceId(sourceConfig: SourceConfig): string {
        if (this.logicalSourceToNative.has(sourceConfig.id)) {
            return this.logicalSourceToNative.get(sourceConfig.id)!;
        }
        // Generate a unique id (could be improved for more robust uniqueness)
        const nativeSourceId = `src-${sourceConfig.id}-${this.sourceIdCounter++}`;
        this.logicalSourceToNative.set(sourceConfig.id, nativeSourceId);
        return nativeSourceId;
    }

    /**
     * Create the native source in the map if it does not exist.
     */
    private ensureNativeSource(nativeSourceId: string, sourceConfig: SourceConfig): void {
        if (!this.map.getSource(nativeSourceId)) {
            let nativeSource: any;
            if (sourceConfig.type === 'raster') {
                if (sourceConfig.service === 'xyz') {
                    let tiles: string[] = [];
                    if (Array.isArray(sourceConfig.url)) {
                        tiles = sourceConfig.url;
                    } else if (sourceConfig.url) {
                        tiles = [sourceConfig.url];
                    }
                    nativeSource = { type: 'raster', tiles };
                    if ('tileSize' in sourceConfig) nativeSource.tileSize = sourceConfig.tileSize;
                    if ('bounds' in sourceConfig) nativeSource.bounds = sourceConfig.bounds;
                    if ('minzoom' in sourceConfig) nativeSource.minzoom = sourceConfig.minzoom;
                    if ('maxzoom' in sourceConfig) nativeSource.maxzoom = sourceConfig.maxzoom;
                    if ('scheme' in sourceConfig) nativeSource.scheme = sourceConfig.scheme;
                    if ('attribution' in sourceConfig) nativeSource.attribution = sourceConfig.attribution;
                    if ('volatile' in sourceConfig) nativeSource.volatile = sourceConfig.volatile;
                } else if (sourceConfig.service === 'wms') {
                    const wmsConfig = sourceConfig as WMSSourceConfig;
                    const wmsUrl = buildWMSGetMapUrl({
                        baseUrl: Array.isArray(wmsConfig.url) ? wmsConfig.url[0] : wmsConfig.url,
                        layers: wmsConfig.layers || '',
                        version: wmsConfig.version,
                        styles: wmsConfig.styles,
                        format: wmsConfig.format,
                        transparent: wmsConfig.transparent,
                        crs: wmsConfig.crs,
                        tileSize: wmsConfig.tileSize,
                    }, 'maplibre');
                    nativeSource = { type: 'raster', tiles: [wmsUrl] };
                    if ('tileSize' in sourceConfig) nativeSource.tileSize = sourceConfig.tileSize;
                    if ('bounds' in sourceConfig) nativeSource.bounds = sourceConfig.bounds;
                    if ('minzoom' in sourceConfig) nativeSource.minzoom = sourceConfig.minzoom;
                    if ('maxzoom' in sourceConfig) nativeSource.maxzoom = sourceConfig.maxzoom;
                    if ('scheme' in sourceConfig) nativeSource.scheme = sourceConfig.scheme;
                    if ('attribution' in sourceConfig) nativeSource.attribution = sourceConfig.attribution;
                    if ('volatile' in sourceConfig) nativeSource.volatile = sourceConfig.volatile;
                }
            } else if (sourceConfig.type === 'geojson') {
                nativeSource = { type: 'geojson', data: (sourceConfig as any).data };
                if ('attribution' in sourceConfig) nativeSource.attribution = (sourceConfig as any).attribution;
            } else if (sourceConfig.type === 'vector') {
                nativeSource = { type: 'vector', url: (sourceConfig as any).url };
                if ('attribution' in sourceConfig) nativeSource.attribution = (sourceConfig as any).attribution;
            }
            this.map.addSource(nativeSourceId, nativeSource);
        }
    }

    async addLayer(layerId: string, layerConfig: LayerConfig, sourceConfig: SourceConfig): Promise<boolean> {
        // Get or create a unique native source id for this logical source
        const nativeSourceId = this.getOrCreateNativeSourceId(sourceConfig);
        // Ensure the native source exists in the map
        this.ensureNativeSource(nativeSourceId, sourceConfig);
        // Use the factory to generate all needed MapLibre layer specs, referencing the nativeSourceId
        const layerSpecs = MapLibreLayerFactory.createLayers(layerConfig, sourceConfig, nativeSourceId);
        const nativeLayerIds: string[] = [];
        for (const layerSpec of layerSpecs) {
            if (!this.map.getLayer(layerSpec.id)) {
                this.map.addLayer(layerSpec);
            }
            nativeLayerIds.push(layerSpec.id);
            // Track which source this native layer uses
            this.nativeLayerToSource.set(layerSpec.id, nativeSourceId);
        }
        this.logicalToNative.set(layerId, nativeLayerIds);
        return true;
    }

    removeLayer(layerId: string): void {
        const nativeIds = this.logicalToNative.get(layerId) || [];
        // Find the native source ids for these layers using the mapping
        const nativeSourceIds = new Set<string>();
        for (const id of nativeIds) {
            const sourceId = this.nativeLayerToSource.get(id);
            if (sourceId) {
                nativeSourceIds.add(sourceId);
            }
            if (this.map.getLayer(id)) {
                this.map.removeLayer(id);
            }
            this.nativeLayerToSource.delete(id);
        }
        this.logicalToNative.delete(layerId);

        // For each native source, check if any remaining native layers reference it
        for (const sourceId of nativeSourceIds) {
            let stillUsed = false;
            for (const usedSourceId of this.nativeLayerToSource.values()) {
                if (usedSourceId === sourceId) {
                    stillUsed = true;
                    break;
                }
            }
            // Only remove if not used and source exists
            if (!stillUsed && this.map.getSource(sourceId)) {
                this.map.removeSource(sourceId);
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
