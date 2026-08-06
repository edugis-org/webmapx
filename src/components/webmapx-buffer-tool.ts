/**
 * Buffer Tool — creates a polygon buffer around features from a selected layer.
 *
 * Computation runs in a shared GDAL WASM web worker (spatial-worker-manager).
 * Input:  all features from GeoJSON layers; rendered viewport features from vector tile layers.
 * Output: new GeoJSON fill layer added to the map. Previous output can be overwritten.
 *
 * Registration:
 *   dynamic-layout.ts → TOOL_ELEMENT_TAGS['buffer'] = 'webmapx-buffer-tool'
 *   dynamic-layout.ts → DEFAULT_TOOL_METADATA['buffer'] = { label: 'Buffer', icon: { src: bufferIconUrl } }
 *   dynamic-layout.ts → KNOWN_TOOLS: { id: 'buffer', label: 'Buffer', icon: { src: bufferIconUrl } }
 */

import { html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import type { IMapState } from '../store/IMapState';
import { runSpatialOp } from '../utils/spatial-worker-manager';
import type { WebmapxMapElement } from './webmapx-map';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import bufferIconUrl from '../icons/buffer.svg?url';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';

// IDs used for the output layer and source
const OUTPUT_LAYER_PREFIX = 'webmapx-buffer-out:';
const OUTPUT_SOURCE_PREFIX = 'webmapx-buffer-src:';

/** Render types that can be queried for features (excludes raster). */
const VECTOR_LAYER_TYPES = new Set([
    'fill', 'line', 'circle', 'symbol', 'geojson', 'vector', 'label', 'fill-extrusion',
]);

interface LayerOption {
    id: string;
    label: string;
}

@customElement('webmapx-buffer-tool')
export class WebmapxBufferTool extends WebmapxModalTool {
    readonly toolId = 'buffer';

    // ─── State ───────────────────────────────────────────────────────────

    @state() private availableLayers: LayerOption[] = [];
    @state() private selectedLayerId = '';
    @state() private availableSourceLayers: string[] = [];
    @state() private selectedSourceLayer = '';
    @state() private distanceMeters = 500;
    @state() private segments = 16;
    @state() private outputName = '';
    @state() private overwrite = true;
    @state() private busy = false;
    @state() private error: string | null = null;
    @state() private lastOutputLayerId: string | null = null;

    // ─── Styles ──────────────────────────────────────────────────────────

    static styles = css`
        :host { display: block; }

        :host(:not([active])) .tool-content { display: none; }

        .tool-content {
            padding: var(--sl-spacing-medium);
            display: flex;
            flex-direction: column;
            gap: var(--sl-spacing-small);
            font-size: var(--sl-font-size-small);
            min-width: 240px;
        }

        .actions {
            display: flex;
            gap: var(--sl-spacing-x-small);
            justify-content: flex-end;
            margin-top: var(--sl-spacing-x-small);
        }

        .status {
            display: flex;
            align-items: center;
            gap: var(--sl-spacing-x-small);
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
        }

        sl-alert {
            font-size: var(--sl-font-size-x-small);
        }

        sl-select, sl-input {
            --sl-input-height-medium: 28px;
            --sl-input-font-size-medium: var(--sl-font-size-small);
        }
    `;

    // ─── Lifecycle ───────────────────────────────────────────────────────

    private lastMapLayers: IMapState['mapLayers'] | null = null;
    private _escHandler: ((e: KeyboardEvent) => void) | null = null;

    protected onActivate(): void {
        this._escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') this.deactivate(); };
        document.addEventListener('keydown', this._escHandler);
    }

    protected onDeactivate(): void {
        document.removeEventListener('keydown', this._escHandler!);
        this._escHandler = null;
    }

    protected onStateChanged(state: IMapState): void {
        const mapLayers = state.mapLayers ?? {};
        this.lastMapLayers = mapLayers;
        this.availableLayers = Object.entries(mapLayers)
            .filter(([, meta]) => {
                const t = (meta as Record<string, unknown>).layerType as string | undefined;
                // Exclude raster, hillshade, sky, background
                return !t || VECTOR_LAYER_TYPES.has(t);
            })
            .map(([id, meta]) => ({
                id,
                label: (meta as Record<string, unknown>).label as string ?? id,
            }));

        // Auto-select first layer if nothing selected yet
        if (!this.selectedLayerId && this.availableLayers.length > 0) {
            this.selectedLayerId = this.availableLayers[0].id;
            this.syncLayerState();
        }

        // If selected layer was removed, reset
        if (this.selectedLayerId && !this.availableLayers.find(l => l.id === this.selectedLayerId)) {
            this.selectedLayerId = this.availableLayers[0]?.id ?? '';
            this.syncLayerState();
            this.lastOutputLayerId = null;
            this.overwrite = true;
        }

        // Keep source layers in sync (sublayers stored in mapLayers metadata at registration)
        this.syncSourceLayers();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────

    private syncLayerState(): void {
        this.syncSourceLayers();
        this.syncOutputName();
    }

    private syncOutputName(): void {
        const name = this.selectedSourceLayer || this.availableLayers.find(l => l.id === this.selectedLayerId)?.label || this.selectedLayerId;
        this.outputName = `${name} buffer`;
    }

    private sourceLayers(layerId: string): string[] {
        const meta = (this.lastMapLayers ?? {})[layerId] as Record<string, unknown> | undefined;
        const sublayers = meta?.sublayers;
        if (!Array.isArray(sublayers)) return [];
        const seen = new Set<string>();
        const collect = (items: unknown[]): void => {
            for (const sub of items) {
                if (!sub || typeof sub !== 'object') continue;
                const s = sub as Record<string, unknown>;
                const sl = s['source-layer'];
                if (typeof sl === 'string' && sl) seen.add(sl);
                if (Array.isArray(s.sublayers)) collect(s.sublayers);
            }
        };
        collect(sublayers);
        return [...seen];
    }

    private syncSourceLayers(): void {
        const sourceLayers = this.sourceLayers(this.selectedLayerId);
        if (sourceLayers.join(',') === this.availableSourceLayers.join(',')) return;
        this.availableSourceLayers = sourceLayers;
        if (!sourceLayers.includes(this.selectedSourceLayer)) {
            this.selectedSourceLayer = sourceLayers[0] ?? '';
            this.syncOutputName();
        }
    }

    private get mapElement(): (WebmapxMapElement & { addLayerRequest: (config: Record<string, unknown>) => Promise<boolean>; removeInlineLayer: (layerId: string) => void }) | null {
        return this.mapHost as any;
    }

    // ─── Event handlers ──────────────────────────────────────────────────

    private handleLayerChange(e: Event): void {
        this.selectedLayerId = (e.target as HTMLSelectElement).value;
        this.syncLayerState();
        this.error = null;
        // Previous run's output belonged to a different input layer — its
        // "replace previous output" option no longer applies here.
        this.lastOutputLayerId = null;
        this.overwrite = true;
    }

    private handleSourceLayerChange(e: Event): void {
        this.selectedSourceLayer = (e.target as HTMLSelectElement).value;
        this.syncOutputName();
    }

    private handleDistanceChange(e: Event): void {
        const v = parseFloat((e.target as HTMLInputElement).value);
        if (!isNaN(v)) this.distanceMeters = v;
    }

    private handleSegmentsChange(e: Event): void {
        const v = parseInt((e.target as HTMLInputElement).value);
        if (!isNaN(v) && v >= 4) this.segments = v;
    }

    private handleOutputNameChange(e: Event): void {
        this.outputName = (e.target as HTMLInputElement).value;
    }

    private handleOverwriteChange(e: Event): void {
        this.overwrite = (e.target as HTMLInputElement).checked;
    }

    private async handleRun(): Promise<void> {
        if (!this.adapter || !this.selectedLayerId || this.busy) return;

        this.busy = true;
        this.error = null;

        try {
            // 1. Get input features
            const queryOpts = this.selectedSourceLayer ? { sourceLayer: this.selectedSourceLayer } : undefined;
            const input = await this.adapter.queryLayerFeatures(this.selectedLayerId, queryOpts);
            if (!input.features.length) {
                this.error = 'Selected layer has no features (try zooming in for vector tile layers).';
                return;
            }

            // 2. Run buffer in GDAL worker
            const centerLat = this.adapter?.getViewportState().center[1] ?? 0;
            const result = await runSpatialOp({
                op: 'buffer',
                input,
                distanceMeters: this.distanceMeters,
                segments: this.segments,
                centerLat,
            });

            if (!result.features.length) {
                this.error = 'Buffer produced no output features.';
                return;
            }

            // 3. Build output layer id
            const baseLayerId = `${OUTPUT_LAYER_PREFIX}${this.selectedLayerId}`;
            const baseSourceId = `${OUTPUT_SOURCE_PREFIX}${this.selectedLayerId}`;
            const suffix = this.overwrite ? '' : `-${Date.now()}`;
            const outputLayerId = `${baseLayerId}${suffix}`;
            const outputSourceId = `${baseSourceId}${suffix}`;

            const label = this.outputName.trim() || `${this.availableLayers.find(l => l.id === this.selectedLayerId)?.label ?? 'layer'} buffer`;

            // 4. Remove previous output if overwrite mode.
            // removeInlineLayer leaves the source intact — clear its data first so the
            // old result disappears immediately, then re-add layer+source with new data.
            if (this.overwrite && this.lastOutputLayerId && this.mapElement) {
                const emptyFc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
                this.adapter?.getSource(outputSourceId)?.setData(emptyFc);
                try {
                    this.mapElement.removeInlineLayer(this.lastOutputLayerId);
                } catch (_) { /* layer may already be gone */ }
            }

            // 5. Add result as new GeoJSON fill layer
            const layerConfig: Record<string, unknown> = {
                id: outputLayerId,
                type: 'fill',
                source: outputSourceId,
                sources: {
                    [outputSourceId]: {
                        id: outputSourceId,
                        type: 'geojson',
                        data: result,
                    },
                },
                paint: {
                    'fill-color': '#4a90d9',
                    'fill-opacity': 0.35,
                    'fill-outline-color': '#1a5fa8',
                },
                metadata: {
                    label,
                    dynamic: true,
                    legendRole: 'overlay',
                },
            };

            await this.mapElement?.addLayerRequest(layerConfig);
            this.lastOutputLayerId = layerConfig.id as string;

        } catch (err) {
            this.error = err instanceof Error ? err.message : String(err);
        } finally {
            this.busy = false;
        }
    }

    // ─── Render ──────────────────────────────────────────────────────────

    protected render() {
        const hasLayers = this.availableLayers.length > 0;

        return html`
            <div class="tool-content">

                <sl-select
                    label="Input layer"
                    size="small"
                    value=${this.selectedLayerId}
                    ?disabled=${!hasLayers || this.busy}
                    @sl-change=${this.handleLayerChange}
                >
                    ${hasLayers
                        ? this.availableLayers.map(l => html`
                            <sl-option value=${l.id}>${l.label}</sl-option>
                        `)
                        : html`<sl-option value="">No vector layers</sl-option>`
                    }
                </sl-select>

                ${this.availableSourceLayers.length > 1 ? html`
                    <sl-select
                        label="Sub-layer"
                        size="small"
                        value=${this.selectedSourceLayer}
                        ?disabled=${this.busy}
                        @sl-change=${this.handleSourceLayerChange}
                    >
                        ${this.availableSourceLayers.map(sl => html`
                            <sl-option value=${sl}>${sl}</sl-option>
                        `)}
                    </sl-select>
                ` : nothing}

                <div>
                    <sl-input
                        label="Buffer distance"
                        size="small"
                        type="number"
                        step="100"
                        value=${this.distanceMeters}
                        ?disabled=${this.busy}
                        @sl-change=${this.handleDistanceChange}
                    >
                        <span slot="suffix">m</span>
                    </sl-input>
                </div>

                <sl-input
                    label="Segments per quarter circle"
                    size="small"
                    type="number"
                    min="4"
                    max="64"
                    step="4"
                    value=${this.segments}
                    ?disabled=${this.busy}
                    @sl-change=${this.handleSegmentsChange}
                ></sl-input>

                <sl-input
                    label="Output layer name"
                    size="small"
                    .value=${this.outputName}
                    ?disabled=${this.busy}
                    @sl-change=${this.handleOutputNameChange}
                ></sl-input>

                ${this.lastOutputLayerId ? html`
                    <sl-checkbox
                        size="small"
                        ?checked=${this.overwrite}
                        ?disabled=${this.busy}
                        @sl-change=${this.handleOverwriteChange}
                    >Replace previous buffer output</sl-checkbox>
                ` : nothing}

                ${this.error ? html`
                    <sl-alert variant="danger" open>
                        <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
                        ${this.error}
                    </sl-alert>
                ` : nothing}

                <div class="actions">
                    ${this.busy ? html`
                        <div class="status">
                            <sl-spinner></sl-spinner>
                            Computing buffer…
                        </div>
                    ` : nothing}
                    <sl-button
                        size="small"
                        variant="text"
                        @click=${() => this.deactivate()}
                    >Close</sl-button>
                    <sl-button
                        size="small"
                        variant="primary"
                        ?disabled=${!hasLayers || this.busy}
                        @click=${this.handleRun}
                    >
                        <sl-icon slot="prefix" src="${bufferIconUrl}"></sl-icon>
                        Buffer
                    </sl-button>
                </div>

            </div>
        `;
    }
}
