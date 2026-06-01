import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

/**
 * Lightweight overlay layout that mirrors the positioning pattern from the provided map-positioner
 * example while staying pointer-transparent for the underlying map canvas.
 */
@customElement('webmapx-layout')
export class WebmapxLayout extends LitElement {
  @state() private slotDirections: Record<string, 'vertical' | 'horizontal'> = {
    'top-left': 'vertical',
    'middle-left': 'vertical',
    'bottom-left': 'vertical',
    'top-center': 'vertical',
    'middle-center': 'vertical',
    'bottom-center': 'vertical',
    'top-right': 'vertical',
    'middle-right': 'vertical',
    'bottom-right': 'vertical'
  };

  static styles = css`
    :host {
      position: absolute;
      inset: 0;
      display: block;
      pointer-events: none;
      --webmapx-layout-inset-vertical: calc(var(--webmapx-layout-inset, 16px) + 2px);
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

    .slot-zone[data-direction='horizontal'] {
      flex-direction: row;
    }

    .slot-zone ::slotted(*) {
      pointer-events: var(--webmapx-pointer-events, auto);
    }

    /* Left column */
    .slot-zone--top-left {
      top: var(--webmapx-zone-top-left-top, var(--webmapx-layout-inset-vertical, 18px));
      bottom: var(--webmapx-zone-top-left-bottom, var(--webmapx-layout-inset-vertical, 18px));
      left: var(--webmapx-zone-top-left-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-top-left-right, var(--webmapx-layout-inset, 16px));
      justify-content: flex-start;
      align-items: flex-start;
    }

    .slot-zone--middle-left {
      top: var(--webmapx-zone-middle-left-top, var(--webmapx-layout-inset-vertical, 18px));
      bottom: var(--webmapx-zone-middle-left-bottom, var(--webmapx-layout-inset-vertical, 18px));
      left: var(--webmapx-zone-middle-left-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-middle-left-right, var(--webmapx-layout-inset, 16px));
      justify-content: center;
      align-items: flex-start;
    }

    .slot-zone--bottom-left {
      top: var(--webmapx-zone-bottom-left-top, var(--webmapx-layout-inset-vertical, 18px));
      bottom: var(--webmapx-zone-bottom-left-bottom, var(--webmapx-layout-inset-vertical, 18px));
      left: var(--webmapx-zone-bottom-left-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-bottom-left-right, var(--webmapx-layout-inset, 16px));
      justify-content: flex-end;
      align-items: flex-start;
    }

    .slot-zone--bottom-left[data-direction='horizontal'] {
      justify-content: flex-start;
      align-items: flex-end;
    }

    /* Center column */
    .slot-zone--top-center {
      top: var(--webmapx-zone-top-center-top, var(--webmapx-layout-inset-vertical, 18px));
      bottom: var(--webmapx-zone-top-center-bottom, var(--webmapx-layout-inset-vertical, 18px));
      left: var(--webmapx-zone-top-center-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-top-center-right, var(--webmapx-layout-inset, 16px));
      justify-content: flex-start;
      align-items: center;
    }

    .slot-zone--middle-center {
      top: var(--webmapx-zone-middle-center-top, var(--webmapx-layout-inset-vertical, 18px));
      bottom: var(--webmapx-zone-middle-center-bottom, var(--webmapx-layout-inset-vertical, 18px));
      left: var(--webmapx-zone-middle-center-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-middle-center-right, var(--webmapx-layout-inset, 16px));
      justify-content: center;
      align-items: center;
    }

    .slot-zone--bottom-center {
      top: var(--webmapx-zone-bottom-center-top, var(--webmapx-layout-inset-vertical, 18px));
      bottom: var(--webmapx-zone-bottom-center-bottom, var(--webmapx-layout-inset-vertical, 18px));
      left: var(--webmapx-zone-bottom-center-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-bottom-center-right, var(--webmapx-layout-inset, 16px));
      justify-content: flex-end;
      align-items: center;
    }

    /* Right column */
    .slot-zone--top-right {
      top: var(--webmapx-zone-top-right-top, var(--webmapx-layout-inset-vertical, 18px));
      bottom: var(--webmapx-zone-top-right-bottom, var(--webmapx-layout-inset-vertical, 18px));
      left: var(--webmapx-zone-top-right-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-top-right-right, var(--webmapx-layout-inset, 16px));
      justify-content: flex-start;
      align-items: flex-end;
    }

    .slot-zone--middle-right {
      top: var(--webmapx-zone-middle-right-top, var(--webmapx-layout-inset-vertical, 18px));
      bottom: var(--webmapx-zone-middle-right-bottom, var(--webmapx-layout-inset-vertical, 18px));
      left: var(--webmapx-zone-middle-right-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-middle-right-right, var(--webmapx-layout-inset, 16px));
      justify-content: center;
      align-items: flex-end;
    }

    .slot-zone--bottom-right {
      top: var(--webmapx-zone-bottom-right-top, var(--webmapx-layout-inset-vertical, 18px));
      bottom: var(--webmapx-zone-bottom-right-bottom, var(--webmapx-layout-inset-vertical, 18px));
      left: var(--webmapx-zone-bottom-right-left, var(--webmapx-layout-inset, 16px));
      right: var(--webmapx-zone-bottom-right-right, var(--webmapx-layout-inset, 16px));
      justify-content: flex-end;
      align-items: flex-end;
    }

    /* Edge zones: zero inset, for controls that must hug the map border (e.g. attribution) */
    .slot-zone--edge-bottom-right {
      bottom: 0;
      right: 0;
      left: 0;
      justify-content: flex-end;
      align-items: flex-end;
    }

    .slot-zone--edge-bottom-left {
      bottom: 0;
      left: 0;
      right: 0;
      justify-content: flex-end;
      align-items: flex-start;
    }

    .slot-zone--edge-bottom-center {
      bottom: 0;
      left: 0;
      right: 0;
      justify-content: flex-end;
      align-items: center;
    }
  `;

