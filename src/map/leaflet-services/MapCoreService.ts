// src/map/leaflet-services/MapCoreService.ts

import { IMapCore, ISource, NavigationCapabilities } from '../IMapInterfaces';
import { MapStateStore } from '../../store/map-state-store';
import { MapEventBus, LngLat, Pixel, PointerResolution } from '../../store/map-events';
import type { MapStyle } from '../../config/types';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LeafletLayerFactory } from './LeafletLayerFactory';

/**
 * Zoom offset to normalize between MapLibre (512px tiles) and Leaflet/OSM (256px tiles).
 * Leaflet needs +1 zoom to show the same geographic extent as MapLibre.
 */
const ZOOM_OFFSET = 1;

/**
 * Implements the core map contract (IMapCore) for the Leaflet engine.
 * This service now correctly handles the lifecycle of dynamic sources and layers.
 */
export class MapCoreService implements IMapCore {
    constructor(
        private readonly store: MapStateStore,
        private readonly eventBus?: MapEventBus
    ) {}

    private layerOrderRegistry: { registerInlineLayer: (id: string, layers: L.Layer[], options?: any) => void; unregisterInlineLayer: (id: string) => void } | null = null;

    setLayerOrderRegistry(registry: { registerInlineLayer: (id: string, layers: L.Layer[], options?: any) => void; unregisterInlineLayer: (id: string) => void }): void {
        this.layerOrderRegistry = registry;
    }

    private mapInstance: L.Map | null = null;
    private mapReadyCallbacks: Array<(map: L.Map) => void> = [];
    private silentSourceIds = new Set<string>();
    private minZoom?: number;
    private maxZoom?: number;

    // State for dynamic sources and layers
    private sources: Map<string, any> = new Map();
    private geoJSONData = new Map<string, GeoJSON.FeatureCollection>();
    private logicalToNative: Map<string, L.Layer[]> = new Map();
    private sourceToLayers: Map<string, string[]> = new Map();
    private runtimeLayerOrder: string[] = [];
    private runtimeLayerZoomRange: Map<string, { minzoom?: number; maxzoom?: number }> = new Map();

    private readonly initialConfig = {
        center: [51.17, 10.45] as [number, number],
        zoom: 4,
    };

    private applyZIndexIsolation(container: HTMLElement): void {
        container.style.isolation = 'isolate';
        container.style.zIndex = '0';
        container.style.position = 'relative';
    }

