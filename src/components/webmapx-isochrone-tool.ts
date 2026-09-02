import { html, css, TemplateResult, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import type { IMap } from '../map/IMapInterfaces';
import type { LngLat, ClickEvent } from '../store/map-events';
import type { IMapState } from '../store/IMapState';
import { substituteApiKeys } from '../config/apikeys';
import { DATA_ROUTE, DATA_TOOL_HALO } from '../theme/data-colors';

const ISO_SOURCE_ID = 'webmapx-isochrone-source';
const ISO_FILL_ID   = 'webmapx-isochrone-fill';
const ISO_LINE_ID   = 'webmapx-isochrone-line';

type RangeType = 'time' | 'distance';
type ModeCategory = 'car' | 'truck' | 'motorcycle' | 'bicycle' | 'foot' | 'bus' | 'wheelchair';

interface IsoMode {
    value: string;
    label: string;
    category: ModeCategory;
}

interface IsoServiceDef {
    id: string;
    label: string;
    modes: IsoMode[];
    keyPlaceholder: string | null;
    keyAttr: string | null;
    calculate(center: LngLat, ranges: number[], rangeType: RangeType, mode: string, key: string | null): Promise<GeoJSON.FeatureCollection>;
}

// RGBA colors indexed by contour rank (0 = smallest/innermost range)
const CONTOUR_RGBA = [
    'rgba(26, 150, 65, 0.5)',
    'rgba(120, 198, 121, 0.45)',
    'rgba(255, 255, 191, 0.4)',
    'rgba(253, 174, 97, 0.4)',
    'rgba(215, 25, 28, 0.35)',
    'rgba(170, 170, 170, 0.3)',
];

function contourRgba(rankSmallestFirst: number): string {
    return CONTOUR_RGBA[Math.min(rankSmallestFirst, CONTOUR_RGBA.length - 1)];
}

/** Build a MapLibre match expression: ['match', ['get', 'contour'], v1, rgba1, …, fallback] */
function buildColorMatch(sortedRangesAsc: number[]): unknown[] {
    const expr: unknown[] = ['match', ['get', 'contour']];
    sortedRangesAsc.forEach((r, i) => {
        expr.push(r, contourRgba(i));
    });
    expr.push('rgba(0,0,0,0)'); // transparent fallback, empty label → legend skips row
    return expr;
}

// ─── Service definitions ──────────────────────────────────────────────────────

const VALHALLA_MODES: IsoMode[] = [
    { value: 'auto',       label: 'Car',        category: 'car' },
    { value: 'truck',      label: 'Truck',      category: 'truck' },
    { value: 'motorcycle', label: 'Motorcycle', category: 'motorcycle' },
    { value: 'bicycle',    label: 'Bicycle',    category: 'bicycle' },
    { value: 'pedestrian', label: 'Pedestrian', category: 'foot' },
    { value: 'bus',        label: 'Bus',        category: 'bus' },
];

const ORS_MODES: IsoMode[] = [
    { value: 'driving-car',     label: 'Car',        category: 'car' },
    { value: 'driving-hgv',     label: 'Truck',      category: 'truck' },
    { value: 'cycling-regular', label: 'Bicycle',    category: 'bicycle' },
    { value: 'foot-walking',    label: 'Foot',       category: 'foot' },
    { value: 'wheelchair',      label: 'Wheelchair', category: 'wheelchair' },
];


const ISO_SERVICES: IsoServiceDef[] = [
    {
        id: 'openrouteservice',
        label: 'OpenRouteService',
        modes: ORS_MODES,
        keyPlaceholder: '{key-openrouteservice}',
        keyAttr: 'ors-api-key',
        async calculate(center, ranges, rangeType, mode, key) {
            if (!key) throw new Error('No OpenRouteService API key configured.');
            // ORS uses seconds for time, meters for distance
            const converted = ranges.map(r => rangeType === 'time' ? r * 60 : r * 1000);
            const resp = await fetch(`https://api.openrouteservice.org/v2/isochrones/${mode}`, {
                method: 'POST',
                headers: { 'Authorization': key, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locations: [[center[0], center[1]]],
                    range: converted,
                    range_type: rangeType,
                }),
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error((err as any)?.error?.message ?? `ORS ${resp.status}`);
            }
            const fc: GeoJSON.FeatureCollection = await resp.json();
            // ORS value is in seconds (time) or meters (distance) — normalize to user-friendly units
            const sorted = [...fc.features].sort((a, b) => {
                const av = (a.properties as any)?.value ?? 0;
                const bv = (b.properties as any)?.value ?? 0;
                return bv - av;
            });
            sorted.forEach(f => {
                const raw = (f.properties as any)?.value ?? 0;
                (f.properties as any).contour = rangeType === 'time' ? Math.round(raw / 60) : Math.round(raw / 100) / 10;
            });
            return { ...fc, features: sorted };
        },
    },
    {
        id: 'valhalla',
        label: 'Valhalla (free)',
        modes: VALHALLA_MODES,
        keyPlaceholder: null,
        keyAttr: null,
        async calculate(center, ranges, rangeType, mode) {
            const contours = ranges.map(r =>
                rangeType === 'time' ? { time: r } : { distance: r }
            );
            const resp = await fetch('https://valhalla1.openstreetmap.de/isochrone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locations: [{ lon: center[0], lat: center[1] }],
                    costing: mode,
                    contours,
                    polygons: true,
                }),
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error((err as any)?.error ?? `Valhalla ${resp.status}`);
            }
            const fc: GeoJSON.FeatureCollection = await resp.json();
            // Sort outermost first (largest contour value) so inner polygons render on top
            const sorted = [...fc.features].sort((a, b) => {
                const av = (a.properties as any)?.contour ?? 0;
                const bv = (b.properties as any)?.contour ?? 0;
                return bv - av;
            });
            // contour property already set by Valhalla (minutes or km)
            return { ...fc, features: sorted };
        },
    },
];

