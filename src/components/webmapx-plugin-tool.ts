import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { WebmapxMapElement } from './webmapx-map';
import type { ToolConfig } from '../config/types';

/**
 * Config-driven plugin tool host.
 *
 * Place this element in a toolbar with a `tool-id` attribute matching a key in
 * the map's `tools` config. When the config is ready and the config entry has
 * an `element` field, this component instantiates that custom element and
 * forwards all config properties onto it.
 *
 * Example config:
 *   tools:
 *     bufferTool:
 *       enabled: true
 *       element: "my-buffer-tool"
 *       radius: 500
 *
 * Example HTML:
 *   <webmapx-plugin-tool tool-id="bufferTool"></webmapx-plugin-tool>
 *
 * The plugin's JS must be imported before or alongside this element so the
 * custom element is defined when instantiation occurs.
 */
@customElement('webmapx-plugin-tool')
export class WebmapxPluginTool extends LitElement {
  @property({ type: String, attribute: 'tool-id' }) toolId = '';

  private pluginElement: HTMLElement | null = null;
  private configReadyHandler = (e: Event) => this.handleConfigReady(e as CustomEvent);

  connectedCallback(): void {
    super.connectedCallback();
    const mapHost = this.closest('webmapx-map') as WebmapxMapElement | null;
    if (!mapHost) return;

    // Config may already be ready
    const config = mapHost.toolsConfig;
    if (config && this.toolId) {
      this.mountPlugin(config[this.toolId]);
      return;
    }

    mapHost.addEventListener('webmapx-config-ready', this.configReadyHandler);
  }

  disconnectedCallback(): void {
    const mapHost = this.closest('webmapx-map');
    mapHost?.removeEventListener('webmapx-config-ready', this.configReadyHandler);
    this.pluginElement = null;
    super.disconnectedCallback();
  }

  private handleConfigReady(e: CustomEvent): void {
    const config = e.detail?.config?.tools;
    if (!config || !this.toolId) return;
    this.mountPlugin(config[this.toolId]);
  }

  private mountPlugin(toolConfig: ToolConfig | undefined): void {
    if (!toolConfig?.enabled || !toolConfig.element) return;
    if (this.pluginElement) return; // already mounted

    const el = document.createElement(toolConfig.element) as HTMLElement;

    // Forward all extra config keys as properties
    for (const [key, value] of Object.entries(toolConfig)) {
      if (key === 'enabled' || key === 'element') continue;
      (el as unknown as Record<string, unknown>)[key] = value;
    }

    this.pluginElement = el;
    this.requestUpdate();
  }

  render() {
    if (!this.pluginElement) return html``;
    // Render via a container so Lit doesn't own the element lifecycle
    return html`<slot></slot>`;
  }

  protected updated(): void {
    if (this.pluginElement && !this.contains(this.pluginElement)) {
      this.appendChild(this.pluginElement);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'webmapx-plugin-tool': WebmapxPluginTool;
  }
}
