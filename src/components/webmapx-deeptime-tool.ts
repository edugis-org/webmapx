/**
 * The geological clock: a slider through hundreds of millions of years.
 *
 * The tool owns the *time*, not the data. Everything it does is to move
 * `store.deepTimeMa`, and any layer whose source url mentions `{ma}` redraws
 * itself — the same arrangement `{click}` already uses. So a story step can pin
 * an age without this tool being open, a second layer can draw the same age in
 * another way, and the panel stays a slider and a play button.
 *
 * For convenience it also adds a coastline layer of its own when it opens, so
 * that turning the tool on shows something. That layer is inline and removed
 * again on close: this is a view of deep time, not an edit to the map.
 *
 * Configured with the directory the plate model was built into:
 *
 *   { "type": "deeptime", "data": "data/paleo/merdith2021", "to": 400 }
 */
import { html, css, svg, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { WebmapxModalTool } from './webmapx-modal-tool';
import { controlSurfaceStyles } from './internal/control-surface-styles';
import { STEP_BACK_ICON, STEP_FORWARD_ICON, StepRepeater, renderStepButton } from './step-button';
import { loadPlateModelFrom } from '../utils/paleo-coastlines';
import type { WebmapxMapElement } from './webmapx-map';

/**
 * Where the built plate model lives, relative to the *config*.
 *
 * It is a config asset — 4.4 MB of coastlines and rotations that belong to the
 * map being described, not to webmapx — so it sits under the config directory
 * and is shipped with the config. A config naming no `data` gets this, resolved
 * against the config's own location by `resolveConfigAsset`.
 */
const DEFAULT_DATA = 'data/paleo/merdith2021';

/**
 * Who to credit when no config said.
 *
 * Attribution belongs on the *source*, not the layer — that is the rule for
 * every layer type bar a remote style, and it is what the attribution control
 * reads (`getSourceAttribution`). A model named in a config carries its own
 * citation; this covers the tool falling back to `DEFAULT_DATA`, which is
 * Merdith by definition.
 */
/**
 * A citation for one GPlates-served model, written once.
 *
 * Every layer this tool draws is a published rotation model served through the
 * same gateway under the same licence, so the citation differs only in paper
 * and in which part of the model it credits. Spelling it out at each use is how
 * the same credit ends up in four places and drifts in three of them — and a
 * citation that no longer matches its paper is worse than none, since it names
 * the wrong people.
 */
function gplatesCitation(what: string, authors: string, doi: string): string {
    return `${what}: <a href="${doi}" target="_blank" rel="noopener">${authors}</a>, `
        + 'via <a href="https://gwsdoc.gplates.org/" target="_blank" rel="noopener">GPlates Web Service</a> (CC BY 4.0)';
}

const MERDITH_2021 = { authors: 'Merdith et al. 2021', doi: 'https://doi.org/10.1016/j.earscirev.2020.103477' };
const MULLER_2019 = { authors: 'M\u00fcller et al. 2019', doi: 'https://doi.org/10.1029/2018TC005462' };

const MERDITH_COASTLINES = gplatesCitation('Coastlines', MERDITH_2021.authors, MERDITH_2021.doi);
const MULLER_COASTLINES = gplatesCitation('Coastlines', MULLER_2019.authors, MULLER_2019.doi);
const MULLER_PLATES = gplatesCitation('Plate boundaries and deforming networks', MULLER_2019.authors, MULLER_2019.doi);

const DEFAULT_CREDIT = {
    attribution: MERDITH_COASTLINES,
    abstract: 'Present-day coastlines carried back to the chosen age on the plates they ride, using the Merdith et al. (2021) rotation model (1000–0 Ma). The shapes are today\u2019s outlines rotated as rigid blocks: crust that has since been shortened or stretched is not shown, so continents meet later here than the rocks say. Longitude in deep time is far less certain than latitude.',
};

/**
 * The model directory an `internalfunc://paleo-…` url is drawing.
 *
 * A config's own paleo layer names its model in the url's `data` parameter, and
 * that is the only thing that says which model the layer belongs to. Comparing
 * it with the model on show is what keeps one model's plate boundaries from
 * being left over another model's coastlines.
 */
function directoryOf(internalFuncUrl: string): string | null {
    const match = /[?&]data=([^&]*)/.exec(internalFuncUrl);
    return match ? decodeURIComponent(match[1]) : null;
}

/**
 * The models the tool offers when no config lists any.
 *
 * `models` used to come only from a config, so a tool added through the setup
 * page — which writes `{ enabled: true }` and nothing else — offered exactly one
 * model and no way to reach the other, even though both sets of data sit beside
 * the config it is reading. The paths are config assets, resolved against the
 * config's own url exactly as `DEFAULT_DATA` already is, so a configuration
 * that ships the standard plate directories gets both without saying so.
 *
 * A config that lists its own `models` still wins outright: this is a default,
 * not a floor.
 */
const DEFAULT_MODELS: ReadonlyArray<Record<string, unknown>> = [
  {
      id: "merdith2021",
      label: "Merdith 2021 — 1000 Ma",
      data: "data/paleo/merdith2021",
      to: 1000,
      attribution: MERDITH_COASTLINES,
      abstract: "Present-day coastlines carried back to the chosen age on the plates they ride, using the Merdith et al. (2021) rotation model, which reaches 1000 Ma. The shapes are today’s outlines rotated as rigid blocks: crust that has since been shortened or stretched is not shown, so continents meet later here than the rocks say. Latitude is well constrained by palaeomagnetism; longitude in deep time is far less certain.",
  },
  {
      id: "muller2019",
      label: "Müller 2019 — 250 Ma",
      data: "data/paleo/muller2019",
      to: 250,
      plates: "data/paleo/muller2019/plates",
      attribution: MULLER_COASTLINES,
      abstract: "Present-day coastlines rotated to the chosen age using the Müller et al. (2019) model, which reaches 250 Ma and carries deforming plate boundaries. As with any rigid rotation, crust that has since been shortened is missing from the outlines — the deforming zones layer is where that crust is shown.",
      platesAttribution: MULLER_PLATES,
      platesAbstract: "Plate boundaries sampled every 5 Ma, with the deforming networks drawn separately. A boundary has no continuity through time — boundaries are born, die and change in number — so these are snapshots that snap to the nearest step rather than moving smoothly like the coastlines. The deforming zones are continental crust being squeezed: the Greater India mesh is the ~3 million km² now folded into Tibet and the Himalaya, which is why the collision begins here some 45 Ma earlier than reconstructed coastlines suggest.",
  },
];

const LAYER_ID = 'deeptime-coastlines';
const PLATES_SOURCE_ID = 'deeptime-plates-source';
const BOUNDARY_LAYER_ID = 'deeptime-plate-boundaries';
const DEFORMING_LAYER_ID = 'deeptime-deforming';
const SOURCE_ID = 'deeptime-coastlines-source';

/**
 * How fast play runs, in millions of years per second of real time.
 *
 * The slowest is the one worth defending: 5 Ma/s takes 80 seconds to cross the
 * Phanerozoic, which is slow enough to watch the Atlantic open rather than
 * merely note that it did.
 */
const SPEEDS = [
    { label: '5 Ma', perSecond: 5 },
    { label: '10 Ma', perSecond: 10 },
    { label: '25 Ma', perSecond: 25 },
    { label: '50 Ma', perSecond: 50 },
] as const;

/**
 * A colour per present-day landmass.
 *
 * The point of colouring by *today's* continent is that it makes the motion
 * legible: a single ochre mass splitting into Africa and South America says
 * something a uniformly green world cannot. The palette is warm/cool balanced
 * so no continent reads as more important, and every entry is dark enough for
 * white coastline strokes over a pale ocean in either theme.
 */
const CONTINENT_COLORS: Array<[string, string]> = [
    ['Africa', '#c98a3f'],
    ['Asia', '#c2596f'],
    ['Europe', '#7a9e5c'],
    ['North America', '#4f86a8'],
    ['South America', '#b5674c'],
    ['Oceania', '#a87bb0'],
    ['Antarctica', '#8fa3ad'],
];

const UNKNOWN_COLOR = '#96907f';

const PLAY_ICON = svg`<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
    <path d="M4 2.5v11l9-5.5z" fill="currentColor"/>
</svg>`;
const PAUSE_ICON = svg`<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
    <rect x="4" y="2.5" width="3" height="11" fill="currentColor"/>
    <rect x="9" y="2.5" width="3" height="11" fill="currentColor"/>
</svg>`;


/**
 * The periods a reader can navigate by.
 *
 * A slider in millions of years is precise and meaningless — 250 is only a
 * number until it is the end-Permian. Ages are the starts of each period, so
 * the label under the thumb names the world being shown.
 */
const PERIODS: Array<{ name: string; from: number }> = [
    { name: 'Quaternary', from: 2.6 },
    { name: 'Neogene', from: 23 },
    { name: 'Paleogene', from: 66 },
    { name: 'Cretaceous', from: 145 },
    { name: 'Jurassic', from: 201 },
    { name: 'Triassic', from: 252 },
    { name: 'Permian', from: 299 },
    { name: 'Carboniferous', from: 359 },
    { name: 'Devonian', from: 419 },
    { name: 'Silurian', from: 444 },
    { name: 'Ordovician', from: 485 },
    { name: 'Cambrian', from: 539 },
    { name: 'Precambrian', from: Infinity },
];

function periodAt(ma: number): string {
    for (const period of PERIODS) if (ma < period.from) return period.name;
    return 'Precambrian';
}

/** One period's entry in `deeptime-periods.json`. */
interface PeriodScene {
    id: string;
    name: string;
    fromMa: number;
    toMa: number;
    caption: string;
    sprite: { x: number; y: number; w: number; h: number };
}

interface PeriodScenes {
    sprite: string;
    spriteWidth: number;
    spriteHeight: number;
    periods: PeriodScene[];
}

/** File the `scenes` directory is expected to hold. */
const SCENES_FILE = 'deeptime-periods.json';

/** Height the scene is drawn at; its width follows the tile's own proportions. */
const SCENE_HEIGHT = 132;

/**
 * The scene for an age.
 *
 * Ranges run oldest-first and touch at their boundaries, so the search takes
 * the first whose span contains the age — and 0 Ma is "now" rather than the end
 * of the Pleistocene, which is why the youngest entry is allowed to be zero
 * wide.
 */
function sceneAt(scenes: PeriodScenes | null, ma: number): PeriodScene | null {
    if (!scenes) return null;
    for (const period of scenes.periods) {
        if (period.fromMa === 0 && period.toMa === 0) continue;
        if (ma <= period.fromMa && ma > period.toMa) return period;
    }
    // Younger than every range: the present.
    return scenes.periods.find((period) => period.fromMa === 0 && period.toMa === 0)
        ?? scenes.periods[scenes.periods.length - 1]
        ?? null;
}

/**
 * One plate model the tool can show.
 *
 * Models disagree, and that is the point of offering more than one: Africa at
 * 100 Ma sits at 20°E,10°S in Merdith 2021 and at 6°E,17°S in Müller 2019.
 * Each carries its own coastlines as well as its own rotations, because a
 * coastline is tagged with the plate it rides on and plate numbering is the
 * model's own.
 */
interface ModelChoice {
    id: string;
    label: string;
    /** Directory holding `coastlines-present.geojson` and `rotations-<id>.json`. */
    data: string;
    /** Oldest age the model reconstructs, in Ma. */
    to: number;
    /**
     * Directory of plate-boundary snapshots, if the model has them.
     *
     * Only Müller 2019 does here: its topologies carry the deforming networks —
     * the crust that is now Tibet — where Merdith offers boundaries alone.
     */
    plates?: string;
    /** Credit for the model's data, put on the source it feeds. */
    attribution?: string;
    /** What the model is and what it does not show, for the layer info dialog. */
    abstract?: string;
    /** The same two, for the plate-boundary layers, which are a separate dataset. */
    platesAttribution?: string;
    platesAbstract?: string;
}

@customElement('webmapx-deeptime-tool')
export class WebmapxDeeptimeTool extends WebmapxModalTool {
    readonly toolId = 'deeptime';

    /** Directory holding `coastlines-present.geojson` and `rotations-*.json`. */
    @property({ type: String }) data = DEFAULT_DATA;
    /**
     * Directory holding `deeptime-periods.json` and the sprite it names, both
     * config assets: a path relative to the config, like `data`.
     *
     * Unset, the tool shows the period name alone — the scenes are an
     * illustration of the age on the slider, not something it needs to work.
     */
    @property({ type: String }) scenes: string | null = null;
    /** Youngest age the slider reaches, in Ma. */
    @property({ type: Number }) from = 0;
    /**
     * Oldest age the slider reaches, in Ma. Clamped to what the model covers.
     *
     * The whole billion years, which is what Merdith reconstructs. The world
     * does thin out going back — 2068 of 2936 coastline pieces have not formed
     * yet at 1000 Ma, and what remains is cratons and continental shapes rather
     * than coastlines in the modern sense — but that thinning is the state of
     * the evidence, and hiding it behind a shorter slider would misrepresent
     * the model as knowing less than it does.
     */
    @property({ type: Number }) to = 1000;
    /** Slider granularity in Ma. Motion is interpolated, so this is taste, not resolution. */
    @property({ type: Number }) step = 1;

    @state() private ma = 0;
    @state() private playing = false;
    @state() private speedIndex = 1;
    @state() private loading = false;
    @state() private error: string | null = null;
    @state() private models: ModelChoice[] = [];
    /** Whether the plate boundaries are on. Only offered by a model that has them. */
    @state() private showPlates = true;
    /** Set once the user picks from the dropdown; the config no longer decides. */
    private chosenModelId: string | null = null;
    /** The directory the config named, so returning to it can be recognised. */
    private configuredData: string | null = null;
    @state() private periodScenes: PeriodScenes | null = null;
    /** Absolute url of the sprite, resolved against the scenes file that names it. */
    @state() private spriteUrl: string | null = null;
    private scenesRequested: string | null = null;

    private frame: number | null = null;
    private lastFrameAt = 0;
    /**
     * Whether the tool has been switched on, as distinct from whether it has
     * managed to start.
     *
     * A tool written `active` in the markup is activated while its attributes
     * are still being parsed, which is before the map element has resolved an
     * adapter — so the first `onActivate` has no store to dispatch into and no
     * host to add a layer to, and silently does nothing at all. Both entry
     * points therefore set this and call `begin`, which runs once the other
     * half has arrived.
     */
    private wanted = false;
    private started = false;

    private readonly stepper = new StepRepeater();

    static styles = [controlSurfaceStyles, css`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; }
        .age { font-size: 1.5rem; font-weight: 600; line-height: 1.1; }
        .period { color: var(--color-text-muted, #666); margin-bottom: 0.75rem; }
        input[type="range"] { width: 100%; }
        .controls { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
        .models { margin-top: 0.5rem; font-size: 0.8125rem; color: var(--color-text-secondary, #5a6773); }
        .models label { display: flex; align-items: center; gap: 0.4rem; }
        .models select { flex: 1; min-width: 0; }
        /* Play and the two step buttons are one control at different jobs, so
           they are one rule: the house button (webmapx-control, so it picks up
           the active style preset) at the compact size the time slider's play
           button always had — a drawn 2rem box beside it read as heavier than
           the job deserves. */
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
            /* A held button must not also select text or scroll the panel. */
            touch-action: manipulation;
            -webkit-user-select: none;
            user-select: none;
        }
        .controls .step[disabled], .controls .play[disabled] { opacity: 0.4; cursor: default; }
        .per { color: var(--color-text-muted, #666); }
        .legend { display: flex; flex-wrap: wrap; gap: 0.25rem 0.75rem; margin-top: 0.75rem; }
        .legend span { display: inline-flex; align-items: center; gap: 0.35rem; }
        .legend i { width: 0.75rem; height: 0.75rem; border-radius: 2px; display: inline-block; }
        .status { color: var(--color-text-muted, #666); margin-top: 0.5rem; }
        .error { color: var(--color-danger, #b3261e); margin-top: 0.5rem; }
    
        /* The scene sits between the period name and the slider; it is an
           illustration, so it never grows the panel — the image keeps its own
           proportions and the caption wraps under it. */
        .scene {
            margin: 6px 0 2px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }
        .scene-image {
            border-radius: 4px;
            background-repeat: no-repeat;
            max-width: 100%;
        }
        .scene figcaption {
            font-size: 12px;
            line-height: 1.3;
            text-align: center;
            color: var(--color-text-secondary, #5a6773);
        }
`];

    private get mapElement(): (WebmapxMapElement & {
        addLayerRequest: (config: Record<string, unknown>) => Promise<boolean>;
        // Used only when switching models: the layer's source url names the
        // model's directory, so a different model means a different layer.
        removeInlineLayer: (layerId: string) => void;
    }) | null {
        return this.mapHost as never;
    }

    protected onActivate(): void {
        this.wanted = true;
        void this.begin();
    }

    protected onMapAttached(): void {
        if (this.wanted) void this.begin();
    }

    protected onDeactivate(): void {
        this.wanted = false;
        this.started = false;
        this.stopPlaying();
        // A button held while the panel closes would otherwise keep stepping.
        this.stepper.stop();
        // The layer and the age both outlive the panel, the way the 3D tool's
        // terrain does. Closing the tool is how you get the map to itself — to
        // measure the sea between two continents, ask the info tool what a
        // polygon is, or print what is on screen — and taking the coastlines
        // away at that moment removes the very thing you closed the panel to
        // work with. A layer the tool added is an ordinary layer from then on:
        // it sits in the legend, and the user turns it off there if they want
        // it gone.
    }

    /**
     * Loads the model before adding the layer.
     *
     * Order matters only for the first paint: the layer would resolve to an
     * empty world and be redrawn a moment later anyway, but adding it after the
     * data is here means the map never flashes an empty globe.
     */
    /**
     * Reads `tools.deeptime` from the configuration.
     *
     * An attribute written on the element wins, so a test page or an embedding
     * host can point one instance somewhere else without editing the config.
     * Everything else comes from the config section, which is where a tool's
     * settings live in this project (`tools.search`, `tools.buffer`).
     */
    /**
     * Fetches the scene descriptions once per configured directory.
     *
     * Failure is silent on purpose: the scenes illustrate the age, and a map
     * that reconstructs coastlines for a billion years should not report an
     * error, or stop, because a picture is missing.
     */
    private async loadScenes(): Promise<void> {
        const dir = this.scenes;
        if (!dir || this.scenesRequested === dir) return;
        this.scenesRequested = dir;

        const base = this.resolveConfigAsset(dir.endsWith('/') ? dir : `${dir}/`);
        try {
            const response = await fetch(new URL(SCENES_FILE, base).toString());
            if (!response.ok) return;
            const scenes = await response.json() as PeriodScenes;
            if (!Array.isArray(scenes?.periods) || typeof scenes.sprite !== 'string') return;
            // The sprite is named relative to the file naming it, not to the page.
            this.spriteUrl = new URL(scenes.sprite, new URL(SCENES_FILE, base)).toString();
            this.periodScenes = scenes;
        } catch {
            // Left without scenes; the period name still shows.
        }
    }

    private readConfig(): void {
        const tools = this.toolsConfig as Record<string, unknown> | undefined;
        // The instance's own id first, so two instances can be pointed at two
        // models; the tool type second, which is where a single one is configured.
        const section = (tools?.[this.instanceId] ?? tools?.[this.toolId]) as Record<string, unknown> | undefined;

        // The loader resolves a `data` written in the config; the default never
        // appears there, so it is resolved here against the same base — and
        // that has to happen whether or not the tool has a config section at
        // all, since a tool placed directly in HTML has none.
        if (!this.hasAttribute('data')) {
            const configured = typeof section?.data === 'string'
                ? section.data
                : this.resolveConfigAsset(DEFAULT_DATA);
            this.configuredData ??= configured;
            // A model chosen in the dropdown outlives a re-read of the config,
            // which happens on every begin(): without this the tool would snap
            // back to the configured model the moment it reloaded.
            if (!this.chosenModelId) this.data = configured;
        }

        // Same treatment as `data`: the loader resolves what the config wrote,
        // and an attribute on the element wins over both.
        if (!this.hasAttribute('scenes') && typeof section?.scenes === 'string') {
            this.scenes = section.scenes;
        }

        // A config's own list wins; otherwise the built-in one, whose paths are
        // resolved against the config just like `DEFAULT_DATA`.
        const declared: Record<string, unknown>[] = Array.isArray(section?.models)
            ? section.models as Record<string, unknown>[]
            : DEFAULT_MODELS.map((model) => ({
                ...model,
                data: this.resolveConfigAsset(String(model.data)),
            }));
        if (this.models.length === 0) {
            this.models = declared
                .filter((entry) => typeof entry?.data === 'string' && typeof entry?.id === 'string')
                .map((entry) => ({
                    id: String(entry.id),
                    label: String(entry.label ?? entry.id),
                    data: String(entry.data),
                    to: Number.isFinite(Number(entry.to)) ? Number(entry.to) : this.to,
                    // Resolved here, not by the loader: it rewrites paths under a
                    // key called `data`, and this one is called `plates`.
                    ...(typeof entry.plates === 'string'
                        ? { plates: this.resolveConfigAsset(entry.plates) }
                        : {}),
                    ...Object.fromEntries(
                        (['attribution', 'abstract', 'platesAttribution', 'platesAbstract'] as const)
                            .filter((key) => typeof entry[key] === 'string')
                            .map((key) => [key, String(entry[key])]),
                    ),
                }));
            // The configured `data` decides which one starts selected, so a
            // config that already named a directory keeps showing that model.
            const current = this.models.find((m) => m.data === this.data) ?? this.models[0];
            if (current && !this.hasAttribute('data') && !this.chosenModelId) {
                this.data = current.data;
                this.to = current.to;
            }
        }
        void this.loadScenes();

        if (!section) return;
        if (!this.hasAttribute('from') && Number.isFinite(Number(section.from))) this.from = Number(section.from);
        if (!this.hasAttribute('to') && Number.isFinite(Number(section.to))) this.to = Number(section.to);
        if (!this.hasAttribute('step') && Number.isFinite(Number(section.step))) this.step = Number(section.step);
    }

    /** The model on show, when the config offered a choice. */
    private get currentModel(): ModelChoice | undefined {
        return this.models.find((model) => model.data === this.data);
    }

    /**
     * Credit and description for what is being drawn.
     *
     * A config that lists models carries the citation for each, since it also
     * carries the data. With no such list the tool is showing `DEFAULT_DATA`,
     * and credits that.
     */
    private get credit(): { attribution?: string; abstract?: string } {
        const model = this.currentModel;
        if (!model) return DEFAULT_CREDIT;
        return { attribution: model.attribution, abstract: model.abstract };
    }

    /**
     * Adds or removes the plate-boundary layers for the current model.
     *
     * They are the reason to look at a second model at all: reconstructed
     * coastlines put the India–Asia collision in the last few million years,
     * which is out by some 45 Ma, because the crust that closed the gap is now
     * Tibet and no longer has a coastline. The deforming networks are that
     * crust, so they show the collision when it happened.
     *
     * Added by the tool rather than left to the config, because a layer nobody
     * knows to switch on is a layer nobody sees.
     */
    private async applyPlateLayers(): Promise<void> {
        const plates = this.currentModel?.plates;
        const wanted = Boolean(plates) && this.showPlates;

        if (!wanted) {
            for (const id of [DEFORMING_LAYER_ID, BOUNDARY_LAYER_ID]) {
                try { this.mapElement?.removeInlineLayer(id); } catch { /* not there */ }
            }
            return;
        }
        // A config may already draw these; a second copy would only thicken
        // every line.
        if (this.mapHasPlateLayer()) return;

        const url = `internalfunc://paleo-plates?data=${encodeURIComponent(plates as string)}&ma={ma}`;
        const model = this.currentModel;
        const sources = {
            [PLATES_SOURCE_ID]: {
                id: PLATES_SOURCE_ID,
                type: 'geojson',
                data: url,
                ...(model?.platesAttribution ? { attribution: model.platesAttribution } : {}),
            },
        };
        // Both layers read one source, so both are the same dataset; the
        // abstract differs because the two answer different questions.
        const deformingAbstract = model?.platesAbstract;

        await this.mapElement?.addLayerRequest({
            id: DEFORMING_LAYER_ID,
            type: 'fill',
            title: 'Deforming zones',
            source: PLATES_SOURCE_ID,
            sources,
            filter: ['==', ['get', 'deforming'], true],
            paint: { 'fill-color': '#e63946', 'fill-opacity': 0.3, 'fill-outline-color': '#7a1420' },
            metadata: {
                label: 'Deforming zones',
                dynamic: true,
                legendRole: 'overlay',
                ...(deformingAbstract ? { abstract: deformingAbstract } : {}),
            },
        });
        await this.mapElement?.addLayerRequest({
            id: BOUNDARY_LAYER_ID,
            type: 'line',
            title: 'Plate boundaries',
            source: PLATES_SOURCE_ID,
            sources,
            paint: { 'line-color': '#33302b', 'line-width': 1.1, 'line-opacity': 0.85 },
            metadata: {
                label: 'Plate boundaries',
                dynamic: true,
                legendRole: 'overlay',
                ...(deformingAbstract ? { abstract: deformingAbstract } : {}),
            },
        });
    }

    /** Whether something on the map is already drawing plate boundaries. */
    private mapHasPlateLayer(): boolean {
        const layers = this.store?.getState().mapLayers ?? {};
        for (const [layerId, entry] of Object.entries(layers)) {
            if (layerId === BOUNDARY_LAYER_ID || layerId === DEFORMING_LAYER_ID) return true;
            if (entry?.visible === false) continue;
            const sourceId = (entry as { sourceId?: string })?.sourceId;
            if (!sourceId) continue;
            const config = this.adapter?.getSourceConfig?.(sourceId) as { internalFuncUrl?: unknown } | undefined;
            const url = config?.internalFuncUrl;
            if (typeof url === 'string' && url.includes('paleo-plates')) return true;
        }
        return false;
    }

    /**
     * Switches to another plate model.
     *
     * The layer's source url names the model's directory, so the coastlines
     * cannot simply be recomputed — the layer is replaced. A layer the tool did
     * not add is a config's own, still pointing at whichever model that config
     * chose: it is hidden rather than removed while a different model is
     * showing, and comes back when the original is selected again, since two
     * models drawn at once is just two coastlines on top of each other.
     */
    private async switchModel(id: string): Promise<void> {
        const choice = this.models.find((model) => model.id === id);
        if (!choice || choice.data === this.data) return;

        this.stopPlaying();

        // Fetch the new model *before* taking the old one off the map. Its two
        // files are a couple of megabytes, and swapping first left the map
        // empty for as long as they took to arrive — a second or two of blank
        // world, and worse on a slow line. Loading first makes the change look
        // instant, and the second visit is free because the model is cached.
        this.loading = true;
        this.error = null;
        const loaded = await loadPlateModelFrom(choice.data);
        this.loading = false;
        if (!loaded) {
            // Say so and stay where we are: a model that will not load is no
            // reason to leave the map without coastlines.
            this.error = `Could not load ${choice.label}; still showing the previous model.`;
            return;
        }

        this.chosenModelId = choice.id;
        this.data = choice.data;
        this.to = choice.to;
        // A model that does not reach as far back as the age on the slider
        // cannot show it: 300 Ma means nothing to a model that stops at 250.
        this.ma = Math.min(Math.max(this.ma, this.from), this.to);
        this.publish();

        try {
            this.mapElement?.removeInlineLayer(LAYER_ID);
        } catch { /* the tool had not added one */ }
        // The boundaries belong to the model that was showing, and the next one
        // may have none at all.
        for (const id of [DEFORMING_LAYER_ID, BOUNDARY_LAYER_ID]) {
            try { this.mapElement?.removeInlineLayer(id); } catch { /* not there */ }
        }

        // The config's own paleo layers belong to whichever model the config
        // named. Each is shown only while that model is the one on show, so
        // going back to it lets its layer draw again — and, just as important,
        // leaving it takes its plate boundaries off with it.
        this.syncForeignLayers();

        this.started = false;
        await this.begin();
    }

    /**
     * Points the config's own paleo layers at the model on show.
     *
     * A layer the tool did not add belongs to the config, so it is hidden
     * rather than removed — and which one should be showing is decided by the
     * model directory in its source url, not by whether the *coastlines*
     * happen to match. Matching only the coastlines is what left Müller's
     * plate boundaries and deforming zones drawn over Merdith's coastlines:
     * their source is `paleo-plates`, so nothing ever touched them, and the
     * map showed one model's crust moving under another model's continents.
     *
     * A model with no plates of its own therefore hides every plate layer,
     * which is the honest answer — Merdith 2021 ships no boundaries here.
     */
    private syncForeignLayers(): void {
        const layers = this.store?.getState().mapLayers ?? {};
        const wantedCoastlines = this.data;
        const wantedPlates = this.currentModel?.plates ?? null;

        for (const [layerId, entry] of Object.entries(layers)) {
            if (layerId === LAYER_ID || layerId === BOUNDARY_LAYER_ID || layerId === DEFORMING_LAYER_ID) continue;
            const sourceId = (entry as { sourceId?: string })?.sourceId;
            if (!sourceId) continue;
            const config = this.adapter?.getSourceConfig?.(sourceId) as { internalFuncUrl?: unknown } | undefined;
            const url = config?.internalFuncUrl;
            if (typeof url !== 'string') continue;

            const kind = url.includes('paleo-coastlines') ? 'coastlines'
                : url.includes('paleo-plates') ? 'plates'
                : null;
            if (!kind) continue;

            const wanted = kind === 'coastlines' ? wantedCoastlines : wantedPlates;
            this.adapter?.setLayerVisibility(layerId, wanted !== null && directoryOf(url) === wanted);
        }
    }

    private async begin(): Promise<void> {
        if (this.started || !this.store || !this.mapElement) return;
        this.started = true;
        this.readConfig();
        this.loading = true;
        this.error = null;
        const model = await loadPlateModelFrom(this.data);
        this.loading = false;
        if (!model) {
            this.error = `No plate model in ${this.data}. Build one with scripts/build-paleorotations.ts.`;
            return;
        }
        this.to = Math.min(this.to, model.maxAge);
        // Reopening picks up the age the map already stands at, since closing
        // the panel leaves it alone. Only when nothing has set one does this
        // fall back to the tool's own starting age.
        const standing = this.store.getState().deepTimeMa;
        if (standing !== null && standing !== undefined) this.ma = standing;
        this.ma = Math.min(Math.max(this.ma, this.from), this.to);
        this.publish();

        // Adopt whatever is already drawing these coastlines, and otherwise add
        // one. The layer is an ordinary catalog entry either way — any config
        // can name the same computed source — so a second identical layer would
        // just draw every coastline twice. Both kinds follow the map's clock
        // through the `{ma}` in their source url, which is why an adopted layer
        // needs nothing further from the tool.
        // A config's paleo layers are declared visible whatever model is on
        // show, so they are reconciled at the start as well as on a switch:
        // deeptime.json turns its plate boundaries on and names Merdith as the
        // starting model, and Merdith has no boundaries — the map opened with
        // one model's crust under another model's continents.
        //
        // Only when the config offered a choice of models. With no choice there
        // is nothing to be out of step with, and a config that draws plates
        // without naming models means to draw them.
        if (this.models.length > 0) this.syncForeignLayers();

        await this.applyPlateLayers();

        if (this.mapHasPaleoLayer()) return;
        await this.mapElement?.addLayerRequest(this.layerConfig());
    }

    /**
     * Whether some layer already on the map is drawing reconstructed coastlines.
     *
     * Asked of the *sources* rather than of the layer ids, because a config is
     * free to call its layer anything; what it cannot do is draw this without a
     * source whose url names the generator.
     */
    private mapHasPaleoLayer(): boolean {
        const layers = this.store?.getState().mapLayers ?? {};
        for (const entry of Object.values(layers)) {
            // A hidden layer draws nothing, so it is not "already drawing
            // these coastlines" — this is how choosing another model works:
            // the config's own layer is turned off and the tool supplies one
            // for the model that was asked for.
            if (entry?.visible === false) continue;
            const sourceId = entry?.sourceId;
            if (!sourceId) continue;
            const config = this.adapter?.getSourceConfig?.(sourceId) as { internalFuncUrl?: unknown } | undefined;
            const url = config?.internalFuncUrl;
            if (typeof url === 'string' && url.includes('paleo-coastlines')) return true;
        }
        return false;
    }

    /**
     * The coastline layer.
     *
     * `{ma}` rather than a number, so the layer follows the store instead of
     * being rewritten each time the slider moves: redrawing is then the
     * adapter's ordinary computed-source path, identical for every engine.
     */
    private layerConfig(): Record<string, unknown> {
        const url = `internalfunc://paleo-coastlines?data=${encodeURIComponent(this.data)}&ma={ma}`;
        return {
            id: LAYER_ID,
            type: 'fill',
            source: SOURCE_ID,
            sources: {
                [SOURCE_ID]: {
                    id: SOURCE_ID,
                    type: 'geojson',
                    data: url,
                    // On the source, not the layer: that is where every layer
                    // type bar a remote style keeps it, and where the
                    // attribution control looks.
                    ...(this.credit.attribution ? { attribution: this.credit.attribution } : {}),
                },
            },
            paint: {
                // Land is drawn opaque and the sea is left as whatever the map
                // already shows. Translucent land over a modern basemap would
                // put today's coastline through the middle of Pangaea, which is
                // the one thing this layer must not suggest.
                'fill-color': [
                    'match',
                    ['get', 'continent'],
                    ...CONTINENT_COLORS.flatMap(([name, color]) => [name, color]),
                    UNKNOWN_COLOR,
                ],
                'fill-opacity': 1,
                'fill-outline-color': '#33302b',
            },
            metadata: {
                label: 'Palaeo-coastlines',
                dynamic: true,
                legendRole: 'overlay',
                ...(this.credit.abstract ? { abstract: this.credit.abstract } : {}),
            },
        };
    }

    /** Hands the age to the store, which is what actually redraws anything. */
    private publish(): void {
        this.store?.dispatch({ deepTimeMa: this.ma }, 'UI');
    }

    /**
     * One step of the slider's own interval, older or younger.
     *
     * The slider already does this from the arrow keys, but only once it has
     * focus — and on touch there are no arrow keys, while tapping the track to
     * focus it jumps the age to wherever the tap landed. So the step is offered
     * as a control of its own, which is also the only way to reach an exact age
     * with a finger.
     *
     * Stepping stops playback: the two are the same instruction at different
     * speeds, and a step swallowed by the animation half a frame later looks
     * like the button is broken.
     */
    private nudge(direction: -1 | 1): void {
        if (this.playing) this.togglePlay();
        this.setAge(this.ma + direction * this.step);
    }

    private setAge(ma: number): void {
        const clamped = Math.min(Math.max(ma, this.from), this.to);
        if (clamped === this.ma) return;
        this.ma = clamped;
        this.publish();
    }

    /**
     * Plays history forwards: from the deep past towards the present.
     *
     * The direction is the whole point. Continents drifting *apart* into the
     * world we know is the story; running it backwards from today is a rewind,
     * and reads as one. So the age counts down, and pressing play at the present
     * — where there is nothing left to run — starts again from the far end
     * rather than doing nothing.
     */
    private togglePlay(): void {
        if (this.playing) return this.stopPlaying();
        if (this.ma <= this.from) this.setAge(this.to);
        this.playing = true;
        this.lastFrameAt = performance.now();

        const tick = (nowMs: number): void => {
            if (!this.playing) return;
            const elapsed = (nowMs - this.lastFrameAt) / 1000;
            this.lastFrameAt = nowMs;
            const next = this.ma - elapsed * SPEEDS[this.speedIndex].perSecond;
            // Round again at the present rather than stopping dead: the cycle is
            // what makes the motion legible, and a slider parked at 0 with a
            // dead play button invites nothing.
            this.setAge(next < this.from ? this.to : next);
            this.frame = requestAnimationFrame(tick);
        };
        this.frame = requestAnimationFrame(tick);
    }

    private stopPlaying(): void {
        this.playing = false;
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        this.frame = null;
    }

    /**
     * The scene for the age on the slider, drawn straight out of the sprite.
     *
     * A background-position crop rather than 15 separate files: one request,
     * and no flicker when the slider crosses a boundary, because the image is
     * already there. Sizes are computed from the tile's own rectangle, since
     * the tiles are not a uniform grid — the source chart's panels are 142 to
     * 231 px wide.
     */
    private renderScene(scene: PeriodScene | null): TemplateResult | typeof nothing {
        if (!scene || !this.spriteUrl || !this.periodScenes) return nothing;

        const scale = SCENE_HEIGHT / scene.sprite.h;
        const style = [
            `width:${Math.round(scene.sprite.w * scale)}px`,
            `height:${SCENE_HEIGHT}px`,
            `background-image:url("${this.spriteUrl}")`,
            `background-size:${Math.round(this.periodScenes.spriteWidth * scale)}px ${Math.round(this.periodScenes.spriteHeight * scale)}px`,
            `background-position:-${Math.round(scene.sprite.x * scale)}px -${Math.round(scene.sprite.y * scale)}px`,
        ].join(';');

        return html`
            <figure class="scene">
                <div class="scene-image" role="img" style=${style}
                     aria-label=${`${scene.name}: ${scene.caption}`}></div>
                <figcaption>${scene.caption}</figcaption>
            </figure>
        `;
    }

    /**
     * A step button. `direction` is in millions of years, so +1 is *older* —
     * the opposite of the slider's own axis, which counts towards the present.
     */
    private renderStep(direction: -1 | 1, icon: TemplateResult<2>, sense: 'earlier' | 'later'): TemplateResult {
        return renderStepButton({
            icon,
            label: `${this.step} million years ${sense}`,
            disabled: direction === 1 ? this.ma >= this.to : this.ma <= this.from,
            step: () => this.nudge(direction),
            repeater: this.stepper,
        });
    }

    render(): TemplateResult {
        const scene = sceneAt(this.periodScenes, this.ma);
        return html`
            <!-- "0.0 Ma" is a true but graceless way to say "now". -->
            <div class="age">${this.ma < 0.05 ? 'Present day' : `${this.ma.toFixed(1)} Ma ago`}</div>
            <div class="period">${scene?.name ?? periodAt(this.ma)}</div>
            ${this.renderScene(scene)}

            <!-- Runs from -1000 to 0, so the thumb moves the way time does:
                 right is towards the present, and the far left is the deep past.
                 The age itself stays positive everywhere else, because "200 Ma"
                 already means 200 million years *ago* — the sign is a property
                 of this control, not of the data. -->
            <input type="range" aria-label="Millions of years before present"
                min=${-this.to} max=${-this.from} step=${this.step}
                .value=${String(-this.ma)}
                @input=${(e: Event) => this.setAge(-Number((e.target as HTMLInputElement).value))}>

            ${this.currentModel?.plates ? html`
                <div class="models">
                    <label>
                        <input type="checkbox" .checked=${this.showPlates}
                            @change=${(e: Event) => {
                                this.showPlates = (e.target as HTMLInputElement).checked;
                                void this.applyPlateLayers();
                            }}>
                        Plate boundaries
                    </label>
                </div>` : ''}

            ${this.models.length > 1 ? html`
                <div class="models">
                    <label>
                        Model
                        <select aria-label="Plate model"
                            @change=${(e: Event) => void this.switchModel((e.target as HTMLSelectElement).value)}>
                            ${this.models.map((model) => html`
                                <option value=${model.id} ?selected=${model.data === this.data}>
                                    ${model.label}
                                </option>`)}
                        </select>
                    </label>
                </div>` : ''}

            <!-- Step, play, step: the transport row of a media player, and it
                 reads the same way here — back is towards the deep past, which
                 is also leftwards on the slider above. -->
            <div class="controls">
                ${this.renderStep(1, STEP_BACK_ICON, 'earlier')}
                <button type="button" class="play webmapx-control"
                    aria-label=${this.playing ? 'Pause' : 'Play'}
                    title=${this.playing ? 'Pause' : 'Play'}
                    @click=${() => this.togglePlay()}>
                    ${this.playing ? PAUSE_ICON : PLAY_ICON}
                </button>
                ${this.renderStep(-1, STEP_FORWARD_ICON, 'later')}
                <select aria-label="Millions of years per second"
                    @change=${(e: Event) => { this.speedIndex = Number((e.target as HTMLSelectElement).value); }}>
                    ${SPEEDS.map((speed, index) => html`
                        <option value=${index} ?selected=${index === this.speedIndex}>${speed.label}</option>`)}
                </select>
                <span class="per">per second</span>
            </div>

            ${this.loading ? html`<div class="status">Loading the plate model…</div>` : ''}
            ${this.error ? html`<div class="error">${this.error}</div>` : ''}

            <div class="legend">
                ${CONTINENT_COLORS.map(([name, color]) => html`
                    <span><i style="background:${color}"></i>${name}</span>`)}
            </div>
        `;
    }
}
