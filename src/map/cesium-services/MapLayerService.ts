// src/map/cesium-services/MapLayerService.ts

import type { ILayerService, LayerInsertOptions, QueryLayerFeaturesOptions } from '../IMapInterfaces';
import { normalizeRawSource } from '../layer-source-utils';
import { normalizeCompositeLayer, findNormalizedSource, type NormalizedCompositeSpec } from '../composite-layer-utils';
import type { AnyLayerConfig, StandardLayerConfig, SourceConfig, WMSSourceConfig, GeoJSONSourceConfig, SubLayerSpec } from '../../config/types';
import type { MapStateStore } from '../../store/map-state-store';
import { throttle } from '../../utils/throttle';
import { evaluateColor, evaluateNumber, matchesFilter } from '../../utils/maplibre-expression-evaluator';
import { countFeatureCollectionVertices } from '../geojson-loader';

// Cesium's GeoJsonDataSource hardcodes arcType = ArcType.RHUMB for every polygon/
// polyline it creates. Rhumb lines spiral without bound near the poles, so any
// edge with a significant longitude span at high latitude (e.g. Antarctica) makes
// Cesium's rhumb-line subdivision try to generate an unbounded number of segments,
// crashing with "RangeError: Too many properties to enumerate". Force geodesic
// arcs instead — visually equivalent for short/mid edges, and bounded everywhere.
export function forceGeodesicArcType(dataSource: any, Cesium: any): void {
    const entities = dataSource?.entities?.values ?? [];
    for (const entity of entities) {
        if (entity.polygon) entity.polygon.arcType = Cesium.ArcType.GEODESIC;
        if (entity.polyline) entity.polyline.arcType = Cesium.ArcType.GEODESIC;
    }
}

function getCesium(): any {
    return (globalThis as any).Cesium;
}

const WEB_MERCATOR_EARTH_RADIUS_M = 6378137;
const LOGICAL_TILE_SIZE = 512;

// Above this vertex count, GeoJSON is loaded with clampToGround: false. Clamped
// geometry becomes GroundPrimitives/GroundPolylinePrimitives, whose per-vertex
// terrain tessellation makes large datasets (e.g. "World countries", ~240k
// vertices) freeze the renderer. Non-clamped geometry sits on the ellipsoid
// surface, which is visually equivalent here since the viewer uses
// EllipsoidTerrainProvider (no real terrain).
const MAX_CLAMPED_VERTICES = 20_000;

function clampLatitude(lat: number): number {
    return Math.max(-85.05112878, Math.min(85.05112878, lat));
}

function webMercatorMetersPerPixelAtLat(zoom: number, lat: number): number {
    const phi = (clampLatitude(lat) * Math.PI) / 180;
    const circumference = 2 * Math.PI * WEB_MERCATOR_EARTH_RADIUS_M;
    return (circumference * Math.cos(phi)) / (LOGICAL_TILE_SIZE * Math.pow(2, zoom));
}

function buildCircleOutlineLonLat(lon: number, lat: number, radiusMeters: number, samples = 48): Array<[number, number]> {
    const latRad = (lat * Math.PI) / 180;
    const dLat = (radiusMeters / WEB_MERCATOR_EARTH_RADIUS_M) * (180 / Math.PI);
    const cosLat = Math.max(1e-6, Math.cos(latRad));
    const dLon = dLat / cosLat;
    const positions: Array<[number, number]> = [];

    for (let i = 0; i <= samples; i += 1) {
        const t = (i / samples) * Math.PI * 2;
        const ringLon = lon + dLon * Math.cos(t);
        const ringLat = lat + dLat * Math.sin(t);
        positions.push([ringLon, ringLat]);
    }

    return positions;
}


function setSafeProperty(graphics: any, propName: string, value: any): void {
    if (!graphics) return;
    const Cesium = getCesium();
    const currentProp = graphics[propName];
    if (Cesium && currentProp && typeof currentProp.getValue === 'function') {
        const julian = Cesium.JulianDate?.now?.() || new Cesium.JulianDate();
        const currentVal = currentProp.getValue(julian);
        if (currentVal === value) {
            return;
        }
        if (currentVal && typeof currentVal.equals === 'function' && currentVal.equals(value)) {
            return;
        }
    }
    graphics[propName] = value;
}

/**
 * Assigns a solid color material without replacing the material property instance.
 * Assigning a raw Color wraps it in a NEW ColorMaterialProperty, which fires
 * definitionChanged and makes Cesium drop and re-tessellate the entity's geometry —
 * on every style reapply. Mutating the existing ColorMaterialProperty's constant
 * color is equality-checked (no-op when unchanged) and, when it does change, updates
 * per-instance color attributes in place without a geometry rebuild.
 */
