import { html, css, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import type { IMap } from '../map/IMapInterfaces';
import type { LngLat, ClickEvent, PointerMoveEvent, ContextMenuEvent, PointerDownEvent, PointerUpEvent } from '../store/map-events';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import type SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import type SlInput from '@shoelace-style/shoelace/dist/components/input/input.js';
import type { DrawLayerConfig, GeometryType, PropertyDef } from './webmapx-draw-layer-dialog';
import { PROPERTY_TYPES, TYPE_LABELS, AUTO_PROPERTY_TYPES, AUTO_PROPERTY_DEFAULTS, newLayerConfig } from './webmapx-draw-layer-dialog';
import { unregisterMapLayer } from '../map/map-layer-registry';
import { findSnap } from '../utils/snap-utils';
import { haversineDistanceCm, formatDistance, circlePolygonRing } from '../utils/geo-calculations';
import { DATA_TOOL, DATA_TOOL_HALO } from '../theme/data-colors';
import dashLineIconUrl from '../icons/dash-line.svg?url';
import rectSelectIconUrl from '../icons/rect-select.svg?url';
import editVerticesIconUrl from '../icons/edit-vertices.svg?url';
import editVerticesPolygonIconUrl from '../icons/edit-vertices-polygon.svg?url';
import featureValuesIconUrl from '../icons/feature-values.svg?url';
import lassoSelectIconUrl from '../icons/lasso-select.svg?url';
import { drawTypeIcon } from './internal/draw-type-icons';

// ─── Shared source / layer IDs ────────────────────────────────────────────────

const RUBBER_SOURCE_ID = 'webmapx-draw-rubber-source';
const RUBBER_LINE_ID   = 'webmapx-draw-rubber-line';
const VERTEX_SOURCE_ID = 'webmapx-draw-vertex-source';
const VERTEX_LAYER_ID  = 'webmapx-draw-vertex-layer';

/** The auto-assigned name a freshly created layer starts with ("New layer", "New layer (2)"…) — see `isDefaultLayerName`. */
const DEFAULT_LAYER_NAME = 'New layer';

/**
 * The source a draw layer's geometry lives in.
 *
 * A draw layer is one composite (`type: 'style'`) layer carrying its own
 * source, so the id follows the `${layerId}:${key}` convention
 * `composite-layer-utils` gives every composite source — which is what keeps it
 * addressable for the updates this tool makes on every edit.
 */
const DRAW_SOURCE_KEY = 'geom';

/**
 * The source a draw layer's geometry lives in.
 *
 * A polygon layer is a composite, because it needs two paint aspects, and a
 * composite carries its own source under the `${layerId}:${key}` id
 * `composite-layer-utils` gives it. A point or line layer needs one sublayer
 * and stays a plain layer over a standalone source — a composite for a single
 * paint aspect buys nothing and costs the engines' composite paths.
 */
function drawSourceId(layerId: string, type: GeometryType): string {
    return type === 'Point' ? `webmapx-draw-src-${layerId}` : `${layerId}:${DRAW_SOURCE_KEY}`;
}
function drawMapLayerId(layerId: string) { return `${layerId}-map`; }

/**
 * One draw layer, as one composite layer.
 *
 * A filled polygon needs two paint aspects — a fill and an outline — and they
 * used to be dispatched as two independent layers off one source. That made
 * them two rows in the store, and everything that addresses "the layer"
 * reached only half of it: hiding a polygon layer hid its fill and left the
 * outline drawn, opacity changed one of them, and reordering could slide
 * another layer between a polygon and its own outline.
 *
 * A composite is how the rest of the app expresses this — a config's
 * `world-countries` is a `type: 'style'` layer holding its fill and its line,
 * and so is every layer the isochrone and routing tools persist. One entry in
 * the store, one legend row, one visibility, one opacity, one delete.
 */
function drawLayerSpec(
    id: string,
    cfg: DrawLayerConfig,
    color: string,
    metadata: Record<string, unknown>,
): Record<string, unknown> {
    if (cfg.type === 'Polygon') {
        return {
            id, type: 'style', version: 8, title: cfg.name, metadata,
            sources: {
                [DRAW_SOURCE_KEY]: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
            },
            // Each sublayer names itself. Without a label the legend falls back
            // to the sublayer id, and a generated id read as
            // "layer 1788374721345 xyzs map fill" — the machinery, where the
            // reader wanted the word "fill".
            layers: [
                {
                    id: `${id}-fill`, type: 'fill', source: DRAW_SOURCE_KEY,
                    metadata: { label: 'Fill' },
                    paint: { 'fill-color': color, 'fill-opacity': 0.35 },
                },
                {
                    id: `${id}-line`, type: 'line', source: DRAW_SOURCE_KEY,
                    metadata: { label: 'Line' },
                    paint: { 'line-color': color, 'line-width': 2 },
                },
            ],
        };
    }

    if (cfg.type === 'LineString') {
        // `line-dasharray` cannot be a data-driven (per-feature) expression in
        // MapLibre — dash patterns are baked per paint layer, not read per
        // vertex — so a layer mixing dashed and solid segments needs two
        // sublayers filtered on a feature flag, the same composite shape a
        // Polygon's fill+line already use: one entry in the store, one
        // legend row, one delete, but paint that can still differ by feature.
        return {
            id, type: 'style', version: 8, title: cfg.name, metadata,
            sources: {
                [DRAW_SOURCE_KEY]: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
            },
            layers: [
                {
                    id: `${id}-solid`, type: 'line', source: DRAW_SOURCE_KEY,
                    metadata: { label: 'Line' },
                    filter: ['!=', ['get', '__dashed'], true],
                    paint: { 'line-color': color, 'line-width': 2 },
                },
                {
                    id: `${id}-dashed`, type: 'line', source: DRAW_SOURCE_KEY,
                    metadata: { label: 'Dashed line' },
                    filter: ['==', ['get', '__dashed'], true],
                    paint: { 'line-color': color, 'line-width': 2, 'line-dasharray': [2, 2] },
                },
            ],
        };
    }

    const source = drawSourceId(id, cfg.type);
    return {
        id, type: 'circle', source, title: cfg.name, metadata,
        paint: { 'circle-radius': 6, 'circle-color': color, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
    };
}

const MAP_LAYER_COLOR = '#888888';
const SELECTED_VERTEX_COLOR = '#ff3b30';
const SELECTED_VERTEX_RADIUS = 10;

const DRAFT_SOURCE_ID = 'webmapx-draw-draft-source';
const DRAFT_POINT_ID  = 'webmapx-draw-draft-points';

/**
 * Small solid dots, in the feature's own colour, at each vertex of a
 * freshly-drawn line/polygon while still in a draw mode — where there's no
 * vertex/ring highlight any more to say "this one" (see `updateEditHandles`).
 * Deliberately not the hollow, white-cored style `EDIT_VERT_LAYER` uses for
 * an actually-editable vertex in Select mode: these must not look draggable.
 * A point feature is its own single node already, so this never applies to
 * one.
 */
const ACTIVE_NODES_SOURCE_ID = 'webmapx-draw-active-nodes-source';
const ACTIVE_NODES_LAYER_ID  = 'webmapx-draw-active-nodes';

const EDIT_VERT_SOURCE = 'webmapx-draw-edit-vert-source';
const EDIT_VERT_LAYER  = 'webmapx-draw-edit-vert';
const EDIT_MID_SOURCE  = 'webmapx-draw-edit-mid-source';
const EDIT_MID_LAYER   = 'webmapx-draw-edit-mid';
const SEL_VERT_SOURCE  = 'webmapx-draw-sel-vert-source';
const SEL_VERT_LAYER   = 'webmapx-draw-sel-vert';

const HANDLE_THRESHOLD = 12; // px — snap distance for vertex/midpoint handles

const SNAP_SOURCE_ID = 'webmapx-draw-snap-source';
const SNAP_LAYER_ID  = 'webmapx-draw-snap-layer';
const SNAP_THRESHOLD = 16; // px

const MIN_DRAG_SIZE_M = 1; // ignore circle/rectangle drags that end up smaller than this (accidental clicks)

/** The rectangle/lasso marquee drawn while dragging out a select-by-shape gesture. */
const MARQUEE_SOURCE_ID = 'webmapx-draw-marquee-source';
const MARQUEE_FILL_ID   = 'webmapx-draw-marquee-fill';
const MARQUEE_LINE_ID   = 'webmapx-draw-marquee-line';

/** Select mode's point-feature visual: every selected point/multipoint, for
 *  possible deletion (`selectedFeatureIds`) — one or many, click or
 *  rectangle/lasso, all the same. A line/polygon selection uses the small
 *  solid `ACTIVE_NODES_*` nodes instead (see `updateSelectedSource`), since a
 *  point is its own only "node" already and has nothing to put a node on. */
const MULTI_SEL_SOURCE_ID = 'webmapx-draw-multisel-source';
const MULTI_SEL_POINT_ID  = 'webmapx-draw-multisel-point';

// ─── Types ────────────────────────────────────────────────────────────────────

type EditState = 'none' | 'selected' | 'editing';

interface VertexHandle {
    kind: 'vertex';
    featureId: string;
    partIdx: number;
    ringIdx: number;
    vertIdx: number;
    coords: LngLat;
}

interface MidpointHandle {
    kind: 'midpoint';
    featureId: string;
    partIdx: number;
    ringIdx: number;
    afterVertIdx: number;
    coords: LngLat;
}

type EditHandle = VertexHandle | MidpointHandle;

export type DrawMode = 'select' | 'select-rect' | 'select-lasso' | 'attributes' | 'edit-move' | 'edit-vertices' | 'draw-point' | 'draw-line' | 'draw-line-dashed' | 'draw-polygon' | 'draw-circle' | 'draw-rectangle';
export type { DrawLayerConfig, GeometryType } from './webmapx-draw-layer-dialog';
type DrawGeometryType = 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon';

export interface DrawFeature {
    id: string;
    layerId: string;
    type: DrawGeometryType;
    coordinates: any;
    properties: Record<string, unknown>;
    /** LineString only — which of the layer's two filtered sublayers (solid/
     *  dashed) paints this feature. See `drawLayerSpec`'s LineString branch:
     *  `line-dasharray` can't be a per-feature expression in MapLibre, so a
     *  mix of dashed and solid lines in one layer is two sublayers filtered
     *  on this flag rather than one data-driven paint property. */
    dashed?: boolean;
}

/** One "Edit attributes" delete/undo/redo step — see `removedAttributeStack`. */
interface RemovedAttributeEntry {
    index: number;
    property: PropertyDef;
    /** Only features that actually had this key set — so Undo distinguishes
     *  "had no value" from "had an empty string" and doesn't invent values
     *  on features that never carried this attribute in the first place. */
    values: { featureId: string; value: unknown }[];
}

interface HistoryEntry {
    type: 'add' | 'update' | 'delete' | 'finish';
    /** For 'update': the pre-change snapshot, restored on undo. */
    features: DrawFeature[];
    /** For 'update': the post-change snapshot (same ids/order as `features`),
     *  restored on redo. Without its own snapshot, redo re-applied the same
     *  pre-change coordinates undo just restored — redoing a move undid it
     *  again instead of moving forward. */
    afterFeatures?: DrawFeature[];
    /** For 'finish': draft points to restore on undo, re-opening the in-progress line/polygon. */
    draftPoints?: LngLat[];
}

// ─── Component ───────────────────────────────────────────────────────────────

@customElement('webmapx-draw-tool')
export class WebmapxDrawTool extends WebmapxModalTool {
    readonly toolId = 'draw';

    // ── Draw state ────────────────────────────────────────────────────────────

    @state() private mode: DrawMode = 'select';
    @state() private drawLayers: DrawLayerConfig[] = [];
    @state() private features: DrawFeature[] = [];
    @state() private selectedFeatureId: string | null = null;
    /** Ids from a rectangle/lasso select that caught more than one feature — mutually
     *  exclusive with `selectedFeatureId` (vertex editing and the attributes panel only
     *  make sense for a single feature; a multi-select's only action is "delete"). */
    @state() private selectedFeatureIds: string[] = [];
    /**
     * Edit "Edit vertices" and Attributes only: whatever's under the cursor
     * that ISN'T the pinned feature (`selectedFeatureId`) — drives the light
     * "you could pin this instead" solid-dot preview. `selectedFeatureId`
     * itself is click-pinned in these modes (see `handlePointerDown`/
     * `handleClick`) rather than hover-driven, so it survives the pointer
     * moving away — otherwise there was no way to reach the panel's
     * delete-vertex button, or an attribute input, with a mouse. Unused
     * outside those two modes.
     */
    @state() private hoveredFeatureId: string | null = null;
    /**
     * Name of the attribute field last focused (by the user, or by auto-focus
     * itself) in the "Attribute values" section. Once every field on a feature
     * already has a value, there's no empty field to point the focus ring at —
     * so `focusFirstAttributeValueInput` falls back to whichever attribute was
     * last being edited, so stepping through already-filled-in features to
     * touch up one particular field (e.g. "height") keeps landing on that
     * field instead of always snapping back to the first one.
     */
    private lastFocusedAttributeName: string | null = null;
    @state() private helpText = '';
    @state() private pendingMode: DrawMode | null = null;
    /** Bumped on history/draft-stack changes to trigger re-render of undo/redo buttons. */
    @state() private uiVersion = 0;

    /**
     * Which panel screen is showing: pick a layer kind, pick/add a layer of
     * that kind, or the scoped editing session for one layer. Not reset on
     * deactivate, so reopening the tool returns to wherever the user left it.
     */
    @state() private panelView: 'type' | 'layers' | 'editing' = 'type';
    @state() private pickedType: GeometryType | null = null;

    /** "What do you want to draw or edit?" — shown on both the type picker and the layer
     *  list until the first editing session is completed via "Done", then dropped. */
    @state() private showDrawIntro = true;

    /**
     * Map layers of `pickedType` that aren't draw layers yet — fetched async
     * (source data may need a fetch) whenever the layer picker is shown, so
     * catalog layers appear there immediately rather than only inside the
     * "Add new" dialog's own map-layer list.
     */
    @state() private catalogLayerOptions: import('./webmapx-draw-layer-dialog').MapLayerOption[] = [];

    /** Catalog-layer counts per type, for the type picker's "N layers" — computed
     *  alongside `catalogLayerOptions` so a card's count matches what its own
     *  layer picker actually lists (drawLayers + not-yet-borrowed catalog layers). */
    @state() private catalogLayerCounts: Partial<Record<GeometryType, number>> = {};

    /** Set the moment "Edit" is pressed on a "From the catalog" option — holds it
     *  until the confirmation dialog resolves (see `startEditingCatalogLayer`),
     *  so nothing about the layer changes just from a click. */
    @state() private pendingCatalogEditOption: import('./webmapx-draw-layer-dialog').MapLayerOption | null = null;

    /**
     * Layers explicitly paused via "Stop editing" — kept in `drawLayers` (so
     * they still list under their type) but off the map until "Edit"
     * resumes them. Distinct from a layer never having been added to the map
     * yet, and from `onDeactivate`'s blanket suspend, which must not treat a
     * paused layer as something to bring back on the next `onActivate`.
     */
    private pausedLayerIds = new Set<string>();

    /** Draw layer ids that own a `createPermLayer` resting-state entry — see `applyLayerConfig`. */
    private ownsPermLayer = new Set<string>();
    /**
     * Ids from `ownsPermLayer` whose resting layer has actually been observed
     * present in `store.mapLayers` at least once — see `reconcileExternallyDeletedLayers`,
     * which must not treat "not registered yet" (an `addLayer` dispatch is
     * still resolving asynchronously) as "externally deleted".
     */
    private confirmedRestingLayerIds = new Set<string>();
    private unsubMapLayers: (() => void) | null = null;
    /** Waits for the map to load when the tool opens before it has; closing
     *  the tool first cancels it, or the tool's layers would appear on a map
     *  it is no longer open on, with nothing left to remove them. */
    private unsubMapLoaded: (() => void) | null = null;
    /**
     * The map element this tool's layer requests go to, kept from when it was
     * attached. Requests normally bubble up from the tool, which sits inside
     * the map; a tool just taken off the page is no longer inside it, and its
     * last requests (taking its layers off the map) must still arrive.
     */
    private boundMap: HTMLElement | null = null;
    /**
     * `Object.keys(store.mapLayers)` from the last `reconcileExternallyDeletedLayers`
     * pass, sorted and joined — lets it tell "a layer was added/removed" apart
     * from the many unrelated dispatches (pointer moves, etc.) that also run
     * through `store.subscribe`, so a catalog layer's own "From the catalog"
     * refresh only fires when the map layer set actually changed.
     */
    private lastMapLayerIdsKey = '';

    /** Points collected for the current in-progress line/polygon. */
    private draftPoints: LngLat[] = [];
    private draftRedoStack: LngLat[] = [];
    private cursorPos: LngLat | null = null;

    /** Center + live radius of a circle being dragged out (draw-circle mode). */
    private circleDraft: { center: LngLat; radiusM: number } | null = null;

    /** Opposite corners of a rectangle being dragged out (draw-rectangle mode). */
    private rectDraft: { corner1: LngLat; corner2: LngLat } | null = null;

    /** Opposite corners of a rectangle being dragged out to select features (select-rect mode). */
    private rectSelectDraft: { corner1: LngLat; corner2: LngLat } | null = null;
    /** Points traced so far while dragging out a free-hand selection (select-lasso mode). */
    private lassoSelectDraft: { points: LngLat[] } | null = null;

    /** Active layer id per geometry type. */
    private activeLayerIds: Partial<Record<GeometryType, string>> = {};

    /** "Add"/"finish" (geometry newly created) — the Draw row's undo/redo. */
    private drawHistory: HistoryEntry[] = [];
    private drawHistoryIndex = -1;
    /** "Update" (a feature dragged to a new position) and "delete" — the Select row's
     *  undo/redo. Both only ever happen to a feature that's already selected, so they
     *  belong with Select's history, not Draw's — kept separate so undoing one of these
     *  never accidentally undoes something drawn, and vice versa. */
    private moveHistory: HistoryEntry[] = [];
    private moveHistoryIndex = -1;

    private sharedLayersCreated = false;
    private createdDrawLayerIds = new Set<string>();

    // ── Touch detection ───────────────────────────────────────────────────────

    private touchMQ = window.matchMedia('(pointer: coarse)');
    @state() private isTouchDevice = this.touchMQ.matches;
    private onTouchMQChange = (e: MediaQueryListEvent) => { this.isTouchDevice = e.matches; };

    connectedCallback(): void {
        super.connectedCallback();
        this.touchMQ.addEventListener('change', this.onTouchMQChange);
    }

    // ── Snap state ────────────────────────────────────────────────────────────

    @state() private snapEnabled = true;
    @state() private altActive = false;
    private get effectiveSnap(): boolean { return this.snapEnabled && !this.altActive; }
    private snapPos: LngLat | null = null;
    private lastCursorPx: [number, number] | null = null;

    // ── Vertex editing state ──────────────────────────────────────────────────

    @state() private editState: EditState = 'none';
    private editHandles: EditHandle[] = [];
    private dragging: { handle: EditHandle; lastCoords: LngLat; origCoords: any } | null = null;
    /** Vertex highlighted for Delete/Backspace removal (click a vertex handle to select). */
    private selectedHandle: VertexHandle | null = null;
    private featureDrag: { featureId: string; startCoords: LngLat; origCoords: any; origCentroidLat: number; origCentroidLng: number } | null = null;

    // ── Event unsubscribers ───────────────────────────────────────────────────

    private unsubClick: (() => void) | null = null;
    private unsubMove:  (() => void) | null = null;
    private moveRafId:  number | null = null;
    private pendingMoveEvent: PointerMoveEvent | null = null;
    private unsubCtx:   (() => void) | null = null;
    private unsubDown:  (() => void) | null = null;
    private unsubUp:    (() => void) | null = null;
    private unsubLeave: (() => void) | null = null;

    @query('#attributes-dialog')
    private attributesDialog!: SlDialog | null;

    @query('.editing-layer-name')
    private editingLayerNameInput!: SlInput | null;

    // ── Inline layer configuration (editing session) ─────────────────────────
    /** Set when "Done" is pressed while the layer still has its default name — cleared as soon as it's renamed. */
    @state() private layerNameInvalid = false;
    /** In-progress text for the layer name field, kept separate from `layer.name`
     *  so a rename needs an explicit confirm/cancel (check/cross) — same pattern
     *  as `renameAttrDraft`. `null` when the field isn't currently being edited. */
    @state() private layerNameDraft: string | null = null;
    /** Whether the "Add attribute" form is expanded in the attributes dialog. */
    @state() private addingAttribute = false;
    /** The add-attribute form's draft input, for the active layer's property table. */
    @state() private newAttrName = '';
    /** Empty until explicitly chosen — the dropdown shows a placeholder rather
     *  than silently defaulting to a type the user never actually picked. */
    @state() private newAttrType: PropertyDef['type'] | '' = '';
    /**
     * Attributes removed via the "Edit attributes" dialog's trash icon,
     * most-recent-last, so an accidental delete has a one-click way back.
     * Removal strips the value from every feature that had it (see
     * `removeActiveLayerProperty`) — a large imported layer's whole point in
     * deleting an attribute is reclaiming that data, not just hiding the
     * column — so each entry carries a per-feature snapshot (`values`) to
     * restore exactly what was there, including features that never had the
     * attribute set at all. Mirrors the Draw row's history/redo-stack
     * pattern. Reset whenever a different layer's editing session starts
     * (see `applyLayerConfig`/`startEditingLayer`) so stale entries from one
     * layer can't be replayed onto another.
     */
    @state() private removedAttributeStack: RemovedAttributeEntry[] = [];
    @state() private removedAttributeRedoStack: RemovedAttributeEntry[] = [];
    /** Index (in the active layer's `properties`) of the row whose name is
     *  currently being edited inline in the "Edit attributes" table —
     *  null when no row is being renamed. */
    @state() private renamingAttributeIndex: number | null = null;
    /** The rename row's draft input. */
    @state() private renameAttrDraft = '';

    // ─── Styles ───────────────────────────────────────────────────────────────

    static styles = css`
        :host {
            /* Shared by the "Edit attributes" table's Attribute/Type
             * columns and the add-attribute form below it (the "Add
             * attribute" button, and the name input/type select once it's
             * expanded), so those stay visually aligned with the columns
             * above them without the values drifting apart. */
            --prop-attr-col-width: 46%;
            --prop-type-col-width: 32%;
            display: flex;
            flex-direction: column;
            padding: var(--webmapx-tool-padding, 0);
            min-width: 200px;
            max-height: var(--webmapx-draw-tool-max-height, 100%);
            /* Deliberately not 'hidden': an overflow value other than
             * 'visible' here would make :host itself the nearest ancestor
             * .session-footer's 'position: sticky' looks for — and since
             * :host's own height never actually gets clamped (see the
             * .session-footer comment below), nothing would ever overflow
             * it, so stickiness against it would be a no-op. Leaving this
             * 'visible' lets it pass through to the real scrolling
             * container, webmapx-tool-panel's .panel-content.
             */
            overflow: visible;
        }

        /* The editing session's .session-footer supplies its own matching
         * bottom padding (so that padding stays part of its opaque,
         * sticky-pinned box — see its own comment) — without this, :host's
         * padding would stack on top of it, doubling the gap below the
         * buttons whenever the attribute list is short enough not to need
         * scrolling. Views without a footer (type/layer pickers) are
         * unaffected and keep :host's own bottom padding as their gutter.
         */
        :host:has(.session-footer) {
            padding-bottom: 0;
        }

        .scroll-content {
            flex: 1;
            overflow-y: auto;
            min-height: 0;
        }

        /* Each mode row is its own boxed pill — select, draw shape, snap —
           since those are switches you pick between. Undo/redo/delete are
           one-off actions, not a mode, so they get the plain, unboxed
           .history-actions treatment instead (see below), slightly smaller
           than the mode icons they sit beside. */
        .pill {
            display: inline-flex;
            gap: 0.15rem;
            padding: 3px;
            border: 1px solid var(--color-background-secondary, #e2e5e8);
            border-radius: 8px;
            flex-shrink: 0;
        }
        .history-actions {
            display: inline-flex;
            align-items: center;
            gap: 0.1rem;
            flex-shrink: 0;
        }
        .toolbar-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
            margin-bottom: 0.5rem;
            flex-shrink: 0;
        }
        .toolbar-label {
            font-size: 0.66rem;
            font-weight: 700;
            color: var(--color-text-muted, #8a95a1);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            width: 2.75rem;
            flex-shrink: 0;
        }
        /* Sized like the sl-icon-buttons beside it. A native button, not
           sl-icon-button, because only a real button can carry aria-pressed
           (see toggleButton). */
        .toggle-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: inherit;
            padding: var(--sl-spacing-x-small, 0.5rem);
            border: none;
            border-radius: 6px;
            background: none;
            color: var(--sl-color-neutral-600, #5a6773);
            cursor: pointer;
        }
        .toggle-button:not([aria-pressed="true"]):not(:disabled):hover {
            color: var(--color-primary, #2b6c8f);
            background: var(--color-background-secondary, #e8ebee);
        }
        .toggle-button:focus-visible {
            outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #2b6c8f));
            outline-offset: var(--webmapx-focus-offset, 2px);
        }
        .toggle-button[aria-pressed="true"] {
            color: #fff;
            background: var(--color-primary, #2b6c8f);
            box-shadow: 0 2px 6px -2px var(--color-primary, #2b6c8f);
        }
        .toggle-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .help {
            font-size: 0.8rem;
            color: var(--color-text-secondary, #5a6773);
            margin-bottom: 0.5rem;
            min-height: 2.5em;
        }

        .section-label {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--color-text-muted, #6b7681);
            margin-bottom: 0.25rem;
        }

        .flow-heading {
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        /*
         * Sticks to the bottom of whichever ancestor is actually scrolling —
         * in practice webmapx-tool-panel's own .panel-content wrapper,
         * since :host's 'max-height: 100%' never resolves to a definite
         * size through the slot boundary (a percentage height on a flex item
         * that got its size from *shrinking* rather than an explicit height
         * or stretch isn't treated as definite for a descendant's percentage
         * resolution), so .scroll-content's own 'overflow-y: auto' never
         * actually engages and :host just grows to fit its content instead.
         * 'position: sticky' sidesteps that entirely: it pins relative to
         * whatever the real nearest scrolling ancestor turns out to be,
         * which is exactly what keeps this bar visible instead of scrolling
         * away with a long attribute list — see :host's 'overflow: visible'
         * above, which is what lets stickiness reach past this component's
         * own (non-scrolling) box to find it.
         */
        .session-footer {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 0.5rem;
            margin-top: 0.6rem;
            padding-top: 0.5rem;
            /*
             * Matches :host's own padding (the gutter .panel-content itself
             * has none of — see :host's 'padding' above), so the buttons
             * keep the same distance from the panel's bottom edge whether
             * this bar is sitting in its natural, unstuck position (bounded
             * by :host's own bottom padding) or genuinely stuck against
             * .panel-content's edge while scrolling a long attribute list.
             * It's padding rather than the 'bottom' sticky offset so this
             * gap is part of the footer's own opaque box — pushed out as a
             * sticky offset instead, that strip would sit *below* the
             * footer's background, uncovered, letting whatever scrolled
             * content and its transparent backdrop happened to be there
             * show through underneath the buttons.
             */
            padding-bottom: var(--webmapx-tool-padding, 0);
            flex-shrink: 0;
            position: sticky;
            bottom: 0;
            background: var(--webmapx-panel-bg, rgb(var(--color-surface-rgb, 255 255 255) / var(--webmapx-surface-alpha, 1)));
            border-top: 1px solid var(--color-border-light, #e2e7ec);
        }

        /* Always rendered (unlike the hint, which only appears on a naming
           error) so the "Edit attributes" button stays pinned to the
           left edge and "Done" to the right, whichever else is showing. */
        .footer-spacer {
            flex: 1;
        }

        .name-required-hint {
            font-size: 0.78rem;
            color: var(--sl-color-danger-600, #dc2626);
        }

        .layer-picker-header {
            display: flex;
            align-items: center;
            margin-top: 0.75rem;
            margin-bottom: 0.5rem;
        }

        .add-layer-btn {
            flex-shrink: 0;
        }

        .editing-title-row {
            display: flex;
            flex-direction: column;
            gap: 0.3rem;
            margin-bottom: 0.5rem;
        }

        .editing-title-second-row {
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }

        .editing-title-label {
            font-size: 0.8rem;
            color: var(--color-text-secondary, #5a6773);
            flex-shrink: 0;
        }


        .type-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
        }

        .type-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.3rem;
            padding: 0.8rem 0.3rem;
            border: 1px solid var(--color-background-secondary, #e2e5e8);
            border-radius: 8px;
            background: transparent;
            cursor: pointer;
            font: inherit;
            color: inherit;
        }

        .type-card:hover {
            background: var(--color-background-secondary, #f4f6f8);
            border-color: var(--sl-color-primary-400, #7dc4fa);
        }

        .type-card[active] {
            background: var(--color-primary-soft, rgba(43, 108, 143, 0.12));
            border-color: var(--color-primary, #2b6c8f);
        }

        .type-icon {
            display: block;
            width: 100%;
        }

        .type-icon svg {
            width: 100%;
            height: auto;
            display: block;
        }

        .type-name { font-size: 0.72rem; font-weight: 600; text-align: center; line-height: 1.2; }
        .type-count { font-size: 0.68rem; color: var(--color-text-muted, #6b7681); }
        /* Muted text passes AA on white, not on the selected card's tint. */
        .type-card[active] .type-count { color: var(--color-text-secondary, #5a6773); }

        .empty-state {
            font-size: 0.82rem;
            color: var(--color-text-muted, #6b7681);
            padding: 0.4rem 0;
        }

        .layer-list {
            margin-bottom: 0.5rem;
        }

        .layer-group {
            display: flex;
            flex-direction: column;
            border: 1px solid var(--color-background-secondary, #e2e5e8);
            border-radius: 8px;
            overflow: hidden;
        }

        .layer-row {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.5rem 0.6rem;
            font-size: 0.85rem;
            border-bottom: 1px solid var(--color-background-secondary, #e2e5e8);
        }

        .layer-row:last-child {
            border-bottom: none;
        }

        .layer-row:hover {
            background: var(--color-background-secondary, #f4f6f8);
        }

        .remove-layer-btn {
            font-size: 0.75rem;
        }

        .color-dot {
            flex-shrink: 0;
            box-sizing: border-box;
        }
        /* Shape echoes the geometry the layer holds — a small dot, a thin
           line, an outlined area — rather than one swatch shape for every
           layer type. Polygon's fill is a light tint (see swatchStyle,
           which appends alpha to the hex colour) with the outline carrying
           the full colour, so it reads as an area rather than a solid chip. */
        .color-dot--point {
            width: 6px; height: 6px;
            border-radius: 50%;
        }
        .color-dot--line {
            width: 12px;
            height: 2px;
            border-radius: 1px;
        }
        .color-dot--polygon {
            width: 10px; height: 10px;
            border-radius: 2px;
            border: 1.5px solid;
        }

        .layer-name-wrap {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: baseline;
            gap: 0.3rem;
            overflow: hidden;
            white-space: nowrap;
        }

        .layer-name {
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .feature-count {
            flex-shrink: 0;
            color: var(--color-text-muted, #6b7681);
            font-size: 0.75rem;
        }

        .editing-layer-name {
            flex: 1;
            min-width: 0;
        }
        .editing-layer-name::part(base) {
            background: transparent;
            border: none;
            border-bottom: 1px dashed var(--color-background-secondary, #d5dce3);
            border-radius: 0;
            box-shadow: none;
        }
        .editing-layer-name::part(base):hover,
        .editing-layer-name::part(base):focus-within {
            background: var(--sl-input-background-color, #fff);
            border-bottom-style: solid;
            border-bottom-color: var(--sl-input-border-color, #d5dce3);
        }
        /* Shoelace's default focus ring is a box-shadow glow, sized for a
           form field — it overflows this title-sized rename box's bounds
           instead of hugging it. The border-bottom above (turned solid on
           focus, same as hover) is cue enough on its own. */
        .editing-layer-name::part(base):focus-within {
            border-bottom-color: var(--sl-color-primary-400, #6ea8dc);
            box-shadow: none;
        }
        /* "Done" refuses to leave a layer still called "New layer" — this is
           what tells the user why, instead of the button silently doing
           nothing. */
        .editing-layer-name.name-invalid::part(base) {
            background: var(--sl-color-danger-50, #fef2f2);
            border: 1px solid var(--sl-color-danger-500, #ef4444);
            border-radius: 4px;
        }
        .editing-layer-name.name-invalid::part(input) {
            color: var(--sl-color-danger-600, #dc2626);
        }
        /* A muted pencil is the "click to rename" tell — cheap to notice at a
           glance, unlike a hover-only border that only confirms editability
           after the user already suspected it. */
        .editing-layer-name-icon {
            color: var(--color-text-muted, #9aa4ad);
            font-size: 0.85rem;
            cursor: pointer;
        }
        .editing-layer-name:hover .editing-layer-name-icon,
        .editing-layer-name:focus-within .editing-layer-name-icon {
            color: var(--color-primary, #2b6c8f);
        }
        /* Same check/cross pairing as the attribute rename row's own
           "Save name"/"Cancel rename" buttons, so confirming or discarding
           an edit looks the same everywhere in this panel. Shown only while
           a rename is in progress — the pencil above returns once it's
           confirmed or cancelled. Muted to match the pencil's own resting
           color rather than Shoelace's default (near-black) icon color,
           which read as too heavy for a pair of small inline icons. */
        .editing-layer-name-confirm {
            font-size: 0.85rem;
            flex-shrink: 0;
            color: var(--color-text-muted, #9aa4ad);
        }
        .editing-layer-name-confirm::part(base) {
            padding: 0.1rem;
        }
        .editing-layer-name-confirm[name="check-lg"]:not([disabled])::part(base):hover {
            color: var(--color-primary, #2b6c8f);
        }
        .editing-layer-name-confirm[name="x-lg"]::part(base):hover {
            color: var(--sl-color-danger-600, #dc2626);
        }

        .color-swatch-wrap {
            position: relative;
            width: 22px; height: 22px;
            flex-shrink: 0;
            /* The "Back" row's arrow-icon-button has its glyph inset ~8px
               from the button's own edge; this swatch has no such inset, so
               without this it hangs visibly further left than everything
               above it instead of lining up with it. */
            margin-left: 8px;
        }
        .color-swatch {
            position: absolute;
            inset: 0;
            padding: 0;
            border: 2px solid var(--color-background-secondary, #e2e5e8);
            /* Read-only preview — styling is done from the Legend, not here. */
            pointer-events: none;
        }
        /* Shape echoes the geometry the layer holds, same as .color-dot. */
        .color-swatch--point {
            inset: 5px;
            border-radius: 50%;
        }
        .color-swatch--line {
            top: 50%;
            bottom: auto;
            height: 4px;
            margin-top: -2px;
            border-radius: 2px;
        }
        .color-swatch--polygon {
            border-radius: 4px;
        }

        .prop-table-wrap {
            overflow-x: auto;
            overflow-y: auto;
            max-height: 220px;
            margin-top: 0.4rem;
            border: 1px solid var(--color-background-secondary, #e2e7ec);
            border-radius: 4px;
        }
        /*
         * A CSS Grid, not an HTML table — deliberately. With mixed %/fixed
         * column widths (Type is a percentage, the trash column a fixed
         * 2.4rem) that don't sum to exactly 100%, 'table-layout: fixed'
         * redistributes the leftover space across columns using its own
         * (browser-specific, not simply proportional) algorithm — so a
         * td's *rendered* width stops matching 'width: var(...)' as
         * soon as a sibling column doesn't share that same unit. That
         * silently broke the add-attribute row's alignment below the table
         * (built from the same variables, but as plain flex items, which
         * don't have that redistribution): its width matched the
         * *specified* percentage while the table's own column had already
         * drifted away from it. Grid tracks are used exactly as specified
         * with no redistribution, so both places measure the same way and
         * stay in lockstep.
         */
        .prop-grid {
            display: grid;
            /* minmax(2.4rem, 1fr), not a flat 2.4rem: the first two columns
               are percentages that don't sum to 100% with a fixed-width
               third one, and unlike a table's own redistribution, Grid
               leaves genuinely unused tracks as blank space rather than
               filling the row — this is what absorbs that leftover width
               instead of leaving a bare strip between the table and the
               scrollbar. The icon still sits flush against the right edge
               via .prop-grid-cell--actions' justify-content: flex-end. */
            grid-template-columns: var(--prop-attr-col-width) var(--prop-type-col-width) minmax(2.4rem, 1fr);
            font-size: 0.76rem;
        }
        /* Each row is 'display: contents' — its cells become direct grid
           items (placed into the grid's row/column tracks automatically),
           while the wrapper still exists in the DOM for ':last-child' and
           the per-row auto/muted-row styling below. */
        .prop-grid-row {
            display: contents;
        }
        .prop-grid-cell {
            display: flex;
            align-items: center;
            min-width: 0;
            padding: 0.15rem 0.35rem;
            border-bottom: 1px solid var(--color-background-secondary, #e2e7ec);
        }
        .prop-grid-header .prop-grid-cell {
            font-weight: 600;
            background: var(--color-background-secondary, #f4f6f8);
            position: sticky;
            top: 0;
        }
        .prop-grid-cell--actions {
            padding-left: 0;
            padding-right: 0.2rem;
            justify-content: flex-end;
        }
        .prop-grid-row:last-child .prop-grid-cell { border-bottom: none; }
        .prop-row-auto .prop-grid-cell { color: var(--color-text-muted, #6b7681); font-style: italic; }
        /* The name cell's usual ellipsis/nowrap clipping (on .prop-cell-text)
           is for plain text — while it holds the rename row's input +
           confirm/cancel buttons instead, let it actually show all three
           rather than clipping them. */
        .prop-grid-cell:has(.rename-attr-row) { overflow: visible; }

        /* Plain cell text (the Type column, and the Attribute column outside
           a rename) — truncated on its own inner span rather than the flex
           cell itself, since text-overflow doesn't reliably apply directly
           to a flex container's text content. */
        .prop-cell-text {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* The name, then the rename (pencil) icon pinned to the cell's far
           right edge — right before the Type column starts. */
        .prop-name-cell {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.2rem;
            min-width: 0;
            width: 100%;
        }

        .rename-attr-row {
            display: flex;
            align-items: center;
            gap: 0.15rem;
            width: 100%;
            min-width: 0;
        }
        .rename-attr-row sl-input {
            flex: 1;
            min-width: 0;
        }
        .rename-attr-row sl-input::part(base) {
            font-size: 0.76rem;
        }
        .rename-attr-btn {
            color: var(--color-text-muted, #6b7681);
            flex-shrink: 0;
        }
        .rename-attr-btn::part(base) { padding: 0.15rem; }
        .rename-attr-btn::part(base):hover { color: var(--color-text-primary, #16202a); }

        .remove-attr-btn {
            color: var(--sl-color-danger-600, #c0392b);
            font-size: 1.1rem;
        }
        .remove-attr-btn::part(base) { padding: 0.15rem; }
        .remove-attr-btn::part(base):hover { color: var(--sl-color-danger-700, #a52f22); }

        /* Red only once there's actually something to delete — an always-red
           trash can reads as "something's wrong" before a feature is even
           selected. */
        .delete-feature-btn:not([disabled]) {
            color: var(--sl-color-danger-600, #c0392b);
        }
        .delete-feature-btn:not([disabled])::part(base):hover {
            color: var(--sl-color-danger-700, #a52f22);
        }

        /* Shoelace's own body padding otherwise leaves a visible gap between
         * the dialog's title and this content — the table (or the undo/redo
         * row above it) sits right under the header instead. Left/right/
         * bottom padding are untouched. */
        #attributes-dialog::part(body) {
            padding-top: 0;
        }

        /* Shoelace's own footer is plain 'text-align: right', packing
         * everything slotted into it against the right edge — this spreads
         * "Optional attributes" to the left instead, lined up with the "Add
         * attribute" button above it (both start at the same left inset,
         * since --footer-spacing and --body-spacing match), while "Done"
         * stays on the right. */
        #attributes-dialog::part(footer) {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .add-attr-form {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            margin-top: 0.5rem;
        }
        /* Kept unpadded/unbordered (unlike a typical form box) so the name
         * input and type select below resolve their column-matching widths
         * against the same reference as the table and the "Add attribute"
         * button — a wrapping box here would shrink that reference by its
         * own padding and throw the alignment off. A small gap separates
         * the input and select themselves (and the select from the cancel
         * icon) — flush against each other their focus rings visibly
         * overlapped. */
        .add-attr-fields-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        /* Same width as the table's Attribute column, matching the "Add
         * attribute" button this replaces — so typing a name doesn't shift
         * anything, it just continues in the same slot. */
        .add-attr-name-input {
            flex: 0 0 var(--prop-attr-col-width);
            min-width: 0;
        }
        /* Appears once a name is typed, close to the name input, in the
         * Type column's own slot right next to it — the second step of
         * "name, then type" laid out the same way the table itself pairs an
         * attribute with its type. */
        .add-attr-type-select {
            flex: 0 0 var(--prop-type-col-width);
            min-width: 0;
        }
        /* Shoelace sizes the select's own closed-state text ("Choose a type")
         * from --sl-input-font-size-small, but sl-option hardcodes
         * --sl-font-size-medium internally regardless of the select's own
         * size — plain font-size can't reach through that, only overriding
         * the same custom property it reads (which, being a custom
         * property, still cascades through the shadow boundary). Otherwise
         * the opened list is noticeably larger than the placeholder that
         * opened it. */
        .add-attr-type-select sl-option {
            --sl-font-size-medium: var(--sl-font-size-small, 0.875rem);
        }
        /* "Add attribute" on the left, undo/redo on the right — one row,
         * not two, so the undo/redo pair doesn't cost the dialog a whole
         * extra line whenever there's nothing to add yet. */
        .add-attr-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 0.5rem;
        }
        /* Same width as the table's Attribute column (--prop-attr-col-width)
         * — it's where a newly added row will land, right under that column. */
        .add-attr-btn-below {
            width: var(--prop-attr-col-width);
            flex-shrink: 0;
        }
        /* Undo/redo move here — one row below the add-attribute form — while
         * it's open, since the button they'd otherwise share a row with is
         * replaced by the form itself. Still right-aligned. */
        .add-attr-undo-row {
            display: flex;
            justify-content: flex-end;
        }
        /* Keeps the undo/redo icons themselves next to each other — see
         * renderAttributeUndoRedo for why this can't just be a gap on the
         * row that also holds the "Add attribute" button. */
        .add-attr-undo-group {
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }
        /* Matches the "Add attribute" button's width, since it sits directly
         * below it (left-aligned in the footer — see ::part(footer) above).
         * The width has to go on the dropdown itself, not just the trigger
         * button: sl-dropdown's :host is shrink-to-fit (inline-block, no
         * explicit width), and a percentage width on a descendant of a
         * shrink-to-fit box can't resolve (the container's own size would
         * depend on it) — it silently falls back to the button's natural
         * content width instead. Giving the dropdown itself a definite
         * width breaks that, and the trigger just fills it at 100%. */
        .optional-attrs-dropdown {
            width: var(--prop-attr-col-width);
        }
        .optional-attrs-trigger {
            width: 100%;
        }
        .auto-attr-dropdown-panel {
            display: flex;
            flex-direction: column;
            gap: 0.45rem;
            padding: 0.6rem 0.7rem;
            background: var(--sl-panel-background-color, #fff);
            border: 1px solid var(--color-background-secondary, #e2e7ec);
            border-radius: 6px;
            box-shadow: var(--sl-shadow-medium);
        }
        .auto-attr-checkbox {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.82rem;
            cursor: pointer;
            white-space: nowrap;
        }
        /* A plain checkbox otherwise renders in the browser's own default
         * accent color, not the app's theme blue — accent-color is the
         * standards-based way to recolor native form controls without
         * rebuilding the checkbox from scratch. */
        .auto-attr-checkbox input[type="checkbox"] {
            accent-color: var(--color-primary, #2b6c8f);
        }
        .add-attr-note {
            font-size: 0.72rem;
            color: var(--color-text-muted, #6b7681);
            margin-top: 0.1rem;
        }
        .features-section {
            margin-top: 0.25rem;
            max-height: 180px;
            overflow-y: auto;
        }

        .feature-row {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.2rem 0.6rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.82rem;
        }

        .feature-row:hover { background: var(--color-background-secondary, #f4f6f8); }
        .feature-row.selected { background: var(--color-primary-soft, rgba(43, 108, 143, 0.12)); }

        .divider {
            width: 1px; height: 1.2rem;
            background: var(--color-background-secondary, #f4f6f8);
            margin: 0 0.1rem;
        }

        .prop-row { display: flex; gap: 0.4rem; align-items: center; font-size: 0.82rem; margin-bottom: 0.2rem; }
        .prop-label { width: 80px; color: var(--color-text-muted, #6b7681); flex-shrink: 0; }
        .prop-value { flex: 1; min-width: 0; }
        .prop-link { display: block; width: 100%; font-size: 0.75rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .prop-img { max-width: 100%; max-height: 80px; border-radius: 3px; object-fit: cover; }
        .prop-img-error { font-size: 0.75rem; color: var(--sl-color-danger-600, #c0392b); font-style: italic; }
        .prop-url-wrap { flex: 1; min-width: 0; overflow: hidden; display: flex; flex-direction: column; gap: 0.2rem; }
    `;

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    protected onActivate(): void {
        if (this.adapter?.store.getState().mapLoaded) {
            this.createSharedLayers();
        } else {
            this.unsubMapLoaded = this.adapter?.store.subscribe((state) => {
                if (state.mapLoaded) {
                    this.unsubMapLoaded?.();
                    this.unsubMapLoaded = null;
                    this.createSharedLayers();
                }
            }) ?? null;
        }
        // Catch up on any of our layers the legend (or anything else) deleted
        // while this tool was inactive, before the resume loop below gets a
        // chance to recreate one of them on the map.
        if (this.adapter) {
            // Layers already owned coming into this activation are known-settled
            // (nothing is mid-creation at this point) — confirm them upfront so
            // this catch-up pass can still detect one deleted while inactive.
            for (const id of this.ownsPermLayer) this.confirmedRestingLayerIds.add(id);
            this.reconcileExternallyDeletedLayers(this.adapter.store.getState());
            this.unsubMapLayers = this.adapter.store.subscribe((state) => this.reconcileExternallyDeletedLayers(state));
        }

        // Re-add draw layers suspended on last deactivate, re-blank borrowed sources —
        // but not ones the user explicitly paused, which stay off the map until
        // "Edit" brings them back.
        for (const layer of this.drawLayers) {
            if (this.pausedLayerIds.has(layer.id)) continue;
            this.resumeDrawLayer(layer);
        }
        for (const id of [RUBBER_SOURCE_ID, VERTEX_SOURCE_ID, DRAFT_SOURCE_ID, EDIT_VERT_SOURCE, EDIT_MID_SOURCE, SEL_VERT_SOURCE, SNAP_SOURCE_ID,
            MARQUEE_SOURCE_ID, MULTI_SEL_SOURCE_ID, ACTIVE_NODES_SOURCE_ID]) {
            this.dispatchEvent(new CustomEvent('webmapx-suppress-busy-for-source', { detail: id, bubbles: true, composed: true }));
        }
        this.bindEvents();
        window.addEventListener('keydown', this.onKeyDown, true);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('blur', this.onWindowBlur);
        // The Legend is where the "Done" button next to a `beingEdited` layer
        // lives; it sends the request to the map element — see
        // `onFinishEditingRequest`'s own doc comment.
        this.boundMap?.addEventListener('webmapx-draw-finish-editing', this.onFinishEditingRequest);
        this.setModeInternal('select');
        void this.refreshTypeCatalogCounts();
    }

    protected onDeactivate(): void {
        this.unsubMapLoaded?.();
        this.unsubMapLoaded = null;
        this.unsubMapLayers?.();
        this.unsubMapLayers = null;
        for (const id of [RUBBER_SOURCE_ID, VERTEX_SOURCE_ID, DRAFT_SOURCE_ID, EDIT_VERT_SOURCE, EDIT_MID_SOURCE, SEL_VERT_SOURCE, SNAP_SOURCE_ID,
            MARQUEE_SOURCE_ID, MULTI_SEL_SOURCE_ID, ACTIVE_NODES_SOURCE_ID]) {
            this.dispatchEvent(new CustomEvent('webmapx-unsuppress-busy-for-source', { detail: id, bubbles: true, composed: true }));
        }
        if (this.moveRafId !== null) { cancelAnimationFrame(this.moveRafId); this.moveRafId = null; }
        for (const [, rafId] of this.pendingSourceRefresh) cancelAnimationFrame(rafId);
        this.pendingSourceRefresh.clear();
        this.pendingMoveEvent = null;
        this.unbindEvents();
        window.removeEventListener('keydown', this.onKeyDown, true);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('blur', this.onWindowBlur);
        this.boundMap?.removeEventListener('webmapx-draw-finish-editing', this.onFinishEditingRequest);
        this.altActive = false;
        // Restore borrowed sources and suspend draw layers from the map (keep features in memory)
        for (const layer of this.drawLayers) {
            if (layer.borrowedSourceId) this.restoreBorrowedLayer(layer);
            this.suspendDrawLayerFromMap(layer);
        }
        this.draftPoints = [];
        this.circleDraft = null;
        this.rectDraft = null;
        this.rectSelectDraft = null;
        this.lassoSelectDraft = null;
        this.cursorPos = null;
        this.snapPos = null;
        this.lastCursorPx = null;
        this.dragging = null;
        this.featureDrag = null;
        this.selectedFeatureId = null;
        this.selectedFeatureIds = [];
        this.editState = 'none';
        this.editHandles = [];
        this.adapter?.setPanEnabled(true);
        this.adapter?.setDoubleClickZoomEnabled(true);
        this.updateSelectedSource();
        this.removeSharedLayers();   // only tool layers — data layers stay on map
        this.adapter?.setCursor('');
    }

    disconnectedCallback(): void {
        this.touchMQ.removeEventListener('change', this.onTouchMQChange);
        this.unsubMapLayers?.();
        this.unsubMapLayers = null;
        // An open tool is closed first (WebmapxModalTool), which gives a layer
        // being edited its features back; detaching then takes the tool's own
        // layers off the map (`onMapDetached`).
        super.disconnectedCallback();
    }

    /**
     * A layer's property schema lives on `drawLayers`, but the info tool and
     * the legend read it from that layer's perm-layer entry in the store —
     * they have no notion of `drawLayers` at all. Re-deriving it here on
     * every `drawLayers` change, rather than threading a manual
     * `syncLayerPropertiesToStore` call through each place that edits a
     * schema (add/remove/rename an attribute, toggle an auto attribute...),
     * is what keeps a future mutation site from quietly reintroducing the
     * same gap: one of those calls was missing for a while, and a
     * `create-time`/`update-time` attribute added after a layer's editing
     * session had already started rendered as a raw epoch number in the
     * info tool because the store never heard about it.
     */
    protected updated(changedProperties: PropertyValues): void {
        super.updated(changedProperties);
        if (changedProperties.has('drawLayers')) {
            for (const layer of this.drawLayers) {
                this.syncLayerPropertiesToStore(layer.id, layer.properties);
            }
        }
    }

    protected onMapAttached(adapter: IMap): void {
        // Before registering (super), which is what lets the tool be opened.
        this.boundMap = this.mapHost;
        super.onMapAttached(adapter);
    }

    protected onMapDetached(): void {
        this.removeAllMapLayers();
        super.onMapDetached();
        this.boundMap = null;
    }

    // ─── Shared map layers (rubberband, vertex) ───────────────────────────────

    private createSharedLayers(): void {
        if (this.sharedLayersCreated) return;

        this.dispatch('webmapx-add-source', { id: RUBBER_SOURCE_ID, config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } });
        this.dispatch('webmapx-add-source', { id: VERTEX_SOURCE_ID, config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } });

        this.dispatch('webmapx-add-layer', {
            id: RUBBER_LINE_ID, type: 'line', source: RUBBER_SOURCE_ID,
            metadata: { isToolLayer: true, hideFromLegend: true },
            // Solid, not dashed: this previews an in-progress line/polygon
            // edge, and a circle/rectangle's drag outline — none of which
            // are the dashed-line tool. Dashing this generically read as
            // "you're drawing a dashed line" regardless of which tool was
            // actually active, now that dashed is a real, separate choice.
            paint: { 'line-color': DATA_TOOL, 'line-width': 2 }
        });
        this.dispatch('webmapx-add-layer', {
            id: VERTEX_LAYER_ID, type: 'circle', source: VERTEX_SOURCE_ID,
            metadata: { isToolLayer: true, hideFromLegend: true },
            paint: { 'circle-radius': 8, 'circle-color': 'transparent', 'circle-stroke-width': 2, 'circle-stroke-color': '#ff6600' }
        });

        // Active-feature nodes — see the constant's doc comment above. Colour
        // is per-feature data (`['get', 'color']`, set when the source is
        // populated in `updateSelectedSource`), since a layer's line colour
        // is user-configurable, not a fixed value this paint spec can hardcode.
        this.dispatch('webmapx-add-source', { id: ACTIVE_NODES_SOURCE_ID, config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } });
        this.dispatch('webmapx-add-layer', {
            id: ACTIVE_NODES_LAYER_ID, type: 'circle', source: ACTIVE_NODES_SOURCE_ID,
            metadata: { isToolLayer: true, hideFromLegend: true },
            paint: { 'circle-radius': 4, 'circle-color': ['get', 'color'] }
        });

        // Draft vertices (points placed so far while drawing)
        this.dispatch('webmapx-add-source', { id: DRAFT_SOURCE_ID, config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } });
        this.dispatch('webmapx-add-layer', {
            id: DRAFT_POINT_ID, type: 'circle', source: DRAFT_SOURCE_ID,
            metadata: { isToolLayer: true, hideFromLegend: true },
            paint: { 'circle-radius': 5, 'circle-color': DATA_TOOL_HALO, 'circle-stroke-width': 2, 'circle-stroke-color': DATA_TOOL }
        });

        // Vertex editing handles
        this.dispatch('webmapx-add-source', { id: EDIT_VERT_SOURCE, config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } });
        this.dispatch('webmapx-add-layer', {
            id: EDIT_VERT_LAYER, type: 'circle', source: EDIT_VERT_SOURCE,
            metadata: { isToolLayer: true, hideFromLegend: true },
            paint: { 'circle-radius': 6, 'circle-color': DATA_TOOL_HALO, 'circle-stroke-width': 2, 'circle-stroke-color': DATA_TOOL }
        });

        // Midpoint handles (insert-vertex affordance)
        this.dispatch('webmapx-add-source', { id: EDIT_MID_SOURCE, config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } });
        this.dispatch('webmapx-add-layer', {
            id: EDIT_MID_LAYER, type: 'circle', source: EDIT_MID_SOURCE,
            metadata: { isToolLayer: true, hideFromLegend: true },
            paint: { 'circle-radius': 4, 'circle-color': DATA_TOOL_HALO, 'circle-stroke-width': 1.5, 'circle-stroke-color': DATA_TOOL, 'circle-opacity': 0.7 }
        });

        // Selected vertex highlight (delete with Delete/Backspace)
        this.dispatch('webmapx-add-source', { id: SEL_VERT_SOURCE, config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } });
        this.dispatch('webmapx-add-layer', {
            id: SEL_VERT_LAYER, type: 'circle', source: SEL_VERT_SOURCE,
            metadata: { isToolLayer: true, hideFromLegend: true },
            paint: {
                'circle-radius': SELECTED_VERTEX_RADIUS,
                'circle-color': this.cssVar('--webmapx-draw-selected-color', SELECTED_VERTEX_COLOR),
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff'
            }
        });

        // Snap indicator
        this.dispatch('webmapx-add-source', { id: SNAP_SOURCE_ID, config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } });
        this.dispatch('webmapx-add-layer', {
            id: SNAP_LAYER_ID, type: 'circle', source: SNAP_SOURCE_ID,
            metadata: { isToolLayer: true, hideFromLegend: true },
            paint: { 'circle-radius': 7, 'circle-color': '#ffdd00', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff', 'circle-opacity': 0.9 }
        });

        // Rectangle/lasso select drag preview — dashed outline, light fill
        this.dispatch('webmapx-add-source', { id: MARQUEE_SOURCE_ID, config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } });
        this.dispatch('webmapx-add-layer', {
            id: MARQUEE_FILL_ID, type: 'fill', source: MARQUEE_SOURCE_ID,
            metadata: { isToolLayer: true, hideFromLegend: true },
            paint: { 'fill-color': DATA_TOOL, 'fill-opacity': 0.12 }
        });
        this.dispatch('webmapx-add-layer', {
            id: MARQUEE_LINE_ID, type: 'line', source: MARQUEE_SOURCE_ID,
            metadata: { isToolLayer: true, hideFromLegend: true },
            paint: { 'line-color': DATA_TOOL, 'line-width': 1.5, 'line-dasharray': [2, 2] }
        });

        // Rectangle/lasso select result — every caught point feature highlighted
        // at once (line/polygon selections render via ACTIVE_NODES_* instead).
        this.dispatch('webmapx-add-source', { id: MULTI_SEL_SOURCE_ID, config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } });
        this.dispatch('webmapx-add-layer', {
            id: MULTI_SEL_POINT_ID, type: 'circle', source: MULTI_SEL_SOURCE_ID,
            metadata: { isToolLayer: true, hideFromLegend: true },
            paint: { 'circle-radius': SELECTED_VERTEX_RADIUS, 'circle-color': SELECTED_VERTEX_COLOR, 'circle-opacity': 0.8 }
        });

        this.sharedLayersCreated = true;

        // Re-add any draw layers from prior activation — but not a paused
        // one (a "from the map" layer that's had "Done" pressed on it, or
        // any layer stepped aside for a same-type "Add new"): it's supposed
        // to stay off the map until "Edit" calls `resumeDrawLayer` on it
        // again, same as `onActivate`'s own resume loop right after this
        // method returns. Skipping this check here re-added the draw
        // layer's own overlay (this tool's editing-style paint) on every
        // reactivation regardless of pause state — since
        // `removeSharedLayers` resets `sharedLayersCreated` on every
        // deactivate, this loop runs again on every single activation, not
        // just the first.
        for (const layer of this.drawLayers) {
            if (this.pausedLayerIds.has(layer.id)) continue;
            this.addMapLayersForDrawLayer(layer);
            this.refreshDrawLayerSource(layer.id);
        }
    }

    private addMapLayersForDrawLayer(cfg: DrawLayerConfig): void {
        if (this.createdDrawLayerIds.has(cfg.id)) return;
        // A composite (Polygon, LineString) carries its own source; a plain
        // layer (Point) needs one first.
        if (cfg.type === 'Point') {
            this.dispatch('webmapx-add-source', {
                id: drawSourceId(cfg.id, cfg.type),
                config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
            });
        }
        this.dispatch('webmapx-add-layer', {
            // `currentDrawLayerColor` (not `cfg.color`): resuming a paused
            // layer rebuilds this overlay from scratch, and it must pick up
            // whatever colour the Legend has since applied to the resting
            // layer rather than reverting to the colour it was created with.
            ...drawLayerSpec(cfg.id, cfg, this.currentDrawLayerColor(cfg), {
                label: cfg.name, legendRole: 'overlay', hideFromLegend: true,
            }),
            // Keep every drawn feature below the tool's own overlay layers
            // (vertex handles, active nodes, snap indicator, …) — those are
            // all created up front in `createSharedLayers`, RUBBER_LINE_ID
            // first, so inserting right below it puts a feature layer under
            // the whole stack regardless of when it's added. Without this, a
            // feature added after the shared layers (the normal case) drew
            // on top of them, burying "Edit vertices"'s own handles under
            // the very line they're meant to edit.
            beforeLayerId: RUBBER_LINE_ID,
        });
        this.createdDrawLayerIds.add(cfg.id);
    }

    private removeMapLayersForDrawLayer(cfg: DrawLayerConfig): void {
        this.dispatch('webmapx-remove-layer', cfg.id);
        this.dispatch('webmapx-remove-source', drawSourceId(cfg.id, cfg.type));
        if (this.adapter?.store) unregisterMapLayer(this.adapter.store, cfg.id);
        this.createdDrawLayerIds.delete(cfg.id);
    }

    private removeSharedLayers(): void {
        for (const id of [RUBBER_LINE_ID, VERTEX_LAYER_ID, DRAFT_POINT_ID, EDIT_VERT_LAYER, EDIT_MID_LAYER, SEL_VERT_LAYER, SNAP_LAYER_ID,
            MARQUEE_FILL_ID, MARQUEE_LINE_ID, MULTI_SEL_POINT_ID, ACTIVE_NODES_LAYER_ID]) {
            this.dispatch('webmapx-remove-layer', id);
        }
        for (const id of [RUBBER_SOURCE_ID, VERTEX_SOURCE_ID, DRAFT_SOURCE_ID, EDIT_VERT_SOURCE, EDIT_MID_SOURCE, SEL_VERT_SOURCE, SNAP_SOURCE_ID,
            MARQUEE_SOURCE_ID, MULTI_SEL_SOURCE_ID, ACTIVE_NODES_SOURCE_ID]) {
            this.dispatch('webmapx-remove-source', id);
        }
        this.sharedLayersCreated = false;
    }

    private removeAllMapLayers(): void {
        this.removeSharedLayers();
        for (const layer of this.drawLayers) this.removeMapLayersForDrawLayer(layer);
        this.createdDrawLayerIds.clear();
    }

    // Layers with pending deferred source refresh (layerId → RAF handle).
    private pendingSourceRefresh = new Map<string, number>();

    private refreshDrawLayerSource(layerId: string): void {
        // Coalesce multiple synchronous calls into one RAF-deferred setData so
        // terrain tessellation never blocks the current user-input frame.
        if (this.pendingSourceRefresh.has(layerId)) return;
        this.pendingSourceRefresh.set(layerId, requestAnimationFrame(() => {
            this.pendingSourceRefresh.delete(layerId);
            this.flushDrawLayerSource(layerId);
        }));
    }

    /** GeoJSON properties for a feature as sent to its layer's source — plain
     *  user properties, plus (for lines) the internal `__dashed` flag the
     *  composite's filtered solid/dashed sublayers key off (see
     *  `drawLayerSpec`'s LineString branch). */
    private outgoingProperties(f: DrawFeature): Record<string, unknown> {
        return isLineType(f.type) ? { ...f.properties, __dashed: f.dashed === true } : f.properties;
    }

    private flushDrawLayerSource(layerId: string): void {
        const features = this.features
            .filter(f => f.layerId === layerId)
            .map(f => ({
                type: 'Feature' as const,
                id: f.id,
                geometry: { type: f.type, coordinates: f.coordinates } as GeoJSON.Geometry,
                properties: this.outgoingProperties(f)
            }));
        const layerType = this.drawLayers.find(l => l.id === layerId)?.type ?? 'Polygon';
        this.dispatch('webmapx-set-source-data', {
            id: drawSourceId(layerId, layerType),
            data: { type: 'FeatureCollection', features }
        });
        // Keep sourceData in the borrowed layer's store metadata up-to-date so
        // "save layers" picks up edits even while the draw tool is active.
        const cfg = this.drawLayers.find(l => l.id === layerId);
        if (cfg?.borrowedSourceId && this.adapter?.store) {
            const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };
            this.setBorrowedLayerMetadata(cfg.borrowedSourceId, { sourceData: fc });
        }
    }

    private setBorrowedLayerMetadata(borrowedSourceId: string, patch: Record<string, unknown>): void {
        if (!this.adapter?.store) return;
        const mapLayers = this.adapter.store.getState().mapLayers ?? {};
        const [mlId, entry] = Object.entries(mapLayers)
            .find(([, e]) => (e as Record<string, unknown>).sourceId === borrowedSourceId) ?? [];
        if (mlId && entry) {
            this.adapter.store.dispatch(
                { mapLayers: { ...mapLayers, [mlId]: { ...entry, ...patch } } },
                'MAP'
            );
        }
    }

    // ─── Keyboard shortcuts ──────────────────────────────────────────────────

    /** Resolve a CSS custom property (e.g. `--webmapx-draw-selected-color`), falling back if unset. */
    private cssVar(name: string, fallback: string): string {
        const value = getComputedStyle(this).getPropertyValue(name).trim();
        return value || fallback;
    }

    private get modKey(): string {
        return /Mac|iPhone|iPad/.test(navigator.platform) ? 'Cmd' : 'Ctrl';
    }

    private isTypingTarget(e: KeyboardEvent): boolean {
        const target = e.composedPath()[0] as HTMLElement | undefined;
        const tag = target?.tagName?.toLowerCase();
        return tag === 'input' || tag === 'textarea' || tag === 'sl-input' || tag === 'sl-textarea' || target?.isContentEditable === true;
    }

    /** Only handle shortcuts when focus/event originates from the map or this draw panel. */
    private isRelevantTarget(e: KeyboardEvent): boolean {
        const path = e.composedPath();
        const mapEl = this.mapHost;
        if (path.includes(this) || (!!mapEl && path.includes(mapEl))) return true;
        // No specific element focused (focus sits on body/html) — treat as relevant
        // so shortcuts work right after a map click moves focus away from any element.
        const target = path[0];
        return target === document.body || target === document.documentElement;
    }

    private onKeyDown = (e: KeyboardEvent): void => {
        if (!this.isRelevantTarget(e)) return;

        if (e.key === 'Alt') {
            e.preventDefault();
            if (!this.altActive) {
                this.altActive = true;
                this.snapPos = null;
                this.updateRubberband();
                this.updateSnapIndicator();
            }
            return;
        }

        if (this.isTypingTarget(e)) return;
        // Undo/redo/delete only mean something inside a scoped editing session —
        // history is global, so without this guard they'd reach back into a
        // layer the panel isn't even showing anymore.
        if (this.panelView !== 'editing') return;

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            if (this.isDrawMode()) this.undoOrDraftBack(); else this.undoMove();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            if (this.isDrawMode()) this.redoOrDraftForward(); else this.redoMove();
            return;
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.draftPoints.length > 0) {
                e.preventDefault();
                this.removeLastDraftPoint();
            } else if (this.selectedHandle) {
                e.preventDefault();
                this.deleteSelectedVertex();
            } else if (this.selectedFeatureId) {
                e.preventDefault();
                this.deleteSelected();
            }
        }
    };

    private onWindowBlur = (): void => {
        if (this.altActive) {
            this.altActive = false;
            if (isVertexDrawMode(this.mode)) {
                this.updateRubberband();
            }
        }
    };

    private onKeyUp = (e: KeyboardEvent): void => {
        // Always process Alt release (regardless of focus) so a stuck altActive can't linger.
        if (e.key === 'Alt') {
            this.altActive = false;
            if (isVertexDrawMode(this.mode)) {
                this.updateRubberband();
            }
        }
    };

    /**
     * The Legend's own "Done" button, shown next to a layer this tool is
     * actively editing (`beingEdited`, driven by the same `borrowedByDrawTool`
     * metadata this tool sets) — lets a user finish editing without
     * switching over to this tool's own panel first. `mapHost` is what
     * makes this reachable at all: the Legend sends the request to the map
     * element rather than bubbling it, since the two are siblings at best and
     * the Legend may sit outside the map entirely (`map="#…"`), and the Legend
     * isn't modal (`WebmapxBaseTool`,
     * not `WebmapxModalTool`), so it can stay open alongside this tool's own
     * active editing session rather than being kicked out by it — see
     * `ToolManager.activate`, which only deactivates the previous tool for a
     * *modal* incoming one.
     *
     * A catalog-borrowed layer always already has a real name (it's the
     * catalog layer's own), so `confirmDone`'s "still has its default name"
     * guard can never apply here — that's specifically about a brand-new
     * *owned* layer, which the Legend never flags as `beingEdited`.
     */
    private onFinishEditingRequest = (e: Event): void => {
        const originalLayerId = (e as CustomEvent<{ layerId: string }>).detail?.layerId;
        if (!originalLayerId || !this.adapter) return;
        const mapLayers = this.adapter.store.getState().mapLayers ?? {};
        const match = (Object.entries(this.activeLayerIds) as [GeometryType, string][]).find(([, cfgId]) => {
            const cfg = this.drawLayers.find(l => l.id === cfgId);
            if (!cfg?.borrowedSourceId) return false;
            const owner = Object.entries(mapLayers).find(([, entry]) =>
                (entry as { sourceId?: string }).sourceId === cfg.borrowedSourceId);
            return owner?.[0] === originalLayerId;
        });
        if (!match) return;
        const [type, cfgId] = match;
        // The draw tool's own panel is already showing this exact layer's
        // editing session — reuse its own "Done" button flow verbatim.
        if (this.pickedType === type) {
            this.confirmDone();
            return;
        }
        // Otherwise this type's session is running in the background while
        // the panel shows something else entirely — pause the layer without
        // touching `selectedFeatureId` (that belongs to whatever session the
        // panel is actually showing right now, not this background one) or
        // pulling the panel over to a view the user wasn't looking at.
        const cfg = this.drawLayers.find(l => l.id === cfgId);
        if (cfg) this.pauseDrawLayer(cfg);
        delete this.activeLayerIds[type];
        void this.refreshCatalogLayerOptions();
        void this.refreshTypeCatalogCounts();
    };

    // ─── Event binding ────────────────────────────────────────────────────────

    private bindEvents(): void {
        if (!this.adapter) return;
        this.unsubClick = this.adapter.events.on('click',        (e: ClickEvent)       => this.handleClick(e));
        this.unsubMove  = this.adapter.events.on('pointer-move', (e: PointerMoveEvent) => {
            this.pendingMoveEvent = e;
            if (this.moveRafId === null) {
                this.moveRafId = requestAnimationFrame(() => {
                    this.moveRafId = null;
                    if (this.pendingMoveEvent) this.handlePointerMove(this.pendingMoveEvent);
                    this.pendingMoveEvent = null;
                });
            }
        });
        this.unsubCtx   = this.adapter.events.on('contextmenu',  (e: ContextMenuEvent) => this.handleContextMenu(e));
        this.unsubDown  = this.adapter.events.on('pointer-down', (e: PointerDownEvent) => this.handlePointerDown(e));
        this.unsubUp    = this.adapter.events.on('pointer-up',   (e: PointerUpEvent)   => this.handlePointerUp(e));
        this.unsubLeave = this.adapter.events.on('pointer-leave', () => this.handlePointerLeave());
    }

    private unbindEvents(): void {
        this.unsubClick?.(); this.unsubClick = null;
        this.unsubMove?.();  this.unsubMove  = null;
        this.unsubCtx?.();   this.unsubCtx   = null;
        this.unsubDown?.();  this.unsubDown  = null;
        this.unsubUp?.();    this.unsubUp    = null;
        this.unsubLeave?.(); this.unsubLeave = null;
    }

    // ─── Mode management ─────────────────────────────────────────────────────

    /** "New layer", "New layer (2)", "New layer (3)"… — the next unused default name for a freshly created layer of this type. */
    private nextDefaultLayerName(type: GeometryType): string {
        const taken = new Set(this.drawLayers.filter(l => l.type === type).map(l => l.name));
        if (!taken.has(DEFAULT_LAYER_NAME)) return DEFAULT_LAYER_NAME;
        let n = 2;
        while (taken.has(`${DEFAULT_LAYER_NAME} (${n})`)) n++;
        return `${DEFAULT_LAYER_NAME} (${n})`;
    }

    /**
     * "New layer" goes straight into the fully-populated editing session for
     * a fresh layer of the currently selected type — no dialog, and no
     * partially-blank state to fill in first: it gets a default name
     * (`nextDefaultLayerName`) up front, same as its default colour, so the
     * toolbar, help text and attribute editor are all usable immediately.
     * Name, color and attributes stay editable inline in the session itself.
     * The name field is selected as soon as it renders — the default name is
     * a placeholder ("Done" refuses it, see `confirmDone`), so the fastest
     * path is typing straight over it.
     */
    private async createNewLayer(): Promise<void> {
        const geoType = this.pickedType;
        if (!geoType) return;
        await this.applyLayerConfig({ ...newLayerConfig(geoType), name: this.nextDefaultLayerName(geoType) });
        if (!this.active) return;
        // A freshly created layer is empty, so 'select' mode would land on
        // nothing to select — go straight to the type's primary draw mode
        // instead (`drawModeForType`: Polygon's own leftmost button, not the
        // "Circle"/"Rectangle" sub-tools next to it).
        this.setModeInternal(drawModeForType(geoType));
        await this.updateComplete;
        this.editingLayerNameInput?.select();
    }

    /** Returns GeoJSON-backed map layers matching the given geometry type, deduplicated by source. */
    private async getEditableMapLayers(geoType: GeometryType): Promise<import('./webmapx-draw-layer-dialog').MapLayerOption[]> {
        if (!this.adapter) return [];
        const meta = this.adapter.store.getState().mapLayers ?? {};

        // One entry per source — use first layer found for label
        const seen = new Set<string>();
        const result: import('./webmapx-draw-layer-dialog').MapLayerOption[] = [];
        // Every draw layer this tool owns has its own perm-layer entry in
        // `mapLayers` under `drawMapLayerId(l.id)`, a *different* key from
        // `l.id`/`createdDrawLayerIds` (which track the active overlay
        // layer, not the resting one) — never offer one of those back as a
        // catalog option, active or paused, or a layer this tool created
        // (including a catalog copy) lists itself as still editable.
        const ownMapLayerIds = new Set(this.drawLayers.map(l => drawMapLayerId(l.id)));

        for (const [layerId, entry] of Object.entries(meta)) {
            if ((entry as any).isToolLayer) continue;
            if (this.createdDrawLayerIds.has(layerId)) continue;
            if (ownMapLayerIds.has(layerId)) continue;
            const sourceId = typeof entry.sourceId === 'string' ? entry.sourceId : null;
            if (!sourceId || seen.has(sourceId)) continue;

            const dataOrUrl = this.adapter.getSourceData(sourceId);
            if (!dataOrUrl) continue;
            const data = await this.resolveFeatureCollection(dataOrUrl);

            if (typeof dataOrUrl === 'string') {
                const geom = data?.features[0]?.geometry?.type;
                const featureGeoType = geom ? this.geometryFamilyForGeoJSONType(geom) : null;
                const layerGeoType = this.geometryFamilyForLayerType(entry.layerType);
                if ((featureGeoType ?? layerGeoType) !== geoType) continue;

                seen.add(sourceId);
                result.push({
                    layerId,
                    sourceId,
                    label: (entry as any).label ?? layerId,
                    properties: (entry as any).properties ?? (data ? this.inferPropertyDefs(data) : undefined),
                    allowedAttributes: (entry as any).attributes?.allowedAttributes ?? undefined,
                });
                continue;
            }

            const geom = dataOrUrl.features[0]?.geometry?.type;
            const featureGeoType = geom ? this.geometryFamilyForGeoJSONType(geom) : null;
            const layerGeoType = this.geometryFamilyForLayerType(entry.layerType);
            if ((featureGeoType ?? layerGeoType) !== geoType) continue;

            seen.add(sourceId);
            result.push({
                layerId,
                sourceId,
                label: (entry as any).label ?? layerId,
                properties: (entry as any).properties ?? this.inferPropertyDefs(dataOrUrl),
                allowedAttributes: (entry as any).attributes?.allowedAttributes ?? undefined,
            });
        }
        return result;
    }

    private async resolveFeatureCollection(dataOrUrl: GeoJSON.FeatureCollection | string): Promise<GeoJSON.FeatureCollection | null> {
        if (typeof dataOrUrl !== 'string') return dataOrUrl;
        try {
            const res = await fetch(dataOrUrl);
            if (!res.ok) return null;
            return await res.json() as GeoJSON.FeatureCollection;
        } catch (_) {
            return null;
        }
    }

    private geometryFamilyForGeoJSONType(type: GeoJSON.Geometry['type']): GeometryType | null {
        return type === 'Point' || type === 'MultiPoint' ? 'Point' :
            type === 'LineString' || type === 'MultiLineString' ? 'LineString' :
            type === 'Polygon' || type === 'MultiPolygon' ? 'Polygon' : null;
    }

    private geometryFamilyForLayerType(type: unknown): GeometryType | null {
        return type === 'circle' ? 'Point' :
            type === 'line' ? 'LineString' :
            type === 'fill' ? 'Polygon' : null;
    }

    private inferPropertyDefs(data: GeoJSON.FeatureCollection): import('./webmapx-draw-layer-dialog').PropertyDef[] {
        const props = data.features.find(f => f.properties && Object.keys(f.properties).length > 0)?.properties;
        if (!props) {
            return [
                { name: 'id', type: 'number' },
                { name: 'name', type: 'string' },
            ];
        }

        return Object.entries(props)
            // `__dashed` (see `outgoingProperties`) is an internal flag baked
            // into the source's GeoJSON, not a real attribute — inferring a
            // schema from imported data must not surface it as one.
            .filter(([name]) => !name.startsWith('__'))
            .map(([name, value]) => ({
                name,
                type: typeof value === 'number' ? 'number' as const : 'string' as const
            }));
    }

    private isSelectMode(mode: DrawMode = this.mode): boolean {
        return mode === 'select' || mode === 'select-rect' || mode === 'select-lasso';
    }

    private isEditMode(mode: DrawMode = this.mode): boolean {
        return mode === 'edit-move' || mode === 'edit-vertices';
    }

    private isDrawMode(mode: DrawMode = this.mode): boolean {
        return mode === 'draw-point' || mode === 'draw-line' || mode === 'draw-line-dashed' ||
            mode === 'draw-polygon' || mode === 'draw-circle' || mode === 'draw-rectangle';
    }

    /** Edit's three sub-modes (Move, Edit vertices, Attributes) all focus on
     *  one feature at a time and share that focus with each other — see the
     *  carry-over logic in `setModeInternal`. */
    private isSingleFeatureFocusMode(mode: DrawMode = this.mode): boolean {
        return mode === 'edit-move' || mode === 'edit-vertices' || mode === 'attributes';
    }

    /**
     * Whether `selectedFeatureId` should survive a mode switch *from*
     * `prevMode` into one of Edit's single-feature-focus modes: either
     * hopping between Move/Edit vertices/Attributes on the same feature
     * (no need to re-pick it each time), or coming straight from finishing
     * a draw (so a freshly-drawn feature can be reshaped/moved/edited
     * immediately). Coming from anywhere else — Delete, Tools, or a draw-*
     * mode with nothing finished yet — has no feature worth carrying over.
     */
    private carriesFocusInto(prevMode: DrawMode): boolean {
        return this.isSingleFeatureFocusMode(prevMode) ||
            (this.isDrawMode(prevMode) && this.selectedFeatureId !== null);
    }

    private setModeInternal(mode: DrawMode): void {
        if (this.circleDraft) {
            this.circleDraft = null;
            this.adapter?.setPanEnabled(true);
        }
        if (this.rectDraft) {
            this.rectDraft = null;
            this.adapter?.setPanEnabled(true);
        }
        if (this.rectSelectDraft) {
            this.rectSelectDraft = null;
            this.updateMarquee(null);
            this.adapter?.setPanEnabled(true);
        }
        if (this.lassoSelectDraft) {
            this.lassoSelectDraft = null;
            this.updateMarquee(null);
            this.adapter?.setPanEnabled(true);
        }
        const prevMode = this.mode;
        this.mode = mode;
        this.draftPoints = [];
        this.cursorPos = null;
        this.snapPos = null;
        this.lastCursorPx = null;
        this.updateRubberband();

        // Leaving Draw entirely (not just switching draw-point/-line/-polygon
        // among themselves) closes that drawing session's undo history — its
        // Undo button would otherwise keep showing enabled from a stale
        // drawHistory entry after coming back from Select/Edit/Attributes,
        // even once the drawn feature has since been deleted there (a
        // different history stack — see `pushHistory`), where clicking it
        // does nothing (the feature's already gone) instead of the delete
        // the user actually wants undone.
        if (this.isDrawMode(prevMode) && !this.isDrawMode(mode)) {
            this.drawHistory = [];
            this.drawHistoryIndex = -1;
            this.draftRedoStack = [];
        }

        switch (mode) {
            case 'select':
            case 'select-rect':
            case 'select-lasso':
                this.adapter?.setDoubleClickZoomEnabled(true);
                this.adapter?.setCursor(mode === 'select' ? '' : 'crosshair');
                // The selection itself (what the trash button deletes) stays
                // active across the three Delete sub-modes — switching from
                // rectangle to click mid-session doesn't throw away what's
                // already picked. Only reset coming from somewhere else
                // entirely (a draw-* or edit-* mode), where there's nothing
                // of Delete's to preserve.
                if (!this.isSelectMode(prevMode)) {
                    this.selectedFeatureId = null;
                    this.selectedFeatureIds = [];
                    this.hoveredFeatureId = null;
                    this.editState = 'none';
                    this.editHandles = [];
                    this.updateSelectedSource();
                    this.updateMultiSelectSource();
                    this.updateEditHandles();
                }
                this.helpText = mode === 'select' ? 'Click a feature to delete it.'
                    : mode === 'select-rect' ? 'Drag a rectangle to delete the features inside it.'
                    : 'Draw a free-hand shape to delete the features inside it.';
                break;
            case 'attributes':
                this.adapter?.setDoubleClickZoomEnabled(true);
                this.adapter?.setCursor('');
                // Single-feature only, like plain Select — but a separate mode
                // (not folded into `isSelectMode`) so Select's own history/
                // delete cluster doesn't light up while this is active. Hover
                // previews (see `handlePointerMove`/`hoveredFeatureId`); a
                // click pins, surviving the pointer moving away — otherwise
                // there was no way to reach an attribute input with a mouse.
                // A feature already in focus carries over — see the shared
                // comment on the `edit-move`/`edit-vertices` case below.
                if (!this.carriesFocusInto(prevMode)) {
                    this.selectedFeatureId = null;
                }
                this.selectedFeatureIds = this.selectedFeatureId ? [this.selectedFeatureId] : [];
                this.hoveredFeatureId = null;
                this.editState = 'none';
                this.editHandles = [];
                this.updateSelectedSource();
                this.updateMultiSelectSource();
                this.updateEditHandles();
                this.helpText = 'Hover a feature to preview it, then click to view or edit its attributes.';
                if (this.selectedFeatureId) {
                    // A carried-over selection means there's already a real
                    // feature to edit the instant this mode is picked —
                    // focus its first editable value so the input's own blue
                    // focus ring points straight at where to start typing,
                    // instead of leaving the user to go hunt for it. Waits
                    // for the panel to actually reflect the carried-over
                    // selection first, in case it wasn't already showing.
                    void this.updateComplete.then(() => this.focusFirstAttributeValueInput());
                }
                break;
            case 'edit-move':
            case 'edit-vertices': {
                this.adapter?.setDoubleClickZoomEnabled(true);
                this.adapter?.setCursor('');
                // Both sub-modes are click-pinned (see handlePointerDown) so a
                // feature survives the pointer moving away — otherwise there
                // was no way to reach the panel's undo/redo or delete-vertex
                // button with a mouse. Grabbing and dragging still works
                // directly on whatever's under the cursor either way, pinned
                // or not. A feature already in focus carries over (see
                // `carriesFocusInto`) — draw a shape and immediately reshape
                // or move it, or hop between Move/Edit vertices/Attributes on
                // the same feature without re-picking it each time. Select's
                // multi-selection is dropped regardless — it's what Select's
                // own trash button acts on, and Edit has no use for it.
                if (!this.carriesFocusInto(prevMode)) {
                    this.selectedFeatureId = null;
                }
                this.selectedFeatureIds = [];
                this.hoveredFeatureId = null;
                this.editHandles = [];
                const carriedFeature = this.selectedFeatureId ? this.features.find(f => f.id === this.selectedFeatureId) : null;
                this.editState = !carriedFeature ? 'none'
                    : mode === 'edit-vertices' ? 'editing'
                    : isPointType(carriedFeature.type) ? 'none' : 'selected';
                this.updateSelectedSource();
                this.updateMultiSelectSource();
                this.updateEditHandles();
                this.helpText = mode === 'edit-move'
                    ? 'Click a feature to select it, or drag it directly to move it.'
                    : 'Click a feature to edit its points — drag one to reshape it, or select one and press Delete to remove it.';
                break;
            }
            case 'draw-point':
            case 'draw-line':
            case 'draw-line-dashed':
            case 'draw-polygon':
            case 'draw-circle':
            case 'draw-rectangle':
                this.adapter?.setDoubleClickZoomEnabled(false);
                this.editState = 'none';
                this.editHandles = [];
                this.selectedFeatureId = null;
                this.selectedFeatureIds = [];
                this.updateEditHandles();
                this.updateSelectedSource();
                this.updateMultiSelectSource();
                this.adapter?.setCursor('crosshair');
                this.helpText = this.mode === 'draw-point' ? 'Click to place a point.'
                    : this.mode === 'draw-line' || this.mode === 'draw-line-dashed' ? 'Click to add vertices. Right-click or double-click to finish.'
                    : this.mode === 'draw-circle' ? 'Click and drag to draw a circle.'
                    : this.mode === 'draw-rectangle' ? 'Click and drag to draw a rectangle.'
                    : 'Click to add vertices. Click first point or double-click to close.';
                break;
        }
    }

    /**
     * Upserts a layer config and lands in its editing session — used by both
     * "Add new" (a fresh, unnamed `newLayerConfig`) and "Edit" on a
     * catalog layer (`startEditingCatalogLayer`, already named and sourced).
     * Neither goes through a dialog: name/color/attributes are all editable
     * inline in the session itself (inline name+color, "Add/Delete
     * attributes" popup), so there's nothing left for a popup to ask for
     * up front.
     *
     * `seedData`, when given, stands in for the fresh (empty) perm layer's
     * own source at the "load starting features" step below — this is the
     * only piece `startEditingCatalogLayer` needs to turn "new, empty owned
     * layer" into "new owned layer pre-populated with a copy of the catalog
     * layer's current data", without duplicating everything else this
     * method already does (perm layer creation, property-schema inference,
     * `ownsPermLayer`/`ActiveLayerIds` bookkeeping).
     */
    private async applyLayerConfig(initialCfg: DrawLayerConfig, seedData?: GeoJSON.FeatureCollection | string): Promise<void> {
        let cfg = initialCfg;

        // Pause the previous active layer for this type (at most one *editing* per
        // type — but the paused one stays listed, ready to resume, instead of
        // being destroyed just because a sibling layer took its place).
        const prevActive = this.activeLayerIds[cfg.type];
        if (prevActive && prevActive !== cfg.id) {
            const prev = this.drawLayers.find(l => l.id === prevActive);
            if (prev) this.pauseDrawLayer(prev);
        }

        // Upsert layer config
        const existing = this.drawLayers.findIndex(l => l.id === cfg.id);
        if (existing >= 0) {
            this.drawLayers = this.drawLayers.map((l, i) => i === existing ? cfg : l);
        } else {
            // For new layers: create a permanent grayish map layer first, then borrow it
            if (!cfg.borrowedSourceId) {
                cfg = { ...cfg, borrowedSourceId: this.createPermLayer(cfg) };
                // Tracked separately from `drawLayers` so the legend-deletion
                // reconciliation knows this layer has a resting-state map
                // entry to watch — a catalog-borrowed layer's original entry
                // isn't ours to watch the same way.
                this.ownsPermLayer.add(cfg.id);
            }
            this.drawLayers = [...this.drawLayers, cfg];
            this.addMapLayersForDrawLayer(cfg);

            // Borrow: load features from the source (or the given snapshot), then blank it
            if (cfg.borrowedSourceId && this.adapter) {
                const dataOrUrl = seedData ?? this.adapter.getSourceData(cfg.borrowedSourceId);
                const data = dataOrUrl ? await this.resolveFeatureCollection(dataOrUrl) : null;

                if (data) {
                    const importedFeatures: DrawFeature[] = [];
                    for (const f of data.features) {
                        if (!f.geometry) continue;
                        if (!isSupportedDrawGeometryType(f.geometry.type)) continue;
                        const props = { ...f.properties };
                        // `__dashed` lives in the source's raw GeoJSON (see
                        // `outgoingProperties`) but isn't a real attribute —
                        // pull it back out into its own field rather than
                        // importing it into the feature's user-facing
                        // properties, or a paused-then-resumed dashed line
                        // reverts to solid and the schema picks up a bogus
                        // "__dashed" column.
                        const dashed = props.__dashed === true;
                        delete props.__dashed;
                        importedFeatures.push({
                            id: this.newId(),
                            layerId: cfg.id,
                            type: f.geometry.type,
                            coordinates: (f.geometry as any).coordinates,
                            properties: props,
                            dashed
                        });
                    }

                    this.features = [...this.features, ...importedFeatures];

                    // Infer attribute schema from source data if schema is still default
                    if (cfg.properties.length <= 2) {
                        const inferred = this.inferPropertyDefs(data);
                        cfg = { ...cfg, properties: inferred };
                        this.drawLayers = this.drawLayers.map(l => l.id === cfg.id ? cfg : l);
                    }
                }

                if (this.active) {
                    // Blank the source — all engine layers using it go empty automatically
                    const src = this.adapter.getSource(cfg.borrowedSourceId!);
                    src?.setData({ type: 'FeatureCollection', features: [] });
                    this.setBorrowedLayerMetadata(cfg.borrowedSourceId!, { borrowedByDrawTool: true });
                } else {
                    // The panel was closed while the data above loaded. Closing
                    // has already given every layer back, and will not run
                    // again, so give this one back too now that its features
                    // are here, rather than blanking a layer nothing is editing.
                    // Reopening the tool resumes it like any other.
                    this.restoreBorrowedLayer(cfg);
                }
            }
        }

        this.activeLayerIds[cfg.type] = cfg.id;
        this.refreshDrawLayerSource(cfg.id);
        this.syncLayerPropertiesToStore(cfg.id, cfg.properties);

        if (this.pendingMode) {
            // A mode sets the map's cursor and double-click zoom: not while
            // closed (reopening starts in 'select' anyway).
            if (this.active) this.setModeInternal(this.pendingMode);
            this.pendingMode = null;
        }
        this.pickedType = cfg.type;
        this.panelView = 'editing';
        this.addingAttribute = false;
        this.newAttrName = '';
        this.newAttrType = '';
        this.layerNameInvalid = false;
        this.layerNameDraft = null;
        this.removedAttributeStack = [];
        this.removedAttributeRedoStack = [];
        this.cancelRenameAttribute();
    }

    private restoreBorrowedLayer(cfg: DrawLayerConfig): void {
        if (!cfg.borrowedSourceId || !this.adapter) return;
        // Write edited features back to the original source — all engine layers update automatically
        const features = this.features
            .filter(f => f.layerId === cfg.id)
            .map(f => ({
                type: 'Feature' as const,
                geometry: { type: f.type, coordinates: f.coordinates } as GeoJSON.Geometry,
                properties: this.outgoingProperties(f)
            }));
        const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };
        this.adapter.getSource(cfg.borrowedSourceId)?.setData(fc);
        this.setBorrowedLayerMetadata(cfg.borrowedSourceId, { borrowedByDrawTool: false, sourceData: fc });
    }

    private createPermLayer(cfg: DrawLayerConfig): string {
        const mapLayerId = drawMapLayerId(cfg.id);
        if (cfg.type === 'Point') {
            this.dispatch('webmapx-add-source', {
                id: drawSourceId(mapLayerId, cfg.type),
                config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
            });
        }
        this.dispatch('webmapx-add-layer', {
            ...drawLayerSpec(mapLayerId, cfg, cfg.color, {
                label: cfg.name,
                legendRole: 'overlay',
                properties: cfg.properties,
                borrowedByDrawTool: true,
                // A brand-new layer has no name yet ("Add new" skips straight to the
                // editing session) — keep it out of the legend until it does, rather
                // than showing an unnamed "layer-172..." row the moment it's created.
                // `updateActiveLayerName` reveals it once a name is actually given.
                // A layer that already has a real name at creation time (a catalog
                // copy, named after the original) has nothing to reveal later — that
                // rename event never fires — so show it immediately instead.
                hideFromLegend: isDefaultLayerName(cfg.name),
            }),
            // Same reasoning as `addMapLayersForDrawLayer`: stay below the
            // tool's own overlay layers, not on top of them.
            beforeLayerId: RUBBER_LINE_ID,
        });
        return drawSourceId(mapLayerId, cfg.type);
    }

    private releaseBorrowedLayer(cfg: DrawLayerConfig): void {
        if (!cfg.borrowedSourceId) return;
        this.restoreBorrowedLayer(cfg);
        this.removeMapLayersForDrawLayer(cfg);
        this.features = this.features.filter(f => f.layerId !== cfg.id);
        this.drawLayers = this.drawLayers.filter(l => l.id !== cfg.id);
        for (const [type, layerId] of Object.entries(this.activeLayerIds) as [GeometryType, string][]) {
            if (layerId === cfg.id) delete this.activeLayerIds[type];
        }
    }

    private suspendDrawLayerFromMap(cfg: DrawLayerConfig): void {
        this.dispatch('webmapx-remove-layer', cfg.id);
        this.dispatch('webmapx-remove-source', drawSourceId(cfg.id, cfg.type));
        if (this.adapter?.store) unregisterMapLayer(this.adapter.store, cfg.id);
        this.createdDrawLayerIds.delete(cfg.id);
    }

    private releaseLayer(cfg: DrawLayerConfig): void {
        // For an owned (non-catalog) layer, `cfg.borrowedSourceId` names the
        // perm layer's own source, so `releaseBorrowedLayer` below only ever
        // removes the active *overlay* (`cfg.id`) — the perm/resting layer
        // (`${cfg.id}-map`, what the legend actually lists) has to be torn
        // down here explicitly, or "Remove layer" leaves it behind forever.
        // A catalog-borrowed layer has no perm layer of its own to remove —
        // its original map entry isn't this tool's to delete.
        if (this.ownsPermLayer.has(cfg.id)) this.removePermLayer(cfg);
        this.releaseBorrowedLayer(cfg);
        this.pausedLayerIds.delete(cfg.id);
        this.ownsPermLayer.delete(cfg.id);
        this.confirmedRestingLayerIds.delete(cfg.id);
        // A released catalog-borrowed layer becomes available to borrow
        // again — both the type-picker's per-type counts and this type's
        // own "From the catalog" list need to catch up, or they keep counting
        // it as still borrowed.
        void this.refreshCatalogLayerOptions();
        void this.refreshTypeCatalogCounts();
    }

    private removePermLayer(cfg: DrawLayerConfig): void {
        const mapLayerId = drawMapLayerId(cfg.id);
        this.dispatch('webmapx-remove-layer', mapLayerId);
        this.dispatch('webmapx-remove-source', drawSourceId(mapLayerId, cfg.type));
        if (this.adapter?.store) unregisterMapLayer(this.adapter.store, mapLayerId);
    }

    /**
     * Take one layer off the map without losing it — "Stop editing" and a
     * same-type "Add new" both use this instead of `releaseLayer`, so a
     * second Point layer no longer destroys the first: it just steps aside
     * until "Edit" calls `resumeDrawLayer` on it again.
     */
    private pauseDrawLayer(cfg: DrawLayerConfig): void {
        if (cfg.borrowedSourceId) this.restoreBorrowedLayer(cfg);
        this.suspendDrawLayerFromMap(cfg);
        this.pausedLayerIds.add(cfg.id);
    }

    private resumeDrawLayer(cfg: DrawLayerConfig): void {
        this.pausedLayerIds.delete(cfg.id);
        if (!this.createdDrawLayerIds.has(cfg.id)) {
            this.addMapLayersForDrawLayer(cfg);
            this.refreshDrawLayerSource(cfg.id);
        }
        if (cfg.borrowedSourceId && this.adapter) {
            this.adapter.getSource(cfg.borrowedSourceId)?.setData({ type: 'FeatureCollection', features: [] });
            this.setBorrowedLayerMetadata(cfg.borrowedSourceId, { borrowedByDrawTool: true });
        }
    }

    /**
     * Notices when a layer this tool created has been deleted from outside
     * it — the legend's own trash icon, most likely — and forgets it the
     * same way the layer picker's own remove button does, rather than
     * leaving a ghost entry with nothing left on the map to resume.
     *
     * Only layers from `ownsPermLayer` are watched: a catalog-borrowed
     * layer's original map entry isn't something this tool created, so its
     * removal is a different (unhandled) scenario, not this one.
     *
     * The resting layer (`drawMapLayerId`) is the one the legend actually
     * shows and can delete — it's created once and otherwise stays on the
     * map for the layer's whole life, so its absence is a reliable "this was
     * deleted" signal, *except* right after creation: `webmapx-add-layer` is
     * handled asynchronously (`webmapx-map.ts` awaits `adapter.addLayer`),
     * while `store.subscribe` fires synchronously on every dispatch —
     * including unrelated ones (pointer moves, etc.) — so this can run
     * before the brand-new layer has registered even once. Gating on
     * `confirmedRestingLayerIds` (only set once the layer has actually been
     * observed present) tells "still being created" apart from "deleted".
     *
     * A *catalog* layer's own entry isn't watched the same way above (it's
     * not this tool's to delete), but its "From the catalog" row and the
     * type-picker's per-type counts still read straight from `mapLayers` —
     * so deleting it via the legend's trash icon (not just hiding it) has to
     * refresh those too, or the removed layer keeps showing as editable.
     * Gated on the map layer *id set* changing (not every dispatch) since
     * `getEditableMapLayers` re-reads every layer's source data.
     */
    private reconcileExternallyDeletedLayers(state: { mapLayers?: Record<string, unknown> }): void {
        const mapLayers = state.mapLayers ?? {};
        for (const cfg of [...this.drawLayers]) {
            if (!this.ownsPermLayer.has(cfg.id)) continue;
            if (mapLayers[drawMapLayerId(cfg.id)]) {
                this.confirmedRestingLayerIds.add(cfg.id);
                continue;
            }
            if (!this.confirmedRestingLayerIds.has(cfg.id)) continue;
            this.handleExternallyDeletedLayer(cfg);
        }

        const idsKey = Object.keys(mapLayers).sort().join(',');
        if (idsKey !== this.lastMapLayerIdsKey) {
            this.lastMapLayerIdsKey = idsKey;
            void this.refreshCatalogLayerOptions();
            void this.refreshTypeCatalogCounts();
        }
    }

    private handleExternallyDeletedLayer(cfg: DrawLayerConfig): void {
        const wasEditingThis = this.panelView === 'editing' && this.pickedType === cfg.type
            && this.activeLayerIds[cfg.type] === cfg.id;
        this.releaseLayer(cfg);
        if (wasEditingThis) {
            this.selectedFeatureId = null;
            this.setModeInternal('select');
            this.panelView = 'layers';
        }
    }

    // ─── Panel navigation ────────────────────────────────────────────────────

    private selectType(type: GeometryType): void {
        this.pickedType = type;
        this.panelView = 'layers';
        void this.refreshCatalogLayerOptions();
    }

    private async refreshTypeCatalogCounts(): Promise<void> {
        if (!this.adapter) { this.catalogLayerCounts = {}; return; }
        const types: GeometryType[] = ['Point', 'LineString', 'Polygon'];
        const results = await Promise.all(types.map(t => this.getEditableMapLayers(t)));
        const counts: Partial<Record<GeometryType, number>> = {};
        types.forEach((t, i) => { counts[t] = results[i].length; });
        this.catalogLayerCounts = counts;
    }

    private async refreshCatalogLayerOptions(): Promise<void> {
        const type = this.pickedType;
        if (!type || !this.adapter) { this.catalogLayerOptions = []; return; }
        const options = await this.getEditableMapLayers(type);
        // The picked type (or the tool) may have moved on while this awaited.
        if (this.pickedType === type) this.catalogLayerOptions = options;
    }

    private cancelEditCatalogLayer(): void {
        this.pendingCatalogEditOption = null;
    }

    /**
     * "Create a copy and edit" on the confirmation dialog — makes an
     * independent, owned copy of a catalog layer rather than editing it in
     * place. The original itself is never modified: its data is only read
     * once, as a starting snapshot for the copy, and the original is then
     * hidden (not removed) so there's no visual duplicate on the map while
     * both exist — `setLayerVisibility` mirrors that into the store itself,
     * which is what the Legend's own eye icon reads. It deliberately stays
     * hidden after "Done" too (no auto-restore): showing it again is the
     * same one click either way, and auto-restoring would need the user to
     * re-discover it was ever hidden in the first place.
     */
    private startEditingCatalogLayer(option: import('./webmapx-draw-layer-dialog').MapLayerOption): void {
        this.pendingCatalogEditOption = null;
        if (!this.pickedType || !this.adapter) return;
        const type = this.pickedType;
        const base = newLayerConfig(type);
        const cfg: DrawLayerConfig = {
            ...base,
            // Not "<name> (copy)": the Legend's `splitLayerTitle` treats a
            // trailing "(word)" as a technical qualifier (e.g. "… (xyz)")
            // and drops it from the displayed name entirely, so a suffix
            // form would show correctly in this panel but silently lose
            // "(copy)" in the Legend.
            name: `Copy of ${option.label}`,
            properties: option.properties?.map(p => ({ ...p })) ?? base.properties,
            // No borrowedSourceId: `applyLayerConfig` then treats this as a
            // brand-new *owned* layer (its own perm layer), not a borrow
            // from the catalog source — seedData below is what gives that
            // otherwise-empty layer the copy's starting content instead.
        };
        const seedData = this.adapter.getSourceData(option.sourceId) ?? undefined;
        this.adapter.setLayerVisibility(option.layerId, false);
        // Unlike "New layer" (empty, so straight to drawing), this layer
        // already has features on the map — land in 'select' so the first
        // thing the user can do is click one, same as "Edit" on a draw layer
        // (`startEditingLayer`).
        this.pendingMode = 'select';
        void this.applyLayerConfig(cfg, seedData);
    }

    private startEditingLayer(cfg: DrawLayerConfig): void {
        this.resumeDrawLayer(cfg);
        this.activeLayerIds[cfg.type] = cfg.id;
        this.pickedType = cfg.type;
        this.setModeInternal('select');
        this.panelView = 'editing';
        this.addingAttribute = false;
        this.newAttrName = '';
        this.newAttrType = '';
        this.layerNameInvalid = false;
        this.layerNameDraft = null;
        this.removedAttributeStack = [];
        this.removedAttributeRedoStack = [];
        this.cancelRenameAttribute();
    }

    private stopEditingCurrent(): void {
        if (!this.pickedType) return;
        const layerId = this.activeLayerIds[this.pickedType];
        const cfg = layerId ? this.drawLayers.find(l => l.id === layerId) : undefined;
        this.selectedFeatureId = null;
        this.setModeInternal('select');
        this.updateSelectedSource();
        if (cfg) this.pauseDrawLayer(cfg);
        delete this.activeLayerIds[this.pickedType];
        this.panelView = 'layers';
        void this.refreshCatalogLayerOptions();
        // A catalog-borrowed layer just paused here still counts toward this
        // type's `drawLayers` count (below) — but until now it was ALSO
        // still counted as "available to borrow" in the type-picker's
        // per-type totals, computed once on activation and never refreshed,
        // so pressing Done double-counted it (own paused entry + stale
        // catalog count) instead of leaving the type's total unchanged.
        void this.refreshTypeCatalogCounts();
    }

    /**
     * "Done" refuses to leave while the layer still has its auto-assigned
     * default name (`isDefaultLayerName`): highlights the name field instead
     * and selects its text so the user can just type over it. A layer opened
     * via "Edit" already has a real name and is never blocked here.
     */
    private confirmDone(): void {
        const type = this.pickedType;
        const layerId = type ? this.activeLayerIds[type] : undefined;
        let layer = layerId ? this.drawLayers.find(l => l.id === layerId) : undefined;
        // Typing a new name and pressing Done — without also clicking the
        // name field's own check button first — is just as valid a rename
        // as any other, so commit a pending draft before judging whether
        // the name still needs one.
        if (layer && this.layerNameDraft !== null) {
            this.commitLayerNameEdit(layer);
            layer = this.drawLayers.find(l => l.id === layerId);
        }
        if (layer && isDefaultLayerName(layer.name)) {
            this.layerNameInvalid = true;
            this.editingLayerNameInput?.select();
            return;
        }
        this.layerNameInvalid = false;
        this.showDrawIntro = false;
        this.stopEditingCurrent();
    }

    /**
     * The topmost still-*empty* editable field in the "Attribute values"
     * section — pointing the focus ring at an already-filled-in value isn't
     * "where to edit" so much as "something to overwrite", and a freshly
     * pinned feature usually has more blanks left than a reason to revisit
     * what's already there. Read-only rows (id, computed geometry stats)
     * render as a plain span, not an `sl-input`, so the query already skips
     * past them on its own.
     *
     * When every field already has a value, there's no empty one to jump
     * to — so this falls back to whichever attribute was last focused
     * (`lastFocusedAttributeName`, kept current by each input's `sl-focus`
     * handler as well as by this method itself), and only to the very first
     * field if that attribute doesn't exist on this feature's layer either.
     * That's what makes stepping through a run of already-filled-in
     * features to touch up one particular field (e.g. "height") keep
     * landing on that field instead of always snapping back to the first
     * one.
     *
     * Called both when Attributes mode is first picked with a feature
     * already in focus (`setModeInternal`) and whenever a click switches
     * which feature is pinned while already in that mode (`setSelection`),
     * so the focus ring keeps pointing at wherever editing would actually
     * start.
     */
    private focusFirstAttributeValueInput(): void {
        const inputs = this.shadowRoot?.querySelectorAll<SlInput>('.prop-row sl-input');
        if (!inputs || inputs.length === 0) return;
        const firstEmpty = Array.from(inputs).find(input => !input.value);
        const remembered = this.lastFocusedAttributeName
            ? Array.from(inputs).find(input => input.closest<HTMLElement>('.prop-row')?.dataset.attrName === this.lastFocusedAttributeName)
            : undefined;
        const target = firstEmpty ?? remembered ?? inputs[0];
        target.focus();
        this.lastFocusedAttributeName = target.closest<HTMLElement>('.prop-row')?.dataset.attrName ?? null;
    }

    // ─── Inline layer configuration (editing session) ───────────────────────
    // Name/color/attributes used to live only in the one-shot create/borrow
    // dialog, so there was no way back to them once a layer existed. They now
    // live in the editing session itself, so leaving and returning still has
    // them at hand — no dialog to reopen, nothing that "only shows once".

    private updateActiveLayerName(cfg: DrawLayerConfig, name: string): void {
        const trimmed = name.trim();
        if (!trimmed || trimmed === cfg.name) return;
        // A brand-new layer starts with a default name ("New layer") and
        // `hideFromLegend: true` (see `createPermLayer`) — this is the
        // moment it earns a place in the legend, the first time it gets a
        // real one.
        const isFirstName = isDefaultLayerName(cfg.name) && this.ownsPermLayer.has(cfg.id);
        this.drawLayers = this.drawLayers.map(l => l.id === cfg.id ? { ...l, name: trimmed } : l);
        this.layerNameInvalid = false;
        // The perm/borrowed layer's own label can outlive this editing session
        // (it's what the legend would show once released) — keep it in sync.
        if (cfg.borrowedSourceId) {
            this.setBorrowedLayerMetadata(cfg.borrowedSourceId, {
                label: trimmed,
                ...(isFirstName ? { hideFromLegend: false } : {}),
            });
        }
        if (isFirstName) {
            // Surface the legend so the user sees the layer they just named
            // land in it — a no-op if it's already open.
            this.dispatch('webmapx-tool-select', { toolId: 'layerOverview', previousToolId: null });
            // A brand-new layer has nothing to select yet, so landing in
            // "select" mode right after naming it just sits there doing
            // nothing useful — jump straight to drawing. `drawModeForType`
            // picks the type's primary draw tool (Polygon's own leftmost
            // button, not the "Circle" sub-tool next to it).
            this.setModeInternal(drawModeForType(cfg.type));
        }
    }

    private layerNameDraftValid(): boolean {
        return (this.layerNameDraft ?? '').trim().length > 0;
    }

    /** Check button (or Enter) on the layer name field — same confirm step as `commitRenameAttribute`. */
    private commitLayerNameEdit(cfg: DrawLayerConfig): void {
        if (this.layerNameDraft === null || !this.layerNameDraftValid()) return;
        this.updateActiveLayerName(cfg, this.layerNameDraft);
        this.layerNameDraft = null;
    }

    /** Cross button (or Escape) on the layer name field — discards the draft, same as `cancelRenameAttribute`. */
    private cancelLayerNameEdit(): void {
        this.layerNameDraft = null;
    }

    /**
     * The colour to actually paint/preview a draw layer with — read live off
     * the perm/resting layer's own paint (`store.mapLayers`) rather than
     * `cfg.color`, which is only ever the colour it was *created* with.
     * Styling is now exclusively a Legend affair (its per-layer style editor
     * calls `adapter.updateLayerStyle`, which mirrors straight into this same
     * `mapLayers` entry) — without this, a colour picked in the Legend would
     * only show up on the resting layer, and reappear reverted to `cfg.color`
     * the moment the layer's overlay is rebuilt (new layer, or resuming a
     * paused one via `addMapLayersForDrawLayer`). Falls back to `cfg.color`
     * when nothing's been registered yet (brand new layer) or the paint
     * holds something other than a plain colour (e.g. a data-driven
     * expression) — this preview only ever shows a flat swatch.
     */
    private currentDrawLayerColor(cfg: DrawLayerConfig): string {
        const entry = this.adapter?.store.getState().mapLayers?.[drawMapLayerId(cfg.id)] as
            { paint?: Record<string, unknown>; sublayers?: { id?: string; paint?: Record<string, unknown> }[] } | undefined;
        if (!entry) return cfg.color;

        if (cfg.type === 'Point') {
            const c = entry.paint?.['circle-color'];
            return typeof c === 'string' ? c : cfg.color;
        }

        const mapLayerId = drawMapLayerId(cfg.id);
        const colorKey = cfg.type === 'Polygon' ? 'fill-color' : 'line-color';
        const subId = cfg.type === 'Polygon' ? `${mapLayerId}-fill` : `${mapLayerId}-solid`;
        const c = entry.sublayers?.find(s => s.id === subId)?.paint?.[colorKey];
        return typeof c === 'string' ? c : cfg.color;
    }

    /**
     * Mirrors a layer's current property schema into its perm layer's store
     * entry — read by the info tool and the legend, neither of which knows
     * about `drawLayers`. `applyLayerConfig` does this once, at the moment a
     * layer's editing session opens; every later edit to the schema (add,
     * remove, rename, toggle an auto attribute) has to repeat it itself, or
     * the store keeps showing whatever schema was there when editing began —
     * a `create-time`/`update-time` attribute added mid-session used to
     * render as a raw epoch number in the info tool for exactly this reason.
     */
    private syncLayerPropertiesToStore(layerId: string, properties: PropertyDef[]): void {
        const mapLayerId = drawMapLayerId(layerId);
        if (!this.adapter?.store) return;
        const current = this.adapter.store.getState().mapLayers ?? {};
        const entry = current[mapLayerId];
        if (!entry) return;
        this.adapter.store.dispatch({
            mapLayers: { ...current, [mapLayerId]: { ...entry, properties } }
        }, 'MAP');
    }

    private addActiveLayerProperty(cfg: DrawLayerConfig): void {
        const name = this.newAttrName.trim();
        if (!name || !this.newAttrType || cfg.properties.some(p => p.name === name)) return;
        const properties = [...cfg.properties, { name, type: this.newAttrType }];
        this.drawLayers = this.drawLayers.map(l => l.id === cfg.id ? { ...l, properties } : l);
        this.syncLayerPropertiesToStore(cfg.id, properties);
        this.cancelAddAttribute();
        this.cancelRenameAttribute();
        // New attributes land at the bottom of the list — scroll to it so a
        // long list (already scrolled elsewhere) doesn't hide the very row
        // just added. Waits for the re-render triggered by the drawLayers
        // update above, since the new row isn't in the DOM yet otherwise.
        void this.updateComplete.then(() => this.scrollPropertyListToBottom());
    }

    private scrollPropertyListToBottom(): void {
        const wrap = this.shadowRoot?.querySelector<HTMLElement>('.prop-table-wrap');
        if (!wrap) return;
        wrap.scrollTo({ top: wrap.scrollHeight, behavior: 'smooth' });
    }

    /** All automatic types available for this layer's geometry — the footer's
     *  "Optional attributes" dropdown lists every one regardless of whether
     *  it's currently present, so checking it back off is just as reachable
     *  as checking it on. */
    private availableAutoAttributeTypes(layer: DrawLayerConfig): PropertyDef['type'][] {
        return PROPERTY_TYPES[layer.type].filter(t => AUTO_PROPERTY_DEFAULTS[t]);
    }

    private isAutoAttributeChecked(layer: DrawLayerConfig, type: PropertyDef['type']): boolean {
        const def = AUTO_PROPERTY_DEFAULTS[type];
        return Boolean(def && layer.properties.some(p => p.name === def.name));
    }

    /** Toggles one automatic attribute on/off immediately — this dropdown
     *  lives in the dialog's footer, independent of the "Add attribute" flow
     *  above, so there's no separate save step: checking a box adds it with
     *  its default name right away, unchecking removes it. */
    private toggleAutoAttribute(layer: DrawLayerConfig, type: PropertyDef['type']): void {
        const def = AUTO_PROPERTY_DEFAULTS[type];
        if (!def) return;
        const properties = this.isAutoAttributeChecked(layer, type)
            ? layer.properties.filter(p => p.name !== def.name)
            : [...layer.properties, { name: def.name, type }];
        this.drawLayers = this.drawLayers.map(l => l.id === layer.id ? { ...l, properties } : l);
        this.syncLayerPropertiesToStore(layer.id, properties);
        this.cancelRenameAttribute();
    }

    private cancelAddAttribute(): void {
        this.addingAttribute = false;
        this.newAttrName = '';
        this.newAttrType = '';
    }

    /**
     * Removing an attribute is a real delete, not just hiding a column: for
     * a large imported layer, the whole point is reclaiming that data (and
     * shrinking whatever gets saved/exported) without reaching for a
     * separate GIS tool. Captures each feature's prior value first, so Undo
     * can restore precisely what was there.
     */
    private removeActiveLayerProperty(cfg: DrawLayerConfig, index: number): void {
        const property = cfg.properties[index];
        const properties = cfg.properties.filter((_, i) => i !== index);
        this.drawLayers = this.drawLayers.map(l => l.id === cfg.id ? { ...l, properties } : l);
        this.syncLayerPropertiesToStore(cfg.id, properties);

        const values: RemovedAttributeEntry['values'] = [];
        this.features = this.features.map(f => {
            if (f.layerId !== cfg.id || !(property.name in f.properties)) return f;
            values.push({ featureId: f.id, value: f.properties[property.name] });
            const { [property.name]: _removed, ...rest } = f.properties;
            return { ...f, properties: rest };
        });

        this.removedAttributeStack = [...this.removedAttributeStack, { index, property, values }];
        this.removedAttributeRedoStack = [];
        this.cancelRenameAttribute();
        this.refreshDrawLayerSource(cfg.id);
    }

    /** Restores the most recently removed attribute at its original index,
     *  with every feature's value exactly as it was — a no-op (and dropped
     *  rather than left to jam the stack) if a same-named attribute has
     *  since been added back, since re-inserting would create a duplicate
     *  `data-attr-name`/`properties` key. */
    private undoRemoveAttribute(cfg: DrawLayerConfig): void {
        if (this.removedAttributeStack.length === 0) return;
        const entry = this.removedAttributeStack[this.removedAttributeStack.length - 1];
        this.removedAttributeStack = this.removedAttributeStack.slice(0, -1);
        if (cfg.properties.some(p => p.name === entry.property.name)) return;
        const properties = [...cfg.properties];
        properties.splice(Math.min(entry.index, properties.length), 0, entry.property);
        this.drawLayers = this.drawLayers.map(l => l.id === cfg.id ? { ...l, properties } : l);
        this.syncLayerPropertiesToStore(cfg.id, properties);

        const valueByFeatureId = new Map(entry.values.map(v => [v.featureId, v.value]));
        this.features = this.features.map(f => {
            if (!valueByFeatureId.has(f.id)) return f;
            return { ...f, properties: { ...f.properties, [entry.property.name]: valueByFeatureId.get(f.id) } };
        });

        this.removedAttributeRedoStack = [...this.removedAttributeRedoStack, entry];
        this.cancelRenameAttribute();
        this.refreshDrawLayerSource(cfg.id);
    }

    /** Re-removes the attribute most recently brought back by Undo, data and all. */
    private redoRemoveAttribute(cfg: DrawLayerConfig): void {
        if (this.removedAttributeRedoStack.length === 0) return;
        const entry = this.removedAttributeRedoStack[this.removedAttributeRedoStack.length - 1];
        this.removedAttributeRedoStack = this.removedAttributeRedoStack.slice(0, -1);
        const properties = cfg.properties.filter(p => p.name !== entry.property.name);
        this.drawLayers = this.drawLayers.map(l => l.id === cfg.id ? { ...l, properties } : l);
        this.syncLayerPropertiesToStore(cfg.id, properties);

        const featureIds = new Set(entry.values.map(v => v.featureId));
        this.features = this.features.map(f => {
            if (!featureIds.has(f.id) || !(entry.property.name in f.properties)) return f;
            const { [entry.property.name]: _removed, ...rest } = f.properties;
            return { ...f, properties: rest };
        });

        this.removedAttributeStack = [...this.removedAttributeStack, entry];
        this.cancelRenameAttribute();
        this.refreshDrawLayerSource(cfg.id);
    }

    /**
     * Shared by both places the attribute undo/redo pair appears: the same
     * row as "Add attribute" normally, and one row below the add-attribute
     * form while it's open (the button itself isn't there to share a row
     * with in that state) — always right-aligned via each wrapper's own
     * flex layout.
     */
    private renderAttributeUndoRedo(cfg: DrawLayerConfig) {
        // Grouped in their own flex wrapper so the two icons stay adjacent —
        // otherwise `.add-attr-row`'s space-between (between the "Add
        // attribute" button and this pair) would treat them as two more
        // independent children and spread all three evenly across the row.
        return html`
            <span class="add-attr-undo-group">
                <sl-tooltip content="Undo remove">
                    <sl-icon-button name="arrow-counterclockwise" size="small" label="Undo remove"
                        ?disabled=${this.removedAttributeStack.length === 0}
                        @click=${() => this.undoRemoveAttribute(cfg)}>
                    </sl-icon-button>
                </sl-tooltip>
                <sl-tooltip content="Redo remove">
                    <sl-icon-button name="arrow-clockwise" size="small" label="Redo remove"
                        ?disabled=${this.removedAttributeRedoStack.length === 0}
                        @click=${() => this.redoRemoveAttribute(cfg)}>
                    </sl-icon-button>
                </sl-tooltip>
            </span>
        `;
    }

    /** Renameable = a manual (non-auto/-computed) attribute other than `id`
     *  — an automatic type is matched by its fixed default name elsewhere
     *  (`isAutoAttributeChecked`), so renaming one would desync it from the
     *  "Optional attributes" checklist. */
    private canRenameAttribute(p: PropertyDef): boolean {
        return p.name !== 'id' && !AUTO_PROPERTY_TYPES.has(p.type);
    }

    private startRenameAttribute(index: number, currentName: string): void {
        this.renamingAttributeIndex = index;
        this.renameAttrDraft = currentName;
    }

    private cancelRenameAttribute(): void {
        this.renamingAttributeIndex = null;
        this.renameAttrDraft = '';
    }

    /** Whether the in-progress rename draft could actually be committed —
     *  drives the confirm button's disabled state the same way "Add
     *  attribute"'s Add button is driven by its own draft fields. */
    private renameAttributeDraftValid(cfg: DrawLayerConfig, index: number): boolean {
        const newName = this.renameAttrDraft.trim();
        const oldName = cfg.properties[index]?.name;
        if (!oldName || !newName || newName === oldName) return false;
        return !cfg.properties.some((p, i) => i !== index && p.name === newName);
    }

    /**
     * Renames the attribute at `index` and migrates its stored value under
     * the new key on every feature of this layer — the schema and the
     * per-feature `properties` object are two separate places that both key
     * on the attribute's name, so leaving the second alone would make every
     * existing value for this attribute silently unreachable (still present
     * in the data, but invisible, since every lookup now uses the new name).
     */
    private commitRenameAttribute(cfg: DrawLayerConfig, index: number): void {
        if (!this.renameAttributeDraftValid(cfg, index)) { this.cancelRenameAttribute(); return; }
        const newName = this.renameAttrDraft.trim();
        const oldName = cfg.properties[index].name;
        const properties = cfg.properties.map((p, i) => i === index ? { ...p, name: newName } : p);
        this.drawLayers = this.drawLayers.map(l => l.id === cfg.id ? { ...l, properties } : l);
        this.syncLayerPropertiesToStore(cfg.id, properties);
        this.features = this.features.map(f => {
            if (f.layerId !== cfg.id || !(oldName in f.properties)) return f;
            const { [oldName]: value, ...rest } = f.properties;
            return { ...f, properties: { ...rest, [newName]: value } };
        });
        this.refreshDrawLayerSource(cfg.id);
        if (this.lastFocusedAttributeName === oldName) this.lastFocusedAttributeName = newName;
        this.cancelRenameAttribute();
    }

    // ─── Map event handlers ───────────────────────────────────────────────────

    private handleClick(e: ClickEvent): void {
        const coords: LngLat = (this.effectiveSnap && this.snapPos) ? this.snapPos : e.coords;
        const geoType = modeToGeometryType(this.mode);
        const layerId = geoType ? this.activeLayerIds[geoType] : null;
        if (!layerId && this.mode !== 'select' && this.mode !== 'attributes') return;

        if (this.mode === 'draw-point') {
            this.commitFeature({
                id: this.newId(), layerId: layerId!, type: 'Point',
                coordinates: coords, properties: this.defaultProperties(layerId!)
            });
            return;
        }

        if (this.mode === 'draw-line' || this.mode === 'draw-line-dashed' || this.mode === 'draw-polygon') {
            if (this.draftPoints.length >= 2) {
                const last = this.draftPoints[this.draftPoints.length - 1];
                if (this.withinPixelThreshold(coords, last, 10) ||
                    (this.mode === 'draw-polygon' && this.withinPixelThreshold(coords, this.draftPoints[0], 14))) {
                    this.finishDraft(layerId!);
                    return;
                }
            }
            // Deselect previous feature when starting a new shape
            if (this.draftPoints.length === 0 && this.selectedFeatureId) {
                this.selectedFeatureId = null;
                this.editState = 'none';
                this.editHandles = [];
                this.updateSelectedSource();
                this.updateEditHandles();
            }
            this.draftPoints.push(coords);
            this.draftRedoStack = [];
            this.uiVersion++;
            this.updateRubberband();
            this.updateHelpTextDuring();
            return;
        }

        if (this.mode === 'select' || this.mode === 'attributes') {
            // Select's only job is choosing what the trash button acts on, and
            // Attributes' only job is choosing what the attribute panel shows —
            // moving and editing vertices are Edit's job now (`edit-move`/
            // `edit-vertices`), so a click here never does more than this.
            const pixel = this.adapter!.project(coords);
            const px: [number, number] = [pixel[0], pixel[1]];
            const hit = this.findFeatureAt(px, coords);
            this.setSelection(hit ? [hit.id] : []);
            this.requestUpdate();
        }
    }

    private handlePointerMove(e: PointerMoveEvent): void {
        this.cursorPos = e.coords;

        if (this.circleDraft) {
            this.updateCircleDraft(e.coords);
            return;
        }

        if (this.rectDraft) {
            this.updateRectDraft(e.coords);
            return;
        }

        if (this.rectSelectDraft) {
            this.updateRectSelectDraft(e.coords);
            return;
        }

        if (this.lassoSelectDraft) {
            this.updateLassoSelectDraft(e.coords);
            return;
        }

        if (this.featureDrag) {
            // Move entire feature — compute from original coords to avoid drift
            const f = this.features.find(f => f.id === this.featureDrag!.featureId);
            if (f) {
                const totalDLng = e.coords[0] - this.featureDrag.startCoords[0];
                const totalDLat = e.coords[1] - this.featureDrag.startCoords[1];
                f.coordinates = this.translateCoordsGeoPreserving(
                    this.featureDrag.origCoords, f.type,
                    totalDLng, totalDLat,
                    this.featureDrag.origCentroidLng, this.featureDrag.origCentroidLat
                );
                this.refreshDrawLayerSource(f.layerId);
                this.updateEditHandles();
                this.updateSelectedSource();
            }
            return;
        }

        if (this.dragging) {
            // Move vertex/midpoint
            const f = this.features.find(f => f.id === this.dragging!.handle.featureId);
            if (f) {
                let moveTarget = e.coords;
                if (this.effectiveSnap && this.features.length > 0) {
                    const px = this.adapter!.project(e.coords);
                    const snapped = this.computeSnapExcluding(
                        [px[0], px[1]],
                        this.dragging.handle.featureId,
                        isPointType(f.type)
                    );
                    this.snapPos = snapped;
                    if (snapped) moveTarget = snapped;
                } else {
                    this.snapPos = null;
                }
                this.applyDragMove(f, this.dragging.handle, moveTarget);
                this.dragging.lastCoords = e.coords;
                this.refreshDrawLayerSource(f.layerId);
                this.updateEditHandles();
                this.updateSelectedSource();
                this.updateSnapIndicator();
                const dh = this.dragging.handle;
                if (this.selectedHandle && dh.kind === 'vertex' &&
                    this.selectedHandle.featureId === dh.featureId &&
                    this.selectedHandle.partIdx === dh.partIdx &&
                    this.selectedHandle.ringIdx === dh.ringIdx &&
                    this.selectedHandle.vertIdx === dh.vertIdx) {
                    this.selectedHandle.coords = dh.coords;
                    this.updateSelectedVertexSource();
                }
            }
            return;
        }

        if (isVertexDrawMode(this.mode)) {
            // Closing a polygon onto its own start point needs snapping even
            // with zero committed features on the map yet (the very first
            // shape drawn) — the `features.length > 0` half of this guard
            // only covers snapping to *other* geometry.
            const canClosePolygon = this.mode === 'draw-polygon' && this.draftPoints.length >= 2;
            if (this.effectiveSnap && (this.features.length > 0 || canClosePolygon)) {
                const px = this.adapter!.project(e.coords);
                const cursorPx: [number, number] = [px[0], px[1]];
                if (!this.lastCursorPx ||
                    Math.hypot(cursorPx[0] - this.lastCursorPx[0], cursorPx[1] - this.lastCursorPx[1]) > 0.5) {
                    this.lastCursorPx = cursorPx;
                    this.snapPos = this.computeSnap(cursorPx);
                }
            } else {
                this.snapPos = null;
            }
            this.updateRubberband();
            return;
        }

        // Delete (click, rectangle or lasso — none dragging yet, or those drag
        // branches above would already have returned): hover previews
        // whatever's under the cursor that isn't already picked, the same
        // solid-dot language as everywhere else. The actual pick still only
        // happens on click or by finishing a rectangle/lasso drag.
        if (this.isSelectMode()) {
            const px = this.adapter!.project(e.coords);
            const hit = this.findFeatureAt([px[0], px[1]], e.coords);
            const previewId = hit && !this.selectedFeatureIds.includes(hit.id) ? hit.id : null;
            if (previewId !== this.hoveredFeatureId) {
                this.hoveredFeatureId = previewId;
                this.updateSelectedSource();
            }
            this.adapter?.setCursor(hit ? 'pointer' : '');
            return;
        }

        // Attributes: click-pinned (see `handleClick`/`setSelection`), same as
        // "Edit vertices" — hover only ever previews a *different* feature
        // than the pinned one (`hoveredFeatureId`), so the pinned one's own
        // preview dots (drawn from `selectedFeatureId` in `updateSelectedSource`)
        // aren't duplicated or blinked out by the mouse moving around it.
        if (this.mode === 'attributes') {
            const px = this.adapter!.project(e.coords);
            const hit = this.findFeatureAt([px[0], px[1]], e.coords);
            const previewId = hit && hit.id !== this.selectedFeatureId ? hit.id : null;
            if (previewId !== this.hoveredFeatureId) {
                this.hoveredFeatureId = previewId;
                this.updateSelectedSource();
            }
            this.adapter?.setCursor(hit ? 'pointer' : '');
            return;
        }

        // Edit "Move": click-pinned, same as "Edit vertices" (see
        // `handleClick`/`handlePointerDown`) — a click (or a completed drag)
        // leaves a feature selected even after the pointer moves away, so
        // hover only ever updates `hoveredFeatureId`, a lighter preview of a
        // *different* feature than the one already pinned. Grabbing and
        // dragging still works directly on whatever's under the cursor
        // regardless of what's pinned — see `handlePointerDown` — hover here
        // is only about what a plain click would switch the pin to.
        if (this.mode === 'edit-move') {
            const projected = this.adapter!.project(e.coords);
            const px: [number, number] = [projected[0], projected[1]];
            const hit = this.findFeatureAt(px, e.coords);
            const previewId = hit && hit.id !== this.selectedFeatureId ? hit.id : null;
            if (previewId !== this.hoveredFeatureId) {
                this.hoveredFeatureId = previewId;
                this.updateSelectedSource();
            }
            this.adapter?.setCursor(hit ? 'grab' : '');
            return;
        }

        // Edit "Edit vertices": click-pinned, not hover-driven (see
        // `handlePointerDown`) — the pinned feature's hollow handles must
        // survive the pointer moving away to reach the panel's delete-vertex
        // button, so hover only ever updates `hoveredFeatureId`, a lighter
        // preview of what a click would switch to. Hovering the pinned
        // feature's own handles/body never counts as "previewing something
        // else".
        if (this.mode === 'edit-vertices') {
            const projected = this.adapter!.project(e.coords);
            const px: [number, number] = [projected[0], projected[1]];
            const onOwnHandle = this.selectedFeatureId ? this.findHandleAt(px) : null;
            const hit = onOwnHandle ? null : this.findFeatureAt(px, e.coords);
            const previewId = hit && hit.id !== this.selectedFeatureId ? hit.id : null;
            if (previewId !== this.hoveredFeatureId) {
                this.hoveredFeatureId = previewId;
                this.updateSelectedSource();
            }
            if (onOwnHandle) {
                this.adapter?.setCursor('grab');
            } else if (hit) {
                this.adapter?.setCursor(hit.id === this.selectedFeatureId ? 'default' : 'pointer');
            } else {
                this.adapter?.setCursor('');
            }
        }
    }

    private handlePointerDown(e: PointerDownEvent): void {
        if (e.button !== 0) return;

        if (this.mode === 'draw-circle') {
            this.startCircleDraft(e.coords);
            return;
        }

        if (this.mode === 'draw-rectangle') {
            this.startRectDraft(e.coords);
            return;
        }

        if (this.mode === 'select-rect') {
            this.startRectSelectDraft(e.coords);
            return;
        }

        if (this.mode === 'select-lasso') {
            this.startLassoSelectDraft(e.coords);
            return;
        }

        if (this.mode === 'edit-move') {
            const px: [number, number] = [e.pixel[0], e.pixel[1]];
            // Grabbing works directly on whatever's under the cursor, pinned
            // or not — hit-tested fresh rather than reading `selectedFeatureId`,
            // since hover no longer keeps that pointed at whatever's merely
            // under the cursor (see `handlePointerMove`). Grabbing pins it
            // too, same as a plain click does, via `handlePointerUp` below —
            // whether this turns into a real drag or stays a no-op click,
            // the grabbed feature ends up selected either way.
            const f = this.findFeatureAt(px, e.coords);
            if (!f) {
                // Pressing down on empty map unpins, same as an empty click
                // does in Select/Attributes — nothing to drag either way.
                if (this.selectedFeatureId) {
                    this.selectedFeatureId = null;
                    this.editState = 'none';
                    this.hoveredFeatureId = null;
                    this.updateSelectedSource();
                    this.updateEditHandles();
                }
                return;
            }
            if (f.id !== this.selectedFeatureId) {
                this.selectedFeatureId = f.id;
                this.editState = isPointType(f.type) ? 'none' : 'selected';
                this.hoveredFeatureId = null;
                this.updateSelectedSource();
                this.updateEditHandles();
            }
            // Whole-feature translate for every geometry, points included — a
            // point's "move" is just its one coordinate shifting, exactly
            // what `translateCoordsGeoPreserving`/`centroid` already do for
            // any other shape, so it needs no separate vertex-handle path.
            const centroid = this.centroid(f);
            this.featureDrag = {
                featureId: f.id, startCoords: e.coords,
                origCoords: JSON.parse(JSON.stringify(f.coordinates)),
                origCentroidLat: centroid[1], origCentroidLng: centroid[0],
            };
            this.adapter?.setPanEnabled(false);
            this.adapter?.setCursor('grabbing');
            return;
        }

        if (this.mode === 'edit-vertices') {
            const px: [number, number] = [e.pixel[0], e.pixel[1]];

            // Try the currently-pinned feature's own handles first — a click
            // that lands on one of them always means "drag this", regardless
            // of what else might be nearby (see the deferred overlap case).
            const pinned = this.selectedFeatureId ? this.features.find(f => f.id === this.selectedFeatureId) : null;
            const h = pinned ? this.findHandleAt(px) : null;
            if (pinned && h) {
                this.selectedHandle = h.kind === 'vertex' ? h : null;
                this.updateSelectedVertexSource();
                this.dragging = { handle: h, lastCoords: e.coords, origCoords: JSON.parse(JSON.stringify(pinned.coordinates)) };
                this.adapter?.setPanEnabled(false);
                this.adapter?.setCursor('grabbing');

                // If dragging a midpoint, first insert the new vertex
                if (h.kind === 'midpoint') {
                    this.insertVertex(pinned, h);
                    // After insert, dragging.handle becomes the newly inserted vertex
                    const newVertIdx = h.afterVertIdx + 1;
                    const vertHandle: VertexHandle = {
                        kind: 'vertex', featureId: h.featureId, partIdx: h.partIdx,
                        ringIdx: h.ringIdx, vertIdx: newVertIdx, coords: h.coords
                    };
                    // `pinned.coordinates` already reflects the just-inserted vertex
                    // (a separate, already-pushed history entry of its own) — the
                    // "before" state for *this* drag is that post-insert shape,
                    // not the shape from before the vertex existed at all.
                    this.dragging = { handle: vertHandle, lastCoords: e.coords, origCoords: JSON.parse(JSON.stringify(pinned.coordinates)) };
                    this.selectedHandle = vertHandle;
                    this.updateSelectedVertexSource();
                    this.refreshDrawLayerSource(pinned.layerId);
                    this.updateEditHandles();
                }
                return;
            }

            // No handle grabbed — either nothing's pinned yet, or the click
            // missed the pinned feature's own handles. Either way, (re)pin
            // whatever's directly under the cursor instead; clicking empty
            // map unpins. This is what makes the feature's handles survive
            // the pointer moving away afterward — see `hoveredFeatureId`.
            const hit = this.findFeatureAt(px, e.coords);
            if (hit?.id !== this.selectedFeatureId) {
                this.selectedFeatureId = hit?.id ?? null;
                this.editState = hit ? 'editing' : 'none';
                this.hoveredFeatureId = null;
                this.updateSelectedSource();
                this.updateEditHandles();
            }
            return;
        }
    }

    private handlePointerUp(_e: PointerUpEvent): void {
        if (this.circleDraft) {
            this.finishCircleDraft();
            return;
        }
        if (this.rectDraft) {
            this.finishRectDraft();
            return;
        }
        if (this.rectSelectDraft) {
            this.finishRectSelectDraft();
            return;
        }
        if (this.lassoSelectDraft) {
            this.finishLassoSelectDraft();
            return;
        }
        if (this.featureDrag) {
            const f = this.features.find(f => f.id === this.featureDrag!.featureId);
            // Grabbing in Edit "Move" now pins on pointer-down regardless of
            // whether a real drag follows (see `handlePointerDown`) — a plain
            // click never moved `f.coordinates` off `origCoords` (no
            // pointer-move ever ran translateCoordsGeoPreserving on it), so
            // pushing history here for that case would be a no-op entry that
            // clutters Undo with nothing to actually undo.
            const moved = f && JSON.stringify(f.coordinates) !== JSON.stringify(this.featureDrag!.origCoords);
            if (f && moved) {
                // Snapshot taken from the drag-start coordinates, not `f` —
                // by pointer-up `f` already holds the dragged-to position, so
                // capturing "before" from it here would save the same state
                // twice and make undo (which restores `features`) a no-op.
                const before: DrawFeature = { ...f, coordinates: this.featureDrag!.origCoords };
                const layer = this.drawLayers.find(l => l.id === f.layerId);
                if (layer) this.computeSpecialProperties(f, layer);
                this.pushHistory({ type: 'update', features: [before], afterFeatures: [{ ...f }] });
                // computeSpecialProperties mutates `f.properties` in place —
                // refresh the array reference and map source so the recomputed
                // area/perimeter/etc. show up in the properties panel and on the map.
                this.features = [...this.features];
                this.refreshDrawLayerSource(f.layerId);
            }
            this.featureDrag = null;
            this.adapter?.setPanEnabled(true);
            this.adapter?.setCursor('');
            return;
        }
        if (!this.dragging) return;
        this.snapPos = null;
        this.updateSnapIndicator();
        this.adapter?.setPanEnabled(true);
        // The next pointer-move recomputes the right cursor for wherever the
        // mouse actually ends up; no stale "still over a handle" state to track.
        this.adapter?.setCursor('');

        const f = this.features.find(f => f.id === this.dragging!.handle.featureId);
        // Pressing a handle selects its vertex whether or not a drag follows —
        // the same reasoning as feature-drag above: a release where it was
        // pressed changed nothing, so it gets no undo step and no update time.
        // A midpoint's new vertex is its own, already-pushed entry.
        const moved = f && JSON.stringify(f.coordinates) !== JSON.stringify(this.dragging!.origCoords);
        if (f && moved) {
            const before: DrawFeature = { ...f, coordinates: this.dragging!.origCoords };
            const layer = this.drawLayers.find(l => l.id === f.layerId);
            if (layer) this.computeSpecialProperties(f, layer);
            this.pushHistory({ type: 'update', features: [before], afterFeatures: [{ ...f }] });
            // Same as feature-drag: force the array/source refresh so the
            // recomputed special properties (area, perimeter, …) become visible.
            this.features = [...this.features];
            this.refreshDrawLayerSource(f.layerId);
        }
        this.dragging = null;
    }

    /**
     * Delete, Edit "Move", "Edit vertices" and Attributes are all click-pinned
     * (see `handleClick`/`handlePointerDown`) — the whole point of pinning is
     * that it survives the pointer moving away, so there's nothing of the pin
     * itself to clear here. Only their lighter hover *preview*
     * (`hoveredFeatureId`, a *different* feature than whatever's pinned) needs
     * clearing, since that only ever gets set from a `pointer-move` event —
     * moving the mouse off the map entirely (onto the floating panel, or out
     * of the browser) leaves nothing to fire one and clear it, and it'd
     * otherwise stay stuck showing forever. `pointer-leave` (native `mouseout`
     * on the map) is the one signal that still reaches here. Left alone
     * mid-drag: the pointer can stray outside the map's bounds while a drag
     * is in progress (pointer capture keeps the drag itself going), and
     * clearing state out from under it would orphan it.
     */
    private handlePointerLeave(): void {
        if (this.dragging || this.featureDrag) return;
        const hoverCursorMode = this.isSelectMode() || this.isEditMode() || this.mode === 'attributes';
        if (hoverCursorMode && this.hoveredFeatureId) {
            this.hoveredFeatureId = null;
            this.updateSelectedSource();
        }
        // Only these modes ever change the cursor away from what
        // `setModeInternal` set on entry — hovering a feature swaps it to
        // 'pointer'/'grab'/etc, and pointer-leave is what puts it back. Draw
        // modes set a fixed 'crosshair' once on entry and never touch it
        // again, so resetting it here too would wipe it back to the default
        // arrow/hand every time the pointer merely left and returned to the
        // map, without any click or mode change in between.
        if (hoverCursorMode) {
            this.adapter?.setCursor('');
        }
    }

    private handleContextMenu(_e: ContextMenuEvent): void {
        const geoType = modeToGeometryType(this.mode);
        const layerId = geoType ? this.activeLayerIds[geoType] : null;
        if (layerId && (this.mode === 'draw-line' || this.mode === 'draw-line-dashed' || this.mode === 'draw-polygon')) {
            this.finishDraft(layerId);
        }
    }

    // ─── Draft management ────────────────────────────────────────────────────

    private defaultProperties(layerId: string): Record<string, null> {
        const layer = this.drawLayers.find(l => l.id === layerId);
        if (!layer) return {};
        return Object.fromEntries(layer.properties.map(p => [p.name, null]));
    }

    private finishDraft(layerId: string): void {
        const pts = this.draftPoints;
        if ((this.mode === 'draw-line' || this.mode === 'draw-line-dashed') && pts.length >= 2) {
            this.commitFeature({
                id: this.newId(), layerId, type: 'LineString',
                coordinates: pts.map(p => [p[0], p[1]]), properties: this.defaultProperties(layerId),
                dashed: this.mode === 'draw-line-dashed'
            }, pts);
        } else if (this.mode === 'draw-polygon' && pts.length >= 3) {
            const ring = [...pts.map(p => [p[0], p[1]]), [pts[0][0], pts[0][1]]];
            this.commitFeature({
                id: this.newId(), layerId, type: 'Polygon',
                coordinates: [ring], properties: this.defaultProperties(layerId)
            }, pts);
        }
        this.draftPoints = [];
        this.draftRedoStack = [];
        this.cursorPos = null;
        this.updateRubberband();
    }

    // ─── Circle drawing ──────────────────────────────────────────────────────

    private startCircleDraft(coords: LngLat): void {
        const layerId = this.activeLayerIds['Polygon'];
        if (!layerId) return;
        const center = (this.effectiveSnap && this.snapPos) ? this.snapPos : coords;
        this.circleDraft = { center, radiusM: 0 };
        this.adapter?.setPanEnabled(false);
        this.helpText = 'Drag to set circle radius.';
    }

    private updateCircleDraft(coords: LngLat): void {
        if (!this.circleDraft) return;
        this.circleDraft.radiusM = haversineDistanceCm(this.circleDraft.center, coords) / 100;
        this.updateCirclePreview();
        this.helpText = `Radius: ${formatDistance(this.circleDraft.radiusM * 100)}`;
    }

    private updateCirclePreview(): void {
        if (!this.sharedLayersCreated || !this.circleDraft) return;
        const features = this.circleDraft.radiusM >= MIN_DRAG_SIZE_M
            ? [{
                type: 'Feature' as const,
                geometry: { type: 'LineString' as const, coordinates: circlePolygonRing(this.circleDraft.center, this.circleDraft.radiusM) },
                properties: {}
            }]
            : [];
        this.dispatch('webmapx-set-source-data', { id: RUBBER_SOURCE_ID, data: { type: 'FeatureCollection', features } });
    }

    private finishCircleDraft(): void {
        if (!this.circleDraft) return;
        const { center, radiusM } = this.circleDraft;
        this.circleDraft = null;
        this.adapter?.setPanEnabled(true);
        this.dispatch('webmapx-set-source-data', { id: RUBBER_SOURCE_ID, data: { type: 'FeatureCollection', features: [] } });

        const layerId = this.activeLayerIds['Polygon'];
        if (layerId && radiusM >= MIN_DRAG_SIZE_M) {
            this.commitFeature({
                id: this.newId(), layerId, type: 'Polygon',
                coordinates: [circlePolygonRing(center, radiusM)], properties: this.defaultProperties(layerId)
            });
        }
        this.helpText = 'Click and drag to draw a circle.';
    }

    // ─── Rectangle drawing ───────────────────────────────────────────────────

    private startRectDraft(coords: LngLat): void {
        const layerId = this.activeLayerIds['Polygon'];
        if (!layerId) return;
        const corner = (this.effectiveSnap && this.snapPos) ? this.snapPos : coords;
        this.rectDraft = { corner1: corner, corner2: corner };
        this.adapter?.setPanEnabled(false);
        this.helpText = 'Drag to the opposite corner.';
    }

    private updateRectDraft(coords: LngLat): void {
        if (!this.rectDraft) return;
        this.rectDraft.corner2 = (this.effectiveSnap && this.snapPos) ? this.snapPos : coords;
        this.updateRectPreview();
        const diagM = haversineDistanceCm(this.rectDraft.corner1, this.rectDraft.corner2) / 100;
        this.helpText = `Diagonal: ${formatDistance(diagM * 100)}`;
    }

    /** Closed ring for the axis-aligned (in lng/lat) box between two opposite corners. */
    private rectRing(corner1: LngLat, corner2: LngLat): LngLat[] {
        const [lng1, lat1] = corner1;
        const [lng2, lat2] = corner2;
        return [[lng1, lat1], [lng2, lat1], [lng2, lat2], [lng1, lat2], [lng1, lat1]];
    }

    private updateRectPreview(): void {
        if (!this.sharedLayersCreated || !this.rectDraft) return;
        const diagM = haversineDistanceCm(this.rectDraft.corner1, this.rectDraft.corner2) / 100;
        const features = diagM >= MIN_DRAG_SIZE_M
            ? [{
                type: 'Feature' as const,
                geometry: { type: 'LineString' as const, coordinates: this.rectRing(this.rectDraft.corner1, this.rectDraft.corner2) },
                properties: {}
            }]
            : [];
        this.dispatch('webmapx-set-source-data', { id: RUBBER_SOURCE_ID, data: { type: 'FeatureCollection', features } });
    }

    private finishRectDraft(): void {
        if (!this.rectDraft) return;
        const { corner1, corner2 } = this.rectDraft;
        this.rectDraft = null;
        this.adapter?.setPanEnabled(true);
        this.dispatch('webmapx-set-source-data', { id: RUBBER_SOURCE_ID, data: { type: 'FeatureCollection', features: [] } });

        const layerId = this.activeLayerIds['Polygon'];
        const diagM = haversineDistanceCm(corner1, corner2) / 100;
        if (layerId && diagM >= MIN_DRAG_SIZE_M) {
            this.commitFeature({
                id: this.newId(), layerId, type: 'Polygon',
                coordinates: [this.rectRing(corner1, corner2)], properties: this.defaultProperties(layerId)
            });
        }
        this.helpText = 'Click and drag to draw a rectangle.';
    }

    // ─── Rectangle / lasso select ───────────────────────────────────────────

    private startRectSelectDraft(coords: LngLat): void {
        this.rectSelectDraft = { corner1: coords, corner2: coords };
        this.adapter?.setPanEnabled(false);
    }

    private updateRectSelectDraft(coords: LngLat): void {
        if (!this.rectSelectDraft) return;
        this.rectSelectDraft.corner2 = coords;
        const { corner1, corner2 } = this.rectSelectDraft;
        const ring = this.rectRing(corner1, corner2);
        this.updateMarquee(ring);
        // Live highlight as the box grows, not just once it's released — same
        // minimum-size gate as `finishRectSelectDraft`, so a box too small to
        // count as a real drag doesn't flicker features on and off.
        const diagM = haversineDistanceCm(corner1, corner2) / 100;
        if (diagM >= MIN_DRAG_SIZE_M) {
            this.applyShapeSelection(ring);
        } else if (this.selectedFeatureIds.length > 0) {
            this.setSelection([]);
        }
    }

    private finishRectSelectDraft(): void {
        if (!this.rectSelectDraft) return;
        const { corner1, corner2 } = this.rectSelectDraft;
        this.rectSelectDraft = null;
        this.adapter?.setPanEnabled(true);
        this.updateMarquee(null);
        // The live highlight in `updateRectSelectDraft` already reflects this
        // exact box, but recomputed here too in case a pointer-up ever arrives
        // without a preceding pointer-move at the same coordinates.
        const diagM = haversineDistanceCm(corner1, corner2) / 100;
        if (diagM >= MIN_DRAG_SIZE_M) {
            this.applyShapeSelection(this.rectRing(corner1, corner2));
        }
        this.helpText = 'Drag a rectangle to select the features inside it.';
    }

    private startLassoSelectDraft(coords: LngLat): void {
        this.lassoSelectDraft = { points: [coords] };
        this.adapter?.setPanEnabled(false);
    }

    private updateLassoSelectDraft(coords: LngLat): void {
        if (!this.lassoSelectDraft) return;
        const pts = this.lassoSelectDraft.points;
        const last = pts[pts.length - 1];
        // Skip points that haven't moved far in screen space — a raw pointer-move
        // stream would otherwise add a near-duplicate point on every frame of a
        // long drag.
        if (this.adapter) {
            const a = this.adapter.project(last);
            const b = this.adapter.project(coords);
            if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 3) return;
        }
        pts.push(coords);
        // Live highlight as the shape is traced, not just once it closes.
        if (pts.length >= 3) {
            const ring = [...pts, pts[0]];
            this.updateMarquee(ring);
            this.applyShapeSelection(ring);
        } else {
            this.updateMarquee(null);
        }
    }

    private finishLassoSelectDraft(): void {
        if (!this.lassoSelectDraft) return;
        const points = this.lassoSelectDraft.points;
        this.lassoSelectDraft = null;
        this.adapter?.setPanEnabled(true);
        this.updateMarquee(null);
        if (points.length >= 3) {
            this.applyShapeSelection([...points, points[0]]);
        }
        this.helpText = 'Draw a free-hand shape to select the features inside it.';
    }

    /** Draws (or clears, on `null`) the dashed/tinted rectangle or lasso outline while dragging. */
    private updateMarquee(ring: LngLat[] | null): void {
        if (!this.sharedLayersCreated) return;
        const features = ring
            ? [{ type: 'Feature' as const, geometry: { type: 'Polygon' as const, coordinates: [ring] }, properties: {} }]
            : [];
        this.dispatch('webmapx-set-source-data', { id: MARQUEE_SOURCE_ID, data: { type: 'FeatureCollection', features } });
    }

    /**
     * Finds every feature the current ring (rectangle or lasso) catches and
     * hands off to `setSelection` — the ring's arity doesn't matter beyond
     * this point, both select-rect and select-lasso funnel through here. Pure
     * hit-testing with no history/side effects beyond the live highlight, so
     * it's cheap enough to call on every drag update as the shape grows, not
     * just once on release.
     */
    private applyShapeSelection(ring: LngLat[]): void {
        if (ring.length < 3) return;
        const layerId = this.currentSessionLayerId;
        const hits: string[] = [];
        for (const f of this.features) {
            // Same restriction `findFeatureAt` applies to click-select.
            if (f.layerId !== layerId) continue;
            if (this.featureIntersectsRing(f, ring)) hits.push(f.id);
        }
        this.setSelection(hits);
    }

    /** A feature is caught if any of its own points falls inside the selection
     *  ring, or — for a polygon — the ring falls inside it instead (a small
     *  selection box drawn entirely inside a large polygon touches none of
     *  that polygon's own vertices). */
    private featureIntersectsRing(f: DrawFeature, ring: LngLat[]): boolean {
        if (f.type === 'Point') {
            return this.pointInRing(f.coordinates as LngLat, ring);
        }
        if (f.type === 'MultiPoint') {
            return (f.coordinates as LngLat[]).some(pt => this.pointInRing(pt, ring));
        }
        if (f.type === 'LineString') {
            return (f.coordinates as LngLat[]).some(pt => this.pointInRing(pt, ring));
        }
        if (f.type === 'MultiLineString') {
            return (f.coordinates as LngLat[][]).some(line => line.some(pt => this.pointInRing(pt, ring)));
        }
        if (f.type === 'Polygon') {
            const outer = (f.coordinates as LngLat[][])[0];
            return outer.some(pt => this.pointInRing(pt, ring)) || ring.some(pt => this.pointInRing(pt, outer));
        }
        if (f.type === 'MultiPolygon') {
            return (f.coordinates as LngLat[][][]).some(poly => {
                const outer = poly[0];
                return Boolean(outer) && (outer.some(pt => this.pointInRing(pt, ring)) || ring.some(pt => this.pointInRing(pt, outer)));
            });
        }
        return false;
    }

    /**
     * Shared by Select (one hit, many via rectangle/lasso, or none) and
     * Attributes (one hit or none — always lands in `selectedFeatureIds`,
     * since neither mode moves or reshapes anything (that's Edit's job) and
     * so neither has a reason to treat one selected feature differently from
     * several. A single hit additionally sets `selectedFeatureId` purely so
     * the attribute panel has something to show — it doesn't affect what's
     * drawn on the map. What's drawn is split by geometry:
     * `updateMultiSelectSource` for points, and `updateSelectedSource`'s
     * small solid nodes for lines/polygons.
     */
    private setSelection(ids: string[]): void {
        this.selectedFeatureIds = ids;
        this.selectedFeatureId = ids.length === 1 ? ids[0] : null;
        // Whatever was just pinned is no longer merely a hover preview —
        // matters for Attributes, where the two are drawn together.
        this.hoveredFeatureId = null;
        this.updateSelectedSource();
        this.updateMultiSelectSource();
        // Clicking a different feature while already in Attributes re-points
        // the blue focus ring at the new one's first value too — not just on
        // first entering the mode (`setModeInternal`) — so switching between
        // features stays a one-click "click, then type" motion throughout,
        // not just the first time.
        if (this.mode === 'attributes' && this.selectedFeatureId) {
            void this.updateComplete.then(() => this.focusFirstAttributeValueInput());
        }
    }

    /** Select's point-feature highlight — mirrors `updateSelectedSource`, but
     *  for every selected point/multipoint at once rather than one line/polygon's
     *  nodes. A point is its own only "node" already, so it gets a plain
     *  highlighted dot instead of the vertex-node treatment. */
    private updateMultiSelectSource(): void {
        if (!this.sharedLayersCreated) return;
        const features = this.selectedFeatureIds
            .map(id => this.features.find(f => f.id === id))
            .filter((f): f is DrawFeature => Boolean(f && isPointType(f.type)))
            .map(f => ({
                type: 'Feature' as const, id: f.id,
                geometry: { type: f.type, coordinates: f.coordinates } as GeoJSON.Geometry,
                properties: {}
            }));
        this.dispatch('webmapx-set-source-data', { id: MULTI_SEL_SOURCE_ID, data: { type: 'FeatureCollection', features } });
    }

    // ─── Snap ─────────────────────────────────────────────────────────────────

    private computeSnap(cursorPx: [number, number]): LngLat | null {
        const otherSnap = this.computeSnapExcluding(cursorPx, null, this.mode === 'draw-point');
        // Snapping onto the ring's own start point while drawing a polygon —
        // closing used to rely on clicking within a small pixel radius blind,
        // with none of the visual pull/feedback snapping to another
        // feature's vertex already had.
        if (this.mode === 'draw-polygon' && this.draftPoints.length >= 2 && this.adapter) {
            const start = this.draftPoints[0];
            const startPx = this.adapter.project(start);
            const d = Math.hypot(startPx[0] - cursorPx[0], startPx[1] - cursorPx[1]);
            if (d <= SNAP_THRESHOLD) {
                if (!otherSnap) return start;
                const otherPx = this.adapter.project(otherSnap);
                const otherD = Math.hypot(otherPx[0] - cursorPx[0], otherPx[1] - cursorPx[1]);
                return d <= otherD ? start : otherSnap;
            }
        }
        return otherSnap;
    }

    private computeSnapExcluding(cursorPx: [number, number], excludeFeatureId: string | null, skipPoints: boolean): LngLat | null {
        if (!this.adapter) return null;
        const candidates = this.features.filter(f =>
            f.id !== excludeFeatureId && !(skipPoints && isPointType(f.type))
        );
        return findSnap(cursorPx, candidates, v => {
            const px = this.adapter!.project(v);
            return [px[0], px[1]];
        }, {
            threshold: SNAP_THRESHOLD,
            edgePenalty: 8,
            unproject: px => this.adapter!.unproject(px),
        });
    }

    private updateSnapIndicator(): void {
        if (!this.sharedLayersCreated) return;
        const snapFeatures = (this.effectiveSnap && this.snapPos)
            ? [{ type: 'Feature', geometry: { type: 'Point', coordinates: this.snapPos }, properties: {} }]
            : [];
        this.dispatch('webmapx-set-source-data', { id: SNAP_SOURCE_ID, data: { type: 'FeatureCollection', features: snapFeatures } });
    }

    // ─── Source updates ───────────────────────────────────────────────────────

    private updateRubberband(): void {
        if (!this.sharedLayersCreated) return;
        const rbFeatures: any[] = [];
        const draftFeatures: any[] = [];
        const drawing = isVertexDrawMode(this.mode);
        const endPos = (this.effectiveSnap && this.snapPos) ? this.snapPos : this.cursorPos;
        if (drawing && this.draftPoints.length > 0 && endPos) {
            const coords = [...this.draftPoints.map(p => [p[0], p[1]]), [endPos[0], endPos[1]]];
            rbFeatures.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} });
            for (const p of this.draftPoints) {
                draftFeatures.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [p[0], p[1]] }, properties: {} });
            }
        }
        this.dispatch('webmapx-set-source-data', { id: RUBBER_SOURCE_ID, data: { type: 'FeatureCollection', features: rbFeatures } });
        this.dispatch('webmapx-set-source-data', { id: DRAFT_SOURCE_ID, data: { type: 'FeatureCollection', features: draftFeatures } });
        // Snap indicator: show at snapPos when drawing
        const snapFeatures = (drawing && this.effectiveSnap && this.snapPos)
            ? [{ type: 'Feature', geometry: { type: 'Point', coordinates: this.snapPos }, properties: {} }]
            : [];
        this.dispatch('webmapx-set-source-data', { id: SNAP_SOURCE_ID, data: { type: 'FeatureCollection', features: snapFeatures } });
    }

    /** Delete and Attributes both persist a pick and preview a hover
     *  candidate side by side — merges the two without duplicating an id
     *  that's already picked (it already has its own dot). */
    private previewPlusPicked(picked: string[]): string[] {
        return this.hoveredFeatureId && !picked.includes(this.hoveredFeatureId)
            ? [...picked, this.hoveredFeatureId]
            : picked;
    }

    /**
     * Small solid nodes, in the layer's own colour: shown for a freshly-drawn
     * line/polygon (still in a draw mode — nothing else says which feature is
     * active), for every line/polygon currently picked in Delete mode
     * (`selectedFeatureIds`, click, rectangle or lasso), and — in Edit
     * "Move", Edit "Edit vertices" and Attributes — for whatever's hovered
     * that ISN'T the pinned feature (`hoveredFeatureId`), previewing what a
     * click would switch to. Delete, Attributes and Edit "Move" all keep
     * showing their own pin's dot(s) alongside that preview
     * (`previewPlusPicked` — click-pinned, see `handleClick`/
     * `handlePointerDown`), so the thing you're already working with never
     * disappears just because something else lit up nearby. "Edit vertices"
     * is the one exception: its pinned feature gets the hollow, white-cored
     * handles from `updateEditHandles` instead (which mean "draggable"), so
     * it never looks like the thing merely being previewed — `ids` leaves
     * the pin out entirely there rather than drawing both looks on it at
     * once. A point is its own only "node" already, so it's filtered out
     * below regardless of mode — it gets `updateMultiSelectSource`'s
     * highlighted dot in Delete/Attributes/Edit "Move" instead.
     */
    private updateSelectedSource(): void {
        if (!this.sharedLayersCreated) return;
        const ids = this.isSelectMode() ? this.previewPlusPicked(this.selectedFeatureIds)
            : this.mode === 'edit-vertices' ? (this.hoveredFeatureId ? [this.hoveredFeatureId] : [])
            : this.mode === 'attributes' || this.mode === 'edit-move'
                ? this.previewPlusPicked(this.selectedFeatureId ? [this.selectedFeatureId] : [])
            : this.selectedFeatureId ? [this.selectedFeatureId] : [];
        const nodeFeatures = ids.flatMap(id => {
            const f = this.features.find(f => f.id === id);
            const layer = f ? this.drawLayers.find(l => l.id === f.layerId) : undefined;
            if (!f || !layer || isPointType(f.type)) return [];
            return this.computeHandles(f)
                .filter(h => h.kind === 'vertex')
                .map(h => ({ type: 'Feature', geometry: { type: 'Point', coordinates: h.coords }, properties: { color: this.currentDrawLayerColor(layer) } }));
        });
        this.dispatch('webmapx-set-source-data', { id: ACTIVE_NODES_SOURCE_ID, data: { type: 'FeatureCollection', features: nodeFeatures } });
    }

    // ─── Vertex editing ──────────────────────────────────────────────────────

    private computeHandles(f: DrawFeature): EditHandle[] {
        const handles: EditHandle[] = [];
        if (f.type === 'Point') {
            handles.push({ kind: 'vertex', featureId: f.id, partIdx: 0, ringIdx: 0, vertIdx: 0, coords: f.coordinates as LngLat });
            return handles;
        }
        if (f.type === 'MultiPoint') {
            (f.coordinates as [number, number][]).forEach((pt, partIdx) => {
                handles.push({ kind: 'vertex', featureId: f.id, partIdx, ringIdx: 0, vertIdx: 0, coords: pt as LngLat });
            });
            return handles;
        }

        const addRing = (ring: [number, number][], partIdx: number, ringIdx: number, closed: boolean) => {
            const n = closed ? ring.length - 1 : ring.length; // skip closing duplicate
            for (let i = 0; i < n; i++) {
                handles.push({ kind: 'vertex', featureId: f.id, partIdx, ringIdx, vertIdx: i, coords: ring[i] as LngLat });
                if (!closed && i === n - 1) continue;
                const next = (i + 1) % n;
                const mid: LngLat = [(ring[i][0] + ring[next][0]) / 2, (ring[i][1] + ring[next][1]) / 2];
                handles.push({ kind: 'midpoint', featureId: f.id, partIdx, ringIdx, afterVertIdx: i, coords: mid });
            }
        };

        if (f.type === 'LineString') {
            addRing(f.coordinates as [number, number][], 0, 0, false);
        } else if (f.type === 'MultiLineString') {
            (f.coordinates as [number, number][][]).forEach((line, partIdx) => addRing(line, partIdx, 0, false));
        } else if (f.type === 'Polygon') {
            (f.coordinates as [number, number][][]).forEach((ring, ringIdx) => addRing(ring, 0, ringIdx, true));
        } else if (f.type === 'MultiPolygon') {
            (f.coordinates as [number, number][][][]).forEach((polygon, partIdx) => {
                polygon.forEach((ring, ringIdx) => addRing(ring, partIdx, ringIdx, true));
            });
        }
        return handles;
    }

    private updateEditHandles(): void {
        if (!this.sharedLayersCreated) return;
        const f = this.selectedFeatureId ? this.features.find(f => f.id === this.selectedFeatureId) : null;

        if (!f) {
            this.editHandles = [];
            this.selectedHandle = null;
            this.updateSelectedVertexSource();
            this.dispatch('webmapx-set-source-data', { id: EDIT_VERT_SOURCE, data: { type: 'FeatureCollection', features: [] } });
            this.dispatch('webmapx-set-source-data', { id: EDIT_MID_SOURCE,  data: { type: 'FeatureCollection', features: [] } });
            return;
        }

        // Drop stale selection if vertex count changed (e.g. after insert/delete) or feature switched
        if (this.selectedHandle && this.selectedHandle.featureId !== f.id) {
            this.selectedHandle = null;
            this.updateSelectedVertexSource();
        }

        this.editHandles = this.computeHandles(f);
        // These hollow, white-cored handles mean "draggable" — shown only in
        // Edit "Edit vertices" mode for the pinned feature (`editState ===
        // 'editing'`, set on click by `handlePointerDown`) or for a point
        // hovered in Edit "Move" mode, since a point's whole-feature move is
        // its one vertex's move. A line/polygon hovered in Edit "Move" mode
        // and a freshly-drawn feature both get the small solid, colour-matched
        // nodes from `updateSelectedSource` instead, so a feature that moves
        // as a whole is never confused with one whose individual points can
        // be dragged.
        const editing = this.editState === 'editing';

        const vertFeatures = editing
            ? this.editHandles
                .filter(h => h.kind === 'vertex')
                .map(h => ({ type: 'Feature', geometry: { type: 'Point', coordinates: h.coords }, properties: {} }))
            : [];

        const midFeatures = editing
            ? this.editHandles
                .filter(h => h.kind === 'midpoint')
                .map(h => ({ type: 'Feature', geometry: { type: 'Point', coordinates: h.coords }, properties: {} }))
            : [];

        this.dispatch('webmapx-set-source-data', { id: EDIT_VERT_SOURCE, data: { type: 'FeatureCollection', features: vertFeatures } });
        this.dispatch('webmapx-set-source-data', { id: EDIT_MID_SOURCE,  data: { type: 'FeatureCollection', features: midFeatures } });
    }

    private findHandleAt(px: [number, number]): EditHandle | null {
        let best: EditHandle | null = null;
        let bestDist = HANDLE_THRESHOLD;
        for (const h of this.editHandles) {
            const hp = this.adapter!.project(h.coords);
            const d = Math.hypot(px[0] - hp[0], px[1] - hp[1]);
            if (d < bestDist) { bestDist = d; best = h; }
        }
        return best;
    }

    private applyDragMove(f: DrawFeature, handle: EditHandle, newCoords: LngLat): void {
        const coords = JSON.parse(JSON.stringify(f.coordinates));
        if (handle.kind !== 'vertex') return;
        const { partIdx, ringIdx, vertIdx } = handle;
        if (f.type === 'Point') {
            f.coordinates = [newCoords[0], newCoords[1]];
            handle.coords = newCoords;
            return;
        } else if (f.type === 'MultiPoint') {
            coords[partIdx] = [newCoords[0], newCoords[1]];
        } else if (f.type === 'LineString') {
            coords[vertIdx] = [newCoords[0], newCoords[1]];
        } else if (f.type === 'MultiLineString') {
            coords[partIdx][vertIdx] = [newCoords[0], newCoords[1]];
        } else if (f.type === 'Polygon') {
            coords[ringIdx][vertIdx] = [newCoords[0], newCoords[1]];
            // Keep closing vertex in sync
            const ring = coords[ringIdx] as number[][];
            if (vertIdx === 0) ring[ring.length - 1] = ring[0];
        } else if (f.type === 'MultiPolygon') {
            coords[partIdx][ringIdx][vertIdx] = [newCoords[0], newCoords[1]];
            const ring = coords[partIdx][ringIdx] as number[][];
            if (vertIdx === 0) ring[ring.length - 1] = ring[0];
        }
        // Update in place (mutate the stored feature for live feedback)
        f.coordinates = coords;
        // Also update the handle position
        handle.coords = newCoords;
    }

    private translateCoordsGeoPreserving(coords: any, type: DrawGeometryType, dLng: number, dLat: number, origCentroidLng: number, origCentroidLat: number): any {
        // Scale longitude offsets so E-W km distances are preserved at the new latitude
        if (!isFinite(origCentroidLat) || !isFinite(origCentroidLng)) {
            return this.translateCoords(coords, type, dLng, dLat);
        }
        const newCentroidLat = origCentroidLat + dLat;
        const cosOrig = Math.cos(origCentroidLat * Math.PI / 180);
        const cosNew  = Math.cos(newCentroidLat  * Math.PI / 180);
        const lngScale = cosNew > 1e-6 ? cosOrig / cosNew : 1;
        const newCentroidLng = origCentroidLng + dLng;
        const t = (c: [number, number]): [number, number] => [
            newCentroidLng + (c[0] - origCentroidLng) * lngScale,
            c[1] + dLat
        ];
        if (type === 'Point') return t(coords as [number, number]);
        if (type === 'MultiPoint') return (coords as [number, number][]).map(t);
        if (type === 'LineString') return (coords as [number, number][]).map(t);
        if (type === 'MultiLineString') return (coords as [number, number][][]).map(line => line.map(t));
        if (type === 'Polygon') return (coords as [number, number][][]).map(ring => ring.map(t));
        if (type === 'MultiPolygon') return (coords as [number, number][][][]).map(polygon => polygon.map(ring => ring.map(t)));
        return coords;
    }

    private translateCoords(coords: any, type: DrawGeometryType, dLng: number, dLat: number): any {
        const t = (c: [number, number]): [number, number] => [c[0] + dLng, c[1] + dLat];
        if (type === 'Point') return t(coords as [number, number]);
        if (type === 'MultiPoint') return (coords as [number, number][]).map(t);
        if (type === 'LineString') return (coords as [number, number][]).map(t);
        if (type === 'MultiLineString') return (coords as [number, number][][]).map(line => line.map(t));
        if (type === 'Polygon') return (coords as [number, number][][]).map(ring => ring.map(t));
        if (type === 'MultiPolygon') return (coords as [number, number][][][]).map(polygon => polygon.map(ring => ring.map(t)));
        return coords;
    }

    private insertVertex(f: DrawFeature, h: MidpointHandle): void {
        const before: DrawFeature = { ...f, coordinates: JSON.parse(JSON.stringify(f.coordinates)) };
        const coords = JSON.parse(JSON.stringify(f.coordinates));
        const { partIdx, ringIdx, afterVertIdx } = h;
        if (f.type === 'LineString') {
            (coords as number[][]).splice(afterVertIdx + 1, 0, [h.coords[0], h.coords[1]]);
        } else if (f.type === 'MultiLineString') {
            (coords[partIdx] as number[][]).splice(afterVertIdx + 1, 0, [h.coords[0], h.coords[1]]);
        } else if (f.type === 'Polygon') {
            (coords[ringIdx] as number[][]).splice(afterVertIdx + 1, 0, [h.coords[0], h.coords[1]]);
        } else if (f.type === 'MultiPolygon') {
            (coords[partIdx][ringIdx] as number[][]).splice(afterVertIdx + 1, 0, [h.coords[0], h.coords[1]]);
        }
        f.coordinates = coords;
        this.pushHistory({ type: 'update', features: [before], afterFeatures: [{ ...f }] });
    }

    private updateSelectedVertexSource(): void {
        this.uiVersion++;
        if (!this.sharedLayersCreated) return;
        const features = this.selectedHandle
            ? [{ type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: this.selectedHandle.coords }, properties: {} }]
            : [];
        this.dispatch('webmapx-set-source-data', { id: SEL_VERT_SOURCE, data: { type: 'FeatureCollection', features } });
    }

    /** Remove the selected vertex from its feature. Returns false if removal would leave too few points. */
    private deleteSelectedVertex(): void {
        const h = this.selectedHandle;
        if (!h) return;
        const f = this.features.find(f => f.id === h.featureId);
        if (!f) return;

        const coords = JSON.parse(JSON.stringify(f.coordinates));
        const { partIdx, ringIdx, vertIdx } = h;

        if (f.type === 'LineString') {
            if (coords.length <= 2) return;
            coords.splice(vertIdx, 1);
        } else if (f.type === 'MultiLineString') {
            if (coords[partIdx].length <= 2) return;
            coords[partIdx].splice(vertIdx, 1);
        } else if (f.type === 'Polygon') {
            const ring = coords[ringIdx] as number[][];
            if (ring.length - 1 <= 3) return; // need >= 3 unique points
            if (vertIdx === 0 || vertIdx === ring.length - 1) {
                ring.splice(ring.length - 1, 1);
                ring.splice(0, 1);
                ring.push([...ring[0]]);
            } else {
                ring.splice(vertIdx, 1);
            }
        } else if (f.type === 'MultiPolygon') {
            const ring = coords[partIdx][ringIdx] as number[][];
            if (ring.length - 1 <= 3) return;
            if (vertIdx === 0 || vertIdx === ring.length - 1) {
                ring.splice(ring.length - 1, 1);
                ring.splice(0, 1);
                ring.push([...ring[0]]);
            } else {
                ring.splice(vertIdx, 1);
            }
        } else if (f.type === 'MultiPoint') {
            if (coords.length <= 1) return;
            coords.splice(partIdx, 1);
        } else {
            return; // single Point: nothing to remove
        }

        const before: DrawFeature = { ...f };
        f.coordinates = coords;
        const layer = this.drawLayers.find(l => l.id === f.layerId);
        if (layer) this.computeSpecialProperties(f, layer);
        this.pushHistory({ type: 'update', features: [before], afterFeatures: [{ ...f }] });
        this.features = [...this.features];
        this.refreshDrawLayerSource(f.layerId);

        this.selectedHandle = null;
        this.updateSelectedVertexSource();
        this.updateEditHandles();
    }

    // ─── Feature management ──────────────────────────────────────────────────

    private commitFeature(feature: DrawFeature, draftSnapshot?: LngLat[]): void {
        // Auto-assign sequential numeric id within the layer
        const layerFeatures = this.features.filter(f => f.layerId === feature.layerId);
        const maxId = layerFeatures.reduce((m, f) => {
            const n = parseInt(String(f.properties['id'] ?? 0), 10);
            return isNaN(n) ? m : Math.max(m, n);
        }, 0);
        feature.properties['id'] = maxId + 1;

        const layer = this.drawLayers.find(l => l.id === feature.layerId);
        if (layer) this.computeSpecialProperties(feature, layer);

        // Set create-time once at creation
        if (layer) {
            for (const p of layer.properties) {
                if (p.type === 'create-time') {
                    feature.properties[p.name] = Date.now();
                }
            }
        }

        this.pushHistory(draftSnapshot
            ? { type: 'finish', features: [feature], draftPoints: draftSnapshot.map(p => [p[0], p[1]] as LngLat) }
            : { type: 'add', features: [feature] });
        this.features = [...this.features, feature];
        this.refreshDrawLayerSource(feature.layerId);
        this.setModeInternal(this.mode);
        // Shown so attribute values can be filled in right away, but
        // deliberately left out of 'editing'/'selected' edit state (still
        // 'none', as `setModeInternal` above just set it) — `mode` is still
        // a draw-* mode here, ready for the next feature, and that mode's
        // click handling claims every click for "start/continue new
        // geometry". The attribute panel only keys off `selectedFeatureId`
        // (not `editState`), so it shows without needing "editing" here too.
        // Switch to Edit mode ("Move"/"Edit vertices") for an actual drag.
        this.selectedFeatureId = feature.id;
        this.updateSelectedSource();
        this.updateEditHandles();
    }

    deleteSelected(): void {
        const ids = this.selectedFeatureId ? [this.selectedFeatureId] : this.selectedFeatureIds;
        if (ids.length === 0) return;
        const idSet = new Set(ids);
        const deleted = this.features.filter(f => idSet.has(f.id));
        this.pushHistory({ type: 'delete', features: deleted });
        this.features = this.features.filter(f => !idSet.has(f.id));
        const affectedLayers = new Set(deleted.map(f => f.layerId));
        affectedLayers.forEach(id => this.refreshDrawLayerSource(id));
        this.selectedFeatureId = null;
        this.selectedFeatureIds = [];
        this.editState = 'none';
        this.editHandles = [];
        this.adapter?.setCursor('');
        this.updateSelectedSource();
        this.updateMultiSelectSource();
        this.updateEditHandles();
        this.exitToDrawIfLayerEmpty();
    }

    /**
     * Edit/Delete's pick-buttons go inert (see `renderEditingSession`'s
     * `layerHasFeatures`) once the active layer has no features left — this
     * falls back to that type's own draw mode, same as a fresh layer starts
     * in, so `mode` doesn't stay pointed at pick-buttons nobody can use.
     *
     * Skipped when there's a move/delete still sitting in `moveHistory` to
     * undo: switching to a draw-* mode would flip `isDrawMode()`, and the
     * global Ctrl+Z routes purely by current mode — undoing the very delete
     * that just emptied the layer would silently try the *draw* history
     * stack instead, which has nothing to do with it. Staying in
     * Select/Edit/Attributes keeps both Ctrl+Z and the still-visible (if
     * greyed) Undo button in Edit/Delete pointed at the right stack, until
     * something is actually undone or drawn.
     */
    private exitToDrawIfLayerEmpty(): void {
        if (!this.pickedType) return;
        if (!this.isSelectMode() && !this.isEditMode() && this.mode !== 'attributes') return;
        const layerId = this.activeLayerIds[this.pickedType];
        if (layerId && this.features.some(f => f.layerId === layerId)) return;
        if (this.moveHistoryIndex >= 0) return;
        this.setModeInternal(drawModeForType(this.pickedType));
    }

    // ─── History ─────────────────────────────────────────────────────────────

    /**
     * Routes to the Draw row's stack ('add'/'finish' — geometry being created)
     * or the Select row's ('update'/'delete' — both only ever happen to a
     * feature that's already selected, so undoing/redoing them belongs with
     * Select's history, not Draw's).
     */
    private pushHistory(entry: HistoryEntry): void {
        if (entry.type === 'update' || entry.type === 'delete') {
            this.moveHistory = this.moveHistory.slice(0, this.moveHistoryIndex + 1);
            this.moveHistory.push(entry);
            this.moveHistoryIndex = this.moveHistory.length - 1;
        } else {
            this.drawHistory = this.drawHistory.slice(0, this.drawHistoryIndex + 1);
            this.drawHistory.push(entry);
            this.drawHistoryIndex = this.drawHistory.length - 1;
        }
        this.uiVersion++;
    }

    private removeLastDraftPoint(): void {
        this.draftRedoStack.push(this.draftPoints.pop()!);
        this.uiVersion++;
        this.updateRubberband();
        this.updateHelpTextDuring();
    }

    /** Draw row's Undo — also steps back through an in-progress draft one point at a time. */
    private undoOrDraftBack(): void {
        if (this.draftPoints.length > 0) {
            this.removeLastDraftPoint();
        } else {
            this.undoDraw();
        }
    }

    /** Draw row's Redo — mirrors `undoOrDraftBack`. */
    private redoOrDraftForward(): void {
        if (this.draftRedoStack.length > 0) {
            this.draftPoints.push(this.draftRedoStack.pop()!);
            this.uiVersion++;
            this.updateRubberband();
            this.updateHelpTextDuring();
        } else {
            this.redoDraw();
        }
    }

    /**
     * Shared undo step for the Draw row: pops the most recent drawHistory
     * entry, removes its feature(s), and clears whatever selection/handles
     * were showing them. Returns the popped entry so callers can layer their
     * own behavior on top (`undoDraw`'s draft-reopening), or `null` if there
     * was nothing to undo.
     */
    private stepBackDrawHistory(): HistoryEntry | null {
        if (this.drawHistoryIndex < 0) return null;
        const entry = this.drawHistory[this.drawHistoryIndex--];
        this.uiVersion++;
        const affected = new Set<string>();
        // drawHistory only ever holds 'add'/'finish' — see `pushHistory`.
        const ids = new Set(entry.features.map(f => f.id));
        this.features = this.features.filter(f => !ids.has(f.id));
        entry.features.forEach(f => affected.add(f.layerId));
        this.selectedFeatureId = null;
        this.selectedFeatureIds = [];
        this.editState = 'none';
        this.updateSelectedSource();
        this.updateMultiSelectSource();
        this.updateEditHandles();
        affected.forEach(id => this.refreshDrawLayerSource(id));
        return entry;
    }

    private undoDraw(): void {
        const entry = this.stepBackDrawHistory();
        if (entry?.type === 'finish' && entry.draftPoints) {
            // Re-open the in-progress line/polygon, point-by-point undo can continue from here —
            // in the mode it was drawn in, or finishing it again would lose a line's dash.
            const feature = entry.features[0];
            this.mode = feature.type === 'LineString'
                ? (feature.dashed ? 'draw-line-dashed' : 'draw-line')
                : 'draw-polygon';
            this.draftPoints = entry.draftPoints.map(p => [p[0], p[1]] as LngLat);
            this.draftRedoStack = [];
            this.cursorPos = this.draftPoints[this.draftPoints.length - 1];
            this.updateRubberband();
            this.updateHelpTextDuring();
        }
    }

    /**
     * Draw row's trash button once a shape is finalized (`draftPoints`
     * empty) — deletes the just-drawn feature outright. Unlike Undo, never
     * reopens a line/polygon as an in-progress draft: "delete" should mean
     * gone, not "back to editing it". Still steps back the same drawHistory
     * index as Undo would, so Draw's own Redo brings the finished feature
     * back exactly as it was, same as any other undo/redo pair.
     */
    private deleteJustDrawnFeature(): void {
        this.stepBackDrawHistory();
    }

    private redoDraw(): void {
        if (this.drawHistoryIndex >= this.drawHistory.length - 1) return;
        const entry = this.drawHistory[++this.drawHistoryIndex];
        this.uiVersion++;
        const affected = new Set<string>();
        // drawHistory only ever holds 'add'/'finish' — see `pushHistory`.
        this.features = [...this.features, ...entry.features];
        entry.features.forEach(f => affected.add(f.layerId));
        affected.forEach(id => this.refreshDrawLayerSource(id));
        if (entry.type === 'finish') {
            const feature = entry.features[0];
            this.draftPoints = [];
            this.draftRedoStack = [];
            this.cursorPos = null;
            // Mirrors `commitFeature`: selected but left at 'none' edit state, so
            // this looks exactly like the original draw did (small solid nodes
            // via `updateSelectedSource`'s draw-mode fallback), not like Edit
            // "Edit vertices" mode's draggable handles.
            this.selectedFeatureId = feature.id;
            this.editState = 'none';
            this.updateSelectedSource();
            this.updateEditHandles();
            this.updateRubberband();
        }
    }

    /**
     * Re-selects whatever an undo/redo step just touched, instead of
     * blanking the selection — in Edit "Edit vertices" this is what keeps
     * its hollow handles visible across an undo/redo rather than the pin
     * silently dropping; in Edit "Move" it re-shows the solid nodes the same
     * way hover would; in Select/Attributes it just re-highlights what came
     * back. Pass an empty array when the step removed the feature(s)
     * entirely (redoing a delete) — there's nothing left to point at.
     */
    private reselectAfterHistoryStep(featureIds: string[]): void {
        this.selectedFeatureIds = featureIds;
        this.selectedFeatureId = featureIds.length === 1 ? featureIds[0] : null;
        const feature = this.selectedFeatureId ? this.features.find(f => f.id === this.selectedFeatureId) : null;
        // Mirrors handlePointerMove's own hover logic for these two modes, so
        // an undo/redo looks exactly like re-hovering/re-pinning the same
        // feature rather than inventing a third look for this moment.
        this.editState = !feature ? 'none'
            : this.mode === 'edit-vertices' ? 'editing'
            : this.mode === 'edit-move' ? (isPointType(feature.type) ? 'none' : 'selected')
            : 'none';
        // The red "this one vertex would be deleted" marker is tied to a
        // specific vertex index/coordinate (`selectedHandle`) — after an
        // undo/redo the geometry underneath it just changed (that's the
        // point of undo/redo), so a stale index or a now-wrong coordinate is
        // never a real, deliberate selection any more. `updateEditHandles`
        // only clears it when the *feature* changes, not when only its
        // shape does, so it's cleared explicitly here instead.
        this.selectedHandle = null;
        this.updateSelectedVertexSource();
        this.updateSelectedSource();
        this.updateMultiSelectSource();
        this.updateEditHandles();
    }

    /** Select's and Edit's shared Undo — a move (restore prior coordinates) or a
     *  delete (bring the feature(s) back), never something drawn — see `pushHistory`. */
    private undoMove(): void {
        if (this.moveHistoryIndex < 0) return;
        const entry = this.moveHistory[this.moveHistoryIndex--];
        this.uiVersion++;
        const affected = new Set<string>();
        if (entry.type === 'delete') {
            this.features = [...this.features, ...entry.features];
            entry.features.forEach(f => affected.add(f.layerId));
        } else {
            this.features = this.features.map(f => {
                const snap = entry.features.find(s => s.id === f.id);
                if (snap) { affected.add(f.layerId); return { ...f, coordinates: snap.coordinates }; }
                return f;
            });
        }
        // Either way, the entry's feature(s) are back in their pre-step form —
        // undoing a delete brings them back, undoing an update restores them
        // in place, so both leave something real to point back at.
        this.reselectAfterHistoryStep(entry.features.map(f => f.id));
        affected.forEach(id => this.refreshDrawLayerSource(id));
    }

    /** Select's and Edit's shared Redo — mirrors `undoMove`. */
    private redoMove(): void {
        if (this.moveHistoryIndex >= this.moveHistory.length - 1) return;
        const entry = this.moveHistory[++this.moveHistoryIndex];
        this.uiVersion++;
        const affected = new Set<string>();
        if (entry.type === 'delete') {
            const ids = new Set(entry.features.map(f => f.id));
            this.features = this.features.filter(f => !ids.has(f.id));
            entry.features.forEach(f => affected.add(f.layerId));
            // Redoing a delete removes them again — nothing left to select.
            this.reselectAfterHistoryStep([]);
        } else {
            const afterSnaps = entry.afterFeatures ?? entry.features;
            this.features = this.features.map(f => {
                const snap = afterSnaps.find(s => s.id === f.id);
                if (snap) { affected.add(f.layerId); return { ...f, coordinates: snap.coordinates }; }
                return f;
            });
            this.reselectAfterHistoryStep(entry.features.map(f => f.id));
        }
        affected.forEach(id => this.refreshDrawLayerSource(id));
        this.exitToDrawIfLayerEmpty();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private newId(): string {
        return `draw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    }

    private computeSpecialProperties(feature: DrawFeature, layer: DrawLayerConfig): void {
        for (const p of layer.properties) {
            switch (p.type) {
                case 'longitude':
                case 'latitude': {
                    const coords = feature.type === 'Point'
                        ? feature.coordinates as [number, number]
                        : this.centroid(feature);
                    feature.properties[p.name] = p.type === 'longitude' ? coords[0] : coords[1];
                    break;
                }
                case 'area':
                    feature.properties[p.name] = feature.type === 'Polygon'
                        ? this.polygonArea(feature.coordinates as number[][][])
                        : null;
                    break;
                case 'perimeter':
                case 'length':
                    feature.properties[p.name] = feature.type === 'Polygon'
                        ? this.ringLength((feature.coordinates as number[][][])[0])
                        : feature.type === 'LineString'
                            ? this.ringLength(feature.coordinates as number[][], false)
                            : null;
                    break;
                case 'update-time':
                    feature.properties[p.name] = Date.now();
                    break;
            }
        }
    }

    private centroid(feature: DrawFeature): [number, number] {
        let flat: number[][];
        switch (feature.type) {
            case 'Point':       flat = [feature.coordinates as number[]]; break;
            case 'MultiPoint':  flat = feature.coordinates as number[][]; break;
            case 'LineString':  flat = feature.coordinates as number[][]; break;
            case 'MultiLineString': flat = (feature.coordinates as number[][][]).flat(); break;
            case 'Polygon':     flat = (feature.coordinates as number[][][])[0]; break;
            case 'MultiPolygon': flat = (feature.coordinates as number[][][][]).flat(2); break;
            default:            flat = [];
        }
        if (flat.length === 0) return [0, 0];
        const sum = flat.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0]);
        return [sum[0] / flat.length, sum[1] / flat.length];
    }

    private haversineKm(a: number[], b: number[]): number {
        const R = 6371;
        const dLat = (b[1] - a[1]) * Math.PI / 180;
        const dLon = (b[0] - a[0]) * Math.PI / 180;
        const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(a[1] * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
    }

    private ringLength(coords: number[][], closed = true): number {
        let total = 0;
        const n = closed ? coords.length - 1 : coords.length - 1;
        for (let i = 0; i < n; i++) total += this.haversineKm(coords[i], coords[i + 1]);
        return Math.round(total * 1000); // metres
    }

    private polygonArea(rings: number[][][]): number {
        // Shoelace in degrees × correction ≈ m²
        const ring = rings[0];
        let area = 0;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
        }
        const degArea = Math.abs(area / 2);
        const latRad = ring[0][1] * Math.PI / 180;
        return Math.round(degArea * (111320 * Math.cos(latRad)) * 111320);
    }

    private withinPixelThreshold(a: LngLat, b: LngLat, thresholdPx: number): boolean {
        if (!this.adapter) return false;
        const pa = this.adapter.project(a);
        const pb = this.adapter.project(b);
        return Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) < thresholdPx;
    }

    /**
     * The layer of the editing session the panel is showing — the only layer a
     * click, rectangle or lasso may pick from. `activeLayerIds` holds a session
     * per geometry type, and another type's session keeps its features on the
     * map, but the toolbar acts on this one: lassoing in a Polygon session must
     * not select (and then delete) points from a Point session. A paused layer
     * is never the current session, so its features, which stay in memory after
     * leaving the map, are excluded as well.
     */
    private get currentSessionLayerId(): string | null {
        return this.pickedType ? this.activeLayerIds[this.pickedType] ?? null : null;
    }

    private findFeatureAt(clickPixel: [number, number], clickCoords: LngLat): DrawFeature | null {
        const TOL = 10;
        const layerId = this.currentSessionLayerId;
        for (const f of [...this.features].reverse()) {
            if (f.layerId !== layerId) continue;
            if (f.type === 'Point') {
                const fp = this.adapter!.project(f.coordinates as LngLat);
                if (Math.hypot(fp[0] - clickPixel[0], fp[1] - clickPixel[1]) < TOL) return f;
            } else if (f.type === 'MultiPoint') {
                for (const pt of f.coordinates as LngLat[]) {
                    const fp = this.adapter!.project(pt);
                    if (Math.hypot(fp[0] - clickPixel[0], fp[1] - clickPixel[1]) < TOL) return f;
                }
            } else if (f.type === 'LineString') {
                if (this.pixelNearPolyline(clickPixel, f.coordinates, TOL)) return f;
            } else if (f.type === 'MultiLineString') {
                if ((f.coordinates as [number, number][][]).some(line => this.pixelNearPolyline(clickPixel, line, TOL))) return f;
            } else if (f.type === 'Polygon') {
                if (this.pointInRing(clickCoords, f.coordinates[0]) ||
                    this.pixelNearPolyline(clickPixel, f.coordinates[0], TOL)) return f;
            } else if (f.type === 'MultiPolygon') {
                for (const polygon of f.coordinates as [number, number][][][]) {
                    const outerRing = polygon[0];
                    if (outerRing && (this.pointInRing(clickCoords, outerRing) ||
                        this.pixelNearPolyline(clickPixel, outerRing, TOL))) return f;
                }
            }
        }
        return null;
    }

    private pixelNearPolyline(px: [number, number], coords: [number, number][], tol: number): boolean {
        for (let i = 0; i < coords.length - 1; i++) {
            const a = this.adapter!.project(coords[i] as LngLat);
            const b = this.adapter!.project(coords[i + 1] as LngLat);
            if (this.distToSegment(px, a, b) < tol) return true;
        }
        return false;
    }

    private distToSegment(p: [number, number], a: [number, number], b: [number, number]): number {
        const dx = b[0] - a[0], dy = b[1] - a[1];
        if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
        const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
        return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
    }

    private pointInRing(pt: LngLat, ring: [number, number][]): boolean {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][0], yi = ring[i][1];
            const xj = ring[j][0], yj = ring[j][1];
            if (((yi > pt[1]) !== (yj > pt[1])) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) {
                inside = !inside;
            }
        }
        return inside;
    }

    private dispatch(event: string, detail: unknown): void {
        // See `boundMap`: once off the page, requests go to the map directly.
        const target = this.isConnected ? this : this.boundMap;
        target?.dispatchEvent(new CustomEvent(event, { detail, bubbles: true, composed: true }));
    }

    private updateHelpTextDuring(): void {
        const n = this.draftPoints.length;
        if (this.mode === 'draw-line' || this.mode === 'draw-line-dashed') {
            this.helpText = `${n} pt${n !== 1 ? 's' : ''}. Double-click or right-click to finish.`;
        } else if (this.mode === 'draw-polygon') {
            this.helpText = n >= 3
                ? `${n} pts. Click first point, double-click, or right-click to close.`
                : `${n} pt${n !== 1 ? 's' : ''}. Need at least 3 to close.`;
        }
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    /** The colourful type-grid, shared by the bare picker and the layer list — kept the
     *  same size and place in both so switching type is one click, never a step back. */
    private renderTypeGrid(activeType: GeometryType | null) {
        const types: GeometryType[] = ['Point', 'LineString', 'Polygon'];
        return html`
            <div class="type-grid">
                ${types.map(type => html`
                    <button type="button" class="type-card" data-type=${type} ?active=${type === activeType} aria-pressed=${type === activeType ? 'true' : 'false'} @click=${() => this.selectType(type)}>
                        <span class="type-icon">${drawTypeIcon(type)}</span>
                        <span class="type-name">${typeCardLabel(type)}</span>
                        <span class="type-count">${this.layerCountLabel(type)}</span>
                    </button>
                `)}
            </div>
        `;
    }

    private renderTypePicker() {
        return html`
            ${this.showDrawIntro ? html`<div class="flow-heading">What do you want to draw or edit?</div>` : ''}
            ${this.renderTypeGrid(null)}
        `;
    }

    private layerCountLabel(type: GeometryType): string {
        const n = this.drawLayers.filter(l => l.type === type).length + (this.catalogLayerCounts[type] ?? 0);
        return `${n} layer${n === 1 ? '' : 's'}`;
    }

    private renderLayerPicker() {
        const type = this.pickedType!;
        const layers = this.drawLayers.filter(l => l.type === type);
        const catalogOptions = this.catalogLayerOptions;
        const label = typeLabelPlural(type);
        const nothingToShow = layers.length === 0 && catalogOptions.length === 0;
        // The button's position mirrors which card is selected — left for
        // Point, centered for Line, right for Polygon — rather than adding a
        // fourth way (after the type grid and the highlighted card) to show
        // the same thing.
        const justify = type === 'Point' ? 'flex-start' : type === 'LineString' ? 'center' : 'flex-end';
        return html`
            ${this.showDrawIntro ? html`<div class="flow-heading">What do you want to draw or edit?</div>` : ''}
            ${this.renderTypeGrid(type)}
            <div class="layer-picker-header" style="justify-content:${justify}">
                <sl-button variant="default" size="small" class="add-layer-btn" @click=${() => this.createNewLayer()}>
                    <sl-icon slot="prefix" name="plus-lg"></sl-icon>
                    New layer
                </sl-button>
            </div>
            ${nothingToShow ? html`<p class="empty-state">No ${label.toLowerCase()} layers yet.</p>` : html`
                <div class="layer-list">
                    ${layers.length > 0 ? html`
                        ${catalogOptions.length > 0 ? html`<div class="section-label">Your layers</div>` : ''}
                        <div class="layer-group">
                            ${layers.map(l => html`
                                <div class="layer-row">
                                    <span class="color-dot color-dot--${swatchShape(l.type)}" style="${swatchStyle(this.currentDrawLayerColor(l), l.type)}"></span>
                                    <span class="layer-name-wrap">
                                        <span class="layer-name">${l.name || '(untitled)'}</span>
                                        <span class="feature-count">(${this.features.filter(f => f.layerId === l.id).length} features)</span>
                                    </span>
                                    <sl-button size="small" variant="primary" @click=${() => this.startEditingLayer(l)}>Edit</sl-button>
                                    <sl-tooltip content="Remove layer">
                                        <sl-icon-button name="trash" class="remove-layer-btn" label="Remove ${l.name}"
                                            @click=${(e: Event) => { e.stopPropagation(); this.releaseLayer(l); }}>
                                        </sl-icon-button>
                                    </sl-tooltip>
                                </div>
                            `)}
                        </div>
                    ` : ''}
                    ${catalogOptions.length > 0 ? html`
                        <div class="section-label" style=${layers.length > 0 ? 'margin-top:.5rem' : ''}>From the catalog</div>
                        <div class="layer-group">
                            ${catalogOptions.map(opt => html`
                                <div class="layer-row">
                                    <span class="color-dot color-dot--${swatchShape(type)}" style="${swatchStyle(MAP_LAYER_COLOR, type)}"></span>
                                    <span class="layer-name-wrap">
                                        <span class="layer-name">${opt.label}</span>
                                    </span>
                                    <sl-button size="small" variant="primary" @click=${() => { this.pendingCatalogEditOption = opt; }}>Edit</sl-button>
                                </div>
                            `)}
                        </div>
                    ` : ''}
                </div>
            `}

            <sl-dialog label="Edit ${this.pendingCatalogEditOption?.label ?? ''}?"
                ?open=${this.pendingCatalogEditOption !== null}
                @sl-request-close=${() => this.cancelEditCatalogLayer()}>
                ${this.pendingCatalogEditOption ? html`
                    You are about to create and edit a copy of &ldquo;${this.pendingCatalogEditOption.label}&rdquo;.
                    The original stays on the map, hidden in the Legend &mdash; you can show it again anytime.
                ` : ''}
                <sl-button slot="footer" @click=${() => this.cancelEditCatalogLayer()}>Cancel</sl-button>
                <sl-button slot="footer" variant="primary"
                    @click=${() => { if (this.pendingCatalogEditOption) this.startEditingCatalogLayer(this.pendingCatalogEditOption); }}>
                    Create a copy and edit
                </sl-button>
            </sl-dialog>
        `;
    }

    private renderEditingSession() {
        const type = this.pickedType!;
        const layerId = this.activeLayerIds[type];
        const layer = this.drawLayers.find(l => l.id === layerId);
        const drawMode = drawModeForType(type);
        const selFeature = this.features.find(f => f.id === this.selectedFeatureId);
        const selLayer = selFeature ? this.drawLayers.find(l => l.id === selFeature.layerId) : null;
        // Edit/Delete have nothing to act on until this layer has at least one
        // feature — showing their pick-buttons active invites a click that can
        // only ever find nothing, so those are disabled (not the whole row —
        // see the `moveHistoryIndex` check below) whenever this is false. Draw
        // is exempt: it's how that first feature gets made.
        const layerHasFeatures = layerId ? this.features.some(f => f.layerId === layerId) : false;

        return html`
            ${layer ? html`
                <div class="editing-title-row">
                    <span class="editing-title-label">You are editing:</span>
                    <div class="editing-title-second-row">
                        <span class="color-swatch-wrap">
                            <span class="color-swatch color-swatch--${swatchShape(layer.type)}" style="${swatchStyle(this.currentDrawLayerColor(layer), layer.type)}"
                                title="Layer color — style it from the Legend" aria-label="Layer color">
                            </span>
                        </span>
                        <sl-input class="editing-layer-name${this.layerNameInvalid ? ' name-invalid' : ''}" size="small" aria-label="Layer name" title="Click to rename"
                            .value=${this.layerNameDraft ?? layer.name}
                            @sl-input=${(e: Event) => { this.layerNameDraft = (e.target as any).value; }}
                            @keydown=${(e: KeyboardEvent) => {
                                if (e.key === 'Enter') this.commitLayerNameEdit(layer);
                                else if (e.key === 'Escape') this.cancelLayerNameEdit();
                            }}>
                            ${this.layerNameDraft !== null ? html`
                                <sl-icon-button slot="suffix" name="check-lg" label="Save name"
                                    class="editing-layer-name-confirm"
                                    ?disabled=${!this.layerNameDraftValid()}
                                    @click=${() => this.commitLayerNameEdit(layer)}>
                                </sl-icon-button>
                                <sl-icon-button slot="suffix" name="x-lg" label="Cancel rename"
                                    class="editing-layer-name-confirm"
                                    @click=${() => this.cancelLayerNameEdit()}>
                                </sl-icon-button>
                            ` : html`
                                <sl-icon slot="suffix" name="pencil" class="editing-layer-name-icon"
                                    @click=${() => this.editingLayerNameInput?.select()}></sl-icon>
                            `}
                        </sl-input>
                    </div>
                </div>
            ` : ''}

            <div class="toolbar-row">
                <span class="toolbar-label">Draw</span>
                <div class="pill">
                    ${this.toggleButton({
                        icon: type === 'Point' ? 'geo-fill' : type === 'LineString' ? 'slash-lg' : 'pentagon',
                        label: `Draw ${typeLabelPlural(type).toLowerCase()}`,
                        pressed: this.mode === drawMode,
                        onClick: () => this.setModeInternal(drawMode),
                    })}
                    ${type === 'LineString' ? html`
                        ${this.toggleButton({
                            src: dashLineIconUrl, name: 'dash-line', label: 'Draw dashed lines',
                            pressed: this.mode === 'draw-line-dashed',
                            onClick: () => this.setModeInternal('draw-line-dashed'),
                        })}
                    ` : ''}
                    ${type === 'Polygon' ? html`
                        ${this.toggleButton({
                            icon: 'circle', label: 'Draw circles',
                            pressed: this.mode === 'draw-circle',
                            onClick: () => this.setModeInternal('draw-circle'),
                        })}
                        ${this.toggleButton({
                            icon: 'square', label: 'Draw rectangles',
                            pressed: this.mode === 'draw-rectangle',
                            onClick: () => this.setModeInternal('draw-rectangle'),
                        })}
                    ` : ''}
                </div>
                ${this.isDrawMode() ? html`
                    <div class="history-actions">
                        <sl-tooltip content="Undo (${this.modKey}+Z)">
                            <sl-icon-button name="arrow-counterclockwise" size="small" label="Undo"
                                ?disabled=${this.drawHistoryIndex < 0 && this.draftPoints.length === 0}
                                @click=${() => this.undoOrDraftBack()}>
                            </sl-icon-button>
                        </sl-tooltip>
                        <sl-tooltip content="Redo (${this.modKey}+Y)">
                            <sl-icon-button name="arrow-clockwise" size="small" label="Redo"
                                ?disabled=${this.drawHistoryIndex >= this.drawHistory.length - 1 && this.draftRedoStack.length === 0}
                                @click=${() => this.redoOrDraftForward()}>
                            </sl-icon-button>
                        </sl-tooltip>
                        <div class="divider"></div>
                        <sl-tooltip content=${this.draftPoints.length > 0 ? 'Remove last point' : 'Delete this feature'}>
                            <sl-icon-button name="trash" size="small" class="delete-feature-btn"
                                label=${this.draftPoints.length > 0 ? 'Remove last point' : 'Delete this feature'}
                                ?disabled=${this.draftPoints.length === 0 && !this.selectedFeatureId}
                                @click=${() => this.draftPoints.length > 0 ? this.removeLastDraftPoint() : this.deleteJustDrawnFeature()}>
                            </sl-icon-button>
                        </sl-tooltip>
                    </div>
                ` : ''}
            </div>

            ${layerHasFeatures || this.moveHistoryIndex >= 0 ? html`
                <div class="toolbar-row">
                    <span class="toolbar-label">Edit</span>
                    <div class="pill">
                        ${this.toggleButton({
                            icon: 'arrows-move', label: 'Move features',
                            tooltip: 'Click a feature to select it, or drag it directly to move it',
                            pressed: this.mode === 'edit-move', disabled: !layerHasFeatures,
                            onClick: () => this.setModeInternal('edit-move'),
                        })}
                        ${this.toggleButton({
                            src: type === 'Polygon' ? editVerticesPolygonIconUrl : editVerticesIconUrl,
                            name: 'edit-vertices', label: 'Edit points',
                            tooltip: 'Click a feature to edit its points',
                            pressed: this.mode === 'edit-vertices', disabled: !layerHasFeatures,
                            onClick: () => this.setModeInternal('edit-vertices'),
                        })}
                        ${this.toggleButton({
                            src: featureValuesIconUrl, name: 'feature-values', label: 'Edit attributes',
                            tooltip: 'Hover a feature, then click it to view or edit its attributes',
                            pressed: this.mode === 'attributes', disabled: !layerHasFeatures,
                            onClick: () => this.setModeInternal('attributes'),
                        })}
                    </div>
                    ${this.isEditMode() ? html`
                        <div class="history-actions">
                            <sl-tooltip content="Undo (${this.modKey}+Z)">
                                <sl-icon-button name="arrow-counterclockwise" size="small" label="Undo"
                                    ?disabled=${this.moveHistoryIndex < 0}
                                    @click=${() => this.undoMove()}>
                                </sl-icon-button>
                            </sl-tooltip>
                            <sl-tooltip content="Redo (${this.modKey}+Y)">
                                <sl-icon-button name="arrow-clockwise" size="small" label="Redo"
                                    ?disabled=${this.moveHistoryIndex >= this.moveHistory.length - 1}
                                    @click=${() => this.redoMove()}>
                                </sl-icon-button>
                            </sl-tooltip>
                            ${this.mode === 'edit-vertices' ? html`
                                <div class="divider"></div>
                                <sl-tooltip content="Delete selected point">
                                    <sl-icon-button name="trash" size="small" class="delete-feature-btn" label="Delete selected point"
                                        ?disabled=${!this.selectedHandle}
                                        @click=${() => this.deleteSelectedVertex()}>
                                    </sl-icon-button>
                                </sl-tooltip>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            ` : ''}

            ${layerHasFeatures || this.moveHistoryIndex >= 0 ? html`
                <div class="toolbar-row">
                    <span class="toolbar-label">Delete</span>
                    <div class="pill">
                        ${this.toggleButton({
                            icon: 'hand-index-thumb', label: 'Select features by clicking',
                            tooltip: 'Click a feature to delete it',
                            pressed: this.mode === 'select', disabled: !layerHasFeatures,
                            onClick: () => this.setModeInternal('select'),
                        })}
                        ${this.toggleButton({
                            src: rectSelectIconUrl, name: 'rect-select', label: 'Select features in a rectangle',
                            tooltip: 'Drag a rectangle to delete the features inside it',
                            pressed: this.mode === 'select-rect', disabled: !layerHasFeatures,
                            onClick: () => this.setModeInternal('select-rect'),
                        })}
                        ${this.toggleButton({
                            src: lassoSelectIconUrl, name: 'lasso-select', label: 'Select features in a free-hand shape',
                            tooltip: 'Draw a free-hand shape to delete the features inside it',
                            pressed: this.mode === 'select-lasso', disabled: !layerHasFeatures,
                            onClick: () => this.setModeInternal('select-lasso'),
                        })}
                    </div>
                    ${this.isSelectMode() ? html`
                        <div class="history-actions">
                            <sl-tooltip content="Undo (${this.modKey}+Z)">
                                <sl-icon-button name="arrow-counterclockwise" size="small" label="Undo"
                                    ?disabled=${this.moveHistoryIndex < 0}
                                    @click=${() => this.undoMove()}>
                                </sl-icon-button>
                            </sl-tooltip>
                            <sl-tooltip content="Redo (${this.modKey}+Y)">
                                <sl-icon-button name="arrow-clockwise" size="small" label="Redo"
                                    ?disabled=${this.moveHistoryIndex >= this.moveHistory.length - 1}
                                    @click=${() => this.redoMove()}>
                                </sl-icon-button>
                            </sl-tooltip>
                            <div class="divider"></div>
                            <sl-tooltip content=${this.selectedFeatureIds.length > 1 ? `Delete ${this.selectedFeatureIds.length} selected` : 'Delete selected'}>
                                <sl-icon-button name="trash" size="small" class="delete-feature-btn"
                                    label=${this.selectedFeatureIds.length > 1 ? `Delete ${this.selectedFeatureIds.length} selected` : 'Delete selected'}
                                    ?disabled=${this.selectedFeatureIds.length === 0}
                                    @click=${() => this.deleteSelected()}>
                                </sl-icon-button>
                            </sl-tooltip>
                        </div>
                    ` : ''}
                </div>
            ` : ''}

            <div class="toolbar-row">
                <span class="toolbar-label">Tools</span>
                <div class="pill">
                    ${this.toggleButton({
                        icon: 'magnet', label: 'Snap to points and edges',
                        tooltip: `Snap to points and edges (${this.snapEnabled ? 'on' : 'off'}) — hold Alt to toggle`,
                        pressed: this.effectiveSnap,
                        onClick: () => {
                            this.snapEnabled = !this.snapEnabled;
                            if (!this.snapEnabled) { this.snapPos = null; this.updateRubberband(); }
                        },
                    })}
                </div>
            </div>

            <div class="help">${this.helpText}</div>

            ${this.isTouchDevice && (this.mode === 'draw-line' || this.mode === 'draw-line-dashed' || this.mode === 'draw-polygon') &&
              this.draftPoints.length >= (this.mode === 'draw-polygon' ? 3 : 2) ? html`
                <sl-button size="small" variant="primary" style="margin-bottom:.4rem;width:100%"
                    @click=${() => {
                        const geoType = modeToGeometryType(this.mode);
                        const lId = geoType ? this.activeLayerIds[geoType] : null;
                        if (lId) this.finishDraft(lId);
                    }}>
                    Finish
                </sl-button>
            ` : ''}

            ${selFeature && selLayer ? html`
                <div class="prop-row" style="margin-top:.5rem">
                    <span class="prop-label section-label" style="margin-bottom:0">Attribute</span>
                    <span class="prop-value section-label" style="margin-bottom:0">Value</span>
                </div>
                ${selLayer.properties.map(p => html`
                    <div class="prop-row" data-attr-name=${p.name}>
                        <span class="prop-label">${p.name}</span>
                        ${p.name === 'id' || ['longitude','latitude','area','perimeter','length','create-time','update-time'].includes(p.type)
                            ? html`<span class="prop-value" style="color:var(--color-text-muted, #6b7681);font-style:italic;padding:0 0.3rem">${
                                ['create-time','update-time'].includes(p.type)
                                    ? (selFeature.properties[p.name] ? new Date(selFeature.properties[p.name] as number).toLocaleString() : '—')
                                    : (selFeature.properties[p.name] ?? '—')
                            }</span>`
                            : p.type === 'imageURL'
                                ? html`<div class="prop-url-wrap">
                                        <sl-input size="small"
                                            .value=${String(selFeature.properties[p.name] ?? '')}
                                            placeholder="image URL"
                                            @sl-focus=${() => { this.lastFocusedAttributeName = p.name; }}
                                            @sl-change=${(e: Event) => {
                                                selFeature.properties[p.name] = (e.target as any).value;
                                                if (selLayer) this.computeSpecialProperties(selFeature, selLayer);
                                                this.features = [...this.features];
                                                this.refreshDrawLayerSource(selFeature.layerId);
                                            }}></sl-input>
                                        ${selFeature.properties[p.name] ? html`<img class="prop-img" src=${String(selFeature.properties[p.name])} @error=${(e: Event) => {
    const img = e.target as HTMLImageElement;
    const span = document.createElement('span');
    span.className = 'prop-img-error';
    span.textContent = '⚠ invalid image';
    img.replaceWith(span);
}}>` : ''}
                                       </div>`
                                : p.type === 'linkURL'
                                    ? html`<div class="prop-url-wrap">
                                            <sl-input size="small"
                                                .value=${String(selFeature.properties[p.name] ?? '')}
                                                placeholder="link URL"
                                                @sl-focus=${() => { this.lastFocusedAttributeName = p.name; }}
                                                @sl-change=${(e: Event) => {
                                                    selFeature.properties[p.name] = (e.target as any).value;
                                                    if (selLayer) this.computeSpecialProperties(selFeature, selLayer);
                                                    this.features = [...this.features];
                                                    this.refreshDrawLayerSource(selFeature.layerId);
                                                }}></sl-input>
                                            ${selFeature.properties[p.name] ? html`<a class="prop-link" href=${String(selFeature.properties[p.name])} target="_blank" rel="noopener noreferrer">${selFeature.properties[p.name]}</a>` : ''}
                                           </div>`
                                    : html`<sl-input size="small" class="prop-value"
                                            .value=${String(selFeature.properties[p.name] ?? '')}
                                            @sl-focus=${() => { this.lastFocusedAttributeName = p.name; }}
                                            @sl-change=${(e: Event) => {
                                                selFeature.properties[p.name] = (e.target as any).value;
                                                if (selLayer) this.computeSpecialProperties(selFeature, selLayer);
                                                this.features = [...this.features];
                                                this.refreshDrawLayerSource(selFeature.layerId);
                                            }}></sl-input>`
                        }
                    </div>
                `)}
            ` : ''}

            ${layer ? html`
                <sl-dialog id="attributes-dialog" label="Attributes">
                    <div class="prop-table-wrap">
                        <div class="prop-grid" role="table">
                            <div class="prop-grid-row prop-grid-header" role="row">
                                <span class="prop-grid-cell" role="columnheader">Attribute</span>
                                <span class="prop-grid-cell" role="columnheader">Type</span>
                                <span class="prop-grid-cell" role="columnheader"></span>
                            </div>
                            ${layer.properties.map((p, i) => html`
                                <div class="prop-grid-row ${p.name === 'id' ? 'prop-row-auto' : ''}" role="row">
                                    <span class="prop-grid-cell" role="cell">
                                        ${this.renamingAttributeIndex === i ? html`
                                            <div class="rename-attr-row">
                                                <sl-input size="small" autofocus
                                                    .value=${this.renameAttrDraft}
                                                    @sl-input=${(e: Event) => { this.renameAttrDraft = (e.target as any).value; }}
                                                    @keydown=${(e: KeyboardEvent) => {
                                                        if (e.key === 'Enter') this.commitRenameAttribute(layer, i);
                                                        else if (e.key === 'Escape') this.cancelRenameAttribute();
                                                    }}>
                                                </sl-input>
                                                <sl-icon-button name="check-lg" label="Save name"
                                                    ?disabled=${!this.renameAttributeDraftValid(layer, i)}
                                                    @click=${() => this.commitRenameAttribute(layer, i)}>
                                                </sl-icon-button>
                                                <sl-icon-button name="x-lg" label="Cancel rename"
                                                    @click=${() => this.cancelRenameAttribute()}>
                                                </sl-icon-button>
                                            </div>
                                        ` : html`
                                            <div class="prop-name-cell">
                                                <span class="prop-cell-text" title=${p.name}>${p.name}</span>
                                                ${this.canRenameAttribute(p) ? html`
                                                    <sl-icon-button name="pencil" class="rename-attr-btn" label="Rename property"
                                                        @click=${() => this.startRenameAttribute(i, p.name)}>
                                                    </sl-icon-button>
                                                ` : ''}
                                            </div>
                                        `}
                                    </span>
                                    <span class="prop-grid-cell" role="cell">
                                        <span class="prop-cell-text" title=${p.type}>${TYPE_LABELS[p.type] ?? p.type}${p.name === 'id' ? ' (auto)' : ''}</span>
                                    </span>
                                    <span class="prop-grid-cell prop-grid-cell--actions" role="cell">
                                        ${i === 0 || this.renamingAttributeIndex === i ? '' : html`
                                            <sl-icon-button name="trash" class="remove-attr-btn" label="Remove property"
                                                @click=${() => this.removeActiveLayerProperty(layer, i)}>
                                            </sl-icon-button>
                                        `}
                                    </span>
                                </div>
                            `)}
                        </div>
                    </div>

                    ${this.addingAttribute ? html`
                        <div class="add-attr-form">
                            <div class="add-attr-fields-row">
                                <sl-input size="small" class="add-attr-name-input" placeholder="Add attribute name" aria-label="Attribute name" autofocus
                                    .value=${this.newAttrName}
                                    @sl-input=${(e: Event) => { this.newAttrName = (e.target as any).value; }}
                                    @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.newAttrName.trim() && this.addActiveLayerProperty(layer)}>
                                </sl-input>
                                ${this.newAttrName.trim() ? html`
                                    <sl-select size="small" hoist class="add-attr-type-select" placeholder="Choose a type" aria-label="Attribute type" value=${this.newAttrType}
                                        @sl-change=${(e: Event) => { this.newAttrType = (e.target as any).value; }}>
                                        ${PROPERTY_TYPES[layer.type].filter(t => !AUTO_PROPERTY_TYPES.has(t)).map(t => html`
                                            <sl-option value=${t}>${TYPE_LABELS[t] ?? t}</sl-option>
                                        `)}
                                    </sl-select>
                                ` : ''}
                                <sl-button size="small" variant="primary"
                                    ?disabled=${!(this.newAttrName.trim() && this.newAttrType)}
                                    @click=${() => this.addActiveLayerProperty(layer)}>
                                    OK
                                </sl-button>
                                <sl-icon-button name="x-lg" label="Cancel" @click=${() => this.cancelAddAttribute()}></sl-icon-button>
                            </div>
                            <div class="add-attr-undo-row">${this.renderAttributeUndoRedo(layer)}</div>
                            <div class="add-attr-note">New attributes are added to the bottom of the list above.</div>
                        </div>
                    ` : html`
                        <div class="add-attr-row">
                            <sl-button variant="default" size="small" class="add-attr-btn-below"
                                @click=${() => { this.addingAttribute = true; }}>
                                <sl-icon slot="prefix" name="plus-lg"></sl-icon>
                                Add attribute
                            </sl-button>
                            ${this.renderAttributeUndoRedo(layer)}
                        </div>
                    `}

                    <sl-dropdown slot="footer" placement="top-start" class="optional-attrs-dropdown">
                        <sl-button slot="trigger" size="small" caret class="optional-attrs-trigger">
                            Optional attributes
                        </sl-button>
                        <div class="auto-attr-dropdown-panel">
                            ${this.availableAutoAttributeTypes(layer).map(t => html`
                                <label class="auto-attr-checkbox">
                                    <input type="checkbox"
                                        .checked=${this.isAutoAttributeChecked(layer, t)}
                                        @change=${() => this.toggleAutoAttribute(layer, t)}>
                                    ${AUTO_PROPERTY_DEFAULTS[t]?.label ?? t}
                                </label>
                            `)}
                        </div>
                    </sl-dropdown>
                    <sl-button slot="footer" size="small" variant="primary" @click=${() => this.attributesDialog?.hide()}>Done</sl-button>
                </sl-dialog>
            ` : ''}
        `;
    }

    /**
     * The editing session's bottom bar — "Edit attributes" and "Done" —
     * rendered as a sibling of `.scroll-content` rather than at the bottom of
     * it, so it's pinned to the panel and stays visible instead of scrolling
     * out of view once a layer has enough attributes to fill the panel.
     */
    private renderSessionFooter() {
        const type = this.pickedType!;
        const layerId = this.activeLayerIds[type];
        const layer = this.drawLayers.find(l => l.id === layerId);
        if (!layer) return '';
        return html`
            <div class="session-footer">
                <sl-button variant="default" size="small" @click=${() => this.attributesDialog?.show()}>
                    <sl-icon slot="prefix" name="table"></sl-icon>
                    Edit attributes (${layer.properties.length})
                </sl-button>
                <span class="footer-spacer"></span>
                ${this.layerNameInvalid ? html`<span class="name-required-hint">Give the new layer a name.</span>` : ''}
                <sl-button size="small" variant="primary" @click=${() => this.confirmDone()}>Done</sl-button>
            </div>
        `;
    }

    /**
     * An on/off button in the draw toolbar. A native <button> rather than
     * sl-icon-button, because only a real button can carry `aria-pressed`: the
     * mode buttons and snap are toggles, and a screen reader otherwise hears
     * "Draw polygon, button" with no word on whether it is the active mode.
     * `name` is the built-in icon name, or the image file's name for a
     * custom icon, which is how the UI tests address them.
     */
    private toggleButton(opts: {
        icon?: string;
        src?: string;
        name?: string;
        label: string;
        pressed: boolean;
        disabled?: boolean;
        tooltip?: string;
        onClick: () => void;
    }): TemplateResult {
        const { icon, src, label, pressed, disabled = false, tooltip = label, onClick } = opts;
        const name = opts.name ?? icon ?? '';
        return html`
            <sl-tooltip content=${tooltip}>
                <button type="button" class="toggle-button" name=${name}
                    aria-label=${label} aria-pressed=${pressed ? 'true' : 'false'}
                    ?disabled=${disabled}
                    @click=${onClick}>
                    ${src
                        ? html`<sl-icon src=${src} aria-hidden="true"></sl-icon>`
                        : html`<sl-icon name=${icon} aria-hidden="true"></sl-icon>`}
                </button>
            </sl-tooltip>`;
    }

    render() {
        return html`
            <div class="scroll-content">
                ${this.panelView === 'type' ? this.renderTypePicker()
                    : this.panelView === 'layers' ? this.renderLayerPicker()
                    : this.renderEditingSession()}
            </div>
            ${this.panelView === 'editing' ? this.renderSessionFooter() : ''}
        `;
    }
}


function modeToGeometryType(mode: DrawMode): GeometryType | null {
    if (mode === 'draw-point')   return 'Point';
    if (mode === 'draw-line' || mode === 'draw-line-dashed') return 'LineString';
    if (mode === 'draw-polygon' || mode === 'draw-circle' || mode === 'draw-rectangle') return 'Polygon';
    return null;
}

/** The draw mode a freshly picked/started layer of this type opens into — the
 *  type's primary (leftmost) tool, never a sub-tool like Dashed or Rectangle. */
function drawModeForType(type: GeometryType): DrawMode {
    return type === 'Point' ? 'draw-point' : type === 'LineString' ? 'draw-line' : 'draw-polygon';
}

/** Modes that build geometry by clicking vertices one at a time — as opposed
 *  to a single click-drag gesture (circle, rectangle). */
function isVertexDrawMode(mode: DrawMode): boolean {
    return mode === 'draw-point' || mode === 'draw-line' || mode === 'draw-line-dashed' || mode === 'draw-polygon';
}

function typeLabelPlural(type: GeometryType): string {
    return type === 'Point' ? 'Points' : type === 'LineString' ? 'Lines' : 'Polygons';
}

/** BEM-style modifier for a colour swatch — a dot for Point, a bar for LineString, a square for Polygon. */
function swatchShape(type: GeometryType): 'point' | 'line' | 'polygon' {
    return type === 'Point' ? 'point' : type === 'LineString' ? 'line' : 'polygon';
}

/**
 * Inline style for a colour swatch: a solid dot/bar for Point/LineString, but
 * a light tint with a full-colour outline for Polygon, so it reads as an
 * area rather than a solid chip. `color` is always a plain 6-digit hex (from
 * `<input type="color">` or a hardcoded constant), so appending two hex
 * digits is a safe, dependency-free way to add alpha.
 */
function swatchStyle(color: string, type: GeometryType): string {
    return type === 'Polygon' ? `border-color:${color};background:${color}33` : `background:${color}`;
}

/** Whether `name` is still an auto-assigned default (`nextDefaultLayerName`) rather than something the user chose. */
function isDefaultLayerName(name: string): boolean {
    const trimmed = name.trim();
    return trimmed === DEFAULT_LAYER_NAME || new RegExp(`^${DEFAULT_LAYER_NAME} \\(\\d+\\)$`).test(trimmed);
}

/** Type-picker card label — names the layer it leads to, not just the geometry. */
function typeCardLabel(type: GeometryType): string {
    return `Layer with ${typeLabelPlural(type).toLowerCase()}`;
}

function isSupportedDrawGeometryType(type: GeoJSON.Geometry['type']): type is DrawGeometryType {
    return type === 'Point' || type === 'MultiPoint' ||
        type === 'LineString' || type === 'MultiLineString' ||
        type === 'Polygon' || type === 'MultiPolygon';
}

function isPointType(type: DrawGeometryType): boolean {
    return type === 'Point' || type === 'MultiPoint';
}

function isLineType(type: DrawGeometryType): boolean {
    return type === 'LineString' || type === 'MultiLineString';
}

declare global {
    interface HTMLElementTagNameMap {
        'webmapx-draw-tool': WebmapxDrawTool;
    }
}
