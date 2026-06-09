import { LitElement, html, css } from 'lit';
import { customElement, property, queryAssignedElements } from 'lit/decorators.js';

@customElement('webmapx-control-group')
export class WebmapxControlGroup extends LitElement {
  @property({ type: String, reflect: true }) orientation = 'vertical'; // 'vertical' | 'horizontal'
  @property({ type: String, reflect: true, attribute: 'panel-position' }) panelPosition = 'after'; // 'after' | 'before'
  @property({ type: String, reflect: true }) alignment = 'start'; // 'start' | 'end' | 'center'
  @property({ type: String, reflect: true, attribute: 'slot-anchor-y' }) slotAnchorY = 'top';
  @property({ type: Boolean, reflect: true, attribute: 'panel-active' }) panelActive = false;
  @property({ type: String, reflect: true }) priority = 'normal'; // 'normal' | 'high'

  private panelObserver: MutationObserver | null = null;

  static styles = css`
    :host {
      display: flex;
      pointer-events: none;
      gap: 0.5rem;
      flex: 0 1 auto; /* keep intrinsic height but allow shrinking when space is tight */
      min-height: 0; /* let child flex items manage their own minimums */
      max-height: 100%;
      max-width: 100%;
      align-items: stretch; /* Stretch children to full available cross-size */
      position: relative;
      z-index: var(--webmapx-control-group-z-index, auto);
    }

    :host([priority="high"]) {
      z-index: var(--webmapx-control-group-z-index-high, 10);
    }

    /* Alignment overrides */
    :host([alignment="end"]) { align-items: flex-end; }
    :host([alignment="center"]) { align-items: center; }

    /* Vertical Toolbar -> Group is Row */
    :host([orientation="vertical"]) {
      flex-direction: row;
    }
    :host([orientation="vertical"][panel-position="before"]) {
      flex-direction: row-reverse;
    }

    /* Horizontal Toolbar -> Group is Column */
    :host([orientation="horizontal"]) {
      flex-direction: column;
    }
    :host([orientation="horizontal"][panel-position="before"]) {
      flex-direction: column-reverse;
    }
    
    /* Each slotted child manages its own pointer-events */

    /* Keep the panel attached to the slot edge. */
    :host([slot-anchor-y="top"])::slotted(webmapx-tool-panel) {
      align-self: flex-start;
    }

    :host([slot-anchor-y="bottom"])::slotted(webmapx-tool-panel) {
      align-self: flex-end;
    }

    :host([slot-anchor-y="middle"])::slotted(webmapx-tool-panel) {
      align-self: center;
    }

    /* When closed, the toolbar follows the same edge as the panel. */
    :host(:not([panel-active])[slot-anchor-y="top"])::slotted(webmapx-toolbar) {
      align-self: flex-start;
    }

    :host(:not([panel-active])[slot-anchor-y="bottom"])::slotted(webmapx-toolbar) {
      align-self: flex-end;
    }

    :host(:not([panel-active])[slot-anchor-y="middle"])::slotted(webmapx-toolbar) {
      align-self: center;
    }

  `;

  @queryAssignedElements()
  childrenElements!: HTMLElement[];

  connectedCallback() {
    super.connectedCallback();
    this.updateSlotAnchor();
  }

  disconnectedCallback() {
    this.disconnectPanelObserver();
    super.disconnectedCallback();
  }

  handleSlotChange() {
    this.updateToolbarOrientation();
    this.observePanelState();
  }

  updateToolbarOrientation() {
    const toolbar = this.childrenElements.find(el => el.tagName.toLowerCase() === 'webmapx-toolbar');
    if (toolbar) {
      // We cast to any to avoid strict type checking against the class definition 
      // which might not be fully loaded or cause circular deps if we imported it.
      (toolbar as any).orientation = this.orientation;
    }
  }

  private updateSlotAnchor() {
    const slotName = this.getAttribute('slot') ?? '';
    this.slotAnchorY = slotName.includes('bottom') ? 'bottom' : slotName.includes('middle') ? 'middle' : 'top';
  }

  private observePanelState() {
    this.disconnectPanelObserver();
    const panel = this.childrenElements.find(el => el.tagName.toLowerCase() === 'webmapx-tool-panel');
    if (!panel) {
      this.panelActive = false;
      return;
    }

    this.panelActive = panel.hasAttribute('active');
    this.panelObserver = new MutationObserver(() => {
      this.panelActive = panel.hasAttribute('active');
    });
    this.panelObserver.observe(panel, {
      attributes: true,
      attributeFilter: ['active']
    });
  }

  private disconnectPanelObserver() {
    this.panelObserver?.disconnect();
    this.panelObserver = null;
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('orientation')) {
      this.updateToolbarOrientation();
    }
    if (changedProperties.has('slot')) {
      this.updateSlotAnchor();
    }
  }

  render() {
    return html`<slot @slotchange=${this.handleSlotChange}></slot>`;
  }
}
