// src/map/cesium-adapter.ts

import { IMap, IMapCore, IToolService, ISubMapFactory, LayerInsertOptions } from './IMapInterfaces';

import type { MapStyle } from '../config/types';
import { LngLat, Pixel } from '../store/map-events';
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
import type { MarkerOptions } from './IMapInterfaces';

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

    initialize(containerId: string, options?: { center?: [number, number]; zoom?: number; minZoom?: number; maxZoom?: number; minPitch?: number; maxPitch?: number; styleUrl?: string; style?: MapStyle }): void {
        this.core.initialize(containerId, options);
    }

    getViewportState() {
        return this.core.getViewportState();
    }

    setViewport(center: [number, number], zoom: number): void {
        this.core.setViewport(center, zoom);
    }

    getZoom(): number {
        return this.core.getZoom();
    }

    setZoom(level: number): void {
        this.core.setZoom(level);
    }

    getBearing(): number {
        return this.core.getBearing();
    }

    setBearing(bearing: number): void {
        this.core.setBearing(bearing);
    }

    getPitch(): number {
        return this.core.getPitch();
    }

    setPitch(pitch: number): void {
        this.core.setPitch(pitch);
    }

    resetNorth(): void {
        this.core.resetNorth();
    }

    resetNorthPitch(): void {
        this.core.resetNorthPitch();
    }

    fitBounds(bbox: [number, number, number, number]): void {
        this.core.fitBounds(bbox);
    }

    setProjection(_projection: string | { name: string; center?: [number, number]; parallels?: [number, number] }): boolean {
        return false;
    }

    getProjection(): { name: string; center?: [number, number]; parallels?: [number, number] } | null {
        return null;
    }

    setCursor(cursor: string): void {
        this.core.setCursor(cursor);
    }

    setPanEnabled(enabled: boolean): void {
        this.core.setPanEnabled(enabled);
    }

    setTouchCaptureEnabled(_enabled: boolean): void {}

    setDoubleClickZoomEnabled(_enabled: boolean): void {
        // Cesium has no separate double-click zoom
    }

    setLayerVisibility(layerId: string, visible: boolean): void {
        this.core.setLayerVisibility(layerId, visible);
    }

    getSourceData(sourceId: string): GeoJSON.FeatureCollection | string | null {
        return this.core.getSourceData(sourceId) ?? this.logicalLayerExecutor.getSourceData(sourceId);
    }

    project(coords: LngLat): Pixel {
        return this.core.project(coords);
    }

    unproject(pixel: Pixel): LngLat | null {
        return this.core.unproject(pixel);
    }

    getNavigationCapabilities() {
        return this.core.getNavigationCapabilities();
    }

    protected async engineAddLayer(layer: any, options?: LayerInsertOptions): Promise<boolean> {
        const success = await this.logicalLayerExecutor.addLayer(layer, options);
        if (success) return true;
        return this.core.addLayer(layer, options);
    }

    removeLogicalLayer(layerId: string): void {
        this.removeLayer(layerId);
    }

    addSource(id: string, config: any): void {
        this.core.addSource(id, config);
    }

    protected engineRemoveLayer(id: string): void {
        this.logicalLayerExecutor.removeLayer(id);
        this.core.removeLayer(id);
    }

    protected engineRemoveSource(id: string): void {
        this.core.removeSource(id);
    }

    getSource(id: string) {
        return this.core.getSource(id) ?? (
            this.logicalLayerExecutor.getSourceData(id) !== null
                ? { id, setData: (data: GeoJSON.FeatureCollection) => { this.logicalLayerExecutor.setSourceData(id, data); } }
                : undefined
        );
    }

    suppressBusySignalForSource(sourceId: string): void {
        this.core.suppressBusySignalForSource(sourceId);
    }

    unsuppressBusySignalForSource(sourceId: string): void {
        this.core.unsuppressBusySignalForSource(sourceId);
    }

    addMarker(id: string, lngLat: LngLat, options?: MarkerOptions): void {
        this.markerService?.add(id, lngLat, options);
    }

    moveMarker(id: string, lngLat: LngLat): void {
        this.markerService?.move(id, lngLat);
    }

    removeMarker(id: string): void {
        this.markerService?.remove(id);
    }

}

export async function createCesiumAdapter(): Promise<CesiumAdapter> {
    await ensureCesiumLoaded();
    return new CesiumAdapter();
}
