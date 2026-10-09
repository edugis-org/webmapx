import { a as e, c as t, h as n, i as r, o as i, p as a } from "./decorators-d8E4nZJy.js";
import { t as o } from "./decorate-Bl-DXcQA.js";
import { p as s } from "./map-clock-BmIiPfc8.js";
import { t as c } from "./webmapx-modal-tool-CvWzMu9K.js";
import "./button-DE9ytwxI.js";
import { t as l } from "./control-surface-styles-zbl1JfZH.js";
import "./switch-caSfmU2w.js";
import { t as u } from "./form-label-styles-CiXgi-FX.js";
import "./option-C8qYanYH.js";
import { a as d, i as f, n as p, o as m, r as h, t as g } from "./step-button-CJ6XMsCH.js";
//#region src/components/webmapx-deeptime-tool.ts
var _ = "data/paleo/merdith2021";
function v(e, t, n) {
	return `${e}: <a href="${n}" target="_blank" rel="noopener">${t}</a>, via <a href="https://gwsdoc.gplates.org/" target="_blank" rel="noopener">GPlates Web Service</a> (CC BY 4.0)`;
}
var y = {
	authors: "Merdith et al. 2021",
	doi: "https://doi.org/10.1016/j.earscirev.2020.103477"
}, b = {
	authors: "Müller et al. 2019",
	doi: "https://doi.org/10.1029/2018TC005462"
}, x = v("Coastlines", y.authors, y.doi), S = v("Coastlines", b.authors, b.doi), C = v("Plate boundaries and deforming networks", b.authors, b.doi), w = {
	attribution: x,
	abstract: "Present-day coastlines carried back to the chosen age on the plates they ride, using the Merdith et al. (2021) rotation model (1000–0 Ma). The shapes are today’s outlines rotated as rigid blocks: crust that has since been shortened or stretched is not shown, so continents meet later here than the rocks say. Longitude in deep time is far less certain than latitude."
};
function T(e) {
	let t = /[?&]data=([^&]*)/.exec(e);
	return t ? decodeURIComponent(t[1]) : null;
}
var E = [{
	id: "merdith2021",
	label: "Merdith 2021 — 1000 Ma",
	data: "data/paleo/merdith2021",
	to: 1e3,
	attribution: x,
	abstract: "Present-day coastlines carried back to the chosen age on the plates they ride, using the Merdith et al. (2021) rotation model, which reaches 1000 Ma. The shapes are today’s outlines rotated as rigid blocks: crust that has since been shortened or stretched is not shown, so continents meet later here than the rocks say. Latitude is well constrained by palaeomagnetism; longitude in deep time is far less certain."
}, {
	id: "muller2019",
	label: "Müller 2019 — 250 Ma",
	data: "data/paleo/muller2019",
	to: 250,
	plates: "data/paleo/muller2019/plates",
	attribution: S,
	abstract: "Present-day coastlines rotated to the chosen age using the Müller et al. (2019) model, which reaches 250 Ma and carries deforming plate boundaries. As with any rigid rotation, crust that has since been shortened is missing from the outlines — the deforming zones layer is where that crust is shown.",
	platesAttribution: C,
	platesAbstract: "Plate boundaries sampled every 5 Ma, with the deforming networks drawn separately. A boundary has no continuity through time — boundaries are born, die and change in number — so these are snapshots that snap to the nearest step rather than moving smoothly like the coastlines. The deforming zones are continental crust being squeezed: the Greater India mesh is the ~3 million km² now folded into Tibet and the Himalaya, which is why the collision begins here some 45 Ma earlier than reconstructed coastlines suggest."
}], D = "deeptime-coastlines", O = "deeptime-plates-source", k = "deeptime-plate-boundaries", A = "deeptime-deforming", j = "deeptime-coastlines-source", M = [
	{
		label: "5 Ma",
		perSecond: 5
	},
	{
		label: "10 Ma",
		perSecond: 10
	},
	{
		label: "25 Ma",
		perSecond: 25
	},
	{
		label: "50 Ma",
		perSecond: 50
	}
], N = [
	["Africa", "#c98a3f"],
	["Asia", "#c2596f"],
	["Europe", "#7a9e5c"],
	["North America", "#4f86a8"],
	["South America", "#b5674c"],
	["Oceania", "#a87bb0"],
	["Antarctica", "#8fa3ad"]
], P = "#96907f", F = [
	{
		name: "Quaternary",
		from: 2.6
	},
	{
		name: "Neogene",
		from: 23
	},
	{
		name: "Paleogene",
		from: 66
	},
	{
		name: "Cretaceous",
		from: 145
	},
	{
		name: "Jurassic",
		from: 201
	},
	{
		name: "Triassic",
		from: 252
	},
	{
		name: "Permian",
		from: 299
	},
	{
		name: "Carboniferous",
		from: 359
	},
	{
		name: "Devonian",
		from: 419
	},
	{
		name: "Silurian",
		from: 444
	},
	{
		name: "Ordovician",
		from: 485
	},
	{
		name: "Cambrian",
		from: 539
	},
	{
		name: "Precambrian",
		from: Infinity
	}
];
function I(e) {
	for (let t of F) if (e < t.from) return t.name;
	return "Precambrian";
}
var L = "deeptime-periods.json", R = 132;
function z(e, t) {
	if (!e) return null;
	for (let n of e.periods) if (!(n.fromMa === 0 && n.toMa === 0) && t <= n.fromMa && t > n.toMa) return n;
	return e.periods.find((e) => e.fromMa === 0 && e.toMa === 0) ?? e.periods[e.periods.length - 1] ?? null;
}
var B = class extends c {
	constructor(...e) {
		super(...e), this.toolId = "deeptime", this.restoredModelId = null, this.data = _, this.scenes = null, this.from = 0, this.to = 1e3, this.step = 1, this.ma = 0, this.playing = !1, this.speedIndex = 1, this.loading = !1, this.error = null, this.models = [], this.showPlates = !0, this.chosenModelId = null, this.configuredData = null, this.periodScenes = null, this.spriteUrl = null, this.scenesRequested = null, this.frame = null, this.lastFrameAt = 0, this.wanted = !1, this.started = !1, this.stepper = new d();
	}
	get permalinkKey() {
		return "deeptime";
	}
	static {
		this.styles = [
			u,
			l,
			n`
        :host { display: block; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; }
        .age { font-size: 1.5rem; font-weight: 600; line-height: 1.1; }
        .period { color: var(--color-text-muted, #666); margin-bottom: 0.75rem; }
        input[type="range"] { width: 100%; }
        .controls { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
        .models { margin-top: 0.5rem; font-size: 0.8125rem; color: var(--color-text-secondary, #5a6773); }
        .models label { display: flex; align-items: center; gap: 0.4rem; }
        .legend { display: flex; flex-wrap: wrap; gap: 0.25rem 0.75rem; margin-top: 0.75rem; }
        .legend span { display: inline-flex; align-items: center; gap: 0.35rem; }
        .legend i { width: 0.75rem; height: 0.75rem; border-radius: 2px; display: inline-block; }
        .status { color: var(--color-text-muted, #666); margin-top: 0.5rem; }
        .error { color: var(--color-danger, #b3261e); margin-top: 0.5rem; }
    
        /* The scene sits between the period name and the slider; it is an
           illustration, so it never grows the panel — the image keeps its own
           proportions and the caption wraps under it. */
        .scene {
            margin: 6px 0 2px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }
        .scene-image {
            border-radius: 4px;
            background-repeat: no-repeat;
            max-width: 100%;
        }
        .scene figcaption {
            font-size: 12px;
            line-height: 1.3;
            text-align: center;
            color: var(--color-text-secondary, #5a6773);
        }
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
	async loadScenes() {
		let e = this.scenes;
		if (!e || this.scenesRequested === e) return;
		this.scenesRequested = e;
		let t = this.resolveConfigAsset(e.endsWith("/") ? e : `${e}/`);
		try {
			let e = await fetch(new URL(L, t).toString());
			if (!e.ok) return;
			let n = await e.json();
			if (!Array.isArray(n?.periods) || typeof n.sprite != "string") return;
			this.spriteUrl = new URL(n.sprite, new URL(L, t)).toString(), this.periodScenes = n;
		} catch {}
	}
	readConfig() {
		let e = this.toolsConfig, t = e?.[this.instanceId] ?? e?.[this.toolId];
		if (!this.hasAttribute("data")) {
			let e = typeof t?.data == "string" ? t.data : this.resolveConfigAsset(_);
			this.configuredData ??= e, this.chosenModelId || (this.data = e);
		}
		!this.hasAttribute("scenes") && typeof t?.scenes == "string" && (this.scenes = t.scenes);
		let n = Array.isArray(t?.models) ? t.models : E.map((e) => ({
			...e,
			data: this.resolveConfigAsset(String(e.data))
		}));
		if (this.models.length === 0) {
			this.models = n.filter((e) => typeof e?.data == "string" && typeof e?.id == "string").map((e) => ({
				id: String(e.id),
				label: String(e.label ?? e.id),
				data: String(e.data),
				to: Number.isFinite(Number(e.to)) ? Number(e.to) : this.to,
				...typeof e.plates == "string" ? { plates: this.resolveConfigAsset(e.plates) } : {},
				...Object.fromEntries([
					"attribution",
					"abstract",
					"platesAttribution",
					"platesAbstract"
				].filter((t) => typeof e[t] == "string").map((t) => [t, String(e[t])]))
			}));
			let e = this.models.find((e) => e.data === this.data) ?? (typeof t?.data == "string" ? void 0 : this.models[0]);
			e && !this.hasAttribute("data") && !this.chosenModelId && (this.data = e.data, this.to = e.to);
		}
		this.loadScenes(), t && (!this.hasAttribute("from") && Number.isFinite(Number(t.from)) && (this.from = Number(t.from)), !this.hasAttribute("to") && Number.isFinite(Number(t.to)) && (this.to = Number(t.to)), !this.hasAttribute("step") && Number.isFinite(Number(t.step)) && (this.step = Number(t.step)));
	}
	get currentModel() {
		return this.models.find((e) => e.data === this.data);
	}
	get credit() {
		let e = this.currentModel;
		return e ? {
			attribution: e.attribution,
			abstract: e.abstract
		} : w;
	}
	async applyPlateLayers() {
		let e = this.currentModel?.plates;
		if (!(e && this.showPlates)) {
			for (let e of [A, k]) try {
				this.mapElement?.removeInlineLayer(e);
			} catch {}
			return;
		}
		if (this.mapHasPlateLayer()) return;
		let t = `internalfunc://paleo-plates?data=${encodeURIComponent(e)}&ma={ma}`, n = this.currentModel, r = { [O]: {
			id: O,
			type: "geojson",
			data: t,
			...n?.platesAttribution ? { attribution: n.platesAttribution } : {}
		} }, i = n?.platesAbstract;
		await this.mapElement?.addLayerRequest({
			id: A,
			type: "fill",
			title: "Deforming zones",
			source: O,
			sources: r,
			filter: [
				"==",
				["get", "deforming"],
				!0
			],
			paint: {
				"fill-color": "#e63946",
				"fill-opacity": .3,
				"fill-outline-color": "#7a1420"
			},
			metadata: {
				label: "Deforming zones",
				dynamic: !0,
				ownerTool: "deeptime",
				legendRole: "overlay",
				...i ? { abstract: i } : {}
			}
		}), await this.mapElement?.addLayerRequest({
			id: k,
			type: "line",
			title: "Plate boundaries",
			source: O,
			sources: r,
			paint: {
				"line-color": "#33302b",
				"line-width": 1.1,
				"line-opacity": .85
			},
			metadata: {
				label: "Plate boundaries",
				dynamic: !0,
				ownerTool: "deeptime",
				legendRole: "overlay",
				...i ? { abstract: i } : {}
			}
		});
	}
	mapHasPlateLayer() {
		let e = this.store?.getState().mapLayers ?? {};
		for (let [t, n] of Object.entries(e)) {
			if (t === k || t === A) return !0;
			if (n?.visible === !1) continue;
			let e = n?.sourceId;
			if (!e) continue;
			let r = this.adapter?.getSourceConfig?.(e)?.internalFuncUrl;
			if (typeof r == "string" && r.includes("paleo-plates")) return !0;
		}
		return !1;
	}
	async switchModel(e) {
		let t = this.models.find((t) => t.id === e);
		if (!t || t.data === this.data) return;
		this.stopPlaying(), this.loading = !0, this.error = null;
		let n = await s(t.data);
		if (this.loading = !1, !n) {
			this.error = `Could not load ${t.label}; still showing the previous model.`;
			return;
		}
		this.chosenModelId = t.id, this.data = t.data, this.to = t.to, this.ma = Math.min(Math.max(this.ma, this.from), this.to), this.publish();
		try {
			this.mapElement?.removeInlineLayer(D);
		} catch {}
		for (let e of [A, k]) try {
			this.mapElement?.removeInlineLayer(e);
		} catch {}
		this.syncForeignLayers(), this.started = !1, await this.begin();
	}
	syncForeignLayers() {
		let e = this.store?.getState().mapLayers ?? {}, t = this.data, n = this.currentModel?.plates ?? null;
		for (let [r, i] of Object.entries(e)) {
			if (r === D || r === k || r === A) continue;
			let e = i?.sourceId;
			if (!e) continue;
			let a = this.adapter?.getSourceConfig?.(e)?.internalFuncUrl;
			if (typeof a != "string") continue;
			let o = a.includes("paleo-coastlines") ? "coastlines" : a.includes("paleo-plates") ? "plates" : null;
			if (!o) continue;
			let s = o === "coastlines" ? t : n;
			this.adapter?.setLayerVisibility(r, s !== null && T(a) === s);
		}
	}
	async begin() {
		if (this.started || !this.store || !this.mapElement) return;
		if (this.started = !0, this.readConfig(), this.restoredModelId) {
			let e = this.models.find((e) => e.id === this.restoredModelId);
			e && (this.chosenModelId = e.id, this.data = e.data, this.to = e.to), this.restoredModelId = null;
		}
		this.loading = !0, this.error = null;
		let e = await s(this.data);
		if (this.loading = !1, !e) {
			this.error = `No plate model in ${this.data}. Build one with scripts/build-paleorotations.ts.`;
			return;
		}
		this.to = Math.min(this.to, e.maxAge);
		let t = this.store.getState().deepTimeMa;
		t != null && (this.ma = t), this.ma = Math.min(Math.max(this.ma, this.from), this.to), this.publish(), this.models.length > 0 && this.syncForeignLayers(), await this.applyPlateLayers(), !this.mapHasPaleoLayer() && await this.mapElement?.addLayerRequest(this.layerConfig());
	}
	mapHasPaleoLayer() {
		let e = this.store?.getState().mapLayers ?? {};
		for (let t of Object.values(e)) {
			if (t?.visible === !1) continue;
			let e = t?.sourceId;
			if (!e) continue;
			let n = this.adapter?.getSourceConfig?.(e)?.internalFuncUrl;
			if (typeof n == "string" && n.includes("paleo-coastlines")) return !0;
		}
		return !1;
	}
	layerConfig() {
		let e = `internalfunc://paleo-coastlines?data=${encodeURIComponent(this.data)}&ma={ma}`;
		return {
			id: D,
			type: "fill",
			source: j,
			sources: { [j]: {
				id: j,
				type: "geojson",
				data: e,
				...this.credit.attribution ? { attribution: this.credit.attribution } : {}
			} },
			paint: {
				"fill-color": [
					"match",
					["get", "continent"],
					...N.flatMap(([e, t]) => [e, t]),
					P
				],
				"fill-opacity": 1,
				"fill-outline-color": "#33302b"
			},
			metadata: {
				label: "Palaeo-coastlines",
				dynamic: !0,
				ownerTool: "deeptime",
				legendRole: "overlay",
				...this.credit.abstract ? { abstract: this.credit.abstract } : {}
			}
		};
	}
	publish() {
		this.store?.dispatch({ deepTimeMa: this.ma }, "UI"), this.publishPermalinkState();
	}
	publishPermalinkState() {
		let e = this.store?.getState().mapLayers ?? {}, t = this.models.length > 0 ? this.currentModel?.id : void 0;
		this.publishToolState({
			ma: this.ma,
			...t ? { m: t } : {},
			...this.showPlates ? {} : { p: 0 },
			...D in e || !this.mapHasPaleoLayer() ? { c: 1 } : {}
		});
	}
	applyToolState(e) {
		let t = Number(e.ma);
		Number.isFinite(t) && (this.ma = t, this.store?.dispatch({ deepTimeMa: t }, "INIT")), typeof e.m == "string" && (this.restoredModelId = e.m), e.p === 0 && (this.showPlates = !1), e.c === 1 && this.begin();
	}
	nudge(e) {
		this.playing && this.togglePlay(), this.setAge(this.ma + e * this.step);
	}
	setAge(e) {
		let t = Math.min(Math.max(e, this.from), this.to);
		t !== this.ma && (this.ma = t, this.publish());
	}
	togglePlay() {
		if (this.playing) return this.stopPlaying();
		this.ma <= this.from && this.setAge(this.to), this.playing = !0, this.lastFrameAt = performance.now();
		let e = (t) => {
			if (!this.playing) return;
			let n = (t - this.lastFrameAt) / 1e3;
			this.lastFrameAt = t;
			let r = this.ma - n * M[this.speedIndex].perSecond;
			this.setAge(r < this.from ? this.to : r), this.frame = requestAnimationFrame(e);
		};
		this.frame = requestAnimationFrame(e);
	}
	stopPlaying() {
		this.playing = !1, this.frame !== null && cancelAnimationFrame(this.frame), this.frame = null;
	}
	renderScene(e) {
		if (!e || !this.spriteUrl || !this.periodScenes) return t;
		let n = R / e.sprite.h;
		return a`
            <figure class="scene">
                <div class="scene-image" role="img" style=${[
			`width:${Math.round(e.sprite.w * n)}px`,
			`height:${R}px`,
			`background-image:url("${this.spriteUrl}")`,
			`background-size:${Math.round(this.periodScenes.spriteWidth * n)}px ${Math.round(this.periodScenes.spriteHeight * n)}px`,
			`background-position:-${Math.round(e.sprite.x * n)}px -${Math.round(e.sprite.y * n)}px`
		].join(";")}
                     aria-label=${`${e.name}: ${e.caption}`}></div>
                <figcaption>${e.caption}</figcaption>
            </figure>
        `;
	}
	renderStep(e, t, n) {
		return m({
			icon: t,
			label: `${this.step} million years ${n}`,
			disabled: e === 1 ? this.ma >= this.to : this.ma <= this.from,
			step: () => this.nudge(e),
			repeater: this.stepper
		});
	}
	render() {
		let e = z(this.periodScenes, this.ma);
		return a`
            <!-- "0.0 Ma" is a true but graceless way to say "now". -->
            <div class="age">${this.ma < .05 ? "Present day" : `${this.ma.toFixed(1)} Ma ago`}</div>
            <div class="period">${e?.name ?? I(this.ma)}</div>
            ${this.renderScene(e)}

            <!-- Runs from -1000 to 0, so the thumb moves the way time does:
                 right is towards the present, and the far left is the deep past.
                 The age itself stays positive everywhere else, because "200 Ma"
                 already means 200 million years *ago* — the sign is a property
                 of this control, not of the data. -->
            <input type="range" aria-label="Millions of years before present"
                min=${-this.to} max=${-this.from} step=${this.step}
                .value=${String(-this.ma)}
                @input=${(e) => this.setAge(-Number(e.target.value))}>

            ${this.currentModel?.plates ? a`
                <div class="models">
                    <sl-switch size="small" .checked=${this.showPlates}
                        @sl-change=${(e) => {
			this.showPlates = e.target.checked, this.applyPlateLayers(), this.publishPermalinkState();
		}}>Plate boundaries</sl-switch>
                </div>` : ""}

            ${this.models.length > 1 ? a`
                <div class="models">
                    <!-- A config naming its own model directory matches no listed model,
                         and the tool deliberately does not pretend it does: the field then
                         says so rather than showing an option that is not in use. -->
                    <sl-select size="small" hoist label="Model" placeholder="Configured model"
                        .value=${this.currentModel?.id ?? ""}
                        @sl-change=${(e) => void this.switchModel(e.target.value)}>
                        ${this.models.map((e) => a`
                            <sl-option value=${e.id}>${e.label}</sl-option>`)}
                    </sl-select>
                </div>` : ""}

            <sl-select class="speed" size="small" hoist label="Speed"
                .value=${String(this.speedIndex)}
                @sl-change=${(e) => {
			this.speedIndex = Number(e.target.value);
		}}>
                ${M.map((e, t) => a`
                    <sl-option value=${String(t)}>${e.label} per second</sl-option>`)}
            </sl-select>

            <!-- Step, play, step: the transport row of a media player, and it
                 reads the same way here — back is towards the deep past, which
                 is also leftwards on the slider above. -->
            <div class="controls">
                ${this.renderStep(1, h, "earlier")}
                <sl-button size="small" class="play icon-only"
                    title=${this.playing ? "Pause" : "Play"}
                    @click=${() => this.togglePlay()}>
                    ${this.playing ? g : p}<span class="visually-hidden">${this.playing ? "Pause" : "Play"}</span>
                </sl-button>
                ${this.renderStep(-1, f, "later")}
            </div>

            ${this.loading ? a`<div class="status">Loading the plate model…</div>` : ""}
            ${this.error ? a`<div class="error">${this.error}</div>` : ""}

            <div class="legend">
                ${N.map(([e, t]) => a`
                    <span><i style="background:${t}"></i>${e}</span>`)}
            </div>
        `;
	}
};
o([e({ type: String })], B.prototype, "data", void 0), o([e({ type: String })], B.prototype, "scenes", void 0), o([e({ type: Number })], B.prototype, "from", void 0), o([e({ type: Number })], B.prototype, "to", void 0), o([e({ type: Number })], B.prototype, "step", void 0), o([r()], B.prototype, "ma", void 0), o([r()], B.prototype, "playing", void 0), o([r()], B.prototype, "speedIndex", void 0), o([r()], B.prototype, "loading", void 0), o([r()], B.prototype, "error", void 0), o([r()], B.prototype, "models", void 0), o([r()], B.prototype, "showPlates", void 0), o([r()], B.prototype, "periodScenes", void 0), o([r()], B.prototype, "spriteUrl", void 0), B = o([i("webmapx-deeptime-tool")], B);
//#endregion
export { B as WebmapxDeeptimeTool };