function setColorMaterial(graphics: any, color: any): void {
    const Cesium = getCesium();
    const material = graphics.material;
    if (Cesium && material instanceof Cesium.ColorMaterialProperty && material.color instanceof Cesium.ConstantProperty) {
        const julian = Cesium.JulianDate?.now?.() || new Cesium.JulianDate();
        const currentVal = material.color.getValue(julian);
        if (currentVal === color || (currentVal && typeof currentVal.equals === 'function' && currentVal.equals(color))) {
            return;
        }
        material.color.setValue(color);
        return;
    }
    graphics.material = color;
}

function getMinZoom(source: Partial<{ minzoom?: number; minZoom?: number }>): number | undefined {
    const value = source.minzoom ?? source.minZoom;
    return typeof value === 'number' && isFinite(value) ? value : undefined;
}

function getMaxZoom(source: Partial<{ maxzoom?: number; maxZoom?: number }>): number | undefined {
    const value = source.maxzoom ?? source.maxZoom;
    return typeof value === 'number' && isFinite(value) ? value : undefined;
}

function normalizeLevel(value?: number): number | undefined {
    if (typeof value !== 'number' || !isFinite(value)) return undefined;
    return Math.max(0, Math.floor(value));
}

function parseWmsUrl(url: string): { baseUrl: string; layers: string } {
    try {
        const u = new URL(url, window.location.origin);
        const layers = u.searchParams.get('layers') ?? '';
        u.search = '';
        return { baseUrl: u.toString(), layers };
    } catch {
        const [base, query] = url.split('?', 2);
        const layers = new URLSearchParams(query ?? '').get('layers') ?? '';
        return { baseUrl: base, layers };
    }
}

type CesiumLayerHandle =
    | { kind: 'imagery'; imageryLayer: any; minLevel?: number; maxLevel?: number; userVisible: boolean }
    | { kind: 'geojson'; dataSource: any; sourceId: string; subLayers: SubLayerSpec[]; data: GeoJSON.FeatureCollection; updateToken: number; clampToGround: boolean; opacity: number };

export class MapLayerService implements ILayerService {
    private readonly handles = new Map<string, CesiumLayerHandle>();
    private readonly applyGeoJsonStylesThrottled: () => void;
    private lastZoomLevel: number | null = null;
    private unsubscribeStore: (() => void) | null = null;
    private busyOps = 0;
    private logicalOrder: string[] = [];

    constructor(
        private readonly viewer: any,
        private readonly store: MapStateStore
    ) {
        this.applyGeoJsonStylesThrottled = throttle(() => this.applyAllGeoJsonStyles(), 100);

        this.viewer?.scene?.globe?.tileLoadProgressEvent?.addEventListener?.((pendingTiles: number) => {
            if (pendingTiles > 0) {
                this.store.dispatch({ mapBusy: true }, 'MAP');
            } else if (this.busyOps === 0) {
                this.store.dispatch({ mapBusy: false }, 'MAP');
            }
        });

        this.unsubscribeStore = this.store.subscribe((state) => {
            if (state.zoomLevel == null) return;
            if (this.lastZoomLevel !== null && Math.abs(state.zoomLevel - this.lastZoomLevel) < 0.05) {
                return;
            }
            this.lastZoomLevel = state.zoomLevel;
            this.applyGeoJsonStylesThrottled();
            this.applyImageryVisibility(state.zoomLevel);
        });
    }

    private beginBusyOperation(): void {
        this.busyOps += 1;
        if (this.busyOps === 1) {
            this.store.dispatch({ mapBusy: true }, 'MAP');
        }
    }

    private endBusyOperation(): void {
        if (this.busyOps <= 0) {
            this.busyOps = 0;
            return;
        }

        this.busyOps -= 1;
        if (this.busyOps === 0) {
            this.store.dispatch({ mapBusy: false }, 'MAP');
        }
    }

    private resolveInsertIndex(options?: LayerInsertOptions): number | undefined {
        if (options?.beforeLayerId) {
            const index = this.logicalOrder.indexOf(options.beforeLayerId);
            if (index >= 0) return index;
        }

        if (options?.afterLayerId) {
            const index = this.logicalOrder.indexOf(options.afterLayerId);
            if (index >= 0) return index + 1;
        }

        return undefined;
    }

