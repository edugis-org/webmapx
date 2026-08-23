import type { IMap } from '../map/IMapInterfaces';

/**
 * Reading a layer's features, the one way that works for every source type.
 *
 * There used to be two: the Analysis tool asked `adapter.queryLayerFeatures`,
 * which every engine implements (MapLibre serialises a geojson source and
 * otherwise reads what it has drawn and reassembles tile-split geometry), while
 * the legend panels sampled `querySourceFeatures` by source id. The second one
 * needs the engine's logical-source bookkeeping to hold that exact id *and* the
 * layer's `source-layer` to have reached the store; when either is missing it
 * answers `null`, and the style panel and the info dialog then report "nothing
 * known" about a layer the Analysis tool reads perfectly well.
 *
 * So: one helper, the Analysis tool's path, used by all of them.
 */

export interface LayerFeatureSample {
    /** `null` means the layer could not be read at all, which is not the same as empty. */
    features: GeoJSON.Feature[] | null;
    /**
     * False when only what the map has drawn could be read. A geojson source
     * hands over its whole dataset; a tiled one answers from the current view,
     * which silently changes any answer computed from it.
     */
    complete: boolean;
}

/**
 * True when a layer's features can only be read from what the map has drawn.
 * Unknown source config: say nothing rather than cry wolf.
 */
export function isViewportLimitedSource(adapter: IMap | null | undefined, sourceId: string | undefined): boolean {
    if (!sourceId || !adapter) return false;
    const type = adapter.getSourceConfig(sourceId)?.type;
    return typeof type === 'string' && type !== 'geojson';
}

export interface SampleLayerFeaturesOptions {
    /** Restricts a vector-tile read to one tile sublayer. */
    sourceLayer?: string;
    /** The layer's source id, used only to decide whether the read is viewport-limited. */
    sourceId?: string;
    /**
     * A layer that carries its own resolved GeoJSON — "add layer from URL" and
     * the like — has no source the engine can be asked about.
     */
    sourceData?: unknown;
}

export async function sampleLayerFeatures(
    adapter: IMap | null | undefined,
    layerId: string,
    options: SampleLayerFeaturesOptions = {},
): Promise<LayerFeatureSample> {
    const inline = options.sourceData;
    if (inline && typeof inline === 'object' && Array.isArray((inline as GeoJSON.FeatureCollection).features)) {
        return { features: (inline as GeoJSON.FeatureCollection).features, complete: true };
    }
    if (!adapter?.queryLayerFeatures) return { features: null, complete: false };

    const complete = !isViewportLimitedSource(adapter, options.sourceId);
    try {
        const collection = await adapter.queryLayerFeatures(
            layerId,
            options.sourceLayer ? { sourceLayer: options.sourceLayer } : undefined,
        );
        return { features: collection?.features ?? null, complete };
    } catch (_) {
        return { features: null, complete };
    }
}
