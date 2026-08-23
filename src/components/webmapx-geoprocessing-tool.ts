/**
 * Geoprocessing Tool — one panel for every vector overlay/selection operation.
 *
 * One tool rather than one tool per operation: every operation is the same
 * pipeline (pick 1-2 layers → a few parameters → one GDAL call → a new layer),
 * differing only in an SQL template. Those differences live as data in
 * `utils/geoprocessing-operations.ts`; this component renders whatever an
 * operation declares, so adding an operation is a registry entry and no UI work.
 *
 * Flow is progressive disclosure on a single panel, not a wizard: choosing an
 * operation collapses the grid to a header chip and reveals the inputs below.
 * A back-button wizard would lose the student's parameter state on every change
 * of mind.
 *
 * Computation runs in the shared GDAL WASM worker (spatial-worker-manager).
 * Input:  all features from GeoJSON layers; rendered viewport features from
 *         vector tile layers (same limitation as the buffer tool).
 * Output: a new GeoJSON layer, styled to match the result's geometry type.
 *
 * Registration:
 *   dynamic-layout.ts → TOOL_ELEMENT_TAGS['geoprocessing'] = 'webmapx-geoprocessing-tool'
 *   dynamic-layout.ts → DEFAULT_TOOL_METADATA['geoprocessing']
 *   dynamic-layout.ts → KNOWN_TOOLS: { id: 'geoprocessing', ... }
 */

