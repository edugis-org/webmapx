import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import { BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMap } from '../map/IMapInterfaces';
import type { WebmapxMapElement } from './webmapx-map';
import { resolveMapElement } from './internal/map-context';

type GeolocationMapState = {
  count: number;
  activeCount: number;
  layersReady: boolean;
  listeners: Set<WebmapxGeolocationTool>;
  mapElement: WebmapxMapElement;
  /** Last fix accepted as the displayed/centered position (not every raw GPS reading). */
  bestFix: BestFix | null;
  /** EMA of recent ground speed (m/s), used to scale plausibility/decay rules. */
  recentSpeed: number;
  /** Accepted fixes since "track me" was last (re)enabled, for the trail line. */
  trail: [number, number][];
  /** Track id (incremental) for the current "track me" session, or null if not tracking. */
  currentTrackId: number | null;
  /** Order counter (1-based) for points stored in the current track. */
  trackOrder: number;
};

/** Compact on-disk representation of a stored track point: [track, order, timestamp, lng, lat, accuracy]. */
type StoredTrackPoint = [number, number, number, number, number, number];

const TRACK_STORAGE_KEY = 'webmapx-geolocation-tracks';
const TRACK_LAST_ID_KEY = 'webmapx-geolocation-track-last-id';

function loadStoredTrackPoints(): StoredTrackPoint[] {
  try {
    const raw = localStorage.getItem(TRACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveStoredTrackPoints(points: StoredTrackPoint[]): void {
  try {
    localStorage.setItem(TRACK_STORAGE_KEY, JSON.stringify(points));
  } catch (error) {
    console.warn('Failed to persist track points to localStorage', error);
  }
}

function nextTrackId(): number {
  const last = Number(localStorage.getItem(TRACK_LAST_ID_KEY)) || 0;
  const next = last + 1;
  try {
    localStorage.setItem(TRACK_LAST_ID_KEY, String(next));
  } catch (error) {
    // ignore
  }
  return next;
}

/** Build {points, lines} GeoJSON FeatureCollections from all stored track points. */
function buildTrackGeoJSON(points: StoredTrackPoint[]): {
  points: GeoJSON.FeatureCollection;
  lines: GeoJSON.FeatureCollection;
} {
  const sorted = [...points].sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
  const pointFeatures: GeoJSON.Feature[] = [];
  const lineFeatures: GeoJSON.Feature[] = [];
  let currentTrack: number | null = null;
  let currentCoords: number[][] = [];

  const flushLine = () => {
    if (currentTrack !== null && currentCoords.length >= 2) {
      lineFeatures.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: currentCoords },
        properties: { track: currentTrack }
      });
    }
  };

  for (const [track, order, timestamp, lng, lat, accuracy] of sorted) {
    pointFeatures.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: { track, order, timestamp, precision: accuracy ?? 0 }
    });
    if (track !== currentTrack) {
      flushLine();
      currentTrack = track;
      currentCoords = [];
    }
    currentCoords.push([lng, lat]);
  }
  flushLine();

  return {
    points: { type: 'FeatureCollection', features: pointFeatures },
    lines: { type: 'FeatureCollection', features: lineFeatures }
  };
}

