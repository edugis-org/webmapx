/**
 * The single source of truth for the entire application state.
 * Any property added here must be initialized in the map-state-store.ts file.
 */
export interface IAppState {
    // Example state properties
    mapLoaded: boolean;
    /** True when the map is busy loading tiles/data or rendering */
    mapBusy: boolean;
    bufferRadiusKm: number;
    zoomLevel: number | null;
    mapCenter: [number, number] | null;
    mapViewportBounds: GeoJSON.Feature<GeoJSON.Polygon> | null;
    pointerCoordinates: [number, number] | null;
    lastClickedCoordinates: [number, number] | null;
    pointerResolution: { lng: number; lat: number } | null;
    lastClickedResolution: { lng: number; lat: number } | null;

    /** IDs of currently visible layers (from catalog config) */
    visibleLayers: string[];

    /**
     * Currently active tool in the UI state model.
     * The shape is intentionally generic so any tool can participate without
     * extending a hardcoded union.
     */
    activeTool: ActiveToolState | null;
}

export interface ActiveToolState {
    toolId: string;
}

/** Defines who initiated the state change for loop prevention. */
export type StateSource = 'UI' | 'MAP' | 'INIT';
