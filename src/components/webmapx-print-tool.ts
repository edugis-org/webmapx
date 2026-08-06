// src/components/webmapx-print-tool.ts

import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import { resolveMapElement } from './internal/map-context';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { resolveLayerAttribution, stripTags, decodeEntities } from '../utils/attribution-format';

type PrintFormat = 'portrait' | 'landscape' | 'portrait_with_legend' | 'landscape_with_legend';

// A4 in mm
const A4_SHORT = 210;
const A4_LONG = 297;
// Screen: margin around the print box (px)
const BOX_MARGIN = 40;
// Page margin (mm)
const PAGE_MARGIN_MM = 10;
// Legend column width (mm)
const LEGEND_COL_MM = 50;
// Title row height (mm)
const TITLE_H_MM = 12;
// Footer row height (mm)
const FOOTER_H_MM = 6;
// CSS px per mm (96 dpi)
const PX_PER_MM = 96 / 25.4;

function mm(v: number): number { return v * PX_PER_MM; }
function isLandscape(f: PrintFormat): boolean { return f.startsWith('landscape'); }
function hasLegend(f: PrintFormat): boolean { return f.endsWith('_with_legend'); }

/** Map area dimensions in mm (paper minus margins and legend column). Title/footer excluded — they're optional. */
function mapAreaMM(f: PrintFormat): { w: number; h: number } {
    return {
        w: (isLandscape(f) ? A4_LONG : A4_SHORT) - 2 * PAGE_MARGIN_MM - (hasLegend(f) ? LEGEND_COL_MM : 0),
        h: (isLandscape(f) ? A4_SHORT : A4_LONG) - 2 * PAGE_MARGIN_MM,
    };
}


// ── Component ─────────────────────────────────────────────────────────────────

@customElement('webmapx-print-tool')
export class WebmapxPrintTool extends WebmapxModalTool {

    readonly toolId = 'print';

    @state() private mapTitle = '';
    @state() private format: PrintFormat = 'portrait';
    @state() private addLink = false;
    @state() private printing = false;
    @state() private errorMsg = '';
    @state() private zoomDelta = 0; // log2(printMapW / boxW); non-zero → zoom-dependent layers may differ

    private printBoxEl: HTMLElement | null = null;
    private resizeObserver: ResizeObserver | null = null;

    static styles = css`
        :host { display: block; font-size: var(--sl-font-size-small); }
        .tool-content {
            padding: var(--webmapx-tool-panel-padding, 12px);
            display: flex; flex-direction: column; gap: 12px; min-width: 220px;
        }
        .description { color: var(--color-text-secondary, #5a6773); margin: 0; line-height: 1.4; }
        .field { display: flex; flex-direction: column; gap: 4px; }
        .field label { font-weight: var(--sl-font-weight-semibold); font-size: var(--sl-font-size-small); }
        .error { color: var(--sl-color-danger-600); font-size: var(--sl-font-size-x-small); margin: 0; }
        .warning {
            font-size: var(--sl-font-size-x-small);
            color: var(--sl-color-warning-800, #854d0e);
            background: var(--sl-color-warning-50, #fefce8);
            border: 1px solid var(--sl-color-warning-200, #fef08a);
            border-radius: var(--sl-border-radius-small);
            padding: 6px 8px;
            margin: 0;
            line-height: 1.4;
        }
        .busy { display: flex; align-items: center; gap: 8px; color: var(--color-text-secondary, #5a6773); }
    `;

    // ── Print box overlay ──────────────────────────────────────────────────────