/**
 * A detached copy of a GeoJSON collection.
 *
 * `structuredClone` where the browser has it, a JSON round trip otherwise —
 * GeoJSON is plain data, so the round trip loses nothing it carries.
 */
function deepCopy<T>(value: T): T {
    return typeof structuredClone === 'function'
        ? structuredClone(value)
        : JSON.parse(JSON.stringify(value)) as T;
}

const SERVICE_MAP = new Map(ISO_SERVICES.map(s => [s.id, s]));

// ─── Component ────────────────────────────────────────────────────────────────

@customElement('webmapx-isochrone-tool')
export class WebmapxIsochroneTool extends WebmapxModalTool {
    readonly toolId = 'isochrone';

    @state() private center: LngLat | null = null;
    @state() private serviceId = 'openrouteservice';
    @state() private mode = 'auto';
    @state() private rangeType: RangeType = 'time';
    @state() private rangesInput = '10, 20, 30';
    @state() private loading = false;
    @state() private error: string | null = null;

    private currentFc: GeoJSON.FeatureCollection | null = null;
    private unsubClick: (() => void) | null = null;
    private layersCreated = false;

    static styles = css`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; }
        label { display: block; font-weight: 600; margin-bottom: 0.25rem; }
        .hint { color: var(--color-text-secondary, #5a6773); font-size: 0.8rem; margin-bottom: 0.75rem; line-height: 1.4; }
        .row { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
        select, input[type="text"] { flex: 1; padding: 0.3rem 0.5rem; border: 1px solid var(--color-border, #d5dce3); border-radius: 4px; font-size: 0.875rem; background: var(--color-background, #fff); color: var(--color-text-primary, #16202a); }
        button { padding: 0.35rem 0.75rem; border: 1px solid var(--color-border, #d5dce3); border-radius: 4px; background: var(--color-background, #fff); cursor: pointer; font-size: 0.875rem; color: var(--color-text-primary, #16202a); }
        button.calculate {
            flex: 1;
            border-color: var(--color-primary, #2b6c8f);
            background: var(--color-primary, #2b6c8f);
            color: var(--color-on-primary, #fff);
        }
        /* Disabled rather than hidden: the button is where the reader looks for
           what to do next, and a missing one reads as a broken panel. */
        button.calculate[disabled] { opacity: 0.5; cursor: not-allowed; }
        button:disabled { opacity: 0.5; cursor: default; }
        .field-label { font-size: 0.78rem; color: var(--color-text-secondary, #5a6773); margin-bottom: 0.15rem; font-weight: 600; }
        .field { margin-bottom: 0.5rem; }
        .error { color: var(--sl-color-danger-600, #c00); font-size: 0.8rem; margin-top: 0.25rem; }
        .center-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--color-text-secondary, #5a6773); }
        .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--webmapx-data-route, #2563eb); display: inline-block; flex-shrink: 0; }
        .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid var(--color-border, #d5dce3); border-top-color: var(--color-primary, #2b6c8f); border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    `;

