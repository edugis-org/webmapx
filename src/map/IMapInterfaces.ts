// src/map/IMapInterfaces.ts

import type { AnyLayerConfig, MapStyle, WMSSourceConfig } from '../config/types';
import type { NormalizedCompositeSpec } from './composite-layer-utils';
import type { IQueryService } from './IQueryService';
import type { LngLat, Pixel, MapEventBus } from '../store/map-events';

export interface MarkerOptions {
    /** Pin fill color (CSS color string). Default: engine default or red. */
    color?: string;
    /** Whether the marker can be dragged by the user. Default: false. */
    draggable?: boolean;
    /** Called continuously while the marker is being dragged. */
    onDrag?: (lngLat: [number, number]) => void;
    /** Called once when the drag ends. */
    onDragEnd?: (lngLat: [number, number]) => void;
}
import type { MapStateStore } from '../store/map-state-store';

export interface SourceFeatureQueryOptions {
    sourceLayer?: string;
}

export interface QueryLayerFeaturesOptions {
    /** For vector tile sources: restrict to a specific source layer (MVT layer name). */
    sourceLayer?: string;
}

export interface SourceFeatureSample {
    features: GeoJSON.Feature[];
}

/**
 * Options for creating a map instance.
 */
export interface MapCreateOptions {
    center?: [number, number];
    zoom?: number;
    style?: MapStyle;
    styleUrl?: string;
    tileUrl?: string;
    tileUrls?: string[];
    tileAttribution?: string;
    tileSize?: number;
    interactive?: boolean;
}

/**
 * Paint properties for fill layers.
 */
export interface FillPaint {
    'fill-color'?: string;
    'fill-opacity'?: number;
}

/**
 * Paint properties for line layers.
 */
export interface LinePaint {
    'line-color'?: string;
    'line-width'?: number;
    'line-opacity'?: number;
}

/**
 * Library-agnostic layer specification.
 */
export interface LayerSpec {
    id: string;
    type: 'fill' | 'line' | 'circle' | 'symbol';
    sourceId: string;
    paint?: FillPaint | LinePaint;
}

/**
 * Optional insertion hints for layer ordering.
 */
export interface LayerInsertOptions {
    /** Insert the new layer before this existing layer id. */
    beforeLayerId?: string;
    /** Insert the new layer after this existing layer id. */
    afterLayerId?: string;
}

/**
 * Interface for core map capabilities (e.g., controlling position and state).
 * This is implemented by the concrete MapLibreAdapter, OpenLayersAdapter, etc.
 */
export interface IMapCore {
    /** Gets the current map viewport settings (center, zoom, bearing, pitch). */
    getViewportState(): { center: [number, number], zoom: number, bearing: number, pitch: number };

    /** Sets the map viewport, used by UI components like a 'Location Finder'. */
    setViewport(center: [number, number], zoom: number): void;

    /** Initializes the map in the target HTML element. Supports initial config. */
    initialize(
        containerId: string,
        options?: {
            center?: [number, number];
            zoom?: number;
            minZoom?: number;
            maxZoom?: number;
            minPitch?: number;
            maxPitch?: number;
            /** Restricts panning/zoom-out to [west, south, east, north] (lon/lat). */
            maxBounds?: [number, number, number, number];
            /** URL to a MapLibre/Mapbox style JSON */
            styleUrl?: string;
            /** Inline style object (takes precedence over styleUrl) */
            style?: MapStyle;
        }
    ): void;

    /** Sets the map zoom level in a library-agnostic way. */
    setZoom(level: number): void;

    /** Gets the current zoom level. */
    getZoom(): number;

