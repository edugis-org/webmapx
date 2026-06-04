// src/map/openlayers-services/MapQueryService.ts

import OLMap from 'ol/Map';
import { toLonLat } from 'ol/proj';
import type { IQueryService, QueryLocation, QueryOptions, FeatureInfo } from '../IQueryService';
import type { ILayerService } from '../IMapInterfaces';
import type { MapStateStore } from '../../store/map-state-store';
import { fetchWMSFeatureInfo } from '../wms-feature-info';

export class MapQueryService implements IQueryService {
    constructor(
        private readonly map: OLMap,
        private readonly layerService: ILayerService,
        private readonly store: MapStateStore,
    ) {}

    async queryFeatures(location: QueryLocation, options: QueryOptions = {}): Promise<FeatureInfo[]> {
        const { pixel } = location;
        const tolerancePx = options.tolerancePx ?? 5;
        const results: FeatureInfo[] = [];

        const logicalFilter = options.layerIds?.length ? new Set(options.layerIds) : null;
        const mapLayers = this.store.getState().mapLayers ?? {};

        // --- Vector query via getFeaturesAtPixel ---
        this.map.forEachFeatureAtPixel(
            pixel,
            (feature, layer) => {
                const nativeLayerId = (layer as any)?.__layerId as string | undefined;
                const logicalId = this.resolveRegisteredLayerId(layer as unknown as Record<string, unknown>, nativeLayerId, mapLayers);
                if (!logicalId) return;
                if (logicalFilter && !logicalFilter.has(logicalId)) return;
                const layerTitle = this.resolveLayerTitle(logicalId, mapLayers);

                const props = feature.getProperties() as Record<string, unknown>;
                delete props['geometry'];

                // For composite style layers, find the topmost visible sub-layer for this feature
                let subLayerId: string | undefined;
                let subLayerType: string | undefined;
                let subLayerIndex = -1;
                const mvtSourceLayer = (feature as any).get?.('layer') as string | undefined;
                if (mvtSourceLayer) {
                    const meta = mapLayers[logicalId] as Record<string, unknown> | undefined;
                    const sublayers = Array.isArray(meta?.sublayers) ? meta!.sublayers as any[] : [];
                    const zoom = this.store.getState().zoomLevel ?? 0;

                    // Map OL geometry type to expected MapLibre sub-layer types
                    const geomType = (feature as any).getGeometry?.()?.getType?.() as string | undefined;
                    const preferredTypes = geomType?.includes('Polygon') ? new Set(['fill', 'fill-extrusion'])
                        : geomType?.includes('LineString') ? new Set(['line'])
                        : geomType?.includes('Point') ? new Set(['circle', 'symbol'])
                        : null;

                    // Two passes: first prefer type-matched sub-layers, then fall back to any match
                    const passes = preferredTypes ? [true, false] : [false];
                    outer:
                    for (const strictType of passes) {
                        for (let i = sublayers.length - 1; i >= 0; i--) {
                            const s = sublayers[i] as any;
                            if (s?.['source-layer'] !== mvtSourceLayer && s?.sourceLayer !== mvtSourceLayer) continue;
                            if (strictType && preferredTypes && !preferredTypes.has(s?.type)) continue;
                            if (s?.layout?.['visibility'] === 'none') continue;
                            const minz = typeof s?.minzoom === 'number' ? s.minzoom : 0;
                            const maxz = typeof s?.maxzoom === 'number' ? s.maxzoom + 1 : 24;
                            if (zoom < minz || zoom >= maxz) continue;
                            if (s?.filter && !this.matchesFilter(s.filter, props)) continue;
                            subLayerId = String(s.id ?? '').replace(/^style:/, '');
                            subLayerType = s.type;
                            subLayerIndex = i;
                            break outer;
                        }
                    }
                }

                results.push({
                    layerId: logicalId,
                    ...(layerTitle ? { layerTitle } : {}),
                    properties: props,
                    source: 'vector',
                    ...(subLayerId ? { subLayerId, subLayerType } : {}),
                    _subLayerIndex: subLayerIndex,
                } as any);
            },
            {
                hitTolerance: tolerancePx,
            }
        );

        // For composite layers: sort by sub-layer index descending (topmost first),
        // then deduplicate keeping only the top visible feature per (layerId + subLayerId)
        results.sort((a, b) => ((b as any)._subLayerIndex ?? -1) - ((a as any)._subLayerIndex ?? -1));
        const seen = new Set<string>();
        const deduped: FeatureInfo[] = [];
        for (const r of results) {
            const key = `${r.layerId}|${r.subLayerId ?? ''}`;
            if (!seen.has(key)) { seen.add(key); deduped.push(r); }
        }
        results.length = 0;
        results.push(...deduped.map(r => { const c = { ...r }; delete (c as any)._subLayerIndex; return c; }));

        // --- end vector query ---

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

    /** Evaluate a MapLibre filter expression against feature properties. */
    private matchesFilter(filter: unknown, props: Record<string, unknown>): boolean {
        if (!Array.isArray(filter) || filter.length === 0) return true;
        const op = filter[0];
        if (op === 'all') return (filter.slice(1) as unknown[]).every(f => this.matchesFilter(f, props));
        if (op === 'any') return (filter.slice(1) as unknown[]).some(f => this.matchesFilter(f, props));
        if (op === 'none') return !(filter.slice(1) as unknown[]).some(f => this.matchesFilter(f, props));

        const resolve = (v: unknown): unknown => {
            if (Array.isArray(v) && v[0] === 'get') return props[v[1] as string];
            if (Array.isArray(v) && v[0] === 'geometry-type') return undefined; // ignore geometry checks
            if (Array.isArray(v) && v[0] === 'zoom') return undefined; // zoom handled elsewhere
            return v;
        };

        const lhs = resolve(filter[1]);
        const rhs = resolve(filter[2]);

        if (op === '==' || op === '===') return lhs === rhs;
        if (op === '!=' || op === '!==') return lhs !== rhs;
        if (op === '<')  return Number(lhs) < Number(rhs);
        if (op === '<=') return Number(lhs) <= Number(rhs);
        if (op === '>')  return Number(lhs) > Number(rhs);
        if (op === '>=') return Number(lhs) >= Number(rhs);

        if (op === 'match') {
            // ["match", ["get", "prop"], v1, result1, v2, result2, ..., default]
            const input = resolve(filter[1]);
            for (let i = 2; i + 1 < filter.length; i += 2) {
                const matchVal = filter[i];
                if (Array.isArray(matchVal) ? matchVal.includes(input) : matchVal === input) {
                    return Boolean(filter[i + 1]);
                }
            }
            return Boolean(filter[filter.length - 1]);
        }

        if (op === 'in') {
            const input = resolve(filter[1]);
            return (filter.slice(2) as unknown[]).includes(input);
        }

        if (op === 'has') return props[filter[1] as string] !== undefined;
        if (op === '!has') return props[filter[1] as string] === undefined;

        return true; // unknown op — assume match
    }

    private resolveRegisteredLayerId(nativeLayer: Record<string, unknown>, nativeLayerId: string | undefined, mapLayers: Record<string, unknown>): string | null {
        const mapLayerId = typeof nativeLayer.__mapLayerId === 'string'
            ? nativeLayer.__mapLayerId
            : nativeLayerId ?? null;
        return mapLayerId && mapLayers[mapLayerId] ? mapLayerId : null;
    }

    private resolveLayerTitle(layerId: string, mapLayers: Record<string, unknown>): string | null {
        const metadata = mapLayers[layerId] as Record<string, unknown> | undefined;
        return typeof metadata?.label === 'string' && metadata.label.length > 0 ? metadata.label : null;
    }
}
