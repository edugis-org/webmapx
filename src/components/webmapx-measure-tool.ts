// src/components/webmapx-measure-tool.ts
// Interactive measure tool for distance and area measurement

import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import type { IMap } from '../map/IMapInterfaces';
import { LngLat, Pixel, ClickEvent, DoubleClickEvent, PointerMoveEvent, ContextMenuEvent } from '../store/map-events';
import {
    haversineDistanceCm,
    geodesicAreaM2,
    formatDistance,
    formatArea,
    type UnitSystem
} from '../utils/geo-calculations';
import { throttle } from '../utils/throttle';
import { isEventFromEditableElement } from '../utils/dom-focus-utils';
import './webmapx-save-layers-dialog';
import type { WebmapxSaveLayersDialog } from './webmapx-save-layers-dialog';
import type { MeasureToolConfig } from '../config/types';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import { DATA_TOOL, DATA_TOOL_HALO } from '../theme/data-colors';

// Layer IDs for visualization
const STATIC_SOURCE_ID = 'webmapx-measure-static-source';
const POINTS_LAYER_ID = 'webmapx-measure-points';
const LINES_LAYER_ID = 'webmapx-measure-lines';
const POLYGON_LAYER_ID = 'webmapx-measure-polygon';
const SEGMENT_LABELS_LAYER_ID = 'webmapx-measure-segment-labels';

const RUBBERBAND_SOURCE_ID = 'webmapx-measure-rubberband-source';
const RUBBERBAND_LAYER_ID = 'webmapx-measure-rubberband-layer';

/** Where the reader's choice of units is remembered between sessions. */
const UNIT_SYSTEM_KEY = 'webmapx-measure-units';

/** The stored unit system, or metric — including when storage is unavailable. */
function readStoredUnitSystem(): UnitSystem {
    try {
        return localStorage.getItem(UNIT_SYSTEM_KEY) === 'imperial' ? 'imperial' : 'metric';
    } catch {
        // Private mode, or a browser set to block site data. Not worth a warning.
        return 'metric';
    }
}

/** Millimetres are past any accuracy a web map click has; more digits is noise. */
function round3(value: number): number {
    return Math.round(value * 1000) / 1000;
}

/** 1e-7 degrees is about 1 cm — the same precision the save dialog rounds to. */
function round7(value: number): number {
    return Math.round(value * 1e7) / 1e7;
}

// Segment info for display
interface MeasureSegment {
    from: LngLat;
    to: LngLat;
    distanceCm: number;
}

/**
 * Interactive distance and area measurement tool.
 *
 * Click to add vertices; double-click, right-click, or ESC to finish a line.
 * Ctrl+Z, Backspace, Delete or the Undo button takes back the last action.
 * Click near the first point (or double-click) to close a polygon and show area.
 *
 * When a terrain layer is active the tool also displays an elevation profile
 * (SVG graph, 100 samples) along the full measured line or polygon perimeter.
 * The profile appears automatically below the distance/area readout and updates
 * with each point added, closed, or finished. It is hidden when no terrain
 * source is active.
 */
@customElement('webmapx-measure-tool')
export class WebmapxMeasureTool extends WebmapxModalTool {
    // ─────────────────────────────────────────────────────────────────────
    // IModalTool implementation
    // ─────────────────────────────────────────────────────────────────────

    /** Unique identifier for this tool */
    readonly toolId = 'measure';

    // ─────────────────────────────────────────────────────────────────────
    // Public Properties
    // ─────────────────────────────────────────────────────────────────────

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
    @state() private elevationProfile: number[] | null = null;
    /** Measurement has been finished (via ESC/right-click/double-click/double-tap),
     *  but not necessarily closed into a polygon. No further points can be added
     *  until cleared or a new measurement is started. */
    @state() private finished = false;

    /**
     * Metric or imperial. Remembered per browser rather than configured: a
     * reader who thinks in feet thinks in feet on every map, and asking a
     * config author to guess which unit their audience reads gets it wrong for
     * half of them.
     */
    @state() private unitSystem: UnitSystem = readStoredUnitSystem();

    private get isFinished(): boolean {
        return this.finished || this.isClosed;
    }

    // On touch devices, a tap after finishing must not start a new measurement —
    // only the Clear button erases a finished measurement there.
    private touchMQ = window.matchMedia('(pointer: coarse)');
    @state() private isTouchDevice = this.touchMQ.matches;
    private onTouchMQChange = (e: MediaQueryListEvent) => { this.isTouchDevice = e.matches; };

    private layersCreated = false;

    // Throttled update function for rubber-band visualization (50ms = ~20fps)
    private throttledUpdateVisualization = throttle(() => {
        this.doUpdateRubberbandVisualization();
    }, 50);

    // Event unsubscribe functions
    private unsubClick: (() => void) | null = null;
    private unsubDblClick: (() => void) | null = null;
    private unsubPointerMove: (() => void) | null = null;
    private unsubContextMenu: (() => void) | null = null;
    private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

