// src/config/validator.ts
// Runtime validator for WebMapX configuration files

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationMessage {
  severity: ValidationSeverity;
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
}

// Known keys for each config section
const KNOWN_SEARCH_PROVIDERS = new Set(['nominatim']);

const KNOWN_KEYS = {
  root: ['version', 'project', 'map', 'runtimeMap', 'layerData', 'catalog', 'library', 'state', 'ui', 'tools', 'stories', '_devTools'],
  map: ['label', 'center', 'zoom', 'minZoom', 'maxZoom', 'minPitch', 'maxPitch', 'type', 'style', 'styleUrl', 'bearing', 'pitch', 'projection'],
  runtimeMap: ['minZoom', 'maxZoom', 'minPitch', 'maxPitch', 'maxBounds'],
  layerData: ['sources', 'layers'],
  catalog: ['label', 'tree', 'sources', 'layers'],
  treeNode: ['label', 'layerId', 'selectionMode', 'selectionGroup', 'allowNone', 'stackOrder', 'checked', 'expanded', 'children', 'separator'],
  state: ['activeBackground', 'activeLayers', 'activeExclusiveLayers', 'terrainEnabled'],
  stateLayer: ['id', 'ref', 'layerId', 'visible', 'timeState', 'paint', 'layout', 'metadata', 'source', 'type'],
  sourceBase: ['id', 'type', 'attribution'],
  sourceRaster: ['service', 'url', 'tiles', 'tileSize', 'minzoom', 'maxzoom', 'bounds', 'scheme', 'volatile', 'attribution', 'layers', 'format', 'transparent', 'version', 'crs'],
  sourceGeojson: ['data', 'attribution', 'minzoom', 'maxzoom', 'bounds', 'buffer', 'tolerance', 'cluster', 'clusterRadius', 'clusterMaxZoom', 'lineMetrics', 'generateId'],
  sourceVector: ['url', 'tiles', 'bounds', 'scheme', 'minzoom', 'maxzoom', 'attribution', 'volatile'],
  sourceRasterDem: ['tiles', 'tileSize', 'encoding', 'maxzoom', 'attribution'],
  layer: ['id', 'type', 'source', 'source-layer', 'sources', 'layers', 'url', 'annotation', 'fallbackLayerId', 'singleGroup', 'title', 'metadata', 'minzoom', 'maxzoom', 'paint', 'layout', 'filter', 'featureInfoLimit'],
  styleLayer: ['id', 'type', 'source', 'sourceLayer', 'source-layer', 'metadata', 'minzoom', 'maxzoom', 'paint', 'layout', 'filter'],
  tool: ['enabled', 'label', 'icon', 'element'],
  toolInsetMap: ['enabled', 'type', 'position', 'label', 'icon', 'element', 'zoomOffset', 'baseScale', 'styleUrl', 'background'],
  toolInsetMapBackground: ['service', 'url', 'tiles', 'attribution', 'tileSize'],
  toolSearch: ['enabled', 'type', 'label', 'title', 'icon', 'element', 'endpoint', 'params', 'maxResults', 'defaultZoom', 'marker', 'persistOnSelect', 'provider', 'attribution'],
};

const VALID_MAP_TYPES = ['maplibre', 'openlayers', 'leaflet', 'cesium'];
const VALID_SOURCE_TYPES = ['raster', 'geojson', 'vector', 'raster-dem'];
const VALID_RASTER_SERVICES = ['xyz', 'wms', 'wmts'];
const VALID_LAYER_TYPES = ['background', 'fill', 'line', 'circle', 'symbol', 'raster', 'fill-extrusion', 'heatmap', 'hillshade'];
const VALID_TREE_SELECTION_MODES = ['multiple', 'single'];

/**
 * Validates a WebMapX configuration object.
 */