    private upsertLogicalOrder(layerId: string, options?: LayerInsertOptions): void {
        const insertIndex = this.resolveInsertIndex(options);
        this.logicalOrder = this.logicalOrder.filter((id) => id !== layerId);

        if (typeof insertIndex !== 'number' || !Number.isFinite(insertIndex)) {
            this.logicalOrder.push(layerId);
            return;
        }

        const clamped = Math.max(0, Math.min(insertIndex, this.logicalOrder.length));
        this.logicalOrder.splice(clamped, 0, layerId);
    }

    private reapplyImageryOrder(): void {
        const desiredImageryLayers: any[] = [];
        for (const logicalLayerId of this.logicalOrder) {
            for (const [handleKey, handle] of this.handles.entries()) {
                if (!handleKey.startsWith(`${logicalLayerId}::`)) {
                    continue;
                }
                if (handle.kind === 'imagery') {
                    desiredImageryLayers.push(handle.imageryLayer);
                }
            }
        }

        for (let targetIndex = 0; targetIndex < desiredImageryLayers.length; targetIndex += 1) {
            const layer = desiredImageryLayers[targetIndex];
            const currentIndex = this.viewer.imageryLayers.indexOf(layer);
            if (currentIndex === targetIndex) {
                continue;
            }

            try {
                this.viewer.imageryLayers.remove(layer, false);
            } catch {
                // ignore
            }
            this.viewer.imageryLayers.add(layer, targetIndex);
        }
    }

    private async addImagerySource(layerId: string, sourceId: string, sourceConfig: SourceConfig, options?: LayerInsertOptions): Promise<boolean> {
        const Cesium = getCesium();
        if (!Cesium) return false;
        const handleKey = `${layerId}::${sourceId}`;
        if (this.handles.has(handleKey)) return true;
        if (sourceConfig.type !== 'raster') return false;

        const url = Array.isArray((sourceConfig as any).url) ? (sourceConfig as any).url[0] : (sourceConfig as any).url;

        if (sourceConfig.service === 'xyz') {
            if (url.startsWith('warpedmap://')) {
                console.warn('[CESIUM LAYER SERVICE] warpedmap:// (Allmaps) is not supported in Cesium.');
                return false;
            }
            const minLevel = normalizeLevel(getMinZoom(sourceConfig));
            const maxLevel = normalizeLevel(getMaxZoom(sourceConfig)) ?? 22;
            // `{bbox-epsg-3857}` is a MapLibre/Mapbox raster-source convention; Cesium's
            // UrlTemplateImageryProvider expands `{west/south/east/northProjected}` instead,
            // which yield EPSG:3857 meters when paired with a WebMercatorTilingScheme.
            const usesBboxTemplate = url.includes('{bbox-epsg-3857}');
            // Do NOT pass minimumLevel to Cesium providers: when minimumLevel > 0 Cesium
            // pre-creates imagery skeletons for every tile globally at that level
            // (2^minLevel × 2^minLevel entries), causing OOM. Visibility at low zoom
            // is handled by applyImageryVisibility instead.
            const provider = new Cesium.UrlTemplateImageryProvider({
                url: usesBboxTemplate
                    ? url.replace('{bbox-epsg-3857}', '{westProjected},{southProjected},{eastProjected},{northProjected}')
                    : url,
                ...(usesBboxTemplate ? { tilingScheme: new Cesium.WebMercatorTilingScheme() } : {}),
                credit: sourceConfig.attribution ?? '',
                maximumLevel: maxLevel,
            });
            this.enforceMaxLevel(provider, maxLevel);
            const imageryLayer = new Cesium.ImageryLayer(provider);
            this.viewer.imageryLayers.add(imageryLayer);
            this.handles.set(handleKey, { kind: 'imagery', imageryLayer, minLevel, maxLevel, userVisible: true });
            this.upsertLogicalOrder(layerId, options);
            this.reapplyImageryOrder();
            this.applyImageryVisibility(this.store.getState().zoomLevel ?? 0);
            return true;
        }

        if (sourceConfig.service === 'wms') {
            const wms = sourceConfig as WMSSourceConfig;
            const { baseUrl, layers } = parseWmsUrl(url);
            const minLevel = normalizeLevel(getMinZoom(wms));
            const maxLevel = normalizeLevel(getMaxZoom(wms)) ?? 22;
            // Do NOT pass minimumLevel — see XYZ branch above for explanation.
            const provider = new Cesium.WebMapServiceImageryProvider({
                url: baseUrl, layers: wms.layers ?? layers,
                parameters: { transparent: wms.transparent ?? true, format: wms.format ?? 'image/png', styles: wms.styles ?? '', version: wms.version ?? '1.1.1' },
                maximumLevel: maxLevel, credit: wms.attribution ?? '',
            });
            this.enforceMaxLevel(provider, maxLevel);
            const imageryLayer = new Cesium.ImageryLayer(provider);
            this.viewer.imageryLayers.add(imageryLayer);
            this.handles.set(handleKey, { kind: 'imagery', imageryLayer, minLevel, maxLevel, userVisible: true });
            this.upsertLogicalOrder(layerId, options);
            this.reapplyImageryOrder();
            this.applyImageryVisibility(this.store.getState().zoomLevel ?? 0);
            return true;
        }

        return false;
    }

