import { html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import type { IMap } from '../map/IMapInterfaces';
import type { LngLat, ClickEvent, PointerMoveEvent, ContextMenuEvent, PointerDownEvent, PointerUpEvent } from '../store/map-events';
import { BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/radio-group/radio-group.js';
import '@shoelace-style/shoelace/dist/components/radio/radio.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import type SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import './webmapx-draw-layer-dialog';
import type { WebmapxDrawLayerDialog, DrawLayerConfig, GeometryType } from './webmapx-draw-layer-dialog';
import { unregisterMapLayer } from '../map/map-layer-registry';
import { flatVertices, flatEdges, findSnap } from '../utils/snap-utils';

// ─── Shared source / layer IDs ────────────────────────────────────────────────

const RUBBER_SOURCE_ID = 'webmapx-draw-rubber-source';
const RUBBER_LINE_ID   = 'webmapx-draw-rubber-line';
const VERTEX_SOURCE_ID = 'webmapx-draw-vertex-source';
const VERTEX_LAYER_ID  = 'webmapx-draw-vertex-layer';

function drawSourceId(layerId: string)   { return `webmapx-draw-src-${layerId}`; }
function drawMapLayerId(layerId: string) { return `${layerId}-map`; }

const MAP_LAYER_COLOR = '#888888';

const SEL_SOURCE_ID = 'webmapx-draw-sel-source';
const SEL_FILL_ID   = 'webmapx-draw-sel-fill';
const SEL_LINE_ID   = 'webmapx-draw-sel-line';
const SEL_POINT_ID  = 'webmapx-draw-sel-point';
const DRAFT_SOURCE_ID = 'webmapx-draw-draft-source';
const DRAFT_POINT_ID  = 'webmapx-draw-draft-points';

const EDIT_VERT_SOURCE = 'webmapx-draw-edit-vert-source';
const EDIT_VERT_LAYER  = 'webmapx-draw-edit-vert';
const EDIT_MID_SOURCE  = 'webmapx-draw-edit-mid-source';
const EDIT_MID_LAYER   = 'webmapx-draw-edit-mid';

const HANDLE_THRESHOLD = 12; // px — snap distance for vertex/midpoint handles

const SNAP_SOURCE_ID = 'webmapx-draw-snap-source';
const SNAP_LAYER_ID  = 'webmapx-draw-snap-layer';
const SNAP_THRESHOLD = 16; // px

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

export type DrawMode = 'select' | 'draw-point' | 'draw-line' | 'draw-polygon';
export type { DrawLayerConfig, GeometryType } from './webmapx-draw-layer-dialog';
type DrawGeometryType = 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon';

export interface DrawFeature {
    id: string;
    layerId: string;
    type: DrawGeometryType;
    coordinates: any;
    properties: Record<string, unknown>;
}

interface HistoryEntry {
    type: 'add' | 'update' | 'delete';
    features: DrawFeature[];
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

    /** Points collected for the current in-progress line/polygon. */
    private draftPoints: LngLat[] = [];
    private cursorPos: LngLat | null = null;

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
    private snapPos: LngLat | null = null;
    private lastCursorPx: [number, number] | null = null;

    // ── Vertex editing state ──────────────────────────────────────────────────

    @state() private editState: EditState = 'none';
    private editHandles: EditHandle[] = [];
    private hoveredHandle: EditHandle | null = null;
    private dragging: { handle: EditHandle; lastCoords: LngLat } | null = null;
    private featureDrag: { featureId: string; startCoords: LngLat; origCoords: any; origCentroidLat: number; origCentroidLng: number } | null = null;

    // ── Event unsubscribers ───────────────────────────────────────────────────

    private unsubClick: (() => void) | null = null;
    private unsubMove:  (() => void) | null = null;
    private unsubCtx:   (() => void) | null = null;
    private unsubDown:  (() => void) | null = null;
    private unsubUp:    (() => void) | null = null;

    @query('webmapx-draw-layer-dialog')
    private layerDialog!: WebmapxDrawLayerDialog;

    @query('#export-dialog')
    private exportDialog!: SlDialog;

    @state() private exportFilename = 'draw-export';
    @state() private exportMode: 'combined' | 'separate' = 'combined';

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

        .toolbar {
            display: flex;
            gap: 0.25rem;
            flex-wrap: wrap;
            margin-bottom: 0.5rem;
            flex-shrink: 0;
        }

        sl-icon-button[active]::part(base) {
            color: var(--sl-color-primary-600);
            background: var(--sl-color-primary-100);
            border-radius: 4px;
        }

        .help {
            font-size: 0.8rem;
            color: var(--sl-color-neutral-600);
            margin-bottom: 0.5rem;
            min-height: 2.5em;
        }

        .layers-section {
            margin-top: 0.5rem;
        }

        .section-label {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--sl-color-neutral-500);
            margin-bottom: 0.25rem;
        }

        .layer-row {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-size: 0.85rem;
            cursor: pointer;
        }

        .layer-row:hover {
            background: var(--sl-color-neutral-100);
        }

        .remove-layer-btn {
            font-size: 0.75rem;
            opacity: 0;
            transition: opacity 0.1s;
        }

        .layer-row:hover .remove-layer-btn {
            opacity: 1;
        }

        .color-dot {
            width: 10px; height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .layer-name { flex: 1; }

        .layer-type {
            font-size: 0.7rem;
            color: var(--sl-color-neutral-500);
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

        .feature-row:hover { background: var(--sl-color-neutral-100); }
        .feature-row.selected { background: var(--sl-color-primary-100); }

        .divider {
            width: 1px; height: 1.2rem;
            background: var(--sl-color-neutral-200);
            margin: 0 0.1rem;
        }

        .prop-row { display: flex; gap: 0.4rem; align-items: center; font-size: 0.82rem; margin-bottom: 0.2rem; }
        .prop-label { width: 80px; color: var(--sl-color-neutral-500); flex-shrink: 0; }
        .prop-value { flex: 1; min-width: 0; }
        .prop-link { display: block; width: 100%; font-size: 0.75rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .prop-img { max-width: 100%; max-height: 80px; border-radius: 3px; object-fit: cover; }
        .prop-img-error { font-size: 0.75rem; color: var(--sl-color-danger-600, #c0392b); font-style: italic; }
        .prop-url-wrap { flex: 1; min-width: 0; overflow: hidden; display: flex; flex-direction: column; gap: 0.2rem; }
    `;

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    protected onActivate(): void {
        this.createSharedLayers();
        // Re-add draw layers suspended on last deactivate, re-blank borrowed sources
        for (const layer of this.drawLayers) {
            if (!this.createdDrawLayerIds.has(layer.id)) {
                this.addMapLayersForDrawLayer(layer);
                this.refreshDrawLayerSource(layer.id);
            }
            if (layer.borrowedSourceId) {
                this.adapter?.getSource(layer.borrowedSourceId)?.setData({ type: 'FeatureCollection', features: [] });
            }
        }
        this.bindEvents();
        this.setModeInternal('select');
    }

    protected onDeactivate(): void {
        this.unbindEvents();
        // Restore borrowed sources and suspend draw layers from the map (keep features in memory)
        for (const layer of this.drawLayers) {
            if (layer.borrowedSourceId) this.restoreBorrowedLayer(layer);
            this.suspendDrawLayerFromMap(layer);
        }
        this.draftPoints = [];
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
            paint: { 'line-color': '#0f62fe', 'line-width': 2, 'line-dasharray': [4, 4] }
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
            paint: { 'circle-radius': 8, 'circle-color': '#ff9900', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' }
        });

        // Draft vertices (points placed so far while drawing)
        this.dispatch('webmapx-add-source', { id: DRAFT_SOURCE_ID, config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } });
        this.dispatch('webmapx-add-layer', {
            id: DRAFT_POINT_ID, type: 'circle', source: DRAFT_SOURCE_ID,
            metadata: { isToolLayer: true, hideFromLegend: true },
            paint: { 'circle-radius': 5, 'circle-color': '#fff', 'circle-stroke-width': 2, 'circle-stroke-color': '#0f62fe' }
        });

        // Vertex editing handles
        this.dispatch('webmapx-add-source', { id: EDIT_VERT_SOURCE, config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } });
        this.dispatch('webmapx-add-layer', {
            id: EDIT_VERT_LAYER, type: 'circle', source: EDIT_VERT_SOURCE,
            metadata: { isToolLayer: true, hideFromLegend: true },
            paint: { 'circle-radius': 6, 'circle-color': '#fff', 'circle-stroke-width': 2, 'circle-stroke-color': '#0f62fe' }
        });

        // Midpoint handles (insert-vertex affordance)
        this.dispatch('webmapx-add-source', { id: EDIT_MID_SOURCE, config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } });
        this.dispatch('webmapx-add-layer', {
            id: EDIT_MID_LAYER, type: 'circle', source: EDIT_MID_SOURCE,
            metadata: { isToolLayer: true, hideFromLegend: true },
            paint: { 'circle-radius': 4, 'circle-color': '#fff', 'circle-stroke-width': 1.5, 'circle-stroke-color': '#0f62fe', 'circle-opacity': 0.7 }
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
        const src = drawSourceId(cfg.id);

        this.dispatch('webmapx-add-source', {
            id: src,
            config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }
        });

        if (cfg.type === 'Polygon') {
            this.dispatch('webmapx-add-layer', {
                id: cfg.id, type: 'fill', source: src,
                title: cfg.name,
                metadata: { label: cfg.name, legendRole: 'overlay', hideFromLegend: true },
                paint: { 'fill-color': cfg.color, 'fill-opacity': 0.35 }
            });
            this.dispatch('webmapx-add-layer', {
                id: `${cfg.id}-outline`, type: 'line', source: src,
                title: cfg.name,
                metadata: { label: cfg.name, legendRole: 'overlay', hideFromLegend: true },
                paint: { 'line-color': cfg.color, 'line-width': 2 }
            });
        } else if (cfg.type === 'LineString') {
            this.dispatch('webmapx-add-layer', {
                id: cfg.id, type: 'line', source: src,
                title: cfg.name,
                metadata: { label: cfg.name, legendRole: 'overlay', hideFromLegend: true },
                paint: { 'line-color': cfg.color, 'line-width': 2 }
            });
        } else {
            this.dispatch('webmapx-add-layer', {
                id: cfg.id, type: 'circle', source: src,
                title: cfg.name,
                metadata: { label: cfg.name, legendRole: 'overlay', hideFromLegend: true },
                paint: { 'circle-radius': 6, 'circle-color': cfg.color, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' }
            });
        }

        this.createdDrawLayerIds.add(cfg.id);
        if (cfg.type === 'Polygon') this.createdDrawLayerIds.add(`${cfg.id}-outline`);
    }

    private removeMapLayersForDrawLayer(cfg: DrawLayerConfig): void {
        if (cfg.type === 'Polygon') this.dispatch('webmapx-remove-layer', `${cfg.id}-outline`);
        this.dispatch('webmapx-remove-layer', cfg.id);
        this.dispatch('webmapx-remove-source', drawSourceId(cfg.id));
        if (this.adapter?.store) unregisterMapLayer(this.adapter.store, cfg.id);
        this.createdDrawLayerIds.delete(cfg.id);
        if (cfg.type === 'Polygon') this.createdDrawLayerIds.delete(`${cfg.id}-outline`);
    }

    private removeSharedLayers(): void {
        for (const id of [RUBBER_LINE_ID, VERTEX_LAYER_ID, SEL_POINT_ID, DRAFT_POINT_ID, EDIT_VERT_LAYER, EDIT_MID_LAYER, SNAP_LAYER_ID]) {
            this.dispatch('webmapx-remove-layer', id);
        }
        for (const id of [RUBBER_SOURCE_ID, VERTEX_SOURCE_ID, SEL_SOURCE_ID, DRAFT_SOURCE_ID, EDIT_VERT_SOURCE, EDIT_MID_SOURCE, SNAP_SOURCE_ID]) {
            this.dispatch('webmapx-remove-source', id);
        }
        this.sharedLayersCreated = false;
    }

    private removeAllMapLayers(): void {
        this.removeSharedLayers();
        for (const layer of this.drawLayers) this.removeMapLayersForDrawLayer(layer);
        this.createdDrawLayerIds.clear();
    }

    private refreshDrawLayerSource(layerId: string): void {
        const features = this.features
            .filter(f => f.layerId === layerId)
            .map(f => ({
                type: 'Feature' as const,
                id: f.id,
                geometry: { type: f.type, coordinates: f.coordinates } as GeoJSON.Geometry,
                properties: f.properties
            }));
        this.dispatch('webmapx-set-source-data', {
            id: drawSourceId(layerId),
            data: { type: 'FeatureCollection', features }
        });
    }

    // ─── Event binding ────────────────────────────────────────────────────────

    private bindEvents(): void {
        if (!this.adapter) return;
        this.unsubClick = this.adapter.events.on('click',        (e: ClickEvent)       => this.handleClick(e));
        this.unsubMove  = this.adapter.events.on('pointer-move', (e: PointerMoveEvent) => this.handlePointerMove(e));
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

    private async requestDrawMode(mode: DrawMode): Promise<void> {
        const geoType = modeToGeometryType(mode);
        if (!geoType) { this.setModeInternal(mode); return; }

        // If there's already an active layer for this type, start drawing immediately
        if (this.activeLayerIds[geoType]) {
            this.setModeInternal(mode);
            return;
        }

        // Open dialog to create/select a layer
        await this.openLayerDialog(mode);
    }

    private async openLayerDialog(mode: DrawMode): Promise<void> {
        const geoType = modeToGeometryType(mode);
        if (!geoType) return;
        this.pendingMode = mode;
        const existing = this.drawLayers.filter(l => l.type === geoType && !l.borrowedSourceId);
        const mapLayers = this.adapter ? await this.getEditableMapLayers(geoType) : [];
        // Pre-select the active borrowed layer and restore its known property schema
        const activeId = this.activeLayerIds[geoType];
        const activeBorrowedLayer = this.drawLayers.find(l => l.id === activeId && l.borrowedSourceId);
        const activeBorrowedSourceId = activeBorrowedLayer?.borrowedSourceId;
        const preselect = activeBorrowedSourceId
            ? mapLayers.find(l => l.sourceId === activeBorrowedSourceId)?.layerId
            : undefined;
        if (activeBorrowedLayer && preselect) {
            const opt = mapLayers.find(l => l.layerId === preselect);
            if (opt) opt.properties = activeBorrowedLayer.properties.map(p => ({ ...p }));
        }
        this.layerDialog.geometryType = geoType;
        this.layerDialog.existingLayers = existing;
        this.layerDialog.mapLayers = mapLayers;
        this.layerDialog.open();
        if (preselect) this.layerDialog.selectedId = preselect;
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
                    properties: (entry as any).properties ?? (data ? this.inferPropertyDefs(data) : undefined)
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
                properties: (entry as any).properties ?? this.inferPropertyDefs(dataOrUrl)
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

        return Object.entries(props).map(([name, value]) => ({
            name,
            type: typeof value === 'number' ? 'number' as const : 'string' as const
        }));
    }

    private setModeInternal(mode: DrawMode): void {
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
            case 'draw-polygon':
                this.adapter?.setDoubleClickZoomEnabled(false);
                this.editState = 'none';
                this.editHandles = [];
                this.hoveredHandle = null;
                this.selectedFeatureId = null;
                this.updateEditHandles();
                this.updateSelectedSource();
                this.adapter?.setCursor('crosshair');
                this.helpText = this.mode === 'draw-point' ? 'Click to place a point.'
                    : this.mode === 'draw-line' ? 'Click to add vertices. Right-click or double-click to finish.'
                    : 'Click to add vertices. Click first point or double-click to close.';
                break;
        }
    }

    // ─── Dialog handlers ─────────────────────────────────────────────────────

    private async handleLayerConfirm(e: CustomEvent): Promise<void> {
        let cfg = e.detail as DrawLayerConfig;

        // Release the previous active layer for this type (at most one active per type)
        const prevActive = this.activeLayerIds[cfg.type];
        if (prevActive && prevActive !== cfg.id) {
            const prev = this.drawLayers.find(l => l.id === prevActive);
            if (prev) this.releaseLayer(prev);
        }

        // Upsert layer config
        const existing = this.drawLayers.findIndex(l => l.id === cfg.id);
        if (existing >= 0) {
            this.drawLayers = this.drawLayers.map((l, i) => i === existing ? cfg : l);
        } else {
            // For new layers: create a permanent grayish map layer first, then borrow it
            if (!cfg.borrowedSourceId) {
                cfg = { ...cfg, borrowedSourceId: this.createPermLayer(cfg) };
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
                        importedFeatures.push({
                            id: this.newId(),
                            layerId: cfg.id,
                            type: f.geometry.type,
                            coordinates: (f.geometry as any).coordinates,
                            properties: props
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
    }

    private restoreBorrowedLayer(cfg: DrawLayerConfig): void {
        if (!cfg.borrowedSourceId || !this.adapter) return;
        // Write edited features back to the original source — all engine layers update automatically
        const features = this.features
            .filter(f => f.layerId === cfg.id)
            .map(f => ({
                type: 'Feature' as const,
                geometry: { type: f.type, coordinates: f.coordinates } as GeoJSON.Geometry,
                properties: { ...f.properties }
            }));
        this.adapter.getSource(cfg.borrowedSourceId)
            ?.setData({ type: 'FeatureCollection', features });
    }

    private createPermLayer(cfg: DrawLayerConfig): string {
        const srcId = `webmapx-perm-src-${cfg.id}`;
        this.dispatch('webmapx-add-source', {
            id: srcId,
            config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }
        });
        const mapLayerId = drawMapLayerId(cfg.id);
        if (cfg.type === 'Polygon') {
            this.dispatch('webmapx-add-layer', {
                id: mapLayerId, type: 'fill', source: srcId, title: cfg.name,
                metadata: { label: cfg.name, legendRole: 'overlay', properties: cfg.properties },
                paint: { 'fill-color': MAP_LAYER_COLOR, 'fill-opacity': 0.35 }
            });
            this.dispatch('webmapx-add-layer', {
                id: `${mapLayerId}-outline`, type: 'line', source: srcId, title: cfg.name,
                metadata: { label: cfg.name, legendRole: 'overlay', hideFromLegend: true, properties: cfg.properties },
                paint: { 'line-color': MAP_LAYER_COLOR, 'line-width': 2 }
            });
        } else if (cfg.type === 'LineString') {
            this.dispatch('webmapx-add-layer', {
                id: mapLayerId, type: 'line', source: srcId, title: cfg.name,
                metadata: { label: cfg.name, legendRole: 'overlay', properties: cfg.properties },
                paint: { 'line-color': MAP_LAYER_COLOR, 'line-width': 2 }
            });
        } else {
            this.dispatch('webmapx-add-layer', {
                id: mapLayerId, type: 'circle', source: srcId, title: cfg.name,
                metadata: { label: cfg.name, legendRole: 'overlay', properties: cfg.properties },
                paint: { 'circle-radius': 5, 'circle-color': MAP_LAYER_COLOR, 'circle-stroke-width': 1, 'circle-stroke-color': '#555' }
            });
        }
        return srcId;
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
        if (cfg.type === 'Polygon') this.dispatch('webmapx-remove-layer', `${cfg.id}-outline`);
        this.dispatch('webmapx-remove-layer', cfg.id);
        this.dispatch('webmapx-remove-source', drawSourceId(cfg.id));
        if (this.adapter?.store) unregisterMapLayer(this.adapter.store, cfg.id);
        this.createdDrawLayerIds.delete(cfg.id);
        if (cfg.type === 'Polygon') this.createdDrawLayerIds.delete(`${cfg.id}-outline`);
    }

    private releaseLayer(cfg: DrawLayerConfig): void {
        this.releaseBorrowedLayer(cfg);
    }

    private removeFromEditing(cfg: DrawLayerConfig): void {
        const wasActive = this.activeLayerIds[cfg.type] === cfg.id;
        this.releaseLayer(cfg);
        if (wasActive) this.setModeInternal('select');
    }

    private handleLayerCancel(): void {
        this.pendingMode = null;
    }

    // ─── Map event handlers ───────────────────────────────────────────────────

    private handleClick(e: ClickEvent): void {
        const coords: LngLat = (this.snapEnabled && this.snapPos) ? this.snapPos : e.coords;
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

        if (this.mode === 'draw-line' || this.mode === 'draw-polygon') {
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
                if (this.snapEnabled && this.features.length > 0) {
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
            }
            return;
        }

        if (this.mode === 'draw-point' || this.mode === 'draw-line' || this.mode === 'draw-polygon') {
            if (this.snapEnabled && this.features.length > 0) {
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
        if (!h) return;

        this.dragging = { handle: h, lastCoords: e.coords };
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
                this.dragging = { handle: vertHandle, lastCoords: e.coords };
                this.refreshDrawLayerSource(f.layerId);
                this.updateEditHandles();
            }
        }
    }

    private handlePointerUp(_e: PointerUpEvent): void {
        if (this.featureDrag) {
            const f = this.features.find(f => f.id === this.featureDrag!.featureId);
            if (f) {
                const layer = this.drawLayers.find(l => l.id === f.layerId);
                if (layer) this.computeSpecialProperties(f, layer);
                this.pushHistory({ type: 'update', features: [{ ...f }] });
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
            const layer = this.drawLayers.find(l => l.id === f.layerId);
            if (layer) this.computeSpecialProperties(f, layer);
            this.pushHistory({ type: 'update', features: [{ ...f }] });
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
        if (layerId && (this.mode === 'draw-line' || this.mode === 'draw-polygon')) {
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
        if (this.mode === 'draw-line' && pts.length >= 2) {
            this.commitFeature({
                id: this.newId(), layerId, type: 'LineString',
                coordinates: pts.map(p => [p[0], p[1]]), properties: this.defaultProperties(layerId)
            });
        } else if (this.mode === 'draw-polygon' && pts.length >= 3) {
            const ring = [...pts.map(p => [p[0], p[1]]), [pts[0][0], pts[0][1]]];
            this.commitFeature({
                id: this.newId(), layerId, type: 'Polygon',
                coordinates: [ring], properties: this.defaultProperties(layerId)
            });
        }
        this.draftPoints = [];
        this.cursorPos = null;
        this.updateRubberband();
    }

    // ─── Snap ─────────────────────────────────────────────────────────────────

    private computeSnap(cursorPx: [number, number]): LngLat | null {
        return this.computeSnapExcluding(cursorPx, null, this.mode === 'draw-point');
    }

    private computeSnapExcluding(cursorPx: [number, number], excludeFeatureId: string | null, skipPoints: boolean): LngLat | null {
        if (!this.adapter) return null;
        const candidates = this.features.filter(f =>
            f.id !== excludeFeatureId && !(skipPoints && isPointType(f.type))
        );
        return findSnap(cursorPx, candidates, v => {
            const px = this.adapter!.project(v);
            return [px[0], px[1]];
        }, { threshold: SNAP_THRESHOLD, edgePenalty: 8 });
    }

    private updateSnapIndicator(): void {
        if (!this.sharedLayersCreated) return;
        const snapFeatures = (this.snapEnabled && this.snapPos)
            ? [{ type: 'Feature', geometry: { type: 'Point', coordinates: this.snapPos }, properties: {} }]
            : [];
        this.dispatch('webmapx-set-source-data', { id: SNAP_SOURCE_ID, data: { type: 'FeatureCollection', features: snapFeatures } });
    }

    // ─── Source updates ───────────────────────────────────────────────────────

    private updateRubberband(): void {
        if (!this.sharedLayersCreated) return;
        const rbFeatures: any[] = [];
        const draftFeatures: any[] = [];
        const drawing = this.mode === 'draw-point' || this.mode === 'draw-line' || this.mode === 'draw-polygon';
        const endPos = (this.snapEnabled && this.snapPos) ? this.snapPos : this.cursorPos;
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
        const snapFeatures = (drawing && this.snapEnabled && this.snapPos)
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
        this.helpText = 'Drag vertices to move. Drag midpoints to add a vertex. Click empty to exit.';
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
            this.dispatch('webmapx-set-source-data', { id: EDIT_VERT_SOURCE, data: { type: 'FeatureCollection', features: [] } });
            this.dispatch('webmapx-set-source-data', { id: EDIT_MID_SOURCE,  data: { type: 'FeatureCollection', features: [] } });
            return;
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
        this.pushHistory({ type: 'update', features: [{ ...f }] });
    }

    // ─── Feature management ──────────────────────────────────────────────────

    private commitFeature(feature: DrawFeature): void {
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

        this.pushHistory({ type: 'add', features: [feature] });
        this.features = [...this.features, feature];
        this.refreshDrawLayerSource(feature.layerId);
        this.setModeInternal(this.mode);
        this.selectedFeatureId = feature.id;
        // Points go straight to editing (one handle, immediately draggable)
        this.editState = isPointType(feature.type) ? 'editing' : 'selected';
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
    }

    undo(): void {
        if (this.historyIndex < 0) return;
        const entry = this.history[this.historyIndex--];
        const affected = new Set<string>();
        if (entry.type === 'add') {
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
    }

    redo(): void {
        if (this.historyIndex >= this.history.length - 1) return;
        const entry = this.history[++this.historyIndex];
        const affected = new Set<string>();
        if (entry.type === 'add') {
            this.features = [...this.features, ...entry.features];
            entry.features.forEach(f => affected.add(f.layerId));
        } else if (entry.type === 'delete') {
            const ids = new Set(entry.features.map(f => f.id));
            this.features = this.features.filter(f => !ids.has(f.id));
            entry.features.forEach(f => affected.add(f.layerId));
        } else if (entry.type === 'update') {
            this.features = this.features.map(f => {
                const snap = entry.features.find(s => s.id === f.id);
                if (snap) { affected.add(f.layerId); return { ...f, coordinates: snap.coordinates }; }
                return f;
            });
        }
        affected.forEach(id => this.refreshDrawLayerSource(id));
    }

    exportGeoJSON(): void {
        this.exportFilename = 'draw-export';
        this.exportMode = 'combined';
        this.exportDialog.show();
    }

    private async doExport(): Promise<void> {
        this.exportDialog.hide();
        const name = this.exportFilename.trim() || 'draw-export';
        if (this.drawLayers.length <= 1 || this.exportMode === 'combined') {
            const fc: GeoJSON.FeatureCollection = {
                type: 'FeatureCollection',
                features: this.features.map(f => ({
                    type: 'Feature' as const,
                    id: f.id,
                    geometry: { type: f.type, coordinates: f.coordinates } as GeoJSON.Geometry,
                    properties: { ...f.properties, _layer: this.drawLayers.find(l => l.id === f.layerId)?.name ?? f.layerId }
                }))
            };
            this.downloadBlob(new Blob([JSON.stringify(fc, null, 2)], { type: 'application/json' }), `${name}.geojson`);
        } else {
            const zipWriter = new ZipWriter(new BlobWriter('application/zip'));
            for (const layer of this.drawLayers) {
                const fc: GeoJSON.FeatureCollection = {
                    type: 'FeatureCollection',
                    features: this.features
                        .filter(f => f.layerId === layer.id)
                        .map(f => ({
                            type: 'Feature' as const,
                            id: f.id,
                            geometry: { type: f.type, coordinates: f.coordinates } as GeoJSON.Geometry,
                            properties: { ...f.properties }
                        }))
                };
                const safeName = layer.name.replace(/[/\\?%*:|"<>]/g, '_');
                await zipWriter.add(`${safeName}.geojson`, new TextReader(JSON.stringify(fc, null, 2)));
            }
            this.downloadBlob(await zipWriter.close(), `${name}.zip`);
        }
    }

    private downloadBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
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
        if (this.mode === 'draw-line') {
            this.helpText = `${n} pt${n !== 1 ? 's' : ''}. Double-click or right-click to finish.`;
        } else if (this.mode === 'draw-polygon') {
            this.helpText = n >= 3
                ? `${n} pts. Click first point, double-click, or right-click to close.`
                : `${n} pt${n !== 1 ? 's' : ''}. Need at least 3 to close.`;
        }
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    render() {
        const selFeature = this.features.find(f => f.id === this.selectedFeatureId);
        const selLayer = selFeature ? this.drawLayers.find(l => l.id === selFeature.layerId) : null;

        return html`
            <div class="toolbar">
                <sl-tooltip content="Select">
                    <sl-icon-button name="cursor"
                        ?active=${this.mode === 'select'}
                        @click=${() => this.requestDrawMode('select')}>
                    </sl-icon-button>
                </sl-tooltip>
                <sl-tooltip content="Draw point">
                    <sl-icon-button name="geo-fill"
                        ?active=${this.mode === 'draw-point'}
                        @click=${() => this.requestDrawMode('draw-point')}>
                    </sl-icon-button>
                </sl-tooltip>
                <sl-tooltip content="Draw line">
                    <sl-icon-button name="slash-lg"
                        ?active=${this.mode === 'draw-line'}
                        @click=${() => this.requestDrawMode('draw-line')}>
                    </sl-icon-button>
                </sl-tooltip>
                <sl-tooltip content="Draw polygon">
                    <sl-icon-button name="pentagon"
                        ?active=${this.mode === 'draw-polygon'}
                        @click=${() => this.requestDrawMode('draw-polygon')}>
                    </sl-icon-button>
                </sl-tooltip>

                <div class="divider"></div>

                <sl-tooltip content="Snap to vertices and edges (${this.snapEnabled ? 'on' : 'off'})">
                    <sl-icon-button name="magnet"
                        ?active=${this.snapEnabled}
                        @click=${() => {
                            this.snapEnabled = !this.snapEnabled;
                            if (!this.snapEnabled) { this.snapPos = null; this.updateRubberband(); }
                        }}>
                    </sl-icon-button>
                </sl-tooltip>

                <div class="divider"></div>

                <sl-tooltip content="Undo">
                    <sl-icon-button name="arrow-counterclockwise"
                        ?disabled=${this.historyIndex < 0}
                        @click=${() => this.undo()}>
                    </sl-icon-button>
                </sl-tooltip>
                <sl-tooltip content="Redo">
                    <sl-icon-button name="arrow-clockwise"
                        ?disabled=${this.historyIndex >= this.history.length - 1}
                        @click=${() => this.redo()}>
                    </sl-icon-button>
                </sl-tooltip>

                <div class="divider"></div>

                <sl-tooltip content="Delete selected">
                    <sl-icon-button name="trash"
                        ?disabled=${!this.selectedFeatureId}
                        @click=${() => this.deleteSelected()}>
                    </sl-icon-button>
                </sl-tooltip>
                <sl-tooltip content="Export GeoJSON">
                    <sl-icon-button name="download"
                        ?disabled=${this.features.length === 0}
                        @click=${() => this.exportGeoJSON()}>
                    </sl-icon-button>
                </sl-tooltip>
            </div>

            <div class="scroll-content">
            <div class="help">${this.helpText}</div>

            ${this.isTouchDevice && (this.mode === 'draw-line' || this.mode === 'draw-polygon') &&
              this.draftPoints.length >= (this.mode === 'draw-line' ? 2 : 3) ? html`
                <sl-button size="small" variant="primary" style="margin-bottom:.4rem;width:100%"
                    @click=${() => {
                        const geoType = modeToGeometryType(this.mode);
                        const layerId = geoType ? this.activeLayerIds[geoType] : null;
                        if (layerId) this.finishDraft(layerId);
                    }}>
                    Finish
                </sl-button>
            ` : ''}

            ${this.drawLayers.length > 0 ? html`
                <div class="layers-section">
                    <div class="section-label">Editing</div>
                    ${this.drawLayers.map(l => html`
                        <div class="layer-row" title="Click to change layer"
                             @click=${() => this.openLayerDialog(l.type === 'Point' ? 'draw-point' : l.type === 'LineString' ? 'draw-line' : 'draw-polygon')}>
                            <span class="color-dot" style="background:${l.color}"></span>
                            <span class="layer-name">${l.name}</span>
                            <span class="layer-type">${l.type === 'LineString' ? 'Line' : l.type}</span>
                            <small style="color:var(--sl-color-neutral-400);font-size:.7rem">${this.features.filter(f => f.layerId === l.id).length}</small>
                            ${this.drawLayers.length > 1 ? html`
                                <sl-tooltip content="Stop editing">
                                    <sl-icon-button name="x" class="remove-layer-btn"
                                        @click=${(e: Event) => { e.stopPropagation(); this.removeFromEditing(l); }}>
                                    </sl-icon-button>
                                </sl-tooltip>
                            ` : ''}
                        </div>
                    `)}
                </div>
            ` : ''}

            ${selFeature && selLayer ? html`
                <div class="section-label" style="margin-top:.5rem">Selected: ${selLayer.name}</div>
                ${selLayer.properties.map(p => html`
                    <div class="prop-row">
                        <span class="prop-label">${p.name}</span>
                        ${p.name === 'id' || ['longitude','latitude','area','perimeter','length','create-time','update-time'].includes(p.type)
                            ? html`<span class="prop-value" style="color:var(--sl-color-neutral-400);font-style:italic;padding:0 0.3rem">${
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
            </div>

            <webmapx-draw-layer-dialog
                @webmapx-draw-layer-confirm=${this.handleLayerConfirm}
                @webmapx-draw-layer-cancel=${this.handleLayerCancel}>
            </webmapx-draw-layer-dialog>

            <sl-dialog id="export-dialog" label="Export GeoJSON">
                <div class="prop-row">
                    <span class="prop-label">Filename</span>
                    <sl-input class="prop-value" size="small"
                        .value=${this.exportFilename}
                        @sl-input=${(e: Event) => { this.exportFilename = (e.target as any).value; }}>
                        <span slot="suffix">${this.exportMode === 'separate' ? '.zip' : '.geojson'}</span>
                    </sl-input>
                </div>
                ${this.drawLayers.length > 1 ? html`
                    <div style="margin-top:.6rem">
                        <sl-radio-group label="Export as" .value=${this.exportMode}
                            @sl-change=${(e: Event) => { this.exportMode = (e.target as any).value; }}>
                            <sl-radio value="combined">Single GeoJSON file (all layers combined)</sl-radio>
                            <sl-radio value="separate">Separate files per layer (ZIP archive)</sl-radio>
                        </sl-radio-group>
                    </div>
                ` : ''}
                <sl-button slot="footer" variant="primary" @click=${() => this.doExport()}>Download</sl-button>
                <sl-button slot="footer" variant="default" @click=${() => this.exportDialog.hide()}>Cancel</sl-button>
            </sl-dialog>
        `;
    }
}


function modeToGeometryType(mode: DrawMode): GeometryType | null {
    if (mode === 'draw-point')   return 'Point';
    if (mode === 'draw-line')    return 'LineString';
    if (mode === 'draw-polygon') return 'Polygon';
    return null;
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
