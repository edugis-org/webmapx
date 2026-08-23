// src/utils/dynamic-layout.ts
// Builds the <webmapx-layout> contents (control groups, toolbars, tool
// panels and standalone tools) from a config's `tools` section.

import type { ToolIconConfig, ToolsConfig } from '../config/types.js';
import bufferIconUrl from '../icons/buffer.svg?url';

interface ToolbarItemConfig {
  id?: string;
  type?: string;
  enabled?: boolean;
  label?: string;
  title?: string;
  icon?: ToolIconConfig;
  keywords?: string | string[];
  items?: ToolbarItemConfig[];
  [key: string]: unknown;
}

interface ToolMetadata {
  label: string;
  icon?: ToolIconConfig;
}

type NormalizedToolIconConfig = Exclude<ToolIconConfig, string>;

export const TOOL_ELEMENT_TAGS: Record<string, string> = {
  layerTree: 'webmapx-layer-tree',
  search: 'webmapx-search-tool',
  measure: 'webmapx-measure-tool',
  settings: 'webmapx-settings',
  geolocation: 'webmapx-geolocation-tool',
  info: 'webmapx-info-tool',
  draw: 'webmapx-draw-tool',
  // One tool now: the projection picker decides what to offer from the engine.
  // The old type keeps working so configurations do not have to be rewritten.
  'view-mode': 'webmapx-projection-tool',
  projection: 'webmapx-projection-tool',
  cartogram: 'webmapx-cartogram-tool',
  '3d': 'webmapx-3d-tool',
  'import-layer': 'webmapx-import-layer-tool',
  layerOverview: 'webmapx-layer-overview',
  layerLegend3d: 'webmapx-layer-legend3d',
  maplanguage: 'webmapx-language-osmvector',
  print: 'webmapx-print-tool',
  truearea: 'webmapx-truearea-tool',
  routing: 'webmapx-routing-tool',
  isochrone: 'webmapx-isochrone-tool',
  toolbox: 'webmapx-toolbox-tool',
  menu: 'webmapx-menu-tool',
  buffer: 'webmapx-buffer-tool',
  geoprocessing: 'webmapx-geoprocessing-tool',
  stories: 'webmapx-stories-tool',
};

const DEFAULT_TOOL_METADATA: Record<string, ToolMetadata> = {
  search: { label: 'Search', icon: 'search' },
  layerTree: { label: 'Catalog', icon: 'layers' },
  layers: { label: 'Catalog', icon: 'layers' },
  catalog: { label: 'Catalog', icon: 'layers' },
  datacatalog: { label: 'Catalog', icon: 'layers' },
  measure: { label: 'Measure', icon: 'rulers' },
  info: { label: 'Feature info', icon: 'info-circle' },
  draw: { label: 'Draw', icon: 'pencil' },
  geolocation: { label: 'Geolocation', icon: 'crosshair' },
  geolocate: { label: 'Geolocation', icon: 'crosshair' },
  'view-mode': { label: 'Projection', icon: 'globe-americas' },
  projection: { label: 'Projection', icon: 'globe-americas' },
  cartogram: { label: 'Cartogram', icon: 'pie-chart' },
  '3d': { label: '3D', icon: 'box' },
  'import-layer': { label: 'Import layer', icon: 'file-earmark-arrow-up' },
  layerOverview: { label: 'Legend', icon: 'card-list' },
  legend: { label: 'Legend', icon: 'card-list' },
  layerLegend3d: { label: 'Legend 3D', icon: 'stack' },
  settings: { label: 'Settings', icon: 'gear' },
  maplanguage: { label: 'Map language', icon: 'translate' },
  print: { label: 'Print', icon: 'printer' },
  truearea: { label: 'True Area', icon: 'bounding-box-circles' },
  routing: { label: 'Routing', icon: 'signpost-split' },
  isochrone: { label: 'Isochrone', icon: 'broadcast' },
  toolbox: { label: 'Toolbox', icon: 'grid' },
  menu: { label: 'Tools', icon: 'list' },
  buffer: { label: 'Buffer', icon: { src: bufferIconUrl } },
  geoprocessing: { label: 'Analysis', icon: 'intersect' },
  stories: { label: 'Stories', icon: 'book' },
};

