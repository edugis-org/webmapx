const ENGINE_MAP: Record<string, () => Promise<unknown>> = {
  maplibre:   () => import('../map/maplibre-adapter.js'),
  openlayers: () => import('../map/openlayers-adapter.js'),
  leaflet:    () => import('../map/leaflet-adapter.js'),
  cesium:     () => import('../map/cesium-adapter.js'),
};

export async function loadEngine(name: string): Promise<void> {
  const loader = ENGINE_MAP[name];
  if (!loader) throw new Error(`[webmapx] Unknown engine: "${name}". Valid: ${Object.keys(ENGINE_MAP).join(', ')}`);
  await loader();
}
