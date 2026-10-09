import { a as e, h as t, i as n, l as r, n as i, o as a, p as o, r as s, s as c } from "./decorators-d8E4nZJy.js";
import { t as l } from "./decorate-Bl-DXcQA.js";
import { t as u } from "./webmapx-modal-tool-CvWzMu9K.js";
import { a as d, i as f, o as p, s as m } from "./directive-helpers-Debt3Tx3.js";
import { a as h, i as g, o as ee, s as te, t as ne } from "./chunk.AJ3ENQ5C-CwL2xu8w.js";
import { t as re } from "./chunk.YHLNUJ7P-BjspQfLm.js";
import { a as ie, i as ae, n as _, o as oe, r as v } from "./chunk.NYIIDP5N-gftugmWL.js";
import { t as se } from "./chunk.6CTB5ZDJ-DjZrBd6Y.js";
import "./chunk.36O46B5H-CNPWSZFH.js";
import { t as ce } from "./chunk.3RPBFEDE-DBlOq5Pm.js";
import "./chunk.MAQXLKQ7-BSeX409m.js";
import { t as le } from "./button-DE9ytwxI.js";
import { n as ue } from "./live-BR4apkFB.js";
import "./chunk.SI4ACBFK-CdJVQctt.js";
import { n as de, t as fe } from "./dialog-DHGOXEHq.js";
import "./icon-Qf3FyAAL.js";
import { gt as pe, pt as me } from "./zip-reader-Bai44Y8Q.js";
import { t as he } from "./control-surface-styles-zbl1JfZH.js";
import { t as y } from "./chunk.HF7GESMZ-DTzcQjL1.js";
import { t as ge } from "./input-eCCT7kEl.js";
import { a as _e, i as ve, r as ye } from "./tooltip-BpVD9b5o.js";
import { a as b, i as x } from "./data-colors-BglhXRFr.js";
import { t as be } from "./zip.js-CnrAYY-x.js";
import "./icon-button-DxwGf0BN.js";
import { t as xe } from "./chunk.5JY5FUCG-dkh_eGt_.js";
import { a as Se, i as Ce, t as we } from "./geo-calculations-DcpPxqU9.js";
import { t as Te } from "./radio-group-DcrmsMH6.js";
import "./option-C8qYanYH.js";
import { r as S } from "./map-layer-registry-LK1CJS-X.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.FKMWLPHV.js
var Ee = t`
  :host {
    display: block;
  }

  :host(:focus-visible) {
    outline: 0px;
  }

  .radio {
    display: inline-flex;
    align-items: top;
    font-family: var(--sl-input-font-family);
    font-size: var(--sl-input-font-size-medium);
    font-weight: var(--sl-input-font-weight);
    color: var(--sl-input-label-color);
    vertical-align: middle;
    cursor: pointer;
  }

  .radio--small {
    --toggle-size: var(--sl-toggle-size-small);
    font-size: var(--sl-input-font-size-small);
  }

  .radio--medium {
    --toggle-size: var(--sl-toggle-size-medium);
    font-size: var(--sl-input-font-size-medium);
  }

  .radio--large {
    --toggle-size: var(--sl-toggle-size-large);
    font-size: var(--sl-input-font-size-large);
  }

  .radio__checked-icon {
    display: inline-flex;
    width: var(--toggle-size);
    height: var(--toggle-size);
  }

  .radio__control {
    flex: 0 0 auto;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--toggle-size);
    height: var(--toggle-size);
    border: solid var(--sl-input-border-width) var(--sl-input-border-color);
    border-radius: 50%;
    background-color: var(--sl-input-background-color);
    color: transparent;
    transition:
      var(--sl-transition-fast) border-color,
      var(--sl-transition-fast) background-color,
      var(--sl-transition-fast) color,
      var(--sl-transition-fast) box-shadow;
  }

  .radio__input {
    position: absolute;
    opacity: 0;
    padding: 0;
    margin: 0;
    pointer-events: none;
  }

  /* Hover */
  .radio:not(.radio--checked):not(.radio--disabled) .radio__control:hover {
    border-color: var(--sl-input-border-color-hover);
    background-color: var(--sl-input-background-color-hover);
  }

  /* Checked */
  .radio--checked .radio__control {
    color: var(--sl-color-neutral-0);
    border-color: var(--sl-color-primary-600);
    background-color: var(--sl-color-primary-600);
  }

  /* Checked + hover */
  .radio.radio--checked:not(.radio--disabled) .radio__control:hover {
    border-color: var(--sl-color-primary-500);
    background-color: var(--sl-color-primary-500);
  }

  /* Checked + focus */
  :host(:focus-visible) .radio__control {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  /* Disabled */
  .radio--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* When the control isn't checked, hide the circle for Windows High Contrast mode a11y */
  .radio:not(.radio--checked) svg circle {
    opacity: 0;
  }

  .radio__label {
    display: inline-block;
    color: var(--sl-input-label-color);
    line-height: var(--toggle-size);
    margin-inline-start: 0.5em;
    user-select: none;
    -webkit-user-select: none;
  }
`, C = class extends f {
	constructor() {
		super(), this.checked = !1, this.hasFocus = !1, this.size = "medium", this.disabled = !1, this.handleBlur = () => {
			this.hasFocus = !1, this.emit("sl-blur");
		}, this.handleClick = () => {
			this.disabled || (this.checked = !0);
		}, this.handleFocus = () => {
			this.hasFocus = !0, this.emit("sl-focus");
		}, this.addEventListener("blur", this.handleBlur), this.addEventListener("click", this.handleClick), this.addEventListener("focus", this.handleFocus);
	}
	connectedCallback() {
		super.connectedCallback(), this.setInitialAttributes();
	}
	setInitialAttributes() {
		this.setAttribute("role", "radio"), this.setAttribute("tabindex", "-1"), this.setAttribute("aria-disabled", this.disabled ? "true" : "false");
	}
	handleCheckedChange() {
		this.setAttribute("aria-checked", this.checked ? "true" : "false"), this.setAttribute("tabindex", this.checked ? "0" : "-1");
	}
	handleDisabledChange() {
		this.setAttribute("aria-disabled", this.disabled ? "true" : "false");
	}
	render() {
		return o`
      <span
        part="base"
        class=${v({
			radio: !0,
			"radio--checked": this.checked,
			"radio--disabled": this.disabled,
			"radio--focused": this.hasFocus,
			"radio--small": this.size === "small",
			"radio--medium": this.size === "medium",
			"radio--large": this.size === "large"
		})}
      >
        <span part="${`control${this.checked ? " control--checked" : ""}`}" class="radio__control">
          ${this.checked ? o` <sl-icon part="checked-icon" class="radio__checked-icon" library="system" name="radio"></sl-icon> ` : ""}
        </span>

        <slot part="label" class="radio__label"></slot>
      </span>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.MSKEYBDI.js
C.styles = [d, Ee], C.dependencies = { "sl-icon": re }, m([n()], C.prototype, "checked", 2), m([n()], C.prototype, "hasFocus", 2), m([e()], C.prototype, "value", 2), m([e({ reflect: !0 })], C.prototype, "size", 2), m([e({
	type: Boolean,
	reflect: !0
})], C.prototype, "disabled", 2), m([p("checked")], C.prototype, "handleCheckedChange", 1), m([p("disabled", { waitUntilFirstUpdate: !0 })], C.prototype, "handleDisabledChange", 1), C.define("sl-radio");
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.YKKSQ2FG.js
var De = t`
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
`, w = class extends f {
	render() {
		return o` <slot></slot> `;
	}
};
w.styles = [d, De];
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.ESELY2US.js
function T(e, t) {
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
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.LXP7GVU3.js
var Oe = t`
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
`, E = class extends f {
	constructor() {
		super(...arguments), this.localize = new se(this), this.open = !1, this.placement = "bottom-start", this.disabled = !1, this.stayOpenOnSelect = !1, this.distance = 0, this.skidding = 0, this.hoist = !1, this.sync = void 0, this.handleKeyDown = (e) => {
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
					let e = this.containingElement?.getRootNode() instanceof ShadowRoot ? fe() : document.activeElement;
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
		let e = this.trigger.assignedElements({ flatten: !0 }).find((e) => de(e).start), t;
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
		if (!this.open) return this.open = !0, h(this, "sl-after-show");
	}
	async hide() {
		if (this.open) return this.open = !1, h(this, "sl-after-hide");
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
			this.emit("sl-show"), this.addOpenListeners(), await g(this), this.panel.hidden = !1, this.popup.active = !0;
			let { keyframes: e, options: t } = ee(this, "dropdown.show", { dir: this.localize.dir() });
			await ne(this.popup.popup, e, t), this.emit("sl-after-show");
		} else {
			this.emit("sl-hide"), this.removeOpenListeners(), await g(this);
			let { keyframes: e, options: t } = ee(this, "dropdown.hide", { dir: this.localize.dir() });
			await ne(this.popup.popup, e, t), this.panel.hidden = !0, this.popup.active = !1, this.emit("sl-after-hide");
		}
	}
	render() {
		return o`
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
        sync=${_(this.sync ? this.sync : void 0)}
        class=${v({
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
E.styles = [d, Oe], E.dependencies = { "sl-popup": xe }, m([i(".dropdown")], E.prototype, "popup", 2), m([i(".dropdown__trigger")], E.prototype, "trigger", 2), m([i(".dropdown__panel")], E.prototype, "panel", 2), m([e({
	type: Boolean,
	reflect: !0
})], E.prototype, "open", 2), m([e({ reflect: !0 })], E.prototype, "placement", 2), m([e({
	type: Boolean,
	reflect: !0
})], E.prototype, "disabled", 2), m([e({
	attribute: "stay-open-on-select",
	type: Boolean,
	reflect: !0
})], E.prototype, "stayOpenOnSelect", 2), m([e({ attribute: !1 })], E.prototype, "containingElement", 2), m([e({ type: Number })], E.prototype, "distance", 2), m([e({ type: Number })], E.prototype, "skidding", 2), m([e({ type: Boolean })], E.prototype, "hoist", 2), m([e({ reflect: !0 })], E.prototype, "sync", 2), m([p("open", { waitUntilFirstUpdate: !0 })], E.prototype, "handleOpenChange", 1), te("dropdown.show", {
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
}), te("dropdown.hide", {
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
});
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.O6CEROC7.js
var ke = t`
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
`, Ae = "important", je = " !important", D = ae(class extends ie {
	constructor(e) {
		if (super(e), e.type !== oe.ATTRIBUTE || e.name !== "style" || e.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
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
				let t = typeof r == "string" && r.endsWith(je);
				e.includes("-") || t ? n.setProperty(e, t ? r.slice(0, -11) : r, t ? Ae : "") : n[e] = r;
			}
		}
		return r;
	}
});
//#endregion
//#region node_modules/@ctrl/tinycolor/dist/module/util.js
function O(e, t) {
	Me(e) && (e = "100%");
	let n = Ne(e);
	return e = t === 360 ? e : Math.min(t, Math.max(0, parseFloat(e))), n && (e = parseInt(String(e * t), 10) / 100), Math.abs(e - t) < 1e-6 ? 1 : (e = t === 360 ? (e < 0 ? e % t + t : e % t) / parseFloat(String(t)) : e % t / parseFloat(String(t)), e);
}
function k(e) {
	return Math.min(1, Math.max(0, e));
}
function Me(e) {
	return typeof e == "string" && e.indexOf(".") !== -1 && parseFloat(e) === 1;
}
function Ne(e) {
	return typeof e == "string" && e.indexOf("%") !== -1;
}
function Pe(e) {
	return e = parseFloat(e), (isNaN(e) || e < 0 || e > 1) && (e = 1), e;
}
function A(e) {
	return Number(e) <= 1 ? `${Number(e) * 100}%` : e;
}
function j(e) {
	return e.length === 1 ? "0" + e : String(e);
}
//#endregion
//#region node_modules/@ctrl/tinycolor/dist/module/conversion.js
function Fe(e, t, n) {
	return {
		r: O(e, 255) * 255,
		g: O(t, 255) * 255,
		b: O(n, 255) * 255
	};
}
function Ie(e, t, n) {
	e = O(e, 255), t = O(t, 255), n = O(n, 255);
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
function M(e, t, n) {
	return n < 0 && (n += 1), n > 1 && --n, n < 1 / 6 ? e + (t - e) * (6 * n) : n < 1 / 2 ? t : n < 2 / 3 ? e + (t - e) * (2 / 3 - n) * 6 : e;
}
function Le(e, t, n) {
	let r, i, a;
	if (e = O(e, 360), t = O(t, 100), n = O(n, 100), t === 0) i = n, a = n, r = n;
	else {
		let o = n < .5 ? n * (1 + t) : n + t - n * t, s = 2 * n - o;
		r = M(s, o, e + 1 / 3), i = M(s, o, e), a = M(s, o, e - 1 / 3);
	}
	return {
		r: r * 255,
		g: i * 255,
		b: a * 255
	};
}
function Re(e, t, n) {
	e = O(e, 255), t = O(t, 255), n = O(n, 255);
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
function ze(e, t, n) {
	e = O(e, 360) * 6, t = O(t, 100), n = O(n, 100);
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
function Be(e, t, n, r) {
	let i = [
		j(Math.round(e).toString(16)),
		j(Math.round(t).toString(16)),
		j(Math.round(n).toString(16))
	];
	return r && i[0].startsWith(i[0].charAt(1)) && i[1].startsWith(i[1].charAt(1)) && i[2].startsWith(i[2].charAt(1)) ? i[0].charAt(0) + i[1].charAt(0) + i[2].charAt(0) : i.join("");
}
function Ve(e, t, n, r, i) {
	let a = [
		j(Math.round(e).toString(16)),
		j(Math.round(t).toString(16)),
		j(Math.round(n).toString(16)),
		j(We(r))
	];
	return i && a[0].startsWith(a[0].charAt(1)) && a[1].startsWith(a[1].charAt(1)) && a[2].startsWith(a[2].charAt(1)) && a[3].startsWith(a[3].charAt(1)) ? a[0].charAt(0) + a[1].charAt(0) + a[2].charAt(0) + a[3].charAt(0) : a.join("");
}
function He(e, t, n, r) {
	let i = e / 100, a = t / 100, o = n / 100, s = r / 100;
	return {
		r: 255 * (1 - i) * (1 - s),
		g: 255 * (1 - a) * (1 - s),
		b: 255 * (1 - o) * (1 - s)
	};
}
function Ue(e, t, n) {
	let r = 1 - e / 255, i = 1 - t / 255, a = 1 - n / 255, o = Math.min(r, i, a);
	return o === 1 ? (r = 0, i = 0, a = 0) : (r = (r - o) / (1 - o) * 100, i = (i - o) / (1 - o) * 100, a = (a - o) / (1 - o) * 100), o *= 100, {
		c: Math.round(r),
		m: Math.round(i),
		y: Math.round(a),
		k: Math.round(o)
	};
}
function We(e) {
	return Math.round(parseFloat(e) * 255).toString(16);
}
function Ge(e) {
	return N(e) / 255;
}
function N(e) {
	return parseInt(e, 16);
}
function Ke(e) {
	return {
		r: e >> 16,
		g: (e & 65280) >> 8,
		b: e & 255
	};
}
//#endregion
//#region node_modules/@ctrl/tinycolor/dist/module/css-color-names.js
var P = {
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
function qe(e) {
	let t = {
		r: 0,
		g: 0,
		b: 0
	}, n = 1, r = null, i = null, a = null, o = !1, s = !1;
	return typeof e == "string" && (e = Je(e)), typeof e == "object" && (I(e.r) && I(e.g) && I(e.b) ? (t = Fe(e.r, e.g, e.b), o = !0, s = String(e.r).substr(-1) === "%" ? "prgb" : "rgb") : I(e.h) && I(e.s) && I(e.v) ? (r = A(e.s), i = A(e.v), t = ze(e.h, r, i), o = !0, s = "hsv") : I(e.h) && I(e.s) && I(e.l) ? (r = A(e.s), a = A(e.l), t = Le(e.h, r, a), o = !0, s = "hsl") : I(e.c) && I(e.m) && I(e.y) && I(e.k) && (t = He(e.c, e.m, e.y, e.k), o = !0, s = "cmyk"), Object.prototype.hasOwnProperty.call(e, "a") && (n = e.a)), n = Pe(n), {
		ok: o,
		format: e.format || s,
		r: Math.min(255, Math.max(t.r, 0)),
		g: Math.min(255, Math.max(t.g, 0)),
		b: Math.min(255, Math.max(t.b, 0)),
		a: n
	};
}
var F = {
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
function Je(e) {
	if (e = e.trim().toLowerCase(), e.length === 0) return !1;
	let t = !1;
	if (P[e]) e = P[e], t = !0;
	else if (e === "transparent") return {
		r: 0,
		g: 0,
		b: 0,
		a: 0,
		format: "name"
	};
	let n = F.rgb.exec(e);
	return n ? {
		r: n[1],
		g: n[2],
		b: n[3]
	} : (n = F.rgba.exec(e), n ? {
		r: n[1],
		g: n[2],
		b: n[3],
		a: n[4]
	} : (n = F.hsl.exec(e), n ? {
		h: n[1],
		s: n[2],
		l: n[3]
	} : (n = F.hsla.exec(e), n ? {
		h: n[1],
		s: n[2],
		l: n[3],
		a: n[4]
	} : (n = F.hsv.exec(e), n ? {
		h: n[1],
		s: n[2],
		v: n[3]
	} : (n = F.hsva.exec(e), n ? {
		h: n[1],
		s: n[2],
		v: n[3],
		a: n[4]
	} : (n = F.cmyk.exec(e), n ? {
		c: n[1],
		m: n[2],
		y: n[3],
		k: n[4]
	} : (n = F.hex8.exec(e), n ? {
		r: N(n[1]),
		g: N(n[2]),
		b: N(n[3]),
		a: Ge(n[4]),
		format: t ? "name" : "hex8"
	} : (n = F.hex6.exec(e), n ? {
		r: N(n[1]),
		g: N(n[2]),
		b: N(n[3]),
		format: t ? "name" : "hex"
	} : (n = F.hex4.exec(e), n ? {
		r: N(n[1] + n[1]),
		g: N(n[2] + n[2]),
		b: N(n[3] + n[3]),
		a: Ge(n[4] + n[4]),
		format: t ? "name" : "hex8"
	} : (n = F.hex3.exec(e), n ? {
		r: N(n[1] + n[1]),
		g: N(n[2] + n[2]),
		b: N(n[3] + n[3]),
		format: t ? "name" : "hex"
	} : !1))))))))));
}
function I(e) {
	return typeof e == "number" ? !Number.isNaN(e) : F.CSS_UNIT.test(e);
}
//#endregion
//#region node_modules/@ctrl/tinycolor/dist/module/index.js
var Ye = class e {
	constructor(t = "", n = {}) {
		if (t instanceof e) return t;
		typeof t == "number" && (t = Ke(t)), this.originalInput = t;
		let r = qe(t);
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
		return this.a = Pe(e), this.roundA = Math.round(100 * this.a) / 100, this;
	}
	isMonochrome() {
		let { s: e } = this.toHsl();
		return e === 0;
	}
	toHsv() {
		let e = Re(this.r, this.g, this.b);
		return {
			h: e.h * 360,
			s: e.s,
			v: e.v,
			a: this.a
		};
	}
	toHsvString() {
		let e = Re(this.r, this.g, this.b), t = Math.round(e.h * 360), n = Math.round(e.s * 100), r = Math.round(e.v * 100);
		return this.a === 1 ? `hsv(${t}, ${n}%, ${r}%)` : `hsva(${t}, ${n}%, ${r}%, ${this.roundA})`;
	}
	toHsl() {
		let e = Ie(this.r, this.g, this.b);
		return {
			h: e.h * 360,
			s: e.s,
			l: e.l,
			a: this.a
		};
	}
	toHslString() {
		let e = Ie(this.r, this.g, this.b), t = Math.round(e.h * 360), n = Math.round(e.s * 100), r = Math.round(e.l * 100);
		return this.a === 1 ? `hsl(${t}, ${n}%, ${r}%)` : `hsla(${t}, ${n}%, ${r}%, ${this.roundA})`;
	}
	toHex(e = !1) {
		return Be(this.r, this.g, this.b, e);
	}
	toHexString(e = !1) {
		return "#" + this.toHex(e);
	}
	toHex8(e = !1) {
		return Ve(this.r, this.g, this.b, this.a, e);
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
		let e = (e) => `${Math.round(O(e, 255) * 100)}%`;
		return {
			r: e(this.r),
			g: e(this.g),
			b: e(this.b),
			a: this.a
		};
	}
	toPercentageRgbString() {
		let e = (e) => Math.round(O(e, 255) * 100);
		return this.a === 1 ? `rgb(${e(this.r)}%, ${e(this.g)}%, ${e(this.b)}%)` : `rgba(${e(this.r)}%, ${e(this.g)}%, ${e(this.b)}%, ${this.roundA})`;
	}
	toCmyk() {
		return { ...Ue(this.r, this.g, this.b) };
	}
	toCmykString() {
		let { c: e, m: t, y: n, k: r } = Ue(this.r, this.g, this.b);
		return `cmyk(${e}, ${t}, ${n}, ${r})`;
	}
	toName() {
		if (this.a === 0) return "transparent";
		if (this.a < 1) return !1;
		let e = "#" + Be(this.r, this.g, this.b, !1);
		for (let [t, n] of Object.entries(P)) if (e === n) return t;
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
		return n.l += t / 100, n.l = k(n.l), new e(n);
	}
	brighten(t = 10) {
		let n = this.toRgb();
		return n.r = Math.max(0, Math.min(255, n.r - Math.round(255 * -(t / 100)))), n.g = Math.max(0, Math.min(255, n.g - Math.round(255 * -(t / 100)))), n.b = Math.max(0, Math.min(255, n.b - Math.round(255 * -(t / 100)))), new e(n);
	}
	darken(t = 10) {
		let n = this.toHsl();
		return n.l -= t / 100, n.l = k(n.l), new e(n);
	}
	tint(e = 10) {
		return this.mix("white", e);
	}
	shade(e = 10) {
		return this.mix("black", e);
	}
	desaturate(t = 10) {
		let n = this.toHsl();
		return n.s -= t / 100, n.s = k(n.s), new e(n);
	}
	saturate(t = 10) {
		let n = this.toHsl();
		return n.s += t / 100, n.s = k(n.s), new e(n);
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
}, Xe = "EyeDropper" in window, L = class extends f {
	constructor() {
		super(), this.formControlController = new ce(this), this.isSafeValue = !1, this.localize = new se(this), this.hasFocus = !1, this.isDraggingGridHandle = !1, this.isEmpty = !1, this.inputValue = "", this.hue = 0, this.saturation = 100, this.brightness = 100, this.alpha = 100, this.value = "", this.defaultValue = "", this.label = "", this.format = "hex", this.inline = !1, this.size = "medium", this.noFormatToggle = !1, this.name = "", this.disabled = !1, this.hoist = !1, this.opacity = !1, this.uppercase = !1, this.swatches = "", this.form = "", this.required = !1, this.handleFocusIn = () => {
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
		n.focus(), e.preventDefault(), T(t, {
			onMove: (e) => {
				this.alpha = y(e / r * 100, 0, 100), this.syncValues(), this.value !== a && (a = this.value, this.emit("sl-input"));
			},
			onStop: () => {
				this.value !== i && (i = this.value, this.emit("sl-change"));
			},
			initialEvent: e
		});
	}
	handleHueDrag(e) {
		let t = this.shadowRoot.querySelector(".color-picker__slider.color-picker__hue"), n = t.querySelector(".color-picker__slider-handle"), { width: r } = t.getBoundingClientRect(), i = this.value, a = this.value;
		n.focus(), e.preventDefault(), T(t, {
			onMove: (e) => {
				this.hue = y(e / r * 360, 0, 360), this.syncValues(), this.value !== a && (a = this.value, this.emit("sl-input"));
			},
			onStop: () => {
				this.value !== i && (i = this.value, this.emit("sl-change"));
			},
			initialEvent: e
		});
	}
	handleGridDrag(e) {
		let t = this.shadowRoot.querySelector(".color-picker__grid"), n = t.querySelector(".color-picker__grid-handle"), { width: r, height: i } = t.getBoundingClientRect(), a = this.value, o = this.value;
		n.focus(), e.preventDefault(), this.isDraggingGridHandle = !0, T(t, {
			onMove: (e, t) => {
				this.saturation = y(e / r * 100, 0, 100), this.brightness = y(100 - t / i * 100, 0, 100), this.syncValues(), this.value !== o && (o = this.value, this.emit("sl-input"));
			},
			onStop: () => {
				this.isDraggingGridHandle = !1, this.value !== a && (a = this.value, this.emit("sl-change"));
			},
			initialEvent: e
		});
	}
	handleAlphaKeyDown(e) {
		let t = e.shiftKey ? 10 : 1, n = this.value;
		e.key === "ArrowLeft" && (e.preventDefault(), this.alpha = y(this.alpha - t, 0, 100), this.syncValues()), e.key === "ArrowRight" && (e.preventDefault(), this.alpha = y(this.alpha + t, 0, 100), this.syncValues()), e.key === "Home" && (e.preventDefault(), this.alpha = 0, this.syncValues()), e.key === "End" && (e.preventDefault(), this.alpha = 100, this.syncValues()), this.value !== n && (this.emit("sl-change"), this.emit("sl-input"));
	}
	handleHueKeyDown(e) {
		let t = e.shiftKey ? 10 : 1, n = this.value;
		e.key === "ArrowLeft" && (e.preventDefault(), this.hue = y(this.hue - t, 0, 360), this.syncValues()), e.key === "ArrowRight" && (e.preventDefault(), this.hue = y(this.hue + t, 0, 360), this.syncValues()), e.key === "Home" && (e.preventDefault(), this.hue = 0, this.syncValues()), e.key === "End" && (e.preventDefault(), this.hue = 360, this.syncValues()), this.value !== n && (this.emit("sl-change"), this.emit("sl-input"));
	}
	handleGridKeyDown(e) {
		let t = e.shiftKey ? 10 : 1, n = this.value;
		e.key === "ArrowLeft" && (e.preventDefault(), this.saturation = y(this.saturation - t, 0, 100), this.syncValues()), e.key === "ArrowRight" && (e.preventDefault(), this.saturation = y(this.saturation + t, 0, 100), this.syncValues()), e.key === "ArrowUp" && (e.preventDefault(), this.brightness = y(this.brightness + t, 0, 100), this.syncValues()), e.key === "ArrowDown" && (e.preventDefault(), this.brightness = y(this.brightness - t, 0, 100), this.syncValues()), this.value !== n && (this.emit("sl-change"), this.emit("sl-input"));
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
		let t = new Ye(e);
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
		Xe && new EyeDropper().open().then((e) => {
			let t = this.value;
			this.setColor(e.sRGBHex), this.value !== t && (this.emit("sl-change"), this.emit("sl-input"));
		}).catch(() => {});
	}
	selectSwatch(e) {
		let t = this.value;
		this.disabled || (this.setColor(e), this.value !== t && (this.emit("sl-change"), this.emit("sl-input")));
	}
	getHexString(e, t, n, r = 100) {
		let i = new Ye(`hsva(${e}, ${t}%, ${n}%, ${r / 100})`);
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
		let e = this.saturation, t = 100 - this.brightness, n = Array.isArray(this.swatches) ? this.swatches : this.swatches.split(";").filter((e) => e.trim() !== ""), r = o`
      <div
        part="base"
        class=${v({
			"color-picker": !0,
			"color-picker--inline": this.inline,
			"color-picker--disabled": this.disabled,
			"color-picker--focused": this.hasFocus
		})}
        aria-disabled=${this.disabled ? "true" : "false"}
        aria-labelledby="label"
        tabindex=${this.inline ? "0" : "-1"}
      >
        ${this.inline ? o`
              <sl-visually-hidden id="label">
                <slot name="label">${this.label}</slot>
              </sl-visually-hidden>
            ` : null}

        <div
          part="grid"
          class="color-picker__grid"
          style=${D({ backgroundColor: this.getHexString(this.hue, 100, 100) })}
          @pointerdown=${this.handleGridDrag}
          @touchmove=${this.handleTouchMove}
        >
          <span
            part="grid-handle"
            class=${v({
			"color-picker__grid-handle": !0,
			"color-picker__grid-handle--dragging": this.isDraggingGridHandle
		})}
            style=${D({
			top: `${t}%`,
			left: `${e}%`,
			backgroundColor: this.getHexString(this.hue, this.saturation, this.brightness, this.alpha)
		})}
            role="application"
            aria-label="HSV"
            tabindex=${_(this.disabled ? void 0 : "0")}
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
                style=${D({ left: `${this.hue === 0 ? 0 : 100 / (360 / this.hue)}%` })}
                role="slider"
                aria-label="hue"
                aria-orientation="horizontal"
                aria-valuemin="0"
                aria-valuemax="360"
                aria-valuenow=${`${Math.round(this.hue)}`}
                tabindex=${_(this.disabled ? void 0 : "0")}
                @keydown=${this.handleHueKeyDown}
              ></span>
            </div>

            ${this.opacity ? o`
                  <div
                    part="slider opacity-slider"
                    class="color-picker__alpha color-picker__slider color-picker__transparent-bg"
                    @pointerdown="${this.handleAlphaDrag}"
                    @touchmove=${this.handleTouchMove}
                  >
                    <div
                      class="color-picker__alpha-gradient"
                      style=${D({ backgroundImage: `linear-gradient(
                          to right,
                          ${this.getHexString(this.hue, this.saturation, this.brightness, 0)} 0%,
                          ${this.getHexString(this.hue, this.saturation, this.brightness, 100)} 100%
                        )` })}
                    ></div>
                    <span
                      part="slider-handle opacity-slider-handle"
                      class="color-picker__slider-handle"
                      style=${D({ left: `${this.alpha}%` })}
                      role="slider"
                      aria-label="alpha"
                      aria-orientation="horizontal"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow=${Math.round(this.alpha)}
                      tabindex=${_(this.disabled ? void 0 : "0")}
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
            style=${D({ "--preview-color": this.getHexString(this.hue, this.saturation, this.brightness, this.alpha) })}
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
            ${this.noFormatToggle ? "" : o`
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
            ${Xe ? o`
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

        ${n.length > 0 ? o`
              <div part="swatches" class="color-picker__swatches">
                ${n.map((e) => {
			let t = this.parseColor(e);
			return t ? o`
                    <div
                      part="swatch"
                      class="color-picker__swatch color-picker__transparent-bg"
                      tabindex=${_(this.disabled ? void 0 : "0")}
                      role="button"
                      aria-label=${e}
                      @click=${() => this.selectSwatch(e)}
                      @keydown=${(e) => !this.disabled && e.key === "Enter" && this.setColor(t.hexa)}
                    >
                      <div
                        class="color-picker__swatch-color"
                        style=${D({ backgroundColor: t.hexa })}
                      ></div>
                    </div>
                  ` : (console.error(`Unable to parse swatch color: "${e}"`, this), "");
		})}
              </div>
            ` : ""}
      </div>
    `;
		return this.inline ? r : o`
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
          class=${v({
			"color-dropdown__trigger": !0,
			"color-dropdown__trigger--disabled": this.disabled,
			"color-dropdown__trigger--small": this.size === "small",
			"color-dropdown__trigger--medium": this.size === "medium",
			"color-dropdown__trigger--large": this.size === "large",
			"color-dropdown__trigger--empty": this.isEmpty,
			"color-dropdown__trigger--focused": this.hasFocus,
			"color-picker__transparent-bg": !0
		})}
          style=${D({ color: this.getHexString(this.hue, this.saturation, this.brightness, this.alpha) })}
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
L.styles = [d, ke], L.dependencies = {
	"sl-button-group": Te,
	"sl-button": le,
	"sl-dropdown": E,
	"sl-icon": re,
	"sl-input": ge,
	"sl-visually-hidden": w
}, m([i("[part~=\"base\"]")], L.prototype, "base", 2), m([i("[part~=\"input\"]")], L.prototype, "input", 2), m([i(".color-dropdown")], L.prototype, "dropdown", 2), m([i("[part~=\"preview\"]")], L.prototype, "previewButton", 2), m([i("[part~=\"trigger\"]")], L.prototype, "trigger", 2), m([n()], L.prototype, "hasFocus", 2), m([n()], L.prototype, "isDraggingGridHandle", 2), m([n()], L.prototype, "isEmpty", 2), m([n()], L.prototype, "inputValue", 2), m([n()], L.prototype, "hue", 2), m([n()], L.prototype, "saturation", 2), m([n()], L.prototype, "brightness", 2), m([n()], L.prototype, "alpha", 2), m([e()], L.prototype, "value", 2), m([ue()], L.prototype, "defaultValue", 2), m([e()], L.prototype, "label", 2), m([e()], L.prototype, "format", 2), m([e({
	type: Boolean,
	reflect: !0
})], L.prototype, "inline", 2), m([e({ reflect: !0 })], L.prototype, "size", 2), m([e({
	attribute: "no-format-toggle",
	type: Boolean
})], L.prototype, "noFormatToggle", 2), m([e()], L.prototype, "name", 2), m([e({
	type: Boolean,
	reflect: !0
})], L.prototype, "disabled", 2), m([e({ type: Boolean })], L.prototype, "hoist", 2), m([e({ type: Boolean })], L.prototype, "opacity", 2), m([e({ type: Boolean })], L.prototype, "uppercase", 2), m([e()], L.prototype, "swatches", 2), m([e({ reflect: !0 })], L.prototype, "form", 2), m([e({
	type: Boolean,
	reflect: !0
})], L.prototype, "required", 2), m([s({ passive: !1 })], L.prototype, "handleTouchMove", 1), m([p("format", { waitUntilFirstUpdate: !0 })], L.prototype, "handleFormatChange", 1), m([p("opacity", { waitUntilFirstUpdate: !0 })], L.prototype, "handleOpacityChange", 1), m([p("value")], L.prototype, "handleValueChange", 1), L.define("sl-color-picker");
//#endregion
//#region src/components/webmapx-draw-layer-dialog.ts
var Ze = {
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
}, Qe = [{
	name: "id",
	type: "number"
}, {
	name: "name",
	type: "string"
}], $e = {
	Point: x,
	LineString: x,
	Polygon: x
};
function R(e) {
	return {
		id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
		name: "",
		type: e,
		color: $e[e],
		properties: Qe.map((e) => ({ ...e }))
	};
}
var z = class extends c {
	constructor(...e) {
		super(...e), this.geometryType = "Point", this.existingLayers = [], this.mapLayers = [], this.step = "select", this.selectedId = "new", this.layer = R("Point"), this.nameError = !1, this.newPropName = "", this.newPropType = "string", this.allowedAttributes = null;
	}
	static {
		this.styles = [
			he,
			_e,
			t`
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
		ye(this), this.step = "select", this.selectedId = this.existingLayers.length === 0 ? "new" : this.existingLayers[0].id, this.layer = R(this.geometryType), this.newPropName = "", this.newPropType = "string", this.nameError = !1, this.dialog?.show();
	}
	close() {
		this.dialog?.hide();
	}
	selectOption(e) {
		this.selectedId = e;
	}
	goToDetail() {
		if (this.selectedId === "new") this.layer = R(this.geometryType), this.allowedAttributes = null;
		else {
			let e = this.existingLayers.find((e) => e.id === this.selectedId);
			if (e) this.layer = {
				...e,
				properties: e.properties.map((e) => ({ ...e }))
			}, this.allowedAttributes = null;
			else {
				let e = this.mapLayers.find((e) => e.layerId === this.selectedId);
				this.layer = {
					...R(this.geometryType),
					name: e?.label ?? this.selectedId,
					properties: e?.properties?.map((e) => ({ ...e })) ?? Qe.map((e) => ({ ...e })),
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
		return o`
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
                ${this.existingLayers.map((e) => o`
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
                ${this.mapLayers.length > 0 ? o`
                    <div style="font-size:0.72rem;color:var(--color-text-muted, #6b7681);padding:0.4rem 0.2rem 0.1rem;text-transform:uppercase;letter-spacing:0.05em">Map layers</div>
                    ${this.mapLayers.map((e) => o`
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
		let e = Ze[this.geometryType], t = {
			longitude: "longitude (auto)",
			latitude: "latitude (auto)",
			area: "area (auto)",
			perimeter: "perimeter (auto)",
			length: "length (auto)",
			linkURL: "link URL",
			imageURL: "image URL",
			"create-time": "create-time (auto)",
			"update-time": "update-time (auto)"
		};
		return o`
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
            ${this.nameError ? o`<div class="error-msg">Enter a layer name.</div>` : ""}

            <table class="prop-table">
                <thead>
                    <tr><th>Property</th><th>Type</th><th style="width:2rem"></th></tr>
                </thead>
                <tbody>
                    ${this.layer.properties.map((e, t) => o`
                        <tr class="${e.name === "id" ? "prop-row-auto" : ""}">
                            <td>${e.name}</td>
                            <td class="${[
			"string",
			"number",
			"linkURL",
			"imageURL"
		].includes(e.type) ? "" : "type-computed"}">${e.type}${e.name === "id" ? " (auto)" : ""}</td>
                            <td>
                                ${t === 0 ? "" : o`
                                    <sl-icon-button name="x" label="Remove property ${e.name}" @click=${() => this.removeProperty(t)}></sl-icon-button>
                                `}
                            </td>
                        </tr>
                    `)}
                    <tr class="add-row">
                        <td>
                            ${this.allowedAttributes ? o`
                                <sl-select id="new-prop-name" size="small" aria-label="Property name"
                                    .value=${this.newPropName}
                                    @sl-change=${(e) => this.newPropName = e.target.value}>
                                    <sl-option value="">— select —</sl-option>
                                    ${this.allowedAttributes.filter((e) => !this.layer.properties.find((t) => t.name === e)).map((e) => o`<sl-option value=${e}>${e}</sl-option>`)}
                                </sl-select>
                            ` : o`
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
                                ${e.map((e) => o`<sl-option value=${e}>${t[e] ?? e}</sl-option>`)}
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
		return ve(o`
                <sl-dialog label="${this.step === "select" ? `Select ${e} layer` : `Configure ${e} layer`}"
                           @sl-request-close=${(e) => {
			e.detail?.source === "overlay" && this.cancel();
		}}>
                    ${this.step === "select" ? this.renderSelectStep() : this.renderDetailStep()}
                </sl-dialog>
        `);
	}
};
l([e({ type: String })], z.prototype, "geometryType", void 0), l([e({ attribute: !1 })], z.prototype, "existingLayers", void 0), l([e({ attribute: !1 })], z.prototype, "mapLayers", void 0), l([n()], z.prototype, "step", void 0), l([n()], z.prototype, "selectedId", void 0), l([n()], z.prototype, "layer", void 0), l([n()], z.prototype, "nameError", void 0), l([n()], z.prototype, "newPropName", void 0), l([n()], z.prototype, "newPropType", void 0), l([n()], z.prototype, "allowedAttributes", void 0), l([i("sl-dialog")], z.prototype, "dialog", void 0), z = l([a("webmapx-draw-layer-dialog")], z);
//#endregion
//#region src/utils/snap-utils.ts
function et(e) {
	return e.type === "Point" ? [e.coordinates] : e.type === "MultiPoint" || e.type === "LineString" ? e.coordinates : e.type === "MultiLineString" || e.type === "Polygon" ? e.coordinates.flat() : e.type === "MultiPolygon" ? e.coordinates.flat(2) : [];
}
function tt(e) {
	let t = [], n = (e) => {
		for (let n = 0; n < e.length - 1; n++) t.push([e[n], e[n + 1]]);
	};
	return e.type === "LineString" ? n(e.coordinates) : e.type === "MultiLineString" ? e.coordinates.forEach((e) => n(e)) : e.type === "Polygon" ? e.coordinates.forEach((e) => n(e)) : e.type === "MultiPolygon" && e.coordinates.forEach((e) => e.forEach((e) => n(e))), t;
}
function nt(e, t, n) {
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
function rt(e, t, n, r = {}) {
	let i = r.threshold ?? 16, a = r.edgePenalty ?? 8, o = null, s = i, c = r.unproject ? nt(e, i, r.unproject) : null;
	if (r.unproject && !c) return null;
	let l = c ? (e) => e[0] >= c.minLng && e[0] <= c.maxLng && e[1] >= c.minLat && e[1] <= c.maxLat : (e) => !0;
	for (let r of t) {
		for (let t of et(r)) {
			if (!l(t)) continue;
			let r = n(t), i = Math.hypot(r[0] - e[0], r[1] - e[1]);
			i < s && (s = i, o = t);
		}
		for (let [t, i] of tt(r)) {
			if (!l(t) && !l(i)) continue;
			let r = n(t), c = n(i), u = c[0] - r[0], d = c[1] - r[1], f = u * u + d * d;
			if (f === 0) continue;
			let p = Math.max(0, Math.min(1, ((e[0] - r[0]) * u + (e[1] - r[1]) * d) / f)), m = Math.hypot(r[0] + p * u - e[0], r[1] + p * d - e[1]);
			m + a < s && (s = m + a, o = [t[0] + p * (i[0] - t[0]), t[1] + p * (i[1] - t[1])]);
		}
	}
	return o;
}
//#endregion
//#region src/components/webmapx-draw-tool.ts
var B = "webmapx-draw-rubber-source", it = "webmapx-draw-rubber-line", V = "webmapx-draw-vertex-source", at = "webmapx-draw-vertex-layer", H = "geom";
function U(e, t) {
	return t === "Polygon" ? `${e}:${H}` : `webmapx-draw-src-${e}`;
}
function ot(e) {
	return `${e}-map`;
}
function st(e, t, n, r) {
	if (t.type === "Polygon") return {
		id: e,
		type: "style",
		version: 8,
		title: t.name,
		metadata: r,
		sources: { [H]: {
			type: "geojson",
			data: {
				type: "FeatureCollection",
				features: []
			}
		} },
		layers: [{
			id: `${e}-fill`,
			type: "fill",
			source: H,
			metadata: { label: "Fill" },
			paint: {
				"fill-color": n,
				"fill-opacity": .35
			}
		}, {
			id: `${e}-line`,
			type: "line",
			source: H,
			metadata: { label: "Line" },
			paint: {
				"line-color": n,
				"line-width": 2
			}
		}]
	};
	let i = U(e, t.type);
	return t.type === "LineString" ? {
		id: e,
		type: "line",
		source: i,
		title: t.name,
		metadata: r,
		paint: {
			"line-color": n,
			"line-width": 2
		}
	} : {
		id: e,
		type: "circle",
		source: i,
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
var ct = "#888888", lt = "#ff3b30", ut = 10, W = "webmapx-draw-sel-source", dt = "webmapx-draw-sel-point", G = "webmapx-draw-draft-source", K = "webmapx-draw-draft-points", q = "webmapx-draw-edit-vert-source", ft = "webmapx-draw-edit-vert", J = "webmapx-draw-edit-mid-source", pt = "webmapx-draw-edit-mid", Y = "webmapx-draw-sel-vert-source", mt = "webmapx-draw-sel-vert", ht = 12, X = "webmapx-draw-snap-source", gt = "webmapx-draw-snap-layer", _t = 16, vt = 1, Z = class extends u {
	constructor(...e) {
		super(...e), this.toolId = "draw", this.mode = "select", this.drawLayers = [], this.features = [], this.selectedFeatureId = null, this.helpText = "", this.pendingMode = null, this.uiVersion = 0, this.draftPoints = [], this.draftRedoStack = [], this.cursorPos = null, this.circleDraft = null, this.activeLayerIds = {}, this.history = [], this.historyIndex = -1, this.sharedLayersCreated = !1, this.createdDrawLayerIds = /* @__PURE__ */ new Set(), this.touchMQ = window.matchMedia("(pointer: coarse)"), this.isTouchDevice = this.touchMQ.matches, this.onTouchMQChange = (e) => {
			this.isTouchDevice = e.matches;
		}, this.snapEnabled = !0, this.altActive = !1, this.snapPos = null, this.lastCursorPx = null, this.editState = "none", this.editHandles = [], this.hoveredHandle = null, this.dragging = null, this.selectedHandle = null, this.featureDrag = null, this.unsubClick = null, this.unsubMove = null, this.moveRafId = null, this.pendingMoveEvent = null, this.unsubCtx = null, this.unsubDown = null, this.unsubUp = null, this.exportFilename = "draw-export", this.exportMode = "combined", this.pendingSourceRefresh = /* @__PURE__ */ new Map(), this.onKeyDown = (e) => {
			if (this.isRelevantTarget(e)) {
				if (e.key === "Alt") {
					e.preventDefault(), this.altActive || (this.altActive = !0, this.snapPos = null, this.updateRubberband(), this.updateSnapIndicator());
					return;
				}
				if (!this.isTypingTarget(e)) {
					if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
						e.preventDefault(), this.undoOrDraftBack();
						return;
					}
					if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
						e.preventDefault(), this.redoOrDraftForward();
						return;
					}
					(e.key === "Delete" || e.key === "Backspace") && (this.draftPoints.length > 0 ? (e.preventDefault(), this.removeLastDraftPoint()) : this.selectedHandle ? (e.preventDefault(), this.deleteSelectedVertex()) : this.selectedFeatureId && (e.preventDefault(), this.deleteSelected()));
				}
			}
		}, this.onWindowBlur = () => {
			this.altActive && (this.altActive = !1, (this.mode === "draw-point" || this.mode === "draw-line" || this.mode === "draw-polygon") && this.updateRubberband());
		}, this.onKeyUp = (e) => {
			e.key === "Alt" && (this.altActive = !1, (this.mode === "draw-point" || this.mode === "draw-line" || this.mode === "draw-polygon") && this.updateRubberband());
		};
	}
	connectedCallback() {
		super.connectedCallback(), this.touchMQ.addEventListener("change", this.onTouchMQChange);
	}
	get effectiveSnap() {
		return this.snapEnabled && !this.altActive;
	}
	static {
		this.styles = t`
        :host {
            display: flex;
            flex-direction: column;
            padding: var(--webmapx-tool-padding, 0);
            min-width: 200px;
            max-height: var(--webmapx-draw-tool-max-height, 100%);
            overflow: hidden;
        }

        .scroll-content {
            flex: 1;
            overflow-y: auto;
            min-height: 0;
        }

        .toolbar {
            display: flex;
            gap: 0.25rem;
            flex-wrap: wrap;
            margin-bottom: 0.5rem;
            flex-shrink: 0;
        }

        /* Sized and coloured like the sl-icon-buttons beside it. */
        .toggle-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: var(--sl-font-size-large, 1.25rem);
            padding: var(--sl-spacing-x-small, 0.5rem);
            border: none;
            border-radius: 4px;
            background: none;
            color: var(--sl-color-neutral-600, #5a6773);
            cursor: pointer;
        }
        .toggle-button:hover {
            color: var(--color-primary, #2b6c8f);
        }
        .toggle-button:focus-visible {
            outline: var(--webmapx-focus-ring, 2px solid var(--color-primary, #2b6c8f));
            outline-offset: var(--webmapx-focus-offset, 2px);
        }
        .toggle-button[aria-pressed="true"] {
            color: var(--color-primary, #2b6c8f);
            background: var(--color-primary-soft, rgba(43, 108, 143, 0.12));
        }

        .help {
            font-size: 0.8rem;
            color: var(--color-text-secondary, #5a6773);
            margin-bottom: 0.5rem;
            min-height: 2.5em;
        }

        .layers-section {
            margin-top: 0.5rem;
        }

        .section-label {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--color-text-muted, #6b7681);
            margin-bottom: 0.25rem;
        }

        .layer-row {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-size: 0.85rem;
        }

        /* The row itself holds a remove button, so the "switch layer" affordance
           is its own button rather than a click handler on the row. */
        .layer-select-btn {
            display: flex;
            flex: 1;
            min-width: 0;
            align-items: center;
            gap: 0.4rem;
            padding: 0;
            border: 0;
            background: transparent;
            font: inherit;
            color: inherit;
            text-align: left;
            cursor: pointer;
        }

        .layer-row:hover {
            background: var(--color-background-secondary, #f4f6f8);
        }

        .remove-layer-btn {
            font-size: 0.75rem;
            opacity: 0;
            transition: opacity var(--webmapx-motion-fast, 120ms);
        }

        .layer-row:hover .remove-layer-btn,
        .layer-row:focus-within .remove-layer-btn {
            opacity: 1;
        }

        .color-dot {
            width: 10px; height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .layer-name { flex: 1; }

        .layer-type {
            font-size: 0.7rem;
            color: var(--color-text-muted, #6b7681);
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
        .feature-row.selected { background: var(--sl-color-primary-100); }

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
		if (this.adapter?.store.getState().mapLoaded) this.createSharedLayers();
		else {
			let e = this.adapter?.store.subscribe((t) => {
				t.mapLoaded && (e?.(), this.createSharedLayers());
			});
		}
		for (let e of this.drawLayers) this.createdDrawLayerIds.has(e.id) || (this.addMapLayersForDrawLayer(e), this.refreshDrawLayerSource(e.id)), e.borrowedSourceId && (this.adapter?.getSource(e.borrowedSourceId)?.setData({
			type: "FeatureCollection",
			features: []
		}), this.setBorrowedLayerMetadata(e.borrowedSourceId, { borrowedByDrawTool: !0 }));
		for (let e of [
			B,
			V,
			W,
			G,
			q,
			J,
			Y,
			X
		]) this.dispatchEvent(new CustomEvent("webmapx-suppress-busy-for-source", {
			detail: e,
			bubbles: !0,
			composed: !0
		}));
		this.bindEvents(), window.addEventListener("keydown", this.onKeyDown, !0), window.addEventListener("keyup", this.onKeyUp), window.addEventListener("blur", this.onWindowBlur), this.setModeInternal("select");
	}
	onDeactivate() {
		for (let e of [
			B,
			V,
			W,
			G,
			q,
			J,
			Y,
			X
		]) this.dispatchEvent(new CustomEvent("webmapx-unsuppress-busy-for-source", {
			detail: e,
			bubbles: !0,
			composed: !0
		}));
		this.moveRafId !== null && (cancelAnimationFrame(this.moveRafId), this.moveRafId = null);
		for (let [, e] of this.pendingSourceRefresh) cancelAnimationFrame(e);
		this.pendingSourceRefresh.clear(), this.pendingMoveEvent = null, this.unbindEvents(), window.removeEventListener("keydown", this.onKeyDown, !0), window.removeEventListener("keyup", this.onKeyUp), window.removeEventListener("blur", this.onWindowBlur), this.altActive = !1;
		for (let e of this.drawLayers) e.borrowedSourceId && this.restoreBorrowedLayer(e), this.suspendDrawLayerFromMap(e);
		this.draftPoints = [], this.circleDraft = null, this.cursorPos = null, this.snapPos = null, this.lastCursorPx = null, this.dragging = null, this.featureDrag = null, this.selectedFeatureId = null, this.editState = "none", this.editHandles = [], this.hoveredHandle = null, this.adapter?.setPanEnabled(!0), this.adapter?.setDoubleClickZoomEnabled(!0), this.updateSelectedSource(), this.removeSharedLayers(), this.adapter?.setCursor("");
	}
	disconnectedCallback() {
		this.touchMQ.removeEventListener("change", this.onTouchMQChange), this.removeAllMapLayers(), super.disconnectedCallback();
	}
	onMapAttached(e) {
		super.onMapAttached(e);
	}
	onMapDetached() {
		this.removeAllMapLayers(), super.onMapDetached();
	}
	createSharedLayers() {
		if (!this.sharedLayersCreated) {
			this.dispatch("webmapx-add-source", {
				id: B,
				config: {
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: []
					}
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
				id: it,
				type: "line",
				source: B,
				metadata: {
					isToolLayer: !0,
					hideFromLegend: !0
				},
				paint: {
					"line-color": x,
					"line-width": 2,
					"line-dasharray": [4, 4]
				}
			}), this.dispatch("webmapx-add-layer", {
				id: at,
				type: "circle",
				source: V,
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
				id: W,
				config: {
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: []
					}
				}
			}), this.dispatch("webmapx-add-layer", {
				id: dt,
				type: "circle",
				source: W,
				metadata: {
					isToolLayer: !0,
					hideFromLegend: !0
				},
				paint: {
					"circle-radius": ut,
					"circle-color": this.cssVar("--webmapx-draw-selected-color", lt)
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
				id: K,
				type: "circle",
				source: G,
				metadata: {
					isToolLayer: !0,
					hideFromLegend: !0
				},
				paint: {
					"circle-radius": 5,
					"circle-color": b,
					"circle-stroke-width": 2,
					"circle-stroke-color": x
				}
			}), this.dispatch("webmapx-add-source", {
				id: q,
				config: {
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: []
					}
				}
			}), this.dispatch("webmapx-add-layer", {
				id: ft,
				type: "circle",
				source: q,
				metadata: {
					isToolLayer: !0,
					hideFromLegend: !0
				},
				paint: {
					"circle-radius": 6,
					"circle-color": b,
					"circle-stroke-width": 2,
					"circle-stroke-color": x
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
				id: pt,
				type: "circle",
				source: J,
				metadata: {
					isToolLayer: !0,
					hideFromLegend: !0
				},
				paint: {
					"circle-radius": 4,
					"circle-color": b,
					"circle-stroke-width": 1.5,
					"circle-stroke-color": x,
					"circle-opacity": .7
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
				id: mt,
				type: "circle",
				source: Y,
				metadata: {
					isToolLayer: !0,
					hideFromLegend: !0
				},
				paint: {
					"circle-radius": ut,
					"circle-color": this.cssVar("--webmapx-draw-selected-color", lt),
					"circle-stroke-width": 2,
					"circle-stroke-color": "#fff"
				}
			}), this.dispatch("webmapx-add-source", {
				id: X,
				config: {
					type: "geojson",
					data: {
						type: "FeatureCollection",
						features: []
					}
				}
			}), this.dispatch("webmapx-add-layer", {
				id: gt,
				type: "circle",
				source: X,
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
			}), this.sharedLayersCreated = !0;
			for (let e of this.drawLayers) this.addMapLayersForDrawLayer(e), this.refreshDrawLayerSource(e.id);
		}
	}
	addMapLayersForDrawLayer(e) {
		this.createdDrawLayerIds.has(e.id) || (e.type !== "Polygon" && this.dispatch("webmapx-add-source", {
			id: U(e.id, e.type),
			config: {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: []
				}
			}
		}), this.dispatch("webmapx-add-layer", st(e.id, e, e.color, {
			label: e.name,
			legendRole: "overlay",
			hideFromLegend: !0
		})), this.createdDrawLayerIds.add(e.id));
	}
	removeMapLayersForDrawLayer(e) {
		this.dispatch("webmapx-remove-layer", e.id), this.dispatch("webmapx-remove-source", U(e.id, e.type)), this.adapter?.store && S(this.adapter.store, e.id), this.createdDrawLayerIds.delete(e.id);
	}
	removeSharedLayers() {
		for (let e of [
			it,
			at,
			dt,
			K,
			ft,
			pt,
			mt,
			gt
		]) this.dispatch("webmapx-remove-layer", e);
		for (let e of [
			B,
			V,
			W,
			G,
			q,
			J,
			Y,
			X
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
	flushDrawLayerSource(e) {
		let t = this.features.filter((t) => t.layerId === e).map((e) => ({
			type: "Feature",
			id: e.id,
			geometry: {
				type: e.type,
				coordinates: e.coordinates
			},
			properties: e.properties
		})), n = this.drawLayers.find((t) => t.id === e)?.type ?? "Polygon";
		this.dispatch("webmapx-set-source-data", {
			id: U(e, n),
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
		}), this.unsubCtx = this.adapter.events.on("contextmenu", (e) => this.handleContextMenu(e)), this.unsubDown = this.adapter.events.on("pointer-down", (e) => this.handlePointerDown(e)), this.unsubUp = this.adapter.events.on("pointer-up", (e) => this.handlePointerUp(e)));
	}
	unbindEvents() {
		this.unsubClick?.(), this.unsubClick = null, this.unsubMove?.(), this.unsubMove = null, this.unsubCtx?.(), this.unsubCtx = null, this.unsubDown?.(), this.unsubDown = null, this.unsubUp?.(), this.unsubUp = null;
	}
	async requestDrawMode(e) {
		let t = Q(e);
		if (!t) {
			this.setModeInternal(e);
			return;
		}
		if (this.activeLayerIds[t]) {
			this.setModeInternal(e);
			return;
		}
		await this.openLayerDialog(e);
	}
	async openLayerDialog(e) {
		let t = Q(e);
		if (!t) return;
		this.pendingMode = e;
		let n = this.drawLayers.filter((e) => e.type === t && !e.borrowedSourceId), r = this.adapter ? await this.getEditableMapLayers(t) : [], i = this.activeLayerIds[t], a = this.drawLayers.find((e) => e.id === i && e.borrowedSourceId), o = a?.borrowedSourceId, s = o ? r.find((e) => e.sourceId === o)?.layerId : void 0;
		if (a && s) {
			let e = r.find((e) => e.layerId === s);
			e && (e.properties = a.properties.map((e) => ({ ...e })));
		}
		this.layerDialog.geometryType = t, this.layerDialog.existingLayers = n, this.layerDialog.mapLayers = r, this.layerDialog.open(), s && (this.layerDialog.selectedId = s);
	}
	async getEditableMapLayers(e) {
		if (!this.adapter) return [];
		let t = this.adapter.store.getState().mapLayers ?? {}, n = /* @__PURE__ */ new Set(), r = [], i = this.activeLayerIds[e], a = new Set(this.drawLayers.filter((e) => e.borrowedSourceId && e.id !== i).map((e) => e.borrowedSourceId));
		for (let [i, o] of Object.entries(t)) {
			if (o.isToolLayer || this.createdDrawLayerIds.has(i)) continue;
			let t = typeof o.sourceId == "string" ? o.sourceId : null;
			if (!t || n.has(t) || a.has(t)) continue;
			let s = this.adapter.getSourceData(t);
			if (!s) continue;
			let c = await this.resolveFeatureCollection(s);
			if (typeof s == "string") {
				let a = c?.features[0]?.geometry?.type, s = a ? this.geometryFamilyForGeoJSONType(a) : null, l = this.geometryFamilyForLayerType(o.layerType);
				if ((s ?? l) !== e) continue;
				n.add(t), r.push({
					layerId: i,
					sourceId: t,
					label: o.label ?? i,
					properties: o.properties ?? (c ? this.inferPropertyDefs(c) : void 0),
					allowedAttributes: o.attributes?.allowedAttributes ?? void 0
				});
				continue;
			}
			let l = s.features[0]?.geometry?.type, u = l ? this.geometryFamilyForGeoJSONType(l) : null, d = this.geometryFamilyForLayerType(o.layerType);
			(u ?? d) === e && (n.add(t), r.push({
				layerId: i,
				sourceId: t,
				label: o.label ?? i,
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
		return t ? Object.entries(t).map(([e, t]) => ({
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
	setModeInternal(e) {
		switch (this.circleDraft && (this.circleDraft = null, this.adapter?.setPanEnabled(!0)), this.mode = e, this.draftPoints = [], this.cursorPos = null, this.snapPos = null, this.lastCursorPx = null, this.updateRubberband(), e) {
			case "select":
				this.adapter?.setDoubleClickZoomEnabled(!0), this.adapter?.setCursor(""), this.editState = "none", this.editHandles = [], this.updateEditHandles(), this.helpText = "Click a feature to select it.";
				break;
			case "draw-point":
			case "draw-line":
			case "draw-polygon":
			case "draw-circle":
				this.adapter?.setDoubleClickZoomEnabled(!1), this.editState = "none", this.editHandles = [], this.hoveredHandle = null, this.selectedFeatureId = null, this.updateEditHandles(), this.updateSelectedSource(), this.adapter?.setCursor("crosshair"), this.helpText = this.mode === "draw-point" ? "Click to place a point." : this.mode === "draw-line" ? "Click to add vertices. Right-click or double-click to finish." : this.mode === "draw-circle" ? "Click and drag to draw a circle." : "Click to add vertices. Click first point or double-click to close.";
				break;
		}
	}
	async handleLayerConfirm(e) {
		let t = e.detail, n = this.activeLayerIds[t.type];
		if (n && n !== t.id) {
			let e = this.drawLayers.find((e) => e.id === n);
			e && this.releaseLayer(e);
		}
		let r = this.drawLayers.findIndex((e) => e.id === t.id);
		if (r >= 0) this.drawLayers = this.drawLayers.map((e, n) => n === r ? t : e);
		else if (t.borrowedSourceId || (t = {
			...t,
			borrowedSourceId: this.createPermLayer(t)
		}), this.drawLayers = [...this.drawLayers, t], this.addMapLayersForDrawLayer(t), t.borrowedSourceId && this.adapter) {
			let e = this.adapter.getSourceData(t.borrowedSourceId), n = e ? await this.resolveFeatureCollection(e) : null;
			if (n) {
				let e = [];
				for (let r of n.features) {
					if (!r.geometry || !yt(r.geometry.type)) continue;
					let n = { ...r.properties };
					e.push({
						id: this.newId(),
						layerId: t.id,
						type: r.geometry.type,
						coordinates: r.geometry.coordinates,
						properties: n
					});
				}
				if (this.features = [...this.features, ...e], t.properties.length <= 2) {
					let e = this.inferPropertyDefs(n);
					t = {
						...t,
						properties: e
					}, this.drawLayers = this.drawLayers.map((e) => e.id === t.id ? t : e);
				}
			}
			this.adapter.getSource(t.borrowedSourceId)?.setData({
				type: "FeatureCollection",
				features: []
			}), this.setBorrowedLayerMetadata(t.borrowedSourceId, { borrowedByDrawTool: !0 });
		}
		this.activeLayerIds[t.type] = t.id, this.refreshDrawLayerSource(t.id);
		let i = ot(t.id);
		if (this.adapter?.store) {
			let e = this.adapter.store.getState().mapLayers ?? {}, n = e[i];
			n && this.adapter.store.dispatch({ mapLayers: {
				...e,
				[i]: {
					...n,
					properties: t.properties
				}
			} }, "MAP");
		}
		this.pendingMode &&= (this.setModeInternal(this.pendingMode), null);
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
				properties: { ...e.properties }
			}))
		};
		this.adapter.getSource(e.borrowedSourceId)?.setData(t), this.setBorrowedLayerMetadata(e.borrowedSourceId, {
			borrowedByDrawTool: !1,
			sourceData: t
		});
	}
	createPermLayer(e) {
		let t = ot(e.id);
		return e.type !== "Polygon" && this.dispatch("webmapx-add-source", {
			id: U(t, e.type),
			config: {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: []
				}
			}
		}), this.dispatch("webmapx-add-layer", st(t, e, ct, {
			label: e.name,
			legendRole: "overlay",
			properties: e.properties,
			borrowedByDrawTool: !0
		})), U(t, e.type);
	}
	releaseBorrowedLayer(e) {
		if (e.borrowedSourceId) {
			this.restoreBorrowedLayer(e), this.removeMapLayersForDrawLayer(e), this.features = this.features.filter((t) => t.layerId !== e.id), this.drawLayers = this.drawLayers.filter((t) => t.id !== e.id);
			for (let [t, n] of Object.entries(this.activeLayerIds)) n === e.id && delete this.activeLayerIds[t];
		}
	}
	suspendDrawLayerFromMap(e) {
		this.dispatch("webmapx-remove-layer", e.id), this.dispatch("webmapx-remove-source", U(e.id, e.type)), this.adapter?.store && S(this.adapter.store, e.id), this.createdDrawLayerIds.delete(e.id);
	}
	releaseLayer(e) {
		this.releaseBorrowedLayer(e);
	}
	removeFromEditing(e) {
		let t = this.activeLayerIds[e.type] === e.id;
		this.releaseLayer(e), t && this.setModeInternal("select");
	}
	handleLayerCancel() {
		this.pendingMode = null;
	}
	handleClick(e) {
		let t = this.effectiveSnap && this.snapPos ? this.snapPos : e.coords, n = Q(this.mode), r = n ? this.activeLayerIds[n] : null;
		if (!(!r && this.mode !== "select")) {
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
			if (this.mode === "draw-line" || this.mode === "draw-polygon") {
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
			if (this.mode === "select") {
				let e = this.adapter.project(t), n = [e[0], e[1]], r = this.findFeatureAt(n, t);
				r && r.id === this.selectedFeatureId && this.editState === "selected" && (bt(r.type) || xt(r.type)) ? this.enterEditMode(r.id) : r && r.id === this.selectedFeatureId && this.editState === "editing" || (r ? (this.selectedFeatureId = r.id, this.editState = $(r.type) ? "editing" : "selected", this.editState === "selected" ? this.helpText = "Click again to edit vertices." : $(r.type) && (this.helpText = "Drag to move point."), this.updateSelectedSource(), this.updateEditHandles(), this.requestUpdate()) : this.editState === "editing" ? (this.editState = "selected", this.updateEditHandles(), this.requestUpdate()) : (this.selectedFeatureId = null, this.editState = "none", this.updateSelectedSource(), this.updateEditHandles(), this.requestUpdate()));
			}
		}
	}
	handlePointerMove(e) {
		if (this.cursorPos = e.coords, this.circleDraft) {
			this.updateCircleDraft(e.coords);
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
		if (this.mode === "draw-point" || this.mode === "draw-line" || this.mode === "draw-polygon") {
			if (this.effectiveSnap && this.features.length > 0) {
				let t = this.adapter.project(e.coords), n = [t[0], t[1]];
				(!this.lastCursorPx || Math.hypot(n[0] - this.lastCursorPx[0], n[1] - this.lastCursorPx[1]) > .5) && (this.lastCursorPx = n, this.snapPos = this.computeSnap(n));
			} else this.snapPos = null;
			this.updateRubberband();
			return;
		}
		if (this.mode === "select") {
			let t = this.adapter.project(e.coords), n = this.findFeatureAt([t[0], t[1]], e.coords);
			this.editState === "selected" && this.selectedFeatureId ? this.adapter?.setCursor(n?.id === this.selectedFeatureId ? "grab" : "") : this.editState === "none" && this.adapter?.setCursor(n ? "pointer" : "");
		}
		if (this.mode === "select" && this.editState === "editing" && this.editHandles.length > 0) {
			let t = this.adapter.project(e.coords), n = this.findHandleAt([t[0], t[1]]);
			n !== this.hoveredHandle && (this.hoveredHandle = n, this.adapter?.setCursor(n ? "grab" : ""));
		}
	}
	handlePointerDown(e) {
		if (e.button !== 0) return;
		if (this.mode === "draw-circle") {
			this.startCircleDraft(e.coords);
			return;
		}
		if (this.editState === "selected" && this.selectedFeatureId) {
			let t = [e.pixel[0], e.pixel[1]], n = this.findFeatureAt(t, e.coords);
			if (n && n.id === this.selectedFeatureId) {
				let t = this.centroid(n);
				this.featureDrag = {
					featureId: n.id,
					startCoords: e.coords,
					origCoords: JSON.parse(JSON.stringify(n.coordinates)),
					origCentroidLat: t[1],
					origCentroidLng: t[0]
				}, this.adapter?.setPanEnabled(!1), this.adapter?.setCursor("grabbing");
			}
			return;
		}
		if (this.editState !== "editing") return;
		let t = [e.pixel[0], e.pixel[1]], n = this.findHandleAt(t);
		if (!n) {
			this.selectedHandle && (this.selectedHandle = null, this.updateSelectedVertexSource());
			return;
		}
		if (this.selectedHandle = n.kind === "vertex" ? n : null, this.updateSelectedVertexSource(), this.dragging = {
			handle: n,
			lastCoords: e.coords
		}, this.adapter?.setPanEnabled(!1), this.adapter?.setCursor("grabbing"), n.kind === "midpoint") {
			let t = this.features.find((e) => e.id === n.featureId);
			if (t) {
				this.insertVertex(t, n);
				let r = n.afterVertIdx + 1, i = {
					kind: "vertex",
					featureId: n.featureId,
					partIdx: n.partIdx,
					ringIdx: n.ringIdx,
					vertIdx: r,
					coords: n.coords
				};
				this.dragging = {
					handle: i,
					lastCoords: e.coords
				}, this.selectedHandle = i, this.updateSelectedVertexSource(), this.refreshDrawLayerSource(t.layerId), this.updateEditHandles();
			}
		}
	}
	handlePointerUp(e) {
		if (this.circleDraft) {
			this.finishCircleDraft();
			return;
		}
		if (this.featureDrag) {
			let e = this.features.find((e) => e.id === this.featureDrag.featureId);
			if (e) {
				let t = this.drawLayers.find((t) => t.id === e.layerId);
				t && this.computeSpecialProperties(e, t), this.pushHistory({
					type: "update",
					features: [{ ...e }]
				}), this.features = [...this.features], this.refreshDrawLayerSource(e.layerId);
			}
			this.featureDrag = null, this.adapter?.setPanEnabled(!0), this.adapter?.setCursor("");
			return;
		}
		if (!this.dragging) return;
		this.snapPos = null, this.updateSnapIndicator(), this.adapter?.setPanEnabled(!0), this.adapter?.setCursor(this.hoveredHandle ? "grab" : "");
		let t = this.features.find((e) => e.id === this.dragging.handle.featureId);
		if (t) {
			let e = this.drawLayers.find((e) => e.id === t.layerId);
			e && this.computeSpecialProperties(t, e), this.pushHistory({
				type: "update",
				features: [{ ...t }]
			}), this.features = [...this.features], this.refreshDrawLayerSource(t.layerId);
		}
		this.dragging = null;
	}
	handleContextMenu(e) {
		let t = Q(this.mode), n = t ? this.activeLayerIds[t] : null;
		n && (this.mode === "draw-line" || this.mode === "draw-polygon") && this.finishDraft(n);
	}
	defaultProperties(e) {
		let t = this.drawLayers.find((t) => t.id === e);
		return t ? Object.fromEntries(t.properties.map((e) => [e.name, null])) : {};
	}
	finishDraft(e) {
		let t = this.draftPoints;
		if (this.mode === "draw-line" && t.length >= 2) this.commitFeature({
			id: this.newId(),
			layerId: e,
			type: "LineString",
			coordinates: t.map((e) => [e[0], e[1]]),
			properties: this.defaultProperties(e)
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
		this.circleDraft && (this.circleDraft.radiusM = Se(this.circleDraft.center, e) / 100, this.updateCirclePreview(), this.helpText = `Radius: ${Ce(this.circleDraft.radiusM * 100)}`);
	}
	updateCirclePreview() {
		if (!this.sharedLayersCreated || !this.circleDraft) return;
		let e = this.circleDraft.radiusM >= vt ? [{
			type: "Feature",
			geometry: {
				type: "LineString",
				coordinates: we(this.circleDraft.center, this.circleDraft.radiusM)
			},
			properties: {}
		}] : [];
		this.dispatch("webmapx-set-source-data", {
			id: B,
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
			id: B,
			data: {
				type: "FeatureCollection",
				features: []
			}
		});
		let n = this.activeLayerIds.Polygon;
		n && t >= vt && this.commitFeature({
			id: this.newId(),
			layerId: n,
			type: "Polygon",
			coordinates: [we(e, t)],
			properties: this.defaultProperties(n)
		}), this.helpText = "Click and drag to draw a circle.";
	}
	computeSnap(e) {
		return this.computeSnapExcluding(e, null, this.mode === "draw-point");
	}
	computeSnapExcluding(e, t, n) {
		return this.adapter ? rt(e, this.features.filter((e) => e.id !== t && !(n && $(e.type))), (e) => {
			let t = this.adapter.project(e);
			return [t[0], t[1]];
		}, {
			threshold: _t,
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
			id: X,
			data: {
				type: "FeatureCollection",
				features: e
			}
		});
	}
	updateRubberband() {
		if (!this.sharedLayersCreated) return;
		let e = [], t = [], n = this.mode === "draw-point" || this.mode === "draw-line" || this.mode === "draw-polygon", r = this.effectiveSnap && this.snapPos ? this.snapPos : this.cursorPos;
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
			id: B,
			data: {
				type: "FeatureCollection",
				features: e
			}
		}), this.dispatch("webmapx-set-source-data", {
			id: G,
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
			id: X,
			data: {
				type: "FeatureCollection",
				features: i
			}
		});
	}
	updateSelectedSource() {
		if (!this.sharedLayersCreated) return;
		let e = this.features.find((e) => e.id === this.selectedFeatureId), t = e && $(e.type) ? [{
			type: "Feature",
			id: e.id,
			geometry: {
				type: e.type,
				coordinates: e.coordinates
			},
			properties: {}
		}] : [];
		this.dispatch("webmapx-set-source-data", {
			id: W,
			data: {
				type: "FeatureCollection",
				features: t
			}
		});
	}
	enterEditMode(e) {
		this.editState = "editing", this.helpText = "Drag points to move. Drag midpoints to add a point. Click a point and press Delete to remove it. Click empty to exit.", this.updateEditHandles(), this.adapter?.setCursor("default"), this.requestUpdate();
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
				id: q,
				data: {
					type: "FeatureCollection",
					features: []
				}
			}), this.dispatch("webmapx-set-source-data", {
				id: J,
				data: {
					type: "FeatureCollection",
					features: []
				}
			});
			return;
		}
		this.selectedHandle && this.selectedHandle.featureId !== e.id && (this.selectedHandle = null, this.updateSelectedVertexSource()), this.editHandles = this.computeHandles(e);
		let t = this.editState === "editing", n = this.editHandles.filter((e) => e.kind === "vertex").map((e) => ({
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: e.coords
			},
			properties: {}
		})), r = t ? this.editHandles.filter((e) => e.kind === "midpoint").map((e) => ({
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: e.coords
			},
			properties: {}
		})) : [];
		this.dispatch("webmapx-set-source-data", {
			id: q,
			data: {
				type: "FeatureCollection",
				features: n
			}
		}), this.dispatch("webmapx-set-source-data", {
			id: J,
			data: {
				type: "FeatureCollection",
				features: r
			}
		});
	}
	findHandleAt(e) {
		let t = null, n = ht;
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
		let n = JSON.parse(JSON.stringify(e.coordinates)), { partIdx: r, ringIdx: i, afterVertIdx: a } = t;
		e.type === "LineString" ? n.splice(a + 1, 0, [t.coords[0], t.coords[1]]) : e.type === "MultiLineString" ? n[r].splice(a + 1, 0, [t.coords[0], t.coords[1]]) : e.type === "Polygon" ? n[i].splice(a + 1, 0, [t.coords[0], t.coords[1]]) : e.type === "MultiPolygon" && n[r][i].splice(a + 1, 0, [t.coords[0], t.coords[1]]), e.coordinates = n, this.pushHistory({
			type: "update",
			features: [{ ...e }]
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
			id: Y,
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
		t.coordinates = n;
		let o = this.drawLayers.find((e) => e.id === t.layerId);
		o && this.computeSpecialProperties(t, o), this.pushHistory({
			type: "update",
			features: [{ ...t }]
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
		}), this.features = [...this.features, e], this.refreshDrawLayerSource(e.layerId), this.setModeInternal(this.mode), this.selectedFeatureId = e.id, this.editState = $(e.type) ? "editing" : "selected", this.updateSelectedSource(), this.updateEditHandles();
	}
	deleteSelected() {
		if (!this.selectedFeatureId) return;
		let e = this.features.filter((e) => e.id === this.selectedFeatureId);
		this.pushHistory({
			type: "delete",
			features: e
		}), this.features = this.features.filter((e) => e.id !== this.selectedFeatureId), new Set(e.map((e) => e.layerId)).forEach((e) => this.refreshDrawLayerSource(e)), this.selectedFeatureId = null, this.editState = "none", this.editHandles = [], this.adapter?.setCursor(""), this.updateSelectedSource(), this.updateEditHandles();
	}
	pushHistory(e) {
		this.history = this.history.slice(0, this.historyIndex + 1), this.history.push(e), this.historyIndex = this.history.length - 1, this.uiVersion++;
	}
	removeLastDraftPoint() {
		this.draftRedoStack.push(this.draftPoints.pop()), this.uiVersion++, this.updateRubberband(), this.updateHelpTextDuring();
	}
	undoOrDraftBack() {
		this.draftPoints.length > 0 ? this.removeLastDraftPoint() : this.undo();
	}
	redoOrDraftForward() {
		this.draftRedoStack.length > 0 ? (this.draftPoints.push(this.draftRedoStack.pop()), this.uiVersion++, this.updateRubberband(), this.updateHelpTextDuring()) : this.redo();
	}
	undo() {
		if (this.historyIndex < 0) return;
		let e = this.history[this.historyIndex--];
		this.uiVersion++;
		let t = /* @__PURE__ */ new Set();
		if (e.type === "add" || e.type === "finish") {
			let n = new Set(e.features.map((e) => e.id));
			this.features = this.features.filter((e) => !n.has(e.id)), e.features.forEach((e) => t.add(e.layerId));
		} else e.type === "delete" ? (this.features = [...this.features, ...e.features], e.features.forEach((e) => t.add(e.layerId))) : e.type === "update" && (this.features = this.features.map((n) => {
			let r = e.features.find((e) => e.id === n.id);
			return r ? (t.add(n.layerId), {
				...n,
				coordinates: r.coordinates
			}) : n;
		}));
		if (this.selectedFeatureId = null, this.editState = "none", this.updateSelectedSource(), this.updateEditHandles(), t.forEach((e) => this.refreshDrawLayerSource(e)), e.type === "finish" && e.draftPoints) {
			let t = e.features[0];
			this.mode = t.type === "LineString" ? "draw-line" : "draw-polygon", this.draftPoints = e.draftPoints.map((e) => [e[0], e[1]]), this.draftRedoStack = [], this.cursorPos = this.draftPoints[this.draftPoints.length - 1], this.updateRubberband(), this.updateHelpTextDuring();
		}
	}
	redo() {
		if (this.historyIndex >= this.history.length - 1) return;
		let e = this.history[++this.historyIndex];
		this.uiVersion++;
		let t = /* @__PURE__ */ new Set();
		if (e.type === "add" || e.type === "finish") this.features = [...this.features, ...e.features], e.features.forEach((e) => t.add(e.layerId));
		else if (e.type === "delete") {
			let n = new Set(e.features.map((e) => e.id));
			this.features = this.features.filter((e) => !n.has(e.id)), e.features.forEach((e) => t.add(e.layerId));
		} else e.type === "update" && (this.features = this.features.map((n) => {
			let r = e.features.find((e) => e.id === n.id);
			return r ? (t.add(n.layerId), {
				...n,
				coordinates: r.coordinates
			}) : n;
		}));
		if (t.forEach((e) => this.refreshDrawLayerSource(e)), e.type === "finish") {
			let t = e.features[0];
			this.draftPoints = [], this.draftRedoStack = [], this.cursorPos = null, this.selectedFeatureId = t.id, this.editState = $(t.type) ? "editing" : "selected", this.updateSelectedSource(), this.updateEditHandles(), this.updateRubberband();
		}
	}
	exportGeoJSON() {
		this.exportFilename = "draw-export", this.exportMode = "combined", this.exportDialog.show();
	}
	async doExport() {
		this.exportDialog.hide();
		let e = this.exportFilename.trim() || "draw-export";
		if (this.drawLayers.length <= 1 || this.exportMode === "combined") {
			let t = {
				type: "FeatureCollection",
				features: this.features.map((e) => ({
					type: "Feature",
					id: e.id,
					geometry: {
						type: e.type,
						coordinates: e.coordinates
					},
					properties: {
						...e.properties,
						_layer: this.drawLayers.find((t) => t.id === e.layerId)?.name ?? e.layerId
					}
				}))
			};
			this.downloadBlob(new Blob([JSON.stringify(t, null, 2)], { type: "application/json" }), `${e}.geojson`);
		} else {
			let t = new be(new me("application/zip"));
			for (let e of this.drawLayers) {
				let n = {
					type: "FeatureCollection",
					features: this.features.filter((t) => t.layerId === e.id).map((e) => ({
						type: "Feature",
						id: e.id,
						geometry: {
							type: e.type,
							coordinates: e.coordinates
						},
						properties: { ...e.properties }
					}))
				}, r = e.name.replace(/[/\\?%*:|"<>]/g, "_");
				await t.add(`${r}.geojson`, new pe(JSON.stringify(n, null, 2)));
			}
			this.downloadBlob(await t.close(), `${e}.zip`);
		}
	}
	downloadBlob(e, t) {
		let n = URL.createObjectURL(e), r = document.createElement("a");
		r.href = n, r.download = t, r.click(), URL.revokeObjectURL(n);
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
	findFeatureAt(e, t) {
		for (let n of [...this.features].reverse()) if (n.type === "Point") {
			let t = this.adapter.project(n.coordinates);
			if (Math.hypot(t[0] - e[0], t[1] - e[1]) < 10) return n;
		} else if (n.type === "MultiPoint") for (let t of n.coordinates) {
			let r = this.adapter.project(t);
			if (Math.hypot(r[0] - e[0], r[1] - e[1]) < 10) return n;
		}
		else if (n.type === "LineString") {
			if (this.pixelNearPolyline(e, n.coordinates, 10)) return n;
		} else if (n.type === "MultiLineString") {
			if (n.coordinates.some((t) => this.pixelNearPolyline(e, t, 10))) return n;
		} else if (n.type === "Polygon") {
			if (this.pointInRing(t, n.coordinates[0]) || this.pixelNearPolyline(e, n.coordinates[0], 10)) return n;
		} else if (n.type === "MultiPolygon") for (let r of n.coordinates) {
			let i = r[0];
			if (i && (this.pointInRing(t, i) || this.pixelNearPolyline(e, i, 10))) return n;
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
		this.dispatchEvent(new CustomEvent(e, {
			detail: t,
			bubbles: !0,
			composed: !0
		}));
	}
	updateHelpTextDuring() {
		let e = this.draftPoints.length;
		this.mode === "draw-line" ? this.helpText = `${e} pt${e === 1 ? "" : "s"}. Double-click or right-click to finish.` : this.mode === "draw-polygon" && (this.helpText = e >= 3 ? `${e} pts. Click first point, double-click, or right-click to close.` : `${e} pt${e === 1 ? "" : "s"}. Need at least 3 to close.`);
	}
	toggleButton(e, t, n, r, i = t) {
		return o`
            <sl-tooltip content=${i}>
                <button type="button" class="toggle-button" name=${e}
                    aria-label=${t} aria-pressed=${n ? "true" : "false"}
                    @click=${r}>
                    <sl-icon name=${e} aria-hidden="true"></sl-icon>
                </button>
            </sl-tooltip>`;
	}
	render() {
		let e = this.features.find((e) => e.id === this.selectedFeatureId), t = e ? this.drawLayers.find((t) => t.id === e.layerId) : null;
		return o`
            <div class="toolbar">
                ${this.toggleButton("cursor", "Select", this.mode === "select", () => this.requestDrawMode("select"))}
                ${this.toggleButton("geo-fill", "Draw point", this.mode === "draw-point", () => this.requestDrawMode("draw-point"))}
                ${this.toggleButton("slash-lg", "Draw line", this.mode === "draw-line", () => this.requestDrawMode("draw-line"))}
                ${this.toggleButton("pentagon", "Draw polygon", this.mode === "draw-polygon", () => this.requestDrawMode("draw-polygon"))}
                ${this.toggleButton("circle", "Draw circle", this.mode === "draw-circle", () => this.requestDrawMode("draw-circle"))}

                <div class="divider"></div>

                ${this.toggleButton("magnet", "Snap to points and edges", this.effectiveSnap, () => {
			this.snapEnabled = !this.snapEnabled, this.snapEnabled || (this.snapPos = null, this.updateRubberband());
		}, `Snap to points and edges (${this.snapEnabled ? "on" : "off"}) — hold Alt to toggle`)}

                <div class="divider"></div>

                <sl-tooltip content="Undo (${this.modKey}+Z)">
                    <sl-icon-button name="arrow-counterclockwise" label="Undo"
                        ?disabled=${this.historyIndex < 0 && this.draftPoints.length === 0}
                        @click=${() => this.undoOrDraftBack()}>
                    </sl-icon-button>
                </sl-tooltip>
                <sl-tooltip content="Redo (${this.modKey}+Y)">
                    <sl-icon-button name="arrow-clockwise" label="Redo"
                        ?disabled=${this.historyIndex >= this.history.length - 1 && this.draftRedoStack.length === 0}
                        @click=${() => this.redoOrDraftForward()}>
                    </sl-icon-button>
                </sl-tooltip>

                <div class="divider"></div>

                <sl-tooltip content=${this.draftPoints.length > 0 ? "Remove last point" : this.selectedHandle ? "Delete selected point" : "Delete selected"}>
                    <sl-icon-button name="trash"
                        label=${this.draftPoints.length > 0 ? "Remove last point" : this.selectedHandle ? "Delete selected point" : "Delete selected"}
                        ?disabled=${this.draftPoints.length === 0 && !this.selectedFeatureId && !this.selectedHandle}
                        @click=${() => this.draftPoints.length > 0 ? this.removeLastDraftPoint() : this.selectedHandle ? this.deleteSelectedVertex() : this.deleteSelected()}>
                    </sl-icon-button>
                </sl-tooltip>
                <sl-tooltip content="Export GeoJSON">
                    <sl-icon-button name="download" label="Export GeoJSON"
                        ?disabled=${this.features.length === 0}
                        @click=${() => this.exportGeoJSON()}>
                    </sl-icon-button>
                </sl-tooltip>
            </div>

            <div class="scroll-content">
            <div class="help">${this.helpText}</div>

            ${this.isTouchDevice && (this.mode === "draw-line" || this.mode === "draw-polygon") && this.draftPoints.length >= (this.mode === "draw-line" ? 2 : 3) ? o`
                <sl-button size="small" variant="primary" style="margin-bottom:.4rem;width:100%"
                    @click=${() => {
			let e = Q(this.mode), t = e ? this.activeLayerIds[e] : null;
			t && this.finishDraft(t);
		}}>
                    Finish
                </sl-button>
            ` : ""}

            ${this.drawLayers.length > 0 ? o`
                <div class="layers-section">
                    <div class="section-label">Editing</div>
                    ${this.drawLayers.map((e) => o`
                        <div class="layer-row">
                            <button type="button" class="layer-select-btn" title="Click to change layer"
                                 @click=${() => this.openLayerDialog(e.type === "Point" ? "draw-point" : e.type === "LineString" ? "draw-line" : "draw-polygon")}>
                                <span class="color-dot" style="background:${e.color}"></span>
                                <span class="layer-name">${e.name}</span>
                                <span class="layer-type">${e.type === "LineString" ? "Line" : e.type}</span>
                                <small style="color:var(--color-text-muted, #6b7681);font-size:.7rem">${this.features.filter((t) => t.layerId === e.id).length}</small>
                            </button>
                            ${this.drawLayers.length > 1 ? o`
                                <sl-tooltip content="Stop editing">
                                    <sl-icon-button name="x" class="remove-layer-btn" label="Stop editing ${e.name}"
                                        @click=${(t) => {
			t.stopPropagation(), this.removeFromEditing(e);
		}}>
                                    </sl-icon-button>
                                </sl-tooltip>
                            ` : ""}
                        </div>
                    `)}
                </div>
            ` : ""}

            ${e && t ? o`
                <div class="section-label" style="margin-top:.5rem">Selected: ${t.name}</div>
                ${t.properties.map((n) => o`
                    <div class="prop-row">
                        <span class="prop-label">${n.name}</span>
                        ${n.name === "id" || [
			"longitude",
			"latitude",
			"area",
			"perimeter",
			"length",
			"create-time",
			"update-time"
		].includes(n.type) ? o`<span class="prop-value" style="color:var(--color-text-muted, #6b7681);font-style:italic;padding:0 0.3rem">${["create-time", "update-time"].includes(n.type) ? e.properties[n.name] ? new Date(e.properties[n.name]).toLocaleString() : "—" : e.properties[n.name] ?? "—"}</span>` : n.type === "imageURL" ? o`<div class="prop-url-wrap">
                                        <sl-input size="small"
                                            .value=${String(e.properties[n.name] ?? "")}
                                            placeholder="image URL"
                                            @sl-change=${(r) => {
			e.properties[n.name] = r.target.value, t && this.computeSpecialProperties(e, t), this.features = [...this.features], this.refreshDrawLayerSource(e.layerId);
		}}></sl-input>
                                        ${e.properties[n.name] ? o`<img class="prop-img" src=${String(e.properties[n.name])} @error=${(e) => {
			let t = e.target, n = document.createElement("span");
			n.className = "prop-img-error", n.textContent = "⚠ invalid image", t.replaceWith(n);
		}}>` : ""}
                                       </div>` : n.type === "linkURL" ? o`<div class="prop-url-wrap">
                                            <sl-input size="small"
                                                .value=${String(e.properties[n.name] ?? "")}
                                                placeholder="link URL"
                                                @sl-change=${(r) => {
			e.properties[n.name] = r.target.value, t && this.computeSpecialProperties(e, t), this.features = [...this.features], this.refreshDrawLayerSource(e.layerId);
		}}></sl-input>
                                            ${e.properties[n.name] ? o`<a class="prop-link" href=${String(e.properties[n.name])} target="_blank" rel="noopener noreferrer">${e.properties[n.name]}</a>` : ""}
                                           </div>` : o`<sl-input size="small" class="prop-value"
                                            .value=${String(e.properties[n.name] ?? "")}
                                            @sl-change=${(r) => {
			e.properties[n.name] = r.target.value, t && this.computeSpecialProperties(e, t), this.features = [...this.features], this.refreshDrawLayerSource(e.layerId);
		}}></sl-input>`}
                    </div>
                `)}
            ` : ""}
            </div>

            <webmapx-draw-layer-dialog
                @webmapx-draw-layer-confirm=${this.handleLayerConfirm}
                @webmapx-draw-layer-cancel=${this.handleLayerCancel}>
            </webmapx-draw-layer-dialog>

            <sl-dialog id="export-dialog" label="Export GeoJSON">
                <div class="prop-row">
                    <span class="prop-label">Filename</span>
                    <sl-input class="prop-value" size="small"
                        .value=${this.exportFilename}
                        @sl-input=${(e) => {
			this.exportFilename = e.target.value;
		}}>
                        <span slot="suffix">${this.exportMode === "separate" ? ".zip" : ".geojson"}</span>
                    </sl-input>
                </div>
                ${this.drawLayers.length > 1 ? o`
                    <div style="margin-top:.6rem">
                        <sl-radio-group label="Export as" .value=${this.exportMode}
                            @sl-change=${(e) => {
			this.exportMode = e.target.value;
		}}>
                            <sl-radio value="combined">Single GeoJSON file (all layers combined)</sl-radio>
                            <sl-radio value="separate">Separate files per layer (ZIP archive)</sl-radio>
                        </sl-radio-group>
                    </div>
                ` : ""}
                <sl-button slot="footer" variant="primary" autofocus @click=${() => this.doExport()}>Download</sl-button>
                <sl-button slot="footer" variant="default" @click=${() => this.exportDialog.hide()}>Cancel</sl-button>
            </sl-dialog>
        `;
	}
};
l([n()], Z.prototype, "mode", void 0), l([n()], Z.prototype, "drawLayers", void 0), l([n()], Z.prototype, "features", void 0), l([n()], Z.prototype, "selectedFeatureId", void 0), l([n()], Z.prototype, "helpText", void 0), l([n()], Z.prototype, "pendingMode", void 0), l([n()], Z.prototype, "uiVersion", void 0), l([n()], Z.prototype, "isTouchDevice", void 0), l([n()], Z.prototype, "snapEnabled", void 0), l([n()], Z.prototype, "altActive", void 0), l([n()], Z.prototype, "editState", void 0), l([i("webmapx-draw-layer-dialog", !0)], Z.prototype, "layerDialog", void 0), l([i("#export-dialog")], Z.prototype, "exportDialog", void 0), l([n()], Z.prototype, "exportFilename", void 0), l([n()], Z.prototype, "exportMode", void 0), Z = l([a("webmapx-draw-tool")], Z);
function Q(e) {
	return e === "draw-point" ? "Point" : e === "draw-line" ? "LineString" : e === "draw-polygon" || e === "draw-circle" ? "Polygon" : null;
}
function yt(e) {
	return e === "Point" || e === "MultiPoint" || e === "LineString" || e === "MultiLineString" || e === "Polygon" || e === "MultiPolygon";
}
function $(e) {
	return e === "Point" || e === "MultiPoint";
}
function bt(e) {
	return e === "LineString" || e === "MultiLineString";
}
function xt(e) {
	return e === "Polygon" || e === "MultiPolygon";
}
//#endregion
export { Z as WebmapxDrawTool };
