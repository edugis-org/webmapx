import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

/**
 * Lightweight overlay layout that mirrors the positioning pattern from the provided map-positioner
 * example while staying pointer-transparent for the underlying map canvas.
 */
@customElement('webmapx-layout')
export class WebmapxLayout extends LitElement {

  static styles = css`
    :host {
      position: absolute;
      inset: 0;
      display: block;
      pointer-events: none;
    }

    .overlay-surface {
      position: relative;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }

    .slot-zone {
      position: absolute;
      display: flex;
      flex-direction: column;
      gap: var(--webmapx-layout-slot-gap, 12px);
      pointer-events: none;
      min-height: 0;
      max-height: 100%;
      overflow: hidden;
    }

    .slot-zone ::slotted(*) {
      pointer-events: auto;
    }

    /* Left column */
    .slot-zone--top-left {
      top: var(--webmapx-zone-top-left-top, var(--webmapx-layout-inset, 16px));
      bottom: var(--webmapx-zone-top-left-bottom, var(--webmapx-layout-inset, 16px));
      left: var(--webmapx-zone-top-left-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-top-left-right, var(--webmapx-layout-inset, 16px));
      justify-content: flex-start;
      align-items: flex-start;
    }

    .slot-zone--middle-left {
      top: var(--webmapx-zone-middle-left-top, var(--webmapx-layout-inset, 16px));
      bottom: var(--webmapx-zone-middle-left-bottom, var(--webmapx-layout-inset, 16px));
      left: var(--webmapx-zone-middle-left-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-middle-left-right, var(--webmapx-layout-inset, 16px));
      justify-content: center;
      align-items: flex-start;
    }

    .slot-zone--bottom-left {
      top: var(--webmapx-zone-bottom-left-top, var(--webmapx-layout-inset, 16px));
      bottom: var(--webmapx-zone-bottom-left-bottom, var(--webmapx-layout-inset, 16px));
      left: var(--webmapx-zone-bottom-left-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-bottom-left-right, var(--webmapx-layout-inset, 16px));
      justify-content: flex-end;
      align-items: flex-start;
    }

    /* Center column */
    .slot-zone--top-center {
      top: var(--webmapx-zone-top-center-top, var(--webmapx-layout-inset, 16px));
      bottom: var(--webmapx-zone-top-center-bottom, var(--webmapx-layout-inset, 16px));
      left: var(--webmapx-zone-top-center-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-top-center-right, var(--webmapx-layout-inset, 16px));
      justify-content: flex-start;
      align-items: center;
    }

    .slot-zone--middle-center {
      top: var(--webmapx-zone-middle-center-top, var(--webmapx-layout-inset, 16px));
      bottom: var(--webmapx-zone-middle-center-bottom, var(--webmapx-layout-inset, 16px));
      left: var(--webmapx-zone-middle-center-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-middle-center-right, var(--webmapx-layout-inset, 16px));
      justify-content: center;
      align-items: center;
    }

    .slot-zone--bottom-center {
      top: var(--webmapx-zone-bottom-center-top, var(--webmapx-layout-inset, 16px));
      bottom: var(--webmapx-zone-bottom-center-bottom, var(--webmapx-layout-inset, 16px));
      left: var(--webmapx-zone-bottom-center-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-bottom-center-right, var(--webmapx-layout-inset, 16px));
      justify-content: flex-end;
      align-items: center;
    }

    /* Right column */
    .slot-zone--top-right {
      top: var(--webmapx-zone-top-right-top, var(--webmapx-layout-inset, 16px));
      bottom: var(--webmapx-zone-top-right-bottom, var(--webmapx-layout-inset, 16px));
      left: var(--webmapx-zone-top-right-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-top-right-right, var(--webmapx-layout-inset, 16px));
      justify-content: flex-start;
      align-items: flex-end;
    }

    .slot-zone--middle-right {
      top: var(--webmapx-zone-middle-right-top, var(--webmapx-layout-inset, 16px));
      bottom: var(--webmapx-zone-middle-right-bottom, var(--webmapx-layout-inset, 16px));
      left: var(--webmapx-zone-middle-right-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-middle-right-right, var(--webmapx-layout-inset, 16px));
      justify-content: center;
      align-items: flex-end;
    }

    .slot-zone--bottom-right {
      top: var(--webmapx-zone-bottom-right-top, var(--webmapx-layout-inset, 16px));
      bottom: var(--webmapx-zone-bottom-right-bottom, var(--webmapx-layout-inset, 16px));
      left: var(--webmapx-zone-bottom-right-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-bottom-right-right, var(--webmapx-layout-inset, 16px));
      justify-content: flex-end;
      align-items: flex-end;
    }
  `;

  protected render() {
    return html`
      <div class="overlay-surface">
        <!-- Middle zones first (lower stacking order) -->
        <div class="slot-zone slot-zone--middle-left">
          <slot name="middle-left"></slot>
        </div>
        <div class="slot-zone slot-zone--middle-right">
          <slot name="middle-right"></slot>
        </div>
        <div class="slot-zone slot-zone--middle-center">
          <slot name="middle-center"></slot>
        </div>

        <!-- Corner and Center zones (higher stacking order) -->
        <div class="slot-zone slot-zone--top-left">
          <slot name="top-left"></slot>
        </div>
        <div class="slot-zone slot-zone--bottom-left">
          <slot name="bottom-left"></slot>
        </div>
        <div class="slot-zone slot-zone--top-center">
          <slot name="top-center"></slot>
        </div>
        <div class="slot-zone slot-zone--bottom-center">
          <slot name="bottom-center"></slot>
        </div>
        <div class="slot-zone slot-zone--top-right">
          <slot name="top-right"></slot>
        </div>
        <div class="slot-zone slot-zone--bottom-right">
          <slot name="bottom-right"></slot>
        </div>
      </div>
    `;
  }
}
