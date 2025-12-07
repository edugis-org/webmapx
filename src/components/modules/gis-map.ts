const MAP_VIEW_SLOT = 'map-view';
const MAP_SURFACE_CLASS = 'gis-map__surface';

/**
 * Lightweight map wrapper that keeps the map canvas and overlay tools grouped
 * without using Shadow DOM. Consumers provide one child with slot="map-view"
 * for the mapping library plus any number of default children for tools.
 */
export class GisMapElement extends HTMLElement {
  private surfaceObserver?: MutationObserver;
  private currentSurface: HTMLElement | null = null;

  connectedCallback(): void {
    this.upsertAndStyleSurface();
    this.observeSurfaceChanges();
  }

  disconnectedCallback(): void {
    this.surfaceObserver?.disconnect();
  }

  private upsertAndStyleSurface(): void {
    const surface = this.ensureMapViewElement();
    this.decorateMapSurface(surface);
    this.currentSurface = surface;
  }

  private ensureMapViewElement(): HTMLElement {
    const existing = this.mapElement;
    if (existing) {
      return existing;
    }

    const fallback = document.createElement('div');
    fallback.setAttribute('slot', MAP_VIEW_SLOT);
    fallback.classList.add('gis-map__auto-view');
    this.prepend(fallback);
    return fallback;
  }

  private decorateMapSurface(target: HTMLElement): void {
    target.classList.add(MAP_SURFACE_CLASS);
    if (!target.style.position) {
      target.style.position = 'absolute';
    }
    if (!target.style.top) {
      target.style.top = '0';
    }
    if (!target.style.right) {
      target.style.right = '0';
    }
    if (!target.style.bottom) {
      target.style.bottom = '0';
    }
    if (!target.style.left) {
      target.style.left = '0';
    }
    if (!target.style.width) {
      target.style.width = '100%';
    }
    if (!target.style.height) {
      target.style.height = '100%';
    }
    if (!target.style.background) {
      target.style.setProperty('background', 'var(--color-background-secondary, #f4f4f4)');
    }
  }

  private observeSurfaceChanges(): void {
    if (this.surfaceObserver) {
      return;
    }

    this.surfaceObserver = new MutationObserver(() => {
      const surface = this.mapElement;

      if (!surface) {
        this.upsertAndStyleSurface();
        return;
      }

      if (surface !== this.currentSurface) {
        this.decorateMapSurface(surface);
        this.currentSurface = surface;
      }
    });

    this.surfaceObserver.observe(this, { childList: true });
  }

  /** Returns the element that should host the mapping library instance. */
  public get mapElement(): HTMLElement | null {
    return this.querySelector<HTMLElement>(`[slot="${MAP_VIEW_SLOT}"]`);
  }
}

if (!customElements.get('gis-map')) {
  customElements.define('gis-map', GisMapElement);
}