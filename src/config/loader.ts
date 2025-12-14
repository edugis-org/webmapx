// src/config/loader.ts
// Configuration loader with priority cascade

import type { AppConfig, MapConfig } from './types.js';
import { validateConfig } from './validator.js';

const CONFIG_URL_PARAM = 'config';

/** Default map configuration */
export const DEFAULT_MAP_CONFIG: MapConfig = {
  center: [4.9041, 52.3676], // Amsterdam
  zoom: 4.5,
  minZoom: 0,
  maxZoom: 22,
  type: 'maplibre',
};

/** Cache for loaded configs to avoid duplicate fetches */
const configCache = new Map<string, AppConfig>();

/**
 * Gets the config URL from the query string (?config=path/to/config.json)
 */
export function getConfigUrlParam(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(CONFIG_URL_PARAM);
}

/**
 * Fetches and parses a JSON config file.
 * Uses cache to avoid duplicate fetches.
 */
export async function fetchConfig(url: string): Promise<AppConfig> {
  if (configCache.has(url)) {
    return configCache.get(url)!;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load config from "${url}": ${response.status} ${response.statusText}`);
  }

  const config = await response.json();

  // Validate the loaded config
  const result = validateConfig(config);
  if (!result.valid) {
    const errorMessages = result.errors.map(e => `  ${e.path}: ${e.message}`).join('\n');
    throw new Error(`Invalid config from "${url}":\n${errorMessages}`);
  }

  // Log warnings if any
  if (result.warnings.length > 0) {
    console.warn(`[config] Warnings for "${url}":`);
    result.warnings.forEach(w => console.warn(`  ${w.path}: ${w.message}`));
  }

  configCache.set(url, config);
  return config;
}

/**
 * Parses map config from element attributes.
 */
export function parseAttributeConfig(element: HTMLElement): Partial<MapConfig> {
  const config: Partial<MapConfig> = {};

  const center = element.getAttribute('center');
  if (center) {
    try {
      const parsed = JSON.parse(center);
      if (Array.isArray(parsed) && parsed.length === 2) {
        config.center = parsed as [number, number];
      }
    } catch {
      console.warn('[config] Invalid "center" attribute, expected JSON array');
    }
  }

  const zoom = element.getAttribute('zoom');
  if (zoom) {
    const parsed = parseFloat(zoom);
    if (!isNaN(parsed)) {
      config.zoom = parsed;
    }
  }

  const minZoom = element.getAttribute('min-zoom');
  if (minZoom) {
    const parsed = parseFloat(minZoom);
    if (!isNaN(parsed)) {
      config.minZoom = parsed;
    }
  }

  const maxZoom = element.getAttribute('max-zoom');
  if (maxZoom) {
    const parsed = parseFloat(maxZoom);
    if (!isNaN(parsed)) {
      config.maxZoom = parsed;
    }
  }

  const type = element.getAttribute('type');
  if (type === 'maplibre' || type === 'openlayers') {
    config.type = type;
  }

  const label = element.getAttribute('label');
  if (label) {
    config.label = label;
  }

  return config;
}

/**
 * Merges configs with priority (later sources override earlier).
 * Only defined properties override.
 */
export function mergeMapConfigs(...configs: Partial<MapConfig>[]): MapConfig {
  const result = { ...DEFAULT_MAP_CONFIG };

  for (const config of configs) {
    for (const [key, value] of Object.entries(config)) {
      if (value !== undefined) {
        (result as Record<string, unknown>)[key] = value;
      }
    }
  }

  return result;
}

export interface LoadedAppConfig {
  /** The loaded app configuration */
  config: AppConfig;
  /** Source URL of the config */
  source: string;
}

/**
 * Loads the app configuration from the URL ?config= parameter.
 * Returns null if no config param is present.
 */
export async function loadAppConfig(): Promise<LoadedAppConfig | null> {
  const configPath = getConfigUrlParam();
  if (!configPath) {
    return null;
  }

  const config = await fetchConfig(configPath);
  return {
    config,
    source: configPath,
  };
}

/**
 * Resolves map configuration for a specific element with priority cascade:
 * 1. Provided appConfig.map (from app-level config, highest)
 * 2. src attribute on element (map-specific config file)
 * 3. Individual attributes on element
 * 4. Defaults (lowest)
 */
export async function resolveMapConfig(
  element: HTMLElement,
  appConfig?: AppConfig | null
): Promise<MapConfig> {
  // Priority 1: App-level config overrides everything for this map
  if (appConfig?.map) {
    console.log('[config] Using app-level config for map');
    return mergeMapConfigs(appConfig.map);
  }

  // Priority 2: src attribute (map-specific config)
  const srcPath = element.getAttribute('src');
  if (srcPath) {
    try {
      const config = await fetchConfig(srcPath);
      console.log(`[config] Loaded map config from src="${srcPath}"`);
      return mergeMapConfigs(config.map);
    } catch (error) {
      console.error(`[config] Failed to load map config from src:`, error);
      // Fall through to next priority
    }
  }

  // Priority 3: Individual attributes
  const attrConfig = parseAttributeConfig(element);
  const hasAttributes = Object.keys(attrConfig).length > 0;

  if (hasAttributes) {
    console.log('[config] Using attribute-based map config');
    return mergeMapConfigs(attrConfig);
  }

  // Priority 4: Defaults
  console.log('[config] Using default map config');
  return { ...DEFAULT_MAP_CONFIG };
}

/**
 * Clears the config cache (useful for testing or hot reload).
 */
export function clearConfigCache(): void {
  configCache.clear();
}
