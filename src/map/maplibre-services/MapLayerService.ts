// src/map/maplibre-services/MapLayerService.ts

import { ILayerService, LayerInsertOptions, type SourceFeatureQueryOptions, type SourceFeatureSample, type QueryLayerFeaturesOptions } from '../IMapInterfaces';
import { normalizeRawSource } from '../layer-source-utils';
import type { AnyLayerConfig, StandardLayerConfig, SourceConfig, WMSSourceConfig, SubLayerSpec } from '../../config/types';
import { MapStateStore } from '../../store/map-state-store';
import * as maplibregl from 'maplibre-gl';
import { buildWMSGetMapUrl } from '../../utils/wms-url-builder';
import type { WarpedMapLayer } from '@allmaps/maplibre';
import { assembleTileFeatures } from '../vector-tile-features';

const OPACITY_PAINT_PROPERTIES: Record<string, string[]> = {
    fill: ['fill-opacity'],
    line: ['line-opacity'],
    circle: ['circle-opacity'],
    raster: ['raster-opacity'],
    'fill-extrusion': ['fill-extrusion-opacity'],
    heatmap: ['heatmap-opacity'],
    background: ['background-opacity'],
    symbol: ['icon-opacity', 'text-opacity'],
    hillshade: ['hillshade-shadow-color', 'hillshade-highlight-color', 'hillshade-accent-color'],
};

export class MapLayerService implements ILayerService {
    private map: maplibregl.Map;
    private store: MapStateStore;
    private logicalToNative: Map<string, string[]> = new Map();
    private logicalSourceToNative: Map<string, string> = new Map();
    private nativeLayerToSource: Map<string, string> = new Map();
    private warpedMapLayers: Map<string, WarpedMapLayer> = new Map();
    private nativeSourceToConfig = new Map<string, any>();
    private sourceIdCounter = 0;
    private logicalLayerLegendRole: Map<string, 'background' | 'overlay'> = new Map();

    constructor(map: maplibregl.Map, store: MapStateStore) {
        this.map = map;
        this.store = store;
    }

    private resolveLegendRole(layerConfig: AnyLayerConfig): 'background' | 'overlay' {
        const metadata = (layerConfig?.metadata && typeof layerConfig.metadata === 'object')
            ? (layerConfig.metadata as Record<string, unknown>)
            : null;
        return metadata?.legendRole === 'background' ? 'background' : 'overlay';
    }

    private findNextStyleLayerId(afterNativeLayerId: string): string | undefined {
        const styleLayers = this.map.getStyle()?.layers ?? [];
        for (let index = 0; index < styleLayers.length; index += 1) {
            if (styleLayers[index].id !== afterNativeLayerId) continue;
            return styleLayers[index + 1]?.id;
        }
        return undefined;
    }

    private resolveInsertBeforeLayerIdFromOptions(options?: LayerInsertOptions): string | undefined {
        if (options?.beforeLayerId) {
            for (const nativeLayerId of this.logicalToNative.get(options.beforeLayerId) ?? []) {
                if (this.map.getLayer(nativeLayerId)) return nativeLayerId;
            }
            // Fallback: inline layers (added via adapter.addLayer) use their logical ID as native ID
            if (this.map.getLayer(options.beforeLayerId)) return options.beforeLayerId;
        }
        if (options?.afterLayerId) {
            const ids = this.logicalToNative.get(options.afterLayerId) ?? [];
            for (let i = ids.length - 1; i >= 0; i -= 1) {
                if (this.map.getLayer(ids[i])) return this.findNextStyleLayerId(ids[i]);
            }
            // Fallback: inline layers
            if (this.map.getLayer(options.afterLayerId)) return this.findNextStyleLayerId(options.afterLayerId);
        }
        return undefined;
    }

    private collectBackgroundNativeLayerIds(): Set<string> {
        const ids = new Set<string>();
        for (const [logicalLayerId, nativeLayerIds] of this.logicalToNative.entries()) {
            if ((this.logicalLayerLegendRole.get(logicalLayerId) ?? 'overlay') !== 'background') continue;
            for (const id of nativeLayerIds) ids.add(id);
        }
        return ids;
    }

