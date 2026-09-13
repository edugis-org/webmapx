import { html, css } from 'lit';
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
import type { DrawLayerConfig, GeometryType, PropertyDef } from './webmapx-draw-layer-dialog';
import { PROPERTY_TYPES, TYPE_LABELS, AUTO_PROPERTY_TYPES, AUTO_PROPERTY_DEFAULTS, newLayerConfig } from './webmapx-draw-layer-dialog';
import { unregisterMapLayer } from '../map/map-layer-registry';
import { findSnap } from '../utils/snap-utils';
import { haversineDistanceCm, formatDistance, circlePolygonRing } from '../utils/geo-calculations';
import { DATA_TOOL, DATA_TOOL_HALO } from '../theme/data-colors';
import dashLineIconUrl from '../icons/dash-line.svg?url';

// ─── Shared source / layer IDs ────────────────────────────────────────────────

const RUBBER_SOURCE_ID = 'webmapx-draw-rubber-source';
const RUBBER_LINE_ID   = 'webmapx-draw-rubber-line';
const VERTEX_SOURCE_ID = 'webmapx-draw-vertex-source';
const VERTEX_LAYER_ID  = 'webmapx-draw-vertex-layer';

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

const SEL_SOURCE_ID = 'webmapx-draw-sel-source';
const SEL_POINT_ID  = 'webmapx-draw-sel-point';
const DRAFT_SOURCE_ID = 'webmapx-draw-draft-source';
const DRAFT_POINT_ID  = 'webmapx-draw-draft-points';

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

