import { LitElement, css, html, nothing } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import type SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import { controlSurfaceStyles } from './internal/control-surface-styles';

export interface LayerStyleTarget {
    id: string;
    type: string;
}

export interface SourceAttributeInfo {
    name: string;
    type: string;
    values: unknown[];
    presentCount: number;
    missingCount: number;
}

export interface SourceStyleGroup {
    sourceId: string;
    featureCountLabel: string;
    featureCount: number | null;
    geometryTypes: string[];
    attributes: SourceAttributeInfo[];
    featureRows: Record<string, unknown>[];
    layers: LayerStyleTarget[];
}

interface AttributeAnalysis {
    name: string;
    type: string;
    presentCount: number;
    missingCount: number;
    uniqueCount: number;
    rangeLabel: string | null;
    sampleValues: string[];
}

@customElement('webmapx-layer-style-dialog')
export class WebmapxLayerStyleDialog extends LitElement {
    @state() private dialogTitle = 'Layer style';
    @state() private groups: SourceStyleGroup[] = [];
    @state() private analyses: Record<string, AttributeAnalysis> = {};
    @state() private visibleAttributeTables: Record<string, boolean> = {};

    @query('sl-dialog') private dialog!: SlDialog;

    static styles = [controlSurfaceStyles, css`
        :host { display: block; }

        sl-dialog::part(panel) {
            width: min(1100px, 96vw);
            min-width: min(420px, 96vw);
            max-width: min(1100px, 96vw);
        }

        .source-list {
            display: flex;
            flex-direction: column;
            gap: var(--webmapx-space-lg, 1rem);
        }

        .source-group {
            display: flex;
            flex-direction: column;
            gap: var(--webmapx-space-sm, 0.5rem);
            padding-bottom: 0.75rem;
            border-bottom: 1px solid var(--color-border-light, #e2e7ec);
        }

        .source-group:last-child {
            border-bottom: 0;
        }

        .source-title {
            margin: 0;
            font-size: 0.95rem;
            font-weight: 700;
            color: var(--color-text-primary, #16202a);
            word-break: break-word;
        }

        .source-meta {
            display: flex;
            flex-wrap: wrap;
            gap: var(--webmapx-space-xs, 0.35rem);
            font-size: var(--webmapx-font-size-sm, 0.8rem);
            color: var(--color-text-secondary, #5a6773);
        }

        .pill {
            display: inline-flex;
            align-items: center;
            min-height: 1.35rem;
            padding: 0 0.4rem;
            border: 1px solid var(--color-border-light, #e2e7ec);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            background: var(--color-surface-raised, #f4f6f8);
        }

        .subheading {
            margin: 0.2rem 0 0;
            font-size: 0.78rem;
            font-weight: 700;
            color: var(--color-text-secondary, #5a6773);
        }

        .table-controls {
            display: flex;
            align-items: center;
            gap: var(--webmapx-space-sm, 0.5rem);
        }

        .table-hint {
            flex: 1 1 auto;
            min-width: 0;
            color: var(--color-text-muted, #6b7681);
            font-size: var(--webmapx-font-size-sm, 0.8rem);
            line-height: 1.3;
        }

        .attribute-analysis {
            display: flex;
            flex-direction: column;
            gap: var(--webmapx-space-xs, 0.25rem);
            padding: var(--webmapx-space-sm, 0.5rem);
            border: 1px solid var(--color-border-light, #e2e7ec);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            background: var(--color-surface-raised, #f4f6f8);
            font-size: var(--webmapx-font-size-md, 0.85rem);
        }

        .attribute-table-wrap {
            max-height: 16rem;
            overflow: auto;
            border: 1px solid var(--color-border-light, #e2e7ec);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
        }

        .attribute-table {
            width: auto;
            min-width: 100%;
            border-collapse: collapse;
            table-layout: auto;
            font-size: var(--webmapx-font-size-sm, 0.8rem);
        }

        .attribute-table th,
        .attribute-table td {
            padding: 0.35rem 0.45rem;
            border-right: 1px solid var(--color-border-light, #e2e7ec);
            border-bottom: 1px solid var(--color-border-light, #e2e7ec);
            text-align: left;
            vertical-align: top;
        }

        .attribute-table th:last-child,
        .attribute-table td:last-child {
            border-right: 0;
        }

        .attribute-table th {
            position: sticky;
            top: 0;
            z-index: 1;
            background: var(--color-surface-raised, #f4f6f8);
            color: var(--color-text-secondary, #5a6773);
            font-weight: 700;
        }

        .attribute-header-button {
            display: block;
            width: 100%;
            min-width: 0;
            padding: 0;
            border: 0;
            background: transparent;
            color: inherit;
            font: inherit;
            font-weight: inherit;
            text-align: left;
            cursor: pointer;
        }

        .attribute-header-button:hover {
            color: var(--color-primary, #2b6c8f);
            text-decoration: underline;
        }

        .attribute-table tr:last-child td {
            border-bottom: 0;
        }

        .attribute-table .feature-index-cell {
            color: var(--color-text-secondary, #5a6773);
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }

        .attribute-table .attribute-heading {
            max-width: 14ch;
            white-space: normal;
            overflow-wrap: break-word;
        }

        .attribute-table .feature-value-cell {
            max-width: 28ch;
            white-space: normal;
            overflow-wrap: break-word;
            word-break: normal;
        }

        .attribute-table .url-value-cell {
            max-width: 40ch;
            white-space: nowrap;
        }

        .attribute-table .feature-value-cell a {
            overflow-wrap: normal;
            word-break: normal;
            white-space: nowrap;
        }

        .no-wrap-value {
            white-space: nowrap;
        }

        .analysis-row {
            display: flex;
            justify-content: space-between;
            gap: var(--webmapx-space-md, 0.75rem);
        }

        .analysis-label {
            color: var(--color-text-secondary, #5a6773);
        }

        .analysis-value {
            min-width: 0;
            text-align: right;
            word-break: break-word;
        }

        a {
            color: var(--color-primary, #2b6c8f);
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }

        .style-targets {
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
        }

        .style-target {
            display: flex;
            align-items: center;
            gap: var(--webmapx-space-sm, 0.5rem);
            font-size: var(--webmapx-font-size-md, 0.9rem);
        }

        .style-target sl-icon {
            color: var(--color-text-secondary, #5a6773);
        }

        .target-label {
            flex: 1 1 auto;
            min-width: 0;
            word-break: break-word;
        }

        .target-type {
            flex: 0 0 auto;
            color: var(--color-text-secondary, #5a6773);
            font-size: var(--webmapx-font-size-sm, 0.8rem);
        }

        .placeholder {
            color: var(--color-text-muted, #6b7681);
            font-size: var(--webmapx-font-size-md, 0.9rem);
        }

        .footer {
            display: flex;
            justify-content: flex-end;
            margin-top: var(--webmapx-space-lg, 1rem);
        }
    `];

