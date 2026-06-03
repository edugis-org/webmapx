// src/map/maplibre-adapter.ts

import { IMap, IMapCore, IToolService, ISubMapFactory, ILogicalLayerExecutor } from './IMapInterfaces';
import { MapStateStore } from '../store/map-state-store';
import { MapEventBus, LngLat, Pixel } from '../store/map-events';
import { MapCoreService } from './maplibre-services/MapCoreService';
import { MapServiceTemplate } from './maplibre-services/MapServiceTemplate';
import { MapFactoryService } from './maplibre-services/MapFactoryService';
import { MapLayerService } from './maplibre-services/MapLayerService';
import { MapQueryService } from './maplibre-services/MapQueryService';
import { MapMarkerService } from './maplibre-services/MapMarkerService';
import { DeferredLogicalLayerExecutor } from './logical-layer-executor';
import { DeferredQueryService } from './deferred-query-service';
import { emitVisibleLayerEvents } from './visible-layer-utils';
import type { MapStyle } from '../config/types';
import type { IQueryService } from './IQueryService';
import type { MarkerOptions } from './IMapInterfaces';

/**
 * The concrete Map implementation for MapLibre.
 * Implements the unified IMap interface by delegating to specialized services.
 */
export class MapLibreAdapter implements IMap {
    public readonly store: MapStateStore;
    public readonly events: MapEventBus;
    private readonly core: IMapCore;
    public readonly toolService: IToolService;
    public readonly logicalLayers: ILogicalLayerExecutor;
    public readonly queryService: IQueryService;
    public readonly mapFactory: ISubMapFactory;
    private readonly logicalLayerExecutor: DeferredLogicalLayerExecutor;
    private readonly queryExecutor: DeferredQueryService;
    private markerService: MapMarkerService | null = null;
    private lastVisibleLayers: string[] = [];

    constructor() {
        this.store = new MapStateStore();
        this.events = new MapEventBus();
        this.core = new MapCoreService(this.store, this.events);
        this.toolService = new MapServiceTemplate({});
        this.logicalLayerExecutor = new DeferredLogicalLayerExecutor();
        this.logicalLayers = this.logicalLayerExecutor;
        this.queryExecutor = new DeferredQueryService();
        this.queryService = this.queryExecutor;
        this.mapFactory = new MapFactoryService();
        this.store.subscribe((state) => {
            this.lastVisibleLayers = emitVisibleLayerEvents(this.events, this.lastVisibleLayers, state.visibleLayers ?? []);
        });
        // Wait for mapInstance to be ready, then initialize layerService
        (this.core as any).onMapReady?.((map: any) => {
            const bindLogicalLayers = () => {
                const layerService = new MapLayerService(map, this.store);
                this.logicalLayerExecutor.bind(layerService);
                this.queryExecutor.bind(new MapQueryService(map, layerService));
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

    resetNorth(): void {
        this.core.resetNorth();
    }

    resetNorthPitch(): void {
        this.core.resetNorthPitch();
    }

    fitBounds(bbox: [number, number, number, number]): void {
        this.core.fitBounds(bbox);
    }

    setCursor(cursor: string): void {
        this.core.setCursor(cursor);
    }

    setPanEnabled(enabled: boolean): void {
        this.core.setPanEnabled(enabled);
    }

    setLayerVisibility(layerId: string, visible: boolean): void {
        this.core.setLayerVisibility(layerId, visible);
    }

    getSourceData(sourceId: string): GeoJSON.FeatureCollection | string | null {
        return this.core.getSourceData(sourceId);
    }

    getLayerSourceId(layerId: string): string | null {
        return this.core.getLayerSourceId(layerId);
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

    addLayer(layer: any, options?: { beforeLayerId?: string; afterLayerId?: string }): void {
        this.core.addLayer(layer, options);
    }

    addSource(id: string, config: any): void {
        this.core.addSource(id, config);
    }

    removeLayer(id: string): void {
        this.core.removeLayer(id);
    }

    removeSource(id: string): void {
        this.core.removeSource(id);
    }

    getSource(id: string) {
        return this.core.getSource(id);
    }

    suppressBusySignalForSource(sourceId: string): void {
        this.core.suppressBusySignalForSource(sourceId);
    }

    unsuppressBusySignalForSource(sourceId: string): void {
        this.core.unsuppressBusySignalForSource(sourceId);
    }

    addMarker(id: string, lngLat: LngLat, options?: MarkerOptions): void {
        this.markerService?.add(id, lngLat, options);
    }

    moveMarker(id: string, lngLat: LngLat): void {
        this.markerService?.move(id, lngLat);
    }

    removeMarker(id: string): void {
        this.markerService?.remove(id);
    }

}
