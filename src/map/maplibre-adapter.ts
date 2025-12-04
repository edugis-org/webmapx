// src/map/maplibre-adapter.ts

import { IMapCore, IGeoprocessingTool } from './IMapInterfaces'; 
// FIX: Import the service classes from their new dedicated files
import { MapCoreService } from './maplibre-services/MapCoreService';
import { GeoprocessingAdapterService } from './maplibre-services/GeoprocessingAdapterService';

/**
 * The concrete Map Adapter implementation (MapLibre).
 * It composes various adapter services into a single interface for the UI.
 */
class MapLibreAdapter {
    // Placeholder for the actual MapLibre object
    private mapInstance: any = {}; 

    // The composed services adhering to the contracts
    public core: IMapCore;
    public geoprocessingTool: IGeoprocessingTool;

    constructor() {
        // Now assigned correctly via import, resolving the "Cannot find name" error
        this.core = new MapCoreService();
        this.geoprocessingTool = new GeoprocessingAdapterService(this.mapInstance);
    }
}

// Export the singleton instance
export const mapAdapter = new MapLibreAdapter();