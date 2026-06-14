import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import { resolveMapElement } from './internal/map-context';

/**
 * Button that toggles the browser Fullscreen API on the `webmapx-map` element,
 * maximizing the map to the screen (not just the current window/viewport).
 */
@customElement('webmapx-fullscreen-control')
export class WebmapxFullscreenControl extends WebmapxBaseTool {
  @state()
  private isFullscreen = false;

  static styles = css`
    :host {
      display: inline-flex;
      pointer-events: auto;
      font-size: var(--webmapx-navigation-font-size, var(--font-size-small, 12px));
      color: var(--webmapx-navigation-color, var(--sl-color-neutral-700, var(--color-text-primary, #1a1a1a)));
    }

    .nav-shell {
      display: inline-flex;
      background: var(--webmapx-navigation-bg, var(--sl-color-neutral-0, #ffffff));
      border: var(--webmapx-navigation-border, 1px solid var(--sl-color-neutral-200, #e5e5e5));
      box-shadow: var(--webmapx-navigation-shadow, var(--sl-shadow-small, var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05))));
      border-radius: var(--webmapx-navigation-radius, 0);
    }

    .nav-btn {
      appearance: none;
      border: none;
      background: transparent;
      box-sizing: border-box;
      width: var(--webmapx-navigation-button-size, var(--webmapx-toolbar-button-size, var(--sl-input-height-medium, 2.5rem)));
      height: var(--webmapx-navigation-button-size, var(--webmapx-toolbar-button-size, var(--sl-input-height-medium, 2.5rem)));
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: inherit;
      transition: background 120ms ease, transform 120ms ease;
    }

    .nav-btn:hover {
      background: var(--webmapx-navigation-hover-bg, var(--sl-color-primary-50, #f0f9ff));
      color: var(--webmapx-navigation-hover-color, var(--sl-color-primary-700, #0369a1));
    }

    .nav-btn:active {
      transform: scale(0.98);
    }

    svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `;

  protected onMapAttached(): void {
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    this.isFullscreen = document.fullscreenElement === this.fullscreenTarget();
  }

  protected onMapDetached(): void {
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
  }

  protected onStateChanged(): void {
    // No-op
  }

  protected onConfigReady(): void {
    // No-op
  }

  private fullscreenTarget(): HTMLElement {
    return resolveMapElement(this) ?? this;
  }

  private handleFullscreenChange = () => {
    this.isFullscreen = document.fullscreenElement === this.fullscreenTarget();
  };

  private handleToggle = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void this.fullscreenTarget().requestFullscreen();
    }
  };

  protected render() {
    return html`
      <div class="nav-shell">
        <button class="nav-btn" @click=${this.handleToggle} title="${this.isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}" aria-label="Toggle fullscreen">
          ${this.isFullscreen
            ? html`<svg viewBox="0 0 24 24"><path d="M9 3v3a2 2 0 0 1-2 2H4M21 9h-3a2 2 0 0 1-2-2V4M3 15h3a2 2 0 0 1 2 2v3M15 21v-3a2 2 0 0 1 2-2h3"/></svg>`
            : html`<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>`}
        </button>
      </div>
    `;
  }
}
