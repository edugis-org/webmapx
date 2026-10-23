/** How an engine is named in UI text: its product name, not its adapter id. */
const ENGINE_LABELS: Record<string, string> = {
    maplibre: 'MapLibre GL',
    openlayers: 'OpenLayers',
    leaflet: 'Leaflet',
    cesium: 'Cesium',
};

/** The display name of an engine; an engine added by a plugin keeps its own id. */
export function engineLabel(engineId: string): string {
    return ENGINE_LABELS[engineId] ?? engineId;
}
