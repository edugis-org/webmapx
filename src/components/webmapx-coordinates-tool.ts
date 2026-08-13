import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import { IMapState } from '../store/IMapState';
import { epsgLookupManager } from '../utils/epsg-lookup-manager';

type LngLatTuple = [number, number]; // [lng, lat]
type PointerResolution = { lng: number; lat: number };
const DEFAULT_DEGREE_STEP = 1 / 1000; // ~0.001° fallback

type CursorFormat = 'lonlat' | 'latlon' | 'geographic-en' | 'geographic-local' | `crs:${string}`;

// Cardinal direction translations
// To add a new language, simply add a new entry with the language code and translations for N, E, S, W
const CARDINAL_DIRECTIONS: Record<string, { N: string; E: string; S: string; W: string }> = {
  en: { N: 'N', E: 'E', S: 'S', W: 'W' },
  nl: { N: 'N', E: 'O', S: 'Z', W: 'W' }, // Dutch: Noord, Oost, Zuid, West
  fr: { N: 'N', E: 'E', S: 'S', W: 'O' }, // French: Nord, Est, Sud, Ouest
  de: { N: 'N', E: 'O', S: 'S', W: 'W' }, // German: Nord, Ost, Süd, West
  es: { N: 'N', E: 'E', S: 'S', W: 'O' }, // Spanish: Norte, Este, Sur, Oeste
};

interface LocalCRS {
  code: string;
  name: string;
  coords?: string;
  accuracy?: string;
}

// Lazy-loaded modules
let proj4Module: any = null;
let epsgDefinitions: any = null;

@customElement('webmapx-coordinates-tool')
export class WebmapxCoordinatesTool extends WebmapxBaseTool {
  @state()
  private cursorCoords: LngLatTuple | null = null;

  @state()
  private pinnedCoords: LngLatTuple | null = null;

  @state()
  private resolution: PointerResolution | null = null;

  @state()
  private pinnedResolution: PointerResolution | null = null;

  @state()
  private mapCenter: LngLatTuple | null = null;

  @state()
  private showPopup: boolean = false;

  @state()
  private popupDirection: 'up' | 'down' = 'up';

  @state()
  private showCursorFormatPopup: boolean = false;

  @state()
  private cursorFormatPopupDirection: 'up' | 'down' = 'up';

  @state()
  private selectedCursorFormat: CursorFormat = 'geographic-en';

  @state()
  private localCRS: LocalCRS[] = [];

  @state()
  private loadingCRS: boolean = false;

  @state()
  private cursorFormatLocalCRS: LocalCRS[] = [];

  @state()
  private loadingCursorFormatCRS: boolean = false;

  @query('.click-row')
  private clickRowElement?: HTMLElement;

  @query('.cursor-row')
  private cursorRowElement?: HTMLElement;

