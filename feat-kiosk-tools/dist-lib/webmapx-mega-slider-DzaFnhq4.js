import { h as e, i as t, o as n, p as r } from "./decorators-d8E4nZJy.js";
import { t as i } from "./decorate-Bl-DXcQA.js";
import { t as a } from "./webmapx-base-tool-U6KxfRFV.js";
import { t as o } from "./layer-transparency-CGfbHbcz.js";
//#region src/components/webmapx-mega-slider.ts
var s, c = 50, l = class extends a {
	static {
		s = this;
	}
	constructor(...e) {
		super(...e), this.topLayerId = null, this.topLayerLabel = "", this.bottomLayerLabel = "", this.transparencyPct = c, this.defaultedLayerId = null;
	}
	static {
		this.styles = e`
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
	}
	onMapAttached(e) {
		this.subscribeToConfig();
	}
	onConfigReady() {
		this.recompute(this.adapter?.store.getState() ?? null);
	}
	onStateChanged(e) {
		this.recompute(e);
	}
	onMapDetached() {
		this.topLayerId = null, this.topLayerLabel = "", this.bottomLayerLabel = "", this.transparencyPct = c, this.defaultedLayerId = null;
	}
	recompute(e) {
		if (!e) return;
		let t = e.mapLayers ?? {}, n = [...Object.keys(t)].reverse(), r = n.filter((e) => {
			let n = t[e];
			return n?.hideFromLegend !== !0 && n?.legendRole !== "background";
		}), i = r[0] ?? null, a = r[1] ?? n.find((e) => e !== i && t[e]?.hideFromLegend !== !0) ?? null;
		this.topLayerId = i;
		let s = this.toolsConfig?.megaSlider?.labels;
		this.topLayerLabel = s?.start ?? this.labelFor(i, t), this.bottomLayerLabel = s?.end ?? this.labelFor(a, t);
		let l = i ? t[i] : void 0;
		if (typeof l?.transparency == "number") {
			this.transparencyPct = l.transparency;
			return;
		}
		this.transparencyPct = c, i && a && this.adapter && this.defaultedLayerId !== i && (this.defaultedLayerId = i, o(this.adapter, i, c));
	}
	labelFor(e, t) {
		if (!e) return "";
		let n = t[e]?.label;
		return typeof n == "string" && n.length > 0 ? n : e;
	}
	handleInput(e) {
		if (!this.topLayerId || !this.adapter) return;
		let t = Number(e.target.value);
		this.transparencyPct = t, o(this.adapter, this.topLayerId, t);
	}
	static {
		this.HINT_POSITIONS = [
			12.5,
			25,
			37.5,
			50,
			62.5,
			75,
			87.5
		];
	}
	renderHints() {
		return r`
      <div class="hints" aria-hidden="true">
        ${s.HINT_POSITIONS.map((e) => r`
            <span class="hint ${e < this.transparencyPct ? "pointing-left" : ""}" style="left: ${e}%">
              <svg viewBox="0 0 20 20">
                <path d="M6 3l8 7-8 7" fill="none" stroke="currentColor"
                  stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          `)}
      </div>
    `;
	}
	render() {
		return this.topLayerId ? r`
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
            aria-label="Transparency of ${this.topLayerLabel || "top layer"}"
            @input=${this.handleInput}
          />
        </div>
        <span class="end-label end">${this.bottomLayerLabel}</span>
      </div>
    ` : r``;
	}
};
i([t()], l.prototype, "topLayerId", void 0), i([t()], l.prototype, "topLayerLabel", void 0), i([t()], l.prototype, "bottomLayerLabel", void 0), i([t()], l.prototype, "transparencyPct", void 0), l = s = i([n("webmapx-mega-slider")], l);
//#endregion
export { l as WebmapxMegaSlider };
