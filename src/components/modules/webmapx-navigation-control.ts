import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapAdapter } from '../../map/IMapAdapter';
import type { IAppState } from '../../store/IState';
import type { ViewChangeEndEvent, ViewChangeEvent } from '../../store/map-events';
import type { NavigationCapabilities } from '../../map/IMapInterfaces';

type Orientation = 'vertical' | 'horizontal';

@customElement('webmapx-navigation-control')
export class WebmapxNavigationControl extends WebmapxBaseTool {
  @property({ type: String, reflect: true })
  orientation: Orientation = 'vertical';

  @property({ type: Boolean, attribute: 'show-compass', reflect: true })
  showCompass = true;

  @property({ type: Boolean, attribute: 'show-zoom', reflect: true })
  showZoom = true;

  @property({ type: Boolean, attribute: 'visualize-pitch', reflect: true })
  visualizePitch = true;

  @state()
  private currentZoom: number | null = null;

  @state()
  private bearing = 0;

  @state()
  private pitch = 0;

  @state()
  private compassSupported = false;

  private unsubscribeEvents: Array<() => void> = [];
  private zoomMin: number | null = null;
  private zoomMax: number | null = null;
  private compassRect: DOMRect | null = null;
  private compassPointerId: number | null = null;
  private startBearing = 0;
  private startPitch = 0;
  private startPointer: { x: number; y: number } | null = null;

  static styles = css`
    :host {
      display: inline-flex;
      pointer-events: auto;
      font-size: var(--font-size-small, 12px);
      color: var(--color-text-primary, #1a1a1a);
    }

    .nav-shell {
      display: inline-flex;
      background: var(--color-surface, #ffffff);
      border: 1px solid var(--color-border, #cccccc);
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
      overflow: hidden;
      border-radius: 8px;
    }

    :host([orientation='vertical']) .nav-shell {
      flex-direction: column;
    }

    :host([orientation='horizontal']) .nav-shell {
      flex-direction: row;
    }

    .nav-btn {
      appearance: none;
      border: none;
      background: transparent;
      padding: 10px;
      min-width: 36px;
      min-height: 36px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: inherit;
      transition: background 120ms ease, transform 120ms ease;
    }

    .nav-btn + .nav-btn {
      border-top: 1px solid var(--color-border, #cccccc);
    }

    :host([orientation='horizontal']) .nav-btn + .nav-btn {
      border-top: none;
      border-left: 1px solid var(--color-border, #cccccc);
    }

    .nav-btn:hover:not(:disabled) {
      background: var(--color-background-secondary, #f4f4f4);
    }

    .nav-btn:active:not(:disabled) {
      transform: scale(0.98);
    }

    .nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .icon {
      font-weight: 600;
      font-size: 14px;
      line-height: 1;
      user-select: none;
    }

    .compass-body {
      position: relative;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 1.5px solid var(--color-border, #cccccc);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--color-background, #ffffff);
      transform-style: preserve-3d;
      transition: transform 120ms ease;
    }

    .compass-arrow {
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 10px solid var(--color-primary, #007bff);
      transform-origin: center 70%;
      filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
    }
  `;

  protected onMapAttached(adapter: IMapAdapter): void {
    this.cleanup();
    this.compassSupported = this.resolveCompassSupport(adapter);
    this.zoomMin = this.mapConfig?.minZoom ?? null;
    this.zoomMax = this.mapConfig?.maxZoom ?? null;

    const view = adapter.core.getViewportState();
    this.currentZoom = view.zoom;
    this.bearing = view.bearing ?? 0;
    this.pitch = view.pitch ?? 0;

    const viewHandler = (evt: ViewChangeEvent | ViewChangeEndEvent) => {
      this.currentZoom = evt.zoom;
      this.bearing = evt.bearing ?? 0;
      this.pitch = evt.pitch ?? 0;
    };

    this.unsubscribeEvents.push(adapter.events.on('view-change', viewHandler));
    this.unsubscribeEvents.push(adapter.events.on('view-change-end', viewHandler));
  }

  protected onMapDetached(): void {
    this.cleanup();
    this.currentZoom = null;
    this.bearing = 0;
    this.pitch = 0;
    this.compassSupported = false;
    this.zoomMin = null;
    this.zoomMax = null;
  }

  protected onStateChanged(state: IAppState): void {
    if (state.zoomLevel != null && state.zoomLevel !== this.currentZoom) {
      this.currentZoom = state.zoomLevel;
    }
  }

  private cleanup(): void {
    this.unsubscribeEvents.forEach((fn) => fn());
    this.unsubscribeEvents = [];
    this.releaseCompassPointer();
  }

  private resolveCompassSupport(adapter: IMapAdapter | null): boolean {
    const caps: NavigationCapabilities | null = adapter?.core.getNavigationCapabilities?.() ?? null;
    if (!caps) return false;
    return Boolean(caps.bearing || (this.visualizePitch && caps.pitch));
  }