    addLayer(layer: any, options?: LayerInsertOptions): boolean;
    removeLayer(id: string): void;
    addSource(id: string, config: any): void;
    removeSource(id: string): void;
    getSource(id: string): ISource | undefined;
    suppressBusySignalForSource(sourceId: string): void;
    unsuppressBusySignalForSource(sourceId: string): void;
    /** Returns whether the current engine supports interactive rotation/pitch. */
    getNavigationCapabilities(): NavigationCapabilities;
    /** Gets the current map bearing (degrees clockwise from north). */
    getBearing(): number;
    /** Sets the map bearing (degrees clockwise from north). */
    setBearing(bearing: number): void;
    /** Gets the current map pitch/tilt in degrees (0 = top-down). */
    getPitch(): number;
    /** Sets the map pitch/tilt in degrees (0 = top-down). */
    setPitch(pitch: number): void;
    /** Resets map bearing to north/up. */
    resetNorth(): void;
    /** Resets map bearing to north and pitch to top-down (when supported). */
    resetNorthPitch(): void;

    /** Set map projection. MapLibre takes 'mercator' or 'globe'; OpenLayers takes a view
     *  projection id such as 'EPSG:8857'. (MapLibre 5 dropped the projection names
     *  it briefly carried, so 'equalEarth' and the conics are no longer accepted.)
     *  Returns false if not supported by the active engine. */
    setProjection(projection: string | { name: string; center?: [number, number]; parallels?: [number, number] }): boolean;
    /** Get current projection. Returns null if not supported. */
    getProjection(): { name: string; center?: [number, number]; parallels?: [number, number] } | null;

    /** Enables/disables 3D terrain (elevation exaggeration). Returns false if not supported by the engine. */
    setTerrainEnabled(enabled: boolean, terrainSource?: unknown): boolean;

    /** Returns whether 3D terrain is currently enabled, or null if not supported by the engine. */
    isTerrainEnabled(): boolean | null;
    /** Returns terrain elevation in metres at the given coordinate, or null if terrain is inactive or unavailable. */
    getElevation?(lngLat: LngLat): number | null;

    /** Given a geographic coordinate (LngLat), returns its pixel coordinate [x, y]. */
    project(coords: LngLat): Pixel;
    /** Given a pixel coordinate [x, y] in the map container, returns geographic [lng, lat]. */
    unproject(pixel: Pixel): LngLat | null;
    /** Fit the map view to the given bbox [west, south, east, north]. Implementations should choose the best native method. */
    fitBounds(bbox: [number, number, number, number]): void;

    /** Sets the map canvas cursor style. Pass '' to restore default. */
    setCursor(cursor: string): void;

    /** Enables or disables map panning. Use to prevent map pan during vertex dragging. */
    setPanEnabled(enabled: boolean): void;
    /** Enables or disables touch pointer capture so the browser does not intercept touch as scroll. */
    setTouchCaptureEnabled(enabled: boolean): void;
    /** Enables or disables double-click zoom. */
    setDoubleClickZoomEnabled(enabled: boolean): void;

    /** Shows or hides a map layer. */
    setLayerVisibility(layerId: string, visible: boolean): void;

    /** Returns current GeoJSON data of a source, or null if unavailable / not a GeoJSON source. */
    getSourceData(sourceId: string): GeoJSON.FeatureCollection | string | null;
}

/**
 * A GeoJSON source belonging to a map.
 */
export interface ISource {
    /** The source ID. */
    readonly id: string;

    /** Updates the GeoJSON data of this source. */
    setData(data: GeoJSON.FeatureCollection): void;
}

/**
 * A layer belonging to a map.
 */
export interface ILayer {
    /** The layer ID. */
    readonly id: string;

    /** Gets the source this layer uses. */
    getSource(): ISource;

    /** Removes this layer from the map. */
    remove(): void;
}

/**
 * A sub-map instance created by ISubMapFactory (e.g., inset maps, independent child maps).
 */
export interface ISubMap {
    /** Sets the viewport (center, zoom, bearing, pitch). */
    setViewport(center: [number, number], zoom: number, bearing?: number, pitch?: number): void;

    /** Creates a GeoJSON source on this map. */
    createSource(sourceId: string, data: GeoJSON.FeatureCollection): ISource;

    /** Gets an existing source by ID. */
    getSource(sourceId: string): ISource | null;

    /** Creates a layer on this map. */
    createLayer(spec: LayerSpec): ILayer;

    /** Gets an existing layer by ID. */
    getLayer(layerId: string): ILayer | null;

    /** Registers a callback for when the map is ready (style loaded). */
    onReady(callback: () => void): void;

