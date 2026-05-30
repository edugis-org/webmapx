// src/map/openlayers-services/MapLayerService.ts

import { ILayerService } from '../IMapInterfaces';
import type { LayerConfig, SourceConfig, WMSSourceConfig, CatalogConfig } from '../../config/types';
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
    private catalog: CatalogConfig | null = null;
    private sourceIdCounter = 0;

    constructor(map: OLMap, store: MapStateStore) {
        this.map = map;
        this.store = store;
    }

    private updateVisibleLayers(): void {
        this.store.dispatch({ visibleLayers: Array.from(this.logicalToNative.keys()) }, 'MAP');
    }

    setCatalog(catalog: CatalogConfig): void {
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
    private async addWarpedMapLayer(layerId: string, sourceConfig: SourceConfig): Promise<boolean> {
        const { WarpedMapLayer } = await import('@allmaps/openlayers');
        const url = 'url' in sourceConfig
            ? (Array.isArray(sourceConfig.url) ? sourceConfig.url[0] : sourceConfig.url)
            : '';
        const annotationUrl = this.parseWarpedMapUrl(url);

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
        this.map.addLayer(warpedMapLayer as unknown as BaseLayer);

        // Load the georeference annotation
        await warpedMapLayer.addGeoreferenceAnnotationByUrl(annotationUrl);

        // Track the layer
        this.warpedMapLayers.set(layerId, warpedMapLayer);
        this.nativeLayerInstances.set(warpedLayerId, warpedMapLayer as unknown as BaseLayer);
        this.logicalToNative.set(layerId, [warpedLayerId]);
        this.updateVisibleLayers();

        return true;
    }

    async addLayer(layerId: string, layerConfig: LayerConfig, sourceConfig: SourceConfig): Promise<boolean> {
        // Check for warpedmap:// protocol
        if (this.isWarpedMapSource(sourceConfig)) {
            return this.addWarpedMapLayer(layerId, sourceConfig);
        }
        const nativeSourceId = this.getOrCreateNativeSourceId(sourceConfig);
        const nativeLayerIds: string[] = [];

        if (this.isStyleBackedVectorSource(layerConfig, sourceConfig)) {
            const nativeLayerId = `${layerConfig.id}-${sourceConfig.id}-vector-style`;

            if (!this.nativeLayerInstances.has(nativeLayerId)) {
                const layer = await this.createStyleBackedVectorTileLayer(nativeLayerId, layerConfig, sourceConfig);
                if (!layer) {
                    return false;
                }
                this.map.addLayer(layer);
                this.nativeLayerInstances.set(nativeLayerId, layer);
            }

            nativeLayerIds.push(nativeLayerId);
            this.nativeLayerToSource.set(nativeLayerId, nativeSourceId);
            this.logicalToNative.set(layerId, this.mergeNativeLayerIds(layerId, nativeLayerIds));
            this.updateVisibleLayers();
            return true;
        }

        for (const style of layerConfig.layerset) {
            const nativeLayerId = style.id
                ? `${layerConfig.id}-${style.id}`
                : `${layerConfig.id}-${style.type}`;

            if (!this.nativeLayerInstances.has(nativeLayerId)) {
                const layer = await this.createLayer(nativeLayerId, style, sourceConfig);
                if (layer) {
                    this.map.addLayer(layer);
                    this.nativeLayerInstances.set(nativeLayerId, layer);
                }
            }

            nativeLayerIds.push(nativeLayerId);
            this.nativeLayerToSource.set(nativeLayerId, nativeSourceId);
        }

        this.logicalToNative.set(layerId, this.mergeNativeLayerIds(layerId, nativeLayerIds));
        this.updateVisibleLayers();
        return true;
    }

    private mergeNativeLayerIds(layerId: string, nativeLayerIds: string[]): string[] {
        const existing = this.logicalToNative.get(layerId) ?? [];
        return Array.from(new Set([...existing, ...nativeLayerIds]));
    }

    private isStyleBackedVectorSource(layerConfig: LayerConfig, sourceConfig: SourceConfig): sourceConfig is SourceConfig & { type: 'vector' } {
        const metadata = (layerConfig as any)?.metadata;
        return sourceConfig.type === 'vector'
            && typeof metadata?.styleUrl === 'string'
            && Array.isArray(layerConfig.layerset)
            && layerConfig.layerset.length > 0;
    }

    private async createStyleBackedVectorTileLayer(
        layerId: string,
        layerConfig: LayerConfig,
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
        const mapboxLayerIds = layerConfig.layerset
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

    private buildStyleBackedGlStyle(layerConfig: LayerConfig, sourceConfig: SourceConfig & { type: 'vector' }): Record<string, unknown> {
        const metadata = ((layerConfig as any)?.metadata ?? {}) as Record<string, unknown>;
        const styleLayers = layerConfig.layerset;
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
                ...(typeof styleLayer.sourceLayer === 'string' ? { 'source-layer': styleLayer.sourceLayer } : {}),
                ...(typeof styleLayer.minZoom === 'number' ? { minzoom: styleLayer.minZoom } : {}),
                ...(typeof styleLayer.maxZoom === 'number' ? { maxzoom: styleLayer.maxZoom } : {}),
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
        style: LayerConfig['layerset'][0],
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
        if (!Array.isArray(filter) || filter.length < 3) {
            return true;
        }

        const [operator, lhs, rhs] = filter;
        if (operator !== '==') {
            return true;
        }

        return this.resolveFilterOperand(feature, lhs) === rhs;
    }

    private createVectorTileLayer(
        layerId: string,
        sourceConfig: SourceConfig & { type: 'vector' },
        style: LayerConfig['layerset'][0]
    ): Promise<BaseLayer | null> {
        return this.resolveVectorTileSourceInfo(sourceConfig).then((resolvedSource) => {
            if (!resolvedSource) {
                return null;
            }

            const { urlTemplate, minZoom: vectorMinZoom, maxZoom: vectorMaxZoom } = resolvedSource;
            const sourceLayerName = style.sourceLayer ?? (style as any)['source-layer'];
            const olStyle = this.createStyle(style);
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
                minZoom: style.minZoom,
                maxZoom: style.maxZoom,
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

                    return olStyle;
                }
            });

            (layer as any).__layerId = layerId;
            return layer;
        });
    }

    private createXYZLayer(
        layerId: string,
        sourceConfig: SourceConfig & { type: 'raster'; service: 'xyz' },
        style: LayerConfig['layerset'][0]
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
            minZoom: style.minZoom,
            maxZoom: style.maxZoom,
            opacity: this.getPaintNumberValue((style.paint as any)?.['raster-opacity'], 1)
        });

        (layer as any).__layerId = layerId;
        return layer;
    }

    private createWMSLayer(
        layerId: string,
        sourceConfig: WMSSourceConfig,
        style: LayerConfig['layerset'][0]
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
                minZoom: style.minZoom,
                maxZoom: style.maxZoom,
                opacity: this.getPaintNumberValue((style.paint as any)?.['raster-opacity'], 1)
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
                minZoom: style.minZoom,
                maxZoom: style.maxZoom,
                opacity: this.getPaintNumberValue((style.paint as any)?.['raster-opacity'], 1)
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
        style: LayerConfig['layerset'][0]
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

        const olStyle = this.createStyle(style);

        const layer = new VectorLayer({
            source,
            style: olStyle,
            minZoom: style.minZoom,
            maxZoom: style.maxZoom
        });

        (layer as any).__layerId = layerId;
        return layer;
    }

    private createStyle(style: LayerConfig['layerset'][0]): Style {
        const paint = style.paint || {};

        switch (style.type) {
            case 'fill':
                return new Style({
                    fill: new Fill({
                        color: this.toRgba(
                            this.getPaintColorValue((paint as any)['fill-color'], '#000000'),
                            this.getPaintNumberValue((paint as any)['fill-opacity'], 1)
                        )
                    }),
                    stroke: new Stroke({
                        color: this.toRgba(
                            this.getPaintColorValue((paint as any)['fill-outline-color'], this.getPaintColorValue((paint as any)['fill-color'], '#000000')),
                            this.getPaintNumberValue((paint as any)['fill-opacity'], 1)
                        ),
                        width: 1
                    })
                });

            case 'line':
                return new Style({
                    stroke: new Stroke({
                        color: this.toRgba(
                            this.getPaintColorValue((paint as any)['line-color'], '#000000'),
                            this.getPaintNumberValue((paint as any)['line-opacity'], 1)
                        ),
                        width: this.getPaintNumberValue((paint as any)['line-width'], 1)
                    })
                });

            case 'circle':
                return new Style({
                    image: new CircleStyle({
                        radius: this.getPaintNumberValue((paint as any)['circle-radius'], 5),
                        fill: new Fill({
                            color: this.toRgba(
                                this.getPaintColorValue((paint as any)['circle-color'], '#3399CC'),
                                this.getPaintNumberValue((paint as any)['circle-opacity'], 1)
                            )
                        }),
                        stroke: new Stroke({
                            color: this.toRgba(
                                this.getPaintColorValue((paint as any)['circle-stroke-color'], '#ffffff'),
                                this.getPaintNumberValue((paint as any)['circle-stroke-opacity'], 1)
                            ),
                            width: this.getPaintNumberValue((paint as any)['circle-stroke-width'], 1)
                        })
                    })
                });

            default:
                return new Style();
        }
    }

    private getPaintColorValue(value: unknown, fallback: string): string {
        return typeof value === 'string' && value.length > 0 ? value : fallback;
    }

    private getPaintNumberValue(value: unknown, fallback: number): number {
        return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
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
