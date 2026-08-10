import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import { resolveMapElement } from './internal/map-context';
import type { IMap, ISource, ISubMap, MapCreateOptions } from '../map/IMapInterfaces';
import { IMapState } from '../store/IMapState';
import { throttle } from '../utils/throttle';
import type { LngLat } from '../store/map-events';
import type { InsetMapToolConfig } from '../config/types';
import { DATA_TOOL } from '../theme/data-colors';

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

  @property({ type: String, attribute: 'background-layer' })
  public backgroundLayer?: string;

  @property({ type: Number, attribute: 'base-scale' })
  public baseScale = 0.5;

  @property({ type: Boolean, attribute: 'minimizable' })
  public minimizable = false;

  @property({ type: Boolean, reflect: true, attribute: 'collapsed' })
  private _collapsed = false;

  private adapter: IMap | null = null;
  private insetMap: ISubMap | null = null;
  private viewportSource: ISource | null = null;
  private unsubscribe: (() => void) | null = null;
  private lastCenter: [number, number] | null = null;
  private lastZoom: number | null = null;
  /** Last seen *source* map zoom (pre-offset/clamp), used to detect upstream zoom changes. */
  private lastSourceZoom: number | null = null;
  private projectionMode: 'mercator' | 'geodetic' = 'mercator';
  private lastBoundsKey: string | null = null;
  private initPromise: Promise<void> | null = null;
  private pendingViewportBounds: GeoJSON.Feature<GeoJSON.Polygon> | null | undefined = null;
  private idleCallbackId: number | null = null;
  private throttledViewportUpdate = throttle(() => {
    const bounds = this.pendingViewportBounds;
    this.pendingViewportBounds = undefined;
    if (this.idleCallbackId !== null) {
      (window.cancelIdleCallback ?? clearTimeout)(this.idleCallbackId);
    }
    const run = () => {
      this.idleCallbackId = null;
      this.doUpdateViewportRectangle(bounds);
    };
    if (typeof window.requestIdleCallback === 'function') {
      this.idleCallbackId = window.requestIdleCallback(run);
    } else {
      this.idleCallbackId = window.setTimeout(run, 300) as unknown as number;
    }
  }, 150);

  private throttledRenderLog = throttle((label: string) => {
    //console.log('[inset-debug]', label);
  }, 50);

  private get insetContainer(): HTMLElement | null {
    return this.renderRoot.querySelector('.inset-map');
  }

  static styles = css`
    :host {
      display: inline-block;
      position: relative;
      width: var(--webmapx-inset-width, 256px);
      height: var(--webmapx-inset-height, 256px);
      border: 1px solid var(--color-border, #d5dce3);
      border-radius: var(--webmapx-radius-md, 6px);
      overflow: hidden;
      background: var(--color-background-secondary, #f4f6f8);
      box-shadow: var(--webmapx-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.12));
      pointer-events: auto;
    }

    :host([minimizable]) {
      transition: width var(--webmapx-motion-base, 200ms), height var(--webmapx-motion-base, 200ms);
    }

    :host([collapsed]) {
      width: 32px;
      height: 32px;
      overflow: visible;
    }

    .toggle-btn {
      position: absolute;
      top: 2px;
      right: 2px;
      z-index: 10;
      background: rgba(255, 255, 255, 0.85);
      border-radius: 4px;
      line-height: 0;
      opacity: 0;
      transition: opacity var(--webmapx-motion-fast, 120ms);
    }

    :host(:hover) .toggle-btn,
    :host(:focus-within) .toggle-btn,
    :host([collapsed]) .toggle-btn {
      opacity: 1;
    }

    .inset-map-frame.hidden {
      display: none;
    }

    /* Pointer focus on the frame should not draw a ring, but the frame is
       tabindex=0 when minimizable, so keyboard focus must stay visible. */
    .inset-map-frame:focus {
      outline: none;
    }

    .inset-map-frame:focus-visible {
      outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #2b6c8f));
      outline-offset: var(--webmapx-focus-offset, 2px);
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
    if (changed.has('zoomOffset') || changed.has('styleUrl') || changed.has('baseScale') || changed.has('backgroundLayer')) {
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
    await this.waitForConfig(mapElement);
    const toolConfig = this.resolveInsetToolConfig(mapElement);
    const zoomOffset = this.resolveInsetNumber('zoom-offset', this.zoomOffset, toolConfig.zoomOffset);
    const baseScale = this.resolveInsetNumber('base-scale', this.baseScale, toolConfig.baseScale);
    const fromLayer = this.backgroundLayer
      ? this.resolveBackgroundFromLayer(mapElement, this.backgroundLayer)
      : null;
    const styleUrl = this.hasAttribute('style-url')
      ? this.styleUrl
      : (fromLayer?.styleUrl ?? toolConfig.styleUrl);
    const background = fromLayer
      ? fromLayer.background ?? null
      : this.resolveInsetBackground(toolConfig);

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

  // mapElement.config loads asynchronously; without this wait, an inset map
  // whose adapter is ready before config arrives falls back to DEFAULT_STYLE
  // instead of the configured background (e.g. OpenStreetMap).
  private waitForConfig(mapElement: HTMLElement): Promise<void> {
    if ((mapElement as any)?.config) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const handler = () => {
        mapElement.removeEventListener('webmapx-config-ready', handler);
        resolve();
      };
      mapElement.addEventListener('webmapx-config-ready', handler);
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

  /**
   * Resolves a `background-layer` attribute (a layer id from the main map's
   * layerData) to either a remote style URL (for `type: 'style'` layers,
   * e.g. OpenFreeMap) or an XYZ raster background. Returns null (default
   * style) if the layer doesn't exist or isn't a recognized type, logging an
   * error to help diagnose a misconfigured attribute.
   */
  private resolveBackgroundFromLayer(mapElement: HTMLElement, layerId: string): { styleUrl?: string; background?: InsetMapToolConfig['background'] } | null {
    const layerData = (mapElement as any)?.layerDataConfig;
    const layers: Array<Record<string, unknown>> = layerData?.layers ?? [];
    const sources: Array<Record<string, unknown>> = layerData?.sources ?? [];

    const layer = layers.find((l) => l?.id === layerId);
    if (!layer) {
      console.error(`[webmapx-inset-map] background-layer "${layerId}" not found in layerData.layers; using default background.`);
      return null;
    }

    if (layer.type === 'style') {
      if (typeof layer.url === 'string' && layer.url) {
        return { styleUrl: layer.url };
      }
      console.error(`[webmapx-inset-map] background-layer "${layerId}" is an inline style (no remote "url"); using default background.`);
      return null;
    }

    const sourceId = typeof layer.source === 'string' ? layer.source : layerId;
    const source = sources.find((s) => s?.id === sourceId);
    if (!source || source.service !== 'xyz') {
      console.error(`[webmapx-inset-map] background-layer "${layerId}" has no XYZ raster source or remote style; using default background.`);
      return null;
    }

    const url = source.url;
    const tiles = Array.isArray(url) ? url.filter((u): u is string => typeof u === 'string') : undefined;
    const singleUrl = typeof url === 'string' ? url : undefined;
    if (!tiles?.length && !singleUrl) {
      console.error(`[webmapx-inset-map] background-layer "${layerId}" source has no tile URL; using default background.`);
      return null;
    }

    return {
      background: {
        service: 'xyz',
        url: singleUrl,
        tiles,
        attribution: typeof source.attribution === 'string' ? source.attribution : undefined,
        tileSize: typeof source.tileSize === 'number' ? source.tileSize : undefined,
      },
    };
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
  }, 150);

  private destroyInset(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.idleCallbackId !== null) {
      (window.cancelIdleCallback ?? clearTimeout)(this.idleCallbackId);
      this.idleCallbackId = null;
    }
    if (this.insetMap) {
      this.insetMap.destroy();
      this.insetMap = null;
    }
    this.viewportSource = null;
    this.lastCenter = null;
    this.lastZoom = null;
    this.lastSourceZoom = null;
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
        'fill-color': DATA_TOOL,
        'fill-opacity': 0.15,
      },
    });

    // Create outline layer
    this.insetMap.createLayer({
      id: VIEWPORT_OUTLINE_LAYER_ID,
      type: 'line',
      sourceId: VIEWPORT_SOURCE_ID,
      paint: {
        'line-color': DATA_TOOL,
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

    // Update viewport rectangle. Dedup against the actually-rendered shape happens
    // inside doUpdateViewportRectangle (lastBoundsKey) — gating here too risked
    // recording a "requested" key that a coalesced throttle call never rendered,
    // leaving the rectangle stuck on a stale shape.
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

    if (!bounds || !bounds.geometry?.coordinates?.[0]?.length) {
      this.lastBoundsKey = '__null__';
      this.viewportSource.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    // Clip raw viewport ring to inset map extent before any densification.
    // This prevents expensive project/unproject work on horizon-distance points
    // that fall outside the inset view anyway.
    // Clip raw viewport ring to inset map extent before densification.
    // If clipping changed the ring, render the clipped polygon directly —
    // densification uses the main map's project/unproject which is unstable
    // near the horizon and the clipped polygon is already inset-scale.
    const insetBounds = this.getInsetBounds();
    if (insetBounds) {
      const rawRing = this.coerceRing(bounds.geometry.coordinates[0] as GeoJSON.Position[]);
      if (rawRing.length >= 3) {
        const clipped = this.clipRingToAabb(rawRing, insetBounds.minLng, insetBounds.minLat, insetBounds.maxLng, insetBounds.maxLat);
        if (clipped.length < 3) {
          // Viewport entirely outside inset view
          if (this.lastBoundsKey !== '__outside__') {
            this.lastBoundsKey = '__outside__';
            this.viewportSource.setData({ type: 'FeatureCollection', features: [] });
          }
          return;
        }
        const wasClipped = clipped.length !== rawRing.length ||
          clipped.some((pt, i) => pt[0] !== rawRing[i][0] || pt[1] !== rawRing[i][1]);
        if (wasClipped) {
          const clippedFeature: GeoJSON.Feature<GeoJSON.Polygon> = {
            ...bounds,
            geometry: { type: 'Polygon', coordinates: [this.ensureClosed(clipped)] },
          };
          const clippedKey = this.computeBoundsKey(clippedFeature);
          if (clippedKey !== this.lastBoundsKey) {
            this.lastBoundsKey = clippedKey;
            this.viewportSource.setData({ type: 'FeatureCollection', features: [clippedFeature] });
          }
          return;
        }
        // Not clipped: proceed with normal path (densification etc.)
      }
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
    // Use the raw bounds key (anchor-independent) rather than the densified one:
    // densify anchors/unwraps longitudes via this.lastCenter, which only updates
    // when the view actually changes — comparing against it here would make
    // change-detection depend on state it's supposed to be driving.
    const boundsKey = this.computeBoundsKey(state.mapViewportBounds);

    const centerChanged = !!center && !this.isSameCenter(center, this.lastCenter);
    const zoomChanged = zoom !== this.lastSourceZoom;
    const boundsChanged = boundsKey !== this.lastBoundsKey;

    // If we haven't applied anything yet, allow initialization updates through.
    const isInitial = (!this.lastCenter && !!center) || (this.lastSourceZoom === null && zoom !== null);

    this.lastSourceZoom = zoom;

    return isInitial || centerChanged || zoomChanged || boundsChanged;
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
    if (!this.adapter || !this.adapter.store.getState().mapLoaded) return ring;
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
    const maxStepsPerEdge = 25;
    const sampled: [number, number][] = [];
    for (let i = 1; i < pixelRing.length; i++) {
      const a = pixelRing[i - 1];
      const b = pixelRing[i];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.min(maxStepsPerEdge, Math.max(1, Math.ceil(dist / stepPx)));
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
    if (!this.adapter || !this.adapter.store.getState().mapLoaded) {
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
        if (!lngLat || !Number.isFinite(lngLat[0]) || Math.abs(lngLat[1]) > 85.05) {
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
    if (rawRing.length < 3) return 0;
    // Use bounding box of all ring points (works with any ring order/size).
    const normalized = rawRing.map(([lng]) => this.normalizeLngAround(lng, anchorLng));
    return Math.max(...normalized) - Math.min(...normalized);
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

  private getInsetBounds(): { minLng: number; minLat: number; maxLng: number; maxLat: number } | null {
    if (this.lastCenter === null || this.lastZoom === null) return null;
    const container = this.insetContainer;
    if (!container) return null;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w <= 0 || h <= 0) return null;
    const [cLng, cLat] = this.lastCenter;
    // Mercator: degrees per pixel at this zoom
    const degPerPxLat = 360 / (256 * Math.pow(2, this.lastZoom));
    const cosLat = Math.cos((cLat * Math.PI) / 180) || 1e-6;
    const degPerPxLng = degPerPxLat / cosLat;
    const halfW = (w / 2) * degPerPxLng;
    const halfH = (h / 2) * degPerPxLat;
    return {
      minLng: cLng - halfW,
      maxLng: cLng + halfW,
      minLat: Math.max(-MAX_MERCATOR_LAT, cLat - halfH),
      maxLat: Math.min(MAX_MERCATOR_LAT, cLat + halfH),
    };
  }

  // Sutherland-Hodgman clip against one axis-aligned half-plane.
  // inside(pt) returns true if pt is on the kept side.
  // intersect(a, b) returns the crossing point with the clip edge.
  private clipAgainstPlane(
    ring: [number, number][],
    inside: (p: [number, number]) => boolean,
    intersect: (a: [number, number], b: [number, number]) => [number, number],
  ): [number, number][] {
    if (ring.length === 0) return [];
    const out: [number, number][] = [];
    for (let i = 0; i < ring.length; i++) {
      const cur = ring[i];
      const prev = ring[(i + ring.length - 1) % ring.length];
      const curIn = inside(cur);
      const prevIn = inside(prev);
      if (curIn) {
        if (!prevIn) out.push(intersect(prev, cur));
        out.push(cur);
      } else if (prevIn) {
        out.push(intersect(prev, cur));
      }
    }
    return out;
  }

  private clipRingToAabb(
    ring: [number, number][],
    minLng: number, minLat: number, maxLng: number, maxLat: number,
  ): [number, number][] {
    const lerp = (a: [number, number], b: [number, number], t: number): [number, number] =>
      [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

    const tAtLng = (a: [number, number], b: [number, number], lng: number) =>
      (lng - a[0]) / (b[0] - a[0]);
    const tAtLat = (a: [number, number], b: [number, number], lat: number) =>
      (lat - a[1]) / (b[1] - a[1]);

    let r = ring;
    r = this.clipAgainstPlane(r, p => p[0] >= minLng, (a, b) => lerp(a, b, tAtLng(a, b, minLng)));
    r = this.clipAgainstPlane(r, p => p[0] <= maxLng, (a, b) => lerp(a, b, tAtLng(a, b, maxLng)));
    r = this.clipAgainstPlane(r, p => p[1] >= minLat, (a, b) => lerp(a, b, tAtLat(a, b, minLat)));
    r = this.clipAgainstPlane(r, p => p[1] <= maxLat, (a, b) => lerp(a, b, tAtLat(a, b, maxLat)));
    return r;
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
      <div class="inset-map-frame ${this._collapsed ? 'hidden' : ''}" tabindex=${this.minimizable ? '0' : '-1'}>
        <div class="inset-map"></div>
      </div>
      ${this.minimizable ? html`
        <div class="toggle-btn">
          <sl-icon-button
            name=${this._collapsed ? 'arrows-angle-expand' : 'arrows-angle-contract'}
            label=${this._collapsed ? 'Expand' : 'Collapse'}
            @click=${() => { this._collapsed = !this._collapsed; }}>
          </sl-icon-button>
        </div>
      ` : ''}
    `;
  }
}
