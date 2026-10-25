import { a as e, h as t, i as n, n as r, p as i } from "./decorators-d8E4nZJy.js";
import { a, i as o, o as s, s as c } from "./directive-helpers-Debt3Tx3.js";
import { n as l, r as u, t as d } from "./chunk.NYIIDP5N-gftugmWL.js";
import { n as f } from "./static-html-Cq7cHvCj.js";
import { i as p, n as m, r as h, t as g } from "./chunk.3RPBFEDE-DBlOq5Pm.js";
import { t as _ } from "./chunk.MAQXLKQ7-BSeX409m.js";
import { t as v } from "./chunk.SI4ACBFK-CdJVQctt.js";
import { t as y } from "./chunk.A36OXQYR-DgnZveyb.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.B63YXDJO.js
var b = t`
  :host {
    display: block;
  }

  .form-control {
    position: relative;
    border: none;
    padding: 0;
    margin: 0;
  }

  .form-control__label {
    padding: 0;
  }

  .radio-group--required .radio-group__label::after {
    content: var(--sl-input-required-content);
    margin-inline-start: var(--sl-input-required-content-offset);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`, x = class extends o {
	constructor() {
		super(...arguments), this.formControlController = new g(this), this.hasSlotController = new d(this, "help-text", "label"), this.customValidityMessage = "", this.hasButtonGroup = !1, this.errorMessage = "", this.defaultValue = "", this.label = "", this.helpText = "", this.name = "option", this.value = "", this.size = "medium", this.form = "", this.required = !1;
	}
	get validity() {
		let e = this.required && !this.value;
		return this.customValidityMessage === "" ? e ? p : h : m;
	}
	get validationMessage() {
		let e = this.required && !this.value;
		return this.customValidityMessage === "" ? e ? this.validationInput.validationMessage : "" : this.customValidityMessage;
	}
	connectedCallback() {
		super.connectedCallback(), this.defaultValue = this.value;
	}
	firstUpdated() {
		this.formControlController.updateValidity();
	}
	getAllRadios() {
		return [...this.querySelectorAll("sl-radio, sl-radio-button")];
	}
	handleRadioClick(e) {
		let t = e.target.closest("sl-radio, sl-radio-button"), n = this.getAllRadios(), r = this.value;
		!t || t.disabled || (this.value = t.value, n.forEach((e) => e.checked = e === t), this.value !== r && (this.emit("sl-change"), this.emit("sl-input")));
	}
	handleKeyDown(e) {
		if (![
			"ArrowUp",
			"ArrowDown",
			"ArrowLeft",
			"ArrowRight",
			" "
		].includes(e.key)) return;
		let t = this.getAllRadios().filter((e) => !e.disabled), n = t.find((e) => e.checked) ?? t[0], r = e.key === " " ? 0 : ["ArrowUp", "ArrowLeft"].includes(e.key) ? -1 : 1, i = this.value, a = t.indexOf(n) + r;
		a < 0 && (a = t.length - 1), a > t.length - 1 && (a = 0), this.getAllRadios().forEach((e) => {
			e.checked = !1, this.hasButtonGroup || e.setAttribute("tabindex", "-1");
		}), this.value = t[a].value, t[a].checked = !0, this.hasButtonGroup ? t[a].shadowRoot.querySelector("button").focus() : (t[a].setAttribute("tabindex", "0"), t[a].focus()), this.value !== i && (this.emit("sl-change"), this.emit("sl-input")), e.preventDefault();
	}
	handleLabelClick() {
		this.focus();
	}
	handleInvalid(e) {
		this.formControlController.setValidity(!1), this.formControlController.emitInvalidEvent(e);
	}
	async syncRadioElements() {
		let e = this.getAllRadios();
		if (await Promise.all(e.map(async (e) => {
			await e.updateComplete, e.checked = e.value === this.value, e.size = this.size;
		})), this.hasButtonGroup = e.some((e) => e.tagName.toLowerCase() === "sl-radio-button"), e.length > 0 && !e.some((e) => e.checked)) if (this.hasButtonGroup) {
			let t = e[0].shadowRoot?.querySelector("button");
			t && t.setAttribute("tabindex", "0");
		} else e[0].setAttribute("tabindex", "0");
		if (this.hasButtonGroup) {
			let e = this.shadowRoot?.querySelector("sl-button-group");
			e && (e.disableRole = !0);
		}
	}
	syncRadios() {
		if (customElements.get("sl-radio") && customElements.get("sl-radio-button")) {
			this.syncRadioElements();
			return;
		}
		customElements.get("sl-radio") ? this.syncRadioElements() : customElements.whenDefined("sl-radio").then(() => this.syncRadios()), customElements.get("sl-radio-button") ? this.syncRadioElements() : customElements.whenDefined("sl-radio-button").then(() => this.syncRadios());
	}
	updateCheckedRadio() {
		this.getAllRadios().forEach((e) => e.checked = e.value === this.value), this.formControlController.setValidity(this.validity.valid);
	}
	handleSizeChange() {
		this.syncRadios();
	}
	handleValueChange() {
		this.hasUpdated && this.updateCheckedRadio();
	}
	checkValidity() {
		let e = this.required && !this.value, t = this.customValidityMessage !== "";
		return e || t ? (this.formControlController.emitInvalidEvent(), !1) : !0;
	}
	getForm() {
		return this.formControlController.getForm();
	}
	reportValidity() {
		let e = this.validity.valid;
		return this.errorMessage = this.customValidityMessage || e ? "" : this.validationInput.validationMessage, this.formControlController.setValidity(e), this.validationInput.hidden = !0, clearTimeout(this.validationTimeout), e || (this.validationInput.hidden = !1, this.validationInput.reportValidity(), this.validationTimeout = setTimeout(() => this.validationInput.hidden = !0, 1e4)), e;
	}
	setCustomValidity(e = "") {
		this.customValidityMessage = e, this.errorMessage = e, this.validationInput.setCustomValidity(e), this.formControlController.updateValidity();
	}
	focus(e) {
		let t = this.getAllRadios(), n = t.find((e) => e.checked), r = t.find((e) => !e.disabled), i = n || r;
		i && i.focus(e);
	}
	render() {
		let e = this.hasSlotController.test("label"), t = this.hasSlotController.test("help-text"), n = this.label ? !0 : !!e, r = this.helpText ? !0 : !!t, a = i`
      <slot @slotchange=${this.syncRadios} @click=${this.handleRadioClick} @keydown=${this.handleKeyDown}></slot>
    `;
		return i`
      <fieldset
        part="form-control"
        class=${u({
			"form-control": !0,
			"form-control--small": this.size === "small",
			"form-control--medium": this.size === "medium",
			"form-control--large": this.size === "large",
			"form-control--radio-group": !0,
			"form-control--has-label": n,
			"form-control--has-help-text": r
		})}
        role="radiogroup"
        aria-labelledby="label"
        aria-describedby="help-text"
        aria-errormessage="error-message"
      >
        <label
          part="form-control-label"
          id="label"
          class="form-control__label"
          aria-hidden=${n ? "false" : "true"}
          @click=${this.handleLabelClick}
        >
          <slot name="label">${this.label}</slot>
        </label>

        <div part="form-control-input" class="form-control-input">
          <div class="visually-hidden">
            <div id="error-message" aria-live="assertive">${this.errorMessage}</div>
            <label class="radio-group__validation">
              <input
                type="text"
                class="radio-group__validation-input"
                ?required=${this.required}
                tabindex="-1"
                hidden
                @invalid=${this.handleInvalid}
              />
            </label>
          </div>

          ${this.hasButtonGroup ? i`
                <sl-button-group part="button-group" exportparts="base:button-group__base" role="presentation">
                  ${a}
                </sl-button-group>
              ` : a}
        </div>

        <div
          part="form-control-help-text"
          id="help-text"
          class="form-control__help-text"
          aria-hidden=${r ? "false" : "true"}
        >
          <slot name="help-text">${this.helpText}</slot>
        </div>
      </fieldset>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.2PCBEMQZ.js
x.styles = [
	a,
	v,
	b
], x.dependencies = { "sl-button-group": y }, c([r("slot:not([name])")], x.prototype, "defaultSlot", 2), c([r(".radio-group__validation-input")], x.prototype, "validationInput", 2), c([n()], x.prototype, "hasButtonGroup", 2), c([n()], x.prototype, "errorMessage", 2), c([n()], x.prototype, "defaultValue", 2), c([e()], x.prototype, "label", 2), c([e({ attribute: "help-text" })], x.prototype, "helpText", 2), c([e()], x.prototype, "name", 2), c([e({ reflect: !0 })], x.prototype, "value", 2), c([e({ reflect: !0 })], x.prototype, "size", 2), c([e({ reflect: !0 })], x.prototype, "form", 2), c([e({
	type: Boolean,
	reflect: !0
})], x.prototype, "required", 2), c([s("size", { waitUntilFirstUpdate: !0 })], x.prototype, "handleSizeChange", 1), c([s("value")], x.prototype, "handleValueChange", 1), x.define("sl-radio-group");
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.2P5EQCYK.js
var S = t`
  ${_}

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
`, C = class extends o {
	constructor() {
		super(...arguments), this.hasSlotController = new d(this, "[default]", "prefix", "suffix"), this.hasFocus = !1, this.checked = !1, this.disabled = !1, this.size = "medium", this.pill = !1;
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
		return f`
      <div part="base" role="presentation">
        <button
          part="${`button${this.checked ? " button--checked" : ""}`}"
          role="radio"
          aria-checked="${this.checked}"
          class=${u({
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
          value=${l(this.value)}
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
C.styles = [a, S], c([r(".button")], C.prototype, "input", 2), c([r(".hidden-input")], C.prototype, "hiddenInput", 2), c([n()], C.prototype, "hasFocus", 2), c([e({
	type: Boolean,
	reflect: !0
})], C.prototype, "checked", 2), c([e()], C.prototype, "value", 2), c([e({
	type: Boolean,
	reflect: !0
})], C.prototype, "disabled", 2), c([e({ reflect: !0 })], C.prototype, "size", 2), c([e({
	type: Boolean,
	reflect: !0
})], C.prototype, "pill", 2), c([s("disabled", { waitUntilFirstUpdate: !0 })], C.prototype, "handleDisabledChange", 1), C.define("sl-radio-button");
//#endregion
