// src/map/leaflet-adapter.ts

import { IMap, IMapCore, IToolService, ISubMapFactory } from './IMapInterfaces';
import { version as leafletVersion } from 'leaflet';

import { BaseAdapter } from './base-adapter';
import { MapCoreService } from './leaflet-services/MapCoreService';
import { MapServiceTemplate } from './leaflet-services/MapServiceTemplate';
import { MapFactoryService } from './leaflet-services/MapFactoryService';
import { MapLayerService } from './leaflet-services/MapLayerService';
import { MapQueryService } from './leaflet-services/MapQueryService';
import { MapMarkerService } from './leaflet-services/MapMarkerService';
import { DeferredLogicalLayerExecutor } from './logical-layer-executor';
import { DeferredQueryService } from './deferred-query-service';
import type { IQueryService } from './IQueryService';

/**
 * The concrete Map implementation for Leaflet.
 * Implements the unified IMap interface by delegating to specialized services.
 */
export class LeafletAdapter extends BaseAdapter implements IMap {
    public readonly engineId = 'leaflet';
    public readonly engineVersion = leafletVersion;
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
        this.toolService = new MapServiceTemplate({});
        this.logicalLayerExecutor = new DeferredLogicalLayerExecutor();
        this.queryExecutor = new DeferredQueryService();
        this.queryService = this.queryExecutor;
        this.mapFactory = new MapFactoryService();
        // Wait for mapInstance to be ready, then initialize layerService
        (this.core as any).onMapReady?.((map: any) => {
            const layerService = new MapLayerService(map, this.store);
            (this.core as MapCoreService).setLayerOrderRegistry(layerService);
            this.logicalLayerExecutor.bind(layerService);
            this.queryExecutor.bind(new MapQueryService(map, layerService));
            this.markerService = new MapMarkerService(map);
        });
    }

    // ===== Delegation Methods =====

    protected getCore(): IMapCore {
        return this.core;
    }

    protected getLogicalLayerExecutor(): DeferredLogicalLayerExecutor {
        return this.logicalLayerExecutor;
    }

    protected getMarkerService(): MapMarkerService | null {
        return this.markerService;
    }


    /**
     * Leaflet's panes are transparent, so the colour belongs on the container.
     *
     * Set as `--webmapx-map-background`, which `injectLeafletCSSFixes` reads for
     * both the container and the tile pane: the pane would otherwise paint its
     * own paper colour over the container when no tiles are loaded, which is
     * precisely the case a map with no basemap is in.
     */
    protected engineSetBackgroundColor(color: string | null): boolean {
        (this.core as any).onMapReady?.((map: any) => {
            const container = map?.getContainer?.();
            if (!container) return;
            if (color) {
                // The property feeds the tile pane's rule; the inline colour
                // paints the container itself, which the pane does not cover
                // when no tile layer is loaded. A plain inline declaration is
                // enough now that the stylesheet no longer shouts !important.
                container.style.setProperty('--webmapx-map-background', color);
                container.style.backgroundColor = color;
            } else {
                container.style.removeProperty('--webmapx-map-background');
                container.style.removeProperty('background-color');
            }
        });
        return true;
    }

}
