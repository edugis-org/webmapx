// src/map/leaflet-adapter.ts

import { IMap, IMapCore, IToolService, ISubMapFactory, LayerInsertOptions, type QueryLayerFeaturesOptions } from './IMapInterfaces';
import { version as leafletVersion } from 'leaflet';

import { LngLat, Pixel } from '../store/map-events';
import { BaseAdapter } from './base-adapter';
import { MapCoreService } from './leaflet-services/MapCoreService';
import { MapServiceTemplate } from './leaflet-services/MapServiceTemplate';
import { MapFactoryService } from './leaflet-services/MapFactoryService';
import { MapLayerService } from './leaflet-services/MapLayerService';
import { MapQueryService } from './leaflet-services/MapQueryService';
import { MapMarkerService } from './leaflet-services/MapMarkerService';
import { DeferredLogicalLayerExecutor } from './logical-layer-executor';
import { DeferredQueryService } from './deferred-query-service';
import type { MapStyle } from '../config/types';
import type { IQueryService } from './IQueryService';

/**
 * The concrete Map implementation for Leaflet.
 * Implements the unified IMap interface by delegating to specialized services.
 */
export class LeafletAdapter extends BaseAdapter implements IMap {
    public readonly engineId = 'leaflet';
    public readonly engineVersion = leafletVersion;
    private readonly core: IMapCore;
    public readonly toolService: IToolService;
    public readonly queryService: IQueryService;
    public readonly mapFactory: ISubMapFactory;
    private readonly logicalLayerExecutor: DeferredLogicalLayerExecutor;
    private readonly queryExecutor: DeferredQueryService;
    private markerService: MapMarkerService | null = null;

    constructor() {
        super();
        this.core = new MapCoreService(this.store, this.events);
        this.toolService = new MapServiceTemplate({});
        this.logicalLayerExecutor = new DeferredLogicalLayerExecutor();
        this.queryExecutor = new DeferredQueryService();
        this.queryService = this.queryExecutor;
        this.mapFactory = new MapFactoryService();
        // Wait for mapInstance to be ready, then initialize layerService
        (this.core as any).onMapReady?.((map: any) => {
            const layerService = new MapLayerService(map, this.store);
            (this.core as MapCoreService).setLayerOrderRegistry(layerService);
            this.logicalLayerExecutor.bind(layerService);
            this.queryExecutor.bind(new MapQueryService(map, layerService));
            this.markerService = new MapMarkerService(map);
        });
    }

    // ===== Delegation Methods =====

    initialize(containerId: string, options?: { center?: [number, number]; zoom?: number; minZoom?: number; maxZoom?: number; minPitch?: number; maxPitch?: number; maxBounds?: [number, number, number, number]; styleUrl?: string; style?: MapStyle }): void {
        this.core.initialize(containerId, options);
    }

    getViewportState() {
        return this.core.getViewportState();
    }

    setViewport(center: [number, number], zoom: number): void {
        this.core.setViewport(center, zoom);
    }

    getZoom(): number {
        return this.core.getZoom();
    }

    setZoom(level: number): void {
        this.core.setZoom(level);
    }

    getBearing(): number {
        return this.core.getBearing();
    }

    setBearing(bearing: number): void {
        this.core.setBearing(bearing);
    }

    getPitch(): number {
        return this.core.getPitch();
    }

    setPitch(pitch: number): void {
        this.core.setPitch(pitch);
    }

    setTerrainEnabled(_enabled: boolean): boolean {
        return false;
    }

    isTerrainEnabled(): boolean | null {
        return null;
    }

    resetNorth(): void {
        this.core.resetNorth();
    }

    resetNorthPitch(): void {
        this.core.resetNorthPitch();
    }

    fitBounds(bbox: [number, number, number, number]): void {
        this.core.fitBounds(bbox);
    }

    setProjection(_projection: string | { name: string; center?: [number, number]; parallels?: [number, number] }): boolean {
        return false;
    }

    getProjection(): { name: string; center?: [number, number]; parallels?: [number, number] } | null {
        return null;
    }

    setCursor(cursor: string): void {
        this.core.setCursor(cursor);
    }

    setPanEnabled(enabled: boolean): void {
        this.core.setPanEnabled(enabled);
    }

    setTouchCaptureEnabled(_enabled: boolean): void {}

    setDoubleClickZoomEnabled(enabled: boolean): void {
        this.core.setDoubleClickZoomEnabled(enabled);
    }

    setLayerVisibility(layerId: string, visible: boolean): void {
        this.logicalLayerExecutor.setLayerVisibility(layerId, visible);
    }

    setLayerOpacity(layerId: string, opacity: number): void {
        this.logicalLayerExecutor.setLayerOpacity(layerId, opacity);
    }

    getSourceData(sourceId: string): GeoJSON.FeatureCollection | string | null {
        return this.core.getSourceData(sourceId) ?? this.logicalLayerExecutor.getSourceData(sourceId);
    }

    queryLayerFeatures(layerId: string, options?: QueryLayerFeaturesOptions): Promise<GeoJSON.FeatureCollection> {
        return this.logicalLayerExecutor.queryLayerFeatures(layerId, options);
    }

    getLayerSourceLayers(layerId: string): string[] {
        return this.logicalLayerExecutor.getLayerSourceLayers(layerId);
    }

    project(coords: LngLat): Pixel {
        return this.core.project(coords);
    }

    unproject(pixel: Pixel): LngLat | null {
        return this.core.unproject(pixel);
    }

    getNavigationCapabilities() {
        return this.core.getNavigationCapabilities();
    }

    protected async engineAddLayer(layer: any, options?: LayerInsertOptions): Promise<boolean> {
        const success = await this.logicalLayerExecutor.addLayer(layer, options);
        if (success) return true;
        return this.core.addLayer(layer, options);
    }

    removeLogicalLayer(layerId: string): void {
        this.removeLayer(layerId);
    }

    protected engineAddSource(id: string, config: any): void {
        this.core.addSource(id, config);
    }

    protected engineRemoveLayer(id: string): void {
        this.logicalLayerExecutor.removeLayer(id);
        this.core.removeLayer(id);
    }

    protected engineRemoveSource(id: string): void {
        this.core.removeSource(id);
    }

    protected getCore(): IMapCore {
        return this.core;
    }

    protected getLogicalLayerExecutor(): DeferredLogicalLayerExecutor {
        return this.logicalLayerExecutor;
    }

    protected getMarkerService(): MapMarkerService | null {
        return this.markerService;
    }

}
