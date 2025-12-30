// src/map/cesium-adapter.ts

import { IMapCore, IToolService, IMapFactory, ILayerService } from './IMapInterfaces';
import { MapStateStore } from '../store/map-state-store';
import { MapEventBus, LngLat, Pixel } from '../store/map-events';
import { IMapAdapter } from './IMapAdapter';
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
 * The concrete Map Adapter implementation (Cesium).
 *
 * Note: This adapter expects CesiumJS to be available as `window.Cesium`.
 */
export class CesiumAdapter implements IMapAdapter {
    public readonly store: MapStateStore;
    public readonly events: MapEventBus;
    public readonly core: IMapCore;
    public readonly toolService: IToolService;
    public readonly mapFactory: IMapFactory;
    public layerService?: ILayerService;

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

    public project(coords: LngLat): Pixel {
        return this.core.project(coords);
    }
}

export async function createCesiumAdapter(): Promise<CesiumAdapter> {
    await ensureCesiumLoaded();
    return new CesiumAdapter();
}
