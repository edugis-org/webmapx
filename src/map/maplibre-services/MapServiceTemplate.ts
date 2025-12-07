// src/map/maplibre-services/MapServiceTemplate.ts

import { IToolService } from '../IMapInterfaces';
import { throttle } from '../../utils/throttle';

/**
 * Template service implementation for tool components.
 * Copy and adapt this file when creating new tool services.
 * Translates generic calls to MapLibre specific API calls.
 */
export class MapServiceTemplate implements IToolService {
    private mapLibreInstance: any = {};

    // The throttled function reference
    private throttledSetBuffer: (radiusKm: number) => void;

    constructor(mapInstance: any) {
        this.mapLibreInstance = mapInstance;

        // Use a private helper to define the raw function
        const rawSetBuffer = (radiusKm: number) => {
             console.log(`[SERVICE TEMPLATE] Throttled update: Set buffer radius to ${radiusKm}km on MapLibre.`);
             // Placeholder for the actual MapLibre API call:
             // this.mapLibreInstance.updateGeoBuffer(radiusKm);
        };

        // APPLY THROTTLING: Wrap the raw function to rate-limit calls to 150ms
        this.throttledSetBuffer = throttle(rawSetBuffer.bind(this), 150);
    }

    public setBufferRadius(radiusKm: number): void {
        // Call the throttled version of the function
        this.throttledSetBuffer(radiusKm);
    }

    public toggleTool(): void {
        console.log('[SERVICE TEMPLATE] Toggled buffer tool activation.');
    }
}