    private findBackgroundInsertionBeforeLayerId(): string | undefined {
        // Use internal logical layer tracking (Map insertion order) so custom layers
        // like WarpedMapLayer are included even if absent from map.getStyle().layers.
        const bgIds = this.collectBackgroundNativeLayerIds();
        for (const [logicalId, nativeIds] of this.logicalToNative.entries()) {
            if (this.logicalLayerLegendRole.get(logicalId) === 'background') continue;
            for (const nativeId of nativeIds) {
                if (!bgIds.has(nativeId)) return nativeId;
            }
        }
        return undefined;
    }

    getNativeSourceId(logicalSourceId: string): string | undefined {
        return this.logicalSourceToNative.get(logicalSourceId);
    }

    private getOrCreateNativeSourceId(logicalSourceId: string): string {
        if (this.logicalSourceToNative.has(logicalSourceId)) {
            return this.logicalSourceToNative.get(logicalSourceId)!;
        }
        const sanitized = logicalSourceId.replace(/[^a-zA-Z0-9_-]/g, '-');
        const nativeId = `src-${sanitized}-${this.sourceIdCounter++}`;
        this.logicalSourceToNative.set(logicalSourceId, nativeId);
        return nativeId;
    }

    private ensureNativeSource(nativeSourceId: string, sourceConfig: SourceConfig): void {
        if (this.map.getSource(nativeSourceId)) {
            // Source may have been added ad-hoc (e.g. discovered layers added via
            // adapter.addSource bypassing this method) — still record its config so
            // getVisibleWMSLayers etc. can find it.
            if (!this.nativeSourceToConfig.has(nativeSourceId)) {
                this.nativeSourceToConfig.set(nativeSourceId, sourceConfig);
            }
            return;
        }

        let nativeSource: any = { type: sourceConfig.type };

        if (sourceConfig.type === 'raster') {
            if (sourceConfig.service === 'xyz' || sourceConfig.service === undefined) {
                const tiles = Array.isArray(sourceConfig.url) ? sourceConfig.url : [sourceConfig.url];
                nativeSource = { type: 'raster', tiles };
                if ('tileSize' in sourceConfig) nativeSource.tileSize = sourceConfig.tileSize;
                if ('bounds' in sourceConfig) nativeSource.bounds = sourceConfig.bounds;
                if (typeof sourceConfig.minzoom === 'number') nativeSource.minzoom = sourceConfig.minzoom;
                if (typeof sourceConfig.maxzoom === 'number') nativeSource.maxzoom = sourceConfig.maxzoom;
                if ('scheme' in sourceConfig) nativeSource.scheme = sourceConfig.scheme;
                if (typeof sourceConfig.attribution === 'string') nativeSource.attribution = sourceConfig.attribution;
                if (typeof (sourceConfig as any).volatile === 'boolean') nativeSource.volatile = (sourceConfig as any).volatile;
            } else if (sourceConfig.service === 'wms') {
                const wmsConfig = sourceConfig as WMSSourceConfig;
                // Discovered/ad-hoc sources already carry a ready-made `tiles` array
                // (WMS GetMap URL built by layer-discovery) and use `gfiUrl` (not `url`)
                // for GetFeatureInfo, so buildWMSGetMapUrl can't run here — reuse `tiles`.
                const existingTiles = (sourceConfig as any).tiles as string[] | undefined;
                let tiles: string[];
                if (existingTiles?.length) {
                    tiles = existingTiles;
                } else {
                    const baseUrl = Array.isArray(wmsConfig.url) ? wmsConfig.url[0] : wmsConfig.url;
                    tiles = [buildWMSGetMapUrl({ baseUrl, layers: wmsConfig.layers ?? '', version: wmsConfig.version, styles: wmsConfig.styles, format: wmsConfig.format, transparent: wmsConfig.transparent, crs: wmsConfig.crs, tileSize: wmsConfig.tileSize }, 'maplibre')];
                }
                nativeSource = { type: 'raster', tiles };
                if ('tileSize' in sourceConfig) nativeSource.tileSize = sourceConfig.tileSize;
                if ('bounds' in sourceConfig) nativeSource.bounds = sourceConfig.bounds;
                if (typeof sourceConfig.minzoom === 'number') nativeSource.minzoom = sourceConfig.minzoom;
                if (typeof sourceConfig.maxzoom === 'number') nativeSource.maxzoom = sourceConfig.maxzoom;
                if ('scheme' in sourceConfig) nativeSource.scheme = sourceConfig.scheme;
                if (typeof sourceConfig.attribution === 'string') nativeSource.attribution = sourceConfig.attribution;
                if (typeof (sourceConfig as any).volatile === 'boolean') nativeSource.volatile = (sourceConfig as any).volatile;
            }
        } else if (sourceConfig.type === 'geojson') {
            const rawData = (sourceConfig as any).data;
            nativeSource = { type: 'geojson', data: rawData };
            if (typeof (sourceConfig as any).attribution === 'string') nativeSource.attribution = (sourceConfig as any).attribution;
        } else if (sourceConfig.type === 'raster-dem') {
            const dc = sourceConfig as any;
            nativeSource = { type: 'raster-dem', tiles: dc.tiles };
            if (typeof dc.tileSize === 'number') nativeSource.tileSize = dc.tileSize;
            if (typeof dc.encoding === 'string') nativeSource.encoding = dc.encoding;
            if (typeof dc.maxzoom === 'number') nativeSource.maxzoom = dc.maxzoom;
            if (typeof dc.attribution === 'string') nativeSource.attribution = dc.attribution;
        } else if (sourceConfig.type === 'vector') {
            const vc = sourceConfig as any;
            nativeSource = vc.tiles
                ? { type: 'vector', tiles: vc.tiles }
                : { type: 'vector', url: vc.url };
            if (typeof vc.minzoom === 'number') nativeSource.minzoom = vc.minzoom;
            if (typeof vc.maxzoom === 'number') nativeSource.maxzoom = vc.maxzoom;
            if (typeof vc.attribution === 'string') nativeSource.attribution = vc.attribution;
        }

        this.map.addSource(nativeSourceId, nativeSource);
        this.nativeSourceToConfig.set(nativeSourceId, sourceConfig);
    }

