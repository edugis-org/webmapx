/**
 * The layer styling panel.
 *
 * One decision at a time, and every answered decision **collapses into a row
 * that can be reopened** — which is what makes it steps without being a wizard:
 * going back does not unwind what came after it, because the whole panel is one
 * component holding one state object (see `docs/developer/layer-style-ui.md`).
 *
 * Every change is applied to the map immediately. Styling is judged by looking
 * at the map, not at the form, so there is no "apply" button — only "reset",
 * which puts the layer back to the paint it had when the panel opened.
 *
 * What it writes is a paint spec, never data: the classification reads the
 * features, the map draws them differently, and the dataset is untouched.
 */
import { LitElement, css, html, nothing, svg, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { controlSurfaceStyles } from './internal/control-surface-styles';
import {
    classifyCategorical,
    classifyNumeric,
    histogram,
    numericValues,
    suggestSchemeType,
    type CategoricalClassification,
    type ClassificationMethod,
    type NumericClassification,
} from '../utils/classification';
import { colorSchemesFor, maxClassesFor, type ColorScheme, type SchemeType } from '../utils/color-schemes';
import {
    buildCategoricalStyle,
    buildKeyedColorStyle,
    buildIndexedColorStyle,
    buildCyclicCategoricalStyle,
    buildNumericStyle,
    buildProportionalRadius,
    buildSingleStyle,
    proportionalRadiusLegend,
    ROLE_COLOR_KEY,
    ROLE_SIZE,
    type StyleRole,
} from '../utils/style-builder';
import { colorByAdjacency, coloringKeyFor, coloringKeyValue } from '../utils/topological-coloring';
import { createColorPicker } from './internal/color-picker';
import type Pickr from '@simonwep/pickr';
import { DATA_OUTLINE, DATA_START } from '../theme/data-colors';
import { EXTRA_SUBLAYER_SUFFIX } from '../map/base-adapter';
import { fetchWmsStyles, readWmsSource, withWmsStyleUrl, type WmsSourceInfo, type WmsStyleOption } from '../utils/wms-source';

export interface LayerStyleTarget {
    id: string;
    type: string;
    /** The sublayer's authored paint, so "reset" has something to go back to. */
    paint?: Record<string, unknown>;
}

/** What a numeric column looks like, for the line under its name. */
interface AttributeStats {
    min: number;
    max: number;
    median: number;
    mean: number;
    /** True when every value is a whole number, which is what makes "unique" meaningful. */
    whole: boolean;
}

export interface SourceAttributeInfo {
    name: string;
    type: string;
    values: unknown[];
    presentCount: number;
    missingCount: number;
}

export interface SourceStyleGroup {
    sourceId: string;
    featureCountLabel: string;
    featureCount: number | null;
    geometryTypes: string[];
    attributes: SourceAttributeInfo[];
    featureRows: Record<string, unknown>[];
    layers: LayerStyleTarget[];
    /** The features themselves — what a classification is computed from. */
    features?: GeoJSON.Feature[] | null;
    /**
     * False when the features are only what the map has drawn (a tiled source),
     * which changes the answer as the user pans. Same convention as the Analysis
     * tool's viewport warning.
     */
    completeData?: boolean;
    /** The vector-tile sublayer these targets read, when the source is tiled. */
    sourceLayer?: string;
    /**
     * The source's own config as the map holds it. A labels layer over a tiled
     * source re-declares this rather than copying features, so the labels are
     * drawn from the tiles themselves and stay put while the user pans.
     */
    sourceConfig?: Record<string, unknown> | null;
}

/**
 * Applies a paint change to one sublayer of the layer being styled, and says
 * whether the engine took it. `false` means the sublayer is described in the
 * store but is not on the map — a style that silently does nothing is the worst
 * outcome, since the user blames their own choices.
 */
export type StyleApply = (subLayerId: string, paint: Record<string, unknown>) => boolean | void;

/**
 * Adding and removing a layer of its own — what labels need.
 *
 * Labels are a second sublayer over the same features, and the shortest honest
 * way to get one on every engine is a small layer alongside the styled one: it
 * appears in the legend, can be switched off, and is removed with the same
 * button. Attaching a sublayer to an existing logical layer instead would need
 * engine-specific plumbing in all four adapters.
 */
export interface LayerHost {
    add: (config: Record<string, unknown>) => Promise<boolean> | boolean;
    remove: (layerId: string) => void;
    /**
     * Attaches a sublayer to a layer, or removes it again with `null`. This is
     * how labels reach the map: as part of the layer they belong to.
     */
    setExtraSubLayer?: (layerId: string, sublayer: Record<string, unknown> | null) => Promise<boolean>;
}

export interface StyleDialogContext {
    title: string;
    /** Names the labels layer, and is the caller's own bookkeeping otherwise. */
    layerId: string;
    groups: SourceStyleGroup[];
    apply?: StyleApply;
    /** Lets the panel put a labels layer on the map. Omitted: no labels step. */
    layers?: LayerHost;
    /**
     * Samples the source again. A tiled layer has nothing to offer until its
     * tiles have arrived, and the panel is usually opened before that: without
     * this it shows "no features are loaded" for good and the user has to close
     * it and try again.
     */
    resample?: () => Promise<SourceStyleGroup[]>;
    /**
     * What the layer is made of, when it is not something with features.
     *
     * A raster layer has no paint to build an expression from — it arrives as
     * finished pictures — so the panel asks a different question of it, and
     * needs the source itself to know which question that is.
     */
    raster?: RasterStyleTarget;
    /** Lets the panel repoint a raster source and set the layer's opacity. */
    sourceControl?: SourceControl;
    /** The styled layer's extent, inherited by a labels layer made from it. */
    bounds?: number[];
    /**
     * Rewrites a source's features, for a colouring the data has to carry.
     *
     * Only a source the app holds whole — a `geojson` one — can be rewritten;
     * a tiled source's properties live on a server. Absent, or returning false,
     * means the panel falls back to keying on a column the data already has.
     */
    writeFeatures?: (sourceId: string, features: GeoJSON.Feature[]) => boolean;
}

export interface RasterStyleTarget {
    sourceId: string;
    sourceConfig: Record<string, unknown> | null;
}

export interface SourceControl {
    /** Returns false when the engine cannot repoint a live source. */
    setTiles: (sourceId: string, tiles: string[]) => boolean;
    /** The urls the engine is currently requesting, when it can say. */
    getTiles?: (sourceId: string) => string[] | null;
    setLayerOpacity: (opacity: number) => void;
}

/**
 * Property the neighbour colouring writes its class index into.
 *
 * Named to be recognisable as machinery rather than data if it is ever seen in
 * an info popup or an export: it is not a fact about the region, it is which of
 * six colours this run of the algorithm gave it.
 */
const NEIGHBOUR_COLOR_FIELD = '__webmapx_neighbour_class';

/** What a circle layer shows an attribute with. */
type CircleShow = 'color' | 'size' | 'both';

/** The biggest circle a proportional-symbol map draws, in pixels. */
const MAX_BUBBLE_RADIUS = 28;

/** How a layer is coloured. The three answers to "colour by what?". */
type ColorMode = 'single' | 'attribute' | 'neighbours';

const METHOD_LABELS: Record<ClassificationMethod, string> = {
    naturalBreaks: 'Natural breaks',
    quantile: 'Equal count',
    geometric: 'Each class a step bigger',
    equalInterval: 'Equal intervals',
    standardDeviation: 'Standard deviation',
    manual: 'Manual',
};

const METHOD_HINTS: Record<ClassificationMethod, string> = {
    naturalBreaks: 'Puts the boundaries where the data has gaps. A good first choice.',
    quantile: 'Every class holds the same number of features. Always a full-looking map.',
    geometric: 'Each class covers a multiple of the one below. For data with a long tail.',
    equalInterval: 'Classes of equal width. Honest, but skewed data crowds into one class.',
    standardDeviation: 'Distance from the average. For data spread evenly around a middle.',
    manual: 'Type the boundaries yourself.',
};

/**
 * When one class holds this much of the layer, the map is one colour with a few
 * specks and the method chosen is not telling the student anything.
 */
const CROWDED_CLASS_SHARE = 0.8;

/** Layer types this panel can colour, mapped to what they mean to a user. */
const ROLE_OF_TYPE: Record<string, StyleRole> = {
    fill: 'fill',
    line: 'line',
    circle: 'circle',
    symbol: 'label',
};

const ROLE_LABELS: Record<StyleRole, string> = {
    fill: 'Areas',
    outline: 'Outlines',
    line: 'Lines',
    circle: 'Points',
    label: 'Labels',
};

/** How often, and for how long, the panel looks again for a tiled source's features. */
const RESAMPLE_INTERVAL_MS = 700;
const RESAMPLE_ATTEMPTS = 30;

/** Text size a label starts at, in pixels. */
const DEFAULT_LABEL_SIZE = 12;

const DEFAULT_CLASS_COUNT = 5;
const DEFAULT_MAX_CATEGORIES = 8;

/**
 * Colours a neighbour colouring may be spread over. Four is the floor because
 * that is what a map of areas generally needs; more is a matter of taste, and a
 * twelve-colour map of municipalities reads as variety rather than as a scheme.
 */
const MIN_NEIGHBOUR_COLORS = 4;
const MAX_NEIGHBOUR_COLORS = 12;

@customElement('webmapx-layer-style-dialog')
export class WebmapxLayerStyleDialog extends LitElement {
    @state() private dialogTitle = 'Layer style';
    @state() private groups: SourceStyleGroup[] = [];

    // ── The one state object the steps read and write ────────────────────────
    @state() private targetId: string | null = null;
    @state() private mode: ColorMode | null = null;
    @state() private field: string | null = null;
    @state() private method: ClassificationMethod = 'naturalBreaks';
    @state() private classCount = DEFAULT_CLASS_COUNT;
    /**
     * Rounds the boundaries of whatever method is chosen. On by default: a
     * legend of "0-20, 20-40" is what a student can read, and no method
     * produces those numbers on its own.
     */
    @state() private roundedBreaks = true;
    /**
     * Whether the "how should the numbers be divided" step is open. Unlike the
     * other steps it always has an answer, so it needs its own flag rather than
     * a null value to know whether to show itself.
     */
    @state() private methodOpen = true;
    /**
     * For circles: whether the attribute is shown as colour, as size, or both.
     * A quantity drawn as a circle is usually better read from its area than
     * from a colour ramp, and both together is the classic proportional
     * choropleth — so the question is asked rather than assumed.
     */
    @state() private circleShow: CircleShow = 'color';
    /** Outline of a single-coloured circle: a fill alone reads as a blob. */
    @state() private strokeColor = DATA_OUTLINE;
    @state() private strokeWidth = 1;
    /**
     * Whether the colour-scheme list is open. Like the method step it always
     * has an answer (a scheme is picked for you), and like it the list is long
     * — leaving both open is what pushed the legend off the bottom of the panel.
     */
    @state() private schemeOpen = true;
    @state() private maxCategories = DEFAULT_MAX_CATEGORIES;
    /**
     * Give every value a colour, repeating them, rather than lumping the tail
     * into "other". `null` is "nobody has said", which is decided by the data.
     */
    @state() private cycleCategories: boolean | null = null;
    @state() private neighbourColors = MIN_NEIGHBOUR_COLORS;
    /**
     * Line width, circle radius or text size, depending on the role — null until
     * the panel has read the layer's own. Unlike colour and opacity this one is
     * *inherited*: a 1px border and a 6px one are different maps, and starting
     * every line at some default would silently rewrite the layer's design.
     */
    @state() private size: number | null = null;
    @state() private labelField: string | null = null;
    @state() private labelSize = DEFAULT_LABEL_SIZE;
    @state() private labelColor = DATA_OUTLINE;
    @state() private schemeName: string | null = null;
    @state() private reversed = false;
    @state() private blindSafe = false;
    /**
     * Starts at the colour the layer is drawn with, not at a default: opening
     * the panel must not be a change. Only a layer whose colour cannot be read
     * at all falls back to the data-colour constant.
     */
    @state() private singleColor = DATA_START;
    /**
     * Always starts at full strength, and returns there whenever the kind of
     * colouring changes. Inheriting the layer's authored opacity — world
     * countries is drawn at 0.2 — meant every ramp chosen afterwards was drawn
     * at a fifth of the colours it was picked from, which reads as the ramp
     * being wrong rather than as the layer being faint.
     */
    @state() private opacity = 1;
    /** True while the panel is waiting for the layer to answer with its features. */
    @state() private loadingGroups = false;
    @state() private showTable = false;
    @state() private message: string | null = null;

    // ── The raster branch ────────────────────────────────────────────────────
    /** The named styles the WMS service advertises; null until they are read. */
    @state() private wmsStyles: WmsStyleOption[] | null = null;
    @state() private wmsStyle = '';
    @state() private wmsLoading = false;
    @state() private rasterOpacity = 1;

    private applyStyle: StyleApply | null = null;
    private layerHost: LayerHost | null = null;
    private resample: (() => Promise<SourceStyleGroup[]>) | null = null;
    /** One classification per method for the current field/class count, for the bars. */
    private methodPreviewCache: { key: string; results: Map<ClassificationMethod, NumericClassification | null> } | null = null;
    private statsCache = new WeakMap<SourceAttributeInfo, AttributeStats | null>();
    private raster: RasterStyleTarget | null = null;
    private writeFeatures: ((sourceId: string, features: GeoJSON.Feature[]) => boolean) | null = null;
    /** Set once a neighbour colouring has been written into the data. */
    private neighbourField: string | null = null;
    private styledLayerBounds: number[] | null = null;
    private sourceControl: SourceControl | null = null;
    private resampleTimer: ReturnType<typeof setInterval> | null = null;
    /** Paint each sublayer had when the panel opened, for "reset". */
    private originalPaint = new Map<string, Record<string, unknown>>();
    /**
     * The Pickr and the button it is anchored to. Pickr positions its popup
     * against that element, so an instance kept across a re-render ends up
     * measuring a node that is no longer in the document — and a detached node
     * has no position, which is why the popup appeared in the top-left corner.
     */
    private picker: { instance: Pickr; button: HTMLElement } | null = null;
    private labelPicker: { instance: Pickr; button: HTMLElement } | null = null;
    private strokePicker: { instance: Pickr; button: HTMLElement } | null = null;
    private labelsAdded = false;
    private styledLayerId = '';

    /** Reflected so the host can be shown/hidden by CSS alone. */
    @property({ type: Boolean, reflect: true }) visible = false;
    /** Where the panel has been dragged to, kept between openings. */
    @state() private position: { x: number; y: number } | null = null;
    private drag: { pointerId: number; dx: number; dy: number } | null = null;

    static styles = [controlSurfaceStyles, css`
        /*
         * A floating panel rather than a modal dialog. Styling is judged by
         * looking at the map, so the map has to stay both visible and usable —
         * a modal's overlay swallows every pan and zoom, and the panel sits over
         * exactly the part of the map being restyled. Dragging it by its header
         * is the rest of that answer.
         */
        :host { display: none; }
        :host([visible]) { display: block; }

        .panel {
            position: fixed;
            left: 50%;
            /* left:50% puts the panel's *left edge* on the centre line, not
               its middle, so without this the panel hangs off the right of the
               map by half its width — 147px of a 562px panel in an 830px frame,
               with the buttons on that side unreachable. The drag handler
               replaces this with an explicit left/top and turns the transform
               off, so the two never both apply. */
            transform: translateX(-50%);
            top: 3rem;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            width: min(560px, 96vw);
            max-height: min(80vh, 46rem);
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--webmapx-radius-md, 0.5rem);
            background: var(--color-surface, #fff);
            /* --color-text does not exist; the token is --color-text-primary.
               The misspelling fell back to this literal, which is a dark grey,
               so the panel's title and its close button were dark-on-dark and
               effectively invisible in dark mode. */
            color: var(--color-text-primary, #16202a);
            box-shadow: 0 10px 30px rgb(0 0 0 / 0.25);
        }
        .panel-head {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.6rem;
            border-bottom: 1px solid var(--color-border-light, #e2e7ec);
            /* Tinted so the handle reads as a bar to take hold of rather than as
               the first line of the panel. The panel can be dragged, and a
               cursor that only appears once you are already over it tells you
               nothing while you are deciding whether to try. */
            background: var(--color-surface-raised, #f4f6f8);
            border-radius: var(--webmapx-radius-md, 0.5rem) var(--webmapx-radius-md, 0.5rem) 0 0;
            /* The whole header is the handle, so there is no small target to hit. */
            cursor: move;
            touch-action: none;
            user-select: none;
        }
        /* The grip is the visible half of that promise. Decorative, and hidden
           from assistive technology: the panel is moved by dragging, which this
           icon does not make any more available to a keyboard, so announcing it
           would only add noise. */
        .drag-grip {
            flex: 0 0 auto;
            font-size: 1rem;
            color: var(--color-text-secondary, #5a6773);
            opacity: 0.55;
            transition: opacity 0.15s ease;
        }
        .panel-head:hover .drag-grip { opacity: 1; }
        @media (prefers-reduced-motion: reduce) {
            .drag-grip { transition: none; }
        }
        .panel-title { flex: 1 1 auto; font-weight: 600; }
        .panel-close {
            background: none;
            border: none;
            padding: 0.15rem 0.35rem;
            font: inherit;
            color: var(--color-text-secondary, #5a6773);
            cursor: pointer;
        }
        .panel-close:hover { color: var(--color-text-primary, #16202a); }
        .panel-body {
            overflow: auto;
            padding: 0.75rem;
        }

        .steps { display: flex; flex-direction: column; gap: 0.5rem; }

        .done-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.4rem 0.55rem;
            border: 1px solid var(--color-border-light, #e2e7ec);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            background: var(--color-surface-raised, #f4f6f8);
            font-size: 0.85rem;
        }
        .done-row .tick { color: var(--color-success, #2e7d32); font-weight: 700; }
        .done-row .what { color: var(--color-text-secondary, #5a6773); }
        .done-row .value { font-weight: 600; flex: 1 1 auto; }
        .done-row button {
            border: 0;
            background: none;
            padding: 0.1rem 0.3rem;
            color: var(--color-primary, #2b6cb0);
            cursor: pointer;
            font: inherit;
            text-decoration: underline;
        }

        .question {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: 0.6rem;
            border: 1px solid var(--color-border, #cbd5df);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
        }
        .question > h3 {
            margin: 0;
            font-size: 0.9rem;
        }

        .choices { display: flex; flex-wrap: wrap; gap: 0.4rem; }

        .choice {
            display: flex;
            flex-direction: column;
            gap: 0.15rem;
            align-items: flex-start;
            text-align: left;
            padding: 0.45rem 0.6rem;
            border: 1px solid var(--color-border-light, #e2e7ec);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            background: var(--color-surface, #fff);
            color: inherit;
            font: inherit;
            cursor: pointer;
        }
        .choice:hover { border-color: var(--color-primary, #2b6cb0); }
        .choice[aria-pressed="true"] {
            border-color: var(--color-primary, #2b6cb0);
            box-shadow: inset 0 0 0 1px var(--color-primary, #2b6cb0);
        }
        .choice small { color: var(--color-text-secondary, #5a6773); }
        .choice[disabled] { opacity: 0.5; cursor: not-allowed; }
        .question.loading {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .question.loading sl-spinner { font-size: 1.5rem; }
        .question.loading h3 { margin: 0; }

        /* An inline "try this instead", which is a control, not decoration. */
        button.link {
            background: none;
            border: none;
            padding: 0;
            font: inherit;
            color: var(--color-primary, #2b6cb0);
            text-decoration: underline;
            cursor: pointer;
        }
        /* A WMS legend graphic is whatever size the service made it. */
        .style-legend { max-width: 100%; max-height: 6rem; margin-top: 0.25rem; }

        .attribute-list {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            max-height: 15rem;
            overflow: auto;
        }
        .attribute-list .choice { width: 100%; }
        .attr-meta { font-size: 0.75rem; color: var(--color-text-secondary, #5a6773); }

        .scheme-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            width: 100%;
        }
        .ramp { display: flex; flex: 0 0 auto; border-radius: 2px; overflow: hidden; }
        .ramp span { width: 16px; height: 14px; }
        .scheme-name { flex: 1 1 auto; }
        .flag { font-size: 0.7rem; padding: 0 0.3rem; border-radius: 2px; }
        .flag.ok { background: #e6f4ea; color: #1e4620; }
        .flag.no { background: #fdecea; color: #611a15; }

        .preview { display: flex; flex-direction: column; gap: 0.15rem; }
        .as-drawn { display: flex; gap: 2px; }
        .preview-row { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; }
        .preview-swatch-wrap {
            width: 32px;
            height: 18px;
            flex: 0 0 auto;
            border: 1px solid rgba(0,0,0,0.2);
            /* A chequerboard behind the swatch: at 20% opacity a colour over
               white is just a paler colour, which is a different thing and the
               one that confuses. Over a chequer it reads as see-through. */
            background-image:
                linear-gradient(45deg, rgba(0,0,0,0.16) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.16) 75%),
                linear-gradient(45deg, rgba(0,0,0,0.16) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.16) 75%);
            background-size: 8px 8px;
            background-position: 0 0, 4px 4px;
        }
        .preview-swatch { width: 100%; height: 100%; display: block; }
        .preview-count { color: var(--color-text-secondary, #5a6773); }

        /* Three to a row, so five methods cost two short rows rather than five
           tall ones — the panel has to stay short enough for the legend below
           it to be on screen while the choice is being made. */
        .method-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.3rem;
        }
        .choice.method {
            gap: 0.3rem;
            padding: 0.35rem 0.4rem;
            font-size: var(--sl-font-size-x-small, 0.75rem);
            line-height: 1.15;
        }
        /* One bar per class, its height the share of features in it. */
        .class-bars {
            display: flex;
            align-items: flex-end;
            gap: 1px;
            width: 100%;
            height: 18px;
        }
        .class-bars span {
            flex: 1 1 0;
            background: var(--color-primary, #2b6cb0);
            opacity: 0.35;
            border-radius: 1px 1px 0 0;
        }
        .choice.method[aria-pressed="true"] .class-bars span { opacity: 0.9; }

        /* Nested circles, biggest behind: how a proportional-symbol legend reads. */
        .bubbles { display: flex; align-items: flex-end; gap: 0.75rem; margin-top: 0.4rem; }
        .bubble { display: flex; flex-direction: column; align-items: center; font-size: 0.75rem; }

        .hist { display: flex; align-items: flex-end; gap: 1px; height: 36px; }
        .hist span { flex: 1 1 0; background: var(--color-primary, #2b6cb0); opacity: 0.35; min-height: 1px; }
        .hist span.in-break { opacity: 0.9; }

        .row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

        .color-button {
            width: 2.2rem;
            height: 1.6rem;
            padding: 0;
            border: 1px solid var(--color-border, #cbd5df);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            cursor: pointer;
        }
        .warning {
            padding: 0.4rem 0.55rem;
            border-left: 3px solid var(--color-warning, #b26a00);
            background: var(--color-surface-raised, #f4f6f8);
            font-size: 0.8rem;
        }
        .muted { color: var(--color-text-secondary, #5a6773); font-size: 0.8rem; }

        .attribute-table-wrap { max-height: 14rem; overflow: auto; border: 1px solid var(--color-border-light, #e2e7ec); }
        table { border-collapse: collapse; font-size: 0.75rem; width: 100%; }
        th, td { border-bottom: 1px solid var(--color-border-light, #e2e7ec); padding: 0.2rem 0.35rem; text-align: left; white-space: nowrap; }
        th { position: sticky; top: 0; background: var(--color-surface-raised, #f4f6f8); }

        .footer {
            display: flex;
            gap: 0.5rem;
            justify-content: flex-end;
            padding: 0.5rem 0.75rem 0.6rem;
            border-top: 1px solid var(--color-border-light, #e2e7ec);
        }
    `];

    open(context: StyleDialogContext): void {
        // Escape to document.body — see webmapx-layer-info-dialog.ts's open()
        // for why: an ancestor's backdrop-filter otherwise traps this
        // position:fixed panel inside the legend.
        if (this.parentNode !== document.body) {
            document.body.appendChild(this);
        }
        this.dialogTitle = context.title;
        this.styledLayerId = context.layerId;
        this.groups = context.groups;
        this.applyStyle = context.apply ?? null;
        this.layerHost = context.layers ?? null;
        this.resample = context.resample ?? null;
        this.raster = context.raster ?? null;
        this.styledLayerBounds = context.bounds ?? null;
        this.sourceControl = context.sourceControl ?? null;
        this.writeFeatures = context.writeFeatures ?? null;
        this.neighbourField = null;
        this.wmsStyles = null;
        this.wmsLoading = false;
        this.rasterOpacity = 1;
        this.wmsStyle = readWmsSource(this.raster?.sourceConfig)?.style ?? '';
        this.message = null;
        this.showTable = false;

        this.adoptGroups(context.groups);
        this.opacity = 1;
        this.labelField = null;
        this.labelSize = DEFAULT_LABEL_SIZE;
        this.mode = null;
        this.field = null;
        this.schemeName = null;
        this.methodOpen = true;
        this.schemeOpen = true;
        this.circleShow = 'color';
        this.cycleCategories = null;
        this.methodPreviewCache = null;
        // The spinner has to be part of the very first render, decided here and
        // not after any await: everything below yields, and whatever the browser
        // paints first is what the user sees while the layer is being read.
        this.loadingGroups = !!this.resample && !this.raster;

        this.visible = true;
        document.addEventListener('keydown', this.onKeydown);
        // After the panel has been laid out, so its size is known: a remembered
        // position is only kept while it still lands on screen.
        void this.updateComplete.then(() => this.ensureOnScreen());
        this.startResampling();
    }

    /**
     * Takes a sample of the layer as the panel's state.
     *
     * Called both when the panel opens and when a later read brings the first
     * features in, so a panel that opened empty ends up in exactly the state it
     * would have had if the tiles had been there all along.
     */
    private adoptGroups(groups: SourceStyleGroup[]): void {
        this.groups = groups;
        this.originalPaint = new Map();
        for (const group of groups) {
            for (const target of group.layers) {
                if (target.paint) this.originalPaint.set(target.id, { ...target.paint });
            }
        }
        // One styleable sublayer is not a decision worth asking about.
        const targets = this.allTargets();
        this.targetId = targets.length === 1 ? targets[0].id : this.targetId;
        this.size = this.authoredSize(this.targetId);
        this.singleColor = this.authoredColor(this.targetId);
        this.adoptAuthoredOutline(this.targetId);
    }

    close(): void {
        this.stopResampling();
        this.visible = false;
        document.removeEventListener('keydown', this.onKeydown);
    }

    /** Escape closes it, which the dialog it replaced did for free. */
    private onKeydown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape' && this.visible) this.close();
    };

    /**
     * Drags the panel by its header.
     *
     * Pointer events rather than mouse events, so a touch drag works too, and
     * the pointer is captured so a fast drag that leaves the header does not
     * drop the panel mid-move. The position is clamped on release, not during
     * the drag, so the panel cannot be thrown off screen but also does not
     * stick to an edge while being moved.
     */
    private startDrag(event: PointerEvent): void {
        const head = event.currentTarget as HTMLElement;
        const panel = head.parentElement as HTMLElement | null;
        if (!panel || event.button !== 0) return;
        // Not the close button, which is inside the header.
        if ((event.target as HTMLElement).closest('.panel-close')) return;

        const box = panel.getBoundingClientRect();
        // The offsets come from the box as drawn, so switching from the CSS
        // centring to an explicit left/top on the first move does not shift it.
        //
        // The position is deliberately *not* committed here: pressing on the
        // header is not moving the panel, and committing on pointerdown meant a
        // single click pinned the panel for the rest of the session — after
        // which it never re-centred, and a later resize left it hanging off the
        // edge. Only `onDrag` commits, and only once the pointer has moved.
        this.drag = { pointerId: event.pointerId, dx: event.clientX - box.left, dy: event.clientY - box.top };
        head.setPointerCapture(event.pointerId);
        head.addEventListener('pointermove', this.onDrag);
        head.addEventListener('pointerup', this.endDrag);
        head.addEventListener('pointercancel', this.endDrag);
        event.preventDefault();
    }

    private onDrag = (event: PointerEvent): void => {
        if (!this.drag || event.pointerId !== this.drag.pointerId) return;
        this.position = { x: event.clientX - this.drag.dx, y: event.clientY - this.drag.dy };
    };

    private endDrag = (event: PointerEvent): void => {
        if (!this.drag || event.pointerId !== this.drag.pointerId) return;
        const head = event.currentTarget as HTMLElement;
        head.releasePointerCapture?.(event.pointerId);
        head.removeEventListener('pointermove', this.onDrag);
        head.removeEventListener('pointerup', this.endDrag);
        head.removeEventListener('pointercancel', this.endDrag);
        this.drag = null;
        this.clampPosition();
    };

    /**
     * Brings a remembered position back inside the window when the panel opens.
     *
     * Where the reader last dragged it is worth keeping, but only while it is
     * still somewhere they can use. The window may have been resized — or the
     * panel narrowed with it — since, and a panel that opens half outside the
     * map with its buttons unreachable is worse than one that has forgotten
     * where it was. The panel is never wider than 96vw, so there is always a
     * position that fits.
     */
    private ensureOnScreen(): void {
        if (!this.position) return;
        const panel = this.renderRoot?.querySelector('.panel') as HTMLElement | null;
        if (!panel) return;
        const box = panel.getBoundingClientRect();
        const x = Math.min(Math.max(this.position.x, 0), Math.max(window.innerWidth - box.width, 0));
        const y = Math.min(Math.max(this.position.y, 0), Math.max(window.innerHeight - box.height, 0));
        if (x !== this.position.x || y !== this.position.y) this.position = { x, y };
    }

    /** Keeps at least the header on screen, whatever the drag or a resize did. */
    private clampPosition(): void {
        const panel = this.renderRoot?.querySelector('.panel') as HTMLElement | null;
        if (!panel || !this.position) return;
        const box = panel.getBoundingClientRect();
        // Enough of the panel to grab and read the title by, on whichever edge
        // it was pushed towards; the header must never leave the top.
        const visible = 160;
        this.position = {
            x: Math.min(Math.max(this.position.x, visible - box.width), window.innerWidth - visible),
            y: Math.min(Math.max(this.position.y, 0), window.innerHeight - 48),
        };
    }

    /**
     * Watches for the source's features to turn up.
     *
     * The panel opens straight away and fills itself in, rather than the legend
     * holding it back until a read finishes: a vector-tile layer can take
     * seconds to answer, and a button that does nothing for that long reads as
     * broken. So an empty sample here is usually "not yet" rather than "never",
     * and the panel says which it is instead of showing empty steps. Stops as
     * soon as something arrives, and gives up rather than polling a genuinely
     * empty layer for ever.
     */
    private startResampling(): void {
        this.stopResampling();
        // A raster layer has no features to wait for, ever: its own branch is
        // the answer, not a spinner that runs out of patience first.
        if (!this.resample || this.raster || this.features().length > 0) {
            this.loadingGroups = false;
            return;
        }
        this.loadingGroups = true;
        let attempts = 0;
        let reading = false;
        const read = async () => {
            if (reading) return;
            attempts += 1;
            reading = true;
            const groups = await this.resample?.().catch(() => [] as SourceStyleGroup[]) ?? [];
            reading = false;
            // The panel was closed, or another layer opened it, while we waited.
            if (this.resampleTimer === null && attempts > 1) return;
            if (groups.some((group) => (group.features?.length ?? 0) > 0)) {
                this.adoptGroups(groups);
                this.stopResampling();
            } else if (attempts >= RESAMPLE_ATTEMPTS) {
                // Out of patience: whatever the panel can say about an empty
                // layer, it should now say it rather than spin for ever.
                this.stopResampling();
            }
        };
        // A read is not merely slow, it *blocks*: `queryRenderedFeatures` and
        // the walk over every feature that follows it run on the main thread —
        // measured at ~200ms for 42 countries, and it grows with the layer. The
        // caller has already waited for the panel to be painted; every later
        // read is pushed past a paint too, so the spinner keeps turning.
        void this.afterPaint().then(read);
        this.resampleTimer = setInterval(read, RESAMPLE_INTERVAL_MS);
    }

    /**
     * Resolves once this render has actually been painted.
     *
     * One `requestAnimationFrame` is *not* enough, and that is the whole trick:
     * its callback runs before the paint of the frame it was scheduled for, so
     * blocking work started there still holds up that frame — the panel stayed
     * invisible for the length of the read exactly as before. The second frame's
     * callback runs after the first has been painted, and the timeout after it
     * yields the task so the browser can finish the frame it is in.
     */
    private async afterPaint(): Promise<void> {
        await this.updateComplete;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))));
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    private stopResampling(): void {
        if (this.resampleTimer !== null) clearInterval(this.resampleTimer);
        this.resampleTimer = null;
        this.loadingGroups = false;
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.stopResampling();
        document.removeEventListener('keydown', this.onKeydown);
        // Pickr lives in document.body, so it outlives this element unless it is
        // told otherwise.
        this.picker?.instance.destroyAndRemove();
        this.picker = null;
        this.labelPicker?.instance.destroyAndRemove();
        this.labelPicker = null;
        this.strokePicker?.instance.destroyAndRemove();
        this.strokePicker = null;
    }

    // ── The state, read back as questions ────────────────────────────────────

    private allTargets(): LayerStyleTarget[] {
        return this.groups.flatMap((group) => group.layers.filter((layer) => ROLE_OF_TYPE[layer.type]));
    }

    private currentTarget(): LayerStyleTarget | null {
        return this.allTargets().find((target) => target.id === this.targetId) ?? null;
    }

    private currentGroup(): SourceStyleGroup | null {
        return this.groups.find((group) => group.layers.some((layer) => layer.id === this.targetId)) ?? null;
    }

    /**
     * The colour the target is drawn with today, when that is a colour at all.
     *
     * A layer already carrying a classification has an expression here, not a
     * colour, and no single value represents it — picking one out would be a
     * guess presented as the layer's own. Those start from the data colour
     * instead.
     */
    private authoredColor(targetId: string | null): string {
        const target = this.allTargets().find((candidate) => candidate.id === targetId);
        const role = ROLE_OF_TYPE[target?.type ?? 'fill'] ?? 'fill';
        const value = target?.paint?.[ROLE_COLOR_KEY[role]];
        return typeof value === 'string' ? value : DATA_START;
    }

    /** The outline a circle target is drawn with today, so opening is no change. */
    private adoptAuthoredOutline(targetId: string | null): void {
        const target = this.allTargets().find((candidate) => candidate.id === targetId);
        const color = target?.paint?.['circle-stroke-color'];
        const width = target?.paint?.['circle-stroke-width'];
        this.strokeColor = typeof color === 'string' ? color : DATA_OUTLINE;
        this.strokeWidth = typeof width === 'number' ? width : 1;
    }

    /** The width/radius/text size the target is drawn with today. */
    private authoredSize(targetId: string | null): number | null {
        const target = this.allTargets().find((candidate) => candidate.id === targetId);
        const role = ROLE_OF_TYPE[target?.type ?? 'fill'] ?? 'fill';
        const spec = ROLE_SIZE[role];
        if (!spec) return null;
        const value = target?.paint?.[spec.key];
        if (typeof value === 'number') return value;
        // An authored expression (radius from population, width by zoom) is not
        // a number this control can represent, and writing the slider's minimum
        // over it throws the authored sizing away the moment any other answer is
        // given. `null` means "leave the authored value alone": nothing is
        // written for this key unless the user moves the slider themselves.
        if (value !== undefined && value !== null) return null;
        return spec.min;
    }

    /** True when the layer sizes itself from the data and we have not overridden it. */
    private sizeIsAuthoredExpression(): boolean {
        const spec = ROLE_SIZE[this.currentRole()];
        const value = this.currentTarget()?.paint?.[spec?.key ?? ''];
        return !!spec && value !== undefined && value !== null && typeof value !== 'number';
    }

    private currentRole(): StyleRole {
        const type = this.currentTarget()?.type ?? 'fill';
        return ROLE_OF_TYPE[type] ?? 'fill';
    }

    private features(): GeoJSON.Feature[] {
        return this.currentGroup()?.features ?? [];
    }

    private isNumericField(name: string): boolean {
        const attribute = this.currentGroup()?.attributes.find((a) => a.name === name);
        return attribute?.type === 'number';
    }

    private numericClassification(): NumericClassification | null {
        if (!this.field || !this.isNumericField(this.field)) return null;
        const { values, missing } = numericValues(this.features(), this.field);
        if (values.length === 0) return null;
        return classifyNumeric(values, {
            method: this.method,
            classCount: this.classCount,
            missing,
            rounded: this.roundedBreaks,
        });
    }

    private categoricalClassification(): CategoricalClassification | null {
        if (!this.field || this.isNumericField(this.field)) return null;
        return classifyCategorical(this.features(), this.field, { maxCategories: this.maxCategories });
    }

    /**
     * Whether colours repeat over every value, rather than the tail sharing one.
     *
     * Answered by the data until the user answers it: repeat when "other" would
     * cover more of the map than the classes do. That is not a preference, it is
     * the point at which the map stops showing what it was asked to show —
     * `admin` over 4363 cartogram regions puts 2985 of them, 68%, in one grey,
     * and a map two thirds grey is not a map of its 238 countries.
     *
     * Above that line the classes are the map and the tail is a remainder, which
     * is what "other" is for; the checkbox is there either way.
     */
    private cyclesCategories(): boolean {
        if (this.cycleCategories !== null) return this.cycleCategories;
        const classification = this.categoricalClassification();
        if (!classification || classification.otherValues === 0) return false;
        const inClasses = classification.categories.reduce((sum, category) => sum + category.count, 0);
        return classification.otherCount > inClasses;
    }

    /**
     * Every distinct value of the chosen field, biggest category first.
     *
     * `categoricalClassification` stops at the class count on purpose — that is
     * what makes a legend readable. Colour cycling wants the whole list, so it
     * asks for it separately rather than by widening the classification, which
     * would take the legend with it.
     */
    private everyCategory(): (string | number | boolean)[] {
        if (!this.field || this.isNumericField(this.field)) return [];
        const all = classifyCategorical(this.features(), this.field, { maxCategories: Number.MAX_SAFE_INTEGER });
        return all.categories.map((category) => category.value);
    }

    /** How many colours the current answer needs — what the scheme list is filtered by. */
    private neededColors(): number {
        if (this.mode === 'neighbours') return Math.max(3, this.coloring()?.colorCount ?? this.neighbourColors);
        const numeric = this.numericClassification();
        if (numeric) return numeric.classes.length;
        const categorical = this.categoricalClassification();
        if (categorical) return categorical.categories.length;
        return 1;
    }

    private schemeType(): SchemeType {
        if (this.mode === 'neighbours') return 'qual';
        const numeric = this.numericClassification();
        if (numeric) return suggestSchemeType(numeric);
        return 'qual';
    }

    private schemes(): ColorScheme[] {
        return colorSchemesFor(this.neededColors(), this.schemeType(), {
            reversed: this.reversed,
            usage: this.blindSafe ? { blind: 'ok' } : undefined,
        });
    }

    private currentScheme(): ColorScheme | null {
        const schemes = this.schemes();
        return schemes.find((scheme) => scheme.name === this.schemeName) ?? schemes[0] ?? null;
    }

    private coloringCache: { features: GeoJSON.Feature[]; palette: number; result: ReturnType<typeof colorByAdjacency> } | null = null;

    /** Cached: colouring 4000 regions is not something to redo on every render. */
    private coloring(): ReturnType<typeof colorByAdjacency> | null {
        const features = this.features();
        if (features.length === 0) return null;
        const palette = this.neighbourColors;
        if (this.coloringCache?.features === features && this.coloringCache.palette === palette) {
            return this.coloringCache.result;
        }
        const result = colorByAdjacency(features, { paletteSize: palette });
        this.coloringCache = { features, palette, result };
        return result;
    }

    /**
     * True when this layer's features can be given a colouring the map can read.
     *
     * Only for a source held whole and locally: a `geojson` one, whose features
     * the app owns. Tiled properties come from a server and cannot be added to,
     * which is why the keyed fallback still exists.
     */
    private canWriteFeatures(): boolean {
        const group = this.currentGroup();
        if (!group || !this.writeFeatures) return false;
        if (group.completeData === false) return false;
        const type = (group.sourceConfig as Record<string, unknown> | null | undefined)?.type;
        return type === 'geojson' && (group.features?.length ?? 0) > 0;
    }

    /**
     * Puts the current neighbour colouring into the data, so the paint can name
     * it.
     *
     * A computed colouring has no attribute of its own, and the map can only
     * paint what an expression can address. Writing the class index makes one:
     * six `match` entries instead of one per feature, and no dependence on the
     * layer having a unique column — which the layers this option exists for
     * frequently do not.
     *
     * Called from `applyNow`, never from `buildColors`: the panel builds a style
     * while rendering (for the preview and the palette row), and rewriting a map
     * source as a side effect of rendering is how a render loop starts.
     */
    private syncNeighbourColoring(): void {
        this.neighbourField = null;
        if (this.mode !== 'neighbours' || !this.canWriteFeatures()) return;

        const coloring = this.coloring();
        const group = this.currentGroup();
        const features = group?.features;
        if (!coloring || !group || !features) return;

        features.forEach((feature, index) => {
            const value = coloring.colors[index];
            if (value === undefined) return;
            feature.properties = { ...(feature.properties ?? {}), [NEIGHBOUR_COLOR_FIELD]: value };
        });

        const written = this.writeFeatures!(group.sourceId, features);
        if (written) this.neighbourField = NEIGHBOUR_COLOR_FIELD;
    }

    // ── Applying ─────────────────────────────────────────────────────────────

    private built(): { paint: Record<string, unknown>; legend: { color: string; label: string }[] } | null {
        const style = this.buildColors();
        if (!style) return null;
        let paint = { ...style.paint };

        // Circles sized from the value itself — no classes, because the whole
        // point of a proportional symbol is that twice the value draws twice
        // the area, and a break throws that reading away.
        const radius = this.proportionalRadius();
        if (radius) {
            paint = { ...paint, 'circle-radius': radius.expression };
        } else {
            const spec = ROLE_SIZE[this.currentRole()];
            if (spec && this.size !== null) paint = { ...paint, [spec.key]: this.size };
        }

        if (this.currentRole() === 'circle' && this.mode === 'single') {
            paint = {
                ...paint,
                'circle-stroke-color': this.strokeColor,
                'circle-stroke-width': this.strokeWidth,
            };
        }
        return { ...style, paint };
    }

    /** True when this layer draws circles and the attribute is shown as size. */
    private sizesByValue(): boolean {
        return this.currentRole() === 'circle'
            && this.mode === 'attribute'
            && this.circleShow !== 'color'
            && !!this.field
            && this.isNumericField(this.field);
    }

    private proportionalRadius(): { expression: unknown[]; coefficient: number; maxValue: number } | null {
        if (!this.sizesByValue() || !this.field) return null;
        const { values } = numericValues(this.features(), this.field);
        const maxValue = Math.max(...values, 0);
        if (!(maxValue > 0)) return null;
        return {
            ...buildProportionalRadius({ field: this.field, maxValue, maxRadius: MAX_BUBBLE_RADIUS }),
            maxValue,
        };
    }

    private buildColors(): { paint: Record<string, unknown>; legend: { color: string; label: string }[] } | null {
        const role = this.currentRole();
        const scheme = this.currentScheme();

        if (this.mode === 'single') {
            return buildSingleStyle(role, this.singleColor, this.opacity);
        }
        // Size only: the value is in the circle, so the colour says nothing and
        // a ramp on top of it would be the same fact twice.
        if (this.circleShow === 'size' && this.sizesByValue()) {
            return buildSingleStyle(role, this.singleColor, this.opacity);
        }
        if (this.mode === 'neighbours') {
            const coloring = this.coloring();
            if (!coloring || !scheme) return null;
            // Written into the data where that was possible; otherwise keyed on
            // a column that happens to be unique.
            if (this.neighbourField) {
                return buildIndexedColorStyle({
                    role,
                    field: this.neighbourField,
                    colorCount: coloring.colorCount,
                    scheme,
                    opacity: this.opacity,
                });
            }
            const key = coloringKeyFor(this.features());
            if (!key) return null;
            const entries = this.features().flatMap((feature, index) => {
                const value = coloringKeyValue(key, feature);
                if (value === null) return [];
                return [{ key: value, colorIndex: coloring.colors[index] }];
            });
            return entries.length === 0 ? null : buildKeyedColorStyle({ role, key, entries, scheme, opacity: this.opacity });
        }
        if (this.mode === 'attribute' && this.field && scheme) {
            const numeric = this.numericClassification();
            if (numeric) {
                return buildNumericStyle({ role, field: this.field, classification: numeric, scheme, opacity: this.opacity });
            }
            const categorical = this.categoricalClassification();
            if (categorical && categorical.categories.length > 0) {
                if (this.cyclesCategories()) {
                    const every = this.everyCategory();
                    if (every.length > 0) {
                        return buildCyclicCategoricalStyle({
                            role,
                            field: this.field,
                            values: every,
                            scheme,
                            opacity: this.opacity,
                        });
                    }
                }
                return buildCategoricalStyle({ role, field: this.field, classification: categorical, scheme, opacity: this.opacity });
            }
        }
        return null;
    }

    /** Rebuilds and pushes the style to the map. Called after every answer. */
    private applyNow(): void {
        if (!this.targetId || !this.applyStyle) return;
        try {
            // The colouring has to be in the data before a paint can name it,
            // and it is recomputed here rather than cached: the number of
            // colours is a question the user can still be answering.
            this.syncNeighbourColoring();
            const style = this.built();
            if (!style) {
                // Never nothing. A style that cannot be built leaves the map as
                // it was, and a panel that says nothing about it reads as a dead
                // button — which is exactly how this arrived: choosing
                // "Neighbours differ" on a tiled layer with no unique column
                // applied no paint and gave no reason.
                this.message = this.mode === 'neighbours'
                    ? 'Colouring by neighbours needs something to tell the areas apart, and this layer has no id, no unique column and no combination of columns that is unique.'
                    : 'There is not enough here to build a style from.';
                return;
            }
            const applied = this.applyStyle(this.targetId, style.paint);
            this.message = applied === false
                ? 'The map did not accept this change: this part of the layer is described in the legend but is not drawn on the map.'
                : null;
        } catch (error) {
            // A scheme that cannot serve the class count, a field with nothing
            // usable in it: say so rather than leaving the map unchanged and
            // silent, which is how a styling UI loses a user's trust.
            this.message = error instanceof Error ? error.message : String(error);
        }
    }

    private resetStyle(): void {
        if (!this.applyStyle) return;
        for (const [subLayerId, paint] of this.originalPaint) {
            this.applyStyle(subLayerId, paint);
        }
        this.mode = null;
        this.field = null;
        this.schemeName = null;
        this.message = null;
        this.opacity = 1;
        this.neighbourColors = MIN_NEIGHBOUR_COLORS;
        this.classCount = DEFAULT_CLASS_COUNT;
        this.cycleCategories = null;
        this.roundedBreaks = true;
        this.methodOpen = true;
        this.schemeOpen = true;
        this.methodPreviewCache = null;
        this.size = this.authoredSize(this.targetId);
        this.singleColor = this.authoredColor(this.targetId);
        // Reset means the layer as it was found, and it was found without them.
        this.labelField = null;
        void this.applyLabels();
    }

    /** Records an answer, then rebuilds and re-applies the style. */
    private answer(change: () => void): void {
        const modeBefore = this.mode;
        change();
        // A new kind of colouring starts at full strength. Carrying the previous
        // opacity over is how a ramp ended up drawn at the 20% the layer
        // happened to be authored with, looking nothing like the swatches it was
        // chosen from. The slider is right there to dim it again.
        if (this.mode !== modeBefore) this.opacity = 1;
        // Answering a question can invalidate a later one: a new attribute
        // cannot keep the previous field's scheme choice if the class count
        // changed. Only the scheme is reset, since it is the only answer whose
        // validity depends on an earlier one.
        this.updateComplete.then(() => {
            const schemes = this.schemes();
            if (this.schemeName && !schemes.some((scheme) => scheme.name === this.schemeName)) {
                this.schemeName = schemes[0]?.name ?? null;
            }
            this.applyNow();
        });
    }

    // ── Render ───────────────────────────────────────────────────────────────

    protected render() {
        const targets = this.allTargets();
        const group = this.currentGroup();

        return html`
            <div class="panel" role="dialog" aria-modal="false" aria-label=${this.dialogTitle}
                 style=${this.position ? `left:${this.position.x}px; top:${this.position.y}px; transform:none` : ''}>
                <header class="panel-head" title="Drag to move"
                        @pointerdown=${(e: PointerEvent) => this.startDrag(e)}>
                    <sl-icon class="drag-grip" name="grip-vertical" aria-hidden="true"></sl-icon>
                    <span class="panel-title">${this.dialogTitle}</span>
                    <button class="panel-close" type="button" aria-label="Close" @click=${() => this.close()}>✕</button>
                </header>
                <div class="panel-body">
                ${this.loadingGroups
                    ? this.renderLoading()
                    : targets.length === 0
                    ? this.renderRaster()
                    : html`
                        <div class="steps">
                            ${this.renderTargetStep(targets)}
                            ${this.targetId ? this.renderModeStep() : nothing}
                            ${this.renderModeDetail()}
                            ${this.renderSchemeStep()}
                            ${this.mode ? this.renderOpacity() : nothing}
                            ${this.mode ? this.renderSize() : nothing}
                            ${this.renderLabels()}
                            ${this.renderPreview()}
                            ${group && group.completeData === false ? html`
                                <div class="warning">
                                    This layer arrives as tiles, so the class boundaries are worked out from the features
                                    on screen — zooming out can bring in values outside them. The colouring and the
                                    labels themselves apply to every feature, at any zoom. Move to a part of the map
                                    that represents the whole before classifying.
                                </div>` : nothing}
                            ${this.message ? html`<div class="warning">${this.message}</div>` : nothing}
                            ${this.renderData(group)}
                        </div>
                    `}
                </div>
                <div class="footer">
                    <sl-button size="small" @click=${() => this.resetStyle()}>Reset</sl-button>
                    <sl-button size="small" variant="primary" @click=${() => this.close()}>Done</sl-button>
                </div>
            </div>
        `;
    }

    private renderDone(what: string, value: string, reopen: () => void): TemplateResult {
        return html`
            <div class="done-row">
                <span class="tick">✓</span>
                <span class="what">${what}</span>
                <span class="value">${value}</span>
                <button type="button" @click=${reopen}>change</button>
            </div>
        `;
    }

    private renderTargetStep(targets: LayerStyleTarget[]): TemplateResult | typeof nothing {
        if (targets.length <= 1) return nothing;
        const current = this.currentTarget();
        if (current) {
            return this.renderDone('Style', ROLE_LABELS[ROLE_OF_TYPE[current.type] ?? 'fill'], () => { this.targetId = null; });
        }
        return html`
            <div class="question">
                <h3>What do you want to change?</h3>
                <div class="choices">
                    ${targets.map((target) => html`
                        <button class="choice" type="button"
                                aria-pressed=${String(target.id === this.targetId)}
                                @click=${() => {
                                    this.targetId = target.id;
                                    this.coloringCache = null;
                                    this.opacity = 1;
                                    this.size = this.authoredSize(target.id);
                                    this.singleColor = this.authoredColor(target.id);
                                }}>
                            <span>${ROLE_LABELS[ROLE_OF_TYPE[target.type] ?? 'fill']}</span>
                            <small>${target.id}</small>
                        </button>
                    `)}
                </div>
            </div>
        `;
    }

    private renderModeStep(): TemplateResult {
        const polygonish = (this.currentGroup()?.geometryTypes ?? []).some((type) => type.toLowerCase().includes('polygon'));
        const hasFeatures = this.features().length > 0;

        if (this.mode) {
            const label = this.mode === 'single' ? 'One colour'
                : this.mode === 'neighbours' ? 'Neighbours differ' : 'By attribute';
            return this.renderDone('Colour', label, () => { this.mode = null; });
        }

        return html`
            <div class="question">
                <h3>How should it be coloured?</h3>
                <div class="choices">
                    <button class="choice" type="button" @click=${() => this.answer(() => { this.mode = 'single'; })}>
                        <span>One colour</span>
                        <small>The whole layer the same</small>
                    </button>
                    <button class="choice" type="button" ?disabled=${!hasFeatures}
                            @click=${() => hasFeatures && this.answer(() => { this.mode = 'attribute'; })}>
                        <span>By attribute</span>
                        <small>${hasFeatures ? 'Colour by a column of the data' : 'No features are loaded'}</small>
                    </button>
                    <button class="choice" type="button" ?disabled=${!hasFeatures || !polygonish}
                            @click=${() => hasFeatures && polygonish && this.answer(() => { this.mode = 'neighbours'; })}>
                        <span>Neighbours differ</span>
                        <small>${polygonish ? 'No attribute needed' : 'Areas only'}</small>
                    </button>
                </div>
            </div>
        `;
    }

    private renderModeDetail(): TemplateResult | typeof nothing {
        if (this.mode === 'single') return this.renderSingleColor();
        if (this.mode === 'attribute') return this.renderAttributeSteps();
        if (this.mode === 'neighbours') return this.renderNeighbourNote();
        return nothing;
    }

    private renderSingleColor(): TemplateResult {
        return html`
            <div class="question">
                <h3>Colour</h3>
                <div class="row">
                    <button class="color-button" type="button" title="Pick a colour"
                            style="background:${this.singleColor}"
                            @click=${(e: Event) => this.openColorPicker(e.currentTarget as HTMLElement)}></button>
                    <span class="muted">${this.singleColor}</span>
                </div>
            </div>
            ${this.renderOutlineStep()}
        `;
    }

    /**
     * A circle's outline, offered wherever the fill is one colour.
     *
     * Without one a circle is a blob: over a busy basemap the edge is where it
     * stops being a coloured smudge, and where two overlapping circles become
     * two circles. Areas and lines have their own outline handling and are left
     * alone here.
     */
    private renderOutlineStep(): TemplateResult | typeof nothing {
        if (this.currentRole() !== 'circle') return nothing;
        return html`
            <div class="question">
                <h3>Outline</h3>
                <div class="row">
                    <button class="color-button" type="button" title="Pick an outline colour"
                            style="background:${this.strokeColor}"
                            @click=${(e: Event) => this.openStrokePicker(e.currentTarget as HTMLElement)}></button>
                    <span class="muted">${this.strokeColor}</span>
                    <input type="range" min="0" max="6" step="0.5" .value=${String(this.strokeWidth)}
                           @input=${(e: Event) => this.answer(() => {
                               this.strokeWidth = Number((e.target as HTMLInputElement).value);
                           })}>
                    <span>${this.strokeWidth} px</span>
                </div>
            </div>
        `;
    }

    private openStrokePicker(button: HTMLElement): void {
        if (this.strokePicker && this.strokePicker.button !== button) {
            this.strokePicker.instance.destroyAndRemove();
            this.strokePicker = null;
        }
        if (!this.strokePicker) {
            this.strokePicker = {
                button,
                instance: createColorPicker({
                    button,
                    value: this.strokeColor,
                    onChange: (rgba) => this.answer(() => { this.strokeColor = rgba; }),
                    onCancel: (original) => this.answer(() => { this.strokeColor = original; }),
                }),
            };
            this.strokePicker.instance.show();
            return;
        }
        this.strokePicker.instance.setColor(this.strokeColor);
        this.strokePicker.instance.show();
    }

    /**
     * The same picker the legend uses — palette with black, white and
     * transparent, which a native `<input type="color">` cannot offer at all.
     */
    private openColorPicker(button: HTMLElement): void {
        if (this.picker && this.picker.button !== button) {
            this.picker.instance.destroyAndRemove();
            this.picker = null;
        }
        if (!this.picker) {
            this.picker = {
                button,
                instance: createColorPicker({
                    button,
                    value: this.singleColor,
                    onChange: (rgba) => this.answer(() => { this.singleColor = rgba; }),
                    onCancel: (original) => this.answer(() => { this.singleColor = original; }),
                }),
            };
            this.picker.instance.show();
            return;
        }
        this.picker.instance.setColor(this.singleColor);
        this.picker.instance.show();
    }

    private renderNeighbourNote(): TemplateResult {
        const coloring = this.coloring();
        // Two ways to address the result, and only the second needs the data to
        // already distinguish its own features: the colouring can be written
        // into a source the app holds whole.
        const addressable = this.canWriteFeatures() || coloringKeyFor(this.features()) !== null;
        if (!addressable) {
            return html`<div class="warning">
                This layer is drawn from tiles and has no id and no column whose values are unique, so there is no way
                to tell its areas apart in a style. Colouring by neighbours needs one or the other.
            </div>`;
        }
        if (!coloring) return html`<div class="muted">No areas to colour.</div>`;
        const everythingIsolated = coloring.isolatedRegions >= coloring.colors.length;
        return html`
            <div class="question">
                <h3>Neighbours differ</h3>
                <div class="row">
                    <label for="neighbour-colors">Colours</label>
                    <input id="neighbour-colors" type="range"
                           min=${MIN_NEIGHBOUR_COLORS} max=${MAX_NEIGHBOUR_COLORS}
                           .value=${String(this.neighbourColors)}
                           @input=${(e: Event) => this.answer(() => { this.neighbourColors = Number((e.target as HTMLInputElement).value); })}>
                    <span>${coloring.colorCount}</span>
                </div>
                <div class="muted">
                    No two touching areas alike.
                    ${coloring.isolatedRegions > 0 ? html`${coloring.isolatedRegions} areas touch nothing.` : nothing}
                </div>
                ${everythingIsolated ? html`<div class="warning">
                    No two areas in this layer share a border. Either they really are separate, or the borders were
                    drawn separately and do not share coordinates — in which case the colouring means nothing.
                </div>` : nothing}
            </div>
        `;
    }

    private renderAttributeSteps(): TemplateResult {
        const group = this.currentGroup();
        if (!group) return html`<div class="muted">No data.</div>`;

        if (!this.field) {
            const groupable = this.sortedAttributes(group).filter((attribute) => {
                const unique = new Set(attribute.values.map(String)).size;
                return attribute.type === 'number' || unique < attribute.presentCount || unique <= this.maxCategories;
            });
            return html`
                <div class="question">
                    <h3>Which attribute?</h3>
                    ${groupable.length === 0 ? html`<div class="warning">
                        This layer carries only names or codes — one different value per feature — so there is nothing
                        to group by. "Neighbours differ" colours it without an attribute.
                    </div>` : nothing}
                    <div class="attribute-list">
                        ${this.sortedAttributes(group).map((attribute) => {
                            const unique = new Set(attribute.values.map(String)).size;
                            // A column with a different value for every feature is
                            // a name or a code, not a grouping: classifying it puts
                            // a handful of features in colours and everything else
                            // in "other", which reads as a one-colour map. That is
                            // what the neighbours option is for.
                            const isKey = attribute.type !== 'number' && unique >= attribute.presentCount && unique > this.maxCategories;
                            return html`
                                <button class="choice" type="button" ?disabled=${isKey}
                                        @click=${() => { if (!isKey) { this.coloringCache = null; this.answer(() => { this.field = attribute.name; }); } }}>
                                    <span>${attribute.name}</span>
                                    <span class="attr-meta">${this.attributeSummary(attribute, unique, isKey)}</span>
                                </button>
                            `;
                        })}
                    </div>
                </div>
            `;
        }

        return html`
            ${this.renderDone('Attribute', this.field, () => { this.field = null; this.methodOpen = true; })}
            ${this.renderCircleShowStep()}
            ${this.circleShow === 'size' && this.sizesByValue()
                ? this.renderBubbleNote()
                : this.isNumericField(this.field) ? this.renderMethodStep() : this.renderCategoryStep()}
        `;
    }

    /**
     * Colour, size, or both — asked only of a circle layer with a number to
     * show.
     *
     * A quantity in a circle is usually read better from its area than from a
     * colour ramp, and the two together is the classic proportional-symbol map.
     * Which of the three it is cannot be guessed from the data, so it is asked
     * rather than assumed — and asked only where all three are possible: areas
     * and lines have no size to vary by value, and a category has no quantity.
     */
    private renderCircleShowStep(): TemplateResult | typeof nothing {
        if (this.currentRole() !== 'circle' || !this.field || !this.isNumericField(this.field)) return nothing;
        const labels: Record<CircleShow, string> = {
            color: 'Colour',
            size: 'Circle size',
            both: 'Both',
        };
        const hints: Record<CircleShow, string> = {
            color: 'Classes of colour, as on an area map.',
            size: 'The circle\'s area is the value. No classes at all.',
            both: 'Sized by the value, coloured by its class.',
        };
        return html`
            <div class="question">
                <h3>Show it by…</h3>
                <div class="choices">
                    ${(Object.keys(labels) as CircleShow[]).map((option) => html`
                        <button class="choice" type="button" aria-pressed=${String(option === this.circleShow)}
                                @click=${() => this.answer(() => { this.circleShow = option; })}>
                            <span>${labels[option]}</span>
                            <small>${hints[option]}</small>
                        </button>
                    `)}
                </div>
            </div>
        `;
    }

    /** What a size-only map is showing, since it has no class list to read. */
    private renderBubbleNote(): TemplateResult {
        const radius = this.proportionalRadius();
        if (!radius) return html`<div class="muted">This column has no positive values to size circles by.</div>`;
        const samples = proportionalRadiusLegend(radius.maxValue, radius.coefficient);
        return html`
            <div class="question">
                <h3>Circle size</h3>
                <div class="muted">
                    Every circle's <em>area</em> is its value, so two of them together cover as much as one of twice
                    the value. There are no classes to choose.
                </div>
                <div class="bubbles">
                    ${samples.map((sample) => html`
                        <span class="bubble">
                            ${svg`<svg width=${MAX_BUBBLE_RADIUS * 2 + 4} height=${sample.radius * 2 + 4}>
                                <circle cx=${MAX_BUBBLE_RADIUS + 2} cy=${sample.radius + 2} r=${sample.radius}
                                        fill=${this.singleColor} fill-opacity="0.7"
                                        stroke=${this.strokeColor} stroke-width="1"></circle>
                            </svg>`}
                            <span>${Number(sample.value.toPrecision(3)).toLocaleString()}</span>
                        </span>
                    `)}
                </div>
            </div>
        `;
    }

    /**
     * What a column holds, said in one line under its name.
     *
     * For numbers this is the five-number sketch a classification is chosen
     * against — the smallest, the middle, the average and the largest. Median
     * far below the average is exactly the skew that makes natural breaks
     * collapse, so the numbers that explain the class bars are on the screen
     * where the column is picked, not only afterwards.
     */
    private attributeSummary(attribute: SourceAttributeInfo, unique: number, isKey: boolean): TemplateResult {
        const stats = this.attributeStats(attribute);
        const missing = attribute.missingCount > 0
            ? html`· ${attribute.missingCount} empty`
            : nothing;
        if (!stats) {
            return html`
                ${attribute.type}
                · ${unique} different ${unique === 1 ? 'value' : 'values'}
                ${missing}
                ${isKey ? html`· every value is different, so there is nothing to group — try "Neighbours differ"` : nothing}
            `;
        }
        const format = (value: number) => Number(value.toFixed(2)).toLocaleString();
        return html`
            ${stats.whole ? 'whole numbers' : 'numbers'}
            · min ${format(stats.min)} · median ${format(stats.median)}
            · average ${format(stats.mean)} · max ${format(stats.max)}
            · ${unique} different ${unique === 1 ? 'value' : 'values'}
            ${missing}
            ${stats.whole && unique >= attribute.presentCount && attribute.presentCount > 0
                ? html`· all different`
                : nothing}
        `;
    }

    /**
     * Min/median/mean/max for a numeric column, worked out once per sample.
     *
     * Cached against the attribute object itself, which is replaced whenever the
     * layer is read again — so a new sample recomputes and an idle panel does
     * not walk every column on every render.
     */
    private attributeStats(attribute: SourceAttributeInfo): AttributeStats | null {
        if (attribute.type !== 'number') return null;
        const cached = this.statsCache.get(attribute);
        if (cached !== undefined) return cached;

        const numbers = attribute.values
            .map((value) => (typeof value === 'number' ? value : Number(value)))
            .filter((value): value is number => Number.isFinite(value))
            .sort((a, b) => a - b);
        if (numbers.length === 0) {
            this.statsCache.set(attribute, null);
            return null;
        }
        const middle = Math.floor(numbers.length / 2);
        const stats: AttributeStats = {
            min: numbers[0],
            max: numbers[numbers.length - 1],
            median: numbers.length % 2 === 0 ? (numbers[middle - 1] + numbers[middle]) / 2 : numbers[middle],
            mean: numbers.reduce((sum, value) => sum + value, 0) / numbers.length,
            // "Unique" only means something for whole numbers and text: every
            // measured value being different is normal for a decimal column and
            // says nothing about whether it is an id.
            whole: numbers.every((value) => Number.isInteger(value)),
        };
        this.statsCache.set(attribute, stats);
        return stats;
    }

    /**
     * Numeric fields with few gaps first, unique-per-feature fields last: an id
     * column is technically classifiable and never what anyone wants.
     */
    private sortedAttributes(group: SourceStyleGroup): SourceAttributeInfo[] {
        const total = group.featureCount ?? 0;
        return [...group.attributes].sort((a, b) => {
            const score = (attribute: SourceAttributeInfo): number => {
                const unique = new Set(attribute.values.map(String)).size;
                const isKey = total > 0 && unique >= total;
                return (attribute.type === 'number' ? 0 : 1) + (isKey ? 2 : 0) + attribute.missingCount / (total || 1);
            };
            return score(a) - score(b);
        });
    }

    /**
     * Choosing how the numbers are divided — the one step that cannot collapse
     * on being answered, because the answer is only judged by its result.
     *
     * So each method shows its own result *before* it is chosen: a bar per
     * class, the height being how many features land in it. A method that files
     * the whole layer in one class is then a single tall bar, visible without
     * clicking anything, and the choice is a comparison rather than five trials.
     * That is what lets the step collapse like every other one, which is what
     * keeps the panel short enough for the legend to stay in view.
     */
    private renderMethodStep(): TemplateResult {
        const classification = this.numericClassification();
        const notes = html`
            ${classification && classification.classes.length < this.classCount
                ? html`<div class="muted">
                    The data has only ${classification.classes.length} distinct
                    ${classification.classes.length === 1 ? 'value' : 'groups of values'}, so there are no more classes to make.
                  </div>`
                : nothing}
            ${this.renderCrowdedNote(classification)}
        `;

        if (!this.methodOpen) {
            const count = classification?.classes.length ?? this.classCount;
            return html`
                ${this.renderDone(
                    'Divided by',
                    `${METHOD_LABELS[this.method]}, ${count} ${count === 1 ? 'class' : 'classes'}`,
                    () => { this.methodOpen = true; },
                )}
                ${notes}
            `;
        }

        return html`
            <div class="question">
                <h3>How should the numbers be divided?</h3>
                <div class="row">
                    <label for="class-count">Classes</label>
                    <input id="class-count" type="range" min="2" max=${maxClassesFor(this.schemeType())}
                           .value=${String(this.classCount)}
                           @input=${(e: Event) => this.answer(() => { this.classCount = Number((e.target as HTMLInputElement).value); })}>
                    <span>${classification?.classes.length ?? this.classCount}</span>
                    <sl-checkbox size="small" ?checked=${this.roundedBreaks}
                                 @sl-change=${(e: Event) => this.answer(() => {
                                     this.roundedBreaks = (e.target as HTMLInputElement).checked;
                                 })}>Round</sl-checkbox>
                </div>
                <div class="method-grid">
                    ${(Object.keys(METHOD_LABELS) as ClassificationMethod[])
                        .filter((method) => method !== 'manual')
                        .map((method) => html`
                            <button class="choice method" type="button" aria-pressed=${String(method === this.method)}
                                    title=${METHOD_HINTS[method]}
                                    @click=${() => this.answer(() => { this.method = method; this.methodOpen = false; })}>
                                <span>${METHOD_LABELS[method]}</span>
                                ${this.renderClassBars(method)}
                            </button>
                        `)}
                </div>
                <div class="muted">${METHOD_HINTS[this.method]}</div>
                ${classification ? this.renderHistogram(classification) : nothing}
                ${notes}
            </div>
        `;
    }

    /** How the layer falls into classes under one method: one bar per class. */
    private renderClassBars(method: ClassificationMethod): TemplateResult {
        const classification = this.classificationFor(method);
        if (!classification || classification.classes.length === 0) return html``;
        const tallest = Math.max(...classification.classes.map((entry) => entry.count), 1);
        return html`
            <span class="class-bars" aria-hidden="true">
                ${classification.classes.map((entry) => html`
                    <span style="height:${Math.max(6, (entry.count / tallest) * 100)}%"
                          title=${`${entry.count} features`}></span>
                `)}
            </span>
        `;
    }

    /**
     * The classification a method would give, cached.
     *
     * Every method is worked out on every render so its bars can be drawn, and
     * natural breaks is a dynamic program over the whole column — recomputing
     * five of those on each slider tick is what would make the panel crawl.
     */
    private classificationFor(method: ClassificationMethod): NumericClassification | null {
        if (!this.field || !this.isNumericField(this.field)) return null;
        const features = this.features();
        const key = `${this.field}|${this.classCount}|${this.roundedBreaks}|${features.length}`;
        if (this.methodPreviewCache?.key !== key) {
            this.methodPreviewCache = { key, results: new Map() };
        }
        const cache = this.methodPreviewCache.results;
        if (!cache.has(method)) {
            const { values, missing } = numericValues(features, this.field);
            cache.set(method, values.length === 0 ? null : classifyNumeric(values, {
                method,
                classCount: this.classCount,
                missing,
                rounded: this.roundedBreaks,
            }));
        }
        return cache.get(method) ?? null;
    }

    /**
     * Says when the chosen method has produced a map of one colour.
     *
     * A column like population density is not evenly spread — most regions are
     * under a hundred people per km², a city state is thousands — and every
     * width-based method (and natural breaks, which minimises variance and so
     * gives the outliers classes of their own) then files nearly the whole layer
     * in the first class. That is arithmetically right and cartographically
     * useless, and a student cannot tell which of the two they are looking at.
     * Naming it, with the two methods that survive skew, is the teaching.
     */
    private renderCrowdedNote(classification: NumericClassification | null): TemplateResult | typeof nothing {
        if (!classification || classification.classes.length < 2) return nothing;
        const total = classification.classes.reduce((sum, entry) => sum + entry.count, 0);
        if (total === 0) return nothing;
        const biggest = classification.classes.reduce((best, entry) => (entry.count > best.count ? entry : best));
        if (biggest.count / total < CROWDED_CLASS_SHARE) return nothing;
        const survivors: ClassificationMethod[] = ['quantile', 'geometric'];
        const alternatives = survivors.filter((method) => method !== this.method);
        return html`
            <div class="muted">
                ${biggest.count} of ${total} features fall in one class, so most of the map is a single colour.
                The values are bunched at one end with a few far above them — try
                ${alternatives.map((method, index) => html`${index > 0 ? ' or ' : ''}<button
                    class="link" type="button"
                    @click=${() => this.answer(() => { this.method = method; })}
                >${METHOD_LABELS[method].toLowerCase()}</button>`)}.
            </div>
        `;
    }

    private renderCategoryStep(): TemplateResult {
        const classification = this.categoricalClassification();
        return html`
            <div class="question">
                <h3>Categories</h3>
                <div class="row">
                    <label for="max-categories">Show at most</label>
                    <input id="max-categories" type="range" min="2" max=${maxClassesFor('qual')}
                           .value=${String(this.maxCategories)}
                           @input=${(e: Event) => this.answer(() => { this.maxCategories = Number((e.target as HTMLInputElement).value); })}>
                    <span>${this.maxCategories}</span>
                </div>
                ${classification && classification.otherValues > 0
                    ? html`
                        <label class="row">
                            <input type="checkbox" .checked=${this.cyclesCategories()}
                                   @change=${(e: Event) => this.answer(() => {
                                       this.cycleCategories = (e.target as HTMLInputElement).checked;
                                   })}>
                            <span>Give every value a colour, repeating the ${this.maxCategories}</span>
                        </label>
                        ${this.cyclesCategories()
                            ? html`<div class="muted">
                                All ${classification.otherValues + classification.categories.length} values are drawn,
                                so the map shows every area — but a colour no longer names one value, and there is no
                                legend for the same reason.
                              </div>`
                            : html`<div class="muted">
                                ${classification.otherValues} more values share one colour, covering
                                ${classification.otherCount} features.
                              </div>`}`
                    : nothing}
            </div>
        `;
    }

    /**
     * The histogram is the widget that teaches: the breaks drawn over the
     * distribution show at a glance why two methods disagree on skewed data.
     */
    private renderHistogram(classification: NumericClassification): TemplateResult {
        const { values } = this.field ? numericValues(this.features(), this.field) : { values: [] };
        const bins = histogram(values, 40);
        if (bins.length === 0) return html``;
        const tallest = Math.max(...bins.map((bin) => bin.count));
        return html`
            <div class="hist" role="img" aria-label="Distribution of ${this.field ?? 'the values'}">
                ${bins.map((bin) => {
                    const inBreak = classification.breaks.some((brk) => brk >= bin.min && brk < bin.max);
                    return html`<span class=${inBreak ? 'in-break' : ''}
                                      style="height:${Math.max(1, (bin.count / tallest) * 100)}%"
                                      title="${Math.round(bin.min)} – ${Math.round(bin.max)}: ${bin.count}"></span>`;
                })}
            </div>
        `;
    }

    private renderSchemeStep(): TemplateResult | typeof nothing {
        if (this.mode !== 'attribute' && this.mode !== 'neighbours') return nothing;
        if (this.mode === 'attribute' && !this.field) return nothing;
        // Size alone carries the value, so there is no ramp to choose from.
        if (this.circleShow === 'size' && this.sizesByValue()) return nothing;

        const schemes = this.schemes();
        const selected = this.currentScheme();
        if (!this.schemeOpen && selected) {
            return this.renderDone('Colours', selected.name, () => { this.schemeOpen = true; });
        }
        // Every ColorBrewer *sequential* scheme is colour-blind safe, so the
        // filter removes nothing there. Saying so is better than a checkbox
        // that appears to do nothing — and it is the more reassuring answer.
        const unfiltered = colorSchemesFor(this.neededColors(), this.schemeType(), { reversed: this.reversed });
        const filterChangesNothing = this.blindSafe && schemes.length === unfiltered.length;
        return html`
            <div class="question">
                <h3>Colours</h3>
                <div class="row">
                    <sl-checkbox size="small" ?checked=${this.blindSafe}
                                 @sl-change=${(e: Event) => this.answer(() => { this.blindSafe = (e.target as HTMLInputElement).checked; })}>
                        Colour-blind safe only
                    </sl-checkbox>
                    <sl-checkbox size="small" ?checked=${this.reversed}
                                 @sl-change=${(e: Event) => this.answer(() => { this.reversed = (e.target as HTMLInputElement).checked; })}>
                        Reverse
                    </sl-checkbox>
                </div>
                ${filterChangesNothing
                    ? html`<div class="muted">Every one of these is colour-blind safe.</div>`
                    : nothing}
                ${schemes.length === 0
                    ? html`<div class="warning">
                        No ${this.blindSafe ? 'colour-blind-safe ' : ''}scheme has ${this.neededColors()} colours.
                        Use fewer classes${this.blindSafe ? ', or allow schemes that are not rated safe' : ''}.
                      </div>`
                    : html`
                        <div class="attribute-list">
                            ${schemes.map((scheme) => html`
                                <button class="choice" type="button"
                                        aria-pressed=${String(scheme.name === selected?.name)}
                                        @click=${() => this.answer(() => {
                                            this.schemeName = scheme.name;
                                            this.schemeOpen = false;
                                        })}>
                                    <span class="scheme-row">
                                        <span class="ramp">${scheme.colors.map((color) => html`<span style="background:${color}"></span>`)}</span>
                                        <span class="scheme-name">${scheme.name}</span>
                                        <span class=${`flag ${scheme.blind === 'ok' ? 'ok' : 'no'}`}>
                                            ${scheme.blind === 'ok' ? 'colour-blind ok'
                                                : scheme.blind === 'unknown' ? 'not rated' : 'not colour-blind safe'}
                                        </span>
                                    </span>
                                </button>
                            `)}
                        </div>
                    `}
            </div>
        `;
    }

    private renderOpacity(): TemplateResult {
        // The strip belongs *here*, next to the control, and not only in the
        // class preview: a colouring by neighbours has no legend at all (its
        // individual colours mean nothing), so there was nothing on screen that
        // answered the slider, and the note about the scheme list read as a
        // claim that opacity was being ignored.
        const asDrawn = this.appliedColors();
        return html`
            <div class="question">
                <h3>Opacity</h3>
                <div class="row">
                    <input type="range" min="0" max="1" step="0.05" .value=${String(this.opacity)}
                           @input=${(e: Event) => this.answer(() => { this.opacity = Number((e.target as HTMLInputElement).value); })}>
                    <span>${Math.round(this.opacity * 100)}%</span>
                    ${asDrawn.length > 0 ? html`
                        <span class="muted">as drawn</span>
                        <span class="as-drawn">
                            ${asDrawn.map((color) => html`
                                <span class="preview-swatch-wrap">
                                    <span class="preview-swatch" style="background:${color};opacity:${this.opacity}"></span>
                                </span>
                            `)}
                        </span>
                    ` : nothing}
                </div>
                ${this.mode === 'single' ? nothing : html`
                    <div class="muted">The scheme list above stays at full strength, so the colours can be told apart.</div>`}
            </div>
        `;
    }

    private renderSize(): TemplateResult | typeof nothing {
        const spec = ROLE_SIZE[this.currentRole()];
        const authored = this.sizeIsAuthoredExpression();
        if (!spec || (this.size === null && !authored)) return nothing;
        // One fixed radius would contradict the radius the value is drawing.
        if (this.sizesByValue()) return nothing;
        // While the authored expression still stands the slider has no value to
        // show, so it rests at its minimum and means nothing until moved.
        const fromData = authored && this.size === null;
        return html`
            <div class="question">
                <h3>${spec.label}</h3>
                <div class="row">
                    <input type="range" min=${spec.min} max=${spec.max} step=${spec.step}
                           .value=${String(this.size ?? spec.min)}
                           @input=${(e: Event) => this.answer(() => { this.size = Number((e.target as HTMLInputElement).value); })}>
                    <span>${fromData ? 'from the data' : `${this.size}${spec.unit}`}</span>
                </div>
                ${fromData ? html`
                    <div class="muted">
                        This layer sizes itself from the data. Moving this replaces that with one fixed size.
                    </div>` : nothing}
            </div>
        `;
    }

    /** The colours this style will actually paint with, in order. */
    private appliedColors(): string[] {
        if (this.mode === 'single') return [this.singleColor];
        const scheme = this.currentScheme();
        if (!scheme) return [];
        // Both colourings that hand colours out rather than assigning them a
        // meaning have no legend to read the palette back from.
        if (this.mode === 'neighbours') return [...scheme.colors];
        if (this.cyclesCategories()) return [...scheme.colors];
        const built = this.built();
        return built ? built.legend.map((entry) => entry.color) : [...scheme.colors];
    }

    private renderPreview(): TemplateResult | typeof nothing {
        const style = this.built();
        // An entry labelled '' is hidden, the same convention the legend uses —
        // which is what keeps a one-colour style from showing a nameless swatch
        // under the colour it was just chosen with.
        const entries = (style?.legend ?? []).filter((entry) => entry.label !== '');
        if (!style || entries.length === 0) return nothing;
        const numeric = this.numericClassification();
        return html`
            <div class="preview">
                ${entries.map((entry, index) => html`
                    <div class="preview-row">
                        <span class="preview-swatch-wrap">
                            <span class="preview-swatch" style="background:${entry.color};opacity:${this.opacity}"></span>
                        </span>
                        <span>${entry.label}</span>
                        ${numeric?.classes[index]
                            ? html`<span class="preview-count">${numeric.classes[index].count} features</span>`
                            : nothing}
                    </div>
                `)}
            </div>
        `;
    }

    // ── The raster branch ────────────────────────────────────────────────────

    /**
     * What the panel shows while the layer is still answering.
     *
     * Reading a vector-tile layer means waiting for its tiles, which can take
     * seconds. The steps below depend on what comes back — which attributes
     * there are, whether the geometry is areas or points — so there is nothing
     * honest to show yet; but an empty panel reads as a broken one, and a panel
     * that has not opened yet reads as a broken button.
     */
    private renderLoading(): TemplateResult {
        return html`
            <div class="steps">
                <div class="question loading">
                    <sl-spinner></sl-spinner>
                    <div>
                        <h3>Reading the layer</h3>
                        <div class="muted">Waiting for its features to arrive.</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * What a layer without features can be asked.
     *
     * A raster layer is finished pictures: there is no geometry to classify and
     * no paint to build an expression from, so none of the steps above apply.
     * What *can* be asked depends on where the pictures come from — a WMS draws
     * them on request and will draw them differently if asked for another of its
     * named styles, while a plain tile service serves what it has already drawn.
     * Saying which of the two this is, and why, is the honest answer where the
     * panel used to say only "nothing can be restyled here".
     */
    private renderRaster(): TemplateResult {
        if (!this.raster) {
            return html`<p class="muted">
                This layer is drawn by a style document of its own, which this panel does not edit.
            </p>`;
        }
        const wms = readWmsSource(this.raster.sourceConfig);
        if (wms && this.wmsStyles === null && !this.wmsLoading) void this.loadWmsStyles(wms);

        return html`
            <div class="steps">
                ${wms ? this.renderWmsStyles() : html`
                    <div class="question">
                        <h3>Images, not features</h3>
                        <div class="muted">
                            This layer arrives as finished pictures from a tile service, so there is nothing here to
                            colour or classify — the drawing was done before the tiles were sent. Its transparency is
                            what can still be changed.
                        </div>
                    </div>`}
                ${this.renderRasterOpacity()}
                ${this.message ? html`<div class="warning">${this.message}</div>` : nothing}
            </div>
        `;
    }

    private renderWmsStyles(): TemplateResult {
        if (this.wmsLoading) {
            return html`<div class="question"><h3>Styles</h3><div class="muted">Asking the service…</div></div>`;
        }
        const styles = this.wmsStyles ?? [];
        // An engine that cannot say where a live source points cannot repoint it
        // either, so the list is not offered there: a choice that silently fails
        // is worse than no choice (doc §7, "hide what an engine cannot do").
        const repointable = this.raster
            && !!this.sourceControl
            && (this.sourceControl.getTiles?.(this.raster.sourceId) ?? null) !== null;
        if (!repointable) {
            return html`<div class="question">
                <h3>Drawn by the service</h3>
                <div class="muted">
                    A WMS decides the colours itself, and this map engine cannot ask it for a different style
                    once the layer is on the map. Its transparency is what can be changed here.
                </div>
            </div>`;
        }
        if (styles.length < 2) {
            return html`<div class="question">
                <h3>Drawn by the service</h3>
                <div class="muted">
                    ${styles.length === 1
                        ? `This service draws this layer one way only ("${styles[0].title}").`
                        : 'This service advertises no named styles for this layer, so it draws it one way only.'}
                    A WMS decides the colours itself; only its transparency can be changed here.
                </div>
            </div>`;
        }
        return html`
            <div class="question">
                <h3>Which style?</h3>
                <div class="muted">The service draws this layer; these are the ways it offers.</div>
                <div class="choices">
                    ${styles.map((style) => html`
                        <button class="choice" type="button"
                                aria-pressed=${style.name === this.wmsStyle ? 'true' : 'false'}
                                @click=${() => this.applyWmsStyle(style.name)}>
                            <span>${style.title}</span>
                            ${style.legendUrl
                                ? html`<img class="style-legend" src=${style.legendUrl} alt="" loading="lazy">`
                                : nothing}
                        </button>
                    `)}
                </div>
            </div>
        `;
    }

    private renderRasterOpacity(): TemplateResult {
        return html`
            <div class="question">
                <h3>Opacity</h3>
                <div class="row">
                    <input type="range" min="0" max="1" step="0.05" .value=${String(this.rasterOpacity)}
                           @input=${(e: Event) => {
                               this.rasterOpacity = Number((e.target as HTMLInputElement).value);
                               this.sourceControl?.setLayerOpacity(this.rasterOpacity);
                           }}>
                    <span>${Math.round(this.rasterOpacity * 100)}%</span>
                </div>
            </div>
        `;
    }

    private async loadWmsStyles(wms: WmsSourceInfo): Promise<void> {
        this.wmsLoading = true;
        try {
            this.wmsStyles = await fetchWmsStyles(wms);
        } catch {
            // A capabilities document that cannot be read is not an error the
            // user caused, and the layer still draws: say what is missing.
            this.wmsStyles = [];
            this.message = 'The service did not answer with the styles it offers.';
        } finally {
            this.wmsLoading = false;
        }
    }

    private applyWmsStyle(style: string): void {
        const source = this.raster?.sourceConfig;
        if (!source || !this.raster || !this.sourceControl) return;
        // The urls the engine is actually requesting, not the ones the config
        // declared: a WMS given as a bare endpoint plus `layers`/`styles` keys
        // has its GetMap url assembled by the engine, and rewriting the bare
        // endpoint instead would point the layer at a request with no bbox.
        const live = this.sourceControl.getTiles?.(this.raster.sourceId) ?? null;
        const declared = source.tiles ?? source.url;
        const current = live ?? (Array.isArray(declared)
            ? declared as string[]
            : typeof declared === 'string' ? [declared] : []);
        const tiles = current.map((url) => withWmsStyleUrl(url, style));
        if (tiles.length === 0) return;
        if (!this.sourceControl.setTiles(this.raster.sourceId, tiles)) {
            this.message = 'This map engine cannot change a layer\'s style while it is on the map.';
            return;
        }
        this.wmsStyle = style;
        this.message = null;
    }

    /**
     * Whether a labels layer can be built for this group: either the features
     * themselves are in hand, or the source can be re-declared so the engine
     * reads the tiles.
     */
    private canLabel(group: SourceStyleGroup): boolean {
        if ((group.features?.length ?? 0) === 0) return false;
        return group.completeData !== false || !!group.sourceConfig;
    }

    /** The id the labels layer is registered under, derived from the styled one. */
    private labelLayerId(): string {
        return `${this.styledLayerId}-labels${EXTRA_SUBLAYER_SUFFIX}`;
    }

    /**
     * Labelling is a style function, not a geometry one, so it is offered over a
     * tiled source too: `text-field` is an expression the engine evaluates per
     * tile, so the labels follow the data at any pan or zoom. What a tiled
     * source cannot give is the whole dataset, and that only limits the
     * *attribute list* — which is read from the features currently drawn.
     */
    private renderLabels(): TemplateResult | typeof nothing {
        const group = this.currentGroup();
        if (!this.layerHost || !group || !this.mode) return nothing;
        if (!this.canLabel(group)) return nothing;

        const attributes = group.attributes;
        if (attributes.length === 0) return nothing;

        if (!this.labelField) {
            return html`
                <div class="question">
                    <h3>Labels</h3>
                    <div class="muted">Write a value from the data next to each feature.</div>
                    <div class="choices">
                        ${attributes.map((attribute) => html`
                            <button class="choice" type="button"
                                    @click=${() => this.setLabelField(attribute.name)}>
                                <span>${attribute.name}</span>
                            </button>
                        `)}
                    </div>
                </div>
            `;
        }

        return html`
            ${this.renderDone('Labels', this.labelField, () => this.setLabelField(null))}
            <div class="question">
                <h3>Label text</h3>
                <div class="row">
                    <button class="color-button" type="button" title="Pick a text colour"
                            style="background:${this.labelColor}"
                            @click=${(e: Event) => this.openLabelColorPicker(e.currentTarget as HTMLElement)}></button>
                    <input type="range" min="8" max="40" step="1" .value=${String(this.labelSize)}
                           @input=${(e: Event) => {
                               this.labelSize = Number((e.target as HTMLInputElement).value);
                               void this.applyLabels();
                           }}>
                    <span>${this.labelSize} px</span>
                </div>
                <div class="muted">Labels are a layer of their own, so they can be switched off in the legend.</div>
            </div>
        `;
    }

    private setLabelField(field: string | null): void {
        this.labelField = field;
        void this.applyLabels();
    }

    private openLabelColorPicker(button: HTMLElement): void {
        if (this.labelPicker && this.labelPicker.button !== button) {
            this.labelPicker.instance.destroyAndRemove();
            this.labelPicker = null;
        }
        if (!this.labelPicker) {
            this.labelPicker = {
                button,
                instance: createColorPicker({
                    button,
                    value: this.labelColor,
                    onChange: (rgba) => { this.labelColor = rgba; void this.applyLabels(); },
                    onCancel: (original) => { this.labelColor = original; void this.applyLabels(); },
                }),
            };
            this.labelPicker.instance.show();
            return;
        }
        this.labelPicker.instance.setColor(this.labelColor);
        this.labelPicker.instance.show();
    }

    /**
     * Gives the layer its labels, or takes them away again.
     *
     * A **sublayer of the styled layer**, not a layer beside it. To a user the
     * labels are part of the layer, and a layer of their own got that wrong
     * four ways over: a second legend row that sat on top and hid the classes,
     * a second palette button that restyled the labels while looking like the
     * layer's, a second delete button, and labels that outlived the layer they
     * were made from. As a sublayer they read the layer's own source, so there
     * is nothing to copy and nothing to keep in step.
     */
    private async applyLabels(): Promise<void> {
        const host = this.layerHost;
        if (!host?.setExtraSubLayer) return;
        const group = this.currentGroup();
        const had = this.labelsAdded;
        this.labelsAdded = false;

        if (!this.labelField || !group || !this.canLabel(group)) {
            // Only when there is something to take away: attaching a sublayer
            // rebuilds the layer, and doing that for a layer that never had
            // labels would rewrite it — every layer becoming a composite the
            // moment its panel was opened.
            if (had) await host.setExtraSubLayer(this.styledLayerId, null);
            return;
        }

        const ok = await host.setExtraSubLayer(this.styledLayerId, {
            id: this.labelLayerId(),
            type: 'symbol',
            // Names its own legend row; without it the row is called after the
            // sublayer id, which is bookkeeping, not language.
            metadata: { label: `Labels: ${this.labelField}` },
            // The layer's own source: the same features, however they arrive.
            ...(group.sourceId ? { source: group.sourceId } : {}),
            ...(group.sourceLayer ? { 'source-layer': group.sourceLayer } : {}),
            layout: {
                'text-field': ['to-string', ['get', this.labelField]],
                'text-size': this.labelSize,
                'text-allow-overlap': false,
            },
            paint: {
                'text-color': this.labelColor,
                // A halo is not decoration: without it a label over a dark fill
                // or a satellite basemap is unreadable, and this tool has no way
                // to know what it will be drawn over.
                'text-halo-color': '#ffffff',
                'text-halo-width': 1.4,
            },
        });
        this.labelsAdded = ok !== false;
        if (!this.labelsAdded) {
            this.message = 'The map could not add the labels.';
        }
    }

    /** The read-only data view the panel had before: kept, but out of the way. */
    private renderData(group: SourceStyleGroup | null): TemplateResult | typeof nothing {
        if (!group) return nothing;
        return html`
            <div class="row">
                <sl-button size="small" @click=${() => { this.showTable = !this.showTable; }}>
                    ${this.showTable ? 'Hide data' : 'Show data'}
                </sl-button>
                <span class="muted">${group.featureCountLabel}${group.geometryTypes.length > 0 ? ` · ${group.geometryTypes.join(', ')}` : ''}</span>
            </div>
            ${this.showTable && group.featureRows.length > 0 ? html`
                <div class="attribute-table-wrap">
                    <table>
                        <thead>
                            <tr>${Object.keys(group.featureRows[0]).map((name) => html`<th>${name}</th>`)}</tr>
                        </thead>
                        <tbody>
                            ${group.featureRows.slice(0, 50).map((row) => html`
                                <tr>${Object.values(row).map((value) => html`<td>${String(value ?? '')}</td>`)}</tr>
                            `)}
                        </tbody>
                    </table>
                </div>
            ` : nothing}
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'webmapx-layer-style-dialog': WebmapxLayerStyleDialog;
    }
}
