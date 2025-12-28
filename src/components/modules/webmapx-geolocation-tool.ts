import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapAdapter } from '../../map/IMapAdapter';
import type { WebmapxMapElement } from './webmapx-map';
import { resolveMapElement } from './map-context';

type GeolocationMapState = {
  count: number;
  activeCount: number;
  layersReady: boolean;
  listeners: Set<WebmapxGeolocationTool>;
  mapElement: WebmapxMapElement;
};

@customElement('webmapx-geolocation-tool')
export class WebmapxGeolocationTool extends WebmapxBaseTool {
  readonly toolId = 'geolocation';

  private static mapStates = new Map<WebmapxMapElement, GeolocationMapState>();
  private static globalWatchId: number | null = null;
  private static globalListeners = new Set<WebmapxGeolocationTool>();
  private static globalLastPosition: GeolocationPosition | null = null;
  private static globalLastError: GeolocationPositionError | null = null;

  @property({ type: Boolean, attribute: 'watch' }) watch = true;
  @property({ type: Boolean, attribute: 'high-accuracy' }) highAccuracy = true;
  @property({ type: Number, attribute: 'timeout' }) timeout = 45000;
  @property({ type: Number, attribute: 'max-age' }) maxAge = 0;
  @property({ type: Number }) zoom?: number;
  @property({ type: Boolean, attribute: 'follow' }) follow = false;
  @property({ type: Boolean, reflect: true }) active = false;

  @state() private status: 'idle' | 'locating' | 'watching' | 'success' | 'error' = 'idle';
  @state() private message = 'Determining position...';
  @state() private lastUpdate: string | null = null;