    private buildNativeLayer(nativeLayerId: string, spec: SubLayerSpec | StandardLayerConfig, nativeSourceId: string, mapLayerId: string): any {
        const layer: any = { id: nativeLayerId, type: spec.type, source: nativeSourceId, metadata: { mapLayerId } };
        if (spec['source-layer']) layer['source-layer'] = spec['source-layer'];
        if (spec.minzoom !== undefined) layer.minzoom = spec.minzoom;
        if (spec.maxzoom !== undefined) layer.maxzoom = spec.maxzoom;
        if (spec.paint && typeof spec.paint === 'object') layer.paint = spec.paint;
        if (spec.layout && typeof spec.layout === 'object') layer.layout = spec.layout;
        if (Array.isArray(spec.filter)) layer.filter = spec.filter;
        return layer;
    }

    private async addAllmapsLayer(layerId: string, annotationUrl: string, insertBeforeLayerId?: string): Promise<boolean> {
        const { WarpedMapLayer } = await import('@allmaps/maplibre');
        const warpedLayerId = `warpedmap-${layerId}`;
        const warpedMapLayer = new WarpedMapLayer({ layerId: warpedLayerId });
        this.map.addLayer(warpedMapLayer as unknown as maplibregl.CustomLayerInterface, insertBeforeLayerId);
        await warpedMapLayer.addGeoreferenceAnnotationByUrl(annotationUrl);
        this.warpedMapLayers.set(layerId, warpedMapLayer);
        this.logicalToNative.set(layerId, [warpedLayerId]);
        return true;
    }

    /**
     * Registers a composite source using native format conversion (ensureNativeSource).
     * Called from the generic composite decomposition path — webmapx SourceConfig → native MapLibre format.
     * Returns the native source id for lookup by sublayer addLayer calls.
     */
    public registerCompositeSource(logicalId: string, config: SourceConfig): string {
        const nativeId = this.getOrCreateNativeSourceId(logicalId);
        this.ensureNativeSource(nativeId, config);
        return nativeId;
    }

    /** Paint keys that are actually layout properties in the maplibre style spec. */
    private static readonly LAYOUT_KEYS = new Set(['text-size', 'icon-size', 'text-field', 'visibility']);

    /** Maps a paint/layout key's prefix to the maplibre layer type that owns it. */
    private _pendingHillshade: Map<string, {key: string; value: unknown; rafId: number}> = new Map();

