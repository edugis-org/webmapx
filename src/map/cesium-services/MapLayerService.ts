// src/map/cesium-services/MapLayerService.ts

import type { ILayerService } from '../IMapInterfaces';
import type { LayerConfig, SourceConfig, WMSSourceConfig } from '../../config/types';
import type { MapStateStore } from '../../store/map-state-store';
import { throttle } from '../../utils/throttle';

function getCesium(): any {
    return (globalThis as any).Cesium;
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

function toCssColor(value: unknown, fallback: string): string {
    return typeof value === 'string' ? value : fallback;
}

function toNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' && isFinite(value) ? value : fallback;
}

function parseWmsUrl(url: string): { baseUrl: string; layers: string } {
    try {
        const u = new URL(url, window.location.origin);
        const layers = u.searchParams.get('layers') ?? '';
        u.search = '';
        return { baseUrl: u.toString(), layers };
    } catch {
        const [base, query] = url.split('?', 2);
        const layers = new URLSearchParams(query ?? '').get('layers') ?? '';
        return { baseUrl: base, layers };
    }
}

type CesiumLayerHandle =
    | { kind: 'imagery'; imageryLayer: any }
    | { kind: 'geojson'; dataSource: any; sourceId: string; layerConfig: LayerConfig };

export class MapLayerService implements ILayerService {
    private readonly handles = new Map<string, CesiumLayerHandle>();
    private readonly applyGeoJsonStylesThrottled: () => void;
    private lastZoomLevel: number | null = null;
    private unsubscribeStore: (() => void) | null = null;

    constructor(
        private readonly viewer: any,
        private readonly store: MapStateStore
    ) {
        this.applyGeoJsonStylesThrottled = throttle(() => this.applyAllGeoJsonStyles(), 100);

        this.unsubscribeStore = this.store.subscribe((state) => {
            if (state.zoomLevel == null) return;
            if (state.zoomLevel === this.lastZoomLevel) return;
            this.lastZoomLevel = state.zoomLevel;
            this.applyGeoJsonStylesThrottled();
        });
    }

    setCatalog(_catalog: any): void {
        // Not needed; layer tree passes configs directly.
    }

    async addLayer(layerId: string, layerConfig: LayerConfig, sourceConfig: SourceConfig): Promise<boolean> {
        const Cesium = getCesium();
        if (!Cesium) return false;

        const handleKey = `${layerId}::${sourceConfig.id}`;
        if (this.handles.has(handleKey)) return true;

        if (sourceConfig.type === 'raster') {
            const url = Array.isArray(sourceConfig.url) ? sourceConfig.url[0] : sourceConfig.url;
            if (sourceConfig.service === 'xyz') {
                // Ignore warpedmap:// for Cesium (not supported)
                if (url.startsWith('warpedmap://')) return false;

                const provider = new Cesium.UrlTemplateImageryProvider({
                    url,
                    credit: sourceConfig.attribution ?? '',
                });
                const imageryLayer = new Cesium.ImageryLayer(provider);
                this.viewer.imageryLayers.add(imageryLayer);
                this.handles.set(handleKey, { kind: 'imagery', imageryLayer });
                return true;
            }

            if (sourceConfig.service === 'wms') {
                const wms = sourceConfig as WMSSourceConfig;
                const { baseUrl, layers } = parseWmsUrl(url);
                const provider = new Cesium.WebMapServiceImageryProvider({
                    url: baseUrl,
                    layers: wms.layers ?? layers,
                    parameters: {
                        transparent: wms.transparent ?? true,
                        format: wms.format ?? 'image/png',
                        styles: wms.styles ?? '',
                        version: wms.version ?? '1.1.1',
                    },
                    credit: wms.attribution ?? '',
                });
                const imageryLayer = new Cesium.ImageryLayer(provider);
                this.viewer.imageryLayers.add(imageryLayer);
                this.handles.set(handleKey, { kind: 'imagery', imageryLayer });
                return true;
            }

            return false;
        }

        if (sourceConfig.type === 'geojson') {
            const data = sourceConfig.data;
            const geojson: GeoJSON.FeatureCollection =
                typeof data === 'string' ? await (await fetch(data)).json() : data;

            const dataSource = await Cesium.GeoJsonDataSource.load(geojson, { clampToGround: false });
            await this.viewer.dataSources.add(dataSource);

            this.applyGeoJsonStyles(dataSource, layerConfig);
            this.handles.set(handleKey, { kind: 'geojson', dataSource, sourceId: sourceConfig.id, layerConfig });
            return true;
        }

        return false;
    }