    private async addGeoJSONSource(layerId: string, sourceId: string, sourceConfig: GeoJSONSourceConfig, subLayers: SubLayerSpec[], options?: LayerInsertOptions): Promise<boolean> {
        const Cesium = getCesium();
        if (!Cesium) return false;
        const handleKey = `${layerId}::${sourceId}`;
        if (this.handles.has(handleKey)) return true;
        this.beginBusyOperation();
        try {
            const data = sourceConfig.data;
            const geojson: GeoJSON.FeatureCollection = typeof data === 'string' ? await (await fetch(data)).json() : data;

            const vertexCount = countFeatureCollectionVertices(geojson);
            const clampToGround = vertexCount <= MAX_CLAMPED_VERTICES;
            if (!clampToGround) {
                console.info(`[CESIUM] Layer "${layerId}": ${vertexCount} vertices exceeds clamp-to-ground limit (${MAX_CLAMPED_VERTICES}), rendering without terrain clamping`);
            }
            const dataSource = await Cesium.GeoJsonDataSource.load(geojson, { clampToGround });
            forceGeodesicArcType(dataSource, Cesium);
            await this.viewer.dataSources.add(dataSource);
            this.applyGeoJsonStyles(dataSource, subLayers, clampToGround, 1);
            this.handles.set(handleKey, { kind: 'geojson', dataSource, sourceId, subLayers, data: geojson, updateToken: 0, clampToGround, opacity: 1 });
            this.upsertLogicalOrder(layerId, options);
                return true;
        } catch (e) {
            console.warn(`[CESIUM] Failed to load GeoJSON layer "${layerId}":`, e);
            return false;
        } finally {
            this.endBusyOperation();
        }
    }

    async addLayer(layerConfig: AnyLayerConfig, options?: LayerInsertOptions): Promise<boolean> {
        const Cesium = getCesium();
        if (!Cesium) return false;
        const layerId = layerConfig.id;

        if (layerConfig.type === 'allmaps') {
            console.warn('[CESIUM LAYER SERVICE] Allmaps is not supported in Cesium.');
            return false;
        }

        if (layerConfig.type === 'style') {
            const spec = normalizeCompositeLayer(layerConfig);
            if (!spec) return false;
            return this.addCompositeLayer(spec, options);
        }

        // StandardLayerConfig
        const stdLayer = layerConfig as StandardLayerConfig;
        if (!stdLayer.source) return false;
        const rawSourceDef = (layerConfig as any).sources?.[stdLayer.source as string];
        const sourceConfig = rawSourceDef ? normalizeRawSource(stdLayer.source as string, rawSourceDef) : null;
        if (!sourceConfig) return false;

        let success = false;
        if (sourceConfig.type === 'raster') success = await this.addImagerySource(layerId, sourceConfig.id, sourceConfig, options);
        else if (sourceConfig.type === 'geojson') success = await this.addGeoJSONSource(layerId, sourceConfig.id, sourceConfig as GeoJSONSourceConfig, [stdLayer as unknown as SubLayerSpec], options);
        return success;
    }

    async addCompositeLayer(spec: NormalizedCompositeSpec, options?: LayerInsertOptions): Promise<boolean> {
        const layerId = spec.styleId;

        // Collect unique sources actually referenced by sub-layers
        const usedSourceKeys = new Set(spec.subLayers.map((l) => l.source).filter(Boolean) as string[]);
        let anySuccess = false;

        for (const sourceKey of usedSourceKeys) {
            const source = findNormalizedSource(spec, sourceKey);
            const sourceConfig: SourceConfig | null = source?.config ?? null;
            if (!sourceConfig) continue;

            if (sourceConfig.type === 'raster') {
                const ok = await this.addImagerySource(layerId, sourceConfig.id, sourceConfig, options);
                if (ok) anySuccess = true;
            } else if (sourceConfig.type === 'geojson') {
                // Cesium fuses all sub-layer styling for a source onto one shared entity
                // collection (see applyGeoJsonStyles) — pass the full normalized sub-layer list.
                const ok = await this.addGeoJSONSource(layerId, sourceConfig.id, sourceConfig as GeoJSONSourceConfig, spec.subLayers, options);
                if (ok) anySuccess = true;
            }
        }

        return anySuccess;
    }

