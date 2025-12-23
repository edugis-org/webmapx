// src/map/leaflet-services/MapCoreService.ts

import { IMapCore } from '../IMapInterfaces';
import { MapStateStore } from '../../store/map-state-store';
import { MapEventBus, LngLat, Pixel, PointerResolution } from '../../store/map-events';
import type { MapStyle } from '../../config/types';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
 * Thin wrapper that translates Leaflet events to generic events.
 * No throttling - consumers handle their own rate limiting.
 */
export class MapCoreService implements IMapCore {
    constructor(
        private readonly store: MapStateStore,
        private readonly eventBus?: MapEventBus
    ) {}

    private mapInstance: L.Map | null = null;
    private mapReadyCallbacks: Array<(map: L.Map) => void> = [];
    private silentSourceIds = new Set<string>();

    // Basic configuration needed for a standard map
    private readonly initialConfig = {
        center: [51.17, 10.45] as [number, number], // Leaflet uses [lat, lng]
        zoom: 4,
    };

    /**
     * Apply z-index isolation to contain Leaflet's z-index within its container.
     * This prevents Leaflet elements from appearing above tools and other UI.
     */
    private applyZIndexIsolation(container: HTMLElement): void {
        // Create a stacking context to isolate Leaflet's z-index
        container.style.isolation = 'isolate';
        container.style.zIndex = '0';
        container.style.position = 'relative';
    }

    /**
     * Inject CSS fixes for common Leaflet rendering issues.
     * - Prevents white lines between tiles
     * - Ensures proper tile rendering
     */
    private injectLeafletCSSFixes(): void {
        const styleId = 'webmapx-leaflet-fixes';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Minimal fixes for Leaflet rendering */
            .leaflet-container {
                background: #f2efe9 !important; /* Light beige - matches OSM land */
            }
            /* Hide tile gaps by matching background to tile edges */
            .leaflet-tile-pane {
                background: #f2efe9 !important;
            }
            /* Prevent white seams caused by blend mode on raster tiles */
            .leaflet-container img.leaflet-tile {
                mix-blend-mode: normal;
            }
        `;
        document.head.appendChild(style);
    }

    public getViewportState(): { center: [number, number], zoom: number, bearing: number } {
        if (this.mapInstance) {
            const center = this.mapInstance.getCenter();
            // Subtract offset to return logical zoom (MapLibre-equivalent)
            const logicalZoom = this.mapInstance.getZoom() - ZOOM_OFFSET;
            return {
                center: [center.lng, center.lat] as [number, number], // Return as [lng, lat]
                zoom: logicalZoom,
                bearing: 0 // Leaflet doesn't support bearing by default
            };
        }
        return { center: [0, 0], zoom: 1, bearing: 0 };
    }

    public setViewport(center: [number, number], zoom: number): void {
        if (this.mapInstance) {
            // center is [lng, lat], but Leaflet expects [lat, lng]
            // Round zoom and add offset since Leaflet uses 256px tiles
            const leafletZoom = Math.round(zoom) + ZOOM_OFFSET;
            this.mapInstance.flyTo([center[1], center[0]], leafletZoom);
            console.log(`[CORE SERVICE] Setting viewport to center: ${center}, zoom: ${leafletZoom} (logical: ${zoom})`);
        }
    }

    public initialize(containerId: string, options?: { center?: [number, number]; zoom?: number; styleUrl?: string; style?: MapStyle }): void {
        console.log(`[CORE SERVICE] Initializing Leaflet instance in #${containerId}`);

        // options.center is [lng, lat], but Leaflet expects [lat, lng]
        const center = options?.center
            ? [options.center[1], options.center[0]] as [number, number]
            : this.initialConfig.center;
        // Round zoom and add offset since Leaflet uses 256px tiles
        const logicalZoom = options?.zoom ?? this.initialConfig.zoom;
        const leafletZoom = Math.round(logicalZoom) + ZOOM_OFFSET;
        const containerTarget = this.resolveContainer(containerId);

        // Apply z-index isolation to the container element
        const containerElement = typeof containerTarget === 'string'
            ? document.getElementById(containerTarget)
            : containerTarget;
        if (containerElement) {
            this.applyZIndexIsolation(containerElement);
        }

        // Inject CSS fixes for tile rendering issues
        this.injectLeafletCSSFixes();

        // MAP INSTANTIATION AND STORAGE
        this.mapInstance = L.map(containerTarget, {
            center: center,
            zoom: leafletZoom,
            zoomControl: true,
        });

        this.flushMapReadyCallbacks();

        // Track whether we've added a base layer
        let hasBaseLayer = false;

        // Handle style - for Leaflet we interpret the style as tile layer config
        if (options?.style && options.style.sources) {
            // Try to add raster tile layers from the style
            for (const [sourceId, source] of Object.entries(options.style.sources)) {
                if (source.type === 'raster' && source.tiles && source.tiles.length > 0) {
                    const tileUrl = source.tiles[0];
                    L.tileLayer(tileUrl, {
                        attribution: source.attribution || '',
                        tileSize: source.tileSize || 256,
                        minZoom: source.minzoom,
                        maxZoom: source.maxzoom,
                    }).addTo(this.mapInstance);
                    hasBaseLayer = true;
                }
            }
        } else if (options?.styleUrl) {
            // Attempt to fetch and parse MapLibre style JSON to extract tile sources
            // Use async IIFE to properly handle the fallback
            (async () => {
                const loaded = await this.loadStyleFromUrl(options.styleUrl!);
                if (!loaded) {
                    // Style had no raster sources, add default OSM layer
                    this.addDefaultTileLayer();
                }
            })();
            hasBaseLayer = true; // Mark as handled (async will add layer)
        }

        // If no base layer was added synchronously, add default OSM tiles
        if (!hasBaseLayer) {
            this.addDefaultTileLayer();
        }

        // Map ready event - Leaflet fires 'load' when tiles are loaded, but map is immediately usable
        this.mapInstance.whenReady(() => {
            const viewportBounds = this.buildViewportFeature();
            // Store logical zoom, not Leaflet zoom
            this.store.dispatch({ mapLoaded: true, zoomLevel: logicalZoom, mapCenter: [center[1], center[0]], mapViewportBounds: viewportBounds }, 'MAP');
        });

        // Loading state detection - Leaflet doesn't have a built-in busy state like MapLibre
        // We track tile loading events
        this.mapInstance.on('loading', () => {
            this.store.dispatch({ mapBusy: true }, 'MAP');
        });

        this.mapInstance.on('load', () => {
            this.store.dispatch({ mapBusy: false }, 'MAP');
        });

        // Zoom end event
        this.mapInstance.on('zoomend', () => {
            // Convert Leaflet zoom to logical zoom
            const logicalZoom = this.mapInstance!.getZoom() - ZOOM_OFFSET;
            const viewportBounds = this.buildViewportFeature();
            this.store.dispatch({ zoomLevel: logicalZoom, mapViewportBounds: viewportBounds }, 'MAP');
        });

        // Move end event
        this.mapInstance.on('moveend', () => {
            const center = this.mapInstance!.getCenter();
            const currentCenter: [number, number] = [center.lng, center.lat];
            // Convert Leaflet zoom to logical zoom
            const logicalZoom = this.mapInstance!.getZoom() - ZOOM_OFFSET;
            const viewportBounds = this.buildViewportFeature();
            this.store.dispatch({ mapCenter: currentCenter, zoomLevel: logicalZoom, mapViewportBounds: viewportBounds }, 'MAP');

            // Emit view-change-end event
            this.emitViewChangeEnd();
        });

        this.mapInstance.on('move', () => {
            this.dispatchViewportBoundsSnapshot();
            this.emitViewChange();
        });

        // Pointer event handlers
        this.attachPointerEvents(this.mapInstance);
    }

