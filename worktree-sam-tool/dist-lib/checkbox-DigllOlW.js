import { a as e, h as t, i as n, n as r, p as i } from "./decorators-d8E4nZJy.js";
import { a, i as o, o as s, s as c } from "./directive-helpers-Debt3Tx3.js";
import { t as l } from "./chunk.YHLNUJ7P-BjspQfLm.js";
import { n as u, r as d, t as f } from "./chunk.NYIIDP5N-gftugmWL.js";
import { t as p } from "./chunk.3RPBFEDE-DBlOq5Pm.js";
import { n as m, t as h } from "./live-BR4apkFB.js";
import { t as g } from "./chunk.SI4ACBFK-CdJVQctt.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.R3NF57O3.js
var _ = t`
  :host {
    display: inline-block;
  }

  .checkbox {
    position: relative;
    display: inline-flex;
    align-items: flex-start;
    font-family: var(--sl-input-font-family);
    font-weight: var(--sl-input-font-weight);
    color: var(--sl-input-label-color);
    vertical-align: middle;
    cursor: pointer;
  }

  .checkbox--small {
    --toggle-size: var(--sl-toggle-size-small);
    font-size: var(--sl-input-font-size-small);
  }

  .checkbox--medium {
    --toggle-size: var(--sl-toggle-size-medium);
    font-size: var(--sl-input-font-size-medium);
  }

  .checkbox--large {
    --toggle-size: var(--sl-toggle-size-large);
    font-size: var(--sl-input-font-size-large);
  }

  .checkbox__control {
    flex: 0 0 auto;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--toggle-size);
    height: var(--toggle-size);
    border: solid var(--sl-input-border-width) var(--sl-input-border-color);
    border-radius: 2px;
    background-color: var(--sl-input-background-color);
    color: var(--sl-color-neutral-0);
    transition:
      var(--sl-transition-fast) border-color,
      var(--sl-transition-fast) background-color,
      var(--sl-transition-fast) color,
      var(--sl-transition-fast) box-shadow;
  }

  .checkbox__input {
    position: absolute;
    opacity: 0;
    padding: 0;
    margin: 0;
    pointer-events: none;
  }

  .checkbox__checked-icon,
  .checkbox__indeterminate-icon {
    display: inline-flex;
    width: var(--toggle-size);
    height: var(--toggle-size);
  }

  /* Hover */
  .checkbox:not(.checkbox--checked):not(.checkbox--disabled) .checkbox__control:hover {
    border-color: var(--sl-input-border-color-hover);
    background-color: var(--sl-input-background-color-hover);
  }

  /* Focus */
  .checkbox:not(.checkbox--checked):not(.checkbox--disabled) .checkbox__input:focus-visible ~ .checkbox__control {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  /* Checked/indeterminate */
  .checkbox--checked .checkbox__control,
  .checkbox--indeterminate .checkbox__control {
    border-color: var(--sl-color-primary-600);
    background-color: var(--sl-color-primary-600);
  }

  /* Checked/indeterminate + hover */
  .checkbox.checkbox--checked:not(.checkbox--disabled) .checkbox__control:hover,
  .checkbox.checkbox--indeterminate:not(.checkbox--disabled) .checkbox__control:hover {
    border-color: var(--sl-color-primary-500);
    background-color: var(--sl-color-primary-500);
  }

  /* Checked/indeterminate + focus */
  .checkbox.checkbox--checked:not(.checkbox--disabled) .checkbox__input:focus-visible ~ .checkbox__control,
  .checkbox.checkbox--indeterminate:not(.checkbox--disabled) .checkbox__input:focus-visible ~ .checkbox__control {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  /* Disabled */
  .checkbox--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .checkbox__label {
    display: inline-block;
    color: var(--sl-input-label-color);
    line-height: var(--toggle-size);
    margin-inline-start: 0.5em;
    user-select: none;
    -webkit-user-select: none;
  }

  :host([required]) .checkbox__label::after {
    content: var(--sl-input-required-content);
    color: var(--sl-input-required-content-color);
    margin-inline-start: var(--sl-input-required-content-offset);
  }
`, v = class extends o {
	constructor() {
		super(...arguments), this.formControlController = new p(this, {
			value: (e) => e.checked ? e.value || "on" : void 0,
			defaultValue: (e) => e.defaultChecked,
			setValue: (e, t) => e.checked = t
		}), this.hasSlotController = new f(this, "help-text"), this.hasFocus = !1, this.title = "", this.name = "", this.size = "medium", this.disabled = !1, this.checked = !1, this.indeterminate = !1, this.defaultChecked = !1, this.form = "", this.required = !1, this.helpText = "";
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
	handleClick() {
		this.checked = !this.checked, this.indeterminate = !1, this.emit("sl-change");
	}
	handleBlur() {
		this.hasFocus = !1, this.emit("sl-blur");
	}
	handleInput() {
		this.emit("sl-input");
	}
	handleInvalid(e) {
		this.formControlController.setValidity(!1), this.formControlController.emitInvalidEvent(e);
	}
	handleFocus() {
		this.hasFocus = !0, this.emit("sl-focus");
	}
	handleDisabledChange() {
		this.formControlController.setValidity(this.disabled);
	}
	handleStateChange() {
		this.input.checked = this.checked, this.input.indeterminate = this.indeterminate, this.formControlController.updateValidity();
	}
	click() {
		this.input.click();
	}
	focus(e) {
		this.input.focus(e);
	}
	blur() {
		this.input.blur();
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
		let e = this.hasSlotController.test("help-text"), t = this.helpText ? !0 : !!e;
		return i`
      <div
        class=${d({
			"form-control": !0,
			"form-control--small": this.size === "small",
			"form-control--medium": this.size === "medium",
			"form-control--large": this.size === "large",
			"form-control--has-help-text": t
		})}
      >
        <label
          part="base"
          class=${d({
			checkbox: !0,
			"checkbox--checked": this.checked,
			"checkbox--disabled": this.disabled,
			"checkbox--focused": this.hasFocus,
			"checkbox--indeterminate": this.indeterminate,
			"checkbox--small": this.size === "small",
			"checkbox--medium": this.size === "medium",
			"checkbox--large": this.size === "large"
		})}
        >
          <input
            class="checkbox__input"
            type="checkbox"
            title=${this.title}
            name=${this.name}
            value=${u(this.value)}
            .indeterminate=${h(this.indeterminate)}
            .checked=${h(this.checked)}
            .disabled=${this.disabled}
            .required=${this.required}
            aria-checked=${this.checked ? "true" : "false"}
            aria-describedby="help-text"
            @click=${this.handleClick}
            @input=${this.handleInput}
            @invalid=${this.handleInvalid}
            @blur=${this.handleBlur}
            @focus=${this.handleFocus}
          />

          <span
            part="control${this.checked ? " control--checked" : ""}${this.indeterminate ? " control--indeterminate" : ""}"
            class="checkbox__control"
          >
            ${this.checked ? i`
                  <sl-icon part="checked-icon" class="checkbox__checked-icon" library="system" name="check"></sl-icon>
                ` : ""}
            ${!this.checked && this.indeterminate ? i`
                  <sl-icon
                    part="indeterminate-icon"
                    class="checkbox__indeterminate-icon"
                    library="system"
                    name="indeterminate"
                  ></sl-icon>
                ` : ""}
          </span>

          <div part="label" class="checkbox__label">
            <slot></slot>
          </div>
        </label>

        <div
          aria-hidden=${t ? "false" : "true"}
          class="form-control__help-text"
          id="help-text"
          part="form-control-help-text"
        >
          <slot name="help-text">${this.helpText}</slot>
        </div>
      </div>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.D5YQDJ7X.js
v.styles = [
	a,
	g,
	_
], v.dependencies = { "sl-icon": l }, c([r("input[type=\"checkbox\"]")], v.prototype, "input", 2), c([n()], v.prototype, "hasFocus", 2), c([e()], v.prototype, "title", 2), c([e()], v.prototype, "name", 2), c([e()], v.prototype, "value", 2), c([e({ reflect: !0 })], v.prototype, "size", 2), c([e({
	type: Boolean,
	reflect: !0
})], v.prototype, "disabled", 2), c([e({
	type: Boolean,
	reflect: !0
})], v.prototype, "checked", 2), c([e({
	type: Boolean,
	reflect: !0
})], v.prototype, "indeterminate", 2), c([m("checked")], v.prototype, "defaultChecked", 2), c([e({ reflect: !0 })], v.prototype, "form", 2), c([e({
	type: Boolean,
	reflect: !0
})], v.prototype, "required", 2), c([e({ attribute: "help-text" })], v.prototype, "helpText", 2), c([s("disabled", { waitUntilFirstUpdate: !0 })], v.prototype, "handleDisabledChange", 1), c([s(["checked", "indeterminate"], { waitUntilFirstUpdate: !0 })], v.prototype, "handleStateChange", 1), v.define("sl-checkbox");
//#endregion
export { v as t };
