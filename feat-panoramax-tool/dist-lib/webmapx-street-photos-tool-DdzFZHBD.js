import { c as e, h as t, i as n, o as r, p as i } from "./decorators-d8E4nZJy.js";
import { t as a } from "./decorate-Dbo3QKbS.js";
import { t as o } from "./webmapx-base-tool-D0BchkqJ.js";
import { r as s } from "./apikeys-DFtVEG81.js";
import "./button-BmvunzcI.js";
import "./icon-Qf3FyAAL.js";
import "./icon-button-ByffBw_f.js";
import "./spinner-BnB3OpDj.js";
import { t as c } from "./accent-control-styles-0YoGl5gm.js";
import { t as l } from "./form-label-styles-D-b4atN_.js";
import { i as u } from "./data-colors-BglhXRFr.js";
import { t as d } from "./throttle-BD7udUwY.js";
import { t as f } from "./help-text-styles-BFw9dhCq.js";
import "./radio-button-CaxcttLo.js";
import { t as p } from "./announce-DxxaToE8.js";
import { t as m } from "./touch-pointer-CXtXj6Ie.js";
//#region src/utils/street-photo.ts
function h(e, t) {
	let [n, r] = e.map((e) => e * Math.PI / 180), [i, a] = t.map((e) => e * Math.PI / 180), o = Math.sin(i - n) * Math.cos(a), s = Math.cos(r) * Math.sin(a) - Math.sin(r) * Math.cos(a) * Math.cos(i - n);
	return Math.atan2(o, s) * 180 / Math.PI;
}
//#endregion
//#region src/utils/google-street-view.ts
var g = "https://maps.googleapis.com/maps/api/streetview", _ = "400x260", v = "640x400", y = 90;
function b([e, t], n, r) {
	return `${g}/metadata?${new URLSearchParams({
		location: `${t},${e}`,
		radius: String(Math.max(1, Math.round(n))),
		source: "outdoor",
		key: r
	})}`;
}
function x(e, t, n, r) {
	return `${g}?${new URLSearchParams({
		pano: e,
		size: n,
		heading: t.toFixed(1),
		fov: String(y),
		pitch: "0",
		key: r
	})}`;
}
function S(e, [t, n], r) {
	return `https://www.google.com/maps/@?${new URLSearchParams({
		api: "1",
		map_action: "pano",
		pano: e,
		viewpoint: `${n},${t}`,
		heading: r.toFixed(1),
		pitch: "0",
		fov: String(y)
	})}`;
}
function C(e, t, n) {
	let r = e && typeof e == "object" ? e : null;
	if (!r || r.status !== "OK" || typeof r.pano_id != "string") return null;
	let i = r.location && typeof r.location == "object" ? r.location : null, a = typeof i?.lng == "number" && typeof i?.lat == "number" ? [i.lng, i.lat] : t, o = (h(a, t) + 360) % 360, s = r.pano_id;
	return {
		source: "google",
		id: s,
		position: a,
		thumbUrl: x(s, o, _, n),
		largeUrl: x(s, o, v, n),
		takenAt: typeof r.date == "string" ? r.date : null,
		credit: typeof r.copyright == "string" && r.copyright.trim() ? r.copyright.trim().replace(/^©\s*/, "") : "Google",
		licence: null,
		licenceUrl: null,
		viewerUrl: S(s, a, o),
		is360: !1,
		heading: o
	};
}
function w(e) {
	let t = e && typeof e == "object" ? e : null, n = t?.status;
	if (n === "OK" || n === "ZERO_RESULTS" || n === "NOT_FOUND") return null;
	let r = typeof t?.error_message == "string" ? t.error_message : "";
	return `Google Street View refused the request (${String(n ?? "no answer")})${r ? `: ${r}` : ""}`;
}
var T = "https://api.panoramax.xyz/", E = "panoramax-coverage";
function D(e, [t, n], r = 50) {
	return `${e.replace(/\/+$/, "")}/search?${new URLSearchParams({
		place_position: `${t},${n}`,
		place_distance: `0-${Math.max(1, Math.round(r))}`,
		limit: "1"
	})}`;
}
function O(e, t) {
	return `${e.replace(/\/+$/, "")}/search?${new URLSearchParams({ ids: t })}`;
}
var k = "#FF6F00", A = {
	equirectangular: "#FF6F00",
	flat: "#00897B"
}, j = [
	"#C62828",
	"#F57C00",
	"#7E57C2",
	"#311B92"
], M = "#9E9E9E";
function N(e) {
	return [
		`${e}-01-01`,
		`${e - 1}-01-01`,
		`${e - 4}-01-01`
	];
}
function P(e, t, n) {
	if (e === "camera") return [
		"case",
		[
			"==",
			["get", "type"],
			"equirectangular"
		],
		A.equirectangular,
		[
			"==",
			["get", "type"],
			"flat"
		],
		A.flat,
		[
			"==",
			["get", "type"],
			null
		],
		M,
		M
	];
	if (e === "date") {
		let e = t === "sequences" ? "date" : "ts", [r, i, a] = N(n);
		return [
			"case",
			[
				"==",
				["get", e],
				null
			],
			M,
			[
				">=",
				["get", e],
				r
			],
			j[0],
			[
				">=",
				["get", e],
				i
			],
			j[1],
			[
				">=",
				["get", e],
				a
			],
			j[2],
			[
				"<",
				["get", e],
				a
			],
			j[3],
			M
		];
	}
	return k;
}
function F(e) {
	let [t, n, r] = N(e), i = (i) => ({
		name: i,
		translation: "Taken",
		valuemap: [
			{
				value: t,
				operator: ">=",
				label: `This year (${e})`
			},
			{
				value: n,
				operator: ">=",
				label: `Last year (${e - 1})`
			},
			{
				value: r,
				operator: ">=",
				label: `${e - 4}–${e - 2}`
			},
			{
				value: r,
				operator: "<",
				label: `Before ${e - 4}`
			},
			{
				value: null,
				operator: "==",
				label: "Date unknown"
			}
		]
	});
	return { translations: [
		{
			name: "type",
			translation: "Camera",
			valuemap: [
				{
					value: "equirectangular",
					operator: "==",
					label: "360° photos"
				},
				{
					value: "flat",
					operator: "==",
					label: "Flat photos"
				},
				{
					value: null,
					operator: "==",
					label: "Camera unknown"
				}
			]
		},
		i("date"),
		i("ts")
	] };
}
function I(e, t = "coverage", n = (/* @__PURE__ */ new Date()).getFullYear()) {
	let r = E, i = "panoramax";
	return {
		id: r,
		type: "style",
		version: 8,
		title: "Panoramax photos",
		sources: { [i]: {
			type: "vector",
			tiles: [`${e.replace(/\/+$/, "")}/map/{z}/{x}/{y}.mvt`],
			minzoom: 6,
			maxzoom: 15,
			attribution: "<a href=\"https://panoramax.fr\" target=\"_blank\" rel=\"noopener\">Panoramax</a>"
		} },
		layers: [{
			id: `${r}-sequences`,
			type: "line",
			source: i,
			"source-layer": "sequences",
			minzoom: 6,
			metadata: { label: "Photographed routes" },
			layout: { "line-cap": "square" },
			paint: {
				"line-color": P(t, "sequences", n),
				"line-width": [
					"interpolate",
					["linear"],
					["zoom"],
					6,
					3,
					10,
					3,
					14,
					4,
					16,
					5,
					22,
					3
				]
			}
		}, {
			id: `${r}-pictures`,
			type: "circle",
			source: i,
			"source-layer": "pictures",
			metadata: { label: "Photos" },
			paint: {
				"circle-color": P(t, "pictures", n),
				"circle-opacity": [
					"interpolate",
					["linear"],
					["zoom"],
					15,
					0,
					16,
					1
				],
				"circle-radius": [
					"interpolate",
					["linear"],
					["zoom"],
					15,
					4.5,
					17,
					8,
					22,
					12
				],
				"circle-stroke-color": "#ffffff",
				"circle-stroke-width": [
					"interpolate",
					["linear"],
					["zoom"],
					17,
					0,
					20,
					2
				]
			}
		}],
		metadata: {
			label: "Panoramax photos",
			dynamic: !0,
			ownerTool: "street-photos",
			legendRole: "overlay",
			abstract: "Where street-level photos exist on Panoramax. Shown while the Street photos tool is open.",
			attributes: F(n)
		}
	};
}
function L(e, t) {
	return e.heading === null || !t ? 0 : (h(e.position, t) - e.heading + 540) % 360 - 180;
}
function R(e, t, [n, r]) {
	let i = new URL(e);
	return i.searchParams.set("pic", t), i.searchParams.set("focus", "pic"), i.searchParams.set("map", `18/${r}/${n}`), i.toString();
}
function z(e) {
	return e && typeof e == "object" && !Array.isArray(e) ? e : null;
}
function B(e, t) {
	let n = z(e?.[t])?.href;
	return typeof n == "string" && /^https?:\/\//.test(n) ? n : null;
}
function V(e, t = T) {
	let n = z(e)?.features, r = Array.isArray(n) ? z(n[0]) : null;
	if (!r || typeof r.id != "string") return null;
	let i = z(r.geometry)?.coordinates;
	if (!Array.isArray(i) || typeof i[0] != "number" || typeof i[1] != "number") return null;
	let a = [i[0], i[1]], o = z(r.assets), s = z(r.properties) ?? {}, c = B(o, "thumb") ?? (typeof s["geovisio:thumbnail"] == "string" ? s["geovisio:thumbnail"] : null);
	if (!c) return null;
	let l = Array.isArray(r.links) ? r.links.map(z) : [], u = l.find((e) => e?.rel === "license"), d = l.find((e) => e?.rel === "via"), f = (Array.isArray(r.providers) ? r.providers : []).map(z).filter((e) => Array.isArray(e?.roles) && e.roles.includes("producer") && typeof e.name == "string").map((e) => e.name), p = typeof d?.href == "string" ? new URL(d.href).hostname : null, m = z(s["pers:interior_orientation"]), h = s["view:azimuth"];
	return {
		source: "panoramax",
		id: r.id,
		position: a,
		thumbUrl: c,
		largeUrl: B(o, "sd") ?? c,
		takenAt: typeof s.datetime == "string" ? s.datetime : null,
		credit: f.length ? [...new Set(f)].join(", ") : p ?? "Panoramax",
		licence: typeof s.license == "string" ? s.license : null,
		licenceUrl: typeof u?.href == "string" && /^https?:\/\//.test(u.href) ? u.href : null,
		viewerUrl: R(t, r.id, a),
		is360: m?.field_of_view === 360,
		heading: typeof h == "number" && Number.isFinite(h) ? h : null
	};
}
//#endregion
//#region src/components/webmapx-street-photos-tool.ts
var H = "webmapx-street-photos-spot", U = 6, W = 12, G = 500, K = 100, q = null;
function J() {
	return q ??= Promise.all([import("./pannellum-DPBUx_BZ.js"), import("./pannellum-CE3ZwR1T.js")]).then(([, e]) => e.default), q;
}
var Y = class extends o {
	constructor(...e) {
		super(...e), this.active = !1, this.status = "idle", this.photo = null, this.source = "panoramax", this.errorText = "", this.coverageUnsupported = !1, this.panoramaFailed = !1, this.colourBy = "coverage", this.zoomedOut = !1, this.touch = new m(this), this.markerAdded = !1, this.unsubClick = null, this.requestNo = 0, this.spot = null, this.panorama = null, this.unsubPointerMove = null, this.unsubViewChangeEnd = null, this.hoverCursor = "", this.throttledHover = d(async (e, t) => {
			if (!this.active) return;
			let n = await this.coverageAt(e, t);
			this.active && this.setHoverCursor(n ? "pointer" : "");
		}, K), this.selectSource = (e) => {
			let t = e.target.value;
			t !== "panoramax" && t !== "google" || (this.source = t, this.dialog?.close(), this.requestNo++, this.status = "idle", this.photo = null, this.spot = null, this.removeMarker(), t === "google" ? (this.removeCoverage(), this.setHoverCursor("")) : this.addCoverage());
		}, this.selectColourBy = (e) => {
			let t = e.target.value;
			if (t !== "coverage" && t !== "date" && t !== "camera") return;
			this.colourBy = t;
			let n = E;
			if (!this.adapter?.hasLayer?.(n)) return;
			let r = (/* @__PURE__ */ new Date()).getFullYear();
			this.adapter.updateLayerStyle(n, `${n}-sequences`, { "line-color": P(t, "sequences", r) }), this.adapter.updateLayerStyle(n, `${n}-pictures`, { "circle-color": P(t, "pictures", r) });
		}, this.imageFailed = () => {
			let e = this.photo;
			e && (this.photo = null, this.fail(e.source === "google" ? "Google Street View found a photo here but would not send the image. Check that the Google key may use the Street View Static API." : "The photo could not be loaded. Try again in a moment."));
		}, this.openDialog = async () => {
			let e = this.photo, t = this.dialog;
			!e || !t || (this.panoramaFailed = !1, t.showModal(), e.is360 && await this.openPanorama(e));
		};
	}
	get showsCoverage() {
		return this.source === "panoramax" && !this.coverageUnsupported;
	}
	get toolTip() {
		return this.source === "google" ? this.status === "idle" ? `${this.touch.click} a street on the map to see a Google Street View photo of it.` : `${this.touch.click} another street to see a photo there.` : this.zoomedOut && !this.coverageUnsupported ? "Zoom in to see where photos were taken." : this.status === "idle" ? this.coverageUnsupported ? `${this.touch.click} a road or path on the map to see a street photo of it.` : `${this.touch.click} a coloured line or dot to see a street photo.` : `${this.touch.click} another spot to see a photo there.`;
	}
	handleEscape() {
		let e = this.dialog;
		return e?.open ? (e.close(), !0) : !1;
	}
	static {
		this.styles = [
			c,
			l,
			f,
			t`
        :host {
            display: block;
            pointer-events: auto;
        }

        .street-photos {
            display: flex;
            flex-direction: column;
            gap: var(--webmapx-space-md, 0.75rem);
            padding: var(--webmapx-tool-padding, 0);
            font-size: var(--font-size-small, 0.875rem);
        }

        .status {
            display: flex;
            align-items: center;
            gap: var(--webmapx-space-sm, 0.5rem);
            margin: 0;
        }

        .thumb-button {
            position: relative;
            display: block;
            width: 100%;
            padding: 0;
            border: 0;
            background: none;
            cursor: zoom-in;
            border-radius: 4px;
        }

        .thumb-button:focus-visible {
            outline: var(--webmapx-focus-ring-width, 2px) solid var(--webmapx-focus-ring-color, var(--color-primary, #2b6c8f));
            outline-offset: 2px;
        }

        .thumb-button img {
            display: block;
            width: 100%;
            aspect-ratio: 3 / 2;
            object-fit: cover;
            border-radius: 4px;
            background: var(--color-surface-raised, #f4f6f8);
        }

        .badge-360 {
            position: absolute;
            top: 0.4rem;
            left: 0.4rem;
            padding: 0.05rem 0.4rem;
            border-radius: 3px;
            font-size: 0.7rem;
            font-weight: 600;
            color: #fff;
            background: rgba(0, 0, 0, 0.6);
        }

        .credit {
            margin: 0;
            font-size: 0.75rem;
            color: var(--color-text-secondary, #5a6773);
        }

        .credit a {
            color: inherit;
        }

        /* A native dialog sits in the browser's top layer, so a translucent
           panel (backdrop-filter) cannot trap it inside its own box. */
        dialog {
            width: min(860px, calc(100vw - 2rem));
            padding: var(--webmapx-space-md, 0.75rem);
            border: 1px solid var(--color-border-light, #e2e7ec);
            border-radius: var(--webmapx-radius-md, 8px);
            background: var(--color-surface, #fff);
            color: var(--color-text, #1d2a36);
            box-shadow: var(--webmapx-shadow-lg, 0 10px 30px rgba(0, 0, 0, 0.25));
        }

        dialog::backdrop {
            background: rgba(0, 0, 0, 0.45);
        }

        .dialog-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--webmapx-space-sm, 0.5rem);
        }

        .dialog-header h3 {
            margin: 0;
            font-size: 1rem;
        }

        .large {
            display: block;
            width: 100%;
            max-height: 70vh;
            object-fit: contain;
            border-radius: 4px;
            background: var(--color-surface-raised, #f4f6f8);
        }

        .panorama {
            width: 100%;
            height: min(60vh, 480px);
            border-radius: 4px;
            overflow: hidden;
            background: #000;
        }

        .dialog-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: var(--webmapx-space-sm, 0.5rem);
            margin-top: var(--webmapx-space-md, 0.75rem);
        }

        sl-spinner {
            font-size: 0.9rem;
        }
    `
		];
	}
	onMapAttached(e) {
		super.onMapAttached(e), this.unsubClick = e.events.on("click", (e) => {
			this.handleClick(e);
		}), this.unsubPointerMove = e.events.on("pointer-move", (e) => {
			this.active && this.showsCoverage && this.throttledHover(e.pixel, e.coords);
		}), this.unsubViewChangeEnd = e.events.on("view-change-end", () => this.updateZoomedOut());
	}
	onMapDetached() {
		this.unsubClick?.(), this.unsubClick = null, this.unsubPointerMove?.(), this.unsubPointerMove = null, this.unsubViewChangeEnd?.(), this.unsubViewChangeEnd = null, super.onMapDetached();
	}
	disconnectedCallback() {
		this.removeMarker(), this.removeCoverage(), this.closePanorama(), super.disconnectedCallback();
	}
	activate() {
		this.active = !0, this.style.display = "block", this.updateZoomedOut(), this.source === "panoramax" && this.addCoverage();
	}
	updateZoomedOut() {
		let e = this.adapter?.getViewportState()?.zoom;
		this.zoomedOut = typeof e == "number" && e < 6;
	}
	deactivate() {
		this.active = !1, this.style.display = "none", this.dialog?.close(), this.requestNo++, this.status = "idle", this.photo = null, this.spot = null, this.removeMarker(), this.removeCoverage(), this.setHoverCursor("");
	}
	onStateChanged(e) {}
	get settings() {
		let e = this.toolConfig;
		return {
			apiUrl: e.apiUrl || "https://api.panoramax.xyz/api",
			viewerUrl: e.viewerUrl || "https://api.panoramax.xyz/",
			searchDistance: e.searchDistance ?? 50
		};
	}
	get toolConfig() {
		return this.toolsConfig?.["street-photos"] ?? this.toolsConfig?.panoramax ?? {};
	}
	get googleApiKey() {
		let e = this.toolConfig.googleApiKey;
		if (!e) return null;
		let t = s(e);
		return t && !t.includes("{key-") ? t : null;
	}
	async addCoverage() {
		let e = this.adapter, t = this.mapHost;
		if (!e || !t) return;
		let n = I(this.settings.apiUrl, this.colourBy), r = Object.values(n.sources)[0];
		this.coverageUnsupported = !e.canDrawSource(r), !(this.coverageUnsupported || e.hasLayer?.("panoramax-coverage")) && (await t.addLayerRequest(n), this.active || this.removeCoverage());
	}
	setHoverCursor(e) {
		e !== this.hoverCursor && (this.hoverCursor = e, this.adapter?.setCursor(e));
	}
	removeCoverage() {
		this.adapter?.hasLayer?.("panoramax-coverage") && this.mapHost?.removeInlineLayer(E);
	}
	async coverageAt(e, t) {
		if (!this.adapter?.hasLayer?.("panoramax-coverage")) return null;
		let n = E;
		try {
			let r = await this.adapter.queryService.queryFeatures({
				pixel: e,
				lngLat: t
			}, {
				tolerancePx: U,
				layerIds: [n]
			}), i = r.find((e) => typeof e.properties.ts == "string" && typeof e.properties.id == "string");
			return i ? {
				kind: "photo",
				id: i.properties.id
			} : r.some((e) => typeof e.properties.date == "string") ? { kind: "route" } : null;
		} catch {
			return null;
		}
	}
	searchDistanceAt(e, t) {
		let n = this.settings.searchDistance;
		try {
			let r = this.adapter?.unproject([e[0] + W, e[1]]);
			if (!r) return n;
			let [i, a] = r, o = Math.PI / 180, s = (a - t[1]) * o, c = (i - t[0]) * o, l = Math.sin(s / 2) ** 2 + Math.cos(t[1] * o) * Math.cos(a * o) * Math.sin(c / 2) ** 2, u = 2 * 6371008.8 * Math.asin(Math.sqrt(l));
			return Number.isFinite(u) ? Math.min(G, Math.max(n, u)) : n;
		} catch {
			return n;
		}
	}
	async handleClick(e) {
		if (!this.active || !this.adapter) return;
		let t = ++this.requestNo;
		if (this.source === "google") {
			await this.searchGoogle(e, t);
			return;
		}
		if (this.zoomedOut && !this.coverageUnsupported) {
			p(this, "Zoom in to see where photos were taken.");
			return;
		}
		let n = await this.coverageAt(e.pixel, e.coords);
		if (t !== this.requestNo) return;
		this.updateMarker(e.coords), this.status = "loading", this.photo = null;
		let { apiUrl: r, viewerUrl: i } = this.settings, a;
		try {
			let t = n?.kind === "photo" ? n.id : null;
			this.spot = t ? null : e.coords;
			let o = t ? O(r, t) : D(r, e.coords, this.searchDistanceAt(e.pixel, e.coords)), s = await fetch(o);
			if (!s.ok) throw Error(`HTTP ${s.status}`);
			a = V(await s.json(), i);
		} catch (e) {
			if (t !== this.requestNo) return;
			console.warn("[street-photos-tool] Panoramax search failed", e), this.fail("Panoramax could not be reached. Try again in a moment.");
			return;
		}
		t === this.requestNo && this.found(a);
	}
	async searchGoogle(e, t) {
		let n = this.googleApiKey;
		if (!n) return;
		this.updateMarker(e.coords), this.status = "loading", this.photo = null, this.spot = e.coords;
		let r;
		try {
			let t = await fetch(b(e.coords, this.searchDistanceAt(e.pixel, e.coords), n));
			if (!t.ok) throw Error(`HTTP ${t.status}`);
			r = await t.json();
		} catch (e) {
			if (t !== this.requestNo) return;
			console.warn("[street-photos-tool] Google Street View search failed", e), this.fail("Google Street View could not be reached. Try again in a moment.");
			return;
		}
		if (t !== this.requestNo) return;
		let i = w(r);
		if (i) {
			console.warn(`[street-photos-tool] ${i}`), this.fail(`${i}. Check the Google key in the map's settings.`);
			return;
		}
		this.found(C(r, e.coords, n));
	}
	found(e) {
		this.photo = e, this.status = e ? "found" : "none", p(this, e ? `Street photo found, by ${e.credit}` : "No street photos here");
	}
	fail(e) {
		this.errorText = e, this.status = "error", p(this, e);
	}
	updateMarker(e) {
		this.adapter && (this.markerAdded ? this.adapter.moveMarker(H, e) : (this.adapter.addMarker(H, e, { color: u }), this.markerAdded = !0));
	}
	removeMarker() {
		this.markerAdded &&= (this.adapter?.removeMarker(H), !1);
	}
	get dialog() {
		return this.shadowRoot?.querySelector("dialog") ?? null;
	}
	async openPanorama(e) {
		let t = this.shadowRoot?.querySelector(".panorama");
		if (t) try {
			let n = await J();
			if (!this.dialog?.open || this.photo !== e) return;
			if (!this.shadowRoot.querySelector("style[data-pannellum]")) {
				let e = document.createElement("style");
				e.dataset.pannellum = "", e.textContent = n, this.shadowRoot.append(e);
			}
			this.closePanorama(), this.panorama = window.pannellum.viewer(t, {
				type: "equirectangular",
				panorama: e.largeUrl,
				autoLoad: !0,
				crossOrigin: "anonymous",
				yaw: L(e, this.spot),
				hfov: 100,
				showFullscreenCtrl: !1,
				strings: { loadingLabel: "Loading photo…" }
			});
		} catch (e) {
			console.warn("[street-photos-tool] panorama viewer failed", e), this.panoramaFailed = !0;
		}
	}
	closePanorama() {
		this.panorama?.destroy(), this.panorama = null;
	}
	renderCredit(t) {
		let n = t.takenAt ? new Date(t.takenAt) : null, r = /^\d{4}-\d{2}$/.test(t.takenAt ?? ""), a = n && !Number.isNaN(n.getTime()) ? n.toLocaleDateString(void 0, r ? {
			year: "numeric",
			month: "long"
		} : {
			year: "numeric",
			month: "long",
			day: "numeric"
		}) : null;
		return i`
            <p class="credit">
                Photo: ${t.credit}${a ? i`, ${a}` : e}
                ${t.licence ? i` · ${t.licenceUrl ? i`<a href=${t.licenceUrl} target="_blank" rel="noopener noreferrer">${t.licence}</a>` : t.licence}` : e}
            </p>`;
	}
	renderOpenButton(e) {
		let t = e.source === "google" ? "Google Street View" : "Panoramax";
		return i`
            <sl-button size="small" href=${e.viewerUrl} target="_blank" rel="noopener noreferrer"
                title=${`Open this photo in ${t} in a new tab, to look around and walk on`}>
                <sl-icon name="box-arrow-up-right" slot="suffix" label="opens in a new tab"></sl-icon>
                Open in ${t}
            </sl-button>`;
	}
	renderLarge(e) {
		return e.is360 ? this.panoramaFailed ? i`<p class="status help-text">This 360° photo could not be shown here. Open it in Panoramax to look around.</p>` : i`<div class="panorama" role="img" aria-label="360° street photo near this spot. Drag or use the arrow keys to look around."></div>` : i`<img class="large" src=${e.largeUrl} alt="Street photo near this spot">`;
	}
	render() {
		let t = this.photo;
		return i`
            <div class="street-photos">
                ${this.googleApiKey ? i`
                    <sl-radio-group size="small" label="Photos from" value=${this.source} @sl-change=${this.selectSource}>
                        <sl-radio-button value="panoramax">Panoramax</sl-radio-button>
                        <sl-radio-button value="google">Google Street View</sl-radio-button>
                    </sl-radio-group>` : e}
                ${this.showsCoverage ? i`
                    <sl-radio-group size="small" label="Colour by" value=${this.colourBy} @sl-change=${this.selectColourBy}>
                        <sl-radio-button value="coverage">Coverage</sl-radio-button>
                        <sl-radio-button value="date">Date</sl-radio-button>
                        <sl-radio-button value="camera">Camera</sl-radio-button>
                    </sl-radio-group>` : e}
                ${this.coverageUnsupported && this.source === "panoramax" ? i`
                    <p class="status help-text">This map engine cannot show where photos are. Click a road or path to look for one.</p>` : e}
                ${this.status === "loading" ? i`
                    <p class="status help-text"><sl-spinner></sl-spinner> Looking for photos…</p>` : e}
                ${this.status === "none" ? i`
                    <p class="status help-text">No street photos here. ${this.showsCoverage ? "Click a coloured line or dot." : "Photos are mostly taken along roads and paths."}</p>` : e}
                ${this.status === "error" ? i`
                    <p class="status help-text">${this.errorText}</p>` : e}
                ${t ? i`
                    <button type="button" class="thumb-button" aria-haspopup="dialog"
                        title=${t.is360 ? "Enlarge the photo and look around" : "Enlarge the photo"}
                        @click=${this.openDialog}>
                        <img src=${t.thumbUrl} alt="Street photo near this spot, select to enlarge" @error=${this.imageFailed}>
                        ${t.is360 ? i`<span class="badge-360" aria-hidden="true">360°</span>` : e}
                    </button>
                    ${this.renderCredit(t)}
                    <div>
                        <sl-button size="small" class="enlarge" aria-haspopup="dialog" @click=${this.openDialog}>
                            <sl-icon name="arrows-angle-expand" slot="prefix"></sl-icon>
                            ${t.is360 ? "Open 360 view" : "Open larger picture"}
                        </sl-button>
                    </div>

                    <dialog aria-labelledby="street-photos-dialog-title" @close=${() => this.closePanorama()}>
                        <div class="dialog-header">
                            <h3 id="street-photos-dialog-title">${t.is360 ? "Street photo, 360°" : "Street photo"}</h3>
                            <sl-icon-button name="x-lg" label="Close" @click=${() => this.dialog?.close()}></sl-icon-button>
                        </div>
                        ${this.renderLarge(t)}
                        <div class="dialog-footer">
                            ${this.renderCredit(t)}
                            ${this.renderOpenButton(t)}
                        </div>
                    </dialog>
                ` : e}
            </div>
        `;
	}
};
a([n()], Y.prototype, "status", void 0), a([n()], Y.prototype, "photo", void 0), a([n()], Y.prototype, "source", void 0), a([n()], Y.prototype, "errorText", void 0), a([n()], Y.prototype, "coverageUnsupported", void 0), a([n()], Y.prototype, "panoramaFailed", void 0), a([n()], Y.prototype, "colourBy", void 0), a([n()], Y.prototype, "zoomedOut", void 0), Y = a([r("webmapx-street-photos-tool")], Y);
//#endregion
export { Y as WebmapxStreetPhotosTool };
