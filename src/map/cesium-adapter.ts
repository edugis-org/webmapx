// src/map/cesium-adapter.ts

import { IMap, IMapCore, IToolService, ISubMapFactory, ILayerService } from './IMapInterfaces';
import type { LayerConfig, SourceConfig, CatalogConfig, MapStyle } from '../config/types';
import { MapStateStore } from '../store/map-state-store';
import { MapEventBus, LngLat, Pixel } from '../store/map-events';
import { MapCoreService } from './cesium-services/MapCoreService';
import { MapServiceTemplate } from './cesium-services/MapServiceTemplate';
import { MapFactoryService } from './cesium-services/MapFactoryService';
import { MapLayerService } from './cesium-services/MapLayerService';

let cesiumLoadPromise: Promise<void> | null = null;

function buildCesiumAssetUrl(relativePath: string): string {
    const base = ((import.meta as any)?.env?.BASE_URL as string | undefined) ?? '/';
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    return new URL(relativePath.replace(/^\//, ''), new URL(normalizedBase, window.location.origin)).toString();
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
export class CesiumAdapter implements IMap {
    public readonly store: MapStateStore;
    public readonly events: MapEventBus;
    private readonly core: IMapCore;
    public readonly toolService: IToolService;
    public readonly mapFactory: ISubMapFactory;
    private layerService?: ILayerService;

    constructor() {
        this.store = new MapStateStore();
        this.events = new MapEventBus();
        this.core = new MapCoreService(this.store, this.events);
        this.toolService = new MapServiceTemplate();
        this.mapFactory = new MapFactoryService();
        this.layerService = undefined;
        (this.core as any).onMapReady?.((viewer: any) => {
            this.layerService = new MapLayerService(viewer, this.store);
        });
    }

    // ===== Delegation Methods =====

    initialize(containerId: string, options?: { center?: [number, number]; zoom?: number; styleUrl?: string; style?: MapStyle }): void {
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

    project(coords: LngLat): Pixel {
        return this.core.project(coords);
    }

    unproject(pixel: Pixel): LngLat | null {
        return this.core.unproject(pixel);
    }

    getNavigationCapabilities() {
        return this.core.getNavigationCapabilities();
    }

    addNativeLayer(layer: any): void {
        this.core.addNativeLayer(layer);
    }

    addSource(id: string, config: any): void {
        this.core.addSource(id, config);
    }

    removeLayer(id: string): void {
        this.core.removeLayer(id);
    }

    removeSource(id: string): void {
        this.core.removeSource(id);
    }

    getSource(id: string) {
        return this.core.getSource(id);
    }

    suppressBusySignalForSource(sourceId: string): void {
        this.core.suppressBusySignalForSource(sourceId);
    }

    unsuppressBusySignalForSource(sourceId: string): void {
        this.core.unsuppressBusySignalForSource(sourceId);
    }

    setCatalog(catalog: CatalogConfig): void {
        this.layerService?.setCatalog(catalog);
    }

    async addLayer(layerId: string, layerConfig: LayerConfig, sourceConfig: SourceConfig): Promise<boolean> {
        return this.layerService?.addLayer(layerId, layerConfig, sourceConfig) ?? false;
    }

    getVisibleLayers(): string[] {
        return this.layerService?.getVisibleLayers() ?? [];
    }

    isLayerVisible(layerId: string): boolean {
        return this.layerService?.isLayerVisible(layerId) ?? false;
    }

}

export async function createCesiumAdapter(): Promise<CesiumAdapter> {
    await ensureCesiumLoaded();
    return new CesiumAdapter();
}
