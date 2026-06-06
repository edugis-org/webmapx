import type { SourceConfig } from '../config/types';

/**
 * Returns a copy of `layer` with all catalog source references resolved inline.
 * Sub-layer `source` strings and top-level `source` strings are looked up in
 * `catalogSources` and added to the layer's `sources` map so the engine receives
 * a self-contained spec — no catalog access needed inside engine services.
 */
export function inlineLayerSources(layer: any, catalogSources: SourceConfig[] | undefined): any {
    if (!catalogSources || catalogSources.length === 0) return layer;
    const byId = new Map(catalogSources.map(s => [s.id, s]));

    const needed = new Set<string>();
    if (typeof layer.source === 'string') needed.add(layer.source);
    if (Array.isArray(layer.layers)) {
        for (const sub of layer.layers) {
            if (typeof sub?.source === 'string') needed.add(sub.source);
        }
    }
    if (needed.size === 0) return layer;

    const existing: Record<string, any> = layer.sources ?? {};
    const added: Record<string, any> = {};
    for (const id of needed) {
        if (existing[id]) continue;
        const found = byId.get(id);
        if (found) added[id] = found;
    }
    if (Object.keys(added).length === 0) return layer;
    return { ...layer, sources: { ...existing, ...added } };
}
