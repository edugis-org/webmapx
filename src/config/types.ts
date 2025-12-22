// src/config/types.ts
// TypeScript types for WebMapX configuration files

/**
 * Supported map adapter types.
 */
export type MapAdapterType = 'maplibre' | 'openlayers';

/**
 * MapLibre-compatible style specification (version optional).
 * Used to define initial background layers.
 */
export interface MapStyle {
  /** Style specification version (optional, defaults to 8) */
  version?: number;
  /** Optional name for the style */
  name?: string;
  /** Source definitions */
  sources?: Record<string, MapStyleSource>;
  /** Layer definitions */
  layers?: MapStyleLayer[];
  /** URL template for glyphs (fonts) */
  glyphs?: string;
  /** URL for sprite images */
  sprite?: string;
}

/**
 * Source definition within a map style.
 */
export interface MapStyleSource {
  type: 'raster' | 'vector' | 'geojson' | 'image' | 'video';
  tiles?: string[];
  url?: string;
  data?: string | GeoJSON.FeatureCollection | GeoJSON.Feature;
  tileSize?: number;
  attribution?: string;
  minzoom?: number;
  maxzoom?: number;
  bounds?: [number, number, number, number];
  scheme?: 'xyz' | 'tms';
}

/**
 * Layer definition within a map style.
 */
export interface MapStyleLayer {
  id: string;
  type: 'raster' | 'fill' | 'line' | 'circle' | 'symbol' | 'background';
  source?: string;
  'source-layer'?: string;
  minzoom?: number;
  maxzoom?: number;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  filter?: unknown[];
}

/**
 * Map configuration - defines the base map settings.
 */
export interface MapConfig {
  /** Display label for the map */
  label?: string;
  /** Initial center as [longitude, latitude] */
  center: [number, number];
  /** Initial zoom level */
  zoom: number;
  /** Maximum allowed zoom level */
  maxZoom?: number;
  /** Minimum allowed zoom level */
  minZoom?: number;
  /** Map adapter/library to use */
  type: MapAdapterType;
  /**
   * Initial map style. Can be:
   * - A MapLibre-compatible style object
   * - A URL string pointing to a style JSON file
   * If undefined or empty, map starts with no background layers.
   */
  style?: MapStyle | string;
}

/**
 * Service types for raster sources.
 */
export type RasterServiceType = 'xyz' | 'wms' | 'wmts';

/**
 * Base properties shared by all source types.
 */
interface SourceConfigBase {
  /** Unique identifier for the source */
  id: string;
  /** Attribution text displayed on the map */
  attribution?: string;
}

/**
 * Base raster source properties shared by all raster service types.
 */
interface RasterSourceConfigBase extends SourceConfigBase {
  type: 'raster';
  /** Tile URL template or service endpoint */
  url: string | string[];
  /** Tile size in pixels */
  tileSize?: number;
  /** Bounds: [west, south, east, north] */
  bounds?: [number, number, number, number];
  /** Minimum zoom level supported by the source */
  minzoom?: number;
  /** Maximum zoom level supported by the source */
  maxzoom?: number;
  /** Tile scheme: 'xyz' or 'tms' */
  scheme?: 'xyz' | 'tms';
  /** Attribution string */
  attribution?: string;
  /** Volatile flag */
  volatile?: boolean;
}

/**
 * XYZ tile source configuration.
 */
export interface XYZSourceConfig extends RasterSourceConfigBase {
  service: 'xyz';
}

/**
 * WMS source configuration.
 */
export interface WMSSourceConfig extends RasterSourceConfigBase {
  service: 'wms';
  /** WMS layer name(s) - can also be specified in the URL */
  layers?: string;
  /** WMS styles parameter */
  styles?: string;
  /** Image format (e.g., 'image/png', 'image/jpeg') */
  format?: string;
  /** Whether to request transparent background */
  transparent?: boolean;
  /** WMS version (e.g., '1.1.1', '1.3.0') */
  version?: string;
  /** Coordinate reference system (e.g., 'EPSG:3857') */
  crs?: string;
}

/**
 * WMTS source configuration.
 */
