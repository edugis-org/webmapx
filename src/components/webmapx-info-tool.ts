// src/components/webmapx-info-tool.ts
// Info tool: queries vector features on hover, vector + WMS on click.
// Click same location again to unpin and return to hover mode.

import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import type { IMap } from '../map/IMapInterfaces';
import type { ClickEvent, PointerMoveEvent } from '../store/map-events';
import type { LngLat, Pixel } from '../store/map-events';
import type { FeatureInfo } from '../map/IQueryService';
import { throttle } from '../utils/throttle';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

const PIN_MARKER_ID = 'webmapx-info-pin';

/** Pixel distance within which a second click is treated as "same location" to unpin. */
const UNPIN_THRESHOLD_PX = 8;
/** Hover query throttle interval ms. */
const HOVER_THROTTLE_MS = 120;
/** Hover tolerance in pixels for vector hit-test. */
const HOVER_TOLERANCE_PX = 4;
/** Click tolerance in pixels for vector hit-test. */
const CLICK_TOLERANCE_PX = 6;

@customElement('webmapx-info-tool')
export class WebmapxInfoTool extends WebmapxModalTool {
    readonly toolId = 'info';

    // ─────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────

    @state() private features: FeatureInfo[] = [];
    @state() private loading = false;
    @state() private mode: 'hover' | 'pinned' = 'hover';
    @state() private pinnedLocation: LngLat | null = null;

    private pinnedPixel: Pixel | null = null;
    private pinMarkerAdded = false;

    private unsubClick: (() => void) | null = null;
    private unsubPointerMove: (() => void) | null = null;

    private throttledHoverQuery = throttle(async (pixel: Pixel, lngLat: LngLat) => {
        if (this.mode !== 'hover' || !this.active || !this.adapter) return;
        const results = await this.adapter.queryService.queryFeatures(
            { pixel, lngLat },
            { tolerancePx: HOVER_TOLERANCE_PX, includeWMS: false }
        );
        if (this.mode === 'hover') {
            this.features = results;
        }
    }, HOVER_THROTTLE_MS);

    // ─────────────────────────────────────────────────────────────────────
    // Styles
    // ─────────────────────────────────────────────────────────────────────

    static styles = css`
        :host {
            display: block;
            pointer-events: auto;
        }

        .info-container {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: 0.75rem;
            font-size: var(--font-size-small, 0.875rem);
            min-width: 200px;
        }

        .mode-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.7rem;
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: var(--color-text-secondary, #666);
        }

        .mode-badge.pinned {
            color: var(--color-primary, #0f62fe);
        }

        .instructions {
            color: var(--color-text-secondary, #666);
            font-size: 0.75rem;
            font-style: italic;
            margin: 0;
        }

        .layer-group {
            border: 1px solid var(--color-border-light, #eee);
            border-radius: 4px;
            overflow: hidden;
        }

        .layer-title {
            background: var(--color-surface-alt, #f5f5f5);
            padding: 0.25rem 0.5rem;
            font-weight: 600;
            font-size: 0.75rem;
            color: var(--color-text-secondary, #555);
            border-bottom: 1px solid var(--color-border-light, #eee);
        }

        .props-list {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            font-size: 0.8rem;
        }

        .props-row {
            display: contents;
        }

        .props-row:nth-child(even) > .props-key,
        .props-row:nth-child(even) > .props-val {
            background: var(--color-surface-alt, #fafafa);
        }

        .props-key {
            padding: 0.2rem 0.5rem;
            font-weight: 500;
            color: var(--color-text-secondary, #555);
            white-space: nowrap;
            border-bottom: 1px solid var(--color-border-light, #f0f0f0);
        }

        .props-val {
            min-width: 0;
            overflow: hidden;
            padding: 0.2rem 0.5rem;
            border-bottom: 1px solid var(--color-border-light, #f0f0f0);
        }

        .img-error {
            font-size: 0.75rem;
            color: var(--sl-color-danger-600, #c0392b);
            font-style: italic;
        }

        .props-val a[href] {
            display: block;
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .props-val img {
            max-width: 100%;
            max-height: 120px;
            border-radius: 3px;
            object-fit: cover;
        }

        .raw-value {
            padding: 0.4rem 0.5rem;
            font-size: 0.75rem;
            white-space: pre-wrap;
            overflow: auto;
            max-height: 200px;
        }

        .props-table img {
            max-width: 100%;
            max-height: 120px;
            border-radius: 3px;
            object-fit: cover;
        }

        .sub-layer-title {
            display: flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0.15rem 0.5rem;
            background: var(--color-surface-alt, #f5f5f5);
            border-bottom: 1px solid var(--color-border-light, #eee);
        }

        .sub-layer-name {
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--color-text-secondary, #555);
        }

        .sub-layer-type {
            font-size: 0.65rem;
            color: var(--color-text-secondary, #888);
            font-style: italic;
        }

        .source-badge.composite {
            background: var(--sl-color-violet-100, #ede9fe);
            color: var(--sl-color-violet-700, #6d28d9);
        }

        .source-badge {
            display: inline-block;
            font-size: 0.65rem;
            padding: 0 0.3rem;
            border-radius: 3px;
            background: var(--color-border-light, #e0e0e0);
            color: var(--color-text-secondary, #555);
            margin-left: 0.25rem;
            vertical-align: middle;
        }

        .source-badge.wms {
            background: var(--color-primary-light, #d0e4ff);
            color: var(--color-primary, #0043a8);
        }

        .empty-hint {
            padding: 0.3rem 0.5rem;
            color: var(--color-text-secondary, #999);
            font-size: 0.8rem;
            font-style: italic;
        }

        sl-spinner {
            font-size: 0.9rem;
        }
    `;

