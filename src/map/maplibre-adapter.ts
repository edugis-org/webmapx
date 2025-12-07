// src/map/maplibre-adapter.ts

import { IMapCore, IToolService } from './IMapInterfaces';
// FIX: Import the service classes from their new dedicated files
import { MapCoreService } from './maplibre-services/MapCoreService';
import { MapServiceTemplate } from './maplibre-services/MapServiceTemplate';
import { mapZoomController } from './maplibre-services/MapZoomController';
import { mapInsetController } from './maplibre-services/MapInsetController';

/**
 * The concrete Map Adapter implementation (MapLibre).
 * It composes various adapter services into a single interface for the UI.
 */
class MapLibreAdapter {
    // Placeholder for the actual MapLibre object
    private mapInstance: any = {}; 

    // The composed services adhering to the contracts
    public core: IMapCore;
    public toolService: IToolService;
    public zoomController: any;
    public inset = mapInsetController;

    constructor() {
        // Now assigned correctly via import, resolving the "Cannot find name" error
        this.core = new MapCoreService();
        this.toolService = new MapServiceTemplate(this.mapInstance);
        this.zoomController = mapZoomController;
        // Bind core to the zoom controller for map-agnostic wiring
        this.zoomController.setCore(this.core);
    }
}

// Export the singleton instance
export const mapAdapter = new MapLibreAdapter();