// src/map/openlayers-services/MapLayerService.ts

import { ILayerService, LayerInsertOptions } from '../IMapInterfaces';
import type { AnyLayerConfig, StandardLayerConfig, CompositeStyleLayerConfig, SourceConfig, WMSSourceConfig, XYZSourceConfig, GeoJSONSourceConfig, VectorSourceConfig, LayerDataConfig, SubLayerSpec } from '../../config/types';
import { MapStateStore } from '../../store/map-state-store';
import OLMap from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorTileLayer from 'ol/layer/VectorTile';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import VectorTileSource from 'ol/source/VectorTile';
import GeoJSON from 'ol/format/GeoJSON';
import MVT from 'ol/format/MVT';
import { Fill, Stroke, Style, Circle as CircleStyle } from 'ol/style';
import ImageWMS from 'ol/source/ImageWMS';
import ImageLayer from 'ol/layer/Image';
import TileWMS from 'ol/source/TileWMS';
import { createXYZ } from 'ol/tilegrid';
import { createFromTemplate } from 'ol/tileurlfunction';
import type { TileCoord } from 'ol/tilecoord';
import type Projection from 'ol/proj/Projection';
import type BaseLayer from 'ol/layer/Base';
import type { WarpedMapLayer } from '@allmaps/openlayers';
import { stylefunction } from 'ol-mapbox-style';

const WARPEDMAP_PROTOCOL = 'warpedmap://';

export class MapLayerService implements ILayerService {
    private map: OLMap;
    private store: MapStateStore;
    private logicalToNative: Map<string, string[]> = new Map();
    private logicalSourceToNative: Map<string, string> = new Map();
    private nativeLayerToSource: Map<string, string> = new Map();
    private nativeLayerInstances: Map<string, BaseLayer> = new Map();
    private spriteResourceCache: Map<string, Promise<{ spriteData: Record<string, unknown>; spriteImageUrl: string } | null>> = new Map();
    // Track WarpedMapLayer instances for cleanup
    private warpedMapLayers: Map<string, WarpedMapLayer> = new Map();
    private catalog: LayerDataConfig | null = null;
    private sourceIdCounter = 0;
    private logicalLayerLegendRole: Map<string, 'background' | 'overlay'> = new Map();

    constructor(map: OLMap, store: MapStateStore) {
        this.map = map;
        this.store = store;
    }

    private updateVisibleLayers(): void {
        this.store.dispatch({ visibleLayers: Array.from(this.logicalToNative.keys()) }, 'MAP');
    }

    private resolveLogicalLayerLegendRole(layerConfig: AnyLayerConfig): 'background' | 'overlay' {
        const metadata = (layerConfig?.metadata && typeof layerConfig.metadata === 'object')
            ? (layerConfig.metadata as Record<string, unknown>)
            : null;

        return metadata?.legendRole === 'background' ? 'background' : 'overlay';
    }

    private resolveSource(sourceId: string): SourceConfig | null {
        return this.catalog?.sources.find((s) => s.id === sourceId) ?? null;
    }

    private normalizeRawSource(logicalId: string, rawDef: unknown): SourceConfig | null {
        if (typeof rawDef !== 'object' || rawDef === null) return null;
        const def = rawDef as Record<string, unknown>;
        if (def.type === 'raster') {
            const tiles = Array.isArray(def.tiles)
                ? def.tiles.filter((t): t is string => typeof t === 'string')
                : (typeof def.url === 'string' ? [def.url] : []);
            if (tiles.length === 0) return null;
            return { id: logicalId, type: 'raster', service: 'xyz', url: tiles } as XYZSourceConfig;
        }
        if (def.type === 'geojson') {
            const data = def.data;
            if (typeof data !== 'string' && typeof data !== 'object') return null;
            return { id: logicalId, type: 'geojson', data: data as string } as GeoJSONSourceConfig;
        }
        if (def.type === 'vector') {
            if (typeof def.url !== 'string') return null;
            return { id: logicalId, type: 'vector', url: def.url } as VectorSourceConfig;
        }
        return null;
    }

    private findLayerIndexByInstance(target: BaseLayer): number {
        const layers = this.map.getLayers().getArray();
        return layers.findIndex((entry) => entry === target);
    }

    private resolveInsertIndexFromOptions(options?: LayerInsertOptions): number | undefined {
        if (options?.beforeLayerId) {
            const beforeNativeLayerIds = this.logicalToNative.get(options.beforeLayerId) ?? [];
            for (const nativeLayerId of beforeNativeLayerIds) {
                const instance = this.nativeLayerInstances.get(nativeLayerId);
                if (!instance) continue;
                const index = this.findLayerIndexByInstance(instance);
                if (index >= 0) {
                    return index;
                }
            }
        }

        if (options?.afterLayerId) {
            const afterNativeLayerIds = this.logicalToNative.get(options.afterLayerId) ?? [];
            for (let idx = afterNativeLayerIds.length - 1; idx >= 0; idx -= 1) {
                const instance = this.nativeLayerInstances.get(afterNativeLayerIds[idx]);
                if (!instance) continue;
                const index = this.findLayerIndexByInstance(instance);
                if (index >= 0) {
                    return index + 1;
                }
            }
        }

        return undefined;
    }