    updateLayerStyle(styleId: string, subLayerId: string, partialPaint: Record<string, unknown>): boolean {
        let updated = false;
        for (const [handleKey, handle] of this.handles.entries()) {
            if (handle.kind !== 'geojson' || !handleKey.startsWith(`${styleId}::`)) continue;
            const subLayerIndex = handle.subLayers.findIndex((sl) => sl.id === subLayerId);
            if (subLayerIndex < 0) continue;
            const subLayer = handle.subLayers[subLayerIndex];
            handle.subLayers[subLayerIndex] = { ...subLayer, paint: { ...(subLayer.paint ?? {}), ...partialPaint } };
            this.applyGeoJsonStyles(handle.dataSource, handle.subLayers, handle.clampToGround, handle.opacity);
            updated = true;
        }
        return updated;
    }

    moveLayer(layerId: string, beforeLayerId?: string | null): void {
        // beforeLayerId may reference a layer not tracked in logicalOrder (e.g. a vector
        // layer that fell back to core.addLayer). Walk forward through mapLayers order to
        // find the nearest layer that IS tracked, so relative position is preserved instead
        // of silently falling back to "push to end" (top of imagery stack).
        let resolvedBeforeLayerId = beforeLayerId ?? null;
        if (resolvedBeforeLayerId && !this.logicalOrder.includes(resolvedBeforeLayerId)) {
            const ids = Object.keys(this.store.getState().mapLayers ?? {});
            const startIndex = ids.indexOf(resolvedBeforeLayerId);
            resolvedBeforeLayerId = startIndex === -1
                ? null
                : (ids.slice(startIndex + 1).find((id) => this.logicalOrder.includes(id)) ?? null);
        }
        this.upsertLogicalOrder(layerId, resolvedBeforeLayerId ? { beforeLayerId: resolvedBeforeLayerId } : undefined);
        this.reapplyImageryOrder();
    }

    removeLayer(layerId: string): void {
        // Remove all native handles created for this logical layer (may include multiple sources).
        const keysToRemove = Array.from(this.handles.keys()).filter(key => key.startsWith(`${layerId}::`));
        for (const key of keysToRemove) {
            const handle = this.handles.get(key);
            if (!handle) continue;

            if (handle.kind === 'imagery') {
                try {
                    this.viewer.imageryLayers.remove(handle.imageryLayer, true);
                } catch {
                    // ignore
                }
            } else if (handle.kind === 'geojson') {
                try {
                    this.viewer.dataSources.remove(handle.dataSource, true);
                } catch {
                    // ignore
                }
            }
            this.handles.delete(key);
        }
        this.logicalOrder = this.logicalOrder.filter((id) => id !== layerId);
        this.reapplyImageryOrder();
    }

    getVisibleLayers(): string[] {
        const layerIds = new Set<string>();
        for (const key of this.handles.keys()) {
            layerIds.add(key.split('::')[0]);
        }
        return Array.from(layerIds);
    }

    isLayerVisible(layerId: string): boolean {
        for (const key of this.handles.keys()) {
            if (key.startsWith(`${layerId}::`)) return true;
        }
        return false;
    }

    setLayerVisibility(layerId: string, visible: boolean): void {
        for (const [key, handle] of this.handles.entries()) {
            if (!key.startsWith(`${layerId}::`)) continue;
            if (handle.kind === 'imagery') {
                handle.userVisible = visible;
                const zoom = this.store.getState().zoomLevel ?? 0;
                const belowMin = handle.minLevel !== undefined && zoom < handle.minLevel;
                handle.imageryLayer.show = visible && !belowMin;
            } else if (handle.kind === 'geojson') {
                handle.dataSource.show = visible;
            }
        }
    }

    setLayerOpacity(layerId: string, opacity: number): void {
        for (const [key, handle] of this.handles.entries()) {
            if (!key.startsWith(`${layerId}::`)) continue;
            if (handle.kind === 'imagery') {
                handle.imageryLayer.alpha = opacity;
            } else if (handle.kind === 'geojson') {
                handle.opacity = opacity;
                this.applyGeoJsonStyles(handle.dataSource, handle.subLayers, handle.clampToGround, opacity);
            }
        }
    }

    getSourceData(sourceId: string): GeoJSON.FeatureCollection | string | null {
        for (const handle of this.handles.values()) {
            if (handle.kind !== 'geojson' || handle.sourceId !== sourceId) continue;
            return handle.data;
        }
        return null;
    }

    getLayerSourceLayers(_layerId: string): string[] { return []; }

