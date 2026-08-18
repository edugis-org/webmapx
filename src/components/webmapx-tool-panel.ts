import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { WebmapxMapElement } from './webmapx-map';
import {
  isToolSelectFromDifferentToolbar,
  type ToolSelectEventDetail
} from './internal/tool-selection-scope';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import { controlSurfaceStyles } from './internal/control-surface-styles';

@customElement('webmapx-tool-panel')
export class WebmapxToolPanel extends LitElement {
  @property({ type: String }) label = 'Tools';
  @property({ type: Boolean, reflect: true }) active = false;
  @property({ type: Boolean, reflect: true }) collapsed = false;

  private defaultLabel = 'Tools';
  private activeToolId: string | null = null;
  private toolIndex: Map<string, { element: HTMLElement; label: string }> = new Map();
  private mapHost: WebmapxMapElement | null = null;
  private boundHandleToolActivated = (e: Event) => this.handleToolActivated(e as CustomEvent);
  private boundHandleToolDeactivated = (e: Event) => this.handleToolDeactivated(e as CustomEvent);
  private boundHandleToolSelect = (e: Event) => this.handleToolSelect(e as CustomEvent);
  private boundHandleKeydown = (e: Event) => this.handleKeydown(e as KeyboardEvent);
  private boundHandlePanelWidth = (e: Event) => this.handlePanelWidth(e as CustomEvent);
  /** CSS width of the panel host while collapsed to its default (no active-tool override). */
  private static readonly DEFAULT_WIDTH = '300px';
  /** The toolbar button that last activated a tool — focus is restored here on close. */
  private triggerButton: HTMLElement | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'region');
    this.defaultLabel = this.label || 'Tools';
    this.hideAllTools();
    this.mapHost = this.closest('webmapx-map') as WebmapxMapElement | null;
    this.mapHost?.addEventListener('webmapx-tool-activated', this.boundHandleToolActivated);
    this.mapHost?.addEventListener('webmapx-tool-deactivated', this.boundHandleToolDeactivated);
    this.mapHost?.addEventListener('webmapx-tool-select', this.boundHandleToolSelect);
    document.addEventListener('keydown', this.boundHandleKeydown, { capture: true });
    this.addEventListener('webmapx-content-updated', this.handleContentUpdated as EventListener);
    this.addEventListener('webmapx-panel-width', this.boundHandlePanelWidth);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.mapHost?.removeEventListener('webmapx-tool-activated', this.boundHandleToolActivated);
    this.mapHost?.removeEventListener('webmapx-tool-deactivated', this.boundHandleToolDeactivated);
    this.mapHost?.removeEventListener('webmapx-tool-select', this.boundHandleToolSelect);
    document.removeEventListener('keydown', this.boundHandleKeydown, { capture: true });
    this.mapHost = null;
    this.removeEventListener('webmapx-content-updated', this.handleContentUpdated as EventListener);
    this.removeEventListener('webmapx-panel-width', this.boundHandlePanelWidth);
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
      const el = child as HTMLElement;
      el.hidden = true;
      el.inert = true;
    });
  }

  private applyVisibility(): void {
    this.toolIndex.forEach(({ element }, toolId) => {
      const becoming = toolId === this.activeToolId;
      const was = !element.hidden;
      element.hidden = !becoming;
      element.inert = !becoming;
      if (becoming && !was && typeof (element as any).activate === 'function') {
        (element as any).activate();
      } else if (!becoming && was && typeof (element as any).deactivate === 'function') {
        (element as any).deactivate();
      }
    });

    if (this.activeToolId && this.toolIndex.has(this.activeToolId)) {
      const tool = this.toolIndex.get(this.activeToolId);
      if (tool) {
        this.label = tool.label;
        this.applyWidth(tool.element.getAttribute('panel-width'));
      }
      this.active = true;
      this.setAttribute('aria-label', this.label);
      // Move focus to first focusable element in the active tool
      requestAnimationFrame(() => this.focusFirstInActiveTool());
      return;
    }

    this.label = this.defaultLabel;
    this.active = false;
    this.setAttribute('aria-label', this.label);
    this.applyWidth(null);
  }

  private applyWidth(width: string | null): void {
    this.style.width = width || WebmapxToolPanel.DEFAULT_WIDTH;
  }

  /**
   * Lets the currently active tool override the panel width at runtime (beyond its static
   * `panel-width` attribute) — e.g. the stories tool switching width per-story. Ignored when
   * dispatched by a tool that isn't the active one (stale/portal-detached dispatch).
   */
  private handlePanelWidth(e: CustomEvent<{ toolId?: string; width?: string | null }>): void {
    const { toolId, width } = e.detail ?? {};
    if (toolId && toolId !== this.activeToolId) return;
    this.applyWidth(width ?? null);
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
    // Capture active element before focus moves into the panel
    this.triggerButton = (document.activeElement as HTMLElement) ?? null;
    this.activeToolId = toolId;
    this.collapsed = false;
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
    const detail = (e.detail ?? {}) as ToolSelectEventDetail;
    if (isToolSelectFromDifferentToolbar(detail, this.resolveToolbar())) {
      return;
    }

    const toolId = (detail.toolId as string | null | undefined) ?? null;
    const previousToolId = (detail.previousToolId as string | null | undefined) ?? null;
    if (toolId && this.mapHost?.toolManager?.getTool(toolId)) {
      return;
    }

    if (!toolId) {
      if (previousToolId && !this.toolIndex.has(previousToolId) && this.activeToolId !== previousToolId) {
        return;
      }
      this.activeToolId = null;
      this.applyVisibility();
      return;
    }

    if (!this.toolIndex.has(toolId)) {
      return;
    }

    this.triggerButton = (document.activeElement as HTMLElement) ?? null;
    this.activeToolId = toolId;
    this.collapsed = false;
    this.applyVisibility();
  }

  private resolveToolbar(): HTMLElement | null {
    const controlGroup = this.closest('webmapx-control-group');
    if (controlGroup) {
      const toolbar = controlGroup.querySelector('webmapx-toolbar');
      if (toolbar) {
        return toolbar as HTMLElement;
      }
    }

    return this.mapHost?.querySelector('webmapx-toolbar') ?? null;
  }

  static styles = [controlSurfaceStyles, css`
    :host {
      display: none;
      box-sizing: border-box;
      flex-direction: column;
      align-self: flex-start;
      width: 300px;
      height: auto;
      max-height: 100%;
      min-height: calc(
        var(--webmapx-panel-header-min-height, 3rem) +
        var(--webmapx-panel-min-content, 0px)
      );
      background: var(--webmapx-panel-bg, rgb(var(--color-surface-rgb, 255 255 255) / var(--webmapx-surface-alpha, 1)));
      -webkit-backdrop-filter: var(--webmapx-surface-blur, none);
      backdrop-filter: var(--webmapx-surface-blur, none);
      border: var(--webmapx-surface-border, 1px solid var(--color-border-light, #e2e7ec));
      border-radius: var(--webmapx-panel-radius, var(--webmapx-surface-radius, 6px));
      box-shadow: var(--webmapx-surface-shadow, 0 4px 12px rgba(16, 24, 40, 0.12));
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
      padding: var(--webmapx-panel-header-padding, var(--webmapx-space-sm, 0.5rem) var(--webmapx-space-lg, 1rem));
      border-bottom: var(--webmapx-panel-header-divider, 1px solid var(--color-border-light, #e2e7ec));
      background: var(--webmapx-panel-header-bg, transparent);
      flex-shrink: 0;
    }

    .panel-header h3 {
      margin: 0;
      font-size: var(--webmapx-font-size-lg, 1rem);
      font-weight: 600;
      letter-spacing: -0.005em;
      color: var(--color-text-primary, #16202a);
    }

    .panel-content {
      box-sizing: border-box;
      flex: 0 1 auto;
      min-height: var(--webmapx-panel-min-content, 0px);
      max-height: var(--webmapx-panel-content-max-height, 100%);
      overflow-y: auto;
      overflow-x: hidden;
      --webmapx-tool-padding: var(--webmapx-panel-content-padding, var(--webmapx-space-md, 0.75rem));
    }

    :host([collapsed]) {
      min-height: 0;
    }

    :host([collapsed]) .panel-content,
    :host([collapsed]) slot[name="footer"] {
      display: none;
    }

    ::slotted([hidden]) {
      display: none !important;
    }

  `];
  private toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }

  private handleClose() {
    const closingToolId = this.activeToolId;
    const trigger = this.triggerButton;
    this.triggerButton = null;
    this.activeToolId = null;
    this.applyVisibility();
    this.dispatchEvent(new CustomEvent('webmapx-panel-close', {
      detail: { toolId: closingToolId },
      bubbles: true,
      composed: true
    }));
    // Restore focus to the toolbar button that opened this panel.
    // Two rAFs let the close event chain and toolbar state updates settle first.
    requestAnimationFrame(() => requestAnimationFrame(() => trigger?.focus()));
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.active) {
      // Let Escape close open dropdowns/popups first; only close the panel when nothing is open.
      const openPopup = document.querySelector('sl-select[open], sl-dropdown[open], sl-popup[active]');
      if (openPopup) return;
      e.preventDefault();
      e.stopPropagation();
      this.handleClose();
    }
  }

  private focusFirstInActiveTool(): void {
    const toolEntry = this.activeToolId ? this.toolIndex.get(this.activeToolId) : null;
    if (!toolEntry) return;
    const el = toolEntry.element;
    // Try shadow DOM first (Lit components), then light DOM
    const root = (el.shadowRoot ?? el) as ParentNode;
    const focusable = root.querySelector<HTMLElement>(
      'input, textarea, select, button, [tabindex]:not([tabindex="-1"]), sl-input, sl-button, sl-select, sl-checkbox'
    );
    if (focusable) {
      // Shoelace components expose focus() on their host
      focusable.focus?.();
    }
  }

  render() {
    return html`
      <div class="panel-header">
        <slot name="header"><h3>${this.label}</h3></slot>
        <sl-button size="small" circle variant="text" @click=${this.toggleCollapsed}>
          <sl-icon name=${this.collapsed ? 'chevron-down' : 'chevron-up'} label=${this.collapsed ? 'Expand' : 'Collapse'}></sl-icon>
        </sl-button>
        <sl-button size="small" circle variant="text" @click=${this.handleClose}>
          <sl-icon name="x-lg" label="Close"></sl-icon>
        </sl-button>
      </div>
      <div class="panel-content">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
      <slot name="footer"></slot>
    `;
  }
}
