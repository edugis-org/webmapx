import { loadEngine } from './engine-loader.js';
import { loadTools } from './tool-loader.js';
import { loadPlugins } from './plugin-loader.js';
import { initI18n } from '../i18n/i18n.js';
import { loadLocale } from './locale-loader.js';
import type { WebMapXConfig, WebMapXMountOptions } from './types.js';
import type { WebmapxMapElement } from '../components/webmapx-map.js';
import type { AppConfig } from '../config/types.js';
import { parseAndValidateConfig } from '../config/loader.js';

const BLANK_STYLE = { version: 8 as const, sources: {}, layers: [] };

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
    await Promise.all([
      loadEngine(engine),
      loadTools(config.tools ?? []),
      config.plugins?.length ? loadPlugins(config.plugins) : Promise.resolve(),
    ]);

    // locale after tools (tools may register i18n keys)
    if (config.locale && config.locale !== 'en') {
      await loadLocale(config.locale);
    }

    // mount DOM structure
    const container = document.querySelector(selector);
    if (!container) throw new Error(`[webmapx] Mount target not found: "${selector}"`);
    container.innerHTML = `<webmapx-map adapter="${engine}"><webmapx-layout></webmapx-layout></webmapx-map>`;

    const mapEl = container.querySelector('webmapx-map') as WebmapxMapElement;
    const mapConfig = config.map as Record<string, unknown> | undefined;

    // normalize + validate config (converts object-keyed layers/sources to arrays, etc.)
    const appConfig = parseAndValidateConfig({
      ...config,
      map: { type: engine, center: [0, 0], zoom: 2, ...mapConfig },
    }, 'WebMapX.mount');

    mapEl.setConfig(appConfig);

    // build layout from tools config (same as app.js does)
    const layout = mapEl.querySelector('webmapx-layout');
    if (layout && layout.childElementCount === 0 && config.tools) {
      const { buildLayoutFromConfig } = await import('../utils/dynamic-layout.js');
      buildLayoutFromConfig(layout as HTMLElement, config.tools as never);
    }

    // trigger adapter creation + initialize the map engine
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
