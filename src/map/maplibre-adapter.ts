// src/map/maplibre-adapter.ts

import { IMapCore, IToolService, IMapFactory } from './IMapInterfaces';
import { MapStateStore } from '../store/map-state-store';
import { MapEventBus } from '../store/map-events';
import { IMapAdapter } from './IMapAdapter';
import { MapCoreService } from './maplibre-services/MapCoreService';
import { MapServiceTemplate } from './maplibre-services/MapServiceTemplate';
import { MapPointerController } from './maplibre-services/MapPointerController';
import { MapFactoryService } from './maplibre-services/MapFactoryService';

/**
 * The concrete Map Adapter implementation (MapLibre).
 * It composes various adapter services into a single interface for the UI.
 */
export class MapLibreAdapter implements IMapAdapter {
    // Placeholder for the actual MapLibre object
    private mapInstance: any = {};

    // The composed services adhering to the contracts
    public core: IMapCore;
    public toolService: IToolService;
    public mapFactory: IMapFactory;
    public pointerController: MapPointerController;
    public readonly store: MapStateStore;

    /**
     * Event bus for normalized map events.
     * Tools subscribe here to receive library-agnostic events (pointer-move, click, etc.)
     */
    public readonly events: MapEventBus;

    constructor() {
        this.store = new MapStateStore();
        this.events = new MapEventBus();
        this.core = new MapCoreService(this.store, this.events);
        this.toolService = new MapServiceTemplate(this.mapInstance);
        this.mapFactory = new MapFactoryService();
        this.pointerController = new MapPointerController(this.store, this.events);

        if (this.core instanceof MapCoreService) {
            this.core.onMapReady((mapInstance) => {
                this.pointerController.attach(mapInstance);
            });
        }
    }
}