export type DrawMode = 'select' | 'draw-point' | 'draw-line' | 'draw-line-dashed' | 'draw-polygon' | 'draw-circle' | 'draw-rectangle';
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

    /**
     * Layers explicitly paused via "Stop editing" — kept in `drawLayers` (so
     * they still list under their type) but off the map until "Start editing"
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

    /** Points collected for the current in-progress line/polygon. */
    private draftPoints: LngLat[] = [];
    private draftRedoStack: LngLat[] = [];
    private cursorPos: LngLat | null = null;

    /** Center + live radius of a circle being dragged out (draw-circle mode). */
    private circleDraft: { center: LngLat; radiusM: number } | null = null;

    /** Opposite corners of a rectangle being dragged out (draw-rectangle mode). */
    private rectDraft: { corner1: LngLat; corner2: LngLat } | null = null;

    /** Active layer id per geometry type. */
    private activeLayerIds: Partial<Record<GeometryType, string>> = {};

    private history: HistoryEntry[] = [];
    private historyIndex = -1;

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
    private hoveredHandle: EditHandle | null = null;
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

    @query('#attributes-dialog')
    private attributesDialog!: SlDialog | null;

    // ── Inline layer configuration (editing session) ─────────────────────────
    /** Whether the "Add attribute" form is expanded in the attributes dialog. */
    @state() private addingAttribute = false;
    /** The add-attribute form's draft input, for the active layer's property table. */
    @state() private newAttrName = '';
    /** Empty until explicitly chosen — the dropdown shows a placeholder rather
     *  than silently defaulting to a type the user never actually picked. */
    @state() private newAttrType: PropertyDef['type'] | '' = '';

    // ─── Styles ───────────────────────────────────────────────────────────────

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            padding: var(--webmapx-tool-padding, 0);
            min-width: 200px;
            max-height: var(--webmapx-draw-tool-max-height, 100%);
            overflow: hidden;
        }

        .scroll-content {
            flex: 1;
            overflow-y: auto;
            min-height: 0;
        }

        /* Each row is its own boxed pill: select, draw shape, the snap
           toggle, and the history actions, so the four kinds of control
           read as separate groups instead of one long strip of icons. */
        .pill {
            display: inline-flex;
            gap: 0.15rem;
            padding: 3px;
            border: 1px solid var(--color-background-secondary, #e2e5e8);
            border-radius: 8px;
            flex-shrink: 0;
        }
        .toolbar-row {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            flex-wrap: wrap;
            margin-bottom: 0.5rem;
            flex-shrink: 0;
        }
        sl-icon-button[active]::part(base) {
            color: #fff;
            background: var(--sl-color-primary-600);
            border-radius: 6px;
            box-shadow: 0 2px 6px -2px var(--sl-color-primary-600);
        }
        sl-icon-button:not([active]):not([disabled])::part(base):hover {
            background: var(--color-background-secondary, #e8ebee);
            border-radius: 6px;
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

        .layer-picker-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }
        .layer-picker-header .flow-heading {
            margin-bottom: 0;
        }

        .flow-breadcrumb, .editing-title-row {
            display: flex;
            align-items: center;
            gap: 0.3rem;
            margin-bottom: 0.5rem;
        }
        /* Sits next to the arrow instead of the row's own title/name, which
           now goes on its own line below — "Back" reads as a control on the
           arrow's row, not as a second, competing heading. */
        .flow-back-label {
            font-size: 0.8rem;
            font-weight: 500;
            color: var(--color-text-secondary, #4a5568);
            cursor: pointer;
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

        .type-card sl-icon {
            font-size: 1.4rem;
            color: var(--sl-color-primary-600);
        }

        .type-name { font-size: 0.78rem; font-weight: 600; }
        .type-count { font-size: 0.68rem; color: var(--color-text-muted, #6b7681); }

        .empty-state {
            font-size: 0.82rem;
            color: var(--color-text-muted, #6b7681);
            padding: 0.4rem 0;
        }

        .layer-list {
            display: flex;
            flex-direction: column;
            gap: 0.15rem;
            margin-bottom: 0.5rem;
        }

        .layer-row {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-size: 0.85rem;
        }

        .layer-row:hover {
            background: var(--color-background-secondary, #f4f6f8);
        }

        .remove-layer-btn {
            font-size: 0.75rem;
            opacity: 0;
            transition: opacity var(--webmapx-motion-fast, 120ms);
        }

        .layer-row:hover .remove-layer-btn,
        .layer-row:focus-within .remove-layer-btn {
            opacity: 1;
        }

        .color-dot {
            width: 10px; height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .layer-name { flex: 1; }

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
        /* A muted pencil is the "click to rename" tell — cheap to notice at a
           glance, unlike a hover-only border that only confirms editability
           after the user already suspected it. */
        .editing-layer-name-icon {
            color: var(--color-text-muted, #9aa4ad);
            font-size: 0.85rem;
        }
        .editing-layer-name:hover .editing-layer-name-icon,
        .editing-layer-name:focus-within .editing-layer-name-icon {
            color: var(--sl-color-primary-500, #3d97e8);
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
            border-radius: 4px;
            border: 1px solid var(--color-background-secondary, #e2e5e8);
            /* Purely the visible swatch — the real, clickable control is the
               color input layered on top of it (see .editing-color-input). */
            pointer-events: none;
        }
        /* A color input set to display:none has no rendered box for the
           browser to anchor its native picker popup to, so it opens pinned
           at the document's top-left corner instead of near the swatch.
           Keeping it in the layout — sized and positioned exactly over the
           visible swatch, just invisible — gives it real screen coordinates
           to anchor the picker to. */
        .editing-color-input {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            border: 0;
            opacity: 0;
            cursor: pointer;
        }

        .prop-table-wrap {
            overflow-x: auto;
            overflow-y: auto;
            max-height: 220px;
            margin-top: 0.4rem;
            border: 1px solid var(--color-background-secondary, #e2e7ec);
            border-radius: 4px;
        }
        .prop-table {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
            font-size: 0.76rem;
        }
        .prop-table th {
            text-align: left;
            background: var(--color-background-secondary, #f4f6f8);
            padding: 0.2rem 0.35rem;
            border-bottom: 1px solid var(--color-background-secondary, #e2e7ec);
            position: sticky;
            top: 0;
        }
        .prop-table td {
            padding: 0.15rem 0.35rem;
            border-bottom: 1px solid var(--color-background-secondary, #e2e7ec);
            vertical-align: middle;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .prop-table th:nth-child(1), .prop-table td:nth-child(1) { width: 42%; }
        .prop-table th:nth-child(2), .prop-table td:nth-child(2) { width: 38%; }
        .prop-table th:nth-child(3), .prop-table td:nth-child(3) { width: 2.4rem; padding-left: 0; padding-right: 0.2rem; text-align: right; }
        .prop-table tr:last-child td { border-bottom: none; }
        .prop-row-auto td { color: var(--color-text-muted, #6b7681); font-style: italic; }

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

        .add-attr-form {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-top: 0.6rem;
            padding: 0.6rem;
            border: 1px solid var(--color-background-secondary, #e2e7ec);
            border-radius: 6px;
        }
        .add-attr-name-row {
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }
        .add-attr-name-row sl-input {
            flex: 1;
        }
        .type-picker-instruction {
            font-size: 0.78rem;
            color: var(--color-text-secondary, #5a6773);
            margin-top: 0.3rem;
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
        .add-attr-note {
            font-size: 0.72rem;
            color: var(--color-text-muted, #6b7681);
            margin-top: 0.1rem;
        }
        .add-attr-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.4rem;
            margin-top: 0.2rem;
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
        .feature-row.selected { background: var(--sl-color-primary-100); }

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
            const unsub = this.adapter?.store.subscribe((state) => {
                if (state.mapLoaded) {
                    unsub?.();
                    this.createSharedLayers();
                }
            });
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
        // "Start editing" brings them back.
        for (const layer of this.drawLayers) {
            if (this.pausedLayerIds.has(layer.id)) continue;
            this.resumeDrawLayer(layer);
        }
        for (const id of [RUBBER_SOURCE_ID, VERTEX_SOURCE_ID, SEL_SOURCE_ID, DRAFT_SOURCE_ID, EDIT_VERT_SOURCE, EDIT_MID_SOURCE, SEL_VERT_SOURCE, SNAP_SOURCE_ID]) {
            this.dispatchEvent(new CustomEvent('webmapx-suppress-busy-for-source', { detail: id, bubbles: true, composed: true }));
        }
        this.bindEvents();
        window.addEventListener('keydown', this.onKeyDown, true);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('blur', this.onWindowBlur);
        this.setModeInternal('select');
        void this.refreshTypeCatalogCounts();
    }

    protected onDeactivate(): void {
        this.unsubMapLayers?.();
        this.unsubMapLayers = null;
        for (const id of [RUBBER_SOURCE_ID, VERTEX_SOURCE_ID, SEL_SOURCE_ID, DRAFT_SOURCE_ID, EDIT_VERT_SOURCE, EDIT_MID_SOURCE, SEL_VERT_SOURCE, SNAP_SOURCE_ID]) {
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
        this.altActive = false;
        // Restore borrowed sources and suspend draw layers from the map (keep features in memory)
        for (const layer of this.drawLayers) {
            if (layer.borrowedSourceId) this.restoreBorrowedLayer(layer);
            this.suspendDrawLayerFromMap(layer);
        }
        this.draftPoints = [];
        this.circleDraft = null;
        this.cursorPos = null;
        this.snapPos = null;
        this.lastCursorPx = null;
        this.dragging = null;
        this.featureDrag = null;
        this.selectedFeatureId = null;
        this.editState = 'none';
        this.editHandles = [];
        this.hoveredHandle = null;
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
        this.removeAllMapLayers();   // full cleanup when component is removed
        super.disconnectedCallback();
    }

    protected onMapAttached(adapter: IMap): void {
        super.onMapAttached(adapter);
    }

    protected onMapDetached(): void {
        this.removeAllMapLayers();
        super.onMapDetached();
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

        // Selected point highlight (lines/polygons use vertex handles instead)
        this.dispatch('webmapx-add-source', { id: SEL_SOURCE_ID, config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } });
        this.dispatch('webmapx-add-layer', {
            id: SEL_POINT_ID, type: 'circle', source: SEL_SOURCE_ID,
            metadata: { isToolLayer: true, hideFromLegend: true },
            paint: {
                'circle-radius': SELECTED_VERTEX_RADIUS,
                'circle-color': this.cssVar('--webmapx-draw-selected-color', SELECTED_VERTEX_COLOR)
            }
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

        this.sharedLayersCreated = true;

        // Re-add any draw layers from prior activation
        for (const layer of this.drawLayers) {
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
        this.dispatch('webmapx-add-layer', drawLayerSpec(cfg.id, cfg, cfg.color, {
            label: cfg.name, legendRole: 'overlay', hideFromLegend: true,
        }));
        this.createdDrawLayerIds.add(cfg.id);
    }

    private removeMapLayersForDrawLayer(cfg: DrawLayerConfig): void {
        this.dispatch('webmapx-remove-layer', cfg.id);
        this.dispatch('webmapx-remove-source', drawSourceId(cfg.id, cfg.type));
        if (this.adapter?.store) unregisterMapLayer(this.adapter.store, cfg.id);
        this.createdDrawLayerIds.delete(cfg.id);
    }

    private removeSharedLayers(): void {
        for (const id of [RUBBER_LINE_ID, VERTEX_LAYER_ID, SEL_POINT_ID, DRAFT_POINT_ID, EDIT_VERT_LAYER, EDIT_MID_LAYER, SEL_VERT_LAYER, SNAP_LAYER_ID]) {
            this.dispatch('webmapx-remove-layer', id);
        }
        for (const id of [RUBBER_SOURCE_ID, VERTEX_SOURCE_ID, SEL_SOURCE_ID, DRAFT_SOURCE_ID, EDIT_VERT_SOURCE, EDIT_MID_SOURCE, SEL_VERT_SOURCE, SNAP_SOURCE_ID]) {
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
            this.undoOrDraftBack();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            this.redoOrDraftForward();
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
    }

    private unbindEvents(): void {
        this.unsubClick?.(); this.unsubClick = null;
        this.unsubMove?.();  this.unsubMove  = null;
        this.unsubCtx?.();   this.unsubCtx   = null;
        this.unsubDown?.();  this.unsubDown  = null;
        this.unsubUp?.();    this.unsubUp    = null;
    }

    // ─── Mode management ─────────────────────────────────────────────────────

    /**
     * "Add new [Type] layer" goes straight into the editing session for a
     * fresh, unnamed layer — no dialog. Name, color and attributes are all
     * editable inline in that session now, so the only thing a popup ever
     * still did here was ask for a name up front; the session's own name
     * field does that instead, gated by `renderEditingSession`'s `needsName`
     * check so drawing stays blocked until it's filled in.
     */
    private async createNewLayer(): Promise<void> {
        const geoType = this.pickedType;
        if (!geoType) return;
        // Deliberately no `pendingMode` here — an unnamed layer must not
        // auto-enter draw mode, unlike a catalog layer borrowed with a name
        // already attached (see `startEditingCatalogLayer`).
        await this.applyLayerConfig(newLayerConfig(geoType));
        this.setModeInternal('select');
    }

    /** Returns GeoJSON-backed map layers matching the given geometry type, deduplicated by source. */
    private async getEditableMapLayers(geoType: GeometryType): Promise<import('./webmapx-draw-layer-dialog').MapLayerOption[]> {
        if (!this.adapter) return [];
        const meta = this.adapter.store.getState().mapLayers ?? {};

        // One entry per source — use first layer found for label
        const seen = new Set<string>();
        const result: import('./webmapx-draw-layer-dialog').MapLayerOption[] = [];
        const activeLayerId = this.activeLayerIds[geoType];
        const borrowedSourceIds = new Set(
            this.drawLayers
                .filter(l => l.borrowedSourceId && l.id !== activeLayerId)
                .map(l => l.borrowedSourceId)
        );

        for (const [layerId, entry] of Object.entries(meta)) {
            if ((entry as any).isToolLayer) continue;
            if (this.createdDrawLayerIds.has(layerId)) continue;
            const sourceId = typeof entry.sourceId === 'string' ? entry.sourceId : null;
            if (!sourceId || seen.has(sourceId)) continue;
            if (borrowedSourceIds.has(sourceId)) continue;

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

    private setModeInternal(mode: DrawMode): void {
        if (this.circleDraft) {
            this.circleDraft = null;
            this.adapter?.setPanEnabled(true);
        }
        if (this.rectDraft) {
            this.rectDraft = null;
            this.adapter?.setPanEnabled(true);
        }
        this.mode = mode;
        this.draftPoints = [];
        this.cursorPos = null;
        this.snapPos = null;
        this.lastCursorPx = null;
        this.updateRubberband();

        switch (mode) {
            case 'select':
                this.adapter?.setDoubleClickZoomEnabled(true);
                this.adapter?.setCursor('');
                this.editState = 'none';
                this.editHandles = [];
                this.updateEditHandles();
                this.helpText = 'Click a feature to select it.';
                break;
            case 'draw-point':
            case 'draw-line':
            case 'draw-line-dashed':
            case 'draw-polygon':
            case 'draw-circle':
            case 'draw-rectangle':
                this.adapter?.setDoubleClickZoomEnabled(false);
                this.editState = 'none';
                this.editHandles = [];
                this.hoveredHandle = null;
                this.selectedFeatureId = null;
                this.updateEditHandles();
                this.updateSelectedSource();
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
     * "Add new" (a fresh, unnamed `newLayerConfig`) and "Start editing" on a
     * catalog layer (`startEditingCatalogLayer`, already named and sourced).
     * Neither goes through a dialog: name/color/attributes are all editable
     * inline in the session itself (inline name+color, "Edit attributes"
     * popup), so there's nothing left for a popup to ask for up front.
     */
    private async applyLayerConfig(initialCfg: DrawLayerConfig): Promise<void> {
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

            // Borrow: load features from the source, then blank it
            if (cfg.borrowedSourceId && this.adapter) {
                const dataOrUrl = this.adapter.getSourceData(cfg.borrowedSourceId);
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

                // Blank the source — all engine layers using it go empty automatically
                const src = this.adapter.getSource(cfg.borrowedSourceId!);
                src?.setData({ type: 'FeatureCollection', features: [] });
                this.setBorrowedLayerMetadata(cfg.borrowedSourceId!, { borrowedByDrawTool: true });
            }
        }

        this.activeLayerIds[cfg.type] = cfg.id;
        this.refreshDrawLayerSource(cfg.id);

        // Keep perm layer metadata in sync with current property schema
        const mapLayerId = drawMapLayerId(cfg.id);
        if (this.adapter?.store) {
            const current = this.adapter.store.getState().mapLayers ?? {};
            const entry = current[mapLayerId];
            if (entry) {
                this.adapter.store.dispatch({
                    mapLayers: { ...current, [mapLayerId]: { ...entry, properties: cfg.properties } }
                }, 'MAP');
            }
        }

        if (this.pendingMode) {
            this.setModeInternal(this.pendingMode);
            this.pendingMode = null;
        }
        this.pickedType = cfg.type;
        this.panelView = 'editing';
        this.addingAttribute = false;
        this.newAttrName = '';
        this.newAttrType = '';
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
        this.dispatch('webmapx-add-layer', drawLayerSpec(mapLayerId, cfg, cfg.color, {
            label: cfg.name,
            legendRole: 'overlay',
            properties: cfg.properties,
            borrowedByDrawTool: true,
            // A brand-new layer has no name yet ("Add new" skips straight to the
            // editing session) — keep it out of the legend until it does, rather
            // than showing an unnamed "layer-172..." row the moment it's created.
            // `updateActiveLayerName` reveals it once a name is actually given.
            hideFromLegend: true,
        }));
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
     * until "Start editing" calls `resumeDrawLayer` on it again.
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

    private backToTypePicker(): void {
        this.panelView = 'type';
        this.pickedType = null;
        this.catalogLayerOptions = [];
        void this.refreshTypeCatalogCounts();
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

    /** "Start editing" on a catalog layer that isn't a draw layer yet — same dialog as "Add new", pre-selected. */
    private startEditingCatalogLayer(option: import('./webmapx-draw-layer-dialog').MapLayerOption): void {
        if (!this.pickedType) return;
        const type = this.pickedType;
        const base = newLayerConfig(type);
        const cfg: DrawLayerConfig = {
            ...base,
            name: option.label,
            properties: option.properties?.map(p => ({ ...p })) ?? base.properties,
            borrowedSourceId: option.sourceId,
        };
        this.pendingMode = drawModeForType(type);
        void this.applyLayerConfig(cfg);
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
    }

    // ─── Inline layer configuration (editing session) ───────────────────────
    // Name/color/attributes used to live only in the one-shot create/borrow
    // dialog, so there was no way back to them once a layer existed. They now
    // live in the editing session itself, so leaving and returning still has
    // them at hand — no dialog to reopen, nothing that "only shows once".

    private updateActiveLayerName(cfg: DrawLayerConfig, name: string): void {
        const trimmed = name.trim();
        if (!trimmed || trimmed === cfg.name) return;
        // A brand-new layer is created with `hideFromLegend: true` (see
        // `createPermLayer`) — this is the moment it earns a place in the
        // legend, the first time it actually gets a name.
        const isFirstName = !cfg.name && this.ownsPermLayer.has(cfg.id);
        this.drawLayers = this.drawLayers.map(l => l.id === cfg.id ? { ...l, name: trimmed } : l);
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

    private updateActiveLayerColor(cfg: DrawLayerConfig, color: string): void {
        if (color === cfg.color || !this.adapter) return;
        this.drawLayers = this.drawLayers.map(l => l.id === cfg.id ? { ...l, color } : l);
        this.applyLayerColor(cfg.id, cfg.type, color);
        // The active overlay (above) is only ever visible while this layer's
        // editing session is open — the legend, and the map once you leave
        // it, show the perm/resting layer instead. Paint that one too, or
        // the swatch you picked never actually shows up anywhere at rest.
        if (this.ownsPermLayer.has(cfg.id)) {
            this.applyLayerColor(drawMapLayerId(cfg.id), cfg.type, color);
        }
    }

    private applyLayerColor(mapLayerId: string, type: GeometryType, color: string): void {
        if (!this.adapter) return;
        if (type === 'Polygon') {
            this.adapter.updateLayerStyle(mapLayerId, `${mapLayerId}-fill`, { 'fill-color': color });
            this.adapter.updateLayerStyle(mapLayerId, `${mapLayerId}-line`, { 'line-color': color });
        } else if (type === 'LineString') {
            this.adapter.updateLayerStyle(mapLayerId, `${mapLayerId}-solid`, { 'line-color': color });
            this.adapter.updateLayerStyle(mapLayerId, `${mapLayerId}-dashed`, { 'line-color': color });
        } else {
            this.adapter.updateLayerStyle(mapLayerId, mapLayerId, { 'circle-color': color });
        }
    }

    private addActiveLayerProperty(cfg: DrawLayerConfig): void {
        const name = this.newAttrName.trim();
        if (!name || !this.newAttrType || cfg.properties.some(p => p.name === name)) return;
        const properties = [...cfg.properties, { name, type: this.newAttrType }];
        this.drawLayers = this.drawLayers.map(l => l.id === cfg.id ? { ...l, properties } : l);
        this.cancelAddAttribute();
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

    private checkedAutoAttributeCount(layer: DrawLayerConfig): number {
        return this.availableAutoAttributeTypes(layer).filter(t => this.isAutoAttributeChecked(layer, t)).length;
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
    }

    private cancelAddAttribute(): void {
        this.addingAttribute = false;
        this.newAttrName = '';
        this.newAttrType = '';
    }

    private removeActiveLayerProperty(cfg: DrawLayerConfig, index: number): void {
        const properties = cfg.properties.filter((_, i) => i !== index);
        this.drawLayers = this.drawLayers.map(l => l.id === cfg.id ? { ...l, properties } : l);
    }

    // ─── Map event handlers ───────────────────────────────────────────────────

    private handleClick(e: ClickEvent): void {
        const coords: LngLat = (this.effectiveSnap && this.snapPos) ? this.snapPos : e.coords;
        const geoType = modeToGeometryType(this.mode);
        const layerId = geoType ? this.activeLayerIds[geoType] : null;
        if (!layerId && this.mode !== 'select') return;

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

        if (this.mode === 'select') {
            const pixel = this.adapter!.project(coords);
            const px: [number, number] = [pixel[0], pixel[1]];
            const hit = this.findFeatureAt(px, coords);

            if (hit && hit.id === this.selectedFeatureId && this.editState === 'selected' &&
                (isLineType(hit.type) || isPolygonType(hit.type))) {
                // Second click on already-selected line/polygon → enter edit mode
                this.enterEditMode(hit.id);
            } else if (hit && hit.id === this.selectedFeatureId && this.editState === 'editing') {
                // Click on a vertex of the feature being edited → stay in edit mode
                // (the click handler also fires after a vertex pointerdown/up).
            } else if (hit) {
                // First click on a feature → select it, show vertices if line/polygon
                this.selectedFeatureId = hit.id;
                this.editState = isPointType(hit.type) ? 'editing' : 'selected';
                if (this.editState === 'selected') {
                    this.helpText = 'Click again to edit vertices.';
                } else if (isPointType(hit.type)) {
                    this.helpText = 'Drag to move point.';
                }
                this.updateSelectedSource();
                this.updateEditHandles();
                this.requestUpdate();
            } else if (this.editState === 'editing') {
                // Click on empty space while editing → back to selected
                this.editState = 'selected';
                this.updateEditHandles();
                this.requestUpdate();
            } else {
                // Click on empty → deselect
                this.selectedFeatureId = null;
                this.editState = 'none';
                this.updateSelectedSource();
                this.updateEditHandles();
                this.requestUpdate();
            }
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

        // Cursor: pointer/grab feedback in select mode
        if (this.mode === 'select') {
            const px = this.adapter!.project(e.coords);
            const hit = this.findFeatureAt([px[0], px[1]], e.coords);
            if (this.editState === 'selected' && this.selectedFeatureId) {
                this.adapter?.setCursor(hit?.id === this.selectedFeatureId ? 'grab' : '');
            } else if (this.editState === 'none') {
                this.adapter?.setCursor(hit ? 'pointer' : '');
            }
        }

        // Hover detection over handles for cursor change (only in select mode)
        if (this.mode === 'select' && this.editState === 'editing' && this.editHandles.length > 0) {
            const px = this.adapter!.project(e.coords);
            const h = this.findHandleAt([px[0], px[1]]);
            if (h !== this.hoveredHandle) {
                this.hoveredHandle = h;
                this.adapter?.setCursor(h ? 'grab' : '');
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

        // In selected state: drag the entire feature to move it
        if (this.editState === 'selected' && this.selectedFeatureId) {
            const px: [number, number] = [e.pixel[0], e.pixel[1]];
            const hit = this.findFeatureAt(px, e.coords);
            if (hit && hit.id === this.selectedFeatureId) {
                const centroid = this.centroid(hit);
                this.featureDrag = {
                    featureId: hit.id,
                    startCoords: e.coords,
                    origCoords: JSON.parse(JSON.stringify(hit.coordinates)),
                    origCentroidLat: centroid[1],
                    origCentroidLng: centroid[0],
                };
                this.adapter?.setPanEnabled(false);
                this.adapter?.setCursor('grabbing');
            }
            return;
        }

        if (this.editState !== 'editing') return;
        const px: [number, number] = [e.pixel[0], e.pixel[1]];
        const h = this.findHandleAt(px);
        if (!h) {
            if (this.selectedHandle) {
                this.selectedHandle = null;
                this.updateSelectedVertexSource();
            }
            return;
        }

        this.selectedHandle = h.kind === 'vertex' ? h : null;
        this.updateSelectedVertexSource();

        const draggedFeature = this.features.find(f => f.id === h.featureId);
        this.dragging = {
            handle: h, lastCoords: e.coords,
            origCoords: draggedFeature ? JSON.parse(JSON.stringify(draggedFeature.coordinates)) : null,
        };
        this.adapter?.setPanEnabled(false);
        this.adapter?.setCursor('grabbing');

        // If dragging a midpoint, first insert the new vertex
        if (h.kind === 'midpoint') {
            const f = this.features.find(f => f.id === h.featureId);
            if (f) {
                this.insertVertex(f, h);
                // After insert, dragging.handle becomes the newly inserted vertex
                const newVertIdx = h.afterVertIdx + 1;
                const vertHandle: VertexHandle = {
                    kind: 'vertex',
                    featureId: h.featureId,
                    partIdx: h.partIdx,
                    ringIdx: h.ringIdx,
                    vertIdx: newVertIdx,
                    coords: h.coords
                };
                // `f.coordinates` already reflects the just-inserted vertex
                // (a separate, already-pushed history entry of its own) — the
                // "before" state for *this* drag is that post-insert shape,
                // not the shape from before the vertex existed at all.
                this.dragging = {
                    handle: vertHandle, lastCoords: e.coords,
                    origCoords: JSON.parse(JSON.stringify(f.coordinates)),
                };
                this.selectedHandle = vertHandle;
                this.updateSelectedVertexSource();
                this.refreshDrawLayerSource(f.layerId);
                this.updateEditHandles();
            }
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
        if (this.featureDrag) {
            const f = this.features.find(f => f.id === this.featureDrag!.featureId);
            if (f) {
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
        this.adapter?.setCursor(this.hoveredHandle ? 'grab' : '');

        const f = this.features.find(f => f.id === this.dragging!.handle.featureId);
        if (f) {
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

    private updateSelectedSource(): void {
        if (!this.sharedLayersCreated) return;
        const f = this.features.find(f => f.id === this.selectedFeatureId);
        // Only highlight selected Points — lines/polygons use vertex handles instead
        const features = (f && isPointType(f.type)) ? [{ type: 'Feature', id: f.id, geometry: { type: f.type, coordinates: f.coordinates }, properties: {} }] : [];
        this.dispatch('webmapx-set-source-data', { id: SEL_SOURCE_ID, data: { type: 'FeatureCollection', features } });
    }

    // ─── Vertex editing ──────────────────────────────────────────────────────

    private enterEditMode(_featureId: string): void {
        this.editState = 'editing';
        this.helpText = 'Drag points to move. Drag midpoints to add a point. Click a point and press Delete to remove it. Click empty to exit.';
        this.updateEditHandles();
        this.adapter?.setCursor('default');
        this.requestUpdate();
    }

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
        const editing = this.editState === 'editing';

        const vertFeatures = this.editHandles
            .filter(h => h.kind === 'vertex')
            .map(h => ({ type: 'Feature', geometry: { type: 'Point', coordinates: h.coords }, properties: {} }));

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
        // geometry". Arming a drag handle on top of that is what let a click
        // meant to move the just-drawn feature add an unwanted extra one
        // instead; the attribute panel only keys off `selectedFeatureId`
        // (not `editState`), so it shows without that risk. Switch to
        // Select mode for an actual drag-to-move.
        this.selectedFeatureId = feature.id;
        this.updateSelectedSource();
        this.updateEditHandles();
    }

    deleteSelected(): void {
        if (!this.selectedFeatureId) return;
        const deleted = this.features.filter(f => f.id === this.selectedFeatureId);
        this.pushHistory({ type: 'delete', features: deleted });
        this.features = this.features.filter(f => f.id !== this.selectedFeatureId);
        const affectedLayers = new Set(deleted.map(f => f.layerId));
        affectedLayers.forEach(id => this.refreshDrawLayerSource(id));
        this.selectedFeatureId = null;
        this.editState = 'none';
        this.editHandles = [];
        this.adapter?.setCursor('');
        this.updateSelectedSource();
        this.updateEditHandles();
    }

    // ─── History ─────────────────────────────────────────────────────────────

    private pushHistory(entry: HistoryEntry): void {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(entry);
        this.historyIndex = this.history.length - 1;
        this.uiVersion++;
    }

    private removeLastDraftPoint(): void {
        this.draftRedoStack.push(this.draftPoints.pop()!);
        this.uiVersion++;
        this.updateRubberband();
        this.updateHelpTextDuring();
    }

    private undoOrDraftBack(): void {
        if (this.draftPoints.length > 0) {
            this.removeLastDraftPoint();
        } else {
            this.undo();
        }
    }

    private redoOrDraftForward(): void {
        if (this.draftRedoStack.length > 0) {
            this.draftPoints.push(this.draftRedoStack.pop()!);
            this.uiVersion++;
            this.updateRubberband();
            this.updateHelpTextDuring();
        } else {
            this.redo();
        }
    }

    undo(): void {
        if (this.historyIndex < 0) return;
        const entry = this.history[this.historyIndex--];
        this.uiVersion++;
        const affected = new Set<string>();
        if (entry.type === 'add' || entry.type === 'finish') {
            const ids = new Set(entry.features.map(f => f.id));
            this.features = this.features.filter(f => !ids.has(f.id));
            entry.features.forEach(f => affected.add(f.layerId));
        } else if (entry.type === 'delete') {
            this.features = [...this.features, ...entry.features];
            entry.features.forEach(f => affected.add(f.layerId));
        } else if (entry.type === 'update') {
            // Restore previous geometry — swap with saved snapshot
            this.features = this.features.map(f => {
                const snap = entry.features.find(s => s.id === f.id);
                if (snap) { affected.add(f.layerId); return { ...f, coordinates: snap.coordinates }; }
                return f;
            });
        }
        this.selectedFeatureId = null;
        this.editState = 'none';
        this.updateSelectedSource();
        this.updateEditHandles();
        affected.forEach(id => this.refreshDrawLayerSource(id));
        if (entry.type === 'finish' && entry.draftPoints) {
            // Re-open the in-progress line/polygon, point-by-point undo can continue from here.
            const feature = entry.features[0];
            this.mode = feature.type === 'LineString' ? 'draw-line' : 'draw-polygon';
            this.draftPoints = entry.draftPoints.map(p => [p[0], p[1]] as LngLat);
            this.draftRedoStack = [];
            this.cursorPos = this.draftPoints[this.draftPoints.length - 1];
            this.updateRubberband();
            this.updateHelpTextDuring();
        }
    }

    redo(): void {
        if (this.historyIndex >= this.history.length - 1) return;
        const entry = this.history[++this.historyIndex];
        this.uiVersion++;
        const affected = new Set<string>();
        if (entry.type === 'add' || entry.type === 'finish') {
            this.features = [...this.features, ...entry.features];
            entry.features.forEach(f => affected.add(f.layerId));
        } else if (entry.type === 'delete') {
            const ids = new Set(entry.features.map(f => f.id));
            this.features = this.features.filter(f => !ids.has(f.id));
            entry.features.forEach(f => affected.add(f.layerId));
        } else if (entry.type === 'update') {
            const afterSnaps = entry.afterFeatures ?? entry.features;
            this.features = this.features.map(f => {
                const snap = afterSnaps.find(s => s.id === f.id);
                if (snap) { affected.add(f.layerId); return { ...f, coordinates: snap.coordinates }; }
                return f;
            });
        }
        affected.forEach(id => this.refreshDrawLayerSource(id));
        if (entry.type === 'finish') {
            const feature = entry.features[0];
            this.draftPoints = [];
            this.draftRedoStack = [];
            this.cursorPos = null;
            this.selectedFeatureId = feature.id;
            this.editState = isPointType(feature.type) ? 'editing' : 'selected';
            this.updateSelectedSource();
            this.updateEditHandles();
            this.updateRubberband();
        }
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

    private findFeatureAt(clickPixel: [number, number], clickCoords: LngLat): DrawFeature | null {
        const TOL = 10;
        for (const f of [...this.features].reverse()) {
            // A paused layer's features stay in memory but leave the map — skip them,
            // since their coordinates are otherwise indistinguishable from a live layer's.
            if (!this.createdDrawLayerIds.has(f.layerId)) continue;
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
        this.dispatchEvent(new CustomEvent(event, { detail, bubbles: true, composed: true }));
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

    private renderTypePicker() {
        const types: { type: GeometryType; icon: string }[] = [
            { type: 'Point', icon: 'geo-fill' },
            { type: 'LineString', icon: 'slash-lg' },
            { type: 'Polygon', icon: 'pentagon' },
        ];
        return html`
            <div class="flow-heading">What do you want to draw or edit?</div>
            <div class="type-grid">
                ${types.map(({ type, icon }) => html`
                    <button type="button" class="type-card" data-type=${type} @click=${() => this.selectType(type)}>
                        <sl-icon name=${icon}></sl-icon>
                        <span class="type-name">${typeLabelPlural(type)}</span>
                        <span class="type-count">${this.layerCountLabel(type)}</span>
                    </button>
                `)}
            </div>
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
        return html`
            <div class="flow-breadcrumb">
                <sl-icon-button name="arrow-left" label="Back" @click=${() => this.backToTypePicker()}></sl-icon-button>
                <span class="flow-back-label" @click=${() => this.backToTypePicker()}>Back</span>
            </div>
            <div class="layer-picker-header">
                <div class="flow-heading">${typeLabelSingular(type)} layers</div>
                <sl-button variant="default" size="small" @click=${() => this.createNewLayer()}>
                    <sl-icon slot="prefix" name="plus-lg"></sl-icon>
                    Add new ${typeLabelSingular(type)} layer
                </sl-button>
            </div>
            ${nothingToShow ? html`<p class="empty-state">No ${label.toLowerCase()} layers yet.</p>` : html`
                <div class="layer-list">
                    ${layers.length > 0 && catalogOptions.length > 0 ? html`<div class="section-label">Editing</div>` : ''}
                    ${layers.map(l => html`
                        <div class="layer-row">
                            <span class="color-dot" style="background:${l.color}"></span>
                            <span class="layer-name">${l.name || '(untitled)'}</span>
                            <small style="color:var(--color-text-muted, #6b7681);font-size:.7rem">${this.features.filter(f => f.layerId === l.id).length}</small>
                            <sl-button size="small" variant="primary" @click=${() => this.startEditingLayer(l)}>Start editing</sl-button>
                            <sl-tooltip content="Remove layer">
                                <sl-icon-button name="trash" class="remove-layer-btn"
                                    @click=${(e: Event) => { e.stopPropagation(); this.releaseLayer(l); }}>
                                </sl-icon-button>
                            </sl-tooltip>
                        </div>
                    `)}
                    ${catalogOptions.length > 0 ? html`<div class="section-label" style=${layers.length > 0 ? 'margin-top:.5rem' : ''}>From the map</div>` : ''}
                    ${catalogOptions.map(opt => html`
                        <div class="layer-row">
                            <span class="color-dot" style="background:${MAP_LAYER_COLOR}"></span>
                            <span class="layer-name">${opt.label}</span>
                            <sl-button size="small" variant="primary" @click=${() => this.startEditingCatalogLayer(opt)}>Start editing</sl-button>
                        </div>
                    `)}
                </div>
            `}
        `;
    }

    private renderEditingSession() {
        const type = this.pickedType!;
        const layerId = this.activeLayerIds[type];
        const layer = this.drawLayers.find(l => l.id === layerId);
        const drawMode = drawModeForType(type);
        const selFeature = this.features.find(f => f.id === this.selectedFeatureId);
        const selLayer = selFeature ? this.drawLayers.find(l => l.id === selFeature.layerId) : null;
        // A freshly created layer starts unnamed (no dialog asked for one up
        // front anymore) — drawing is held off until the inline name field
        // above actually has something in it.
        const needsName = !layer?.name?.trim();

        return html`
            <div class="flow-breadcrumb">
                <sl-icon-button name="arrow-left" label="Stop editing" @click=${() => this.stopEditingCurrent()}></sl-icon-button>
                <span class="flow-back-label" @click=${() => this.stopEditingCurrent()}>Back / Stop editing</span>
            </div>
            ${layer ? html`
                <div class="editing-title-row">
                    <span class="color-swatch-wrap">
                        <button type="button" class="color-swatch" style="background:${layer.color}"
                            title="Layer color" aria-label="Layer color" tabindex="-1">
                        </button>
                        <input type="color" class="editing-color-input" .value=${layer.color}
                            title="Layer color" aria-label="Layer color"
                            @input=${(e: Event) => this.updateActiveLayerColor(layer, (e.target as HTMLInputElement).value)}>
                    </span>
                    <sl-input class="editing-layer-name" size="small" aria-label="Layer name" title="Click to rename"
                        placeholder="Name this layer…"
                        .value=${layer.name}
                        @sl-change=${(e: Event) => this.updateActiveLayerName(layer, (e.target as any).value)}>
                        <sl-icon slot="suffix" name="pencil" class="editing-layer-name-icon"></sl-icon>
                    </sl-input>
                </div>
            ` : ''}

            ${needsName ? '' : html`
            <div class="toolbar-row">
                <div class="pill">
                    <sl-tooltip content="Select">
                        <sl-icon-button name="hand-index-thumb"
                            ?active=${this.mode === 'select'}
                            @click=${() => this.setModeInternal('select')}>
                        </sl-icon-button>
                    </sl-tooltip>
                </div>
                <div class="pill">
                    <sl-tooltip content="Draw ${typeLabelPlural(type).toLowerCase()}">
                        <sl-icon-button name=${type === 'Point' ? 'geo-fill' : type === 'LineString' ? 'slash-lg' : 'pentagon'}
                            ?active=${this.mode === drawMode}
                            @click=${() => this.setModeInternal(drawMode)}>
                        </sl-icon-button>
                    </sl-tooltip>
                    ${type === 'LineString' ? html`
                        <sl-tooltip content="Draw dashed lines">
                            <sl-icon-button src=${dashLineIconUrl}
                                ?active=${this.mode === 'draw-line-dashed'}
                                @click=${() => this.setModeInternal('draw-line-dashed')}>
                            </sl-icon-button>
                        </sl-tooltip>
                    ` : ''}
                    ${type === 'Polygon' ? html`
                        <sl-tooltip content="Draw circles">
                            <sl-icon-button name="circle"
                                ?active=${this.mode === 'draw-circle'}
                                @click=${() => this.setModeInternal('draw-circle')}>
                            </sl-icon-button>
                        </sl-tooltip>
                        <sl-tooltip content="Draw rectangles">
                            <sl-icon-button name="square"
                                ?active=${this.mode === 'draw-rectangle'}
                                @click=${() => this.setModeInternal('draw-rectangle')}>
                            </sl-icon-button>
                        </sl-tooltip>
                    ` : ''}
                </div>
            </div>

            <div class="toolbar-row">
                <div class="pill">
                    <sl-tooltip content="Snap to points and edges (${this.snapEnabled ? 'on' : 'off'}) — hold Alt to toggle">
                        <sl-icon-button name="magnet"
                            ?active=${this.effectiveSnap}
                            @click=${() => {
                                this.snapEnabled = !this.snapEnabled;
                                if (!this.snapEnabled) { this.snapPos = null; this.updateRubberband(); }
                            }}>
                        </sl-icon-button>
                    </sl-tooltip>
                </div>
            </div>

            <div class="toolbar-row">
                <div class="pill">
                    <sl-tooltip content="Undo (${this.modKey}+Z)">
                        <sl-icon-button name="arrow-counterclockwise"
                            ?disabled=${this.historyIndex < 0 && this.draftPoints.length === 0}
                            @click=${() => this.undoOrDraftBack()}>
                        </sl-icon-button>
                    </sl-tooltip>
                    <sl-tooltip content="Redo (${this.modKey}+Y)">
                        <sl-icon-button name="arrow-clockwise"
                            ?disabled=${this.historyIndex >= this.history.length - 1 && this.draftRedoStack.length === 0}
                            @click=${() => this.redoOrDraftForward()}>
                        </sl-icon-button>
                    </sl-tooltip>
                    <div class="divider"></div>
                    <sl-tooltip content=${this.draftPoints.length > 0 ? 'Remove last point' : this.selectedHandle ? 'Delete selected point' : 'Delete selected'}>
                        <sl-icon-button name="trash" class="delete-feature-btn"
                            ?disabled=${this.draftPoints.length === 0 && !this.selectedFeatureId && !this.selectedHandle}
                            @click=${() => this.draftPoints.length > 0 ? this.removeLastDraftPoint() : this.selectedHandle ? this.deleteSelectedVertex() : this.deleteSelected()}>
                        </sl-icon-button>
                    </sl-tooltip>
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
                <div class="section-label" style="margin-top:.5rem">Attribute values</div>
                ${selLayer.properties.map(p => html`
                    <div class="prop-row">
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
                <sl-button variant="default" size="small" style="width:100%;margin-top:.4rem"
                    @click=${() => this.attributesDialog?.show()}>
                    <sl-icon slot="prefix" name="table"></sl-icon>
                    Edit attributes (${layer.properties.length})
                </sl-button>

                <sl-dialog id="attributes-dialog" label="Edit attributes">
                    ${this.addingAttribute ? html`
                        <div class="add-attr-form">
                            <div class="add-attr-name-row">
                                <sl-input size="small" placeholder="Add attribute name" aria-label="Attribute name" autofocus
                                    .value=${this.newAttrName}
                                    @sl-input=${(e: Event) => { this.newAttrName = (e.target as any).value; }}
                                    @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.newAttrName.trim() && this.addActiveLayerProperty(layer)}>
                                </sl-input>
                                <sl-icon-button name="x-lg" label="Cancel" @click=${() => this.cancelAddAttribute()}></sl-icon-button>
                            </div>
                            ${this.newAttrName.trim() ? html`
                                <div class="type-picker-instruction">Choose a type:</div>
                                <sl-select size="small" placeholder="string / number / image / link" value=${this.newAttrType}
                                    @sl-change=${(e: Event) => { this.newAttrType = (e.target as any).value; }}>
                                    ${PROPERTY_TYPES[layer.type].filter(t => !AUTO_PROPERTY_TYPES.has(t)).map(t => html`
                                        <sl-option value=${t}>${TYPE_LABELS[t] ?? t}</sl-option>
                                    `)}
                                </sl-select>
                            ` : ''}
                            <div class="add-attr-note">New attributes are added to the bottom of the list below.</div>
                            <div class="add-attr-actions">
                                <sl-button size="small" @click=${() => this.cancelAddAttribute()}>Cancel</sl-button>
                                <sl-button size="small" variant="primary"
                                    ?disabled=${!(this.newAttrName.trim() && this.newAttrType)}
                                    @click=${() => this.addActiveLayerProperty(layer)}>
                                    Add
                                </sl-button>
                            </div>
                        </div>
                    ` : html`
                        <sl-button variant="default" size="small" style="width:100%;margin-bottom:.5rem"
                            @click=${() => { this.addingAttribute = true; }}>
                            <sl-icon slot="prefix" name="plus-lg"></sl-icon>
                            Add attribute
                        </sl-button>
                    `}

                    <div class="prop-table-wrap">
                        <table class="prop-table">
                            <thead>
                                <tr><th>Property</th><th>Type</th><th></th></tr>
                            </thead>
                            <tbody>
                                ${layer.properties.map((p, i) => html`
                                    <tr class="${p.name === 'id' ? 'prop-row-auto' : ''}">
                                        <td title=${p.name}>${p.name}</td>
                                        <td title=${p.type}>${TYPE_LABELS[p.type] ?? p.type}${p.name === 'id' ? ' (auto)' : ''}</td>
                                        <td>
                                            ${i === 0 ? '' : html`
                                                <sl-icon-button name="trash" class="remove-attr-btn" label="Remove property"
                                                    @click=${() => this.removeActiveLayerProperty(layer, i)}>
                                                </sl-icon-button>
                                            `}
                                        </td>
                                    </tr>
                                `)}
                            </tbody>
                        </table>
                    </div>

                    <sl-dropdown slot="footer" placement="top-end">
                        <sl-button slot="trigger" size="small" caret>
                            Optional attributes${this.checkedAutoAttributeCount(layer) > 0 ? ` (${this.checkedAutoAttributeCount(layer)})` : ''}
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
                    <sl-button slot="footer" variant="primary" @click=${() => this.attributesDialog?.hide()}>Done</sl-button>
                </sl-dialog>
            ` : ''}
            `}
        `;
    }

    render() {
        return html`
            <div class="scroll-content">
                ${this.panelView === 'type' ? this.renderTypePicker()
                    : this.panelView === 'layers' ? this.renderLayerPicker()
                    : this.renderEditingSession()}
            </div>
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

function typeLabelSingular(type: GeometryType): string {
    return type === 'LineString' ? 'Line' : type;
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

function isPolygonType(type: DrawGeometryType): boolean {
    return type === 'Polygon' || type === 'MultiPolygon';
}

declare global {
    interface HTMLElementTagNameMap {
        'webmapx-draw-tool': WebmapxDrawTool;
    }
}
