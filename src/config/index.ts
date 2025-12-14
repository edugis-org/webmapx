// src/config/index.ts
// Public API for configuration types and validation

export type {
  AppConfig,
  MapConfig,
  CatalogConfig,
  SourceConfig,
  RasterSourceConfig,
  GeoJSONSourceConfig,
  VectorSourceConfig,
  LayerConfig,
  StyleLayerConfig,
  TreeNodeConfig,
  ToolsConfig,
  ToolConfig,
  MapAdapterType,
  RasterServiceType,
  LayerType,
} from './types.js';

export {
  validateConfig,
  formatValidationResult,
  type ValidationResult,
  type ValidationMessage,
  type ValidationSeverity,
} from './validator.js';

export {
  loadAppConfig,
  resolveMapConfig,
  fetchConfig,
  mergeMapConfigs,
  parseAttributeConfig,
  getConfigUrlParam,
  clearConfigCache,
  DEFAULT_MAP_CONFIG,
  type LoadedAppConfig,
} from './loader.js';