  protected render() {
    return html`
      <div class="overlay-surface">
        <!-- Edge zones first (lowest stacking order) -->
        <div class="slot-zone slot-zone--edge-bottom-right">
          <slot name="edge-bottom-right"></slot>
        </div>
        <div class="slot-zone slot-zone--edge-bottom-left">
          <slot name="edge-bottom-left"></slot>
        </div>
        <div class="slot-zone slot-zone--edge-bottom-center">
          <slot name="edge-bottom-center"></slot>
        </div>

        <!-- Middle zones (lower stacking order) -->
        <div class="slot-zone slot-zone--middle-left" data-direction=${this.slotDirections['middle-left']}>
          <slot name="middle-left" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div class="slot-zone slot-zone--middle-right" data-direction=${this.slotDirections['middle-right']}>
          <slot name="middle-right" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div class="slot-zone slot-zone--middle-center" data-direction=${this.slotDirections['middle-center']}>
          <slot name="middle-center" @slotchange=${this.handleSlotChange}></slot>
        </div>

        <!-- Corner and Center zones (higher stacking order) -->
        <div class="slot-zone slot-zone--top-left" data-direction=${this.slotDirections['top-left']}>
          <slot name="top-left" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div class="slot-zone slot-zone--bottom-left" data-direction=${this.slotDirections['bottom-left']}>
          <slot name="bottom-left" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div class="slot-zone slot-zone--top-center" data-direction=${this.slotDirections['top-center']}>
          <slot name="top-center" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div class="slot-zone slot-zone--bottom-center" data-direction=${this.slotDirections['bottom-center']}>
          <slot name="bottom-center" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div class="slot-zone slot-zone--top-right" data-direction=${this.slotDirections['top-right']}>
          <slot name="top-right" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div class="slot-zone slot-zone--bottom-right" data-direction=${this.slotDirections['bottom-right']}>
          <slot name="bottom-right" @slotchange=${this.handleSlotChange}></slot>
        </div>
      </div>
    `;
  }

  private handleSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement | null;
    const slotName = slot?.name;
    if (!slotName) {
      return;
    }

    const nextDirection = this.resolveSlotDirection(slot);
    if (this.slotDirections[slotName] === nextDirection) {
      return;
    }

    this.slotDirections = {
      ...this.slotDirections,
      [slotName]: nextDirection
    };
  }

  private resolveSlotDirection(slot: HTMLSlotElement): 'vertical' | 'horizontal' {
    const assignedElements = slot.assignedElements({ flatten: true });
    const directionSource = assignedElements.find((element) => {
      const direction = element.getAttribute('direction');
      return direction === 'horizontal' || direction === 'vertical';
    });

    const direction = directionSource?.getAttribute('direction');
    return direction === 'horizontal' ? 'horizontal' : 'vertical';
  }
}
