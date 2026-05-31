// src/map/cesium-services/MapLayerService.ts

import type { ILayerService, LayerInsertOptions } from '../IMapInterfaces';
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

function toCssColor(value: unknown, fallback: string): string {
    return typeof value === 'string' ? value : fallback;
}

function toNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' && isFinite(value) ? value : fallback;
}

function parseHexColor(value: string): { r: number; g: number; b: number } | null {
    const hex = value.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
    return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16),
    };
}

function getMinZoom(source: Partial<{ minzoom?: number; minZoom?: number }>): number | undefined {
    const value = source.minzoom ?? source.minZoom;
    return typeof value === 'number' && isFinite(value) ? value : undefined;
}

function getMaxZoom(source: Partial<{ maxzoom?: number; maxZoom?: number }>): number | undefined {
    const value = source.maxzoom ?? source.maxZoom;
    return typeof value === 'number' && isFinite(value) ? value : undefined;
}

function normalizeLevel(value?: number): number | undefined {
    if (typeof value !== 'number' || !isFinite(value)) return undefined;
    return Math.max(0, Math.floor(value));
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
    | { kind: 'imagery'; imageryLayer: any; maxLevel?: number }
    | { kind: 'geojson'; dataSource: any; sourceId: string; layerConfig: LayerConfig };

export class MapLayerService implements ILayerService {
    private readonly handles = new Map<string, CesiumLayerHandle>();
    private readonly applyGeoJsonStylesThrottled: () => void;
    private lastZoomLevel: number | null = null;
    private unsubscribeStore: (() => void) | null = null;
    private busyOps = 0;
    private logicalOrder: string[] = [];

    constructor(
        private readonly viewer: any,
        private readonly store: MapStateStore
    ) {
        this.applyGeoJsonStylesThrottled = throttle(() => this.applyAllGeoJsonStyles(), 100);

        this.viewer?.scene?.globe?.tileLoadProgressEvent?.addEventListener?.((pendingTiles: number) => {
            if (pendingTiles > 0) {
                this.store.dispatch({ mapBusy: true }, 'MAP');
            } else if (this.busyOps === 0) {
                this.store.dispatch({ mapBusy: false }, 'MAP');
            }
        });

        this.unsubscribeStore = this.store.subscribe((state) => {
            if (state.zoomLevel == null) return;
            if (state.zoomLevel === this.lastZoomLevel) return;
            this.lastZoomLevel = state.zoomLevel;
            this.applyGeoJsonStylesThrottled();
            this.applyImageryVisibility(state.zoomLevel);
        });
    }

    private beginBusyOperation(): void {
        this.busyOps += 1;
        if (this.busyOps === 1) {
            this.store.dispatch({ mapBusy: true }, 'MAP');
        }
    }

    private endBusyOperation(): void {
        if (this.busyOps <= 0) {
            this.busyOps = 0;
            return;
        }

        this.busyOps -= 1;
        if (this.busyOps === 0) {
            this.store.dispatch({ mapBusy: false }, 'MAP');
        }
    }

    private updateVisibleLayers(): void {
        const layerIds = new Set<string>();
        for (const key of this.handles.keys()) {
            layerIds.add(key.split('::')[0]);
        }
        this.store.dispatch({ visibleLayers: Array.from(layerIds) }, 'MAP');
    }

    private resolveInsertIndex(options?: LayerInsertOptions): number | undefined {
        if (options?.beforeLayerId) {
            const index = this.logicalOrder.indexOf(options.beforeLayerId);
            if (index >= 0) return index;
        }

        if (options?.afterLayerId) {
            const index = this.logicalOrder.indexOf(options.afterLayerId);
            if (index >= 0) return index + 1;
        }

        return undefined;
    }

    private upsertLogicalOrder(layerId: string, options?: LayerInsertOptions): void {
        const insertIndex = this.resolveInsertIndex(options);
        this.logicalOrder = this.logicalOrder.filter((id) => id !== layerId);

        if (typeof insertIndex !== 'number' || !Number.isFinite(insertIndex)) {
            this.logicalOrder.push(layerId);
            return;
        }

        const clamped = Math.max(0, Math.min(insertIndex, this.logicalOrder.length));
        this.logicalOrder.splice(clamped, 0, layerId);
    }

    private reapplyImageryOrder(): void {
        const desiredImageryLayers: any[] = [];
        for (const logicalLayerId of this.logicalOrder) {
            for (const [handleKey, handle] of this.handles.entries()) {
                if (!handleKey.startsWith(`${logicalLayerId}::`)) {
                    continue;
                }
                if (handle.kind === 'imagery') {
                    desiredImageryLayers.push(handle.imageryLayer);
                }
            }
        }

        for (let targetIndex = 0; targetIndex < desiredImageryLayers.length; targetIndex += 1) {
            const layer = desiredImageryLayers[targetIndex];
            const currentIndex = this.viewer.imageryLayers.indexOf(layer);
            if (currentIndex === targetIndex) {
                continue;
            }

            try {
                this.viewer.imageryLayers.remove(layer, false);
            } catch {
                // ignore
            }
            this.viewer.imageryLayers.add(layer, targetIndex);
        }
    }

    setCatalog(_catalog: any): void {
        // Not needed; layer tree passes configs directly.
    }

    async addLayer(layerId: string, layerConfig: LayerConfig, sourceConfig: SourceConfig, options?: LayerInsertOptions): Promise<boolean> {
        const Cesium = getCesium();
        if (!Cesium) return false;

        const handleKey = `${layerId}::${sourceConfig.id}`;
        if (this.handles.has(handleKey)) return true;

        if (sourceConfig.type === 'raster') {
            const url = Array.isArray(sourceConfig.url) ? sourceConfig.url[0] : sourceConfig.url;
            if (sourceConfig.service === 'xyz') {
                // Ignore warpedmap:// for Cesium (not supported)
                if (url.startsWith('warpedmap://')) {
                    console.warn('[CESIUM LAYER SERVICE] warpedmap:// (Allmaps) is not supported in Cesium. Use MapLibre/OpenLayers/Leaflet for warped maps or configure a fallback layer.');
                    return false;
                }

                const minLevel = normalizeLevel(getMinZoom(sourceConfig));
                const maxLevel = normalizeLevel(getMaxZoom(sourceConfig));

                const provider = new Cesium.UrlTemplateImageryProvider({
                    url,
                    credit: sourceConfig.attribution ?? '',
                    minimumLevel: minLevel,
                    maximumLevel: maxLevel,
                });
                this.enforceMaxLevel(provider, maxLevel);
                const imageryLayer = new Cesium.ImageryLayer(provider);
                this.viewer.imageryLayers.add(imageryLayer);
                this.handles.set(handleKey, { kind: 'imagery', imageryLayer, maxLevel });
                this.upsertLogicalOrder(layerId, options);
                this.reapplyImageryOrder();
                this.updateVisibleLayers();
                this.applyImageryVisibility(this.store.getState().zoomLevel ?? 0);
                return true;
            }

            if (sourceConfig.service === 'wms') {
                const wms = sourceConfig as WMSSourceConfig;
                const { baseUrl, layers } = parseWmsUrl(url);
                const minLevel = normalizeLevel(getMinZoom(wms));
                const maxLevel = normalizeLevel(getMaxZoom(wms));
                const provider = new Cesium.WebMapServiceImageryProvider({
                    url: baseUrl,
                    layers: wms.layers ?? layers,
                    parameters: {
                        transparent: wms.transparent ?? true,
                        format: wms.format ?? 'image/png',
                        styles: wms.styles ?? '',
                        version: wms.version ?? '1.1.1',
                    },
                    minimumLevel: minLevel,
                    maximumLevel: maxLevel,
                    credit: wms.attribution ?? '',
                });
                this.enforceMaxLevel(provider, maxLevel);
                const imageryLayer = new Cesium.ImageryLayer(provider);
                this.viewer.imageryLayers.add(imageryLayer);
                this.handles.set(handleKey, { kind: 'imagery', imageryLayer, maxLevel });
                this.upsertLogicalOrder(layerId, options);
                this.reapplyImageryOrder();
                this.updateVisibleLayers();
                this.applyImageryVisibility(this.store.getState().zoomLevel ?? 0);
                return true;
            }

            return false;
        }

        if (sourceConfig.type === 'geojson') {
            this.beginBusyOperation();
            const data = sourceConfig.data;
            try {
                const geojson: GeoJSON.FeatureCollection =
                    typeof data === 'string' ? await (await fetch(data)).json() : data;

                const dataSource = await Cesium.GeoJsonDataSource.load(geojson, { clampToGround: false });
                await this.viewer.dataSources.add(dataSource);

                this.applyGeoJsonStyles(dataSource, layerConfig);
                this.handles.set(handleKey, { kind: 'geojson', dataSource, sourceId: sourceConfig.id, layerConfig });
                this.upsertLogicalOrder(layerId, options);
                this.updateVisibleLayers();
                return true;
            } finally {
                this.endBusyOperation();
            }
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
        this.logicalOrder = this.logicalOrder.filter((id) => id !== layerId);
        this.reapplyImageryOrder();
        this.updateVisibleLayers();
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

    private enforceMaxLevel(provider: any, maxLevel?: number): void {
        if (typeof maxLevel !== 'number' || !isFinite(maxLevel)) {
            return;
        }
        if (typeof provider.requestImage !== 'function') {
            return;
        }
        const original = provider.requestImage.bind(provider);
        provider.requestImage = (x: number, y: number, level: number, ...rest: unknown[]) => {
            return original(x, y, Math.min(level, maxLevel), ...rest);
        };
        if (provider.tilingScheme && typeof provider.tilingScheme.getNumberOfXTilesAtLevel === 'function') {
            const originalTiles = provider.tilingScheme.getNumberOfXTilesAtLevel.bind(provider.tilingScheme);
            provider.tilingScheme.getNumberOfXTilesAtLevel = (level: number) => originalTiles(Math.min(level, maxLevel));
        }
        if (provider.tilingScheme && typeof provider.tilingScheme.getNumberOfYTilesAtLevel === 'function') {
            const originalTilesY = provider.tilingScheme.getNumberOfYTilesAtLevel.bind(provider.tilingScheme);
            provider.tilingScheme.getNumberOfYTilesAtLevel = (level: number) => originalTilesY(Math.min(level, maxLevel));
        }
    }

    private applyImageryVisibility(_currentZoom: number): void {
        for (const handle of this.handles.values()) {
            if (handle.kind !== 'imagery') continue;
            // Keep imagery visible beyond source max level; tile requests are clamped in enforceMaxLevel.
            if (handle.imageryLayer?.show === false) {
                handle.imageryLayer.show = true;
            }
        }
    }

    private getEntityProperty(entity: any, key: string): unknown {
        const Cesium = getCesium();
        const julian = Cesium?.JulianDate?.now?.();
        const value = entity?.properties?.[key];
        if (value?.getValue && julian) {
            return value.getValue(julian);
        }
        if (value && typeof value === 'object' && 'valueOf' in value) {
            try {
                return value.valueOf();
            } catch {
                return value;
            }
        }
        return value;
    }

    private resolveExpression(entity: any, expression: unknown): unknown {
        if (!Array.isArray(expression)) {
            return expression;
        }

        const [operator, ...args] = expression;
        if (operator === 'get' && typeof args[0] === 'string') {
            return this.getEntityProperty(entity, args[0]);
        }
        if (operator === 'to-number') {
            const value = this.resolveExpression(entity, args[0]);
            const numberValue = Number(value);
            return Number.isFinite(numberValue) ? numberValue : null;
        }
        if (operator === 'coalesce') {
            for (const arg of args) {
                const value = this.resolveExpression(entity, arg);
                if (value !== null && value !== undefined && !(typeof value === 'number' && !Number.isFinite(value))) {
                    return value;
                }
            }
            return null;
        }
        if (operator === 'interpolate') {
            return this.resolveInterpolateExpression(entity, expression);
        }

        return null;
    }

    private resolveInterpolateExpression(entity: any, expression: unknown[]): unknown {
        if (expression.length < 6) return null;

        const [, interpolation, inputExpression, ...stops] = expression;
        const input = Number(this.resolveExpression(entity, inputExpression));
        if (!Number.isFinite(input)) return null;

        let base = 1;
        if (Array.isArray(interpolation) && interpolation[0] === 'exponential' && typeof interpolation[1] === 'number') {
            base = interpolation[1];
        }

        const parsedStops: Array<{ stop: number; value: unknown }> = [];
        for (let i = 0; i + 1 < stops.length; i += 2) {
            const stop = Number(stops[i]);
            if (!Number.isFinite(stop)) continue;
            parsedStops.push({ stop, value: stops[i + 1] });
        }
        if (!parsedStops.length) return null;

        if (input <= parsedStops[0].stop) return parsedStops[0].value;
        if (input >= parsedStops[parsedStops.length - 1].stop) return parsedStops[parsedStops.length - 1].value;

        for (let i = 1; i < parsedStops.length; i++) {
            const prev = parsedStops[i - 1];
            const next = parsedStops[i];
            if (input > next.stop) continue;

            const tLinear = (input - prev.stop) / (next.stop - prev.stop);
            const t = base === 1 ? tLinear : (Math.pow(base, tLinear) - 1) / (base - 1);

            if (typeof prev.value === 'number' && typeof next.value === 'number') {
                return prev.value + (next.value - prev.value) * t;
            }
            if (typeof prev.value === 'string' && typeof next.value === 'string') {
                const c1 = parseHexColor(prev.value);
                const c2 = parseHexColor(next.value);
                if (c1 && c2) {
                    const r = Math.round(c1.r + (c2.r - c1.r) * t);
                    const g = Math.round(c1.g + (c2.g - c1.g) * t);
                    const b = Math.round(c1.b + (c2.b - c1.b) * t);
                    return `rgb(${r}, ${g}, ${b})`;
                }
            }
            return prev.value;
        }

        return parsedStops[parsedStops.length - 1].value;
    }

    private resolveFilterOperand(entity: any, operand: unknown): unknown {
        if (!Array.isArray(operand)) {
            return operand;
        }

        const [operator, ...args] = operand;
        if (operator === 'get' && typeof args[0] === 'string') {
            return this.getEntityProperty(entity, args[0]);
        }
        if (operator === 'geometry-type') {
            if (entity?.polygon) return 'Polygon';
            if (entity?.polyline) return 'LineString';
            if (entity?.position || entity?.point || entity?.billboard || entity?.ellipse) return 'Point';
            return undefined;
        }

        return undefined;
    }

    private matchesStyleFilter(entity: any, filter: unknown): boolean {
        if (!Array.isArray(filter) || filter.length < 1) {
            return true;
        }

        const [operator, ...rest] = filter;
        if (operator === 'all') {
            return rest.every((clause) => this.matchesStyleFilter(entity, clause));
        }
        if ((operator === '==' || operator === '!=') && rest.length >= 2) {
            const lhs = this.resolveFilterOperand(entity, rest[0]);
            const rhs = rest[1];
            const matched = lhs === rhs;
            return operator === '==' ? matched : !matched;
        }

        return true;
    }

    private resolveNumber(entity: any, expression: unknown, fallback: number): number {
        const value = this.resolveExpression(entity, expression);
        return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
    }

    private resolveColor(entity: any, expression: unknown, fallback: string): string {
        const value = this.resolveExpression(entity, expression);
        return typeof value === 'string' && value.length > 0 ? value : fallback;
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

        const lineColor = toCssColor(linePaint['line-color'], '#3388ff');
        const lineWidth = toNumber(linePaint['line-width'], 2);
        const fillColor = toCssColor(fillPaint['fill-color'], '#3388ff');
        const fillOpacity = toNumber(fillPaint['fill-opacity'], 0.2);

        const entities = dataSource.entities?.values ?? [];
        for (const entity of entities) {
            const circleMatches = this.matchesStyleFilter(entity, circle?.filter);
            const lineMatches = this.matchesStyleFilter(entity, line?.filter);
            const fillMatches = this.matchesStyleFilter(entity, fill?.filter);
            const pointLikeEntity = Boolean(entity.position || entity.point || entity.billboard || entity.ellipse);

            if (circle && pointLikeEntity && !circleMatches) {
                // If a point does not pass the circle filter, suppress Cesium's default marker rendering.
                entity.point = undefined;
                entity.billboard = undefined;
                entity.ellipse = undefined;

                if (!lineMatches && !fillMatches) {
                    entity.show = false;
                    continue;
                }
            }

            if (circle && pointLikeEntity && circleMatches) {
                entity.show = true;
            }

            if (circle && circleMatches && pointLikeEntity) {
                // For "circle" layers, draw a ground-aligned ellipse so it conforms to the globe.
                // MapLibre circle-radius is in pixels; approximate meters based on current zoom.
                const zoom = this.store.getState().zoomLevel ?? 2;
                const julian = Cesium.JulianDate.now();
                const position = entity.position?.getValue?.(julian) ?? entity.position;
                if (position) {
                    const circleRadius = this.resolveNumber(entity, circlePaint['circle-radius'], 6);
                    const circleColor = this.resolveColor(entity, circlePaint['circle-color'], '#FF5722');
                    const circleOpacity = this.resolveNumber(entity, circlePaint['circle-opacity'], 0.8);
                    const circleStrokeColor = this.resolveColor(entity, circlePaint['circle-stroke-color'], lineColor);
                    const circleStrokeWidth = this.resolveNumber(entity, circlePaint['circle-stroke-width'], 1);

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

                    // Cesium can skip ellipse outlines when clamped to terrain; draw a clamped ring polyline.
                    const lon = Cesium.Math.toDegrees(carto.longitude);
                    const ringLonLat = buildCircleOutlineLonLat(lon, lat, radiusMeters, 64);
                    const ringPositions = ringLonLat.map(([ringLon, ringLat]) =>
                        Cesium.Cartesian3.fromDegrees(ringLon, ringLat, 0)
                    );
                    if (!entity.polyline) {
                        entity.polyline = new Cesium.PolylineGraphics();
                    }
                    entity.polyline.positions = ringPositions;
                    entity.polyline.width = Math.max(1, circleStrokeWidth);
                    entity.polyline.material = Cesium.Color.fromCssColorString(circleStrokeColor).withAlpha(1);
                    if ('clampToGround' in entity.polyline) {
                        entity.polyline.clampToGround = true;
                    }

                    if (Cesium.HeightReference?.CLAMP_TO_GROUND) {
                        entity.ellipse.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
                    }
                    // Do not render default marker/point if ellipse is active.
                    entity.billboard = undefined;
                    entity.point = undefined;
                }
            }
            if (entity.polyline && line && lineMatches) {
                entity.polyline.material = Cesium.Color.fromCssColorString(lineColor).withAlpha(1);
                entity.polyline.width = lineWidth;
            }
            if (entity.polygon && fill && fillMatches) {
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
