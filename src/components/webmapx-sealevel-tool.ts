/**
 * A slider through sea level, from the last glacial maximum to a flooded
 * future.
 *
 * The tool owns the *level*, not the data. It drives one layer whose polygons
 * each carry the sea level at which they connect to the ocean (`flood_level`,
 * built from GEBCO by the coastal zones ETL), and moving the slider only
 * recolours that layer: the geometry is loaded once and never changes, so
 * sliding and playing cost the GPU a repaint and the network nothing.
 *
 * On opening, the layer is rebuilt once into one sublayer per class
 * (`classSubLayers`), each with a constant colour. A move then rewrites only
 * the classes whose colour flips — one per metre of playback — through
 * `updateLayerStyle`, the engine-neutral path the legend's own style editor
 * uses, so the legend follows the slider. Constant paint is applied as a
 * uniform; a data-driven expression would be re-evaluated for every feature
 * of every loaded tile on each move.
 *
 * Everything has a default, so a tool added with nothing but `enabled: true`
 * (which is what the setup page writes) works on any config:
 *
 *   { "type": "sealevel", "layer": "coastal-zones", "min": -134, "max": 70 }
 *
 * A layer already on the map under `layer` is adopted; otherwise the tool
 * lends the map one drawn from `tiles` — the coastal zones archive built and
 * released by github.com/edugis-org/coastal_zones — like the deeptime tool
 * lends its coastlines — or, on an engine that cannot read the archive, from
 * the same zones as one GeoJSON file (`geojson`); nothing else differs.
 * `data` is a sea level curve (see
 * `utils/sea-level-curve.ts`) for the time mode: the slider runs through years
 * instead of metres, and the level at each age is read from the curve. Both
 * are config assets, resolved against the config like every other path.
 *
 *   { "type": "sealevel", "data": "data/sealevel/lambeck2014-approx.json",
 *     "tiles": "../data/coastal_zones.pmtiles",
 *     "geojson": "../data/coastal_zones_16m.geojson" }
 */
import { html, css, type TemplateResult } from 'lit';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import { formLabelStyles } from './internal/form-label-styles';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/radio-group/radio-group.js';
import '@shoelace-style/shoelace/dist/components/radio-button/radio-button.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { customElement, property, state } from 'lit/decorators.js';

import { WebmapxModalTool } from './webmapx-modal-tool';
import { controlSurfaceStyles } from './internal/control-surface-styles';
import { STEP_BACK_ICON, STEP_FORWARD_ICON, PLAY_ICON, PAUSE_ICON, StepRepeater, renderStepButton } from './step-button';
import {
    ROLE_TITLES, classRole, classSubLayerId, classSubLayers, defaultZoneLevels, roleColor,
    type ClassRole, type SeaLevelStyleOptions,
} from '../utils/sea-level-style';
import { curveSpan, parseSeaLevelCurve, seaLevelAt, type SeaLevelCurve } from '../utils/sea-level-curve';
import { sanitizeAbstractHtml } from '../utils/sanitize-html';
import type { WebmapxMapElement } from './webmapx-map';
import type { IMapState } from '../store/IMapState';

/** Metres per second of playback. Slow enough to watch a strait close. */
const SPEEDS = [
    { label: '2 m', perSecond: 2 },
    { label: '5 m', perSecond: 5 },
    { label: '10 m', perSecond: 10 },
    { label: '20 m', perSecond: 20 },
];

/** Years per second of playback in time mode. */
const TIME_SPEEDS = [
    { label: '250 yr', perSecond: 0.25 },
    { label: '500 yr', perSecond: 0.5 },
    { label: '1,000 yr', perSecond: 1 },
    { label: '2,000 yr', perSecond: 2 },
];

/** Time mode steps and snaps to a century: the curve says nothing finer. */
const AGE_STEP_KA = 0.1;
/** A step button in time mode moves five centuries. */
const AGE_NUDGE_KA = 0.5;

/**
 * Named periods, most specific first: the first range holding the age wins.
 * Ages in ka BP, older end first.
 */
