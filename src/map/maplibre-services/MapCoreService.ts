// src/map/maplibre-services/MapCoreService.ts

import { IMapCore } from '../IMapInterfaces';
import { MapStateStore } from '../../store/map-state-store';
import { MapEventBus, LngLat, Pixel, PointerResolution } from '../../store/map-events';
import type { MapStyle } from '../../config/types';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * Implements the core map contract (IMapCore) for the MapLibre engine.
 * Thin wrapper that translates MapLibre events to generic events.
 * No throttling - consumers handle their own rate limiting.
 */
export class MapCoreService implements IMapCore {
    constructor(
        private readonly store: MapStateStore,
        private readonly eventBus?: MapEventBus
    ) {}

    private mapInstance: maplibregl.Map | null = null;
    private mapReadyCallbacks: Array<(map: maplibregl.Map) => void> = [];

    // Basic configuration needed for a standard map
    private readonly initialConfig = {
        center: [10.45, 51.17] as [number, number], // Initial coordinates (e.g., Central Europe)
        zoom: 4, 
        pitch: 0,
        bearing: 0,
        style: { // Minimal style definition (empty, or a standard basemap)
            version: 8 as const,
            sources: {},
            layers: [] as maplibregl.LayerSpecification[], // AT LEAST AN EMPTY LAYER SET
        }
    };

    // The explicit return type of the tuple [number, number] is retained here
    public getViewportState(): { center: [number, number], zoom: number, bearing: number } { 
        // Return real map values if initialized, otherwise fall back to defaults
        if (this.mapInstance) {
            return { 
                center: this.mapInstance.getCenter().toArray() as [number, number], 
                zoom: this.mapInstance.getZoom(), 
                bearing: this.mapInstance.getBearing()
            };
        }
        return { center: [0, 0], zoom: 1, bearing: 0 }; 
    }
    
    public setViewport(center: [number, number], zoom: number): void {
        if (this.mapInstance) {
            this.mapInstance.flyTo({ center, zoom });
            console.log(`[CORE SERVICE] Setting viewport to center: ${center}, zoom: ${zoom}`);
        }
    }

