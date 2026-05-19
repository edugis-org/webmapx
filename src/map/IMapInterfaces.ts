// src/map/IMapInterfaces.ts

import type { LayerConfig, SourceConfig, CatalogConfig, MapStyle } from '../config/types';
import type { LngLat, Pixel, MapEventBus } from '../store/map-events';
import type { MapStateStore } from '../store/map-state-store';

/**
 * Options for creating a map instance.
 */
export interface MapCreateOptions {
    center?: [number, number];
    zoom?: number;
    styleUrl?: string;
    interactive?: boolean;
}

/**
 * Paint properties for fill layers.
 */
export interface FillPaint {
    'fill-color'?: string;
    'fill-opacity'?: number;
}

/**
 * Paint properties for line layers.
 */
export interface LinePaint {
    'line-color'?: string;
    'line-width'?: number;
    'line-opacity'?: number;
}

/**
 * Library-agnostic layer specification.
 */
export interface LayerSpec {
    id: string;
    type: 'fill' | 'line' | 'circle' | 'symbol';
    sourceId: string;
    paint?: FillPaint | LinePaint;
}

/**
 * Interface for core map capabilities (e.g., controlling position and state).
 * This is implemented by the concrete MapLibreAdapter, OpenLayersAdapter, etc.
 */
export interface IMapCore {
    /** Gets the current map viewport settings (center, zoom, bearing, pitch). */
    getViewportState(): { center: [number, number], zoom: number, bearing: number, pitch: number };

    /** Sets the map viewport, used by UI components like a 'Location Finder'. */
    setViewport(center: [number, number], zoom: number): void;

    /** Initializes the map in the target HTML element. Supports initial config. */
    initialize(
        containerId: string,
        options?: {
            center?: [number, number];
            zoom?: number;
            /** URL to a MapLibre/Mapbox style JSON */
            styleUrl?: string;
            /** Inline style object (takes precedence over styleUrl) */
            style?: MapStyle;
        }
    ): void;

    /** Sets the map zoom level in a library-agnostic way. */
    setZoom(level: number): void;

    /** Gets the current zoom level. */
    getZoom(): number;

    addLayer(layer: any): void;
    removeLayer(id: string): void;
    addSource(id: string, config: any): void;
    removeSource(id: string): void;
    getSource(id: string): ISource | undefined;
    suppressBusySignalForSource(sourceId: string): void;
    unsuppressBusySignalForSource(sourceId: string): void;
    /** Returns whether the current engine supports interactive rotation/pitch. */
    getNavigationCapabilities(): NavigationCapabilities;
    /** Gets the current map bearing (degrees clockwise from north). */
    getBearing(): number;
    /** Sets the map bearing (degrees clockwise from north). */
    setBearing(bearing: number): void;
    /** Gets the current map pitch/tilt in degrees (0 = top-down). */
    getPitch(): number;
    /** Sets the map pitch/tilt in degrees (0 = top-down). */
    setPitch(pitch: number): void;
    /** Resets map bearing to north/up. */
    resetNorth(): void;
    /** Resets map bearing to north and pitch to top-down (when supported). */
    resetNorthPitch(): void;

    /** Given a geographic coordinate (LngLat), returns its pixel coordinate [x, y]. */
    project(coords: LngLat): Pixel;
    /** Given a pixel coordinate [x, y] in the map container, returns geographic [lng, lat]. */
    unproject(pixel: Pixel): LngLat | null;
    /** Fit the map view to the given bbox [west, south, east, north]. Implementations should choose the best native method. */
    fitBounds(bbox: [number, number, number, number]): void;
}

/**
 * A GeoJSON source belonging to a map.
 */
export interface ISource {
    /** The source ID. */
    readonly id: string;

    /** Updates the GeoJSON data of this source. */
    setData(data: GeoJSON.FeatureCollection): void;
}

/**
 * A layer belonging to a map.
 */
export interface ILayer {
    /** The layer ID. */
    readonly id: string;

    /** Gets the source this layer uses. */
    getSource(): ISource;

    /** Removes this layer from the map. */
    remove(): void;
}

/**
 * A sub-map instance created by ISubMapFactory (e.g., inset maps, independent child maps).
 */
export interface ISubMap {
    /** Sets the viewport (center, zoom, bearing, pitch). */
    setViewport(center: [number, number], zoom: number, bearing?: number, pitch?: number): void;

    /** Creates a GeoJSON source on this map. */
    createSource(sourceId: string, data: GeoJSON.FeatureCollection): ISource;

    /** Gets an existing source by ID. */
    getSource(sourceId: string): ISource | null;

    /** Creates a layer on this map. */
    createLayer(spec: LayerSpec): ILayer;

    /** Gets an existing layer by ID. */
    getLayer(layerId: string): ILayer | null;

    /** Registers a callback for when the map is ready (style loaded). */
    onReady(callback: () => void): void;

    /** Destroys the map and cleans up resources. */
    destroy(): void;
}

/**
 * Factory for creating sub-map instances (inset maps, independent child maps).
 */
export interface ISubMapFactory {
    /** Creates a new sub-map instance. */
    createMap(container: HTMLElement, options?: MapCreateOptions): ISubMap;
}

