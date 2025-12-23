// src/map/leaflet-services/MapFactoryService.ts

import * as L from 'leaflet';
import { IMapFactory, IMap, ILayer, ISource, MapCreateOptions, LayerSpec } from '../IMapInterfaces';

const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
/**
 * Zoom offset to normalize between MapLibre (512px tiles) and Leaflet (256px tiles).
 * Leaflet needs +1 zoom to show the same geographic extent as MapLibre.
 */
const ZOOM_OFFSET = 1;

/**
 * Check if a URL looks like a MapLibre/Mapbox style JSON URL rather than a tile URL.
 */
function isStyleJsonUrl(url: string): boolean {
    // Style JSON URLs typically end in .json or contain 'style' in the path
    return url.endsWith('.json') || url.includes('/style');
}

/**
 * Leaflet implementation of ISource.
 * In Leaflet, sources are tied to layers, so we track the GeoJSON layer.
 */
class LeafletSource implements ISource {
    constructor(
        public readonly id: string,
        private readonly layer: L.GeoJSON
    ) {}

    setData(data: GeoJSON.FeatureCollection): void {
        this.layer.clearLayers();
        this.layer.addData(data);
    }
}

/**
 * Leaflet implementation of ILayer.
 */
class LeafletLayer implements ILayer {
    constructor(
        public readonly id: string,
        private readonly layer: L.Layer,
        private readonly source: LeafletSource,
        private readonly map: L.Map
    ) {}

    getSource(): ISource {
        return this.source;
    }

    remove(): void {
        this.map.removeLayer(this.layer);
    }
}

/**
 * Leaflet implementation of IMap.
 */
class LeafletMap implements IMap {
    private sources: Map<string, LeafletSource> = new Map();
    private layers: Map<string, LeafletLayer> = new Map();
    private geoJsonLayers: Map<string, L.GeoJSON> = new Map();
    private resizeObserver: ResizeObserver | null = null;

    constructor(private readonly map: L.Map) {
        // Watch for container size changes and recalculate tiles
        const container = map.getContainer();
        this.resizeObserver = new ResizeObserver(() => {
            map.invalidateSize({ animate: false });
        });
        this.resizeObserver.observe(container);
    }

    setViewport(center: [number, number], zoom: number, bearing?: number, pitch?: number): void {
        // center is [lng, lat], Leaflet expects [lat, lng]
        const adjustedZoom = zoom;
        // Apply zoom offset to match MapLibre logical zooms (512px tiles).
        const leafletZoom = Math.max(0, Math.round(adjustedZoom) + ZOOM_OFFSET);
        console.log(`[LeafletMap.setViewport] center=${center}, zoom=${zoom} -> leafletZoom=${leafletZoom}`);
        this.map.setView([center[1], center[0]], leafletZoom, { animate: false });
    }

    createSource(sourceId: string, data: GeoJSON.FeatureCollection): ISource {
        if (!this.sources.has(sourceId)) {
            const geoJsonLayer = L.geoJSON(data);
            this.geoJsonLayers.set(sourceId, geoJsonLayer);
            const source = new LeafletSource(sourceId, geoJsonLayer);
            this.sources.set(sourceId, source);
        }
        return this.sources.get(sourceId)!;
    }

    getSource(sourceId: string): ISource | null {
        return this.sources.get(sourceId) || null;
    }

    createLayer(spec: LayerSpec): ILayer {
        if (!this.layers.has(spec.id)) {
            const geoJsonLayer = this.geoJsonLayers.get(spec.sourceId);
            if (!geoJsonLayer) {
                throw new Error(`Source ${spec.sourceId} not found for layer ${spec.id}`);
            }

            // Apply styling based on layer spec
            const style = this.toLeafletStyle(spec);
            geoJsonLayer.setStyle(style);
            geoJsonLayer.addTo(this.map);

            const source = this.sources.get(spec.sourceId)!;
            const layer = new LeafletLayer(spec.id, geoJsonLayer, source, this.map);
            this.layers.set(spec.id, layer);
        }
        return this.layers.get(spec.id)!;
    }

    getLayer(layerId: string): ILayer | null {
        return this.layers.get(layerId) || null;
    }

    onReady(callback: () => void): void {
        // Leaflet map is ready immediately after creation
        this.map.whenReady(() => {
            // Force size recalculation after container is properly rendered
            // Multiple attempts to handle shadow DOM timing issues
            const recalcSize = () => {
                this.map.invalidateSize({ animate: false });
            };
            recalcSize();
            setTimeout(recalcSize, 0);
            setTimeout(recalcSize, 50);
            setTimeout(() => {
                recalcSize();
                callback();
            }, 100);
        });
    }

    destroy(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        this.map.remove();
    }