    private applyHillshadePaintThrottled(nativeLayerId: string, key: string, value: unknown): void {
        const existing = this._pendingHillshade.get(nativeLayerId);
        if (existing) {
            existing.key = key;
            existing.value = value;
            return;
        }
        const rafId = requestAnimationFrame(() => {
            const pending = this._pendingHillshade.get(nativeLayerId);
            if (!pending) return;
            this._pendingHillshade.delete(nativeLayerId);
            this.map.setPaintProperty(nativeLayerId, pending.key as any, pending.value as any);
            this.map.triggerRepaint();
        });
        this._pendingHillshade.set(nativeLayerId, { key, value, rafId });
    }

    private static layerTypeForKey(key: string): string {
        if (key.startsWith('fill-extrusion')) return 'fill-extrusion';
        if (key.startsWith('text-') || key.startsWith('icon-')) return 'symbol';
        return key.split('-')[0];
    }

    private applyStyleProperty(nativeLayerId: string, key: string, value: unknown): void {
        if (MapLayerService.LAYOUT_KEYS.has(key)) {
            this.map.setLayoutProperty(nativeLayerId, key as any, value as any);
            this.map.triggerRepaint();
        } else if (key === 'hillshade-exaggeration') {
            this.applyHillshadePaintThrottled(nativeLayerId, key, value);
        } else {
            this.map.setPaintProperty(nativeLayerId, key as any, value as any);
            this.map.triggerRepaint();
        }
    }

    updateLayerStyle(styleId: string, subLayerId: string, partialPaint: Record<string, unknown>): boolean {
        const nativeLayerId = `${styleId}-${subLayerId}`;
        if (this.map.getLayer(nativeLayerId)) {
            for (const [key, value] of Object.entries(partialPaint)) {
                this.applyStyleProperty(nativeLayerId, key, value);
            }
            return true;
        }

        // Non-composite standard layer: styleId === subLayerId, native id is
        // `${layerId}-${sourceId}-${type}`. Apply each key only to the native
        // layer whose type matches the key's prefix (e.g. 'fill-color' -> '-fill',
        // 'text-size'/'text-color' -> '-symbol').
        if (styleId !== subLayerId) return false;
        let updated = false;
        const candidates = this.logicalToNative.get(styleId) ?? [];
        for (const nativeId of candidates) {
            if (!this.map.getLayer(nativeId)) continue;
            for (const [key, value] of Object.entries(partialPaint)) {
                const type = MapLayerService.layerTypeForKey(key);
                if (!nativeId.endsWith(`-${type}`)) continue;
                this.applyStyleProperty(nativeId, key, value);
                updated = true;
            }
        }
        return updated;
    }