export type BestFix = {
  lng: number;
  lat: number;
  accuracy: number;
  /** epoch ms */
  timestamp: number;
};

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Decide whether a new GPS fix should replace the current "best" fix.
 *
 * Returns the accepted fix, or `null` if the candidate should be ignored
 * (map center/trail stay unchanged).
 *
 * Rules (see project discussion):
 * - No best yet -> always accept.
 * - Candidate's accuracy circle fully inside best's circle -> strictly more
 *   precise, accept.
 * - Best is "stale": time since best exceeds how long it'd take to cross its
 *   own accuracy radius at the recent speed (clamped 1-30s) -> accept
 *   whatever comes next.
 * - Candidate accuracy much worse than best (>2.5x) while not stale ->
 *   reject (likely a transient precision glitch).
 * - Overlapping circles with equal-or-better accuracy -> accept.
 * - Otherwise accept only if implied speed is plausible (adaptive ceiling so
 *   aircraft speeds aren't rejected), else reject.
 */
export function evaluateGeolocationFix(
  best: BestFix | null,
  candidate: BestFix,
  recentSpeed: number
): BestFix | null {
  if (!best) return candidate;

  const dt = (candidate.timestamp - best.timestamp) / 1000;
  if (dt <= 0) return null;

  const dist = haversineMeters(best.lat, best.lng, candidate.lat, candidate.lng);
  const speed = dist / dt;

  const contained = dist + candidate.accuracy <= best.accuracy;
  if (contained) return candidate;

  const maxAgeSec = Math.min(30, Math.max(1, best.accuracy / Math.max(recentSpeed, 1)));
  if (dt > maxAgeSec) return candidate;

  const accuracyRatio = candidate.accuracy / best.accuracy;
  if (accuracyRatio > 2.5) return null;

  const overlapping = dist <= best.accuracy + candidate.accuracy;
  if (overlapping && accuracyRatio <= 1) return candidate;

  const maxPlausibleSpeed = Math.max(300, recentSpeed * 4); // m/s; generous ceiling covers aircraft
  if (speed > maxPlausibleSpeed) return null;

  return candidate;
}

@customElement('webmapx-geolocation-tool')
export class WebmapxGeolocationTool extends WebmapxBaseTool {
  readonly toolId = 'geolocation';

  private static mapStates = new Map<WebmapxMapElement, GeolocationMapState>();
  private static globalWatchId: number | null = null;
  private static globalListeners = new Set<WebmapxGeolocationTool>();
  private static globalLastPosition: GeolocationPosition | null = null;
  private static globalLastError: GeolocationPositionError | null = null;
  private static wakeLock: WakeLockSentinel | null = null;
  private static wakeLockListenerAdded = false;
  private static boundReacquireWakeLock = () => WebmapxGeolocationTool.reacquireWakeLockIfNeeded();

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
  @state() private exportDialogOpen = false;
  @state() private storedPointCount = 0;
  @state() private exportFilenameStep = false;
  @state() private exportFilename = 'gps-tracks';
  @state() private eraseAfterExport = true;

  private mapElement: WebmapxMapElement | null = null;
  private flownTo = false;
  private readonly sourceId = '__webmapx-geolocation';
  private readonly trailLayerId = '__webmapx-geolocation-trail';
  private readonly exportLayerId = 'webmapx-geolocation-tracks-export';
  private readonly exportLinesSourceId = `${this.exportLayerId}:lines`;
  private readonly exportPointsSourceId = `${this.exportLayerId}:points`;
  private readonly radiusLayerId = '__webmapx-geolocation-radius';
  private readonly pointLayerId = '__webmapx-geolocation-point';
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
      color: var(--color-text-primary);
    }

    .title {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 600;
      font-size: 1rem;
      border-bottom: 1px solid var(--color-border-light);
      padding-bottom: 0.5rem;
    }

    .title sl-spinner {
      font-size: 1em;
      --track-width: 2px;
      --indicator-color: var(--sl-color-neutral-900);
      --track-color: var(--sl-color-neutral-300);
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

  protected onMapAttached(adapter: IMap): void {
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
      (this as HTMLElement).hidden = true;
      this.stopTracking();
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
    (this as HTMLElement).hidden = false;
    if (this.active) return;
    this.flownTo = false;
    this.lastUpdate = null;
    this.status = 'locating';
    this.message = 'Determining position...';
    this.incrementActiveState();
    this.startGeolocation();
    this.active = true;
    if (WebmapxGeolocationTool.globalLastPosition && this.mapElement) {
      const position = WebmapxGeolocationTool.globalLastPosition;
      this.handleSharedPosition(position);
      const state = this.getMapStateIfAny(this.mapElement);
      if (state) {
        const fix: BestFix = state.bestFix ?? {
          lng: position.coords.longitude,
          lat: position.coords.latitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        state.bestFix = fix;
        this.updateMapForPosition(fix, state);
        const adapter = this.mapElement.adapter;
        if (adapter) {
          this.maybeRecenter(fix, state.listeners, adapter);
        }
      }
    } else if (WebmapxGeolocationTool.globalLastError) {
      this.handleSharedError(WebmapxGeolocationTool.globalLastError);
    }
  }

  public deactivate(): void {
    if (!this.active) return;
    (this as HTMLElement).hidden = true;
    if (this.follow) {
      // Keep tracking running in background; just close the panel.
      return;
    }
    this.stopTracking();
  }

  private stopTracking(): void {
    if (!this.active) return;
    this.decrementActiveState();
    this.status = 'idle';
    this.message = 'Determining position...';
    this.lastUpdate = null;
    this.flownTo = false;
    this.active = false;
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
    this.status = 'watching';
    this.updateMessage(position);
    this.lastUpdate = new Date().toLocaleTimeString();
    this.dispatchEvent(new CustomEvent('webmapx-geolocation-success', {
      detail: { position, watch: true },
      bubbles: true,
      composed: true
    }));
  }

  private handleSharedError(error: GeolocationPositionError): void {
    const codeMap: Record<number, string> = {
      1: 'Permission denied',
      2: 'Position unavailable',
      3: 'Timeout'
    };
    const codeText = codeMap[error.code] || 'Unknown error';
    const parts = [
      `Error: ${codeText}`,
      `Code: ${error.code}`,
      error.message ? `Details: ${error.message}` : null
    ].filter(Boolean);
    this.message = parts.join('\n');
    this.status = WebmapxGeolocationTool.globalWatchId !== null ? 'watching' : 'error';
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

  private async ensureMapLayers(adapter?: IMap, mapElement?: WebmapxMapElement): Promise<void> {
    const targetAdapter = adapter ?? this.adapter;
    const targetMap = mapElement ?? this.mapElement;
    if (!targetAdapter || !targetMap) {
      return;
    }
    const state = this.getMapState(targetMap);
    const existingSource = targetAdapter.getSource(this.sourceId);
    if (state.layersReady && existingSource) {
      return;
    }
    try {
      if (!existingSource) {
        targetAdapter.addSource(this.sourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      }
      targetAdapter.suppressBusySignalForSource(this.sourceId);
    } catch (error) {
      // ignore if source exists
    }
    // Track whether any add operations failed so we only mark layers ready when everything succeeded
    let hadLayerErrors = false;
    try {
      // Added first so it renders behind the precision circle and position dot.
      const added = await targetMap.addLayerRequest({
        id: this.trailLayerId,
        type: 'line',
        source: this.sourceId,
        metadata: { isToolLayer: true, hideFromLegend: true, label: 'Geolocation trail' },
        paint: {
          'line-color': 'rgb(66, 133, 244)',
          'line-width': 3,
          'line-opacity': 0.8
        },
        filter: ['==', '$type', 'LineString']
      });
      if (!added) hadLayerErrors = true;
    } catch (error) {
      hadLayerErrors = true;
    }
    try {
      const added = await targetMap.addLayerRequest({
        id: this.radiusLayerId,
        type: 'fill',
        source: this.sourceId,
        metadata: { isToolLayer: true, hideFromLegend: true, label: 'Geolocation precision' },
        paint: {
          'fill-color': 'rgb(149, 201, 253)',
          'fill-opacity': 0.5,
          'fill-outline-color': 'rgb(66, 133, 244)'
        },
        filter: ['==', '$type', 'Polygon']
      });
      if (!added) hadLayerErrors = true;
    } catch (error) {
      hadLayerErrors = true;
    }
    try {
      const added = await targetMap.addLayerRequest({
        id: this.pointLayerId,
        type: 'circle',
        source: this.sourceId,
        metadata: { isToolLayer: true, hideFromLegend: true, label: 'Geolocation position' },
        paint: {
          'circle-radius': 10,
          'circle-color': 'rgb(66, 133, 244)',
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 1
        },
        filter: ['==', '$type', 'Point']
      });
      if (!added) hadLayerErrors = true;
    } catch (error) {
      hadLayerErrors = true;
    }

    // Only mark layers ready if no add operation failed. If there were errors (e.g., style not loaded),
    // leave layersReady false so ensureMapLayers will retry later.
    state.layersReady = !hadLayerErrors;
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
    try { this.mapElement.removeInlineLayer(this.trailLayerId); } catch (error) {}
    try { this.mapElement.removeInlineLayer(this.radiusLayerId); } catch (error) {}
    try { this.mapElement.removeInlineLayer(this.pointLayerId); } catch (error) {}
    try { this.adapter.unsuppressBusySignalForSource(this.sourceId); } catch (error) {}
    try { this.adapter.removeSource(this.sourceId); } catch (error) {}
    if (state) {
      state.layersReady = false;
    }
  }

  private clearMapData(): void {
    if (!this.adapter) {
      return;
    }
    const source = this.adapter.getSource(this.sourceId);
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
        mapElement,
        bestFix: null,
        recentSpeed: 0,
        trail: [],
        currentTrackId: null,
        trackOrder: 0
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
    WebmapxGeolocationTool.updateWakeLock();
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
    WebmapxGeolocationTool.updateWakeLock();
    if (state.activeCount === 0) {
      this.clearMapData();
      this.clearMapLayers();
      state.bestFix = null;
      state.recentSpeed = 0;
      state.trail = [];
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

  private static shouldHoldWakeLock(): boolean {
    let needed = false;
    WebmapxGeolocationTool.globalListeners.forEach((listener) => {
      if (listener.follow) {
        needed = true;
      }
    });
    return needed;
  }

  private static ensureWakeLockListener(): void {
    if (WebmapxGeolocationTool.wakeLockListenerAdded || typeof document === 'undefined') {
      return;
    }
    document.addEventListener('visibilitychange', WebmapxGeolocationTool.boundReacquireWakeLock);
    WebmapxGeolocationTool.wakeLockListenerAdded = true;
  }

  private static reacquireWakeLockIfNeeded(): void {
    if (document.visibilityState === 'visible' && WebmapxGeolocationTool.shouldHoldWakeLock() && !WebmapxGeolocationTool.wakeLock) {
      WebmapxGeolocationTool.requestWakeLock();
    }
  }

  private static async requestWakeLock(): Promise<void> {
    if (WebmapxGeolocationTool.wakeLock || !('wakeLock' in navigator)) {
      return;
    }
    WebmapxGeolocationTool.ensureWakeLockListener();
    try {
      const sentinel = await navigator.wakeLock.request('screen');
      sentinel.addEventListener('release', () => {
        if (WebmapxGeolocationTool.wakeLock === sentinel) {
          WebmapxGeolocationTool.wakeLock = null;
        }
      });
      WebmapxGeolocationTool.wakeLock = sentinel;
    } catch (error) {
      WebmapxGeolocationTool.wakeLock = null;
    }
  }

  private static releaseWakeLock(): void {
    const sentinel = WebmapxGeolocationTool.wakeLock;
    if (!sentinel) {
      return;
    }
    WebmapxGeolocationTool.wakeLock = null;
    sentinel.release().catch(() => {});
  }

  private static updateWakeLock(): void {
    if (WebmapxGeolocationTool.shouldHoldWakeLock()) {
      WebmapxGeolocationTool.requestWakeLock();
    } else {
      WebmapxGeolocationTool.releaseWakeLock();
    }
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
    const candidate: BestFix = {
      lng: position.coords.longitude,
      lat: position.coords.latitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };
    WebmapxGeolocationTool.mapStates.forEach((state) => {
      if (state.activeCount === 0) {
        return;
      }
      const accepted = evaluateGeolocationFix(state.bestFix, candidate, state.recentSpeed);
      if (accepted) {
        if (state.bestFix) {
          const dt = (accepted.timestamp - state.bestFix.timestamp) / 1000;
          if (dt > 0) {
            const dist = haversineMeters(state.bestFix.lat, state.bestFix.lng, accepted.lat, accepted.lng);
            state.recentSpeed = state.recentSpeed * 0.7 + (dist / dt) * 0.3;
          }
        }
        state.bestFix = accepted;
        if (WebmapxGeolocationTool.anyFollowing(state)) {
          state.trail.push([accepted.lng, accepted.lat]);
          this.persistTrackPoint(state, accepted);
        }
        this.updateMapForPosition(accepted, state);
        const adapter = state.mapElement.adapter;
        if (adapter) {
          this.maybeRecenter(accepted, state.listeners, adapter);
        }
      }
      state.listeners.forEach((listener) => listener.handleSharedPosition(position));
    });
  }

  private persistTrackPoint(state: GeolocationMapState, fix: BestFix): void {
    if (state.currentTrackId === null) return;
    state.trackOrder += 1;
    const points = loadStoredTrackPoints();
    points.push([state.currentTrackId, state.trackOrder, fix.timestamp, fix.lng, fix.lat, fix.accuracy]);
    saveStoredTrackPoints(points);
  }

  private static anyFollowing(state: GeolocationMapState): boolean {
    let following = false;
    state.listeners.forEach((listener) => {
      if (listener.follow) following = true;
    });
    return following;
  }

  private handleGlobalErrorUpdate(error: GeolocationPositionError): void {
    WebmapxGeolocationTool.globalLastError = error;
    WebmapxGeolocationTool.globalLastPosition = null;
    WebmapxGeolocationTool.mapStates.forEach((state) => {
      state.listeners.forEach((listener) => listener.handleSharedError(error));
    });
  }

  private maybeRecenter(
    fix: BestFix,
    listeners: Set<WebmapxGeolocationTool>,
    adapter: IMap
  ): void {
    let shouldCenter = false;
    let targetZoom: number | null = null;
    listeners.forEach((listener) => {
      const wantsCenter = listener.follow || !listener.flownTo;
      if (wantsCenter) {
        shouldCenter = true;
        if (!listener.flownTo) {
          // Auto-zoom only on the first fix; afterwards leave zoom to the user.
          const fallbackZoom = adapter.getViewportState().zoom ?? 0;
          const desiredZoom = typeof listener.zoom === 'number' ? listener.zoom : Math.max(fallbackZoom, 15);
          targetZoom = targetZoom === null ? desiredZoom : Math.max(targetZoom, desiredZoom);
        }
        listener.flownTo = true;
      }
    });
    if (!shouldCenter) {
      return;
    }
    const center: [number, number] = [fix.lng, fix.lat];
    const zoom = targetZoom ?? adapter.getViewportState().zoom ?? 0;
    try {
      adapter.setViewport(center, zoom);
    } catch (error) {
      console.warn('geolocation setViewport failed', error);
    }
  }

  private updateMapForPosition(fix: BestFix, state: GeolocationMapState): void {
    const mapElement = state.mapElement;
    const adapter = mapElement.adapter;
    if (!adapter) {
      return;
    }
    if (!state.layersReady) {
      this.ensureMapLayers(adapter, mapElement);
    }
    const features: GeoJSON.Feature[] = [];
    if (state.trail.length >= 2) {
      features.push(this.createTrailFeature(state.trail));
    }
    features.push(this.createAccuracyCircle(fix.lng, fix.lat, fix.accuracy));
    features.push(this.createPoint(fix.lng, fix.lat));
    const geojson = {
      type: 'FeatureCollection',
      features
    } as GeoJSON.FeatureCollection;
    const source = adapter.getSource(this.sourceId);
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
    if (this.follow && this.mapElement) {
      // Start a fresh trail + a new persisted track for this tracking session.
      const state = this.getMapStateIfAny(this.mapElement);
      if (state) {
        state.trail = [];
        state.currentTrackId = nextTrackId();
        state.trackOrder = 0;
        if (state.bestFix) {
          state.trail.push([state.bestFix.lng, state.bestFix.lat]);
          this.persistTrackPoint(state, state.bestFix);
        }
      }
    } else if (!this.follow && this.mapElement) {
      const state = this.getMapStateIfAny(this.mapElement);
      if (state) state.currentTrackId = null;
    }
    WebmapxGeolocationTool.updateWakeLock();
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

  private createAccuracyCircle(lng: number, lat: number, radiusMeters: number): GeoJSON.Feature {
    const km = radiusMeters / 1000;
    const points = 64;
    const distanceX = km / (111.320 * Math.cos(lat * Math.PI / 180));
    const distanceY = km / 110.574;
    const ring: number[][] = [];
    for (let i = 0; i < points; i += 1) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      ring.push([lng + x, lat + y]);
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

  private createPoint(lng: number, lat: number): GeoJSON.Feature {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      properties: {}
    };
  }

  private createTrailFeature(coords: [number, number][]): GeoJSON.Feature {
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coords
      },
      properties: {}
    };
  }

  render() {
    return html`
      <div class="tool-content">
        <div class="title">
          Location
          ${this.status === 'locating' ? html`<sl-spinner></sl-spinner>` : ''}
          <sl-icon-button
            name="box-arrow-up"
            label="Export tracked points"
            title="Export tracked points"
            style="margin-left: auto;"
            @click=${() => { this.storedPointCount = loadStoredTrackPoints().length; this.exportDialogOpen = true; }}
          ></sl-icon-button>
        </div>
        <div class="status" style="white-space: pre-line;">${this.message}</div>
        <div class="follow">
          <input type="checkbox" .checked=${this.follow} @change=${this.handleFollowChange} />
          <span>Track me</span>
        </div>
        <div class="meta">
          Status: ${this.formatStatus()}${this.lastUpdate ? ` | Updated: ${this.lastUpdate}` : ''}
        </div>
      </div>

      <sl-dialog label="Export tracked points" .open=${this.exportDialogOpen}
        @sl-request-close=${() => { this.exportDialogOpen = false; this.exportFilenameStep = false; }}>
        ${this.exportFilenameStep ? html`
          <div style="display:flex; align-items:center; gap:0.4rem;">
            <span>Filename</span>
            <sl-input style="flex:1;" size="small" .value=${this.exportFilename}
              @sl-input=${(e: Event) => { this.exportFilename = (e.target as any).value; }}>
              <span slot="suffix">.zip</span>
            </sl-input>
          </div>
          <div slot="footer" style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <sl-button variant="primary" @click=${() => this.handleExportSaveFiles()}>Download</sl-button>
            <sl-button variant="text" @click=${() => { this.exportFilenameStep = false; }}>Back</sl-button>
          </div>
        ` : html`
          <p>Save the recorded GPS tracks as GeoJSON, or add them to the map.</p>
          <p>${this.storedPointCount} point(s) stored.</p>
          <label style="display:flex; align-items:center; gap:0.4rem; margin-bottom:0.5rem;">
            <input type="checkbox" .checked=${this.eraseAfterExport}
              @change=${(e: Event) => { this.eraseAfterExport = (e.target as HTMLInputElement).checked; }} />
            <span>Erase from memory</span>
          </label>
          <div slot="footer" style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <sl-button .disabled=${this.storedPointCount === 0} @click=${() => this.openExportFilenameStep()}>Save as files</sl-button>
            <sl-button .disabled=${this.storedPointCount === 0} @click=${() => this.handleExportAddToMap()}>Add to map</sl-button>
            <sl-button variant="text" @click=${() => { this.exportDialogOpen = false; }}>Cancel</sl-button>
          </div>
        `}
      </sl-dialog>
    `;
  }

  private openExportFilenameStep(): void {
    const now = new Date();
    // Shift by the local timezone offset so toISOString() reflects local time.
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const stamp = local.toISOString().slice(0, 16).replace(':', '');
    this.exportFilename = `gps-tracks-${stamp}`;
    this.exportFilenameStep = true;
  }

  private async handleExportSaveFiles(): Promise<void> {
    const { points, lines } = buildTrackGeoJSON(loadStoredTrackPoints());
    const name = this.exportFilename.trim() || 'gps-tracks';
    const zipWriter = new ZipWriter(new BlobWriter('application/zip'));
    await zipWriter.add('gps-track-points.geojson', new TextReader(JSON.stringify(points, null, 2)));
    await zipWriter.add('gps-track-lines.geojson', new TextReader(JSON.stringify(lines, null, 2)));
    const style = this.buildTracksStyleConfig('gps-track-lines.geojson', 'gps-track-points.geojson');
    await zipWriter.add('style.json', new TextReader(JSON.stringify(style, null, 2)));
    this.downloadBlob(await zipWriter.close(), `${name}.zip`);
    if (this.eraseAfterExport) this.eraseStoredTracks();
    this.exportFilenameStep = false;
    this.exportDialogOpen = false;
  }

  /**
   * Builds the `type: 'style'` composite layer config for the GPS tracks layer.
   *
   * `linesSource`/`pointsSource` are the per-source `data` values (inline
   * GeoJSON for the in-map layer, or relative file URLs for the exported
   * style.json) — kept as separate sources/layers so each can point at its
   * own file when exported. Constructed fresh each call so callers never
   * share/mutate the same source-data object.
   */
  private buildTracksStyleConfig(linesSource: unknown, pointsSource: unknown): Record<string, unknown> {
    return {
      id: this.exportLayerId,
      type: 'style',
      metadata: {
        label: 'GPS tracks',
        legendRole: 'overlay',
        abstract: 'Tracked GPS points and the tracks connecting them, recorded via "Track me".',
        properties: [{ name: 'timestamp', type: 'create-time' }]
      },
      sources: {
        lines: { type: 'geojson', data: linesSource },
        points: { type: 'geojson', data: pointsSource }
      },
      layers: [
        {
          id: 'gps-tracks-lines',
          type: 'line',
          source: 'lines',
          paint: {
            'line-color': 'rgb(66, 133, 244)',
            'line-width': 3,
            'line-opacity': 0.8
          }
        },
        {
          id: 'gps-tracks-points',
          type: 'circle',
          source: 'points',
          paint: {
            'circle-radius': 3,
            'circle-color': '#ffffff',
            'circle-stroke-color': 'rgb(66, 133, 244)',
            'circle-stroke-width': 1
          }
        }
      ]
    };
  }

  /** Wipe stored track points (the last-track-id counter is kept and keeps incrementing). */
  private eraseStoredTracks(): void {
    saveStoredTrackPoints([]);
    this.storedPointCount = 0;
    if (this.mapElement) {
      const state = this.getMapStateIfAny(this.mapElement);
      if (state) {
        state.trail = [];
        state.trackOrder = 0;
      }
    }
  }

  private async handleExportAddToMap(): Promise<void> {
    this.exportDialogOpen = false;
    if (!this.adapter || !this.mapElement) return;
    const adapter = this.adapter;
    const { points, lines } = buildTrackGeoJSON(loadStoredTrackPoints());
    if (points.features.length === 0) return;
    if (adapter.hasLayer(this.exportLayerId)) {
      adapter.getSource(this.exportLinesSourceId)?.setData(lines);
      adapter.getSource(this.exportPointsSourceId)?.setData(points);
    } else {
      await this.mapElement.addLayerRequest(this.buildTracksStyleConfig(lines, points));
    }
    if (this.eraseAfterExport) this.eraseStoredTracks();
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
