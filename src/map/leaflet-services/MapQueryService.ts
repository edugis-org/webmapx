// src/map/leaflet-services/MapQueryService.ts

import * as L from 'leaflet';
import type { IQueryService, QueryLocation, QueryOptions, FeatureInfo } from '../IQueryService';
import type { MapLayerService } from './MapLayerService';
import { fetchWMSFeatureInfo } from '../wms-feature-info';

export class MapQueryService implements IQueryService {
    constructor(
        private readonly map: L.Map,
        private readonly layerService: MapLayerService,
    ) {}

    async queryFeatures(location: QueryLocation, options: QueryOptions = {}): Promise<FeatureInfo[]> {
        const { pixel } = location;
        const tolerancePx = options.tolerancePx ?? 5;
        const results: FeatureInfo[] = [];
        const logicalFilter = options.layerIds?.length ? new Set(options.layerIds) : null;

        // --- Vector query ---
        const vectorHits = this.layerService.queryVectorFeaturesAtPixel(
            this.map,
            pixel,
            tolerancePx,
            logicalFilter ?? undefined
        );
        for (const hit of vectorHits) {
            results.push({ layerId: hit.layerId, properties: hit.properties, source: 'vector' });
        }

        // --- WMS GetFeatureInfo ---
        if (options.includeWMS) {
            const bounds = this.map.getBounds();
            const containerSize = this.map.getSize();
            const mapBounds = {
                west: bounds.getWest(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                north: bounds.getNorth(),
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
                            bounds: mapBounds,
                            containerWidth: containerSize.x,
                            containerHeight: containerSize.y,
                            pixelX: pixel[0],
                            pixelY: pixel[1],
                        })
                    )
            );
            for (const feats of wmsResults) results.push(...feats);
        }

        return results;
    }
}
