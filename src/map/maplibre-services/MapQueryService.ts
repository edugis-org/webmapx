// src/map/maplibre-services/MapQueryService.ts

import * as maplibregl from 'maplibre-gl';
import type { IQueryService, QueryLocation, QueryOptions, FeatureInfo } from '../IQueryService';
import type { ILayerService } from '../IMapInterfaces';
import { fetchWMSFeatureInfo } from '../wms-feature-info';

export class MapQueryService implements IQueryService {
    constructor(
        private readonly map: maplibregl.Map,
        private readonly layerService: ILayerService,
    ) {}

    async queryFeatures(location: QueryLocation, options: QueryOptions = {}): Promise<FeatureInfo[]> {
        const { pixel, lngLat } = location;
        const tolerancePx = options.tolerancePx ?? 5;
        const results: FeatureInfo[] = [];

        // --- Vector query via queryRenderedFeatures ---
        const bbox: [maplibregl.PointLike, maplibregl.PointLike] = [
            [pixel[0] - tolerancePx, pixel[1] - tolerancePx],
            [pixel[0] + tolerancePx, pixel[1] + tolerancePx],
        ];

        const nativeToLogical = this.layerService.getNativeToLogicalLayerMap();
        const logicalFilter = options.layerIds?.length ? new Set(options.layerIds) : null;

        const nativeFeatures = this.map.queryRenderedFeatures(bbox);
        for (const f of nativeFeatures) {
            const logicalId = nativeToLogical.get(f.layer.id);
            if (!logicalId) continue;
            if (logicalFilter && !logicalFilter.has(logicalId)) continue;
            results.push({
                layerId: logicalId,
                properties: f.properties as Record<string, unknown>,
                geometry: f.geometry as GeoJSON.Geometry,
                source: 'vector',
            });
        }

        // --- WMS GetFeatureInfo ---
        if (options.includeWMS) {
            const container = this.map.getContainer();
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const mapBounds = this.map.getBounds();
            const bounds = {
                west: mapBounds.getWest(),
                south: mapBounds.getSouth(),
                east: mapBounds.getEast(),
                north: mapBounds.getNorth(),
            };

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

        // suppress unused variable warning
        void lngLat;

        return results;
    }
}
