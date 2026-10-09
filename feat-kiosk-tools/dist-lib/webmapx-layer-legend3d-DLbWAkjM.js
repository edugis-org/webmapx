import { a as e, h as t, i as n, n as r, o as i, p as a } from "./decorators-d8E4nZJy.js";
import { i as o, l as s, o as c, s as l, t as u } from "./decorate-Bl-DXcQA.js";
import { t as d } from "./webmapx-base-tool-U6KxfRFV.js";
import "./icon-Qf3FyAAL.js";
import { n as f, t as p } from "./webmapx-clear-layers-dialog-DkbJS53P.js";
import { A as m } from "./classify-channel-C-BCLcL8.js";
import "./tooltip-BpVD9b5o.js";
import { r as h } from "./compare-replay-Nc8FG2S9.js";
import { n as g } from "./permalink-state-OmXXq5L0.js";
import { n as _ } from "./layer-features-NC94kZP4.js";
import "./icon-button-DxwGf0BN.js";
//#region src/components/webmapx-layer-legend3d.ts
var v;
function y(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity, a = (e) => {
		if (typeof e[0] == "number") {
			let [a, o] = e;
			a < t && (t = a), a > r && (r = a), o < n && (n = o), o > i && (i = o);
		} else if (Array.isArray(e)) for (let t of e) a(t);
	};
	for (let t of e.features ?? []) {
		let e = t.geometry;
		e?.coordinates && a(e.coordinates);
	}
	return Number.isFinite(t) ? [
		Math.max(-180, t),
		Math.max(-85.05112878, n),
		Math.min(180, r),
		Math.min(85.05112878, i)
	] : null;
}
function b(e, t) {
	return e ? t ? [
		Math.min(e[0], t[0]),
		Math.min(e[1], t[1]),
		Math.max(e[2], t[2]),
		Math.max(e[3], t[3])
	] : e : t;
}
function x(e) {
	if (!e) return 0;
	switch (e.type) {
		case "GeometryCollection": return e.geometries.reduce((e, t) => e + x(t), 0);
		case "Point": return 1;
		case "MultiPoint":
		case "LineString": return e.coordinates.length;
		case "MultiLineString":
		case "Polygon": return e.coordinates.reduce((e, t) => e + t.length, 0);
		case "MultiPolygon": return e.coordinates.reduce((e, t) => e + t.reduce((e, t) => e + t.length, 0), 0);
		default: return 0;
	}
}
function S(e) {
	let t = /* @__PURE__ */ new Map(), n = 0;
	for (let r of e.features ?? []) {
		let e = r.geometry?.type ?? "unknown";
		t.set(e, (t.get(e) ?? 0) + 1), n += x(r.geometry);
	}
	let r = e.features?.length ?? 0, i = [...t.entries()].map(([e, t]) => `${e}: ${t}`).join(", ");
	return `${i && t.size > 1 ? `${r} features (${i})` : `${r} feature${r === 1 ? "" : "s"}${i ? ` (${[...t.keys()][0]})` : ""}`}, ${n} ${n === 1 ? "vertex" : "vertices"}`;
}
function C(e, t) {
	if (Array.isArray(t?.sublayers) && t.sublayers.length > 0) {
		let n = /* @__PURE__ */ new Set();
		for (let e of t.sublayers) typeof e.source == "string" && n.add(e.source);
		return [...n].map((t) => [`${e}:${t}`, t]);
	}
	return typeof t?.sourceId == "string" ? [[t.sourceId]] : [];
}
var w = new Set([
	"circle",
	"symbol",
	"label",
	"line",
	"fill",
	"fill-extrusion"
]), T = class extends d {
	static {
		v = this;
	}
	constructor(...e) {
		super(...e), this.backgroundGroupLabel = "Base Maps", this.backgroundTitle = "Base map", this.overviewTitle = "Active layers", this.backgroundLayers = [], this.overviewLayers = [], this.layerTransparency = /* @__PURE__ */ new Map(), this.editingTransparencyLayerId = null, this.hoveredTransparencySliderLayerId = null, this.dropTargetLayerId = null, this.dropTargetPosition = null, this.sourceExtentCache = /* @__PURE__ */ new Map(), this.layerExtentCache = /* @__PURE__ */ new Map(), this.unsubscribeLayerAdd = null, this.unsubscribeLayerRemove = null, this.dragState = null, this.autoScrollState = null, this._lastMapLayers = void 0;
	}
	static {
		this.AUTO_SCROLL_EDGE_PX = 32;
	}
	static {
		this.AUTO_SCROLL_STEP_PX = 8;
	}
	static {
		this.AUTO_SCROLL_INTERVAL_MS = 20;
	}
	static {
		this.styles = t`
    :host {
      display: block;
      box-sizing: border-box;
      background: transparent;
      color: var(--webmapx-legend-color, var(--color-text-primary, #1f2937));
      --webmapx-stack-fill: var(--webmapx-legend-stack-fill, var(--color-background-secondary, #f4f4f4));
      --webmapx-stack-outline: var(--webmapx-legend-stack-outline, #1f2937);
    }

    /* Shoelace's own tooltip body is pointer-events: none, but its arrow
       and the popup's own outer wrapper aren't — confirmed either one can
       sit directly over a neighboring icon (e.g. the eye icon right next
       to the drag-handle, with placement="right") and silently eat a click
       meant for that icon while the tooltip is still open. */
    sl-tooltip::part(base__arrow),
    sl-tooltip::part(base__popup) {
      pointer-events: none;
    }

    /* No overflow/max-height here: the real scrollport is the ancestor
       reached through slot assignment (webmapx-tool-panel's
       .panel-content) — see findScrollableAncestor below. Making this
       element its own scroll container too would give sticky headers and
       drag auto-scroll the wrong ancestor to stick/scroll against. */
    .panel {
      display: flex;
      flex-direction: column;
      gap: var(--webmapx-space-lg, 1rem);
      padding: var(--webmapx-space-sm, 0.5rem);
      box-sizing: border-box;
    }

    .section {
      display: flex;
      flex-direction: column;
      gap: var(--webmapx-space-sm, 0.5rem);
    }

    .section-title {
      margin: 0;
      font-size: var(--webmapx-font-size-md, 0.95rem);
      font-weight: 700;
      color: var(--webmapx-legend-title-color, var(--color-primary, #0f62fe));
      /* Truncates instead of wrapping/pushing the action buttons off when a
         section has both a title and buttons (Active layers) and the two
         don't both fit — the buttons must never shrink or lose their click
         target. Equally harmless when a section's row has no buttons to
         protect (Base map): with only one flex child, there's nothing for
         truncation to make room for. */
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .layer-list {
      display: flex;
      flex-direction: column;
      gap: var(--webmapx-space-sm, 0.5rem);
    }

    /* Sits above every slab (including the dragged one, z-index 1000) since
       the overlapping parallelogram shapes would otherwise paint over a
       plain in-flow line at this position. */
    .drop-indicator {
      position: relative;
      z-index: 1001;
      height: 3px;
      margin: -1.5px 0;
      background: var(--color-primary, #0f62fe);
      border-radius: 2px;
      pointer-events: none;
    }

    .drop-indicator::before,
    .drop-indicator::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 8px;
      height: 8px;
      background: var(--color-primary, #0f62fe);
      border-radius: 50%;
      transform: translateY(-50%);
    }

    .drop-indicator::before {
      left: -2px;
    }

    .drop-indicator::after {
      right: -2px;
    }

    .layer-card.dragging {
      position: relative;
      z-index: 2;
      opacity: 0.75;
      box-shadow: var(--webmapx-shadow-lg, 0 6px 16px rgba(15, 23, 42, 0.2));
      cursor: grabbing;
    }

    .layer-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--webmapx-space-xs, 0.35rem);
      padding: var(--webmapx-space-xs, 0.35rem) var(--webmapx-space-sm, 0.625rem);
      border: 1px solid var(--color-border, #d7dce3);
      border-radius: var(--webmapx-radius-lg, 0.75rem);
      background: var(--color-background, #ffffff);
      box-shadow: var(--webmapx-shadow-sm, 0 1px 3px rgba(15, 23, 42, 0.08));
      box-sizing: border-box;
    }

    .visibility-toggle::part(base),
    .layer-details-actions sl-icon-button::part(base) {
      font-size: var(--webmapx-font-size-md, 0.95rem);
      padding: 0;
    }

    /* Explicit hover color (rather than relying on sl-icon-button's own
       internal :hover rule to win the cascade against our ::part(base)
       overrides elsewhere) so every icon-button in the legend reliably
       turns blue on mouse-over. */
    .visibility-toggle:hover::part(base),
    .layer-details-actions sl-icon-button:hover::part(base) {
      color: var(--sl-color-primary-600, var(--color-primary, #2b6c8f));
    }

    .layer-legend-wrap {
      width: 100%;
    }

    .layer-details-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    /* Hidden until the card is hovered, matching the default legend's
       hover-reveal for the same delete icon and action row. */
    .delete-layer,
    .layer-details-actions {
      opacity: 0;
      transition: opacity 0.12s ease;
    }

    .layer-card:hover .delete-layer,
    .layer-card:hover .layer-details-actions {
      opacity: 1;
    }

    .delete-layer::part(base) {
      color: var(--sl-color-danger-600, #dc2626);
    }

    .delete-layer:hover::part(base) {
      color: var(--sl-color-primary-600, var(--color-primary, #2b6c8f));
    }

    .opacity-row {
      display: flex;
      align-items: center;
      gap: 0.2rem;
      font-size: var(--webmapx-font-size-sm, 0.8rem);
      color: var(--color-text-secondary, #6b7280);
      /* Shortens the slider/number from the right so the percentage sits
         well clear of the zoom-to-layer button below it, matching the
         default legend's spacing. */
      padding-right: 2.5rem;
      box-sizing: border-box;
    }

    /* --slider-pct (set inline per-row from the current transparency value)
       splits the track at the thumb: lower values (left, already "used") in
       the lighter tone, higher values (right, remaining) in the darker
       tone — so the whole line reads dark at 0% and light at 100%. Resting
       state uses greys; hovering or dragging swaps in the blue pair. */
    .opacity-row input[type="range"] {
      --slider-track-grey: linear-gradient(to right,
        var(--color-border, #d7dce3) 0%,
        var(--color-border, #d7dce3) var(--slider-pct, 0%),
        var(--color-text-muted, #6b7280) var(--slider-pct, 0%),
        var(--color-text-muted, #6b7280) 100%
      );
      --slider-track-blue: linear-gradient(to right,
        var(--sl-color-primary-200, #bcdcf5) 0%,
        var(--sl-color-primary-200, #bcdcf5) var(--slider-pct, 0%),
        var(--sl-color-primary-600, var(--color-primary, #0f62fe)) var(--slider-pct, 0%),
        var(--sl-color-primary-600, var(--color-primary, #0f62fe)) 100%
      );
      flex: 1 1 auto;
      -webkit-appearance: none;
      appearance: none;
      height: 2px;
      background: var(--slider-track-grey);
      border-radius: var(--webmapx-radius-xs, 2px);
      outline: none;
      transition: background var(--webmapx-motion-fast, 120ms) ease;
    }

    .opacity-row input[type="range"]:hover,
    .opacity-row input[type="range"]:active {
      background: var(--slider-track-blue);
    }

    /* The rule above removes the UA focus ring from a keyboard-operable
       control (arrow keys change the value), so put an equivalent back. */
    .opacity-row input[type="range"]:focus-visible {
      outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #0f62fe));
      outline-offset: var(--webmapx-focus-offset, 2px);
    }

    /* The thumb doubles as the "drag to change transparency" affordance, so
       it always shows the same circle-half glyph, in white — sized close to
       the thumb's own diameter so the grey fill reads as a thin ring around
       the glyph rather than a separate dot behind it. Hover/grab tint it
       blue like every other control here; grabbing additionally enlarges.
       --thumb-fill (rather than a :hover selector on the pseudo-element) is
       set from the input's own style attribute, driven by
       hoveredTransparencySliderLayerId: Chromium/Firefox have a long-standing
       bug where a :hover selector match on ::-webkit-slider-thumb/
       ::-moz-range-thumb doesn't reliably repaint the thumb (:active works
       only because dragging already forces continuous repaints as the thumb
       moves). Changing a custom property's resolved value doesn't have that
       problem — it's the same invalidation path --slider-pct already relies
       on for the track gradient above. This has to be reactive state rather
       than an imperative style.setProperty() on mouseenter/mouseleave too:
       clicking the track to jump the value re-renders the whole style
       string from the template on every input event, which would otherwise
       silently wipe out a property set outside that render. */
    .opacity-row input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: var(--thumb-fill, var(--color-text-muted, #6b7280));
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M8 15A7 7 0 1 0 8 1zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: center;
      background-size: 80%;
      cursor: pointer;
      transition: width var(--webmapx-motion-fast, 120ms) ease,
                  height var(--webmapx-motion-fast, 120ms) ease,
                  background-color var(--webmapx-motion-fast, 120ms) ease;
    }

    .opacity-row input[type="range"]::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: none;
      background-color: var(--thumb-fill, var(--color-text-muted, #6b7280));
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M8 15A7 7 0 1 0 8 1zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: center;
      background-size: 80%;
      cursor: pointer;
      transition: width var(--webmapx-motion-fast, 120ms) ease,
                  height var(--webmapx-motion-fast, 120ms) ease,
                  background-color var(--webmapx-motion-fast, 120ms) ease;
    }

    /* Grabbed: enlarge, and switch to the active shade (matches .drag-handle:active elsewhere). */
    .opacity-row input[type="range"]:active::-webkit-slider-thumb {
      width: 24px;
      height: 24px;
      background-color: var(--sl-color-primary-700, var(--color-primary, #0f62fe));
    }

    .opacity-row input[type="range"]:active::-moz-range-thumb {
      width: 24px;
      height: 24px;
      background-color: var(--sl-color-primary-700, var(--color-primary, #0f62fe));
    }

    .opacity-row input[type="range"]::-moz-range-track {
      height: 2px;
      background: var(--slider-track-grey);
      border-radius: var(--webmapx-radius-xs, 2px);
      transition: background var(--webmapx-motion-fast, 120ms) ease;
    }

    .opacity-row input[type="range"]:hover::-moz-range-track,
    .opacity-row input[type="range"]:active::-moz-range-track {
      background: var(--slider-track-blue);
    }

    .opacity-value {
      flex: 0 0 auto;
      min-width: 1.5em;
      text-align: left;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      border-radius: var(--webmapx-radius-xs, 2px);
      /* Dotted underline (not solid) is the recognized "click to edit"
         convention (spreadsheets, Notion-style inline properties) — it
         reads as a hint, not a hyperlink. No explicit text-decoration-color:
         it defaults to currentColor, so the underline automatically follows
         the same hover/focus color change as the text itself, below. */
      text-decoration: underline dotted;
      text-underline-offset: 2px;
      transition: color var(--webmapx-motion-fast, 120ms) ease;
    }

    .opacity-value:hover,
    .opacity-value:focus-visible {
      color: var(--sl-color-primary-600, var(--color-primary, #0f62fe));
    }

    .opacity-value:focus-visible {
      outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #0f62fe));
      outline-offset: var(--webmapx-focus-offset, 2px);
    }

    .opacity-value-input {
      flex: 0 0 auto;
      width: 2.6em;
      text-align: right;
      font: inherit;
      font-variant-numeric: tabular-nums;
      color: inherit;
      background: var(--color-background, #fff);
      /* Neutral border matching every other plain input in the project.
         This input is only ever on screen while actively focused (it
         appears already-focused the instant you click the percentage), so
         a separate offset outline on top of the border read as two nested
         boxes — recolor the same single border on focus instead of adding
         a second box. */
      border: 1px solid var(--color-border, #d7dce3);
      border-radius: var(--webmapx-radius-xs, 2px);
      padding: 0 2px;
      outline: none;
      -moz-appearance: textfield;
      appearance: textfield;
      transition: border-color var(--webmapx-motion-fast, 120ms) ease;
    }

    .opacity-value-input:focus-visible {
      border-color: var(--sl-color-primary-600, var(--color-primary, #0f62fe));
    }

    .opacity-value-input::-webkit-outer-spin-button,
    .opacity-value-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    /* Shared by both section headers (Active layers and Base map) so they
       read as one consistent style rather than one opaque row and one bare
       title. Matches the panel's own ~40%-transparent background (:host,
       background: transparent, tinted via webmapx-tool-panel's scoped
       override in webmapx-style-core.css) — requested despite the icon-
       contrast tradeoff noted earlier (icon-only buttons have no container
       of their own to fall back on, so they can wash out over dark/busy
       map imagery at this opacity). */
    .section-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--webmapx-space-sm, 0.5rem);
      background: rgb(var(--color-surface-rgb, 255 255 255) / 0.6);
      padding-bottom: var(--webmapx-space-xs, 0.25rem);
    }

    /* Only the Active layers header needs to stick: it sits above a
       potentially long, scrollable layer stack and must stay opaque enough
       to mask slabs scrolling underneath it (its own inline z-index climbs
       up to items.length — see renderLayerStack — which would otherwise
       paint over an unstuck header). Base map is a short, fixed list with
       nothing to mask, so its header stays in normal flow. */
    .section-header-row.sticky {
      position: sticky;
      top: 0;
      /* Above every slab, including a mid-drag slab (1000 !important) and the
         drop-indicator (1001) — slabs carry their own inline z-index up to
         items.length (see renderLayerStack), which would otherwise paint
         over this sticky row as soon as it's greater than 1. */
      z-index: 1002;
    }

    /* Its own flex group (rather than letting the buttons sit as direct
       flex children of .section-header-row) so justify-content: space-between
       above pushes the title and the whole button cluster to opposite
       ends, instead of spacing all six items apart individually. Never
       shrinks — see .section-title. */
    .section-actions {
      display: flex;
      align-items: center;
      flex: 0 0 auto;
      gap: var(--webmapx-space-xs, 0.4rem);
    }

    .layer-meta {
      font-size: var(--webmapx-font-size-sm, 0.75rem);
      color: var(--color-text-secondary, #6b7280);
      white-space: nowrap;
      margin-left: 0.75rem;
    }

    .layer-editing-notice {
      font-size: var(--webmapx-font-size-sm, 0.75rem);
      color: var(--color-text-secondary, #6b7280);
      font-style: italic;
      padding: var(--webmapx-space-xs, 0.25rem) var(--webmapx-space-md, 0.75rem) var(--webmapx-space-sm, 0.5rem);
    }

    .empty {
      padding: 0.875rem;
      border: 1px dashed var(--color-border, #d7dce3);
      border-radius: var(--webmapx-radius-lg, 0.75rem);
      color: var(--color-text-secondary, #6b7280);
      font-size: var(--webmapx-font-size-md, 0.875rem);
      background: rgb(var(--color-surface-rgb, 255 255 255) / 0.6);
    }

    /* ---- Perspective layer stack (active layers only) ---- */

    .layer-stack {
      display: flex;
      flex-direction: column;
    }

    .layer-card.slab {
      align-items: stretch;
      border: none;
      background: transparent;
      box-shadow: none;
      padding: 0;
      border-radius: 0;
      gap: 0;
    }

    .slab {
      position: relative;
      display: flex;
      flex-direction: column;
    }

    /* !important: each .slab also carries an inline z-index (see
       renderLayerStack) so the top layer overlaps the ones below it —
       inline styles otherwise beat this class outright, which would leave
       the dragged slab hidden behind whichever ones sit earlier in the list. */
    .slab.dragging {
      z-index: 1000 !important;
      opacity: 0.85;
      cursor: grabbing;
    }

    /* Outlining a clip-path parallelogram needs two stacked layers, not a plain
       border: a border hugs the element's true (rectangular) edges, so it only
       traces the shape's horizontal top/bottom — the diagonal left/right sides
       cut through the box interior and would be left bare. Stacking a dark
       "outline" shape behind a slightly inset colored "face" shape (same
       clip-path formula, via a shared custom property) gives a uniform frame
       all the way around instead. */
    /* box-shadow gets clipped away along with everything else on a clip-path
       element, so the cast-shadow use filter: drop-shadow instead — it
       shadows the actual rendered (post-clip) silhouette, including the
       diagonal edges. */
    .slab-shape {
      --slab-clip: polygon(20px 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%);
      position: relative;
      display: grid;
      /* A larger offset with a tight blur keeps the shadow concentrated at
         the bottom edge (where the next slab overlaps) instead of bleeding
         out around the diagonal sides too. */
      filter: drop-shadow(0 5px 2px rgba(0, 0, 0, 0.5));
    }

    .slab-shape > * {
      grid-area: 1 / 1;
      clip-path: var(--slab-clip);
    }

    .slab-outline {
      width: 100%;
      height: 100%;
      background: var(--webmapx-stack-outline);
    }

    /* Left stays close to the vertical padding since the shape's bottom-left
       corner isn't inset by the clip (see --slab-clip) — only the right side
       needs the wider 1.5rem to clear the diagonal cut there, so the trash
       icon doesn't get clipped. */
    .slab-face {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      margin: 2px;
      padding: 0.3rem 1.5rem 0.3rem 0.55rem;
      color: var(--webmapx-stack-outline);
      background: var(--webmapx-stack-fill);
      box-sizing: border-box;
    }

    /* Reserved buffer the next (overlapping) slab tucks into. The slab that
       overlaps slides *up* into the one before it, so it's this slab's own
       *top* that ends up hidden behind it — putting the buffer first (and
       the title row after, near the bottom) keeps the title in the part
       that's never covered, and reads like the reference: label along the
       bottom edge, blank "roof" above it. */
    .slab-face::before {
      content: '';
      display: block;
      height: 0.9rem;
    }

    /* Pulls this slab up into the previous one, leaving only its bottom
       band (eye + title) visible — skipped when the previous slab is
       expanded so its open box isn't overlapped. */
    .slab-shape.overlap {
      margin-top: -0.85rem;
    }

    .slab-title-row {
      display: flex;
      /* flex-start (not center): a long title wraps to several lines, and
         centering against the whole wrapped block drifted the drag/eye/delete
         icons down to the label's vertical middle instead of its first line.
         flex-start alone sits the icons flush with the row's top edge, above
         where .slab-label's own line-height leading starts its first line of
         glyphs — .row-icon below nudges them down to match that. */
      align-items: flex-start;
      gap: 0.35rem;
      touch-action: none;
    }

    /* Half of .slab-label's line-height leading, minus half the icon's own
       height — centers each icon on the label's first line instead of on
       the row's top edge. Icon and label sizes differ here (0.8rem vs
       0.68rem), unlike the default legend, so both are spelled out rather
       than cancelling through a shared token. */
    .row-icon {
      margin-top: calc((0.68rem * 1.3 - var(--webmapx-font-size-sm, 0.8rem)) / 2);
    }

    .slab-title-row sl-icon-button::part(base) {
      font-size: var(--webmapx-font-size-sm, 0.8rem);
      padding: 0;
      color: var(--webmapx-stack-outline);
    }

    /* Hidden until hover so it doesn't compete visually with the eye/title/
       trash row; stays visible mid-drag even if the pointer drifts off the
       slab (translated far enough that :hover no longer applies). Revealed
       on hover anywhere in the card (not just the title row), matching
       .delete-layer/.layer-details-actions above. */
    .drag-handle {
      flex: 0 0 auto;
      font-size: var(--webmapx-font-size-sm, 0.8rem);
      color: var(--webmapx-stack-outline);
      cursor: grab;
      touch-action: none;
      opacity: 0;
      transition: opacity 0.12s ease;
    }

    .layer-card:hover .drag-handle,
    .slab.dragging .drag-handle {
      opacity: 1;
    }

    /* Base map: never draggable, so its drag-handle icon is purely a
       reserved-width spacer — this keeps it invisible even on hover
       (higher specificity than the reveal rule above), so the base map's
       eye icon lines up under whichever eye icon sits above it in the
       active-layer stack. */
    .drag-handle-disabled {
      cursor: default;
      pointer-events: none;
    }

    .layer-card:hover .drag-handle.drag-handle-disabled {
      opacity: 0;
    }

    /* Matches sl-icon-button's own hover/active colors (--sl-color-primary-600/700)
       so a plain sl-icon reads consistently with the real icon-buttons around it. */
    .drag-handle:hover {
      color: var(--sl-color-primary-600, var(--color-primary, #2b6c8f));
    }

    .drag-handle:active {
      cursor: grabbing;
      color: var(--sl-color-primary-700, var(--color-primary, #2b6c8f));
    }

    .slab-label:hover {
      color: var(--sl-color-primary-600, var(--color-primary, #2b6c8f));
    }

    .slab-label {
      flex: 1 1 auto;
      min-width: 0;
      cursor: pointer;
      font-size: 0.68rem;
      font-weight: 600;
      line-height: 1.3;
      white-space: normal;
      word-break: break-word;
    }

    .slab-label.out-of-zoom {
      opacity: 0.65;
    }

    /* Dims the title and trash icon (not the drag handle — that has its own
       hover-only visibility already — and not the eye-slash toggle itself,
       so a hidden layer reads at a glance without losing the one control
       needed to re-enable it). */
    .slab-title-row.layer-hidden .slab-label,
    .slab-title-row.layer-hidden .delete-layer::part(base) {
      opacity: 0.55;
    }

    /* Width matches the parallelogram's bottom edge, which runs from the
       shape's left edge to 20px short of its right edge (see --slab-clip) —
       not the full slab width. Padding is equal on all sides; the overlap
       (0.85rem) still lands safely since .slab-box-inner's own 0.625rem
       padding adds further clearance before reaching any visible content. */
    .slab-box {
      position: relative;
      align-self: flex-start;
      width: calc(100% - 20px);
      background: var(--webmapx-stack-fill);
      padding: 0.55rem;
      box-sizing: border-box;
      border: 2px solid var(--webmapx-stack-outline);
      border-top: none;
      /* A wider blur than .slab-shape's: the parallelogram's tapered
         diagonal edges already read as a gradual fade regardless of blur
         amount, but this box is a plain rectangle with a hard straight
         edge, so it needs more blur radius to fade out the same way. */
      filter: drop-shadow(0 5px 4px rgba(0, 0, 0, 0.45));
    }

    .slab-box-inner {
      display: flex;
      flex-direction: column;
      gap: var(--webmapx-space-xs, 0.35rem);
      background: rgb(var(--color-surface-rgb, 255 255 255) / 0.6);
      color: var(--color-text-primary, #1f2937);
      border-radius: var(--webmapx-radius-md, 0.5rem);
      padding: var(--webmapx-space-sm, 0.625rem);
      box-shadow: inset 0 0 0 1px var(--color-border, #d7dce3);
    }
  `;
	}
	onStateChanged(e) {
		e.mapLayers !== this._lastMapLayers && (this._lastMapLayers = e.mapLayers, this.applyVisibleLayers(e));
	}
	onMapAttached(e) {
		this.unsubscribeLayerAdd = e.events.on("layer-add", (t) => {
			this.applyVisibleLayers(e.store.getState());
		}), this.unsubscribeLayerRemove = e.events.on("layer-remove", (t) => {
			this.applyVisibleLayers(e.store.getState());
		}), this.applyVisibleLayers(e.store.getState());
	}
	onMapDetached() {
		this.unsubscribeLayerAdd?.(), this.unsubscribeLayerRemove?.(), this.unsubscribeLayerAdd = null, this.unsubscribeLayerRemove = null;
	}
	updated(e) {
		super.updated(e), this.disableTooltipHoverBridges();
	}
	disableTooltipHoverBridges() {
		this.shadowRoot?.querySelectorAll("sl-tooltip").forEach((e) => {
			e.updateComplete.then(() => {
				let t = e.shadowRoot?.querySelector("sl-popup");
				t && (t.hoverBridge = !1);
			});
		});
	}
	render() {
		return a`
      <div class="panel">
        ${this.renderSection(this.overviewTitle, this.overviewLayers, "No active layers.", !0)}
        ${this.renderSection(this.backgroundTitle, this.backgroundLayers, "No base map selected.")}
      </div>
      <webmapx-layer-info-dialog></webmapx-layer-info-dialog>
      <webmapx-layer-styler></webmapx-layer-styler>
      <webmapx-save-layers-dialog></webmapx-save-layers-dialog>
      <webmapx-permalink-dialog></webmapx-permalink-dialog>
      <webmapx-clear-layers-dialog @webmapx-clear-layers-confirm=${() => this.handleConfirmClearAllLayers()}></webmapx-clear-layers-dialog>
    `;
	}
	renderSection(e, t, n, r = !1) {
		return a`
      <section class="section">
        <div class="section-header-row ${r ? "sticky" : ""}">
          <h3 class="section-title" title=${e}>${e}</h3>
          ${r && t.length > 0 ? a`
                <div class="section-actions">
                  <sl-tooltip hoist content="Show all layers">
                    <sl-icon-button
                      name="eye"
                      label="Show all layers"
                      @click=${() => this.handleShowAllLayers()}
                    ></sl-icon-button>
                  </sl-tooltip>
                  <sl-tooltip hoist content="Hide all layers">
                    <sl-icon-button
                      name="eye-slash"
                      label="Hide all layers"
                      @click=${() => this.handleHideAllLayers()}
                    ></sl-icon-button>
                  </sl-tooltip>
                  <sl-tooltip hoist content="Clear all layers">
                    <sl-icon-button
                      name="trash"
                      label="Clear all layers"
                      @click=${() => this.handleClearAllLayers()}
                    ></sl-icon-button>
                  </sl-tooltip>
                  <sl-tooltip hoist content="Permalink">
                    <sl-icon-button
                      name="link-45deg"
                      label="Permalink"
                      @click=${() => this.handlePermalink()}
                    ></sl-icon-button>
                  </sl-tooltip>
                  <sl-tooltip hoist content="Save layer(s)…">
                    <sl-icon-button
                      name="download"
                      label="Save layer(s)…"
                      @click=${() => this.handleSaveLayers()}
                    ></sl-icon-button>
                  </sl-tooltip>
                </div>
              ` : null}
        </div>
        ${t.length > 0 ? r ? this.renderLayerStack(t) : this.renderFlatLayerList(t) : a`<div class="empty">${n}</div>`}
      </section>
    `;
	}
	renderFlatLayerList(e) {
		return a`
      <div class="layer-list">
        ${e.map((e) => a`
          <div class="layer-card slab" data-layer-id=${e.layerId}>
            <div class="slab-shape">
              <div class="slab-outline"></div>
              <div class="slab-face">
                <div class="slab-title-row ${e.visible ? "" : "layer-hidden"}">
                  <sl-icon class="drag-handle drag-handle-disabled row-icon" name="arrow-down-up" aria-hidden="true"></sl-icon>
                  <sl-tooltip hoist placement="right" content=${e.visible ? "Hide layer" : "Show layer"}>
                    <sl-icon-button
                      class="visibility-toggle row-icon"
                      name=${e.visible ? "eye" : "eye-slash"}
                      label=${e.visible ? "Hide layer" : "Show layer"}
                      @click=${() => this.handleVisibilityToggle(e.layerId)}
                    ></sl-icon-button>
                  </sl-tooltip>
                  <span
                    class="slab-label ${e.outOfZoom ? "out-of-zoom" : ""}"
                    @click=${() => this.handleCollapseToggle(e.layerId)}
                  >${e.label}${e.beingEdited ? a`&nbsp;<sl-icon name="pencil" title="Layer is currently being edited"></sl-icon>` : null}</span>
                </div>
              </div>
            </div>
            ${this.isLegendCollapsed(e.layerId) ? null : a`
              <div class="slab-box">
                <div class="slab-box-inner">
                  ${this.renderLayerDetailsContent(e)}
                </div>
              </div>
            `}
          </div>
        `)}
      </div>
    `;
	}
	renderLayerStack(e) {
		return a`
      <div class="layer-stack">
        ${e.map((t, n) => {
			let r = this.isLegendCollapsed(t.layerId), i = n > 0;
			return a`
            ${this.dropTargetLayerId === t.layerId && this.dropTargetPosition === "above" ? a`<div class="drop-indicator"></div>` : null}
            <div class="layer-card slab" style="z-index: ${e.length - n}" data-layer-id=${t.layerId}>
              <div class="slab-shape ${i ? "overlap" : ""}">
                <div class="slab-outline"></div>
                <div class="slab-face">
                  <div class="slab-title-row ${t.visible ? "" : "layer-hidden"}">
                    ${e.length > 1 ? a`
                      <sl-tooltip hoist placement="right" content="Drag to change layer order">
                        <sl-icon
                          class="drag-handle row-icon"
                          name=${n === 0 ? "arrow-down" : n === e.length - 1 ? "arrow-up" : "arrow-down-up"}
                          @pointerdown=${(e) => this.onDragHandlePointerDown(e)}
                          @pointermove=${(e) => this.onDragHandlePointerMove(e)}
                          @pointerup=${(e) => this.onDragHandlePointerUp(e)}
                          @pointercancel=${(e) => this.onDragHandlePointerUp(e)}
                        ></sl-icon>
                      </sl-tooltip>
                    ` : null}
                    <sl-tooltip hoist placement="right" content=${t.visible ? "Hide layer" : "Show layer"}>
                      <sl-icon-button
                        class="visibility-toggle row-icon"
                        name=${t.visible ? "eye" : "eye-slash"}
                        label=${t.visible ? "Hide layer" : "Show layer"}
                        @click=${() => this.handleVisibilityToggle(t.layerId)}
                      ></sl-icon-button>
                    </sl-tooltip>
                    <span
                      class="slab-label ${t.outOfZoom ? "out-of-zoom" : ""}"
                      @click=${() => this.handleCollapseToggle(t.layerId)}
                    >${t.label}${t.beingEdited ? a`&nbsp;<sl-icon name="pencil" title="Layer is currently being edited"></sl-icon>` : null}</span>
                    <sl-tooltip hoist placement="left" content="Remove layer">
                      <sl-icon-button
                        class="delete-layer row-icon"
                        name="x-circle"
                        label="Remove layer"
                        @click=${() => this.handleDeleteLayer(t.layerId)}
                      ></sl-icon-button>
                    </sl-tooltip>
                  </div>
                </div>
              </div>
              ${r ? null : a`
                <div class="slab-box">
                  <div class="slab-box-inner">
                    ${this.renderLayerDetailsContent(t)}
                  </div>
                </div>
              `}
            </div>
            ${this.dropTargetLayerId === t.layerId && this.dropTargetPosition === "below" ? a`<div class="drop-indicator"></div>` : null}
          `;
		})}
      </div>
    `;
	}
	renderLayerDetailsContent(e) {
		return e.beingEdited ? a`<div class="layer-editing-notice">editing</div>` : a`
      ${e.visible ? a`
            <div class="layer-legend-wrap" style=${e.layerType === "hillshade" ? "" : `opacity: ${(100 - (this.layerTransparency.get(e.layerId) ?? 0)) / 100}`}>
              <webmapx-layer-legend layer-id=${e.layerId}></webmapx-layer-legend>
            </div>
            <div class="opacity-row">
              <sl-tooltip hoist content="Transparency">
                <input
                  type="range"
                  aria-label=${`Transparency of ${e.label}`}
                  min="0"
                  max="100"
                  style="--slider-pct: ${this.layerTransparency.get(e.layerId) ?? 0}%${this.hoveredTransparencySliderLayerId === e.layerId ? "; --thumb-fill: var(--sl-color-primary-600, var(--color-primary, #0f62fe))" : ""}"
                  .value=${String(this.layerTransparency.get(e.layerId) ?? 0)}
                  @input=${(t) => this.handleTransparencyChange(e.layerId, t)}
                  @mouseenter=${() => {
			this.hoveredTransparencySliderLayerId = e.layerId;
		}}
                  @mouseleave=${() => {
			this.hoveredTransparencySliderLayerId = null;
		}}
                  @pointerdown=${(e) => e.currentTarget.closest("sl-tooltip")?.hide()}
                  @focus=${(e) => e.currentTarget.closest("sl-tooltip")?.hide()}
                />
              </sl-tooltip>
              ${this.editingTransparencyLayerId === e.layerId ? a`<input
                    class="opacity-value-input"
                    type="number"
                    min="0"
                    max="100"
                    inputmode="numeric"
                    aria-label=${`Transparency of ${e.label}, percent`}
                    .value=${String(this.layerTransparency.get(e.layerId) ?? 0)}
                    @blur=${(t) => this.commitTransparencyInput(e.layerId, t)}
                    @keydown=${(e) => this.handleTransparencyInputKeydown(e)}
                  />` : a`<sl-tooltip hoist content="Fill in">
                    <span
                      class="opacity-value"
                      role="button"
                      tabindex="0"
                      @click=${() => this.beginEditTransparency(e.layerId)}
                      @keydown=${(t) => {
			t.key !== "Enter" && t.key !== " " || (t.preventDefault(), this.beginEditTransparency(e.layerId));
		}}
                    >${this.layerTransparency.get(e.layerId) ?? 0}%</span>
                  </sl-tooltip>`}
            </div>
          ` : null}
      ${e.topLevelGroup ? a`<div class="layer-meta">${e.topLevelGroup}</div>` : null}
      <div class="layer-details-actions">
        <sl-tooltip hoist content="About this layer">
          <sl-icon-button
            name="info-circle"
            label="About this layer"
            @click=${() => this.handleShowLayerInfo(e.layerId, e.label)}
          ></sl-icon-button>
        </sl-tooltip>
        ${e.hasStyleDialog ? a`<sl-tooltip hoist content="Layer style">
              <sl-icon-button
                name="palette"
                label="Layer style"
                @click=${() => this.handleShowLayerStyle(e.layerId, e.label)}
              ></sl-icon-button>
            </sl-tooltip>` : null}
        ${e.hasExtent ? a`<sl-tooltip hoist content="Zoom to layer">
              <sl-icon-button
                name="arrows-fullscreen"
                label="Zoom to layer"
                @click=${() => this.handleZoomToLayer(e.layerId)}
              ></sl-icon-button>
            </sl-tooltip>` : null}
      </div>
    `;
	}
	onDragHandlePointerDown(e) {
		let t = e.currentTarget, n = t.closest(".layer-card"), r = t.closest(".layer-list, .layer-stack");
		if (!n || !r) return;
		e.preventDefault(), t.setPointerCapture(e.pointerId), t.closest("sl-tooltip")?.hide();
		let i = n.getBoundingClientRect(), a = r.getBoundingClientRect(), o = this.findScrollableAncestor(e), s = n.dataset.layerId ?? "", c = Array.from(r.querySelectorAll(".layer-card")).filter((e) => e !== n).map((e) => {
			let t = e.getBoundingClientRect();
			return {
				layerId: e.dataset.layerId ?? "",
				top: t.top,
				bottom: t.bottom
			};
		});
		this.dragState = {
			card: n,
			layerId: s,
			startClientY: e.clientY,
			minTranslate: a.top - i.top,
			maxTranslate: a.bottom - i.bottom,
			scroller: o,
			startScrollTop: o?.scrollTop ?? 0,
			cardTop: i.top,
			cardBottom: i.bottom,
			siblings: c
		}, n.classList.add("dragging");
	}
	findScrollableAncestor(e) {
		for (let t of e.composedPath()) {
			if (!(t instanceof HTMLElement)) continue;
			let e = getComputedStyle(t);
			if (/(auto|scroll)/.test(e.overflowY) && t.scrollHeight > t.clientHeight) return t;
		}
		return null;
	}
	onDragHandlePointerMove(e) {
		if (!this.dragState) return;
		let { card: t, startClientY: n, minTranslate: r, maxTranslate: i, scroller: a, startScrollTop: o } = this.dragState, s = (a?.scrollTop ?? o) - o, c = e.clientY - n + s, l = Math.min(i, Math.max(r, c));
		t.style.transform = `translateY(${l}px)`, this.updateAutoScroll(e.clientY, a), this.updateDropTarget(l);
	}
	updateDropTarget(e) {
		if (!this.dragState) return;
		let { cardTop: t, cardBottom: n, siblings: r } = this.dragState, i = null;
		if (e < 0) {
			let n = t + e;
			for (let e of r) if (n < e.bottom) {
				i = {
					layerId: e.layerId,
					position: "above"
				};
				break;
			}
		} else if (e > 0) {
			let t = n + e;
			for (let e of r) t > e.top && (i = {
				layerId: e.layerId,
				position: "below"
			});
		}
		this.dropTargetLayerId = i?.layerId ?? null, this.dropTargetPosition = i?.position ?? null;
	}
	commitDrop(e) {
		let t = this.dropTargetLayerId, n = this.dropTargetPosition;
		if (!this.adapter || !t || !n || t === e) return;
		let r = Object.keys(this.adapter.store.getState().mapLayers ?? {}), i = r.indexOf(t);
		if (i === -1) return;
		let a = n === "below" ? t : r[i + 1] ?? null;
		a !== e && (this.freezeLegendExpandState(), this.adapter.moveLayer(e, a));
	}
	freezeLegendExpandState() {
		if (!this.store) return;
		let e = this.store.getState().mapLayers, t = { ...e }, n = !1;
		for (let [r, i] of Object.entries(e)) i?.legendExpandMode === "expanded" || i?.legendExpandMode === "collapsed" || (t[r] = {
			...i,
			legendExpandMode: this.isLegendCollapsed(r) ? "collapsed" : "expanded"
		}, n = !0);
		n && this.store.dispatch({ mapLayers: t }, "UI");
	}
	onDragHandlePointerUp(e) {
		if (!this.dragState) return;
		let t = e.currentTarget;
		t.hasPointerCapture?.(e.pointerId) && t.releasePointerCapture(e.pointerId);
		let { card: n, layerId: r } = this.dragState;
		n.style.transform = "", n.classList.remove("dragging"), this.commitDrop(r), this.dragState = null, this.dropTargetLayerId = null, this.dropTargetPosition = null, this.stopAutoScroll();
		let i = document.elementFromPoint(e.clientX, e.clientY)?.closest(".layer-card")?.querySelector(".drag-handle");
		i && (i.classList.add("suppress-hover"), document.addEventListener("pointermove", () => {
			i.classList.remove("suppress-hover");
		}, { once: !0 }));
	}
	updateAutoScroll(e, t) {
		if (!t) return;
		let n = t.getBoundingClientRect(), r = v.AUTO_SCROLL_EDGE_PX, i = null;
		if (e < n.top + r ? i = "up" : e > n.bottom - r && (i = "down"), !i) {
			this.stopAutoScroll();
			return;
		}
		this.autoScrollState?.direction === i && this.autoScrollState.panel === t || (this.stopAutoScroll(), this.autoScrollState = {
			panel: t,
			direction: i,
			timer: 0
		}, this.runAutoScrollStep());
	}
	runAutoScrollStep() {
		let e = this.autoScrollState;
		if (!e) return;
		let { panel: t, direction: n } = e, r = t.scrollTop <= 0, i = t.scrollTop >= t.scrollHeight - t.clientHeight;
		if (n === "up" && r || n === "down" && i) {
			this.stopAutoScroll();
			return;
		}
		t.scrollTop += n === "up" ? -v.AUTO_SCROLL_STEP_PX : v.AUTO_SCROLL_STEP_PX, e.timer = window.setTimeout(() => this.runAutoScrollStep(), v.AUTO_SCROLL_INTERVAL_MS);
	}
	stopAutoScroll() {
		this.autoScrollState &&= (window.clearTimeout(this.autoScrollState.timer), null);
	}
	handlePermalink() {
		if (!this.adapter) return;
		let e = g(this.adapter), t = this.closest("webmapx-map") ?? this.adapter, n = l(t), r = c(n), i = n === 0 ? h(t) : null, a = i ? g(i.adapter) : null, u = i && a ? {
			split: i.split,
			state: s(a)
		} : null, d = o(n, e.layerIds, e.hiddenLayerIds, e.viewport, e.transparencyOverrides, e.projection, r, e.terrainEnabled, e.time, u, e.tools), f = [...new Set([...e.dynamicLayerIds, ...a?.dynamicLayerIds ?? []])];
		this.permalinkDialog?.open(d, !!r, f);
	}
	handleSaveLayers() {
		if (!this.adapter) return;
		let e = this.adapter.store.getState().mapLayers ?? {}, t = this.overviewLayers.map((t) => {
			let n = e[t.layerId];
			return {
				layerId: t.layerId,
				label: t.label,
				sourceId: typeof n?.sourceId == "string" ? n.sourceId : void 0,
				layerType: typeof n?.layerType == "string" ? n.layerType : void 0,
				paint: n?.paint && typeof n.paint == "object" ? n.paint : void 0,
				sublayers: Array.isArray(n?.sublayers) ? n.sublayers : void 0,
				sourceData: n?.sourceData && typeof n.sourceData == "object" ? n.sourceData : void 0,
				sourceConfig: typeof n?.sourceId == "string" ? this.adapter?.getSourceConfig(n.sourceId) ?? void 0 : void 0
			};
		});
		this.saveLayersDialog?.open(t, this.adapter);
	}
	applyVisibleLayers(e) {
		let t = e.mapLayers ?? {}, n = [...Object.keys(t)].reverse(), r = [], i = [], a = this.backgroundGroupLabel.trim().toLowerCase();
		for (let o of n) {
			let n = t[o];
			if (n?.hideFromLegend === !0) continue;
			let s = n?.legendRole === "background" || n?.legendRole === "overlay" ? n.legendRole : null, c = typeof n?.label == "string" && n.label.length > 0 ? n.label : o, l = typeof n?.group == "string" && n.group.length > 0 ? n.group : null, u = typeof n?.minzoom == "number" ? n.minzoom : 0, d = typeof n?.maxzoom == "number" ? n.maxzoom : 24, f = typeof e.zoomLevel == "number" ? e.zoomLevel : 0, p = {
				layerId: o,
				label: c,
				layerType: typeof n?.layerType == "string" ? n.layerType : void 0,
				topLevelGroup: l,
				visible: n?.visible !== !1,
				hasExtent: this.layerHasExtent(o, n),
				hasStyleDialog: this.layerHasStyleDialog(n),
				outOfZoom: f < u || f >= d + 1,
				beingEdited: n?.borrowedByDrawTool === !0
			};
			s === "background" ? r.push(p) : s === "overlay" ? i.push(p) : l?.trim().toLowerCase() === a ? r.push(p) : i.push(p);
		}
		this.backgroundLayers = r, this.overviewLayers = i;
		let o = /* @__PURE__ */ new Map();
		for (let e of n) {
			let n = t[e];
			if (typeof n?.transparency == "number") o.set(e, n.transparency);
			else if (n?.layerType === "hillshade") {
				let t = Number(n?.paint?.["hillshade-exaggeration"] ?? 1);
				o.set(e, Math.round((1 - t) * 100));
			}
		}
		this.layerTransparency = o;
	}
	handleTransparencyChange(e, t) {
		this.applyTransparency(e, Number(t.target.value));
	}
	applyTransparency(e, t) {
		if (!this.adapter) return;
		let n = this.adapter.store.getState().mapLayers, r = n[e], i = r;
		if (i?.layerType === "hillshade") {
			r && this.adapter.store.dispatch({ mapLayers: {
				...n,
				[e]: {
					...r,
					transparency: t
				}
			} }, "UI");
			let a = (i?.sublayers)?.find((e) => e?.type === "hillshade")?.id ?? e;
			this.adapter.updateLayerStyle(e, a, { "hillshade-exaggeration": (100 - t) / 100 });
		} else this.adapter.setLayerOpacity(e, (100 - t) / 100);
	}
	beginEditTransparency(e) {
		this.editingTransparencyLayerId = e, this.updateComplete.then(() => {
			let e = this.shadowRoot?.querySelector(".opacity-value-input");
			e?.focus(), e?.select();
		});
	}
	commitTransparencyInput(e, t) {
		this.editingTransparencyLayerId = null;
		let n = Number(t.target.value), r = this.layerTransparency.get(e) ?? 0, i = Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : r;
		this.applyTransparency(e, i);
	}
	handleTransparencyInputKeydown(e) {
		e.key === "Enter" && e.target.blur();
	}
	async handleShowLayerInfo(e, t) {
		let n = this.adapter?.store.getState().mapLayers?.[e], r = n?.label ?? t, i = n?.attribution, a = n?.abstract, o = await this.getLayerFeatureSummary(e, n);
		this.infoDialog?.open(r, a, i, o);
	}
	handleShowLayerStyle(e, t) {
		let n = this.adapter?.store.getState().mapLayers?.[e], r = {
			title: n?.label ?? t,
			layerMeta: n ?? null,
			engine: this.adapter?.engineId,
			layerId: e,
			groups: [],
			apply: (t, n) => this.adapter?.updateLayerStyle(e, t || e, n) ?? !1,
			resample: () => this.getLayerStyleGroups(e, this.adapter?.store.getState().mapLayers?.[e]),
			attributeLabels: m(n?.attributes, this.adapter?.store.getState().attributeMetadata),
			watchView: (e) => this.adapter?.events.on("view-change-end", (t) => {
				e({
					west: t.bounds.sw[0],
					south: t.bounds.sw[1],
					east: t.bounds.ne[0],
					north: t.bounds.ne[1]
				});
			}) ?? (() => {}),
			layers: {
				add: (e) => this.adapter?.addLayer(e) ?? !1,
				remove: (e) => {
					this.adapter?.hasLayer?.(e) && this.adapter.removeLayer(e);
				},
				setExtraSubLayer: (e, t) => this.adapter?.setExtraSubLayer(e, t) ?? Promise.resolve(!1),
				setSubLayers: (e, t) => this.adapter?.setSubLayers(e, t) ?? Promise.resolve(!1),
				getSubLayers: (e) => this.adapter?.getSubLayers(e) ?? null,
				setSubLayerMetadata: (e, t, n) => this.adapter?.setSubLayerMetadata(e, t, n) ?? !1,
				canRebuild: (e) => this.adapter?.canRebuildLayer(e) ?? !1
			},
			...typeof n?.sourceId == "string" && n?.layerType === "raster" ? { raster: {
				sourceId: n.sourceId,
				sourceConfig: this.adapter?.getSourceConfig(n.sourceId) ?? null
			} } : {},
			...Array.isArray(n?.bounds) ? { bounds: n.bounds } : {},
			writeFeatures: (e, t) => this.adapter?.setSourceData(e, {
				type: "FeatureCollection",
				features: t
			}) ?? !1,
			fontStacks: () => p(Object.keys(this.adapter?.store.getState().mapLayers ?? {}).map((e) => this.adapter?.getSubLayers(e) ?? null)),
			sourceControl: {
				setTiles: (e, t) => this.adapter?.setSourceTiles(e, t) ?? !1,
				setParams: (e, t) => this.adapter?.setSourceParams(e, t) ?? !1,
				getTiles: (e) => this.adapter?.getSourceTiles(e) ?? null,
				setLayerOpacity: (t) => this.adapter?.setLayerOpacity(e, t),
				getView: () => {
					let e = this.adapter?.getViewportState();
					if (!e) return null;
					let t = this.closest("webmapx-map") ?? this.parentElement, n = t?.clientWidth ?? 0, r = t?.clientHeight ?? 0;
					return n > 0 && r > 0 ? {
						...e,
						size: [n, r]
					} : e;
				}
			}
		};
		this.layerStyler?.open(r);
	}
	async getLayerFeatureSummary(e, t) {
		let n = typeof t?.sourceId == "string" ? t.sourceId : void 0, r = typeof t?.sourceLayer == "string" ? t.sourceLayer : void 0, { features: i, complete: a } = await _(this.adapter, e, {
			sourceId: n,
			sourceLayer: r,
			sourceData: t?.sourceData
		});
		if (!i || i.length === 0) return;
		let o = S({
			type: "FeatureCollection",
			features: i
		});
		return a ? o : `${o} — loaded and visible on the map now`;
	}
	layerHasExtent(e, t) {
		return Array.isArray(t?.bounds) && t.bounds.length === 4 ? !0 : C(e, t).some((e) => e.some((e) => this.adapter?.hasSourceData(e) === !0));
	}
	layerHasStyleDialog(e) {
		return this.getLayerStyleTargets("", e).length > 0 ? !0 : e?.layerType === "raster";
	}
	getLayerStyleTargets(e, t) {
		let n = [];
		if (Array.isArray(t?.sublayers) && t.sublayers.length > 0) this.collectStyleTargetsFromSublayers(e, t.sublayers, n);
		else {
			let r = typeof t?.layerType == "string" ? t.layerType : void 0, i = typeof t?.sourceId == "string" ? t.sourceId : "", a = typeof t?.sourceLayer == "string" ? t.sourceLayer : void 0;
			if (r && w.has(r)) {
				let o = t?.paint && typeof t.paint == "object" ? t.paint : void 0, s = t?.layout && typeof t.layout == "object" ? t.layout : void 0;
				n.push({
					id: e,
					type: r,
					sourceId: i,
					...o ? { paint: o } : {},
					...s ? { layout: s } : {},
					...a ? { sourceLayer: a } : {}
				});
			}
		}
		return n;
	}
	collectStyleTargetsFromSublayers(e, t, n) {
		if (Array.isArray(t)) for (let r of t) {
			if (!r || typeof r != "object") continue;
			let t = r, i = typeof t.type == "string" ? t.type : void 0, a = typeof t.id == "string" && t.id.length > 0 ? t.id : i, o = typeof t.source == "string" ? t.source : "", s = o ? `${e}:${o}` : "", c = typeof t["source-layer"] == "string" ? t["source-layer"] : void 0;
			if (i && a && w.has(i)) {
				let e = t.paint && typeof t.paint == "object" ? t.paint : void 0, r = t.layout && typeof t.layout == "object" ? t.layout : void 0;
				n.push({
					id: a,
					type: i,
					sourceId: s,
					...e ? { paint: e } : {},
					...r ? { layout: r } : {},
					...c ? { sourceLayer: c } : {}
				});
			}
			this.collectStyleTargetsFromSublayers(e, t.sublayers, n);
		}
	}
	async getLayerStyleGroups(e, t) {
		let n = this.getLayerStyleTargets(e, t), r = /* @__PURE__ */ new Map();
		for (let e of n) {
			let t = e.sourceId || "unknown source", n = r.get(t) ?? [];
			n.push(e), r.set(t, n);
		}
		let i = t?.attributes && typeof t.attributes == "object" ? t.attributes : {}, a = Array.isArray(i.allowedAttributes) ? new Set(i.allowedAttributes) : null, o = Array.isArray(i.deniedAttributes) ? new Set(i.deniedAttributes) : null;
		return Promise.all([...r.entries()].map(async ([n, r]) => {
			let i = r.find((e) => !!e.sourceLayer)?.sourceLayer, { features: s, complete: c } = await _(this.adapter, e, {
				sourceId: n,
				sourceLayer: i,
				sourceData: t?.sourceData
			}), l = f(s);
			return (a || o) && (l = l.filter((e) => (!o || !o.has(e.name)) && (!a || a.has(e.name)))), {
				sourceId: n,
				featureCountLabel: this.featureCountLabel(s, c),
				featureCount: s?.length ?? null,
				features: s,
				completeData: c,
				geometryTypes: this.geometryTypeLabels(s),
				attributes: l,
				sourceLayer: i,
				sourceConfig: this.adapter?.getSourceConfig?.(n) ?? null,
				featureRows: this.featureRows(s),
				layers: r.map(({ sourceId: e, sourceLayer: t, ...n }) => n)
			};
		}));
	}
	dedupeFeatures(e) {
		let t = /* @__PURE__ */ new Set();
		return e.filter((e) => {
			let n = e.id === void 0 ? JSON.stringify([e.geometry, e.properties ?? {}]) : `id:${String(e.id)}`;
			return t.has(n) ? !1 : (t.add(n), !0);
		});
	}
	featureCountLabel(e, t) {
		if (!e) return "Feature sample unavailable";
		let n = t ? "features" : "loaded visible features";
		return `${e.length} ${n}`;
	}
	geometryTypeLabels(e) {
		if (!e || e.length === 0) return ["geometry unknown"];
		let t = /* @__PURE__ */ new Set();
		for (let n of e) {
			let e = n.geometry?.type;
			e && t.add(e);
		}
		return t.size > 0 ? [...t].sort() : ["geometry unknown"];
	}
	featureRows(e) {
		return e ? e.slice(0, 200).map((e) => e.properties && typeof e.properties == "object" ? { ...e.properties } : {}) : [];
	}
	getSourceExtent(e) {
		let t = e[0];
		if (this.sourceExtentCache.has(t)) return this.sourceExtentCache.get(t) ?? null;
		let n = null;
		for (let t of e) {
			let e = this.adapter?.getSourceData(t) ?? null;
			if (e && typeof e == "object") {
				n = y(e);
				break;
			}
		}
		return this.sourceExtentCache.set(t, n), n;
	}
	resolveLayerExtent(e) {
		if (this.layerExtentCache.has(e)) return this.layerExtentCache.get(e) ?? null;
		let t = this.adapter?.store.getState().mapLayers?.[e], n = null;
		if (Array.isArray(t?.bounds) && t.bounds.length === 4) n = t.bounds;
		else for (let r of C(e, t)) n = b(n, this.getSourceExtent(r));
		return this.layerExtentCache.set(e, n), n;
	}
	handleZoomToLayer(e) {
		let t = this.resolveLayerExtent(e);
		t && this.adapter?.fitBounds(t);
	}
	handleDeleteLayer(e) {
		this.adapter && (this.adapter.removeLayer(e), this.applyVisibleLayers(this.adapter.store.getState()));
	}
	isLegendCollapsed(e) {
		let t = this.store?.getState()?.mapLayers?.[e]?.legendExpandMode;
		return t === "expanded" ? !1 : t === "collapsed" ? !0 : this.overviewLayers.find((e) => e.visible)?.layerId !== e;
	}
	handleCollapseToggle(e) {
		if (!this.store) return;
		let t = this.store.getState(), n = t.mapLayers?.[e];
		if (!n) return;
		let r = this.isLegendCollapsed(e) ? "expanded" : "collapsed";
		this.store.dispatch({ mapLayers: {
			...t.mapLayers,
			[e]: {
				...n,
				legendExpandMode: r
			}
		} }, "UI");
	}
	setAllLayersVisibility(e) {
		if (!this.adapter || !this.store) return;
		let t = this.store.getState().mapLayers, n = { ...t };
		for (let r of this.overviewLayers) {
			let i = t[r.layerId];
			!i || i.visible === e || (this.adapter.setLayerVisibility(r.layerId, e), n[r.layerId] = {
				...i,
				visible: e
			});
		}
		this.store.dispatch({ mapLayers: n }, "UI"), this.applyVisibleLayers(this.store.getState());
	}
	handleHideAllLayers() {
		this.setAllLayersVisibility(!1);
	}
	handleShowAllLayers() {
		this.setAllLayersVisibility(!0);
	}
	handleClearAllLayers() {
		this.clearLayersDialog?.open();
	}
	handleConfirmClearAllLayers() {
		if (this.clearLayersDialog?.hide(), this.adapter) {
			for (let e of this.overviewLayers) this.adapter.removeLayer(e.layerId);
			this.applyVisibleLayers(this.adapter.store.getState());
		}
	}
	handleVisibilityToggle(e) {
		if (!this.adapter || !this.store) return;
		let t = this.store.getState().mapLayers, n = t[e], r = n?.visible === !1;
		this.adapter.setLayerVisibility(e, r), n && this.store.dispatch({ mapLayers: {
			...t,
			[e]: {
				...n,
				visible: r
			}
		} }, "UI"), this.applyVisibleLayers(this.store.getState());
	}
};
u([e({
	type: String,
	attribute: "background-group-label"
})], T.prototype, "backgroundGroupLabel", void 0), u([e({
	type: String,
	attribute: "background-title"
})], T.prototype, "backgroundTitle", void 0), u([e({
	type: String,
	attribute: "overview-title"
})], T.prototype, "overviewTitle", void 0), u([n()], T.prototype, "backgroundLayers", void 0), u([n()], T.prototype, "overviewLayers", void 0), u([n()], T.prototype, "layerTransparency", void 0), u([n()], T.prototype, "editingTransparencyLayerId", void 0), u([n()], T.prototype, "hoveredTransparencySliderLayerId", void 0), u([n()], T.prototype, "dropTargetLayerId", void 0), u([n()], T.prototype, "dropTargetPosition", void 0), u([r("webmapx-layer-info-dialog", !0)], T.prototype, "infoDialog", void 0), u([r("webmapx-layer-styler", !0)], T.prototype, "layerStyler", void 0), u([r("webmapx-save-layers-dialog", !0)], T.prototype, "saveLayersDialog", void 0), u([r("webmapx-permalink-dialog", !0)], T.prototype, "permalinkDialog", void 0), u([r("webmapx-clear-layers-dialog", !0)], T.prototype, "clearLayersDialog", void 0), T = v = u([i("webmapx-layer-legend3d")], T);
//#endregion
export { T as WebmapxLayerLegend3d };
