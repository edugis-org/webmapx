import { html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import type { IMap } from '../map/IMapInterfaces';
import type { LngLat, ClickEvent, PointerMoveEvent, ContextMenuEvent, PointerDownEvent, PointerUpEvent } from '../store/map-events';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import './webmapx-draw-layer-dialog';
import type { WebmapxDrawLayerDialog, DrawLayerConfig, GeometryType } from './webmapx-draw-layer-dialog';

// ─── Shared source / layer IDs ────────────────────────────────────────────────

const RUBBER_SOURCE_ID = 'webmapx-draw-rubber-source';
const RUBBER_LINE_ID   = 'webmapx-draw-rubber-line';
const VERTEX_SOURCE_ID = 'webmapx-draw-vertex-source';
const VERTEX_LAYER_ID  = 'webmapx-draw-vertex-layer';

function drawSourceId(layerId: string)   { return `webmapx-draw-src-${layerId}`; }
function drawFillId(layerId: string)     { return `webmapx-draw-fill-${layerId}`; }
function drawLineId(layerId: string)     { return `webmapx-draw-line-${layerId}`; }
function drawPointId(layerId: string)    { return `webmapx-draw-pts-${layerId}`; }

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

// ─── Types ────────────────────────────────────────────────────────────────────

type EditState = 'none' | 'selected' | 'editing';

interface VertexHandle {
    kind: 'vertex';
    featureId: string;
    ringIdx: number;
    vertIdx: number;
    coords: LngLat;
}

interface MidpointHandle {
    kind: 'midpoint';
    featureId: string;
    ringIdx: number;
    afterVertIdx: number;
    coords: LngLat;
}

type EditHandle = VertexHandle | MidpointHandle;

export type DrawMode = 'select' | 'draw-point' | 'draw-line' | 'draw-polygon';
export type { DrawLayerConfig, GeometryType } from './webmapx-draw-layer-dialog';

export interface DrawFeature {
    id: string;
    layerId: string;
    type: GeometryType;
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

    // ── Vertex editing state ──────────────────────────────────────────────────

    @state() private editState: EditState = 'none';
    private editHandles: EditHandle[] = [];
    private hoveredHandle: EditHandle | null = null;
    private dragging: { handle: EditHandle; lastCoords: LngLat } | null = null;
    private featureDrag: { featureId: string; lastCoords: LngLat; origCoords: any } | null = null;

    // ── Event unsubscribers ───────────────────────────────────────────────────

    private unsubClick: (() => void) | null = null;
    private unsubMove:  (() => void) | null = null;
    private unsubCtx:   (() => void) | null = null;
    private unsubDown:  (() => void) | null = null;
    private unsubUp:    (() => void) | null = null;

    @query('webmapx-draw-layer-dialog')
    private layerDialog!: WebmapxDrawLayerDialog;

    // ─── Styles ───────────────────────────────────────────────────────────────

    static styles = css`
        :host { display: block; padding: 0.5rem; min-width: 200px; }

        .toolbar {
            display: flex;
            gap: 0.25rem;
            flex-wrap: wrap;
            margin-bottom: 0.5rem;
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
            cursor: default;
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
    `;

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    protected onActivate(): void {
        this.createSharedLayers();
        // Re-add any data layers that existed before this activation
        for (const layer of this.drawLayers) {
            if (!this.createdDrawLayerIds.has(layer.id)) {
                this.addMapLayersForDrawLayer(layer);
                this.refreshDrawLayerSource(layer.id);
            }
        }
        this.bindEvents();
        this.setModeInternal('select');
    }

    protected onDeactivate(): void {
        this.unbindEvents();
        // Restore all borrowed map layers before removing draw layers
        for (const layer of this.drawLayers) {
            if (layer.borrowedSourceId) this.restoreBorrowedLayer(layer);
        }
        this.draftPoints = [];
        this.cursorPos = null;
        this.dragging = null;
        this.featureDrag = null;
        this.selectedFeatureId = null;
        this.editState = 'none';
        this.editHandles = [];
        this.hoveredHandle = null;
        this.adapter?.setPanEnabled(true);
        this.updateSelectedSource();
        this.removeSharedLayers();   // only tool layers — data layers stay on map
        this.adapter?.setCursor('');
    }

    disconnectedCallback(): void {
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
            // Primary layer (shown in legend)
            this.dispatch('webmapx-add-layer', {
                id: drawFillId(cfg.id), type: 'fill', source: src,
                metadata: { label: cfg.name, legendRole: 'overlay' },
                paint: { 'fill-color': cfg.color, 'fill-opacity': 0.2 }
            });
            // Secondary outline layer (hidden from legend)
            this.dispatch('webmapx-add-layer', {
                id: drawLineId(cfg.id), type: 'line', source: src,
                metadata: { hideFromLegend: true },
                paint: { 'line-color': cfg.color, 'line-width': 2 }
            });
        } else if (cfg.type === 'LineString') {
            this.dispatch('webmapx-add-layer', {
                id: drawLineId(cfg.id), type: 'line', source: src,
                metadata: { label: cfg.name, legendRole: 'overlay' },
                paint: { 'line-color': cfg.color, 'line-width': 2 }
            });
        } else {
            this.dispatch('webmapx-add-layer', {
                id: drawPointId(cfg.id), type: 'circle', source: src,
                metadata: { label: cfg.name, legendRole: 'overlay' },
                paint: { 'circle-radius': 6, 'circle-color': cfg.color, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' }
            });
        }

        this.createdDrawLayerIds.add(cfg.id);
    }

    private removeMapLayersForDrawLayer(cfg: DrawLayerConfig): void {
        // Only remove the layers that were created for this geometry type
        if (cfg.type === 'Polygon') {
            this.dispatch('webmapx-remove-layer', drawFillId(cfg.id));
            this.dispatch('webmapx-remove-layer', drawLineId(cfg.id));
        } else if (cfg.type === 'LineString') {
            this.dispatch('webmapx-remove-layer', drawLineId(cfg.id));
        } else {
            this.dispatch('webmapx-remove-layer', drawPointId(cfg.id));
        }
        this.dispatch('webmapx-remove-source', drawSourceId(cfg.id));
        this.createdDrawLayerIds.delete(cfg.id);
    }

    private removeSharedLayers(): void {
        for (const id of [RUBBER_LINE_ID, VERTEX_LAYER_ID, SEL_POINT_ID, DRAFT_POINT_ID, EDIT_VERT_LAYER, EDIT_MID_LAYER]) {
            this.dispatch('webmapx-remove-layer', id);
        }
        for (const id of [RUBBER_SOURCE_ID, VERTEX_SOURCE_ID, SEL_SOURCE_ID, DRAFT_SOURCE_ID, EDIT_VERT_SOURCE, EDIT_MID_SOURCE]) {
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

    private requestDrawMode(mode: DrawMode): void {
        const geoType = modeToGeometryType(mode);
        if (!geoType) { this.setModeInternal(mode); return; }

        // If there's already an active layer for this type, start drawing immediately
        if (this.activeLayerIds[geoType]) {
            this.setModeInternal(mode);
            return;
        }

        // Otherwise open dialog to create/select a layer first
        this.pendingMode = mode;
        const existing = this.drawLayers.filter(l => l.type === geoType);
        this.layerDialog.geometryType = geoType;
        this.layerDialog.existingLayers = existing;
        this.layerDialog.mapLayers = this.adapter ? this.getEditableMapLayers(geoType) : [];
        this.layerDialog.open();
    }

    /** Returns GeoJSON-backed map layers matching the given geometry type, deduplicated by source. */
    private getEditableMapLayers(geoType: GeometryType): import('./webmapx-draw-layer-dialog').MapLayerOption[] {
        if (!this.adapter) return [];
        const meta = this.adapter.store.getState().runtimeLayerMetadata ?? {};

        // One entry per source — use first layer found for label
        const seen = new Set<string>();
        const result: import('./webmapx-draw-layer-dialog').MapLayerOption[] = [];

        for (const [layerId, entry] of Object.entries(meta)) {
            if ((entry as any).isToolLayer) continue;
            const sourceId = this.adapter.getLayerSourceId(layerId);
            if (!sourceId || seen.has(sourceId)) continue;

            const dataOrUrl = this.adapter.getSourceData(sourceId);
            if (!dataOrUrl) continue;

            if (typeof dataOrUrl === 'string') {
                // URL-backed — include without geometry check (checked on load)
                seen.add(sourceId);
                result.push({ layerId, sourceId, label: (entry as any).label ?? layerId });
                continue;
            }

            const geom = dataOrUrl.features[0]?.geometry?.type;
            const featureGeoType: GeometryType | null =
                geom === 'Point' || geom === 'MultiPoint' ? 'Point' :
                geom === 'LineString' || geom === 'MultiLineString' ? 'LineString' :
                geom === 'Polygon' || geom === 'MultiPolygon' ? 'Polygon' : null;
            if (featureGeoType !== geoType) continue;

            seen.add(sourceId);
            result.push({ layerId, sourceId, label: (entry as any).label ?? layerId });
        }
        return result;
    }

    private setModeInternal(mode: DrawMode): void {
        this.mode = mode;
        this.draftPoints = [];
        this.cursorPos = null;
        this.updateRubberband();

        switch (mode) {
            case 'select':
                this.adapter?.setCursor('');
                this.editState = 'none';
                this.editHandles = [];
                this.updateEditHandles();
                this.helpText = 'Click a feature to select it.';
                break;
            case 'draw-point':
                this.adapter?.setCursor('crosshair');
                this.helpText = 'Click to place a point.';
                break;
            case 'draw-line':
                this.adapter?.setCursor('crosshair');
                this.helpText = 'Click to add vertices. Right-click or double-click to finish.';
                break;
            case 'draw-polygon':
                this.adapter?.setCursor('crosshair');
                this.helpText = 'Click to add vertices. Click first point or double-click to close.';
                break;
        }
    }

    // ─── Dialog handlers ─────────────────────────────────────────────────────

    private async handleLayerConfirm(e: CustomEvent): Promise<void> {
        let cfg = e.detail as DrawLayerConfig;

        // If switching away from a previously borrowed layer, restore it first
        const prevActive = this.activeLayerIds[cfg.type];
        if (prevActive && prevActive !== cfg.id) {
            const prev = this.drawLayers.find(l => l.id === prevActive);
            if (prev?.borrowedSourceId) this.restoreBorrowedLayer(prev);
        }

        // Upsert layer config
        const existing = this.drawLayers.findIndex(l => l.id === cfg.id);
        if (existing >= 0) {
            this.drawLayers = this.drawLayers.map((l, i) => i === existing ? cfg : l);
        } else {
            this.drawLayers = [...this.drawLayers, cfg];
            this.addMapLayersForDrawLayer(cfg);

            // If borrowing a map layer: load its features, hide the originals
            if (cfg.borrowedSourceId && this.adapter) {
                let data: GeoJSON.FeatureCollection | null = null;
                const dataOrUrl = this.adapter.getSourceData(cfg.borrowedSourceId);
                if (typeof dataOrUrl === 'string') {
                    try {
                        const res = await fetch(dataOrUrl);
                        if (res.ok) data = await res.json() as GeoJSON.FeatureCollection;
                    } catch (_) {}
                } else {
                    data = dataOrUrl;
                }

                if (data) {
                    // Explode Multi* geometries into individual simple features
                    const importedFeatures: DrawFeature[] = [];
                    for (const f of data.features) {
                        if (!f.geometry) continue;
                        const geomType = f.geometry.type;
                        const coords = (f.geometry as any).coordinates;
                        const props = { ...f.properties };

                        if (geomType === 'MultiPolygon') {
                            for (const ring of coords as number[][][][]) {
                                importedFeatures.push({ id: this.newId(), layerId: cfg.id, type: 'Polygon', coordinates: ring, properties: { ...props } });
                            }
                        } else if (geomType === 'MultiLineString') {
                            for (const line of coords as number[][][]) {
                                importedFeatures.push({ id: this.newId(), layerId: cfg.id, type: 'LineString', coordinates: line, properties: { ...props } });
                            }
                        } else if (geomType === 'MultiPoint') {
                            for (const pt of coords as number[][]) {
                                importedFeatures.push({ id: this.newId(), layerId: cfg.id, type: 'Point', coordinates: pt, properties: { ...props } });
                            }
                        } else if (geomType === 'Polygon' || geomType === 'LineString' || geomType === 'Point') {
                            importedFeatures.push({ id: this.newId(), layerId: cfg.id, type: geomType as GeometryType, coordinates: coords, properties: props });
                        }
                    }

                    this.features = [...this.features, ...importedFeatures];

                    // Infer attribute schema from first feature if schema is still default
                    if (data.features[0]?.properties && cfg.properties.length <= 2) {
                        const inferred: import('./webmapx-draw-layer-dialog').PropertyDef[] = [
                            { name: 'id', type: 'number' },
                            ...Object.keys(data.features[0].properties)
                                .filter(k => k !== 'id')
                                .map(k => ({ name: k, type: 'string' as const }))
                        ];
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
        if (cfg.borrowedSourceId) this.refreshDrawLayerSource(cfg.id);

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

    private handleLayerCancel(): void {
        this.pendingMode = null;
    }

    // ─── Map event handlers ───────────────────────────────────────────────────

    private handleClick(e: ClickEvent): void {
        const coords = e.coords;
        const geoType = modeToGeometryType(this.mode);
        const layerId = geoType ? this.activeLayerIds[geoType] : null;
        if (!layerId && this.mode !== 'select') return;

        if (this.mode === 'draw-point') {
            this.commitFeature({
                id: this.newId(), layerId: layerId!, type: 'Point',
                coordinates: coords, properties: {}
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
                (hit.type === 'LineString' || hit.type === 'Polygon')) {
                // Second click on already-selected line/polygon → enter edit mode
                this.enterEditMode(hit.id);
            } else if (hit) {
                // First click on a feature → select it, show vertices if line/polygon
                this.selectedFeatureId = hit.id;
                this.editState = hit.type === 'Point' ? 'editing' : 'selected';
                if (this.editState === 'selected') {
                    this.helpText = 'Click again to edit vertices.';
                } else if (hit.type === 'Point') {
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
            // Move entire feature
            const f = this.features.find(f => f.id === this.featureDrag!.featureId);
            if (f) {
                const dLng = e.coords[0] - this.featureDrag.lastCoords[0];
                const dLat = e.coords[1] - this.featureDrag.lastCoords[1];
                f.coordinates = this.translateCoords(f.coordinates, f.type, dLng, dLat);
                this.featureDrag.lastCoords = e.coords;
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
                this.applyDragMove(f, this.dragging.handle, e.coords);
                this.dragging.lastCoords = e.coords;
                this.refreshDrawLayerSource(f.layerId);
                this.updateEditHandles();
                this.updateSelectedSource();
            }
            return;
        }

        if (this.mode === 'draw-line' || this.mode === 'draw-polygon') {
            this.updateRubberband();
            return;
        }

        // Cursor: show 'grab' when hovering selected feature (whole-feature drag)
        if (this.editState === 'selected' && this.selectedFeatureId && this.mode === 'select') {
            const px = this.adapter!.project(e.coords);
            const hit = this.findFeatureAt([px[0], px[1]], e.coords);
            this.adapter?.setCursor(hit?.id === this.selectedFeatureId ? 'grab' : '');
        }

        // Hover detection over handles for cursor change
        if (this.editState === 'editing' && this.editHandles.length > 0) {
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
                this.featureDrag = {
                    featureId: hit.id,
                    lastCoords: e.coords,
                    origCoords: JSON.parse(JSON.stringify(hit.coordinates))
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
                const vertHandle: VertexHandle = { kind: 'vertex', featureId: h.featureId, ringIdx: h.ringIdx, vertIdx: newVertIdx, coords: h.coords };
                this.dragging = { handle: vertHandle, lastCoords: e.coords };
                this.refreshDrawLayerSource(f.layerId);
                this.updateEditHandles();
            }
        }
    }

    private handlePointerUp(_e: PointerUpEvent): void {
        if (this.featureDrag) {
            const f = this.features.find(f => f.id === this.featureDrag!.featureId);
            if (f) this.pushHistory({ type: 'update', features: [{ ...f }] });
            this.featureDrag = null;
            this.adapter?.setPanEnabled(true);
            this.adapter?.setCursor('');
            return;
        }
        if (!this.dragging) return;
        this.adapter?.setPanEnabled(true);
        this.adapter?.setCursor(this.hoveredHandle ? 'grab' : '');

        const f = this.features.find(f => f.id === this.dragging!.handle.featureId);
        if (f) this.pushHistory({ type: 'update', features: [{ ...f }] });
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

    private finishDraft(layerId: string): void {
        const pts = this.draftPoints;
        if (this.mode === 'draw-line' && pts.length >= 2) {
            this.commitFeature({
                id: this.newId(), layerId, type: 'LineString',
                coordinates: pts.map(p => [p[0], p[1]]), properties: {}
            });
        } else if (this.mode === 'draw-polygon' && pts.length >= 3) {
            const ring = [...pts.map(p => [p[0], p[1]]), [pts[0][0], pts[0][1]]];
            this.commitFeature({
                id: this.newId(), layerId, type: 'Polygon',
                coordinates: [ring], properties: {}
            });
        }
        this.draftPoints = [];
        this.cursorPos = null;
        this.updateRubberband();
        this.setModeInternal(this.mode);
    }

    // ─── Source updates ───────────────────────────────────────────────────────

    private updateRubberband(): void {
        if (!this.sharedLayersCreated) return;
        const rbFeatures: any[] = [];
        const draftFeatures: any[] = [];
        if ((this.mode === 'draw-line' || this.mode === 'draw-polygon') && this.draftPoints.length > 0 && this.cursorPos) {
            const coords = [...this.draftPoints.map(p => [p[0], p[1]]), [this.cursorPos[0], this.cursorPos[1]]];
            rbFeatures.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} });
            for (const p of this.draftPoints) {
                draftFeatures.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [p[0], p[1]] }, properties: {} });
            }
        }
        this.dispatch('webmapx-set-source-data', { id: RUBBER_SOURCE_ID, data: { type: 'FeatureCollection', features: rbFeatures } });
        this.dispatch('webmapx-set-source-data', { id: DRAFT_SOURCE_ID, data: { type: 'FeatureCollection', features: draftFeatures } });
    }

    private updateSelectedSource(): void {
        if (!this.sharedLayersCreated) return;
        const f = this.features.find(f => f.id === this.selectedFeatureId);
        // Only highlight selected Points — lines/polygons use vertex handles instead
        const features = (f && f.type === 'Point') ? [{ type: 'Feature', id: f.id, geometry: { type: f.type, coordinates: f.coordinates }, properties: {} }] : [];
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
            handles.push({ kind: 'vertex', featureId: f.id, ringIdx: 0, vertIdx: 0, coords: f.coordinates as LngLat });
            return handles;
        }

        const addRing = (ring: [number, number][], ringIdx: number, closed: boolean) => {
            const n = closed ? ring.length - 1 : ring.length; // skip closing duplicate
            for (let i = 0; i < n; i++) {
                handles.push({ kind: 'vertex', featureId: f.id, ringIdx, vertIdx: i, coords: ring[i] as LngLat });
                const next = (i + 1) % n;
                const mid: LngLat = [(ring[i][0] + ring[next][0]) / 2, (ring[i][1] + ring[next][1]) / 2];
                handles.push({ kind: 'midpoint', featureId: f.id, ringIdx, afterVertIdx: i, coords: mid });
            }
        };

        if (f.type === 'LineString') {
            addRing(f.coordinates as [number, number][], 0, false);
        } else if (f.type === 'Polygon') {
            (f.coordinates as [number, number][][]).forEach((ring, ri) => addRing(ring, ri, true));
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
        const { ringIdx, vertIdx } = handle;
        if (f.type === 'Point') {
            f.coordinates = [newCoords[0], newCoords[1]];
            handle.coords = newCoords;
            return;
        } else if (f.type === 'LineString') {
            coords[vertIdx] = [newCoords[0], newCoords[1]];
        } else if (f.type === 'Polygon') {
            coords[ringIdx][vertIdx] = [newCoords[0], newCoords[1]];
            // Keep closing vertex in sync
            const ring = coords[ringIdx] as number[][];
            if (vertIdx === 0) ring[ring.length - 1] = ring[0];
        }
        // Update in place (mutate the stored feature for live feedback)
        f.coordinates = coords;
        // Also update the handle position
        handle.coords = newCoords;
    }

    private translateCoords(coords: any, type: GeometryType, dLng: number, dLat: number): any {
        const t = (c: [number, number]): [number, number] => [c[0] + dLng, c[1] + dLat];
        if (type === 'Point') return t(coords as [number, number]);
        if (type === 'LineString') return (coords as [number, number][]).map(t);
        if (type === 'Polygon') return (coords as [number, number][][]).map(ring => ring.map(t));
        return coords;
    }

    private insertVertex(f: DrawFeature, h: MidpointHandle): void {
        const coords = JSON.parse(JSON.stringify(f.coordinates));
        const { ringIdx, afterVertIdx } = h;
        if (f.type === 'LineString') {
            (coords as number[][]).splice(afterVertIdx + 1, 0, [h.coords[0], h.coords[1]]);
        } else if (f.type === 'Polygon') {
            (coords[ringIdx] as number[][]).splice(afterVertIdx + 1, 0, [h.coords[0], h.coords[1]]);
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

        this.pushHistory({ type: 'add', features: [feature] });
        this.features = [...this.features, feature];
        this.refreshDrawLayerSource(feature.layerId);
        this.setModeInternal(this.mode);
        this.selectedFeatureId = feature.id;
        // Points go straight to editing (one handle, immediately draggable)
        this.editState = feature.type === 'Point' ? 'editing' : 'selected';
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
        this.updateSelectedSource();
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
        const fc: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features: this.features.map(f => ({
                type: 'Feature' as const,
                id: f.id,
                geometry: { type: f.type, coordinates: f.coordinates } as GeoJSON.Geometry,
                properties: { ...f.properties, _layer: this.drawLayers.find(l => l.id === f.layerId)?.name ?? f.layerId }
            }))
        };
        const blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'draw-export.geojson'; a.click();
        URL.revokeObjectURL(url);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private newId(): string {
        return `draw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
            } else if (f.type === 'LineString') {
                if (this.pixelNearPolyline(clickPixel, f.coordinates, TOL)) return f;
            } else if (f.type === 'Polygon') {
                if (this.pointInRing(clickCoords, f.coordinates[0]) ||
                    this.pixelNearPolyline(clickPixel, f.coordinates[0], TOL)) return f;
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

            <div class="help">${this.helpText}</div>

            ${this.drawLayers.length > 0 ? html`
                <div class="layers-section">
                    <div class="section-label">Layers</div>
                    ${this.drawLayers.map(l => html`
                        <div class="layer-row">
                            <span class="color-dot" style="background:${l.color}"></span>
                            <span class="layer-name">${l.name}</span>
                            <span class="layer-type">${l.type === 'LineString' ? 'Line' : l.type}</span>
                            <small style="color:var(--sl-color-neutral-400);font-size:.7rem">${this.features.filter(f => f.layerId === l.id).length}</small>
                        </div>
                    `)}
                </div>
            ` : ''}

            ${selFeature && selLayer ? html`
                <div class="section-label" style="margin-top:.5rem">Selected: ${selLayer.name}</div>
                ${selLayer.properties.map(p => html`
                    <div style="display:flex;gap:.4rem;align-items:center;font-size:.82rem;margin-bottom:.2rem">
                        <span style="width:80px;color:var(--sl-color-neutral-500)">${p.name}</span>
                        ${p.name === 'id'
                            ? html`<span style="flex:1;color:var(--sl-color-neutral-400);font-style:italic;padding:0 0.3rem">${selFeature.properties['id'] ?? '—'}</span>`
                            : html`<sl-input size="small" style="flex:1"
                                .value=${String(selFeature.properties[p.name] ?? '')}
                                @sl-change=${(e: Event) => {
                                    selFeature.properties[p.name] = (e.target as any).value;
                                    this.features = [...this.features];
                                }}>
                            </sl-input>`
                        }
                    </div>
                `)}
            ` : ''}

            <webmapx-draw-layer-dialog
                @webmapx-draw-layer-confirm=${this.handleLayerConfirm}
                @webmapx-draw-layer-cancel=${this.handleLayerCancel}>
            </webmapx-draw-layer-dialog>
        `;
    }
}

function modeToGeometryType(mode: DrawMode): GeometryType | null {
    if (mode === 'draw-point')   return 'Point';
    if (mode === 'draw-line')    return 'LineString';
    if (mode === 'draw-polygon') return 'Polygon';
    return null;
}

declare global {
    interface HTMLElementTagNameMap {
        'webmapx-draw-tool': WebmapxDrawTool;
    }
}
