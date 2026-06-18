// src/utils/dynamic-layout.ts
// Builds the <webmapx-layout> contents (control groups, toolbars, tool
// panels and standalone tools) from a config's `tools` section.

import type { ToolsConfig } from '../config/types.js';

interface ToolbarItemConfig {
  id?: string;
  type?: string;
  enabled?: boolean;
  title?: string;
  icon?: string;
  [key: string]: unknown;
}

const TOOL_ELEMENT_TAGS: Record<string, string> = {
  layerTree: 'webmapx-layer-tree',
  search: 'webmapx-search-tool',
  measure: 'webmapx-measure-tool',
  settings: 'webmapx-settings',
  geolocation: 'webmapx-geolocation-tool',
  info: 'webmapx-info-tool',
  draw: 'webmapx-draw-tool',
  'view-mode': 'webmapx-view-mode-tool',
  '3d': 'webmapx-3d-tool',
  addLayer: 'webmapx-add-layer-tool',
  layerOverview: 'webmapx-layer-overview',
  maplanguage: 'webmapx-language-osmvector',
  print: 'webmapx-print-tool',
};

const STANDALONE_TAGS: Record<string, string> = {
  scale: 'webmapx-scale-control',
  attribution: 'webmapx-attribution-control',
  coordinates: 'webmapx-coordinates-tool',
  navigation: 'webmapx-navigation-control',
  fullscreen: 'webmapx-fullscreen-control',
  zoomLevel: 'webmapx-zoom-level',
  spinner: 'webmapx-spinner',
  insetMap: 'webmapx-inset-map',
  maplanguage: 'webmapx-language-osmvector',
};

function setAttrs(el: HTMLElement, attrs: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    el.setAttribute(key, value === true ? '' : String(value));
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

    const button = document.createElement('sl-button');
    setAttrs(button, {
      name: item.id,
      size: 'medium',
      'data-tooltip': item.title,
      'aria-label': item.title,
    });
    const icon = document.createElement('sl-icon');
    setAttrs(icon, { name: item.icon, label: item.title });
    button.appendChild(icon);
    toolbar.appendChild(button);

    const tagName = item.type ? TOOL_ELEMENT_TAGS[item.type] : undefined;
    if (tagName) {
      const toolEl = document.createElement(tagName);
      toolEl.setAttribute('tool-id', String(item.id));
      panel.appendChild(toolEl);
    }
  }

  group.appendChild(toolbar);
  group.appendChild(panel);
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

    if (config.type === 'toolbar') {
      layout.appendChild(buildToolbarGroup(config));
      continue;
    }

    const standalone = buildStandalone(name, config);
    if (standalone) {
      layout.appendChild(standalone);
    }
  }
}