    private collectBackgroundNativeLayerIds(): Set<string> {
        const ids = new Set<string>();
        for (const [logicalLayerId, nativeLayerIds] of this.logicalToNative.entries()) {
            const role = this.logicalLayerLegendRole.get(logicalLayerId) ?? 'overlay';
            if (role !== 'background') {
                continue;
            }
            for (const nativeLayerId of nativeLayerIds) {
                ids.add(nativeLayerId);
            }
        }
        return ids;
    }

    private findBackgroundInsertIndex(): number | undefined {
        const backgroundNativeLayerIds = this.collectBackgroundNativeLayerIds();
        const layers = this.map.getLayers().getArray();
        for (let index = 0; index < layers.length; index += 1) {
            const layerInstance = layers[index];
            let nativeLayerId: string | null = null;
            for (const [candidateId, candidateLayer] of this.nativeLayerInstances.entries()) {
                if (candidateLayer === layerInstance) {
                    nativeLayerId = candidateId;
                    break;
                }
            }

            const isBackgroundLogicalLayer = nativeLayerId ? backgroundNativeLayerIds.has(nativeLayerId) : false;
            if (!isBackgroundLogicalLayer) {
                return index;
            }
        }
        return undefined;
    }

    private resolveInsertIndex(layerConfig: AnyLayerConfig, options?: LayerInsertOptions): number | undefined {
        const explicit = this.resolveInsertIndexFromOptions(options);
        if (explicit !== undefined) {
            return explicit;
        }

        const legendRole = this.resolveLogicalLayerLegendRole(layerConfig);
        if (legendRole === 'background') {
            return this.findBackgroundInsertIndex();
        }

        return undefined;
    }

    private addMapLayerAtIndex(layer: BaseLayer, insertIndex?: number): number | undefined {
        if (typeof insertIndex !== 'number' || !Number.isFinite(insertIndex)) {
            this.map.addLayer(layer);
            return undefined;
        }

        const layers = this.map.getLayers();
        const clamped = Math.max(0, Math.min(insertIndex, layers.getLength()));
        layers.insertAt(clamped, layer);
        return clamped + 1;
    }

    setCatalog(catalog: LayerDataConfig): void {
        this.catalog = catalog;
    }

    private getOrCreateNativeSourceId(sourceConfig: SourceConfig): string {
        if (this.logicalSourceToNative.has(sourceConfig.id)) {
            return this.logicalSourceToNative.get(sourceConfig.id)!;
        }
        const nativeSourceId = `src-${sourceConfig.id}-${this.sourceIdCounter++}`;
        this.logicalSourceToNative.set(sourceConfig.id, nativeSourceId);
        return nativeSourceId;
    }

    /**
     * Check if a source URL uses the warpedmap:// protocol.
     */
    private isWarpedMapSource(sourceConfig: SourceConfig): boolean {
        if (sourceConfig.type === 'raster' && 'url' in sourceConfig) {
            const url = Array.isArray(sourceConfig.url) ? sourceConfig.url[0] : sourceConfig.url;
            return url.startsWith(WARPEDMAP_PROTOCOL);
        }
        return false;
    }

    /**
     * Parse a warpedmap:// URL and return the annotation URL.
     */
    private parseWarpedMapUrl(url: string): string {
        if (url.startsWith(WARPEDMAP_PROTOCOL)) {
            return 'https://' + url.slice(WARPEDMAP_PROTOCOL.length);
        }
        return url;
    }

    /**
     * Create and add a WarpedMapLayer for Allmaps georeferenced images.
     */
    private async addWarpedMapLayer(layerId: string, annotationUrl: string, insertIndex?: number): Promise<boolean> {
        const { WarpedMapLayer } = await import('@allmaps/openlayers');

        // Create a unique layer ID for the WarpedMapLayer
        const warpedLayerId = `warpedmap-${layerId}`;

        // Create and configure the WarpedMapLayer
        const warpedMapLayer = new WarpedMapLayer();

        // Compatibility shim: @allmaps/openlayers uses OL 8.x which lacks methods required by OL 10.x
        const layer = warpedMapLayer as any;
        if (typeof layer.getDeclutter !== 'function') {
            layer.getDeclutter = () => false;
        }
        if (typeof layer.renderDeferred !== 'function') {
            layer.renderDeferred = () => {};
        }

        // Add the layer to the map
        // Type assertion needed due to OL type version differences between project and @allmaps/openlayers
        this.addMapLayerAtIndex(warpedMapLayer as unknown as BaseLayer, insertIndex);

        // Load the georeference annotation
        await warpedMapLayer.addGeoreferenceAnnotationByUrl(annotationUrl);

        // Track the layer
        this.warpedMapLayers.set(layerId, warpedMapLayer);
        this.nativeLayerInstances.set(warpedLayerId, warpedMapLayer as unknown as BaseLayer);
        this.logicalToNative.set(layerId, [warpedLayerId]);
        this.updateVisibleLayers();

        return true;
    }

