import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { WebmapxModalTool } from './webmapx-modal-tool';
import type { IMapAdapter } from '../../map/IMapAdapter';
import type { IAppState } from '../../store/IState';

/**
 * Simple search modal tool inspired by edugis map-search.
 * - Uses configurable endpoint (defaults to Nominatim geojson)
 * - Requests GeoJSON (polygon_geojson=1) and displays results
 * - Selecting a result will center/zoom the map and emit events
 * - Does not persist geometries by default; emits events so consumers may persist
 */
@customElement('webmapx-search-tool')
export class WebmapxSearchTool extends WebmapxModalTool {
  readonly toolId = 'search';

  constructor() {
    super();
    // Start hidden; ToolManager / panel will activate the tool
    (this as HTMLElement).hidden = true;
  }

  @state()
  private query: string = '';

  @state()
  private results: GeoJSON.FeatureCollection | null = null;

  @state()
  private searching: boolean = false;

  @state()
  private selectedIndex: number = -1;

  private adapter: IMapAdapter | null = null;
  private previewSourceId = 'search-preview';
  private previewLayerIds = ['search-preview-fill', 'search-preview-line', 'search-preview-point'];
  private previewLayersAdded = false;
  private persistCounter = 0;
  private persistedMap: WeakMap<GeoJSON.Feature, { sourceId: string; color: string }> = new WeakMap();

  private randomColorHex(): string {
    // Generate a vivid HSL color and convert to hex
    const h = Math.floor(Math.random() * 360);
    const s = 70; // saturation 70%
    const l = 50; // lightness 50%

    const hNorm = h / 360;
    const sNorm = s / 100;
    const lNorm = l / 100;

    const toRgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r = 0, g = 0, b = 0;
    if (sNorm === 0) {
      r = g = b = lNorm; // achromatic
    } else {
      const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
      const p = 2 * lNorm - q;
      r = toRgb(p, q, hNorm + 1/3);
      g = toRgb(p, q, hNorm);
      b = toRgb(p, q, hNorm - 1/3);
    }

    const R = Math.round(r * 255);
    const G = Math.round(g * 255);
    const B = Math.round(b * 255);
    const toHex = (v: number) => v.toString(16).padStart(2, '0');
    return `#${toHex(R)}${toHex(G)}${toHex(B)}`;
  }

  // default config
  private cfg = {
    endpoint: 'https://nominatim.openstreetmap.org/search',
    params: { format: 'geojson', polygon_geojson: 1, addressdetails: 1 },
    maxResults: 15,
    defaultZoom: 14,
    marker: false,
    persistOnSelect: false
  } as any;

  static styles = css`
    :host { display: block; width: 100%; pointer-events: auto; }
    :host([hidden]) { display: none !important; }
    .container { width: 100%; max-width: 100%; background: var(--color-background-secondary); color: var(--color-text-primary); border: 1px solid var(--color-border); padding: 8px; box-sizing: border-box; }
    .searchbox { display:flex; gap:6px; align-items:center; }
    input { flex:1; padding:6px; min-width:0; }
    button { flex:0 0 auto; }
    .results { margin-top:8px; max-height:36vh; overflow:auto; }
    .results ul { list-style: none; margin: 0; padding: 0; }
    .result-item { padding:6px; border-bottom:1px solid rgba(0,0,0,0.05); cursor:pointer; display:flex; align-items:center; gap:8px; }
    .result-item:hover, .result-item[selected] { background: rgba(0,0,0,0.03); }
    .meta { font-size: small; color: var(--color-text-secondary); }
  `;

  protected onMapAttached(adapter: IMapAdapter): void {
    super.onMapAttached(adapter);
    this.adapter = adapter;
    this.subscribeToConfig();
  }

  protected onMapDetached(): void {
    this.adapter = null;
    this.unsubscribeFromConfig();
    super.onMapDetached();
  }

  protected onConfigReady(config: any): void {
    const searchCfg = config?.tools?.search;
    if (searchCfg) {
      this.cfg = { ...this.cfg, ...searchCfg };
    }
  }

  protected onActivate(): void {
    // show the tool and focus input if present inside portal
    (this as HTMLElement).hidden = false;
    setTimeout(() => {
      const input = this.renderRoot?.querySelector('input');
      (input as HTMLInputElement | null)?.focus();
    }, 0);
    this.dispatchEvent(new CustomEvent('webmapx-search-opened', { bubbles: true, composed: true }));
  }

