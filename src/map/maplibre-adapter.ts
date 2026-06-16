// src/map/maplibre-adapter.ts

import { IMap, IMapCore, IToolService, ISubMapFactory, LayerInsertOptions, type SourceFeatureQueryOptions, type SourceFeatureSample } from './IMapInterfaces';
import * as _ml from 'maplibre-gl';

import { LngLat, Pixel } from '../store/map-events';
import { BaseAdapter } from './base-adapter';
import { MapCoreService } from './maplibre-services/MapCoreService';
import { MapServiceTemplate } from './maplibre-services/MapServiceTemplate';
import { MapFactoryService } from './maplibre-services/MapFactoryService';
import { MapLayerService } from './maplibre-services/MapLayerService';
import { MapQueryService } from './maplibre-services/MapQueryService';
import { MapMarkerService } from './maplibre-services/MapMarkerService';
import { DeferredLogicalLayerExecutor } from './logical-layer-executor';
import { DeferredQueryService } from './deferred-query-service';
import type { MapStyle } from '../config/types';
import type { IQueryService } from './IQueryService';

/**
 * The concrete Map implementation for MapLibre.
 * Implements the unified IMap interface by delegating to specialized services.
 */
export class MapLibreAdapter extends BaseAdapter implements IMap {
    public readonly engineId = 'maplibre';
    public readonly engineVersion: string = typeof (_ml as any).getVersion === 'function'
        ? (_ml as any).getVersion()
        : ((_ml as any).version ?? '');
    private readonly core: IMapCore;
    public readonly toolService: IToolService;
    public readonly queryService: IQueryService;
    public readonly mapFactory: ISubMapFactory;
    private readonly logicalLayerExecutor: DeferredLogicalLayerExecutor;
    private readonly queryExecutor: DeferredQueryService;
    private markerService: MapMarkerService | null = null;
    private layerService: MapLayerService | null = null;

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
            const bindLogicalLayers = () => {
                const layerService = new MapLayerService(map, this.store);
                this.layerService = layerService;
                this.logicalLayerExecutor.bind(layerService);
                this.queryExecutor.bind(new MapQueryService(map, layerService, this.store));
                this.markerService = new MapMarkerService(map);
            };

            if (typeof map?.once === 'function') {
                map.once('load', bindLogicalLayers);
                return;
            }

            // Fallback for unexpected map object shapes.
            bindLogicalLayers();
        });
    }

    // ===== Delegation Methods =====

    initialize(containerId: string, options?: { center?: [number, number]; zoom?: number; minZoom?: number; maxZoom?: number; minPitch?: number; maxPitch?: number; styleUrl?: string; style?: MapStyle }): void {
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

    setTerrainEnabled(enabled: boolean, terrainSource?: unknown): boolean {
        // Resolve logical source id → native source id so core uses the same
        // source that MapLayerService already registered for the hillshade layer.
        const logicalId = (terrainSource as any)?.id as string | undefined;
        const nativeSourceId = logicalId ? this.layerService?.getNativeSourceId(logicalId) : undefined;
        return (this.core as MapCoreService).setTerrainEnabled(enabled, terrainSource, nativeSourceId);
    }

    isTerrainEnabled(): boolean | null {
        return this.core.isTerrainEnabled();
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

    setProjection(projection: string | { name: string; center?: [number, number]; parallels?: [number, number] }): boolean {
        return this.core.setProjection(projection);
    }

    getProjection(): { name: string; center?: [number, number]; parallels?: [number, number] } | null {
        return this.core.getProjection();
    }

    setCursor(cursor: string): void {
        this.core.setCursor(cursor);
    }

    setPanEnabled(enabled: boolean): void {
        this.core.setPanEnabled(enabled);
    }

    setTouchCaptureEnabled(_enabled: boolean): void {
        // MapLibre canvas has touch-action:none by default; no action needed
    }

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

    querySourceFeatures(sourceId: string, options?: SourceFeatureQueryOptions): SourceFeatureSample | null {
        return this.logicalLayerExecutor.querySourceFeatures(sourceId, options);
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