  static styles = css`
    :host {
      display: inline-flex;
      pointer-events: auto;
      font-size: var(--webmapx-coordinates-font-size, var(--font-size-small));
      position: relative;
    }

    .coordinates-shell {
      display: inline-flex;
      flex-direction: column;
      border: var(--webmapx-coordinates-border, 1px solid var(--color-border));
      background: var(--webmapx-coordinates-bg, var(--color-background-secondary));
      color: var(--webmapx-coordinates-color, var(--color-text-primary));
      padding: var(--compact-padding-vertical) var(--compact-padding-horizontal);
      font-variant-numeric: tabular-nums;
      line-height: 1.3;
      min-width: 150px;
      pointer-events: auto;
    }

    .value-line {
      display: flex;
      align-items: center;
      gap: var(--compact-gap);
      white-space: nowrap;
    }

    .value-line + .value-line {
      border-top: 1px solid var(--color-border-light);
      padding-top: var(--compact-padding-vertical);
      margin-top: var(--compact-padding-vertical);
    }

    .click-row, .cursor-row {
      position: relative;
      width: 100%;
      padding: 0;
      border: 0;
      background: transparent;
      font: inherit;
      color: inherit;
      text-align: left;
      cursor: pointer;
      transition: background-color var(--webmapx-motion-fast, 120ms) ease;
      pointer-events: auto;
    }

    .click-row:hover, .cursor-row:hover {
      background-color: var(--color-background-hover, rgba(0, 0, 0, 0.05));
    }

    .format-line.active-format {
      background-color: var(--color-background-hover, rgba(0, 0, 0, 0.05));
    }

    .format-line.active-format .format-label::after {
      content: ' ✓';
      color: var(--color-primary, #2b6c8f);
    }

    .value {
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    .click-label {
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 600;
      color: var(--color-text-secondary);
      font-size: 0.75em;
    }

    .popup-container {
      position: absolute;
      left: 0;
      right: 0;
      background: var(--color-background, #fff);
      border: 1px solid var(--color-border);
      box-shadow: var(--webmapx-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.15));
      padding: 8px;
      min-width: 250px;
      max-width: 400px;
      pointer-events: auto;
    }

    .popup-container.direction-up {
      bottom: 100%;
      margin-bottom: 4px;
    }

    .popup-container.direction-down {
      top: 100%;
      margin-top: 4px;
    }

    .format-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 8px;
      gap: 12px;
      transition: background-color var(--webmapx-motion-fast, 120ms) ease;
    }

    .format-line:hover {
      background-color: var(--color-background-hover, rgba(0, 0, 0, 0.05));
    }

    .format-line + .format-line {
      border-top: 1px solid var(--color-border-light, #e2e7ec);
    }

    .format-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .format-label {
      font-size: 0.75em;
      color: var(--color-text-secondary, #5a6773);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .format-value {
      font-family: monospace;
      font-size: 0.9em;
      color: var(--color-text-primary, #16202a);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .copy-button {
      flex-shrink: 0;
      padding: 4px 8px;
      background: transparent;
      border: 1px solid var(--color-border, #d5dce3);
      border-radius: var(--webmapx-radius-xs, 3px);
      cursor: pointer;
      color: var(--color-text-primary, #16202a);
      font-size: 0.85em;
      transition: all var(--webmapx-motion-fast, 120ms) ease;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .copy-button:hover {
      background: var(--color-primary, #2b6c8f);
      color: white;
      border-color: var(--color-primary, #2b6c8f);
    }

    .copy-button:active {
      transform: scale(0.95);
    }

    .copy-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .copy-icon {
      width: 14px;
      height: 14px;
    }

    .loading-indicator {
      padding: 8px;
      text-align: center;
      color: var(--color-text-secondary, #5a6773);
      font-size: 0.85em;
      font-style: italic;
    }

    .crs-section-header {
      padding: 8px;
      font-size: 0.75em;
      color: var(--color-text-secondary, #5a6773);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      background: var(--color-background-hover, rgba(0, 0, 0, 0.02));
      margin: 4px 0;
    }

    .accuracy-note {
      font-size: 0.7em;
      color: var(--color-text-secondary, #5a6773);
      font-style: italic;
      margin-top: 2px;
    }
  `;

  protected onStateChanged(state: IMapState): void {
    this.cursorCoords = state.pointerCoordinates;
    const previousPinnedCoords = this.pinnedCoords;
    this.pinnedCoords = state.lastClickedCoordinates;
    this.resolution = state.pointerResolution;
    this.pinnedResolution = state.lastClickedResolution;
    this.mapCenter = state.mapCenter;

    // Fetch local CRS only if popup is visible and coordinates changed
    if (this.showPopup && this.pinnedCoords && this.pinnedCoords !== previousPinnedCoords) {
      this.fetchLocalCRS(this.pinnedCoords);
    }
  }