    protected onActivate(): void {
        const mapEl = resolveMapElement(this);
        if (!mapEl) return;

        this.printBoxEl = document.createElement('div');
        this.printBoxEl.className = 'webmapx-print-box';
        Object.assign(this.printBoxEl.style, {
            position: 'absolute',
            boxSizing: 'border-box',
            backgroundImage: [
                'repeating-linear-gradient(90deg, #fff 0, #fff 6px, #000 6px, #000 12px)',
                'repeating-linear-gradient(90deg, #fff 0, #fff 6px, #000 6px, #000 12px)',
                'repeating-linear-gradient(0deg,  #fff 0, #fff 6px, #000 6px, #000 12px)',
                'repeating-linear-gradient(0deg,  #fff 0, #fff 6px, #000 6px, #000 12px)',
            ].join(','),
            backgroundSize: '12px 2px, 12px 2px, 2px 12px, 2px 12px',
            backgroundPosition: '0 0, 0 100%, 0 0, 100% 0',
            backgroundRepeat: 'repeat-x, repeat-x, repeat-y, repeat-y',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
            pointerEvents: 'none',
        });
        // Insert before webmapx-layout so document order puts the box behind all UI overlays
        const layout = mapEl.querySelector('webmapx-layout');
        mapEl.insertBefore(this.printBoxEl, layout ?? mapEl.firstChild);

        this.resizeObserver = new ResizeObserver(() => this.updateBox());
        this.resizeObserver.observe(mapEl);
        this.updateBox();
    }

    protected onDeactivate(): void {
        this.printBoxEl?.remove();
        this.printBoxEl = null;
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
    }

    protected onStateChanged(): void {
        // Zoom changes affect which layers/labels are visible → recalculate warning
        this.updateBox();
    }

    private updateBox(): void {
        const mapEl = resolveMapElement(this);
        if (!this.printBoxEl || !mapEl) return;

        const cW = mapEl.clientWidth;
        const cH = mapEl.clientHeight;
        const availW = cW - 2 * BOX_MARGIN;
        const availH = cH - 2 * BOX_MARGIN;

        // Ideal box = map area at exact paper scale, minus title and footer if set
        const area = mapAreaMM(this.format);
        const idealW = mm(area.w);
        const idealH = mm(area.h)
            - (this.mapTitle.trim() ? mm(TITLE_H_MM) : 0)
            - (this.addLink ? mm(FOOTER_H_MM) : 0);

        let boxW: number, boxH: number;
        if (idealW <= availW && idealH <= availH) {
            // Canvas large enough — box matches paper exactly, no zoom change
            boxW = idealW;
            boxH = idealH;
            this.zoomDelta = 0;
        } else {
            // Canvas too small — scale box down preserving aspect ratio
            const scale = Math.min(availW / idealW, availH / idealH);
            boxW = idealW * scale;
            boxH = idealH * scale;
            // print zoom = screen zoom + log2(idealW / boxW) = screen zoom + log2(1/scale)
            this.zoomDelta = Math.log2(idealW / boxW);
        }

        Object.assign(this.printBoxEl.style, {
            left: `${(cW - boxW) / 2}px`,
            top: `${(cH - boxH) / 2}px`,
            width: `${boxW}px`,
            height: `${boxH}px`,
        });
    }

    // ── Print ──────────────────────────────────────────────────────────────────

    private async handlePrint(): Promise<void> {
        this.printing = true;
        this.errorMsg = '';
        try {
            await this.renderAndPrint();
        } catch (err) {
            this.errorMsg = err instanceof Error ? err.message : 'Print failed';
            console.error('[print-tool]', err);
        } finally {
            this.printing = false;
        }
    }

