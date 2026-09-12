/**
 * The layer styler, as a hierarchy rather than a sequence of steps.
 *
 * Specified in `docs/developer/layer-styler-specification.md`, which this file
 * implements levels 0–3 and 5 of; level 4 (the classification) still lives in
 * `webmapx-layer-style-dialog.ts`, which is still the panel the legend opens.
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
    entryName,
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
import type { SourceStyleGroup, StyleDialogContext } from './styler/style-context';
import type { StyleSubLayer } from '../utils/layer-style-model';
import {
    classifyColorChannel,
    classifySizeChannel,
    defaultSettings,
    isNumericType,
    schemesFor,
    cyclesCategories,
    METHOD_HINTS,
    METHOD_LABELS,
    OFFERED_METHODS,
    type ClassifySettings,
} from './styler/classify-channel';
import type { ClassificationMethod } from '../utils/classification';
import { colorByAdjacency } from '../utils/topological-coloring';
import { colorSchemesFor } from '../utils/color-schemes';
import { NEIGHBOUR_COLOR_FIELD } from '../utils/layer-style-model';
import {
    CHANNEL_KEYS,
    channelsOf,
    encodeStyleEntry,
    type ChannelId,
    type ChannelState,
    type StyleRole,
} from '../utils/layer-style-model';

/**
 * The biggest circle a proportional-symbol map draws, and the biggest label.
 *
 * A cap rather than a scale factor, because the radius is √value × coefficient
 * and the coefficient is derived from whatever the largest value happens to be:
 * without a ceiling, one outlier decides the size of the whole map.
 */
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
    custom: 'Custom (expression)',
};

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
    /** What the last colouring found, for the isolated-areas note. */
    @state() private lastColoring: ReturnType<typeof colorByAdjacency> | null = null;

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
        .row .value { flex: 0 0 3.5rem; text-align: right; font-variant-numeric: tabular-nums; }

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
    }

    private async loadGroups(context: StyleDialogContext): Promise<void> {
        if (!context.resample) return;
        const groups = await context.resample();
        // The user may have closed the panel, or opened it on another layer,
        // while the read was in flight.
        if (this.context !== context) return;
        this.groups = groups;
        if (!this.sourceId) this.sourceId = this.sourceIds()[0] ?? null;

        // Roles are decided partly by the *source's* geometry — a `line` over
        // polygons is that polygon's outline, and an outline is offered no dash
        // pattern — and the legend opens this panel before it has read the
        // layer, so the first decode had no geometry to go on. Re-read once it
        // does, but never over the user's own edits: a slow tiled source could
        // otherwise land after the first change and undo it.
        if (this.touched || this.openedWith.length === 0) return;
        this.list = readStyleList(this.layerId, this.openedWith, groups);
    }

    close(): void {
        this.visible = false;
        this.destroyPickers();
        this.hidePanel();
    }

    disconnectedCallback(): void {
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
        return item.styleable
            ? `${item.entry.id} ${summarizeEntry(item.entry)}`
            : `${item.entry.id} ${item.entry.origin?.type ?? ''}`;
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
        this.work = this.work.then(() => this.applyEntryNow(item, changed));
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
        const entry = { ...current.entry, channels };
        this.list = this.list.map((candidate) => (candidate === current ? { ...candidate, entry } : candidate));
        this.touched = true;
        if (options.silent) return;
        const updated = this.list.find((candidate) => candidate.entry.id === entry.id)!;
        this.applyEntry(updated, channel);
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
                        colour. Its opacity is above, and a WMS layer's own styles are chosen in the style dialog.
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
        const name = entryName(item.entry, this.layerId);
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
                                ${item.styleable ? summarizeEntry(item.entry) : `${item.entry.origin?.type ?? 'Other'} — not styled here`}
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

    private renderChannels(item: StyleListEntry): TemplateResult[] | TemplateResult {
        if (!item.styleable) {
            return html`<p class="muted">
                This part of the layer is drawn as <code>${item.entry.origin?.type}</code>, which this panel has no
                controls for. It is left exactly as it is.
            </p>`;
        }
        return channelsOf(item.entry.role).map((channel) => this.renderChannel(item, channel));
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
        if (classification.kind === 'ranges') seeded.classCount = classification.colors.length;
        if (classification.kind === 'categories') {
            seeded.maxCategories = Math.max(classification.values.length, 1);
            // More values than the palette has colours is what cycling *is*, and
            // it is visible in the data: the colour list repeats.
            seeded.cycle = new Set(classification.colors).size < classification.colors.length;
        }
        return seeded;
    }

    private updateSettings(item: StyleListEntry, channel: ChannelId, change: Partial<ClassifySettings>): void {
        const next = { ...this.settingsFor(item, channel), ...change };
        const merged = new Map(this.classifySettings);
        merged.set(this.settingsKey(item, channel), next);
        this.classifySettings = merged;
        this.applyClassification(item, channel, next);
    }

    /** Recomputes a classified channel and pushes it to the map. */
    private applyClassification(item: StyleListEntry, channel: ChannelId, settings: ClassifySettings): void {
        const features = this.featuresOf(item);
        if (!settings.attribute || features.length === 0) return;

        const outcome = channel === 'radius' || channel === 'textSize'
            ? classifySizeChannel(features, settings.attribute, channel === 'radius' ? MAX_BUBBLE_RADIUS : MAX_LABEL_SIZE)
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
        if (!this.canWriteFeatures(item)) return 'This layer\u2019s data cannot be added to';
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
                <p class="muted">
                    A colour here names no value, so this map has no legend — it is for showing where the areas are
                    and where their borders run.
                </p>
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
    private applyNeighbours(item: StyleListEntry, channel: ChannelId, colorCount: number): void {
        const counts = new Map(this.neighbourColors);
        counts.set(this.settingsKey(item, channel), colorCount);
        this.neighbourColors = counts;

        const group = this.group(item.sourceId) ?? this.groups[0] ?? null;
        const features = group?.features;
        if (!group || !features?.length || !this.context?.writeFeatures) {
            this.message = 'Colouring by neighbours needs the layer\u2019s own features, and this layer has not handed them over.';
            return;
        }

        const coloring = colorByAdjacency(features, { paletteSize: colorCount });
        this.lastColoring = coloring;
        features.forEach((feature, index) => {
            const value = coloring.colors[index];
            if (value === undefined) return;
            feature.properties = { ...(feature.properties ?? {}), [NEIGHBOUR_COLOR_FIELD]: value };
        });
        if (!this.context.writeFeatures(group.sourceId, features)) {
            this.message = 'This layer\u2019s data could not be added to, so the colouring has nothing the map can name.';
            return;
        }

        const scheme = colorSchemesFor(Math.min(Math.max(coloring.colorCount, 3), 12), 'qual')[0];
        if (!scheme) {
            this.message = `No palette has ${coloring.colorCount} distinct colours.`;
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
                                    ${attribute.name}${isKey ? ' — a colour each' : unusable ? ' — not a number' : ''}
                                </option>`;
                        })}
                    </select>
                </div>
                ${sizing ? html`
                    <p class="muted">
                        Sized straight from the value — twice the value draws twice the area, which a class
                        boundary would throw away. No classes, and no legend of them.
                    </p>`
                    : numeric ? this.renderNumericLevel4(item, channel, settings)
                    : this.renderCategoryLevel4(item, channel, settings)}
                ${sizing ? nothing : this.renderPalette(item, channel, settings)}
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
            <div class="row check-row">
                <span class="name">Breaks</span>
                <label class="check">
                    <input type="checkbox" .checked=${settings.rounded}
                           @change=${(event: Event) => this.updateSettings(item, channel, {
                               rounded: (event.target as HTMLInputElement).checked,
                           })}>
                    Round the breaks
                </label>
            </div>
        `;
    }

    private renderCategoryLevel4(item: StyleListEntry, channel: ChannelId, settings: ClassifySettings): TemplateResult {
        // The checkbox shows the *resolved* answer, so an untouched panel is
        // never ticked differently from the map it is describing.
        const cycling = cyclesCategories(this.featuresOf(item), settings);
        return html`
            <div class="row check-row">
                <span class="name">Colours</span>
                <label class="check">
                    <input type="checkbox" .checked=${cycling}
                           @change=${(event: Event) => this.updateSettings(item, channel, {
                               cycle: (event.target as HTMLInputElement).checked,
                           })}>
                    Give every value a colour, repeating
                </label>
            </div>
            ${cycling
                ? html`<p class="muted">
                        Every value is drawn, but a colour no longer names one value — so there is no legend.
                        The alternative greys out everything past the limit below.
                    </p>`
                : html`
                    <div class="row">
                        <span class="name">At most</span>
                        <input type="range" min="2" max="12" step="1" aria-label="How many categories get their own colour"
                               .value=${String(settings.maxCategories)}
                               @input=${(event: Event) => this.updateSettings(item, channel, {
                                   maxCategories: Number((event.target as HTMLInputElement).value),
                               })}>
                        <span class="value">${settings.maxCategories}</span>
                    </div>`}
        `;
    }

    private renderPalette(item: StyleListEntry, channel: ChannelId, settings: ClassifySettings): TemplateResult {
        const state = item.entry.channels[channel];
        const colorCount = state?.driver === 'attribute' && state.classification.kind !== 'proportional'
            ? state.classification.colors.length
            : settings.classCount;
        const numeric = this.isNumeric(item, settings.attribute);
        const type = numeric ? 'seq' : 'qual';
        const schemes = schemesFor(Math.min(colorCount, 9), type, settings);
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

/** What a non-single driver is showing, in one phrase. */
function summarizeDriver(state: ChannelState): string {
    if (state.driver === 'neighbours') return 'no two neighbours alike';
    if (state.driver === 'custom') return 'a custom expression';
    if (state.driver === 'single') return String(state.value);
    const classification = state.classification;
    if (classification.kind === 'proportional') return `sized by ${state.attribute}`;
    const count = classification.kind === 'ranges' ? classification.colors.length : classification.values.length;
    const noun = classification.kind === 'ranges' ? 'classes' : 'categories';
    return `${state.attribute}, ${count} ${noun}`;
}

declare global {
    interface HTMLElementTagNameMap {
        'webmapx-layer-styler': WebmapxLayerStyler;
    }
}
