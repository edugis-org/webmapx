/**
 * The layer styler, as a hierarchy rather than a sequence of steps.
 *
 * Specified in `docs/developer/layer-styler-specification.md`. It is the panel
 * both legends open; it replaced the step dialog (`webmapx-layer-style-dialog.ts`,
 * deleted), and what that dialog did and this one does not is listed in the
 * specification under *Not carried over from the step dialog*.
 *
 * The ordering rule is the whole design: a decision comes earlier only if it
 * changes *which decisions exist later*. So the source comes first, then the
 * persistent list of styles drawn from it, then each style's role, then a
 * driver per visual channel, then the constants. Leaf constants gate nothing,
 * so they are never a step — always rendered, always open — and **selecting a
 * value never collapses the control that was selected**, which is the single
 * behaviour that made the old panel unusable for trying three palettes against
 * a live map.
 *
 * Two further properties are requirements rather than niceties:
 *
 * - **Every control opens on what the layer already is.** That is what
 *   `style-decoder.ts` exists for, and why an expression it cannot read is kept
 *   verbatim as `custom` instead of being replaced by a default.
 * - **Opening the panel and closing it changes nothing.** Entries re-encode to
 *   the sublayers they were decoded from, keys this build does not model
 *   included.
 */
import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import type Pickr from '@simonwep/pickr';

import { controlSurfaceStyles } from './internal/control-surface-styles';
import { DATA_OUTLINE } from '../theme/data-colors';
import { createColorPicker } from './internal/color-picker';
import { DraggablePanel, panelChromeStyles } from './styler/panel-chrome';
import {
    CHANNEL_DEFAULTS,
    CHANNEL_LABELS,
    CHANNEL_RANGES,
    COLOR_CHANNELS,
    DASH_PRESETS,
    dashLabel,
    textColumnOf,
    textColumnState,
} from './styler/channel-controls';
import {
    defaultEntry,
    duplicateEntry,
    nextEntryId,
    ROLE_LABELS,
    rolesForGeometry,
    singleColorOf,
    summarizeEntry,
    swatchColorsOf,
} from './styler/style-entry';
import { decodeStyleEntry } from '../utils/style-decoder';
import {
    moveEntryPast,
    readStyleList,
    readStyleListFromTargets,
    writeStyleList,
    type StyleListEntry,
} from './styler/style-list';
import { hasFeatures, isWiderThan } from './styler/style-context';
import type { SourceStyleGroup, StyleDialogContext, ViewBounds } from './styler/style-context';
import { rasterBranch, wmsStyleTiles } from './styler/raster-branch';
import {
    buildDraftStyle,
    draftDocument,
    emptyDraft,
    probeSamples,
    VALUE_SAMPLE,
    type SldDraft,
} from './styler/wms-sld-branch';
import {
    probeGetMapUrl,
    probeSldSupportCached,
    verifyStyledRequest,
    type SldProbeResult,
} from '../utils/wms-sld-probe';
import {
    discoverWmsAttributes,
    valuesFromWfs,
    type WmsAttribute,
    type WmsAttributeSource,
} from '../utils/wms-attributes';
import { withSldBodyUrl, type SldGeometry } from '../utils/wms-sld';
import {
    fetchWmsStyles,
    readWmsSource,
    withWmsStyleUrl,
    type WmsSourceInfo,
    type WmsStyleOption,
} from '../utils/wms-source';
import type { StyleSubLayer } from '../utils/layer-style-model';
import {
    categoricalPaletteColorCount,
    classifyColorChannel,
    classifySizeChannel,
    defaultSettings,
    isNumericType,
    schemesFor,
    METHOD_HINTS,
    METHOD_LABELS,
    OFFERED_METHODS,
    type ClassifySettings,
} from './styler/classify-channel';
import type { ClassificationMethod } from '../utils/classification';
import { colorByAdjacency, coloringKeyFor, coloringKeyValue } from '../utils/topological-coloring';
import type { ColorScheme } from '../utils/color-schemes';
import { NEIGHBOUR_COLOR_FIELD } from '../utils/layer-style-model';
import {
    CHANNEL_KEYS,
    channelsOf,
    encodeStyleEntry,
    type ChannelId,
    type ChannelState,
    type ZoomChannel,
    zoomValueAt,
    scaleZoomChannelTo,
    type StyleRole,
} from '../utils/layer-style-model';
import {
    DIRECTION_LABELS,
    fontStackOf,
    hasMoreOverrides,
    labelMoreSupported,
    placementOf,
    placementOptions,
    readPosition,
    writePosition,
    type LabelDirection,
    type LabelPosition,
} from './styler/label-more';
import { attributeChoiceLabel } from '../utils/attribute-translations';
import { legendSublayerLabel } from '../utils/layer-label';
import { throttle } from '../utils/throttle';

/**
 * The biggest circle a proportional-symbol map draws, and the biggest label.
 *
 * A cap rather than a scale factor, because the radius is √value × coefficient
 * and the coefficient is derived from whatever the largest value happens to be:
 * without a ceiling, one outlier decides the size of the whole map.
 */
/**
 * How long the map may lag the pointer while a control is being dragged.
 *
 * Long enough that a pointer move at screen rate cannot outrun it, short enough
 * that the map still reads as live — which is the whole point of editing style
 * against the map rather than against a form.
 */
const STYLE_APPLY_INTERVAL_MS = 80;

/**
 * How many times a re-read waits for the map to draw what it was asked for, and
 * how long between tries. Three seconds in all: long enough for a tile server to
 * answer, short enough that a layer that draws nothing here stops being asked.
 */
const RESAMPLE_ATTEMPTS = 4;
const RESAMPLE_RETRY_MS = 900;

const MAX_BUBBLE_RADIUS = 28;
const MAX_LABEL_SIZE = 32;

/** How many colours a neighbour colouring spreads a map over by default. */
const DEFAULT_NEIGHBOUR_COLORS = 6;

/** Why the list's own buttons are unavailable, on the button that is unavailable. */
const LIST_LOCKED_REASON = 'This layer is drawn from a style document on the server, so its styles cannot be added to, removed or reordered';

/** What each driver is called where the user meets it. */
const DRIVER_LABELS: Record<ChannelState['driver'], string> = {
    single: 'Single value',
    attribute: 'By attribute',
    neighbours: 'By neighbours',
    zoom: 'Grows with zoom',
    custom: 'Custom (expression)',
};

/** Which palette a neighbour colouring draws from. */
interface NeighbourPalette {
    schemeName: string | null;
    reversed: boolean;
    blindSafe: boolean;
}

@customElement('webmapx-layer-styler')
export class WebmapxLayerStyler extends DraggablePanel {
    @property({ type: Boolean, reflect: true }) visible = false;

    @state() private panelTitle = 'Layer style';
    @state() private list: StyleListEntry[] = [];
    @state() private groups: SourceStyleGroup[] = [];
    /** Which source the style list is showing. Only ever asked about when a layer has several. */
    @state() private sourceId: string | null = null;
    /** The one entry that is open. Opening the panel expands nothing. */
    @state() private expandedId: string | null = null;
    @state() private layerOpacity = 1;
    /** Narrows a long style list. A remote basemap style carries over a hundred entries. */
    @state() private filterText = '';
    @state() private message: string | null = null;

    // ── The raster branch ────────────────────────────────────────────────────
    /** The named styles the WMS service advertises; null until they are read. */
    @state() private wmsStyles: WmsStyleOption[] | null = null;
    @state() private wmsStyle = '';
    @state() private wmsLoading = false;
    /** Whether this service draws a style of our own — measured, see the probe. */
    @state() private sldProbe: SldProbeResult | null = null;
    @state() private sldProbing = false;
    @state() private sldAttributes: WmsAttributeSource | null = null;
    @state() private sldLoadingValues = false;
    @state() private sldDraft: SldDraft = emptyDraft();
    @state() private sldApplied = false;
    @state() private sldClasses: Array<{ label: string; color: string }> = [];
    @state() private sldProblem: string | null = null;
    @state() private sldVerifying = false;
    /**
     * Which attempt the panel is showing the result of.
     *
     * Verifying a style is a request, and a *rejected* request can answer after
     * a later, good one — a long url refused with 431 is not necessarily slower
     * to answer than a short one that draws. Without this, reducing the class
     * count until it works left the earlier refusal on screen, describing a
     * style that is no longer applied: the message was one attempt behind.
     */
    private sldAttempt = 0;

    private layerId = '';
    private context: StyleDialogContext | null = null;
    /**
     * True when the style list can be *written*: the host handed over the
     * layer's real sublayers and the layer can be rebuilt from them.
     *
     * A basemap drawn from a remote style document fails the second half — its
     * 111 sublayers live in the fetched style, not in the config — so offering
     * to add or delete one there would have replaced a working basemap with an
     * empty one. Its paint stays editable, which is the part that does work.
     */
    private listIsWritable = false;
    /**
     * Every change, in the order it was made.
     *
     * Rebuilding a layer removes it and adds it again, and `addLayer` is async;
     * a paint change made while that is in flight is written with
     * `setPaintProperty` to a native layer that is about to be replaced, so the
     * engine reports success, the store mirrors it, the legend updates — and
     * the map never shows it. Serialising the two makes that impossible rather
     * than unlikely.
     */
    private work: Promise<unknown> = Promise.resolve();

    /** The sublayers the panel opened on — what the list is decoded from, and what Reset goes back to. */
    private openedWith: StyleSubLayer[] = [];
    /** True once the user has changed anything, so a late read cannot overwrite their work. */
    private touched = false;
    private pickers = new Map<string, { button: HTMLElement; instance: Pickr }>();
    /**
     * Level-4 answers per channel, keyed `entryId:channel`.
     *
     * They live beside the channel rather than in it because most of them
     * cannot be read back from paint: an expression records the breaks it ended
     * up with, not that they came from quantiles over five classes. The channel
     * stays the single source of what is *drawn*; this is what the controls
     * were last set to.
     */
    @state() private classifySettings = new Map<string, ClassifySettings>();
    /** How many colours a neighbour colouring spreads over, per channel. */
    @state() private neighbourColors = new Map<string, number>();
    /**
     * The palette a neighbour colouring draws from, per channel.
     *
     * Separate from the classification settings because choosing one must not
     * classify anything: a neighbour colouring has no column, and routing it
     * through `updateSettings` would repaint the channel as a classification.
     */
    @state() private neighbourPalettes = new Map<string, NeighbourPalette>();
    /** What the last colouring found, for the isolated-areas note. */
    @state() private lastColoring: ReturnType<typeof colorByAdjacency> | null = null;
    /**
     * Entries whose *More* tier is open. A set rather than one id, and never
     * cleared by the panel: nothing the user opened closes itself.
     */
    @state() private moreOpen = new Set<string>();
    /**
     * What is in a text field while it is being typed in, per entry and field.
     *
     * The field otherwise shows the entry's current name, and that name falls
     * back to the inherited one the moment the field is empty — which would
     * put the inherited name back under the cursor and make the field
     * impossible to clear. Dropped when the edit is finished.
     */
    @state() private textDrafts = new Map<string, string>();

