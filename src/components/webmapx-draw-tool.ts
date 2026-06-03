import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import type { IMap } from '../map/IMapInterfaces';
import type { LngLat, ClickEvent, PointerMoveEvent, ContextMenuEvent } from '../store/map-events';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';

// ─── Layer / source IDs ───────────────────────────────────────────────────────

const DRAW_SOURCE_ID   = 'webmapx-draw-source';
const DRAW_FILL_ID     = 'webmapx-draw-fill';
const DRAW_LINE_ID     = 'webmapx-draw-line';
const DRAW_POINT_ID    = 'webmapx-draw-points';
const RUBBER_SOURCE_ID = 'webmapx-draw-rubber-source';
const RUBBER_LINE_ID   = 'webmapx-draw-rubber-line';
const VERTEX_SOURCE_ID = 'webmapx-draw-vertex-source';
const VERTEX_LAYER_ID  = 'webmapx-draw-vertex-layer';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DrawMode = 'select' | 'draw-point' | 'draw-line' | 'draw-polygon';

export interface DrawFeature {
    id: string;
    type: 'Point' | 'LineString' | 'Polygon';
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
    @state() private features: DrawFeature[] = [];
    @state() private selectedId: string | null = null;
    @state() private helpText = '';

    /** Points collected for the current in-progress line/polygon. */
    private draftPoints: LngLat[] = [];
    /** Live cursor position for the rubberband preview. */
    private cursorPos: LngLat | null = null;

    /** Undo/redo history. */
    private history: HistoryEntry[] = [];
    private historyIndex = -1;

    private layersCreated = false;

    // ── Event unsubscribers ───────────────────────────────────────────────────

    private unsubClick: (() => void) | null = null;
    private unsubMove:  (() => void) | null = null;
    private unsubCtx:   (() => void) | null = null;

    // ─── Styles ───────────────────────────────────────────────────────────────

    static styles = css`
        :host { display: block; padding: 0.5rem; min-width: 180px; }

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

        .features {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            max-height: 200px;
            overflow-y: auto;
        }

        .feature-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem 0.4rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.85rem;
        }

        .feature-row:hover { background: var(--sl-color-neutral-100); }
        .feature-row.selected { background: var(--sl-color-primary-100); }

        .feature-type {
            font-size: 0.7rem;
            color: var(--sl-color-neutral-500);
            width: 2.5rem;
        }

        .divider {
            width: 1px;
            height: 1.2rem;
            background: var(--sl-color-neutral-200);
            margin: 0 0.1rem;
        }
    `;

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    protected onActivate(): void {
        this.createLayers();
        this.bindEvents();
        this.setMode('select');
    }

    protected onDeactivate(): void {
        this.unbindEvents();
        this.draftPoints = [];
        this.cursorPos = null;
        this.removeLayers();
        this.adapter?.setCursor('');
    }

    protected onMapAttached(adapter: IMap): void {
        super.onMapAttached(adapter);
    }

    // ─── Layer setup ──────────────────────────────────────────────────────────