    open(title: string, groups: SourceStyleGroup[]): void {
        // Escape to document.body before showing — see webmapx-layer-info-dialog.ts's open()
        // for why: an ancestor's backdrop-filter (webmapx-tool-panel under the "atlas"/
        // "glossy" style) otherwise traps this position:fixed dialog inside the panel.
        if (this.parentNode !== document.body) {
            document.body.appendChild(this);
        }
        this.dialogTitle = title ? `Layer style: ${title}` : 'Layer style';
        this.groups = groups;
        this.analyses = {};
        this.visibleAttributeTables = {};
        this.dialog?.show();
    }

    close(): void {
        this.dialog?.hide();
    }

    private analyzeNamedAttribute(group: SourceStyleGroup, attributeName: string): void {
        const attribute = group.attributes.find((entry) => entry.name === attributeName);
        if (!attribute) return;
        this.analyses = {
            ...this.analyses,
            [group.sourceId]: this.buildAttributeAnalysis(attribute),
        };
    }

    private toggleAttributeTable(sourceId: string): void {
        this.visibleAttributeTables = {
            ...this.visibleAttributeTables,
            [sourceId]: !this.visibleAttributeTables[sourceId],
        };
    }

    private buildAttributeAnalysis(attribute: SourceAttributeInfo): AttributeAnalysis {
        const values = attribute.values.filter((value) => value !== null && value !== undefined);
        const type = this.inferAttributeType(values);
        const uniqueValues = this.sortedUniqueSampleValues(values, type);
        return {
            name: attribute.name,
            type,
            presentCount: attribute.presentCount,
            missingCount: attribute.missingCount,
            uniqueCount: uniqueValues.length,
            rangeLabel: this.rangeLabel(type, values),
            sampleValues: uniqueValues.slice(0, 8),
        };
    }

    private sortedUniqueSampleValues(values: unknown[], type: string): string[] {
        if (type === 'number') {
            const nums = [...new Set(values
                .filter((value): value is number => typeof value === 'number' && Number.isFinite(value)))]
                .sort((a, b) => a - b);
            return nums.map((value) => this.formatNumber(value));
        }

        if (type === 'date') {
            const dates = values
                .map((value) => ({
                    label: this.formatValue(value),
                    time: value instanceof Date ? value.getTime() : Date.parse(String(value)),
                }))
                .filter((entry) => Number.isFinite(entry.time))
                .sort((a, b) => a.time - b.time);
            return [...new Map(dates.map((entry) => [entry.label, entry.label])).values()];
        }

        return [...new Set(values.map((value) => this.formatValue(value)))]
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    }