    private async renderAndPrint(): Promise<void> {
        const adapter = this.adapter;
        if (!adapter) throw new Error('No map adapter available.');

        const mapEl = resolveMapElement(this)!;
        const fmt = this.format;
        const land = isLandscape(fmt);
        const withLeg = hasLegend(fmt);

        // Paper dimensions in CSS px (96 dpi)
        const pageW = mm(land ? A4_LONG : A4_SHORT);
        const pageH = mm(land ? A4_SHORT : A4_LONG);
        const M = mm(PAGE_MARGIN_MM);
        const titleH = this.mapTitle.trim() ? mm(TITLE_H_MM) : 0;
        const footerH = this.addLink ? mm(FOOTER_H_MM) : 0;
        const legW = withLeg ? mm(LEGEND_COL_MM) : 0;
        const area = mapAreaMM(fmt);
        const mapW = mm(area.w);
        const mapH = mm(area.h) - titleH - footerH;

        // Box geometry relative to map element
        const mapRect = mapEl.getBoundingClientRect();
        const boxRect = this.printBoxEl!.getBoundingClientRect();
        const boxLeft = boxRect.left - mapRect.left;
        const boxTop  = boxRect.top  - mapRect.top;
        const boxW    = boxRect.width;

        // ── Build print overlay ──────────────────────────────────────────────
        // For MapLibre: white background, contains a new map instance.
        // For other engines: transparent background (existing map element shows through via CSS transform).
        const isMapLibre = adapter.engineId === 'maplibre';

        const overlay = document.createElement('div');
        overlay.id = 'webmapx-print-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '-99999px', left: '0',
            width: pageW + 'px',
            height: pageH + 'px',
            background: isMapLibre ? 'white' : 'transparent',
            display: 'flex',
            flexDirection: 'column',
            padding: M + 'px',
            boxSizing: 'border-box',
            fontFamily: 'sans-serif',
        });

        if (titleH) {
            const titleEl = document.createElement('div');
            titleEl.textContent = this.mapTitle.trim();
            Object.assign(titleEl.style, {
                height: titleH + 'px',
                lineHeight: titleH + 'px',
                fontSize: '16px',
                fontWeight: 'bold',
                flexShrink: '0',
                background: 'white',
            });
            overlay.appendChild(titleEl);
        }

        const legendEls: HTMLElement[] = [];

        // Map + legend row
        const row = document.createElement('div');
        Object.assign(row.style, {
            display: 'flex',
            gap: withLeg ? '8px' : '0',
            height: mapH + 'px',
            flexShrink: '0',
        });

        // MapLibre: render new map instance in this container.
        // Other engines: transparent placeholder — the existing map element fills this space via CSS.
        const mapContainer = document.createElement('div');
        Object.assign(mapContainer.style, {
            width: mapW + 'px',
            height: mapH + 'px',
            flexShrink: '0',
            overflow: 'hidden',
            background: 'transparent',
        });
        row.appendChild(mapContainer);

        if (withLeg) {
            const legContainer = document.createElement('div');
            Object.assign(legContainer.style, {
                width: (legW - 8) + 'px',
                height: mapH + 'px',
                flexShrink: '0',
                overflow: 'hidden',
                paddingLeft: '6px',
                borderLeft: '1px solid #ddd',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                background: 'white',
            });

            const legHeader = document.createElement('div');
            legHeader.textContent = 'Legend';
            Object.assign(legHeader.style, {
                fontWeight: '600',
                fontSize: '8px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#555',
                marginBottom: '4px',
                flexShrink: '0',
            });
            legContainer.appendChild(legHeader);

            const mapLayers = this.store?.getState()?.mapLayers ?? {};
            for (const [layerId, entry] of Object.entries(mapLayers).reverse()) {
                if (entry.hideFromLegend === true) continue;
                if (entry.legendExpandMode === 'collapsed') continue;
                if (entry.visible === false) continue;

                const label = typeof entry.label === 'string' && entry.label ? entry.label : layerId;
                const labelEl = document.createElement('div');
                labelEl.textContent = label;
                Object.assign(labelEl.style, {
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#111827',
                    marginTop: '4px',
                    marginBottom: '1px',
                    flexShrink: '0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                });
                legContainer.appendChild(labelEl);

                const legEl = document.createElement('webmapx-layer-legend') as HTMLElement;
                legEl.setAttribute('layer-id', layerId);
                (legEl as HTMLElement & { collapsible?: boolean }).collapsible = false;
                Object.assign(legEl.style, { display: 'block', marginBottom: '6px', flexShrink: '0' });
                legContainer.appendChild(legEl);
                legendEls.push(legEl);
            }

            row.appendChild(legContainer);
        }

        overlay.appendChild(row);

        const attrText = this.buildAttributionText();
        if (attrText) {
            const attrEl = document.createElement('div');
            attrEl.textContent = attrText;
            Object.assign(attrEl.style, {
                flexShrink: '0',
                textAlign: 'left',
                fontSize: '7px',
                lineHeight: '1.4',
                color: '#444',
                fontFamily: 'sans-serif',
                paddingTop: '3px',
            });
            overlay.appendChild(attrEl);
        }

        if (footerH) {
            const footerEl = document.createElement('div');
            const a = document.createElement('a');
            a.href = window.location.href;
            a.textContent = window.location.href;
            footerEl.appendChild(a);
            Object.assign(footerEl.style, {
                height: footerH + 'px',
                lineHeight: footerH + 'px',
                fontSize: '9px',
                flexShrink: '0',
                background: 'white',
            });
            overlay.appendChild(footerEl);
        }

        // Attribution in the bottom page margin — built directly from config/store
        // because webmapx-attribution-control relies on closest('webmapx-map') for
        // config access, which fails when the element is outside the map element.
        document.body.appendChild(overlay);

        // Wait for legend elements to render after DOM connection (two cycles:
        // first connects to map, second renders after state arrives).
        if (legendEls.length > 0) {
            await Promise.all(legendEls.map(el => (el as any).updateComplete ?? Promise.resolve()));
            await Promise.all(legendEls.map(el => (el as any).updateComplete ?? Promise.resolve()));
            // Also wait for any legendGraphic <img> elements to load — updateComplete
            // resolves after Lit's render cycle but before async image loads complete.
            await Promise.all(legendEls.map(el => {
                const root = (el as HTMLElement).shadowRoot ?? el;
                const imgs = Array.from(root.querySelectorAll('img'));
                return Promise.all(imgs.map(img =>
                    img.complete
                        ? Promise.resolve()
                        : new Promise<void>(resolve => { img.onload = () => resolve(); img.onerror = () => resolve(); })
                ));
            }));
        }

        // ── Engine-specific map rendering ────────────────────────────────────
        let extraCleanup: () => void = () => {};
        let mapPrintCSS: string;

        if (isMapLibre) {
            // Create a new MapLibre map at print resolution in the mapContainer
            const nativeMap = (adapter as any).core?.mapInstance;
            if (!nativeMap) throw new Error('MapLibre map not initialised.');

            const geoCenter = nativeMap.unproject([boxLeft + boxW / 2, boxTop + boxRect.height / 2]);
            const printZoom = nativeMap.getZoom() + Math.log2(mapW / boxW);

            const { default: maplibregl } = await import('maplibre-gl');
            const printMap = new maplibregl.Map({
                container: mapContainer,
                style: nativeMap.getStyle(),
                center: geoCenter,
                zoom: printZoom,
                bearing: nativeMap.getBearing(),
                pitch: nativeMap.getPitch(),
                interactive: false,
                attributionControl: false,
            });

            await new Promise<void>((resolve, reject) => {
                const t = setTimeout(() => reject(new Error('Map render timed out (30 s)')), 30_000);
                printMap.once('idle', () => { clearTimeout(t); resolve(); });
            });

            extraCleanup = () => printMap.remove();
            mapPrintCSS = `
  body > * { display: none !important; }
  #webmapx-print-overlay { display: flex !important; position: fixed !important; top: 0 !important; left: 0 !important; }
  #${mapEl.id} > .webmapx-print-box { display: none !important; }`;

        } else {
            // CSS-transform the existing map element into the map area of the page.
            // transform: translate to dest, scale, translate from src origin.
            const s = mapW / boxW;
            const destX = M;
            const destY = M + titleH;
            const elW = mapRect.width;
            const elH = mapRect.height;

            // Use visibility:hidden (not display:none) on body children so that
            // descendants can override with visibility:visible. display:none on a
            // parent removes descendants from the render tree entirely and cannot
            // be overridden by children, even with !important.
            // clip-path clips the element to exactly the box area in element-local
            // coordinates (before the transform). The transform then moves+scales
            // that clipped region into the page's map area. This prevents map
            // content outside the box from bleeding onto the page.
            const clipTop    = boxTop;
            const clipRight  = elW - boxLeft - boxW;
            const clipBottom = elH - boxTop - boxRect.height;
            const clipLeft   = boxLeft;

            mapPrintCSS = `
  body > * { visibility: hidden !important; }
  #${mapEl.id} {
    visibility: visible !important;
    position: fixed !important; top: 0 !important; left: 0 !important;
    width: ${elW}px !important; height: ${elH}px !important;
    transform-origin: 0 0 !important;
    transform: translate(${destX}px,${destY}px) scale(${s}) translate(${-boxLeft}px,${-boxTop}px) !important;
    clip-path: inset(${clipTop}px ${clipRight}px ${clipBottom}px ${clipLeft}px) !important;
  }
  #${mapEl.id} * { visibility: visible !important; }
  #${mapEl.id} > .webmapx-print-box { display: none !important; }
  webmapx-layout { display: none !important; }
  #webmapx-print-overlay { display: flex !important; visibility: visible !important; position: fixed !important; top: 0 !important; left: 0 !important; background: transparent !important; }
  #webmapx-print-overlay * { visibility: visible !important; }`;
        }

        // ── Inject print CSS and trigger print ───────────────────────────────
        const style = document.createElement('style');
        style.id = 'webmapx-print-style';
        style.textContent = `
@media print {
  @page { size: A4 ${land ? 'landscape' : 'portrait'}; margin: 0; }
  html, body { margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: white !important; }
  ${mapPrintCSS}
}`;
        document.head.appendChild(style);

        const cleanup = () => {
            style.remove();
            extraCleanup();
            overlay.remove();
        };

        window.addEventListener('afterprint', cleanup, { once: true });
        requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
    }

    private buildAttributionText(): string {
        const ld = this.layerDataConfig;
        const mapLayers = this.store?.getState()?.mapLayers ?? {};

        const sourcesById = new Map<string, any>();
        const layersById = new Map<string, any>();
        if (ld) {
            for (const src of (ld as any).sources ?? []) sourcesById.set(src.id, src);
            for (const lyr of (ld as any).layers ?? []) layersById.set(lyr.id, lyr);
        }

        const seen = new Set<string>();
        const parts: string[] = [];
        const add = (raw: string | undefined) => {
            if (!raw) return;
            for (const part of raw.split('|')) {
                const text = decodeEntities(stripTags(part)).trim();
                if (text && !seen.has(text)) { seen.add(text); parts.push(text); }
            }
        };

        for (const [layerId, entry] of Object.entries(mapLayers)) {
            if (entry.visible === false) continue;
            const catalogLayer = layersById.get(layerId);
            if (catalogLayer) {
                add(resolveLayerAttribution(catalogLayer, sourcesById));
            } else {
                // Runtime layer — read from engine source
                const sourceId = typeof entry.sourceId === 'string' ? entry.sourceId : null;
                if (sourceId) add(this.adapter?.getSourceAttribution?.(sourceId));
            }
        }
        return parts.join(' • ');
    }

    // ── Render ────────────────────────────────────────────────────────────────

    protected render() {
        return html`
            <div class="tool-content">
                <p class="description">Position the map inside the box, then click Print to save as PDF.</p>
                <div class="field">
                    <label for="print-title">Title</label>
                    <sl-input id="print-title" size="small" placeholder="Map title"
                        .value=${this.mapTitle}
                        @sl-input=${(e: Event) => { this.mapTitle = (e.target as HTMLInputElement).value; this.updateBox(); }}
                    ></sl-input>
                </div>
                <div class="field">
                    <label for="print-format">Format</label>
                    <sl-select id="print-format" size="small" .value=${this.format}
                        @sl-change=${(e: Event) => {
                            this.format = (e.target as HTMLSelectElement).value as PrintFormat;
                            this.updateBox();
                        }}
                    >
                        <sl-option value="portrait">Portrait</sl-option>
                        <sl-option value="landscape">Landscape</sl-option>
                        <sl-option value="portrait_with_legend">Portrait with legend</sl-option>
                        <sl-option value="landscape_with_legend">Landscape with legend</sl-option>
                    </sl-select>
                </div>
                <sl-checkbox size="small"
                    ?checked=${this.addLink}
                    @sl-change=${(e: Event) => { this.addLink = (e.target as HTMLInputElement).checked; this.updateBox(); }}
                >Add viewer link</sl-checkbox>
                ${Math.abs(this.zoomDelta) > 0.05 ? html`
                    <p class="warning">
                        <strong>Note:</strong> The print zoom differs from the screen zoom
                        (${this.zoomDelta > 0 ? '+' : ''}${this.zoomDelta.toFixed(1)} levels).
                        Labels and zoom-dependent layers may look different in the print.
                    </p>` : ''}
                ${this.printing
                    ? html`<div class="busy"><sl-spinner></sl-spinner> Rendering map…</div>`
                    : html`<sl-button variant="primary" size="small" @click=${this.handlePrint}>Print</sl-button>`
                }
                ${this.errorMsg ? html`<p class="error">${this.errorMsg}</p>` : ''}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap { 'webmapx-print-tool': WebmapxPrintTool; }
}
