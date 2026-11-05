import { h as e, i as t, o as n, p as r } from "./decorators-d8E4nZJy.js";
import { t as i } from "./decorate-CmPZ6p_g.js";
import { t as a } from "./map-clock-BmIiPfc8.js";
import { t as o } from "./webmapx-base-tool-BcMVyF7m.js";
import "./button-BmvunzcI.js";
import { t as s } from "./control-surface-styles-zbl1JfZH.js";
import "./switch-caSfmU2w.js";
import { t as c } from "./accent-control-styles-0YoGl5gm.js";
import { t as l } from "./form-label-styles-D-b4atN_.js";
import { t as u } from "./help-text-styles-BFw9dhCq.js";
import "./option-REOFPMrE.js";
import { a as d, i as f, n as p, o as m, r as h, t as g } from "./step-button-Do_gC3Rl.js";
//#region src/utils/time-slider-math.ts
var _ = 1440, v = 6e4, y = 1440 * v;
function b(e) {
	return Math.floor(e / y) * y;
}
function x(e, t) {
	return Math.round((b(t) - b(e)) / y);
}
function S(e) {
	return Math.floor((e - b(e)) / v);
}
function C(e, t, n) {
	return b(e) + t * y + n * v;
}
function w(e) {
	return new Date(e).toISOString().slice(0, 10);
}
function T(e) {
	let t = (e % _ + _) % _;
	return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
function E(e, t) {
	let n = new Date(e);
	return n.setUTCFullYear(n.getUTCFullYear() + t), n.getTime();
}
//#endregion
//#region src/components/webmapx-time-slider-tool.ts
var D = 183, O = 10, k = 1e3, A = [
	{
		label: "1 minute",
		perSecond: v
	},
	{
		label: "10 minutes",
		perSecond: 10 * v
	},
	{
		label: "1 hour",
		perSecond: 60 * v
	},
	{
		label: "1 day",
		perSecond: _ * v,
		discrete: !0
	}
];
function j(e) {
	return A.find((t) => t.perSecond === e) || {
		label: `${e} ms`,
		perSecond: e,
		discrete: e >= A[3].perSecond
	};
}
function M(e) {
	let t = 0;
	for (let n = 1; n < A.length; n++) Math.abs(A[n].perSecond - e) < Math.abs(A[t].perSecond - e) && (t = n);
	return t;
}
var N = class extends o {
	constructor(...e) {
		super(...e), this.mapTime = { mode: "live" }, this.origin = Date.now(), this.anchorYear = (/* @__PURE__ */ new Date()).getUTCFullYear(), this.liveTick = Date.now(), this.speedIndex = 2, this.playing = !1, this.playSpeedMs = null, this.liveTimer = null, this.stepper = new d(), this.playTimer = null, this.playFrame = null, this.playLastFrame = 0;
	}
	get toolTip() {
		return a(this.mapTime) ? "The map runs with the clock. Switch Now off to choose a moment." : "The map shows the moment you chose. Switch Now on to follow the clock again.";
	}
	static {
		this.styles = [
			c,
			l,
			u,
			s,
			e`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; }
        .now {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: var(--webmapx-space-md, 0.75rem);
        }
        .moment {
            font-variant-numeric: tabular-nums;
            margin-bottom: var(--webmapx-space-md, 0.75rem);
        }
        .moment .local {
            display: block;
            font-weight: 400;
            color: var(--color-text-secondary, #5a6773);
        }
        .row { margin-bottom: var(--webmapx-space-md, 0.75rem); }
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
		e !== this.playSpeedMs && (this.playSpeedMs = e, this.stopPlaying(), !(e === null || e <= 0) && (this.speedIndex = M(e), this.startPlaying(e)));
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
		let t = E(this.shownAt, e - new Date(this.shownAt).getUTCFullYear());
		this.origin = t, this.pinTo(t);
	}
	togglePlay() {
		this.setPlaySpeed(this.playing ? null : A[this.speedIndex].perSecond);
	}
	setPlaySpeed(e) {
		this.adapter?.store.dispatch({ mapTimePlay: e }, "UI");
	}
	startPlaying(e) {
		if (this.mapTime.mode !== "pinned") return;
		let t = j(e);
		this.playing = !0, this.playLastFrame = Date.now(), t.discrete ? this.startDiscretePlay(t) : this.startSmoothPlay(t);
	}
	startDiscretePlay(e) {
		typeof setInterval == "function" && (this.playTimer = setInterval(() => this.advance(e.perSecond), k));
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
		for (; x(this.origin, t) > D;) t = E(t, -1);
		for (; x(this.origin, t) < -183;) t = E(t, 1);
		return this.pinTo(t), !0;
	}
	stopPlaying() {
		this.playing = !1, this.playTimer !== null && clearInterval(this.playTimer), this.playTimer = null, this.playFrame !== null && typeof cancelAnimationFrame == "function" && cancelAnimationFrame(this.playFrame), this.playFrame = null;
	}
	nudge(e) {
		this.playing && this.setPlaySpeed(null), this.advance(e * A[this.speedIndex].perSecond);
	}
	renderStep(e, t, n) {
		return m({
			icon: t,
			label: `${A[this.speedIndex].label} ${n}`,
			disabled: a(this.mapTime),
			step: () => this.nudge(e),
			repeater: this.stepper
		});
	}
	setSpeed(e) {
		this.speedIndex = e, this.playing && this.setPlaySpeed(A[e].perSecond);
	}
	render() {
		let e = a(this.mapTime), t = this.shownAt, n = x(this.origin, t), i = S(t), o = new Date(t).toLocaleString(void 0, {
			dateStyle: "medium",
			timeStyle: "short"
		}), s = new Date(t).getUTCFullYear(), c = [], l = Math.min(this.anchorYear - O, s), u = Math.max(this.anchorYear + O, s);
		for (let e = l; e <= u; e++) c.push(e);
		return r`
            <div class="now">
                <sl-switch size="small" id="time-now" .checked=${e}
                    @sl-change=${(e) => this.toggleNow(e.target.checked)}>Now</sl-switch>
            </div>

            <div class="moment">
                ${w(t)} ${T(i)} UTC
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
                    <span class="value">${w(t)}</span>
                </label>
                <input type="range" id="time-date"
                    min=${-183} max=${D} step="1"
                    .value=${String(n)} ?disabled=${e}
                    @input=${(e) => this.pinTo(C(this.origin, Number(e.target.value), i))}>
            </div>

            <div class="row ${e ? "disabled" : ""}">
                <label for="time-minute">
                    <span class="field-label">Time of day (UTC)</span>
                    <span class="value">${T(i)}</span>
                </label>
                <input type="range" id="time-minute"
                    min="0" max=${_ - 1} step="1"
                    .value=${String(i)} ?disabled=${e}
                    @input=${(e) => this.pinTo(C(this.origin, n, Number(e.target.value)))}>
            </div>

            <sl-select class="speed" size="small" hoist label="Speed" ?disabled=${e}
                .value=${String(this.speedIndex)}
                @sl-change=${(e) => this.setSpeed(Number(e.target.value))}>
                ${A.map((e, t) => r`
                    <sl-option value=${String(t)}>${e.label} per second</sl-option>`)}
            </sl-select>

            <!-- Step, play, step: the transport row of a media player. -->
            <div class="controls">
                ${this.renderStep(-1, h, "earlier")}
                <sl-button size="small" class="play icon-only" ?disabled=${e}
                    title=${this.playing ? "Pause" : "Play"}
                    @click=${() => this.togglePlay()}>
                    ${this.playing ? g : p}<span class="visually-hidden">${this.playing ? "Pause" : "Play"}</span>
                </sl-button>
                ${this.renderStep(1, f, "later")}
            </div>

        `;
	}
};
i([t()], N.prototype, "mapTime", void 0), i([t()], N.prototype, "origin", void 0), i([t()], N.prototype, "anchorYear", void 0), i([t()], N.prototype, "liveTick", void 0), i([t()], N.prototype, "speedIndex", void 0), i([t()], N.prototype, "playing", void 0), N = i([n("webmapx-time-slider-tool")], N);
//#endregion
export { N as WebmapxTimeSliderTool };
