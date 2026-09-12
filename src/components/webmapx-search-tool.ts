import { html, css, svg } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMap } from '../map/IMapInterfaces';
import type { IMapState } from '../store/IMapState';
import type { WebmapxMapElement } from './webmapx-map';
import { resolveMapElement } from './internal/map-context';
import { controlSurfaceStyles } from './internal/control-surface-styles';

/**
 * Simple search modal tool inspired by edugis map-search.
 * - Uses configurable endpoint (defaults to Nominatim geojson)
 * - Requests GeoJSON (polygon_geojson=1) and displays results
 * - Selecting a result will center/zoom the map and emit events
 * - Does not persist geometries by default; emits events so consumers may persist
 */
@customElement('webmapx-search-tool')
export class WebmapxSearchTool extends WebmapxBaseTool {
  public active = false;
  private mapElement: WebmapxMapElement | null = null;
  // obfuscated name so mobile autofill doesn't recognize this as a "search"/address field
  private searchInputName = 'wmx-7f3a9c1';

  @state()
  private query: string = '';

  @state()
  private results: GeoJSON.FeatureCollection | null = null;

  @state()
  private searching: boolean = false;

  @state()
  private selectedIndex: number = -1;

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

    let r: number, g: number, b: number;
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
    persistOnSelect: false,
    provider: 'nominatim',
    attribution: ''
  } as any;

  private static readonly PROVIDER_DEFAULTS: Record<string, { endpoint: string; params: Record<string, unknown>; attribution: string }> = {
    nominatim: {
      endpoint: 'https://nominatim.openstreetmap.org/search',
      params: { format: 'geojson', polygon_geojson: 1, addressdetails: 1 },
      attribution: '&copy; OpenStreetMap contributors | &copy; Nominatim',
    },
    pdok: {
      endpoint: 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/free',
      params: { fl: 'id,type,weergavenaam,centroide_ll,geometrie_ll' },
      attribution: '&copy; PDOK Locatieserver, Kadaster',
    },
  };

  private static readonly KNOWN_PROVIDERS = new Set(Object.keys(WebmapxSearchTool.PROVIDER_DEFAULTS));

  private isKnownProvider(provider: string): boolean {
    return WebmapxSearchTool.KNOWN_PROVIDERS.has(provider.toLowerCase());
  }

  static styles = [controlSurfaceStyles, css`
    :host { display: block; width: 100%; pointer-events: auto; }
    :host([hidden]) { display: none !important; }
    .container { width: 100%; max-width: 100%; color: var(--webmapx-search-color, var(--color-text-primary)); box-sizing: border-box; padding: var(--webmapx-tool-padding, 0); }
    .searchbox { display:flex; gap:6px; align-items:center; }
    /* Same border as .go-button, fixed at 1px always — focus recolours it to the
       same blue as the button's hover instead of adding an outline, so the box
       never changes thickness. */
    input {
      flex:1;
      height: 2rem;
      padding:0 6px;
      min-width:0;
      box-sizing: border-box;
      font: inherit;
      font-size: 12px;
      color: inherit;
      background: var(--color-background, #fff);
      border: 1px solid var(--color-border, #d5dce3);
      border-radius: var(--webmapx-radius-sm, 4px);
      outline: none;
    }
    input:focus-visible {
      border-color: var(--color-primary, #2b6c8f);
    }
    button { flex:0 0 auto; }
    .searchbox button { cursor: pointer; }
    /* Same house style as the toolbar's own search button in its resting state
       (a Shoelace default-variant button: neutral border, no fill) — .webmapx-control
       picks up the active [data-style] preset the way every other plain button here does. */
    .go-button {
      display: grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      padding: 0;
      color: inherit;
      border: 1px solid var(--color-border, #d5dce3);
      border-radius: var(--webmapx-radius-sm, 4px);
      background-color: var(--color-background, #fff);
    }
    /* Same primary fill a toolbar button gets while its tool is active. */
    .go-button:hover {
      background-color: var(--color-primary, #2b6c8f);
      border-color: var(--color-primary, #2b6c8f);
      color: var(--color-on-primary, #fff);
    }
    .go-button svg { width: 1.1rem; height: 1.1rem; }
    .results { margin-top:8px; max-height:50%; overflow:auto; }
    .results ul { list-style: none; margin: 0; padding: 0; }
    .result-item { padding:6px; border-bottom:1px solid rgba(0,0,0,0.05); display:flex; align-items:center; gap:8px; }
    .result-item:hover, .result-item[selected] { background: rgba(0,0,0,0.03); }
    .result-select {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
      /* The OS-supplied zoom-in cursor renders as a tiny, blurry bitmap on some
         displays — a hand-drawn SVG (white halo + dark line, like a native pointer)
         stays crisp at any DPI instead. Hotspot sits at the lens centre. */
      cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26'%3E%3Cg fill='none' stroke='white' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='6.5'/%3E%3Cline x1='15.8' y1='15.8' x2='23' y2='23'/%3E%3C/g%3E%3Cg fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='6.5'/%3E%3Cline x1='15.8' y1='15.8' x2='23' y2='23'/%3E%3C/g%3E%3C/svg%3E") 11 11, zoom-in;
      border: 0;
      background: transparent;
      font: inherit;
      color: inherit;
      text-align: left;
      padding: 0;
    }
    .result-title {
      font-size: 12.5px;
      font-weight: 400;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .result-title strong { font-weight: 600; }
    /* Subtitle: the result's type/category, one step quieter and smaller than the title. */
    .meta { display: inline-flex; align-items: center; gap: 3px; font-size: 10.5px; line-height: 1.2; color: var(--color-text-muted, #6b7681); }
    /* Same CSS colour as the subtitle text, but a filled shape reads visually heavier
       than thin text glyphs at identical colour (more ink coverage) — opacity brings
       the two back to the same optical weight. */
    .geom-icon { display: inline-flex; flex: none; opacity: 0.75; }
    .geom-icon svg { width: 12px; height: 12px; overflow: visible; }

    /* The stack sits small and muted, upper-left — it identifies "a map
       layer" but is deliberately not the thing the eye lands on. The badge
       is the whole point: a big, high-contrast plus that reads as "add"
       before the layer glyph even registers. A one-time action, not a
       switch: once this result scrolls out of the list (a new search, or
       closing the tool) there is no control left here to flip back — that
       lives in the layer overview from then on, same as any other layer. */
    .layer-toggle {
      flex: 0 0 auto;
      width: 2.05rem;
      height: 2.05rem;
      border-radius: 50%;
      border: none;
      background: transparent;
      padding: 0;
      display: grid;
      place-items: center;
      cursor: pointer;
      color: var(--color-text-muted, #6b7681);
    }
    .layer-toggle:hover {
      background: var(--color-background-hover, rgba(22, 32, 42, 0.06));
      color: var(--color-primary, #2b6c8f);
    }
    .layer-toggle:focus-visible {
      outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #2b6c8f));
      outline-offset: var(--webmapx-focus-offset, 2px);
    }
    .layer-toggle svg { width: 1.5rem; height: 1.5rem; overflow: visible; }
    .layer-toggle .stack-top {
      fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linejoin: round; opacity: .85;
    }
    .layer-toggle .stack-mid, .layer-toggle .stack-bot {
      fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; opacity: .6;
    }
    .layer-toggle .badge-circle {
      fill: var(--color-primary, #2b6c8f); stroke: var(--color-surface, #fff); stroke-width: 1.5;
    }
    .layer-toggle .badge-plus { stroke: var(--color-on-primary, #fff); stroke-width: 2.3; stroke-linecap: round; }
    .layer-toggle:hover .badge-circle { fill: var(--color-primary-hover, #21566f); }
    .layer-toggle[data-added="true"] { color: var(--color-primary, #2b6c8f); }
    .layer-toggle[data-added="true"] .stack-top {
      fill: var(--color-primary, #2b6c8f); stroke: var(--color-primary, #2b6c8f); opacity: 1;
    }
    .layer-toggle[data-added="true"] .stack-mid, .layer-toggle[data-added="true"] .stack-bot { opacity: .85; }
    .layer-toggle[data-added="true"] .badge-circle { fill: var(--color-success, #1c7c4a); }
    .layer-toggle[data-added="true"]:hover .badge-circle { filter: brightness(0.92); }
    .layer-toggle[data-added="true"] .badge-plus { display: none; }
    .layer-toggle[data-added="true"] .badge-check {
      stroke: var(--color-on-primary, #fff); stroke-width: 2.3; stroke-linecap: round; stroke-linejoin: round; fill: none;
    }
    .layer-toggle:not([data-added="true"]) .badge-check { display: none; }
  `];

  // Same shape as the .result-select cursor (lens + handle, no "+") — the button that
  // runs the search should look like the action, not just cue it via the pointer.
  private readonly searchIcon = html`
    <svg viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="13.2" y1="13.2" x2="19" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;

  private readonly layerToggleIcon = html`
    <svg viewBox="0 0 22 22" aria-hidden="true">
      <path class="stack-top" d="M8 2.4 L13.6 5.6 L8 8.8 L2.4 5.6 Z"/>
      <path class="stack-mid" d="M3 8.2 L8 11 L13 8.2"/>
      <path class="stack-bot" d="M3 10.6 L8 13.4 L13 10.6"/>
      <circle class="badge-circle" cx="15.6" cy="15.6" r="6"/>
      <path class="badge-plus" d="M15.6 12.1V19.1M12.1 15.6H19.1"/>
      <path class="badge-check" d="M12.3 15.8 L14.5 18 L19 12.9"/>
    </svg>
  `;

  protected onMapAttached(adapter: IMap): void {
    super.onMapAttached(adapter);
    this.adapter = adapter;
    this.mapElement = resolveMapElement(this);
    this.subscribeToConfig();
  }

  protected onMapDetached(): void {
    this.adapter = null;
    this.mapElement = null;
    this.unsubscribeFromConfig();
    super.onMapDetached();
  }

  protected onConfigReady(config: any): void {
    const searchCfg = config?.tools?.search;
    const provider = (searchCfg?.provider ?? this.cfg.provider ?? 'nominatim').toLowerCase();
    const defaults = WebmapxSearchTool.PROVIDER_DEFAULTS[provider];

    if (defaults) {
      // Apply provider-specific defaults first (endpoint/params/attribution), then let
      // explicit user config win. Config's `params` merges on top of the provider's,
      // rather than fully replacing them.
      this.cfg = {
        ...this.cfg,
        endpoint: defaults.endpoint,
        attribution: defaults.attribution,
        ...searchCfg,
        provider,
        params: { ...defaults.params, ...(searchCfg?.params ?? {}) },
      };
    } else if (searchCfg) {
      this.cfg = { ...this.cfg, ...searchCfg };
    }

    if (!this.isKnownProvider(this.cfg.provider)) {
      console.warn(`webmapx-search-tool: unknown provider "${this.cfg.provider}"`);
    }
  }

  activate(): void {
    this.active = true;
    (this as HTMLElement).hidden = false;
    setTimeout(() => {
      const input = this.renderRoot?.querySelector('input');
      (input as HTMLInputElement | null)?.focus();
    }, 0);
    this.dispatchEvent(new CustomEvent('webmapx-search-opened', { bubbles: true, composed: true }));
  }

  deactivate(): void {
    this.active = false;
    // Query, results and selection are deliberately left alone — the component
    // stays mounted (just hidden) while another tool is active, so reopening
    // the search tool should find it exactly as it was left.
    (this as HTMLElement).hidden = true;
    this.dispatchEvent(new CustomEvent('webmapx-search-closed', { bubbles: true, composed: true }));
  }

  protected onStateChanged(_state: IMapState): void {
    // No-op
  }

  // A hard geo filter (Nominatim bounded=1, PDOK fq=centroide_ll:[...]) can exclude the
  // one result the user actually wants (e.g. a real address just outside a tight bbox, or
  // ranked past a low `rows`/`limit` cutoff within it) while a fuzzy in-bbox false-positive
  // takes its place. So: fetch once, unrestricted, with a high result cap, and rank
  // in-viewport results first client-side instead of asking the provider to exclude anything.
  private static readonly NOMINATIM_SCAN_LIMIT = 40;
  private static readonly PDOK_SCAN_LIMIT = 100; // PDOK Locatieserver's documented max for `rows`

  private buildSearchUrl(q: string): string {
    const params = new URLSearchParams();
    Object.entries(this.cfg.params || {}).forEach(([k, v]) => params.set(k, String(v)));
    params.set('q', q);

    if (this.cfg.provider === 'pdok') {
      params.set('rows', String(Math.min(this.cfg.maxResults ? Math.max(this.cfg.maxResults, 15) : WebmapxSearchTool.PDOK_SCAN_LIMIT, WebmapxSearchTool.PDOK_SCAN_LIMIT)));
    } else {
      params.set('limit', String(Math.min(this.cfg.maxResults ? Math.max(this.cfg.maxResults, 15) : WebmapxSearchTool.NOMINATIM_SCAN_LIMIT, WebmapxSearchTool.NOMINATIM_SCAN_LIMIT)));
      const viewbox = this.getCurrentViewBbox();
      if (viewbox) {
        // Soft bias only (no `bounded=1`): nudges ranking toward the current view without
        // excluding anything outside it.
        const [west, south, east, north] = viewbox;
        params.set('viewbox', `${west},${north},${east},${south}`);
      }
    }
    return `${this.cfg.endpoint}?${params.toString()}`;
  }

  // Parses the WKT subset PDOK Locatieserver returns (POINT, (MULTI)POLYGON, (MULTI)LINESTRING).
  private parseWkt(wkt: string): GeoJSON.Geometry | null {
    const match = wkt.match(/^\s*([A-Z]+)\s*\((.*)\)\s*$/s);
    if (!match) return null;
    const type = match[1].toUpperCase();
    const body = match[2];

    const splitTopLevel = (s: string): string[] => {
      const parts: string[] = [];
      let depth = 0, start = 0;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === '(') depth++;
        else if (s[i] === ')') depth--;
        else if (s[i] === ',' && depth === 0) {
          parts.push(s.slice(start, i));
          start = i + 1;
        }
      }
      parts.push(s.slice(start));
      return parts.map(p => p.trim());
    };
    const stripParens = (s: string): string => s.trim().replace(/^\(/, '').replace(/\)$/, '');
    const parsePoint = (s: string): [number, number] => {
      const [lng, lat] = s.trim().split(/\s+/).map(Number);
      return [lng, lat];
    };
    const parsePointList = (s: string): [number, number][] => splitTopLevel(s).map(parsePoint);
    const parseRingList = (s: string): [number, number][][] => splitTopLevel(s).map(r => parsePointList(stripParens(r)));
    const parsePolygonList = (s: string): [number, number][][][] => splitTopLevel(s).map(p => parseRingList(stripParens(p)));

    switch (type) {
      case 'POINT':
        return { type: 'Point', coordinates: parsePoint(body) };
      case 'LINESTRING':
        return { type: 'LineString', coordinates: parsePointList(body) };
      case 'MULTILINESTRING':
        return { type: 'MultiLineString', coordinates: splitTopLevel(body).map(l => parsePointList(stripParens(l))) };
      case 'POLYGON':
        return { type: 'Polygon', coordinates: parseRingList(body) };
      case 'MULTIPOLYGON':
        return { type: 'MultiPolygon', coordinates: parsePolygonList(body) };
      default:
        return null;
    }
  }

  private pdokDocToFeature(doc: Record<string, any>): GeoJSON.Feature | null {
    const wkt = doc.geometrie_ll || doc.centroide_ll;
    if (!wkt) return null;
    const geometry = this.parseWkt(wkt);
    if (!geometry) return null;
    return {
      type: 'Feature',
      geometry,
      properties: { ...doc, display_name: doc.weergavenaam },
    };
  }

  private async fetchResults(url: string): Promise<GeoJSON.FeatureCollection> {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('search failed:', res.statusText);
      return { type: 'FeatureCollection', features: [] };
    }
    const body = await res.json();

    if (this.cfg.provider === 'pdok') {
      const docs = body?.response?.docs || [];
      const features = docs
        .map((d: Record<string, any>) => this.pdokDocToFeature(d))
        .filter((f: GeoJSON.Feature | null): f is GeoJSON.Feature => f !== null);
      return { type: 'FeatureCollection', features };
    }

    return body;
  }

  private getCurrentViewBbox(): [number, number, number, number] | null {
    const bounds = this.adapter?.store?.getState()?.mapViewportBounds;
    const ring = bounds?.geometry?.coordinates?.[0];
    if (!ring || ring.length === 0) return null;
    let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
    for (const [lon, lat] of ring) {
      if (lon < west) west = lon;
      if (lon > east) east = lon;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
    }
    if (!isFinite(west) || !isFinite(south) || !isFinite(east) || !isFinite(north)) return null;
    return [west, south, east, north];
  }

  private featureKey(f: GeoJSON.Feature): string {
    const p = f.properties || {};
    if (p.osm_type || p.osm_id) return `osm:${p.osm_type}:${p.osm_id}`;
    if (p.id) return `id:${p.id}`;
    return JSON.stringify(f.geometry);
  }

  // Representative point for a feature: its own coords if Point, else its bbox center.
  private featureRepresentativePoint(f: GeoJSON.Feature): [number, number] | null {
    if (f.geometry?.type === 'Point') return f.geometry.coordinates as [number, number];
    const bbox = this.geometryBbox(f.geometry);
    if (!bbox) return null;
    return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
  }

  private featureInBbox(f: GeoJSON.Feature, bbox: [number, number, number, number]): boolean {
    const point = this.featureRepresentativePoint(f);
    if (!point) return false;
    const [lon, lat] = point;
    const [west, south, east, north] = bbox;
    return lon >= west && lon <= east && lat >= south && lat <= north;
  }

  private async doSearch(): Promise<void> {
    const q = this.query.trim();
    if (!q || q.length < 1) {
      this.results = null;
      return;
    }

    this.searching = true;
    try {
      const result = await this.fetchResults(this.buildSearchUrl(q));
      let features = result.features || [];

      // Rank a title that starts with the exact query text first (almost certainly what the
      // user meant), then prefer results inside the current view among equal matches. Stable
      // sort preserves the provider's own relevance order within each tier.
      const ql = q.toLowerCase();
      const viewbox = this.getCurrentViewBbox();
      const matchRank = (f: GeoJSON.Feature) => this.getFeatureTitle(f).toLowerCase().startsWith(ql) ? 0 : 1;
      const localRank = (f: GeoJSON.Feature) => (viewbox && this.featureInBbox(f, viewbox)) ? 0 : 1;
      features = features
        .map((f, i) => ({ f, i }))
        .sort((a, b) => (matchRank(a.f) - matchRank(b.f)) || (localRank(a.f) - localRank(b.f)) || (a.i - b.i))
        .map(({ f }) => f);

      this.results = { type: 'FeatureCollection', features };
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

  // Only the first word carries weight — the rest of a geocoder title (often a full,
  // comma-separated address) reads as a caption to it, not a second heading.
  private renderResultTitle(f: GeoJSON.Feature) {
    const title = this.getFeatureTitle(f);
    const spaceIdx = title.indexOf(' ');
    if (spaceIdx === -1) {
      return html`<strong>${title}</strong>`;
    }
    return html`<strong>${title.slice(0, spaceIdx)}</strong>${title.slice(spaceIdx)}`;
  }

  // Same three buckets addPersistedFeature draws with — a result's geometry only ever
  // becomes a fill, a line or a point, regardless of how many ways OSM/PDOK spell the
  // underlying GeoJSON type (Multi* included).
  private geometryKind(type: GeoJSON.Geometry['type'] | undefined): 'polygon' | 'line' | 'point' {
    if (type === 'Polygon' || type === 'MultiPolygon') return 'polygon';
    if (type === 'LineString' || type === 'MultiLineString') return 'line';
    return 'point';
  }

  // A round dot competing with an equally-thin, equally-grey outline anti-aliases into
  // nothing at this icon size — confirmed by screenshotting the actual rendered pixels,
  // not just eyeballing a zoomed-in preview. A punched square (solid square, background-
  // colour hole cut from its centre) reads as a distinct object regardless of scale,
  // because it doesn't depend on being *bigger* than the line, only on having a hard
  // inner edge — the same reason vector-editor node handles are drawn this way.
  //
  // Must be lit's `svg` tag, not `html`: this template is parsed on its own (it's a
  // separate call embedded into the parent svg via ${}), and without an <svg> ancestor
  // *in that same parse* to establish foreign-content mode, `html` creates the <rect>s
  // as plain HTML elements — not SVGRectElement, so nothing paints, however the
  // attributes are tuned. Confirmed with r.getBBox() throwing "not a function" on the
  // rendered nodes: they were never real SVG shapes to begin with.
  private nodeMarker(x: number, y: number) {
    return svg`
      <rect x="${x - 1.9}" y="${y - 1.9}" width="3.8" height="3.8" rx="1" fill="currentColor"></rect>
      <rect x="${x - 0.8}" y="${y - 0.8}" width="1.6" height="1.6" rx="0.4" fill="var(--color-background, #fff)"></rect>
    `;
  }

  // A result's subtitle says what kind of thing it is (village, river…), this says what
  // it will actually draw as, which the category name alone doesn't reliably tell you.
  private geometryKindIcon(kind: 'polygon' | 'line' | 'point') {
    if (kind === 'polygon') {
      // 4 corners, not more — each node needs real space around it to read, and a
      // quadrilateral still says "polygon" as clearly as a pentagon would.
      const pts: Array<[number, number]> = [[2.3, 2], [12, 3], [11.3, 12.2], [2, 10.6]];
      return html`<svg viewBox="0 0 14 14" aria-hidden="true">
        <polygon points="${pts.map(([x, y]) => `${x},${y}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
        ${pts.map(([x, y]) => this.nodeMarker(x, y))}
      </svg>`;
    }
    if (kind === 'line') {
      return html`<svg viewBox="0 0 14 14" aria-hidden="true">
        <line x1="2" y1="11.5" x2="12" y2="2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        ${this.nodeMarker(2, 11.5)}
        ${this.nodeMarker(12, 2.5)}
      </svg>`;
    }
    return html`<svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="4.5" fill="currentColor"/></svg>`;
  }

  // Recursively walks any GeoJSON geometry's coordinate arrays to derive a bbox.
  // Nominatim sets feature.bbox directly; providers like PDOK don't, so this covers
  // Line/(Multi)Polygon results that would otherwise have no way to center/zoom to.
  private geometryBbox(geometry: GeoJSON.Geometry | undefined): [number, number, number, number] | null {
    if (!geometry) return null;
    let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
    const visit = (coords: any): void => {
      if (typeof coords[0] === 'number') {
        const [lon, lat] = coords as [number, number];
        if (lon < west) west = lon;
        if (lon > east) east = lon;
        if (lat < south) south = lat;
        if (lat > north) north = lat;
      } else {
        for (const c of coords) visit(c);
      }
    };
    visit((geometry as any).coordinates);
    if (!isFinite(west) || !isFinite(south) || !isFinite(east) || !isFinite(north)) return null;
    return [west, south, east, north];
  }

  private centerFeature(feature: GeoJSON.Feature) {
    // If bbox exists, fit to bbox using a pixel-based zoom calc; otherwise use point+defaultZoom
    let center: [number, number] | null = null;
    const bbox = ((feature as any).bbox as number[] | undefined)
      ?? (feature.geometry?.type !== 'Point' ? this.geometryBbox(feature.geometry) ?? undefined : undefined);

    if (bbox && bbox.length === 4 && this.adapter) {
      // compute center
      const lon = (bbox[0] + bbox[2]) / 2;
      const lat = (bbox[1] + bbox[3]) / 2;
      center = [lon, lat];
      try {
        if (typeof this.adapter.fitBounds === 'function') {
          this.adapter.fitBounds(bbox as [number, number, number, number]);
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
        this.adapter.setViewport(center, zoom);
      } catch (e) {
        console.warn('setViewport failed', e);
      }
    }
  }

  private handleSelect(feature: GeoJSON.Feature) {
    this.centerFeature(feature);
    const bbox = (feature as any).bbox ?? null;
    this.dispatchEvent(new CustomEvent('webmapx-search-selected', { detail: { feature, bbox, center: null }, bubbles: true, composed: true }));
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
    if (!this.adapter || !this.mapElement) return;
    const mapElement = this.mapElement;

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
      const sourceConfig: { type: 'geojson'; data: GeoJSON.FeatureCollection; attribution?: string } = { type: 'geojson', data: fc };
      if (this.cfg.attribution) {
        sourceConfig.attribution = this.cfg.attribution;
      }
      const sources = { [sourceId]: sourceConfig };

      // Add appropriate layers depending on geometry type
      const geom = feature.geometry?.type;
      const kind = this.geometryKind(geom);
      const fillId = `${sourceId}-fill`;
      const lineId = `${sourceId}-line`;
      const pointId = `${sourceId}-point`;
      const resultName = this.getFeatureTitle(feature);

      if (kind === 'polygon') {
        // Composite style layer for polygons: separate fill and outline (line) sub-layers,
        // with a single legend item.
        mapElement.addLayerRequest({
          id: fillId,
          type: 'style',
          sources,
          layers: [
            { id: 'fill', type: 'fill', source: sourceId, paint: { 'fill-color': color, 'fill-opacity': 0.25 } },
            { id: 'line', type: 'line', source: sourceId, paint: { 'line-color': color, 'line-width': 2 } },
          ],
          metadata: { label: resultName, hideFromLegend: false },
        });
      } else if (kind === 'line') {
        mapElement.addLayerRequest({ id: lineId, type: 'line', source: sourceId, sources, metadata: { label: resultName, hideFromLegend: false }, paint: { 'line-color': color, 'line-width': 3 } });
      } else { // Point / MultiPoint fallback
        mapElement.addLayerRequest({ id: pointId, type: 'circle', source: sourceId, sources, metadata: { label: resultName, hideFromLegend: false }, paint: { 'circle-color': color, 'circle-radius': 6 } });
      }

      this.persistedMap.set(feature, { sourceId, color });
    } catch (e) {
      console.error('Failed to persist feature', e);
    }
  }

  private removePersistedFeature(feature: GeoJSON.Feature) {
    if (!this.adapter || !this.mapElement) return;
    const map = this.adapter;
    const mapElement = this.mapElement;
    const info = this.persistedMap.get(feature);
    if (!info) return;
    const sourceId = info.sourceId;
    try {
      // Remove layers if present
      try { mapElement.removeInlineLayer(`${sourceId}-fill`); } catch (_e) {}
      try { mapElement.removeInlineLayer(`${sourceId}-line`); } catch (_e) {}
      try { mapElement.removeInlineLayer(`${sourceId}-point`); } catch (_e) {}
      // Remove source
      try { map.removeSource(sourceId); } catch (_e) {}
    } catch (e) {
      console.warn('Error removing persisted feature', e);
    }

    this.persistedMap.delete(feature);
  }

  private async showPreviewLayers(
    featureCollection: GeoJSON.FeatureCollection,
    colors?: { fill?: string; line?: string; point?: string }
  ) {
    if (!this.adapter || !this.mapElement) return;
    const map = this.adapter;
    const mapElement = this.mapElement;

    // Remove existing preview layers so colors can be applied fresh. This has to happen
    // *before* touching the source: removing the last layer that references a source is
    // what orphans and deletes it (see MapLayerService.removeLayer's ref-count cleanup),
    // so doing this after an addSource/setData below would silently drop the source we
    // just set right before the new layers try to attach to it — the fill/line/point adds
    // then fail with "source not found" (an async MapLibre error, not a thrown exception,
    // so it isn't caught below and previewLayersAdded still ends up true) and nothing
    // renders. Concretely: this is a second call to showPreviewLayers for a result whose
    // preview is already showing — which happens on every click-to-zoom, since the title
    // button's own `@focus` handler re-triggers the preview a moment after `@mouseenter`.
    for (const lid of this.previewLayerIds) {
      if (map.hasLayer(lid)) mapElement.removeInlineLayer(lid);
    }

    // Update or create source
    try {
      const existing = map.getSource(this.previewSourceId as string);
      if (existing && typeof existing.setData === 'function') {
        existing.setData(featureCollection);
      } else {
        map.addSource(this.previewSourceId, { type: 'geojson', data: featureCollection });
      }
    } catch (e) {
      console.warn('preview source update failed', e);
    }

    try {
      await mapElement.addLayerRequest({ id: this.previewLayerIds[0], type: 'fill', source: this.previewSourceId, filter: ['in', '$type', 'Polygon'], metadata: { hideFromLegend: true, label: 'Search preview fill' }, paint: { 'fill-color': colors?.fill ?? '#f1c40f', 'fill-opacity': 0.25 } });
      await mapElement.addLayerRequest({ id: this.previewLayerIds[1], type: 'line', source: this.previewSourceId, filter: ['in', '$type', 'LineString', 'Polygon'], metadata: { hideFromLegend: true, label: 'Search preview line' }, paint: { 'line-color': colors?.line ?? '#f39c12', 'line-width': 3 } });
      await mapElement.addLayerRequest({ id: this.previewLayerIds[2], type: 'circle', source: this.previewSourceId, filter: ['==', '$type', 'Point'], metadata: { hideFromLegend: true, label: 'Search preview point' }, paint: { 'circle-color': colors?.point ?? '#e67e22', 'circle-radius': 6 } });
      this.previewLayersAdded = true;
    } catch (e) {
      console.warn('preview layers update failed', e);
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
    if (!this.adapter || !this.mapElement) return;
    const map = this.adapter;
    const mapElement = this.mapElement;
    for (const lid of this.previewLayerIds) {
      if (map.hasLayer(lid)) mapElement.removeInlineLayer(lid);
    }
    try { map.removeSource(this.previewSourceId); } catch (_e) { /* ignore */ }
    this.previewLayersAdded = false;
  }

  private showPreviewForFeature(feature: GeoJSON.Feature) {
    const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [feature] };
    const info = this.persistedMap.get(feature as any);
    const colors = info?.color
      ? (() => { const d = this.darkenHex(info.color, 0.18); return { fill: d, line: d, point: d }; })()
      : undefined;
    this.showPreviewLayers(fc, colors);
  }

  private onResultLayerToggle(feature: GeoJSON.Feature, e: Event) {
    // Stop propagation so the parent list item doesn't also handle the click
    try { e.stopPropagation(); } catch (_err) { /* ignore */ }

    if (this.isPersisted(feature)) {
      this.removePersistedFeature(feature);
      this.persistedChanged(feature, false);
    } else {
      this.clearPreview();
      this.addPersistedFeature(feature);
      this.persistedChanged(feature, true);
      this.openLegendIfClosed();
    }
    // Ensure UI updates
    this.requestUpdate();
  }

  // The layer-toggle icon is a one-time "add" action, not a switch — pressing it never
  // promises a control the user can find here again. This is what makes that promise good:
  // if the legend isn't already showing, bring it forward the same way its own toolbar
  // button would, so the user actually sees where the result landed. Works regardless of
  // layout (shared panel, standalone, inside a toolbox/menu) because it goes through the
  // same 'webmapx-tool-select' event every toolbar button uses, and only acts when the
  // legend element itself reports hidden — the single source of truth every container
  // (webmapx-tool-panel, toolbox, menu) already writes to.
  private openLegendIfClosed(): void {
    const legendEl = this.mapElement?.querySelector<HTMLElement>('webmapx-layer-overview');
    if (!legendEl || !legendEl.hidden) return;
    const toolId = legendEl.getAttribute('tool-id') || legendEl.getAttribute('data-tool') || legendEl.getAttribute('name');
    if (!toolId) return;
    this.dispatchEvent(new CustomEvent('webmapx-tool-select', {
      detail: { toolId, previousToolId: null, sourceToolbar: null },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    return html`
      <div class="container tool-content">
        <div class="searchbox">
          <input
            type="text"
            name="${this.searchInputName}"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="Search cities, rivers, mountains…"
            .value="${this.query}"
            @input="${(e: Event) => { this.query = (e.target as HTMLInputElement).value; }}"
            @keyup="${(e: KeyboardEvent) => this.handleKey(e)}"
          />
          <button class="go-button webmapx-control" type="button" aria-label="Search" title="Search" @click="${() => this.doSearch()}">${this.searchIcon}</button>
        </div>

        <div class="results">
          ${this.searching ? html`<div>Searching...</div>` : ''}
          ${!this.results ? html`` : html`
            <div style="display:flex; flex-direction:column; gap:2px; padding:2px 6px; font-size:11px; color:var(--color-text-secondary); border-bottom:1px solid var(--color-border);">
              <span>Hover to preview | Click to zoom</span>
              <span>Add as map layer with +</span>
            </div>
            <ul>
              ${(this.results.features || []).map((f, i) => html`
                <li class="result-item" ?selected=${i === this.selectedIndex}
                    @mouseenter=${() => this.showPreviewForFeature(f)}
                    @mouseleave=${() => this.clearPreview()}>
                  <button type="button" class="result-select" @click=${() => this.handleSelect(f)}
                          @focus=${() => this.showPreviewForFeature(f)}
                          @blur=${() => this.clearPreview()}>
                    <span class="result-title">${this.renderResultTitle(f)}</span>
                    ${(() => {
                      const meta = f.properties ? (f.properties.type || f.properties.category || '') : '';
                      if (!meta) return '';
                      const kind = this.geometryKind(f.geometry?.type);
                      return html`<span class="meta"><span class="geom-icon">${this.geometryKindIcon(kind)}</span>${meta}</span>`;
                    })()}
                  </button>
                  <button
                    type="button"
                    class="layer-toggle"
                    aria-pressed=${this.isPersisted(f) ? 'true' : 'false'}
                    data-added=${this.isPersisted(f) ? 'true' : 'false'}
                    title=${this.isPersisted(f) ? 'Remove from map' : 'Add as map layer'}
                    @click=${(e: Event) => this.onResultLayerToggle(f, e)}>
                    ${this.layerToggleIcon}
                  </button>
                </li>
              `)}
            </ul>
          `}
        </div>
      </div>
    `;
  }
}
