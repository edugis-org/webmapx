// src/map/base-adapter.ts
//
// Abstract base for all engine adapters. Centralises generic bookkeeping so
// engine-specific code stays engine-only.
//
// Contract for engine implementors:
//   - Implement engineAddLayer  / engineRemoveLayer for the actual engine work.
//   - Do NOT call registerMapLayer / unregisterMapLayer inside engine services —
//     that is handled here, after the engine confirms success.
//   - removeSource that cascades to layer removal must call engineRemoveLayer (or
//     directly unregisterMapLayer) for each implicitly removed layer. This is a
//     known remaining exception because only the engine knows the source→layer
//     mapping at removal time.

import { MapStateStore } from '../store/map-state-store';
import { registerMapLayer, unregisterMapLayer, reorderMapLayers } from './map-layer-registry';
import type { IMapCore, ISource, LayerInsertOptions, MarkerOptions } from './IMapInterfaces';
import type { CompositeStyleLayerConfig } from '../config/types';
import type { LngLat } from '../store/map-events';
import { MapEventBus } from '../store/map-events';
import type { DeferredLogicalLayerExecutor } from './logical-layer-executor';
import { ensureApiKeysLoaded, substituteApiKeysDeep } from '../config/apikeys';
import { normalizeCompositeLayer, findNormalizedSource } from './composite-layer-utils';

interface MarkerService {
    add(id: string, lngLat: LngLat, options?: MarkerOptions): void;
    move(id: string, lngLat: LngLat): void;
    remove(id: string): void;
}

export abstract class BaseAdapter {
    public readonly store: MapStateStore;
    public readonly events: MapEventBus;

    /**
     * When true, composite (`type: 'style'`) layers are decomposed here in generic
     * code: sources registered individually, each sublayer passed to engineAddLayer
     * tagged with `metadata.logicalLayerId`. The engine sees only simple single layers.
     * Override in engine adapters that support this model (MapLibre first).
     */
    // Overridden in MapLibreAdapter (and future engines) to enable generic composite decomposition.
    protected readonly _decomposeComposite: boolean = false;
    private sourceAttributions = new Map<string, string>();
    private sourceConfigs = new Map<string, Record<string, unknown>>();
    private layerConfigStore = new Map<string, { config: unknown; options?: LayerInsertOptions }>();

    constructor() {
        this.store = new MapStateStore();
        this.events = new MapEventBus();
        this.events.on('view-change-end', (e) => {
            this.store.dispatch({ mapBearing: e.bearing, mapPitch: e.pitch }, 'MAP');
        });
    }

    /** Records the `attribution` from a source config (style-spec field) for later lookup. */
    private trackSourceAttribution(id: string, config: any): void {
        if (config && typeof config.attribution === 'string' && config.attribution.length > 0) {
            this.sourceAttributions.set(id, config.attribution);
        } else {
            this.sourceAttributions.delete(id);
        }
    }

    getSourceAttribution(id: string): string | undefined {
        return this.sourceAttributions.get(id);
    }

    getSourceConfig(sourceId: string): Record<string, unknown> | null {
        return this.sourceConfigs.get(sourceId) ?? null;
    }

    addSource(id: string, config: any): void {
        this.trackSourceAttribution(id, config);
        if (config && typeof config === 'object') {
            this.sourceConfigs.set(id, config as Record<string, unknown>);
        }
        this.engineAddSource(id, config);
    }

    hasLayer(layerId: string): boolean {
        return (this.store.getState().mapLayers ?? {})[layerId] !== undefined;
    }

    /** Config-authored `metadata.transparency` (0-100, matches the slider) applied once at add time. */
    private applyConfigTransparency(layerId: string, layer: any): void {
        const transparency = layer?.metadata?.transparency;
        if (typeof transparency === 'number' && transparency > 0) {
            this.setLayerOpacity(layerId, (100 - transparency) / 100);
        }
    }

    // ── Generic layer lifecycle ───────────────────────────────────────────────

    async addLayer(layer: any, options?: LayerInsertOptions): Promise<boolean> {
        await ensureApiKeysLoaded();
        layer = substituteApiKeysDeep(layer);

        // Composite (type: 'style') with populated sources/layers — decompose generically
        // when the engine supports it (decomposeComposite = true).
        if (
            this._decomposeComposite &&
            layer?.type === 'style' &&
            Array.isArray(layer.layers) && layer.layers.length > 0 &&
            layer.sources && typeof layer.sources === 'object'
        ) {
            return this.addDecomposedComposite(layer as CompositeStyleLayerConfig, options);
        }

        const added = await this.engineAddLayer(layer, options);
        if (added) {
            registerMapLayer(this.store, layer);
            const layerId = layer?.id ?? layer?.metadata?.mapLayerId;
            if (typeof layerId === 'string') {
                this.syncMapLayerOrder(layerId, options);
                this.layerConfigStore.set(layerId, { config: layer, options });
                this.applyConfigTransparency(layerId, layer);
                const activeLayers = Object.keys(this.store.getState().mapLayers ?? {});
                this.events.emit({ type: 'layer-add', layerId, activeLayers });
            }
        }
        return added;
    }

