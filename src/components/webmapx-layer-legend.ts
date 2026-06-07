import { css, html, svg, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';

@customElement('webmapx-layer-legend')
export class WebmapxLayerLegend extends WebmapxBaseTool {
    @property({ type: String, attribute: 'layer-id' })
    layerId = '';

    @state() private meta: Record<string, unknown> | null = null;
    @state() private zoom: number = 2;

    static styles = css`
        :host { display: block; }
        .legend-wrap { display: flex; flex-direction: column; gap: 2px; }
        .legend-row { display: flex; align-items: center; gap: 6px; min-height: 18px; }
        .legend-label { font-size: 0.75rem; color: var(--color-text-primary, #1f2937); line-height: 1.2; }
        .legend-img { max-width: 100%; height: auto; display: block; border-radius: 3px; }
        .img-error { font-size: 0.75rem; color: var(--sl-color-danger-600, #c0392b); font-style: italic; }
        .sub-group-title { font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary, #555); margin-top: 4px; }
        .sub-row { padding-left: 8px; }
    `;

    protected onStateChanged(state: IMapState): void {
        const entry = (state.mapLayers ?? {})[this.layerId] as Record<string, unknown> | undefined;
        this.meta = entry ?? null;
        if (typeof state.zoomLevel === 'number') this.zoom = state.zoomLevel;
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
    private extractDataCases(expr: unknown): Array<{label: string, paint: unknown}> | null {
        if (!Array.isArray(expr)) return null;
        const op = expr[0];
        if (op === 'match' && expr.length >= 5) {
            const cases: Array<{label: string, paint: unknown}> = [];
            for (let i = 2; i + 1 < expr.length - 1; i += 2) {
                const matchVal = Array.isArray(expr[i]) ? expr[i].join(', ') : String(expr[i]);
                cases.push({ label: matchVal, paint: expr[i + 1] });
            }
            // default (last element)
            cases.push({ label: 'other', paint: expr[expr.length - 1] });
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
            cases.push({ label: 'other', paint: expr[expr.length - 1] });
            return cases.length > 1 ? cases : null;
        }
        return null;
    }

    private isDataDriven(expr: unknown): boolean {
        if (!Array.isArray(expr)) return false;
        const op = expr[0];
        if (op === 'match' || op === 'case') return true;
        if (op === 'step') return !(Array.isArray(expr[1]) && expr[1][0] === 'zoom');
        return false;
    }

    // ─── Composite style legend ───────────────────────────────────────────────

    private renderCompositeLegend(sublayers: unknown[], zoom: number): TemplateResult {
        const rows: TemplateResult[] = [];
        const seen = new Set<string>(); // deduplicate by visual key

        for (const raw of sublayers) {
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
            const label = rawId.replace(/^style:/, '').replace(/-/g, ' ');

            // Evaluate zoom-dependent paint and layout values
            const evalPaint: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(paint)) {
                evalPaint[k] = this.isDataDriven(v) ? v : this.evalAtZoom(v, zoom);
            }
            const evalLayout: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(layoutRaw)) {
                evalLayout[k] = this.evalAtZoom(v, zoom);
            }

            // Find primary color key for this layer type
            const colorKey = type === 'fill' ? 'fill-color'
                : type === 'fill-extrusion' ? 'fill-extrusion-color'
                : type === 'line' ? 'line-color'
                : type === 'circle' ? 'circle-color'
                : type === 'symbol' ? 'text-color'
                : null;

            const rawColorExpr = colorKey ? paint[colorKey] : null;
            const dataCases = rawColorExpr ? this.extractDataCases(rawColorExpr) : null;

            if (dataCases && dataCases.length > 1) {
                // Multi-class legend: title row + case rows
                const dedupKey = `${type}|${rawId}`;
                if (seen.has(dedupKey)) continue;
                seen.add(dedupKey);

                rows.push(html`<div class="sub-group-title">${label}</div>`);
                for (const { label: caseLabel, paint: casePaint } of dataCases) {
                    const casePaintObj = { ...evalPaint, [colorKey!]: casePaint };
                    const swatch = this.renderSwatch(type, casePaintObj, zoom, evalLayout);
                    if (!swatch) continue;
                    const caseKey = `${type}|${String(casePaint)}`;
                    if (seen.has(caseKey)) continue;
                    seen.add(caseKey);
                    rows.push(html`
                        <div class="legend-row sub-row">
                            ${swatch}
                            <span class="legend-label">${caseLabel}</span>
                        </div>`);
                }
            } else {
                // Single style: swatch + label inline
                const resolvedColor = colorKey ? String(evalPaint[colorKey] ?? '#aaa') : '#aaa';
                // For symbols also include size + weight in dedup key — country/state/town labels
                // differ visually even when same color
                let dedupKey = `${type}|${resolvedColor}`;
                if (type === 'line') {
                    // Lines with same color but different dasharray (e.g. equator vs.
                    // tropics vs. polar circles) look visually distinct — keep separate
                    const dash = evalPaint['line-dasharray'];
                    dedupKey = `line|${resolvedColor}|${Array.isArray(dash) ? dash.join(',') : String(dash ?? '')}`;
                } else if (type === 'symbol') {
                    const rawSize = evalLayout['text-size'] ?? evalPaint['text-size'];
                    const sz = Math.round(Number(typeof rawSize === 'number' ? rawSize : 12));
                    const fonts = Array.isArray(evalLayout['text-font']) ? (evalLayout['text-font'] as string[]) : [];
                    const fontStr = fonts.join(' ').toLowerCase();
                    const weight = fontStr.includes('bold') || fontStr.includes('black') ? '700'
                        : fontStr.includes('semibold') || fontStr.includes('demibold') || fontStr.includes('medium') ? '600'
                        : '400';
                    const haloW = Math.round(Number(evalPaint['text-halo-width'] ?? 0) * 2) / 2;
                    const haloC = haloW > 0 ? String(evalPaint['text-halo-color'] ?? '') : '';
                    dedupKey = `symbol|${resolvedColor}|${sz}|${weight}|${haloW}|${haloC}`;
                }
                if (seen.has(dedupKey)) continue;
                seen.add(dedupKey);
                const swatch = this.renderSwatch(type, evalPaint, zoom, evalLayout);
                if (!swatch) continue;
                rows.push(html`
                    <div class="legend-row">
                        ${swatch}
                        <span class="legend-label">${label}</span>
                    </div>`);
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
            const c = this.resolveSwatchColor(paint['fill-color'], '#9e9e9e');
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
        if (type === 'raster') {
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

    private renderFillRow(fillColor: string, outlineColor: string, fillOpacity: number, label: string): TemplateResult {
        return html`
            <div class="legend-row">
                ${svg`<svg width="24" height="14" style="flex-shrink:0">
                    <rect x="1" y="1" width="22" height="12"
                        fill="${fillColor}" fill-opacity="${fillOpacity}"
                        stroke="${outlineColor}" stroke-width="1.5" rx="2"/>
                </svg>`}
                ${label !== null ? html`<span class="legend-label">${label}</span>` : ''}
            </div>`;
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

    /** Get attribute translations from layer metadata: name → {label, unit, maxvalue} */
    private getAttrTranslations(): Map<string, {label: string; unit: string; maxvalue?: number}> {
        const attrs = (this.meta as any)?.attributes;
        const map = new Map<string, {label: string; unit: string; maxvalue?: number}>();
        if (!Array.isArray(attrs?.translations)) return map;
        for (const t of attrs.translations) {
            if (typeof t?.name === 'string') {
                map.set(t.name, {
                    label: typeof t.translation === 'string' ? t.translation : t.name,
                    unit: typeof t.unit === 'string' ? t.unit : '',
                    ...(typeof t.maxvalue === 'number' ? { maxvalue: t.maxvalue } : {}),
                });
            }
        }
        return map;
    }

    /** Extract property name from a ["get", "prop"] expression. */
    private getPropName(expr: unknown): string | null {
        return Array.isArray(expr) && expr[0] === 'get' && typeof expr[1] === 'string' ? expr[1] : null;
    }

    /** Extract readable label from a case/comparison condition expression, with unit from attr metadata. */
    private conditionLabel(cond: unknown, attrTr?: Map<string, {label: string; unit: string}>): string | null {
        if (!Array.isArray(cond) || cond.length < 3) return '';
        const op = cond[0];
        const lhsProp = this.getPropName(cond[1]);
        const rhs = cond[2];
        const unit = lhsProp && attrTr?.get(lhsProp)?.unit ? attrTr.get(lhsProp)!.unit : '';
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
    private extractColorClasses(expr: unknown, attrTr?: Map<string, {label: string; unit: string}>): Array<{label: string, color: string}> | null {
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
            if (typeof def === 'string') items.push({ label: 'other', color: def });
            return items.length > 1 ? items : null;
        }
        if (op === 'match') {
            // Detect property name for unit
            const matchProp = this.getPropName(expr[1]);
            const unit = matchProp && attrTr?.get(matchProp)?.unit ? attrTr.get(matchProp)!.unit : '';
            const items: Array<{label: string, color: string}> = [];
            for (let i = 2; i + 1 < expr.length - 1; i += 2) {
                const raw = Array.isArray(expr[i]) ? expr[i].join(', ') : String(expr[i]);
                const label = unit ? `${raw}${unit}` : raw;
                const color = typeof expr[i + 1] === 'string' ? expr[i + 1] : '';
                if (color) items.push({ label, color });
            }
            const def = expr[expr.length - 1];
            if (typeof def === 'string') items.push({ label: 'other', color: def });
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

    private renderLegendItems(layerType: string, paint: Record<string, unknown>): TemplateResult[] {
        const attrTr = this.getAttrTranslations();

        if (layerType === 'circle') {
            const strokeColor = String(paint['circle-stroke-color'] ?? '#aaa');
            const strokeWidth = Number(paint['circle-stroke-width'] ?? 1);
            const colorExpr = paint['circle-color'];
            const radiusExpr = paint['circle-radius'];
            const color = String(Array.isArray(colorExpr) ? (this.evalAtZoom(colorExpr, this.zoom) ?? colorExpr[colorExpr.length-1] ?? '#3388ff') : (colorExpr ?? '#3388ff'));
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
                return colorClasses.map(c => this.renderCircleRow(c.color, strokeColor, strokeWidth, r, c.label));
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
                return classes.map(c => this.renderFillRow(c.color, outlineColor, opacity, c.label));
            }
            // Interpolate/step stops
            const colorStops = this.extractLegendStops(colorExpr);
            return colorStops
                .filter((s, _, arr) => arr.length === 1 || s.value !== null)
                .map(s => this.renderFillRow(String(s.paint ?? '#3388ff'), outlineColor, opacity,
                    s.value !== null ? String(s.value) : ''));
        }

        if (layerType === 'line') {
            const colorStops = this.extractLegendStops(paint['line-color']);
            const widthStops = this.extractLegendStops(paint['line-width']);
            const dasharray = Array.isArray(paint['line-dasharray']) ? (paint['line-dasharray'] as number[]).join(' ') : '';
            return colorStops.map((s, i) => {
                const lineWidth = Number(widthStops[i]?.paint ?? widthStops[0]?.paint ?? 2);
                const label = s.value !== null ? String(s.value) : '';
                return this.renderLineRow(String(s.paint ?? '#3388ff'), lineWidth, dasharray, label);
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

        if (layerType === 'raster' || layerType === 'background') {
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

        // Composite style layer with many sub-layers (e.g. OpenFreeMap)
        if (sublayers && sublayers.length > 1) {
            return this.renderCompositeLegend(sublayers, this.zoom);
        }

        const supportedTypes = ['fill', 'fill-extrusion', 'line', 'circle', 'symbol', 'raster', 'background'];
        const hasSwatch = layerType && supportedTypes.includes(layerType) && !legendUrl;

        return html`
            <div class="legend-wrap">
                ${hasSwatch ? this.renderLegendItems(layerType!, paint) : ''}
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
        `;
    }
}
