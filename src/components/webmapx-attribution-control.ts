import { css, html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMap } from '../map/IMapInterfaces';
import type { IMapState } from '../store/IMapState';
import type { AppConfig, AnyLayerConfig, CompositeStyleLayerConfig, LayerDataConfig, SourceConfig } from '../config/types';

const URL_REGEX = /(https?:\/\/[^\s<"]+)/g;
const HREF_REGEX = /<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

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

    private stripTags(text: string): string {
        return text.replace(/<[^>]+>/g, '');
    }

    private decodeEntities(text: string): string {
        return text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&copy;/g, '©')
            .replace(/&reg;/g, '®')
            .replace(/&trade;/g, '™')
            .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
            .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
    }

    private targetForUrl(href: string): string {
        try {
            const { hostname } = new URL(href);
            return `_attr_${hostname.replace(/[^a-z0-9]/gi, '_')}`;
        } catch {
            return '_attr_link';
        }
    }

    private renderAttribution(text: string): TemplateResult {
        type Segment = string | { href: string; label: string };
        const segments: Segment[] = [];
        let lastIndex = 0;

        // First pass: extract <a href="...">label</a> tags
        const processed = text;
        HREF_REGEX.lastIndex = 0;
        for (const match of processed.matchAll(HREF_REGEX)) {
            const index = match.index ?? 0;
            if (index > lastIndex) {
                segments.push(this.stripTags(this.decodeEntities(text.slice(lastIndex, index))));
            }
            segments.push({ href: match[1], label: this.stripTags(this.decodeEntities(match[2])) });
            lastIndex = index + match[0].length;
        }
        const remaining = text.slice(lastIndex);

        // Second pass: extract bare URLs from remaining plain text
        URL_REGEX.lastIndex = 0;
        let urlLastIndex = 0;
        for (const match of remaining.matchAll(URL_REGEX)) {
            const index = match.index ?? 0;
            if (index > urlLastIndex) {
                segments.push(this.stripTags(this.decodeEntities(remaining.slice(urlLastIndex, index))));
            }
            let label = match[0];
            try { label = new URL(match[0]).hostname.replace(/^www\./, ''); } catch { /* keep full url */ }
            segments.push({ href: match[0], label });
            urlLastIndex = index + match[0].length;
        }
        if (urlLastIndex < remaining.length) {
            segments.push(this.stripTags(this.decodeEntities(remaining.slice(urlLastIndex))));
        }

        return html`<span class="attribution-item">
            ${segments.map((segment) =>
                typeof segment === 'string'
                    ? html`${segment}`
                    : html`<a href=${segment.href} target=${this.targetForUrl(segment.href)}>${segment.label}</a>`
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
