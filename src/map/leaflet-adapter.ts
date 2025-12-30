// src/map/leaflet-adapter.ts

import { IMapCore, IToolService, IMapFactory, ILayerService } from './IMapInterfaces';
import { MapStateStore } from '../store/map-state-store';
import { MapEventBus, LngLat, Pixel } from '../store/map-events';
import { IMapAdapter } from './IMapAdapter';
import { MapCoreService } from './leaflet-services/MapCoreService';
import { MapServiceTemplate } from './leaflet-services/MapServiceTemplate';
import { MapFactoryService } from './leaflet-services/MapFactoryService';
import { MapLayerService } from './leaflet-services/MapLayerService';

/**
 * The concrete Map Adapter implementation (Leaflet).
 * Composes services into a single interface for tools.
 */
export class LeafletAdapter implements IMapAdapter {
    public readonly store: MapStateStore;
    public readonly events: MapEventBus;
    public readonly core: IMapCore;
    public readonly toolService: IToolService;
    public readonly mapFactory: IMapFactory;
    public layerService?: ILayerService;

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
