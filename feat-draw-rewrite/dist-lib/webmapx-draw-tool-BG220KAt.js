import { a as e, d as t, h as n, i as r, l as i, n as a, o, p as s, r as c, s as l } from "./decorators-d8E4nZJy.js";
import { t as u } from "./decorate-Bl-DXcQA.js";
import { t as d } from "./webmapx-modal-tool-CA-2uVss.js";
import { a as f, i as p, o as m, s as h } from "./directive-helpers-Debt3Tx3.js";
import { a as ee, i as te, o as ne, s as re, t as ie } from "./chunk.AJ3ENQ5C-CwL2xu8w.js";
import { t as ae } from "./chunk.YHLNUJ7P-BjspQfLm.js";
import { a as oe, i as se, n as g, o as ce, r as _ } from "./chunk.NYIIDP5N-gftugmWL.js";
import { t as le } from "./chunk.6CTB5ZDJ-DjZrBd6Y.js";
import "./chunk.36O46B5H-CNPWSZFH.js";
import { t as ue } from "./chunk.3RPBFEDE-DBlOq5Pm.js";
import "./chunk.MAQXLKQ7-BSeX409m.js";
import { t as de } from "./button-DE9ytwxI.js";
import { n as fe } from "./live-BR4apkFB.js";
import "./chunk.SI4ACBFK-CdJVQctt.js";
import { n as pe, t as me } from "./dialog-DHGOXEHq.js";
import "./icon-Qf3FyAAL.js";
import { t as he } from "./control-surface-styles-zbl1JfZH.js";
import { t as v } from "./chunk.HF7GESMZ-DTzcQjL1.js";
import { t as ge } from "./input-eCCT7kEl.js";
import { a as _e, i as ve, r as ye } from "./tooltip-BpVD9b5o.js";
import { a as be, i as y, r as xe } from "./data-colors-BglhXRFr.js";
import "./icon-button-DxwGf0BN.js";
import { t as Se } from "./chunk.5JY5FUCG-dkh_eGt_.js";
import { a as b, i as Ce, t as we } from "./geo-calculations-DcpPxqU9.js";
import { t as Te } from "./chunk.A36OXQYR-DgnZveyb.js";
import "./option-C8qYanYH.js";
import { r as Ee } from "./map-layer-registry-LK1CJS-X.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.LXP7GVU3.js
var De = n`
  :host {
    display: inline-block;
  }

  .dropdown::part(popup) {
    z-index: var(--sl-z-index-dropdown);
  }

  .dropdown[data-current-placement^='top']::part(popup) {
    transform-origin: bottom;
  }

  .dropdown[data-current-placement^='bottom']::part(popup) {
    transform-origin: top;
  }

  .dropdown[data-current-placement^='left']::part(popup) {
    transform-origin: right;
  }

  .dropdown[data-current-placement^='right']::part(popup) {
    transform-origin: left;
  }

  .dropdown__trigger {
    display: block;
  }

  .dropdown__panel {
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-medium);
    font-weight: var(--sl-font-weight-normal);
    box-shadow: var(--sl-shadow-large);
    border-radius: var(--sl-border-radius-medium);
    pointer-events: none;
  }

  .dropdown--open .dropdown__panel {
    display: block;
    pointer-events: all;
  }

  /* When users slot a menu, make sure it conforms to the popup's auto-size */
  ::slotted(sl-menu) {
    max-width: var(--auto-size-available-width) !important;
    max-height: var(--auto-size-available-height) !important;
  }
`, x = class extends p {
	constructor() {
		super(...arguments), this.localize = new le(this), this.open = !1, this.placement = "bottom-start", this.disabled = !1, this.stayOpenOnSelect = !1, this.distance = 0, this.skidding = 0, this.hoist = !1, this.sync = void 0, this.handleKeyDown = (e) => {
			this.open && e.key === "Escape" && (e.stopPropagation(), this.hide(), this.focusOnTrigger());
		}, this.handleDocumentKeyDown = (e) => {
			if (e.key === "Escape" && this.open && !this.closeWatcher) {
				e.stopPropagation(), this.focusOnTrigger(), this.hide();
				return;
			}
			if (e.key === "Tab") {
				if (this.open && document.activeElement?.tagName.toLowerCase() === "sl-menu-item") {
					e.preventDefault(), this.hide(), this.focusOnTrigger();
					return;
				}
				let t = (e, n) => {
					if (!e) return null;
					let r = e.closest(n);
					if (r) return r;
					let i = e.getRootNode();
					return i instanceof ShadowRoot ? t(i.host, n) : null;
				};
				setTimeout(() => {
					let e = this.containingElement?.getRootNode() instanceof ShadowRoot ? me() : document.activeElement;
					(!this.containingElement || t(e, this.containingElement.tagName.toLowerCase()) !== this.containingElement) && this.hide();
				});
			}
		}, this.handleDocumentMouseDown = (e) => {
			let t = e.composedPath();
			this.containingElement && !t.includes(this.containingElement) && this.hide();
		}, this.handlePanelSelect = (e) => {
			let t = e.target;
			!this.stayOpenOnSelect && t.tagName.toLowerCase() === "sl-menu" && (this.hide(), this.focusOnTrigger());
		};
	}
	connectedCallback() {
		super.connectedCallback(), this.containingElement ||= this;
	}
	firstUpdated() {
		this.panel.hidden = !this.open, this.open && (this.addOpenListeners(), this.popup.active = !0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.removeOpenListeners(), this.hide();
	}
	focusOnTrigger() {
		let e = this.trigger.assignedElements({ flatten: !0 })[0];
		typeof e?.focus == "function" && e.focus();
	}
	getMenu() {
		return this.panel.assignedElements({ flatten: !0 }).find((e) => e.tagName.toLowerCase() === "sl-menu");
	}
	handleTriggerClick() {
		this.open ? this.hide() : (this.show(), this.focusOnTrigger());
	}
	async handleTriggerKeyDown(e) {
		if ([" ", "Enter"].includes(e.key)) {
			e.preventDefault(), this.handleTriggerClick();
			return;
		}
		let t = this.getMenu();
		if (t) {
			let n = t.getAllItems(), r = n[0], i = n[n.length - 1];
			[
				"ArrowDown",
				"ArrowUp",
				"Home",
				"End"
			].includes(e.key) && (e.preventDefault(), this.open || (this.show(), await this.updateComplete), n.length > 0 && this.updateComplete.then(() => {
				(e.key === "ArrowDown" || e.key === "Home") && (t.setCurrentItem(r), r.focus()), (e.key === "ArrowUp" || e.key === "End") && (t.setCurrentItem(i), i.focus());
			}));
		}
	}
	handleTriggerKeyUp(e) {
		e.key === " " && e.preventDefault();
	}
	handleTriggerSlotChange() {
		this.updateAccessibleTrigger();
	}
	updateAccessibleTrigger() {
		let e = this.trigger.assignedElements({ flatten: !0 }).find((e) => pe(e).start), t;
		if (e) {
			switch (e.tagName.toLowerCase()) {
				case "sl-button":
				case "sl-icon-button":
					t = e.button;
					break;
				default: t = e;
			}
			t.setAttribute("aria-haspopup", "true"), t.setAttribute("aria-expanded", this.open ? "true" : "false");
		}
	}
	async show() {
		if (!this.open) return this.open = !0, ee(this, "sl-after-show");
	}
	async hide() {
		if (this.open) return this.open = !1, ee(this, "sl-after-hide");
	}
	reposition() {
		this.popup.reposition();
	}
	addOpenListeners() {
		var e;
		this.panel.addEventListener("sl-select", this.handlePanelSelect), "CloseWatcher" in window ? ((e = this.closeWatcher) == null || e.destroy(), this.closeWatcher = new CloseWatcher(), this.closeWatcher.onclose = () => {
			this.hide(), this.focusOnTrigger();
		}) : this.panel.addEventListener("keydown", this.handleKeyDown), document.addEventListener("keydown", this.handleDocumentKeyDown), document.addEventListener("mousedown", this.handleDocumentMouseDown);
	}
	removeOpenListeners() {
		var e;
		this.panel && (this.panel.removeEventListener("sl-select", this.handlePanelSelect), this.panel.removeEventListener("keydown", this.handleKeyDown)), document.removeEventListener("keydown", this.handleDocumentKeyDown), document.removeEventListener("mousedown", this.handleDocumentMouseDown), (e = this.closeWatcher) == null || e.destroy();
	}
	async handleOpenChange() {
		if (this.disabled) {
			this.open = !1;
			return;
		}
		if (this.updateAccessibleTrigger(), this.open) {
			this.emit("sl-show"), this.addOpenListeners(), await te(this), this.panel.hidden = !1, this.popup.active = !0;
			let { keyframes: e, options: t } = ne(this, "dropdown.show", { dir: this.localize.dir() });
			await ie(this.popup.popup, e, t), this.emit("sl-after-show");
		} else {
			this.emit("sl-hide"), this.removeOpenListeners(), await te(this);
			let { keyframes: e, options: t } = ne(this, "dropdown.hide", { dir: this.localize.dir() });
			await ie(this.popup.popup, e, t), this.panel.hidden = !0, this.popup.active = !1, this.emit("sl-after-hide");
		}
	}
	render() {
		return s`
      <sl-popup
        part="base"
        exportparts="popup:base__popup"
        id="dropdown"
        placement=${this.placement}
        distance=${this.distance}
        skidding=${this.skidding}
        strategy=${this.hoist ? "fixed" : "absolute"}
        flip
        shift
        auto-size="vertical"
        auto-size-padding="10"
        sync=${g(this.sync ? this.sync : void 0)}
        class=${_({
			dropdown: !0,
			"dropdown--open": this.open
		})}
      >
        <slot
          name="trigger"
          slot="anchor"
          part="trigger"
          class="dropdown__trigger"
          @click=${this.handleTriggerClick}
          @keydown=${this.handleTriggerKeyDown}
          @keyup=${this.handleTriggerKeyUp}
          @slotchange=${this.handleTriggerSlotChange}
        ></slot>

        <div aria-hidden=${this.open ? "false" : "true"} aria-labelledby="dropdown">
          <slot part="panel" class="dropdown__panel"></slot>
        </div>
      </sl-popup>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.UDWRA64J.js
x.styles = [f, De], x.dependencies = { "sl-popup": Se }, h([a(".dropdown")], x.prototype, "popup", 2), h([a(".dropdown__trigger")], x.prototype, "trigger", 2), h([a(".dropdown__panel")], x.prototype, "panel", 2), h([e({
	type: Boolean,
	reflect: !0
})], x.prototype, "open", 2), h([e({ reflect: !0 })], x.prototype, "placement", 2), h([e({
	type: Boolean,
	reflect: !0
})], x.prototype, "disabled", 2), h([e({
	attribute: "stay-open-on-select",
	type: Boolean,
	reflect: !0
})], x.prototype, "stayOpenOnSelect", 2), h([e({ attribute: !1 })], x.prototype, "containingElement", 2), h([e({ type: Number })], x.prototype, "distance", 2), h([e({ type: Number })], x.prototype, "skidding", 2), h([e({ type: Boolean })], x.prototype, "hoist", 2), h([e({ reflect: !0 })], x.prototype, "sync", 2), h([m("open", { waitUntilFirstUpdate: !0 })], x.prototype, "handleOpenChange", 1), re("dropdown.show", {
	keyframes: [{
		opacity: 0,
		scale: .9
	}, {
		opacity: 1,
		scale: 1
	}],
	options: {
		duration: 100,
		easing: "ease"
	}
}), re("dropdown.hide", {
	keyframes: [{
		opacity: 1,
		scale: 1
	}, {
		opacity: 0,
		scale: .9
	}],
	options: {
		duration: 100,
		easing: "ease"
	}
}), x.define("sl-dropdown");
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.YKKSQ2FG.js
var Oe = n`
  :host(:not(:focus-within)) {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    clip: rect(0 0 0 0) !important;
    clip-path: inset(50%) !important;
    border: none !important;
    overflow: hidden !important;
    white-space: nowrap !important;
    padding: 0 !important;
  }
`, ke = class extends p {
	render() {
		return s` <slot></slot> `;
	}
};
ke.styles = [f, Oe];
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.ESELY2US.js
function Ae(e, t) {
	function n(n) {
		let r = e.getBoundingClientRect(), i = e.ownerDocument.defaultView, a = r.left + i.scrollX, o = r.top + i.scrollY, s = n.pageX - a, c = n.pageY - o;
		t?.onMove && t.onMove(s, c);
	}
	function r() {
		document.removeEventListener("pointermove", n), document.removeEventListener("pointerup", r), t?.onStop && t.onStop();
	}
	document.addEventListener("pointermove", n, { passive: !0 }), document.addEventListener("pointerup", r), t?.initialEvent instanceof PointerEvent && n(t.initialEvent);
}
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.O6CEROC7.js
var je = n`
  :host {
    --grid-width: 280px;
    --grid-height: 200px;
    --grid-handle-size: 16px;
    --slider-height: 15px;
    --slider-handle-size: 17px;
    --swatch-size: 25px;

    display: inline-block;
  }

  .color-picker {
    width: var(--grid-width);
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-medium);
    font-weight: var(--sl-font-weight-normal);
    color: var(--color);
    background-color: var(--sl-panel-background-color);
    border-radius: var(--sl-border-radius-medium);
    user-select: none;
    -webkit-user-select: none;
  }

  .color-picker--inline {
    border: solid var(--sl-panel-border-width) var(--sl-panel-border-color);
  }

  .color-picker--inline:focus-visible {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  .color-picker__grid {
    position: relative;
    height: var(--grid-height);
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%),
      linear-gradient(to right, #fff 0%, rgba(255, 255, 255, 0) 100%);
    border-top-left-radius: var(--sl-border-radius-medium);
    border-top-right-radius: var(--sl-border-radius-medium);
    cursor: crosshair;
    forced-color-adjust: none;
  }

  .color-picker__grid-handle {
    position: absolute;
    width: var(--grid-handle-size);
    height: var(--grid-handle-size);
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
    border: solid 2px white;
    margin-top: calc(var(--grid-handle-size) / -2);
    margin-left: calc(var(--grid-handle-size) / -2);
    transition: var(--sl-transition-fast) scale;
  }

  .color-picker__grid-handle--dragging {
    cursor: none;
    scale: 1.5;
  }

  .color-picker__grid-handle:focus-visible {
    outline: var(--sl-focus-ring);
  }

  .color-picker__controls {
    padding: var(--sl-spacing-small);
    display: flex;
    align-items: center;
  }

  .color-picker__sliders {
    flex: 1 1 auto;
  }

  .color-picker__slider {
    position: relative;
    height: var(--slider-height);
    border-radius: var(--sl-border-radius-pill);
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
    forced-color-adjust: none;
  }

  .color-picker__slider:not(:last-of-type) {
    margin-bottom: var(--sl-spacing-small);
  }

  .color-picker__slider-handle {
    position: absolute;
    top: calc(50% - var(--slider-handle-size) / 2);
    width: var(--slider-handle-size);
    height: var(--slider-handle-size);
    background-color: white;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
    margin-left: calc(var(--slider-handle-size) / -2);
  }

  .color-picker__slider-handle:focus-visible {
    outline: var(--sl-focus-ring);
  }

  .color-picker__hue {
    background-image: linear-gradient(
      to right,
      rgb(255, 0, 0) 0%,
      rgb(255, 255, 0) 17%,
      rgb(0, 255, 0) 33%,
      rgb(0, 255, 255) 50%,
      rgb(0, 0, 255) 67%,
      rgb(255, 0, 255) 83%,
      rgb(255, 0, 0) 100%
    );
  }

  .color-picker__alpha .color-picker__alpha-gradient {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: inherit;
  }

  .color-picker__preview {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 2.25rem;
    height: 2.25rem;
    border: none;
    border-radius: var(--sl-border-radius-circle);
    background: none;
    margin-left: var(--sl-spacing-small);
    cursor: copy;
    forced-color-adjust: none;
  }

  .color-picker__preview:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);

    /* We use a custom property in lieu of currentColor because of https://bugs.webkit.org/show_bug.cgi?id=216780 */
    background-color: var(--preview-color);
  }

  .color-picker__preview:focus-visible {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  .color-picker__preview-color {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: solid 1px rgba(0, 0, 0, 0.125);
  }

  .color-picker__preview-color--copied {
    animation: pulse 0.75s;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 var(--sl-color-primary-500);
    }
    70% {
      box-shadow: 0 0 0 0.5rem transparent;
    }
    100% {
      box-shadow: 0 0 0 0 transparent;
    }
  }

  .color-picker__user-input {
    display: flex;
    padding: 0 var(--sl-spacing-small) var(--sl-spacing-small) var(--sl-spacing-small);
  }

  .color-picker__user-input sl-input {
    min-width: 0; /* fix input width in Safari */
    flex: 1 1 auto;
  }

  .color-picker__user-input sl-button-group {
    margin-left: var(--sl-spacing-small);
  }

  .color-picker__user-input sl-button {
    min-width: 3.25rem;
    max-width: 3.25rem;
    font-size: 1rem;
  }

  .color-picker__swatches {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-gap: 0.5rem;
    justify-items: center;
    border-top: solid 1px var(--sl-color-neutral-200);
    padding: var(--sl-spacing-small);
    forced-color-adjust: none;
  }

  .color-picker__swatch {
    position: relative;
    width: var(--swatch-size);
    height: var(--swatch-size);
    border-radius: var(--sl-border-radius-small);
  }

  .color-picker__swatch .color-picker__swatch-color {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: solid 1px rgba(0, 0, 0, 0.125);
    border-radius: inherit;
    cursor: pointer;
  }

  .color-picker__swatch:focus-visible {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  .color-picker__transparent-bg {
    background-image: linear-gradient(45deg, var(--sl-color-neutral-300) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--sl-color-neutral-300) 75%),
      linear-gradient(45deg, transparent 75%, var(--sl-color-neutral-300) 75%),
      linear-gradient(45deg, var(--sl-color-neutral-300) 25%, transparent 25%);
    background-size: 10px 10px;
    background-position:
      0 0,
      0 0,
      -5px -5px,
      5px 5px;
  }

  .color-picker--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .color-picker--disabled .color-picker__grid,
  .color-picker--disabled .color-picker__grid-handle,
  .color-picker--disabled .color-picker__slider,
  .color-picker--disabled .color-picker__slider-handle,
  .color-picker--disabled .color-picker__preview,
  .color-picker--disabled .color-picker__swatch,
  .color-picker--disabled .color-picker__swatch-color {
    pointer-events: none;
  }

  /*
   * Color dropdown
   */

  .color-dropdown::part(panel) {
    max-height: none;
    background-color: var(--sl-panel-background-color);
    border: solid var(--sl-panel-border-width) var(--sl-panel-border-color);
    border-radius: var(--sl-border-radius-medium);
    overflow: visible;
  }

  .color-dropdown__trigger {
    display: inline-block;
    position: relative;
    background-color: transparent;
    border: none;
    cursor: pointer;
    forced-color-adjust: none;
  }

  .color-dropdown__trigger.color-dropdown__trigger--small {
    width: var(--sl-input-height-small);
    height: var(--sl-input-height-small);
    border-radius: var(--sl-border-radius-circle);
  }

  .color-dropdown__trigger.color-dropdown__trigger--medium {
    width: var(--sl-input-height-medium);
    height: var(--sl-input-height-medium);
    border-radius: var(--sl-border-radius-circle);
  }

  .color-dropdown__trigger.color-dropdown__trigger--large {
    width: var(--sl-input-height-large);
    height: var(--sl-input-height-large);
    border-radius: var(--sl-border-radius-circle);
  }

  .color-dropdown__trigger:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    background-color: currentColor;
    box-shadow:
      inset 0 0 0 2px var(--sl-input-border-color),
      inset 0 0 0 4px var(--sl-color-neutral-0);
  }

  .color-dropdown__trigger--empty:before {
    background-color: transparent;
  }

  .color-dropdown__trigger:focus-visible {
    outline: none;
  }

  .color-dropdown__trigger:focus-visible:not(.color-dropdown__trigger--disabled) {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  .color-dropdown__trigger.color-dropdown__trigger--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`, Me = "important", Ne = " !important", S = se(class extends oe {
	constructor(e) {
		if (super(e), e.type !== ce.ATTRIBUTE || e.name !== "style" || e.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
	}
	render(e) {
		return Object.keys(e).reduce(((t, n) => {
			let r = e[n];
			return r == null ? t : t + `${n = n.includes("-") ? n : n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${r};`;
		}), "");
	}
	update(e, [t]) {
		let { style: n } = e.element;
		if (this.ft === void 0) return this.ft = new Set(Object.keys(t)), this.render(t);
		for (let e of this.ft) t[e] ?? (this.ft.delete(e), e.includes("-") ? n.removeProperty(e) : n[e] = null);
		for (let e in t) {
			let r = t[e];
			if (r != null) {
				this.ft.add(e);
				let t = typeof r == "string" && r.endsWith(Ne);
				e.includes("-") || t ? n.setProperty(e, t ? r.slice(0, -11) : r, t ? Me : "") : n[e] = r;
			}
		}
		return i;
	}
});
//#endregion
//#region node_modules/@ctrl/tinycolor/dist/module/util.js
function C(e, t) {
	Pe(e) && (e = "100%");
	let n = Fe(e);
	return e = t === 360 ? e : Math.min(t, Math.max(0, parseFloat(e))), n && (e = parseInt(String(e * t), 10) / 100), Math.abs(e - t) < 1e-6 ? 1 : (e = t === 360 ? (e < 0 ? e % t + t : e % t) / parseFloat(String(t)) : e % t / parseFloat(String(t)), e);
}
function w(e) {
	return Math.min(1, Math.max(0, e));
}
function Pe(e) {
	return typeof e == "string" && e.indexOf(".") !== -1 && parseFloat(e) === 1;
}
function Fe(e) {
	return typeof e == "string" && e.indexOf("%") !== -1;
}
function Ie(e) {
	return e = parseFloat(e), (isNaN(e) || e < 0 || e > 1) && (e = 1), e;
}
function T(e) {
	return Number(e) <= 1 ? `${Number(e) * 100}%` : e;
}
function E(e) {
	return e.length === 1 ? "0" + e : String(e);
}
//#endregion
//#region node_modules/@ctrl/tinycolor/dist/module/conversion.js
function Le(e, t, n) {
	return {
		r: C(e, 255) * 255,
		g: C(t, 255) * 255,
		b: C(n, 255) * 255
	};
}
function Re(e, t, n) {
	e = C(e, 255), t = C(t, 255), n = C(n, 255);
	let r = Math.max(e, t, n), i = Math.min(e, t, n), a = 0, o = 0, s = (r + i) / 2;
	if (r === i) o = 0, a = 0;
	else {
		let c = r - i;
		switch (o = s > .5 ? c / (2 - r - i) : c / (r + i), r) {
			case e:
				a = (t - n) / c + (t < n ? 6 : 0);
				break;
			case t:
				a = (n - e) / c + 2;
				break;
			case n:
				a = (e - t) / c + 4;
				break;
			default: break;
		}
		a /= 6;
	}
	return {
		h: a,
		s: o,
		l: s
	};
}
function ze(e, t, n) {
	return n < 0 && (n += 1), n > 1 && --n, n < 1 / 6 ? e + (t - e) * (6 * n) : n < 1 / 2 ? t : n < 2 / 3 ? e + (t - e) * (2 / 3 - n) * 6 : e;
}
function Be(e, t, n) {
	let r, i, a;
	if (e = C(e, 360), t = C(t, 100), n = C(n, 100), t === 0) i = n, a = n, r = n;
	else {
		let o = n < .5 ? n * (1 + t) : n + t - n * t, s = 2 * n - o;
		r = ze(s, o, e + 1 / 3), i = ze(s, o, e), a = ze(s, o, e - 1 / 3);
	}
	return {
		r: r * 255,
		g: i * 255,
		b: a * 255
	};
}
function Ve(e, t, n) {
	e = C(e, 255), t = C(t, 255), n = C(n, 255);
	let r = Math.max(e, t, n), i = Math.min(e, t, n), a = 0, o = r, s = r - i, c = r === 0 ? 0 : s / r;
	if (r === i) a = 0;
	else {
		switch (r) {
			case e:
				a = (t - n) / s + (t < n ? 6 : 0);
				break;
			case t:
				a = (n - e) / s + 2;
				break;
			case n:
				a = (e - t) / s + 4;
				break;
			default: break;
		}
		a /= 6;
	}
	return {
		h: a,
		s: c,
		v: o
	};
}
function He(e, t, n) {
	e = C(e, 360) * 6, t = C(t, 100), n = C(n, 100);
	let r = Math.floor(e), i = e - r, a = n * (1 - t), o = n * (1 - i * t), s = n * (1 - (1 - i) * t), c = r % 6, l = [
		n,
		o,
		a,
		a,
		s,
		n
	][c], u = [
		s,
		n,
		n,
		o,
		a,
		a
	][c], d = [
		a,
		a,
		s,
		n,
		n,
		o
	][c];
	return {
		r: l * 255,
		g: u * 255,
		b: d * 255
	};
}
function Ue(e, t, n, r) {
	let i = [
		E(Math.round(e).toString(16)),
		E(Math.round(t).toString(16)),
		E(Math.round(n).toString(16))
	];
	return r && i[0].startsWith(i[0].charAt(1)) && i[1].startsWith(i[1].charAt(1)) && i[2].startsWith(i[2].charAt(1)) ? i[0].charAt(0) + i[1].charAt(0) + i[2].charAt(0) : i.join("");
}
function We(e, t, n, r, i) {
	let a = [
		E(Math.round(e).toString(16)),
		E(Math.round(t).toString(16)),
		E(Math.round(n).toString(16)),
		E(qe(r))
	];
	return i && a[0].startsWith(a[0].charAt(1)) && a[1].startsWith(a[1].charAt(1)) && a[2].startsWith(a[2].charAt(1)) && a[3].startsWith(a[3].charAt(1)) ? a[0].charAt(0) + a[1].charAt(0) + a[2].charAt(0) + a[3].charAt(0) : a.join("");
}
function Ge(e, t, n, r) {
	let i = e / 100, a = t / 100, o = n / 100, s = r / 100;
	return {
		r: 255 * (1 - i) * (1 - s),
		g: 255 * (1 - a) * (1 - s),
		b: 255 * (1 - o) * (1 - s)
	};
}
function Ke(e, t, n) {
	let r = 1 - e / 255, i = 1 - t / 255, a = 1 - n / 255, o = Math.min(r, i, a);
	return o === 1 ? (r = 0, i = 0, a = 0) : (r = (r - o) / (1 - o) * 100, i = (i - o) / (1 - o) * 100, a = (a - o) / (1 - o) * 100), o *= 100, {
		c: Math.round(r),
		m: Math.round(i),
		y: Math.round(a),
		k: Math.round(o)
	};
}
function qe(e) {
	return Math.round(parseFloat(e) * 255).toString(16);
}
function Je(e) {
	return D(e) / 255;
}
function D(e) {
	return parseInt(e, 16);
}
function Ye(e) {
	return {
		r: e >> 16,
		g: (e & 65280) >> 8,
		b: e & 255
	};
}
//#endregion
//#region node_modules/@ctrl/tinycolor/dist/module/css-color-names.js
var Xe = {
	aliceblue: "#f0f8ff",
	antiquewhite: "#faebd7",
	aqua: "#00ffff",
	aquamarine: "#7fffd4",
	azure: "#f0ffff",
	beige: "#f5f5dc",
	bisque: "#ffe4c4",
	black: "#000000",
	blanchedalmond: "#ffebcd",
	blue: "#0000ff",
	blueviolet: "#8a2be2",
	brown: "#a52a2a",
	burlywood: "#deb887",
	cadetblue: "#5f9ea0",
	chartreuse: "#7fff00",
	chocolate: "#d2691e",
	coral: "#ff7f50",
	cornflowerblue: "#6495ed",
	cornsilk: "#fff8dc",
	crimson: "#dc143c",
	cyan: "#00ffff",
	darkblue: "#00008b",
	darkcyan: "#008b8b",
	darkgoldenrod: "#b8860b",
	darkgray: "#a9a9a9",
	darkgreen: "#006400",
	darkgrey: "#a9a9a9",
	darkkhaki: "#bdb76b",
	darkmagenta: "#8b008b",
	darkolivegreen: "#556b2f",
	darkorange: "#ff8c00",
	darkorchid: "#9932cc",
	darkred: "#8b0000",
	darksalmon: "#e9967a",
	darkseagreen: "#8fbc8f",
	darkslateblue: "#483d8b",
	darkslategray: "#2f4f4f",
	darkslategrey: "#2f4f4f",
	darkturquoise: "#00ced1",
	darkviolet: "#9400d3",
	deeppink: "#ff1493",
	deepskyblue: "#00bfff",
	dimgray: "#696969",
	dimgrey: "#696969",
	dodgerblue: "#1e90ff",
	firebrick: "#b22222",
	floralwhite: "#fffaf0",
	forestgreen: "#228b22",
	fuchsia: "#ff00ff",
	gainsboro: "#dcdcdc",
	ghostwhite: "#f8f8ff",
	goldenrod: "#daa520",
	gold: "#ffd700",
	gray: "#808080",
	green: "#008000",
	greenyellow: "#adff2f",
	grey: "#808080",
	honeydew: "#f0fff0",
	hotpink: "#ff69b4",
	indianred: "#cd5c5c",
	indigo: "#4b0082",
	ivory: "#fffff0",
	khaki: "#f0e68c",
	lavenderblush: "#fff0f5",
	lavender: "#e6e6fa",
	lawngreen: "#7cfc00",
	lemonchiffon: "#fffacd",
	lightblue: "#add8e6",
	lightcoral: "#f08080",
	lightcyan: "#e0ffff",
	lightgoldenrodyellow: "#fafad2",
	lightgray: "#d3d3d3",
	lightgreen: "#90ee90",
	lightgrey: "#d3d3d3",
	lightpink: "#ffb6c1",
	lightsalmon: "#ffa07a",
	lightseagreen: "#20b2aa",
	lightskyblue: "#87cefa",
	lightslategray: "#778899",
	lightslategrey: "#778899",
	lightsteelblue: "#b0c4de",
	lightyellow: "#ffffe0",
	lime: "#00ff00",
	limegreen: "#32cd32",
	linen: "#faf0e6",
	magenta: "#ff00ff",
	maroon: "#800000",
	mediumaquamarine: "#66cdaa",
	mediumblue: "#0000cd",
	mediumorchid: "#ba55d3",
	mediumpurple: "#9370db",
	mediumseagreen: "#3cb371",
	mediumslateblue: "#7b68ee",
	mediumspringgreen: "#00fa9a",
	mediumturquoise: "#48d1cc",
	mediumvioletred: "#c71585",
	midnightblue: "#191970",
	mintcream: "#f5fffa",
	mistyrose: "#ffe4e1",
	moccasin: "#ffe4b5",
	navajowhite: "#ffdead",
	navy: "#000080",
	oldlace: "#fdf5e6",
	olive: "#808000",
	olivedrab: "#6b8e23",
	orange: "#ffa500",
	orangered: "#ff4500",
	orchid: "#da70d6",
	palegoldenrod: "#eee8aa",
	palegreen: "#98fb98",
	paleturquoise: "#afeeee",
	palevioletred: "#db7093",
	papayawhip: "#ffefd5",
	peachpuff: "#ffdab9",
	peru: "#cd853f",
	pink: "#ffc0cb",
	plum: "#dda0dd",
	powderblue: "#b0e0e6",
	purple: "#800080",
	rebeccapurple: "#663399",
	red: "#ff0000",
	rosybrown: "#bc8f8f",
	royalblue: "#4169e1",
	saddlebrown: "#8b4513",
	salmon: "#fa8072",
	sandybrown: "#f4a460",
	seagreen: "#2e8b57",
	seashell: "#fff5ee",
	sienna: "#a0522d",
	silver: "#c0c0c0",
	skyblue: "#87ceeb",
	slateblue: "#6a5acd",
	slategray: "#708090",
	slategrey: "#708090",
	snow: "#fffafa",
	springgreen: "#00ff7f",
	steelblue: "#4682b4",
	tan: "#d2b48c",
	teal: "#008080",
	thistle: "#d8bfd8",
	tomato: "#ff6347",
	turquoise: "#40e0d0",
	violet: "#ee82ee",
	wheat: "#f5deb3",
	white: "#ffffff",
	whitesmoke: "#f5f5f5",
	yellow: "#ffff00",
	yellowgreen: "#9acd32"
};
//#endregion
//#region node_modules/@ctrl/tinycolor/dist/module/format-input.js
function Ze(e) {
	let t = {
		r: 0,
		g: 0,
		b: 0
	}, n = 1, r = null, i = null, a = null, o = !1, s = !1;
	return typeof e == "string" && (e = Qe(e)), typeof e == "object" && (k(e.r) && k(e.g) && k(e.b) ? (t = Le(e.r, e.g, e.b), o = !0, s = String(e.r).substr(-1) === "%" ? "prgb" : "rgb") : k(e.h) && k(e.s) && k(e.v) ? (r = T(e.s), i = T(e.v), t = He(e.h, r, i), o = !0, s = "hsv") : k(e.h) && k(e.s) && k(e.l) ? (r = T(e.s), a = T(e.l), t = Be(e.h, r, a), o = !0, s = "hsl") : k(e.c) && k(e.m) && k(e.y) && k(e.k) && (t = Ge(e.c, e.m, e.y, e.k), o = !0, s = "cmyk"), Object.prototype.hasOwnProperty.call(e, "a") && (n = e.a)), n = Ie(n), {
		ok: o,
		format: e.format || s,
		r: Math.min(255, Math.max(t.r, 0)),
		g: Math.min(255, Math.max(t.g, 0)),
		b: Math.min(255, Math.max(t.b, 0)),
		a: n
	};
}
var O = {
	CSS_UNIT: /* @__PURE__ */ RegExp("(?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?)"),
	rgb: /* @__PURE__ */ RegExp("rgb[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),
	rgba: /* @__PURE__ */ RegExp("rgba[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),
	hsl: /* @__PURE__ */ RegExp("hsl[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),
	hsla: /* @__PURE__ */ RegExp("hsla[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),
	hsv: /* @__PURE__ */ RegExp("hsv[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),
	hsva: /* @__PURE__ */ RegExp("hsva[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),
	cmyk: /* @__PURE__ */ RegExp("cmyk[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),
	hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
	hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
	hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
	hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
};
function Qe(e) {
	if (e = e.trim().toLowerCase(), e.length === 0) return !1;
	let t = !1;
	if (Xe[e]) e = Xe[e], t = !0;
	else if (e === "transparent") return {
		r: 0,
		g: 0,
		b: 0,
		a: 0,
		format: "name"
	};
	let n = O.rgb.exec(e);
	return n ? {
		r: n[1],
		g: n[2],
		b: n[3]
	} : (n = O.rgba.exec(e), n ? {
		r: n[1],
		g: n[2],
		b: n[3],
		a: n[4]
	} : (n = O.hsl.exec(e), n ? {
		h: n[1],
		s: n[2],
		l: n[3]
	} : (n = O.hsla.exec(e), n ? {
		h: n[1],
		s: n[2],
		l: n[3],
		a: n[4]
	} : (n = O.hsv.exec(e), n ? {
		h: n[1],
		s: n[2],
		v: n[3]
	} : (n = O.hsva.exec(e), n ? {
		h: n[1],
		s: n[2],
		v: n[3],
		a: n[4]
	} : (n = O.cmyk.exec(e), n ? {
		c: n[1],
		m: n[2],
		y: n[3],
		k: n[4]
	} : (n = O.hex8.exec(e), n ? {
		r: D(n[1]),
		g: D(n[2]),
		b: D(n[3]),
		a: Je(n[4]),
		format: t ? "name" : "hex8"
	} : (n = O.hex6.exec(e), n ? {
		r: D(n[1]),
		g: D(n[2]),
		b: D(n[3]),
		format: t ? "name" : "hex"
	} : (n = O.hex4.exec(e), n ? {
		r: D(n[1] + n[1]),
		g: D(n[2] + n[2]),
		b: D(n[3] + n[3]),
		a: Je(n[4] + n[4]),
		format: t ? "name" : "hex8"
	} : (n = O.hex3.exec(e), n ? {
		r: D(n[1] + n[1]),
		g: D(n[2] + n[2]),
		b: D(n[3] + n[3]),
		format: t ? "name" : "hex"
	} : !1))))))))));
}
function k(e) {
	return typeof e == "number" ? !Number.isNaN(e) : O.CSS_UNIT.test(e);
}
//#endregion
//#region node_modules/@ctrl/tinycolor/dist/module/index.js
var $e = class e {
	constructor(t = "", n = {}) {
		if (t instanceof e) return t;
		typeof t == "number" && (t = Ye(t)), this.originalInput = t;
		let r = Ze(t);
		this.originalInput = t, this.r = r.r, this.g = r.g, this.b = r.b, this.a = r.a, this.roundA = Math.round(100 * this.a) / 100, this.format = n.format ?? r.format, this.gradientType = n.gradientType, this.r < 1 && (this.r = Math.round(this.r)), this.g < 1 && (this.g = Math.round(this.g)), this.b < 1 && (this.b = Math.round(this.b)), this.isValid = r.ok;
	}
	isDark() {
		return this.getBrightness() < 128;
	}
	isLight() {
		return !this.isDark();
	}
	getBrightness() {
		let e = this.toRgb();
		return (e.r * 299 + e.g * 587 + e.b * 114) / 1e3;
	}
	getLuminance() {
		let e = this.toRgb(), t, n, r, i = e.r / 255, a = e.g / 255, o = e.b / 255;
		return t = i <= .03928 ? i / 12.92 : ((i + .055) / 1.055) ** 2.4, n = a <= .03928 ? a / 12.92 : ((a + .055) / 1.055) ** 2.4, r = o <= .03928 ? o / 12.92 : ((o + .055) / 1.055) ** 2.4, .2126 * t + .7152 * n + .0722 * r;
	}
	getAlpha() {
		return this.a;
	}
	setAlpha(e) {
		return this.a = Ie(e), this.roundA = Math.round(100 * this.a) / 100, this;
	}
	isMonochrome() {
		let { s: e } = this.toHsl();
		return e === 0;
	}
	toHsv() {
		let e = Ve(this.r, this.g, this.b);
		return {
			h: e.h * 360,
			s: e.s,
			v: e.v,
			a: this.a
		};
	}
	toHsvString() {
		let e = Ve(this.r, this.g, this.b), t = Math.round(e.h * 360), n = Math.round(e.s * 100), r = Math.round(e.v * 100);
		return this.a === 1 ? `hsv(${t}, ${n}%, ${r}%)` : `hsva(${t}, ${n}%, ${r}%, ${this.roundA})`;
	}
	toHsl() {
		let e = Re(this.r, this.g, this.b);
		return {
			h: e.h * 360,
			s: e.s,
			l: e.l,
			a: this.a
		};
	}
	toHslString() {
		let e = Re(this.r, this.g, this.b), t = Math.round(e.h * 360), n = Math.round(e.s * 100), r = Math.round(e.l * 100);
		return this.a === 1 ? `hsl(${t}, ${n}%, ${r}%)` : `hsla(${t}, ${n}%, ${r}%, ${this.roundA})`;
	}
	toHex(e = !1) {
		return Ue(this.r, this.g, this.b, e);
	}
	toHexString(e = !1) {
		return "#" + this.toHex(e);
	}
	toHex8(e = !1) {
		return We(this.r, this.g, this.b, this.a, e);
	}
	toHex8String(e = !1) {
		return "#" + this.toHex8(e);
	}
	toHexShortString(e = !1) {
		return this.a === 1 ? this.toHexString(e) : this.toHex8String(e);
	}
	toRgb() {
		return {
			r: Math.round(this.r),
			g: Math.round(this.g),
			b: Math.round(this.b),
			a: this.a
		};
	}
	toRgbString() {
		let e = Math.round(this.r), t = Math.round(this.g), n = Math.round(this.b);
		return this.a === 1 ? `rgb(${e}, ${t}, ${n})` : `rgba(${e}, ${t}, ${n}, ${this.roundA})`;
	}
	toPercentageRgb() {
		let e = (e) => `${Math.round(C(e, 255) * 100)}%`;
		return {
			r: e(this.r),
			g: e(this.g),
			b: e(this.b),
			a: this.a
		};
	}
	toPercentageRgbString() {
		let e = (e) => Math.round(C(e, 255) * 100);
		return this.a === 1 ? `rgb(${e(this.r)}%, ${e(this.g)}%, ${e(this.b)}%)` : `rgba(${e(this.r)}%, ${e(this.g)}%, ${e(this.b)}%, ${this.roundA})`;
	}
	toCmyk() {
		return { ...Ke(this.r, this.g, this.b) };
	}
	toCmykString() {
		let { c: e, m: t, y: n, k: r } = Ke(this.r, this.g, this.b);
		return `cmyk(${e}, ${t}, ${n}, ${r})`;
	}
	toName() {
		if (this.a === 0) return "transparent";
		if (this.a < 1) return !1;
		let e = "#" + Ue(this.r, this.g, this.b, !1);
		for (let [t, n] of Object.entries(Xe)) if (e === n) return t;
		return !1;
	}
	toString(e) {
		let t = !!e;
		e ??= this.format;
		let n = !1, r = this.a < 1 && this.a >= 0;
		return !t && r && (e.startsWith("hex") || e === "name") ? e === "name" && this.a === 0 ? this.toName() : this.toRgbString() : (e === "rgb" && (n = this.toRgbString()), e === "prgb" && (n = this.toPercentageRgbString()), (e === "hex" || e === "hex6") && (n = this.toHexString()), e === "hex3" && (n = this.toHexString(!0)), e === "hex4" && (n = this.toHex8String(!0)), e === "hex8" && (n = this.toHex8String()), e === "name" && (n = this.toName()), e === "hsl" && (n = this.toHslString()), e === "hsv" && (n = this.toHsvString()), e === "cmyk" && (n = this.toCmykString()), n || this.toHexString());
	}
	toNumber() {
		return (Math.round(this.r) << 16) + (Math.round(this.g) << 8) + Math.round(this.b);
	}
	clone() {
		return new e(this.toString());
	}
	lighten(t = 10) {
		let n = this.toHsl();
		return n.l += t / 100, n.l = w(n.l), new e(n);
	}
	brighten(t = 10) {
		let n = this.toRgb();
		return n.r = Math.max(0, Math.min(255, n.r - Math.round(255 * -(t / 100)))), n.g = Math.max(0, Math.min(255, n.g - Math.round(255 * -(t / 100)))), n.b = Math.max(0, Math.min(255, n.b - Math.round(255 * -(t / 100)))), new e(n);
	}
	darken(t = 10) {
		let n = this.toHsl();
		return n.l -= t / 100, n.l = w(n.l), new e(n);
	}
	tint(e = 10) {
		return this.mix("white", e);
	}
	shade(e = 10) {
		return this.mix("black", e);
	}
	desaturate(t = 10) {
		let n = this.toHsl();
		return n.s -= t / 100, n.s = w(n.s), new e(n);
	}
	saturate(t = 10) {
		let n = this.toHsl();
		return n.s += t / 100, n.s = w(n.s), new e(n);
	}
	greyscale() {
		return this.desaturate(100);
	}
	spin(t) {
		let n = this.toHsl(), r = (n.h + t) % 360;
		return n.h = r < 0 ? 360 + r : r, new e(n);
	}
	mix(t, n = 50) {
		let r = this.toRgb(), i = new e(t).toRgb(), a = n / 100;
		return new e({
			r: (i.r - r.r) * a + r.r,
			g: (i.g - r.g) * a + r.g,
			b: (i.b - r.b) * a + r.b,
			a: (i.a - r.a) * a + r.a
		});
	}
	analogous(t = 6, n = 30) {
		let r = this.toHsl(), i = 360 / n, a = [this];
		for (r.h = (r.h - (i * t >> 1) + 720) % 360; --t;) r.h = (r.h + i) % 360, a.push(new e(r));
		return a;
	}
	complement() {
		let t = this.toHsl();
		return t.h = (t.h + 180) % 360, new e(t);
	}
	monochromatic(t = 6) {
		let n = this.toHsv(), { h: r } = n, { s: i } = n, { v: a } = n, o = [], s = 1 / t;
		for (; t--;) o.push(new e({
			h: r,
			s: i,
			v: a
		})), a = (a + s) % 1;
		return o;
	}
	splitcomplement() {
		let t = this.toHsl(), { h: n } = t;
		return [
			this,
			new e({
				h: (n + 72) % 360,
				s: t.s,
				l: t.l
			}),
			new e({
				h: (n + 216) % 360,
				s: t.s,
				l: t.l
			})
		];
	}
	onBackground(t) {
		let n = this.toRgb(), r = new e(t).toRgb(), i = n.a + r.a * (1 - n.a);
		return new e({
			r: (n.r * n.a + r.r * r.a * (1 - n.a)) / i,
			g: (n.g * n.a + r.g * r.a * (1 - n.a)) / i,
			b: (n.b * n.a + r.b * r.a * (1 - n.a)) / i,
			a: i
		});
	}
	triad() {
		return this.polyad(3);
	}
	tetrad() {
		return this.polyad(4);
	}
	polyad(t) {
		let n = this.toHsl(), { h: r } = n, i = [this], a = 360 / t;
		for (let o = 1; o < t; o++) i.push(new e({
			h: (r + o * a) % 360,
			s: n.s,
			l: n.l
		}));
		return i;
	}
	equals(t) {
		let n = new e(t);
		return this.format === "cmyk" || n.format === "cmyk" ? this.toCmykString() === n.toCmykString() : this.toRgbString() === n.toRgbString();
	}
}, et = "EyeDropper" in window, A = class extends p {
	constructor() {
		super(), this.formControlController = new ue(this), this.isSafeValue = !1, this.localize = new le(this), this.hasFocus = !1, this.isDraggingGridHandle = !1, this.isEmpty = !1, this.inputValue = "", this.hue = 0, this.saturation = 100, this.brightness = 100, this.alpha = 100, this.value = "", this.defaultValue = "", this.label = "", this.format = "hex", this.inline = !1, this.size = "medium", this.noFormatToggle = !1, this.name = "", this.disabled = !1, this.hoist = !1, this.opacity = !1, this.uppercase = !1, this.swatches = "", this.form = "", this.required = !1, this.handleFocusIn = () => {
			this.hasFocus = !0, this.emit("sl-focus");
		}, this.handleFocusOut = () => {
			this.hasFocus = !1, this.emit("sl-blur");
		}, this.addEventListener("focusin", this.handleFocusIn), this.addEventListener("focusout", this.handleFocusOut);
	}
	get validity() {
		return this.input.validity;
	}
	get validationMessage() {
		return this.input.validationMessage;
	}
	firstUpdated() {
		this.input.updateComplete.then(() => {
			this.formControlController.updateValidity();
		});
	}
	handleCopy() {
		this.input.select(), document.execCommand("copy"), this.previewButton.focus(), this.previewButton.classList.add("color-picker__preview-color--copied"), this.previewButton.addEventListener("animationend", () => {
			this.previewButton.classList.remove("color-picker__preview-color--copied");
		});
	}
	handleFormatToggle() {
		let e = [
			"hex",
			"rgb",
			"hsl",
			"hsv"
		], t = (e.indexOf(this.format) + 1) % e.length;
		this.format = e[t], this.setColor(this.value), this.emit("sl-change"), this.emit("sl-input");
	}
	handleAlphaDrag(e) {
		let t = this.shadowRoot.querySelector(".color-picker__slider.color-picker__alpha"), n = t.querySelector(".color-picker__slider-handle"), { width: r } = t.getBoundingClientRect(), i = this.value, a = this.value;
		n.focus(), e.preventDefault(), Ae(t, {
			onMove: (e) => {
				this.alpha = v(e / r * 100, 0, 100), this.syncValues(), this.value !== a && (a = this.value, this.emit("sl-input"));
			},
			onStop: () => {
				this.value !== i && (i = this.value, this.emit("sl-change"));
			},
			initialEvent: e
		});
	}
	handleHueDrag(e) {
		let t = this.shadowRoot.querySelector(".color-picker__slider.color-picker__hue"), n = t.querySelector(".color-picker__slider-handle"), { width: r } = t.getBoundingClientRect(), i = this.value, a = this.value;
		n.focus(), e.preventDefault(), Ae(t, {
			onMove: (e) => {
				this.hue = v(e / r * 360, 0, 360), this.syncValues(), this.value !== a && (a = this.value, this.emit("sl-input"));
			},
			onStop: () => {
				this.value !== i && (i = this.value, this.emit("sl-change"));
			},
			initialEvent: e
		});
	}
	handleGridDrag(e) {
		let t = this.shadowRoot.querySelector(".color-picker__grid"), n = t.querySelector(".color-picker__grid-handle"), { width: r, height: i } = t.getBoundingClientRect(), a = this.value, o = this.value;
		n.focus(), e.preventDefault(), this.isDraggingGridHandle = !0, Ae(t, {
			onMove: (e, t) => {
				this.saturation = v(e / r * 100, 0, 100), this.brightness = v(100 - t / i * 100, 0, 100), this.syncValues(), this.value !== o && (o = this.value, this.emit("sl-input"));
			},
			onStop: () => {
				this.isDraggingGridHandle = !1, this.value !== a && (a = this.value, this.emit("sl-change"));
			},
			initialEvent: e
		});
	}
	handleAlphaKeyDown(e) {
		let t = e.shiftKey ? 10 : 1, n = this.value;
		e.key === "ArrowLeft" && (e.preventDefault(), this.alpha = v(this.alpha - t, 0, 100), this.syncValues()), e.key === "ArrowRight" && (e.preventDefault(), this.alpha = v(this.alpha + t, 0, 100), this.syncValues()), e.key === "Home" && (e.preventDefault(), this.alpha = 0, this.syncValues()), e.key === "End" && (e.preventDefault(), this.alpha = 100, this.syncValues()), this.value !== n && (this.emit("sl-change"), this.emit("sl-input"));
	}
	handleHueKeyDown(e) {
		let t = e.shiftKey ? 10 : 1, n = this.value;
		e.key === "ArrowLeft" && (e.preventDefault(), this.hue = v(this.hue - t, 0, 360), this.syncValues()), e.key === "ArrowRight" && (e.preventDefault(), this.hue = v(this.hue + t, 0, 360), this.syncValues()), e.key === "Home" && (e.preventDefault(), this.hue = 0, this.syncValues()), e.key === "End" && (e.preventDefault(), this.hue = 360, this.syncValues()), this.value !== n && (this.emit("sl-change"), this.emit("sl-input"));
	}
	handleGridKeyDown(e) {
		let t = e.shiftKey ? 10 : 1, n = this.value;
		e.key === "ArrowLeft" && (e.preventDefault(), this.saturation = v(this.saturation - t, 0, 100), this.syncValues()), e.key === "ArrowRight" && (e.preventDefault(), this.saturation = v(this.saturation + t, 0, 100), this.syncValues()), e.key === "ArrowUp" && (e.preventDefault(), this.brightness = v(this.brightness + t, 0, 100), this.syncValues()), e.key === "ArrowDown" && (e.preventDefault(), this.brightness = v(this.brightness - t, 0, 100), this.syncValues()), this.value !== n && (this.emit("sl-change"), this.emit("sl-input"));
	}
	handleInputChange(e) {
		let t = e.target, n = this.value;
		e.stopPropagation(), this.input.value ? (this.setColor(t.value), t.value = this.value) : this.value = "", this.value !== n && (this.emit("sl-change"), this.emit("sl-input"));
	}
	handleInputInput(e) {
		this.formControlController.updateValidity(), e.stopPropagation();
	}
	handleInputKeyDown(e) {
		if (e.key === "Enter") {
			let e = this.value;
			this.input.value ? (this.setColor(this.input.value), this.input.value = this.value, this.value !== e && (this.emit("sl-change"), this.emit("sl-input")), setTimeout(() => this.input.select())) : this.hue = 0;
		}
	}
	handleInputInvalid(e) {
		this.formControlController.setValidity(!1), this.formControlController.emitInvalidEvent(e);
	}
	handleTouchMove(e) {
		e.preventDefault();
	}
	parseColor(e) {
		let t = new $e(e);
		if (!t.isValid) return null;
		let n = t.toHsl(), r = {
			h: n.h,
			s: n.s * 100,
			l: n.l * 100,
			a: n.a
		}, i = t.toRgb(), a = t.toHexString(), o = t.toHex8String(), s = t.toHsv(), c = {
			h: s.h,
			s: s.s * 100,
			v: s.v * 100,
			a: s.a
		};
		return {
			hsl: {
				h: r.h,
				s: r.s,
				l: r.l,
				string: this.setLetterCase(`hsl(${Math.round(r.h)}, ${Math.round(r.s)}%, ${Math.round(r.l)}%)`)
			},
			hsla: {
				h: r.h,
				s: r.s,
				l: r.l,
				a: r.a,
				string: this.setLetterCase(`hsla(${Math.round(r.h)}, ${Math.round(r.s)}%, ${Math.round(r.l)}%, ${r.a.toFixed(2).toString()})`)
			},
			hsv: {
				h: c.h,
				s: c.s,
				v: c.v,
				string: this.setLetterCase(`hsv(${Math.round(c.h)}, ${Math.round(c.s)}%, ${Math.round(c.v)}%)`)
			},
			hsva: {
				h: c.h,
				s: c.s,
				v: c.v,
				a: c.a,
				string: this.setLetterCase(`hsva(${Math.round(c.h)}, ${Math.round(c.s)}%, ${Math.round(c.v)}%, ${c.a.toFixed(2).toString()})`)
			},
			rgb: {
				r: i.r,
				g: i.g,
				b: i.b,
				string: this.setLetterCase(`rgb(${Math.round(i.r)}, ${Math.round(i.g)}, ${Math.round(i.b)})`)
			},
			rgba: {
				r: i.r,
				g: i.g,
				b: i.b,
				a: i.a,
				string: this.setLetterCase(`rgba(${Math.round(i.r)}, ${Math.round(i.g)}, ${Math.round(i.b)}, ${i.a.toFixed(2).toString()})`)
			},
			hex: this.setLetterCase(a),
			hexa: this.setLetterCase(o)
		};
	}
	setColor(e) {
		let t = this.parseColor(e);
		return t === null ? !1 : (this.hue = t.hsva.h, this.saturation = t.hsva.s, this.brightness = t.hsva.v, this.alpha = this.opacity ? t.hsva.a * 100 : 100, this.syncValues(), !0);
	}
	setLetterCase(e) {
		return typeof e == "string" ? this.uppercase ? e.toUpperCase() : e.toLowerCase() : "";
	}
	async syncValues() {
		let e = this.parseColor(`hsva(${this.hue}, ${this.saturation}%, ${this.brightness}%, ${this.alpha / 100})`);
		e !== null && (this.format === "hsl" ? this.inputValue = this.opacity ? e.hsla.string : e.hsl.string : this.format === "rgb" ? this.inputValue = this.opacity ? e.rgba.string : e.rgb.string : this.format === "hsv" ? this.inputValue = this.opacity ? e.hsva.string : e.hsv.string : this.inputValue = this.opacity ? e.hexa : e.hex, this.isSafeValue = !0, this.value = this.inputValue, await this.updateComplete, this.isSafeValue = !1);
	}
	handleAfterHide() {
		this.previewButton.classList.remove("color-picker__preview-color--copied");
	}
	handleEyeDropper() {
		et && new EyeDropper().open().then((e) => {
			let t = this.value;
			this.setColor(e.sRGBHex), this.value !== t && (this.emit("sl-change"), this.emit("sl-input"));
		}).catch(() => {});
	}
	selectSwatch(e) {
		let t = this.value;
		this.disabled || (this.setColor(e), this.value !== t && (this.emit("sl-change"), this.emit("sl-input")));
	}
	getHexString(e, t, n, r = 100) {
		let i = new $e(`hsva(${e}, ${t}%, ${n}%, ${r / 100})`);
		return i.isValid ? i.toHex8String() : "";
	}
	stopNestedEventPropagation(e) {
		e.stopImmediatePropagation();
	}
	handleFormatChange() {
		this.syncValues();
	}
	handleOpacityChange() {
		this.alpha = 100;
	}
	handleValueChange(e, t) {
		if (this.isEmpty = !t, t || (this.hue = 0, this.saturation = 0, this.brightness = 100, this.alpha = 100), !this.isSafeValue) {
			let n = this.parseColor(t);
			n === null ? this.inputValue = e ?? "" : (this.inputValue = this.value, this.hue = n.hsva.h, this.saturation = n.hsva.s, this.brightness = n.hsva.v, this.alpha = n.hsva.a * 100, this.syncValues());
		}
	}
	focus(e) {
		this.inline ? this.base.focus(e) : this.trigger.focus(e);
	}
	blur() {
		let e = this.inline ? this.base : this.trigger;
		this.hasFocus && (e.focus({ preventScroll: !0 }), e.blur()), this.dropdown?.open && this.dropdown.hide();
	}
	getFormattedValue(e = "hex") {
		let t = this.parseColor(`hsva(${this.hue}, ${this.saturation}%, ${this.brightness}%, ${this.alpha / 100})`);
		if (t === null) return "";
		switch (e) {
			case "hex": return t.hex;
			case "hexa": return t.hexa;
			case "rgb": return t.rgb.string;
			case "rgba": return t.rgba.string;
			case "hsl": return t.hsl.string;
			case "hsla": return t.hsla.string;
			case "hsv": return t.hsv.string;
			case "hsva": return t.hsva.string;
			default: return "";
		}
	}
	checkValidity() {
		return this.input.checkValidity();
	}
	getForm() {
		return this.formControlController.getForm();
	}
	reportValidity() {
		return !this.inline && !this.validity.valid ? (this.dropdown.show(), this.addEventListener("sl-after-show", () => this.input.reportValidity(), { once: !0 }), this.disabled || this.formControlController.emitInvalidEvent(), !1) : this.input.reportValidity();
	}
	setCustomValidity(e) {
		this.input.setCustomValidity(e), this.formControlController.updateValidity();
	}
	render() {
		let e = this.saturation, t = 100 - this.brightness, n = Array.isArray(this.swatches) ? this.swatches : this.swatches.split(";").filter((e) => e.trim() !== ""), r = s`
      <div
        part="base"
        class=${_({
			"color-picker": !0,
			"color-picker--inline": this.inline,
			"color-picker--disabled": this.disabled,
			"color-picker--focused": this.hasFocus
		})}
        aria-disabled=${this.disabled ? "true" : "false"}
        aria-labelledby="label"
        tabindex=${this.inline ? "0" : "-1"}
      >
        ${this.inline ? s`
              <sl-visually-hidden id="label">
                <slot name="label">${this.label}</slot>
              </sl-visually-hidden>
            ` : null}

        <div
          part="grid"
          class="color-picker__grid"
          style=${S({ backgroundColor: this.getHexString(this.hue, 100, 100) })}
          @pointerdown=${this.handleGridDrag}
          @touchmove=${this.handleTouchMove}
        >
          <span
            part="grid-handle"
            class=${_({
			"color-picker__grid-handle": !0,
			"color-picker__grid-handle--dragging": this.isDraggingGridHandle
		})}
            style=${S({
			top: `${t}%`,
			left: `${e}%`,
			backgroundColor: this.getHexString(this.hue, this.saturation, this.brightness, this.alpha)
		})}
            role="application"
            aria-label="HSV"
            tabindex=${g(this.disabled ? void 0 : "0")}
            @keydown=${this.handleGridKeyDown}
          ></span>
        </div>

        <div class="color-picker__controls">
          <div class="color-picker__sliders">
            <div
              part="slider hue-slider"
              class="color-picker__hue color-picker__slider"
              @pointerdown=${this.handleHueDrag}
              @touchmove=${this.handleTouchMove}
            >
              <span
                part="slider-handle hue-slider-handle"
                class="color-picker__slider-handle"
                style=${S({ left: `${this.hue === 0 ? 0 : 100 / (360 / this.hue)}%` })}
                role="slider"
                aria-label="hue"
                aria-orientation="horizontal"
                aria-valuemin="0"
                aria-valuemax="360"
                aria-valuenow=${`${Math.round(this.hue)}`}
                tabindex=${g(this.disabled ? void 0 : "0")}
                @keydown=${this.handleHueKeyDown}
              ></span>
            </div>

            ${this.opacity ? s`
                  <div
                    part="slider opacity-slider"
                    class="color-picker__alpha color-picker__slider color-picker__transparent-bg"
                    @pointerdown="${this.handleAlphaDrag}"
                    @touchmove=${this.handleTouchMove}
                  >
                    <div
                      class="color-picker__alpha-gradient"
                      style=${S({ backgroundImage: `linear-gradient(
                          to right,
                          ${this.getHexString(this.hue, this.saturation, this.brightness, 0)} 0%,
                          ${this.getHexString(this.hue, this.saturation, this.brightness, 100)} 100%
                        )` })}
                    ></div>
                    <span
                      part="slider-handle opacity-slider-handle"
                      class="color-picker__slider-handle"
                      style=${S({ left: `${this.alpha}%` })}
                      role="slider"
                      aria-label="alpha"
                      aria-orientation="horizontal"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow=${Math.round(this.alpha)}
                      tabindex=${g(this.disabled ? void 0 : "0")}
                      @keydown=${this.handleAlphaKeyDown}
                    ></span>
                  </div>
                ` : ""}
          </div>

          <button
            type="button"
            part="preview"
            class="color-picker__preview color-picker__transparent-bg"
            aria-label=${this.localize.term("copy")}
            style=${S({ "--preview-color": this.getHexString(this.hue, this.saturation, this.brightness, this.alpha) })}
            @click=${this.handleCopy}
          ></button>
        </div>

        <div class="color-picker__user-input" aria-live="polite">
          <sl-input
            part="input"
            type="text"
            name=${this.name}
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            value=${this.isEmpty ? "" : this.inputValue}
            ?required=${this.required}
            ?disabled=${this.disabled}
            aria-label=${this.localize.term("currentValue")}
            @keydown=${this.handleInputKeyDown}
            @sl-change=${this.handleInputChange}
            @sl-input=${this.handleInputInput}
            @sl-invalid=${this.handleInputInvalid}
            @sl-blur=${this.stopNestedEventPropagation}
            @sl-focus=${this.stopNestedEventPropagation}
          ></sl-input>

          <sl-button-group>
            ${this.noFormatToggle ? "" : s`
                  <sl-button
                    part="format-button"
                    aria-label=${this.localize.term("toggleColorFormat")}
                    exportparts="
                      base:format-button__base,
                      prefix:format-button__prefix,
                      label:format-button__label,
                      suffix:format-button__suffix,
                      caret:format-button__caret
                    "
                    @click=${this.handleFormatToggle}
                    @sl-blur=${this.stopNestedEventPropagation}
                    @sl-focus=${this.stopNestedEventPropagation}
                  >
                    ${this.setLetterCase(this.format)}
                  </sl-button>
                `}
            ${et ? s`
                  <sl-button
                    part="eye-dropper-button"
                    exportparts="
                      base:eye-dropper-button__base,
                      prefix:eye-dropper-button__prefix,
                      label:eye-dropper-button__label,
                      suffix:eye-dropper-button__suffix,
                      caret:eye-dropper-button__caret
                    "
                    @click=${this.handleEyeDropper}
                    @sl-blur=${this.stopNestedEventPropagation}
                    @sl-focus=${this.stopNestedEventPropagation}
                  >
                    <sl-icon
                      library="system"
                      name="eyedropper"
                      label=${this.localize.term("selectAColorFromTheScreen")}
                    ></sl-icon>
                  </sl-button>
                ` : ""}
          </sl-button-group>
        </div>

        ${n.length > 0 ? s`
              <div part="swatches" class="color-picker__swatches">
                ${n.map((e) => {
			let t = this.parseColor(e);
			return t ? s`
                    <div
                      part="swatch"
                      class="color-picker__swatch color-picker__transparent-bg"
                      tabindex=${g(this.disabled ? void 0 : "0")}
                      role="button"
                      aria-label=${e}
                      @click=${() => this.selectSwatch(e)}
                      @keydown=${(e) => !this.disabled && e.key === "Enter" && this.setColor(t.hexa)}
                    >
                      <div
                        class="color-picker__swatch-color"
                        style=${S({ backgroundColor: t.hexa })}
                      ></div>
                    </div>
                  ` : (console.error(`Unable to parse swatch color: "${e}"`, this), "");
		})}
              </div>
            ` : ""}
      </div>
    `;
		return this.inline ? r : s`
      <sl-dropdown
        class="color-dropdown"
        aria-disabled=${this.disabled ? "true" : "false"}
        .containingElement=${this}
        ?disabled=${this.disabled}
        ?hoist=${this.hoist}
        @sl-after-hide=${this.handleAfterHide}
      >
        <button
          part="trigger"
          slot="trigger"
          class=${_({
			"color-dropdown__trigger": !0,
			"color-dropdown__trigger--disabled": this.disabled,
			"color-dropdown__trigger--small": this.size === "small",
			"color-dropdown__trigger--medium": this.size === "medium",
			"color-dropdown__trigger--large": this.size === "large",
			"color-dropdown__trigger--empty": this.isEmpty,
			"color-dropdown__trigger--focused": this.hasFocus,
			"color-picker__transparent-bg": !0
		})}
          style=${S({ color: this.getHexString(this.hue, this.saturation, this.brightness, this.alpha) })}
          type="button"
        >
          <sl-visually-hidden>
            <slot name="label">${this.label}</slot>
          </sl-visually-hidden>
        </button>
        ${r}
      </sl-dropdown>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.BQVAQ53I.js
A.styles = [f, je], A.dependencies = {
	"sl-button-group": Te,
	"sl-button": de,
	"sl-dropdown": x,
	"sl-icon": ae,
	"sl-input": ge,
	"sl-visually-hidden": ke
}, h([a("[part~=\"base\"]")], A.prototype, "base", 2), h([a("[part~=\"input\"]")], A.prototype, "input", 2), h([a(".color-dropdown")], A.prototype, "dropdown", 2), h([a("[part~=\"preview\"]")], A.prototype, "previewButton", 2), h([a("[part~=\"trigger\"]")], A.prototype, "trigger", 2), h([r()], A.prototype, "hasFocus", 2), h([r()], A.prototype, "isDraggingGridHandle", 2), h([r()], A.prototype, "isEmpty", 2), h([r()], A.prototype, "inputValue", 2), h([r()], A.prototype, "hue", 2), h([r()], A.prototype, "saturation", 2), h([r()], A.prototype, "brightness", 2), h([r()], A.prototype, "alpha", 2), h([e()], A.prototype, "value", 2), h([fe()], A.prototype, "defaultValue", 2), h([e()], A.prototype, "label", 2), h([e()], A.prototype, "format", 2), h([e({
	type: Boolean,
	reflect: !0
})], A.prototype, "inline", 2), h([e({ reflect: !0 })], A.prototype, "size", 2), h([e({
	attribute: "no-format-toggle",
	type: Boolean
})], A.prototype, "noFormatToggle", 2), h([e()], A.prototype, "name", 2), h([e({
	type: Boolean,
	reflect: !0
})], A.prototype, "disabled", 2), h([e({ type: Boolean })], A.prototype, "hoist", 2), h([e({ type: Boolean })], A.prototype, "opacity", 2), h([e({ type: Boolean })], A.prototype, "uppercase", 2), h([e()], A.prototype, "swatches", 2), h([e({ reflect: !0 })], A.prototype, "form", 2), h([e({
	type: Boolean,
	reflect: !0
})], A.prototype, "required", 2), h([c({ passive: !1 })], A.prototype, "handleTouchMove", 1), h([m("format", { waitUntilFirstUpdate: !0 })], A.prototype, "handleFormatChange", 1), h([m("opacity", { waitUntilFirstUpdate: !0 })], A.prototype, "handleOpacityChange", 1), h([m("value")], A.prototype, "handleValueChange", 1), A.define("sl-color-picker");
//#endregion
//#region src/components/webmapx-draw-layer-dialog.ts
var tt = {
	longitude: "longitude (auto)",
	latitude: "latitude (auto)",
	area: "area (auto)",
	perimeter: "perimeter (auto)",
	length: "length (auto)",
	linkURL: "link URL",
	imageURL: "image URL",
	"create-time": "create-time (auto)",
	"update-time": "update-time (auto)"
}, nt = {
	Point: [
		"string",
		"number",
		"longitude",
		"latitude",
		"linkURL",
		"imageURL",
		"create-time",
		"update-time"
	],
	LineString: [
		"string",
		"number",
		"length",
		"linkURL",
		"imageURL",
		"create-time",
		"update-time"
	],
	Polygon: [
		"string",
		"number",
		"area",
		"perimeter",
		"longitude",
		"latitude",
		"linkURL",
		"imageURL",
		"create-time",
		"update-time"
	]
}, rt = new Set([
	"longitude",
	"latitude",
	"area",
	"perimeter",
	"length",
	"create-time",
	"update-time"
]), j = {
	longitude: {
		name: "longitude",
		label: "Longitude"
	},
	latitude: {
		name: "latitude",
		label: "Latitude"
	},
	area: {
		name: "area",
		label: "Area"
	},
	perimeter: {
		name: "perimeter",
		label: "Perimeter"
	},
	length: {
		name: "length",
		label: "Length"
	},
	"create-time": {
		name: "created",
		label: "Created date"
	},
	"update-time": {
		name: "updated",
		label: "Updated date"
	}
}, it = [{
	name: "id",
	type: "number"
}, {
	name: "name",
	type: "string"
}], at = {
	Point: y,
	LineString: y,
	Polygon: y
};
function M(e) {
	return {
		id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
		name: "",
		type: e,
		color: at[e],
		properties: it.map((e) => ({ ...e }))
	};
}
var N = class extends l {
	constructor(...e) {
		super(...e), this.geometryType = "Point", this.existingLayers = [], this.mapLayers = [], this.step = "select", this.selectedId = "new", this.layer = M("Point"), this.nameError = !1, this.newPropName = "", this.newPropType = "string", this.allowedAttributes = null;
	}
	static {
		this.styles = [
			he,
			_e,
			n`
        :host { display: block; }

        sl-dialog::part(panel) {
            min-width: min(420px, 90vw);
        }

        .layer-list {
            display: flex;
            flex-direction: column;
            gap: var(--webmapx-space-xs, 0.25rem);
            max-height: 220px;
            overflow-y: auto;
            margin-bottom: var(--webmapx-space-lg, 1rem);
        }

        .layer-option {
            display: flex;
            width: 100%;
            background: transparent;
            font: inherit;
            color: inherit;
            text-align: left;
            align-items: center;
            gap: var(--webmapx-space-sm, 0.5rem);
            padding: var(--webmapx-space-xs, 0.4rem) var(--webmapx-space-sm, 0.6rem);
            border-radius: var(--webmapx-radius-sm, 4px);
            cursor: pointer;
            border: 1px solid transparent;
            font-size: var(--webmapx-font-size-md, 0.9rem);
        }

        .layer-option:hover { background: var(--color-background-secondary, #f4f6f8); }

        .layer-option.selected {
            background: var(--sl-color-primary-100);
            border-color: var(--sl-color-primary-400);
        }

        .color-dot {
            width: 12px; height: 12px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .new-icon { color: var(--color-text-muted, #6b7681); font-size: var(--webmapx-font-size-lg, 1rem); }

        .prop-table {
            width: 100%;
            border-collapse: collapse;
            font-size: var(--webmapx-font-size-md, 0.85rem);
            margin-top: var(--webmapx-space-sm, 0.5rem);
        }

        .prop-table th {
            text-align: left;
            background: var(--color-background-secondary, #f4f6f8);
            padding: var(--webmapx-space-xs, 0.25rem) var(--webmapx-space-xs, 0.4rem);
            border-bottom: 1px solid var(--color-border-light, #e2e7ec);
        }

        .prop-table td {
            padding: var(--webmapx-space-xs, 0.2rem) var(--webmapx-space-xs, 0.4rem);
            border-bottom: 1px solid var(--color-border-light, #e2e7ec);
            vertical-align: middle;
        }

        .prop-table tr:last-child td { border-bottom: none; }

        .prop-row-auto td { color: var(--color-text-muted, #6b7681); font-style: italic; }

        .type-computed { color: var(--color-primary, #2b6c8f); font-size: var(--webmapx-font-size-sm, 0.75rem); }

        .add-row td { background: var(--color-surface-raised, #f4f6f8); }

        .add-row sl-input,
        .add-row sl-select { font-size: var(--webmapx-font-size-md, 0.85rem); }

        .name-input-row {
            display: flex;
            align-items: center;
            gap: var(--webmapx-space-sm, 0.5rem);
            margin-bottom: var(--webmapx-space-md, 0.75rem);
        }

        .color-swatch {
            padding: 0;
            width: 32px; height: 32px;
            border-radius: var(--webmapx-radius-sm, 4px);
            border: 1px solid var(--color-border, #d5dce3);
            cursor: pointer;
            flex-shrink: 0;
        }

        .footer {
            display: flex;
            justify-content: flex-end;
            gap: var(--webmapx-space-sm, 0.5rem);
            margin-top: var(--webmapx-space-lg, 1rem);
        }

        .error-msg {
            color: var(--sl-color-danger-600);
            font-size: var(--webmapx-font-size-sm, 0.8rem);
            margin-top: var(--webmapx-space-xs, 0.25rem);
        }
    `
		];
	}
	open() {
		ye(this), this.step = "select", this.selectedId = this.existingLayers.length === 0 ? "new" : this.existingLayers[0].id, this.layer = M(this.geometryType), this.newPropName = "", this.newPropType = "string", this.nameError = !1, this.dialog?.show();
	}
	close() {
		this.dialog?.hide();
	}
	selectOption(e) {
		this.selectedId = e;
	}
	goToDetail() {
		if (this.selectedId === "new") this.layer = M(this.geometryType), this.allowedAttributes = null;
		else {
			let e = this.existingLayers.find((e) => e.id === this.selectedId);
			if (e) this.layer = {
				...e,
				properties: e.properties.map((e) => ({ ...e }))
			}, this.allowedAttributes = null;
			else {
				let e = this.mapLayers.find((e) => e.layerId === this.selectedId);
				this.layer = {
					...M(this.geometryType),
					name: e?.label ?? this.selectedId,
					properties: e?.properties?.map((e) => ({ ...e })) ?? it.map((e) => ({ ...e })),
					borrowedSourceId: e?.sourceId
				}, this.allowedAttributes = e?.allowedAttributes ?? null;
			}
		}
		this.step = "detail", this.updateComplete.then(() => this.renderRoot.querySelector("sl-input[name=\"layername\"]")?.focus());
	}
	goBack() {
		this.step = "select";
	}
	addProperty() {
		this.newPropName.trim() && (this.layer = {
			...this.layer,
			properties: [...this.layer.properties, {
				name: this.newPropName.trim(),
				type: this.newPropType
			}]
		}, this.newPropName = "", this.newPropType = "string");
	}
	removeProperty(e) {
		let t = [...this.layer.properties];
		t.splice(e, 1), this.layer = {
			...this.layer,
			properties: t
		};
	}
	confirm() {
		let e = this.renderRoot.querySelector("sl-input[name=\"layername\"]")?.value?.trim() ?? this.layer.name;
		if (!e) {
			this.nameError = !0, this.requestUpdate();
			return;
		}
		this.nameError = !1;
		let t = this.newPropName.trim(), n = t ? [...this.layer.properties, {
			name: t,
			type: this.newPropType
		}] : [...this.layer.properties], r = {
			...this.layer,
			name: e,
			properties: n
		};
		this.dispatchEvent(new CustomEvent("webmapx-draw-layer-confirm", {
			detail: r,
			bubbles: !0,
			composed: !0
		})), this.dialog.hide();
	}
	cancel() {
		this.dispatchEvent(new CustomEvent("webmapx-draw-layer-cancel", {
			bubbles: !0,
			composed: !0
		})), this.dialog.hide();
	}
	renderSelectStep() {
		let e = this.geometryType === "LineString" ? "Line" : this.geometryType;
		return s`
            <div class="layer-list">
                <button type="button" class="layer-option ${this.selectedId === "new" ? "selected" : ""}"
                     aria-pressed=${this.selectedId === "new"}
                     @click=${() => this.selectOption("new")}
                     @dblclick=${() => {
			this.selectOption("new"), this.goToDetail();
		}}>
                    <span class="new-icon">＋</span>
                    <span>New ${e} layer</span>
                </button>
                ${this.existingLayers.map((e) => s`
                    <button type="button" class="layer-option ${this.selectedId === e.id ? "selected" : ""}"
                         aria-pressed=${this.selectedId === e.id}
                         @click=${() => this.selectOption(e.id)}
                         @dblclick=${() => {
			this.selectOption(e.id), this.goToDetail();
		}}>
                        <span class="color-dot" style="background:${e.color}"></span>
                        <span>${e.name}</span>
                    </button>
                `)}
                ${this.mapLayers.length > 0 ? s`
                    <div style="font-size:0.72rem;color:var(--color-text-muted, #6b7681);padding:0.4rem 0.2rem 0.1rem;text-transform:uppercase;letter-spacing:0.05em">Map layers</div>
                    ${this.mapLayers.map((e) => s`
                        <button type="button" class="layer-option ${this.selectedId === e.layerId ? "selected" : ""}"
                             aria-pressed=${this.selectedId === e.layerId}
                             @click=${() => this.selectOption(e.layerId)}
                             @dblclick=${() => {
			this.selectOption(e.layerId), this.goToDetail();
		}}>
                            <span class="new-icon" style="color:var(--sl-color-warning-600)">✎</span>
                            <span>${e.label}</span>
                            <span style="font-size:0.7rem;color:var(--color-text-muted, #6b7681);margin-left:auto">map layer</span>
                        </button>
                    `)}
                ` : ""}
            </div>
            <div class="footer">
                <sl-button @click=${this.cancel}>Cancel</sl-button>
                <sl-button autofocus variant="primary" @click=${this.goToDetail}>Next →</sl-button>
            </div>
        `;
	}
	renderDetailStep() {
		let e = nt[this.geometryType];
		return s`
            <div class="name-input-row">
                <sl-input name="layername"
                    style="flex:1"
                    placeholder="Layer name"
                    aria-label="Layer name"
                    value=${this.layer.name}
                    @keydown=${(e) => e.key === "Enter" && this.renderRoot.querySelector("#new-prop-name")?.focus()}
                ></sl-input>
                <button type="button" class="color-swatch"
                     style="background:${this.layer.color}"
                     title="Layer color"
                     aria-label="Layer color"
                     @click=${() => this.renderRoot.querySelector("input[type=color]")?.click()}>
                </button>
                <input type="color" style="display:none" .value=${this.layer.color}
                    @input=${(e) => {
			this.layer = {
				...this.layer,
				color: e.target.value
			};
		}}>
            </div>
            ${this.nameError ? s`<div class="error-msg">Enter a layer name.</div>` : ""}

            <table class="prop-table">
                <thead>
                    <tr><th>Property</th><th>Type</th><th style="width:2rem"></th></tr>
                </thead>
                <tbody>
                    ${this.layer.properties.map((e, t) => s`
                        <tr class="${e.name === "id" ? "prop-row-auto" : ""}">
                            <td>${e.name}</td>
                            <td class="${[
			"string",
			"number",
			"linkURL",
			"imageURL"
		].includes(e.type) ? "" : "type-computed"}">${e.type}${e.name === "id" ? " (auto)" : ""}</td>
                            <td>
                                ${t === 0 ? "" : s`
                                    <sl-icon-button name="x" label="Remove property ${e.name}" @click=${() => this.removeProperty(t)}></sl-icon-button>
                                `}
                            </td>
                        </tr>
                    `)}
                    <tr class="add-row">
                        <td>
                            ${this.allowedAttributes ? s`
                                <sl-select id="new-prop-name" size="small" aria-label="Property name"
                                    .value=${this.newPropName}
                                    @sl-change=${(e) => this.newPropName = e.target.value}>
                                    <sl-option value="">— select —</sl-option>
                                    ${this.allowedAttributes.filter((e) => !this.layer.properties.find((t) => t.name === e)).map((e) => s`<sl-option value=${e}>${e}</sl-option>`)}
                                </sl-select>
                            ` : s`
                                <sl-input id="new-prop-name" size="small" placeholder="property name" aria-label="Property name"
                                    .value=${this.newPropName}
                                    @sl-input=${(e) => this.newPropName = e.target.value}
                                    @keydown=${(e) => e.key === "Enter" && this.addProperty()}>
                                </sl-input>
                            `}
                        </td>
                        <td>
                            <sl-select id="new-prop-type" size="small" .value=${this.newPropType}
                                @sl-change=${(e) => this.newPropType = e.target.value}>
                                ${e.map((e) => s`<sl-option value=${e}>${tt[e] ?? e}</sl-option>`)}
                            </sl-select>
                        </td>
                        <td>
                            <sl-icon-button name="plus" label="Add property" @click=${this.addProperty}></sl-icon-button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="footer">
                <sl-button @click=${this.goBack}>← Back</sl-button>
                <sl-button @click=${this.cancel}>Cancel</sl-button>
                <sl-button variant="primary" @click=${this.confirm}>OK</sl-button>
            </div>
        `;
	}
	render() {
		let e = this.geometryType === "LineString" ? "Line" : this.geometryType;
		return ve(s`
                <sl-dialog label="${this.step === "select" ? `Select ${e} layer` : `Configure ${e} layer`}"
                           @sl-request-close=${(e) => {
			e.detail?.source === "overlay" && this.cancel();
		}}>
                    ${this.step === "select" ? this.renderSelectStep() : this.renderDetailStep()}
                </sl-dialog>
        `);
	}
};
u([e({ type: String })], N.prototype, "geometryType", void 0), u([e({ attribute: !1 })], N.prototype, "existingLayers", void 0), u([e({ attribute: !1 })], N.prototype, "mapLayers", void 0), u([r()], N.prototype, "step", void 0), u([r()], N.prototype, "selectedId", void 0), u([r()], N.prototype, "layer", void 0), u([r()], N.prototype, "nameError", void 0), u([r()], N.prototype, "newPropName", void 0), u([r()], N.prototype, "newPropType", void 0), u([r()], N.prototype, "allowedAttributes", void 0), u([a("sl-dialog")], N.prototype, "dialog", void 0), N = u([o("webmapx-draw-layer-dialog")], N);
//#endregion
//#region src/utils/snap-utils.ts
function ot(e) {
	return e.type === "Point" ? [e.coordinates] : e.type === "MultiPoint" || e.type === "LineString" ? e.coordinates : e.type === "MultiLineString" || e.type === "Polygon" ? e.coordinates.flat() : e.type === "MultiPolygon" ? e.coordinates.flat(2) : [];
}
function st(e) {
	let t = [], n = (e) => {
		for (let n = 0; n < e.length - 1; n++) t.push([e[n], e[n + 1]]);
	};
	return e.type === "LineString" ? n(e.coordinates) : e.type === "MultiLineString" ? e.coordinates.forEach((e) => n(e)) : e.type === "Polygon" ? e.coordinates.forEach((e) => n(e)) : e.type === "MultiPolygon" && e.coordinates.forEach((e) => e.forEach((e) => n(e))), t;
}
function ct(e, t, n) {
	let [r, i] = e, a = [
		[r - t, i - t],
		[r + t, i - t],
		[r + t, i + t],
		[r - t, i + t]
	].map(n).filter((e) => e !== null);
	if (a.length < 1) return null;
	let o = a.map((e) => e[0]), s = a.map((e) => e[1]);
	return {
		minLng: Math.min(...o),
		maxLng: Math.max(...o),
		minLat: Math.min(...s),
		maxLat: Math.max(...s)
	};
}
function lt(e, t, n, r = {}) {
	let i = r.threshold ?? 16, a = r.edgePenalty ?? 8, o = null, s = i, c = r.unproject ? ct(e, i, r.unproject) : null;
	if (r.unproject && !c) return null;
	let l = c ? (e) => e[0] >= c.minLng && e[0] <= c.maxLng && e[1] >= c.minLat && e[1] <= c.maxLat : (e) => !0;
	for (let r of t) {
		for (let t of ot(r)) {
			if (!l(t)) continue;
			let r = n(t), i = Math.hypot(r[0] - e[0], r[1] - e[1]);
			i < s && (s = i, o = t);
		}
		for (let [t, i] of st(r)) {
			if (c) {
				let e = Math.min(t[0], i[0]), n = Math.max(t[0], i[0]), r = Math.min(t[1], i[1]), a = Math.max(t[1], i[1]);
				if (!(n >= c.minLng && e <= c.maxLng && a >= c.minLat && r <= c.maxLat)) continue;
			}
			let r = n(t), l = n(i), u = l[0] - r[0], d = l[1] - r[1], f = u * u + d * d;
			if (f === 0) continue;
			let p = Math.max(0, Math.min(1, ((e[0] - r[0]) * u + (e[1] - r[1]) * d) / f)), m = Math.hypot(r[0] + p * u - e[0], r[1] + p * d - e[1]);
			m + a < s && (s = m + a, o = [t[0] + p * (i[0] - t[0]), t[1] + p * (i[1] - t[1])]);
		}
	}
	return o;
}
//#endregion
//#region src/icons/dash-line.svg?url
var ut = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20stroke='currentColor'%20stroke-width='1.4'%20stroke-linecap='round'%3e%3cline%20x1='13.5'%20y1='2.5'%20x2='2.5'%20y2='13.5'%20stroke-dasharray='2.6%202.2'/%3e%3c/svg%3e", dt = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20stroke='currentColor'%20stroke-width='1.4'%3e%3crect%20x='2.5'%20y='3.5'%20width='11'%20height='9'%20rx='0.5'%20stroke-dasharray='2%201.8'/%3e%3c/svg%3e", ft = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20stroke='currentColor'%20stroke-width='1.3'%20stroke-linecap='round'%20stroke-linejoin='round'%3e%3cpath%20d='M3%2012%20L7%205%20L13%209'/%3e%3ccircle%20cx='3'%20cy='12'%20r='1.6'%20fill='currentColor'%20stroke='none'/%3e%3ccircle%20cx='7'%20cy='5'%20r='1.6'%20fill='currentColor'%20stroke='none'/%3e%3ccircle%20cx='13'%20cy='9'%20r='1.6'%20fill='currentColor'%20stroke='none'/%3e%3c/svg%3e", pt = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20stroke='currentColor'%20stroke-linecap='round'%20stroke-linejoin='round'%3e%3cpath%20d='M8%202.8%20L13.2%206.5%20L10.2%2013.2%20L2.8%208.2%20Z'%20stroke-width='1.6'/%3e%3ccircle%20cx='8'%20cy='2.8'%20r='2'%20fill='%23fff'%20stroke-width='1.1'/%3e%3ccircle%20cx='13.2'%20cy='6.5'%20r='2'%20fill='%23fff'%20stroke-width='1.1'/%3e%3ccircle%20cx='10.2'%20cy='13.2'%20r='2'%20fill='%23fff'%20stroke-width='1.1'/%3e%3ccircle%20cx='2.8'%20cy='8.2'%20r='2'%20fill='%23fff'%20stroke-width='1.1'/%3e%3c/svg%3e", mt = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20stroke='currentColor'%20stroke-linecap='round'%20stroke-linejoin='round'%3e%3cdefs%3e%3cclipPath%20id='wmx-fv-clip'%3e%3crect%20x='3'%20y='2.5'%20width='10'%20height='11'%20rx='1.2'/%3e%3c/clipPath%3e%3c/defs%3e%3crect%20x='3'%20y='2.5'%20width='10'%20height='2.75'%20fill='currentColor'%20clip-path='url(%23wmx-fv-clip)'/%3e%3crect%20x='3'%20y='2.5'%20width='10'%20height='11'%20rx='1.2'%20stroke-width='1.2'/%3e%3cpath%20d='M3.3%208%20H12.7'%20stroke-width='0.7'/%3e%3cpath%20d='M3.3%2010.75%20H12.7'%20stroke-width='0.7'/%3e%3c/svg%3e", ht = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20stroke='currentColor'%20stroke-width='1.3'%20stroke-linecap='round'%20stroke-linejoin='round'%3e%3cpath%20d='M8%202.8c2.9%200%205%201.4%205%203.4%200%201.4-1%202.5-2.3%203.1.8.4%201.3%201%201.3%201.8%200%201.4-1.6%202.1-3.5%202.1-.8%200-1.6-.2-2.2-.4-.4.3-1%20.4-1.5.4-1.4%200-2.6-.9-2.6-2.1%200-.7.4-1.3%201-1.7-1-.7-1.5-1.5-1.5-2.6%200-2.2%202.7-4%206.3-4z'%20stroke-dasharray='2%201.8'/%3e%3c/svg%3e", gt = `var(--webmapx-data-tool, ${y})`, _t = `var(--webmapx-data-start, ${xe})`, vt = {
	a: [14, 10],
	b: [34, 8],
	c: [54, 18],
	d: [10, 26],
	e: [20, 36],
	f: [46, 34]
}, yt = [
	"a",
	"b",
	"c",
	"d",
	"e",
	"f"
], bt = [
	"f",
	"e",
	"d",
	"a",
	"b",
	"c"
];
function xt(e, t) {
	let [n, ...r] = e.map((e) => vt[e]);
	return `M${n[0]} ${n[1]} ` + r.map(([e, t]) => `L${e} ${t}`).join(" ") + (t ? " Z" : "");
}
function St(e) {
	return t`
        <svg viewBox="0 0 64 44" role="img" aria-hidden="true" focusable="false">
            ${e}
        </svg>`;
}
var Ct = t`
    ${Object.values(vt).map(([e, n]) => t`<circle cx=${e} cy=${n} r="2.6" fill=${gt} />`)}
`, wt = St(Ct), Tt = St(t`
    <path d=${xt(yt, !1)} fill="none" stroke=${_t} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    ${Ct}
`), Et = St(t`
    <path d=${xt(bt, !0)} fill=${_t} fill-opacity="0.3" stroke=${_t} stroke-width="2" stroke-linejoin="round" />
    ${Ct}
`);
function Dt(e) {
	return e === "Point" ? wt : e === "LineString" ? Tt : Et;
}
//#endregion
//#region src/components/webmapx-draw-tool.ts
var P = "webmapx-draw-rubber-source", F = "webmapx-draw-rubber-line", I = "webmapx-draw-vertex-source", Ot = "webmapx-draw-vertex-layer", L = "New layer", R = "geom";
function z(e, t) {
	return t === "Point" ? `webmapx-draw-src-${e}` : `${e}:${R}`;
}
function B(e) {
	return `${e}-map`;
}
function kt(e, t, n, r) {
	return t.type === "Polygon" ? {
		id: e,
		type: "style",
		version: 8,
		title: t.name,
		metadata: r,
		sources: { [R]: {
			type: "geojson",
			data: {
				type: "FeatureCollection",
				features: []
			}
		} },
		layers: [{
			id: `${e}-fill`,
			type: "fill",
			source: R,
			metadata: { label: "Fill" },
			paint: {
				"fill-color": n,
				"fill-opacity": .35
			}
		}, {
			id: `${e}-line`,
			type: "line",
			source: R,
			metadata: { label: "Line" },
			paint: {
				"line-color": n,
				"line-width": 2
			}
		}]
	} : t.type === "LineString" ? {
		id: e,
		type: "style",
		version: 8,
		title: t.name,
		metadata: r,
		sources: { [R]: {
			type: "geojson",
			data: {
				type: "FeatureCollection",
				features: []
			}
		} },
		layers: [{
			id: `${e}-solid`,
			type: "line",
			source: R,
			metadata: { label: "Line" },
			filter: [
				"!=",
				["get", "__dashed"],
				!0
			],
			paint: {
				"line-color": n,
				"line-width": 2
			}
		}, {
			id: `${e}-dashed`,
			type: "line",
			source: R,
			metadata: { label: "Dashed line" },
			filter: [
				"==",
				["get", "__dashed"],
				!0
			],
			paint: {
				"line-color": n,
				"line-width": 2,
				"line-dasharray": [2, 2]
			}
		}]
	} : {
		id: e,
		type: "circle",
		source: z(e, t.type),
		title: t.name,
		metadata: r,
		paint: {
			"circle-radius": 6,
			"circle-color": n,
			"circle-stroke-width": 2,
			"circle-stroke-color": "#fff"
		}
	};
}
var At = "#888888", jt = "#ff3b30", Mt = 10, V = "webmapx-draw-draft-source", Nt = "webmapx-draw-draft-points", H = "webmapx-draw-active-nodes-source", Pt = "webmapx-draw-active-nodes", U = "webmapx-draw-edit-vert-source", Ft = "webmapx-draw-edit-vert", W = "webmapx-draw-edit-mid-source", It = "webmapx-draw-edit-mid", G = "webmapx-draw-sel-vert-source", Lt = "webmapx-draw-sel-vert", Rt = 12, K = "webmapx-draw-snap-source", zt = "webmapx-draw-snap-layer", Bt = 16, q = 1, J = "webmapx-draw-marquee-source", Vt = "webmapx-draw-marquee-fill", Ht = "webmapx-draw-marquee-line", Y = "webmapx-draw-multisel-source", Ut = "webmapx-draw-multisel-point", X = class extends d {
	constructor(...e) {
		super(...e), this.toolId = "draw", this.mode = "select", this.drawLayers = [], this.features = [], this.selectedFeatureId = null, this.selectedFeatureIds = [], this.hoveredFeatureId = null, this.lastFocusedAttributeName = null, this.helpText = "", this.pendingMode = null, this.uiVersion = 0, this.panelView = "type", this.pickedType = null, this.showDrawIntro = !0, this.catalogLayerOptions = [], this.catalogLayerCounts = {}, this.pendingCatalogEditOption = null, this.pausedLayerIds = /* @__PURE__ */ new Set(), this.ownsPermLayer = /* @__PURE__ */ new Set(), this.confirmedRestingLayerIds = /* @__PURE__ */ new Set(), this.unsubMapLayers = null, this.unsubMapLoaded = null, this.boundMap = null, this.lastMapLayerIdsKey = "", this.draftPoints = [], this.draftRedoStack = [], this.cursorPos = null, this.circleDraft = null, this.rectDraft = null, this.rectSelectDraft = null, this.lassoSelectDraft = null, this.activeLayerIds = {}, this.drawHistory = [], this.drawHistoryIndex = -1, this.moveHistory = [], this.moveHistoryIndex = -1, this.sharedLayersCreated = !1, this.createdDrawLayerIds = /* @__PURE__ */ new Set(), this.touchMQ = window.matchMedia("(pointer: coarse)"), this.isTouchDevice = this.touchMQ.matches, this.onTouchMQChange = (e) => {
			this.isTouchDevice = e.matches;
		}, this.snapEnabled = !0, this.altActive = !1, this.snapPos = null, this.lastCursorPx = null, this.editState = "none", this.editHandles = [], this.dragging = null, this.selectedHandle = null, this.featureDrag = null, this.unsubClick = null, this.unsubMove = null, this.moveRafId = null, this.pendingMoveEvent = null, this.unsubCtx = null, this.unsubDown = null, this.unsubUp = null, this.unsubLeave = null, this.layerNameInvalid = !1, this.layerNameDraft = null, this.addingAttribute = !1, this.newAttrName = "", this.newAttrType = "", this.removedAttributeStack = [], this.removedAttributeRedoStack = [], this.renamingAttributeIndex = null, this.renameAttrDraft = "", this.pendingSourceRefresh = /* @__PURE__ */ new Map(), this.onKeyDown = (e) => {
			if (this.isRelevantTarget(e)) {
				if (e.key === "Alt") {
					e.preventDefault(), this.altActive || (this.altActive = !0, this.snapPos = null, this.updateRubberband(), this.updateSnapIndicator());
					return;
				}
				if (!this.isTypingTarget(e) && this.panelView === "editing") {
					if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
						e.preventDefault(), this.isDrawMode() ? this.undoOrDraftBack() : this.undoMove();
						return;
					}
					if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
						e.preventDefault(), this.isDrawMode() ? this.redoOrDraftForward() : this.redoMove();
						return;
					}
					(e.key === "Delete" || e.key === "Backspace") && (this.draftPoints.length > 0 ? (e.preventDefault(), this.removeLastDraftPoint()) : this.selectedHandle ? (e.preventDefault(), this.deleteSelectedVertex()) : this.selectedFeatureId && (e.preventDefault(), this.deleteSelected()));
				}
			}
		}, this.onWindowBlur = () => {
			this.altActive && (this.altActive = !1, Q(this.mode) && this.updateRubberband());
		}, this.onKeyUp = (e) => {
			e.key === "Alt" && (this.altActive = !1, Q(this.mode) && this.updateRubberband());
		}, this.onFinishEditingRequest = (e) => {
			let t = e.detail?.layerId;
			if (!t || !this.adapter) return;
			let n = this.adapter.store.getState().mapLayers ?? {}, r = Object.entries(this.activeLayerIds).find(([, e]) => {
				let r = this.drawLayers.find((t) => t.id === e);
				return r?.borrowedSourceId ? Object.entries(n).find(([, e]) => e.sourceId === r.borrowedSourceId)?.[0] === t : !1;
			});
			if (!r) return;
			let [i, a] = r;
			if (this.pickedType === i) {
				this.confirmDone();
				return;
			}
			let o = this.drawLayers.find((e) => e.id === a);
			o && this.pauseDrawLayer(o), delete this.activeLayerIds[i], this.refreshCatalogLayerOptions(), this.refreshTypeCatalogCounts();
		};
	}
	connectedCallback() {
		super.connectedCallback(), this.touchMQ.addEventListener("change", this.onTouchMQChange);
	}
	get effectiveSnap() {
		return this.snapEnabled && !this.altActive;
	}
	static {
		this.styles = n`
        :host {
            /* Shared by the "Edit attributes" table's Attribute/Type
             * columns and the add-attribute form below it (the "Add
             * attribute" button, and the name input/type select once it's
             * expanded), so those stay visually aligned with the columns
             * above them without the values drifting apart. */
            --prop-attr-col-width: 46%;
            --prop-type-col-width: 32%;
            display: flex;
            flex-direction: column;
            padding: var(--webmapx-tool-padding, 0);
            min-width: 200px;
            max-height: var(--webmapx-draw-tool-max-height, 100%);
            /* Deliberately not 'hidden': an overflow value other than
             * 'visible' here would make :host itself the nearest ancestor
             * .session-footer's 'position: sticky' looks for — and since
             * :host's own height never actually gets clamped (see the
             * .session-footer comment below), nothing would ever overflow
             * it, so stickiness against it would be a no-op. Leaving this
             * 'visible' lets it pass through to the real scrolling
             * container, webmapx-tool-panel's .panel-content.
             */
            overflow: visible;
        }

        /* The editing session's .session-footer supplies its own matching
         * bottom padding (so that padding stays part of its opaque,
         * sticky-pinned box — see its own comment) — without this, :host's
         * padding would stack on top of it, doubling the gap below the
         * buttons whenever the attribute list is short enough not to need
         * scrolling. Views without a footer (type/layer pickers) are
         * unaffected and keep :host's own bottom padding as their gutter.
         */
        :host:has(.session-footer) {
            padding-bottom: 0;
        }

        .scroll-content {
            flex: 1;
            overflow-y: auto;
            min-height: 0;
        }

        /* Each mode row is its own boxed pill — select, draw shape, snap —
           since those are switches you pick between. Undo/redo/delete are
           one-off actions, not a mode, so they get the plain, unboxed
           .history-actions treatment instead (see below), slightly smaller
           than the mode icons they sit beside. */
        .pill {
            display: inline-flex;
            gap: 0.15rem;
            padding: 3px;
            border: 1px solid var(--color-background-secondary, #e2e5e8);
            border-radius: 8px;
            flex-shrink: 0;
        }
        .history-actions {
            display: inline-flex;
            align-items: center;
            gap: 0.1rem;
            flex-shrink: 0;
        }
        .toolbar-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
            margin-bottom: 0.5rem;
            flex-shrink: 0;
        }
        .toolbar-label {
            font-size: 0.66rem;
            font-weight: 700;
            color: var(--color-text-muted, #8a95a1);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            width: 2.75rem;
            flex-shrink: 0;
        }
        /* Sized like the sl-icon-buttons beside it. A native button, not
           sl-icon-button, because only a real button can carry aria-pressed
           (see toggleButton). */
        .toggle-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: inherit;
            padding: var(--sl-spacing-x-small, 0.5rem);
            border: none;
            border-radius: 6px;
            background: none;
            color: var(--sl-color-neutral-600, #5a6773);
            cursor: pointer;
        }
        .toggle-button:not([aria-pressed="true"]):not(:disabled):hover {
            color: var(--color-primary, #2b6c8f);
            background: var(--color-background-secondary, #e8ebee);
        }
        .toggle-button:focus-visible {
            outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #2b6c8f));
            outline-offset: var(--webmapx-focus-offset, 2px);
        }
        .toggle-button[aria-pressed="true"] {
            color: #fff;
            background: var(--color-primary, #2b6c8f);
            box-shadow: 0 2px 6px -2px var(--color-primary, #2b6c8f);
        }
        .toggle-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .help {
            font-size: 0.8rem;
            color: var(--color-text-secondary, #5a6773);
            margin-bottom: 0.5rem;
            min-height: 2.5em;
        }

        .section-label {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--color-text-muted, #6b7681);
            margin-bottom: 0.25rem;
        }

        .flow-heading {
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        /*
         * Sticks to the bottom of whichever ancestor is actually scrolling —
         * in practice webmapx-tool-panel's own .panel-content wrapper,
         * since :host's 'max-height: 100%' never resolves to a definite
         * size through the slot boundary (a percentage height on a flex item
         * that got its size from *shrinking* rather than an explicit height
         * or stretch isn't treated as definite for a descendant's percentage
         * resolution), so .scroll-content's own 'overflow-y: auto' never
         * actually engages and :host just grows to fit its content instead.
         * 'position: sticky' sidesteps that entirely: it pins relative to
         * whatever the real nearest scrolling ancestor turns out to be,
         * which is exactly what keeps this bar visible instead of scrolling
         * away with a long attribute list — see :host's 'overflow: visible'
         * above, which is what lets stickiness reach past this component's
         * own (non-scrolling) box to find it.
         */
        .session-footer {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 0.5rem;
            margin-top: 0.6rem;
            padding-top: 0.5rem;
            /*
             * Matches :host's own padding (the gutter .panel-content itself
             * has none of — see :host's 'padding' above), so the buttons
             * keep the same distance from the panel's bottom edge whether
             * this bar is sitting in its natural, unstuck position (bounded
             * by :host's own bottom padding) or genuinely stuck against
             * .panel-content's edge while scrolling a long attribute list.
             * It's padding rather than the 'bottom' sticky offset so this
             * gap is part of the footer's own opaque box — pushed out as a
             * sticky offset instead, that strip would sit *below* the
             * footer's background, uncovered, letting whatever scrolled
             * content and its transparent backdrop happened to be there
             * show through underneath the buttons.
             */
            padding-bottom: var(--webmapx-tool-padding, 0);
            flex-shrink: 0;
            position: sticky;
            bottom: 0;
            background: var(--webmapx-panel-bg, rgb(var(--color-surface-rgb, 255 255 255) / var(--webmapx-surface-alpha, 1)));
            border-top: 1px solid var(--color-border-light, #e2e7ec);
        }

        /* Always rendered (unlike the hint, which only appears on a naming
           error) so the "Edit attributes" button stays pinned to the
           left edge and "Done" to the right, whichever else is showing. */
        .footer-spacer {
            flex: 1;
        }

        .name-required-hint {
            font-size: 0.78rem;
            color: var(--sl-color-danger-600, #dc2626);
        }

        .layer-picker-header {
            display: flex;
            align-items: center;
            margin-top: 0.75rem;
            margin-bottom: 0.5rem;
        }

        .add-layer-btn {
            flex-shrink: 0;
        }

        .editing-title-row {
            display: flex;
            flex-direction: column;
            gap: 0.3rem;
            margin-bottom: 0.5rem;
        }

        .editing-title-second-row {
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }

        .editing-title-label {
            font-size: 0.8rem;
            color: var(--color-text-secondary, #5a6773);
            flex-shrink: 0;
        }


        .type-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
        }

        .type-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.3rem;
            padding: 0.8rem 0.3rem;
            border: 1px solid var(--color-background-secondary, #e2e5e8);
            border-radius: 8px;
            background: transparent;
            cursor: pointer;
            font: inherit;
            color: inherit;
        }

        .type-card:hover {
            background: var(--color-background-secondary, #f4f6f8);
            border-color: var(--sl-color-primary-400, #7dc4fa);
        }

        .type-card[active] {
            background: var(--color-primary-soft, rgba(43, 108, 143, 0.12));
            border-color: var(--color-primary, #2b6c8f);
        }

        .type-icon {
            display: block;
            width: 100%;
        }

        .type-icon svg {
            width: 100%;
            height: auto;
            display: block;
        }

        .type-name { font-size: 0.72rem; font-weight: 600; text-align: center; line-height: 1.2; }
        .type-count { font-size: 0.68rem; color: var(--color-text-muted, #6b7681); }
        /* Muted text passes AA on white, not on the selected card's tint. */
        .type-card[active] .type-count { color: var(--color-text-secondary, #5a6773); }

        .empty-state {
            font-size: 0.82rem;
            color: var(--color-text-muted, #6b7681);
            padding: 0.4rem 0;
        }

        .layer-list {
            margin-bottom: 0.5rem;
        }

        .layer-group {
            display: flex;
            flex-direction: column;
            border: 1px solid var(--color-background-secondary, #e2e5e8);
            border-radius: 8px;
            overflow: hidden;
        }

        .layer-row {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.5rem 0.6rem;
            font-size: 0.85rem;
            border-bottom: 1px solid var(--color-background-secondary, #e2e5e8);
        }

        .layer-row:last-child {
            border-bottom: none;
        }

        .layer-row:hover {
            background: var(--color-background-secondary, #f4f6f8);
        }

        .remove-layer-btn {
            font-size: 0.75rem;
        }

        .color-dot {
            flex-shrink: 0;
            box-sizing: border-box;
        }
        /* Shape echoes the geometry the layer holds — a small dot, a thin
           line, an outlined area — rather than one swatch shape for every
           layer type. Polygon's fill is a light tint (see swatchStyle,
           which appends alpha to the hex colour) with the outline carrying
           the full colour, so it reads as an area rather than a solid chip. */
        .color-dot--point {
            width: 6px; height: 6px;
            border-radius: 50%;
        }
        .color-dot--line {
            width: 12px;
            height: 2px;
            border-radius: 1px;
        }
        .color-dot--polygon {
            width: 10px; height: 10px;
            border-radius: 2px;
            border: 1.5px solid;
        }

        .layer-name-wrap {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: baseline;
            gap: 0.3rem;
            overflow: hidden;
            white-space: nowrap;
        }

        .layer-name {
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .feature-count {
            flex-shrink: 0;
            color: var(--color-text-muted, #6b7681);
            font-size: 0.75rem;
        }

        .editing-layer-name {
            flex: 1;
            min-width: 0;
        }
        .editing-layer-name::part(base) {
            background: transparent;
            border: none;
            border-bottom: 1px dashed var(--color-background-secondary, #d5dce3);
            border-radius: 0;
            box-shadow: none;
        }
        .editing-layer-name::part(base):hover,
        .editing-layer-name::part(base):focus-within {
            background: var(--sl-input-background-color, #fff);
            border-bottom-style: solid;
            border-bottom-color: var(--sl-input-border-color, #d5dce3);
        }
        /* Shoelace's default focus ring is a box-shadow glow, sized for a
           form field — it overflows this title-sized rename box's bounds
           instead of hugging it. The border-bottom above (turned solid on
           focus, same as hover) is cue enough on its own. */
        .editing-layer-name::part(base):focus-within {
            border-bottom-color: var(--sl-color-primary-400, #6ea8dc);
            box-shadow: none;
        }
        /* "Done" refuses to leave a layer still called "New layer" — this is
           what tells the user why, instead of the button silently doing
           nothing. */
        .editing-layer-name.name-invalid::part(base) {
            background: var(--sl-color-danger-50, #fef2f2);
            border: 1px solid var(--sl-color-danger-500, #ef4444);
            border-radius: 4px;
        }
        .editing-layer-name.name-invalid::part(input) {
            color: var(--sl-color-danger-600, #dc2626);
        }
        /* A muted pencil is the "click to rename" tell — cheap to notice at a
           glance, unlike a hover-only border that only confirms editability
           after the user already suspected it. */
        .editing-layer-name-icon {
            color: var(--color-text-muted, #9aa4ad);
            font-size: 0.85rem;
            cursor: pointer;
        }
        .editing-layer-name:hover .editing-layer-name-icon,
        .editing-layer-name:focus-within .editing-layer-name-icon {
            color: var(--color-primary, #2b6c8f);
        }
        /* Same check/cross pairing as the attribute rename row's own
           "Save name"/"Cancel rename" buttons, so confirming or discarding
           an edit looks the same everywhere in this panel. Shown only while
           a rename is in progress — the pencil above returns once it's
           confirmed or cancelled. Muted to match the pencil's own resting
           color rather than Shoelace's default (near-black) icon color,
           which read as too heavy for a pair of small inline icons. */
        .editing-layer-name-confirm {
            font-size: 0.85rem;
            flex-shrink: 0;
            color: var(--color-text-muted, #9aa4ad);
        }
        .editing-layer-name-confirm::part(base) {
            padding: 0.1rem;
        }
        .editing-layer-name-confirm[name="check-lg"]:not([disabled])::part(base):hover {
            color: var(--color-primary, #2b6c8f);
        }
        .editing-layer-name-confirm[name="x-lg"]::part(base):hover {
            color: var(--sl-color-danger-600, #dc2626);
        }

        .color-swatch-wrap {
            position: relative;
            width: 22px; height: 22px;
            flex-shrink: 0;
            /* The "Back" row's arrow-icon-button has its glyph inset ~8px
               from the button's own edge; this swatch has no such inset, so
               without this it hangs visibly further left than everything
               above it instead of lining up with it. */
            margin-left: 8px;
        }
        .color-swatch {
            position: absolute;
            inset: 0;
            padding: 0;
            border: 2px solid var(--color-background-secondary, #e2e5e8);
            /* Read-only preview — styling is done from the Legend, not here. */
            pointer-events: none;
        }
        /* Shape echoes the geometry the layer holds, same as .color-dot. */
        .color-swatch--point {
            inset: 5px;
            border-radius: 50%;
        }
        .color-swatch--line {
            top: 50%;
            bottom: auto;
            height: 4px;
            margin-top: -2px;
            border-radius: 2px;
        }
        .color-swatch--polygon {
            border-radius: 4px;
        }

        .prop-table-wrap {
            overflow-x: auto;
            overflow-y: auto;
            max-height: 220px;
            margin-top: 0.4rem;
            border: 1px solid var(--color-background-secondary, #e2e7ec);
            border-radius: 4px;
        }
        /*
         * A CSS Grid, not an HTML table — deliberately. With mixed %/fixed
         * column widths (Type is a percentage, the trash column a fixed
         * 2.4rem) that don't sum to exactly 100%, 'table-layout: fixed'
         * redistributes the leftover space across columns using its own
         * (browser-specific, not simply proportional) algorithm — so a
         * td's *rendered* width stops matching 'width: var(...)' as
         * soon as a sibling column doesn't share that same unit. That
         * silently broke the add-attribute row's alignment below the table
         * (built from the same variables, but as plain flex items, which
         * don't have that redistribution): its width matched the
         * *specified* percentage while the table's own column had already
         * drifted away from it. Grid tracks are used exactly as specified
         * with no redistribution, so both places measure the same way and
         * stay in lockstep.
         */
        .prop-grid {
            display: grid;
            /* minmax(2.4rem, 1fr), not a flat 2.4rem: the first two columns
               are percentages that don't sum to 100% with a fixed-width
               third one, and unlike a table's own redistribution, Grid
               leaves genuinely unused tracks as blank space rather than
               filling the row — this is what absorbs that leftover width
               instead of leaving a bare strip between the table and the
               scrollbar. The icon still sits flush against the right edge
               via .prop-grid-cell--actions' justify-content: flex-end. */
            grid-template-columns: var(--prop-attr-col-width) var(--prop-type-col-width) minmax(2.4rem, 1fr);
            font-size: 0.76rem;
        }
        /* Each row is 'display: contents' — its cells become direct grid
           items (placed into the grid's row/column tracks automatically),
           while the wrapper still exists in the DOM for ':last-child' and
           the per-row auto/muted-row styling below. */
        .prop-grid-row {
            display: contents;
        }
        .prop-grid-cell {
            display: flex;
            align-items: center;
            min-width: 0;
            padding: 0.15rem 0.35rem;
            border-bottom: 1px solid var(--color-background-secondary, #e2e7ec);
        }
        .prop-grid-header .prop-grid-cell {
            font-weight: 600;
            background: var(--color-background-secondary, #f4f6f8);
            position: sticky;
            top: 0;
        }
        .prop-grid-cell--actions {
            padding-left: 0;
            padding-right: 0.2rem;
            justify-content: flex-end;
        }
        .prop-grid-row:last-child .prop-grid-cell { border-bottom: none; }
        .prop-row-auto .prop-grid-cell { color: var(--color-text-muted, #6b7681); font-style: italic; }
        /* The name cell's usual ellipsis/nowrap clipping (on .prop-cell-text)
           is for plain text — while it holds the rename row's input +
           confirm/cancel buttons instead, let it actually show all three
           rather than clipping them. */
        .prop-grid-cell:has(.rename-attr-row) { overflow: visible; }

        /* Plain cell text (the Type column, and the Attribute column outside
           a rename) — truncated on its own inner span rather than the flex
           cell itself, since text-overflow doesn't reliably apply directly
           to a flex container's text content. */
        .prop-cell-text {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* The name, then the rename (pencil) icon pinned to the cell's far
           right edge — right before the Type column starts. */
        .prop-name-cell {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.2rem;
            min-width: 0;
            width: 100%;
        }

        .rename-attr-row {
            display: flex;
            align-items: center;
            gap: 0.15rem;
            width: 100%;
            min-width: 0;
        }
        .rename-attr-row sl-input {
            flex: 1;
            min-width: 0;
        }
        .rename-attr-row sl-input::part(base) {
            font-size: 0.76rem;
        }
        .rename-attr-btn {
            color: var(--color-text-muted, #6b7681);
            flex-shrink: 0;
        }
        .rename-attr-btn::part(base) { padding: 0.15rem; }
        .rename-attr-btn::part(base):hover { color: var(--color-text-primary, #16202a); }

        .remove-attr-btn {
            color: var(--sl-color-danger-600, #c0392b);
            font-size: 1.1rem;
        }
        .remove-attr-btn::part(base) { padding: 0.15rem; }
        .remove-attr-btn::part(base):hover { color: var(--sl-color-danger-700, #a52f22); }

        /* Red only once there's actually something to delete — an always-red
           trash can reads as "something's wrong" before a feature is even
           selected. */
        .delete-feature-btn:not([disabled]) {
            color: var(--sl-color-danger-600, #c0392b);
        }
        .delete-feature-btn:not([disabled])::part(base):hover {
            color: var(--sl-color-danger-700, #a52f22);
        }

        /* Shoelace's own body padding otherwise leaves a visible gap between
         * the dialog's title and this content — the table (or the undo/redo
         * row above it) sits right under the header instead. Left/right/
         * bottom padding are untouched. */
        #attributes-dialog::part(body) {
            padding-top: 0;
        }

        /* Shoelace's own footer is plain 'text-align: right', packing
         * everything slotted into it against the right edge — this spreads
         * "Optional attributes" to the left instead, lined up with the "Add
         * attribute" button above it (both start at the same left inset,
         * since --footer-spacing and --body-spacing match), while "Done"
         * stays on the right. */
        #attributes-dialog::part(footer) {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .add-attr-form {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            margin-top: 0.5rem;
        }
        /* Kept unpadded/unbordered (unlike a typical form box) so the name
         * input and type select below resolve their column-matching widths
         * against the same reference as the table and the "Add attribute"
         * button — a wrapping box here would shrink that reference by its
         * own padding and throw the alignment off. A small gap separates
         * the input and select themselves (and the select from the cancel
         * icon) — flush against each other their focus rings visibly
         * overlapped. */
        .add-attr-fields-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        /* Same width as the table's Attribute column, matching the "Add
         * attribute" button this replaces — so typing a name doesn't shift
         * anything, it just continues in the same slot. */
        .add-attr-name-input {
            flex: 0 0 var(--prop-attr-col-width);
            min-width: 0;
        }
        /* Appears once a name is typed, close to the name input, in the
         * Type column's own slot right next to it — the second step of
         * "name, then type" laid out the same way the table itself pairs an
         * attribute with its type. */
        .add-attr-type-select {
            flex: 0 0 var(--prop-type-col-width);
            min-width: 0;
        }
        /* Shoelace sizes the select's own closed-state text ("Choose a type")
         * from --sl-input-font-size-small, but sl-option hardcodes
         * --sl-font-size-medium internally regardless of the select's own
         * size — plain font-size can't reach through that, only overriding
         * the same custom property it reads (which, being a custom
         * property, still cascades through the shadow boundary). Otherwise
         * the opened list is noticeably larger than the placeholder that
         * opened it. */
        .add-attr-type-select sl-option {
            --sl-font-size-medium: var(--sl-font-size-small, 0.875rem);
        }
        /* "Add attribute" on the left, undo/redo on the right — one row,
         * not two, so the undo/redo pair doesn't cost the dialog a whole
         * extra line whenever there's nothing to add yet. */
        .add-attr-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 0.5rem;
        }
        /* Same width as the table's Attribute column (--prop-attr-col-width)
         * — it's where a newly added row will land, right under that column. */
        .add-attr-btn-below {
            width: var(--prop-attr-col-width);
            flex-shrink: 0;
        }
        /* Undo/redo move here — one row below the add-attribute form — while
         * it's open, since the button they'd otherwise share a row with is
         * replaced by the form itself. Still right-aligned. */
        .add-attr-undo-row {
            display: flex;
            justify-content: flex-end;
        }
        /* Keeps the undo/redo icons themselves next to each other — see
         * renderAttributeUndoRedo for why this can't just be a gap on the
         * row that also holds the "Add attribute" button. */
        .add-attr-undo-group {
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }
        /* Matches the "Add attribute" button's width, since it sits directly
         * below it (left-aligned in the footer — see ::part(footer) above).
         * The width has to go on the dropdown itself, not just the trigger
         * button: sl-dropdown's :host is shrink-to-fit (inline-block, no
         * explicit width), and a percentage width on a descendant of a
         * shrink-to-fit box can't resolve (the container's own size would
         * depend on it) — it silently falls back to the button's natural
         * content width instead. Giving the dropdown itself a definite
         * width breaks that, and the trigger just fills it at 100%. */
        .optional-attrs-dropdown {
            width: var(--prop-attr-col-width);
        }
        .optional-attrs-trigger {
            width: 100%;
        }
        .auto-attr-dropdown-panel {
            display: flex;
            flex-direction: column;
            gap: 0.45rem;
            padding: 0.6rem 0.7rem;
            background: var(--sl-panel-background-color, #fff);
            border: 1px solid var(--color-background-secondary, #e2e7ec);
            border-radius: 6px;
            box-shadow: var(--sl-shadow-medium);
        }
        .auto-attr-checkbox {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.82rem;
            cursor: pointer;
            white-space: nowrap;
        }
        /* A plain checkbox otherwise renders in the browser's own default
         * accent color, not the app's theme blue — accent-color is the
         * standards-based way to recolor native form controls without
         * rebuilding the checkbox from scratch. */
        .auto-attr-checkbox input[type="checkbox"] {
            accent-color: var(--color-primary, #2b6c8f);
        }
        .add-attr-note {
            font-size: 0.72rem;
            color: var(--color-text-muted, #6b7681);
            margin-top: 0.1rem;
        }
        .features-section {
            margin-top: 0.25rem;
            max-height: 180px;
            overflow-y: auto;
        }

        .feature-row {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.2rem 0.6rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.82rem;
        }

        .feature-row:hover { background: var(--color-background-secondary, #f4f6f8); }
        .feature-row.selected { background: var(--color-primary-soft, rgba(43, 108, 143, 0.12)); }

        .divider {
            width: 1px; height: 1.2rem;
            background: var(--color-background-secondary, #f4f6f8);
            margin: 0 0.1rem;
        }

        .prop-row { display: flex; gap: 0.4rem; align-items: center; font-size: 0.82rem; margin-bottom: 0.2rem; }
        .prop-label { width: 80px; color: var(--color-text-muted, #6b7681); flex-shrink: 0; }
        .prop-value { flex: 1; min-width: 0; }
        .prop-link { display: block; width: 100%; font-size: 0.75rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .prop-img { max-width: 100%; max-height: 80px; border-radius: 3px; object-fit: cover; }
        .prop-img-error { font-size: 0.75rem; color: var(--sl-color-danger-600, #c0392b); font-style: italic; }
        .prop-url-wrap { flex: 1; min-width: 0; overflow: hidden; display: flex; flex-direction: column; gap: 0.2rem; }
    `;
	}
	onActivate() {
		if (this.adapter?.store.getState().mapLoaded ? this.createSharedLayers() : this.unsubMapLoaded = this.adapter?.store.subscribe((e) => {
			e.mapLoaded && (this.unsubMapLoaded?.(), this.unsubMapLoaded = null, this.createSharedLayers());
		}) ?? null, this.adapter) {
			for (let e of this.ownsPermLayer) this.confirmedRestingLayerIds.add(e);
			this.reconcileExternallyDeletedLayers(this.adapter.store.getState()), this.unsubMapLayers = this.adapter.store.subscribe((e) => this.reconcileExternallyDeletedLayers(e));
		}
		for (let e of this.drawLayers) this.pausedLayerIds.has(e.id) || this.resumeDrawLayer(e);
		for (let e of [
			P,
			I,
			V,
			U,
			W,
			G,
			K,
			J,
			Y,
			H
		]) this.dispatchEvent(new CustomEvent("webmapx-suppress-busy-for-source", {
			detail: e,
			bubbles: !0,
			composed: !0
		}));
		this.bindEvents(), window.addEventListener("keydown", this.onKeyDown, !0), window.addEventListener("keyup", this.onKeyUp), window.addEventListener("blur", this.onWindowBlur), this.boundMap?.addEventListener("webmapx-draw-finish-editing", this.onFinishEditingRequest), this.setModeInternal("select"), this.refreshTypeCatalogCounts();
	}
	onDeactivate() {
		this.unsubMapLoaded?.(), this.unsubMapLoaded = null, this.unsubMapLayers?.(), this.unsubMapLayers = null;
		for (let e of [
			P,
			I,
			V,
			U,
			W,
			G,
			K,
			J,
			Y,
			H
		]) this.dispatchEvent(new CustomEvent("webmapx-unsuppress-busy-for-source", {
			detail: e,
			bubbles: !0,
			composed: !0
		}));
		this.moveRafId !== null && (cancelAnimationFrame(this.moveRafId), this.moveRafId = null);
		for (let [, e] of this.pendingSourceRefresh) cancelAnimationFrame(e);
		this.pendingSourceRefresh.clear(), this.pendingMoveEvent = null, this.unbindEvents(), window.removeEventListener("keydown", this.onKeyDown, !0), window.removeEventListener("keyup", this.onKeyUp), window.removeEventListener("blur", this.onWindowBlur), this.boundMap?.removeEventListener("webmapx-draw-finish-editing", this.onFinishEditingRequest), this.altActive = !1;
		for (let e of this.drawLayers) e.borrowedSourceId && this.restoreBorrowedLayer(e), this.suspendDrawLayerFromMap(e);
		this.draftPoints = [], this.circleDraft = null, this.rectDraft = null, this.rectSelectDraft = null, this.lassoSelectDraft = null, this.cursorPos = null, this.snapPos = null, this.lastCursorPx = null, this.dragging = null, this.featureDrag = null, this.selectedFeatureId = null, this.selectedFeatureIds = [], this.editState = "none", this.editHandles = [], this.adapter?.setPanEnabled(!0), this.adapter?.setDoubleClickZoomEnabled(!0), this.updateSelectedSource(), this.removeSharedLayers(), this.adapter?.setCursor("");
	}
	disconnectedCallback() {
		this.touchMQ.removeEventListener("change", this.onTouchMQChange), this.unsubMapLayers?.(), this.unsubMapLayers = null, super.disconnectedCallback();
	}
	updated(e) {
		if (super.updated(e), e.has("drawLayers")) for (let e of this.drawLayers) this.syncLayerPropertiesToStore(e.id, e.properties);
	}
	onMapAttached(e) {
		this.boundMap = this.mapHost, super.onMapAttached(e);
	}
	onMapDetached() {
		this.removeAllMapLayers(), super.onMapDetached(), this.boundMap = null;
	}
	createSharedLayers() {
		if (!this.sharedLayersCreated) {
			this.dispatch("webmapx-add-source", {
				id: P,
				config: {
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: []
					}
				}
			}), this.dispatch("webmapx-add-source", {
				id: I,
				config: {
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: []
					}
				}
			}), this.dispatch("webmapx-add-layer", {
				id: F,
				type: "line",
				source: P,
				metadata: {
					isToolLayer: !0,
					hideFromLegend: !0
				},
				paint: {
					"line-color": y,
					"line-width": 2
				}
			}), this.dispatch("webmapx-add-layer", {
				id: Ot,
				type: "circle",
				source: I,
				metadata: {
					isToolLayer: !0,
					hideFromLegend: !0
				},
				paint: {
					"circle-radius": 8,
					"circle-color": "transparent",
					"circle-stroke-width": 2,
					"circle-stroke-color": "#ff6600"
				}
			}), this.dispatch("webmapx-add-source", {
				id: H,
				config: {
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: []
					}
				}
			}), this.dispatch("webmapx-add-layer", {
				id: Pt,
				type: "circle",
				source: H,
				metadata: {
					isToolLayer: !0,
					hideFromLegend: !0
				},
				paint: {
					"circle-radius": 4,
					"circle-color": ["get", "color"]
				}
			}), this.dispatch("webmapx-add-source", {
				id: V,
				config: {
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: []
					}
				}
			}), this.dispatch("webmapx-add-layer", {
				id: Nt,
				type: "circle",
				source: V,
				metadata: {
					isToolLayer: !0,
					hideFromLegend: !0
				},
				paint: {
					"circle-radius": 5,
					"circle-color": be,
					"circle-stroke-width": 2,
					"circle-stroke-color": y
				}
			}), this.dispatch("webmapx-add-source", {
				id: U,
				config: {
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: []
					}
				}
			}), this.dispatch("webmapx-add-layer", {
				id: Ft,
				type: "circle",
				source: U,
				metadata: {
					isToolLayer: !0,
					hideFromLegend: !0
				},
				paint: {
					"circle-radius": 6,
					"circle-color": be,
					"circle-stroke-width": 2,
					"circle-stroke-color": y
				}
			}), this.dispatch("webmapx-add-source", {
				id: W,
				config: {
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: []
					}
				}
			}), this.dispatch("webmapx-add-layer", {
				id: It,
				type: "circle",
				source: W,
				metadata: {
					isToolLayer: !0,
					hideFromLegend: !0
				},
				paint: {
					"circle-radius": 4,
					"circle-color": be,
					"circle-stroke-width": 1.5,
					"circle-stroke-color": y,
					"circle-opacity": .7
				}
			}), this.dispatch("webmapx-add-source", {
				id: G,
				config: {
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: []
					}
				}
			}), this.dispatch("webmapx-add-layer", {
				id: Lt,
				type: "circle",
				source: G,
				metadata: {
					isToolLayer: !0,
					hideFromLegend: !0
				},
				paint: {
					"circle-radius": Mt,
					"circle-color": this.cssVar("--webmapx-draw-selected-color", jt),
					"circle-stroke-width": 2,
					"circle-stroke-color": "#fff"
				}
			}), this.dispatch("webmapx-add-source", {
				id: K,
				config: {
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: []
					}
				}
			}), this.dispatch("webmapx-add-layer", {
				id: zt,
				type: "circle",
				source: K,
				metadata: {
					isToolLayer: !0,
					hideFromLegend: !0
				},
				paint: {
					"circle-radius": 7,
					"circle-color": "#ffdd00",
					"circle-stroke-width": 2,
					"circle-stroke-color": "#fff",
					"circle-opacity": .9
				}
			}), this.dispatch("webmapx-add-source", {
				id: J,
				config: {
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: []
					}
				}
			}), this.dispatch("webmapx-add-layer", {
				id: Vt,
				type: "fill",
				source: J,
				metadata: {
					isToolLayer: !0,
					hideFromLegend: !0
				},
				paint: {
					"fill-color": y,
					"fill-opacity": .12
				}
			}), this.dispatch("webmapx-add-layer", {
				id: Ht,
				type: "line",
				source: J,
				metadata: {
					isToolLayer: !0,
					hideFromLegend: !0
				},
				paint: {
					"line-color": y,
					"line-width": 1.5,
					"line-dasharray": [2, 2]
				}
			}), this.dispatch("webmapx-add-source", {
				id: Y,
				config: {
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: []
					}
				}
			}), this.dispatch("webmapx-add-layer", {
				id: Ut,
				type: "circle",
				source: Y,
				metadata: {
					isToolLayer: !0,
					hideFromLegend: !0
				},
				paint: {
					"circle-radius": Mt,
					"circle-color": jt,
					"circle-opacity": .8
				}
			}), this.sharedLayersCreated = !0;
			for (let e of this.drawLayers) this.pausedLayerIds.has(e.id) || (this.addMapLayersForDrawLayer(e), this.refreshDrawLayerSource(e.id));
		}
	}
	addMapLayersForDrawLayer(e) {
		this.createdDrawLayerIds.has(e.id) || (e.type === "Point" && this.dispatch("webmapx-add-source", {
			id: z(e.id, e.type),
			config: {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: []
				}
			}
		}), this.dispatch("webmapx-add-layer", {
			...kt(e.id, e, this.currentDrawLayerColor(e), {
				label: e.name,
				legendRole: "overlay",
				hideFromLegend: !0
			}),
			beforeLayerId: F
		}), this.createdDrawLayerIds.add(e.id));
	}
	removeMapLayersForDrawLayer(e) {
		this.dispatch("webmapx-remove-layer", e.id), this.dispatch("webmapx-remove-source", z(e.id, e.type)), this.adapter?.store && Ee(this.adapter.store, e.id), this.createdDrawLayerIds.delete(e.id);
	}
	removeSharedLayers() {
		for (let e of [
			F,
			Ot,
			Nt,
			Ft,
			It,
			Lt,
			zt,
			Vt,
			Ht,
			Ut,
			Pt
		]) this.dispatch("webmapx-remove-layer", e);
		for (let e of [
			P,
			I,
			V,
			U,
			W,
			G,
			K,
			J,
			Y,
			H
		]) this.dispatch("webmapx-remove-source", e);
		this.sharedLayersCreated = !1;
	}
	removeAllMapLayers() {
		this.removeSharedLayers();
		for (let e of this.drawLayers) this.removeMapLayersForDrawLayer(e);
		this.createdDrawLayerIds.clear();
	}
	refreshDrawLayerSource(e) {
		this.pendingSourceRefresh.has(e) || this.pendingSourceRefresh.set(e, requestAnimationFrame(() => {
			this.pendingSourceRefresh.delete(e), this.flushDrawLayerSource(e);
		}));
	}
	outgoingProperties(e) {
		return Zt(e.type) ? {
			...e.properties,
			__dashed: e.dashed === !0
		} : e.properties;
	}
	flushDrawLayerSource(e) {
		let t = this.features.filter((t) => t.layerId === e).map((e) => ({
			type: "Feature",
			id: e.id,
			geometry: {
				type: e.type,
				coordinates: e.coordinates
			},
			properties: this.outgoingProperties(e)
		})), n = this.drawLayers.find((t) => t.id === e)?.type ?? "Polygon";
		this.dispatch("webmapx-set-source-data", {
			id: z(e, n),
			data: {
				type: "FeatureCollection",
				features: t
			}
		});
		let r = this.drawLayers.find((t) => t.id === e);
		if (r?.borrowedSourceId && this.adapter?.store) {
			let e = {
				type: "FeatureCollection",
				features: t
			};
			this.setBorrowedLayerMetadata(r.borrowedSourceId, { sourceData: e });
		}
	}
	setBorrowedLayerMetadata(e, t) {
		if (!this.adapter?.store) return;
		let n = this.adapter.store.getState().mapLayers ?? {}, [r, i] = Object.entries(n).find(([, t]) => t.sourceId === e) ?? [];
		r && i && this.adapter.store.dispatch({ mapLayers: {
			...n,
			[r]: {
				...i,
				...t
			}
		} }, "MAP");
	}
	cssVar(e, t) {
		return getComputedStyle(this).getPropertyValue(e).trim() || t;
	}
	get modKey() {
		return /Mac|iPhone|iPad/.test(navigator.platform) ? "Cmd" : "Ctrl";
	}
	isTypingTarget(e) {
		let t = e.composedPath()[0], n = t?.tagName?.toLowerCase();
		return n === "input" || n === "textarea" || n === "sl-input" || n === "sl-textarea" || t?.isContentEditable === !0;
	}
	isRelevantTarget(e) {
		let t = e.composedPath(), n = this.mapHost;
		if (t.includes(this) || n && t.includes(n)) return !0;
		let r = t[0];
		return r === document.body || r === document.documentElement;
	}
	bindEvents() {
		this.adapter && (this.unsubClick = this.adapter.events.on("click", (e) => this.handleClick(e)), this.unsubMove = this.adapter.events.on("pointer-move", (e) => {
			this.pendingMoveEvent = e, this.moveRafId === null && (this.moveRafId = requestAnimationFrame(() => {
				this.moveRafId = null, this.pendingMoveEvent && this.handlePointerMove(this.pendingMoveEvent), this.pendingMoveEvent = null;
			}));
		}), this.unsubCtx = this.adapter.events.on("contextmenu", (e) => this.handleContextMenu(e)), this.unsubDown = this.adapter.events.on("pointer-down", (e) => this.handlePointerDown(e)), this.unsubUp = this.adapter.events.on("pointer-up", (e) => this.handlePointerUp(e)), this.unsubLeave = this.adapter.events.on("pointer-leave", () => this.handlePointerLeave()));
	}
	unbindEvents() {
		this.unsubClick?.(), this.unsubClick = null, this.unsubMove?.(), this.unsubMove = null, this.unsubCtx?.(), this.unsubCtx = null, this.unsubDown?.(), this.unsubDown = null, this.unsubUp?.(), this.unsubUp = null, this.unsubLeave?.(), this.unsubLeave = null;
	}
	nextDefaultLayerName(e) {
		let t = new Set(this.drawLayers.filter((t) => t.type === e).map((e) => e.name));
		if (!t.has(L)) return L;
		let n = 2;
		for (; t.has(`${L} (${n})`);) n++;
		return `${L} (${n})`;
	}
	async createNewLayer() {
		let e = this.pickedType;
		e && (await this.applyLayerConfig({
			...M(e),
			name: this.nextDefaultLayerName(e)
		}), this.active && (this.setModeInternal(Z(e)), await this.updateComplete, this.editingLayerNameInput?.select()));
	}
	async getEditableMapLayers(e) {
		if (!this.adapter) return [];
		let t = this.adapter.store.getState().mapLayers ?? {}, n = /* @__PURE__ */ new Set(), r = [], i = new Set(this.drawLayers.map((e) => B(e.id)));
		for (let [a, o] of Object.entries(t)) {
			if (o.isToolLayer || this.createdDrawLayerIds.has(a) || i.has(a)) continue;
			let t = typeof o.sourceId == "string" ? o.sourceId : null;
			if (!t || n.has(t)) continue;
			let s = this.adapter.getSourceData(t);
			if (!s) continue;
			let c = await this.resolveFeatureCollection(s);
			if (typeof s == "string") {
				let i = c?.features[0]?.geometry?.type, s = i ? this.geometryFamilyForGeoJSONType(i) : null, l = this.geometryFamilyForLayerType(o.layerType);
				if ((s ?? l) !== e) continue;
				n.add(t), r.push({
					layerId: a,
					sourceId: t,
					label: o.label ?? a,
					properties: o.properties ?? (c ? this.inferPropertyDefs(c) : void 0),
					allowedAttributes: o.attributes?.allowedAttributes ?? void 0
				});
				continue;
			}
			let l = s.features[0]?.geometry?.type, u = l ? this.geometryFamilyForGeoJSONType(l) : null, d = this.geometryFamilyForLayerType(o.layerType);
			(u ?? d) === e && (n.add(t), r.push({
				layerId: a,
				sourceId: t,
				label: o.label ?? a,
				properties: o.properties ?? this.inferPropertyDefs(s),
				allowedAttributes: o.attributes?.allowedAttributes ?? void 0
			}));
		}
		return r;
	}
	async resolveFeatureCollection(e) {
		if (typeof e != "string") return e;
		try {
			let t = await fetch(e);
			return t.ok ? await t.json() : null;
		} catch {
			return null;
		}
	}
	geometryFamilyForGeoJSONType(e) {
		return e === "Point" || e === "MultiPoint" ? "Point" : e === "LineString" || e === "MultiLineString" ? "LineString" : e === "Polygon" || e === "MultiPolygon" ? "Polygon" : null;
	}
	geometryFamilyForLayerType(e) {
		return e === "circle" ? "Point" : e === "line" ? "LineString" : e === "fill" ? "Polygon" : null;
	}
	inferPropertyDefs(e) {
		let t = e.features.find((e) => e.properties && Object.keys(e.properties).length > 0)?.properties;
		return t ? Object.entries(t).filter(([e]) => !e.startsWith("__")).map(([e, t]) => ({
			name: e,
			type: typeof t == "number" ? "number" : "string"
		})) : [{
			name: "id",
			type: "number"
		}, {
			name: "name",
			type: "string"
		}];
	}
	isSelectMode(e = this.mode) {
		return e === "select" || e === "select-rect" || e === "select-lasso";
	}
	isEditMode(e = this.mode) {
		return e === "edit-move" || e === "edit-vertices";
	}
	isDrawMode(e = this.mode) {
		return e === "draw-point" || e === "draw-line" || e === "draw-line-dashed" || e === "draw-polygon" || e === "draw-circle" || e === "draw-rectangle";
	}
	isSingleFeatureFocusMode(e = this.mode) {
		return e === "edit-move" || e === "edit-vertices" || e === "attributes";
	}
	carriesFocusInto(e) {
		return this.isSingleFeatureFocusMode(e) || this.isDrawMode(e) && this.selectedFeatureId !== null;
	}
	setModeInternal(e) {
		this.circleDraft && (this.circleDraft = null, this.adapter?.setPanEnabled(!0)), this.rectDraft && (this.rectDraft = null, this.adapter?.setPanEnabled(!0)), this.rectSelectDraft && (this.rectSelectDraft = null, this.updateMarquee(null), this.adapter?.setPanEnabled(!0)), this.lassoSelectDraft && (this.lassoSelectDraft = null, this.updateMarquee(null), this.adapter?.setPanEnabled(!0));
		let t = this.mode;
		switch (this.mode = e, this.draftPoints = [], this.cursorPos = null, this.snapPos = null, this.lastCursorPx = null, this.updateRubberband(), this.isDrawMode(t) && !this.isDrawMode(e) && (this.drawHistory = [], this.drawHistoryIndex = -1, this.draftRedoStack = []), e) {
			case "select":
			case "select-rect":
			case "select-lasso":
				this.adapter?.setDoubleClickZoomEnabled(!0), this.adapter?.setCursor(e === "select" ? "" : "crosshair"), this.isSelectMode(t) || (this.selectedFeatureId = null, this.selectedFeatureIds = [], this.hoveredFeatureId = null, this.editState = "none", this.editHandles = [], this.updateSelectedSource(), this.updateMultiSelectSource(), this.updateEditHandles()), this.helpText = e === "select" ? "Click a feature to delete it." : e === "select-rect" ? "Drag a rectangle to delete the features inside it." : "Draw a free-hand shape to delete the features inside it.";
				break;
			case "attributes":
				this.adapter?.setDoubleClickZoomEnabled(!0), this.adapter?.setCursor(""), this.carriesFocusInto(t) || (this.selectedFeatureId = null), this.selectedFeatureIds = this.selectedFeatureId ? [this.selectedFeatureId] : [], this.hoveredFeatureId = null, this.editState = "none", this.editHandles = [], this.updateSelectedSource(), this.updateMultiSelectSource(), this.updateEditHandles(), this.helpText = "Hover a feature to preview it, then click to view or edit its attributes.", this.selectedFeatureId && this.updateComplete.then(() => this.focusFirstAttributeValueInput());
				break;
			case "edit-move":
			case "edit-vertices": {
				this.adapter?.setDoubleClickZoomEnabled(!0), this.adapter?.setCursor(""), this.carriesFocusInto(t) || (this.selectedFeatureId = null), this.selectedFeatureIds = [], this.hoveredFeatureId = null, this.editHandles = [];
				let n = this.selectedFeatureId ? this.features.find((e) => e.id === this.selectedFeatureId) : null;
				this.editState = n ? e === "edit-vertices" ? "editing" : $(n.type) ? "none" : "selected" : "none", this.updateSelectedSource(), this.updateMultiSelectSource(), this.updateEditHandles(), this.helpText = e === "edit-move" ? "Click a feature to select it, or drag it directly to move it." : "Click a feature to edit its points — drag one to reshape it, or select one and press Delete to remove it.";
				break;
			}
			case "draw-point":
			case "draw-line":
			case "draw-line-dashed":
			case "draw-polygon":
			case "draw-circle":
			case "draw-rectangle":
				this.adapter?.setDoubleClickZoomEnabled(!1), this.editState = "none", this.editHandles = [], this.selectedFeatureId = null, this.selectedFeatureIds = [], this.updateEditHandles(), this.updateSelectedSource(), this.updateMultiSelectSource(), this.adapter?.setCursor("crosshair"), this.helpText = this.mode === "draw-point" ? "Click to place a point." : this.mode === "draw-line" || this.mode === "draw-line-dashed" ? "Click to add vertices. Right-click or double-click to finish." : this.mode === "draw-circle" ? "Click and drag to draw a circle." : this.mode === "draw-rectangle" ? "Click and drag to draw a rectangle." : "Click to add vertices. Click first point or double-click to close.";
				break;
		}
	}
	async applyLayerConfig(e, t) {
		let n = e, r = this.activeLayerIds[n.type];
		if (r && r !== n.id) {
			let e = this.drawLayers.find((e) => e.id === r);
			e && this.pauseDrawLayer(e);
		}
		let i = this.drawLayers.findIndex((e) => e.id === n.id);
		if (i >= 0) this.drawLayers = this.drawLayers.map((e, t) => t === i ? n : e);
		else if (n.borrowedSourceId || (n = {
			...n,
			borrowedSourceId: this.createPermLayer(n)
		}, this.ownsPermLayer.add(n.id)), this.drawLayers = [...this.drawLayers, n], this.addMapLayersForDrawLayer(n), n.borrowedSourceId && this.adapter) {
			let e = t ?? this.adapter.getSourceData(n.borrowedSourceId), r = e ? await this.resolveFeatureCollection(e) : null;
			if (r) {
				let e = [];
				for (let t of r.features) {
					if (!t.geometry || !Xt(t.geometry.type)) continue;
					let r = { ...t.properties }, i = r.__dashed === !0;
					delete r.__dashed, e.push({
						id: this.newId(),
						layerId: n.id,
						type: t.geometry.type,
						coordinates: t.geometry.coordinates,
						properties: r,
						dashed: i
					});
				}
				if (this.features = [...this.features, ...e], n.properties.length <= 2) {
					let e = this.inferPropertyDefs(r);
					n = {
						...n,
						properties: e
					}, this.drawLayers = this.drawLayers.map((e) => e.id === n.id ? n : e);
				}
			}
			this.active ? (this.adapter.getSource(n.borrowedSourceId)?.setData({
				type: "FeatureCollection",
				features: []
			}), this.setBorrowedLayerMetadata(n.borrowedSourceId, { borrowedByDrawTool: !0 })) : this.restoreBorrowedLayer(n);
		}
		this.activeLayerIds[n.type] = n.id, this.refreshDrawLayerSource(n.id), this.syncLayerPropertiesToStore(n.id, n.properties), this.pendingMode &&= (this.active && this.setModeInternal(this.pendingMode), null), this.pickedType = n.type, this.panelView = "editing", this.addingAttribute = !1, this.newAttrName = "", this.newAttrType = "", this.layerNameInvalid = !1, this.layerNameDraft = null, this.removedAttributeStack = [], this.removedAttributeRedoStack = [], this.cancelRenameAttribute();
	}
	restoreBorrowedLayer(e) {
		if (!e.borrowedSourceId || !this.adapter) return;
		let t = {
			type: "FeatureCollection",
			features: this.features.filter((t) => t.layerId === e.id).map((e) => ({
				type: "Feature",
				geometry: {
					type: e.type,
					coordinates: e.coordinates
				},
				properties: this.outgoingProperties(e)
			}))
		};
		this.adapter.getSource(e.borrowedSourceId)?.setData(t), this.setBorrowedLayerMetadata(e.borrowedSourceId, {
			borrowedByDrawTool: !1,
			sourceData: t
		});
	}
	createPermLayer(e) {
		let t = B(e.id);
		return e.type === "Point" && this.dispatch("webmapx-add-source", {
			id: z(t, e.type),
			config: {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: []
				}
			}
		}), this.dispatch("webmapx-add-layer", {
			...kt(t, e, e.color, {
				label: e.name,
				legendRole: "overlay",
				properties: e.properties,
				borrowedByDrawTool: !0,
				hideFromLegend: Jt(e.name)
			}),
			beforeLayerId: F
		}), z(t, e.type);
	}
	releaseBorrowedLayer(e) {
		if (e.borrowedSourceId) {
			this.restoreBorrowedLayer(e), this.removeMapLayersForDrawLayer(e), this.features = this.features.filter((t) => t.layerId !== e.id), this.drawLayers = this.drawLayers.filter((t) => t.id !== e.id);
			for (let [t, n] of Object.entries(this.activeLayerIds)) n === e.id && delete this.activeLayerIds[t];
		}
	}
	suspendDrawLayerFromMap(e) {
		this.dispatch("webmapx-remove-layer", e.id), this.dispatch("webmapx-remove-source", z(e.id, e.type)), this.adapter?.store && Ee(this.adapter.store, e.id), this.createdDrawLayerIds.delete(e.id);
	}
	releaseLayer(e) {
		this.ownsPermLayer.has(e.id) && this.removePermLayer(e), this.releaseBorrowedLayer(e), this.pausedLayerIds.delete(e.id), this.ownsPermLayer.delete(e.id), this.confirmedRestingLayerIds.delete(e.id), this.refreshCatalogLayerOptions(), this.refreshTypeCatalogCounts();
	}
	removePermLayer(e) {
		let t = B(e.id);
		this.dispatch("webmapx-remove-layer", t), this.dispatch("webmapx-remove-source", z(t, e.type)), this.adapter?.store && Ee(this.adapter.store, t);
	}
	pauseDrawLayer(e) {
		e.borrowedSourceId && this.restoreBorrowedLayer(e), this.suspendDrawLayerFromMap(e), this.pausedLayerIds.add(e.id);
	}
	resumeDrawLayer(e) {
		this.pausedLayerIds.delete(e.id), this.createdDrawLayerIds.has(e.id) || (this.addMapLayersForDrawLayer(e), this.refreshDrawLayerSource(e.id)), e.borrowedSourceId && this.adapter && (this.adapter.getSource(e.borrowedSourceId)?.setData({
			type: "FeatureCollection",
			features: []
		}), this.setBorrowedLayerMetadata(e.borrowedSourceId, { borrowedByDrawTool: !0 }));
	}
	reconcileExternallyDeletedLayers(e) {
		let t = e.mapLayers ?? {};
		for (let e of [...this.drawLayers]) if (this.ownsPermLayer.has(e.id)) {
			if (t[B(e.id)]) {
				this.confirmedRestingLayerIds.add(e.id);
				continue;
			}
			this.confirmedRestingLayerIds.has(e.id) && this.handleExternallyDeletedLayer(e);
		}
		let n = Object.keys(t).sort().join(",");
		n !== this.lastMapLayerIdsKey && (this.lastMapLayerIdsKey = n, this.refreshCatalogLayerOptions(), this.refreshTypeCatalogCounts());
	}
	handleExternallyDeletedLayer(e) {
		let t = this.panelView === "editing" && this.pickedType === e.type && this.activeLayerIds[e.type] === e.id;
		this.releaseLayer(e), t && (this.selectedFeatureId = null, this.setModeInternal("select"), this.panelView = "layers");
	}
	selectType(e) {
		this.pickedType = e, this.panelView = "layers", this.refreshCatalogLayerOptions();
	}
	async refreshTypeCatalogCounts() {
		if (!this.adapter) {
			this.catalogLayerCounts = {};
			return;
		}
		let e = [
			"Point",
			"LineString",
			"Polygon"
		], t = await Promise.all(e.map((e) => this.getEditableMapLayers(e))), n = {};
		e.forEach((e, r) => {
			n[e] = t[r].length;
		}), this.catalogLayerCounts = n;
	}
	async refreshCatalogLayerOptions() {
		let e = this.pickedType;
		if (!e || !this.adapter) {
			this.catalogLayerOptions = [];
			return;
		}
		let t = await this.getEditableMapLayers(e);
		this.pickedType === e && (this.catalogLayerOptions = t);
	}
	cancelEditCatalogLayer() {
		this.pendingCatalogEditOption = null;
	}
	startEditingCatalogLayer(e) {
		if (this.pendingCatalogEditOption = null, !this.pickedType || !this.adapter) return;
		let t = this.pickedType, n = M(t), r = {
			...n,
			name: `Copy of ${e.label}`,
			properties: e.properties?.map((e) => ({ ...e })) ?? n.properties
		}, i = this.adapter.getSourceData(e.sourceId) ?? void 0;
		this.adapter.setLayerVisibility(e.layerId, !1), this.pendingMode = "select", this.applyLayerConfig(r, i);
	}
	startEditingLayer(e) {
		this.resumeDrawLayer(e), this.activeLayerIds[e.type] = e.id, this.pickedType = e.type, this.setModeInternal("select"), this.panelView = "editing", this.addingAttribute = !1, this.newAttrName = "", this.newAttrType = "", this.layerNameInvalid = !1, this.layerNameDraft = null, this.removedAttributeStack = [], this.removedAttributeRedoStack = [], this.cancelRenameAttribute();
	}
	stopEditingCurrent() {
		if (!this.pickedType) return;
		let e = this.activeLayerIds[this.pickedType], t = e ? this.drawLayers.find((t) => t.id === e) : void 0;
		this.selectedFeatureId = null, this.setModeInternal("select"), this.updateSelectedSource(), t && this.pauseDrawLayer(t), delete this.activeLayerIds[this.pickedType], this.panelView = "layers", this.refreshCatalogLayerOptions(), this.refreshTypeCatalogCounts();
	}
	confirmDone() {
		let e = this.pickedType, t = e ? this.activeLayerIds[e] : void 0, n = t ? this.drawLayers.find((e) => e.id === t) : void 0;
		if (n && this.layerNameDraft !== null && (this.commitLayerNameEdit(n), n = this.drawLayers.find((e) => e.id === t)), n && Jt(n.name)) {
			this.layerNameInvalid = !0, this.editingLayerNameInput?.select();
			return;
		}
		this.layerNameInvalid = !1, this.showDrawIntro = !1, this.stopEditingCurrent();
	}
	focusFirstAttributeValueInput() {
		let e = this.shadowRoot?.querySelectorAll(".prop-row sl-input");
		if (!e || e.length === 0) return;
		let t = Array.from(e).find((e) => !e.value), n = this.lastFocusedAttributeName ? Array.from(e).find((e) => e.closest(".prop-row")?.dataset.attrName === this.lastFocusedAttributeName) : void 0, r = t ?? n ?? e[0];
		r.focus(), this.lastFocusedAttributeName = r.closest(".prop-row")?.dataset.attrName ?? null;
	}
	updateActiveLayerName(e, t) {
		let n = t.trim();
		if (!n || n === e.name) return;
		let r = Jt(e.name) && this.ownsPermLayer.has(e.id);
		this.drawLayers = this.drawLayers.map((t) => t.id === e.id ? {
			...t,
			name: n
		} : t), this.layerNameInvalid = !1, e.borrowedSourceId && this.setBorrowedLayerMetadata(e.borrowedSourceId, {
			label: n,
			...r ? { hideFromLegend: !1 } : {}
		}), r && (this.dispatch("webmapx-tool-select", {
			toolId: "layerOverview",
			previousToolId: null
		}), this.setModeInternal(Z(e.type)));
	}
	layerNameDraftValid() {
		return (this.layerNameDraft ?? "").trim().length > 0;
	}
	commitLayerNameEdit(e) {
		this.layerNameDraft === null || !this.layerNameDraftValid() || (this.updateActiveLayerName(e, this.layerNameDraft), this.layerNameDraft = null);
	}
	cancelLayerNameEdit() {
		this.layerNameDraft = null;
	}
	currentDrawLayerColor(e) {
		let t = this.adapter?.store.getState().mapLayers?.[B(e.id)];
		if (!t) return e.color;
		if (e.type === "Point") {
			let n = t.paint?.["circle-color"];
			return typeof n == "string" ? n : e.color;
		}
		let n = B(e.id), r = e.type === "Polygon" ? "fill-color" : "line-color", i = e.type === "Polygon" ? `${n}-fill` : `${n}-solid`, a = t.sublayers?.find((e) => e.id === i)?.paint?.[r];
		return typeof a == "string" ? a : e.color;
	}
	syncLayerPropertiesToStore(e, t) {
		let n = B(e);
		if (!this.adapter?.store) return;
		let r = this.adapter.store.getState().mapLayers ?? {}, i = r[n];
		i && this.adapter.store.dispatch({ mapLayers: {
			...r,
			[n]: {
				...i,
				properties: t
			}
		} }, "MAP");
	}
	addActiveLayerProperty(e) {
		let t = this.newAttrName.trim();
		if (!t || !this.newAttrType || e.properties.some((e) => e.name === t)) return;
		let n = [...e.properties, {
			name: t,
			type: this.newAttrType
		}];
		this.drawLayers = this.drawLayers.map((t) => t.id === e.id ? {
			...t,
			properties: n
		} : t), this.syncLayerPropertiesToStore(e.id, n), this.cancelAddAttribute(), this.cancelRenameAttribute(), this.updateComplete.then(() => this.scrollPropertyListToBottom());
	}
	scrollPropertyListToBottom() {
		let e = this.shadowRoot?.querySelector(".prop-table-wrap");
		e && e.scrollTo({
			top: e.scrollHeight,
			behavior: "smooth"
		});
	}
	availableAutoAttributeTypes(e) {
		return nt[e.type].filter((e) => j[e]);
	}
	isAutoAttributeChecked(e, t) {
		let n = j[t];
		return !!(n && e.properties.some((e) => e.name === n.name));
	}
	toggleAutoAttribute(e, t) {
		let n = j[t];
		if (!n) return;
		let r = this.isAutoAttributeChecked(e, t) ? e.properties.filter((e) => e.name !== n.name) : [...e.properties, {
			name: n.name,
			type: t
		}];
		this.drawLayers = this.drawLayers.map((t) => t.id === e.id ? {
			...t,
			properties: r
		} : t), this.syncLayerPropertiesToStore(e.id, r), this.cancelRenameAttribute();
	}
	cancelAddAttribute() {
		this.addingAttribute = !1, this.newAttrName = "", this.newAttrType = "";
	}
	removeActiveLayerProperty(e, t) {
		let n = e.properties[t], r = e.properties.filter((e, n) => n !== t);
		this.drawLayers = this.drawLayers.map((t) => t.id === e.id ? {
			...t,
			properties: r
		} : t), this.syncLayerPropertiesToStore(e.id, r);
		let i = [];
		this.features = this.features.map((t) => {
			if (t.layerId !== e.id || !(n.name in t.properties)) return t;
			i.push({
				featureId: t.id,
				value: t.properties[n.name]
			});
			let { [n.name]: r, ...a } = t.properties;
			return {
				...t,
				properties: a
			};
		}), this.removedAttributeStack = [...this.removedAttributeStack, {
			index: t,
			property: n,
			values: i
		}], this.removedAttributeRedoStack = [], this.cancelRenameAttribute(), this.refreshDrawLayerSource(e.id);
	}
	undoRemoveAttribute(e) {
		if (this.removedAttributeStack.length === 0) return;
		let t = this.removedAttributeStack[this.removedAttributeStack.length - 1];
		if (this.removedAttributeStack = this.removedAttributeStack.slice(0, -1), e.properties.some((e) => e.name === t.property.name)) return;
		let n = [...e.properties];
		n.splice(Math.min(t.index, n.length), 0, t.property), this.drawLayers = this.drawLayers.map((t) => t.id === e.id ? {
			...t,
			properties: n
		} : t), this.syncLayerPropertiesToStore(e.id, n);
		let r = new Map(t.values.map((e) => [e.featureId, e.value]));
		this.features = this.features.map((e) => r.has(e.id) ? {
			...e,
			properties: {
				...e.properties,
				[t.property.name]: r.get(e.id)
			}
		} : e), this.removedAttributeRedoStack = [...this.removedAttributeRedoStack, t], this.cancelRenameAttribute(), this.refreshDrawLayerSource(e.id);
	}
	redoRemoveAttribute(e) {
		if (this.removedAttributeRedoStack.length === 0) return;
		let t = this.removedAttributeRedoStack[this.removedAttributeRedoStack.length - 1];
		this.removedAttributeRedoStack = this.removedAttributeRedoStack.slice(0, -1);
		let n = e.properties.filter((e) => e.name !== t.property.name);
		this.drawLayers = this.drawLayers.map((t) => t.id === e.id ? {
			...t,
			properties: n
		} : t), this.syncLayerPropertiesToStore(e.id, n);
		let r = new Set(t.values.map((e) => e.featureId));
		this.features = this.features.map((e) => {
			if (!r.has(e.id) || !(t.property.name in e.properties)) return e;
			let { [t.property.name]: n, ...i } = e.properties;
			return {
				...e,
				properties: i
			};
		}), this.removedAttributeStack = [...this.removedAttributeStack, t], this.cancelRenameAttribute(), this.refreshDrawLayerSource(e.id);
	}
	renderAttributeUndoRedo(e) {
		return s`
            <span class="add-attr-undo-group">
                <sl-tooltip content="Undo remove">
                    <sl-icon-button name="arrow-counterclockwise" size="small" label="Undo remove"
                        ?disabled=${this.removedAttributeStack.length === 0}
                        @click=${() => this.undoRemoveAttribute(e)}>
                    </sl-icon-button>
                </sl-tooltip>
                <sl-tooltip content="Redo remove">
                    <sl-icon-button name="arrow-clockwise" size="small" label="Redo remove"
                        ?disabled=${this.removedAttributeRedoStack.length === 0}
                        @click=${() => this.redoRemoveAttribute(e)}>
                    </sl-icon-button>
                </sl-tooltip>
            </span>
        `;
	}
	canRenameAttribute(e) {
		return e.name !== "id" && !rt.has(e.type);
	}
	startRenameAttribute(e, t) {
		this.renamingAttributeIndex = e, this.renameAttrDraft = t;
	}
	cancelRenameAttribute() {
		this.renamingAttributeIndex = null, this.renameAttrDraft = "";
	}
	renameAttributeDraftValid(e, t) {
		let n = this.renameAttrDraft.trim(), r = e.properties[t]?.name;
		return !r || !n || n === r ? !1 : !e.properties.some((e, r) => r !== t && e.name === n);
	}
	commitRenameAttribute(e, t) {
		if (!this.renameAttributeDraftValid(e, t)) {
			this.cancelRenameAttribute();
			return;
		}
		let n = this.renameAttrDraft.trim(), r = e.properties[t].name, i = e.properties.map((e, r) => r === t ? {
			...e,
			name: n
		} : e);
		this.drawLayers = this.drawLayers.map((t) => t.id === e.id ? {
			...t,
			properties: i
		} : t), this.syncLayerPropertiesToStore(e.id, i), this.features = this.features.map((t) => {
			if (t.layerId !== e.id || !(r in t.properties)) return t;
			let { [r]: i, ...a } = t.properties;
			return {
				...t,
				properties: {
					...a,
					[n]: i
				}
			};
		}), this.refreshDrawLayerSource(e.id), this.lastFocusedAttributeName === r && (this.lastFocusedAttributeName = n), this.cancelRenameAttribute();
	}
	handleClick(e) {
		let t = this.effectiveSnap && this.snapPos ? this.snapPos : e.coords, n = Wt(this.mode), r = n ? this.activeLayerIds[n] : null;
		if (!(!r && this.mode !== "select" && this.mode !== "attributes")) {
			if (this.mode === "draw-point") {
				this.commitFeature({
					id: this.newId(),
					layerId: r,
					type: "Point",
					coordinates: t,
					properties: this.defaultProperties(r)
				});
				return;
			}
			if (this.mode === "draw-line" || this.mode === "draw-line-dashed" || this.mode === "draw-polygon") {
				if (this.draftPoints.length >= 2) {
					let e = this.draftPoints[this.draftPoints.length - 1];
					if (this.withinPixelThreshold(t, e, 10) || this.mode === "draw-polygon" && this.withinPixelThreshold(t, this.draftPoints[0], 14)) {
						this.finishDraft(r);
						return;
					}
				}
				this.draftPoints.length === 0 && this.selectedFeatureId && (this.selectedFeatureId = null, this.editState = "none", this.editHandles = [], this.updateSelectedSource(), this.updateEditHandles()), this.draftPoints.push(t), this.draftRedoStack = [], this.uiVersion++, this.updateRubberband(), this.updateHelpTextDuring();
				return;
			}
			if (this.mode === "select" || this.mode === "attributes") {
				let e = this.adapter.project(t), n = [e[0], e[1]], r = this.findFeatureAt(n, t);
				this.setSelection(r ? [r.id] : []), this.requestUpdate();
			}
		}
	}
	handlePointerMove(e) {
		if (this.cursorPos = e.coords, this.circleDraft) {
			this.updateCircleDraft(e.coords);
			return;
		}
		if (this.rectDraft) {
			this.updateRectDraft(e.coords);
			return;
		}
		if (this.rectSelectDraft) {
			this.updateRectSelectDraft(e.coords);
			return;
		}
		if (this.lassoSelectDraft) {
			this.updateLassoSelectDraft(e.coords);
			return;
		}
		if (this.featureDrag) {
			let t = this.features.find((e) => e.id === this.featureDrag.featureId);
			if (t) {
				let n = e.coords[0] - this.featureDrag.startCoords[0], r = e.coords[1] - this.featureDrag.startCoords[1];
				t.coordinates = this.translateCoordsGeoPreserving(this.featureDrag.origCoords, t.type, n, r, this.featureDrag.origCentroidLng, this.featureDrag.origCentroidLat), this.refreshDrawLayerSource(t.layerId), this.updateEditHandles(), this.updateSelectedSource();
			}
			return;
		}
		if (this.dragging) {
			let t = this.features.find((e) => e.id === this.dragging.handle.featureId);
			if (t) {
				let n = e.coords;
				if (this.effectiveSnap && this.features.length > 0) {
					let r = this.adapter.project(e.coords), i = this.computeSnapExcluding([r[0], r[1]], this.dragging.handle.featureId, $(t.type));
					this.snapPos = i, i && (n = i);
				} else this.snapPos = null;
				this.applyDragMove(t, this.dragging.handle, n), this.dragging.lastCoords = e.coords, this.refreshDrawLayerSource(t.layerId), this.updateEditHandles(), this.updateSelectedSource(), this.updateSnapIndicator();
				let r = this.dragging.handle;
				this.selectedHandle && r.kind === "vertex" && this.selectedHandle.featureId === r.featureId && this.selectedHandle.partIdx === r.partIdx && this.selectedHandle.ringIdx === r.ringIdx && this.selectedHandle.vertIdx === r.vertIdx && (this.selectedHandle.coords = r.coords, this.updateSelectedVertexSource());
			}
			return;
		}
		if (Q(this.mode)) {
			let t = this.mode === "draw-polygon" && this.draftPoints.length >= 2;
			if (this.effectiveSnap && (this.features.length > 0 || t)) {
				let t = this.adapter.project(e.coords), n = [t[0], t[1]];
				(!this.lastCursorPx || Math.hypot(n[0] - this.lastCursorPx[0], n[1] - this.lastCursorPx[1]) > .5) && (this.lastCursorPx = n, this.snapPos = this.computeSnap(n));
			} else this.snapPos = null;
			this.updateRubberband();
			return;
		}
		if (this.isSelectMode()) {
			let t = this.adapter.project(e.coords), n = this.findFeatureAt([t[0], t[1]], e.coords), r = n && !this.selectedFeatureIds.includes(n.id) ? n.id : null;
			r !== this.hoveredFeatureId && (this.hoveredFeatureId = r, this.updateSelectedSource()), this.adapter?.setCursor(n ? "pointer" : "");
			return;
		}
		if (this.mode === "attributes") {
			let t = this.adapter.project(e.coords), n = this.findFeatureAt([t[0], t[1]], e.coords), r = n && n.id !== this.selectedFeatureId ? n.id : null;
			r !== this.hoveredFeatureId && (this.hoveredFeatureId = r, this.updateSelectedSource()), this.adapter?.setCursor(n ? "pointer" : "");
			return;
		}
		if (this.mode === "edit-move") {
			let t = this.adapter.project(e.coords), n = [t[0], t[1]], r = this.findFeatureAt(n, e.coords), i = r && r.id !== this.selectedFeatureId ? r.id : null;
			i !== this.hoveredFeatureId && (this.hoveredFeatureId = i, this.updateSelectedSource()), this.adapter?.setCursor(r ? "grab" : "");
			return;
		}
		if (this.mode === "edit-vertices") {
			let t = this.adapter.project(e.coords), n = [t[0], t[1]], r = this.selectedFeatureId ? this.findHandleAt(n) : null, i = r ? null : this.findFeatureAt(n, e.coords), a = i && i.id !== this.selectedFeatureId ? i.id : null;
			a !== this.hoveredFeatureId && (this.hoveredFeatureId = a, this.updateSelectedSource()), r ? this.adapter?.setCursor("grab") : i ? this.adapter?.setCursor(i.id === this.selectedFeatureId ? "default" : "pointer") : this.adapter?.setCursor("");
		}
	}
	handlePointerDown(e) {
		if (e.button === 0) {
			if (this.mode === "draw-circle") {
				this.startCircleDraft(e.coords);
				return;
			}
			if (this.mode === "draw-rectangle") {
				this.startRectDraft(e.coords);
				return;
			}
			if (this.mode === "select-rect") {
				this.startRectSelectDraft(e.coords);
				return;
			}
			if (this.mode === "select-lasso") {
				this.startLassoSelectDraft(e.coords);
				return;
			}
			if (this.mode === "edit-move") {
				let t = [e.pixel[0], e.pixel[1]], n = this.findFeatureAt(t, e.coords);
				if (!n) {
					this.selectedFeatureId && (this.selectedFeatureId = null, this.editState = "none", this.hoveredFeatureId = null, this.updateSelectedSource(), this.updateEditHandles());
					return;
				}
				n.id !== this.selectedFeatureId && (this.selectedFeatureId = n.id, this.editState = $(n.type) ? "none" : "selected", this.hoveredFeatureId = null, this.updateSelectedSource(), this.updateEditHandles());
				let r = this.centroid(n);
				this.featureDrag = {
					featureId: n.id,
					startCoords: e.coords,
					origCoords: JSON.parse(JSON.stringify(n.coordinates)),
					origCentroidLat: r[1],
					origCentroidLng: r[0]
				}, this.adapter?.setPanEnabled(!1), this.adapter?.setCursor("grabbing");
				return;
			}
			if (this.mode === "edit-vertices") {
				let t = [e.pixel[0], e.pixel[1]], n = this.selectedFeatureId ? this.features.find((e) => e.id === this.selectedFeatureId) : null, r = n ? this.findHandleAt(t) : null;
				if (n && r) {
					if (this.selectedHandle = r.kind === "vertex" ? r : null, this.updateSelectedVertexSource(), this.dragging = {
						handle: r,
						lastCoords: e.coords,
						origCoords: JSON.parse(JSON.stringify(n.coordinates))
					}, this.adapter?.setPanEnabled(!1), this.adapter?.setCursor("grabbing"), r.kind === "midpoint") {
						this.insertVertex(n, r);
						let t = r.afterVertIdx + 1, i = {
							kind: "vertex",
							featureId: r.featureId,
							partIdx: r.partIdx,
							ringIdx: r.ringIdx,
							vertIdx: t,
							coords: r.coords
						};
						this.dragging = {
							handle: i,
							lastCoords: e.coords,
							origCoords: JSON.parse(JSON.stringify(n.coordinates))
						}, this.selectedHandle = i, this.updateSelectedVertexSource(), this.refreshDrawLayerSource(n.layerId), this.updateEditHandles();
					}
					return;
				}
				let i = this.findFeatureAt(t, e.coords);
				i?.id !== this.selectedFeatureId && (this.selectedFeatureId = i?.id ?? null, this.editState = i ? "editing" : "none", this.hoveredFeatureId = null, this.updateSelectedSource(), this.updateEditHandles());
				return;
			}
		}
	}
	handlePointerUp(e) {
		if (this.circleDraft) {
			this.finishCircleDraft();
			return;
		}
		if (this.rectDraft) {
			this.finishRectDraft();
			return;
		}
		if (this.rectSelectDraft) {
			this.finishRectSelectDraft();
			return;
		}
		if (this.lassoSelectDraft) {
			this.finishLassoSelectDraft();
			return;
		}
		if (this.featureDrag) {
			let e = this.features.find((e) => e.id === this.featureDrag.featureId), t = e && JSON.stringify(e.coordinates) !== JSON.stringify(this.featureDrag.origCoords);
			if (e && t) {
				let t = {
					...e,
					coordinates: this.featureDrag.origCoords
				}, n = this.drawLayers.find((t) => t.id === e.layerId);
				n && this.computeSpecialProperties(e, n), this.pushHistory({
					type: "update",
					features: [t],
					afterFeatures: [{ ...e }]
				}), this.features = [...this.features], this.refreshDrawLayerSource(e.layerId);
			}
			this.featureDrag = null, this.adapter?.setPanEnabled(!0), this.adapter?.setCursor("");
			return;
		}
		if (!this.dragging) return;
		this.snapPos = null, this.updateSnapIndicator(), this.adapter?.setPanEnabled(!0), this.adapter?.setCursor("");
		let t = this.features.find((e) => e.id === this.dragging.handle.featureId), n = t && JSON.stringify(t.coordinates) !== JSON.stringify(this.dragging.origCoords);
		if (t && n) {
			let e = {
				...t,
				coordinates: this.dragging.origCoords
			}, n = this.drawLayers.find((e) => e.id === t.layerId);
			n && this.computeSpecialProperties(t, n), this.pushHistory({
				type: "update",
				features: [e],
				afterFeatures: [{ ...t }]
			}), this.features = [...this.features], this.refreshDrawLayerSource(t.layerId);
		}
		this.dragging = null;
	}
	handlePointerLeave() {
		if (this.dragging || this.featureDrag) return;
		let e = this.isSelectMode() || this.isEditMode() || this.mode === "attributes";
		e && this.hoveredFeatureId && (this.hoveredFeatureId = null, this.updateSelectedSource()), e && this.adapter?.setCursor("");
	}
	handleContextMenu(e) {
		let t = Wt(this.mode), n = t ? this.activeLayerIds[t] : null;
		n && (this.mode === "draw-line" || this.mode === "draw-line-dashed" || this.mode === "draw-polygon") && this.finishDraft(n);
	}
	defaultProperties(e) {
		let t = this.drawLayers.find((t) => t.id === e);
		return t ? Object.fromEntries(t.properties.map((e) => [e.name, null])) : {};
	}
	finishDraft(e) {
		let t = this.draftPoints;
		if ((this.mode === "draw-line" || this.mode === "draw-line-dashed") && t.length >= 2) this.commitFeature({
			id: this.newId(),
			layerId: e,
			type: "LineString",
			coordinates: t.map((e) => [e[0], e[1]]),
			properties: this.defaultProperties(e),
			dashed: this.mode === "draw-line-dashed"
		}, t);
		else if (this.mode === "draw-polygon" && t.length >= 3) {
			let n = [...t.map((e) => [e[0], e[1]]), [t[0][0], t[0][1]]];
			this.commitFeature({
				id: this.newId(),
				layerId: e,
				type: "Polygon",
				coordinates: [n],
				properties: this.defaultProperties(e)
			}, t);
		}
		this.draftPoints = [], this.draftRedoStack = [], this.cursorPos = null, this.updateRubberband();
	}
	startCircleDraft(e) {
		if (!this.activeLayerIds.Polygon) return;
		let t = this.effectiveSnap && this.snapPos ? this.snapPos : e;
		this.circleDraft = {
			center: t,
			radiusM: 0
		}, this.adapter?.setPanEnabled(!1), this.helpText = "Drag to set circle radius.";
	}
	updateCircleDraft(e) {
		this.circleDraft && (this.circleDraft.radiusM = b(this.circleDraft.center, e) / 100, this.updateCirclePreview(), this.helpText = `Radius: ${Ce(this.circleDraft.radiusM * 100)}`);
	}
	updateCirclePreview() {
		if (!this.sharedLayersCreated || !this.circleDraft) return;
		let e = this.circleDraft.radiusM >= q ? [{
			type: "Feature",
			geometry: {
				type: "LineString",
				coordinates: we(this.circleDraft.center, this.circleDraft.radiusM)
			},
			properties: {}
		}] : [];
		this.dispatch("webmapx-set-source-data", {
			id: P,
			data: {
				type: "FeatureCollection",
				features: e
			}
		});
	}
	finishCircleDraft() {
		if (!this.circleDraft) return;
		let { center: e, radiusM: t } = this.circleDraft;
		this.circleDraft = null, this.adapter?.setPanEnabled(!0), this.dispatch("webmapx-set-source-data", {
			id: P,
			data: {
				type: "FeatureCollection",
				features: []
			}
		});
		let n = this.activeLayerIds.Polygon;
		n && t >= q && this.commitFeature({
			id: this.newId(),
			layerId: n,
			type: "Polygon",
			coordinates: [we(e, t)],
			properties: this.defaultProperties(n)
		}), this.helpText = "Click and drag to draw a circle.";
	}
	startRectDraft(e) {
		if (!this.activeLayerIds.Polygon) return;
		let t = this.effectiveSnap && this.snapPos ? this.snapPos : e;
		this.rectDraft = {
			corner1: t,
			corner2: t
		}, this.adapter?.setPanEnabled(!1), this.helpText = "Drag to the opposite corner.";
	}
	updateRectDraft(e) {
		if (!this.rectDraft) return;
		this.rectDraft.corner2 = this.effectiveSnap && this.snapPos ? this.snapPos : e, this.updateRectPreview();
		let t = b(this.rectDraft.corner1, this.rectDraft.corner2) / 100;
		this.helpText = `Diagonal: ${Ce(t * 100)}`;
	}
	rectRing(e, t) {
		let [n, r] = e, [i, a] = t;
		return [
			[n, r],
			[i, r],
			[i, a],
			[n, a],
			[n, r]
		];
	}
	updateRectPreview() {
		if (!this.sharedLayersCreated || !this.rectDraft) return;
		let e = b(this.rectDraft.corner1, this.rectDraft.corner2) / 100 >= q ? [{
			type: "Feature",
			geometry: {
				type: "LineString",
				coordinates: this.rectRing(this.rectDraft.corner1, this.rectDraft.corner2)
			},
			properties: {}
		}] : [];
		this.dispatch("webmapx-set-source-data", {
			id: P,
			data: {
				type: "FeatureCollection",
				features: e
			}
		});
	}
	finishRectDraft() {
		if (!this.rectDraft) return;
		let { corner1: e, corner2: t } = this.rectDraft;
		this.rectDraft = null, this.adapter?.setPanEnabled(!0), this.dispatch("webmapx-set-source-data", {
			id: P,
			data: {
				type: "FeatureCollection",
				features: []
			}
		});
		let n = this.activeLayerIds.Polygon, r = b(e, t) / 100;
		n && r >= q && this.commitFeature({
			id: this.newId(),
			layerId: n,
			type: "Polygon",
			coordinates: [this.rectRing(e, t)],
			properties: this.defaultProperties(n)
		}), this.helpText = "Click and drag to draw a rectangle.";
	}
	startRectSelectDraft(e) {
		this.rectSelectDraft = {
			corner1: e,
			corner2: e
		}, this.adapter?.setPanEnabled(!1);
	}
	updateRectSelectDraft(e) {
		if (!this.rectSelectDraft) return;
		this.rectSelectDraft.corner2 = e;
		let { corner1: t, corner2: n } = this.rectSelectDraft, r = this.rectRing(t, n);
		this.updateMarquee(r), b(t, n) / 100 >= q ? this.applyShapeSelection(r) : this.selectedFeatureIds.length > 0 && this.setSelection([]);
	}
	finishRectSelectDraft() {
		if (!this.rectSelectDraft) return;
		let { corner1: e, corner2: t } = this.rectSelectDraft;
		this.rectSelectDraft = null, this.adapter?.setPanEnabled(!0), this.updateMarquee(null), b(e, t) / 100 >= q && this.applyShapeSelection(this.rectRing(e, t)), this.helpText = "Drag a rectangle to select the features inside it.";
	}
	startLassoSelectDraft(e) {
		this.lassoSelectDraft = { points: [e] }, this.adapter?.setPanEnabled(!1);
	}
	updateLassoSelectDraft(e) {
		if (!this.lassoSelectDraft) return;
		let t = this.lassoSelectDraft.points, n = t[t.length - 1];
		if (this.adapter) {
			let t = this.adapter.project(n), r = this.adapter.project(e);
			if (Math.hypot(r[0] - t[0], r[1] - t[1]) < 3) return;
		}
		if (t.push(e), t.length >= 3) {
			let e = [...t, t[0]];
			this.updateMarquee(e), this.applyShapeSelection(e);
		} else this.updateMarquee(null);
	}
	finishLassoSelectDraft() {
		if (!this.lassoSelectDraft) return;
		let e = this.lassoSelectDraft.points;
		this.lassoSelectDraft = null, this.adapter?.setPanEnabled(!0), this.updateMarquee(null), e.length >= 3 && this.applyShapeSelection([...e, e[0]]), this.helpText = "Draw a free-hand shape to select the features inside it.";
	}
	updateMarquee(e) {
		if (!this.sharedLayersCreated) return;
		let t = e ? [{
			type: "Feature",
			geometry: {
				type: "Polygon",
				coordinates: [e]
			},
			properties: {}
		}] : [];
		this.dispatch("webmapx-set-source-data", {
			id: J,
			data: {
				type: "FeatureCollection",
				features: t
			}
		});
	}
	applyShapeSelection(e) {
		if (e.length < 3) return;
		let t = this.currentSessionLayerId, n = [];
		for (let r of this.features) r.layerId === t && this.featureIntersectsRing(r, e) && n.push(r.id);
		this.setSelection(n);
	}
	featureIntersectsRing(e, t) {
		if (e.type === "Point") return this.pointInRing(e.coordinates, t);
		if (e.type === "MultiPoint" || e.type === "LineString") return e.coordinates.some((e) => this.pointInRing(e, t));
		if (e.type === "MultiLineString") return e.coordinates.some((e) => e.some((e) => this.pointInRing(e, t)));
		if (e.type === "Polygon") {
			let n = e.coordinates[0];
			return n.some((e) => this.pointInRing(e, t)) || t.some((e) => this.pointInRing(e, n));
		}
		return e.type === "MultiPolygon" ? e.coordinates.some((e) => {
			let n = e[0];
			return !!n && (n.some((e) => this.pointInRing(e, t)) || t.some((e) => this.pointInRing(e, n)));
		}) : !1;
	}
	setSelection(e) {
		this.selectedFeatureIds = e, this.selectedFeatureId = e.length === 1 ? e[0] : null, this.hoveredFeatureId = null, this.updateSelectedSource(), this.updateMultiSelectSource(), this.mode === "attributes" && this.selectedFeatureId && this.updateComplete.then(() => this.focusFirstAttributeValueInput());
	}
	updateMultiSelectSource() {
		if (!this.sharedLayersCreated) return;
		let e = this.selectedFeatureIds.map((e) => this.features.find((t) => t.id === e)).filter((e) => !!(e && $(e.type))).map((e) => ({
			type: "Feature",
			id: e.id,
			geometry: {
				type: e.type,
				coordinates: e.coordinates
			},
			properties: {}
		}));
		this.dispatch("webmapx-set-source-data", {
			id: Y,
			data: {
				type: "FeatureCollection",
				features: e
			}
		});
	}
	computeSnap(e) {
		let t = this.computeSnapExcluding(e, null, this.mode === "draw-point");
		if (this.mode === "draw-polygon" && this.draftPoints.length >= 2 && this.adapter) {
			let n = this.draftPoints[0], r = this.adapter.project(n), i = Math.hypot(r[0] - e[0], r[1] - e[1]);
			if (i <= Bt) {
				if (!t) return n;
				let r = this.adapter.project(t);
				return i <= Math.hypot(r[0] - e[0], r[1] - e[1]) ? n : t;
			}
		}
		return t;
	}
	computeSnapExcluding(e, t, n) {
		return this.adapter ? lt(e, this.features.filter((e) => e.id !== t && !(n && $(e.type))), (e) => {
			let t = this.adapter.project(e);
			return [t[0], t[1]];
		}, {
			threshold: Bt,
			edgePenalty: 8,
			unproject: (e) => this.adapter.unproject(e)
		}) : null;
	}
	updateSnapIndicator() {
		if (!this.sharedLayersCreated) return;
		let e = this.effectiveSnap && this.snapPos ? [{
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: this.snapPos
			},
			properties: {}
		}] : [];
		this.dispatch("webmapx-set-source-data", {
			id: K,
			data: {
				type: "FeatureCollection",
				features: e
			}
		});
	}
	updateRubberband() {
		if (!this.sharedLayersCreated) return;
		let e = [], t = [], n = Q(this.mode), r = this.effectiveSnap && this.snapPos ? this.snapPos : this.cursorPos;
		if (n && this.draftPoints.length > 0 && r) {
			let n = [...this.draftPoints.map((e) => [e[0], e[1]]), [r[0], r[1]]];
			e.push({
				type: "Feature",
				geometry: {
					type: "LineString",
					coordinates: n
				},
				properties: {}
			});
			for (let e of this.draftPoints) t.push({
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [e[0], e[1]]
				},
				properties: {}
			});
		}
		this.dispatch("webmapx-set-source-data", {
			id: P,
			data: {
				type: "FeatureCollection",
				features: e
			}
		}), this.dispatch("webmapx-set-source-data", {
			id: V,
			data: {
				type: "FeatureCollection",
				features: t
			}
		});
		let i = n && this.effectiveSnap && this.snapPos ? [{
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: this.snapPos
			},
			properties: {}
		}] : [];
		this.dispatch("webmapx-set-source-data", {
			id: K,
			data: {
				type: "FeatureCollection",
				features: i
			}
		});
	}
	previewPlusPicked(e) {
		return this.hoveredFeatureId && !e.includes(this.hoveredFeatureId) ? [...e, this.hoveredFeatureId] : e;
	}
	updateSelectedSource() {
		if (!this.sharedLayersCreated) return;
		let e = (this.isSelectMode() ? this.previewPlusPicked(this.selectedFeatureIds) : this.mode === "edit-vertices" ? this.hoveredFeatureId ? [this.hoveredFeatureId] : [] : this.mode === "attributes" || this.mode === "edit-move" ? this.previewPlusPicked(this.selectedFeatureId ? [this.selectedFeatureId] : []) : this.selectedFeatureId ? [this.selectedFeatureId] : []).flatMap((e) => {
			let t = this.features.find((t) => t.id === e), n = t ? this.drawLayers.find((e) => e.id === t.layerId) : void 0;
			return !t || !n || $(t.type) ? [] : this.computeHandles(t).filter((e) => e.kind === "vertex").map((e) => ({
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: e.coords
				},
				properties: { color: this.currentDrawLayerColor(n) }
			}));
		});
		this.dispatch("webmapx-set-source-data", {
			id: H,
			data: {
				type: "FeatureCollection",
				features: e
			}
		});
	}
	computeHandles(e) {
		let t = [];
		if (e.type === "Point") return t.push({
			kind: "vertex",
			featureId: e.id,
			partIdx: 0,
			ringIdx: 0,
			vertIdx: 0,
			coords: e.coordinates
		}), t;
		if (e.type === "MultiPoint") return e.coordinates.forEach((n, r) => {
			t.push({
				kind: "vertex",
				featureId: e.id,
				partIdx: r,
				ringIdx: 0,
				vertIdx: 0,
				coords: n
			});
		}), t;
		let n = (n, r, i, a) => {
			let o = a ? n.length - 1 : n.length;
			for (let s = 0; s < o; s++) {
				if (t.push({
					kind: "vertex",
					featureId: e.id,
					partIdx: r,
					ringIdx: i,
					vertIdx: s,
					coords: n[s]
				}), !a && s === o - 1) continue;
				let c = (s + 1) % o, l = [(n[s][0] + n[c][0]) / 2, (n[s][1] + n[c][1]) / 2];
				t.push({
					kind: "midpoint",
					featureId: e.id,
					partIdx: r,
					ringIdx: i,
					afterVertIdx: s,
					coords: l
				});
			}
		};
		return e.type === "LineString" ? n(e.coordinates, 0, 0, !1) : e.type === "MultiLineString" ? e.coordinates.forEach((e, t) => n(e, t, 0, !1)) : e.type === "Polygon" ? e.coordinates.forEach((e, t) => n(e, 0, t, !0)) : e.type === "MultiPolygon" && e.coordinates.forEach((e, t) => {
			e.forEach((e, r) => n(e, t, r, !0));
		}), t;
	}
	updateEditHandles() {
		if (!this.sharedLayersCreated) return;
		let e = this.selectedFeatureId ? this.features.find((e) => e.id === this.selectedFeatureId) : null;
		if (!e) {
			this.editHandles = [], this.selectedHandle = null, this.updateSelectedVertexSource(), this.dispatch("webmapx-set-source-data", {
				id: U,
				data: {
					type: "FeatureCollection",
					features: []
				}
			}), this.dispatch("webmapx-set-source-data", {
				id: W,
				data: {
					type: "FeatureCollection",
					features: []
				}
			});
			return;
		}
		this.selectedHandle && this.selectedHandle.featureId !== e.id && (this.selectedHandle = null, this.updateSelectedVertexSource()), this.editHandles = this.computeHandles(e);
		let t = this.editState === "editing", n = t ? this.editHandles.filter((e) => e.kind === "vertex").map((e) => ({
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: e.coords
			},
			properties: {}
		})) : [], r = t ? this.editHandles.filter((e) => e.kind === "midpoint").map((e) => ({
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: e.coords
			},
			properties: {}
		})) : [];
		this.dispatch("webmapx-set-source-data", {
			id: U,
			data: {
				type: "FeatureCollection",
				features: n
			}
		}), this.dispatch("webmapx-set-source-data", {
			id: W,
			data: {
				type: "FeatureCollection",
				features: r
			}
		});
	}
	findHandleAt(e) {
		let t = null, n = Rt;
		for (let r of this.editHandles) {
			let i = this.adapter.project(r.coords), a = Math.hypot(e[0] - i[0], e[1] - i[1]);
			a < n && (n = a, t = r);
		}
		return t;
	}
	applyDragMove(e, t, n) {
		let r = JSON.parse(JSON.stringify(e.coordinates));
		if (t.kind !== "vertex") return;
		let { partIdx: i, ringIdx: a, vertIdx: o } = t;
		if (e.type === "Point") {
			e.coordinates = [n[0], n[1]], t.coords = n;
			return;
		} else if (e.type === "MultiPoint") r[i] = [n[0], n[1]];
		else if (e.type === "LineString") r[o] = [n[0], n[1]];
		else if (e.type === "MultiLineString") r[i][o] = [n[0], n[1]];
		else if (e.type === "Polygon") {
			r[a][o] = [n[0], n[1]];
			let e = r[a];
			o === 0 && (e[e.length - 1] = e[0]);
		} else if (e.type === "MultiPolygon") {
			r[i][a][o] = [n[0], n[1]];
			let e = r[i][a];
			o === 0 && (e[e.length - 1] = e[0]);
		}
		e.coordinates = r, t.coords = n;
	}
	translateCoordsGeoPreserving(e, t, n, r, i, a) {
		if (!isFinite(a) || !isFinite(i)) return this.translateCoords(e, t, n, r);
		let o = a + r, s = Math.cos(a * Math.PI / 180), c = Math.cos(o * Math.PI / 180), l = c > 1e-6 ? s / c : 1, u = i + n, d = (e) => [u + (e[0] - i) * l, e[1] + r];
		return t === "Point" ? d(e) : t === "MultiPoint" || t === "LineString" ? e.map(d) : t === "MultiLineString" ? e.map((e) => e.map(d)) : t === "Polygon" ? e.map((e) => e.map(d)) : t === "MultiPolygon" ? e.map((e) => e.map((e) => e.map(d))) : e;
	}
	translateCoords(e, t, n, r) {
		let i = (e) => [e[0] + n, e[1] + r];
		return t === "Point" ? i(e) : t === "MultiPoint" || t === "LineString" ? e.map(i) : t === "MultiLineString" ? e.map((e) => e.map(i)) : t === "Polygon" ? e.map((e) => e.map(i)) : t === "MultiPolygon" ? e.map((e) => e.map((e) => e.map(i))) : e;
	}
	insertVertex(e, t) {
		let n = {
			...e,
			coordinates: JSON.parse(JSON.stringify(e.coordinates))
		}, r = JSON.parse(JSON.stringify(e.coordinates)), { partIdx: i, ringIdx: a, afterVertIdx: o } = t;
		e.type === "LineString" ? r.splice(o + 1, 0, [t.coords[0], t.coords[1]]) : e.type === "MultiLineString" ? r[i].splice(o + 1, 0, [t.coords[0], t.coords[1]]) : e.type === "Polygon" ? r[a].splice(o + 1, 0, [t.coords[0], t.coords[1]]) : e.type === "MultiPolygon" && r[i][a].splice(o + 1, 0, [t.coords[0], t.coords[1]]), e.coordinates = r, this.pushHistory({
			type: "update",
			features: [n],
			afterFeatures: [{ ...e }]
		});
	}
	updateSelectedVertexSource() {
		if (this.uiVersion++, !this.sharedLayersCreated) return;
		let e = this.selectedHandle ? [{
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: this.selectedHandle.coords
			},
			properties: {}
		}] : [];
		this.dispatch("webmapx-set-source-data", {
			id: G,
			data: {
				type: "FeatureCollection",
				features: e
			}
		});
	}
	deleteSelectedVertex() {
		let e = this.selectedHandle;
		if (!e) return;
		let t = this.features.find((t) => t.id === e.featureId);
		if (!t) return;
		let n = JSON.parse(JSON.stringify(t.coordinates)), { partIdx: r, ringIdx: i, vertIdx: a } = e;
		if (t.type === "LineString") {
			if (n.length <= 2) return;
			n.splice(a, 1);
		} else if (t.type === "MultiLineString") {
			if (n[r].length <= 2) return;
			n[r].splice(a, 1);
		} else if (t.type === "Polygon") {
			let e = n[i];
			if (e.length - 1 <= 3) return;
			a === 0 || a === e.length - 1 ? (e.splice(e.length - 1, 1), e.splice(0, 1), e.push([...e[0]])) : e.splice(a, 1);
		} else if (t.type === "MultiPolygon") {
			let e = n[r][i];
			if (e.length - 1 <= 3) return;
			a === 0 || a === e.length - 1 ? (e.splice(e.length - 1, 1), e.splice(0, 1), e.push([...e[0]])) : e.splice(a, 1);
		} else if (t.type === "MultiPoint") {
			if (n.length <= 1) return;
			n.splice(r, 1);
		} else return;
		let o = { ...t };
		t.coordinates = n;
		let s = this.drawLayers.find((e) => e.id === t.layerId);
		s && this.computeSpecialProperties(t, s), this.pushHistory({
			type: "update",
			features: [o],
			afterFeatures: [{ ...t }]
		}), this.features = [...this.features], this.refreshDrawLayerSource(t.layerId), this.selectedHandle = null, this.updateSelectedVertexSource(), this.updateEditHandles();
	}
	commitFeature(e, t) {
		let n = this.features.filter((t) => t.layerId === e.layerId).reduce((e, t) => {
			let n = parseInt(String(t.properties.id ?? 0), 10);
			return isNaN(n) ? e : Math.max(e, n);
		}, 0);
		e.properties.id = n + 1;
		let r = this.drawLayers.find((t) => t.id === e.layerId);
		if (r && this.computeSpecialProperties(e, r), r) for (let t of r.properties) t.type === "create-time" && (e.properties[t.name] = Date.now());
		this.pushHistory(t ? {
			type: "finish",
			features: [e],
			draftPoints: t.map((e) => [e[0], e[1]])
		} : {
			type: "add",
			features: [e]
		}), this.features = [...this.features, e], this.refreshDrawLayerSource(e.layerId), this.setModeInternal(this.mode), this.selectedFeatureId = e.id, this.updateSelectedSource(), this.updateEditHandles();
	}
	deleteSelected() {
		let e = this.selectedFeatureId ? [this.selectedFeatureId] : this.selectedFeatureIds;
		if (e.length === 0) return;
		let t = new Set(e), n = this.features.filter((e) => t.has(e.id));
		this.pushHistory({
			type: "delete",
			features: n
		}), this.features = this.features.filter((e) => !t.has(e.id)), new Set(n.map((e) => e.layerId)).forEach((e) => this.refreshDrawLayerSource(e)), this.selectedFeatureId = null, this.selectedFeatureIds = [], this.editState = "none", this.editHandles = [], this.adapter?.setCursor(""), this.updateSelectedSource(), this.updateMultiSelectSource(), this.updateEditHandles(), this.exitToDrawIfLayerEmpty();
	}
	exitToDrawIfLayerEmpty() {
		if (!this.pickedType || !this.isSelectMode() && !this.isEditMode() && this.mode !== "attributes") return;
		let e = this.activeLayerIds[this.pickedType];
		e && this.features.some((t) => t.layerId === e) || this.moveHistoryIndex >= 0 || this.setModeInternal(Z(this.pickedType));
	}
	pushHistory(e) {
		e.type === "update" || e.type === "delete" ? (this.moveHistory = this.moveHistory.slice(0, this.moveHistoryIndex + 1), this.moveHistory.push(e), this.moveHistoryIndex = this.moveHistory.length - 1) : (this.drawHistory = this.drawHistory.slice(0, this.drawHistoryIndex + 1), this.drawHistory.push(e), this.drawHistoryIndex = this.drawHistory.length - 1), this.uiVersion++;
	}
	removeLastDraftPoint() {
		this.draftRedoStack.push(this.draftPoints.pop()), this.uiVersion++, this.updateRubberband(), this.updateHelpTextDuring();
	}
	undoOrDraftBack() {
		this.draftPoints.length > 0 ? this.removeLastDraftPoint() : this.undoDraw();
	}
	redoOrDraftForward() {
		this.draftRedoStack.length > 0 ? (this.draftPoints.push(this.draftRedoStack.pop()), this.uiVersion++, this.updateRubberband(), this.updateHelpTextDuring()) : this.redoDraw();
	}
	stepBackDrawHistory() {
		if (this.drawHistoryIndex < 0) return null;
		let e = this.drawHistory[this.drawHistoryIndex--];
		this.uiVersion++;
		let t = /* @__PURE__ */ new Set(), n = new Set(e.features.map((e) => e.id));
		return this.features = this.features.filter((e) => !n.has(e.id)), e.features.forEach((e) => t.add(e.layerId)), this.selectedFeatureId = null, this.selectedFeatureIds = [], this.editState = "none", this.updateSelectedSource(), this.updateMultiSelectSource(), this.updateEditHandles(), t.forEach((e) => this.refreshDrawLayerSource(e)), e;
	}
	undoDraw() {
		let e = this.stepBackDrawHistory();
		if (e?.type === "finish" && e.draftPoints) {
			let t = e.features[0];
			this.mode = t.type === "LineString" ? t.dashed ? "draw-line-dashed" : "draw-line" : "draw-polygon", this.draftPoints = e.draftPoints.map((e) => [e[0], e[1]]), this.draftRedoStack = [], this.cursorPos = this.draftPoints[this.draftPoints.length - 1], this.updateRubberband(), this.updateHelpTextDuring();
		}
	}
	deleteJustDrawnFeature() {
		this.stepBackDrawHistory();
	}
	redoDraw() {
		if (this.drawHistoryIndex >= this.drawHistory.length - 1) return;
		let e = this.drawHistory[++this.drawHistoryIndex];
		this.uiVersion++;
		let t = /* @__PURE__ */ new Set();
		if (this.features = [...this.features, ...e.features], e.features.forEach((e) => t.add(e.layerId)), t.forEach((e) => this.refreshDrawLayerSource(e)), e.type === "finish") {
			let t = e.features[0];
			this.draftPoints = [], this.draftRedoStack = [], this.cursorPos = null, this.selectedFeatureId = t.id, this.editState = "none", this.updateSelectedSource(), this.updateEditHandles(), this.updateRubberband();
		}
	}
	reselectAfterHistoryStep(e) {
		this.selectedFeatureIds = e, this.selectedFeatureId = e.length === 1 ? e[0] : null;
		let t = this.selectedFeatureId ? this.features.find((e) => e.id === this.selectedFeatureId) : null;
		this.editState = t ? this.mode === "edit-vertices" ? "editing" : this.mode === "edit-move" ? $(t.type) ? "none" : "selected" : "none" : "none", this.selectedHandle = null, this.updateSelectedVertexSource(), this.updateSelectedSource(), this.updateMultiSelectSource(), this.updateEditHandles();
	}
	undoMove() {
		if (this.moveHistoryIndex < 0) return;
		let e = this.moveHistory[this.moveHistoryIndex--];
		this.uiVersion++;
		let t = /* @__PURE__ */ new Set();
		e.type === "delete" ? (this.features = [...this.features, ...e.features], e.features.forEach((e) => t.add(e.layerId))) : this.features = this.features.map((n) => {
			let r = e.features.find((e) => e.id === n.id);
			return r ? (t.add(n.layerId), {
				...n,
				coordinates: r.coordinates
			}) : n;
		}), this.reselectAfterHistoryStep(e.features.map((e) => e.id)), t.forEach((e) => this.refreshDrawLayerSource(e));
	}
	redoMove() {
		if (this.moveHistoryIndex >= this.moveHistory.length - 1) return;
		let e = this.moveHistory[++this.moveHistoryIndex];
		this.uiVersion++;
		let t = /* @__PURE__ */ new Set();
		if (e.type === "delete") {
			let n = new Set(e.features.map((e) => e.id));
			this.features = this.features.filter((e) => !n.has(e.id)), e.features.forEach((e) => t.add(e.layerId)), this.reselectAfterHistoryStep([]);
		} else {
			let n = e.afterFeatures ?? e.features;
			this.features = this.features.map((e) => {
				let r = n.find((t) => t.id === e.id);
				return r ? (t.add(e.layerId), {
					...e,
					coordinates: r.coordinates
				}) : e;
			}), this.reselectAfterHistoryStep(e.features.map((e) => e.id));
		}
		t.forEach((e) => this.refreshDrawLayerSource(e)), this.exitToDrawIfLayerEmpty();
	}
	newId() {
		return `draw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
	}
	computeSpecialProperties(e, t) {
		for (let n of t.properties) switch (n.type) {
			case "longitude":
			case "latitude": {
				let t = e.type === "Point" ? e.coordinates : this.centroid(e);
				e.properties[n.name] = n.type === "longitude" ? t[0] : t[1];
				break;
			}
			case "area":
				e.properties[n.name] = e.type === "Polygon" ? this.polygonArea(e.coordinates) : null;
				break;
			case "perimeter":
			case "length":
				e.properties[n.name] = e.type === "Polygon" ? this.ringLength(e.coordinates[0]) : e.type === "LineString" ? this.ringLength(e.coordinates, !1) : null;
				break;
			case "update-time":
				e.properties[n.name] = Date.now();
				break;
		}
	}
	centroid(e) {
		let t;
		switch (e.type) {
			case "Point":
				t = [e.coordinates];
				break;
			case "MultiPoint":
				t = e.coordinates;
				break;
			case "LineString":
				t = e.coordinates;
				break;
			case "MultiLineString":
				t = e.coordinates.flat();
				break;
			case "Polygon":
				t = e.coordinates[0];
				break;
			case "MultiPolygon":
				t = e.coordinates.flat(2);
				break;
			default: t = [];
		}
		if (t.length === 0) return [0, 0];
		let n = t.reduce((e, t) => [e[0] + t[0], e[1] + t[1]], [0, 0]);
		return [n[0] / t.length, n[1] / t.length];
	}
	haversineKm(e, t) {
		let n = (t[1] - e[1]) * Math.PI / 180, r = (t[0] - e[0]) * Math.PI / 180, i = Math.sin(n / 2) ** 2 + Math.cos(e[1] * Math.PI / 180) * Math.cos(t[1] * Math.PI / 180) * Math.sin(r / 2) ** 2;
		return 6371 * 2 * Math.atan2(Math.sqrt(i), Math.sqrt(1 - i));
	}
	ringLength(e, t = !0) {
		let n = 0, r = e.length - 1;
		for (let t = 0; t < r; t++) n += this.haversineKm(e[t], e[t + 1]);
		return Math.round(n * 1e3);
	}
	polygonArea(e) {
		let t = e[0], n = 0;
		for (let e = 0, r = t.length - 1; e < t.length; r = e++) n += (t[r][0] + t[e][0]) * (t[r][1] - t[e][1]);
		let r = Math.abs(n / 2), i = t[0][1] * Math.PI / 180;
		return Math.round(111320 * Math.cos(i) * r * 111320);
	}
	withinPixelThreshold(e, t, n) {
		if (!this.adapter) return !1;
		let r = this.adapter.project(e), i = this.adapter.project(t);
		return Math.hypot(r[0] - i[0], r[1] - i[1]) < n;
	}
	get currentSessionLayerId() {
		return this.pickedType ? this.activeLayerIds[this.pickedType] ?? null : null;
	}
	findFeatureAt(e, t) {
		let n = this.currentSessionLayerId;
		for (let r of [...this.features].reverse()) if (r.layerId === n) {
			if (r.type === "Point") {
				let t = this.adapter.project(r.coordinates);
				if (Math.hypot(t[0] - e[0], t[1] - e[1]) < 10) return r;
			} else if (r.type === "MultiPoint") for (let t of r.coordinates) {
				let n = this.adapter.project(t);
				if (Math.hypot(n[0] - e[0], n[1] - e[1]) < 10) return r;
			}
			else if (r.type === "LineString") {
				if (this.pixelNearPolyline(e, r.coordinates, 10)) return r;
			} else if (r.type === "MultiLineString") {
				if (r.coordinates.some((t) => this.pixelNearPolyline(e, t, 10))) return r;
			} else if (r.type === "Polygon") {
				if (this.pointInRing(t, r.coordinates[0]) || this.pixelNearPolyline(e, r.coordinates[0], 10)) return r;
			} else if (r.type === "MultiPolygon") for (let n of r.coordinates) {
				let i = n[0];
				if (i && (this.pointInRing(t, i) || this.pixelNearPolyline(e, i, 10))) return r;
			}
		}
		return null;
	}
	pixelNearPolyline(e, t, n) {
		for (let r = 0; r < t.length - 1; r++) {
			let i = this.adapter.project(t[r]), a = this.adapter.project(t[r + 1]);
			if (this.distToSegment(e, i, a) < n) return !0;
		}
		return !1;
	}
	distToSegment(e, t, n) {
		let r = n[0] - t[0], i = n[1] - t[1];
		if (r === 0 && i === 0) return Math.hypot(e[0] - t[0], e[1] - t[1]);
		let a = Math.max(0, Math.min(1, ((e[0] - t[0]) * r + (e[1] - t[1]) * i) / (r * r + i * i)));
		return Math.hypot(e[0] - (t[0] + a * r), e[1] - (t[1] + a * i));
	}
	pointInRing(e, t) {
		let n = !1;
		for (let r = 0, i = t.length - 1; r < t.length; i = r++) {
			let a = t[r][0], o = t[r][1], s = t[i][0], c = t[i][1];
			o > e[1] != c > e[1] && e[0] < (s - a) * (e[1] - o) / (c - o) + a && (n = !n);
		}
		return n;
	}
	dispatch(e, t) {
		(this.isConnected ? this : this.boundMap)?.dispatchEvent(new CustomEvent(e, {
			detail: t,
			bubbles: !0,
			composed: !0
		}));
	}
	updateHelpTextDuring() {
		let e = this.draftPoints.length;
		this.mode === "draw-line" || this.mode === "draw-line-dashed" ? this.helpText = `${e} pt${e === 1 ? "" : "s"}. Double-click or right-click to finish.` : this.mode === "draw-polygon" && (this.helpText = e >= 3 ? `${e} pts. Click first point, double-click, or right-click to close.` : `${e} pt${e === 1 ? "" : "s"}. Need at least 3 to close.`);
	}
	renderTypeGrid(e) {
		return s`
            <div class="type-grid">
                ${[
			"Point",
			"LineString",
			"Polygon"
		].map((t) => s`
                    <button type="button" class="type-card" data-type=${t} ?active=${t === e} aria-pressed=${t === e ? "true" : "false"} @click=${() => this.selectType(t)}>
                        <span class="type-icon">${Dt(t)}</span>
                        <span class="type-name">${Yt(t)}</span>
                        <span class="type-count">${this.layerCountLabel(t)}</span>
                    </button>
                `)}
            </div>
        `;
	}
	renderTypePicker() {
		return s`
            ${this.showDrawIntro ? s`<div class="flow-heading">What do you want to draw or edit?</div>` : ""}
            ${this.renderTypeGrid(null)}
        `;
	}
	layerCountLabel(e) {
		let t = this.drawLayers.filter((t) => t.type === e).length + (this.catalogLayerCounts[e] ?? 0);
		return `${t} layer${t === 1 ? "" : "s"}`;
	}
	renderLayerPicker() {
		let e = this.pickedType, t = this.drawLayers.filter((t) => t.type === e), n = this.catalogLayerOptions, r = Gt(e), i = t.length === 0 && n.length === 0, a = e === "Point" ? "flex-start" : e === "LineString" ? "center" : "flex-end";
		return s`
            ${this.showDrawIntro ? s`<div class="flow-heading">What do you want to draw or edit?</div>` : ""}
            ${this.renderTypeGrid(e)}
            <div class="layer-picker-header" style="justify-content:${a}">
                <sl-button variant="default" size="small" class="add-layer-btn" @click=${() => this.createNewLayer()}>
                    <sl-icon slot="prefix" name="plus-lg"></sl-icon>
                    New layer
                </sl-button>
            </div>
            ${i ? s`<p class="empty-state">No ${r.toLowerCase()} layers yet.</p>` : s`
                <div class="layer-list">
                    ${t.length > 0 ? s`
                        ${n.length > 0 ? s`<div class="section-label">Your layers</div>` : ""}
                        <div class="layer-group">
                            ${t.map((e) => s`
                                <div class="layer-row">
                                    <span class="color-dot color-dot--${Kt(e.type)}" style="${qt(this.currentDrawLayerColor(e), e.type)}"></span>
                                    <span class="layer-name-wrap">
                                        <span class="layer-name">${e.name || "(untitled)"}</span>
                                        <span class="feature-count">(${this.features.filter((t) => t.layerId === e.id).length} features)</span>
                                    </span>
                                    <sl-button size="small" variant="primary" @click=${() => this.startEditingLayer(e)}>Edit</sl-button>
                                    <sl-tooltip content="Remove layer">
                                        <sl-icon-button name="trash" class="remove-layer-btn" label="Remove ${e.name}"
                                            @click=${(t) => {
			t.stopPropagation(), this.releaseLayer(e);
		}}>
                                        </sl-icon-button>
                                    </sl-tooltip>
                                </div>
                            `)}
                        </div>
                    ` : ""}
                    ${n.length > 0 ? s`
                        <div class="section-label" style=${t.length > 0 ? "margin-top:.5rem" : ""}>From the catalog</div>
                        <div class="layer-group">
                            ${n.map((t) => s`
                                <div class="layer-row">
                                    <span class="color-dot color-dot--${Kt(e)}" style="${qt(At, e)}"></span>
                                    <span class="layer-name-wrap">
                                        <span class="layer-name">${t.label}</span>
                                    </span>
                                    <sl-button size="small" variant="primary" @click=${() => {
			this.pendingCatalogEditOption = t;
		}}>Edit</sl-button>
                                </div>
                            `)}
                        </div>
                    ` : ""}
                </div>
            `}

            <sl-dialog label="Edit ${this.pendingCatalogEditOption?.label ?? ""}?"
                ?open=${this.pendingCatalogEditOption !== null}
                @sl-request-close=${() => this.cancelEditCatalogLayer()}>
                ${this.pendingCatalogEditOption ? s`
                    You are about to create and edit a copy of &ldquo;${this.pendingCatalogEditOption.label}&rdquo;.
                    The original stays on the map, hidden in the Legend &mdash; you can show it again anytime.
                ` : ""}
                <sl-button slot="footer" @click=${() => this.cancelEditCatalogLayer()}>Cancel</sl-button>
                <sl-button slot="footer" variant="primary"
                    @click=${() => {
			this.pendingCatalogEditOption && this.startEditingCatalogLayer(this.pendingCatalogEditOption);
		}}>
                    Create a copy and edit
                </sl-button>
            </sl-dialog>
        `;
	}
	renderEditingSession() {
		let e = this.pickedType, t = this.activeLayerIds[e], n = this.drawLayers.find((e) => e.id === t), r = Z(e), i = this.features.find((e) => e.id === this.selectedFeatureId), a = i ? this.drawLayers.find((e) => e.id === i.layerId) : null, o = t ? this.features.some((e) => e.layerId === t) : !1;
		return s`
            ${n ? s`
                <div class="editing-title-row">
                    <span class="editing-title-label">You are editing:</span>
                    <div class="editing-title-second-row">
                        <span class="color-swatch-wrap">
                            <span class="color-swatch color-swatch--${Kt(n.type)}" style="${qt(this.currentDrawLayerColor(n), n.type)}"
                                title="Layer color — style it from the Legend" aria-label="Layer color">
                            </span>
                        </span>
                        <sl-input class="editing-layer-name${this.layerNameInvalid ? " name-invalid" : ""}" size="small" aria-label="Layer name" title="Click to rename"
                            .value=${this.layerNameDraft ?? n.name}
                            @sl-input=${(e) => {
			this.layerNameDraft = e.target.value;
		}}
                            @keydown=${(e) => {
			e.key === "Enter" ? this.commitLayerNameEdit(n) : e.key === "Escape" && this.cancelLayerNameEdit();
		}}>
                            ${this.layerNameDraft === null ? s`
                                <sl-icon slot="suffix" name="pencil" class="editing-layer-name-icon"
                                    @click=${() => this.editingLayerNameInput?.select()}></sl-icon>
                            ` : s`
                                <sl-icon-button slot="suffix" name="check-lg" label="Save name"
                                    class="editing-layer-name-confirm"
                                    ?disabled=${!this.layerNameDraftValid()}
                                    @click=${() => this.commitLayerNameEdit(n)}>
                                </sl-icon-button>
                                <sl-icon-button slot="suffix" name="x-lg" label="Cancel rename"
                                    class="editing-layer-name-confirm"
                                    @click=${() => this.cancelLayerNameEdit()}>
                                </sl-icon-button>
                            `}
                        </sl-input>
                    </div>
                </div>
            ` : ""}

            <div class="toolbar-row">
                <span class="toolbar-label">Draw</span>
                <div class="pill">
                    ${this.toggleButton({
			icon: e === "Point" ? "geo-fill" : e === "LineString" ? "slash-lg" : "pentagon",
			label: `Draw ${Gt(e).toLowerCase()}`,
			pressed: this.mode === r,
			onClick: () => this.setModeInternal(r)
		})}
                    ${e === "LineString" ? s`
                        ${this.toggleButton({
			src: ut,
			name: "dash-line",
			label: "Draw dashed lines",
			pressed: this.mode === "draw-line-dashed",
			onClick: () => this.setModeInternal("draw-line-dashed")
		})}
                    ` : ""}
                    ${e === "Polygon" ? s`
                        ${this.toggleButton({
			icon: "circle",
			label: "Draw circles",
			pressed: this.mode === "draw-circle",
			onClick: () => this.setModeInternal("draw-circle")
		})}
                        ${this.toggleButton({
			icon: "square",
			label: "Draw rectangles",
			pressed: this.mode === "draw-rectangle",
			onClick: () => this.setModeInternal("draw-rectangle")
		})}
                    ` : ""}
                </div>
                ${this.isDrawMode() ? s`
                    <div class="history-actions">
                        <sl-tooltip content="Undo (${this.modKey}+Z)">
                            <sl-icon-button name="arrow-counterclockwise" size="small" label="Undo"
                                ?disabled=${this.drawHistoryIndex < 0 && this.draftPoints.length === 0}
                                @click=${() => this.undoOrDraftBack()}>
                            </sl-icon-button>
                        </sl-tooltip>
                        <sl-tooltip content="Redo (${this.modKey}+Y)">
                            <sl-icon-button name="arrow-clockwise" size="small" label="Redo"
                                ?disabled=${this.drawHistoryIndex >= this.drawHistory.length - 1 && this.draftRedoStack.length === 0}
                                @click=${() => this.redoOrDraftForward()}>
                            </sl-icon-button>
                        </sl-tooltip>
                        <div class="divider"></div>
                        <sl-tooltip content=${this.draftPoints.length > 0 ? "Remove last point" : "Delete this feature"}>
                            <sl-icon-button name="trash" size="small" class="delete-feature-btn"
                                label=${this.draftPoints.length > 0 ? "Remove last point" : "Delete this feature"}
                                ?disabled=${this.draftPoints.length === 0 && !this.selectedFeatureId}
                                @click=${() => this.draftPoints.length > 0 ? this.removeLastDraftPoint() : this.deleteJustDrawnFeature()}>
                            </sl-icon-button>
                        </sl-tooltip>
                    </div>
                ` : ""}
            </div>

            ${o || this.moveHistoryIndex >= 0 ? s`
                <div class="toolbar-row">
                    <span class="toolbar-label">Edit</span>
                    <div class="pill">
                        ${this.toggleButton({
			icon: "arrows-move",
			label: "Move features",
			tooltip: "Click a feature to select it, or drag it directly to move it",
			pressed: this.mode === "edit-move",
			disabled: !o,
			onClick: () => this.setModeInternal("edit-move")
		})}
                        ${this.toggleButton({
			src: e === "Polygon" ? pt : ft,
			name: "edit-vertices",
			label: "Edit points",
			tooltip: "Click a feature to edit its points",
			pressed: this.mode === "edit-vertices",
			disabled: !o,
			onClick: () => this.setModeInternal("edit-vertices")
		})}
                        ${this.toggleButton({
			src: mt,
			name: "feature-values",
			label: "Edit attributes",
			tooltip: "Hover a feature, then click it to view or edit its attributes",
			pressed: this.mode === "attributes",
			disabled: !o,
			onClick: () => this.setModeInternal("attributes")
		})}
                    </div>
                    ${this.isEditMode() ? s`
                        <div class="history-actions">
                            <sl-tooltip content="Undo (${this.modKey}+Z)">
                                <sl-icon-button name="arrow-counterclockwise" size="small" label="Undo"
                                    ?disabled=${this.moveHistoryIndex < 0}
                                    @click=${() => this.undoMove()}>
                                </sl-icon-button>
                            </sl-tooltip>
                            <sl-tooltip content="Redo (${this.modKey}+Y)">
                                <sl-icon-button name="arrow-clockwise" size="small" label="Redo"
                                    ?disabled=${this.moveHistoryIndex >= this.moveHistory.length - 1}
                                    @click=${() => this.redoMove()}>
                                </sl-icon-button>
                            </sl-tooltip>
                            ${this.mode === "edit-vertices" ? s`
                                <div class="divider"></div>
                                <sl-tooltip content="Delete selected point">
                                    <sl-icon-button name="trash" size="small" class="delete-feature-btn" label="Delete selected point"
                                        ?disabled=${!this.selectedHandle}
                                        @click=${() => this.deleteSelectedVertex()}>
                                    </sl-icon-button>
                                </sl-tooltip>
                            ` : ""}
                        </div>
                    ` : ""}
                </div>
            ` : ""}

            ${o || this.moveHistoryIndex >= 0 ? s`
                <div class="toolbar-row">
                    <span class="toolbar-label">Delete</span>
                    <div class="pill">
                        ${this.toggleButton({
			icon: "hand-index-thumb",
			label: "Select features by clicking",
			tooltip: "Click a feature to delete it",
			pressed: this.mode === "select",
			disabled: !o,
			onClick: () => this.setModeInternal("select")
		})}
                        ${this.toggleButton({
			src: dt,
			name: "rect-select",
			label: "Select features in a rectangle",
			tooltip: "Drag a rectangle to delete the features inside it",
			pressed: this.mode === "select-rect",
			disabled: !o,
			onClick: () => this.setModeInternal("select-rect")
		})}
                        ${this.toggleButton({
			src: ht,
			name: "lasso-select",
			label: "Select features in a free-hand shape",
			tooltip: "Draw a free-hand shape to delete the features inside it",
			pressed: this.mode === "select-lasso",
			disabled: !o,
			onClick: () => this.setModeInternal("select-lasso")
		})}
                    </div>
                    ${this.isSelectMode() ? s`
                        <div class="history-actions">
                            <sl-tooltip content="Undo (${this.modKey}+Z)">
                                <sl-icon-button name="arrow-counterclockwise" size="small" label="Undo"
                                    ?disabled=${this.moveHistoryIndex < 0}
                                    @click=${() => this.undoMove()}>
                                </sl-icon-button>
                            </sl-tooltip>
                            <sl-tooltip content="Redo (${this.modKey}+Y)">
                                <sl-icon-button name="arrow-clockwise" size="small" label="Redo"
                                    ?disabled=${this.moveHistoryIndex >= this.moveHistory.length - 1}
                                    @click=${() => this.redoMove()}>
                                </sl-icon-button>
                            </sl-tooltip>
                            <div class="divider"></div>
                            <sl-tooltip content=${this.selectedFeatureIds.length > 1 ? `Delete ${this.selectedFeatureIds.length} selected` : "Delete selected"}>
                                <sl-icon-button name="trash" size="small" class="delete-feature-btn"
                                    label=${this.selectedFeatureIds.length > 1 ? `Delete ${this.selectedFeatureIds.length} selected` : "Delete selected"}
                                    ?disabled=${this.selectedFeatureIds.length === 0}
                                    @click=${() => this.deleteSelected()}>
                                </sl-icon-button>
                            </sl-tooltip>
                        </div>
                    ` : ""}
                </div>
            ` : ""}

            <div class="toolbar-row">
                <span class="toolbar-label">Tools</span>
                <div class="pill">
                    ${this.toggleButton({
			icon: "magnet",
			label: "Snap to points and edges",
			tooltip: `Snap to points and edges (${this.snapEnabled ? "on" : "off"}) — hold Alt to toggle`,
			pressed: this.effectiveSnap,
			onClick: () => {
				this.snapEnabled = !this.snapEnabled, this.snapEnabled || (this.snapPos = null, this.updateRubberband());
			}
		})}
                </div>
            </div>

            <div class="help">${this.helpText}</div>

            ${this.isTouchDevice && (this.mode === "draw-line" || this.mode === "draw-line-dashed" || this.mode === "draw-polygon") && this.draftPoints.length >= (this.mode === "draw-polygon" ? 3 : 2) ? s`
                <sl-button size="small" variant="primary" style="margin-bottom:.4rem;width:100%"
                    @click=${() => {
			let e = Wt(this.mode), t = e ? this.activeLayerIds[e] : null;
			t && this.finishDraft(t);
		}}>
                    Finish
                </sl-button>
            ` : ""}

            ${i && a ? s`
                <div class="prop-row" style="margin-top:.5rem">
                    <span class="prop-label section-label" style="margin-bottom:0">Attribute</span>
                    <span class="prop-value section-label" style="margin-bottom:0">Value</span>
                </div>
                ${a.properties.map((e) => s`
                    <div class="prop-row" data-attr-name=${e.name}>
                        <span class="prop-label">${e.name}</span>
                        ${e.name === "id" || [
			"longitude",
			"latitude",
			"area",
			"perimeter",
			"length",
			"create-time",
			"update-time"
		].includes(e.type) ? s`<span class="prop-value" style="color:var(--color-text-muted, #6b7681);font-style:italic;padding:0 0.3rem">${["create-time", "update-time"].includes(e.type) ? i.properties[e.name] ? new Date(i.properties[e.name]).toLocaleString() : "—" : i.properties[e.name] ?? "—"}</span>` : e.type === "imageURL" ? s`<div class="prop-url-wrap">
                                        <sl-input size="small"
                                            .value=${String(i.properties[e.name] ?? "")}
                                            placeholder="image URL"
                                            @sl-focus=${() => {
			this.lastFocusedAttributeName = e.name;
		}}
                                            @sl-change=${(t) => {
			i.properties[e.name] = t.target.value, a && this.computeSpecialProperties(i, a), this.features = [...this.features], this.refreshDrawLayerSource(i.layerId);
		}}></sl-input>
                                        ${i.properties[e.name] ? s`<img class="prop-img" src=${String(i.properties[e.name])} @error=${(e) => {
			let t = e.target, n = document.createElement("span");
			n.className = "prop-img-error", n.textContent = "⚠ invalid image", t.replaceWith(n);
		}}>` : ""}
                                       </div>` : e.type === "linkURL" ? s`<div class="prop-url-wrap">
                                            <sl-input size="small"
                                                .value=${String(i.properties[e.name] ?? "")}
                                                placeholder="link URL"
                                                @sl-focus=${() => {
			this.lastFocusedAttributeName = e.name;
		}}
                                                @sl-change=${(t) => {
			i.properties[e.name] = t.target.value, a && this.computeSpecialProperties(i, a), this.features = [...this.features], this.refreshDrawLayerSource(i.layerId);
		}}></sl-input>
                                            ${i.properties[e.name] ? s`<a class="prop-link" href=${String(i.properties[e.name])} target="_blank" rel="noopener noreferrer">${i.properties[e.name]}</a>` : ""}
                                           </div>` : s`<sl-input size="small" class="prop-value"
                                            .value=${String(i.properties[e.name] ?? "")}
                                            @sl-focus=${() => {
			this.lastFocusedAttributeName = e.name;
		}}
                                            @sl-change=${(t) => {
			i.properties[e.name] = t.target.value, a && this.computeSpecialProperties(i, a), this.features = [...this.features], this.refreshDrawLayerSource(i.layerId);
		}}></sl-input>`}
                    </div>
                `)}
            ` : ""}

            ${n ? s`
                <sl-dialog id="attributes-dialog" label="Attributes">
                    <div class="prop-table-wrap">
                        <div class="prop-grid" role="table">
                            <div class="prop-grid-row prop-grid-header" role="row">
                                <span class="prop-grid-cell" role="columnheader">Attribute</span>
                                <span class="prop-grid-cell" role="columnheader">Type</span>
                                <span class="prop-grid-cell" role="columnheader"></span>
                            </div>
                            ${n.properties.map((e, t) => s`
                                <div class="prop-grid-row ${e.name === "id" ? "prop-row-auto" : ""}" role="row">
                                    <span class="prop-grid-cell" role="cell">
                                        ${this.renamingAttributeIndex === t ? s`
                                            <div class="rename-attr-row">
                                                <sl-input size="small" autofocus
                                                    .value=${this.renameAttrDraft}
                                                    @sl-input=${(e) => {
			this.renameAttrDraft = e.target.value;
		}}
                                                    @keydown=${(e) => {
			e.key === "Enter" ? this.commitRenameAttribute(n, t) : e.key === "Escape" && this.cancelRenameAttribute();
		}}>
                                                </sl-input>
                                                <sl-icon-button name="check-lg" label="Save name"
                                                    ?disabled=${!this.renameAttributeDraftValid(n, t)}
                                                    @click=${() => this.commitRenameAttribute(n, t)}>
                                                </sl-icon-button>
                                                <sl-icon-button name="x-lg" label="Cancel rename"
                                                    @click=${() => this.cancelRenameAttribute()}>
                                                </sl-icon-button>
                                            </div>
                                        ` : s`
                                            <div class="prop-name-cell">
                                                <span class="prop-cell-text" title=${e.name}>${e.name}</span>
                                                ${this.canRenameAttribute(e) ? s`
                                                    <sl-icon-button name="pencil" class="rename-attr-btn" label="Rename property"
                                                        @click=${() => this.startRenameAttribute(t, e.name)}>
                                                    </sl-icon-button>
                                                ` : ""}
                                            </div>
                                        `}
                                    </span>
                                    <span class="prop-grid-cell" role="cell">
                                        <span class="prop-cell-text" title=${e.type}>${tt[e.type] ?? e.type}${e.name === "id" ? " (auto)" : ""}</span>
                                    </span>
                                    <span class="prop-grid-cell prop-grid-cell--actions" role="cell">
                                        ${t === 0 || this.renamingAttributeIndex === t ? "" : s`
                                            <sl-icon-button name="trash" class="remove-attr-btn" label="Remove property"
                                                @click=${() => this.removeActiveLayerProperty(n, t)}>
                                            </sl-icon-button>
                                        `}
                                    </span>
                                </div>
                            `)}
                        </div>
                    </div>

                    ${this.addingAttribute ? s`
                        <div class="add-attr-form">
                            <div class="add-attr-fields-row">
                                <sl-input size="small" class="add-attr-name-input" placeholder="Add attribute name" aria-label="Attribute name" autofocus
                                    .value=${this.newAttrName}
                                    @sl-input=${(e) => {
			this.newAttrName = e.target.value;
		}}
                                    @keydown=${(e) => e.key === "Enter" && this.newAttrName.trim() && this.addActiveLayerProperty(n)}>
                                </sl-input>
                                ${this.newAttrName.trim() ? s`
                                    <sl-select size="small" hoist class="add-attr-type-select" placeholder="Choose a type" aria-label="Attribute type" value=${this.newAttrType}
                                        @sl-change=${(e) => {
			this.newAttrType = e.target.value;
		}}>
                                        ${nt[n.type].filter((e) => !rt.has(e)).map((e) => s`
                                            <sl-option value=${e}>${tt[e] ?? e}</sl-option>
                                        `)}
                                    </sl-select>
                                ` : ""}
                                <sl-button size="small" variant="primary"
                                    ?disabled=${!(this.newAttrName.trim() && this.newAttrType)}
                                    @click=${() => this.addActiveLayerProperty(n)}>
                                    OK
                                </sl-button>
                                <sl-icon-button name="x-lg" label="Cancel" @click=${() => this.cancelAddAttribute()}></sl-icon-button>
                            </div>
                            <div class="add-attr-undo-row">${this.renderAttributeUndoRedo(n)}</div>
                            <div class="add-attr-note">New attributes are added to the bottom of the list above.</div>
                        </div>
                    ` : s`
                        <div class="add-attr-row">
                            <sl-button variant="default" size="small" class="add-attr-btn-below"
                                @click=${() => {
			this.addingAttribute = !0;
		}}>
                                <sl-icon slot="prefix" name="plus-lg"></sl-icon>
                                Add attribute
                            </sl-button>
                            ${this.renderAttributeUndoRedo(n)}
                        </div>
                    `}

                    <sl-dropdown slot="footer" placement="top-start" class="optional-attrs-dropdown">
                        <sl-button slot="trigger" size="small" caret class="optional-attrs-trigger">
                            Optional attributes
                        </sl-button>
                        <div class="auto-attr-dropdown-panel">
                            ${this.availableAutoAttributeTypes(n).map((e) => s`
                                <label class="auto-attr-checkbox">
                                    <input type="checkbox"
                                        .checked=${this.isAutoAttributeChecked(n, e)}
                                        @change=${() => this.toggleAutoAttribute(n, e)}>
                                    ${j[e]?.label ?? e}
                                </label>
                            `)}
                        </div>
                    </sl-dropdown>
                    <sl-button slot="footer" size="small" variant="primary" @click=${() => this.attributesDialog?.hide()}>Done</sl-button>
                </sl-dialog>
            ` : ""}
        `;
	}
	renderSessionFooter() {
		let e = this.pickedType, t = this.activeLayerIds[e], n = this.drawLayers.find((e) => e.id === t);
		return n ? s`
            <div class="session-footer">
                <sl-button variant="default" size="small" @click=${() => this.attributesDialog?.show()}>
                    <sl-icon slot="prefix" name="table"></sl-icon>
                    Edit attributes (${n.properties.length})
                </sl-button>
                <span class="footer-spacer"></span>
                ${this.layerNameInvalid ? s`<span class="name-required-hint">Give the new layer a name.</span>` : ""}
                <sl-button size="small" variant="primary" @click=${() => this.confirmDone()}>Done</sl-button>
            </div>
        ` : "";
	}
	toggleButton(e) {
		let { icon: t, src: n, label: r, pressed: i, disabled: a = !1, tooltip: o = r, onClick: c } = e;
		return s`
            <sl-tooltip content=${o}>
                <button type="button" class="toggle-button" name=${e.name ?? t ?? ""}
                    aria-label=${r} aria-pressed=${i ? "true" : "false"}
                    ?disabled=${a}
                    @click=${c}>
                    ${n ? s`<sl-icon src=${n} aria-hidden="true"></sl-icon>` : s`<sl-icon name=${t} aria-hidden="true"></sl-icon>`}
                </button>
            </sl-tooltip>`;
	}
	render() {
		return s`
            <div class="scroll-content">
                ${this.panelView === "type" ? this.renderTypePicker() : this.panelView === "layers" ? this.renderLayerPicker() : this.renderEditingSession()}
            </div>
            ${this.panelView === "editing" ? this.renderSessionFooter() : ""}
        `;
	}
};
u([r()], X.prototype, "mode", void 0), u([r()], X.prototype, "drawLayers", void 0), u([r()], X.prototype, "features", void 0), u([r()], X.prototype, "selectedFeatureId", void 0), u([r()], X.prototype, "selectedFeatureIds", void 0), u([r()], X.prototype, "hoveredFeatureId", void 0), u([r()], X.prototype, "helpText", void 0), u([r()], X.prototype, "pendingMode", void 0), u([r()], X.prototype, "uiVersion", void 0), u([r()], X.prototype, "panelView", void 0), u([r()], X.prototype, "pickedType", void 0), u([r()], X.prototype, "showDrawIntro", void 0), u([r()], X.prototype, "catalogLayerOptions", void 0), u([r()], X.prototype, "catalogLayerCounts", void 0), u([r()], X.prototype, "pendingCatalogEditOption", void 0), u([r()], X.prototype, "isTouchDevice", void 0), u([r()], X.prototype, "snapEnabled", void 0), u([r()], X.prototype, "altActive", void 0), u([r()], X.prototype, "editState", void 0), u([a("#attributes-dialog")], X.prototype, "attributesDialog", void 0), u([a(".editing-layer-name")], X.prototype, "editingLayerNameInput", void 0), u([r()], X.prototype, "layerNameInvalid", void 0), u([r()], X.prototype, "layerNameDraft", void 0), u([r()], X.prototype, "addingAttribute", void 0), u([r()], X.prototype, "newAttrName", void 0), u([r()], X.prototype, "newAttrType", void 0), u([r()], X.prototype, "removedAttributeStack", void 0), u([r()], X.prototype, "removedAttributeRedoStack", void 0), u([r()], X.prototype, "renamingAttributeIndex", void 0), u([r()], X.prototype, "renameAttrDraft", void 0), X = u([o("webmapx-draw-tool")], X);
function Wt(e) {
	return e === "draw-point" ? "Point" : e === "draw-line" || e === "draw-line-dashed" ? "LineString" : e === "draw-polygon" || e === "draw-circle" || e === "draw-rectangle" ? "Polygon" : null;
}
function Z(e) {
	return e === "Point" ? "draw-point" : e === "LineString" ? "draw-line" : "draw-polygon";
}
function Q(e) {
	return e === "draw-point" || e === "draw-line" || e === "draw-line-dashed" || e === "draw-polygon";
}
function Gt(e) {
	return e === "Point" ? "Points" : e === "LineString" ? "Lines" : "Polygons";
}
function Kt(e) {
	return e === "Point" ? "point" : e === "LineString" ? "line" : "polygon";
}
function qt(e, t) {
	return t === "Polygon" ? `border-color:${e};background:${e}33` : `background:${e}`;
}
function Jt(e) {
	let t = e.trim();
	return t === L || RegExp(`^${L} \\(\\d+\\)$`).test(t);
}
function Yt(e) {
	return `Layer with ${Gt(e).toLowerCase()}`;
}
function Xt(e) {
	return e === "Point" || e === "MultiPoint" || e === "LineString" || e === "MultiLineString" || e === "Polygon" || e === "MultiPolygon";
}
function $(e) {
	return e === "Point" || e === "MultiPoint";
}
function Zt(e) {
	return e === "LineString" || e === "MultiLineString";
}
//#endregion
export { X as WebmapxDrawTool };
