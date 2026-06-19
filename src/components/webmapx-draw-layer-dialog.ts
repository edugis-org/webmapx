import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/color-picker/color-picker.js';
import type SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';

export type GeometryType = 'Point' | 'LineString' | 'Polygon';

export interface PropertyDef {
    name: string;
    type: 'string' | 'number' | 'longitude' | 'latitude' | 'area' | 'perimeter' | 'length' | 'linkURL' | 'imageURL' | 'create-time' | 'update-time';
}

export interface DrawLayerConfig {
    id: string;
    name: string;
    type: GeometryType;
    color: string;
    properties: PropertyDef[];
    /** Set when editing an existing map layer in-place (source ID to blank/restore). */
    borrowedSourceId?: string;
}

export interface MapLayerOption {
    layerId: string;  // representative layer ID (for label lookup)
    sourceId: string;
    label: string;
    properties?: PropertyDef[];
}

const PROPERTY_TYPES: Record<GeometryType, PropertyDef['type'][]> = {
    Point:      ['string', 'number', 'longitude', 'latitude', 'linkURL', 'imageURL', 'create-time', 'update-time'],
    LineString: ['string', 'number', 'length', 'linkURL', 'imageURL', 'create-time', 'update-time'],
    Polygon:    ['string', 'number', 'area', 'perimeter', 'longitude', 'latitude', 'linkURL', 'imageURL', 'create-time', 'update-time'],
};

const DEFAULT_PROPERTIES: PropertyDef[] = [
    { name: 'id',   type: 'number' },
    { name: 'name', type: 'string' },
];

const DEFAULT_COLORS: Record<GeometryType, string> = {
    Point:      '#0f62fe',
    LineString: '#0f62fe',
    Polygon:    '#0f62fe',
};

function newLayerConfig(type: GeometryType): DrawLayerConfig {
    return {
        id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: '',
        type,
        color: DEFAULT_COLORS[type],
        properties: DEFAULT_PROPERTIES.map(p => ({ ...p })),
    };
}

type Step = 'select' | 'detail';

/**
 * Two-step dialog for creating or selecting a draw layer.
 *
 * Step 1: list of existing layers + "New layer" option.
 * Step 2: layer name, color, attribute schema (add/remove properties).
 *
 * Fires `webmapx-draw-layer-confirm` with detail: DrawLayerConfig on OK.
 * Fires `webmapx-draw-layer-cancel` on close/cancel.
 */
@customElement('webmapx-draw-layer-dialog')
export class WebmapxDrawLayerDialog extends LitElement {

    @property({ type: String }) geometryType: GeometryType = 'Point';

    /** Existing layers of the current geometry type to offer for re-use. */
    @property({ attribute: false }) existingLayers: DrawLayerConfig[] = [];
    /** Existing map layers that can be borrowed for in-place editing. */
    @property({ attribute: false }) mapLayers: MapLayerOption[] = [];

    @state() private step: Step = 'select';
    @state() selectedId: string = 'new';
    @state() private layer: DrawLayerConfig = newLayerConfig('Point');
    @state() private nameError = false;
    @state() private newPropName = '';
    @state() private newPropType: PropertyDef['type'] = 'string';

    @query('sl-dialog') private dialog!: SlDialog;

    static styles = css`
        :host { display: block; }

        sl-dialog::part(panel) {
            min-width: min(420px, 90vw);
        }

        .layer-list {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            max-height: 220px;
            overflow-y: auto;
            margin-bottom: 1rem;
        }

        .layer-option {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.4rem 0.6rem;
            border-radius: 4px;
            cursor: pointer;
            border: 1px solid transparent;
            font-size: 0.9rem;
        }

        .layer-option:hover { background: var(--sl-color-neutral-100); }

        .layer-option.selected {
            background: var(--sl-color-primary-100);
            border-color: var(--sl-color-primary-400);
        }

        .color-dot {
            width: 12px; height: 12px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .new-icon { color: var(--sl-color-neutral-500); font-size: 1rem; }

        .prop-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
            margin-top: 0.5rem;
        }

        .prop-table th {
            text-align: left;
            background: var(--sl-color-neutral-100);
            padding: 0.25rem 0.4rem;
            border-bottom: 1px solid var(--sl-color-neutral-200);
        }

        .prop-table td {
            padding: 0.2rem 0.4rem;
            border-bottom: 1px solid var(--sl-color-neutral-100);
            vertical-align: middle;
        }

        .prop-table tr:last-child td { border-bottom: none; }

        .prop-row-auto td { color: var(--sl-color-neutral-400); font-style: italic; }

        .type-computed { color: var(--sl-color-primary-600); font-size: 0.75rem; }

        .add-row td { background: var(--sl-color-neutral-50); }

        .add-row sl-input,
        .add-row sl-select { font-size: 0.85rem; }

        .name-input-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
        }

        .color-swatch {
            width: 32px; height: 32px;
            border-radius: 4px;
            border: 1px solid var(--sl-color-neutral-300);
            cursor: pointer;
            flex-shrink: 0;
        }

        .footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
            margin-top: 1rem;
        }

        .error-msg {
            color: var(--sl-color-danger-600);
            font-size: 0.8rem;
            margin-top: 0.25rem;
        }
    `;