    public initialize(containerId: string, options?: { center?: [number, number]; zoom?: number; styleUrl?: string; style?: MapStyle }): void {
        console.log(`[CORE SERVICE] Initializing MapLibre instance in #${containerId}`);

        const center = options?.center ?? this.initialConfig.center;
        const zoom = options?.zoom ?? this.initialConfig.zoom;
        const containerTarget = this.resolveContainer(containerId);

        // MAP INSTANTIATION AND STORAGE
        this.mapInstance = new maplibregl.Map({ // Instantiate using maplibregl.Map
            container: containerTarget,
            center,
            zoom,
            pitch: this.initialConfig.pitch,
            bearing: this.initialConfig.bearing
        });

        this.flushMapReadyCallbacks();

        // Determine which style to use (inline style takes precedence)
        if (options?.style) {
            // Convert MapStyle to MapLibre style spec (add version if missing)
            const maplibreStyle: maplibregl.StyleSpecification = {
                version: 8,
                sources: (options.style.sources || {}) as { [_: string]: maplibregl.SourceSpecification },
                layers: (options.style.layers || []) as maplibregl.LayerSpecification[],
                ...(options.style.glyphs && { glyphs: options.style.glyphs }),
                ...(options.style.sprite && { sprite: options.style.sprite }),
                ...(options.style.name && { name: options.style.name })
            };
            this.mapInstance.setStyle(maplibreStyle);
        } else if (options?.styleUrl) {
            this.mapInstance.setStyle(options.styleUrl);
        } else {
            // Empty map - no background layers
            this.mapInstance.setStyle(this.initialConfig.style);
        }

        this.mapInstance.on('load', () => {
            const viewportBounds = this.buildViewportFeature();
            this.store.dispatch({ mapLoaded: true, zoomLevel: zoom, mapCenter: center, mapViewportBounds: viewportBounds }, 'MAP');
        });

        // Loading state detection
        this.mapInstance.on('dataloading', () => {
            this.store.dispatch({ mapBusy: true }, 'MAP');
        });

        this.mapInstance.on('idle', () => {
            this.store.dispatch({ mapBusy: false }, 'MAP');
        });

        // Default internal subscription updates the map state store
        this.mapInstance.on('zoomend', () => {
             const currentZoom = this.mapInstance!.getZoom();
             const viewportBounds = this.buildViewportFeature();
             this.store.dispatch({ zoomLevel: currentZoom, mapViewportBounds: viewportBounds }, 'MAP');
        });

        this.mapInstance.on('moveend', () => {
            const currentCenter = this.mapInstance!.getCenter().toArray() as [number, number];
            const currentZoom = this.mapInstance!.getZoom();
            const viewportBounds = this.buildViewportFeature();
            this.store.dispatch({ mapCenter: currentCenter, zoomLevel: currentZoom, mapViewportBounds: viewportBounds }, 'MAP');

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

    private attachPointerEvents(map: maplibregl.Map): void {
        map.on('mousemove', (event: maplibregl.MapMouseEvent) => {
            const coords: LngLat = [event.lngLat.lng, event.lngLat.lat];
            const pixel: Pixel = [event.point.x, event.point.y];
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

        map.on('mouseout', (event: maplibregl.MapMouseEvent) => {
            this.eventBus?.emit({
                type: 'pointer-leave',
                originalEvent: event.originalEvent
            });
            this.store.dispatch({ pointerCoordinates: null, pointerResolution: null }, 'MAP');
        });

        map.on('click', (event: maplibregl.MapMouseEvent) => {
            const coords: LngLat = [event.lngLat.lng, event.lngLat.lat];
            const pixel: Pixel = [event.point.x, event.point.y];
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

        map.on('dblclick', (event: maplibregl.MapMouseEvent) => {
            const coords: LngLat = [event.lngLat.lng, event.lngLat.lat];
            const pixel: Pixel = [event.point.x, event.point.y];

            this.eventBus?.emit({
                type: 'dblclick',
                coords,
                pixel,
                originalEvent: event.originalEvent
            });
        });

        map.on('contextmenu', (event: maplibregl.MapMouseEvent) => {
            const coords: LngLat = [event.lngLat.lng, event.lngLat.lat];
            const pixel: Pixel = [event.point.x, event.point.y];

            this.eventBus?.emit({
                type: 'contextmenu',
                coords,
                pixel,
                originalEvent: event.originalEvent
            });
        });
    }

    private computePointerResolution(event: maplibregl.MapMouseEvent): PointerResolution | null {
        if (!this.mapInstance || !event.point) {
            return null;
        }

        const map = this.mapInstance;
        const basePoint = event.point;
        const baseLngLat = event.lngLat;

        const lngSample = map.unproject([basePoint.x + 1, basePoint.y]);
        const latSample = map.unproject([basePoint.x, basePoint.y + 1]);

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

        this.eventBus.emit({
            type: 'view-change',
            center: [center.lng, center.lat] as LngLat,
            zoom: this.mapInstance.getZoom(),
            bearing: this.mapInstance.getBearing(),
            pitch: this.mapInstance.getPitch(),
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

        this.eventBus.emit({
            type: 'view-change-end',
            center: [center.lng, center.lat] as LngLat,
            zoom: this.mapInstance.getZoom(),
            bearing: this.mapInstance.getBearing(),
            pitch: this.mapInstance.getPitch(),
            bounds: {
                sw: [bounds.getSouthWest().lng, bounds.getSouthWest().lat] as LngLat,
                ne: [bounds.getNorthEast().lng, bounds.getNorthEast().lat] as LngLat,
            }
        });
    }

    public onMapReady(callback: (map: maplibregl.Map) => void): void {
        if (this.mapInstance) {
            callback(this.mapInstance);
            return;
        }
        this.mapReadyCallbacks.push(callback);
    }

    // Library-agnostic zoom controls
    public setZoom(level: number): void {
        if (this.mapInstance) {
            this.mapInstance.setZoom(level);
        }
    }

    public onZoomEnd(callback: (level: number) => void): void {
        if (this.mapInstance) {
            this.mapInstance.on('zoomend', () => {
                callback(this.mapInstance!.getZoom());
            });
        }
    }

    public getZoom(): number {
        return this.mapInstance ? this.mapInstance.getZoom() : this.initialConfig.zoom;
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
}