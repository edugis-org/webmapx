import { h as e, i as t, o as n, p as r } from "./decorators-d8E4nZJy.js";
import { t as i } from "./decorate-D_Hbritd.js";
import { t as a } from "./map-clock-BmIiPfc8.js";
import { t as o } from "./webmapx-base-tool-3MS5kiXf.js";
import "./button-DE9ytwxI.js";
import { t as s } from "./control-surface-styles-zbl1JfZH.js";
import "./switch-caSfmU2w.js";
import { t as c } from "./accent-control-styles-0YoGl5gm.js";
import { t as l } from "./form-label-styles-CiXgi-FX.js";
import "./option-C8qYanYH.js";
import { a as u, i as d, n as f, o as p, r as m, t as h } from "./step-button-CJ6XMsCH.js";
//#region src/utils/time-slider-math.ts
var g = 1440, _ = 6e4, v = 1440 * _;
function y(e) {
	return Math.floor(e / v) * v;
}
function b(e, t) {
	return Math.round((y(t) - y(e)) / v);
}
function x(e) {
	return Math.floor((e - y(e)) / _);
}
function S(e, t, n) {
	return y(e) + t * v + n * _;
}
function C(e) {
	return new Date(e).toISOString().slice(0, 10);
}
function w(e) {
	let t = (e % g + g) % g;
	return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
function T(e, t) {
	let n = new Date(e);
	return n.setUTCFullYear(n.getUTCFullYear() + t), n.getTime();
}
//#endregion
//#region src/components/webmapx-time-slider-tool.ts
var E = 183, D = 10, O = 1e3, k = [
	{
		label: "1 minute",
		perSecond: _
	},
	{
		label: "10 minutes",
		perSecond: 10 * _
	},
	{
		label: "1 hour",
		perSecond: 60 * _
	},
	{
		label: "1 day",
		perSecond: g * _,
		discrete: !0
	}
];
function A(e) {
	return k.find((t) => t.perSecond === e) || {
		label: `${e} ms`,
		perSecond: e,
		discrete: e >= k[3].perSecond
	};
}
function j(e) {
	let t = 0;
	for (let n = 1; n < k.length; n++) Math.abs(k[n].perSecond - e) < Math.abs(k[t].perSecond - e) && (t = n);
	return t;
}
var M = class extends o {
	constructor(...e) {
		super(...e), this.mapTime = { mode: "live" }, this.origin = Date.now(), this.anchorYear = (/* @__PURE__ */ new Date()).getUTCFullYear(), this.liveTick = Date.now(), this.speedIndex = 2, this.playing = !1, this.playSpeedMs = null, this.liveTimer = null, this.stepper = new u(), this.playTimer = null, this.playFrame = null, this.playLastFrame = 0;
	}
	static {
		this.styles = [
			c,
			l,
			s,
			e`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; }
        .now {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
        }
        .moment {
            font-variant-numeric: tabular-nums;
            margin-bottom: 0.75rem;
        }
        .moment .local {
            display: block;
            font-weight: 400;
            color: var(--color-text-secondary, #5a6773);
        }
        .row { margin-bottom: 0.75rem; }
        .row > label {
            display: flex;
            justify-content: space-between;
            gap: 0.5rem;
            margin-bottom: 0.25rem;
        }
        .row .value { font-variant-numeric: tabular-nums; }
        input[type="range"], #time-year { width: 100%; box-sizing: border-box; }
        .controls { display: flex; align-items: center; gap: 0.5rem; }
        .controls select { flex: 1; min-width: 0; width: auto; }
        .hint {
            margin-top: 0.75rem;
            font-size: 0.8125rem;
            color: var(--color-text-secondary, #5a6773);
        }
        :host([disabled-controls]) .row,
        .disabled { color: var(--color-text-muted, #6b7681); }
    `
		];
	}
	onMapAttached() {
		let e = this.adapter?.store.getState();
		this.readTime(e?.mapTime, e?.mapTimePlay);
	}
	onStateChanged(e) {
		this.readTime(e.mapTime, e.mapTimePlay);
	}
	readTime(e, t) {
		this.mapTime = e ?? { mode: "live" }, this.mapTime.mode === "pinned" ? this.stopLiveTicking() : this.startLiveTicking(), this.readPlay(this.mapTime.mode === "pinned" ? t ?? null : null);
	}
	readPlay(e) {
		e !== this.playSpeedMs && (this.playSpeedMs = e, this.stopPlaying(), !(e === null || e <= 0) && (this.speedIndex = j(e), this.startPlaying(e)));
	}
	connectedCallback() {
		super.connectedCallback(), this.origin = Date.now(), this.anchorYear = (/* @__PURE__ */ new Date()).getUTCFullYear(), a(this.mapTime) && this.startLiveTicking();
	}
	disconnectedCallback() {
		this.stopLiveTicking(), this.stopPlaying(), this.stepper.stop(), this.playSpeedMs = null, super.disconnectedCallback();
	}
	startLiveTicking() {
		this.liveTimer !== null || typeof setInterval != "function" || (this.liveTimer = setInterval(() => {
			this.liveTick = Date.now();
		}, 1e3));
	}
	stopLiveTicking() {
		this.liveTimer !== null && clearInterval(this.liveTimer), this.liveTimer = null;
	}
	get shownAt() {
		return this.mapTime.mode === "pinned" ? this.mapTime.at : this.liveTick;
	}
	setMapTime(e) {
		this.adapter?.store.dispatch({ mapTime: e }, "UI");
	}
	toggleNow(e) {
		if (this.setPlaySpeed(null), e) {
			this.setMapTime({ mode: "live" });
			return;
		}
		this.origin = Date.now(), this.setMapTime({
			mode: "pinned",
			at: Date.now()
		});
	}
	pinTo(e) {
		this.setMapTime({
			mode: "pinned",
			at: e
		});
	}
	setYear(e) {
		let t = T(this.shownAt, e - new Date(this.shownAt).getUTCFullYear());
		this.origin = t, this.pinTo(t);
	}
	togglePlay() {
		this.setPlaySpeed(this.playing ? null : k[this.speedIndex].perSecond);
	}
	setPlaySpeed(e) {
		this.adapter?.store.dispatch({ mapTimePlay: e }, "UI");
	}
	startPlaying(e) {
		if (this.mapTime.mode !== "pinned") return;
		let t = A(e);
		this.playing = !0, this.playLastFrame = Date.now(), t.discrete ? this.startDiscretePlay(t) : this.startSmoothPlay(t);
	}
	startDiscretePlay(e) {
		typeof setInterval == "function" && (this.playTimer = setInterval(() => this.advance(e.perSecond), O));
	}
	startSmoothPlay(e) {
		if (typeof requestAnimationFrame != "function") {
			this.startDiscretePlay(e);
			return;
		}
		let t = () => {
			if (!this.playing) return;
			let n = Date.now(), r = n - this.playLastFrame;
			this.playLastFrame = n, this.advance(r / 1e3 * e.perSecond) && (this.playFrame = requestAnimationFrame(t));
		};
		this.playFrame = requestAnimationFrame(t);
	}
	advance(e) {
		if (this.mapTime.mode !== "pinned") return this.setPlaySpeed(null), !1;
		let t = this.mapTime.at + e;
		for (; b(this.origin, t) > E;) t = T(t, -1);
		for (; b(this.origin, t) < -183;) t = T(t, 1);
		return this.pinTo(t), !0;
	}
	stopPlaying() {
		this.playing = !1, this.playTimer !== null && clearInterval(this.playTimer), this.playTimer = null, this.playFrame !== null && typeof cancelAnimationFrame == "function" && cancelAnimationFrame(this.playFrame), this.playFrame = null;
	}
	nudge(e) {
		this.playing && this.setPlaySpeed(null), this.advance(e * k[this.speedIndex].perSecond);
	}
	renderStep(e, t, n) {
		return p({
			icon: t,
			label: `${k[this.speedIndex].label} ${n}`,
			disabled: a(this.mapTime),
			step: () => this.nudge(e),
			repeater: this.stepper
		});
	}
	setSpeed(e) {
		this.speedIndex = e, this.playing && this.setPlaySpeed(k[e].perSecond);
	}
	render() {
		let e = a(this.mapTime), t = this.shownAt, n = b(this.origin, t), i = x(t), o = new Date(t).toLocaleString(void 0, {
			dateStyle: "medium",
			timeStyle: "short"
		}), s = new Date(t).getUTCFullYear(), c = [], l = Math.min(this.anchorYear - D, s), u = Math.max(this.anchorYear + D, s);
		for (let e = l; e <= u; e++) c.push(e);
		return r`
            <div class="now">
                <sl-switch size="small" id="time-now" .checked=${e}
                    @sl-change=${(e) => this.toggleNow(e.target.checked)}>Now</sl-switch>
            </div>

            <div class="moment">
                ${C(t)} ${w(i)} UTC
                <span class="local">${o} local</span>
            </div>

            <div class="row ${e ? "disabled" : ""}">
                <sl-select id="time-year" size="small" hoist label="Year" ?disabled=${e} .value=${String(s)}
                    @sl-change=${(e) => this.setYear(Number(e.target.value))}>
                    ${c.map((e) => r`
                        <sl-option value=${String(e)}>${e}</sl-option>`)}
                </sl-select>
            </div>

            <div class="row ${e ? "disabled" : ""}">
                <label for="time-date">
                    <span class="field-label">Date</span>
                    <span class="value">${C(t)}</span>
                </label>
                <input type="range" id="time-date"
                    min=${-183} max=${E} step="1"
                    .value=${String(n)} ?disabled=${e}
                    @input=${(e) => this.pinTo(S(this.origin, Number(e.target.value), i))}>
            </div>

            <div class="row ${e ? "disabled" : ""}">
                <label for="time-minute">
                    <span class="field-label">Time of day (UTC)</span>
                    <span class="value">${w(i)}</span>
                </label>
                <input type="range" id="time-minute"
                    min="0" max=${g - 1} step="1"
                    .value=${String(i)} ?disabled=${e}
                    @input=${(e) => this.pinTo(S(this.origin, n, Number(e.target.value)))}>
            </div>

            <sl-select class="speed" size="small" hoist label="Speed" ?disabled=${e}
                .value=${String(this.speedIndex)}
                @sl-change=${(e) => this.setSpeed(Number(e.target.value))}>
                ${k.map((e, t) => r`
                    <sl-option value=${String(t)}>${e.label} per second</sl-option>`)}
            </sl-select>

            <!-- Step, play, step: the transport row of a media player. -->
            <div class="controls">
                ${this.renderStep(-1, m, "earlier")}
                <sl-button size="small" class="play icon-only" ?disabled=${e}
                    title=${this.playing ? "Pause" : "Play"}
                    @click=${() => this.togglePlay()}>
                    ${this.playing ? h : f}<span class="visually-hidden">${this.playing ? "Pause" : "Play"}</span>
                </sl-button>
                ${this.renderStep(1, d, "later")}
            </div>

            <div class="hint">
                ${e ? "The map runs with the clock. Switch Now off to choose a moment." : "Frozen. Switch Now on to run with the clock again."}
            </div>
        `;
	}
};
i([t()], M.prototype, "mapTime", void 0), i([t()], M.prototype, "origin", void 0), i([t()], M.prototype, "anchorYear", void 0), i([t()], M.prototype, "liveTick", void 0), i([t()], M.prototype, "speedIndex", void 0), i([t()], M.prototype, "playing", void 0), M = i([n("webmapx-time-slider-tool")], M);
//#endregion
export { M as WebmapxTimeSliderTool };
