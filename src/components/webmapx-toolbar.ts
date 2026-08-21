import { LitElement, html, css } from 'lit';
import { customElement, queryAssignedElements, property } from 'lit/decorators.js';
import type { ToolManager } from '../tools/tool-manager';
import type { WebmapxMapElement } from './webmapx-map';
import {
  resolveToolbarSelectionState,
  toolbarOwnsTool,
  type ToolSelectEventDetail
} from './internal/tool-selection-scope';

@customElement('webmapx-toolbar')
export class WebmapxToolbar extends LitElement {
  @property({ type: String, reflect: true }) orientation = 'vertical';

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      flex-wrap: wrap; /* Allow wrapping to new column */
      flex: 0 0 auto;
      background: var(--webmapx-toolbar-bg, rgb(var(--color-surface-rgb, 255 255 255) / var(--webmapx-surface-alpha, 1)));
      -webkit-backdrop-filter: var(--webmapx-surface-blur, none);
      backdrop-filter: var(--webmapx-surface-blur, none);
      border: var(--webmapx-surface-border, 1px solid var(--color-border-light, #e2e7ec));
      border-radius: var(--webmapx-toolbar-radius, var(--webmapx-surface-radius, 6px));
      height: fit-content;
      align-self: stretch;
      width: fit-content;
      padding: 0;
      gap: 0;
      pointer-events: none;
      box-shadow: var(--webmapx-surface-shadow, 0 1px 2px rgba(16, 24, 40, 0.07));
    }

    ::slotted(*) {
      pointer-events: auto;
    }

    ::slotted(sl-button) {
      margin: 0;
      width: var(--webmapx-toolbar-button-size, var(--webmapx-hit-size, 36px));
      height: var(--webmapx-toolbar-button-size, var(--webmapx-hit-size, 36px));
      --sl-input-border-color: transparent;
      --sl-input-border-radius-small: var(--webmapx-radius-sm, 4px);
      --sl-input-border-radius-medium: var(--webmapx-radius-sm, 4px);
      --sl-input-border-radius-large: var(--webmapx-radius-sm, 4px);
    }

    slot[name="before"]::slotted(*),
    slot[name="after"]::slotted(*) {
      pointer-events: auto;
    }

    :host([orientation="vertical"]) {
      flex-direction: column;
      max-height: var(--webmapx-toolbar-max-height, 100%);
    }

    :host([orientation="vertical"]) ::slotted(sl-button) {
      box-shadow: inset 0 -1px 0 var(--webmapx-toolbar-separator-color, transparent);
    }

    :host([orientation="vertical"]) ::slotted(sl-button[data-toolbar-last="true"]) {
      box-shadow: none;
    }

    :host([orientation="horizontal"]) {
      flex-direction: row;
      max-width: var(--webmapx-toolbar-max-width, 100%);
    }
  `;

  @queryAssignedElements()
  buttons!: HTMLElement[];

  private toolManager: ToolManager | null = null;
  private toolPanel: HTMLElement | null = null;
  private boundHandleToolActivated = (e: Event) => this.handleToolActivated(e as CustomEvent);
  private boundHandleToolDeactivated = (e: Event) => this.handleToolDeactivated(e as CustomEvent);
  private boundHandleToolSelect = (e: Event) => this.handleToolSelect(e as CustomEvent);
  private boundHandlePanelClose = (e: Event) => this.handlePanelClose(e as CustomEvent);

  connectedCallback(): void {
    super.connectedCallback();

    this.setAttribute('role', 'toolbar');
    this.setAttribute('aria-orientation', this.orientation);

    // Try to get ToolManager from parent map element
    const mapHost = this.closest('webmapx-map') as WebmapxMapElement | null;
    if (mapHost?.toolManager) {
      this.toolManager = mapHost.toolManager;
    }

    // Listen for tool activation/deactivation events to sync button states
    mapHost?.addEventListener('webmapx-tool-activated', this.boundHandleToolActivated);
    mapHost?.addEventListener('webmapx-tool-deactivated', this.boundHandleToolDeactivated);
    mapHost?.addEventListener('webmapx-tool-select', this.boundHandleToolSelect);

    this.toolPanel = this.resolveToolPanel();
    this.toolPanel?.addEventListener('webmapx-panel-close', this.boundHandlePanelClose);

    this.addEventListener('keydown', this.handleArrowKeys);

    // Apply separators after first render/slot distribution.
    queueMicrotask(() => this.applyToolbarSeparators());
  }

  disconnectedCallback(): void {
    const mapHost = this.closest('webmapx-map');
    mapHost?.removeEventListener('webmapx-tool-activated', this.boundHandleToolActivated);
    mapHost?.removeEventListener('webmapx-tool-deactivated', this.boundHandleToolDeactivated);
    mapHost?.removeEventListener('webmapx-tool-select', this.boundHandleToolSelect);
    this.toolPanel?.removeEventListener('webmapx-panel-close', this.boundHandlePanelClose);
    this.removeEventListener('keydown', this.handleArrowKeys);
    this.toolPanel = null;
    this.toolManager = null;
    super.disconnectedCallback();
  }

  handleSlotChange() {
    // Re-bind click listeners when slot content changes
    const slottedButtons = this.buttons.filter((btn) => btn.tagName.toLowerCase() === 'sl-button');
    slottedButtons.forEach((btn) => {
      btn.removeAttribute('data-toolbar-first');
      btn.removeAttribute('data-toolbar-last');
    });
    // The rail no longer clips its children (that would cut off the CSS
    // tooltips), so the end buttons round their own outer corners instead.
    slottedButtons[0]?.setAttribute('data-toolbar-first', 'true');
    slottedButtons[slottedButtons.length - 1]?.setAttribute('data-toolbar-last', 'true');

    this.buttons.forEach(btn => {
      // Remove old listener to avoid duplicates if slot changes multiple times
      btn.removeEventListener('click', this.boundHandleClick);
      btn.addEventListener('click', this.boundHandleClick);
    });

    this.applyRovingTabindex();
    this.applyToolbarSeparators();
  }

  /** Roving tabindex: first focusable button gets tabindex=0, rest get -1. */
  private applyRovingTabindex(activeBtn?: HTMLElement): void {
    const btns = this.focusableButtons();
    btns.forEach(btn => btn.setAttribute('tabindex', '-1'));
    const target = activeBtn ?? btns.find(b => b.getAttribute('variant') === 'primary') ?? btns[0];
    target?.setAttribute('tabindex', '0');
  }

  /** Returns all sl-button children that are not spacers. */
  private focusableButtons(): HTMLElement[] {
    return this.buttons.filter(b => b.tagName.toLowerCase() === 'sl-button');
  }

  private handleArrowKeys = (e: KeyboardEvent): void => {
    const btns = this.focusableButtons();
    if (btns.length === 0) return;

    const current = btns.findIndex(b => b === document.activeElement || b.shadowRoot?.activeElement != null);

    // Enter/Space: activate the focused button
    if (e.key === 'Enter' || e.key === ' ') {
      if (current !== -1) {
        e.preventDefault();
        btns[current].click();
      }
      return;
    }

    const vertical = this.orientation !== 'horizontal';
    const prev = vertical ? 'ArrowUp' : 'ArrowLeft';
    const next = vertical ? 'ArrowDown' : 'ArrowRight';
    if (e.key !== prev && e.key !== next) return;
    if (current === -1) return;

    e.preventDefault();
    const dir = e.key === next ? 1 : -1;
    const target = btns[(current + dir + btns.length) % btns.length];
    this.applyRovingTabindex(target);
    target.focus();
  };

  protected updated(changedProps: Map<string, unknown>): void {
    if (changedProps.has('orientation')) {
      this.setAttribute('aria-orientation', this.orientation);
      this.applyToolbarSeparators();
    }
  }

  private applyToolbarSeparators(): void {
    const slottedButtons = this.buttons.filter((btn) => btn.tagName.toLowerCase() === 'sl-button');
    slottedButtons.forEach((btn, idx) => {
      const isLast = idx === slottedButtons.length - 1;
      const base = (btn as HTMLElement).shadowRoot?.querySelector<HTMLElement>('[part="base"]');
      if (!base) return;

      if (this.orientation === 'vertical' && !isLast) {
        base.style.borderBottom = '1px solid var(--webmapx-toolbar-separator-color, var(--color-border-light, #e2e7ec))';
      } else {
        base.style.borderBottom = '';
      }
    });
  }

  private boundHandleClick = (e: Event) => this.handleButtonClick(e);

  handleButtonClick(e: Event) {
    const clickedBtn = e.currentTarget as HTMLElement;
    // Look for a 'name' or 'data-tool' attribute to identify the tool
    const toolId = clickedBtn.getAttribute('name') || clickedBtn.getAttribute('data-tool');

    if (!toolId) return;

    // Check if this tool is registered with ToolManager
    const isRegisteredTool = this.toolManager?.getTool(toolId) !== undefined;

    // Use ToolManager for registered modal tools
    if (this.toolManager && isRegisteredTool) {
      this.toolManager.toggle(toolId);
      // Button state will be updated by tool events
      return;
    }

    // Fallback for non-modal tools: manual button state management and event dispatch
    const isActive = clickedBtn.hasAttribute('active') || clickedBtn.getAttribute('variant') === 'primary';

    // Deactivate all buttons (visual only — non-modal tools don't affect ToolManager state)
    this.clearActiveButtons();

    // Deactivate active ToolManager tool only when a different modal tool is being activated
    if (this.toolManager?.activeToolId && this.toolManager.getTool(toolId)) {
      this.toolManager.deactivate(this.toolManager.activeToolId);
    }

    if (!isActive) {
      // Activate the clicked button
      this.setActiveButton(toolId);

      this.dispatchEvent(new CustomEvent('webmapx-tool-select', {
        detail: { toolId, previousToolId: null, sourceToolbar: this },
        bubbles: true,
        composed: true
      }));
    } else {
      // If it was active, we just deactivated it (toggle off)
      this.dispatchEvent(new CustomEvent('webmapx-tool-select', {
        detail: { toolId: null, previousToolId: toolId, sourceToolbar: this },
        bubbles: true,
        composed: true
      }));
    }
  }

  /** Handle tool activation events from ToolManager */
  private handleToolActivated(e: CustomEvent): void {
    const { toolId } = e.detail;
    if (!this.hasButtonForTool(toolId)) {
      return;
    }
    this.clearActiveButtons();
    this.setActiveButton(toolId);
  }

  /** Handle tool deactivation events from ToolManager */
  private handleToolDeactivated(e: CustomEvent): void {
    const { toolId } = e.detail;
    if (!this.hasButtonForTool(toolId)) {
      return;
    }
    this.clearActiveButtons();
  }

  private handleToolSelect(e: CustomEvent): void {
    const detail = (e.detail ?? {}) as ToolSelectEventDetail;
    const nextActiveToolId = resolveToolbarSelectionState({
      toolIds: this.getToolIds(),
      currentActiveToolId: this.getActiveButtonToolId(),
      detail,
      ownToolbar: this
    });

    if (nextActiveToolId === undefined) {
      return;
    }

    this.clearActiveButtons();
    if (nextActiveToolId) {
      this.setActiveButton(nextActiveToolId);
    }
  }

  private handlePanelClose(e: CustomEvent): void {
    const closingToolId = e.detail?.toolId as string | null | undefined;
    if (closingToolId && this.toolManager?.getTool(closingToolId)) {
      this.toolManager.deactivate(closingToolId);
    }
    this.clearActiveButtons();
  }

  private resolveToolPanel(): HTMLElement | null {
    const controlGroup = this.closest('webmapx-control-group');
    if (controlGroup) {
      const panel = controlGroup.querySelector('webmapx-tool-panel');
      if (panel) return panel as HTMLElement;
    }
    const mapHost = this.closest('webmapx-map');
    return mapHost?.querySelector('webmapx-tool-panel') ?? null;
  }

  /** Set a specific button as active by toolId */
  private setActiveButton(toolId: string): void {
    const btn = this.buttons.find(b =>
      b.getAttribute('name') === toolId || b.getAttribute('data-tool') === toolId
    );
    if (btn) {
      btn.setAttribute('active', '');
      if (btn.tagName.toLowerCase() === 'sl-button') {
        btn.setAttribute('variant', 'primary');
      }
      this.applyRovingTabindex(btn);
    }
  }

  /** Clear active state from all buttons */
  private clearActiveButtons(): void {
    this.buttons.forEach(btn => {
      btn.removeAttribute('active');
      if (btn.tagName.toLowerCase() === 'sl-button') {
        btn.setAttribute('variant', 'default');
      }
    });
    this.applyRovingTabindex();
  }

  private hasButtonForTool(toolId: string | null | undefined): boolean {
    return toolbarOwnsTool(this.getToolIds(), toolId);
  }

  private getToolIds(): string[] {
    return this.buttons
      .map((btn) => btn.getAttribute('name') || btn.getAttribute('data-tool'))
      .filter((toolId): toolId is string => Boolean(toolId));
  }

  private getActiveButtonToolId(): string | null {
    const activeButton = this.buttons.find((btn) =>
      btn.hasAttribute('active') || btn.getAttribute('variant') === 'primary'
    );
    return activeButton?.getAttribute('name') || activeButton?.getAttribute('data-tool') || null;
  }

  render() {
    return html`
      <slot name="before"></slot>
      <slot @slotchange=${this.handleSlotChange}></slot>
      <slot name="after"></slot>
    `;
  }
}