    async addLayer(layerConfig: AnyLayerConfig, options?: LayerInsertOptions): Promise<boolean> {
        const layerId = layerConfig.id;
        // Composite sublayers carry the parent logical id so we can group them correctly.
        const logicalLayerId = (layerConfig as any).metadata?.logicalLayerId as string | undefined;
        const groupId = logicalLayerId ?? layerId;
        const legendRole = this.resolveLegendRole(layerConfig);
        const insertBeforeLayerId = this.resolveInsertBeforeLayerIdFromOptions(options)
            ?? (legendRole === 'background' ? this.findBackgroundInsertionBeforeLayerId() : undefined);

        if (layerConfig.type === 'allmaps') {
            const success = await this.addAllmapsLayer(layerId, layerConfig.annotation, insertBeforeLayerId);
            if (success) this.logicalLayerLegendRole.set(layerId, legendRole);
            return success;
        }

        // Standard layer (type: 'style' no longer reaches here — base-adapter decomposes it)
        const stdLayer = layerConfig as StandardLayerConfig;
        if (stdLayer.type === 'background') {
            // Scope by groupId: every fetched remote style typically names its background
            // sublayer literally "background", so without this every composite/style layer's
            // background would collide on the same native id — whichever was added first wins,
            // and later ones (e.g. switching basemap styles) silently keep the old color.
            const nativeLayerId = `${groupId}-${layerId}-background`;
            if (!this.map.getLayer(nativeLayerId)) {
                const native: any = { id: nativeLayerId, type: 'background' };
                if (stdLayer.paint) native.paint = stdLayer.paint;
                if (stdLayer.layout) native.layout = stdLayer.layout;
                this.map.addLayer(native, insertBeforeLayerId);
            }
            this.logicalLayerLegendRole.set(groupId, legendRole);
            this.logicalToNative.set(groupId, [nativeLayerId]);
            return true;
        }

        if (!stdLayer.source) return false;
        const rawSourceDef = (layerConfig as any).sources?.[stdLayer.source as string];
        const sourceConfig = rawSourceDef ? normalizeRawSource(stdLayer.source as string, rawSourceDef) : null;

        let nativeSourceId: string;
        if (sourceConfig) {
            nativeSourceId = this.getOrCreateNativeSourceId(sourceConfig.id);
            this.ensureNativeSource(nativeSourceId, sourceConfig);
        } else {
            // Source pre-registered via addSource; resolve logical→native or use string as-is.
            const sourceStr = stdLayer.source as string;
            nativeSourceId = this.logicalSourceToNative.get(sourceStr) ?? sourceStr;
        }
        if (!this.map.getSource(nativeSourceId)) return false;

        // Composite sublayers: native id is `${logicalId}-${sublayerId}` (matches updateLayerStyle lookup).
        // Standard layers: `${layerId}-${sourceId}-${type}`.
        const sourceIdForLayerName = sourceConfig ? sourceConfig.id : nativeSourceId;
        const nativeLayerId = logicalLayerId
            ? `${logicalLayerId}-${layerId}`
            : `${layerId}-${sourceIdForLayerName}-${stdLayer.type}`;

        if (!this.map.getLayer(nativeLayerId)) {
            this.map.addLayer(this.buildNativeLayer(nativeLayerId, stdLayer, nativeSourceId, groupId), insertBeforeLayerId);
            if (stdLayer.type === 'hillshade') {
                this.map.setPaintProperty(nativeLayerId, 'hillshade-exaggeration-transition', { duration: 0, delay: 0 } as any);
            }
        }
        this.logicalLayerLegendRole.set(groupId, legendRole);
        const existing = this.logicalToNative.get(groupId) ?? [];
        this.logicalToNative.set(groupId, Array.from(new Set([...existing, nativeLayerId])));
        this.nativeLayerToSource.set(nativeLayerId, nativeSourceId);
        return true;
    }

    moveLayer(layerId: string, beforeLayerId?: string | null): void {
        const nativeIds = this.logicalToNative.get(layerId) ?? [];
        const beforeNativeId = beforeLayerId
            ? this.resolveInsertBeforeLayerIdFromOptions({ beforeLayerId })
            : undefined;
        for (const nativeId of nativeIds) {
            if (!this.map.getLayer(nativeId)) continue;
            try { this.map.moveLayer(nativeId, beforeNativeId); } catch (_) {}
        }
    }

    removeLayer(layerId: string): void {
        if (this.warpedMapLayers.has(layerId)) {
            for (const id of this.logicalToNative.get(layerId) ?? []) {
                if (this.map.getLayer(id)) this.map.removeLayer(id);
            }
            this.warpedMapLayers.delete(layerId);
            this.logicalToNative.delete(layerId);
            this.logicalLayerLegendRole.delete(layerId);
                return;
        }

        const nativeIds = this.logicalToNative.get(layerId) ?? [];
        const nativeSourceIds = new Set<string>();
        for (const id of nativeIds) {
            const sourceId = this.nativeLayerToSource.get(id);
            if (sourceId) nativeSourceIds.add(sourceId);
            if (this.map.getLayer(id)) this.map.removeLayer(id);
            this.nativeLayerToSource.delete(id);
        }
        this.logicalToNative.delete(layerId);
        this.logicalLayerLegendRole.delete(layerId);

        const terrain = this.map.getTerrain?.();
        if (terrain) {
            const terrainMatchesLayer = nativeSourceIds.has(terrain.source);
            if (terrainMatchesLayer) {
                this.map.setTerrain(null);
                const terrainSrc = terrain.source;
                if (this.map.getSource(terrainSrc) && !nativeSourceIds.has(terrainSrc)) {
                    this.map.removeSource(terrainSrc);
                }
            }
        }

        for (const sourceId of nativeSourceIds) {
            let stillUsed = false;
            for (const usedId of this.nativeLayerToSource.values()) {
                if (usedId === sourceId) { stillUsed = true; break; }
            }
            if (!stillUsed && this.map.getSource(sourceId)) {
                this.map.removeSource(sourceId);
                // Also clean up logical source tracking
                for (const [logicalId, nativeId] of this.logicalSourceToNative.entries()) {
                    if (nativeId === sourceId) { this.logicalSourceToNative.delete(logicalId); break; }
                }
            }
        }

    }

