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
import { registerMapLayer, unregisterMapLayer } from './map-layer-registry';
import type { LayerInsertOptions } from './IMapInterfaces';
import { MapEventBus } from '../store/map-events';

export abstract class BaseAdapter {
    public readonly store: MapStateStore;
    public readonly events: MapEventBus;

    constructor() {
        this.store = new MapStateStore();
        this.events = new MapEventBus();
    }

    hasLayer(layerId: string): boolean {
        return (this.store.getState().mapLayers ?? {})[layerId] !== undefined;
    }

    // ── Generic layer lifecycle ───────────────────────────────────────────────

    async addLayer(layer: any, options?: LayerInsertOptions): Promise<boolean> {
        const added = await this.engineAddLayer(layer, options);
        if (added) {
            registerMapLayer(this.store, layer);
            const layerId = layer?.id ?? layer?.metadata?.mapLayerId;
            if (typeof layerId === 'string') {
                const activeLayers = Object.keys(this.store.getState().mapLayers ?? {});
                this.events.emit({ type: 'layer-add', layerId, activeLayers });
            }
        }
        return added;
    }

    removeLayer(id: string): void {
        this.engineRemoveLayer(id);
        unregisterMapLayer(this.store, id);
        const activeLayers = Object.keys(this.store.getState().mapLayers ?? {});
        this.events.emit({ type: 'layer-remove', layerId: id, activeLayers });
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
        this.engineRemoveSource(id);
    }

    // ── Engine hooks (implement in each concrete adapter) ────────────────────

    /** Engine-specific layer add. Return true if the layer was accepted and added. */
    protected abstract engineAddLayer(layer: any, options?: LayerInsertOptions): Promise<boolean>;

    /** Engine-specific layer remove. */
    protected abstract engineRemoveLayer(id: string): void;

    /** Engine-specific source remove. */
    protected abstract engineRemoveSource(id: string): void;
}
