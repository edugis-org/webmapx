import { l as e, o as t, t as n, u as r } from "./tool-registry-DOHWzFxh.js";
import { c as i, d as a, h as o, p as s, s as c } from "./decorators-d8E4nZJy.js";
import { c as l, s as u } from "./decorate-Bl-DXcQA.js";
import { t as d } from "./webmapx-base-tool-U6KxfRFV.js";
import { t as f } from "./webmapx-modal-tool-CvWzMu9K.js";
import { n as p, r as m, t as h } from "./i18n-Cbl3bHEF.js";
import { t as g } from "./validator-ChYzWR-K.js";
import { n as _ } from "./apikeys-DFtVEG81.js";
import { n as v } from "./chunk.3Y6SB6QS-DUJ8Ickw.js";
//#region src/bootstrap/engine-loader.ts
var y = {
	maplibre: () => import("./maplibre-adapter-CUFkmQ-F.js"),
	openlayers: () => import("./openlayers-adapter-X9R-Ivtm.js"),
	leaflet: () => import("./leaflet-adapter-VGThvF6r.js"),
	cesium: () => import("./cesium-adapter-Di31aLp1.js")
};
async function b(e) {
	let t = y[e];
	if (!t) throw Error(`[webmapx] Unknown engine: "${e}". Valid: ${Object.keys(y).join(", ")}`);
	await t();
}
//#endregion
//#region src/bootstrap/tool-loader.ts
var x = {
	draw: () => import("./webmapx-draw-tool-BYX4WOMx.js"),
	measure: () => import("./webmapx-measure-tool-e6uwKriv.js"),
	print: () => import("./webmapx-print-tool-BVVQ7CP2.js"),
	"import-layer": () => import("./webmapx-import-layer-tool-D47-zgYF.js"),
	search: () => import("./webmapx-search-tool-Du5X0lsq.js"),
	geolocation: () => import("./webmapx-geolocation-tool-BuOJiceV.js"),
	info: () => import("./webmapx-info-tool-us3KTrA5.js"),
	maplanguage: () => import("./webmapx-language-osmvector-WJ-DamI4.js"),
	"3d": () => import("./webmapx-3d-tool-DWwNz8wg.js"),
	truearea: () => import("./webmapx-truearea-tool-_J8aAg3w.js"),
	projection: () => import("./webmapx-projection-tool-BIn_QmwE.js"),
	timeSlider: () => import("./webmapx-time-slider-tool-R9o5mOYU.js"),
	deeptime: () => import("./webmapx-deeptime-tool-C2A9e7Cp.js"),
	sealevel: () => import("./webmapx-sealevel-tool-yQ8pghas.js"),
	compare: () => import("./webmapx-compare-tool-xyQoTQB_.js"),
	cartogram: () => import("./webmapx-cartogram-tool-B3DeL0bi.js"),
	coordinates: () => import("./webmapx-coordinates-tool-BclvtCE1.js"),
	megaSlider: () => import("./webmapx-mega-slider-DzaFnhq4.js"),
	megaReset: () => import("./webmapx-mega-reset-CdT4Ls-j.js"),
	megaCompare: () => import("./webmapx-mega-compare-BlPdm8cd.js"),
	settings: () => import("./webmapx-settings-Db60VvgL.js"),
	routing: () => import("./webmapx-routing-tool-k8zufLqA.js"),
	isochrone: () => import("./webmapx-isochrone-tool-D2-GsU6I.js"),
	buffer: () => import("./webmapx-buffer-tool-DwkFhlMM.js"),
	geoprocessing: () => import("./webmapx-geoprocessing-tool-AwIsUcFk.js"),
	"data-analyzer": () => import("./webmapx-data-analyzer-tool-36ii12LD.js"),
	"config-edit": () => import("./webmapx-config-edit-tool-Br72cyd9.js"),
	stories: () => import("./webmapx-stories-tool-DLshkxJh.js"),
	layerLegend3d: () => import("./webmapx-layer-legend3d-DLbWAkjM.js")
};
async function S(r) {
	await import("./webmapx-core-bundle-LIr_Ppaz.js"), await Promise.all(r.map((r) => {
		let i = e(r), a = x[i];
		return a ? a() : (!n.has(i) && !t.has(i) && console.warn(`[webmapx] Unknown tool: "${r}" — skipped`), Promise.resolve());
	}));
}
function C(e) {
	if (!e) return [];
	let t = [], n = (e, r) => {
		if (typeof e.type == "string" ? e.type !== "toolbar" && t.push(e.type) : r !== null && t.push(r), Array.isArray(e.items)) for (let t of e.items) t && typeof t == "object" && n(t, null);
	};
	for (let [t, r] of Object.entries(e)) !r || typeof r != "object" || n(r, t);
	return t;
}
//#endregion
//#region src/bootstrap/plugin-url.ts
var w = [
	"https://cdn.jsdelivr.net/npm/",
	"https://unpkg.com/",
	"https://esm.sh/"
];
function T(e, t, n = typeof location < "u" ? location.origin : null) {
	let r;
	try {
		r = new URL(e, t);
	} catch {
		return null;
	}
	return n && r.origin === n || w.some((e) => r.href.startsWith(e)) ? r.href : null;
}
//#endregion
//#region src/config/loader.ts
function E(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function D(e, t) {
	if (e.startsWith("pmtiles://")) return `pmtiles://${D(e.slice(10), t)}`;
	if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(e)) return e;
	try {
		return new URL(e, t).toString();
	} catch {
		return e;
	}
}
function O(e, t) {
	if (!e.startsWith("internalfunc://")) return e;
	let [n, r] = e.split("?");
	if (!r) return e;
	let i = new URLSearchParams(r), a = i.get("data");
	return a ? (i.set("data", D(a, t)), `${n}?${i.toString().replace(/%7B/gi, "{").replace(/%7D/gi, "}")}`) : e;
}
function k(e, t, n) {
	if (!E(t)) return {
		id: e,
		type: "geojson",
		data: t
	};
	let r = {
		id: e,
		...t
	};
	return r.type === "raster" && r.url === void 0 && Array.isArray(r.tiles) && (r.url = r.tiles), r.type === "raster" && r.service === void 0 && (r.service = "xyz"), typeof r.data == "string" && (r.data = r.data.startsWith("internalfunc://") ? O(r.data, n) : D(r.data, n)), typeof r.url == "string" ? r.url = D(r.url, n) : Array.isArray(r.url) && (r.url = r.url.map((e) => typeof e == "string" ? D(e, n) : e)), Array.isArray(r.tiles) && (r.tiles = r.tiles.map((e) => typeof e == "string" ? D(e, n) : e)), r;
}
function A(e, t) {
	return E(e) ? Object.entries(e).map(([e, n]) => k(e, n, t)) : [];
}
function j(e, t) {
	let n = typeof e.source == "string" ? t?.get(e.source) ?? e.source : void 0, r = e["source-layer"] ?? e.sourceLayer, i = e.minzoom ?? e.minZoom, a = e.maxzoom ?? e.maxZoom, o = { ...e };
	return n !== void 0 && (o.source = n), r !== void 0 && (o["source-layer"] = r), i !== void 0 && (o.minzoom = i), a !== void 0 && (o.maxzoom = a), delete o.sourceLayer, delete o.minZoom, delete o.maxZoom, o;
}
function M(e, t, n) {
	return Array.isArray(e) ? e.filter(E).map((e) => N(e, t, n)) : E(e) ? Object.entries(e).map(([e, r]) => E(r) ? N({
		id: e,
		...r
	}, t, n) : null).filter(Boolean) : [];
}
function N(e, t, n) {
	let r = typeof e.id == "string" ? e.id : null;
	if (!r) return null;
	let i = typeof e.fallbackLayerId == "string" ? e.fallbackLayerId : typeof e.fallbackRef == "string" ? e.fallbackRef : void 0, a = typeof e.singleGroup == "string" ? e.singleGroup : typeof e.selectionGroup == "string" ? e.selectionGroup : void 0, o = E(e.metadata) ? {
		...e.metadata,
		...a ? {
			selectionGroup: a,
			singleSelectionGroupKey: a
		} : {},
		...i ? { fallbackLayerId: i } : {}
	} : a || i ? {
		...a ? {
			selectionGroup: a,
			singleSelectionGroupKey: a
		} : {},
		...i ? { fallbackLayerId: i } : {}
	} : void 0, s = {
		...e,
		id: r,
		...i ? { fallbackLayerId: i } : {},
		...a ? { singleGroup: a } : {},
		...o ? { metadata: o } : {}
	};
	if (e.type === "allmaps") return s;
	if (e.type === "style") {
		let i = {}, a = /* @__PURE__ */ new Map();
		if (E(e.sources)) for (let [o, s] of Object.entries(e.sources)) {
			let e = `${r}:${o}`;
			a.set(o, e), t.push(k(e, s, n)), i[o] = s;
		}
		let o = Array.isArray(e.layers) ? e.layers.filter(E).map((e) => j(e, a)) : [];
		return {
			...s,
			type: "style",
			...typeof e.url == "string" ? { url: D(e.url, n) } : {},
			sources: e.sources ?? {},
			layers: o
		};
	}
	let c = e.type === "background";
	if (typeof e.type == "string" && (typeof e.source == "string" || c) && !e.layerset && !e.style) {
		let t = e["source-layer"] ?? e.sourceLayer, n = e.minzoom ?? e.minZoom, r = e.maxzoom ?? e.maxZoom, i = { ...s };
		return t !== void 0 && (i["source-layer"] = t), n !== void 0 && (i.minzoom = n), r !== void 0 && (i.maxzoom = r), delete i.sourceLayer, delete i.minZoom, delete i.maxZoom, i;
	}
	if (Array.isArray(e.layerset)) {
		let t = e.layerset.filter(E).map((e) => j(e));
		return {
			...s,
			type: "style",
			layers: t,
			layerset: void 0
		};
	}
	if (E(e.style)) {
		let i = e.style, a = /* @__PURE__ */ new Map(), o = {};
		if (E(i.sources)) for (let [e, s] of Object.entries(i.sources)) {
			let i = `${r}:${e}`;
			a.set(e, i), t.push(k(i, s, n)), o[e] = s;
		}
		let c = Array.isArray(i.layers) ? i.layers.filter(E).map((e) => j(e, a)) : [], l = typeof i.url == "string" ? D(i.url, n) : void 0;
		return {
			...s,
			type: "style",
			...l ? { url: l } : {},
			sources: o,
			layers: c,
			style: void 0
		};
	}
	return null;
}
function P(e, t) {
	let n = (e) => {
		let t = e.selectionMode;
		if (t === "single" || t === "multiple") return t;
	}, r = (e) => typeof e.selectionGroup == "string" ? e.selectionGroup : void 0, i = (e) => typeof e.allowNone == "boolean" ? e.allowNone : void 0, a = (e) => typeof e.stackOrder == "number" && Number.isFinite(e.stackOrder) ? e.stackOrder : void 0, o = (e) => {
		if (!E(e)) return null;
		let t = typeof e.kind == "string" ? e.kind : void 0;
		if (t === "group") {
			let t = Array.isArray(e.children) ? e.children.map(o).filter((e) => e !== null) : [];
			return {
				label: typeof e.title == "string" ? e.title : "Group",
				expanded: e.expanded === !0,
				...n(e) ? { selectionMode: n(e) } : {},
				...r(e) ? { selectionGroup: r(e) } : {},
				...i(e) === void 0 ? {} : { allowNone: i(e) },
				...a(e) === void 0 ? {} : { stackOrder: a(e) },
				children: t
			};
		}
		if (t === "layer") {
			let t = typeof e.ref == "string" ? e.ref : void 0;
			return t ? {
				label: typeof e.title == "string" ? e.title : t,
				layerId: t,
				...n(e) ? { selectionMode: n(e) } : {},
				...r(e) ? { selectionGroup: r(e) } : {},
				...i(e) === void 0 ? {} : { allowNone: i(e) },
				...a(e) === void 0 ? {} : { stackOrder: a(e) }
			} : null;
		}
		return null;
	};
	if (!E(e)) return t.map((e) => !E(e) || typeof e.id != "string" ? null : {
		label: e.id,
		layerId: e.id
	}).filter(Boolean);
	let s = Object.values(e).find((e) => E(e)), c = (Array.isArray(s?.items) ? s.items : []).map(o).filter((e) => e !== null);
	return c.length > 0 ? c : t.map((e) => !E(e) || typeof e.id != "string" ? null : {
		label: e.id,
		layerId: e.id
	}).filter(Boolean);
}
function F(e, t) {
	if (!E(e)) return;
	let n = JSON.parse(JSON.stringify(e)), r = (e) => {
		typeof e.data == "string" && e.data.length > 0 && (e.data = D(e.data, t));
		for (let t of Object.values(e)) if (Array.isArray(t)) for (let e of t) E(e) && r(e);
	};
	for (let e of Object.values(n)) E(e) && r(e);
	return n;
}
function I(e, t) {
	if (!E(e)) return;
	let n = JSON.parse(JSON.stringify(e)), r = Object.values(n).filter((e) => E(e));
	for (let e of r) {
		let r = Array.isArray(e.items) ? e.items : [];
		for (let e of r) if (E(e) && e.type === "layerTree") return Array.isArray(e.tree) && e.tree.length > 0 || (e.tree = t), delete e.catalog, n;
	}
	return n;
}
function L(e, t) {
	if (!E(e)) return {
		sources: [],
		layers: []
	};
	let n = e, r = Array.isArray(n.sources) ? n.sources.filter(E).map((e) => k(typeof e.id == "string" ? e.id : "", e, t)) : A(n.sources, t), i = [], a = M(n.layers, i, t), o = /* @__PURE__ */ new Map();
	for (let e of [...r, ...i]) E(e) && typeof e.id == "string" && !o.has(e.id) && o.set(e.id, e);
	return {
		sources: Array.from(o.values()),
		layers: a.map((e) => {
			if (!E(e)) return e;
			let t = e, n = typeof t.source == "string" ? t.source : null, r = n ? o.get(n) : null;
			if (!r || r.type !== "raster" || r.service !== "wms") return e;
			let i = E(t.metadata) ? { ...t.metadata } : {};
			if (typeof i.getFeatureInfoUrl == "string") return e;
			let a = Array.isArray(r.url) ? r.url[0] : r.url;
			if (typeof a != "string") return e;
			let s = r.layers ?? "", c = r.version ?? "1.1.1", l = new URL(a);
			return l.searchParams.set("SERVICE", "WMS"), l.searchParams.set("REQUEST", "GetFeatureInfo"), l.searchParams.set("VERSION", String(c)), l.searchParams.set("LAYERS", String(s)), l.searchParams.set("QUERY_LAYERS", String(s)), i.getFeatureInfoUrl = l.toString(), i.getFeatureInfoFormat = r.format ?? "application/json", {
				...t,
				metadata: i
			};
		})
	};
}
function R(e, t) {
	return !E(e) || !Array.isArray(e.stories) ? e : {
		...e,
		stories: e.stories.map((e) => !E(e) || !Array.isArray(e.chapters) ? e : {
			...e,
			chapters: e.chapters.map((e) => !E(e) || !Array.isArray(e.steps) ? e : {
				...e,
				steps: e.steps.map((e) => !E(e) || typeof e.htmlUrl != "string" ? e : {
					...e,
					htmlUrl: D(e.htmlUrl, t)
				})
			})
		})
	};
}
function z(e, t) {
	if (!E(e)) return e;
	let n = e, r = n.stories === void 0 ? void 0 : R(n.stories, t), i = F(n.tools, t), a = t, o = D(typeof n.apiKeysFile == "string" && n.apiKeysFile.trim() ? n.apiKeysFile.trim() : "./apikeys.json", t);
	if (_(o), E(n.layerData)) return {
		...n,
		layerData: L(n.layerData, t),
		baseUrl: a,
		apiKeysFile: o,
		...i === void 0 ? {} : { tools: i },
		...r === void 0 ? {} : { stories: r }
	};
	if (E(n.catalog)) {
		let e = n.catalog;
		return {
			...n,
			layerData: {
				sources: Array.isArray(e.sources) ? e.sources : [],
				layers: Array.isArray(e.layers) ? e.layers : []
			},
			catalog: n.catalog,
			baseUrl: a,
			apiKeysFile: o,
			...i === void 0 ? {} : { tools: i },
			...r === void 0 ? {} : { stories: r }
		};
	}
	if (!E(n.library)) return {
		...n,
		baseUrl: a,
		apiKeysFile: o,
		...r === void 0 ? {} : { stories: r }
	};
	let s = n.library, c = A(s.sources, t), l = M(s.layers, c, t), u = P(s.catalogs, l), d = I(i ?? n.tools, u);
	return {
		map: n.map,
		runtimeMap: E(n.runtimeMap) ? n.runtimeMap : void 0,
		layerData: {
			sources: c,
			layers: l
		},
		tools: d,
		baseUrl: a,
		apiKeysFile: o,
		state: E(n.state) ? n.state : void 0,
		version: typeof n.version == "number" ? n.version : void 0,
		project: E(n.project) ? n.project : void 0,
		...Array.isArray(n.plugins) ? { plugins: n.plugins } : {},
		...r === void 0 ? {} : { stories: r }
	};
}
function B(e, t, n = typeof document < "u" ? document.baseURI : "http://localhost/") {
	let r = z(e, n), i = g(r);
	if (!i.valid) {
		let e = i.errors.map((e) => `  ${e.path}: ${e.message}`).join("\n");
		throw Error(`Invalid config from "${t}":\n${e}`);
	}
	return i.warnings.length > 0 && (console.warn(`[config] Warnings for "${t}":`), i.warnings.forEach((e) => console.warn(`  ${e.path}: ${e.message}`))), r;
}
//#endregion
//#region src/bootstrap/plugin-loader.ts
var V = Object.freeze({
	registerTool: r,
	WebmapxBaseTool: d,
	WebmapxModalTool: f,
	LitElement: c,
	html: s,
	css: o,
	svg: a,
	nothing: i,
	i18n: h,
	t: m
}), H = /* @__PURE__ */ new Map();
async function U(e, t = typeof document < "u" ? document.baseURI : "") {
	if (Array.isArray(e)) for (let n of e) {
		if (typeof n != "string" || !n.trim()) continue;
		let e = T(n.trim(), t);
		if (!e) {
			console.warn(`[webmapx] Plugin skipped — not same-origin and not from a trusted CDN: ${n}`), console.warn("[webmapx] Allowed CDNs: " + w.join(", "));
			continue;
		}
		let r = H.get(e);
		r || (r = W(e), H.set(e, r)), await r;
	}
}
async function W(e) {
	try {
		let t = await import(
			/* @vite-ignore */
			e
), n = t.default?.register ?? t.register;
		if (typeof n != "function") {
			console.warn(`[webmapx] Plugin has no register() export: ${e}`);
			return;
		}
		await n(V);
	} catch (t) {
		console.error(`[webmapx] Failed to load plugin: ${e}`, t);
	}
}
//#endregion
//#region src/bootstrap/locale-loader.ts
var G = "https://cdn.jsdelivr.net/npm/@edugis-org/webmapx@0.2.15/src/locales";
async function K(e) {
	if (h.hasResourceBundle(e, "webmapx")) {
		await h.changeLanguage(e);
		return;
	}
	try {
		let t = `${G}/${e}/core.json`, n = await fetch(t).then((e) => {
			if (!e.ok) throw Error(`HTTP ${e.status}`);
			return e.json();
		});
		h.addResourceBundle(e, "webmapx", n), await h.changeLanguage(e);
	} catch (t) {
		console.error(`[webmapx] Failed to load locale "${e}", falling back to EN`, t);
	}
}
//#endregion
//#region src/utils/config-edit-mode.ts
var q = "configedit";
function J(e) {
	return e !== null && e !== "" && e !== "false" && e !== "0";
}
function Y(e) {
	let t = new URLSearchParams(window.location.search), n = t.get(`${q}.${e}`);
	return n === null ? e === 0 ? J(t.get(q)) : !1 : J(n);
}
//#endregion
//#region src/bootstrap/resolve-init-options.ts
async function X(e) {
	let { mapConfig: t, permalinkState: n, fallbackViewport: r, fallbackProjection: i } = e, a = t.style, o = typeof a == "string", s = {
		center: t.center ?? [0, 0],
		zoom: t.zoom ?? 2,
		...t.bearing == null ? {} : { bearing: t.bearing },
		...t.pitch == null ? {} : { pitch: t.pitch },
		...t.minZoom == null ? {} : { minZoom: t.minZoom },
		...t.maxZoom == null ? {} : { maxZoom: t.maxZoom },
		...t.minPitch == null ? {} : { minPitch: t.minPitch },
		...t.maxPitch == null ? {} : { maxPitch: t.maxPitch },
		...t.maxBounds == null ? {} : { maxBounds: t.maxBounds },
		...t.backgroundColor == null ? {} : { backgroundColor: t.backgroundColor },
		...o ? { styleUrl: a } : { style: a }
	};
	if (n?.v) {
		let [e, t, r, i, a] = n.v;
		s.center = [e, t], s.zoom = r, i === 0 ? delete s.bearing : s.bearing = i, a === 0 ? delete s.pitch : s.pitch = a;
	} else r && (s.center = r.center, s.zoom = r.zoom);
	let c = n?.p ?? i ?? t.projection ?? null;
	if (c && (s.projection = c, o)) try {
		s.style = await (await fetch(a)).json(), delete s.styleUrl;
	} catch (e) {
		console.warn("[webmapx] Failed to fetch style for projection injection:", e);
	}
	return s;
}
//#endregion
//#region src/bootstrap/inject-config-edit-tool.ts
async function Z(e) {
	await import("./webmapx-config-edit-tool-Br72cyd9.js");
	let t = e.querySelector("webmapx-layout");
	t || (t = document.createElement("webmapx-layout"), e.appendChild(t));
	let n = t.querySelector("webmapx-control-group[slot=\"top-left\"]"), r = n?.querySelector("webmapx-toolbar"), i = n?.querySelector("webmapx-tool-panel");
	if (n || (n = document.createElement("webmapx-control-group"), n.setAttribute("slot", "top-left"), n.setAttribute("orientation", "vertical"), n.setAttribute("panel-position", "after"), r = document.createElement("webmapx-toolbar"), i = document.createElement("webmapx-tool-panel"), n.appendChild(r), n.appendChild(i), t.appendChild(n)), r || (r = document.createElement("webmapx-toolbar"), n.prepend(r)), i || (i = document.createElement("webmapx-tool-panel"), n.appendChild(i)), !r.querySelector("[name=\"settings\"]")) {
		await import("./webmapx-settings-Db60VvgL.js");
		let e = document.createElement("sl-button");
		e.setAttribute("name", "settings"), e.setAttribute("circle", ""), e.title = "Settings", e.innerHTML = "<sl-icon name=\"gear\"></sl-icon>", r.appendChild(e);
		let t = document.createElement("webmapx-settings");
		t.setAttribute("tool-id", "settings"), i.appendChild(t);
	}
	if (!r.querySelector("[name=\"configedit\"]")) {
		let e = document.createElement("sl-button");
		e.setAttribute("name", "configedit"), e.setAttribute("circle", ""), e.title = "Edit config", e.innerHTML = "<sl-icon name=\"pencil-square\"></sl-icon>", r.appendChild(e);
		let t = document.createElement("webmapx-config-edit-tool");
		t.setAttribute("tool-id", "configedit"), i.appendChild(t);
	}
}
//#endregion
//#region src/bootstrap/WebMapX.ts
var Q = "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2/cdn/", $ = {
	version: 8,
	sources: {},
	layers: []
};
function ee(e) {
	return { mainToolbar: {
		type: "toolbar",
		enabled: !0,
		position: "top-left",
		items: e.map((e) => ({
			type: e,
			id: e
		}))
	} };
}
var te = class {
	static async mount(e, t) {
		let n = t.configUrl, r;
		if (typeof t.config == "string") {
			let e = await fetch(t.config);
			if (!e.ok) throw Error(`[webmapx] Failed to load config: ${t.config}`);
			r = await e.json(), n = e.url;
		} else r = t.config;
		v(Q), await p();
		let i = r.map?.type, a = r.engine ?? i ?? "maplibre", o = Array.isArray(r.tools) ? r.tools : [], s = o.length > 0 ? o : C(r.tools);
		await U(r.plugins, n), await Promise.all([b(a), S(s)]), r.locale && r.locale !== "en" && await K(r.locale);
		let c = document.querySelector(e);
		if (!c) throw Error(`[webmapx] Mount target not found: "${e}"`);
		let d = `${e.replace(/^#/, "").replace(/[^a-zA-Z0-9_-]/g, "-") || "map"}-webmapx`;
		c.innerHTML = `<webmapx-map id="${d}" adapter="${a}"></webmapx-map>`;
		let f = c.querySelector("webmapx-map"), m = r.map, { engine: h, tools: g, locale: _, plugins: y, ...x } = r, w = o.length > 0 ? ee(o) : typeof g == "object" && !Array.isArray(g) ? g : void 0, T = B({
			...x,
			map: {
				type: a,
				center: [0, 0],
				zoom: 2,
				...m
			},
			...w ? { tools: w } : {}
		}, "WebMapX.mount", n);
		f.setConfig(T);
		let E = await f.getAdapterAsync?.();
		if (!E) {
			console.error("[webmapx] Adapter not available — check engine config.");
			return;
		}
		let D = m?.style ?? $, O = T.runtimeMap, k = l(u(f)), A = await X({
			mapConfig: {
				center: m?.center,
				zoom: m?.zoom,
				bearing: m?.bearing,
				pitch: m?.pitch,
				minZoom: O?.minZoom ?? m?.minZoom,
				maxZoom: O?.maxZoom ?? m?.maxZoom,
				minPitch: O?.minPitch ?? m?.minPitch,
				maxPitch: O?.maxPitch ?? m?.maxPitch,
				maxBounds: O?.maxBounds,
				style: D,
				projection: m?.projection,
				backgroundColor: m?.backgroundColor
			},
			permalinkState: k
		});
		E.initialize(d, A);
		let j = document.createElement("webmapx-layout");
		f.appendChild(j);
		let { buildLayoutFromConfig: M } = await import("./dynamic-layout-CCengkG9.js");
		M(j, w ?? T.tools), (r._devTools?.configedit === !0 || Y(0)) && await Z(f);
	}
	static async enableConfigEditTool(e) {
		let t = document.querySelector(`${e} webmapx-map:not([data-webmapx-role])`) ?? document.querySelector(e);
		if (!t) throw Error(`[webmapx] enableConfigEditTool: no element found for "${e}"`);
		await Z(t);
	}
};
//#endregion
export { te as WebMapX, d as WebmapxBaseTool, K as changeLocale, h as i18n, r as registerTool, m as t };
