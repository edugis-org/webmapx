// src/components/modules/webmapx-measure-tool.ts
// Interactive measure tool for distance and area measurement

import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import { IAppState } from '../../store/IState';
import { IMapAdapter } from '../../map/IMapAdapter';
import { LngLat, Pixel, ClickEvent, PointerMoveEvent, ContextMenuEvent } from '../../store/map-events';
import {
    haversineDistanceCm,
    geodesicAreaM2,
    formatDistance,
    formatArea
} from '../../utils/geo-calculations';
import { throttle } from '../../utils/throttle';
import type { MeasureToolConfig } from '../../config/types';
import { fromLonLat } from 'ol/proj';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

// Layer IDs for visualization
const STATIC_SOURCE_ID = 'webmapx-measure-static-source';
const POINTS_LAYER_ID = 'webmapx-measure-points';
const LINES_LAYER_ID = 'webmapx-measure-lines';
const POLYGON_LAYER_ID = 'webmapx-measure-polygon';

const RUBBERBAND_SOURCE_ID = 'webmapx-measure-rubberband-source';
const RUBBERBAND_LAYER_ID = 'webmapx-measure-rubberband-layer';

// Segment info for display
interface MeasureSegment {
    from: LngLat;
    to: LngLat;
    distanceCm: number;
}

// Native map interface for coordinate projection
interface ProjectableMap {
    project?(coords: LngLat): { x: number; y: number };
    getPixelFromCoordinate?(coords: number[]): [number, number] | null;
}

@customElement('webmapx-measure-tool')
export class WebmapxMeasureTool extends WebmapxBaseTool {
    // ─────────────────────────────────────────────────────────────────────
    // Public Properties
    // ─────────────────────────────────────────────────────────────────────

    /** Whether the tool is active and capturing events */
    @property({ type: Boolean, reflect: true })
    get active(): boolean {
        return this._active;
    }
    set active(value: boolean) {
        const oldValue = this._active;
        this._active = value;

        if (value && !oldValue) {
            // Activating
            this.onActivate();
        } else if (!value && oldValue) {
            // Deactivating
            this.onDeactivate();
        }

        this.requestUpdate('active', oldValue);
    }
    private _active = false;

    /** Tool name for toolbar integration */
    @property({ type: String })
    name = 'measure';

    /** Pixel threshold for closing polygon */
    @property({ type: Number, attribute: 'close-threshold' })
    closeThreshold = 10;

    /** Pixel threshold for finishing on last point */
    @property({ type: Number, attribute: 'finish-threshold' })
    finishThreshold = 10;

    // ─────────────────────────────────────────────────────────────────────
    // Internal State
    // ─────────────────────────────────────────────────────────────────────

    @state() private points: LngLat[] = [];
    @state() private segments: MeasureSegment[] = [];
    @state() private totalDistanceCm = 0;
    @state() private cursorPosition: LngLat | null = null;
    @state() private isClosed = false;
    @state() private areaM2 = 0;

    // Map resources
    private nativeMap: ProjectableMap | null = null;
    private layersCreated = false;

    // Throttled update function for rubber-band visualization (50ms = ~20fps)
    private throttledUpdateVisualization = throttle(() => {
        this.doUpdateRubberbandVisualization();
    }, 50);

    // Event unsubscribe functions
    private unsubClick: (() => void) | null = null;
    private unsubPointerMove: (() => void) | null = null;
    private unsubContextMenu: (() => void) | null = null;
    private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
    private toolSelectHandler: ((e: Event) => void) | null = null;

    // ─────────────────────────────────────────────────────────────────────
    // Styles
    // ─────────────────────────────────────────────────────────────────────

    static styles = css`
        :host {
            display: block;
            pointer-events: auto;
        }

        :host(:not([active])) .measure-content {
            display: none;
        }

        .measure-container {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: 0.75rem;
            font-size: var(--font-size-small, 0.875rem);
        }

        .segment-list {
            max-height: 200px;
            overflow-y: auto;
        }

        .segment {
            display: flex;
            justify-content: space-between;
            padding: 0.25rem 0;
            border-bottom: 1px solid var(--color-border-light, #eee);
        }

        .segment:last-child {
            border-bottom: none;
        }

        .segment-label {
            color: var(--color-text-secondary, #666);
        }

        .segment-value {
            font-weight: 600;
            font-variant-numeric: tabular-nums;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            padding-top: 0.5rem;
            border-top: 2px solid var(--color-border, #ccc);
            font-weight: 600;
        }

        .area-row {
            display: flex;
            justify-content: space-between;
            padding-top: 0.25rem;
            color: var(--color-primary, #0f62fe);
            font-weight: 600;
        }

        .instructions {
            color: var(--color-text-secondary, #666);
            font-size: 0.75rem;
            font-style: italic;
            margin: 0;
        }

        .actions {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.5rem;
        }
    `;