    /** Destroys the map and cleans up resources. */
    destroy(): void;
}

/**
 * Factory for creating sub-map instances (inset maps, independent child maps).
 */
export interface ISubMapFactory {
    /** Creates a new sub-map instance. */
    createMap(container: HTMLElement, options?: MapCreateOptions): ISubMap;
}

/**
 * The unified map interface for the main map and all map instances.
 * Combines core map operations, layer management, state, and events.
 * Implemented by concrete adapters (MapLibre, OpenLayers, Leaflet, Cesium).
 */
export interface IMap {
    /** Stable engine identifier, unaffected by minification (e.g. 'maplibre', 'openlayers', 'leaflet', 'cesium'). */
    readonly engineId: string;
    readonly engineVersion: string;

    // ===== State and Events =====
    /** Access to the map's reactive state store. */
    readonly store: MapStateStore;

    /** Event bus for normalized library-agnostic map events. */
    readonly events: MapEventBus;

    /** Tool-specific service surface for engine-backed tool commands. */
    readonly toolService: IToolService;

    /** Engine-backed feature query service used by the Info tool. */
    readonly queryService: IQueryService;

    /** Removes a logical (config-backed) layer by id. */
    removeLogicalLayer(layerId: string): void;

    /** Repositions a logical layer immediately below `beforeLayerId` (or to the top if null/undefined). */
    moveLayer(layerId: string, beforeLayerId?: string | null): void;

    /**
     * Updates paint properties of a logical layer. For composite (`type: 'style'`)
     * layers, `subLayerId` addresses one sub-layer; for standard layers, pass
     * `layerId` as `subLayerId` too. Returns true if a matching native layer was updated.
     */
    updateLayerStyle(layerId: string, subLayerId: string, partialPaint: Record<string, unknown>): boolean;
    /** Returns the original layer config for every currently active layer, keyed by logical layer id. */
    getLayerConfigs(): Map<string, unknown>;

    /**
     * Adds a sublayer to a layer (or removes it again with `null`), rebuilding
     * the layer as a composite so it keeps one legend row, one delete button
     * and one style panel. Used for the style panel's labels.
     */
    setExtraSubLayer(layerId: string, sublayer: Record<string, unknown> | null): Promise<boolean>;

    // ===== Viewport / Camera =====
    /** Gets the current viewport state (center, zoom, bearing, pitch). */
    getViewportState(): { center: [number, number], zoom: number, bearing: number, pitch: number };

    /** Sets the map viewport (center and zoom). */
    setViewport(center: [number, number], zoom: number): void;

    /** Gets the current zoom level. */
    getZoom(): number;

    /** Sets the zoom level. */
    setZoom(level: number): void;

    /** Gets the current bearing (degrees clockwise from north). */
    getBearing(): number;

    /** Sets the bearing (degrees clockwise from north). */
    setBearing(bearing: number): void;

    /** Gets the current pitch/tilt (degrees, 0 = top-down). */
    getPitch(): number;

    /** Sets the pitch/tilt (degrees, 0 = top-down). */
    setPitch(pitch: number): void;

    /** Resets bearing to north. */
    resetNorth(): void;

    /** Resets bearing to north and pitch to top-down (if supported). */
    resetNorthPitch(): void;

    /** Fits the view to a bounding box [west, south, east, north]. */
    fitBounds(bbox: [number, number, number, number]): void;

    /** Set map projection by name or config object. Returns false if unsupported by the engine. */
    setProjection(projection: string | { name: string; center?: [number, number]; parallels?: [number, number] }): boolean;
    /** Get current projection, or null if the engine does not support projections. */
    getProjection(): { name: string; center?: [number, number]; parallels?: [number, number] } | null;

    /** Enables/disables 3D terrain (elevation exaggeration). Returns false if not supported by the engine. */
    setTerrainEnabled(enabled: boolean, terrainSource?: unknown): boolean;

    /**
     * Paints a CSS colour behind everything the map draws — the sea under a map
     * with no basemap, and the space around a globe. `null` restores the
     * engine's default. Returns false if the engine cannot paint one.
     */
    setBackgroundColor(color: string | null): boolean;

