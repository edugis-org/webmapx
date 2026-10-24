import { a as e, i as t, n } from "./decorators-d8E4nZJy.js";
import { a as r, i, o as a, s as o } from "./directive-helpers-Debt3Tx3.js";
import { t as s } from "./chunk.YHLNUJ7P-BjspQfLm.js";
import { n as c, r as l, t as u } from "./chunk.NYIIDP5N-gftugmWL.js";
import { n as d, t as f } from "./static-html-Cq7cHvCj.js";
import { t as p } from "./chunk.6CTB5ZDJ-DjZrBd6Y.js";
import { t as m } from "./chunk.36O46B5H-CNPWSZFH.js";
import { r as h, t as g } from "./chunk.3RPBFEDE-DBlOq5Pm.js";
import { t as _ } from "./chunk.MAQXLKQ7-BSeX409m.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.SBCFYC2S.js
var v = class extends i {
	constructor() {
		super(...arguments), this.formControlController = new g(this, { assumeInteractionOn: ["click"] }), this.hasSlotController = new u(this, "[default]", "prefix", "suffix"), this.localize = new p(this), this.hasFocus = !1, this.invalid = !1, this.title = "", this.variant = "default", this.size = "medium", this.caret = !1, this.disabled = !1, this.loading = !1, this.outline = !1, this.pill = !1, this.circle = !1, this.type = "button", this.name = "", this.value = "", this.href = "", this.rel = "noreferrer noopener";
	}
	get validity() {
		return this.isButton() ? this.button.validity : h;
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
		let e = this.isLink(), t = e ? f`a` : f`button`;
		return d`
      <${t}
        part="base"
        class=${l({
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
        ?disabled=${c(e ? void 0 : this.disabled)}
        type=${c(e ? void 0 : this.type)}
        title=${this.title}
        name=${c(e ? void 0 : this.name)}
        value=${c(e ? void 0 : this.value)}
        href=${c(e && !this.disabled ? this.href : void 0)}
        target=${c(e ? this.target : void 0)}
        download=${c(e ? this.download : void 0)}
        rel=${c(e ? this.rel : void 0)}
        role=${c(e ? void 0 : "button")}
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
        ${this.caret ? d` <sl-icon part="caret" class="button__caret" library="system" name="caret"></sl-icon> ` : ""}
        ${this.loading ? d`<sl-spinner part="spinner"></sl-spinner>` : ""}
      </${t}>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.JCXLDPQF.js
v.styles = [r, _], v.dependencies = {
	"sl-icon": s,
	"sl-spinner": m
}, o([n(".button")], v.prototype, "button", 2), o([t()], v.prototype, "hasFocus", 2), o([t()], v.prototype, "invalid", 2), o([e()], v.prototype, "title", 2), o([e({ reflect: !0 })], v.prototype, "variant", 2), o([e({ reflect: !0 })], v.prototype, "size", 2), o([e({
	type: Boolean,
	reflect: !0
})], v.prototype, "caret", 2), o([e({
	type: Boolean,
	reflect: !0
})], v.prototype, "disabled", 2), o([e({
	type: Boolean,
	reflect: !0
})], v.prototype, "loading", 2), o([e({
	type: Boolean,
	reflect: !0
})], v.prototype, "outline", 2), o([e({
	type: Boolean,
	reflect: !0
})], v.prototype, "pill", 2), o([e({
	type: Boolean,
	reflect: !0
})], v.prototype, "circle", 2), o([e()], v.prototype, "type", 2), o([e()], v.prototype, "name", 2), o([e()], v.prototype, "value", 2), o([e()], v.prototype, "href", 2), o([e()], v.prototype, "target", 2), o([e()], v.prototype, "rel", 2), o([e()], v.prototype, "download", 2), o([e()], v.prototype, "form", 2), o([e({ attribute: "formaction" })], v.prototype, "formAction", 2), o([e({ attribute: "formenctype" })], v.prototype, "formEnctype", 2), o([e({ attribute: "formmethod" })], v.prototype, "formMethod", 2), o([e({
	attribute: "formnovalidate",
	type: Boolean
})], v.prototype, "formNoValidate", 2), o([e({ attribute: "formtarget" })], v.prototype, "formTarget", 2), o([a("disabled", { waitUntilFirstUpdate: !0 })], v.prototype, "handleDisabledChange", 1), v.define("sl-button");
//#endregion
export { v as t };
