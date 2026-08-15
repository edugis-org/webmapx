// src/map/openlayers-adapter.ts

import { IMap, IMapCore, IToolService, ISubMapFactory } from './IMapInterfaces';
import { VERSION as olVersion } from 'ol/util.js';

import { BaseAdapter } from './base-adapter';
import { MapCoreService } from './openlayers-services/MapCoreService';
import { MapServiceTemplate } from './openlayers-services/MapServiceTemplate';
import { MapFactoryService } from './openlayers-services/MapFactoryService';
import { MapLayerService } from './openlayers-services/MapLayerService';
import { MapQueryService } from './openlayers-services/MapQueryService';
import { MapMarkerService } from './openlayers-services/MapMarkerService';
import { DeferredLogicalLayerExecutor } from './logical-layer-executor';
import { DeferredQueryService } from './deferred-query-service';
import type { IQueryService } from './IQueryService';
import type { MapProjectionState } from '../store/IMapState';

/**
 * The concrete Map implementation for OpenLayers.
 * Implements the unified IMap interface by delegating to specialized services.
 */
export class OpenLayersAdapter extends BaseAdapter implements IMap {
    public readonly engineId = 'openlayers';
    public readonly engineVersion = olVersion;
    private readonly core: IMapCore;
    public readonly toolService: IToolService;
    public readonly queryService: IQueryService;
    public readonly mapFactory: ISubMapFactory;
    private readonly logicalLayerExecutor: DeferredLogicalLayerExecutor;
    private readonly queryExecutor: DeferredQueryService;
    private markerService: MapMarkerService | null = null;

    constructor() {
        super();
        this.core = new MapCoreService(this.store, this.events);
        this.toolService = new MapServiceTemplate();
        this.logicalLayerExecutor = new DeferredLogicalLayerExecutor();
        this.queryExecutor = new DeferredQueryService();
        this.queryService = this.queryExecutor;
        this.mapFactory = new MapFactoryService();
        // Wait for mapInstance to be ready, then initialize layerService
        (this.core as any).onMapReady?.((map: any) => {
            const layerService = new MapLayerService(map, this.store);
            (this.core as MapCoreService).setLayerOrderRegistry(layerService);
            this.logicalLayerExecutor.bind(layerService);
            this.queryExecutor.bind(new MapQueryService(map, layerService, this.store));
            this.markerService = new MapMarkerService(map);
        });
    }

    // ===== Delegation Methods =====

    setTouchCaptureEnabled(enabled: boolean): void {
        this.core.setTouchCaptureEnabled(enabled);
    }

    /**
     * OpenLayers is the only engine here that can draw a 2D map in an arbitrary
     * projection — MapLibre and Leaflet are Mercator, Cesium is a globe — so it
     * is the only one that overrides these. `BaseAdapter` mirrors the result into
     * `store.mapProjection`.
     */
    protected override engineSetProjection(projection: string | MapProjectionState): boolean {
        return this.core.setProjection(projection);
    }

    getProjection(): MapProjectionState | null {
        return this.core.getProjection();
    }

    protected getCore(): IMapCore {
        return this.core;
    }

    protected getLogicalLayerExecutor(): DeferredLogicalLayerExecutor {
        return this.logicalLayerExecutor;
    }

    protected getMarkerService(): MapMarkerService | null {
        return this.markerService;
    }

}