    /** The background colour last asked for, or null if none was. */
    getBackgroundColor(): string | null;
    /** Returns whether 3D terrain is currently enabled, or null if not supported by the engine. */
    isTerrainEnabled(): boolean | null;
    /** Returns elevation in metres at the given coordinate if a terrain/DEM layer is active, otherwise null. */
    getElevation?(lngLat: LngLat): number | null;

    /** Sets the map canvas cursor style. Pass '' to restore default. */
    setCursor(cursor: string): void;

    /** Enables or disables map panning. Use to prevent map pan during vertex dragging. */
    setPanEnabled(enabled: boolean): void;
    /** Enables or disables touch pointer capture so the browser does not intercept touch as scroll. */
    setTouchCaptureEnabled(enabled: boolean): void;
    /** Enables or disables double-click zoom. */
    setDoubleClickZoomEnabled(enabled: boolean): void;

    /** Shows or hides a map layer. */
    /** Returns true if a layer with the given id is registered in the store. */
    hasLayer(layerId: string): boolean;

    setLayerVisibility(layerId: string, visible: boolean): void;

    /** Sets the opacity (0..1) for a logical/map layer (and all of its native sub-layers). */
    setLayerOpacity(layerId: string, opacity: number): void;

    /** Returns current GeoJSON data of a source, or null if unavailable / not a GeoJSON source. */
    getSourceData(sourceId: string): GeoJSON.FeatureCollection | string | null;

    /** Returns the `attribution` configured on a source via addSource, if any. */
    getSourceAttribution(sourceId: string): string | undefined;

    /** Returns the serialized source config (type, tiles, url, etc.) for any source, or null if unavailable. */
    getSourceConfig(sourceId: string): Record<string, unknown> | null;

    /**
     * Points an existing tile source at different urls, keeping the layers that
     * draw it. This is what a WMS `styles=` change is: the same layer asking the
     * same service for a differently drawn picture.
     *
     * Returns false when the engine cannot do it, which the UI must respect
     * rather than reporting a change it did not make.
     */
    setSourceTiles(sourceId: string, tiles: string[]): boolean;

    /**
     * The request urls a live tile source is actually using, which is not always
     * what the config declared: a WMS given as a bare endpoint plus parameters
     * has its GetMap url assembled by the engine, and that assembled url is the
     * only place its `STYLES` can be changed. Null when the engine cannot say.
     */
    getSourceTiles(sourceId: string): string[] | null;

    /**
     * Returns features currently loaded for a source, when the engine can expose
     * them. For vector tile sources this is a viewport/tile sample, not a full
     * dataset count.
     */
    querySourceFeatures?(sourceId: string, options?: SourceFeatureQueryOptions): SourceFeatureSample | null;

    queryLayerFeatures(layerId: string, options?: QueryLayerFeaturesOptions): Promise<GeoJSON.FeatureCollection>;

    /** Returns distinct MVT source-layer names used by the native sub-layers of a logical layer.
     *  Empty array for GeoJSON/raster layers. */
    getLayerSourceLayers(layerId: string): string[];

    // ===== Coordinate Conversion =====
    /** Projects geographic [lng, lat] to screen pixel [x, y]. */
    project(coords: LngLat): Pixel;

    /** Unprojects screen pixel [x, y] to geographic [lng, lat]. */
    unproject(pixel: Pixel): LngLat | null;

    // ===== Navigation Capabilities =====
    /** Returns which camera controls this engine supports. */
    getNavigationCapabilities(): NavigationCapabilities;

    // ===== Native Layer/Source Management =====
    /** Adds a layer to the map. Handles both pre-registered sources and catalog-resolved sources. */
    addLayer(layer: any, options?: LayerInsertOptions): Promise<boolean>;

    /** Adds a native source to the map. */
    addSource(id: string, config: any): void;

    /** Removes a layer or source by ID. */
    removeLayer(id: string): void;

    /** Removes a native source by ID. */
    removeSource(id: string): void;

    /** Gets a native source by ID. */
    getSource(id: string): ISource | undefined;