    /** registerMapLayer appends at the top of `mapLayers`; when the engine inserted the
     *  layer at a hinted position, mirror that position in the store's key order so the
     *  legend and the engine agree on the stack. */
    private syncMapLayerOrder(layerId: string, options?: LayerInsertOptions): void {
        if (options?.beforeLayerId) {
            reorderMapLayers(this.store, layerId, options.beforeLayerId);
            return;
        }
        if (options?.afterLayerId) {
            const ids = Object.keys(this.store.getState().mapLayers ?? {}).filter((id) => id !== layerId);
            const idx = ids.indexOf(options.afterLayerId);
            if (idx !== -1) reorderMapLayers(this.store, layerId, ids[idx + 1] ?? null);
        }
    }

    private async addDecomposedComposite(layer: CompositeStyleLayerConfig, options?: LayerInsertOptions): Promise<boolean> {
        const logicalId = layer.id;
        const legendRole = (layer.metadata as Record<string, unknown> | undefined)?.legendRole ?? 'overlay';

        // Normalize sources to the same globally-addressable `${logicalId}:${key}` id
        // convention every other engine's composite-layer path uses (composite-layer-utils),
        // so store.mapLayers[id].sourceId (set by registerMapLayer below) actually
        // resolves to a source the engine registered.
        const normalized = normalizeCompositeLayer(layer);
        const sources = normalized?.sources ?? [];
        for (const source of sources) {
            this.engineRegisterCompositeSource(source.globalId, source.config);
        }

        // Add each sublayer individually; engine groups them under logicalLayerId
        let anySuccess = false;
        for (const sublayer of (layer.layers ?? [])) {
            const resolvedSource = (normalized && findNormalizedSource(normalized, (sublayer as any).source)?.globalId)
                ?? (sublayer as any).source;
            const sublayerWithMeta: any = {
                ...sublayer,
                source: resolvedSource,
                metadata: {
                    ...((sublayer as any).metadata ?? {}),
                    logicalLayerId: logicalId,
                    legendRole,
                },
            };
            const ok = await this.engineAddLayer(sublayerWithMeta, options);
            if (ok) anySuccess = true;
        }

        if (anySuccess) {
            registerMapLayer(this.store, layer);
            this.syncMapLayerOrder(logicalId, options);
            this.layerConfigStore.set(logicalId, { config: layer, options });
            this.applyConfigTransparency(logicalId, layer);
            const activeLayers = Object.keys(this.store.getState().mapLayers ?? {});
            this.events.emit({ type: 'layer-add', layerId: logicalId, activeLayers });
        }
        return anySuccess;
    }

    removeLayer(id: string): void {
        this.layerConfigStore.delete(id);
        this.engineRemoveLayer(id);
        unregisterMapLayer(this.store, id);
        const activeLayers = Object.keys(this.store.getState().mapLayers ?? {});
        this.events.emit({ type: 'layer-remove', layerId: id, activeLayers });
    }

    /** Returns the layer config for every currently active layer, keyed by logical layer id. */
    getLayerConfigs(): Map<string, unknown> {
        const result = new Map<string, unknown>();
        for (const [id, entry] of this.layerConfigStore) {
            result.set(id, entry.config);
        }
        return result;
    }

    /** Returns stored layer configs in current stack order (bottom to top), then clears the store. */
    protected drainLayerConfigs(): Array<{ config: unknown; options?: LayerInsertOptions }> {
        const order = Object.keys(this.store.getState().mapLayers ?? {});
        const result = order
            .map(id => this.layerConfigStore.get(id))
            .filter((e): e is { config: unknown; options?: LayerInsertOptions } => e !== undefined);
        this.layerConfigStore.clear();
        this.store.dispatch({ mapLayers: {} }, 'INIT');
        return result;
    }

    /** Repositions `layerId` immediately below `beforeLayerId` (or to the top if null/undefined). */
    moveLayer(layerId: string, beforeLayerId?: string | null): void {
        this.getLogicalLayerExecutor().moveLayer(layerId, beforeLayerId);
        reorderMapLayers(this.store, layerId, beforeLayerId);
        const activeLayers = Object.keys(this.store.getState().mapLayers ?? {});
        this.events.emit({ type: 'layer-reorder', layerId, activeLayers });
    }

