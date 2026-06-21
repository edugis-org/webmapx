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
  bearing?: number;
  pitch?: number;
  projection?: string;
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
  url?: string;
}

export interface RasterDemSourceConfig extends SourceConfigBase {
  type: 'raster-dem';
  tiles: string[];
  tileSize?: number;
  encoding?: 'terrarium' | 'mapbox';
  maxzoom?: number;
}

export type SourceConfig = RasterSourceConfig | GeoJSONSourceConfig | VectorSourceConfig | RasterDemSourceConfig;

// ---------------------------------------------------------------------------
// Layer configuration — maplibre-spec-aligned with webmapx extensions
// ---------------------------------------------------------------------------

/** Known metadata fields on WebMapX layer configs. */
export interface LayerMetadata {
  /** Override the display label (falls back to title or id). */
  label?: string;
  /** Override the logical layer id used in mapLayers bookkeeping. */
  mapLayerId?: string;
  /** 'background' | 'overlay' — controls legend placement and z-order slot. */
  legendRole?: 'background' | 'overlay';
  /** Hide this layer from the legend. */
  hideFromLegend?: boolean;
  /** Logical source id for single-source layers. */
  sourceId?: string;
  /** Resolved GeoJSON data (set by generic loader after fetch+convert). */
  sourceData?: GeoJSON.FeatureCollection;
  /** Render layer type inferred from sub-layers (fill, line, circle, …). */
  layerType?: string;
  /** Paint properties forwarded to legend rendering. */
  paint?: Record<string, unknown>;
  /** Sub-layer specs for composite style layers (used by legend). */
  sublayers?: unknown[];
  /** Remote style URL used to expand a style-backed composite layer. */
  styleUrl?: string;
  /** Sprite URL resolved from the remote style document. */
  styleSpriteUrl?: string;
  /** Glyphs URL resolved from the remote style document. */
  styleGlyphsUrl?: string;
  /** Single-selection group key (resolved at add-layer time). */
  singleSelectionGroupKey?: string;
  /** Catalog selection group. */
  selectionGroup?: string;
  /** Layer tree group label. */
  group?: string;
  /** URL to a legend image for this layer (shown in the legend panel). */
  legendurl?: string;
  /** URL template for querying feature info on click (WMS, WMTS, XYZ, or custom endpoint). */
  getFeatureInfoUrl?: string;
  /** MIME type for GetFeatureInfo responses, e.g. 'application/json' or 'text/xml'. */
  getFeatureInfoFormat?: string;
  /** Human-readable description of the layer (not rendered by the map, informational). */
  abstract?: string;
  /** Geographic extent [west, south, east, north] in WGS84. Fallback when source has no bounds; used for zoom-to-extent. */
  bounds?: [number, number, number, number];
  /** Total feature count reported by the source service (e.g. WFS), ahead of loading any features. May exceed the number actually loaded if capped. */
  featureCount?: number;
  /** Maximum number of features to show in the info panel for this layer. Excess features are truncated with a notice. */
  featureInfoLimit?: number;
  /** Attribute display configuration for the info tool. */
  attributes?: LayerAttributeConfig;
  /** Engines known to support this layer (skips runtime/style-fetch support checks). Default: auto-detected (may trigger a style fetch for style-backed layers). */
  supportedEngines?: Array<'maplibre' | 'openlayers' | 'leaflet' | 'cesium'>;
  /** Allow additional engine-specific or plugin fields. */
  [key: string]: unknown;
}

/** Controls which feature properties the info tool shows and how they are labelled. */
export interface LayerAttributeTranslation {
  /** Property name as it appears in the feature. */
  name: string;
  /** Human-readable label shown in the info panel. */
  translation: string;
  /** Optional unit string (include leading space if desired, e.g. ' m'). */
  unit?: string;
  /** Number of decimal places to display for numeric values. */
  decimals?: number;
  /** Multiply raw value by this factor before display. */
  multiplier?: number;
  /** Treat numeric value as a Unix timestamp and format as date. */
  date?: boolean;
  /** Map raw values to display labels. */
  valuemap?: Array<{ value: unknown; label: string }>;
}

