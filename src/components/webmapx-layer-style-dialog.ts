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
import { LitElement, css, html, nothing, type TemplateResult } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import type SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
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
    buildNumericStyle,
    buildSingleStyle,
    ROLE_COLOR_KEY,
    ROLE_SIZE,
    type StyleRole,
} from '../utils/style-builder';
import { colorByAdjacency, coloringKeyFor } from '../utils/topological-coloring';
import { createColorPicker } from './internal/color-picker';
import type Pickr from '@simonwep/pickr';
import { DATA_START } from '../theme/data-colors';

export interface LayerStyleTarget {
    id: string;
    type: string;
    /** The sublayer's authored paint, so "reset" has something to go back to. */
    paint?: Record<string, unknown>;
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
}

/**
 * Applies a paint change to one sublayer of the layer being styled, and says
 * whether the engine took it. `false` means the sublayer is described in the
 * store but is not on the map — a style that silently does nothing is the worst
 * outcome, since the user blames their own choices.
 */
export type StyleApply = (subLayerId: string, paint: Record<string, unknown>) => boolean | void;

export interface StyleDialogContext {
    title: string;
    /** Only for the caller's own bookkeeping — the panel addresses sublayers. */
    layerId: string;
    groups: SourceStyleGroup[];
    apply?: StyleApply;
}

/** How a layer is coloured. The three answers to "colour by what?". */
type ColorMode = 'single' | 'attribute' | 'neighbours';

const METHOD_LABELS: Record<ClassificationMethod, string> = {
    naturalBreaks: 'Natural breaks',
    quantile: 'Equal count',
    equalInterval: 'Equal intervals',
    pretty: 'Rounded intervals',
    standardDeviation: 'Standard deviation',
    manual: 'Manual',
};

