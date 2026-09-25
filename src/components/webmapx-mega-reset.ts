// src/components/webmapx-mega-reset.ts
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMap } from '../map/IMapInterfaces';
import type { IMapState } from '../store/IMapState';
import { t } from '../i18n/i18n';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import { controlSurfaceStyles } from './internal/control-surface-styles';

interface CapturedView {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
}

/**
 * Oversized "back to the start" map control for kiosk/museum displays — an
 * `sl-button` (the same element every toolbar button and dialog action is
 * built from, `variant="default"`) so it picks up exactly the blue-accented
 * hover/focus/active treatment those already have, rather than a hand-tuned
 * approximation that can drift from Shoelace's own theme. "Mega" is done by
 * enlarging that same button — bigger padding/font (`::part(base)`), not a
 * different button style — so it reads at a glance on a touchscreen nobody
 * is standing close to.
 *
 * The view it restores is captured once, in `onMapAttached` — i.e. whatever
 * the map's camera actually was the moment this control finished loading,
 * which already reflects a permalink or session restore ahead of the config
 * default (the same priority `resolveInitOptions` applies). That is "the
 * initial view" a visitor should mean by "reset": where the map was standing
 * when they arrived, not necessarily the config author's `map.center`.
 */
@customElement('webmapx-mega-reset')
export class WebmapxMegaReset extends WebmapxBaseTool {
  // @state, not a plain field: `onMapAttached` can fire after this component's
  // first render (megaReset is lazy-loaded, so its module can resolve either
  // side of the map becoming ready) — a plain field's value would then never
  // reach the DOM, and the button would stay disabled forever, not just until
  // the map caught up.
  @state() private initialView: CapturedView | null = null;

  static styles = [
    controlSurfaceStyles,
    css`
      :host {
        display: inline-flex;
        pointer-events: auto;
      }

      sl-button {
        --sl-input-height-large: auto;
      }

      sl-button::part(base) {
        gap: var(--webmapx-mega-reset-gap, 10px);
        padding: var(--webmapx-mega-reset-padding, 16px 26px);
        border-radius: var(--webmapx-mega-reset-radius, var(--webmapx-surface-radius, 10px));
        font-size: var(--webmapx-mega-reset-font-size, 1.25rem);
        font-weight: 600;
      }

      sl-button::part(label) {
        white-space: nowrap;
      }

      /* sl-icon sizes itself from font-size (1em), so this sets its own
         rather than inheriting ::part(base)'s — deliberately bigger than the
         label text, not matched to it, so the icon reads at a glance. */
      sl-icon {
        font-size: var(--webmapx-mega-reset-icon-size, 2em);
        flex: 0 0 auto;
      }
    `,
  ];

  protected onMapAttached(adapter: IMap): void {
    this.captureInitialViewOnceLoaded(adapter);
  }

  protected onMapDetached(): void {
    this.initialView = null;
  }

  protected onStateChanged(state: IMapState): void {
    if (this.adapter) this.captureInitialViewOnceLoaded(this.adapter, state);
  }

  /**
   * `onMapAttached` can fire before the map has actually finished loading —
   * megaReset is lazy-loaded, so its module can resolve (and this component's
   * `connectedCallback` bind to the adapter) before the underlying engine has
   * called back with `mapLoaded`. `adapter.getViewportState()` at that point
   * doesn't report "not ready yet"; MapLibre's (and every other engine's) core
   * service just returns its hardcoded pre-init fallback — `{center:[0,0],
   * zoom:1,bearing:0,pitch:0}` — indistinguishable from a real, if odd, camera.
   * Captured then, "reset" would silently mean "fly to null island" instead of
   * the config's actual starting view. Gating on `store.mapLoaded` (already
   * how every other "is the map really ready" check in this codebase is done)
   * and retrying from `onStateChanged` once it flips true is what makes this
   * capture the real thing.
   */
  private captureInitialViewOnceLoaded(adapter: IMap, state?: IMapState): void {
    if (this.initialView) return;
    const mapLoaded = state?.mapLoaded ?? this.store?.getState().mapLoaded;
    if (!mapLoaded) return;
    const view = adapter.getViewportState();
    this.initialView = {
      center: view.center,
      zoom: view.zoom,
      bearing: view.bearing ?? 0,
      pitch: view.pitch ?? 0,
    };
  }

  private handleReset = (): void => {
    if (!this.adapter || !this.initialView) return;
    const { center, zoom, bearing, pitch } = this.initialView;
    // Bearing/pitch are written first, *instantly*, before the animated
    // center/zoom flight starts — not after. An animated flight is abandoned
    // by the very next camera write (see the compare tool's replay sync for
    // the same rule), so writing them after `setViewport` would cancel the
    // flight partway and the camera would settle somewhere between the
    // disturbed view and the target instead of arriving. Writing them first
    // is silent (nothing has painted yet in this tick) and leaves the flight
    // as the one animated call, free to run the same slow zoom-out/pan/
    // zoom-in curve a search result flies to.
    this.adapter.setBearing(bearing);
    this.adapter.setPitch(pitch);
    this.adapter.setViewport(center, zoom);
  };

  protected render() {
    const label = t('tools.megaReset');
    return html`
      <sl-button variant="default" ?disabled=${!this.initialView} @click=${this.handleReset} title=${label} aria-label=${label}>
        <sl-icon slot="prefix" name="arrow-counterclockwise" aria-hidden="true"></sl-icon>
        ${label}
      </sl-button>
    `;
  }
}
