import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { resolveMapElement } from './map-context';
import { IMapAdapter } from '../../map/IMapAdapter';
import { IMap, ISource } from '../../map/IMapInterfaces';
import { IAppState } from '../../store/IState';
import { throttle } from '../../utils/throttle';

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json';
const MIN_ZOOM = 0;
const MAX_ZOOM = 22;
const POSITIVE_SCALE_CAP = 1;
const VIEWPORT_SOURCE_ID = 'viewport';
const VIEWPORT_FILL_LAYER_ID = 'viewport-fill';
const VIEWPORT_OUTLINE_LAYER_ID = 'viewport-outline';

@customElement('webmapx-inset-map')
export class WebmapxInsetMap extends LitElement {
  @property({ type: Number, attribute: 'zoom-offset' })
  public zoomOffset = -3;

  @property({ type: String, attribute: 'style-url' })
  public styleUrl?: string;

  @property({ type: Number, attribute: 'base-scale' })
  public baseScale = 0.5;

  private adapter: IMapAdapter | null = null;
  private insetMap: IMap | null = null;
  private viewportSource: ISource | null = null;
  private unsubscribe: (() => void) | null = null;
  private lastCenter: [number, number] | null = null;
  private lastZoom: number | null = null;
  private lastBoundsKey: string | null = null;
  private initPromise: Promise<void> | null = null;

