import { MapStateStore } from '../../store/map-state-store';
import { IMapZoomController, IMapCore } from '../IMapInterfaces';
import { throttle } from '../../utils/throttle'; // For performance during continuous input

export class MapZoomController implements IMapZoomController {
    private core: IMapCore | null = null;

    constructor(private readonly store: MapStateStore, core?: IMapCore) {
        if (core) {
            this.setCore(core);
        }
    }

    public setCore(core: IMapCore) {
        this.core = core;
        // Subscribe once to map zoom-end via core to stay library-agnostic
        this.core.onZoomEnd((level) => this.notifyZoomChange(level));
    }

    // Throttle the map's API call to prevent jank when setting zoom rapidly (e.g., waiting for ENTER)
    private executeZoom = throttle((zoomLevel: number) => {
        if (this.core) {
            this.core.setZoom(zoomLevel);
        }
    }, 300);

    // UI component calls this method (Dispatches Intent)
    public setZoom(zoomLevel: number): void {
        // Perform the expensive map API call via the throttled function
        this.executeZoom(zoomLevel); 
        
        // Optimistically update the store to reflect the UI intent immediately
        this.store.dispatch({ zoomLevel: zoomLevel }, 'UI'); 
    }
    
    // Map Adapter calls this when the map actually finishes zooming (Updates State)
    public notifyZoomChange(zoomLevel: number): void {
        this.store.dispatch({ zoomLevel: zoomLevel }, 'MAP'); 
    }
}