    getVisibleLayers(): string[] {
        return Array.from(this.logicalToNative.keys());
    }

    isLayerVisible(layerId: string): boolean {
        return this.logicalToNative.has(layerId);
    }

    setLayerVisibility(layerId: string, visible: boolean): void {
        const nativeLayerIds = this.logicalToNative.get(layerId) ?? [];
        for (const nativeLayerId of nativeLayerIds) {
            try {
                this.map.setLayoutProperty(nativeLayerId, 'visibility', visible ? 'visible' : 'none');
            } catch (_) {}
        }
    }

    /**
     * Scales an opacity paint value by `factor`. MapLibre rejects wrapping a `["zoom"]` (or
     * other camera) expression in an outer `['*', expr, factor]` — "zoom expression may only
     * be used as input to a top-level step/interpolate expression" — so `interpolate`/`step`
     * stops must be rewritten in place (scaling each output value) instead of nested.
     * Falls back to a flat `factor` for expression shapes we don't recognize.
     */
    private scaleOpacityValue(value: unknown, factor: number): unknown {
        if (typeof value === 'number') return value * factor;
        if (!Array.isArray(value)) return factor;
        const [op, ...args] = value;
        if (op === 'interpolate' && args.length >= 2) {
            const [interpType, input, ...stops] = args;
            const scaledStops = stops.map((v: unknown, i: number) => (i % 2 === 1 ? this.scaleOpacityValue(v, factor) : v));
            return ['interpolate', interpType, input, ...scaledStops];
        }
        if (op === 'step' && args.length >= 1) {
            const [input, base, ...stops] = args;
            const scaledStops = stops.map((v: unknown, i: number) => (i % 2 === 1 ? this.scaleOpacityValue(v, factor) : v));
            return ['step', input, this.scaleOpacityValue(base, factor), ...scaledStops];
        }
        return factor;
    }

    /**
     * Author-set (style-editor or original style JSON) opacity for one paint property of a
     * sublayer, read live from the store — the slider multiplies against this, never against
     * a previously-rendered value. Can be a plain number or a full expression (e.g. a
     * zoom-interpolated `raster-opacity` fade from a fetched remote style); undefined when
     * the property isn't authored at all (defaults to fully opaque, base 1).
     */
    private getAuthoredOpacity(layerId: string, nativeLayerId: string, property: string): unknown {
        const entry = this.store.getState().mapLayers?.[layerId] as Record<string, unknown> | undefined;
        if (!entry) return undefined;
        const sublayers = Array.isArray(entry.sublayers) ? entry.sublayers as Record<string, unknown>[] : null;
        let paint: Record<string, unknown> | undefined;
        if (sublayers) {
            const sub = sublayers.find((s) => `${layerId}-${s.id}` === nativeLayerId);
            paint = (sub?.paint && typeof sub.paint === 'object') ? sub.paint as Record<string, unknown> : undefined;
        } else {
            paint = (entry.paint && typeof entry.paint === 'object') ? entry.paint as Record<string, unknown> : undefined;
        }
        return paint?.[property];
    }

