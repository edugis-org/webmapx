import { IMapCore } from '../IMapInterfaces'; 
import { store } from '../../store/central-state';

/**
 * Implements the core map contract (IMapCore) for the MapLibre engine.
 */
export class MapCoreService implements IMapCore {
    // The explicit return type of the tuple [number, number] is retained here
    public getViewportState(): { center: [number, number], zoom: number, bearing: number } { 
        return { center: [0, 0], zoom: 1, bearing: 0 }; 
    }
    
    public setViewport(center: [number, number], zoom: number): void {
        console.log(`[CORE SERVICE] Setting viewport to center: ${center}, zoom: ${zoom}`);
    }

    public initialize(containerId: string): void {
        console.log(`[CORE SERVICE] Initializing MapLibre instance in #${containerId}`);
        // Signal readiness to the Central State Store
        store.dispatch({ mapLoaded: true }, 'INIT');
    }
}