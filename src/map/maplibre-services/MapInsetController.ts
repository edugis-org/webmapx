import * as maplibregl from 'maplibre-gl';
import { store } from '../../store/central-state';
import { IAppState } from '../../store/IState';

interface InsetOptions {
  zoomOffset?: number;
  styleUrl?: string;
}

interface InsetContext {
  container: HTMLElement;
  map: maplibregl.Map;
  options: Required<InsetOptions>;
}

const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json';
const DEFAULT_OFFSET = -3;

export class MapInsetController {
  private contexts = new Map<HTMLElement, InsetContext>();
  private unsubscribe: (() => void) | null = null;

  public attach(container: HTMLElement, options?: InsetOptions): void {
    if (!container) {
      return;
    }

    this.detach(container);

    const resolvedOptions: Required<InsetOptions> = {
      zoomOffset: options?.zoomOffset ?? DEFAULT_OFFSET,
      styleUrl: options?.styleUrl ?? DEFAULT_STYLE,
    };

    const state = store.getState();
    const map = new maplibregl.Map({
      container,
      style: resolvedOptions.styleUrl,
      center: state.mapCenter ?? [0, 0],
      zoom: Math.max(0, (state.zoomLevel ?? 0) + resolvedOptions.zoomOffset),
      attributionControl: false,
      interactive: false,
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

    const zoom = Math.max(0, (state.zoomLevel ?? 0) + context.options.zoomOffset);
    context.map.jumpTo({ center: state.mapCenter, zoom });
  }
}

export const mapInsetController = new MapInsetController();