export function validateConfig(config: unknown): ValidationResult {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];

  if (!isObject(config)) {
    errors.push({ severity: 'error', path: '', message: 'Configuration must be an object' });
    return { valid: false, errors, warnings };
  }

  const cfg = config as Record<string, unknown>;

  // Check for unknown root keys
  checkUnknownKeys(cfg, KNOWN_KEYS.root, '', warnings);

  // Validate map section
  validateMapSection(cfg.map, errors, warnings);

  // Validate optional runtime map section
  validateRuntimeMapSection(cfg.runtimeMap, errors, warnings);

  // Cross-check: initial center should lie within maxBounds (engines clamp, but warn the author)
  const maxBounds = isObject(cfg.runtimeMap) ? (cfg.runtimeMap as Record<string, unknown>).maxBounds : undefined;
  const mapCenter = isObject(cfg.map) ? (cfg.map as Record<string, unknown>).center : undefined;
  if (
    Array.isArray(maxBounds) && maxBounds.length === 4 && maxBounds.every((v) => typeof v === 'number') &&
    Array.isArray(mapCenter) && mapCenter.length === 2 && mapCenter.every((v) => typeof v === 'number')
  ) {
    const [west, south, east, north] = maxBounds as number[];
    const [lng, lat] = mapCenter as number[];
    if (lng < west || lng > east || lat < south || lat > north) {
      warnings.push({ severity: 'warning', path: 'map.center', message: '"center" lies outside "runtimeMap.maxBounds" — the map will clamp to the bounds on load' });
    }
  }

  let layerIds = new Set<string>();

  if (cfg.layerData !== undefined) {
    ({ layerIds } = validateLayerDataSection(cfg.layerData, errors, warnings, 'layerData'));
  }

  if (cfg.catalog !== undefined) {
    warnings.push({ severity: 'warning', path: 'catalog', message: '"catalog" is deprecated; use "layerData" and place tree under layerTree tool config' });
    const legacy = validateCatalogSection(cfg.catalog, errors, warnings);
    if (cfg.layerData === undefined) {
      layerIds = legacy.layerIds;
    }
  }

  if (cfg.layerData === undefined && cfg.catalog === undefined) {
    errors.push({ severity: 'error', path: 'layerData', message: 'Missing required "layerData" section' });
  }

  // Validate optional state section
  validateStateSection(cfg.state, layerIds, errors, warnings);

  // Validate tools section (optional)
  if (cfg.tools !== undefined) {
    validateToolsSection(cfg.tools, 'tools', layerIds, errors, warnings);
  }

  // Validate stories section (optional)
  if (cfg.stories !== undefined) {
    validateStoriesSection(cfg.stories, layerIds, errors, warnings);
  }

  // Cross-reference validation is done within validateCatalogSection

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateLayerDataSection(
  layerData: unknown,
  errors: ValidationMessage[],
  warnings: ValidationMessage[],
  path: string,
): { sourceIds: Set<string>; layerIds: Set<string> } {
  const sourceIds = new Set<string>();
  const layerIds = new Set<string>();

  if (!isObject(layerData)) {
    errors.push({ severity: 'error', path, message: `"${path}" must be an object` });
    return { sourceIds, layerIds };
  }

  const c = layerData as Record<string, unknown>;
  checkUnknownKeys(c, KNOWN_KEYS.layerData, path, warnings);

  if (c.sources === undefined) {
    errors.push({ severity: 'error', path: `${path}.sources`, message: 'Missing required "sources" array' });
  } else if (!Array.isArray(c.sources)) {
    errors.push({ severity: 'error', path: `${path}.sources`, message: '"sources" must be an array' });
  } else {
    validateSources(c.sources, `${path}.sources`, sourceIds, errors, warnings);
  }

  if (c.layers === undefined) {
    errors.push({ severity: 'error', path: `${path}.layers`, message: 'Missing required "layers" array' });
  } else if (!Array.isArray(c.layers)) {
    errors.push({ severity: 'error', path: `${path}.layers`, message: '"layers" must be an array' });
  } else {
    validateLayers(c.layers, `${path}.layers`, sourceIds, layerIds, errors, warnings);
    c.layers.forEach((layer, index) => {
      if (!isObject(layer)) {
        return;
      }

      const l = layer as Record<string, unknown>;
      const layerPath = `${path}.layers[${index}]`;
      if (l.fallbackLayerId !== undefined && typeof l.fallbackLayerId !== 'string') {
        errors.push({ severity: 'error', path: `${layerPath}.fallbackLayerId`, message: '"fallbackLayerId" must be a string' });
        return;
      }

      if (typeof l.fallbackLayerId === 'string' && !layerIds.has(l.fallbackLayerId)) {
        errors.push({ severity: 'error', path: `${layerPath}.fallbackLayerId`, message: `Layer "${l.fallbackLayerId}" not found in layers` });
      }
    });
  }

  return { sourceIds, layerIds };
}

function validateMapSection(
  map: unknown,
  errors: ValidationMessage[],
  warnings: ValidationMessage[]
): void {
  const path = 'map';

  if (map === undefined) {
    errors.push({ severity: 'error', path, message: 'Missing required "map" section' });
    return;
  }

  if (!isObject(map)) {
    errors.push({ severity: 'error', path, message: '"map" must be an object' });
    return;
  }

  const m = map as Record<string, unknown>;
  checkUnknownKeys(m, KNOWN_KEYS.map, path, warnings);

  // Required: center
  if (m.center === undefined) {
    errors.push({ severity: 'error', path: `${path}.center`, message: 'Missing required "center"' });
  } else if (!isCoordinate(m.center)) {
    errors.push({
      severity: 'error',
      path: `${path}.center`,
      message: '"center" must be [longitude, latitude] array with valid values',
    });
  }

  // Required: zoom
  if (m.zoom === undefined) {
    errors.push({ severity: 'error', path: `${path}.zoom`, message: 'Missing required "zoom"' });
  } else if (typeof m.zoom !== 'number' || m.zoom < 0 || m.zoom > 24) {
    errors.push({
      severity: 'error',
      path: `${path}.zoom`,
      message: '"zoom" must be a number between 0 and 24',
    });
  }

  // Required: type
  if (m.type === undefined) {
    errors.push({ severity: 'error', path: `${path}.type`, message: 'Missing required "type"' });
  } else if (!VALID_MAP_TYPES.includes(m.type as string)) {
    errors.push({
      severity: 'error',
      path: `${path}.type`,
      message: `"type" must be one of: ${VALID_MAP_TYPES.join(', ')}`,
    });
  }

  if (m.minZoom !== undefined && (typeof m.minZoom !== 'number' || m.minZoom < 0 || m.minZoom > 24)) {
    errors.push({ severity: 'error', path: `${path}.minZoom`, message: '"minZoom" must be a number between 0 and 24' });
  } else if (m.minZoom !== undefined) {
    warnings.push({ severity: 'warning', path: `${path}.minZoom`, message: '"map.minZoom" is deprecated; use "runtimeMap.minZoom"' });
  }
  if (m.maxZoom !== undefined && (typeof m.maxZoom !== 'number' || m.maxZoom < 0 || m.maxZoom > 24)) {
    errors.push({ severity: 'error', path: `${path}.maxZoom`, message: '"maxZoom" must be a number between 0 and 24' });
  } else if (m.maxZoom !== undefined) {
    warnings.push({ severity: 'warning', path: `${path}.maxZoom`, message: '"map.maxZoom" is deprecated; use "runtimeMap.maxZoom"' });
  }
  if (
    typeof m.minZoom === 'number' &&
    typeof m.maxZoom === 'number' &&
    m.minZoom > m.maxZoom
  ) {
    errors.push({ severity: 'error', path: `${path}.minZoom`, message: '"minZoom" cannot be greater than "maxZoom"' });
  }

  if (m.minPitch !== undefined && (typeof m.minPitch !== 'number' || m.minPitch < 0 || m.minPitch > 85)) {
    errors.push({ severity: 'error', path: `${path}.minPitch`, message: '"minPitch" must be a number between 0 and 85' });
  } else if (m.minPitch !== undefined) {
    warnings.push({ severity: 'warning', path: `${path}.minPitch`, message: '"map.minPitch" is deprecated; use "runtimeMap.minPitch"' });
  }
  if (m.maxPitch !== undefined && (typeof m.maxPitch !== 'number' || m.maxPitch < 0 || m.maxPitch > 85)) {
    errors.push({ severity: 'error', path: `${path}.maxPitch`, message: '"maxPitch" must be a number between 0 and 85' });
  } else if (m.maxPitch !== undefined) {
    warnings.push({ severity: 'warning', path: `${path}.maxPitch`, message: '"map.maxPitch" is deprecated; use "runtimeMap.maxPitch"' });
  }
  if (
    typeof m.minPitch === 'number' &&
    typeof m.maxPitch === 'number' &&
    m.minPitch > m.maxPitch
  ) {
    errors.push({ severity: 'error', path: `${path}.minPitch`, message: '"minPitch" cannot be greater than "maxPitch"' });
  }
}