  protected onDeactivate(): void {
    this.results = null;
    this.query = '';
    this.selectedIndex = -1;
    // hide the tool
    (this as HTMLElement).hidden = true;
    this.dispatchEvent(new CustomEvent('webmapx-search-closed', { bubbles: true, composed: true }));
  }

  protected onStateChanged(_state: IAppState): void {
    // No-op
  }

  private async doSearch(): Promise<void> {
    const q = this.query.trim();
    if (!q || q.length < 1) {
      this.results = null;
      return;
    }

    const params = new URLSearchParams();
    Object.entries(this.cfg.params || {}).forEach(([k, v]) => params.set(k, String(v)));
    params.set('q', q);
    params.set('limit', String(this.cfg.maxResults || 15));

    const url = `${this.cfg.endpoint}?${params.toString()}`;
    this.searching = true;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error('search failed:', res.statusText);
        this.results = { type: 'FeatureCollection', features: [] };
      } else {
        const geojson = await res.json();
        this.results = geojson;
      }
    } catch (e) {
      console.error('search error', e);
      this.results = { type: 'FeatureCollection', features: [] };
    } finally {
      this.searching = false;
      // dispatch raw results so consumers can react
      this.dispatchEvent(new CustomEvent('webmapx-search-result', { detail: this.results, bubbles: true, composed: true }));
    }
  }

  private async handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      await this.doSearch();
    } else if (e.key === 'ArrowDown') {
      this.selectedIndex = Math.min((this.results?.features?.length ?? 0) - 1, Math.max(0, this.selectedIndex + 1));
    } else if (e.key === 'ArrowUp') {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    }
  }

  private getFeatureTitle(f: GeoJSON.Feature): string {
    return (f.properties && (f.properties.display_name || f.properties.name)) ?? JSON.stringify(f.geometry?.type ?? '');
  }

  private centerFeature(feature: GeoJSON.Feature) {
    // If bbox exists, fit to bbox using a pixel-based zoom calc; otherwise use point+defaultZoom
    let center: [number, number] | null = null;
    const bbox = (feature as any).bbox as number[] | undefined;

    if (bbox && bbox.length === 4 && this.adapter) {
      // compute center
      const lon = (bbox[0] + bbox[2]) / 2;
      const lat = (bbox[1] + bbox[3]) / 2;
      center = [lon, lat];
      try {
        const core = this.adapter.core as any;
        if (typeof core.fitBounds === 'function') {
          core.fitBounds(bbox as [number, number, number, number]);
          return;
        }
      } catch (e) {
        console.warn('adapter fitBounds failed', e);
      }
    }

    // Fallback: point geometry or no bbox — use default zoom if available
    if (feature.geometry?.type === 'Point') {
      const coords = feature.geometry.coordinates as number[];
      center = [coords[0], coords[1]];
    }

    const zoom = (feature.properties && (feature.properties.zoom || this.cfg.defaultZoom)) || this.cfg.defaultZoom;
    if (center && this.adapter) {
      try {
        this.adapter.core.setViewport(center, zoom);
      } catch (e) {
        console.warn('setViewport failed', e);
      }
    }
  }

  private handleSelect(feature: GeoJSON.Feature) {
    // Toggle persist on click: if persisted, remove (no zoom); otherwise add (zoom to feature)
    if (this.isPersisted(feature)) {
      this.removePersistedFeature(feature);
      this.persistedChanged(feature, false);
      // do not zoom when unpinning
    } else {
      this.addPersistedFeature(feature);
      this.persistedChanged(feature, true);
      // zoom to newly pinned feature — wait one frame so adapter projections/layers settle
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => this.centerFeature(feature));
      } else {
        setTimeout(() => this.centerFeature(feature), 50);
      }
    }

    // Emit selected event with details
    const bbox = (feature as any).bbox ?? null;
    const center = null; // consumers can compute or use bbox
    this.dispatchEvent(new CustomEvent('webmapx-search-selected', { detail: { feature, bbox, center }, bubbles: true, composed: true }));

    // Clear hover preview
    this.clearPreview();
  }

  private persistedChanged(feature: GeoJSON.Feature, persisted: boolean) {
    // Emit event for UI or external consumers
    this.dispatchEvent(new CustomEvent('webmapx-search-persist-change', { detail: { feature, persisted }, bubbles: true, composed: true }));
    // Trigger re-render by toggling a state value; simplest is to update a dummy state
    this.requestUpdate();
  }

  private isPersisted(feature: GeoJSON.Feature): boolean {
    return this.persistedMap.has(feature);
  }

  private addPersistedFeature(feature: GeoJSON.Feature) {
    if (!this.adapter) return;
    const core = this.adapter.core;

    // Determine source id
    let sourceId = null as string | null;
    if (feature.properties && (feature.properties.osm_id || feature.properties.osm_type)) {
      sourceId = `search-persist-osm-${feature.properties.osm_type ?? ''}-${feature.properties.osm_id ?? ''}`;
    }
    if (!sourceId) {
      sourceId = `search-persist-${Date.now()}-${this.persistCounter++}`;
    }

    const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [feature] };

    try {
      // choose a color per feature
      const color = this.randomColorHex();
      core.addSource(sourceId, { type: 'geojson', data: fc });

      // Add appropriate layers depending on geometry type
      const geom = feature.geometry?.type;
      const fillId = `${sourceId}-fill`;
      const lineId = `${sourceId}-line`;
      const pointId = `${sourceId}-point`;

      if (geom === 'Polygon' || geom === 'MultiPolygon') {
        core.addLayer({ id: fillId, type: 'fill', source: sourceId, paint: { 'fill-color': color, 'fill-opacity': 0.25 } });
        core.addLayer({ id: lineId, type: 'line', source: sourceId, paint: { 'line-color': color, 'line-width': 2 } });
      } else if (geom === 'LineString' || geom === 'MultiLineString') {
        core.addLayer({ id: lineId, type: 'line', source: sourceId, paint: { 'line-color': color, 'line-width': 3 } });
      } else { // Point / MultiPoint fallback
        core.addLayer({ id: pointId, type: 'circle', source: sourceId, paint: { 'circle-color': color, 'circle-radius': 6 } });
      }

      this.persistedMap.set(feature, { sourceId, color });
    } catch (e) {
      console.error('Failed to persist feature', e);
    }
  }

  private removePersistedFeature(feature: GeoJSON.Feature) {
    if (!this.adapter) return;
    const core = this.adapter.core;
    const info = this.persistedMap.get(feature);
    if (!info) return;
    const sourceId = info.sourceId;
    try {
      // Remove layers if present
      try { core.removeLayer(`${sourceId}-fill`); } catch (e) {}
      try { core.removeLayer(`${sourceId}-line`); } catch (e) {}
      try { core.removeLayer(`${sourceId}-point`); } catch (e) {}
      // Remove source
      try { core.removeSource(sourceId); } catch (e) {}
    } catch (e) {
      console.warn('Error removing persisted feature', e);
    }

    this.persistedMap.delete(feature);
  }

  private async ensurePreviewSourceAndLayers(featureCollection: GeoJSON.FeatureCollection) {
    if (!this.adapter) return;

    const core = this.adapter.core;

    // Add or update source
    try {
      const existing = core.getSource(this.previewSourceId as string);
      if (existing && typeof existing.setData === 'function') {
        existing.setData(featureCollection as GeoJSON.FeatureCollection);
      } else {
        // Add source with geojson data
        core.addSource(this.previewSourceId, { type: 'geojson', data: featureCollection });
      }
    } catch (e) {
      console.warn('preview source update failed', e);
    }

    // Add style layers once per map
    if (!this.previewLayersAdded) {
      try {
        // Fill for polygons (default preview colors)
        core.addLayer({ id: this.previewLayerIds[0], type: 'fill', source: this.previewSourceId, paint: { 'fill-color': '#f1c40f', 'fill-opacity': 0.25 } });
        // Line for lines
        core.addLayer({ id: this.previewLayerIds[1], type: 'line', source: this.previewSourceId, paint: { 'line-color': '#f39c12', 'line-width': 3 } });
        // Circle for points
        core.addLayer({ id: this.previewLayerIds[2], type: 'circle', source: this.previewSourceId, paint: { 'circle-color': '#e67e22', 'circle-radius': 6 } });
        this.previewLayersAdded = true;
      } catch (e) {
        console.warn('adding preview layers failed', e);
      }
    }
  }

  private updatePreviewLayersPaint(colors?: { fill?: string; line?: string; point?: string }) {
    if (!this.adapter) return;
    const core = this.adapter.core;

    // Remove existing preview layers if present
    for (const lid of this.previewLayerIds) {
      try { core.removeLayer(lid); } catch (e) { /* ignore */ }
    }

    // Re-add preview layers with optional override colors
    try {
      core.addLayer({ id: this.previewLayerIds[0], type: 'fill', source: this.previewSourceId, paint: { 'fill-color': colors?.fill ?? '#f1c40f', 'fill-opacity': 0.25 } });
      core.addLayer({ id: this.previewLayerIds[1], type: 'line', source: this.previewSourceId, paint: { 'line-color': colors?.line ?? '#f39c12', 'line-width': 3 } });
      core.addLayer({ id: this.previewLayerIds[2], type: 'circle', source: this.previewSourceId, paint: { 'circle-color': colors?.point ?? '#e67e22', 'circle-radius': 6 } });
      this.previewLayersAdded = true;
    } catch (e) {
      console.warn('update preview layers failed', e);
    }
  }

  private darkenHex(hex: string, amount = 0.15): string {
    // Accept #rrggbb or rrggbb
    let h = hex.replace('#', '');
    if (h.length === 3) {
      h = h.split('').map(c => c + c).join('');
    }
    const r = parseInt(h.substring(0,2), 16);
    const g = parseInt(h.substring(2,4), 16);
    const b = parseInt(h.substring(4,6), 16);
    const dark = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 - amount))));
    const R = dark(r);
    const G = dark(g);
    const B = dark(b);
    const toHex = (v: number) => v.toString(16).padStart(2, '0');
    return `#${toHex(R)}${toHex(G)}${toHex(B)}`;
  }

  private clearPreview() {
    if (!this.adapter) return;
    const core = this.adapter.core;
    try {
      // remove layers
      for (const lid of this.previewLayerIds) {
        try { core.removeLayer(lid); } catch (e) { /* ignore */ }
      }
      // remove source
      try { core.removeSource(this.previewSourceId); } catch (e) { /* ignore */ }
    } catch (e) {
      // ignore
    }
    this.previewLayersAdded = false;
  }

  private showPreviewForFeature(feature: GeoJSON.Feature) {
    const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [feature] };
    this.ensurePreviewSourceAndLayers(fc);
    // If the feature is persisted, use its color darkened for the preview; otherwise use defaults
    const info = this.persistedMap.get(feature as any);
    if (info && info.color) {
      const darker = this.darkenHex(info.color, 0.18);
      this.updatePreviewLayersPaint({ fill: darker, line: darker, point: darker });
    } else {
      // ensure default preview colors
      this.updatePreviewLayersPaint(undefined);
    }
  }

  private onResultCheckboxChange(feature: GeoJSON.Feature, e: Event) {
    // Stop propagation so the parent list item doesn't also handle the click
    try { e.stopPropagation(); } catch (err) { /* ignore */ }

    // Shoelace emits a custom event 'sl-change' with detail.checked; fall back to target.checked
    const evAny = e as any;
    let checked = false;
    if (evAny?.detail && typeof evAny.detail.checked === 'boolean') {
      checked = evAny.detail.checked;
    } else {
      const target = e.target as any;
      checked = Boolean(target?.checked);
    }

    if (checked) {
      if (!this.isPersisted(feature)) {
        this.addPersistedFeature(feature);
        this.persistedChanged(feature, true);
      }
    } else {
      if (this.isPersisted(feature)) {
        this.removePersistedFeature(feature);
        this.persistedChanged(feature, false);
      }
    }
    // Ensure UI updates
    this.requestUpdate();
  }

  render() {
    return html`
      <div class="container tool-content">
        <div class="title">Search</div>
        <div class="searchbox">
          <input
            placeholder="Search places and addresses"
            .value="${this.query}"
            @input="${(e: Event) => { this.query = (e.target as HTMLInputElement).value; }}"
            @keyup="${(e: KeyboardEvent) => this.handleKey(e)}"
          />
          <button @click="${() => this.doSearch()}">Go</button>
        </div>

        <div class="results">
          ${this.searching ? html`<div>Searching...</div>` : ''}
          ${!this.results ? html`` : html`
            <ul>
              ${(this.results.features || []).map((f, i) => html`
                <li class="result-item" ?selected=${i === this.selectedIndex}
                    @mouseenter=${() => this.showPreviewForFeature(f)}
                    @mouseleave=${() => this.clearPreview()}>
                  <sl-checkbox
                    .checked=${this.isPersisted(f)}
                    @sl-change=${(e: Event) => this.onResultCheckboxChange(f, e)}
                    @click=${(e: Event) => e.stopPropagation()}
                    style="flex:0 0 auto;">
                  </sl-checkbox>
                  <div style="flex:1; display:flex; justify-content:space-between; align-items:center;">
                    <div @click=${() => this.handleSelect(f)} style="cursor:pointer;"><strong>${this.getFeatureTitle(f)}</strong></div>
                    <div style="font-size:12px; color:var(--color-text-secondary);">${''}</div>
                  </div>
                  <div class="meta">${f.properties ? (f.properties.type || f.properties.category || '') : ''}</div>
                </li>
              `)}
            </ul>
          `}
        </div>
      </div>
    `;
  }
}