export const STANDALONE_TAGS: Record<string, string> = {
  scale: 'webmapx-scale-control',
  attribution: 'webmapx-attribution-control',
  coordinates: 'webmapx-coordinates-tool',
  navigation: 'webmapx-navigation-control',
  fullscreen: 'webmapx-fullscreen-control',
  zoomLevel: 'webmapx-zoom-level',
  spinner: 'webmapx-spinner',
  insetMap: 'webmapx-inset-map',
  maplanguage: 'webmapx-language-osmvector',
  activeAdapter: 'webmapx-active-adapter',
  'active-adapter': 'webmapx-active-adapter',
};

/**
 * Canonical tool list for the config editor — one entry per unique tool,
 * aliases excluded. Automatically stays in sync when tools are added/renamed here.
 */
export const KNOWN_TOOLS: Array<{ id: string; label: string; icon?: string | ToolIconConfig; standalone?: boolean }> = [
  { id: 'search',        label: 'Search',        icon: 'search' },
  { id: 'layerTree',     label: 'Catalog',        icon: 'layers' },
  { id: 'measure',       label: 'Measure',        icon: 'rulers' },
  { id: 'info',          label: 'Feature info',   icon: 'info-circle' },
  { id: 'draw',          label: 'Draw',           icon: 'pencil' },
  { id: 'geolocation',   label: 'Geolocation',    icon: 'crosshair' },
  { id: 'projection',    label: 'Projection',     icon: 'globe-americas' },
  { id: 'cartogram',     label: 'Cartogram',      icon: 'pie-chart' },
  { id: '3d',            label: '3D',             icon: 'box' },
  { id: 'import-layer',  label: 'Import layer',   icon: 'file-earmark-arrow-up' },
  { id: 'layerOverview', label: 'Legend',         icon: 'card-list' },
  { id: 'layerLegend3d', label: 'Legend 3D',      icon: 'stack' },
  { id: 'maplanguage',   label: 'Map language',   icon: 'translate' },
  { id: 'print',         label: 'Print',          icon: 'printer' },
  { id: 'truearea',      label: 'True Area',      icon: 'bounding-box-circles' },
  { id: 'routing',       label: 'Routing',        icon: 'signpost-split' },
  { id: 'isochrone',    label: 'Isochrone',      icon: 'broadcast' },
  { id: 'settings',      label: 'Settings',       icon: 'gear' },
  { id: 'toolbox',       label: 'Toolbox',        icon: 'grid' },
  { id: 'menu',          label: 'Menu',           icon: 'list' },
  { id: 'buffer',        label: 'Buffer',         icon: { src: bufferIconUrl } },
  { id: 'geoprocessing', label: 'Analysis',       icon: 'intersect' },
  { id: 'stories',       label: 'Stories',        icon: 'book' },
  { id: 'navigation',    label: 'Navigation',     icon: 'compass',     standalone: true },
  { id: 'scale',         label: 'Scale bar',      icon: 'rulers',      standalone: true },
  { id: 'coordinates',   label: 'Coordinates',    icon: 'crosshair2',  standalone: true },
  { id: 'fullscreen',    label: 'Fullscreen',     icon: 'fullscreen',  standalone: true },
  { id: 'zoomLevel',     label: 'Zoom level',     icon: 'zoom-in',     standalone: true },
  { id: 'attribution',   label: 'Attribution',    icon: 'info-circle', standalone: true },
  { id: 'insetMap',      label: 'Inset map',      icon: 'map',         standalone: true },
  { id: 'activeAdapter', label: 'Engine label',   icon: 'cpu',         standalone: true },
  { id: 'spinner',       label: 'Spinner',        icon: 'arrow-repeat',standalone: true },
];

