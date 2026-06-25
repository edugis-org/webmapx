import { html, css, TemplateResult } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';
import type { ToolIconConfig } from '../config/types';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';

interface ToolboxEntry {
  id: string;
  label: string;
  icon?: ToolIconConfig;
  keywords: string[];
  element: HTMLElement;
}

@customElement('webmapx-toolbox-tool')
export class WebmapxToolboxTool extends WebmapxBaseTool {
  readonly toolId = 'toolbox';

  @state() private activeSubToolId: string | null = null;
  @state() private searchQuery = '';
  @state() private showSearch = false;
  @state() private entries: ToolboxEntry[] = [];

  @query('.toolbox-scroll') private scrollEl?: HTMLElement;
  private resizeObserver?: ResizeObserver;

  static styles = css`
    :host {
      display: block;
    }

    .toolbox-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 4px;
      border-bottom: 1px solid var(--sl-color-neutral-200);
    }

    .toolbox-scroll {
      display: flex;
      flex-direction: row;
      overflow-x: auto;
      gap: 2px;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }

    .toolbox-scroll::-webkit-scrollbar {
      display: none;
    }

    .tool-btn {
      flex: 0 0 auto;
      min-width: var(--sl-input-height-medium);
    }

    .tool-btn[hidden] {
      display: none;
    }

    sl-input.search-input {
      --sl-input-height-medium: 28px;
      --sl-input-font-size-medium: var(--sl-font-size-small);
    }

    .tool-content-area {
      overflow: auto;
    }

    .tool-content-area ::slotted(*) {
      display: none;
    }

    .tool-content-area ::slotted([data-toolbox-active]) {
      display: block;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.indexEntries();
  }

  disconnectedCallback(): void {
    this.resizeObserver?.disconnect();
    super.disconnectedCallback();
  }

  protected firstUpdated(): void {
    this.checkOverflow();
    this.resizeObserver = new ResizeObserver(() => this.checkOverflow());
    if (this.scrollEl) this.resizeObserver.observe(this.scrollEl);
  }

  private indexEntries(): void {
    this.entries = [];
    for (const child of Array.from(this.children)) {
      const el = child as HTMLElement;
      const id = el.getAttribute('tool-id') ?? el.getAttribute('name') ?? (el as { toolId?: string }).toolId ?? null;
      if (!id) continue;
      const label = el.getAttribute('label') ?? id;
      const keywordsAttr = el.getAttribute('toolbox-keywords') ?? '';
      const keywords = keywordsAttr.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      keywords.push(label.toLowerCase(), id.toLowerCase());

      const iconName = el.getAttribute('toolbox-icon') ?? el.getAttribute('icon-name');
      const icon: ToolIconConfig | undefined = iconName ? { name: iconName } : undefined;

      this.entries.push({ id, label, icon, keywords, element: el });
      el.hidden = true;
      el.inert = true;
    }
  }

  private checkOverflow(): void {
    if (!this.scrollEl) return;
    const overflows = this.scrollEl.scrollWidth > this.scrollEl.clientWidth + 2;
    if (overflows !== this.showSearch) {
      this.showSearch = overflows;
    }
  }

  private get filteredEntries(): ToolboxEntry[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.entries;
    return this.entries.filter(e => e.keywords.some(k => k.includes(q)));
  }

  private activateSubTool(id: string): void {
    if (this.activeSubToolId === id) {
      this.deactivateSubTool();
      return;
    }

    // Deactivate previous
    if (this.activeSubToolId) {
      const prev = this.entries.find(e => e.id === this.activeSubToolId);
      if (prev) {
        prev.element.removeAttribute('data-toolbox-active');
        prev.element.hidden = true;
        prev.element.inert = true;
        if (typeof (prev.element as unknown as { deactivate?: () => void }).deactivate === 'function') {
          (prev.element as unknown as { deactivate: () => void }).deactivate();
        }
      }
    }

    this.activeSubToolId = id;
    const entry = this.entries.find(e => e.id === id);
    if (entry) {
      entry.element.setAttribute('data-toolbox-active', '');
      entry.element.hidden = false;
      entry.element.inert = false;
      if (typeof (entry.element as unknown as { activate?: () => void }).activate === 'function') {
        (entry.element as unknown as { activate: () => void }).activate();
      }
    }
  }

  private deactivateSubTool(): void {
    if (this.activeSubToolId) {
      const entry = this.entries.find(e => e.id === this.activeSubToolId);
      if (entry) {
        entry.element.removeAttribute('data-toolbox-active');
        entry.element.hidden = true;
        entry.element.inert = true;
        if (typeof (entry.element as unknown as { deactivate?: () => void }).deactivate === 'function') {
          (entry.element as unknown as { deactivate: () => void }).deactivate();
        }
      }
    }
    this.activeSubToolId = null;
  }

  // Called by webmapx-tool-panel when this tool becomes visible
  activate(): void {
    this.indexEntries();
  }

  // Called by webmapx-tool-panel when this tool is hidden
  deactivate(): void {
    this.deactivateSubTool();
  }

  protected onStateChanged(_state: IMapState): void {}

  private handleSearchInput(e: Event): void {
    this.searchQuery = (e.target as HTMLInputElement).value;
    this.requestUpdate();
  }

  private renderIcon(icon: ToolIconConfig | undefined, label: string): TemplateResult {
    if (icon) {
      const cfg = typeof icon === 'string' ? { name: icon } : icon;
      return html`
        <sl-icon name=${cfg.name ?? ''} library=${cfg.library ?? 'default'} aria-hidden="true"></sl-icon>
        <span style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0">${label}</span>
      `;
    }
    return html`${label}`;
  }

  protected render(): TemplateResult {
    const filtered = this.filteredEntries;

    return html`
      <div class="tool-content">
        <div class="toolbox-header">
          <div class="toolbox-scroll" @scroll=${() => this.checkOverflow()}>
            ${this.entries.map(entry => {
              const visible = filtered.includes(entry);
              const isActive = this.activeSubToolId === entry.id;
              return html`
                <sl-tooltip content=${entry.label} placement="bottom">
                  <sl-button
                    class="tool-btn"
                    size="medium"
                    variant=${isActive ? 'primary' : 'default'}
                    ?hidden=${!visible}
                    @click=${() => this.activateSubTool(entry.id)}
                  >
                    ${this.renderIcon(entry.icon, entry.label)}
                  </sl-button>
                </sl-tooltip>
              `;
            })}
          </div>
          ${this.showSearch ? html`
            <sl-input
              class="search-input"
              size="small"
              placeholder="Search tools…"
              clearable
              .value=${this.searchQuery}
              @sl-input=${this.handleSearchInput}
              @sl-clear=${() => { this.searchQuery = ''; this.requestUpdate(); }}
            >
              <sl-icon name="search" slot="prefix"></sl-icon>
            </sl-input>
          ` : ''}
        </div>
        <div class="tool-content-area">
          <slot @slotchange=${() => this.indexEntries()}></slot>
        </div>
      </div>
    `;
  }
}
