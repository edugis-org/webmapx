// src/map/IMapInterfaces.ts

import type { LayerConfig, SourceConfig, CatalogConfig } from '../config/types';

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
    /** Gets the current map viewport settings (center, zoom, bearing). */
    getViewportState(): { center: [number, number], zoom: number, bearing: number };

    /** Sets the map viewport, used by UI components like a 'Location Finder'. */
    setViewport(center: [number, number], zoom: number): void;

    /** Initializes the map in the target HTML element. Supports initial config. */
    initialize(
        containerId: string,
        options?: {
            center?: [number, number];
            zoom?: number;
            styleUrl?: string;
        }
    ): void;

    /** Sets the map zoom level in a library-agnostic way. */
    setZoom(level: number): void;

    /** Subscribes to zoom-end events and provides the resulting zoom level. */
    onZoomEnd(callback: (level: number) => void): void;

    /** Gets the current zoom level. */
    getZoom(): number;
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
 * A map instance created by the factory.
 */
export interface IMap {
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
 * Factory for creating map instances.
 */
export interface IMapFactory {
    /** Creates a new map instance. */
    createMap(container: HTMLElement, options?: MapCreateOptions): IMap;
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