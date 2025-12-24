// src/map/cesium-services/MapServiceTemplate.ts

import { IToolService } from '../IMapInterfaces';

export class MapServiceTemplate implements IToolService {
    toggleTool(): void {
        // no-op
    }

    setBufferRadius(_radiusKm: number): void {
        // no-op
    }
}

