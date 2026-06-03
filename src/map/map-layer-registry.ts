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
                layerType: currentEntry.layerType ?? metadata.layerType,
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