const PERIODS: ReadonlyArray<{ from: number; to: number; label: string }> = [
    { from: 14.5, to: 14.0, label: 'Meltwater pulse 1A: about 20 m in 500 years' },
    { from: 9.6, to: 9.4, label: 'The sea passes the Bosporus sill (\u221228 m): the Black Sea connects' },
    { from: 8.4, to: 8.0, label: 'Storegga tsunami; the last of Doggerland drowns' },
    { from: 11.7, to: 11.3, label: 'The Holocene begins' },
    { from: 12.9, to: 11.7, label: 'Younger Dryas cold spell: the rise slows' },
    { from: 14.7, to: 12.9, label: 'B\u00f8lling\u2013Aller\u00f8d warm period' },
    { from: 21.5, to: 20.5, label: 'Last glacial maximum: the lowest sea level, about 134 m below today' },
    { from: 26, to: 19, label: 'Last glacial maximum' },
    { from: 19, to: 11.7, label: 'Deglaciation' },
    { from: 6.5, to: 0, label: 'Sea level close to today\u2019s' },
];

type Mode = 'level' | 'time';

/**
 * The sea level curve, relative to the config. It ships with the configs
 * (webmapx-configs), so a config naming no `data` still gets a time mode.
 */
const DEFAULT_DATA = 'data/sealevel/lambeck2014-approx.json';

/**
 * The coastal zones archive, relative to the config. Too large for the config
 * repository: it is a release asset of edugis-org/coastal_zones, copied to the
 * site's `data/` by the deployment, which sits beside the config directory.
 */
const DEFAULT_TILES = '../data/coastal_zones.pmtiles';

/**
 * The same zones as one GeoJSON file, for an engine that cannot read the
 * archive: at 16' (the archive's z0-1 layer), which is finer than a screen
 * pixel on any world map. Read once into the view's projection, so it also
 * serves the projections vector tiles are costly in. Same release, same place.
 */
const DEFAULT_GEOJSON = '../data/coastal_zones_16m.geojson';

/** Source layer and credit of the archive at DEFAULT_TILES. */
const ZONES_SOURCE_LAYER = 'zones';
const ZONES_ATTRIBUTION = 'Coastal zones: <a href="https://github.com/edugis-org/coastal_zones" target="_blank" rel="noopener">EduGIS</a>, from <a href="https://doi.org/10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa" target="_blank" rel="noopener">GEBCO_2026 Grid</a>';

/** OpenStreetMap's own water and land, so the layer sits on an OSM basemap without a seam. */
const DEFAULT_WATER = '#aad3df';
const DEFAULT_LAND = '#f2efe9';

/** Levels worth a name, shown under the slider when it stands on one. */
const LANDMARKS: ReadonlyArray<{ level: number; label: string }> = [
    { level: -134, label: 'Last glacial maximum, ~21,000 years ago' },
    { level: -60, label: 'About 11,000 years ago' },
    { level: 1, label: 'Upper end of likely projections for 2100 (IPCC AR6)' },
    { level: 7, label: 'Greenland ice sheet melted' },
    { level: 58, label: 'Antarctic ice sheet melted' },
    { level: 65, label: 'All land ice melted' },
];

@customElement('webmapx-sealevel-tool')
export class WebmapxSealevelTool extends WebmapxModalTool {
    readonly toolId = 'sealevel';

    /** The level travels in a permalink, and the tool rebuilds its layer from it. */
    protected get permalinkKey(): string {
        return 'sealevel';
    }

    /** Id of the layer to drive, as named in the config's layers. */
    @property({ type: String }) layer = 'coastal-zones';
    /** Attribute holding the sea level (m) at which a polygon floods. */
    @property({ type: String }) attribute = 'flood_level';
    /** Lowest level the slider reaches, in metres. */
    @property({ type: Number }) min = -134;
    /** Highest level the slider reaches, in metres. */
    @property({ type: Number }) max = 70;
    /** Slider granularity in metres. */
    @property({ type: Number }) step = 1;
    /**
     * The level that counts as today's sea: polygons at or below it are sea
     * now. The coastal zones put today's coastline between zones -1 and 0,
     * zone 0 being land at sea level.
     */
    @property({ type: Number }) today = -1;
    @property({ type: String }) water = DEFAULT_WATER;
    @property({ type: String }) land = DEFAULT_LAND;
    /**
     * The class levels the layer's attribute takes. Unset, the coastal zones
     * ETL's: 5 m steps, 1 m from -1 to +10 m.
     */
    @property({ attribute: false }) levels: number[] | null = null;
    /** Sea level curve for the time mode, a config asset. Empty: no time mode. */
    @property({ type: String }) data: string | null = null;
    /**
     * Coastal zones archive (`.pmtiles`, `pmtiles://` optional), a config
     * asset. Only read when the map does not already show `layer`.
     */
    @property({ type: String }) tiles: string | null = null;
    /**
     * The zones as GeoJSON, a config asset: what the tool lends instead of
     * `tiles` when the engine cannot draw a `pmtiles://` source.
     */
    @property({ type: String }) geojson: string | null = null;