    static styles = [controlSurfaceStyles, panelChromeStyles, css`
        .sections { display: flex; flex-direction: column; gap: 0.6rem; }

        .row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .row > label, .row > .name {
            flex: 0 0 7.5rem;
            font-size: 0.85rem;
            color: var(--color-text-secondary, #5a6773);
        }
        .row input[type="range"] { flex: 1 1 auto; min-width: 0; }
        /* A text field takes the rest of the row: a name and a legend wording
           are both longer than the box a shrink-wrapped input would give them. */
        .row input.grow {
            flex: 1 1 auto;
            min-width: 0;
            font: inherit;
            padding: 0.2rem 0.35rem;
            border: 1px solid var(--color-border, #cbd5df);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            background: var(--color-surface, #fff);
            color: var(--color-text-primary, #16202a);
        }
        .row .value { flex: 0 0 3.5rem; text-align: right; font-variant-numeric: tabular-nums; }

        /* The same "show more..." link the legend uses when it is taller than
           its box, so one pattern means "there is more here" everywhere. */
        .more-toggle {
            position: relative;
            align-self: flex-start;
            padding: 0;
            border: 0;
            background: none;
            color: var(--color-primary, #2b6cb0);
            font: inherit;
            font-size: 0.8rem;
            cursor: pointer;
        }
        .more-toggle:hover { text-decoration: underline; }
        /* Marks a tier holding something other than the defaults, which the
           collapsed row would otherwise hide. */
        .more-toggle.overridden::after {
            content: '';
            position: absolute;
            top: 0.05rem;
            right: -0.55rem;
            width: 0.4rem;
            height: 0.4rem;
            border-radius: 50%;
            background: var(--color-primary, #2b6cb0);
        }

        .source-line {
            font-size: 0.85rem;
            color: var(--color-text-secondary, #5a6773);
        }

        .list-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-weight: 600;
            font-size: 0.9rem;
        }

        .entry {
            border: 1px solid var(--color-border, #cbd5df);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            overflow: hidden;
        }
        .entry + .entry { margin-top: 0.35rem; }
        .entry-head {
            display: flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0.35rem 0.45rem;
            background: var(--color-surface-raised, #f4f6f8);
        }
        .entry-summary {
            flex: 1 1 auto;
            /* A flex item will not shrink below its content unless told to, and
               a sublayer id is one long unbreakable word — without this it
               pushed the reorder and delete buttons out of the row entirely. */
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 0.4rem;
            background: none;
            border: 0;
            padding: 0.1rem;
            font: inherit;
            text-align: left;
            color: inherit;
            cursor: pointer;
        }
        .swatch {
            flex: 0 0 auto;
            width: 0.9rem;
            height: 0.9rem;
            border-radius: 0.15rem;
            border: 1px solid var(--color-border, #cbd5df);
        }
        .entry-actions button {
            background: none;
            border: 0;
            padding: 0.15rem 0.25rem;
            font: inherit;
            color: var(--color-text-secondary, #5a6773);
            cursor: pointer;
        }
        /* Never squeezed out by a long name: the row's controls come first. */
        /* Never squeezed out by a long name: the row's controls come first. */
        .entry-actions { display: flex; align-items: center; gap: 0.1rem; flex: 0 0 auto; }
        /* Icons rather than glyphs: ⧉ and 🗑 are missing from enough system
           fonts to come out as tofu boxes, which is what they did. */
        .entry-actions sl-icon { font-size: 0.85rem; display: block; }
        .entry-actions button:hover:not([disabled]) { color: var(--color-text-primary, #16202a); }
        .entry-actions button[disabled] { opacity: 0.35; cursor: not-allowed; }
        .entry-body {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            padding: 0.5rem;
        }

        .color-button {
            width: 1.6rem;
            height: 1.6rem;
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            border: 1px solid var(--color-border, #cbd5df);
            cursor: pointer;
            padding: 0;
        }

        .custom {
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 0.72rem;
            background: var(--color-surface-raised, #f4f6f8);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            padding: 0.35rem;
            margin: 0;
            overflow-x: auto;
            max-height: 6rem;
        }

        .warning {
            font-size: 0.8rem;
            padding: 0.45rem 0.55rem;
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            background: var(--color-warning-surface, #fff4e0);
            color: var(--color-text-primary, #16202a);
        }
        .muted { font-size: 0.8rem; color: var(--color-text-secondary, #5a6773); }
        .raster { display: flex; flex-direction: column; gap: 0.35rem; }
        .raster p { margin: 0; }
        .choices { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .choice {
            display: flex;
            flex-direction: column;
            gap: 0.15rem;
            align-items: flex-start;
            text-align: left;
            padding: 0.45rem 0.6rem;
            border: 1px solid var(--color-border, #d6dbe1);
            border-radius: var(--webmapx-radius, 6px);
            background: var(--color-surface, #fff);
            color: inherit;
            font: inherit;
            cursor: pointer;
        }
        .choice[aria-pressed="true"] {
            border-color: var(--color-primary, #2b6cb0);
            outline: 2px solid var(--color-primary, #2b6cb0);
            outline-offset: -1px;
        }
        .style-legend { max-width: 100%; max-height: 6rem; margin-top: 0.25rem; }
        .sld { margin-top: 0.35rem; padding-top: 0.5rem; border-top: 1px solid var(--color-border, #d6dbe1); }
        .sld-legend { display: flex; flex-wrap: wrap; gap: 0.35rem; font-size: 0.75rem; }
        .sld-class { display: inline-flex; align-items: center; gap: 0.25rem; }
        .sld-class .swatch { width: 0.75rem; height: 0.75rem; border-radius: 2px; display: inline-block; }
        /* An inline action inside a sentence, which is a control, not decoration. */
        button.link {
            background: none;
            border: 0;
            padding: 0;
            font: inherit;
            color: var(--color-primary, #2b6cb0);
            text-decoration: underline;
            cursor: pointer;
        }

        .filter-row { margin: 0.35rem 0; }
        .filter-row input[type="search"] { flex: 1 1 auto; min-width: 0; }
        /* Which of a multi-source layer's datasets an entry draws. */
        .entry-text { display: flex; flex-direction: column; gap: 0.05rem; min-width: 0; }
        /* One line, clipped: the name identifies the row, and a forty-character
           id wrapping over three lines buries the summary that explains it. */
        .entry-name {
            font-weight: 600;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .entry-detail {
            font-size: 0.78rem;
            color: var(--color-text-secondary, #5a6773);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .source-key {
            margin-left: 0.3rem;
            color: var(--color-text-secondary, #5a6773);
            font-size: 0.75rem;
        }
        .check-row { gap: 0.35rem; }
        /* A checkbox and its words stay on one line: wrapping between them puts
           the label under the box and reads as two controls. */
        .check { display: flex; align-items: center; gap: 0.3rem; font-size: 0.85rem; }
        .check input { flex: 0 0 auto; }
        .checks { display: flex; flex-wrap: wrap; gap: 0.15rem 0.6rem; min-width: 0; }
        .check-row { align-items: flex-start; }

        /* Level 4 sits under the channel it drives, indented so the nesting is
           visible without a box around every classification. */
        .level4 {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
            margin: 0.1rem 0 0.35rem 0.6rem;
            padding-left: 0.5rem;
            border-left: 2px solid var(--color-border-light, #e2e7ec);
        }
        /* Indented by the level-4 rule, so the label column gives room back. */
        .level4 .row > .name { flex-basis: 5.5rem; }
        .schemes { display: flex; flex-wrap: wrap; gap: 0.25rem; }
        .scheme {
            display: flex;
            border: 1px solid var(--color-border, #cbd5df);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            padding: 0;
            overflow: hidden;
            cursor: pointer;
            background: none;
        }
        .scheme span { width: 0.85rem; height: 0.85rem; display: block; }
        .scheme[aria-pressed="true"] { outline: 2px solid var(--color-primary, #2b6cb0); outline-offset: 1px; }
    `];

    protected get isVisible(): boolean { return this.visible; }
    protected closePanel(): void { this.close(); }

    /** Opens the panel on a layer. The same context the step dialog takes. */
    open(context: StyleDialogContext): void {
        this.context = context;
        this.layerId = context.layerId;
        this.panelTitle = context.title;
        this.groups = context.groups;
        this.message = null;
        this.expandedId = null;
        this.classifySettings = new Map();
        this.wmsStyles = null;
        this.wmsLoading = false;
        this.wmsStyle = readWmsSource(context.raster?.sourceConfig)?.style ?? '';
        this.sldProbe = null;
        this.sldProbing = false;
        this.sldAttributes = null;
        this.sldDraft = emptyDraft();
        this.sldApplied = false;
        this.sldClasses = [];
        this.sldProblem = null;
        this.sldVerifying = false;
        // The panel is one element reused for every layer, so a check still in
        // flight from the last time it was open would otherwise answer into
        // this one — describing a style, and a layer, that are no longer here.
        this.sldAttempt++;
        this.destroyPickers();
        this.adopt(context);
        this.visible = true;
        this.showPanel();
        // The style list is readable at once — it is the layer's own sublayers
        // — but a source's feature count and its columns are a read, and on a
        // tiled layer the tiles may not have arrived. So the panel opens on
        // what it already knows and fills the rest in when it answers, rather
        // than holding the panel back behind a spinner.
        void this.loadGroups(context);
        this.watchTheView(context);
    }

    /**
     * Reads the source again when the map comes to rest somewhere wider.
     *
     * A tiled source answers with what the map has *drawn*
     * (`isViewportLimited`), so a panel opened while zoomed out over a layer
     * with a high minzoom sees nothing at all and says so — and used to keep
     * saying it, because nothing read the source a second time. There is no
     * reload button to press, and asking for one is asking the user to know
     * why the panel is wrong.
     *
     * Three conditions, and each one is there to stop this making things
     * worse rather than better:
     *
     * - **Only a source the map answers from the screen.** A `geojson` source
     *   is held whole, so a new extent tells it nothing.
     * - **Only a wider extent.** Panning at the same zoom trades one set of
     *   features for another, which would move the attribute list and the
     *   value ranges under the user while they are reading them. Zooming out
     *   is the one move that can only add.
     * - **Only an answer that has something in it.** Zoom out far enough and a
     *   layer stops drawing entirely; replacing what the panel knows with that
     *   empty answer is exactly the state this exists to get out of.
     */
    private watchTheView(context: StyleDialogContext): void {
        this.unwatchView?.();
        this.unwatchView = context.watchView?.((bounds) => {
            if (this.context !== context || !this.visible) return;
            if (!this.viewportLimited()) return;
            const seen = this.sampledExtent;
            this.sampledExtent = bounds;
            // The first move is the one whose direction is unknown — the panel
            // has no extent to compare with, because it was opened rather than
            // moved to. So it re-reads only if it has nothing, which is the
            // complaint this exists for; after that, only a wider view.
            if (seen ? !isWiderThan(bounds, seen) : hasFeatures(this.groups)) return;
            void this.resampleUntilDrawn(context);
        }) ?? null;
    }

    /**
     * Reads again until the map has something to answer with.
     *
     * `view-change-end` fires when the *camera* has come to rest, which is
     * before the tiles for where it stopped have arrived — so a single read
     * there answers about the screen as it was a moment ago and finds nothing.
     * Measured on the 2D buildings layer: zooming from z9 to z16 and reading
     * once still returned zero features.
     *
     * A few spaced attempts rather than a subscription to tile events: every
     * engine reports loading differently (and two of them barely at all), and
     * the cost of being wrong here is one wasted read of what is on screen.
     * Stops as soon as something is there, and on the next camera move, since
     * that starts its own run.
     */
    private async resampleUntilDrawn(context: StyleDialogContext): Promise<void> {
        const attempt = ++this.sampleAttempt;
        for (let tries = 0; tries < RESAMPLE_ATTEMPTS; tries++) {
            // What the *read* found, not what the panel is holding: the panel
            // keeps the older sample when a read comes back empty, so asking it
            // instead would end the retries on the first attempt, which is the
            // one that is too early by construction.
            const drawn = await this.loadGroups(context, { keepWhenEmpty: true });
            if (this.context !== context || attempt !== this.sampleAttempt) return;
            if (drawn) return;
            await new Promise((resolve) => setTimeout(resolve, RESAMPLE_RETRY_MS));
            if (this.context !== context || attempt !== this.sampleAttempt) return;
        }
    }

    private sampleAttempt = 0;

    /** True while any source the panel is showing answers from the screen. */
    private viewportLimited(): boolean {
        return this.groups.some((group) => group.completeData === false);
    }

    /** Reads the source again; answers whether that read found anything to show. */
    private async loadGroups(
        context: StyleDialogContext,
        options: { keepWhenEmpty?: boolean } = {},
    ): Promise<boolean> {
        if (!context.resample) return false;
        const groups = await context.resample();
        // The user may have closed the panel, or opened it on another layer,
        // while the read was in flight.
        if (this.context !== context) return false;
        // A later read that found nothing is not news: the layer stopped
        // drawing at this zoom. Keeping what the panel already knows is the
        // difference between "here are your columns" and the empty panel the
        // user opened this layer to get away from.
        const drawn = hasFeatures(groups);
        if (options.keepWhenEmpty && !drawn && hasFeatures(this.groups)) return false;
        this.groups = groups;
        // Deliberately not narrowed to a source here. `adopt` sets this to
        // null — every style, whatever it draws from — and picking the first
        // group filters the list by a control the user cannot see (the source
        // dropdown only appears past 12 entries), so a spelling mismatch
        // emptied the panel with no way back.

        // Roles are decided partly by the *source's* geometry — a `line` over
        // polygons is that polygon's outline, and an outline is offered no dash
        // pattern — and the legend opens this panel before it has read the
        // layer, so the first decode had no geometry to go on. Re-read once it
        // does, but never over the user's own edits: a slow tiled source could
        // otherwise land after the first change and undo it.
        if (this.touched || this.openedWith.length === 0) return drawn;
        this.list = readStyleList(this.layerId, this.openedWith, groups);
        return drawn;
    }

    /** The extent the current sample came from, so a later one can be compared with it. */
    private sampledExtent: ViewBounds | null = null;

    private unwatchView: (() => void) | null = null;

    close(): void {
        // Whatever the pointer left behind goes to the map before the panel
        // does: a throttle that drops the last edit is a lost edit.
        this.flushPending();
        this.unwatchView?.();
        this.unwatchView = null;
        this.sampledExtent = null;
        this.visible = false;
        this.destroyPickers();
        this.hidePanel();
    }

    disconnectedCallback(): void {
        this.unwatchView?.();
        this.unwatchView = null;
        this.destroyPickers();
        super.disconnectedCallback();
    }

    /**
     * Reads the layer as it now stands.
     *
     * The sublayers come from the host, not from the style targets: the targets
     * are only the sublayers a panel can edit, so rebuilding the layer from
     * them would silently drop the rest. Without them the panel still styles
     * what it was given, and says so by offering no add or delete.
     */
    private adopt(context: StyleDialogContext): void {
        const sublayers = context.layers?.getSubLayers?.(context.layerId) ?? null;
        const whole = Array.isArray(sublayers) && sublayers.length > 0;
        this.listIsWritable = whole
            && !!context.layers?.setSubLayers
            && context.layers?.canRebuild?.(context.layerId) !== false;
        this.openedWith = whole ? sublayers!.map((sublayer) => ({ ...sublayer })) : [];
        this.touched = false;
        this.list = whole
            ? readStyleList(context.layerId, sublayers!, context.groups)
            : readStyleListFromTargets(context.groups);
        // Every style, whatever it draws from: a layer's sources are its own
        // business, and starting on one of them hid 110 of Liberty's 111
        // sublayers behind a dropdown of raw source ids.
        this.sourceId = null;
    }

    private sourceIds(): string[] {
        const ids = this.groups.map((group) => group.sourceId);
        for (const item of this.list) {
            if (item.sourceId && !ids.includes(item.sourceId)) ids.push(item.sourceId);
        }
        return ids;
    }

    private group(sourceId: string | null): SourceStyleGroup | null {
        return this.groups.find((candidate) => candidate.sourceId === sourceId) ?? null;
    }

    /**
     * The entries the list shows, topmost first.
     *
     * Reversed against the draw order on purpose: the legend lists layers with
     * the one drawn on top at the top, and a panel that contradicted it made
     * the reorder arrows mean the opposite of what they look like.
     */
    private visibleEntries(): StyleListEntry[] {
        const needle = this.filterText.trim().toLowerCase();
        return this.list
            .filter((item) => !this.sourceId || item.sourceId === this.sourceId)
            .filter((item) => !needle || this.entryLabel(item).toLowerCase().includes(needle))
            .slice()
            .reverse();
    }

    private entryLabel(item: StyleListEntry): string {
        const name = this.displayEntryName(item) ?? item.entry.id;
        return item.styleable
            ? `${name} ${summarizeEntry(item.entry, this.context?.attributeLabels)}`
            : `${name} ${item.entry.origin?.type ?? ''}`;
    }

    /**
     * The name shown for one entry.
     *
     * A name the user has typed wins, because it is the newest answer and the
     * origin still carries the one it was opened with until the rebuild lands.
     * `authored: false` asks for the name the entry would have *without* one,
     * which is what the rename field shows as its placeholder.
     */
    private displayEntryName(item: StyleListEntry, options: { authored?: boolean } = {}): string | null {
        if (options.authored !== false && item.entry.title) return item.entry.title;
        const rawId = item.entry.id;
        const origin = options.authored === false
            ? { ...(item.entry.origin ?? {}), metadata: undefined }
            : item.entry.origin;
        // `authored: false` asks what the style is called *without its own
        // name* — the placeholder under the Name field. Only the sublayer's own
        // metadata is set aside: a single sublayer inherits the layer's name
        // ("Provincienamen (2023)"), and dropping that too showed the type
        // word `label` as if the style had no name at all.
        const label = legendSublayerLabel(
            this.context?.layerMeta ?? null,
            origin as Record<string, unknown> | null | undefined,
            rawId,
            this.list.length === 1,
            this.layerId,
        );
        return label || null;
    }

    /**
     * A source named the way a person would say it.
     *
     * The ids are engine bookkeeping — `openfreemap-liberty:style:openfreemap-liberty:openmaptiles`
     * — and a dropdown of those is unreadable. The last segment is the key the
     * style itself uses.
     */
    private sourceLabel(sourceId: string): string {
        const group = this.group(sourceId);
        const key = sourceId.split(':').pop() || sourceId;
        return group ? `${key} — ${group.featureCountLabel}` : key;
    }

    // ── Applying ─────────────────────────────────────────────────────────────

