// Role: This store will handle Calculating New State and notify all 
// subscribed UI components. It is also where the Feedback Loop Prevention logic 
// is implemented, by tagging state changes with their source ('UI' or 'MAP').

// src/store/map-state-store.ts

import { IAppState, StateSource } from './IState'; 

// ... (rest of the store implementation)

// Simple Observer pattern setup
type Listener = (state: IAppState, source: StateSource) => void;

export class MapStateStore {
    // ... (implementation code from previous step)
    private state: IAppState = {
        mapLoaded: false,
        currentTool: 'None',
        bufferRadiusKm: 5,
        zoomLevel: null,
        mapCenter: null,
        mapViewportBounds: null,
        pointerCoordinates: null,
        lastClickedCoordinates: null,
        pointerResolution: null,
        lastClickedResolution: null
    };
    private listeners: Listener[] = [];

    public getState(): IAppState {
        return Object.freeze({ ...this.state });
    }

    public dispatch(newState: Partial<IAppState>, source: StateSource): void {
        const previousState = this.state;
        this.state = { 
            ...previousState, 
            ...newState 
        };
        
        // Notify subscribers
        this.listeners.forEach(listener => listener(this.getState(), source));
    }

    public subscribe(listener: Listener): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
}