function validateRuntimeMapSection(
  runtimeMap: unknown,
  errors: ValidationMessage[],
  warnings: ValidationMessage[]
): void {
  const path = 'runtimeMap';

  if (runtimeMap === undefined) {
    return;
  }

  if (!isObject(runtimeMap)) {
    errors.push({ severity: 'error', path, message: '"runtimeMap" must be an object' });
    return;
  }

  const r = runtimeMap as Record<string, unknown>;
  checkUnknownKeys(r, KNOWN_KEYS.runtimeMap, path, warnings);

  if (r.minZoom !== undefined && (typeof r.minZoom !== 'number' || r.minZoom < 0 || r.minZoom > 24)) {
    errors.push({ severity: 'error', path: `${path}.minZoom`, message: '"minZoom" must be a number between 0 and 24' });
  }

  if (r.maxZoom !== undefined && (typeof r.maxZoom !== 'number' || r.maxZoom < 0 || r.maxZoom > 24)) {
    errors.push({ severity: 'error', path: `${path}.maxZoom`, message: '"maxZoom" must be a number between 0 and 24' });
  }

  if (
    typeof r.minZoom === 'number' &&
    typeof r.maxZoom === 'number' &&
    r.minZoom > r.maxZoom
  ) {
    errors.push({ severity: 'error', path: `${path}.minZoom`, message: '"minZoom" cannot be greater than "maxZoom"' });
  }

  if (r.minPitch !== undefined && (typeof r.minPitch !== 'number' || r.minPitch < 0 || r.minPitch > 85)) {
    errors.push({ severity: 'error', path: `${path}.minPitch`, message: '"minPitch" must be a number between 0 and 85' });
  }

  if (r.maxPitch !== undefined && (typeof r.maxPitch !== 'number' || r.maxPitch < 0 || r.maxPitch > 85)) {
    errors.push({ severity: 'error', path: `${path}.maxPitch`, message: '"maxPitch" must be a number between 0 and 85' });
  }

  if (
    typeof r.minPitch === 'number' &&
    typeof r.maxPitch === 'number' &&
    r.minPitch > r.maxPitch
  ) {
    errors.push({ severity: 'error', path: `${path}.minPitch`, message: '"minPitch" cannot be greater than "maxPitch"' });
  }

  if (r.maxBounds !== undefined) {
    const b = r.maxBounds;
    if (!Array.isArray(b) || b.length !== 4 || b.some((v) => typeof v !== 'number' || !Number.isFinite(v))) {
      errors.push({ severity: 'error', path: `${path}.maxBounds`, message: '"maxBounds" must be [west, south, east, north] — an array of 4 numbers (lon/lat degrees)' });
    } else {
      const [west, south, east, north] = b as [number, number, number, number];
      if (west >= east) {
        errors.push({ severity: 'error', path: `${path}.maxBounds`, message: '"maxBounds" west must be less than east (antimeridian-crossing boxes are not supported)' });
      }
      if (south >= north) {
        errors.push({ severity: 'error', path: `${path}.maxBounds`, message: '"maxBounds" south must be less than north' });
      }
      if (south < -90 || north > 90) {
        errors.push({ severity: 'error', path: `${path}.maxBounds`, message: '"maxBounds" latitudes must be within [-90, 90]' });
      }
      if (west < -180 || east > 180) {
        warnings.push({ severity: 'warning', path: `${path}.maxBounds`, message: '"maxBounds" longitudes outside [-180, 180]' });
      }
    }
  }
}

function validateCatalogSection(
  catalog: unknown,
  errors: ValidationMessage[],
  warnings: ValidationMessage[]
): { sourceIds: Set<string>; layerIds: Set<string> } {
  const path = 'catalog';
  const sourceIds = new Set<string>();
  const layerIds = new Set<string>();

  if (catalog === undefined) {
    errors.push({ severity: 'error', path, message: 'Missing required "catalog" section' });
    return { sourceIds, layerIds };
  }

  if (!isObject(catalog)) {
    errors.push({ severity: 'error', path, message: '"catalog" must be an object' });
    return { sourceIds, layerIds };
  }

  const c = catalog as Record<string, unknown>;
  checkUnknownKeys(c, KNOWN_KEYS.catalog, path, warnings);

  // Validate sources first (needed for layer cross-reference)
  if (c.sources === undefined) {
    errors.push({ severity: 'error', path: `${path}.sources`, message: 'Missing required "sources" array' });
  } else if (!Array.isArray(c.sources)) {
    errors.push({ severity: 'error', path: `${path}.sources`, message: '"sources" must be an array' });
  } else {
    validateSources(c.sources, `${path}.sources`, sourceIds, errors, warnings);
  }

  // Validate layers (cross-references sources)
  if (c.layers === undefined) {
    errors.push({ severity: 'error', path: `${path}.layers`, message: 'Missing required "layers" array' });
  } else if (!Array.isArray(c.layers)) {
    errors.push({ severity: 'error', path: `${path}.layers`, message: '"layers" must be an array' });
  } else {
    validateLayers(c.layers, `${path}.layers`, sourceIds, layerIds, errors, warnings);

    // Validate layer-level fallback references after collecting all layer ids.
    c.layers.forEach((layer, index) => {
      if (!isObject(layer)) {
        return;
      }

      const l = layer as Record<string, unknown>;
      const layerPath = `${path}.layers[${index}]`;
      if (l.fallbackLayerId !== undefined && typeof l.fallbackLayerId !== 'string') {
        errors.push({ severity: 'error', path: `${layerPath}.fallbackLayerId`, message: '"fallbackLayerId" must be a string' });
        return;
      }

      if (typeof l.fallbackLayerId === 'string' && !layerIds.has(l.fallbackLayerId)) {
        errors.push({ severity: 'error', path: `${layerPath}.fallbackLayerId`, message: `Layer "${l.fallbackLayerId}" not found in layers` });
      }
    });
  }

  // Validate tree (cross-references layers)
  if (c.tree === undefined) {
    errors.push({ severity: 'error', path: `${path}.tree`, message: 'Missing required "tree" array' });
  } else if (!Array.isArray(c.tree)) {
    errors.push({ severity: 'error', path: `${path}.tree`, message: '"tree" must be an array' });
  } else {
    validateTree(c.tree, `${path}.tree`, layerIds, errors, warnings);
  }

  return { sourceIds, layerIds };
}

