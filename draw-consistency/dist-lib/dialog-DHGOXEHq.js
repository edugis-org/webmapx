import { a as e, h as t, n, p as r } from "./decorators-d8E4nZJy.js";
import { a as i, i as a, o, s, u as c } from "./directive-helpers-Debt3Tx3.js";
import { t as l } from "./chunk.LD4M4QGE-CiCfhE8r.js";
import { a as u, c as d, i as f, o as p, s as m, t as h } from "./chunk.AJ3ENQ5C-CwL2xu8w.js";
import "./chunk.YHLNUJ7P-BjspQfLm.js";
import { n as g, r as _, t as v } from "./chunk.NYIIDP5N-gftugmWL.js";
import { t as y } from "./chunk.6CTB5ZDJ-DjZrBd6Y.js";
import { r as b, t as x } from "./chunk.RWUUFNUL-DFztA4uV.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.VESXC477.js
function* S(e = document.activeElement) {
	e != null && (yield e, "shadowRoot" in e && e.shadowRoot && e.shadowRoot.mode !== "closed" && (yield* c(S(e.shadowRoot.activeElement))));
}
function C() {
	return [...S()].pop();
}
var w = /* @__PURE__ */ new WeakMap();
function T(e) {
	let t = w.get(e);
	return t || (t = window.getComputedStyle(e, null), w.set(e, t)), t;
}
function E(e) {
	if (typeof e.checkVisibility == "function") return e.checkVisibility({
		checkOpacity: !1,
		checkVisibilityCSS: !0
	});
	let t = T(e);
	return t.visibility !== "hidden" && t.display !== "none";
}
function D(e) {
	let { overflowY: t, overflowX: n } = T(e);
	return t === "scroll" || n === "scroll" ? !0 : t !== "auto" || n !== "auto" ? !1 : e.scrollHeight > e.clientHeight && t === "auto" || e.scrollWidth > e.clientWidth && n === "auto";
}
function O(e) {
	let t = e.tagName.toLowerCase(), n = Number(e.getAttribute("tabindex"));
	if (e.hasAttribute("tabindex") && (isNaN(n) || n <= -1) || e.hasAttribute("disabled") || e.closest("[inert]")) return !1;
	if (t === "input" && e.getAttribute("type") === "radio") {
		let t = e.getRootNode(), n = `input[type='radio'][name="${e.getAttribute("name")}"]`, r = t.querySelector(`${n}:checked`);
		return r ? r === e : t.querySelector(n) === e;
	}
	return E(e) ? (t === "audio" || t === "video") && e.hasAttribute("controls") || e.hasAttribute("tabindex") || e.hasAttribute("contenteditable") && e.getAttribute("contenteditable") !== "false" || [
		"button",
		"input",
		"select",
		"textarea",
		"a",
		"audio",
		"video",
		"summary",
		"iframe"
	].includes(t) ? !0 : D(e) : !1;
}
function k(e) {
	let t = j(e);
	return {
		start: t[0] ?? null,
		end: t[t.length - 1] ?? null
	};
}
function A(e, t) {
	return e.getRootNode({ composed: !0 })?.host !== t;
}
function j(e) {
	let t = /* @__PURE__ */ new WeakMap(), n = [];
	function r(i) {
		if (i instanceof Element) {
			if (i.hasAttribute("inert") || i.closest("[inert]") || t.has(i)) return;
			t.set(i, !0), !n.includes(i) && O(i) && n.push(i), i instanceof HTMLSlotElement && A(i, e) && i.assignedElements({ flatten: !0 }).forEach((e) => {
				r(e);
			}), i.shadowRoot !== null && i.shadowRoot.mode === "open" && r(i.shadowRoot);
		}
		for (let e of i.children) r(e);
	}
	return r(e), n.sort((e, t) => {
		let n = Number(e.getAttribute("tabindex")) || 0;
		return (Number(t.getAttribute("tabindex")) || 0) - n;
	});
}
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.EMN3H5QW.js
var M = [], N = class {
	constructor(e) {
		this.tabDirection = "forward", this.handleFocusIn = () => {
			this.isActive() && this.checkFocus();
		}, this.handleKeyDown = (e) => {
			var t;
			if (e.key !== "Tab" || this.isExternalActivated || !this.isActive()) return;
			let n = C();
			if (this.previousFocus = n, this.previousFocus && this.possiblyHasTabbableChildren(this.previousFocus)) return;
			e.shiftKey ? this.tabDirection = "backward" : this.tabDirection = "forward";
			let r = j(this.element), i = r.findIndex((e) => e === n);
			this.previousFocus = this.currentFocus;
			let a = this.tabDirection === "forward" ? 1 : -1;
			for (;;) {
				i + a >= r.length ? i = 0 : i + a < 0 ? i = r.length - 1 : i += a, this.previousFocus = this.currentFocus;
				let n = r[i];
				if (this.tabDirection === "backward" && this.previousFocus && this.possiblyHasTabbableChildren(this.previousFocus) || n && this.possiblyHasTabbableChildren(n)) return;
				e.preventDefault(), this.currentFocus = n, (t = this.currentFocus) == null || t.focus({ preventScroll: !1 });
				let o = [...S()];
				if (o.includes(this.currentFocus) || !o.includes(this.previousFocus)) break;
			}
			setTimeout(() => this.checkFocus());
		}, this.handleKeyUp = () => {
			this.tabDirection = "forward";
		}, this.element = e, this.elementsWithTabbableControls = ["iframe"];
	}
	activate() {
		M.push(this.element), document.addEventListener("focusin", this.handleFocusIn), document.addEventListener("keydown", this.handleKeyDown), document.addEventListener("keyup", this.handleKeyUp);
	}
	deactivate() {
		M = M.filter((e) => e !== this.element), this.currentFocus = null, document.removeEventListener("focusin", this.handleFocusIn), document.removeEventListener("keydown", this.handleKeyDown), document.removeEventListener("keyup", this.handleKeyUp);
	}
	isActive() {
		return M[M.length - 1] === this.element;
	}
	activateExternal() {
		this.isExternalActivated = !0;
	}
	deactivateExternal() {
		this.isExternalActivated = !1;
	}
	checkFocus() {
		if (this.isActive() && !this.isExternalActivated) {
			let e = j(this.element);
			if (!this.element.matches(":focus-within")) {
				let t = e[0], n = e[e.length - 1], r = this.tabDirection === "forward" ? t : n;
				typeof r?.focus == "function" && (this.currentFocus = r, r.focus({ preventScroll: !1 }));
			}
		}
	}
	possiblyHasTabbableChildren(e) {
		return this.elementsWithTabbableControls.includes(e.tagName.toLowerCase()) || e.hasAttribute("controls");
	}
}, P = t`
  :host {
    --width: 31rem;
    --header-spacing: var(--sl-spacing-large);
    --body-spacing: var(--sl-spacing-large);
    --footer-spacing: var(--sl-spacing-large);

    display: contents;
  }

  .dialog {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: var(--sl-z-index-dialog);
  }

  .dialog__panel {
    display: flex;
    flex-direction: column;
    z-index: 2;
    width: var(--width);
    max-width: calc(100% - var(--sl-spacing-2x-large));
    max-height: calc(100% - var(--sl-spacing-2x-large));
    background-color: var(--sl-panel-background-color);
    border-radius: var(--sl-border-radius-medium);
    box-shadow: var(--sl-shadow-x-large);
  }

  .dialog__panel:focus {
    outline: none;
  }

  /* Ensure there's enough vertical padding for phones that don't update vh when chrome appears (e.g. iPhone) */
  @media screen and (max-width: 420px) {
    .dialog__panel {
      max-height: 80vh;
    }
  }

  .dialog--open .dialog__panel {
    display: flex;
    opacity: 1;
  }

  .dialog__header {
    flex: 0 0 auto;
    display: flex;
  }

  .dialog__title {
    flex: 1 1 auto;
    font: inherit;
    font-size: var(--sl-font-size-large);
    line-height: var(--sl-line-height-dense);
    padding: var(--header-spacing);
    margin: 0;
  }

  .dialog__header-actions {
    flex-shrink: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: end;
    gap: var(--sl-spacing-2x-small);
    padding: 0 var(--header-spacing);
  }

  .dialog__header-actions sl-icon-button,
  .dialog__header-actions ::slotted(sl-icon-button) {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    font-size: var(--sl-font-size-medium);
  }

  .dialog__body {
    flex: 1 1 auto;
    display: block;
    padding: var(--body-spacing);
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }

  .dialog__footer {
    flex: 0 0 auto;
    text-align: right;
    padding: var(--footer-spacing);
  }

  .dialog__footer ::slotted(sl-button:not(:first-of-type)) {
    margin-inline-start: var(--sl-spacing-x-small);
  }

  .dialog:not(.dialog--has-footer) .dialog__footer {
    display: none;
  }

  .dialog__overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: var(--sl-overlay-background-color);
  }

  @media (forced-colors: active) {
    .dialog__panel {
      border: solid 1px var(--sl-color-neutral-0);
    }
  }
`, F = class extends a {
	constructor() {
		super(...arguments), this.hasSlotController = new v(this, "footer"), this.localize = new y(this), this.modal = new N(this), this.open = !1, this.label = "", this.noHeader = !1, this.handleDocumentKeyDown = (e) => {
			e.key === "Escape" && this.modal.isActive() && this.open && (e.stopPropagation(), this.requestClose("keyboard"));
		};
	}
	firstUpdated() {
		this.dialog.hidden = !this.open, this.open && (this.addOpenListeners(), this.modal.activate(), x(this));
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.modal.deactivate(), b(this), this.removeOpenListeners();
	}
	requestClose(e) {
		if (this.emit("sl-request-close", {
			cancelable: !0,
			detail: { source: e }
		}).defaultPrevented) {
			let e = p(this, "dialog.denyClose", { dir: this.localize.dir() });
			h(this.panel, e.keyframes, e.options);
			return;
		}
		this.hide();
	}
	addOpenListeners() {
		var e;
		"CloseWatcher" in window ? ((e = this.closeWatcher) == null || e.destroy(), this.closeWatcher = new CloseWatcher(), this.closeWatcher.onclose = () => this.requestClose("keyboard")) : document.addEventListener("keydown", this.handleDocumentKeyDown);
	}
	removeOpenListeners() {
		var e;
		(e = this.closeWatcher) == null || e.destroy(), document.removeEventListener("keydown", this.handleDocumentKeyDown);
	}
	async handleOpenChange() {
		if (this.open) {
			this.emit("sl-show"), this.addOpenListeners(), this.originalTrigger = document.activeElement, this.modal.activate(), x(this);
			let e = this.querySelector("[autofocus]");
			e && e.removeAttribute("autofocus"), await Promise.all([f(this.dialog), f(this.overlay)]), this.dialog.hidden = !1, requestAnimationFrame(() => {
				this.emit("sl-initial-focus", { cancelable: !0 }).defaultPrevented || (e ? e.focus({ preventScroll: !0 }) : this.panel.focus({ preventScroll: !0 })), e && e.setAttribute("autofocus", "");
			});
			let t = p(this, "dialog.show", { dir: this.localize.dir() }), n = p(this, "dialog.overlay.show", { dir: this.localize.dir() });
			await Promise.all([h(this.panel, t.keyframes, t.options), h(this.overlay, n.keyframes, n.options)]), this.emit("sl-after-show");
		} else {
			l(this), this.emit("sl-hide"), this.removeOpenListeners(), this.modal.deactivate(), await Promise.all([f(this.dialog), f(this.overlay)]);
			let e = p(this, "dialog.hide", { dir: this.localize.dir() }), t = p(this, "dialog.overlay.hide", { dir: this.localize.dir() });
			await Promise.all([h(this.overlay, t.keyframes, t.options).then(() => {
				this.overlay.hidden = !0;
			}), h(this.panel, e.keyframes, e.options).then(() => {
				this.panel.hidden = !0;
			})]), this.dialog.hidden = !0, this.overlay.hidden = !1, this.panel.hidden = !1, b(this);
			let n = this.originalTrigger;
			typeof n?.focus == "function" && setTimeout(() => n.focus()), this.emit("sl-after-hide");
		}
	}
	async show() {
		if (!this.open) return this.open = !0, u(this, "sl-after-show");
	}
	async hide() {
		if (this.open) return this.open = !1, u(this, "sl-after-hide");
	}
	render() {
		return r`
      <div
        part="base"
        class=${_({
			dialog: !0,
			"dialog--open": this.open,
			"dialog--has-footer": this.hasSlotController.test("footer")
		})}
      >
        <div part="overlay" class="dialog__overlay" @click=${() => this.requestClose("overlay")} tabindex="-1"></div>

        <div
          part="panel"
          class="dialog__panel"
          role="dialog"
          aria-modal="true"
          aria-hidden=${this.open ? "false" : "true"}
          aria-label=${g(this.noHeader ? this.label : void 0)}
          aria-labelledby=${g(this.noHeader ? void 0 : "title")}
          tabindex="-1"
        >
          ${this.noHeader ? "" : r`
                <header part="header" class="dialog__header">
                  <h2 part="title" class="dialog__title" id="title">
                    <slot name="label"> ${this.label.length > 0 ? this.label : "﻿"} </slot>
                  </h2>
                  <div part="header-actions" class="dialog__header-actions">
                    <slot name="header-actions"></slot>
                    <sl-icon-button
                      part="close-button"
                      exportparts="base:close-button__base"
                      class="dialog__close"
                      name="x-lg"
                      label=${this.localize.term("close")}
                      library="system"
                      @click="${() => this.requestClose("close-button")}"
                    ></sl-icon-button>
                  </div>
                </header>
              `}
          ${""}
          <div part="body" class="dialog__body" tabindex="-1"><slot></slot></div>

          <footer part="footer" class="dialog__footer">
            <slot name="footer"></slot>
          </footer>
        </div>
      </div>
    `;
	}
};
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.KPLQLAWP.js
F.styles = [i, P], F.dependencies = { "sl-icon-button": d }, s([n(".dialog")], F.prototype, "dialog", 2), s([n(".dialog__panel")], F.prototype, "panel", 2), s([n(".dialog__overlay")], F.prototype, "overlay", 2), s([e({
	type: Boolean,
	reflect: !0
})], F.prototype, "open", 2), s([e({ reflect: !0 })], F.prototype, "label", 2), s([e({
	attribute: "no-header",
	type: Boolean,
	reflect: !0
})], F.prototype, "noHeader", 2), s([o("open", { waitUntilFirstUpdate: !0 })], F.prototype, "handleOpenChange", 1), m("dialog.show", {
	keyframes: [{
		opacity: 0,
		scale: .8
	}, {
		opacity: 1,
		scale: 1
	}],
	options: {
		duration: 250,
		easing: "ease"
	}
}), m("dialog.hide", {
	keyframes: [{
		opacity: 1,
		scale: 1
	}, {
		opacity: 0,
		scale: .8
	}],
	options: {
		duration: 250,
		easing: "ease"
	}
}), m("dialog.denyClose", {
	keyframes: [
		{ scale: 1 },
		{ scale: 1.02 },
		{ scale: 1 }
	],
	options: { duration: 250 }
}), m("dialog.overlay.show", {
	keyframes: [{ opacity: 0 }, { opacity: 1 }],
	options: { duration: 250 }
}), m("dialog.overlay.hide", {
	keyframes: [{ opacity: 1 }, { opacity: 0 }],
	options: { duration: 250 }
}), F.define("sl-dialog");
//#endregion
export { k as n, C as t };
