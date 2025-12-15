// src/map/maplibre-services/MapLibreLayerFactory.ts

import type { LayerConfig, StyleLayerConfig, SourceConfig } from '../../config/types';
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
          if (typeof style.minZoom === 'number') layerSpec.minzoom = style.minZoom;
          if (typeof style.maxZoom === 'number') layerSpec.maxzoom = style.maxZoom;
          layers.push(layerSpec);
        } else if (sourceConfig.service === 'wms') {
          // Compose WMS URL with bbox param (MapLibre expects a tile URL template)
          // This is a simplification; real WMS support may require a custom source type or plugin
          const wmsUrl = `${sourceConfig.url}&service=WMS&request=GetMap&bbox={bbox-epsg-3857}`;
          layers.push({
            id: `${layerConfig.id}-raster-wms`,
            type: 'raster',
            source: nativeSourceId,
            paint: style.paint as any,
            layout: style.layout as any,
            minzoom: style.minZoom,
            maxzoom: style.maxZoom,
          });
        } else if (sourceConfig.service === 'wmts') {
          // Add WMTS support if needed
        }
      }
      // Vector/GeoJSON
      else if (['fill', 'line', 'circle', 'symbol'].includes(style.type) && ['geojson', 'vector'].includes(sourceConfig.type)) {
        const layerSpec: LayerSpecification = {
          id: `${layerConfig.id}-${style.type}`,
          type: style.type as any,
          source: nativeSourceId,
          paint: style.paint as any,
          layout: style.layout as any,
          minzoom: style.minZoom,
          maxzoom: style.maxZoom,
        };
        if (style.sourceLayer) {
          (layerSpec as any)['source-layer'] = style.sourceLayer;
        }
        layers.push(layerSpec);
      }
      // Add more cases as needed for other types
    }
    return layers;
  }
}