    private attachPointerEvents(map: L.Map): void {
        map.on('mousemove', (event: L.LeafletMouseEvent) => {
            const coords: LngLat = [event.latlng.lng, event.latlng.lat];
            const pixel: Pixel = [event.containerPoint.x, event.containerPoint.y];
            const resolution = this.computePointerResolution(event);

            this.eventBus?.emit({
                type: 'pointer-move',
                coords,
                pixel,
                resolution,
                originalEvent: event.originalEvent
            });

            this.store.dispatch({
                pointerCoordinates: coords,
                pointerResolution: resolution,
            }, 'MAP');
        });

        map.on('mouseout', (event: L.LeafletMouseEvent) => {
            this.eventBus?.emit({
                type: 'pointer-leave',
                originalEvent: event.originalEvent
            });
            this.store.dispatch({ pointerCoordinates: null, pointerResolution: null }, 'MAP');
        });

        map.on('click', (event: L.LeafletMouseEvent) => {
            const coords: LngLat = [event.latlng.lng, event.latlng.lat];
            const pixel: Pixel = [event.containerPoint.x, event.containerPoint.y];
            const resolution = this.computePointerResolution(event);

            this.eventBus?.emit({
                type: 'click',
                coords,
                pixel,
                resolution,
                originalEvent: event.originalEvent
            });

            this.store.dispatch({
                lastClickedCoordinates: coords,
                lastClickedResolution: resolution,
                pointerCoordinates: coords,
                pointerResolution: resolution,
            }, 'MAP');
        });

        map.on('dblclick', (event: L.LeafletMouseEvent) => {
            const coords: LngLat = [event.latlng.lng, event.latlng.lat];
            const pixel: Pixel = [event.containerPoint.x, event.containerPoint.y];

            this.eventBus?.emit({
                type: 'dblclick',
                coords,
                pixel,
                originalEvent: event.originalEvent
            });
        });

        map.on('contextmenu', (event: L.LeafletMouseEvent) => {
            const coords: LngLat = [event.latlng.lng, event.latlng.lat];
            const pixel: Pixel = [event.containerPoint.x, event.containerPoint.y];

            this.eventBus?.emit({
                type: 'contextmenu',
                coords,
                pixel,
                originalEvent: event.originalEvent
            });
        });
    }

