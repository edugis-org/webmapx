// src/map/openlayers-services/MapFactoryService.ts

import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Style } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import { IMapFactory, IMap, ILayer, ISource, MapCreateOptions, LayerSpec } from '../IMapInterfaces';
import 'ol/ol.css';

/**
 * OpenLayers implementation of ISource.
 */
class OpenLayersSource implements ISource {
    constructor(
        public readonly id: string,
        private readonly source: VectorSource
    ) {}

    setData(data: GeoJSON.FeatureCollection): void {
        this.source.clear();
        const features = new GeoJSON().readFeatures(data, {
            featureProjection: 'EPSG:3857'
        });
        this.source.addFeatures(features);
    }
}

/**
 * OpenLayers implementation of ILayer.
 */
class OpenLayersLayer implements ILayer {
    constructor(
        public readonly id: string,
        private readonly layer: VectorLayer<VectorSource>,
        private readonly sourceId: string,
        private readonly map: OLMap
    ) {}

    getSource(): ISource {
        return new OpenLayersSource(this.sourceId, this.layer.getSource()!);
    }

    remove(): void {
        this.map.removeLayer(this.layer);
    }
}

/**
 * OpenLayers implementation of IMap.
 */
class OpenLayersMap implements IMap {
    private sources = new globalThis.Map<string, VectorSource>();
    private layers = new globalThis.Map<string, VectorLayer<VectorSource>>();

    constructor(private readonly map: OLMap) {}

    setViewport(center: [number, number], zoom: number, bearing?: number, pitch?: number): void {
        this.map.getView().animate({
            center: fromLonLat(center),
            zoom: zoom,
            rotation: bearing ? (bearing * Math.PI) / 180 : 0,
            duration: 0
        });
    }

    createSource(sourceId: string, data: GeoJSON.FeatureCollection): ISource {
        if (!this.sources.has(sourceId)) {
            const source = new VectorSource({
                features: new GeoJSON().readFeatures(data, {
                    featureProjection: 'EPSG:3857'
                })
            });
            this.sources.set(sourceId, source);
        }
        return new OpenLayersSource(sourceId, this.sources.get(sourceId)!);
    }

    getSource(sourceId: string): ISource | null {
        const source = this.sources.get(sourceId);
        if (source) {
            return new OpenLayersSource(sourceId, source);
        }
        return null;
    }

    createLayer(spec: LayerSpec): ILayer {
        if (!this.layers.has(spec.id)) {
            const source = this.sources.get(spec.sourceId);
            if (!source) {
                throw new Error(`Source "${spec.sourceId}" not found. Create source before layer.`);
            }

            const style = this.createStyle(spec);
            const layer = new VectorLayer({
                source,
                style
            });
            (layer as any).__layerId = spec.id;

            this.map.addLayer(layer);
            this.layers.set(spec.id, layer);
        }
        return new OpenLayersLayer(spec.id, this.layers.get(spec.id)!, spec.sourceId, this.map);
    }

    getLayer(layerId: string): ILayer | null {
        const layer = this.layers.get(layerId);
        if (layer) {
            const sourceId = Array.from(this.sources.entries())
                .find(([_, s]) => s === layer.getSource())?.[0] ?? '';
            return new OpenLayersLayer(layerId, layer, sourceId, this.map);
        }
        return null;
    }

    onReady(callback: () => void): void {
        // OpenLayers maps are ready immediately after construction
        // But we wait for the first render to ensure tiles are loading
        this.map.once('rendercomplete', callback);

        // Trigger a render if map is already idle
        setTimeout(() => {
            if (this.map.getView()) {
                callback();
            }
        }, 0);
    }

    destroy(): void {
        this.map.setTarget(undefined);
        this.sources.clear();
        this.layers.clear();
    }

    private createStyle(spec: LayerSpec): Style {
        const paint = spec.paint || {};

        switch (spec.type) {
            case 'fill':
                return new Style({
                    fill: new Fill({
                        color: this.toRgba(
                            (paint as any)['fill-color'] || '#000000',
                            (paint as any)['fill-opacity'] ?? 1
                        )
                    }),
                    stroke: new Stroke({
                        color: this.toRgba(
                            (paint as any)['fill-color'] || '#000000',
                            (paint as any)['fill-opacity'] ?? 1
                        ),
                        width: 1
                    })
                });

            case 'line':
                return new Style({
                    stroke: new Stroke({
                        color: this.toRgba(
                            (paint as any)['line-color'] || '#000000',
                            (paint as any)['line-opacity'] ?? 1
                        ),
                        width: (paint as any)['line-width'] || 1
                    })
                });

            case 'circle':
                // Basic circle style - could be enhanced
                return new Style({
                    fill: new Fill({ color: '#3399CC' }),
                    stroke: new Stroke({ color: '#fff', width: 1 })
                });

            default:
                return new Style();
        }
    }

    private toRgba(color: string, opacity: number): string {
        // Simple hex to rgba conversion
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return color;
    }
}

/**
 * OpenLayers implementation of IMapFactory.
 */
export class MapFactoryService implements IMapFactory {
    createMap(container: HTMLElement, options?: MapCreateOptions): IMap {
        const center = options?.center ?? [0, 0];
        const zoom = options?.zoom ?? 2;

        const map = new OLMap({
            target: container,
            layers: [
                new TileLayer({
                    source: new OSM()
                })
            ],
            view: new View({
                center: fromLonLat(center),
                zoom: zoom
            }),
            controls: []
        });

        // Disable interactions if not interactive
        if (options?.interactive === false) {
            map.getInteractions().forEach(interaction => {
                interaction.setActive(false);
            });
        }

        return new OpenLayersMap(map);
    }
}