    async queryLayerFeatures(layerId: string, _options?: QueryLayerFeaturesOptions): Promise<GeoJSON.FeatureCollection> {
        for (const [handleKey, handle] of this.handles.entries()) {
            if (!handleKey.startsWith(`${layerId}::`) || handle.kind !== 'geojson') continue;
            return handle.data;
        }
        return { type: 'FeatureCollection', features: [] };
    }

    setSourceData(sourceId: string, data: GeoJSON.FeatureCollection): boolean {
        let updated = false;
        for (const [handleKey, handle] of this.handles.entries()) {
            if (handle.kind !== 'geojson' || handle.sourceId !== sourceId) continue;
            handle.data = data;
            handle.updateToken += 1;
            void this.replaceGeoJsonDataSource(handleKey, handle, handle.updateToken);
            updated = true;
        }
        return updated;
    }

    private async replaceGeoJsonDataSource(handleKey: string, handle: Extract<CesiumLayerHandle, { kind: 'geojson' }>, token: number): Promise<void> {
        const Cesium = getCesium();
        if (!Cesium) return;
        this.beginBusyOperation();
        try {
            const nextDataSource = await Cesium.GeoJsonDataSource.load(handle.data, { clampToGround: false });
            forceGeodesicArcType(nextDataSource, Cesium);
            const current = this.handles.get(handleKey);
            if (current?.kind !== 'geojson' || current.updateToken !== token) return;

            const previousDataSource = current.dataSource;
            current.dataSource = nextDataSource;
            await this.viewer.dataSources.add(nextDataSource);
            this.applyGeoJsonStyles(nextDataSource, current.subLayers, current.clampToGround, current.opacity);
            try {
                this.viewer.dataSources.remove(previousDataSource, true);
            } catch {
                // ignore
            }
        } finally {
            this.endBusyOperation();
        }
    }

    getVisibleWMSLayers(): Array<{ layerId: string; layerTitle?: string; sourceConfig: WMSSourceConfig }> {
        // Cesium renders WMS as imagery providers — GetFeatureInfo not yet implemented.
        return [];
    }

    /**
     * Given a picked Cesium entity, returns the logical layer ID it belongs to
     * by checking which GeoJsonDataSource contains it.
     */
    registerInlineLayer(logicalId: string, insertOptions?: LayerInsertOptions): void {
        this.upsertLogicalOrder(logicalId, insertOptions);
    }

    unregisterInlineLayer(logicalId: string): void {
        this.logicalOrder = this.logicalOrder.filter(id => id !== logicalId);
    }

    getLogicalLayerForEntity(entity: any): string | null {
        for (const [handleKey, handle] of this.handles.entries()) {
            if (handle.kind !== 'geojson') continue;
            if (handle.dataSource?.entities?.contains?.(entity)) {
                return handleKey.split('::')[0];
            }
        }
        return null;
    }

    /**
     * Extracts all properties from a Cesium entity's PropertyBag as plain values.
     */
    getEntityProperties(entity: any): Record<string, unknown> {
        const props: Record<string, unknown> = {};
        const propertyNames: string[] = entity?.properties?.propertyNames ?? [];
        for (const key of propertyNames) {
            props[key] = this.getEntityProperty(entity, key);
        }
        return props;
    }

    private enforceMaxLevel(provider: any, maxLevel?: number): void {
        if (typeof maxLevel !== 'number' || !isFinite(maxLevel)) {
            return;
        }
        if (typeof provider.requestImage !== 'function') {
            return;
        }
        const original = provider.requestImage.bind(provider);
        provider.requestImage = (x: number, y: number, level: number, ...rest: unknown[]) => {
            return original(x, y, Math.min(level, maxLevel), ...rest);
        };
        if (provider.tilingScheme && typeof provider.tilingScheme.getNumberOfXTilesAtLevel === 'function') {
            const originalTiles = provider.tilingScheme.getNumberOfXTilesAtLevel.bind(provider.tilingScheme);
            provider.tilingScheme.getNumberOfXTilesAtLevel = (level: number) => originalTiles(Math.min(level, maxLevel));
        }
        if (provider.tilingScheme && typeof provider.tilingScheme.getNumberOfYTilesAtLevel === 'function') {
            const originalTilesY = provider.tilingScheme.getNumberOfYTilesAtLevel.bind(provider.tilingScheme);
            provider.tilingScheme.getNumberOfYTilesAtLevel = (level: number) => originalTilesY(Math.min(level, maxLevel));
        }
    }

