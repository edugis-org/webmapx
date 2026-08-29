import { LitElement } from 'lit';
import { MapStateStore } from '../store/map-state-store';
import { IMapState, StateSource } from '../store/IMapState';
import type { IMap } from '../map/IMapInterfaces';
import { resolveMapAdapter, resolveMapElement } from './internal/map-context';
import type { AppConfig, CatalogConfig, LayerDataConfig, MapConfig, ToolsConfig } from '../config/types';
import type { WebmapxMapElement } from './webmapx-map';

/**
 * Base class for all WebMapX tool components.
 * Handles connection to the MapAdapter, StateStore, and Config.
 */
export abstract class WebmapxBaseTool extends LitElement {

    protected adapter: IMap | null = null;
    protected store: MapStateStore | null = null;
    private unsubscribe: (() => void) | null = null;
    private configReadyHandler: ((e: Event) => void) | null = null;
    private mapReadyHandler: ((e: Event) => void) | null = null;

    /**
     * Flag to prevent infinite loops when updating the store from the UI.
     * Set this to true before dispatching an action, and false after.
     * The handleStateChange method will ignore updates from 'UI' when this is true.
     */
    protected isSettingValue: boolean = false;

    connectedCallback(): void {
        super.connectedCallback();
        // Auto-label from toolId / tool-id attribute if not explicitly set
        if (!this.hasAttribute('aria-label') && !this.hasAttribute('aria-labelledby')) {
            const explicitLabel = this.getAttribute('label') ?? ((this as any).label as string | undefined);
            const toolId = (this as any).toolId as string | undefined
                ?? this.getAttribute('tool-id')
                ?? undefined;
            const label = explicitLabel
                ?? (toolId ? toolId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : undefined);
            if (label) {
                this.setAttribute('aria-label', label);
            }
        }
        this.bindToMap();
    }

    disconnectedCallback(): void {
        this.unsubscribeFromConfig();
        this.releaseStore();
        super.disconnectedCallback();
    }

    protected bindToMap(): void {
        this.releaseStore();
        const adapter = resolveMapAdapter(this);
        if (!adapter) {
            this.subscribeToMapReady();
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
        this.unsubscribeFromMapReady();
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.store = null;
        this.adapter = null;
        this.onMapDetached();
    }

    private subscribeToMapReady(): void {
        if (this.mapReadyHandler) return;

        const mapElement = resolveMapElement(this);
        if (!mapElement) return;

        this.mapReadyHandler = () => {
            this.unsubscribeFromMapReady();
            this.bindToMap();
        };

        mapElement.addEventListener('webmapx-map-ready', this.mapReadyHandler);
    }

    private unsubscribeFromMapReady(): void {
        if (!this.mapReadyHandler) return;
        const mapElement = resolveMapElement(this);
        mapElement?.removeEventListener('webmapx-map-ready', this.mapReadyHandler);
        this.mapReadyHandler = null;
    }

    /**
     * Handles updates from the Map State Store.
     * Implements the "Temporary Muting" pattern.
     */
    private handleStateChange(state: IMapState, source: StateSource) {
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
    protected onMapAttached(_adapter: IMap): void {
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
    protected abstract onStateChanged(state: IMapState): void;

    // ─────────────────────────────────────────────────────────────────────────
    // Configuration Access
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns the parent webmapx-map element, if any.
     */
    protected get mapHost(): WebmapxMapElement | null {
        return this.closest('webmapx-map') as WebmapxMapElement | null;
    }

    /**
     * Returns the full configuration from the parent map.
     */
    protected get config(): AppConfig | null {
        return this.mapHost?.config ?? null;
    }

    /**
     * Returns the map section of the config.
     */
    protected get mapConfig(): MapConfig | undefined {
        return this.config?.map;
    }

    /**
     * Returns runtime layer data from config.
     */
    protected get layerDataConfig(): LayerDataConfig | undefined {
        return this.config?.layerData ?? this.config?.catalog;
    }

    /**
     * Legacy alias kept for compatibility with existing tool code.
     */
    protected get catalogConfig(): CatalogConfig | undefined {
        return this.config?.catalog;
    }

    /**
     * Returns the tools section of the config.
     */
    protected get toolsConfig(): ToolsConfig | undefined {
        return this.config?.tools;
    }

    /**
     * Resolves a path against the config the map was loaded from.
     *
     * Every path in a config is relative to the config file, and the loader
     * resolves the ones that appear *in* it. A default that lives in a
     * component — the dataset a tool falls back to when the config names none —
     * never passes through that, so it has to be resolved here instead. Without
     * it the browser resolves the fetch against the page, which means the same
     * default points at a different directory depending on where the app's HTML
     * sits, and at the app's host rather than the config's when the two differ.
     *
     * Tool data is a config asset: it belongs under the config directory and
     * travels with the config.
     */
    protected resolveConfigAsset(path: string): string {
        const base = this.config?.baseUrl;
        if (!base) return path;
        try {
            return new URL(path, base).toString();
        } catch {
            return path;
        }
    }

    /**
     * Subscribes to config-ready events from the parent map.
     * Call this in connectedCallback if your tool needs to react to config loading.
     * Override onConfigReady to handle the config.
     */
    protected subscribeToConfig(): void {
        this.unsubscribeFromConfig();

        // If config is already available, notify immediately
        if (this.config) {
            this.onConfigReady(this.config);
        }

        // Listen for future config changes
        this.configReadyHandler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            this.onConfigReady(detail.config);
        };

        // Listen on the map host element
        this.mapHost?.addEventListener('webmapx-config-ready', this.configReadyHandler);
    }

    /**
     * Unsubscribes from config-ready events.
     */
    protected unsubscribeFromConfig(): void {
        if (this.configReadyHandler) {
            this.mapHost?.removeEventListener('webmapx-config-ready', this.configReadyHandler);
            this.configReadyHandler = null;
        }
    }

    /**
     * Called when configuration is ready or updated.
     * Override this to initialize your tool with config data.
     */
    protected onConfigReady(_config: AppConfig): void {
        // Optional override
    }
}