    private computePointerResolution(event: L.LeafletMouseEvent): PointerResolution | null {
        if (!this.mapInstance || !event.containerPoint) {
            return null;
        }

        const map = this.mapInstance;
        const basePoint = event.containerPoint;
        const baseLngLat = event.latlng;

        // Calculate resolution by checking a 1 pixel offset
        const lngSample = map.containerPointToLatLng([basePoint.x + 1, basePoint.y]);
        const latSample = map.containerPointToLatLng([basePoint.x, basePoint.y + 1]);

        const lngDelta = Math.abs(lngSample.lng - baseLngLat.lng);
        const latDelta = Math.abs(latSample.lat - baseLngLat.lat);

        if (!isFinite(lngDelta) || !isFinite(latDelta)) {
            return null;
        }

        return {
            lng: Math.max(lngDelta, 1e-12),
            lat: Math.max(latDelta, 1e-12),
        };
    }

    /**
     * Emit a view-change event (during movement).
     */
    private emitViewChange(): void {
        if (!this.eventBus || !this.mapInstance) return;

        const center = this.mapInstance.getCenter();
        const bounds = this.mapInstance.getBounds();
        // Report logical zoom (subtract offset)
        const logicalZoom = this.mapInstance.getZoom() - ZOOM_OFFSET;

        this.eventBus.emit({
            type: 'view-change',
            center: [center.lng, center.lat] as LngLat,
            zoom: logicalZoom,
            bearing: 0, // Leaflet doesn't support bearing
            pitch: 0, // Leaflet doesn't support pitch
            bounds: {
                sw: [bounds.getSouthWest().lng, bounds.getSouthWest().lat] as LngLat,
                ne: [bounds.getNorthEast().lng, bounds.getNorthEast().lat] as LngLat,
            }
        });
    }

    /**
     * Emit a view-change-end event (after movement completes).
     */
    private emitViewChangeEnd(): void {
        if (!this.eventBus || !this.mapInstance) return;

        const center = this.mapInstance.getCenter();
        const bounds = this.mapInstance.getBounds();
        // Report logical zoom (subtract offset)
        const logicalZoom = this.mapInstance.getZoom() - ZOOM_OFFSET;

        this.eventBus.emit({
            type: 'view-change-end',
            center: [center.lng, center.lat] as LngLat,
            zoom: logicalZoom,
            bearing: 0,
            pitch: 0,
            bounds: {
                sw: [bounds.getSouthWest().lng, bounds.getSouthWest().lat] as LngLat,
                ne: [bounds.getNorthEast().lng, bounds.getNorthEast().lat] as LngLat,
            }
        });
    }

    public onMapReady(callback: (map: L.Map) => void): void {
        if (this.mapInstance) {
            callback(this.mapInstance);
            return;
        }
        this.mapReadyCallbacks.push(callback);
    }

    // Library-agnostic zoom controls
    public setZoom(level: number): void {
        if (this.mapInstance) {
            // Round zoom and add offset since Leaflet uses 256px tiles
            const leafletZoom = Math.round(level) + ZOOM_OFFSET;
            this.mapInstance.setZoom(leafletZoom);
        }
    }

    public onZoomEnd(callback: (level: number) => void): void {
        if (this.mapInstance) {
            this.mapInstance.on('zoomend', () => {
                // Return logical zoom (subtract offset)
                callback(this.mapInstance!.getZoom() - ZOOM_OFFSET);
            });
        }
    }

    public getZoom(): number {
        // Return logical zoom (subtract offset)
        return this.mapInstance ? this.mapInstance.getZoom() - ZOOM_OFFSET : this.initialConfig.zoom;
    }

    public addLayer(layer: any): void {
        if (this.mapInstance && layer && typeof layer.addTo === 'function') {
            layer.addTo(this.mapInstance);
        }
    }

    public removeLayer(id: string): void {
        // Leaflet doesn't have getLayer by id - layers must be tracked externally
        // This is handled by MapLayerService
        console.log(`[CORE SERVICE] removeLayer called for ${id} - handled by LayerService`);
    }