  private formatPair(coords: LngLatTuple | null, resolution: PointerResolution | null): string {
    if (!coords) {
      return '—';
    }
    return this.formatWithMode(coords, resolution, this.selectedCursorFormat);
  }

  private formatWithMode(coords: LngLatTuple, resolution: PointerResolution | null, format: CursorFormat): string {
    if (format === 'lonlat') return this.formatLonLat(coords, resolution);
    if (format === 'latlon') return this.formatLatLon(coords, resolution);
    if (format === 'geographic-local') return this.formatGeographic(coords, resolution, this.getBrowserLanguage());
    if (format.startsWith('crs:')) {
      const code = format.slice(4);
      return this.transformCoordinatesClientSide(coords, code);
    }
    // default: geographic-en
    const [lng, lat] = coords;
    const latText = this.formatCoordinate(lat, 'lat', resolution, 'en');
    const lngText = this.formatCoordinate(lng, 'lng', resolution, 'en');
    return `${latText}, ${lngText}`;
  }

  private renderCursorRow(): TemplateResult {
    return html`
      <button type="button" class="value-line cursor-row" aria-label="Cursor coordinate format"
        aria-expanded=${this.showCursorFormatPopup} @click=${this.handleCursorRowClick}>
        <span class="value">${this.formatPair(this.cursorCoords, this.resolution)}</span>
      </button>
      ${this.renderCursorFormatPopup()}
    `;
  }

  private renderCursorFormatPopup(): TemplateResult | typeof nothing {
    if (!this.showCursorFormatPopup) return nothing;

    // Use map center as example coords when cursor is not available
    const exampleCoords: LngLatTuple | null = this.cursorCoords ?? this.mapCenter;
    const exampleRes = this.cursorCoords ? this.resolution : null;

    const makeLine = (key: CursorFormat, label: string, value: string, disabled = false) => html`
      <button
        type="button"
        class="format-line ${this.selectedCursorFormat === key ? 'active-format' : ''}"
        ?disabled=${disabled}
        aria-pressed=${this.selectedCursorFormat === key}
        @click=${disabled ? nothing : (e: MouseEvent) => { e.stopPropagation(); this.selectedCursorFormat = key; this.showCursorFormatPopup = false; }}
        style="${disabled ? 'opacity:0.5;cursor:default' : 'cursor:pointer'};width:100%;border:0;background:transparent;font:inherit;color:inherit;text-align:left"
      >
        <div class="format-content">
          <div class="format-label">${label}</div>
          <div class="format-value">${value}</div>
        </div>
      </button>
    `;

    return html`
      <div class="popup-container direction-${this.cursorFormatPopupDirection}" @click=${(e: MouseEvent) => e.stopPropagation()}>
        ${exampleCoords ? html`
          ${makeLine('geographic-en', 'Geographic (English)', this.formatGeographic(exampleCoords, exampleRes, 'en'))}
          ${makeLine('geographic-local', `Geographic (${this.getLocalFormatLabel()})`, this.formatGeographic(exampleCoords, exampleRes, this.getBrowserLanguage()))}
          ${makeLine('lonlat', 'Lon, Lat', this.formatLonLat(exampleCoords, exampleRes))}
          ${makeLine('latlon', 'Lat, Lon', this.formatLatLon(exampleCoords, exampleRes))}
        ` : nothing}

        ${this.loadingCursorFormatCRS ? html`<div class="loading-indicator">Loading local coordinate systems...</div>` : nothing}

        ${this.cursorFormatLocalCRS.length > 0 && exampleCoords ? html`
          <div class="crs-section-header">Local Coordinate Systems</div>
          ${this.cursorFormatLocalCRS.map(crs => {
            const key: CursorFormat = `crs:${crs.code}`;
            return makeLine(key, `${crs.name} (${crs.code})`, exampleCoords ? (this.transformCoordinatesClientSide(exampleCoords, crs.code) ?? '…') : '…');
          })}
        ` : nothing}
      </div>
    `;
  }

