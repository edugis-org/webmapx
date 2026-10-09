import { a as e, h as t, i as n, n as r, p as i } from "./decorators-d8E4nZJy.js";
import { a, i as o, o as s, s as c } from "./directive-helpers-Debt3Tx3.js";
import { r as l, t as u } from "./chunk.NYIIDP5N-gftugmWL.js";
import { i as d, n as f, r as p, t as m } from "./chunk.3RPBFEDE-DBlOq5Pm.js";
import { t as h } from "./chunk.SI4ACBFK-CdJVQctt.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.B63YXDJO.js
var g = t`
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
`, _ = t`
  :host {
    display: inline-block;
  }

  .button-group {
    display: flex;
    flex-wrap: nowrap;
  }
`, v = class extends o {
	constructor() {
		super(...arguments), this.disableRole = !1, this.label = "";
	}
	handleFocus(e) {
		y(e.target)?.toggleAttribute("data-sl-button-group__button--focus", !0);
	}
	handleBlur(e) {
		y(e.target)?.toggleAttribute("data-sl-button-group__button--focus", !1);
	}
	handleMouseOver(e) {
		y(e.target)?.toggleAttribute("data-sl-button-group__button--hover", !0);
	}
	handleMouseOut(e) {
		y(e.target)?.toggleAttribute("data-sl-button-group__button--hover", !1);
	}
	handleSlotChange() {
		let e = [...this.defaultSlot.assignedElements({ flatten: !0 })];
		e.forEach((t) => {
			let n = e.indexOf(t), r = y(t);
			r && (r.toggleAttribute("data-sl-button-group__button", !0), r.toggleAttribute("data-sl-button-group__button--first", n === 0), r.toggleAttribute("data-sl-button-group__button--inner", n > 0 && n < e.length - 1), r.toggleAttribute("data-sl-button-group__button--last", n === e.length - 1), r.toggleAttribute("data-sl-button-group__button--radio", r.tagName.toLowerCase() === "sl-radio-button"));
		});
	}
	render() {
		return i`
      <div
        part="base"
        class="button-group"
        role="${this.disableRole ? "presentation" : "group"}"
        aria-label=${this.label}
        @focusout=${this.handleBlur}
        @focusin=${this.handleFocus}
        @mouseover=${this.handleMouseOver}
        @mouseout=${this.handleMouseOut}
      >
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
	}
};
v.styles = [a, _], c([r("slot")], v.prototype, "defaultSlot", 2), c([n()], v.prototype, "disableRole", 2), c([e()], v.prototype, "label", 2);
function y(e) {
	let t = "sl-button, sl-radio-button";
	return e.closest(t) ?? e.querySelector(t);
}
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.ZJNIZFRS.js
var b = class extends o {
	constructor() {
		super(...arguments), this.formControlController = new m(this), this.hasSlotController = new u(this, "help-text", "label"), this.customValidityMessage = "", this.hasButtonGroup = !1, this.errorMessage = "", this.defaultValue = "", this.label = "", this.helpText = "", this.name = "option", this.value = "", this.size = "medium", this.form = "", this.required = !1;
	}
	get validity() {
		let e = this.required && !this.value;
		return this.customValidityMessage === "" ? e ? d : p : f;
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
        class=${l({
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
b.styles = [
	a,
	h,
	g
], b.dependencies = { "sl-button-group": v }, c([r("slot:not([name])")], b.prototype, "defaultSlot", 2), c([r(".radio-group__validation-input")], b.prototype, "validationInput", 2), c([n()], b.prototype, "hasButtonGroup", 2), c([n()], b.prototype, "errorMessage", 2), c([n()], b.prototype, "defaultValue", 2), c([e()], b.prototype, "label", 2), c([e({ attribute: "help-text" })], b.prototype, "helpText", 2), c([e()], b.prototype, "name", 2), c([e({ reflect: !0 })], b.prototype, "value", 2), c([e({ reflect: !0 })], b.prototype, "size", 2), c([e({ reflect: !0 })], b.prototype, "form", 2), c([e({
	type: Boolean,
	reflect: !0
})], b.prototype, "required", 2), c([s("size", { waitUntilFirstUpdate: !0 })], b.prototype, "handleSizeChange", 1), c([s("value")], b.prototype, "handleValueChange", 1), b.define("sl-radio-group");
//#endregion
export { v as t };
