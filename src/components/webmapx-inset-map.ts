import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { resolveMapElement } from './internal/map-context';
import type { IMap, ISource, ISubMap, MapCreateOptions } from '../map/IMapInterfaces';
import { IMapState } from '../store/IMapState';
import { throttle } from '../utils/throttle';
import type { LngLat } from '../store/map-events';
import type { InsetMapToolConfig } from '../config/types';

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json';
const MIN_ZOOM = 0;
const MAX_ZOOM = 22;
const MAX_MERCATOR_LAT = 85.05112878;
const MAX_GEODETIC_LAT = 89.999;
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

  private adapter: IMap | null = null;
  private insetMap: ISubMap | null = null;
  private viewportSource: ISource | null = null;
  private unsubscribe: (() => void) | null = null;
  private lastCenter: [number, number] | null = null;
  private lastZoom: number | null = null;
  private projectionMode: 'mercator' | 'geodetic' = 'mercator';
  private lastBoundsKey: string | null = null;
  private lastRequestedBoundsKey: string | null = null;
  private initPromise: Promise<void> | null = null;
  private pendingViewportBounds: GeoJSON.Feature<GeoJSON.Polygon> | null | undefined = null;
  private throttledViewportUpdate = throttle(() => {
    this.doUpdateViewportRectangle(this.pendingViewportBounds);
    this.pendingViewportBounds = undefined;
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
    this.adapter = adapter as IMap;
    this.projectionMode = this.resolveProjectionMode(mapElement);

    const state = this.adapter.store.getState();
    const toolConfig = this.resolveInsetToolConfig(mapElement);
    const zoomOffset = this.resolveInsetNumber('zoom-offset', this.zoomOffset, toolConfig.zoomOffset);
    const baseScale = this.resolveInsetNumber('base-scale', this.baseScale, toolConfig.baseScale);
    const styleUrl = this.hasAttribute('style-url') ? this.styleUrl : toolConfig.styleUrl;
    const background = this.resolveInsetBackground(toolConfig);

    // Create the inset map
    const createOptions: MapCreateOptions = {
      styleUrl: styleUrl ?? DEFAULT_STYLE,
      center: state.mapCenter ?? [0, 0],
      zoom: this.clampZoom((state.zoomLevel ?? 0) + zoomOffset),
      interactive: false,
      ...(background ? {
        tileUrl: background.url,
        tileUrls: Array.isArray(background.tiles)
          ? background.tiles.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
          : undefined,
        tileAttribution: background.attribution,
        tileSize: background.tileSize,
      } : {}),
    };

    this.insetMap = this.adapter.mapFactory.createMap(container, createOptions);

    // Set initial scale
    container.style.setProperty('--webmapx-inset-scale', `${baseScale}`);

    // Setup layers when map is ready
    this.insetMap.onReady(() => {
      this.setupViewportLayers();
      this.applyState(state, zoomOffset);
    });

    // Subscribe to state changes (throttled)
    this.unsubscribe = this.adapter.store.subscribe((newState) => {
      if (!this.hasRelevantStateChange(newState)) {
        return;
      }
      this.throttledApplyStateWithZoomOffset(newState, zoomOffset);
    });
  }

  private resolveInsetToolConfig(mapElement: HTMLElement): InsetMapToolConfig {
    const config = (mapElement as any)?.config;
    const rawInsetConfig = config?.tools?.insetMap;
    if (!rawInsetConfig || typeof rawInsetConfig !== 'object') {
      return { enabled: true };
    }
    return rawInsetConfig as InsetMapToolConfig;
  }

  private resolveInsetBackground(config: InsetMapToolConfig): InsetMapToolConfig['background'] | null {
    const bg = config.background;
    if (!bg || bg.service !== 'xyz') {
      return null;
    }
    const hasUrl = typeof bg.url === 'string' && bg.url.length > 0;
    const hasTiles = Array.isArray(bg.tiles)
      && bg.tiles.length > 0
      && bg.tiles.every((entry) => typeof entry === 'string' && entry.length > 0);
    if (!hasUrl && !hasTiles) {
      return null;
    }
    return bg;
  }

  private resolveInsetNumber(attributeName: string, propertyValue: number, configuredValue: unknown): number {
    if (this.hasAttribute(attributeName)) {
      return propertyValue;
    }

    if (typeof configuredValue === 'number' && Number.isFinite(configuredValue)) {
      return configuredValue;
    }

    return propertyValue;
  }

  private throttledApplyStateWithZoomOffset = throttle((state: IMapState, zoomOffset: number) => {
    this.applyState(state, zoomOffset);
  }, 50);

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
    this.projectionMode = 'mercator';
    this.lastBoundsKey = null;
  }

  private resolveProjectionMode(mapElement: HTMLElement): 'mercator' | 'geodetic' {
    const mapConfig = (mapElement as any)?.mapConfig;
    const style = mapConfig?.style;

    if (style && typeof style === 'object') {
      const projection = (style as Record<string, unknown>).projection;
      if (projection && typeof projection === 'object') {
        const type = (projection as Record<string, unknown>).type;
        if (typeof type === 'string' && type.toLowerCase() === 'globe') {
          return 'geodetic';
        }
      }
    }

    return 'mercator';
  }

  private updateProjectionModeFromBounds(bounds: GeoJSON.Feature<GeoJSON.Polygon> | null | undefined): void {
    const ring = this.coerceRing(bounds?.geometry?.coordinates?.[0]);
    if (!ring.length) {
      return;
    }

    const maxAbsLat = ring.reduce((max, [, lat]) => Math.max(max, Math.abs(lat)), 0);
    if (maxAbsLat > MAX_MERCATOR_LAT + 0.001) {
      this.projectionMode = 'geodetic';
    }
  }

  private maxViewportLat(): number {
    return this.projectionMode === 'geodetic' ? MAX_GEODETIC_LAT : MAX_MERCATOR_LAT;
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

  private applyState(state: IMapState, zoomOffset = this.zoomOffset): void {
    if (!this.insetMap) return;

    const container = this.insetContainer;
    if (!container) return;

    this.updateProjectionModeFromBounds(state.mapViewportBounds);

    if (state.mapCenter) {
      const requestedZoom = (state.zoomLevel ?? 0) + zoomOffset;
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

    const fullWidthFeature = this.buildFullWidthViewportFeature(bounds);
    if (fullWidthFeature) {
      const fullWidthKey = this.computeBoundsKey(fullWidthFeature);
      if (fullWidthKey === this.lastBoundsKey) {
        return;
      }
      this.lastBoundsKey = fullWidthKey;
      this.viewportSource.setData({
        type: 'FeatureCollection',
        features: [fullWidthFeature],
      });
      return;
    }

    const wideViewportFeature = this.buildWideViewportFeature(bounds);
    if (wideViewportFeature) {
      const wideKey = this.computeBoundsKey(wideViewportFeature);
      if (wideKey === this.lastBoundsKey) {
        return;
      }
      this.lastBoundsKey = wideKey;
      this.viewportSource.setData({
        type: 'FeatureCollection',
        features: [wideViewportFeature],
      });
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

    const badSpan = ringSpan && ringSpan.lon >= 359.5;

    // At very wide/global zoom levels, keep rendering a simple normalized ring instead
    // of hiding the rectangle entirely.
    let featureToRender: GeoJSON.Feature<GeoJSON.Polygon> | null = densified;
    if (hasIntersection || badSpan) {
      const fallback = this.normalizeViewportBounds(bounds);
      const fallbackRing = fallback ? this.coerceRing(fallback.geometry.coordinates?.[0]) : [];
      const fallbackIntersects = fallbackRing.length ? this.hasSelfIntersection(fallbackRing) : true;
      featureToRender = fallback && !fallbackIntersects ? fallback : null;
    }

    const data: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: featureToRender ? [featureToRender] : [],
    };

    this.throttledRenderLog('start render');
    this.viewportSource.setData(data);
    this.throttledRenderLog('end render');
  }

  private hasRelevantStateChange(state: IMapState): boolean {
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
    const rawRing = this.coerceRing(bounds.geometry?.coordinates?.[0]);
    const anchorLng = this.lastCenter?.[0] ?? rawRing[0]?.[0] ?? 0;
    const ring = this.ensureClosed(this.unwrapLongitudes(rawRing, anchorLng));
    if (ring.length < 4) return null;

    const normalized = ring
      .map(([lng, lat]) => {
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
          return null;
        }
        return [this.normalizeLngAround(lng, anchorLng), this.clampLat(lat)] as [number, number];
      })
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
    const anchorLng = this.lastCenter?.[0] ?? closedRing[0]?.[0] ?? 0;
    const unwrapped = this.ensureClosed(this.unwrapLongitudes(ring, anchorLng));
    const span = this.computeSpan(unwrapped);
    const maxAbsLat = unwrapped.reduce((m, [, lat]) => Math.max(m, Math.abs(lat)), 0);
    const nearPole = maxAbsLat >= 75;
    if (span.lat <= 2 && span.lon <= 2) {
      return closedRing;
    }

    const pixelRing = unwrapped
      .map(pt => this.adapter?.project(pt as LngLat))
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
      const lngLat = this.adapter.unproject(px as [number, number]);
      if (!lngLat || !Number.isFinite(lngLat[0]) || !Number.isFinite(lngLat[1])) {
        continue;
      }
      const clampedLat = this.clampLat(lngLat[1]);
      const clampedLng = this.normalizeLng(lngLat[0]);
      coords.push([clampedLng, clampedLat]);
    }

    // Filter out-of-bounds latitudes after clamping as a safeguard
    const safeCoords = coords
      .map(([lng, lat]) => [lng, this.clampLat(lat)] as [number, number])
      .filter(([, lat]) => Math.abs(lat) <= this.maxViewportLat());

    const continuous = this.rewrapContinuousLongitudes(safeCoords.length ? safeCoords : closedRing);
    // Do not shrink wide viewports based on latitude; wrapped/near-global views
    // need their true horizontal span preserved.
    const maxSpan = 359;
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

  private buildFullWidthViewportFeature(bounds: GeoJSON.Feature<GeoJSON.Polygon>): GeoJSON.Feature<GeoJSON.Polygon> | null {
    const rawRing = this.coerceRing(bounds.geometry?.coordinates?.[0]);
    if (rawRing.length < 4) {
      return null;
    }

    const anchorLng = this.lastCenter?.[0] ?? rawRing[0][0] ?? 0;
    const sampledRange = this.sampleViewportLongitudeRange(anchorLng);
    const sampledViewportWidthDeg = sampledRange?.width;
    const ringViewportWidthDeg = this.estimateViewportWidthDeg(rawRing, anchorLng);
    const viewportWidthDeg = Math.max(sampledViewportWidthDeg ?? 0, ringViewportWidthDeg);

    // Only force full-width mode when the visible viewport itself spans (almost) a full world.
    if (viewportWidthDeg < 345) {
      return null;
    }

    const normalized = this.normalizeViewportBounds(bounds);
    const normalizedRing = normalized ? this.coerceRing(normalized.geometry.coordinates?.[0]) : [];
    if (!normalizedRing.length) {
      return null;
    }

    const latValues = normalizedRing.map(([, lat]) => lat);
    const maxLatLimit = this.maxViewportLat();
    const minLat = Math.max(-maxLatLimit, Math.min(...latValues));
    const maxLat = Math.min(maxLatLimit, Math.max(...latValues));
    if (!Number.isFinite(minLat) || !Number.isFinite(maxLat) || maxLat < minLat) {
      return null;
    }

    const west = -179.999;
    const east = 179.999;
    const fullWidthRing: [number, number][] = [
      [west, minLat],
      [west, maxLat],
      [east, maxLat],
      [east, minLat],
      [west, minLat],
    ];

    return {
      type: 'Feature',
      properties: bounds.properties ?? {},
      geometry: {
        type: 'Polygon',
        coordinates: [fullWidthRing],
      },
    };
  }

  private buildWideViewportFeature(bounds: GeoJSON.Feature<GeoJSON.Polygon>): GeoJSON.Feature<GeoJSON.Polygon> | null {
    const rawRing = this.coerceRing(bounds.geometry?.coordinates?.[0]);
    if (rawRing.length < 4) {
      return null;
    }

    const anchorLng = this.lastCenter?.[0] ?? rawRing[0][0] ?? 0;
    const sampledRange = this.sampleViewportLongitudeRange(anchorLng);
    const sampledViewportWidthDeg = sampledRange?.width;
    const ringViewportWidthDeg = this.estimateViewportWidthDeg(rawRing, anchorLng);
    const viewportWidthDeg = Math.max(sampledViewportWidthDeg ?? 0, ringViewportWidthDeg);

    // Wide (wrapped) but not global-full-width: keep authored viewport ring, skip densify rewrap.
    if (viewportWidthDeg <= 170 || viewportWidthDeg >= 345) {
      return null;
    }

    const normalized = this.normalizeViewportBounds(bounds);
    if (!normalized) {
      return null;
    }

    const normalizedRing = this.coerceRing(normalized.geometry.coordinates?.[0]);
    if (!normalizedRing.length || this.hasSelfIntersection(normalizedRing)) {
      return null;
    }

    // In wide-between mode, prefer sampled horizontal envelope so we don't accidentally
    // render the narrow complement strip near the dateline switchpoint.
    if (sampledRange && sampledRange.width > 170 && sampledRange.width < 345) {
      const latValues = normalizedRing.map(([, lat]) => lat);
      const maxLatLimit = this.maxViewportLat();
      const minLat = Math.max(-maxLatLimit, Math.min(...latValues));
      const maxLat = Math.min(maxLatLimit, Math.max(...latValues));
      if (Number.isFinite(minLat) && Number.isFinite(maxLat) && maxLat >= minLat) {
        const sampledRing: [number, number][] = [
          [sampledRange.minLon, minLat],
          [sampledRange.minLon, maxLat],
          [sampledRange.maxLon, maxLat],
          [sampledRange.maxLon, minLat],
          [sampledRange.minLon, minLat],
        ];

        return {
          type: 'Feature',
          properties: bounds.properties ?? {},
          geometry: {
            type: 'Polygon',
            coordinates: [sampledRing],
          },
        };
      }
    }

    return normalized;
  }

  private estimateViewportWidthFromScreenSamples(anchorLng: number): number | null {
    if (!this.adapter) {
      return null;
    }

    const mapHost = resolveMapElement(this);
    const mapSurface = mapHost?.mapElement;
    if (!mapSurface) {
      return null;
    }

    const width = mapSurface.clientWidth;
    const height = mapSurface.clientHeight;
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return null;
    }

    const range = this.sampleViewportLongitudeRange(anchorLng);
    if (!range) {
      return null;
    }

    return range.width > 0 ? range.width : null;
  }

  private sampleViewportLongitudeRange(anchorLng: number): { minLon: number; maxLon: number; width: number } | null {
    if (!this.adapter) {
      return null;
    }

    const mapHost = resolveMapElement(this);
    const mapSurface = mapHost?.mapElement;
    if (!mapSurface) {
      return null;
    }

    const width = mapSurface.clientWidth;
    const height = mapSurface.clientHeight;
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return null;
    }

    const rowFractions = [0.12, 0.32, 0.5, 0.68, 0.88];
    const colFractions = Array.from({ length: 21 }, (_, i) => i / 20);
    let globalMin = Infinity;
    let globalMax = -Infinity;
    let sawRow = false;

    for (const row of rowFractions) {
      const lons: number[] = [];
      for (const col of colFractions) {
        const x = width * col;
        const y = height * row;
        const lngLat = this.adapter.unproject([x, y]);
        if (!lngLat || !Number.isFinite(lngLat[0])) {
          continue;
        }
        lons.push(lngLat[0]);
      }

      if (lons.length < 2) {
        continue;
      }

      const normalizedLons = lons.map((lon) => this.normalizeLngAround(lon, anchorLng));
      const unwrapped = this.unwrapLongitudeSeries(normalizedLons);
      const minLon = Math.min(...unwrapped);
      const maxLon = Math.max(...unwrapped);
      if (Number.isFinite(minLon) && Number.isFinite(maxLon)) {
        globalMin = Math.min(globalMin, minLon);
        globalMax = Math.max(globalMax, maxLon);
        sawRow = true;
      }
    }

    if (!sawRow || !Number.isFinite(globalMin) || !Number.isFinite(globalMax)) {
      return null;
    }

    return {
      minLon: globalMin,
      maxLon: globalMax,
      width: Math.max(0, globalMax - globalMin),
    };
  }

  private unwrapLongitudeSeries(lons: number[]): number[] {
    if (!lons.length) {
      return [];
    }

    const unwrapped: number[] = [lons[0]];
    let offset = 0;

    for (let i = 1; i < lons.length; i++) {
      const prev = lons[i - 1];
      const current = lons[i];
      const delta = current - prev;

      if (delta < -180) {
        offset += 360;
      } else if (delta > 180) {
        offset -= 360;
      }

      unwrapped.push(current + offset);
    }

    return unwrapped;
  }

  private estimateViewportWidthDeg(rawRing: [number, number][], anchorLng: number): number {
    if (rawRing.length < 4) {
      return 0;
    }

    // Ring order from map cores is expected: bottom-left, bottom-right, top-right, top-left.
    const bl = rawRing[0][0];
    const br = rawRing[1][0];
    const tr = rawRing[2][0];
    const tl = rawRing[3][0];

    const blA = this.normalizeLngAround(bl, anchorLng);
    const brA = this.normalizeLngAround(br, anchorLng);
    const trA = this.normalizeLngAround(tr, anchorLng);
    const tlA = this.normalizeLngAround(tl, anchorLng);

    const bottomWidth = Math.abs(brA - blA);
    const topWidth = Math.abs(trA - tlA);
    return Math.max(bottomWidth, topWidth);
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

  private unwrapLongitudes(ring: [number, number][], anchorLng = 0): [number, number][] {
    if (!ring.length) return [];
    const firstLon = this.normalizeLngAround(ring[0][0], anchorLng);
    const unwrapped: [number, number][] = [[firstLon, ring[0][1]]];
    for (let i = 1; i < ring.length; i++) {
      const prevLon = unwrapped[i - 1][0];
      const lon = this.normalizeLngAround(ring[i][0], anchorLng);
      const delta = this.resolveDeltaWithAnchor(prevLon, lon, anchorLng);
      unwrapped.push([prevLon + delta, ring[i][1]]);
    }
    return unwrapped;
  }

  private resolveDeltaWithAnchor(fromLng: number, toLng: number, anchorLng: number): number {
    const shortest = this.shortestDelta(fromLng, toLng);
    const alternate = shortest > 0 ? shortest - 360 : shortest + 360;

    const shortestMid = fromLng + shortest / 2;
    const alternateMid = fromLng + alternate / 2;

    const shortestDistance = Math.abs(shortestMid - anchorLng);
    const alternateDistance = Math.abs(alternateMid - anchorLng);

    return alternateDistance + 1e-6 < shortestDistance ? alternate : shortest;
  }

  private normalizeLngAround(lng: number, anchorLng: number): number {
    const normalized = this.normalizeLng(lng);
    const wraps = Math.round((anchorLng - normalized) / 360);
    return normalized + wraps * 360;
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
    return ((((lng + 180) % 360) + 360) % 360) - 180;
  }

  private clampLat(lat: number): number {
    const maxLat = this.maxViewportLat();
    return Math.max(-maxLat, Math.min(maxLat, lat));
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