    updateLayerStyle(layerId: string, subLayerId: string, partialPaint: Record<string, unknown>): boolean {
        return this.getLogicalLayerExecutor().updateLayerStyle(layerId, subLayerId, partialPaint);
    }

    /** Engine-agnostic: delegates the actual rendering to whichever executor the concrete
     *  adapter is bound to, and mirrors the change into store.mapLayers so anything reading
     *  visibility from the store (the legend, story steps, etc.) stays in sync automatically —
     *  callers no longer need to dispatch this themselves. */
    setLayerVisibility(layerId: string, visible: boolean): void {
        this.getLogicalLayerExecutor().setLayerVisibility(layerId, visible);
        const current = this.store.getState().mapLayers ?? {};
        const entry = current[layerId];
        if (entry && entry.visible !== visible) {
            this.store.dispatch({ mapLayers: { ...current, [layerId]: { ...entry, visible } } }, 'UI');
        }
    }

    /** Engine-agnostic counterpart to setLayerVisibility — see its comment. `opacity` is the
     *  0-1 fraction the engine expects; the store tracks the inverse as `transparency` (0-100,
     *  matching the legend's slider). */
    setLayerOpacity(layerId: string, opacity: number): void {
        this.getLogicalLayerExecutor().setLayerOpacity(layerId, opacity);
        const transparency = Math.round((1 - opacity) * 100);
        const current = this.store.getState().mapLayers ?? {};
        const entry = current[layerId];
        if (entry && entry.transparency !== transparency) {
            this.store.dispatch({ mapLayers: { ...current, [layerId]: { ...entry, transparency } } }, 'UI');
        }
    }

    removeSource(id: string): void {
        // Unregister all layers whose sourceId matches this source before delegating
        // to the engine. Only the store knows which layer IDs were registered under
        // this source — the engine must not call unregisterMapLayer in removeSource.
        const layers = this.store.getState().mapLayers ?? {};
        for (const [layerId, meta] of Object.entries(layers)) {
            if ((meta as any).sourceId === id) {
                unregisterMapLayer(this.store, layerId);
                const activeLayers = Object.keys(this.store.getState().mapLayers ?? {});
                this.events.emit({ type: 'layer-remove', layerId, activeLayers });
            }
        }
        this.sourceAttributions.delete(id);
        this.engineRemoveSource(id);
    }

    // ── Engine hooks (implement in each concrete adapter) ────────────────────

    /** Engine-specific layer add. Return true if the layer was accepted and added. */
    protected abstract engineAddLayer(layer: any, options?: LayerInsertOptions): Promise<boolean>;

    /** Engine-specific layer remove. */
    protected abstract engineRemoveLayer(id: string): void;

    /** Engine-specific source remove. */
    protected abstract engineRemoveSource(id: string): void;

    /** Engine-specific source add. */
    protected abstract engineAddSource(id: string, config: any): void;

    /**
     * Registers a composite layer source. Override in engines that need format conversion
     * (e.g. MapLibre: webmapx SourceConfig → native MapLibre source object).
     * Default falls back to engineAddSource.
     */
    protected engineRegisterCompositeSource(id: string, config: unknown): void {
        this.engineAddSource(id, config);
    }

    // ── Shared engine accessors (implement in each concrete adapter) ─────────

    /** Returns the engine's core service (handles addSource/removeSource/getSource/etc). */
    protected abstract getCore(): IMapCore;

    /** Returns the logical-layer executor used for catalog/source-data fallbacks. */
    protected abstract getLogicalLayerExecutor(): DeferredLogicalLayerExecutor;

    /** Returns the marker service, or null if not yet bound. */
    protected abstract getMarkerService(): MarkerService | null;

    // ── Shared pass-through implementations ──────────────────────────────────

    getSource(id: string): ISource | undefined {
        return this.getCore().getSource(id) ?? (
            this.getLogicalLayerExecutor().getSourceData(id) !== null
                ? { id, setData: (data: GeoJSON.FeatureCollection) => { this.getLogicalLayerExecutor().setSourceData(id, data); } }
                : undefined
        );
    }

    suppressBusySignalForSource(sourceId: string): void {
        this.getCore().suppressBusySignalForSource(sourceId);
    }

    unsuppressBusySignalForSource(sourceId: string): void {
        this.getCore().unsuppressBusySignalForSource(sourceId);
    }

    addMarker(id: string, lngLat: LngLat, options?: MarkerOptions): void {
        this.getMarkerService()?.add(id, lngLat, options);
    }

    moveMarker(id: string, lngLat: LngLat): void {
        this.getMarkerService()?.move(id, lngLat);
    }

    removeMarker(id: string): void {
        this.getMarkerService()?.remove(id);
    }
}
