// src/map/maplibre-services/MapLayerService.ts

import { ILayerService, LayerInsertOptions } from '../IMapInterfaces';
import type { LayerConfig, SourceConfig, WMSSourceConfig } from '../../config/types';
import { MapStateStore } from '../../store/map-state-store';
import * as maplibregl from 'maplibre-gl';
import { MapLibreLayerFactory } from './MapLibreLayerFactory';
import { buildWMSGetMapUrl } from '../../utils/wms-url-builder';
import type { WarpedMapLayer } from '@allmaps/maplibre';

const WARPEDMAP_PROTOCOL = 'warpedmap://';

export class MapLayerService implements ILayerService {
    private map: maplibregl.Map;
    private store: MapStateStore;
    private logicalToNative: Map<string, string[]> = new Map();
    private logicalSourceToNative: Map<string, string> = new Map();
    // Map native layer id to native source id
    private nativeLayerToSource: Map<string, string> = new Map();
    // Track WarpedMapLayer instances for cleanup
    private warpedMapLayers: Map<string, WarpedMapLayer> = new Map();
    private catalog: any;
    private sourceIdCounter = 0;
    private logicalLayerLegendRole: Map<string, 'background' | 'overlay'> = new Map();

    constructor(map: maplibregl.Map, store: MapStateStore) {
        this.map = map;
        this.store = store;
    }

    private updateVisibleLayers(): void {
        this.store.dispatch({ visibleLayers: Array.from(this.logicalToNative.keys()) }, 'MAP');
    }

    private resolveLogicalLayerLegendRole(layerConfig: LayerConfig): 'background' | 'overlay' {
        const metadata = (layerConfig?.metadata && typeof layerConfig.metadata === 'object')
            ? (layerConfig.metadata as Record<string, unknown>)
            : null;

        return metadata?.legendRole === 'background' ? 'background' : 'overlay';
    }

    private findNextStyleLayerId(afterNativeLayerId: string): string | undefined {
        const styleLayers = this.map.getStyle()?.layers ?? [];
        for (let index = 0; index < styleLayers.length; index += 1) {
            if (styleLayers[index].id !== afterNativeLayerId) {
                continue;
            }
            const next = styleLayers[index + 1];
            return next?.id;
        }
        return undefined;
    }

    private resolveInsertBeforeLayerIdFromOptions(options?: LayerInsertOptions): string | undefined {
        if (options?.beforeLayerId) {
            const beforeNativeLayerIds = this.logicalToNative.get(options.beforeLayerId) ?? [];
            for (const nativeLayerId of beforeNativeLayerIds) {
                if (this.map.getLayer(nativeLayerId)) {
                    return nativeLayerId;
                }
            }
        }

        if (options?.afterLayerId) {
            const afterNativeLayerIds = this.logicalToNative.get(options.afterLayerId) ?? [];
            for (let index = afterNativeLayerIds.length - 1; index >= 0; index -= 1) {
                const nativeLayerId = afterNativeLayerIds[index];
                if (!this.map.getLayer(nativeLayerId)) {
                    continue;
                }
                return this.findNextStyleLayerId(nativeLayerId);
            }
        }

        return undefined;
    }

    private collectBackgroundNativeLayerIds(): Set<string> {
        const ids = new Set<string>();
        for (const [logicalLayerId, nativeLayerIds] of this.logicalToNative.entries()) {
            const role = this.logicalLayerLegendRole.get(logicalLayerId) ?? 'overlay';
            if (role !== 'background') {
                continue;
            }

            for (const nativeLayerId of nativeLayerIds) {
                ids.add(nativeLayerId);
            }
        }
        return ids;
    }

