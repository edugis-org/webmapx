// src/map/cesium-services/MapMarkerService.ts
// Cesium markers use Point entities (colored billboard).

import type { LngLat } from '../../store/map-events';
import type { MarkerOptions } from '../IMapInterfaces';
import { pinDataUrl } from '../marker-utils';

function getCesium(): any {
    return (globalThis as any).Cesium;
}

interface MarkerEntry {
    entity: any;
    dragCleanup?: () => void;
}

export class MapMarkerService {
    private markers = new Map<string, MarkerEntry>();

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

        const entry: MarkerEntry = { entity };

        if (options.draggable) {
            entry.dragCleanup = this.attachDrag(entity, options);
        }

        this.markers.set(id, entry);
    }

    move(id: string, lngLat: LngLat): void {
        const Cesium = getCesium();
        const entry = this.markers.get(id);
        if (entry && Cesium) {
            entry.entity.position = Cesium.Cartesian3.fromDegrees(lngLat[0], lngLat[1]);
        }
    }

    remove(id: string): void {
        const entry = this.markers.get(id);
        if (entry) {
            entry.dragCleanup?.();
            this.viewer?.entities.remove(entry.entity);
            this.markers.delete(id);
        }
    }

    private attachDrag(entity: any, options: MarkerOptions): () => void {
        const Cesium = getCesium();
        if (!Cesium || !this.viewer) return () => {};

        const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
        let dragging = false;

        handler.setInputAction((e: any) => {
            const picked = this.viewer.scene.pick(e.position);
            if (Cesium.defined(picked) && picked.id === entity) {
                dragging = true;
                this.viewer.scene.screenSpaceCameraController.enableRotate = false;
                this.viewer.scene.screenSpaceCameraController.enableTranslate = false;
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        handler.setInputAction((e: any) => {
            if (!dragging) return;
            const ray = this.viewer.camera.getPickRay(e.endPosition);
            if (!ray) return;
            const pos = this.viewer.scene.globe.pick(ray, this.viewer.scene);
            if (Cesium.defined(pos)) {
                const carto = Cesium.Cartographic.fromCartesian(pos);
                const lng = Cesium.Math.toDegrees(carto.longitude);
                const lat = Cesium.Math.toDegrees(carto.latitude);
                entity.position = Cesium.Cartesian3.fromDegrees(lng, lat);
                options.onDrag?.([lng, lat]);
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction(() => {
            if (!dragging) return;
            dragging = false;
            this.viewer.scene.screenSpaceCameraController.enableRotate = true;
            this.viewer.scene.screenSpaceCameraController.enableTranslate = true;
            if (options.onDragEnd) {
                const pos = entity.position?.getValue(Cesium.JulianDate.now());
                if (pos) {
                    const carto = Cesium.Cartographic.fromCartesian(pos);
                    options.onDragEnd([
                        Cesium.Math.toDegrees(carto.longitude),
                        Cesium.Math.toDegrees(carto.latitude),
                    ]);
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        return () => { handler.destroy(); };
    }
}
