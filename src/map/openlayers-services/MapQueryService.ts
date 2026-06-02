// src/map/openlayers-services/MapQueryService.ts

import OLMap from 'ol/Map';
import { toLonLat } from 'ol/proj';
import type { IQueryService, QueryLocation, QueryOptions, FeatureInfo } from '../IQueryService';
import type { ILayerService } from '../IMapInterfaces';
import { fetchWMSFeatureInfo } from '../wms-feature-info';

export class MapQueryService implements IQueryService {
    constructor(
        private readonly map: OLMap,
        private readonly layerService: ILayerService,
    ) {}

    async queryFeatures(location: QueryLocation, options: QueryOptions = {}): Promise<FeatureInfo[]> {
        const { pixel } = location;
        const tolerancePx = options.tolerancePx ?? 5;
        const results: FeatureInfo[] = [];

        const nativeToLogical = this.layerService.getNativeToLogicalLayerMap();
        const logicalFilter = options.layerIds?.length ? new Set(options.layerIds) : null;

        // --- Vector query via getFeaturesAtPixel ---
        this.map.forEachFeatureAtPixel(
            pixel,
            (feature, layer) => {
                const nativeLayerId = (layer as any)?.__layerId as string | undefined;
                const logicalId = nativeLayerId ? nativeToLogical.get(nativeLayerId) : undefined;
                if (!logicalId) return;
                if (logicalFilter && !logicalFilter.has(logicalId)) return;

                const props = feature.getProperties() as Record<string, unknown>;
                delete props['geometry'];
                results.push({
                    layerId: logicalId,
                    properties: props,
                    source: 'vector',
                });
            },
            {
                hitTolerance: tolerancePx,
            }
        );

        // --- WMS GetFeatureInfo ---
        if (options.includeWMS) {
            const view = this.map.getView();
            const mapSize = this.map.getSize() ?? [0, 0];
            const extent = view.calculateExtent(mapSize);
            // extent in map projection (EPSG:3857 or similar) → convert corners to WGS84
            const sw = toLonLat([extent[0], extent[1]]);
            const ne = toLonLat([extent[2], extent[3]]);
            const bounds = { west: sw[0], south: sw[1], east: ne[0], north: ne[1] };

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
                            containerWidth: mapSize[0],
                            containerHeight: mapSize[1],
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