export interface WMTSSourceConfig extends RasterSourceConfigBase {
  service: 'wmts';
  /** WMTS layer identifier */
  layer?: string;
  /** WMTS style identifier */
  style?: string;
  /** Tile matrix set identifier */
  tileMatrixSet?: string;
  /** Image format */
  format?: string;
}

/**
 * Union of all raster source configuration types.
 */
export type RasterSourceConfig = XYZSourceConfig | WMSSourceConfig | WMTSSourceConfig;

/**
 * GeoJSON source configuration.
 */
export interface GeoJSONSourceConfig extends SourceConfigBase {
  type: 'geojson';
  /** URL to GeoJSON file or inline GeoJSON object */
  data: string | GeoJSON.FeatureCollection;
}

/**
 * Vector tile source configuration.
 */
export interface VectorSourceConfig extends SourceConfigBase {
  type: 'vector';
  /** URL to vector tile endpoint or TileJSON */
  url: string;
}

/**
 * Union of all source configuration types.
 */
export type SourceConfig = RasterSourceConfig | GeoJSONSourceConfig | VectorSourceConfig;

/**
 * Supported layer geometry types.
 */
export type LayerType = 'fill' | 'line' | 'circle' | 'symbol' | 'raster';

/**
 * Individual style layer within a layerset.
 */
export interface StyleLayerConfig {
  /** Layer type determines rendering */
  type: LayerType;
  /** Reference to a source ID */
  source: string;
  /** Source layer name (for vector tiles) */
  sourceLayer?: string;
  /** Minimum zoom level for visibility */
  minZoom?: number;
  /** Maximum zoom level for visibility */
  maxZoom?: number;
  /** Paint properties (colors, opacity, widths) */
  paint?: Record<string, unknown>;
  /** Layout properties (visibility, text settings) */
  layout?: Record<string, unknown>;
  /** Filter expression */
  filter?: unknown[];
}

/**
 * Layer configuration - groups style layers into a logical unit.
 * A single "layer" in the tree can map to multiple style layers (e.g., fill + outline).
 */
export interface LayerConfig {
  /** Unique identifier referenced by tree nodes */
  id: string;
  /** Collection of style layers that make up this logical layer */
  layerset: StyleLayerConfig[];
}

/**
 * Tree node configuration - represents an item in the layer tree.
 * Can be a leaf (with layerId) or a group (with children).
 */
export interface TreeNodeConfig {
  /** Display label in the tree UI */
  label: string;
  /** Reference to a layer ID (leaf nodes only) */
  layerId?: string;
  /** Initial checked/visible state */
  checked?: boolean;
  /** Initial expanded state (group nodes only) */
  expanded?: boolean;
  /** Child nodes (group nodes only) */
  children?: TreeNodeConfig[];
}

/**
 * Catalog configuration - contains the full layer catalog.
 */
export interface CatalogConfig {
  /** Display label for the catalog */
  label?: string;
  /** Hierarchical tree structure for the layer tree UI */
  tree: TreeNodeConfig[];
  /** Data source definitions */
  sources: SourceConfig[];
  /** Layer definitions that reference sources */
  layers: LayerConfig[];
}

/**
 * Individual tool configuration.
 */
export interface ToolConfig {
  /** Whether the tool is enabled */
  enabled: boolean;
  /** Tool-specific options */
  [key: string]: unknown;
}

/**
 * Measure tool configuration.
 */
export interface MeasureToolConfig extends ToolConfig {
  /** Pixel threshold for closing polygon (clicking near first point). Default: 10 */
  closeThreshold?: number;
  /** Pixel threshold for finishing on last point click. Default: 10 */
  finishThreshold?: number;
  /** Colors for visualization */
  colors?: {
    point?: string;
    line?: string;
    rubberBand?: string;
    polygon?: string;
  };
}

/**
 * Tools configuration - enables/configures UI tools.
 */
export interface ToolsConfig {
  coordinates?: ToolConfig;
  layerTree?: ToolConfig;
  legend?: ToolConfig;
  measure?: MeasureToolConfig;
  [toolName: string]: ToolConfig | MeasureToolConfig | undefined;
}

/**
 * Root application configuration.
 */
export interface AppConfig {
  /** Map settings */
  map: MapConfig;
  /** Layer catalog with sources, layers, and tree */
  catalog: CatalogConfig;
  /** Tool configurations */
  tools?: ToolsConfig;
}
