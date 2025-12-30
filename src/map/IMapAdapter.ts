import { MapStateStore } from '../store/map-state-store';
import { MapEventBus, LngLat, Pixel } from '../store/map-events';
import { IMapCore, IToolService, IMapFactory, ILayerService } from './IMapInterfaces';

export interface IMapAdapter {
  readonly store: MapStateStore;
  readonly core: IMapCore;
  readonly toolService: IToolService;
  readonly layerService?: ILayerService;

  /**
   * Factory for creating map instances.
   * Tools use this to create independent maps (e.g., inset maps).
   *
   * @example
   * const map = adapter.mapFactory.createMap(container, { interactive: false });
   * map.onReady(() => {
   *   const source = map.createSource('viewport', { type: 'FeatureCollection', features: [] });
   *   const layer = map.createLayer({ id: 'viewport-fill', type: 'fill', sourceId: 'viewport', paint: { 'fill-color': '#0f62fe' } });
   *   source.setData(newData);
   * });
   */
  readonly mapFactory: IMapFactory;

  /**
   * Event bus for normalized map events.
   * Tools subscribe here to receive library-agnostic events.
   *
   * @example
   * adapter.events.on('view-change-end', (e) => {
   *   console.log(`View changed to ${e.center}`);
   * });
   */
  readonly events: MapEventBus;

  /** Projects geographic coordinates (LngLat) to pixel coordinates [x, y]. */
  project(coords: LngLat): Pixel;
}
