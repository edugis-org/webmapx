// src/config/loader.ts
// Configuration loader with priority cascade

import type { AppConfig, MapAdapterType, MapConfig, RuntimeMapConfig } from './types.js';
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

function toRuntimeMapOverrides(runtimeMap: RuntimeMapConfig | undefined): Partial<MapConfig> {
  if (!runtimeMap) {
    return {};
  }

  return {
    ...(runtimeMap.minZoom !== undefined ? { minZoom: runtimeMap.minZoom } : {}),
    ...(runtimeMap.maxZoom !== undefined ? { maxZoom: runtimeMap.maxZoom } : {}),
    ...(runtimeMap.minPitch !== undefined ? { minPitch: runtimeMap.minPitch } : {}),
    ...(runtimeMap.maxPitch !== undefined ? { maxPitch: runtimeMap.maxPitch } : {}),
    ...(runtimeMap.maxBounds !== undefined ? { maxBounds: runtimeMap.maxBounds } : {}),
  };
}

/** Cache for loaded configs to avoid duplicate fetches */
const configCache = new Map<string, AppConfig>();

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Resolves a possibly-relative resource URL against the config file's own URL —
 * the same rule CSS `url()` uses relative to its stylesheet. Lets a config and
 * its sibling data files be moved/deployed as a unit to any path, without the
 * result depending on which page loaded the config. Non-string, absolute, and
 * data:/blob: values pass through unchanged.
 */
function resolveConfigRelativeUrl(value: string, baseUrl: string): string {
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) {
    // Already absolute (has a scheme) or protocol-relative — leave as-is.
    return value;
  }
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

/**
 * Resolves a directory named inside an `internalfunc://` url.
 *
 * A computed source has a scheme, so the ordinary rule leaves it alone — but
 * some generators are answered from files, and the directory holding them is
 * written relative to the configuration, like every other path in it. Moving a
 * config must move what it points at, and a config served from a subdirectory
 * must keep working, so the directory is resolved here rather than being left
 * to whatever page happens to be doing the asking.
 *
 * Only `data` is touched: the rest of the query belongs to the generator.
 */
function resolveInternalFuncPaths(value: string, baseUrl: string): string {
  if (!value.startsWith('internalfunc://')) return value;
  const [name, query] = value.split('?');
  if (!query) return value;
  const params = new URLSearchParams(query);
  const dir = params.get('data');
  if (!dir) return value;
  params.set('data', resolveConfigRelativeUrl(dir, baseUrl));
  // Rebuilt rather than string-replaced so a directory containing a character
  // that needs escaping cannot break the rest of the query — but the braces of a
  // map-state placeholder must survive it. `toString` escapes them to `%7B`/`%7D`,
  // and `{ma}` spelled that way matches nothing: the source is then never
  // recognised as following the map's clock, so it is never redrawn. It draws
  // once, at whatever the placeholder falls back to, and sits there.
  return `${name}?${params.toString().replace(/%7B/gi, '{').replace(/%7D/gi, '}')}`;
}

function normalizeSourceDefinition(id: string, value: unknown, baseUrl: string): Record<string, unknown> {
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

  if (typeof normalized.data === 'string') {
    normalized.data = normalized.data.startsWith('internalfunc://')
      ? resolveInternalFuncPaths(normalized.data, baseUrl)
      : resolveConfigRelativeUrl(normalized.data, baseUrl);
  }
  if (typeof normalized.url === 'string') {
    normalized.url = resolveConfigRelativeUrl(normalized.url, baseUrl);
  } else if (Array.isArray(normalized.url)) {
    normalized.url = normalized.url.map((u) => typeof u === 'string' ? resolveConfigRelativeUrl(u, baseUrl) : u);
  }
  if (Array.isArray(normalized.tiles)) {
    normalized.tiles = normalized.tiles.map((t) => typeof t === 'string' ? resolveConfigRelativeUrl(t, baseUrl) : t);
  }

  return normalized;
}

function normalizeSourceMap(sourceMap: unknown, baseUrl: string): Record<string, unknown>[] {
  if (!isObject(sourceMap)) {
    return [];
  }

  return Object.entries(sourceMap).map(([id, value]) => normalizeSourceDefinition(id, value, baseUrl));
}

