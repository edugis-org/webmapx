// src/map/cesium-services/MapFactoryService.ts

import type { IMapFactory, IMap, ISource, ILayer, LayerSpec, MapCreateOptions } from '../IMapInterfaces';
import type { LngLat, Pixel } from '../../store/map-events';

function getCesium(): any {
    return (globalThis as any).Cesium;
}

function isShadowRoot(root: unknown): root is ShadowRoot {
    return typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot;
}

function zoomToHeightMeters(zoom: number): number {
    // Very rough approximation: zoom 0 ~ whole earth.
    const base = 20_000_000;
    return Math.max(10, base / Math.pow(2, Math.max(0, zoom)));
}

function heightMetersToZoom(height: number): number {
    const base = 20_000_000;
    if (!isFinite(height) || height <= 0) return 0;
    return Math.log2(base / height);
}

const WEB_MERCATOR_EARTH_RADIUS_M = 6378137;
const LOGICAL_TILE_SIZE = 512;

function clampLatitude(lat: number): number {
    return Math.max(-85.05112878, Math.min(85.05112878, lat));
}

function webMercatorMetersPerPixelAtLat(zoom: number, lat: number): number {
    const phi = (clampLatitude(lat) * Math.PI) / 180;
    const circumference = 2 * Math.PI * WEB_MERCATOR_EARTH_RADIUS_M;
    return (circumference * Math.cos(phi)) / (LOGICAL_TILE_SIZE * Math.pow(2, zoom));
}

function zoomToCameraHeightMeters(viewer: any, zoom: number, lat: number): number {
    const canvas = viewer.scene.canvas;
    const heightPx = Math.max(1, canvas.clientHeight || canvas.height || 1);
    const frustum = viewer.camera.frustum;
    const fovy = (frustum && 'fovy' in frustum) ? (frustum as any).fovy : Math.PI / 3;
    const metersPerPixel = webMercatorMetersPerPixelAtLat(zoom, lat);
    return Math.max(10, (metersPerPixel * heightPx) / (2 * Math.tan(fovy / 2)));
}

class CesiumSource implements ISource {
    constructor(
        public readonly id: string,
        private getDataSource: () => any | null,
        private setDataFn: (data: GeoJSON.FeatureCollection) => void
    ) {}

    setData(data: GeoJSON.FeatureCollection): void {
        this.setDataFn(data);
    }
}

class CesiumLayer implements ILayer {
    constructor(
        public readonly id: string,
        private readonly sourceId: string,
        private readonly destroyFn: () => void
    ) {}

    getSource(): ISource {
        // Cesium doesn't separate layer from source the same way; tools shouldn't depend on this.
        return { id: this.sourceId, setData: () => {} };
    }

    remove(): void {
        this.destroyFn();
    }
}

type CesiumSourceState = {
    dataSource: any | null;
    layerSpecs: LayerSpec[];
};

class CesiumMap implements IMap {
    private sources = new Map<string, CesiumSource>();
    private sourceState = new Map<string, CesiumSourceState>();
    private layers = new Map<string, CesiumLayer>();

    constructor(private readonly viewer: any) {}

    setViewport(center: [number, number], zoom: number, _bearing?: number, _pitch?: number): void {
        const Cesium = getCesium();
        if (!Cesium) return;
        const height = zoomToCameraHeightMeters(this.viewer, zoom, center[1]);
        this.viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(center[0], center[1], height),
        });
    }

    createSource(sourceId: string, data: GeoJSON.FeatureCollection): ISource {
        if (this.sources.has(sourceId)) {
            return this.sources.get(sourceId)!;
        }

        const Cesium = getCesium();
        if (!Cesium) {
            const fallback: ISource = { id: sourceId, setData: () => {} };
            return fallback;
        }

        this.sourceState.set(sourceId, { dataSource: null, layerSpecs: [] });

        const setData = (nextData: GeoJSON.FeatureCollection) => {
            const state = this.sourceState.get(sourceId);
            if (!state) return;
            const previous = state.dataSource;
            void Cesium.GeoJsonDataSource.load(nextData, { clampToGround: false }).then((loaded: any) => {
                if (previous) {
                    this.viewer.dataSources.remove(previous, true);
                }
                state.dataSource = loaded;
                this.viewer.dataSources.add(loaded);
                this.applyLayerStyles(sourceId);
            });
        };

        setData(data);

        const source = new CesiumSource(
            sourceId,
            () => this.sourceState.get(sourceId)?.dataSource ?? null,
            setData
        );
        this.sources.set(sourceId, source);
        return source;
    }

    getSource(sourceId: string): ISource | null {
        return this.sources.get(sourceId) ?? null;
    }

    createLayer(spec: LayerSpec): ILayer {
        if (this.layers.has(spec.id)) {
            return this.layers.get(spec.id)!;
        }

        const state = this.sourceState.get(spec.sourceId);
        if (state) {
            state.layerSpecs = [...state.layerSpecs, spec];
            this.applyLayerStyles(spec.sourceId);
        }

        const layer = new CesiumLayer(spec.id, spec.sourceId, () => {
            const state = this.sourceState.get(spec.sourceId);
            if (state) {
                state.layerSpecs = state.layerSpecs.filter(s => s.id !== spec.id);
                this.applyLayerStyles(spec.sourceId);
            }
            this.layers.delete(spec.id);
        });
        this.layers.set(spec.id, layer);
        return layer;
    }

    getLayer(layerId: string): ILayer | null {
        return this.layers.get(layerId) ?? null;
    }

    onReady(callback: () => void): void {
        // Viewer is usable immediately after creation.
        queueMicrotask(callback);
    }

    destroy(): void {
        try {
            this.viewer?.destroy?.();
        } catch {
            // ignore
        }
        this.sources.clear();
        this.sourceState.clear();
        this.layers.clear();
    }

    private applyLayerStyles(sourceId: string): void {
        const Cesium = getCesium();
        if (!Cesium) return;
        const state = this.sourceState.get(sourceId);
        const dataSource = state?.dataSource;
        if (!state || !dataSource) return;

        const fillLayers = state.layerSpecs.filter(spec => spec.type === 'fill');
        const lineLayers = state.layerSpecs.filter(spec => spec.type === 'line');

        const fill = fillLayers[fillLayers.length - 1];
        const line = lineLayers[lineLayers.length - 1];

        const fillColor = (fill?.paint as any)?.['fill-color'] ?? '#3388ff';
        const fillOpacity = (fill?.paint as any)?.['fill-opacity'] ?? 0.2;
        const lineColor = (line?.paint as any)?.['line-color'] ?? '#3388ff';
        const lineWidth = (line?.paint as any)?.['line-width'] ?? 2;

        const entities = dataSource.entities?.values ?? [];
        for (const entity of entities) {
            if (entity.polygon) {
                entity.polygon.material = Cesium.Color.fromCssColorString(fillColor).withAlpha(fillOpacity);
                entity.polygon.outline = true;
                entity.polygon.outlineColor = Cesium.Color.fromCssColorString(lineColor).withAlpha(1);
            }
            if (entity.polyline) {
                entity.polyline.material = Cesium.Color.fromCssColorString(lineColor).withAlpha(1);
                entity.polyline.width = lineWidth;
            }
        }
    }
}

