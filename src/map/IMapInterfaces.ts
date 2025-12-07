// src/map/IMapInterfaces.ts

/**
 * Interface for core map capabilities (e.g., controlling position and state).
 * This is implemented by the concrete MapLibreAdapter, OpenLayersAdapter, etc.
 */
export interface IMapCore {
    /** Gets the current map viewport settings (center, zoom, bearing). */
    // Note the strict tuple type [number, number] for center
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

export interface IMapZoomController {
    // Method the UI calls to change the map zoom
    setZoom(zoomLevel: number): void;
    // Method the Map Adapter calls to update the map state store
    notifyZoomChange(zoomLevel: number): void;
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