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
    // A vector-tile source cannot be queried without its source layer, so the
    // legend's style dialog needs this alongside sourceId to sample features.
    if (typeof layer?.['source-layer'] === 'string' && typeof metadata.sourceLayer !== 'string') {
        metadata.sourceLayer = layer['source-layer'];
    }
    if (layer?.paint && typeof layer.paint === 'object' && !metadata.paint) {
        metadata.paint = layer.paint;
    }
    // Alongside paint, because a symbol layer keeps what it *says* in layout:
    // without this a labels layer reaches the legend with a colour and no text,
    // and the legend cannot draw a row for it.
    if (layer?.layout && typeof layer.layout === 'object' && !metadata.layout) {
        metadata.layout = layer.layout;
    }
    if (typeof layer?.minzoom === 'number' && typeof metadata.minzoom !== 'number') {
        metadata.minzoom = layer.minzoom;
    }
    if (typeof layer?.maxzoom === 'number' && typeof metadata.maxzoom !== 'number') {
        metadata.maxzoom = layer.maxzoom;
    }
    // Store resolved GeoJSON data so consumers (e.g. TrueArea) can read it from generic state.
    // Also capture sourceId from inline sources (style layers use layer.sources, not layer.source).
    if (layer?.sources && typeof layer.sources === 'object') {
        for (const [srcKey, src] of Object.entries(layer.sources)) {
            const s = src as any;
            if (s?.type === 'geojson' && s?.data && typeof s.data === 'object') {
                if (!metadata.sourceData) metadata.sourceData = s.data;
                // composite-layer-utils registers sources under globalId = "${layerId}:${key}"
                if (typeof metadata.sourceId !== 'string') metadata.sourceId = `${layerId}:${srcKey}`;
                break;
            }
        }
    }
    // Layers added inline (e.g. discovered via "Add layer from URL") carry their
    // source's attribution alongside it — capture it so the legend can show it
    // without consulting layerDataConfig/catalogConfig.
    if (typeof metadata.attribution !== 'string' && layer?.sources && typeof layer.sources === 'object') {
        for (const src of Object.values(layer.sources)) {
            const s = src as any;
            if (typeof s?.attribution === 'string' && s.attribution) {
                metadata.attribution = s.attribution;
                break;
            }
        }
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
                sourceLayer: metadata.sourceLayer ?? currentEntry.sourceLayer,
                sublayers: metadata.sublayers ?? currentEntry.sublayers,
                sourceData: metadata.sourceData ?? currentEntry.sourceData,
                attribution: metadata.attribution ?? currentEntry.attribution,
                minzoom: metadata.minzoom ?? currentEntry.minzoom,
                maxzoom: metadata.maxzoom ?? currentEntry.maxzoom,
            },
        },
    }, 'MAP');
}


/**
 * Reorders `mapLayers` so `layerId` sits immediately below `beforeLayerId`
 * (or at the top/end of the record if `beforeLayerId` is null/undefined).
 * Record key order is the map's bottom-to-top stacking order.
 */
export function reorderMapLayers(store: MapStateStore, layerId: string, beforeLayerId?: string | null): void {
    const current = store.getState().mapLayers ?? {};
    if (!(layerId in current)) return;

    const ids = Object.keys(current).filter((id) => id !== layerId);
    let insertAt = ids.length;
    if (beforeLayerId) {
        const idx = ids.indexOf(beforeLayerId);
        if (idx !== -1) insertAt = idx;
    }
    ids.splice(insertAt, 0, layerId);

    const reordered: typeof current = {};
    for (const id of ids) reordered[id] = current[id];
    store.dispatch({ mapLayers: reordered }, 'MAP');
}

export function unregisterMapLayer(store: MapStateStore, layerId: string): void {
    const current = store.getState().mapLayers ?? {};
    if (!(layerId in current)) return;
    const { [layerId]: _removed, ...rest } = current;
    store.dispatch({ mapLayers: rest }, 'MAP');
}