export interface LayerAttributeConfig {
  /** Ordered list of attribute display rules. Properties listed here appear first. */
  translations?: LayerAttributeTranslation[];
  /** Whitelist — only these property names are shown. When set, unlisted properties are hidden. */
  allowedAttributes?: string[];
  /** Blacklist — these property names are always hidden. */
  deniedAttributes?: string[];
}

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
  /** Layer-level zoom range (config override, e.g. for legend "zoom to level X" hints). */
  minzoom?: number;
  maxzoom?: number;
  /** Extended metadata (legendRole, styleUrl, spriteUrl, etc.) */
  metadata?: LayerMetadata;
}

/** Sub-layer spec within a CompositeStyleLayerConfig — maplibre-spec layer, plus minimal webmapx extensions. */
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
  /** Webmapx extension: omit this sub-layer's row from the legend (e.g. an outline that shouldn't get its own entry). */
  hideFromLegend?: boolean;
}

/**
 * Standard maplibre-compatible render layer.
 * source references layerData.sources by id (global) or a source defined
 * inside a parent CompositeStyleLayerConfig (local).
 */
export interface StandardLayerConfig extends WebMapXLayerBase {
  type: 'raster' | 'fill' | 'line' | 'circle' | 'symbol' | 'background' | 'fill-extrusion' | 'heatmap' | 'hillshade';
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
  /** MapLibre style spec version - must be 8 if present (omit for `url`-based remote styles). */
  version?: 8;
  /** Remote style URL (e.g. https://tiles.openfreemap.org/styles/liberty). */
  url?: string;
  /**
   * Inline sources keyed by logical name.
   * Values are raw source definitions (same shape as layerData.sources values).
   */
  sources?: Record<string, unknown>;
  /** Sub-layer specifications. */
  layers?: SubLayerSpec[];
  /**
   * Attribution for the remote style as a whole. Style layers may pull in many
   * sources (via `url`) whose individual attributions aren't enumerated locally,
   * so a layer-level override is allowed here (unlike other layer types, where
   * attribution comes from the source).
   */
  attribution?: string;
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
  /** When true, renders as a non-interactive section divider label inside a group. */
  separator?: boolean;
}

export interface CatalogConfig {
  label?: string;
  tree: TreeNodeConfig[];
  sources?: SourceConfig[];
  layers?: AnyLayerConfig[];
}

// ---------------------------------------------------------------------------
// Runtime layer data
// ---------------------------------------------------------------------------

export interface LayerDataConfig {
  /** Global source definitions. Loader injects id from the JSON object key. */
  sources?: SourceConfig[];
  /** Ordered layer definitions. Order matters for initial rendering. */
  layers?: AnyLayerConfig[];
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

export type ToolIconConfig = string | {
  /** Icon name inside the selected Shoelace icon library. */
  name?: string;
  /** Shoelace icon library name. Defaults to "default". */
  library?: string;
  /** Trusted SVG URL for one-off custom icons. */
  src?: string;
};

export interface ToolConfig {
  enabled: boolean;
  /** Human-facing tool label used for buttons, tooltips, and accessibility. */
  label?: string;
  /** Shoelace icon metadata used when a clickable control is generated. */
  icon?: ToolIconConfig;
  /** Custom element tag name to instantiate for this tool (plugin support). */
  element?: string;
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
  /** Search provider, used to enable provider-specific behavior. Currently only "nominatim" is recognized (case-insensitive). */
  provider?: string;
  /** Attribution added to the source of persisted (pinned) search results, when non-empty. */
  attribution?: string;
}

export interface ThreeDToolConfig extends ToolConfig {
  /** MapLibre terrain URL used by the 3D tool when no terrain layer exists in the configuration. */
  'maplibre-terrain-fallback-url'?: string;
  /** Cesium terrain URL used by the 3D tool when no terrain layer exists in the configuration. */
  'cesium-terrain-fallback-url'?: string;
}

export interface ToolsConfig {
  coordinates?: ToolConfig;
  layerTree?: ToolConfig;
  legend?: ToolConfig;
  measure?: MeasureToolConfig;
  insetMap?: InsetMapToolConfig;
  search?: SearchToolConfig;
  [toolName: string]: ToolConfig | MeasureToolConfig | SearchToolConfig | InsetMapToolConfig | ThreeDToolConfig | undefined;
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
