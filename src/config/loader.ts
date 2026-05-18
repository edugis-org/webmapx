// src/config/loader.ts
// Configuration loader with priority cascade

import type { AppConfig, MapAdapterType, MapConfig } from './types.js';
import { validateConfig } from './validator.js';

const CONFIG_URL_PARAM = 'config';
const MAP_ADAPTER_ALIASES: Record<string, MapAdapterType> = {
  maplibre: 'maplibre',
  openlayers: 'openlayers',
  ol: 'openlayers',
  leaflet: 'leaflet',
  l: 'leaflet',
  cesium: 'cesium',
  c: 'cesium',
};

function normalizeAdapterType(value: string | null): MapAdapterType | null {
  if (!value) {
    return null;
  }

  return MAP_ADAPTER_ALIASES[value.toLowerCase()] ?? null;
}

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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeSourceMap(sourceMap: unknown): unknown[] {
  if (!isObject(sourceMap)) {
    return [];
  }

  return Object.entries(sourceMap).map(([id, value]) => {
    if (!isObject(value)) {
      return { id, type: 'geojson', data: value };
    }

    const normalized: Record<string, unknown> = { id, ...value };
    if (normalized.type === 'raster' && normalized.url === undefined && Array.isArray(normalized.tiles)) {
      normalized.url = normalized.tiles;
    }
    if (normalized.type === 'raster' && normalized.service === undefined) {
      normalized.service = 'xyz';
    }

    return normalized;
  });
}

function normalizeLayerMap(layerMap: unknown): unknown[] {
  if (!isObject(layerMap)) {
    return [];
  }

  return Object.entries(layerMap)
    .map(([id, value]) => {
      if (!isObject(value)) {
        return null;
      }

      // Current runtime contract (preferred): logical layer with layerset[]
      if (Array.isArray(value.layerset)) {
        return { id, ...value };
      }

      // Single MapLibre style-layer form
      if (typeof value.type === 'string' && typeof value.source === 'string') {
        return {
          id,
          layerset: [{
            type: value.type,
            source: value.source,
            sourceLayer: value.sourceLayer,
            minZoom: value.minZoom,
            maxZoom: value.maxZoom,
            paint: value.paint,
            layout: value.layout,
            filter: value.filter,
          }],
        };
      }

      return null;
    })
    .filter((entry): entry is Record<string, unknown> => entry !== null);
}

function normalizeCatalogTree(catalogs: unknown, fallbackLayers: unknown[]): unknown[] {
  const mapItem = (item: unknown): Record<string, unknown> | null => {
    if (!isObject(item)) {
      return null;
    }

    const kind = typeof item.kind === 'string' ? item.kind : undefined;
    if (kind === 'group') {
      const children = Array.isArray(item.children)
        ? item.children.map(mapItem).filter((n): n is Record<string, unknown> => n !== null)
        : [];
      return {
        label: typeof item.title === 'string' ? item.title : 'Group',
        expanded: item.expanded === true,
        children,
      };
    }

    if (kind === 'layer') {
      const ref = typeof item.ref === 'string' ? item.ref : undefined;
      if (!ref) return null;
      return {
        label: typeof item.title === 'string' ? item.title : ref,
        layerId: ref,
      };
    }

    return null;
  };

  if (!isObject(catalogs)) {
    return fallbackLayers
      .map((layer) => {
        if (!isObject(layer) || typeof layer.id !== 'string') return null;
        return { label: layer.id, layerId: layer.id };
      })
      .filter((node): node is Record<string, unknown> => node !== null);
  }

  const firstCatalog = Object.values(catalogs).find((c) => isObject(c)) as Record<string, unknown> | undefined;
  const items = Array.isArray(firstCatalog?.items) ? firstCatalog.items : [];
  const normalized = items.map(mapItem).filter((n): n is Record<string, unknown> => n !== null);

  if (normalized.length > 0) {
    return normalized;
  }

  return fallbackLayers
    .map((layer) => {
      if (!isObject(layer) || typeof layer.id !== 'string') return null;
      return { label: layer.id, layerId: layer.id };
    })
    .filter((node): node is Record<string, unknown> => node !== null);
}

function normalizeAppConfig(rawConfig: unknown): AppConfig {
  if (!isObject(rawConfig)) {
    return rawConfig as AppConfig;
  }

  const raw = rawConfig as Record<string, unknown>;
  if (isObject(raw.catalog)) {
    return raw as AppConfig;
  }

  if (!isObject(raw.library)) {
    return raw as AppConfig;
  }

  const library = raw.library as Record<string, unknown>;
  const sources = normalizeSourceMap(library.sources);
  const layers = normalizeLayerMap(library.layers);
  const tree = normalizeCatalogTree(library.catalogs, layers);

  const normalized: AppConfig = {
    map: raw.map as MapConfig,
    catalog: {
      label: 'Catalog',
      tree: tree as any,
      sources: sources as any,
      layers: layers as any,
    },
    tools: isObject(raw.tools) ? (raw.tools as any) : undefined,
    state: isObject(raw.state) ? (raw.state as any) : undefined,
    version: typeof raw.version === 'number' ? raw.version : undefined,
    project: isObject(raw.project) ? (raw.project as Record<string, unknown>) : undefined,
  };

  return normalized;
}

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

  const rawConfig = await response.json();
  const config = normalizeAppConfig(rawConfig);

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

  const adapter = normalizeAdapterType(element.getAttribute('adapter'));
  const type = adapter ?? normalizeAdapterType(element.getAttribute('type'));
  if (type) {
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
  const attrConfig = parseAttributeConfig(element);

  // Priority 1: App-level config overrides everything for this map
  if (appConfig?.map) {
    console.log('[config] Using app-level config for map');
    return attrConfig.type ? mergeMapConfigs(appConfig.map, { type: attrConfig.type }) : mergeMapConfigs(appConfig.map);
  }

  // Priority 2: src attribute (map-specific config)
  const srcPath = element.getAttribute('src');
  if (srcPath) {
    try {
      const config = await fetchConfig(srcPath);
      console.log(`[config] Loaded map config from src="${srcPath}"`);
      return attrConfig.type ? mergeMapConfigs(config.map, { type: attrConfig.type }) : mergeMapConfigs(config.map);
    } catch (error) {
      console.error(`[config] Failed to load map config from src:`, error);
      // Fall through to next priority
    }
  }

  // Priority 3: Individual attributes
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
