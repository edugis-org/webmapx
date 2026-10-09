import { a as e, h as t, i as n, o as r, p as i } from "./decorators-d8E4nZJy.js";
import { t as a } from "./decorate-D2tFcxUg.js";
import { t as o } from "./webmapx-modal-tool-B2NMM-Q1.js";
import "./button-DE9ytwxI.js";
import { t as s } from "./control-surface-styles-zbl1JfZH.js";
import { t as c } from "./form-label-styles-CiXgi-FX.js";
import { t as l } from "./unsafe-html-AhVMIhPF.js";
import { t as u } from "./sanitize-html-CfMF_sc2.js";
import "./radio-group-DcrmsMH6.js";
import "./radio-button-a8zeRuOI.js";
import "./option-C8qYanYH.js";
import { a as d, i as f, n as p, o as m, r as h, t as g } from "./step-button-CJ6XMsCH.js";
//#region src/utils/sea-level-style.ts
var _ = "rgba(0, 0, 0, 0)";
function v(e, t) {
	let n = new Set([e, t]);
	for (let r = Math.ceil(e / 5) * 5; r <= t; r += 5) n.add(r);
	for (let r = Math.max(e, -1); r <= Math.min(t, 10); r += 1) n.add(r);
	return [...n].sort((e, t) => e - t);
}
var y = {
	sea: "Sea",
	dry: "Dry sea floor",
	today: "As today"
};
function b(e, t, n) {
	return e <= t ? "sea" : e <= n ? "dry" : "today";
}
function x(e, t) {
	return e === "sea" ? t.water : e === "dry" ? t.land : _;
}
function S(e, t) {
	return `${e}-${t}`;
}
function C(e, t, n, r, i) {
	let a = ["get", i.attribute];
	return n.map((o, s) => {
		let c = b(o, r, i.today);
		return {
			...t,
			id: S(e, o),
			type: "fill",
			filter: s === 0 ? [
				"<=",
				a,
				o
			] : [
				"all",
				[
					">",
					a,
					n[s - 1]
				],
				[
					"<=",
					a,
					o
				]
			],
			paint: {
				"fill-color": x(c, i),
				"fill-antialias": !1
			},
			metadata: { title: y[c] }
		};
	});
}
//#endregion
//#region src/utils/sea-level-curve.ts
function w(e) {
	if (!e || typeof e != "object") return null;
	let t = e, n = (Array.isArray(t.points) ? t.points : []).filter((e) => Array.isArray(e) && Number.isFinite(e[0]) && Number.isFinite(e[1])).map(([e, t]) => [e, t]).sort((e, t) => t[0] - e[0]);
	return n.length < 2 ? null : {
		name: typeof t.name == "string" ? t.name : "Sea level",
		...typeof t.attribution == "string" ? { attribution: t.attribution } : {},
		...typeof t.note == "string" ? { note: t.note } : {},
		points: n
	};
}
function T(e) {
	return {
		oldest: e.points[0][0],
		youngest: e.points[e.points.length - 1][0]
	};
}
function E(e, t) {
	let n = e.points;
	if (t >= n[0][0]) return n[0][1];
	for (let e = 1; e < n.length; e++) {
		let [r, i] = n[e];
		if (t >= r) {
			let [a, o] = n[e - 1];
			return o + (i - o) * (a - t) / (a - r);
		}
	}
	return n[n.length - 1][1];
}
//#endregion
//#region src/components/webmapx-sealevel-tool.ts
var D = [
	{
		label: "2 m",
		perSecond: 2
	},
	{
		label: "5 m",
		perSecond: 5
	},
	{
		label: "10 m",
		perSecond: 10
	},
	{
		label: "20 m",
		perSecond: 20
	}
], O = [
	{
		label: "250 yr",
		perSecond: .25
	},
	{
		label: "500 yr",
		perSecond: .5
	},
	{
		label: "1,000 yr",
		perSecond: 1
	},
	{
		label: "2,000 yr",
		perSecond: 2
	}
], k = .1, A = .5, j = [
	{
		from: 14.5,
		to: 14,
		label: "Meltwater pulse 1A: about 20 m in 500 years"
	},
	{
		from: 9.6,
		to: 9.4,
		label: "The sea passes the Bosporus sill (−28 m): the Black Sea connects"
	},
	{
		from: 8.4,
		to: 8,
		label: "Storegga tsunami; the last of Doggerland drowns"
	},
	{
		from: 11.7,
		to: 11.3,
		label: "The Holocene begins"
	},
	{
		from: 12.9,
		to: 11.7,
		label: "Younger Dryas cold spell: the rise slows"
	},
	{
		from: 14.7,
		to: 12.9,
		label: "Bølling–Allerød warm period"
	},
	{
		from: 21.5,
		to: 20.5,
		label: "Last glacial maximum: the lowest sea level, about 134 m below today"
	},
	{
		from: 26,
		to: 19,
		label: "Last glacial maximum"
	},
	{
		from: 19,
		to: 11.7,
		label: "Deglaciation"
	},
	{
		from: 6.5,
		to: 0,
		label: "Sea level close to today’s"
	}
], M = "data/sealevel/lambeck2014-approx.json", N = "../data/coastal_zones.pmtiles", P = "../data/coastal_zones_16m.geojson", F = "zones", I = "Coastal zones: <a href=\"https://github.com/edugis-org/coastal_zones\" target=\"_blank\" rel=\"noopener\">EduGIS</a>, from <a href=\"https://doi.org/10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa\" target=\"_blank\" rel=\"noopener\">GEBCO_2026 Grid</a>", L = "#aad3df", R = "#f2efe9", z = [
	{
		level: -134,
		label: "Last glacial maximum, ~21,000 years ago"
	},
	{
		level: -60,
		label: "About 11,000 years ago"
	},
	{
		level: 1,
		label: "Upper end of likely projections for 2100 (IPCC AR6)"
	},
	{
		level: 7,
		label: "Greenland ice sheet melted"
	},
	{
		level: 58,
		label: "Antarctic ice sheet melted"
	},
	{
		level: 65,
		label: "All land ice melted"
	}
], B = class extends o {
	constructor(...e) {
		super(...e), this.toolId = "sealevel", this.layer = "coastal-zones", this.attribute = "flood_level", this.min = -134, this.max = 70, this.step = 1, this.today = -1, this.water = L, this.land = R, this.levels = null, this.data = null, this.tiles = null, this.geojson = null, this.level = null, this.playing = !1, this.speedIndex = 1, this.error = null, this.mode = "level", this.curve = null, this.ageKa = null, this.timeSpeedIndex = 2, this.curveRequested = null, this.appliedRoles = /* @__PURE__ */ new Map(), this.frame = null, this.lastFrameAt = 0, this.wanted = !1, this.started = !1, this.stepper = new d(), this.hadLayer = !1;
	}
	get permalinkKey() {
		return "sealevel";
	}
	static {
		this.styles = [
			c,
			s,
			t`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; }
        .level { font-size: 1.5rem; font-weight: 600; line-height: 1.1; font-variant-numeric: tabular-nums; }
        .relative { color: var(--color-text-muted, #666); margin-bottom: 0.25rem; }
        .landmark { color: var(--color-text-secondary, #5a6773); min-height: 1.2em; margin-bottom: 0.5rem; }
        input[type="range"] { width: 100%; }
        .scale { display: flex; justify-content: space-between; color: var(--color-text-muted, #666); font-size: 0.75rem; }
        .controls { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
        .today { margin-left: auto; }
        .legend { display: flex; flex-wrap: wrap; gap: 0.25rem 0.75rem; margin-top: 0.75rem; }
        .legend span { display: inline-flex; align-items: center; gap: 0.35rem; }
        .legend i { width: 0.75rem; height: 0.75rem; border-radius: 2px; display: inline-block; border: 1px solid var(--color-border, #d5dce3); }
        .error { color: var(--color-danger, #b3261e); margin-top: 0.5rem; }
        .modes { display: block; margin-bottom: 0.5rem; }
        .credit { color: var(--color-text-muted, #666); font-size: 0.75rem; margin-top: 0.5rem; }
    `
		];
	}
	get mapElement() {
		return this.mapHost;
	}
	onActivate() {
		this.wanted = !0, this.begin();
	}
	onMapAttached(e) {
		super.onMapAttached(e), this.wanted && this.begin();
	}
	onDeactivate() {
		this.wanted = !1, this.started = !1, this.stopPlaying(), this.stepper.stop();
	}
	readConfig() {
		let e = this.toolsConfig, t = e?.[this.instanceId] ?? e?.[this.toolId];
		if (!this.hasAttribute("data") && this.data === null && (this.data = this.resolveConfigAsset(M)), t) {
			for (let e of [
				"layer",
				"attribute",
				"water",
				"land",
				"tiles",
				"geojson"
			]) !this.hasAttribute(e) && typeof t[e] == "string" && (this[e] = t[e]);
			for (let e of [
				"min",
				"max",
				"step",
				"today"
			]) !this.hasAttribute(e) && typeof t[e] == "number" && (this[e] = t[e]);
			Array.isArray(t.levels) && t.levels.every((e) => typeof e == "number") && (this.levels = [...t.levels].sort((e, t) => e - t)), !this.hasAttribute("data") && typeof t.data == "string" && (this.data = t.data);
		}
	}
	async loadCurve() {
		let e = this.data;
		if (!(!e || this.curveRequested === e)) {
			this.curveRequested = e;
			try {
				let t = await fetch(e);
				this.curve = t.ok ? w(await t.json()) : null;
			} catch {
				this.curve = null;
			}
			this.curve && this.ageKa === null && (this.ageKa = T(this.curve).oldest), !this.curve && this.mode === "time" && (this.mode = "level");
		}
	}
	get classLevels() {
		return this.levels ?? v(this.min, this.max);
	}
	get styleOptions() {
		return {
			attribute: this.attribute,
			today: this.today,
			water: this.water,
			land: this.land
		};
	}
	async begin() {
		if (!(this.started || !this.adapter || !this.mapElement)) {
			if (this.started = !0, this.readConfig(), this.error = null, this.level = this.clamp(this.level ?? this.today), this.loadCurve(), !(this.layer in (this.adapter.store.getState().mapLayers ?? {})) && !await this.mapElement.addLayerRequest(this.lentLayerConfig())) {
				this.error = "The coastal zones could not be added to the map.";
				return;
			}
			if (!await this.ensureClassSubLayers()) {
				this.error = `Layer "${this.layer}" cannot be split into sea level classes.`;
				return;
			}
			this.apply();
		}
	}
	lentLayerConfig() {
		let e = `${this.layer}-source`, t = {
			id: e,
			type: "vector",
			url: `pmtiles://${this.resolveConfigAsset((this.tiles ?? N).replace(/^pmtiles:\/\//, ""))}`,
			attribution: I
		}, n = this.adapter?.canDrawSource(t) ?? !0, r = n ? t : {
			id: e,
			type: "geojson",
			data: this.resolveConfigAsset(this.geojson ?? P),
			attribution: I
		};
		return {
			id: this.layer,
			type: "fill",
			source: e,
			...n ? { "source-layer": F } : {},
			sources: { [e]: r },
			paint: {
				"fill-color": [
					"case",
					[
						"<=",
						["get", this.attribute],
						this.today
					],
					this.water,
					"rgba(0, 0, 0, 0)"
				],
				"fill-antialias": !1
			},
			title: "Coastal zones",
			metadata: {
				title: "Coastal zones",
				ownerTool: this.permalinkKey
			}
		};
	}
	async ensureClassSubLayers() {
		let e = this.adapter, t = e?.getSubLayers(this.layer);
		if (!e || !t?.length) return !1;
		let n = this.classLevels, r = new Map(t.map((e) => [e.id, e]));
		if (this.appliedRoles.clear(), n.every((e) => r.has(S(this.layer, e)))) {
			let e = [
				"sea",
				"dry",
				"today"
			];
			for (let t of n) {
				let n = r.get(S(this.layer, t))?.paint?.["fill-color"], i = e.find((e) => x(e, this.styleOptions) === n);
				i && this.appliedRoles.set(t, i);
			}
			return !0;
		}
		let { id: i, filter: a, paint: o, layout: s, type: c, ...l } = t[0], u = this.roundedLevel();
		if (!await e.setSubLayers(this.layer, C(this.layer, l, n, u, this.styleOptions))) return !1;
		for (let e of n) this.appliedRoles.set(e, b(e, u, this.today));
		return !0;
	}
	roundedLevel() {
		return Math.round((this.level ?? this.today) / this.step) * this.step;
	}
	clamp(e) {
		return Math.min(Math.max(e, this.min), this.max);
	}
	apply() {
		if (!this.adapter || !this.started) return;
		let e = this.roundedLevel();
		this.publishToolState({
			lv: e,
			...this.mode === "time" && this.ageKa !== null ? {
				m: "time",
				a: Math.round(this.ageKa * 10) / 10
			} : {}
		});
		for (let t of this.classLevels) {
			let n = b(t, e, this.today);
			if (this.appliedRoles.get(t) === n) continue;
			let r = S(this.layer, t);
			this.adapter.updateLayerStyle(this.layer, r, { "fill-color": x(n, this.styleOptions) }) && (this.adapter.setSubLayerMetadata(this.layer, r, { title: y[n] }), this.appliedRoles.set(t, n));
		}
	}
	setLevel(e) {
		let t = this.clamp(e);
		t !== this.level && (this.level = t, this.apply());
	}
	nudge(e) {
		this.playing && this.stopPlaying(), this.setLevel(this.roundedLevel() + e * this.step);
	}
	setAge(e) {
		if (!this.curve) return;
		let { oldest: t, youngest: n } = T(this.curve);
		this.ageKa = Math.min(Math.max(e, n), t), this.setLevel(this.today + E(this.curve, this.ageKa));
	}
	nudgeAge(e) {
		this.playing && this.stopPlaying();
		let t = this.ageKa ?? (this.curve ? T(this.curve).oldest : 0);
		this.setAge(Math.round((t + e * A) / k) * k);
	}
	setMode(e) {
		e !== this.mode && (this.stopPlaying(), this.mode = e, e === "time" && this.ageKa !== null && this.setAge(this.ageKa), this.apply());
	}
	onStateChanged(e) {
		super.onStateChanged(e), this.layer in (e.mapLayers ?? {}) ? this.hadLayer = !0 : this.hadLayer && (this.hadLayer = !1, this.publishToolState(null));
	}
	applyToolState(e) {
		typeof e.lv == "number" && Number.isFinite(e.lv) && (this.level = e.lv), e.m === "time" && typeof e.a == "number" && Number.isFinite(e.a) && (this.mode = "time", this.ageKa = e.a), this.begin();
	}
	togglePlay() {
		if (this.playing) return this.stopPlaying();
		if (this.mode === "time" && this.curve) {
			let { oldest: e, youngest: t } = T(this.curve);
			(this.ageKa ?? t) <= t && this.setAge(e), this.run((n) => {
				let r = (this.ageKa ?? e) - n * O[this.timeSpeedIndex].perSecond;
				this.setAge(r < t ? e : r);
			});
			return;
		}
		(this.level ?? this.today) >= this.max && this.setLevel(this.min), this.run((e) => {
			let t = (this.level ?? this.today) + e * D[this.speedIndex].perSecond;
			this.setLevel(t > this.max ? this.min : t);
		});
	}
	run(e) {
		this.playing = !0, this.lastFrameAt = performance.now();
		let t = (n) => {
			if (!this.playing) return;
			let r = (n - this.lastFrameAt) / 1e3;
			this.lastFrameAt = n, e(r), this.frame = requestAnimationFrame(t);
		};
		this.frame = requestAnimationFrame(t);
	}
	stopPlaying() {
		this.playing = !1, this.frame !== null && cancelAnimationFrame(this.frame), this.frame = null;
	}
	renderStep(e) {
		let t = this.level ?? this.today;
		return m({
			icon: e === -1 ? h : f,
			label: `${this.step} m ${e === -1 ? "lower" : "higher"}`,
			disabled: e === -1 ? t <= this.min : t >= this.max,
			step: () => this.nudge(e),
			repeater: this.stepper
		});
	}
	renderPlay() {
		return i`
            <sl-button size="small" class="play icon-only"
                title=${this.playing ? "Pause" : "Play"}
                @click=${() => this.togglePlay()}>
                ${this.playing ? g : p}<span class="visually-hidden">${this.playing ? "Pause" : "Play"}</span>
            </sl-button>`;
	}
	renderLevelMode(e) {
		let t = e - this.today, n = z.find((t) => t.level === e);
		return i`
            <div class="level">${V(e)}</div>
            <div class="relative">
                ${t === 0 ? "Today’s sea level" : `${Math.abs(t)} m ${t > 0 ? "above" : "below"} today`}
            </div>
            <div class="landmark">${n?.label ?? ""}</div>

            <input type="range" aria-label="Sea level in metres"
                min=${this.min} max=${this.max} step=${this.step}
                .value=${String(e)}
                @input=${(e) => {
			this.playing && this.stopPlaying(), this.setLevel(Number(e.target.value));
		}}>
            <div class="scale"><span>${V(this.min)}</span><span>${V(this.max)}</span></div>

            <sl-select class="speed" size="small" hoist label="Speed"
                .value=${String(this.speedIndex)}
                @sl-change=${(e) => {
			this.speedIndex = Number(e.target.value);
		}}>
                ${D.map((e, t) => i`
                    <sl-option value=${String(t)}>${e.label} per second</sl-option>`)}
            </sl-select>

            <div class="controls">
                ${this.renderStep(-1)}
                ${this.renderPlay()}
                ${this.renderStep(1)}
                <sl-button size="small" class="today" ?disabled=${e === this.today}
                    @click=${() => {
			this.stopPlaying(), this.setLevel(this.today);
		}}>Today</sl-button>
            </div>`;
	}
	renderTimeMode(e) {
		let { oldest: t, youngest: n } = T(e), r = this.ageKa ?? t, a = j.find((e) => r <= e.from && r >= e.to);
		return i`
            <div class="level">${H(r)}</div>
            <div class="relative">Sea level ${V(Math.round(E(e, r)))}</div>
            <div class="landmark">${a?.label ?? ""}</div>

            <!-- Runs from -oldest to -youngest, so the thumb moves the way time does. -->
            <input type="range" aria-label="Thousands of years before present"
                min=${-t} max=${-n} step=${k}
                .value=${String(-r)}
                @input=${(e) => {
			this.playing && this.stopPlaying(), this.setAge(-Number(e.target.value));
		}}>
            <div class="scale"><span>${H(t)}</span><span>${H(n)}</span></div>

            <sl-select class="speed" size="small" hoist label="Speed"
                .value=${String(this.timeSpeedIndex)}
                @sl-change=${(e) => {
			this.timeSpeedIndex = Number(e.target.value);
		}}>
                ${O.map((e, t) => i`
                    <sl-option value=${String(t)}>${e.label} per second</sl-option>`)}
            </sl-select>

            <div class="controls">
                ${m({
			icon: h,
			label: `${A * 1e3} years earlier`,
			disabled: r >= t,
			step: () => this.nudgeAge(1),
			repeater: this.stepper
		})}
                ${this.renderPlay()}
                ${m({
			icon: f,
			label: `${A * 1e3} years later`,
			disabled: r <= n,
			step: () => this.nudgeAge(-1),
			repeater: this.stepper
		})}
            </div>
            ${e.attribution ? i`
                <div class="credit" title=${e.note ?? ""}>${l(u(e.attribution))}</div>` : ""}`;
	}
	render() {
		let e = this.roundedLevel(), t = this.mode === "time" ? this.curve : null;
		return i`
            ${this.curve ? i`
                <sl-radio-group class="modes label-hidden" size="small" label="Slider" .value=${this.mode}
                    @sl-change=${(e) => this.setMode(e.target.value)}>
                    <sl-radio-button value="level">Level</sl-radio-button>
                    <sl-radio-button value="time">Time</sl-radio-button>
                </sl-radio-group>` : ""}

            ${t ? this.renderTimeMode(t) : this.renderLevelMode(e)}

            ${this.error ? i`<div class="error">${this.error}</div>` : ""}

            <div class="legend">
                <span><i style="background:${this.water}"></i>Sea</span>
                ${e < this.today ? i`<span><i style="background:${this.land}"></i>Dry sea floor</span>` : ""}
            </div>
        `;
	}
};
a([e({ type: String })], B.prototype, "layer", void 0), a([e({ type: String })], B.prototype, "attribute", void 0), a([e({ type: Number })], B.prototype, "min", void 0), a([e({ type: Number })], B.prototype, "max", void 0), a([e({ type: Number })], B.prototype, "step", void 0), a([e({ type: Number })], B.prototype, "today", void 0), a([e({ type: String })], B.prototype, "water", void 0), a([e({ type: String })], B.prototype, "land", void 0), a([e({ attribute: !1 })], B.prototype, "levels", void 0), a([e({ type: String })], B.prototype, "data", void 0), a([e({ type: String })], B.prototype, "tiles", void 0), a([e({ type: String })], B.prototype, "geojson", void 0), a([n()], B.prototype, "level", void 0), a([n()], B.prototype, "playing", void 0), a([n()], B.prototype, "speedIndex", void 0), a([n()], B.prototype, "error", void 0), a([n()], B.prototype, "mode", void 0), a([n()], B.prototype, "curve", void 0), a([n()], B.prototype, "ageKa", void 0), a([n()], B.prototype, "timeSpeedIndex", void 0), B = a([r("webmapx-sealevel-tool")], B);
function V(e) {
	return `${e > 0 ? "+" : e < 0 ? "−" : ""}${Math.abs(e)} m`;
}
function H(e) {
	let t = Math.round(e * 10) * 100;
	return t === 0 ? "Today" : `${t.toLocaleString("en-US")} years ago`;
}
//#endregion
export { B as WebmapxSealevelTool };
