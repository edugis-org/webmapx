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
import type { LngLat } from '../store/map-events';
import { MapEventBus } from '../store/map-events';
import type { DeferredLogicalLayerExecutor } from './logical-layer-executor';
import { ensureApiKeysLoaded, substituteApiKeysDeep } from '../config/apikeys';

interface MarkerService {
    add(id: string, lngLat: LngLat, options?: MarkerOptions): void;
    move(id: string, lngLat: LngLat): void;
    remove(id: string): void;
}

export abstract class BaseAdapter {
    public readonly store: MapStateStore;
    public readonly events: MapEventBus;
    private sourceAttributions = new Map<string, string>();
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

    addSource(id: string, config: any): void {
        this.trackSourceAttribution(id, config);
        this.engineAddSource(id, config);
    }

    hasLayer(layerId: string): boolean {
        return (this.store.getState().mapLayers ?? {})[layerId] !== undefined;
    }

    // ── Generic layer lifecycle ───────────────────────────────────────────────

    async addLayer(layer: any, options?: LayerInsertOptions): Promise<boolean> {
        await ensureApiKeysLoaded();
        layer = substituteApiKeysDeep(layer);
        const added = await this.engineAddLayer(layer, options);
        if (added) {
            registerMapLayer(this.store, layer);
            const layerId = layer?.id ?? layer?.metadata?.mapLayerId;
            if (typeof layerId === 'string') {
                this.layerConfigStore.set(layerId, { config: layer, options });
                const activeLayers = Object.keys(this.store.getState().mapLayers ?? {});
                this.events.emit({ type: 'layer-add', layerId, activeLayers });
            }
        }
        return added;
    }

    removeLayer(id: string): void {
        this.layerConfigStore.delete(id);
        this.engineRemoveLayer(id);
        unregisterMapLayer(this.store, id);
        const activeLayers = Object.keys(this.store.getState().mapLayers ?? {});
        this.events.emit({ type: 'layer-remove', layerId: id, activeLayers });
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
