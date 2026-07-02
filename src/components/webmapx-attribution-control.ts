import { css, html } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMap } from '../map/IMapInterfaces';
import type { IMapState } from '../store/IMapState';
import type { AppConfig, AnyLayerConfig, LayerDataConfig, SourceConfig } from '../config/types';
import { renderAttributionText, resolveLayerAttribution } from '../utils/attribution-format';

@customElement('webmapx-attribution-control')
export class WebmapxAttributionControl extends WebmapxBaseTool {
    @state() private attributions: string[] = [];
    @state() private _showLeft = false;
    @state() private _showRight = false;

    @query('.attribution-scroll') private _scrollEl?: HTMLElement;

    private layerData: LayerDataConfig | null = null;
    private visibleLayerIds: string[] = [];
    private mapLayersState: Record<string, any> = {};

    private _dragStartX = 0;
    private _dragStartScroll = 0;
    private _dragging = false;
    private _resizeObserver?: ResizeObserver;

    connectedCallback(): void {
        super.connectedCallback();
        this._applyPositionAlignment();
        this.subscribeToConfig();
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this._resizeObserver?.disconnect();
    }

    protected onMapAttached(_adapter: IMap): void {
        this.subscribeToConfig();
    }

    protected onConfigReady(config: AppConfig): void {
        this.layerData = config.layerData ?? config.catalog ?? null;
        this._applyPositionAlignment();
        this.recalculate();
    }

    private _applyPositionAlignment(): void {
        const slot = this.getAttribute('slot') ?? '';
        if (slot.includes('-left')) {
            this.style.justifyContent = 'flex-start';
        } else if (slot.includes('-center')) {
            this.style.justifyContent = 'center';
        } else {
            this.style.justifyContent = 'flex-end';
        }
    }

    protected onStateChanged(state: IMapState): void {
        const layers = state.mapLayers ?? {};
        const nextLayerIds = Object.keys(layers).filter(id => layers[id]?.visible !== false);
        const joinedCurrent = this.visibleLayerIds.join(',');
        const joinedNext = nextLayerIds.join(',');
        if (joinedCurrent !== joinedNext) {
            this.visibleLayerIds = nextLayerIds;
            this.mapLayersState = layers;
            this.recalculate();
        }
    }

    protected onMapDetached(): void {
        this.attributions = [];
        this.visibleLayerIds = [];
        this.mapLayersState = {};
        this.layerData = null;
        super.onMapDetached();
    }

    private recalculate(): void {
        const sourcesById = new Map<string, SourceConfig>();
        const layersById = new Map<string, AnyLayerConfig>();

        if (this.layerData) {
            for (const source of this.layerData.sources ?? []) {
                sourcesById.set(source.id, source);
            }
            for (const layer of this.layerData.layers ?? []) {
                layersById.set(layer.id, layer);
            }
        }

        const unique = new Set<string>();
        const collected: string[] = [];

        const addText = (text: string) => {
            for (const part of text.split('|')) {
                const trimmed = part.trim();
                if (!trimmed || unique.has(trimmed)) continue;
                unique.add(trimmed);
                collected.push(trimmed);
            }
        };

        for (const layerId of this.visibleLayerIds) {
            const dynamicEntry = this.mapLayersState[layerId];
            const layer = layersById.get(layerId);

            if (!layer) {
                // Runtime-added layer (e.g. search persist) — attribution lives on its source.
                const sourceId = typeof dynamicEntry?.sourceId === 'string' ? dynamicEntry.sourceId : null;
                const attribution = sourceId ? this.adapter?.getSourceAttribution(sourceId) : undefined;
                if (attribution) addText(attribution);
                continue;
            }

            const attribution = resolveLayerAttribution(layer, sourcesById);
            if (attribution) {
                addText(attribution);
            }
        }

        this.attributions = collected;
        // Recalculate overflow after next render
        this.updateComplete.then(() => this._updateOverflow());
    }

