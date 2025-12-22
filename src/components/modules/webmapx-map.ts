import { IMapAdapter } from '../../map/IMapAdapter';
import { createMapAdapter, DEFAULT_ADAPTER_NAME } from '../../map/adapter-registry';
import type { AppConfig, CatalogConfig, MapConfig, ToolsConfig } from '../../config/types';

const MAP_VIEW_SLOT = 'map-view';
const MAP_SURFACE_CLASS = 'webmapx-map__surface';
const MAP_ADAPTER_ATTRIBUTE = 'adapter';

/** Event detail for webmapx-config-ready */
export interface ConfigReadyEventDetail {
  config: AppConfig;
  map: WebmapxMapElement;
}

/**
 * Lightweight map wrapper that keeps the map canvas and overlay tools grouped
 * without using Shadow DOM. Consumers provide one child with slot="map-view"
 * for the mapping library plus any number of default children for tools.
 *
 * Stores configuration and makes it available to child tool components.
 * Tools can access config via `this.closest('webmapx-map')?.config`.
 */
export class WebmapxMapElement extends HTMLElement {
    // Only one connectedCallback/disconnectedCallback allowed. Add event listener in the main one.
    connectedCallback(): void {
      this.ensureAdapter();
      this.upsertAndStyleSurface();
      this.observeSurfaceChanges();
      this.addEventListener('add-layer', this.handleLayerAddRequest as EventListener);
      this.addEventListener('webmapx-add-layer', this.handleAddLayerEvent as EventListener);
      this.addEventListener('webmapx-remove-layer', this.handleRemoveLayerEvent as EventListener);
      this.addEventListener('webmapx-add-source', this.handleAddSourceEvent as EventListener);
      this.addEventListener('webmapx-remove-source', this.handleRemoveSourceEvent as EventListener);
      this.addEventListener('webmapx-set-source-data', this.handleSetSourceDataEvent as EventListener);
      this.addEventListener('webmapx-suppress-busy-for-source', this.handleSuppressBusyForSource as EventListener);
      this.addEventListener('webmapx-unsuppress-busy-for-source', this.handleUnsuppressBusyForSource as EventListener);
    }

    disconnectedCallback(): void {
      this.surfaceObserver?.disconnect();
      this.removeEventListener('add-layer', this.handleLayerAddRequest as EventListener);
      this.removeEventListener('webmapx-add-layer', this.handleAddLayerEvent as EventListener);
      this.removeEventListener('webmapx-remove-layer', this.handleRemoveLayerEvent as EventListener);
      this.removeEventListener('webmapx-add-source', this.handleAddSourceEvent as EventListener);
      this.removeEventListener('webmapx-remove-source', this.handleRemoveSourceEvent as EventListener);
      this.removeEventListener('webmapx-set-source-data', this.handleSetSourceDataEvent as EventListener);
      this.removeEventListener('webmapx-suppress-busy-for-source', this.handleSuppressBusyForSource as EventListener);
      this.removeEventListener('webmapx-unsuppress-busy-for-source', this.handleUnsuppressBusyForSource as EventListener);
    }

    private handleAddLayerEvent(e: CustomEvent) {
        if (this.adapter) {
            this.adapter.core.addLayer(e.detail);
        }
    }

    private handleRemoveLayerEvent(e: CustomEvent) {
        if (this.adapter) {
            this.adapter.core.removeLayer(e.detail);
        }
    }

    private handleAddSourceEvent(e: CustomEvent) {
        if (this.adapter) {
            this.adapter.core.addSource(e.detail.id, e.detail.config);
        }
    }

    private handleRemoveSourceEvent(e: CustomEvent) {
        if (this.adapter) {
            this.adapter.core.removeSource(e.detail);
        }
    }

    private handleSetSourceDataEvent(e: CustomEvent) {
        const source = this.adapter?.core.getSource(e.detail.id);
        if (source) {
            source.setData(e.detail.data);
        }
    }

    private handleSuppressBusyForSource(e: CustomEvent) {
        if (this.adapter) {
            this.adapter.core.suppressBusySignalForSource(e.detail);
        }
    }

    private handleUnsuppressBusyForSource(e: CustomEvent) {
        if (this.adapter) {
            this.adapter.core.unsuppressBusySignalForSource(e.detail);
        }
    }

