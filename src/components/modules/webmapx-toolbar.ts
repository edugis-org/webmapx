import { LitElement, html, css } from 'lit';
import { customElement, queryAssignedElements, property } from 'lit/decorators.js';

@customElement('webmapx-toolbar')
export class WebmapxToolbar extends LitElement {
  @property({ type: String, reflect: true }) orientation = 'vertical';

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      flex-wrap: wrap; /* Allow wrapping to new column */
      background: var(--webmapx-toolbar-bg, var(--sl-color-neutral-0, #fff));
      border: 1px solid var(--sl-color-neutral-200, #e5e5e5);
      height: fit-content;
      width: fit-content;
      padding: 0.5rem;
      gap: 0.5rem;
      pointer-events: auto;
      box-shadow: var(--sl-shadow-small);
      z-index: 10;
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

    // Check if this button is currently 'active' (using a variant or attribute)
    // Assuming we use sl-button, we might toggle 'variant="primary"' or a custom 'active' attribute
    const isActive = clickedBtn.hasAttribute('active') || clickedBtn.getAttribute('variant') === 'primary';

    // Deactivate all buttons
    this.buttons.forEach(btn => {
        btn.removeAttribute('active');
        if (btn.tagName.toLowerCase() === 'sl-button') {
            btn.setAttribute('variant', 'default');
        }
    });

    if (!isActive) {
      // Activate the clicked button
      clickedBtn.setAttribute('active', '');
      if (clickedBtn.tagName.toLowerCase() === 'sl-button') {
          clickedBtn.setAttribute('variant', 'primary');
      }

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

  render() {
    return html`<slot @slotchange=${this.handleSlotChange}></slot>`;
  }
}