  private renderClickRow(): TemplateResult | typeof nothing {
    if (!this.pinnedCoords) {
      return nothing;
    }

    return html`
      <button type="button" class="value-line click-row" aria-label="Clicked coordinate"
        aria-expanded=${this.showPopup} @click=${this.handleClickRowClick}>
        <span class="click-label">Click</span>
        <span class="value">${this.formatPair(this.pinnedCoords, this.pinnedResolution)}</span>
      </button>
      ${this.renderPopup()}
    `;
  }

  private renderPopup(): TemplateResult | typeof nothing {
    if (!this.showPopup || !this.pinnedCoords) {
      return nothing;
    }

    return html`
      <div class="popup-container direction-${this.popupDirection}" @click=${(e: MouseEvent) => e.stopPropagation()}>
        <div class="format-line">
          <div class="format-content">
            <div class="format-label">Lon, Lat</div>
            <div class="format-value">${this.formatLonLat(this.pinnedCoords, this.pinnedResolution)}</div>
          </div>
          <button 
            class="copy-button" 
            @click=${(e: MouseEvent) => this.copyToClipboard(this.formatLonLat(this.pinnedCoords!, this.pinnedResolution), e)}
            title="Copy to clipboard"
          >
            <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
        
        <div class="format-line">
          <div class="format-content">
            <div class="format-label">Lat, Lon</div>
            <div class="format-value">${this.formatLatLon(this.pinnedCoords, this.pinnedResolution)}</div>
          </div>
          <button 
            class="copy-button" 
            @click=${(e: MouseEvent) => this.copyToClipboard(this.formatLatLon(this.pinnedCoords!, this.pinnedResolution), e)}
            title="Copy to clipboard"
          >
            <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
        
        <div class="format-line">
          <div class="format-content">
            <div class="format-label">Geographic (English)</div>
            <div class="format-value">${this.formatGeographic(this.pinnedCoords, this.pinnedResolution, 'en')}</div>
          </div>
          <button 
            class="copy-button" 
            @click=${(e: MouseEvent) => this.copyToClipboard(this.formatGeographic(this.pinnedCoords!, this.pinnedResolution, 'en'), e)}
            title="Copy to clipboard"
          >
            <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
        
        ${this.shouldShowLocalizedFormat() ? html`
          <div class="format-line">
            <div class="format-content">
              <div class="format-label">Geographic (${this.getLanguageName(this.getBrowserLanguage())})</div>
              <div class="format-value">${this.formatGeographic(this.pinnedCoords, this.pinnedResolution, this.getBrowserLanguage())}</div>
            </div>
            <button 
              class="copy-button" 
              @click=${(e: MouseEvent) => this.copyToClipboard(this.formatGeographic(this.pinnedCoords!, this.pinnedResolution, this.getBrowserLanguage()), e)}
              title="Copy to clipboard"
            >
              <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        ` : nothing}

        ${this.loadingCRS ? html`
          <div class="loading-indicator">Loading local coordinate systems...</div>
        ` : nothing}

        ${this.localCRS.length > 0 ? html`
          <div class="crs-section-header">Local Coordinate Systems</div>
          ${this.localCRS.map(crs => html`
            <div class="format-line">
              <div class="format-content">
                <div class="format-label">${crs.name} (${crs.code})</div>
                <div class="format-value">${crs.coords || 'Transforming...'}</div>
                ${crs.accuracy ? html`<div class="accuracy-note">Accuracy: ${crs.accuracy}</div>` : nothing}
              </div>
              <button 
                class="copy-button" 
                ?disabled=${!crs.coords}
                @click=${(e: MouseEvent) => crs.coords && this.copyToClipboard(crs.coords, e)}
                title="Copy to clipboard"
              >
                <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          `)}
        ` : nothing}
      </div>
    `;
  }

