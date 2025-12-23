// src/map/maplibre-adapter.ts

import { IMapCore, IToolService, IMapFactory } from './IMapInterfaces';
import { MapStateStore } from '../store/map-state-store';
import { MapEventBus, LngLat, Pixel } from '../store/map-events';
import { IMapAdapter } from './IMapAdapter';
import { MapCoreService } from './maplibre-services/MapCoreService';
import { MapServiceTemplate } from './maplibre-services/MapServiceTemplate';
import { MapFactoryService } from './maplibre-services/MapFactoryService';
import { MapLayerService } from './maplibre-services/MapLayerService';

/**
 * The concrete Map Adapter implementation (MapLibre).
 * Composes services into a single interface for tools.
 */
export class MapLibreAdapter implements IMapAdapter {
    public readonly store: MapStateStore;
    public readonly events: MapEventBus;
    public readonly core: IMapCore;
    public readonly toolService: IToolService;
    public readonly mapFactory: IMapFactory;
    public readonly layerService: any;

    constructor() {
        this.store = new MapStateStore();
        this.events = new MapEventBus();
        this.core = new MapCoreService(this.store, this.events);
        this.toolService = new MapServiceTemplate({});
        this.mapFactory = new MapFactoryService();
        this.layerService = undefined;
        // Wait for mapInstance to be ready, then initialize layerService
        (this.core as any).onMapReady?.((map: any) => {
            this.layerService = new MapLayerService(map, this.store);
        });
    }

    public project(coords: LngLat): Pixel {
        return this.core.project(coords);
    }
}