    async addLayer(layerConfig: AnyLayerConfig, options?: LayerInsertOptions): Promise<boolean> {
        const layerId = layerConfig.id;
        const legendRole = this.resolveLogicalLayerLegendRole(layerConfig);
        let insertIndex = this.resolveInsertIndex(layerConfig, options);

        if (layerConfig.type === 'allmaps') {
            const success = await this.addWarpedMapLayer(layerId, layerConfig.annotation, insertIndex);
            if (success) this.logicalLayerLegendRole.set(layerId, legendRole);
            return success;
        }

        if (layerConfig.type === 'style') {
            return this.addCompositeLayer(layerConfig, legendRole, insertIndex);
        }

        // StandardLayerConfig
        const stdLayer = layerConfig as StandardLayerConfig;
        if (!stdLayer.source) return false;

        const sourceConfig = this.resolveSource(stdLayer.source);
        if (!sourceConfig) return false;

        // Legacy warpedmap:// support
        if (this.isWarpedMapSource(sourceConfig)) {
            const url = Array.isArray((sourceConfig as any).url) ? (sourceConfig as any).url[0] : (sourceConfig as any).url;
            const annotationUrl = this.parseWarpedMapUrl(url);
            const success = await this.addWarpedMapLayer(layerId, annotationUrl, insertIndex);
            if (success) this.logicalLayerLegendRole.set(layerId, legendRole);
            return success;
        }

        const nativeSourceId = this.getOrCreateNativeSourceId(sourceConfig);
        const nativeLayerIds: string[] = [];
        const nativeLayerId = `${layerId}-${sourceConfig.id}-${stdLayer.type}`;

        if (!this.nativeLayerInstances.has(nativeLayerId)) {
            const layer = await this.createLayer(nativeLayerId, stdLayer, sourceConfig);
            if (layer) {
                insertIndex = this.addMapLayerAtIndex(layer, insertIndex);
                this.nativeLayerInstances.set(nativeLayerId, layer);
            }
        }
        nativeLayerIds.push(nativeLayerId);
        this.nativeLayerToSource.set(nativeLayerId, nativeSourceId);

        this.logicalToNative.set(layerId, this.mergeNativeLayerIds(layerId, nativeLayerIds));
        this.logicalLayerLegendRole.set(layerId, legendRole);
        this.updateVisibleLayers();
        return nativeLayerIds.length > 0;
    }

    private async addCompositeLayer(
        layerConfig: CompositeStyleLayerConfig,
        legendRole: 'background' | 'overlay',
        insertIndex: number | undefined,
    ): Promise<boolean> {
        const layerId = layerConfig.id;
        const localSources = layerConfig.sources ?? {};
        const subLayers = layerConfig.layers ?? [];

        // Build local source map: key → SourceConfig
        const localSourceMap = new Map<string, SourceConfig>();
        for (const [key, rawDef] of Object.entries(localSources)) {
            const logicalId = `${layerId}:${key}`;
            const src = this.normalizeRawSource(logicalId, rawDef);
            if (src) localSourceMap.set(key, src);
        }

        const nativeLayerIds: string[] = [];

        // Check for style-backed vector tile (needs stylefunction)
        const vectorSources = Array.from(localSourceMap.values()).filter(s => s.type === 'vector');
        if (vectorSources.length > 0 && typeof layerConfig.metadata?.styleUrl === 'string') {
            for (const vectorSource of vectorSources) {
                if (!this.isStyleBackedVectorSource(layerConfig, vectorSource)) continue;
                const nativeSourceId = this.getOrCreateNativeSourceId(vectorSource);
                const nativeLayerId = `${layerId}-${vectorSource.id}-vector-style`;
                if (!this.nativeLayerInstances.has(nativeLayerId)) {
                    const layer = await this.createStyleBackedVectorTileLayer(nativeLayerId, layerConfig, vectorSource as SourceConfig & { type: 'vector' });
                    if (!layer) return false;
                    insertIndex = this.addMapLayerAtIndex(layer, insertIndex);
                    this.nativeLayerInstances.set(nativeLayerId, layer);
                }
                nativeLayerIds.push(nativeLayerId);
                this.nativeLayerToSource.set(nativeLayerId, nativeSourceId);
            }
        } else {
            // Add sub-layers individually
            for (const subLayer of subLayers) {
                const sourceKey = subLayer.source;
                if (!sourceKey) continue;

                // Resolve source: local first, then global
                let sourceConfig: SourceConfig | null = localSourceMap.get(sourceKey) ?? null;
                if (!sourceConfig) sourceConfig = this.resolveSource(sourceKey);
                if (!sourceConfig) continue;

                const nativeSourceId = this.getOrCreateNativeSourceId(sourceConfig);
                const nativeLayerId = subLayer.id ? `${layerId}-${subLayer.id}` : `${layerId}-${sourceKey}-${subLayer.type}`;

                if (!this.nativeLayerInstances.has(nativeLayerId)) {
                    const layer = await this.createLayer(nativeLayerId, subLayer, sourceConfig);
                    if (layer) {
                        insertIndex = this.addMapLayerAtIndex(layer, insertIndex);
                        this.nativeLayerInstances.set(nativeLayerId, layer);
                    }
                }
                nativeLayerIds.push(nativeLayerId);
                this.nativeLayerToSource.set(nativeLayerId, nativeSourceId);
            }
        }

        this.logicalToNative.set(layerId, this.mergeNativeLayerIds(layerId, nativeLayerIds));
        this.logicalLayerLegendRole.set(layerId, legendRole);
        this.updateVisibleLayers();
        return nativeLayerIds.length > 0;
    }

