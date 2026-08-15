import { html, css, TemplateResult, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';
import {
    DEFAULT_VIEW_PROJECTION,
    VIEW_PROJECTIONS,
    getViewProjectionDef,
    isRegional,
    latitudeRangeOf,
} from '../utils/view-projections';

/** "Covers latitudes south of 50°S" — a polar projection is not a world map. */
function coverageLabel(id: string): string {
    const [south, north] = latitudeRangeOf(id);
    const format = (lat: number) => `${Math.abs(Math.round(lat))}°${lat < 0 ? 'S' : 'N'}`;
    if (north >= 89.9) return `Covers latitudes north of ${format(south)}`;
    if (south <= -89.9) return `Covers latitudes south of ${format(north)}`;
    return `Covers ${format(south)} to ${format(north)}`;
}

/**
 * Picks the projection the 2D map is drawn in.
 *
 * Separate from `webmapx-view-mode-tool`, which switches MapLibre between
 * Mercator and its globe — two *renderings* of the same projection family. This
 * tool changes the coordinate system the map is computed in, which only
 * OpenLayers supports, so it says so plainly on the other engines rather than
 * offering a control that does nothing.
 *
 * The reason it exists is area: Web Mercator inflates it by 1/cos²(latitude), so
 * every world-scale thematic map drawn in it overstates high latitudes. The
 * equal-area entries are marked as such, because "which of these can I compare
 * sizes on?" is the only question a student needs answered here.
 */
@customElement('webmapx-projection-tool')
export class WebmapxProjectionTool extends WebmapxBaseTool {
    @state() private projectionId = DEFAULT_VIEW_PROJECTION;
    /** null once the engine has told us it has no runtime projection support. */
    @state() private supported: boolean | null = null;
    @state() private engineId = '';

    static styles = css`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; }
        .unsupported { color: var(--color-text-muted, #6b7681); font-style: italic; }
        label { display: block; font-weight: 600; margin-bottom: 0.25rem; }
        select { width: 100%; padding: 0.25rem; box-sizing: border-box; }
        .description { margin-top: 0.5rem; color: var(--color-text-secondary, #5a6773); }
        .badge {
            display: inline-block;
            margin-top: 0.5rem;
            padding: 0.1rem 0.4rem;
            border-radius: 4px;
            font-size: 0.75rem;
            background: var(--color-surface-sunken, rgba(0, 0, 0, 0.06));
        }
        .badge.equal-area { color: var(--color-success, #1a7f37); }
        .note { margin-top: 0.75rem; font-size: 0.8125rem; color: var(--color-text-secondary, #5a6773); }
    `;

    protected onMapAttached(): void {
        this.engineId = this.adapter?.engineId ?? '';
        this.readProjection(this.adapter?.store.getState().mapProjection);
    }

    protected onStateChanged(state: IMapState): void {
        this.readProjection(state.mapProjection);
    }

    /** undefined = map still loading, null = engine has no projection support. */
    private readProjection(projection: IMapState['mapProjection']): void {
        if (projection === undefined) return;
        if (projection === null) {
            this.supported = false;
            return;
        }
        // MapLibre answers this channel too, with 'mercator'/'globe' — names that
        // are not projections in this list. Treating those as unsupported keeps
        // the two tools from fighting over the same control.
        const known = getViewProjectionDef(projection.name);
        this.supported = known !== undefined;
        if (known) this.projectionId = known.id;
    }

    private apply(id: string): void {
        this.projectionId = id;
        if (!this.adapter?.setProjection(id)) {
            // Rejected by the engine — snap back to what it is actually showing.
            this.readProjection(this.adapter?.getProjection());
        }
    }

    render(): TemplateResult {
        if (this.supported === false) {
            return html`<div class="unsupported">
                Map projections can only be changed on the OpenLayers engine${this.engineId ? html` (this map uses ${this.engineId})` : nothing}.
            </div>`;
        }

        const def = getViewProjectionDef(this.projectionId) ?? VIEW_PROJECTIONS[0];
        return html`
            <label for="projection-select">Map projection</label>
            <select id="projection-select"
                    @change=${(e: Event) => this.apply((e.target as HTMLSelectElement).value)}>
                ${VIEW_PROJECTIONS.map(p => html`
                    <option value=${p.id} ?selected=${p.id === this.projectionId}>${p.label}</option>`)}
            </select>
            <div class="description">${def.description}</div>
            <div class="badge ${def.equalArea ? 'equal-area' : ''}">
                ${def.equalArea ? 'Equal area: sizes are comparable' : 'Areas are distorted'}
            </div>
            ${isRegional(def.id) ? html`<div class="badge">${coverageLabel(def.id)}</div>` : nothing}
            <div class="note">
                Raster and vector tiles are re-projected in the browser, so a background map
                may look softer and labels less tidy than in Web Mercator.
            </div>
        `;
    }
}