function normalizeSubLayerSpec(renderLayer: Record<string, unknown>, sourceAliases?: Map<string, string>): Record<string, unknown> {
  const source = typeof renderLayer.source === 'string'
    ? (sourceAliases?.get(renderLayer.source) ?? renderLayer.source)
    : undefined;
  const sourceLayer = renderLayer['source-layer'] ?? renderLayer.sourceLayer;
  const minzoom = renderLayer.minzoom ?? renderLayer.minZoom;
  const maxzoom = renderLayer.maxzoom ?? renderLayer.maxZoom;
  const result: Record<string, unknown> = { ...renderLayer };
  if (source !== undefined) result.source = source;
  if (sourceLayer !== undefined) result['source-layer'] = sourceLayer;
  if (minzoom !== undefined) result.minzoom = minzoom;
  if (maxzoom !== undefined) result.maxzoom = maxzoom;
  delete result.sourceLayer;
  delete result.minZoom;
  delete result.maxZoom;
  return result;
}

function normalizeLayerMap(
  layerMap: unknown,
  _extraSources: Record<string, unknown>[],
  configUrl: string
): unknown[] {
  if (Array.isArray(layerMap)) {
    // New format: layers array — pass through, normalizing sub-specs
    return layerMap.filter(isObject).map((value) => normalizeLayerEntry(value, _extraSources, configUrl));
  }

  if (!isObject(layerMap)) {
    return [];
  }

  // Old format: object keyed by id
  return Object.entries(layerMap)
    .map(([id, value]) => {
      if (!isObject(value)) return null;
      return normalizeLayerEntry({ id, ...value }, _extraSources, configUrl);
    })
    .filter(Boolean);
}

