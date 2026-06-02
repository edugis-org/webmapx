// src/map/cesium-services/MapQueryService.ts
// Cesium entity picking via scene.pick (single) and scene.drillPick (all).

import type { IQueryService, QueryLocation, QueryOptions, FeatureInfo } from '../IQueryService';
import type { MapLayerService } from './MapLayerService';
import { fetchWMSFeatureInfo } from '../wms-feature-info';

function getCesium(): any {
    return (globalThis as any).Cesium;
}

export class MapQueryService implements IQueryService {
    constructor(
        private readonly viewer: any,
        private readonly layerService: MapLayerService,
    ) {}

    async queryFeatures(location: QueryLocation, options: QueryOptions = {}): Promise<FeatureInfo[]> {
        const { pixel } = location;
        const Cesium = getCesium();
        if (!Cesium || !this.viewer?.scene) return [];

        const results: FeatureInfo[] = [];
        const logicalFilter = options.layerIds?.length ? new Set(options.layerIds) : null;

        // --- Entity picking ---
        const scene = this.viewer.scene;
        const cesiumPixel = new Cesium.Cartesian2(pixel[0], pixel[1]);

        // drillPick returns all entities at the pixel, not just the topmost.
        const picks: any[] = scene.drillPick(cesiumPixel) ?? [];

        for (const pick of picks) {
            const entity = pick?.id;
            if (!entity) continue;

            const logicalId = this.layerService.getLogicalLayerForEntity(entity);
            if (!logicalId) continue;
            if (logicalFilter && !logicalFilter.has(logicalId)) continue;

            const properties = this.layerService.getEntityProperties(entity);
            results.push({
                layerId: logicalId,
                properties,
                source: 'vector',
            });
        }

        // --- WMS GetFeatureInfo ---
        if (options.includeWMS) {
            const canvas = scene.canvas as HTMLCanvasElement;
            const containerWidth = canvas.clientWidth;
            const containerHeight = canvas.clientHeight;

            // Get current map bounds from camera
            const bounds = this.getCameraBounds(Cesium);
            if (bounds) {
                const wmsLayers = this.layerService.getVisibleWMSLayers();
                const wmsResults = await Promise.all(
                    wmsLayers
                        .filter((l) => !logicalFilter || logicalFilter.has(l.layerId))
                        .map((l) =>
                            fetchWMSFeatureInfo({
                                sourceConfig: l.sourceConfig,
                                layerId: l.layerId,
                                layerTitle: l.layerTitle,
                                bounds,
                                containerWidth,
                                containerHeight,
                                pixelX: pixel[0],
                                pixelY: pixel[1],
                            })
                        )
                );
                for (const feats of wmsResults) results.push(...feats);
            }
        }

        return results;
    }

    private getCameraBounds(Cesium: any): { west: number; south: number; east: number; north: number } | null {
        try {
            const rect = this.viewer.camera.computeViewRectangle(this.viewer.scene.globe.ellipsoid);
            if (!rect) return null;
            return {
                west: Cesium.Math.toDegrees(rect.west),
                south: Cesium.Math.toDegrees(rect.south),
                east: Cesium.Math.toDegrees(rect.east),
                north: Cesium.Math.toDegrees(rect.north),
            };
        } catch {
            return null;
        }
    }
}