  protected render(): TemplateResult {
    return html`
      <div class="coordinates-shell" role="status" aria-live="polite" tabindex="0" aria-label="Cursor coordinates">
        ${this.renderCursorRow()}
        ${this.renderClickRow()}
      </div>
    `;
  }

  private formatCoordinate(value: number, axis: 'lat' | 'lng', resolution: PointerResolution | null, langCode: string = 'en'): string {
    const step = this.getDegreeStep(axis, resolution);
    const quantized = this.quantize(value, step);
    
    // Get cardinal directions for the specified language
    const directions = CARDINAL_DIRECTIONS[langCode] || CARDINAL_DIRECTIONS['en'];
    const direction = axis === 'lat' 
      ? (quantized >= 0 ? directions.N : directions.S) 
      : (quantized >= 0 ? directions.E : directions.W);
    
    const absDegrees = Math.abs(quantized);
    let degrees = Math.floor(absDegrees);
    let minutes = (absDegrees - degrees) * 60;

    if (minutes >= 59.9995) {
      degrees += 1;
      minutes = 0;
    }

    if (axis === 'lat' && degrees > 90) {
      degrees = 90;
      minutes = 0;
    }

    if (axis === 'lng' && degrees > 180) {
      degrees = 180;
      minutes = 0;
    }

    const minuteDecimals = this.computeMinuteDecimals(step * 60);
    const minuteText = minutes.toFixed(minuteDecimals);

    return `${degrees}° ${minuteText}' ${direction}`;
  }

  private getDegreeStep(axis: 'lat' | 'lng', resolution: PointerResolution | null): number {
    const fallback = DEFAULT_DEGREE_STEP;
    if (!resolution) {
      return fallback;
    }

    const raw = axis === 'lat' ? resolution.lat : resolution.lng;
    if (!isFinite(raw) || raw <= 0) {
      return fallback;
    }

    // Prevent denormalized values but keep actual precision when valid
    return Math.max(raw, 1e-12);
  }

  private quantize(value: number, step: number): number {
    if (!isFinite(step) || step <= 0) {
      return value;
    }
    return Math.round(value / step) * step;
  }

  private computeMinuteDecimals(stepMinutes: number): number {
    if (!isFinite(stepMinutes) || stepMinutes <= 0) {
      return 2;
    }

    const decimals = Math.ceil(-Math.log10(stepMinutes));
    if (decimals < 0) {
      return 0;
    }

    return Math.min(decimals, 6);
  }

  // Format conversions for the popup
  private getDecimalPrecision(resolution: PointerResolution | null, axis: 'lat' | 'lng'): number {
    if (!resolution) {
      return 6; // Default precision
    }
    
    const step = axis === 'lat' ? resolution.lat : resolution.lng;
    if (!isFinite(step) || step <= 0) {
      return 6;
    }
    
    // Calculate decimals needed based on resolution
    const decimals = Math.ceil(-Math.log10(step));
    // Clamp between 0 and 8 decimal places
    return Math.max(0, Math.min(decimals, 8));
  }

  private formatLonLat(coords: LngLatTuple, resolution: PointerResolution | null): string {
    const [lng, lat] = coords;
    const lngDecimals = this.getDecimalPrecision(resolution, 'lng');
    const latDecimals = this.getDecimalPrecision(resolution, 'lat');
    return `${lng.toFixed(lngDecimals)}, ${lat.toFixed(latDecimals)}`;
  }

  private formatLatLon(coords: LngLatTuple, resolution: PointerResolution | null): string {
    const [lng, lat] = coords;
    const lngDecimals = this.getDecimalPrecision(resolution, 'lng');
    const latDecimals = this.getDecimalPrecision(resolution, 'lat');
    return `${lat.toFixed(latDecimals)}, ${lng.toFixed(lngDecimals)}`;
  }