function normalizeLayerEntry(value: Record<string, unknown>, extraSources: Record<string, unknown>[], configUrl: string): Record<string, unknown> | null {
  const id = typeof value.id === 'string' ? value.id : null;
  if (!id) return null;

  const fallbackLayerId = typeof value.fallbackLayerId === 'string'
    ? value.fallbackLayerId
    : (typeof value.fallbackRef === 'string' ? value.fallbackRef : undefined);

  const singleGroup = typeof value.singleGroup === 'string'
    ? value.singleGroup
    : (typeof value.selectionGroup === 'string' ? value.selectionGroup : undefined);

  const metadata = isObject(value.metadata)
    ? {
        ...value.metadata,
        ...(singleGroup ? { selectionGroup: singleGroup, singleSelectionGroupKey: singleGroup } : {}),
        ...(fallbackLayerId ? { fallbackLayerId } : {}),
      }
    : (singleGroup || fallbackLayerId
        ? { ...(singleGroup ? { selectionGroup: singleGroup, singleSelectionGroupKey: singleGroup } : {}), ...(fallbackLayerId ? { fallbackLayerId } : {}) }
        : undefined);

  const base: Record<string, unknown> = {
    ...value,
    id,
    ...(fallbackLayerId ? { fallbackLayerId } : {}),
    ...(singleGroup ? { singleGroup } : {}),
    ...(metadata ? { metadata } : {}),
  };

  // New format: already has type:'style'|'allmaps'|render-type with layers array
  if (value.type === 'allmaps') return base;
  if (value.type === 'style') {
    // Inline sources are Record<string,unknown> — normalize to scoped ids
    const localSources: Record<string, unknown> = {};
    const sourceAliases = new Map<string, string>();
    if (isObject(value.sources)) {
      for (const [srcId, srcDef] of Object.entries(value.sources)) {
        const scoped = `${id}:${srcId}`;
        sourceAliases.set(srcId, scoped);
        extraSources.push(normalizeSourceDefinition(scoped, srcDef, configUrl));
        localSources[srcId] = srcDef;
      }
    }
    const layers = Array.isArray(value.layers)
      ? value.layers.filter(isObject).map((l) => normalizeSubLayerSpec(l, sourceAliases))
      : [];
    // A remote style document is a relative resource like any other, and is
    // fetched later with `fetch(styleUrl)` — which resolves against the *page*,
    // not the config. Left unresolved, `styles/osmbright.json` in a config
    // served from /config/ is requested from whatever directory the app's HTML
    // happens to sit in, and quietly 404s: the background simply never appears.
    // Resolving here is also what lets a config be loaded cross-origin
    // (?config=https://…/world.json) and still find the styles beside it.
    return {
      ...base,
      type: 'style',
      ...(typeof value.url === 'string' ? { url: resolveConfigRelativeUrl(value.url, configUrl) } : {}),
      sources: value.sources ?? {},
      layers,
    };
  }

  // New format: StandardLayerConfig (has type + source as strings, no layerset/style)
  if (typeof value.type === 'string' && typeof value.source === 'string' && !value.layerset && !value.style) {
    const sourceLayer = value['source-layer'] ?? value.sourceLayer;
    const minzoom = value.minzoom ?? value.minZoom;
    const maxzoom = value.maxzoom ?? value.maxZoom;
    const result: Record<string, unknown> = { ...base };
    if (sourceLayer !== undefined) result['source-layer'] = sourceLayer;
    if (minzoom !== undefined) result.minzoom = minzoom;
    if (maxzoom !== undefined) result.maxzoom = maxzoom;
    delete result.sourceLayer;
    delete result.minZoom;
    delete result.maxZoom;
    return result;
  }

  // Legacy: old-format layerset[] → type:'style' with layers
  if (Array.isArray(value.layerset)) {
    const layers = value.layerset.filter(isObject).map((l) => normalizeSubLayerSpec(l));
    return { ...base, type: 'style', layers, layerset: undefined };
  }

  // Legacy: inline MapLibre style object → type:'style' with scoped sources + layers
  if (isObject(value.style)) {
    const style = value.style as Record<string, unknown>;
    const sourceAliases = new Map<string, string>();
    const localSources: Record<string, unknown> = {};
    if (isObject(style.sources)) {
      for (const [srcId, srcDef] of Object.entries(style.sources)) {
        const scoped = `${id}:${srcId}`;
        sourceAliases.set(srcId, scoped);
        extraSources.push(normalizeSourceDefinition(scoped, srcDef, configUrl));
        localSources[srcId] = srcDef;
      }
    }
    const layers = Array.isArray(style.layers)
      ? style.layers.filter(isObject).map((l) => normalizeSubLayerSpec(l, sourceAliases))
      : [];
    const styleUrl = typeof style.url === 'string' ? resolveConfigRelativeUrl(style.url, configUrl) : undefined;
    return {
      ...base,
      type: 'style',
      ...(styleUrl ? { url: styleUrl } : {}),
      sources: localSources,
      layers,
      style: undefined,
    };
  }

  return null;
}