const METHOD_HINTS: Record<ClassificationMethod, string> = {
    naturalBreaks: 'Puts the boundaries where the data has gaps. A good first choice.',
    quantile: 'Every class holds the same number of features. Always a full-looking map.',
    equalInterval: 'Classes of equal width. Honest, but skewed data crowds into one class.',
    pretty: 'Equal intervals rounded to readable numbers.',
    standardDeviation: 'Distance from the average. For data spread evenly around a middle.',
    manual: 'Type the boundaries yourself.',
};

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
    @state() private maxCategories = DEFAULT_MAX_CATEGORIES;
    @state() private neighbourColors = MIN_NEIGHBOUR_COLORS;
    /**
     * Line width, circle radius or text size, depending on the role — null until
     * the panel has read the layer's own. Unlike colour and opacity this one is
     * *inherited*: a 1px border and a 6px one are different maps, and starting
     * every line at some default would silently rewrite the layer's design.
     */
    @state() private size: number | null = null;
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
    @state() private showTable = false;
    @state() private message: string | null = null;

    private applyStyle: StyleApply | null = null;
    /** Paint each sublayer had when the panel opened, for "reset". */
    private originalPaint = new Map<string, Record<string, unknown>>();
    /**
     * The Pickr and the button it is anchored to. Pickr positions its popup
     * against that element, so an instance kept across a re-render ends up
     * measuring a node that is no longer in the document — and a detached node
     * has no position, which is why the popup appeared in the top-left corner.
     */
    private picker: { instance: Pickr; button: HTMLElement } | null = null;

    @query('sl-dialog') private dialog!: SlDialog;

    static styles = [controlSurfaceStyles, css`
        :host { display: block; }

        sl-dialog::part(panel) {
            width: min(560px, 96vw);
            max-width: min(560px, 96vw);
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

        .hist { display: flex; align-items: flex-end; gap: 1px; height: 48px; }
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

        .footer { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.75rem; }
    `];

    open(context: StyleDialogContext): void {
        // Escape to document.body before showing — see webmapx-layer-info-dialog.ts's
        // open() for why: an ancestor's backdrop-filter otherwise traps this
        // position:fixed dialog inside the panel.
        if (this.parentNode !== document.body) {
            document.body.appendChild(this);
        }
        this.dialogTitle = context.title;
        this.groups = context.groups;
        this.applyStyle = context.apply ?? null;
        this.message = null;
        this.showTable = false;

        this.originalPaint = new Map();
        for (const group of context.groups) {
            for (const target of group.layers) {
                if (target.paint) this.originalPaint.set(target.id, { ...target.paint });
            }
        }

        // One styleable sublayer is not a decision worth asking about.
        const targets = this.allTargets();
        this.targetId = targets.length === 1 ? targets[0].id : null;
        this.opacity = 1;
        this.size = this.authoredSize(this.targetId);
        this.singleColor = this.authoredColor(this.targetId);
        this.mode = null;
        this.field = null;
        this.schemeName = null;
        // `this.dialog` is a @query into the shadow root, so it does not exist
        // until the first render — a panel created and opened in one go would
        // otherwise build its whole state and never appear.
        void this.updateComplete.then(() => this.dialog?.show());
    }

    close(): void {
        this.dialog?.hide();
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        // Pickr lives in document.body, so it outlives this element unless it is
        // told otherwise.
        this.picker?.instance.destroyAndRemove();
        this.picker = null;
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

    /** The width/radius/text size the target is drawn with today. */
    private authoredSize(targetId: string | null): number | null {
        const target = this.allTargets().find((candidate) => candidate.id === targetId);
        const role = ROLE_OF_TYPE[target?.type ?? 'fill'] ?? 'fill';
        const spec = ROLE_SIZE[role];
        if (!spec) return null;
        const value = target?.paint?.[spec.key];
        // An authored expression (width by zoom, say) is not a number this
        // control can represent; leaving it alone is better than flattening it.
        return typeof value === 'number' ? value : spec.min;
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
        return classifyNumeric(values, { method: this.method, classCount: this.classCount, missing });
    }

    private categoricalClassification(): CategoricalClassification | null {
        if (!this.field || this.isNumericField(this.field)) return null;
        return classifyCategorical(this.features(), this.field, { maxCategories: this.maxCategories });
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

    // ── Applying ─────────────────────────────────────────────────────────────

    private built(): { paint: Record<string, unknown>; legend: { color: string; label: string }[] } | null {
        const style = this.buildColors();
        if (!style) return null;
        const spec = ROLE_SIZE[this.currentRole()];
        return spec && this.size !== null
            ? { ...style, paint: { ...style.paint, [spec.key]: this.size } }
            : style;
    }

    private buildColors(): { paint: Record<string, unknown>; legend: { color: string; label: string }[] } | null {
        const role = this.currentRole();
        const scheme = this.currentScheme();

        if (this.mode === 'single') {
            return buildSingleStyle(role, this.singleColor, this.opacity);
        }
        if (this.mode === 'neighbours') {
            const coloring = this.coloring();
            const key = coloringKeyFor(this.features());
            if (!coloring || !key || !scheme) return null;
            const entries = this.features().flatMap((feature, index) => {
                const value = key.kind === 'id' ? feature.id : feature.properties?.[key.name];
                if (value === null || value === undefined) return [];
                return [{ key: String(value), colorIndex: coloring.colors[index] }];
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
                return buildCategoricalStyle({ role, field: this.field, classification: categorical, scheme, opacity: this.opacity });
            }
        }
        return null;
    }

    /** Rebuilds and pushes the style to the map. Called after every answer. */
    private applyNow(): void {
        if (!this.targetId || !this.applyStyle) return;
        try {
            const style = this.built();
            if (!style) return;
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
        this.size = this.authoredSize(this.targetId);
        this.singleColor = this.authoredColor(this.targetId);
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
            <sl-dialog label=${this.dialogTitle}
                       @sl-request-close=${(e: Event) => { if ((e as CustomEvent).detail?.source === 'overlay') this.close(); }}>
                ${targets.length === 0
                    ? html`<p class="muted">This layer has nothing that can be restyled here — it is a raster or an external style.</p>`
                    : html`
                        <div class="steps">
                            ${this.renderTargetStep(targets)}
                            ${this.targetId ? this.renderModeStep() : nothing}
                            ${this.renderModeDetail()}
                            ${this.renderSchemeStep()}
                            ${this.mode ? this.renderOpacity() : nothing}
                            ${this.mode ? this.renderSize() : nothing}
                            ${this.renderPreview()}
                            ${group && group.completeData === false ? html`
                                <div class="warning">
                                    Only the features the map has drawn are used, so the classes come from what is on
                                    screen. Zooming out can bring in values outside them. Move to a part of the map that
                                    represents the whole before classifying.
                                </div>` : nothing}
                            ${this.message ? html`<div class="warning">${this.message}</div>` : nothing}
                            ${this.renderData(group)}
                        </div>
                    `}
                <div class="footer">
                    <sl-button size="small" @click=${() => this.resetStyle()}>Reset</sl-button>
                    <sl-button size="small" variant="primary" @click=${() => this.close()}>Done</sl-button>
                </div>
            </sl-dialog>
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
        `;
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
        const key = coloringKeyFor(this.features());
        if (!key) {
            return html`<div class="warning">
                This layer has no id and no column whose values are unique, so its areas cannot be told apart well
                enough to colour them separately.
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
                                    <span class="attr-meta">
                                        ${attribute.type}
                                        · ${unique} different ${unique === 1 ? 'value' : 'values'}
                                        ${attribute.missingCount > 0 ? html`· ${attribute.missingCount} missing` : nothing}
                                        ${isKey ? html`· every value is different, so there is nothing to group — try "Neighbours differ"` : nothing}
                                    </span>
                                </button>
                            `;
                        })}
                    </div>
                </div>
            `;
        }

        return html`
            ${this.renderDone('Attribute', this.field, () => { this.field = null; })}
            ${this.isNumericField(this.field) ? this.renderMethodStep() : this.renderCategoryStep()}
        `;
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

    private renderMethodStep(): TemplateResult {
        const classification = this.numericClassification();
        return html`
            <div class="question">
                <h3>How should the numbers be divided?</h3>
                <div class="choices">
                    ${(Object.keys(METHOD_LABELS) as ClassificationMethod[])
                        .filter((method) => method !== 'manual')
                        .map((method) => html`
                            <button class="choice" type="button" aria-pressed=${String(method === this.method)}
                                    @click=${() => this.answer(() => { this.method = method; })}>
                                <span>${METHOD_LABELS[method]}</span>
                                <small>${METHOD_HINTS[method]}</small>
                            </button>
                        `)}
                </div>
                <div class="row">
                    <label for="class-count">Classes</label>
                    <input id="class-count" type="range" min="2" max=${maxClassesFor(this.schemeType())}
                           .value=${String(this.classCount)}
                           @input=${(e: Event) => this.answer(() => { this.classCount = Number((e.target as HTMLInputElement).value); })}>
                    <span>${classification?.classes.length ?? this.classCount}</span>
                </div>
                ${classification ? this.renderHistogram(classification) : nothing}
                ${classification && classification.classes.length < this.classCount
                    ? html`<div class="muted">
                        The data has only ${classification.classes.length} distinct
                        ${classification.classes.length === 1 ? 'value' : 'groups of values'}, so there are no more classes to make.
                      </div>`
                    : nothing}
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
                    ? html`<div class="muted">
                        ${classification.otherValues} more values share one colour, covering
                        ${classification.otherCount} features.
                      </div>`
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

        const schemes = this.schemes();
        const selected = this.currentScheme();
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
                                        @click=${() => this.answer(() => { this.schemeName = scheme.name; })}>
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
        if (!spec || this.size === null) return nothing;
        return html`
            <div class="question">
                <h3>${spec.label}</h3>
                <div class="row">
                    <input type="range" min=${spec.min} max=${spec.max} step=${spec.step}
                           .value=${String(this.size)}
                           @input=${(e: Event) => this.answer(() => { this.size = Number((e.target as HTMLInputElement).value); })}>
                    <span>${this.size}${spec.unit}</span>
                </div>
            </div>
        `;
    }

    /** The colours this style will actually paint with, in order. */
    private appliedColors(): string[] {
        if (this.mode === 'single') return [this.singleColor];
        const scheme = this.currentScheme();
        if (!scheme) return [];
        if (this.mode === 'neighbours') return [...scheme.colors];
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
