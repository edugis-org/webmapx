import { a as e, h as t, i as n, n as r, p as i, r as a } from "./decorators-d8E4nZJy.js";
import { a as o, i as s, o as c, s as l } from "./directive-helpers-Debt3Tx3.js";
import { n as u, r as d, t as f } from "./chunk.NYIIDP5N-gftugmWL.js";
import { t as p } from "./chunk.6CTB5ZDJ-DjZrBd6Y.js";
import { t as m } from "./chunk.3RPBFEDE-DBlOq5Pm.js";
import { n as h, t as g } from "./live-BR4apkFB.js";
import { t as _ } from "./chunk.SI4ACBFK-CdJVQctt.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.5D6IT2SR.js
var v = t`
  :host {
    --thumb-size: 20px;
    --tooltip-offset: 10px;
    --track-color-active: var(--sl-color-neutral-200);
    --track-color-inactive: var(--sl-color-neutral-200);
    --track-active-offset: 0%;
    --track-height: 6px;

    display: block;
  }

  .range {
    position: relative;
  }

  .range__control {
    --percent: 0%;
    -webkit-appearance: none;
    border-radius: 3px;
    width: 100%;
    height: var(--track-height);
    background: transparent;
    line-height: var(--sl-input-height-medium);
    vertical-align: middle;
    margin: 0;

    background-image: linear-gradient(
      to right,
      var(--track-color-inactive) 0%,
      var(--track-color-inactive) min(var(--percent), var(--track-active-offset)),
      var(--track-color-active) min(var(--percent), var(--track-active-offset)),
      var(--track-color-active) max(var(--percent), var(--track-active-offset)),
      var(--track-color-inactive) max(var(--percent), var(--track-active-offset)),
      var(--track-color-inactive) 100%
    );
  }

  .range--rtl .range__control {
    background-image: linear-gradient(
      to left,
      var(--track-color-inactive) 0%,
      var(--track-color-inactive) min(var(--percent), var(--track-active-offset)),
      var(--track-color-active) min(var(--percent), var(--track-active-offset)),
      var(--track-color-active) max(var(--percent), var(--track-active-offset)),
      var(--track-color-inactive) max(var(--percent), var(--track-active-offset)),
      var(--track-color-inactive) 100%
    );
  }

  /* Webkit */
  .range__control::-webkit-slider-runnable-track {
    width: 100%;
    height: var(--track-height);
    border-radius: 3px;
    border: none;
  }

  .range__control::-webkit-slider-thumb {
    border: none;
    width: var(--thumb-size);
    height: var(--thumb-size);
    border-radius: 50%;
    background-color: var(--sl-color-primary-600);
    border: solid var(--sl-input-border-width) var(--sl-color-primary-600);
    -webkit-appearance: none;
    margin-top: calc(var(--thumb-size) / -2 + var(--track-height) / 2);
    cursor: pointer;
  }

  .range__control:enabled::-webkit-slider-thumb:hover {
    background-color: var(--sl-color-primary-500);
    border-color: var(--sl-color-primary-500);
  }

  .range__control:enabled:focus-visible::-webkit-slider-thumb {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  .range__control:enabled::-webkit-slider-thumb:active {
    background-color: var(--sl-color-primary-500);
    border-color: var(--sl-color-primary-500);
    cursor: grabbing;
  }

  /* Firefox */
  .range__control::-moz-focus-outer {
    border: 0;
  }

  .range__control::-moz-range-progress {
    background-color: var(--track-color-active);
    border-radius: 3px;
    height: var(--track-height);
  }

  .range__control::-moz-range-track {
    width: 100%;
    height: var(--track-height);
    background-color: var(--track-color-inactive);
    border-radius: 3px;
    border: none;
  }

  .range__control::-moz-range-thumb {
    border: none;
    height: var(--thumb-size);
    width: var(--thumb-size);
    border-radius: 50%;
    background-color: var(--sl-color-primary-600);
    border-color: var(--sl-color-primary-600);
    transition:
      var(--sl-transition-fast) border-color,
      var(--sl-transition-fast) background-color,
      var(--sl-transition-fast) color,
      var(--sl-transition-fast) box-shadow;
    cursor: pointer;
  }

  .range__control:enabled::-moz-range-thumb:hover {
    background-color: var(--sl-color-primary-500);
    border-color: var(--sl-color-primary-500);
  }

  .range__control:enabled:focus-visible::-moz-range-thumb {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  .range__control:enabled::-moz-range-thumb:active {
    background-color: var(--sl-color-primary-500);
    border-color: var(--sl-color-primary-500);
    cursor: grabbing;
  }

  /* States */
  .range__control:focus-visible {
    outline: none;
  }

  .range__control:disabled {
    opacity: 0.5;
  }

  .range__control:disabled::-webkit-slider-thumb {
    cursor: not-allowed;
  }

  .range__control:disabled::-moz-range-thumb {
    cursor: not-allowed;
  }

  /* Tooltip output */
  .range__tooltip {
    position: absolute;
    z-index: var(--sl-z-index-tooltip);
    left: 0;
    border-radius: var(--sl-tooltip-border-radius);
    background-color: var(--sl-tooltip-background-color);
    font-family: var(--sl-tooltip-font-family);
    font-size: var(--sl-tooltip-font-size);
    font-weight: var(--sl-tooltip-font-weight);
    line-height: var(--sl-tooltip-line-height);
    color: var(--sl-tooltip-color);
    opacity: 0;
    padding: var(--sl-tooltip-padding);
    transition: var(--sl-transition-fast) opacity;
    pointer-events: none;
  }

  .range__tooltip:after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    left: 50%;
    translate: calc(-1 * var(--sl-tooltip-arrow-size));
  }

  .range--tooltip-visible .range__tooltip {
    opacity: 1;
  }

  /* Tooltip on top */
  .range--tooltip-top .range__tooltip {
    top: calc(-1 * var(--thumb-size) - var(--tooltip-offset));
  }

  .range--tooltip-top .range__tooltip:after {
    border-top: var(--sl-tooltip-arrow-size) solid var(--sl-tooltip-background-color);
    border-left: var(--sl-tooltip-arrow-size) solid transparent;
    border-right: var(--sl-tooltip-arrow-size) solid transparent;
    top: 100%;
  }

  /* Tooltip on bottom */
  .range--tooltip-bottom .range__tooltip {
    bottom: calc(-1 * var(--thumb-size) - var(--tooltip-offset));
  }

  .range--tooltip-bottom .range__tooltip:after {
    border-bottom: var(--sl-tooltip-arrow-size) solid var(--sl-tooltip-background-color);
    border-left: var(--sl-tooltip-arrow-size) solid transparent;
    border-right: var(--sl-tooltip-arrow-size) solid transparent;
    bottom: 100%;
  }

  @media (forced-colors: active) {
    .range__control,
    .range__tooltip {
      border: solid 1px transparent;
    }

    .range__control::-webkit-slider-thumb {
      border: solid 1px transparent;
    }

    .range__control::-moz-range-thumb {
      border: solid 1px transparent;
    }

    .range__tooltip:after {
      display: none;
    }
  }
`, y = class extends s {
	constructor() {
		super(...arguments), this.formControlController = new m(this), this.hasSlotController = new f(this, "help-text", "label"), this.localize = new p(this), this.hasFocus = !1, this.hasTooltip = !1, this.title = "", this.name = "", this.value = 0, this.label = "", this.helpText = "", this.disabled = !1, this.min = 0, this.max = 100, this.step = 1, this.tooltip = "top", this.tooltipFormatter = (e) => e.toString(), this.form = "", this.defaultValue = 0;
	}
	get validity() {
		return this.input.validity;
	}
	get validationMessage() {
		return this.input.validationMessage;
	}
	connectedCallback() {
		super.connectedCallback(), this.resizeObserver = new ResizeObserver(() => this.syncRange()), this.value < this.min && (this.value = this.min), this.value > this.max && (this.value = this.max), this.updateComplete.then(() => {
			this.syncRange(), this.resizeObserver.observe(this.input);
		});
	}
	disconnectedCallback() {
		var e;
		super.disconnectedCallback(), (e = this.resizeObserver) == null || e.unobserve(this.input);
	}
	handleChange() {
		this.emit("sl-change");
	}
	handleInput() {
		this.value = parseFloat(this.input.value), this.emit("sl-input"), this.syncRange();
	}
	handleBlur() {
		this.hasFocus = !1, this.hasTooltip = !1, this.emit("sl-blur");
	}
	handleFocus() {
		this.hasFocus = !0, this.hasTooltip = !0, this.emit("sl-focus");
	}
	handleThumbDragStart() {
		this.hasTooltip = !0;
	}
	handleThumbDragEnd() {
		this.hasTooltip = !1;
	}
	syncProgress(e) {
		this.input.style.setProperty("--percent", `${e * 100}%`);
	}
	syncTooltip(e) {
		if (this.output !== null) {
			let t = this.input.offsetWidth, n = this.output.offsetWidth, r = getComputedStyle(this.input).getPropertyValue("--thumb-size"), i = this.localize.dir() === "rtl", a = t * e;
			if (i) {
				let i = `${t - a}px + ${e} * ${r}`;
				this.output.style.translate = `calc((${i} - ${n / 2}px - ${r} / 2))`;
			} else {
				let t = `${a}px - ${e} * ${r}`;
				this.output.style.translate = `calc(${t} - ${n / 2}px + ${r} / 2)`;
			}
		}
	}
	handleValueChange() {
		this.formControlController.updateValidity(), this.input.value = this.value.toString(), this.value = parseFloat(this.input.value), this.syncRange();
	}
	handleDisabledChange() {
		this.formControlController.setValidity(this.disabled);
	}
	syncRange() {
		let e = Math.max(0, (this.value - this.min) / (this.max - this.min));
		this.syncProgress(e), this.tooltip !== "none" && this.hasTooltip && this.updateComplete.then(() => this.syncTooltip(e));
	}
	handleInvalid(e) {
		this.formControlController.setValidity(!1), this.formControlController.emitInvalidEvent(e);
	}
	focus(e) {
		this.input.focus(e);
	}
	blur() {
		this.input.blur();
	}
	stepUp() {
		this.input.stepUp(), this.value !== Number(this.input.value) && (this.value = Number(this.input.value));
	}
	stepDown() {
		this.input.stepDown(), this.value !== Number(this.input.value) && (this.value = Number(this.input.value));
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
		let e = this.hasSlotController.test("label"), t = this.hasSlotController.test("help-text"), n = this.label ? !0 : !!e, r = this.helpText ? !0 : !!t;
		return i`
      <div
        part="form-control"
        class=${d({
			"form-control": !0,
			"form-control--medium": !0,
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
			range: !0,
			"range--disabled": this.disabled,
			"range--focused": this.hasFocus,
			"range--rtl": this.localize.dir() === "rtl",
			"range--tooltip-visible": this.hasTooltip,
			"range--tooltip-top": this.tooltip === "top",
			"range--tooltip-bottom": this.tooltip === "bottom"
		})}
            @mousedown=${this.handleThumbDragStart}
            @mouseup=${this.handleThumbDragEnd}
            @touchstart=${this.handleThumbDragStart}
            @touchend=${this.handleThumbDragEnd}
          >
            <input
              part="input"
              id="input"
              class="range__control"
              title=${this.title}
              type="range"
              name=${u(this.name)}
              ?disabled=${this.disabled}
              min=${u(this.min)}
              max=${u(this.max)}
              step=${u(this.step)}
              .value=${g(this.value.toString())}
              aria-describedby="help-text"
              @change=${this.handleChange}
              @focus=${this.handleFocus}
              @input=${this.handleInput}
              @invalid=${this.handleInvalid}
              @blur=${this.handleBlur}
            />
            ${this.tooltip !== "none" && !this.disabled ? i`
                  <output part="tooltip" class="range__tooltip">
                    ${typeof this.tooltipFormatter == "function" ? this.tooltipFormatter(this.value) : this.value}
                  </output>
                ` : ""}
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
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.CKH4GVK3.js
y.styles = [
	o,
	_,
	v
], l([r(".range__control")], y.prototype, "input", 2), l([r(".range__tooltip")], y.prototype, "output", 2), l([n()], y.prototype, "hasFocus", 2), l([n()], y.prototype, "hasTooltip", 2), l([e()], y.prototype, "title", 2), l([e()], y.prototype, "name", 2), l([e({ type: Number })], y.prototype, "value", 2), l([e()], y.prototype, "label", 2), l([e({ attribute: "help-text" })], y.prototype, "helpText", 2), l([e({
	type: Boolean,
	reflect: !0
})], y.prototype, "disabled", 2), l([e({ type: Number })], y.prototype, "min", 2), l([e({ type: Number })], y.prototype, "max", 2), l([e({ type: Number })], y.prototype, "step", 2), l([e()], y.prototype, "tooltip", 2), l([e({ attribute: !1 })], y.prototype, "tooltipFormatter", 2), l([e({ reflect: !0 })], y.prototype, "form", 2), l([h()], y.prototype, "defaultValue", 2), l([a({ passive: !0 })], y.prototype, "handleThumbDragStart", 1), l([c("value", { waitUntilFirstUpdate: !0 })], y.prototype, "handleValueChange", 1), l([c("disabled", { waitUntilFirstUpdate: !0 })], y.prototype, "handleDisabledChange", 1), l([c("hasTooltip", { waitUntilFirstUpdate: !0 })], y.prototype, "syncRange", 1), y.define("sl-range");
//#endregion