function validateStateSection(
  state: unknown,
  layerIds: Set<string>,
  errors: ValidationMessage[],
  warnings: ValidationMessage[]
): void {
  const path = 'state';
  if (state === undefined) {
    return;
  }

  if (!isObject(state)) {
    errors.push({ severity: 'error', path, message: '"state" must be an object' });
    return;
  }

  const s = state as Record<string, unknown>;
  checkUnknownKeys(s, KNOWN_KEYS.state, path, warnings);

  if (s.activeBackground !== undefined && typeof s.activeBackground !== 'string') {
    errors.push({ severity: 'error', path: `${path}.activeBackground`, message: '"activeBackground" must be a string' });
  }

  if (s.activeLayers === undefined) {
    // continue to validate activeExclusiveLayers below
  } else if (!Array.isArray(s.activeLayers)) {
    errors.push({ severity: 'error', path: `${path}.activeLayers`, message: '"activeLayers" must be an array' });
  } else {
    s.activeLayers.forEach((entry, index) => {
      const entryPath = `${path}.activeLayers[${index}]`;

      if (typeof entry === 'string') {
        if (!layerIds.has(entry)) {
          errors.push({ severity: 'error', path: entryPath, message: `Layer "${entry}" not found in layers` });
        }
        return;
      }

      if (!isObject(entry)) {
        errors.push({ severity: 'error', path: entryPath, message: 'Active layer entry must be a string ref or object' });
        return;
      }

      const e = entry as Record<string, unknown>;
      checkUnknownKeys(e, KNOWN_KEYS.stateLayer, entryPath, warnings);

      const ref = typeof e.ref === 'string'
        ? e.ref
        : (typeof e.layerId === 'string' ? e.layerId : null);

      if (ref && !layerIds.has(ref)) {
        errors.push({ severity: 'error', path: `${entryPath}.ref`, message: `Layer "${ref}" not found in layers` });
      }

      if (e.visible !== undefined && typeof e.visible !== 'boolean') {
        errors.push({ severity: 'error', path: `${entryPath}.visible`, message: '"visible" must be a boolean' });
      }
    });
  }

  if (s.activeExclusiveLayers !== undefined) {
    if (!isObject(s.activeExclusiveLayers)) {
      errors.push({ severity: 'error', path: `${path}.activeExclusiveLayers`, message: '"activeExclusiveLayers" must be an object' });
    } else {
      Object.entries(s.activeExclusiveLayers).forEach(([groupId, layerId]) => {
        const groupPath = `${path}.activeExclusiveLayers.${groupId}`;
        if (typeof layerId !== 'string' || layerId.length === 0) {
          errors.push({ severity: 'error', path: groupPath, message: 'Exclusive group value must be a non-empty layer id string' });
          return;
        }
        if (!layerIds.has(layerId)) {
          errors.push({ severity: 'error', path: groupPath, message: `Layer "${layerId}" not found in layers` });
        }
      });
    }
  }
}

