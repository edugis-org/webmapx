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
      background: var(--webmapx-toolbar-bg, var(--sl-color-neutral-0, #fff));
      border: 1px solid var(--sl-color-neutral-200, #e5e5e5);
      height: fit-content;
      align-self: stretch;
      width: fit-content;
      padding: 0;
      gap: 0;
      pointer-events: none;
      box-shadow: var(--sl-shadow-small);
    }

    ::slotted(*) {
      pointer-events: auto;
    }

    ::slotted(sl-button) {
      margin: 0;
      width: var(--webmapx-toolbar-button-size, var(--sl-input-height-medium));
      height: var(--webmapx-toolbar-button-size, var(--sl-input-height-medium));
      --sl-input-border-color: transparent;
      --sl-input-border-radius-small: 0;
      --sl-input-border-radius-medium: 0;
      --sl-input-border-radius-large: 0;
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
      box-shadow: inset 0 -1px 0 var(--webmapx-toolbar-separator-color, var(--color-border-light, #eee));
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

    // Apply separators after first render/slot distribution.
    queueMicrotask(() => this.applyToolbarSeparators());
  }

  disconnectedCallback(): void {
    const mapHost = this.closest('webmapx-map');
    mapHost?.removeEventListener('webmapx-tool-activated', this.boundHandleToolActivated);
    mapHost?.removeEventListener('webmapx-tool-deactivated', this.boundHandleToolDeactivated);
    mapHost?.removeEventListener('webmapx-tool-select', this.boundHandleToolSelect);
    this.toolPanel?.removeEventListener('webmapx-panel-close', this.boundHandlePanelClose);
    this.toolPanel = null;
    this.toolManager = null;
    super.disconnectedCallback();
  }

  handleSlotChange() {
    // Re-bind click listeners when slot content changes
    const slottedButtons = this.buttons.filter((btn) => btn.tagName.toLowerCase() === 'sl-button');
    slottedButtons.forEach((btn) => btn.removeAttribute('data-toolbar-last'));
    const lastButton = slottedButtons[slottedButtons.length - 1];
    if (lastButton) {
      lastButton.setAttribute('data-toolbar-last', 'true');
    }

    this.buttons.forEach(btn => {
      // Remove old listener to avoid duplicates if slot changes multiple times
      btn.removeEventListener('click', this.boundHandleClick);
      btn.addEventListener('click', this.boundHandleClick);
    });

    this.applyToolbarSeparators();
  }

  protected updated(changedProps: Map<string, unknown>): void {
    if (changedProps.has('orientation')) {
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
        base.style.borderBottom = '1px solid var(--webmapx-toolbar-separator-color, var(--color-border-light, #eee))';
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
