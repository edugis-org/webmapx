export type MapStorageKind = 'adapter' | 'viewport';

export function normalizeAdapterName(name: string | null | undefined): string | null {
  if (!name) {
    return null;
  }

  switch (name.toLowerCase()) {
    case 'ol':
      return 'openlayers';
    case 'l':
      return 'leaflet';
    case 'c':
      return 'cesium';
    default:
      return name.toLowerCase();
  }
}

export function getMapScopedStorageKey(mapId: string | null | undefined, kind: MapStorageKind): string | null {
  return mapId ? `webmapx-${kind}:${mapId}` : null;
}

export interface ResolveAdapterSelectionOptions {
  explicitAdapter?: string | null;
  savedAdapter?: string | null;
  configuredAdapter?: string | null;
  defaultAdapter?: string;
}

export function resolveAdapterSelection({
  explicitAdapter,
  savedAdapter,
  configuredAdapter,
  defaultAdapter = 'maplibre',
}: ResolveAdapterSelectionOptions): string {
  return (
    normalizeAdapterName(savedAdapter) ??
    normalizeAdapterName(explicitAdapter) ??
    normalizeAdapterName(configuredAdapter) ??
    normalizeAdapterName(defaultAdapter) ??
    'maplibre'
  );
}
