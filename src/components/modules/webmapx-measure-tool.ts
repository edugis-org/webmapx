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

// OpenLayers imports (static to avoid dynamic import warnings)
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import type OLMap from 'ol/Map';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

// Layer IDs for visualization
const SOURCE_ID = 'webmapx-measure-source';
const POINTS_LAYER_ID = 'webmapx-measure-points';
const LINES_LAYER_ID = 'webmapx-measure-lines';
const RUBBERBAND_LAYER_ID = 'webmapx-measure-rubberband';
const POLYGON_LAYER_ID = 'webmapx-measure-polygon';

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
    private adapterType: 'maplibre' | 'openlayers' | null = null;

    // OpenLayers-specific resources
    private olMeasureSource: VectorSource | null = null;
    private olMeasureLayer: VectorLayer<VectorSource> | null = null;
    private olGeoJSONFormat: GeoJSON | null = null;

    // Throttled update function for rubber-band visualization (50ms = ~20fps)
    private throttledUpdateVisualization = throttle(() => {
        this.doUpdateMapVisualization();
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
        this.detectAdapterType();

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

    private detectAdapterType(): void {
        // Detect which map adapter is being used
        const mapHost = this.mapHost;
        if (mapHost) {
            const adapterAttr = mapHost.getAttribute('adapter');
            if (adapterAttr === 'openlayers') {
                this.adapterType = 'openlayers';
            } else {
                this.adapterType = 'maplibre';
            }
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

    private createMeasureLayers(map: any): void {
        if (this.layersCreated) {
            console.log('[Measure] createMeasureLayers - already created');
            return;
        }

        console.log('[Measure] createMeasureLayers - addSource?:', !!map.addSource, 'addLayer?:', !!map.addLayer, 'getView?:', typeof map.getView);

        // MapLibre style layer creation
        if (map.addSource && map.addLayer) {
            console.log('[Measure] Creating MapLibre layers');
            this.createMapLibreLayers(map);
            this.layersCreated = true;
        }
        // OpenLayers uses a different approach - we'll add vector layer
        else if (map.addLayer && typeof map.getView === 'function') {
            console.log('[Measure] Creating OpenLayers layers');
            this.createOpenLayersLayers(map as OLMap);
            this.layersCreated = true;
        } else {
            console.log('[Measure] No matching map type found!');
        }
    }

    private createMapLibreLayers(map: any): void {
        // Create source for measure geometry
        if (!map.getSource(SOURCE_ID)) {
            map.addSource(SOURCE_ID, {
                type: 'geojson',
                data: this.buildGeoJSON()
            });
        }

        // Polygon fill (for closed shapes)
        if (!map.getLayer(POLYGON_LAYER_ID)) {
            map.addLayer({
                id: POLYGON_LAYER_ID,
                type: 'fill',
                source: SOURCE_ID,
                filter: ['==', ['geometry-type'], 'Polygon'],
                paint: {
                    'fill-color': '#0f62fe',
                    'fill-opacity': 0.1
                }
            });
        }

        // Lines
        if (!map.getLayer(LINES_LAYER_ID)) {
            map.addLayer({
                id: LINES_LAYER_ID,
                type: 'line',
                source: SOURCE_ID,
                filter: ['==', ['get', 'type'], 'line'],
                paint: {
                    'line-color': '#0f62fe',
                    'line-width': 2
                }
            });
        }

        // Rubber band line
        if (!map.getLayer(RUBBERBAND_LAYER_ID)) {
            map.addLayer({
                id: RUBBERBAND_LAYER_ID,
                type: 'line',
                source: SOURCE_ID,
                filter: ['==', ['get', 'type'], 'rubberband'],
                paint: {
                    'line-color': '#0f62fe',
                    'line-width': 2,
                    'line-dasharray': [4, 4]
                }
            });
        }

        // Points
        if (!map.getLayer(POINTS_LAYER_ID)) {
            map.addLayer({
                id: POINTS_LAYER_ID,
                type: 'circle',
                source: SOURCE_ID,
                filter: ['==', ['geometry-type'], 'Point'],
                paint: {
                    'circle-radius': 5,
                    'circle-color': '#fff',
                    'circle-stroke-color': '#0f62fe',
                    'circle-stroke-width': 2
                }
            });
        }
    }

    private createOpenLayersLayers(map: OLMap): void {
        const source = new VectorSource();
        this.olMeasureSource = source;

        const layer = new VectorLayer({
            source,
            style: (feature) => {
                const type = feature.get('type');
                const geomType = feature.getGeometry()?.getType();

                if (geomType === 'Point') {
                    return new Style({
                        image: new CircleStyle({
                            radius: 5,
                            fill: new Fill({ color: '#fff' }),
                            stroke: new Stroke({ color: '#0f62fe', width: 2 })
                        })
                    });
                }

                if (type === 'rubberband') {
                    return new Style({
                        stroke: new Stroke({
                            color: '#0f62fe',
                            width: 2,
                            lineDash: [4, 4]
                        })
                    });
                }

                if (type === 'polygon' || geomType === 'Polygon') {
                    return new Style({
                        fill: new Fill({ color: 'rgba(15, 98, 254, 0.1)' }),
                        stroke: new Stroke({ color: '#0f62fe', width: 2 })
                    });
                }

                return new Style({
                    stroke: new Stroke({ color: '#0f62fe', width: 2 })
                });
            }
        });

        this.olMeasureLayer = layer;
        this.olGeoJSONFormat = new GeoJSON();
        map.addLayer(layer);
    }

    private cleanupMapLayers(): void {
        this.removeMeasureLayers();
        this.nativeMap = null;
    }

    private removeMeasureLayers(): void {
        if (!this.nativeMap || !this.layersCreated) return;

        const map = this.nativeMap as any;

        // MapLibre: remove layers and source
        if (map.getLayer && map.removeLayer && map.removeSource) {
            // Remove layers first (in reverse order of creation)
            if (map.getLayer(POINTS_LAYER_ID)) map.removeLayer(POINTS_LAYER_ID);
            if (map.getLayer(RUBBERBAND_LAYER_ID)) map.removeLayer(RUBBERBAND_LAYER_ID);
            if (map.getLayer(LINES_LAYER_ID)) map.removeLayer(LINES_LAYER_ID);
            if (map.getLayer(POLYGON_LAYER_ID)) map.removeLayer(POLYGON_LAYER_ID);
            // Then remove source
            if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        }

        // OpenLayers: remove layer from map
        if (this.olMeasureLayer && map.removeLayer) {
            map.removeLayer(this.olMeasureLayer);
            this.olMeasureLayer = null;
            this.olMeasureSource = null;
            this.olGeoJSONFormat = null;
        }

        this.layersCreated = false;
    }

    /** Immediate update - used when adding/removing points */
    private updateMapVisualization(): void {
        this.doUpdateMapVisualization();
    }

    /** Actual visualization update logic */
    private doUpdateMapVisualization(): void {
        if (!this.nativeMap || !this.layersCreated) return;

        const map = this.nativeMap as any;
        const geojson = this.buildGeoJSON();

        // MapLibre update
        if (map.getSource) {
            const source = map.getSource(SOURCE_ID);
            if (source?.setData) {
                source.setData(geojson);
            }
        }

        // OpenLayers update
        if (this.olMeasureSource && this.olGeoJSONFormat) {
            this.olMeasureSource.clear();
            const features = this.olGeoJSONFormat.readFeatures(geojson, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });
            this.olMeasureSource.addFeatures(features);
        }
    }

    private buildGeoJSON(): GeoJSON.FeatureCollection {
        const features: GeoJSON.Feature[] = [];

        // Points
        this.points.forEach((point, index) => {
            features.push({
                type: 'Feature',
                properties: {
                    index,
                    type: 'point',
                    isFirst: index === 0,
                    isLast: index === this.points.length - 1
                },
                geometry: {
                    type: 'Point',
                    coordinates: point
                }
            });
        });

        // Line segments
        if (this.points.length >= 2) {
            const lineCoords = this.isClosed
                ? [...this.points, this.points[0]]
                : this.points;

            features.push({
                type: 'Feature',
                properties: { type: 'line' },
                geometry: {
                    type: 'LineString',
                    coordinates: lineCoords
                }
            });
        }

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

        // Closed polygon
        if (this.isClosed && this.points.length >= 3) {
            features.push({
                type: 'Feature',
                properties: { type: 'polygon' },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[...this.points, this.points[0]]]
                }
            });
        }

        return {
            type: 'FeatureCollection',
            features
        };
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

        this.updateMapVisualization();
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

        console.log('[Measure] onActivate - nativeMap?:', !!this.nativeMap, 'layersCreated?:', this.layersCreated);

        // Create layers when activating (ensures they're on top)
        if (this.nativeMap && !this.layersCreated) {
            this.ensureLayersCreated();
        } else if (!this.nativeMap) {
            console.log('[Measure] onActivate - no nativeMap yet!');
        }

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

    /** Ensure layers are created, waiting for map to be ready if needed */
    private ensureLayersCreated(): void {
        if (!this.nativeMap || this.layersCreated) return;

        const map = this.nativeMap as any;

        // Detect map type
        const isOpenLayers = typeof map.getView === 'function' && !map.loaded;
        const isMapLibre = typeof map.loaded === 'function';

        console.log('[Measure] ensureLayersCreated - isOL:', isOpenLayers, 'isML:', isMapLibre);
        console.log('[Measure] map.isStyleLoaded?:', map.isStyleLoaded?.());
        console.log('[Measure] map.loaded?:', map.loaded?.());

        if (isOpenLayers) {
            // OpenLayers - can add layers immediately
            console.log('[Measure] Creating OL layers');
            this.createMeasureLayers(map);
        } else if (isMapLibre) {
            // MapLibre - check if style is loaded
            if (map.isStyleLoaded && map.isStyleLoaded()) {
                console.log('[Measure] Style loaded, creating ML layers');
                this.createMeasureLayers(map);
            } else {
                console.log('[Measure] Style not loaded, waiting...');
                // Wait for style to load
                map.once('style.load', () => {
                    console.log('[Measure] style.load event fired');
                    if (this.active && !this.layersCreated) {
                        this.createMeasureLayers(map);
                    }
                });
                // Also try 'load' event as fallback
                map.once('load', () => {
                    console.log('[Measure] load event fired');
                    if (this.active && !this.layersCreated) {
                        this.createMeasureLayers(map);
                    }
                });
            }
        } else {
            // Fallback
            console.log('[Measure] Fallback - creating layers');
            this.createMeasureLayers(map);
        }
    }

    public deactivate(): void {
        this.active = false;  // Triggers setter which calls onDeactivate()
    }

    /** Called when tool becomes inactive */
    private onDeactivate(): void {
        this.clearMeasurement();

        // Remove layers when deactivating to reduce map overhead
        this.removeMeasureLayers();

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
