import { css, html, svg, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';
import Pickr from '@simonwep/pickr';
import '@simonwep/pickr/dist/themes/nano.min.css';

@customElement('webmapx-layer-legend')
export class WebmapxLayerLegend extends WebmapxBaseTool {
    @property({ type: String, attribute: 'layer-id' })
    layerId = '';

    @property({ type: Boolean, reflect: true })
    collapsible = true;

    @state() private meta: Record<string, unknown> | null = null;
    @state() private zoom: number = 2;
    @state() private legendCollapsed = true;
    @state() private legendOverflowing = false;

    /** Local paint overrides from the inline style editor, layered over paint for live preview.
     *  Keyed by sub-layer id (empty string for non-composite layers). */
    @state() private editOverrides: Record<string, Record<string, unknown>> = {};

    /** Sub-layer id (empty string for non-composite) whose inline style editor is open, or null. */
    @state() private editorOpenKey: string | null = null;
    @state() private terrainEnabled = false;
    private legendResizeObserver: ResizeObserver | null = null;
    private measureLegendQueued = false;

    private static readonly collapsedLegendHeight = 180;

    static styles = css`
        :host { display: block; }
        .legend-wrap { display: flex; flex-direction: column; gap: 2px; }
        .legend-collapse {
            position: relative;
        }
        .legend-collapse-content {
            overflow: visible;
        }
        .legend-collapse.collapsed .legend-collapse-content {
            max-height: ${WebmapxLayerLegend.collapsedLegendHeight}px;
            overflow: hidden;
        }
        .legend-collapse.collapsed::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            bottom: 26px;
            height: 42px;
            pointer-events: none;
            background: linear-gradient(
                to bottom,
                rgba(255, 255, 255, 0),
                var(--webmapx-legend-bg, var(--color-background, #ffffff))
            );
        }
        .legend-toggle {
            display: inline-flex;
            align-items: center;
            align-self: flex-start;
            margin-top: 4px;
            padding: 0;
            border: 0;
            background: none;
            color: var(--webmapx-legend-title-color, var(--color-primary, #0f62fe));
            font: inherit;
            font-size: 0.75rem;
            line-height: 1.2;
            cursor: pointer;
        }
        .legend-toggle:hover {
            text-decoration: underline;
        }
        .legend-row { display: flex; align-items: center; gap: 6px; min-height: 18px; }
        .legend-label { font-size: 0.75rem; color: var(--color-text-primary, #1f2937); line-height: 1.2; }
        .legend-img { max-width: 100%; width: auto; height: auto; display: block; border-radius: 3px; align-self: flex-start; }
        .img-error { font-size: 0.75rem; color: var(--sl-color-danger-600, #c0392b); font-style: italic; }
        .sub-group-title { font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary, #555); margin-top: 4px; }
        .sub-row { padding-left: 8px; }
        .editable { cursor: pointer; }
        .editable:hover { background: var(--sl-color-neutral-100, #f4f4f4); }
        .style-editor {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 6px 4px 8px 8px;
            font-size: 0.75rem;
            color: var(--color-text-primary, #1f2937);
        }
        .style-editor-row { display: flex; align-items: center; gap: 6px; }
        .style-editor-row label { flex: 0 0 5.5rem; }
        .style-editor-row input[type='range'] { flex: 1 1 auto; min-width: 0; }
        .style-editor-row output { flex: 0 0 2.5rem; text-align: right; color: var(--color-text-secondary, #555); }
        .color-swatch {
            width: 20px;
            height: 12px;
            padding: 0;
            border: 1px solid var(--sl-color-neutral-300, #ccc);
            border-radius: 3px;
            cursor: pointer;
            background-image:
                linear-gradient(45deg, #bbb 25%, transparent 25%, transparent 75%, #bbb 75%),
                linear-gradient(45deg, #bbb 25%, transparent 25%, transparent 75%, #bbb 75%);
            background-size: 6px 6px;
            background-position: 0 0, 3px 3px;
        }
    `;

    connectedCallback(): void {
        super.connectedCallback();
        this.legendResizeObserver = new ResizeObserver(() => this.queueLegendMeasure());
    }

    protected firstUpdated(): void {
        this.observeLegendContent();
        this.queueLegendMeasure();
    }

    protected onStateChanged(state: IMapState): void {
        const entry = (state.mapLayers ?? {})[this.layerId] as Record<string, unknown> | undefined;
        this.meta = entry ?? null;
        if (typeof state.zoomLevel === 'number') this.zoom = state.zoomLevel;
        this.terrainEnabled = this.adapter?.isTerrainEnabled() === true;
    }

    private observeLegendContent(): void {
        if (!this.legendResizeObserver) return;
        this.legendResizeObserver.disconnect();
        const content = this.renderRoot?.querySelector('.legend-collapse-content');
        if (content) {
            this.legendResizeObserver.observe(content);
        }
    }

    private queueLegendMeasure(): void {
        if (this.measureLegendQueued) return;
        this.measureLegendQueued = true;
        requestAnimationFrame(() => {
            this.measureLegendQueued = false;
            this.measureLegendOverflow();
        });
    }

    private measureLegendOverflow(): void {
        if (!this.collapsible) {
            if (this.legendOverflowing) this.legendOverflowing = false;
            return;
        }
        const content = this.renderRoot?.querySelector('.legend-collapse-content') as HTMLElement | null;
        const overflowing = Boolean(content && content.scrollHeight > WebmapxLayerLegend.collapsedLegendHeight + 1);
        if (this.legendOverflowing !== overflowing) {
            this.legendOverflowing = overflowing;
        }
    }

    private renderCollapsibleLegend(content: TemplateResult): TemplateResult {
        const collapsed = this.collapsible && this.legendOverflowing && this.legendCollapsed;
        const showToggle = this.collapsible && this.legendOverflowing;
        return html`
            <div class="legend-collapse ${collapsed ? 'collapsed' : ''}">
                <div class="legend-collapse-content">
                    ${content}
                </div>
                ${showToggle ? html`
                    <button
                        type="button"
                        class="legend-toggle"
                        @click=${() => { this.legendCollapsed = !this.legendCollapsed; }}>
                        ${this.legendCollapsed ? 'show more...' : 'show less'}
                    </button>
                ` : ''}
            </div>
        `;
    }

    // ─── Expression evaluator ─────────────────────────────────────────────────

    /** Resolve a MapLibre paint expression to a concrete value at the given zoom. */
    private evalAtZoom(expr: unknown, zoom: number): unknown {
        if (!Array.isArray(expr)) return expr;
        const op = expr[0];
        if (op === 'interpolate' && expr.length >= 4) {
            const stops: Array<[number, unknown]> = [];
            for (let i = 3; i + 1 < expr.length; i += 2)
                stops.push([Number(expr[i]), expr[i + 1]]);
            if (stops.length === 0) return null;
            if (zoom <= stops[0][0]) return stops[0][1];
            if (zoom >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
            for (let i = 0; i < stops.length - 1; i++) {
                const [z0, v0] = stops[i], [z1, v1] = stops[i + 1];
                if (zoom >= z0 && zoom <= z1) {
                    if (typeof v0 === 'number' && typeof v1 === 'number') {
                        const t = (zoom - z0) / (z1 - z0);
                        return v0 + (v1 - v0) * t;
                    }
                    return zoom - z0 < z1 - zoom ? v0 : v1;
                }
            }
        }
        if (op === 'step' && expr.length >= 3) {
            let result = expr[2]; // default
            for (let i = 3; i + 1 < expr.length; i += 2)
                if (zoom >= Number(expr[i])) result = expr[i + 1];
            return result;
        }
        if (op === 'literal') return expr[1];
        return expr; // non-zoom expression, return as-is
    }

    /** Evaluate a layer filter expression at the given zoom. Returns true if the layer should be shown. */
    private evalFilter(filter: unknown, zoom: number): boolean {
        if (!Array.isArray(filter) || filter.length === 0) return true;
        const op = filter[0];

        if (op === 'all') return (filter.slice(1) as unknown[]).every(f => this.evalFilter(f, zoom));
        if (op === 'any') return (filter.slice(1) as unknown[]).some(f => this.evalFilter(f, zoom));
        if (op === 'none') return !(filter.slice(1) as unknown[]).some(f => this.evalFilter(f, zoom));

        // Zoom-based comparisons: ["<=", ["zoom"], value] etc.
        const lhs = filter[1], rhs = filter[2];
        const lhsIsZoom = Array.isArray(lhs) && lhs[0] === 'zoom';
        const rhsIsZoom = Array.isArray(rhs) && rhs[0] === 'zoom';

        if (lhsIsZoom || rhsIsZoom) {
            const zoomVal = zoom;
            const other = Number(lhsIsZoom ? rhs : lhs);
            const left = lhsIsZoom ? zoomVal : other;
            const right = lhsIsZoom ? other : zoomVal;
            if (op === '==' || op === '===') return left === right;
            if (op === '!=' || op === '!==') return left !== right;
            if (op === '<')  return left < right;
            if (op === '<=') return left <= right;
            if (op === '>')  return left > right;
            if (op === '>=') return left >= right;
        }

        // Non-zoom conditions (feature property filters) — assume true for legend purposes
        return true;
    }

    /** Returns match cases if expr is data-driven match/step, otherwise null. */
    private extractDataCases(expr: unknown, attrTr?: Map<string, {label: string; unit: string; valuemap?: Array<{value: unknown; label: string; operator?: string}>}>): Array<{label: string, paint: unknown}> | null {
        if (!Array.isArray(expr)) return null;
        const op = expr[0];
        if (op === 'match' && expr.length >= 5) {
            const matchProp = this.getPropName(expr[1]);
            const attrEntry = matchProp ? attrTr?.get(matchProp) : undefined;
            const unit = attrEntry?.unit ?? '';
            const valuemap = attrEntry?.valuemap;
            const cases: Array<{label: string, paint: unknown}> = [];
            for (let i = 2; i + 1 < expr.length - 1; i += 2) {
                const rawKey = expr[i];
                const rawStr = Array.isArray(rawKey) ? rawKey.join(', ') : String(rawKey);
                const mapped = valuemap?.find(m => String(m.value) === String(rawKey));
                const label = mapped ? mapped.label : (unit ? `${rawStr}${unit}` : rawStr);
                cases.push({ label, paint: expr[i + 1] });
            }
            cases.push({ label: '', paint: expr[expr.length - 1] });
            return cases.length > 1 ? cases : null;
        }
        if (op === 'step' && expr.length >= 5) {
            // Check if input is a property (not zoom)
            const input = expr[1];
            if (!Array.isArray(input) || input[0] === 'zoom') return null;
            const cases: Array<{label: string, paint: unknown}> = [{ label: `< ${expr[3]}`, paint: expr[2] }];
            for (let i = 3; i + 1 < expr.length; i += 2)
                cases.push({ label: `≥ ${expr[i]}`, paint: expr[i + 1] });
            return cases;
        }
        if (op === 'case' && expr.length >= 3) {
            const cases: Array<{label: string, paint: unknown}> = [];
            for (let i = 1; i + 1 < expr.length; i += 2) {
                const label = this.conditionLabel(expr[i]) ?? `class ${Math.floor(i / 2) + 1}`;
                cases.push({ label, paint: expr[i + 1] });
            }
            cases.push({ label: '', paint: expr[expr.length - 1] });
            return cases.length > 1 ? cases : null;
        }
        return null;
    }

    private isDataDriven(expr: unknown): boolean {
        if (!Array.isArray(expr)) return false;
        const op = expr[0];
        if (op === 'match' || op === 'case') return true;
        if (op === 'step') return !(Array.isArray(expr[1]) && expr[1][0] === 'zoom');
        if (op === 'interpolate') return Array.isArray(expr[2]) && expr[2][0] !== 'zoom';
        return false;
    }

    // ─── Composite style legend ───────────────────────────────────────────────

    /** Renders a zoom direction hint when the layer is out of its zoom range. */
    private renderZoomHint(minz: number, maxz: number, zoom: number): TemplateResult {
        const tooFarIn = zoom > maxz;
        const target = tooFarIn ? maxz : minz;
        const direction = tooFarIn ? 'zoom out' : 'zoom in';
        return html`<div class="legend-row"><span class="legend-label">${direction} to level ${target} for display</span></div>`;
    }

    private renderCompositeLegend(sublayers: unknown[], zoom: number): TemplateResult {
        const rows: TemplateResult[] = [];
        const seen = new Set<string>(); // deduplicate by visual key
        const dedupGroups = new Map<string, string[]>(); // visual key -> all sublayer ids sharing it
        const singleSublayer = sublayers.length === 1;
        const attrTr = this.getAttrTranslations();

        // Combined zoom range across all visible-eligible sublayers (256px-tile +1 offset, as below)
        let overallMin = Infinity;
        let overallMax = -Infinity;
        for (const raw of sublayers) {
            const sub = raw as Record<string, unknown>;
            if (!sub || typeof sub.type !== 'string' || sub.hideFromLegend === true) continue;
            const layout = sub.layout as Record<string, unknown> | undefined;
            if (layout?.['visibility'] === 'none') continue;
            const minz = typeof sub.minzoom === 'number' ? sub.minzoom : 0;
            const maxz = (typeof sub.maxzoom === 'number' ? sub.maxzoom : 24) + 1;
            overallMin = Math.min(overallMin, minz);
            overallMax = Math.max(overallMax, maxz);
        }
        if (overallMin !== Infinity && (zoom < overallMin || zoom >= overallMax)) {
            return this.renderZoomHint(overallMin, overallMax - 1, zoom);
        }

        // Reverse so top-rendered layers (labels/symbols) appear first in the legend,
        // matching user expectation: what's visually on top is at the top of the list.
        for (const raw of [...sublayers].reverse()) {
            const sub = raw as Record<string, unknown>;
            if (!sub || typeof sub.type !== 'string') continue;
            if (sub.hideFromLegend === true) continue;

            // Zoom visibility
            const minz = typeof sub.minzoom === 'number' ? sub.minzoom : 0;
            const maxz = typeof sub.maxzoom === 'number' ? sub.maxzoom : 24;
            // MapLibre uses 512px tiles; styles authored for 256px tiles have a +1 zoom offset
            if (zoom < minz || zoom >= maxz + 1) continue;
            // Evaluate zoom-based filter expressions (e.g. ["<=", ["zoom"], 8.66])
            if (sub.filter && !this.evalFilter(sub.filter, zoom)) continue;

            // Layout visibility
            const layout = sub.layout as Record<string, unknown> | undefined;
            if (layout?.['visibility'] === 'none') continue;

            const type = sub.type as string;
            const paint = (sub.paint && typeof sub.paint === 'object') ? sub.paint as Record<string, unknown> : {};
            const layoutRaw = (sub.layout && typeof sub.layout === 'object') ? sub.layout as Record<string, unknown> : {};
            const rawId = String(sub.id ?? '');
            const subMetadata = (sub.metadata && typeof sub.metadata === 'object') ? sub.metadata as Record<string, unknown> : undefined;
            const label = singleSublayer
                ? (typeof this.meta?.label === 'string' ? this.meta.label : '')
                : typeof subMetadata?.label === 'string' && subMetadata.label.length > 0
                    ? subMetadata.label
                    : rawId.replace(/^style:/, '').replace(/-/g, ' ');

            // Evaluate zoom-dependent paint and layout values
            const evalPaint: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(paint)) {
                evalPaint[k] = this.isDataDriven(v) ? v : this.evalAtZoom(v, zoom);
            }
            const evalLayout: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(layoutRaw)) {
                evalLayout[k] = this.evalAtZoom(v, zoom);
            }

            // Snapshot pre-override values for dedup-key computation, so an in-progress
            // edit (e.g. dragging a size slider) can't change which legend item this
            // sublayer groups under and re-close/move the open editor mid-drag.
            const basePaint = { ...evalPaint };
            const baseLayout = { ...evalLayout };

            const overrides = this.editOverrides[rawId];
            if (overrides) {
                Object.assign(evalPaint, overrides);
                if ('text-size' in overrides) evalLayout['text-size'] = overrides['text-size'];
            }

            // Find primary color key for this layer type
            const colorKey = type === 'fill' ? 'fill-color'
                : type === 'fill-extrusion' ? 'fill-extrusion-color'
                : type === 'line' ? 'line-color'
                : type === 'circle' ? 'circle-color'
                : type === 'symbol' ? 'text-color'
                : null;

            const rawColorExpr = colorKey ? (evalPaint[colorKey] ?? paint[colorKey]) : null;
            const dataCases = rawColorExpr ? this.extractDataCases(rawColorExpr, attrTr) : null;

            if (dataCases && dataCases.length > 1) {
                // Multi-class legend: title row + case rows
                const dedupKey = `${type}|${rawId}`;
                if (seen.has(dedupKey)) continue;
                seen.add(dedupKey);
                if (!dedupGroups.has(dedupKey)) dedupGroups.set(dedupKey, [rawId]);

                if (!singleSublayer) rows.push(html`<div class="sub-group-title">${label}</div>`);
                const colorExpr = Array.isArray(rawColorExpr) ? rawColorExpr : null;
                const stopIndices = colorExpr ? this.colorExprStopIndices(colorExpr) : null;
                for (let ci = 0; ci < dataCases.length; ci++) {
                    const { label: caseLabel, paint: casePaint } = dataCases[ci];
                    if (caseLabel === '') continue;
                    const casePaintObj = { ...evalPaint, [colorKey!]: casePaint };
                    const swatch = this.renderSwatch(type, casePaintObj, zoom, evalLayout);
                    if (!swatch) continue;
                    const caseKey = `${type}|${String(casePaint)}`;
                    if (seen.has(caseKey)) continue;
                    seen.add(caseKey);
                    const stopIdx = stopIndices?.[ci] ?? null;
                    const caseColor = typeof casePaint === 'string' ? casePaint : '#000';
                    const clickableSwatch = stopIdx !== null && colorExpr
                        ? html`<button type="button" style="background:none;border:none;padding:0;cursor:pointer;display:flex;align-items:center"
                            @click=${(e: Event) => { e.stopPropagation(); this.openStopColorPicker(e.currentTarget as HTMLElement, [rawId], colorKey!, colorExpr, stopIdx, caseColor); }}>
                            ${swatch}</button>`
                        : swatch;
                    rows.push(html`
                        <div class="legend-row sub-row">
                            ${clickableSwatch}
                            <span class="legend-label">${caseLabel}</span>
                        </div>`);
                }
            } else if (type === 'circle') {
                // Circle layers may have proportional/data-driven radius — delegate to
                // renderLegendItems which handles bubble legends.
                const dedupKey = `${type}|${rawId}`;
                if (!seen.has(dedupKey)) {
                    seen.add(dedupKey);
                    if (!dedupGroups.has(dedupKey)) dedupGroups.set(dedupKey, [rawId]);
                    if (!singleSublayer) rows.push(html`<div class="sub-group-title">${label}</div>`);
                    rows.push(...this.renderLegendItems([rawId], type, evalPaint));
                }
            } else {
                // Single style: swatch + label inline
                const resolvedColor = colorKey ? String(basePaint[colorKey] ?? '#aaa') : '#aaa';
                // For symbols also include size + weight in dedup key — country/state/town labels
                // differ visually even when same color
                let dedupKey = `${type}|${resolvedColor}`;
                if (type === 'line') {
                    // Lines with same color but different dasharray (e.g. equator vs.
                    // tropics vs. polar circles) look visually distinct — keep separate
                    const dash = basePaint['line-dasharray'];
                    dedupKey = `line|${resolvedColor}|${Array.isArray(dash) ? dash.join(',') : String(dash ?? '')}`;
                } else if (type === 'symbol') {
                    const rawSize = baseLayout['text-size'] ?? basePaint['text-size'];
                    const sz = Math.round(Number(typeof rawSize === 'number' ? rawSize : 12));
                    const fonts = Array.isArray(baseLayout['text-font']) ? (baseLayout['text-font'] as string[]) : [];
                    const fontStr = fonts.join(' ').toLowerCase();
                    const weight = fontStr.includes('bold') || fontStr.includes('black') ? '700'
                        : fontStr.includes('semibold') || fontStr.includes('demibold') || fontStr.includes('medium') ? '600'
                        : '400';
                    const haloW = Math.round(Number(basePaint['text-halo-width'] ?? 0) * 2) / 2;
                    const haloC = haloW > 0 ? String(basePaint['text-halo-color'] ?? '') : '';
                    dedupKey = `symbol|${resolvedColor}|${sz}|${weight}|${haloW}|${haloC}`;
                }
                // Collect every sublayer id that shares this dedup key — editing the
                // legend item for one should update all visually-identical duplicates.
                if (!dedupGroups.has(dedupKey)) dedupGroups.set(dedupKey, []);
                dedupGroups.get(dedupKey)!.push(rawId);

                if (seen.has(dedupKey)) continue;
                seen.add(dedupKey);
                const swatch = this.renderSwatch(type, evalPaint, zoom, evalLayout);
                if (!swatch) continue;
                const editable = this.isEditableType(type, evalPaint, true);
                // Track open editor by sublayer ID (not dedupKey) so changing a paint
                // value (e.g. text-size) doesn't mutate the dedupKey and close the editor.
                const groupIds = dedupGroups.get(dedupKey)!;
                const isOpen = groupIds.includes(this.editorOpenKey ?? '');
                rows.push(html`
                    <div class="legend-row ${editable ? 'editable' : ''}"
                        @click=${editable ? () => { this.editorOpenKey = isOpen ? null : groupIds[0]; } : null}>
                        ${swatch}
                        <span class="legend-label">${label}</span>
                    </div>`);
                if (editable && isOpen) {
                    const editorPaint = type === 'symbol' ? { ...evalPaint, 'text-size': evalLayout['text-size'] ?? evalPaint['text-size'] } : evalPaint;
                    rows.push(this.renderStyleEditor(groupIds, type, editorPaint));
                }
            }
        }

        return html`<div class="legend-wrap">${rows}</div>`;
    }

    /** Render a small SVG swatch for any layer type. */
    /** Resolves a swatch color: falls back when the value is still an unresolved
     *  expression (e.g. ['get', 'color']) rather than a literal CSS color string —
     *  passing the raw expression to SVG attrs renders as invisible/black. */
    private resolveSwatchColor(value: unknown, fallback: string): string {
        return typeof value === 'string' ? value : fallback;
    }

    private renderSwatch(type: string, paint: Record<string, unknown>, _zoom: number, layout?: Record<string, unknown>): TemplateResult | null {
        if (type === 'fill') {
            const c = this.resolveSwatchColor(paint['fill-color'], '#000000');
            const op = Number(paint['fill-opacity'] ?? 0.7);
            const outline = String(paint['fill-outline-color'] ?? c);
            return svg`<svg width="20" height="12" style="flex-shrink:0">
                <rect x="1" y="1" width="18" height="10" fill="${c}" fill-opacity="${op}"
                    stroke="${outline}" stroke-width="1" rx="1"/>
            </svg>`;
        }
        if (type === 'fill-extrusion') {
            const c = String(paint['fill-extrusion-color'] ?? '#aaa');
            const op = Number(paint['fill-extrusion-opacity'] ?? 0.8);
            // Show as a simple fill rect with a slightly darker outline to hint at 3D
            return svg`<svg width="20" height="12" style="flex-shrink:0">
                <rect x="1" y="1" width="18" height="10" fill="${c}" fill-opacity="${op}" stroke="none"/>
                <line x1="19" y1="1" x2="19" y2="11" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>
                <line x1="1" y1="11" x2="19" y2="11" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>
            </svg>`;
        }
        if (type === 'line') {
            const c = this.resolveSwatchColor(paint['line-color'], '#616161');
            const w = Math.min(Number(paint['line-width'] ?? 2), 4);
            const dash = Array.isArray(paint['line-dasharray'])
                ? (paint['line-dasharray'] as number[]).join(' ') : '';
            return svg`<svg width="20" height="12" style="flex-shrink:0">
                <line x1="1" y1="6" x2="19" y2="6" stroke="${c}" stroke-width="${w}"
                    stroke-dasharray="${dash}" stroke-linecap="round"/>
            </svg>`;
        }
        if (type === 'circle') {
            const c = String(paint['circle-color'] ?? '#aaa');
            const r = Math.min(Number(paint['circle-radius'] ?? 4), 5);
            const sc = String(paint['circle-stroke-color'] ?? c);
            const sw = Number(paint['circle-stroke-width'] ?? 0);
            return svg`<svg width="20" height="12" style="flex-shrink:0">
                <circle cx="10" cy="6" r="${r}" fill="${c}" stroke="${sc}" stroke-width="${sw}"/>
            </svg>`;
        }
        if (type === 'symbol') {
            const c = String(paint['text-color'] ?? '#555');
            const haloC = paint['text-halo-width'] && Number(paint['text-halo-width']) > 0
                ? String(paint['text-halo-color'] ?? 'rgba(255,255,255,0.8)') : null;
            // text-size can be in paint (zoom-dependent already evaluated) or layout
            // text-size lives in layout (evaluated) or occasionally paint
            const rawSize = layout?.['text-size'] ?? paint['text-size'];
            const textSize = typeof rawSize === 'number' ? rawSize : 12;
            const fontSize = Math.min(Math.max(Math.round(textSize * 0.9), 7), 24);
            // Derive weight/style from font name keywords
            const fonts = Array.isArray(layout?.['text-font']) ? layout!['text-font'] as string[] : [];
            const fontStr = fonts.join(' ').toLowerCase();
            const fontWeight = fontStr.includes('bold') || fontStr.includes('black') ? '700'
                : fontStr.includes('semibold') || fontStr.includes('demibold') || fontStr.includes('medium') ? '600'
                : '400';
            const italic = fontStr.includes('italic') || fontStr.includes('oblique') ? 'italic' : 'normal';
            const svgW = Math.max(20, fontSize + 4);
            const svgH = fontSize + 4;
            return svg`<svg width="${svgW}" height="${svgH}" style="flex-shrink:0">
                ${haloC ? svg`<text x="${svgW/2}" y="${fontSize}" text-anchor="middle"
                    font-size="${fontSize}" font-weight="${fontWeight}" font-style="${italic}"
                    stroke="${haloC}" stroke-width="3" stroke-linejoin="round"
                    fill="none" font-family="sans-serif">A</text>` : ''}
                <text x="${svgW/2}" y="${fontSize}" text-anchor="middle"
                    font-size="${fontSize}" font-weight="${fontWeight}" font-style="${italic}"
                    fill="${c}" font-family="sans-serif">A</text>
            </svg>`;
        }
        if (type === 'background') {
            const c = String(paint['background-color'] ?? '#eee');
            return svg`<svg width="20" height="12" style="flex-shrink:0">
                <rect x="1" y="1" width="18" height="10" fill="${c}" rx="1"/>
            </svg>`;
        }
        if (type === 'raster' || type === 'hillshade') {
            return svg`<svg width="20" height="12" style="flex-shrink:0">
                <defs><pattern id="rp" width="4" height="4" patternUnits="userSpaceOnUse">
                    <rect width="2" height="2" fill="#ccc"/>
                    <rect x="2" y="2" width="2" height="2" fill="#eee"/>
                </pattern></defs>
                <rect x="1" y="1" width="18" height="10" fill="url(#rp)" rx="1"/>
            </svg>`;
        }
        return null;
    }

    private extractLegendStops(expression: unknown): Array<{ value: unknown; paint: unknown }> {
        if (typeof expression === 'string' || typeof expression === 'number') {
            return [{ value: null, paint: expression }];
        }
        if (!Array.isArray(expression)) {
            return [{ value: null, paint: null }];
        }
        const op = expression[0];
        if (op === 'interpolate') {
            const stops: Array<{ value: unknown; paint: unknown }> = [];
            for (let i = 3; i + 1 < expression.length; i += 2) {
                stops.push({ value: expression[i], paint: expression[i + 1] });
            }
            return stops.length ? stops : [{ value: null, paint: null }];
        }
        if (op === 'step') {
            const stops: Array<{ value: unknown; paint: unknown }> = [{ value: null, paint: expression[2] }];
            for (let i = 3; i + 1 < expression.length; i += 2) {
                stops.push({ value: expression[i], paint: expression[i + 1] });
            }
            return stops;
        }
        if (op === 'match') {
            const stops: Array<{ value: unknown; paint: unknown }> = [];
            for (let i = 2; i + 1 < expression.length - 1; i += 2) {
                stops.push({ value: expression[i], paint: expression[i + 1] });
            }
            return stops.length ? stops : [{ value: null, paint: null }];
        }
        return [{ value: null, paint: null }];
    }

    private renderBubbleLegend(
        stops: Array<{value: string, color: string, radius: number}>,
        strokeColor: string,
        strokeWidth: number
    ): TemplateResult {
        const sw = Math.min(strokeWidth, 1.5);
        const maxR = Math.max(...stops.map(s => s.radius));
        const scale = 1; // stops already carry correct pixel radii
        const cx = maxR + sw + 2;
        const bubbleW = cx * 2;
        const svgH = maxR * 2 + sw * 2 + 4;
        const baseline = svgH - 2;
        const labelX = bubbleW + 8;
        const svgW = bubbleW + 60;

        // Draw largest first so smaller circles appear on top
        const sorted = [...stops].sort((a, b) => b.radius - a.radius);
        const circles = sorted.map(s => {
            const r = Math.max(1, s.radius * scale);
            const cy = baseline - r - sw;
            const tickY = cy - r; // top of circle
            return svg`
                <circle cx="${cx}" cy="${cy}" r="${r}"
                    fill="${s.color}" fill-opacity="0.75"
                    stroke="${strokeColor}" stroke-width="${sw}"/>
                <line x1="${cx + r + sw}" y1="${tickY}" x2="${labelX - 2}" y2="${tickY}"
                    stroke="#999" stroke-width="0.5" stroke-dasharray="2 2"/>
                <text x="${labelX}" y="${tickY + 4}" font-size="9" fill="#555">${s.value}</text>
            `;
        });

        // Color gradient swatches
        const swatchW = Math.max(14, Math.floor((bubbleW + 60) / stops.length));
        const swatchH = 8;
        const totalSwatchW = stops.length * swatchW;
        const swatches = stops.map((s, i) =>
            svg`<rect x="${i * swatchW}" y="0" width="${swatchW}" height="${swatchH}" fill="${s.color}"/>
                <text x="${i * swatchW + swatchW / 2}" y="${swatchH + 9}" font-size="8"
                    text-anchor="middle" fill="#555">${s.value}</text>`
        );

        const allSameColor = stops.every(s => s.color === stops[0].color);

        return html`
            <div class="legend-row" style="flex-direction:column;align-items:flex-start;gap:6px">
                ${svg`<svg width="${svgW}" height="${svgH}" style="overflow:visible">
                    <line x1="${cx}" y1="${baseline}" x2="${cx}" y2="2" stroke="#bbb" stroke-width="1"/>
                    ${circles}
                </svg>`}
                ${allSameColor ? '' : svg`<svg width="${totalSwatchW}" height="${swatchH + 12}" style="overflow:visible">
                    ${swatches}
                </svg>`}
            </div>`;
    }

    private renderCircleRow(color: string, strokeColor: string, strokeWidth: number, radiusPx: number, label: string): TemplateResult {
        const r = Math.min(Math.max(radiusPx, 2), 12);
        const sw = Math.min(strokeWidth, 2);
        const size = (r + sw) * 2 + 2;
        return html`
            <div class="legend-row">
                ${svg`<svg width="${size}" height="${size}" style="flex-shrink:0">
                    <circle cx="${size / 2}" cy="${size / 2}" r="${r}"
                        fill="${color}" stroke="${strokeColor}" stroke-width="${sw}"/>
                </svg>`}
                ${label !== null ? html`<span class="legend-label">${label}</span>` : ''}
            </div>`;
    }

    private renderFillRow(fillColor: string, outlineColor: string, fillOpacity: number, label: string, onClick?: (e: Event) => void): TemplateResult {
        const swatchSvg = svg`<svg width="24" height="14" style="flex-shrink:0">
            <rect x="1" y="1" width="22" height="12"
                fill="${fillColor}" fill-opacity="${fillOpacity}"
                stroke="${outlineColor}" stroke-width="1.5" rx="2"/>
        </svg>`;
        return html`
            <div class="legend-row">
                ${onClick ? html`<button type="button" style="background:none;border:none;padding:0;cursor:pointer;display:flex;align-items:center" @click=${onClick}>${swatchSvg}</button>` : swatchSvg}
                ${label !== null ? html`<span class="legend-label">${label}</span>` : ''}
            </div>`;
    }

    /**
     * For a `match`/`case`/`step` color expression, returns the array index of each
     * stop's color value, in the same order as `extractLegendStops` returns stops
     * (excluding the trailing fallback/default). Returns `null` for unsupported ops.
     */
    private colorExprStopIndices(expr: unknown[]): number[] | null {
        const op = expr[0];
        if (op === 'match') {
            const idx: number[] = [];
            for (let i = 3; i < expr.length - 1; i += 2) idx.push(i);
            return idx;
        }
        if (op === 'case') {
            const idx: number[] = [];
            for (let i = 1; i + 1 < expr.length; i += 2) idx.push(i + 1);
            return idx;
        }
        if (op === 'step') {
            const idx: number[] = [2];
            for (let i = 3; i + 1 < expr.length; i += 2) idx.push(i + 1);
            return idx;
        }
        return null;
    }

    /** Opens a color picker that patches a single stop (`expr[colorIndex]`) of a match/case/step expression. */
    private openStopColorPicker(button: HTMLElement, subLayerIds: string[], colorKey: string, expr: unknown[], colorIndex: number, currentColor: string): void {
        const id = `${subLayerIds.join(',')}::${colorKey}::${colorIndex}`;
        this.openColorPicker(button, subLayerIds, id, currentColor, (rgba) => {
            const newExpr = [...expr];
            newExpr[colorIndex] = rgba;
            this.setPaintOverride(subLayerIds, colorKey, newExpr);
        }, false);
    }

    private renderLineRow(lineColor: string, lineWidth: number, dasharray: string, label: string): TemplateResult {
        const w = Math.min(lineWidth, 4);
        return html`
            <div class="legend-row">
                ${svg`<svg width="24" height="14" style="flex-shrink:0">
                    <line x1="2" y1="7" x2="22" y2="7"
                        stroke="${lineColor}" stroke-width="${w}"
                        stroke-dasharray="${dasharray}" stroke-linecap="round"/>
                </svg>`}
                ${label !== null ? html`<span class="legend-label">${label}</span>` : ''}
            </div>`;
    }

    /** Like `renderLineRow`, but the swatch is a clickable color-picker button patching one stop of `colorExpr`. */
    private renderEditableLineRow(subLayerIds: string[], lineColor: string, lineWidth: number, dasharray: string, label: string, colorExpr: unknown[], colorIndex: number): TemplateResult {
        const w = Math.min(lineWidth, 4);
        return html`
            <div class="legend-row">
                <button type="button" class="color-swatch" style="background:transparent; border:none; padding:0; width:24px; height:14px; flex-shrink:0; cursor:pointer;"
                    @click=${(e: Event) => { e.stopPropagation(); this.openStopColorPicker(e.currentTarget as HTMLElement, subLayerIds, 'line-color', colorExpr, colorIndex, lineColor); }}>
                    ${svg`<svg width="24" height="14">
                        <line x1="2" y1="7" x2="22" y2="7"
                            stroke="${lineColor}" stroke-width="${w}"
                            stroke-dasharray="${dasharray}" stroke-linecap="round"/>
                    </svg>`}
                </button>
                ${label !== null ? html`<span class="legend-label">${label}</span>` : ''}
            </div>`;
    }

    /** Get attribute translations from layer metadata: name → {label, unit, maxvalue, valuemap} */
    private getAttrTranslations(): Map<string, {label: string; unit: string; maxvalue?: number; valuemap?: Array<{value: unknown; label: string; operator?: string}>}> {
        const rawAttrs = (this.meta as any)?.attributes;
        const attrs = typeof rawAttrs === 'string'
            ? (this.adapter?.store.getState().attributeMetadata?.[rawAttrs] as any)
            : rawAttrs;
        const map = new Map<string, {label: string; unit: string; maxvalue?: number; valuemap?: Array<{value: unknown; label: string; operator?: string}>}>();
        if (!Array.isArray(attrs?.translations)) return map;
        for (const t of attrs.translations) {
            if (typeof t?.name === 'string') {
                map.set(t.name, {
                    label: typeof t.translation === 'string' ? t.translation : t.name,
                    unit: typeof t.unit === 'string' ? t.unit : '',
                    ...(typeof t.maxvalue === 'number' ? { maxvalue: t.maxvalue } : {}),
                    ...(Array.isArray(t.valuemap) ? { valuemap: t.valuemap } : {}),
                });
            }
        }
        return map;
    }

    /** Extract property name from a ["get", "prop"] expression. */
    private getPropName(expr: unknown): string | null {
        return Array.isArray(expr) && expr[0] === 'get' && typeof expr[1] === 'string' ? expr[1] : null;
    }

    /** Extract readable label from a case/comparison condition expression, with unit and valuemap from attr metadata. */
    private conditionLabel(cond: unknown, attrTr?: Map<string, {label: string; unit: string; valuemap?: Array<{value: unknown; label: string; operator?: string}>}>): string | null {
        if (!Array.isArray(cond) || cond.length < 3) return '';
        const op = cond[0];
        const lhsProp = this.getPropName(cond[1]);
        const rhs = cond[2];
        const attrEntry = lhsProp ? attrTr?.get(lhsProp) : undefined;
        const unit = attrEntry?.unit ?? '';
        // Check valuemap for an entry matching value + operator
        if (attrEntry?.valuemap) {
            const mapped = attrEntry.valuemap.find(m =>
                String(m.value) === String(rhs) && (m.operator === undefined || m.operator === op)
            );
            if (mapped) return mapped.label;
        }
        if (op === '==') return typeof rhs === 'number' || typeof rhs === 'string' ? `${rhs}${unit}` : '';
        if (['<','<=','>','>='].includes(op) && (typeof rhs === 'number' || typeof rhs === 'string')) {
            return `${op} ${rhs}${unit}`;
        }
        return '';
    }

    /** Format a large number for legend labels: 1500000 → "1.5M" */
    private formatNumber(v: number, unit?: string): string {
        const suffix = unit ?? '';
        if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace(/\.0$/, '')}B${suffix}`;
        if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, '')}M${suffix}`;
        if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K${suffix}`;
        return `${Math.round(v)}${suffix}`;
    }

    /** Extract class legend from case/match/step expressions — returns [{label, color}] or null. */
    private extractColorClasses(expr: unknown, attrTr?: Map<string, {label: string; unit: string; valuemap?: Array<{value: unknown; label: string; operator?: string}>}>): Array<{label: string, color: string}> | null {
        if (!Array.isArray(expr)) return null;
        const op = expr[0];
        if (op === 'case') {
            const items: Array<{label: string, color: string}> = [];
            for (let i = 1; i + 1 < expr.length; i += 2) {
                const label = this.conditionLabel(expr[i], attrTr);
                if (label === null) continue;
                const color = typeof expr[i + 1] === 'string' ? expr[i + 1] : '';
                if (color) items.push({ label: label || '', color });
            }
            const def = expr[expr.length - 1];
            if (typeof def === 'string') items.push({ label: '', color: def });
            return items.length > 1 ? items : null;
        }
        if (op === 'match') {
            const matchProp = this.getPropName(expr[1]);
            const attrEntry = matchProp ? attrTr?.get(matchProp) : undefined;
            const unit = attrEntry?.unit ?? '';
            const valuemap = attrEntry?.valuemap;
            const items: Array<{label: string, color: string}> = [];
            for (let i = 2; i + 1 < expr.length - 1; i += 2) {
                const rawKey = Array.isArray(expr[i]) ? expr[i] : expr[i];
                const rawStr = Array.isArray(rawKey) ? rawKey.join(', ') : String(rawKey);
                const mapped = valuemap?.find(m => String(m.value) === String(rawKey));
                const label = mapped ? mapped.label : (unit ? `${rawStr}${unit}` : rawStr);
                const color = typeof expr[i + 1] === 'string' ? expr[i + 1] : '';
                if (color) items.push({ label, color });
            }
            const def = expr[expr.length - 1];
            if (typeof def === 'string') items.push({ label: '', color: def });
            return items.length > 1 ? items : null;
        }
        return null;
    }

    /** Is this expression zoom-interpolated (not data-driven)? */
    private isZoomExpression(expr: unknown): boolean {
        if (!Array.isArray(expr)) return false;
        const op = expr[0];
        if ((op === 'interpolate' || op === 'step') && Array.isArray(expr[1])) {
            return expr[1][0] === 'zoom' || expr[2]?.[0] === 'zoom';
        }
        if (op === 'interpolate' && expr.length >= 3) {
            return Array.isArray(expr[2]) && expr[2][0] === 'zoom';
        }
        return false;
    }

    /**
     * Detect proportional bubble pattern: zoom-interpolated radius where each stop value
     * is `["*", c, ["sqrt", ["get", prop]]]` or `["*", c, ["get", prop]]`.
     * Returns {coeff, prop, isSqrt} or null.
     */
    /** Extract {coeff, base} from a single radius stop expression. */
    private parseRadiusFormula(expr: unknown): {coeff: number, base: number, prop: string, isSqrt: boolean} | null {
        if (!Array.isArray(expr)) return null;
        if (expr[0] === '*' && typeof expr[1] === 'number') {
            const inner = expr[2];
            if (Array.isArray(inner) && inner[0] === 'sqrt' && Array.isArray(inner[1]) && inner[1][0] === 'get')
                return { coeff: expr[1], base: 0, prop: inner[1][1] as string, isSqrt: true };
            if (Array.isArray(inner) && inner[0] === 'get')
                return { coeff: expr[1], base: 0, prop: inner[1] as string, isSqrt: false };
        }
        if (expr[0] === '+') {
            const base = typeof expr[1] === 'number' ? expr[1] : (typeof expr[2] === 'number' ? expr[2] : 0);
            const mulPart = [expr[1], expr[2]].find((p: unknown) => Array.isArray(p) && (p as any)[0] === '*');
            if (mulPart && Array.isArray(mulPart)) {
                const inner = (mulPart as any[])[2];
                if (Array.isArray(inner) && inner[0] === 'sqrt' && Array.isArray(inner[1]) && inner[1][0] === 'get')
                    return { coeff: (mulPart as any[])[1], base, prop: inner[1][1] as string, isSqrt: true };
            }
        }
        return null;
    }

    private extractProportionalRadius(radiusExpr: unknown, zoom: number): {coeff: number, base: number, prop: string, isSqrt: boolean} | null {
        if (!Array.isArray(radiusExpr) || radiusExpr[0] !== 'interpolate') return null;
        // Collect all zoom stops: [zoomVal, stopExpr] pairs
        const interpType = radiusExpr[1]; // ["linear"] or ["exponential", base]
        const expBase = Array.isArray(interpType) && interpType[0] === 'exponential' && typeof interpType[1] === 'number'
            ? interpType[1] : 1;

        const zoomStops: Array<{z: number, expr: unknown}> = [];
        for (let i = 3; i + 1 < radiusExpr.length; i += 2) {
            zoomStops.push({ z: Number(radiusExpr[i]), expr: radiusExpr[i + 1] });
        }
        if (zoomStops.length === 0) return null;

        // Find surrounding stops
        let lo = zoomStops[0], hi = zoomStops[zoomStops.length - 1];
        for (let i = 0; i < zoomStops.length - 1; i++) {
            if (zoom >= zoomStops[i].z && zoom <= zoomStops[i + 1].z) {
                lo = zoomStops[i]; hi = zoomStops[i + 1]; break;
            }
        }

        const pLo = this.parseRadiusFormula(lo.expr);
        const pHi = this.parseRadiusFormula(hi.expr);
        if (!pLo && !pHi) return null;

        // If same stop or both same, no interpolation needed
        if (lo.z === hi.z || zoom <= lo.z) return pLo ?? pHi;
        if (zoom >= hi.z) return pHi ?? pLo;

        // Compute interpolation factor t ∈ [0,1]
        let t: number;
        if (expBase !== 1 && expBase > 0) {
            t = (Math.pow(expBase, zoom - lo.z) - 1) / (Math.pow(expBase, hi.z - lo.z) - 1);
        } else {
            t = (zoom - lo.z) / (hi.z - lo.z);
        }
        t = Math.max(0, Math.min(1, t));

        // Interpolate effective coeff and base from both formulas
        const cLo = pLo ?? { coeff: 0, base: 0, prop: pHi!.prop, isSqrt: pHi!.isSqrt };
        const cHi = pHi ?? { coeff: 0, base: 0, prop: pLo!.prop, isSqrt: pLo!.isSqrt };
        return {
            coeff: cLo.coeff + t * (cHi.coeff - cLo.coeff),
            base: cLo.base + t * (cHi.base - cLo.base),
            prop: cHi.prop || cLo.prop,
            isSqrt: cHi.isSqrt || cLo.isSqrt,
        };
    }

    // ─── Inline vector style editor ───────────────────────────────────────────

    /** Normalizes a color value for the picker; falls back if not a plain CSS color string. */
    private toCssColor(value: unknown, fallback: string): string {
        if (typeof value === 'string') return value;
        // match/case expression: last element is the fallback color
        if (Array.isArray(value) && (value[0] === 'match' || value[0] === 'case') && value.length >= 2) {
            const last = value[value.length - 1];
            if (typeof last === 'string') return last;
        }
        return fallback;
    }

    /** Active Pickr popup instances, keyed by `${subLayerId}::${paintKey}`. */
    private pickrInstances = new Map<string, Pickr>();

    /** Value to restore on 'cancel', keyed by `${subLayerId}::${paintKey}`. Updated each time the picker opens. */
    private pickrOriginal = new Map<string, string>();

    /** Fixed palette of common colors plus transparent, edugis-style. */
    private static readonly COLOR_PALETTE = [
        '#000000', '#ffffff', '#7f7f7f', '#ff0000', '#ff8000', '#ffff00',
        '#00ff00', '#008000', '#00ffff', '#0000ff', '#8000ff', '#ff00ff',
        'rgba(0,0,0,0)',
    ];

    private destroyPickrs(): void {
        for (const p of this.pickrInstances.values()) p.destroyAndRemove();
        this.pickrInstances.clear();
        this.pickrOriginal.clear();
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.legendResizeObserver?.disconnect();
        this.legendResizeObserver = null;
        this.destroyPickrs();
    }

    protected updated(changed: Map<string, unknown>): void {
        if (changed.has('layerId')) {
            this.legendCollapsed = true;
            if (this.store) this.onStateChanged(this.store.getState());
        }
        if (changed.has('editorOpenKey')) {
            this.destroyPickrs();
        }
        this.observeLegendContent();
        this.queueLegendMeasure();
    }

    /**
     * Opens (creating if needed) a Pickr popup color picker attached to the swatch button.
     * `onChange`/`onCancel` default to overriding `paint[key]` with the picked color directly
     * (flat color paint); pass custom callbacks to instead patch one stop of a
     * match/case/step color expression (see `renderEditableLegendRow`).
     */
    private openColorPicker(
        button: HTMLElement, subLayerIds: string[], key: string, value: string,
        onChange?: (rgba: string) => void,
        paintButtonBackground = true,
    ): void {
        const id = `${subLayerIds.join(',')}::${key}`;
        const apply = onChange ?? ((rgba: string) => this.setPaintOverride(subLayerIds, key, rgba));
        let pickr = this.pickrInstances.get(id);
        if (!pickr) {
            pickr = Pickr.create({
                el: button,
                theme: 'nano',
                default: value,
                useAsButton: true,
                comparison: false,
                appClass: 'webmapx-pickr',
                swatches: WebmapxLayerLegend.COLOR_PALETTE,
                components: {
                    preview: true,
                    opacity: true,
                    hue: true,
                    interaction: { input: true, cancel: true, save: true, rgba: false, hsla: false, hsva: false, cmyk: false, hex: false },
                },
            });
            pickr.on('change', (color: Pickr.HSVaColor) => {
                const rgba = color.toRGBA().toString(0);
                if (paintButtonBackground) button.style.background = rgba;
                apply(rgba);
            });
            pickr.on('save', () => {
                pickr!.hide();
            });
            pickr.on('cancel', () => {
                const orig = this.pickrOriginal.get(id)!;
                if (paintButtonBackground) button.style.background = orig;
                apply(orig);
                pickr!.hide();
            });
            if (!paintButtonBackground) {
                pickr.on('hide', () => { button.style.background = 'transparent'; });
            }
            this.pickrInstances.set(id, pickr);
            this.pickrOriginal.set(id, value);
            pickr.show();
        } else {
            pickr.setColor(value);
            this.pickrOriginal.set(id, value);
        }
    }

    private setPaintOverride(subLayerIds: string[], key: string, value: unknown): void {
        const overrides = { ...this.editOverrides };
        for (const subLayerId of subLayerIds) {
            overrides[subLayerId] = { ...(overrides[subLayerId] ?? {}), [key]: value };
            this.adapter?.updateLayerStyle(this.layerId, subLayerId || this.layerId, { [key]: value });
        }
        if (this.isConnected) this.editOverrides = overrides;

        // Persist paint changes to the store so saved layers include the updated style.
        if (!this.adapter) return;
        const state = this.adapter.store.getState();
        const current = state.mapLayers;
        const entry = current?.[this.layerId] as Record<string, unknown> | undefined;
        if (!entry) return;

        // For standard layers (subLayerId === layerId), update top-level paint.
        // For composite/style layers, update the matching sublayer's paint.
        const sublayers = Array.isArray(entry.sublayers) ? entry.sublayers as Record<string, unknown>[] : null;
        if (sublayers) {
            const updatedSublayers = sublayers.map(sub => {
                const subId = String(sub.id ?? '');
                if (!subLayerIds.includes(subId)) return sub;
                const existingPaint = (sub.paint && typeof sub.paint === 'object') ? sub.paint as Record<string, unknown> : {};
                return { ...sub, paint: { ...existingPaint, [key]: value } };
            });
            this.adapter.store.dispatch({
                mapLayers: { ...current, [this.layerId]: { ...entry, sublayers: updatedSublayers } }
            }, 'UI');
        } else {
            const existingPaint = (entry.paint && typeof entry.paint === 'object') ? entry.paint as Record<string, unknown> : {};
            this.adapter.store.dispatch({
                mapLayers: { ...current, [this.layerId]: { ...entry, paint: { ...existingPaint, [key]: value } } }
            }, 'UI');
        }
    }

    private renderRangeRow(subLayerIds: string[], label: string, key: string, value: number, min: number, max: number, step: number, unit = ''): TemplateResult {
        return html`
            <div class="style-editor-row">
                <label>${label}
                    <input type="range" min=${min} max=${max} step=${step} .value=${String(value)}
                        @input=${(e: Event) => {
                            // Live visual update only — no state change so Lit doesn't re-render and break drag
                            const v = Number((e.target as HTMLInputElement).value);
                            for (const sid of subLayerIds) this.adapter?.updateLayerStyle(this.layerId, sid || this.layerId, { [key]: v });
                            const row = (e.target as HTMLElement).closest('.style-editor-row');
                            const out = row?.querySelector('output');
                            if (out) out.textContent = `${v}${unit}`;
                        }}
                        @change=${(e: Event) => this.setPaintOverride(subLayerIds, key, Number((e.target as HTMLInputElement).value))}>
                </label>
                <output>${value}${unit}</output>
            </div>`;
    }

    private renderColorRow(subLayerIds: string[], label: string, key: string, value: string): TemplateResult {
        return html`
            <div class="style-editor-row">
                <label>${label}</label>
                <button type="button" class="color-swatch" style="background:${value}"
                    @click=${(e: Event) => this.openColorPicker(e.currentTarget as HTMLElement, subLayerIds, key, value)}></button>
            </div>`;
    }

    private renderStyleEditor(subLayerIds: string[], layerType: string, paint: Record<string, unknown>): TemplateResult {
        if (layerType === 'fill' || layerType === 'fill-extrusion') {
            const colorKey = layerType === 'fill' ? 'fill-color' : 'fill-extrusion-color';
            const color = this.toCssColor(paint[colorKey], '#000000');
            const opacityKey = layerType === 'fill' ? 'fill-opacity' : 'fill-extrusion-opacity';
            const opacity = Number(paint[opacityKey] ?? 1);
            const rows = [this.renderColorRow(subLayerIds, 'fill color', colorKey, color)];
            if (layerType === 'fill') {
                const outline = this.toCssColor(paint['fill-outline-color'], color);
                rows.push(this.renderColorRow(subLayerIds, 'outline color', 'fill-outline-color', outline));
            }
            rows.push(this.renderRangeRow(subLayerIds, 'opacity', opacityKey, opacity, 0, 1, 0.05));
            return html`<div class="style-editor">${rows}</div>`;
        }

        if (layerType === 'line') {
            const color = this.toCssColor(paint['line-color'], '#000000');
            const width = Number(paint['line-width'] ?? 2);
            const opacity = Number(paint['line-opacity'] ?? 1);
            return html`<div class="style-editor">
                ${this.renderColorRow(subLayerIds, 'line color', 'line-color', color)}
                ${this.renderRangeRow(subLayerIds, 'width', 'line-width', width, 0.5, 10, 0.5, 'px')}
                ${this.renderRangeRow(subLayerIds, 'opacity', 'line-opacity', opacity, 0, 1, 0.05)}
            </div>`;
        }

        if (layerType === 'circle') {
            const color = this.toCssColor(paint['circle-color'], '#000000');
            const radius = Number(paint['circle-radius'] ?? 5);
            const strokeColor = this.toCssColor(paint['circle-stroke-color'], color);
            const strokeWidth = Number(paint['circle-stroke-width'] ?? 0);
            const opacity = Number(paint['circle-opacity'] ?? 1);
            return html`<div class="style-editor">
                ${this.renderRangeRow(subLayerIds, 'radius', 'circle-radius', radius, 1, 30, 1, 'px')}
                ${this.renderColorRow(subLayerIds, 'fill color', 'circle-color', color)}
                ${this.renderRangeRow(subLayerIds, 'opacity', 'circle-opacity', opacity, 0, 1, 0.05)}
                ${this.renderRangeRow(subLayerIds, 'outline width', 'circle-stroke-width', strokeWidth, 0, 10, 0.5, 'px')}
                ${this.renderColorRow(subLayerIds, 'outline color', 'circle-stroke-color', strokeColor)}
            </div>`;
        }

        if (layerType === 'symbol') {
            const color = this.toCssColor(paint['text-color'], '#1f2937');
            const opacity = Number(paint['text-opacity'] ?? 1);
            const size = Number(paint['text-size'] ?? 12);
            const hasHalo = paint['text-halo-color'] !== undefined || Number(paint['text-halo-width'] ?? 0) > 0;
            const haloColor = this.toCssColor(paint['text-halo-color'], '#ffffff');
            return html`<div class="style-editor">
                ${this.renderRangeRow(subLayerIds, 'size', 'text-size', size, 8, 32, 1, 'px')}
                ${this.renderColorRow(subLayerIds, 'text color', 'text-color', color)}
                ${this.renderRangeRow(subLayerIds, 'opacity', 'text-opacity', opacity, 0, 1, 0.05)}
                ${hasHalo ? this.renderColorRow(subLayerIds, 'halo color', 'text-halo-color', haloColor) : ''}
            </div>`;
        }

        if (layerType === 'raster') {
            const rawOpacity = paint['raster-opacity'];
            const resolved = Array.isArray(rawOpacity) ? this.evalAtZoom(rawOpacity, this.zoom) : rawOpacity;
            const opacity = Number(isFinite(Number(resolved)) ? resolved : 1);
            return html`<div class="style-editor">
                ${this.renderRangeRow(subLayerIds, 'opacity', 'raster-opacity', opacity, 0, 1, 0.05)}
            </div>`;
        }

        if (layerType === 'hillshade') {
            return html``;
        }

        return html``;
    }

    private renderHillshadeTerrainCheckbox(): TemplateResult {
        return html`
            <div class="style-editor-row" style="padding:2px 0">
                <input type="checkbox" id="hillshade-terrain-${this.layerId}" .checked=${this.terrainEnabled}
                    @change=${(e: Event) => this.toggleTerrainFromHillshade((e.target as HTMLInputElement).checked)}>
                <label for="hillshade-terrain-${this.layerId}" style="flex:1">Show terrain in 3D</label>
            </div>`;
    }

    /** Enables/disables 3D terrain using this hillshade layer's raster-dem source. */
    private toggleTerrainFromHillshade(enabled: boolean): void {
        let sourceConfig: unknown;

        // Standard layer: sourceId in metadata
        const sourceId = typeof this.meta?.sourceId === 'string' ? this.meta.sourceId : undefined;
        if (sourceId) {
            sourceConfig = this.layerDataConfig?.sources?.find((s: any) => s?.id === sourceId)
                ?? (this.adapter?.getSource(sourceId) ? { id: sourceId, type: 'raster-dem' } : undefined);
        }

        // Composite style layer: derive native source id from sublayers
        if (!sourceConfig) {
            const sublayers = Array.isArray(this.meta?.sublayers) ? this.meta.sublayers as any[] : [];
            for (const sub of sublayers) {
                if (sub?.type !== 'hillshade') continue;
                const localKey = typeof sub.source === 'string' ? sub.source : 'source';
                const nativeId = `${this.layerId}:${localKey}`;
                if (this.adapter?.getSource(nativeId)) {
                    sourceConfig = { id: nativeId, type: 'raster-dem' };
                    break;
                }
            }
        }

        this.adapter?.setTerrainEnabled(enabled, sourceConfig);
        this.terrainEnabled = this.adapter?.isTerrainEnabled() === true;
    }

    /** Whether the given (single, non-composite) layer's paint is simple enough to edit inline (no data/zoom expressions). */
    private isEditableType(layerType: string | null, paint: Record<string, unknown>, isComposite = false): boolean {
        if (!layerType) return false;
        if (layerType === 'hillshade') return true;
        // Raster opacity editing is only offered for sublayers of a composite/style layer
        // (e.g. a remote-style basemap's imagery layer) — a standalone raster layer is
        // already fully covered by the layer's own transparency slider.
        if (layerType === 'raster') return isComposite;
        const colorKey = layerType === 'fill' ? 'fill-color'
            : layerType === 'fill-extrusion' ? 'fill-extrusion-color'
            : layerType === 'line' ? 'line-color'
            : layerType === 'circle' ? 'circle-color'
            : layerType === 'symbol' ? 'text-color'
            : null;
        if (!colorKey) return false;
        return !Array.isArray(paint[colorKey]);
    }

    private renderLegendItems(subLayerIds: string[], layerType: string, paint: Record<string, unknown>): TemplateResult[] {
        const attrTr = this.getAttrTranslations();

        if (layerType === 'circle') {
            const strokeColor = String(paint['circle-stroke-color'] ?? '#aaa');
            const strokeWidth = Number(paint['circle-stroke-width'] ?? 1);
            const colorExpr = paint['circle-color'];
            const radiusExpr = paint['circle-radius'];
            const color = String(Array.isArray(colorExpr) ? (this.evalAtZoom(colorExpr, this.zoom) ?? colorExpr[colorExpr.length-1] ?? '#000000') : (colorExpr ?? '#000000'));
            const colorClasses = this.extractColorClasses(colorExpr, attrTr);

            // Check for proportional bubble (zoom-interp radius with data expr stops)
            const propRadius = this.extractProportionalRadius(radiusExpr, this.zoom);
            if (propRadius) {
                const LEGEND_MAX_R = 38; // match map pixel size: rMapMax ≈ 38px → legend max ≈ 38px
                const { coeff, base, isSqrt } = propRadius;
                const toMapR = (v: number) => base + coeff * (isSqrt ? Math.sqrt(v) : v);
                const toData = (r: number) => { const net = Math.max(0, r - base); return isSqrt ? (net / coeff) ** 2 : net / coeff; };
                // Use per-attribute maxvalue if provided, otherwise assume max visible circle ~38px
                const propAttr = propRadius.prop ? attrTr.get(propRadius.prop) : undefined;
                const metaMaxValue = typeof propAttr?.maxvalue === 'number' ? propAttr.maxvalue : null;
                const rMapMin = Math.max(base + 1, 3);
                const rMapMax = metaMaxValue !== null ? toMapR(metaMaxValue) : base + 38;
                const mapRadii = [0, 1/3, 2/3, 1].map(f =>
                    rMapMin * Math.pow(rMapMax / rMapMin, f));
                const dataVals = mapRadii.map(r => toData(r));
                const propUnit = propRadius.prop ? attrTr.get(propRadius.prop)?.unit : undefined;
                // scale = 1: legend circles match map pixel sizes 1:1
                const rawRadii = mapRadii.map(r => Math.max(1, r));
                const maxRaw = rawRadii[rawRadii.length - 1];
                const minDistinct = 4; // minimum pixel spread across 4 stops
                const spreadScale = maxRaw < minDistinct ? minDistinct / maxRaw : 1;
                const stops: Array<{value: string, color: string, radius: number}> = dataVals.map((v, i) => ({
                    value: this.formatNumber(v, propUnit),
                    color,
                    radius: Math.max(1, Math.round(rawRadii[i] * spreadScale)),
                }));
                // Deduplicate stops with same radius (collapsed range)
                const seen = new Set<number>();
                const deduped = stops.filter(s => !seen.has(s.radius) && seen.add(s.radius));
                return [this.renderBubbleLegend(deduped, strokeColor, strokeWidth)];
            }

            // Data-driven color with fixed/zoom radius → color class rows
            if (colorClasses) {
                const rawR = this.evalAtZoom(radiusExpr, this.zoom);
                const r = Math.min(Number(isFinite(Number(rawR)) ? rawR : 6), 20);
                return colorClasses.filter(c => c.label !== '').map(c => this.renderCircleRow(c.color, strokeColor, strokeWidth, r, c.label));
            }

            const colorStops = this.extractLegendStops(colorExpr);
            const radiusIsZoom = this.isZoomExpression(radiusExpr);
            const radiusStops = radiusIsZoom ? [] : this.extractLegendStops(radiusExpr);

            const stops2: Array<{value: string, color: string, radius: number}> = [];
            const count = Math.max(colorStops.length, radiusStops.length || 1);
            let prevKey = '';
            for (let i = 0; i < count; i++) {
                const c = String(colorStops[i]?.paint ?? colorStops[0]?.paint ?? '#3388ff');
                const rawR = radiusStops.length > 0
                    ? (radiusStops[i]?.paint ?? radiusStops[0]?.paint ?? 6)
                    : (this.evalAtZoom(radiusExpr, this.zoom) ?? 6);
                const resolvedR = Array.isArray(rawR) ? this.evalAtZoom(rawR, this.zoom) : rawR;
                const radiusRaw = Math.min(Number(isFinite(Number(resolvedR)) ? resolvedR : 6), 50);
                const key = `${c}|${radiusRaw}`;
                if (key === prevKey) continue;
                prevKey = key;
                const labelVal = (!radiusIsZoom && (colorStops[i]?.value ?? radiusStops[i]?.value)) ?? null;
                stops2.push({ value: labelVal !== null ? String(labelVal) : '', color: c, radius: radiusRaw });
            }

            if (stops2.length > 1 && radiusStops.length > 1) {
                return [this.renderBubbleLegend(stops2, strokeColor, strokeWidth)];
            }
            return stops2.map(s => this.renderCircleRow(s.color, strokeColor, strokeWidth, s.radius, s.value));
        }

        if (layerType === 'fill' || layerType === 'fill-extrusion') {
            const colorKey = layerType === 'fill' ? 'fill-color' : 'fill-extrusion-color';
            const opacityKey = layerType === 'fill' ? 'fill-opacity' : 'fill-extrusion-opacity';
            const opacity = Number(paint[opacityKey] ?? (layerType === 'fill' ? 0.7 : 0.8));
            const outlineColor = layerType === 'fill'
                ? String(paint['fill-outline-color'] ?? paint['fill-color'] ?? '#aaa')
                : String(paint['fill-extrusion-color'] ?? '#aaa');
            const colorExpr = paint[colorKey];

            // Try case/match expressions for multi-class legend
            const classes = this.extractColorClasses(colorExpr, attrTr);
            if (classes) {
                const stopIndices = Array.isArray(colorExpr) ? this.colorExprStopIndices(colorExpr) : null;
                return classes.filter(c => c.label !== '').map((c, i) => {
                    const stopIdx = stopIndices?.[i] ?? null;
                    const onClick = stopIdx !== null && Array.isArray(colorExpr)
                        ? (e: Event) => { e.stopPropagation(); this.openStopColorPicker(e.currentTarget as HTMLElement, subLayerIds, colorKey, colorExpr, stopIdx, c.color); }
                        : undefined;
                    return this.renderFillRow(c.color, outlineColor, opacity, c.label, onClick);
                });
            }
            // Interpolate/step stops
            const colorStops = this.extractLegendStops(colorExpr);
            return colorStops
                .filter((s, _, arr) => arr.length === 1 || s.value !== null)
                .map(s => this.renderFillRow(String(s.paint ?? '#3388ff'), outlineColor, opacity,
                    s.value !== null ? String(s.value) : ''));
        }

        if (layerType === 'line') {
            const colorExpr = paint['line-color'];
            const colorStops = this.extractLegendStops(colorExpr);
            const widthStops = this.extractLegendStops(paint['line-width']);
            const dasharray = Array.isArray(paint['line-dasharray']) ? (paint['line-dasharray'] as number[]).join(' ') : '';
            const stopIndices = Array.isArray(colorExpr) ? this.colorExprStopIndices(colorExpr) : null;
            return colorStops.map((s, i) => {
                const lineWidth = Number(widthStops[i]?.paint ?? widthStops[0]?.paint ?? 2);
                const label = s.value !== null ? String(s.value) : '';
                const color = String(s.paint ?? '#3388ff');
                if (stopIndices && stopIndices.length === colorStops.length) {
                    return this.renderEditableLineRow(subLayerIds, color, lineWidth, dasharray, label, colorExpr as unknown[], stopIndices[i]);
                }
                return this.renderLineRow(color, lineWidth, dasharray, label);
            });
        }

        // symbol, raster, background — single swatch
        if (layerType === 'symbol') {
            const textColor = String((paint as Record<string, unknown>)['text-color'] ?? '#1f2937');
            return [html`
                <div class="legend-row">
                    ${svg`<svg width="24" height="14" style="flex-shrink:0">
                        <text x="12" y="11" text-anchor="middle" font-size="11"
                            fill="${textColor}" font-family="sans-serif">A</text>
                    </svg>`}
                </div>`];
        }

        if (layerType === 'raster' || layerType === 'background' || layerType === 'hillshade') {
            return [html`
                <div class="legend-row">
                    ${svg`<svg width="24" height="14" style="flex-shrink:0">
                        <defs>
                            <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
                                <rect width="2" height="2" fill="#ccc"/>
                                <rect x="2" y="2" width="2" height="2" fill="#eee"/>
                            </pattern>
                        </defs>
                        <rect x="1" y="1" width="22" height="12" fill="url(#grid)" rx="2"/>
                    </svg>`}
                </div>`];
        }

        return [];
    }

    protected render() {
        if (!this.layerId) return html``;
        const meta = this.meta;
        const layerType = typeof meta?.layerType === 'string' ? meta.layerType : null;
        const paint = (meta?.paint && typeof meta.paint === 'object') ? meta.paint as Record<string, unknown> : {};
        const legendUrl = typeof meta?.legendurl === 'string' && meta.legendurl.length > 0 ? meta.legendurl : null;
        const label = typeof meta?.label === 'string' ? meta.label : this.layerId;
        const sublayers = Array.isArray(meta?.sublayers) ? meta!.sublayers as unknown[] : null;

        // Top-level layer minzoom/maxzoom (config-level override) applies regardless of composite.
        const topMinz = typeof meta?.minzoom === 'number' ? meta.minzoom : 0;
        const topMaxz = typeof meta?.maxzoom === 'number' ? meta.maxzoom : 24;
        if (this.zoom < topMinz || this.zoom > topMaxz) {
            return this.renderZoomHint(topMinz, topMaxz, this.zoom);
        }

        // Composite style layer — route all sublayer configs through renderCompositeLegend
        if (sublayers && sublayers.length > 0) {
            const compositeLegend = this.renderCompositeLegend(sublayers, this.zoom);
            // For single-sublayer hillshade: append terrain checkbox + exaggeration slider
            const isSingleHillshade = sublayers.length === 1
                && typeof (sublayers[0] as any)?.type === 'string'
                && (sublayers[0] as any).type === 'hillshade';
            if (!isSingleHillshade) return this.renderCollapsibleLegend(compositeLegend);
            return this.renderCollapsibleLegend(html`
                <div class="legend-wrap">
                    ${compositeLegend}
                    ${this.renderHillshadeTerrainCheckbox()}
                </div>`);
        }

        const minz = topMinz;
        const maxz = topMaxz;
        if (this.zoom < minz || this.zoom > maxz) {
            return this.renderZoomHint(minz, maxz, this.zoom);
        }

        const supportedTypes = ['fill', 'fill-extrusion', 'line', 'circle', 'symbol', 'raster', 'background', 'hillshade'];
        const hasSwatch = layerType && supportedTypes.includes(layerType) && !legendUrl;

        const stdSubLayerIds = [this.layerId];
        const overrides = this.editOverrides[this.layerId];
        const effectivePaint = overrides ? { ...paint, ...overrides } : paint;
        const editable = !sublayers && hasSwatch && this.isEditableType(layerType, effectivePaint);
        const isOpen = this.editorOpenKey === this.layerId;

        return this.renderCollapsibleLegend(html`
            <div class="legend-wrap">
                ${hasSwatch ? html`
                    <div class=${editable ? 'editable' : ''} @click=${editable ? () => { this.editorOpenKey = isOpen ? null : this.layerId; } : null}>
                        ${this.renderLegendItems(stdSubLayerIds, layerType!, effectivePaint)}
                    </div>
                    ${layerType === 'hillshade' ? this.renderHillshadeTerrainCheckbox() : ''}
                    ${editable && isOpen ? this.renderStyleEditor(stdSubLayerIds, layerType!, effectivePaint) : ''}
                ` : ''}
                ${legendUrl ? html`
                    <img class="legend-img" src=${legendUrl} alt=${label}
                        @error=${(e: Event) => {
                            const img = e.target as HTMLImageElement;
                            const span = document.createElement('span');
                            span.className = 'img-error';
                            span.textContent = '⚠ invalid legend image';
                            img.replaceWith(span);
                    }}>
                ` : ''}
            </div>
        `);
    }
}
