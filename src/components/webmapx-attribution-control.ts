import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMap } from '../map/IMapInterfaces';
import type { IMapState } from '../store/IMapState';
import type { AppConfig, AnyLayerConfig, CompositeStyleLayerConfig, LayerDataConfig, SourceConfig } from '../config/types';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

@customElement('webmapx-attribution-control')
export class WebmapxAttributionControl extends WebmapxBaseTool {
    @state()
    private attributions: string[] = [];

    private layerData: LayerDataConfig | null = null;
    private visibleLayerIds: string[] = [];

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
        if (!Array.isArray(state.visibleLayers)) return;
        const joinedCurrent = this.visibleLayerIds.join(',');
        const joinedNext = state.visibleLayers.join(',');
        if (joinedCurrent !== joinedNext) {
            this.visibleLayerIds = [...state.visibleLayers];
            this.recalculate();
        }
    }

    protected onMapDetached(): void {
        this.attributions = [];
        this.visibleLayerIds = [];
        this.layerData = null;
        super.onMapDetached();
    }

    private recalculate(): void {
        if (!this.layerData) {
            this.attributions = [];
            return;
        }

        const sourcesById = new Map<string, SourceConfig>();
        for (const source of this.layerData.sources ?? []) {
            sourcesById.set(source.id, source);
        }

        const layersById = new Map<string, AnyLayerConfig>();
        for (const layer of this.layerData.layers ?? []) {
            layersById.set(layer.id, layer);
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
            const layer = layersById.get(layerId);
            if (!layer) continue;

            // Layer-level attribution (e.g. style layers with remote URL)
            if (typeof layer.attribution === 'string') {
                addText(layer.attribution);
                continue;
            }

            // Source-level attribution from sub-layers
            const subLayers = layer.type === 'style'
                ? ((layer as CompositeStyleLayerConfig).layers ?? [])
                : [layer];
            for (const sub of subLayers) {
                const sourceId = (sub as any).source;
                if (!sourceId) continue;
                const source = sourcesById.get(sourceId);
                if (!source || typeof source.attribution !== 'string') continue;
                addText(source.attribution);
            }
        }

        this.attributions = collected;
    }

    private renderAttribution(text: string) {
        const segments: Array<string | { href: string }> = [];
        let lastIndex = 0;

        for (const match of text.matchAll(URL_REGEX)) {
            const index = match.index ?? 0;
            const href = match[0];
            if (index > lastIndex) {
                segments.push(text.slice(lastIndex, index));
            }
            segments.push({ href });
            lastIndex = index + href.length;
        }

        if (lastIndex < text.length) {
            segments.push(text.slice(lastIndex));
        }

        return html`<span class="attribution-item">
            ${segments.map((segment) =>
                typeof segment === 'string'
                    ? html`${segment}`
                    : html`<a href=${segment.href} target="_attributioninfo" rel="noopener noreferrer">${segment.href}</a>`
            )}
        </span>`;
    }

    render() {
        const hasAttributions = this.attributions.length > 0;
        return html`
            <div class="attribution-shell" ?hidden=${!hasAttributions} role="contentinfo" aria-label="Map attributions">
                ${this.attributions.map((attr, index) => html`
                    ${this.renderAttribution(attr)}
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
            text-decoration: underline;
            pointer-events: auto;
        }

        .separator {
            opacity: 0.6;
        }

        [hidden] {
            display: none !important;
        }
    `;
}
