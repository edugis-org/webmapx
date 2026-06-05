import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';

interface ProjectionDef {
    id: string;
    name: string;
    type: string;
    image: string;
    conic?: boolean;
}

// MapLibre GL JS v5 only supports mercator and globe natively
const PROJECTIONS: ProjectionDef[] = [
    { id: 'mercator', name: 'Mercator', type: 'Cylindrical',   image: 'cylindrical.png' },
    { id: 'globe',    name: 'Globe',    type: 'Orthographic',  image: 'azimuthal.png' },
];

@customElement('webmapx-projection-tool')
export class WebmapxProjectionTool extends WebmapxBaseTool {
    @state() private projectionName = 'mercator';
    @state() private centerLng = 0;
    @state() private centerLat = 30;
    @state() private parallel1 = 29.5;
    @state() private parallel2 = 45.5;
    @state() private supported = true;

    static styles = css`
        :host { display: block; padding: 0.75rem; font-size: 0.875rem; }
        .unsupported { color: var(--sl-color-neutral-500, #888); font-style: italic; }
        label { display: block; font-weight: 600; margin-bottom: 0.25rem; }
        select { width: 100%; margin-bottom: 0.75rem; padding: 0.25rem; box-sizing: border-box; }
        .proj-type { margin-bottom: 0.5rem; color: var(--sl-color-neutral-600, #555); }
        img { width: 100%; border-radius: 4px; margin-bottom: 0.75rem; }
        .slider-group { margin-bottom: 0.75rem; display: none; }
        .slider-group.visible { display: block; }
        .slider-row { display: flex; justify-content: space-between; margin-bottom: 0.2rem; }
        input[type=range] { width: 100%; }
    `;

    protected onStateChanged(_state: IMapState): void {
        // Keep re-syncing until we get a valid projection (map may not be ready immediately)
        if (!this.supported || this.projectionName === '') this.syncFromAdapter();
    }

    protected onMapAttached(): void {
        this.supported = true; // assume supported until proven otherwise
        this.projectionName = '';
        this.syncFromAdapter();
    }

    private syncFromAdapter(): void {
        if (!this.adapter) return;
        const proj = this.adapter.getProjection();
        if (proj === null) {
            // null = engine definitively doesn't support projections; undefined timing = try again later
            this.supported = false;
            return;
        }
        // Got a valid projection — engine is supported
        this.supported = true;
        this.projectionName = proj.name ?? 'mercator';
        if (proj.center) { this.centerLng = proj.center[0]; this.centerLat = proj.center[1]; }
        if (proj.parallels) { this.parallel1 = proj.parallels[0]; this.parallel2 = proj.parallels[1]; }
    }

    private applyProjection(): void {
        if (!this.adapter) return;
        const def = PROJECTIONS.find(p => p.id === this.projectionName);
        if (def?.conic) {
            this.adapter.setProjection({
                name: this.projectionName,
                center: [this.centerLng, this.centerLat],
                parallels: [this.parallel1, this.parallel2],
            });
        } else {
            this.adapter.setProjection(this.projectionName);
        }
    }

    render(): TemplateResult {
        if (!this.supported) {
            return html`<div class="unsupported">Map projections are not supported by this engine.</div>`;
        }
        const def = PROJECTIONS.find(p => p.id === this.projectionName) ?? PROJECTIONS[0];
        const isConic = def.conic === true;

        return html`
            <label>Projection</label>
            <select @change=${(e: Event) => { this.projectionName = (e.target as HTMLSelectElement).value; this.applyProjection(); }}>
                ${PROJECTIONS.map(p => html`<option value=${p.id} ?selected=${p.id === this.projectionName}>${p.name}</option>`)}
            </select>
            <div class="proj-type">${def.type}</div>
            <img src=${def.image} alt=${def.type}>

            <div class="slider-group ${isConic ? 'visible' : ''}">
                <div class="slider-row"><span>Center longitude</span><strong>${this.centerLng}°</strong></div>
                <input type="range" min="-180" max="180" .value=${String(this.centerLng)}
                    @input=${(e: Event) => { this.centerLng = Number((e.target as HTMLInputElement).value); this.applyProjection(); }}>
            </div>
            <div class="slider-group ${isConic ? 'visible' : ''}">
                <div class="slider-row"><span>Center latitude</span><strong>${this.centerLat}°</strong></div>
                <input type="range" min="-90" max="90" .value=${String(this.centerLat)}
                    @input=${(e: Event) => { this.centerLat = Number((e.target as HTMLInputElement).value); this.applyProjection(); }}>
            </div>
            <div class="slider-group ${isConic ? 'visible' : ''}">
                <div class="slider-row"><span>South parallel</span><strong>${this.parallel1}°</strong></div>
                <input type="range" min="-90" max="90" .value=${String(this.parallel1)}
                    @input=${(e: Event) => { this.parallel1 = Number((e.target as HTMLInputElement).value); this.applyProjection(); }}>
            </div>
            <div class="slider-group ${isConic ? 'visible' : ''}">
                <div class="slider-row"><span>North parallel</span><strong>${this.parallel2}°</strong></div>
                <input type="range" min="-90" max="90" .value=${String(this.parallel2)}
                    @input=${(e: Event) => { this.parallel2 = Number((e.target as HTMLInputElement).value); this.applyProjection(); }}>
            </div>
        `;
    }
}
