// src/map/maplibre-services/MapLayerService.ts

import { ILayerService, LayerInsertOptions } from '../IMapInterfaces';
import { normalizeRawSource } from '../layer-source-utils';
import { normalizeCompositeLayer, type NormalizedCompositeSpec } from '../composite-layer-utils';
import type { AnyLayerConfig, StandardLayerConfig, SourceConfig, WMSSourceConfig, GeoJSONSourceConfig, SubLayerSpec } from '../../config/types';
import { MapStateStore } from '../../store/map-state-store';
import * as maplibregl from 'maplibre-gl';
import { buildWMSGetMapUrl } from '../../utils/wms-url-builder';
import type { WarpedMapLayer } from '@allmaps/maplibre';

const OPACITY_PAINT_PROPERTIES: Record<string, string[]> = {
    fill: ['fill-opacity'],
    line: ['line-opacity'],
    circle: ['circle-opacity'],
    raster: ['raster-opacity'],
    'fill-extrusion': ['fill-extrusion-opacity'],
    heatmap: ['heatmap-opacity'],
    background: ['background-opacity'],
    symbol: ['icon-opacity', 'text-opacity'],
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

    private getOrCreateNativeSourceId(logicalSourceId: string): string {
        if (this.logicalSourceToNative.has(logicalSourceId)) {
            return this.logicalSourceToNative.get(logicalSourceId)!;
        }
        const nativeId = `src-${logicalSourceId}-${this.sourceIdCounter++}`;
        this.logicalSourceToNative.set(logicalSourceId, nativeId);
        return nativeId;
    }

    private ensureNativeSource(nativeSourceId: string, sourceConfig: SourceConfig): void {
        if (this.map.getSource(nativeSourceId)) return;

        let nativeSource: any = { type: sourceConfig.type };

        if (sourceConfig.type === 'raster') {
            if (sourceConfig.service === 'xyz') {
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
                const baseUrl = Array.isArray(wmsConfig.url) ? wmsConfig.url[0] : wmsConfig.url;
                const url = buildWMSGetMapUrl({ baseUrl, layers: wmsConfig.layers ?? '', version: wmsConfig.version, styles: wmsConfig.styles, format: wmsConfig.format, transparent: wmsConfig.transparent, crs: wmsConfig.crs, tileSize: wmsConfig.tileSize }, 'maplibre');
                nativeSource = { type: 'raster', tiles: [url] };
                if ('tileSize' in sourceConfig) nativeSource.tileSize = sourceConfig.tileSize;
                if ('bounds' in sourceConfig) nativeSource.bounds = sourceConfig.bounds;
                if (typeof sourceConfig.minzoom === 'number') nativeSource.minzoom = sourceConfig.minzoom;
                if (typeof sourceConfig.maxzoom === 'number') nativeSource.maxzoom = sourceConfig.maxzoom;
                if ('scheme' in sourceConfig) nativeSource.scheme = sourceConfig.scheme;
                if (typeof sourceConfig.attribution === 'string') nativeSource.attribution = sourceConfig.attribution;
                if (typeof (sourceConfig as any).volatile === 'boolean') nativeSource.volatile = (sourceConfig as any).volatile;
            }
        } else if (sourceConfig.type === 'geojson') {
            nativeSource = { type: 'geojson', data: (sourceConfig as any).data };
            if (typeof (sourceConfig as any).attribution === 'string') nativeSource.attribution = (sourceConfig as any).attribution;
        } else if (sourceConfig.type === 'vector') {
            const vc = sourceConfig as any;
            nativeSource = vc.tiles
                ? { type: 'vector', tiles: vc.tiles }
                : { type: 'vector', url: vc.url };
            if (typeof (sourceConfig as any).attribution === 'string') nativeSource.attribution = (sourceConfig as any).attribution;
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

    async addCompositeLayer(spec: NormalizedCompositeSpec, options?: LayerInsertOptions): Promise<boolean> {
        const styleId = spec.styleId;
        const legendRole: 'background' | 'overlay' = spec.metadata?.legendRole === 'background' ? 'background' : 'overlay';
        const insertBeforeLayerId = this.resolveInsertBeforeLayerIdFromOptions(options)
            ?? (legendRole === 'background' ? this.findBackgroundInsertionBeforeLayerId() : undefined);

        // Globally-addressable local sources are already normalized — just create them.
        const nativeSourceByKey = new Map<string, string>();
        for (const source of spec.sources) {
            const nativeSrcId = this.getOrCreateNativeSourceId(source.globalId);
            this.ensureNativeSource(nativeSrcId, source.config);
            nativeSourceByKey.set(source.key, nativeSrcId);
        }

        const nativeLayerIds: string[] = [...(this.logicalToNative.get(styleId) ?? [])];
        for (const subLayer of spec.subLayers) {
            const nativeLayerId = `${styleId}-${subLayer.id}`;

            if (subLayer.type === 'background') {
                if (!this.map.getLayer(nativeLayerId)) {
                    const native: any = { id: nativeLayerId, type: 'background' };
                    if (subLayer.paint) native.paint = subLayer.paint;
                    if (subLayer.layout) native.layout = subLayer.layout;
                    this.map.addLayer(native, insertBeforeLayerId);
                }
                nativeLayerIds.push(nativeLayerId);
                continue;
            }

            const nativeSourceId = nativeSourceByKey.get(subLayer.source ?? '');
            if (!nativeSourceId || !this.map.getSource(nativeSourceId)) continue;

            if (!this.map.getLayer(nativeLayerId)) {
                this.map.addLayer(this.buildNativeLayer(nativeLayerId, subLayer, nativeSourceId, styleId), insertBeforeLayerId);
            }
            nativeLayerIds.push(nativeLayerId);
            this.nativeLayerToSource.set(nativeLayerId, nativeSourceId);
        }

        this.logicalLayerLegendRole.set(styleId, legendRole);
        this.logicalToNative.set(styleId, Array.from(new Set(nativeLayerIds)));
        return nativeLayerIds.length > 0;
    }

    updateLayerStyle(styleId: string, subLayerId: string, partialPaint: Record<string, unknown>): boolean {
        const nativeLayerId = `${styleId}-${subLayerId}`;
        if (this.map.getLayer(nativeLayerId)) {
            for (const [key, value] of Object.entries(partialPaint)) {
                this.map.setPaintProperty(nativeLayerId, key, value as any);
            }
            return true;
        }

        // Non-composite standard layer: styleId === subLayerId, native id is
        // `${layerId}-${sourceId}-${type}`. Apply each paint key only to the
        // native layer whose type matches the key's prefix (e.g. 'fill-color' -> '-fill').
        if (styleId !== subLayerId) return false;
        let updated = false;
        for (const nativeId of this.logicalToNative.get(styleId) ?? []) {
            if (!this.map.getLayer(nativeId)) continue;
            for (const [key, value] of Object.entries(partialPaint)) {
                const prefix = key.startsWith('fill-extrusion') ? 'fill-extrusion' : key.split('-')[0];
                if (!nativeId.endsWith(`-${prefix}`)) continue;
                this.map.setPaintProperty(nativeId, key, value as any);
                updated = true;
            }
        }
        return updated;
    }

    async addLayer(layerConfig: AnyLayerConfig, options?: LayerInsertOptions): Promise<boolean> {
        const layerId = layerConfig.id;
        const legendRole = this.resolveLegendRole(layerConfig);
        const insertBeforeLayerId = this.resolveInsertBeforeLayerIdFromOptions(options)
            ?? (legendRole === 'background' ? this.findBackgroundInsertionBeforeLayerId() : undefined);

        if (layerConfig.type === 'allmaps') {
            const success = await this.addAllmapsLayer(layerId, layerConfig.annotation, insertBeforeLayerId);
            if (success) this.logicalLayerLegendRole.set(layerId, legendRole);
            return success;
        }

        if (layerConfig.type === 'style') {
            const spec = normalizeCompositeLayer(layerConfig);
            if (!spec) return false;
            return this.addCompositeLayer(spec, options);
        }

        // Standard layer
        const stdLayer = layerConfig as StandardLayerConfig;
        if (stdLayer.type === 'background') {
            const nativeLayerId = `${layerId}-background`;
            if (!this.map.getLayer(nativeLayerId)) {
                const native: any = { id: nativeLayerId, type: 'background' };
                if (stdLayer.paint) native.paint = stdLayer.paint;
                if (stdLayer.layout) native.layout = stdLayer.layout;
                this.map.addLayer(native, insertBeforeLayerId);
            }
            this.logicalLayerLegendRole.set(layerId, legendRole);
            this.logicalToNative.set(layerId, [nativeLayerId]);
                return true;
        }

        if (!stdLayer.source) return false;
        const rawSourceDef = (layerConfig as any).sources?.[stdLayer.source as string];
        const sourceConfig = rawSourceDef ? normalizeRawSource(stdLayer.source as string, rawSourceDef) : null;
        if (!sourceConfig) return false;

        const nativeSourceId = this.getOrCreateNativeSourceId(sourceConfig.id);
        this.ensureNativeSource(nativeSourceId, sourceConfig);
        if (!this.map.getSource(nativeSourceId)) return false;

        const nativeLayerId = `${layerId}-${sourceConfig.id}-${stdLayer.type}`;
        if (!this.map.getLayer(nativeLayerId)) {
            this.map.addLayer(this.buildNativeLayer(nativeLayerId, stdLayer, nativeSourceId, layerId), insertBeforeLayerId);
        }
        this.logicalLayerLegendRole.set(layerId, legendRole);
        const existing = this.logicalToNative.get(layerId) ?? [];
        this.logicalToNative.set(layerId, Array.from(new Set([...existing, nativeLayerId])));
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

    setLayerOpacity(layerId: string, opacity: number): void {
        const nativeLayerIds = this.logicalToNative.get(layerId) ?? [];
        for (const nativeLayerId of nativeLayerIds) {
            try {
                const nativeLayer = this.map.getLayer(nativeLayerId);
                const properties = nativeLayer ? OPACITY_PAINT_PROPERTIES[nativeLayer.type] : undefined;
                if (!properties) continue;
                for (const property of properties) {
                    this.map.setPaintProperty(nativeLayerId, property, opacity);
                }
            } catch (_) {}
        }
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
                    result.push({ layerId: logicalId, sourceConfig: sourceConfig as WMSSourceConfig });
                }
                break;
            }
        }
        return result;
    }

}
