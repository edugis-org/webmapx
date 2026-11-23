import { c as e, d as t, f as n, r } from "./tool-accent-D6W4FrKq.js";
import { c as i, d as a, h as o, p as s, s as c } from "./decorators-d8E4nZJy.js";
import { c as l, s as u } from "./decorate-DL2uLwAE.js";
import { a as d } from "./geojson-loader-BE_qRrHw.js";
import { n as f, t as p } from "./toast-TfUb6k7K.js";
import { t as m } from "./webmapx-base-tool-BbTO-iew.js";
import { t as h } from "./webmapx-modal-tool-S-Vg2P9c.js";
import { n as ee, r as g, t as _ } from "./i18n-CGHqJhxf.js";
import { t as v } from "./validator-D2HGztUT.js";
import { r as y } from "./apikeys-DZr_uV_2.js";
import { n as b } from "./chunk.3Y6SB6QS-DUJ8Ickw.js";
//#region src/bootstrap/engine-loader.ts
var x = {
	maplibre: () => import("./maplibre-adapter-r4KbdCXM.js"),
	openlayers: () => import("./openlayers-adapter-DEKtiBIi.js"),
	leaflet: () => import("./leaflet-adapter-DXguAqbj.js"),
	cesium: () => import("./cesium-adapter-BfsJqZoa.js")
};
async function S(e) {
	let t = x[e];
	if (!t) throw Error(`[webmapx] Unknown engine: "${e}". Valid: ${Object.keys(x).join(", ")}`);
	await t();
}
//#endregion
//#region src/bootstrap/tool-loader.ts
var C = {
	draw: () => import("./webmapx-draw-tool-Dgzj3Wvh.js"),
	measure: () => import("./webmapx-measure-tool-YAJGKYSz.js"),
	print: () => import("./webmapx-print-tool-CM95q15j.js"),
	"import-layer": () => import("./webmapx-import-layer-tool-DQ2MXe34.js"),
	search: () => import("./webmapx-search-tool-BOBZt4VT.js"),
	geolocation: () => import("./webmapx-geolocation-tool-D24amfIe.js"),
	info: () => import("./webmapx-info-tool-D9K_xnjf.js"),
	"street-photos": () => import("./webmapx-street-photos-tool-BYCOd2_q.js"),
	maplanguage: () => import("./webmapx-language-osmvector-djezVG7e.js"),
	"3d": () => import("./webmapx-3d-tool-HHik1feI.js"),
	truearea: () => import("./webmapx-truearea-tool-q1B5j1N_.js"),
	projection: () => import("./webmapx-projection-tool-xeHJVTEt.js"),
	timeSlider: () => import("./webmapx-time-slider-tool-B66d_BoW.js"),
	deeptime: () => import("./webmapx-deeptime-tool-DCC7-WR1.js"),
	sealevel: () => import("./webmapx-sealevel-tool-CC8N2jh7.js"),
	compare: () => import("./webmapx-compare-tool-CSHeI1JB.js"),
	cartogram: () => import("./webmapx-cartogram-tool-Cuqw7b2A.js"),
	coordinates: () => import("./webmapx-coordinates-tool-Dv13nhf7.js"),
	megaSlider: () => import("./webmapx-mega-slider-FIFVGujU.js"),
	megaReset: () => import("./webmapx-mega-reset-7I_Sf4N3.js"),
	megaCompare: () => import("./webmapx-mega-compare-5W5G43Hp.js"),
	settings: () => import("./webmapx-settings-CZhBVV9I.js"),
	routing: () => import("./webmapx-routing-tool-DsCG-4tK.js"),
	isochrone: () => import("./webmapx-isochrone-tool-CAefippc.js"),
	buffer: () => import("./webmapx-buffer-tool-Oz4YwZIi.js"),
	geoprocessing: () => import("./webmapx-geoprocessing-tool-Cj0GRWS_.js"),
	"data-analyzer": () => import("./webmapx-data-analyzer-tool-C22WDUQ8.js"),
	"config-edit": () => import("./webmapx-config-edit-tool-4GXTkikw.js"),
	stories: () => import("./webmapx-stories-tool-v4rryM2h.js"),
	layerLegend3d: () => import("./webmapx-layer-legend3d-Cnzckbos.js")
};
async function w(n) {
	await import("./webmapx-core-bundle-bJ31X_l5.js"), await Promise.all(n.map((n) => {
		let i = t(n), a = C[i];
		return a ? a() : (!r.has(i) && !e.has(i) && console.warn(`[webmapx] Unknown tool: "${n}" — skipped`), Promise.resolve());
	}));
}
function te(e) {
	if (!e) return [];
	let t = [], n = (e, r) => {
		if (typeof e.type == "string" ? e.type !== "toolbar" && t.push(e.type) : r !== null && t.push(r), Array.isArray(e.items)) for (let t of e.items) t && typeof t == "object" && n(t, null);
	};
	for (let [t, r] of Object.entries(e)) !r || typeof r != "object" || n(r, t);
	return t;
}
//#endregion
//#region src/bootstrap/plugin-url.ts
var T = [
	"https://cdn.jsdelivr.net/npm/",
	"https://unpkg.com/",
	"https://esm.sh/"
];
function E(e, t, n = typeof location < "u" ? location.origin : null) {
	let r;
	try {
		r = new URL(e, t);
	} catch {
		return null;
	}
	return n && r.origin === n || T.some((e) => r.href.startsWith(e)) ? r.href : null;
}
//#endregion
//#region src/config/loader.ts
function D(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function O(e, t) {
	let n = /^(pmtiles|geoparquet|cog|portolan):\/\//.exec(e)?.[0];
	if (n) return `${n}${O(e.slice(n.length), t)}`;
	if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(e)) return e;
	try {
		let n = new URL(e, t).toString();
		return e.includes("{") ? n.replace(/%7B([\w-]+)%7D/gi, "{$1}") : n;
	} catch {
		return e;
	}
}
function k(e, t) {
	if (!e.startsWith("internalfunc://")) return e;
	let [n, r] = e.split("?");
	if (!r) return e;
	let i = new URLSearchParams(r), a = i.get("data");
	return a ? (i.set("data", O(a, t)), `${n}?${i.toString().replace(/%7B/gi, "{").replace(/%7D/gi, "}")}`) : e;
}
function A(e) {
	let { id: t, ...n } = e;
	return n;
}
function j(e, t, n) {
	if (!D(t)) return {
		id: e,
		type: "geojson",
		data: t
	};
	let r = {
		id: e,
		...t
	};
	if (r.type === "raster" && r.url === void 0 && Array.isArray(r.tiles) && (r.url = r.tiles), r.type === "raster" && r.service === void 0 && (r.service = "xyz"), r.type === "geojson" && r.service === void 0 && typeof r.data == "string") {
		let e = d(r.data);
		e && (r.service = "wfs", r.wfsVersion === void 0 && (r.wfsVersion = e.version));
	}
	return typeof r.data == "string" && (r.data = r.data.startsWith("internalfunc://") ? k(r.data, n) : O(r.data, n)), typeof r.url == "string" ? r.url = O(r.url, n) : Array.isArray(r.url) && (r.url = r.url.map((e) => typeof e == "string" ? O(e, n) : e)), Array.isArray(r.tiles) && (r.tiles = r.tiles.map((e) => typeof e == "string" ? O(e, n) : e)), r;
}
function M(e, t) {
	return D(e) ? Object.entries(e).map(([e, n]) => j(e, n, t)) : [];
}
function N(e, t) {
	let n = typeof e.source == "string" ? t?.get(e.source) ?? e.source : void 0, r = e["source-layer"] ?? e.sourceLayer, i = e.minzoom ?? e.minZoom, a = e.maxzoom ?? e.maxZoom, o = { ...e };
	return n !== void 0 && (o.source = n), r !== void 0 && (o["source-layer"] = r), i !== void 0 && (o.minzoom = i), a !== void 0 && (o.maxzoom = a), delete o.sourceLayer, delete o.minZoom, delete o.maxZoom, o;
}
function P(e, t, n) {
	return Array.isArray(e) ? e.filter(D).map((e) => F(e, t, n)) : D(e) ? Object.entries(e).map(([e, r]) => D(r) ? F({
		id: e,
		...r
	}, t, n) : null).filter(Boolean) : [];
}
function F(e, t, n) {
	let r = typeof e.id == "string" ? e.id : null;
	if (!r) return null;
	let i = typeof e.fallbackLayerId == "string" ? e.fallbackLayerId : typeof e.fallbackRef == "string" ? e.fallbackRef : void 0, a = typeof e.singleGroup == "string" ? e.singleGroup : typeof e.selectionGroup == "string" ? e.selectionGroup : void 0, o = D(e.metadata) ? {
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
		if (D(e.sources)) for (let [o, s] of Object.entries(e.sources)) {
			let e = `${r}:${o}`;
			a.set(o, e);
			let c = j(e, s, n);
			t.push(c), i[o] = A(c);
		}
		let o = Array.isArray(e.layers) ? e.layers.filter(D).map((e) => N(e, a)) : [];
		return {
			...s,
			type: "style",
			...typeof e.url == "string" ? { url: O(e.url, n) } : {},
			sources: i,
			layers: o
		};
	}
	let c = e.type === "background";
	if (typeof e.type == "string" && (typeof e.source == "string" || c) && !e.layerset && !e.style) {
		let t = e["source-layer"] ?? e.sourceLayer, n = e.minzoom ?? e.minZoom, r = e.maxzoom ?? e.maxZoom, i = { ...s };
		return t !== void 0 && (i["source-layer"] = t), n !== void 0 && (i.minzoom = n), r !== void 0 && (i.maxzoom = r), delete i.sourceLayer, delete i.minZoom, delete i.maxZoom, i;
	}
	if (Array.isArray(e.layerset)) {
		let t = e.layerset.filter(D).map((e) => N(e));
		return {
			...s,
			type: "style",
			layers: t,
			layerset: void 0
		};
	}
	if (D(e.style)) {
		let i = e.style, a = /* @__PURE__ */ new Map(), o = {};
		if (D(i.sources)) for (let [e, s] of Object.entries(i.sources)) {
			let i = `${r}:${e}`;
			a.set(e, i);
			let c = j(i, s, n);
			t.push(c), o[e] = A(c);
		}
		let c = Array.isArray(i.layers) ? i.layers.filter(D).map((e) => N(e, a)) : [], l = typeof i.url == "string" ? O(i.url, n) : void 0;
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
function ne(e, t) {
	let n = (e) => {
		let t = e.selectionMode;
		if (t === "single" || t === "multiple") return t;
	}, r = (e) => typeof e.selectionGroup == "string" ? e.selectionGroup : void 0, i = (e) => typeof e.allowNone == "boolean" ? e.allowNone : void 0, a = (e) => typeof e.stackOrder == "number" && Number.isFinite(e.stackOrder) ? e.stackOrder : void 0, o = (e) => {
		if (!D(e)) return null;
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
	if (!D(e)) return t.map((e) => !D(e) || typeof e.id != "string" ? null : {
		label: e.id,
		layerId: e.id
	}).filter(Boolean);
	let s = Object.values(e).find((e) => D(e)), c = (Array.isArray(s?.items) ? s.items : []).map(o).filter((e) => e !== null);
	return c.length > 0 ? c : t.map((e) => !D(e) || typeof e.id != "string" ? null : {
		label: e.id,
		layerId: e.id
	}).filter(Boolean);
}
function I(e, t) {
	if (!D(e)) return;
	let n = JSON.parse(JSON.stringify(e)), r = (e) => {
		typeof e.data == "string" && e.data.length > 0 && (e.data = O(e.data, t));
		for (let t of Object.values(e)) if (Array.isArray(t)) for (let e of t) D(e) && r(e);
	};
	for (let e of Object.values(n)) D(e) && r(e);
	return n;
}
function L(e, t) {
	if (!D(e)) return;
	let n = JSON.parse(JSON.stringify(e)), r = Object.values(n).filter((e) => D(e));
	for (let e of r) {
		let r = Array.isArray(e.items) ? e.items : [];
		for (let e of r) if (D(e) && e.type === "layerTree") return Array.isArray(e.tree) && e.tree.length > 0 || (e.tree = t), delete e.catalog, n;
	}
	return n;
}
var R = new Set([
	"request",
	"bbox",
	"width",
	"height",
	"format",
	"transparent",
	"styles",
	"time",
	"bgcolor",
	"exceptions"
]);
function z(e) {
	let t;
	try {
		t = new URL(e);
	} catch {
		return null;
	}
	let n = [...t.searchParams], r = (e) => n.find(([t]) => t.toLowerCase() === e)?.[1];
	if (r("request")?.toLowerCase() !== "getmap") return null;
	let i = r("layers");
	if (!i) return null;
	for (let [e] of n) R.has(e.toLowerCase()) && t.searchParams.delete(e);
	return t.searchParams.set("REQUEST", "GetFeatureInfo"), t.searchParams.set("QUERY_LAYERS", i), t.toString();
}
function B(e, t) {
	if (!D(e)) return {
		sources: [],
		layers: []
	};
	let n = e, r = Array.isArray(n.sources) ? n.sources.filter(D).map((e) => j(typeof e.id == "string" ? e.id : "", e, t)) : M(n.sources, t), i = [], a = P(n.layers, i, t), o = /* @__PURE__ */ new Map();
	for (let e of [...r, ...i]) D(e) && typeof e.id == "string" && !o.has(e.id) && o.set(e.id, e);
	return {
		sources: Array.from(o.values()),
		layers: a.map((e) => {
			if (!D(e)) return e;
			let t = e, n = typeof t.source == "string" ? t.source : null, r = n ? o.get(n) : null;
			if (!r) return e;
			if (r.type === "geojson" && r.service === "wfs" && typeof r.data == "string") {
				let n = D(t.metadata) ? { ...t.metadata } : {};
				return n.queryable === !1 || typeof n.wfsQueryUrl == "string" ? e : (n.wfsQueryUrl = r.data, n.wfsVersion = r.wfsVersion ?? "2.0.0", {
					...t,
					metadata: n
				});
			}
			if (r.type !== "raster") return e;
			let i = D(t.metadata) ? { ...t.metadata } : {};
			if (typeof i.getFeatureInfoUrl == "string" || i.queryable === !1) return e;
			if (r.service !== "wms") {
				let n = Array.isArray(r.url) ? r.url[0] : r.url ?? (Array.isArray(r.tiles) ? r.tiles[0] : void 0), a = typeof n == "string" ? z(n) : null;
				return a ? (i.getFeatureInfoUrl = a, i.getFeatureInfoFormat = "application/json", {
					...t,
					metadata: i
				}) : e;
			}
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
function V(e, t) {
	return !D(e) || !Array.isArray(e.stories) ? e : {
		...e,
		stories: e.stories.map((e) => !D(e) || !Array.isArray(e.chapters) ? e : {
			...e,
			chapters: e.chapters.map((e) => !D(e) || !Array.isArray(e.steps) ? e : {
				...e,
				steps: e.steps.map((e) => !D(e) || typeof e.htmlUrl != "string" ? e : {
					...e,
					htmlUrl: O(e.htmlUrl, t)
				})
			})
		})
	};
}
function H(e, t) {
	if (!D(e)) return e;
	let n = e, r = n.stories === void 0 ? void 0 : V(n.stories, t), i = I(n.tools, t), a = t, o = O(typeof n.apiKeysFile == "string" && n.apiKeysFile.trim() ? n.apiKeysFile.trim() : "./apikeys.json", t);
	if (y(o), D(n.layerData)) return {
		...n,
		layerData: B(n.layerData, t),
		baseUrl: a,
		apiKeysFile: o,
		...i === void 0 ? {} : { tools: i },
		...r === void 0 ? {} : { stories: r }
	};
	if (D(n.catalog)) {
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
	if (!D(n.library)) return {
		...n,
		baseUrl: a,
		apiKeysFile: o,
		...r === void 0 ? {} : { stories: r }
	};
	let s = n.library, c = M(s.sources, t), l = P(s.layers, c, t), u = ne(s.catalogs, l), d = L(i ?? n.tools, u);
	return {
		map: n.map,
		runtimeMap: D(n.runtimeMap) ? n.runtimeMap : void 0,
		layerData: {
			sources: c,
			layers: l
		},
		tools: d,
		baseUrl: a,
		apiKeysFile: o,
		state: D(n.state) ? n.state : void 0,
		version: typeof n.version == "number" ? n.version : void 0,
		project: D(n.project) ? n.project : void 0,
		...Array.isArray(n.plugins) ? { plugins: n.plugins } : {},
		...r === void 0 ? {} : { stories: r }
	};
}
function U(e, t, n = typeof document < "u" ? document.baseURI : "http://localhost/") {
	let r = H(e, n), i = v(r);
	if (!i.valid) {
		let e = i.errors.map((e) => `  ${e.path}: ${e.message}`).join("\n");
		throw Error(`Invalid config from "${t}":\n${e}`);
	}
	return i.warnings.length > 0 && (console.warn(`[config] Warnings for "${t}":`), i.warnings.forEach((e) => console.warn(`  ${e.path}: ${e.message}`))), r;
}
//#endregion
//#region src/bootstrap/plugin-loader.ts
var W = Object.freeze({
	registerTool: n,
	WebmapxBaseTool: m,
	WebmapxModalTool: h,
	LitElement: c,
	html: s,
	css: o,
	svg: a,
	nothing: i,
	i18n: _,
	t: g
}), G = /* @__PURE__ */ new Map();
async function K(e, t = typeof document < "u" ? document.baseURI : "") {
	if (Array.isArray(e)) for (let n of e) {
		if (typeof n != "string" || !n.trim()) continue;
		let e = E(n.trim(), t);
		if (!e) {
			console.warn(`[webmapx] Plugin skipped — not same-origin and not from a trusted CDN: ${n}`), console.warn("[webmapx] Allowed CDNs: " + T.join(", "));
			continue;
		}
		let r = G.get(e);
		r || (r = q(e), G.set(e, r)), await r;
	}
}
async function q(e) {
	try {
		let t = await import(
			/* @vite-ignore */
			e
), n = t.default?.register ?? t.register;
		if (typeof n != "function") {
			console.warn(`[webmapx] Plugin has no register() export: ${e}`);
			return;
		}
		await n(W);
	} catch (t) {
		console.error(`[webmapx] Failed to load plugin: ${e}`, t);
	}
}
//#endregion
//#region src/bootstrap/locale-loader.ts
var J = "https://cdn.jsdelivr.net/npm/@edugis-org/webmapx@0.2.15/src/locales";
async function Y(e) {
	if (_.hasResourceBundle(e, "webmapx")) {
		await _.changeLanguage(e);
		return;
	}
	try {
		let t = `${J}/${e}/core.json`, n = await fetch(t).then((e) => {
			if (!e.ok) throw Error(`HTTP ${e.status}`);
			return e.json();
		});
		_.addResourceBundle(e, "webmapx", n), await _.changeLanguage(e);
	} catch (t) {
		console.error(`[webmapx] Failed to load locale "${e}", falling back to EN`, t);
	}
}
//#endregion
//#region src/utils/config-edit-mode.ts
var X = "configedit";
function Z(e) {
	return e !== null && e !== "" && e !== "false" && e !== "0";
}
function re(e) {
	let t = new URLSearchParams(window.location.search), n = t.get(`${X}.${e}`);
	return n === null ? e === 0 ? Z(t.get(X)) : !1 : Z(n);
}
//#endregion
//#region src/bootstrap/resolve-init-options.ts
async function Q(e) {
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
async function $(e) {
	await import("./webmapx-config-edit-tool-4GXTkikw.js");
	let t = e.querySelector("webmapx-layout");
	t || (t = document.createElement("webmapx-layout"), e.appendChild(t));
	let n = t.querySelector("webmapx-control-group[slot=\"top-left\"]"), r = n?.querySelector("webmapx-toolbar"), i = n?.querySelector("webmapx-tool-panel");
	if (n || (n = document.createElement("webmapx-control-group"), n.setAttribute("slot", "top-left"), n.setAttribute("orientation", "vertical"), n.setAttribute("panel-position", "after"), r = document.createElement("webmapx-toolbar"), i = document.createElement("webmapx-tool-panel"), n.appendChild(r), n.appendChild(i), t.appendChild(n)), r || (r = document.createElement("webmapx-toolbar"), n.prepend(r)), i || (i = document.createElement("webmapx-tool-panel"), n.appendChild(i)), !r.querySelector("[name=\"settings\"]")) {
		await import("./webmapx-settings-CZhBVV9I.js");
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
var ie = "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2/cdn/", ae = {
	version: 8,
	sources: {},
	layers: []
};
function oe(e) {
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
async function se(e) {
	let t;
	try {
		let n = await fetch(e);
		if (n.ok) try {
			return {
				config: await n.json(),
				url: n.url
			};
		} catch {
			t = "The file is not valid JSON.";
		}
		else t = `The server answered ${n.status}${n.statusText ? ` ${n.statusText}` : ""}.`;
	} catch (e) {
		t = `It could not be fetched (${e instanceof Error ? e.message : String(e)}).`;
	}
	throw f(`<strong>Failed to load config</strong><br>${p(e)}<br>${p(t)}`, { variant: "danger" }), Error(`[webmapx] Failed to load config: ${e} — ${t}`);
}
var ce = class {
	static async mount(e, t) {
		let n = t.configUrl, r;
		b(ie), typeof t.config == "string" ? {config: r, url: n} = await se(t.config) : r = t.config, await ee();
		let i = r.map?.type, a = r.engine ?? i ?? "maplibre", o = Array.isArray(r.tools) ? r.tools : [], s = o.length > 0 ? o : te(r.tools);
		await K(r.plugins, n), await Promise.all([S(a), w(s)]), r.locale && r.locale !== "en" && await Y(r.locale);
		let c = document.querySelector(e);
		if (!c) throw Error(`[webmapx] Mount target not found: "${e}"`);
		let d = `${e.replace(/^#/, "").replace(/[^a-zA-Z0-9_-]/g, "-") || "map"}-webmapx`;
		c.innerHTML = `<webmapx-map id="${d}" adapter="${a}"></webmapx-map>`;
		let f = c.querySelector("webmapx-map"), p = r.map, { engine: m, tools: h, locale: g, plugins: _, ...v } = r, y = o.length > 0 ? oe(o) : typeof h == "object" && !Array.isArray(h) ? h : void 0, x = U({
			...v,
			map: {
				type: a,
				center: [0, 0],
				zoom: 2,
				...p
			},
			...y ? { tools: y } : {}
		}, "WebMapX.mount", n);
		f.setConfig(x);
		let C = await f.getAdapterAsync?.();
		if (!C) {
			console.error("[webmapx] Adapter not available — check engine config.");
			return;
		}
		let T = p?.style ?? ae, E = x.runtimeMap, D = l(u(f)), O = await Q({
			mapConfig: {
				center: p?.center,
				zoom: p?.zoom,
				bearing: p?.bearing,
				pitch: p?.pitch,
				minZoom: E?.minZoom ?? p?.minZoom,
				maxZoom: E?.maxZoom ?? p?.maxZoom,
				minPitch: E?.minPitch ?? p?.minPitch,
				maxPitch: E?.maxPitch ?? p?.maxPitch,
				maxBounds: E?.maxBounds,
				style: T,
				projection: p?.projection,
				backgroundColor: p?.backgroundColor
			},
			permalinkState: D
		});
		C.initialize(d, O);
		let k = document.createElement("webmapx-layout");
		f.appendChild(k);
		let { buildLayoutFromConfig: A } = await import("./dynamic-layout-CI_-dFlk.js");
		A(k, y ?? x.tools), (r._devTools?.configedit === !0 || re(0)) && await $(f);
	}
	static async enableConfigEditTool(e) {
		let t = document.querySelector(`${e} webmapx-map:not([data-webmapx-role])`) ?? document.querySelector(e);
		if (!t) throw Error(`[webmapx] enableConfigEditTool: no element found for "${e}"`);
		await $(t);
	}
};
//#endregion
export { ce as WebMapX, m as WebmapxBaseTool, Y as changeLocale, _ as i18n, n as registerTool, g as t };