    /**
     * Pushes one entry's change to the map.
     *
     * Paint goes through `apply`, which sets properties in place; a layout
     * change (a label's column or its size) cannot, so it rebuilds the layer
     * from the whole list. The difference is invisible to the user and costly
     * enough to be worth keeping: MapLibre sets a paint property without
     * touching the source, while a rebuild re-adds the layer.
     */
    private applyEntry(item: StyleListEntry, changed: ChannelId): void {
        this.schedule(`${item.entry.id}:${changed}`, () => {
            // Read the entry back rather than closing over the one that was
            // current when the pointer moved: a throttled write lands after
            // later edits to the same entry, and writing the older object would
            // undo them.
            const latest = this.list.find((candidate) => candidate.entry.id === item.entry.id) ?? item;
            this.work = this.work.then(() => this.applyEntryNow(latest, changed));
        });
    }

    /**
     * Holds the newest write per channel and lets it out once per interval.
     *
     * A colour picker emits on every pointer move, and for a classified channel
     * each of those rebuilt the whole classification — every feature read, the
     * breaks recomputed, the expression rebuilt — where a single colour is one
     * paint key. Cheap enough to go unnoticed on MapLibre and a few thousand
     * features; not cheap on OpenLayers, which has no `setPaintProperty` and
     * rebuilds the layer for every paint change.
     *
     * Keyed per entry and channel rather than one slot for everything: dragging
     * a width and then a colour inside one interval is two different writes,
     * and a single slot would drop the first. The map is one interval behind
     * the pointer at worst, and `flushPending` closes that gap wherever the
     * answer is about to be read — closing the panel, resetting it, rebuilding
     * the layer.
     */
    private schedule(key: string, job: () => void): void {
        this.pending.set(key, job);
        this.releasePending();
    }

    private readonly pending = new Map<string, () => void>();

    private readonly releasePending = throttle(() => {
        const jobs = [...this.pending.values()];
        this.pending.clear();
        for (const job of jobs) job();
    }, STYLE_APPLY_INTERVAL_MS);

    /** Lets every waiting write out now. See `releasePending`. */
    private flushPending(): void {
        this.releasePending.flush();
        if (this.pending.size === 0) return;
        const jobs = [...this.pending.values()];
        this.pending.clear();
        for (const job of jobs) job();
    }

    private applyEntryNow(item: StyleListEntry, changed: ChannelId): void {
        const encoded = encodeStyleEntry(item.entry);
        // Layout is not paint, and `apply` only writes paint — read which it is
        // from the channel map rather than listing the layout channels here,
        // where the list would go stale the next time one is added.
        const layoutChange = CHANNEL_KEYS[item.entry.role]?.[changed]?.slot === 'layout';
        // A *removal* cannot travel as paint: `updateLayerStyle` merges what it
        // is given, so a paint object that simply lacks `line-dasharray` leaves
        // the line dashed. The layer has to be rebuilt without the key.
        const removed = item.entry.channels[changed] === undefined;
        // A fill's own edge has to be declared when the layer is *built*, on
        // both engines that draw one.
        //
        // MapLibre decides whether a fill carries outline geometry as it
        // uploads the layer, and `setPaintProperty` afterwards does not
        // re-bucket it: measured on 1527 polygons, setting `fill-outline-color`
        // on a live fill layer changed not one pixel, while re-adding the layer
        // with the identical value drew every edge. OpenLayers builds its style
        // function from the GL document once, so a later paint write is equally
        // invisible there. Both engines report success, so nothing but the map
        // says otherwise — which is what made this look like OpenLayers lacking
        // the feature. It does not: `ol-mapbox-style` reads the key, spelled as
        // `layer.type + '-outline-color'`.
        const declaredAtBuild = changed === 'fillOutline';
        if (layoutChange || removed || declaredAtBuild || !this.context?.apply) {
            // Already inside the queue, so this rebuild cannot overlap another.
            return void this.rebuildNow();
        }
        const paint = encoded.paint ?? {};
        const applied = this.context.apply(item.entry.id, paint);
        this.message = applied === false
            ? 'The map did not accept this change: this part of the layer is described in the legend but is not drawn on the map.'
            : null;
    }

    /**
     * Puts the layer back exactly as the panel found it.
     *
     * The whole sublayer list, not a paint per sublayer: a style the user added
     * or deleted during the session cannot be undone by repainting, which is
     * what the old panel's `originalPaint` could not do. The snapshot is taken
     * at open and is the same object the list was decoded from, so this is the
     * one operation guaranteed to land on byte-identical paint.
     */
    private async resetStyle(): Promise<void> {
        // Dropped rather than flushed: putting the layer back and then writing
        // one last edit over it is the one order that cannot be right.
        this.pending.clear();
        if (this.openedWith.length === 0) {
            this.message = 'This panel has nothing to put back: it never read the layer as a whole.';
            return;
        }
        const host = this.context?.layers;
        if (host?.setSubLayers && this.listIsWritable) {
            const ok = await host.setSubLayers(this.layerId, this.openedWith.map((sublayer) => ({ ...sublayer })));
            if (!ok) {
                this.message = 'The map did not accept the original styles.';
                return;
            }
        } else if (this.context?.apply) {
            // A layer that cannot be rebuilt can still be repainted, which is
            // enough here: without a writable list nothing could have been
            // added or removed in the first place.
            for (const sublayer of this.openedWith) {
                if (sublayer.id) this.context.apply(sublayer.id, (sublayer.paint ?? {}) as Record<string, unknown>);
            }
        }
        this.list = readStyleList(this.layerId, this.openedWith, this.groups);
        this.classifySettings = new Map();
        this.expandedId = null;
        this.touched = false;
        this.message = null;
    }

    /** Rewrites the layer from the style list — what adding, deleting and reordering need. */
    private rebuild(): void {
        // A rebuild re-adds the layer from the whole list, so a paint write
        // still waiting would be applied to a layer that no longer exists.
        this.flushPending();
        this.work = this.work.then(() => this.rebuildNow());
    }

    private async rebuildNow(): Promise<void> {
        const host = this.context?.layers;
        if (!host?.setSubLayers || !this.listIsWritable) {
            this.message = 'This layer cannot be rebuilt here, so the style list cannot be changed. Its existing styles can still be edited.';
            return;
        }
        const ok = await host.setSubLayers(this.layerId, writeStyleList(this.list) as Array<Record<string, unknown>>);
        this.message = ok ? null : 'The map did not accept the new style list.';
        if (ok) this.refreshOrigins();
    }

    /**
     * Re-points each entry at the sublayer the map now holds.
     *
     * A rebuild replaces every native layer, so the objects the entries were
     * decoded from describe layers that no longer exist. Keeping the channels
     * but refreshing what they are *diffed against* is what makes the next
     * paint change address the map as it now stands — and keeps Reset honest,
     * since an untouched channel still re-encodes to what is drawn.
     */
    private refreshOrigins(): void {
        const sublayers = this.context?.layers?.getSubLayers?.(this.layerId);
        if (!Array.isArray(sublayers)) return;
        const byId = new Map(sublayers.map((sublayer) => [String(sublayer.id ?? ''), sublayer]));
        this.list = this.list.map((item) => {
            const origin = byId.get(item.entry.id);
            if (!origin) return item;
            const refreshed = decodeStyleEntry(origin, this.group(item.sourceId)?.geometryTypes?.join(' '));
            return {
                ...item,
                entry: { ...item.entry, origin: refreshed.origin, originChannels: refreshed.originChannels },
            };
        });
    }

    /**
     * Records a change to one channel and applies it.
     *
     * `silent` records without applying, for the half of a two-key control that
     * would otherwise push a half-finished change to the map.
     */
    private setChannel(
        item: StyleListEntry,
        channel: ChannelId,
        state: ChannelState | undefined,
        options: { silent?: boolean } = {},
    ): void {
        const current = this.list.find((candidate) => candidate.entry.id === item.entry.id) ?? item;
        const channels = { ...current.entry.channels };
        if (state) channels[channel] = state;
        else delete channels[channel];
        // A line that never said how its corners are drawn gets the GL
        // default — miter joins, butt caps — which nobody picked. The first
        // edit rounds it, as a new line entry starts; opening the panel alone
        // still changes nothing. A line that does say keeps what it says.
        const rounds = (current.entry.role === 'line' || current.entry.role === 'outline')
            && channel !== 'lineJoin' && channel !== 'lineCap'
            && !channels.lineJoin && !channels.lineCap;
        if (rounds) {
            channels.lineJoin = { driver: 'single', value: 'round' };
            channels.lineCap = { driver: 'single', value: 'round' };
        }
        const entry = { ...current.entry, channels };
        this.list = this.list.map((candidate) => (candidate === current ? { ...candidate, entry } : candidate));
        this.touched = true;
        const updated = this.list.find((candidate) => candidate.entry.id === entry.id)!;
        // Layout, so it goes as a write of its own: a paint write carries none.
        if (rounds) this.applyEntry(updated, 'lineJoin');
        if (options.silent) return;
        this.applyEntry(updated, channel);
    }

    /**
     * Renames one style, or clears the name again.
     *
     * The name lives in the sublayer's `metadata.label`, which is what the
     * legend reads, so this is not a second name kept beside the legend's — it
     * *is* the legend's. A rebuild rather than a paint write: metadata is part
     * of the layer's definition, and no engine offers to change it in place.
     */
    private setEntryField(
        item: StyleListEntry,
        field: 'title' | 'noDataLabel',
        value: string,
        options: { finished?: boolean } = { finished: true },
    ): void {
        const current = this.list.find((candidate) => candidate.entry.id === item.entry.id) ?? item;
        const trimmed = value.trim();
        const unchanged = (current.entry[field] ?? '') === trimmed;
        if (!unchanged) {
            const entry = { ...current.entry };
            if (trimmed) entry[field] = trimmed;
            else delete entry[field];
            this.list = this.list.map((candidate) => (candidate === current ? { ...candidate, entry } : candidate));
            this.touched = true;
            const updated = this.list.find((candidate) => candidate.entry.id === entry.id)!;
            // Straight into the legend, as typed: metadata is not drawn, so it
            // needs no rebuild where the map can take it on its own.
            if (this.writeEntryMetadata(updated)) {
                this.metadataWritten.add(entry.id);
                return;
            }
        }
        // A map that cannot take metadata on its own gets one rebuild, when the
        // edit is finished rather than per keystroke.
        if (options.finished && !this.metadataWritten.has(current.entry.id) && !unchanged) this.rebuild();
    }

    /** Entries whose metadata reached the map without a rebuild this session. */
    private readonly metadataWritten = new Set<string>();

    private writeEntryMetadata(item: StyleListEntry): boolean {
        const write = this.context?.layers?.setSubLayerMetadata;
        if (!write || !this.context) return false;
        const metadata = encodeStyleEntry(item.entry).metadata;
        return write(this.context.layerId, item.entry.id,
            metadata && typeof metadata === 'object' ? metadata as Record<string, unknown> : null);
    }

    /** Keeps a text field's typed value while the edit is in progress. See `textDrafts`. */
    private setTextDraft(key: string, value: string | null): void {
        const drafts = new Map(this.textDrafts);
        if (value === null) drafts.delete(key);
        else drafts.set(key, value);
        this.textDrafts = drafts;
    }

    private addEntry(role: StyleRole): void {
        this.touched = true;
        const id = nextEntryId(this.layerId, this.list.map((item) => item.entry.id));
        const sourceId = this.sourceId ?? this.sourceIds()[0] ?? '';
        const entry = defaultEntry(role, id);
        entry.origin = this.sublayerShell(sourceId);
        this.list = [...this.list, { entry, sourceId, styleable: true }];
        this.expandedId = id;
        this.rebuild();
    }

    /**
     * What a new entry's sublayer inherits from the source it draws.
     *
     * `source` and `source-layer` are not style — they are which data the
     * sublayer reads — so a new entry copies them from a sublayer already
     * drawing that source rather than inventing them.
     */
    private sublayerShell(sourceId: string): Record<string, unknown> {
        const sibling = this.list.find((item) => item.sourceId === sourceId)?.entry.origin;
        const shell: Record<string, unknown> = {};
        if (sibling && typeof sibling.source === 'string') shell.source = sibling.source;
        if (sibling && typeof sibling['source-layer'] === 'string') shell['source-layer'] = sibling['source-layer'];
        return shell;
    }

    private duplicate(item: StyleListEntry): void {
        this.touched = true;
        const id = nextEntryId(this.layerId, this.list.map((entry) => entry.entry.id));
        const copy = duplicateEntry(item.entry, id);
        copy.origin = this.sublayerShell(item.sourceId);
        const index = this.list.indexOf(item);
        this.list = [...this.list.slice(0, index + 1), { ...item, entry: copy }, ...this.list.slice(index + 1)];
        this.expandedId = id;
        this.rebuild();
    }

    private removeEntry(item: StyleListEntry): void {
        this.touched = true;
        this.list = this.list.filter((candidate) => candidate !== item);
        if (this.expandedId === item.entry.id) this.expandedId = null;
        this.rebuild();
    }

    /**
     * Moves an entry past the neighbour the user can actually see.
     *
     * Under a filter the adjacent entry in the draw order may not be on screen,
     * and swapping with it would look like nothing happened.
     */
    private move(item: StyleListEntry, neighbour: StyleListEntry | undefined): void {
        if (!neighbour) return;
        this.touched = true;
        this.list = moveEntryPast(this.list, item.entry.id, neighbour.entry.id);
        this.rebuild();
    }

    private setLayerOpacity(value: number): void {
        this.layerOpacity = value;
        this.context?.sourceControl?.setLayerOpacity(value);
    }

    // ── Render ───────────────────────────────────────────────────────────────

    protected render(): TemplateResult {
        return html`
            <div class="panel" role="dialog" aria-modal="false" aria-label=${this.panelTitle}
                 style=${this.panelPosition()}>
                <header class="panel-head" title="Drag to move"
                        @pointerdown=${(event: PointerEvent) => this.startDrag(event)}>
                    <sl-icon class="drag-grip" name="grip-vertical" aria-hidden="true"></sl-icon>
                    <span class="panel-title">${this.panelTitle}</span>
                    <button class="panel-close" type="button" aria-label="Close" @click=${() => this.close()}>✕</button>
                </header>
                <div class="panel-body">
                    <div class="sections">
                        ${this.renderLayerOpacity()}
                        ${this.renderSource()}
                        ${this.renderRaster()}
                        ${this.renderList()}
                        ${this.message ? html`<div class="warning">${this.message}</div>` : nothing}
                    </div>
                </div>
                <div class="footer">
                    <sl-button size="small" ?disabled=${!this.touched} @click=${() => void this.resetStyle()}>Reset</sl-button>
                    <sl-button size="small" variant="primary" @click=${() => this.close()}>Done</sl-button>
                </div>
            </div>
        `;
    }

