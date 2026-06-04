// src/map/IQueryService.ts
// Engine-agnostic query interface for the Info tool.

import type { LngLat, Pixel } from '../store/map-events';

/**
 * A location on the map specified in both screen and geographic coordinates.
 * Pixel is used for engine-native vector queries and pixel-based tolerance.
 * LngLat is used for WMS GetFeatureInfo requests.
 */
export interface QueryLocation {
    pixel: Pixel;
    lngLat: LngLat;
}

/**
 * A single feature result from a map query.
 */
export interface FeatureInfo {
    /** Logical layer id as defined in the layer config. */
    layerId: string;
    /** Human-readable layer title. */
    layerTitle?: string;
    /** Feature properties (key/value pairs). */
    properties: Record<string, unknown>;
    /** Optional geometry (not always available, e.g. from WMS text responses). */
    geometry?: GeoJSON.Geometry;
    /** Whether feature came from a vector engine query or WMS GetFeatureInfo. */
    source: 'vector' | 'wms';
    /** For composite style layers: the sub-layer id (e.g. "label_country_3"). */
    subLayerId?: string;
    /** For composite style layers: the sub-layer type (fill, line, symbol, etc.). */
    subLayerType?: string;
}

/**
 * Options for a feature query.
 */
export interface QueryOptions {
    /**
     * Hit-test radius in screen pixels.
     * Used for vector point/line features. Default: 5.
     */
    tolerancePx?: number;
    /**
     * Whether to issue WMS GetFeatureInfo requests for visible WMS layers.
     * Default: false (hover mode only queries vector).
     */
    includeWMS?: boolean;
    /**
     * Restrict query to these logical layer IDs.
     * If omitted or empty, all visible layers are queried.
     */
    layerIds?: string[];
}

/**
 * Engine-agnostic interface for querying map features at a location.
 * Implemented per engine (MapLibre, OpenLayers, Leaflet, Cesium).
 * WMS GetFeatureInfo logic is shared via wms-feature-info utility.
 */
export interface IQueryService {
    queryFeatures(location: QueryLocation, options?: QueryOptions): Promise<FeatureInfo[]>;
}
