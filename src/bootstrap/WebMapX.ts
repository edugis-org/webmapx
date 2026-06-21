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

declare const __WEBMAPX_VERSION__: string;
const SHOELACE_VERSION = '2';
const SHOELACE_CDN = `https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@${SHOELACE_VERSION}/cdn/`;

const BLANK_STYLE = { version: 8 as const, sources: {}, layers: [] };

function toolArrayToConfig(tools: string[]): ToolsConfig {
  return {
    mainToolbar: { type: 'toolbar', enabled: true, position: 'top-left', items: tools.map(id => ({ type: id })) },
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
    await Promise.all([
      loadEngine(engine),
      loadTools(toolsList),
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
    const initOptions: Record<string, unknown> = {
      center: mapConfig?.center ?? [0, 0],
      zoom: mapConfig?.zoom ?? 2,
      ...(mapConfig?.bearing != null ? { bearing: mapConfig.bearing } : {}),
      ...(mapConfig?.pitch != null ? { pitch: mapConfig.pitch } : {}),
      ...(mapConfig?.minZoom != null ? { minZoom: mapConfig.minZoom } : {}),
      ...(mapConfig?.maxZoom != null ? { maxZoom: mapConfig.maxZoom } : {}),
      ...(typeof styleConfig === 'string' ? { styleUrl: styleConfig } : { style: styleConfig }),
    };

    adapter.initialize(mapId, initOptions);

    // NOW add the layout — it's the last child so it renders above the MapLibre canvas
    const layoutEl = document.createElement('webmapx-layout');
    mapEl.appendChild(layoutEl);

    const { buildLayoutFromConfig } = await import('../utils/dynamic-layout.js');
    buildLayoutFromConfig(layoutEl as HTMLElement, toolsConfig ?? appConfig.tools);
  }
}
