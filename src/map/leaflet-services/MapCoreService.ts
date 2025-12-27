// src/map/leaflet-services/MapCoreService.ts

import { IMapCore, ISource } from '../IMapInterfaces';
import { MapStateStore } from '../../store/map-state-store';
import { MapEventBus, LngLat, Pixel, PointerResolution } from '../../store/map-events';
import type { MapStyle } from '../../config/types';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LeafletLayerFactory } from './LeafletLayerFactory';

// Default OSM tile layer as fallback
const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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

    private mapInstance: L.Map | null = null;
    private mapReadyCallbacks: Array<(map: L.Map) => void> = [];
    private silentSourceIds = new Set<string>();

    // State for dynamic sources and layers
    private sources: Map<string, any> = new Map();
    private logicalToNative: Map<string, L.Layer[]> = new Map();
    private sourceToLayers: Map<string, string[]> = new Map();

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

    public getViewportState(): { center: [number, number], zoom: number, bearing: number } {
        if (this.mapInstance) {
            const center = this.mapInstance.getCenter();
            const logicalZoom = this.mapInstance.getZoom() - ZOOM_OFFSET;
            return {
                center: [center.lng, center.lat],
                zoom: logicalZoom,
                bearing: 0
            };
        }
        return { center: [0, 0], zoom: 1, bearing: 0 };
    }

    public setViewport(center: [number, number], zoom: number): void {
        if (this.mapInstance) {
            const leafletZoom = Math.round(zoom) + ZOOM_OFFSET;
            this.mapInstance.flyTo([center[1], center[0]], leafletZoom);
        }
    }

    public initialize(containerId: string, options?: { center?: [number, number]; zoom?: number; styleUrl?: string; style?: MapStyle }): void {
        const center = options?.center ? [options.center[1], options.center[0]] as [number, number] : this.initialConfig.center;
        const logicalZoom = options?.zoom ?? this.initialConfig.zoom;
        const leafletZoom = Math.round(logicalZoom) + ZOOM_OFFSET;
        const containerTarget = this.resolveContainer(containerId);

        if (containerTarget instanceof HTMLElement) {
            this.applyZIndexIsolation(containerTarget);
        }
        this.injectLeafletCSSFixes();

        this.mapInstance = L.map(containerTarget, {
            center: center,
            zoom: leafletZoom,
            zoomControl: true,
        });

        this.flushMapReadyCallbacks();
        this.setupBaseLayers(options);
        this.setupMapEvents(this.mapInstance, logicalZoom, center);
    }

    private setupBaseLayers(options?: { styleUrl?: string; style?: MapStyle }): void {
        let hasBaseLayer = false;
        if (options?.style?.sources) {
            for (const source of Object.values(options.style.sources)) {
                if (source.type === 'raster' && source.tiles?.length) {
                    L.tileLayer(source.tiles[0], {
                        attribution: source.attribution || '',
                        tileSize: source.tileSize || 256,
                        minZoom: source.minzoom,
                        maxZoom: source.maxzoom,
                    }).addTo(this.mapInstance!);
                    hasBaseLayer = true;
                }
            }
        } else if (options?.styleUrl) {
            (async () => {
                const loaded = await this.loadStyleFromUrl(options.styleUrl!);
                if (!loaded) this.addDefaultTileLayer();
            })();
            hasBaseLayer = true;
        }

        if (!hasBaseLayer) {
            this.addDefaultTileLayer();
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
            this.store.dispatch({ zoomLevel: logicalZoom, mapViewportBounds: this.buildViewportFeature() }, 'MAP');
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
        const pixel = this.mapInstance.latLngToLayerPoint(latLng);
        return [pixel.x, pixel.y];
    }

    public fitBounds(bbox: [number, number, number, number]): void {
        if (!this.mapInstance) return;
        // Leaflet expects [[south, west], [north, east]] in lat/lng order
        const southWest = L.latLng(bbox[1], bbox[0]);
        const northEast = L.latLng(bbox[3], bbox[2]);
        const bounds = L.latLngBounds(southWest, northEast);
        this.mapInstance.fitBounds(bounds, { padding: [40, 40], animate: true });
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
        this.mapInstance?.setZoom(Math.round(level) + ZOOM_OFFSET);
    }

    public onZoomEnd(callback: (level: number) => void): void {
        this.mapInstance?.on('zoomend', () => callback(this.mapInstance!.getZoom() - ZOOM_OFFSET));
    }

    public getZoom(): number {
        return this.mapInstance ? this.mapInstance.getZoom() - ZOOM_OFFSET : this.initialConfig.zoom;
    }

    public addLayer(layerSpec: any): void {
        if (!this.mapInstance) return;
    
        const sourceId = layerSpec.source;
        if (!sourceId) {
            if (layerSpec?.addTo === 'function') layerSpec.addTo(this.mapInstance);
            return;
        }
    
        const sourceConfig = this.sources.get(sourceId);
        if (!sourceConfig) {
            console.warn(`[CORE SERVICE] Source "${sourceId}" not found for layer "${layerSpec.id}".`);
            return;
        }
    
        const data = sourceConfig.data || { type: 'FeatureCollection', features: [] };
        const layerFactorySpecs = LeafletLayerFactory.createGeoJSONLayer(layerSpec, sourceConfig, data);
    
        const nativeLayers: L.Layer[] = [];
        for (const spec of layerFactorySpecs) {
            spec.layer.addTo(this.mapInstance);
            nativeLayers.push(spec.layer);
        }
    
        this.logicalToNative.set(layerSpec.id, nativeLayers);
    
        // Link source ID to this layer ID for future updates
        if (!this.sourceToLayers.has(sourceId)) {
            this.sourceToLayers.set(sourceId, []);
        }
        this.sourceToLayers.get(sourceId)!.push(layerSpec.id);
    }

    public removeLayer(id: string): void {
        const nativeLayers = this.logicalToNative.get(id);
        if (nativeLayers && this.mapInstance) {
            nativeLayers.forEach(layer => this.mapInstance!.removeLayer(layer));
            this.logicalToNative.delete(id);
    
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
        }
    }

    public addSource(id: string, config: any): void {
        this.sources.set(id, config);
    }

    public removeSource(id: string): void {
        const layerIds = this.sourceToLayers.get(id);
        if (layerIds) {
            layerIds.forEach(layerId => this.removeLayer(layerId));
        }
        this.sources.delete(id);
    }

    public getSource(id: string): ISource | undefined {
        if (!this.sources.has(id)) return undefined;

        return {
            id: id,
            setData: (data: GeoJSON.FeatureCollection) => {
                const layerIds = this.sourceToLayers.get(id);
                if (!layerIds) return;

                for (const layerId of layerIds) {
                    const nativeLayers = this.logicalToNative.get(layerId);
                    if (nativeLayers) {
                        nativeLayers.forEach(layer => {
                            // Assumes it's a GeoJSON layer
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

    private addDefaultTileLayer(): void {
        if (!this.mapInstance) return;
        L.tileLayer(DEFAULT_TILE_URL, { attribution: DEFAULT_ATTRIBUTION, maxZoom: 19 }).addTo(this.mapInstance);
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
                            maxZoom: source.maxzoom,
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
