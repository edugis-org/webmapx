import { a as e, h as t, i as n, n as r } from "./decorators-d8E4nZJy.js";
import { a as i, i as a, o, s } from "./directive-helpers-Debt3Tx3.js";
import { n as c, r as l, t as u } from "./chunk.NYIIDP5N-gftugmWL.js";
import { n as d } from "./static-html-Cq7cHvCj.js";
import { t as f } from "./chunk.MAQXLKQ7-BSeX409m.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.2P5EQCYK.js
var p = t`
  ${f}

  .button__prefix,
  .button__suffix,
  .button__label {
    display: inline-flex;
    position: relative;
    align-items: center;
  }

  /* We use a hidden input so constraint validation errors work, since they don't appear to show when used with buttons.
    We can't actually hide it, though, otherwise the messages will be suppressed by the browser. */
  .hidden-input {
    all: unset;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    outline: dotted 1px red;
    opacity: 0;
    z-index: -1;
  }
`, m = class extends a {
	constructor() {
		super(...arguments), this.hasSlotController = new u(this, "[default]", "prefix", "suffix"), this.hasFocus = !1, this.checked = !1, this.disabled = !1, this.size = "medium", this.pill = !1;
	}
	connectedCallback() {
		super.connectedCallback(), this.setAttribute("role", "presentation");
	}
	handleBlur() {
		this.hasFocus = !1, this.emit("sl-blur");
	}
	handleClick(e) {
		if (this.disabled) {
			e.preventDefault(), e.stopPropagation();
			return;
		}
		this.checked = !0;
	}
	handleFocus() {
		this.hasFocus = !0, this.emit("sl-focus");
	}
	handleDisabledChange() {
		this.setAttribute("aria-disabled", this.disabled ? "true" : "false");
	}
	focus(e) {
		this.input.focus(e);
	}
	blur() {
		this.input.blur();
	}
	render() {
		return d`
      <div part="base" role="presentation">
        <button
          part="${`button${this.checked ? " button--checked" : ""}`}"
          role="radio"
          aria-checked="${this.checked}"
          class=${l({
			button: !0,
			"button--default": !0,
			"button--small": this.size === "small",
			"button--medium": this.size === "medium",
			"button--large": this.size === "large",
			"button--checked": this.checked,
			"button--disabled": this.disabled,
			"button--focused": this.hasFocus,
			"button--outline": !0,
			"button--pill": this.pill,
			"button--has-label": this.hasSlotController.test("[default]"),
			"button--has-prefix": this.hasSlotController.test("prefix"),
			"button--has-suffix": this.hasSlotController.test("suffix")
		})}
          aria-disabled=${this.disabled}
          type="button"
          value=${c(this.value)}
          @blur=${this.handleBlur}
          @focus=${this.handleFocus}
          @click=${this.handleClick}
        >
          <slot name="prefix" part="prefix" class="button__prefix"></slot>
          <slot part="label" class="button__label"></slot>
          <slot name="suffix" part="suffix" class="button__suffix"></slot>
        </button>
      </div>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.5P45LHIX.js
m.styles = [i, p], s([r(".button")], m.prototype, "input", 2), s([r(".hidden-input")], m.prototype, "hiddenInput", 2), s([n()], m.prototype, "hasFocus", 2), s([e({
	type: Boolean,
	reflect: !0
})], m.prototype, "checked", 2), s([e()], m.prototype, "value", 2), s([e({
	type: Boolean,
	reflect: !0
})], m.prototype, "disabled", 2), s([e({ reflect: !0 })], m.prototype, "size", 2), s([e({
	type: Boolean,
	reflect: !0
})], m.prototype, "pill", 2), s([o("disabled", { waitUntilFirstUpdate: !0 })], m.prototype, "handleDisabledChange", 1), m.define("sl-radio-button");
//#endregion