    private applyImageryVisibility(currentZoom: number): void {
        for (const handle of this.handles.values()) {
            if (handle.kind !== 'imagery') continue;
            const belowMin = handle.minLevel !== undefined && currentZoom < handle.minLevel;
            handle.imageryLayer.show = handle.userVisible && !belowMin;
        }
    }

    private getEntityProperty(entity: any, key: string): unknown {
        const Cesium = getCesium();
        const julian = Cesium?.JulianDate?.now?.();
        const value = entity?.properties?.[key];
        if (value?.getValue && julian) {
            return value.getValue(julian);
        }
        if (value && typeof value === 'object' && 'valueOf' in value) {
            try {
                return value.valueOf();
            } catch {
                return value;
            }
        }
        return value;
    }

    private entityToFeature(entity: any): { properties: Record<string, unknown>; geometry: { type: string } } {
        const Cesium = getCesium();
        const julian = Cesium?.JulianDate?.now?.();
        const rawProps: Record<string, unknown> = {};
        if (entity?.properties) {
            const names: string[] = entity.properties.propertyNames ?? Object.keys(entity.properties);
            for (const key of names) {
                const val = entity.properties[key];
                rawProps[key] = val?.getValue?.(julian) ?? val;
            }
        }
        let geometryType = 'Point';
        if (entity?.polygon) geometryType = 'Polygon';
        else if (entity?.polyline) geometryType = 'LineString';
        return { properties: rawProps, geometry: { type: geometryType } };
    }

    private matchesStyleFilter(entity: any, filter: unknown): boolean {
        if (!filter) return true;
        return matchesFilter(filter, this.entityToFeature(entity));
    }

    private resolveNumber(entity: any, expression: unknown, fallback: number): number {
        const zoom = this.store.getState().zoomLevel ?? 0;
        return evaluateNumber(expression, this.entityToFeature(entity), zoom, fallback);
    }

    private resolveColor(entity: any, expression: unknown, fallback: string): string {
        const zoom = this.store.getState().zoomLevel ?? 0;
        return evaluateColor(expression, this.entityToFeature(entity), zoom, fallback);
    }

