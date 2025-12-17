// src/map/maplibre-services/MapLibreLayerFactory.ts

import type { LayerConfig, SourceConfig } from '../../config/types';
import type { LayerSpecification } from 'maplibre-gl';

/**
 * Factory to compose one or more MapLibre LayerSpecifications from logical LayerConfig and SourceConfig.
 */
export class MapLibreLayerFactory {
  /**
   * Compose one or more MapLibre layer specs for a logical layer and source.
   * Returns an array because some logical layers may map to multiple native layers.
   */
  static createLayers(layerConfig: LayerConfig, sourceConfig: SourceConfig, nativeSourceId: string): LayerSpecification[] {
    const layers: LayerSpecification[] = [];
    for (const style of layerConfig.layerset) {
      // Raster
      if (style.type === 'raster' && sourceConfig.type === 'raster') {
        if (sourceConfig.service === 'xyz') {
          const layerSpec: any = {
            id: `${layerConfig.id}-raster-xyz`,
            type: 'raster',
            source: nativeSourceId,
          };
          if ('minZoom' in style) layerSpec.minzoom = style.minZoom;
          if ('maxZoom' in style) layerSpec.maxzoom = style.maxZoom;
          layers.push(layerSpec);
        } else if (sourceConfig.service === 'wms') {
          const layerSpec: any = {
            id: `${layerConfig.id}-raster-wms`,
            type: 'raster',
            source: nativeSourceId,
          };
          if (style.paint && typeof style.paint === 'object') layerSpec.paint = style.paint;
          if (style.layout && typeof style.layout === 'object') layerSpec.layout = style.layout;
          if ('minZoom' in style) layerSpec.minzoom = style.minZoom;
          if ('maxZoom' in style) layerSpec.maxzoom = style.maxZoom;
          layers.push(layerSpec);
        } else if (sourceConfig.service === 'wmts') {
          // Add WMTS support if needed
        }
      }
      // Vector/GeoJSON
      else if (['fill', 'line', 'circle', 'symbol'].includes(style.type) && ['geojson', 'vector'].includes(sourceConfig.type)) {
        const layerSpec: any = {
          id: `${layerConfig.id}-${style.type}`,
          type: style.type as any,
          source: nativeSourceId,
        };
        if (style.paint && typeof style.paint === 'object') layerSpec.paint = style.paint;
        if (style.layout && typeof style.layout === 'object') layerSpec.layout = style.layout;
        if ('minZoom' in style) layerSpec.minzoom = style.minZoom;
        if ('maxZoom' in style) layerSpec.maxzoom = style.maxZoom;
        if (style.sourceLayer) {
          layerSpec['source-layer'] = style.sourceLayer;
        }
        layers.push(layerSpec);
      }
      // Add more cases as needed for other types
    }
    return layers;
  }
}
