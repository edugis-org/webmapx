import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { WebmapxMapElement } from './webmapx-map';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

@customElement('webmapx-tool-panel')
export class WebmapxToolPanel extends LitElement {
  @property({ type: String }) label = 'Tools';
  @property({ type: Boolean, reflect: true }) active = false;

  private defaultLabel = 'Tools';
  private activeToolId: string | null = null;
  private toolIndex: Map<string, { element: HTMLElement; label: string }> = new Map();
  private mapHost: WebmapxMapElement | null = null;
  private boundHandleToolActivated = (e: Event) => this.handleToolActivated(e as CustomEvent);
  private boundHandleToolDeactivated = (e: Event) => this.handleToolDeactivated(e as CustomEvent);
  private boundHandleToolSelect = (e: Event) => this.handleToolSelect(e as CustomEvent);

  connectedCallback(): void {
    super.connectedCallback();
    this.defaultLabel = this.label || 'Tools';
    this.hideAllTools();
    this.mapHost = this.closest('webmapx-map') as WebmapxMapElement | null;
    this.mapHost?.addEventListener('webmapx-tool-activated', this.boundHandleToolActivated);
    this.mapHost?.addEventListener('webmapx-tool-deactivated', this.boundHandleToolDeactivated);
    this.mapHost?.addEventListener('webmapx-tool-select', this.boundHandleToolSelect);
    this.addEventListener('webmapx-content-updated', this.handleContentUpdated as EventListener);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.mapHost?.removeEventListener('webmapx-tool-activated', this.boundHandleToolActivated);
    this.mapHost?.removeEventListener('webmapx-tool-deactivated', this.boundHandleToolDeactivated);
    this.mapHost?.removeEventListener('webmapx-tool-select', this.boundHandleToolSelect);
    this.mapHost = null;
    this.removeEventListener('webmapx-content-updated', this.handleContentUpdated as EventListener);
  }

  protected firstUpdated(): void {
    const slot = this.shadowRoot?.querySelector('slot');
    const elements = (slot as HTMLSlotElement | null)?.assignedElements({ flatten: true }) ?? [];
    this.indexTools(elements);
    this.syncActiveTool();
  }

  private handleContentUpdated(): void {
    const panelContent = this.shadowRoot?.querySelector('.panel-content');
    if (panelContent) {
      // Use requestAnimationFrame to ensure layout is settled before scrolling
      requestAnimationFrame(() => {
        panelContent.scrollTop = panelContent.scrollHeight;
      });
    }
  }

  private handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement | null;
    const elements = slot?.assignedElements({ flatten: true }) ?? [];
    this.indexTools(elements);
    this.syncActiveTool();
  }

  private indexTools(elements: Element[]): void {
    this.toolIndex.clear();
    elements.forEach((element) => {
      const toolId = this.resolveToolId(element);
      if (!toolId) {
        return;
      }
      const label = this.resolveToolLabel(toolId, element);
      this.toolIndex.set(toolId, { element: element as HTMLElement, label });
    });
  }

  private resolveToolId(element: Element): string | null {
    const attrToolId =
      element.getAttribute('tool-id') ||
      element.getAttribute('data-tool') ||
      element.getAttribute('name');
    if (attrToolId) return attrToolId;
    const propertyToolId = (element as { toolId?: unknown }).toolId;
    if (typeof propertyToolId === 'string' && propertyToolId) {
      return propertyToolId;
    }
    return null;
  }

  private resolveToolLabel(toolId: string, element: Element): string {
    const attrLabel =
      element.getAttribute('panel-label') ||
      element.getAttribute('data-label') ||
      element.getAttribute('label');
    if (attrLabel) return attrLabel;
    return toolId ? toolId.charAt(0).toUpperCase() + toolId.slice(1) : this.defaultLabel;
  }

  private hideAllTools(): void {
    Array.from(this.children).forEach((child) => {
      (child as HTMLElement).hidden = true;
    });
  }

  private applyVisibility(): void {
    this.toolIndex.forEach(({ element }, toolId) => {
      element.hidden = toolId !== this.activeToolId;
    });

    if (this.activeToolId && this.toolIndex.has(this.activeToolId)) {
      const tool = this.toolIndex.get(this.activeToolId);
      if (tool) {
        this.label = tool.label;
      }
      this.active = true;
      return;
    }

    this.label = this.defaultLabel;
    this.active = false;
  }

  private syncActiveTool(): void {
    if (this.activeToolId) {
      this.applyVisibility();
      return;
    }
    const modalActive = this.mapHost?.toolManager?.activeToolId ?? null;
    if (modalActive && this.toolIndex.has(modalActive)) {
      this.activeToolId = modalActive;
    }
    this.applyVisibility();
  }

  private handleToolActivated(e: CustomEvent): void {
    const toolId = e.detail?.toolId as string | undefined;
    if (!toolId || !this.toolIndex.has(toolId)) {
      return;
    }
    this.activeToolId = toolId;
    this.applyVisibility();
  }

  private handleToolDeactivated(e: CustomEvent): void {
    const toolId = e.detail?.toolId as string | undefined;
    if (!toolId || this.activeToolId !== toolId) {
      return;
    }
    this.activeToolId = null;
    this.applyVisibility();
  }

  private handleToolSelect(e: CustomEvent): void {
    const toolId = (e.detail?.toolId as string | null | undefined) ?? null;
    if (toolId && this.mapHost?.toolManager?.getTool(toolId)) {
      return;
    }

    if (!toolId) {
      this.activeToolId = null;
      this.applyVisibility();
      return;
    }

    if (!this.toolIndex.has(toolId)) {
      return;
    }

    this.activeToolId = toolId;
    this.applyVisibility();
  }

  static styles = css`
    :host {
      display: none;
      box-sizing: border-box;
      flex-direction: column;
      width: 300px;
      max-height: 100%;
      min-height: calc(
        var(--webmapx-panel-header-min-height, 3rem) +
        var(--webmapx-panel-min-content, 8px)
      );
      background: var(--webmapx-panel-bg, var(--sl-color-neutral-0, #fff));
      border: 1px solid var(--sl-color-neutral-200, #e5e5e5);
      box-shadow: var(--sl-shadow-medium);
      pointer-events: auto;
      overflow: hidden; /* clamp host; inner content manages scroll */
    }

    :host([active]) {
      display: flex;      
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 1rem;
      border-bottom: 1px solid var(--sl-color-neutral-200, #e5e5e5);
      background: var(--sl-color-neutral-50, #f9f9f9);
      flex-shrink: 0;
    }

    .panel-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: var(--sl-font-weight-semibold, 600);
      color: var(--sl-color-neutral-900, #333);
    }

    .panel-content {
      box-sizing: border-box;
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
    }

    ::slotted([hidden]) {
      display: none !important;
    }

  `;
  private handleClose() {
    this.activeToolId = null;
    this.applyVisibility();
    this.dispatchEvent(new CustomEvent('webmapx-panel-close', {
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <div class="panel-header">
        <h3>${this.label}</h3>
        <sl-button size="small" circle variant="text" @click=${this.handleClose}>
          <sl-icon name="x-lg" label="Close"></sl-icon>
        </sl-button>
      </div>
      <div class="panel-content">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }
}
