import { loadEngine } from './engine-loader.js';
import { loadTools } from './tool-loader.js';
import { loadPlugins } from './plugin-loader.js';
import { initI18n } from '../i18n/i18n.js';
import { loadLocale } from './locale-loader.js';
import type { WebMapXConfig, WebMapXMountOptions } from './types.js';
import type { WebmapxMapElement } from '../components/webmapx-map.js';
import type { AppConfig } from '../config/types.js';

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

    // mount — structure mirrors the HTML used in index.html:
    //   <webmapx-map adapter="..."><webmapx-layout></webmapx-layout></webmapx-map>
    const container = document.querySelector(selector);
    if (!container) throw new Error(`[webmapx] Mount target not found: "${selector}"`);
    container.innerHTML = `<webmapx-map adapter="${engine}"><webmapx-layout></webmapx-layout></webmapx-map>`;

    const mapEl = container.querySelector('webmapx-map') as WebmapxMapElement;

    // setConfig hands the full config to the map element and its child tools.
    // Cast is safe: WebMapXConfig is a superset of AppConfig's shape at runtime.
    mapEl.setConfig(config as unknown as AppConfig);
  }
}