    open(): void {
        this.step = 'select';
        this.selectedId = this.existingLayers.length === 0 ? 'new' : this.existingLayers[0].id;
        this.layer = newLayerConfig(this.geometryType);
        this.newPropName = '';
        this.newPropType = 'string';
        this.nameError = false;
        this.dialog?.show();
    }

    close(): void {
        this.dialog?.hide();
    }

    private selectOption(id: string): void {
        this.selectedId = id;
    }

    private goToDetail(): void {
        if (this.selectedId === 'new') {
            this.layer = newLayerConfig(this.geometryType);
        } else {
            const existing = this.existingLayers.find(l => l.id === this.selectedId);
            if (existing) {
                this.layer = { ...existing, properties: existing.properties.map(p => ({ ...p })) };
            } else {
                // Map layer selected — pre-fill name, mark as borrowed
                const mapLayer = this.mapLayers.find(l => l.layerId === this.selectedId);
                this.layer = {
                    ...newLayerConfig(this.geometryType),
                    name: mapLayer?.label ?? this.selectedId,
                    properties: mapLayer?.properties?.map(p => ({ ...p })) ?? DEFAULT_PROPERTIES.map(p => ({ ...p })),
                    borrowedSourceId: mapLayer?.sourceId,
                };
            }
        }
        this.step = 'detail';
        setTimeout(() => (this.renderRoot.querySelector('sl-input[name="layername"]') as any)?.focus(), 100);
    }

    private goBack(): void {
        this.step = 'select';
    }

    private addProperty(): void {
        if (!this.newPropName.trim()) return;
        this.layer = {
            ...this.layer,
            properties: [...this.layer.properties, { name: this.newPropName.trim(), type: this.newPropType }]
        };
        this.newPropName = '';
        this.newPropType = 'string';
    }

    private removeProperty(idx: number): void {
        const props = [...this.layer.properties];
        props.splice(idx, 1);
        this.layer = { ...this.layer, properties: props };
    }

    private confirm(): void {
        const name = (this.renderRoot.querySelector('sl-input[name="layername"]') as any)?.value?.trim() ?? this.layer.name;
        if (!name) {
            this.nameError = true;
            this.requestUpdate();
            return;
        }
        this.nameError = false;
        // flush any unsaved new-prop row
        const propName = this.newPropName.trim();
        const finalProps = propName
            ? [...this.layer.properties, { name: propName, type: this.newPropType }]
            : [...this.layer.properties];

        const result: DrawLayerConfig = { ...this.layer, name, properties: finalProps };
        this.dispatchEvent(new CustomEvent('webmapx-draw-layer-confirm', { detail: result, bubbles: true, composed: true }));
        this.dialog.hide();
    }

    private cancel(): void {
        this.dispatchEvent(new CustomEvent('webmapx-draw-layer-cancel', { bubbles: true, composed: true }));
        this.dialog.hide();
    }

    private renderSelectStep() {
        const label = this.geometryType === 'LineString' ? 'Line' : this.geometryType;
        return html`
            <div class="layer-list">
                <div class="layer-option ${this.selectedId === 'new' ? 'selected' : ''}"
                     @click=${() => this.selectOption('new')}
                     @dblclick=${() => { this.selectOption('new'); this.goToDetail(); }}>
                    <span class="new-icon">＋</span>
                    <span>New ${label} layer</span>
                </div>
                ${this.existingLayers.map(l => html`
                    <div class="layer-option ${this.selectedId === l.id ? 'selected' : ''}"
                         @click=${() => this.selectOption(l.id)}
                         @dblclick=${() => { this.selectOption(l.id); this.goToDetail(); }}>
                        <span class="color-dot" style="background:${l.color}"></span>
                        <span>${l.name}</span>
                    </div>
                `)}
                ${this.mapLayers.length > 0 ? html`
                    <div style="font-size:0.72rem;color:var(--sl-color-neutral-500);padding:0.4rem 0.2rem 0.1rem;text-transform:uppercase;letter-spacing:0.05em">Map layers</div>
                    ${this.mapLayers.map(l => html`
                        <div class="layer-option ${this.selectedId === l.layerId ? 'selected' : ''}"
                             @click=${() => this.selectOption(l.layerId)}
                             @dblclick=${() => { this.selectOption(l.layerId); this.goToDetail(); }}>
                            <span class="new-icon" style="color:var(--sl-color-warning-600)">✎</span>
                            <span>${l.label}</span>
                            <span style="font-size:0.7rem;color:var(--sl-color-neutral-400);margin-left:auto">map layer</span>
                        </div>
                    `)}
                ` : ''}
            </div>
            <div class="footer">
                <sl-button @click=${this.cancel}>Cancel</sl-button>
                <sl-button variant="primary" @click=${this.goToDetail}>Next →</sl-button>
            </div>
        `;
    }