    private createLayers(): void {
        if (this.layersCreated) return;

        // Committed features source
        this.dispatch('webmapx-add-source', { id: DRAW_SOURCE_ID, config: { type: 'geojson', data: this.buildFeatureCollection() } });
        // Rubberband source
        this.dispatch('webmapx-add-source', { id: RUBBER_SOURCE_ID, config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } });
        // Vertex snap indicator source
        this.dispatch('webmapx-add-source', { id: VERTEX_SOURCE_ID, config: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } });

        // Fill layer (polygons)
        this.dispatch('webmapx-add-layer', {
            id: DRAW_FILL_ID, type: 'fill', source: DRAW_SOURCE_ID,
            metadata: { isToolLayer: true, hideFromLegend: true },
            filter: ['==', ['geometry-type'], 'Polygon'],
            paint: { 'fill-color': '#0f62fe', 'fill-opacity': 0.2 }
        });

        // Line layer (lines + polygon outlines)
        this.dispatch('webmapx-add-layer', {
            id: DRAW_LINE_ID, type: 'line', source: DRAW_SOURCE_ID,
            metadata: { isToolLayer: true, hideFromLegend: true },
            filter: ['any', ['==', ['geometry-type'], 'LineString'], ['==', ['geometry-type'], 'Polygon']],
            paint: { 'line-color': '#0f62fe', 'line-width': 2 }
        });

        // Point layer
        this.dispatch('webmapx-add-layer', {
            id: DRAW_POINT_ID, type: 'circle', source: DRAW_SOURCE_ID,
            metadata: { isToolLayer: true, hideFromLegend: true },
            filter: ['==', ['geometry-type'], 'Point'],
            paint: { 'circle-radius': 5, 'circle-color': '#0f62fe', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' }
        });

        // Rubberband line
        this.dispatch('webmapx-add-layer', {
            id: RUBBER_LINE_ID, type: 'line', source: RUBBER_SOURCE_ID,
            metadata: { isToolLayer: true, hideFromLegend: true },
            paint: { 'line-color': '#0f62fe', 'line-width': 2, 'line-dasharray': [4, 4] }
        });

        // Vertex snap indicator
        this.dispatch('webmapx-add-layer', {
            id: VERTEX_LAYER_ID, type: 'circle', source: VERTEX_SOURCE_ID,
            metadata: { isToolLayer: true, hideFromLegend: true },
            paint: { 'circle-radius': 8, 'circle-color': 'transparent', 'circle-stroke-width': 2, 'circle-stroke-color': '#ff6600' }
        });

        this.layersCreated = true;
    }

    private removeLayers(): void {
        if (!this.layersCreated) return;
        for (const id of [DRAW_FILL_ID, DRAW_LINE_ID, DRAW_POINT_ID, RUBBER_LINE_ID, VERTEX_LAYER_ID]) {
            this.dispatch('webmapx-remove-layer', id);
        }
        for (const id of [DRAW_SOURCE_ID, RUBBER_SOURCE_ID, VERTEX_SOURCE_ID]) {
            this.dispatch('webmapx-remove-source', id);
        }
        this.layersCreated = false;
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

    private setMode(mode: DrawMode): void {
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

    // ─── Event handlers ───────────────────────────────────────────────────────

    private handleClick(e: ClickEvent): void {
        const coords = e.coords;

        if (this.mode === 'draw-point') {
            this.commitFeature({
                id: this.newId(),
                type: 'Point',
                coordinates: coords,
                properties: {}
            });
            return;
        }

        if (this.mode === 'draw-line' || this.mode === 'draw-polygon') {
            // Double-click detected as two rapid clicks — finish on second click at same spot
            if (this.draftPoints.length >= 2) {
                const last = this.draftPoints[this.draftPoints.length - 1];
                if (this.withinPixelThreshold(coords, last, 10) ||
                    (this.mode === 'draw-polygon' && this.withinPixelThreshold(coords, this.draftPoints[0], 14))) {
                    this.finishDraft();
                    return;
                }
            }
            this.draftPoints.push(coords);
            this.updateRubberband();
            this.updateHelpTextDuring();
            return;
        }

        if (this.mode === 'select') {
            // TODO: hit-test via queryService in next step
            this.selectedId = null;
            this.requestUpdate();
        }
    }

    private handlePointerMove(e: PointerMoveEvent): void {
        this.cursorPos = e.coords;
        if (this.mode === 'draw-line' || this.mode === 'draw-polygon') {
            this.updateRubberband();
        }
        // TODO: vertex snap highlight via queryService in next step
    }

    private handleContextMenu(_e: ContextMenuEvent): void {
        if (this.mode === 'draw-line' || this.mode === 'draw-polygon') {
            this.finishDraft();
        }
    }

    // ─── Draft management ────────────────────────────────────────────────────

    private finishDraft(): void {
        const pts = this.draftPoints;
        if (this.mode === 'draw-line' && pts.length >= 2) {
            this.commitFeature({
                id: this.newId(),
                type: 'LineString',
                coordinates: pts.map(p => [p[0], p[1]]),
                properties: {}
            });
        } else if (this.mode === 'draw-polygon' && pts.length >= 3) {
            const ring = [...pts.map(p => [p[0], p[1]]), [pts[0][0], pts[0][1]]];
            this.commitFeature({
                id: this.newId(),
                type: 'Polygon',
                coordinates: [ring],
                properties: {}
            });
        }
        this.draftPoints = [];
        this.cursorPos = null;
        this.updateRubberband();
        this.setMode(this.mode); // reset help text
    }

    // ─── Layer data updates ───────────────────────────────────────────────────

    private updateRubberband(): void {
        if (!this.layersCreated) return;
        const features: any[] = [];
        if ((this.mode === 'draw-line' || this.mode === 'draw-polygon') && this.draftPoints.length > 0 && this.cursorPos) {
            const coords = [...this.draftPoints.map(p => [p[0], p[1]]), [this.cursorPos[0], this.cursorPos[1]]];
            features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} });
        }
        this.dispatch('webmapx-set-source-data', {
            id: RUBBER_SOURCE_ID,
            data: { type: 'FeatureCollection', features }
        });
    }

    private updateDrawSource(): void {
        if (!this.layersCreated) return;
        this.dispatch('webmapx-set-source-data', {
            id: DRAW_SOURCE_ID,
            data: this.buildFeatureCollection()
        });
    }

    private buildFeatureCollection(): GeoJSON.FeatureCollection {
        return {
            type: 'FeatureCollection',
            features: this.features.map(f => ({
                type: 'Feature' as const,
                id: f.id,
                geometry: { type: f.type, coordinates: f.coordinates } as GeoJSON.Geometry,
                properties: f.properties
            }))
        };
    }

    // ─── Feature management ──────────────────────────────────────────────────

    private commitFeature(feature: DrawFeature): void {
        this.pushHistory({ type: 'add', features: [feature] });
        this.features = [...this.features, feature];
        this.updateDrawSource();
        this.setMode('select');
        this.selectedId = feature.id;
    }

    deleteSelected(): void {
        if (!this.selectedId) return;
        const deleted = this.features.filter(f => f.id === this.selectedId);
        this.pushHistory({ type: 'delete', features: deleted });
        this.features = this.features.filter(f => f.id !== this.selectedId);
        this.selectedId = null;
        this.updateDrawSource();
    }

    // ─── History ─────────────────────────────────────────────────────────────

    private pushHistory(entry: HistoryEntry): void {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(entry);
        this.historyIndex = this.history.length - 1;
    }

    undo(): void {
        if (this.historyIndex < 0) return;
        const entry = this.history[this.historyIndex];
        this.historyIndex--;
        if (entry.type === 'add') {
            const ids = new Set(entry.features.map(f => f.id));
            this.features = this.features.filter(f => !ids.has(f.id));
        } else if (entry.type === 'delete') {
            this.features = [...this.features, ...entry.features];
        }
        this.selectedId = null;
        this.updateDrawSource();
    }

    redo(): void {
        if (this.historyIndex >= this.history.length - 1) return;
        this.historyIndex++;
        const entry = this.history[this.historyIndex];
        if (entry.type === 'add') {
            this.features = [...this.features, ...entry.features];
        } else if (entry.type === 'delete') {
            const ids = new Set(entry.features.map(f => f.id));
            this.features = this.features.filter(f => !ids.has(f.id));
        }
        this.updateDrawSource();
    }

    exportGeoJSON(): void {
        const data = JSON.stringify(this.buildFeatureCollection(), null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'draw-export.geojson';
        a.click();
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
        const dx = pa[0] - pb[0];
        const dy = pa[1] - pb[1];
        return Math.sqrt(dx * dx + dy * dy) < thresholdPx;
    }

    private dispatch(event: string, detail: unknown): void {
        this.dispatchEvent(new CustomEvent(event, { detail, bubbles: true, composed: true }));
    }

    private updateHelpTextDuring(): void {
        const n = this.draftPoints.length;
        if (this.mode === 'draw-line') {
            this.helpText = `${n} point${n !== 1 ? 's' : ''}. Double-click or right-click to finish.`;
        } else if (this.mode === 'draw-polygon') {
            if (n >= 3) {
                this.helpText = `${n} points. Click first point, double-click, or right-click to close.`;
            } else {
                this.helpText = `${n} point${n !== 1 ? 's' : ''}. Need at least 3 to close.`;
            }
        }
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    render() {
        return html`
            <div class="toolbar">
                <sl-tooltip content="Select">
                    <sl-icon-button name="cursor" library="default"
                        ?active=${this.mode === 'select'}
                        @click=${() => this.setMode('select')}>
                    </sl-icon-button>
                </sl-tooltip>
                <sl-tooltip content="Draw point">
                    <sl-icon-button name="geo-fill"
                        ?active=${this.mode === 'draw-point'}
                        @click=${() => this.setMode('draw-point')}>
                    </sl-icon-button>
                </sl-tooltip>
                <sl-tooltip content="Draw line">
                    <sl-icon-button name="slash-lg"
                        ?active=${this.mode === 'draw-line'}
                        @click=${() => this.setMode('draw-line')}>
                    </sl-icon-button>
                </sl-tooltip>
                <sl-tooltip content="Draw polygon">
                    <sl-icon-button name="pentagon"
                        ?active=${this.mode === 'draw-polygon'}
                        @click=${() => this.setMode('draw-polygon')}>
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
                        ?disabled=${!this.selectedId}
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

            ${this.features.length > 0 ? html`
                <div class="features">
                    ${this.features.map(f => html`
                        <div class="feature-row ${f.id === this.selectedId ? 'selected' : ''}"
                             @click=${() => { this.selectedId = f.id; this.setMode('select'); }}>
                            <span class="feature-type">${f.type.replace('String', '')}</span>
                            <span>${f.properties['name'] ?? f.id.slice(-6)}</span>
                        </div>
                    `)}
                </div>
            ` : ''}
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'webmapx-draw-tool': WebmapxDrawTool;
    }
}
