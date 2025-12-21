// src/map/openlayers-services/MapCoreService.ts

import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Fill, Stroke, Style, Circle as CircleStyle } from 'ol/style';
import { IMapCore } from '../IMapInterfaces';
import { MapStateStore } from '../../store/map-state-store';
import { MapEventBus, LngLat, Pixel, PointerResolution } from '../../store/map-events';
import type { MapStyle, MapStyleSource, MapStyleLayer } from '../../config/types';
import type BaseLayer from 'ol/layer/Base';
import 'ol/ol.css';

/**
 * Implements the core map contract (IMapCore) for OpenLayers.
 * Thin wrapper that translates OpenLayers events to generic events.
 */
export class MapCoreService implements IMapCore {
    private mapInstance: OLMap | null = null;
    private mapReadyCallbacks: Array<(map: OLMap) => void> = [];

    /**
     * Zoom offset to normalize between MapLibre (512px tiles) and OpenLayers/OSM (256px tiles).
     * OpenLayers needs +1 zoom to show the same geographic extent as MapLibre.
     */
    private static readonly ZOOM_OFFSET = 1;

    constructor(
        private readonly store: MapStateStore,
        private readonly eventBus?: MapEventBus
    ) {}

    private readonly initialConfig = {
        center: [10.45, 51.17] as [number, number],
        zoom: 4
    };

    /** Convert logical zoom (MapLibre-compatible) to OpenLayers internal zoom */
    private toOLZoom(logicalZoom: number): number {
        return logicalZoom + MapCoreService.ZOOM_OFFSET;
    }

    /** Convert OpenLayers internal zoom to logical zoom (MapLibre-compatible) */
    private fromOLZoom(olZoom: number): number {
        return olZoom - MapCoreService.ZOOM_OFFSET;
    }

    public getViewportState(): { center: [number, number]; zoom: number; bearing: number } {
        if (this.mapInstance) {
            const view = this.mapInstance.getView();
            const center = toLonLat(view.getCenter() || [0, 0]) as [number, number];
            const zoom = this.fromOLZoom(view.getZoom() || 1);
            const bearing = (view.getRotation() * 180) / Math.PI;
            return { center, zoom, bearing };
        }
        return { center: [0, 0], zoom: 1, bearing: 0 };
    }

    public setViewport(center: [number, number], zoom: number): void {
        if (this.mapInstance) {
            this.mapInstance.getView().animate({
                center: fromLonLat(center),
                zoom: this.toOLZoom(zoom),
                duration: 500
            });
        }
    }

    public initialize(
        containerId: string,
        options?: { center?: [number, number]; zoom?: number; styleUrl?: string; style?: MapStyle }
    ): void {
        const center = options?.center ?? this.initialConfig.center;
        const logicalZoom = options?.zoom ?? this.initialConfig.zoom;
        const olZoom = this.toOLZoom(logicalZoom);
        const container = this.resolveContainer(containerId);

        // Start with empty layers, add style layers after
        this.mapInstance = new OLMap({
            target: container,
            layers: [],
            view: new View({
                center: fromLonLat(center),
                zoom: olZoom
            }),
            controls: []
        });

        // Load style (inline or from URL)
        if (options?.style) {
            // Inline style object
            const layers = this.createLayersFromStyle(options.style);
            layers.forEach(layer => this.mapInstance!.addLayer(layer));
        } else if (options?.styleUrl) {
            // Fetch style from URL
            this.loadStyleFromUrl(options.styleUrl);
        }

        // Map load event
        this.mapInstance.once('rendercomplete', () => {
            const viewportBounds = this.buildViewportFeature();
            this.store.dispatch(
                { mapLoaded: true, zoomLevel: logicalZoom, mapCenter: center, mapViewportBounds: viewportBounds },
                'MAP'
            );
            this.flushMapReadyCallbacks();
        });

        // Loading state detection
        this.attachLoadingEvents(this.mapInstance);

        // View change events
        const view = this.mapInstance.getView();

        view.on('change:resolution', () => {
            const currentZoom = this.fromOLZoom(view.getZoom() || 0);
            const viewportBounds = this.buildViewportFeature();
            this.store.dispatch({ zoomLevel: currentZoom, mapViewportBounds: viewportBounds }, 'MAP');
        });

        view.on('change:center', () => {
            const currentCenter = toLonLat(view.getCenter() || [0, 0]) as [number, number];
            const currentZoom = this.fromOLZoom(view.getZoom() || 0);
            const viewportBounds = this.buildViewportFeature();
            this.store.dispatch(
                { mapCenter: currentCenter, zoomLevel: currentZoom, mapViewportBounds: viewportBounds },
                'MAP'
            );
        });

        // Move end event
        this.mapInstance.on('moveend', () => {
            this.emitViewChangeEnd();
        });

        // Continuous move event
        this.mapInstance.on('pointerdrag', () => {
            this.dispatchViewportBoundsSnapshot();
            this.emitViewChange();
        });

        // Pointer events
        this.attachPointerEvents(this.mapInstance);
    }

