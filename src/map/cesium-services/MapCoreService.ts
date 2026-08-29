// src/map/cesium-services/MapCoreService.ts

import type { IMapCore, ISource, NavigationCapabilities } from '../IMapInterfaces';
import type { MapStyle } from '../../config/types';
import { MapStateStore } from '../../store/map-state-store';
import { MapEventBus, LngLat, Pixel } from '../../store/map-events';
import { throttle } from '../../utils/throttle';
import { evaluateColor, evaluateNumber } from '../../utils/maplibre-expression-evaluator';
import { isEventFromEditableElement } from '../../utils/dom-focus-utils';
import { forceGeodesicArcType } from './MapLayerService';

function getCesium(): any {
    return (globalThis as any).Cesium;
}

function setSafeProperty(graphics: any, propName: string, value: any): void {
    if (!graphics) return;
    const Cesium = getCesium();
    const currentProp = graphics[propName];
    if (Cesium && currentProp && typeof currentProp.getValue === 'function') {
        const julian = Cesium.JulianDate?.now?.() || new Cesium.JulianDate();
        const currentVal = currentProp.getValue(julian);
        if (currentVal === value) {
            return;
        }
        if (currentVal && typeof currentVal.equals === 'function' && currentVal.equals(value)) {
            return;
        }
    }
    graphics[propName] = value;
}

function setColorMaterial(graphics: any, color: any): void {
    const Cesium = getCesium();
    const material = graphics.material;
    if (Cesium && material instanceof Cesium.ColorMaterialProperty && material.color instanceof Cesium.ConstantProperty) {
        const julian = Cesium.JulianDate?.now?.() || new Cesium.JulianDate();
        const currentVal = material.color.getValue(julian);
        if (currentVal === color || (currentVal && typeof currentVal.equals === 'function' && currentVal.equals(color))) {
            return;
        }
        material.color.setValue(color);
        return;
    }
    graphics.material = color;
}