    private _updateOverflow(): void {
        const el = this._scrollEl;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        this._showLeft = el.scrollLeft > 1;
        this._showRight = el.scrollLeft < maxScroll - 1;
    }

    protected firstUpdated(): void {
        const el = this._scrollEl;
        if (!el) return;

        this._resizeObserver = new ResizeObserver(() => this._updateOverflow());
        this._resizeObserver.observe(el);

        el.addEventListener('scroll', () => this._updateOverflow(), { passive: true });

        // Pointer drag (mouse)
        el.addEventListener('pointerdown', (e: PointerEvent) => {
            if (e.button !== 0) return;
            this._dragging = true;
            this._dragStartX = e.clientX;
            this._dragStartScroll = el.scrollLeft;
            el.setPointerCapture(e.pointerId);
            el.style.cursor = 'grabbing';
        });
        el.addEventListener('pointermove', (e: PointerEvent) => {
            if (!this._dragging) return;
            el.scrollLeft = this._dragStartScroll - (e.clientX - this._dragStartX);
        });
        const endDrag = () => {
            this._dragging = false;
            el.style.cursor = '';
        };
        el.addEventListener('pointerup', endDrag);
        el.addEventListener('pointercancel', endDrag);

        // Touch drag
        el.addEventListener('touchstart', (e: TouchEvent) => {
            this._dragStartX = e.touches[0].clientX;
            this._dragStartScroll = el.scrollLeft;
        }, { passive: true });
        el.addEventListener('touchmove', (e: TouchEvent) => {
            el.scrollLeft = this._dragStartScroll - (e.touches[0].clientX - this._dragStartX);
        }, { passive: true });
    }

    render() {
        const hasAttributions = this.attributions.length > 0;
        return html`
            <div class="attribution-shell" ?hidden=${!hasAttributions} role="region" aria-label="Map attributions">
                ${this._showLeft ? html`<span class="overflow-indicator left" aria-hidden="true">‹</span>` : null}
                <div class="attribution-scroll">
                    <div class="attribution-inner">
                        ${this.attributions.map((attr, index) => html`
                            ${renderAttributionText(attr)}
                            ${index < this.attributions.length - 1 ? html`<span class="separator">•</span>` : null}
                        `)}
                    </div>
                </div>
                ${this._showRight ? html`<span class="overflow-indicator right" aria-hidden="true">›</span>` : null}
            </div>
        `;
    }

    static styles = css`
        :host {
            display: flex;
            justify-content: flex-end;
            width: 100%;
            --webmapx-pointer-events: none;
            pointer-events: none;
            font-size: var(--webmapx-font-size-sm, 11px);
            color: var(--color-text-secondary, #444);
            box-sizing: border-box;
        }

        .attribution-shell {
            display: inline-flex;
            align-items: center;
            max-width: 80%;
            flex: 0 1 auto;
            background: rgba(255, 255, 255, 0.85);
            border-radius: var(--webmapx-radius-sm, 4px) var(--webmapx-radius-sm, 4px) 0 0;
            box-sizing: border-box;
            pointer-events: none;
            overflow: hidden;
        }

        .attribution-scroll {
            overflow: hidden;
            flex: 1 1 auto;
            min-width: 0;
            padding: 2px 6px 1px;
            cursor: grab;
            pointer-events: auto;
            user-select: none;
            -webkit-user-select: none;
        }

        .attribution-inner {
            display: inline-flex;
            align-items: center;
            gap: 0.35em;
            white-space: nowrap;
        }

        .overflow-indicator {
            flex: 0 0 auto;
            padding: 2px 4px 1px;
            font-size: var(--webmapx-font-size-md, 14px);
            line-height: 1;
            opacity: 0.6;
            pointer-events: none;
            user-select: none;
        }

        .attribution-item {
            pointer-events: auto;
        }

        .attribution-item a {
            color: inherit;
            text-decoration: none;
            pointer-events: auto;
        }

        .attribution-item a:hover {
            text-decoration: underline;
        }

        .separator {
            opacity: 0.6;
        }

        [hidden] {
            display: none !important;
        }
    `;
}
