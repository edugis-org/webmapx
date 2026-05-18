// src/map/openlayers-adapter.ts

import { IMap, IMapCore, IToolService, ISubMapFactory, ILayerService } from './IMapInterfaces';
import { MapStateStore } from '../store/map-state-store';
import { MapEventBus, LngLat, Pixel } from '../store/map-events';
import { MapCoreService } from './openlayers-services/MapCoreService';
import { MapServiceTemplate } from './openlayers-services/MapServiceTemplate';
import { MapFactoryService } from './openlayers-services/MapFactoryService';
import { MapLayerService } from './openlayers-services/MapLayerService';
import type { LayerConfig, SourceConfig, CatalogConfig, MapStyle } from '../config/types';

/**
 * The concrete Map implementation for OpenLayers.
 * Implements the unified IMap interface by delegating to specialized services.
 */
export class OpenLayersAdapter implements IMap {
    public readonly store: MapStateStore;
    public readonly events: MapEventBus;
    private readonly core: IMapCore;
    public readonly toolService: IToolService;
    public readonly mapFactory: ISubMapFactory;
    private layerService?: ILayerService;

    constructor() {
        this.store = new MapStateStore();
        this.events = new MapEventBus();
        this.core = new MapCoreService(this.store, this.events);
        this.toolService = new MapServiceTemplate();
        this.mapFactory = new MapFactoryService();
        this.layerService = undefined;
        // Wait for mapInstance to be ready, then initialize layerService
        (this.core as any).onMapReady?.((map: any) => {
            this.layerService = new MapLayerService(map, this.store);
        });
    }

    // ===== Delegation Methods =====

    initialize(containerId: string, options?: { center?: [number, number]; zoom?: number; styleUrl?: string; style?: MapStyle }): void {
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

    project(coords: LngLat): Pixel {
        return this.core.project(coords);
    }

    unproject(pixel: Pixel): LngLat | null {
        return this.core.unproject(pixel);
    }

    getNavigationCapabilities() {
        return this.core.getNavigationCapabilities();
    }

    addLayer(layer: any): void {
        this.core.addLayer(layer);
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

    setCatalog(catalog: CatalogConfig): void {
        this.layerService?.setCatalog(catalog);
    }

    async addCatalogLayer(layerId: string, layerConfig: LayerConfig, sourceConfig: SourceConfig): Promise<boolean> {
        return this.layerService?.addLayer(layerId, layerConfig, sourceConfig) ?? false;
    }

    removeCatalogLayer(layerId: string): void {
        this.layerService?.removeLayer(layerId);
    }

    getVisibleCatalogLayers(): string[] {
        return this.layerService?.getVisibleLayers() ?? [];
    }

    isCatalogLayerVisible(layerId: string): boolean {
        return this.layerService?.isLayerVisible(layerId) ?? false;
    }
}
