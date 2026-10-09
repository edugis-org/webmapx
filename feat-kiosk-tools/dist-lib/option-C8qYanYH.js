import { a as e, h as t, i as n, n as r, p as i } from "./decorators-d8E4nZJy.js";
import { a, i as o, o as s, s as c } from "./directive-helpers-Debt3Tx3.js";
import { a as l, c as u, i as d, o as f, s as p, t as m } from "./chunk.AJ3ENQ5C-CwL2xu8w.js";
import { t as h } from "./chunk.YHLNUJ7P-BjspQfLm.js";
import { r as g, t as _ } from "./chunk.NYIIDP5N-gftugmWL.js";
import { t as v } from "./chunk.6CTB5ZDJ-DjZrBd6Y.js";
import { t as y } from "./chunk.3RPBFEDE-DBlOq5Pm.js";
import { t as b } from "./chunk.SI4ACBFK-CdJVQctt.js";
import { n as x } from "./chunk.RWUUFNUL-DFztA4uV.js";
import { t as S } from "./unsafe-html-AhVMIhPF.js";
import { t as C } from "./chunk.5JY5FUCG-dkh_eGt_.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.V2OL7VMD.js
var w = t`
  :host {
    display: inline-block;
  }

  .tag {
    display: flex;
    align-items: center;
    border: solid 1px;
    line-height: 1;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
  }

  .tag__remove::part(base) {
    color: inherit;
    padding: 0;
  }

  /*
   * Variant modifiers
   */

  .tag--primary {
    background-color: var(--sl-color-primary-50);
    border-color: var(--sl-color-primary-200);
    color: var(--sl-color-primary-800);
  }

  .tag--primary:active > sl-icon-button {
    color: var(--sl-color-primary-600);
  }

  .tag--success {
    background-color: var(--sl-color-success-50);
    border-color: var(--sl-color-success-200);
    color: var(--sl-color-success-800);
  }

  .tag--success:active > sl-icon-button {
    color: var(--sl-color-success-600);
  }

  .tag--neutral {
    background-color: var(--sl-color-neutral-50);
    border-color: var(--sl-color-neutral-200);
    color: var(--sl-color-neutral-800);
  }

  .tag--neutral:active > sl-icon-button {
    color: var(--sl-color-neutral-600);
  }

  .tag--warning {
    background-color: var(--sl-color-warning-50);
    border-color: var(--sl-color-warning-200);
    color: var(--sl-color-warning-800);
  }

  .tag--warning:active > sl-icon-button {
    color: var(--sl-color-warning-600);
  }

  .tag--danger {
    background-color: var(--sl-color-danger-50);
    border-color: var(--sl-color-danger-200);
    color: var(--sl-color-danger-800);
  }

  .tag--danger:active > sl-icon-button {
    color: var(--sl-color-danger-600);
  }

  /*
   * Size modifiers
   */

  .tag--small {
    font-size: var(--sl-button-font-size-small);
    height: calc(var(--sl-input-height-small) * 0.8);
    line-height: calc(var(--sl-input-height-small) - var(--sl-input-border-width) * 2);
    border-radius: var(--sl-input-border-radius-small);
    padding: 0 var(--sl-spacing-x-small);
  }

  .tag--medium {
    font-size: var(--sl-button-font-size-medium);
    height: calc(var(--sl-input-height-medium) * 0.8);
    line-height: calc(var(--sl-input-height-medium) - var(--sl-input-border-width) * 2);
    border-radius: var(--sl-input-border-radius-medium);
    padding: 0 var(--sl-spacing-small);
  }

  .tag--large {
    font-size: var(--sl-button-font-size-large);
    height: calc(var(--sl-input-height-large) * 0.8);
    line-height: calc(var(--sl-input-height-large) - var(--sl-input-border-width) * 2);
    border-radius: var(--sl-input-border-radius-large);
    padding: 0 var(--sl-spacing-medium);
  }

  .tag__remove {
    margin-inline-start: var(--sl-spacing-x-small);
  }

  /*
   * Pill modifier
   */

  .tag--pill {
    border-radius: var(--sl-border-radius-pill);
  }
`, T = class extends o {
	constructor() {
		super(...arguments), this.localize = new v(this), this.variant = "neutral", this.size = "medium", this.pill = !1, this.removable = !1;
	}
	handleRemoveClick() {
		this.emit("sl-remove");
	}
	render() {
		return i`
      <span
        part="base"
        class=${g({
			tag: !0,
			"tag--primary": this.variant === "primary",
			"tag--success": this.variant === "success",
			"tag--neutral": this.variant === "neutral",
			"tag--warning": this.variant === "warning",
			"tag--danger": this.variant === "danger",
			"tag--text": this.variant === "text",
			"tag--small": this.size === "small",
			"tag--medium": this.size === "medium",
			"tag--large": this.size === "large",
			"tag--pill": this.pill,
			"tag--removable": this.removable
		})}
      >
        <slot part="content" class="tag__content"></slot>

        ${this.removable ? i`
              <sl-icon-button
                part="remove-button"
                exportparts="base:remove-button__base"
                name="x-lg"
                library="system"
                label=${this.localize.term("remove")}
                class="tag__remove"
                @click=${this.handleRemoveClick}
                tabindex="-1"
              ></sl-icon-button>
            ` : ""}
      </span>
    `;
	}
};
T.styles = [a, w], T.dependencies = { "sl-icon-button": u }, c([e({ reflect: !0 })], T.prototype, "variant", 2), c([e({ reflect: !0 })], T.prototype, "size", 2), c([e({
	type: Boolean,
	reflect: !0
})], T.prototype, "pill", 2), c([e({ type: Boolean })], T.prototype, "removable", 2);
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.XNOUITPX.js
var E = t`
  :host {
    display: block;
  }

  /** The popup */
  .select {
    flex: 1 1 auto;
    display: inline-flex;
    width: 100%;
    position: relative;
    vertical-align: middle;
  }

  .select::part(popup) {
    z-index: var(--sl-z-index-dropdown);
  }

  .select[data-current-placement^='top']::part(popup) {
    transform-origin: bottom;
  }

  .select[data-current-placement^='bottom']::part(popup) {
    transform-origin: top;
  }

  /* Combobox */
  .select__combobox {
    flex: 1;
    display: flex;
    width: 100%;
    min-width: 0;
    position: relative;
    align-items: center;
    justify-content: start;
    font-family: var(--sl-input-font-family);
    font-weight: var(--sl-input-font-weight);
    letter-spacing: var(--sl-input-letter-spacing);
    vertical-align: middle;
    overflow: hidden;
    cursor: pointer;
    transition:
      var(--sl-transition-fast) color,
      var(--sl-transition-fast) border,
      var(--sl-transition-fast) box-shadow,
      var(--sl-transition-fast) background-color;
  }

  .select__display-input {
    position: relative;
    width: 100%;
    font: inherit;
    border: none;
    background: none;
    color: var(--sl-input-color);
    cursor: inherit;
    overflow: hidden;
    padding: 0;
    margin: 0;
    -webkit-appearance: none;
  }

  .select__display-input::placeholder {
    color: var(--sl-input-placeholder-color);
  }

  .select:not(.select--disabled):hover .select__display-input {
    color: var(--sl-input-color-hover);
  }

  .select__display-input:focus {
    outline: none;
  }

  /* Visually hide the display input when multiple is enabled */
  .select--multiple:not(.select--placeholder-visible) .select__display-input {
    position: absolute;
    z-index: -1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
  }

  .select__value-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
    opacity: 0;
    z-index: -1;
  }

  .select__tags {
    display: flex;
    flex: 1;
    align-items: center;
    flex-wrap: wrap;
    margin-inline-start: var(--sl-spacing-2x-small);
  }

  .select__tags::slotted(sl-tag) {
    cursor: pointer !important;
  }

  .select--disabled .select__tags,
  .select--disabled .select__tags::slotted(sl-tag) {
    cursor: not-allowed !important;
  }

  /* Standard selects */
  .select--standard .select__combobox {
    background-color: var(--sl-input-background-color);
    border: solid var(--sl-input-border-width) var(--sl-input-border-color);
  }

  .select--standard.select--disabled .select__combobox {
    background-color: var(--sl-input-background-color-disabled);
    border-color: var(--sl-input-border-color-disabled);
    color: var(--sl-input-color-disabled);
    opacity: 0.5;
    cursor: not-allowed;
    outline: none;
  }

  .select--standard:not(.select--disabled).select--open .select__combobox,
  .select--standard:not(.select--disabled).select--focused .select__combobox {
    background-color: var(--sl-input-background-color-focus);
    border-color: var(--sl-input-border-color-focus);
    box-shadow: 0 0 0 var(--sl-focus-ring-width) var(--sl-input-focus-ring-color);
  }

  /* Filled selects */
  .select--filled .select__combobox {
    border: none;
    background-color: var(--sl-input-filled-background-color);
    color: var(--sl-input-color);
  }

  .select--filled:hover:not(.select--disabled) .select__combobox {
    background-color: var(--sl-input-filled-background-color-hover);
  }

  .select--filled.select--disabled .select__combobox {
    background-color: var(--sl-input-filled-background-color-disabled);
    opacity: 0.5;
    cursor: not-allowed;
  }

  .select--filled:not(.select--disabled).select--open .select__combobox,
  .select--filled:not(.select--disabled).select--focused .select__combobox {
    background-color: var(--sl-input-filled-background-color-focus);
    outline: var(--sl-focus-ring);
  }

  /* Sizes */
  .select--small .select__combobox {
    border-radius: var(--sl-input-border-radius-small);
    font-size: var(--sl-input-font-size-small);
    min-height: var(--sl-input-height-small);
    padding-block: 0;
    padding-inline: var(--sl-input-spacing-small);
  }

  .select--small .select__clear {
    margin-inline-start: var(--sl-input-spacing-small);
  }

  .select--small .select__prefix::slotted(*) {
    margin-inline-end: var(--sl-input-spacing-small);
  }

  .select--small.select--multiple:not(.select--placeholder-visible) .select__prefix::slotted(*) {
    margin-inline-start: var(--sl-input-spacing-small);
  }

  .select--small.select--multiple:not(.select--placeholder-visible) .select__combobox {
    padding-block: 2px;
    padding-inline-start: 0;
  }

  .select--small .select__tags {
    gap: 2px;
  }

  .select--medium .select__combobox {
    border-radius: var(--sl-input-border-radius-medium);
    font-size: var(--sl-input-font-size-medium);
    min-height: var(--sl-input-height-medium);
    padding-block: 0;
    padding-inline: var(--sl-input-spacing-medium);
  }

  .select--medium .select__clear {
    margin-inline-start: var(--sl-input-spacing-medium);
  }

  .select--medium .select__prefix::slotted(*) {
    margin-inline-end: var(--sl-input-spacing-medium);
  }

  .select--medium.select--multiple:not(.select--placeholder-visible) .select__prefix::slotted(*) {
    margin-inline-start: var(--sl-input-spacing-medium);
  }

  .select--medium.select--multiple:not(.select--placeholder-visible) .select__combobox {
    padding-inline-start: 0;
    padding-block: 3px;
  }

  .select--medium .select__tags {
    gap: 3px;
  }

  .select--large .select__combobox {
    border-radius: var(--sl-input-border-radius-large);
    font-size: var(--sl-input-font-size-large);
    min-height: var(--sl-input-height-large);
    padding-block: 0;
    padding-inline: var(--sl-input-spacing-large);
  }

  .select--large .select__clear {
    margin-inline-start: var(--sl-input-spacing-large);
  }

  .select--large .select__prefix::slotted(*) {
    margin-inline-end: var(--sl-input-spacing-large);
  }

  .select--large.select--multiple:not(.select--placeholder-visible) .select__prefix::slotted(*) {
    margin-inline-start: var(--sl-input-spacing-large);
  }

  .select--large.select--multiple:not(.select--placeholder-visible) .select__combobox {
    padding-inline-start: 0;
    padding-block: 4px;
  }

  .select--large .select__tags {
    gap: 4px;
  }

  /* Pills */
  .select--pill.select--small .select__combobox {
    border-radius: var(--sl-input-height-small);
  }

  .select--pill.select--medium .select__combobox {
    border-radius: var(--sl-input-height-medium);
  }

  .select--pill.select--large .select__combobox {
    border-radius: var(--sl-input-height-large);
  }

  /* Prefix and Suffix */
  .select__prefix,
  .select__suffix {
    flex: 0;
    display: inline-flex;
    align-items: center;
    color: var(--sl-input-placeholder-color);
  }

  .select__suffix::slotted(*) {
    margin-inline-start: var(--sl-spacing-small);
  }

  /* Clear button */
  .select__clear {
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

  .select__clear:hover {
    color: var(--sl-input-icon-color-hover);
  }

  .select__clear:focus {
    outline: none;
  }

  /* Expand icon */
  .select__expand-icon {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    transition: var(--sl-transition-medium) rotate ease;
    rotate: 0;
    margin-inline-start: var(--sl-spacing-small);
  }

  .select--open .select__expand-icon {
    rotate: -180deg;
  }

  /* Listbox */
  .select__listbox {
    display: block;
    position: relative;
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-medium);
    font-weight: var(--sl-font-weight-normal);
    box-shadow: var(--sl-shadow-large);
    background: var(--sl-panel-background-color);
    border: solid var(--sl-panel-border-width) var(--sl-panel-border-color);
    border-radius: var(--sl-border-radius-medium);
    padding-block: var(--sl-spacing-x-small);
    padding-inline: 0;
    overflow: auto;
    overscroll-behavior: none;

    /* Make sure it adheres to the popup's auto size */
    max-width: var(--auto-size-available-width);
    max-height: var(--auto-size-available-height);
  }

  .select__listbox ::slotted(sl-divider) {
    --spacing: var(--sl-spacing-x-small);
  }

  .select__listbox ::slotted(small) {
    display: block;
    font-size: var(--sl-font-size-small);
    font-weight: var(--sl-font-weight-semibold);
    color: var(--sl-color-neutral-500);
    padding-block: var(--sl-spacing-2x-small);
    padding-inline: var(--sl-spacing-x-large);
  }
`, D = class extends o {
	constructor() {
		super(...arguments), this.formControlController = new y(this, { assumeInteractionOn: ["sl-blur", "sl-input"] }), this.hasSlotController = new _(this, "help-text", "label"), this.localize = new v(this), this.typeToSelectString = "", this.hasFocus = !1, this.displayLabel = "", this.selectedOptions = [], this.valueHasChanged = !1, this.name = "", this._value = "", this.defaultValue = "", this.size = "medium", this.placeholder = "", this.multiple = !1, this.maxOptionsVisible = 3, this.disabled = !1, this.clearable = !1, this.open = !1, this.hoist = !1, this.filled = !1, this.pill = !1, this.label = "", this.placement = "bottom", this.helpText = "", this.form = "", this.required = !1, this.getTag = (e) => i`
      <sl-tag
        part="tag"
        exportparts="
              base:tag__base,
              content:tag__content,
              remove-button:tag__remove-button,
              remove-button__base:tag__remove-button__base
            "
        ?pill=${this.pill}
        size=${this.size}
        removable
        @sl-remove=${(t) => this.handleTagRemove(t, e)}
      >
        ${e.getTextLabel()}
      </sl-tag>
    `, this.handleDocumentFocusIn = (e) => {
			let t = e.composedPath();
			this && !t.includes(this) && this.hide();
		}, this.handleDocumentKeyDown = (e) => {
			let t = e.target, n = t.closest(".select__clear") !== null, r = t.closest("sl-icon-button") !== null;
			if (!(n || r)) {
				if (e.key === "Escape" && this.open && !this.closeWatcher && (e.preventDefault(), e.stopPropagation(), this.hide(), this.displayInput.focus({ preventScroll: !0 })), e.key === "Enter" || e.key === " " && this.typeToSelectString === "") {
					if (e.preventDefault(), e.stopImmediatePropagation(), !this.open) {
						this.show();
						return;
					}
					this.currentOption && !this.currentOption.disabled && (this.valueHasChanged = !0, this.multiple ? this.toggleOptionSelection(this.currentOption) : this.setSelectedOptions(this.currentOption), this.updateComplete.then(() => {
						this.emit("sl-input"), this.emit("sl-change");
					}), this.multiple || (this.hide(), this.displayInput.focus({ preventScroll: !0 })));
					return;
				}
				if ([
					"ArrowUp",
					"ArrowDown",
					"Home",
					"End"
				].includes(e.key)) {
					let t = this.getAllOptions(), n = t.indexOf(this.currentOption), r = Math.max(0, n);
					if (e.preventDefault(), !this.open && (this.show(), this.currentOption)) return;
					e.key === "ArrowDown" ? (r = n + 1, r > t.length - 1 && (r = 0)) : e.key === "ArrowUp" ? (r = n - 1, r < 0 && (r = t.length - 1)) : e.key === "Home" ? r = 0 : e.key === "End" && (r = t.length - 1), this.setCurrentOption(t[r]);
				}
				if (e.key && e.key.length === 1 || e.key === "Backspace") {
					let t = this.getAllOptions();
					if (e.metaKey || e.ctrlKey || e.altKey) return;
					if (!this.open) {
						if (e.key === "Backspace") return;
						this.show();
					}
					e.stopPropagation(), e.preventDefault(), clearTimeout(this.typeToSelectTimeout), this.typeToSelectTimeout = window.setTimeout(() => this.typeToSelectString = "", 1e3), e.key === "Backspace" ? this.typeToSelectString = this.typeToSelectString.slice(0, -1) : this.typeToSelectString += e.key.toLowerCase();
					for (let e of t) if (e.getTextLabel().toLowerCase().startsWith(this.typeToSelectString)) {
						this.setCurrentOption(e);
						break;
					}
				}
			}
		}, this.handleDocumentMouseDown = (e) => {
			let t = e.composedPath();
			this && !t.includes(this) && this.hide();
		};
	}
	get value() {
		return this._value;
	}
	set value(e) {
		e = this.multiple ? Array.isArray(e) ? e : e.split(" ") : Array.isArray(e) ? e.join(" ") : e, this._value !== e && (this.valueHasChanged = !0, this._value = e);
	}
	get validity() {
		return this.valueInput.validity;
	}
	get validationMessage() {
		return this.valueInput.validationMessage;
	}
	connectedCallback() {
		super.connectedCallback(), setTimeout(() => {
			this.handleDefaultSlotChange();
		}), this.open = !1;
	}
	addOpenListeners() {
		var e;
		document.addEventListener("focusin", this.handleDocumentFocusIn), document.addEventListener("keydown", this.handleDocumentKeyDown), document.addEventListener("mousedown", this.handleDocumentMouseDown), this.getRootNode() !== document && this.getRootNode().addEventListener("focusin", this.handleDocumentFocusIn), "CloseWatcher" in window && ((e = this.closeWatcher) == null || e.destroy(), this.closeWatcher = new CloseWatcher(), this.closeWatcher.onclose = () => {
			this.open && (this.hide(), this.displayInput.focus({ preventScroll: !0 }));
		});
	}
	removeOpenListeners() {
		var e;
		document.removeEventListener("focusin", this.handleDocumentFocusIn), document.removeEventListener("keydown", this.handleDocumentKeyDown), document.removeEventListener("mousedown", this.handleDocumentMouseDown), this.getRootNode() !== document && this.getRootNode().removeEventListener("focusin", this.handleDocumentFocusIn), (e = this.closeWatcher) == null || e.destroy();
	}
	handleFocus() {
		this.hasFocus = !0, this.displayInput.setSelectionRange(0, 0), this.emit("sl-focus");
	}
	handleBlur() {
		this.hasFocus = !1, this.emit("sl-blur");
	}
	handleLabelClick() {
		this.displayInput.focus();
	}
	handleComboboxMouseDown(e) {
		let t = e.composedPath().some((e) => e instanceof Element && e.tagName.toLowerCase() === "sl-icon-button");
		this.disabled || t || (e.preventDefault(), this.displayInput.focus({ preventScroll: !0 }), this.open = !this.open);
	}
	handleComboboxKeyDown(e) {
		e.key !== "Tab" && (e.stopPropagation(), this.handleDocumentKeyDown(e));
	}
	handleClearClick(e) {
		e.stopPropagation(), this.valueHasChanged = !0, this.value !== "" && (this.setSelectedOptions([]), this.displayInput.focus({ preventScroll: !0 }), this.updateComplete.then(() => {
			this.emit("sl-clear"), this.emit("sl-input"), this.emit("sl-change");
		}));
	}
	handleClearMouseDown(e) {
		e.stopPropagation(), e.preventDefault();
	}
	handleOptionClick(e) {
		let t = e.target.closest("sl-option"), n = this.value;
		t && !t.disabled && (this.valueHasChanged = !0, this.multiple ? this.toggleOptionSelection(t) : this.setSelectedOptions(t), this.updateComplete.then(() => this.displayInput.focus({ preventScroll: !0 })), this.value !== n && this.updateComplete.then(() => {
			this.emit("sl-input"), this.emit("sl-change");
		}), this.multiple || (this.hide(), this.displayInput.focus({ preventScroll: !0 })));
	}
	handleDefaultSlotChange() {
		customElements.get("sl-option") || customElements.whenDefined("sl-option").then(() => this.handleDefaultSlotChange());
		let e = this.getAllOptions(), t = this.valueHasChanged ? this.value : this.defaultValue, n = Array.isArray(t) ? t : [t], r = [];
		e.forEach((e) => r.push(e.value)), this.setSelectedOptions(e.filter((e) => n.includes(e.value)));
	}
	handleTagRemove(e, t) {
		e.stopPropagation(), this.valueHasChanged = !0, this.disabled || (this.toggleOptionSelection(t, !1), this.updateComplete.then(() => {
			this.emit("sl-input"), this.emit("sl-change");
		}));
	}
	getAllOptions() {
		return [...this.querySelectorAll("sl-option")];
	}
	getFirstOption() {
		return this.querySelector("sl-option");
	}
	setCurrentOption(e) {
		this.getAllOptions().forEach((e) => {
			e.current = !1, e.tabIndex = -1;
		}), e && (this.currentOption = e, e.current = !0, e.tabIndex = 0, e.focus());
	}
	setSelectedOptions(e) {
		let t = this.getAllOptions(), n = Array.isArray(e) ? e : [e];
		t.forEach((e) => e.selected = !1), n.length && n.forEach((e) => e.selected = !0), this.selectionChanged();
	}
	toggleOptionSelection(e, t) {
		t === !0 || t === !1 ? e.selected = t : e.selected = !e.selected, this.selectionChanged();
	}
	selectionChanged() {
		let e = this.getAllOptions();
		this.selectedOptions = e.filter((e) => e.selected);
		let t = this.valueHasChanged;
		if (this.multiple) this.value = this.selectedOptions.map((e) => e.value), this.placeholder && this.value.length === 0 ? this.displayLabel = "" : this.displayLabel = this.localize.term("numOptionsSelected", this.selectedOptions.length);
		else {
			let e = this.selectedOptions[0];
			this.value = e?.value ?? "", this.displayLabel = (e?.getTextLabel)?.call(e) ?? "";
		}
		this.valueHasChanged = t, this.updateComplete.then(() => {
			this.formControlController.updateValidity();
		});
	}
	get tags() {
		return this.selectedOptions.map((e, t) => {
			if (t < this.maxOptionsVisible || this.maxOptionsVisible <= 0) {
				let n = this.getTag(e, t);
				return i`<div @sl-remove=${(t) => this.handleTagRemove(t, e)}>
          ${typeof n == "string" ? S(n) : n}
        </div>`;
			} else if (t === this.maxOptionsVisible) return i`<sl-tag size=${this.size}>+${this.selectedOptions.length - t}</sl-tag>`;
			return i``;
		});
	}
	handleInvalid(e) {
		this.formControlController.setValidity(!1), this.formControlController.emitInvalidEvent(e);
	}
	handleDisabledChange() {
		this.disabled && (this.open = !1, this.handleOpenChange());
	}
	attributeChangedCallback(e, t, n) {
		if (super.attributeChangedCallback(e, t, n), e === "value") {
			let e = this.valueHasChanged;
			this.value = this.defaultValue, this.valueHasChanged = e;
		}
	}
	handleValueChange() {
		if (!this.valueHasChanged) {
			let e = this.valueHasChanged;
			this.value = this.defaultValue, this.valueHasChanged = e;
		}
		let e = this.getAllOptions(), t = Array.isArray(this.value) ? this.value : [this.value];
		this.setSelectedOptions(e.filter((e) => t.includes(e.value)));
	}
	async handleOpenChange() {
		if (this.open && !this.disabled) {
			this.setCurrentOption(this.selectedOptions[0] || this.getFirstOption()), this.emit("sl-show"), this.addOpenListeners(), await d(this), this.listbox.hidden = !1, this.popup.active = !0, requestAnimationFrame(() => {
				this.setCurrentOption(this.currentOption);
			});
			let { keyframes: e, options: t } = f(this, "select.show", { dir: this.localize.dir() });
			await m(this.popup.popup, e, t), this.currentOption && x(this.currentOption, this.listbox, "vertical", "auto"), this.emit("sl-after-show");
		} else {
			this.emit("sl-hide"), this.removeOpenListeners(), await d(this);
			let { keyframes: e, options: t } = f(this, "select.hide", { dir: this.localize.dir() });
			await m(this.popup.popup, e, t), this.listbox.hidden = !0, this.popup.active = !1, this.emit("sl-after-hide");
		}
	}
	async show() {
		if (this.open || this.disabled) {
			this.open = !1;
			return;
		}
		return this.open = !0, l(this, "sl-after-show");
	}
	async hide() {
		if (!this.open || this.disabled) {
			this.open = !1;
			return;
		}
		return this.open = !1, l(this, "sl-after-hide");
	}
	checkValidity() {
		return this.valueInput.checkValidity();
	}
	getForm() {
		return this.formControlController.getForm();
	}
	reportValidity() {
		return this.valueInput.reportValidity();
	}
	setCustomValidity(e) {
		this.valueInput.setCustomValidity(e), this.formControlController.updateValidity();
	}
	focus(e) {
		this.displayInput.focus(e);
	}
	blur() {
		this.displayInput.blur();
	}
	render() {
		let e = this.hasSlotController.test("label"), t = this.hasSlotController.test("help-text"), n = this.label ? !0 : !!e, r = this.helpText ? !0 : !!t, a = this.clearable && !this.disabled && this.value.length > 0, o = this.placeholder && this.value && this.value.length <= 0;
		return i`
      <div
        part="form-control"
        class=${g({
			"form-control": !0,
			"form-control--small": this.size === "small",
			"form-control--medium": this.size === "medium",
			"form-control--large": this.size === "large",
			"form-control--has-label": n,
			"form-control--has-help-text": r
		})}
      >
        <label
          id="label"
          part="form-control-label"
          class="form-control__label"
          aria-hidden=${n ? "false" : "true"}
          @click=${this.handleLabelClick}
        >
          <slot name="label">${this.label}</slot>
        </label>

        <div part="form-control-input" class="form-control-input">
          <sl-popup
            class=${g({
			select: !0,
			"select--standard": !0,
			"select--filled": this.filled,
			"select--pill": this.pill,
			"select--open": this.open,
			"select--disabled": this.disabled,
			"select--multiple": this.multiple,
			"select--focused": this.hasFocus,
			"select--placeholder-visible": o,
			"select--top": this.placement === "top",
			"select--bottom": this.placement === "bottom",
			"select--small": this.size === "small",
			"select--medium": this.size === "medium",
			"select--large": this.size === "large"
		})}
            placement=${this.placement}
            strategy=${this.hoist ? "fixed" : "absolute"}
            flip
            shift
            sync="width"
            auto-size="vertical"
            auto-size-padding="10"
          >
            <div
              part="combobox"
              class="select__combobox"
              slot="anchor"
              @keydown=${this.handleComboboxKeyDown}
              @mousedown=${this.handleComboboxMouseDown}
            >
              <slot part="prefix" name="prefix" class="select__prefix"></slot>

              <input
                part="display-input"
                class="select__display-input"
                type="text"
                placeholder=${this.placeholder}
                .disabled=${this.disabled}
                .value=${this.displayLabel}
                autocomplete="off"
                spellcheck="false"
                autocapitalize="off"
                readonly
                aria-controls="listbox"
                aria-expanded=${this.open ? "true" : "false"}
                aria-haspopup="listbox"
                aria-labelledby="label"
                aria-disabled=${this.disabled ? "true" : "false"}
                aria-describedby="help-text"
                role="combobox"
                tabindex="0"
                @focus=${this.handleFocus}
                @blur=${this.handleBlur}
              />

              ${this.multiple ? i`<div part="tags" class="select__tags">${this.tags}</div>` : ""}

              <input
                class="select__value-input"
                type="text"
                ?disabled=${this.disabled}
                ?required=${this.required}
                .value=${Array.isArray(this.value) ? this.value.join(", ") : this.value}
                tabindex="-1"
                aria-hidden="true"
                @focus=${() => this.focus()}
                @invalid=${this.handleInvalid}
              />

              ${a ? i`
                    <button
                      part="clear-button"
                      class="select__clear"
                      type="button"
                      aria-label=${this.localize.term("clearEntry")}
                      @mousedown=${this.handleClearMouseDown}
                      @click=${this.handleClearClick}
                      tabindex="-1"
                    >
                      <slot name="clear-icon">
                        <sl-icon name="x-circle-fill" library="system"></sl-icon>
                      </slot>
                    </button>
                  ` : ""}

              <slot name="suffix" part="suffix" class="select__suffix"></slot>

              <slot name="expand-icon" part="expand-icon" class="select__expand-icon">
                <sl-icon library="system" name="chevron-down"></sl-icon>
              </slot>
            </div>

            <div
              id="listbox"
              role="listbox"
              aria-expanded=${this.open ? "true" : "false"}
              aria-multiselectable=${this.multiple ? "true" : "false"}
              aria-labelledby="label"
              part="listbox"
              class="select__listbox"
              tabindex="-1"
              @mouseup=${this.handleOptionClick}
              @slotchange=${this.handleDefaultSlotChange}
            >
              <slot></slot>
            </div>
          </sl-popup>
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
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.TP2GB2HO.js
D.styles = [
	a,
	b,
	E
], D.dependencies = {
	"sl-icon": h,
	"sl-popup": C,
	"sl-tag": T
}, c([r(".select")], D.prototype, "popup", 2), c([r(".select__combobox")], D.prototype, "combobox", 2), c([r(".select__display-input")], D.prototype, "displayInput", 2), c([r(".select__value-input")], D.prototype, "valueInput", 2), c([r(".select__listbox")], D.prototype, "listbox", 2), c([n()], D.prototype, "hasFocus", 2), c([n()], D.prototype, "displayLabel", 2), c([n()], D.prototype, "currentOption", 2), c([n()], D.prototype, "selectedOptions", 2), c([n()], D.prototype, "valueHasChanged", 2), c([e()], D.prototype, "name", 2), c([n()], D.prototype, "value", 1), c([e({ attribute: "value" })], D.prototype, "defaultValue", 2), c([e({ reflect: !0 })], D.prototype, "size", 2), c([e()], D.prototype, "placeholder", 2), c([e({
	type: Boolean,
	reflect: !0
})], D.prototype, "multiple", 2), c([e({
	attribute: "max-options-visible",
	type: Number
})], D.prototype, "maxOptionsVisible", 2), c([e({
	type: Boolean,
	reflect: !0
})], D.prototype, "disabled", 2), c([e({ type: Boolean })], D.prototype, "clearable", 2), c([e({
	type: Boolean,
	reflect: !0
})], D.prototype, "open", 2), c([e({ type: Boolean })], D.prototype, "hoist", 2), c([e({
	type: Boolean,
	reflect: !0
})], D.prototype, "filled", 2), c([e({
	type: Boolean,
	reflect: !0
})], D.prototype, "pill", 2), c([e()], D.prototype, "label", 2), c([e({ reflect: !0 })], D.prototype, "placement", 2), c([e({ attribute: "help-text" })], D.prototype, "helpText", 2), c([e({ reflect: !0 })], D.prototype, "form", 2), c([e({
	type: Boolean,
	reflect: !0
})], D.prototype, "required", 2), c([e()], D.prototype, "getTag", 2), c([s("disabled", { waitUntilFirstUpdate: !0 })], D.prototype, "handleDisabledChange", 1), c([s(["defaultValue", "value"], { waitUntilFirstUpdate: !0 })], D.prototype, "handleValueChange", 1), c([s("open", { waitUntilFirstUpdate: !0 })], D.prototype, "handleOpenChange", 1), p("select.show", {
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
}), p("select.hide", {
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
}), D.define("sl-select");
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.FXXKMG2P.js
var O = t`
  :host {
    display: block;
    user-select: none;
    -webkit-user-select: none;
  }

  :host(:focus) {
    outline: none;
  }

  .option {
    position: relative;
    display: flex;
    align-items: center;
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-medium);
    font-weight: var(--sl-font-weight-normal);
    line-height: var(--sl-line-height-normal);
    letter-spacing: var(--sl-letter-spacing-normal);
    color: var(--sl-color-neutral-700);
    padding: var(--sl-spacing-x-small) var(--sl-spacing-medium) var(--sl-spacing-x-small) var(--sl-spacing-x-small);
    transition: var(--sl-transition-fast) fill;
    cursor: pointer;
  }

  .option--hover:not(.option--current):not(.option--disabled) {
    background-color: var(--sl-color-neutral-100);
    color: var(--sl-color-neutral-1000);
  }

  .option--current,
  .option--current.option--disabled {
    background-color: var(--sl-color-primary-600);
    color: var(--sl-color-neutral-0);
    opacity: 1;
  }

  .option--disabled {
    outline: none;
    opacity: 0.5;
    cursor: not-allowed;
  }

  .option__label {
    flex: 1 1 auto;
    display: inline-block;
    line-height: var(--sl-line-height-dense);
  }

  .option .option__check {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    visibility: hidden;
    padding-inline-end: var(--sl-spacing-2x-small);
  }

  .option--selected .option__check {
    visibility: visible;
  }

  .option__prefix,
  .option__suffix {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  .option__prefix::slotted(*) {
    margin-inline-end: var(--sl-spacing-x-small);
  }

  .option__suffix::slotted(*) {
    margin-inline-start: var(--sl-spacing-x-small);
  }

  @media (forced-colors: active) {
    :host(:hover:not([aria-disabled='true'])) .option {
      outline: dashed 1px SelectedItem;
      outline-offset: -1px;
    }
  }
`, k = class extends o {
	constructor() {
		super(...arguments), this.localize = new v(this), this.isInitialized = !1, this.current = !1, this.selected = !1, this.hasHover = !1, this.value = "", this.disabled = !1;
	}
	connectedCallback() {
		super.connectedCallback(), this.setAttribute("role", "option"), this.setAttribute("aria-selected", "false");
	}
	handleDefaultSlotChange() {
		this.isInitialized ? customElements.whenDefined("sl-select").then(() => {
			let e = this.closest("sl-select");
			e && e.handleDefaultSlotChange();
		}) : this.isInitialized = !0;
	}
	handleMouseEnter() {
		this.hasHover = !0;
	}
	handleMouseLeave() {
		this.hasHover = !1;
	}
	handleDisabledChange() {
		this.setAttribute("aria-disabled", this.disabled ? "true" : "false");
	}
	handleSelectedChange() {
		this.setAttribute("aria-selected", this.selected ? "true" : "false");
	}
	handleValueChange() {
		typeof this.value != "string" && (this.value = String(this.value)), this.value.includes(" ") && (console.error("Option values cannot include a space. All spaces have been replaced with underscores.", this), this.value = this.value.replace(/ /g, "_"));
	}
	getTextLabel() {
		let e = this.childNodes, t = "";
		return [...e].forEach((e) => {
			e.nodeType === Node.ELEMENT_NODE && (e.hasAttribute("slot") || (t += e.textContent)), e.nodeType === Node.TEXT_NODE && (t += e.textContent);
		}), t.trim();
	}
	render() {
		return i`
      <div
        part="base"
        class=${g({
			option: !0,
			"option--current": this.current,
			"option--disabled": this.disabled,
			"option--selected": this.selected,
			"option--hover": this.hasHover
		})}
        @mouseenter=${this.handleMouseEnter}
        @mouseleave=${this.handleMouseLeave}
      >
        <sl-icon part="checked-icon" class="option__check" name="check" library="system" aria-hidden="true"></sl-icon>
        <slot part="prefix" name="prefix" class="option__prefix"></slot>
        <slot part="label" class="option__label" @slotchange=${this.handleDefaultSlotChange}></slot>
        <slot part="suffix" name="suffix" class="option__suffix"></slot>
      </div>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.JXOKFADN.js
k.styles = [a, O], k.dependencies = { "sl-icon": h }, c([r(".option__label")], k.prototype, "defaultSlot", 2), c([n()], k.prototype, "current", 2), c([n()], k.prototype, "selected", 2), c([n()], k.prototype, "hasHover", 2), c([e({ reflect: !0 })], k.prototype, "value", 2), c([e({
	type: Boolean,
	reflect: !0
})], k.prototype, "disabled", 2), c([s("disabled")], k.prototype, "handleDisabledChange", 1), c([s("selected")], k.prototype, "handleSelectedChange", 1), c([s("value")], k.prototype, "handleValueChange", 1), k.define("sl-option");
//#endregion