    setLayerOpacity(layerId: string, factor: number): void {
        const warpedMapLayer = this.warpedMapLayers.get(layerId);
        if (warpedMapLayer) {
            warpedMapLayer.setOpacity(factor);
            return;
        }
        const nativeLayerIds = this.logicalToNative.get(layerId) ?? [];
        for (const nativeLayerId of nativeLayerIds) {
            try {
                const nativeLayer = this.map.getLayer(nativeLayerId);
                const properties = nativeLayer ? OPACITY_PAINT_PROPERTIES[nativeLayer.type] : undefined;
                if (!properties) continue;
                if (nativeLayer!.type === 'hillshade') {
                    this.map.setPaintProperty(nativeLayerId, 'hillshade-shadow-color', `rgba(0,0,0,${factor})`);
                    this.map.setPaintProperty(nativeLayerId, 'hillshade-highlight-color', `rgba(255,255,255,${factor})`);
                    this.map.setPaintProperty(nativeLayerId, 'hillshade-accent-color', `rgba(0,0,0,${factor})`);
                    continue;
                }
                for (const property of properties) {
                    const authored = this.getAuthoredOpacity(layerId, nativeLayerId, property);
                    if (authored === undefined) {
                        this.map.setPaintProperty(nativeLayerId, property as any, factor);
                    } else if (factor === 1) {
                        this.map.setPaintProperty(nativeLayerId, property as any, authored);
                    } else {
                        this.map.setPaintProperty(nativeLayerId, property as any, this.scaleOpacityValue(authored, factor));
                    }
                }
            } catch (_) {}
        }
    }

    getSourceConfig(sourceId: string): Record<string, unknown> | null {
        const nativeSourceId = this.logicalSourceToNative.get(sourceId);
        if (!nativeSourceId) return null;
        return this.nativeSourceToConfig.get(nativeSourceId) ?? null;
    }

    getSourceData(sourceId: string): GeoJSON.FeatureCollection | string | null {
        const nativeSourceId = this.logicalSourceToNative.get(sourceId);
        if (!nativeSourceId) return null;
        const source = this.map.getSource(nativeSourceId) as any;
        if (!source || source.type !== 'geojson') return null;
        try {
            const data = source.serialize?.()?.data;
            if (typeof data === 'string') return data;
            if (data && typeof data === 'object') return data as GeoJSON.FeatureCollection;
        } catch (_) {}
        return null;
    }

    /**
     * Repoints a tile source at different urls, in place.
     *
     * `setTiles` refetches without touching the layers that draw the source, so
     * a WMS style change keeps the layer's place in the stack, its visibility
     * and its opacity. Only tile sources have it; a geojson source says no.
     */
    setSourceTiles(sourceId: string, tiles: string[]): boolean {
        const nativeSourceId = this.logicalSourceToNative.get(sourceId) ?? sourceId;
        const source = this.map.getSource(nativeSourceId) as { setTiles?: (tiles: string[]) => void } | undefined;
        if (typeof source?.setTiles !== 'function') return false;
        source.setTiles(tiles);
        return true;
    }

    /** Where the live source currently points, which the config may not say. */
    getSourceTiles(sourceId: string): string[] | null {
        const nativeSourceId = this.logicalSourceToNative.get(sourceId) ?? sourceId;
        const source = this.map.getSource(nativeSourceId) as
            { tiles?: string[]; serialize?: () => { tiles?: string[]; url?: string } } | undefined;
        if (Array.isArray(source?.tiles) && source.tiles.length > 0) return [...source.tiles];
        const serialized = source?.serialize?.();
        if (Array.isArray(serialized?.tiles) && serialized.tiles.length > 0) return [...serialized.tiles];
        return typeof serialized?.url === "string" ? [serialized.url] : null;
    }

    querySourceFeatures(sourceId: string, options: SourceFeatureQueryOptions = {}): SourceFeatureSample | null {
        const nativeSourceId = this.logicalSourceToNative.get(sourceId);
        if (!nativeSourceId || !this.map.getSource(nativeSourceId)) return null;
        try {
            const params = options.sourceLayer ? { sourceLayer: options.sourceLayer } : undefined;
            const rawFeatures = this.map.querySourceFeatures(nativeSourceId, params as any);
            const features = this.dedupeSourceFeatures(rawFeatures.map((feature) => feature.toJSON() as GeoJSON.Feature));
            return { features };
        } catch (_) {
            return null;
        }
    }

    getLayerSourceLayers(layerId: string): string[] {
        const nativeLayerIds = this.logicalToNative.get(layerId) ?? [];
        const seen = new Set<string>();
        for (const id of nativeLayerIds) {
            const spec = this.map.getLayer(id) as Record<string, unknown> | undefined;
            const sl = spec?.['source-layer'];
            if (typeof sl === 'string' && sl) seen.add(sl);
        }
        return [...seen];
    }

