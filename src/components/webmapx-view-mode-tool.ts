import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import { resolveMapElement } from './internal/map-context';
import type { IMapState, MapProjectionState } from '../store/IMapState';
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
    /** True while this tool is itself calling setProjection — see applyViewMode(). */
    private applyingOwnChange = false;

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
        // store.mapProjection is maintained by BaseAdapter: seeded once the map has loaded
        // and re-dispatched on every successful setProjection — including ones this tool did
        // not initiate (story steps, other tools), which is why we follow the store rather
        // than polling the adapter.
        if (this.applyingOwnChange) return;
        this.applyProjectionState(state.mapProjection);
    }

    protected onMapAttached(): void {
        this.supported = true; // assume supported until proven otherwise
        this.viewModeName = '';
        this.applyProjectionState(this.adapter?.store.getState().mapProjection);
    }

    /** undefined = not known yet (map still loading), null = engine has no projection support. */
    private applyProjectionState(proj: MapProjectionState | null | undefined): void {
        if (proj === undefined) return;
        if (proj === null) {
            this.supported = false;
            return;
        }
        this.supported = true;
        this.viewModeName = proj.name ?? 'mercator';
        if (proj.center) { this.centerLng = proj.center[0]; this.centerLat = proj.center[1]; }
        if (proj.parallels) { this.parallel1 = proj.parallels[0]; this.parallel2 = proj.parallels[1]; }
    }

    /** Re-reads live engine state after a rejected setProjection, so the UI snaps back. */
    private syncFromAdapter(): void {
        this.applyProjectionState(this.adapter?.getProjection());
    }

    private applyViewMode(): void {
        if (!this.adapter) return;
        // The setProjection below dispatches store.mapProjection back to us. Ignore that
        // echo so an engine-normalised value cannot fight the slider the user is dragging.
        this.applyingOwnChange = true;
        try {
            this.applyViewModeToEngine();
        } finally {
            this.applyingOwnChange = false;
        }
    }

    private applyViewModeToEngine(): void {
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