    /** Where the slider stands. Starts at today and outlives the panel. */
    @state() private level: number | null = null;
    @state() private playing = false;
    @state() private speedIndex = 1;
    @state() private error: string | null = null;
    @state() private mode: Mode = 'level';
    @state() private curve: SeaLevelCurve | null = null;
    /** Where the time slider stands, in ka BP. Null until the curve is known. */
    @state() private ageKa: number | null = null;
    @state() private timeSpeedIndex = 2;
    private curveRequested: string | null = null;

    /** The role each class sublayer shows now, so a move writes only what flips. */
    private readonly appliedRoles = new Map<number, ClassRole>();
    private frame: number | null = null;
    private lastFrameAt = 0;
    /** See the deeptime tool: activation can arrive before the map has. */
    private wanted = false;
    private started = false;

    private readonly stepper = new StepRepeater();

    static styles = [formLabelStyles, controlSurfaceStyles, css`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; }
        .level { font-size: 1.5rem; font-weight: 600; line-height: 1.1; font-variant-numeric: tabular-nums; }
        .relative { color: var(--color-text-muted, #666); margin-bottom: 0.25rem; }
        .landmark { color: var(--color-text-secondary, #5a6773); min-height: 1.2em; margin-bottom: 0.5rem; }
        input[type="range"] { width: 100%; }
        .scale { display: flex; justify-content: space-between; color: var(--color-text-muted, #666); font-size: 0.75rem; }
        .controls { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
        .controls .step,
        .controls .play {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 2rem;
            padding: 0.25rem 0.4rem;
            line-height: 0;
            cursor: pointer;
            color: inherit;
            border: 1px solid var(--color-border, #d5dce3);
            border-radius: var(--webmapx-radius-sm, 4px);
            background-color: var(--color-background, #fff);
            touch-action: manipulation;
            -webkit-user-select: none;
            user-select: none;
        }
        .controls .step[disabled], .controls .play[disabled] { opacity: 0.4; cursor: default; }
        .today { margin-left: auto; }
        .legend { display: flex; flex-wrap: wrap; gap: 0.25rem 0.75rem; margin-top: 0.75rem; }
        .legend span { display: inline-flex; align-items: center; gap: 0.35rem; }
        .legend i { width: 0.75rem; height: 0.75rem; border-radius: 2px; display: inline-block; border: 1px solid var(--color-border, #d5dce3); }
        .error { color: var(--color-danger, #b3261e); margin-top: 0.5rem; }
        .modes { display: block; margin-bottom: 0.5rem; }
        .credit { color: var(--color-text-muted, #666); font-size: 0.75rem; margin-top: 0.5rem; }
    `];

    private get mapElement(): (WebmapxMapElement & {
        addLayerRequest: (config: Record<string, unknown>) => Promise<boolean>;
    }) | null {
        return this.mapHost as never;
    }

    protected onActivate(): void {
        this.wanted = true;
        void this.begin();
    }

    protected onMapAttached(adapter: Parameters<WebmapxModalTool['onMapAttached']>[0]): void {
        super.onMapAttached(adapter);
        if (this.wanted) void this.begin();
    }

    protected onDeactivate(): void {
        this.wanted = false;
        this.started = false;
        this.stopPlaying();
        this.stepper.stop();
        // The layer keeps the level it was left at, like the deeptime tool's
        // age: closing the panel is how you get the map back to measure or
        // print what the slider set up. The legend shows the level's classes,
        // and reopening picks up where the slider stood.
    }