    private injectLeafletCSSFixes(): void {
        const styleId = 'webmapx-leaflet-fixes';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .leaflet-container { background: #f2efe9 !important; }
            .leaflet-tile-pane { background: #f2efe9 !important; }
            .leaflet-container img.leaflet-tile { mix-blend-mode: normal; }
        `;
        document.head.appendChild(style);
    }

    public getViewportState(): { center: [number, number], zoom: number, bearing: number, pitch: number } {
        if (this.mapInstance) {
            const center = this.mapInstance.getCenter();
            const logicalZoom = this.mapInstance.getZoom() - ZOOM_OFFSET;
            return {
                center: [center.lng, center.lat],
                zoom: logicalZoom,
                bearing: 0,
                pitch: 0
            };
        }
        return { center: [0, 0], zoom: 1, bearing: 0, pitch: 0 };
    }

    public setViewport(center: [number, number], zoom: number): void {
        if (this.mapInstance) {
            const clampedZoom = this.clampZoom(zoom);
            const leafletZoom = Math.round(clampedZoom) + ZOOM_OFFSET;
            this.mapInstance.flyTo([center[1], center[0]], leafletZoom);
            if (clampedZoom !== zoom) {
                this.scheduleViewportSync();
            }
        }
    }

    public initialize(containerId: string, options?: { center?: [number, number]; zoom?: number; minZoom?: number; maxZoom?: number; minPitch?: number; maxPitch?: number; styleUrl?: string; style?: MapStyle }): void {
        const center = options?.center ? [options.center[1], options.center[0]] as [number, number] : this.initialConfig.center;
        const logicalZoom = options?.zoom ?? this.initialConfig.zoom;
        const leafletZoom = Math.round(logicalZoom) + ZOOM_OFFSET;
        this.minZoom = options?.minZoom;
        this.maxZoom = options?.maxZoom;
        const minZoom = options?.minZoom !== undefined ? Math.round(options.minZoom) + ZOOM_OFFSET : undefined;
        const maxZoom = options?.maxZoom !== undefined ? Math.round(options.maxZoom) + ZOOM_OFFSET : undefined;
        const containerTarget = this.resolveContainer(containerId);

        if (containerTarget instanceof HTMLElement) {
            this.applyZIndexIsolation(containerTarget);
        }
        this.injectLeafletCSSFixes();

        this.mapInstance = L.map(containerTarget, {
            center: center,
            zoom: leafletZoom,
            minZoom,
            maxZoom,
            attributionControl: false,
            zoomControl: false,
        });

        this.flushMapReadyCallbacks();
        this.setupBaseLayers(options);
        this.setupMapEvents(this.mapInstance, logicalZoom, center);
    }

    private setupBaseLayers(options?: { styleUrl?: string; style?: MapStyle }): void {
        if (options?.style?.sources) {
            for (const source of Object.values(options.style.sources)) {
                if (source.type === 'raster' && source.tiles?.length) {
                    L.tileLayer(source.tiles[0], {
                        attribution: source.attribution || '',
                        tileSize: source.tileSize || 256,
                        minZoom: source.minzoom,
                        maxNativeZoom: source.maxzoom,
                    }).addTo(this.mapInstance!);
                }
            }
        } else if (options?.styleUrl) {
            (async () => {
                await this.loadStyleFromUrl(options.styleUrl!);
            })();
        }
    }

    private setupMapEvents(map: L.Map, initialLogicalZoom: number, initialCenter: [number, number]): void {
        map.whenReady(() => {
            this.store.dispatch({
                mapLoaded: true,
                zoomLevel: initialLogicalZoom,
                mapCenter: [initialCenter[1], initialCenter[0]],
                mapViewportBounds: this.buildViewportFeature()
            }, 'MAP');
        });

        map.on('loading', () => this.store.dispatch({ mapBusy: true }, 'MAP'));
        map.on('load', () => this.store.dispatch({ mapBusy: false }, 'MAP'));

        map.on('zoomend', () => {
            const logicalZoom = map.getZoom() - ZOOM_OFFSET;
            this.applyRuntimeLayerVisibility();
            this.store.dispatch({ zoomLevel: logicalZoom, mapViewportBounds: this.buildViewportFeature() }, 'MAP');
            this.eventBus?.emit({ type: 'zoom-end', zoom: logicalZoom });
        });

        map.on('moveend', () => {
            const center = map.getCenter();
            const logicalZoom = map.getZoom() - ZOOM_OFFSET;
            this.store.dispatch({
                mapCenter: [center.lng, center.lat],
                zoomLevel: logicalZoom,
                mapViewportBounds: this.buildViewportFeature()
            }, 'MAP');
            this.emitViewChangeEnd();
        });

        map.on('move', () => {
            this.dispatchViewportBoundsSnapshot();
            this.emitViewChange();
        });

        this.attachPointerEvents(map);
    }

    private attachPointerEvents(map: L.Map): void {
        map.on('mousemove', (e: L.LeafletMouseEvent) => this.emitPointerEvent('pointer-move', e));
        map.on('mousedown', (e: L.LeafletMouseEvent) => {
            const coords: LngLat = [e.latlng.lng, e.latlng.lat];
            const pixel: Pixel = [e.layerPoint.x, e.layerPoint.y];
            this.eventBus?.emit({ type: 'pointer-down', coords, pixel, button: (e.originalEvent as MouseEvent).button, originalEvent: e.originalEvent });
        });
        map.on('mouseup', (e: L.LeafletMouseEvent) => {
            const coords: LngLat = [e.latlng.lng, e.latlng.lat];
            const pixel: Pixel = [e.layerPoint.x, e.layerPoint.y];
            this.eventBus?.emit({ type: 'pointer-up', coords, pixel, button: (e.originalEvent as MouseEvent).button, originalEvent: e.originalEvent });
        });
        map.on('mouseout', (e: L.LeafletMouseEvent) => {
            this.eventBus?.emit({ type: 'pointer-leave', originalEvent: e.originalEvent });
            this.store.dispatch({ pointerCoordinates: null, pointerResolution: null }, 'MAP');
        });
        map.on('click', (e: L.LeafletMouseEvent) => this.emitPointerEvent('click', e, true));
        map.on('dblclick', (e: L.LeafletMouseEvent) => this.emitPointerEvent('dblclick', e));
        map.on('contextmenu', (e: L.LeafletMouseEvent) => this.emitPointerEvent('contextmenu', e));
    }

    private emitPointerEvent(type: 'pointer-move' | 'click' | 'dblclick' | 'contextmenu', e: L.LeafletMouseEvent, updateStore = false): void {
        const coords: LngLat = [e.latlng.lng, e.latlng.lat];
        const pixel: Pixel = [e.layerPoint.x, e.layerPoint.y];
        const resolution = this.computePointerResolution(e);

        const eventPayload: any = { type, coords, pixel, resolution, originalEvent: e.originalEvent };

        this.eventBus?.emit(eventPayload);

        if (updateStore) {
            this.store.dispatch({
                lastClickedCoordinates: coords,
                lastClickedResolution: resolution,
            }, 'MAP');
        }
        if (type === 'pointer-move') {
            this.store.dispatch({ pointerCoordinates: coords, pointerResolution: resolution }, 'MAP');
        }
    }

    public project(coords: LngLat): Pixel {
        if (!this.mapInstance) {
            console.warn('[CORE SERVICE - Leaflet] project called before map instance is ready.');
            return [0, 0];
        }
        const latLng = L.latLng(coords[1], coords[0]);
        const pixel = this.mapInstance.latLngToContainerPoint(latLng);
        return [pixel.x, pixel.y];
    }

    public unproject(pixel: Pixel): LngLat | null {
        if (!this.mapInstance) return null;
        const latLng = this.mapInstance.containerPointToLatLng({ x: pixel[0], y: pixel[1] } as any);
        if (!latLng) return null;
        return [latLng.lng, latLng.lat];
    }

    public fitBounds(bbox: [number, number, number, number]): void {
        if (!this.mapInstance) return;
        // Leaflet expects [[south, west], [north, east]] in lat/lng order
        const southWest = L.latLng(bbox[1], bbox[0]);
        const northEast = L.latLng(bbox[3], bbox[2]);
        const bounds = L.latLngBounds(southWest, northEast);
        this.mapInstance.fitBounds(bounds, { padding: [40, 40], animate: true });
    }

    public setCursor(cursor: string): void {
        if (!this.mapInstance) return;
        this.mapInstance.getContainer().style.cursor = cursor;
    }

    public setPanEnabled(enabled: boolean): void {
        if (!this.mapInstance) return;
        if (enabled) {
            this.mapInstance.dragging.enable();
        } else {
            this.mapInstance.dragging.disable();
        }
    }

    public setDoubleClickZoomEnabled(enabled: boolean): void {
        if (!this.mapInstance) return;
        if (enabled) {
            this.mapInstance.doubleClickZoom.enable();
        } else {
            this.mapInstance.doubleClickZoom.disable();
        }
    }

    public setLayerVisibility(layerId: string, visible: boolean): void {
        if (!this.mapInstance) return;
        const nativeLayers = this.logicalToNative.get(layerId) ?? [];
        nativeLayers.forEach(layer => {
            if (visible) {
                if (!this.mapInstance!.hasLayer(layer)) this.mapInstance!.addLayer(layer);
            } else {
                if (this.mapInstance!.hasLayer(layer)) this.mapInstance!.removeLayer(layer);
            }
        });
    }

    public getSourceData(sourceId: string): GeoJSON.FeatureCollection | string | null {
        // Registry first — updated on addSource (inline data) and setData
        const cached = this.geoJSONData.get(sourceId);
        if (cached) return cached;
        // Fallback: check raw config for URL-backed sources
        const config = this.sources.get(sourceId);
        if (!config) return null;
        if (config.type !== 'geojson') return null;
        if (typeof config.data === 'string') return config.data;
        return null;
    }

    private computePointerResolution(event: L.LeafletMouseEvent): PointerResolution | null {
        if (!this.mapInstance || !event.layerPoint) return null;
        const { x, y } = event.layerPoint; // Use layerPoint for consistency
        const lngSample = this.mapInstance.layerPointToLatLng([x + 1, y]);
        const latSample = this.mapInstance.layerPointToLatLng([x, y + 1]);
        const lngDelta = Math.abs(lngSample.lng - event.latlng.lng);
        const latDelta = Math.abs(latSample.lat - event.latlng.lat);
        if (!isFinite(lngDelta) || !isFinite(latDelta)) return null;
        return { lng: Math.max(lngDelta, 1e-12), lat: Math.max(latDelta, 1e-12) };
    }

    private emitViewChange(): void {
        if (!this.eventBus || !this.mapInstance) return;
        const center = this.mapInstance.getCenter();
        const bounds = this.mapInstance.getBounds();
        const logicalZoom = this.mapInstance.getZoom() - ZOOM_OFFSET;
        this.eventBus.emit({
            type: 'view-change',
            center: [center.lng, center.lat],
            zoom: logicalZoom,
            bearing: 0,
            pitch: 0,
            bounds: {
                sw: [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
                ne: [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
            }
        });
    }

    private emitViewChangeEnd(): void {
        if (!this.eventBus || !this.mapInstance) return;
        const center = this.mapInstance.getCenter();
        const bounds = this.mapInstance.getBounds();
        const logicalZoom = this.mapInstance.getZoom() - ZOOM_OFFSET;
        this.eventBus.emit({
            type: 'view-change-end',
            center: [center.lng, center.lat],
            zoom: logicalZoom,
            bearing: 0,
            pitch: 0,
            bounds: {
                sw: [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
                ne: [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
            }
        });
    }

    public onMapReady(callback: (map: L.Map) => void): void {
        if (this.mapInstance) callback(this.mapInstance);
        else this.mapReadyCallbacks.push(callback);
    }

    public setZoom(level: number): void {
        if (!this.mapInstance) return;
        const clampedZoom = this.clampZoom(level);
        const currentZoom = this.mapInstance.getZoom() - ZOOM_OFFSET;
        if (currentZoom === clampedZoom && clampedZoom !== level) {
            this.scheduleViewportSync();
            return;
        }
        this.mapInstance.setZoom(Math.round(clampedZoom) + ZOOM_OFFSET);
    }



    public getZoom(): number {
        return this.mapInstance ? this.mapInstance.getZoom() - ZOOM_OFFSET : this.initialConfig.zoom;
    }

    public getNavigationCapabilities(): NavigationCapabilities {
        return { bearing: false, pitch: false };
    }

    public getBearing(): number {
        return 0;
    }

    public setBearing(_bearing: number): void {
        // Rotation not supported in default Leaflet
    }

    public getPitch(): number {
        return 0;
    }

    public setPitch(_pitch: number): void {
        // Pitch not supported in Leaflet
    }

    public resetNorth(): void {
        // No-op (already north-up)
    }

    public resetNorthPitch(): void {
        this.resetNorth();
    }

    setProjection(_projection: string | { name: string; center?: [number, number]; parallels?: [number, number] }): boolean {
        return false;
    }

    getProjection(): { name: string; center?: [number, number]; parallels?: [number, number] } | null {
        return null;
    }

    private scheduleViewportSync(): void {
        if (!this.mapInstance) return;
        requestAnimationFrame(() => {
            if (!this.mapInstance) return;
            const center = this.mapInstance.getCenter();
            const logicalZoom = this.mapInstance.getZoom() - ZOOM_OFFSET;
            const viewportBounds = this.buildViewportFeature();
            this.store.dispatch({
                mapCenter: [center.lng, center.lat],
                zoomLevel: logicalZoom,
                mapViewportBounds: viewportBounds
            }, 'MAP');
            this.emitViewChangeEnd();
        });
    }

    private clampZoom(zoom: number): number {
        let next = zoom;
        if (this.minZoom !== undefined) {
            next = Math.max(next, this.minZoom);
        }
        if (this.maxZoom !== undefined) {
            next = Math.min(next, this.maxZoom);
        }
        return next;
    }

    public addLayer(layerSpec: any, options?: { beforeLayerId?: string; afterLayerId?: string }): boolean {
        if (!this.mapInstance) return false;
    
        const sourceId = layerSpec.source;
        if (!sourceId) {
            if (layerSpec?.addTo === 'function') layerSpec.addTo(this.mapInstance);
            return false;
        }

        const sourceConfig = this.sources.get(sourceId);
        if (!sourceConfig) {
            console.warn(`[CORE SERVICE] Source "${sourceId}" not found for layer "${layerSpec.id}".`);
            return false;
        }
    
        const data = sourceConfig.data || { type: 'FeatureCollection', features: [] };
        const subLayers = Array.isArray(layerSpec.layers) ? layerSpec.layers : [layerSpec];
        const layerFactorySpecs = LeafletLayerFactory.createGeoJSONLayer(layerSpec.id ?? layerSpec.source, sourceConfig, data, subLayers);
        this.runtimeLayerZoomRange.set(layerSpec.id, this.readLayerZoomRange(layerSpec));
    
        const nativeLayers: L.Layer[] = [];
        for (const spec of layerFactorySpecs) {
            spec.layer.addTo(this.mapInstance);
            nativeLayers.push(spec.layer);
        }
    
        this.removeRuntimeLayer(layerSpec.id);
        if (!this.insertByOptions(this.runtimeLayerOrder, layerSpec.id, options)) {
            this.runtimeLayerOrder.push(layerSpec.id);
        }
        this.logicalToNative.set(layerSpec.id, nativeLayers);
        this.layerOrderRegistry?.registerInlineLayer(layerSpec.id, nativeLayers, options);
        this.applyRuntimeLayerVisibility();
    
        // Link source ID to this layer ID for future updates
        if (!this.sourceToLayers.has(sourceId)) {
            this.sourceToLayers.set(sourceId, []);
        }
        this.sourceToLayers.get(sourceId)!.push(layerSpec.id);
        return true;
    }

    public removeLayer(id: string): void {
        const nativeLayers = this.logicalToNative.get(id);
        if (nativeLayers && this.mapInstance) {
            nativeLayers.forEach(layer => this.mapInstance!.removeLayer(layer));
            this.logicalToNative.delete(id);
            this.removeRuntimeLayer(id);
            this.runtimeLayerZoomRange.delete(id);
    
            // Clean up sourceToLayers map
            for (const [sourceId, layerIds] of this.sourceToLayers.entries()) {
                const index = layerIds.indexOf(id);
                if (index > -1) {
                    layerIds.splice(index, 1);
                    if (layerIds.length === 0) {
                        this.sourceToLayers.delete(sourceId);
                    }
                    break;
                }
            }

            this.layerOrderRegistry?.unregisterInlineLayer(id);
            this.applyRuntimeLayerOrder();
        }
    }

    public addSource(id: string, config: any): void {
        this.sources.set(id, config);
        if (config?.type === 'geojson' && config.data && typeof config.data === 'object') {
            this.geoJSONData.set(id, config.data as GeoJSON.FeatureCollection);
        }
    }

    public removeSource(id: string): void {
        const layerIds = this.sourceToLayers.get(id);
        if (layerIds) {
            layerIds.forEach(layerId => this.removeLayer(layerId));
        }
        this.sources.delete(id);
        this.geoJSONData.delete(id);
    }

    private removeRuntimeLayer(layerId: string): void {
        this.runtimeLayerOrder = this.runtimeLayerOrder.filter((id) => id !== layerId);
        this.runtimeLayerZoomRange.delete(layerId);
    }

    private readLayerZoomRange(layerSpec: any): { minzoom?: number; maxzoom?: number } {
        return {
            minzoom: this.toNumericZoom(layerSpec?.minzoom ?? layerSpec?.minZoom),
            maxzoom: this.toNumericZoom(layerSpec?.maxzoom ?? layerSpec?.maxZoom),
        };
    }

    private toNumericZoom(value: unknown): number | undefined {
        return typeof value === 'number' && isFinite(value) ? value : undefined;
    }

    private isLayerVisibleAtZoom(layerId: string, zoom: number): boolean {
        const range = this.runtimeLayerZoomRange.get(layerId);
        if (!range) {
            return true;
        }

        if (range.minzoom !== undefined && zoom < range.minzoom) {
            return false;
        }

        if (range.maxzoom !== undefined && zoom >= range.maxzoom) {
            return false;
        }

        return true;
    }

    private applyRuntimeLayerVisibility(): void {
        if (!this.mapInstance) {
            return;
        }

        const logicalZoom = this.mapInstance.getZoom() - ZOOM_OFFSET;
        for (const layerId of this.runtimeLayerOrder) {
            const visible = this.isLayerVisibleAtZoom(layerId, logicalZoom);
            const nativeLayers = this.logicalToNative.get(layerId) ?? [];
            for (const layer of nativeLayers) {
                if (visible) {
                    if (!this.mapInstance.hasLayer(layer)) {
                        layer.addTo(this.mapInstance);
                    }
                } else if (this.mapInstance.hasLayer(layer)) {
                    this.mapInstance.removeLayer(layer);
                }
            }
        }

        this.applyRuntimeLayerOrder();
    }

    private insertByOptions(list: string[], layerId: string, options?: { beforeLayerId?: string; afterLayerId?: string }): boolean {
        const beforeLayerId = options?.beforeLayerId;
        if (typeof beforeLayerId === 'string') {
            const beforeIndex = list.indexOf(beforeLayerId);
            if (beforeIndex >= 0) {
                list.splice(beforeIndex, 0, layerId);
                return true;
            }
        }

        const afterLayerId = options?.afterLayerId;
        if (typeof afterLayerId === 'string') {
            const afterIndex = list.indexOf(afterLayerId);
            if (afterIndex >= 0) {
                list.splice(afterIndex + 1, 0, layerId);
                return true;
            }
        }

        return false;
    }

    private applyRuntimeLayerOrder(): void {
        if (!this.mapInstance) {
            return;
        }

        for (const layerId of this.runtimeLayerOrder) {
            const nativeLayers = this.logicalToNative.get(layerId) ?? [];
            for (const layer of nativeLayers) {
                (layer as any).bringToFront?.();
            }
        }
    }

    public getSource(id: string): ISource | undefined {
        if (!this.sources.has(id)) return undefined;
        const self = this;
        return {
            id,
            setData: (data: GeoJSON.FeatureCollection) => {
                self.geoJSONData.set(id, data);
                const layerIds = self.sourceToLayers.get(id);
                if (!layerIds) return;
                for (const layerId of layerIds) {
                    const nativeLayers = self.logicalToNative.get(layerId);
                    if (nativeLayers) {
                        nativeLayers.forEach(layer => {
                            if ('clearLayers' in layer && 'addData' in layer) {
                                (layer as L.GeoJSON).clearLayers();
                                (layer as L.GeoJSON).addData(data);
                            }
                        });
                    }
                }
            }
        };
    }
    
    public suppressBusySignalForSource(sourceId: string): void {
        this.silentSourceIds.add(sourceId);
    }

    public unsuppressBusySignalForSource(sourceId: string): void {
        this.silentSourceIds.delete(sourceId);
    }

    private dispatchViewportBoundsSnapshot(): void {
        const viewportBounds = this.buildViewportFeature();
        this.store.dispatch({ mapViewportBounds: viewportBounds }, 'MAP');
    }

    private buildViewportFeature(): GeoJSON.Feature<GeoJSON.Polygon> | null {
        if (!this.mapInstance) return null;
        const bounds = this.mapInstance.getBounds();
        if (!bounds) return null;
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const coordinates = [[sw.lng, sw.lat], [sw.lng, ne.lat], [ne.lng, ne.lat], [ne.lng, sw.lat], [sw.lng, sw.lat]];
        return {
            type: 'Feature',
            properties: { role: 'mapViewport' },
            geometry: { type: 'Polygon', coordinates: [coordinates] }
        };
    }

    private resolveContainer(containerId: string): string | HTMLElement {
        const hostElement = document.getElementById(containerId);
        if (!hostElement) return containerId;
        if (hostElement.tagName.toLowerCase() === 'webmapx-map') {
            const mapSlot = hostElement.querySelector<HTMLElement>('[slot="map-view"]');
            if (mapSlot) return mapSlot;
        }
        return hostElement;
    }

    private flushMapReadyCallbacks(): void {
        if (!this.mapInstance) return;
        this.mapReadyCallbacks.splice(0).forEach(cb => {
            try { cb(this.mapInstance!); } catch (e) { console.error('[CORE SERVICE] mapReady callback failed.', e); }
        });
    }

    private async loadStyleFromUrl(styleUrl: string): Promise<boolean> {
        if (!this.mapInstance) return false;
        try {
            const response = await fetch(styleUrl);
            if (!response.ok) return false;
            const style = await response.json();
            let layersAdded = 0;
            if (style.sources) {
                for (const [sourceId, source] of Object.entries(style.sources as Record<string, any>)) {
                    if (source.type === 'raster' && source.tiles?.length) {
                        L.tileLayer(source.tiles[0], {
                            attribution: source.attribution || '',
                            tileSize: source.tileSize || 256,
                            minZoom: source.minzoom,
                            maxNativeZoom: source.maxzoom,
                        }).addTo(this.mapInstance);
                        layersAdded++;
                    }
                }
            }
            return layersAdded > 0;
        } catch (error) {
            console.error('[CORE SERVICE] Error loading style:', error);
            return false;
        }
    }
}
