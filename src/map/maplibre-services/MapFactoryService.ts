// src/map/maplibre-services/MapFactoryService.ts

import * as maplibregl from 'maplibre-gl';
import { ISubMapFactory, ISubMap, ILayer, ISource, MapCreateOptions, SubMapLayerSpec } from '../IMapInterfaces';

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json';

function expandSubdomainTemplate(url: string): string[] {
    if (!url.includes('{s}')) {
        return [url];
    }

    return ['a', 'b', 'c'].map((subdomain) => url.replace('{s}', subdomain));
}

/**
 * MapLibre implementation of ISource.
 */
class MapLibreSource implements ISource {
    constructor(
        public readonly id: string,
        private readonly map: maplibregl.Map
    ) {}

    setData(data: GeoJSON.FeatureCollection): void {
        const source = this.map.getSource(this.id) as maplibregl.GeoJSONSource | undefined;
        if (source) {
            source.setData(data);
        }
    }
}

/**
 * MapLibre implementation of ILayer.
 */
class MapLibreLayer implements ILayer {
    constructor(
        public readonly id: string,
        private readonly sourceId: string,
        private readonly map: maplibregl.Map
    ) {}

    getSource(): ISource {
        return new MapLibreSource(this.sourceId, this.map);
    }

    remove(): void {
        if (this.map.getLayer(this.id)) {
            this.map.removeLayer(this.id);
        }
    }
}

/**
 * MapLibre implementation of IMap.
 */
class MapLibreMap implements ISubMap {
    constructor(private readonly map: maplibregl.Map) {}

    setViewport(center: [number, number], zoom: number, bearing?: number, pitch?: number): void {
        this.map.jumpTo({
            center,
            zoom,
            bearing: bearing ?? 0,
            pitch: pitch ?? 0,
        });
    }

    createSource(sourceId: string, data: GeoJSON.FeatureCollection): ISource {
        if (!this.map.getSource(sourceId)) {
            this.map.addSource(sourceId, {
                type: 'geojson',
                data,
            });
        }
        return new MapLibreSource(sourceId, this.map);
    }

    getSource(sourceId: string): ISource | null {
        if (this.map.getSource(sourceId)) {
            return new MapLibreSource(sourceId, this.map);
        }
        return null;
    }

    createLayer(spec: SubMapLayerSpec): ILayer {
        if (!this.map.getLayer(spec.id)) {
            // A sub-map layer is a style-spec layer already, so MapLibre takes
            // it as it is. The cast bridges the spec package's types and the
            // copy maplibre-gl bundles, which describe the same objects.
            this.map.addLayer(spec as unknown as maplibregl.LayerSpecification);
        }
        return new MapLibreLayer(spec.id, spec.source, this.map);
    }

    getLayer(layerId: string): ILayer | null {
        const layer = this.map.getLayer(layerId);
        if (layer) {
            const sourceId = (layer as any).source as string;
            return new MapLibreLayer(layerId, sourceId, this.map);
        }
        return null;
    }

    onReady(callback: () => void): void {
        if (this.map.isStyleLoaded()) {
            callback();
        } else {
            this.map.once('load', callback);
        }
    }

    destroy(): void {
        this.map.remove();
    }
}

/**
 * MapLibre implementation of IMapFactory.
 */
export class MapFactoryService implements ISubMapFactory {
    createMap(container: HTMLElement, options?: MapCreateOptions): ISubMap {
        const resolvedTiles = Array.isArray(options?.tileUrls) && options.tileUrls.length > 0
            ? options.tileUrls
            : (typeof options?.tileUrl === 'string' && options.tileUrl.length > 0
                ? expandSubdomainTemplate(options.tileUrl)
                : undefined);

        const resolvedStyle = options?.style
            ?? (resolvedTiles
                ? {
                    version: 8,
                    sources: {
                        insetBackground: {
                            type: 'raster',
                            tiles: resolvedTiles,
                            tileSize: options?.tileSize ?? 256,
                            ...(options?.tileAttribution ? { attribution: options.tileAttribution } : {}),
                        },
                    },
                    layers: [
                        {
                            id: 'inset-background',
                            type: 'raster',
                            source: 'insetBackground',
                        },
                    ],
                }
                : undefined)
            ?? options?.styleUrl
            ?? DEFAULT_STYLE;

        const map = new maplibregl.Map({
            container,
            style: resolvedStyle as maplibregl.StyleSpecification | string,
            center: options?.center ?? [0, 0],
            zoom: options?.zoom ?? 1,
            attributionControl: false,
            interactive: options?.interactive ?? true,
        });

        if (options?.interactive === false) {
            map.boxZoom?.disable();
            map.scrollZoom?.disable();
            map.dragPan?.disable();
            map.dragRotate?.disable();
            map.keyboard?.disable();
            map.doubleClickZoom?.disable();
            map.touchZoomRotate?.disable();
        }

        return new MapLibreMap(map);
    }
}
