// src/map/maplibre-services/MapLayerService.ts

import { ILayerService } from '../IMapInterfaces';
import type { LayerConfig, SourceConfig } from '../../config/types';
import { MapStateStore } from '../../store/map-state-store';
import * as maplibregl from 'maplibre-gl';
import { MapLibreLayerFactory } from './MapLibreLayerFactory';

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
            // Compose a native source object from sourceConfig (remove id property)
            const { id, ...rest } = sourceConfig as any;
            let nativeSource = { ...rest };
            // Special handling for raster xyz: convert url to tiles array
            if (sourceConfig.type === 'raster' && sourceConfig.service === 'xyz') {
                // url can be a string or array; always convert to array
                let tiles: string[] = [];
                if (Array.isArray(sourceConfig.url)) {
                    tiles = sourceConfig.url;
                } else if (typeof sourceConfig.url === 'string') {
                    tiles = [sourceConfig.url];
                }
                // Build native source with all valid optional members if present
                nativeSource = {
                    type: 'raster',
                    tiles,
                };
                // Optional members
                if (typeof sourceConfig.tileSize === 'number') nativeSource.tileSize = sourceConfig.tileSize;
                if (Array.isArray(sourceConfig.bounds) && sourceConfig.bounds.length === 4) nativeSource.bounds = sourceConfig.bounds;
                if (typeof sourceConfig.minzoom === 'number') nativeSource.minzoom = sourceConfig.minzoom;
                if (typeof sourceConfig.maxzoom === 'number') nativeSource.maxzoom = sourceConfig.maxzoom;
                if (typeof sourceConfig.scheme === 'string') nativeSource.scheme = sourceConfig.scheme;
                if (typeof sourceConfig.attribution === 'string') nativeSource.attribution = sourceConfig.attribution;
                if (typeof sourceConfig.volatile === 'boolean') nativeSource.volatile = sourceConfig.volatile;
                // Remove undefined values
                Object.keys(nativeSource).forEach(
                    (k) => nativeSource[k] === undefined && delete nativeSource[k]
                );
            } else {
                // Remove url property if present (not valid for other types)
                if ('url' in nativeSource) delete nativeSource.url;
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
