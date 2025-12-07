import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { mapAdapter } from '../../map/maplibre-adapter';

@customElement('gis-inset-map')
export class GisInsetMap extends LitElement {
  @property({ type: Number, attribute: 'zoom-offset' })
  public zoomOffset = -3;

  @property({ type: String, attribute: 'style-url' })
  public styleUrl?: string;

  private get insetContainer(): HTMLElement | null {
    return this.renderRoot.querySelector('.inset-map');
  }

  static styles = css`
    :host {
      display: inline-block;
      width: var(--gis-inset-width, 180px);
      height: var(--gis-inset-height, 180px);
      border: 1px solid var(--color-border, #ccc);
      border-radius: 6px;
      overflow: hidden;
      background: var(--color-background-secondary, #f4f4f4);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      pointer-events: auto;
    }

    .inset-map {
      width: 100%;
      height: 100%;
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
    return html`<div class="inset-map"></div>`;
  }
}
