import { css, html, svg, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';

@customElement('webmapx-layer-legend')
export class WebmapxLayerLegend extends WebmapxBaseTool {
    @property({ type: String, attribute: 'layer-id' })
    layerId = '';

    @state() private meta: Record<string, unknown> | null = null;

    static styles = css`
        :host { display: block; }
        .legend-wrap { display: flex; flex-direction: column; gap: 2px; }
        .legend-row { display: flex; align-items: center; gap: 6px; min-height: 18px; }
        .legend-label { font-size: 0.75rem; color: var(--color-text-primary, #1f2937); line-height: 1.2; }
        .legend-img { max-width: 100%; max-height: 80px; display: block; border-radius: 3px; }
        .img-error { font-size: 0.75rem; color: var(--sl-color-danger-600, #c0392b); font-style: italic; }
    `;

    protected onStateChanged(state: IMapState): void {
        const entry = (state.mapLayers ?? {})[this.layerId] as Record<string, unknown> | undefined;
        this.meta = entry ?? null;
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
        const MAX_R = 20;
        const maxR = Math.max(...stops.map(s => s.radius));
        const scale = maxR > 0 ? MAX_R / maxR : 1;
        const cx = MAX_R + sw + 2;
        const bubbleW = cx * 2;
        const svgH = MAX_R * 2 + sw * 2 + 4;
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

        return html`
            <div class="legend-row" style="flex-direction:column;align-items:flex-start;gap:6px">
                ${svg`<svg width="${svgW}" height="${svgH}" style="overflow:visible">
                    <line x1="${cx}" y1="${baseline}" x2="${cx}" y2="2" stroke="#bbb" stroke-width="1"/>
                    ${circles}
                </svg>`}
                ${svg`<svg width="${totalSwatchW}" height="${swatchH + 12}" style="overflow:visible">
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

    private renderLegendItems(layerType: string, paint: Record<string, unknown>): TemplateResult[] {
        if (layerType === 'circle') {
            const colorStops = this.extractLegendStops(paint['circle-color']);
            const radiusStops = this.extractLegendStops(paint['circle-radius']);
            const strokeColor = String(paint['circle-stroke-color'] ?? '#aaa');
            const strokeWidth = Number(paint['circle-stroke-width'] ?? 1);

            // Deduplicate and get unique stops with non-null values
            const stops: Array<{value: string, color: string, radius: number}> = [];
            const count = Math.max(colorStops.length, radiusStops.length);
            let prevKey = '';
            for (let i = 0; i < count; i++) {
                const color = String(colorStops[i]?.paint ?? colorStops[0]?.paint ?? '#3388ff');
                const radiusRaw = Math.min(Number(radiusStops[i]?.paint ?? radiusStops[0]?.paint ?? 6), 50);
                const key = `${color}|${radiusRaw}`;
                if (key === prevKey) continue;
                prevKey = key;
                const labelVal = colorStops[i]?.value ?? radiusStops[i]?.value ?? null;
                stops.push({ value: labelVal !== null ? String(labelVal) : '', color, radius: radiusRaw });
            }

            // If both color and radius vary with >1 unique stops — use bubble legend
            if (stops.length > 1 && radiusStops.length > 1) {
                return [this.renderBubbleLegend(stops, strokeColor, strokeWidth)];
            }

            // Simple rows for single-stop or radius-only variation
            return stops.map(s => this.renderCircleRow(s.color, strokeColor, strokeWidth, s.radius, s.value));
        }

        if (layerType === 'fill') {
            const colorStops = this.extractLegendStops(paint['fill-color']);
            const opacity = Number(paint['fill-opacity'] ?? 0.7);
            const outlineColor = String(paint['fill-outline-color'] ?? paint['fill-color'] ?? '#aaa');
            return colorStops
                .filter((s, _, arr) => arr.length === 1 || s.value !== null)
                .map(s => this.renderFillRow(String(s.paint ?? '#3388ff'), outlineColor, opacity, s.value !== null ? String(s.value) : ''));
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
        const supportedTypes = ['fill', 'line', 'circle', 'symbol', 'raster', 'background'];
        const hasSwatch = layerType && supportedTypes.includes(layerType);

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
