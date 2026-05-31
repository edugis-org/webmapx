// src/config/types.ts
// TypeScript types for WebMapX configuration files

export type MapAdapterType = 'maplibre' | 'openlayers' | 'leaflet' | 'cesium';

export interface MapStyle {
  version?: number;
  name?: string;
  sources?: Record<string, MapStyleSource>;
  layers?: MapStyleLayer[];
  glyphs?: string;
  sprite?: string;
}

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

export interface MapStyleLayer {
  id: string;
  type: 'raster' | 'fill' | 'line' | 'circle' | 'symbol' | 'background' | 'fill-extrusion';
  source?: string;
  'source-layer'?: string;
  minzoom?: number;
  maxzoom?: number;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  filter?: unknown[];
}

export interface MapConfig {
  label?: string;
  center: [number, number];
  zoom: number;
  maxZoom?: number;
  minZoom?: number;
  maxPitch?: number;
  minPitch?: number;
  type: MapAdapterType;
  style?: MapStyle | string;
}

export interface RuntimeMapConfig {
  maxZoom?: number;
  minZoom?: number;
  maxPitch?: number;
  minPitch?: number;
}

export type RasterServiceType = 'xyz' | 'wms' | 'wmts';

interface SourceConfigBase {
  id: string;
  attribution?: string;
}

interface RasterSourceConfigBase extends SourceConfigBase {
  type: 'raster';
  url: string | string[];
  tileSize?: number;
  bounds?: [number, number, number, number];
  minzoom?: number;
  maxzoom?: number;
  scheme?: 'xyz' | 'tms';
  attribution?: string;
  volatile?: boolean;
}

export interface XYZSourceConfig extends RasterSourceConfigBase {
  service: 'xyz';
}

export interface WMSSourceConfig extends RasterSourceConfigBase {
  service: 'wms';
  layers?: string;
  styles?: string;
  format?: string;
  transparent?: boolean;
  version?: string;
  crs?: string;
}

export interface WMTSSourceConfig extends RasterSourceConfigBase {
  service: 'wmts';
  layer?: string;
  style?: string;
  tileMatrixSet?: string;
  format?: string;
}

export type RasterSourceConfig = XYZSourceConfig | WMSSourceConfig | WMTSSourceConfig;

export interface GeoJSONSourceConfig extends SourceConfigBase {
  type: 'geojson';
  data: string | GeoJSON.FeatureCollection;
}

export interface VectorSourceConfig extends SourceConfigBase {
  type: 'vector';
  url: string;
}

export type SourceConfig = RasterSourceConfig | GeoJSONSourceConfig | VectorSourceConfig;

// ---------------------------------------------------------------------------
// Layer configuration — maplibre-spec-aligned with webmapx extensions
// ---------------------------------------------------------------------------

/** WebMapX extensions shared by all layer types. */
interface WebMapXLayerBase {
  /** Unique identifier */
  id: string;
  /** Display label in the layer tree */
  title?: string;
  /**
   * Exclusive group key. When adding this layer, any active layer with the
   * same singleGroup is replaced at the same z-order slot.
   */
  singleGroup?: string;
  /** Fallback layer id when this layer cannot be activated (e.g. unsupported engine). */
  fallbackLayerId?: string;
  /** Extended metadata (legendRole, styleUrl, spriteUrl, etc.) */
  metadata?: Record<string, unknown>;
}

/** Sub-layer spec within a CompositeStyleLayerConfig — maplibre-spec layer, no webmapx extensions. */
export interface SubLayerSpec {
  id?: string;
  type: string;
  source?: string;
  'source-layer'?: string;
  minzoom?: number;
  maxzoom?: number;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  filter?: unknown[];
}

/**
 * Standard maplibre-compatible render layer.
 * source references layerData.sources by id (global) or a source defined
 * inside a parent CompositeStyleLayerConfig (local).
 */
export interface StandardLayerConfig extends WebMapXLayerBase {
  type: 'raster' | 'fill' | 'line' | 'circle' | 'symbol' | 'background' | 'fill-extrusion' | 'heatmap';
  /** Source id — resolved local-first, then from layerData.sources. */
  source?: string;
  'source-layer'?: string;
  minzoom?: number;
  maxzoom?: number;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  filter?: unknown[];
}

