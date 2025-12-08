import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

@customElement('webmapx-tool-panel')
export class WebmapxToolPanel extends LitElement {
  @property({ type: String }) label = 'Tools';
  @property({ type: Boolean, reflect: true }) active = false;

  static styles = css`
    :host {
      display: none;
      box-sizing: border-box;
      flex-direction: column;
      width: 300px;
      max-height: 100%;
      height: fit-content;
      background: var(--webmapx-panel-bg, var(--sl-color-neutral-0, #fff));
      border: 1px solid var(--sl-color-neutral-200, #e5e5e5);
      box-shadow: var(--sl-shadow-medium);
      pointer-events: auto;
      overflow: hidden;
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
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0; /* Important for nested flex scrolling */
    }
  `;

  private handleClose() {
    this.active = false;
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
        <slot></slot>
      </div>
    `;
  }
}
