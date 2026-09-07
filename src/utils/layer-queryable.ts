/**
 * Whether a layer answers the info tool.
 *
 * `metadata.queryable` is the one switch, for every layer type and every
 * engine: absent means yes (nearly every layer is worth asking about), and a
 * falsy value means the layer is skipped. It exists because "what is here?"
 * has two different wrong answers. A basemap composite returns a dozen
 * sublayers — landcover, water, every label — and buries the answer the click
 * was about. A WMS layer whose capabilities say `queryable="false"` returns
 * nothing at all, but only after a GetFeatureInfo request has gone to the
 * server and come back, once per click, forever.
 *
 * So the flag is read from two directions. `layer-discovery` writes
 * `queryable: false` when a capabilities document says the layer cannot be
 * queried, which turns a pointless request into no request. And whoever writes
 * the config can set it on any layer — including one the service calls
 * queryable — because a server being willing to answer is not the same as the
 * answer being wanted on this map.
 *
 * This governs feature *info* only. Analysis reads a layer's data through
 * `queryLayerFeatures`, which is a different question with a different answer:
 * a basemap nobody may click is still a layer you may want to clip against.
 */

/** True unless the layer's metadata explicitly turns querying off. */
export function isQueryableMetadata(metadata: unknown): boolean {
    if (!metadata || typeof metadata !== 'object') return true;
    const record = metadata as Record<string, unknown>;
    if (!('queryable' in record)) return true;
    return Boolean(record.queryable);
}

/**
 * The ids in `mapLayers` that may be queried, or null when every one of them
 * may be — in which case there is nothing to restrict and the caller should
 * pass no filter at all, rather than an allowlist that would silently exclude
 * anything the store has not registered.
 */
export function queryableLayerIds(mapLayers: Record<string, unknown> | undefined): string[] | null {
    if (!mapLayers) return null;
    const entries = Object.entries(mapLayers);
    const allowed = entries.filter(([, meta]) => isQueryableMetadata(meta)).map(([id]) => id);
    return allowed.length === entries.length ? null : allowed;
}
