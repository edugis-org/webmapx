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

        .props-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.8rem;
        }

        .props-table tr:nth-child(even) td {
            background: var(--color-surface-alt, #fafafa);
        }

        .props-table td {
            padding: 0.2rem 0.5rem;
            vertical-align: top;
            border-bottom: 1px solid var(--color-border-light, #f0f0f0);
        }

        .props-table td:first-child {
            font-weight: 500;
            color: var(--color-text-secondary, #555);
            white-space: nowrap;
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .props-table td:last-child {
            word-break: break-word;
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
            ${[...byLayer.entries()].map(([layerId, feats]) => html`
                <div class="layer-group">
                    <div class="layer-title">
                        ${feats[0].layerTitle ?? layerId}
                        <span class="source-badge ${feats[0].source}">${feats[0].source}</span>
                    </div>
                    ${feats.map((f) => this.renderPropsTable(f))}
                </div>
            `)}
        `;
    }

    private renderPropsTable(feature: FeatureInfo): TemplateResult {
        const entries = Object.entries(feature.properties).filter(
            ([k, v]) => v !== null && v !== undefined && k !== '_raw'
        );

        if (feature.properties['_raw']) {
            return html`
                <div style="padding: 0.4rem 0.5rem; font-size: 0.75rem; white-space: pre-wrap; overflow: auto; max-height: 200px;">
                    ${feature.properties['_raw'] as string}
                </div>
            `;
        }

        if (entries.length === 0) {
            return html`<div class="empty-hint" style="padding: 0.3rem 0.5rem;">No properties</div>`;
        }

        return html`
            <table class="props-table">
                <tbody>
                    ${entries.map(([k, v]) => html`
                        <tr>
                            <td title=${k}>${k}</td>
                            <td>${typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
                        </tr>
                    `)}
                </tbody>
            </table>
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
