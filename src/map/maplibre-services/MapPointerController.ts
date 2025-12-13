import { MapStateStore } from '../../store/map-state-store';
import { MapEventBus, LngLat, Pixel, PointerResolution } from '../../store/map-events';
import { throttle } from '../../utils/throttle';
import * as maplibregl from 'maplibre-gl';

/**
 * MapPointerController - Normalizes MapLibre pointer events into generic map events.
 *
 * This is the only place that knows about MapLibre's event API.
 * Tools subscribe to the MapEventBus and receive library-agnostic events.
 */
export class MapPointerController {
  private map: maplibregl.Map | null = null;
  private detachFns: Array<() => void> = [];

  // Throttled emitter for high-frequency pointer-move events
  private readonly throttledPointerMove = throttle((
    coords: LngLat,
    pixel: Pixel,
    resolution: PointerResolution | null,
    originalEvent: unknown
  ) => {
    // Emit to event bus (for tools)
    this.eventBus.emit({
      type: 'pointer-move',
      coords,
      pixel,
      resolution,
      originalEvent
    });

    // Also update state store (for backward compatibility)
    this.store.dispatch({
      pointerCoordinates: coords,
      pointerResolution: resolution,
    }, 'MAP');
  }, 32);

  constructor(
    private readonly store: MapStateStore,
    private readonly eventBus: MapEventBus
  ) {}

  public attach(map: maplibregl.Map): void {
    if (this.map === map) {
      return;
    }

    this.detach();
    this.map = map;

    const handleMouseMove = (event: maplibregl.MapMouseEvent) => {
      const coords: LngLat = [event.lngLat.lng, event.lngLat.lat];
      const pixel: Pixel = [event.point.x, event.point.y];
      const resolution = this.computePointerResolution(event);
      this.throttledPointerMove(coords, pixel, resolution, event.originalEvent);
    };

    const handleMouseOut = (event: maplibregl.MapMouseEvent) => {
      this.eventBus.emit({
        type: 'pointer-leave',
        originalEvent: event.originalEvent
      });
      this.store.dispatch({ pointerCoordinates: null, pointerResolution: null }, 'MAP');
    };

    const handleClick = (event: maplibregl.MapMouseEvent) => {
      const coords: LngLat = [event.lngLat.lng, event.lngLat.lat];
      const pixel: Pixel = [event.point.x, event.point.y];
      const resolution = this.computePointerResolution(event);

      this.eventBus.emit({
        type: 'click',
        coords,
        pixel,
        resolution,
        originalEvent: event.originalEvent
      });

      this.store.dispatch({
        lastClickedCoordinates: coords,
        lastClickedResolution: resolution,
        pointerCoordinates: coords,
        pointerResolution: resolution,
      }, 'MAP');
    };

    const handleDblClick = (event: maplibregl.MapMouseEvent) => {
      const coords: LngLat = [event.lngLat.lng, event.lngLat.lat];
      const pixel: Pixel = [event.point.x, event.point.y];

      this.eventBus.emit({
        type: 'dblclick',
        coords,
        pixel,
        originalEvent: event.originalEvent
      });
    };

    const handleContextMenu = (event: maplibregl.MapMouseEvent) => {
      const coords: LngLat = [event.lngLat.lng, event.lngLat.lat];
      const pixel: Pixel = [event.point.x, event.point.y];

      this.eventBus.emit({
        type: 'contextmenu',
        coords,
        pixel,
        originalEvent: event.originalEvent
      });
    };

    map.on('mousemove', handleMouseMove);
    map.on('mouseout', handleMouseOut);
    map.on('click', handleClick);
    map.on('dblclick', handleDblClick);
    map.on('contextmenu', handleContextMenu);

    this.detachFns = [
      () => map.off('mousemove', handleMouseMove),
      () => map.off('mouseout', handleMouseOut),
      () => map.off('click', handleClick),
      () => map.off('dblclick', handleDblClick),
      () => map.off('contextmenu', handleContextMenu),
    ];
  }

  public detach(): void {
    this.detachFns.forEach((fn) => fn());
    this.detachFns = [];
    this.map = null;
  }

  private computePointerResolution(event: maplibregl.MapMouseEvent): PointerResolution | null {
    if (!this.map || !event.point) {
      return null;
    }

    const map = this.map;
    const basePoint = event.point;
    const baseLngLat = event.lngLat;

    const lngSample = map.unproject([basePoint.x + 1, basePoint.y]);
    const latSample = map.unproject([basePoint.x, basePoint.y + 1]);

    const lngDelta = Math.abs(lngSample.lng - baseLngLat.lng);
    const latDelta = Math.abs(latSample.lat - baseLngLat.lat);

    if (!isFinite(lngDelta) || !isFinite(latDelta)) {
      return null;
    }

    return {
      lng: Math.max(lngDelta, 1e-12),
      lat: Math.max(latDelta, 1e-12),
    };
  }
}
