// src/config/validator.ts
// Runtime validator for WebMapX configuration files

import type { AppConfig, SourceConfig, LayerConfig, TreeNodeConfig } from './types.js';

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
const KNOWN_KEYS = {
  root: ['map', 'catalog', 'tools'],
  map: ['label', 'center', 'zoom', 'minZoom', 'maxZoom', 'type', 'style', 'styleUrl'],
  catalog: ['label', 'tree', 'sources', 'layers'],
  treeNode: ['label', 'layerId', 'checked', 'expanded', 'children'],
  sourceBase: ['id', 'type', 'attribution'],
  sourceRaster: ['service', 'url', 'tileSize', 'minZoom', 'maxZoom', 'bounds', 'scheme', 'volatile', 'attribution'],
  sourceGeojson: ['data', 'attribution', 'minzoom', 'maxzoom', 'bounds', 'buffer', 'tolerance', 'cluster', 'clusterRadius', 'clusterMaxZoom', 'lineMetrics', 'generateId'],
  sourceVector: ['url', 'tiles', 'bounds', 'scheme', 'minzoom', 'maxzoom', 'attribution', 'volatile'],
  layer: ['id', 'layerset'],
  styleLayer: ['type', 'source', 'sourceLayer', 'minzoom', 'maxzoom', 'paint', 'layout', 'filter'],
  tool: ['enabled'],
};

const VALID_MAP_TYPES = ['maplibre', 'openlayers'];
const VALID_SOURCE_TYPES = ['raster', 'geojson', 'vector'];
const VALID_RASTER_SERVICES = ['xyz', 'wms', 'wmts'];
const VALID_LAYER_TYPES = ['fill', 'line', 'circle', 'symbol', 'raster'];

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

  // Validate catalog section
  const { sourceIds, layerIds } = validateCatalogSection(cfg.catalog, errors, warnings);

  // Validate tools section (optional)
  if (cfg.tools !== undefined) {
    validateToolsSection(cfg.tools, 'tools', warnings);
  }

  // Cross-reference validation is done within validateCatalogSection

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
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

  if (m.minzoom !== undefined && (typeof m.minzoom !== 'number' || m.minzoom < 0 || m.minzoom > 24)) {
    errors.push({ severity: 'error', path: `${path}.minzoom`, message: '"minzoom" must be a number between 0 and 24' });
  }
  if (m.maxzoom !== undefined && (typeof m.maxzoom !== 'number' || m.maxzoom < 0 || m.maxzoom > 24)) {
    errors.push({ severity: 'error', path: `${path}.maxzoom`, message: '"maxzoom" must be a number between 0 and 24' });
  }
  if (
    typeof m.minzoom === 'number' &&
    typeof m.maxzoom === 'number' &&
    m.minzoom > m.maxzoom
  ) {
    errors.push({ severity: 'error', path: `${path}.minzoom`, message: '"minzoom" cannot be greater than "maxzoom"' });
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
      if (typeof s.url !== 'string' || s.url.length === 0) {
        errors.push({ severity: 'error', path: `${path}.url`, message: 'Raster source requires a "url"' });
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
    } else if (s.type === 'geojson') {
      knownKeys.push(...KNOWN_KEYS.sourceGeojson);
      if (s.data === undefined) {
        errors.push({ severity: 'error', path: `${path}.data`, message: 'GeoJSON source requires "data"' });
      } else if (typeof s.data !== 'string' && !isObject(s.data)) {
        errors.push({ severity: 'error', path: `${path}.data`, message: '"data" must be a URL string or GeoJSON object' });
      }
    } else if (s.type === 'vector') {
      knownKeys.push(...KNOWN_KEYS.sourceVector);
      if (typeof s.url !== 'string' || s.url.length === 0) {
        errors.push({ severity: 'error', path: `${path}.url`, message: 'Vector source requires a "url"' });
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
    checkUnknownKeys(l, KNOWN_KEYS.layer, path, warnings);

    // Required: id
    if (typeof l.id !== 'string' || l.id.length === 0) {
      errors.push({ severity: 'error', path: `${path}.id`, message: 'Layer must have a non-empty string "id"' });
    } else {
      if (layerIds.has(l.id)) {
        errors.push({ severity: 'error', path: `${path}.id`, message: `Duplicate layer ID: "${l.id}"` });
      }
      layerIds.add(l.id);
    }

    // Required: layerset
    if (!Array.isArray(l.layerset)) {
      errors.push({ severity: 'error', path: `${path}.layerset`, message: 'Layer must have a "layerset" array' });
    } else if (l.layerset.length === 0) {
      warnings.push({ severity: 'warning', path: `${path}.layerset`, message: '"layerset" is empty' });
    } else {
      validateLayerset(l.layerset, `${path}.layerset`, sourceIds, errors, warnings);
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

    // Required: type
    if (!VALID_LAYER_TYPES.includes(sl.type as string)) {
      errors.push({
        severity: 'error',
        path: `${path}.type`,
        message: `Style layer "type" must be one of: ${VALID_LAYER_TYPES.join(', ')}`,
      });
    }

    // Required: source
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
    if (sl.minzoom !== undefined && (typeof sl.minzoom !== 'number' || sl.minzoom < 0 || sl.minzoom > 24)) {
      errors.push({ severity: 'error', path: `${path}.minzoom`, message: '"minzoom" must be a number between 0 and 24' });
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

  // Required: label
  if (typeof n.label !== 'string' || n.label.length === 0) {
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
}

function validateToolsSection(
  tools: unknown,
  path: string,
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