    /**
     * Reads `tools.sealevel`. An attribute on the element wins, so a test page
     * can point one instance elsewhere without editing the config.
     */
    private readConfig(): void {
        const tools = this.toolsConfig as Record<string, unknown> | undefined;
        const section = (tools?.[this.instanceId] ?? tools?.[this.toolId]) as Record<string, unknown> | undefined;
        // The defaults are resolved here, whether or not there is a section:
        // the loader only resolves what the config wrote, and a tool placed by
        // the setup page, or directly in HTML, has no section at all.
        if (!this.hasAttribute('data') && this.data === null) this.data = this.resolveConfigAsset(DEFAULT_DATA);
        if (!section) return;
        for (const key of ['layer', 'attribute', 'water', 'land', 'tiles', 'geojson'] as const) {
            if (!this.hasAttribute(key) && typeof section[key] === 'string') this[key] = section[key] as string;
        }
        for (const key of ['min', 'max', 'step', 'today'] as const) {
            if (!this.hasAttribute(key) && typeof section[key] === 'number') this[key] = section[key] as number;
        }
        if (Array.isArray(section.levels) && section.levels.every((v) => typeof v === 'number')) {
            this.levels = [...section.levels as number[]].sort((a, b) => a - b);
        }
        // The loader has already resolved a `data` written in the config.
        if (!this.hasAttribute('data') && typeof section.data === 'string') this.data = section.data;
    }

    /**
     * Fetches the curve once per configured file. A missing or broken curve
     * only means no time mode: the level slider does not need it.
     */
    private async loadCurve(): Promise<void> {
        const url = this.data;
        if (!url || this.curveRequested === url) return;
        this.curveRequested = url;
        try {
            const response = await fetch(url);
            this.curve = response.ok ? parseSeaLevelCurve(await response.json()) : null;
        } catch {
            this.curve = null;
        }
        if (this.curve && this.ageKa === null) this.ageKa = curveSpan(this.curve).oldest;
        if (!this.curve && this.mode === 'time') this.mode = 'level';
    }

    private get classLevels(): number[] {
        return this.levels ?? defaultZoneLevels(this.min, this.max);
    }

    private get styleOptions(): SeaLevelStyleOptions {
        return { attribute: this.attribute, today: this.today, water: this.water, land: this.land };
    }

    private async begin(): Promise<void> {
        if (this.started || !this.adapter || !this.mapElement) return;
        this.started = true;
        this.readConfig();
        this.error = null;
        this.level = this.clamp(this.level ?? this.today);
        void this.loadCurve();

        // A layer already on the map is adopted. Otherwise the tool adds its
        // own, in the format the engine can draw — never a catalog entry of the
        // same name, whose format the config chose without knowing the engine.
        // From then on it is an ordinary layer, and the user's.
        const loaded = this.layer in (this.adapter.store.getState().mapLayers ?? {});
        if (!loaded && !(await this.mapElement.addLayerRequest(this.lentLayerConfig()))) {
            this.error = 'The coastal zones could not be added to the map.';
            return;
        }
        if (!(await this.ensureClassSubLayers())) {
            this.error = `Layer "${this.layer}" cannot be split into sea level classes.`;
            return;
        }
        this.apply();
    }

    /**
     * The layer the tool adds when the config has none: the coastal zones
     * archive, shown at today's level until the classes take over.
     */
    private lentLayerConfig(): Record<string, unknown> {
        const sourceId = `${this.layer}-source`;
        // The same zones either way; which file is the engine's to say. The
        // tool is otherwise identical: both are split into the same classes.
        const tiles = {
            id: sourceId,
            type: 'vector',
            url: `pmtiles://${this.resolveConfigAsset((this.tiles ?? DEFAULT_TILES).replace(/^pmtiles:\/\//, ''))}`,
            attribution: ZONES_ATTRIBUTION,
        };
        const useTiles = this.adapter?.canDrawSource(tiles) ?? true;
        const source = useTiles ? tiles : {
            id: sourceId,
            type: 'geojson',
            data: this.resolveConfigAsset(this.geojson ?? DEFAULT_GEOJSON),
            attribution: ZONES_ATTRIBUTION,
        };
        return {
            id: this.layer,
            type: 'fill',
            source: sourceId,
            ...(useTiles ? { 'source-layer': ZONES_SOURCE_LAYER } : {}),
            sources: { [sourceId]: source },
            paint: {
                'fill-color': ['case', ['<=', ['get', this.attribute], this.today], this.water, 'rgba(0, 0, 0, 0)'],
                'fill-antialias': false,
            },
            title: 'Coastal zones',
            // Rebuilt from the tool's permalink state rather than by id: no
            // catalog knows this layer, and its format depends on the engine.
            metadata: { title: 'Coastal zones', ownerTool: this.permalinkKey },
        };
    }