    // ─── Config helpers ───────────────────────────────────────────────────────

    private getToolAttr(name: string): string | undefined {
        const toolId = this.getAttribute('tool-id');
        const groups = this.toolsConfig ? Object.values(this.toolsConfig) : [];
        for (const group of groups) {
            const items = Array.isArray((group as any)?.items) ? (group as any).items : [];
            for (const item of items) {
                if (item?.id === toolId && typeof item[name] === 'string') return item[name] as string;
            }
        }
        return undefined;
    }

    private get configuredService(): string | null {
        const v = this.getToolAttr('routingService');
        if (!v || v === 'all') return null;
        return SERVICE_MAP.has(v) ? v : null;
    }

    private serviceHasKey(svc: IsoServiceDef): boolean {
        if (!svc.keyPlaceholder) return true;
        return this.getApiKey(svc) !== null;
    }

    private getApiKey(svc: IsoServiceDef): string | null {
        if (!svc.keyPlaceholder) return null;
        if (svc.keyAttr) {
            const fromAttr = this.getToolAttr(svc.keyAttr);
            if (fromAttr) return fromAttr;
        }
        const substituted = substituteApiKeys(svc.keyPlaceholder);
        return substituted.startsWith('{') ? null : substituted;
    }

    private get availableServices(): IsoServiceDef[] {
        return ISO_SERVICES.filter(s => this.serviceHasKey(s));
    }

    private get activeService(): IsoServiceDef {
        const id = this.configuredService ?? this.serviceId;
        const svc = SERVICE_MAP.get(id);
        if (svc && this.serviceHasKey(svc)) return svc;
        return this.availableServices[0] ?? ISO_SERVICES[0];
    }

    /**
     * The travel mode actually used.
     *
     * Services do not share a mode vocabulary — OpenRouteService says
     * `driving-car` where Valhalla says `auto` — and the active service can
     * change without the reader touching the dropdown, because a service whose
     * key is missing falls back to one that has none. Reading the stored value
     * blindly would then send a mode the service has never heard of.
     */
    private get effectiveMode(): string {
        const modes = this.activeService.modes;
        return modes.some(m => m.value === this.mode) ? this.mode : modes[0].value;
    }