    /** Suppresses the busy/loading indicator for a source. */
    suppressBusySignalForSource(sourceId: string): void;

    /** Re-enables the busy/loading indicator for a source. */
    unsuppressBusySignalForSource(sourceId: string): void;

    // ===== Markers =====
    /** Adds a pin marker at the given location. Replaces any existing marker with the same id. */
    addMarker(id: string, lngLat: LngLat, options?: MarkerOptions): void;
    /** Moves an existing marker to a new location. No-op if marker does not exist. */
    moveMarker(id: string, lngLat: LngLat): void;
    /** Removes a marker by id. No-op if marker does not exist. */
    removeMarker(id: string): void;

    // ===== Initialization & Cleanup =====
    /**
     * Initializes the map in the target HTML element.
     * Must be called before using the map.
     */
    initialize(
        containerId: string,
        options?: {
            center?: [number, number];
            zoom?: number;
            minZoom?: number;
            maxZoom?: number;
            minPitch?: number;
            maxPitch?: number;
            /** Restricts panning/zoom-out to [west, south, east, north] (lon/lat). */
            maxBounds?: [number, number, number, number];
            styleUrl?: string;
            style?: MapStyle;
        }
    ): void;

    // ===== Sub-map Factory =====
    /** Factory for creating independent sub-map instances (e.g., inset maps). */
    readonly mapFactory: ISubMapFactory;
}

export interface NavigationCapabilities {
    /** True if map supports bearing/rotation. */
    bearing: boolean;
    /** True if map supports pitch/tilt adjustments. */
    pitch: boolean;
}

/**
 * Interface for handling the display and styling of layers.
 * Referenced by a 'GIS Legend' or 'Style Editor' module.
 */
export interface ILayerStyleEditor {
    /** Sets the opacity for a given layer ID. */
    setLayerOpacity(layerId: string, opacity: number): void;
    
    /** Hides or shows a specific layer. */
    setLayerVisibility(layerId: string, visible: boolean): void;
}

/**
 * Template interface for tool services.
 * Copy and adapt this interface when creating new tool services.
 * NOTE: This is where you would define the new capability for a feature.
 */
export interface IToolService {
    /** Toggles the activation state of the tool. */
    toggleTool(): void;

    /** Sets the radius for a geo-buffer operation.
     * This method must be handled by an Adapter Service to ensure robustness
     * (e.g., using throttle() if it's an expensive API call).
     */
    setBufferRadius(radiusKm: number): void;
}

/**
 * Engine-neutral executor surface for config-backed logical layers.
 * Used by runtime callers such as webmapx-map regardless of the active engine.
 */
export interface ILogicalLayerExecutor {
    /** Adds a logical layer. Source resolution happens inside the service using the catalog. */
    addLayer(layerConfig: AnyLayerConfig, options?: LayerInsertOptions): Promise<boolean>;

    /** Removes a logical layer by id. */
    removeLayer(layerId: string): void;

    /** Repositions a logical layer immediately below `beforeLayerId` (or to the top if null/undefined). */
    moveLayer(layerId: string, beforeLayerId?: string | null): void;

    /** Returns the currently visible logical layer ids. */
    getVisibleLayers(): string[];

    /** Returns whether a logical layer is currently visible. */
    isLayerVisible(layerId: string): boolean;

    /** Shows or hides a logical layer (and all of its native sub-layers). */
    setLayerVisibility(layerId: string, visible: boolean): void;

    /** Sets the opacity (0..1) for a logical layer (and all of its native sub-layers). */
    setLayerOpacity(layerId: string, opacity: number): void;

    /** Returns current GeoJSON data for a catalog/logical source, or null if unavailable. */
    getSourceData(sourceId: string): GeoJSON.FeatureCollection | string | null;

    /** Returns currently loaded source features when supported by the engine. */
    querySourceFeatures?(sourceId: string, options?: SourceFeatureQueryOptions): SourceFeatureSample | null;

    /** Returns all features for a logical layer (GeoJSON sources) or rendered viewport features (vector tile sources). */
    queryLayerFeatures(layerId: string, options?: QueryLayerFeaturesOptions): Promise<GeoJSON.FeatureCollection>;

