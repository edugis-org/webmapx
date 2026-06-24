import { loadEngine } from './engine-loader.js';
import { loadTools } from './tool-loader.js';
import { loadPlugins } from './plugin-loader.js';
import { initI18n } from '../i18n/i18n.js';
import { loadLocale } from './locale-loader.js';
import type { WebMapXConfig, WebMapXMountOptions } from './types.js';
import type { WebmapxMapElement } from '../components/webmapx-map.js';
import type { AppConfig, ToolsConfig } from '../config/types.js';
import { parseAndValidateConfig } from '../config/loader.js';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import { isConfigEditEnabled } from '../utils/config-edit-mode.js';

declare const __WEBMAPX_VERSION__: string;
const SHOELACE_VERSION = '2';
const SHOELACE_CDN = `https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@${SHOELACE_VERSION}/cdn/`;

const BLANK_STYLE = { version: 8 as const, sources: {}, layers: [] };

function extractToolIds(tools: Record<string, unknown> | undefined): string[] {
  if (!tools) return [];
  const ids: string[] = [];
  for (const [key, value] of Object.entries(tools)) {
    if (!value || typeof value !== 'object') continue;
    const cfg = value as Record<string, unknown>;
    if (cfg.type === 'toolbar' && Array.isArray(cfg.items)) {
      for (const item of cfg.items) {
        if (item && typeof item === 'object' && typeof (item as Record<string, unknown>).type === 'string') {
          ids.push((item as Record<string, unknown>).type as string);
        }
      }
    } else if (typeof cfg.type === 'string') {
      ids.push(cfg.type as string);
    } else {
      ids.push(key);
    }
  }
  return ids;
}

function toolArrayToConfig(tools: string[]): ToolsConfig {
  return {
    mainToolbar: { type: 'toolbar', enabled: true, position: 'top-left', items: tools.map(id => ({ type: id, id })) },
  } as unknown as ToolsConfig;
}

