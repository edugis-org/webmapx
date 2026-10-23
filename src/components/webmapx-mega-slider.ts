// src/components/webmapx-mega-slider.ts
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState, MapLayerStateEntry } from '../store/IMapState';
import type { IMap } from '../map/IMapInterfaces';
import { applyLayerTransparency } from '../utils/layer-transparency';

/**
 * Shown, and actually applied to the layer (once — see `recompute`), when the
 * top layer's `transparency` has never been set by anything: a config, a
 * permalink, or a previous drag. A blank slate starting fully opaque (0) would
 * hide the whole point of a crossfade slider behind the top layer until a
 * visitor first touches it; 50 opens on a blend of both, which is also what
 * a slider whose thumb starts in the middle should mean.
 */
const DEFAULT_TRANSPARENCY_PCT = 50;

/**
 * A single, oversized opacity slider for kiosk/museum displays — built for a
 * two-layer config where a visitor crossfades between them without needing to
 * open the legend at all.
 *
 * Floats above the map with breathing room on every side rather than hugging
 * the screen edge: placed in the `bottom-center` layout slot, whose zone is
 * already inset from the left/right/bottom edges by `--webmapx-layout-inset`
 * (the same margin every other corner/center control gets), and the shell
 * itself carries a radius and shadow so it reads as a floating bar rather
 * than a bar of map chrome. `:host` fills that (already inset) zone
 * width — the floating look, not a full-bleed one.
 *
 * It always targets whichever layer is currently topmost in the legend
 * (`store.mapLayers`, reversed — the same order `webmapx-layer-overview`
 * displays and the same rule it uses to auto-expand a layer's legend), not a
 * layer id fixed at load time: if a config is ever set up to reorder layers,
 * the slider keeps controlling whatever is now on top rather than silently
 * going stale. `hideFromLegend`/`legendRole: 'background'` layers are skipped
 * the same way the legend itself skips them when deciding what to show.
 *
 * The top layer's label sits on the left and its value is the store's
 * `transparency` directly (not opacity) — dragging right makes the top layer
 * *more* transparent, the same direction and the same value the legend's own
 * per-layer slider uses, so a visitor who has opened both never sees the two
 * disagree about which way is "more see-through".
 *
 * With no `transparency` set anywhere for the top layer, the slider opens at
 * `DEFAULT_TRANSPARENCY_PCT` (50) rather than 0 — see there for why.
 */
