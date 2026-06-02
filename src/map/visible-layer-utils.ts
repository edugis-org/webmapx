import type { MapEventBus } from '../store/map-events';

export function emitVisibleLayerEvents(
    events: MapEventBus,
    lastVisibleLayers: string[],
    nextVisibleLayers: string[],
): string[] {
    const previous = new Set(lastVisibleLayers);
    const next = new Set(nextVisibleLayers);

    for (const layerId of nextVisibleLayers) {
        if (!previous.has(layerId)) {
            events.emit({ type: 'layer-add', layerId, visibleLayers: [...nextVisibleLayers] });
        }
    }

    for (const layerId of lastVisibleLayers) {
        if (!next.has(layerId)) {
            events.emit({ type: 'layer-remove', layerId, visibleLayers: [...nextVisibleLayers] });
        }
    }

    return [...nextVisibleLayers];
}
