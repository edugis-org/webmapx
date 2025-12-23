import { IMapAdapter } from './IMapAdapter';
import { MapLibreAdapter } from './maplibre-adapter';
import { OpenLayersAdapter } from './openlayers-adapter';
import { LeafletAdapter } from './leaflet-adapter';

export type MapAdapterFactory = () => IMapAdapter;

const registry = new Map<string, MapAdapterFactory>();

export const DEFAULT_ADAPTER_NAME = 'maplibre';

export function registerMapAdapter(name: string, factory: MapAdapterFactory): void {
  if (!name || typeof name !== 'string') {
    console.error('[adapter-registry] Adapter name must be a non-empty string.');
    return;
  }
  registry.set(name.toLowerCase(), factory);
}

export function getRegisteredAdapters(): string[] {
  return Array.from(registry.keys());
}

export function createMapAdapter(requestedName?: string): IMapAdapter | null {
  const key = (requestedName ?? DEFAULT_ADAPTER_NAME).toLowerCase();
  const factory = registry.get(key);
  if (!factory) {
    console.error(`[adapter-registry] No adapter registered under "${key}".`);
    return null;
  }
  return factory();
}

// Register adapters on module load
registerMapAdapter(DEFAULT_ADAPTER_NAME, () => new MapLibreAdapter());
registerMapAdapter('openlayers', () => new OpenLayersAdapter());
registerMapAdapter('ol', () => new OpenLayersAdapter());
registerMapAdapter('leaflet', () => new LeafletAdapter());
registerMapAdapter('l', () => new LeafletAdapter());