    removeLayer(layerId: string): void {
        // Remove all native handles created for this logical layer (may include multiple sources).
        const keysToRemove = Array.from(this.handles.keys()).filter(key => key.startsWith(`${layerId}::`));
        for (const key of keysToRemove) {
            const handle = this.handles.get(key);
            if (!handle) continue;

            if (handle.kind === 'imagery') {
                try {
                    this.viewer.imageryLayers.remove(handle.imageryLayer, true);
                } catch {
                    // ignore
                }
            } else if (handle.kind === 'geojson') {
                try {
                    this.viewer.dataSources.remove(handle.dataSource, true);
                } catch {
                    // ignore
                }
            }
            this.handles.delete(key);
        }
    }

    getVisibleLayers(): string[] {
        const layerIds = new Set<string>();
        for (const key of this.handles.keys()) {
            layerIds.add(key.split('::')[0]);
        }
        return Array.from(layerIds);
    }

    isLayerVisible(layerId: string): boolean {
        for (const key of this.handles.keys()) {
            if (key.startsWith(`${layerId}::`)) return true;
        }
        return false;
    }

    private applyGeoJsonStyles(dataSource: any, layerConfig: LayerConfig): void {
        const Cesium = getCesium();
        if (!Cesium) return;

        const circle = layerConfig.layerset.find(l => l.type === 'circle') as any;
        const line = layerConfig.layerset.find(l => l.type === 'line') as any;
        const fill = layerConfig.layerset.find(l => l.type === 'fill') as any;

        const circlePaint = circle?.paint ?? {};
        const linePaint = line?.paint ?? {};
        const fillPaint = fill?.paint ?? {};

        const circleColor = toCssColor(circlePaint['circle-color'], '#FF5722');
        const circleOpacity = toNumber(circlePaint['circle-opacity'], 0.8);
        const circleRadius = toNumber(circlePaint['circle-radius'], 6);
        const circleStrokeColor = toCssColor(circlePaint['circle-stroke-color'], '#FFFFFF');
        const circleStrokeWidth = toNumber(circlePaint['circle-stroke-width'], 1);

        const lineColor = toCssColor(linePaint['line-color'], '#3388ff');
        const lineWidth = toNumber(linePaint['line-width'], 2);
        const fillColor = toCssColor(fillPaint['fill-color'], '#3388ff');
        const fillOpacity = toNumber(fillPaint['fill-opacity'], 0.2);

        const entities = dataSource.entities?.values ?? [];
        for (const entity of entities) {
            if (circle && (entity.position || entity.billboard || entity.point)) {
                // For "circle" layers, draw a ground-aligned ellipse so it conforms to the globe.
                // MapLibre circle-radius is in pixels; approximate meters based on current zoom.
                const zoom = this.store.getState().zoomLevel ?? 2;
                const julian = Cesium.JulianDate.now();
                const position = entity.position?.getValue?.(julian) ?? entity.position;
                if (position) {
                    const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
                    const lat = (carto.latitude * 180) / Math.PI;
                    const metersPerPixel = webMercatorMetersPerPixelAtLat(zoom, lat);
                    const radiusMeters = Math.max(1, circleRadius * metersPerPixel);

                    if (!entity.ellipse) {
                        entity.ellipse = new Cesium.EllipseGraphics();
                    }
                    entity.ellipse.semiMajorAxis = radiusMeters;
                    entity.ellipse.semiMinorAxis = radiusMeters;
                    entity.ellipse.material = Cesium.Color.fromCssColorString(circleColor).withAlpha(circleOpacity);
                    entity.ellipse.outline = true;
                    entity.ellipse.outlineColor = Cesium.Color.fromCssColorString(circleStrokeColor).withAlpha(1);
                    if (Cesium.HeightReference?.CLAMP_TO_GROUND) {
                        entity.ellipse.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
                    }
                    // Do not render default marker/point if ellipse is active.
                    entity.billboard = undefined;
                    entity.point = undefined;
                }
            }
            if (entity.polyline && line) {
                entity.polyline.material = Cesium.Color.fromCssColorString(lineColor).withAlpha(1);
                entity.polyline.width = lineWidth;
            }
            if (entity.polygon && fill) {
                entity.polygon.material = Cesium.Color.fromCssColorString(fillColor).withAlpha(fillOpacity);
                entity.polygon.outline = true;
                entity.polygon.outlineColor = Cesium.Color.fromCssColorString(lineColor).withAlpha(1);
            }
        }
    }

    private applyAllGeoJsonStyles(): void {
        for (const handle of this.handles.values()) {
            if (handle.kind !== 'geojson') continue;
            this.applyGeoJsonStyles(handle.dataSource, handle.layerConfig);
        }
    }
}
