// src/map/leaflet-services/MapLayerService.ts

import { ILayerService, LayerInsertOptions } from '../IMapInterfaces';
import { normalizeRawSource } from '../layer-source-utils';
import type { AnyLayerConfig, StandardLayerConfig, SourceConfig, GeoJSONSourceConfig, WMSSourceConfig, SubLayerSpec } from '../../config/types';
import { normalizeCompositeLayer, findNormalizedSource, type NormalizedCompositeSpec } from '../composite-layer-utils';
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
    private nativeLayerToSource: Map<string, string> = new Map();
    // Track WarpedMapLayer instances for cleanup (if @allmaps/leaflet is used)
    private warpedMapLayers: Map<string, any> = new Map();
    private compositeSubLayerCache: Map<string, { spec: SubLayerSpec; sourceConfig: SourceConfig; data: GeoJSON.FeatureCollection | GeoJSON.Feature }> = new Map();
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
                    this.nativeLayerToSource.set(spec.id, sourceConfig.id);
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

    async addCompositeLayer(spec: NormalizedCompositeSpec, options?: LayerInsertOptions): Promise<boolean> {
        const layerId = spec.styleId;
        const insertIndex = this.resolveInsertIndex(options);
        const nativeLayerIds: string[] = [];

        // Group already-normalized sub-layers by the (already-derived, stable) source they reference
        const sourceLayerMap = new Map<string, typeof spec.subLayers>();
        for (const subLayer of spec.subLayers) {
            const key = subLayer.source ?? '';
            if (!sourceLayerMap.has(key)) sourceLayerMap.set(key, []);
            sourceLayerMap.get(key)!.push(subLayer);
        }

        for (const [sourceKey, layers] of sourceLayerMap.entries()) {
            const source = findNormalizedSource(spec, sourceKey);
            const sourceConfig: SourceConfig | null = source?.config ?? null;
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
                for (const layerSpec of specs) {
                    if (!this.nativeLayerInstances.has(layerSpec.id)) {
                        layerSpec.layer.addTo(this.map);
                        this.nativeLayerInstances.set(layerSpec.id, layerSpec.layer);
                        this.nativeLayerToSource.set(layerSpec.id, sourceConfig.id);
                        nativeLayerIds.push(layerSpec.id);
                        const subLayer = layers.find((sl) => layerSpec.id === `${layerId}-${sl.id}`);
                        if (subLayer) this.compositeSubLayerCache.set(layerSpec.id, { spec: subLayer, sourceConfig, data });
                    }
                }
            }
        }

        this.logicalToNative.set(layerId, nativeLayerIds);
        this.upsertLogicalOrder(layerId, insertIndex);
        this.reapplyLogicalOrder();
        return nativeLayerIds.length > 0;
    }

    updateLayerStyle(styleId: string, subLayerId: string, partialPaint: Record<string, unknown>): boolean {
        const nativeLayerId = `${styleId}-${subLayerId}`;
        const cached = this.compositeSubLayerCache.get(nativeLayerId);
        const layer = this.nativeLayerInstances.get(nativeLayerId) as L.GeoJSON | undefined;
        if (!cached || !layer || typeof layer.setStyle !== 'function') return false;

        const mergedSpec: SubLayerSpec = { ...cached.spec, paint: { ...(cached.spec.paint ?? {}), ...partialPaint } };
        layer.setStyle((feature) => LeafletLayerFactory.convertPaintToLeafletStyle(mergedSpec, feature as GeoJSON.Feature));
        this.compositeSubLayerCache.set(nativeLayerId, { ...cached, spec: mergedSpec });
        return true;
    }

    moveLayer(layerId: string, beforeLayerId?: string | null): void {
        const insertIndex = beforeLayerId ? this.resolveInsertIndex({ beforeLayerId }) : undefined;
        this.upsertLogicalOrder(layerId, insertIndex);
        this.reapplyLogicalOrder();
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
                this.nativeLayerToSource.delete(id);
                this.compositeSubLayerCache.delete(id);
            }
        }

        this.logicalToNative.delete(layerId);
        this.logicalToWMSSource.delete(layerId);
        this.logicalOrder = this.logicalOrder.filter((id) => id !== layerId);
    }

    getVisibleLayers(): string[] {
        return Array.from(this.logicalToNative.keys());
    }

    isLayerVisible(layerId: string): boolean {
        return this.logicalToNative.has(layerId);
    }

    setLayerOpacity(layerId: string, opacity: number): void {
        const nativeIds = this.logicalToNative.get(layerId) ?? [];
        for (const nativeId of nativeIds) {
            const layer = this.nativeLayerInstances.get(nativeId) as any;
            if (!layer) continue;
            if (typeof layer.setOpacity === 'function') {
                layer.setOpacity(opacity);
            } else if (typeof layer.setStyle === 'function') {
                layer.setStyle({ opacity, fillOpacity: opacity });
            }
        }
    }

    setLayerVisibility(layerId: string, visible: boolean): void {
        const nativeIds = this.logicalToNative.get(layerId) ?? [];
        for (const nativeId of nativeIds) {
            const layer = this.nativeLayerInstances.get(nativeId);
            if (!layer) continue;
            if (visible) {
                if (!this.map.hasLayer(layer)) this.map.addLayer(layer);
            } else {
                if (this.map.hasLayer(layer)) this.map.removeLayer(layer);
            }
        }
    }

    getSourceData(sourceId: string): GeoJSON.FeatureCollection | string | null {
        for (const [nativeLayerId, usedSourceId] of this.nativeLayerToSource.entries()) {
            if (usedSourceId !== sourceId) continue;
            const layer = this.nativeLayerInstances.get(nativeLayerId) as L.GeoJSON | undefined;
            const data = layer && typeof (layer as any).toGeoJSON === 'function'
                ? (layer as any).toGeoJSON()
                : null;
            if (!data) continue;
            if (data.type === 'FeatureCollection') return data as GeoJSON.FeatureCollection;
            if (data.type === 'Feature') return { type: 'FeatureCollection', features: [data as GeoJSON.Feature] };
        }
        return null;
    }

    setSourceData(sourceId: string, data: GeoJSON.FeatureCollection): boolean {
        let updated = false;
        for (const [nativeLayerId, usedSourceId] of this.nativeLayerToSource.entries()) {
            if (usedSourceId !== sourceId) continue;
            const layer = this.nativeLayerInstances.get(nativeLayerId) as L.GeoJSON | undefined;
            if (!layer || typeof (layer as any).clearLayers !== 'function' || typeof (layer as any).addData !== 'function') continue;
            (layer as any).clearLayers();
            (layer as any).addData(data);
            updated = true;
        }
        return updated;
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
            const rings = layer.getLatLngs() as (L.LatLng[] | L.LatLng[][] | L.LatLng[][][]);
            const toPoints = (ring: L.LatLng[]) => ring.map((ll) => map.latLngToContainerPoint(ll));
            // Leaflet always returns an array of rings (LatLng[][]) for a simple polygon,
            // or an array of polygons of rings (LatLng[][][]) for a multipolygon.
            const first = rings[0] as unknown;
            const firstPoint = (first as any[])[0];
            const isLatLng = firstPoint != null && typeof (firstPoint as any).lat === 'number';
            const polygons: L.Point[][][] = [];
            if (isLatLng) {
                // Polygon (with possible holes): rings = [ring][point]
                polygons.push((rings as L.LatLng[][]).map(toPoints));
            } else {
                // MultiPolygon: rings = [poly][ring][point]
                for (const poly of rings as L.LatLng[][][]) {
                    polygons.push(poly.map(toPoints));
                }
            }

            // Outline-only styling (fill: false) represents a border, not an area —
            // hit-test it like a line ("on"/"very near") rather than "inside".
            if ((layer as any).options?.fill === false) {
                for (const poly of polygons) {
                    for (const ring of poly) {
                        for (let i = 0; i < ring.length; i++) {
                            const a = ring[i];
                            const b = ring[(i + 1) % ring.length];
                            if (this.pointToSegmentDistancePx(clickPoint, a, b) <= tolerancePx) return true;
                        }
                    }
                }
                return false;
            }

            if (!layer.getBounds().contains(map.containerPointToLatLng(clickPoint))) return false;
            for (const poly of polygons) {
                const [outer, ...holes] = poly;
                if (!outer || !this.pointInRing(clickPoint, outer)) continue;
                if (holes.some((hole) => this.pointInRing(clickPoint, hole))) continue;
                return true;
            }
            return false;
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

    private pointInRing(p: L.Point, ring: L.Point[]): boolean {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i].x, yi = ring[i].y;
            const xj = ring[j].x, yj = ring[j].y;
            const intersect = ((yi > p.y) !== (yj > p.y)) &&
                (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    private pointToSegmentDistancePx(p: L.Point, a: L.Point, b: L.Point): number {
        const dx = b.x - a.x, dy = b.y - a.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return p.distanceTo(a);
        const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
        return p.distanceTo(L.point(a.x + t * dx, a.y + t * dy));
    }

    registerInlineLayer(logicalId: string, nativeLayers: L.Layer[], insertOptions?: LayerInsertOptions): void {
        const insertIndex = this.resolveInsertIndex(insertOptions);
        const nativeIds: string[] = [];
        for (let i = 0; i < nativeLayers.length; i++) {
            const nativeId = `${logicalId}-inline-${i}`;
            this.nativeLayerInstances.set(nativeId, nativeLayers[i]);
            nativeIds.push(nativeId);
        }
        this.logicalToNative.set(logicalId, nativeIds);
        this.upsertLogicalOrder(logicalId, insertIndex);
    }

    unregisterInlineLayer(logicalId: string): void {
        const nativeIds = this.logicalToNative.get(logicalId) ?? [];
        for (const id of nativeIds) this.nativeLayerInstances.delete(id);
        this.logicalToNative.delete(logicalId);
        this.logicalOrder = this.logicalOrder.filter(id => id !== logicalId);
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

}
