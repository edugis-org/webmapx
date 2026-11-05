import { a as e, h as t, i as n, n as r, p as i } from "./decorators-d8E4nZJy.js";
import { a, i as o, o as s, s as c } from "./directive-helpers-Debt3Tx3.js";
import { n as l, r as u, t as d } from "./chunk.NYIIDP5N-gftugmWL.js";
import { t as f } from "./chunk.3RPBFEDE-DBlOq5Pm.js";
import { n as p, t as m } from "./live-BR4apkFB.js";
import { t as h } from "./chunk.SI4ACBFK-CdJVQctt.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.EU44RQUN.js
var g = t`
  :host {
    display: inline-block;
  }

  :host([size='small']) {
    --height: var(--sl-toggle-size-small);
    --thumb-size: calc(var(--sl-toggle-size-small) + 4px);
    --width: calc(var(--height) * 2);

    font-size: var(--sl-input-font-size-small);
  }

  :host([size='medium']) {
    --height: var(--sl-toggle-size-medium);
    --thumb-size: calc(var(--sl-toggle-size-medium) + 4px);
    --width: calc(var(--height) * 2);

    font-size: var(--sl-input-font-size-medium);
  }

  :host([size='large']) {
    --height: var(--sl-toggle-size-large);
    --thumb-size: calc(var(--sl-toggle-size-large) + 4px);
    --width: calc(var(--height) * 2);

    font-size: var(--sl-input-font-size-large);
  }

  .switch {
    position: relative;
    display: inline-flex;
    align-items: center;
    font-family: var(--sl-input-font-family);
    font-size: inherit;
    font-weight: var(--sl-input-font-weight);
    color: var(--sl-input-label-color);
    vertical-align: middle;
    cursor: pointer;
  }

  .switch__control {
    flex: 0 0 auto;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--width);
    height: var(--height);
    background-color: var(--sl-color-neutral-400);
    border: solid var(--sl-input-border-width) var(--sl-color-neutral-400);
    border-radius: var(--height);
    transition:
      var(--sl-transition-fast) border-color,
      var(--sl-transition-fast) background-color;
  }

  .switch__control .switch__thumb {
    width: var(--thumb-size);
    height: var(--thumb-size);
    background-color: var(--sl-color-neutral-0);
    border-radius: 50%;
    border: solid var(--sl-input-border-width) var(--sl-color-neutral-400);
    translate: calc((var(--width) - var(--height)) / -2);
    transition:
      var(--sl-transition-fast) translate ease,
      var(--sl-transition-fast) background-color,
      var(--sl-transition-fast) border-color,
      var(--sl-transition-fast) box-shadow;
  }

  .switch__input {
    position: absolute;
    opacity: 0;
    padding: 0;
    margin: 0;
    pointer-events: none;
  }

  /* Hover */
  .switch:not(.switch--checked):not(.switch--disabled) .switch__control:hover {
    background-color: var(--sl-color-neutral-400);
    border-color: var(--sl-color-neutral-400);
  }

  .switch:not(.switch--checked):not(.switch--disabled) .switch__control:hover .switch__thumb {
    background-color: var(--sl-color-neutral-0);
    border-color: var(--sl-color-neutral-400);
  }

  /* Focus */
  .switch:not(.switch--checked):not(.switch--disabled) .switch__input:focus-visible ~ .switch__control {
    background-color: var(--sl-color-neutral-400);
    border-color: var(--sl-color-neutral-400);
  }

  .switch:not(.switch--checked):not(.switch--disabled) .switch__input:focus-visible ~ .switch__control .switch__thumb {
    background-color: var(--sl-color-neutral-0);
    border-color: var(--sl-color-primary-600);
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  /* Checked */
  .switch--checked .switch__control {
    background-color: var(--sl-color-primary-600);
    border-color: var(--sl-color-primary-600);
  }

  .switch--checked .switch__control .switch__thumb {
    background-color: var(--sl-color-neutral-0);
    border-color: var(--sl-color-primary-600);
    translate: calc((var(--width) - var(--height)) / 2);
  }

  /* Checked + hover */
  .switch.switch--checked:not(.switch--disabled) .switch__control:hover {
    background-color: var(--sl-color-primary-600);
    border-color: var(--sl-color-primary-600);
  }

  .switch.switch--checked:not(.switch--disabled) .switch__control:hover .switch__thumb {
    background-color: var(--sl-color-neutral-0);
    border-color: var(--sl-color-primary-600);
  }

  /* Checked + focus */
  .switch.switch--checked:not(.switch--disabled) .switch__input:focus-visible ~ .switch__control {
    background-color: var(--sl-color-primary-600);
    border-color: var(--sl-color-primary-600);
  }

  .switch.switch--checked:not(.switch--disabled) .switch__input:focus-visible ~ .switch__control .switch__thumb {
    background-color: var(--sl-color-neutral-0);
    border-color: var(--sl-color-primary-600);
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  /* Disabled */
  .switch--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .switch__label {
    display: inline-block;
    line-height: var(--height);
    margin-inline-start: 0.5em;
    user-select: none;
    -webkit-user-select: none;
  }

  :host([required]) .switch__label::after {
    content: var(--sl-input-required-content);
    color: var(--sl-input-required-content-color);
    margin-inline-start: var(--sl-input-required-content-offset);
  }

  @media (forced-colors: active) {
    .switch.switch--checked:not(.switch--disabled) .switch__control:hover .switch__thumb,
    .switch--checked .switch__control .switch__thumb {
      background-color: ButtonText;
    }
  }
`, _ = class extends o {
	constructor() {
		super(...arguments), this.formControlController = new f(this, {
			value: (e) => e.checked ? e.value || "on" : void 0,
			defaultValue: (e) => e.defaultChecked,
			setValue: (e, t) => e.checked = t
		}), this.hasSlotController = new d(this, "help-text"), this.hasFocus = !1, this.title = "", this.name = "", this.size = "medium", this.disabled = !1, this.checked = !1, this.defaultChecked = !1, this.form = "", this.required = !1, this.helpText = "";
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
	handleInput() {
		this.emit("sl-input");
	}
	handleInvalid(e) {
		this.formControlController.setValidity(!1), this.formControlController.emitInvalidEvent(e);
	}
	handleClick() {
		this.checked = !this.checked, this.emit("sl-change");
	}
	handleFocus() {
		this.hasFocus = !0, this.emit("sl-focus");
	}
	handleKeyDown(e) {
		e.key === "ArrowLeft" && (e.preventDefault(), this.checked = !1, this.emit("sl-change"), this.emit("sl-input")), e.key === "ArrowRight" && (e.preventDefault(), this.checked = !0, this.emit("sl-change"), this.emit("sl-input"));
	}
	handleCheckedChange() {
		this.input.checked = this.checked, this.formControlController.updateValidity();
	}
	handleDisabledChange() {
		this.formControlController.setValidity(!0);
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
        class=${u({
			"form-control": !0,
			"form-control--small": this.size === "small",
			"form-control--medium": this.size === "medium",
			"form-control--large": this.size === "large",
			"form-control--has-help-text": t
		})}
      >
        <label
          part="base"
          class=${u({
			switch: !0,
			"switch--checked": this.checked,
			"switch--disabled": this.disabled,
			"switch--focused": this.hasFocus,
			"switch--small": this.size === "small",
			"switch--medium": this.size === "medium",
			"switch--large": this.size === "large"
		})}
        >
          <input
            class="switch__input"
            type="checkbox"
            title=${this.title}
            name=${this.name}
            value=${l(this.value)}
            .checked=${m(this.checked)}
            .disabled=${this.disabled}
            .required=${this.required}
            role="switch"
            aria-checked=${this.checked ? "true" : "false"}
            aria-describedby="help-text"
            @click=${this.handleClick}
            @input=${this.handleInput}
            @invalid=${this.handleInvalid}
            @blur=${this.handleBlur}
            @focus=${this.handleFocus}
            @keydown=${this.handleKeyDown}
          />

          <span part="control" class="switch__control">
            <span part="thumb" class="switch__thumb"></span>
          </span>

          <div part="label" class="switch__label">
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
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.IADS735N.js
_.styles = [
	a,
	h,
	g
], c([r("input[type=\"checkbox\"]")], _.prototype, "input", 2), c([n()], _.prototype, "hasFocus", 2), c([e()], _.prototype, "title", 2), c([e()], _.prototype, "name", 2), c([e()], _.prototype, "value", 2), c([e({ reflect: !0 })], _.prototype, "size", 2), c([e({
	type: Boolean,
	reflect: !0
})], _.prototype, "disabled", 2), c([e({
	type: Boolean,
	reflect: !0
})], _.prototype, "checked", 2), c([p("checked")], _.prototype, "defaultChecked", 2), c([e({ reflect: !0 })], _.prototype, "form", 2), c([e({
	type: Boolean,
	reflect: !0
})], _.prototype, "required", 2), c([e({ attribute: "help-text" })], _.prototype, "helpText", 2), c([s("checked", { waitUntilFirstUpdate: !0 })], _.prototype, "handleCheckedChange", 1), c([s("disabled", { waitUntilFirstUpdate: !0 })], _.prototype, "handleDisabledChange", 1), _.define("sl-switch");
//#endregion