    async queryLayerFeatures(layerId: string, options?: QueryLayerFeaturesOptions): Promise<GeoJSON.FeatureCollection> {
        const nativeLayerIds = this.logicalToNative.get(layerId) ?? [];
        if (nativeLayerIds.length === 0) return { type: 'FeatureCollection', features: [] };

        const firstNativeLayerId = nativeLayerIds[0];
        const nativeSourceId = this.nativeLayerToSource.get(firstNativeLayerId);
        const source = nativeSourceId ? this.map.getSource(nativeSourceId) as any : null;
        const sourceType: string = source?.type ?? '';

        if (sourceType === 'geojson') {
            try {
                const data = source.serialize?.()?.data;
                if (data && typeof data === 'object' && data.type === 'FeatureCollection') {
                    return data as GeoJSON.FeatureCollection;
                }
            } catch (_) {}
            return { type: 'FeatureCollection', features: [] };
        }

        // Use querySourceFeatures so all loaded tiles are queried, not just rendered viewport.
        // queryRenderedFeatures misses features near tile borders or outside the viewport center.
        try {
            let rawFeatures = this.map.queryRenderedFeatures(undefined, { layers: nativeLayerIds });
            if (options?.sourceLayer) {
                rawFeatures = rawFeatures.filter(f => f.sourceLayer === options.sourceLayer);
            }
            return assembleTileFeatures(rawFeatures.map((mf) => {
                // `_x/_y/_z` are MapLibre internals holding the *canonical* tile
                // coords, so a wrapped world copy reports the same tile — which is
                // exactly what makes it recognisable as a duplicate.
                const wrapper = mf as unknown as { _x?: number; _y?: number; _z?: number };
                const hasTile = wrapper._x !== undefined && wrapper._y !== undefined && wrapper._z !== undefined;
                return {
                    feature: mf.toJSON() as GeoJSON.Feature,
                    tile: hasTile ? { z: wrapper._z!, x: wrapper._x!, y: wrapper._y! } : undefined,
                    sourceLayer: mf.sourceLayer,
                    id: mf.id,
                };
            }));
        } catch (_) {
            return { type: 'FeatureCollection', features: [] };
        }
    }

    private dedupeSourceFeatures(features: GeoJSON.Feature[]): GeoJSON.Feature[] {
        const seen = new Set<string>();
        return features.filter((feature) => {
            // Use geometry + id so tile-border clips of the same feature (same id, different
            // geometry) both survive. Pure id-dedup would drop one half of a split building.
            const key = JSON.stringify([feature.id, feature.geometry]);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    setSourceData(sourceId: string, data: GeoJSON.FeatureCollection): boolean {
        const nativeSourceId = this.logicalSourceToNative.get(sourceId);
        if (!nativeSourceId) return false;
        const source = this.map.getSource(nativeSourceId) as any;
        if (!source || source.type !== 'geojson' || typeof source.setData !== 'function') return false;
        source.setData(data);
        return true;
    }

    getVisibleWMSLayers(): Array<{ layerId: string; layerTitle?: string; sourceConfig: WMSSourceConfig }> {
        const result: Array<{ layerId: string; layerTitle?: string; sourceConfig: WMSSourceConfig }> = [];
        for (const logicalId of this.logicalToNative.keys()) {
            const nativeLayerIds = this.logicalToNative.get(logicalId) ?? [];
            for (const nativeLayerId of nativeLayerIds) {
                const nativeSourceId = this.nativeLayerToSource.get(nativeLayerId);
                if (!nativeSourceId) continue;
                const sourceConfig = this.nativeSourceToConfig.get(nativeSourceId);
                if (sourceConfig?.type === 'raster' && (sourceConfig as any).service === 'wms') {
                    const cfg = sourceConfig as any;
                    // Ad-hoc discovered sources store GetFeatureInfo params under
                    // gfiUrl/gfiLayers/gfiVersion (to avoid colliding with MapLibre's
                    // raster source `url`/`layers` keys); map them back to WMSSourceConfig.
                    const wmsConfig: WMSSourceConfig = 'gfiUrl' in cfg
                        ? { ...cfg, url: cfg.gfiUrl, layers: cfg.gfiLayers, version: cfg.gfiVersion }
                        : cfg;
                    result.push({ layerId: logicalId, sourceConfig: wmsConfig });
                }
                break;
            }
        }
        return result;
    }

}
