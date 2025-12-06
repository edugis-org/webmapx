const MAP_VIEW_SLOT = 'map-view';

/**
 * Lightweight map wrapper that keeps the map canvas and overlay tools grouped
 * without using Shadow DOM. Consumers provide one child with slot="map-view"
 * for the mapping library plus any number of default children for tools.
 */
export class GisMapElement extends HTMLElement {
  connectedCallback(): void {
    this.ensureMapViewElement();
  }

  private ensureMapViewElement(): void {
    if (this.mapElement) {
      return;
    }

    const fallback = document.createElement('div');
    fallback.setAttribute('slot', MAP_VIEW_SLOT);
    fallback.classList.add('gis-map__auto-view');
    this.prepend(fallback);
  }

  /** Returns the element that should host the mapping library instance. */
  public get mapElement(): HTMLElement | null {
    return this.querySelector<HTMLElement>(`[slot="${MAP_VIEW_SLOT}"]`);
  }
}

if (!customElements.get('gis-map')) {
  customElements.define('gis-map', GisMapElement);
}