    /**
     * Rebuilds the layer as one sublayer per class, unless it already is.
     *
     * Reopening the tool, or a layer the tool split before, finds the class
     * sublayers in place; their current colours are read back so the first
     * move writes only what actually changes. A class whose colour matches no
     * role is left unrecorded, and so rewritten.
     */
    private async ensureClassSubLayers(): Promise<boolean> {
        const adapter = this.adapter;
        const sublayers = adapter?.getSubLayers(this.layer);
        if (!adapter || !sublayers?.length) return false;
        const levels = this.classLevels;
        const byId = new Map(sublayers.map((sub) => [sub.id, sub]));
        this.appliedRoles.clear();
        if (levels.every((v) => byId.has(classSubLayerId(this.layer, v)))) {
            const roles: ClassRole[] = ['sea', 'dry', 'today'];
            for (const v of levels) {
                const color = (byId.get(classSubLayerId(this.layer, v))?.paint as Record<string, unknown> | undefined)?.['fill-color'];
                const role = roles.find((r) => roleColor(r, this.styleOptions) === color);
                if (role) this.appliedRoles.set(v, role);
            }
            return true;
        }
        // The first sublayer carries the source; its own styling is replaced.
        const { id: _id, filter: _filter, paint: _paint, layout: _layout, type: _type, ...base } = sublayers[0];
        const level = this.roundedLevel();
        if (!(await adapter.setSubLayers(this.layer, classSubLayers(this.layer, base, levels, level, this.styleOptions)))) {
            return false;
        }
        for (const v of levels) this.appliedRoles.set(v, classRole(v, level, this.today));
        return true;
    }

    private roundedLevel(): number {
        return Math.round((this.level ?? this.today) / this.step) * this.step;
    }

    private clamp(level: number): number {
        return Math.min(Math.max(level, this.min), this.max);
    }

    /**
     * Recolours and retitles the classes whose role differs at the level on
     * the slider. The title is what the legend labels the class by, so the
     * legend reads "Sea" and "Dry sea floor" rather than class levels.
     */
    private apply(): void {
        if (!this.adapter || !this.started) return;
        const level = this.roundedLevel();
        this.publishToolState({
            lv: level,
            ...(this.mode === 'time' && this.ageKa !== null ? { m: 'time', a: Math.round(this.ageKa * 10) / 10 } : {}),
        });
        for (const v of this.classLevels) {
            const role = classRole(v, level, this.today);
            if (this.appliedRoles.get(v) === role) continue;
            const id = classSubLayerId(this.layer, v);
            if (this.adapter.updateLayerStyle(this.layer, id, { 'fill-color': roleColor(role, this.styleOptions) })) {
                this.adapter.setSubLayerMetadata(this.layer, id, { title: ROLE_TITLES[role] });
                this.appliedRoles.set(v, role);
            }
        }
    }

    private setLevel(level: number): void {
        const clamped = this.clamp(level);
        if (clamped === this.level) return;
        this.level = clamped;
        this.apply();
    }

    private nudge(direction: -1 | 1): void {
        if (this.playing) this.stopPlaying();
        this.setLevel(this.roundedLevel() + direction * this.step);
    }

    /**
     * Moves the time slider and sets the map to the curve's level at that age.
     * The curve is relative to present sea level, and the layer's own "today"
     * is where present sea level sits among its classes.
     */
    private setAge(ageKa: number): void {
        if (!this.curve) return;
        const { oldest, youngest } = curveSpan(this.curve);
        this.ageKa = Math.min(Math.max(ageKa, youngest), oldest);
        this.setLevel(this.today + seaLevelAt(this.curve, this.ageKa));
    }

    private nudgeAge(direction: -1 | 1): void {
        if (this.playing) this.stopPlaying();
        this.setAge(Math.round(((this.ageKa ?? 0) + direction * AGE_NUDGE_KA) / AGE_STEP_KA) * AGE_STEP_KA);
    }

    private setMode(mode: Mode): void {
        if (mode === this.mode) return;
        this.stopPlaying();
        this.mode = mode;
        if (mode === 'time' && this.ageKa !== null) this.setAge(this.ageKa);
        this.apply();
    }

    /** Whether the layer has been on the map since the state was last published. */
    private hadLayer = false;

