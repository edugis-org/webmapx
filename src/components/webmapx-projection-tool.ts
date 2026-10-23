import { html, css, TemplateResult, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { formLabelStyles } from './internal/form-label-styles';
import { helpTextStyles } from './internal/help-text-styles';
import { infoToggle } from './internal/info-toggle';
import { engineLabel } from './internal/engine-labels';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import { resolveMapElement } from './internal/map-context';
import type { IMapState } from '../store/IMapState';
import {
    DEFAULT_VIEW_PROJECTION,
    VIEW_PROJECTIONS,
    getViewProjectionDef,
    isRegional,
    latitudeRangeOf,
} from '../utils/view-projections';

/**
 * One control for "how is the world drawn here".
 *
 * There used to be two — a projection picker and a view-mode picker — on the
 * grounds that a projection and a rendering are different things: MapLibre's
 * globe is Web Mercator data drawn on a sphere, not a different coordinate
 * system. True, and no help to anyone: both answered the same question, each
 * was empty on the engines the other served, and a map showed two tools where
 * one of them always said "not supported here".
 *
 * So: one tool, and what it offers is decided by the engine, because that is
 * where the difference actually lives — the adapter lists its views
 * (`getViewProjections`) and this tool only describes them. Today: MapLibre
 * offers Mercator or a globe, OpenLayers the projection catalogue, Cesium a
 * globe and Leaflet Mercator, the last two with nothing to choose.
 *
 * The reason any of it matters is area: Web Mercator inflates it by
 * 1/cos²(latitude), so every world-scale thematic map drawn in it overstates
 * high latitudes — and a globe has no such error at all, which is worth saying
 * next to the choice rather than in a manual.
 */

/** A rendering rather than a coordinate system: same data, drawn on a sphere. */
const GLOBE = 'globe';
/** MapLibre's own name for its flat rendering; not the same as EPSG:3857. */
const MERCATOR_VIEW = 'mercator';

/** Behind the (i) of a projection the browser has to redraw the basemap for. */
const REDRAWN_NOTE = 'In this projection your browser redraws the background map, so it may look softer and its labels less tidy.';

interface ViewOption {
    id: string;
    label: string;
    description: string;
    /** True when sizes on screen can be compared honestly. */
    equalArea: boolean;
    /**
     * Rendering modes go through the map element, which can reinitialise the
     * engine; catalogue projections are applied straight to the adapter.
     */
    rendering: boolean;
}

const GLOBE_OPTION: ViewOption = {
    id: GLOBE,
    label: 'Globe',
    description: 'The Earth as a sphere. Nothing is distorted, because nothing is flattened — but only one side is visible at a time.',
    equalArea: true,
    rendering: true,
};

const MERCATOR_OPTION: ViewOption = {
    id: MERCATOR_VIEW,
    label: 'Mercator (flat)',
    description: 'The usual web map. Shapes and angles are right everywhere, areas are inflated towards the poles.',
    equalArea: false,
    rendering: true,
};

/**
 * Describes the views an engine offers. The engine decides *which* ones
 * (`IMap.getViewProjections`); what they are called and what they do to areas
 * is the same whichever engine draws them, so it lives here.
 */
export function viewOptionsFor(viewIds: readonly string[]): ViewOption[] {
    return viewIds.flatMap((id): ViewOption[] => {
        if (id === GLOBE) return [GLOBE_OPTION];
        if (id === MERCATOR_VIEW) return [MERCATOR_OPTION];
        const projection = VIEW_PROJECTIONS.find((entry) => entry.id === id);
        return projection
            ? [{
                id: projection.id,
                label: projection.label,
                description: projection.description,
                equalArea: projection.equalArea,
                rendering: false,
            }]
            : [];
    });
}

/** "Covers latitudes south of 50°S" — a polar projection is not a world map. */
function coverageLabel(id: string): string {
    const [south, north] = latitudeRangeOf(id);
    const format = (lat: number) => `${Math.abs(Math.round(lat))}°${lat < 0 ? 'S' : 'N'}`;
    if (north >= 89.9) return `Covers latitudes north of ${format(south)}`;
    if (south <= -89.9) return `Covers latitudes south of ${format(north)}`;
    return `Covers ${format(south)} to ${format(north)}`;
}

@customElement('webmapx-projection-tool')
export class WebmapxProjectionTool extends WebmapxBaseTool {
    @state() private selectedId = DEFAULT_VIEW_PROJECTION;
    @state() private engineId = '';
    @state() private viewIds: readonly string[] = [];
    /** null until the engine has said whether it can change anything at all. */
    @state() private supported: boolean | null = null;
    /** True while this tool is applying its own change — see `apply()`. */
    private applyingOwnChange = false;

    static styles = [formLabelStyles, helpTextStyles, css`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; }
        .unsupported { color: var(--color-text-muted, #6b7681); font-style: italic; }
        label { display: block; font-weight: 600; margin-bottom: 0.25rem; }
        sl-select { width: 100%; }
        .fixed { font-weight: 600; }
        .description { margin-top: 0.5rem; }
        .badge {
            display: inline-block;
            margin-top: 0.5rem;
            padding: 0.1rem 0.4rem;
            border-radius: 4px;
            font-size: 0.75rem;
            background: var(--color-surface-sunken, rgba(0, 0, 0, 0.06));
        }
        .badge.equal-area { color: var(--color-success, #1a7f37); }
        .note { margin-top: 0.75rem; }
    `];

    protected onMapAttached(): void {
        this.engineId = this.adapter?.engineId ?? '';
        this.viewIds = this.adapter?.getViewProjections() ?? [];
        this.readProjection(this.adapter?.store.getState().mapProjection);
    }

    protected onStateChanged(state: IMapState): void {
        // `store.mapProjection` is maintained by BaseAdapter and re-dispatched
        // after every successful change — including ones this tool did not make
        // (a story step, say). Its own changes echo back too, and following that
        // echo would let an engine-normalised value fight the control.
        if (this.applyingOwnChange) return;
        this.readProjection(state.mapProjection);
    }

    /** undefined = map still loading, null = engine has no projection support. */
    private readProjection(projection: IMapState['mapProjection']): void {
        if (projection === undefined) return;
        if (projection === null) {
            this.supported = false;
            return;
        }
        this.supported = true;
        const name = projection.name;
        const options = viewOptionsFor(this.viewIds);
        // MapLibre reports 'mercator'/'globe'; OpenLayers reports a projection
        // id. Both arrive on the same channel, so match against this engine's
        // own options rather than assuming which kind it is.
        const known = options.find((option) => option.id === name)
            ?? (getViewProjectionDef(name) ? options.find((o) => o.id === getViewProjectionDef(name)!.id) : undefined);
        if (known) this.selectedId = known.id;
    }

    private apply(id: string): void {
        this.selectedId = id;
        const option = viewOptionsFor(this.viewIds).find((entry) => entry.id === id);
        this.applyingOwnChange = true;
        try {
            if (option?.rendering) {
                // Through the map element: switching MapLibre between flat and
                // globe can need the engine reinitialised, and only the element
                // knows how to save the view and bring it back.
                const mapElement = resolveMapElement(this) as { setProjection?: (name: string) => void } | null;
                if (mapElement?.setProjection) {
                    mapElement.setProjection(id);
                    return;
                }
            }
            if (!this.adapter?.setProjection(id)) {
                // Rejected — show what the map is actually drawing.
                this.readProjection(this.adapter?.getProjection());
            }
        } finally {
            this.applyingOwnChange = false;
        }
    }

    render(): TemplateResult {
        const options = viewOptionsFor(this.viewIds);
        if (options.length === 0) {
            return html`<div class="unsupported">
                How this map is drawn cannot be changed${this.engineId ? html` on the ${engineLabel(this.engineId)} engine` : nothing}.
            </div>`;
        }
        // An engine with one way of drawing the world reports no runtime
        // projection support at all, which is not the same as having nothing to
        // say: Cesium is a globe and Leaflet is Mercator, and *that* is the
        // answer to "how is this map drawn".
        const fixed = options.length === 1;

        const current = options.find((option) => option.id === this.selectedId) ?? options[0];
        const redrawn = !current.rendering && current.id !== DEFAULT_VIEW_PROJECTION;
        const catalogue = getViewProjectionDef(current.id);

        return html`
            ${fixed
                // Nothing to choose is a fact about the engine, not a disabled
                // control: say what it draws and why that is all there is.
                ? html`<div class="fixed">${current.label}</div>`
                : html`<div class="field-with-info"><sl-select id="projection-select" size="small" hoist
                                label="Projection"
                                .value=${current.id}
                                @sl-change=${(e: Event) => this.apply((e.target as HTMLSelectElement).value)}>
                    ${options.map((option) => html`
                        <sl-option value=${option.id}>${option.label}</sl-option>`)}
                  </sl-select>${redrawn ? infoToggle('Projection', REDRAWN_NOTE) : nothing}</div>`}
            <div class="description help-text">${current.description}</div>
            <div class="badge ${current.equalArea ? 'equal-area' : ''}">
                ${current.equalArea ? 'Areas are comparable' : 'Areas are distorted'}
            </div>
            ${catalogue && isRegional(current.id)
                ? html`<div class="badge">${coverageLabel(current.id)}</div>`
                : nothing}
            ${fixed
                ? html`<div class="note help-text">
                    The ${engineLabel(this.engineId)} engine can only draw this projection. To compare
                    projections, switch to OpenLayers in Settings.
                  </div>`
                : nothing}
            ${fixed && redrawn ? html`<div class="note help-text">${REDRAWN_NOTE}</div>` : nothing}
        `;
    }
}
