// src/map/deferred-query-service.ts
// Buffers queryFeatures calls until the native map is ready and a concrete
// IQueryService has been bound (mirrors DeferredLogicalLayerExecutor pattern),
// and applies the one generic rule every engine shares: a layer whose metadata
// says it is not queryable is not queried.

import type { IQueryService, QueryLocation, QueryOptions, FeatureInfo } from './IQueryService';
import type { MapStateStore } from '../store/map-state-store';
import { queryableLayerIds } from '../utils/layer-queryable';

export class DeferredQueryService implements IQueryService {
    private service?: IQueryService;

    constructor(private readonly store?: MapStateStore) {}

    bind(service: IQueryService): void {
        this.service = service;
    }

    async queryFeatures(location: QueryLocation, options?: QueryOptions): Promise<FeatureInfo[]> {
        if (!this.service) return [];
        return this.service.queryFeatures(location, this.withQueryableOnly(options));
    }

    /**
     * Narrows `layerIds` to the layers that may be queried.
     *
     * An allowlist rather than a list of exclusions, because that is what every
     * engine's query service already honours — and honours *before* it fetches,
     * so a WMS layer marked unqueryable costs no GetFeatureInfo request at all
     * rather than one whose answer is thrown away. A caller's own `layerIds`
     * is intersected with it: both are restrictions, and neither should widen
     * the other.
     */
    private withQueryableOnly(options?: QueryOptions): QueryOptions | undefined {
        const allowed = queryableLayerIds(this.store?.getState().mapLayers);
        if (!allowed) return options;
        const requested = options?.layerIds;
        const layerIds = requested?.length
            ? requested.filter((id) => allowed.includes(id))
            : allowed;
        return { ...options, layerIds };
    }
}