    private applyGeoJsonStyles(dataSource: any, subLayers: SubLayerSpec[], clampToGround = true, opacityFactor = 1): void {
        const Cesium = getCesium();
        if (!Cesium) return;

        const circle = subLayers.find(l => l.type === 'circle') as any;
        const line = subLayers.find(l => l.type === 'line') as any;
        const fill = subLayers.find(l => l.type === 'fill') as any;

        const circlePaint = circle?.paint ?? {};
        const linePaint = line?.paint ?? {};
        const fillPaint = fill?.paint ?? {};

        const zoom = this.store.getState().zoomLevel ?? 0;
        const emptyFeature = { properties: {} };
        const lineColor = evaluateColor(linePaint['line-color'], emptyFeature, zoom, '#3388ff');
        const lineWidth = evaluateNumber(linePaint['line-width'], emptyFeature, zoom, 2);
        const fillColor = evaluateColor(fillPaint['fill-color'], emptyFeature, zoom, '#3388ff');
        const fillOpacity = evaluateNumber(fillPaint['fill-opacity'], emptyFeature, zoom, 0.2);

        const entities = dataSource.entities?.values ?? [];
        for (const entity of entities) {
            const circleMatches = this.matchesStyleFilter(entity, circle?.filter);
            const lineMatches = this.matchesStyleFilter(entity, line?.filter);
            const fillMatches = this.matchesStyleFilter(entity, fill?.filter);
            const pointLikeEntity = Boolean(entity.position || entity.point || entity.billboard || entity.ellipse);

            if (circle && pointLikeEntity && !circleMatches) {
                // If a point does not pass the circle filter, suppress Cesium's default marker rendering.
                entity.point = undefined;
                entity.billboard = undefined;
                entity.ellipse = undefined;

                if (!lineMatches && !fillMatches) {
                    entity.show = false;
                    continue;
                }
            }

            if (circle && pointLikeEntity && circleMatches) {
                entity.show = true;
            }

            if (circle && circleMatches && pointLikeEntity) {
                // For "circle" layers, draw a ground-aligned ellipse so it conforms to the globe.
                // MapLibre circle-radius is in pixels; approximate meters based on current zoom.
                const zoom = this.store.getState().zoomLevel ?? 2;
                const julian = Cesium.JulianDate.now();
                const position = entity.position?.getValue?.(julian) ?? entity.position;
                if (position) {
                    const circleRadius = this.resolveNumber(entity, circlePaint['circle-radius'], 6);
                    const circleColor = this.resolveColor(entity, circlePaint['circle-color'], '#FF5722');
                    const circleOpacity = this.resolveNumber(entity, circlePaint['circle-opacity'], 1.0);
                    const circleStrokeColor = this.resolveColor(entity, circlePaint['circle-stroke-color'], lineColor);
                    const circleStrokeWidth = this.resolveNumber(entity, circlePaint['circle-stroke-width'], 1);

                    const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
                    const lat = (carto.latitude * 180) / Math.PI;
                    const metersPerPixel = webMercatorMetersPerPixelAtLat(zoom, lat);
                    const radiusMeters = Math.max(1, circleRadius * metersPerPixel);

                    if (!entity.ellipse) {
                        entity.ellipse = new Cesium.EllipseGraphics();
                    }
                    setSafeProperty(entity.ellipse, 'semiMajorAxis', radiusMeters);
                    setSafeProperty(entity.ellipse, 'semiMinorAxis', radiusMeters);
                    setColorMaterial(entity.ellipse, Cesium.Color.fromCssColorString(circleColor).withAlpha(circleOpacity * opacityFactor));
                    setSafeProperty(entity.ellipse, 'outline', false); // outlines on terrain require explicit height; use polyline ring instead
                    setSafeProperty(entity.ellipse, 'height', 0); // prevent heightReference warning

                    // Cesium can skip ellipse outlines when clamped to terrain; draw a clamped ring polyline.
                    const lon = Cesium.Math.toDegrees(carto.longitude);
                    const ringLonLat = buildCircleOutlineLonLat(lon, lat, radiusMeters, 64);
                    const ringPositions = ringLonLat.map(([ringLon, ringLat]) =>
                        Cesium.Cartesian3.fromDegrees(ringLon, ringLat, 0)
                    );
                    if (!entity.polyline) {
                        entity.polyline = new Cesium.PolylineGraphics();
                    }
                    const currentPositionsProp = entity.polyline.positions;
                    let positionsChanged = true;
                    if (currentPositionsProp && typeof currentPositionsProp.getValue === 'function') {
                        const julian = Cesium.JulianDate?.now?.() || new Cesium.JulianDate();
                        const currentVal = currentPositionsProp.getValue(julian);
                        if (Array.isArray(currentVal) && currentVal.length === ringPositions.length) {
                            positionsChanged = false;
                            for (let i = 0; i < ringPositions.length; i++) {
                                if (!currentVal[i].equals(ringPositions[i])) {
                                    positionsChanged = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (positionsChanged) {
                        entity.polyline.positions = ringPositions;
                    }
                    setSafeProperty(entity.polyline, 'width', Math.max(1, circleStrokeWidth));
                    setColorMaterial(entity.polyline, Cesium.Color.fromCssColorString(circleStrokeColor).withAlpha(opacityFactor));
                    if ('clampToGround' in entity.polyline) {
                        setSafeProperty(entity.polyline, 'clampToGround', true);
                    }

                    if (Cesium.HeightReference?.CLAMP_TO_GROUND) {
                        setSafeProperty(entity.ellipse, 'heightReference', Cesium.HeightReference.CLAMP_TO_GROUND);
                    }
                    // Do not render default marker/point if ellipse is active.
                    entity.billboard = undefined;
                    entity.point = undefined;
                }
            }
            if (entity.polyline && line && lineMatches) {
                setColorMaterial(entity.polyline, Cesium.Color.fromCssColorString(lineColor).withAlpha(opacityFactor));
                setSafeProperty(entity.polyline, 'width', lineWidth);
                setSafeProperty(entity.polyline, 'clampToGround', clampToGround);
            }
            if (entity.polygon && fill && fillMatches) {
                setColorMaterial(entity.polygon, Cesium.Color.fromCssColorString(fillColor).withAlpha(fillOpacity * opacityFactor));
                setSafeProperty(entity.polygon, 'outline', true);
                const outlineColor = Cesium.Color.fromCssColorString(lineColor).withAlpha(opacityFactor);
                if (entity.polygon.outlineColor instanceof Cesium.ConstantProperty) {
                    const julian = Cesium.JulianDate?.now?.() || new Cesium.JulianDate();
                    const currentVal = entity.polygon.outlineColor.getValue(julian);
                    if (!currentVal || !currentVal.equals(outlineColor)) {
                        entity.polygon.outlineColor.setValue(outlineColor);
                    }
                } else {
                    entity.polygon.outlineColor = outlineColor;
                }
            }
        }
    }

    private applyAllGeoJsonStyles(): void {
        for (const handle of this.handles.values()) {
            if (handle.kind !== 'geojson') continue;
            this.applyGeoJsonStyles(handle.dataSource, handle.subLayers, handle.clampToGround, handle.opacity);
        }
    }
}
