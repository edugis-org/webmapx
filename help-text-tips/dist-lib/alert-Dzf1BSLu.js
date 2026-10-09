import { a as e, h as t, i as n, n as r, p as i } from "./decorators-d8E4nZJy.js";
import { a, i as o, o as s, s as c } from "./directive-helpers-Debt3Tx3.js";
import { t as l } from "./chunk.LD4M4QGE-CiCfhE8r.js";
import { a as u, c as d, i as f, o as p, s as m, t as h } from "./chunk.AJ3ENQ5C-CwL2xu8w.js";
import "./chunk.YHLNUJ7P-BjspQfLm.js";
import { r as g, t as _ } from "./chunk.NYIIDP5N-gftugmWL.js";
import { t as v } from "./chunk.6CTB5ZDJ-DjZrBd6Y.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.HPCLRZ2S.js
var y = t`
  :host {
    display: contents;

    /* For better DX, we'll reset the margin here so the base part can inherit it */
    margin: 0;
  }

  .alert {
    position: relative;
    display: flex;
    align-items: stretch;
    background-color: var(--sl-panel-background-color);
    border: solid var(--sl-panel-border-width) var(--sl-panel-border-color);
    border-top-width: calc(var(--sl-panel-border-width) * 3);
    border-radius: var(--sl-border-radius-medium);
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-small);
    font-weight: var(--sl-font-weight-normal);
    line-height: 1.6;
    color: var(--sl-color-neutral-700);
    margin: inherit;
    overflow: hidden;
  }

  .alert:not(.alert--has-icon) .alert__icon,
  .alert:not(.alert--closable) .alert__close-button {
    display: none;
  }

  .alert__icon {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    font-size: var(--sl-font-size-large);
    padding-inline-start: var(--sl-spacing-large);
  }

  .alert--has-countdown {
    border-bottom: none;
  }

  .alert--primary {
    border-top-color: var(--sl-color-primary-600);
  }

  .alert--primary .alert__icon {
    color: var(--sl-color-primary-600);
  }

  .alert--success {
    border-top-color: var(--sl-color-success-600);
  }

  .alert--success .alert__icon {
    color: var(--sl-color-success-600);
  }

  .alert--neutral {
    border-top-color: var(--sl-color-neutral-600);
  }

  .alert--neutral .alert__icon {
    color: var(--sl-color-neutral-600);
  }

  .alert--warning {
    border-top-color: var(--sl-color-warning-600);
  }

  .alert--warning .alert__icon {
    color: var(--sl-color-warning-600);
  }

  .alert--danger {
    border-top-color: var(--sl-color-danger-600);
  }

  .alert--danger .alert__icon {
    color: var(--sl-color-danger-600);
  }

  .alert__message {
    flex: 1 1 auto;
    display: block;
    padding: var(--sl-spacing-large);
    overflow: hidden;
  }

  .alert__close-button {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    font-size: var(--sl-font-size-medium);
    margin-inline-end: var(--sl-spacing-medium);
    align-self: center;
  }

  .alert__countdown {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: calc(var(--sl-panel-border-width) * 3);
    background-color: var(--sl-panel-border-color);
    display: flex;
  }

  .alert__countdown--ltr {
    justify-content: flex-end;
  }

  .alert__countdown .alert__countdown-elapsed {
    height: 100%;
    width: 0;
  }

  .alert--primary .alert__countdown-elapsed {
    background-color: var(--sl-color-primary-600);
  }

  .alert--success .alert__countdown-elapsed {
    background-color: var(--sl-color-success-600);
  }

  .alert--neutral .alert__countdown-elapsed {
    background-color: var(--sl-color-neutral-600);
  }

  .alert--warning .alert__countdown-elapsed {
    background-color: var(--sl-color-warning-600);
  }

  .alert--danger .alert__countdown-elapsed {
    background-color: var(--sl-color-danger-600);
  }

  .alert__timer {
    display: none;
  }
`, b = class e extends o {
	constructor() {
		super(...arguments), this.hasSlotController = new _(this, "icon", "suffix"), this.localize = new v(this), this.open = !1, this.closable = !1, this.variant = "primary", this.duration = Infinity, this.remainingTime = this.duration;
	}
	static get toastStack() {
		return this.currentToastStack ||= Object.assign(document.createElement("div"), { className: "sl-toast-stack" }), this.currentToastStack;
	}
	firstUpdated() {
		this.base.hidden = !this.open;
	}
	restartAutoHide() {
		this.handleCountdownChange(), clearTimeout(this.autoHideTimeout), clearInterval(this.remainingTimeInterval), this.open && this.duration < Infinity && (this.autoHideTimeout = window.setTimeout(() => this.hide(), this.duration), this.remainingTime = this.duration, this.remainingTimeInterval = window.setInterval(() => {
			this.remainingTime -= 100;
		}, 100));
	}
	pauseAutoHide() {
		var e;
		(e = this.countdownAnimation) == null || e.pause(), clearTimeout(this.autoHideTimeout), clearInterval(this.remainingTimeInterval);
	}
	resumeAutoHide() {
		var e;
		this.duration < Infinity && (this.autoHideTimeout = window.setTimeout(() => this.hide(), this.remainingTime), this.remainingTimeInterval = window.setInterval(() => {
			this.remainingTime -= 100;
		}, 100), (e = this.countdownAnimation) == null || e.play());
	}
	handleCountdownChange() {
		if (this.open && this.duration < Infinity && this.countdown) {
			let { countdownElement: e } = this;
			this.countdownAnimation = e.animate([{ width: "100%" }, { width: "0" }], {
				duration: this.duration,
				easing: "linear"
			});
		}
	}
	handleCloseClick() {
		this.hide();
	}
	async handleOpenChange() {
		if (this.open) {
			this.emit("sl-show"), this.duration < Infinity && this.restartAutoHide(), await f(this.base), this.base.hidden = !1;
			let { keyframes: e, options: t } = p(this, "alert.show", { dir: this.localize.dir() });
			await h(this.base, e, t), this.emit("sl-after-show");
		} else {
			l(this), this.emit("sl-hide"), clearTimeout(this.autoHideTimeout), clearInterval(this.remainingTimeInterval), await f(this.base);
			let { keyframes: e, options: t } = p(this, "alert.hide", { dir: this.localize.dir() });
			await h(this.base, e, t), this.base.hidden = !0, this.emit("sl-after-hide");
		}
	}
	handleDurationChange() {
		this.restartAutoHide();
	}
	async show() {
		if (!this.open) return this.open = !0, u(this, "sl-after-show");
	}
	async hide() {
		if (this.open) return this.open = !1, u(this, "sl-after-hide");
	}
	async toast() {
		return new Promise((t) => {
			this.handleCountdownChange(), e.toastStack.parentElement === null && document.body.append(e.toastStack), e.toastStack.appendChild(this), requestAnimationFrame(() => {
				this.clientWidth, this.show();
			}), this.addEventListener("sl-after-hide", () => {
				e.toastStack.removeChild(this), t(), e.toastStack.querySelector("sl-alert") === null && e.toastStack.remove();
			}, { once: !0 });
		});
	}
	render() {
		return i`
      <div
        part="base"
        class=${g({
			alert: !0,
			"alert--open": this.open,
			"alert--closable": this.closable,
			"alert--has-countdown": !!this.countdown,
			"alert--has-icon": this.hasSlotController.test("icon"),
			"alert--primary": this.variant === "primary",
			"alert--success": this.variant === "success",
			"alert--neutral": this.variant === "neutral",
			"alert--warning": this.variant === "warning",
			"alert--danger": this.variant === "danger"
		})}
        role="alert"
        aria-hidden=${this.open ? "false" : "true"}
        @mouseenter=${this.pauseAutoHide}
        @mouseleave=${this.resumeAutoHide}
      >
        <div part="icon" class="alert__icon">
          <slot name="icon"></slot>
        </div>

        <div part="message" class="alert__message" aria-live="polite">
          <slot></slot>
        </div>

        ${this.closable ? i`
              <sl-icon-button
                part="close-button"
                exportparts="base:close-button__base"
                class="alert__close-button"
                name="x-lg"
                library="system"
                label=${this.localize.term("close")}
                @click=${this.handleCloseClick}
              ></sl-icon-button>
            ` : ""}

        <div role="timer" class="alert__timer">${this.remainingTime}</div>

        ${this.countdown ? i`
              <div
                class=${g({
			alert__countdown: !0,
			"alert__countdown--ltr": this.countdown === "ltr"
		})}
              >
                <div class="alert__countdown-elapsed"></div>
              </div>
            ` : ""}
      </div>
    `;
	}
};
b.styles = [a, y], b.dependencies = { "sl-icon-button": d }, c([r("[part~=\"base\"]")], b.prototype, "base", 2), c([r(".alert__countdown-elapsed")], b.prototype, "countdownElement", 2), c([e({
	type: Boolean,
	reflect: !0
})], b.prototype, "open", 2), c([e({
	type: Boolean,
	reflect: !0
})], b.prototype, "closable", 2), c([e({ reflect: !0 })], b.prototype, "variant", 2), c([e({ type: Number })], b.prototype, "duration", 2), c([e({
	type: String,
	reflect: !0
})], b.prototype, "countdown", 2), c([n()], b.prototype, "remainingTime", 2), c([s("open", { waitUntilFirstUpdate: !0 })], b.prototype, "handleOpenChange", 1), c([s("duration")], b.prototype, "handleDurationChange", 1);
var x = b;
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.R45OWEVP.js
m("alert.show", {
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
}), m("alert.hide", {
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
}), x.define("sl-alert");
//#endregion
