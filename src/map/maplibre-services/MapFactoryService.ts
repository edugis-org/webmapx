// src/map/maplibre-services/MapFactoryService.ts

import * as maplibregl from 'maplibre-gl';
import { IMapFactory, IMap, ILayer, ISource, MapCreateOptions, LayerSpec } from '../IMapInterfaces';

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json';

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
class MapLibreMap implements IMap {
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

    createLayer(spec: LayerSpec): ILayer {
        if (!this.map.getLayer(spec.id)) {
            const mlSpec = this.toMapLibreLayerSpec(spec);
            this.map.addLayer(mlSpec);
        }
        return new MapLibreLayer(spec.id, spec.sourceId, this.map);
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

    private toMapLibreLayerSpec(spec: LayerSpec): maplibregl.LayerSpecification {
        switch (spec.type) {
            case 'fill':
                return {
                    id: spec.id,
                    type: 'fill',
                    source: spec.sourceId,
                    paint: spec.paint as maplibregl.FillLayerSpecification['paint'],
                };
            case 'line':
                return {
                    id: spec.id,
                    type: 'line',
                    source: spec.sourceId,
                    paint: spec.paint as maplibregl.LineLayerSpecification['paint'],
                };
            case 'circle':
                return {
                    id: spec.id,
                    type: 'circle',
                    source: spec.sourceId,
                    paint: spec.paint as maplibregl.CircleLayerSpecification['paint'],
                };
            case 'symbol':
                return {
                    id: spec.id,
                    type: 'symbol',
                    source: spec.sourceId,
                    layout: {},
                };
            default:
                throw new Error(`Unsupported layer type: ${spec.type}`);
        }
    }
}

/**
 * MapLibre implementation of IMapFactory.
 */
export class MapFactoryService implements IMapFactory {
    createMap(container: HTMLElement, options?: MapCreateOptions): IMap {
        const map = new maplibregl.Map({
            container,
            style: options?.styleUrl ?? DEFAULT_STYLE,
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
