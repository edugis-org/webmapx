import { IMapAdapter } from './IMapAdapter';

export type MapAdapterFactory = () => Promise<IMapAdapter>;

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

export async function createMapAdapter(requestedName?: string): Promise<IMapAdapter | null> {
  const key = (requestedName ?? DEFAULT_ADAPTER_NAME).toLowerCase();
  const factory = registry.get(key);
  if (!factory) {
    console.error(`[adapter-registry] No adapter registered under "${key}".`);
    return null;
  }
  try {
    return await factory();
  } catch (error) {
    console.error(`[adapter-registry] Failed to create adapter "${key}".`, error);
    return null;
  }
}

// Register adapters on module load
registerMapAdapter(DEFAULT_ADAPTER_NAME, async () => {
  const { MapLibreAdapter } = await import('./maplibre-adapter');
  return new MapLibreAdapter();
});
registerMapAdapter('openlayers', async () => {
  const { OpenLayersAdapter } = await import('./openlayers-adapter');
  return new OpenLayersAdapter();
});
registerMapAdapter('ol', async () => {
  const { OpenLayersAdapter } = await import('./openlayers-adapter');
  return new OpenLayersAdapter();
});
registerMapAdapter('leaflet', async () => {
  const { LeafletAdapter } = await import('./leaflet-adapter');
  return new LeafletAdapter();
});
registerMapAdapter('l', async () => {
  const { LeafletAdapter } = await import('./leaflet-adapter');
  return new LeafletAdapter();
});
registerMapAdapter('cesium', async () => {
  const { createCesiumAdapter } = await import('./cesium-adapter');
  return await createCesiumAdapter();
});
registerMapAdapter('c', async () => {
  const { createCesiumAdapter } = await import('./cesium-adapter');
  return await createCesiumAdapter();
});