  private formatGeographic(coords: LngLatTuple, resolution: PointerResolution | null, langCode: string = 'en'): string {
    const [lng, lat] = coords;
    const latText = this.formatCoordinate(lat, 'lat', resolution, langCode);
    const lngText = this.formatCoordinate(lng, 'lng', resolution, langCode);
    return `${latText}, ${lngText}`;
  }

  private getBrowserLanguage(): string {
    // Get the browser language (e.g., 'en-US' or 'nl')
    const lang = navigator.language || (navigator as any).userLanguage || 'en';
    // Extract the language code (e.g., 'en' from 'en-US')
    return lang.split('-')[0].toLowerCase();
  }

  private getLanguageName(langCode: string): string {
    const languageNames: Record<string, string> = {
      nl: 'Nederlands',
      fr: 'Français',
      de: 'Deutsch',
      es: 'Español',
    };
    return languageNames[langCode] || langCode;
  }

  private getLocalFormatLabel(): string {
    const lang = this.getBrowserLanguage();
    const name = this.getLanguageName(lang);
    return name !== lang ? name : 'browser locale';
  }

  private shouldShowLocalizedFormat(): boolean {
    const browserLang = this.getBrowserLanguage();
    // Show localized format if browser language is supported and not English
    return browserLang !== 'en' && Object.prototype.hasOwnProperty.call(CARDINAL_DIRECTIONS, browserLang);
  }

  private handleCursorRowClick(e: MouseEvent): void {
    e.stopPropagation();
    // Close click popup if open
    this.showPopup = false;

    if (!this.cursorRowElement) return;

    const rect = this.cursorRowElement.getBoundingClientRect();
    const spaceAbove = rect.top;
    const estimatedHeight = 200 + (this.cursorFormatLocalCRS.length * 60);
    this.cursorFormatPopupDirection = spaceAbove >= estimatedHeight ? 'up' : 'down';

    const wasShown = this.showCursorFormatPopup;
    this.showCursorFormatPopup = !this.showCursorFormatPopup;

    if (!wasShown && this.showCursorFormatPopup) {
      const coords = this.cursorCoords ?? this.mapCenter;
      if (coords) {
        this.fetchCursorFormatCRS(coords);
      }
    }
  }

  private handleClickRowClick(e: MouseEvent): void {
    e.stopPropagation();
    // Close cursor format popup if open
    this.showCursorFormatPopup = false;

    if (!this.clickRowElement) {
      return;
    }

    // Determine popup direction based on available space
    const rect = this.clickRowElement.getBoundingClientRect();
    const spaceAbove = rect.top;

    // Popup is approximately 150px tall (more with local CRS), prefer upward if there's space
    const estimatedHeight = 150 + (this.localCRS.length * 60);
    this.popupDirection = spaceAbove >= estimatedHeight ? 'up' : 'down';
    
    const wasShown = this.showPopup;
    this.showPopup = !this.showPopup;
    
    // Fetch CRS when opening popup for the first time
    if (!wasShown && this.showPopup && this.pinnedCoords) {
      this.fetchLocalCRS(this.pinnedCoords);
    }
  }

