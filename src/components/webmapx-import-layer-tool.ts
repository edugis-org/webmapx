import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMap } from '../map/IMapInterfaces';
import type { IMapState } from '../store/IMapState';
import type { WebmapxMapElement } from './webmapx-map';
import { resolveMapElement } from './internal/map-context';
import { discoverLayers, type DiscoveredLayer, type CatalogEntry } from '../utils/layer-discovery';

/**
 * Dialog tool: paste a service/tile URL (e.g. copied from the devtools
 * network tab) and discover WMS/WMTS/Esri/XYZ layers available at that
 * endpoint, then add the selected ones to the map.
 */
@customElement('webmapx-import-layer-tool')
export class WebmapxImportLayerTool extends WebmapxBaseTool {
  public active = false;
  private mapElement: WebmapxMapElement | null = null;

  @state()
  private url: string = '';

  @state()
  private discovering: boolean = false;

  @state()
  private results: DiscoveredLayer[] = [];

  @state()
  private selected: Set<DiscoveredLayer> = new Set();

  @state()
  private error: string | null = null;

  @state()
  private filterText: string = '';

  @state()
  private catalog: CatalogEntry[] = [];

  @state()
  private fileDropActive = false;

  @state()
  private fileImporting = false;

  /** Bumped on each `handleDiscover` call; a stale (slower) call's result is discarded if a newer one has started. */
  private discoverySeq = 0;

  static styles = css`
    :host { display: block; width: 100%; pointer-events: auto; }
    :host([hidden]) { display: none !important; }
    .container { width: 100%; color: var(--color-text-primary); box-sizing: border-box; padding: var(--webmapx-tool-padding, 0); }
    .section-title { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-secondary); margin: 10px 0 6px; }
    .section-title:first-child { margin-top: 0; }
    .urlbox { display:flex; gap:6px; align-items:center; }
    input[type="text"] { flex:1; padding:6px; min-width:0; }
    .error { color: var(--sl-color-danger-600, #c0392b); font-size: 12px; margin-top: 6px; }
    .filter { width:100%; box-sizing:border-box; padding:6px; margin-top:8px; }
    .results { margin-top:8px; max-height:50%; overflow:auto; }
    .results ul { list-style: none; margin: 0; padding: 0; }
    .result-item { padding:6px; border-bottom:1px solid rgba(0,0,0,0.05); display:flex; align-items:center; gap:8px; }
    .meta { font-size: 11px; color: var(--color-text-secondary); }
    .actions { margin: 8px 0; display:flex; justify-content:flex-end; gap:6px; }
    .file-row { display: flex; gap: 6px; align-items: center; }
    .drop-zone {
      border: 2px dashed var(--sl-color-neutral-400);
      border-radius: var(--sl-border-radius-medium);
      padding: 16px 8px;
      text-align: center;
      font-size: 0.8rem;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      margin-top: 6px;
    }
    .drop-zone:hover, .drop-zone.active {
      border-color: var(--sl-color-primary-500);
      background: var(--sl-color-primary-50);
      color: var(--sl-color-primary-700);
    }
    input[type="file"] { display: none; }
  `;

  protected onMapAttached(adapter: IMap): void {
    super.onMapAttached(adapter);
    this.adapter = adapter;
    this.mapElement = resolveMapElement(this);
  }

  protected onMapDetached(): void {
    this.adapter = null;
    this.mapElement = null;
    super.onMapDetached();
  }

  protected onConfigReady(_config: any): void {
    // No configuration needed.
  }

  protected onStateChanged(_state: IMapState): void {
    // No-op
  }

  activate(): void {
    this.active = true;
    (this as HTMLElement).hidden = false;
    setTimeout(() => {
      const input = this.renderRoot?.querySelector('input');
      (input as HTMLInputElement | null)?.focus();
    }, 0);
  }

  deactivate(): void {
    this.active = false;
    (this as HTMLElement).hidden = true;
  }

