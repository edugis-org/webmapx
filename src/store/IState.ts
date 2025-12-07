/**
 * The single source of truth for the entire application state.
 * Any property added here must be initialized in the central-state.ts file.
 */
export interface IAppState {
    // Example state properties
    mapLoaded: boolean;
    currentTool: 'Buffer' | 'Legend' | 'None';
    bufferRadiusKm: number;
    zoomLevel: number;
    mapCenter: [number, number];
    // ... add all other global state properties here
}

/** Defines who initiated the state change for loop prevention. */
export type StateSource = 'UI' | 'MAP' | 'INIT';
