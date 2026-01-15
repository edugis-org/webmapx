import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import { IAppState } from '../../store/IState';

type LngLatTuple = [number, number]; // [lng, lat]
type PointerResolution = { lng: number; lat: number };
const DEFAULT_DEGREE_STEP = 1 / 1000; // ~0.001° fallback

// Cardinal direction translations
// To add a new language, simply add a new entry with the language code and translations for N, E, S, W
const CARDINAL_DIRECTIONS: Record<string, { N: string; E: string; S: string; W: string }> = {
  en: { N: 'N', E: 'E', S: 'S', W: 'W' },
  nl: { N: 'N', E: 'O', S: 'Z', W: 'W' }, // Dutch: Noord, Oost, Zuid, West
  fr: { N: 'N', E: 'E', S: 'S', W: 'O' }, // French: Nord, Est, Sud, Ouest
  de: { N: 'N', E: 'O', S: 'S', W: 'W' }, // German: Nord, Ost, Süd, West
  es: { N: 'N', E: 'E', S: 'S', W: 'O' }, // Spanish: Norte, Este, Sur, Oeste
};

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
  private showPopup: boolean = false;

  @state()
  private popupDirection: 'up' | 'down' = 'up';

  @query('.click-row')
  private clickRowElement?: HTMLElement;

  static styles = css`
    :host {
      display: inline-flex;
      pointer-events: auto;
      font-size: var(--font-size-small);
      position: relative;
    }

    .coordinates-shell {
      display: inline-flex;
      flex-direction: column;
      border: 1px solid var(--color-border);
      background: var(--color-background-secondary);
      color: var(--color-text-primary);
      padding: var(--compact-padding-vertical) var(--compact-padding-horizontal);
      font-variant-numeric: tabular-nums;
      line-height: 1.3;
      min-width: 150px;
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

    .click-row {
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .click-row:hover {
      background-color: var(--color-background-hover, rgba(0, 0, 0, 0.05));
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
      z-index: 1000;
      background: var(--color-background-primary, #ffffff);
      border: 1px solid var(--color-border);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 8px;
      min-width: 250px;
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
      transition: background-color 0.15s ease;
    }

    .format-line:hover {
      background-color: var(--color-background-hover, rgba(0, 0, 0, 0.05));
    }

    .format-line + .format-line {
      border-top: 1px solid var(--color-border-light, #e0e0e0);
    }

    .format-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .format-label {
      font-size: 0.75em;
      color: var(--color-text-secondary, #666);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .format-value {
      font-family: monospace;
      font-size: 0.9em;
      color: var(--color-text-primary, #000);
    }

    .copy-button {
      flex-shrink: 0;
      padding: 4px 8px;
      background: transparent;
      border: 1px solid var(--color-border, #ccc);
      border-radius: 3px;
      cursor: pointer;
      color: var(--color-text-primary, #000);
      font-size: 0.85em;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .copy-button:hover {
      background: var(--color-primary, #007acc);
      color: white;
      border-color: var(--color-primary, #007acc);
    }

    .copy-button:active {
      transform: scale(0.95);
    }

    .copy-icon {
      width: 14px;
      height: 14px;
    }
  `;

  protected onStateChanged(state: IAppState): void {
    this.cursorCoords = state.pointerCoordinates;
    this.pinnedCoords = state.lastClickedCoordinates;
    this.resolution = state.pointerResolution;
    this.pinnedResolution = state.lastClickedResolution;
  }

  private formatPair(coords: LngLatTuple | null, resolution: PointerResolution | null): string {
    if (!coords) {
      return '—';
    }
    const [lng, lat] = coords;
    const latText = this.formatCoordinate(lat, 'lat', resolution, 'en');
    const lngText = this.formatCoordinate(lng, 'lng', resolution, 'en');
    return `${latText}  ${lngText}`;
  }

  private renderClickRow(): TemplateResult | typeof nothing {
    if (!this.pinnedCoords) {
      return nothing;
    }

    return html`
      <div class="value-line click-row" @click=${this.handleClickRowClick}>
        <span class="click-label">Click</span>
        <span class="value">${this.formatPair(this.pinnedCoords, this.pinnedResolution)}</span>
      </div>
      ${this.renderPopup()}
    `;
  }

  private renderPopup(): TemplateResult | typeof nothing {
    if (!this.showPopup || !this.pinnedCoords) {
      return nothing;
    }

    const [lng, lat] = this.pinnedCoords;
    
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
      </div>
    `;
  }

  protected render(): TemplateResult {
    return html`
      <div class="coordinates-shell" role="status" aria-live="polite">
        <div class="value-line">
          <span class="value">${this.formatPair(this.cursorCoords, this.resolution)}</span>
        </div>
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

  private shouldShowLocalizedFormat(): boolean {
    const browserLang = this.getBrowserLanguage();
    // Show localized format if browser language is supported and not English
    return browserLang !== 'en' && CARDINAL_DIRECTIONS.hasOwnProperty(browserLang);
  }

  private handleClickRowClick(e: MouseEvent): void {
    e.stopPropagation();
    
    if (!this.clickRowElement) {
      return;
    }

    // Determine popup direction based on available space
    const rect = this.clickRowElement.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    
    // Popup is approximately 150px tall, prefer upward if there's space
    this.popupDirection = spaceAbove >= 150 ? 'up' : 'down';
    this.showPopup = !this.showPopup;
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
    if (this.showPopup) {
      const target = e.target as Node;
      if (!this.shadowRoot?.contains(target)) {
        this.showPopup = false;
      }
    }
  };

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this.handleOutsideClick);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleOutsideClick);
  }
}