function validateSources(
  sources: unknown[],
  basePath: string,
  sourceIds: Set<string>,
  errors: ValidationMessage[],
  warnings: ValidationMessage[]
): void {
  sources.forEach((source, index) => {
    const path = `${basePath}[${index}]`;

    if (!isObject(source)) {
      errors.push({ severity: 'error', path, message: 'Source must be an object' });
      return;
    }

    const s = source as Record<string, unknown>;

    // Required: id
    if (typeof s.id !== 'string' || s.id.length === 0) {
      errors.push({ severity: 'error', path: `${path}.id`, message: 'Source must have a non-empty string "id"' });
    } else {
      if (sourceIds.has(s.id)) {
        errors.push({ severity: 'error', path: `${path}.id`, message: `Duplicate source ID: "${s.id}"` });
      }
      sourceIds.add(s.id);
    }

    // Required: type
    if (!VALID_SOURCE_TYPES.includes(s.type as string)) {
      errors.push({
        severity: 'error',
        path: `${path}.type`,
        message: `Source "type" must be one of: ${VALID_SOURCE_TYPES.join(', ')}`,
      });
      return;
    }

    // Type-specific validation
    const knownKeys = [...KNOWN_KEYS.sourceBase];

    if (s.type === 'raster') {
      knownKeys.push(...KNOWN_KEYS.sourceRaster);
      const hasStringUrl = typeof s.url === 'string' && s.url.length > 0;
      const hasUrlArray = Array.isArray(s.url)
        && s.url.length > 0
        && s.url.every((entry) => typeof entry === 'string' && entry.length > 0);
      if (!hasStringUrl && !hasUrlArray) {
        errors.push({ severity: 'error', path: `${path}.url`, message: 'Raster source requires a non-empty string "url" or string array' });
      }
      if (s.service !== undefined && !VALID_RASTER_SERVICES.includes(s.service as string)) {
        errors.push({
          severity: 'error',
          path: `${path}.service`,
          message: `Raster "service" must be one of: ${VALID_RASTER_SERVICES.join(', ')}`,
        });
      }
      if (s.tileSize !== undefined && (typeof s.tileSize !== 'number' || s.tileSize <= 0)) {
        errors.push({ severity: 'error', path: `${path}.tileSize`, message: '"tileSize" must be a positive number' });
      }

      if (s.minZoom !== undefined) {
        errors.push({ severity: 'error', path: `${path}.minZoom`, message: '"minZoom" is not supported; use "minzoom" (Mapbox/MapLibre style spec)' });
      }
      if (s.maxZoom !== undefined) {
        errors.push({ severity: 'error', path: `${path}.maxZoom`, message: '"maxZoom" is not supported; use "maxzoom" (Mapbox/MapLibre style spec)' });
      }
      const minZoom = s.minzoom;
      const maxZoom = s.maxzoom;
      if (minZoom !== undefined && (typeof minZoom !== 'number' || minZoom > 24)) {
        errors.push({ severity: 'error', path: `${path}.minzoom`, message: '"minzoom" must be a number not greater than 24' });
      }
      if (maxZoom !== undefined && (typeof maxZoom !== 'number' || maxZoom < 0 || maxZoom > 24)) {
        errors.push({ severity: 'error', path: `${path}.maxzoom`, message: '"maxzoom" must be a number between 0 and 24' });
      }
      if (typeof minZoom === 'number' && typeof maxZoom === 'number' && minZoom > maxZoom) {
        errors.push({ severity: 'error', path: `${path}.minzoom`, message: '"minzoom" cannot be greater than "maxzoom"' });
      }
    } else if (s.type === 'geojson') {
      knownKeys.push(...KNOWN_KEYS.sourceGeojson);
      if (s.data === undefined) {
        errors.push({ severity: 'error', path: `${path}.data`, message: 'GeoJSON source requires "data"' });
      } else if (typeof s.data !== 'string' && !isObject(s.data)) {
        errors.push({ severity: 'error', path: `${path}.data`, message: '"data" must be a URL string or GeoJSON object' });
      }
    } else if (s.type === 'vector') {
      knownKeys.push(...KNOWN_KEYS.sourceVector);
      const hasUrl = typeof s.url === 'string' && s.url.length > 0;
      const hasTiles = Array.isArray(s.tiles) && s.tiles.length > 0;
      if (!hasUrl && !hasTiles) {
        errors.push({ severity: 'error', path: `${path}.url`, message: 'Vector source requires a "url" or "tiles"' });
      }
    } else if (s.type === 'raster-dem') {
      knownKeys.push(...KNOWN_KEYS.sourceRasterDem);
      const hasTiles = Array.isArray(s.tiles) && s.tiles.length > 0 && s.tiles.every((entry) => typeof entry === 'string' && entry.length > 0);
      if (!hasTiles) {
        errors.push({ severity: 'error', path: `${path}.tiles`, message: 'Raster-dem source requires a non-empty "tiles" string array' });
      }
    }

    checkUnknownKeys(s, knownKeys, path, warnings);

    // Warning for missing attribution
    if (s.attribution === undefined) {
      warnings.push({ severity: 'warning', path, message: 'Source is missing "attribution"' });
    }
  });
}

function validateLayers(
  layers: unknown[],
  basePath: string,
  sourceIds: Set<string>,
  layerIds: Set<string>,
  errors: ValidationMessage[],
  warnings: ValidationMessage[]
): void {
  layers.forEach((layer, index) => {
    const path = `${basePath}[${index}]`;

    if (!isObject(layer)) {
      errors.push({ severity: 'error', path, message: 'Layer must be an object' });
      return;
    }

    const l = layer as Record<string, unknown>;
    const allowedKeys = l.type === 'style' ? [...KNOWN_KEYS.layer, 'attribution', 'version'] : KNOWN_KEYS.layer;
    checkUnknownKeys(l, allowedKeys, path, warnings);

    // Required: id
    if (typeof l.id !== 'string' || l.id.length === 0) {
      errors.push({ severity: 'error', path: `${path}.id`, message: 'Layer must have a non-empty string "id"' });
    } else {
      if (layerIds.has(l.id)) {
        errors.push({ severity: 'error', path: `${path}.id`, message: `Duplicate layer ID: "${l.id}"` });
      }
      layerIds.add(l.id);
    }

    // Validate type-specific fields
    const layerType = l.type;
    if (layerType === 'allmaps') {
      if (typeof l.annotation !== 'string' || l.annotation.length === 0) {
        errors.push({ severity: 'error', path: `${path}.annotation`, message: 'Allmaps layer must have an "annotation" URL' });
      }
    } else if (layerType === 'style') {
      if (Array.isArray(l.layers) && l.layers.length > 0) {
        validateLayerset(l.layers, `${path}.layers`, sourceIds, errors, warnings);
      }
    } else if (typeof layerType === 'string' && VALID_LAYER_TYPES.includes(layerType)) {
      if (typeof l.source !== 'string') {
        warnings.push({ severity: 'warning', path: `${path}.source`, message: 'Standard layer should have a "source"' });
      }
    } else if (layerType !== undefined) {
      errors.push({ severity: 'error', path: `${path}.type`, message: `Unknown layer type: "${layerType}"` });
    }
  });
}

