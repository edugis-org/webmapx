import { MapStateStore } from '../store/map-state-store';
import { IMapCore, IMapZoomController, IToolService } from './IMapInterfaces';

export interface IInsetController {
  attach(container: HTMLElement, options?: unknown): void;
  detach(container: HTMLElement): void;
  detachAll(): void;
}

export interface IMapAdapter {
  readonly store: MapStateStore;
  readonly core: IMapCore;
  readonly toolService: IToolService;
  readonly zoomController: IMapZoomController;
  readonly inset: IInsetController;
}
