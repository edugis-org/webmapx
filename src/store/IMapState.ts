/**
 * The single source of truth for one map instance state.
 * Any property added here must be initialized in the map-state-store.ts file.
 */
import type { ToolIconConfig } from '../config/types';

export interface IMapState {
    mapLoaded: boolean;
    /** True when the map is busy loading tiles/data or rendering */
    mapBusy: boolean;
    bufferRadiusKm: number;
    zoomLevel: number | null;
    mapCenter: [number, number] | null;
    mapBearing: number;
    mapPitch: number;
    mapViewportBounds: GeoJSON.Feature<GeoJSON.Polygon> | null;
    pointerCoordinates: [number, number] | null;
    lastClickedCoordinates: [number, number] | null;
    pointerResolution: { lng: number; lat: number } | null;
    lastClickedResolution: { lng: number; lat: number } | null;

    /** IDs of currently visible logical layers, in map order. */

    /** Engine-neutral registry for all layers currently known to the map. */
    mapLayers: Record<string, MapLayerStateEntry>;

    /**
     * Currently active tool in the UI state model.
     * The shape is intentionally generic so any tool can participate without
     * extending a hardcoded union.
     */
    activeTool: ActiveToolState | null;
}

export interface ActiveToolState {
    toolId: string;
    label?: string;
    icon?: ToolIconConfig;
}

export interface MapLayerStateEntry {
    label?: string;
    /** Generic source id from the layer spec. */
    sourceId?: string;
    /** Generic layer rendering type from the layer spec, e.g. fill, line, circle. */
    layerType?: string;
    hideFromLegend?: boolean;
    legendRole?: 'background' | 'overlay';
    /** Whether the legend for this layer is expanded in the legend panel. Defaults to true. */
    legendExpanded?: boolean;
    /** Whether the layer is visible. Undefined means visible (default). */
    visible?: boolean;
    /** User-set transparency (0–100 %). Undefined means no override (default 0). */
    transparency?: number;
    /** True when the layer was added from a local file drop — cannot be restored from a permalink. */
    dynamic?: boolean;
    [key: string]: unknown;
}

/** Defines who initiated the state change for loop prevention. */
export type StateSource = 'UI' | 'MAP' | 'INIT';
