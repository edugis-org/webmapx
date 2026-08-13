import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMap } from '../map/IMapInterfaces';

const ADAPTER_LABELS: Record<string, string> = {
    maplibre: 'MapLibre GL',
    openlayers: 'OpenLayers',
    leaflet: 'Leaflet',
    cesium: 'Cesium',
};

@customElement('webmapx-active-adapter')
export class WebmapxActiveAdapter extends WebmapxBaseTool {
    @state() private adapterName = '—';
    @state() private engineVersion = '';

    static styles = css`
        :host { display: inline-block; }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: var(--webmapx-space-xs, 0.4rem);
            padding: var(--webmapx-space-xs, 0.2rem) var(--webmapx-space-sm, 0.6rem);
            border: 1px solid var(--color-border, #d5dce3);
            background: var(--color-background-secondary, #f4f6f8);
            color: var(--color-text-primary, #16202a);
            font-size: 0.8rem;
            border-radius: var(--webmapx-radius-xs, 3px);
            white-space: nowrap;
        }
        .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--color-primary, #2b6c8f);
        }
    `;

    protected onStateChanged(): void {}

    protected onMapAttached(adapter: IMap): void {
        this.adapterName = ADAPTER_LABELS[adapter.engineId] ?? adapter.engineId;
        const parts = adapter.engineVersion?.split('.');
        this.engineVersion = parts ? `${parts[0]}.${parts[1]}` : '';
    }

    protected onMapDetached(): void {
        this.adapterName = '—';
        this.engineVersion = '';
    }

    protected render(): TemplateResult {
        return html`
            <span class="badge">
                <span class="dot"></span>
                ${this.adapterName}${this.engineVersion ? ` ${this.engineVersion}` : ''}
            </span>
        `;
    }
}