  private async resolveCRS(coords: LngLatTuple): Promise<LocalCRS[]> {
    const [lng, lat] = coords;

    // Lazy load proj4 and EPSG definitions only on first use
    if (!proj4Module) {
      const [proj4Import, epsgImport] = await Promise.all([
        import('proj4'),
        import('../utils/epsg-definitions')
      ]);
      proj4Module = proj4Import.default;
      epsgDefinitions = epsgImport;

      // Register all EPSG definitions with proj4
      Object.entries(epsgDefinitions.EPSG_DEFS).forEach(([code, def]) => {
        proj4Module.defs(`EPSG:${code}`, def);
      });
    }

    // First, try to get country-specific EPSG codes from the lookup worker
    const epsgCodesMap: Map<string, {name: string; codes: string[]}> = new Map();

    try {
      const lookupResult = await epsgLookupManager.lookup(lat, lng);
      if (lookupResult.success && lookupResult.epsgCodes) {
        // Add primary country
        epsgCodesMap.set(lookupResult.countryCode!, {
          name: lookupResult.countryName!,
          codes: lookupResult.epsgCodes
        });

        // Add alternative countries (border areas)
        if (lookupResult.alternativeMatches && lookupResult.alternativeMatches.length > 0) {
          console.log(`Border area detected: ${lookupResult.alternativeMatches.length} additional countries`);
          for (const alt of lookupResult.alternativeMatches) {
            epsgCodesMap.set(alt.countryCode, {
              name: alt.countryName,
              codes: alt.epsgCodes
            });
          }
        }

        const countryNames = Array.from(epsgCodesMap.values()).map(c => c.name).join(', ');
        console.log(`Found EPSG codes for ${countryNames}`);
      }
    } catch (error) {
      console.warn('EPSG lookup worker failed, falling back to regional bounds:', error);
    }

    let applicableCRS: any[] = [];

    // If we got EPSG codes from the worker, use those
    if (epsgCodesMap.size > 0) {
      const allCodes: Array<{code: string; countryName: string}> = [];

      // Collect all codes from all countries (excluding 4326 as it's already shown as lat/lon)
      for (const [, {name, codes}] of epsgCodesMap) {
        for (const code of codes) {
          if (code !== '4326') {
            allCodes.push({code, countryName: name});
          }
        }
      }

      applicableCRS = allCodes.map(({code, countryName}) => {
        // Try to find the CRS in our regional definitions
        const existing = epsgDefinitions.REGIONAL_CRS.find((crs: any) => crs.code === code);
        if (existing) {
          return {
            ...existing,
            name: `${existing.name} (${countryName})`
          };
        }

        // If not found in predefined list, check if we have a proj4 definition
        const epsgKey = `EPSG:${code}`;
        const proj4Def = proj4Module.defs(epsgKey) || epsgDefinitions.EPSG_DEFS[code];

        if (proj4Def) {
          // Register it if we have the definition
          if (!proj4Module.defs(epsgKey)) {
            proj4Module.defs(epsgKey, proj4Def);
          }
          return {
            code,
            name: `EPSG:${code} (${countryName})`,
            bounds: [-180, -90, 180, 90],
            proj4: proj4Def
          };
        }

        return null;
      }).filter(Boolean);

      // Remove duplicates by code
      const uniqueCRS = new Map();
      for (const crs of applicableCRS) {
        if (!uniqueCRS.has(crs.code)) {
          uniqueCRS.set(crs.code, crs);
        }
      }
      applicableCRS = Array.from(uniqueCRS.values());
    }

    // Fall back to regional bounds if no codes from worker or if none were valid
    if (applicableCRS.length === 0) {
      applicableCRS = epsgDefinitions.REGIONAL_CRS.filter((crs: any) => {
        const [west, south, east, north] = crs.bounds;
        return lng >= west && lng <= east && lat >= south && lat <= north;
      });
    }

    // If still no CRS found, use UTM zone as final fallback
    if (applicableCRS.length === 0) {
      const utmZone = Math.floor((lng + 180) / 6) + 1;
      const isNorth = lat >= 0;
      const utmCode = isNorth ? `326${utmZone.toString().padStart(2, '0')}` : `327${utmZone.toString().padStart(2, '0')}`;

      // Register UTM zone if not already registered
      const epsgCode = `EPSG:${utmCode}`;
      if (!proj4Module.defs(epsgCode)) {
        const utmDef = `+proj=utm +zone=${utmZone} ${isNorth ? '' : '+south '}+datum=WGS84 +units=m +no_defs`;
        proj4Module.defs(epsgCode, utmDef);
      }

      applicableCRS.push({
        code: utmCode,
        name: `WGS 84 / UTM zone ${utmZone}${isNorth ? 'N' : 'S'}`,
        bounds: [-180, -90, 180, 90],
        proj4: proj4Module.defs(epsgCode)
      });
    }

    // Limit based on number of countries: 3 for single country, 5 for border areas
    const maxCRS = epsgCodesMap.size > 1 ? 5 : 3;
    const selectedCRS = applicableCRS.slice(0, maxCRS);

    return selectedCRS.map((crs: any) => ({
      code: crs.code,
      name: crs.name,
      coords: this.transformCoordinatesClientSide(coords, crs.code)
    }));
  }