    /** Returns distinct MVT source-layer names used by this logical layer. Empty array for GeoJSON/raster. */
    getLayerSourceLayers(layerId: string): string[];

    /** Updates a catalog/logical GeoJSON source. Returns true when the source exists and was updated. */
    setSourceData(sourceId: string, data: GeoJSON.FeatureCollection): boolean;

    /**
     * Updates paint properties of a single sub-layer of a composite (`type: 'style'`)
     * logical layer, addressed as `${styleId}:${subLayerId}`. Returns true if the
     * sub-layer was found and updated.
     */
    updateLayerStyle(layerId: string, subLayerId: string, partialPaint: Record<string, unknown>): boolean;
}

/**
 * Engine-specific backend service for logical-layer execution.
 * Converts config-based layer definitions to native map layers.
 * Updates the store with visible layer state.
 */
export interface ILayerService {
    /**
     * Adds a layer to the map. Sources are resolved from the layer config.
     * @returns true if layer was added successfully, false on failure
     */
    addLayer(layerConfig: AnyLayerConfig, options?: LayerInsertOptions): Promise<boolean>;

    /**
     * Removes a layer from the map by its ID.
     */
    removeLayer(layerId: string): void;

    /**
     * Repositions a layer immediately below `beforeLayerId` (or to the top if null/undefined).
     */
    moveLayer(layerId: string, beforeLayerId?: string | null): void;

    /**
     * Returns the list of currently visible layer IDs.
     */
    getVisibleLayers(): string[];

    /**
     * Checks if a layer is currently visible.
     */
    isLayerVisible(layerId: string): boolean;

    /** Shows or hides a logical layer (and all of its native sub-layers). */
    setLayerVisibility(layerId: string, visible: boolean): void;

    /** Sets the opacity (0..1) for a logical layer (and all of its native sub-layers). */
    setLayerOpacity(layerId: string, opacity: number): void;

    /** Returns current GeoJSON data for a catalog/logical source, or null if unavailable. */
    getSourceData(sourceId: string): GeoJSON.FeatureCollection | string | null;

    /** Returns currently loaded source features when supported by the engine. */
    querySourceFeatures?(sourceId: string, options?: SourceFeatureQueryOptions): SourceFeatureSample | null;

    /** Returns all features for a logical layer (GeoJSON sources) or rendered viewport features (vector tile sources). */
    queryLayerFeatures(layerId: string, options?: QueryLayerFeaturesOptions): Promise<GeoJSON.FeatureCollection>;

    /** Returns distinct MVT source-layer names used by this logical layer. Empty array for GeoJSON/raster. */
    getLayerSourceLayers(layerId: string): string[];

    /** Updates a catalog/logical GeoJSON source. Returns true when the source exists and was updated. */
    setSourceData(sourceId: string, data: GeoJSON.FeatureCollection): boolean;

    /**
     * Returns visible logical layers that are backed by a WMS source.
     * Used by the query service to issue GetFeatureInfo requests.
     */
    getVisibleWMSLayers(): Array<{ layerId: string; layerTitle?: string; sourceConfig: WMSSourceConfig }>;

    /**
     * Renders a fully-normalized composite (`type: 'style'`) layer. The generic side
     * has already derived stable sub-layer ids and globally-addressable local sources
     * (see `composite-layer-utils.normalizeCompositeLayer`) — the engine turns the
     * spec into native objects only and tracks them internally under `spec.styleId`
     * for later `removeLayer`/`updateLayerStyle` calls.
     * @returns true if at least one native object was created.
     */
    addCompositeLayer?(spec: NormalizedCompositeSpec, options?: LayerInsertOptions): Promise<boolean>;

    /**
     * Updates paint properties of a single sub-layer of a composite layer previously
     * added via `addCompositeLayer`, addressed by `styleId` + `subLayerId`. Returns
     * true if the sub-layer was found and updated.
     */
    updateLayerStyle(styleId: string, subLayerId: string, partialPaint: Record<string, unknown>): boolean;
}
