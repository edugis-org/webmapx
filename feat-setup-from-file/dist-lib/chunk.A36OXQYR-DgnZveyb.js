import { a as e, h as t, i as n, n as r, p as i } from "./decorators-d8E4nZJy.js";
import { a, i as o, s } from "./directive-helpers-Debt3Tx3.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.2OUC42YY.js
var c = t`
  :host {
    display: inline-block;
  }

  .button-group {
    display: flex;
    flex-wrap: nowrap;
  }
`, l = class extends o {
	constructor() {
		super(...arguments), this.disableRole = !1, this.label = "";
	}
	handleFocus(e) {
		u(e.target)?.toggleAttribute("data-sl-button-group__button--focus", !0);
	}
	handleBlur(e) {
		u(e.target)?.toggleAttribute("data-sl-button-group__button--focus", !1);
	}
	handleMouseOver(e) {
		u(e.target)?.toggleAttribute("data-sl-button-group__button--hover", !0);
	}
	handleMouseOut(e) {
		u(e.target)?.toggleAttribute("data-sl-button-group__button--hover", !1);
	}
	handleSlotChange() {
		let e = [...this.defaultSlot.assignedElements({ flatten: !0 })];
		e.forEach((t) => {
			let n = e.indexOf(t), r = u(t);
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
l.styles = [a, c], s([r("slot")], l.prototype, "defaultSlot", 2), s([n()], l.prototype, "disableRole", 2), s([e()], l.prototype, "label", 2);
function u(e) {
	let t = "sl-button, sl-radio-button";
	return e.closest(t) ?? e.querySelector(t);
}
//#endregion
export { l as t };
