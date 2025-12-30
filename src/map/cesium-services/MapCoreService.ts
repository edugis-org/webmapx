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

export class MapCoreService implements IMapCore {
    constructor(
        private readonly store: MapStateStore,
        private readonly eventBus?: MapEventBus
    ) {}

    private viewer: any = null;
    private readyCbs: Array<(viewer: any) => void> = [];
    private zoomEndCallbacks: Array<(level: number) => void> = [];
    private sources = new Map<string, ISource>();
    private sourceState = new Map<string, { dataSource: any | null; layers: any[] }>();
    private minZoom?: number;
    private maxZoom?: number;
    private isClamping = false;
    private lastCenter: [number, number] = [0, 0];
    private readonly dispatchViewportStateThrottled = throttle(() => this.dispatchViewportState(), 100);

    public initialize(
        containerId: string,
        options?: { center?: [number, number]; zoom?: number; minZoom?: number; maxZoom?: number; styleUrl?: string; style?: MapStyle }
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

        const osmProvider = new Cesium.UrlTemplateImageryProvider({
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            subdomains: ['a', 'b', 'c'],
            credit: '&copy; OpenStreetMap contributors',
        });

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
            baseLayer: new Cesium.ImageryLayer(osmProvider),
            terrainProvider: new Cesium.EllipsoidTerrainProvider(),
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

    public onZoomEnd(callback: (level: number) => void): void {
        this.zoomEndCallbacks.push(callback);
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
        const clampedPitch = Math.max(0, Math.min(89, pitch));
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

    public addLayer(_layer: any): void {
        const layer = _layer as any;
        const sourceId = layer?.source;
        if (!sourceId) return;
        const state = this.sourceState.get(sourceId);
        if (!state) return;
        state.layers.push(layer);
        this.applySourceStyles(sourceId);
    }

    public removeLayer(_id: string): void {
        const id = _id as any;
        for (const [sourceId, state] of this.sourceState.entries()) {
            const before = state.layers.length;
            state.layers = state.layers.filter(l => l?.id !== id);
            if (state.layers.length !== before) {
                this.applySourceStyles(sourceId);
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

        this.sourceState.set(id, { dataSource: null, layers: [] });

        const setData = (data: GeoJSON.FeatureCollection) => {
            const state = this.sourceState.get(id);
            if (!state) return;
            const previous = state.dataSource;
            void Cesium.GeoJsonDataSource.load(data, { clampToGround: false }).then((next: any) => {
                if (previous) {
                    this.viewer.dataSources.remove(previous, true);
                }
                state.dataSource = next;
                this.viewer.dataSources.add(next);
                this.applySourceStyles(id);
            });
        };

        const source: ISource = { id, setData };
        this.sources.set(id, source);
        setData(config.data);
    }

    public removeSource(id: string): void {
        const state = this.sourceState.get(id);
        if (state?.dataSource && this.viewer) {
            try {
                this.viewer.dataSources.remove(state.dataSource, true);
            } catch {
                // ignore
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
            this.eventBus.emit({ type: 'pointer-move', coords, pixel, resolution: null, originalEvent: movement });
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
            this.eventBus?.emit({ type: 'contextmenu', coords, pixel, resolution: null, originalEvent: event });
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
        this.zoomEndCallbacks.forEach(cb => cb(viewport.zoom));
    }

    private applySourceStyles(sourceId: string): void {
        const Cesium = getCesium();
        if (!Cesium || !this.viewer) return;
        const state = this.sourceState.get(sourceId);
        const dataSource = state?.dataSource;
        if (!state || !dataSource) return;

        const layers = state.layers;
        const fillLayer = layers.filter(l => l?.type === 'fill').at(-1);
        const lineLayer = layers.filter(l => l?.type === 'line').at(-1);
        const circleLayer = layers.filter(l => l?.type === 'circle').at(-1);

        const fillPaint = fillLayer?.paint ?? {};
        const linePaint = lineLayer?.paint ?? {};
        const circlePaint = circleLayer?.paint ?? {};

        const fillColor = fillPaint['fill-color'] ?? '#3388ff';
        const fillOpacity = fillPaint['fill-opacity'] ?? 0.2;
        const lineColor = linePaint['line-color'] ?? '#3388ff';
        const lineWidth = linePaint['line-width'] ?? 2;
        const circleColor = circlePaint['circle-color'] ?? '#3388ff';
        const circleRadius = circlePaint['circle-radius'] ?? 6;
        const circleStrokeColor = circlePaint['circle-stroke-color'] ?? '#ffffff';
        const circleStrokeWidth = circlePaint['circle-stroke-width'] ?? 1;

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
                const dash = linePaint['line-dasharray'];
                if (Array.isArray(dash) && dash.length >= 2 && Cesium.PolylineDashMaterialProperty) {
                    entity.polyline.material = new Cesium.PolylineDashMaterialProperty({
                        color: Cesium.Color.fromCssColorString(lineColor).withAlpha(1),
                        dashLength: dash[0] + dash[1],
                    });
                }
            }
            if (circleLayer && (entity.point || entity.billboard)) {
                // GeoJsonDataSource may create default pin/billboard styling for points.
                // Replace with small circles to match MapLibre "circle" layers (used by measure/draw tools).
                if (!entity.point) {
                    entity.point = new Cesium.PointGraphics();
                }
                entity.billboard = undefined;
                entity.point.color = Cesium.Color.fromCssColorString(circleColor).withAlpha(1);
                entity.point.pixelSize = Number(circleRadius) * 2;
                entity.point.outlineColor = Cesium.Color.fromCssColorString(circleStrokeColor).withAlpha(1);
                entity.point.outlineWidth = Number(circleStrokeWidth);
                if (Cesium.HeightReference?.CLAMP_TO_GROUND) {
                    entity.point.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
                }
            }
        }
    }
}