    /**
     * Layer opacity: above the source, visibly outside the per-style structure.
     *
     * It is the same value the legend slider shows, and it applies to every
     * style on the layer — so it cannot sit inside a style entry, where a user
     * would reasonably expect it to apply to that entry alone. The label says
     * so, because the visual result overlaps with a paint opacity.
     */
    private renderLayerOpacity(): TemplateResult | typeof nothing {
        if (!this.context?.sourceControl) return nothing;
        return html`
            <div class="row">
                <label for="layer-opacity">Layer opacity</label>
                <input id="layer-opacity" type="range" min="0" max="1" step="0.05"
                       .value=${String(this.layerOpacity)}
                       @input=${(event: Event) => this.setLayerOpacity(Number((event.target as HTMLInputElement).value))}>
                <span class="value">${Math.round(this.layerOpacity * 100)}%</span>
            </div>
        `;
    }

    /**
     * Level 0: which data is being styled.
     *
     * A line rather than a dropdown, because choosing a source is not how a
     * user finds a style — the style list names its own source per entry, and a
     * dropdown of engine source ids hid 110 of a basemap's 111 sublayers behind
     * a value nobody would think to change. Narrowing by source lives in the
     * filter row, where it is an aid rather than a gate.
     */
    private renderSource(): TemplateResult | typeof nothing {
        const group = this.group(this.sourceId) ?? this.groups[0] ?? null;
        const viewportLimited = group?.completeData === false;
        return html`
            ${group ? html`<div class="source-line">Data: ${group.featureCountLabel}</div>` : nothing}
            ${viewportLimited ? html`
                <div class="warning">
                    This layer arrives as tiles, so what the panel knows about it is what the map has drawn.
                    Move to a part of the map that represents the whole before classifying.
                </div>` : nothing}
        `;
    }

    /**
     * What a layer made of pictures can be asked.
     *
     * The levels below do not apply to a raster layer at all — there is no
     * geometry to classify and no paint to build an expression from — so this
     * sits above the style list and answers instead of it. Which question is
     * asked is `rasterBranch`'s decision, not this method's; the point of
     * naming all four is that "nothing can be styled here" is a different
     * statement from "this service draws it one way only", and the user can act
     * on the second (ask the service's owner) but not on the first.
     *
     * Layer opacity is deliberately not repeated here: it is already at the top
     * of the panel, applies to every layer, and a raster is not a special case
     * of it.
     */
    private renderRaster(): TemplateResult | typeof nothing {
        const raster = this.context?.raster;
        if (!raster) return nothing;
        const wms = readWmsSource(raster.sourceConfig);
        if (wms && this.wmsStyles === null && !this.wmsLoading) void this.loadWmsStyles(wms);
        // The service's own styles and a style of our own are two different
        // questions, asked in parallel: the first is a capabilities read, the
        // second two GetMaps, and neither should wait on the other.
        const repointable = (this.context?.sourceControl?.getTiles?.(raster.sourceId) ?? null) !== null;
        if (wms && repointable && this.sldProbe === null && !this.sldProbing) void this.loadSldBranch(wms);
        if (this.wmsLoading) {
            return html`<div class="raster"><strong>Styles</strong>
                <p class="muted">Asking the service which ways it can draw this layer…</p></div>`;
        }
        const branch = rasterBranch(raster, this.context?.sourceControl, this.wmsStyles);
        if (branch.kind === 'tiles') {
            return html`<div class="raster"><strong>Images, not features</strong>
                <p class="muted">
                    This layer arrives as finished pictures from a tile service, so there is nothing here to colour
                    or classify — the drawing was done before the tiles were sent. Its opacity is above.
                </p></div>`;
        }
        if (branch.kind === 'fixed') {
            return html`<div class="raster"><strong>Drawn by the service</strong>
                <p class="muted">
                    A WMS decides the colours itself, and this map engine cannot ask it for a different style once
                    the layer is on the map. Its opacity is what can be changed here.
                </p></div>${this.renderSldBranch(wms!)}`;
        }
        if (branch.kind === 'single') {
            return html`<div class="raster"><strong>Drawn by the service</strong>
                <p class="muted">
                    ${branch.only
                        ? `This service draws this layer one way only ("${branch.only.title}").`
                        : 'This service advertises no named styles for this layer, so it draws it one way only.'}
                    A WMS decides the colours itself; only its opacity can be changed here.
                </p></div>${this.renderSldBranch(wms!)}`;
        }
        const styles = this.wmsStyles ?? [];
        return html`
            <div class="raster">
                <strong>Which style?</strong>
                <p class="muted">
                    ${this.sldApplied
                        ? 'Your own style is drawing this layer. Choosing one of these hands it back to the service.'
                        : 'The service draws this layer; these are the ways it offers.'}
                </p>
                <div class="choices">
                    ${styles.map((style) => html`
                        <button class="choice" type="button"
                                aria-pressed=${!this.sldApplied && style.name === this.wmsStyle ? 'true' : 'false'}
                                @click=${() => this.applyWmsStyle(style.name)}>
                            <span>${style.title}</span>
                            ${style.legendUrl
                                ? html`<img class="style-legend" src=${style.legendUrl} alt="" loading="lazy">`
                                : nothing}
                        </button>
                    `)}
                </div>
            </div>
            ${this.renderSldBranch(wms!)}
        `;
    }

    /**
     * The styler's own style for a WMS layer.
     *
     * Offered only where the service has been *seen* to honour one: the
     * capabilities flag is worthless in practice (of twenty WMS endpoints in
     * our own configs, the four that declare the element declare "no", while
     * the two that actually draw a user style declare nothing), so this waits
     * for a probe rather than reading a document. Hidden entirely when the
     * answer is no — an unexplained disabled control on a third-party service
     * is worse than no control.
     */
    private renderSldBranch(wms: WmsSourceInfo): TemplateResult | typeof nothing {
        // An engine that cannot say where a live source points cannot repoint it
        // either, so there is no way to send the document — the same gate the
        // named-style list uses, and for the same reason.
        const raster = this.context?.raster;
        const repointable = !!raster
            && (this.context?.sourceControl?.getTiles?.(raster.sourceId) ?? null) !== null;
        if (!repointable) return nothing;
        if (this.sldProbing) {
            return html`<p class="muted">Asking the service whether it can draw a style of your own…</p>`;
        }
        if (!this.sldProbe?.supported) {
            if (this.sldProbe?.reason === 'no-ink') {
                // Answered about the moment, not about the service — so the
                // panel offers to look again rather than making the user close
                // it, move the map and open it a second time.
                return html`
                    <div class="raster">
                        <p class="muted">
                            This layer draws nothing where the map is looking, so it cannot be styled here yet.
                            Move to somewhere it has data, then look again.
                        </p>
                        <div class="row">
                            <sl-button size="small" @click=${() => void this.retrySldProbe(wms)}>Look again</sl-button>
                        </div>
                    </div>`;
            }
            return nothing;
        }
        const attributes = this.sldAttributes?.attributes ?? [];
        const sampled = this.sldAttributes?.from === 'featureinfo';
        return html`
            <div class="raster sld">
                <strong>Or draw it yourself</strong>
                <p class="muted">This service will draw its data the way you ask, so it can be coloured here.</p>
                <div class="row">
                    <label for="sld-driver">Colour by</label>
                    <select id="sld-driver" .value=${this.sldDraft.driver}
                            @change=${(event: Event) => this.setDraft({
                                driver: (event.target as HTMLSelectElement).value as SldDraft['driver'],
                            })}>
                        <option value="single">One colour</option>
                        <option value="attribute" ?disabled=${attributes.length === 0}>An attribute</option>
                    </select>
                </div>
                ${this.sldDraft.driver === 'single' ? html`
                    <div class="row">
                        <label>Colour</label>
                        <button id="sld-color" class="color-button" type="button"
                                style=${`background:${this.sldDraft.color}`}
                                aria-label=${`Colour: ${this.sldDraft.color}`}
                                @click=${(event: Event) => this.openPicker('sld:color',
                                    event.currentTarget as HTMLElement, this.sldDraft.color,
                                    (rgba) => this.setDraft({ color: rgba }))}></button>
                    </div>` : this.renderSldAttribute(attributes, sampled)}
                <div class="row">
                    <label>Outline</label>
                    <button id="sld-stroke" class="color-button" type="button"
                            style=${`background:${this.sldDraft.strokeColor || 'transparent'}`}
                            aria-label=${`Outline: ${this.sldDraft.strokeColor || 'none'}`}
                            @click=${(event: Event) => this.openPicker('sld:stroke',
                                event.currentTarget as HTMLElement, this.sldDraft.strokeColor || '#333333',
                                (rgba) => this.setDraft({ strokeColor: rgba }))}></button>
                    <button type="button" @click=${() => this.setDraft({ strokeColor: '' })}
                            ?disabled=${!this.sldDraft.strokeColor}>None</button>
                </div>
                ${this.sldClasses.length > 1 ? html`
                    <div class="sld-legend">
                        ${this.sldClasses.map((item) => html`
                            <span class="sld-class">
                                <span class="swatch" style="background:${item.color}"></span>${item.label}
                            </span>`)}
                    </div>` : nothing}
                ${this.sldProblem ? html`<div class="warning">${this.sldProblem}</div>` : nothing}
                <div class="row">
                    <!-- Never disabled while a check is in flight: a check is
                         about a style the user may already have changed, and
                         swallowing the next click is worse than superseding the
                         check, which the attempt counter makes safe. -->
                    <sl-button size="small" variant="primary"
                               ?disabled=${this.sldLoadingValues}
                               @click=${() => void this.applySld(wms)}>Draw it</sl-button>
                    ${this.sldVerifying ? html`<span class="muted">Checking…</span>` : nothing}
                    <sl-button size="small" ?disabled=${!this.sldApplied}
                               @click=${() => this.clearSld()}>Back to the service's style</sl-button>
                </div>
            </div>
        `;
    }

    private renderSldAttribute(attributes: WmsAttribute[], sampled: boolean): TemplateResult {
        return html`
            <div class="row">
                <label for="sld-attribute">Attribute</label>
                <select id="sld-attribute" .value=${this.sldDraft.attribute ?? ''}
                        @change=${(event: Event) => void this.chooseSldAttribute((event.target as HTMLSelectElement).value)}>
                    <option value="">Choose…</option>
                    ${attributes.map((attribute) => html`
                        <option value=${attribute.name} ?selected=${attribute.name === this.sldDraft.attribute}>
                            ${attribute.name}${attribute.numeric ? ' (number)' : ''}
                        </option>`)}
                </select>
            </div>
            <div class="row">
                <label for="sld-classes">Classes</label>
                <input id="sld-classes" type="number" min="2" max="9" .value=${String(this.sldDraft.classCount)}
                       @input=${(event: Event) => void this.setDraft({
                           classCount: Number((event.target as HTMLInputElement).value) || 5,
                       })}>
            </div>
            ${this.sldLoadingValues ? html`<p class="muted">Reading values from the service…</p>` : nothing}
            ${sampled ? html`
                <p class="muted">
                    This service publishes no data service alongside its pictures, so these column names come from a
                    single feature and there are no values to classify by. One colour is what can be drawn here.
                </p>` : nothing}
        `;
    }

    /** Every draft change re-derives the legend, so the panel shows what it will send. */
    private setDraft(change: Partial<SldDraft>): void {
        // Any edit abandons a verification still in flight: whatever it says, it
        // says it about a style the user has already moved on from.
        this.sldAttempt++;
        this.sldVerifying = false;
        this.sldDraft = { ...this.sldDraft, ...change };
        const built = buildDraftStyle(this.sldDraft);
        this.sldClasses = built.classes;
        this.sldProblem = built.problem ?? null;
    }

    /**
     * What the layer is made of, which decides the symbolizer.
     *
     * A WMS says nothing about this, so it comes from the sibling WFS's schema
     * where there is one. Guessing "areas" instead would be silent and wrong on
     * every point layer — RCE's monuments, one of the two services in our own
     * configs that honours a user style, is points — so an unknown geometry is
     * passed through as unknown and the document carries every symbolizer.
     */
    private sldGeometry(): SldGeometry {
        // The schema where there is one, what the probe *drew* otherwise: both
        // are observations, and a guess here is invisible until the map comes
        // back empty (a polygon style on lines) or speckled (every symbolizer
        // at once on polygons).
        return this.sldAttributes?.geometry ?? this.sldProbe?.geometry ?? 'unknown';
    }

    private async chooseSldAttribute(name: string): Promise<void> {
        this.setDraft({ attribute: name || null, values: null });
        const wfs = this.sldAttributes?.wfs;
        if (!name || !wfs) return;
        this.sldLoadingValues = true;
        try {
            const values = await valuesFromWfs(wfs, name, VALUE_SAMPLE);
            this.setDraft({ values: values ?? [] });
        } finally {
            this.sldLoadingValues = false;
        }
    }

    /**
     * Asks the service whether it draws a style of our own, and what its
     * columns are. Both are third-party requests, so both happen once, when a
     * raster panel opens, and neither blocks the panel.
     */
    /** Asks again, from wherever the map is looking now, ignoring what is remembered. */
    private async retrySldProbe(wms: WmsSourceInfo): Promise<void> {
        this.sldProbe = null;
        await this.loadSldBranch(wms, { force: true });
    }

    private async loadSldBranch(wms: WmsSourceInfo, options: { force?: boolean } = {}): Promise<void> {
        const context = this.context;
        this.sldProbing = true;
        try {
            const samples = probeSamples(context?.sourceControl?.getView?.() ?? null, context?.bounds ?? null);
            const probe = await probeSldSupportCached(wms, samples, undefined, options);
            if (this.context !== context) return;
            this.sldProbe = probe;
            if (!probe.supported) return;
            const found = await discoverWmsAttributes(wms, probe.hit ?? null);
            if (this.context !== context) return;
            this.sldAttributes = found;
        } catch (_) {
            if (this.context === context) this.sldProbe = { supported: false, reason: 'error' };
        } finally {
            if (this.context === context) this.sldProbing = false;
        }
    }

