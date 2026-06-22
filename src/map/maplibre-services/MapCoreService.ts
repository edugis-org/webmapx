// src/map/maplibre-services/MapCoreService.ts

import { IMapCore, ISource, NavigationCapabilities } from '../IMapInterfaces';
import { MapStateStore } from '../../store/map-state-store';
import { MapEventBus, LngLat, Pixel, PointerResolution } from '../../store/map-events';
import type { MapStyle } from '../../config/types';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Type guard to check for the sourceId property on MapDataEvent
interface MapDataEventWithSource extends maplibregl.MapDataEvent {
    sourceId?: string;
}

function eventHasSourceId(event: maplibregl.MapDataEvent): event is MapDataEventWithSource {
    return 'sourceId' in event;
}

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
    private lastContainerId: string | null = null;
    private lastInitOptions: Parameters<MapCoreService['initialize']>[1] = undefined;
    private silentSourceIds = new Set<string>();
    private geoJSONData = new Map<string, GeoJSON.FeatureCollection>();
    private moveRafPending = false;
    private isMoving = false;

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
    public getViewportState(): { center: [number, number], zoom: number, bearing: number, pitch: number } { 
        // Return real map values if initialized, otherwise fall back to defaults
        if (this.mapInstance) {
            return { 
                center: this.mapInstance.getCenter().toArray() as [number, number], 
                zoom: this.mapInstance.getZoom(), 
                bearing: this.mapInstance.getBearing(),
                pitch: this.mapInstance.getPitch()
            };
        }
        return { center: [0, 0], zoom: 1, bearing: 0, pitch: 0 }; 
    }
    
    public setViewport(center: [number, number], zoom: number): void {
        if (this.mapInstance) {
            this.mapInstance.flyTo({ center, zoom });
        }
    }

    public initialize(containerId: string, options?: { center?: [number, number]; zoom?: number; bearing?: number; pitch?: number; minZoom?: number; maxZoom?: number; minPitch?: number; maxPitch?: number; styleUrl?: string; style?: MapStyle; projection?: string }): void {
        console.log(`[CORE SERVICE] Initializing MapLibre instance in #${containerId}`);
        this.lastContainerId = containerId;
        this.lastInitOptions = options;

        const center = options?.center ?? this.initialConfig.center;
        const zoom = options?.zoom ?? this.initialConfig.zoom;
        const containerTarget = this.resolveContainer(containerId);

        // Determine which style to use (inline style takes precedence)
        const projectionSpec = options?.projection ? { projection: { type: options.projection as 'mercator' | 'globe' } } : {};

        let constructorStyle: maplibregl.StyleSpecification | string | undefined;
        if (options?.style) {
            // Build inline style spec — include projection so it applies during initial renderer setup
            // (v4 only processes projection on the first style load, not via style diff)
            constructorStyle = {
                version: 8,
                sources: (options.style.sources || {}) as { [_: string]: maplibregl.SourceSpecification },
                layers: (options.style.layers || []) as maplibregl.LayerSpecification[],
                ...(options.style.glyphs && { glyphs: options.style.glyphs }),
                ...(options.style.sprite && { sprite: options.style.sprite }),
                ...(options.style.name && { name: options.style.name }),
                ...projectionSpec
            };
        } else if (options?.styleUrl) {
            constructorStyle = options.styleUrl;
        } else {
            constructorStyle = { ...this.initialConfig.style, ...projectionSpec } as any;
        }

        // MAP INSTANTIATION AND STORAGE
        this.mapInstance = new maplibregl.Map({
            container: containerTarget,
            center,
            zoom,
            minZoom: options?.minZoom,
            maxZoom: options?.maxZoom,
            minPitch: options?.minPitch,
            maxPitch: options?.maxPitch,
            pitch: options?.pitch ?? this.initialConfig.pitch,
            bearing: options?.bearing ?? this.initialConfig.bearing,
            attributionControl: false,
            style: constructorStyle
        });

        this.flushMapReadyCallbacks();

        // Remove canvas container from tab order; keyboard zoom/pan works via map click-to-focus
        const canvasContainer = this.mapInstance.getCanvasContainer();
        if (canvasContainer) canvasContainer.tabIndex = -1;

        this.mapInstance.on('load', () => {
            const viewportBounds = this.buildViewportFeature();
            this.store.dispatch({ mapLoaded: true, zoomLevel: zoom, mapCenter: center, mapViewportBounds: viewportBounds }, 'MAP');
            this.applyGlobeFog();
        });

        // Loading state detection
        this.mapInstance.on('dataloading', (e) => {
            if (eventHasSourceId(e) && e.sourceId && this.silentSourceIds.has(e.sourceId)) {
                return;
            }
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
             this.eventBus?.emit({ type: 'zoom-end', zoom: currentZoom });
        });

        this.mapInstance.on('movestart', () => {
            this.isMoving = true;
        });

        this.mapInstance.on('moveend', () => {
            this.isMoving = false;
            const currentCenter = this.mapInstance!.getCenter().toArray() as [number, number];
            const currentZoom = this.mapInstance!.getZoom();
            const viewportBounds = this.buildViewportFeature();
            this.store.dispatch({ mapCenter: currentCenter, zoomLevel: currentZoom, mapViewportBounds: viewportBounds }, 'MAP');

            // Emit view-change-end event
            this.emitViewChangeEnd();
        });

        this.mapInstance.on('move', () => {
            if (this.moveRafPending) return;
            this.moveRafPending = true;
            requestAnimationFrame(() => {
                this.moveRafPending = false;
                this.emitViewChange();
            });
        });

        // Pointer event handlers
        this.attachPointerEvents(this.mapInstance);
    }

    private attachPointerEvents(map: maplibregl.Map): void {
        map.on('mousemove', (event: maplibregl.MapMouseEvent) => {
            if (this.isMoving) return;
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

        map.on('mousedown', (event: maplibregl.MapMouseEvent) => {
            const coords: LngLat = [event.lngLat.lng, event.lngLat.lat];
            const pixel: Pixel = [event.point.x, event.point.y];
            this.eventBus?.emit({ type: 'pointer-down', coords, pixel, button: event.originalEvent.button, originalEvent: event.originalEvent });
        });

        map.on('mouseup', (event: maplibregl.MapMouseEvent) => {
            const coords: LngLat = [event.lngLat.lng, event.lngLat.lat];
            const pixel: Pixel = [event.point.x, event.point.y];
            this.eventBus?.emit({ type: 'pointer-up', coords, pixel, button: event.originalEvent.button, originalEvent: event.originalEvent });
        });

        // Touch support: mousedown/mouseup only fire for mouse; use canvas pointer events for touch
        const canvas = map.getCanvas();
        canvas.addEventListener('pointerdown', (event: PointerEvent) => {
            if (event.pointerType === 'mouse') return; // already handled by mousedown
            const rect = canvas.getBoundingClientRect();
            const pixel: Pixel = [event.clientX - rect.left, event.clientY - rect.top];
            const lngLat = map.unproject(pixel as maplibregl.PointLike);
            const coords: LngLat = [lngLat.lng, lngLat.lat];
            this.eventBus?.emit({ type: 'pointer-down', coords, pixel, button: 0, originalEvent: event });
        });

        canvas.addEventListener('pointermove', (event: PointerEvent) => {
            if (event.pointerType === 'mouse') return;
            const rect = canvas.getBoundingClientRect();
            const pixel: Pixel = [event.clientX - rect.left, event.clientY - rect.top];
            const lngLat = map.unproject(pixel as maplibregl.PointLike);
            const coords: LngLat = [lngLat.lng, lngLat.lat];
            this.eventBus?.emit({ type: 'pointer-move', coords, pixel, resolution: null, originalEvent: event });
        });

        canvas.addEventListener('pointerup', (event: PointerEvent) => {
            if (event.pointerType === 'mouse') return;
            const rect = canvas.getBoundingClientRect();
            const pixel: Pixel = [event.clientX - rect.left, event.clientY - rect.top];
            const lngLat = map.unproject(pixel as maplibregl.PointLike);
            const coords: LngLat = [lngLat.lng, lngLat.lat];
            this.eventBus?.emit({ type: 'pointer-up', coords, pixel, button: 0, originalEvent: event });
        });

        canvas.addEventListener('pointercancel', () => {
            this.eventBus?.emit({ type: 'pointer-cancel' });
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
        if (!this.mapInstance || !event.point || this.isMoving) {
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



    public getZoom(): number {
        return this.mapInstance ? this.mapInstance.getZoom() : this.initialConfig.zoom;
    }

    public addLayer(layer: any, options?: { beforeLayerId?: string; afterLayerId?: string }): boolean {
        if (!this.mapInstance) return false;
        if (layer?.id && this.mapInstance.getLayer(layer.id)) return false;

        if (options?.beforeLayerId) {
            this.mapInstance.addLayer(layer, options.beforeLayerId);
            return true;
        }

        if (options?.afterLayerId) {
            const style = this.mapInstance.getStyle();
            const layers = Array.isArray(style?.layers) ? style.layers : [];
            const afterIndex = layers.findIndex((entry: any) => entry?.id === options.afterLayerId);
            const beforeLayerId = afterIndex >= 0 && afterIndex + 1 < layers.length
                ? layers[afterIndex + 1]?.id
                : undefined;
            this.mapInstance.addLayer(layer, beforeLayerId);
            return true;
        }

        this.mapInstance.addLayer(layer);
        return true;
    }

    public removeLayer(id: string): void {
        if (!this.mapInstance?.getLayer(id)) return;
        this.mapInstance.removeLayer(id);
    }

    private static readonly TERRAIN_SOURCE_ID = 'webmapx-terrain-dem';
    private static readonly TERRAIN_HILLSHADE_LAYER_ID = 'webmapx-terrain-hillshade';
    private static readonly TERRAIN_SOURCE_CONFIG = {
        type: 'raster-dem',
        tiles: [
            'https://t1.edugis.nl/mapproxy/nextzenelevation/wmts/nextzenelevation/webmercator/{z}/{x}/{y}.png',
            'https://t2.edugis.nl/mapproxy/nextzenelevation/wmts/nextzenelevation/webmercator/{z}/{x}/{y}.png',
            'https://t3.edugis.nl/mapproxy/nextzenelevation/wmts/nextzenelevation/webmercator/{z}/{x}/{y}.png',
            'https://t4.edugis.nl/mapproxy/nextzenelevation/wmts/nextzenelevation/webmercator/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        encoding: 'terrarium',
        maxzoom: 15,
        attribution: 'NextZen',
    };

    public setTerrainEnabled(enabled: boolean, sourceConfig?: any, nativeSourceId?: string): boolean {
        if (!this.mapInstance) return false;
        // Raster-dem terrain combined with the globe projection (or DEM tiles
        // requested past their maxzoom) crashes maplibre's render loop with
        // "out of range source coordinates for DEM data". Only allow terrain
        // in mercator projection.
        if (enabled && (this.mapInstance as any).getProjection?.()?.type === 'globe') {
            return false;
        }
        try {
            if (enabled) {
                const terrainSrcId = nativeSourceId ?? MapCoreService.TERRAIN_SOURCE_ID;
                if (!this.mapInstance.getSource(terrainSrcId)) {
                    this.mapInstance.addSource(terrainSrcId, (sourceConfig ?? MapCoreService.TERRAIN_SOURCE_CONFIG) as any);
                }
                this.mapInstance.setTerrain({ source: terrainSrcId, exaggeration: 1 });
                // Only add a raw hillshade layer when no proper addLayer-managed one exists.
                if (!nativeSourceId && !this.mapInstance.getLayer(MapCoreService.TERRAIN_HILLSHADE_LAYER_ID)) {
                    this.mapInstance.addLayer({
                        id: MapCoreService.TERRAIN_HILLSHADE_LAYER_ID,
                        type: 'hillshade',
                        source: MapCoreService.TERRAIN_SOURCE_ID,
                        paint: { 'hillshade-exaggeration': 0.2 },
                    } as any);
                }
            } else {
                this.mapInstance.setTerrain(null as any);
                if (this.mapInstance.getLayer(MapCoreService.TERRAIN_HILLSHADE_LAYER_ID)) {
                    this.mapInstance.removeLayer(MapCoreService.TERRAIN_HILLSHADE_LAYER_ID);
                }
            }
        } catch (e) {
            console.error('[MapLibre] setTerrain failed', e);
            this.mapInstance.setTerrain(null as any);
            return false;
        }
        return true;
    }

    public isTerrainEnabled(): boolean | null {
        if (!this.mapInstance) return null;
        return !!this.mapInstance.getTerrain();
    }

    public addSource(id: string, config: any): void {
        this.mapInstance?.addSource(id, config);
        if (config?.type === 'geojson' && config.data && typeof config.data === 'object') {
            this.geoJSONData.set(id, config.data as GeoJSON.FeatureCollection);
        }
    }

    public removeSource(id: string): void {
        if (this.mapInstance?.getSource(id)) {
            this.mapInstance.removeSource(id);
        }
        this.geoJSONData.delete(id);
    }

    public getSource(id: string): ISource | undefined {
        const nativeSource = this.mapInstance?.getSource(id) as any;
        if (!nativeSource) return undefined;
        const self = this;
        return {
            id,
            setData: (data: GeoJSON.FeatureCollection) => {
                nativeSource.setData(data);
                self.geoJSONData.set(id, data);
            }
        };
    }

    public project(coords: LngLat): Pixel {
        if (!this.mapInstance) {
            console.warn('[CORE SERVICE - MapLibre] project called before map instance is ready.');
            return [0, 0];
        }
        // With terrain enabled, project() queries DEM elevation and throws
        // RangeError if the relevant DEM tile isn't loaded yet for these coords.
        try {
            const point = this.mapInstance.project(coords); // MapLibre's project method takes LngLat directly
            return [point.x, point.y];
        } catch (e) {
            return [0, 0];
        }
    }

    public unproject(pixel: Pixel): LngLat | null {
        if (!this.mapInstance) {
            console.warn('[CORE SERVICE - MapLibre] unproject called before map instance is ready.');
            return null;
        }
        const point: maplibregl.PointLike = [pixel[0], pixel[1]];
        const lngLat = this.mapInstance.unproject(point);
        return [lngLat.lng, lngLat.lat];
    }

    public fitBounds(bbox: [number, number, number, number]): void {
        if (!this.mapInstance) return;
        // MapLibre expects [[west, south], [east, north]]
        try {
            // fitBounds expects [[west, south], [east, north]] as [lng, lat]
            this.mapInstance.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 40, animate: true });
        } catch (e) {
            // fallback: set center + approximate zoom
            const lon = (bbox[0] + bbox[2]) / 2;
            const lat = (bbox[1] + bbox[3]) / 2;
            this.setViewport([lon, lat], this.initialConfig.zoom);
        }
    }

    public setCursor(cursor: string): void {
        if (!this.mapInstance) return;
        this.mapInstance.getCanvas().style.cursor = cursor;
    }

    public setPanEnabled(enabled: boolean): void {
        if (!this.mapInstance) return;
        if (enabled) {
            this.mapInstance.dragPan.enable();
        } else {
            this.mapInstance.dragPan.disable();
        }
    }

    public setTouchCaptureEnabled(_enabled: boolean): void {}

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
        try { this.mapInstance.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none'); } catch (_) {}
    }

    public getSourceData(sourceId: string): GeoJSON.FeatureCollection | string | null {
        // Registry first — always reflects the latest setData call
        const cached = this.geoJSONData.get(sourceId);
        if (cached) return cached;
        if (!this.mapInstance) return null;
        const source = this.mapInstance.getSource(sourceId) as any;
        if (!source || source.type !== 'geojson') return null;
        // Fallback: try serialize for URL-backed sources
        try {
            const s = source.serialize();
            if (!s) return null;
            if (typeof s.data === 'string') return s.data; // URL — caller must fetch
            if (typeof s.data === 'object') {
                this.geoJSONData.set(sourceId, s.data as GeoJSON.FeatureCollection);
                return s.data as GeoJSON.FeatureCollection;
            }
        } catch (_) {}
        return null;
    }

    public suppressBusySignalForSource(sourceId: string): void {
        this.silentSourceIds.add(sourceId);
    }

    public unsuppressBusySignalForSource(sourceId: string): void {
        this.silentSourceIds.delete(sourceId);
    }

    public getNavigationCapabilities(): NavigationCapabilities {
        return { bearing: true, pitch: true };
    }

    public getBearing(): number {
        return this.mapInstance?.getBearing() ?? 0;
    }

    public setBearing(bearing: number): void {
        this.mapInstance?.setBearing(bearing);
    }

    public getPitch(): number {
        return this.mapInstance?.getPitch() ?? 0;
    }

    public setPitch(pitch: number): void {
        this.mapInstance?.setPitch(pitch);
    }

    public resetNorth(): void {
        this.mapInstance?.resetNorth();
    }

    public resetNorthPitch(): void {
        // resetNorthPitch also resets bearing
        this.mapInstance?.resetNorthPitch();
    }

    private applyGlobeFog(): void {
        if (!this.mapInstance) return;
        const projectionType = (this.mapInstance as any).getProjection?.()?.type;
        const isGlobe = projectionType === 'globe';
        const canvas = (this.mapInstance as any).getCanvas?.() as HTMLCanvasElement | undefined;
        if (canvas) {
            // Globe: near-black space behind the globe. Mercator: regular theme background
            // (visible through transparent basemaps), so it follows light/dark mode.
            canvas.style.background = isGlobe ? '#000008' : 'var(--color-background-secondary, #f4f4f4)';
        }
        // MapLibre v5 sky layer: only meaningful in globe projection
        try {
            (this.mapInstance as any).setSky(isGlobe ? { 'sky-color': '#000000' } : undefined);
        } catch { /* setSky not available */ }
    }

    public setProjection(projection: string | { name: string; center?: [number, number]; parallels?: [number, number] }): boolean {
        if (!this.mapInstance) return false;
        try {
            // MapLibre v5 uses {type} not {name}
            const mlProj = typeof projection === 'string'
                ? { type: projection }
                : { type: projection.name, center: projection.center, parallels: projection.parallels };
            (this.mapInstance as any).setProjection(mlProj);
            this.applyGlobeFog();
            return true;
        } catch {
            return false;
        }
    }

    public getProjection(): { name: string; center?: [number, number]; parallels?: [number, number] } | null {
        if (!this.mapInstance) return { name: 'mercator' };
        try {
            const proj = (this.mapInstance as any).getProjection();
            // MapLibre v5 returns {type, ...} — normalize to {name, ...}
            const typeName = proj?.type ?? proj?.name ?? 'mercator';
            return {
                name: typeName,
                ...(proj?.center ? { center: proj.center } : {}),
                ...(proj?.parallels ? { parallels: proj.parallels } : {}),
            };
        } catch {
            return { name: 'mercator' };
        }
    }

    private dispatchViewportBoundsSnapshot(): void {
        const viewportBounds = this.buildViewportFeature();
        this.store.dispatch({ mapViewportBounds: viewportBounds }, 'MAP');
    }

    private buildViewportFeature(): GeoJSON.Feature<GeoJSON.Polygon> | null {
        if (!this.mapInstance) {
            return null;
        }

        const corners: [number, number][] = [];
        const canvas = this.mapInstance.getCanvas();
        const pixelRatio = (this.mapInstance as any).pixelRatio ?? window.devicePixelRatio ?? 1;
        const width = (canvas?.width ?? 0) / pixelRatio || canvas?.clientWidth || 0;
        const height = (canvas?.height ?? 0) / pixelRatio || canvas?.clientHeight || 0;

        if (width > 0 && height > 0) {
            // Screen corners: bottom-left, bottom-right, top-right, top-left
            const screenPoints: [number, number][] = [
                [0, height],
                [width, height],
                [width, 0],
                [0, 0],
            ];

            for (const pt of screenPoints) {
                const lngLat = this.mapInstance.unproject(pt as maplibregl.PointLike);
                corners.push([lngLat.lng, lngLat.lat]);
            }
            // Close the ring
            corners.push(corners[0]);
        }

        // Fallback to axis-aligned bounds if unproject failed
        if (corners.length === 0) {
            const bounds = this.mapInstance.getBounds();
            if (!bounds) {
                return null;
            }
            const sw = bounds.getSouthWest();
            const ne = bounds.getNorthEast();
            corners.push(
                [sw.lng, sw.lat],
                [sw.lng, ne.lat],
                [ne.lng, ne.lat],
                [ne.lng, sw.lat],
                [sw.lng, sw.lat],
            );
        }

        return {
            type: 'Feature',
            properties: { role: 'mapViewport' },
            geometry: {
                type: 'Polygon',
                coordinates: [corners],
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

        for (const callback of this.mapReadyCallbacks) {
            try {
                callback(this.mapInstance!);
            } catch (error) {
                console.error('[CORE SERVICE] mapReady callback failed.', error);
            }
        }
    }

    public supportsRuntimeProjection(): boolean {
        return typeof (this.mapInstance as any)?.setProjection === 'function';
    }

    public destroyAndReinitialize(projection: string): void {
        if (!this.mapInstance || !this.lastContainerId) return;
        const viewport = this.getViewportState();
        this.mapInstance.remove();
        this.mapInstance = null;
        this.initialize(this.lastContainerId, {
            ...this.lastInitOptions,
            center: viewport.center,
            zoom: viewport.zoom,
            bearing: viewport.bearing,
            pitch: viewport.pitch,
            projection,
        });
    }
}
