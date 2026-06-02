// src/map/deferred-query-service.ts
// Buffers queryFeatures calls until the native map is ready and a concrete
// IQueryService has been bound (mirrors DeferredLogicalLayerExecutor pattern).

import type { IQueryService, QueryLocation, QueryOptions, FeatureInfo } from './IQueryService';

export class DeferredQueryService implements IQueryService {
    private service?: IQueryService;

    bind(service: IQueryService): void {
        this.service = service;
    }

    async queryFeatures(location: QueryLocation, options?: QueryOptions): Promise<FeatureInfo[]> {
        if (!this.service) return [];
        return this.service.queryFeatures(location, options);
    }
}
