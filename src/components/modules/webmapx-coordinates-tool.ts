import { css, html, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import { IAppState } from '../../store/IState';

type LngLatTuple = [number, number]; // [lng, lat]
type PointerResolution = { lng: number; lat: number };
const DEFAULT_DEGREE_STEP = 1 / 1000; // ~0.001° fallback

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

  static styles = css`
    :host {
      display: inline-flex;
      pointer-events: auto;
      font-size: var(--font-size-small);
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
    const latText = this.formatCoordinate(lat, 'lat', resolution);
    const lngText = this.formatCoordinate(lng, 'lng', resolution);
    return `${latText}  ${lngText}`;
  }

  private renderClickRow(): TemplateResult | typeof nothing {
    if (!this.pinnedCoords) {
      return nothing;
    }

    return html`
      <div class="value-line">
        <span class="click-label">Click</span>
        <span class="value">${this.formatPair(this.pinnedCoords, this.pinnedResolution)}</span>
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

  private formatCoordinate(value: number, axis: 'lat' | 'lng', resolution: PointerResolution | null): string {
    const step = this.getDegreeStep(axis, resolution);
    const quantized = this.quantize(value, step);
    const direction = axis === 'lat' ? (quantized >= 0 ? 'N' : 'S') : (quantized >= 0 ? 'E' : 'W');
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
}
