import { loadEngine } from './engine-loader.js';
import { loadTools, extractToolIds } from './tool-loader.js';
import { loadPlugins } from './plugin-loader.js';
import { initI18n } from '../i18n/i18n.js';
import { loadLocale } from './locale-loader.js';
import type { WebMapXConfig, WebMapXMountOptions } from './types.js';
import type { WebmapxMapElement } from '../components/webmapx-map.js';
import type { AppConfig, ToolsConfig } from '../config/types.js';
import { parseAndValidateConfig } from '../config/loader.js';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import { isConfigEditEnabled } from '../utils/config-edit-mode.js';
import { getMapDomIndex, getPermalinkStateForIndex } from '../utils/permalink.js';
import { resolveInitOptions } from './resolve-init-options.js';
import { injectConfigEditTool } from './inject-config-edit-tool.js';

declare const __WEBMAPX_VERSION__: string;
const SHOELACE_VERSION = '2';
const SHOELACE_CDN = `https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@${SHOELACE_VERSION}/cdn/`;

const BLANK_STYLE = { version: 8 as const, sources: {}, layers: [] };

function toolArrayToConfig(tools: string[]): ToolsConfig {
  return {
    mainToolbar: { type: 'toolbar', enabled: true, position: 'top-left', items: tools.map(id => ({ type: id, id })) },
  } as unknown as ToolsConfig;
}

export class WebMapX {
  static async mount(selector: string, options: WebMapXMountOptions): Promise<void> {
    // Base for resolving relative resource paths inside the config. For a URL
    // string that is the fetch response URL (final, absolute, post-redirect);
    // for a config object it is whatever the caller says it came from, falling
    // back to the page URL for inline configs with no file of their own.
    let configUrl = options.configUrl;
    let config: WebMapXConfig;
    if (typeof options.config === 'string') {
      const response = await fetch(options.config);
      if (!response.ok) throw new Error(`[webmapx] Failed to load config: ${options.config}`);
      config = await response.json();
      configUrl = response.url;
    } else {
      config = options.config;
    }

    setBasePath(SHOELACE_CDN);
    await initI18n();

    // `map.type` is the engine a config declares (the validator requires it), and
    // it is what every other entry point honours. Reading only a top-level
    // `engine` key meant a config saying `"type": "openlayers"` was mounted in
    // MapLibre by this API alone — silently, and with every projection the
    // config asked for dropped on the way, since MapLibre draws only Mercator
    // and its globe.
    const mapEngine = (config.map as { type?: string } | undefined)?.type;
    const engine = config.engine ?? mapEngine ?? 'maplibre';
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
    }, 'WebMapX.mount', configUrl);

    mapEl.setConfig(appConfig as AppConfig);

    // Initialize map engine — MapLibre creates canvas inside the map-view div
    const adapter = await mapEl.getAdapterAsync?.();
    if (!adapter) {
      console.error('[webmapx] Adapter not available — check engine config.');
      return;
    }

    const styleConfig = (mapConfig?.style ?? BLANK_STYLE) as Record<string, unknown> | string;
    const runtimeMap = appConfig.runtimeMap;

    // Permalink viewport/projection takes highest priority — resolved before init so the
    // engine never renders at the config's default center/zoom. Shared with src/app.js so
    // every mount path behaves identically.
    const permalinkState = getPermalinkStateForIndex(getMapDomIndex(mapEl));
    const initOptions = await resolveInitOptions({
      mapConfig: {
        center: mapConfig?.center as [number, number] | undefined,
        zoom: mapConfig?.zoom as number | undefined,
        bearing: mapConfig?.bearing as number | undefined,
        pitch: mapConfig?.pitch as number | undefined,
        // runtimeMap takes priority over deprecated map.min/maxZoom/Pitch
        minZoom: (runtimeMap?.minZoom ?? mapConfig?.minZoom) as number | undefined,
        maxZoom: (runtimeMap?.maxZoom ?? mapConfig?.maxZoom) as number | undefined,
        minPitch: (runtimeMap?.minPitch ?? mapConfig?.minPitch) as number | undefined,
        maxPitch: (runtimeMap?.maxPitch ?? mapConfig?.maxPitch) as number | undefined,
        maxBounds: runtimeMap?.maxBounds,
        style: styleConfig,
        projection: mapConfig?.projection as string | undefined,
        // The sea under palaeo-coastlines and the space around the globe. This
        // list is written out field by field, so a key missing from it is
        // dropped in silence: `map.backgroundColor` reached `src/app.js` and
        // not this path, and the same config came up blue on the app and black
        // on every page that mounts through here — the tool documentation, the
        // demo host, and anything else embedding a map.
        backgroundColor: mapConfig?.backgroundColor as string | undefined,
      },
      permalinkState,
    });

    adapter.initialize(mapId, initOptions);

    // NOW add the layout — it's the last child so it renders above the MapLibre canvas
    const layoutEl = document.createElement('webmapx-layout');
    mapEl.appendChild(layoutEl);

    const { buildLayoutFromConfig } = await import('../utils/dynamic-layout.js');
    buildLayoutFromConfig(layoutEl as HTMLElement, toolsConfig ?? appConfig.tools);

    const devTools = (config as Record<string, unknown>)._devTools as Record<string, unknown> | undefined;
    if (devTools?.['configedit'] === true || isConfigEditEnabled(0)) {
      await injectConfigEditTool(mapEl);
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
    await injectConfigEditTool(mapEl);
  }
}
