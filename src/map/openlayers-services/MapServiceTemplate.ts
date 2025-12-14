// src/map/openlayers-services/MapServiceTemplate.ts

import { IToolService } from '../IMapInterfaces';

/**
 * Template service implementation for tool components.
 * Thin wrapper - translates generic calls to OpenLayers specific API calls.
 * No throttling here - consumers (tools) handle their own rate-limiting.
 */
export class MapServiceTemplate implements IToolService {
    constructor() {}

    public setBufferRadius(radiusKm: number): void {
        console.log(`[OL SERVICE] Set buffer radius to ${radiusKm}km.`);
        // Placeholder for actual OpenLayers implementation
    }

    public toggleTool(): void {
        console.log('[OL SERVICE] Toggled tool activation.');
    }
}