function humanizeToolId(value: string | undefined): string {
  if (!value) return 'Tool';
  if (value === '3d') return '3D';
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function normalizeIconConfig(icon: ToolIconConfig | undefined): NormalizedToolIconConfig | undefined {
  if (!icon) return undefined;
  return typeof icon === 'string' ? { name: icon } : icon;
}

function resolveToolbarItemMetadata(item: ToolbarItemConfig): ToolMetadata {
  const defaultMetadata = DEFAULT_TOOL_METADATA[item.type ?? '']
    ?? DEFAULT_TOOL_METADATA[item.id ?? ''];

  return {
    label: item.label ?? item.title ?? defaultMetadata?.label ?? humanizeToolId(item.id ?? item.type),
    icon: item.icon ?? defaultMetadata?.icon,
  };
}

/**
 * Returns true when the given SVG src URL is same-origin (relative or matching
 * window.location.origin). Cross-origin SVGs injected via innerHTML can contain
 * scripts or on* event handlers — only same-origin sources are permitted.
 */
function isSameOriginSrc(src: string): boolean {
  try {
    // data: URIs are inline — no cross-origin risk
    if (src.startsWith('data:')) return true;
    // Relative URLs (no scheme) are always same-origin
    if (!src.includes('://')) return true;
    const url = new URL(src, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    return url.origin === origin;
  } catch {
    return false;
  }
}

function applyIconAttributes(iconEl: HTMLElement, icon: ToolIconConfig | undefined): boolean {
  const iconConfig = normalizeIconConfig(icon);
  if (!iconConfig) return false;

  let src = iconConfig.src;
  if (src && !isSameOriginSrc(src)) {
    console.warn(
      `[webmapx] Icon "src" blocked: cross-origin SVG URLs may contain executable code. ` +
      `Use a same-origin URL or a Shoelace named icon instead. Blocked: ${src}`
    );
    src = undefined;
  }

  setAttrs(iconEl, {
    name: iconConfig.name,
    library: iconConfig.library,
    src,
  });
  return Boolean(iconConfig.name || src);
}

function setAttrs(el: HTMLElement, attrs: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    el.setAttribute(key, value === true ? '' : String(value));
  }
}

/**
 * Item types that hold sub-tools rather than being a tool themselves.
 * `toolbox` renders them as a flat icon row, `menu` as a drill-in list.
 */
export const SUBTOOL_CONTAINER_TYPES = new Set(['toolbox', 'menu']);

interface SubToolGroup {
  path: string;
  label: string;
  icon?: ToolIconConfig;
}

/**
 * Appends a container's sub-tools as *direct* children of `containerEl`, at any
 * nesting depth: a nested container contributes its label/icon to `groups` and
 * its own items are flattened into the same parent, tagged with `menu-path`.
 * Both container components read a flat child list, so nesting never puts a
 * sub-tool out of reach of their content slot.
 */
function appendSubTools(
  containerEl: HTMLElement,
  items: ToolbarItemConfig[],
  kind: 'toolbox' | 'menu',
  pathPrefix: string,
  groups: SubToolGroup[]
): void {
  for (const item of items) {
    if (item.enabled === false) continue;
    const metadata = resolveToolbarItemMetadata(item);
    const itemId = String(item.id ?? item.type ?? '');
    if (!itemId) continue;

    if (item.type && SUBTOOL_CONTAINER_TYPES.has(item.type)) {
      const path = pathPrefix ? `${pathPrefix}/${itemId}` : itemId;
      groups.push({ path, label: metadata.label, icon: metadata.icon });
      appendSubTools(containerEl, Array.isArray(item.items) ? item.items : [], kind, path, groups);
      continue;
    }

    const tagName = item.type ? TOOL_ELEMENT_TAGS[item.type] : undefined;
    if (!tagName) continue;

    const subEl = document.createElement(tagName);
    subEl.setAttribute('tool-id', itemId);
    subEl.setAttribute('label', metadata.label);
    if (metadata.icon) {
      const iconConfig = normalizeIconConfig(metadata.icon);
      if (iconConfig?.name) subEl.setAttribute(`${kind}-icon`, iconConfig.name);
      if (kind === 'menu' && iconConfig?.src && isSameOriginSrc(iconConfig.src)) {
        subEl.setAttribute('menu-icon-src', iconConfig.src);
      }
      // Set as a pre-upgrade property; Lit replays it on upgrade for @property({ attribute: false })
      (subEl as unknown as Record<string, unknown>)['icon'] = metadata.icon;
    }
    if (item.keywords) {
      subEl.setAttribute(`${kind}-keywords`, String(item.keywords));
    }
    if (kind === 'menu' && pathPrefix) {
      subEl.setAttribute('menu-path', pathPrefix);
    }
    containerEl.appendChild(subEl);
  }
}

function buildToolbarGroup(config: Record<string, unknown>): HTMLElement {
  const panelConfig = config.panel as Record<string, unknown> | undefined;

  const group = document.createElement('webmapx-control-group');
  setAttrs(group, {
    slot: config.position,
    orientation: config.orientation ?? 'vertical',
    'panel-position': panelConfig?.position ?? 'after',
    alignment: config.alignment ?? 'start',
    priority: config.priority ?? 'normal',
  });

  const toolbar = document.createElement('webmapx-toolbar');
  setAttrs(toolbar, {
    'tooltip-placement': config.tooltipPlacement,
    orientation: config.orientation,
  });

  const panel = document.createElement('webmapx-tool-panel');
  if (panelConfig?.label) {
    panel.setAttribute('label', String(panelConfig.label));
  }

  const items = Array.isArray(config.items) ? (config.items as ToolbarItemConfig[]) : [];
  for (const item of items) {
    if (item.enabled === false) continue;

    if (item.type === 'spacer') {
      const spacer = document.createElement('div');
      spacer.style.flex = '1';
      spacer.style.pointerEvents = 'none';
      toolbar.appendChild(spacer);
      continue;
    }

    const metadata = resolveToolbarItemMetadata(item);
    const button = document.createElement('sl-button');
    setAttrs(button, {
      name: item.id,
      size: 'medium',
      'data-tooltip': metadata.label,
    });
    const icon = document.createElement('sl-icon');
    if (applyIconAttributes(icon, metadata.icon)) {
      icon.setAttribute('aria-hidden', 'true');
      button.appendChild(icon);
      const srLabel = document.createElement('span');
      srLabel.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
      srLabel.textContent = metadata.label;
      button.appendChild(srLabel);
    } else {
      button.textContent = metadata.label;
    }
    toolbar.appendChild(button);

    const tagName = item.type ? TOOL_ELEMENT_TAGS[item.type] : undefined;
    if (tagName) {
      const toolEl = document.createElement(tagName);
      toolEl.setAttribute('tool-id', String(item.id));
      toolEl.setAttribute('label', metadata.label);
      if (metadata.icon) {
        // Set as a pre-upgrade property; Lit replays it on upgrade for @property({ attribute: false })
        (toolEl as unknown as Record<string, unknown>)['icon'] = metadata.icon;
      }

      if (item.type && SUBTOOL_CONTAINER_TYPES.has(item.type)) {
        const kind = item.type as 'toolbox' | 'menu';
        const groups: SubToolGroup[] = [];
        appendSubTools(toolEl, Array.isArray(item.items) ? item.items : [], kind, '', groups);
        if (kind === 'menu' && groups.length > 0) {
          toolEl.setAttribute('groups', JSON.stringify(groups));
        }
      }

      panel.appendChild(toolEl);
    }
  }

  // Panel first in DOM so the toolbar (and its CSS tooltips) paints on top of
  // it; webmapx-control-group reverses the flex direction to keep the panel
  // visually on the side panel-position asks for.
  group.appendChild(panel);
  group.appendChild(toolbar);
  return group;
}

function buildStandalone(name: string, config: Record<string, unknown>): HTMLElement | null {
  const tagName = STANDALONE_TAGS[name];
  if (!tagName) return null;

  const el = document.createElement(tagName);
  el.setAttribute('slot', String(config.position));

  switch (name) {
    case 'scale':
      if (config.maxWidth !== undefined) el.setAttribute('max-width', String(config.maxWidth));
      if (config.margin) el.setAttribute('style', `--webmapx-tool-margin: ${config.margin}`);
      break;
    case 'navigation':
      if (config.direction) el.setAttribute('direction', String(config.direction));
      if (config.orientation) el.setAttribute('orientation', String(config.orientation));
      break;
    case 'insetMap':
      if (config.zoomOffset !== undefined) el.setAttribute('zoom-offset', String(config.zoomOffset));
      if (config.minimizable) el.setAttribute('minimizable', '');
      break;
    case 'maplanguage':
      // visible:false → tool still hooks addLayer and applies the language, just without the dropdown UI.
      if (config.visible === false || config.visible === 0) el.setAttribute('hide-ui', '');
      if (typeof config.language === 'string') el.setAttribute('language', config.language);
      break;
  }

  return el;
}

/**
 * Populates a <webmapx-layout> element with control groups and standalone
 * tools described by the config's `tools` section.
 */
export function buildLayoutFromConfig(layout: HTMLElement, tools: ToolsConfig | undefined): void {
  if (!tools) return;

  for (const [name, toolConfig] of Object.entries(tools)) {
    if (!toolConfig || typeof toolConfig !== 'object') continue;
    const config = toolConfig as Record<string, unknown>;
    if (config.enabled === false) continue;

    const knownMetadata = DEFAULT_TOOL_METADATA[name];
    const resolvedConfig = knownMetadata
      ? { ...config, label: config.label ?? knownMetadata.label, icon: config.icon ?? knownMetadata.icon }
      : config;

    if (resolvedConfig.type === 'toolbar') {
      layout.appendChild(buildToolbarGroup(resolvedConfig));
      continue;
    }

    const standalone = buildStandalone(name, resolvedConfig);
    if (standalone) {
      layout.appendChild(standalone);
    }
  }
}
