/**
 * WebMapX public API
 *
 * Import from this module to build plugins and custom tools:
 *
 *   import { WebmapxBaseTool, type IMap, type IMapState } from 'webmapx';
 */

// Base class for all tools
export { WebmapxBaseTool } from './components/webmapx-base-tool.js';

// Config-driven plugin tool host
export { WebmapxPluginTool } from './components/webmapx-plugin-tool.js';

// Draw tool
export { WebmapxDrawTool } from './components/webmapx-draw-tool.js';
export type { DrawMode, DrawFeature } from './components/webmapx-draw-tool.js';

// Draw layer dialog
export { WebmapxDrawLayerDialog } from './components/webmapx-draw-layer-dialog.js';
export type { DrawLayerConfig, GeometryType, PropertyDef } from './components/webmapx-draw-layer-dialog.js';

// Map interfaces
export type {
  IMap,
  ISubMap,
  ISubMapFactory,
  ISource,
  ILayer,
  IMapCore,
  ILayerService,
  ILayerStyleEditor,
  IToolService,
  ILogicalLayerExecutor,
  NavigationCapabilities,
  MarkerOptions,
  MapCreateOptions,
  LayerSpec,
  LayerInsertOptions,
  FillPaint,
  LinePaint,
} from './map/IMapInterfaces.js';

// State
export type { IMapState, ActiveToolState, RuntimeLayerMetadataEntry, StateSource } from './store/IMapState.js';
export { MapStateStore } from './store/map-state-store.js';

// Events
export { MapEventBus } from './store/map-events.js';
export type {
  LngLat,
  Pixel,
  MapEvent,
  MapEventMap,
  MapEventType,
  MapEventListener,
  PointerMoveEvent,
  PointerLeaveEvent,
  ClickEvent,
  DoubleClickEvent,
  ContextMenuEvent,
  ViewChangeEvent,
  ViewChangeEndEvent,
  ZoomEndEvent,
  LayerAddEvent,
  LayerRemoveEvent,
} from './store/map-events.js';

// Config types
export type {
  AppConfig,
  MapConfig,
  CatalogConfig,
  LayerDataConfig,
  SourceConfig,
  AnyLayerConfig,
  StandardLayerConfig,
  CompositeStyleLayerConfig,
  AllmapsLayerConfig,
  SubLayerSpec,
  TreeNodeConfig,
  AppStateConfig,
  ActiveLayerStateEntry,
  ToolsConfig,
  ToolConfig,
  MapAdapterType,
} from './config/types.js';

// Adapter registry (for plugins that add new map engines)
export {
  registerMapAdapter,
  getRegisteredAdapters,
  DEFAULT_ADAPTER_NAME,
  type MapAdapterFactory,
} from './map/adapter-registry.js';

// Map context resolver (for tools that need to find their host map)
export { resolveMapAdapter, resolveMapElement } from './components/internal/map-context.js';

// Tool manager
export { ToolManager } from './tools/tool-manager.js';
export type { IModalTool } from './tools/IModalTool.js';
