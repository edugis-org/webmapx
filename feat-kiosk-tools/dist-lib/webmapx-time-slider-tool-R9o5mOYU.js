import { h as e, i as t, o as n, p as r } from "./decorators-d8E4nZJy.js";
import { t as i } from "./decorate-Bl-DXcQA.js";
import { t as a } from "./map-clock-BmIiPfc8.js";
import { t as o } from "./webmapx-base-tool-U6KxfRFV.js";
import "./button-DE9ytwxI.js";
import { t as s } from "./control-surface-styles-zbl1JfZH.js";
import "./switch-caSfmU2w.js";
import { t as c } from "./form-label-styles-CiXgi-FX.js";
import "./option-C8qYanYH.js";
import { a as l, i as u, n as d, o as f, r as p, t as m } from "./step-button-CJ6XMsCH.js";
//#region src/utils/time-slider-math.ts
var h = 1440, g = 6e4, _ = 1440 * g;
function v(e) {
	return Math.floor(e / _) * _;
}
function y(e, t) {
	return Math.round((v(t) - v(e)) / _);
}
function b(e) {
	return Math.floor((e - v(e)) / g);
}
function x(e, t, n) {
	return v(e) + t * _ + n * g;
}
function S(e) {
	return new Date(e).toISOString().slice(0, 10);
}
function C(e) {
	let t = (e % h + h) % h;
	return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
function w(e, t) {
	let n = new Date(e);
	return n.setUTCFullYear(n.getUTCFullYear() + t), n.getTime();
}
//#endregion
//#region src/components/webmapx-time-slider-tool.ts
var T = 183, E = 10, D = 1e3, O = [
	{
		label: "1 minute",
		perSecond: g
	},
	{
		label: "10 minutes",
		perSecond: 10 * g
	},
	{
		label: "1 hour",
		perSecond: 60 * g
	},
	{
		label: "1 day",
		perSecond: h * g,
		discrete: !0
	}
];
function k(e) {
	return O.find((t) => t.perSecond === e) || {
		label: `${e} ms`,
		perSecond: e,
		discrete: e >= O[3].perSecond
	};
}
function A(e) {
	let t = 0;
	for (let n = 1; n < O.length; n++) Math.abs(O[n].perSecond - e) < Math.abs(O[t].perSecond - e) && (t = n);
	return t;
}
var j = class extends o {
	constructor(...e) {
		super(...e), this.mapTime = { mode: "live" }, this.origin = Date.now(), this.anchorYear = (/* @__PURE__ */ new Date()).getUTCFullYear(), this.liveTick = Date.now(), this.speedIndex = 2, this.playing = !1, this.playSpeedMs = null, this.liveTimer = null, this.stepper = new l(), this.playTimer = null, this.playFrame = null, this.playLastFrame = 0;
	}
	static {
		this.styles = [
			c,
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
		e !== this.playSpeedMs && (this.playSpeedMs = e, this.stopPlaying(), !(e === null || e <= 0) && (this.speedIndex = A(e), this.startPlaying(e)));
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
		let t = w(this.shownAt, e - new Date(this.shownAt).getUTCFullYear());
		this.origin = t, this.pinTo(t);
	}
	togglePlay() {
		this.setPlaySpeed(this.playing ? null : O[this.speedIndex].perSecond);
	}
	setPlaySpeed(e) {
		this.adapter?.store.dispatch({ mapTimePlay: e }, "UI");
	}
	startPlaying(e) {
		if (this.mapTime.mode !== "pinned") return;
		let t = k(e);
		this.playing = !0, this.playLastFrame = Date.now(), t.discrete ? this.startDiscretePlay(t) : this.startSmoothPlay(t);
	}
	startDiscretePlay(e) {
		typeof setInterval == "function" && (this.playTimer = setInterval(() => this.advance(e.perSecond), D));
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
		for (; y(this.origin, t) > T;) t = w(t, -1);
		for (; y(this.origin, t) < -183;) t = w(t, 1);
		return this.pinTo(t), !0;
	}
	stopPlaying() {
		this.playing = !1, this.playTimer !== null && clearInterval(this.playTimer), this.playTimer = null, this.playFrame !== null && typeof cancelAnimationFrame == "function" && cancelAnimationFrame(this.playFrame), this.playFrame = null;
	}
	nudge(e) {
		this.playing && this.setPlaySpeed(null), this.advance(e * O[this.speedIndex].perSecond);
	}
	renderStep(e, t, n) {
		return f({
			icon: t,
			label: `${O[this.speedIndex].label} ${n}`,
			disabled: a(this.mapTime),
			step: () => this.nudge(e),
			repeater: this.stepper
		});
	}
	setSpeed(e) {
		this.speedIndex = e, this.playing && this.setPlaySpeed(O[e].perSecond);
	}
	render() {
		let e = a(this.mapTime), t = this.shownAt, n = y(this.origin, t), i = b(t), o = new Date(t).toLocaleString(void 0, {
			dateStyle: "medium",
			timeStyle: "short"
		}), s = new Date(t).getUTCFullYear(), c = [], l = Math.min(this.anchorYear - E, s), f = Math.max(this.anchorYear + E, s);
		for (let e = l; e <= f; e++) c.push(e);
		return r`
            <div class="now">
                <sl-switch size="small" id="time-now" .checked=${e}
                    @sl-change=${(e) => this.toggleNow(e.target.checked)}>Now</sl-switch>
            </div>

            <div class="moment">
                ${S(t)} ${C(i)} UTC
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
                    <span class="value">${S(t)}</span>
                </label>
                <input type="range" id="time-date"
                    min=${-183} max=${T} step="1"
                    .value=${String(n)} ?disabled=${e}
                    @input=${(e) => this.pinTo(x(this.origin, Number(e.target.value), i))}>
            </div>

            <div class="row ${e ? "disabled" : ""}">
                <label for="time-minute">
                    <span class="field-label">Time of day (UTC)</span>
                    <span class="value">${C(i)}</span>
                </label>
                <input type="range" id="time-minute"
                    min="0" max=${h - 1} step="1"
                    .value=${String(i)} ?disabled=${e}
                    @input=${(e) => this.pinTo(x(this.origin, n, Number(e.target.value)))}>
            </div>

            <sl-select class="speed" size="small" hoist label="Speed" ?disabled=${e}
                .value=${String(this.speedIndex)}
                @sl-change=${(e) => this.setSpeed(Number(e.target.value))}>
                ${O.map((e, t) => r`
                    <sl-option value=${String(t)}>${e.label} per second</sl-option>`)}
            </sl-select>

            <!-- Step, play, step: the transport row of a media player. -->
            <div class="controls">
                ${this.renderStep(-1, p, "earlier")}
                <sl-button size="small" class="play icon-only" ?disabled=${e}
                    title=${this.playing ? "Pause" : "Play"}
                    @click=${() => this.togglePlay()}>
                    ${this.playing ? m : d}<span class="visually-hidden">${this.playing ? "Pause" : "Play"}</span>
                </sl-button>
                ${this.renderStep(1, u, "later")}
            </div>

            <div class="hint">
                ${e ? "The map runs with the clock. Switch Now off to choose a moment." : "Frozen. Switch Now on to run with the clock again."}
            </div>
        `;
	}
};
i([t()], j.prototype, "mapTime", void 0), i([t()], j.prototype, "origin", void 0), i([t()], j.prototype, "anchorYear", void 0), i([t()], j.prototype, "liveTick", void 0), i([t()], j.prototype, "speedIndex", void 0), i([t()], j.prototype, "playing", void 0), j = i([n("webmapx-time-slider-tool")], j);
//#endregion
export { j as WebmapxTimeSliderTool };