function zoomToHeightMeters(zoom: number): number {
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

function toolCircleLiftMeters(radiusMeters: number): number {
    if (!(typeof radiusMeters === 'number' && isFinite(radiusMeters) && radiusMeters > 0)) {
        return 0.05;
    }

    // Keep the lift subtle at street scale, but let it grow for large low-zoom circles.
    return Math.max(0.05, Math.min(4, radiusMeters * 0.005));
}

function zoomOffsetScale(zoom: number): number {
    if (!(typeof zoom === 'number' && isFinite(zoom))) {
        return 1;
    }

    // Higher zoom -> smaller offset. Lower zoom -> larger offset.
    return Math.max(0.05, Math.min(16, Math.pow(2, 10 - zoom)));
}

function buildCircleOutlineLonLat(lon: number, lat: number, radiusMeters: number, samples = 48): Array<[number, number]> {
    const latRad = (lat * Math.PI) / 180;
    const dLat = (radiusMeters / WEB_MERCATOR_EARTH_RADIUS_M) * (180 / Math.PI);
    const cosLat = Math.max(1e-6, Math.cos(latRad));
    const dLon = dLat / cosLat;
    const positions: Array<[number, number]> = [];

    for (let i = 0; i <= samples; i += 1) {
        const t = (i / samples) * Math.PI * 2;
        const ringLon = lon + dLon * Math.cos(t);
        const ringLat = lat + dLat * Math.sin(t);
        positions.push([ringLon, ringLat]);
    }

    return positions;
}

type CesiumRuntimeLayerState = {
    spec: any;
    dataSource: any | null;
    /**
     * Whether a reload of this layer is already under way, and whether newer
     * data arrived while it was.
     *
     * Cesium is the one engine that cannot simply be handed new data: every
     * update builds a whole new `GeoJsonDataSource` and swaps it into the
     * viewer. A computed source refreshing itself asks for that up to sixty
     * times a second, and the loads then queue faster than they finish — which
     * is not a slow map but a dead tab, with no error to show for it. So only
     * one load runs at a time and anything asked for meanwhile collapses into a
     * single repeat with the newest data, which is the most Cesium can actually
     * display anyway.
     */
    loading?: boolean;
    pending?: boolean;
};

type CesiumRuntimeSourceState = {
    data: GeoJSON.FeatureCollection | null;
    layers: CesiumRuntimeLayerState[];
};

export class MapCoreService implements IMapCore {
    constructor(
        private readonly store: MapStateStore,
        private readonly eventBus?: MapEventBus
    ) {}

    private viewer: any = null;
    private readyCbs: Array<(viewer: any) => void> = [];

    private sources = new Map<string, ISource>();
    private sourceState = new Map<string, CesiumRuntimeSourceState>();
    private minZoom?: number;
    private maxZoom?: number;
    private minPitch = 0;
    private maxPitch = 85;
    private maxBounds?: [number, number, number, number];
    private enforcingMaxBounds = false;
    private isClamping = false;
    private lastCenter: [number, number] = [0, 0];
    private lastStyledZoom: number | null = null;
    private readonly dispatchViewportStateThrottled = throttle(() => this.dispatchViewportState(), 100);
    private runtimeLayerOrder: string[] = [];
    private layerOrderRegistry: { registerInlineLayer: (id: string, options?: any) => void; unregisterInlineLayer: (id: string) => void } | null = null;
    private readonly layerZStepMeters = 0.5;
    private readonly basePolylinePositions = new WeakMap<any, any[]>();
    private terrainEnabled = false;
    private arcgisTerrainProvider: any = null;
    private boundKeydown: ((e: KeyboardEvent) => void) | null = null;

    public initialize(
        containerId: string,
        options?: { center?: [number, number]; zoom?: number; minZoom?: number; maxZoom?: number; minPitch?: number; maxPitch?: number; maxBounds?: [number, number, number, number]; styleUrl?: string; style?: MapStyle }
    ): void {
        const Cesium = getCesium();
        if (!Cesium) {
            throw new Error('[Cesium] window.Cesium not found. Load CesiumJS before using the cesium adapter.');
        }

        const center = options?.center ?? [0, 0];
        const zoom = options?.zoom ?? 1;
        const target = this.resolveContainer(containerId);
        this.minZoom = options?.minZoom;
        this.maxZoom = options?.maxZoom;
        this.maxBounds = options?.maxBounds;
        this.minPitch = typeof options?.minPitch === 'number' ? Math.max(0, Math.min(85, options.minPitch)) : 0;
        this.maxPitch = typeof options?.maxPitch === 'number' ? Math.max(0, Math.min(85, options.maxPitch)) : 85;
        if (this.minPitch > this.maxPitch) {
            this.minPitch = this.maxPitch;
        }

        const creditContainer = document.createElement('div');
        creditContainer.style.display = 'none';

        this.viewer = new Cesium.Viewer(target, {
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
            scene3DOnly: true,
            baseLayer: false,
            terrainProvider: new Cesium.EllipsoidTerrainProvider(),
            creditContainer,
        });

        // Workaround for black globe on some mobile GPUs: HDR/atmosphere shaders fail
        // and produce a black globe (https://github.com/CesiumGS/cesium/issues/10442).
        if (navigator.maxTouchPoints > 0) {
            this.viewer.scene.highDynamicRange = false;
            this.viewer.scene.skyAtmosphere.show = false;
            this.viewer.scene.globe.showGroundAtmosphere = false;
        }

        const clampedZoom = this.clampZoom(zoom);
        this.setCameraView(center, clampedZoom, false);
        this.applyZoomDistanceLimits(center[1]);

        if (this.maxBounds) {
            // camera.changed fires only after 50% camera movement by default — far too
            // coarse for bounds enforcement. Lower it and clamp every frame so pan
            // inertia hits the bbox edge instead of gliding past and snapping back.
            this.viewer.camera.percentageChanged = 0.01;
            this.viewer.scene.preUpdate.addEventListener(() => this.enforceMaxBounds());
        }

        this.attachEvents();

        // Initial store state (center/zoom will be corrected on first moveEnd tick).
        // mapViewportBounds must be seeded here like the other engines do at load —
        // consumers that read it before the first camera move (e.g. the search tool's
        // in-view ranking) otherwise see null and silently skip view-aware behaviour.
        this.store.dispatch({
            mapLoaded: true,
            mapBusy: false,
            mapCenter: center,
            zoomLevel: zoom,
            mapViewportBounds: this.computeViewportBounds(),
        }, 'MAP');
        this.flushReady();
    }

    public setTerrainEnabled(enabled: boolean, terrainUrl?: string): boolean {
        const Cesium = getCesium();
        if (!Cesium || !this.viewer) return false;
        this.terrainEnabled = enabled;
        if (!enabled) {
            this.viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
            return true;
        }
        if (this.arcgisTerrainProvider) {
            this.viewer.terrainProvider = this.arcgisTerrainProvider;
            return true;
        }
        const url = terrainUrl ?? 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer';
        Promise.resolve(Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(url))
            .then((provider: any) => {
                this.arcgisTerrainProvider = provider;
                if (this.terrainEnabled && this.viewer) {
                    this.viewer.terrainProvider = provider;
                }
            })
            .catch((e: unknown) => console.error('[Cesium] failed to load terrain provider', e));
        return true;
    }

    public isTerrainEnabled(): boolean | null {
        if (!this.viewer) return null;
        return this.terrainEnabled;
    }

    public getElevation(lngLat: [number, number]): number | null {
        const Cesium = getCesium();
        if (!Cesium || !this.viewer || !this.terrainEnabled) return null;
        const carto = Cesium.Cartographic.fromDegrees(lngLat[0], lngLat[1]);
        const height = this.viewer.scene.globe.getHeight(carto);
        return height ?? null;
    }

    public getViewportState(): { center: [number, number]; zoom: number; bearing: number; pitch: number } {
        if (!this.viewer) return { center: this.lastCenter, zoom: 1, bearing: 0, pitch: 0 };
        const Cesium = getCesium();
        if (!Cesium) return { center: this.lastCenter, zoom: 1, bearing: 0, pitch: 0 };

        const camera = this.viewer.camera;
        const center = this.computeViewportCenter() ?? this.lastCenter;
        this.lastCenter = center;
        const height = camera.positionCartographic?.height ?? Cesium.Ellipsoid.WGS84.cartesianToCartographic(camera.positionWC).height;
        const zoom = this.cameraHeightMetersToZoom(height, center[1]);
        const bearing = (camera.heading * 180) / Math.PI;
        const pitch = Cesium.Math.toDegrees(camera.pitch + Math.PI / 2);
        return { center, zoom, bearing, pitch };
    }

    public setViewport(center: [number, number], zoom: number): void {
        if (!this.viewer) return;
        const Cesium = getCesium();
        if (!Cesium) return;
        const clampedZoom = this.clampZoom(zoom);
        this.lastCenter = center;
        this.setCameraView(center, clampedZoom, true);
        this.applyZoomDistanceLimits(center[1]);
    }

    public setZoom(level: number): void {
        const current = this.getViewportState();
        const clampedZoom = this.clampZoom(level);
        if (current.zoom === clampedZoom && clampedZoom !== level) {
            this.dispatchViewportState();
            return;
        }
        this.setViewport(current.center, level);
    }



    public getZoom(): number {
        return this.getViewportState().zoom;
    }

    public getNavigationCapabilities(): NavigationCapabilities {
        return { bearing: true, pitch: true };
    }

    public getBearing(): number {
        return this.getViewportState().bearing;
    }

    public setBearing(bearing: number): void {
        if (!this.viewer) return;
        const Cesium = getCesium();
        if (!Cesium) return;
        const center = this.computeViewportCenter();
        if (!center) return;
        const pitch = this.getPitch();
        this.applyHeadingPitch(center, bearing, pitch);
    }

    public getPitch(): number {
        const Cesium = getCesium();
        if (!Cesium || !this.viewer) return 0;
        return Cesium.Math.toDegrees(this.viewer.camera.pitch + Math.PI / 2);
    }

    public setPitch(pitch: number): void {
        if (!this.viewer) return;
        const Cesium = getCesium();
        if (!Cesium) return;
        const center = this.computeViewportCenter();
        if (!center) return;
        const bearing = this.getBearing();
        const clampedPitch = Math.max(this.minPitch, Math.min(this.maxPitch, pitch));
        this.applyHeadingPitch(center, bearing, clampedPitch);
    }

    public resetNorth(): void {
        this.setBearing(0);
    }

    public resetNorthPitch(): void {
        if (!this.viewer) return;
        this.setBearing(0);
        this.setPitch(0);
    }

    setProjection(_projection: string | { name: string; center?: [number, number]; parallels?: [number, number] }): boolean {
        return false;
    }

    getProjection(): { name: string; center?: [number, number]; parallels?: [number, number] } | null {
        return null;
    }

    private applyHeadingPitch(center: [number, number], bearingDeg: number, pitchDeg: number): void {
        if (!this.viewer) return;
        const Cesium = getCesium();
        if (!Cesium) return;
        const camera = this.viewer.camera;
        const target = Cesium.Cartesian3.fromDegrees(center[0], center[1]);
        const range = Math.max(1, Cesium.Cartesian3.distance(camera.positionWC, target));
        const heading = Cesium.Math.toRadians(bearingDeg);
        const pitch = Cesium.Math.toRadians(-90 + pitchDeg);

        camera.lookAt(target, new Cesium.HeadingPitchRange(heading, pitch, range));
        camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    }

    public addLayer(_layer: any, options?: { beforeLayerId?: string; afterLayerId?: string }): boolean {
        const layer = _layer as any;
        const sourceId = layer?.source;
        if (!sourceId) return false;
        const state = this.sourceState.get(sourceId);
        if (!state) return false;

        const layerId = typeof layer?.id === 'string' ? layer.id : null;
        if (layerId) {
            this.insertRuntimeLayer(layerId, options);
            this.layerOrderRegistry?.registerInlineLayer(layerId, options);
            state.layers = state.layers.filter((entry) => entry?.spec?.id !== layerId);
        }

        const layerState: CesiumRuntimeLayerState = { spec: layer, dataSource: null };
        const inserted = this.insertLayerByOptions(state.layers, layerState, options);
        if (!inserted) {
            state.layers.push(layerState);
        }

        this.refreshSourceLayerData(sourceId);
        return true;
    }

    public removeLayer(_id: string): void {
        const id = _id as any;
        if (typeof id === 'string') {
            this.removeRuntimeLayer(id);
            this.layerOrderRegistry?.unregisterInlineLayer(id);
        }

        for (const [, state] of this.sourceState.entries()) {
            const before = state.layers.length;
            const removedLayers = state.layers.filter((layerState) => layerState.spec?.id === id);
            state.layers = state.layers.filter((layerState) => layerState.spec?.id !== id);
            if (state.layers.length !== before) {
                for (const layerState of removedLayers) {
                    this.removeLayerDataSource(layerState);
                }
                return;
            }
        }
    }

    public addSource(id: string, config: any): void {
        if (!this.viewer) return;
        const Cesium = getCesium();
        if (!Cesium) return;
        if (this.sources.has(id)) return;

        if (config?.type !== 'geojson' || !config.data) return;

        this.sourceState.set(id, { data: config.data, layers: [] });

        const setData = (data: GeoJSON.FeatureCollection) => {
            const state = this.sourceState.get(id);
            if (!state) return;
            state.data = data;
            this.refreshSourceLayerData(id);
        };

        const source: ISource = { id, setData };
        this.sources.set(id, source);
        setData(config.data);
    }

    public removeSource(id: string): void {
        const state = this.sourceState.get(id);
        if (state?.layers?.length) {
            for (const layer of state.layers) {
                const layerId = typeof layer.spec?.id === 'string' ? layer.spec.id : null;
                if (layerId) {
                    this.removeRuntimeLayer(layerId);
                }
                this.removeLayerDataSource(layer);
            }
        }
        this.sourceState.delete(id);
        this.sources.delete(id);
    }

    public getSource(id: string): ISource | undefined {
        return this.sources.get(id);
    }

    public suppressBusySignalForSource(_sourceId: string): void {}
    public unsuppressBusySignalForSource(_sourceId: string): void {}

    public project(coords: LngLat): Pixel {
        const Cesium = getCesium();
        if (!Cesium || !this.viewer) return [0, 0];
        const cart = Cesium.Cartesian3.fromDegrees(coords[0], coords[1]);
        const point = Cesium.SceneTransforms.worldToWindowCoordinates(this.viewer.scene, cart);
        if (!point) return [0, 0];
        return [point.x, point.y];
    }

    public unproject(pixel: Pixel): LngLat | null {
        const Cesium = getCesium();
        if (!Cesium || !this.viewer) return null;
        const position = new Cesium.Cartesian2(pixel[0], pixel[1]);
        const cartesian = this.viewer.camera.pickEllipsoid(position, Cesium.Ellipsoid.WGS84);
        if (!cartesian) return null;
        const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
        return [(carto.longitude * 180) / Math.PI, (carto.latitude * 180) / Math.PI];
    }

    public fitBounds(bbox: [number, number, number, number]): void {
        const Cesium = getCesium();
        if (!Cesium || !this.viewer) return;
        try {
            const west = bbox[0];
            const south = bbox[1];
            const east = bbox[2];
            const north = bbox[3];
            const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);
            const camera = this.viewer.camera;
            camera.flyTo({ destination: rectangle, duration: 3 });
        } catch (_e) {
            // fallback: center
            const lon = (bbox[0] + bbox[2]) / 2;
            const lat = (bbox[1] + bbox[3]) / 2;
            const height = this.zoomToCameraHeightMeters(this.getViewportState().zoom, lat);
            this.viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lon, lat, height), duration: 3 });
        }
    }

    public setCursor(cursor: string): void {
        if (!this.viewer) return;
        const canvas = this.viewer.canvas as HTMLCanvasElement;
        canvas.style.cursor = cursor;
    }

    public setPanEnabled(enabled: boolean): void {
        if (!this.viewer) return;
        const ctrl = this.viewer.scene.screenSpaceCameraController;
        ctrl.enableTranslate = enabled;
        ctrl.enableRotate = enabled;
        ctrl.enableTilt = enabled;
        ctrl.enableZoom = enabled;
    }

    public setTouchCaptureEnabled(_enabled: boolean): void {}

    public setDoubleClickZoomEnabled(_enabled: boolean): void {
        // Cesium has no separate double-click zoom
    }

    public setLayerVisibility(layerId: string, visible: boolean): void {
        for (const state of this.sourceState.values()) {
            for (const entry of state.layers) {
                if (entry.spec?.id === layerId && entry.dataSource) {
                    entry.dataSource.show = visible;
                }
            }
        }
    }

    public getSourceData(sourceId: string): GeoJSON.FeatureCollection | string | null {
        const state = this.sourceState.get(sourceId);
        return state?.data ?? null;
    }

    public onMapReady(callback: (viewer: any) => void): void {
        if (this.viewer) {
            callback(this.viewer);
            return;
        }
        this.readyCbs.push(callback);
    }

    private flushReady(): void {
        if (!this.viewer) return;
        const pending = this.readyCbs.splice(0);
        pending.forEach(cb => cb(this.viewer));
    }

    private attachEvents(): void {
        if (!this.viewer || !this.eventBus) return;
        const Cesium = getCesium();
        if (!Cesium) return;

        const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

        const toLngLat = (pos: any): LngLat | null => {
            const cartesian = this.viewer.camera.pickEllipsoid(pos, Cesium.Ellipsoid.WGS84);
            if (!cartesian) return null;
            const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
            return [(carto.longitude * 180) / Math.PI, (carto.latitude * 180) / Math.PI];
        };

        handler.setInputAction((movement: any) => {
            const coords = toLngLat(movement.endPosition);
            if (!coords) {
                this.store.dispatch({ pointerCoordinates: null, pointerResolution: null }, 'MAP');
                return;
            }
            const pixel: Pixel = [movement.endPosition.x, movement.endPosition.y];
            this.eventBus?.emit({ type: 'pointer-move', coords, pixel, resolution: null, originalEvent: movement });
            this.store.dispatch({ pointerCoordinates: coords, pointerResolution: null }, 'MAP');
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction((click: any) => {
            const coords = toLngLat(click.position);
            if (!coords) return;
            const pixel: Pixel = [click.position.x, click.position.y];
            this.eventBus?.emit({ type: 'click', coords, pixel, resolution: null, originalEvent: click });
            this.store.dispatch({ lastClickedCoordinates: coords, pointerCoordinates: coords, lastClickedResolution: null, pointerResolution: null }, 'MAP');
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        handler.setInputAction((event: any) => {
            const coords = toLngLat(event.position);
            if (!coords) return;
            const pixel: Pixel = [event.position.x, event.position.y];
            this.eventBus?.emit({ type: 'pointer-down', coords, pixel, button: 0, originalEvent: event });
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        handler.setInputAction((event: any) => {
            const coords = toLngLat(event.position);
            if (!coords) return;
            const pixel: Pixel = [event.position.x, event.position.y];
            this.eventBus?.emit({ type: 'pointer-up', coords, pixel, button: 0, originalEvent: event });
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        this.viewer.scene.canvas.addEventListener('contextmenu', (event: MouseEvent) => {
            event.preventDefault();
            const rect = this.viewer.scene.canvas.getBoundingClientRect();
            const position = { x: event.clientX - rect.left, y: event.clientY - rect.top };
            const coords = toLngLat(position);
            if (!coords) return;
            const pixel: Pixel = [position.x, position.y];
            this.eventBus?.emit({ type: 'contextmenu', coords, pixel, originalEvent: event });
        });

        this.viewer.camera.moveEnd.addEventListener(() => {
            this.enforceMaxBounds();
            this.dispatchViewportState();
        });

        // Capture rotation/pitch/zoom changes continuously (throttled)
        this.viewer.camera.changed.addEventListener(() => {
            this.enforceMaxBounds();
            this.dispatchViewportStateThrottled();
        });

        // Remove Cesium canvas from tab order
        const canvas = this.viewer.scene.canvas as HTMLCanvasElement | null;
        if (canvas) canvas.tabIndex = -1;

        // Keyboard zoom (+/-) and pan (arrow keys) — Cesium canvas needs focus for built-in handlers
        // but we removed it from tab order, so handle globally here.
        this.boundKeydown = (e: KeyboardEvent) => {
            // composedPath() finds the real originating element even through shadow DOM (e.g.
            // Shoelace's <sl-input>), where document.activeElement would only report the
            // shadow host and miss that the user is typing.
            if (isEventFromEditableElement(e)) return;
            const el = document.activeElement as HTMLElement | null;
            // Only handle keys when focus is outside interactive UI (body, html, or the map canvas itself)
            if (el && el !== document.body && el !== document.documentElement) {
                // Allow if focused element is the Cesium canvas; skip otherwise
                if (el !== this.viewer?.scene?.canvas) return;
            }

            if (e.key === '+' || e.key === '=' ) { e.preventDefault(); this.setZoom(this.getZoom() + 1); return; }
            if (e.key === '-')                   { e.preventDefault(); this.setZoom(this.getZoom() - 1); return; }

            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                if (!this.viewer) return;
                e.preventDefault();
                const canvas = this.viewer.scene.canvas as HTMLCanvasElement;
                const zoom = this.getZoom();
                const center = this.computeViewportCenter() ?? this.lastCenter;
                const metersPerPixel = webMercatorMetersPerPixelAtLat(zoom, center[1]);
                const panMeters = metersPerPixel * canvas.clientWidth * 0.15;
                const camera = this.viewer.camera;
                if (e.key === 'ArrowLeft')  camera.moveLeft(panMeters);
                if (e.key === 'ArrowRight') camera.moveRight(panMeters);
                if (e.key === 'ArrowUp')    camera.moveUp(panMeters);
                if (e.key === 'ArrowDown')  camera.moveDown(panMeters);
                // Force immediate store sync (moveEnd fires asynchronously)
                this.dispatchViewportState();
            }
        };
        document.addEventListener('keydown', this.boundKeydown);
    }

    private resolveContainer(containerId: string): HTMLElement {
        const hostElement = document.getElementById(containerId);
        if (!hostElement) {
            throw new Error(`[Cesium] Container #${containerId} not found.`);
        }
        if (hostElement.tagName.toLowerCase() === 'webmapx-map') {
            const mapSlot = hostElement.querySelector<HTMLElement>('[slot="map-view"]');
            if (mapSlot) return mapSlot;
        }
        return hostElement;
    }

    private computeViewportCenter(): [number, number] | null {
        const Cesium = getCesium();
        if (!Cesium || !this.viewer) return null;
        const canvas = this.viewer.scene.canvas;
        const centerPx = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
        const cartesian = this.viewer.camera.pickEllipsoid(centerPx, Cesium.Ellipsoid.WGS84);
        if (!cartesian) return null;
        const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
        return [(carto.longitude * 180) / Math.PI, (carto.latitude * 180) / Math.PI];
    }

    private computeViewportBounds(): GeoJSON.Feature<GeoJSON.Polygon> | null {
        const Cesium = getCesium();
        if (!Cesium || !this.viewer) return null;
        const canvas = this.viewer.scene.canvas;
        const corners = [
            new Cesium.Cartesian2(0, canvas.clientHeight),                // bottom-left
            new Cesium.Cartesian2(canvas.clientWidth, canvas.clientHeight), // bottom-right
            new Cesium.Cartesian2(canvas.clientWidth, 0),                 // top-right
            new Cesium.Cartesian2(0, 0),                                  // top-left
        ];

        const ring: Array<[number, number]> = [];
        for (const corner of corners) {
            const cartesian = this.viewer.camera.pickEllipsoid(corner, Cesium.Ellipsoid.WGS84);
            if (!cartesian) continue;
            const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
            ring.push([(carto.longitude * 180) / Math.PI, (carto.latitude * 180) / Math.PI]);
        }

        if (ring.length === 0) return null;
        // Close ring if needed
        if (ring.length > 0 && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
            ring.push(ring[0]);
        }

        return {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Polygon',
                coordinates: [ring],
            },
        };
    }

    private zoomToCameraHeightMeters(zoom: number, lat: number): number {
        const Cesium = getCesium();
        if (!Cesium || !this.viewer) {
            return zoomToHeightMeters(zoom);
        }

        const metersPerPixel = webMercatorMetersPerPixelAtLat(zoom, lat);
        const canvas = this.viewer.scene.canvas;
        const heightPx = Math.max(1, canvas.clientHeight || canvas.height || 1);
        const frustum = this.viewer.camera.frustum;
        const fovy = (frustum && 'fovy' in frustum) ? (frustum as any).fovy : Math.PI / 3;
        return Math.max(10, (metersPerPixel * heightPx) / (2 * Math.tan(fovy / 2)));
    }

    private cameraHeightMetersToZoom(heightMeters: number, lat: number): number {
        const Cesium = getCesium();
        if (!Cesium || !this.viewer) {
            return heightMetersToZoom(heightMeters);
        }

        const canvas = this.viewer.scene.canvas;
        const heightPx = Math.max(1, canvas.clientHeight || canvas.height || 1);
        const frustum = this.viewer.camera.frustum;
        const fovy = (frustum && 'fovy' in frustum) ? (frustum as any).fovy : Math.PI / 3;
        const metersPerPixel = (heightMeters * 2 * Math.tan(fovy / 2)) / heightPx;

        const phi = (clampLatitude(lat) * Math.PI) / 180;
        const circumference = 2 * Math.PI * WEB_MERCATOR_EARTH_RADIUS_M;
        const denom = LOGICAL_TILE_SIZE * metersPerPixel;
        if (!isFinite(denom) || denom <= 0) return 0;
        return Math.log2((circumference * Math.cos(phi)) / denom);
    }

    private clampZoom(zoom: number): number {
        let next = zoom;
        const boundsFloor = this.maxBoundsZoomFloor();
        if (boundsFloor !== undefined) {
            next = Math.max(next, boundsFloor);
        }
        if (this.minZoom !== undefined) {
            next = Math.max(next, this.minZoom);
        }
        if (this.maxZoom !== undefined) {
            next = Math.min(next, this.maxZoom);
        }
        return next;
    }

    private applyZoomDistanceLimits(lat: number): void {
        if (!this.viewer) return;
        const controller = this.viewer.scene?.screenSpaceCameraController;
        if (!controller) return;

        if (this.maxZoom !== undefined) {
            controller.minimumZoomDistance = this.zoomToCameraHeightMeters(this.maxZoom, lat);
        }
        const boundsFloor = this.maxBoundsZoomFloor();
        const effectiveMinZoom = boundsFloor !== undefined
            ? Math.max(boundsFloor, this.minZoom ?? -Infinity)
            : this.minZoom;
        if (effectiveMinZoom !== undefined) {
            controller.maximumZoomDistance = this.zoomToCameraHeightMeters(effectiveMinZoom, lat);
        }
    }

    private static mercatorYFraction(lat: number): number {
        const phi = (clampLatitude(lat) * Math.PI) / 180;
        return 0.5 - Math.log(Math.tan(Math.PI / 4 + phi / 2)) / (2 * Math.PI);
    }

    private static mercatorYFractionToLat(y: number): number {
        return ((2 * Math.atan(Math.exp((0.5 - y) * 2 * Math.PI)) - Math.PI / 2) * 180) / Math.PI;
    }

    /** Zoom level below which the viewport no longer fits inside maxBounds (web
     *  mercator approximation — Cesium has no native camera bbox constraint). */
    private maxBoundsZoomFloor(): number | undefined {
        if (!this.maxBounds || !this.viewer) return undefined;
        const canvas = this.viewer.scene?.canvas as HTMLCanvasElement | undefined;
        const width = canvas?.clientWidth ?? 0;
        const height = canvas?.clientHeight ?? 0;
        if (!width || !height) return undefined;
        const [west, south, east, north] = this.maxBounds;
        const widthFraction = (east - west) / 360;
        const heightFraction = MapCoreService.mercatorYFraction(south) - MapCoreService.mercatorYFraction(north);
        if (widthFraction <= 0 || heightFraction <= 0) return undefined;
        const zoomForWidth = Math.log2(width / (LOGICAL_TILE_SIZE * widthFraction));
        const zoomForHeight = Math.log2(height / (LOGICAL_TILE_SIZE * heightFraction));
        return Math.max(zoomForWidth, zoomForHeight);
    }

    /** Soft maxBounds enforcement: on camera change, clamp the viewport center so the
     *  visible area stays inside the bbox (inset by half the viewport span) and the
     *  zoom stays at or above the bounds floor. */
    private enforceMaxBounds(): void {
        if (!this.maxBounds || !this.viewer || this.enforcingMaxBounds) return;
        const canvas = this.viewer.scene?.canvas as HTMLCanvasElement | undefined;
        const width = canvas?.clientWidth ?? 0;
        const height = canvas?.clientHeight ?? 0;
        if (!width || !height) return;
        const center = this.computeViewportCenter();
        if (!center) return;

        const [west, south, east, north] = this.maxBounds;
        const floor = this.maxBoundsZoomFloor() ?? -Infinity;
        const zoom = Math.max(this.getZoom(), floor);

        // Half viewport span as world fractions at (floored) zoom.
        const worldPx = LOGICAL_TILE_SIZE * Math.pow(2, zoom);
        const halfWidthFraction = width / 2 / worldPx;
        const halfHeightFraction = height / 2 / worldPx;

        const clampMid = (value: number, min: number, max: number) =>
            min > max ? (min + max) / 2 : Math.min(Math.max(value, min), max);

        const x = clampMid((center[0] + 180) / 360, (west + 180) / 360 + halfWidthFraction, (east + 180) / 360 - halfWidthFraction);
        const y = clampMid(
            MapCoreService.mercatorYFraction(center[1]),
            MapCoreService.mercatorYFraction(north) + halfHeightFraction,
            MapCoreService.mercatorYFraction(south) - halfHeightFraction,
        );
        const clampedCenter: [number, number] = [x * 360 - 180, MapCoreService.mercatorYFractionToLat(y)];

        const centerMoved = Math.abs(clampedCenter[0] - center[0]) > 1e-7 || Math.abs(clampedCenter[1] - center[1]) > 1e-7;
        const zoomRaised = zoom - this.getZoom() > 0.01;
        if (!centerMoved && !zoomRaised) return;

        this.enforcingMaxBounds = true;
        try {
            this.setCameraView(clampedCenter, this.clampZoom(zoom), false);
        } finally {
            this.enforcingMaxBounds = false;
        }
    }

    private setCameraView(center: [number, number], zoom: number, animate: boolean): void {
        if (!this.viewer) return;
        const Cesium = getCesium();
        if (!Cesium) return;
        const camera = this.viewer.camera;
        const heading = camera.heading;
        const pitch = camera.pitch;
        const target = Cesium.Cartesian3.fromDegrees(center[0], center[1]);
        const desiredHeight = this.zoomToCameraHeightMeters(zoom, center[1]);
        const verticalComponent = Math.max(0.01, Math.abs(Math.sin(pitch)));
        const range = Math.max(1, desiredHeight / verticalComponent);
        const action = () => {
            camera.lookAt(target, new Cesium.HeadingPitchRange(heading, pitch, range));
            camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        };
        if (animate) {
            camera.flyTo({
                destination: target,
                orientation: { heading, pitch, roll: camera.roll },
                duration: 0.1,
                complete: action
            });
        } else {
            action();
        }
    }

    private dispatchViewportState(): void {
        if (this.isClamping) {
            this.isClamping = false;
        }
        const viewport = this.getViewportState();
        const clampedZoom = this.clampZoom(viewport.zoom);
        if (clampedZoom !== viewport.zoom) {
            this.isClamping = true;
            this.setCameraView(viewport.center, clampedZoom, false);
            this.applyZoomDistanceLimits(viewport.center[1]);
            return;
        }
        this.applyZoomDistanceLimits(viewport.center[1]);
        this.lastCenter = viewport.center;
        const bounds = this.computeViewportBounds();
        this.store.dispatch({ zoomLevel: viewport.zoom, mapCenter: viewport.center, mapViewportBounds: bounds }, 'MAP');
        if (this.lastStyledZoom === null || Math.abs(this.lastStyledZoom - viewport.zoom) > 0.05) {
            this.lastStyledZoom = viewport.zoom;
            this.applyAllSourceStyles();
        }
        const sw = bounds ? (bounds.geometry.coordinates[0][0] as LngLat) : viewport.center;
        const ne = bounds ? (bounds.geometry.coordinates[0][2] as LngLat) : viewport.center;
        this.eventBus?.emit({
            type: 'view-change-end',
            center: viewport.center,
            zoom: viewport.zoom,
            bearing: viewport.bearing,
            pitch: viewport.pitch,
            bounds: { sw, ne },
        });
        this.eventBus?.emit({ type: 'zoom-end', zoom: viewport.zoom });
    }


    private applyAllSourceStyles(): void {
        for (const sourceId of this.sourceState.keys()) {
            this.applySourceStyles(sourceId);
        }
    }

    private applySourceStyles(sourceId: string): void {
        const Cesium = getCesium();
        if (!Cesium || !this.viewer) return;
        const state = this.sourceState.get(sourceId);
        if (!state) return;

        for (const layerState of state.layers) {
            this.applyLayerStyle(layerState);
        }
    }

    private applyLayerStyle(layerState: CesiumRuntimeLayerState): void {
        const Cesium = getCesium();
        if (!Cesium || !this.viewer || !layerState.dataSource) return;

        const layer = layerState.spec;
        const paint = layer?.paint ?? {};
        const currentZoom = this.store.getState().zoomLevel ?? 2;
        const visibleAtZoom = this.isLayerVisibleAtZoom(layer, currentZoom);
        const zoomScale = zoomOffsetScale(currentZoom);
        const layerZ = this.getLayerZOffset(layer, zoomScale);
        const entities = layerState.dataSource.entities?.values ?? [];

        for (const entity of entities) {
            const geometryType = this.getEntityGeometryType(entity);
            const matches = visibleAtZoom && this.entityMatchesLayer(entity, layer, geometryType);

            if (entity.polygon) {
                setSafeProperty(entity.polygon, 'show', matches && layer?.type === 'fill');
            }
            if (entity.polyline && layer?.type !== 'line') {
                setSafeProperty(entity.polyline, 'show', false);
            }
            if (entity.billboard) {
                setSafeProperty(entity.billboard, 'show', false);
            }
            if (entity.point) {
                setSafeProperty(entity.point, 'show', false);
            }
            if (entity.ellipse) {
                setSafeProperty(entity.ellipse, 'show', matches && layer?.type === 'circle');
            }

            if (!matches) {
                continue;
            }

            if (layer?.type === 'fill' && entity.polygon) {
                const entityProps = this.getEntityProperties(entity);
                const featureLike = { properties: entityProps, geometry: { type: 'Polygon' } };
                const fillColor = evaluateColor(paint['fill-color'] ?? '#3388ff', featureLike, currentZoom, '#3388ff');
                const fillOpacity = evaluateNumber(paint['fill-opacity'] ?? 0.2, featureLike, currentZoom, 0.2);
                setColorMaterial(entity.polygon, Cesium.Color.fromCssColorString(fillColor).withAlpha(fillOpacity));
                setSafeProperty(entity.polygon, 'outline', false);
                setSafeProperty(entity.polygon, 'height', layerZ);
            }

            if (layer?.type === 'line') {
                // Polygon entities don't have a polyline — synthesize one from the exterior ring
                if (!entity.polyline && entity.polygon) {
                    const hierarchy = entity.polygon.hierarchy?.getValue?.(Cesium.JulianDate.now())
                        ?? entity.polygon.hierarchy;
                    const positions = hierarchy?.positions ?? hierarchy;
                    if (Array.isArray(positions) && positions.length > 0) {
                        entity.polyline = new Cesium.PolylineGraphics();
                        entity.polyline.positions = [...positions, positions[0]]; // close the ring
                    }
                }
                if (entity.polyline) {
                    setSafeProperty(entity.polyline, 'show', true);
                    const entityProps = this.getEntityProperties(entity);
                    const featureLike = { properties: entityProps, geometry: { type: 'LineString' } };
                    const lineColor = evaluateColor(paint['line-color'] ?? '#3388ff', featureLike, currentZoom, '#3388ff');
                    const lineWidth = evaluateNumber(paint['line-width'] ?? 2, featureLike, currentZoom, 2);
                    setColorMaterial(entity.polyline, Cesium.Color.fromCssColorString(lineColor).withAlpha(1));
                    setSafeProperty(entity.polyline, 'width', lineWidth);
                    const dash = paint['line-dasharray'];
                    if (Array.isArray(dash) && dash.length >= 2 && Cesium.PolylineDashMaterialProperty) {
                        const currentMaterial = entity.polyline.material;
                        const targetColor = Cesium.Color.fromCssColorString(lineColor).withAlpha(1);
                        const targetDashLength = dash[0] + dash[1];
                        let needsNewDash = true;
                        if (currentMaterial instanceof Cesium.PolylineDashMaterialProperty && currentMaterial.color instanceof Cesium.ConstantProperty) {
                            const julian = Cesium.JulianDate?.now?.() || new Cesium.JulianDate();
                            const currentVal = currentMaterial.color.getValue(julian);
                            if (currentVal && currentVal.equals(targetColor)) {
                                const currentDashLen = currentMaterial.dashLength?.getValue?.(julian) ?? currentMaterial.dashLength;
                                if (currentDashLen === targetDashLength) {
                                    needsNewDash = false;
                                }
                            }
                        }
                        if (needsNewDash) {
                            entity.polyline.material = new Cesium.PolylineDashMaterialProperty({
                                color: targetColor,
                                dashLength: targetDashLength,
                            });
                        }
                    }
                    this.applyPolylineHeightOffset(entity, layerZ);
                }
            }

            if (layer?.type === 'circle' && (entity.position || entity.point || entity.billboard || entity.ellipse)) {
                const circleColor = paint['circle-color'] ?? '#3388ff';
                const circleOpacity = paint['circle-opacity'] ?? 1.0;
                const circleRadius = paint['circle-radius'] ?? 6;
                const circleStrokeColor = paint['circle-stroke-color'] ?? '#3388ff';
                const circleStrokeWidth = paint['circle-stroke-width'] ?? 1;

                const julian = Cesium.JulianDate.now();
                const position = entity.position?.getValue?.(julian) ?? entity.position;
                if (!position) {
                    continue;
                }

                const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
                const lat = (carto.latitude * 180) / Math.PI;
                const zoom = currentZoom;
                const metersPerPixel = webMercatorMetersPerPixelAtLat(zoom, lat);
                const radiusMeters = Math.max(1, Number(circleRadius) * metersPerPixel);
                const layerLiftMeters = toolCircleLiftMeters(radiusMeters) * zoomScale;
                const circleZ = layerZ + layerLiftMeters;
                const shouldClamp = false;

                if (!entity.ellipse) {
                    entity.ellipse = new Cesium.EllipseGraphics();
                }
                setSafeProperty(entity.ellipse, 'show', true);
                setSafeProperty(entity.ellipse, 'semiMajorAxis', radiusMeters);
                setSafeProperty(entity.ellipse, 'semiMinorAxis', radiusMeters);
                setColorMaterial(entity.ellipse, Cesium.Color.fromCssColorString(String(circleColor)).withAlpha(Number(circleOpacity)));
                setSafeProperty(entity.ellipse, 'outline', true);
                const outlineColor = Cesium.Color.fromCssColorString(String(circleStrokeColor)).withAlpha(1);
                if (entity.ellipse.outlineColor instanceof Cesium.ConstantProperty) {
                    const julian = Cesium.JulianDate?.now?.() || new Cesium.JulianDate();
                    const currentVal = entity.ellipse.outlineColor.getValue(julian);
                    if (!currentVal || !currentVal.equals(outlineColor)) {
                        entity.ellipse.outlineColor.setValue(outlineColor);
                    }
                } else {
                    entity.ellipse.outlineColor = outlineColor;
                }
                setSafeProperty(entity.ellipse, 'outlineWidth', Number(circleStrokeWidth));

                const lon = Cesium.Math.toDegrees(carto.longitude);
                const ringLonLat = buildCircleOutlineLonLat(lon, lat, radiusMeters, 64);
                const strokeZ = circleZ + Math.max(1, radiusMeters * 0.01);
                const ringPositions = ringLonLat.map(([ringLon, ringLat]) =>
                    Cesium.Cartesian3.fromDegrees(ringLon, ringLat, strokeZ)
                );
                if (!entity.polyline) {
                    entity.polyline = new Cesium.PolylineGraphics();
                }
                setSafeProperty(entity.polyline, 'show', true);
                const currentPositionsProp = entity.polyline.positions;
                let positionsChanged = true;
                if (currentPositionsProp && typeof currentPositionsProp.getValue === 'function') {
                    const julian = Cesium.JulianDate?.now?.() || new Cesium.JulianDate();
                    const currentVal = currentPositionsProp.getValue(julian);
                    if (Array.isArray(currentVal) && currentVal.length === ringPositions.length) {
                        positionsChanged = false;
                        for (let i = 0; i < ringPositions.length; i++) {
                            if (!currentVal[i].equals(ringPositions[i])) {
                                positionsChanged = true;
                                break;
                            }
                        }
                    }
                }
                if (positionsChanged) {
                    entity.polyline.positions = ringPositions;
                }
                setSafeProperty(entity.polyline, 'width', Math.max(1, Number(circleStrokeWidth)));
                setColorMaterial(entity.polyline, Cesium.Color.fromCssColorString(String(circleStrokeColor)).withAlpha(1));
                if ('clampToGround' in entity.polyline) {
                    setSafeProperty(entity.polyline, 'clampToGround', shouldClamp);
                }

                if (Cesium.HeightReference?.CLAMP_TO_GROUND) {
                    setSafeProperty(entity.ellipse, 'heightReference', shouldClamp ? Cesium.HeightReference.CLAMP_TO_GROUND : Cesium.HeightReference.NONE);
                }
                setSafeProperty(entity.ellipse, 'height', circleZ);
                entity.billboard = undefined;
                entity.point = undefined;
            }
        }
    }

    private isLayerVisibleAtZoom(layer: any, zoom: number): boolean {
        const minzoom = this.toNumericZoom(layer?.minzoom ?? layer?.minZoom);
        const maxzoom = this.toNumericZoom(layer?.maxzoom ?? layer?.maxZoom);

        if (minzoom !== undefined && zoom < minzoom) {
            return false;
        }

        if (maxzoom !== undefined && zoom >= maxzoom) {
            return false;
        }

        return true;
    }

    private toNumericZoom(value: unknown): number | undefined {
        return typeof value === 'number' && isFinite(value) ? value : undefined;
    }

    private getLayerZOffset(layer: any, zoomScale = 1): number {
        const layerId = typeof layer?.id === 'string' ? layer.id : null;
        if (!layerId) {
            return 0;
        }
        const orderIndex = this.runtimeLayerOrder.indexOf(layerId);
        if (orderIndex < 0) {
            return 0;
        }
        return (orderIndex + 1) * this.layerZStepMeters * zoomScale;
    }

    private removeRuntimeLayer(layerId: string): void {
        this.runtimeLayerOrder = this.runtimeLayerOrder.filter((id) => id !== layerId);
    }

    private insertRuntimeLayer(layerId: string, options?: { beforeLayerId?: string; afterLayerId?: string }): void {
        this.removeRuntimeLayer(layerId);
        const inserted = this.insertByOptions(this.runtimeLayerOrder, layerId, options);
        if (!inserted) {
            this.runtimeLayerOrder.push(layerId);
        }
    }

    private insertLayerByOptions(list: CesiumRuntimeLayerState[], layerState: CesiumRuntimeLayerState, options?: { beforeLayerId?: string; afterLayerId?: string }): boolean {
        const layerId = typeof layerState.spec?.id === 'string' ? layerState.spec.id : null;
        if (!layerId) {
            return false;
        }

        const beforeLayerId = options?.beforeLayerId;
        if (typeof beforeLayerId === 'string') {
            const index = list.findIndex((entry) => entry.spec?.id === beforeLayerId);
            if (index >= 0) {
                list.splice(index, 0, layerState);
                return true;
            }
        }

        const afterLayerId = options?.afterLayerId;
        if (typeof afterLayerId === 'string') {
            const index = list.findIndex((entry) => entry.spec?.id === afterLayerId);
            if (index >= 0) {
                list.splice(index + 1, 0, layerState);
                return true;
            }
        }

        return false;
    }

    private insertByOptions(list: string[], layerId: string, options?: { beforeLayerId?: string; afterLayerId?: string }): boolean {
        const beforeLayerId = options?.beforeLayerId;
        if (typeof beforeLayerId === 'string') {
            const beforeIndex = list.indexOf(beforeLayerId);
            if (beforeIndex >= 0) {
                list.splice(beforeIndex, 0, layerId);
                return true;
            }
        }

        const afterLayerId = options?.afterLayerId;
        if (typeof afterLayerId === 'string') {
            const afterIndex = list.indexOf(afterLayerId);
            if (afterIndex >= 0) {
                list.splice(afterIndex + 1, 0, layerId);
                return true;
            }
        }

        return false;
    }

    private applyPolylineHeightOffset(entity: any, heightOffset: number): void {
        const Cesium = getCesium();
        if (!Cesium || !entity?.polyline) {
            return;
        }

        const lastOffset = (entity as any)._lastHeightOffset;
        if (lastOffset === heightOffset) {
            return;
        }

        const julian = Cesium.JulianDate.now();
        const polyline = entity.polyline;
        const currentPositions = polyline.positions?.getValue?.(julian) ?? polyline.positions;
        if (!Array.isArray(currentPositions) || currentPositions.length === 0) {
            return;
        }

        let basePositions = this.basePolylinePositions.get(entity);
        if (!basePositions) {
            basePositions = [...currentPositions];
            this.basePolylinePositions.set(entity, basePositions);
        }

        (entity as any)._lastHeightOffset = heightOffset;

        if (!(typeof heightOffset === 'number' && isFinite(heightOffset) && heightOffset > 0)) {
            polyline.positions = basePositions;
            return;
        }

        const elevatedPositions = basePositions.map((position) => {
            const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
            const height = (carto.height ?? 0) + heightOffset;
            return Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, height);
        });
        polyline.positions = elevatedPositions;
    }

    private refreshSourceLayerData(sourceId: string): void {
        const Cesium = getCesium();
        if (!Cesium || !this.viewer) return;

        const state = this.sourceState.get(sourceId);
        if (!state || !state.data) return;

        for (const layerState of state.layers) {
            this.loadLayerDataSource(sourceId, layerState);
        }
    }

    private async loadLayerDataSource(sourceId: string, layerState: CesiumRuntimeLayerState): Promise<void> {
        const Cesium = getCesium();
        if (!Cesium || !this.viewer) return;

        // Already loading: leave a note rather than starting a second one. The
        // in-flight load will pick up whatever the newest data is when it ends,
        // so nothing is lost by not starting now.
        if (layerState.loading) {
            layerState.pending = true;
            return;
        }
        layerState.loading = true;

        try {
            for (;;) {
                layerState.pending = false;
                const state = this.sourceState.get(sourceId);
                if (!state?.data) return;

                const nextDataSource = await Cesium.GeoJsonDataSource.load(state.data, { clampToGround: false });
                forceGeodesicArcType(nextDataSource, Cesium);

                // The source or the layer may have gone while the load ran.
                const currentState = this.sourceState.get(sourceId);
                if (!currentState?.layers.includes(layerState)) return;

                const previousDataSource = layerState.dataSource;
                // Remove previous before adding new to prevent multiple datasources visible simultaneously
                this.removeLayerDataSource({ dataSource: previousDataSource });
                layerState.dataSource = nextDataSource;
                this.viewer.dataSources.add(nextDataSource);
                this.applyLayerStyle(layerState);
                setTimeout(() => this.reapplyDataSourceOrder(), 0);

                // Anything asked for while that ran is served by going round
                // again with the newest data, so there is nothing to discard and
                // no need for a staleness token: the last loop always draws what
                // the source holds now.
                if (!layerState.pending) return;
            }
        } finally {
            layerState.loading = false;
        }
    }

    private reapplyDataSourceOrder(): void {
        if (!this.viewer) return;
        // Raise each DataSource in runtimeLayerOrder from first→last so the last ends up on top.
        for (const layerId of this.runtimeLayerOrder) {
            for (const state of this.sourceState.values()) {
                for (const ls of state.layers) {
                    if (ls.spec?.id === layerId && ls.dataSource) {
                        try { this.viewer.dataSources.raiseToTop(ls.dataSource); } catch { /* ignore */ }
                    }
                }
            }
        }
    }

    private removeLayerDataSource(layerState: { dataSource: any | null }): void {
        if (!layerState.dataSource || !this.viewer) return;
        const ds = layerState.dataSource;
        const viewer = this.viewer;
        // Defer destruction past the current render frame to avoid mid-render GL crash
        setTimeout(() => {
            try { viewer.dataSources.remove(ds, true); } catch { /* ignore */ }
        }, 0);
    }

    private getEntityProperties(entity: any): Record<string, unknown> {
        const props = entity?.properties;
        if (!props) return {};
        const names: string[] = props.propertyNames ?? Object.keys(props);
        const result: Record<string, unknown> = {};
        for (const name of names) {
            const val = props[name];
            result[name] = typeof val?.getValue === 'function' ? val.getValue(undefined) : val;
        }
        return result;
    }

    private getEntityGeometryType(entity: any): 'Point' | 'LineString' | 'Polygon' | null {
        if (entity.position || entity.point || entity.billboard || entity.ellipse) return 'Point';
        if (entity.polygon) return 'Polygon';
        if (entity.polyline) return 'LineString';
        return null;
    }

    private entityMatchesLayer(entity: any, layer: any, geometryType: 'Point' | 'LineString' | 'Polygon' | null): boolean {
        const expectedGeometryType = layer?.type === 'fill'
            ? 'Polygon'
            : layer?.type === 'line'
                ? 'LineString'
                : layer?.type === 'circle'
                    ? 'Point'
                    : null;

        // line layers can render polygon outlines (boundary treated as linestring)
        const geometryMatches = !expectedGeometryType || geometryType === expectedGeometryType
            || (layer?.type === 'line' && geometryType === 'Polygon');
        if (!geometryMatches) return false;

        return this.matchesFilter(entity, layer?.filter);
    }

    private matchesFilter(entity: any, filter: any): boolean {
        if (!Array.isArray(filter) || filter.length < 3) {
            return true;
        }

        const [operator, lhs, rhs] = filter;
        if (operator !== '==') {
            return true;
        }

        const lhsValue = this.resolveFilterOperand(entity, lhs);
        return lhsValue === rhs;
    }

    private resolveFilterOperand(entity: any, operand: any): unknown {
        const Cesium = getCesium();
        const julian = Cesium?.JulianDate?.now?.();

        if (operand === '$type') {
            return this.getEntityGeometryType(entity);
        }

        if (Array.isArray(operand) && operand[0] === 'geometry-type') {
            return this.getEntityGeometryType(entity);
        }

        if (Array.isArray(operand) && operand[0] === 'get' && typeof operand[1] === 'string') {
            const property = entity?.properties?.[operand[1]];
            if (!property) {
                return undefined;
            }
            if (typeof property.getValue === 'function') {
                return property.getValue(julian);
            }
            return property;
        }

        return operand;
    }

    public setLayerOrderRegistry(registry: { registerInlineLayer: (id: string, options?: any) => void; unregisterInlineLayer: (id: string) => void }): void {
        this.layerOrderRegistry = registry;
    }

    private clampImageryProviderMaxLevel(provider: any, maxLevel: number): void {
        if (!provider || typeof maxLevel !== 'number' || !isFinite(maxLevel)) {
            return;
        }
        if (typeof provider.requestImage === 'function') {
            const original = provider.requestImage.bind(provider);
            provider.requestImage = (x: number, y: number, level: number, ...rest: unknown[]) => {
                const clampedLevel = Math.min(level, maxLevel);
                return original(x, y, clampedLevel, ...rest);
            };
        }
        const scheme = provider.tilingScheme;
        const clampLevel = (fn?: (level: number) => number) =>
            fn
                ? (level: number) => fn.call(scheme, Math.min(level, maxLevel))
                : undefined;
        if (scheme) {
            if (typeof scheme.getNumberOfXTilesAtLevel === 'function') {
                const original = scheme.getNumberOfXTilesAtLevel;
                scheme.getNumberOfXTilesAtLevel = clampLevel(original) as any;
            }
            if (typeof scheme.getNumberOfYTilesAtLevel === 'function') {
                const original = scheme.getNumberOfYTilesAtLevel;
                scheme.getNumberOfYTilesAtLevel = clampLevel(original) as any;
            }
        }
    }
}
