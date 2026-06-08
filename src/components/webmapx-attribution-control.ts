import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMap } from '../map/IMapInterfaces';
import type { IMapState } from '../store/IMapState';
import type { AppConfig, AnyLayerConfig, LayerDataConfig, SourceConfig } from '../config/types';
import { renderAttributionText, resolveLayerAttribution } from '../utils/attribution-format';

@customElement('webmapx-attribution-control')
export class WebmapxAttributionControl extends WebmapxBaseTool {
    @state()
    private attributions: string[] = [];

    private layerData: LayerDataConfig | null = null;
    private visibleLayerIds: string[] = [];
    private mapLayersState: Record<string, any> = {};

    connectedCallback(): void {
        super.connectedCallback();
        this.subscribeToConfig();
    }

    protected onMapAttached(_adapter: IMap): void {
        this.subscribeToConfig();
    }

    protected onConfigReady(config: AppConfig): void {
        this.layerData = config.layerData ?? config.catalog ?? null;
        this.recalculate();
    }

    protected onStateChanged(state: IMapState): void {
        const layers = state.mapLayers ?? {};
        const nextLayerIds = Object.keys(layers);
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
            const trimmed = text.trim();
            if (!trimmed || unique.has(trimmed)) return;
            unique.add(trimmed);
            collected.push(trimmed);
        };

        for (const layerId of this.visibleLayerIds) {
            // Dynamic layers (e.g. added at runtime via addLayer) — read from mapLayers state
            const dynamicEntry = this.mapLayersState[layerId];
            if (dynamicEntry && typeof dynamicEntry.attribution === 'string') {
                addText(dynamicEntry.attribution);
                continue;
            }

            const layer = layersById.get(layerId);
            if (!layer) continue;

            const attribution = resolveLayerAttribution(layer, sourcesById);
            if (attribution) {
                addText(attribution);
            }
        }

        this.attributions = collected;
    }

    render() {
        const hasAttributions = this.attributions.length > 0;
        return html`
            <div class="attribution-shell" ?hidden=${!hasAttributions} role="contentinfo" aria-label="Map attributions">
                ${this.attributions.map((attr, index) => html`
                    ${renderAttributionText(attr)}
                    ${index < this.attributions.length - 1 ? html`<span class="separator">•</span>` : null}
                `)}
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
            font-size: 11px;
            color: var(--color-text-secondary, #444);
            box-sizing: border-box;
        }

        .attribution-shell {
            display: inline-flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.35em;
            max-width: 50%;
            width: fit-content;
            flex: 0 1 auto;
            background: rgba(255, 255, 255, 0.85);
            padding: 2px 6px 1px;
            border-radius: 4px 4px 0 0;
            white-space: normal;
            word-break: break-word;
            box-sizing: border-box;
            pointer-events: none;
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
