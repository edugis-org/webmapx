// src/components/webmapx-info-tool.ts
// Info tool: queries vector features on hover, vector + WMS on click.
// Click same location again to unpin and return to hover mode.

import { html, css, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';
import type { IMap } from '../map/IMapInterfaces';
import type { ClickEvent, PointerMoveEvent } from '../store/map-events';
import type { LngLat, Pixel } from '../store/map-events';
import type { FeatureInfo } from '../map/IQueryService';
import type { LayerAttributeConfig, LayerAttributeTranslation, InfoToolConfig } from '../config/types';
import { throttle } from '../utils/throttle';
import { substituteApiKeys } from '../config/apikeys';
import { fetchWMSFeatureInfo } from '../map/wms-feature-info';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { DATA_TOOL } from '../theme/data-colors';

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
export class WebmapxInfoTool extends WebmapxBaseTool {
    public active = false;

    // ─────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────

    @state() private features: FeatureInfo[] = [];
    @state() private loading = false;
    @state() private mode: 'hover' | 'pinned' = 'hover';
    @state() private pinnedLocation: LngLat | null = null;
    @state() private elevation: number | null = null;
    @state() private streetviewImageUrl: string | null = null;
    @state() private streetviewPanoId: string | null = null;
    @state() private streetviewLoading = false;
    @state() private streetviewUnavailable = false;

    private pinnedPixel: Pixel | null = null;
    private pinMarkerAdded = false;

    private unsubClick: (() => void) | null = null;
    private unsubPointerMove: (() => void) | null = null;
    private unsubViewChange: (() => void) | null = null;
    private unsubViewChangeEnd: (() => void) | null = null;
    private mapIsMoving = false;

    private throttledHoverQuery = throttle(async (pixel: Pixel, lngLat: LngLat) => {
        if (this.mode !== 'hover' || !this.active || !this.adapter) return;
        let results: FeatureInfo[];
        try {
            results = await this.adapter.queryService.queryFeatures(
                { pixel, lngLat },
                { tolerancePx: HOVER_TOLERANCE_PX, includeWMS: false }
            );
        } catch (error) {
            console.warn('[info-tool] queryFeatures failed', error);
            results = [];
        }
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
            padding: var(--webmapx-tool-padding, 0);
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
            color: var(--color-text-secondary, #5a6773);
        }

        .mode-badge.pinned {
            color: var(--color-primary, #2b6c8f);
        }

        .instructions {
            color: var(--color-text-secondary, #5a6773);
            font-size: 0.75rem;
            font-style: italic;
            margin: 0;
        }

        .streetview-link {
            font-style: normal;
            color: var(--sl-color-primary-600, #0070f3);
            text-decoration: none;
        }

        .streetview-link:hover {
            text-decoration: underline;
        }

        .streetview-wrap {
            margin: 0.4rem 0;
        }

        .streetview-thumb {
            width: 100%;
            max-width: 300px;
            border-radius: 4px;
            display: block;
            cursor: pointer;
        }

        .streetview-caption {
            font-size: 0.7rem;
            color: var(--color-text-secondary, #5a6773);
            font-style: italic;
            margin: 0.2rem 0 0;
        }


        .layer-group {
            border: 1px solid var(--color-border-light, #e2e7ec);
            border-radius: 4px;
            overflow: hidden;
        }
        .feature-limit-notice {
            padding: 0.2rem 0.5rem;
            font-size: 0.7rem;
            color: var(--color-text-secondary, #5a6773);
            font-style: italic;
            border-top: 1px solid var(--color-border-light, #e2e7ec);
        }

        .feature-index {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.15rem 0.5rem;
            font-size: 0.7rem;
            font-weight: 600;
            color: var(--color-text-secondary, #5a6773);
            background: var(--color-surface-raised, #f4f6f8);
            border-top: 1px solid var(--color-border-light, #e2e7ec);
        }
        .feature-index::before,
        .feature-index::after {
            content: '';
            flex: 1;
            border-top: 1px solid var(--color-text-secondary, #5a6773);
        }

        .layer-title {
            background: var(--color-surface-raised, #f4f6f8);
            padding: 0.25rem 0.5rem;
            font-weight: 600;
            font-size: 0.75rem;
            color: var(--color-text-secondary, #5a6773);
            border-bottom: 1px solid var(--color-border-light, #e2e7ec);
        }

        .props-list {
            display: grid;
            grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr);
            font-size: 0.8rem;
        }

        .props-row {
            display: contents;
        }

        .props-row:nth-child(even) > .props-key,
        .props-row:nth-child(even) > .props-val {
            background: var(--color-surface-raised, #f4f6f8);
        }

        .props-key {
            min-width: 0;
            padding: 0.2rem 0.5rem;
            font-weight: 500;
            color: var(--color-text-secondary, #5a6773);
            overflow-wrap: break-word;
            border-bottom: 1px solid var(--color-border-light, #e2e7ec);
        }

        .props-val {
            min-width: 0;
            overflow-wrap: break-word;
            padding: 0.2rem 0.5rem;
            border-bottom: 1px solid var(--color-border-light, #e2e7ec);
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
            background: var(--color-surface-raised, #f4f6f8);
            border-bottom: 1px solid var(--color-border-light, #e2e7ec);
        }

        .sub-layer-name {
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--color-text-secondary, #5a6773);
        }

        .sub-layer-type {
            font-size: 0.65rem;
            color: var(--color-text-secondary, #5a6773);
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
            background: var(--color-border-light, #e2e7ec);
            color: var(--color-text-secondary, #5a6773);
            margin-left: 0.25rem;
            vertical-align: middle;
        }

        .source-badge.wms {
            background: var(--color-primary-soft, #e6f0f5);
            color: var(--color-primary, #2b6c8f);
        }

        .empty-hint {
            padding: 0.3rem 0.5rem;
            color: var(--color-text-secondary, #5a6773);
            font-size: 0.8rem;
            font-style: italic;
        }

        .elevation-row {
            padding: 0.3rem 0.5rem;
            font-size: 0.8rem;
            color: var(--color-text-secondary, #5a6773);
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
        this.unsubViewChange = adapter.events.on('view-change', () => { this.mapIsMoving = true; });
        this.unsubViewChangeEnd = adapter.events.on('view-change-end', () => { this.mapIsMoving = false; });
    }

    protected onMapDetached(): void {
        this.unsubClick?.();
        this.unsubPointerMove?.();
        this.unsubViewChange?.();
        this.unsubViewChangeEnd?.();
        this.unsubClick = null;
        this.unsubPointerMove = null;
        this.unsubViewChange = null;
        this.unsubViewChangeEnd = null;
        this.mapIsMoving = false;
        super.onMapDetached();
    }

    disconnectedCallback(): void {
        this.removePinMarker();
        super.disconnectedCallback();
    }

    activate(): void {
        this.active = true;
        this.style.display = 'block';
        this.onActivate();
    }

    deactivate(): void {
        this.active = false;
        this.style.display = 'none';
        this.onDeactivate();
    }

    protected onStateChanged(_state: IMapState): void {
        // No-op
    }

    private onActivate(): void {
        this.features = [];
        this.elevation = null;
        this.mode = 'hover';
        this.pinnedLocation = null;
        this.pinnedPixel = null;
    }

    private onDeactivate(): void {
        this.features = [];
        this.elevation = null;
        this.mode = 'hover';
        this.pinnedLocation = null;
        this.pinnedPixel = null;
        this.removePinMarker();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Event handlers
    // ─────────────────────────────────────────────────────────────────────

    private handlePointerMove(event: PointerMoveEvent): void {
        if (!this.active || this.mode === 'pinned' || this.mapIsMoving) return;
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
        this.elevation = this.adapter.getElevation?.(event.coords) ?? null;
        this.streetviewImageUrl = null;
        this.streetviewPanoId = null;
        this.streetviewUnavailable = false;
        this.updatePinMarker(event.coords);

        try {
            const results = await this.adapter.queryService.queryFeatures(
                { pixel: event.pixel, lngLat: event.coords },
                { tolerancePx: CLICK_TOLERANCE_PX, includeWMS: true }
            );
            // Also query any visible raster layers with getFeatureInfoUrl in metadata
            const gfiResults = await this.queryGFILayers(event.pixel, event.coords);
            this.features = [...results, ...gfiResults];
        } finally {
            this.loading = false;
        }
    }

    /** Query raster layers that expose getFeatureInfoUrl in their mapLayers metadata. */
    private async queryGFILayers(pixel: Pixel, lngLat: LngLat): Promise<FeatureInfo[]> {
        if (!this.adapter) return [];
        const state = this.adapter.store.getState();
        const mapLayers = state.mapLayers ?? {};

        // Use a 256×256 virtual viewport centered on the clicked location, sized to match
        // the map's current zoom (degrees-per-pixel at this zoom × viewport size in pixels).
        // Some WMS servers (e.g. QGIS Server) reject very small viewports, and servers with
        // MINSCALEDENOM/MAXSCALEDENOM (e.g. MapServer) only return features when the request's
        // computed scale matches what's actually visible — a fixed tiny bbox makes the request
        // look far more zoomed-in than the map, so such layers report "no features".
        const size = 256, half = size / 2;
        const zoom = this.adapter.getViewportState()?.zoom ?? 0;
        const degreesPerPixel = 360 / (256 * Math.pow(2, zoom));
        const delta = half * degreesPerPixel;
        const bounds = {
            west: lngLat[0] - delta, south: lngLat[1] - delta,
            east: lngLat[0] + delta, north: lngLat[1] + delta,
        };
        const containerWidth = size, containerHeight = size, pixelX = half, pixelY = half;

        const results: FeatureInfo[] = [];
        await Promise.all(Object.entries(mapLayers).map(async ([layerId, meta]) => {
            const m = meta as Record<string, unknown>;
            const gfiUrl = typeof m?.getFeatureInfoUrl === 'string' ? m.getFeatureInfoUrl : null;
            if (!gfiUrl) return;
            try {
                const u = new URL(gfiUrl);
                const getParamCI = (name: string): string | null => {
                    for (const [key, value] of u.searchParams) {
                        if (key.toLowerCase() === name) return value;
                    }
                    return null;
                };
                const version = getParamCI('version') ?? '1.1.1';
                const layers = getParamCI('layers') ?? getParamCI('query_layers') ?? '';
                const format = typeof m.getFeatureInfoFormat === 'string' ? m.getFeatureInfoFormat : 'application/json';
                // Keep the full configured URL (incl. vendor-specific params like `map=`) as base —
                // buildGetFeatureInfoUrl only sets/overrides standard WMS keys, preserving the rest.
                const crs = getParamCI('crs') ?? getParamCI('srs') ?? 'EPSG:3857';
                const sourceConfig = { id: layerId, type: 'raster' as const, service: 'wms' as const, url: gfiUrl, version, layers, format, crs };
                const layerTitle = typeof m.label === 'string' ? m.label : layerId;
                const feats = await fetchWMSFeatureInfo({
                    sourceConfig, layerId, layerTitle,
                    bounds, containerWidth, containerHeight,
                    pixelX, pixelY,
                });
                results.push(...feats);
            } catch { /* skip failing GFI */ }
        }));
        return results;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Pin marker
    // ─────────────────────────────────────────────────────────────────────

    private updatePinMarker(coords: LngLat): void {
        if (!this.adapter) return;
        if (this.pinMarkerAdded) {
            this.adapter.moveMarker(PIN_MARKER_ID, coords);
        } else {
            this.adapter.addMarker(PIN_MARKER_ID, coords, { color: DATA_TOOL });
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
        this.elevation = null;
        this.streetviewImageUrl = null;
        this.streetviewPanoId = null;
        this.streetviewLoading = false;
        this.streetviewUnavailable = false;
        this.removePinMarker();
    }

    private get googleApiKey(): string | null {
        const cfg = this.toolsConfig?.['info'] as InfoToolConfig | undefined;
        const raw = cfg?.googleApiKey ?? null;
        if (!raw) return null;
        const resolved = substituteApiKeys(raw);
        return resolved.startsWith('{key-') ? null : resolved;
    }

    private async loadStreetview(coords: LngLat): Promise<void> {
        const key = this.googleApiKey;
        const [lng, lat] = coords;
        if (!key) return;
        this.streetviewLoading = true;
        this.streetviewImageUrl = null;
        this.streetviewPanoId = null;
        this.streetviewUnavailable = false;
        try {
            const metaUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${key}`;
            const res = await fetch(metaUrl);
            const json = await res.json();
            if (json.status === 'OK' && json.pano_id) {
                this.streetviewPanoId = json.pano_id;
                this.streetviewImageUrl = `https://maps.googleapis.com/maps/api/streetview?size=300x150&pano=${json.pano_id}&key=${key}`;
            } else {
                this.streetviewUnavailable = true;
            }
        } catch {
            this.streetviewUnavailable = true;
        } finally {
            this.streetviewLoading = false;
        }
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
                const limit = typeof meta?.featureInfoLimit === 'number' ? meta.featureInfoLimit : null;
                const truncated = limit !== null && feats.length > limit;
                const visibleFeats = truncated ? feats.slice(0, limit) : feats;
                // Group composite features by sub-layer
                const bySubLayer = new Map<string, FeatureInfo[]>();
                for (const f of visibleFeats) {
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
                        ${subFeats.length > 1
                            ? subFeats.map((f, i) => html`
                                <div class="feature-index">${i + 1} / ${subFeats.length}</div>
                                ${this.renderPropsTable(f)}`)
                            : subFeats.map((f) => this.renderPropsTable(f))}
                    `)}
                    ${truncated ? html`<div class="feature-limit-notice">Showing ${limit} of ${feats.length} features</div>` : ''}
                </div>`;
            })}
        `;
    }

    private getPropertySchema(layerId: string): Array<{name: string; type: string}> | null {
        const meta = this.adapter?.store.getState().mapLayers?.[layerId];
        return Array.isArray((meta as any)?.properties) ? (meta as any).properties : null;
    }

    private getAttributeMeta(layerId: string): {
        translations: LayerAttributeTranslation[];
        allowed: Set<string> | null;
        denied: Set<string>;
    } {
        const meta = this.adapter?.store.getState().mapLayers?.[layerId];
        const attrs = (meta?.attributes && typeof meta.attributes === 'object') ? meta.attributes as LayerAttributeConfig : {};
        const translations = Array.isArray(attrs.translations) ? attrs.translations : [];
        const allowed = Array.isArray(attrs.allowedAttributes) ? new Set<string>(attrs.allowedAttributes) : null;
        const denied = Array.isArray(attrs.deniedAttributes) ? new Set<string>(attrs.deniedAttributes) : new Set<string>();
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
            rows.push(this.renderPropRow(k, k.replace(/_/g, ' '), strVal, schema));
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
                    : strVal.split(',').map((part, i) => i === 0 ? html`${part}` : html`,<wbr>${part}`)
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

                ${isPinned && this.elevation !== null
                    ? html`<div class="elevation-row">Elevation: <strong>${Math.round(this.elevation)} m</strong></div>`
                    : nothing}

                ${this.renderFeatures()}

                ${isPinned && this.pinnedLocation
                    ? html`
                        ${this.googleApiKey ? html`
                            ${!this.streetviewImageUrl && !this.streetviewLoading && !this.streetviewUnavailable ? html`
                                <p class="instructions">
                                    <a class="streetview-link" href="#"
                                       @click=${(e: Event) => { e.preventDefault(); this.loadStreetview(this.pinnedLocation!); }}>StreetView</a>
                                    &nbsp;·&nbsp; Click same location to unpin.
                                </p>` : ''}
                            ${this.streetviewLoading ? html`<p class="instructions"><sl-spinner></sl-spinner> Loading StreetView…</p>` : ''}
                            ${this.streetviewUnavailable ? html`<p class="instructions">No StreetView at this location.</p>` : ''}
                            ${this.streetviewImageUrl ? html`
                                <div class="streetview-wrap">
                                    <a href="https://www.google.com/maps/@?api=1&map_action=pano&pano=${this.streetviewPanoId}"
                                       target="_blank" rel="noopener noreferrer">
                                        <img class="streetview-thumb" src="${this.streetviewImageUrl}" alt="StreetView">
                                    </a>
                                    <p class="streetview-caption">Click image for full StreetView</p>
                                </div>
                                <p class="instructions">Click same location to unpin.</p>` : ''}
                        ` : html`
                            <p class="instructions">
                                <a class="streetview-link"
                                   href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${this.pinnedLocation[1]},${this.pinnedLocation[0]}"
                                   target="_blank" rel="noopener noreferrer">StreetView</a>
                                &nbsp;·&nbsp; Click same location to unpin.
                            </p>`}
                    ` : isPinned ? html`<p class="instructions">Click same location to unpin.</p>` : nothing}
            </div>
        `;
    }
}
