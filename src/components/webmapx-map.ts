import { IMap, LayerInsertOptions } from '../map/IMapInterfaces';
import { createMapAdapter, DEFAULT_ADAPTER_NAME } from '../map/adapter-registry';
import type {
  ActiveLayerStateEntry,
  AnyLayerConfig,
  AppConfig,
  CatalogConfig,
  CompositeStyleLayerConfig,
  LayerDataConfig,
  MapConfig,
  MapStyleLayer,
  SourceConfig,
  SubLayerSpec,
  ToolsConfig,
} from '../config/types';
import {
  getMapScopedStorageKey,
  resolveAdapterSelection
} from '../config/adapter-resolution';
import { saveMapState, consumeMapState } from '../map/map-state-persistence';
import { getPermalinkStateForIndex, getMapDomIndex } from '../utils/permalink';
import { ToolManager } from '../tools/tool-manager';
import {
  rememberSingleGroupInsertSlotForGroup,
  resolveSingleGroupInsertionOptionsForGroup,
} from './internal/single-group-policy';
import { resolveLegendRoleForLayer } from './internal/legend-role-policy';
import { resolveGeoJSONSources, type PagedSourceContinuation } from '../map/geojson-loader';
import { inlineLayerSources } from '../map/layer-source-resolver';
import { showToast } from '../utils/toast';
import { Webmapx3dTool } from './webmapx-3d-tool';

const MAP_VIEW_SLOT = 'map-view';
const MAP_SURFACE_CLASS = 'webmapx-map__surface';
const MAP_ADAPTER_ATTRIBUTE = 'adapter';

/** Event detail for webmapx-config-ready */
export interface ConfigReadyEventDetail {
  config: AppConfig;
  map: WebmapxMapElement;
}

type LayerInformation = {
  layer: AnyLayerConfig;
};

import type { LegendRole } from './internal/legend-role-policy';

