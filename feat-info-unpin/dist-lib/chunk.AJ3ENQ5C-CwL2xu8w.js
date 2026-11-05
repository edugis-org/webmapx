import { a as e, h as t, i as n, n as r } from "./decorators-d8E4nZJy.js";
import { a as i, c as a, i as o, l as s, s as c } from "./directive-helpers-Debt3Tx3.js";
import { t as l } from "./chunk.YHLNUJ7P-BjspQfLm.js";
import { n as u, r as d } from "./chunk.NYIIDP5N-gftugmWL.js";
import { n as f, t as p } from "./static-html-Cq7cHvCj.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.6I2T3DLI.js
var m = t`
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
`, h = class extends o {
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
		let e = !!this.href, t = e ? p`a` : p`button`;
		return f`
      <${t}
        part="base"
        class=${d({
			"icon-button": !0,
			"icon-button--disabled": !e && this.disabled,
			"icon-button--focused": this.hasFocus
		})}
        ?disabled=${u(e ? void 0 : this.disabled)}
        type=${u(e ? void 0 : "button")}
        href=${u(e ? this.href : void 0)}
        target=${u(e ? this.target : void 0)}
        download=${u(e ? this.download : void 0)}
        rel=${u(e && this.target ? "noreferrer noopener" : void 0)}
        role=${u(e ? void 0 : "button")}
        aria-disabled=${this.disabled ? "true" : "false"}
        aria-label="${this.label}"
        tabindex=${this.disabled ? "-1" : "0"}
        @blur=${this.handleBlur}
        @focus=${this.handleFocus}
        @click=${this.handleClick}
      >
        <sl-icon
          class="icon-button__icon"
          name=${u(this.name)}
          library=${u(this.library)}
          src=${u(this.src)}
          aria-hidden="true"
        ></sl-icon>
      </${t}>
    `;
	}
};
h.styles = [i, m], h.dependencies = { "sl-icon": l }, c([r(".icon-button")], h.prototype, "button", 2), c([n()], h.prototype, "hasFocus", 2), c([e()], h.prototype, "name", 2), c([e()], h.prototype, "library", 2), c([e()], h.prototype, "src", 2), c([e()], h.prototype, "href", 2), c([e()], h.prototype, "target", 2), c([e()], h.prototype, "download", 2), c([e()], h.prototype, "label", 2), c([e({
	type: Boolean,
	reflect: !0
})], h.prototype, "disabled", 2);
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.K7JGTRV7.js
var g = /* @__PURE__ */ new Map(), _ = /* @__PURE__ */ new WeakMap();
function v(e) {
	return e ?? {
		keyframes: [],
		options: { duration: 0 }
	};
}
function y(e, t) {
	return t.toLowerCase() === "rtl" ? {
		keyframes: e.rtlKeyframes || e.keyframes,
		options: e.options
	} : e;
}
function b(e, t) {
	g.set(e, v(t));
}
function x(e, t, n) {
	let r = _.get(e);
	if (r?.[t]) return y(r[t], n.dir);
	let i = g.get(t);
	return i ? y(i, n.dir) : {
		keyframes: [],
		options: { duration: 0 }
	};
}
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.B4BZKR24.js
function S(e, t) {
	return new Promise((n) => {
		function r(i) {
			i.target === e && (e.removeEventListener(t, r), n());
		}
		e.addEventListener(t, r);
	});
}
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.AJ3ENQ5C.js
function C(e, t, n) {
	return new Promise((r) => {
		if (n?.duration === Infinity) throw Error("Promise-based animations must be finite.");
		let i = e.animate(t, a(s({}, n), { duration: T() ? 0 : n.duration }));
		i.addEventListener("cancel", r, { once: !0 }), i.addEventListener("finish", r, { once: !0 });
	});
}
function w(e) {
	return e = e.toString().toLowerCase(), e.indexOf("ms") > -1 ? parseFloat(e) : e.indexOf("s") > -1 ? parseFloat(e) * 1e3 : parseFloat(e);
}
function T() {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function E(e) {
	return Promise.all(e.getAnimations().map((e) => new Promise((t) => {
		e.cancel(), requestAnimationFrame(t);
	})));
}
function D(e, t) {
	return e.map((e) => a(s({}, e), { height: e.height === "auto" ? `${t}px` : e.height }));
}
//#endregion
export { S as a, h as c, E as i, w as n, x as o, D as r, b as s, C as t };