    /**
     * Draws the layer with the style the form describes, then checks that the
     * service will actually answer the request it produces.
     *
     * The check is after the fact on purpose. The alternative is a guessed
     * url-length ceiling, and that number cannot be known here: it is the
     * service's, it differs per endpoint, and a guess either refuses a style a
     * generous service would have drawn or lets a stricter one fail silently —
     * a layer that quietly stops drawing, which reads as a broken map. One
     * request settles it, for a tile the map is about to ask for anyway.
     */
    private async applySld(wms: WmsSourceInfo): Promise<void> {
        const raster = this.context?.raster;
        if (!raster) return;
        const built = draftDocument(wms.layers.split(',')[0].trim(), this.sldGeometry(), this.sldDraft);
        this.sldClasses = built.classes;
        this.sldProblem = built.problem ?? null;
        if (!built.sld) return;
        // Parameters, not urls: the same call on every engine, and nothing has
        // to be fabricated or taken apart. `STYLES` is emptied alongside, since
        // a named style and a style of our own in one request is undefined.
        if (!this.writeSourceParams(raster.sourceId,
            { SLD_BODY: built.sld, STYLES: '' },
            (url) => withSldBodyUrl(url, built.sld))) return;
        this.sldApplied = true;
        this.message = null;
        const attempt = ++this.sldAttempt;
        const context = this.context;
        this.sldProblem = null;
        this.sldVerifying = true;
        try {
            const [sample] = probeSamples(this.context?.sourceControl?.getView?.() ?? null, this.context?.bounds ?? null);
            // Built here rather than read back from the engine. Reading back is
            // a second question with its own answer — an engine may report a
            // url it has not finished writing, and the check then describes the
            // *previous* style, which is how a short style came back "too
            // long". This is the request the service will be sent.
            const request = withSldBodyUrl(
                probeGetMapUrl(wms, sample.bbox, {}, sample.size ?? undefined),
                built.sld,
            );
            const check = await verifyStyledRequest(request);
            // A later attempt, or another layer: this answer is about neither.
            if (attempt !== this.sldAttempt || this.context !== context) return;
            if (check.ok) {
                this.sldProblem = null;
                return;
            }
            this.sldApplied = check.problem !== 'too-long';
            this.sldProblem = check.problem === 'too-long'
                // The length limit is the service's, so the fix is named in its
                // terms rather than as a number the panel invented.
                ? 'This service will not accept a request this long. Use fewer classes, or an attribute with shorter values.'
                : check.detail
                    ? `The service refused this style: ${check.detail}`
                    : 'The service refused this style.';
        } catch (error) {
            // The check itself failing is not the same as the service refusing,
            // but swallowing it leaves the panel silent about a style it never
            // confirmed.
            if (attempt === this.sldAttempt) {
                this.sldProblem = `The style could not be checked: ${String((error as Error)?.message ?? error)}`;
            }
        } finally {
            if (attempt === this.sldAttempt) this.sldVerifying = false;
        }
    }

    /**
     * Hands the layer back to the service — to the named style that was in
     * force, not to the default: `withSldBodyUrl` empties `STYLES` when it
     * writes a document, so removing the document alone would silently demote
     * a layer that was showing one of the service's named styles.
     */
    private clearSld(): void {
        const raster = this.context?.raster;
        if (!raster) return;
        const named = this.wmsStyle;
        if (!this.writeSourceParams(raster.sourceId,
            { SLD_BODY: null, STYLES: named },
            (url) => withWmsStyleUrl(withSldBodyUrl(url, null), named))) return;
        this.sldApplied = false;
        this.sldClasses = [];
    }

    /**
     * Rewrites the urls the engine is requesting, which is the only place a
     * bare-endpoint WMS's request exists — see `wmsStyleTiles`, which the named
     * style path uses for the same reason.
     */
    /**
     * Writes a change as parameters where the engine holds requests that way,
     * and as urls where it does not.
     *
     */
    private writeSourceParams(
        sourceId: string,
        params: Record<string, string | null>,
        rewrite: (url: string) => string,
    ): boolean {
        const control = this.context?.sourceControl;
        if (control?.setParams?.(sourceId, params)) return true;
        return this.writeSourceUrls(sourceId, rewrite) !== null;
    }

    private writeSourceUrls(sourceId: string, rewrite: (url: string) => string): string[] | null {
        const control = this.context?.sourceControl;
        const current = control?.getTiles?.(sourceId) ?? null;
        if (!current || current.length === 0) {
            this.message = 'This map engine cannot change this layer\'s request while it is on the map.';
            return null;
        }
        const written = current.map(rewrite);
        if (!control?.setTiles(sourceId, written)) {
            this.message = 'This map engine cannot change this layer\'s request while it is on the map.';
            return null;
        }
        // The urls as written, not as read back: an engine may replace the
        // source object on a write, and reading it in that moment answers with
        // nothing — which silently skipped the check that follows.
        return written;
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
        const raster = this.context?.raster;
        if (!raster) return;
        // Through parameters where the engine keeps them, so the two engines
        // make the same request; a style of our own comes back off either way.
        const written = this.writeSourceParams(raster.sourceId,
            { STYLES: style, SLD_BODY: null },
            (url) => wmsStyleTiles(raster, this.context?.sourceControl, style)[0] ?? url);
        if (!written) {
            this.message = 'This map engine cannot change a layer\'s style while it is on the map.';
            return;
        }
        this.wmsStyle = style;
        this.sldApplied = false;
        this.sldClasses = [];
        this.message = null;
    }

    /** Level 1: the persistent style list. Nothing here collapses on selection. */
    private renderList(): TemplateResult {
        const entries = this.visibleEntries();
        const group = this.group(this.sourceId) ?? this.groups[0] ?? null;
        const roles = rolesForGeometry(group?.geometryTypes ?? []);
        const canStyleFeatures = this.list.some((item) => item.styleable) || (group?.geometryTypes?.length ?? 0) > 0;
        const manySources = this.sourceIds().length > 1;
        return html`
            <div>
                <div class="list-head">
                    <span>Styles</span>
                    ${this.listIsWritable && canStyleFeatures ? html`
                        <select aria-label="Add a style"
                                @change=${(event: Event) => {
                                    const select = event.target as HTMLSelectElement;
                                    const role = select.value as StyleRole;
                                    select.value = '';
                                    if (role) this.addEntry(role);
                                }}>
                            <option value="">+ Add style</option>
                            ${roles.map((role) => html`<option value=${role}>${ROLE_LABELS[role]}</option>`)}
                        </select>` : nothing}
                </div>
                ${this.renderFilter()}
                ${this.list.length === 0
                    ? html`<p class="muted">This layer draws nothing this panel can style.</p>`
                    : entries.length === 0
                        ? html`<p class="muted">No style matches that.</p>`
                        : entries.map((item) => this.renderEntry(item, entries, manySources))}
                ${!canStyleFeatures && this.list.length > 0 ? html`
                    <p class="muted">
                        This layer arrives as finished pictures rather than features, so there is nothing here to
                        colour. What it can be asked is above.
                    </p>` : nothing}
                ${!this.listIsWritable && this.list.length > 0 && canStyleFeatures ? html`
                    <p class="muted">
                        This layer's styles come from a style document on the server, so they can be recoloured here
                        but not added to, removed or reordered.
                    </p>` : nothing}
            </div>
        `;
    }

    /** A long list needs narrowing: a remote basemap style carries over a hundred entries. */
    private renderFilter(): TemplateResult | typeof nothing {
        if (this.list.length <= 12) return nothing;
        const ids = this.sourceIds();
        return html`
            <div class="row filter-row">
                <input type="search" placeholder="Filter styles" aria-label="Filter styles"
                       .value=${this.filterText}
                       @input=${(event: Event) => { this.filterText = (event.target as HTMLInputElement).value; }}>
                ${ids.length > 1 ? html`
                    <select aria-label="Show styles drawing from"
                            @change=${(event: Event) => { this.sourceId = (event.target as HTMLSelectElement).value || null; }}>
                        <option value="">All data</option>
                        ${ids.map((id) => html`<option value=${id} ?selected=${id === this.sourceId}>${this.sourceLabel(id)}</option>`)}
                    </select>` : nothing}
            </div>
        `;
    }

    private renderEntry(item: StyleListEntry, siblings: StyleListEntry[], showSource: boolean): TemplateResult {
        const expanded = this.expandedId === item.entry.id;
        const index = siblings.indexOf(item);
        const swatch = swatchColorsOf(item.entry.channels.color);
        const name = this.displayEntryName(item);
        // The rows are listed topmost first, so the row above is later in the
        // draw order — which is what makes an up arrow mean "draw this on top"
        // rather than the opposite. Under a filter the neighbour on screen is
        // not the adjacent entry, so the move steps past *it* instead.
        const canReorder = this.listIsWritable;
        const above = siblings[index - 1];
        const below = siblings[index + 1];
        return html`
            <div class="entry">
                <div class="entry-head">
                    <button class="entry-summary" type="button" aria-expanded=${expanded}
                            @click=${() => { this.expandedId = expanded ? null : item.entry.id; }}>
                        <span class="swatch" style=${swatchBackground(swatch)}></span>
                        <span class="entry-text">
                            ${name ? html`<span class="entry-name">${name}</span>` : nothing}
                            <span class=${name ? 'entry-detail' : ''}>
                                ${item.styleable ? summarizeEntry(item.entry, this.context?.attributeLabels) : `${item.entry.origin?.type ?? 'Other'} — not styled here`}
                                ${showSource ? html`<small class="source-key">${item.sourceId.split(':').pop()}</small>` : nothing}
                            </span>
                        </span>
                    </button>
                    <span class="entry-actions">
                        ${canReorder ? html`
                            <button type="button" aria-label="Move up, so it draws on top"
                                    title=${index === 0 ? 'Already drawn on top' : 'Move up'}
                                    ?disabled=${index === 0} @click=${() => this.move(item, above)}>
                                <sl-icon name="arrow-up"></sl-icon>
                            </button>
                            <button type="button" aria-label="Move down, so it draws underneath"
                                    title=${index === siblings.length - 1 ? 'Already at the bottom' : 'Move down'}
                                    ?disabled=${index === siblings.length - 1} @click=${() => this.move(item, below)}>
                                <sl-icon name="arrow-down"></sl-icon>
                            </button>` : nothing}
                        <button type="button" aria-label="Duplicate this style"
                                title=${this.listIsWritable ? 'Duplicate' : LIST_LOCKED_REASON}
                                ?disabled=${!this.listIsWritable} @click=${() => this.duplicate(item)}>
                            <sl-icon name="copy"></sl-icon>
                        </button>
                        <button type="button" aria-label="Delete this style"
                                title=${!this.listIsWritable ? LIST_LOCKED_REASON
                                    : this.list.length <= 1 ? 'A layer needs at least one style'
                                    : 'Delete'}
                                ?disabled=${!this.listIsWritable || this.list.length <= 1} @click=${() => this.removeEntry(item)}>
                            <sl-icon name="trash"></sl-icon>
                        </button>
                    </span>
                </div>
                ${expanded ? html`<div class="entry-body">${this.renderChannels(item)}</div>` : nothing}
            </div>
        `;
    }

    private renderChannels(item: StyleListEntry): Array<TemplateResult | typeof nothing> | TemplateResult {
        if (!item.styleable) {
            return html`<p class="muted">
                This part of the layer is drawn as <code>${item.entry.origin?.type}</code>, which this panel has no
                controls for. It is left exactly as it is.
            </p>`;
        }
        return [
            this.renderTitle(item),
            ...channelsOf(item.entry.role).map((channel) => this.renderChannel(item, channel)),
            this.renderMoreToggle(item),
        ];
    }

    /**
     * What this style is called — the first row, because it is what the legend
     * shows and what tells seven label entries apart.
     *
     * `change` rather than `input`: every keystroke would rebuild the layer,
     * and the name is judged when it is finished, not while it is typed. The
     * placeholder is the name the entry has without one, so an empty field
     * reads as "the derived name" rather than as no name at all.
     */
    private renderTitle(item: StyleListEntry): TemplateResult {
        // What the style is called without a name of its own — the layer's
        // name for a single sublayer — and what the field goes back to when
        // emptied.
        const inherited = this.displayEntryName(item, { authored: false }) ?? summarizeEntry(item.entry, this.context?.attributeLabels);
        const key = `${item.entry.id}:title`;
        // Typing the inherited name back is not naming the style: it stays
        // without a name of its own, so a later change to the layer's name
        // still reaches it.
        const titleFor = (value: string) => (value.trim() === inherited ? '' : value);
        return html`
            <div class="row">
                <span class="name">Name</span>
                <input type="text" class="grow" aria-label="What this style is called"
                       placeholder=${inherited}
                       .value=${this.textDrafts.get(key) ?? item.entry.title ?? inherited}
                       @input=${(event: Event) => {
                           const value = (event.target as HTMLInputElement).value;
                           this.setTextDraft(key, value);
                           this.setEntryField(item, 'title', titleFor(value), { finished: false });
                       }}
                       @change=${(event: Event) => {
                           this.setTextDraft(key, null);
                           this.setEntryField(item, 'title', titleFor((event.target as HTMLInputElement).value));
                       }}>
            </div>
        `;
    }

    /** Channels a classification can drive: a colour, or a size. */
    private canClassify(channel: ChannelId): boolean {
        return COLOR_CHANNELS.includes(channel) || channel === 'radius' || channel === 'textSize';
    }

    /** The features a classification is computed from — what the source handed over. */
    private featuresOf(item: StyleListEntry): GeoJSON.Feature[] {
        return this.group(item.sourceId)?.features ?? this.groups[0]?.features ?? [];
    }

    private attributesOf(item: StyleListEntry) {
        return this.group(item.sourceId)?.attributes ?? this.groups[0]?.attributes ?? [];
    }

    /**
     * Why `By attribute` is not on offer, or null when it is.
     *
     * A missing option is a question the user cannot ask, so the reason is
     * carried into the dropdown as a disabled option rather than the choice
     * simply not being there.
     */
    private attributeDriverBlocker(item: StyleListEntry): string | null {
        if (this.featuresOf(item).length === 0) return 'No features are loaded';
        if (this.attributesOf(item).length === 0) return 'This layer has no columns';
        return null;
    }

    private settingsKey(item: StyleListEntry, channel: ChannelId): string {
        return `${item.entry.id}:${channel}`;
    }

    /**
     * The level-4 answers for a channel, seeded from what the layer already draws.
     *
     * The attribute, the class count and the palette *are* recoverable from the
     * paint, so they open on the layer's own values; the method is not — an
     * expression records where the breaks landed, not how they were chosen — so
     * it starts at the default and means nothing until the user touches it.
     */
    private settingsFor(item: StyleListEntry, channel: ChannelId): ClassifySettings {
        const key = this.settingsKey(item, channel);
        const held = this.classifySettings.get(key);
        if (held) return held;

        const state = item.entry.channels[channel];
        const attributes = this.attributesOf(item);
        const fallbackAttribute = attributes.find((attribute) => isNumericType(attribute.type))?.name
            ?? attributes[0]?.name
            ?? '';
        if (state?.driver !== 'attribute') return defaultSettings(fallbackAttribute);

        const classification = state.classification;
        const seeded = defaultSettings(state.attribute || fallbackAttribute);
        seeded.schemeName = state.schemeName ?? null;
        if (classification.kind === 'ranges') {
            seeded.classCount = classification.colors.length;
            if (classification.noDataColor) seeded.noDataColor = classification.noDataColor;
        }
        if (classification.kind === 'categories') {
            seeded.maxCategories = Math.max(classification.values.length, 1);
            seeded.cycle = true;
            if (classification.fallbackColor) seeded.noDataColor = classification.fallbackColor;
        }
        if (classification.kind === 'proportional') seeded.growWithZoom = classification.zoomFactor !== undefined;
        return seeded;
    }