    /**
     * Cached (`true`) on purpose: the dialog moves itself to `document.body` the
     * first time it opens, to escape the panel's backdrop-filter. An uncached
     * query looks in this component's own render root, finds nothing after that
     * move, and every Save click after the first one silently does nothing.
     */
    @query('webmapx-save-layers-dialog', true) private saveDialog?: WebmapxSaveLayersDialog;

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
            padding: var(--webmapx-tool-padding, 0);
            font-size: var(--font-size-small, 0.875rem);
        }

        .segment-list {
            /* max-height is removed to allow the panel to grow */
        }

        .segment {
            display: flex;
            justify-content: space-between;
            padding: 0.25rem 0;
            border-bottom: 1px solid var(--color-border-light, #e2e7ec);
        }

        .segment:last-child {
            border-bottom: none;
        }

        .segment-label {
            color: var(--color-text-secondary, #5a6773);
        }

        .segment-value {
            font-weight: 600;
            font-variant-numeric: tabular-nums;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            padding-top: 0.5rem;
            border-top: 2px solid var(--color-border, #d5dce3);
            font-weight: 600;
        }

        .area-row {
            display: flex;
            justify-content: space-between;
            padding-top: 0.25rem;
            color: var(--color-primary, #2b6c8f);
            font-weight: 600;
        }

        .instructions {
            color: var(--color-text-secondary, #5a6773);
            font-size: 0.75rem;
            font-style: italic;
            margin: 0;
        }

        /* Four buttons do not fit across a 300px panel, so they take two rows —
           and the split follows what they do. The unit switch changes only how the
           numbers are read, so it sits with them, right-aligned under the column
           they line up in; the three that act on the measurement itself sit below,
           left-aligned where a toolbar is looked for. Wrapping keeps that honest at
           any panel width a config asks for. */
        .unit-row {
            display: flex;
            justify-content: flex-end;
            margin-top: 0.5rem;
        }

        .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.35rem;
        }

        .elevation-profile {
            margin-top: 0.25rem;
        }

        .elevation-profile svg {
            display: block;
            width: 100%;
        }

        .elevation-profile-label {
            font-size: 0.7rem;
            color: var(--color-text-secondary, #5a6773);
            margin-bottom: 2px;
        }
    `;

    // ─────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────

    protected onMapAttached(adapter: IMap): void {
        super.onMapAttached(adapter);

        this.setupMapEventListeners(adapter);
        this.loadConfigDefaults();

    }

    protected onMapDetached(): void {
        this.cleanupEventListeners();
        this.cleanupMapLayers();
        super.onMapDetached();
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.touchMQ.addEventListener('change', this.onTouchMQChange);
    }

    disconnectedCallback(): void {
        this.touchMQ.removeEventListener('change', this.onTouchMQChange);
        this.cleanupEventListeners();
        super.disconnectedCallback();
    }

    protected async updated(changedProperties: Map<string | number | symbol, unknown>): Promise<void> {
        if (changedProperties.has('segments')) {
            // Ensure the component's own rendering is complete
            await this.updateComplete;

            // Dispatch an event to notify parent to scroll
            this.dispatchEvent(new CustomEvent('webmapx-content-updated', {
                bubbles: true,
                composed: true
            }));
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

    private setupMapEventListeners(adapter: IMap): void {
        // Subscribe to map events
        this.unsubClick = adapter.events.on('click', this.handleClick.bind(this));
        this.unsubDblClick = adapter.events.on('dblclick', this.handleDblClick.bind(this));
        this.unsubPointerMove = adapter.events.on('pointer-move', this.handlePointerMove.bind(this));
        this.unsubContextMenu = adapter.events.on('contextmenu', this.handleContextMenu.bind(this));

        // Keyboard events
        this.keydownHandler = this.handleKeydown.bind(this);
        document.addEventListener('keydown', this.keydownHandler);
    }

    private cleanupEventListeners(): void {
        this.unsubClick?.();
        this.unsubDblClick?.();
        this.unsubPointerMove?.();
        this.unsubContextMenu?.();

        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
            this.keydownHandler = null;
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
            detail: { id: POLYGON_LAYER_ID, type: 'fill', source: STATIC_SOURCE_ID, metadata: { hideFromLegend: true, label: 'Measure polygon' }, filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': '#0f62fe', 'fill-opacity': 0.1 } },
            bubbles: true, composed: true
        }));
        this.dispatchEvent(new CustomEvent('webmapx-add-layer', {
            detail: { id: LINES_LAYER_ID, type: 'line', source: STATIC_SOURCE_ID, metadata: { hideFromLegend: true, label: 'Measure lines' }, filter: ['==', ['get', 'type'], 'line'], paint: { 'line-color': '#0f62fe', 'line-width': 2 } },
            bubbles: true, composed: true
        }));

        // Add rubber-band line before points so point circles remain visually on top.
        this.dispatchEvent(new CustomEvent('webmapx-add-layer', {
            detail: { id: RUBBERBAND_LAYER_ID, type: 'line', source: RUBBERBAND_SOURCE_ID, metadata: { hideFromLegend: true, label: 'Measure rubberband' }, paint: { 'line-color': '#0f62fe', 'line-width': 2, 'line-dasharray': [4, 4] } },
            bubbles: true, composed: true
        }));

        this.dispatchEvent(new CustomEvent('webmapx-add-layer', {
            detail: {
                id: SEGMENT_LABELS_LAYER_ID,
                type: 'symbol',
                source: STATIC_SOURCE_ID,
                metadata: { isToolLayer: true, hideFromLegend: true, label: 'Measure segment labels' },
                filter: ['==', ['get', 'type'], 'segment-label'],
                layout: {
                    'text-field': ['get', 'label'],
                    'text-font': ['Noto Sans Regular'],
                    'text-size': 12,
                    'text-anchor': 'center',
                    'text-allow-overlap': true,
                    'text-ignore-placement': true,
                },
                paint: {
                    'text-color': DATA_TOOL,
                    'text-halo-color': DATA_TOOL_HALO,
                    'text-halo-width': 1.5,
                },
            },
            bubbles: true, composed: true
        }));

        this.dispatchEvent(new CustomEvent('webmapx-add-layer', {
            detail: {
                id: POINTS_LAYER_ID,
                type: 'circle',
                source: STATIC_SOURCE_ID,
                metadata: { isToolLayer: true, hideFromLegend: true, label: 'Measure points' },
                filter: ['==', ['get', 'type'], 'point'],
                paint: {
                    'circle-radius': 5,
                    'circle-color': DATA_TOOL_HALO,
                    'circle-opacity': 1,
                    'circle-stroke-color': DATA_TOOL,
                    'circle-stroke-width': 2,
                },
            },
            bubbles: true, composed: true
        }));

        this.layersCreated = true;
    }

    private cleanupMapLayers(): void {
        this.removeMeasureLayers();
    }

    private removeMeasureLayers(): void {
        if (!this.layersCreated) {
            return;
        }

        // Remove all layers
        this.dispatchEvent(new CustomEvent('webmapx-remove-layer', { detail: POINTS_LAYER_ID, bubbles: true, composed: true }));
        this.dispatchEvent(new CustomEvent('webmapx-remove-layer', { detail: SEGMENT_LABELS_LAYER_ID, bubbles: true, composed: true }));
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
            const lineCoords = this.buildLineCoordinates(this.points, this.isClosed);
            features.push({
                type: 'Feature',
                properties: { type: 'line' },
                geometry: { type: 'LineString', coordinates: lineCoords }
            });
        }

        // Segment number labels, halfway along the drawn (great-circle) segment
        this.segments.forEach((seg, index) => {
            features.push({
                type: 'Feature',
                properties: { type: 'segment-label', label: String(index + 1) },
                geometry: { type: 'Point', coordinates: this.segmentLabelPosition(seg) },
            });
        });

        // Closed polygon
        if (this.isClosed && this.points.length >= 3) {
            const polygonCoords = this.buildLineCoordinates(this.points, true);
            features.push({
                type: 'Feature',
                properties: { type: 'polygon' },
                geometry: { type: 'Polygon', coordinates: [polygonCoords] }
            });
        }

        return { type: 'FeatureCollection', features };
    }

    private buildRubberbandGeoJSON(): GeoJSON.FeatureCollection {
        const features: GeoJSON.Feature[] = [];

        // Rubber band line (from last point to cursor)
        if (!this.isClosed && this.points.length > 0 && this.cursorPosition && this.active) {
            const coords = this.buildSegmentCoordinates(this.points[this.points.length - 1], this.cursorPosition);
            features.push({
                type: 'Feature',
                properties: { type: 'rubberband' },
                geometry: {
                    type: 'LineString',
                    coordinates: coords
                }
            });
        }

        return { type: 'FeatureCollection', features };
    }

    // ─────────────────────────────────────────────────────────────────────
    // Event Handlers
    // ─────────────────────────────────────────────────────────────────────

    private handleClick(event: ClickEvent): void {
        if (!this.active) return;

        const clickedCoords = event.coords;
        const clickedPixel = event.pixel;

        // A finished (or closed) measurement stays on the map until cleared. On
        // pointer devices a new click starts a fresh measurement at the new
        // location, replacing it; on touch, only the Clear button does that.
        if (this.isFinished) {
            if (this.isTouchDevice) return;
            this.clearMeasurement();
            // Don't add a point on this same click — it may be the second click of
            // a double-click that just finished the measurement. Let the user place
            // the first point of the new measurement with a deliberate separate click.
            return;
        }

        // Check if clicking on first point (close polygon)
        if (this.points.length >= 3) {
            if (this.isWithinThreshold(clickedPixel, this.points[0], this.closeThreshold)) {
                this.closePolygon();
                return;
            }
        }

        // Check if clicking on last point (finish the measurement)
        if (this.points.length >= 1) {
            const lastPoint = this.points[this.points.length - 1];
            if (this.isWithinThreshold(clickedPixel, lastPoint, this.finishThreshold)) {
                this.finishMeasurement();
                return;
            }
        }

        // Add new point
        this.addPoint(clickedCoords);
    }

    private handleDblClick(_event: DoubleClickEvent): void {
        if (!this.active || this.isFinished) return;
        // The second click of a double-click may have just called clearMeasurement()
        // + addPoint(), leaving a 1-point in-progress measurement. Don't finish it —
        // a 1-point measurement has no line and finishing it leaves a confusing state.
        if (this.points.length < 2) return;
        this.finishMeasurement();
    }

    private handlePointerMove(event: PointerMoveEvent): void {
        if (!this.active || this.isFinished) return;

        // Only update visualization if we have at least one point (rubber-band needed)
        if (this.points.length === 0) return;

        this.cursorPosition = event.coords;
        // Use throttled update for smooth but efficient rubber-band rendering
        this.throttledUpdateVisualization();
    }

    private handleContextMenu(_event: ContextMenuEvent): void {
        if (!this.active || this.isFinished) return;

        // Right-click finishes the measurement
        this.finishMeasurement();
    }

    private handleKeydown(event: KeyboardEvent): void {
        if (!this.active) return;

        // This listener is on `document`, so it sees every keystroke on the page
        // — including the ones meant for a search box or the config editor.
        // Backspace there must delete a character, not a measured point.
        if (isEventFromEditableElement(event)) return;

        if (event.key === 'Escape') {
            if (this.isFinished) return;
            this.finishMeasurement();
            return;
        }

        // Ctrl+Z is the undo everyone tries first; Delete and Backspace are what
        // people reach for when the last click landed in the wrong place, and on
        // a Mac the undo chord is Cmd+Z.
        const isUndoChord = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z';
        const isDeleteKey = !event.ctrlKey && !event.metaKey && !event.altKey
            && (event.key === 'Backspace' || event.key === 'Delete');
        if (isUndoChord || isDeleteKey) {
            if (!this.canUndo) return;
            // Backspace still navigates back in some browsers, and Ctrl+Z would
            // otherwise also reach whatever else is listening.
            event.preventDefault();
            this.undoLastAction();
        }
    }

    private isWithinThreshold(pixel: Pixel, targetCoords: LngLat, threshold: number): boolean {
        const targetPixel = this.adapter?.project(targetCoords);
        if (!targetPixel) return false;

        const dx = pixel[0] - targetPixel[0];
        const dy = pixel[1] - targetPixel[1];
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance <= threshold;
    }

    /** Returns a segment broken into great-circle points when spanning >1° */
    /**
     * The point halfway *along the drawn line*, which is where a segment's number
     * belongs.
     *
     * A segment is a great circle, and the straight lon/lat midpoint of a long one
     * is nowhere near it: Amsterdam–Tokyo puts the naive midpoint in Siberia while
     * the line itself runs over the Arctic, so the label floats in empty space
     * beside its own segment. Short segments are straight lines anyway, and the
     * two answers agree there.
     */
    private segmentLabelPosition(segment: MeasureSegment): LngLat {
        const angularDistance = this.computeAngularDistanceRad(segment.from, segment.to);
        if (angularDistance === 0) return segment.from;
        return this.interpolateGreatCirclePoint(segment.from, segment.to, 0.5, angularDistance);
    }

    private buildSegmentCoordinates(from: LngLat, to: LngLat): LngLat[] {
        const latDiff = Math.abs(to[1] - from[1]);
        const lonDiff = Math.abs(this.normalizeLongitudeDeltaDegrees(to[0] - from[0]));
        const spansMoreThanDegree = latDiff > 1 || lonDiff > 1;

        if (!spansMoreThanDegree) {
            return [from, to];
        }

        const angularDistance = this.computeAngularDistanceRad(from, to);
        if (angularDistance === 0) {
            return [from];
        }

        const angularDistanceDeg = angularDistance * 180 / Math.PI;
        const steps = Math.max(1, Math.ceil(angularDistanceDeg));
        const coords: LngLat[] = [];
        for (let i = 0; i <= steps; i++) {
            const fraction = i / steps;
            coords.push(this.interpolateGreatCirclePoint(from, to, fraction, angularDistance));
        }
        return coords;
    }

    /** Builds line coordinates with optional closure, densifying each edge */
    private buildLineCoordinates(points: LngLat[], close: boolean): LngLat[] {
        if (points.length < 2) return points;

        const targetPoints = close ? [...points, points[0]] : points;
        const coords: LngLat[] = [];

        for (let i = 1; i < targetPoints.length; i++) {
            const segment = this.buildSegmentCoordinates(targetPoints[i - 1], targetPoints[i]);
            if (coords.length === 0) {
                coords.push(...segment);
            } else {
                coords.push(...segment.slice(1));
            }
        }

        return coords;
    }

    private computeAngularDistanceRad(from: LngLat, to: LngLat): number {
        const lat1 = this.toRadians(from[1]);
        const lat2 = this.toRadians(to[1]);
        const deltaLat = lat2 - lat1;
        const deltaLon = this.normalizeLongitudeDeltaRadians(this.toRadians(to[0] - from[0]));

        const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
        return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private interpolateGreatCirclePoint(from: LngLat, to: LngLat, fraction: number, angularDistance: number): LngLat {
        const lat1 = this.toRadians(from[1]);
        const lon1 = this.toRadians(from[0]);
        const lat2 = this.toRadians(to[1]);
        const lon2 = this.toRadians(to[0]);

        const sinTotal = Math.sin(angularDistance);
        if (sinTotal === 0) return from;

        const a = Math.sin((1 - fraction) * angularDistance) / sinTotal;
        const b = Math.sin(fraction * angularDistance) / sinTotal;

        const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
        const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
        const z = a * Math.sin(lat1) + b * Math.sin(lat2);

        const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
        const lon = Math.atan2(y, x);

        return [this.toDegrees(lon), this.toDegrees(lat)];
    }

    private toRadians(degrees: number): number {
        return degrees * Math.PI / 180;
    }

    private toDegrees(radians: number): number {
        return radians * 180 / Math.PI;
    }

    private normalizeLongitudeDeltaDegrees(delta: number): number {
        return ((delta + 540) % 360) - 180;
    }

    private normalizeLongitudeDeltaRadians(delta: number): number {
        return ((delta + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
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
        this.updateElevationProfile();
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
        this.cursorPosition = null;

        this.updateMapVisualization();
        this.doUpdateRubberbandVisualization();
        this.updateElevationProfile();
    }

    /** Stops further point-adding, keeping the measurement (and its rubber-band-less
     *  line/polygon) visible on the map until cleared or a new measurement starts. */
    private finishMeasurement(): void {
        this.finished = true;
        this.cursorPosition = null;
        this.doUpdateRubberbandVisualization();
        this.updateElevationProfile();
    }

    /** Whether there is anything left to take back. */
    private get canUndo(): boolean {
        return this.points.length > 0;
    }

    /**
     * Takes back the last thing that changed the measurement.
     *
     * Not a general undo stack, because the tool only has three actions that can
     * change it and each one has an obvious inverse: closing a ring is undone by
     * reopening it, finishing a line by resuming it, and adding a point by
     * removing it. A stack would store the same three facts the state already
     * carries, and would then have to be kept in step with it.
     *
     * Reopening deliberately does not also drop the point: closing and adding
     * are separate actions to the user (one click closed the ring; the click
     * before that placed a point), so one press of undo takes back one of them.
     */
    private undoLastAction(): void {
        if (!this.canUndo) return;

        if (this.isClosed) {
            // The closing segment is the last one added, and its length is part
            // of the total; the area only exists while the ring is closed.
            const closing = this.segments[this.segments.length - 1];
            this.segments = this.segments.slice(0, -1);
            this.totalDistanceCm -= closing?.distanceCm ?? 0;
            this.isClosed = false;
            this.areaM2 = 0;
            this.finished = false;
        } else if (this.finished) {
            // Nothing was added by finishing — it only stopped further points.
            this.finished = false;
        } else {
            const lastSegment = this.segments[this.segments.length - 1];
            this.points = this.points.slice(0, -1);
            if (this.points.length >= 1 && lastSegment) {
                this.segments = this.segments.slice(0, -1);
                this.totalDistanceCm -= lastSegment.distanceCm;
            }
            if (this.points.length === 0) {
                // Back to nothing: clear rather than leave a stale total behind.
                this.clearMeasurement();
                return;
            }
        }

        this.cursorPosition = null;
        this.updateMapVisualization();
        this.doUpdateRubberbandVisualization();
        this.updateElevationProfile();
    }

    private clearMeasurement(): void {
        this.points = [];
        this.segments = [];
        this.totalDistanceCm = 0;
        this.cursorPosition = null;
        this.isClosed = false;
        this.finished = false;
        this.areaM2 = 0;
        this.elevationProfile = null;

        this.doUpdateStaticVisualization();
        this.doUpdateRubberbandVisualization();
    }

    private static readonly ELEVATION_SAMPLES = 100;

    private updateElevationProfile(): void {
        const getElevation = this.adapter?.getElevation?.bind(this.adapter);
        if (!getElevation || this.points.length < 2) {
            this.elevationProfile = null;
            return;
        }
        const closed = this.isClosed;
        const line = this.buildLineCoordinates(this.points, closed);
        if (line.length < 2) { this.elevationProfile = null; return; }

        const n = WebmapxMeasureTool.ELEVATION_SAMPLES;
        const samples: number[] = [];
        const last = line.length - 1;
        for (let i = 0; i < n; i++) {
            const t = i / (n - 1);
            const idx = t * last;
            const lo = Math.floor(idx);
            const hi = Math.min(lo + 1, last);
            const f = idx - lo;
            const lng = line[lo][0] + (line[hi][0] - line[lo][0]) * f;
            const lat = line[lo][1] + (line[hi][1] - line[lo][1]) * f;
            const elev = getElevation([lng, lat] as LngLat);
            if (elev === null) { this.elevationProfile = null; return; }
            samples.push(elev);
        }
        this.elevationProfile = samples;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Activation / Deactivation (WebmapxModalTool lifecycle hooks)
    // ─────────────────────────────────────────────────────────────────────

    /** Called when tool becomes active */
    protected onActivate(): void {
        this.clearMeasurement();
        this.adapter?.setDoubleClickZoomEnabled(false);
        this.adapter?.setCursor('crosshair');

        // Create layers when activating (ensures they're on top)
        if (!this.layersCreated) {
            this.createMeasureLayers();
        }

        // Tell the core to ignore busy signals from the measure tool's sources
        this.dispatchEvent(new CustomEvent('webmapx-suppress-busy-for-source', { detail: RUBBERBAND_SOURCE_ID, bubbles: true, composed: true }));
        this.dispatchEvent(new CustomEvent('webmapx-suppress-busy-for-source', { detail: STATIC_SOURCE_ID, bubbles: true, composed: true }));

        // Dispatch tool-specific activation event
        this.dispatchEvent(new CustomEvent('webmapx-measure-activate', {
            bubbles: true,
            composed: true
        }));
    }

    /** Called when tool becomes inactive */
    protected onDeactivate(): void {
        this.clearMeasurement();
        this.adapter?.setDoubleClickZoomEnabled(true);
        this.adapter?.setCursor('');

        // Remove layers when deactivating to reduce map overhead
        this.removeMeasureLayers();

        // Un-suppress busy signals from the measure tool's sources
        this.dispatchEvent(new CustomEvent('webmapx-unsuppress-busy-for-source', { detail: RUBBERBAND_SOURCE_ID, bubbles: true, composed: true }));
        this.dispatchEvent(new CustomEvent('webmapx-unsuppress-busy-for-source', { detail: STATIC_SOURCE_ID, bubbles: true, composed: true }));

        // Dispatch tool-specific deactivation event
        this.dispatchEvent(new CustomEvent('webmapx-measure-deactivate', {
            bubbles: true,
            composed: true
        }));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Rendering
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Hands the measurement to the ordinary save dialog.
     *
     * Deliberately not a download of its own: the dialog already offers the
     * filename, the style checkbox, the .zip-or-plain choice and coordinate
     * rounding, and — more to the point — it writes the `<name>.geojson` +
     * `<name>_style.json` pair that `dropped-layer-builder` reads back. A second
     * exporter here would be a second format to keep in step with the importer.
     *
     * The measurement is passed as `sourceData`, so nothing has to be on the map
     * as a real layer for it to be saved.
     */
    private openSaveDialog = (): void => {
        if (!this.canSave) return;
        const label = this.isClosed ? 'Measured area' : 'Measured line';
        this.saveDialog?.open([{
            layerId: 'measurement',
            label,
            sourceData: this.buildSaveGeoJSON(),
            sublayers: this.buildSaveSublayers(),
        }], this.adapter ?? null);
    };

    /** A single point is a position, not a measurement — nothing to save yet. */
    private get canSave(): boolean {
        return this.segments.length > 0;
    }

    /**
     * The measurement as one feature: a Polygon when closed, a LineString when
     * not, carrying every number the panel shows.
     *
     * **Lengths are written in metres and areas in square metres**, whichever
     * units the panel happens to be reading in. A file that stored "17.12" would
     * need its unit to be read before the number means anything, and would lose
     * three digits on the way; metres are what the tool measured, and the unit
     * the reader chose is recorded separately (`measured_in`) rather than baked
     * into the values. `metadata.attributes` on the layers carries the unit for
     * display, so a re-imported measurement still reads as metres in the info
     * tool without anything having to convert.
     */
    private buildSaveGeoJSON(): GeoJSON.FeatureCollection {
        // The same densified coordinates the tool draws with, not the clicked
        // vertices. A measured leg is a great circle — that is what its length
        // says — and two vertices joined by a straight line in Web Mercator are
        // a different route: Amsterdam to Tokyo saved as two points comes back
        // running through Siberia's south instead of over the pole, with a
        // length that no longer matches the picture. `buildLineCoordinates`
        // splits anything over a degree, which is exactly why the live line
        // curves.
        const line = this.buildLineCoordinates(this.points, this.isClosed)
            .map(p => [p[0], p[1]] as GeoJSON.Position);
        const geometry: GeoJSON.Geometry = this.isClosed
            ? { type: 'Polygon', coordinates: [line] }
            : { type: 'LineString', coordinates: line };

        const properties: Record<string, unknown> = { type: 'measurement', name: this.isClosed ? 'Measured area' : 'Measured line' };
        this.segments.forEach((segment, i) => {
            properties[`segment_${i + 1}`] = round3(segment.distanceCm / 100);
        });
        properties[this.isClosed ? 'perimeter' : 'total'] = round3(this.totalDistanceCm / 100);
        if (this.isClosed) properties.area = round3(this.areaM2);
        // What the reader was looking at, kept as context rather than as a unit:
        // the values above are metric whatever this says.
        properties.measured_in = this.unitSystem;

        // The numbered labels the tool draws along the line are saved as their own
        // points, so the file reproduces what was on screen rather than a bare
        // outline — and each one carries the length of the segment it marks, which
        // is the number the label stands for.
        const labels: GeoJSON.Feature[] = this.segments.map((segment, i) => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: this.segmentLabelPosition(segment).map(round7),
            },
            properties: {
                type: 'segment-label',
                label: String(i + 1),
                segment: i + 1,
                length: round3(segment.distanceCm / 100),
            },
        }));

        return {
            type: 'FeatureCollection',
            features: [{ type: 'Feature', geometry, properties }, ...labels],
        };
    }

    /**
     * The style the saved measurement is drawn with, and the attribute names and
     * units the info tool reads off it.
     *
     * Colours match what the tool draws on the map, so a measurement dragged back
     * on looks like the one that was saved. The translations are what turn
     * `segment_1` into "Segment 1" and 17123.4 into "17123.4 m" after re-import —
     * without them the round trip keeps the numbers and loses their meaning.
     */
    private buildSaveSublayers(): unknown[] {
        const attributes = { translations: this.buildAttributeTranslations() };
        const layers: unknown[] = [];

        // Every layer filters on the feature's own `type`, because one source now
        // holds two different things: the measured shape and the numbered labels
        // along it. Without the filters the label points would be handed to the
        // line layer, and the shape to the symbol layer.
        if (this.isClosed) {
            layers.push({
                id: 'measurement-fill',
                type: 'fill',
                filter: ['==', ['get', 'type'], 'measurement'],
                metadata: { label: 'Measured area', attributes },
                paint: { 'fill-color': DATA_TOOL, 'fill-opacity': 0.1 },
            });
        }
        layers.push({
            id: 'measurement-line',
            type: 'line',
            filter: ['==', ['get', 'type'], 'measurement'],
            metadata: { label: this.isClosed ? 'Measured outline' : 'Measured line', attributes },
            paint: { 'line-color': DATA_TOOL, 'line-width': 2 },
        });
        layers.push({
            id: 'measurement-labels',
            type: 'symbol',
            filter: ['==', ['get', 'type'], 'segment-label'],
            metadata: {
                label: 'Segment numbers',
                attributes: {
                    translations: [
                        { name: 'segment', translation: 'Segment', unit: '' },
                        { name: 'length', translation: 'Length', unit: ' m' },
                    ],
                },
            },
            layout: {
                'text-field': ['get', 'label'],
                // The same font the tool draws with. A map whose style ships no
                // glyphs cannot render any label, saved or live — the numbers are
                // then simply absent, while the shape and its attributes remain.
                'text-font': ['Noto Sans Regular'],
                'text-size': 12,
                'text-anchor': 'center',
                'text-allow-overlap': true,
                'text-ignore-placement': true,
            },
            paint: {
                'text-color': DATA_TOOL,
                'text-halo-color': DATA_TOOL_HALO,
                'text-halo-width': 1.5,
            },
        });
        return layers;
    }

    /** One entry per property the measurement writes, in the order it is read. */
    private buildAttributeTranslations(): Record<string, string>[] {
        // Unit strings carry their own leading space: they are appended to the
        // formatted value as-is.
        const translations: Record<string, string>[] = [{ name: 'name', translation: 'name', unit: '' }];
        this.segments.forEach((_, i) => {
            translations.push({ name: `segment_${i + 1}`, translation: `Segment ${i + 1}`, unit: ' m' });
        });
        translations.push(this.isClosed
            ? { name: 'perimeter', translation: 'Perimeter', unit: ' m' }
            : { name: 'total', translation: 'Total', unit: ' m' });
        if (this.isClosed) {
            translations.push({ name: 'area', translation: 'Area', unit: ' m\u00b2' });
        }
        translations.push({ name: 'measured_in', translation: 'Read in', unit: '' });
        return translations;
    }

    /**
     * Switches the readout between metric and imperial.
     *
     * Only the display changes: distances are held in centimetres and areas in
     * square metres throughout, so switching cannot cost precision and a
     * measurement taken in one system reads exactly the same in the other.
     */
    private toggleUnitSystem = (): void => {
        this.unitSystem = this.unitSystem === 'metric' ? 'imperial' : 'metric';
        try {
            localStorage.setItem(UNIT_SYSTEM_KEY, this.unitSystem);
        } catch {
            // Not remembering the choice is better than failing to apply it.
        }
    };

    private renderSegments(): TemplateResult | typeof nothing {
        if (this.segments.length === 0) {
            return nothing;
        }

        return html`
            <div class="segment-list">
                ${this.segments.map((seg, i) => html`
                    <div class="segment">
                        <span class="segment-label">Segment ${i + 1}</span>
                        <span class="segment-value">${formatDistance(seg.distanceCm, this.unitSystem)}</span>
                    </div>
                `)}
            </div>
        `;
    }

    /**
     * The running total, which becomes the perimeter once the ring is closed.
     *
     * Same number either way — `totalDistanceCm` already includes the closing
     * segment — but not the same quantity: the total of an open line is not a
     * perimeter, and calling it one before it is one is the misreading this tool
     * exists to prevent. The label therefore switches at exactly the moment the
     * area appears, since both come into existence together.
     */
    private renderTotal(): TemplateResult | typeof nothing {
        if (this.segments.length === 0) {
            return nothing;
        }

        return html`
            <div class="total-row">
                <span>${this.isClosed ? 'Perimeter' : 'Total'}</span>
                <span>${formatDistance(this.totalDistanceCm, this.unitSystem)}</span>
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
                <span>${formatArea(this.areaM2, this.unitSystem)}</span>
            </div>
        `;
    }

    private renderInstructions(): TemplateResult {
        if (this.isFinished) {
            return this.isTouchDevice
                ? html`<p class="instructions">Measurement finished. Tap Clear to start a new measurement.</p>`
                : html`<p class="instructions">Measurement finished. Click Clear, or click the map to start a new measurement.</p>`;
        }

        if (this.points.length === 0) {
            return html`<p class="instructions">Click on the map to start measuring.</p>`;
        }

        if (this.points.length < 3) {
            return html`<p class="instructions">Click to add points. Double-click, right-click or ESC to finish.</p>`;
        }

        return html`<p class="instructions">Click near first point to close polygon, or double-click/right-click/ESC to finish.</p>`;
    }

    private renderElevationProfile(): TemplateResult | typeof nothing {
        const profile = this.elevationProfile;
        if (!profile || profile.length < 2) return nothing;

        const W = 220;
        const H = 60;
        const min = Math.min(...profile);
        const max = Math.max(...profile);
        const range = max - min || 1;

        const pts = profile.map((elev, i) => {
            const x = (i / (profile.length - 1)) * W;
            const y = H - ((elev - min) / range) * H;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');

        const minLabel = `${Math.round(min)} m`;
        const maxLabel = `${Math.round(max)} m`;

        return html`
            <div class="elevation-profile">
                <div class="elevation-profile-label">Elevation profile (${minLabel} – ${maxLabel})</div>
                <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
                    <polyline
                        points="${pts}"
                        fill="none"
                        stroke="var(--color-primary, #2b6c8f)"
                        stroke-width="1.5"
                        stroke-linejoin="round"
                    />
                </svg>
            </div>
        `;
    }

    protected render(): TemplateResult {
        return html`
            <div class="tool-content measure-container">
                <div class="measure-content">
                    ${this.renderInstructions()}
                    ${this.renderSegments()}
                    ${this.renderTotal()}
                    ${this.renderArea()}
                    ${this.renderElevationProfile()}

                    <div class="unit-row">
                        <sl-button
                            size="small"
                            title="Read the measurement in metric or imperial units"
                            @click=${this.toggleUnitSystem}
                        >${this.unitSystem === 'metric' ? 'm / km' : 'ft / mi'}</sl-button>
                    </div>
                    <div class="actions">
                        <sl-button
                            size="small"
                            ?disabled=${!this.canUndo}
                            title="Undo the last point (Ctrl+Z, Backspace or Delete)"
                            @click=${this.undoLastAction}
                        >
                            <sl-icon name="arrow-counterclockwise" slot="prefix"></sl-icon>
                            Undo
                        </sl-button>
                        <sl-button size="small" @click=${this.clearMeasurement}>
                            <sl-icon name="trash" slot="prefix"></sl-icon>
                            Clear
                        </sl-button>
                        <sl-button
                            size="small"
                            ?disabled=${!this.canSave}
                            title="Save the measurement as GeoJSON, with its style, ready to drag back onto a map"
                            @click=${this.openSaveDialog}
                        >
                            <sl-icon name="download" slot="prefix"></sl-icon>
                            Save
                        </sl-button>
                    </div>
                </div>
            </div>
            <webmapx-save-layers-dialog></webmapx-save-layers-dialog>
        `;
    }
}