    /**
     * Withdraws the permalink state once the layer is gone: a link made after
     * the user removed it from the legend should not bring it back.
     */
    protected onStateChanged(state: IMapState): void {
        super.onStateChanged(state);
        if (this.layer in (state.mapLayers ?? {})) {
            this.hadLayer = true;
        } else if (this.hadLayer) {
            this.hadLayer = false;
            this.publishToolState(null);
        }
    }

    /**
     * Rebuilds the map a permalink describes: the layer, split into classes, at
     * the level it was shared at — with the panel closed, as the map was when
     * the link was made. `a` is the age in time mode, which needs the curve; if
     * that cannot be read the level alone still shows the right coastline.
     */
    protected applyToolState(state: Record<string, unknown>): void {
        if (typeof state.lv === 'number' && Number.isFinite(state.lv)) this.level = state.lv;
        if (state.m === 'time' && typeof state.a === 'number' && Number.isFinite(state.a)) {
            this.mode = 'time';
            this.ageKa = state.a;
        }
        void this.begin();
    }

    /**
     * Plays the sea rising: from the glacial low stand up to the top, then
     * round again. Rising is the story people come with — the ice melting and
     * the coast moving inland — so it runs that way.
     */
    private togglePlay(): void {
        if (this.playing) return this.stopPlaying();
        if (this.mode === 'time' && this.curve) {
            // Time runs forward, from the glacial maximum to today, and round again.
            const { oldest, youngest } = curveSpan(this.curve);
            if ((this.ageKa ?? youngest) <= youngest) this.setAge(oldest);
            this.run((elapsed) => {
                const next = (this.ageKa ?? oldest) - elapsed * TIME_SPEEDS[this.timeSpeedIndex].perSecond;
                this.setAge(next < youngest ? oldest : next);
            });
            return;
        }
        if ((this.level ?? this.today) >= this.max) this.setLevel(this.min);
        this.run((elapsed) => {
            const next = (this.level ?? this.today) + elapsed * SPEEDS[this.speedIndex].perSecond;
            this.setLevel(next > this.max ? this.min : next);
        });
    }

    /** Calls `advance` every frame with the seconds since the last one, until stopped. */
    private run(advance: (elapsedSeconds: number) => void): void {
        this.playing = true;
        this.lastFrameAt = performance.now();
        const tick = (nowMs: number): void => {
            if (!this.playing) return;
            const elapsed = (nowMs - this.lastFrameAt) / 1000;
            this.lastFrameAt = nowMs;
            advance(elapsed);
            this.frame = requestAnimationFrame(tick);
        };
        this.frame = requestAnimationFrame(tick);
    }

    private stopPlaying(): void {
        this.playing = false;
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        this.frame = null;
    }

    private renderStep(direction: -1 | 1): TemplateResult {
        const level = this.level ?? this.today;
        return renderStepButton({
            icon: direction === -1 ? STEP_BACK_ICON : STEP_FORWARD_ICON,
            label: `${this.step} m ${direction === -1 ? 'lower' : 'higher'}`,
            disabled: direction === -1 ? level <= this.min : level >= this.max,
            step: () => this.nudge(direction),
            repeater: this.stepper,
        });
    }

    private renderPlay(): TemplateResult {
        return html`
            <button type="button" class="play webmapx-control"
                aria-label=${this.playing ? 'Pause' : 'Play'}
                title=${this.playing ? 'Pause' : 'Play'}
                @click=${() => this.togglePlay()}>
                ${this.playing ? PAUSE_ICON : PLAY_ICON}
            </button>`;
    }

    private renderLevelMode(level: number): TemplateResult {
        const delta = level - this.today;
        const landmark = LANDMARKS.find((l) => l.level === level);
        return html`
            <div class="level">${signedMetres(level)}</div>
            <div class="relative">
                ${delta === 0 ? 'Today\u2019s sea level' : `${Math.abs(delta)} m ${delta > 0 ? 'above' : 'below'} today`}
            </div>
            <div class="landmark">${landmark?.label ?? ''}</div>

            <input type="range" aria-label="Sea level in metres"
                min=${this.min} max=${this.max} step=${this.step}
                .value=${String(level)}
                @input=${(e: Event) => {
                    if (this.playing) this.stopPlaying();
                    this.setLevel(Number((e.target as HTMLInputElement).value));
                }}>
            <div class="scale"><span>${signedMetres(this.min)}</span><span>${signedMetres(this.max)}</span></div>

            <sl-select class="speed" size="small" hoist label="Speed"
                .value=${String(this.speedIndex)}
                @sl-change=${(e: Event) => { this.speedIndex = Number((e.target as HTMLSelectElement).value); }}>
                ${SPEEDS.map((speed, index) => html`
                    <sl-option value=${String(index)}>${speed.label} per second</sl-option>`)}
            </sl-select>

            <div class="controls">
                ${this.renderStep(-1)}
                ${this.renderPlay()}
                ${this.renderStep(1)}
                <sl-button size="small" class="today" ?disabled=${level === this.today}
                    @click=${() => { this.stopPlaying(); this.setLevel(this.today); }}>Today</sl-button>
            </div>`;
    }

