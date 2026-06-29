import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import { resolveMapElement } from './internal/map-context';
import type { IMapState } from '../store/IMapState';
import mercatorViewUrl from '../icons/mercator-view.png?url';
import globeViewUrl from '../icons/globe-view.png?url';

interface ViewModeDef {
    id: string;
    name: string;
    description: string;
    image: string;
    conic?: boolean;
}

const VIEW_MODES: ViewModeDef[] = [
    { id: 'mercator', name: 'Mercator', description: 'Cylindrical Mercator', image: mercatorViewUrl },
    { id: 'globe',    name: 'Globe',    description: 'Globe view: orthographic-like or perspective', image: globeViewUrl },
];

@customElement('webmapx-view-mode-tool')
export class WebmapxViewModeTool extends WebmapxBaseTool {
    @state() private viewModeName = 'mercator';
    @state() private centerLng = 0;
    @state() private centerLat = 30;
    @state() private parallel1 = 29.5;
    @state() private parallel2 = 45.5;
    @state() private supported = true;

    static styles = css`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; }
        .unsupported { color: var(--sl-color-neutral-500, #888); font-style: italic; }
        label { display: block; font-weight: 600; margin-bottom: 0.25rem; }
        select { width: 100%; margin-bottom: 0.75rem; padding: 0.25rem; box-sizing: border-box; }
        .mode-description { margin-bottom: 0.5rem; color: var(--sl-color-neutral-600, #555); }
        img { width: 100%; border-radius: 4px; margin-bottom: 0.75rem; }
        .slider-group { margin-bottom: 0.75rem; display: none; }
        .slider-group.visible { display: block; }
        .slider-row { display: flex; justify-content: space-between; margin-bottom: 0.2rem; }
        input[type=range] { width: 100%; }
    `;

    protected onStateChanged(state: IMapState): void {
        // Keep re-syncing until we get a valid view mode (map may not be ready immediately)
        if (!this.supported || this.viewModeName === '') this.syncFromAdapter(state.mapLoaded);
    }

    protected onMapAttached(): void {
        this.supported = true; // assume supported until proven otherwise
        this.viewModeName = '';
        this.syncFromAdapter(this.adapter?.store.getState().mapLoaded ?? false);
    }

    private syncFromAdapter(mapLoaded = false): void {
        if (!this.adapter) return;
        // Defer until map is loaded — projection is applied during adapter.initialize()
        // which runs after onMapAttached, so reading too early gives a stale default.
        if (!mapLoaded) return;
        const proj = this.adapter.getProjection();
        if (proj === null) {
            // null = engine definitively doesn't support runtime view-mode changes; undefined timing = try again later
            this.supported = false;
            return;
        }
        // Got a valid view mode, so this engine supports the control.
        this.supported = true;
        this.viewModeName = proj.name ?? 'mercator';
        if (proj.center) { this.centerLng = proj.center[0]; this.centerLat = proj.center[1]; }
        if (proj.parallels) { this.parallel1 = proj.parallels[0]; this.parallel2 = proj.parallels[1]; }
    }

    private applyViewMode(): void {
        if (!this.adapter) return;
        const def = VIEW_MODES.find(p => p.id === this.viewModeName);
        if (def?.conic) {
            // Conic projections always use the adapter directly (no reinit needed)
            const success = this.adapter.setProjection({
                name: this.viewModeName,
                center: [this.centerLng, this.centerLat],
                parallels: [this.parallel1, this.parallel2],
            });
            if (!success) this.syncFromAdapter();
        } else {
            // Route through webmapx-map so it can save state + reload if engine needs reinit
            const mapElement = resolveMapElement(this);
            if (mapElement && typeof (mapElement as any).setProjection === 'function') {
                (mapElement as any).setProjection(this.viewModeName);
            } else {
                const success = this.adapter.setProjection(this.viewModeName);
                if (!success) this.syncFromAdapter();
            }
        }
    }

    render(): TemplateResult {
        if (!this.supported) {
            return html`<div class="unsupported">View modes are not supported by this engine.</div>`;
        }
        const def = VIEW_MODES.find(p => p.id === this.viewModeName) ?? VIEW_MODES[0];
        const isConic = def.conic === true;

        return html`
            <label>View mode</label>
            <select @change=${(e: Event) => { this.viewModeName = (e.target as HTMLSelectElement).value; this.applyViewMode(); }}>
                ${VIEW_MODES.map(p => html`<option value=${p.id} ?selected=${p.id === this.viewModeName}>${p.name}</option>`)}
            </select>
            <div class="mode-description">${def.description}</div>
            <img src=${def.image} alt=${def.description}>

            <div class="slider-group ${isConic ? 'visible' : ''}">
                <div class="slider-row"><span>Center longitude</span><strong>${this.centerLng}°</strong></div>
                <input type="range" min="-180" max="180" .value=${String(this.centerLng)}
                    @input=${(e: Event) => { this.centerLng = Number((e.target as HTMLInputElement).value); this.applyViewMode(); }}>
            </div>
            <div class="slider-group ${isConic ? 'visible' : ''}">
                <div class="slider-row"><span>Center latitude</span><strong>${this.centerLat}°</strong></div>
                <input type="range" min="-90" max="90" .value=${String(this.centerLat)}
                    @input=${(e: Event) => { this.centerLat = Number((e.target as HTMLInputElement).value); this.applyViewMode(); }}>
            </div>
            <div class="slider-group ${isConic ? 'visible' : ''}">
                <div class="slider-row"><span>South parallel</span><strong>${this.parallel1}°</strong></div>
                <input type="range" min="-90" max="90" .value=${String(this.parallel1)}
                    @input=${(e: Event) => { this.parallel1 = Number((e.target as HTMLInputElement).value); this.applyViewMode(); }}>
            </div>
            <div class="slider-group ${isConic ? 'visible' : ''}">
                <div class="slider-row"><span>North parallel</span><strong>${this.parallel2}°</strong></div>
                <input type="range" min="-90" max="90" .value=${String(this.parallel2)}
                    @input=${(e: Event) => { this.parallel2 = Number((e.target as HTMLInputElement).value); this.applyViewMode(); }}>
            </div>
        `;
    }
}