    private mergeNativeLayerIds(layerId: string, nativeLayerIds: string[]): string[] {
        const existing = this.logicalToNative.get(layerId) ?? [];
        return Array.from(new Set([...existing, ...nativeLayerIds]));
    }

    private isStyleBackedVectorSource(layerConfig: AnyLayerConfig, sourceConfig: SourceConfig): sourceConfig is SourceConfig & { type: 'vector' } {
        const metadata = layerConfig?.metadata;
        return sourceConfig.type === 'vector'
            && typeof (metadata as any)?.styleUrl === 'string'
            && layerConfig.type === 'style'
            && Array.isArray((layerConfig as CompositeStyleLayerConfig).layers)
            && ((layerConfig as CompositeStyleLayerConfig).layers!.length > 0);
    }

    private async createStyleBackedVectorTileLayer(
        layerId: string,
        layerConfig: AnyLayerConfig,
        sourceConfig: SourceConfig & { type: 'vector' }
    ): Promise<BaseLayer | null> {
        const resolvedSource = await this.resolveVectorTileSourceInfo(sourceConfig);
        if (!resolvedSource) {
            return null;
        }

        const { urlTemplate, minZoom: vectorMinZoom, maxZoom: vectorMaxZoom } = resolvedSource;

        const source = new VectorTileSource({
            format: new MVT(),
            attributions: sourceConfig.attribution,
            ...(vectorMinZoom !== undefined ? { minZoom: vectorMinZoom } : {}),
            ...(vectorMaxZoom !== undefined ? { maxZoom: vectorMaxZoom } : {}),
            ...(vectorMaxZoom !== undefined
                ? { tileUrlFunction: this.createClampedVectorTileUrlFunction(urlTemplate, vectorMaxZoom) }
                : { url: urlTemplate }),
        });

        const layer = new VectorTileLayer({
            source,
            declutter: true,
        });

        const glStyle = this.buildStyleBackedGlStyle(layerConfig, sourceConfig);
        const spriteResources = await this.resolveStyleSpriteResources(((layerConfig as any)?.metadata ?? {}) as Record<string, unknown>);
        const subLayers = layerConfig.type === 'style' ? ((layerConfig as CompositeStyleLayerConfig).layers ?? []) : [];
        const mapboxLayerIds = subLayers
            .map((entry) => typeof entry.id === 'string' ? entry.id : null)
            .filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);

        stylefunction(
            layer,
            glStyle,
            mapboxLayerIds.length > 0 ? mapboxLayerIds : sourceConfig.id,
            undefined,
            spriteResources?.spriteData,
            spriteResources?.spriteImageUrl,
        );

