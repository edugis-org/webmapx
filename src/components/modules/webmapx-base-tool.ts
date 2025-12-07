import { LitElement } from 'lit';
import { MapStateStore } from '../../store/map-state-store';
import { IAppState, StateSource } from '../../store/IState';
import { IMapAdapter } from '../../map/IMapAdapter';
import { resolveMapAdapter } from './map-context';

/**
 * Base class for all WebMapX tool components.
 * Handles connection to the MapAdapter and StateStore.
 */
export abstract class WebmapxBaseTool extends LitElement {
    
    protected adapter: IMapAdapter | null = null;
    protected store: MapStateStore | null = null;
    private unsubscribe: (() => void) | null = null;

    /**
     * Flag to prevent infinite loops when updating the store from the UI.
     * Set this to true before dispatching an action, and false after.
     * The handleStateChange method will ignore updates from 'UI' when this is true.
     */
    protected isSettingValue: boolean = false;

    connectedCallback(): void {
        super.connectedCallback();
        this.bindToMap();
    }

    disconnectedCallback(): void {
        this.releaseStore();
        super.disconnectedCallback();
    }

    protected bindToMap(): void {
        this.releaseStore();
        const adapter = resolveMapAdapter(this);
        if (!adapter) {
            // If the map isn't ready, we might want to retry or wait for an event.
            // For now, we follow the existing pattern.
            return;
        }

        this.adapter = adapter;
        this.store = adapter.store;
        this.unsubscribe = this.store.subscribe(this.handleStateChange.bind(this));
        
        // Notify subclass that map is ready
        this.onMapAttached(adapter);

        // Initial state sync
        this.onStateChanged(this.store.getState());
    }

    protected releaseStore(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.store = null;
        this.adapter = null;
        this.onMapDetached();
    }

    /**
     * Handles updates from the Map State Store.
     * Implements the "Temporary Muting" pattern.
     */
    private handleStateChange(state: IAppState, source: StateSource) {
        // Ignore the state change if it came from 'UI' and this component is currently setting it.
        if (source === 'UI' && this.isSettingValue) {
            return; 
        }

        this.onStateChanged(state);
    }

    /**
     * Called when the map adapter is successfully attached.
     * Override this to get references to specific services from the adapter.
     */
    protected onMapAttached(adapter: IMapAdapter): void {
        // Optional override
    }

    /**
     * Called when the map adapter is detached.
     * Override this to clean up service references.
     */
    protected onMapDetached(): void {
        // Optional override
    }

    /**
     * Called when the store state changes (and isn't muted).
     * Override this to update your component's reactive properties.
     */
    protected abstract onStateChanged(state: IAppState): void;
}
