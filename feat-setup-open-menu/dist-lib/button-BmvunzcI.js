import { a as e, h as t, i as n, n as r, p as i } from "./decorators-d8E4nZJy.js";
import { a, i as o, o as s, s as c } from "./directive-helpers-Debt3Tx3.js";
import { t as l } from "./chunk.YHLNUJ7P-BjspQfLm.js";
import { n as u, r as d, t as f } from "./chunk.NYIIDP5N-gftugmWL.js";
import { n as p, t as m } from "./static-html-Cq7cHvCj.js";
import { t as h } from "./chunk.6CTB5ZDJ-DjZrBd6Y.js";
import { r as g, t as _ } from "./chunk.3RPBFEDE-DBlOq5Pm.js";
import { t as v } from "./chunk.MAQXLKQ7-BSeX409m.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.7DUCI5S4.js
var y = t`
  :host {
    --track-width: 2px;
    --track-color: rgb(128 128 128 / 25%);
    --indicator-color: var(--sl-color-primary-600);
    --speed: 2s;

    display: inline-flex;
    width: 1em;
    height: 1em;
    flex: none;
  }

  .spinner {
    flex: 1 1 auto;
    height: 100%;
    width: 100%;
  }

  .spinner__track,
  .spinner__indicator {
    fill: none;
    stroke-width: var(--track-width);
    r: calc(0.5em - var(--track-width) / 2);
    cx: 0.5em;
    cy: 0.5em;
    transform-origin: 50% 50%;
  }

  .spinner__track {
    stroke: var(--track-color);
    transform-origin: 0% 0%;
  }

  .spinner__indicator {
    stroke: var(--indicator-color);
    stroke-linecap: round;
    stroke-dasharray: 150% 75%;
    animation: spin var(--speed) linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
      stroke-dasharray: 0.05em, 3em;
    }

    50% {
      transform: rotate(450deg);
      stroke-dasharray: 1.375em, 1.375em;
    }

    100% {
      transform: rotate(1080deg);
      stroke-dasharray: 0.05em, 3em;
    }
  }
`, b = class extends o {
	constructor() {
		super(...arguments), this.localize = new h(this);
	}
	render() {
		return i`
      <svg part="base" class="spinner" role="progressbar" aria-label=${this.localize.term("loading")}>
        <circle class="spinner__track"></circle>
        <circle class="spinner__indicator"></circle>
      </svg>
    `;
	}
};
b.styles = [a, y];
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.SBCFYC2S.js
var x = class extends o {
	constructor() {
		super(...arguments), this.formControlController = new _(this, { assumeInteractionOn: ["click"] }), this.hasSlotController = new f(this, "[default]", "prefix", "suffix"), this.localize = new h(this), this.hasFocus = !1, this.invalid = !1, this.title = "", this.variant = "default", this.size = "medium", this.caret = !1, this.disabled = !1, this.loading = !1, this.outline = !1, this.pill = !1, this.circle = !1, this.type = "button", this.name = "", this.value = "", this.href = "", this.rel = "noreferrer noopener";
	}
	get validity() {
		return this.isButton() ? this.button.validity : g;
	}
	get validationMessage() {
		return this.isButton() ? this.button.validationMessage : "";
	}
	firstUpdated() {
		this.isButton() && this.formControlController.updateValidity();
	}
	handleBlur() {
		this.hasFocus = !1, this.emit("sl-blur");
	}
	handleFocus() {
		this.hasFocus = !0, this.emit("sl-focus");
	}
	handleClick() {
		this.type === "submit" && this.formControlController.submit(this), this.type === "reset" && this.formControlController.reset(this);
	}
	handleInvalid(e) {
		this.formControlController.setValidity(!1), this.formControlController.emitInvalidEvent(e);
	}
	isButton() {
		return !this.href;
	}
	isLink() {
		return !!this.href;
	}
	handleDisabledChange() {
		this.isButton() && this.formControlController.setValidity(this.disabled);
	}
	click() {
		this.button.click();
	}
	focus(e) {
		this.button.focus(e);
	}
	blur() {
		this.button.blur();
	}
	checkValidity() {
		return this.isButton() ? this.button.checkValidity() : !0;
	}
	getForm() {
		return this.formControlController.getForm();
	}
	reportValidity() {
		return this.isButton() ? this.button.reportValidity() : !0;
	}
	setCustomValidity(e) {
		this.isButton() && (this.button.setCustomValidity(e), this.formControlController.updateValidity());
	}
	render() {
		let e = this.isLink(), t = e ? m`a` : m`button`;
		return p`
      <${t}
        part="base"
        class=${d({
			button: !0,
			"button--default": this.variant === "default",
			"button--primary": this.variant === "primary",
			"button--success": this.variant === "success",
			"button--neutral": this.variant === "neutral",
			"button--warning": this.variant === "warning",
			"button--danger": this.variant === "danger",
			"button--text": this.variant === "text",
			"button--small": this.size === "small",
			"button--medium": this.size === "medium",
			"button--large": this.size === "large",
			"button--caret": this.caret,
			"button--circle": this.circle,
			"button--disabled": this.disabled,
			"button--focused": this.hasFocus,
			"button--loading": this.loading,
			"button--standard": !this.outline,
			"button--outline": this.outline,
			"button--pill": this.pill,
			"button--rtl": this.localize.dir() === "rtl",
			"button--has-label": this.hasSlotController.test("[default]"),
			"button--has-prefix": this.hasSlotController.test("prefix"),
			"button--has-suffix": this.hasSlotController.test("suffix")
		})}
        ?disabled=${u(e ? void 0 : this.disabled)}
        type=${u(e ? void 0 : this.type)}
        title=${this.title}
        name=${u(e ? void 0 : this.name)}
        value=${u(e ? void 0 : this.value)}
        href=${u(e && !this.disabled ? this.href : void 0)}
        target=${u(e ? this.target : void 0)}
        download=${u(e ? this.download : void 0)}
        rel=${u(e ? this.rel : void 0)}
        role=${u(e ? void 0 : "button")}
        aria-disabled=${this.disabled ? "true" : "false"}
        tabindex=${this.disabled ? "-1" : "0"}
        @blur=${this.handleBlur}
        @focus=${this.handleFocus}
        @invalid=${this.isButton() ? this.handleInvalid : null}
        @click=${this.handleClick}
      >
        <slot name="prefix" part="prefix" class="button__prefix"></slot>
        <slot part="label" class="button__label"></slot>
        <slot name="suffix" part="suffix" class="button__suffix"></slot>
        ${this.caret ? p` <sl-icon part="caret" class="button__caret" library="system" name="caret"></sl-icon> ` : ""}
        ${this.loading ? p`<sl-spinner part="spinner"></sl-spinner>` : ""}
      </${t}>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.JCXLDPQF.js
x.styles = [a, v], x.dependencies = {
	"sl-icon": l,
	"sl-spinner": b
}, c([r(".button")], x.prototype, "button", 2), c([n()], x.prototype, "hasFocus", 2), c([n()], x.prototype, "invalid", 2), c([e()], x.prototype, "title", 2), c([e({ reflect: !0 })], x.prototype, "variant", 2), c([e({ reflect: !0 })], x.prototype, "size", 2), c([e({
	type: Boolean,
	reflect: !0
})], x.prototype, "caret", 2), c([e({
	type: Boolean,
	reflect: !0
})], x.prototype, "disabled", 2), c([e({
	type: Boolean,
	reflect: !0
})], x.prototype, "loading", 2), c([e({
	type: Boolean,
	reflect: !0
})], x.prototype, "outline", 2), c([e({
	type: Boolean,
	reflect: !0
})], x.prototype, "pill", 2), c([e({
	type: Boolean,
	reflect: !0
})], x.prototype, "circle", 2), c([e()], x.prototype, "type", 2), c([e()], x.prototype, "name", 2), c([e()], x.prototype, "value", 2), c([e()], x.prototype, "href", 2), c([e()], x.prototype, "target", 2), c([e()], x.prototype, "rel", 2), c([e()], x.prototype, "download", 2), c([e()], x.prototype, "form", 2), c([e({ attribute: "formaction" })], x.prototype, "formAction", 2), c([e({ attribute: "formenctype" })], x.prototype, "formEnctype", 2), c([e({ attribute: "formmethod" })], x.prototype, "formMethod", 2), c([e({
	attribute: "formnovalidate",
	type: Boolean
})], x.prototype, "formNoValidate", 2), c([e({ attribute: "formtarget" })], x.prototype, "formTarget", 2), c([s("disabled", { waitUntilFirstUpdate: !0 })], x.prototype, "handleDisabledChange", 1), x.define("sl-button");
//#endregion
export { b as n, x as t };
