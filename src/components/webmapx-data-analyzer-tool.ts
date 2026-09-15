import { html, css, nothing, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { WebmapxModalTool } from './webmapx-modal-tool';
import { classifyColorChannel, defaultSettings } from './styler/classify-channel';
import type { IMapState } from '../store/IMapState';
import type { AnalyzerSuggestion, DatasetAnalysis, FieldProfile } from '../utils/data-analyzer';
import { encodeChannel } from '../utils/layer-style-model';
import { buildProportionalRadius } from '../utils/style-builder';
import { attributeTranslations } from '../utils/attribute-translations';
import { areaUnitFactor, densityFeatures, geometryKind, measureKind, proportionalLineWidth, substituteField, withZeroClass, zeroClass, type MeasureKind } from '../utils/thematic-map';
import type { WebmapxMapElement } from './webmapx-map';
import { DATA_START } from '../theme/data-colors';
import { isViewportLimitedSource, sampleLayerFeatures } from '../utils/layer-features';
import type { DataAnalyzerRequest, DataAnalyzerResponse, LisaResult } from '../workers/data-analyzer.worker';
import type { LisaClass } from '../utils/spatial-autocorrelation';
import { describeType, shortPartNames } from '../utils/composition-profile';
import { schemeByName } from '../utils/color-schemes';

import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/radio-button/radio-button.js';
import '@shoelace-style/shoelace/dist/components/radio-group/radio-group.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';

const VECTOR_LAYER_TYPES = new Set([
    'fill', 'line', 'circle', 'symbol', 'geojson', 'vector', 'label', 'fill-extrusion',
]);

const OUTPUT_LAYER_PREFIX = 'webmapx-data-analyzer-out:';
const OUTPUT_SOURCE_PREFIX = 'webmapx-data-analyzer-src:';
/** LISA classes in legend order, with the conventional red/blue hot/cold spot colours. */
const LISA_STYLE: Array<{ cls: LisaClass; label: string; color: string }> = [
    { cls: 'high-high', label: 'High among high (hot spot)', color: '#d7191c' },
    { cls: 'low-low', label: 'Low among low (cold spot)', color: '#2c7bb6' },
    { cls: 'high-low', label: 'High among low (outlier)', color: '#fdae61' },
    { cls: 'low-high', label: 'Low among high (outlier)', color: '#abd9e9' },
    { cls: 'not-significant', label: 'Not significant', color: '#eeeeee' },
    { cls: 'no-data', label: 'No data', color: '#bdbdbd' },
];

/**
 * Palette for composition types: the styler's ColorBrewer Set1, the most
 * contrasting qualitative scheme — types are categories, so they need to be
 * told apart at a glance without implying an order. The list is the fallback
 * for a class count the scheme does not cover.
 */
const TYPE_SCHEME = 'Set1';
/**
 * A type that is "close to average" is the backdrop, not a finding: given the
 * scheme's first (loudest) colour it filled most of the map, being the largest
 * type. It gets a quiet grey, and the distinctive types get the strong colours.
 */
const AVERAGE_TYPE_COLOR = '#d9d9d9';
/** Lighter than the average type, so "no data" does not read as "ordinary". */
const PROFILE_NO_DATA_COLOR = '#f7f7f7';
const TYPE_COLORS = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33'];

/** Radius of the circle drawn for the largest value, in pixels. */
const MAX_CIRCLE_RADIUS = 30;

/** Where an output layer can draw from the analysed layer's own source instead of a copy. */
interface SourceReference {
    sourceId: string;
    config: Record<string, unknown>;
    sourceLayer?: string;
    filter?: unknown;
}

interface OutputEntry {
    key: string;
    style: Record<string, unknown>;
    label: string;
    what: string;
    /** A GeoJSON copy, for results that need values no style expression can compute. */
    features?: GeoJSON.Feature[];
    /** The original source, for results a style expression can compute from it. */
    source?: SourceReference;
}

interface LayerOption {
    id: string;
    label: string;
}

@customElement('webmapx-data-analyzer-tool')
export class WebmapxDataAnalyzerTool extends WebmapxModalTool {
    readonly toolId = 'data-analyzer';

    @state() private availableLayers: LayerOption[] = [];
    @state() private selectedLayerId = '';
    @state() private selectedSourceLayer = '';
    @state() private analysis: DatasetAnalysis | null = null;
    @state() private busy = false;
    @state() private status = '';
    @state() private error: string | null = null;
    @state() private cancelled = false;
    @state() private actionMessage: string | null = null;
    @state() private lastMapLayers: IMapState['mapLayers'] = {};
    @state() private overwrite = true;
    /** The layers the last run added, replaced together when "Replace previous result" is on. */
    @state() private lastOutputLayerIds: string[] = [];
    /** The user's log-scale choice per field, over the analysis' own suggestion. */
    @state() private logOverride: Record<string, boolean> = {};
    /** The user's correction of the absolute/relative guess, per field. */
    @state() private kindOverride: Record<string, MeasureKind> = {};
    private lastFeatures: GeoJSON.Feature[] = [];
    private attributeCatalog: Record<string, unknown> = {};

    private analyzeToken = 0;
    private lastMapBusy = false;
    private worker: Worker | null = null;

    static styles = css`
        :host { display: block; }
        :host(:not([active])) .tool-content { display: none; }

        .tool-content {
            padding: var(--sl-spacing-medium);
            min-height: 260px;
            display: flex;
            flex-direction: column;
            gap: var(--sl-spacing-small);
            font-size: var(--sl-font-size-small);
        }

        .row {
            display: flex;
            align-items: center;
            gap: var(--sl-spacing-x-small);
        }

        .row sl-select { flex: 1; min-width: 0; }

        .hint, .meta {
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
        }

        .warning {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            color: var(--sl-color-warning-700, #915930);
            font-size: var(--sl-font-size-x-small);
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px;
        }

        .metric {
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--webmapx-radius-md, 6px);
            padding: 6px;
        }

        .metric strong {
            display: block;
            font-size: var(--sl-font-size-medium);
        }

        .cards {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .item {
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--webmapx-radius-md, 6px);
            padding: 8px;
        }

        .item-head {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 3px;
        }

        .item-title {
            flex: 1;
            min-width: 0;
            font-weight: 600;
            overflow-wrap: anywhere;
        }

        .field-list {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 6px;
        }

        .field {
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--webmapx-radius-sm, 4px);
            padding: 2px 5px;
            font-size: var(--sl-font-size-x-small);
            overflow-wrap: anywhere;
        }

        .profile {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 2px 8px;
        }

        .profile-name {
            font-weight: 600;
            overflow-wrap: anywhere;
        }

        .profile-stats {
            grid-column: 1 / -1;
            display: flex;
            flex-wrap: wrap;
            gap: 2px 10px;
            color: var(--sl-color-neutral-600, #5f6b76);
            font-size: var(--sl-font-size-x-small);
        }

        .profile-stats span {
            white-space: nowrap;
        }

        .actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: flex-end;
            gap: 4px 6px;
            margin-top: 6px;
        }

        .related {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 4px;
            margin-top: 6px;
        }

        /* Field names are long and the panel is narrow: a button wraps its
           label instead of pushing the row out of the panel. */
        .actions sl-button, .related sl-button { max-width: 100%; }
        .actions sl-button::part(base), .related sl-button::part(base) { height: auto; min-height: var(--sl-input-height-small); }
        .actions sl-button::part(label), .related sl-button::part(label) {
            white-space: normal;
            overflow-wrap: anywhere;
            line-height: 1.3;
            padding-block: 3px;
            text-align: left;
        }

        sl-tab-group {
            --indicator-color: var(--color-primary, #1b6ec2);
        }

        sl-alert { font-size: var(--sl-font-size-x-small); }
        sl-select { --sl-input-height-medium: 28px; --sl-input-font-size-medium: var(--sl-font-size-small); }
    `;

    protected onActivate(): void {
        if (!this.selectedLayerId && this.availableLayers.length) {
            this.selectLayer(this.defaultLayerId());
        } else if (this.selectedLayerId && !this.analysis && !this.busy) {
            void this.runAnalysis();
        }
    }

    protected onStateChanged(state: IMapState): void {
        const mapLayers = state.mapLayers ?? {};
        this.lastMapLayers = mapLayers;
        this.attributeCatalog = state.attributeMetadata ?? {};
        if (this.lastOutputLayerIds.some(id => !mapLayers[id])) this.lastOutputLayerIds = this.lastOutputLayerIds.filter(id => mapLayers[id]);
        this.availableLayers = Object.entries(mapLayers)
            .filter(([, meta]) => {
                const type = meta.layerType;
                return !type || VECTOR_LAYER_TYPES.has(type);
            })
            .map(([id, meta]) => ({ id, label: meta.label ?? id }));

        if (this.selectedLayerId && !this.availableLayers.some(layer => layer.id === this.selectedLayerId)) {
            this.selectedLayerId = '';
            this.selectedSourceLayer = '';
            this.analysis = null;
        }

        if (!this.selectedLayerId && this.active && this.availableLayers.length) {
            this.selectLayer(this.defaultLayerId());
        }

        const busy = state.mapBusy === true;
        const settled = this.lastMapBusy && !busy;
        this.lastMapBusy = busy;
        if (settled && this.active && this.selectedLayerId && !this.analysis && this.isViewportLimited(this.selectedLayerId)) {
            void this.runAnalysis();
        }
    }

    /**
     * The layer the user is most likely looking at: the top-most visible one
     * that is not this tool's own output. `mapLayers` is ordered bottom to top.
     */
    private defaultLayerId(): string {
        const candidates = [...this.availableLayers].reverse();
        const visible = candidates.find(layer =>
            !layer.id.startsWith(OUTPUT_LAYER_PREFIX) && this.lastMapLayers[layer.id]?.visible !== false);
        return (visible ?? candidates[0]).id;
    }

    private selectLayer(layerId: string): void {
        const sourceLayers = this.sourceLayers(layerId);
        this.selectedLayerId = layerId;
        this.selectedSourceLayer = sourceLayers[0] ?? '';
        this.analysis = null;
        this.error = null;
        this.cancelled = false;
        this.actionMessage = null;
        if (this.active) void this.runAnalysis();
    }

    private sourceLayers(layerId: string): string[] {
        const meta = this.lastMapLayers[layerId] as Record<string, unknown> | undefined;
        const sublayers = meta?.sublayers;
        if (!Array.isArray(sublayers)) return [];
        const seen = new Set<string>();
        const collect = (items: unknown[]): void => {
            for (const item of items) {
                if (!item || typeof item !== 'object') continue;
                const sub = item as Record<string, unknown>;
                if (typeof sub['source-layer'] === 'string' && sub['source-layer']) seen.add(sub['source-layer']);
                if (Array.isArray(sub.sublayers)) collect(sub.sublayers);
            }
        };
        collect(sublayers);
        return [...seen];
    }

    private isViewportLimited(layerId: string): boolean {
        const sourceId = this.lastMapLayers[layerId]?.sourceId;
        return isViewportLimitedSource(this.adapter, sourceId);
    }

    private labelOf(layerId: string): string {
        return this.availableLayers.find(layer => layer.id === layerId)?.label ?? layerId;
    }

    private async runAnalysis(): Promise<void> {
        if (!this.adapter || !this.selectedLayerId || this.busy) return;
        const token = ++this.analyzeToken;
        this.cancelWorker();
        this.busy = true;
        this.status = 'Reading layer features...';
        this.error = null;
        this.cancelled = false;
        this.actionMessage = null;
        try {
            await this.updateComplete;
            await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
            const sample = await sampleLayerFeatures(this.adapter, this.selectedLayerId, {
                sourceId: this.lastMapLayers[this.selectedLayerId]?.sourceId,
                sourceLayer: this.selectedSourceLayer || undefined,
            });
            if (token !== this.analyzeToken) return;
            if (!sample.features) {
                this.error = 'This layer cannot be read for analysis.';
                this.analysis = null;
                return;
            }
            if (sample.features.length === 0) {
                this.error = this.isViewportLimited(this.selectedLayerId)
                    ? 'No features are drawn in the current view. Zoom or pan to the features you want to analyze.'
                    : 'This layer has no features.';
                this.analysis = null;
                return;
            }
            this.status = `Preparing ${sample.features.length} features for analysis...`;
            this.lastFeatures = sample.features;
            this.analysis = await this.analyzeInWorker(sample.features, sample.complete, token);
        } catch (error) {
            if (token === this.analyzeToken) {
                console.error('[data-analyzer] analysis failed', error);
                this.error = error instanceof Error ? error.message : String(error);
                this.analysis = null;
            }
        } finally {
            if (token === this.analyzeToken) {
                this.busy = false;
                this.status = '';
            }
        }
    }

    private analyzeInWorker(features: GeoJSON.Feature[], complete: boolean, token: number): Promise<DatasetAnalysis> {
        return this.runWorker(
            { op: 'analyze', properties: features.map(f => f.properties ?? {}), geometries: features.map(f => f.geometry ?? null), complete },
            token,
        ).then(message => {
            if (message.status !== 'ok') throw new Error('Unexpected analysis response.');
            return message.analysis;
        });
    }

    /** One request, one fresh worker: terminated when it answers, fails or is cancelled. */
    private runWorker(request: DataAnalyzerRequest, token: number): Promise<Exclude<DataAnalyzerResponse, { status: 'progress' } | { status: 'error' }>> {
        return new Promise((resolve, reject) => {
            const worker = new Worker(new URL('../workers/data-analyzer.worker.ts', import.meta.url), { type: 'module' });
            this.worker = worker;

            worker.onmessage = (event: MessageEvent<DataAnalyzerResponse>) => {
                if (token !== this.analyzeToken || worker !== this.worker) return;
                const message = event.data;
                if (message.status === 'progress') {
                    this.status = message.message;
                } else if (message.status === 'error') {
                    this.cancelWorker();
                    reject(new Error(message.message));
                } else {
                    this.cancelWorker();
                    resolve(message);
                }
            };

            worker.onerror = (event: ErrorEvent) => {
                if (token !== this.analyzeToken || worker !== this.worker) return;
                this.cancelWorker();
                reject(new Error(event.message || 'Data analysis worker failed.'));
            };

            try {
                worker.postMessage(request);
            } catch (error) {
                this.cancelWorker();
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        });
    }

    disconnectedCallback(): void {
        this.cancelWorker();
        super.disconnectedCallback();
    }

    private cancelAnalysis(): void {
        this.analyzeToken++;
        this.cancelWorker();
        this.busy = false;
        this.status = '';
        this.cancelled = true;
    }

    private cancelWorker(): void {
        this.worker?.terminate();
        this.worker = null;
    }

    protected render(): TemplateResult {
        const sourceLayers = this.selectedLayerId ? this.sourceLayers(this.selectedLayerId) : [];
        return html`
            <div class="tool-content">
                <div class="row">
                    <sl-select
                        label="Layer"
                        size="small"
                        value=${this.selectedLayerId}
                        ?disabled=${this.busy || this.availableLayers.length === 0}
                        @sl-change=${(event: Event) => this.selectLayer((event.target as HTMLSelectElement).value)}
                    >
                        ${this.availableLayers.length
                            ? this.availableLayers.map(layer => html`<sl-option value=${layer.id}>${layer.label}</sl-option>`)
                            : html`<sl-option value="">No vector layers on the map</sl-option>`}
                    </sl-select>
                    <sl-button
                        size="small"
                        ?disabled=${!this.selectedLayerId}
                        aria-label=${this.busy ? 'Cancel analysis' : 'Run analysis'}
                        @click=${() => this.busy ? this.cancelAnalysis() : this.runAnalysis()}
                    >
                        ${this.busy ? html`Cancel` : html`<sl-icon name="arrow-clockwise"></sl-icon>`}
                    </sl-button>
                </div>
                ${sourceLayers.length > 1 ? html`
                    <sl-select
                        label="Sub-layer"
                        size="small"
                        value=${this.selectedSourceLayer}
                        ?disabled=${this.busy}
                        @sl-change=${(event: Event) => {
                            this.selectedSourceLayer = (event.target as HTMLSelectElement).value;
                            this.analysis = null;
                            void this.runAnalysis();
                        }}
                    >
                        ${sourceLayers.map(sourceLayer => html`<sl-option value=${sourceLayer}>${sourceLayer}</sl-option>`)}
                    </sl-select>
                ` : nothing}
                ${this.selectedLayerId && this.isViewportLimited(this.selectedLayerId) ? html`
                    <div class="warning">
                        <sl-icon name="exclamation-triangle"></sl-icon>
                        MVT and other tile-backed layers are analyzed from features drawn in the current view.
                    </div>
                ` : nothing}
                ${this.busy ? html`<div class="hint">${this.status || `Waiting for ${this.labelOf(this.selectedLayerId)} analysis...`}</div>` : nothing}
                ${this.cancelled ? html`<div class="hint">Analysis cancelled. Use refresh to run it again.</div>` : nothing}
                ${this.error ? html`<sl-alert variant="danger" open>${this.error}</sl-alert>` : nothing}
                ${this.actionMessage ? html`<sl-alert variant="success" open>${this.actionMessage}</sl-alert>` : nothing}
                ${this.analysis ? this.renderAnalysis(this.analysis) : nothing}
            </div>
        `;
    }

    private renderAnalysis(analysis: DatasetAnalysis): TemplateResult {
        return html`
            <div class="summary">
                <div class="metric"><strong>${analysis.featureCount}</strong><span class="meta">features</span></div>
                <div class="metric"><strong>${analysis.profiles.length}</strong><span class="meta">fields</span></div>
                <div class="metric"><strong>${analysis.usableNumericFields.length}</strong><span class="meta">usable</span></div>
            </div>
            ${analysis.complete ? nothing : html`
                <sl-alert variant="warning" open>Results use loaded viewport features, not the full source.</sl-alert>
            `}
            <sl-tab-group>
                <sl-tab slot="nav" panel="suggestions">Options</sl-tab>
                <sl-tab slot="nav" panel="fields">Fields</sl-tab>
                <sl-tab slot="nav" panel="families">Families</sl-tab>

                <sl-tab-panel name="suggestions">${this.renderSuggestions(analysis.suggestions, analysis.profiles)}</sl-tab-panel>
                <sl-tab-panel name="fields">${this.renderProfiles(analysis.profiles)}</sl-tab-panel>
                <sl-tab-panel name="families">${this.renderFamilies(analysis)}</sl-tab-panel>
            </sl-tab-group>
        `;
    }

    private renderSuggestions(items: AnalyzerSuggestion[], profiles: FieldProfile[]): TemplateResult {
        if (!items.length) return html`<div class="hint">No strong options found yet.</div>`;
        const profileByName = new Map(profiles.map(profile => [profile.name, profile]));
        return html`<div class="cards">${items.map(item => html`
            <div class="item">
                <div class="item-head">
                    <div class="item-title">${item.title}</div>
                    <sl-badge>${Math.round(item.strength * 100)}%</sl-badge>
                </div>
                <div class="meta">${item.description}</div>
                <div class="field-list">${item.fields.map(field => html`<span class="field">${field}</span>`)}</div>
                ${item.kind === 'family' && this.familyOf(item) ? html`
                    <div class="actions">
                        <sl-button size="small" ?disabled=${this.busy} @click=${() => this.mapProfiles(this.familyOf(item)!)}>
                            Map profiles
                        </sl-button>
                    </div>
                ` : nothing}
                ${item.kind === 'spatial' && item.fields[0] ? html`
                    <div class="actions">
                        <sl-checkbox
                            size="small"
                            ?checked=${this.logFor(item.fields[0])}
                            @sl-change=${(event: Event) => {
                                this.logOverride = { ...this.logOverride, [item.fields[0]]: (event.target as HTMLInputElement).checked };
                            }}
                        >Log scale</sl-checkbox>
                        <sl-button size="small" ?disabled=${this.busy} @click=${() => this.mapClusters([item.fields[0]])}>
                            Map clusters
                        </sl-button>
                    </div>
                    ${this.relatedClusterFields(item.fields[0]).length > 1 ? html`
                        <div class="related">
                            <span class="meta">Clusters of related fields:</span>
                            ${this.relatedClusterFields(item.fields[0]).filter(field => field !== item.fields[0]).map(field => html`
                                <sl-button size="small" ?disabled=${this.busy} @click=${() => this.mapClusters([field])}>${field}</sl-button>
                            `)}
                        </div>
                    ` : nothing}
                ` : nothing}
                ${item.kind === 'map' && item.fields[0] ? html`
                    <div class="actions">
                        <sl-radio-group
                            size="small"
                            value=${this.kindOf(item.fields[0])}
                            @sl-change=${(event: Event) => {
                                this.kindOverride = { ...this.kindOverride, [item.fields[0]]: (event.target as HTMLInputElement).value as MeasureKind };
                            }}
                        >
                            <sl-radio-button value="absolute">Count</sl-radio-button>
                            <sl-radio-button value="relative">Rate</sl-radio-button>
                        </sl-radio-group>
                        <sl-button size="small" @click=${() => this.mapSuggestion(item, profileByName.get(item.fields[0]))}>
                            Map this
                        </sl-button>
                    </div>
                ` : nothing}
            </div>
        `)}</div>
        ${this.lastOutputLayerIds.length ? html`
            <sl-checkbox size="small" ?checked=${this.overwrite}
                @sl-change=${(event: Event) => { this.overwrite = (event.target as HTMLInputElement).checked; }}
            >Replace previous result</sl-checkbox>
        ` : nothing}`;
    }

    private get mapElement(): (WebmapxMapElement & {
        addLayerRequest: (config: Record<string, unknown>) => Promise<boolean>;
        removeInlineLayer: (layerId: string) => void;
    }) | null {
        return this.mapHost as never;
    }

    private unitOf(field: string): string {
        const attributes = (this.lastMapLayers[this.selectedLayerId] as Record<string, unknown> | undefined)?.attributes;
        return attributeTranslations(attributes, this.attributeCatalog).get(field)?.unit ?? '';
    }

    private numbersOf(features: readonly GeoJSON.Feature[], field: string): number[] {
        return features
            .map(feature => feature.properties?.[field])
            .filter(value => value !== null && value !== undefined && value !== '')
            .map(Number)
            .filter(Number.isFinite);
    }

    /** Absolute or relative: the user's choice when there is one, the guess otherwise. */
    private kindOf(field: string): MeasureKind {
        // A field that follows the measured area is an area in some unit: dividing it by area only converts units.
        if (this.kindOverride[field]) return this.kindOverride[field];
        if (this.analysis?.areaFields?.includes(field)) return 'relative';
        return measureKind(field, this.numbersOf(this.lastFeatures, field), this.unitOf(field));
    }

    /**
     * Draws a field as a new layer, the way the value asks to be drawn.
     *
     * A count is size, a rate is colour, and a count on polygons becomes a
     * density first — see `thematic-map.ts`. Always a new GeoJSON layer, so the
     * original stays as it was and a tile-backed result visibly holds only what
     * was on screen.
     */
    private async mapSuggestion(item: AnalyzerSuggestion, profile: FieldProfile | undefined): Promise<void> {
        const field = item.fields[0];
        if (!field || this.lastFeatures.length === 0) {
            this.error = 'Run the analysis before creating a map.';
            return;
        }
        const geometry = geometryKind(this.lastFeatures);
        if (geometry === 'none' || geometry === 'mixed') {
            this.error = geometry === 'none'
                ? 'This layer has no geometry to map.'
                : 'This layer mixes points, lines and polygons; map one geometry type at a time.';
            return;
        }

        const kind = this.kindOf(field);
        const numeric = profile ? profile.numericShare >= 0.8 : true;
        const label = this.labelOf(this.selectedLayerId);
        const notes: string[] = [];
        let features = this.lastFeatures.map(feature => ({
            type: 'Feature' as const,
            ...(feature.id !== undefined ? { id: feature.id } : {}),
            geometry: feature.geometry,
            properties: { ...(feature.properties ?? {}) },
        })) as GeoJSON.Feature[];
        let styleField = field;
        let title = field;
        let style: Record<string, unknown>;
        /** Set when the style needs a computed value: what replaces `['get', styleField]` on the original source. */
        let computed: { value: unknown; has: unknown } | null = null;
        let perKm2ViaGeometry = false;

        const areaField = numeric && kind === 'absolute' && geometry === 'polygon' ? this.areaFieldFor(field) : null;
        if (areaField) {
            // The layer measures its own area: divide by that field, converted to
            // km², which the original source can do in a style expression.
            const densityField = `${field}_per_km2`;
            const perValue = areaField.factor;
            features = features.map(feature => {
                const value = Number(feature.properties?.[field]);
                const area = Number(feature.properties?.[areaField.field]) * perValue;
                const raw = feature.properties?.[field];
                const valid = raw !== null && raw !== undefined && raw !== '' && Number.isFinite(value) && area > 0;
                return { ...feature, properties: { ...feature.properties, [densityField]: valid ? value / area : null } };
            });
            computed = {
                value: ['/', ['to-number', ['get', field]], ['*', ['to-number', ['get', areaField.field]], perValue]],
                has: ['all', ['has', field], ['has', areaField.field], ['>', ['to-number', ['get', areaField.field], 0], 0]],
            };
            styleField = densityField;
            title = `${field} per km²`;
            notes.push(`Area taken from ${areaField.field} (1 unit = ${areaField.factor} km²).`);
        } else if (numeric && kind === 'absolute' && geometry === 'polygon') {
            perKm2ViaGeometry = true;
            const density = densityFeatures(features, field);
            features = density.features;
            styleField = density.densityField;
            title = `${field} per km²`;
            if (density.groupCount < density.partCount) {
                notes.push(`${density.partCount} parts with identical attributes counted as ${density.groupCount} features.`);
            }
            if (density.groupingSkipped) notes.push(density.groupingSkipped);
        }

        if (numeric && kind === 'absolute' && geometry === 'point') {
            const max = Math.max(0, ...this.numbersOf(features, field));
            if (max <= 0) { this.error = `Nothing to size by in ${field}.`; return; }
            style = {
                type: 'circle',
                // Biggest circles underneath, so a small one on top of a large
                // neighbour stays visible. A higher sort key draws later.
                layout: { 'circle-sort-key': ['-', ['to-number', ['get', field], 0]] },
                paint: {
                    'circle-color': DATA_START,
                    'circle-opacity': 0.75,
                    'circle-radius': buildProportionalRadius({ field, maxValue: max, maxRadius: MAX_CIRCLE_RADIUS }).expression,
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 1,
                },
            };
        } else if (numeric && kind === 'absolute' && geometry === 'line') {
            const max = Math.max(0, ...this.numbersOf(features, field));
            if (max <= 0) { this.error = `Nothing to size by in ${field}.`; return; }
            style = { type: 'line', paint: { 'line-color': DATA_START, 'line-width': proportionalLineWidth(field, max) } };
        } else {
            // Zero is an absence rather than a small amount, so it gets a class of
            // its own and the breaks are computed from the other values only.
            const zeros = numeric ? zeroClass(features, styleField) : { split: false, zeroCount: 0, rest: features };
            const outcome = classifyColorChannel(zeros.rest, numeric, { ...defaultSettings(styleField), niceBreaks: true });
            if (!outcome) { this.error = `Nothing to classify for ${styleField}.`; return; }
            if (outcome.channel === null) { this.error = outcome.problem; return; }
            const color = zeros.split ? withZeroClass(styleField, encodeChannel(outcome.channel)) : encodeChannel(outcome.channel);
            if (zeros.split) notes.push(`${zeros.zeroCount} ${zeros.zeroCount === 1 ? 'feature' : 'features'} with ${styleField} = 0 ${zeros.zeroCount === 1 ? 'has its' : 'have their'} own class.`);
            style = geometry === 'polygon'
                ? { type: 'fill', paint: { 'fill-color': color, 'fill-opacity': 0.8 } }
                : geometry === 'line'
                    ? { type: 'line', paint: { 'line-color': color, 'line-width': 3 } }
                    : { type: 'circle', paint: { 'circle-color': color, 'circle-radius': 6, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1 } };
        }

        const how = kind === 'absolute'
            ? (geometry === 'polygon' ? 'density per km²' : geometry === 'line' ? 'proportional width' : 'proportional circles')
            : 'colour classes';
        // The original source whenever a style expression can compute the result;
        // a copy only when it needs the geometry's measured area.
        const source = perKm2ViaGeometry ? null : this.originalSource(geometry);
        if (source) {
            if (computed) style = substituteField(style, styleField, computed.value, computed.has) as Record<string, unknown>;
            const classified = !(numeric && kind === 'absolute' && (geometry === 'point' || geometry === 'line'));
            if (this.isViewportLimited(this.selectedLayerId)) {
                notes.push(classified
                    ? `Styled on the original source; class breaks come from the ${this.lastFeatures.length} features that were in view.`
                    : `Styled on the original source; sizes are scaled to the largest value among the ${this.lastFeatures.length} features that were in view.`);
            }
        } else if (perKm2ViaGeometry) {
            notes.push('Areas were measured from the drawn geometry, so the result is a copy of the features.');
        }
        const entry: OutputEntry = source
            ? { key: field, source, style, label: `${label}: ${title}`, what: `${field} as ${how}` }
            : { key: field, features, style, label: `${label}: ${title}`, what: `${field} as ${how}` };
        const added = await this.addOutputLayers([entry]);
        if (added === 0) {
            this.error = `Could not add a layer for ${field}.`;
            return;
        }
        this.error = null;
        this.actionMessage = [`Mapped ${title} from ${label} as ${how}.`, ...notes].join(' ');
    }

    /**
     * Adds analyzer output layers, one per entry, each a GeoJSON copy.
     *
     * With "Replace previous result" the whole previous batch goes first, so a
     * family of cluster maps is replaced as the family it was made as.
     */
    private async addOutputLayers(entries: OutputEntry[]): Promise<number> {
        const suffix = this.overwrite ? '' : `-${Date.now()}`;
        if (this.overwrite && this.mapElement) {
            for (const id of this.lastOutputLayerIds) {
                // removeInlineLayer leaves the source behind, so blank its data first.
                this.adapter?.getSource(id.replace(OUTPUT_LAYER_PREFIX, OUTPUT_SOURCE_PREFIX))?.setData({ type: 'FeatureCollection', features: [] });
                try { this.mapElement.removeInlineLayer(id); } catch { /* already gone */ }
            }
            this.lastOutputLayerIds = [];
        }

        const complete = !this.isViewportLimited(this.selectedLayerId);
        const from = this.labelOf(this.selectedLayerId);
        const added: string[] = [];
        for (const entry of entries) {
            const outputLayerId = `${OUTPUT_LAYER_PREFIX}${this.selectedLayerId}:${entry.key}${suffix}`;
            const outputSourceId = `${OUTPUT_SOURCE_PREFIX}${this.selectedLayerId}:${entry.key}${suffix}`;
            const abstract = `Created with webmapx tool Data analyzer: ${entry.what}, from layer: ${from}`
                + (entry.source
                    ? (complete ? '.' : '. Styled on the full source; class breaks were computed from the features in view at the time.')
                    : (complete ? '.' : '. Contains only the features drawn in the view at the time.'));
            // The original source is carried along whole, so the layer is
            // self-contained when saved; on the map it shares the source already
            // loaded under the same id.
            const data = entry.source
                ? {
                    source: entry.source.sourceId,
                    sources: { [entry.source.sourceId]: entry.source.config },
                    ...(entry.source.sourceLayer ? { 'source-layer': entry.source.sourceLayer } : {}),
                    ...(entry.source.filter ? { filter: entry.source.filter } : {}),
                }
                : {
                    source: outputSourceId,
                    sources: { [outputSourceId]: { id: outputSourceId, type: 'geojson', data: { type: 'FeatureCollection', features: entry.features ?? [] } } },
                };
            const ok = await this.mapElement?.addLayerRequest({
                id: outputLayerId,
                ...data,
                ...entry.style,
                metadata: { label: entry.label, abstract, dynamic: true, legendRole: 'overlay' },
            });
            if (ok) added.push(outputLayerId);
        }
        this.lastOutputLayerIds = added;
        return added.length;
    }

    /**
     * The analysed layer's own source, when an output layer can draw from it:
     * a vector-tile or GeoJSON source whose config the adapter knows, plus the
     * source-layer and filter of the matching sublayer, so the result shows the
     * same features the analysis saw. Null otherwise — a raster or unknown
     * source falls back to a copy.
     */
    private originalSource(geometry: string): SourceReference | null {
        const meta = this.lastMapLayers[this.selectedLayerId] as Record<string, unknown> | undefined;
        const sourceId = typeof meta?.sourceId === 'string' ? meta.sourceId : null;
        if (!sourceId || !this.adapter) return null;
        const config = this.adapter.getSourceConfig(sourceId);
        const type = config?.type;
        if (!config || (type !== 'vector' && type !== 'geojson')) return null;
        const role = geometry === 'polygon' ? 'fill' : geometry === 'line' ? 'line' : 'circle';
        const inSourceLayer = (sub: Record<string, unknown>) =>
            !this.selectedSourceLayer || sub['source-layer'] === this.selectedSourceLayer;
        const sublayers = this.adapter.getSubLayers(this.selectedLayerId) ?? [];
        const sub = sublayers.find(candidate => inSourceLayer(candidate) && candidate.type === role)
            ?? sublayers.find(inSourceLayer);
        const sourceLayer = (typeof sub?.['source-layer'] === 'string' ? sub['source-layer'] : '')
            || this.selectedSourceLayer
            || (typeof meta?.sourceLayer === 'string' ? meta.sourceLayer : '');
        if (type === 'vector' && !sourceLayer) return null;
        return { sourceId, config, ...(sourceLayer ? { sourceLayer } : {}), ...(sub?.filter ? { filter: sub.filter } : {}) };
    }

    /**
     * An area field to divide `field` by, with its unit in km²: one the analysis
     * found following the measured area, and whose unit could be established.
     */
    private areaFieldFor(field: string): { field: string; factor: number } | null {
        for (const candidate of this.analysis?.areaFields ?? []) {
            if (candidate === field) continue;
            const factor = areaUnitFactor(this.lastFeatures, candidate);
            if (factor) return { field: candidate, factor };
        }
        return null;
    }

    /** The full family behind a family suggestion: the card lists at most eight of its fields. */
    private familyOf(item: AnalyzerSuggestion): { name: string; fields: string[] } | null {
        const family = this.analysis?.families.find(candidate => `family:${candidate.name}` === item.id);
        return family && family.fields.length >= 2 ? family : null;
    }

    /**
     * Maps a composition as area types: features grouped by the mix of its
     * parts (see `composition-profile.ts`), each type labelled by the parts it
     * has clearly more or less of than the layer as a whole.
     */
    private async mapProfiles(family: { name: string; fields: string[] }): Promise<void> {
        if (this.lastFeatures.length === 0 || !this.analysis || this.busy) return;
        const geometry = geometryKind(this.lastFeatures);
        if (geometry === 'none' || geometry === 'mixed') {
            this.error = geometry === 'none'
                ? 'This layer has no geometry to map.'
                : 'This layer mixes points, lines and polygons; map one geometry type at a time.';
            return;
        }
        const analysis = this.analysis;
        const token = ++this.analyzeToken;
        this.busy = true;
        this.error = null;
        this.actionMessage = null;
        let types: import('../utils/composition-profile').CompositionTypes | null;
        try {
            const message = await this.runWorker({
                op: 'profile',
                properties: this.lastFeatures.map(f => f.properties ?? {}),
                fields: family.fields.map(field => ({
                    field,
                    noData: (analysis.profiles.find(p => p.name === field)?.suspectedNoData ?? []).map(entry => entry.value),
                })),
            }, token);
            if (message.status !== 'profile') throw new Error('Unexpected profile response.');
            types = message.types;
        } catch (error) {
            if (token === this.analyzeToken) this.error = error instanceof Error ? error.message : String(error);
            return;
        } finally {
            if (token === this.analyzeToken) { this.busy = false; this.status = ''; }
        }
        if (token !== this.analyzeToken) return;
        if (!types) {
            this.error = `Too few features with all of ${family.fields.length} parts to find types.`;
            return;
        }

        const names = shortPartNames(family.fields);
        const letters = 'ABCDEF';
        const labels = types.centres.map((centre, j) => `${letters[j]}: ${describeType(centre, types!.overall, names)}`);
        const noDataLabel = 'No data';
        const property = 'profile_type';
        const features = this.lastFeatures.map((feature, index): GeoJSON.Feature => ({
            type: 'Feature',
            ...(feature.id !== undefined ? { id: feature.id } : {}),
            geometry: feature.geometry,
            properties: { ...(feature.properties ?? {}), [property]: types!.assignments[index] >= 0 ? labels[types!.assignments[index]] : noDataLabel },
        }));
        const average = types.centres.map(centre => describeType(centre, types!.overall, names) === 'close to average');
        const distinct = average.filter(isAverage => !isAverage).length;
        const palette = schemeByName(TYPE_SCHEME, Math.max(3, distinct))?.colors ?? TYPE_COLORS;
        let next = 0;
        const pairs = labels.flatMap((label, j) => [label, average[j] ? AVERAGE_TYPE_COLOR : palette[next++ % palette.length]]);
        const hasNoData = types.assignments.some(a => a < 0);
        const color = ['match', ['get', property], ...pairs, ...(hasNoData ? [noDataLabel, PROFILE_NO_DATA_COLOR] : []), PROFILE_NO_DATA_COLOR];
        const style = geometry === 'polygon'
            ? { type: 'fill', paint: { 'fill-color': color, 'fill-opacity': 0.8 } }
            : geometry === 'line'
                ? { type: 'line', paint: { 'line-color': color, 'line-width': 3 } }
                : { type: 'circle', paint: { 'circle-color': color, 'circle-radius': 6, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1 } };

        const layerLabel = this.labelOf(this.selectedLayerId);
        const added = await this.addOutputLayers([{
            key: `profile:${family.name}`,
            features,
            style,
            label: `${layerLabel}: ${family.name} types`,
            what: `composition types of ${family.fields.join(', ')} (k-means on centred log-ratios, ${types.sizes.length} types)`,
        }]);
        if (added === 0) {
            this.error = `Could not add a layer for ${family.name}.`;
            return;
        }
        const separation = types.silhouette >= 0.5 ? 'well separated' : types.silhouette >= 0.25 ? 'reasonably separated' : 'weakly separated — the mixes change gradually rather than falling into types';
        const unused = types.assignments.filter(a => a < 0).length;
        this.actionMessage = `Mapped ${types.sizes.length} types of ${family.name} (${types.sizes.join(' / ')} features, ${separation}, silhouette ${types.silhouette.toFixed(2)}).`
            + (unused ? ` ${unused} features miss a part and have no type.` : '');
    }

    /**
     * The fields tested for clusters that belong with `field`: the *smallest*
     * attribute family containing it, otherwise just itself. A share of one
     * origin group reads best next to the shares of the others; a broad family
     * (everything about population) put 21 maps on the map at once.
     */
    private relatedClusterFields(field: string): string[] {
        // Area measurements share a family with anything else about the polygons,
        // but their clusters say only where the big polygons are.
        const areas = new Set(this.analysis?.areaFields ?? []);
        const tested = new Set((this.analysis?.spatial ?? []).map(pattern => pattern.field).filter(name => !areas.has(name) || name === field));
        const family = (this.analysis?.families ?? [])
            .map(candidate => candidate.fields.filter(member => tested.has(member)))
            .filter(members => members.includes(field) && members.length > 1)
            .sort((a, b) => a.length - b.length)[0];
        return family ?? [field];
    }

    /** Log scale for a field: the user's choice, else what the analysis found skewed enough to need it. */
    private logFor(field: string): boolean {
        return this.logOverride[field] ?? this.analysis?.spatial?.find(pattern => pattern.field === field)?.log ?? false;
    }

    /**
     * Maps where fields cluster: local Moran's I per feature, one layer per
     * field with hot spots, cold spots, outliers and not significant.
     *
     * One worker run for all fields, since building the neighbours is shared.
     * Uses the same count-or-rate choice as "Map this" — a count on polygons has
     * to be tested as a density or the clusters are just the big areas — and the
     * per-field log choice for skewed values.
     */
    private async mapClusters(fields: string[]): Promise<void> {
        if (fields.length === 0 || this.lastFeatures.length === 0 || !this.analysis || this.busy) return;
        const geometry = geometryKind(this.lastFeatures);
        if (geometry === 'none' || geometry === 'mixed') {
            this.error = geometry === 'none'
                ? 'This layer has no geometry to test.'
                : 'This layer mixes points, lines and polygons; test one geometry type at a time.';
            return;
        }
        const analysis = this.analysis;
        const specs = fields.map(field => ({
            field,
            noData: (analysis.profiles.find(p => p.name === field)?.suspectedNoData ?? []).map(entry => entry.value),
            density: geometry === 'polygon' && this.kindOf(field) === 'absolute',
            log: this.logFor(field),
        }));

        const token = ++this.analyzeToken;
        this.busy = true;
        this.error = null;
        this.actionMessage = null;
        let results: LisaResult[];
        try {
            const message = await this.runWorker({
                op: 'lisa',
                properties: this.lastFeatures.map(f => f.properties ?? {}),
                geometries: this.lastFeatures.map(f => f.geometry ?? null),
                fields: specs,
            }, token);
            if (message.status !== 'lisa') throw new Error('Unexpected cluster response.');
            results = message.results;
        } catch (error) {
            if (token === this.analyzeToken) this.error = error instanceof Error ? error.message : String(error);
            return;
        } finally {
            if (token === this.analyzeToken) { this.busy = false; this.status = ''; }
        }
        if (token !== this.analyzeToken || results.length === 0) return;

        const classLabel = new Map(LISA_STYLE.map(entry => [entry.cls, entry.label]));
        const layerLabel = this.labelOf(this.selectedLayerId);
        const entries = results.map(result => {
            const property = `lisa_${result.field}`;
            const features = this.lastFeatures.map((feature, index): GeoJSON.Feature => ({
                type: 'Feature',
                ...(feature.id !== undefined ? { id: feature.id } : {}),
                geometry: feature.geometry,
                properties: { ...(feature.properties ?? {}), [property]: classLabel.get(result.classes[index]) },
            }));
            const present = LISA_STYLE.filter(entry => result.counts[entry.cls] > 0);
            // The fallback is never reached (every feature has a class) but must be a colour.
            const color = ['match', ['get', property], ...present.flatMap(entry => [entry.label, entry.color]), '#bdbdbd'];
            const style = geometry === 'polygon'
                ? { type: 'fill', paint: { 'fill-color': color, 'fill-opacity': 0.8 } }
                : geometry === 'line'
                    ? { type: 'line', paint: { 'line-color': color, 'line-width': 3 } }
                    : { type: 'circle', paint: { 'circle-color': color, 'circle-radius': 6, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1 } };
            const scale = `${result.density ? ' per km²' : ''}${result.log ? ', log scale' : ''}`;
            return {
                key: `lisa:${result.field}`,
                features,
                style,
                label: `${layerLabel}: ${result.field}${result.density ? ' per km²' : ''} clusters`,
                what: `local clusters of ${result.field}${scale} (local Moran's I, analytic p-values, FDR 5%)`,
            };
        });

        const added = await this.addOutputLayers(entries);
        if (added === 0) {
            this.error = `Could not add a cluster layer for ${fields.join(', ')}.`;
            return;
        }
        const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
        const first = results[0];
        const neighbours = first.neighbours === 'contiguity' ? 'shared borders' : 'distance (6 nearest)';
        const grouped = first.unitCount < this.lastFeatures.length
            ? ` ${this.lastFeatures.length} parts with identical attributes were tested as ${first.unitCount} features.`
            : '';
        const brief = (r: LisaResult) => {
            const c = r.counts;
            return `${c['high-high']} hot, ${c['low-low']} cold, ${plural(c['high-low'] + c['low-high'], 'outlier')}${r.log ? ' (log)' : ''}`;
        };
        if (results.length === 1) {
            const c = first.counts;
            const parts = [
                `${c['high-high']} in hot spots`, `${c['low-low']} in cold spots`,
                plural(c['high-low'] + c['low-high'], 'outlier'), `${c['not-significant']} not significant`,
            ];
            if (c['no-data']) parts.push(`${c['no-data']} without data`);
            this.actionMessage = `Mapped ${first.field} clusters${first.log ? ' on a log scale' : ''}: ${parts.join(', ')}. Neighbours by ${neighbours}.${grouped}`;
        } else {
            this.actionMessage = `Mapped clusters for ${results.length} fields — ${results.map(r => `${r.field}: ${brief(r)}`).join('; ')}. Neighbours by ${neighbours}.${grouped}`;
        }
    }

    private renderProfiles(profiles: FieldProfile[]): TemplateResult {
        const interesting = [...profiles].sort((a, b) => {
            const score = (profile: FieldProfile) =>
                (profile.role === 'measure' ? 3 : 0) +
                (profile.suspectedNoData.length ? 2 : 0) +
                (profile.stats?.standardDeviation ?? 0);
            return score(b) - score(a);
        }).slice(0, 30);
        return html`<div class="cards">${interesting.map(profile => html`
                <div class="item profile">
                    <div class="profile-name">${profile.name}</div>
                    <sl-badge variant=${profile.role === 'measure' ? 'success' : 'neutral'}>${profile.role}</sl-badge>
                <div class="meta">${profile.family}</div>
                <div class="profile-stats">
                    <span>type: ${profile.dataType}</span>
                    <span>count: ${profile.total - profile.missing}</span>
                    <span>unique: ${profile.unique}</span>
                    <span>missing: ${profile.missing}</span>
                    ${profile.stats ? html`
                        <span>min: ${formatNumber(profile.stats.min)}</span>
                        <span>max: ${formatNumber(profile.stats.max)}</span>
                        <span>avg: ${formatNumber(profile.stats.mean)}</span>
                        <span>median: ${formatNumber(profile.stats.median)}</span>
                    ` : nothing}
                </div>
                ${profile.suspectedNoData.length ? html`
                    <div class="meta">no-data: ${profile.suspectedNoData.map(item => `${item.value} (${item.count})`).join(', ')}</div>
                ` : nothing}
            </div>
        `)}</div>`;
    }

    private renderFamilies(analysis: DatasetAnalysis): TemplateResult {
        const families = analysis.families.filter(family => family.fields.length > 0);
        if (!families.length) return html`<div class="hint">No variable families recognized.</div>`;
        return html`<div class="cards">${families.map(family => html`
            <div class="item">
                <div class="item-head">
                    <div class="item-title">${family.name}</div>
                    <sl-badge>${family.fields.length}</sl-badge>
                </div>
                ${family.reason ? html`<div class="meta">${family.reason}</div>` : nothing}
                <div class="field-list">${family.fields.slice(0, 12).map(field => html`<span class="field">${field}</span>`)}</div>
            </div>
        `)}
        ${analysis.familyBorders.length ? html`
            <div class="item">
                <div class="item-head">
                    <div class="item-title">Likely family borders</div>
                    <sl-badge>${analysis.familyBorders.length}</sl-badge>
                </div>
                <div class="cards">
                    ${analysis.familyBorders.slice(0, 10).map(border => html`
                        <div class="meta">
                            ${border.afterField} → ${border.beforeField}
                            · ${Math.round(border.confidence * 100)}%
                            · ${border.reason}
                        </div>
                    `)}
                </div>
            </div>
        ` : nothing}
        </div>`;
    }
}

function formatNumber(value: number): string {
    if (!Number.isFinite(value)) return String(value);
    const absolute = Math.abs(value);
    if (absolute > 1e9 || (absolute > 0 && absolute < 1e-6)) return value.toExponential(4);
    if (Number.isInteger(value)) return String(value);

    const decimals = Math.max(0, 4 - Math.floor(Math.log10(absolute)) - 1);
    return value.toFixed(Math.min(8, decimals)).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}
