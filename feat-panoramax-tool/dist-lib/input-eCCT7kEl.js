import { a as e, h as t, i as n, n as r, p as i } from "./decorators-d8E4nZJy.js";
import { a, i as o, o as s, s as c } from "./directive-helpers-Debt3Tx3.js";
import { t as l } from "./chunk.YHLNUJ7P-BjspQfLm.js";
import { n as u, r as d, t as f } from "./chunk.NYIIDP5N-gftugmWL.js";
import { t as p } from "./chunk.6CTB5ZDJ-DjZrBd6Y.js";
import { t as m } from "./chunk.3RPBFEDE-DBlOq5Pm.js";
import { n as h, t as g } from "./live-BR4apkFB.js";
import { t as _ } from "./chunk.SI4ACBFK-CdJVQctt.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.GGT72J62.js
var v = t`
  :host {
    display: block;
  }

  .input {
    flex: 1 1 auto;
    display: inline-flex;
    align-items: stretch;
    justify-content: start;
    position: relative;
    width: 100%;
    font-family: var(--sl-input-font-family);
    font-weight: var(--sl-input-font-weight);
    letter-spacing: var(--sl-input-letter-spacing);
    vertical-align: middle;
    overflow: hidden;
    cursor: text;
    transition:
      var(--sl-transition-fast) color,
      var(--sl-transition-fast) border,
      var(--sl-transition-fast) box-shadow,
      var(--sl-transition-fast) background-color;
  }

  /* Standard inputs */
  .input--standard {
    background-color: var(--sl-input-background-color);
    border: solid var(--sl-input-border-width) var(--sl-input-border-color);
  }

  .input--standard:hover:not(.input--disabled) {
    background-color: var(--sl-input-background-color-hover);
    border-color: var(--sl-input-border-color-hover);
  }

  .input--standard.input--focused:not(.input--disabled) {
    background-color: var(--sl-input-background-color-focus);
    border-color: var(--sl-input-border-color-focus);
    box-shadow: 0 0 0 var(--sl-focus-ring-width) var(--sl-input-focus-ring-color);
  }

  .input--standard.input--focused:not(.input--disabled) .input__control {
    color: var(--sl-input-color-focus);
  }

  .input--standard.input--disabled {
    background-color: var(--sl-input-background-color-disabled);
    border-color: var(--sl-input-border-color-disabled);
    opacity: 0.5;
    cursor: not-allowed;
  }

  .input--standard.input--disabled .input__control {
    color: var(--sl-input-color-disabled);
  }

  .input--standard.input--disabled .input__control::placeholder {
    color: var(--sl-input-placeholder-color-disabled);
  }

  /* Filled inputs */
  .input--filled {
    border: none;
    background-color: var(--sl-input-filled-background-color);
    color: var(--sl-input-color);
  }

  .input--filled:hover:not(.input--disabled) {
    background-color: var(--sl-input-filled-background-color-hover);
  }

  .input--filled.input--focused:not(.input--disabled) {
    background-color: var(--sl-input-filled-background-color-focus);
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  .input--filled.input--disabled {
    background-color: var(--sl-input-filled-background-color-disabled);
    opacity: 0.5;
    cursor: not-allowed;
  }

  .input__control {
    flex: 1 1 auto;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    min-width: 0;
    height: 100%;
    color: var(--sl-input-color);
    border: none;
    background: inherit;
    box-shadow: none;
    padding: 0;
    margin: 0;
    cursor: inherit;
    -webkit-appearance: none;
  }

  .input__control::-webkit-search-decoration,
  .input__control::-webkit-search-cancel-button,
  .input__control::-webkit-search-results-button,
  .input__control::-webkit-search-results-decoration {
    -webkit-appearance: none;
  }

  .input__control:-webkit-autofill,
  .input__control:-webkit-autofill:hover,
  .input__control:-webkit-autofill:focus,
  .input__control:-webkit-autofill:active {
    box-shadow: 0 0 0 var(--sl-input-height-large) var(--sl-input-background-color-hover) inset !important;
    -webkit-text-fill-color: var(--sl-color-primary-500);
    caret-color: var(--sl-input-color);
  }

  .input--filled .input__control:-webkit-autofill,
  .input--filled .input__control:-webkit-autofill:hover,
  .input--filled .input__control:-webkit-autofill:focus,
  .input--filled .input__control:-webkit-autofill:active {
    box-shadow: 0 0 0 var(--sl-input-height-large) var(--sl-input-filled-background-color) inset !important;
  }

  .input__control::placeholder {
    color: var(--sl-input-placeholder-color);
    user-select: none;
    -webkit-user-select: none;
  }

  .input:hover:not(.input--disabled) .input__control {
    color: var(--sl-input-color-hover);
  }

  .input__control:focus {
    outline: none;
  }

  .input__prefix,
  .input__suffix {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    cursor: default;
  }

  .input__prefix ::slotted(sl-icon),
  .input__suffix ::slotted(sl-icon) {
    color: var(--sl-input-icon-color);
  }

  /*
   * Size modifiers
   */

  .input--small {
    border-radius: var(--sl-input-border-radius-small);
    font-size: var(--sl-input-font-size-small);
    height: var(--sl-input-height-small);
  }

  .input--small .input__control {
    height: calc(var(--sl-input-height-small) - var(--sl-input-border-width) * 2);
    padding: 0 var(--sl-input-spacing-small);
  }

  .input--small .input__clear,
  .input--small .input__password-toggle {
    width: calc(1em + var(--sl-input-spacing-small) * 2);
  }

  .input--small .input__prefix ::slotted(*) {
    margin-inline-start: var(--sl-input-spacing-small);
  }

  .input--small .input__suffix ::slotted(*) {
    margin-inline-end: var(--sl-input-spacing-small);
  }

  .input--medium {
    border-radius: var(--sl-input-border-radius-medium);
    font-size: var(--sl-input-font-size-medium);
    height: var(--sl-input-height-medium);
  }

  .input--medium .input__control {
    height: calc(var(--sl-input-height-medium) - var(--sl-input-border-width) * 2);
    padding: 0 var(--sl-input-spacing-medium);
  }

  .input--medium .input__clear,
  .input--medium .input__password-toggle {
    width: calc(1em + var(--sl-input-spacing-medium) * 2);
  }

  .input--medium .input__prefix ::slotted(*) {
    margin-inline-start: var(--sl-input-spacing-medium);
  }

  .input--medium .input__suffix ::slotted(*) {
    margin-inline-end: var(--sl-input-spacing-medium);
  }

  .input--large {
    border-radius: var(--sl-input-border-radius-large);
    font-size: var(--sl-input-font-size-large);
    height: var(--sl-input-height-large);
  }

  .input--large .input__control {
    height: calc(var(--sl-input-height-large) - var(--sl-input-border-width) * 2);
    padding: 0 var(--sl-input-spacing-large);
  }

  .input--large .input__clear,
  .input--large .input__password-toggle {
    width: calc(1em + var(--sl-input-spacing-large) * 2);
  }

  .input--large .input__prefix ::slotted(*) {
    margin-inline-start: var(--sl-input-spacing-large);
  }

  .input--large .input__suffix ::slotted(*) {
    margin-inline-end: var(--sl-input-spacing-large);
  }

  /*
   * Pill modifier
   */

  .input--pill.input--small {
    border-radius: var(--sl-input-height-small);
  }

  .input--pill.input--medium {
    border-radius: var(--sl-input-height-medium);
  }

  .input--pill.input--large {
    border-radius: var(--sl-input-height-large);
  }

  /*
   * Clearable + Password Toggle
   */

  .input__clear,
  .input__password-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: inherit;
    color: var(--sl-input-icon-color);
    border: none;
    background: none;
    padding: 0;
    transition: var(--sl-transition-fast) color;
    cursor: pointer;
  }

  .input__clear:hover,
  .input__password-toggle:hover {
    color: var(--sl-input-icon-color-hover);
  }

  .input__clear:focus,
  .input__password-toggle:focus {
    outline: none;
  }

  /* Don't show the browser's password toggle in Edge */
  ::-ms-reveal {
    display: none;
  }

  /* Hide the built-in number spinner */
  .input--no-spin-buttons input[type='number']::-webkit-outer-spin-button,
  .input--no-spin-buttons input[type='number']::-webkit-inner-spin-button {
    -webkit-appearance: none;
    display: none;
  }

  .input--no-spin-buttons input[type='number'] {
    -moz-appearance: textfield;
  }
`, y = class extends o {
	constructor() {
		super(...arguments), this.formControlController = new m(this, { assumeInteractionOn: ["sl-blur", "sl-input"] }), this.hasSlotController = new f(this, "help-text", "label"), this.localize = new p(this), this.hasFocus = !1, this.title = "", this.__numberInput = Object.assign(document.createElement("input"), { type: "number" }), this.__dateInput = Object.assign(document.createElement("input"), { type: "date" }), this.type = "text", this.name = "", this.value = "", this.defaultValue = "", this.size = "medium", this.filled = !1, this.pill = !1, this.label = "", this.helpText = "", this.clearable = !1, this.disabled = !1, this.placeholder = "", this.readonly = !1, this.passwordToggle = !1, this.passwordVisible = !1, this.noSpinButtons = !1, this.form = "", this.required = !1, this.spellcheck = !0;
	}
	get valueAsDate() {
		return this.__dateInput.type = this.type, this.__dateInput.value = this.value, this.input?.valueAsDate || this.__dateInput.valueAsDate;
	}
	set valueAsDate(e) {
		this.__dateInput.type = this.type, this.__dateInput.valueAsDate = e, this.value = this.__dateInput.value;
	}
	get valueAsNumber() {
		return this.__numberInput.value = this.value, this.input?.valueAsNumber || this.__numberInput.valueAsNumber;
	}
	set valueAsNumber(e) {
		this.__numberInput.valueAsNumber = e, this.value = this.__numberInput.value;
	}
	get validity() {
		return this.input.validity;
	}
	get validationMessage() {
		return this.input.validationMessage;
	}
	firstUpdated() {
		this.formControlController.updateValidity();
	}
	handleBlur() {
		this.hasFocus = !1, this.emit("sl-blur");
	}
	handleChange() {
		this.value = this.input.value, this.emit("sl-change");
	}
	handleClearClick(e) {
		e.preventDefault(), this.value !== "" && (this.value = "", this.emit("sl-clear"), this.emit("sl-input"), this.emit("sl-change")), this.input.focus();
	}
	handleFocus() {
		this.hasFocus = !0, this.emit("sl-focus");
	}
	handleInput() {
		this.value = this.input.value, this.formControlController.updateValidity(), this.emit("sl-input");
	}
	handleInvalid(e) {
		this.formControlController.setValidity(!1), this.formControlController.emitInvalidEvent(e);
	}
	handleKeyDown(e) {
		let t = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
		e.key === "Enter" && !t && setTimeout(() => {
			!e.defaultPrevented && !e.isComposing && this.formControlController.submit();
		});
	}
	handlePasswordToggle() {
		this.passwordVisible = !this.passwordVisible;
	}
	handleDisabledChange() {
		this.formControlController.setValidity(this.disabled);
	}
	handleStepChange() {
		this.input.step = String(this.step), this.formControlController.updateValidity();
	}
	async handleValueChange() {
		await this.updateComplete, this.formControlController.updateValidity();
	}
	focus(e) {
		this.input.focus(e);
	}
	blur() {
		this.input.blur();
	}
	select() {
		this.input.select();
	}
	setSelectionRange(e, t, n = "none") {
		this.input.setSelectionRange(e, t, n);
	}
	setRangeText(e, t, n, r = "preserve") {
		let i = t ?? this.input.selectionStart, a = n ?? this.input.selectionEnd;
		this.input.setRangeText(e, i, a, r), this.value !== this.input.value && (this.value = this.input.value);
	}
	showPicker() {
		"showPicker" in HTMLInputElement.prototype && this.input.showPicker();
	}
	stepUp() {
		this.input.stepUp(), this.value !== this.input.value && (this.value = this.input.value);
	}
	stepDown() {
		this.input.stepDown(), this.value !== this.input.value && (this.value = this.input.value);
	}
	checkValidity() {
		return this.input.checkValidity();
	}
	getForm() {
		return this.formControlController.getForm();
	}
	reportValidity() {
		return this.input.reportValidity();
	}
	setCustomValidity(e) {
		this.input.setCustomValidity(e), this.formControlController.updateValidity();
	}
	render() {
		let e = this.hasSlotController.test("label"), t = this.hasSlotController.test("help-text"), n = this.label ? !0 : !!e, r = this.helpText ? !0 : !!t, a = this.clearable && !this.disabled && !this.readonly && (typeof this.value == "number" || this.value.length > 0);
		return i`
      <div
        part="form-control"
        class=${d({
			"form-control": !0,
			"form-control--small": this.size === "small",
			"form-control--medium": this.size === "medium",
			"form-control--large": this.size === "large",
			"form-control--has-label": n,
			"form-control--has-help-text": r
		})}
      >
        <label
          part="form-control-label"
          class="form-control__label"
          for="input"
          aria-hidden=${n ? "false" : "true"}
        >
          <slot name="label">${this.label}</slot>
        </label>

        <div part="form-control-input" class="form-control-input">
          <div
            part="base"
            class=${d({
			input: !0,
			"input--small": this.size === "small",
			"input--medium": this.size === "medium",
			"input--large": this.size === "large",
			"input--pill": this.pill,
			"input--standard": !this.filled,
			"input--filled": this.filled,
			"input--disabled": this.disabled,
			"input--focused": this.hasFocus,
			"input--empty": !this.value,
			"input--no-spin-buttons": this.noSpinButtons
		})}
          >
            <span part="prefix" class="input__prefix">
              <slot name="prefix"></slot>
            </span>

            <input
              part="input"
              id="input"
              class="input__control"
              type=${this.type === "password" && this.passwordVisible ? "text" : this.type}
              title=${this.title}
              name=${u(this.name)}
              ?disabled=${this.disabled}
              ?readonly=${this.readonly}
              ?required=${this.required}
              placeholder=${u(this.placeholder)}
              minlength=${u(this.minlength)}
              maxlength=${u(this.maxlength)}
              min=${u(this.min)}
              max=${u(this.max)}
              step=${u(this.step)}
              .value=${g(this.value)}
              autocapitalize=${u(this.autocapitalize)}
              autocomplete=${u(this.autocomplete)}
              autocorrect=${u(this.autocorrect)}
              ?autofocus=${this.autofocus}
              spellcheck=${this.spellcheck}
              pattern=${u(this.pattern)}
              enterkeyhint=${u(this.enterkeyhint)}
              inputmode=${u(this.inputmode)}
              aria-describedby="help-text"
              @change=${this.handleChange}
              @input=${this.handleInput}
              @invalid=${this.handleInvalid}
              @keydown=${this.handleKeyDown}
              @focus=${this.handleFocus}
              @blur=${this.handleBlur}
            />

            ${a ? i`
                  <button
                    part="clear-button"
                    class="input__clear"
                    type="button"
                    aria-label=${this.localize.term("clearEntry")}
                    @click=${this.handleClearClick}
                    tabindex="-1"
                  >
                    <slot name="clear-icon">
                      <sl-icon name="x-circle-fill" library="system"></sl-icon>
                    </slot>
                  </button>
                ` : ""}
            ${this.passwordToggle && !this.disabled ? i`
                  <button
                    part="password-toggle-button"
                    class="input__password-toggle"
                    type="button"
                    aria-label=${this.localize.term(this.passwordVisible ? "hidePassword" : "showPassword")}
                    @click=${this.handlePasswordToggle}
                    tabindex="-1"
                  >
                    ${this.passwordVisible ? i`
                          <slot name="show-password-icon">
                            <sl-icon name="eye-slash" library="system"></sl-icon>
                          </slot>
                        ` : i`
                          <slot name="hide-password-icon">
                            <sl-icon name="eye" library="system"></sl-icon>
                          </slot>
                        `}
                  </button>
                ` : ""}

            <span part="suffix" class="input__suffix">
              <slot name="suffix"></slot>
            </span>
          </div>
        </div>

        <div
          part="form-control-help-text"
          id="help-text"
          class="form-control__help-text"
          aria-hidden=${r ? "false" : "true"}
        >
          <slot name="help-text">${this.helpText}</slot>
        </div>
      </div>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.XA43ZQPC.js
y.styles = [
	a,
	_,
	v
], y.dependencies = { "sl-icon": l }, c([r(".input__control")], y.prototype, "input", 2), c([n()], y.prototype, "hasFocus", 2), c([e()], y.prototype, "title", 2), c([e({ reflect: !0 })], y.prototype, "type", 2), c([e()], y.prototype, "name", 2), c([e()], y.prototype, "value", 2), c([h()], y.prototype, "defaultValue", 2), c([e({ reflect: !0 })], y.prototype, "size", 2), c([e({
	type: Boolean,
	reflect: !0
})], y.prototype, "filled", 2), c([e({
	type: Boolean,
	reflect: !0
})], y.prototype, "pill", 2), c([e()], y.prototype, "label", 2), c([e({ attribute: "help-text" })], y.prototype, "helpText", 2), c([e({ type: Boolean })], y.prototype, "clearable", 2), c([e({
	type: Boolean,
	reflect: !0
})], y.prototype, "disabled", 2), c([e()], y.prototype, "placeholder", 2), c([e({
	type: Boolean,
	reflect: !0
})], y.prototype, "readonly", 2), c([e({
	attribute: "password-toggle",
	type: Boolean
})], y.prototype, "passwordToggle", 2), c([e({
	attribute: "password-visible",
	type: Boolean
})], y.prototype, "passwordVisible", 2), c([e({
	attribute: "no-spin-buttons",
	type: Boolean
})], y.prototype, "noSpinButtons", 2), c([e({ reflect: !0 })], y.prototype, "form", 2), c([e({
	type: Boolean,
	reflect: !0
})], y.prototype, "required", 2), c([e()], y.prototype, "pattern", 2), c([e({ type: Number })], y.prototype, "minlength", 2), c([e({ type: Number })], y.prototype, "maxlength", 2), c([e()], y.prototype, "min", 2), c([e()], y.prototype, "max", 2), c([e()], y.prototype, "step", 2), c([e()], y.prototype, "autocapitalize", 2), c([e()], y.prototype, "autocorrect", 2), c([e()], y.prototype, "autocomplete", 2), c([e({ type: Boolean })], y.prototype, "autofocus", 2), c([e()], y.prototype, "enterkeyhint", 2), c([e({
	type: Boolean,
	converter: {
		fromAttribute: (e) => !(!e || e === "false"),
		toAttribute: (e) => e ? "true" : "false"
	}
})], y.prototype, "spellcheck", 2), c([e()], y.prototype, "inputmode", 2), c([s("disabled", { waitUntilFirstUpdate: !0 })], y.prototype, "handleDisabledChange", 1), c([s("step", { waitUntilFirstUpdate: !0 })], y.prototype, "handleStepChange", 1), c([s("value", { waitUntilFirstUpdate: !0 })], y.prototype, "handleValueChange", 1), y.define("sl-input");
//#endregion
export { y as t };
