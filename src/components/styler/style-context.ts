/**
 * What a style panel is handed: the layer, its sources, and the ways it is
 * allowed to change the map.
 *
 * Lifted out of `webmapx-layer-style-dialog.ts` so the panel and its
 * replacement (`webmapx-layer-styler.ts`) are two readings of **one** context
 * rather than two definitions that can drift while both are live. The callers
 * (`webmapx-layer-overview`, `webmapx-layer-legend3d`) build it once and would
 * otherwise have to know which panel they were filling in for.
 */
import type { SourceAttributeInfo } from '../../utils/attribute-info';
export type { SourceAttributeInfo };

export interface LayerStyleTarget {
    id: string;
    type: string;
    /** The sublayer's authored paint, so "reset" has something to go back to. */
    paint?: Record<string, unknown>;
    /**
     * The sublayer's layout properties. Not decoration: `text-field` and
     * `text-size` are layout rather than paint, so a label entry that saw only
     * the paint would open showing neither the column it labels by nor its size.
     */
    layout?: Record<string, unknown>;
}

export interface SourceStyleGroup {
    sourceId: string;
    featureCountLabel: string;
    featureCount: number | null;
    geometryTypes: string[];
    attributes: SourceAttributeInfo[];
    featureRows: Record<string, unknown>[];
    layers: LayerStyleTarget[];
    /** The features themselves — what a classification is computed from. */
    features?: GeoJSON.Feature[] | null;
    /**
     * False when the features are only what the map has drawn (a tiled source),
     * which changes the answer as the user pans. Same convention as the Analysis
     * tool's viewport warning.
     */
    completeData?: boolean;
    /** The vector-tile sublayer these targets read, when the source is tiled. */
    sourceLayer?: string;
    /**
     * The source's own config as the map holds it. A labels layer over a tiled
     * source re-declares this rather than copying features, so the labels are
     * drawn from the tiles themselves and stay put while the user pans.
     */
    sourceConfig?: Record<string, unknown> | null;
}

/**
 * Applies a paint change to one sublayer of the layer being styled, and says
 * whether the engine took it. `false` means the sublayer is described in the
 * store but is not on the map — a style that silently does nothing is the worst
 * outcome, since the user blames their own choices.
 */
export type StyleApply = (subLayerId: string, paint: Record<string, unknown>) => boolean | void;

/**
 * Adding and removing a layer of its own — what labels need.
 *
 * Labels are a second sublayer over the same features, and the shortest honest
 * way to get one on every engine is a small layer alongside the styled one: it
 * appears in the legend, can be switched off, and is removed with the same
 * button. Attaching a sublayer to an existing logical layer instead would need
 * engine-specific plumbing in all four adapters.
 */
export interface LayerHost {
    add: (config: Record<string, unknown>) => Promise<boolean> | boolean;
    remove: (layerId: string) => void;
    /**
     * Attaches a sublayer to a layer, or removes it again with `null`. This is
     * how labels reach the map: as part of the layer they belong to.
     */
    setExtraSubLayer?: (layerId: string, sublayer: Record<string, unknown> | null) => Promise<boolean>;
    /**
     * Replaces the layer's whole sublayer list — what a style list writes
     * through. `setExtraSubLayer` holds exactly one extra sublayer, which is
     * all labels ever needed; adding, deleting and reordering styles need the
     * list itself. Absent on a host that cannot rebuild a layer, in which case
     * the styler edits the styles the layer already has and adds none.
     */
    setSubLayers?: (layerId: string, sublayers: Array<Record<string, unknown>>) => Promise<boolean>;
    /**
     * The layer's whole sublayer list as the map holds it.
     *
     * The styler reads this rather than the style targets, and the difference
     * matters the moment it writes: the targets are only the sublayers a panel
     * can edit, so rebuilding the layer from them would silently drop every
     * other one — a raster sublayer inside a composite, a type this build does
     * not style. Absent: the styler falls back to the targets and does not
     * offer to add or remove entries.
     */
    getSubLayers?: (layerId: string) => Array<Record<string, unknown>> | null;
    /**
     * Whether the layer's style list can be written at all. False for a layer
     * drawn from a remote style document: its sublayers are the style server's,
     * and rebuilding the layer from them would leave an empty basemap. Their
     * paint is still editable — it is the list that is not ours.
     */
    canRebuild?: (layerId: string) => boolean;
}

export interface StyleDialogContext {
    title: string;
    /**
     * Which engine is drawing, as `adapter.engineId`.
     *
     * Only for capabilities that differ and fail *silently*: OpenLayers ignores
     * `fill-outline-color` outright (it is absent from `ol-mapbox-style`'s
     * `stylefunction`), so a panel that offered it there would tick a box and
     * change nothing. Hide what an engine cannot do rather than offer it and
     * fail.
     */
    engine?: string;
    /** Names the labels layer, and is the caller's own bookkeeping otherwise. */
    layerId: string;
    groups: SourceStyleGroup[];
    apply?: StyleApply;
    /** Lets the panel put a labels layer on the map. Omitted: no labels step. */
    layers?: LayerHost;
    /**
     * Samples the source again. A tiled layer has nothing to offer until its
     * tiles have arrived, and the panel is usually opened before that: without
     * this it shows "no features are loaded" for good and the user has to close
     * it and try again.
     */
    resample?: () => Promise<SourceStyleGroup[]>;
    /**
     * What the layer is made of, when it is not something with features.
     *
     * A raster layer has no paint to build an expression from — it arrives as
     * finished pictures — so the panel asks a different question of it, and
     * needs the source itself to know which question that is.
     */
    raster?: RasterStyleTarget;
    /** Lets the panel repoint a raster source and set the layer's opacity. */
    sourceControl?: SourceControl;
    /** The styled layer's extent, inherited by a labels layer made from it. */
    bounds?: number[];
    /**
     * Rewrites a source's features, for a colouring the data has to carry.
     *
     * Only a source the app holds whole — a `geojson` one — can be rewritten;
     * a tiled source's properties live on a server. Absent, or returning false,
     * means the panel falls back to keying on a column the data already has.
     */
    writeFeatures?: (sourceId: string, features: GeoJSON.Feature[]) => boolean;
}

export interface RasterStyleTarget {
    sourceId: string;
    sourceConfig: Record<string, unknown> | null;
}

export interface SourceControl {
    /** Returns false when the engine cannot repoint a live source. */
    setTiles: (sourceId: string, tiles: string[]) => boolean;
    /**
     * Changes request parameters instead of urls — what a WMS style change
     * really is, and the only form both engines hold natively. A url is not a
     * shape every engine keeps: MapLibre stores a request template, OpenLayers
     * stores a base url plus `params` and builds the rest as it fetches, so
     * asking it for "the url" fabricates one and writing one back takes it
     * apart again. `null` removes a parameter.
     */
    setParams?: (sourceId: string, params: Record<string, string | null>) => boolean;
    /** The urls the engine is currently requesting, when it can say. */
    getTiles?: (sourceId: string) => string[] | null;
    setLayerOpacity: (opacity: number) => void;
    /**
     * Where the map is looking, for a panel that has to sample the service.
     *
     * Asking a WMS whether it honours a style of our own means drawing an
     * image and looking at it, and that image has to cover somewhere the layer
     * actually draws. What the user is looking at is the only place known to
     * qualify — they opened the panel on a layer they can see — so the size in
     * pixels comes too: sampling the *visible extent* is what makes "where the
     * map is looking" literally true, where a tile-sized window at the centre
     * could land on water while buildings fill the rest of the screen.
     */
    getView?: () => { center: [number, number]; zoom: number; size?: [number, number] } | null;
}
