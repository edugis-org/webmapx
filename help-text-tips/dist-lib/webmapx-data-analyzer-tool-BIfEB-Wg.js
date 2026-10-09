import { a as e, c as t, h as n, i as r, n as i, o as a, p as o, r as s } from "./decorators-d8E4nZJy.js";
import { t as c } from "./decorate-Bl-DXcQA.js";
import { t as l } from "./webmapx-modal-tool-DS_L8Zce.js";
import { a as u, i as d, l as f, o as p, s as m } from "./directive-helpers-Debt3Tx3.js";
import { c as h } from "./chunk.AJ3ENQ5C-CwL2xu8w.js";
import "./chunk.YHLNUJ7P-BjspQfLm.js";
import { r as g } from "./chunk.NYIIDP5N-gftugmWL.js";
import { t as _ } from "./chunk.6CTB5ZDJ-DjZrBd6Y.js";
import "./alert-Dzf1BSLu.js";
import "./button-DE9ytwxI.js";
import "./checkbox-DigllOlW.js";
import { n as v } from "./chunk.RWUUFNUL-DFztA4uV.js";
import "./icon-Qf3FyAAL.js";
import "./switch-caSfmU2w.js";
import "./spinner-DHQKbDmr.js";
import { t as y } from "./form-label-styles-CiXgi-FX.js";
import { A as b, C as x, a as S, p as C, s as w, y as T } from "./classify-channel-C-BCLcL8.js";
import { r as E } from "./data-colors-BglhXRFr.js";
import { n as ee, t as te } from "./layer-features-NC94kZP4.js";
import { n as D } from "./geo-calculations-DcpPxqU9.js";
import { t as ne } from "./help-text-styles-BFw9dhCq.js";
import "./radio-group-DcrmsMH6.js";
import "./radio-button-a8zeRuOI.js";
import "./option-REOFPMrE.js";
//#region src/utils/thematic-map.ts
var O = /%|‰|(^|[^a-z])per([^a-z]|$)|\/|pct|percent|procent|perc|ratio|rate|share|aandeel|dens|dichtheid|gemiddeld|average|mean|avg|median|index/i, k = 12, A = 20;
function re(e, t, n = "") {
	if (O.test(e) || O.test(n)) return "relative";
	let r = t.filter(Number.isFinite);
	if (r.length === 0) return "absolute";
	let i = Math.min(...r), a = Math.max(...r);
	return i >= 0 && a <= 1 || r.every(Number.isInteger) && a <= A && new Set(r).size <= k || r.some((e) => !Number.isInteger(e)) && i >= 0 && a <= 100 ? "relative" : "absolute";
}
function j(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) {
		let e = n.geometry?.type;
		e === "Polygon" || e === "MultiPolygon" ? t.add("polygon") : e === "LineString" || e === "MultiLineString" ? t.add("line") : (e === "Point" || e === "MultiPoint") && t.add("point");
	}
	return t.size === 0 ? "none" : t.size === 1 ? [...t][0] : "mixed";
}
var ie = "area_km2";
function ae(e, t) {
	let n = `${t}_per_km2`, r = e.filter((e) => e.geometry && D(e.geometry) > 0), i = (e) => Object.keys(e ?? {}).filter((e) => e !== t && e !== "area_km2" && e !== n), a = r.some((e) => i(e.properties).length > 0), o = (e, t) => {
		if (!a) return `#${t}`;
		let n = e.properties ?? {};
		return JSON.stringify(Object.keys(n).sort().map((e) => [e, n[e]]));
	}, s = r.map((e) => D(e.geometry) / 1e6), c = /* @__PURE__ */ new Map();
	r.forEach((e, t) => {
		let n = o(e, t);
		c.set(n, (c.get(n) ?? 0) + s[t]);
	});
	let l = r.map((e, r) => {
		let i = c.get(o(e, r)) ?? s[r], a = e.properties?.[t], l = a == null || a === "" ? NaN : Number(a);
		return {
			type: "Feature",
			...e.id === void 0 ? {} : { id: e.id },
			geometry: e.geometry,
			properties: {
				...e.properties ?? {},
				[ie]: M(i, 6),
				[n]: Number.isFinite(l) && i > 0 ? M(l / i, 6) : null
			}
		};
	}), u = !a && new Set(r.map((e) => JSON.stringify(e.properties ?? {}))).size < r.length;
	return {
		features: l,
		densityField: n,
		partCount: r.length,
		groupCount: c.size,
		groupingSkipped: u ? `Some polygons share the value of ${t} but have no other attributes to tell whether they are parts of one feature, so each is measured on its own.` : null
	};
}
function M(e, t) {
	return e === 0 || !Number.isFinite(e) ? e : Number(e.toPrecision(t));
}
function oe(e, t, n = 12) {
	return [
		"interpolate",
		["linear"],
		[
			"to-number",
			["get", e],
			0
		],
		0,
		.5,
		t > 0 ? t : 1,
		n
	];
}
var se = "#ffffff";
function ce(e, t) {
	let n = 0, r = 0, i = 0, a = [];
	for (let o of e) {
		let e = o.properties?.[t], s = e == null || e === "" ? NaN : Number(e);
		s === 0 ? n++ : (s > 0 && r++, s < 0 && i++, a.push(o));
	}
	let o = n > 0 && r > 0 && i === 0;
	return {
		split: o,
		zeroCount: n,
		rest: o ? a : [...e]
	};
}
function le(e, t, n = se) {
	let r = [[
		"==",
		["get", e],
		0
	], n];
	if (Array.isArray(t) && t[0] === "case") {
		let e = t[t.length - 1];
		return [
			...t.slice(0, -1),
			...r,
			e
		];
	}
	return [
		"case",
		...r,
		t
	];
}
function N(e, t, n, r) {
	return Array.isArray(e) ? e.length === 3 && e[0] === "==" && e[2] === null && Array.isArray(e[1]) && e[1][0] === "get" && e[1][1] === t ? ["!", r] : e.length === 2 && e[1] === t && e[0] === "get" ? n : e.length === 2 && e[1] === t && e[0] === "has" ? r : e.map((e) => N(e, t, n, r)) : e && typeof e == "object" ? Object.fromEntries(Object.entries(e).map(([e, i]) => [e, N(i, t, n, r)])) : e;
}
function P(e, t) {
	let n = [];
	for (let r of e) {
		let e = Number(r.properties?.[t]);
		if (!Number.isFinite(e) || e <= 0) continue;
		let i = D(r.geometry) / 1e6;
		i > 0 && n.push(i / e);
	}
	if (n.length === 0) return null;
	n.sort((e, t) => e - t);
	let r = n.length >> 1, i = n.length % 2 ? n[r] : (n[r - 1] + n[r]) / 2, a = 10 ** Math.round(Math.log10(i));
	return Math.max(i / a, a / i) < 1.3 ? a : Number(i.toPrecision(3));
}
//#endregion
//#region src/utils/composition-profile.ts
function F(e, t, n, r = 2) {
	let i = e.map((e, r) => ({
		name: n[r],
		ratio: t[r] > 0 ? e / t[r] : 1
	})), a = i.filter((e) => e.ratio >= 1.15).sort((e, t) => t.ratio - e.ratio).slice(0, r), o = i.filter((e) => e.ratio <= 1 / 1.15).sort((e, t) => e.ratio - t.ratio).slice(0, 1), s = [...a, ...o].map((e) => `${e.name} ×${e.ratio.toFixed(1)}`);
	return s.length ? s.join(", ") : "close to average";
}
function I(e) {
	if (e.length < 2) return [...e];
	let t = e[0];
	for (let n of e) for (; !n.startsWith(t);) t = t.slice(0, -1);
	let n = Math.max(t.lastIndexOf("_"), t.lastIndexOf(" "), t.lastIndexOf("-")) + 1;
	return e.map((e) => e.slice(n) || e);
}
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.WQC6OWUE.js
var L = n`
  :host {
    display: inline-flex;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: max(12px, 0.75em);
    font-weight: var(--sl-font-weight-semibold);
    letter-spacing: var(--sl-letter-spacing-normal);
    line-height: 1;
    border-radius: var(--sl-border-radius-small);
    border: solid 1px var(--sl-color-neutral-0);
    white-space: nowrap;
    padding: 0.35em 0.6em;
    user-select: none;
    -webkit-user-select: none;
    cursor: inherit;
  }

  /* Variant modifiers */
  .badge--primary {
    background-color: var(--sl-color-primary-600);
    color: var(--sl-color-neutral-0);
  }

  .badge--success {
    background-color: var(--sl-color-success-600);
    color: var(--sl-color-neutral-0);
  }

  .badge--neutral {
    background-color: var(--sl-color-neutral-600);
    color: var(--sl-color-neutral-0);
  }

  .badge--warning {
    background-color: var(--sl-color-warning-600);
    color: var(--sl-color-neutral-0);
  }

  .badge--danger {
    background-color: var(--sl-color-danger-600);
    color: var(--sl-color-neutral-0);
  }

  /* Pill modifier */
  .badge--pill {
    border-radius: var(--sl-border-radius-pill);
  }

  /* Pulse modifier */
  .badge--pulse {
    animation: pulse 1.5s infinite;
  }

  .badge--pulse.badge--primary {
    --pulse-color: var(--sl-color-primary-600);
  }

  .badge--pulse.badge--success {
    --pulse-color: var(--sl-color-success-600);
  }

  .badge--pulse.badge--neutral {
    --pulse-color: var(--sl-color-neutral-600);
  }

  .badge--pulse.badge--warning {
    --pulse-color: var(--sl-color-warning-600);
  }

  .badge--pulse.badge--danger {
    --pulse-color: var(--sl-color-danger-600);
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 var(--pulse-color);
    }
    70% {
      box-shadow: 0 0 0 0.5rem transparent;
    }
    100% {
      box-shadow: 0 0 0 0 transparent;
    }
  }
`, R = class extends d {
	constructor() {
		super(...arguments), this.variant = "primary", this.pill = !1, this.pulse = !1;
	}
	render() {
		return o`
      <span
        part="base"
        class=${g({
			badge: !0,
			"badge--primary": this.variant === "primary",
			"badge--success": this.variant === "success",
			"badge--neutral": this.variant === "neutral",
			"badge--warning": this.variant === "warning",
			"badge--danger": this.variant === "danger",
			"badge--pill": this.pill,
			"badge--pulse": this.pulse
		})}
        role="status"
      >
        <slot></slot>
      </span>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.XO2J2P6J.js
R.styles = [u, L], m([e({ reflect: !0 })], R.prototype, "variant", 2), m([e({
	type: Boolean,
	reflect: !0
})], R.prototype, "pill", 2), m([e({
	type: Boolean,
	reflect: !0
})], R.prototype, "pulse", 2), R.define("sl-badge");
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.CNMNUZLG.js
var z = n`
  :host {
    display: inline-block;
  }

  .tab {
    display: inline-flex;
    align-items: center;
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-small);
    font-weight: var(--sl-font-weight-semibold);
    border-radius: var(--sl-border-radius-medium);
    color: var(--sl-color-neutral-600);
    padding: var(--sl-spacing-medium) var(--sl-spacing-large);
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;
    transition:
      var(--transition-speed) box-shadow,
      var(--transition-speed) color;
  }

  .tab:hover:not(.tab--disabled) {
    color: var(--sl-color-primary-600);
  }

  :host(:focus) {
    outline: transparent;
  }

  :host(:focus-visible) {
    color: var(--sl-color-primary-600);
    outline: var(--sl-focus-ring);
    outline-offset: calc(-1 * var(--sl-focus-ring-width) - var(--sl-focus-ring-offset));
  }

  .tab.tab--active:not(.tab--disabled) {
    color: var(--sl-color-primary-600);
  }

  .tab.tab--closable {
    padding-inline-end: var(--sl-spacing-small);
  }

  .tab.tab--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tab__close-button {
    font-size: var(--sl-font-size-small);
    margin-inline-start: var(--sl-spacing-small);
  }

  .tab__close-button::part(base) {
    padding: var(--sl-spacing-3x-small);
  }

  @media (forced-colors: active) {
    .tab.tab--active:not(.tab--disabled) {
      outline: solid 1px transparent;
      outline-offset: -3px;
    }
  }
`, B = 0, V = class extends d {
	constructor() {
		super(...arguments), this.localize = new _(this), this.attrId = ++B, this.componentId = `sl-tab-${this.attrId}`, this.panel = "", this.active = !1, this.closable = !1, this.disabled = !1, this.tabIndex = 0;
	}
	connectedCallback() {
		super.connectedCallback(), this.setAttribute("role", "tab");
	}
	handleCloseClick(e) {
		e.stopPropagation(), this.emit("sl-close");
	}
	handleActiveChange() {
		this.setAttribute("aria-selected", this.active ? "true" : "false");
	}
	handleDisabledChange() {
		this.setAttribute("aria-disabled", this.disabled ? "true" : "false"), this.disabled && !this.active ? this.tabIndex = -1 : this.tabIndex = 0;
	}
	render() {
		return this.id = this.id.length > 0 ? this.id : this.componentId, o`
      <div
        part="base"
        class=${g({
			tab: !0,
			"tab--active": this.active,
			"tab--closable": this.closable,
			"tab--disabled": this.disabled
		})}
      >
        <slot></slot>
        ${this.closable ? o`
              <sl-icon-button
                part="close-button"
                exportparts="base:close-button__base"
                name="x-lg"
                library="system"
                label=${this.localize.term("close")}
                class="tab__close-button"
                @click=${this.handleCloseClick}
                tabindex="-1"
              ></sl-icon-button>
            ` : ""}
      </div>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.DFHYNK3F.js
V.styles = [u, z], V.dependencies = { "sl-icon-button": h }, m([i(".tab")], V.prototype, "tab", 2), m([e({ reflect: !0 })], V.prototype, "panel", 2), m([e({
	type: Boolean,
	reflect: !0
})], V.prototype, "active", 2), m([e({
	type: Boolean,
	reflect: !0
})], V.prototype, "closable", 2), m([e({
	type: Boolean,
	reflect: !0
})], V.prototype, "disabled", 2), m([e({
	type: Number,
	reflect: !0
})], V.prototype, "tabIndex", 2), m([p("active")], V.prototype, "handleActiveChange", 1), m([p("disabled")], V.prototype, "handleDisabledChange", 1), V.define("sl-tab");
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.XJU7WU2G.js
var H = n`
  :host {
    --indicator-color: var(--sl-color-primary-600);
    --track-color: var(--sl-color-neutral-200);
    --track-width: 2px;

    display: block;
  }

  .tab-group {
    display: flex;
    border-radius: 0;
  }

  .tab-group__tabs {
    display: flex;
    position: relative;
  }

  .tab-group__indicator {
    position: absolute;
    transition:
      var(--sl-transition-fast) translate ease,
      var(--sl-transition-fast) width ease;
  }

  .tab-group--has-scroll-controls .tab-group__nav-container {
    position: relative;
    padding: 0 var(--sl-spacing-x-large);
  }

  .tab-group--has-scroll-controls .tab-group__scroll-button--start--hidden,
  .tab-group--has-scroll-controls .tab-group__scroll-button--end--hidden {
    visibility: hidden;
  }

  .tab-group__body {
    display: block;
    overflow: auto;
  }

  .tab-group__scroll-button {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    bottom: 0;
    width: var(--sl-spacing-x-large);
  }

  .tab-group__scroll-button--start {
    left: 0;
  }

  .tab-group__scroll-button--end {
    right: 0;
  }

  .tab-group--rtl .tab-group__scroll-button--start {
    left: auto;
    right: 0;
  }

  .tab-group--rtl .tab-group__scroll-button--end {
    left: 0;
    right: auto;
  }

  /*
   * Top
   */

  .tab-group--top {
    flex-direction: column;
  }

  .tab-group--top .tab-group__nav-container {
    order: 1;
  }

  .tab-group--top .tab-group__nav {
    display: flex;
    overflow-x: auto;

    /* Hide scrollbar in Firefox */
    scrollbar-width: none;
  }

  /* Hide scrollbar in Chrome/Safari */
  .tab-group--top .tab-group__nav::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  .tab-group--top .tab-group__tabs {
    flex: 1 1 auto;
    position: relative;
    flex-direction: row;
    border-bottom: solid var(--track-width) var(--track-color);
  }

  .tab-group--top .tab-group__indicator {
    bottom: calc(-1 * var(--track-width));
    border-bottom: solid var(--track-width) var(--indicator-color);
  }

  .tab-group--top .tab-group__body {
    order: 2;
  }

  .tab-group--top ::slotted(sl-tab-panel) {
    --padding: var(--sl-spacing-medium) 0;
  }

  /*
   * Bottom
   */

  .tab-group--bottom {
    flex-direction: column;
  }

  .tab-group--bottom .tab-group__nav-container {
    order: 2;
  }

  .tab-group--bottom .tab-group__nav {
    display: flex;
    overflow-x: auto;

    /* Hide scrollbar in Firefox */
    scrollbar-width: none;
  }

  /* Hide scrollbar in Chrome/Safari */
  .tab-group--bottom .tab-group__nav::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  .tab-group--bottom .tab-group__tabs {
    flex: 1 1 auto;
    position: relative;
    flex-direction: row;
    border-top: solid var(--track-width) var(--track-color);
  }

  .tab-group--bottom .tab-group__indicator {
    top: calc(-1 * var(--track-width));
    border-top: solid var(--track-width) var(--indicator-color);
  }

  .tab-group--bottom .tab-group__body {
    order: 1;
  }

  .tab-group--bottom ::slotted(sl-tab-panel) {
    --padding: var(--sl-spacing-medium) 0;
  }

  /*
   * Start
   */

  .tab-group--start {
    flex-direction: row;
  }

  .tab-group--start .tab-group__nav-container {
    order: 1;
  }

  .tab-group--start .tab-group__tabs {
    flex: 0 0 auto;
    flex-direction: column;
    border-inline-end: solid var(--track-width) var(--track-color);
  }

  .tab-group--start .tab-group__indicator {
    right: calc(-1 * var(--track-width));
    border-right: solid var(--track-width) var(--indicator-color);
  }

  .tab-group--start.tab-group--rtl .tab-group__indicator {
    right: auto;
    left: calc(-1 * var(--track-width));
  }

  .tab-group--start .tab-group__body {
    flex: 1 1 auto;
    order: 2;
  }

  .tab-group--start ::slotted(sl-tab-panel) {
    --padding: 0 var(--sl-spacing-medium);
  }

  /*
   * End
   */

  .tab-group--end {
    flex-direction: row;
  }

  .tab-group--end .tab-group__nav-container {
    order: 2;
  }

  .tab-group--end .tab-group__tabs {
    flex: 0 0 auto;
    flex-direction: column;
    border-left: solid var(--track-width) var(--track-color);
  }

  .tab-group--end .tab-group__indicator {
    left: calc(-1 * var(--track-width));
    border-inline-start: solid var(--track-width) var(--indicator-color);
  }

  .tab-group--end.tab-group--rtl .tab-group__indicator {
    right: calc(-1 * var(--track-width));
    left: auto;
  }

  .tab-group--end .tab-group__body {
    flex: 1 1 auto;
    order: 1;
  }

  .tab-group--end ::slotted(sl-tab-panel) {
    --padding: 0 var(--sl-spacing-medium);
  }
`, U = n`
  :host {
    display: contents;
  }
`, W = class extends d {
	constructor() {
		super(...arguments), this.observedElements = [], this.disabled = !1;
	}
	connectedCallback() {
		super.connectedCallback(), this.resizeObserver = new ResizeObserver((e) => {
			this.emit("sl-resize", { detail: { entries: e } });
		}), this.disabled || this.startObserver();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.stopObserver();
	}
	handleSlotChange() {
		this.disabled || this.startObserver();
	}
	startObserver() {
		let e = this.shadowRoot.querySelector("slot");
		if (e !== null) {
			let t = e.assignedElements({ flatten: !0 });
			this.observedElements.forEach((e) => this.resizeObserver.unobserve(e)), this.observedElements = [], t.forEach((e) => {
				this.resizeObserver.observe(e), this.observedElements.push(e);
			});
		}
	}
	stopObserver() {
		this.resizeObserver.disconnect();
	}
	handleDisabledChange() {
		this.disabled ? this.stopObserver() : this.startObserver();
	}
	render() {
		return o` <slot @slotchange=${this.handleSlotChange}></slot> `;
	}
};
W.styles = [u, U], m([e({
	type: Boolean,
	reflect: !0
})], W.prototype, "disabled", 2), m([p("disabled", { waitUntilFirstUpdate: !0 })], W.prototype, "handleDisabledChange", 1);
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.UGXNRQQX.js
var G = class extends d {
	constructor() {
		super(...arguments), this.tabs = [], this.focusableTabs = [], this.panels = [], this.localize = new _(this), this.hasScrollControls = !1, this.shouldHideScrollStartButton = !1, this.shouldHideScrollEndButton = !1, this.placement = "top", this.activation = "auto", this.noScrollControls = !1, this.fixedScrollControls = !1, this.scrollOffset = 1;
	}
	connectedCallback() {
		let e = Promise.all([customElements.whenDefined("sl-tab"), customElements.whenDefined("sl-tab-panel")]);
		super.connectedCallback(), this.resizeObserver = new ResizeObserver(() => {
			this.repositionIndicator(), this.updateScrollControls();
		}), this.mutationObserver = new MutationObserver((e) => {
			let t = e.filter(({ target: e }) => {
				if (e === this) return !0;
				if (e.closest("sl-tab-group") !== this) return !1;
				let t = e.tagName.toLowerCase();
				return t === "sl-tab" || t === "sl-tab-panel";
			});
			if (t.length !== 0) {
				if (t.some((e) => !["aria-labelledby", "aria-controls"].includes(e.attributeName)) && setTimeout(() => this.setAriaLabels()), t.some((e) => e.attributeName === "disabled")) this.syncTabsAndPanels();
				else if (t.some((e) => e.attributeName === "active")) {
					let e = t.filter((e) => e.attributeName === "active" && e.target.tagName.toLowerCase() === "sl-tab").map((e) => e.target).find((e) => e.active);
					e && this.setActiveTab(e);
				}
			}
		}), this.updateComplete.then(() => {
			this.syncTabsAndPanels(), this.mutationObserver.observe(this, {
				attributes: !0,
				attributeFilter: [
					"active",
					"disabled",
					"name",
					"panel"
				],
				childList: !0,
				subtree: !0
			}), this.resizeObserver.observe(this.nav), e.then(() => {
				new IntersectionObserver((e, t) => {
					e[0].intersectionRatio > 0 && (this.setAriaLabels(), this.setActiveTab(this.getActiveTab() ?? this.tabs[0], { emitEvents: !1 }), t.unobserve(e[0].target));
				}).observe(this.tabGroup);
			});
		});
	}
	disconnectedCallback() {
		var e, t;
		super.disconnectedCallback(), (e = this.mutationObserver) == null || e.disconnect(), this.nav && ((t = this.resizeObserver) == null || t.unobserve(this.nav));
	}
	getAllTabs() {
		return this.shadowRoot.querySelector("slot[name=\"nav\"]").assignedElements();
	}
	getAllPanels() {
		return [...this.body.assignedElements()].filter((e) => e.tagName.toLowerCase() === "sl-tab-panel");
	}
	getActiveTab() {
		return this.tabs.find((e) => e.active);
	}
	handleClick(e) {
		let t = e.target.closest("sl-tab");
		t?.closest("sl-tab-group") === this && t !== null && this.setActiveTab(t, { scrollBehavior: "smooth" });
	}
	handleKeyDown(e) {
		let t = e.target.closest("sl-tab");
		if (t?.closest("sl-tab-group") === this && (["Enter", " "].includes(e.key) && t !== null && (this.setActiveTab(t, { scrollBehavior: "smooth" }), e.preventDefault()), [
			"ArrowLeft",
			"ArrowRight",
			"ArrowUp",
			"ArrowDown",
			"Home",
			"End"
		].includes(e.key))) {
			let t = this.tabs.find((e) => e.matches(":focus")), n = this.localize.dir() === "rtl", r = null;
			if (t?.tagName.toLowerCase() === "sl-tab") {
				if (e.key === "Home") r = this.focusableTabs[0];
				else if (e.key === "End") r = this.focusableTabs[this.focusableTabs.length - 1];
				else if (["top", "bottom"].includes(this.placement) && e.key === (n ? "ArrowRight" : "ArrowLeft") || ["start", "end"].includes(this.placement) && e.key === "ArrowUp") {
					let e = this.tabs.findIndex((e) => e === t);
					r = this.findNextFocusableTab(e, "backward");
				} else if (["top", "bottom"].includes(this.placement) && e.key === (n ? "ArrowLeft" : "ArrowRight") || ["start", "end"].includes(this.placement) && e.key === "ArrowDown") {
					let e = this.tabs.findIndex((e) => e === t);
					r = this.findNextFocusableTab(e, "forward");
				}
				if (!r) return;
				r.tabIndex = 0, r.focus({ preventScroll: !0 }), this.activation === "auto" ? this.setActiveTab(r, { scrollBehavior: "smooth" }) : this.tabs.forEach((e) => {
					e.tabIndex = e === r ? 0 : -1;
				}), ["top", "bottom"].includes(this.placement) && v(r, this.nav, "horizontal"), e.preventDefault();
			}
		}
	}
	handleScrollToStart() {
		this.nav.scroll({
			left: this.localize.dir() === "rtl" ? this.nav.scrollLeft + this.nav.clientWidth : this.nav.scrollLeft - this.nav.clientWidth,
			behavior: "smooth"
		});
	}
	handleScrollToEnd() {
		this.nav.scroll({
			left: this.localize.dir() === "rtl" ? this.nav.scrollLeft - this.nav.clientWidth : this.nav.scrollLeft + this.nav.clientWidth,
			behavior: "smooth"
		});
	}
	setActiveTab(e, t) {
		if (t = f({
			emitEvents: !0,
			scrollBehavior: "auto"
		}, t), e !== this.activeTab && !e.disabled) {
			let n = this.activeTab;
			this.activeTab = e, this.tabs.forEach((e) => {
				e.active = e === this.activeTab, e.tabIndex = e === this.activeTab ? 0 : -1;
			}), this.panels.forEach((e) => e.active = e.name === this.activeTab?.panel), this.syncIndicator(), ["top", "bottom"].includes(this.placement) && v(this.activeTab, this.nav, "horizontal", t.scrollBehavior), t.emitEvents && (n && this.emit("sl-tab-hide", { detail: { name: n.panel } }), this.emit("sl-tab-show", { detail: { name: this.activeTab.panel } }));
		}
	}
	setAriaLabels() {
		this.tabs.forEach((e) => {
			let t = this.panels.find((t) => t.name === e.panel);
			t && (e.setAttribute("aria-controls", t.getAttribute("id")), t.setAttribute("aria-labelledby", e.getAttribute("id")));
		});
	}
	repositionIndicator() {
		let e = this.getActiveTab();
		if (!e) return;
		let t = e.clientWidth, n = e.clientHeight, r = this.localize.dir() === "rtl", i = this.getAllTabs(), a = i.slice(0, i.indexOf(e)).reduce((e, t) => ({
			left: e.left + t.clientWidth,
			top: e.top + t.clientHeight
		}), {
			left: 0,
			top: 0
		});
		switch (this.placement) {
			case "top":
			case "bottom":
				this.indicator.style.width = `${t}px`, this.indicator.style.height = "auto", this.indicator.style.translate = r ? `${-1 * a.left}px` : `${a.left}px`;
				break;
			case "start":
			case "end":
				this.indicator.style.width = "auto", this.indicator.style.height = `${n}px`, this.indicator.style.translate = `0 ${a.top}px`;
				break;
		}
	}
	syncTabsAndPanels() {
		this.tabs = this.getAllTabs(), this.focusableTabs = this.tabs.filter((e) => !e.disabled), this.panels = this.getAllPanels(), this.syncIndicator(), this.updateComplete.then(() => this.updateScrollControls());
	}
	findNextFocusableTab(e, t) {
		let n = null, r = t === "forward" ? 1 : -1, i = e + r;
		for (; e < this.tabs.length;) {
			if (n = this.tabs[i] || null, n === null) {
				n = t === "forward" ? this.focusableTabs[0] : this.focusableTabs[this.focusableTabs.length - 1];
				break;
			}
			if (!n.disabled) break;
			i += r;
		}
		return n;
	}
	updateScrollButtons() {
		this.hasScrollControls && !this.fixedScrollControls && (this.shouldHideScrollStartButton = this.scrollFromStart() <= this.scrollOffset, this.shouldHideScrollEndButton = this.isScrolledToEnd());
	}
	isScrolledToEnd() {
		return this.scrollFromStart() + this.nav.clientWidth >= this.nav.scrollWidth - this.scrollOffset;
	}
	scrollFromStart() {
		return this.localize.dir() === "rtl" ? -this.nav.scrollLeft : this.nav.scrollLeft;
	}
	updateScrollControls() {
		this.noScrollControls ? this.hasScrollControls = !1 : this.hasScrollControls = ["top", "bottom"].includes(this.placement) && this.nav.scrollWidth > this.nav.clientWidth + 1, this.updateScrollButtons();
	}
	syncIndicator() {
		this.getActiveTab() ? (this.indicator.style.display = "block", this.repositionIndicator()) : this.indicator.style.display = "none";
	}
	show(e) {
		let t = this.tabs.find((t) => t.panel === e);
		t && this.setActiveTab(t, { scrollBehavior: "smooth" });
	}
	render() {
		let e = this.localize.dir() === "rtl";
		return o`
      <div
        part="base"
        class=${g({
			"tab-group": !0,
			"tab-group--top": this.placement === "top",
			"tab-group--bottom": this.placement === "bottom",
			"tab-group--start": this.placement === "start",
			"tab-group--end": this.placement === "end",
			"tab-group--rtl": this.localize.dir() === "rtl",
			"tab-group--has-scroll-controls": this.hasScrollControls
		})}
        @click=${this.handleClick}
        @keydown=${this.handleKeyDown}
      >
        <div class="tab-group__nav-container" part="nav">
          ${this.hasScrollControls ? o`
                <sl-icon-button
                  part="scroll-button scroll-button--start"
                  exportparts="base:scroll-button__base"
                  class=${g({
			"tab-group__scroll-button": !0,
			"tab-group__scroll-button--start": !0,
			"tab-group__scroll-button--start--hidden": this.shouldHideScrollStartButton
		})}
                  name=${e ? "chevron-right" : "chevron-left"}
                  library="system"
                  tabindex="-1"
                  aria-hidden="true"
                  label=${this.localize.term("scrollToStart")}
                  @click=${this.handleScrollToStart}
                ></sl-icon-button>
              ` : ""}

          <div class="tab-group__nav" @scrollend=${this.updateScrollButtons}>
            <div part="tabs" class="tab-group__tabs" role="tablist">
              <div part="active-tab-indicator" class="tab-group__indicator"></div>
              <sl-resize-observer @sl-resize=${this.syncIndicator}>
                <slot name="nav" @slotchange=${this.syncTabsAndPanels}></slot>
              </sl-resize-observer>
            </div>
          </div>

          ${this.hasScrollControls ? o`
                <sl-icon-button
                  part="scroll-button scroll-button--end"
                  exportparts="base:scroll-button__base"
                  class=${g({
			"tab-group__scroll-button": !0,
			"tab-group__scroll-button--end": !0,
			"tab-group__scroll-button--end--hidden": this.shouldHideScrollEndButton
		})}
                  name=${e ? "chevron-left" : "chevron-right"}
                  library="system"
                  tabindex="-1"
                  aria-hidden="true"
                  label=${this.localize.term("scrollToEnd")}
                  @click=${this.handleScrollToEnd}
                ></sl-icon-button>
              ` : ""}
        </div>

        <slot part="body" class="tab-group__body" @slotchange=${this.syncTabsAndPanels}></slot>
      </div>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.CSI2TGZS.js
G.styles = [u, H], G.dependencies = {
	"sl-icon-button": h,
	"sl-resize-observer": W
}, m([i(".tab-group")], G.prototype, "tabGroup", 2), m([i(".tab-group__body")], G.prototype, "body", 2), m([i(".tab-group__nav")], G.prototype, "nav", 2), m([i(".tab-group__indicator")], G.prototype, "indicator", 2), m([r()], G.prototype, "hasScrollControls", 2), m([r()], G.prototype, "shouldHideScrollStartButton", 2), m([r()], G.prototype, "shouldHideScrollEndButton", 2), m([e()], G.prototype, "placement", 2), m([e()], G.prototype, "activation", 2), m([e({
	attribute: "no-scroll-controls",
	type: Boolean
})], G.prototype, "noScrollControls", 2), m([e({
	attribute: "fixed-scroll-controls",
	type: Boolean
})], G.prototype, "fixedScrollControls", 2), m([s({ passive: !0 })], G.prototype, "updateScrollButtons", 1), m([p("noScrollControls", { waitUntilFirstUpdate: !0 })], G.prototype, "updateScrollControls", 1), m([p("placement", { waitUntilFirstUpdate: !0 })], G.prototype, "syncIndicator", 1), G.define("sl-tab-group");
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.ZH2AND3P.js
var ue = (e, t) => {
	let n = 0;
	return function(...r) {
		window.clearTimeout(n), n = window.setTimeout(() => {
			e.call(this, ...r);
		}, t);
	};
}, K = (e, t, n) => {
	let r = e[t];
	e[t] = function(...e) {
		r.call(this, ...e), n.call(this, r, ...e);
	};
};
(() => {
	if (!(typeof window > "u") && !("onscrollend" in window)) {
		let e = /* @__PURE__ */ new Set(), t = /* @__PURE__ */ new WeakMap(), n = (t) => {
			for (let n of t.changedTouches) e.add(n.identifier);
		}, r = (t) => {
			for (let n of t.changedTouches) e.delete(n.identifier);
		};
		document.addEventListener("touchstart", n, !0), document.addEventListener("touchend", r, !0), document.addEventListener("touchcancel", r, !0), K(EventTarget.prototype, "addEventListener", function(n, r) {
			if (r !== "scrollend") return;
			let i = ue(() => {
				e.size ? i() : this.dispatchEvent(new Event("scrollend"));
			}, 100);
			n.call(this, "scroll", i, { passive: !0 }), t.set(this, i);
		}), K(EventTarget.prototype, "removeEventListener", function(e, n) {
			if (n !== "scrollend") return;
			let r = t.get(this);
			r && e.call(this, "scroll", r, { passive: !0 });
		});
	}
})();
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.BQSEJD7X.js
var de = n`
  :host {
    --padding: 0;

    display: none;
  }

  :host([active]) {
    display: block;
  }

  .tab-panel {
    display: block;
    padding: var(--padding);
  }
`, fe = 0, q = class extends d {
	constructor() {
		super(...arguments), this.attrId = ++fe, this.componentId = `sl-tab-panel-${this.attrId}`, this.name = "", this.active = !1;
	}
	connectedCallback() {
		super.connectedCallback(), this.id = this.id.length > 0 ? this.id : this.componentId, this.setAttribute("role", "tabpanel");
	}
	handleActiveChange() {
		this.setAttribute("aria-hidden", this.active ? "false" : "true");
	}
	render() {
		return o`
      <slot
        part="base"
        class=${g({
			"tab-panel": !0,
			"tab-panel--active": this.active
		})}
      ></slot>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.RY756JLP.js
q.styles = [u, de], m([e({ reflect: !0 })], q.prototype, "name", 2), m([e({
	type: Boolean,
	reflect: !0
})], q.prototype, "active", 2), m([p("active")], q.prototype, "handleActiveChange", 1), q.define("sl-tab-panel");
//#endregion
//#region src/components/webmapx-data-analyzer-tool.ts
var pe = new Set([
	"fill",
	"line",
	"circle",
	"symbol",
	"geojson",
	"vector",
	"label",
	"fill-extrusion"
]), J = "webmapx-data-analyzer-out:", Y = "webmapx-data-analyzer-src:", X = [
	{
		cls: "high-high",
		label: "High among high (hot spot)",
		color: "#d7191c"
	},
	{
		cls: "low-low",
		label: "Low among low (cold spot)",
		color: "#2c7bb6"
	},
	{
		cls: "high-low",
		label: "High among low (outlier)",
		color: "#fdae61"
	},
	{
		cls: "low-high",
		label: "Low among high (outlier)",
		color: "#abd9e9"
	},
	{
		cls: "not-significant",
		label: "Not significant",
		color: "#eeeeee"
	},
	{
		cls: "no-data",
		label: "No data",
		color: "#bdbdbd"
	}
], me = "Set1", he = "#d9d9d9", Z = "#f7f7f7", ge = [
	"#e41a1c",
	"#377eb8",
	"#4daf4a",
	"#984ea3",
	"#ff7f00",
	"#ffff33"
], _e = 30, Q = class extends l {
	constructor(...e) {
		super(...e), this.toolId = "data-analyzer", this.availableLayers = [], this.selectedLayerId = "", this.selectedSourceLayer = "", this.analysis = null, this.busy = !1, this.status = "", this.error = null, this.cancelled = !1, this.actionMessage = null, this.lastMapLayers = {}, this.overwrite = !0, this.lastOutputLayerIds = [], this.logOverride = {}, this.kindOverride = {}, this.lastFeatures = [], this.attributeCatalog = {}, this.analyzeToken = 0, this.lastMapBusy = !1, this.worker = null;
	}
	static {
		this.styles = [
			y,
			ne,
			n`
        :host { display: block; }
        :host(:not([active])) .tool-content { display: none; }

        .tool-content {
            padding: var(--sl-spacing-medium);
            min-height: 260px;
            display: flex;
            flex-direction: column;
            gap: var(--sl-spacing-small);
            font-size: var(--sl-font-size-small);
        }

        .row {
            display: flex;
            align-items: center;
            gap: var(--sl-spacing-x-small);
        }

        .row sl-select { flex: 1; min-width: 0; }

        .meta {
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
        }

        .warning {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            color: var(--sl-color-warning-700, #915930);
            font-size: var(--sl-font-size-x-small);
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px;
        }

        .metric {
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--webmapx-radius-md, 6px);
            padding: 6px;
        }

        .metric strong {
            display: block;
            font-size: var(--sl-font-size-medium);
        }

        .cards {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .item {
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--webmapx-radius-md, 6px);
            padding: 8px;
        }

        .item-head {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 3px;
        }

        .item-title {
            flex: 1;
            min-width: 0;
            font-weight: 600;
            overflow-wrap: anywhere;
        }

        .field-list {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 6px;
        }

        .field {
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--webmapx-radius-sm, 4px);
            padding: 2px 5px;
            font-size: var(--sl-font-size-x-small);
            overflow-wrap: anywhere;
        }

        .profile {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 2px 8px;
        }

        .profile-name {
            font-weight: 600;
            overflow-wrap: anywhere;
        }

        .profile-stats {
            grid-column: 1 / -1;
            display: flex;
            flex-wrap: wrap;
            gap: 2px 10px;
            color: var(--sl-color-neutral-600, #5f6b76);
            font-size: var(--sl-font-size-x-small);
        }

        .profile-stats span {
            white-space: nowrap;
        }

        .actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: flex-end;
            gap: 4px 6px;
            margin-top: 6px;
        }

        .related {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 4px;
            margin-top: 6px;
        }

        /* Field names are long and the panel is narrow: a button wraps its
           label instead of pushing the row out of the panel. */
        .actions sl-button, .related sl-button { max-width: 100%; }
        .actions sl-button::part(base), .related sl-button::part(base) { height: auto; min-height: var(--sl-input-height-small); }
        .actions sl-button::part(label), .related sl-button::part(label) {
            white-space: normal;
            overflow-wrap: anywhere;
            line-height: 1.3;
            padding-block: 3px;
            text-align: left;
        }

        sl-tab-group {
            --indicator-color: var(--color-primary, #1b6ec2);
        }

        sl-alert { font-size: var(--sl-font-size-x-small); }
        sl-select { --sl-input-height-medium: 28px; --sl-input-font-size-medium: var(--sl-font-size-small); }
    `
		];
	}
	onActivate() {
		!this.selectedLayerId && this.availableLayers.length ? this.selectLayer(this.defaultLayerId()) : this.selectedLayerId && !this.analysis && !this.busy && this.runAnalysis();
	}
	onStateChanged(e) {
		let t = e.mapLayers ?? {};
		this.lastMapLayers = t, this.attributeCatalog = e.attributeMetadata ?? {}, this.lastOutputLayerIds.some((e) => !t[e]) && (this.lastOutputLayerIds = this.lastOutputLayerIds.filter((e) => t[e])), this.availableLayers = Object.entries(t).filter(([, e]) => {
			let t = e.layerType;
			return !t || pe.has(t);
		}).map(([e, t]) => ({
			id: e,
			label: t.label ?? e
		})), this.selectedLayerId && !this.availableLayers.some((e) => e.id === this.selectedLayerId) && (this.selectedLayerId = "", this.selectedSourceLayer = "", this.analysis = null), !this.selectedLayerId && this.active && this.availableLayers.length && this.selectLayer(this.defaultLayerId());
		let n = e.mapBusy === !0, r = this.lastMapBusy && !n;
		this.lastMapBusy = n, r && this.active && this.selectedLayerId && !this.analysis && this.isViewportLimited(this.selectedLayerId) && this.runAnalysis();
	}
	defaultLayerId() {
		let e = [...this.availableLayers].reverse();
		return (e.find((e) => !e.id.startsWith(J) && this.lastMapLayers[e.id]?.visible !== !1) ?? e[0]).id;
	}
	selectLayer(e) {
		let t = this.sourceLayers(e);
		this.selectedLayerId = e, this.selectedSourceLayer = t[0] ?? "", this.analysis = null, this.error = null, this.cancelled = !1, this.actionMessage = null, this.active && this.runAnalysis();
	}
	sourceLayers(e) {
		let t = this.lastMapLayers[e]?.sublayers;
		if (!Array.isArray(t)) return [];
		let n = /* @__PURE__ */ new Set(), r = (e) => {
			for (let t of e) {
				if (!t || typeof t != "object") continue;
				let e = t;
				typeof e["source-layer"] == "string" && e["source-layer"] && n.add(e["source-layer"]), Array.isArray(e.sublayers) && r(e.sublayers);
			}
		};
		return r(t), [...n];
	}
	isViewportLimited(e) {
		let t = this.lastMapLayers[e]?.sourceId;
		return te(this.adapter, t);
	}
	labelOf(e) {
		return this.availableLayers.find((t) => t.id === e)?.label ?? e;
	}
	async runAnalysis() {
		if (!this.adapter || !this.selectedLayerId || this.busy) return;
		let e = ++this.analyzeToken;
		this.cancelWorker(), this.busy = !0, this.status = "Reading layer features...", this.error = null, this.cancelled = !1, this.actionMessage = null;
		try {
			await this.updateComplete, await new Promise((e) => requestAnimationFrame(() => e(null)));
			let t = await ee(this.adapter, this.selectedLayerId, {
				sourceId: this.lastMapLayers[this.selectedLayerId]?.sourceId,
				sourceLayer: this.selectedSourceLayer || void 0
			});
			if (e !== this.analyzeToken) return;
			if (!t.features) {
				this.error = "This layer cannot be read for analysis.", this.analysis = null;
				return;
			}
			if (t.features.length === 0) {
				this.error = this.isViewportLimited(this.selectedLayerId) ? "No features are drawn in the current view. Zoom or pan to the features you want to analyze." : "This layer has no features.", this.analysis = null;
				return;
			}
			this.status = `Preparing ${t.features.length} features for analysis...`, this.lastFeatures = t.features, this.analysis = await this.analyzeInWorker(t.features, t.complete, e);
		} catch (t) {
			e === this.analyzeToken && (console.error("[data-analyzer] analysis failed", t), this.error = t instanceof Error ? t.message : String(t), this.analysis = null);
		} finally {
			e === this.analyzeToken && (this.busy = !1, this.status = "");
		}
	}
	analyzeInWorker(e, t, n) {
		return this.runWorker({
			op: "analyze",
			properties: e.map((e) => e.properties ?? {}),
			geometries: e.map((e) => e.geometry ?? null),
			complete: t
		}, n).then((e) => {
			if (e.status !== "ok") throw Error("Unexpected analysis response.");
			return e.analysis;
		});
	}
	runWorker(e, t) {
		return new Promise((n, r) => {
			let i = new Worker(new URL(
				/* @vite-ignore */
				"" + new URL("assets/data-analyzer.worker-D9G9wWIW.js", import.meta.url).href,
				"" + import.meta.url
			), { type: "module" });
			this.worker = i, i.onmessage = (e) => {
				if (t !== this.analyzeToken || i !== this.worker) return;
				let a = e.data;
				a.status === "progress" ? this.status = a.message : a.status === "error" ? (this.cancelWorker(), r(Error(a.message))) : (this.cancelWorker(), n(a));
			}, i.onerror = (e) => {
				t !== this.analyzeToken || i !== this.worker || (this.cancelWorker(), r(Error(e.message || "Data analysis worker failed.")));
			};
			try {
				i.postMessage(e);
			} catch (e) {
				this.cancelWorker(), r(e instanceof Error ? e : Error(String(e)));
			}
		});
	}
	disconnectedCallback() {
		this.cancelWorker(), super.disconnectedCallback();
	}
	cancelAnalysis() {
		this.analyzeToken++, this.cancelWorker(), this.busy = !1, this.status = "", this.cancelled = !0;
	}
	cancelWorker() {
		this.worker?.terminate(), this.worker = null;
	}
	render() {
		let e = this.selectedLayerId ? this.sourceLayers(this.selectedLayerId) : [];
		return o`
            <div class="tool-content">
                <div class="row">
                    <sl-select
                        label="Layer"
                        size="small"
                        value=${this.selectedLayerId}
                        ?disabled=${this.busy || this.availableLayers.length === 0}
                        @sl-change=${(e) => this.selectLayer(e.target.value)}
                    >
                        ${this.availableLayers.length ? this.availableLayers.map((e) => o`<sl-option value=${e.id}>${e.label}</sl-option>`) : o`<sl-option value="">No vector layers on the map</sl-option>`}
                    </sl-select>
                    <!-- The name is the icon's label: an aria-label on a Shoelace button
                         never reaches the button inside it, so this one had no name. -->
                    <sl-button
                        size="small"
                        class=${this.busy ? "" : "icon-only"}
                        ?disabled=${!this.selectedLayerId}
                        title=${this.busy ? "Cancel analysis" : "Run analysis"}
                        @click=${() => this.busy ? this.cancelAnalysis() : this.runAnalysis()}
                    >
                        ${this.busy ? o`Cancel` : o`<sl-icon name="arrow-clockwise" label="Run analysis"></sl-icon>`}
                    </sl-button>
                </div>
                ${e.length > 1 ? o`
                    <sl-select
                        label="Sub-layer"
                        size="small"
                        value=${this.selectedSourceLayer}
                        ?disabled=${this.busy}
                        @sl-change=${(e) => {
			this.selectedSourceLayer = e.target.value, this.analysis = null, this.runAnalysis();
		}}
                    >
                        ${e.map((e) => o`<sl-option value=${e}>${e}</sl-option>`)}
                    </sl-select>
                ` : t}
                ${this.selectedLayerId && this.isViewportLimited(this.selectedLayerId) ? o`
                    <div class="warning">
                        <sl-icon name="exclamation-triangle"></sl-icon>
                        MVT and other tile-backed layers are analyzed from features drawn in the current view.
                    </div>
                ` : t}
                ${this.busy ? o`<div class="hint help-text">${this.status || `Waiting for ${this.labelOf(this.selectedLayerId)} analysis…`}</div>` : t}
                ${this.cancelled ? o`<div class="hint help-text">Analysis cancelled. Press refresh to run it again.</div>` : t}
                ${this.error ? o`<sl-alert variant="danger" open>${this.error}</sl-alert>` : t}
                ${this.actionMessage ? o`<sl-alert variant="success" open>${this.actionMessage}</sl-alert>` : t}
                ${this.analysis ? this.renderAnalysis(this.analysis) : t}
            </div>
        `;
	}
	renderAnalysis(e) {
		return o`
            <div class="summary">
                <div class="metric"><strong>${e.featureCount}</strong><span class="meta">features</span></div>
                <div class="metric"><strong>${e.profiles.length}</strong><span class="meta">fields</span></div>
                <div class="metric"><strong>${e.usableNumericFields.length}</strong><span class="meta">usable</span></div>
            </div>
            ${e.complete ? t : o`
                <sl-alert variant="warning" open>Results use loaded viewport features, not the full source.</sl-alert>
            `}
            <sl-tab-group>
                <sl-tab slot="nav" panel="suggestions">Options</sl-tab>
                <sl-tab slot="nav" panel="fields">Fields</sl-tab>
                <sl-tab slot="nav" panel="families">Families</sl-tab>

                <sl-tab-panel name="suggestions">${this.renderSuggestions(e.suggestions, e.profiles)}</sl-tab-panel>
                <sl-tab-panel name="fields">${this.renderProfiles(e.profiles)}</sl-tab-panel>
                <sl-tab-panel name="families">${this.renderFamilies(e)}</sl-tab-panel>
            </sl-tab-group>
        `;
	}
	renderSuggestions(e, n) {
		if (!e.length) return o`<div class="hint help-text">No strong options found yet.</div>`;
		let r = new Map(n.map((e) => [e.name, e]));
		return o`<div class="cards">${e.map((e) => o`
            <div class="item">
                <div class="item-head">
                    <div class="item-title">${e.title}</div>
                    <sl-badge>${Math.round(e.strength * 100)}%</sl-badge>
                </div>
                <div class="meta">${e.description}</div>
                <div class="field-list">${e.fields.map((e) => o`<span class="field">${e}</span>`)}</div>
                ${e.kind === "family" && this.familyOf(e) ? o`
                    <div class="actions">
                        <sl-button size="small" ?disabled=${this.busy} @click=${() => this.mapProfiles(this.familyOf(e))}>
                            Map profiles
                        </sl-button>
                    </div>
                ` : t}
                ${e.kind === "spatial" && e.fields[0] ? o`
                    <div class="actions">
                        <sl-switch
                            size="small"
                            ?checked=${this.logFor(e.fields[0])}
                            @sl-change=${(t) => {
			this.logOverride = {
				...this.logOverride,
				[e.fields[0]]: t.target.checked
			};
		}}
                        >Log scale</sl-switch>
                        <sl-button size="small" ?disabled=${this.busy} @click=${() => this.mapClusters([e.fields[0]])}>
                            Map clusters
                        </sl-button>
                    </div>
                    ${this.relatedClusterFields(e.fields[0]).length > 1 ? o`
                        <div class="related">
                            <span class="meta">Clusters of related fields:</span>
                            ${this.relatedClusterFields(e.fields[0]).filter((t) => t !== e.fields[0]).map((e) => o`
                                <sl-button size="small" ?disabled=${this.busy} @click=${() => this.mapClusters([e])}>${e}</sl-button>
                            `)}
                        </div>
                    ` : t}
                ` : t}
                ${e.kind === "map" && e.fields[0] ? o`
                    <div class="actions">
                        <sl-radio-group
                            size="small"
                            class="label-hidden"
                            label="Map values as"
                            value=${this.kindOf(e.fields[0])}
                            @sl-change=${(t) => {
			this.kindOverride = {
				...this.kindOverride,
				[e.fields[0]]: t.target.value
			};
		}}
                        >
                            <sl-radio-button value="absolute">Count</sl-radio-button>
                            <sl-radio-button value="relative">Rate</sl-radio-button>
                        </sl-radio-group>
                        <sl-button size="small" @click=${() => this.mapSuggestion(e, r.get(e.fields[0]))}>
                            Map this
                        </sl-button>
                    </div>
                ` : t}
            </div>
        `)}</div>
        ${this.lastOutputLayerIds.length ? o`
            <sl-checkbox size="small" ?checked=${this.overwrite}
                @sl-change=${(e) => {
			this.overwrite = e.target.checked;
		}}
            >Replace previous result</sl-checkbox>
        ` : t}`;
	}
	get mapElement() {
		return this.mapHost;
	}
	unitOf(e) {
		let t = this.lastMapLayers[this.selectedLayerId]?.attributes;
		return b(t, this.attributeCatalog).get(e)?.unit ?? "";
	}
	numbersOf(e, t) {
		return e.map((e) => e.properties?.[t]).filter((e) => e != null && e !== "").map(Number).filter(Number.isFinite);
	}
	kindOf(e) {
		return this.kindOverride[e] ? this.kindOverride[e] : this.analysis?.areaFields?.includes(e) ? "relative" : re(e, this.numbersOf(this.lastFeatures, e), this.unitOf(e));
	}
	async mapSuggestion(e, t) {
		let n = e.fields[0];
		if (!n || this.lastFeatures.length === 0) {
			this.error = "Run the analysis before creating a map.";
			return;
		}
		let r = j(this.lastFeatures);
		if (r === "none" || r === "mixed") {
			this.error = r === "none" ? "This layer has no geometry to map." : "This layer mixes points, lines and polygons; map one geometry type at a time.";
			return;
		}
		let i = this.kindOf(n), a = t ? t.numericShare >= .8 : !0, o = this.labelOf(this.selectedLayerId), s = [], c = this.lastFeatures.map((e) => ({
			type: "Feature",
			...e.id === void 0 ? {} : { id: e.id },
			geometry: e.geometry,
			properties: { ...e.properties ?? {} }
		})), l = n, u = n, d, f = null, p = !1, m = a && i === "absolute" && r === "polygon" ? this.areaFieldFor(n) : null;
		if (m) {
			let e = `${n}_per_km2`, t = m.factor;
			c = c.map((r) => {
				let i = Number(r.properties?.[n]), a = Number(r.properties?.[m.field]) * t, o = r.properties?.[n], s = o != null && o !== "" && Number.isFinite(i) && a > 0;
				return {
					...r,
					properties: {
						...r.properties,
						[e]: s ? i / a : null
					}
				};
			}), f = {
				value: [
					"/",
					["to-number", ["get", n]],
					[
						"*",
						["to-number", ["get", m.field]],
						t
					]
				],
				has: [
					"all",
					["has", n],
					["has", m.field],
					[
						">",
						[
							"to-number",
							["get", m.field],
							0
						],
						0
					]
				]
			}, l = e, u = `${n} per km²`, s.push(`Area taken from ${m.field} (1 unit = ${m.factor} km²).`);
		} else if (a && i === "absolute" && r === "polygon") {
			p = !0;
			let e = ae(c, n);
			c = e.features, l = e.densityField, u = `${n} per km²`, e.groupCount < e.partCount && s.push(`${e.partCount} parts with identical attributes counted as ${e.groupCount} features.`), e.groupingSkipped && s.push(e.groupingSkipped);
		}
		if (a && i === "absolute" && r === "point") {
			let e = Math.max(0, ...this.numbersOf(c, n));
			if (e <= 0) {
				this.error = `Nothing to size by in ${n}.`;
				return;
			}
			d = {
				type: "circle",
				layout: { "circle-sort-key": ["-", [
					"to-number",
					["get", n],
					0
				]] },
				paint: {
					"circle-color": E,
					"circle-opacity": .75,
					"circle-radius": x({
						field: n,
						maxValue: e,
						maxRadius: _e
					}).expression,
					"circle-stroke-color": "#ffffff",
					"circle-stroke-width": 1
				}
			};
		} else if (a && i === "absolute" && r === "line") {
			let e = Math.max(0, ...this.numbersOf(c, n));
			if (e <= 0) {
				this.error = `Nothing to size by in ${n}.`;
				return;
			}
			d = {
				type: "line",
				paint: {
					"line-color": E,
					"line-width": oe(n, e)
				}
			};
		} else {
			let e = a ? ce(c, l) : {
				split: !1,
				zeroCount: 0,
				rest: c
			}, t = S(e.rest, a, {
				...w(l),
				niceBreaks: !0
			});
			if (!t) {
				this.error = `Nothing to classify for ${l}.`;
				return;
			}
			if (t.channel === null) {
				this.error = t.problem;
				return;
			}
			let n = e.split ? le(l, T(t.channel)) : T(t.channel);
			e.split && s.push(`${e.zeroCount} ${e.zeroCount === 1 ? "feature" : "features"} with ${l} = 0 ${e.zeroCount === 1 ? "has its" : "have their"} own class.`), d = r === "polygon" ? {
				type: "fill",
				paint: {
					"fill-color": n,
					"fill-opacity": .8
				}
			} : r === "line" ? {
				type: "line",
				paint: {
					"line-color": n,
					"line-width": 3
				}
			} : {
				type: "circle",
				paint: {
					"circle-color": n,
					"circle-radius": 6,
					"circle-stroke-color": "#ffffff",
					"circle-stroke-width": 1
				}
			};
		}
		let h = i === "absolute" ? r === "polygon" ? "density per km²" : r === "line" ? "proportional width" : "proportional circles" : "colour classes", g = p ? null : this.originalSource(r);
		if (g) {
			f && (d = N(d, l, f.value, f.has));
			let e = !(a && i === "absolute" && (r === "point" || r === "line"));
			this.isViewportLimited(this.selectedLayerId) && s.push(e ? `Styled on the original source; class breaks come from the ${this.lastFeatures.length} features that were in view.` : `Styled on the original source; sizes are scaled to the largest value among the ${this.lastFeatures.length} features that were in view.`);
		} else p && s.push("Areas were measured from the drawn geometry, so the result is a copy of the features.");
		let _ = g ? {
			key: n,
			source: g,
			style: d,
			label: `${o}: ${u}`,
			what: `${n} as ${h}`
		} : {
			key: n,
			features: c,
			style: d,
			label: `${o}: ${u}`,
			what: `${n} as ${h}`
		};
		if (await this.addOutputLayers([_]) === 0) {
			this.error = `Could not add a layer for ${n}.`;
			return;
		}
		this.error = null, this.actionMessage = [`Mapped ${u} from ${o} as ${h}.`, ...s].join(" ");
	}
	async addOutputLayers(e) {
		let t = this.overwrite ? "" : `-${Date.now()}`;
		if (this.overwrite && this.mapElement) {
			for (let e of this.lastOutputLayerIds) {
				this.adapter?.getSource(e.replace(J, Y))?.setData({
					type: "FeatureCollection",
					features: []
				});
				try {
					this.mapElement.removeInlineLayer(e);
				} catch {}
			}
			this.lastOutputLayerIds = [];
		}
		let n = !this.isViewportLimited(this.selectedLayerId), r = this.labelOf(this.selectedLayerId), i = [];
		for (let a of e) {
			let e = `${J}${this.selectedLayerId}:${a.key}${t}`, o = `${Y}${this.selectedLayerId}:${a.key}${t}`, s = `Created with webmapx tool Data analyzer: ${a.what}, from layer: ${r}` + (a.source ? n ? "." : ". Styled on the full source; class breaks were computed from the features in view at the time." : n ? "." : ". Contains only the features drawn in the view at the time."), c = a.source ? {
				source: a.source.sourceId,
				sources: { [a.source.sourceId]: a.source.config },
				...a.source.sourceLayer ? { "source-layer": a.source.sourceLayer } : {},
				...a.source.filter ? { filter: a.source.filter } : {}
			} : {
				source: o,
				sources: { [o]: {
					id: o,
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: a.features ?? []
					}
				} }
			};
			await this.mapElement?.addLayerRequest({
				id: e,
				...c,
				...a.style,
				metadata: {
					label: a.label,
					abstract: s,
					dynamic: !0,
					legendRole: "overlay"
				}
			}) && i.push(e);
		}
		return this.lastOutputLayerIds = i, i.length;
	}
	originalSource(e) {
		let t = this.lastMapLayers[this.selectedLayerId], n = typeof t?.sourceId == "string" ? t.sourceId : null;
		if (!n || !this.adapter) return null;
		let r = this.adapter.getSourceConfig(n), i = r?.type;
		if (!r || i !== "vector" && i !== "geojson") return null;
		let a = e === "polygon" ? "fill" : e === "line" ? "line" : "circle", o = (e) => !this.selectedSourceLayer || e["source-layer"] === this.selectedSourceLayer, s = this.adapter.getSubLayers(this.selectedLayerId) ?? [], c = s.find((e) => o(e) && e.type === a) ?? s.find(o), l = (typeof c?.["source-layer"] == "string" ? c["source-layer"] : "") || this.selectedSourceLayer || (typeof t?.sourceLayer == "string" ? t.sourceLayer : "");
		return i === "vector" && !l ? null : {
			sourceId: n,
			config: r,
			...l ? { sourceLayer: l } : {},
			...c?.filter ? { filter: c.filter } : {}
		};
	}
	areaFieldFor(e) {
		for (let t of this.analysis?.areaFields ?? []) {
			if (t === e) continue;
			let n = P(this.lastFeatures, t);
			if (n) return {
				field: t,
				factor: n
			};
		}
		return null;
	}
	familyOf(e) {
		let t = this.analysis?.families.find((t) => `family:${t.name}` === e.id);
		return t && t.fields.length >= 2 ? t : null;
	}
	async mapProfiles(e) {
		if (this.lastFeatures.length === 0 || !this.analysis || this.busy) return;
		let t = j(this.lastFeatures);
		if (t === "none" || t === "mixed") {
			this.error = t === "none" ? "This layer has no geometry to map." : "This layer mixes points, lines and polygons; map one geometry type at a time.";
			return;
		}
		let n = this.analysis, r = ++this.analyzeToken;
		this.busy = !0, this.error = null, this.actionMessage = null;
		let i;
		try {
			let t = await this.runWorker({
				op: "profile",
				properties: this.lastFeatures.map((e) => e.properties ?? {}),
				fields: e.fields.map((e) => ({
					field: e,
					noData: (n.profiles.find((t) => t.name === e)?.suspectedNoData ?? []).map((e) => e.value)
				}))
			}, r);
			if (t.status !== "profile") throw Error("Unexpected profile response.");
			i = t.types;
		} catch (e) {
			r === this.analyzeToken && (this.error = e instanceof Error ? e.message : String(e));
			return;
		} finally {
			r === this.analyzeToken && (this.busy = !1, this.status = "");
		}
		if (r !== this.analyzeToken) return;
		if (!i) {
			this.error = `Too few features with all of ${e.fields.length} parts to find types.`;
			return;
		}
		let a = I(e.fields), o = i.centres.map((e, t) => `${"ABCDEF"[t]}: ${F(e, i.overall, a)}`), s = "No data", c = "profile_type", l = this.lastFeatures.map((e, t) => ({
			type: "Feature",
			...e.id === void 0 ? {} : { id: e.id },
			geometry: e.geometry,
			properties: {
				...e.properties ?? {},
				[c]: i.assignments[t] >= 0 ? o[i.assignments[t]] : s
			}
		})), u = i.centres.map((e) => F(e, i.overall, a) === "close to average"), d = u.filter((e) => !e).length, f = C(me, Math.max(3, d))?.colors ?? ge, p = 0, m = o.flatMap((e, t) => [e, u[t] ? he : f[p++ % f.length]]), h = i.assignments.some((e) => e < 0), g = [
			"match",
			["get", c],
			...m,
			...h ? [s, Z] : [],
			Z
		], _ = t === "polygon" ? {
			type: "fill",
			paint: {
				"fill-color": g,
				"fill-opacity": .8
			}
		} : t === "line" ? {
			type: "line",
			paint: {
				"line-color": g,
				"line-width": 3
			}
		} : {
			type: "circle",
			paint: {
				"circle-color": g,
				"circle-radius": 6,
				"circle-stroke-color": "#ffffff",
				"circle-stroke-width": 1
			}
		}, v = this.labelOf(this.selectedLayerId);
		if (await this.addOutputLayers([{
			key: `profile:${e.name}`,
			features: l,
			style: _,
			label: `${v}: ${e.name} types`,
			what: `composition types of ${e.fields.join(", ")} (k-means on centred log-ratios, ${i.sizes.length} types)`
		}]) === 0) {
			this.error = `Could not add a layer for ${e.name}.`;
			return;
		}
		let y = i.silhouette >= .5 ? "well separated" : i.silhouette >= .25 ? "reasonably separated" : "weakly separated — the mixes change gradually rather than falling into types", b = i.assignments.filter((e) => e < 0).length;
		this.actionMessage = `Mapped ${i.sizes.length} types of ${e.name} (${i.sizes.join(" / ")} features, ${y}, silhouette ${i.silhouette.toFixed(2)}).` + (b ? ` ${b} features miss a part and have no type.` : "");
	}
	relatedClusterFields(e) {
		let t = new Set(this.analysis?.areaFields ?? []), n = new Set((this.analysis?.spatial ?? []).map((e) => e.field).filter((n) => !t.has(n) || n === e));
		return (this.analysis?.families ?? []).map((e) => e.fields.filter((e) => n.has(e))).filter((t) => t.includes(e) && t.length > 1).sort((e, t) => e.length - t.length)[0] ?? [e];
	}
	logFor(e) {
		return this.logOverride[e] ?? this.analysis?.spatial?.find((t) => t.field === e)?.log ?? !1;
	}
	async mapClusters(e) {
		if (e.length === 0 || this.lastFeatures.length === 0 || !this.analysis || this.busy) return;
		let t = j(this.lastFeatures);
		if (t === "none" || t === "mixed") {
			this.error = t === "none" ? "This layer has no geometry to test." : "This layer mixes points, lines and polygons; test one geometry type at a time.";
			return;
		}
		let n = this.analysis, r = e.map((e) => ({
			field: e,
			noData: (n.profiles.find((t) => t.name === e)?.suspectedNoData ?? []).map((e) => e.value),
			density: t === "polygon" && this.kindOf(e) === "absolute",
			log: this.logFor(e)
		})), i = ++this.analyzeToken;
		this.busy = !0, this.error = null, this.actionMessage = null;
		let a;
		try {
			let e = await this.runWorker({
				op: "lisa",
				properties: this.lastFeatures.map((e) => e.properties ?? {}),
				geometries: this.lastFeatures.map((e) => e.geometry ?? null),
				fields: r
			}, i);
			if (e.status !== "lisa") throw Error("Unexpected cluster response.");
			a = e.results;
		} catch (e) {
			i === this.analyzeToken && (this.error = e instanceof Error ? e.message : String(e));
			return;
		} finally {
			i === this.analyzeToken && (this.busy = !1, this.status = "");
		}
		if (i !== this.analyzeToken || a.length === 0) return;
		let o = new Map(X.map((e) => [e.cls, e.label])), s = this.labelOf(this.selectedLayerId), c = a.map((e) => {
			let n = `lisa_${e.field}`, r = this.lastFeatures.map((t, r) => ({
				type: "Feature",
				...t.id === void 0 ? {} : { id: t.id },
				geometry: t.geometry,
				properties: {
					...t.properties ?? {},
					[n]: o.get(e.classes[r])
				}
			})), i = X.filter((t) => e.counts[t.cls] > 0), a = [
				"match",
				["get", n],
				...i.flatMap((e) => [e.label, e.color]),
				"#bdbdbd"
			], c = t === "polygon" ? {
				type: "fill",
				paint: {
					"fill-color": a,
					"fill-opacity": .8
				}
			} : t === "line" ? {
				type: "line",
				paint: {
					"line-color": a,
					"line-width": 3
				}
			} : {
				type: "circle",
				paint: {
					"circle-color": a,
					"circle-radius": 6,
					"circle-stroke-color": "#ffffff",
					"circle-stroke-width": 1
				}
			}, l = `${e.density ? " per km²" : ""}${e.log ? ", log scale" : ""}`;
			return {
				key: `lisa:${e.field}`,
				features: r,
				style: c,
				label: `${s}: ${e.field}${e.density ? " per km²" : ""} clusters`,
				what: `local clusters of ${e.field}${l} (local Moran's I, analytic p-values, FDR 5%)`
			};
		});
		if (await this.addOutputLayers(c) === 0) {
			this.error = `Could not add a cluster layer for ${e.join(", ")}.`;
			return;
		}
		let l = (e, t) => `${e} ${t}${e === 1 ? "" : "s"}`, u = a[0], d = u.neighbours === "contiguity" ? "shared borders" : "distance (6 nearest)", f = u.unitCount < this.lastFeatures.length ? ` ${this.lastFeatures.length} parts with identical attributes were tested as ${u.unitCount} features.` : "", p = (e) => {
			let t = e.counts;
			return `${t["high-high"]} hot, ${t["low-low"]} cold, ${l(t["high-low"] + t["low-high"], "outlier")}${e.log ? " (log)" : ""}`;
		};
		if (a.length === 1) {
			let e = u.counts, t = [
				`${e["high-high"]} in hot spots`,
				`${e["low-low"]} in cold spots`,
				l(e["high-low"] + e["low-high"], "outlier"),
				`${e["not-significant"]} not significant`
			];
			e["no-data"] && t.push(`${e["no-data"]} without data`), this.actionMessage = `Mapped ${u.field} clusters${u.log ? " on a log scale" : ""}: ${t.join(", ")}. Neighbours by ${d}.${f}`;
		} else this.actionMessage = `Mapped clusters for ${a.length} fields — ${a.map((e) => `${e.field}: ${p(e)}`).join("; ")}. Neighbours by ${d}.${f}`;
	}
	renderProfiles(e) {
		return o`<div class="cards">${[...e].sort((e, t) => {
			let n = (e) => (e.role === "measure" ? 3 : 0) + (e.suspectedNoData.length ? 2 : 0) + (e.stats?.standardDeviation ?? 0);
			return n(t) - n(e);
		}).slice(0, 30).map((e) => o`
                <div class="item profile">
                    <div class="profile-name">${e.name}</div>
                    <sl-badge variant=${e.role === "measure" ? "success" : "neutral"}>${e.role}</sl-badge>
                <div class="meta">${e.family}</div>
                <div class="profile-stats">
                    <span>type: ${e.dataType}</span>
                    <span>count: ${e.total - e.missing}</span>
                    <span>unique: ${e.unique}</span>
                    <span>missing: ${e.missing}</span>
                    ${e.stats ? o`
                        <span>min: ${$(e.stats.min)}</span>
                        <span>max: ${$(e.stats.max)}</span>
                        <span>avg: ${$(e.stats.mean)}</span>
                        <span>median: ${$(e.stats.median)}</span>
                    ` : t}
                </div>
                ${e.suspectedNoData.length ? o`
                    <div class="meta">no-data: ${e.suspectedNoData.map((e) => `${e.value} (${e.count})`).join(", ")}</div>
                ` : t}
            </div>
        `)}</div>`;
	}
	renderFamilies(e) {
		let n = e.families.filter((e) => e.fields.length > 0);
		return n.length ? o`<div class="cards">${n.map((e) => o`
            <div class="item">
                <div class="item-head">
                    <div class="item-title">${e.name}</div>
                    <sl-badge>${e.fields.length}</sl-badge>
                </div>
                ${e.reason ? o`<div class="meta">${e.reason}</div>` : t}
                <div class="field-list">${e.fields.slice(0, 12).map((e) => o`<span class="field">${e}</span>`)}</div>
            </div>
        `)}
        ${e.familyBorders.length ? o`
            <div class="item">
                <div class="item-head">
                    <div class="item-title">Likely family borders</div>
                    <sl-badge>${e.familyBorders.length}</sl-badge>
                </div>
                <div class="cards">
                    ${e.familyBorders.slice(0, 10).map((e) => o`
                        <div class="meta">
                            ${e.afterField} → ${e.beforeField}
                            · ${Math.round(e.confidence * 100)}%
                            · ${e.reason}
                        </div>
                    `)}
                </div>
            </div>
        ` : t}
        </div>` : o`<div class="hint help-text">No groups of related fields found.</div>`;
	}
};
c([r()], Q.prototype, "availableLayers", void 0), c([r()], Q.prototype, "selectedLayerId", void 0), c([r()], Q.prototype, "selectedSourceLayer", void 0), c([r()], Q.prototype, "analysis", void 0), c([r()], Q.prototype, "busy", void 0), c([r()], Q.prototype, "status", void 0), c([r()], Q.prototype, "error", void 0), c([r()], Q.prototype, "cancelled", void 0), c([r()], Q.prototype, "actionMessage", void 0), c([r()], Q.prototype, "lastMapLayers", void 0), c([r()], Q.prototype, "overwrite", void 0), c([r()], Q.prototype, "lastOutputLayerIds", void 0), c([r()], Q.prototype, "logOverride", void 0), c([r()], Q.prototype, "kindOverride", void 0), Q = c([a("webmapx-data-analyzer-tool")], Q);
function $(e) {
	if (!Number.isFinite(e)) return String(e);
	let t = Math.abs(e);
	if (t > 1e9 || t > 0 && t < 1e-6) return e.toExponential(4);
	if (Number.isInteger(e)) return String(e);
	let n = Math.max(0, 4 - Math.floor(Math.log10(t)) - 1);
	return e.toFixed(Math.min(8, n)).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}
//#endregion
export { Q as WebmapxDataAnalyzerTool };