    private inferAttributeType(values: unknown[]): string {
        if (values.length === 0) return 'unknown';
        const types = new Set(values.map((value) => this.valueType(value)));
        return types.size === 1 ? [...types][0] : [...types].sort().join(' | ');
    }

    private valueType(value: unknown): string {
        if (typeof value === 'number') return this.isLikelyTimestamp(value) ? 'date' : 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (value instanceof Date) return 'date';
        if (Array.isArray(value)) return 'array';
        if (value && typeof value === 'object') return 'object';
        if (typeof value === 'string') return this.looksLikeDate(value) ? 'date' : 'string';
        return 'unknown';
    }

    private looksLikeDate(value: string): boolean {
        if (!/^\d{4}-\d{2}-\d{2}(?:[T ][\d:.+-Z]*)?$/.test(value)) return false;
        return !Number.isNaN(Date.parse(value));
    }

    private rangeLabel(type: string, values: unknown[]): string | null {
        if (type === 'number') {
            const nums = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
            if (nums.length === 0) return null;
            const min = Math.min(...nums);
            const max = Math.max(...nums);
            const avg = nums.reduce((sum, value) => sum + value, 0) / nums.length;
            return `${this.formatNumber(min)} to ${this.formatNumber(max)}; avg ${this.formatNumber(avg)}`;
        }
        if (type === 'date') {
            const times = values
                .map((value) => this.timestampMillis(value))
                .filter((value) => Number.isFinite(value));
            if (times.length === 0) return null;
            return `${this.formatDateTime(Math.min(...times))} to ${this.formatDateTime(Math.max(...times))}`;
        }
        return null;
    }

    private formatNumber(value: number): string {
        return Number.isInteger(value)
            ? String(value)
            : value.toLocaleString('en-US', { maximumFractionDigits: 3, useGrouping: false });
    }

    private formatValue(value: unknown): string {
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') return this.isLikelyTimestamp(value) ? this.formatDateTime(this.timestampMillis(value)) : this.formatNumber(value);
        if (typeof value === 'string') return value;
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        if (value instanceof Date) return this.formatDateTime(value.getTime());
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }

    private renderValue(value: unknown) {
        const url = this.toValidUrl(value);
        if (url) {
            return html`<a href=${url.href} target="_blank" rel="noopener noreferrer">${this.renderShortUrlLabel(url)}</a>`;
        }
        const formatted = this.formatValue(value);
        if (formatted === '') return nothing;
        return this.isDateTimeValue(value)
            ? html`<span class="no-wrap-value">${formatted}</span>`
            : formatted;
    }

    private renderSampleValue(value: string) {
        const url = this.toValidUrl(value);
        if (url) {
            return html`<a href=${url.href} target="_blank" rel="noopener noreferrer">${this.renderShortUrlLabel(url)}</a>`;
        }
        return value;
    }

    private toValidUrl(value: unknown): URL | null {
        if (typeof value !== 'string') return null;
        try {
            const url = new URL(value);
            return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
        } catch {
            return null;
        }
    }

    private renderShortUrlLabel(url: URL) {
        const firstPathPart = url.pathname.split('/').filter(Boolean)[0];
        return firstPathPart
            ? `${url.protocol}//${url.hostname}/${firstPathPart}/...`
            : `${url.protocol}//${url.hostname}/`;
    }

    private timestampMillis(value: unknown): number {
        if (value instanceof Date) return value.getTime();
        if (typeof value === 'number') {
            return Math.abs(value) < 10_000_000_000 ? value * 1000 : value;
        }
        return Date.parse(String(value));
    }

    private isLikelyTimestamp(value: number): boolean {
        if (!Number.isFinite(value)) return false;
        const millis = this.timestampMillis(value);
        const min = Date.UTC(1970, 0, 1);
        const max = Date.UTC(2200, 0, 1);
        return millis >= min && millis <= max && (Math.abs(value) >= 1_000_000_000);
    }

    private isDateTimeValue(value: unknown): boolean {
        if (value instanceof Date) return true;
        if (typeof value === 'number') return this.isLikelyTimestamp(value);
        return typeof value === 'string' && this.looksLikeDate(value);
    }