function normalizeCatalogTree(catalogs: unknown, fallbackLayers: unknown[]): unknown[] {
  const selectionModeFromItem = (item: Record<string, unknown>): 'single' | 'multiple' | undefined => {
    const value = item.selectionMode;
    if (value === 'single' || value === 'multiple') {
      return value;
    }
    return undefined;
  };

  const selectionGroupFromItem = (item: Record<string, unknown>): string | undefined => {
    return typeof item.selectionGroup === 'string' ? item.selectionGroup : undefined;
  };

  const allowNoneFromItem = (item: Record<string, unknown>): boolean | undefined => {
    return typeof item.allowNone === 'boolean' ? item.allowNone : undefined;
  };

  const stackOrderFromItem = (item: Record<string, unknown>): number | undefined => {
    return typeof item.stackOrder === 'number' && Number.isFinite(item.stackOrder)
      ? item.stackOrder
      : undefined;
  };

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
        ...(selectionModeFromItem(item) ? { selectionMode: selectionModeFromItem(item) } : {}),
        ...(selectionGroupFromItem(item) ? { selectionGroup: selectionGroupFromItem(item) } : {}),
        ...(allowNoneFromItem(item) !== undefined ? { allowNone: allowNoneFromItem(item) } : {}),
        ...(stackOrderFromItem(item) !== undefined ? { stackOrder: stackOrderFromItem(item) } : {}),
        children,
      };
    }

    if (kind === 'layer') {
      const ref = typeof item.ref === 'string' ? item.ref : undefined;
      if (!ref) return null;
      return {
        label: typeof item.title === 'string' ? item.title : ref,
        layerId: ref,
        ...(selectionModeFromItem(item) ? { selectionMode: selectionModeFromItem(item) } : {}),
        ...(selectionGroupFromItem(item) ? { selectionGroup: selectionGroupFromItem(item) } : {}),
        ...(allowNoneFromItem(item) !== undefined ? { allowNone: allowNoneFromItem(item) } : {}),
        ...(stackOrderFromItem(item) !== undefined ? { stackOrder: stackOrderFromItem(item) } : {}),
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
      .filter(Boolean) as Array<{ label: string; layerId: string }>;
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
    .filter(Boolean) as Array<{ label: string; layerId: string }>;
}

/**
 * A tool's `data` path is relative to the config, like every other path in it.
 *
 * The deeptime tool reads `tools.deeptime.data` and fetches the plate model
 * from it at runtime, which resolves against the *page* — so the same value
 * meant different directories depending on where the app's HTML sat, and a
 * config loaded from another origin looked for its data on the app's host. The
 * source-level spelling of the same thing (`internalfunc://…?data=…` in
 * layerData) has always been config-relative; this makes the tool section agree.
 *
 * That is what lets a dataset belong to the configuration that uses it rather
 * than to the code: the data can sit beside the config, in a config repository,
 * and travel with it.
 */
function normalizeToolsSection(tools: unknown, configUrl: string): Record<string, unknown> | undefined {
  if (!isObject(tools)) return undefined;

  // Cloned rather than mutated: the raw config object is cached and may be
  // normalised again against a different base.
  const cloned = JSON.parse(JSON.stringify(tools)) as Record<string, unknown>;

  const visit = (entry: Record<string, unknown>): void => {
    if (typeof entry.data === 'string' && entry.data.length > 0) {
      entry.data = resolveConfigRelativeUrl(entry.data, configUrl);
    }
    // Every nested list, not only `items`: a tool inside a toolbar, toolbox or
    // menu carries its own section, and a tool offering a choice carries one
    // `data` per option — `tools.deeptime.models[]` is a list of plate models,
    // each with its own directory.
    for (const value of Object.values(entry)) {
      if (!Array.isArray(value)) continue;
      for (const item of value) if (isObject(item)) visit(item as Record<string, unknown>);
    }
  };

  for (const entry of Object.values(cloned)) {
    if (isObject(entry)) visit(entry as Record<string, unknown>);
  }

  return cloned;
}

function injectLayerTreeIntoTools(tools: unknown, tree: unknown[]): Record<string, unknown> | undefined {
  if (!isObject(tools)) {
    return undefined;
  }

  const clonedTools = JSON.parse(JSON.stringify(tools)) as Record<string, unknown>;
  const toolEntries = Object.values(clonedTools).filter((entry): entry is Record<string, unknown> => isObject(entry));

  for (const entry of toolEntries) {
    const items = Array.isArray(entry.items) ? entry.items : [];
    for (const item of items) {
      if (!isObject(item)) {
        continue;
      }

      if (item.type !== 'layerTree') {
        continue;
      }

      const hasTree = Array.isArray(item.tree) && item.tree.length > 0;
      if (!hasTree) {
        item.tree = tree;
      }
      delete item.catalog;
      return clonedTools;
    }
  }

  return clonedTools;
}

function normalizeLayerDataSection(layerData: unknown, configUrl: string): { sources: unknown[]; layers: unknown[] } {
  if (!isObject(layerData)) {
    return { sources: [], layers: [] };
  }

  const record = layerData as Record<string, unknown>;
  const sources = Array.isArray(record.sources)
    ? record.sources
        .filter(isObject)
        .map((value) => normalizeSourceDefinition(typeof value.id === 'string' ? value.id : '', value, configUrl))
    : normalizeSourceMap(record.sources, configUrl);

  const extraSources: Record<string, unknown>[] = [];
  const layers = normalizeLayerMap(record.layers, extraSources, configUrl);

  // extraSources may duplicate IDs already in sources (e.g. inline layer sources that
  // were also listed in layerData.sources). Keep only the first occurrence per id.
  const sourceById = new Map<string, Record<string, unknown>>();
  for (const s of [...sources, ...extraSources]) {
    if (isObject(s) && typeof (s as any).id === 'string' && !sourceById.has((s as any).id)) {
      sourceById.set((s as any).id, s as Record<string, unknown>);
    }
  }
  const allSources = Array.from(sourceById.values());
  const augmentedLayers = layers.map(layer => {
    if (!isObject(layer)) return layer;
    const l = layer as Record<string, unknown>;
    const srcId = typeof l.source === 'string' ? l.source : null;
    const src = srcId ? sourceById.get(srcId) : null;
    if (!src || src.type !== 'raster' || src.service !== 'wms') return layer;
    const meta = isObject(l.metadata) ? { ...(l.metadata as Record<string, unknown>) } : {};
    if (typeof meta.getFeatureInfoUrl === 'string') return layer; // already set
    const baseUrl = Array.isArray(src.url) ? src.url[0] : src.url;
    if (typeof baseUrl !== 'string') return layer;
    const layers_ = src.layers ?? '';
    const version = src.version ?? '1.1.1';
    const u = new URL(baseUrl);
    u.searchParams.set('SERVICE', 'WMS');
    u.searchParams.set('REQUEST', 'GetFeatureInfo');
    u.searchParams.set('VERSION', String(version));
    u.searchParams.set('LAYERS', String(layers_));
    u.searchParams.set('QUERY_LAYERS', String(layers_));
    meta.getFeatureInfoUrl = u.toString();
    meta.getFeatureInfoFormat = src.format ?? 'application/json';
    return { ...l, metadata: meta };
  });

  return {
    sources: allSources,
    layers: augmentedLayers,
  };
}

function normalizeStoriesSection(stories: unknown, baseUrl: string): unknown {
  if (!isObject(stories) || !Array.isArray(stories.stories)) {
    return stories;
  }

  return {
    ...stories,
    stories: stories.stories.map((story) => {
      if (!isObject(story) || !Array.isArray(story.chapters)) return story;
      return {
        ...story,
        chapters: story.chapters.map((chapter) => {
          if (!isObject(chapter) || !Array.isArray(chapter.steps)) return chapter;
          return {
            ...chapter,
            steps: chapter.steps.map((step) => {
              if (!isObject(step) || typeof step.htmlUrl !== 'string') return step;
              return { ...step, htmlUrl: resolveConfigRelativeUrl(step.htmlUrl, baseUrl) };
            }),
          };
        }),
      };
    }),
  };
}

function normalizeAppConfig(rawConfig: unknown, configUrl: string): AppConfig {
  if (!isObject(rawConfig)) {
    return rawConfig as unknown as AppConfig;
  }

  const raw = rawConfig as Record<string, unknown>;
  const stories = raw.stories !== undefined ? normalizeStoriesSection(raw.stories, configUrl) : undefined;

  const tools = normalizeToolsSection(raw.tools, configUrl);
  // Handed to tools so one can resolve an asset path of its own — a default
  // that never appears in the config file, and so is never normalised here.
  const baseUrl = configUrl;

  if (isObject(raw.layerData)) {
    return {
      ...(raw as unknown as AppConfig),
      layerData: normalizeLayerDataSection(raw.layerData, configUrl) as any,
      baseUrl,
      ...(tools !== undefined ? { tools: tools as any } : {}),
      ...(stories !== undefined ? { stories: stories as any } : {}),
    };
  }

  if (isObject(raw.catalog)) {
    const catalog = raw.catalog as Record<string, unknown>;
    const normalizedFromCatalog: AppConfig = {
      ...(raw as unknown as AppConfig),
      layerData: {
        sources: Array.isArray(catalog.sources) ? (catalog.sources as any) : [],
        layers: Array.isArray(catalog.layers) ? (catalog.layers as any) : [],
      },
      catalog: raw.catalog as any,
      baseUrl,
      ...(tools !== undefined ? { tools: tools as any } : {}),
      ...(stories !== undefined ? { stories: stories as any } : {}),
    };
    return normalizedFromCatalog;
  }

  if (!isObject(raw.library)) {
    return { ...(raw as unknown as AppConfig), ...(stories !== undefined ? { stories: stories as any } : {}) };
  }

  const library = raw.library as Record<string, unknown>;
  const sources = normalizeSourceMap(library.sources, configUrl);
  const layers = normalizeLayerMap(library.layers, sources, configUrl);
  const tree = normalizeCatalogTree(library.catalogs, layers);

  const resolvedTools = injectLayerTreeIntoTools(tools ?? raw.tools, tree);

  const normalized: AppConfig = {
    map: raw.map as MapConfig,
    runtimeMap: isObject(raw.runtimeMap) ? (raw.runtimeMap as RuntimeMapConfig) : undefined,
    layerData: {
      sources: sources as any,
      layers: layers as any,
    },
    tools: resolvedTools as any,
    baseUrl,
    state: isObject(raw.state) ? (raw.state as any) : undefined,
    version: typeof raw.version === 'number' ? raw.version : undefined,
    project: isObject(raw.project) ? (raw.project as Record<string, unknown>) : undefined,
    ...(stories !== undefined ? { stories: stories as any } : {}),
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
/**
 * Normalizes and validates a raw config object (already parsed from JSON).
 * `label` is used only for error/warning messages (e.g. a URL or filename).
 * `configUrl` — relative resource paths (source `data`/`url`/`tiles`) are
 * resolved against this URL, not the page URL, so a config and its sibling
 * data files can be deployed to any path and keep working. Defaults to the
 * page's own URL for inline/embedder-supplied configs that have no file of
 * their own to be relative to.
 */
export function parseAndValidateConfig(
  rawConfig: unknown,
  label: string,
  configUrl: string = typeof document !== 'undefined' ? document.baseURI : 'http://localhost/'
): AppConfig {
  const config = normalizeAppConfig(rawConfig, configUrl);

  const result = validateConfig(config);
  if (!result.valid) {
    const errorMessages = result.errors.map(e => `  ${e.path}: ${e.message}`).join('\n');
    throw new Error(`Invalid config from "${label}":\n${errorMessages}`);
  }

  if (result.warnings.length > 0) {
    console.warn(`[config] Warnings for "${label}":`);
    result.warnings.forEach(w => console.warn(`  ${w.path}: ${w.message}`));
  }

  return config;
}

export async function fetchConfig(url: string): Promise<AppConfig> {
  if (configCache.has(url)) {
    return configCache.get(url)!;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load config from "${url}": ${response.status} ${response.statusText}`);
  }

  const rawConfig = await response.json();
  // response.url is the final, absolute URL (resolves relative fetch input and
  // any redirects) — the correct base for resolving relative resource paths
  // inside the config, regardless of what page loaded it or from where.
  const config = parseAndValidateConfig(rawConfig, url, response.url);

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

  const minPitch = element.getAttribute('min-pitch');
  if (minPitch) {
    const parsed = parseFloat(minPitch);
    if (!isNaN(parsed)) {
      config.minPitch = parsed;
    }
  }

  const maxPitch = element.getAttribute('max-pitch');
  if (maxPitch) {
    const parsed = parseFloat(maxPitch);
    if (!isNaN(parsed)) {
      config.maxPitch = parsed;
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
    const mapWithRuntime = mergeMapConfigs(appConfig.map, toRuntimeMapOverrides(appConfig.runtimeMap));
    return attrConfig.type ? mergeMapConfigs(mapWithRuntime, { type: attrConfig.type }) : mapWithRuntime;
  }

  // Priority 2: src attribute (map-specific config)
  const srcPath = element.getAttribute('src');
  if (srcPath) {
    try {
      const config = await fetchConfig(srcPath);
      const mapWithRuntime = mergeMapConfigs(config.map, toRuntimeMapOverrides(config.runtimeMap));
      return attrConfig.type ? mergeMapConfigs(mapWithRuntime, { type: attrConfig.type }) : mapWithRuntime;
    } catch (error) {
      console.error(`[config] Failed to load map config from src:`, error);
      // Fall through to next priority
    }
  }

  // Priority 3: Individual attributes
  const hasAttributes = Object.keys(attrConfig).length > 0;

  if (hasAttributes) {
    return mergeMapConfigs(attrConfig);
  }

  // Priority 4: Defaults
  return { ...DEFAULT_MAP_CONFIG };
}

/**
 * Clears the config cache (useful for testing or hot reload).
 */
export function clearConfigCache(): void {
  configCache.clear();
}