  /** Discovers `url` and populates `results`/`catalog`. Does not touch `this.url` or the URL text box. */
  private async discoverUrl(url: string): Promise<void> {
    const seq = ++this.discoverySeq;

    this.discovering = true;
    this.error = null;
    this.results = [];
    this.catalog = [];
    this.selected = new Set();
    this.filterText = '';

    try {
      const found = await discoverLayers(url);
      if (seq !== this.discoverySeq) return; // a newer discover has started; discard this result
      this.results = found.layers;
      this.catalog = found.catalog ?? [];
      this.selected = new Set();
      if (found.layers.length === 0 && this.catalog.length === 0) {
        this.error = 'No services discovered at this URL.';
      }
    } catch (e) {
      if (seq !== this.discoverySeq) return;
      console.error('layer discovery failed', e);
      this.error = e instanceof Error ? e.message : 'Discovery failed';
    } finally {
      if (seq === this.discoverySeq) this.discovering = false;
    }
  }

  /** Discover button: always discovers whatever is currently in the URL text box. */
  private handleDiscover(): void {
    // Read the URL straight from the input DOM node — `this.url` can lag
    // behind a fast-typed/pasted edit if `@input` hasn't propagated yet.
    const input = this.renderRoot?.querySelector('input');
    const url = (input?.value ?? this.url).trim();
    this.url = url;
    if (!url) return;
    void this.discoverUrl(url);
  }

  /** Shows a catalog entry's layers, without changing the URL text box. */
  private openCatalogEntry(entry: CatalogEntry): void {
    void this.discoverUrl(entry.url);
  }

  private get filteredResults(): DiscoveredLayer[] {
    const q = this.filterText.trim().toLowerCase();
    if (!q) return this.results;
    return this.results.filter((item) => {
      const src = item.source as unknown as Record<string, unknown>;
      const haystack: unknown[] = [
        item.title,
        item.abstract,
        item.layer.id,
        src.data,
        src.tiles,
        src.url,
      ];
      return haystack.flat().some((v) => typeof v === 'string' && v.toLowerCase().includes(q));
    });
  }

  private toggleSelected(item: DiscoveredLayer, e: Event): void {
    const evAny = e as any;
    const checked = typeof evAny?.detail?.checked === 'boolean'
      ? evAny.detail.checked
      : Boolean((e.target as HTMLInputElement | null)?.checked);

    const next = new Set(this.selected);
    if (checked) next.add(item); else next.delete(item);
    this.selected = next;
  }

  private handleAdd(): void {
    if (!this.adapter || !this.mapElement || this.selected.size === 0) return;

    const layers = Array.from(this.selected);
    for (const { source, layer } of layers) {
      try {
        // Pass the source inline via `sources` so MapLayerService.addLayer resolves
        // and registers it (ensureNativeSource + logicalToNative) — calling
        // adapter.addSource directly bypasses that bookkeeping (e.g. WMS
        // GetFeatureInfo lookup never finds the layer).
        this.mapElement.addLayerRequest({
          ...(layer as unknown as Record<string, unknown>),
          sources: { [source.id]: source },
        });
      } catch (e) {
        console.error('Failed to add discovered layer', layer.id, e);
      }
    }

    this.dispatchEvent(new CustomEvent('webmapx-layers-found', {
      detail: { url: this.url.trim(), layers },
      bubbles: true,
      composed: true,
    }));

    this.results = [];
    this.selected = new Set();
  }

  private async handleFiles(files: File[]): Promise<void> {
    if (!this.mapElement || files.length === 0) return;
    this.fileImporting = true;
    try {
      await this.mapElement.addFilesAsLayers(files);
    } finally {
      this.fileImporting = false;
    }
  }

