// src/map/cesium-adapter.ts

import { IMap, IMapCore, IToolService, ISubMapFactory } from './IMapInterfaces';

import { BaseAdapter } from './base-adapter';
import { MapCoreService } from './cesium-services/MapCoreService';
import { MapServiceTemplate } from './cesium-services/MapServiceTemplate';
import { MapFactoryService } from './cesium-services/MapFactoryService';
import { MapLayerService } from './cesium-services/MapLayerService';
import { MapQueryService } from './cesium-services/MapQueryService';
import { MapMarkerService } from './cesium-services/MapMarkerService';
import { DeferredLogicalLayerExecutor } from './logical-layer-executor';
import { DeferredQueryService } from './deferred-query-service';
import type { IQueryService } from './IQueryService';

let cesiumLoadPromise: Promise<void> | null = null;

function buildCesiumAssetUrl(relativePath: string): string {
    const base = ((import.meta as any)?.env?.BASE_URL as string | undefined) ?? '/';
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    return new URL(relativePath.replace(/^\//, ''), new URL(normalizedBase, window.location.href)).toString();
}

async function ensureCesiumLoaded(): Promise<void> {
    if ((globalThis as any).Cesium) return;
    if (cesiumLoadPromise) return cesiumLoadPromise;

    cesiumLoadPromise = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>('script[data-webmapx-cesium]');
        if (existing && (globalThis as any).Cesium) {
            resolve();
            return;
        }

        const cssId = 'webmapx-cesium-widgets-css';
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = buildCesiumAssetUrl('cesium/Widgets/widgets.css');
            document.head.appendChild(link);
        }

        // Tell Cesium where to load its runtime assets (Workers/, Assets/, Widgets/, etc.).
        (globalThis as any).CESIUM_BASE_URL = buildCesiumAssetUrl('cesium/');

        const script = existing ?? document.createElement('script');
        script.setAttribute('data-webmapx-cesium', 'true');
        script.src = buildCesiumAssetUrl('cesium/Cesium.js');
        script.async = true;
        script.onload = () => {
            if ((globalThis as any).Cesium) resolve();
            else reject(new Error('[Cesium] Script loaded but window.Cesium is still undefined.'));
        };
        script.onerror = () => {
            reject(new Error(`[Cesium] Failed to load ${script.src}. Ensure Cesium assets are hosted under /cesium/.`));
        };

        if (!existing) {
            document.head.appendChild(script);
        }
    });

    return cesiumLoadPromise;
}

/**
 * The concrete Map implementation for Cesium.
 *
 * Note: This adapter expects CesiumJS to be available as `window.Cesium`.
 */
export class CesiumAdapter extends BaseAdapter implements IMap {
    public readonly engineId = 'cesium';
    public get engineVersion(): string { return (globalThis as any).Cesium?.VERSION ?? ''; }
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
        (this.core as any).onMapReady?.((viewer: any) => {
            const layerService = new MapLayerService(viewer, this.store);
            this.logicalLayerExecutor.bind(layerService);
            (this.core as MapCoreService).setLayerOrderRegistry(layerService);
            this.queryExecutor.bind(new MapQueryService(viewer, layerService));
            this.markerService = new MapMarkerService(viewer);
        });
    }

    // ===== Delegation Methods =====

    protected override engineSetTerrainEnabled(enabled: boolean, terrainSource?: unknown): boolean {
        return this.core.setTerrainEnabled(enabled, terrainSource as string | undefined);
    }

    isTerrainEnabled(): boolean | null {
        return this.core.isTerrainEnabled();
    }

    setDoubleClickZoomEnabled(_enabled: boolean): void {
        // Cesium has no separate double-click zoom
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

    /**
     * Cesium paints two different blacks: `scene.backgroundColor` for the space
     * around the globe, and `globe.baseColor` for the sphere itself wherever no
     * imagery covers it. A map with no basemap shows both, so both are set —
     * otherwise "no background layer" looks like a bug rather than an ocean.
     *
     * The star box has to go with them: it is drawn over the background colour,
     * so leaving it on would hide the very thing being set.
     */
    protected engineSetBackgroundColor(color: string | null): boolean {
        // Cesium is loaded at runtime, not imported — the same accessor the
        // other Cesium services use.
        const Cesium = (globalThis as any).Cesium;
        if (!Cesium) return false;

        (this.core as any).onMapReady?.((viewer: any) => {
            const scene = viewer?.scene;
            if (!scene) return;

            if (!color) {
                scene.backgroundColor = Cesium.Color.BLACK.clone();
                scene.globe.baseColor = Cesium.Color.BLACK.clone();
                if (scene.skyBox) scene.skyBox.show = true;
                return;
            }

            const parsed = Cesium.Color.fromCssColorString(color);
            if (!parsed) return;
            scene.backgroundColor = parsed;
            scene.globe.baseColor = parsed;
            if (scene.skyBox) scene.skyBox.show = false;
        });
        return true;
    }

}

export async function createCesiumAdapter(): Promise<CesiumAdapter> {
    await ensureCesiumLoaded();
    return new CesiumAdapter();
}
