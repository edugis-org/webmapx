import { html, css, svg, nothing, LitElement } from 'lit';
import { WebmapxBaseTool } from '../components/webmapx-base-tool.js';
import { WebmapxModalTool } from '../components/webmapx-modal-tool.js';
import { registerTool } from '../tools/tool-registry.js';
import { i18n, t } from '../i18n/i18n.js';
import { resolvePluginUrl, TRUSTED_CDN_PREFIXES } from './plugin-url.js';
import { setConfigPluginLoader } from '../config/loader.js';

/**
 * What a plugin's `register(api)` receives.
 *
 * A plugin gets webmapx's own classes handed to it rather than importing them,
 * because an import from a CDN or a second bundle is a *second copy* of webmapx:
 * its registry, its ToolManager and its Lit are different objects from the ones
 * this page runs, so a tool registered or extended through that copy would be
 * invisible here. Handing over the live instances also means a plugin can be
 * one plain `.js` file with no build step and no import map.
 */
export interface WebmapxPluginApi {
  registerTool: typeof registerTool;
  WebmapxBaseTool: typeof WebmapxBaseTool;
  WebmapxModalTool: typeof WebmapxModalTool;
  LitElement: typeof LitElement;
  html: typeof html;
  css: typeof css;
  svg: typeof svg;
  nothing: typeof nothing;
  i18n: typeof i18n;
  t: typeof t;
}

export const pluginApi: WebmapxPluginApi = Object.freeze({
  registerTool, WebmapxBaseTool, WebmapxModalTool, LitElement, html, css, svg, nothing, i18n, t,
});

const loaded = new Map<string, Promise<void>>();

/**
 * Imports each plugin and calls its `register(api)`.
 *
 * Must finish before a config is validated or its layout built: that is when a
 * plugin's tool ids have to be known, or the validator reports them unknown and
 * the toolbar builder skips them. A plugin is imported once per page however
 * many maps or reloads of the setup preview name it.
 */
export async function loadPlugins(plugins: unknown, baseUrl: string = typeof document !== 'undefined' ? document.baseURI : ''): Promise<void> {
  if (!Array.isArray(plugins)) return;
  for (const url of plugins) {
    if (typeof url !== 'string' || !url.trim()) continue;
    const resolved = resolvePluginUrl(url.trim(), baseUrl);
    if (!resolved) {
      console.warn(`[webmapx] Plugin skipped — not same-origin and not from a trusted CDN: ${url}`);
      console.warn('[webmapx] Allowed CDNs: ' + TRUSTED_CDN_PREFIXES.join(', '));
      continue;
    }
    let pending = loaded.get(resolved);
    if (!pending) {
      pending = importAndRegister(resolved);
      loaded.set(resolved, pending);
    }
    await pending;
  }
}

async function importAndRegister(url: string): Promise<void> {
  try {
    const mod = await import(/* @vite-ignore */ url);
    const register = mod.default?.register ?? mod.register;
    if (typeof register !== 'function') {
      console.warn(`[webmapx] Plugin has no register() export: ${url}`);
      return;
    }
    await register(pluginApi);
  } catch (e) {
    console.error(`[webmapx] Failed to load plugin: ${url}`, e);
  }
}

// Every config fetched through the config loader (a `?config=` URL, a map's
// `src`) has its plugins loaded before validation, once this module is part
// of the page — which every bootstrap entry point makes it.
setConfigPluginLoader(loadPlugins);