/**
 * The unified map interface for the main map and all map instances.
 * Combines core map operations, layer management, state, and events.
 * Implemented by concrete adapters (MapLibre, OpenLayers, Leaflet, Cesium).
 */
export interface IMap {
    // ===== State and Events =====
    /** Access to the map's reactive state store. */
    readonly store: MapStateStore;

    /** Event bus for normalized library-agnostic map events. */
    readonly events: MapEventBus;

    /** Tool-specific service surface for engine-backed tool commands. */
    readonly toolService: IToolService;

    // ===== Viewport / Camera =====
    /** Gets the current viewport state (center, zoom, bearing, pitch). */
    getViewportState(): { center: [number, number], zoom: number, bearing: number, pitch: number };

    /** Sets the map viewport (center and zoom). */
    setViewport(center: [number, number], zoom: number): void;

    /** Gets the current zoom level. */
    getZoom(): number;

    /** Sets the zoom level. */
    setZoom(level: number): void;

    /** Gets the current bearing (degrees clockwise from north). */
    getBearing(): number;

    /** Sets the bearing (degrees clockwise from north). */
    setBearing(bearing: number): void;

    /** Gets the current pitch/tilt (degrees, 0 = top-down). */
    getPitch(): number;

    /** Sets the pitch/tilt (degrees, 0 = top-down). */
    setPitch(pitch: number): void;

    /** Resets bearing to north. */
    resetNorth(): void;

    /** Resets bearing to north and pitch to top-down (if supported). */
    resetNorthPitch(): void;

    /** Fits the view to a bounding box [west, south, east, north]. */
    fitBounds(bbox: [number, number, number, number]): void;

    // ===== Coordinate Conversion =====
    /** Projects geographic [lng, lat] to screen pixel [x, y]. */
    project(coords: LngLat): Pixel;

    /** Unprojects screen pixel [x, y] to geographic [lng, lat]. */
    unproject(pixel: Pixel): LngLat | null;

    // ===== Navigation Capabilities =====
    /** Returns which camera controls this engine supports. */
    getNavigationCapabilities(): NavigationCapabilities;

    // ===== Native Layer/Source Management =====
    /** Adds a layer object to the map. */
    addLayer(layer: any): void;

    /** Adds a native source to the map. */
    addSource(id: string, config: any): void;

    /** Removes a layer or source by ID. */
    removeLayer(id: string): void;

    /** Removes a native source by ID. */
    removeSource(id: string): void;

    /** Gets a native source by ID. */
    getSource(id: string): ISource | undefined;

    /** Suppresses the busy/loading indicator for a source. */
    suppressBusySignalForSource(sourceId: string): void;

    /** Re-enables the busy/loading indicator for a source. */
    unsuppressBusySignalForSource(sourceId: string): void;

    // ===== Initialization & Cleanup =====
    /**
     * Initializes the map in the target HTML element.
     * Must be called before using the map.
     */
    initialize(
        containerId: string,
        options?: {
            center?: [number, number];
            zoom?: number;
            styleUrl?: string;
            style?: MapStyle;
        }
    ): void;

    // ===== Sub-map Factory =====
    /** Factory for creating independent sub-map instances (e.g., inset maps). */
    readonly mapFactory: ISubMapFactory;
}

export interface NavigationCapabilities {
    /** True if map supports bearing/rotation. */
    bearing: boolean;
    /** True if map supports pitch/tilt adjustments. */
    pitch: boolean;
}

/**
 * Interface for handling the display and styling of layers.
 * Referenced by a 'GIS Legend' or 'Style Editor' module.
 */
export interface ILayerStyleEditor {
    /** Sets the opacity for a given layer ID. */
    setLayerOpacity(layerId: string, opacity: number): void;
    
    /** Hides or shows a specific layer. */
    setLayerVisibility(layerId: string, visible: boolean): void;
}

/**
 * Template interface for tool services.
 * Copy and adapt this interface when creating new tool services.
 * NOTE: This is where you would define the new capability for a feature.
 */
export interface IToolService {
    /** Toggles the activation state of the tool. */
    toggleTool(): void;

    /** Sets the radius for a geo-buffer operation.
     * This method must be handled by an Adapter Service to ensure robustness
     * (e.g., using throttle() if it's an expensive API call).
     */
    setBufferRadius(radiusKm: number): void;
}

/**
 * Service for managing catalog layers on the map.
 * Converts config-based layer definitions to native map layers.
 * Updates the store with visible layer state.
 */
export interface ILayerService {
    /**
     * Sets the catalog configuration containing sources and layers.
     * Must be called before adding layers.
     */
    setCatalog(catalog: CatalogConfig): void;

    /**
     * Adds a layer to the map using logical and source config.
     * @param layerId Logical layer ID
     * @param layerConfig LayerConfig object
     * @param sourceConfig SourceConfig object
     * @returns true if layer was added successfully, false on failure
     */
    addLayer(layerId: string, layerConfig: LayerConfig, sourceConfig: SourceConfig): Promise<boolean>;

    /**
     * Removes a layer from the map by its ID.
     */
    removeLayer(layerId: string): void;

    /**
     * Returns the list of currently visible layer IDs.
     */
    getVisibleLayers(): string[];

    /**
     * Checks if a layer is currently visible.
     */
    isLayerVisible(layerId: string): boolean;
}