export class WebMapX {
  static async mount(selector: string, options: WebMapXMountOptions): Promise<void> {
    const config: WebMapXConfig = typeof options.config === 'string'
      ? await fetch(options.config).then(r => {
          if (!r.ok) throw new Error(`[webmapx] Failed to load config: ${options.config}`);
          return r.json();
        })
      : options.config;

    setBasePath(SHOELACE_CDN);
    await initI18n();

    const engine = config.engine ?? 'maplibre';
    const toolsList = Array.isArray(config.tools) ? config.tools as string[] : [];
    const toolsToLoad = toolsList.length > 0
      ? toolsList
      : extractToolIds(config.tools as Record<string, unknown> | undefined);
    await Promise.all([
      loadEngine(engine),
      loadTools(toolsToLoad),
      config.plugins?.length ? loadPlugins(config.plugins) : Promise.resolve(),
    ]);

    if (config.locale && config.locale !== 'en') {
      await loadLocale(config.locale);
    }

    const container = document.querySelector(selector);
    if (!container) throw new Error(`[webmapx] Mount target not found: "${selector}"`);
    const baseId = selector.replace(/^#/, '').replace(/[^a-zA-Z0-9_-]/g, '-') || 'map';
    const mapId = `${baseId}-webmapx`;

    // Inject webmapx-map WITHOUT layout — layout is added AFTER MapLibre initializes
    // so it is always the last DOM child and therefore renders above the canvas.
    container.innerHTML = `<webmapx-map id="${mapId}" adapter="${engine}"></webmapx-map>`;
    const mapEl = container.querySelector('webmapx-map') as WebmapxMapElement;
    const mapConfig = config.map as Record<string, unknown> | undefined;

    const { engine: _e, tools: _t, locale: _l, plugins: _p, ...appRaw } = config as Record<string, unknown>;
    const toolsConfig: ToolsConfig | undefined = toolsList.length > 0
      ? toolArrayToConfig(toolsList)
      : (typeof _t === 'object' && !Array.isArray(_t) ? _t as ToolsConfig : undefined);

    const appConfig = parseAndValidateConfig({
      ...appRaw,
      map: { type: engine, center: [0, 0], zoom: 2, ...mapConfig },
      ...(toolsConfig ? { tools: toolsConfig } : {}),
    }, 'WebMapX.mount');

    mapEl.setConfig(appConfig as AppConfig);

    // Initialize map engine — MapLibre creates canvas inside the map-view div
    const adapter = await mapEl.getAdapterAsync?.();
    if (!adapter) {
      console.error('[webmapx] Adapter not available — check engine config.');
      return;
    }

    const styleConfig = (mapConfig?.style ?? BLANK_STYLE) as Record<string, unknown> | string;
    const runtimeMap = appConfig.runtimeMap;
    const initOptions: Record<string, unknown> = {
      center: mapConfig?.center ?? [0, 0],
      zoom: mapConfig?.zoom ?? 2,
      ...(mapConfig?.bearing != null ? { bearing: mapConfig.bearing } : {}),
      ...(mapConfig?.pitch != null ? { pitch: mapConfig.pitch } : {}),
      // runtimeMap takes priority over deprecated map.min/maxZoom/Pitch
      ...(runtimeMap?.minZoom ?? mapConfig?.minZoom) != null ? { minZoom: runtimeMap?.minZoom ?? mapConfig?.minZoom } : {},
      ...(runtimeMap?.maxZoom ?? mapConfig?.maxZoom) != null ? { maxZoom: runtimeMap?.maxZoom ?? mapConfig?.maxZoom } : {},
      ...(runtimeMap?.minPitch ?? mapConfig?.minPitch) != null ? { minPitch: runtimeMap?.minPitch ?? mapConfig?.minPitch } : {},
      ...(runtimeMap?.maxPitch ?? mapConfig?.maxPitch) != null ? { maxPitch: runtimeMap?.maxPitch ?? mapConfig?.maxPitch } : {},
      ...(typeof styleConfig === 'string' ? { styleUrl: styleConfig } : { style: styleConfig }),
    };

    adapter.initialize(mapId, initOptions);

    // NOW add the layout — it's the last child so it renders above the MapLibre canvas
    const layoutEl = document.createElement('webmapx-layout');
    mapEl.appendChild(layoutEl);

    const { buildLayoutFromConfig } = await import('../utils/dynamic-layout.js');
    buildLayoutFromConfig(layoutEl as HTMLElement, toolsConfig ?? appConfig.tools);

    const devTools = (config as Record<string, unknown>)._devTools as Record<string, unknown> | undefined;
    if (devTools?.['configedit'] === true || isConfigEditEnabled(0)) {
      await WebMapX._injectConfigEditTool(mapEl);
    }
  }

  /**
   * Injects the config-edit (and settings) tools into an already-mounted map.
   * Safe to call multiple times — idempotent.
   */
  static async enableConfigEditTool(selector: string): Promise<void> {
    const mapEl = document.querySelector(`${selector} webmapx-map`) as HTMLElement | null
      ?? document.querySelector(selector) as HTMLElement | null;
    if (!mapEl) throw new Error(`[webmapx] enableConfigEditTool: no element found for "${selector}"`);
    await WebMapX._injectConfigEditTool(mapEl);
  }

  private static async _injectConfigEditTool(mapEl: HTMLElement): Promise<void> {
    await import('../components/webmapx-config-edit-tool.js');

    let layout = mapEl.querySelector('webmapx-layout') as HTMLElement | null;
    if (!layout) {
      layout = document.createElement('webmapx-layout');
      mapEl.appendChild(layout);
    }

    let group = layout.querySelector('webmapx-control-group[slot="top-left"]') as HTMLElement | null;
    let toolbar = group?.querySelector('webmapx-toolbar') as HTMLElement | null;
    let panel = group?.querySelector('webmapx-tool-panel') as HTMLElement | null;

    if (!group) {
      group = document.createElement('webmapx-control-group');
      group.setAttribute('slot', 'top-left');
      group.setAttribute('orientation', 'vertical');
      group.setAttribute('panel-position', 'after');
      toolbar = document.createElement('webmapx-toolbar');
      panel = document.createElement('webmapx-tool-panel');
      group.appendChild(toolbar);
      group.appendChild(panel);
      layout.appendChild(group);
    }
    if (!toolbar) { toolbar = document.createElement('webmapx-toolbar'); group.prepend(toolbar); }
    if (!panel)   { panel   = document.createElement('webmapx-tool-panel'); group.appendChild(panel); }

    if (!toolbar.querySelector('[name="settings"]')) {
      await import('../components/webmapx-settings.js');
      const btn = document.createElement('sl-button');
      btn.setAttribute('name', 'settings');
      btn.setAttribute('circle', '');
      btn.title = 'Settings';
      btn.innerHTML = '<sl-icon name="gear"></sl-icon>';
      toolbar.appendChild(btn);
      const tool = document.createElement('webmapx-settings');
      tool.setAttribute('tool-id', 'settings');
      panel.appendChild(tool);
    }

    if (!toolbar.querySelector('[name="configedit"]')) {
      const btn = document.createElement('sl-button');
      btn.setAttribute('name', 'configedit');
      btn.setAttribute('circle', '');
      btn.title = 'Edit config';
      btn.innerHTML = '<sl-icon name="pencil-square"></sl-icon>';
      toolbar.appendChild(btn);
      const tool = document.createElement('webmapx-config-edit-tool');
      tool.setAttribute('tool-id', 'configedit');
      panel.appendChild(tool);
    }
  }
}