type LayerRequest = Record<string, unknown>;
type ActiveLayerStateObject = Exclude<ActiveLayerStateEntry, string>;

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
  private activeAdapterName: string | null = null;
  private runtimeStyleLayerCounter = 0;
  private readonly styleLayerCache = new Map<string, Promise<LayerInformation | null>>();
  private readonly singleGroupInsertSlotByGroup = new Map<string, LayerInsertOptions>();
  private readonly singleGroupLegendRoleByGroup = new Map<string, LegendRole>();
  private logicalLayerOrder: string[] = [];
  private readonly logicalLayerRole = new Map<string, LegendRole>();
  private readonly dynamicLayerRequests = new Map<string, { request: LayerRequest; fallback?: LayerRequest | string; options?: LayerInsertOptions }>();
    // Only one connectedCallback/disconnectedCallback allowed. Add event listener in the main one.
    connectedCallback(): void {
      this.upsertAndStyleSurface();
      this.observeSurfaceChanges();
      this.addEventListener('add-layer', this.handleLayerAddRequest as unknown as EventListener);
      this.addEventListener('webmapx-add-layer', this.handleAddLayerEvent as unknown as EventListener);
      this.addEventListener('webmapx-remove-layer', this.handleRemoveLayerEvent as EventListener);
      this.addEventListener('webmapx-add-source', this.handleAddSourceEvent as EventListener);
      this.addEventListener('webmapx-remove-source', this.handleRemoveSourceEvent as EventListener);
      this.addEventListener('webmapx-set-source-data', this.handleSetSourceDataEvent as EventListener);
      this.addEventListener('webmapx-suppress-busy-for-source', this.handleSuppressBusyForSource as EventListener);
      this.addEventListener('webmapx-unsuppress-busy-for-source', this.handleUnsuppressBusyForSource as EventListener);
      this.addEventListener('dragover', this.handleFileDragOver);
      this.addEventListener('drop', this.handleFileDrop);
    }

    disconnectedCallback(): void {
      this.surfaceObserver?.disconnect();
      this.removeEventListener('add-layer', this.handleLayerAddRequest as unknown as EventListener);
      this.removeEventListener('webmapx-add-layer', this.handleAddLayerEvent as unknown as EventListener);
      this.removeEventListener('webmapx-remove-layer', this.handleRemoveLayerEvent as EventListener);
      this.removeEventListener('webmapx-add-source', this.handleAddSourceEvent as EventListener);
      this.removeEventListener('webmapx-remove-source', this.handleRemoveSourceEvent as EventListener);
      this.removeEventListener('webmapx-set-source-data', this.handleSetSourceDataEvent as EventListener);
      this.removeEventListener('webmapx-suppress-busy-for-source', this.handleSuppressBusyForSource as EventListener);
      this.removeEventListener('webmapx-unsuppress-busy-for-source', this.handleUnsuppressBusyForSource as EventListener);
      this.removeEventListener('dragover', this.handleFileDragOver);
      this.removeEventListener('drop', this.handleFileDrop);
    }

    private handleFileDragOver = (e: DragEvent): void => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    };

    private handleFileDrop = (e: DragEvent): void => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      e.preventDefault();
      void this.handleDroppedFiles(Array.from(files));
    };

    private async handleDroppedFiles(files: File[]): Promise<void> {
      await this.addFilesAsLayers(files);
    }

    /** Public API for tools to trigger file import (same logic as dropping files on the map). */
    public async addFilesAsLayers(files: File[]): Promise<void> {
      this.adapter?.store.dispatch({ mapBusy: true }, 'UI');
      try {
        await this.processDroppedFiles(files);
      } finally {
        this.adapter?.store.dispatch({ mapBusy: false }, 'UI');
      }
    }

    /**
     * If a single dropped file is a webmapx config, stage it in IndexedDB
     * and reload the page so app init picks it up.
     */
    private async tryHandleDroppedConfig(files: File[]): Promise<boolean> {
      if (files.length !== 1) return false;
      const file = files[0];
      const { sniffFile } = await import('../utils/file-sniff');
      const result = await sniffFile(file);
      if (result.kind !== 'webmapx-config') return false;

      const { storeDroppedConfig } = await import('../utils/dropped-config');
      await storeDroppedConfig(await file.text());
      window.location.reload();
      return true;
    }

    private async processDroppedFiles(files: File[]): Promise<void> {
      if (await this.tryHandleDroppedConfig(files)) {
        return;
      }
      const { sniffBlob } = await import('../utils/file-sniff');
      const { groupDroppedFiles, buildLayerConfigFromGroup } = await import('../utils/dropped-layer-builder');
      type FileSniffResult = Awaited<ReturnType<typeof sniffBlob>>;
      const formatResult = (name: string, size: number, result: FileSniffResult, indent: string): string[] => {
        const sizeKb = (size / 1024).toFixed(1);
        const lines = [`${indent}${name} (${sizeKb} KB): ${result.description}`];
        for (const child of result.children ?? []) {
          lines.push(...formatResult(child.path, child.size, child.result, indent + '  '));
        }
        return lines;
      };

      const groups = await groupDroppedFiles(files);
      const unhandled: string[] = [];
      for (const group of groups) {
        const config = await buildLayerConfigFromGroup(group);
        if (config) {
          if (this.adapter?.hasLayer(config.id)) {
            const baseId = config.id;
            let n = 1;
            while (this.adapter.hasLayer(`${baseId}_${n}`)) n++;
            const newId = `${baseId}_${n}`;
            const prefix = `${baseId}:`;
            const newPrefix = `${newId}:`;
            config.id = newId;
            config.sources = Object.fromEntries(
              Object.entries(config.sources ?? {}).map(([key, value]) => [
                key.startsWith(prefix) ? newPrefix + key.slice(prefix.length) : key,
                value,
              ])
            );
            config.layers = (config.layers ?? []).map((layer) => ({
              ...layer,
              id: layer.id?.startsWith(prefix) ? newPrefix + layer.id.slice(prefix.length) : layer.id,
              source: layer.source?.startsWith(prefix) ? newPrefix + layer.source.slice(prefix.length) : layer.source,
            }));
          }
          console.log('addLayer()');
          await this.addLayerRequest(config as unknown as Record<string, unknown>);
          continue;
        }
        for (const item of group) {
          const result = await sniffBlob(item.blob);
          unhandled.push(...formatResult(item.name, item.blob.size, result, ''));
        }
      }
      if (unhandled.length > 0) {
        void showToast(unhandled.join('<br>'), { variant: 'warning', duration: 16000 });
      }
    }

    private async handleAddLayerEvent(e: CustomEvent) {
      const detail = (e.detail ?? {}) as Record<string, unknown>;
      const options = {
        ...(typeof detail.beforeLayerId === 'string' ? { beforeLayerId: detail.beforeLayerId } : {}),
        ...(typeof detail.afterLayerId === 'string' ? { afterLayerId: detail.afterLayerId } : {}),
      };

      const fallbackFromPayload = this.resolveFallbackFromRequest(detail);
      const success = await this.addLayerRequest(detail, fallbackFromPayload, options);
      if (!success) {
        const catalogLayerId = this.resolveCatalogLayerIdFromAddLayerDetail(detail);
        this.dispatchEvent(new CustomEvent('webmapx-addlayer-failed', {
          detail: {
            ...(catalogLayerId ? { layerId: catalogLayerId } : {}),
            request: detail,
          },
          bubbles: true,
          composed: true
        }));
      }
    }

    private handleRemoveLayerEvent(e: CustomEvent) {
        this.removeInlineLayer(e.detail);
    }

    /**
     * Removes a layer added via addLayerRequest and clears its tracking
     * (logical order, legend role) so later background insertions stay correct.
     */
    public removeInlineLayer(layerId: string): void {
        if (!this.adapter) return;
        this.dynamicLayerRequests.delete(layerId);
        this.adapter.removeLayer(layerId);
        this.removeFromLogicalOrder(layerId);
        this.logicalLayerRole.delete(layerId);
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
      const detail = this.toRecord(e.detail);
      const layerInformation = this.toLayerInformation(detail?.layerInformation);
      const checked = detail?.checked === true;
      const selectionGroup = typeof detail?.selectionGroup === 'string' && detail.selectionGroup.length > 0
        ? detail.selectionGroup
        : null;
      const adapter = this.adapter;
      if (!adapter) return;
      if (checked) {
        const requestedLayerId = typeof layerInformation?.layer?.id === 'string' ? layerInformation.layer.id : null;
        if (!requestedLayerId) return;

        const success = await this.tryAddLayerRequest(adapter, { layerId: requestedLayerId }, undefined, new Set<string>(), selectionGroup ?? undefined);
        if (success) {
          this.dynamicLayerRequests.set(requestedLayerId, { request: { layerId: requestedLayerId } });
        } else {
          this.dispatchEvent(new CustomEvent('webmapx-addlayer-failed', {
            detail: { layerId: requestedLayerId },
            bubbles: true,
            composed: true
          }));
        }
      } else {
        // Remove the layer by id
        if (layerInformation) {
          this.dynamicLayerRequests.delete(layerInformation.layer.id);
          this.rememberSingleGroupInsertSlot(adapter, layerInformation.layer.id, selectionGroup ?? undefined);
          this.removeFromLogicalOrder(layerInformation.layer.id);
          this.logicalLayerRole.delete(layerInformation.layer.id);
          adapter.removeLogicalLayer(layerInformation.layer.id);
        }
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

  /** Returns runtime layer data from config. */
  public get layerDataConfig(): LayerDataConfig | undefined {
    return this.configInstance?.layerData ?? this.configInstance?.catalog;
  }

  /** Returns the catalog section of the config (legacy alias). */
  public get catalogConfig(): CatalogConfig | undefined {
    return this.configInstance?.catalog;
  }

  /** Returns the tools section of the config. */
  public get toolsConfig(): ToolsConfig | undefined {
    return this.configInstance?.tools;
  }

  public async addLayerRequest(
    layerRequest: LayerRequest,
    fallbackLayer?: LayerRequest | string,
    options?: LayerInsertOptions,
  ): Promise<boolean> {
    const adapter = this.adapter;
    if (!adapter) {
      return false;
    }

    const beforeIds = new Set(Object.keys(adapter.store.getState().mapLayers ?? {}));
    const visitedLayerIds = new Set<string>();
    const primarySuccess = await this.tryAddLayerRequest(adapter, layerRequest, options, visitedLayerIds);
    if (primarySuccess) {
      const afterIds = Object.keys(adapter.store.getState().mapLayers ?? {});
      for (const id of afterIds) {
        if (!beforeIds.has(id)) {
          this.dynamicLayerRequests.set(id, { request: layerRequest, fallback: fallbackLayer, options });
        }
      }
      return true;
    }

    if (!fallbackLayer) {
      return false;
    }

    if (typeof fallbackLayer === 'string') {
      return this.tryAddLayerRequest(adapter, { layerId: fallbackLayer }, options, visitedLayerIds);
    }

    return this.tryAddLayerRequest(adapter, fallbackLayer, options, visitedLayerIds);
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
    void this.applyCatalogToAdapter();
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

  /** Save full map state (viewport + dynamic layers + optional projection) to sessionStorage. */
  public saveState(extra?: { projection?: string }): void {
    if (!this.id) return;
    const viewport = this.adapter?.getViewportState();
    const layers = [...this.dynamicLayerRequests.values()];
    saveMapState(this.id, {
      ...(viewport ? { viewport } : {}),
      ...(layers.length > 0 ? { layers } : {}),
      ...(extra?.projection ? { projection: extra.projection } : {}),
    });
  }

  /** Set projection. If engine doesn't support it at runtime, save state and reload. */
  public setProjection(projection: string): void {
    if (!this.adapter) return;
    const success = this.adapter.setProjection(projection);
    if (!success) {
      this.saveState({ projection });
      window.location.reload();
    }
  }

  private async restoreState(): Promise<void> {
    if (!this.id) return;
    const state = consumeMapState(this.id);
    if (!state) return;
    for (const entry of state.layers ?? []) {
      await this.addLayerRequest(
        entry.request as LayerRequest,
        entry.fallback as LayerRequest | string | undefined,
        entry.options as LayerInsertOptions | undefined,
      );
    }
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
      this.activeAdapterName = requestedAdapter;

      // If ToolManager was already created, give it the store
      if (this.toolManagerInstance && adapter.store) {
        this.toolManagerInstance.setStore(adapter.store);
      }

      void this.applyCatalogToAdapter();

      this.dispatchEvent(new CustomEvent('webmapx-map-ready', {
        detail: { adapter: this.adapterInstance, map: this },
        bubbles: true,
        composed: true
      }));

      return adapter;
    })();
  }

  private async applyCatalogToAdapter(): Promise<void> {
    const adapter = this.adapterInstance;
    const layerData = this.layerDataConfig;
    if (!adapter || !layerData) {
      return;
    }

    if (!this.initialStateLayersApplied) {
      this.initialStateLayersApplied = true;
      void this.applyInitialStateLayers(adapter, layerData);
    }
  }

  private collectInitialActiveLayerRefs(): string[] {
    const permalinkState = getPermalinkStateForIndex(getMapDomIndex(this));
    if (permalinkState?.l?.length) return permalinkState.l;

    const activeLayers = this.configInstance?.state?.activeLayers;
    if (!activeLayers) {
      const layers = this.configInstance?.layerData?.layers ?? [];
      return layers
        .map((layer) => (typeof layer?.id === 'string' ? layer.id : null))
        .filter((id): id is string => id !== null);
    }
    const refs: string[] = [];

    for (const entry of activeLayers) {
      if (typeof entry === 'string') {
        refs.push(entry);
        continue;
      }

      if (!entry || typeof entry !== 'object') {
        continue;
      }

      const activeEntry = entry as ActiveLayerStateObject;
      const ref = typeof activeEntry.ref === 'string'
        ? activeEntry.ref
        : (typeof activeEntry.layerId === 'string' ? activeEntry.layerId : null);
      const visible = activeEntry.visible !== false;
      if (ref && visible) {
        refs.push(ref);
      }
    }

    return Array.from(new Set(refs));
  }

  private getBackgroundSeedLayerId(): string | null {
    const refs = this.collectInitialActiveLayerRefs();
    return refs.length > 0 ? refs[0] : null;
  }

  private collectSingleSelectionGroupByLayerId(): Map<string, string> {
    const index = new Map<string, string>();
    const layers = this.layerDataConfig?.layers;
    if (!Array.isArray(layers)) {
      return index;
    }

    for (const layer of layers) {
      const metadata = this.getLayerMetadata(layer);
      const explicitKey =
        (typeof layer.singleGroup === 'string' ? layer.singleGroup : null)
        ?? (typeof metadata?.singleSelectionGroupKey === 'string' ? metadata.singleSelectionGroupKey : null)
        ?? (typeof metadata?.selectionGroup === 'string' ? metadata.selectionGroup : null)
        ?? (typeof metadata?.['webmapx:selectionGroup'] === 'string' ? metadata['webmapx:selectionGroup'] : null);

      if (explicitKey && explicitKey.length > 0) {
        index.set(layer.id, explicitKey);
      }
    }

    return index;
  }

  private getSingleSelectionGroupKeyForLayer(layerId: string, preferredGroupKey?: string): string | null {
    if (typeof preferredGroupKey === 'string' && preferredGroupKey.length > 0) {
      return preferredGroupKey;
    }

    return this.collectSingleSelectionGroupByLayerId().get(layerId) ?? null;
  }

  private insertIntoLogicalOrder(layerId: string, options?: LayerInsertOptions): void {
    this.logicalLayerOrder = this.logicalLayerOrder.filter((id) => id !== layerId);
    if (options?.beforeLayerId) {
      const index = this.logicalLayerOrder.indexOf(options.beforeLayerId);
      if (index >= 0) {
        this.logicalLayerOrder.splice(index, 0, layerId);
        return;
      }
    }
    this.logicalLayerOrder.push(layerId);
  }

  private removeFromLogicalOrder(layerId: string): void {
    this.logicalLayerOrder = this.logicalLayerOrder.filter((id) => id !== layerId);
  }

  private computeInsertOptionsForLayer(legendRole: LegendRole, explicitOptions?: LayerInsertOptions): LayerInsertOptions | undefined {
    if (explicitOptions?.beforeLayerId || explicitOptions?.afterLayerId) {
      return explicitOptions;
    }
    if (legendRole === 'background') {
      const firstOverlayId = this.logicalLayerOrder.find((id) => (this.logicalLayerRole.get(id) ?? 'overlay') !== 'background');
      return firstOverlayId ? { beforeLayerId: firstOverlayId } : undefined;
    }
    return undefined;
  }

  private rememberSingleGroupInsertSlot(adapter: IMap, layerId: string, preferredGroupKey?: string): void {
    const groupKey = this.getSingleSelectionGroupKeyForLayer(layerId, preferredGroupKey);
    if (!groupKey) {
      return;
    }

    rememberSingleGroupInsertSlotForGroup(
      groupKey,
      layerId,
      this.logicalLayerOrder,
      adapter.store.getState().mapLayers as Record<string, unknown> | undefined,
      this.singleGroupInsertSlotByGroup,
      this.singleGroupLegendRoleByGroup,
    );
  }

  private resolveSingleGroupInsertionOptions(
    layerId: string,
    baseOptions?: LayerInsertOptions,
    preferredGroupKey?: string,
  ): LayerInsertOptions | undefined {
    const groupKey = this.getSingleSelectionGroupKeyForLayer(layerId, preferredGroupKey);
    if (!groupKey) {
      return baseOptions;
    }

    return resolveSingleGroupInsertionOptionsForGroup(
      groupKey,
      this.logicalLayerOrder,
      baseOptions,
      this.singleGroupInsertSlotByGroup,
    );
  }

  private resolveCatalogLegendRole(layerId: string, layer: AnyLayerConfig, preferredGroupKey?: string): LegendRole {
    const metadata = this.getLayerMetadata(layer);
    const resolvedGroupKey = this.getSingleSelectionGroupKeyForLayer(layerId, preferredGroupKey) ?? undefined;

    return resolveLegendRoleForLayer(
      layerId,
      metadata,
      resolvedGroupKey,
      this.singleGroupLegendRoleByGroup,
      this.getBackgroundSeedLayerId(),
      this.collectSingleSelectionGroupByLayerId(),
    );
  }


  private getConfiguredLayerInformation(layerId: string): LayerInformation | null {
    const layerData = this.layerDataConfig;
    if (!layerData) return null;

    const layer = layerData.layers?.find((entry) => entry.id === layerId);
    if (!layer) return null;

    return { layer };
  }

  private resolveResourceUrl(value: string, baseUrl: string): string {
    try {
      const resolved = new URL(value, baseUrl).toString();
      // Keep tile-template placeholders intact; URL serialization encodes `{`/`}` to `%7B`/`%7D`.
      return resolved
        .replace(/%7B/gi, '{')
        .replace(/%7D/gi, '}');
    } catch {
      return value;
    }
  }

  private resolveStyleBackedSource(sourceId: string, scopedSourceId: string, sourceDef: Record<string, unknown>, styleUrl: string): any | null {
    const type = sourceDef.type;
    if (type !== 'vector' && type !== 'raster' && type !== 'geojson') {
      return null;
    }

    if (type === 'vector') {
      const rawUrl = typeof sourceDef.url === 'string' ? sourceDef.url : null;
      const rawTiles = Array.isArray(sourceDef.tiles)
        ? sourceDef.tiles.filter((entry): entry is string => typeof entry === 'string')
        : [];
      const attribution = typeof sourceDef.attribution === 'string' ? sourceDef.attribution : undefined;
      const minzoom = typeof sourceDef.minzoom === 'number' ? sourceDef.minzoom : undefined;
      const maxzoom = typeof sourceDef.maxzoom === 'number' ? sourceDef.maxzoom : undefined;
      if (!rawUrl && rawTiles.length === 0) return null;
      return {
        id: scopedSourceId,
        type: 'vector',
        ...(rawUrl ? { url: this.resolveResourceUrl(rawUrl, styleUrl) } : {}),
        ...(rawTiles.length > 0 ? { tiles: rawTiles.map((tile) => this.resolveResourceUrl(tile, styleUrl)) } : {}),
        ...(minzoom !== undefined ? { minzoom } : {}),
        ...(maxzoom !== undefined ? { maxzoom } : {}),
        ...(attribution ? { attribution } : {}),
      };
    }

    if (type === 'raster') {
      const rawTiles = Array.isArray(sourceDef.tiles) ? sourceDef.tiles.filter((entry): entry is string => typeof entry === 'string') : [];
      const attribution = typeof sourceDef.attribution === 'string' ? sourceDef.attribution : undefined;
      if (rawTiles.length === 0) return null;
      return {
        id: scopedSourceId,
        type: 'raster',
        service: 'xyz',
        url: rawTiles.map((tile) => this.resolveResourceUrl(tile, styleUrl)),
        tileSize: typeof sourceDef.tileSize === 'number' ? sourceDef.tileSize : undefined,
        minzoom: typeof sourceDef.minzoom === 'number' ? sourceDef.minzoom : undefined,
        maxzoom: typeof sourceDef.maxzoom === 'number' ? sourceDef.maxzoom : undefined,
        ...(attribution ? { attribution } : {}),
      };
    }

    const rawData = sourceDef.data;
    const attribution = typeof sourceDef.attribution === 'string' ? sourceDef.attribution : undefined;
    if (typeof rawData !== 'string') {
      return null;
    }
    return {
      id: scopedSourceId,
      type: 'geojson',
      data: this.resolveResourceUrl(rawData, styleUrl),
      ...(attribution ? { attribution } : {}),
    };
  }

  private async expandStyleBackedLayer(layer: AnyLayerConfig): Promise<LayerInformation | null> {
    const composite = layer.type === 'style' ? (layer as CompositeStyleLayerConfig) : null;
    const styleUrl = composite?.url ?? null;
    const layerId = layer.id;
    const scopedPrefix = `style:${layerId}:`;
    const cacheKey = `${layerId}::${styleUrl ?? ''}`;
    if (!styleUrl) {
      return null;
    }

    const cached = this.styleLayerCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const promise = (async () => {
      try {
        const response = await fetch(styleUrl);
        if (!response.ok) {
          return null;
        }

        const styleDoc = this.toRecord(await response.json());
        return this.buildExpandedStyleLayer(layer, styleDoc, styleUrl, scopedPrefix);
      } catch {
        return null;
      }
    })();

    this.styleLayerCache.set(cacheKey, promise);
    return promise;
  }

  private buildExpandedStyleLayer(
    layer: AnyLayerConfig,
    styleDoc: Record<string, unknown> | null,
    styleUrl: string | null,
    scopedPrefix?: string,
  ): LayerInformation | null {
    // Support edugis fragment format: {source: {sources, layers}} instead of top-level sources/layers
    const styleDocNorm = (styleDoc && !styleDoc.sources && !styleDoc.layers && styleDoc.source && typeof styleDoc.source === 'object')
      ? (styleDoc.source as Record<string, unknown>)
      : styleDoc;
    const styleSources = this.toRecord(styleDocNorm?.sources);
    const styleLayers = Array.isArray(styleDocNorm?.layers)
      ? styleDocNorm.layers.map((entry) => this.toRecord(entry)).filter((entry): entry is Record<string, unknown> => !!entry)
      : [];
    if (!styleSources || styleLayers.length === 0) {
      return null;
    }

    const effectivePrefix = scopedPrefix ?? `style:${layer.id}:`;
    const supportedLayerTypes = new Set(['background', 'fill', 'line', 'circle', 'symbol', 'raster', 'fill-extrusion', 'hillshade']);
    const sourceAlias = new Map<string, string>();
    const normalizedLayers: SubLayerSpec[] = styleLayers
      .filter((entry) => typeof entry.type === 'string' && supportedLayerTypes.has(entry.type))
      .map((entry) => {
        const mappedSource = typeof entry.source === 'string'
          ? `${effectivePrefix}${entry.source}`
          : undefined;
        if (typeof entry.source === 'string' && mappedSource) {
          sourceAlias.set(entry.source, mappedSource);
        }
        return {
          id: typeof entry.id === 'string' ? `style:${entry.id}` : undefined,
          type: entry.type as string,
          source: mappedSource,
          'source-layer': (entry['source-layer'] ?? entry.sourceLayer) as string | undefined,
          minzoom: (entry.minzoom ?? entry.minZoom) as number | undefined,
          maxzoom: (entry.maxzoom ?? entry.maxZoom) as number | undefined,
          paint: entry.paint as Record<string, unknown> | undefined,
          layout: entry.layout as Record<string, unknown> | undefined,
          filter: entry.filter as unknown[] | undefined,
        };
      });

    const requiredSourceIds = new Set<string>(
      normalizedLayers
        .map((entry) => entry.source)
        .filter((sourceId: unknown): sourceId is string => typeof sourceId === 'string' && sourceId.length > 0)
    );

    // Build inline sources record (keyed by scoped id)
    const inlineSources: Record<string, unknown> = {};
    for (const [originalSourceId, scopedSourceId] of sourceAlias.entries()) {
      if (!requiredSourceIds.has(scopedSourceId)) continue;
      const styleSource = this.toRecord(styleSources[originalSourceId]);
      if (!styleSource) continue;
      const normalizedSource = styleUrl
        ? this.resolveStyleBackedSource(originalSourceId, scopedSourceId, styleSource, styleUrl)
        : this.resolveInlineStyleSource(scopedSourceId, styleSource);
      if (normalizedSource) {
        inlineSources[scopedSourceId] = { ...normalizedSource };
      }
    }

    const inlineSourceIds = new Set(Object.keys(inlineSources));
    const filteredLayers = normalizedLayers.filter((entry) => !entry.source || inlineSourceIds.has(entry.source));
    if (filteredLayers.length === 0 || inlineSourceIds.size === 0) {
      return null;
    }

    const expandedLayer: CompositeStyleLayerConfig = {
      id: layer.id,
      type: 'style',
      title: layer.title,
      singleGroup: layer.singleGroup,
      fallbackLayerId: layer.fallbackLayerId,
      minzoom: layer.minzoom,
      maxzoom: layer.maxzoom,
      metadata: {
        ...(this.getLayerMetadata(layer) ?? {}),
        styleUrl: styleUrl ?? undefined,
        styleSpriteUrl: typeof styleDoc?.sprite === 'string' && styleUrl
          ? this.resolveResourceUrl(styleDoc.sprite, styleUrl)
          : (typeof styleDoc?.sprite === 'string' ? styleDoc.sprite : undefined),
        styleGlyphsUrl: typeof styleDoc?.glyphs === 'string' && styleUrl
          ? this.resolveResourceUrl(styleDoc.glyphs, styleUrl)
          : (typeof styleDoc?.glyphs === 'string' ? styleDoc.glyphs : undefined),
      },
      sources: inlineSources,
      layers: filteredLayers,
    };

    return { layer: expandedLayer };
  }

  private resolveInlineStyleSource(scopedSourceId: string, sourceDef: Record<string, unknown>): SourceConfig | null {
    const type = sourceDef.type;
    if (type !== 'vector' && type !== 'raster' && type !== 'geojson') {
      return null;
    }

    if (type === 'vector') {
      const rawUrl = typeof sourceDef.url === 'string' ? sourceDef.url : null;
      const rawTiles = Array.isArray(sourceDef.tiles)
        ? sourceDef.tiles.filter((entry): entry is string => typeof entry === 'string')
        : [];
      if (!rawUrl && rawTiles.length === 0) {
        return null;
      }

      if (!rawUrl && rawTiles.length === 0) return null;
      return {
        id: scopedSourceId,
        type: 'vector' as const,
        url: rawUrl ?? rawTiles[0] ?? '',
        ...(rawTiles.length > 0 ? { tiles: rawTiles } : {}),
        ...(typeof sourceDef.minzoom === 'number' ? { minzoom: sourceDef.minzoom } : {}),
        ...(typeof sourceDef.maxzoom === 'number' ? { maxzoom: sourceDef.maxzoom } : {}),
        ...(typeof sourceDef.attribution === 'string' ? { attribution: sourceDef.attribution } : {}),
      };
    }

    if (type === 'raster') {
      const rawTiles = Array.isArray(sourceDef.tiles)
        ? sourceDef.tiles.filter((entry): entry is string => typeof entry === 'string')
        : [];
      if (rawTiles.length === 0) {
        return null;
      }

      return {
        id: scopedSourceId,
        type: 'raster',
        service: 'xyz',
        url: rawTiles,
        ...(typeof sourceDef.tileSize === 'number' ? { tileSize: sourceDef.tileSize } : {}),
        ...(typeof sourceDef.minzoom === 'number' ? { minzoom: sourceDef.minzoom } : {}),
        ...(typeof sourceDef.maxzoom === 'number' ? { maxzoom: sourceDef.maxzoom } : {}),
        ...(typeof sourceDef.attribution === 'string' ? { attribution: sourceDef.attribution } : {}),
      };
    }

    const rawData = sourceDef.data;
    if (typeof rawData !== 'string') {
      return null;
    }

    return {
      id: scopedSourceId,
      type: 'geojson',
      data: rawData,
      ...(typeof sourceDef.attribution === 'string' ? { attribution: sourceDef.attribution } : {}),
    };
  }

  private async getLayerInformation(layerId: string): Promise<LayerInformation | null> {
    const baseLayerInformation = this.getConfiguredLayerInformation(layerId);
    if (!baseLayerInformation) {
      return null;
    }

    if (!this.isStyleBackedLayer(baseLayerInformation.layer)) {
      return baseLayerInformation;
    }

    return this.expandStyleBackedLayer(baseLayerInformation.layer);
  }

  private resolveCatalogLayerIdFromAddLayerDetail(detail: Record<string, unknown>): string | null {
    const candidates = [detail.catalogLayerId, detail.layerId, detail.ref];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && this.getConfiguredLayerInformation(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  private isStyleRequest(detail: Record<string, unknown>): boolean {
    const inlineStyle = this.toRecord(detail.style);
    if (inlineStyle) {
      return true;
    }

    if (typeof detail.styleUrl === 'string' && detail.styleUrl.length > 0) {
      return true;
    }

    return false;
  }

  private resolveStyleUrlFromRequest(detail: Record<string, unknown>): string | null {
    if (typeof detail.styleUrl === 'string' && detail.styleUrl.length > 0) {
      return detail.styleUrl;
    }
    return null;
  }

  private resolveFallbackFromRequest(detail: Record<string, unknown>): Record<string, unknown> | string | undefined {
    const fallbackLayer = this.toRecord(detail.fallbackLayer);
    if (fallbackLayer) {
      return fallbackLayer;
    }

    const fallbackCandidates = [detail.fallbackLayerId, detail.fallbackRef, detail.fallback];
    for (const candidate of fallbackCandidates) {
      if (typeof candidate === 'string' && candidate.length > 0) {
        return candidate;
      }
    }

    return undefined;
  }

  private async tryAddLayerRequest(
    adapter: IMap,
    layerRequest: LayerRequest,
    options?: LayerInsertOptions,
    visitedLayerIds = new Set<string>(),
    preferredGroupKey?: string,
  ): Promise<boolean> {
    const catalogLayerId = this.resolveCatalogLayerIdFromAddLayerDetail(layerRequest);
    if (catalogLayerId) {
      if (visitedLayerIds.has(catalogLayerId)) {
        return false;
      }
      visitedLayerIds.add(catalogLayerId);

      const baseLayerInformation = this.getConfiguredLayerInformation(catalogLayerId);
      if (!baseLayerInformation) {
        return false;
      }

      const styleBacked = this.isStyleBackedLayer(baseLayerInformation.layer);
      const layerInformation = styleBacked
        ? await this.expandStyleBackedLayer(baseLayerInformation.layer)
        : baseLayerInformation;

      if (layerInformation && (!styleBacked || !this.hasUnsupportedStyleComponents(layerInformation))) {
        const singleSelectionGroupKey = this.getSingleSelectionGroupKeyForLayer(catalogLayerId, preferredGroupKey);
        const legendRole = this.resolveCatalogLegendRole(catalogLayerId, layerInformation.layer, singleSelectionGroupKey ?? undefined);
        const singleGroupOptions = this.resolveSingleGroupInsertionOptions(catalogLayerId, options, preferredGroupKey);
        const layerInsertOptions = this.computeInsertOptionsForLayer(legendRole, singleGroupOptions);
        const layerInformationWithLegendRole: LayerInformation = {
          ...layerInformation,
          layer: {
            ...layerInformation.layer,
            metadata: {
              ...(this.getLayerMetadata(layerInformation.layer) ?? {}),
              legendRole,
              ...(singleSelectionGroupKey ? { singleSelectionGroupKey } : {}),
            },
          },
        };

        const success = await this.addLogicalLayerInternal(adapter, layerInformationWithLegendRole, layerInsertOptions);
        if (success) {
          const groupKey = this.getSingleSelectionGroupKeyForLayer(catalogLayerId, preferredGroupKey);
          if (groupKey) {
            this.singleGroupInsertSlotByGroup.delete(groupKey);
          }
          return true;
        }
      }

      const fallbackLayerId = this.getConfiguredFallbackLayerId(baseLayerInformation.layer);
      if (!fallbackLayerId) {
        return false;
      }

      return this.tryAddLayerRequest(adapter, { layerId: fallbackLayerId }, options, visitedLayerIds, preferredGroupKey);
    }

    // If the request looks like a catalog reference (has layerId/ref/catalogLayerId) but
    // was not resolved above, stop here — don't fall through to addInlineLayerWithTracking
    // with an incomplete spec (e.g. {layerId:'foo'} has no type/source and crashes MapLibre).
    const hasCatalogRef = typeof layerRequest.layerId === 'string'
      || typeof layerRequest.catalogLayerId === 'string'
      || typeof layerRequest.ref === 'string';
    if (hasCatalogRef) return false;

    if (this.isStyleRequest(layerRequest)) {
      const styleLayerInformation = await this.getLayerInformationFromStyleRequest(layerRequest);
      if (!styleLayerInformation || this.hasUnsupportedStyleComponents(styleLayerInformation)) {
        return false;
      }
      return this.addLogicalLayerInternal(adapter, styleLayerInformation);
    }

    const {
      beforeLayerId: _beforeLayerId,
      afterLayerId: _afterLayerId,
      fallbackLayer: _fallbackLayer,
      fallbackLayerId: _fallbackLayerId,
      fallbackRef: _fallbackRef,
      fallback: _fallback,
      ...nativeLayer
    } = layerRequest;
    return this.addInlineLayerWithTracking(adapter, nativeLayer, options);
  }

  private async getLayerInformationFromStyleRequest(layerRequest: LayerRequest): Promise<LayerInformation | null> {
    const inlineStyle = this.toRecord(layerRequest.style);
    const styleUrl = this.resolveStyleUrlFromRequest(layerRequest);
    if (!inlineStyle && !styleUrl) {
      return null;
    }

    const metadata = this.toRecord(layerRequest.metadata) ?? {};
    const styleRequestId = typeof layerRequest.id === 'string' && layerRequest.id.length > 0
      ? layerRequest.id
      : `runtime-style-${++this.runtimeStyleLayerCounter}`;

    if (inlineStyle) {
      return this.buildExpandedStyleLayer(
        {
          id: styleRequestId,
          type: 'style',
          metadata: {
            ...metadata,
            ...(styleUrl ? { styleUrl } : {}),
          },
        },
        inlineStyle,
        styleUrl,
      );
    }

    return this.expandStyleBackedLayer({
      id: styleRequestId,
      type: 'style',
      metadata: {
        ...metadata,
        styleUrl: styleUrl ?? undefined,
      },
    });
  }

  private toRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  private getLayerMetadata(layer: { metadata?: Record<string, unknown> } | null | undefined): Record<string, unknown> | null {
    return this.toRecord(layer?.metadata);
  }

  private isStyleBackedLayer(layer: AnyLayerConfig): boolean {
    if (layer.type !== 'style') return false;
    const composite = layer as CompositeStyleLayerConfig;
    return typeof composite.url === 'string' && composite.url.length > 0;
  }

  private getConfiguredFallbackLayerId(layer: AnyLayerConfig): string | null {
    if (typeof layer.fallbackLayerId === 'string' && layer.fallbackLayerId.length > 0) {
      return layer.fallbackLayerId;
    }

    const metadata = this.getLayerMetadata(layer);
    const fallbackLayerId = metadata?.fallbackLayerId;
    return typeof fallbackLayerId === 'string' && fallbackLayerId.length > 0 ? fallbackLayerId : null;
  }

  private isSourceTypeSupportedByActiveEngine(sourceType: string): boolean {
    const adapterName = this.activeAdapterName;
    if (adapterName === 'leaflet' || adapterName === 'cesium') {
      return sourceType === 'raster' || sourceType === 'geojson';
    }

    if (adapterName === 'maplibre' || adapterName === 'openlayers') {
      return sourceType === 'raster' || sourceType === 'geojson' || sourceType === 'vector' || sourceType === 'raster-dem';
    }

    return false;
  }

  private isSourceSupportedByActiveEngine(source: SourceConfig): boolean {
    const sourceType = typeof source?.type === 'string' ? source.type : null;
    if (!sourceType || !this.isSourceTypeSupportedByActiveEngine(sourceType)) {
      return false;
    }

    // Allmaps warpedmap:// currently has no Cesium runtime renderer.
    if (this.activeAdapterName === 'cesium' && sourceType === 'raster') {
      const rasterSource = source as any;
      const url = Array.isArray(rasterSource.url) ? rasterSource.url[0] : rasterSource.url;
      if (typeof url === 'string' && url.startsWith('warpedmap://')) {
        return false;
      }
    }

    return true;
  }

  private hasUnsupportedStyleComponents(layerInformation: LayerInformation): boolean {
    const layer = layerInformation.layer;
    if (layer.type === 'allmaps') {
      return this.activeAdapterName === 'cesium';
    }
    if (layer.type === 'style') {
      const composite = layer as CompositeStyleLayerConfig;
      const localSources = composite.sources ?? {};
      const sourceTypes = new Set<string>();
      // Check inline sources
      for (const rawSrc of Object.values(localSources)) {
        if (typeof rawSrc === 'object' && rawSrc !== null) {
          const t = (rawSrc as Record<string, unknown>).type;
          if (typeof t === 'string') sourceTypes.add(t);
        }
      }
      // Also check catalog sources referenced by sub-layers
      const subLayers = (composite as any).layers ?? [];
      for (const sub of subLayers) {
        const srcId = typeof sub?.source === 'string' ? sub.source : null;
        if (!srcId || srcId in localSources) continue;
        const catalogSrc = this.layerDataConfig?.sources?.find((s) => s.id === srcId);
        if (catalogSrc && typeof (catalogSrc as any).type === 'string') {
          sourceTypes.add((catalogSrc as any).type);
        }
      }
      if (sourceTypes.size === 0) return false;
      return Array.from(sourceTypes).some((t) => !this.isSourceTypeSupportedByActiveEngine(t));
    }
    // StandardLayerConfig
    const sourceId = (layer as any).source;
    if (!sourceId) return false;
    const source = this.layerDataConfig?.sources?.find((s) => s.id === sourceId) ?? null;
    if (!source) return false;
    return !this.isSourceSupportedByActiveEngine(source);
  }

  public async isCatalogLayerSupported(layerId: string): Promise<boolean> {
    const layerInformation = this.getConfiguredLayerInformation(layerId);
    if (!layerInformation) {
      return false;
    }

    const supportedEngines = layerInformation.layer.metadata?.supportedEngines;
    if (supportedEngines) {
      return supportedEngines.includes(this.activeAdapterName as any);
    }

    if (!this.isStyleBackedLayer(layerInformation.layer)) {
      return !this.hasUnsupportedStyleComponents(layerInformation);
    }

    const expanded = await this.expandStyleBackedLayer(layerInformation.layer);
    if (!expanded) {
      return false;
    }

    return !this.hasUnsupportedStyleComponents(expanded);
  }

  private async addLogicalLayerInternal(
    adapter: IMap,
    layerInformation: LayerInformation,
    options?: LayerInsertOptions,
  ): Promise<boolean> {
    const enriched = inlineLayerSources(layerInformation.layer, this.layerDataConfig?.sources);
    let continuations: PagedSourceContinuation[] = [];
    if (enriched.sources && typeof enriched.sources === 'object') {
      continuations = await resolveGeoJSONSources(enriched.sources);
    }
    const layer = enriched;

    // Carry source-level bounds into layer.metadata.bounds so the layer overview's
    // "zoom to layer" button can use them — registerMapLayer only sees the layer
    // config, not the resolved catalog source.
    const layerMetadata = (layer.metadata && typeof layer.metadata === 'object') ? layer.metadata as Record<string, unknown> : undefined;
    if (!layerMetadata?.bounds && typeof (layer as any).source === 'string') {
      const sourceConfig = this.layerDataConfig?.sources?.find((s) => s.id === (layer as any).source) as { bounds?: [number, number, number, number] } | undefined;
      if (sourceConfig?.bounds) {
        layer.metadata = { ...(layerMetadata ?? {}), bounds: sourceConfig.bounds };
      }
    }

    let success: boolean;
    try {
      success = await adapter.addLayer(layer, options);
    } catch {
      return false;
    }
    if (success) {
      const metadata = (layer.metadata && typeof layer.metadata === 'object') ? layer.metadata as Record<string, unknown> : {};
      const role: LegendRole = metadata.legendRole === 'background' ? 'background' : 'overlay';
      this.logicalLayerRole.set(layer.id, role);
      this.insertIntoLogicalOrder(layer.id, options);
      for (const c of continuations) {
        c.run((data) => { const src = adapter.getSource(c.id); if (!src) return false; src.setData(data); return true; });
      }
    }
    return success;
  }

  private async addInlineLayerWithTracking(adapter: IMap, nativeLayer: Record<string, unknown>, options?: LayerInsertOptions): Promise<boolean> {
    // Resolve any URL-backed geojson sources (incl. WFS paging/topojson) to
    // inline FeatureCollections before handing off to the adapter — mirrors
    // the catalog-layer path in addLogicalLayerInternal.
    let continuations: PagedSourceContinuation[] = [];
    if (nativeLayer.sources && typeof nativeLayer.sources === 'object') {
      continuations = await resolveGeoJSONSources(nativeLayer.sources as Record<string, any>);
    }
    const metadata = (nativeLayer.metadata && typeof nativeLayer.metadata === 'object') ? nativeLayer.metadata as Record<string, unknown> : {};
    const role: LegendRole = metadata.legendRole === 'background' ? 'background' : 'overlay';
    const insertOptions = this.computeInsertOptionsForLayer(role, options);
    await adapter.addLayer(nativeLayer, insertOptions && Object.keys(insertOptions).length > 0 ? insertOptions : undefined);
    const layerId = typeof nativeLayer.id === 'string' ? nativeLayer.id : null;
    if (layerId) {
      this.logicalLayerRole.set(layerId, role);
      this.insertIntoLogicalOrder(layerId, insertOptions);
    }
    for (const c of continuations) {
      c.run((data) => { const src = adapter.getSource(c.id); if (!src) return false; src.setData(data); return true; });
    }
    return true;
  }

  private async applyInitialStateLayers(adapter: IMap, _layerData: LayerDataConfig): Promise<void> {
    const activeLayerRefs = this.collectInitialActiveLayerRefs();
    for (const layerId of activeLayerRefs) {
      const success = await this.tryAddLayerRequest(adapter, { layerId });
      if (!success) {
        this.dispatchEvent(new CustomEvent('webmapx-addlayer-failed', {
          detail: { layerId },
          bubbles: true,
          composed: true
        }));
      }
    }
    await this.restoreState();
    await this.applyPermalinkState(adapter);
  }

  private async applyPermalinkState(adapter: IMap): Promise<void> {
    const state = getPermalinkStateForIndex(getMapDomIndex(this));
    if (!state) return;

    // Viewport is already applied at map init time in app.js; only layer state needs restoring here.
    if (state.h && state.h.length > 0) {
      const hiddenSet = new Set(state.h);
      const mapLayers = adapter.store.getState().mapLayers ?? {};
      const storeUpdate: Record<string, unknown> = { ...mapLayers };
      for (const layerId of state.h) {
        if (!mapLayers[layerId]) continue;
        adapter.setLayerVisibility(layerId, false);
        storeUpdate[layerId] = { ...mapLayers[layerId], visible: false };
      }
      adapter.store.dispatch({ mapLayers: storeUpdate as typeof mapLayers }, 'UI');
    }

    if (state.t) {
      const current = adapter.store.getState().mapLayers ?? {};
      const tUpdate: Record<string, unknown> = { ...current };
      for (const [layerId, transparency] of Object.entries(state.t)) {
        const entry = current[layerId];
        if (!entry) continue;
        adapter.setLayerOpacity(layerId, (100 - transparency) / 100);
        tUpdate[layerId] = { ...entry, transparency };
      }
      adapter.store.dispatch({ mapLayers: tUpdate as typeof current }, 'UI');
    }

    if (state.terrain) {
      adapter.store.dispatch({ terrainEnabled: true }, 'UI');
    }

    // Notify user about layers from the permalink that could not be loaded.
    // Exclude the auto-managed terrain hillshade layer — the 3D tool re-adds it
    // asynchronously when state.terrain is true, so it won't be in loadedLayers yet.
    const loadedLayers = adapter.store.getState().mapLayers ?? {};
    const missingLayers = state.l.filter(id =>
      !loadedLayers[id] && !(state.terrain && id === Webmapx3dTool.TERRAIN_LAYER_ID)
    );
    if (missingLayers.length > 0) {
      void this.showPermalinkMissingLayersToast(missingLayers);
    }
  }

  private showPermalinkMissingLayersToast(missingLayers: string[]): void {
    const count = missingLayers.length;
    void showToast(
      `<strong>${count} layer${count > 1 ? 's' : ''} from the permalink could not be restored</strong><br>
      Layers may have been imported from files (not stored in permalink) or the map config may have changed:<br>
      <em>${missingLayers.join(', ')}</em>`,
      { variant: 'warning', duration: 16000 },
    );
  }

  private toLayerInformation(value: unknown): LayerInformation | null {
    const record = this.toRecord(value);
    const layerRecord = this.toRecord(record?.layer);
    if (!layerRecord) return null;

    const layerId = typeof layerRecord.id === 'string' ? layerRecord.id : null;
    const layerType = typeof layerRecord.type === 'string' ? layerRecord.type : null;
    if (!layerId || !layerType) return null;

    return { layer: layerRecord as unknown as AnyLayerConfig };
  }

  private isSubLayerSpec(value: unknown): value is SubLayerSpec {
    const record = this.toRecord(value);
    return !!record && typeof record.type === 'string';
  }

  private isSourceConfig(value: unknown): value is SourceConfig {
    const record = this.toRecord(value);
    return !!record && typeof record.id === 'string' && typeof record.type === 'string';
  }
}

if (!customElements.get('webmapx-map')) {
  customElements.define('webmapx-map', WebmapxMapElement);
}
