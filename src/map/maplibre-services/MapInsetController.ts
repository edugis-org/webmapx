import * as maplibregl from 'maplibre-gl';
import { store } from '../../store/central-state';
import { IAppState } from '../../store/IState';

interface InsetOptions {
  zoomOffset?: number;
  styleUrl?: string;
  baseScale?: number;
}

interface InsetContext {
  container: HTMLElement;
  map: maplibregl.Map;
  options: ResolvedInsetOptions;
}

type ResolvedInsetOptions = {
  zoomOffset: number;
  styleUrl: string;
  baseScale: number;
};

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json';
const DEFAULT_OFFSET = -3;
const MIN_INSET_ZOOM = 0;
const MAX_INSET_ZOOM = 22;
const POSITIVE_SCALE_CAP = 1;

export class MapInsetController {
  private contexts = new Map<HTMLElement, InsetContext>();
  private unsubscribe: (() => void) | null = null;

  public attach(container: HTMLElement, options?: InsetOptions): void {
    if (!container) {
      return;
    }

    this.detach(container);

    const resolvedOptions: ResolvedInsetOptions = {
      zoomOffset: options?.zoomOffset ?? DEFAULT_OFFSET,
      styleUrl: options?.styleUrl ?? DEFAULT_STYLE,
      baseScale: options?.baseScale ?? 0.5,
    };

    const state = store.getState();
    const map = new maplibregl.Map({
      container,
      style: resolvedOptions.styleUrl,
      center: state.mapCenter ?? [0, 0],
      zoom: this.clampZoom((state.zoomLevel ?? 0) + resolvedOptions.zoomOffset),
      attributionControl: false,
      interactive: false,
      minZoom: MIN_INSET_ZOOM,
      maxZoom: MAX_INSET_ZOOM,
      renderWorldCopies: true,
    });

    // Disable interactions explicitly to keep inset passive.
    map.boxZoom?.disable();
    map.scrollZoom?.disable();
    map.dragPan?.disable();
    map.dragRotate?.disable();
    map.keyboard?.disable();
    map.doubleClickZoom?.disable();
    map.touchZoomRotate?.disable();

    this.contexts.set(container, { container, map, options: resolvedOptions });
    container.style.setProperty('--gis-inset-scale', `${resolvedOptions.baseScale}`);
    this.ensureSubscription();
    this.applyStateToContext(this.contexts.get(container)!, state);
  }

  public detach(container: HTMLElement): void {
    const context = this.contexts.get(container);
    if (!context) {
      return;
    }

    context.map.remove();
    this.contexts.delete(container);
    this.releaseSubscriptionIfIdle();
  }

  public detachAll(): void {
    Array.from(this.contexts.keys()).forEach((container) => this.detach(container));
  }

  private ensureSubscription(): void {
    if (this.unsubscribe) {
      return;
    }

    this.unsubscribe = store.subscribe((state, _source) => {
      this.handleStateChange(state);
    });
  }

  private releaseSubscriptionIfIdle(): void {
    if (this.contexts.size === 0 && this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  private handleStateChange(state: IAppState): void {
    this.contexts.forEach((context) => this.applyStateToContext(context, state));
  }

  private applyStateToContext(context: InsetContext, state: IAppState): void {
    if (!context.map || !state.mapCenter) {
      return;
    }

    const requestedZoom = (state.zoomLevel ?? 0) + context.options.zoomOffset;
    const view = this.resolveViewState(requestedZoom, context.options);

    context.container.style.setProperty('--gis-inset-scale', `${view.scale}`);
    context.map.jumpTo({ center: state.mapCenter, zoom: view.mapZoom, bearing: 0, pitch: 0 });
  }

  private clampZoom(value: number): number {
    return Math.min(MAX_INSET_ZOOM, Math.max(MIN_INSET_ZOOM, value));
  }

  private resolveViewState(requestedZoom: number, options: ResolvedInsetOptions): { mapZoom: number; scale: number } {
    // Case 1: Derived zoom <= 0 -> stay at zoom 0, scale down.
    if (requestedZoom <= 0) {
      return { mapZoom: 0, scale: options.baseScale };
    }

    // Case 2: 0 < derived zoom <= POSITIVE_SCALE_CAP -> scale up to 1, keep zoom 0.
    if (requestedZoom <= POSITIVE_SCALE_CAP) {
      const scale = options.baseScale + (1 - options.baseScale) * (requestedZoom / POSITIVE_SCALE_CAP);
      return { mapZoom: 0, scale };
    }

    // Case 3: derived zoom > POSITIVE_SCALE_CAP -> scale fixed at 1, excess into map zoom.
    const residual = requestedZoom - POSITIVE_SCALE_CAP;
    const mapZoom = this.clampZoom(residual);
    return { mapZoom, scale: 1 };
  }
}

export const mapInsetController = new MapInsetController();