  private async fetchLocalCRS(coords: LngLatTuple): Promise<void> {
    this.loadingCRS = true;
    this.localCRS = [];
    try {
      this.localCRS = await this.resolveCRS(coords);
    } catch (error) {
      console.error('Error determining local coordinate systems:', error);
    } finally {
      this.loadingCRS = false;
    }
  }

  private async fetchCursorFormatCRS(coords: LngLatTuple): Promise<void> {
    this.loadingCursorFormatCRS = true;
    this.cursorFormatLocalCRS = [];
    try {
      this.cursorFormatLocalCRS = await this.resolveCRS(coords);
    } catch (error) {
      console.error('Error determining local coordinate systems for cursor format:', error);
    } finally {
      this.loadingCursorFormatCRS = false;
    }
  }

  private transformCoordinatesClientSide(coords: LngLatTuple, epsgCode: string): string {
    if (!proj4Module) {
      return 'Error: proj4 not loaded';
    }

    try {
      const [lng, lat] = coords;
      // Transform from WGS84 (EPSG:4326) to target CRS
      const transformed = proj4Module('EPSG:4326', `EPSG:${epsgCode}`, [lng, lat]);
      
      if (!transformed || !Array.isArray(transformed)) {
        return 'Transformation failed';
      }
      
      const [x, y] = transformed;
      const precision = this.getTransformedPrecision(epsgCode);
      return `${x.toFixed(precision)}, ${y.toFixed(precision)}`;
    } catch (error) {
      console.error(`Error transforming to EPSG:${epsgCode}:`, error);
      return 'Transformation failed';
    }
  }

  private getTransformedPrecision(_epsgCode: string): number {
    // Most projected coordinate systems use meters, so 2 decimal places is usually sufficient
    // For specific systems, you could add custom precision rules
    return 2;
  }

  private async copyToClipboard(text: string, e: MouseEvent): Promise<void> {
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }

  private handleOutsideClick = (e: MouseEvent): void => {
    if (this.showPopup || this.showCursorFormatPopup) {
      const target = e.target as Node;
      if (!this.shadowRoot?.contains(target)) {
        this.showPopup = false;
        this.showCursorFormatPopup = false;
      }
    }
  };

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this.handleOutsideClick);
    this.subscribeToConfig();
  }

  protected override onConfigReady(_config: import('../config/types').AppConfig): void {
    const fmt = (this.toolsConfig?.coordinates as import('../config/types').CoordinatesToolConfig | undefined)?.defaultFormat;
    if (fmt) {
      this.selectedCursorFormat = fmt as CursorFormat;
      // Pre-load proj4 so the first render doesn't show an error string
      if (fmt.startsWith('crs:')) {
        this.ensureProj4Loaded();
      }
    }
  }

  private async ensureProj4Loaded(): Promise<void> {
    if (proj4Module) return;
    try {
      const [proj4Import, epsgImport] = await Promise.all([
        import('proj4'),
        import('../utils/epsg-definitions')
      ]);
      proj4Module = proj4Import.default;
      epsgDefinitions = epsgImport;
      Object.entries(epsgDefinitions.EPSG_DEFS).forEach(([code, def]) => {
        proj4Module.defs(`EPSG:${code}`, def);
      });
      // Trigger re-render so cursor value updates
      this.requestUpdate();
    } catch (e) {
      console.error('Failed to pre-load proj4:', e);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleOutsideClick);
  }
}