@customElement('webmapx-mega-slider')
export class WebmapxMegaSlider extends WebmapxBaseTool {
  @state() private topLayerId: string | null = null;
  @state() private topLayerLabel = '';
  @state() private bottomLayerLabel = '';
  /** 0 = top layer fully opaque, 100 = top layer fully transparent (bottom shows through). */
  @state() private transparencyPct = DEFAULT_TRANSPARENCY_PCT;
  /** Which layer id the default has already been written to, so it happens once, not on every store change while it stays unset. */
  private defaultedLayerId: string | null = null;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      pointer-events: none;
    }

    .shell {
      display: flex;
      align-items: center;
      gap: var(--webmapx-mega-slider-gap, 24px);
      width: 100%;
      box-sizing: border-box;
      padding: var(--webmapx-mega-slider-padding, 20px 32px);
      background: rgb(var(--color-surface-rgb, 255 255 255) / calc(var(--webmapx-surface-alpha, 1) * 0.92));
      -webkit-backdrop-filter: var(--webmapx-surface-blur, none);
      backdrop-filter: var(--webmapx-surface-blur, none);
      border-radius: var(--webmapx-mega-slider-radius, var(--webmapx-surface-radius, 16px));
      box-shadow: var(--webmapx-mega-slider-shadow, var(--webmapx-surface-shadow, 0 6px 20px rgba(16, 24, 40, 0.22)));
      pointer-events: auto;
    }

    .end-label {
      flex: 0 0 auto;
      max-width: 32%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--webmapx-mega-slider-label-size, 1.5rem);
      font-weight: 600;
      color: var(--color-text-primary, #16202a);
    }

    .end-label.end {
      text-align: right;
    }

    /* Holds the input and the decorative hint chevrons at exactly the same
       box, so the chevrons overlay the track. */
    .track-wrap {
      position: relative;
      flex: 1 1 auto;
      height: var(--webmapx-mega-slider-track-height, 22px);
    }

    /* The two-tone fill lives in its own layer, behind the hints, rather than
       as the input's own background: the input's background and its thumb
       are one atomic paint (its background necessarily paints *with* it, not
       separately underneath a sibling), so if the input painted the fill
       itself, that opaque fill would cover the hints completely rather than
       just have the thumb sit above them. Splitting it out is what lets the
       stacking be fill (bottom) → hints (middle) → thumb (top). */
    .track-fill {
      position: absolute;
      inset: 0;
      border-radius: var(--webmapx-radius-md, 11px);
      background: linear-gradient(to right,
        var(--sl-color-primary-600, var(--color-primary, #2b6c8f)) 0%,
        var(--sl-color-primary-600, var(--color-primary, #2b6c8f)) var(--slider-pct, 100%),
        var(--color-border, #d5dce3) var(--slider-pct, 100%),
        var(--color-border, #d5dce3) 100%
      );
      pointer-events: none;
    }

    input[type='range'] {
      /* Positioned (not just in-flow) so it paints above the fill and the
         hints overlay, both earlier in the DOM at the same position: a
         positioned box always paints over an earlier positioned sibling in
         the same stacking context — this is what keeps the thumb visible on
         top of the chevrons rather than buried under them. Its own
         background is transparent (the fill layer behind it shows through),
         so only the thumb itself occludes anything. */
      position: relative;
      display: block;
      width: 100%;
      height: 100%;
      margin: 0;
      -webkit-appearance: none;
      appearance: none;
      background: transparent;
      outline: none;
      cursor: pointer;
    }

    /* Faint drag-direction hints: fixed marks along the track, each pointing
       away from wherever the thumb currently sits — "you can still go this
       way". A mark the thumb has moved past therefore flips to point back
       the way it came, which is also what makes the whole set read as
       "<<<<<<" once the thumb reaches one end, not just a static "<<< O >>>".
       aria-hidden because it repeats what the track fill and thumb position
       already tell an assistive-tech user. */
    .hints {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .hint {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: var(--webmapx-mega-slider-hint-size, 18px);
      height: var(--webmapx-mega-slider-hint-size, 18px);
      color: var(--webmapx-mega-slider-hint-color, rgba(0, 0, 0, 0.32));
    }

    .hint.pointing-left {
      transform: translate(-50%, -50%) scaleX(-1);
    }

    .hint svg {
      display: block;
      width: 100%;
      height: 100%;
    }

    /* No outline on the input itself: its own box is only track-height, far
       shorter than the thumb, which is drawn via a pseudo-element that
       overflows above and below that box — an outline there lands at the
       track's top/bottom edge and reads as a line drawn straight through the
       middle of the thumb. The focus ring is drawn as a box-shadow on the
       thumb pseudo-elements instead, so it wraps the circle itself. */
    input[type='range']::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: var(--webmapx-mega-slider-thumb-size, 60px);
      height: var(--webmapx-mega-slider-thumb-size, 60px);
      border-radius: 50%;
      border: 4px solid var(--color-background, #fff);
      background-color: var(--sl-color-primary-700, var(--color-primary, #2b6c8f));
      box-shadow: 0 2px 8px rgb(0 0 0 / 0.35);
      cursor: pointer;
    }

    input[type='range']::-moz-range-thumb {
      width: var(--webmapx-mega-slider-thumb-size, 60px);
      height: var(--webmapx-mega-slider-thumb-size, 60px);
      border-radius: 50%;
      border: 4px solid var(--color-background, #fff);
      background-color: var(--sl-color-primary-700, var(--color-primary, #2b6c8f));
      box-shadow: 0 2px 8px rgb(0 0 0 / 0.35);
      cursor: pointer;
    }

    /* Mimics outline-offset with a stack of two box-shadows: the first (background-
       colour) opens a visible gap outside the thumb's own white border, the second
       (focus colour) is the ring itself, drawn further out again — so it stays
       legible against a light or a dark page rather than blending into the white
       border it sits right next to. A dedicated width/offset pair rather than the
       shared --webmapx-focus-width/-offset (2px, sized for ordinary controls): at
       a 60px thumb that ring reads as barely there, so it needs its own, bigger
       default to stay proportionate. */
    input[type='range']:focus-visible::-webkit-slider-thumb {
      box-shadow:
        0 0 0 var(--webmapx-mega-slider-focus-offset, 3px) var(--color-background, #fff),
        0 0 0 calc(var(--webmapx-mega-slider-focus-offset, 3px) + var(--webmapx-mega-slider-focus-width, 4px)) var(--webmapx-focus-color, var(--color-primary, #2b6c8f)),
        0 2px 8px rgb(0 0 0 / 0.35);
    }

    input[type='range']:focus-visible::-moz-range-thumb {
      box-shadow:
        0 0 0 var(--webmapx-mega-slider-focus-offset, 3px) var(--color-background, #fff),
        0 0 0 calc(var(--webmapx-mega-slider-focus-offset, 3px) + var(--webmapx-mega-slider-focus-width, 4px)) var(--webmapx-focus-color, var(--color-primary, #2b6c8f)),
        0 2px 8px rgb(0 0 0 / 0.35);
    }

    input[type='range']::-moz-range-track {
      height: var(--webmapx-mega-slider-track-height, 22px);
      background: transparent;
    }
  `;

  protected onMapAttached(_adapter: IMap): void {
    this.subscribeToConfig();
  }

  protected onConfigReady(): void {
    this.recompute(this.adapter?.store.getState() ?? null);
  }

  protected onStateChanged(state: IMapState): void {
    this.recompute(state);
  }

  protected onMapDetached(): void {
    this.topLayerId = null;
    this.topLayerLabel = '';
    this.bottomLayerLabel = '';
    this.transparencyPct = DEFAULT_TRANSPARENCY_PCT;
    this.defaultedLayerId = null;
  }

  private recompute(state: IMapState | null): void {
    if (!state) return;
    const mapLayers = state.mapLayers ?? {};
    const orderedIds = [...Object.keys(mapLayers)].reverse();
    const isEligible = (id: string): boolean => {
      const meta = mapLayers[id] as MapLayerStateEntry | undefined;
      return meta?.hideFromLegend !== true && meta?.legendRole !== 'background';
    };
    const overlayIds = orderedIds.filter(isEligible);

    const topId = overlayIds[0] ?? null;
    const bottomId = overlayIds[1]
      ?? orderedIds.find((id) => id !== topId && mapLayers[id]?.hideFromLegend !== true)
      ?? null;

    this.topLayerId = topId;

    // start/end are positional (left/right), not "top/bottom": the top layer's
    // label is the one on the left now, so it takes the "start" override.
    const labelOverrides = this.toolsConfig?.megaSlider?.labels as { start?: string; end?: string } | undefined;
    this.topLayerLabel = labelOverrides?.start ?? this.labelFor(topId, mapLayers);
    this.bottomLayerLabel = labelOverrides?.end ?? this.labelFor(bottomId, mapLayers);

    const topMeta = topId ? (mapLayers[topId] as MapLayerStateEntry | undefined) : undefined;
    if (typeof topMeta?.transparency === 'number') {
      this.transparencyPct = topMeta.transparency;
      return;
    }

    this.transparencyPct = DEFAULT_TRANSPARENCY_PCT;
    // Written once per layer id, not on every store change while it stays
    // unset: the write itself sets `transparency`, so the branch above takes
    // over on the very next state notification — this only guards against
    // reapplying it forever in the meantime.
    //
    // Requires a `bottomId` too: layers are added one at a time, so for one
    // brief tick during load the first layer added is the *only* layer, and
    // therefore trivially "topmost" — committing the default there wrote it
    // onto the wrong layer the moment the second one arrived and bumped it
    // down, leaving both layers at 50 instead of just the one on top.
    if (topId && bottomId && this.adapter && this.defaultedLayerId !== topId) {
      this.defaultedLayerId = topId;
      applyLayerTransparency(this.adapter, topId, DEFAULT_TRANSPARENCY_PCT);
    }
  }

  private labelFor(layerId: string | null, mapLayers: Record<string, MapLayerStateEntry>): string {
    if (!layerId) return '';
    const label = mapLayers[layerId]?.label;
    return typeof label === 'string' && label.length > 0 ? label : layerId;
  }

  private handleInput(event: Event): void {
    if (!this.topLayerId || !this.adapter) return;
    const transparencyPct = Number((event.target as HTMLInputElement).value);
    this.transparencyPct = transparencyPct;
    applyLayerTransparency(this.adapter, this.topLayerId, transparencyPct);
  }

  /** Seven marks evenly spaced across the whole track (eighths), including the middle. */
  private static readonly HINT_POSITIONS = [12.5, 25, 37.5, 50, 62.5, 75, 87.5];

  private renderHints() {
    return html`
      <div class="hints" aria-hidden="true">
        ${WebmapxMegaSlider.HINT_POSITIONS.map((position) => {
          const pointsLeft = position < this.transparencyPct;
          return html`
            <span class="hint ${pointsLeft ? 'pointing-left' : ''}" style="left: ${position}%">
              <svg viewBox="0 0 20 20">
                <path d="M6 3l8 7-8 7" fill="none" stroke="currentColor"
                  stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          `;
        })}
      </div>
    `;
  }

  protected render() {
    if (!this.topLayerId) return html``;

    return html`
      <div class="shell" style="--slider-pct: ${this.transparencyPct}%">
        <span class="end-label start">${this.topLayerLabel}</span>
        <div class="track-wrap">
          <div class="track-fill"></div>
          ${this.renderHints()}
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            .value=${String(this.transparencyPct)}
            aria-label="Transparency of ${this.topLayerLabel || 'top layer'}"
            @input=${this.handleInput}
          />
        </div>
        <span class="end-label end">${this.bottomLayerLabel}</span>
      </div>
    `;
  }
}