    public addSource(id: string, config: any): void {
        // Leaflet doesn't have a separate source concept like MapLibre
        // Sources are part of layers - handled by MapLayerService
        console.log(`[CORE SERVICE] addSource called for ${id} - handled by LayerService`);
    }

    public removeSource(id: string): void {
        // Leaflet doesn't have a separate source concept
        console.log(`[CORE SERVICE] removeSource called for ${id} - handled by LayerService`);
    }

    public getSource(id: string) {
        // Leaflet doesn't have a separate source concept
        return undefined;
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
        if (!this.mapInstance) {
            return null;
        }

        const bounds = this.mapInstance.getBounds();
        if (!bounds) {
            return null;
        }

        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const coordinates: [number, number][] = [
            [sw.lng, sw.lat],
            [sw.lng, ne.lat],
            [ne.lng, ne.lat],
            [ne.lng, sw.lat],
            [sw.lng, sw.lat],
        ];

        return {
            type: 'Feature',
            properties: { role: 'mapViewport' },
            geometry: {
                type: 'Polygon',
                coordinates: [coordinates],
            },
        };
    }

    private resolveContainer(containerId: string): string | HTMLElement {
        const hostElement = document.getElementById(containerId);

        if (!hostElement) {
            console.warn(`[CORE SERVICE] Container #${containerId} not found. Falling back to ID.`);
            return containerId;
        }

        if (hostElement.tagName.toLowerCase() === 'webmapx-map') {
            const mapSlot = hostElement.querySelector<HTMLElement>('[slot="map-view"]');

            if (mapSlot) {
                return mapSlot;
            }

            console.warn('[CORE SERVICE] <webmapx-map> is missing a [slot="map-view"] element. Using host as fallback.');
        }

        return hostElement;
    }

    private flushMapReadyCallbacks(): void {
        if (!this.mapInstance) {
            return;
        }

        const pending = this.mapReadyCallbacks.splice(0);
        pending.forEach(callback => {
            try {
                callback(this.mapInstance!);
            } catch (error) {
                console.error('[CORE SERVICE] mapReady callback failed.', error);
            }
        });
    }

    /**
     * Add a default OpenStreetMap tile layer.
     */
    private addDefaultTileLayer(): void {
        if (!this.mapInstance) return;

        L.tileLayer(DEFAULT_TILE_URL, {
            attribution: DEFAULT_ATTRIBUTION,
            maxZoom: 19,
        }).addTo(this.mapInstance);

        console.log('[CORE SERVICE] Added default OSM tile layer');
    }

    /**
     * Attempt to load a MapLibre/Mapbox style JSON and extract tile sources.
     * Returns true if at least one tile layer was added.
     */
    private async loadStyleFromUrl(styleUrl: string): Promise<boolean> {
        if (!this.mapInstance) return false;

        try {
            console.log(`[CORE SERVICE] Fetching style from ${styleUrl}`);
            const response = await fetch(styleUrl);

            if (!response.ok) {
                console.warn(`[CORE SERVICE] Failed to fetch style: ${response.status}`);
                return false;
            }

            const style = await response.json();
            let layersAdded = 0;

            // Extract raster sources from the style
            if (style.sources) {
                for (const [sourceId, source] of Object.entries(style.sources as Record<string, any>)) {
                    if (source.type === 'raster' && source.tiles && source.tiles.length > 0) {
                        const tileUrl = source.tiles[0];
                        L.tileLayer(tileUrl, {
                            attribution: source.attribution || '',
                            tileSize: source.tileSize || 256,
                            minZoom: source.minzoom,
                            maxZoom: source.maxzoom,
                        }).addTo(this.mapInstance);
                        layersAdded++;
                        console.log(`[CORE SERVICE] Added raster source "${sourceId}" from style`);
                    } else if (source.type === 'raster-dem') {
                        // Skip DEM sources - Leaflet doesn't support them
                        console.log(`[CORE SERVICE] Skipping raster-dem source "${sourceId}"`);
                    } else if (source.type === 'vector') {
                        // Skip vector sources - would need mapbox-gl-leaflet or similar
                        console.log(`[CORE SERVICE] Skipping vector source "${sourceId}" (not supported in Leaflet)`);
                    }
                }
            }

            // If no raster sources found, check for background layer with background-color
            if (layersAdded === 0 && style.layers) {
                const bgLayer = style.layers.find((l: any) => l.type === 'background');
                if (bgLayer?.paint?.['background-color']) {
                    // We can't easily add a color background in Leaflet,
                    // but the container already has a background color set
                    console.log('[CORE SERVICE] Style has background layer but no tile sources');
                }
            }

            return layersAdded > 0;
        } catch (error) {
            console.error('[CORE SERVICE] Error loading style:', error);
            return false;
        }
    }
}
