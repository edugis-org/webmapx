import type { MapStateStore } from '../store/map-state-store';

export function registerMapLayer(store: MapStateStore, layer: any): void {
    const metadata = (layer?.metadata && typeof layer.metadata === 'object')
        ? { ...(layer.metadata as Record<string, unknown>) }
        : {};
    const layerId = typeof metadata.mapLayerId === 'string'
        ? metadata.mapLayerId
        : typeof layer?.id === 'string'
            ? layer.id
            : null;
    if (!layerId) return;

    delete metadata.mapLayerId;

    if (typeof metadata.label !== 'string' || metadata.label.length === 0) {
        if (typeof layer?.title === 'string' && layer.title.length > 0) {
            metadata.label = layer.title;
        } else {
            metadata.label = layerId;
        }
    }

    if (typeof layer?.source === 'string' && typeof metadata.sourceId !== 'string') {
        metadata.sourceId = layer.source;
    }
    if (typeof layer?.type === 'string' && typeof metadata.layerType !== 'string') {
        metadata.layerType = layer.type;
    }
    if (layer?.paint && typeof layer.paint === 'object' && !metadata.paint) {
        metadata.paint = layer.paint;
    }
    // For composite style layers, store all sub-layers for legend rendering
    if (layer?.type === 'style' && Array.isArray(layer.layers) && layer.layers.length > 0) {
        const primarySub = layer.layers.find((s: any) => s?.type && s.type !== 'background') ?? layer.layers[0];
        if (primarySub?.type) {
            metadata.layerType = primarySub.type;
        }
        if (primarySub?.paint && typeof primarySub.paint === 'object' && !metadata.paint) {
            metadata.paint = primarySub.paint;
        }
        if (!metadata.sublayers) {
            metadata.sublayers = layer.layers;
        }
    }
    const current = store.getState().mapLayers ?? {};
    const currentEntry = current[layerId] ?? {};
    const hasCurrentEntry = layerId in current;
    store.dispatch({
        mapLayers: {
            ...current,
            [layerId]: {
                ...currentEntry,
                ...metadata,
                hideFromLegend: hasCurrentEntry ? currentEntry.hideFromLegend : metadata.hideFromLegend,
                label: typeof currentEntry.label === 'string' && currentEntry.label.length > 0 ? currentEntry.label : metadata.label,
                legendRole: currentEntry.legendRole ?? metadata.legendRole,
                sourceId: currentEntry.sourceId ?? metadata.sourceId,
                layerType: metadata.layerType ?? currentEntry.layerType,
                sublayers: metadata.sublayers ?? currentEntry.sublayers,
            },
        },
    }, 'MAP');
}

export function unregisterMapLayer(store: MapStateStore, layerId: string): void {
    const current = store.getState().mapLayers ?? {};
    if (!(layerId in current)) return;
    const { [layerId]: _removed, ...rest } = current;
    store.dispatch({ mapLayers: rest }, 'MAP');
}
