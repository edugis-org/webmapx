import { MapStateStore } from '../../store/map-state-store';
import { throttle } from '../../utils/throttle';
import * as maplibregl from 'maplibre-gl';

type LngLatTuple = [number, number];
type Resolution = { lng: number; lat: number };

export class MapPointerController {
  private map: maplibregl.Map | null = null;
  private detachFns: Array<() => void> = [];

  private readonly throttledPointerDispatch = throttle((payload: {
    coords: LngLatTuple;
    resolution: Resolution | null;
  }) => {
    this.store.dispatch({
      pointerCoordinates: payload.coords,
      pointerResolution: payload.resolution,
    }, 'MAP');
  }, 32);

  constructor(private readonly store: MapStateStore) {}

  public attach(map: maplibregl.Map): void {
    if (this.map === map) {
      return;
    }

    this.detach();
    this.map = map;

    const handleMouseMove = (event: maplibregl.MapMouseEvent & maplibregl.EventData) => {
      const coords: LngLatTuple = [event.lngLat.lng, event.lngLat.lat];
      const resolution = this.computePointerResolution(event);
      this.throttledPointerDispatch({ coords, resolution });
    };

    const handleMouseOut = () => {
      this.store.dispatch({ pointerCoordinates: null, pointerResolution: null }, 'MAP');
    };

    const handleClick = (event: maplibregl.MapMouseEvent & maplibregl.EventData) => {
      const coords: LngLatTuple = [event.lngLat.lng, event.lngLat.lat];
      const resolution = this.computePointerResolution(event);
      this.store.dispatch({
        lastClickedCoordinates: coords,
        lastClickedResolution: resolution,
        pointerCoordinates: coords,
        pointerResolution: resolution,
      }, 'MAP');
    };

    map.on('mousemove', handleMouseMove);
    map.on('mouseout', handleMouseOut);
    map.on('click', handleClick);

    this.detachFns = [
      () => map.off('mousemove', handleMouseMove),
      () => map.off('mouseout', handleMouseOut),
      () => map.off('click', handleClick),
    ];
  }

  public detach(): void {
    this.detachFns.forEach((fn) => fn());
    this.detachFns = [];
    this.map = null;
  }

  private computePointerResolution(event: maplibregl.MapMouseEvent & maplibregl.EventData): Resolution | null {
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
