// src/map/maplibre-adapter.ts

import { IMapCore, IToolService } from './IMapInterfaces';
import { MapStateStore } from '../store/map-state-store';
import { IMapAdapter } from './IMapAdapter';
import { MapCoreService } from './maplibre-services/MapCoreService';
import { MapServiceTemplate } from './maplibre-services/MapServiceTemplate';
import { MapZoomController } from './maplibre-services/MapZoomController';
import { MapInsetController } from './maplibre-services/MapInsetController';

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
    public zoomController: MapZoomController;
    public inset: MapInsetController;
    public readonly store: MapStateStore;

    constructor() {
        this.store = new MapStateStore();
        this.core = new MapCoreService(this.store);
        this.toolService = new MapServiceTemplate(this.mapInstance);
        this.zoomController = new MapZoomController(this.store);
        // Bind core to the zoom controller for map-agnostic wiring
        this.zoomController.setCore(this.core);
        this.inset = new MapInsetController(this.store);
    }
}