    // ─────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────

    protected onMapAttached(adapter: IMapAdapter): void {
        this.setupEventListeners(adapter);
        this.setupToolbarListener();
        this.loadConfigDefaults();

        // Store map reference when ready (layers are created on activation)
        const core = adapter.core as any;
        core.onMapReady?.((map: any) => {
            this.nativeMap = map;
        });
    }

    protected onMapDetached(): void {
        this.cleanupEventListeners();
        this.cleanupMapLayers();
    }

    disconnectedCallback(): void {
        this.cleanupEventListeners();
        super.disconnectedCallback();
    }

    protected onStateChanged(state: IAppState): void {
        // React to external tool activation changes
        if (state.activeTool !== 'measure' && state.activeTool !== null && this.active) {
            // Another exclusive tool became active, deactivate this one
            this.deactivate();
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Configuration
    // ─────────────────────────────────────────────────────────────────────

    private loadConfigDefaults(): void {
        const config = this.toolsConfig?.measure as MeasureToolConfig | undefined;
        if (config) {
            this.closeThreshold = config.closeThreshold ?? 10;
            this.finishThreshold = config.finishThreshold ?? 10;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Event Setup
    // ─────────────────────────────────────────────────────────────────────

    private setupEventListeners(adapter: IMapAdapter): void {
        // Subscribe to map events
        this.unsubClick = adapter.events.on('click', this.handleClick.bind(this));
        this.unsubPointerMove = adapter.events.on('pointer-move', this.handlePointerMove.bind(this));
        this.unsubContextMenu = adapter.events.on('contextmenu', this.handleContextMenu.bind(this));

        // Keyboard events
        this.keydownHandler = this.handleKeydown.bind(this);
        document.addEventListener('keydown', this.keydownHandler);
    }

    private setupToolbarListener(): void {
        // Listen for toolbar selection events
        this.toolSelectHandler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail.toolId === this.name) {
                this.activate();
            } else if (this.active && detail.toolId !== null) {
                this.deactivate();
            }
        };

        // Listen on the map host for bubbling events
        this.mapHost?.addEventListener('webmapx-tool-select', this.toolSelectHandler);
    }

    private cleanupEventListeners(): void {
        this.unsubClick?.();
        this.unsubPointerMove?.();
        this.unsubContextMenu?.();

        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
            this.keydownHandler = null;
        }

        if (this.toolSelectHandler) {
            this.mapHost?.removeEventListener('webmapx-tool-select', this.toolSelectHandler);
            this.toolSelectHandler = null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Map Layer Setup
    // ─────────────────────────────────────────────────────────────────────

    private createMeasureLayers(): void {
        if (this.layersCreated) {
            return;
        }

        // Source for static points and lines
        this.dispatchEvent(new CustomEvent('webmapx-add-source', {
            detail: { id: STATIC_SOURCE_ID, config: { type: 'geojson', data: this.buildStaticGeoJSON() } },
            bubbles: true, composed: true
        }));

        // Source for the dynamic rubber-band line
        this.dispatchEvent(new CustomEvent('webmapx-add-source', {
            detail: { id: RUBBERBAND_SOURCE_ID, config: { type: 'geojson', data: this.buildRubberbandGeoJSON() } },
            bubbles: true, composed: true
        }));

        // --- Layers for STATIC source ---
        this.dispatchEvent(new CustomEvent('webmapx-add-layer', {
            detail: { id: POLYGON_LAYER_ID, type: 'fill', source: STATIC_SOURCE_ID, filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': '#0f62fe', 'fill-opacity': 0.1 } },
            bubbles: true, composed: true
        }));
        this.dispatchEvent(new CustomEvent('webmapx-add-layer', {
            detail: { id: LINES_LAYER_ID, type: 'line', source: STATIC_SOURCE_ID, filter: ['==', ['get', 'type'], 'line'], paint: { 'line-color': '#0f62fe', 'line-width': 2 } },
            bubbles: true, composed: true
        }));
        this.dispatchEvent(new CustomEvent('webmapx-add-layer', {
            detail: { id: POINTS_LAYER_ID, type: 'circle', source: STATIC_SOURCE_ID, filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-radius': 5, 'circle-color': '#fff', 'circle-stroke-color': '#0f62fe', 'circle-stroke-width': 2 } },
            bubbles: true, composed: true
        }));

        // --- Layer for RUBBERBAND source ---
        this.dispatchEvent(new CustomEvent('webmapx-add-layer', {
            detail: { id: RUBBERBAND_LAYER_ID, type: 'line', source: RUBBERBAND_SOURCE_ID, paint: { 'line-color': '#0f62fe', 'line-width': 2, 'line-dasharray': [4, 4] } },
            bubbles: true, composed: true
        }));

        this.layersCreated = true;
    }

    private cleanupMapLayers(): void {
        this.removeMeasureLayers();
        this.nativeMap = null;
    }

    private removeMeasureLayers(): void {
        if (!this.layersCreated) {
            return;
        }

        // Remove all layers
        this.dispatchEvent(new CustomEvent('webmapx-remove-layer', { detail: POINTS_LAYER_ID, bubbles: true, composed: true }));
        this.dispatchEvent(new CustomEvent('webmapx-remove-layer', { detail: LINES_LAYER_ID, bubbles: true, composed: true }));
        this.dispatchEvent(new CustomEvent('webmapx-remove-layer', { detail: POLYGON_LAYER_ID, bubbles: true, composed: true }));
        this.dispatchEvent(new CustomEvent('webmapx-remove-layer', { detail: RUBBERBAND_LAYER_ID, bubbles: true, composed: true }));

        // Remove all sources
        this.dispatchEvent(new CustomEvent('webmapx-remove-source', { detail: STATIC_SOURCE_ID, bubbles: true, composed: true }));
        this.dispatchEvent(new CustomEvent('webmapx-remove-source', { detail: RUBBERBAND_SOURCE_ID, bubbles: true, composed: true }));

        this.layersCreated = false;
    }

    /** Immediate update - used when adding/removing points */
    private updateMapVisualization(): void {
        this.doUpdateStaticVisualization();
    }

    /** Actual visualization update logic */
    private doUpdateStaticVisualization(): void {
        if (!this.layersCreated) return;
        const geojson = this.buildStaticGeoJSON();
        this.dispatchEvent(new CustomEvent('webmapx-set-source-data', {
            detail: { id: STATIC_SOURCE_ID, data: geojson },
            bubbles: true, composed: true
        }));
    }

    private doUpdateRubberbandVisualization(): void {
        if (!this.layersCreated) return;
        const geojson = this.buildRubberbandGeoJSON();
        this.dispatchEvent(new CustomEvent('webmapx-set-source-data', {
            detail: { id: RUBBERBAND_SOURCE_ID, data: geojson },
            bubbles: true, composed: true
        }));
    }

    private buildStaticGeoJSON(): GeoJSON.FeatureCollection {
        const features: GeoJSON.Feature[] = [];

        // Points
        this.points.forEach((point, index) => {
            features.push({
                type: 'Feature',
                properties: { index, type: 'point', isFirst: index === 0, isLast: index === this.points.length - 1 },
                geometry: { type: 'Point', coordinates: point }
            });
        });

        // Line segments
        if (this.points.length >= 2) {
            const lineCoords = this.isClosed ? [...this.points, this.points[0]] : this.points;
            features.push({
                type: 'Feature',
                properties: { type: 'line' },
                geometry: { type: 'LineString', coordinates: lineCoords }
            });
        }

        // Closed polygon
        if (this.isClosed && this.points.length >= 3) {
            features.push({
                type: 'Feature',
                properties: { type: 'polygon' },
                geometry: { type: 'Polygon', coordinates: [[...this.points, this.points[0]]] }
            });
        }

        return { type: 'FeatureCollection', features };
    }

    private buildRubberbandGeoJSON(): GeoJSON.FeatureCollection {
        const features: GeoJSON.Feature[] = [];

        // Rubber band line (from last point to cursor)
        if (!this.isClosed && this.points.length > 0 && this.cursorPosition && this.active) {
            features.push({
                type: 'Feature',
                properties: { type: 'rubberband' },
                geometry: {
                    type: 'LineString',
                    coordinates: [this.points[this.points.length - 1], this.cursorPosition]
                }
            });
        }

        return { type: 'FeatureCollection', features };
    }

    // ─────────────────────────────────────────────────────────────────────
    // Event Handlers
    // ─────────────────────────────────────────────────────────────────────

    private handleClick(event: ClickEvent): void {
        if (!this.active || this.isClosed) return;

        const clickedCoords = event.coords;
        const clickedPixel = event.pixel;

        // Check if clicking on first point (close polygon)
        if (this.points.length >= 3) {
            if (this.isWithinThreshold(clickedPixel, this.points[0], this.closeThreshold)) {
                this.closePolygon();
                return;
            }
        }

        // Check if clicking on last point (finish/clear line)
        if (this.points.length >= 1) {
            const lastPoint = this.points[this.points.length - 1];
            if (this.isWithinThreshold(clickedPixel, lastPoint, this.finishThreshold)) {
                this.clearMeasurement();
                return;
            }
        }

        // Add new point
        this.addPoint(clickedCoords);
    }

    private handlePointerMove(event: PointerMoveEvent): void {
        if (!this.active || this.isClosed) return;

        // Only update visualization if we have at least one point (rubber-band needed)
        if (this.points.length === 0) return;

        this.cursorPosition = event.coords;
        // Use throttled update for smooth but efficient rubber-band rendering
        this.throttledUpdateVisualization();
    }

    private handleContextMenu(_event: ContextMenuEvent): void {
        if (!this.active) return;

        // Right-click clears the measurement
        this.clearMeasurement();
    }

    private handleKeydown(event: KeyboardEvent): void {
        if (!this.active) return;

        if (event.key === 'Escape') {
            this.clearMeasurement();
        }
    }

    private isWithinThreshold(pixel: Pixel, targetCoords: LngLat, threshold: number): boolean {
        if (!this.nativeMap) return false;

        const map = this.nativeMap as any;
        let targetPixel: { x: number; y: number } | null = null;

        // MapLibre projection
        if (map.project) {
            targetPixel = map.project(targetCoords);
        }
        // OpenLayers projection
        else if (map.getPixelFromCoordinate) {
            const projectedCoords = fromLonLat(targetCoords);
            const olPixel = map.getPixelFromCoordinate(projectedCoords);
            if (olPixel) {
                targetPixel = { x: olPixel[0], y: olPixel[1] };
            }
        }

        if (!targetPixel) return false;

        const dx = pixel[0] - targetPixel.x;
        const dy = pixel[1] - targetPixel.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance <= threshold;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Measurement Logic
    // ─────────────────────────────────────────────────────────────────────

    private addPoint(coords: LngLat): void {
        const newPoints = [...this.points, coords];

        // Calculate new segment if we have at least 2 points
        if (newPoints.length >= 2) {
            const from = newPoints[newPoints.length - 2];
            const to = newPoints[newPoints.length - 1];
            const distanceCm = haversineDistanceCm(from, to);

            const newSegment: MeasureSegment = { from, to, distanceCm };
            this.segments = [...this.segments, newSegment];
            this.totalDistanceCm += distanceCm;
        }

        this.points = newPoints;
        this.updateMapVisualization();
    }

    private closePolygon(): void {
        if (this.points.length < 3) return;

        // Add closing segment
        const from = this.points[this.points.length - 1];
        const to = this.points[0];
        const distanceCm = haversineDistanceCm(from, to);

        const closingSegment: MeasureSegment = { from, to, distanceCm };
        this.segments = [...this.segments, closingSegment];
        this.totalDistanceCm += distanceCm;

        // Calculate area
        this.areaM2 = geodesicAreaM2(this.points);
        this.isClosed = true;

        this.updateMapVisualization();
    }

    private clearMeasurement(): void {
        this.points = [];
        this.segments = [];
        this.totalDistanceCm = 0;
        this.cursorPosition = null;
        this.isClosed = false;
        this.areaM2 = 0;

        this.doUpdateStaticVisualization();
        this.doUpdateRubberbandVisualization();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Activation / Deactivation
    // ─────────────────────────────────────────────────────────────────────

    public activate(): void {
        this.active = true;  // Triggers setter which calls onActivate()
    }

    /** Called when tool becomes active */
    private onActivate(): void {
        this.clearMeasurement();

        // Create layers when activating (ensures they're on top)
        if (!this.layersCreated) {
            this.createMeasureLayers();
        }

        // Tell the core to ignore busy signals from the measure tool's sources
        this.dispatchEvent(new CustomEvent('webmapx-suppress-busy-for-source', { detail: RUBBERBAND_SOURCE_ID, bubbles: true, composed: true }));
        this.dispatchEvent(new CustomEvent('webmapx-suppress-busy-for-source', { detail: STATIC_SOURCE_ID, bubbles: true, composed: true }));

        // Update store to notify other tools
        this.isSettingValue = true;
        this.store?.dispatch({ activeTool: 'measure' }, 'UI');
        setTimeout(() => { this.isSettingValue = false; }, 50);

        // Dispatch activation event
        this.dispatchEvent(new CustomEvent('webmapx-measure-activate', {
            bubbles: true,
            composed: true
        }));
    }

    public deactivate(): void {
        this.active = false;  // Triggers setter which calls onDeactivate()
    }

    /** Called when tool becomes inactive */
    private onDeactivate(): void {
        this.clearMeasurement();

        // Remove layers when deactivating to reduce map overhead
        this.removeMeasureLayers();

        // Un-suppress busy signals from the measure tool's sources
        this.dispatchEvent(new CustomEvent('webmapx-unsuppress-busy-for-source', { detail: RUBBERBAND_SOURCE_ID, bubbles: true, composed: true }));
        this.dispatchEvent(new CustomEvent('webmapx-unsuppress-busy-for-source', { detail: STATIC_SOURCE_ID, bubbles: true, composed: true }));

        // Update store
        this.isSettingValue = true;
        this.store?.dispatch({ activeTool: null }, 'UI');
        setTimeout(() => { this.isSettingValue = false; }, 50);

        // Dispatch deactivation event
        this.dispatchEvent(new CustomEvent('webmapx-measure-deactivate', {
            bubbles: true,
            composed: true
        }));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Rendering
    // ─────────────────────────────────────────────────────────────────────

    private renderSegments(): TemplateResult | typeof nothing {
        if (this.segments.length === 0) {
            return nothing;
        }

        return html`
            <div class="segment-list">
                ${this.segments.map((seg, i) => html`
                    <div class="segment">
                        <span class="segment-label">Segment ${i + 1}</span>
                        <span class="segment-value">${formatDistance(seg.distanceCm)}</span>
                    </div>
                `)}
            </div>
        `;
    }

    private renderTotal(): TemplateResult | typeof nothing {
        if (this.segments.length === 0) {
            return nothing;
        }

        return html`
            <div class="total-row">
                <span>Total</span>
                <span>${formatDistance(this.totalDistanceCm)}</span>
            </div>
        `;
    }

    private renderArea(): TemplateResult | typeof nothing {
        if (!this.isClosed || this.areaM2 === 0) {
            return nothing;
        }

        return html`
            <div class="area-row">
                <span>Area</span>
                <span>${formatArea(this.areaM2)}</span>
            </div>
        `;
    }

    private renderInstructions(): TemplateResult {
        if (this.isClosed) {
            return html`<p class="instructions">Measurement complete. Click Clear to start a new measurement.</p>`;
        }

        if (this.points.length === 0) {
            return html`<p class="instructions">Click on the map to start measuring.</p>`;
        }

        if (this.points.length < 3) {
            return html`<p class="instructions">Click to add points. Right-click or press ESC to clear.</p>`;
        }

        return html`<p class="instructions">Click near first point to close polygon. Right-click or ESC to clear.</p>`;
    }

    protected render(): TemplateResult {
        return html`
            <div class="measure-container">
                <div class="measure-content">
                    ${this.renderInstructions()}
                    ${this.renderSegments()}
                    ${this.renderTotal()}
                    ${this.renderArea()}

                    <div class="actions">
                        <sl-button size="small" @click=${this.clearMeasurement}>
                            <sl-icon name="trash" slot="prefix"></sl-icon>
                            Clear
                        </sl-button>
                    </div>
                </div>
            </div>
        `;
    }
}
