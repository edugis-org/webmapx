// src/map/composite-layer-utils.ts
//
// Generic (engine-agnostic) expansion of `type: 'style'` composite layers.
// Owns: stable sub-layer id derivation, local-source global-id derivation and
// normalization. Engines receive an already-normalized spec and only turn it
// into native objects — see IMapInterfaces.ILayerService.addCompositeLayer.

import type { CompositeStyleLayerConfig, SourceConfig, SubLayerSpec } from '../config/types';
import { normalizeRawSource } from './layer-source-utils';

/** A sub-layer spec with a guaranteed-stable id, derived if absent. */
export interface NormalizedSubLayer extends SubLayerSpec {
    id: string;
}

/** A local source belonging to a composite layer, normalized and globally addressable. */
export interface NormalizedLocalSource {
    /** The local key used by sub-layers to reference this source (e.g. `subLayer.source`). */
    key: string;
    /** Globally-unique id derived as `${styleId}:${key}`. */
    globalId: string;
    config: SourceConfig;
}

/** Fully-normalized composite layer spec, ready for engine-side native rendering. */
export interface NormalizedCompositeSpec {
    styleId: string;
    sources: NormalizedLocalSource[];
    subLayers: NormalizedSubLayer[];
    /** Original layer config metadata (legendRole, styleUrl, etc.) — engines may need it for rendering decisions. */
    metadata?: Record<string, unknown>;
    /**
     * The original config, kept for engines that must rebuild a full GL-style document
     * from raw sources/layers/metadata (e.g. OpenLayers style-backed vector tile
     * rendering via `stylefunction`). Prefer the normalized fields above where possible.
     */
    rawConfig: CompositeStyleLayerConfig;
}

/** Derives a stable sub-layer id using the existing convention engines relied on. */
function deriveSubLayerId(subLayer: SubLayerSpec): string {
    if (subLayer.id) return subLayer.id;
    if (subLayer.type === 'background') return 'background';
    return subLayer.source ? `${subLayer.source}-${subLayer.type}` : subLayer.type;
}

/**
 * Normalizes a `type: 'style'` composite layer config into a fully-resolved spec:
 * stable sub-layer ids, globally-addressable local sources (already normalized via
 * `normalizeRawSource`). Returns null if the config has no usable sub-layers.
 */
export function normalizeCompositeLayer(config: CompositeStyleLayerConfig): NormalizedCompositeSpec | null {
    const styleId = config.id;
    const rawSources = config.sources ?? {};
    const rawSubLayers = config.layers ?? [];
    if (rawSubLayers.length === 0) return null;

    const sources: NormalizedLocalSource[] = [];
    for (const [key, rawDef] of Object.entries(rawSources)) {
        const globalId = `${styleId}:${key}`;
        const normalized = normalizeRawSource(globalId, rawDef);
        if (!normalized) continue;
        sources.push({ key, globalId, config: normalized });
    }

    const subLayers: NormalizedSubLayer[] = rawSubLayers.map((subLayer) => ({
        ...subLayer,
        id: deriveSubLayerId(subLayer),
    }));

    const metadata = (config.metadata && typeof config.metadata === 'object')
        ? (config.metadata as Record<string, unknown>)
        : undefined;

    return { styleId, sources, subLayers, metadata, rawConfig: config };
}

/** Looks up a normalized local source by the local key a sub-layer references. */
export function findNormalizedSource(spec: NormalizedCompositeSpec, key: string | undefined): NormalizedLocalSource | undefined {
    if (!key) return undefined;
    return spec.sources.find((s) => s.key === key);
}