    private toLeafletStyle(spec: LayerSpec): L.PathOptions {
        const style: L.PathOptions = {};

        if (spec.paint) {
            switch (spec.type) {
                case 'fill':
                    if ('fill-color' in spec.paint) {
                        style.fillColor = spec.paint['fill-color'] as string;
                    }
                    if ('fill-opacity' in spec.paint) {
                        style.fillOpacity = spec.paint['fill-opacity'] as number;
                    }
                    style.stroke = false;
                    break;
                case 'line':
                    if ('line-color' in spec.paint) {
                        style.color = spec.paint['line-color'] as string;
                    }
                    if ('line-width' in spec.paint) {
                        style.weight = spec.paint['line-width'] as number;
                    }
                    if ('line-opacity' in spec.paint) {
                        style.opacity = spec.paint['line-opacity'] as number;
                    }
                    style.fill = false;
                    break;
                case 'circle':
                    // Circles in Leaflet need special handling via pointToLayer
                    if ('circle-color' in spec.paint) {
                        style.fillColor = spec.paint['circle-color'] as string;
                    }
                    if ('circle-opacity' in spec.paint) {
                        style.fillOpacity = spec.paint['circle-opacity'] as number;
                    }
                    break;
                case 'symbol':
                    // Symbols in Leaflet need special handling via pointToLayer
                    break;
            }
        }

        return style;
    }
}

/**
 * Leaflet implementation of IMapFactory.
 */
export class MapFactoryService implements IMapFactory {
    private readonly shadowStyleId = 'webmapx-leaflet-shadow-styles';

    createMap(container: HTMLElement, options?: MapCreateOptions): IMap {
        this.ensureLeafletShadowStyles(container);

        // options.center is [lng, lat], Leaflet expects [lat, lng]
        const center = options?.center
            ? [options.center[1], options.center[0]] as [number, number]
            : [0, 0] as [number, number];

        // Apply zoom offset to match MapLibre logical zooms (512px tiles).
        const leafletZoom = Math.max(0, Math.round(options?.zoom ?? 1) + ZOOM_OFFSET);
        console.log(`[MapFactoryService.createMap] center=[${center}] (input: ${options?.center}), zoom=${leafletZoom}`);

        const map = L.map(container, {
            center: center,
            zoom: leafletZoom,
            attributionControl: false, // Keep inset map clean
            zoomControl: false, // Inset maps don't need zoom control
            className: 'leaflet-edge-buffered'
        });

        // Add tile layer - always use OSM for Leaflet since it can't parse style JSON
        // If styleUrl is a direct tile URL (not a .json style), use it
        if (options?.styleUrl && !isStyleJsonUrl(options.styleUrl)) {
            L.tileLayer(options.styleUrl, {
                attribution: DEFAULT_ATTRIBUTION
            }).addTo(map);
        } else {
            // Default to OSM tiles (or when styleUrl is a MapLibre style JSON)
            L.tileLayer(DEFAULT_TILE_URL, {
                attribution: DEFAULT_ATTRIBUTION
            }).addTo(map);
        }

        if (options?.interactive === false) {
            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable();
            if (map.tap) map.tap.disable();
        }

        return new LeafletMap(map);
    }

    private ensureLeafletShadowStyles(container: HTMLElement): void {
        const root = container.getRootNode();
        if (!(root instanceof ShadowRoot)) return;
        if (root.querySelector(`#${this.shadowStyleId}`)) return;

        const style = document.createElement('style');
        style.id = this.shadowStyleId;
        style.textContent = `
            .leaflet-pane,
            .leaflet-tile,
            .leaflet-marker-icon,
            .leaflet-marker-shadow,
            .leaflet-tile-container,
            .leaflet-pane > svg,
            .leaflet-pane > canvas,
            .leaflet-zoom-box,
            .leaflet-image-layer,
            .leaflet-layer {
                position: absolute;
                left: 0;
                top: 0;
            }
            .leaflet-container {
                overflow: hidden;
            }
            .leaflet-container .leaflet-marker-pane img,
            .leaflet-container .leaflet-shadow-pane img,
            .leaflet-container .leaflet-tile-pane img,
            .leaflet-container img.leaflet-image-layer,
            .leaflet-container .leaflet-tile {
                max-width: none !important;
                max-height: none !important;
                width: auto;
                padding: 0;
            }
            .leaflet-container img.leaflet-tile {
                mix-blend-mode: normal;
            }
            .leaflet-tile {
                visibility: hidden;
            }
            .leaflet-tile-loaded {
                visibility: inherit;
            }
            .leaflet-pane { z-index: 400; }
            .leaflet-tile-pane { z-index: 200; }
            .leaflet-overlay-pane { z-index: 400; }
            .leaflet-shadow-pane { z-index: 500; }
            .leaflet-marker-pane { z-index: 600; }
            .leaflet-tooltip-pane { z-index: 650; }
            .leaflet-popup-pane { z-index: 700; }
            .leaflet-map-pane canvas { z-index: 100; }
            .leaflet-map-pane svg { z-index: 200; }
            .leaflet-zoom-animated {
                transform-origin: 0 0;
            }
        `;
        root.appendChild(style);
    }

}
