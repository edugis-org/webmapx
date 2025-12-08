import { LitElement, html, css } from 'lit';
import { customElement, property, queryAssignedElements } from 'lit/decorators.js';

@customElement('webmapx-control-group')
export class WebmapxControlGroup extends LitElement {
  @property({ type: String, reflect: true }) orientation = 'vertical'; // 'vertical' | 'horizontal'
  @property({ type: String, reflect: true, attribute: 'panel-position' }) panelPosition = 'after'; // 'after' | 'before'
  @property({ type: String, reflect: true }) alignment = 'start'; // 'start' | 'end' | 'center'

  static styles = css`
    :host {
      display: flex;
      pointer-events: none; /* Pass through clicks in gaps */
      gap: 0.5rem;
      max-height: 100%;
      max-width: 100%;
      align-items: flex-start; /* Default */
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
    
    /* Ensure children (toolbar/panel) capture pointer events */
    ::slotted(*) {
      pointer-events: auto;
    }
  `;

  @queryAssignedElements()
  childrenElements!: HTMLElement[];

  handleSlotChange() {
    this.updateToolbarOrientation();
  }

  updateToolbarOrientation() {
    const toolbar = this.childrenElements.find(el => el.tagName.toLowerCase() === 'webmapx-toolbar');
    if (toolbar) {
      // We cast to any to avoid strict type checking against the class definition 
      // which might not be fully loaded or cause circular deps if we imported it.
      (toolbar as any).orientation = this.orientation;
    }
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('orientation')) {
      this.updateToolbarOrientation();
    }
  }

  render() {
    return html`<slot @slotchange=${this.handleSlotChange}></slot>`;
  }
}