function validateLayerset(
  layerset: unknown[],
  basePath: string,
  sourceIds: Set<string>,
  errors: ValidationMessage[],
  warnings: ValidationMessage[]
): void {
  layerset.forEach((styleLayer, index) => {
    const path = `${basePath}[${index}]`;

    if (!isObject(styleLayer)) {
      errors.push({ severity: 'error', path, message: 'Style layer must be an object' });
      return;
    }

    const sl = styleLayer as Record<string, unknown>;
    checkUnknownKeys(sl, KNOWN_KEYS.styleLayer, path, warnings);

    if (sl.minZoom !== undefined) {
      errors.push({ severity: 'error', path: `${path}.minZoom`, message: '"minZoom" is not supported; use "minzoom" (Mapbox/MapLibre style spec)' });
    }
    if (sl.maxZoom !== undefined) {
      errors.push({ severity: 'error', path: `${path}.maxZoom`, message: '"maxZoom" is not supported; use "maxzoom" (Mapbox/MapLibre style spec)' });
    }

    // Required: type
    if (!VALID_LAYER_TYPES.includes(sl.type as string)) {
      errors.push({
        severity: 'error',
        path: `${path}.type`,
        message: `Style layer "type" must be one of: ${VALID_LAYER_TYPES.join(', ')}`,
      });
    }

    // Required: source
    if (sl.type === 'background') {
      return;
    }

    if (typeof sl.source !== 'string' || sl.source.length === 0) {
      errors.push({ severity: 'error', path: `${path}.source`, message: 'Style layer must have a "source"' });
    } else if (!sourceIds.has(sl.source)) {
      errors.push({
        severity: 'error',
        path: `${path}.source`,
        message: `Source "${sl.source}" not found in sources`,
      });
    }

    // Optional zoom validation
    if (sl.minzoom !== undefined && (typeof sl.minzoom !== 'number' || sl.minzoom > 24)) {
      errors.push({ severity: 'error', path: `${path}.minzoom`, message: '"minzoom" must be a number not greater than 24' });
    }
    if (sl.maxzoom !== undefined && (typeof sl.maxzoom !== 'number' || sl.maxzoom < 0 || sl.maxzoom > 24)) {
      errors.push({ severity: 'error', path: `${path}.maxzoom`, message: '"maxzoom" must be a number between 0 and 24' });
    }
  });
}

function validateTree(
  tree: unknown[],
  basePath: string,
  layerIds: Set<string>,
  errors: ValidationMessage[],
  warnings: ValidationMessage[]
): void {
  tree.forEach((node, index) => {
    validateTreeNode(node, `${basePath}[${index}]`, layerIds, errors, warnings);
  });
}

function validateTreeNode(
  node: unknown,
  path: string,
  layerIds: Set<string>,
  errors: ValidationMessage[],
  warnings: ValidationMessage[]
): void {
  if (!isObject(node)) {
    errors.push({ severity: 'error', path, message: 'Tree node must be an object' });
    return;
  }

  const n = node as Record<string, unknown>;
  checkUnknownKeys(n, KNOWN_KEYS.treeNode, path, warnings);

  // Separator nodes only need a label
  if (n.separator === true) {
    if (typeof n.label !== 'string' || n.label.length === 0) {
      errors.push({ severity: 'error', path: `${path}.label`, message: 'Separator node must have a non-empty "label"' });
    }
    return;
  }

  // Label required on group nodes (no layerId fallback); optional on leaf nodes
  const isLeaf = typeof n.layerId === 'string' && n.layerId.length > 0;
  if (!isLeaf && (typeof n.label !== 'string' || n.label.length === 0)) {
    errors.push({ severity: 'error', path: `${path}.label`, message: 'Tree node must have a non-empty "label"' });
  }

  const hasLayerId = n.layerId !== undefined;
  const hasChildren = n.children !== undefined;

  // A node should be either a leaf (layerId) or a group (children), not both
  if (hasLayerId && hasChildren) {
    warnings.push({
      severity: 'warning',
      path,
      message: 'Tree node has both "layerId" and "children" - consider separating leaf and group nodes',
    });
  }

  // Validate layerId reference
  if (hasLayerId) {
    if (typeof n.layerId !== 'string') {
      errors.push({ severity: 'error', path: `${path}.layerId`, message: '"layerId" must be a string' });
    } else if (!layerIds.has(n.layerId)) {
      errors.push({
        severity: 'error',
        path: `${path}.layerId`,
        message: `Layer "${n.layerId}" not found in layers`,
      });
    }
  }

  // Validate children recursively
  if (hasChildren) {
    if (!Array.isArray(n.children)) {
      errors.push({ severity: 'error', path: `${path}.children`, message: '"children" must be an array' });
    } else {
      n.children.forEach((child, index) => {
        validateTreeNode(child, `${path}.children[${index}]`, layerIds, errors, warnings);
      });
    }
  }

  // Validate boolean properties
  if (n.checked !== undefined && typeof n.checked !== 'boolean') {
    errors.push({ severity: 'error', path: `${path}.checked`, message: '"checked" must be a boolean' });
  }
  if (n.expanded !== undefined && typeof n.expanded !== 'boolean') {
    errors.push({ severity: 'error', path: `${path}.expanded`, message: '"expanded" must be a boolean' });
  }

  if (n.selectionMode !== undefined && !VALID_TREE_SELECTION_MODES.includes(n.selectionMode as string)) {
    errors.push({
      severity: 'error',
      path: `${path}.selectionMode`,
      message: `"selectionMode" must be one of: ${VALID_TREE_SELECTION_MODES.join(', ')}`,
    });
  }

  if (n.selectionGroup !== undefined && typeof n.selectionGroup !== 'string') {
    errors.push({ severity: 'error', path: `${path}.selectionGroup`, message: '"selectionGroup" must be a string' });
  }

  if (n.allowNone !== undefined && typeof n.allowNone !== 'boolean') {
    errors.push({ severity: 'error', path: `${path}.allowNone`, message: '"allowNone" must be a boolean' });
  }

  if (n.stackOrder !== undefined && (typeof n.stackOrder !== 'number' || !Number.isFinite(n.stackOrder))) {
    errors.push({ severity: 'error', path: `${path}.stackOrder`, message: '"stackOrder" must be a finite number' });
  }

  if (n.selectionMode === 'single' && !hasChildren) {
    warnings.push({
      severity: 'warning',
      path: `${path}.selectionMode`,
      message: '"selectionMode: single" is typically used on group nodes with children',
    });
  }

  if (n.allowNone !== undefined && n.selectionMode !== 'single') {
    warnings.push({
      severity: 'warning',
      path: `${path}.allowNone`,
      message: '"allowNone" only applies when "selectionMode" is "single"',
    });
  }
}

