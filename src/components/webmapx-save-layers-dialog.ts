import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import type SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import type SlInput from '@shoelace-style/shoelace/dist/components/input/input.js';
import type { IMap } from '../map/IMapInterfaces';

export interface SaveLayerCandidate {
    layerId: string;
    label: string;
    sourceId?: string;
    layerType?: string;
    paint?: Record<string, unknown>;
    sublayers?: unknown[];
    sourceData?: GeoJSON.FeatureCollection | string;
}

interface SaveLayerItem extends SaveLayerCandidate {
    checked: boolean;
    data: GeoJSON.FeatureCollection | string | null;
}

@customElement('webmapx-save-layers-dialog')
export class WebmapxSaveLayersDialog extends LitElement {

    @state() private items: SaveLayerItem[] = [];
    @state() private filename = 'map-layers';
    @state() private includeStyle = true;
    @state() private zip = true;

    @query('sl-dialog') private dialog!: SlDialog;
    @query('.filename-input') private filenameInput!: SlInput;

    static styles = css`
        :host { display: block; }

        sl-dialog::part(panel) {
            min-width: min(420px, 90vw);
            max-width: min(520px, 90vw);
        }

        .layer-list {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            max-height: 40vh;
            overflow-y: auto;
            margin-bottom: 0.75rem;
        }

        .layer-row sl-checkbox::part(label) {
            display: flex;
            align-items: center;
            gap: 0.4rem;
        }

        .unsupported {
            color: var(--sl-color-neutral-400);
            font-size: 0.8rem;
        }

        .options {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-top: 0.75rem;
        }

        .footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
            margin-top: 1rem;
        }
    `;

    open(candidates: SaveLayerCandidate[], adapter: IMap | null): void {
        this.items = candidates.map((candidate) => {
            const data = candidate.sourceData
                ?? (candidate.sourceId ? adapter?.getSourceData(candidate.sourceId) ?? null : null);
            return { ...candidate, data, checked: data !== null };
        });
        this.filename = 'map-layers';
        this.includeStyle = true;
        this.zip = true;
        this.dialog?.show();
    }

    close(): void {
        this.dialog?.hide();
    }

    private get selectedItems(): SaveLayerItem[] {
        return this.items.filter((item) => item.checked && item.data !== null);
    }

    /** True when a single-file (unzipped) GeoJSON download is offered: exactly one
     *  selected layer, with style not requested. The zip checkbox then lets the
     *  user choose between that raw .geojson file and a .zip containing it. */
    private get singleFileEligible(): boolean {
        return this.selectedItems.length === 1 && !this.includeStyle;
    }

    private toggleItem(layerId: string, checked: boolean): void {
        this.items = this.items.map((item) => item.layerId === layerId ? { ...item, checked } : item);
    }

    private buildStyleConfig(selected: SaveLayerItem[]): Record<string, unknown> {
        const sources: Record<string, unknown> = {};
        const layers: unknown[] = [];

        for (const item of selected) {
            const sourceName = item.layerId;
            sources[sourceName] = { type: 'geojson', data: `${item.layerId}.geojson` };

            if (Array.isArray(item.sublayers) && item.sublayers.length > 0) {
                item.sublayers.forEach((sub, index) => {
                    const subLayer = sub as Record<string, unknown>;
                    // Keep the sublayer's own id as-is — dropped-layer-builder prefixes
                    // it with the imported style's id on load, so prefixing here too
                    // would double up (e.g. "world-countries__world-countries_world-countries-fill").
                    layers.push({
                        ...subLayer,
                        id: (subLayer.id as string) ?? `${item.layerId}_${index}`,
                        source: sourceName,
                    });
                });
            } else {
                layers.push({
                    id: item.layerId,
                    type: item.layerType ?? 'fill',
                    source: sourceName,
                    ...(item.paint ? { paint: item.paint } : {}),
                });
            }
        }

        return { version: 8, sources, layers };
    }

    private async handleDownload(): Promise<void> {
        const selected = this.selectedItems;
        if (selected.length === 0) return;
        const filename = (this.filenameInput?.value ?? this.filename).trim() || 'map-layers';

        if (this.singleFileEligible && !this.zip) {
            const item = selected[0];
            const content = typeof item.data === 'string' ? item.data : JSON.stringify(item.data, null, 2);
            this.downloadBlob(new Blob([content], { type: 'application/geo+json' }), `${filename}.geojson`);
            this.close();
            return;
        }

        const zipWriter = new ZipWriter(new BlobWriter('application/zip'));
        for (const item of selected) {
            const content = typeof item.data === 'string' ? item.data : JSON.stringify(item.data, null, 2);
            await zipWriter.add(`${item.layerId}.geojson`, new TextReader(content));
        }
        if (this.includeStyle) {
            const style = this.buildStyleConfig(selected);
            await zipWriter.add('style.json', new TextReader(JSON.stringify(style, null, 2)));
        }
        this.downloadBlob(await zipWriter.close(), `${filename}.zip`);
        this.close();
    }

    private downloadBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    render() {
        const selectedCount = this.selectedItems.length;
        const showZipOption = this.singleFileEligible;

        return html`
            <sl-dialog label="Save layer(s)"
                       @sl-request-close=${(e: Event) => { (e as CustomEvent).detail?.source === 'overlay' && this.close(); }}>
                <div class="layer-list">
                    ${this.items.map((item) => html`
                        <div class="layer-row">
                            <sl-checkbox
                                ?checked=${item.checked}
                                ?disabled=${item.data === null}
                                @sl-change=${(e: Event) => this.toggleItem(item.layerId, (e.target as HTMLInputElement).checked)}
                            >
                                ${item.label}
                                ${item.data === null ? html`<span class="unsupported">(no exportable data)</span>` : null}
                            </sl-checkbox>
                        </div>
                    `)}
                </div>

                <sl-input class="filename-input" label="Filename" .value=${this.filename}
                          @sl-input=${(e: Event) => { this.filename = (e.target as SlInput).value; }}>
                </sl-input>

                <div class="options">
                    <sl-checkbox ?checked=${this.includeStyle}
                                  @sl-change=${(e: Event) => { this.includeStyle = (e.target as HTMLInputElement).checked; }}>
                        Include style
                    </sl-checkbox>
                    ${showZipOption ? html`
                        <sl-checkbox ?checked=${this.zip}
                                      @sl-change=${(e: Event) => { this.zip = (e.target as HTMLInputElement).checked; }}>
                            Save as .zip
                        </sl-checkbox>
                    ` : null}
                </div>

                <div slot="footer" class="footer">
                    <sl-button @click=${this.close}>Cancel</sl-button>
                    <sl-button variant="primary" ?disabled=${selectedCount === 0} @click=${() => this.handleDownload()}>
                        Download
                    </sl-button>
                </div>
            </sl-dialog>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'webmapx-save-layers-dialog': WebmapxSaveLayersDialog;
    }
}