    private renderDetailStep() {
        const availableTypes = PROPERTY_TYPES[this.geometryType];
        const TYPE_LABELS: Partial<Record<PropertyDef['type'], string>> = {
            longitude: 'longitude (auto)',
            latitude: 'latitude (auto)',
            area: 'area (auto)',
            perimeter: 'perimeter (auto)',
            length: 'length (auto)',
            'linkURL': 'link URL',
            'imageURL': 'image URL',
            'create-time': 'create-time (auto)',
            'update-time': 'update-time (auto)',
        };
        return html`
            <div class="name-input-row">
                <sl-input name="layername"
                    style="flex:1"
                    placeholder="Layer name"
                    aria-label="Layer name"
                    value=${this.layer.name}
                    @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.renderRoot.querySelector<HTMLElement>('#new-prop-name')?.focus()}
                ></sl-input>
                <div class="color-swatch"
                     style="background:${this.layer.color}"
                     title="Layer color"
                     @click=${() => (this.renderRoot.querySelector('input[type=color]') as HTMLInputElement)?.click()}>
                </div>
                <input type="color" style="display:none" .value=${this.layer.color}
                    @input=${(e: Event) => { this.layer = { ...this.layer, color: (e.target as HTMLInputElement).value }; }}>
            </div>
            ${this.nameError ? html`<div class="error-msg">Enter a layer name.</div>` : ''}

            <table class="prop-table">
                <thead>
                    <tr><th>Property</th><th>Type</th><th style="width:2rem"></th></tr>
                </thead>
                <tbody>
                    ${this.layer.properties.map((p, i) => html`
                        <tr class="${p.name === 'id' ? 'prop-row-auto' : ''}">
                            <td>${p.name}</td>
                            <td class="${!['string', 'number', 'linkURL', 'imageURL'].includes(p.type) ? 'type-computed' : ''}">${p.type}${p.name === 'id' ? ' (auto)' : ''}</td>
                            <td>
                                ${i === 0 ? '' : html`
                                    <sl-icon-button name="x" @click=${() => this.removeProperty(i)}></sl-icon-button>
                                `}
                            </td>
                        </tr>
                    `)}
                    <tr class="add-row">
                        <td>
                            <sl-input id="new-prop-name" size="small" placeholder="property name" aria-label="Property name"
                                .value=${this.newPropName}
                                @sl-input=${(e: Event) => this.newPropName = (e.target as any).value}
                                @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.addProperty()}>
                            </sl-input>
                        </td>
                        <td>
                            <sl-select id="new-prop-type" size="small" .value=${this.newPropType}
                                @sl-change=${(e: Event) => this.newPropType = (e.target as any).value}>
                                ${availableTypes.map(t => html`<sl-option value=${t}>${TYPE_LABELS[t as PropertyDef['type']] ?? t}</sl-option>`)}
                            </sl-select>
                        </td>
                        <td>
                            <sl-icon-button name="plus" @click=${this.addProperty}></sl-icon-button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="footer">
                <sl-button @click=${this.goBack}>← Back</sl-button>
                <sl-button @click=${this.cancel}>Cancel</sl-button>
                <sl-button variant="primary" @click=${this.confirm}>OK</sl-button>
            </div>
        `;
    }

    render() {
        const label = this.geometryType === 'LineString' ? 'Line' : this.geometryType;
        return html`
            <sl-dialog label="${this.step === 'select' ? `Select ${label} layer` : `Configure ${label} layer`}"
                       @sl-request-close=${(e: Event) => { (e as CustomEvent).detail?.source === 'overlay' && this.cancel(); }}>
                ${this.step === 'select' ? this.renderSelectStep() : this.renderDetailStep()}
            </sl-dialog>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'webmapx-draw-layer-dialog': WebmapxDrawLayerDialog;
    }
}
