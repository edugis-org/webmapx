// src/map/leaflet-services/MapLayerService.ts

import { ILayerService, LayerInsertOptions } from '../IMapInterfaces';
import { resolveSource, normalizeRawSource } from '../layer-source-utils';
import type { AnyLayerConfig, StandardLayerConfig, CompositeStyleLayerConfig, SourceConfig, GeoJSONSourceConfig, LayerDataConfig, WMSSourceConfig } from '../../config/types';
import { MapStateStore } from '../../store/map-state-store';
import * as L from 'leaflet';
import { LeafletLayerFactory } from './LeafletLayerFactory';

const WARPEDMAP_PROTOCOL = 'warpedmap://';

export class MapLayerService implements ILayerService {
    private map: L.Map;
    private store: MapStateStore;
    private logicalToNative: Map<string, string[]> = new Map();
    private logicalToWMSSource: Map<string, { layerTitle?: string; sourceConfig: WMSSourceConfig }> = new Map();
    // Track native layer instances for removal
    private nativeLayerInstances: Map<string, L.Layer> = new Map();
    // Track WarpedMapLayer instances for cleanup (if @allmaps/leaflet is used)
    private warpedMapLayers: Map<string, any> = new Map();
    private catalog: LayerDataConfig | null = null;
    private sourceIdCounter = 0;
    private busyOps = 0;
    private logicalOrder: string[] = [];

    constructor(map: L.Map, store: MapStateStore) {
        this.map = map;
        this.store = store;
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
            this.store.dispatch({ mapBusy: false }, 'MAP');
            return;
        }

