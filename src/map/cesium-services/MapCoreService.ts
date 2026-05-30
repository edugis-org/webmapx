// src/map/cesium-services/MapCoreService.ts

import type { IMapCore, ISource, NavigationCapabilities } from '../IMapInterfaces';
import type { MapStyle } from '../../config/types';
import { MapStateStore } from '../../store/map-state-store';
import { MapEventBus, LngLat, Pixel } from '../../store/map-events';
import { throttle } from '../../utils/throttle';

function getCesium(): any {
    return (globalThis as any).Cesium;
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

function globeCurvatureLiftMeters(radiusMeters: number): number {
    if (!(typeof radiusMeters === 'number' && isFinite(radiusMeters) && radiusMeters > 0)) {
        return 0;
    }
    return (radiusMeters * radiusMeters) / (2 * WEB_MERCATOR_EARTH_RADIUS_M);
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
};

type CesiumRuntimeSourceState = {
    data: GeoJSON.FeatureCollection | null;
    layers: CesiumRuntimeLayerState[];
    updateToken: number;
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
    private isClamping = false;
    private lastCenter: [number, number] = [0, 0];
    private lastStyledZoom: number | null = null;
    private readonly dispatchViewportStateThrottled = throttle(() => this.dispatchViewportState(), 100);
    private runtimeLayerOrder: string[] = [];
    private readonly layerZStepMeters = 0.5;
    private readonly basePolylinePositions = new WeakMap<any, any[]>();

    public initialize(
        containerId: string,
        options?: { center?: [number, number]; zoom?: number; minZoom?: number; maxZoom?: number; minPitch?: number; maxPitch?: number; styleUrl?: string; style?: MapStyle }
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

        const clampedZoom = this.clampZoom(zoom);
        this.setCameraView(center, clampedZoom, false);
        this.applyZoomDistanceLimits(center[1]);

        this.attachEvents();

        // Initial store state (center/zoom will be corrected on first moveEnd tick)
        this.store.dispatch({ mapLoaded: true, mapBusy: false, mapCenter: center, zoomLevel: zoom }, 'MAP');
        this.flushReady();
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

    public addLayer(_layer: any, options?: { beforeLayerId?: string; afterLayerId?: string }): void {
        const layer = _layer as any;
        const sourceId = layer?.source;
        if (!sourceId) return;
        const state = this.sourceState.get(sourceId);
        if (!state) return;

        const layerId = typeof layer?.id === 'string' ? layer.id : null;
        if (layerId) {
            this.insertRuntimeLayer(layerId, options);
            state.layers = state.layers.filter((entry) => entry?.id !== layerId);
        }

        const layerState: CesiumRuntimeLayerState = { spec: layer, dataSource: null };
        const inserted = this.insertLayerByOptions(state.layers, layerState, options);
        if (!inserted) {
            state.layers.push(layerState);
        }

        this.refreshSourceLayerData(sourceId);
    }

    public removeLayer(_id: string): void {
        const id = _id as any;
        if (typeof id === 'string') this.removeRuntimeLayer(id);

        for (const [sourceId, state] of this.sourceState.entries()) {
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

        this.sourceState.set(id, { data: config.data, layers: [], updateToken: 0 });

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
                if (layerId) this.removeRuntimeLayer(layerId);
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
        const canvas = this.viewer.scene.canvas;
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
            camera.flyTo({ destination: rectangle, duration: 0.7 });
        } catch (e) {
            // fallback: center
            const lon = (bbox[0] + bbox[2]) / 2;
            const lat = (bbox[1] + bbox[3]) / 2;
            const height = this.zoomToCameraHeightMeters(this.getViewportState().zoom, lat);
            this.viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lon, lat, height), duration: 0.7 });
        }
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
            if (!coords) return;
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
            this.dispatchViewportState();
        });

        // Capture rotation/pitch/zoom changes continuously (throttled)
        this.viewer.camera.changed.addEventListener(() => {
            this.dispatchViewportStateThrottled();
        });
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
        if (this.minZoom !== undefined) {
            controller.maximumZoomDistance = this.zoomToCameraHeightMeters(this.minZoom, lat);
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
        if (this.lastStyledZoom === null || Math.abs(this.lastStyledZoom - viewport.zoom) > 0.0001) {
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
                entity.polygon.show = matches && layer?.type === 'fill';
            }
            if (entity.polyline) {
                entity.polyline.show = matches && layer?.type === 'line';
            }
            if (entity.billboard) {
                entity.billboard.show = false;
            }
            if (entity.point) {
                entity.point.show = false;
            }
            if (entity.ellipse) {
                entity.ellipse.show = matches && layer?.type === 'circle';
            }

            if (!matches) {
                continue;
            }

            if (layer?.type === 'fill' && entity.polygon) {
                const fillColor = paint['fill-color'] ?? '#3388ff';
                const fillOpacity = paint['fill-opacity'] ?? 0.2;
                entity.polygon.material = Cesium.Color.fromCssColorString(fillColor).withAlpha(fillOpacity);
                entity.polygon.outline = false;
                entity.polygon.height = layerZ;
            }

            if (layer?.type === 'line' && entity.polyline) {
                const lineColor = paint['line-color'] ?? '#3388ff';
                const lineWidth = paint['line-width'] ?? 2;
                entity.polyline.material = Cesium.Color.fromCssColorString(lineColor).withAlpha(1);
                entity.polyline.width = lineWidth;
                const dash = paint['line-dasharray'];
                if (Array.isArray(dash) && dash.length >= 2 && Cesium.PolylineDashMaterialProperty) {
                    entity.polyline.material = new Cesium.PolylineDashMaterialProperty({
                        color: Cesium.Color.fromCssColorString(lineColor).withAlpha(1),
                        dashLength: dash[0] + dash[1],
                    });
                }
                this.applyPolylineHeightOffset(entity, layerZ);
            }

            if (layer?.type === 'circle' && (entity.position || entity.point || entity.billboard || entity.ellipse)) {
                const circleMetadata = layer?.metadata ?? {};
                const circleColor = paint['circle-color'] ?? '#3388ff';
                const circleOpacity = paint['circle-opacity'] ?? 0.8;
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
                const shouldClamp = !circleMetadata.isToolLayer;
                const metersPerPixel = webMercatorMetersPerPixelAtLat(zoom, lat);
                const radiusMeters = Math.max(1, Number(circleRadius) * metersPerPixel);
                const curvatureLiftMeters = shouldClamp ? 0 : globeCurvatureLiftMeters(radiusMeters);
                const layerLiftMeters = shouldClamp ? 0 : toolCircleLiftMeters(radiusMeters) * zoomScale;
                const circleZ = shouldClamp ? layerZ : layerZ + layerLiftMeters + curvatureLiftMeters;

                if (!entity.ellipse) {
                    entity.ellipse = new Cesium.EllipseGraphics();
                }
                entity.ellipse.show = true;
                entity.ellipse.semiMajorAxis = radiusMeters;
                entity.ellipse.semiMinorAxis = radiusMeters;
                entity.ellipse.material = Cesium.Color.fromCssColorString(String(circleColor)).withAlpha(Number(circleOpacity));
                entity.ellipse.outline = true;
                entity.ellipse.outlineColor = Cesium.Color.fromCssColorString(String(circleStrokeColor)).withAlpha(1);
                entity.ellipse.outlineWidth = Number(circleStrokeWidth);

                const lon = Cesium.Math.toDegrees(carto.longitude);
                const ringLonLat = buildCircleOutlineLonLat(lon, lat, radiusMeters, 64);
                const ringPositions = ringLonLat.map(([ringLon, ringLat]) =>
                    Cesium.Cartesian3.fromDegrees(ringLon, ringLat, circleZ)
                );
                if (!entity.polyline) {
                    entity.polyline = new Cesium.PolylineGraphics();
                }
                entity.polyline.show = true;
                entity.polyline.positions = ringPositions;
                entity.polyline.width = Math.max(1, Number(circleStrokeWidth));
                entity.polyline.material = Cesium.Color.fromCssColorString(String(circleStrokeColor)).withAlpha(1);
                if ('clampToGround' in entity.polyline) {
                    entity.polyline.clampToGround = shouldClamp;
                }

                if (Cesium.HeightReference?.CLAMP_TO_GROUND) {
                    entity.ellipse.heightReference = shouldClamp ? Cesium.HeightReference.CLAMP_TO_GROUND : Cesium.HeightReference.NONE;
                }
                entity.ellipse.height = circleZ;
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

        const token = ++state.updateToken;
        for (const layerState of state.layers) {
            this.loadLayerDataSource(sourceId, layerState, token);
        }
    }

    private async loadLayerDataSource(sourceId: string, layerState: CesiumRuntimeLayerState, token: number): Promise<void> {
        const Cesium = getCesium();
        if (!Cesium || !this.viewer) return;

        const state = this.sourceState.get(sourceId);
        if (!state?.data) return;

        const nextDataSource = await Cesium.GeoJsonDataSource.load(state.data, { clampToGround: false });
        const currentState = this.sourceState.get(sourceId);
        const stillPresent = currentState?.layers.includes(layerState) ?? false;
        if (!currentState || currentState.updateToken !== token || !stillPresent) {
            return;
        }

        const previousDataSource = layerState.dataSource;
        layerState.dataSource = nextDataSource;
        this.viewer.dataSources.add(nextDataSource);
        this.applyLayerStyle(layerState);
        this.removeLayerDataSource({ spec: layerState.spec, dataSource: previousDataSource });
    }

    private removeLayerDataSource(layerState: { dataSource: any | null }): void {
        if (!layerState.dataSource || !this.viewer) return;
        try {
            this.viewer.dataSources.remove(layerState.dataSource, true);
        } catch {
            // ignore
        }
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

        if (expectedGeometryType && geometryType !== expectedGeometryType) {
            return false;
        }

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
