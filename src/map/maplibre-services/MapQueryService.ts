// src/map/maplibre-services/MapQueryService.ts

import * as maplibregl from 'maplibre-gl';
import type { IQueryService, QueryLocation, QueryOptions, FeatureInfo } from '../IQueryService';
import type { ILayerService } from '../IMapInterfaces';
import type { MapStateStore } from '../../store/map-state-store';
import { fetchWMSFeatureInfo } from '../wms-feature-info';

export class MapQueryService implements IQueryService {
    constructor(
        private readonly map: maplibregl.Map,
        private readonly layerService: ILayerService,
        private readonly store: MapStateStore,
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

        const logicalFilter = options.layerIds?.length ? new Set(options.layerIds) : null;
        const mapLayers = this.store.getState().mapLayers ?? {};

        const nativeFeatures = this.map.queryRenderedFeatures(bbox);
        for (const f of nativeFeatures) {
            const logicalId = this.resolveRegisteredLayerId(f.layer as Record<string, unknown>, mapLayers);
            if (!logicalId) continue;
            if (logicalFilter && !logicalFilter.has(logicalId)) continue;
            const layerTitle = this.resolveLayerTitle(logicalId, mapLayers);
            // Extract sub-layer id/type for composite style layers
            // Native ID format: "${logicalId}-style:${subLayerId}" e.g. "openfreemap-liberty-style:label_country_3"
            const nativeLayerId = typeof (f.layer as any)?.id === 'string' ? (f.layer as any).id as string : '';
            const subLayerPrefix = `${logicalId}-style:`;
            const subLayerId = nativeLayerId.startsWith(subLayerPrefix)
                ? nativeLayerId.slice(subLayerPrefix.length)
                : undefined;
            const subLayerType = typeof (f.layer as any)?.type === 'string' ? (f.layer as any).type as string : undefined;
            results.push({
                layerId: logicalId,
                ...(layerTitle ? { layerTitle } : {}),
                properties: f.properties as Record<string, unknown>,
                geometry: f.geometry as GeoJSON.Geometry,
                source: 'vector',
                ...(subLayerId ? { subLayerId } : {}),
                ...(subLayerType ? { subLayerType } : {}),
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

    private resolveRegisteredLayerId(nativeLayer: Record<string, unknown>, mapLayers: Record<string, unknown>): string | null {
        const metadata = nativeLayer.metadata && typeof nativeLayer.metadata === 'object'
            ? nativeLayer.metadata as Record<string, unknown>
            : {};
        const mapLayerId = typeof metadata.mapLayerId === 'string'
            ? metadata.mapLayerId
            : typeof nativeLayer.id === 'string'
                ? nativeLayer.id
                : null;
        return mapLayerId && mapLayers[mapLayerId] ? mapLayerId : null;
    }

    private resolveLayerTitle(layerId: string, mapLayers: Record<string, unknown>): string | null {
        const metadata = mapLayers[layerId] as Record<string, unknown> | undefined;
        return typeof metadata?.label === 'string' && metadata.label.length > 0 ? metadata.label : null;
    }
}
