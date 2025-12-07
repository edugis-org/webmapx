import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { mapAdapter } from '../../map/maplibre-adapter';

@customElement('webmapx-inset-map')
export class WebmapxInsetMap extends LitElement {
  @property({ type: Number, attribute: 'zoom-offset' })
  public zoomOffset = -3;

  @property({ type: String, attribute: 'style-url' })
  public styleUrl?: string;

  @property({ type: Number, attribute: 'base-scale' })
  public baseScale = 0.5;

  private get insetContainer(): HTMLElement | null {
    return this.renderRoot.querySelector('.inset-map');
  }

  static styles = css`
    :host {
      display: inline-block;
      width: var(--webmapx-inset-width, 256px);
      height: var(--webmapx-inset-height, 256px);
      border: 1px solid var(--color-border, #ccc);
      border-radius: 6px;
      overflow: hidden;
      background: var(--color-background-secondary, #f4f4f4);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      pointer-events: auto;
    }

    .inset-map-frame {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .inset-map {
      position: absolute;
      top: 50%;
      left: 50%;
      width: var(--webmapx-inset-internal-size, 512px);
      height: var(--webmapx-inset-internal-size, 512px);
      transform-origin: center;
      transform: translate(-50%, -50%) scale(var(--webmapx-inset-scale, 0.5));
    }
  `;

  protected firstUpdated(): void {
    this.attachInset();
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has('zoomOffset') || changed.has('styleUrl')) {
      this.attachInset();
    }
  }

  private attachInset(): void {
    const container = this.insetContainer;
    if (!container) {
      return;
    }

    mapAdapter.inset.attach(container, {
      zoomOffset: this.zoomOffset,
      styleUrl: this.styleUrl,
      baseScale: this.baseScale,
    });
  }

  disconnectedCallback(): void {
    const container = this.insetContainer;
    if (container) {
      mapAdapter.inset.detach(container);
    }
    super.disconnectedCallback();
  }

  protected render() {
    return html`
      <div class="inset-map-frame">
        <div class="inset-map"></div>
      </div>
    `;
  }
}
