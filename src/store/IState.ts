/** Defines the shape of the entire application state. */
export interface IAppState {
    // Example state properties
    mapLoaded: boolean;
    currentTool: 'Buffer' | 'Legend' | 'None';
    bufferRadiusKm: number;
    // ... add all other global state properties here
}

/** Defines who initiated the state change for loop prevention. */
export type StateSource = 'UI' | 'MAP' | 'INIT';