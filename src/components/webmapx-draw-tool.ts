import { html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import type { IMap } from '../map/IMapInterfaces';
import type { LngLat, ClickEvent, PointerMoveEvent, ContextMenuEvent } from '../store/map-events';
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

// ─── Types ────────────────────────────────────────────────────────────────────

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

    // ── Event unsubscribers ───────────────────────────────────────────────────

    private unsubClick: (() => void) | null = null;
    private unsubMove:  (() => void) | null = null;
    private unsubCtx:   (() => void) | null = null;

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
        this.bindEvents();
        this.setModeInternal('select');
    }

    protected onDeactivate(): void {
        this.unbindEvents();
        this.draftPoints = [];
        this.cursorPos = null;
        this.removeAllMapLayers();
        this.adapter?.setCursor('');
    }

    protected onMapAttached(adapter: IMap): void {
        super.onMapAttached(adapter);
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
                id: drawFillId(cfg.id), type: 'fill', source: src,
                metadata: { isToolLayer: true, hideFromLegend: true },
                paint: { 'fill-color': cfg.color, 'fill-opacity': 0.2 }
            });
            this.dispatch('webmapx-add-layer', {
                id: drawLineId(cfg.id), type: 'line', source: src,
                metadata: { isToolLayer: true, hideFromLegend: true },
                paint: { 'line-color': cfg.color, 'line-width': 2 }
            });
        } else if (cfg.type === 'LineString') {
            this.dispatch('webmapx-add-layer', {
                id: drawLineId(cfg.id), type: 'line', source: src,
                metadata: { isToolLayer: true, hideFromLegend: true },
                paint: { 'line-color': cfg.color, 'line-width': 2 }
            });
        } else {
            this.dispatch('webmapx-add-layer', {
                id: drawPointId(cfg.id), type: 'circle', source: src,
                metadata: { isToolLayer: true, hideFromLegend: true },
                paint: { 'circle-radius': 6, 'circle-color': cfg.color, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' }
            });
        }

        this.createdDrawLayerIds.add(cfg.id);
    }

    private removeMapLayersForDrawLayer(cfg: DrawLayerConfig): void {
        for (const id of [drawFillId(cfg.id), drawLineId(cfg.id), drawPointId(cfg.id)]) {
            this.dispatch('webmapx-remove-layer', id);
        }
        this.dispatch('webmapx-remove-source', drawSourceId(cfg.id));
        this.createdDrawLayerIds.delete(cfg.id);
    }

    private removeAllMapLayers(): void {
        for (const id of [RUBBER_LINE_ID, VERTEX_LAYER_ID]) this.dispatch('webmapx-remove-layer', id);
        for (const id of [RUBBER_SOURCE_ID, VERTEX_SOURCE_ID]) this.dispatch('webmapx-remove-source', id);
        for (const layer of this.drawLayers) this.removeMapLayersForDrawLayer(layer);
        this.sharedLayersCreated = false;
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
    }

    private unbindEvents(): void {
        this.unsubClick?.(); this.unsubClick = null;
        this.unsubMove?.();  this.unsubMove  = null;
        this.unsubCtx?.();   this.unsubCtx   = null;
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
        this.layerDialog.open();
    }

    private setModeInternal(mode: DrawMode): void {
        this.mode = mode;
        this.draftPoints = [];
        this.cursorPos = null;
        this.updateRubberband();

        switch (mode) {
            case 'select':
                this.adapter?.setCursor('');
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

    private handleLayerConfirm(e: CustomEvent): void {
        const cfg = e.detail as DrawLayerConfig;

        // Upsert layer config
        const existing = this.drawLayers.findIndex(l => l.id === cfg.id);
        if (existing >= 0) {
            this.drawLayers = this.drawLayers.map((l, i) => i === existing ? cfg : l);
        } else {
            this.drawLayers = [...this.drawLayers, cfg];
            this.addMapLayersForDrawLayer(cfg);
        }

        this.activeLayerIds[cfg.type] = cfg.id;

        if (this.pendingMode) {
            this.setModeInternal(this.pendingMode);
            this.pendingMode = null;
        }
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
            this.selectedFeatureId = null;
            this.requestUpdate();
        }
    }

    private handlePointerMove(e: PointerMoveEvent): void {
        this.cursorPos = e.coords;
        if (this.mode === 'draw-line' || this.mode === 'draw-polygon') {
            this.updateRubberband();
        }
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
        const features: any[] = [];
        if ((this.mode === 'draw-line' || this.mode === 'draw-polygon') && this.draftPoints.length > 0 && this.cursorPos) {
            const coords = [...this.draftPoints.map(p => [p[0], p[1]]), [this.cursorPos[0], this.cursorPos[1]]];
            features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} });
        }
        this.dispatch('webmapx-set-source-data', { id: RUBBER_SOURCE_ID, data: { type: 'FeatureCollection', features } });
    }

    // ─── Feature management ──────────────────────────────────────────────────

    private commitFeature(feature: DrawFeature): void {
        this.pushHistory({ type: 'add', features: [feature] });
        this.features = [...this.features, feature];
        this.refreshDrawLayerSource(feature.layerId);
        this.setModeInternal('select');
        this.selectedFeatureId = feature.id;
    }

    deleteSelected(): void {
        if (!this.selectedFeatureId) return;
        const deleted = this.features.filter(f => f.id === this.selectedFeatureId);
        this.pushHistory({ type: 'delete', features: deleted });
        this.features = this.features.filter(f => f.id !== this.selectedFeatureId);
        const affectedLayers = new Set(deleted.map(f => f.layerId));
        affectedLayers.forEach(id => this.refreshDrawLayerSource(id));
        this.selectedFeatureId = null;
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
        }
        this.selectedFeatureId = null;
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
                        </div>
                        <div class="features-section">
                            ${this.features.filter(f => f.layerId === l.id).map(f => html`
                                <div class="feature-row ${f.id === this.selectedFeatureId ? 'selected' : ''}"
                                     @click=${() => { this.selectedFeatureId = f.id; this.setModeInternal('select'); }}>
                                    <span class="color-dot" style="background:${l.color}"></span>
                                    <span>${f.properties['name'] ?? f.id.slice(-6)}</span>
                                </div>
                            `)}
                        </div>
                    `)}
                </div>
            ` : ''}

            ${selFeature && selLayer ? html`
                <div class="section-label" style="margin-top:.5rem">Selected: ${selLayer.name}</div>
                ${selLayer.properties.map(p => html`
                    <div style="display:flex;gap:.4rem;align-items:center;font-size:.82rem;margin-bottom:.2rem">
                        <span style="width:80px;color:var(--sl-color-neutral-500)">${p.name}</span>
                        <sl-input size="small" style="flex:1"
                            .value=${String(selFeature.properties[p.name] ?? '')}
                            @sl-change=${(e: Event) => {
                                selFeature.properties[p.name] = (e.target as any).value;
                                this.features = [...this.features];
                            }}>
                        </sl-input>
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
