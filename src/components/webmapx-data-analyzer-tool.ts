import { html, css, nothing, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { WebmapxModalTool } from './webmapx-modal-tool';
import { classifyColorChannel, defaultSettings } from './styler/classify-channel';
import type { IMapState } from '../store/IMapState';
import type { AnalyzerSuggestion, DatasetAnalysis, FieldProfile } from '../utils/data-analyzer';
import { encodeStyleEntry, type StyleEntry, type StyleRole, type StyleSubLayer } from '../utils/layer-style-model';
import { isViewportLimitedSource, sampleLayerFeatures } from '../utils/layer-features';
import type { DataAnalyzerResponse } from '../workers/data-analyzer.worker';

import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
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

const MAPPABLE_ROLES: StyleRole[] = ['fill', 'circle', 'line'];

interface LayerOption {
    id: string;
    label: string;
}

interface StyleTarget {
    id: string;
    role: StyleRole;
    origin: StyleSubLayer;
    sourceLayer?: string;
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

    private analyzeToken = 0;
    private lastMapBusy = false;
    private worker: Worker | null = null;
    private lastAnalysisProperties: GeoJSON.GeoJsonProperties[] = [];

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
            justify-content: flex-end;
        }

        sl-tab-group {
            --indicator-color: var(--color-primary, #1b6ec2);
        }

        sl-alert { font-size: var(--sl-font-size-x-small); }
        sl-select { --sl-input-height-medium: 28px; --sl-input-font-size-medium: var(--sl-font-size-small); }
    `;

    protected onActivate(): void {
        if (!this.selectedLayerId && this.availableLayers[0]) {
            this.selectLayer(this.availableLayers[0].id);
        } else if (this.selectedLayerId && !this.analysis && !this.busy) {
            void this.runAnalysis();
        }
    }

    protected onStateChanged(state: IMapState): void {
        const mapLayers = state.mapLayers ?? {};
        this.lastMapLayers = mapLayers;
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

        if (!this.selectedLayerId && this.active && this.availableLayers[0]) {
            this.selectLayer(this.availableLayers[0].id);
        }

        const busy = state.mapBusy === true;
        const settled = this.lastMapBusy && !busy;
        this.lastMapBusy = busy;
        if (settled && this.active && this.selectedLayerId && !this.analysis && this.isViewportLimited(this.selectedLayerId)) {
            void this.runAnalysis();
        }
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
            const properties = sample.features.map(feature => feature.properties ?? {});
            this.lastAnalysisProperties = properties;
            this.analysis = await this.analyzeInWorker(properties, sample.complete, token);
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

    private analyzeInWorker(properties: GeoJSON.GeoJsonProperties[], complete: boolean, token: number): Promise<DatasetAnalysis> {
        return new Promise((resolve, reject) => {
            const worker = new Worker(new URL('../workers/data-analyzer.worker.ts', import.meta.url), { type: 'module' });
            this.worker = worker;

            worker.onmessage = (event: MessageEvent<DataAnalyzerResponse>) => {
                if (token !== this.analyzeToken || worker !== this.worker) return;
                const message = event.data;
                if (message.status === 'progress') {
                    this.status = message.message;
                } else if (message.status === 'ok') {
                    this.cancelWorker();
                    resolve(message.analysis);
                } else {
                    this.cancelWorker();
                    reject(new Error(message.message));
                }
            };

            worker.onerror = (event: ErrorEvent) => {
                if (token !== this.analyzeToken || worker !== this.worker) return;
                this.cancelWorker();
                reject(new Error(event.message || 'Data analysis worker failed.'));
            };

            try {
                worker.postMessage({ properties, complete });
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
                ${item.kind === 'map' && item.fields[0] ? html`
                    <div class="actions">
                        <sl-button size="small" @click=${() => this.mapSuggestion(item, profileByName.get(item.fields[0]))}>
                            Map this
                        </sl-button>
                    </div>
                ` : nothing}
            </div>
        `)}</div>`;
    }

    private mapSuggestion(item: AnalyzerSuggestion, profile: FieldProfile | undefined): void {
        const field = item.fields[0];
        const targets = this.styleTargets();
        if (!field || targets.length === 0) {
            this.error = 'This layer has no fill, circle, or line style that can be mapped.';
            return;
        }
        if (this.lastAnalysisProperties.length === 0) {
            this.error = 'Run the analysis before creating a map.';
            return;
        }

        const features = this.lastAnalysisProperties.map(properties => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [0, 0] },
            properties,
        }));
        const outcome = classifyColorChannel(features, profile ? profile.numericShare >= 0.8 : true, defaultSettings(field));
        if (!outcome) {
            this.error = `Nothing to classify for ${field}.`;
            return;
        }
        if (outcome.channel === null) {
            this.error = outcome.problem;
            return;
        }

        let appliedCount = 0;
        for (const target of targets) {
            const entry: StyleEntry = {
                id: target.id,
                role: target.role,
                title: field,
                channels: { color: outcome.channel },
                origin: target.origin,
                originChannels: {},
            };
            const encoded = encodeStyleEntry(entry);
            const paint = encoded.paint ?? {};
            if (Object.keys(paint).length === 0) continue;
            const applied = this.adapter?.updateLayerStyle(this.selectedLayerId, target.id, paint) ?? false;
            if (!applied) continue;
            appliedCount++;
            if (encoded.metadata && Array.isArray((this.lastMapLayers[this.selectedLayerId] as Record<string, unknown> | undefined)?.sublayers)) {
                this.adapter?.setSubLayerMetadata(this.selectedLayerId, target.id, encoded.metadata as Record<string, unknown>);
            }
        }

        if (appliedCount === 0) {
            this.error = `Could not update ${this.labelOf(this.selectedLayerId)}.`;
            return;
        }
        this.error = null;
        this.actionMessage = `Mapped ${field} on ${this.labelOf(this.selectedLayerId)}.`;
    }

    private styleTargets(): StyleTarget[] {
        const metadata = this.lastMapLayers[this.selectedLayerId] as Record<string, unknown> | undefined;
        const fromType = (id: string, type: unknown, origin: StyleSubLayer): StyleTarget | null => {
            if (type === 'fill') return { id, role: 'fill', origin };
            if (type === 'circle') return { id, role: 'circle', origin };
            if (type === 'line') return { id, role: 'line', origin };
            return null;
        };

        if (!Array.isArray(metadata?.sublayers)) {
            const target = fromType(this.selectedLayerId, metadata?.layerType, {
                id: this.selectedLayerId,
                type: typeof metadata?.layerType === 'string' ? metadata.layerType : undefined,
                paint: metadata?.paint && typeof metadata.paint === 'object' ? metadata.paint as Record<string, unknown> : undefined,
            });
            return target ? [target] : [];
        }

        const targets: StyleTarget[] = [];
        const collect = (items: unknown[]): void => {
            for (const item of items) {
                if (!item || typeof item !== 'object') continue;
                const sub = item as Record<string, unknown>;
                const id = typeof sub.id === 'string' && sub.id ? sub.id : String(sub.type ?? '');
                const target = fromType(id, sub.type, sub as StyleSubLayer);
                if (target && MAPPABLE_ROLES.includes(target.role)) {
                    const sourceLayer = typeof sub['source-layer'] === 'string' ? sub['source-layer'] : undefined;
                    targets.push({ ...target, ...(sourceLayer ? { sourceLayer } : {}) });
                }
                if (Array.isArray(sub.sublayers)) collect(sub.sublayers);
            }
        };
        collect(metadata.sublayers);

        const matchingSource = targets.filter(target => !this.selectedSourceLayer || target.sourceLayer === this.selectedSourceLayer);
        const candidates = matchingSource.length ? matchingSource : targets;
        const preferredRole = MAPPABLE_ROLES.find(role => candidates.some(target => target.role === role));
        return preferredRole ? candidates.filter(target => target.role === preferredRole) : [];
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
