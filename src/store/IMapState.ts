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

    /**
     * The age the map's geological clock stands at, in millions of years, or
     * null when nothing has set one.
     *
     * Separate from `mapTime` rather than folded into it because the two are
     * different clocks: `mapTime` is a `Date`, which cannot express an age of
     * hundreds of millions of years, and a layer that follows the seasons has
     * no business moving when a plate-tectonics slider does.
     *
     * Computed sources read it through the `{ma}` placeholder, so a layer opts
     * in by naming it in its url and the paleotime tool needs to know nothing
     * about which layers exist.
     */
    paleoTimeMa: number | null;

    /** IDs of currently visible logical layers, in map order. */

    /** Engine-neutral registry for all layers currently known to the map. */
    mapLayers: Record<string, MapLayerStateEntry>;
    /** Shared attribute metadata catalog, keyed by name. Populated from layerData.attributeMetadata. */
    attributeMetadata: Record<string, unknown>;

    /**
     * Currently active tool in the UI state model.
     * The shape is intentionally generic so any tool can participate without
     * extending a hardcoded union.
     */
    activeTool: ActiveToolState | null;
    /** True when 3D terrain is enabled (set by permalink restore to signal the 3D tool). */
    terrainEnabled?: boolean;
    /**
     * Current map projection, mirrored by BaseAdapter.setProjection and seeded once the
     * map has loaded. `undefined` means "not known yet"; `null` means the active engine
     * has no runtime projection support (same tri-state as IMap.getProjection()).
     */
    mapProjection?: MapProjectionState | null;
    /**
     * The moment computed layers are drawn for, per map.
     *
     * `live` is the default and the behaviour every map had before there was a
     * time slider: computed sources that asked for it (`?refresh=auto`) keep
     * themselves current against the wall clock. `pinned` freezes the map on one
     * instant — the refresh loop stops, `refresh=auto` is ignored, and the only
     * thing that moves the data is a new `at`.
     */
    mapTime: MapTimeState;
    /**
     * How fast the pinned moment is advancing on its own, in map-milliseconds
     * per real second; `null` when it is not moving.
     *
     * Playback lives here rather than inside the time tool for the same reason
     * `mapTime` does: it is a property of the map, so it survives closing the
     * panel, two maps on a page can run at two speeds, and a permalink can ask
     * for a map that is already playing. The tool owns the *loop* — nothing
     * animates on a map with no time tool — but not the answer to whether it
     * should be running.
     *
     * Only meaningful while `mapTime.mode === 'pinned'`: a live map already
     * moves with the wall clock, so playing it means nothing.
     */
    mapTimePlay?: number | null;
}

export type MapTimeState =
    | { mode: 'live' }
    /** `at` is epoch milliseconds — a plain number so the state stays serialisable. */
    | { mode: 'pinned'; at: number };

export interface MapProjectionState {
    name: string;
    center?: [number, number];
    parallels?: [number, number];
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
    /**
     * `source-layer` from the layer spec. Required to query a vector-tile source:
     * `querySourceFeatures` on a vector source returns nothing without it.
     */
    sourceLayer?: string;
    hideFromLegend?: boolean;
    legendRole?: 'background' | 'overlay';
    /** Whether the legend for this layer is expanded in the legend panel. Defaults to true. */
    legendExpanded?: boolean;
    /**
     * Legend expand/collapse mode.
     * - 'auto': system-managed — topmost visible overlay layer is expanded, all others collapsed.
     *   Reacts to layer order changes automatically.
     * - 'expanded': user explicitly expanded this layer's legend.
     * - 'collapsed': user explicitly collapsed this layer's legend.
     * Undefined is treated as 'auto'.
     */
    legendExpandMode?: 'auto' | 'expanded' | 'collapsed';
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
