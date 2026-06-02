// src/map/cesium-services/MapMarkerService.ts
// Cesium markers use Point entities (colored billboard).
// Draggable markers not yet supported in Cesium.

import type { LngLat } from '../../store/map-events';
import type { MarkerOptions } from '../IMapInterfaces';
import { pinDataUrl } from '../marker-utils';

function getCesium(): any {
    return (globalThis as any).Cesium;
}

export class MapMarkerService {
    private entities = new Map<string, any>();

    constructor(private readonly viewer: any) {}

    add(id: string, lngLat: LngLat, options: MarkerOptions = {}): void {
        this.remove(id);
        const Cesium = getCesium();
        if (!Cesium || !this.viewer) return;

        const color = options.color ?? '#e63946';
        const entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lngLat[0], lngLat[1]),
            billboard: {
                image: pinDataUrl(color),
                width: 24,
                height: 36,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
        });
        this.entities.set(id, entity);
    }

    move(id: string, lngLat: LngLat): void {
        const Cesium = getCesium();
        const entity = this.entities.get(id);
        if (entity && Cesium) {
            entity.position = Cesium.Cartesian3.fromDegrees(lngLat[0], lngLat[1]);
        }
    }

    remove(id: string): void {
        const entity = this.entities.get(id);
        if (entity) {
            this.viewer?.entities.remove(entity);
            this.entities.delete(id);
        }
    }
}