export class MapFactoryService implements IMapFactory {
    private applyInsetContainerFixes(container: HTMLElement): void {
        if (!container.classList.contains('inset-map')) return;

        // Cesium expects a "normal" container with stable layout metrics. The inset map component
        // uses translate/scale tricks for MapLibre; that can result in partial rendering in Cesium.
        container.style.transform = 'none';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
    }

    private ensureCesiumShadowStyles(container: HTMLElement): void {
        const root = container.getRootNode();
        if (!isShadowRoot(root)) return;

        const styleId = 'webmapx-cesium-shadow-styles';
        if (root.querySelector(`#${styleId}`)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .cesium-viewer,
            .cesium-viewer-cesiumWidgetContainer,
            .cesium-widget,
            .cesium-widget canvas {
                width: 100%;
                height: 100%;
                display: block;
            }
            .cesium-widget canvas {
                outline: none;
            }
            .cesium-viewer,
            .cesium-viewer-cesiumWidgetContainer,
            .cesium-widget {
                position: absolute;
                inset: 0;
            }
            /* Keep credits from consuming layout inside shadow DOM insets. */
            .cesium-widget-credits,
            .cesium-credit-logoContainer,
            .cesium-credit-textContainer {
                display: none !important;
            }
        `;
        root.appendChild(style);
    }

    createMap(container: HTMLElement, options?: MapCreateOptions): IMap {
        const Cesium = getCesium();
        if (!Cesium) {
            throw new Error('[Cesium] window.Cesium not found. Load CesiumJS before using the cesium adapter.');
        }

        this.applyInsetContainerFixes(container);
        this.ensureCesiumShadowStyles(container);

        const center = options?.center ?? [0, 0];
        const zoom = options?.zoom ?? 1;

        const osmProvider = new Cesium.UrlTemplateImageryProvider({
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            subdomains: ['a', 'b', 'c'],
            credit: '&copy; OpenStreetMap contributors',
        });

        const creditContainer = document.createElement('div');
        creditContainer.style.display = 'none';

        const viewer = new Cesium.Viewer(container, {
            animation: false,
            baseLayerPicker: false,
            fullscreenButton: false,
            geocoder: false,
            homeButton: false,
            infoBox: false,
            navigationHelpButton: false,
            sceneModePicker: false,
            selectionIndicator: false,
            timeline: false,
            vrButton: false,
            // allow passive inset use
            scene3DOnly: true,
            baseLayer: new Cesium.ImageryLayer(osmProvider),
            terrainProvider: new Cesium.EllipsoidTerrainProvider(),
            creditContainer,
        });

        // Keep Cesium's canvas size in sync (helps with shadow DOM and inset rendering).
        const resize = () => {
            try {
                viewer.resize?.();
                viewer.scene?.requestRender?.();
            } catch {
                // ignore
            }
        };
        resize();
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);
        const originalDestroy = viewer.destroy?.bind(viewer);
        viewer.destroy = () => {
            resizeObserver.disconnect();
            return originalDestroy?.();
        };

        if (options?.interactive === false) {
            const controller = viewer.scene?.screenSpaceCameraController;
            if (controller) {
                controller.enableRotate = false;
                controller.enableTranslate = false;
                controller.enableZoom = false;
                controller.enableTilt = false;
                controller.enableLook = false;
            }
        }

        // Initial viewport
        const height = zoomToCameraHeightMeters(viewer, zoom, center[1]);
        viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(center[0], center[1], height),
        });

        // Expose small helpers (useful for debugging)
        (viewer as any)._webmapx = {
            project: (coords: LngLat): Pixel => {
                const cart = Cesium.Cartesian3.fromDegrees(coords[0], coords[1]);
                const point = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, cart);
                return point ? [point.x, point.y] : [0, 0];
            },
            heightMetersToZoom,
            zoomToHeightMeters,
        };

        return new CesiumMap(viewer);
    }
}
