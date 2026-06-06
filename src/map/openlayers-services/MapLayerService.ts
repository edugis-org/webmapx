// src/map/openlayers-services/MapLayerService.ts

import { ILayerService, LayerInsertOptions } from '../IMapInterfaces';
import { normalizeRawSource } from '../layer-source-utils';
import type { AnyLayerConfig, StandardLayerConfig, CompositeStyleLayerConfig, SourceConfig, WMSSourceConfig, SubLayerSpec } from '../../config/types';
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
    private sourceIdCounter = 0;

    constructor(map: OLMap, store: MapStateStore) {
        this.map = map;
        this.store = store;
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
                if (index >= 0) return index;
            }
            // Fallback: inline layer — OL layer has __mapLayerId set by CoreService
            const mapLayers = this.map.getLayers().getArray();
            const idx = mapLayers.findIndex((l: any) => l.__mapLayerId === options.beforeLayerId);
            if (idx >= 0) return idx;
        }

        if (options?.afterLayerId) {
            const afterNativeLayerIds = this.logicalToNative.get(options.afterLayerId) ?? [];
            for (let idx = afterNativeLayerIds.length - 1; idx >= 0; idx -= 1) {
                const instance = this.nativeLayerInstances.get(afterNativeLayerIds[idx]);
                if (!instance) continue;
                const index = this.findLayerIndexByInstance(instance);
                if (index >= 0) return index + 1;
            }
            // Fallback: inline layer
            const mapLayers = this.map.getLayers().getArray();
            const idx = mapLayers.findIndex((l: any) => l.__mapLayerId === options.afterLayerId);
            if (idx >= 0) return idx + 1;
        }

        return undefined;
    }

    private resolveInsertIndex(options?: LayerInsertOptions): number | undefined {
        const explicit = this.resolveInsertIndexFromOptions(options);
        if (explicit !== undefined) return explicit;

        // Fallback: findLayerIndexByInstance may miss OL-version-incompatible layers (e.g. WarpedMapLayer).
        // Derive index from logicalToNative insertion order (generic layer controls this order).
        const anchorId = options?.beforeLayerId ?? options?.afterLayerId;
        if (!anchorId) return undefined;
        const isBefore = options?.beforeLayerId !== undefined;
        let count = 0;
        for (const [logicalId, nativeIds] of this.logicalToNative.entries()) {
            if (logicalId === anchorId) return isBefore ? count : count + nativeIds.length;
            for (const id of nativeIds) {
                if (this.nativeLayerInstances.has(id)) count++;
            }
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

        return true;
    }

    async addLayer(layerConfig: AnyLayerConfig, options?: LayerInsertOptions): Promise<boolean> {
        const layerId = layerConfig.id;
        let insertIndex = this.resolveInsertIndex(options);

        if (layerConfig.type === 'allmaps') {
            return this.addWarpedMapLayer(layerId, layerConfig.annotation, insertIndex);
        }

        if (layerConfig.type === 'style') {
            return this.addCompositeLayer(layerConfig, insertIndex);
        }

        // StandardLayerConfig
        const stdLayer = layerConfig as StandardLayerConfig;
        if (!stdLayer.source) return false;

        const rawSourceDef = (layerConfig as any).sources?.[stdLayer.source as string];
        const sourceConfig = rawSourceDef ? normalizeRawSource(stdLayer.source as string, rawSourceDef) : null;
        if (!sourceConfig) return false;

        // Legacy warpedmap:// support
        if (this.isWarpedMapSource(sourceConfig)) {
            const url = Array.isArray((sourceConfig as any).url) ? (sourceConfig as any).url[0] : (sourceConfig as any).url;
            const annotationUrl = this.parseWarpedMapUrl(url);
            return this.addWarpedMapLayer(layerId, annotationUrl, insertIndex);
        }

        const nativeSourceId = this.getOrCreateNativeSourceId(sourceConfig);
        const nativeLayerIds: string[] = [];
        const nativeLayerId = `${layerId}-${sourceConfig.id}-${stdLayer.type}`;

        if (!this.nativeLayerInstances.has(nativeLayerId)) {
            const layer = await this.createLayer(nativeLayerId, stdLayer, sourceConfig);
            if (layer) {
                (layer as any).__mapLayerId = layerId;
                insertIndex = this.addMapLayerAtIndex(layer, insertIndex);
                this.nativeLayerInstances.set(nativeLayerId, layer);
            }
        }
        nativeLayerIds.push(nativeLayerId);
        this.nativeLayerToSource.set(nativeLayerId, nativeSourceId);

        this.logicalToNative.set(layerId, this.mergeNativeLayerIds(layerId, nativeLayerIds));
        return nativeLayerIds.length > 0;
    }

    private async addCompositeLayer(
        layerConfig: CompositeStyleLayerConfig,
        insertIndex: number | undefined,
    ): Promise<boolean> {
        const layerId = layerConfig.id;
        const localSources = layerConfig.sources ?? {};
        const subLayers = layerConfig.layers ?? [];

        // Build local source map: key → SourceConfig
        const localSourceMap = new Map<string, SourceConfig>();
        for (const [key, rawDef] of Object.entries(localSources)) {
            const logicalId = `${layerId}:${key}`;
            const src = normalizeRawSource(logicalId, rawDef);
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
                    (layer as any).__mapLayerId = layerId;
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

                // Resolve source: local only (sources are inlined into the layer spec)
                const sourceConfig: SourceConfig | null = localSourceMap.get(sourceKey) ?? null;
                if (!sourceConfig) continue;

                const nativeSourceId = this.getOrCreateNativeSourceId(sourceConfig);
                const nativeLayerId = subLayer.id ? `${layerId}-${subLayer.id}` : `${layerId}-${sourceKey}-${subLayer.type}`;

                if (!this.nativeLayerInstances.has(nativeLayerId)) {
                    const layer = await this.createLayer(nativeLayerId, subLayer, sourceConfig);
                    if (layer) {
                        (layer as any).__mapLayerId = layerId;
                        insertIndex = this.addMapLayerAtIndex(layer, insertIndex);
                        this.nativeLayerInstances.set(nativeLayerId, layer);
                    }
                }
                nativeLayerIds.push(nativeLayerId);
                this.nativeLayerToSource.set(nativeLayerId, nativeSourceId);
            }
        }

        this.logicalToNative.set(layerId, this.mergeNativeLayerIds(layerId, nativeLayerIds));
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
            });

            const glSourceId = layerId;
            const glLayerId = style.id ?? layerId;
            const glStyle = {
                version: 8,
                sources: {
                    [glSourceId]: { type: 'vector', tiles: [urlTemplate] }
                },
                layers: [{
                    ...style,
                    id: glLayerId,
                    source: glSourceId,
                }]
            };

            stylefunction(layer as any, glStyle, [glLayerId]);

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
            minZoom: style.minzoom,
            maxZoom: style.maxzoom
        });

        const glSourceId = layerId;
        const glLayerId = style.id ?? layerId;
        const glStyle = {
            version: 8,
            sources: {
                [glSourceId]: {
                    type: 'geojson',
                    data: sourceConfig.data ?? { type: 'FeatureCollection', features: [] }
                }
            },
            layers: [{
                ...style,
                id: glLayerId,
                source: glSourceId,
            }]
        };

        stylefunction(layer as any, glStyle, [glLayerId]);

        (layer as any).__layerId = layerId;
        return layer;
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

    }

    getVisibleLayers(): string[] {
        return Array.from(this.logicalToNative.keys());
    }

    isLayerVisible(layerId: string): boolean {
        return this.logicalToNative.has(layerId);
    }

    getSourceData(sourceId: string): GeoJSON.FeatureCollection | string | null {
        const nativeSourceId = this.logicalSourceToNative.get(sourceId);
        if (!nativeSourceId) return null;
        const format = new GeoJSON();
        for (const [nativeLayerId, usedSourceId] of this.nativeLayerToSource.entries()) {
            if (usedSourceId !== nativeSourceId) continue;
            const layer = this.nativeLayerInstances.get(nativeLayerId) as VectorLayer<VectorSource> | undefined;
            const source = layer?.getSource?.();
            if (!source) continue;
            const features = source.getFeatures().map((feature: any) =>
                JSON.parse(format.writeFeature(feature, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' }))
            );
            if (features.length === 0 && typeof (source as any).getUrl === 'function') {
                const url = (source as any).getUrl();
                if (typeof url === 'string') return url;
            }
            return { type: 'FeatureCollection', features };
        }
        return null;
    }

    setSourceData(sourceId: string, data: GeoJSON.FeatureCollection): boolean {
        const nativeSourceId = this.logicalSourceToNative.get(sourceId);
        if (!nativeSourceId) return false;
        let updated = false;
        for (const [nativeLayerId, usedSourceId] of this.nativeLayerToSource.entries()) {
            if (usedSourceId !== nativeSourceId) continue;
            const layer = this.nativeLayerInstances.get(nativeLayerId) as VectorLayer<VectorSource> | undefined;
            const source = layer?.getSource?.();
            if (!source) continue;
            source.clear();
            source.addFeatures(new GeoJSON().readFeatures(data, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            }));
            updated = true;
        }
        return updated;
    }

    registerInlineLayer(logicalId: string, nativeInstance: BaseLayer, insertOptions?: LayerInsertOptions): void {
        const nativeId = `${logicalId}-inline`;
        this.nativeLayerInstances.set(nativeId, nativeInstance);
        this.logicalToNative.set(logicalId, [nativeId]);
    }

    unregisterInlineLayer(logicalId: string): void {
        const nativeIds = this.logicalToNative.get(logicalId) ?? [];
        for (const id of nativeIds) this.nativeLayerInstances.delete(id);
        this.logicalToNative.delete(logicalId);
    }

    getVisibleWMSLayers(): Array<{ layerId: string; layerTitle?: string; sourceConfig: WMSSourceConfig }> {
        // OL WMS layers are created via createWMSLayer; source config is not separately tracked here.
        return [];
    }

}