        (layer as any).__layerId = layerId;
        return layer;
    }

    private buildStyleBackedGlStyle(layerConfig: AnyLayerConfig, sourceConfig: SourceConfig & { type: 'vector' }): Record<string, unknown> {
        const metadata = ((layerConfig as any)?.metadata ?? {}) as Record<string, unknown>;
        const styleLayers: SubLayerSpec[] = layerConfig.type === 'style' ? ((layerConfig as CompositeStyleLayerConfig).layers ?? []) : [];
        const sourceDefinition: Record<string, unknown> = {
            type: 'vector',
        };

        if (typeof sourceConfig.url === 'string' && sourceConfig.url.length > 0) {
            sourceDefinition.url = sourceConfig.url;
        }

        const sourceTiles = Array.isArray((sourceConfig as any).tiles)
            ? (sourceConfig as any).tiles.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.length > 0)
            : [];
        if (sourceTiles.length > 0) {
            sourceDefinition.tiles = sourceTiles;
        }

        if (typeof (sourceConfig as any).minzoom === 'number') {
            sourceDefinition.minzoom = (sourceConfig as any).minzoom;
        }
        if (typeof (sourceConfig as any).attribution === 'string') {
            sourceDefinition.attribution = (sourceConfig as any).attribution;
        }

        return {
            version: 8,
            ...(typeof metadata.styleSpriteUrl === 'string' ? { sprite: metadata.styleSpriteUrl } : {}),
            ...(typeof metadata.styleGlyphsUrl === 'string' ? { glyphs: metadata.styleGlyphsUrl } : {}),
            sources: {
                [sourceConfig.id]: sourceDefinition,
            },
            layers: styleLayers.map((styleLayer) => ({
                id: styleLayer.id,
                type: styleLayer.type,
                source: sourceConfig.id,
                ...(typeof styleLayer['source-layer'] === 'string' ? { 'source-layer': styleLayer['source-layer'] } : {}),
                ...(typeof styleLayer.minzoom === 'number' ? { minzoom: styleLayer.minzoom } : {}),
                ...(typeof styleLayer.maxzoom === 'number' ? { maxzoom: styleLayer.maxzoom } : {}),
                ...(styleLayer.filter ? { filter: styleLayer.filter } : {}),
                ...(styleLayer.layout ? { layout: styleLayer.layout } : {}),
                ...(styleLayer.paint ? { paint: styleLayer.paint } : {}),
            })),
        };
    }

    private async resolveStyleSpriteResources(metadata: Record<string, unknown>): Promise<{
        spriteData: Record<string, unknown>;
        spriteImageUrl: string;
    } | null> {
        const styleSpriteUrl = typeof metadata.styleSpriteUrl === 'string' ? metadata.styleSpriteUrl : null;
        if (!styleSpriteUrl) {
            return null;
        }

        if (!this.spriteResourceCache.has(styleSpriteUrl)) {
            this.spriteResourceCache.set(styleSpriteUrl, (async () => {
                try {
                    const spriteJsonUrl = this.buildSpriteAssetUrl(styleSpriteUrl, '.json');
                    const response = await fetch(spriteJsonUrl);
                    if (!response.ok) {
                        return null;
                    }

                    const spriteJson = await response.json();
                    if (typeof spriteJson !== 'object' || spriteJson === null || Array.isArray(spriteJson)) {
                        return null;
                    }

                    return {
                        spriteData: spriteJson as Record<string, unknown>,
                        spriteImageUrl: this.buildSpriteAssetUrl(styleSpriteUrl, '.png'),
                    };
                } catch {
                    return null;
                }
            })());
        }

        return this.spriteResourceCache.get(styleSpriteUrl) ?? null;
    }

    private buildSpriteAssetUrl(baseUrl: string, extension: '.json' | '.png'): string {
        try {
            const url = new URL(baseUrl);
            if (!url.pathname.endsWith(extension)) {
                url.pathname = `${url.pathname}${extension}`;
            }
            return url.toString();
        } catch {
            return baseUrl.endsWith(extension) ? baseUrl : `${baseUrl}${extension}`;
        }
    }

    private async createLayer(
        layerId: string,
        style: SubLayerSpec,
        sourceConfig: SourceConfig
    ): Promise<BaseLayer | null> {
        // Raster layers
        if (style.type === 'raster' && sourceConfig.type === 'raster') {
            if (sourceConfig.service === 'xyz') {
                return this.createXYZLayer(layerId, sourceConfig, style);
            } else if (sourceConfig.service === 'wms') {
                return this.createWMSLayer(layerId, sourceConfig as WMSSourceConfig, style);
            }
        }
        // Vector/GeoJSON layers
        else if (['fill', 'line', 'circle'].includes(style.type) && sourceConfig.type === 'geojson') {
            return this.createGeoJSONLayer(layerId, sourceConfig, style);
        } else if (['fill', 'line', 'circle', 'symbol'].includes(style.type) && sourceConfig.type === 'vector') {
            return this.createVectorTileLayer(layerId, sourceConfig, style);
        }
        return null;
    }

    private async resolveVectorTileUrl(sourceConfig: SourceConfig & { type: 'vector' }): Promise<string | null> {
        const resolved = await this.resolveVectorTileSourceInfo(sourceConfig);
        return resolved?.urlTemplate ?? null;
    }

    private async resolveVectorTileSourceInfo(sourceConfig: SourceConfig & { type: 'vector' }): Promise<{
        urlTemplate: string;
        minZoom?: number;
        maxZoom?: number;
    } | null> {
        const configuredMinZoom = typeof (sourceConfig as any).minzoom === 'number' ? (sourceConfig as any).minzoom : undefined;
        const configuredMaxZoom = typeof (sourceConfig as any).maxzoom === 'number' ? (sourceConfig as any).maxzoom : undefined;
        const declaredTiles = Array.isArray((sourceConfig as any).tiles)
            ? (sourceConfig as any).tiles.filter((entry: unknown): entry is string => typeof entry === 'string')
            : [];
        if (declaredTiles.length > 0) {
            return {
                urlTemplate: declaredTiles[0],
                ...(configuredMinZoom !== undefined ? { minZoom: configuredMinZoom } : {}),
                ...(configuredMaxZoom !== undefined ? { maxZoom: configuredMaxZoom } : {}),
            };
        }

        const rawUrl = sourceConfig.url;
        if (typeof rawUrl !== 'string' || rawUrl.length === 0) {
            return null;
        }

        if (rawUrl.includes('{z}') && rawUrl.includes('{x}') && rawUrl.includes('{y}')) {
            return {
                urlTemplate: rawUrl,
                ...(configuredMinZoom !== undefined ? { minZoom: configuredMinZoom } : {}),
                ...(configuredMaxZoom !== undefined ? { maxZoom: configuredMaxZoom } : {}),
            };
        }

        try {
            const response = await fetch(rawUrl);
            if (!response.ok) {
                return null;
            }
            const tileJson = await response.json();
            if (Array.isArray(tileJson?.tiles)) {
                const firstTemplate = tileJson.tiles.find((entry: unknown) => typeof entry === 'string');
                if (typeof firstTemplate === 'string') {
                    return {
                        urlTemplate: firstTemplate,
                        ...(configuredMinZoom !== undefined
                            ? { minZoom: configuredMinZoom }
                            : typeof tileJson?.minzoom === 'number'
                                ? { minZoom: tileJson.minzoom }
                                : {}),
                        ...(configuredMaxZoom !== undefined
                            ? { maxZoom: configuredMaxZoom }
                            : typeof tileJson?.maxzoom === 'number'
                                ? { maxZoom: tileJson.maxzoom }
                                : {}),
                    };
                }
            }
        } catch {
            return null;
        }

        return null;
    }

    private createClampedVectorTileUrlFunction(urlTemplate: string, maxZoom: number) {
        const baseUrlFunction = createFromTemplate(urlTemplate, null);

        return (tileCoord: TileCoord, pixelRatio: number, projection: Projection) => {
            if (!tileCoord || tileCoord.length < 3) {
                return undefined;
            }

            const [z, x, y] = tileCoord;
            if (!Number.isInteger(z) || !Number.isInteger(x) || !Number.isInteger(y) || z <= maxZoom) {
                return baseUrlFunction(tileCoord, pixelRatio, projection);
            }

            const scale = 2 ** (z - maxZoom);
            const parentTileCoord: TileCoord = [
                maxZoom,
                Math.floor(x / scale),
                Math.floor(y / scale),
            ];

            return baseUrlFunction(parentTileCoord, pixelRatio, projection);
        };
    }

    private mapFeatureGeometryType(feature: any): 'Point' | 'LineString' | 'Polygon' | null {
        const geometryType = feature?.getGeometry?.()?.getType?.();
        if (geometryType === 'Point' || geometryType === 'MultiPoint') return 'Point';
        if (geometryType === 'LineString' || geometryType === 'MultiLineString') return 'LineString';
        if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') return 'Polygon';
        return null;
    }

    private resolveFilterOperand(feature: any, operand: unknown): unknown {
        if (Array.isArray(operand) && operand[0] === 'geometry-type') {
            return this.mapFeatureGeometryType(feature);
        }

        if (Array.isArray(operand) && operand[0] === 'get' && typeof operand[1] === 'string') {
            return feature?.get?.(operand[1]);
        }

        return operand;
    }

    private matchesStyleFilter(feature: any, filter: unknown): boolean {
        if (!Array.isArray(filter) || filter.length < 1) {
            return true;
        }

        const [operator, ...rest] = filter;

        if (operator === 'all') {
            return rest.every((clause) => this.matchesStyleFilter(feature, clause));
        }

        if ((operator === '==' || operator === '!=') && rest.length >= 2) {
            const lhs = rest[0];
            const rhs = rest[1];
            const matched = this.resolveFilterOperand(feature, lhs) === rhs;
            return operator === '==' ? matched : !matched;
        }

        return true;
    }

    private getFeatureProperty(feature: any, name: string): unknown {
        return feature?.get?.(name);
    }

    private evaluateExpression(feature: any, expression: unknown): unknown {
        if (!Array.isArray(expression)) {
            return expression;
        }

        const [operator, ...args] = expression;
        if (operator === 'get' && typeof args[0] === 'string') {
            return this.getFeatureProperty(feature, args[0]);
        }
        if (operator === 'to-number') {
            const value = this.evaluateExpression(feature, args[0]);
            const numberValue = Number(value);
            return Number.isFinite(numberValue) ? numberValue : null;
        }
        if (operator === 'coalesce') {
            for (const arg of args) {
                const value = this.evaluateExpression(feature, arg);
                if (value !== null && value !== undefined && !(typeof value === 'number' && !Number.isFinite(value))) {
                    return value;
                }
            }
            return null;
        }
        if (operator === 'interpolate') {
            return this.evaluateInterpolateExpression(feature, expression);
        }

        return null;
    }

    private evaluateInterpolateExpression(feature: any, expression: unknown[]): unknown {
        if (expression.length < 6) return null;
        const [, interpolation, inputExpression, ...stops] = expression;
        const input = Number(this.evaluateExpression(feature, inputExpression));
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
                const c1 = this.parseHexColor(prev.value);
                const c2 = this.parseHexColor(next.value);
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

    private parseHexColor(value: string): { r: number; g: number; b: number } | null {
        const hex = value.trim();
        if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
        return {
            r: parseInt(hex.slice(1, 3), 16),
            g: parseInt(hex.slice(3, 5), 16),
            b: parseInt(hex.slice(5, 7), 16),
        };
    }

    private getPaintColorValue(feature: any, value: unknown, fallback: string): string {
        const resolved = this.evaluateExpression(feature, value);
        return typeof resolved === 'string' && resolved.length > 0 ? resolved : fallback;
    }

    private getPaintNumberValue(feature: any, value: unknown, fallback: number): number {
        const resolved = this.evaluateExpression(feature, value);
        return typeof resolved === 'number' && Number.isFinite(resolved) ? resolved : fallback;
    }

    private getLiteralNumberValue(value: unknown, fallback: number): number {
        return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
    }

    private createVectorTileLayer(
        layerId: string,
        sourceConfig: SourceConfig & { type: 'vector' },
        style: SubLayerSpec
    ): Promise<BaseLayer | null> {
        return this.resolveVectorTileSourceInfo(sourceConfig).then((resolvedSource) => {
            if (!resolvedSource) {
                return null;
            }

            const { urlTemplate, minZoom: vectorMinZoom, maxZoom: vectorMaxZoom } = resolvedSource;
            const sourceLayerName = style['source-layer'];
            const source = new VectorTileSource({
                format: new MVT(),
                attributions: sourceConfig.attribution,
                ...(vectorMinZoom !== undefined ? { minZoom: vectorMinZoom } : {}),
                ...(vectorMaxZoom !== undefined ? { maxZoom: vectorMaxZoom } : {}),
                ...(vectorMaxZoom !== undefined
                    ? { tileUrlFunction: this.createClampedVectorTileUrlFunction(urlTemplate, vectorMaxZoom) }
                    : { url: urlTemplate }),
            });

            const layer = new VectorTileLayer({
                source,
                minZoom: style.minzoom,
                maxZoom: style.maxzoom,
                style: (feature: any) => {
                    if (sourceLayerName) {
                        const featureSourceLayer = feature?.get?.('layer') ?? feature?.get?.('source-layer') ?? feature?.get?.('sourceLayer');
                        if (typeof featureSourceLayer === 'string' && featureSourceLayer !== sourceLayerName) {
                            return undefined;
                        }
                    }

                    const geometryType = this.mapFeatureGeometryType(feature);
                    if (style.type === 'fill' && geometryType !== 'Polygon') return undefined;
                    if (style.type === 'line' && geometryType !== 'LineString') return undefined;
                    if (style.type === 'circle' && geometryType !== 'Point') return undefined;

                    if (!this.matchesStyleFilter(feature, style.filter)) {
                        return undefined;
                    }

                    return this.createStyle(style, feature);
                }
            });

            (layer as any).__layerId = layerId;
            return layer;
        });
    }

    private createXYZLayer(
        layerId: string,
        sourceConfig: SourceConfig & { type: 'raster'; service: 'xyz' },
        style: SubLayerSpec
    ): TileLayer<XYZ> {
        const urls = Array.isArray(sourceConfig.url) ? sourceConfig.url : [sourceConfig.url];

        const source = new XYZ({
            urls,
            tileSize: sourceConfig.tileSize,
            attributions: sourceConfig.attribution,
            minZoom: sourceConfig.minzoom,
            maxZoom: sourceConfig.maxzoom
        });

        const layer = new TileLayer({
            source,
            minZoom: style.minzoom,
            maxZoom: style.maxzoom,
            opacity: this.getLiteralNumberValue((style.paint as any)?.['raster-opacity'], 1)
        });

        (layer as any).__layerId = layerId;
        return layer;
    }

    private createWMSLayer(
        layerId: string,
        sourceConfig: WMSSourceConfig,
        style: SubLayerSpec
    ): BaseLayer {
        const fullUrl = Array.isArray(sourceConfig.url) ? sourceConfig.url[0] : sourceConfig.url;

        // Parse URL and extract all existing parameters
        const { baseUrl, params } = this.parseUrlParams(fullUrl);

        // Add additional WMS parameters only if not already present (case-insensitive check)
        const paramsLower = new Set(Object.keys(params).map(k => k.toLowerCase()));

        if (!paramsLower.has('format')) {
            params['FORMAT'] = sourceConfig.format || 'image/png';
        }
        if (!paramsLower.has('transparent')) {
            params['TRANSPARENT'] = sourceConfig.transparent !== false ? 'true' : 'false';
        }
        if (sourceConfig.layers && !paramsLower.has('layers')) {
            params['LAYERS'] = sourceConfig.layers;
        }
        if (sourceConfig.styles && !paramsLower.has('styles')) {
            params['STYLES'] = sourceConfig.styles;
        }
        if (sourceConfig.version && !paramsLower.has('version')) {
            params['VERSION'] = sourceConfig.version;
        }

        let layer: BaseLayer;

        // Use TileWMS if tileSize is defined (for browser caching), otherwise ImageWMS
        if (sourceConfig.tileSize) {
            const tileGrid = createXYZ({
                tileSize: sourceConfig.tileSize,
                minZoom: sourceConfig.minzoom,
                maxZoom: sourceConfig.maxzoom
            });

            const source = new TileWMS({
                url: baseUrl,
                params,
                attributions: sourceConfig.attribution,
                tileGrid
            });

            layer = new TileLayer({
                source,
                minZoom: style.minzoom,
                maxZoom: style.maxzoom,
                opacity: this.getLiteralNumberValue((style.paint as any)?.['raster-opacity'], 1)
            });
        } else {
            const source = new ImageWMS({
                url: baseUrl,
                params,
                attributions: sourceConfig.attribution,
                ratio: 1
            });

            layer = new ImageLayer({
                source,
                minZoom: style.minzoom,
                maxZoom: style.maxzoom,
                opacity: this.getLiteralNumberValue((style.paint as any)?.['raster-opacity'], 1)
            });
        }

        (layer as any).__layerId = layerId;
        return layer;
    }

    /**
     * Parse URL into base URL and parameters object.
     * All original parameters are preserved.
     */
    private parseUrlParams(url: string): { baseUrl: string; params: Record<string, string> } {
        const questionIndex = url.indexOf('?');
        if (questionIndex === -1) {
            return { baseUrl: url, params: {} };
        }

        const baseUrl = url.substring(0, questionIndex);
        const queryString = url.substring(questionIndex + 1);
        const params: Record<string, string> = {};

        for (const param of queryString.split('&')) {
            const eqIndex = param.indexOf('=');
            if (eqIndex !== -1) {
                const key = param.substring(0, eqIndex);
                const value = decodeURIComponent(param.substring(eqIndex + 1));
                params[key] = value;
            } else if (param) {
                params[param] = '';
            }
        }

        return { baseUrl, params };
    }

    private createGeoJSONLayer(
        layerId: string,
        sourceConfig: SourceConfig & { type: 'geojson' },
        style: SubLayerSpec
    ): VectorLayer<VectorSource> {
        const source = new VectorSource({
            features: typeof sourceConfig.data === 'string'
                ? undefined
                : new GeoJSON().readFeatures(sourceConfig.data, {
                    featureProjection: 'EPSG:3857'
                }),
            url: typeof sourceConfig.data === 'string' ? sourceConfig.data : undefined,
            format: typeof sourceConfig.data === 'string' ? new GeoJSON() : undefined,
            attributions: sourceConfig.attribution
        });

        const layer = new VectorLayer({
            source,
            style: (feature: any) => {
                if (!this.matchesStyleFilter(feature, style.filter)) {
                    return undefined;
                }
                return this.createStyle(style, feature);
            },
            minZoom: style.minzoom,
            maxZoom: style.maxzoom
        });

        (layer as any).__layerId = layerId;
        return layer;
    }

    private createStyle(style: SubLayerSpec, feature?: any): Style {
        const paint = style.paint || {};

        switch (style.type) {
            case 'fill':
                return new Style({
                    fill: new Fill({
                        color: this.toRgba(
                            this.getPaintColorValue(feature, (paint as any)['fill-color'], '#000000'),
                            this.getPaintNumberValue(feature, (paint as any)['fill-opacity'], 1)
                        )
                    }),
                    stroke: new Stroke({
                        color: this.toRgba(
                            this.getPaintColorValue(feature, (paint as any)['fill-outline-color'], this.getPaintColorValue(feature, (paint as any)['fill-color'], '#000000')),
                            this.getPaintNumberValue(feature, (paint as any)['fill-opacity'], 1)
                        ),
                        width: 1
                    })
                });

            case 'line':
                return new Style({
                    stroke: new Stroke({
                        color: this.toRgba(
                            this.getPaintColorValue(feature, (paint as any)['line-color'], '#000000'),
                            this.getPaintNumberValue(feature, (paint as any)['line-opacity'], 1)
                        ),
                        width: this.getPaintNumberValue(feature, (paint as any)['line-width'], 1)
                    })
                });

            case 'circle':
                return new Style({
                    image: new CircleStyle({
                        radius: this.getPaintNumberValue(feature, (paint as any)['circle-radius'], 5),
                        fill: new Fill({
                            color: this.toRgba(
                                this.getPaintColorValue(feature, (paint as any)['circle-color'], '#3399CC'),
                                this.getPaintNumberValue(feature, (paint as any)['circle-opacity'], 1)
                            )
                        }),
                        stroke: new Stroke({
                            color: this.toRgba(
                                this.getPaintColorValue(feature, (paint as any)['circle-stroke-color'], '#ffffff'),
                                this.getPaintNumberValue(feature, (paint as any)['circle-stroke-opacity'], 1)
                            ),
                            width: this.getPaintNumberValue(feature, (paint as any)['circle-stroke-width'], 1)
                        })
                    })
                });

            default:
                return new Style();
        }
    }

    private toRgba(color: string, opacity: number): string {
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return color;
    }

    removeLayer(layerId: string): void {
        // Check if this is a WarpedMapLayer
        if (this.warpedMapLayers.has(layerId)) {
            const warpedMapLayer = this.warpedMapLayers.get(layerId)!;
            // Type assertion needed due to OL type version differences
            this.map.removeLayer(warpedMapLayer as unknown as BaseLayer);

            const nativeIds = this.logicalToNative.get(layerId) || [];
            for (const id of nativeIds) {
                this.nativeLayerInstances.delete(id);
            }
            this.warpedMapLayers.delete(layerId);
            this.logicalToNative.delete(layerId);
            this.logicalLayerLegendRole.delete(layerId);
            this.updateVisibleLayers();
            return;
        }

        const nativeIds = this.logicalToNative.get(layerId) || [];
        const nativeSourceIds = new Set<string>();

        for (const id of nativeIds) {
            const sourceId = this.nativeLayerToSource.get(id);
            if (sourceId) {
                nativeSourceIds.add(sourceId);
            }

            const layer = this.nativeLayerInstances.get(id);
            if (layer) {
                this.map.removeLayer(layer);
                this.nativeLayerInstances.delete(id);
            }
            this.nativeLayerToSource.delete(id);
        }

        this.logicalToNative.delete(layerId);
    this.logicalLayerLegendRole.delete(layerId);

        for (const sourceId of nativeSourceIds) {
            let stillUsed = false;
            for (const usedSourceId of this.nativeLayerToSource.values()) {
                if (usedSourceId === sourceId) {
                    stillUsed = true;
                    break;
                }
            }
            if (!stillUsed) {
                for (const [logicalId, nativeId] of this.logicalSourceToNative.entries()) {
                    if (nativeId === sourceId) {
                        this.logicalSourceToNative.delete(logicalId);
                        break;
                    }
                }
            }
        }

        this.updateVisibleLayers();
    }

    getVisibleLayers(): string[] {
        return Array.from(this.logicalToNative.keys());
    }

    isLayerVisible(layerId: string): boolean {
        return this.logicalToNative.has(layerId);
    }
}