    private findBackgroundInsertionBeforeLayerId(): string | undefined {
        const styleLayers = this.map.getStyle()?.layers ?? [];
        if (styleLayers.length === 0) {
            return undefined;
        }

        const backgroundNativeLayerIds = this.collectBackgroundNativeLayerIds();
        for (const styleLayer of styleLayers) {
            if (!backgroundNativeLayerIds.has(styleLayer.id)) {
                return styleLayer.id;
            }
        }

        return undefined;
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
                    if (typeof sourceConfig.minzoom === 'number') nativeSource.minzoom = sourceConfig.minzoom;
                    if (typeof sourceConfig.maxzoom === 'number') nativeSource.maxzoom = sourceConfig.maxzoom;
                    if ('scheme' in sourceConfig) nativeSource.scheme = sourceConfig.scheme;
                    if (typeof sourceConfig.attribution === 'string') nativeSource.attribution = sourceConfig.attribution;
                    if (typeof (sourceConfig as any).volatile === 'boolean') nativeSource.volatile = (sourceConfig as any).volatile;
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
                    if (typeof sourceConfig.minzoom === 'number') nativeSource.minzoom = sourceConfig.minzoom;
                    if (typeof sourceConfig.maxzoom === 'number') nativeSource.maxzoom = sourceConfig.maxzoom;
                    if ('scheme' in sourceConfig) nativeSource.scheme = sourceConfig.scheme;
                    if (typeof sourceConfig.attribution === 'string') nativeSource.attribution = sourceConfig.attribution;
                    if (typeof (sourceConfig as any).volatile === 'boolean') nativeSource.volatile = (sourceConfig as any).volatile;
                }
            } else if (sourceConfig.type === 'geojson') {
                nativeSource = { type: 'geojson', data: (sourceConfig as any).data };
                if (typeof (sourceConfig as any).attribution === 'string') nativeSource.attribution = (sourceConfig as any).attribution;
            } else if (sourceConfig.type === 'vector') {
                const vectorConfig = sourceConfig as any;
                nativeSource = { type: 'vector' };
                if (Array.isArray(vectorConfig.tiles)) {
                    nativeSource.tiles = vectorConfig.tiles;
                }
                if (typeof vectorConfig.url === 'string') {
                    nativeSource.url = vectorConfig.url;
                }
                if (typeof vectorConfig.minzoom === 'number') {
                    nativeSource.minzoom = vectorConfig.minzoom;
                }
                if (typeof vectorConfig.maxzoom === 'number') {
                    nativeSource.maxzoom = vectorConfig.maxzoom;
                }
                if (typeof vectorConfig.attribution === 'string') nativeSource.attribution = vectorConfig.attribution;
            }
            this.map.addSource(nativeSourceId, nativeSource);
        }
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
    private async addWarpedMapLayer(layerId: string, sourceConfig: SourceConfig, insertBeforeLayerId?: string): Promise<boolean> {
        const { WarpedMapLayer } = await import('@allmaps/maplibre');
        const url = 'url' in sourceConfig
            ? (Array.isArray(sourceConfig.url) ? sourceConfig.url[0] : sourceConfig.url)
            : '';
        const annotationUrl = this.parseWarpedMapUrl(url);

        // Create a unique layer ID for the WarpedMapLayer
        const warpedLayerId = `warpedmap-${layerId}`;

        // Create and configure the WarpedMapLayer
        const warpedMapLayer = new WarpedMapLayer({ layerId: warpedLayerId });

        // Add the layer to the map
        // Type assertion needed due to MapLibre type version differences
        this.map.addLayer(warpedMapLayer as unknown as maplibregl.CustomLayerInterface, insertBeforeLayerId);

        // Load the georeference annotation
        await warpedMapLayer.addGeoreferenceAnnotationByUrl(annotationUrl);

        // Track the layer
        this.warpedMapLayers.set(layerId, warpedMapLayer);
        this.logicalToNative.set(layerId, [warpedLayerId]);
        this.updateVisibleLayers();

        return true;
    }

    async addLayer(layerId: string, layerConfig: LayerConfig, sourceConfig: SourceConfig, options?: LayerInsertOptions): Promise<boolean> {
        const legendRole = this.resolveLogicalLayerLegendRole(layerConfig);
        const explicitInsertBeforeLayerId = this.resolveInsertBeforeLayerIdFromOptions(options);
        const insertBeforeLayerId = explicitInsertBeforeLayerId
            ?? (legendRole === 'background' ? this.findBackgroundInsertionBeforeLayerId() : undefined);

        // Check for warpedmap:// protocol
        if (this.isWarpedMapSource(sourceConfig)) {
            const success = await this.addWarpedMapLayer(layerId, sourceConfig, insertBeforeLayerId);
            if (success) {
                this.logicalLayerLegendRole.set(layerId, legendRole);
            }
            return success;
        }

        // Get or create a unique native source id for this logical source
        const nativeSourceId = this.getOrCreateNativeSourceId(sourceConfig);
        // Ensure the native source exists in the map
        this.ensureNativeSource(nativeSourceId, sourceConfig);
        if (!this.map.getSource(nativeSourceId)) {
            return false;
        }
        // Use the factory to generate all needed MapLibre layer specs, referencing the nativeSourceId
        const layerSpecs = MapLibreLayerFactory.createLayers(layerConfig, sourceConfig, nativeSourceId);
        const nativeLayerIds: string[] = [...(this.logicalToNative.get(layerId) || [])];
        for (const layerSpec of layerSpecs) {
            if (!this.map.getLayer(layerSpec.id)) {
                this.map.addLayer(layerSpec, insertBeforeLayerId);
            }
            nativeLayerIds.push(layerSpec.id);
            // Track which source this native layer uses
            this.nativeLayerToSource.set(layerSpec.id, nativeSourceId);
        }
        this.logicalLayerLegendRole.set(layerId, legendRole);
        this.logicalToNative.set(layerId, Array.from(new Set(nativeLayerIds)));
        this.updateVisibleLayers();
        return true;
    }

    removeLayer(layerId: string): void {
        // Check if this is a WarpedMapLayer
        if (this.warpedMapLayers.has(layerId)) {
            // Remove from map - WarpedMapLayer handles its own cleanup
            const nativeIds = this.logicalToNative.get(layerId) || [];
            for (const id of nativeIds) {
                if (this.map.getLayer(id)) {
                    this.map.removeLayer(id);
                }
            }
            this.warpedMapLayers.delete(layerId);
            this.logicalToNative.delete(layerId);
            this.logicalLayerLegendRole.delete(layerId);
            this.updateVisibleLayers();
            return;
        }

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
        this.logicalLayerLegendRole.delete(layerId);

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

        this.updateVisibleLayers();
    }

    getVisibleLayers(): string[] {
        return Array.from(this.logicalToNative.keys());
    }

    isLayerVisible(layerId: string): boolean {
        return this.logicalToNative.has(layerId);
    }
}
