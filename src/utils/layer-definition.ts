/**
 * A layer as it now stands, rather than as it was configured.
 *
 * A layer's definition and its appearance drift apart the moment a user edits
 * it: the style dialog and the legend's inline editor write paint into the
 * engine and mirror it into `store.mapLayers` (`BaseAdapter.updateLayerStyle`),
 * and nothing writes it back to the config the layer came from. So anything
 * that wants to hand the layer on — a "copy config" button, a config editor,
 * an export — must read the live state, and every such caller reaching into
 * `store.mapLayers` itself would be four copies of this merge, each guessing
 * the same things about composite layers.
 *
 * The store entry is legend-shaped (flat `paint`, `layout`, `sublayers`,
 * `layerType`), so this recombines it with the layer's configured definition
 * into something config-shaped that can be pasted back into a config file.
 *
 * Visibility and opacity are deliberately not folded in: they are map *state*,
 * which the permalink already carries, not part of what the layer is. They are
 * returned alongside the definition for a caller that wants to record them.
 */

/** What `store.mapLayers[id]` holds, reduced to the parts a definition needs. */
interface StoreLayerEntry {
    paint?: Record<string, unknown>;
    layout?: Record<string, unknown>;
    sublayers?: Record<string, unknown>[];
    layerType?: string;
    sourceId?: string;
    sourceLayer?: string;
    label?: string;
    minzoom?: number;
    maxzoom?: number;
    visible?: boolean;
    transparency?: number;
}

export interface LayerDefinitionResult {
    /** The layer, config-shaped, carrying whatever the user has changed. */
    layer: Record<string, unknown>;
    /** Map state, not part of the definition — reported for callers that want it. */
    visible?: boolean;
    transparency?: number;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** A deep copy, so a caller editing the result cannot write into live state. */
function clone<T>(value: T): T {
    return value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Merges a layer's configured definition with the live state held for it.
 *
 * `configured` is the layer as the config (or the layer request that added it)
 * declares it, and may be absent — a layer added at runtime by a tool has no
 * configured form at all and is rebuilt from the store entry alone.
 */
export function buildLayerDefinition(
    layerId: string,
    entry: Record<string, unknown> | undefined,
    configured?: Record<string, unknown>,
): LayerDefinitionResult | null {
    if (!entry && !configured) return null;
    const live = (entry ?? {}) as StoreLayerEntry;

    const base: Record<string, unknown> = configured
        ? clone(configured)
        : {
            id: layerId,
            type: live.layerType ?? 'fill',
            ...(live.sourceId ? { source: live.sourceId } : {}),
            ...(live.sourceLayer ? { 'source-layer': live.sourceLayer } : {}),
        };
    if (base.id === undefined) base.id = layerId;

    // A composite keeps its paint per sublayer, so the live sublayers *are* the
    // style: they carry both the paint the user edited and any layer the style
    // dialog added — a label layer, which no paint patch would describe.
    if (Array.isArray(live.sublayers) && live.sublayers.length > 0) {
        base.layers = clone(live.sublayers);
    } else {
        if (isPlainObject(live.paint)) base.paint = clone(live.paint);
        if (isPlainObject(live.layout)) base.layout = clone(live.layout);
    }

    if (typeof live.minzoom === 'number') base.minzoom = live.minzoom;
    if (typeof live.maxzoom === 'number') base.maxzoom = live.maxzoom;

    // Renaming a layer in the legend is an edit like any other, and lands on
    // the entry rather than on the layer it came from.
    if (typeof live.label === 'string' && live.label.length > 0) {
        const metadata = isPlainObject(base.metadata) ? { ...base.metadata } : {};
        metadata.title = live.label;
        base.metadata = metadata;
    }

    return {
        layer: base,
        ...(typeof live.visible === 'boolean' ? { visible: live.visible } : {}),
        ...(typeof live.transparency === 'number' ? { transparency: live.transparency } : {}),
    };
}
