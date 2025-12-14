// src/map/openlayers-services/MapCoreService.ts

import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import { getWidth } from 'ol/extent';
import { IMapCore } from '../IMapInterfaces';
import { MapStateStore } from '../../store/map-state-store';
import { MapEventBus, LngLat, Pixel, PointerResolution } from '../../store/map-events';
import 'ol/ol.css';

/**
 * Implements the core map contract (IMapCore) for OpenLayers.
 * Thin wrapper that translates OpenLayers events to generic events.
 */
export class MapCoreService implements IMapCore {
    private mapInstance: OLMap | null = null;

    constructor(
        private readonly store: MapStateStore,
        private readonly eventBus?: MapEventBus
    ) {}

    private readonly initialConfig = {
        center: [10.45, 51.17] as [number, number],
        zoom: 4
    };

    public getViewportState(): { center: [number, number]; zoom: number; bearing: number } {
        if (this.mapInstance) {
            const view = this.mapInstance.getView();
            const center = toLonLat(view.getCenter() || [0, 0]) as [number, number];
            const zoom = view.getZoom() || 1;
            const bearing = (view.getRotation() * 180) / Math.PI;
            return { center, zoom, bearing };
        }
        return { center: [0, 0], zoom: 1, bearing: 0 };
    }

    public setViewport(center: [number, number], zoom: number): void {
        if (this.mapInstance) {
            this.mapInstance.getView().animate({
                center: fromLonLat(center),
                zoom,
                duration: 500
            });
        }
    }

    public initialize(
        containerId: string,
        options?: { center?: [number, number]; zoom?: number; styleUrl?: string }
    ): void {
        const center = options?.center ?? this.initialConfig.center;
        const zoom = options?.zoom ?? this.initialConfig.zoom;
        const container = this.resolveContainer(containerId);

        this.mapInstance = new OLMap({
            target: container,
            layers: [
                new TileLayer({
                    source: new OSM()
                })
            ],
            view: new View({
                center: fromLonLat(center),
                zoom
            }),
            controls: []
        });

        // Map load event
        this.mapInstance.once('rendercomplete', () => {
            const viewportBounds = this.buildViewportFeature();
            this.store.dispatch(
                { mapLoaded: true, zoomLevel: zoom, mapCenter: center, mapViewportBounds: viewportBounds },
                'MAP'
            );
        });

        // View change events
        const view = this.mapInstance.getView();

        view.on('change:resolution', () => {
            const currentZoom = view.getZoom() || 0;
            const viewportBounds = this.buildViewportFeature();
            this.store.dispatch({ zoomLevel: currentZoom, mapViewportBounds: viewportBounds }, 'MAP');
        });

        view.on('change:center', () => {
            const currentCenter = toLonLat(view.getCenter() || [0, 0]) as [number, number];
            const currentZoom = view.getZoom() || 0;
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
            zoom: view.getZoom() || 0,
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
            zoom: view.getZoom() || 0,
            bearing: (view.getRotation() * 180) / Math.PI,
            pitch: 0,
            bounds: { sw, ne }
        });
    }

    public setZoom(level: number): void {
        if (this.mapInstance) {
            this.mapInstance.getView().setZoom(level);
        }
    }

    public onZoomEnd(callback: (level: number) => void): void {
        if (this.mapInstance) {
            this.mapInstance.getView().on('change:resolution', () => {
                callback(this.mapInstance!.getView().getZoom() || 0);
            });
        }
    }

    public getZoom(): number {
        return this.mapInstance?.getView().getZoom() || this.initialConfig.zoom;
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
