// src/map/maplibre-services/MapLibreLayerFactory.ts
// Retained for potential external use; core layer creation is now inline in MapLayerService.

import type { StandardLayerConfig, SubLayerSpec } from '../../config/types';
import type { LayerSpecification } from 'maplibre-gl';

export class MapLibreLayerFactory {
  static createLayer(
    nativeLayerId: string,
    spec: StandardLayerConfig | SubLayerSpec,
    nativeSourceId: string,
  ): LayerSpecification | null {
    const layer: any = { id: nativeLayerId, type: spec.type, source: nativeSourceId };
    if (spec['source-layer']) layer['source-layer'] = spec['source-layer'];
    if (spec.minzoom !== undefined) layer.minzoom = spec.minzoom;
    if (spec.maxzoom !== undefined) layer.maxzoom = spec.maxzoom;
    if (spec.paint && typeof spec.paint === 'object') layer.paint = spec.paint;
    if (spec.layout && typeof spec.layout === 'object') layer.layout = spec.layout;
    if (Array.isArray(spec.filter)) layer.filter = spec.filter;
    return layer;
  }
}