    private formatDateTime(value: number): string {
        const date = new Date(value);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    private renderAnalysis(group: SourceStyleGroup) {
        const analysis = this.analyses[group.sourceId];
        if (!analysis) return null;
        return html`
            <div class="attribute-analysis">
                <div class="analysis-row"><span class="analysis-label">Type</span><span class="analysis-value">${analysis.type}</span></div>
                <div class="analysis-row"><span class="analysis-label">Values</span><span class="analysis-value">${analysis.presentCount} present, ${analysis.missingCount} missing</span></div>
                <div class="analysis-row"><span class="analysis-label">Unique</span><span class="analysis-value">${analysis.uniqueCount}</span></div>
                ${analysis.rangeLabel
                    ? html`<div class="analysis-row"><span class="analysis-label">Range</span><span class="analysis-value">${analysis.rangeLabel}</span></div>`
                    : null}
                ${analysis.sampleValues.length > 0
                    ? html`<div class="analysis-row">
                        <span class="analysis-label">Sample</span>
                        <span class="analysis-value">
                            ${analysis.sampleValues.map((value, index) => html`${index > 0 ? '; ' : ''}${this.renderSampleValue(value)}`)}
                        </span>
                    </div>`
                    : null}
            </div>
        `;
    }

    private renderAttributeTable(group: SourceStyleGroup) {
        if (!this.visibleAttributeTables[group.sourceId]) return null;
        if (group.featureRows.length === 0) {
            return html`<p class="placeholder">No loaded feature rows available.</p>`;
        }
        return html`
            <div class="attribute-table-wrap">
                <table class="attribute-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            ${group.attributes.map((attribute) => html`
                                <th class="attribute-heading">
                                    <button
                                        type="button"
                                        class="attribute-header-button"
                                        title=${`Analyze ${attribute.name}`}
                                        @click=${() => this.analyzeNamedAttribute(group, attribute.name)}
                                    >${attribute.name}</button>
                                </th>
                            `)}
                        </tr>
                    </thead>
                    <tbody>
                        ${group.featureRows.map((row, index) => html`
                            <tr>
                                <td class="feature-index-cell">${index + 1}</td>
                                ${group.attributes.map((attribute) => html`
                                    <td class=${this.toValidUrl(row[attribute.name]) ? 'feature-value-cell url-value-cell' : 'feature-value-cell'}>
                                        ${this.renderValue(row[attribute.name])}
                                    </td>
                                `)}
                            </tr>
                        `)}
                    </tbody>
                </table>
            </div>
        `;
    }

    render() {
        return html`
            <sl-dialog label=${this.dialogTitle}
                       @sl-request-close=${(e: Event) => { if ((e as CustomEvent).detail?.source === 'overlay') this.close(); }}>
                ${this.groups.length > 0
                    ? html`<div class="source-list">
                        ${this.groups.map((group) => html`
                            <section class="source-group">
                                <h3 class="source-title">${group.sourceId}</h3>
                                <div class="source-meta">
                                    <span class="pill">${group.featureCountLabel}</span>
                                    ${group.geometryTypes.map((type) => html`<span class="pill">${type}</span>`)}
                                </div>
                                <p class="subheading">Table</p>
                                ${group.attributes.length > 0
                                    ? html`<div class="table-controls">
                                        <span class="table-hint">
                                            ${this.visibleAttributeTables[group.sourceId]
                                                ? 'Click an attribute header to analyze it. Use the button to hide the table.'
                                                : 'Show the feature table. Click an attribute header to analyze it.'}
                                        </span>
                                        <sl-button size="small" @click=${() => this.toggleAttributeTable(group.sourceId)}>
                                            ${this.visibleAttributeTables[group.sourceId] ? 'Hide table' : 'Table'}
                                        </sl-button>
                                    </div>`
                                    : html`<p class="placeholder">No attributes found in loaded features.</p>`}
                                ${this.renderAttributeTable(group)}
                                ${this.renderAnalysis(group)}
                                <p class="subheading">Layers</p>
                                <div class="style-targets">
                                    ${group.layers.map((target) => html`
                                        <div class="style-target">
                                            <sl-icon name="palette"></sl-icon>
                                            <span class="target-label">${target.id}</span>
                                            <span class="target-type">${target.type}</span>
                                        </div>
                                    `)}
                                </div>
                            </section>
                        `)}
                    </div>`
                    : html`<p class="placeholder">No editable style source found.</p>`}
                <div class="footer">
                    <sl-button autofocus @click=${this.close}>Close</sl-button>
                </div>
            </sl-dialog>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'webmapx-layer-style-dialog': WebmapxLayerStyleDialog;
    }
}
