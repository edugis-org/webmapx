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

    public initialize(containerId: string, options?: { center?: [number, number]; zoom?: number; styleUrl?: string }): void {
        console.log(`[CORE SERVICE] Initializing MapLibre instance in #${containerId}`);
        
        const center = options?.center ?? this.initialConfig.center;
        const zoom = options?.zoom ?? this.initialConfig.zoom;
        const styleUrl = options?.styleUrl;
        const containerTarget = this.resolveContainer(containerId);

        // MAP INSTANTIATION AND STORAGE
        this.mapInstance = new maplibregl.Map({ // Instantiate using maplibregl.Map
            container: containerTarget,
            center,
            zoom,
            pitch: this.initialConfig.pitch,
            bearing: this.initialConfig.bearing            
        });

        if (styleUrl) {
            this.mapInstance.setStyle(styleUrl);
        } else {
            // Fallback minimal style
            this.mapInstance.setStyle(this.initialConfig.style);
        }

        // EVENT HANDLING FOR MAP.ON('LOAD')
        this.mapInstance.on('load', () => {
            console.log(`[CORE SERVICE] MapLibre map is fully loaded.`);
            
            // SIGNAL READINESS AND INITIAL ZOOM to the Central State Store
            store.dispatch({ mapLoaded: true, zoomLevel: zoom }, 'MAP');
        });
        
        // Default internal subscription updates central store
        this.mapInstance.on('zoomend', () => {
             const currentZoom = this.mapInstance!.getZoom();
             store.dispatch({ zoomLevel: currentZoom }, 'MAP');
        });
    }

    // Library-agnostic zoom controls
    public setZoom(level: number): void {
        if (this.mapInstance) {
            this.mapInstance.setZoom(level);
        }
    }

    public onZoomEnd(callback: (level: number) => void): void {
        if (this.mapInstance) {
            this.mapInstance.on('zoomend', () => {
                callback(this.mapInstance!.getZoom());
            });
        }
    }

    public getZoom(): number {
        return this.mapInstance ? this.mapInstance.getZoom() : this.initialConfig.zoom;
    }

    private resolveContainer(containerId: string): string | HTMLElement {
        const hostElement = document.getElementById(containerId);

        if (!hostElement) {
            console.warn(`[CORE SERVICE] Container #${containerId} not found. Falling back to ID.`);
            return containerId;
        }

        if (hostElement.tagName.toLowerCase() === 'gis-map') {
            const mapSlot = hostElement.querySelector<HTMLElement>('[slot="map-view"]');

            if (mapSlot) {
                return mapSlot;
            }

            console.warn('[CORE SERVICE] <gis-map> is missing a [slot="map-view"] element. Using host as fallback.');
        }

        return hostElement;
    }
}