    /** Handles add-layer events from the layer tree */
    private async handleLayerAddRequest(e: CustomEvent) {
      const { layerInformation, checked } = e.detail;
      // Use 'any' to access layerService, since it's not in IMapAdapter interface
      const adapter: any = this.adapter;
      if (!adapter || !adapter.layerService) return;
      if (checked) {
        // Compose for new signature: addLayer(layerId, layerConfig, sourceConfig)
        const layer = layerInformation.layer;
        // Support multiple sources, but call addLayer for each source referenced by the layer
        for (const source of layerInformation.sources) {
          await adapter.layerService.addLayer(layer.id, layer, source);
        }
      } else {
        // Remove the layer by id
        adapter.layerService.removeLayer(layerInformation.layer.id);
      }
    }
  private surfaceObserver?: MutationObserver;
  private currentSurface: HTMLElement | null = null;
  private adapterInstance: IMapAdapter | null = null;
  private configInstance: AppConfig | null = null;

  private upsertAndStyleSurface(): void {
    const surface = this.ensureMapViewElement();
    this.decorateMapSurface(surface);
    this.currentSurface = surface;
  }

  private ensureMapViewElement(): HTMLElement {
    const existing = this.mapElement;
    if (existing) {
      return existing;
    }

    const fallback = document.createElement('div');
    fallback.setAttribute('slot', MAP_VIEW_SLOT);
    fallback.classList.add('webmapx-map__auto-view');
    this.prepend(fallback);
    return fallback;
  }

  private decorateMapSurface(target: HTMLElement): void {
    target.classList.add(MAP_SURFACE_CLASS);
    if (!target.style.position) {
      target.style.position = 'absolute';
    }
    if (!target.style.top) {
      target.style.top = '0';
    }
    if (!target.style.right) {
      target.style.right = '0';
    }
    if (!target.style.bottom) {
      target.style.bottom = '0';
    }
    if (!target.style.left) {
      target.style.left = '0';
    }
    if (!target.style.width) {
      target.style.width = '100%';
    }
    if (!target.style.height) {
      target.style.height = '100%';
    }
    if (!target.style.background) {
      target.style.setProperty('background', 'var(--color-background-secondary, #f4f4f4)');
    }
  }

  private observeSurfaceChanges(): void {
    if (this.surfaceObserver) {
      return;
    }

    this.surfaceObserver = new MutationObserver(() => {
      const surface = this.mapElement;

      if (!surface) {
        this.upsertAndStyleSurface();
        return;
      }

      if (surface !== this.currentSurface) {
        this.decorateMapSurface(surface);
        this.currentSurface = surface;
      }
    });

    this.surfaceObserver.observe(this, { childList: true });
  }

  /** Returns the MapLibre adapter owned by this map instance. */
  public get adapter(): IMapAdapter | null {
    this.ensureAdapter();
    return this.adapterInstance;
  }

  /** Returns the element that should host the mapping library instance. */
  public get mapElement(): HTMLElement | null {
    return this.querySelector<HTMLElement>(`[slot="${MAP_VIEW_SLOT}"]`);
  }

  /** Returns the full configuration for this map. */
  public get config(): AppConfig | null {
    return this.configInstance;
  }

  /** Returns the map section of the config. */
  public get mapConfig(): MapConfig | undefined {
    return this.configInstance?.map;
  }

  /** Returns the catalog section of the config. */
  public get catalogConfig(): CatalogConfig | undefined {
    return this.configInstance?.catalog;
  }

  /** Returns the tools section of the config. */
  public get toolsConfig(): ToolsConfig | undefined {
    return this.configInstance?.tools;
  }

  /**
   * Sets the configuration for this map and notifies child components.
   * Dispatches a 'webmapx-config-ready' event that bubbles up.
   */
  public setConfig(config: AppConfig): void {
    this.configInstance = config;
    this.dispatchEvent(new CustomEvent<ConfigReadyEventDetail>('webmapx-config-ready', {
      detail: { config, map: this },
      bubbles: true,
      composed: true,
    }));
    console.log(`[webmapx-map] Config set for "${this.id || 'unnamed'}":`, config);
  }

  private ensureAdapter(): void {
    if (this.adapterInstance) {
      return;
    }

    // Priority: localStorage > attribute > default
    const savedAdapter = localStorage.getItem('webmapx-adapter');
    const attributeAdapter = this.getAttribute(MAP_ADAPTER_ATTRIBUTE);
    const requestedAdapter = savedAdapter ?? attributeAdapter ?? DEFAULT_ADAPTER_NAME;

    const adapter = createMapAdapter(requestedAdapter);
    if (!adapter) {
      console.error(`[webmapx-map] No adapter available for "${requestedAdapter}".`);
      return;
    }

    this.adapterInstance = adapter;
    this.dispatchEvent(new CustomEvent('webmapx-map-ready', {
      detail: { adapter: this.adapterInstance, map: this },
      bubbles: true,
      composed: true
    }));
  }
}

if (!customElements.get('webmapx-map')) {
  customElements.define('webmapx-map', WebmapxMapElement);
}