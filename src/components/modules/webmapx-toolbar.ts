import { LitElement, html, css } from 'lit';
import { customElement, queryAssignedElements, property } from 'lit/decorators.js';
import type { ToolManager } from '../../tools/tool-manager';
import type { WebmapxMapElement } from './webmapx-map';

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
      width: fit-content;
      padding: 0.5rem;
      gap: 0.5rem;
      pointer-events: auto;
      box-shadow: var(--sl-shadow-small);
    }

    :host([orientation="vertical"]) {
      flex-direction: column;
      max-height: 100%;
    }

    :host([orientation="horizontal"]) {
      flex-direction: row;
      max-width: 100%;
    }
  `;

  @queryAssignedElements()
  buttons!: HTMLElement[];

  private toolManager: ToolManager | null = null;
  private toolPanel: HTMLElement | null = null;
  private boundHandleToolActivated = (e: Event) => this.handleToolActivated(e as CustomEvent);
  private boundHandleToolDeactivated = (e: Event) => this.handleToolDeactivated(e as CustomEvent);
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

    this.toolPanel = this.resolveToolPanel();
    this.toolPanel?.addEventListener('webmapx-panel-close', this.boundHandlePanelClose);
  }

  disconnectedCallback(): void {
    const mapHost = this.closest('webmapx-map');
    mapHost?.removeEventListener('webmapx-tool-activated', this.boundHandleToolActivated);
    mapHost?.removeEventListener('webmapx-tool-deactivated', this.boundHandleToolDeactivated);
    this.toolPanel?.removeEventListener('webmapx-panel-close', this.boundHandlePanelClose);
    this.toolPanel = null;
    this.toolManager = null;
    super.disconnectedCallback();
  }

  handleSlotChange() {
    // Re-bind click listeners when slot content changes
    this.buttons.forEach(btn => {
      // Remove old listener to avoid duplicates if slot changes multiple times
      btn.removeEventListener('click', this.boundHandleClick);
      btn.addEventListener('click', this.boundHandleClick);
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

    // Deactivate all buttons
    this.clearActiveButtons();

    // Also deactivate any modal tool that might be active
    if (this.toolManager?.activeToolId) {
      this.toolManager.deactivate();
    }

    if (!isActive) {
      // Activate the clicked button
      this.setActiveButton(toolId);

      this.dispatchEvent(new CustomEvent('webmapx-tool-select', {
        detail: { toolId },
        bubbles: true,
        composed: true
      }));
    } else {
      // If it was active, we just deactivated it (toggle off)
      this.dispatchEvent(new CustomEvent('webmapx-tool-select', {
        detail: { toolId: null },
        bubbles: true,
        composed: true
      }));
    }
  }

  /** Handle tool activation events from ToolManager */
  private handleToolActivated(e: CustomEvent): void {
    const { toolId } = e.detail;
    this.clearActiveButtons();
    this.setActiveButton(toolId);
  }

  /** Handle tool deactivation events from ToolManager */
  private handleToolDeactivated(_e: CustomEvent): void {
    this.clearActiveButtons();
  }

  private handlePanelClose(_e: CustomEvent): void {
    if (this.toolManager?.activeToolId) {
      this.toolManager.deactivate();
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

  render() {
    return html`<slot @slotchange=${this.handleSlotChange}></slot>`;
  }
}