    // ─────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────

    protected onMapAttached(adapter: IMap): void {
        super.onMapAttached(adapter);
        this.unsubClick = adapter.events.on('click', this.handleClick.bind(this));
        this.unsubPointerMove = adapter.events.on('pointer-move', this.handlePointerMove.bind(this));
    }

    protected onMapDetached(): void {
        this.unsubClick?.();
        this.unsubPointerMove?.();
        this.unsubClick = null;
        this.unsubPointerMove = null;
        super.onMapDetached();
    }

    disconnectedCallback(): void {
        this.removePinMarker();
        super.disconnectedCallback();
    }

    protected onActivate(): void {
        this.features = [];
        this.mode = 'hover';
        this.pinnedLocation = null;
        this.pinnedPixel = null;
    }

    protected onDeactivate(): void {
        this.features = [];
        this.mode = 'hover';
        this.pinnedLocation = null;
        this.pinnedPixel = null;
        this.removePinMarker();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Event handlers
    // ─────────────────────────────────────────────────────────────────────

    private handlePointerMove(event: PointerMoveEvent): void {
        if (!this.active || this.mode === 'pinned') return;
        this.throttledHoverQuery(event.pixel, event.coords);
    }

    private async handleClick(event: ClickEvent): Promise<void> {
        if (!this.active || !this.adapter) return;

        // Check unpin: click within threshold of pinned location
        if (this.mode === 'pinned' && this.pinnedPixel) {
            const dx = event.pixel[0] - this.pinnedPixel[0];
            const dy = event.pixel[1] - this.pinnedPixel[1];
            if (Math.sqrt(dx * dx + dy * dy) <= UNPIN_THRESHOLD_PX) {
                this.unpin();
                return;
            }
        }

        // Pin at click location
        this.mode = 'pinned';
        this.pinnedLocation = event.coords;
        this.pinnedPixel = event.pixel;
        this.loading = true;
        this.features = [];

        this.updatePinMarker(event.coords);

        try {
            const results = await this.adapter.queryService.queryFeatures(
                { pixel: event.pixel, lngLat: event.coords },
                { tolerancePx: CLICK_TOLERANCE_PX, includeWMS: true }
            );
            this.features = results;
        } finally {
            this.loading = false;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Pin marker
    // ─────────────────────────────────────────────────────────────────────

    private updatePinMarker(coords: LngLat): void {
        if (!this.adapter) return;
        if (this.pinMarkerAdded) {
            this.adapter.moveMarker(PIN_MARKER_ID, coords);
        } else {
            this.adapter.addMarker(PIN_MARKER_ID, coords, { color: '#0f62fe' });
            this.pinMarkerAdded = true;
        }
    }

    private removePinMarker(): void {
        if (!this.pinMarkerAdded) return;
        this.adapter?.removeMarker(PIN_MARKER_ID);
        this.pinMarkerAdded = false;
    }

    private unpin(): void {
        this.mode = 'hover';
        this.pinnedLocation = null;
        this.pinnedPixel = null;
        this.features = [];
        this.removePinMarker();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Rendering
    // ─────────────────────────────────────────────────────────────────────

    private renderFeatures(): TemplateResult | typeof nothing {
        if (this.features.length === 0) return nothing;

        // Group by layerId
        const byLayer = new Map<string, FeatureInfo[]>();
        for (const f of this.features) {
            const existing = byLayer.get(f.layerId);
            if (existing) existing.push(f);
            else byLayer.set(f.layerId, [f]);
        }

        return html`
            ${[...byLayer.entries()].map(([layerId, feats]) => {
                const meta = this.adapter?.store.getState().mapLayers?.[layerId] as Record<string, unknown> | undefined;
                const isComposite = Array.isArray(meta?.sublayers) && (meta!.sublayers as unknown[]).length > 1;
                const badge = isComposite ? 'composite' : feats[0].source;
                // Group composite features by sub-layer
                const bySubLayer = new Map<string, FeatureInfo[]>();
                for (const f of feats) {
                    const key = f.subLayerId ?? '';
                    const existing = bySubLayer.get(key);
                    if (existing) existing.push(f);
                    else bySubLayer.set(key, [f]);
                }
                return html`
                <div class="layer-group">
                    <div class="layer-title">
                        ${feats[0].layerTitle ?? layerId}
                        <span class="source-badge ${isComposite ? 'composite' : feats[0].source}">${badge}</span>
                    </div>
                    ${[...bySubLayer.entries()].map(([subId, subFeats]) => html`
                        ${subId ? html`<div class="sub-layer-title">
                            <span class="sub-layer-name">${subId}</span>
                            ${subFeats[0].subLayerType ? html`<span class="sub-layer-type">${subFeats[0].subLayerType}</span>` : ''}
                        </div>` : ''}
                        ${subFeats.map((f) => this.renderPropsTable(f))}
                    `)}
                </div>`;
            })}
        `;
    }

    private getPropertySchema(layerId: string): Array<{name: string; type: string}> | null {
        const meta = this.adapter?.store.getState().mapLayers?.[layerId];
        return Array.isArray((meta as any)?.properties) ? (meta as any).properties : null;
    }

    private getAttributeMeta(layerId: string): {
        translations: Array<{name: string; translation: string; unit?: string; decimals?: number; multiplier?: number; date?: boolean; valuemap?: Array<{value: unknown; label: string}>}>;
        allowed: Set<string> | null;
        denied: Set<string>;
    } {
        const meta = this.adapter?.store.getState().mapLayers?.[layerId] as Record<string, unknown> | undefined;
        const attrs = (meta?.attributes && typeof meta.attributes === 'object') ? meta.attributes as Record<string, unknown> : {};
        const translations = Array.isArray(attrs.translations) ? attrs.translations as any[] : [];
        const allowed = Array.isArray(attrs.allowedattributes) ? new Set<string>(attrs.allowedattributes as string[]) : null;
        const denied = Array.isArray(attrs.deniedattributes) ? new Set<string>(attrs.deniedattributes as string[]) : new Set<string>();
        return { translations, allowed, denied };
    }

    private renderPropsTable(feature: FeatureInfo): TemplateResult {
        const schema = this.getPropertySchema(feature.layerId);
        const { translations, allowed, denied } = this.getAttributeMeta(feature.layerId);
        const props = feature.properties;

        if (props['_raw']) {
            return html`<div class="raw-value">${props['_raw'] as string}</div>`;
        }

        const rows: TemplateResult[] = [];
        const rendered = new Set<string>();

        // Translated attributes first (in translation order)
        for (const t of translations) {
            const k: string = t.name;
            if (denied.has(k)) continue;
            if (allowed && !allowed.has(k)) continue;
            if (!(k in props) || props[k] === null || props[k] === undefined) continue;
            rendered.add(k);
            let v: unknown = props[k];
            if (t.multiplier && !isNaN(parseFloat(String(t.multiplier)))) {
                v = parseFloat(String(v)) * parseFloat(String(t.multiplier));
            }
            if (t.decimals !== undefined && !isNaN(parseInt(String(t.decimals)))) {
                const factor = Math.pow(10, parseInt(String(t.decimals)));
                v = Math.round(parseFloat(String(v)) * factor) / factor;
            }
            if (t.valuemap && Array.isArray(t.valuemap)) {
                const match = t.valuemap.find((m: any) => m.value === v);
                if (match) v = match.label;
            }
            if (t.date) {
                v = v ? new Date(v as number).toLocaleString() : v;
            }
            const unit = t.unit && !isNaN(Number(v)) ? t.unit : '';
            const displayKey = t.translation || k;
            const strVal = unit ? `${v}${unit}` : (typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''));
            rows.push(this.renderPropRow(k, displayKey, strVal, schema));
        }

        // Remaining untranslated attributes
        for (const [k, v] of Object.entries(props)) {
            if (k === '_raw' || rendered.has(k)) continue;
            if (denied.has(k)) continue;
            if (allowed && !allowed.has(k)) continue;
            if (v === null || v === undefined) continue;
            // If translations defined and this key not in them, skip (show only translated)
            if (translations.length > 0 && !translations.find((t: any) => t.name === k)) {
                if (allowed === null) continue; // hide un-translated when translations exist
            }
            const strVal = typeof v === 'object' ? JSON.stringify(v) : String(v ?? '');
            rows.push(this.renderPropRow(k, k, strVal, schema));
        }

        if (rows.length === 0) return html`<div class="empty-hint">No properties</div>`;
        return html`<div class="props-list">${rows}</div>`;
    }

    private renderPropRow(rawKey: string, displayKey: string, strVal: string, schema: Array<{name: string; type: string}> | null): TemplateResult {
        const propDef = schema?.find(p => p.name === rawKey);
        const schemaType = propDef?.type ?? 'string';
        const isUrl = /^https?:\/\/\S+$/.test(strVal.trim());
        const isDataImage = /^data:image\//i.test(strVal);
        const type = schemaType !== 'string' ? schemaType
            : isDataImage ? 'imageURL'
            : isUrl ? 'linkURL'
            : 'string';
        const isTimeType = type === 'create-time' || type === 'update-time';
        return html`
            <div class="props-row">
                <span class="props-key" title=${rawKey}>${displayKey}</span>
                <span class="props-val">${
                    isTimeType && strVal
                        ? new Date(Number(strVal)).toLocaleString()
                    : type === 'imageURL' && strVal
                        ? html`<img src=${strVal} @error=${(e: Event) => {
    const img = e.target as HTMLImageElement;
    const span = document.createElement('span');
    span.className = 'img-error';
    span.textContent = '⚠ invalid image';
    img.replaceWith(span);
}}>`
                    : type === 'linkURL' && strVal
                        ? html`<a href=${strVal} target="_blank" rel="noopener noreferrer">${strVal}</a>`
                    : strVal
                }</span>
            </div>
        `;
    }

    protected render(): TemplateResult {
        const isPinned = this.mode === 'pinned';

        return html`
            <div class="info-container">
                <div class="mode-badge ${isPinned ? 'pinned' : ''}">
                    <sl-icon name=${isPinned ? 'pin-angle-fill' : 'cursor'}></sl-icon>
                    ${isPinned ? 'Pinned' : 'Hover'}
                    ${this.loading ? html`<sl-spinner></sl-spinner>` : nothing}
                </div>

                ${!isPinned && this.features.length === 0
                    ? html`<p class="instructions">Move cursor over features to inspect. Click to pin and query WMS.</p>`
                    : nothing}

                ${isPinned && !this.loading && this.features.length === 0
                    ? html`<p class="empty-hint">No features at this location.</p>`
                    : nothing}

                ${this.renderFeatures()}

                ${isPinned
                    ? html`<p class="instructions">Click same location to unpin.</p>`
                    : nothing}
            </div>
        `;
    }
}