    private updateSettings(item: StyleListEntry, channel: ChannelId, change: Partial<ClassifySettings>): void {
        const previous = this.settingsFor(item, channel);
        const next = { ...previous, ...change };
        const merged = new Map(this.classifySettings);
        merged.set(this.settingsKey(item, channel), next);
        this.classifySettings = merged;
        this.renameForAttribute(item, previous.attribute, next.attribute);
        this.applyClassification(item, channel, next);
    }

    /**
     * Carries a name that was the column's along when the column changes.
     *
     * A style called `population_density` is describing the classification, not
     * the style, so it is stale the moment another column is chosen — and a
     * legend row naming a column the map is no longer showing is worse than one
     * naming none. A name the user actually wrote is left alone: only a name
     * that *is* the old column's is treated as having meant it.
     */
    private renameForAttribute(item: StyleListEntry, before: string, after: string): void {
        if (!before || !after || before === after) return;
        const current = this.list.find((candidate) => candidate.entry.id === item.entry.id) ?? item;
        if (current.entry.title !== before) return;
        this.setEntryField(current, 'title', after);
    }

    /** Recomputes a classified channel and pushes it to the map. */
    private applyClassification(item: StyleListEntry, channel: ChannelId, settings: ClassifySettings): void {
        // The classification itself is the expensive half — it reads every
        // feature — so it is scheduled rather than run per pointer move. The
        // write it ends in goes through `applyEntry`, which is scheduled under
        // the same key, so the two share one interval instead of stacking.
        this.schedule(`${item.entry.id}:${channel}:classify`, () => {
            const latest = this.list.find((candidate) => candidate.entry.id === item.entry.id) ?? item;
            this.classifyNow(latest, channel, settings);
        });
    }

    private classifyNow(item: StyleListEntry, channel: ChannelId, settings: ClassifySettings): void {
        const features = this.featuresOf(item);
        if (!settings.attribute || features.length === 0) return;

        const outcome = channel === 'radius' || channel === 'textSize'
            ? channel === 'radius'
                ? classifySizeChannel(features, settings.attribute, MAX_BUBBLE_RADIUS,
                    settings.growWithZoom === false ? undefined : this.context?.sourceControl?.getView?.()?.zoom)
                : classifySizeChannel(features, settings.attribute, MAX_LABEL_SIZE)
            : classifyColorChannel(features, this.isNumeric(item, settings.attribute), settings);

        if (!outcome) {
            // The layer as it stands is left alone: replacing it with a grey map
            // would hide the fact that the column has nothing in it.
            this.message = `Nothing to classify: “${settings.attribute}” has no usable values.`;
            return;
        }
        if (outcome.channel === null) {
            this.message = outcome.problem;
            return;
        }
        this.message = outcome.warning ?? null;
        this.setChannel(item, channel, outcome.channel);
    }

    private isNumeric(item: StyleListEntry, attribute: string): boolean {
        return isNumericType(this.attributesOf(item).find((candidate) => candidate.name === attribute)?.type);
    }

    /**
     * Why `By neighbours` is not on offer, or null when it is.
     *
     * Its constraints are real and worth stating rather than hiding: it needs
     * areas to find borders between, features to compute the graph from, and a
     * source the app can write a column into — the colouring has no attribute
     * of its own, and the map can only paint what an expression can address.
     */
    private neighbourDriverBlocker(item: StyleListEntry, channel: ChannelId): string | null {
        if (!COLOR_CHANNELS.includes(channel)) return 'Not something neighbours can decide';
        const group = this.group(item.sourceId) ?? this.groups[0] ?? null;
        const areal = (group?.geometryTypes ?? []).some((type) => /polygon/i.test(type));
        if (group && !areal) return 'Areas only';
        if (this.featuresOf(item).length === 0) return 'No features are loaded';
        // A source the app cannot write into is still colourable, keyed on
        // something that tells its areas apart: the id, or columns unique together.
        if (!this.canWriteFeatures(item) && !coloringKeyFor(this.featuresOf(item))) {
            return 'Nothing tells these areas apart: no id, and no columns unique together';
        }
        return null;
    }

    /**
     * Whether a colouring can be written into this source's features.
     *
     * Only a source the app holds whole and locally: a `geojson` one. A tiled
     * source's properties come from a server, and a colouring nothing can name
     * is a colouring the map cannot draw.
     */
    private canWriteFeatures(item: StyleListEntry): boolean {
        const group = this.group(item.sourceId) ?? this.groups[0] ?? null;
        if (!group || !this.context?.writeFeatures) return false;
        if (group.completeData === false) return false;
        const type = (group.sourceConfig as Record<string, unknown> | null | undefined)?.type;
        return type === 'geojson' && (group.features?.length ?? 0) > 0;
    }

    /**
     * Colour the areas so that no two touching ones match.
     *
     * The colour names no value, so there is no legend and no class count —
     * only how many colours to spread over, which is a matter of taste rather
     * than of the data: four is the minimum a map can need, and a dozen reads
     * as variety rather than as a scheme.
     */
    private renderNeighbours(item: StyleListEntry, channel: ChannelId): TemplateResult {
        const count = this.neighbourColors.get(this.settingsKey(item, channel)) ?? DEFAULT_NEIGHBOUR_COLORS;
        const report = this.lastColoring;
        return html`
            <div class="level4">
                <div class="row">
                    <span class="name">Colours</span>
                    <input type="range" min="4" max="12" step="1" aria-label="How many colours to spread over"
                           .value=${String(count)}
                           @input=${(event: Event) => this.applyNeighbours(item, channel, Number((event.target as HTMLInputElement).value))}>
                    <span class="value">${count}</span>
                </div>
                ${this.renderNeighbourPalette(item, channel)}
                <p class="muted">
                    A colour here names no value, so this map has no legend — it is for showing where the areas are
                    and where their borders run.
                </p>
                ${(item.entry.channels[channel] as { key?: unknown } | undefined)?.key ? html`
                    <p class="muted">
                        This layer's data cannot be added to, so every area is named in the style, coloured from the
                        areas drawn now. An area that comes into view later is drawn in the fallback colour until the
                        colouring is run again: move the Colours slider to do that.
                    </p>` : nothing}
                ${report && report.isolatedRegions > 0 ? html`
                    <p class="muted">
                        ${report.isolatedRegions} of ${report.isolatedRegions + report.colors.length - report.isolatedRegions}
                        areas touch nothing. A few is normal — real islands — but if most do, the borders in this data
                        do not share coordinates and the colouring means little.
                    </p>` : nothing}
            </div>
        `;
    }

    /**
     * Computes the colouring, writes it into the data, and paints it.
     *
     * The class index has to be *in* the features before an expression can name
     * it. The alternative — a `match` keyed on a unique column — needs a column
     * the layers this exists for frequently do not have, and emits one branch
     * per feature: 4363 regions is 4363 branches re-evaluated per tile.
     */
    /**
     * The same colouring, named per feature in the paint instead of written
     * into the data: what a tiled source needs, since its properties live on
     * a server.
     *
     * One branch per area, matched on its id or on columns unique together.
     * The areas are the ones the map has drawn: one that arrives later has no
     * branch and takes the fallback colour until the colouring is run again.
     */
    private neighbourPalette(item: StyleListEntry, channel: ChannelId): NeighbourPalette {
        return this.neighbourPalettes.get(this.settingsKey(item, channel)) ?? { schemeName: null, reversed: false, blindSafe: false };
    }

    /**
     * The qualitative palettes a colouring of this many colours can use.
     *
     * At least three: the smallest ColorBrewer qualitative schemes have three,
     * and a two-colour chessboard still reads best from a three-colour palette.
     */
    private neighbourSchemes(item: StyleListEntry, channel: ChannelId, colorCount: number): ColorScheme[] {
        return schemesFor(Math.min(Math.max(colorCount, 3), 12), 'qual', this.neighbourPalette(item, channel));
    }

    /** The chosen palette, or the first on offer when the choice is not (or no longer) available. */
    private neighbourScheme(item: StyleListEntry, channel: ChannelId, colorCount: number): ColorScheme | null {
        const schemes = this.neighbourSchemes(item, channel, colorCount);
        const { schemeName } = this.neighbourPalette(item, channel);
        return schemes.find((scheme) => scheme.name === schemeName) ?? schemes[0] ?? null;
    }

    private noNeighbourSchemeMessage(item: StyleListEntry, channel: ChannelId, colorCount: number): string {
        // No qualitative palette rated colour-blind safe goes past nine colours
        // (Tol muted), so this is the filter speaking, not a missing palette.
        return this.neighbourPalette(item, channel).blindSafe
            ? `No colour-blind-safe palette has ${colorCount} colours. Use fewer colours, or untick Colour-blind safe.`
            : `No palette has ${colorCount} distinct colours.`;
    }

    /** A palette change: remembered, then the colouring is run again with it. */
    private updateNeighbourPalette(item: StyleListEntry, channel: ChannelId, change: Partial<NeighbourPalette>): void {
        const palettes = new Map(this.neighbourPalettes);
        palettes.set(this.settingsKey(item, channel), { ...this.neighbourPalette(item, channel), ...change });
        this.neighbourPalettes = palettes;
        this.applyNeighbours(item, channel,
            this.neighbourColors.get(this.settingsKey(item, channel)) ?? DEFAULT_NEIGHBOUR_COLORS);
    }

    /** The palette row under a neighbour colouring: the same row `By attribute` shows, qualitative only. */
    private renderNeighbourPalette(item: StyleListEntry, channel: ChannelId): TemplateResult {
        const state = item.entry.channels[channel];
        const palette = this.neighbourPalette(item, channel);
        // The count the slider asks for, not the count on the map: when no
        // palette has that many colours the colouring is not applied, and a row
        // judged by the map would show palettes and no reason.
        const colorCount = this.neighbourColors.get(this.settingsKey(item, channel))
            ?? (state?.driver === 'neighbours' ? state.colors.length : DEFAULT_NEIGHBOUR_COLORS);
        const drawn = state?.driver === 'neighbours' ? state.colors.length : null;
        const schemes = this.neighbourSchemes(item, channel, colorCount);
        const current = this.neighbourScheme(item, channel, colorCount)?.name ?? null;
        return html`
            <div class="row check-row">
                <span class="name">Palette</span>
                <div class="checks">
                    <label class="check">
                        <input type="checkbox" .checked=${palette.reversed}
                               @change=${(event: Event) => this.updateNeighbourPalette(item, channel, {
                                   reversed: (event.target as HTMLInputElement).checked,
                               })}>
                        Reverse
                    </label>
                    <label class="check">
                        <input type="checkbox" .checked=${palette.blindSafe}
                               @change=${(event: Event) => this.updateNeighbourPalette(item, channel, {
                                   blindSafe: (event.target as HTMLInputElement).checked,
                               })}>
                        Colour-blind safe
                    </label>
                </div>
            </div>
            ${schemes.length === 0
                ? html`<div class="warning">
                    ${this.noNeighbourSchemeMessage(item, channel, colorCount)}
                    ${drawn !== null ? ` The map still shows the last colouring, with ${drawn} colours.` : ''}
                  </div>`
                : html`
                    <div class="schemes">
                        ${schemes.map((scheme) => html`
                            <button class="scheme" type="button" aria-label=${scheme.name}
                                    aria-pressed=${scheme.name === current}
                                    title=${scheme.name}
                                    @click=${() => this.updateNeighbourPalette(item, channel, { schemeName: scheme.name })}>
                                ${scheme.colors.map((color) => html`<span style=${`background:${color}`}></span>`)}
                            </button>`)}
                    </div>`}
        `;
    }

    private applyKeyedNeighbours(
        item: StyleListEntry,
        channel: ChannelId,
        features: GeoJSON.Feature[],
        coloring: ReturnType<typeof colorByAdjacency>,
    ): void {
        const key = coloringKeyFor(features);
        if (!key) {
            this.message = 'Nothing tells these areas apart (no id, and no columns unique together), so a colouring cannot name them.';
            return;
        }
        const scheme = this.neighbourScheme(item, channel, coloring.colorCount);
        if (!scheme) {
            // Said in the palette row, next to the slider that asked for it:
            // the panel-top warning is scrolled out of view from down here.
            this.message = null;
            return;
        }
        const assignments = new Map<string, number>();
        features.forEach((feature, index) => {
            const value = coloringKeyValue(key, feature);
            const color = coloring.colors[index];
            // A key value is a `match` label, and labels must be unique.
            if (value === null || color === undefined || assignments.has(value)) return;
            assignments.set(value, color);
        });
        this.message = null;
        this.setChannel(item, channel, {
            driver: 'neighbours',
            key,
            assignments: [...assignments],
            colors: Array.from({ length: coloring.colorCount }, (_, index) => scheme.colors[index % scheme.colors.length]),
        });
    }

    private applyNeighbours(item: StyleListEntry, channel: ChannelId, colorCount: number): void {
        const counts = new Map(this.neighbourColors);
        counts.set(this.settingsKey(item, channel), colorCount);
        this.neighbourColors = counts;

        const group = this.group(item.sourceId) ?? this.groups[0] ?? null;
        const features = group?.features;
        if (!group || !features?.length) {
            this.message = 'Colouring by neighbours needs the layer\u2019s own features, and this layer has not handed them over.';
            return;
        }

        const coloring = colorByAdjacency(features, { paletteSize: colorCount });
        this.lastColoring = coloring;
        if (!this.canWriteFeatures(item)) {
            this.applyKeyedNeighbours(item, channel, features, coloring);
            return;
        }
        if (!this.context?.writeFeatures) return;
        features.forEach((feature, index) => {
            const value = coloring.colors[index];
            if (value === undefined) return;
            feature.properties = { ...(feature.properties ?? {}), [NEIGHBOUR_COLOR_FIELD]: value };
        });
        if (!this.context.writeFeatures(group.sourceId, features)) {
            this.message = 'This layer\u2019s data could not be added to, so the colouring has nothing the map can name.';
            return;
        }

        const scheme = this.neighbourScheme(item, channel, coloring.colorCount);
        if (!scheme) {
            // Said in the palette row, next to the slider that asked for it:
            // the panel-top warning is scrolled out of view from down here.
            this.message = null;
            return;
        }
        this.message = null;
        this.setChannel(item, channel, {
            driver: 'neighbours',
            attribute: NEIGHBOUR_COLOR_FIELD,
            colors: Array.from({ length: coloring.colorCount }, (_, index) => scheme.colors[index % scheme.colors.length]),
        });
    }