  // Throttle state updates to avoid excessive rendering during map movement
  private throttledApplyState = throttle((state: IAppState) => {
    this.applyState(state);
  }, 50);

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
    void this.initializeInset();
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has('zoomOffset') || changed.has('styleUrl') || changed.has('baseScale')) {
      this.destroyInset();
      void this.initializeInset();
    }
  }

  disconnectedCallback(): void {
    this.destroyInset();
    super.disconnectedCallback();
  }

  private async initializeInset(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.doInitializeInset();
    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  private async doInitializeInset(): Promise<void> {
    const container = this.insetContainer;
    if (!container) return;

    const mapElement = resolveMapElement(this);
    if (!mapElement) return;

    const adapter = await (mapElement as any).getAdapterAsync?.();
    if (!adapter) return;
    this.adapter = adapter as IMapAdapter;

    const state = this.adapter.store.getState();

    // Create the inset map
    this.insetMap = this.adapter.mapFactory.createMap(container, {
      styleUrl: this.styleUrl ?? DEFAULT_STYLE,
      center: state.mapCenter ?? [0, 0],
      zoom: this.clampZoom((state.zoomLevel ?? 0) + this.zoomOffset),
      interactive: false,
    });

    // Set initial scale
    container.style.setProperty('--webmapx-inset-scale', `${this.baseScale}`);

    // Setup layers when map is ready
    this.insetMap.onReady(() => {
      this.setupViewportLayers();
      this.applyState(state);
    });

    // Subscribe to state changes (throttled)
    this.unsubscribe = this.adapter.store.subscribe((newState) => {
      if (!this.hasRelevantStateChange(newState)) {
        return;
      }
      this.throttledApplyState(newState);
    });
  }

  private destroyInset(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.insetMap) {
      this.insetMap.destroy();
      this.insetMap = null;
    }
    this.viewportSource = null;
    this.lastCenter = null;
    this.lastZoom = null;
    this.lastBoundsKey = null;
  }

  private setupViewportLayers(): void {
    if (!this.insetMap) return;

    const emptyData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [],
    };

    // Create source
    this.viewportSource = this.insetMap.createSource(VIEWPORT_SOURCE_ID, emptyData);

    // Create fill layer
    this.insetMap.createLayer({
      id: VIEWPORT_FILL_LAYER_ID,
      type: 'fill',
      sourceId: VIEWPORT_SOURCE_ID,
      paint: {
        'fill-color': '#0f62fe',
        'fill-opacity': 0.15,
      },
    });

    // Create outline layer
    this.insetMap.createLayer({
      id: VIEWPORT_OUTLINE_LAYER_ID,
      type: 'line',
      sourceId: VIEWPORT_SOURCE_ID,
      paint: {
        'line-color': '#0f62fe',
        'line-width': 1.5,
      },
    });
  }

  private applyState(state: IAppState): void {
    if (!this.insetMap) return;

    const container = this.insetContainer;
    if (!container) return;

    if (state.mapCenter) {
      const requestedZoom = (state.zoomLevel ?? 0) + this.zoomOffset;
      const { mapZoom, scale } = this.resolveViewState(requestedZoom);

      // Update CSS scale
      container.style.setProperty('--webmapx-inset-scale', `${scale}`);

      // Update viewport if changed
      if (!this.isSameView(state.mapCenter, mapZoom)) {
        this.insetMap.setViewport(state.mapCenter, mapZoom);
        this.lastCenter = [...state.mapCenter] as [number, number];
        this.lastZoom = mapZoom;
      }
    }

    // Update viewport rectangle
    this.updateViewportRectangle(state.mapViewportBounds);
  }

  private isSameView(center: [number, number], zoom: number): boolean {
    if (!this.lastCenter || this.lastZoom === null) return false;
    return (
      this.lastCenter[0] === center[0] &&
      this.lastCenter[1] === center[1] &&
      this.lastZoom === zoom
    );
  }

  private updateViewportRectangle(bounds: GeoJSON.Feature<GeoJSON.Polygon> | null | undefined): void {
    if (!this.viewportSource) return;

    const nextKey = this.computeBoundsKey(bounds);
    if (nextKey === this.lastBoundsKey) {
      return;
    }
    this.lastBoundsKey = nextKey;

    const data: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: bounds ? [bounds] : [],
    };

    this.viewportSource.setData(data);
  }

  private hasRelevantStateChange(state: IAppState): boolean {
    const center = state.mapCenter;
    const zoom = state.zoomLevel;
    const boundsKey = this.computeBoundsKey(state.mapViewportBounds);

    const centerChanged = !!center && !this.isSameCenter(center, this.lastCenter);
    const zoomChanged = zoom !== this.lastZoom;
    const boundsChanged = boundsKey !== this.lastBoundsKey;

    // If we haven't applied anything yet, allow initialization updates through.
    if (!this.lastCenter && center) return true;
    if (this.lastZoom === null && zoom !== null) return true;

    return centerChanged || zoomChanged || boundsChanged;
  }

  private isSameCenter(a: [number, number], b: [number, number] | null): boolean {
    if (!b) return false;
    return a[0] === b[0] && a[1] === b[1];
  }

  private computeBoundsKey(bounds: GeoJSON.Feature<GeoJSON.Polygon> | null | undefined): string | null {
    if (!bounds) return null;
    const ring = bounds.geometry?.coordinates?.[0];
    if (!ring || ring.length < 4) return null;
    const r = (n: number) => n.toFixed(6);
    // Use ordered corner list so rotations update even when the bbox is unchanged
    return ring.map(pt => `${r(pt[0])}:${r(pt[1])}`).join('|');
  }

  private clampZoom(value: number): number {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  }

  private resolveViewState(requestedZoom: number): { mapZoom: number; scale: number } {
    // Case 1: Derived zoom <= 0 -> stay at zoom 0, scale down
    if (requestedZoom <= 0) {
      return { mapZoom: 0, scale: this.baseScale };
    }

    // Case 2: 0 < derived zoom <= POSITIVE_SCALE_CAP -> scale up to 1, keep zoom 0
    if (requestedZoom <= POSITIVE_SCALE_CAP) {
      const scale = this.baseScale + (1 - this.baseScale) * (requestedZoom / POSITIVE_SCALE_CAP);
      return { mapZoom: 0, scale };
    }

    // Case 3: derived zoom > POSITIVE_SCALE_CAP -> scale fixed at 1, excess into map zoom
    const residual = requestedZoom - POSITIVE_SCALE_CAP;
    const mapZoom = this.clampZoom(residual);
    return { mapZoom, scale: 1 };
  }

  protected render() {
    return html`
      <div class="inset-map-frame">
        <div class="inset-map"></div>
      </div>
    `;
  }
}