function validateToolsSection(
  tools: unknown,
  path: string,
  layerIds: Set<string>,
  errors: ValidationMessage[],
  warnings: ValidationMessage[]
): void {
  if (!isObject(tools)) {
    warnings.push({ severity: 'warning', path, message: '"tools" should be an object' });
    return;
  }

  const t = tools as Record<string, unknown>;

  Object.entries(t).forEach(([toolName, toolConfig]) => {
    const toolPath = `${path}.${toolName}`;
    if (!isObject(toolConfig)) {
      warnings.push({ severity: 'warning', path: toolPath, message: 'Tool config should be an object' });
      return;
    }
    const tc = toolConfig as Record<string, unknown>;
    if (tc.enabled === undefined) {
      warnings.push({ severity: 'warning', path: toolPath, message: 'Tool config is missing "enabled" property' });
    } else if (typeof tc.enabled !== 'boolean') {
      warnings.push({ severity: 'warning', path: `${toolPath}.enabled`, message: '"enabled" should be a boolean' });
    }

    validateToolMetadata(tc, toolPath, warnings);

    if (Array.isArray(tc.items)) {
      tc.items.forEach((item, index) => {
        if (!isObject(item)) {
          return;
        }
        const itemPath = `${toolPath}.items[${index}]`;
        const itemRecord = item as Record<string, unknown>;
        validateToolMetadata(itemRecord, itemPath, warnings);

        if (itemRecord.type !== 'layerTree') {
          return;
        }

        if (itemRecord.catalog !== undefined) {
          warnings.push({ severity: 'warning', path: `${itemPath}.catalog`, message: '"catalog" reference is deprecated; embed "tree" in this layerTree tool item' });
        }

        if (itemRecord.tree === undefined) {
          warnings.push({ severity: 'warning', path: `${itemPath}.tree`, message: 'LayerTree tool item should define a "tree" array' });
          return;
        }

        if (!Array.isArray(itemRecord.tree)) {
          errors.push({ severity: 'error', path: `${itemPath}.tree`, message: '"tree" must be an array' });
          return;
        }

        validateTree(itemRecord.tree, `${itemPath}.tree`, layerIds, errors, warnings);
      });
    }

    if (toolName === 'search') {
      checkUnknownKeys(tc, KNOWN_KEYS.toolSearch, toolPath, warnings);

      if (tc.provider !== undefined) {
        if (typeof tc.provider !== 'string') {
          warnings.push({ severity: 'warning', path: `${toolPath}.provider`, message: '"provider" should be a string' });
        } else if (!KNOWN_SEARCH_PROVIDERS.has(tc.provider.toLowerCase())) {
          warnings.push({ severity: 'warning', path: `${toolPath}.provider`, message: `Unknown search provider "${tc.provider}"` });
        }
      }

      if (tc.attribution !== undefined && typeof tc.attribution !== 'string') {
        warnings.push({ severity: 'warning', path: `${toolPath}.attribution`, message: '"attribution" should be a string' });
      }
    }

    if (toolName === 'insetMap') {
      checkUnknownKeys(tc, KNOWN_KEYS.toolInsetMap, toolPath, warnings);

      if (tc.zoomOffset !== undefined && (typeof tc.zoomOffset !== 'number' || !Number.isFinite(tc.zoomOffset))) {
        warnings.push({ severity: 'warning', path: `${toolPath}.zoomOffset`, message: '"zoomOffset" should be a finite number' });
      }

      if (tc.baseScale !== undefined && (typeof tc.baseScale !== 'number' || !Number.isFinite(tc.baseScale) || tc.baseScale <= 0)) {
        warnings.push({ severity: 'warning', path: `${toolPath}.baseScale`, message: '"baseScale" should be a positive finite number' });
      }

      if (tc.styleUrl !== undefined && typeof tc.styleUrl !== 'string') {
        warnings.push({ severity: 'warning', path: `${toolPath}.styleUrl`, message: '"styleUrl" should be a string' });
      }

      if (tc.background !== undefined) {
        if (!isObject(tc.background)) {
          warnings.push({ severity: 'warning', path: `${toolPath}.background`, message: '"background" should be an object' });
        } else {
          const bg = tc.background as Record<string, unknown>;
          checkUnknownKeys(bg, KNOWN_KEYS.toolInsetMapBackground, `${toolPath}.background`, warnings);

          if (bg.service !== 'xyz') {
            warnings.push({ severity: 'warning', path: `${toolPath}.background.service`, message: 'Only "xyz" background service is currently supported' });
          }

          const hasUrl = typeof bg.url === 'string' && bg.url.length > 0;
          const hasTiles = Array.isArray(bg.tiles) && bg.tiles.length > 0 && bg.tiles.every((entry) => typeof entry === 'string' && entry.length > 0);

          if (!hasUrl && !hasTiles) {
            warnings.push({ severity: 'warning', path: `${toolPath}.background`, message: 'Provide either "url" or non-empty string array "tiles"' });
          }

          if (bg.url !== undefined && (typeof bg.url !== 'string' || bg.url.length === 0)) {
            warnings.push({ severity: 'warning', path: `${toolPath}.background.url`, message: '"url" should be a non-empty string when provided' });
          }

          if (bg.tiles !== undefined && !hasTiles) {
            warnings.push({ severity: 'warning', path: `${toolPath}.background.tiles`, message: '"tiles" should be a non-empty string array when provided' });
          }
          if (bg.attribution !== undefined && typeof bg.attribution !== 'string') {
            warnings.push({ severity: 'warning', path: `${toolPath}.background.attribution`, message: '"attribution" should be a string' });
          }
          if (bg.tileSize !== undefined && (typeof bg.tileSize !== 'number' || !Number.isFinite(bg.tileSize) || bg.tileSize <= 0)) {
            warnings.push({ severity: 'warning', path: `${toolPath}.background.tileSize`, message: '"tileSize" should be a positive finite number' });
          }
        }
      }
    }
  });
}

function validateToolMetadata(
  config: Record<string, unknown>,
  path: string,
  warnings: ValidationMessage[]
): void {
  if (config.label !== undefined && typeof config.label !== 'string') {
    warnings.push({ severity: 'warning', path: `${path}.label`, message: '"label" should be a string' });
  }
  if (config.title !== undefined && typeof config.title !== 'string') {
    warnings.push({ severity: 'warning', path: `${path}.title`, message: '"title" should be a string' });
  }
  validateToolIcon(config.icon, `${path}.icon`, warnings);
}