        this.busyOps -= 1;
        if (this.busyOps === 0) {
            this.store.dispatch({ mapBusy: false }, 'MAP');
        }
    }

    private attachTileBusyEvents(layer: L.Layer): void {
        const tileLayer = layer as L.TileLayer & { __webmapxBusyBound?: boolean };
        if (typeof (tileLayer as any).on !== 'function') {
            return;
        }

        if (tileLayer.__webmapxBusyBound) {
            return;
        }

        tileLayer.__webmapxBusyBound = true;
        tileLayer.on('loading', () => this.beginBusyOperation());
        tileLayer.on('load', () => this.endBusyOperation());
        tileLayer.on('tileerror', () => this.endBusyOperation());
    }

    private updateVisibleLayers(): void {
        this.store.dispatch({ visibleLayers: Array.from(this.logicalToNative.keys()) }, 'MAP');
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

    private upsertLogicalOrder(layerId: string, insertIndex?: number): void {
        this.logicalOrder = this.logicalOrder.filter((id) => id !== layerId);

        if (typeof insertIndex !== 'number' || !Number.isFinite(insertIndex)) {
            this.logicalOrder.push(layerId);
            return;
        }

        const clamped = Math.max(0, Math.min(insertIndex, this.logicalOrder.length));
        this.logicalOrder.splice(clamped, 0, layerId);
    }

    private reapplyLogicalOrder(): void {
        for (const logicalLayerId of this.logicalOrder) {
            const warpedLayer = this.warpedMapLayers.get(logicalLayerId);
            if (warpedLayer) {
                // WarpedMapLayer uses WebGL — remove/add destroys the canvas.
                // Instead, move its container element to the end of the pane to preserve z-order.
                const container: HTMLElement | undefined = (warpedLayer as any).container;
                if (container?.parentElement) {
                    container.parentElement.appendChild(container);
                }
                continue;
            }
            const nativeIds = this.logicalToNative.get(logicalLayerId) ?? [];
            for (const nativeId of nativeIds) {
                const layer = this.nativeLayerInstances.get(nativeId);
                if (!layer || !this.map.hasLayer(layer)) {
                    continue;
                }

                this.map.removeLayer(layer);
                this.map.addLayer(layer);
            }
        }
    }

    setCatalog(catalog: LayerDataConfig): void {
        this.catalog = catalog;
    }

    /**
     * Check if a source URL uses the warpedmap:// protocol.
     */
    private isWarpedMapSource(sourceConfig: SourceConfig): boolean {
        if (sourceConfig.type === 'raster' && 'url' in sourceConfig) {
            const url = Array.isArray(sourceConfig.url) ? sourceConfig.url[0] : sourceConfig.url;
            return url.startsWith(WARPEDMAP_PROTOCOL);
        }
        return false;
    }

    /**
     * Parse a warpedmap:// URL and return the annotation URL.
     */
    private parseWarpedMapUrl(url: string): string {
        if (url.startsWith(WARPEDMAP_PROTOCOL)) {
            return 'https://' + url.slice(WARPEDMAP_PROTOCOL.length);
        }
        return url;
    }

    /**
     * Create and add a WarpedMapLayer for Allmaps georeferenced images.
     */
    private async addWarpedMapLayer(layerId: string, annotationUrl: string): Promise<boolean> {

        try {
            this.beginBusyOperation();
            // Dynamic import of @allmaps/leaflet
            const { WarpedMapLayer } = await import('@allmaps/leaflet');

            // Create a unique layer ID for the WarpedMapLayer
            const warpedLayerId = `warpedmap-${layerId}`;

            // Use overlayPane (z-index 400 vs tilePane 200) so it always renders above background tiles.
            const warpedMapLayer = new WarpedMapLayer(annotationUrl, { pane: 'overlayPane' });

            // Add the layer to the map
            (warpedMapLayer as unknown as L.Layer).addTo(this.map);

            // Track the layer
            this.warpedMapLayers.set(layerId, warpedMapLayer);
            this.nativeLayerInstances.set(warpedLayerId, warpedMapLayer);
            this.logicalToNative.set(layerId, [warpedLayerId]);
            this.updateVisibleLayers();

            return true;
        } catch (error) {
            console.warn('[LEAFLET LAYER SERVICE] @allmaps/leaflet not available or error loading warped map:', error);
            return false;
        } finally {
            this.endBusyOperation();
        }
    }

    async addLayer(layerConfig: AnyLayerConfig, options?: LayerInsertOptions): Promise<boolean> {
        const layerId = layerConfig.id;
        const insertIndex = this.resolveInsertIndex(options);

        if (layerConfig.type === 'allmaps') {
            const success = await this.addWarpedMapLayer(layerId, layerConfig.annotation);
            if (success) { this.upsertLogicalOrder(layerId, insertIndex); this.reapplyLogicalOrder(); }
            return success;
        }

        if (layerConfig.type === 'style') {
            return this.addCompositeLayer(layerConfig, insertIndex);
        }

        // StandardLayerConfig
        const stdLayer = layerConfig as StandardLayerConfig;
        if (!stdLayer.source) return false;
        const sourceConfig = resolveSource(this.catalog,stdLayer.source);
        if (!sourceConfig) return false;

        // Legacy warpedmap:// support
        if (this.isWarpedMapSource(sourceConfig)) {
            const url = Array.isArray((sourceConfig as any).url) ? (sourceConfig as any).url[0] : (sourceConfig as any).url;
            const annotationUrl = this.parseWarpedMapUrl(url);
            const success = await this.addWarpedMapLayer(layerId, annotationUrl);
            if (success) { this.upsertLogicalOrder(layerId, insertIndex); this.reapplyLogicalOrder(); }
            return success;
        }

        const nativeLayerIds: string[] = [];
        const subLayers = [stdLayer];

        if (sourceConfig.type === 'raster') {
            const spec = sourceConfig.service === 'xyz'
                ? LeafletLayerFactory.createXYZLayer(layerId, sourceConfig)
                : LeafletLayerFactory.createWMSLayer(layerId, sourceConfig);
            if (spec && !this.nativeLayerInstances.has(spec.id)) {
                this.attachTileBusyEvents(spec.layer);
                spec.layer.addTo(this.map);
                this.nativeLayerInstances.set(spec.id, spec.layer);
                nativeLayerIds.push(spec.id);
            }
            if (sourceConfig.service === 'wms') {
                this.logicalToWMSSource.set(layerId, {
                    layerTitle: (layerConfig as any).title,
                    sourceConfig: sourceConfig as WMSSourceConfig,
                });
            }
        } else if (sourceConfig.type === 'geojson') {
            const data = await this.fetchGeoJSON(sourceConfig as GeoJSONSourceConfig);
            if (!data) return false;
            const specs = LeafletLayerFactory.createGeoJSONLayer(layerId, sourceConfig, data, subLayers);
            for (const spec of specs) {
                if (!this.nativeLayerInstances.has(spec.id)) {
                    spec.layer.addTo(this.map);
                    this.nativeLayerInstances.set(spec.id, spec.layer);
                    nativeLayerIds.push(spec.id);
                }
            }
        } else if (sourceConfig.type === 'vector') {
            console.warn('[LEAFLET LAYER SERVICE] Vector tile sources require leaflet.vectorgrid plugin');
            return false;
        }

        this.logicalToNative.set(layerId, nativeLayerIds);
        this.upsertLogicalOrder(layerId, insertIndex);
        this.reapplyLogicalOrder();
        this.updateVisibleLayers();
        return nativeLayerIds.length > 0;
    }

    private async fetchGeoJSON(sourceConfig: GeoJSONSourceConfig): Promise<GeoJSON.FeatureCollection | GeoJSON.Feature | null> {
        if (typeof sourceConfig.data !== 'string') return sourceConfig.data as GeoJSON.FeatureCollection;
        try {
            this.beginBusyOperation();
            const response = await fetch(sourceConfig.data);
            return await response.json();
        } catch (error) {
            console.error('[LEAFLET LAYER SERVICE] Failed to fetch GeoJSON:', error);
            return null;
        } finally {
            this.endBusyOperation();
        }
    }

    private async addCompositeLayer(layerConfig: CompositeStyleLayerConfig, insertIndex: number | undefined): Promise<boolean> {
        const layerId = layerConfig.id;
        const localSources = layerConfig.sources ?? {};
        const subLayers = layerConfig.layers ?? [];

        const localSourceMap = new Map<string, SourceConfig>();
        for (const [key, rawDef] of Object.entries(localSources)) {
            const src = normalizeRawSource(`${layerId}:${key}`, rawDef);
            if (src) localSourceMap.set(key, src);
        }

        const nativeLayerIds: string[] = [];

        // Group sub-layers by source
        const sourceLayerMap = new Map<string, typeof subLayers>();
        for (const subLayer of subLayers) {
            const key = subLayer.source ?? '';
            if (!sourceLayerMap.has(key)) sourceLayerMap.set(key, []);
            sourceLayerMap.get(key)!.push(subLayer);
        }

        for (const [sourceKey, layers] of sourceLayerMap.entries()) {
            let sourceConfig: SourceConfig | null = localSourceMap.get(sourceKey) ?? null;
            if (!sourceConfig) sourceConfig = resolveSource(this.catalog,sourceKey);
            if (!sourceConfig) continue;

            if (sourceConfig.type === 'raster') {
                const spec = sourceConfig.service === 'xyz'
                    ? LeafletLayerFactory.createXYZLayer(layerId, sourceConfig)
                    : LeafletLayerFactory.createWMSLayer(layerId, sourceConfig);
                if (spec && !this.nativeLayerInstances.has(spec.id)) {
                    this.attachTileBusyEvents(spec.layer);
                    spec.layer.addTo(this.map);
                    this.nativeLayerInstances.set(spec.id, spec.layer);
                    nativeLayerIds.push(spec.id);
                }
            } else if (sourceConfig.type === 'geojson') {
                const data = await this.fetchGeoJSON(sourceConfig as GeoJSONSourceConfig);
                if (!data) continue;
                const specs = LeafletLayerFactory.createGeoJSONLayer(layerId, sourceConfig, data, layers);
                for (const spec of specs) {
                    if (!this.nativeLayerInstances.has(spec.id)) {
                        spec.layer.addTo(this.map);
                        this.nativeLayerInstances.set(spec.id, spec.layer);
                        nativeLayerIds.push(spec.id);
                    }
                }
            }
        }

        this.logicalToNative.set(layerId, nativeLayerIds);
        this.upsertLogicalOrder(layerId, insertIndex);
        this.reapplyLogicalOrder();
        this.updateVisibleLayers();
        return nativeLayerIds.length > 0;
    }

    removeLayer(layerId: string): void {
        // Check if this is a WarpedMapLayer
        if (this.warpedMapLayers.has(layerId)) {
            const warpedLayer = this.warpedMapLayers.get(layerId);
            if (warpedLayer) {
                this.map.removeLayer(warpedLayer);
            }
            this.warpedMapLayers.delete(layerId);
        }

        const nativeIds = this.logicalToNative.get(layerId) || [];

        for (const id of nativeIds) {
            const layer = this.nativeLayerInstances.get(id);
            if (layer) {
                this.map.removeLayer(layer);
                this.nativeLayerInstances.delete(id);
            }
        }

        this.logicalToNative.delete(layerId);
        this.logicalToWMSSource.delete(layerId);
        this.logicalOrder = this.logicalOrder.filter((id) => id !== layerId);
        this.updateVisibleLayers();
    }

    getVisibleLayers(): string[] {
        return Array.from(this.logicalToNative.keys());
    }

    isLayerVisible(layerId: string): boolean {
        return this.logicalToNative.has(layerId);
    }

    /**
     * Returns GeoJSON feature properties for features whose visual representation
     * is within tolerancePx of the given container pixel.
     */
    queryVectorFeaturesAtPixel(
        map: L.Map,
        pixel: [number, number],
        tolerancePx: number,
        layerFilter?: Set<string>
    ): Array<{ layerId: string; properties: Record<string, unknown> }> {
        const results: Array<{ layerId: string; properties: Record<string, unknown> }> = [];
        const clickPoint = L.point(pixel[0], pixel[1]);

        for (const [logicalId, nativeIds] of this.logicalToNative.entries()) {
            if (layerFilter && !layerFilter.has(logicalId)) continue;
            for (const nativeId of nativeIds) {
                const nativeLayer = this.nativeLayerInstances.get(nativeId);
                if (!nativeLayer || typeof (nativeLayer as any).getLayers !== 'function') continue;
                const geoJsonLayer = nativeLayer as L.GeoJSON;
                for (const subLayer of geoJsonLayer.getLayers()) {
                    if (this.isHitAtPixel(map, subLayer, clickPoint, tolerancePx)) {
                        const feature = (subLayer as any).feature as GeoJSON.Feature | undefined;
                        if (feature?.properties) {
                            results.push({ layerId: logicalId, properties: feature.properties as Record<string, unknown> });
                        }
                    }
                }
            }
        }
        return results;
    }

    private isHitAtPixel(map: L.Map, layer: L.Layer, clickPoint: L.Point, tolerancePx: number): boolean {
        // CircleMarker / Circle — point features rendered as circles
        if (layer instanceof L.CircleMarker) {
            const center = map.latLngToContainerPoint(layer.getLatLng());
            const radius = (layer as L.CircleMarker).getRadius() + tolerancePx;
            return center.distanceTo(clickPoint) <= radius;
        }
        // Polygon / Rectangle
        if (layer instanceof L.Polygon) {
            const latlng = map.containerPointToLatLng(clickPoint);
            return layer.getBounds().contains(latlng);
        }
        // Polyline
        if (layer instanceof L.Polyline) {
            const latlngs = layer.getLatLngs().flat(2) as L.LatLng[];
            for (let i = 0; i < latlngs.length - 1; i++) {
                const a = map.latLngToContainerPoint(latlngs[i]);
                const b = map.latLngToContainerPoint(latlngs[i + 1]);
                if (this.pointToSegmentDistancePx(clickPoint, a, b) <= tolerancePx) return true;
            }
        }
        return false;
    }

    private pointToSegmentDistancePx(p: L.Point, a: L.Point, b: L.Point): number {
        const dx = b.x - a.x, dy = b.y - a.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return p.distanceTo(a);
        const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
        return p.distanceTo(L.point(a.x + t * dx, a.y + t * dy));
    }

    getVisibleWMSLayers(): Array<{ layerId: string; layerTitle?: string; sourceConfig: WMSSourceConfig }> {
        const result: Array<{ layerId: string; layerTitle?: string; sourceConfig: WMSSourceConfig }> = [];
        for (const [layerId, entry] of this.logicalToWMSSource.entries()) {
            if (this.logicalToNative.has(layerId)) {
                result.push({ layerId, ...entry });
            }
        }
        return result;
    }

    getNativeToLogicalLayerMap(): Map<string, string> {
        const map = new Map<string, string>();
        for (const [logicalId, nativeIds] of this.logicalToNative.entries()) {
            for (const nativeId of nativeIds) {
                map.set(nativeId, logicalId);
            }
        }
        return map;
    }
}