    /**
     * One channel: its driver, then its constant. Level 3 above level 5.
     *
     * The driver dropdown offers only what this build can actually produce —
     * `single`, plus whatever the channel already is. Offering `By attribute`
     * here while the classification lives in the other panel would be a
     * question that cannot be answered, and hiding a driver the layer is
     * already using would silently replace it.
     */
    private renderChannel(item: StyleListEntry, channel: ChannelId): TemplateResult {
        const state = item.entry.channels[channel];
        const label = CHANNEL_LABELS[channel];
        if (channel === 'text') return this.renderTextChannel(item, state);
        if (channel === 'fillOutline') return this.renderFillEdge(item, state);
        if (channel === 'lineJoin') return this.renderCorners(item, state);

        const classifiable = this.canClassify(channel);
        const blocked = classifiable ? this.attributeDriverBlocker(item) : 'Not something a column can decide';
        const neighbourBlocked = this.neighbourDriverBlocker(item, channel);
        // `single` always, `attribute` wherever a column could drive it,
        // `neighbours` on areas — and whatever the channel already is, so a
        // driver this build cannot produce is still shown rather than silently
        // replaced. A blocked option keeps its reason: a missing option is a
        // question the user cannot ask.
        const drivers: ChannelState['driver'][] = ['single'];
        if (classifiable) drivers.push('attribute');
        if (COLOR_CHANNELS.includes(channel)) drivers.push('neighbours');
        if (state && !drivers.includes(state.driver)) drivers.push(state.driver);
        const blockerFor = (driver: ChannelState['driver']): string | null =>
            driver === 'attribute' ? blocked : driver === 'neighbours' ? neighbourBlocked : null;

        return html`
            <div class="row">
                <span class="name">${label}</span>
                ${drivers.length > 1 ? html`
                    <select aria-label=${`How ${label.toLowerCase()} is decided`}
                            @change=${(event: Event) => this.changeDriver(item, channel, (event.target as HTMLSelectElement).value as ChannelState['driver'])}>
                        ${drivers.map((driver) => html`
                            <option value=${driver}
                                    ?selected=${driver === (state?.driver ?? 'single')}
                                    ?disabled=${!!blockerFor(driver)}>
                                ${DRIVER_LABELS[driver]}${blockerFor(driver) ? ` — ${blockerFor(driver)}` : ''}
                            </option>`)}
                    </select>` : nothing}
                ${this.renderChannelValue(item, channel, state)}
            </div>
            ${state?.driver === 'attribute' ? this.renderClassification(item, channel) : nothing}
            ${state?.driver === 'neighbours' ? this.renderNeighbours(item, channel) : nothing}
            ${state?.driver === 'zoom' ? html`
                <p class="muted">${zoomStopsSentence(state)}</p>` : nothing}
            ${state && state.driver === 'custom' && channel !== 'dash'
                ? html`<pre class="custom">${JSON.stringify(state.expression)}</pre>`
                : nothing}
        `;
    }

    /**
     * Level 4, nested under the channel it drives.
     *
     * Open and already answered, never a question waiting for input: choosing
     * `By attribute` classifies immediately, and everything here adjusts a map
     * the user is already looking at. That is what keeps a five-level hierarchy
     * shallow in practice.
     */
    private renderClassification(item: StyleListEntry, channel: ChannelId): TemplateResult {
        const settings = this.settingsFor(item, channel);
        const attributes = this.attributesOf(item);
        const numeric = this.isNumeric(item, settings.attribute);
        const sizing = channel === 'radius' || channel === 'textSize';
        return html`
            <div class="level4">
                ${attributes.length === 0 ? html`
                    <p class="muted">
                        No columns to classify by yet — the map has drawn no features of this layer here. Move to
                        where it draws, and this fills itself in.
                    </p>` : nothing}
                <div class="row">
                    <span class="name">Attribute</span>
                    <select aria-label="Attribute to classify by"
                            @change=${(event: Event) => this.updateSettings(item, channel, {
                                attribute: (event.target as HTMLSelectElement).value,
                            })}>
                        ${attributes.map((attribute) => {
                            // A column with one value per feature — a name, a
                            // code — is *not* disabled. Colouring by it with the
                            // palette repeating is exactly the "give every area
                            // its own colour" map, which is a thing people come
                            // here to make; the label says what it will do
                            // rather than the option refusing to be chosen.
                            const isKey = !isNumericType(attribute.type)
                                && attribute.uniqueCount >= attribute.presentCount
                                && attribute.presentCount > 1;
                            const unusable = sizing && !isNumericType(attribute.type);
                            return html`
                                <option value=${attribute.name} ?selected=${attribute.name === settings.attribute}
                                        ?disabled=${unusable}>
                                    ${attributeChoiceLabel(attribute.name, this.context?.attributeLabels)}${
                                        isKey ? ' — a colour each' : unusable ? ' — not a number' : ''}
                                </option>`;
                        })}
                    </select>
                </div>
                ${sizing ? html`
                    <p class="muted">
                        Sized straight from the value — twice the value draws twice the area, which a class
                        boundary would throw away. No classes, and no legend of them.
                    </p>
                    ${channel === 'radius' ? html`
                        <div class="row check-row">
                            <span class="name">Zoom</span>
                            <div class="checks">
                                <label class="check">
                                    <input type="checkbox" .checked=${settings.growWithZoom !== false}
                                           @change=${(event: Event) => this.updateSettings(item, channel, {
                                               growWithZoom: (event.target as HTMLInputElement).checked,
                                           })}>
                                    Grow with zoom
                                </label>
                            </div>
                        </div>` : nothing}`
                    : numeric ? this.renderNumericLevel4(item, channel, settings)
                    : this.renderCategoryLevel4(item, channel, settings)}
                ${sizing ? nothing : this.renderPalette(item, channel, settings)}
                ${sizing ? nothing : this.renderNoData(item, channel, settings)}
            </div>
        `;
    }

    /**
     * What features the classification has no class for look like, and what the
     * legend calls them.
     *
     * Two separate answers on purpose. The colour is always painted — a feature
     * with no value has to be *something*, and light grey is the convention for
     * "no data". The words are optional, and an empty field means the legend
     * shows no row for them: the repo's empty-label convention, reached here by
     * leaving the field blank rather than by knowing about it.
     *
     * Only one wording per style, because the legend reads it off the sublayer
     * — which is also the only place a legend could read it from.
     */
    private renderNoData(item: StyleListEntry, channel: ChannelId, settings: ClassifySettings): TemplateResult | typeof nothing {
        if (!COLOR_CHANNELS.includes(channel)) return nothing;
        const numeric = this.isNumeric(item, settings.attribute);
        const color = settings.noDataColor;
        const key = `${item.entry.id}:${channel}:nodata`;
        return html`
            <div class="row">
                <span class="name">${numeric ? 'No value' : 'No value, or not listed'}</span>
                <button class="color-button" type="button" style=${`background:${color}`}
                        aria-label=${`Colour for features with no value: ${color}`}
                        @click=${(event: Event) => this.openPicker(key, event.currentTarget as HTMLElement, color,
                            (rgba) => this.updateSettings(item, channel, { noDataColor: rgba }))}></button>
                <input type="text" class="grow" aria-label="What the legend calls them — leave empty to leave them out"
                       placeholder="Not in the legend"
                       .value=${item.entry.noDataLabel ?? ''}
                       @input=${(event: Event) => this.setEntryField(item, 'noDataLabel',
                           (event.target as HTMLInputElement).value, { finished: false })}
                       @change=${(event: Event) => this.setEntryField(item, 'noDataLabel', (event.target as HTMLInputElement).value)}>
            </div>
        `;
    }

    private renderNumericLevel4(item: StyleListEntry, channel: ChannelId, settings: ClassifySettings): TemplateResult {
        return html`
            <div class="row">
                <span class="name">Method</span>
                <select aria-label="How the numbers are divided"
                        title=${METHOD_HINTS[settings.method]}
                        @change=${(event: Event) => this.updateSettings(item, channel, {
                            method: (event.target as HTMLSelectElement).value as ClassificationMethod,
                        })}>
                    ${OFFERED_METHODS.map((method) => html`
                        <option value=${method} ?selected=${method === settings.method}>${METHOD_LABELS[method]}</option>`)}
                </select>
            </div>
            <p class="muted">${METHOD_HINTS[settings.method]}</p>
            <div class="row">
                <span class="name">Classes</span>
                <input type="range" min="2" max="9" step="1" aria-label="Number of classes"
                       .value=${String(settings.classCount)}
                       @input=${(event: Event) => this.updateSettings(item, channel, {
                           classCount: Number((event.target as HTMLInputElement).value),
                       })}>
                <span class="value">${settings.classCount}</span>
            </div>
        `;
    }

    private renderCategoryLevel4(item: StyleListEntry, channel: ChannelId, settings: ClassifySettings): TemplateResult {
        return html`
            <div class="row">
                <span class="name">Colours</span>
                <input type="range" min="2" max="12" step="1" aria-label="How many colours to use"
                       .value=${String(settings.maxCategories)}
                       @input=${(event: Event) => this.updateSettings(item, channel, {
                           maxCategories: Number((event.target as HTMLInputElement).value),
                       })}>
                <span class="value">${settings.maxCategories}</span>
            </div>
        `;
    }

    private renderPalette(item: StyleListEntry, channel: ChannelId, settings: ClassifySettings): TemplateResult {
        const state = item.entry.channels[channel];
        const numeric = this.isNumeric(item, settings.attribute);
        const type = numeric ? 'seq' : 'qual';
        const colorCount = numeric
            ? state?.driver === 'attribute' && state.classification.kind !== 'proportional'
                ? state.classification.colors.length
                : settings.classCount
            : categoricalPaletteColorCount(this.featuresOf(item), settings);
        const schemes = schemesFor(colorCount, type, settings);
        const current = state?.driver === 'attribute' ? state.schemeName : settings.schemeName;
        return html`
            <div class="row check-row">
                <span class="name">Palette</span>
                <div class="checks">
                    <label class="check">
                        <input type="checkbox" .checked=${settings.reversed}
                               @change=${(event: Event) => this.updateSettings(item, channel, {
                                   reversed: (event.target as HTMLInputElement).checked,
                               })}>
                        Reverse
                    </label>
                    <label class="check">
                        <input type="checkbox" .checked=${settings.blindSafe}
                               @change=${(event: Event) => this.updateSettings(item, channel, {
                                   blindSafe: (event.target as HTMLInputElement).checked,
                               })}>
                        Colour-blind safe
                    </label>
                </div>
            </div>
            ${schemes.length === 0
                ? html`<p class="muted">No palette has ${colorCount} colours under these settings.</p>`
                : html`
                    <div class="schemes">
                        ${schemes.map((scheme) => html`
                            <button class="scheme" type="button" aria-label=${scheme.name}
                                    aria-pressed=${scheme.name === current}
                                    title=${scheme.name}
                                    @click=${() => this.updateSettings(item, channel, { schemeName: scheme.name })}>
                                ${scheme.colors.map((color) => html`<span style=${`background:${color}`}></span>`)}
                            </button>`)}
                    </div>`}
        `;
    }

    private renderChannelValue(item: StyleListEntry, channel: ChannelId, state: ChannelState | undefined): TemplateResult | typeof nothing {
        if (state?.driver === 'zoom') return this.renderZoomSize(item, channel, state);
        if (state && state.driver !== 'single') {
            // Read-only on purpose: the panel can show what the layer is doing
            // without being able to rebuild it, and writing a default over it
            // would throw away a classification nothing here can put back.
            return html`<span class="muted">${summarizeDriver(state)}</span>`;
        }
        if (COLOR_CHANNELS.includes(channel)) return this.renderColor(item, channel, state);
        if (channel === 'dash') return this.renderDash(item, state);
        const range = CHANNEL_RANGES[channel];
        if (!range) return nothing;
        // A channel the layer says nothing about is drawn with the GL default,
        // so that is what the control has to open on — not the slider's floor,
        // which would report a layer as invisible that is drawn at full
        // strength.
        const value = typeof state?.value === 'number' ? state.value : CHANNEL_DEFAULTS[channel] ?? range.min;
        return html`
            <input type="range" min=${range.min} max=${range.max} step=${range.step}
                   aria-label=${CHANNEL_LABELS[channel]}
                   .value=${String(value)}
                   @input=${(event: Event) => this.setChannel(item, channel, {
                       driver: 'single', value: Number((event.target as HTMLInputElement).value),
                   })}>
            <span class="value">${channel === 'opacity' ? `${Math.round(value * 100)}%` : `${value}${range.unit}`}</span>
        `;
    }

    /**
     * A size that grows with the zoom, adjusted where the user can see it.
     *
     * The slider sets the size **at the zoom the map is on**, and the stops are
     * scaled to match. Offering the scale factor instead would be asking the
     * user to do the arithmetic the panel is looking at: they want this line
     * thicker *here*, and whether that is 1.4× of an authored curve is the
     * panel's problem. What the whole curve becomes is said underneath, because
     * the change reaches zooms the user is not looking at.
     */
    private renderZoomSize(item: StyleListEntry, channel: ChannelId, state: ZoomChannel): TemplateResult {
        const range = CHANNEL_RANGES[channel];
        const zoom = this.context?.sourceControl?.getView?.()?.zoom;
        const here = zoomValueAt(state, zoom);
        return html`
            ${range && here !== null ? html`
                <input type="range" min=${range.min} max=${range.max} step=${range.step}
                       aria-label=${`${CHANNEL_LABELS[channel]} at this zoom`}
                       .value=${String(here)}
                       @input=${(event: Event) => {
                           const wanted = Number((event.target as HTMLInputElement).value);
                           this.setChannel(item, channel, scaleZoomChannelTo(state, wanted, zoom));
                       }}>
                <span class="value">${round1(here)}${range.unit}</span>`
                : html`<span class="muted">${summarizeDriver(state)}</span>`}
        `;
    }

    private renderColor(item: StyleListEntry, channel: ChannelId, state: ChannelState | undefined): TemplateResult {
        const color = singleColorOf(state) ?? '#000000';
        const key = `${item.entry.id}:${channel}`;
        return html`
            <button class="color-button" type="button" style=${`background:${color}`}
                    aria-label=${`${CHANNEL_LABELS[channel]}: ${color}`}
                    @click=${(event: Event) => this.openPicker(key, event.currentTarget as HTMLElement, color,
                        (rgba) => this.setChannel(item, channel, { driver: 'single', value: rgba }))}></button>
        `;
    }

    private renderDash(item: StyleListEntry, state: ChannelState | undefined): TemplateResult {
        const current = dashLabel(state);
        return html`
            <select aria-label="Line pattern"
                    @change=${(event: Event) => {
                        const preset = DASH_PRESETS.find((entry) => entry.label === (event.target as HTMLSelectElement).value);
                        this.setChannel(item, 'dash', preset?.value ? { driver: 'single', value: preset.value } : undefined);
                    }}>
                ${DASH_PRESETS.map((preset) => html`
                    <option value=${preset.label} ?selected=${preset.label === current}>${preset.label}</option>`)}
                ${current === 'Custom' ? html`<option value="Custom" selected>Custom</option>` : nothing}
            </select>
        `;
    }