    private attachPointerEvents(map: OLMap): void {
        map.on('pointermove', (event) => {
            if (event.dragging) return;

            const coords = toLonLat(event.coordinate) as LngLat;
            const pixel: Pixel = [event.pixel[0], event.pixel[1]];
            const resolution = this.computePointerResolution();

            this.eventBus?.emit({
                type: 'pointer-move',
                coords,
                pixel,
                resolution,
                originalEvent: event.originalEvent
            });

            this.store.dispatch({
                pointerCoordinates: coords,
                pointerResolution: resolution
            }, 'MAP');
        });

        map.getViewport().addEventListener('mouseout', (event) => {
            this.eventBus?.emit({
                type: 'pointer-leave',
                originalEvent: event
            });
            this.store.dispatch({ pointerCoordinates: null, pointerResolution: null }, 'MAP');
        });

        map.on('click', (event) => {
            const coords = toLonLat(event.coordinate) as LngLat;
            const pixel: Pixel = [event.pixel[0], event.pixel[1]];
            const resolution = this.computePointerResolution();

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
                pointerResolution: resolution
            }, 'MAP');
        });

        map.on('dblclick', (event) => {
            const coords = toLonLat(event.coordinate) as LngLat;
            const pixel: Pixel = [event.pixel[0], event.pixel[1]];

            this.eventBus?.emit({
                type: 'dblclick',
                coords,
                pixel,
                originalEvent: event.originalEvent
            });
        });

        map.getViewport().addEventListener('contextmenu', (event) => {
            event.preventDefault();
            const pixel = map.getEventPixel(event);
            const coordinate = map.getCoordinateFromPixel(pixel);
            if (coordinate) {
                const coords = toLonLat(coordinate) as LngLat;

                this.eventBus?.emit({
                    type: 'contextmenu',
                    coords,
                    pixel: [pixel[0], pixel[1]] as Pixel,
                    originalEvent: event
                });
            }
        });
    }

    private computePointerResolution(): PointerResolution | null {
        if (!this.mapInstance) return null;

        const view = this.mapInstance.getView();
        const resolution = view.getResolution();
        if (!resolution) return null;

        // Convert resolution from meters to degrees (approximate)
        const metersPerDegree = 111320;
        const degPerPixel = resolution / metersPerDegree;

        return {
            lng: degPerPixel,
            lat: degPerPixel
        };
    }

    private emitViewChange(): void {
        if (!this.eventBus || !this.mapInstance) return;

        const view = this.mapInstance.getView();
        const center = toLonLat(view.getCenter() || [0, 0]) as LngLat;
        const extent = view.calculateExtent(this.mapInstance.getSize());
        const sw = toLonLat([extent[0], extent[1]]) as LngLat;
        const ne = toLonLat([extent[2], extent[3]]) as LngLat;

        this.eventBus.emit({
            type: 'view-change',
            center,
            zoom: this.fromOLZoom(view.getZoom() || 0),
            bearing: (view.getRotation() * 180) / Math.PI,
            pitch: 0,
            bounds: { sw, ne }
        });
    }

    private emitViewChangeEnd(): void {
        if (!this.eventBus || !this.mapInstance) return;

        const view = this.mapInstance.getView();
        const center = toLonLat(view.getCenter() || [0, 0]) as LngLat;
        const extent = view.calculateExtent(this.mapInstance.getSize());
        const sw = toLonLat([extent[0], extent[1]]) as LngLat;
        const ne = toLonLat([extent[2], extent[3]]) as LngLat;

        this.eventBus.emit({
            type: 'view-change-end',
            center,
            zoom: this.fromOLZoom(view.getZoom() || 0),
            bearing: (view.getRotation() * 180) / Math.PI,
            pitch: 0,
            bounds: { sw, ne }
        });
    }

    public setZoom(level: number): void {
        if (this.mapInstance) {
            this.mapInstance.getView().setZoom(this.toOLZoom(level));
        }
    }

    public onZoomEnd(callback: (level: number) => void): void {
        if (this.mapInstance) {
            this.mapInstance.getView().on('change:resolution', () => {
                callback(this.fromOLZoom(this.mapInstance!.getView().getZoom() || 0));
            });
        }
    }

    public getZoom(): number {
        return this.fromOLZoom(this.mapInstance?.getView().getZoom() || this.toOLZoom(this.initialConfig.zoom));
    }

    /**
     * Register a callback to be invoked when the map instance is ready.
     * If the map is already initialized, the callback is invoked immediately.
     */
    public onMapReady(callback: (map: OLMap) => void): void {
        if (this.mapInstance) {
            callback(this.mapInstance);
            return;
        }
        this.mapReadyCallbacks.push(callback);
    }

    /**
     * Flush all pending map-ready callbacks.
     */
    private flushMapReadyCallbacks(): void {
        if (!this.mapInstance) {
            return;
        }

        const pending = this.mapReadyCallbacks.splice(0);
        pending.forEach(callback => {
            try {
                callback(this.mapInstance!);
            } catch (error) {
                console.error('[OL CORE SERVICE] mapReady callback failed.', error);
            }
        });
    }

    private pendingTileLoads = 0;

    /**
     * Attach loading state tracking to the map.
     * Tracks tile loading across all layers and rendercomplete for idle detection.
     */
    private attachLoadingEvents(map: OLMap): void {
        // Track loading on existing and future layers
        const attachLayerEvents = (layer: any) => {
            const source = layer.getSource?.();
            if (!source) return;

            source.on?.('tileloadstart', () => {
                this.pendingTileLoads++;
                this.store.dispatch({ mapBusy: true }, 'MAP');
            });

            source.on?.('tileloadend', () => {
                this.pendingTileLoads = Math.max(0, this.pendingTileLoads - 1);
            });

            source.on?.('tileloaderror', () => {
                this.pendingTileLoads = Math.max(0, this.pendingTileLoads - 1);
            });
        };

        // Attach to existing layers
        map.getLayers().forEach(attachLayerEvents);

        // Attach to layers added in the future
        map.getLayers().on('add', (e) => {
            attachLayerEvents(e.element);
        });

        // Use rendercomplete as the idle signal
        map.on('rendercomplete', () => {
            if (this.pendingTileLoads === 0) {
                this.store.dispatch({ mapBusy: false }, 'MAP');
            }
        });

        // Also mark busy when loading starts (on move/zoom)
        map.on('loadstart', () => {
            this.store.dispatch({ mapBusy: true }, 'MAP');
        });
    }

    /**
     * Load a MapLibre-style JSON from a URL and apply it.
     */
    private async loadStyleFromUrl(url: string): Promise<void> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`[OL CORE] Failed to fetch style from ${url}: ${response.status}`);
                return;
            }
            const style = await response.json() as MapStyle;
            const layers = this.createLayersFromStyle(style);
            layers.forEach(layer => this.mapInstance?.addLayer(layer));
        } catch (error) {
            console.error(`[OL CORE] Error loading style from ${url}:`, error);
        }
    }

    /**
     * Convert a MapLibre-style style object to OpenLayers layers.
     */
    private createLayersFromStyle(style: MapStyle): BaseLayer[] {
        const layers: BaseLayer[] = [];
        const sources = style.sources || {};

        for (const layerDef of style.layers || []) {
            const sourceId = layerDef.source;
            if (!sourceId) continue;

            const sourceDef = sources[sourceId];
            if (!sourceDef) continue;

            const olLayer = this.createLayerFromStyleDef(layerDef, sourceDef);
            if (olLayer) {
                layers.push(olLayer);
            }
        }

        return layers;
    }

    /**
     * Create a single OpenLayers layer from MapLibre-style layer and source definitions.
     */
    private createLayerFromStyleDef(layerDef: MapStyleLayer, sourceDef: MapStyleSource): BaseLayer | null {
        // Raster tile layers
        if (layerDef.type === 'raster' && sourceDef.type === 'raster') {
            const tiles = sourceDef.tiles || [];
            if (tiles.length === 0) return null;

            return new TileLayer({
                source: new XYZ({
                    urls: tiles,
                    tileSize: sourceDef.tileSize,
                    attributions: sourceDef.attribution
                }),
                minZoom: layerDef.minzoom,
                maxZoom: layerDef.maxzoom,
                opacity: (layerDef.paint as any)?.['raster-opacity'] ?? 1
            });
        }

        // GeoJSON vector layers
        if (['fill', 'line', 'circle'].includes(layerDef.type) && sourceDef.type === 'geojson') {
            const data = sourceDef.data;
            const source = new VectorSource({
                features: typeof data === 'string'
                    ? undefined
                    : new GeoJSON().readFeatures(data, { featureProjection: 'EPSG:3857' }),
                url: typeof data === 'string' ? data : undefined,
                format: typeof data === 'string' ? new GeoJSON() : undefined,
                attributions: sourceDef.attribution
            });

            return new VectorLayer({
                source,
                style: this.createOLStyle(layerDef),
                minZoom: layerDef.minzoom,
                maxZoom: layerDef.maxzoom
            });
        }

        return null;
    }

    /**
     * Create an OpenLayers Style from a MapLibre-style layer definition.
     */
    private createOLStyle(layerDef: MapStyleLayer): Style {
        const paint = layerDef.paint || {};

        switch (layerDef.type) {
            case 'fill':
                return new Style({
                    fill: new Fill({
                        color: this.toRgba(
                            (paint as any)['fill-color'] || '#000000',
                            (paint as any)['fill-opacity'] ?? 1
                        )
                    }),
                    stroke: new Stroke({
                        color: this.toRgba(
                            (paint as any)['fill-outline-color'] || (paint as any)['fill-color'] || '#000000',
                            (paint as any)['fill-opacity'] ?? 1
                        ),
                        width: 1
                    })
                });

            case 'line':
                return new Style({
                    stroke: new Stroke({
                        color: this.toRgba(
                            (paint as any)['line-color'] || '#000000',
                            (paint as any)['line-opacity'] ?? 1
                        ),
                        width: (paint as any)['line-width'] || 1
                    })
                });

            case 'circle':
                return new Style({
                    image: new CircleStyle({
                        radius: (paint as any)['circle-radius'] || 5,
                        fill: new Fill({
                            color: this.toRgba(
                                (paint as any)['circle-color'] || '#3399CC',
                                (paint as any)['circle-opacity'] ?? 1
                            )
                        }),
                        stroke: new Stroke({
                            color: this.toRgba(
                                (paint as any)['circle-stroke-color'] || '#ffffff',
                                (paint as any)['circle-stroke-opacity'] ?? 1
                            ),
                            width: (paint as any)['circle-stroke-width'] || 1
                        })
                    })
                });

            default:
                return new Style();
        }
    }

    /**
     * Convert a hex color and opacity to an rgba string.
     */
    private toRgba(color: string, opacity: number): string {
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return color;
    }

    private dispatchViewportBoundsSnapshot(): void {
        const viewportBounds = this.buildViewportFeature();
        this.store.dispatch({ mapViewportBounds: viewportBounds }, 'MAP');
    }

    private buildViewportFeature(): GeoJSON.Feature<GeoJSON.Polygon> | null {
        if (!this.mapInstance) return null;

        const view = this.mapInstance.getView();
        const size = this.mapInstance.getSize();
        if (!size) return null;

        const extent = view.calculateExtent(size);
        const sw = toLonLat([extent[0], extent[1]]);
        const ne = toLonLat([extent[2], extent[3]]);

        const coordinates: [number, number][] = [
            [sw[0], sw[1]],
            [sw[0], ne[1]],
            [ne[0], ne[1]],
            [ne[0], sw[1]],
            [sw[0], sw[1]]
        ];

        return {
            type: 'Feature',
            properties: { role: 'mapViewport' },
            geometry: {
                type: 'Polygon',
                coordinates: [coordinates]
            }
        };
    }

    private resolveContainer(containerId: string): HTMLElement {
        const hostElement = document.getElementById(containerId);

        if (!hostElement) {
            throw new Error(`Container #${containerId} not found.`);
        }

        if (hostElement.tagName.toLowerCase() === 'webmapx-map') {
            const mapSlot = hostElement.querySelector<HTMLElement>('[slot="map-view"]');
            if (mapSlot) {
                return mapSlot;
            }
        }

        return hostElement;
    }
}
