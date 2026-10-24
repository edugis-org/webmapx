import { a as e, h as t, n, p as r } from "./decorators-d8E4nZJy.js";
import { a as i, i as a, o, s } from "./directive-helpers-Debt3Tx3.js";
import { a as c, i as l, n as u, o as d, s as f, t as p } from "./chunk.AJ3ENQ5C-CwL2xu8w.js";
import { r as m } from "./chunk.NYIIDP5N-gftugmWL.js";
import { t as h } from "./chunk.6CTB5ZDJ-DjZrBd6Y.js";
import { t as g } from "./chunk.5JY5FUCG-dkh_eGt_.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.FW7UWQXB.js
var _ = t`
  :host {
    --max-width: 20rem;
    --hide-delay: 0ms;
    --show-delay: 150ms;

    display: contents;
  }

  .tooltip {
    --arrow-size: var(--sl-tooltip-arrow-size);
    --arrow-color: var(--sl-tooltip-background-color);
  }

  .tooltip::part(popup) {
    z-index: var(--sl-z-index-tooltip);
  }

  .tooltip[placement^='top']::part(popup) {
    transform-origin: bottom;
  }

  .tooltip[placement^='bottom']::part(popup) {
    transform-origin: top;
  }

  .tooltip[placement^='left']::part(popup) {
    transform-origin: right;
  }

  .tooltip[placement^='right']::part(popup) {
    transform-origin: left;
  }

  .tooltip__body {
    display: block;
    width: max-content;
    max-width: var(--max-width);
    border-radius: var(--sl-tooltip-border-radius);
    background-color: var(--sl-tooltip-background-color);
    font-family: var(--sl-tooltip-font-family);
    font-size: var(--sl-tooltip-font-size);
    font-weight: var(--sl-tooltip-font-weight);
    line-height: var(--sl-tooltip-line-height);
    text-align: start;
    white-space: normal;
    color: var(--sl-tooltip-color);
    padding: var(--sl-tooltip-padding);
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
  }
`, v = class extends a {
	constructor() {
		super(), this.localize = new h(this), this.content = "", this.placement = "top", this.disabled = !1, this.distance = 8, this.open = !1, this.skidding = 0, this.trigger = "hover focus", this.hoist = !1, this.handleBlur = () => {
			this.hasTrigger("focus") && this.hide();
		}, this.handleClick = () => {
			this.hasTrigger("click") && (this.open ? this.hide() : this.show());
		}, this.handleFocus = () => {
			this.hasTrigger("focus") && this.show();
		}, this.handleDocumentKeyDown = (e) => {
			e.key === "Escape" && (e.stopPropagation(), this.hide());
		}, this.handleMouseOver = () => {
			if (this.hasTrigger("hover")) {
				let e = u(getComputedStyle(this).getPropertyValue("--show-delay"));
				clearTimeout(this.hoverTimeout), this.hoverTimeout = window.setTimeout(() => this.show(), e);
			}
		}, this.handleMouseOut = () => {
			if (this.hasTrigger("hover")) {
				let e = u(getComputedStyle(this).getPropertyValue("--hide-delay"));
				clearTimeout(this.hoverTimeout), this.hoverTimeout = window.setTimeout(() => this.hide(), e);
			}
		}, this.addEventListener("blur", this.handleBlur, !0), this.addEventListener("focus", this.handleFocus, !0), this.addEventListener("click", this.handleClick), this.addEventListener("mouseover", this.handleMouseOver), this.addEventListener("mouseout", this.handleMouseOut);
	}
	disconnectedCallback() {
		var e;
		super.disconnectedCallback(), (e = this.closeWatcher) == null || e.destroy(), document.removeEventListener("keydown", this.handleDocumentKeyDown);
	}
	firstUpdated() {
		this.body.hidden = !this.open, this.open && (this.popup.active = !0, this.popup.reposition());
	}
	hasTrigger(e) {
		return this.trigger.split(" ").includes(e);
	}
	async handleOpenChange() {
		var e, t;
		if (this.open) {
			if (this.disabled) return;
			this.emit("sl-show"), "CloseWatcher" in window ? ((e = this.closeWatcher) == null || e.destroy(), this.closeWatcher = new CloseWatcher(), this.closeWatcher.onclose = () => {
				this.hide();
			}) : document.addEventListener("keydown", this.handleDocumentKeyDown), await l(this.body), this.body.hidden = !1, this.popup.active = !0;
			let { keyframes: t, options: n } = d(this, "tooltip.show", { dir: this.localize.dir() });
			await p(this.popup.popup, t, n), this.popup.reposition(), this.emit("sl-after-show");
		} else {
			this.emit("sl-hide"), (t = this.closeWatcher) == null || t.destroy(), document.removeEventListener("keydown", this.handleDocumentKeyDown), await l(this.body);
			let { keyframes: e, options: n } = d(this, "tooltip.hide", { dir: this.localize.dir() });
			await p(this.popup.popup, e, n), this.popup.active = !1, this.body.hidden = !0, this.emit("sl-after-hide");
		}
	}
	async handleOptionsChange() {
		this.hasUpdated && (await this.updateComplete, this.popup.reposition());
	}
	handleDisabledChange() {
		this.disabled && this.open && this.hide();
	}
	async show() {
		if (!this.open) return this.open = !0, c(this, "sl-after-show");
	}
	async hide() {
		if (this.open) return this.open = !1, c(this, "sl-after-hide");
	}
	render() {
		return r`
      <sl-popup
        part="base"
        exportparts="
          popup:base__popup,
          arrow:base__arrow
        "
        class=${m({
			tooltip: !0,
			"tooltip--open": this.open
		})}
        placement=${this.placement}
        distance=${this.distance}
        skidding=${this.skidding}
        strategy=${this.hoist ? "fixed" : "absolute"}
        flip
        shift
        arrow
        hover-bridge
      >
        ${""}
        <slot slot="anchor" aria-describedby="tooltip"></slot>

        ${""}
        <div part="body" id="tooltip" class="tooltip__body" role="tooltip" aria-live=${this.open ? "polite" : "off"}>
          <slot name="content">${this.content}</slot>
        </div>
      </sl-popup>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.URTPIBTY.js
v.styles = [i, _], v.dependencies = { "sl-popup": g }, s([n("slot:not([name])")], v.prototype, "defaultSlot", 2), s([n(".tooltip__body")], v.prototype, "body", 2), s([n("sl-popup")], v.prototype, "popup", 2), s([e()], v.prototype, "content", 2), s([e()], v.prototype, "placement", 2), s([e({
	type: Boolean,
	reflect: !0
})], v.prototype, "disabled", 2), s([e({ type: Number })], v.prototype, "distance", 2), s([e({
	type: Boolean,
	reflect: !0
})], v.prototype, "open", 2), s([e({ type: Number })], v.prototype, "skidding", 2), s([e()], v.prototype, "trigger", 2), s([e({ type: Boolean })], v.prototype, "hoist", 2), s([o("open", { waitUntilFirstUpdate: !0 })], v.prototype, "handleOpenChange", 1), s([o([
	"content",
	"distance",
	"hoist",
	"placement",
	"skidding"
])], v.prototype, "handleOptionsChange", 1), s([o("disabled")], v.prototype, "handleDisabledChange", 1), f("tooltip.show", {
	keyframes: [{
		opacity: 0,
		scale: .8
	}, {
		opacity: 1,
		scale: 1
	}],
	options: {
		duration: 150,
		easing: "ease"
	}
}), f("tooltip.hide", {
	keyframes: [{
		opacity: 1,
		scale: 1
	}, {
		opacity: 0,
		scale: .8
	}],
	options: {
		duration: 150,
		easing: "ease"
	}
}), v.define("sl-tooltip");
//#endregion