    private get showServiceDropdown(): boolean {
        return this.configuredService === null;
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    protected onMapAttached(adapter: IMap): void {
        super.onMapAttached(adapter);
        this.unsubClick = adapter.events.on('click', (e: ClickEvent) => this.handleMapClick(e));
    }

    protected onMapDetached(): void {
        this.unsubClick?.();
        this.unsubClick = null;
        this.adapter?.setCursor('');
        this.removeLayers();
        this.adapter?.removeMarker('webmapx-isochrone-center');
        super.onMapDetached();
    }

    private _escHandler: ((e: KeyboardEvent) => void) | null = null;

    protected onActivate(): void {
        this.createLayers();
        this.adapter?.setCursor('crosshair');
        this._escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') this.deactivate(); };
        document.addEventListener('keydown', this._escHandler);
    }

    protected onDeactivate(): void {
        document.removeEventListener('keydown', this._escHandler!);
        this._escHandler = null;
        this.adapter?.setCursor('');
        this.clearIsochrone();
        this.removeLayers();
    }

    protected onStateChanged(_state: IMapState): void {}

    // ─── Layers ───────────────────────────────────────────────────────────────

    private createLayers(): void {
        if (this.layersCreated) return;
        const emptyFc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
        this.dispatchEvent(new CustomEvent('webmapx-add-source', {
            detail: { id: ISO_SOURCE_ID, config: { type: 'geojson', data: emptyFc } },
            bubbles: true, composed: true,
        }));
        this.dispatchEvent(new CustomEvent('webmapx-add-layer', {
            detail: {
                id: ISO_FILL_ID, type: 'fill', source: ISO_SOURCE_ID,
                paint: { 'fill-color': 'rgba(120,198,121,0.4)', 'fill-opacity': 1 },
                metadata: { isToolLayer: true, hideFromLegend: true },
            },
            bubbles: true, composed: true,
        }));
        this.dispatchEvent(new CustomEvent('webmapx-add-layer', {
            detail: {
                id: ISO_LINE_ID, type: 'line', source: ISO_SOURCE_ID,
                paint: { 'line-color': 'rgba(120,198,121,0.8)', 'line-width': 1.5, 'line-opacity': 1 },
                metadata: { isToolLayer: true, hideFromLegend: true },
            },
            bubbles: true, composed: true,
        }));
        this.layersCreated = true;
    }

    private removeLayers(): void {
        if (!this.layersCreated) return;
        this.dispatchEvent(new CustomEvent('webmapx-remove-layer', { detail: ISO_LINE_ID, bubbles: true, composed: true }));
        this.dispatchEvent(new CustomEvent('webmapx-remove-layer', { detail: ISO_FILL_ID, bubbles: true, composed: true }));
        this.dispatchEvent(new CustomEvent('webmapx-remove-source', { detail: ISO_SOURCE_ID, bubbles: true, composed: true }));
        this.layersCreated = false;
    }

    private setData(fc: GeoJSON.FeatureCollection, sortedRanges?: number[]): void {
        this.currentFc = fc.features.length > 0 ? fc : null;
        this.adapter?.getSource(ISO_SOURCE_ID)?.setData(fc);
        // Update live layer paint to use match expression for the new contour values
        if (sortedRanges && sortedRanges.length > 0) {
            const colorMatch = buildColorMatch(sortedRanges);
            this.adapter?.updateLayerStyle(ISO_FILL_ID, ISO_FILL_ID, { 'fill-color': colorMatch });
            this.adapter?.updateLayerStyle(ISO_LINE_ID, ISO_LINE_ID, { 'line-color': colorMatch });
        }
    }

    private persistToMap(): void {
        if (!this.currentFc || !this.center) return;
        const ranges = this.parseRanges();
        if (!ranges) return;

        const id = `webmapx-iso-${Date.now()}`;
        const svc = this.activeService;
        const modeLabel = svc.modes.find(m => m.value === this.mode)?.label ?? this.mode;
        const rangeLabel = this.rangeType === 'time' ? 'min' : 'km';
        const label = `Isochrone ${modeLabel} · ${this.rangesInput.trim()} ${rangeLabel}`;
        const colorMatch = buildColorMatch(ranges);
        const created = new Date().toISOString();
        const abstract = [
            `<b>Service:</b> ${svc.label}`,
            `<b>Mode:</b> ${modeLabel}`,
            `<b>Range type:</b> ${this.rangeType === 'time' ? 'Time' : 'Distance'}`,
            `<b>Ranges:</b> ${ranges.join(', ')} ${rangeLabel}`,
            `<b>Center:</b> ${this.center[1].toFixed(6)}, ${this.center[0].toFixed(6)}`,
            `<b>Created:</b> ${created}`,
        ].join('<br>');

        // A full copy, not the live arrays. The persisted layer is meant to
        // outlive the panel that made it: sharing `currentFc.features` means the
        // next Calculate — which empties and refills that collection — reaches
        // into a layer the reader already saved, and the same holds for the
        // centre coordinate, which the marker's drag handler replaces in place.
        // Saving something that changes afterwards is worse than not saving it,
        // because nothing says it happened.
        const polygonFc: GeoJSON.FeatureCollection = deepCopy({ type: 'FeatureCollection', features: this.currentFc.features });
        const pointFc:   GeoJSON.FeatureCollection = deepCopy({
            type: 'FeatureCollection',
            features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: this.center }, properties: { point_color: DATA_ROUTE } }],
        });
        const isoLabel = this.rangeType === 'time' ? 'Isochrones' : 'Isodistances';

        this.dispatchEvent(new CustomEvent('webmapx-add-layer', {
            detail: {
                id,
                type: 'style',
                version: 8,
                beforeLayerId: ISO_FILL_ID,
                metadata: { label, abstract, legendRole: 'overlay' },
                sources: {
                    polygons: { type: 'geojson', data: polygonFc },
                    center:   { type: 'geojson', data: pointFc },
                },
                layers: [
                    {
                        id: `${id}-fill`, type: 'fill', source: 'polygons',
                        paint: { 'fill-color': colorMatch },
                        metadata: { label: isoLabel },
                    },
                    {
                        id: `${id}-line`, type: 'line', source: 'polygons',
                        paint: { 'line-color': colorMatch, 'line-width': 1.5, 'line-opacity': 0.8 },
                        metadata: { label: 'Isolines' },
                    },
                    {
                        id: `${id}-circle`, type: 'circle', source: 'center',
                        paint: { 'circle-color': ['get', 'point_color'], 'circle-radius': 6, 'circle-stroke-color': DATA_TOOL_HALO, 'circle-stroke-width': 2 },
                        metadata: { label: 'Center' },
                    },
                ],
            },
            bubbles: true, composed: true,
        }));
    }

    // ─── Interaction ──────────────────────────────────────────────────────────

    private handleMapClick(e: ClickEvent): void {
        if (!this.active) return;
        this.center = e.coords;
        this.adapter?.addMarker('webmapx-isochrone-center', e.coords, {
            color: DATA_ROUTE, draggable: true,
            onDragEnd: (ll) => { this.center = ll; },
        });
    }

    // ─── Service / mode switching ─────────────────────────────────────────────

    private onServiceChange(e: Event): void {
        const newId = (e.target as HTMLSelectElement).value;
        const newSvc = SERVICE_MAP.get(newId);
        if (!newSvc) return;
        const currentCategory = this.activeService.modes.find(m => m.value === this.mode)?.category;
        this.serviceId = newId;
        const match = currentCategory ? newSvc.modes.find(m => m.category === currentCategory) : undefined;
        this.mode = match?.value ?? newSvc.modes[0].value;
        this.error = null;
    }

    private onModeChange(e: Event): void {
        this.mode = (e.target as HTMLSelectElement).value;
    }

    private onRangeTypeChange(e: Event): void {
        this.rangeType = (e.target as HTMLSelectElement).value as RangeType;
        this.rangesInput = this.rangeType === 'time' ? '10, 20, 30' : '1, 5, 10';
    }

    // ─── Calculation ──────────────────────────────────────────────────────────

    private parseRanges(): number[] | null {
        const parts = this.rangesInput.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0);
        if (parts.length === 0) return null;
        return [...new Set(parts)].sort((a, b) => a - b);
    }

    /**
     * Asks the service, once, for the isochrone the form describes.
     *
     * Only ever reached from the Calculate button. The tool used to recalculate
     * whenever a field changed, which meant a service call for every keystroke
     * in the ranges box and for every mode a reader tried on the way to the one
     * they wanted — against a service that is either metered or a free server
     * with no quota anyone is accounting for. An isochrone is expensive enough
     * to be worth asking for on purpose.
     *
     * A request in flight blocks another: these calls take seconds, and two
     * answers arriving out of order would leave the map showing the older one
     * with no way to tell.
     */
    private async calculate(): Promise<void> {
        if (this.loading) return;
        if (!this.center) return;
        const ranges = this.parseRanges();
        if (!ranges) { this.error = 'Enter at least one valid range value.'; return; }

        const svc = this.activeService;
        const key = this.getApiKey(svc);

        this.loading = true;
        this.error = null;
        // The previous answer goes before the new question is asked. Leaving it
        // up would show a shape belonging to a mode or a range that is no longer
        // what the form says, for however long the service takes.
        this.setData({ type: 'FeatureCollection', features: [] });

        try {
            const fc = await svc.calculate(this.center, ranges, this.rangeType, this.effectiveMode, key);
            this.setData(fc, ranges);
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'Calculation failed';
            this.setData({ type: 'FeatureCollection', features: [] });
        } finally {
            this.loading = false;
        }
    }

    private clearIsochrone(): void {
        this.center = null;
        this.error = null;
        this.adapter?.removeMarker('webmapx-isochrone-center');
        this.setData({ type: 'FeatureCollection', features: [] });
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    render(): TemplateResult {
        const svc = this.activeService;
        const rangeLabel = this.rangeType === 'time' ? 'minutes' : 'km';

        return html`
            <label>Isochrone</label>
            <p class="hint">${this.center
                ? 'Click the map to move the centre, then press Calculate.'
                : 'Click the map to set the centre point.'}</p>

            ${this.center ? html`
                <div class="center-row">
                    <span class="dot"></span>
                    ${this.center[1].toFixed(5)}, ${this.center[0].toFixed(5)}
                    <button @click=${() => this.clearIsochrone()} style="margin-left:auto;padding:0.1rem 0.4rem;font-size:0.75rem;" aria-label="Clear isochrone">✕</button>
                </div>` : nothing}

            ${this.showServiceDropdown ? html`
                <div class="field">
                    <div class="field-label">Service</div>
                    <select aria-label="Isochrone service" @change=${(e: Event) => this.onServiceChange(e)}>
                        ${this.availableServices.map(s => html`<option value=${s.id} ?selected=${s.id === this.serviceId}>${s.label}</option>`)}
                    </select>
                </div>
            ` : nothing}

            <div class="row">
                <div class="field" style="flex:1">
                    <div class="field-label">Mode</div>
                    <select aria-label="Travel mode" @change=${(e: Event) => this.onModeChange(e)}>
                        ${svc.modes.map(m => html`<option value=${m.value} ?selected=${m.value === this.effectiveMode}>${m.label}</option>`)}
                    </select>
                </div>
                <div class="field" style="flex:1">
                    <div class="field-label">Range type</div>
                    <select aria-label="Range type" @change=${(e: Event) => this.onRangeTypeChange(e)}>
                        <option value="time"     ?selected=${this.rangeType === 'time'}>Time</option>
                        <option value="distance" ?selected=${this.rangeType === 'distance'}>Distance</option>
                    </select>
                </div>
            </div>

            <div class="field">
                <div class="field-label">Ranges (${rangeLabel}, comma-separated)</div>
                <div class="row">
                    <input type="text" aria-label="Ranges, comma-separated" .value=${this.rangesInput}
                        @input=${(e: Event) => { this.rangesInput = (e.target as HTMLInputElement).value; }}
                        placeholder="e.g. 10, 20, 30">
                    <button @click=${() => this.clearIsochrone()}>Clear</button>
                </div>
            </div>

            <div class="row" style="margin-top:0.5rem;">
                <button
                    class="calculate"
                    ?disabled=${!this.center || this.loading}
                    title=${this.center ? 'Ask the service for this isochrone' : 'Click the map to set a centre point first'}
                    @click=${() => void this.calculate()}
                >${this.loading ? 'Calculating…' : 'Calculate'}</button>
            </div>

            ${this.loading ? html`<div class="row"><span class="spinner"></span> Calculating…</div>` : nothing}
            ${this.error ? html`<div class="error">⚠ ${this.error}</div>` : nothing}

            ${this.currentFc && !this.loading ? html`
                <div class="row" style="margin-top:0.5rem;">
                    <button @click=${() => this.persistToMap()} style="flex:1;padding:0.35rem 0.75rem;border:1px solid var(--color-primary,#2b6c8f);border-radius:var(--webmapx-radius-sm,4px);background:var(--color-primary,#2b6c8f);color:var(--color-on-primary,#fff);cursor:pointer;font-size:0.875rem;">Persist to map</button>
                </div>
            ` : nothing}
        `;
    }
}
