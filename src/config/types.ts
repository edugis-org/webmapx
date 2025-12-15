// src/config/types.ts
// TypeScript types for WebMapX configuration files

/**
 * Supported map adapter types.
 */
export type MapAdapterType = 'maplibre' | 'openlayers';

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
 * Raster source configuration (XYZ, WMS, WMTS).
 */
export interface RasterSourceConfig extends SourceConfigBase {
  type: 'raster';
  /** Service protocol */
  service: RasterServiceType;
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
 * Tools configuration - enables/configures UI tools.
 */
export interface ToolsConfig {
  coordinates?: ToolConfig;
  layerTree?: ToolConfig;
  legend?: ToolConfig;
  [toolName: string]: ToolConfig | undefined;
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
