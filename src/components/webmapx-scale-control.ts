import { css, html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';
import type { IMap } from '../map/IMapInterfaces';
import type { LngLat, Pixel, ViewChangeEndEvent, ViewChangeEvent } from '../store/map-events';
import { haversineDistanceCm } from '../utils/geo-calculations';

type ScaleUnit = 'metric' | 'imperial' | 'nautical';

interface Bounds {
  sw: LngLat;
  ne: LngLat;
}

@customElement('webmapx-scale-control')
export class WebmapxScaleControl extends WebmapxBaseTool {
  @property({ type: Number, attribute: 'max-width' })
  maxWidth = 100;

  @property({ type: String, attribute: 'unit' })
  unit: ScaleUnit = 'metric';

  @state()
  private barWidth = 0;

  @state()
  private label = '—';

  private resizeObserver: ResizeObserver | null = null;
  private unsubscribeEvents: Array<() => void> = [];
  private lastBounds: Bounds | null = null;
  private lastCenter: LngLat | null = null;
  private lastZoom: number | null = null;
  private hasLiveView = false;
  private attachedAdapter: IMap | null = null;
  private lastUnprojectStatus: 'ok' | 'off-globe' | 'failed' | 'none' = 'none';

  static styles = css`
    :host {
      display: inline-flex;
      /* Default carries bottom breathing room: this control is usually placed
         in a bottom zone directly above the attribution line, and the bar is
         open at the bottom, so with no gap it reads as sitting on it. It stays
         part of the shorthand fallback rather than a separate margin-bottom
         declaration — a later margin-bottom would silently beat the margin a
         config sets through --webmapx-tool-margin. */
      margin: var(--webmapx-tool-margin, 0 0 4px 0);
      /* Read-only chrome: the bar has no interaction of its own, and it sits
         over the map, so pan/zoom/tap must pass straight through it. The
         layout's overlay surface is pointer-events:none and re-enables it per
         control, so this is an opt-out, not a default. */
      pointer-events: none;
      font-size: var(--font-size-small, 12px);
      color: var(--webmapx-scale-color, var(--color-text-primary, #16202a));
    }

    /*
     * The bar sits directly on the map, so it has no surface of its own to give
     * it contrast — and over satellite imagery a dark bar on a dark sea is
     * invisible. A halo rather than a background plate: a plate would hide the
     * imagery it is measuring, while an outline keeps the map visible through
     * the control and works over anything, light or dark.
     *
     * The text gets it from four offset shadows (there is no text-outline in
     * CSS), the rules from a drop-shadow filter, which follows the border
     * shape rather than the box.
     */
    .scale-shell {
      filter:
        drop-shadow(0 0 1px var(--webmapx-scale-halo, rgba(255, 255, 255, 0.9)))
        drop-shadow(0 0 2px var(--webmapx-scale-halo, rgba(255, 255, 255, 0.9)));
    }

    .scale-label {
      --halo: var(--webmapx-scale-halo, rgba(255, 255, 255, 0.9));
      text-shadow:
        -1px 0 var(--halo), 1px 0 var(--halo),
        0 -1px var(--halo), 0 1px var(--halo),
        -1px -1px var(--halo), 1px -1px var(--halo),
        -1px 1px var(--halo), 1px 1px var(--halo);
    }

    /*
     * In dark mode the map chrome is light on dark, so the halo turns dark to
     * keep the same job: separating the bar from whatever is behind it.
     */
    :host-context([data-theme='dark']) .scale-shell,
    :host-context([data-theme='dark']) .scale-label {
      --webmapx-scale-halo: rgba(0, 0, 0, 0.75);
    }

    .scale-shell {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 22px;
      padding: 0;
      margin: 0;
      background: var(--webmapx-scale-bg, transparent);
      border-left: var(--webmapx-scale-border-thickness, 2px) solid var(--webmapx-scale-border-color, var(--color-text-primary, #16202a));
      border-right: var(--webmapx-scale-border-thickness, 2px) solid var(--webmapx-scale-border-color, var(--color-text-primary, #16202a));
      border-bottom: var(--webmapx-scale-border-thickness, 2px) solid var(--webmapx-scale-border-color, var(--color-text-primary, #16202a));
      box-sizing: border-box;
      user-select: none;
    }

    .scale-label {
      font-weight: 500;
      letter-spacing: 0.01em;
      text-transform: none;
      line-height: 1;
      font-size: 11px;
    }

    .muted {
      color: var(--color-text-secondary, #5a6773);
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.observeContainer();
  }

  disconnectedCallback(): void {
    this.teardownObservers();
    this.clearEventSubscriptions();
    super.disconnectedCallback();
  }

  protected onMapAttached(adapter: IMap): void {
    this.clearEventSubscriptions();
    this.hasLiveView = false;
    this.attachedAdapter = adapter;
    this.observeContainer();

    const moveHandler = (evt: ViewChangeEvent) => {
      this.hasLiveView = true;
      this.lastBounds = evt.bounds;
      this.lastCenter = evt.center;
      this.lastZoom = evt.zoom;
      // Skip unproject-based recalculation during active pan/zoom; update on end.
    };

    const endHandler = (evt: ViewChangeEndEvent) => {
      this.hasLiveView = true;
      this.lastBounds = evt.bounds;
      this.lastCenter = evt.center;
      this.lastZoom = evt.zoom;
      this.recalculateScale();
    };

    this.unsubscribeEvents.push(adapter.events.on('view-change', moveHandler));
    this.unsubscribeEvents.push(adapter.events.on('view-change-end', endHandler));

    // Seed from current store/state for initial render
    this.applyStateSnapshot(adapter.store.getState(), true);
  }

  protected updated(changed: PropertyValues<this>): void {
    if (changed.has('maxWidth') || changed.has('unit')) {
      this.recalculateScale();
    }
  }

  protected onMapDetached(): void {
    this.clearEventSubscriptions();
    this.hasLiveView = false;
    this.barWidth = 0;
    this.label = '—';
    this.attachedAdapter = null;
  }

  protected onStateChanged(state: IMapState): void {
    // Use state as a fallback or initial sync; live events take precedence.
    this.applyStateSnapshot(state, !this.hasLiveView);
  }

  private applyStateSnapshot(state: IMapState, allowUpdate: boolean): void {
    if (!allowUpdate) return;

    let updated = false;
    const bounds = this.extractBounds(state.mapViewportBounds);
    if (bounds) {
      this.lastBounds = bounds;
      updated = true;
    }
    if (state.mapCenter) {
      this.lastCenter = state.mapCenter;
      updated = true;
    }
    if (state.zoomLevel != null) {
      this.lastZoom = state.zoomLevel;
      updated = true;
    }

    if (updated) {
      this.recalculateScale();
    }
  }

  private recalculateScale(): void {
    if (!this.attachedAdapter?.store.getState().mapLoaded) return;
    this.lastUnprojectStatus = 'none';
    const requestedWidth = this.maxWidthPx;
    const surface = this.getSurfaceMetrics();
    const containerWidth = surface?.width ?? 0;
    const target = this.getTargetPixel(surface);
    const targetX = target?.x ?? null;
    const targetY = target?.y ?? null;
    const sampleLat = this.getSampleLatitude(targetY, surface);

    if (!containerWidth || containerWidth <= 0) {
      this.barWidth = 0;
      this.label = '—';
      return;
    }

    const metersForSegment = this.estimateMetersForWidth(requestedWidth, containerWidth, sampleLat, targetX, targetY);
    if (!metersForSegment || metersForSegment <= 0 || !isFinite(metersForSegment)) {
      this.barWidth = 0;
      this.label = '—';
      return;
    }

    const display = this.buildDisplay(metersForSegment, requestedWidth, this.normalizedUnit);
    if (!display) {
      this.barWidth = 0;
      this.label = '—';
      return;
    }

    this.barWidth = display.widthPx;
    this.label = display.label;
  }

  private estimateMetersForWidth(segmentWidthPx: number, containerWidth: number, sampleLat: number | null, targetX: number | null, targetY: number | null): number | null {
    const unprojectResult = this.segmentDistanceViaUnproject(segmentWidthPx, targetX, targetY);
    if (unprojectResult?.status === 'ok' && unprojectResult.meters > 0) {
      this.lastUnprojectStatus = 'ok';
      return unprojectResult.meters;
    }
    if (!unprojectResult || unprojectResult.status === 'off-globe' || unprojectResult.status === 'failed') {
      this.lastUnprojectStatus = unprojectResult?.status ?? 'failed';
      return null;
    }

    // Fallback: approximate using zoom/lat when unproject is unavailable for other reasons.
    if (this.lastZoom != null) {
      const lat = sampleLat ?? this.lastCenter?.[1];
      const metersPerPixel = webMercatorMetersPerPixel(this.lastZoom, lat ?? 0);
      return metersPerPixel * segmentWidthPx;
    }

    const boundsMeters = this.horizontalMetersAcrossBounds(this.lastBounds, sampleLat);
    if (boundsMeters && boundsMeters > 0 && containerWidth > 0) {
      const metersPerPixel = boundsMeters / containerWidth;
      return metersPerPixel * segmentWidthPx;
    }

    return null;
  }

  private horizontalMetersAcrossBounds(bounds: Bounds | null, sampleLat: number | null): number | null {
    if (!bounds) return null;
    const centerLat = clampLatitude(sampleLat ?? (bounds.sw[1] + bounds.ne[1]) / 2);
    const west = bounds.sw[0];
    const east = bounds.ne[0];
    const spanDeg = normalizeLongitudeSpan(east - west);
    if (spanDeg <= 0) {
      return null;
    }
    const metersPerDegLon = METERS_PER_DEG_LON_AT_EQUATOR * Math.cos(centerLat * Math.PI / 180);
    const meters = Math.abs(spanDeg) * metersPerDegLon;
    return meters > 0 ? meters : null;
  }

  private buildDisplay(maxMeters: number, maxWidthPx: number, unit: ScaleUnit): { widthPx: number; label: string } | null {
    if (!isFinite(maxMeters) || maxMeters <= 0) return null;

    if (unit === 'imperial') {
      const feet = maxMeters * 3.28084;
      if (feet > 5280) {
        const miles = feet / 5280;
        const rounded = getRoundNum(miles);
        return {
          widthPx: maxWidthPx * (rounded / miles),
          label: `${rounded} mi`
        };
      }
      const rounded = getRoundNum(feet);
      return {
        widthPx: maxWidthPx * (rounded / feet),
        label: `${rounded} ft`
      };
    }

    if (unit === 'nautical') {
      const nautical = maxMeters / 1852;
      const rounded = getRoundNum(nautical);
      return {
        widthPx: maxWidthPx * (rounded / nautical),
        label: `${rounded} nm`
      };
    }

    if (maxMeters >= 1000) {
      const km = maxMeters / 1000;
      const rounded = getRoundNum(km);
      return {
        widthPx: maxWidthPx * (rounded / km),
        label: `${rounded} km`
      };
    }

    const rounded = getRoundNum(maxMeters);
    return {
      widthPx: maxWidthPx * (rounded / maxMeters),
      label: `${rounded} m`
    };
  }

  private get normalizedUnit(): ScaleUnit {
    const value = (this.unit || '').toLowerCase();
    if (value === 'imperial' || value === 'nautical') {
      return value;
    }
    return 'metric';
  }

  private get maxWidthPx(): number {
    const value = Number(this.maxWidth);
    if (!Number.isFinite(value) || value <= 0) {
      return 100;
    }
    return value;
  }

  private extractBounds(feature: GeoJSON.Feature<GeoJSON.Polygon> | null): Bounds | null {
    const ring = feature?.geometry?.coordinates?.[0];
    if (!Array.isArray(ring) || ring.length < 4) {
      return null;
    }
    const sw = ring[0] as LngLat;
    const ne = ring[2] as LngLat;
    return { sw, ne };
  }

  private getContainerWidth(): number {
    const mapHost = this.mapHost;
    const container = mapHost?.mapElement ?? mapHost;
    if (!container) return 0;
    return container.clientWidth || 0;
  }

  private observeContainer(): void {
    this.teardownObservers();
    const container = this.mapHost?.mapElement ?? this.mapHost;
    if (!container || typeof ResizeObserver === 'undefined') {
      return;
    }
    this.resizeObserver = new ResizeObserver(() => this.recalculateScale());
    this.resizeObserver.observe(container);
  }

  private teardownObservers(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  private clearEventSubscriptions(): void {
    if (this.unsubscribeEvents.length) {
      this.unsubscribeEvents.forEach(unsub => unsub());
      this.unsubscribeEvents = [];
    }
  }

  private getSampleLatitude(targetY: number | null, surface: { width: number; height: number } | null): number | null {
    const mapElement = this.mapHost?.mapElement ?? this.mapHost;
    if (!mapElement || !this.attachedAdapter) return null;
    if (targetY === null || targetY === undefined) return null;
    const metrics = surface ?? this.getSurfaceMetrics();
    if (!metrics) return null;

    const lng = this.lastCenter?.[0] ?? 0;

    let low = -85.05112878;
    let high = 85.05112878;
    let bestLat = (low + high) / 2;

    for (let i = 0; i < 24; i++) {
      const mid = (low + high) / 2;
      const projected = this.attachedAdapter.project([lng, mid]);
      const py = projected?.[1] ?? NaN;
      if (!isFinite(py)) {
        break;
      }
      bestLat = mid;
      if (Math.abs(py - targetY) < 0.1) {
        break;
      }
      // In WebMercator, y increases southward; larger lat moves y upward
      if (py > targetY) {
        low = mid;
      } else {
        high = mid;
      }
    }

    return clampLatitude(bestLat);
  }

  private getTargetPixel(surface?: { width: number; height: number } | null): { x: number; y: number } | null {
    const mapElement = this.mapHost?.mapElement ?? this.mapHost;
    if (!mapElement) return null;
    const mapRect = mapElement.getBoundingClientRect();
    const controlRect = this.getBoundingClientRect();
    if (!mapRect.height || !mapRect.width) return null;
    const metrics = surface ?? this.getSurfaceMetrics();
    if (!metrics) return null;
    const rawY = ((controlRect.top + controlRect.bottom) / 2) - mapRect.top;
    const rawX = ((controlRect.left + controlRect.right) / 2) - mapRect.left;
    return {
      x: Math.min(Math.max(rawX, 0), metrics.width),
      y: Math.min(Math.max(rawY, 0), metrics.height),
    };
  }

  private segmentDistanceViaUnproject(segmentWidthPx: number, targetX: number | null, targetY: number | null): { status: 'ok'; meters: number } | { status: 'off-globe' } | { status: 'failed' } | null {
    if (!this.attachedAdapter) return null;
    const mapElement = this.mapHost?.mapElement ?? this.mapHost;
    if (!mapElement) return null;
    const surface = this.getSurfaceMetrics();
    if (!surface) return null;
    const { width, height } = surface;
    if (!width || !height || !segmentWidthPx || targetY === null || targetY === undefined || targetX === null || targetX === undefined) return null;

    const attempt = (sampleY: number, _tag: string) => {
      const halfSpan = Math.min(segmentWidthPx / 2, width / 2);
      const centerX = Math.min(Math.max(targetX, halfSpan), width - halfSpan);
      const leftPx: Pixel = [centerX - halfSpan, sampleY];
      const rightPx: Pixel = [centerX + halfSpan, sampleY];

      if (!this.attachedAdapter) return null;
      const left = this.attachedAdapter.unproject(leftPx);
      const right = this.attachedAdapter.unproject(rightPx);
      if (!left || !right) {
        return null;
      }

      const distanceCm = haversineDistanceCm(left, right);
      const meters = distanceCm / 100;
      if (!isFinite(meters) || meters <= 0) {
        return null;
      }
      return { meters };
    };

    const primaryY = targetY ?? height / 2;
    let result = attempt(primaryY, 'primary');
    if (!result) {
      const fallbackY = mapElement.clientHeight / 2;
      if (fallbackY !== primaryY) {
        result = attempt(fallbackY, 'center-fallback');
      }
    }

    if (!result) {
      this.lastUnprojectStatus = 'off-globe';
      return { status: 'off-globe' };
    }

    this.lastUnprojectStatus = 'ok';
    return { status: 'ok', meters: result.meters };
  }

  private debugLog(_event: string, _payload: Record<string, unknown>): void {
    // Debug logging removed for production; reintroduce if needed.
  }

  private getSurfaceMetrics(): { width: number; height: number } | null {
    const mapElement = this.mapHost?.mapElement ?? this.mapHost;
    if (!mapElement) return null;
    const width = mapElement.clientWidth;
    const height = mapElement.clientHeight;
    if (!width || !height) return null;
    return { width, height };
  }

  protected render() {
    const muted = this.barWidth <= 0;
    const surface = this.getSurfaceMetrics();
    const containerWidth = surface?.width ?? this.getContainerWidth();
    const shellWidth = this.barWidth > 0
      ? Math.max(0, Math.min(this.barWidth, containerWidth || Number.POSITIVE_INFINITY))
      : Math.min(this.maxWidthPx, containerWidth || this.maxWidthPx);
    const shellStyle = `width: ${shellWidth}px`;

    return html`
      <div class="scale-shell" role="presentation" style=${shellStyle}>
        <div class="scale-label ${muted ? 'muted' : ''}">${this.label}</div>
      </div>
    `;
  }
}

function webMercatorMetersPerPixel(zoom: number, latitude: number): number {
  const earthCircumference = 40075016.68557849; // meters
  const tileSize = 512;
  const latRad = clampLatitude(latitude) * Math.PI / 180;
  return (earthCircumference * Math.cos(latRad)) / (tileSize * Math.pow(2, zoom));
}

function clampLatitude(lat: number): number {
  return Math.max(-85.05112878, Math.min(85.05112878, lat));
}

function normalizeLongitudeSpan(delta: number): number {
  // Normalize to [0, 360], preserving a full-world view
  let span = delta;
  if (span < 0) {
    span += 360;
  }
  if (span === 0) {
    // Typical full-world bounds: west=-180, east=180
    return 360;
  }
  if (span > 360) {
    return 360;
  }
  return span;
}

const METERS_PER_DEG_LON_AT_EQUATOR = 111319.49079327357;

function getDecimalRoundNum(value: number): number {
  const multiplier = Math.pow(10, Math.ceil(-Math.log(value) / Math.LN10));
  return Math.round(value * multiplier) / multiplier;
}

function getRoundNum(num: number): number {
  const pow10 = Math.pow(10, (`${Math.floor(num)}`).length - 1);
  let d = num / pow10;

  d = d >= 10 ? 10 :
      d >= 5 ? 5 :
      d >= 3 ? 3 :
      d >= 2 ? 2 :
      d >= 1 ? 1 : getDecimalRoundNum(d);

  return pow10 * d;
}