import { html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import type { IMapState } from '../store/IMapState';
import {
    SpatialOperationCancelled,
    cancelSpatialOps,
    prewarmSpatialWorker,
    runSpatialOp,
} from '../utils/spatial-worker-manager';
import type { WebmapxMapElement } from './webmapx-map';
import {
    AGGREGATION_FUNCTIONS,
    CATEGORY_LABELS,
    GEO_OPERATIONS,
    defaultParams,
    getOperation,
    DEFAULT_LIST_SEPARATOR,
    type AggregationSpec,
    type GeoOperation,
    type GeoOperationCategory,
    type GeoParamSpec,
    type GeoParamValues,
} from '../utils/geoprocessing-operations';
import { operationDiagram } from './internal/geoprocessing-diagrams';
import type { GeoprocessResult } from '../workers/geoprocessing-runner';
import { DATA_START, DATA_OUTLINE } from '../theme/data-colors';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import { isViewportLimitedSource } from '../utils/layer-features';

const OUTPUT_LAYER_PREFIX = 'webmapx-geoprocessing-out:';
const OUTPUT_SOURCE_PREFIX = 'webmapx-geoprocessing-src:';

/** Render types that can be queried for features (excludes raster). */
const VECTOR_LAYER_TYPES = new Set([
    'fill', 'line', 'circle', 'symbol', 'geojson', 'vector', 'label', 'fill-extrusion',
]);

interface LayerOption {
    id: string;
    label: string;
}

type SlotKey = 'a' | 'b';

interface SlotState {
    layerId: string;
    sourceLayer: string;
}

@customElement('webmapx-geoprocessing-tool')
export class WebmapxGeoprocessingTool extends WebmapxModalTool {
    // Not narrowed to a literal: a subclass pins one operation and registers
    // under its own id (see `webmapx-cartogram-tool`).
    readonly toolId: string = 'geoprocessing';

    // ─── State ───────────────────────────────────────────────────────────

    /**
     * Locks the panel to one operation, so it can be a tool in its own right.
     *
     * `webmapx-cartogram-tool` is this panel with `cartogram` pinned: the same
     * layer picking, attribute list, worker call, warnings and cancel, without a
     * second implementation of any of it. Empty means the full Analysis panel.
     */
    @property({ type: String, attribute: 'operation' }) pinnedOperation = '';

    @state() private availableLayers: LayerOption[] = [];
    @state() private operationId = '';
    @state() private slots: Record<SlotKey, SlotState> = {
        a: { layerId: '', sourceLayer: '' },
        b: { layerId: '', sourceLayer: '' },
    };
    @state() private params: GeoParamValues = {};
    @state() private outputName = '';
    @state() private outputNameEdited = false;
    @state() private overwrite = true;
    @state() private busy = false;
    @state() private error: string | null = null;
    @state() private notice: string | null = null;
    /** What the last run actually consumed and produced. */
    @state() private summary: string | null = null;
    /** Rows of a table-producing operation, shown in the panel instead of on the map. */
    @state() private table: Array<Record<string, unknown>> | null = null;
    /** Seconds the current run has been going, so a long wait stays accountable. */
    @state() private elapsed = 0;
    /** What the current run is chewing on, shown next to the spinner. */
    @state() private busyDetail = '';

    private elapsedTimer: ReturnType<typeof setInterval> | null = null;
    @state() private lastOutputLayerId: string | null = null;
    /** Attribute names per slot, loaded lazily for `field` parameters. */
    @state() private fieldNames: Record<SlotKey, string[]> = { a: [], b: [] };
    /** The subset of those that hold numbers, so "total" cannot be asked of text. */
    @state() private numericFieldNames: Record<SlotKey, string[]> = { a: [], b: [] };
    /** True while attribute names are being read from a layer. */
    @state() private fieldsLoading = false;

    private lastMapLayers: IMapState['mapLayers'] | null = null;
    private escHandler: ((e: KeyboardEvent) => void) | null = null;
    /** Guards against a stale field-name load overwriting a newer selection. */
    private fieldLoadToken = 0;

    // ─── Styles ──────────────────────────────────────────────────────────

    static styles = css`
        :host { display: block; }

        :host(:not([active])) .tool-content { display: none; }

        .tool-content {
            padding: var(--sl-spacing-medium);
            display: flex;
            flex-direction: column;
            gap: var(--sl-spacing-small);
            font-size: var(--sl-font-size-small);
        }

        .category {
            font-size: var(--sl-font-size-x-small);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: var(--color-text-secondary, #5a6773);
            margin-top: var(--sl-spacing-x-small);
        }

        /* Two columns, so the panel keeps the shared 300px default width. */
        .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: var(--sl-spacing-x-small);
        }

        .op {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            padding: 6px 4px;
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--radius-medium, 6px);
            background: none;
            color: inherit;
            font: inherit;
            font-size: var(--sl-font-size-x-small);
            line-height: 1.2;
            text-align: center;
            cursor: pointer;
        }

        .op:hover { border-color: var(--color-primary, #3a6ea5); }

        .op:focus-visible {
            outline: var(--webmapx-focus-width, 2px) solid var(--webmapx-focus-color, #3a6ea5);
            outline-offset: var(--webmapx-focus-offset, 2px);
        }

        .op svg { width: 100%; height: auto; display: block; }

        /*
         * Hover walks the diagram through the operation: first input A, then B is
         * added, then the result appears. At rest everything is shown at once, so
         * the grid still reads without pointing at anything — and touch devices,
         * which never hover, lose nothing.
         *
         * Selectors are on the group classes the diagram module emits (.gp-a /
         * .gp-b / .gp-result), so a new diagram animates without extra CSS.
         *
         * Hover only, deliberately not :focus-visible: the panel moves focus to
         * the first tool control on activation, which would leave the first
         * operation looping the moment the panel opens.
         */
        .op:hover .gp-b,
        .chosen:hover .gp-b {
            animation: gp-show-b 2.4s ease-in-out infinite;
        }

        .op:hover .gp-result,
        .chosen:hover .gp-result {
            animation: gp-show-result 2.4s ease-in-out infinite;
        }

        /* B joins a third of the way in, the result two thirds in — both share the
           2.4s cycle so the three phases stay locked together. */
        @keyframes gp-show-b {
            0%, 28% { opacity: 0; }
            36%, 100% { opacity: 1; }
        }

        @keyframes gp-show-result {
            0%, 61% { opacity: 0; }
            69%, 100% { opacity: 1; }
        }

        /* Stacked, not side by side: at the panel's 300px the description would be
           squeezed into a ~90px column and run to a dozen lines. */
        .chosen {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: var(--sl-spacing-x-small);
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--radius-medium, 6px);
        }

        .chosen-head {
            display: flex;
            align-items: center;
            gap: var(--sl-spacing-x-small);
        }

        .chosen svg { width: 72px; height: auto; flex: none; }

        .chosen .name { flex: 1; min-width: 0; font-weight: 600; }

        .chosen .description {
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
        }

        .hint {
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
            margin-top: 2px;
        }

        /* Not an sl-alert: this sits under a form field and must not shout, but
           it does need to be distinguishable from the neutral hint above it. */
        .hint.warning {
            display: flex;
            align-items: baseline;
            gap: 4px;
            color: var(--sl-color-warning-700, #915930);
        }

        .field-label {
            display: block;
            font-size: var(--sl-input-label-font-size-small, 0.875rem);
            margin-bottom: 4px;
        }

        .agg-row {
            display: grid;
            grid-template-columns: 1fr 1fr auto;
            align-items: center;
            gap: 4px;
            margin-bottom: 4px;
        }

        /* Indented under its row: these belong to the list function above them,
           and only appear when it is chosen. Wrapping, not a fixed grid — three
           controls do not fit across a 300px panel. */
        .agg-options {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 4px;
            margin: 0 0 8px 12px;
        }

        .agg-options sl-input { flex: 1 1 90px; min-width: 70px; }
        .agg-options sl-select { flex: 0 1 110px; }

        /* The table scrolls inside its own box: at 300px it cannot be shown in
           full, and widening the panel would push the buttons off screen. */
        .table-wrap {
            max-height: 240px;
            overflow: auto;
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--radius-medium, 6px);
        }

        table {
            border-collapse: collapse;
            font-size: var(--sl-font-size-x-small);
            white-space: nowrap;
        }

        th, td {
            padding: 3px 8px;
            text-align: left;
            border-bottom: 1px solid var(--color-border, #d5dbe1);
        }

        th {
            position: sticky;
            top: 0;
            background: var(--color-surface, #ffffff);
            font-weight: 600;
        }

        td:not(:first-child) { text-align: right; }

        tbody tr:last-child td { border-bottom: none; }

        .summary {
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
            border-top: 1px solid var(--color-border, #d5dbe1);
            padding-top: var(--sl-spacing-x-small);
        }

        .actions {
            display: flex;
            align-items: center;
            gap: var(--sl-spacing-x-small);
            justify-content: flex-end;
            margin-top: var(--sl-spacing-x-small);
        }

        .status {
            display: flex;
            align-items: center;
            gap: var(--sl-spacing-x-small);
            margin-right: auto;
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
        }

        sl-alert { font-size: var(--sl-font-size-x-small); }

        sl-select, sl-input {
            --sl-input-height-medium: 28px;
            --sl-input-font-size-medium: var(--sl-font-size-small);
        }

        /* The animation is explanatory, not decorative — but it loops, so it must
           stop entirely rather than merely shorten when motion is unwelcome. */
        @media (prefers-reduced-motion: reduce) {
            .op:hover .gp-b,
            .op:focus-visible .gp-b,
            .chosen:hover .gp-b,
            .op:hover .gp-result,
            .op:focus-visible .gp-result,
            .chosen:hover .gp-result {
                animation: none;
            }
        }
    `;

    // ─── Lifecycle ───────────────────────────────────────────────────────

    protected onActivate(): void {
        // A pinned panel is one operation with its own place in the toolbar — the
        // grid of every operation would be noise there, and "Change" would take
        // the student somewhere the tool does not claim to go.
        if (this.pinnedOperation && this.operationId !== this.pinnedOperation) {
            this.handleOperationSelect(this.pinnedOperation);
        }

        this.escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') this.deactivate(); };
        document.addEventListener('keydown', this.escHandler);

        // GDAL WASM takes a few seconds to instantiate and is otherwise loaded on
        // the first Calculate, where the student is already waiting. Opening the
        // panel is the moment they start reading and filling in a form, so the
        // load costs nothing here. Deferred past paint so it cannot delay the
        // panel appearing, and harmless if the worker is already warm.
        void this.afterPaint().then(() => prewarmSpatialWorker());
    }

    protected onDeactivate(): void {
        if (this.escHandler) document.removeEventListener('keydown', this.escHandler);
        this.escHandler = null;
    }

    protected onStateChanged(state: IMapState): void {
        const mapLayers = state.mapLayers ?? {};
        this.lastMapLayers = mapLayers;

        this.availableLayers = Object.entries(mapLayers)
            .filter(([, meta]) => {
                const t = (meta as Record<string, unknown>).layerType as string | undefined;
                return !t || VECTOR_LAYER_TYPES.has(t);
            })
            .map(([id, meta]) => ({
                id,
                label: (meta as Record<string, unknown>).label as string ?? id,
            }));

        // A selected layer that has been removed from the map must not stay selected.
        for (const key of ['a', 'b'] as SlotKey[]) {
            const slot = this.slots[key];
            if (slot.layerId && !this.availableLayers.some(l => l.id === slot.layerId)) {
                this.setSlot(key, { layerId: '', sourceLayer: '' });
            }
        }

        if (this.lastOutputLayerId && !mapLayers[this.lastOutputLayerId]) {
            this.lastOutputLayerId = null;
        }

        this.autoSelectLayers();
    }

    // ─── Derived state ───────────────────────────────────────────────────

    private get operation(): GeoOperation | undefined {
        return getOperation(this.operationId);
    }

    private labelOf(layerId: string): string {
        return this.availableLayers.find(l => l.id === layerId)?.label ?? layerId;
    }

    /**
     * Vector-tile source layers of a map layer, so the user can pick which one
     * to process. Mirrors the buffer tool's traversal of registered sublayers.
     */
    private sourceLayers(layerId: string): string[] {
        const meta = (this.lastMapLayers ?? {})[layerId] as Record<string, unknown> | undefined;
        const sublayers = meta?.sublayers;
        if (!Array.isArray(sublayers)) return [];
        const seen = new Set<string>();
        const collect = (items: unknown[]): void => {
            for (const sub of items) {
                if (!sub || typeof sub !== 'object') continue;
                const s = sub as Record<string, unknown>;
                const sl = s['source-layer'];
                if (typeof sl === 'string' && sl) seen.add(sl);
                if (Array.isArray(s.sublayers)) collect(s.sublayers);
            }
        };
        collect(sublayers);
        return [...seen];
    }

    /**
     * True when a layer's features can only be read from what the map has drawn.
     *
     * GeoJSON sources hand over their whole dataset; every other source type
     * (vector tiles above all) is answered from `queryRenderedFeatures`, so the
     * tool sees the current view and nothing else. That difference silently
     * changes the *answer* — a union against a half-loaded layer reports the
     * missing half as "only in the first layer" — so it has to be visible in the
     * panel, not just documented.
     */
    private isViewportLimited(layerId: string): boolean {
        const sourceId = (this.lastMapLayers ?? {})[layerId]?.sourceId as string | undefined;
        return isViewportLimitedSource(this.adapter, sourceId);
    }

    private get mapElement(): (WebmapxMapElement & {
        addLayerRequest: (config: Record<string, unknown>) => Promise<boolean>;
        removeInlineLayer: (layerId: string) => void;
    }) | null {
        return this.mapHost as never;
    }

    // ─── Selection handling ──────────────────────────────────────────────

    private setSlot(key: SlotKey, patch: Partial<SlotState>): void {
        this.slots = { ...this.slots, [key]: { ...this.slots[key], ...patch } };
    }

    /** Pre-fill empty slots with distinct layers so the tool is usable in one click. */
    private autoSelectLayers(): void {
        const op = this.operation;
        if (!op) return;
        for (const input of op.inputs) {
            if (this.slots[input.key].layerId) continue;
            const taken = new Set(op.inputs.map(i => this.slots[i.key].layerId).filter(Boolean));
            const candidate = this.availableLayers.find(l => !taken.has(l.id));
            if (candidate) this.selectLayer(input.key, candidate.id, false);
        }
        this.syncOutputName();
    }

    private selectLayer(key: SlotKey, layerId: string, resetOutput = true): void {
        const sources = this.sourceLayers(layerId);
        this.setSlot(key, { layerId, sourceLayer: sources[0] ?? '' });
        this.fieldNames = { ...this.fieldNames, [key]: [] };
        this.error = null;
        if (resetOutput) {
            // The previous result belongs to a different input; offering to replace
            // it would silently delete an unrelated layer.
            this.lastOutputLayerId = null;
            this.syncOutputName();
        }
        void this.loadFieldNames(key);
    }

    private handleOperationSelect(id: string): void {
        const op = getOperation(id);
        if (!op) return;
        this.operationId = id;
        this.params = defaultParams(op);
        this.error = null;
        this.notice = null;
        this.summary = null;
        this.table = null;
        this.lastOutputLayerId = null;
        this.outputNameEdited = false;
        this.autoSelectLayers();
        void this.loadFieldNames('a');
        if (op.inputs.some(i => i.key === 'b')) void this.loadFieldNames('b');
    }

    private syncOutputName(): void {
        if (this.outputNameEdited) return;
        const op = this.operation;
        if (!op) return;
        const labelA = this.slots.a.sourceLayer || this.labelOf(this.slots.a.layerId);
        const labelB = this.slots.b.sourceLayer || this.labelOf(this.slots.b.layerId);
        this.outputName = op.outputName(labelA || 'layer', labelB || 'layer');
    }

    /**
     * Load attribute names for a slot, but only when an operation actually asks
     * for a `field` parameter — querying features is expensive enough that doing
     * it for every layer selection would stall the panel.
     */
    private async loadFieldNames(key: SlotKey): Promise<void> {
        const op = this.operation;
        const wanted = (p: GeoParamSpec) => (p.kind === 'field' || p.kind === 'aggregations') && p.from === key;
        if (!op || !op.params.some(wanted)) return;

        const slot = this.slots[key];
        if (!slot.layerId || !this.adapter) return;

        const token = ++this.fieldLoadToken;
        this.fieldsLoading = true;
        try {
            // Let the form paint before reading the layer. Collecting attribute
            // names walks every feature of the source — for a large layer that is
            // enough main-thread work to make the click feel unresponsive, and it
            // is work the student does not need before seeing the form.
            await this.afterPaint();
            if (token !== this.fieldLoadToken) return;

            const fc = await this.queryFeatures(key);
            if (token !== this.fieldLoadToken) return;

            const names = new Set<string>();
            // Which fields can be added up at all. Summing a text column is not an
            // error in SQLite — it quietly returns nonsense (summing ISO codes gave
            // -396), so the wrong choice has to be unofferable rather than caught.
            const numeric = new Set<string>();
            const nonNumeric = new Set<string>();
            for (const f of fc.features) {
                for (const [k, v] of Object.entries(f.properties ?? {})) {
                    if (!k || (v !== null && typeof v === 'object')) continue;
                    names.add(k);
                    if (typeof v === 'number') numeric.add(k);
                    else if (v !== null) nonNumeric.add(k);
                }
            }
            // A field that is a number in some features and text in others cannot
            // be trusted to add up either.
            for (const field of nonNumeric) numeric.delete(field);

            this.fieldNames = { ...this.fieldNames, [key]: [...names] };
            this.numericFieldNames = { ...this.numericFieldNames, [key]: [...numeric] };
        } catch {
            // Attribute list is a convenience; a failure here must not block the run.
            if (token === this.fieldLoadToken) {
                this.fieldNames = { ...this.fieldNames, [key]: [] };
                this.numericFieldNames = { ...this.numericFieldNames, [key]: [] };
            }
        } finally {
            if (token === this.fieldLoadToken) this.fieldsLoading = false;
        }
    }

    /** Resolves once the current render has been painted. */
    private async afterPaint(): Promise<void> {
        await this.updateComplete;
        await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
    }

    private queryFeatures(key: SlotKey): Promise<GeoJSON.FeatureCollection> {
        const slot = this.slots[key];
        const opts = slot.sourceLayer ? { sourceLayer: slot.sourceLayer } : undefined;
        return this.adapter!.queryLayerFeatures(slot.layerId, opts);
    }

    // ─── Run ─────────────────────────────────────────────────────────────

    private async handleRun(): Promise<void> {
        const op = this.operation;
        if (!op || !this.adapter || this.busy) return;

        const needsB = op.inputs.some(i => i.key === 'b');
        if (!this.slots.a.layerId || (needsB && !this.slots.b.layerId)) {
            this.error = 'Choose an input layer for every slot.';
            return;
        }

        this.busy = true;
        this.error = null;
        this.notice = null;
        this.summary = null;
        this.table = null;
        this.busyDetail = '';
        this.startElapsedTimer();

        try {
            const inputA = await this.queryFeatures('a');
            if (!inputA.features.length) {
                this.error = this.emptyInputMessage('a');
                return;
            }

            let inputB: GeoJSON.FeatureCollection | undefined;
            if (needsB) {
                inputB = await this.queryFeatures('b');
                if (!inputB.features.length) {
                    this.error = this.emptyInputMessage('b');
                    return;
                }
            }

            // Feature counts are the honest predictor of how long this will take,
            // and they are only known once both layers have been queried. Showing
            // them beats a progress bar GDAL cannot provide.
            this.busyDetail = inputB
                ? `${inputA.features.length} × ${inputB.features.length} features`
                : `${inputA.features.length} features`;

            const result = await runSpatialOp({
                op: 'geoprocess',
                operationId: op.id,
                inputA,
                inputB,
                params: this.params,
                centerLat: this.adapter.getViewportState().center[1] ?? 0,
            });

            // Always report how many features actually went in. With a
            // viewport-limited layer the count is the only signal that the answer
            // covers less than the whole layer.
            this.summary = this.runSummary(op, inputA, inputB, result);

            // Features GDAL could not repair, or that the operation could not
            // use, are gone from the answer. Silence there reads as a bug in the
            // operation, so the count is part of the result, not a console log.
            const warnings = (result as GeoprocessResult).warnings ?? [];
            if (warnings.length) this.notice = warnings.join(' ');

            if (!result.features.length) {
                this.notice = [`${op.label} produced no features — the layers may not overlap.`, ...warnings].join(' ');
                return;
            }

            // A table operation answers a question; it does not draw anything, so
            // adding a layer with no geometry would just clutter the legend.
            if (op.outputGeometry === 'table') {
                this.table = result.features.map(f => f.properties ?? {});
                return;
            }

            await this.addResultLayer(op, result);
        } catch (err) {
            // Cancelling is a choice, not a failure: say so quietly rather than
            // showing a red alert for something the user just asked for.
            if (err instanceof SpatialOperationCancelled) {
                this.notice = `${op.label} cancelled after ${this.elapsed} s.`;
                this.summary = null;
            } else {
                // The panel has room for one sentence; the stack is what makes a
                // failure diagnosable, and a message like "x is not a function"
                // says nothing at all without it.
                console.error(`[geoprocessing] ${op.id} failed`, err);
                this.error = err instanceof Error ? err.message : String(err);
            }
        } finally {
            this.busy = false;
            this.stopElapsedTimer();
        }
    }

    private startElapsedTimer(): void {
        this.stopElapsedTimer();
        this.elapsed = 0;
        const startedAt = Date.now();
        this.elapsedTimer = setInterval(() => {
            this.elapsed = Math.round((Date.now() - startedAt) / 1000);
        }, 1000);
    }

    private stopElapsedTimer(): void {
        if (this.elapsedTimer) clearInterval(this.elapsedTimer);
        this.elapsedTimer = null;
    }

    /**
     * Stop the running calculation.
     *
     * This terminates the shared spatial worker, so it also aborts unrelated
     * spatial work such as a file import running at the same time — acceptable
     * only because it is an explicit user action, never automatic.
     */
    private handleCancel(): void {
        if (!this.busy) return;
        cancelSpatialOps();
    }

    /**
     * Why a layer yielded nothing. "Zoom in" is the wrong advice for a layer the
     * map never drew — an invisible layer, or one whose filter excluded
     * everything, returns zero features no matter where you are.
     */
    private emptyInputMessage(key: SlotKey): string {
        const label = this.labelOf(this.slots[key].layerId);
        if (!this.isViewportLimited(this.slots[key].layerId)) {
            return `“${label}” has no features.`;
        }
        return `“${label}” has no features in view. Only what the map has drawn is used, so make sure the layer is switched on, is within its zoom range, and that the features you need are on screen — a layer filter also removes features here.`;
    }

    private runSummary(
        op: GeoOperation,
        inputA: GeoJSON.FeatureCollection,
        inputB: GeoJSON.FeatureCollection | undefined,
        result: GeoJSON.FeatureCollection,
    ): string {
        const count = (n: number) => `${n} ${n === 1 ? 'feature' : 'features'}`;
        const parts = [`${count(inputA.features.length)} from “${this.labelOf(this.slots.a.layerId)}”`];
        if (inputB) parts.push(`${count(inputB.features.length)} from “${this.labelOf(this.slots.b.layerId)}”`);
        return `${op.label} used ${parts.join(' and ')} → ${count(result.features.length)}.`;
    }

    private async addResultLayer(op: GeoOperation, result: GeoJSON.FeatureCollection): Promise<void> {
        const suffix = this.overwrite ? '' : `-${Date.now()}`;
        const outputLayerId = `${OUTPUT_LAYER_PREFIX}${op.id}:${this.slots.a.layerId}${suffix}`;
        const outputSourceId = `${OUTPUT_SOURCE_PREFIX}${op.id}:${this.slots.a.layerId}${suffix}`;

        // removeInlineLayer leaves the source behind, so blank its data first —
        // otherwise the previous result stays on screen until the new one loads.
        if (this.overwrite && this.lastOutputLayerId && this.mapElement) {
            this.adapter?.getSource(outputSourceId)?.setData({ type: 'FeatureCollection', features: [] });
            try {
                this.mapElement.removeInlineLayer(this.lastOutputLayerId);
            } catch {
                /* already gone */
            }
        }

        const label = this.outputName.trim() || op.outputName(this.labelOf(this.slots.a.layerId), this.labelOf(this.slots.b.layerId));

        const layerConfig: Record<string, unknown> = {
            id: outputLayerId,
            source: outputSourceId,
            sources: {
                [outputSourceId]: { id: outputSourceId, type: 'geojson', data: result },
            },
            ...this.styleFor(result),
            metadata: { label, dynamic: true, legendRole: 'overlay' },
        };

        await this.mapElement?.addLayerRequest(layerConfig);
        this.lastOutputLayerId = outputLayerId;
    }

    /**
     * Pick a render type from the result itself rather than from the operation's
     * declared output: an operation like clip or select-by-location returns
     * whatever geometry its input had.
     */
    private styleFor(result: GeoJSON.FeatureCollection): Record<string, unknown> {
        const types = new Set(result.features.map(f => f.geometry?.type).filter(Boolean));
        const has = (...names: string[]) => names.some(n => types.has(n as GeoJSON.GeoJsonGeometryTypes));

        if (has('Polygon', 'MultiPolygon')) {
            return {
                type: 'fill',
                paint: {
                    'fill-color': DATA_START,
                    'fill-opacity': 0.35,
                    // Not the fill colour: an outline that matches its own fill
                    // is invisible, so a dissolve result reads as one blob
                    // instead of as the separate shapes it produced.
                    'fill-outline-color': DATA_OUTLINE,
                },
            };
        }
        if (has('LineString', 'MultiLineString')) {
            return { type: 'line', paint: { 'line-color': DATA_START, 'line-width': 3 } };
        }
        return {
            type: 'circle',
            paint: {
                'circle-color': DATA_START,
                'circle-radius': 5,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 1.5,
            },
        };
    }

    // ─── Render ──────────────────────────────────────────────────────────

    protected render() {
        return html`
            <div class="tool-content">
                ${this.operation
                    ? this.renderChosenOperation(this.operation)
                    // A pinned panel whose operation has not been applied yet shows
                    // nothing rather than the full grid — it is one operation's tool.
                    : (this.pinnedOperation ? nothing : this.renderOperationGrid())}
                ${this.operation ? this.renderForm(this.operation) : nothing}
                ${this.table ? this.renderTable(this.table) : nothing}
                ${this.summary ? html`<div class="summary">${this.summary}</div>` : nothing}
                ${this.renderMessages()}
                ${this.renderActions()}
            </div>
        `;
    }

    private renderOperationGrid(): TemplateResult {
        const categories = [...new Set(GEO_OPERATIONS.map(op => op.category))] as GeoOperationCategory[];
        return html`
            <div class="hint">Choose what you want to do:</div>
            ${categories.map(category => html`
                <div class="category">${CATEGORY_LABELS[category]}</div>
                <div class="grid">
                    ${GEO_OPERATIONS.filter(op => op.category === category).map(op => html`
                        <button
                            class="op"
                            type="button"
                            title=${op.description}
                            @click=${() => this.handleOperationSelect(op.id)}
                        >
                            ${operationDiagram(op.id)}
                            <span>${op.label}</span>
                        </button>
                    `)}
                </div>
            `)}
        `;
    }

    private renderChosenOperation(op: GeoOperation): TemplateResult {
        return html`
            <div class="chosen">
                <div class="chosen-head">
                    ${operationDiagram(op.id)}
                    <div class="name">${op.label}</div>
                    ${this.pinnedOperation ? nothing : html`
                        <sl-button
                            size="small"
                            variant="text"
                            ?disabled=${this.busy}
                            @click=${() => { this.operationId = ""; this.error = null; this.notice = null; this.summary = null; this.table = null; }}
                        >Change</sl-button>
                    `}
                </div>
                <div class="description">${op.description}</div>
            </div>
        `;
    }

    private renderForm(op: GeoOperation): TemplateResult {
        const hasLayers = this.availableLayers.length > 0;
        return html`
            ${op.inputs.map(input => {
                const slot = this.slots[input.key];
                const sources = this.sourceLayers(slot.layerId);
                return html`
                    <div>
                        <sl-select
                            label=${input.label}
                            size="small"
                            value=${slot.layerId}
                            ?disabled=${!hasLayers || this.busy}
                            @sl-change=${(e: Event) => this.selectLayer(input.key, (e.target as HTMLSelectElement).value)}
                        >
                            ${hasLayers
                                ? this.availableLayers.map(l => html`<sl-option value=${l.id}>${l.label}</sl-option>`)
                                : html`<sl-option value="">No vector layers on the map</sl-option>`}
                        </sl-select>
                        ${input.hint ? html`<div class="hint">${input.hint}</div>` : nothing}
                        ${slot.layerId && this.isViewportLimited(slot.layerId) ? html`
                            <div class="hint warning">
                                <sl-icon name="exclamation-triangle"></sl-icon>
                                Only the features drawn in the current view are used.
                            </div>
                        ` : nothing}
                        ${sources.length > 1 ? html`
                            <sl-select
                                label="Sub-layer"
                                size="small"
                                value=${slot.sourceLayer}
                                ?disabled=${this.busy}
                                @sl-change=${(e: Event) => {
                                    this.setSlot(input.key, { sourceLayer: (e.target as HTMLSelectElement).value });
                                    this.fieldNames = { ...this.fieldNames, [input.key]: [] };
                                    this.syncOutputName();
                                    void this.loadFieldNames(input.key);
                                }}
                            >
                                ${sources.map(s => html`<sl-option value=${s}>${s}</sl-option>`)}
                            </sl-select>
                        ` : nothing}
                    </div>
                `;
            })}

            ${op.params
                // A parameter another parameter's value makes irrelevant is not
                // disabled but absent: the panel is already dense, and its value
                // still travels with the request.
                .filter(param => param.showWhen?.(this.params) !== false)
                .map(param => this.renderParam(param))}

            ${op.outputGeometry === 'table' ? nothing : html`
                <sl-input
                    label="Output layer name"
                    size="small"
                    .value=${this.outputName}
                    ?disabled=${this.busy}
                    @sl-change=${(e: Event) => {
                        this.outputName = (e.target as HTMLInputElement).value;
                        this.outputNameEdited = true;
                    }}
                ></sl-input>
            `}

            ${this.lastOutputLayerId ? html`
                <sl-checkbox
                    size="small"
                    ?checked=${this.overwrite}
                    ?disabled=${this.busy}
                    @sl-change=${(e: Event) => { this.overwrite = (e.target as HTMLInputElement).checked; }}
                >Replace previous result</sl-checkbox>
            ` : nothing}
        `;
    }

    private renderParam(param: GeoParamSpec): TemplateResult {
        const setParam = (value: string | number) => {
            this.params = { ...this.params, [param.key]: value };
        };

        if (param.kind === 'number') {
            return html`
                <div>
                    <sl-input
                        label=${param.label}
                        size="small"
                        type="number"
                        min=${param.min ?? nothing}
                        max=${param.max ?? nothing}
                        step=${param.step ?? nothing}
                        value=${String(this.params[param.key] ?? param.default)}
                        ?disabled=${this.busy}
                        @sl-change=${(e: Event) => {
                            const v = parseFloat((e.target as HTMLInputElement).value);
                            if (!Number.isNaN(v)) setParam(v);
                        }}
                    >
                        ${param.unit ? html`<span slot="suffix">${param.unit}</span>` : nothing}
                    </sl-input>
                    ${param.hint ? html`<div class="hint">${param.hint}</div>` : nothing}
                </div>
            `;
        }

        if (param.kind === 'select') {
            return html`
                <div>
                    <sl-select
                        label=${param.label}
                        size="small"
                        value=${String(this.params[param.key] ?? param.default)}
                        ?disabled=${this.busy}
                        @sl-change=${(e: Event) => setParam((e.target as HTMLSelectElement).value)}
                    >
                        ${param.options.map(o => html`<sl-option value=${o.value}>${o.label}</sl-option>`)}
                    </sl-select>
                    ${param.hint ? html`<div class="hint">${param.hint}</div>` : nothing}
                </div>
            `;
        }

        if (param.kind === 'aggregations') return this.renderAggregations(param);

        // A numeric-only field list is offered whole, not filtered as you type:
        // a cartogram sized by a text column is not an error anywhere in the
        // pipeline, it just produces nothing.
        const names = param.numericOnly ? this.numericFieldNames[param.from] : this.fieldNames[param.from];
        return html`
            <div>
                <sl-select
                    label=${param.label}
                    size="small"
                    value=${String(this.params[param.key] ?? '')}
                    ?disabled=${this.busy || !names.length}
                    @sl-change=${(e: Event) => setParam((e.target as HTMLSelectElement).value)}
                >
                    ${param.optional ? html`<sl-option value="">(all features together)</sl-option>` : nothing}
                    ${names.map(n => html`<sl-option value=${n}>${n}</sl-option>`)}
                </sl-select>
                ${param.hint ? html`<div class="hint">${param.hint}</div>` : nothing}
            </div>
        `;
    }

    /**
     * The repeatable field + function rows.
     *
     * Starts empty rather than with a blank row: `feature_count` is always in the
     * result, so doing nothing here is a perfectly good answer and an empty row
     * would look like something to fill in.
     */
    private renderAggregations(param: Extract<GeoParamSpec, { kind: 'aggregations' }>): TemplateResult {
        const rows = this.aggregationsFor(param.key);
        const names = this.fieldNames[param.from];
        const numeric = this.numericFieldNames[param.from];
        // The field comes first and every field is offered; the *functions* are
        // then narrowed to what that field supports. Filtering the fields by the
        // function instead (the first attempt) inverted the natural order and made
        // text fields look unavailable.
        const isNumeric = (field: string) => numeric.includes(field);
        const functionsFor = (field: string) =>
            AGGREGATION_FUNCTIONS.filter(f => !f.numericOnly || isNumeric(field));

        const update = (next: AggregationSpec[]) => {
            this.params = { ...this.params, [param.key]: next };
        };

        /**
         * Edits are applied to the rows as they are *now*, not to the array this
         * render closed over. Two changes within one render — picking a field and
         * then its function — would otherwise both start from the same stale copy,
         * and the second would quietly undo the first.
         */
        const patchRow = (index: number, patch: Partial<AggregationSpec>) => {
            update(this.aggregationsFor(param.key).map((row, i) => (i === index ? { ...row, ...patch } : row)));
        };

        return html`
            <div>
                <label class="field-label">${param.label}</label>
                ${rows.map((row, index) => html`
                    <div class="agg-row">
                        <sl-select
                            size="small"
                            value=${row.field}
                            ?disabled=${this.busy || !names.length}
                            @sl-change=${(e: Event) => {
                                const field = (e.target as HTMLSelectElement).value;
                                // Picking a text field while "total" is selected
                                // would leave a pair that returns nonsense, so the
                                // function falls back to one the field supports.
                                const allowed = functionsFor(field);
                                const fn = allowed.some(f => f.value === row.fn) ? row.fn : allowed[0].value;
                                patchRow(index, { field, fn });
                            }}
                        >
                            ${names.map(n => html`<sl-option value=${n}>${n}</sl-option>`)}
                        </sl-select>
                        <sl-select
                            size="small"
                            value=${row.fn}
                            ?disabled=${this.busy}
                            @sl-change=${(e: Event) => patchRow(index, {
                                fn: (e.target as HTMLSelectElement).value as AggregationSpec['fn'],
                            })}
                        >
                            ${functionsFor(row.field).map(f => html`
                                <sl-option value=${f.value}>${f.label}</sl-option>
                            `)}
                        </sl-select>
                        <sl-icon-button
                            name="x-lg"
                            label="Remove"
                            ?disabled=${this.busy}
                            @click=${() => update(this.aggregationsFor(param.key).filter((_, i) => i !== index))}
                        ></sl-icon-button>
                    </div>
                    ${row.fn === 'list' ? html`
                        <div class="agg-options">
                            <sl-input
                                size="small"
                                placeholder="separator"
                                .value=${row.separator ?? DEFAULT_LIST_SEPARATOR}
                                ?disabled=${this.busy}
                                @sl-change=${(e: Event) => patchRow(index, { separator: (e.target as HTMLInputElement).value })}
                            ></sl-input>
                            <sl-select
                                size="small"
                                value=${row.order ?? 'asc'}
                                ?disabled=${this.busy}
                                @sl-change=${(e: Event) => patchRow(index, {
                                    order: (e.target as HTMLSelectElement).value as 'asc' | 'desc',
                                })}
                            >
                                <sl-option value="asc">A → Z</sl-option>
                                <sl-option value="desc">Z → A</sl-option>
                            </sl-select>
                            <sl-checkbox
                                size="small"
                                ?checked=${row.unique ?? false}
                                ?disabled=${this.busy}
                                @sl-change=${(e: Event) => patchRow(index, { unique: (e.target as HTMLInputElement).checked })}
                            >once</sl-checkbox>
                        </div>
                    ` : nothing}
                `)}
                <sl-button
                    size="small"
                    variant="text"
                    ?disabled=${this.busy || !names.length}
                    @click=${() => update([
                        ...this.aggregationsFor(param.key),
                        // Default to a total of a number when there is one, and to
                        // counting otherwise — never to a total of a text field.
                        numeric.length ? { field: numeric[0], fn: 'sum' } : { field: names[0] ?? '', fn: 'count' },
                    ])}
                >
                    <sl-icon slot="prefix" name="plus-lg"></sl-icon>
                    Add attribute
                </sl-button>
                ${param.hint ? html`<div class="hint">${param.hint}</div>` : nothing}
            </div>
        `;
    }

    private aggregationsFor(key: string): AggregationSpec[] {
        const value = this.params[key];
        return Array.isArray(value) ? value : [];
    }

    /**
     * The result of a table operation, with a copy button.
     *
     * Scrolls inside its own box: at 300px the panel cannot show a wide table,
     * and letting it push the panel wider would move the buttons off screen.
     */
    private renderTable(rows: Array<Record<string, unknown>>): TemplateResult {
        const columns = [...new Set(rows.flatMap(row => Object.keys(row)))];
        const format = (value: unknown) =>
            typeof value === 'number' ? Number(value.toFixed(3)).toLocaleString() : String(value ?? '');

        return html`
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>${columns.map(c => html`<th>${c}</th>`)}</tr>
                    </thead>
                    <tbody>
                        ${rows.map(row => html`
                            <tr>${columns.map(c => html`<td>${format(row[c])}</td>`)}</tr>
                        `)}
                    </tbody>
                </table>
            </div>
            <sl-button
                size="small"
                variant="text"
                @click=${() => this.copyTable(columns, rows)}
            >
                <sl-icon slot="prefix" name="clipboard"></sl-icon>
                Copy as text
            </sl-button>
        `;
    }

    /** Tab-separated, so it pastes straight into a spreadsheet. */
    private async copyTable(columns: string[], rows: Array<Record<string, unknown>>): Promise<void> {
        const lines = [
            columns.join('\t'),
            ...rows.map(row => columns.map(c => String(row[c] ?? '')).join('\t')),
        ];
        try {
            await navigator.clipboard.writeText(lines.join('\n'));
            this.notice = 'Table copied to the clipboard.';
        } catch {
            this.error = 'Could not copy — your browser blocked clipboard access.';
        }
    }

    private renderMessages(): TemplateResult | typeof nothing {
        if (this.error) {
            return html`
                <sl-alert variant="danger" open>
                    <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
                    ${this.error}
                </sl-alert>
            `;
        }
        if (this.notice) {
            return html`
                <sl-alert variant="warning" open>
                    <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
                    ${this.notice}
                </sl-alert>
            `;
        }
        return nothing;
    }

    /** A required `field` param with nothing chosen makes the SQL/compute meaningless, so Calculate stays off. */
    private hasMissingRequiredField(): boolean {
        const op = this.operation;
        if (!op) return false;
        return op.params.some(param =>
            param.kind === 'field'
            && !param.optional
            && !String(this.params[param.key] ?? '').trim());
    }

    private renderActions(): TemplateResult {
        const op = this.operation;
        return html`
            <div class="actions">
                ${this.busy ? html`
                    <div class="status">
                        <sl-spinner></sl-spinner>
                        <span>
                            Calculating${this.busyDetail ? html` ${this.busyDetail}` : nothing}…
                            ${this.elapsed > 2 ? html`${this.elapsed} s` : nothing}
                        </span>
                    </div>
                ` : nothing}
                ${this.busy
                    ? html`
                        <sl-button size="small" variant="danger" outline @click=${this.handleCancel}>
                            Cancel
                        </sl-button>`
                    : html`
                        <sl-button size="small" variant="text" @click=${() => this.deactivate()}>Close</sl-button>
                        <sl-button
                            size="small"
                            variant="primary"
                            ?disabled=${!op || !this.availableLayers.length || this.hasMissingRequiredField()}
                            @click=${this.handleRun}
                        >Calculate</sl-button>`}
            </div>`;
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.stopElapsedTimer();
    }
}
