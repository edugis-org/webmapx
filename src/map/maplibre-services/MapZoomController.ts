import { store } from '../../store/central-state';
import { IMapZoomController } from '../IMapInterfaces';
import { throttle } from '../../utils/throttle'; // For performance during continuous input

// Assuming maplibre's map instance is available via a core adapter instance
// const map = mapAdapter.core.getMapInstance(); 

class MapZoomController implements IMapZoomController {
    constructor() {
        // 1. Listen for map events (conceptual MapLibre event listener)
        // map.on('zoomend', () => this.handleMapZoomEnd()); 
    }

    // Throttle the map's API call to prevent jank when setting zoom rapidly (e.g., waiting for ENTER)
    private executeZoom = throttle((zoomLevel: number) => {
        // Logic to call the actual map API: map.setZoom(zoomLevel);
        console.log(`MAP: Setting zoom to ${zoomLevel}`);
    }, 300); // 300ms delay ensures 'wait long enough' logic is met

    // UI component calls this method (Dispatches Intent)
    public setZoom(zoomLevel: number): void {
        // Perform the expensive map API call via the throttled function
        this.executeZoom(zoomLevel); 
        
        // Optimistically update the store to reflect the UI intent immediately
        store.dispatch({ zoomLevel: zoomLevel }, 'UI'); 
    }
    
    // Map Adapter calls this when the map actually finishes zooming (Updates State)
    public notifyZoomChange(zoomLevel: number): void {
        store.dispatch({ zoomLevel: zoomLevel }, 'MAP'); 
    }

    // private handleMapZoomEnd(): void {
    //     // const newZoom = map.getZoom();
    //     // this.notifyZoomChange(newZoom);
    // }
}

export const mapZoomController = new MapZoomController();