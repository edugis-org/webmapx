// src/map/leaflet-adapter.ts

import { IMap, IMapCore, IToolService, ISubMapFactory, ILayerService } from './IMapInterfaces';
import { MapStateStore } from '../store/map-state-store';
import { MapEventBus, LngLat, Pixel } from '../store/map-events';
import { MapCoreService } from './leaflet-services/MapCoreService';
import { MapServiceTemplate } from './leaflet-services/MapServiceTemplate';
import { MapFactoryService } from './leaflet-services/MapFactoryService';
import { MapLayerService } from './leaflet-services/MapLayerService';
import type { LayerConfig, SourceConfig, CatalogConfig, MapStyle } from '../config/types';

/**
 * The concrete Map implementation for Leaflet.
 * Implements the unified IMap interface by delegating to specialized services.
 */
export class LeafletAdapter implements IMap {
    public readonly store: MapStateStore;
    public readonly events: MapEventBus;
    private readonly core: IMapCore;
    public readonly toolService: IToolService;
    public readonly mapFactory: ISubMapFactory;
    private layerService?: ILayerService;
    private lastVisibleLayers: string[] = [];
    private pendingCatalog: CatalogConfig | null = null;
    private pendingAddRequests: Array<{
        layerId: string;
        layerConfig: LayerConfig;
        sourceConfig: SourceConfig;
        resolve: (value: boolean) => void;
    }> = [];
    private pendingRemoveRequests: string[] = [];

    constructor() {
        this.store = new MapStateStore();
        this.events = new MapEventBus();
        this.core = new MapCoreService(this.store, this.events);
        this.toolService = new MapServiceTemplate({});
        this.mapFactory = new MapFactoryService();
        this.layerService = undefined;
        this.store.subscribe((state) => {
            this.emitVisibleLayerEvents(state.visibleLayers ?? []);
        });
        // Wait for mapInstance to be ready, then initialize layerService
        (this.core as any).onMapReady?.((map: any) => {
            this.layerService = new MapLayerService(map, this.store);
            this.flushPendingLayerOperations();
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

    setCatalog(catalog: CatalogConfig): void {
        this.pendingCatalog = catalog;
        this.layerService?.setCatalog(catalog);
    }

    async addCatalogLayer(layerId: string, layerConfig: LayerConfig, sourceConfig: SourceConfig): Promise<boolean> {
        if (this.layerService) {
            return this.layerService.addLayer(layerId, layerConfig, sourceConfig);
        }

        return new Promise<boolean>((resolve) => {
            this.pendingAddRequests.push({ layerId, layerConfig, sourceConfig, resolve });
        });
    }

    removeCatalogLayer(layerId: string): void {
        if (this.layerService) {
            this.layerService.removeLayer(layerId);
            return;
        }

        this.pendingRemoveRequests.push(layerId);
    }

    getVisibleCatalogLayers(): string[] {
        return this.layerService?.getVisibleLayers() ?? [];
    }

    isCatalogLayerVisible(layerId: string): boolean {
        return this.layerService?.isLayerVisible(layerId) ?? false;
    }

    private emitVisibleLayerEvents(nextVisibleLayers: string[]): void {
        const previous = new Set(this.lastVisibleLayers);
        const next = new Set(nextVisibleLayers);

        for (const layerId of nextVisibleLayers) {
            if (!previous.has(layerId)) {
                this.events.emit({ type: 'layer-add', layerId, visibleLayers: [...nextVisibleLayers] });
            }
        }

        for (const layerId of this.lastVisibleLayers) {
            if (!next.has(layerId)) {
                this.events.emit({ type: 'layer-remove', layerId, visibleLayers: [...nextVisibleLayers] });
            }
        }

        this.lastVisibleLayers = [...nextVisibleLayers];
    }

    private flushPendingLayerOperations(): void {
        if (!this.layerService) {
            return;
        }

        if (this.pendingCatalog) {
            this.layerService.setCatalog(this.pendingCatalog);
        }

        const pendingRemovals = [...this.pendingRemoveRequests];
        this.pendingRemoveRequests = [];
        for (const layerId of pendingRemovals) {
            this.layerService.removeLayer(layerId);
        }

        const pendingAdds = [...this.pendingAddRequests];
        this.pendingAddRequests = [];
        pendingAdds.forEach(async (request) => {
            try {
                const success = await this.layerService!.addLayer(request.layerId, request.layerConfig, request.sourceConfig);
                request.resolve(success);
            } catch {
                request.resolve(false);
            }
        });
    }
}
