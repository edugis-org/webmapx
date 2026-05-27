import { IMap } from '../map/IMapInterfaces';
import { createMapAdapter, DEFAULT_ADAPTER_NAME } from '../map/adapter-registry';
import type { AppConfig, CatalogConfig, MapConfig, ToolsConfig } from '../config/types';
import {
  getMapScopedStorageKey,
  resolveAdapterSelection
} from '../config/adapter-resolution';
import { ToolManager } from '../tools/tool-manager';

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
  private initialStateLayersApplied = false;
    // Only one connectedCallback/disconnectedCallback allowed. Add event listener in the main one.
    connectedCallback(): void {
      this.upsertAndStyleSurface();
      this.observeSurfaceChanges();
      this.addEventListener('add-layer', this.handleLayerAddRequest as unknown as EventListener);
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
      this.removeEventListener('add-layer', this.handleLayerAddRequest as unknown as EventListener);
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
      const detail = (e.detail ?? {}) as Record<string, unknown>;
      const { beforeLayerId, afterLayerId, ...layer } = detail;
      const options = {
        ...(typeof beforeLayerId === 'string' ? { beforeLayerId } : {}),
        ...(typeof afterLayerId === 'string' ? { afterLayerId } : {}),
      };
      this.adapter.addLayer(layer, Object.keys(options).length > 0 ? options : undefined);
        }
    }

    private handleRemoveLayerEvent(e: CustomEvent) {
        if (this.adapter) {
            this.adapter.removeLayer(e.detail);
        }
    }

    private handleAddSourceEvent(e: CustomEvent) {
        if (this.adapter) {
            this.adapter.addSource(e.detail.id, e.detail.config);
        }
    }

    private handleRemoveSourceEvent(e: CustomEvent) {
        if (this.adapter) {
            this.adapter.removeSource(e.detail);
        }
    }

    private handleSetSourceDataEvent(e: CustomEvent) {
        const source = this.adapter?.getSource(e.detail.id);
        if (source) {
            source.setData(e.detail.data);
        }
    }

    private handleSuppressBusyForSource(e: CustomEvent) {
        if (this.adapter) {
            this.adapter.suppressBusySignalForSource(e.detail);
        }
    }

    private handleUnsuppressBusyForSource(e: CustomEvent) {
        if (this.adapter) {
            this.adapter.unsuppressBusySignalForSource(e.detail);
        }
    }

    /** Handles add-layer events from the layer tree */
    private async handleLayerAddRequest(e: CustomEvent) {
      const { layerInformation, checked } = e.detail;
      const adapter: any = this.adapter;
      if (!adapter) return;
      if (checked) {
        // Compose for new signature: addLayer(layerId, layerConfig, sourceConfig)
        const layer = layerInformation.layer;
        // Support multiple sources, but call addLayer for each source referenced by the layer
        let allSucceeded = true;
        for (const source of layerInformation.sources) {
          const success = await adapter.addCatalogLayer(layer.id, layer, source);
          if (!success) {
            allSucceeded = false;
            // Clean up any partial additions
            adapter.removeCatalogLayer?.(layer.id);
            break;
          }
        }
        if (!allSucceeded) {
          this.dispatchEvent(new CustomEvent('webmapx-addlayer-failed', {
            detail: { layerId: layer.id },
            bubbles: true,
            composed: true
          }));
        }
      } else {
        // Remove the layer by id
        adapter.removeCatalogLayer?.(layerInformation.layer.id);
      }
    }
  private surfaceObserver?: MutationObserver;
  private currentSurface: HTMLElement | null = null;
  private adapterInstance: IMap | null = null;
  private adapterPromise: Promise<IMap | null> | null = null;
  private configInstance: AppConfig | null = null;
  private toolManagerInstance: ToolManager | null = null;

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

  /** Returns the map instance owned by this map element. */
  public get adapter(): IMap | null {
    this.ensureAdapter();
    return this.adapterInstance;
  }

  /** Resolves once the map has been created (or null on failure). */
  public getAdapterAsync(): Promise<IMap | null> {
    this.ensureAdapter();
    return this.adapterPromise ?? Promise.resolve(this.adapterInstance);
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
   * Returns the ToolManager for this map instance.
   * Lazy-initialized on first access.
   */
  public get toolManager(): ToolManager {
    if (!this.toolManagerInstance) {
      this.toolManagerInstance = new ToolManager();

      // Set store for activeTool sync (if adapter is ready)
      if (this.adapterInstance?.store) {
        this.toolManagerInstance.setStore(this.adapterInstance.store);
      }

      // Forward tool events to map element
      this.toolManagerInstance.addEventListener('webmapx-tool-activated', (e) => {
        this.dispatchEvent(new CustomEvent('webmapx-tool-activated', {
          detail: (e as CustomEvent).detail,
          bubbles: true,
          composed: true
        }));
      });

      this.toolManagerInstance.addEventListener('webmapx-tool-deactivated', (e) => {
        this.dispatchEvent(new CustomEvent('webmapx-tool-deactivated', {
          detail: (e as CustomEvent).detail,
          bubbles: true,
          composed: true
        }));
      });
    }
    return this.toolManagerInstance;
  }

  /**
   * Sets the configuration for this map and notifies child components.
   * Dispatches a 'webmapx-config-ready' event that bubbles up.
   */
  public setConfig(config: AppConfig): void {
    this.configInstance = config;
    this.initialStateLayersApplied = false;
    this.applyCatalogToAdapter();
    this.dispatchEvent(new CustomEvent<ConfigReadyEventDetail>('webmapx-config-ready', {
      detail: { config, map: this },
      bubbles: true,
      composed: true,
    }));
    console.log(`[webmapx-map] Config set for "${this.id || 'unnamed'}":`, config);
  }

  private getScopedStorageKey(kind: 'adapter' | 'viewport'): string | null {
    return getMapScopedStorageKey(this.id, kind);
  }

  private getSavedAdapterPreference(): string | null {
    const key = this.getScopedStorageKey('adapter');
    if (!key) {
      return null;
    }

    return localStorage.getItem(key);
  }

  private resolveRequestedAdapter(): string {
    return resolveAdapterSelection({
      explicitAdapter: this.getAttribute(MAP_ADAPTER_ATTRIBUTE) ?? this.getAttribute('type'),
      savedAdapter: this.getSavedAdapterPreference(),
      configuredAdapter: this.mapConfig?.type ?? null,
      defaultAdapter: DEFAULT_ADAPTER_NAME,
    });
  }

  private ensureAdapter(): void {
    if (this.adapterInstance) {
      return;
    }
    if (this.adapterPromise) {
      return;
    }

    const requestedAdapter = this.resolveRequestedAdapter();

    this.adapterPromise = (async () => {
      const adapter = await createMapAdapter(requestedAdapter);
      if (!adapter) {
        console.error(`[webmapx-map] No adapter available for "${requestedAdapter}".`);
        return null;
      }

      this.adapterInstance = adapter;

      // If ToolManager was already created, give it the store
      if (this.toolManagerInstance && adapter.store) {
        this.toolManagerInstance.setStore(adapter.store);
      }

      this.applyCatalogToAdapter();

      this.dispatchEvent(new CustomEvent('webmapx-map-ready', {
        detail: { adapter: this.adapterInstance, map: this },
        bubbles: true,
        composed: true
      }));

      return adapter;
    })();
  }

  private applyCatalogToAdapter(): void {
    const adapter: any = this.adapterInstance;
    const catalog = this.catalogConfig;
    if (!adapter || !catalog) {
      return;
    }

    adapter.setCatalog?.(catalog);

    if (!this.initialStateLayersApplied) {
      this.initialStateLayersApplied = true;
      void this.applyInitialStateLayers(adapter, catalog);
    }
  }

  private collectInitialActiveLayerRefs(): string[] {
    const activeLayers = this.configInstance?.state?.activeLayers ?? [];
    const refs: string[] = [];

    const activeBackground = this.configInstance?.state?.activeBackground;
    if (typeof activeBackground === 'string' && activeBackground.length > 0) {
      refs.push(activeBackground);
    }

    for (const entry of activeLayers) {
      if (typeof entry === 'string') {
        refs.push(entry);
        continue;
      }

      if (!entry || typeof entry !== 'object') {
        continue;
      }

      const ref = typeof (entry as any).ref === 'string'
        ? (entry as any).ref
        : (typeof (entry as any).layerId === 'string' ? (entry as any).layerId : null);
      const visible = (entry as any).visible !== false;
      if (ref && visible) {
        refs.push(ref);
      }
    }

    return Array.from(new Set(refs));
  }

  private getCatalogLayerInformation(layerId: string): { layer: any; sources: any[] } | null {
    const catalog = this.catalogConfig;
    if (!catalog) return null;

    const layer = catalog.layers.find((entry) => entry.id === layerId);
    if (!layer) return null;

    const sourceIds = Array.from(new Set(
      layer.layerset
        .map((styleLayer) => styleLayer.source)
        .filter((source): source is string => typeof source === 'string' && source.length > 0)
    ));
    const sources = catalog.sources.filter((source) => sourceIds.includes(source.id));
    return { layer, sources };
  }

  private async applyInitialStateLayers(adapter: any, _catalog: CatalogConfig): Promise<void> {
    const activeLayerRefs = this.collectInitialActiveLayerRefs();
    for (const layerId of activeLayerRefs) {
      const layerInformation = this.getCatalogLayerInformation(layerId);
      if (!layerInformation) continue;

      let allSucceeded = true;
      for (const source of layerInformation.sources) {
        const success = await adapter.addCatalogLayer?.(layerInformation.layer.id, layerInformation.layer, source);
        if (!success) {
          allSucceeded = false;
          adapter.removeCatalogLayer?.(layerInformation.layer.id);
          break;
        }
      }

      if (!allSucceeded) {
        this.dispatchEvent(new CustomEvent('webmapx-addlayer-failed', {
          detail: { layerId: layerInformation.layer.id },
          bubbles: true,
          composed: true
        }));
      }
    }
  }
}

if (!customElements.get('webmapx-map')) {
  customElements.define('webmapx-map', WebmapxMapElement);
}
