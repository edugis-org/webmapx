import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IAppState } from '../../store/IState';
import type { AppConfig, CatalogConfig, LayerConfig, SourceConfig } from '../../config/types';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

@customElement('webmapx-attribution-control')
export class WebmapxAttributionControl extends WebmapxBaseTool {
    @state()
    private attributions: string[] = [];

    private catalog: CatalogConfig | null = null;
    private visibleLayerIds: string[] = [];

    connectedCallback(): void {
        super.connectedCallback();
        this.subscribeToConfig();
    }

    protected onConfigReady(config: AppConfig): void {
        this.catalog = config.catalog ?? null;
        this.recalculate();
    }

    protected onStateChanged(state: IAppState): void {
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
        this.catalog = null;
        super.onMapDetached();
    }

    private recalculate(): void {
        if (!this.catalog) {
            this.attributions = [];
            return;
        }

        const sourcesById = new Map<string, SourceConfig>();
        for (const source of this.catalog.sources ?? []) {
            sourcesById.set(source.id, source);
        }

        const layersById = new Map<string, LayerConfig>();
        for (const layer of this.catalog.layers ?? []) {
            layersById.set(layer.id, layer);
        }

        const unique = new Set<string>();
        const collected: string[] = [];

        for (const layerId of this.visibleLayerIds) {
            const layer = layersById.get(layerId);
            if (!layer) continue;
            for (const style of layer.layerset) {
                const source = sourcesById.get(style.source);
                if (!source || typeof source.attribution !== 'string') continue;
                const text = source.attribution.trim();
                if (!text || unique.has(text)) continue;
                unique.add(text);
                collected.push(text);
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
            pointer-events: auto;
            font-size: 12px;
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
            padding: 6px 8px;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
            white-space: normal;
            word-break: break-word;
            box-sizing: border-box;
        }

        .attribution-item a {
            color: inherit;
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