  private clampZoom(next: number): number {
    let value = next;
    if (this.zoomMin !== null) value = Math.max(value, this.zoomMin);
    if (this.zoomMax !== null) value = Math.min(value, this.zoomMax);
    return value;
  }

  private clampPitch(next: number): number {
    return Math.max(0, Math.min(89, next));
  }

  private normalizeBearing(bearing: number): number {
    let value = bearing % 360;
    if (value > 180) value -= 360;
    if (value <= -180) value += 360;
    return value;
  }

  private handleZoomIn = () => {
    if (!this.adapter) return;
    const baseZoom = this.adapter.core.getViewportState().zoom ?? this.currentZoom ?? this.adapter.core.getZoom();
    const next = this.clampZoom(baseZoom + 1);
    this.adapter.core.setZoom(next);
  };

  private handleZoomOut = () => {
    if (!this.adapter) return;
    const baseZoom = this.adapter.core.getViewportState().zoom ?? this.currentZoom ?? this.adapter.core.getZoom();
    const next = this.clampZoom(baseZoom - 1);
    this.adapter.core.setZoom(next);
  };

  private handleCompassClick = () => {
    if (!this.adapter) return;
    const caps = this.adapter.core.getNavigationCapabilities?.();
    if (caps?.pitch && this.visualizePitch) {
      this.adapter.core.resetNorthPitch();
    } else {
      this.adapter.core.resetNorth();
    }
  };

  private handleCompassPointerDown = (event: PointerEvent) => {
    if (!this.adapter || !this.compassSupported) return;
    const target = event.currentTarget as HTMLElement | null;
    if (!target) return;
    event.preventDefault();
    this.compassPointerId = event.pointerId;
    this.compassRect = target.getBoundingClientRect();
    this.startBearing = this.bearing;
    this.startPitch = this.pitch;
    this.startPointer = { x: event.clientX, y: event.clientY };
    window.addEventListener('pointermove', this.handleCompassPointerMove);
    window.addEventListener('pointerup', this.handleCompassPointerUp);
  };

  private handleCompassPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== this.compassPointerId || !this.adapter || !this.compassRect) return;
    const caps = this.adapter.core.getNavigationCapabilities?.();
    const cx = this.compassRect.left + this.compassRect.width / 2;
    const cy = this.compassRect.top + this.compassRect.height / 2;
    const angle = Math.atan2(event.clientY - cy, event.clientX - cx);
    const startAngle = Math.atan2((this.startPointer?.y ?? cy) - cy, (this.startPointer?.x ?? cx) - cx);
    const deltaDeg = (angle - startAngle) * (180 / Math.PI);
    if (caps?.bearing) {
      const targetBearing = this.normalizeBearing(this.startBearing - deltaDeg);
      this.adapter.core.setBearing(targetBearing);
      this.bearing = targetBearing;
    }
    if (caps?.pitch && this.visualizePitch && this.startPointer) {
      const deltaY = event.clientY - this.startPointer.y;
      const targetPitch = this.clampPitch(this.startPitch - deltaY * 0.35);
      this.adapter.core.setPitch(targetPitch);
      this.pitch = targetPitch;
    }
  };

  private handleCompassPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== this.compassPointerId) return;
    this.releaseCompassPointer();
  };

  private releaseCompassPointer(): void {
    this.compassPointerId = null;
    this.compassRect = null;
    this.startPointer = null;
    window.removeEventListener('pointermove', this.handleCompassPointerMove);
    window.removeEventListener('pointerup', this.handleCompassPointerUp);
  }

  private renderCompass() {
    const transformPieces: string[] = [];
    transformPieces.push(`rotate(${this.normalizeBearing(-this.bearing)}deg)`);
    if (this.visualizePitch) {
      transformPieces.unshift(`rotateX(${this.pitch}deg)`);
    }
    const transform = transformPieces.join(' ');

    return html`
      <button
        class="nav-btn"
        @click=${this.handleCompassClick}
        @pointerdown=${this.handleCompassPointerDown}
        title="Reset north"
        aria-label="Compass reset"
      >
        <span class="compass-body" style=${`transform: ${transform};`}>
          <span class="compass-arrow"></span>
        </span>
      </button>
    `;
  }

  protected render() {
    const showCompass = this.showCompass && this.compassSupported;
    const zoomMin = this.zoomMin ?? Number.NEGATIVE_INFINITY;
    const zoomMax = this.zoomMax ?? Number.POSITIVE_INFINITY;
    const zoomValue = this.currentZoom ?? 0;

    return html`
      <div class="nav-shell">
        ${this.showZoom
          ? html`<button class="nav-btn" @click=${this.handleZoomIn} ?disabled=${zoomValue >= zoomMax} title="Zoom in">
              <span class="icon">+</span>
            </button>`
          : null}
        ${this.showZoom
          ? html`<button class="nav-btn" @click=${this.handleZoomOut} ?disabled=${zoomValue <= zoomMin} title="Zoom out">
              <span class="icon">-</span>
            </button>`
          : null}
        ${showCompass ? this.renderCompass() : null}
      </div>
    `;
  }
}