  private mapElement: WebmapxMapElement | null = null;
  private flownTo = false;
  private readonly sourceId = 'webmapx-geolocation';
  private readonly radiusLayerId = 'webmapx-geolocation-radius';
  private readonly pointLayerId = 'webmapx-geolocation-point';
  private panelLinked = false;
  private panelElement: HTMLElement | null = null;
  private boundHandleToolSelect = (e: Event) => this.handleToolSelect(e as CustomEvent);
  private boundHandleToolActivated = (e: Event) => this.handleToolActivated(e as CustomEvent);
  private boundHandlePanelClose = () => this.handlePanelClose();

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      pointer-events: auto;
    }

    :host([hidden]) {
      display: none !important;
    }

    .tool-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
      background: var(--color-background-secondary);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);
    }

    .title {
      font-weight: 600;
      font-size: 1rem;
      border-bottom: 1px solid var(--color-border-light);
      padding-bottom: 0.5rem;
    }

    .status {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }

    .meta {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
    }

    .follow {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.panelElement = this.closest('webmapx-tool-panel') as HTMLElement | null;
    this.panelLinked = Boolean(this.panelElement);
    this.panelElement?.addEventListener('webmapx-panel-close', this.boundHandlePanelClose);
  }

  disconnectedCallback(): void {
    this.panelElement?.removeEventListener('webmapx-panel-close', this.boundHandlePanelClose);
    this.panelElement = null;
    this.panelLinked = false;
    super.disconnectedCallback();
  }

  protected onMapAttached(adapter: IMapAdapter): void {
    this.adapter = adapter;
    this.mapElement = resolveMapElement(this);
    this.incrementSharedState();
    if (this.panelLinked && this.mapElement) {
      this.mapElement.addEventListener('webmapx-tool-select', this.boundHandleToolSelect);
      this.mapElement.addEventListener('webmapx-tool-activated', this.boundHandleToolActivated);
    }
  }

  protected onMapDetached(): void {
    if (this.active) {
      this.deactivate();
    }
    this.releaseSharedState();
    if (this.mapElement) {
      this.mapElement.removeEventListener('webmapx-tool-select', this.boundHandleToolSelect);
      this.mapElement.removeEventListener('webmapx-tool-activated', this.boundHandleToolActivated);
    }
    this.adapter = null;
    this.mapElement = null;
  }

  protected onStateChanged(): void {}

  public activate(): void {
    if (this.active) return;
    (this as HTMLElement).hidden = false;
    this.flownTo = false;
    this.lastUpdate = null;
    this.status = 'watching';
    this.message = 'Determining position...';
    this.incrementActiveState();
    this.startGeolocation();
    this.active = true;
    if (WebmapxGeolocationTool.globalLastPosition && this.mapElement) {
      const position = WebmapxGeolocationTool.globalLastPosition;
      this.handleSharedPosition(position);
      this.updateMapForPosition(position, this.mapElement);
      const adapter = this.mapElement.adapter;
      if (adapter) {
        const state = this.getMapStateIfAny(this.mapElement);
        if (state) {
          this.maybeRecenter(position, state.listeners, adapter);
        }
      }
    } else if (WebmapxGeolocationTool.globalLastError) {
      this.handleSharedError(WebmapxGeolocationTool.globalLastError);
    }
  }

  public deactivate(): void {
    if (!this.active) return;
    this.decrementActiveState();
    this.status = 'idle';
    this.message = 'Determining position...';
    this.lastUpdate = null;
    this.flownTo = false;
    this.active = false;
    (this as HTMLElement).hidden = true;
  }

  public toggle(): void {
    if (this.active) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  private handleToolSelect(e: CustomEvent): void {
    if (!this.panelLinked) {
      return;
    }
    const toolId = e.detail?.toolId ?? null;
    if (toolId === this.toolId) {
      this.activate();
      return;
    }
    if (this.active) {
      this.deactivate();
    }
  }

  private handleToolActivated(e: CustomEvent): void {
    if (!this.panelLinked) {
      return;
    }
    const toolId = e.detail?.toolId ?? null;
    if (toolId && toolId !== this.toolId && this.active) {
      this.deactivate();
    }
  }

  private handlePanelClose(): void {
    if (this.panelLinked && this.active) {
      this.deactivate();
    }
  }

  private startGeolocation(): void {
    if (!navigator.geolocation) {
      this.status = 'error';
      this.message = 'Geolocation is not available in this browser.';
      this.dispatchEvent(new CustomEvent('webmapx-geolocation-error', {
        detail: { message: this.message },
        bubbles: true,
        composed: true
      }));
      this.deactivate();
      return;
    }

    this.ensureMapLayers();
    this.dispatchEvent(new CustomEvent('webmapx-geolocation-start', {
      detail: { watch: true },
      bubbles: true,
      composed: true
    }));
    this.requestSingleFix();
    this.updateGlobalWatchState();
  }

  private buildOptions(): PositionOptions {
    return {
      enableHighAccuracy: this.highAccuracy,
      timeout: this.timeout,
      maximumAge: this.maxAge
    };
  }

  private handleSharedPosition(position: GeolocationPosition): void {
    this.status = 'success';
    this.updateMessage(position);
    this.lastUpdate = new Date().toLocaleTimeString();
    this.dispatchEvent(new CustomEvent('webmapx-geolocation-success', {
      detail: { position, watch: true },
      bubbles: true,
      composed: true
    }));
  }

  private handleSharedError(error: GeolocationPositionError): void {
    this.status = 'error';
    this.message = error.message || 'Unable to retrieve location.';
    this.dispatchEvent(new CustomEvent('webmapx-geolocation-error', {
      detail: { error },
      bubbles: true,
      composed: true
    }));
  }

  private requestSingleFix(): void {
    navigator.geolocation.getCurrentPosition(
      (position) => this.handleGlobalUpdate(position),
      (error) => this.handleGlobalErrorUpdate(error),
      this.buildOptions()
    );
  }

  private ensureMapLayers(adapter?: IMapAdapter, mapElement?: WebmapxMapElement): void {
    const targetAdapter = adapter ?? this.adapter;
    const targetMap = mapElement ?? this.mapElement;
    if (!targetAdapter || !targetMap) {
      return;
    }
    const state = this.getMapState(targetMap);
    const core = targetAdapter.core;
    const existingSource = core.getSource(this.sourceId);
    if (state.layersReady && existingSource) {
      return;
    }
    try {
      if (!existingSource) {
        core.addSource(this.sourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      }
    } catch (error) {
      // ignore if source exists
    }
    try {
      core.addLayer({
        id: this.radiusLayerId,
        type: 'fill',
        source: this.sourceId,
        metadata: { isToolLayer: true },
        paint: {
          'fill-color': 'rgba(149, 201, 253, 0.3)',
          'fill-opacity': 0.3
        },
        filter: ['all', ['==', '$type', 'Polygon']]
      });
    } catch (error) {
      // ignore if layer exists
    }
    try {
      core.addLayer({
        id: this.pointLayerId,
        type: 'circle',
        source: this.sourceId,
        metadata: { isToolLayer: true },
        paint: {
          'circle-radius': 10,
          'circle-color': 'rgb(66, 133, 244)',
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 1
        },
        filter: ['all', ['==', '$type', 'Point']]
      });
    } catch (error) {
      // ignore if layer exists
    }
    state.layersReady = true;
  }

  private clearMapLayers(): void {
    if (!this.adapter) {
      return;
    }
    if (!this.mapElement) {
      return;
    }
    const state = this.getMapStateIfAny(this.mapElement);
    if (state && !state.layersReady) {
      return;
    }
    const core = this.adapter.core;
    try { core.removeLayer(this.radiusLayerId); } catch (error) {}
    try { core.removeLayer(this.pointLayerId); } catch (error) {}
    try { core.removeSource(this.sourceId); } catch (error) {}
    if (state) {
      state.layersReady = false;
    }
  }

  private clearMapData(): void {
    if (!this.adapter) {
      return;
    }
    const source = this.adapter.core.getSource(this.sourceId);
    if (source) {
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  }

  private incrementSharedState(): void {
    if (!this.mapElement) {
      return;
    }
    const state = this.getMapState(this.mapElement);
    state.count += 1;
  }

  private releaseSharedState(): void {
    if (!this.mapElement) {
      return;
    }
    const state = this.getMapStateIfAny(this.mapElement);
    if (!state) {
      return;
    }
    state.count -= 1;
    if (state.count <= 0) {
      WebmapxGeolocationTool.mapStates.delete(this.mapElement);
    }
  }

  private getMapState(mapElement: WebmapxMapElement): GeolocationMapState {
    let state = WebmapxGeolocationTool.mapStates.get(mapElement);
    if (!state) {
      state = {
        count: 0,
        activeCount: 0,
        layersReady: false,
        listeners: new Set(),
        mapElement
      };
      WebmapxGeolocationTool.mapStates.set(mapElement, state);
    }
    return state;
  }

  private getMapStateIfAny(mapElement: WebmapxMapElement): GeolocationMapState | null {
    return WebmapxGeolocationTool.mapStates.get(mapElement) ?? null;
  }

  private incrementActiveState(): void {
    if (!this.mapElement) {
      return;
    }
    const state = this.getMapState(this.mapElement);
    state.activeCount += 1;
    state.listeners.add(this);
    WebmapxGeolocationTool.globalListeners.add(this);
  }

  private decrementActiveState(): void {
    if (!this.mapElement) {
      return;
    }
    const state = this.getMapStateIfAny(this.mapElement);
    if (!state) {
      return;
    }
    state.activeCount = Math.max(0, state.activeCount - 1);
    state.listeners.delete(this);
    WebmapxGeolocationTool.globalListeners.delete(this);
    if (state.activeCount === 0) {
      this.clearMapData();
      this.clearMapLayers();
    }
    if (WebmapxGeolocationTool.globalListeners.size === 0) {
      this.stopGlobalWatch();
      WebmapxGeolocationTool.globalLastPosition = null;
      WebmapxGeolocationTool.globalLastError = null;
    }
    this.updateGlobalWatchState();
  }

  private startGlobalWatch(): void {
    if (WebmapxGeolocationTool.globalWatchId !== null) {
      return;
    }
    WebmapxGeolocationTool.globalWatchId = navigator.geolocation.watchPosition(
      (position) => this.handleGlobalUpdate(position),
      (error) => this.handleGlobalErrorUpdate(error),
      this.buildOptions()
    );
  }

  private stopGlobalWatch(): void {
    if (WebmapxGeolocationTool.globalWatchId === null) {
      return;
    }
    navigator.geolocation.clearWatch(WebmapxGeolocationTool.globalWatchId);
    WebmapxGeolocationTool.globalWatchId = null;
    this.dispatchEvent(new CustomEvent('webmapx-geolocation-stop', {
      bubbles: true,
      composed: true
    }));
  }

  private updateGlobalWatchState(): void {
    if (WebmapxGeolocationTool.globalListeners.size > 0) {
      this.startGlobalWatch();
      return;
    }
    if (WebmapxGeolocationTool.globalWatchId !== null) {
      this.stopGlobalWatch();
    }
  }

  private handleGlobalUpdate(position: GeolocationPosition): void {
    WebmapxGeolocationTool.globalLastPosition = position;
    WebmapxGeolocationTool.globalLastError = null;
    WebmapxGeolocationTool.mapStates.forEach((state) => {
      if (state.activeCount === 0) {
        return;
      }
      this.updateMapForPosition(position, state.mapElement);
      state.listeners.forEach((listener) => listener.handleSharedPosition(position));
      const adapter = state.mapElement.adapter;
      if (adapter) {
        this.maybeRecenter(position, state.listeners, adapter);
      }
    });
  }

  private handleGlobalErrorUpdate(error: GeolocationPositionError): void {
    WebmapxGeolocationTool.globalLastError = error;
    WebmapxGeolocationTool.globalLastPosition = null;
    WebmapxGeolocationTool.mapStates.forEach((state) => {
      state.listeners.forEach((listener) => listener.handleSharedError(error));
    });
  }

  private maybeRecenter(
    position: GeolocationPosition,
    listeners: Set<WebmapxGeolocationTool>,
    adapter: IMapAdapter
  ): void {
    let shouldCenter = false;
    let targetZoom: number | null = null;
    listeners.forEach((listener) => {
      const wantsCenter = listener.follow || !listener.flownTo;
      if (wantsCenter) {
        shouldCenter = true;
        const fallbackZoom = adapter.core.getViewportState().zoom ?? 0;
        const desiredZoom = typeof listener.zoom === 'number' ? listener.zoom : Math.max(fallbackZoom, 15);
        targetZoom = targetZoom === null ? desiredZoom : Math.max(targetZoom, desiredZoom);
        listener.flownTo = true;
      }
    });
    if (!shouldCenter || targetZoom === null) {
      return;
    }
    const center: [number, number] = [position.coords.longitude, position.coords.latitude];
    try {
      adapter.core.setViewport(center, targetZoom);
    } catch (error) {
      console.warn('geolocation setViewport failed', error);
    }
  }

  private updateMapForPosition(position: GeolocationPosition, mapElement: WebmapxMapElement): void {
    const adapter = mapElement.adapter;
    if (!adapter) {
      return;
    }
    const state = this.getMapState(mapElement);
    if (!state.layersReady) {
      this.ensureMapLayers(adapter, mapElement);
    }
    const geojson = {
      type: 'FeatureCollection',
      features: [
        this.createAccuracyCircle(position, position.coords.accuracy),
        this.createPoint(position)
      ]
    } as GeoJSON.FeatureCollection;
    const source = adapter.core.getSource(this.sourceId);
    if (source) {
      source.setData(geojson);
    }
  }

  private updateMessage(position: GeolocationPosition): void {
    const accuracy = position.coords.accuracy || 0;
    const factor = 6 - Math.round(Math.log10(Math.max(accuracy, 1)));
    const decimals = Math.max(0, Math.min(6, factor));
    this.message = `Longitude: ${position.coords.longitude.toFixed(decimals)}°\n` +
      `Latitude: ${position.coords.latitude.toFixed(decimals)}°\n` +
      `Precision: ${Math.round(accuracy)} m`;
  }

  private handleFollowChange(e: Event): void {
    const target = e.target as HTMLInputElement | null;
    if (!target) return;
    this.follow = target.checked;
  }

  private formatStatus(): string {
    switch (this.status) {
      case 'locating':
        return 'Locating';
      case 'watching':
        return 'Watching';
      case 'success':
        return 'Active';
      case 'error':
        return 'Error';
      default:
        return 'Idle';
    }
  }

  private createAccuracyCircle(position: GeolocationPosition, radiusMeters: number): GeoJSON.Feature {
    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
    const km = radiusMeters / 1000;
    const points = 64;
    const distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
    const distanceY = km / 110.574;
    const ring: number[][] = [];
    for (let i = 0; i < points; i += 1) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      ring.push([coords.longitude + x, coords.latitude + y]);
    }
    ring.push(ring[0]);
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [ring]
      },
      properties: {}
    };
  }

  private createPoint(position: GeolocationPosition): GeoJSON.Feature {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [position.coords.longitude, position.coords.latitude]
      },
      properties: {}
    };
  }

  render() {
    return html`
      <div class="tool-content">
        <div class="title">Location</div>
        <div class="status" style="white-space: pre-line;">${this.message}</div>
        <div class="follow">
          <input type="checkbox" .checked=${this.follow} @change=${this.handleFollowChange} />
          <span>Track me</span>
        </div>
        <div class="meta">
          Status: ${this.formatStatus()}${this.lastUpdate ? ` | Updated: ${this.lastUpdate}` : ''}
        </div>
      </div>
    `;
  }
}