    private renderTimeMode(curve: SeaLevelCurve): TemplateResult {
        const { oldest, youngest } = curveSpan(curve);
        const age = this.ageKa ?? oldest;
        const period = PERIODS.find((p) => age <= p.from && age >= p.to);
        return html`
            <div class="level">${formatAge(age)}</div>
            <div class="relative">Sea level ${signedMetres(Math.round(seaLevelAt(curve, age)))}</div>
            <div class="landmark">${period?.label ?? ''}</div>

            <!-- Runs from -oldest to -youngest, so the thumb moves the way time does. -->
            <input type="range" aria-label="Thousands of years before present"
                min=${-oldest} max=${-youngest} step=${AGE_STEP_KA}
                .value=${String(-age)}
                @input=${(e: Event) => {
                    if (this.playing) this.stopPlaying();
                    this.setAge(-Number((e.target as HTMLInputElement).value));
                }}>
            <div class="scale"><span>${formatAge(oldest)}</span><span>${formatAge(youngest)}</span></div>

            <sl-select class="speed" size="small" hoist label="Speed"
                .value=${String(this.timeSpeedIndex)}
                @sl-change=${(e: Event) => { this.timeSpeedIndex = Number((e.target as HTMLSelectElement).value); }}>
                ${TIME_SPEEDS.map((speed, index) => html`
                    <sl-option value=${String(index)}>${speed.label} per second</sl-option>`)}
            </sl-select>

            <div class="controls">
                ${renderStepButton({
                    icon: STEP_BACK_ICON, label: `${AGE_NUDGE_KA * 1000} years earlier`,
                    disabled: age >= oldest, step: () => this.nudgeAge(1), repeater: this.stepper,
                })}
                ${this.renderPlay()}
                ${renderStepButton({
                    icon: STEP_FORWARD_ICON, label: `${AGE_NUDGE_KA * 1000} years later`,
                    disabled: age <= youngest, step: () => this.nudgeAge(-1), repeater: this.stepper,
                })}
            </div>
            ${curve.attribution ? html`
                <div class="credit" title=${curve.note ?? ''}>${unsafeHTML(sanitizeAbstractHtml(curve.attribution))}</div>` : ''}`;
    }

    render(): TemplateResult {
        const level = this.roundedLevel();
        const curve = this.mode === 'time' ? this.curve : null;
        return html`
            ${this.curve ? html`
                <sl-radio-group class="modes label-hidden" size="small" label="Slider" .value=${this.mode}
                    @sl-change=${(e: Event) => this.setMode((e.target as HTMLInputElement).value as Mode)}>
                    <sl-radio-button value="level">Level</sl-radio-button>
                    <sl-radio-button value="time">Time</sl-radio-button>
                </sl-radio-group>` : ''}

            ${curve ? this.renderTimeMode(curve) : this.renderLevelMode(level)}

            ${this.error ? html`<div class="error">${this.error}</div>` : ''}

            <div class="legend">
                <span><i style="background:${this.water}"></i>Sea</span>
                ${level < this.today ? html`<span><i style="background:${this.land}"></i>Dry sea floor</span>` : ''}
            </div>
        `;
    }
}

function signedMetres(v: number): string {
    return `${v > 0 ? '+' : v < 0 ? '\u2212' : ''}${Math.abs(v)} m`;
}

/** "14,500 years ago", to the century; "Today" at the present. */
function formatAge(ageKa: number): string {
    const years = Math.round(ageKa * 10) * 100;
    return years === 0 ? 'Today' : `${years.toLocaleString('en-US')} years ago`;
}

declare global {
    interface HTMLElementTagNameMap {
        'webmapx-sealevel-tool': WebmapxSealevelTool;
    }
}