    /**
     * Corners and ends, as one choice.
     *
     * The GL defaults are a miter join and a butt cap, which at 2px nobody
     * notices and at 12px turns every bend into a spike and every end into a
     * cut — measured on OpenLayers, which honours both through
     * `ol-mapbox-style`. Rounding them is what every real road style does, so
     * it is what a new line entry starts as; this control is here for the
     * layers that were authored before it.
     */
    private renderCorners(item: StyleListEntry, state: ChannelState | undefined): TemplateResult {
        const value = state?.driver === 'single' && typeof state.value === 'string' ? state.value : 'miter';
        return html`
            <div class="row">
                <span class="name">${CHANNEL_LABELS.lineJoin}</span>
                <select aria-label="Corners and ends"
                        @change=${(event: Event) => {
                            const round = (event.target as HTMLSelectElement).value === 'round';
                            // Both keys together: a rounded corner with a square
                            // end is not a choice anybody makes on purpose.
                            this.setChannel(item, 'lineCap', { driver: 'single', value: round ? 'round' : 'butt' }, { silent: true });
                            this.setChannel(item, 'lineJoin', { driver: 'single', value: round ? 'round' : 'miter' });
                        }}>
                    <option value="round" ?selected=${value === 'round'}>Round</option>
                    <option value="miter" ?selected=${value !== 'round'}>Sharp</option>
                </select>
            </div>
        `;
    }

    /**
     * A fill's own edge: on or off, and a colour.
     *
     * It is a checkbox rather than a colour with a driver because
     * `fill-outline-color` is the only thing it can be — a fixed ~1px line the
     * GL spec gives no width for. A boundary of any other weight is an
     * `outline` entry of its own, which is what the note points at rather than
     * leaving the user hunting for a width slider that cannot exist.
     */
    private renderFillEdge(item: StyleListEntry, state: ChannelState | undefined): TemplateResult {
        const on = state !== undefined;
        const color = singleColorOf(state) ?? DATA_OUTLINE;
        return html`
            <div class="row check-row">
                <span class="name">${CHANNEL_LABELS.fillOutline}</span>
                <label class="check">
                    <input type="checkbox" .checked=${on}
                           @change=${(event: Event) => this.setChannel(item, 'fillOutline',
                               (event.target as HTMLInputElement).checked ? { driver: 'single', value: color } : undefined)}>
                    Draw a 1px edge
                </label>
                ${on ? this.renderColor(item, 'fillOutline', state) : nothing}
            </div>
            ${on ? html`<p class="muted">A thicker boundary is an Outline style of its own — add one above.</p>` : nothing}
        `;
    }

    /**
     * A label's text is a column, not a driver.
     *
     * The specification lists the text channel as "attribute (or an
     * expression)": there is no single value to pick and no classification to
     * run, so a driver dropdown here would be a question with one real answer.
     */
    private renderTextChannel(item: StyleListEntry, state: ChannelState | undefined): TemplateResult {
        const group = this.group(item.sourceId) ?? this.groups[0] ?? null;
        const columns = (group?.attributes ?? []).map((attribute) => attribute.name);
        const current = textColumnOf(state);
        const unreadable = state && !current;
        return html`
            <div class="row">
                <span class="name">${CHANNEL_LABELS.text}</span>
                ${unreadable
                    ? html`<span class="muted">a custom expression</span>`
                    : html`
                        <select aria-label="Label text"
                                @change=${(event: Event) => {
                                    const column = (event.target as HTMLSelectElement).value;
                                    this.setChannel(item, 'text', column ? textColumnState(column) : undefined);
                                }}>
                            <option value="">None</option>
                            ${columns.map((column) => html`
                                <option value=${column} ?selected=${column === current}>${column}</option>`)}
                        </select>`}
            </div>
            ${unreadable ? html`<pre class="custom">${JSON.stringify(state.driver === 'custom' ? state.expression : state)}</pre>` : nothing}
        `;
    }

    /**
     * The "show more..." link under a label's channels, and the tier it opens.
     *
     * Worded and styled like the legend's own link, rather than a `⋯` at the
     * end of the Text row: in use the `⋯` read as decoration and was not found. Under the channels, because
     * that is where "the rest of this style" is looked for. The tier holds no
     * driver, only constants. Absent where the engine reads none of it, rather
     * than a link that opens onto controls that change nothing.
     */
    private renderMoreToggle(item: StyleListEntry): TemplateResult | typeof nothing {
        if (item.entry.role !== 'label' || !labelMoreSupported(this.context?.engine)) return nothing;
        const open = this.moreOpen.has(item.entry.id);
        const overridden = hasMoreOverrides(item.entry);
        return html`
            <button type="button" class=${overridden ? 'more-toggle overridden' : 'more-toggle'}
                    aria-expanded=${open ? 'true' : 'false'}
                    aria-label=${overridden ? 'Font, placement and overlap (changed)' : 'Font, placement and overlap'}
                    title="Font, placement and overlap"
                    @click=${() => {
                        const next = new Set(this.moreOpen);
                        if (open) next.delete(item.entry.id);
                        else next.add(item.entry.id);
                        this.moreOpen = next;
                    }}>${open ? 'show less' : 'show more...'}</button>
            ${open ? this.renderLabelMore(item) : nothing}
        `;
    }

    /**
     * Font, placement, position and overlap — the label controls most label
     * work never needs, one step away rather than removed.
     */
    private renderLabelMore(item: StyleListEntry): TemplateResult {
        const { font, placement, anchor, offset, allowOverlap } = item.entry.channels;
        const group = this.group(item.sourceId) ?? this.groups[0] ?? null;
        const placements = placementOptions(group?.geometryTypes ?? []);
        const placed = placementOf(placement);
        const position = readPosition(anchor, offset);
        return html`
            <div class="level4">
                ${this.renderFont(item, font)}
                ${placements.length > 0 || placed !== 'point' ? html`
                    <div class="row">
                        <span class="name">${CHANNEL_LABELS.placement}</span>
                        ${placed === null
                            ? html`<span class="muted">a custom expression</span>`
                            : html`
                                <select aria-label="Where the label sits"
                                        @change=${(event: Event) => {
                                            const value = (event.target as HTMLSelectElement).value;
                                            // `point` is the GL default: saying nothing is saying it.
                                            this.setChannel(item, 'placement', value === 'point' ? undefined : { driver: 'single', value });
                                        }}>
                                    ${placements.map((option) => html`
                                        <option value=${option.value} ?selected=${option.value === placed}>${option.label}</option>`)}
                                    ${placements.some((option) => option.value === placed)
                                        ? nothing
                                        : html`<option value=${placed} selected>${placed}</option>`}
                                </select>`}
                    </div>` : nothing}
                ${placed === 'point' ? this.renderPosition(item, position) : nothing}
                <div class="row check-row">
                    <span class="name">${CHANNEL_LABELS.allowOverlap}</span>
                    <label class="check">
                        <input type="checkbox"
                               .checked=${allowOverlap?.driver === 'single' && allowOverlap.value === true}
                               ?disabled=${allowOverlap !== undefined && allowOverlap.driver !== 'single'}
                               @change=${(event: Event) => this.setChannel(item, 'allowOverlap',
                                   (event.target as HTMLInputElement).checked ? { driver: 'single', value: true } : undefined)}>
                        Draw every label, even where they collide
                    </label>
                </div>
            </div>
        `;
    }

    /**
     * A font is a face, and only faces the map is already drawing are offered.
     *
     * MapLibre renders text from a glyph server's pre-rendered faces, so bold
     * is a different face and one the server lacks draws no text at all,
     * silently. The current value is always listed, so opening the tier never
     * swaps an authored face for the first one in the list.
     */
    private renderFont(item: StyleListEntry, state: ChannelState | undefined): TemplateResult {
        if (state && !fontStackOf(state)) {
            return html`
                <div class="row">
                    <span class="name">${CHANNEL_LABELS.font}</span>
                    <span class="muted">a custom expression</span>
                </div>`;
        }
        const current = fontStackOf(state);
        const stacks = this.context?.fontStacks?.() ?? [];
        const options = current && !stacks.some((stack) => stack[0] === current[0]) ? [current, ...stacks] : stacks;
        return html`
            <div class="row">
                <span class="name">${CHANNEL_LABELS.font}</span>
                <select aria-label="Label font"
                        @change=${(event: Event) => {
                            const index = Number((event.target as HTMLSelectElement).value);
                            const stack = options[index];
                            this.setChannel(item, 'font', stack ? { driver: 'single', value: stack } : undefined);
                        }}>
                    <option value="-1" ?selected=${!current}>Map default</option>
                    ${options.map((stack, index) => html`
                        <option value=${String(index)} ?selected=${current?.[0] === stack[0]}>${stack[0]}</option>`)}
                </select>
            </div>
            ${options.length === 0 ? html`
                <p class="muted">
                    No other layer on this map names a font. A face the map cannot draw shows no text at all, so only
                    the default is offered.
                </p>` : nothing}
        `;
    }

    /** Which side of its point a label sits, and how far off it. */
    private renderPosition(item: StyleListEntry, position: LabelPosition | null): TemplateResult {
        if (!position) {
            return html`
                <div class="row">
                    <span class="name">${CHANNEL_LABELS.anchor}</span>
                    <span class="muted">set in the layer in a way this control cannot show</span>
                </div>`;
        }
        const write = (next: LabelPosition) => {
            const { anchor, offset } = writePosition(next);
            // Both keys in one write: an anchor without its offset puts the
            // label flush against its point for one interval.
            this.setChannel(item, 'offset', offset, { silent: true });
            this.setChannel(item, 'anchor', anchor);
        };
        const distance = position.direction === 'center' ? 0 : position.distance;
        return html`
            <div class="row">
                <span class="name">${CHANNEL_LABELS.anchor}</span>
                <select aria-label="Which side of the point"
                        @change=${(event: Event) => write({
                            direction: (event.target as HTMLSelectElement).value as LabelDirection,
                            // Moving off the spot with no distance would change nothing visible.
                            distance: position.direction === 'center' ? 0.5 : position.distance,
                        })}>
                    ${(Object.keys(DIRECTION_LABELS) as LabelDirection[]).map((direction) => html`
                        <option value=${direction} ?selected=${direction === position.direction}>${DIRECTION_LABELS[direction]}</option>`)}
                </select>
            </div>
            ${position.direction === 'center' ? nothing : html`
                <div class="row">
                    <span class="name">${CHANNEL_LABELS.offset}</span>
                    <input type="range" min="0" max="3" step="0.25" aria-label="Distance from the point"
                           .value=${String(distance)}
                           @input=${(event: Event) => write({
                               direction: position.direction,
                               distance: Number((event.target as HTMLInputElement).value),
                           })}>
                    <span class="value">${distance} em</span>
                </div>`}
        `;
    }

    /**
     * Changing the driver.
     *
     * Going back to `single` is the one way an expression is ever replaced, and
     * it is the user asking for it, having been shown what the channel holds.
     * Going to `attribute` classifies straight away rather than presenting an
     * empty form: level 4 opens already answered, so the map moves on the same
     * click and everything after it is adjustment.
     */
    private changeDriver(item: StyleListEntry, channel: ChannelId, driver: ChannelState['driver']): void {
        if (driver === 'attribute') {
            this.applyClassification(item, channel, this.settingsFor(item, channel));
            return;
        }
        if (driver === 'neighbours') {
            this.applyNeighbours(item, channel,
                this.neighbourColors.get(this.settingsKey(item, channel)) ?? DEFAULT_NEIGHBOUR_COLORS);
            return;
        }
        if (driver !== 'single') return;
        const fallback = defaultEntry(item.entry.role, item.entry.id).channels[channel];
        this.setChannel(item, channel, fallback ?? { driver: 'single', value: '#000000' });
    }

    /**
     * Opens a colour picker on a swatch.
     *
     * No `show()` on the first click, and that is the trick the legend's own
     * swatch uses: `useAsButton` gives Pickr a click listener on this button,
     * which was not yet listening during the click that created it, so the
     * first open must be explicit — and from the second click on it opens by
     * itself, where calling `show()` as well would toggle it straight shut.
     */
    private openPicker(key: string, button: HTMLElement, value: string, onChange: (rgba: string) => void): void {
        const existing = this.pickers.get(key);
        if (existing && existing.button === button) {
            existing.instance.setColor(value);
            return;
        }
        existing?.instance.destroy();
        const instance = createColorPicker({ button, value, paintButton: false, onChange });
        this.pickers.set(key, { button, instance });
        instance.show();
    }

    private destroyPickers(): void {
        for (const picker of this.pickers.values()) picker.instance.destroy();
        this.pickers.clear();
    }
}

/**
 * The swatch's background: one colour, or the palette as hard-edged bands.
 *
 * Bands rather than a smooth gradient, because the classification *is* bands —
 * a gradient would draw colours the map never uses.
 */
function swatchBackground(colors: readonly string[]): string {
    if (colors.length === 0) return 'background:transparent';
    if (colors.length === 1) return `background:${colors[0]}`;
    const stops = colors.map((color, index) => {
        const from = (index / colors.length) * 100;
        const to = ((index + 1) / colors.length) * 100;
        return `${color} ${from}%, ${color} ${to}%`;
    });
    return `background:linear-gradient(90deg, ${stops.join(', ')})`;
}

function round1(value: number): number {
    return Number(value.toFixed(1));
}

/**
 * The whole curve in a sentence, because the slider changes zooms the user is
 * not looking at: "2 px at z10, 6 px at z14" is what "thicker" just did
 * everywhere else.
 */
function zoomStopsSentence(state: ZoomChannel): string {
    const scale = state.scale ?? 1;
    const stops = state.stops.map(([zoom, value]) => `${round1(value * scale)}px at z${zoom}`);
    return `Grows with zoom: ${stops.join(', ')}. Between and beyond those, it follows the line.`;
}

/** The span a zoom-driven size covers, which is the only honest single number for it. */
function zoomRangeSummary(state: ZoomChannel): string {
    const values = state.stops.map(([, value]) => value * (state.scale ?? 1));
    const low = Math.min(...values);
    const high = Math.max(...values);
    return low === high ? `${low}px` : `${low}–${high}px by zoom`;
}

/** What a non-single driver is showing, in one phrase. */
function summarizeDriver(state: ChannelState): string {
    if (state.driver === 'neighbours') return 'no two neighbours alike';
    if (state.driver === 'custom') return 'a custom expression';
    if (state.driver === 'single') return String(state.value);
    if (state.driver === 'zoom') return zoomRangeSummary(state);
    const classification = state.classification;
    if (classification.kind === 'proportional') {
        return `sized by ${state.attribute}${classification.zoomFactor ? ', grows with zoom' : ''}`;
    }
    const count = classification.kind === 'ranges' ? classification.colors.length : classification.values.length;
    const noun = classification.kind === 'ranges' ? 'classes' : 'categories';
    return `${state.attribute}, ${count} ${noun}`;
}

declare global {
    interface HTMLElementTagNameMap {
        'webmapx-layer-styler': WebmapxLayerStyler;
    }
}
