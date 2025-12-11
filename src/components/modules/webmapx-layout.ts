import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Lightweight overlay layout that mirrors the positioning pattern from the provided map-positioner
 * example while staying pointer-transparent for the underlying map canvas.
 */
@customElement('webmapx-layout')
export class WebmapxLayout extends LitElement {
  /** Optional z-index that gets applied to the host element when set. */
  @property({ type: Number, attribute: 'z-index' })
  public zIndex?: number;

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
      padding: var(--webmapx-layout-inset, 16px);
      box-sizing: border-box;
    }

    .slot-zone {
      position: absolute;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: var(--webmapx-layout-slot-gap, 12px);
    }

    /* Make top-left and top-right full-height columns so percentage heights work in children */
    .slot-zone--top-left {
      top: var(--webmapx-layout-edge-offset, 16px);
      left: var(--webmapx-layout-edge-offset, 16px);
      bottom: var(--webmapx-layout-edge-offset, 16px);
    }

    .slot-zone--top-right {
      top: var(--webmapx-layout-edge-offset, 16px);
      right: var(--webmapx-layout-edge-offset, 16px);
      bottom: var(--webmapx-layout-edge-offset, 16px);
      align-items: flex-end;
    }

    /* Ensure the wrapper element slotted into top-left/right takes full height */
    .slot-zone--top-left ::slotted(*) {
      height: 100%;
    }
    .slot-zone--top-right ::slotted(*) {
      height: 100%;
    }

    .slot-zone--middle-left {
      top: 50%;
      left: var(--webmapx-layout-edge-offset, 16px);
      transform: translateY(-50%);
    }

    .slot-zone--bottom-left {
      bottom: var(--webmapx-layout-edge-offset, 16px);
      left: var(--webmapx-layout-edge-offset, 16px);
    }

    .slot-zone--top-center {
      top: var(--webmapx-layout-edge-offset, 16px);
      left: 50%;
      transform: translateX(-50%);
      align-items: center;
    }

    .slot-zone--middle-center {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      align-items: center;
    }

    .slot-zone--bottom-center {
      bottom: var(--webmapx-layout-edge-offset, 16px);
      left: 50%;
      transform: translateX(-50%);
      align-items: center;
    }

    .slot-zone--top-right {
      top: var(--webmapx-layout-edge-offset, 16px);
      right: var(--webmapx-layout-edge-offset, 16px);
      align-items: flex-end;
    }

    .slot-zone--middle-right {
      top: 50%;
      right: var(--webmapx-layout-edge-offset, 16px);
      transform: translateY(-50%);
      align-items: flex-end;
    }

    .slot-zone--bottom-right {
      top: var(--webmapx-layout-edge-offset, 16px);
      bottom: var(--webmapx-layout-edge-offset, 16px);
      right: var(--webmapx-layout-edge-offset, 16px);
      align-items: flex-end;
    }
  `;

  protected updated(changed: PropertyValues): void {
    if (changed.has('zIndex')) {
      if (this.zIndex === undefined || this.zIndex === null) {
        this.style.removeProperty('z-index');
      } else {
        this.style.zIndex = `${this.zIndex}`;
      }
    }
  }

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
