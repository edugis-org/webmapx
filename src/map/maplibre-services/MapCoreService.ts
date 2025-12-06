// src/map/maplibre-services/MapCoreService.ts

import { IMapCore } from '../IMapInterfaces'; 
import { store } from '../../store/central-state';

// 💡 FIX: Use wildcard import (* as) instead of default import (import maplibregl)
import * as maplibregl from 'maplibre-gl'; 
import 'maplibre-gl/dist/maplibre-gl.css'; 

/**
 * Implements the core map contract (IMapCore) for the MapLibre engine.
 */
export class MapCoreService implements IMapCore {
    
    // The Map type is now accessed as maplibregl.Map
    private mapInstance: maplibregl.Map | null = null; 

    // Basic configuration needed for a standard map
    private readonly initialConfig = {
        center: [10.45, 51.17] as [number, number], // Initial coordinates (e.g., Central Europe)
        zoom: 4, 
        pitch: 0,
        bearing: 0,
        style: { // Minimal style definition (empty, or a standard basemap)
            version: 8 as const,
            sources: {},
            layers: [] as maplibregl.LayerSpecification[], // AT LEAST AN EMPTY LAYER SET
        }
    };

    // The explicit return type of the tuple [number, number] is retained here
    public getViewportState(): { center: [number, number], zoom: number, bearing: number } { 
        // Return real map values if initialized, otherwise fall back to defaults
        if (this.mapInstance) {
            return { 
                center: this.mapInstance.getCenter().toArray() as [number, number], 
                zoom: this.mapInstance.getZoom(), 
                bearing: this.mapInstance.getBearing()
            };
        }
        return { center: [0, 0], zoom: 1, bearing: 0 }; 
    }
    
    public setViewport(center: [number, number], zoom: number): void {
        if (this.mapInstance) {
            this.mapInstance.flyTo({ center, zoom });
            console.log(`[CORE SERVICE] Setting viewport to center: ${center}, zoom: ${zoom}`);
        }
    }

    public initialize(containerId: string): void {
        console.log(`[CORE SERVICE] Initializing MapLibre instance in #${containerId}`);
        
        // MAP INSTANTIATION AND STORAGE
        this.mapInstance = new maplibregl.Map({ // Instantiate using maplibregl.Map
            container: containerId, // The ID of the HTML element
            center: this.initialConfig.center,
            zoom: this.initialConfig.zoom,
            pitch: this.initialConfig.pitch,
            bearing: this.initialConfig.bearing            
        });

        this.mapInstance.setStyle(this.initialConfig.style);

        // EVENT HANDLING FOR MAP.ON('LOAD')
        this.mapInstance.on('load', () => {
            console.log(`[CORE SERVICE] MapLibre map is fully loaded.`);
            
            // SIGNAL READINESS AND INITIAL ZOOM to the Central State Store
            store.dispatch({ mapLoaded: true, zoomLevel: this.initialConfig.zoom }, 'MAP');
        });
        
        // EVENT HANDLING for the Zoom Display component
        this.mapInstance.on('zoomend', () => {
             const currentZoom = this.mapInstance!.getZoom();
             // Push the map's current zoom to the store, ensuring UI updates
             store.dispatch({ zoomLevel: currentZoom }, 'MAP');
        });
    }
}