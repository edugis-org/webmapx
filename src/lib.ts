/**
 * WebMapX library entry point.
 * Used for npm package and CDN distribution.
 * Import WebMapX and call mount() with a config.
 */
export { WebMapX } from './bootstrap/WebMapX.js';
export type { WebMapXConfig, WebMapXMountOptions } from './bootstrap/types.js';

// Re-export public API for plugin authors
export { WebmapxBaseTool } from './components/webmapx-base-tool.js';
export { WebmapxPluginTool } from './components/webmapx-plugin-tool.js';
export type {
  IMap,
  IMapState,
} from './index.js';

// i18n utilities for tools/plugins
export { t, i18n } from './i18n/i18n.js';
export { loadLocale as changeLocale } from './bootstrap/locale-loader.js';