/**
 * Composite style layer — wraps multiple sub-layers.
 *   url   : fetch a remote maplibre/mapbox style JSON; sources and layers
 *           are populated at runtime from the fetched document.
 *   sources/layers: inline sources (local) and sub-layer specs.
 *
 * Sub-layers reference sources by id: local sources (layer.sources) first,
 * then global layerData.sources.
 */
export interface CompositeStyleLayerConfig extends WebMapXLayerBase {
  type: 'style';
  /** Remote style URL (e.g. https://tiles.openfreemap.org/styles/liberty). */
  url?: string;
  /**
   * Inline sources keyed by logical name.
   * Values are raw source definitions (same shape as layerData.sources values).
   */
  sources?: Record<string, unknown>;
  /** Sub-layer specifications. */
  layers?: SubLayerSpec[];
}

/** Allmaps warped historical map layer. */
export interface AllmapsLayerConfig extends WebMapXLayerBase {
  type: 'allmaps';
  /** Annotation URL (https://annotations.allmaps.org/...) */
  annotation: string;
}

export type AnyLayerConfig = StandardLayerConfig | CompositeStyleLayerConfig | AllmapsLayerConfig;

// ---------------------------------------------------------------------------
// Catalog / tree (UI only, optional)
// ---------------------------------------------------------------------------

export type TreeSelectionMode = 'multiple' | 'single';

export interface TreeNodeConfig {
  label?: string;
  layerId?: string;
  selectionMode?: TreeSelectionMode;
  selectionGroup?: string;
  allowNone?: boolean;
  stackOrder?: number;
  checked?: boolean;
  expanded?: boolean;
  children?: TreeNodeConfig[];
}

export interface CatalogConfig {
  label?: string;
  tree: TreeNodeConfig[];
  sources: SourceConfig[];
  layers: AnyLayerConfig[];
}

// ---------------------------------------------------------------------------
// Runtime layer data
// ---------------------------------------------------------------------------

export interface LayerDataConfig {
  /** Global source definitions. Loader injects id from the JSON object key. */
  sources: SourceConfig[];
  /** Ordered layer definitions. Order matters for initial rendering. */
  layers: AnyLayerConfig[];
}

// ---------------------------------------------------------------------------
// Application state & tools
// ---------------------------------------------------------------------------

export type ActiveLayerStateEntry = string | {
  ref?: string;
  layerId?: string;
  visible?: boolean;
  id?: string;
  [key: string]: unknown;
};

export interface AppStateConfig {
  activeBackground?: string;
  activeLayers?: ActiveLayerStateEntry[];
  activeExclusiveLayers?: Record<string, string>;
}

export interface ToolConfig {
  enabled: boolean;
  [key: string]: unknown;
}

export interface InsetMapBackgroundConfig {
  service: 'xyz';
  url?: string;
  tiles?: string[];
  attribution?: string;
  tileSize?: number;
}

export interface InsetMapToolConfig extends ToolConfig {
  zoomOffset?: number;
  baseScale?: number;
  styleUrl?: string;
  background?: InsetMapBackgroundConfig;
}

export interface MeasureToolConfig extends ToolConfig {
  closeThreshold?: number;
  finishThreshold?: number;
  colors?: {
    point?: string;
    line?: string;
    rubberBand?: string;
    polygon?: string;
  };
}

export interface SearchToolConfig extends ToolConfig {
  endpoint?: string;
  params?: Record<string, string | number | boolean>;
  maxResults?: number;
  defaultZoom?: number;
  marker?: boolean;
  persistOnSelect?: boolean;
}

export interface ToolsConfig {
  coordinates?: ToolConfig;
  layerTree?: ToolConfig;
  legend?: ToolConfig;
  measure?: MeasureToolConfig;
  insetMap?: InsetMapToolConfig;
  search?: SearchToolConfig;
  [toolName: string]: ToolConfig | MeasureToolConfig | SearchToolConfig | InsetMapToolConfig | undefined;
}

export interface AppConfig {
  version?: number;
  project?: Record<string, unknown>;
  map: MapConfig;
  runtimeMap?: RuntimeMapConfig;
  layerData: LayerDataConfig;
  catalog?: CatalogConfig;
  state?: AppStateConfig;
  tools?: ToolsConfig;
}