function validateToolIcon(
  icon: unknown,
  path: string,
  warnings: ValidationMessage[]
): void {
  if (icon === undefined) return;

  if (typeof icon === 'string') {
    if (icon.trim().length === 0) {
      warnings.push({ severity: 'warning', path, message: '"icon" should not be an empty string' });
    }
    return;
  }

  if (!isObject(icon)) {
    warnings.push({ severity: 'warning', path, message: '"icon" should be a string or an object with "name", "library", or "src"' });
    return;
  }

  const iconRecord = icon as Record<string, unknown>;
  if (iconRecord.name !== undefined && typeof iconRecord.name !== 'string') {
    warnings.push({ severity: 'warning', path: `${path}.name`, message: '"name" should be a string' });
  }
  if (iconRecord.library !== undefined && typeof iconRecord.library !== 'string') {
    warnings.push({ severity: 'warning', path: `${path}.library`, message: '"library" should be a string' });
  }
  if (iconRecord.src !== undefined && typeof iconRecord.src !== 'string') {
    warnings.push({ severity: 'warning', path: `${path}.src`, message: '"src" should be a string' });
  }
  if (iconRecord.name === undefined && iconRecord.src === undefined) {
    warnings.push({ severity: 'warning', path, message: '"icon" object should define either "name" or "src"' });
  }
}

function validateStoriesSection(
  stories: unknown,
  layerIds: Set<string>,
  errors: ValidationMessage[],
  warnings: ValidationMessage[]
): void {
  const path = 'stories';
  if (!isObject(stories)) {
    errors.push({ severity: 'error', path, message: '"stories" must be an object' });
    return;
  }

  if (!Array.isArray(stories.stories)) {
    errors.push({ severity: 'error', path: `${path}.stories`, message: '"stories.stories" must be an array' });
    return;
  }

  stories.stories.forEach((story, storyIndex) => {
    const storyPath = `${path}.stories[${storyIndex}]`;
    if (!isObject(story)) {
      errors.push({ severity: 'error', path: storyPath, message: 'Story entry must be an object' });
      return;
    }
    if (typeof story.name !== 'string' || story.name.length === 0) {
      errors.push({ severity: 'error', path: `${storyPath}.name`, message: '"name" must be a non-empty string' });
    }
    if (!Array.isArray(story.chapters)) {
      errors.push({ severity: 'error', path: `${storyPath}.chapters`, message: '"chapters" must be an array' });
      return;
    }

    story.chapters.forEach((chapter, chapterIndex) => {
      const chapterPath = `${storyPath}.chapters[${chapterIndex}]`;
      if (!isObject(chapter)) {
        errors.push({ severity: 'error', path: chapterPath, message: 'Chapter entry must be an object' });
        return;
      }
      if (typeof chapter.id !== 'string' || chapter.id.length === 0) {
        errors.push({ severity: 'error', path: `${chapterPath}.id`, message: '"id" must be a non-empty string' });
      }
      if (!Array.isArray(chapter.steps)) {
        errors.push({ severity: 'error', path: `${chapterPath}.steps`, message: '"steps" must be an array' });
        return;
      }

      chapter.steps.forEach((step, stepIndex) => {
        const stepPath = `${chapterPath}.steps[${stepIndex}]`;
        if (!isObject(step)) {
          errors.push({ severity: 'error', path: stepPath, message: 'Step entry must be an object' });
          return;
        }
        if (step.html !== undefined && step.htmlUrl !== undefined) {
          warnings.push({ severity: 'warning', path: stepPath, message: '"html" and "htmlUrl" are both set; "htmlUrl" takes precedence' });
        }

        const state = step.state;
        if (!isObject(state)) {
          errors.push({ severity: 'error', path: `${stepPath}.state`, message: '"state" must be an object' });
          return;
        }
        if (!Array.isArray(state.layers)) {
          errors.push({ severity: 'error', path: `${stepPath}.state.layers`, message: '"state.layers" must be an array of layer ids' });
        } else {
          state.layers.forEach((id) => {
            if (typeof id === 'string' && !layerIds.has(id)) {
              warnings.push({ severity: 'warning', path: `${stepPath}.state.layers`, message: `Layer "${id}" not found in layers` });
            }
          });
        }
        const view = state.view;
        if (!isObject(view) || !isCoordinate(view.center) || typeof view.zoom !== 'number') {
          errors.push({ severity: 'error', path: `${stepPath}.state.view`, message: '"state.view" must be { center: [lng, lat], zoom, bearing?, pitch? }' });
        }
      });
    });
  });
}

// Helper functions

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCoordinate(value: unknown): value is [number, number] {
  if (!Array.isArray(value) || value.length !== 2) return false;
  const [lon, lat] = value;
  return (
    typeof lon === 'number' &&
    typeof lat === 'number' &&
    lon >= -180 &&
    lon <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

function checkUnknownKeys(
  obj: Record<string, unknown>,
  knownKeys: string[],
  path: string,
  warnings: ValidationMessage[]
): void {
  Object.keys(obj).forEach((key) => {
    if (!knownKeys.includes(key)) {
      warnings.push({
        severity: 'warning',
        path: path ? `${path}.${key}` : key,
        message: `Unknown key "${key}"`,
      });
    }
  });
}

/**
 * Formats validation results as a human-readable string.
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push('✓ Configuration is valid');
  } else {
    lines.push('✗ Configuration has errors');
  }

  if (result.errors.length > 0) {
    lines.push(`\nErrors (${result.errors.length}):`);
    result.errors.forEach((e) => {
      lines.push(`  [ERROR] ${e.path}: ${e.message}`);
    });
  }

  if (result.warnings.length > 0) {
    lines.push(`\nWarnings (${result.warnings.length}):`);
    result.warnings.forEach((w) => {
      lines.push(`  [WARN]  ${w.path}: ${w.message}`);
    });
  }

  return lines.join('\n');
}
