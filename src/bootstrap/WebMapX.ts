import { loadEngine } from './engine-loader.js';
import { loadTools } from './tool-loader.js';
import { loadPlugins } from './plugin-loader.js';
import { initI18n } from '../i18n/i18n.js';
import { loadLocale } from './locale-loader.js';
import type { WebMapXConfig, WebMapXMountOptions } from './types.js';
import type { WebmapxMapElement } from '../components/webmapx-map.js';
import type { AppConfig, ToolsConfig } from '../config/types.js';
import { parseAndValidateConfig } from '../config/loader.js';

const BLANK_STYLE = { version: 8 as const, sources: {}, layers: [] };

// Convert string array ['draw','measure'] → minimal ToolsConfig object for buildLayoutFromConfig
function toolArrayToConfig(tools: string[]): ToolsConfig {
  return {
    mainToolbar: { type: 'toolbar', enabled: true, position: 'top-left', items: tools.map(id => ({ tool: id })) },
  } as unknown as ToolsConfig;
}

export class WebMapX {
  static async mount(selector: string, options: WebMapXMountOptions): Promise<void> {
    // resolve config
    const config: WebMapXConfig = typeof options.config === 'string'
      ? await fetch(options.config).then(r => {
          if (!r.ok) throw new Error(`[webmapx] Failed to load config: ${options.config}`);
          return r.json();
        })
      : options.config;

    // init i18n (EN built-in, no fetch)
    await initI18n();

    // parallel: engine + tools + plugins
    const engine = config.engine ?? 'maplibre';
    const toolsList = Array.isArray(config.tools) ? config.tools as string[] : [];
    await Promise.all([
      loadEngine(engine),
      loadTools(toolsList),
      config.plugins?.length ? loadPlugins(config.plugins) : Promise.resolve(),
    ]);

    // locale after tools
    if (config.locale && config.locale !== 'en') {
      await loadLocale(config.locale);
    }

    // mount DOM structure
    const container = document.querySelector(selector);
    if (!container) throw new Error(`[webmapx] Mount target not found: "${selector}"`);
    container.innerHTML = `<webmapx-map adapter="${engine}"><webmapx-layout></webmapx-layout></webmapx-map>`;

    const mapEl = container.querySelector('webmapx-map') as WebmapxMapElement;
    const mapConfig = config.map as Record<string, unknown> | undefined;

    // strip bootstrap-only fields before normalizing as AppConfig
    const { engine: _e, tools: _t, locale: _l, plugins: _p, ...appRaw } = config as Record<string, unknown>;

    // build toolsConfig: array → object, or pass through if already object
    const toolsConfig: ToolsConfig | undefined = toolsList.length > 0
      ? toolArrayToConfig(toolsList)
      : (typeof _t === 'object' && !Array.isArray(_t) ? _t as ToolsConfig : undefined);

    // normalize + validate (converts object-keyed layers/sources to arrays, etc.)
    const appConfig = parseAndValidateConfig({
      ...appRaw,
      map: { type: engine, center: [0, 0], zoom: 2, ...mapConfig },
      ...(toolsConfig ? { tools: toolsConfig } : {}),
    }, 'WebMapX.mount');

    mapEl.setConfig(appConfig as AppConfig);

    // build layout from tools
    const layout = mapEl.querySelector('webmapx-layout');
    if (layout && layout.childElementCount === 0) {
      const { buildLayoutFromConfig } = await import('../utils/dynamic-layout.js');
      buildLayoutFromConfig(layout as HTMLElement, toolsConfig ?? appConfig.tools);
    }

    // trigger adapter creation + initialize map engine
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

    adapter.initialize(selector.replace(/^#/, ''), initOptions);
  }
}
