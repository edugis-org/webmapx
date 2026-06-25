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
    /** Serialized engine source config for external sources (raster/vector tile). Present when data is unavailable. */
    sourceConfig?: Record<string, unknown>;
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

        .external-hint {
            color: var(--sl-color-neutral-500);
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
            const saveable = data !== null || candidate.sourceConfig != null;
            return { ...candidate, data, checked: saveable };
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
        return this.items.filter((item) => item.checked && (item.data !== null || item.sourceConfig != null));
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

    /** Filename-safe version of a layer id (which may contain ':' from a prior
     *  import's namespace prefix, or other characters unsafe in filenames). */
    private static sanitizeFileBase(name: string): string {
        return name.replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'layer';
    }

    /** Compute a unique, filename-safe base name per item, keyed by layerId. */
    private buildFileBases(items: SaveLayerItem[]): Map<string, string> {
        const bases = new Map<string, string>();
        const used = new Set<string>();
        for (const item of items) {
            let base = WebmapxSaveLayersDialog.sanitizeFileBase(item.label ?? item.layerId);
            let candidate = base;
            let n = 2;
            while (used.has(candidate)) {
                candidate = `${base}_${n++}`;
            }
            used.add(candidate);
            bases.set(item.layerId, candidate);
        }
        return bases;
    }

    private buildStyleConfig(item: SaveLayerItem, fileBase: string): Record<string, unknown> {
        const sources: Record<string, unknown> = {};
        const layers: unknown[] = [];

        const sourceName = item.layerId;
        const isExternal = item.data === null && item.sourceConfig != null;

        if (isExternal) {
            // External source (raster/vector tile): use the stored source config as-is.
            sources[sourceName] = item.sourceConfig;
        } else {
            // GeoJSON source: reference the exported file.
            sources[sourceName] = { type: 'geojson', data: `${fileBase}.geojson` };
        }

        if (Array.isArray(item.sublayers) && item.sublayers.length > 0) {
            item.sublayers.forEach((sub, index) => {
                const subLayer = sub as Record<string, unknown>;
                const existingMetadata = (subLayer.metadata && typeof subLayer.metadata === 'object')
                    ? subLayer.metadata as Record<string, unknown>
                    : {};
                const rawId = String(subLayer.id ?? '');
                // Record a human-readable label so the legend can display it after
                // re-import, even once the id picks up load-time namespace prefixes
                // for uniqueness (e.g. "world-countries_1:world-countries-fill").
                const label = typeof existingMetadata.label === 'string' && existingMetadata.label.length > 0
                    ? existingMetadata.label
                    : rawId.replace(/^[^:]*:/, '').replace(/-/g, ' ');
                // Keep the sublayer's own id as-is — dropped-layer-builder prefixes
                // it with the imported style's id on load, so prefixing here too
                // would double up (e.g. "world-countries:world-countries_world-countries-fill").
                layers.push({
                    ...subLayer,
                    id: rawId || `${item.layerId}_${index}`,
                    source: sourceName,
                    metadata: { ...existingMetadata, label },
                });
            });
        } else {
            layers.push({
                id: item.layerId,
                type: item.layerType ?? 'fill',
                source: sourceName,
                metadata: { label: item.label },
                ...(item.paint ? { paint: item.paint } : {}),
            });
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

        // Items are listed top-to-bottom (legend order), but loading adds each layer
        // on top of the stack in zip-entry order — write bottom-to-top so reload
        // reproduces the original stacking order.
        const orderedForSave = [...selected].reverse();
        const fileBases = this.buildFileBases(orderedForSave);

        const zipWriter = new ZipWriter(new BlobWriter('application/zip'));
        for (const item of orderedForSave) {
            const isExternal = item.data === null && item.sourceConfig != null;
            if (!isExternal) {
                const content = typeof item.data === 'string' ? item.data : JSON.stringify(item.data, null, 2);
                await zipWriter.add(`${fileBases.get(item.layerId)}.geojson`, new TextReader(content));
            }
            if (this.includeStyle || isExternal) {
                const style = this.buildStyleConfig(item, fileBases.get(item.layerId)!);
                await zipWriter.add(`${fileBases.get(item.layerId)}_style.json`, new TextReader(JSON.stringify(style, null, 2)));
            }
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
                                ?disabled=${item.data === null && item.sourceConfig == null}
                                @sl-change=${(e: Event) => this.toggleItem(item.layerId, (e.target as HTMLInputElement).checked)}
                            >
                                ${item.label}
                                ${item.data === null && item.sourceConfig == null ? html`<span class="unsupported">(no exportable data)</span>` : null}
                                ${item.data === null && item.sourceConfig != null ? html`<span class="external-hint">(style only)</span>` : null}
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
                    <sl-button autofocus @click=${this.close}>Cancel</sl-button>
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
