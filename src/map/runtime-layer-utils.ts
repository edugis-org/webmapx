import type { MapStateStore } from '../store/map-state-store';

export function registerRuntimeLayer(store: MapStateStore, layer: any): void {
    const layerId = typeof layer?.id === 'string' ? layer.id : null;
    if (!layerId) return;

    const metadata = (layer?.metadata && typeof layer.metadata === 'object')
        ? { ...(layer.metadata as Record<string, unknown>) }
        : {};

    if (typeof metadata.label !== 'string' || metadata.label.length === 0) {
        if (typeof layer?.title === 'string' && layer.title.length > 0) {
            metadata.label = layer.title;
        } else {
            metadata.label = layerId;
        }
    }

    const current = store.getState().runtimeLayerMetadata ?? {};
    store.dispatch({
        runtimeLayerMetadata: {
            ...current,
            [layerId]: metadata,
        },
    }, 'MAP');
}

export function unregisterRuntimeLayer(store: MapStateStore, layerId: string): void {
    const current = store.getState().runtimeLayerMetadata ?? {};
    if (!(layerId in current)) return;
    const { [layerId]: _removed, ...rest } = current;
    store.dispatch({ runtimeLayerMetadata: rest }, 'MAP');
}