  private handleFileInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    void this.handleFiles(files);
  }

  private handleDropZoneDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.fileDropActive = false;
    const files = Array.from(e.dataTransfer?.files ?? []);
    void this.handleFiles(files);
  }

  private handleDropZoneDragOver(e: DragEvent): void {
    if (!e.dataTransfer?.types.includes('Files')) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    this.fileDropActive = true;
  }

  render() {
    return html`
      <div class="container tool-content">
        <div class="section-title">From URL</div>
        <div class="urlbox">
          <input
            type="text"
            placeholder="Paste a service or tile URL"
            aria-label="Service or tile URL"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            data-lpignore="true"
            data-1p-ignore
            .value="${this.url}"
            @input="${(e: Event) => { this.url = (e.target as HTMLInputElement).value; }}"
            @keyup="${(e: KeyboardEvent) => { if (e.key === 'Enter') this.handleDiscover(); }}"
          />
          <sl-button size="small" ?loading=${this.discovering} ?disabled=${this.discovering} @click="${() => this.handleDiscover()}">Discover</sl-button>
        </div>

        ${this.error ? html`<div class="error">${this.error}</div>` : ''}

        ${this.catalog.length === 0 ? '' : html`
          <div class="results">
            <ul>
              ${this.catalog.map((entry) => html`
                <li class="result-item" @click="${() => this.openCatalogEntry(entry)}" style="cursor:pointer;">
                  <div style="flex:1; min-width:0;">
                    <div style="white-space:normal; word-break:break-word;" title="${entry.name}">${entry.kind === 'folder' ? '\u{1F4C1}' : '\u{1F5FA}'} ${entry.name}</div>
                    ${entry.type ? html`<div class="meta">${entry.type}</div>` : ''}
                  </div>
                </li>
              `)}
            </ul>
          </div>
        `}

        ${this.results.length === 0 ? '' : html`
          <input
            type="text"
            class="filter"
            placeholder="Filter layers..."
            aria-label="Filter layers"
            .value="${this.filterText}"
            @input="${(e: Event) => { this.filterText = (e.target as HTMLInputElement).value; }}"
          />
          <div class="actions">
            <sl-button size="small" variant="primary" ?disabled=${this.selected.size === 0} @click="${() => this.handleAdd()}">
              Add selected
            </sl-button>
          </div>
          <div class="results">
            <ul>
              ${this.filteredResults.map((item) => html`
                <li class="result-item">
                  <sl-checkbox
                    .checked=${this.selected.has(item)}
                    @sl-change=${(e: Event) => this.toggleSelected(item, e)}
                  ></sl-checkbox>
                  <div style="flex:1; min-width:0;">
                    <div style="white-space:normal; word-break:break-word;" title="${item.title}">${item.title}</div>
                    <div class="meta">${item.serviceType}</div>
                    ${item.abstract ? html`<div class="meta">${item.abstract}</div>` : ''}
                  </div>
                </li>
              `)}
            </ul>
          </div>
        `}

        <div class="section-title">From file</div>
        <div class="file-row">
          <sl-button size="small" ?loading=${this.fileImporting} ?disabled=${this.fileImporting}
            @click=${() => (this.renderRoot?.querySelector('input[type="file"]') as HTMLInputElement)?.click()}>
            <sl-icon slot="prefix" name="folder2-open"></sl-icon>
            Open file…
          </sl-button>
        </div>
        <input type="file" multiple accept=".geojson,.json,.zip,.topojson,.gpx,.kml,.kmz,.csv"
          @change=${this.handleFileInput} />
        <div
          class="drop-zone ${this.fileDropActive ? 'active' : ''}"
          @dragover=${this.handleDropZoneDragOver}
          @dragleave=${() => { this.fileDropActive = false; }}
          @drop=${this.handleDropZoneDrop}
          @click=${() => (this.renderRoot?.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
        >
          <sl-icon name="file-earmark-arrow-up"></sl-icon>
          Drop files here or click to browse
        </div>
      </div>
    `;
  }
}

