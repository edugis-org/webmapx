import { a as e, h as t, i as n, n as r } from "./decorators-d8E4nZJy.js";
import { a as i, i as a, s as o } from "./directive-helpers-Debt3Tx3.js";
import { t as s } from "./chunk.YHLNUJ7P-BjspQfLm.js";
import { n as c, r as l } from "./chunk.NYIIDP5N-gftugmWL.js";
import { n as u, t as d } from "./static-html-Cq7cHvCj.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.6I2T3DLI.js
var f = t`
  :host {
    display: inline-block;
    color: var(--sl-color-neutral-600);
  }

  .icon-button {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    background: none;
    border: none;
    border-radius: var(--sl-border-radius-medium);
    font-size: inherit;
    color: inherit;
    padding: var(--sl-spacing-x-small);
    cursor: pointer;
    transition: var(--sl-transition-x-fast) color;
    -webkit-appearance: none;
  }

  .icon-button:hover:not(.icon-button--disabled),
  .icon-button:focus-visible:not(.icon-button--disabled) {
    color: var(--sl-color-primary-600);
  }

  .icon-button:active:not(.icon-button--disabled) {
    color: var(--sl-color-primary-700);
  }

  .icon-button:focus {
    outline: none;
  }

  .icon-button--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .icon-button:focus-visible {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  .icon-button__icon {
    pointer-events: none;
  }
`, p = class extends a {
	constructor() {
		super(...arguments), this.hasFocus = !1, this.label = "", this.disabled = !1;
	}
	handleBlur() {
		this.hasFocus = !1, this.emit("sl-blur");
	}
	handleFocus() {
		this.hasFocus = !0, this.emit("sl-focus");
	}
	handleClick(e) {
		this.disabled && (e.preventDefault(), e.stopPropagation());
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
	render() {
		let e = !!this.href, t = e ? d`a` : d`button`;
		return u`
      <${t}
        part="base"
        class=${l({
			"icon-button": !0,
			"icon-button--disabled": !e && this.disabled,
			"icon-button--focused": this.hasFocus
		})}
        ?disabled=${c(e ? void 0 : this.disabled)}
        type=${c(e ? void 0 : "button")}
        href=${c(e ? this.href : void 0)}
        target=${c(e ? this.target : void 0)}
        download=${c(e ? this.download : void 0)}
        rel=${c(e && this.target ? "noreferrer noopener" : void 0)}
        role=${c(e ? void 0 : "button")}
        aria-disabled=${this.disabled ? "true" : "false"}
        aria-label="${this.label}"
        tabindex=${this.disabled ? "-1" : "0"}
        @blur=${this.handleBlur}
        @focus=${this.handleFocus}
        @click=${this.handleClick}
      >
        <sl-icon
          class="icon-button__icon"
          name=${c(this.name)}
          library=${c(this.library)}
          src=${c(this.src)}
          aria-hidden="true"
        ></sl-icon>
      </${t}>
    `;
	}
};
p.styles = [i, f], p.dependencies = { "sl-icon": s }, o([r(".icon-button")], p.prototype, "button", 2), o([n()], p.prototype, "hasFocus", 2), o([e()], p.prototype, "name", 2), o([e()], p.prototype, "library", 2), o([e()], p.prototype, "src", 2), o([e()], p.prototype, "href", 2), o([e()], p.prototype, "target", 2), o([e()], p.prototype, "download", 2), o([e()], p.prototype, "label", 2), o([e({
	type: Boolean,
	reflect: !0
})], p.prototype, "disabled", 2);
//#endregion
export { p as t };
