import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { resolveMapElement } from './map-context';
import { IMapAdapter } from '../../map/IMapAdapter';
import { IMap, ISource } from '../../map/IMapInterfaces';
import { IAppState } from '../../store/IState';
import { throttle } from '../../utils/throttle';
import type { LngLat } from '../../store/map-events';

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
  private lastRequestedBoundsKey: string | null = null;
  private initPromise: Promise<void> | null = null;
  private pendingViewportBounds: GeoJSON.Feature<GeoJSON.Polygon> | null | undefined = null;
  private throttledViewportUpdate = throttle(() => {
    this.doUpdateViewportRectangle(this.pendingViewportBounds);
    this.pendingViewportBounds = undefined;
  }, 50);

  // Throttle state updates to avoid excessive rendering during map movement
  private throttledApplyState = throttle((state: IAppState) => {
    this.applyState(state);
  }, 50);

  private throttledRenderLog = throttle((label: string) => {
    //console.log('[inset-debug]', label);
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
    const incomingKey = this.computeBoundsKey(state.mapViewportBounds) ?? '__null__';
    if (incomingKey === this.lastRequestedBoundsKey) {
      return;
    }
    this.lastRequestedBoundsKey = incomingKey;
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
    this.pendingViewportBounds = bounds;
    this.throttledViewportUpdate();
  }

  private doUpdateViewportRectangle(bounds: GeoJSON.Feature<GeoJSON.Polygon> | null | undefined): void {
    if (!this.viewportSource) return;

    // Skip if incoming bounds key matches current
    const quickKey = this.computeBoundsKey(bounds) ?? '__null__';
    if (quickKey === this.lastBoundsKey) {
      return;
    }

    if (!bounds) {
      return;
    }

    if (!bounds.geometry?.coordinates?.[0]?.length) {
      return;
    }

    this.throttledRenderLog('start calc');
    const densified = this.densifyViewportBounds(bounds);
    if (!densified) {
      this.throttledRenderLog('end calc (skipped - no bounds)');
      return;
    }
    this.throttledRenderLog('end calc');
    const nextKey = this.computeBoundsKey(densified);
    if (nextKey === this.lastBoundsKey) {
      return;
    }
    this.lastBoundsKey = nextKey;

    // Debug ring size to monitor CPU load
    const densifiedRing = densified ? this.coerceRing(densified.geometry.coordinates?.[0]) : undefined;
    const ringSpan = densifiedRing && densifiedRing.length ? this.computeSpan(densifiedRing) : null;
    const maxLat = densifiedRing && densifiedRing.length ? Math.max(...densifiedRing.map(([, lat]) => lat)) : null;
    const minLat = densifiedRing && densifiedRing.length ? Math.min(...densifiedRing.map(([, lat]) => lat)) : null;

    const hasIntersection = densifiedRing ? this.hasSelfIntersection(densifiedRing) : false;
    /*console.log('[inset-debug] ring sizes', {
      densifiedLength: densifiedRing?.length ?? 0,
      densifiedKey: nextKey,
      maxLat,
      minLat,
      latExceeded: maxLat !== null && Math.abs(maxLat) > 90 || minLat !== null && Math.abs(minLat) > 90,
      span: ringSpan,
      selfIntersection: hasIntersection,
    });
    if (hasIntersection && densifiedRing) {
      console.log('[inset-debug] self-intersection ring', densifiedRing);
    }*/

    const nearPole = maxLat !== null && Math.abs(maxLat) >= 75 || minLat !== null && Math.abs(minLat) >= 75;
    const badSpan = ringSpan && ((nearPole && ringSpan.lon > 170) || ringSpan.lon >= 330);
    if (badSpan) {
      console.warn('[inset-debug] skip render due to span', { ringSpan, nearPole });
    }

    const data: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: (!densified || hasIntersection || badSpan) ? [] : [densified],
    };

    this.throttledRenderLog('start render');
    this.viewportSource.setData(data);
    this.throttledRenderLog('end render');
  }

  private hasRelevantStateChange(state: IAppState): boolean {
    const center = state.mapCenter;
    const zoom = state.zoomLevel;
    const boundsKey = this.computeBoundsKey(this.densifyViewportBounds(state.mapViewportBounds));

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
    const ring = this.coerceRing(bounds.geometry?.coordinates?.[0]);
    if (!ring || ring.length < 4) return null;
    const r = (n: number) => n.toFixed(6);
    // Use ordered corner list so rotations update even when the bbox is unchanged
    return ring.map(pt => `${r(pt[0])}:${r(pt[1])}`).join('|');
  }

  /** Normalize/clamp incoming bounds to a closed ring */
  private normalizeViewportBounds(bounds: GeoJSON.Feature<GeoJSON.Polygon> | null | undefined): GeoJSON.Feature<GeoJSON.Polygon> | null {
    if (!bounds) return null;
    const ring = this.coerceRing(bounds.geometry?.coordinates?.[0]);
    if (ring.length < 4) return null;

    const normalized = ring
      .map(pt => this.sanitizeCoord(pt as [number, number]))
      .filter((pt): pt is [number, number] => !!pt);

    if (normalized.length < 4) return null;

    const closed = this.ensureClosed(normalized);

    return {
      type: 'Feature',
      properties: bounds.properties ?? {},
      geometry: { type: 'Polygon', coordinates: [closed] },
    };
  }

  /** Adds intermediate points using pixel sampling when spans are large */
  private densifyViewportBounds(bounds: GeoJSON.Feature<GeoJSON.Polygon> | null | undefined): GeoJSON.Feature<GeoJSON.Polygon> | null {
    if (!bounds) return null;
    const normalized = this.normalizeViewportBounds(bounds);
    if (!normalized) return null;
    const ring = this.coerceRing(normalized.geometry.coordinates[0] as GeoJSON.Position[]);
    if (ring.length < 4) return normalized;

    const densifiedRing = this.densifyRingWithPixels(ring);
    if (!densifiedRing.length) return null;
    const closed = this.ensureClosed(densifiedRing);

    return {
      type: 'Feature',
      properties: bounds.properties ?? {},
      geometry: { type: 'Polygon', coordinates: [closed] },
    };
  }

  private densifyRingWithPixels(ring: [number, number][]): [number, number][] {
    if (!this.adapter) return ring;
    const closedRing = this.ensureClosed(ring);
    const unwrapped = this.ensureClosed(this.unwrapLongitudes(ring));
    const span = this.computeSpan(unwrapped);
    const maxAbsLat = unwrapped.reduce((m, [, lat]) => Math.max(m, Math.abs(lat)), 0);
    const nearPole = maxAbsLat >= 75;
    if (span.lat <= 2 && span.lon <= 2) {
      return closedRing;
    }

    const pixelRing = unwrapped
      .map(pt => this.adapter?.core.project(pt as LngLat))
      .filter((px): px is [number, number] => Array.isArray(px) && px.length === 2 && px.every(Number.isFinite));

    if (pixelRing.length < 2) {
      return closedRing;
    }

    const stepPx = 50;
    const sampled: [number, number][] = [];
    for (let i = 1; i < pixelRing.length; i++) {
      const a = pixelRing[i - 1];
      const b = pixelRing[i];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(1, Math.ceil(dist / stepPx));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        sampled.push([a[0] + dx * t, a[1] + dy * t]);
      }
    }

    // Downsample if extreme counts to avoid CPU spikes
    const maxPoints = 100;
    let sampledPixels = sampled;
    if (sampledPixels.length > maxPoints) {
      const stride = Math.ceil(sampledPixels.length / maxPoints);
      sampledPixels = sampledPixels.filter((_, idx) => idx % stride === 0);
      if (sampledPixels[sampledPixels.length - 1] !== sampled[sampled.length - 1]) {
        sampledPixels.push(sampled[sampled.length - 1]);
      }
    }

    const coords: [number, number][] = [];
    for (const px of sampledPixels) {
      const lngLat = this.adapter.core.unproject(px as [number, number]);
      if (!lngLat || !Number.isFinite(lngLat[0]) || !Number.isFinite(lngLat[1])) {
        continue;
      }
      const clampedLat = this.clampLat(lngLat[1]);
      const clampedLng = this.normalizeLng(lngLat[0]);
      coords.push([clampedLng, clampedLat]);
    }

    // Filter out-of-bounds latitudes after clamping as a safeguard
    const safeCoords = coords
      .map(([lng, lat]) => [lng, Math.max(-79, Math.min(79, lat))] as [number, number])
      .filter(([, lat]) => Math.abs(lat) <= 90);

    const continuous = this.rewrapContinuousLongitudes(safeCoords.length ? safeCoords : closedRing);
    const maxSpan = nearPole ? 160 : 300;
    const bounded = this.limitLongitudeSpan(continuous, maxSpan);
    const deduped = this.dedupeSequential(bounded);
    const collapsed = this.collapseFlatRuns(deduped);
    const candidate = collapsed.length >= 4 ? collapsed : (bounded.length >= 4 ? bounded : closedRing);
    return this.ensureClosed(candidate.length ? candidate : closedRing);
  }

  private computeSpan(ring: [number, number][]): { lon: number; lat: number } {
    if (!ring.length) return { lon: 0, lat: 0 };
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const [lng, lat] of ring) {
      minLon = Math.min(minLon, lng);
      maxLon = Math.max(maxLon, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
    return { lon: maxLon - minLon, lat: maxLat - minLat };
  }

  private hasSelfIntersection(ring: [number, number][]): boolean {
    if (ring.length < 4) return false;
    // Ensure closed for comparison
    const coords = this.ensureClosed(ring);
    const n = coords.length;
    const intersects = (a1: [number, number], a2: [number, number], b1: [number, number], b2: [number, number]) => {
      const det = (p: [number, number], q: [number, number], r: [number, number]) =>
        (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
      const d1 = det(a1, a2, b1);
      const d2 = det(a1, a2, b2);
      const d3 = det(b1, b2, a1);
      const d4 = det(b1, b2, a2);
      const denom = (d1 === 0 && d2 === 0 && d3 === 0 && d4 === 0);
      if (denom) {
        return false;
      }
      return (d1 * d2 < 0) && (d3 * d4 < 0);
    };

    for (let i = 0; i < n - 1; i++) {
      const a1 = coords[i];
      const a2 = coords[i + 1];
      for (let j = i + 2; j < n - 1; j++) {
        // skip adjacent segments and the shared end with closure
        if (i === 0 && j === n - 2) continue;
        const b1 = coords[j];
        const b2 = coords[j + 1];
        if (intersects(a1, a2, b1, b2)) {
          return true;
        }
      }
    }
    return false;
  }

  private unwrapLongitudes(ring: [number, number][]): [number, number][] {
    if (!ring.length) return [];
    const unwrapped: [number, number][] = [[ring[0][0], ring[0][1]]];
    for (let i = 1; i < ring.length; i++) {
      const prevLon = unwrapped[i - 1][0];
      const lon = ring[i][0];
      const delta = this.shortestDelta(prevLon, lon);
      unwrapped.push([prevLon + delta, ring[i][1]]);
    }
    return unwrapped;
  }

  private shortestDelta(fromLng: number, toLng: number): number {
    const delta = toLng - fromLng;
    return ((delta + 540) % 360) - 180;
  }

  private rewrapContinuousLongitudes(coords: [number, number][]): [number, number][] {
    if (!coords.length) return coords;
    const result: [number, number][] = [];
    let prevLon = this.normalizeLng(coords[0][0]);
    result.push([prevLon, coords[0][1]]);
    for (let i = 1; i < coords.length; i++) {
      const rawLon = coords[i][0];
      const normLon = this.normalizeLng(rawLon);
      const delta = this.shortestDelta(prevLon, normLon);
      const nextLon = prevLon + delta;
      result.push([nextLon, coords[i][1]]);
      prevLon = nextLon;
    }
    // Shift entire ring so first point is within [-180,180]
    const shift = Math.round(result[0][0] / 360) * 360;
    return result.map(([lon, lat]) => [lon - shift, lat]);
  }

  private limitLongitudeSpan(ring: [number, number][], maxSpan: number): [number, number][] {
    if (!ring.length || !Number.isFinite(maxSpan) || maxSpan <= 0) return ring;
    const unwrapped = this.unwrapLongitudes(ring);
    const span = this.computeSpan(unwrapped);
    if (span.lon <= maxSpan) return ring;
    const minLon = Math.min(...unwrapped.map(([lon]) => lon));
    const maxLon = Math.max(...unwrapped.map(([lon]) => lon));
    const center = (minLon + maxLon) / 2;
    const half = maxSpan / 2;
    const clipped = unwrapped.map(([lon, lat]) => {
      const limitedLon = Math.max(center - half, Math.min(center + half, lon));
      return [limitedLon, lat] as [number, number];
    });
    return this.rewrapContinuousLongitudes(clipped);
  }

  private dedupeSequential(ring: [number, number][]): [number, number][] {
    const cleaned: [number, number][] = [];
    for (const pt of ring) {
      const prev = cleaned[cleaned.length - 1];
      if (!prev || prev[0] !== pt[0] || prev[1] !== pt[1]) {
        cleaned.push(pt);
      }
    }
    return cleaned;
  }

  private collapseFlatRuns(ring: [number, number][]): [number, number][] {
    if (ring.length < 3) return ring;
    const result: [number, number][] = [ring[0], ring[1]];
    for (let i = 2; i < ring.length; i++) {
      const a = result[result.length - 2];
      const b = result[result.length - 1];
      const c = ring[i];
      const sameLat = a[1] === b[1] && b[1] === c[1];
      const sameLng = a[0] === b[0] && b[0] === c[0];
      if (sameLat || sameLng) {
        // Replace the last point with current, effectively keeping only endpoints of flat runs
        result[result.length - 1] = c;
      } else {
        result.push(c);
      }
    }
    return result;
  }

  private normalizeLng(lng: number): number {
    return ((lng + 180) % 360) - 180;
  }

  private clampLat(lat: number): number {
    return Math.max(-80, Math.min(80, lat));
  }

  private ensureClosed(ring: [number, number][]): [number, number][] {
    if (ring.length === 0) return [];
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) return ring;
    return [...ring, first];
  }

  private coerceRing(ring: GeoJSON.Position[] | undefined): [number, number][] {
    if (!ring) return [];
    const result: [number, number][] = [];
    for (const pt of ring) {
      if (!Array.isArray(pt) || pt.length < 2) continue;
      const [lng, lat] = pt;
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
      result.push([lng as number, lat as number]);
    }
    return result;
  }

  private sanitizeCoord(coord: [number, number]): [number, number] | null {
    let [lng, lat] = coord;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return null;
    }
    lat = this.clampLat(lat);
    lng = this.normalizeLng(lng);
    return [lng, lat];
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
