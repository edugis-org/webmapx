import { a as e, h as t, n, p as r } from "./decorators-d8E4nZJy.js";
import { a as i, i as a, o, s } from "./directive-helpers-Debt3Tx3.js";
import { a as c, i as l, n as u, o as d, s as f, t as p } from "./chunk.AJ3ENQ5C-CwL2xu8w.js";
import { r as m } from "./chunk.NYIIDP5N-gftugmWL.js";
import { t as h } from "./chunk.6CTB5ZDJ-DjZrBd6Y.js";
import { t as g } from "./chunk.5JY5FUCG-dkh_eGt_.js";
//#region src/components/internal/top-layer-dialog.ts
var _ = t`
    dialog.webmapx-top-layer {
        border: none;
        padding: 0;
        margin: 0;
        background: transparent;
        max-width: none;
        max-height: none;
        width: 0;
        height: 0;
        overflow: visible;
    }

    dialog.webmapx-top-layer::backdrop {
        background: transparent;
    }
`;
function v(e) {
	return r`
        <dialog class="webmapx-top-layer"
                @cancel=${b}
                @sl-after-hide=${x}>${e}</dialog>
    `;
}
var y = "dialog.webmapx-top-layer";
function b(e) {
	e.preventDefault(), e.currentTarget.querySelector("sl-dialog")?.hide?.();
}
function x(e) {
	if (e.target?.tagName !== "SL-DIALOG") return;
	let t = e.currentTarget;
	t.open && t.close();
}
function S(e) {
	let t = () => {
		let t = e.renderRoot?.querySelector?.(y);
		!t || t.open || typeof t.showModal == "function" && t.showModal();
	};
	e.hasUpdated ? t() : e.updateComplete.then(t);
}
function C(e) {
	w(e), typeof e.showPopover == "function" && (e.popover = "manual", e.matches(":popover-open") || e.showPopover());
}
function w(e) {
	let t = T(e).find((e) => e.tagName === "WEBMAPX-MAP");
	t && e.parentNode !== t && t.appendChild(e);
}
function T(e) {
	let t = [], n = e;
	for (; n;) n = n.parentNode ?? n.host ?? null, n instanceof Element && t.push(n);
	return t;
}
function E(e) {
	typeof e.hidePopover != "function" || e.popover === null || e.matches(":popover-open") && e.hidePopover();
}
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.FW7UWQXB.js
var D = t`
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
`, O = class extends a {
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
O.styles = [i, D], O.dependencies = { "sl-popup": g }, s([n("slot:not([name])")], O.prototype, "defaultSlot", 2), s([n(".tooltip__body")], O.prototype, "body", 2), s([n("sl-popup")], O.prototype, "popup", 2), s([e()], O.prototype, "content", 2), s([e()], O.prototype, "placement", 2), s([e({
	type: Boolean,
	reflect: !0
})], O.prototype, "disabled", 2), s([e({ type: Number })], O.prototype, "distance", 2), s([e({
	type: Boolean,
	reflect: !0
})], O.prototype, "open", 2), s([e({ type: Number })], O.prototype, "skidding", 2), s([e()], O.prototype, "trigger", 2), s([e({ type: Boolean })], O.prototype, "hoist", 2), s([o("open", { waitUntilFirstUpdate: !0 })], O.prototype, "handleOpenChange", 1), s([o([
	"content",
	"distance",
	"hoist",
	"placement",
	"skidding"
])], O.prototype, "handleOptionsChange", 1), s([o("disabled")], O.prototype, "handleDisabledChange", 1), f("tooltip.show", {
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
}), O.define("sl-tooltip");
//#endregion
export { _ as a, v as i, C as n, S as r, E as t };
