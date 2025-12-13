import { MapStateStore } from '../store/map-state-store';
import { MapEventBus } from '../store/map-events';
import { IMapCore, IToolService } from './IMapInterfaces';

export interface IInsetController {
  attach(container: HTMLElement, options?: unknown): void;
  detach(container: HTMLElement): void;
  detachAll(): void;
}

export interface IMapAdapter {
  readonly store: MapStateStore;
  readonly core: IMapCore;
  readonly toolService: IToolService;
  readonly inset: IInsetController;

  /**
   * Event bus for normalized map events.
   * Tools subscribe here to receive library-agnostic events.
   *
   * @example
   * adapter.events.on('pointer-move', (e) => {
   *   console.log(`Pointer at ${e.coords}`);
   * });
   *
   * adapter.events.on('click', (e) => {
   *   console.log(`Clicked at ${e.coords}`);
   * });
   */
  readonly events: MapEventBus;
}
