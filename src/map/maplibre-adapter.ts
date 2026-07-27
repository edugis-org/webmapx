// src/map/maplibre-adapter.ts

import { IMap, IMapCore, ISource, IToolService, ISubMapFactory, LayerInsertOptions, type SourceFeatureQueryOptions, type SourceFeatureSample, type QueryLayerFeaturesOptions } from './IMapInterfaces';
import * as _ml from 'maplibre-gl';

import { BaseAdapter } from './base-adapter';
import { MapCoreService } from './maplibre-services/MapCoreService';
import { MapServiceTemplate } from './maplibre-services/MapServiceTemplate';
import { MapFactoryService } from './maplibre-services/MapFactoryService';
import { MapLayerService } from './maplibre-services/MapLayerService';
import { MapQueryService } from './maplibre-services/MapQueryService';
import { MapMarkerService } from './maplibre-services/MapMarkerService';
import { DeferredLogicalLayerExecutor } from './logical-layer-executor';
import { DeferredQueryService } from './deferred-query-service';
import type { IQueryService } from './IQueryService';

/**
 * The concrete Map implementation for MapLibre.
 * Implements the unified IMap interface by delegating to specialized services.
 */
export class MapLibreAdapter extends BaseAdapter implements IMap {
    public readonly engineId = 'maplibre';
    public readonly engineVersion: string = typeof (_ml as any).getVersion === 'function'
        ? (_ml as any).getVersion()
        : ((_ml as any).version ?? '');
    private readonly core: IMapCore;
    public readonly toolService: IToolService;
    public readonly queryService: IQueryService;
    public readonly mapFactory: ISubMapFactory;
    private readonly logicalLayerExecutor: DeferredLogicalLayerExecutor;
    private readonly queryExecutor: DeferredQueryService;
    private markerService: MapMarkerService | null = null;
    private layerService: MapLayerService | null = null;
    /** Composite (style-layer) source registrations that arrived before `layerService`
     *  was bound — flushed once it is, so they still go through native-format conversion
     *  instead of falling through to the un-normalized `core.addSource` path below. */
    private pendingCompositeSources: Array<{ id: string; config: unknown }> = [];

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
            const bindLogicalLayers = () => {
                const layerService = new MapLayerService(map, this.store);
                this.layerService = layerService;
                this.logicalLayerExecutor.bind(layerService);
                this.queryExecutor.bind(new MapQueryService(map, layerService, this.store));
                this.markerService = new MapMarkerService(map);

                for (const { id, config } of this.pendingCompositeSources) {
                    layerService.registerCompositeSource(id, config as any);
                }
                this.pendingCompositeSources = [];
            };

            if (typeof map?.once === 'function') {
                map.once('load', bindLogicalLayers);
                return;
            }

            // Fallback for unexpected map object shapes.
            bindLogicalLayers();
        });
    }

    // ===== Delegation Methods =====

    protected override engineSetTerrainEnabled(enabled: boolean, terrainSource?: unknown): boolean {
        // Resolve logical source id → native source id so core uses the same
        // source that MapLayerService already registered for the hillshade layer.
        const logicalId = (terrainSource as any)?.id as string | undefined;
        const nativeSourceId = logicalId ? this.layerService?.getNativeSourceId(logicalId) : undefined;
        return (this.core as MapCoreService).setTerrainEnabled(enabled, terrainSource, nativeSourceId);
    }

    isTerrainEnabled(): boolean | null {
        return this.core.isTerrainEnabled();
    }

    protected override engineSetProjection(projection: string | { name: string; center?: [number, number]; parallels?: [number, number] }): boolean {
        return this.core.setProjection(projection);
    }

    getProjection(): { name: string; center?: [number, number]; parallels?: [number, number] } | null {
        return this.core.getProjection();
    }

    getSourceData(sourceId: string): GeoJSON.FeatureCollection | string | null {
        const direct = this.core.getSourceData(sourceId);
        if (direct !== null) return direct;
        // Sources added via style layers are registered under a native ID — translate and retry.
        const nativeId = this.layerService?.getNativeSourceId(sourceId);
        if (nativeId && nativeId !== sourceId) {
            const byNative = this.core.getSourceData(nativeId);
            if (byNative !== null) return byNative;
        }
        return this.logicalLayerExecutor.getSourceData(sourceId);
    }

    getSourceConfig(sourceId: string): Record<string, unknown> | null {
        return this.layerService?.getSourceConfig(sourceId) ?? super.getSourceConfig(sourceId);
    }

    getSource(sourceId: string): ISource | undefined {
        const direct = this.core.getSource(sourceId);
        if (direct) return direct;
        // Sources added via style layers are registered under a native ID — translate and retry.
        const nativeId = this.layerService?.getNativeSourceId(sourceId);
        if (nativeId && nativeId !== sourceId) {
            const byNative = this.core.getSource(nativeId);
            if (byNative) return byNative;
        }
        return super.getSource(sourceId);
    }

    querySourceFeatures(sourceId: string, options?: SourceFeatureQueryOptions): SourceFeatureSample | null {
        return this.logicalLayerExecutor.querySourceFeatures(sourceId, options);
    }

    protected override readonly _decomposeComposite = true;

    protected async engineAddLayer(layer: any, options?: LayerInsertOptions): Promise<boolean> {
        const success = await this.logicalLayerExecutor.addLayer(layer, options);
        if (success) return true;
        // Composite sublayers (tagged with logicalLayerId) must not fall through to
        // core.addLayer — they have no inline source def and would fail there.
        if ((layer as any)?.metadata?.logicalLayerId) return false;
        return this.core.addLayer(layer, options);
    }

    protected engineRegisterCompositeSource(id: string, config: unknown): void {
        if (this.layerService) {
            // Route through MapLayerService so SourceConfig is converted to native MapLibre format
            // and the logical→native id mapping is recorded for sublayer lookup.
            this.layerService.registerCompositeSource(id, config as any);
        } else {
            // layerService isn't bound yet (map hasn't fired 'load'). `config` here is still
            // the un-normalized webmapx SourceConfig (e.g. `url: string[]` for xyz), which
            // native MapLibre addSource rejects — queue it and let bindLogicalLayers flush
            // it through MapLayerService once bound, instead of adding it raw.
            this.pendingCompositeSources.push({ id, config });
        }
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
