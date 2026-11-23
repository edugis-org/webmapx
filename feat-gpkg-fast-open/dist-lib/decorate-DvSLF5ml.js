import { p as e } from "./appearance-8d96KWh4.js";
import { a as t, r as n } from "./map-clock-BmIiPfc8.js";
import { i as r, n as i } from "./geojson-loader-BE_qRrHw.js";
import { n as a } from "./toast-TfUb6k7K.js";
//#region src/map/adapter-registry.ts
var o = /* @__PURE__ */ new Map(), s = "maplibre";
function c(e, t) {
	if (!e || typeof e != "string") {
		console.error("[adapter-registry] Adapter name must be a non-empty string.");
		return;
	}
	o.set(e.toLowerCase(), t);
}
function l() {
	return Array.from(o.keys());
}
async function u(e) {
	let t = (e ?? "maplibre").toLowerCase(), n = o.get(t);
	if (!n) return console.error(`[adapter-registry] No adapter registered under "${t}".`), null;
	try {
		return await n();
	} catch (e) {
		return console.error(`[adapter-registry] Failed to create adapter "${t}".`, e), null;
	}
}
c(s, async () => {
	let { MapLibreAdapter: e } = await import("./maplibre-adapter-r4KbdCXM.js");
	return new e();
}), c("openlayers", async () => {
	let { OpenLayersAdapter: e } = await import("./openlayers-adapter-DEKtiBIi.js");
	return new e();
}), c("ol", async () => {
	let { OpenLayersAdapter: e } = await import("./openlayers-adapter-DEKtiBIi.js");
	return new e();
}), c("leaflet", async () => {
	let { LeafletAdapter: e } = await import("./leaflet-adapter-DXguAqbj.js");
	return new e();
}), c("l", async () => {
	let { LeafletAdapter: e } = await import("./leaflet-adapter-DXguAqbj.js");
	return new e();
}), c("cesium", async () => {
	let { createCesiumAdapter: e } = await import("./cesium-adapter-BfsJqZoa.js");
	return await e();
}), c("c", async () => {
	let { createCesiumAdapter: e } = await import("./cesium-adapter-BfsJqZoa.js");
	return await e();
});
//#endregion
//#region src/config/adapter-resolution.ts
function d(e) {
	if (!e) return null;
	switch (e.toLowerCase()) {
		case "ol": return "openlayers";
		case "l": return "leaflet";
		case "c": return "cesium";
		default: return e.toLowerCase();
	}
}
function f(e, t, n) {
	return e ? `webmapx-${t}:${n}:${e}` : null;
}
function p({ explicitAdapter: e, savedAdapter: t, configuredAdapter: n, defaultAdapter: r = "maplibre" }) {
	return d(t) ?? d(e) ?? d(n) ?? d(r) ?? "maplibre";
}
//#endregion
//#region src/map/map-state-persistence.ts
var m = "webmapx-state";
function h(e, t) {
	return `${m}:${t}:${e}`;
}
function g(e, t, n) {
	try {
		sessionStorage.setItem(h(e, t), JSON.stringify(n));
	} catch {}
}
function _(e, t) {
	let n = sessionStorage.getItem(h(e, t));
	if (!n) return null;
	try {
		return JSON.parse(n);
	} catch {
		return null;
	}
}
function ee(e, t) {
	let n = _(e, t);
	return n && sessionStorage.removeItem(h(e, t)), n;
}
var v = "config";
function y(e) {
	return e === 0 ? "s" : `s.${e}`;
}
function te(e) {
	return e === 0 ? v : `${v}.${e}`;
}
function ne(e) {
	let t = new URLSearchParams(window.location.search), n = t.get(`${v}.${e}`);
	return n === null ? e === 0 ? t.get(v) : null : n;
}
function b(e) {
	let t = Array.from(document.querySelectorAll("webmapx-map")).indexOf(e);
	return t >= 0 ? t : 0;
}
function x(e) {
	return btoa(JSON.stringify(e));
}
function re(e) {
	try {
		let t = JSON.parse(atob(e));
		return !t || typeof t != "object" || !Array.isArray(t.l) || !Array.isArray(t.v) || t.v.length !== 5 ? null : t;
	} catch {
		return null;
	}
}
function S(e) {
	let t = new URLSearchParams(window.location.search), n = t.get(`s.${e}`) ?? (e === 0 ? t.get("s") : null);
	return n ? re(n) : null;
}
function C() {
	let e = new URLSearchParams(window.location.search).get("cmp");
	if (e === null) return null;
	let t = Number(e);
	return Number.isFinite(t) ? Math.min(100, Math.max(0, t)) : null;
}
function w(e) {
	let { layerIds: t, hiddenLayerIds: n, viewport: r, transparencyOverrides: i, projection: a, terrainEnabled: o, time: s, tools: c } = e, l = {};
	for (let [e, t] of i) t !== 0 && (l[e] = t);
	let u = {
		l: t,
		v: [
			Math.round(r.center[0] * 1e6) / 1e6,
			Math.round(r.center[1] * 1e6) / 1e6,
			Math.round(r.zoom * 100) / 100,
			Math.round(r.bearing * 10) / 10,
			Math.round(r.pitch * 10) / 10
		]
	};
	return n.length > 0 && (u.h = n), Object.keys(l).length > 0 && (u.t = l), a && a !== "mercator" && (u.p = a), o && (u.terrain = !0), typeof s?.at == "number" && Number.isFinite(s.at) && (u.tm = Math.round(s.at / 1e3), typeof s.play == "number" && s.play > 0 && (u.tp = s.play / 1e3)), c && Object.keys(c).length > 0 && (u.x = c), u;
}
function ie(e, t, n, r, i, a, o, s, c, l, u) {
	let d = w({
		layerIds: t,
		hiddenLayerIds: n,
		viewport: r,
		transparencyOverrides: i,
		projection: a,
		terrainEnabled: s,
		time: c,
		tools: u
	}), f = new URL(window.location.href), p = y(e);
	if (f.searchParams.set(p, x(d)), e === 0 && f.searchParams.delete("s.0"), o) {
		let t = te(e);
		f.searchParams.set(t, o), e === 0 && f.searchParams.delete(`${v}.0`);
	}
	return l ? (f.searchParams.set(y(1), x(l.state)), f.searchParams.set("cmp", String(Math.round(l.split)))) : (f.searchParams.delete(y(1)), f.searchParams.delete("cmp")), f.toString();
}
//#endregion
//#region src/tools/tool-manager.ts
var ae = class extends EventTarget {
	constructor(...e) {
		super(...e), this.tools = /* @__PURE__ */ new Map(), this._activeToolId = null, this.store = null;
	}
	setStore(e) {
		this.store = e;
	}
	register(e) {
		this.tools.set(e.instanceId, e);
	}
	unregister(e) {
		this._activeToolId === e && this.deactivate(), this.tools.delete(e);
	}
	activate(e) {
		let t = this.tools.get(e);
		if (!t) return console.warn(`Tool "${e}" not found`), !1;
		if (this._activeToolId === e) return !0;
		let n = this._activeToolId, r = n ? this.tools.get(n) ?? null : null;
		return r && n !== e && t.isModal && (this._activeToolId = null, r.active = !1, this.updateStoreActiveTool(null), this.dispatchDeactivatedEvent(n, r)), this._activeToolId = e, t.active = !0, this.updateStoreActiveTool(e, t), this.dispatchActivatedEvent(e, t), !0;
	}
	deactivate(e) {
		let t = e ?? this._activeToolId;
		if (!t) return;
		let n = this.tools.get(t);
		n && this._activeToolId === t && (this._activeToolId = null, n.active = !1, this.updateStoreActiveTool(null), this.dispatchDeactivatedEvent(t, n));
	}
	toggle(e) {
		return this._activeToolId === e ? (this.deactivate(e), !1) : this.activate(e);
	}
	get activeTool() {
		return this._activeToolId ? this.tools.get(this._activeToolId) ?? null : null;
	}
	get activeToolId() {
		return this._activeToolId;
	}
	getTool(e) {
		return this.tools.get(e);
	}
	getToolIds() {
		return Array.from(this.tools.keys());
	}
	updateStoreActiveTool(e, t) {
		this.store && this.store.dispatch({ activeTool: e ? {
			toolId: e,
			...t?.label ? { label: t.label } : {},
			...t?.icon ? { icon: t.icon } : {}
		} : null }, "UI");
	}
	dispatchActivatedEvent(e, t) {
		this.dispatchEvent(new CustomEvent("webmapx-tool-activated", { detail: {
			toolId: e,
			tool: t
		} }));
	}
	dispatchDeactivatedEvent(e, t) {
		this.dispatchEvent(new CustomEvent("webmapx-tool-deactivated", { detail: {
			toolId: e,
			tool: t
		} }));
	}
};
//#endregion
//#region src/components/internal/single-group-policy.ts
function oe(e, t, n, r, i, a) {
	let o = r?.[t];
	(o?.legendRole === "background" || o?.legendRole === "overlay") && a.set(e, o.legendRole);
	let s = n.indexOf(t);
	if (s < 0) return;
	let c = n[s + 1], l = n[s - 1];
	if (typeof c == "string" && c.length > 0) {
		i.set(e, { beforeLayerId: c });
		return;
	}
	if (typeof l == "string" && l.length > 0) {
		i.set(e, { afterLayerId: l });
		return;
	}
	i.delete(e);
}
function se(e, t, n, r) {
	let i = r.get(e);
	if (!i) return n;
	let a = new Set(t), o = typeof i.beforeLayerId == "string" && a.has(i.beforeLayerId) ? i.beforeLayerId : void 0, s = typeof i.afterLayerId == "string" && a.has(i.afterLayerId) ? i.afterLayerId : void 0;
	if (!o && !s) return r.delete(e), n;
	let c = {
		...o ? { beforeLayerId: o } : {},
		...s ? { afterLayerId: s } : {},
		...n?.beforeLayerId ? { beforeLayerId: n.beforeLayerId } : {},
		...n?.afterLayerId ? { afterLayerId: n.afterLayerId } : {}
	};
	return Object.keys(c).length > 0 ? c : void 0;
}
//#endregion
//#region src/components/internal/legend-role-policy.ts
function ce(e, t, n, r, i, a) {
	if (t?.legendRole === "background" || t?.legendRole === "overlay") return t.legendRole;
	if (n) {
		let e = r.get(n);
		if (e === "background" || e === "overlay") return e;
	}
	if (!i) return "overlay";
	if (e === i) return "background";
	let o = a.get(i), s = n ?? a.get(e);
	return o && s && o === s ? "background" : "overlay";
}
var le = ["application/vnd.mapbox.style+json", "application/json"], T = "application/vnd.pmtiles", E = "application/vnd.apache.parquet", D = "image/tiff", O = /^(pmtiles|geoparquet|cog|portolan):\/\//, k = (e) => typeof e == "object" && !!e && !Array.isArray(e), A = (e) => typeof e == "string" && e.length > 0 ? e : void 0;
function j(e) {
	return k(e) && e.type === "Collection" && k(e.assets);
}
function M(e, t) {
	let n = O.exec(e)?.[0];
	if (n) return `${n}${M(e.slice(n.length), t)}`;
	try {
		return new URL(e, t).toString().replace(/%7B([\w-]+)%7D/gi, "{$1}");
	} catch {
		return e;
	}
}
function N(e, t) {
	let n = A(e);
	if (!n) return;
	let r = M(n, t);
	return /^https?:\/\//i.test(r) ? r : void 0;
}
function P(e) {
	return Array.isArray(e.roles) ? e.roles.filter((e) => typeof e == "string") : [];
}
function F(e) {
	return (A(e.type) ?? "").split(";")[0].trim().toLowerCase();
}
function ue(e) {
	return (A(e.type) ?? "").toLowerCase();
}
function de(e, t) {
	let n = k(e.assets) ? e.assets : {}, r = [];
	for (let [e, i] of Object.entries(n)) {
		if (!k(i) || !P(i).includes("style")) continue;
		let n = F(i);
		if (n && !le.includes(n)) continue;
		let a = N(i.href, t);
		a && r.push({
			key: e,
			title: A(i.title) ?? e.replace(/^styles\//, ""),
			href: a,
			isDefault: P(i).includes("default")
		});
	}
	let i = e["portolan:styles"] ?? (k(e.properties) ? e.properties["portolan:styles"] : void 0);
	if (Array.isArray(i)) {
		let e = new Set(r.flatMap((e) => [e.key, e.href]));
		for (let a of i) {
			let i = typeof a == "string" && k(n[a]) ? n[a] : void 0, o = i ? N(i.href, t) : k(a) ? N(a.href, t) : void 0, s = typeof a == "string" ? a : k(a) ? A(a.name) ?? o : void 0;
			!o || !s || e.has(s) || e.has(o) || e.has(`styles/${s}`) || (e.add(s).add(o), r.push({
				key: s,
				title: A(i?.title) ?? s,
				href: o,
				isDefault: !1
			}));
		}
	}
	let a = r.findIndex((e) => e.isDefault);
	return a > 0 && r.unshift(...r.splice(a, 1)), a < 0 && r.length > 0 && (r[0] = {
		...r[0],
		isDefault: !0
	}), r;
}
function I(e) {
	let t = k(e.extent) ? e.extent : void 0, n = t && k(t.spatial) ? t.spatial : void 0, r = Array.isArray(n?.bbox) ? n.bbox[0] : void 0;
	if (!(!Array.isArray(r) || !r.every((e) => typeof e == "number" && Number.isFinite(e)))) {
		if (r.length === 4) return r;
		if (r.length === 6) return [
			r[0],
			r[1],
			r[3],
			r[4]
		];
	}
}
function L(e) {
	let t = A(e.attribution), n = (Array.isArray(e.providers) ? e.providers.filter(k) : []).filter((e) => P(e).some((e) => e === "producer" || e === "licensor")).map((e) => A(e.name)).filter((e) => !!e), r = t ?? (n.length > 0 ? [...new Set(n)].join(" / ") : void 0), i = A(e.license), a = i && i !== "other" && i !== "proprietary" ? i : void 0;
	return r ? a ? `© ${r}, ${a}` : `© ${r}` : a;
}
function fe(e, t) {
	return A(e["table:primary_geometry"]) ? !0 : t.some((e) => /^geometry\b/i.test(e.type ?? ""));
}
function R(e, t) {
	let n = k(e.assets) ? e.assets : {}, r = Object.entries(n).filter((e) => k(e[1])), i = (e) => r.find(([, t]) => P(t).includes(e)), a = Array.isArray(e["table:columns"]) ? e["table:columns"].filter(k).flatMap((e) => {
		let t = A(e.name);
		return t ? [{
			name: t,
			type: A(e.type),
			description: A(e.description)
		}] : [];
	}) : [], o = typeof e["table:row_count"] == "number" ? e["table:row_count"] : void 0, s, c = r.find(([, e]) => P(e).includes("visual") && F(e) === T), l = c ? N(c[1].href, t) : void 0;
	if (l) {
		let n = Array.isArray(e.links) ? e.links.filter(k) : [], r = n.find((e) => e.rel === "pmtiles" && N(e.href, t) === l) ?? n.find((e) => e.rel === "pmtiles");
		s = {
			href: l,
			layers: Array.isArray(r?.["pmtiles:layers"]) ? r["pmtiles:layers"].filter((e) => typeof e == "string") : []
		};
	}
	let u, d = i("data"), f = d ? N(d[1].href, t) : void 0;
	if (d && f) {
		let t = F(d[1]), n = t === E ? fe(e, a) ? "geoparquet" : "parquet" : t === D && ue(d[1]).includes("geotiff") ? "cog" : "other", r = typeof d[1]["file:size"] == "number" ? d[1]["file:size"] : void 0;
		u = {
			href: f,
			format: n,
			...r === void 0 ? {} : { size: r }
		};
	}
	let p = "none", m;
	s ? p = "tiles" : u?.format === "geoparquet" ? (o === void 0 ? (u.size ?? Infinity) <= 26214400 : o <= 5e4) ? p = "geoparquet" : m = `too large to draw without map tiles (${o === void 0 ? "size unknown" : `${o} rows`}); the collection has no PMTiles "visual" asset` : u?.format === "cog" ? (p = "raster", m = "raster (COG) collections are not supported yet") : m = u?.format === "parquet" ? "a table without geometry" : "no drawable asset";
	let h = i("thumbnail"), g = h ? N(h[1].href, t) : void 0, _ = A(e.id) ?? t;
	return {
		url: t,
		id: _,
		title: A(e.title) ?? _,
		...A(e.description) ? { description: A(e.description) } : {},
		...A(e.license) ? { license: A(e.license) } : {},
		...L(e) ? { attribution: L(e) } : {},
		...I(e) ? { bbox: I(e) } : {},
		styles: de(e, t),
		...s ? { visual: s } : {},
		...u ? { data: u } : {},
		...g ? { thumbnail: g } : {},
		columns: a,
		...o === void 0 ? {} : { rowCount: o },
		renderPath: p,
		...m ? { notDrawable: m } : {}
	};
}
function z(e) {
	return e.replace(O, "").split(/[?#]/)[0];
}
function B(e) {
	let t = e.attribution ? { attribution: e.attribution } : {};
	return e.renderPath === "tiles" && e.visual ? {
		type: "vector",
		url: `pmtiles://${e.visual.href}`,
		...t
	} : e.renderPath === "geoparquet" && e.data ? {
		type: "geojson",
		data: `geoparquet://${e.data.href}`,
		...t
	} : null;
}
function pe(e, t, n) {
	let r = B(n);
	if (!r) return null;
	let i = new Set([n.visual?.href, n.data?.href].filter((e) => !!e).map(z)), a = k(e.sources) ? e.sources : {}, o = {};
	for (let [e, n] of Object.entries(a)) {
		if (!k(n)) continue;
		let a = A(n.url) ?? A(n.data) ?? (Array.isArray(n.tiles) ? A(n.tiles[0]) : void 0), s = a ? M(a, t) : void 0;
		if (!s || i.has(z(s))) {
			o[e] = { ...r };
			continue;
		}
		let c = { ...n };
		A(n.url) && (c.url = M(n.url, t)), A(n.data) && (c.data = M(n.data, t)), Array.isArray(n.tiles) && (c.tiles = n.tiles.map((e) => typeof e == "string" ? M(e, t) : e)), o[e] = c;
	}
	let s = Array.isArray(e.layers) ? e.layers.filter(k) : [], c = new Set(Object.entries(o).filter(([, e]) => k(e) && e.type === "geojson").map(([e]) => e)), l = s.map((e) => {
		if (typeof e.source == "string" && c.has(e.source) && "source-layer" in e) {
			let { "source-layer": t, ...n } = e;
			return n;
		}
		return e;
	});
	return {
		...e,
		sources: o,
		layers: l,
		...A(e.glyphs) ? { glyphs: M(e.glyphs, t) } : {},
		...A(e.sprite) ? { sprite: M(e.sprite, t) } : {}
	};
}
function me(e) {
	let t = B(e);
	if (!t) return null;
	let n = t.type === "vector" ? e.visual?.layers.length ? e.visual.layers : [e.id.split("/").pop()] : [void 0], r = [
		["fill", ["Polygon", "MultiPolygon"]],
		["line", ["LineString", "MultiLineString"]],
		["circle", ["Point", "MultiPoint"]]
	], i = n.flatMap((e) => r.map(([t, n]) => ({
		id: `${e ?? "data"}-${t}`,
		type: t,
		source: "data",
		...e ? { "source-layer": e } : {},
		filter: [
			"in",
			["geometry-type"],
			["literal", n]
		]
	})));
	return {
		version: 8,
		sources: { data: t },
		layers: i
	};
}
function he(e, t) {
	return {
		...e.description ? { abstract: e.description } : {},
		...e.bbox ? { bounds: e.bbox } : {},
		...e.rowCount === void 0 ? {} : { featureCount: e.rowCount },
		portolan: {
			collectionUrl: e.url,
			...t ? { style: t.key } : {},
			styles: e.styles.map(({ key: e, title: t, isDefault: n }) => ({
				key: e,
				title: t,
				isDefault: n
			})),
			...e.data ? {
				data: e.data.href,
				dataFormat: e.data.format
			} : {},
			...e.visual ? { visual: e.visual.href } : {},
			...e.thumbnail ? { thumbnail: e.thumbnail } : {},
			...e.license ? { license: e.license } : {},
			columns: e.columns
		}
	};
}
function V(e) {
	if (!e.startsWith("portolan://")) return null;
	let t = e.slice(11), n = t.indexOf("#"), r = n >= 0 ? t.slice(0, n) : t, i = n >= 0 ? decodeURIComponent(t.slice(n + 1)) : void 0;
	return /^https?:\/\//i.test(r) ? {
		collectionUrl: r,
		...i ? { styleKey: i } : {}
	} : null;
}
var H = /* @__PURE__ */ new Map();
function U(e) {
	let t = H.get(e);
	return t || (t = (async () => {
		let t = await fetch(e);
		if (!t.ok) throw Error(`HTTP ${t.status} reading ${e}`);
		let n = await t.json();
		if (!j(n)) throw Error(`${e} is not a STAC Collection`);
		return {
			collection: n,
			info: R(n, e)
		};
	})(), H.set(e, t), t.catch(() => {
		H.get(e) === t && H.delete(e);
	})), t;
}
async function W(e) {
	let t = Object.entries(e).filter(([, e]) => e && typeof e.url == "string" && e.url.startsWith("portolan://"));
	await Promise.all(t.map(async ([t, n]) => {
		let r = { ...n }, i = V(r.url);
		if (!i) {
			console.warn(`[webmapx] ${r.url}: portolan:// needs an absolute http(s) collection URL`);
			return;
		}
		let a;
		try {
			({info: a} = await U(i.collectionUrl));
		} catch (e) {
			console.warn(`[webmapx] Portolan collection ${i.collectionUrl} could not be read: ${e.message}`);
			return;
		}
		let o = typeof r.attribution == "string" && r.attribution ? r.attribution : a.attribution;
		if (r.portolanCollection = i.collectionUrl, a.renderPath === "tiles" && a.visual) r.type = "vector", r.url = `pmtiles://${a.visual.href}`;
		else if (a.renderPath === "geoparquet" && a.data) r.type = "geojson", delete r.url, r.data = `geoparquet://${a.data.href}`;
		else {
			console.warn(`[webmapx] Portolan collection ${i.collectionUrl} cannot be drawn: ${a.notDrawable ?? "unknown reason"}`);
			return;
		}
		o && (r.attribution = o), e[t] = r;
	}));
}
//#endregion
//#region src/map/layer-source-resolver.ts
function ge(e, t) {
	if (!t || t.length === 0) return e;
	let n = new Map(t.map((e) => [e.id, e])), r = /* @__PURE__ */ new Set();
	if (typeof e.source == "string" && r.add(e.source), Array.isArray(e.layers)) for (let t of e.layers) typeof t?.source == "string" && r.add(t.source);
	if (r.size === 0) return e;
	let i = e.sources ?? {}, a = {};
	for (let e of r) {
		if (i[e]) continue;
		let t = n.get(e);
		t && (a[e] = { ...t });
	}
	return Object.keys(a).length === 0 ? e : {
		...e,
		sources: {
			...i,
			...a
		}
	};
}
//#endregion
//#region src/utils/layer-definition.ts
function G(e) {
	return !!e && typeof e == "object" && !Array.isArray(e);
}
function K(e) {
	return e === void 0 ? e : JSON.parse(JSON.stringify(e));
}
function _e(e, t, n) {
	if (!t && !n) return null;
	let r = t ?? {}, i = n ? K(n) : {
		id: e,
		type: r.layerType ?? "fill",
		...r.sourceId ? { source: r.sourceId } : {},
		...r.sourceLayer ? { "source-layer": r.sourceLayer } : {}
	};
	if (i.id === void 0 && (i.id = e), Array.isArray(r.sublayers) && r.sublayers.length > 0 ? i.layers = K(r.sublayers) : (G(r.paint) && (i.paint = K(r.paint)), G(r.layout) && (i.layout = K(r.layout))), typeof r.minzoom == "number" && (i.minzoom = r.minzoom), typeof r.maxzoom == "number" && (i.maxzoom = r.maxzoom), typeof r.label == "string" && r.label.length > 0) {
		let e = G(i.metadata) ? { ...i.metadata } : {};
		e.title = r.label, i.metadata = e;
	}
	return {
		layer: i,
		...typeof r.visible == "boolean" ? { visible: r.visible } : {},
		...typeof r.transparency == "number" ? { transparency: r.transparency } : {}
	};
}
//#endregion
//#region src/components/internal/map-accessibility.ts
var q = 100, J = "data-webmapx-a11y", ve = "a, button, input, select, textarea, [role=\"button\"], [role=\"link\"]";
function ye(e) {
	return e.getAttribute(J) !== "focus" && e.tabIndex >= 0 && e.hasAttribute("tabindex") ? !0 : Array.from(e.querySelectorAll("[tabindex]")).some((e) => e.tabIndex >= 0 && !e.closest("[inert]") && !e.matches(ve));
}
function Y(e, t, n) {
	let r = e, i = (n) => {
		if (n.target !== e || n.altKey || n.ctrlKey || n.metaKey || t.getNavigationCapabilities().keyboard) return;
		let r = n.shiftKey ? q * 3 : q, i = 0, a = 0;
		switch (n.key) {
			case "ArrowLeft":
				i = -r;
				break;
			case "ArrowRight":
				i = r;
				break;
			case "ArrowUp":
				a = -r;
				break;
			case "ArrowDown":
				a = r;
				break;
			case "+":
			case "=":
				t.setZoom(t.getZoom() + 1), n.preventDefault();
				return;
			case "-":
			case "_":
				t.setZoom(t.getZoom() - 1), n.preventDefault();
				return;
			default: return;
		}
		let { center: o, zoom: s } = t.getViewportState(), [c, l] = t.project(o), u = t.unproject([c + i, l + a]);
		u && t.setViewport(u, s), n.preventDefault();
	}, a = () => {
		let t = e.querySelector("[role=\"region\"]"), i = t && !t.closest("[inert]") ? t : e;
		i !== r && r === e && (e.removeAttribute("role"), e.removeAttribute("aria-label"), e.removeAttribute("aria-busy")), r = i, r === e && e.setAttribute("role", "region"), r.setAttribute("aria-label", n());
		let a = e.getAttribute(J) === "focus";
		ye(e) ? a && (e.removeAttribute("tabindex"), e.removeAttribute(J)) : a || (e.tabIndex = 0, e.setAttribute(J, "focus"));
	}, o = t.store.subscribe((e) => {
		e.mapBusy ? r.setAttribute("aria-busy", "true") : r.removeAttribute("aria-busy");
	});
	return e.addEventListener("keydown", i), a(), {
		refresh: a,
		dispose() {
			o(), e.removeEventListener("keydown", i), e.getAttribute(J) === "focus" && (e.removeAttribute("tabindex"), e.removeAttribute(J));
		}
	};
}
//#endregion
//#region src/components/webmapx-map.ts
var be = [
	-180,
	-85.0511,
	180,
	85.0511
];
function X(e, t) {
	let n = e && typeof e == "object" ? e : void 0;
	if (Array.isArray(n?.bounds) && n.bounds.length === 4) return e;
	let r = Object.values(t ?? {}).find((e) => e && e.wfsPerView);
	if (!r) return e;
	let i = Array.isArray(r.bounds) && r.bounds.length === 4 ? r.bounds : be;
	return {
		...n ?? {},
		bounds: i
	};
}
var Z = "map-view", xe = "webmapx-map__surface", Se = "adapter", Q = class extends HTMLElement {
	constructor(...e) {
		super(...e), this.initialStateLayersApplied = !1, this.activeAdapterName = null, this.runtimeStyleLayerCounter = 0, this.styleLayerCache = /* @__PURE__ */ new Map(), this.singleGroupInsertSlotByGroup = /* @__PURE__ */ new Map(), this.singleGroupLegendRoleByGroup = /* @__PURE__ */ new Map(), this.logicalLayerOrder = [], this.logicalLayerRole = /* @__PURE__ */ new Map(), this.dynamicLayerRequests = /* @__PURE__ */ new Map(), this.handleFileDragOver = (e) => {
			e.dataTransfer?.types.includes("Files") && (e.preventDefault(), e.dataTransfer.dropEffect = "copy");
		}, this.handleFileDrop = (e) => {
			let t = e.dataTransfer?.files;
			!t || t.length === 0 || (e.preventDefault(), this.handleDroppedFiles(Array.from(t)));
		}, this.currentSurface = null, this.mapAccessibility = null, this.adapterInstance = null, this.adapterPromise = null, this.configInstance = null, this.initialLayersPromise = null, this.toolManagerInstance = null;
	}
	connectedCallback() {
		this.upsertAndStyleSurface(), this.observeSurfaceChanges(), this.addEventListener("add-layer", this.handleLayerAddRequest), this.addEventListener("webmapx-add-layer", this.handleAddLayerEvent), this.addEventListener("webmapx-remove-layer", this.handleRemoveLayerEvent), this.addEventListener("webmapx-add-source", this.handleAddSourceEvent), this.addEventListener("webmapx-remove-source", this.handleRemoveSourceEvent), this.addEventListener("webmapx-set-source-data", this.handleSetSourceDataEvent), this.addEventListener("webmapx-suppress-busy-for-source", this.handleSuppressBusyForSource), this.addEventListener("webmapx-unsuppress-busy-for-source", this.handleUnsuppressBusyForSource), this.addEventListener("dragover", this.handleFileDragOver), this.addEventListener("drop", this.handleFileDrop);
	}
	disconnectedCallback() {
		this.surfaceObserver?.disconnect(), this.mapAccessibility?.dispose(), this.mapAccessibility = null, this.removeEventListener("add-layer", this.handleLayerAddRequest), this.removeEventListener("webmapx-add-layer", this.handleAddLayerEvent), this.removeEventListener("webmapx-remove-layer", this.handleRemoveLayerEvent), this.removeEventListener("webmapx-add-source", this.handleAddSourceEvent), this.removeEventListener("webmapx-remove-source", this.handleRemoveSourceEvent), this.removeEventListener("webmapx-set-source-data", this.handleSetSourceDataEvent), this.removeEventListener("webmapx-suppress-busy-for-source", this.handleSuppressBusyForSource), this.removeEventListener("webmapx-unsuppress-busy-for-source", this.handleUnsuppressBusyForSource), this.removeEventListener("dragover", this.handleFileDragOver), this.removeEventListener("drop", this.handleFileDrop);
	}
	async handleDroppedFiles(e) {
		await this.addFilesAsLayers(e);
	}
	async addFilesAsLayers(e) {
		this.adapter?.store.dispatch({ mapBusy: !0 }, "UI");
		try {
			await this.processDroppedFiles(e);
		} finally {
			this.adapter?.store.dispatch({ mapBusy: !1 }, "UI");
		}
	}
	async tryHandleDroppedConfig(e) {
		if (e.length !== 1) return !1;
		let t = e[0], { sniffFile: n } = await import("./file-sniff-DfzH9H-m.js");
		if ((await n(t)).kind !== "webmapx-config") return !1;
		let { storeDroppedConfig: r } = await import("./dropped-config-C_GyVa8o.js");
		return await r(await t.text()), window.location.reload(), !0;
	}
	async processDroppedFiles(e) {
		if (await this.tryHandleDroppedConfig(e)) return;
		let { sniffBlob: t } = await import("./file-sniff-DfzH9H-m.js"), { groupDroppedFiles: n, buildLayerConfigsFromGroup: r } = await import("./dropped-layer-builder-Ds_BeifK.js"), i = async (e, t) => {
			let { showLayerPickerDialog: n } = await import("./layer-picker-dialog-DsdrAmoA.js");
			return n(e, t);
		}, o = (e, t, n, r) => {
			let i = [`${r}${e} (${(t / 1024).toFixed(1)} KB): ${n.description}`];
			for (let e of n.children ?? []) i.push(...o(e.path, e.size, e.result, r + "  "));
			return i;
		}, s = await n(e), c = [];
		for (let e of s) {
			let n = await r(e, i);
			if (n.length > 0) {
				for (let e of n) {
					if (this.adapter?.hasLayer(e.id)) {
						let t = e.id, n = 1;
						for (; this.adapter.hasLayer(`${t}_${n}`);) n++;
						let r = `${t}_${n}`, i = `${t}:`, a = `${r}:`;
						e.id = r, e.sources = Object.fromEntries(Object.entries(e.sources ?? {}).map(([e, t]) => [e.startsWith(i) ? a + e.slice(i.length) : e, t])), e.layers = (e.layers ?? []).map((e) => ({
							...e,
							id: e.id?.startsWith(i) ? a + e.id.slice(i.length) : e.id,
							source: e.source?.startsWith(i) ? a + e.source.slice(i.length) : e.source
						}));
					}
					Object.keys(e.sources ?? {}).length > 0 && await this.addLayerRequest(e);
				}
				continue;
			}
			for (let n of e) {
				let e = await t(n.blob);
				c.push(...o(n.name, n.blob.size, e, ""));
			}
		}
		c.length > 0 && a(c.join("<br>"), {
			variant: "warning",
			duration: 16e3
		});
	}
	async handleAddLayerEvent(e) {
		let t = e.detail ?? {}, n = {
			...typeof t.beforeLayerId == "string" ? { beforeLayerId: t.beforeLayerId } : {},
			...typeof t.afterLayerId == "string" ? { afterLayerId: t.afterLayerId } : {}
		}, r = this.resolveFallbackFromRequest(t);
		if (!await this.addLayerRequest(t, r, n)) {
			let e = this.resolveCatalogLayerIdFromAddLayerDetail(t);
			this.dispatchEvent(new CustomEvent("webmapx-addlayer-failed", {
				detail: {
					...e ? { layerId: e } : {},
					request: t
				},
				bubbles: !0,
				composed: !0
			}));
		}
	}
	handleRemoveLayerEvent(e) {
		this.removeInlineLayer(e.detail);
	}
	removeInlineLayer(e) {
		this.adapter && (this.dynamicLayerRequests.delete(e), this.adapter.removeLayer(e), this.removeFromLogicalOrder(e), this.logicalLayerRole.delete(e));
	}
	handleAddSourceEvent(e) {
		this.adapter && this.adapter.addSource(e.detail.id, e.detail.config);
	}
	handleRemoveSourceEvent(e) {
		this.adapter && this.adapter.removeSource(e.detail);
	}
	handleSetSourceDataEvent(e) {
		let t = this.adapter?.getSource(e.detail.id);
		t && t.setData(e.detail.data);
	}
	handleSuppressBusyForSource(e) {
		this.adapter && this.adapter.suppressBusySignalForSource(e.detail);
	}
	handleUnsuppressBusyForSource(e) {
		this.adapter && this.adapter.unsuppressBusySignalForSource(e.detail);
	}
	async handleLayerAddRequest(e) {
		let t = this.toRecord(e.detail), n = this.toLayerInformation(t?.layerInformation), r = t?.checked === !0, i = typeof t?.selectionGroup == "string" && t.selectionGroup.length > 0 ? t.selectionGroup : null, a = this.adapter;
		if (a) if (r) {
			let e = typeof n?.layer?.id == "string" ? n.layer.id : null;
			if (!e) return;
			await this.tryAddLayerRequest(a, { layerId: e }, void 0, /* @__PURE__ */ new Set(), i ?? void 0) ? this.dynamicLayerRequests.set(e, { request: { layerId: e } }) : this.dispatchEvent(new CustomEvent("webmapx-addlayer-failed", {
				detail: { layerId: e },
				bubbles: !0,
				composed: !0
			}));
		} else n && (this.dynamicLayerRequests.delete(n.layer.id), this.rememberSingleGroupInsertSlot(a, n.layer.id, i ?? void 0), this.removeFromLogicalOrder(n.layer.id), this.logicalLayerRole.delete(n.layer.id), a.removeLogicalLayer(n.layer.id));
	}
	upsertAndStyleSurface() {
		let e = this.ensureMapViewElement();
		this.decorateMapSurface(e), this.currentSurface = e;
	}
	ensureMapViewElement() {
		let e = this.mapElement;
		if (e) return e;
		let t = document.createElement("div");
		return t.setAttribute("slot", Z), t.classList.add("webmapx-map__auto-view"), this.prepend(t), t;
	}
	decorateMapSurface(e) {
		e.classList.add(xe), e.style.position || (e.style.position = "absolute"), e.style.top || (e.style.top = "0"), e.style.right || (e.style.right = "0"), e.style.bottom || (e.style.bottom = "0"), e.style.left || (e.style.left = "0"), e.style.width || (e.style.width = "100%"), e.style.height || (e.style.height = "100%"), e.style.background || e.style.setProperty("background", "var(--color-background-secondary, #f4f6f8)");
	}
	observeSurfaceChanges() {
		this.surfaceObserver || (this.surfaceObserver = new MutationObserver(() => {
			let e = this.mapElement;
			if (!e) {
				this.upsertAndStyleSurface();
				return;
			}
			e !== this.currentSurface && (this.decorateMapSurface(e), this.currentSurface = e);
		}), this.surfaceObserver.observe(this, { childList: !0 }));
	}
	get adapter() {
		return this.ensureAdapter(), this.adapterInstance;
	}
	getAdapterAsync() {
		return this.ensureAdapter(), this.adapterPromise ?? Promise.resolve(this.adapterInstance);
	}
	get mapElement() {
		return this.querySelector(`[slot="${Z}"]`);
	}
	get config() {
		return this.configInstance;
	}
	get runtimeLayerRequests() {
		return [...this.dynamicLayerRequests.values()];
	}
	async whenLayersReady() {
		await this.getAdapterAsync(), await this.initialLayersPromise;
	}
	get mapConfig() {
		return this.configInstance?.map;
	}
	get layerDataConfig() {
		return this.configInstance?.layerData ?? this.configInstance?.catalog;
	}
	get catalogConfig() {
		return this.configInstance?.catalog;
	}
	getLayerDefinition(e) {
		let t = this.adapterInstance?.store.getState().mapLayers?.[e];
		return _e(e, t, this.findConfiguredLayer(e));
	}
	findConfiguredLayer(e) {
		let t = this.layerDataConfig?.layers;
		if (Array.isArray(t)) {
			let n = t.find((t) => t?.id === e);
			if (n) return n;
		} else if (t && typeof t == "object") {
			let n = t[e];
			if (n && typeof n == "object") return n;
		}
		for (let { request: t } of this.runtimeLayerRequests) {
			if (t?.id === e) return t;
			let n = t?.layer;
			if (n?.id === e) return n;
		}
	}
	get toolsConfig() {
		return this.configInstance?.tools;
	}
	async addLayerRequest(e, t, n) {
		let r = this.adapter;
		if (!r) return !1;
		let i = new Set(Object.keys(r.store.getState().mapLayers ?? {})), a = /* @__PURE__ */ new Set();
		if (await this.tryAddLayerRequest(r, e, n, a)) {
			let a = r.store.getState().mapLayers ?? {}, o = this.resolveRequestLayerId(e);
			if (o && a[o]) return this.dynamicLayerRequests.set(o, {
				request: e,
				fallback: t,
				options: n
			}), !0;
			for (let r of Object.keys(a)) i.has(r) || this.dynamicLayerRequests.set(r, {
				request: e,
				fallback: t,
				options: n
			});
			return !0;
		}
		return t ? typeof t == "string" ? this.tryAddLayerRequest(r, { layerId: t }, n, a) : this.tryAddLayerRequest(r, t, n, a) : !1;
	}
	resolveRequestLayerId(e) {
		let t = e;
		return typeof t.id == "string" && t.id.length > 0 ? t.id : typeof t.layerId == "string" && t.layerId.length > 0 ? t.layerId : null;
	}
	get toolManager() {
		return this.toolManagerInstance || (this.toolManagerInstance = new ae(), this.adapterInstance?.store && this.toolManagerInstance.setStore(this.adapterInstance.store), this.toolManagerInstance.addEventListener("webmapx-tool-activated", (e) => {
			this.dispatchEvent(new CustomEvent("webmapx-tool-activated", {
				detail: e.detail,
				bubbles: !0,
				composed: !0
			}));
		}), this.toolManagerInstance.addEventListener("webmapx-tool-deactivated", (e) => {
			this.dispatchEvent(new CustomEvent("webmapx-tool-deactivated", {
				detail: e.detail,
				bubbles: !0,
				composed: !0
			}));
		})), this.toolManagerInstance;
	}
	setConfig(t) {
		this.configInstance = t, e(t.ui), this.initialStateLayersApplied = !1, this.applyCatalogToAdapter(), this.dispatchEvent(new CustomEvent("webmapx-config-ready", {
			detail: {
				config: t,
				map: this
			},
			bubbles: !0,
			composed: !0
		}));
	}
	getScopedStorageKey(e) {
		return f(this.id, e, `${location.pathname}${location.search}`);
	}
	saveState(e) {
		if (!this.id) return;
		let t = this.adapter?.getViewportState(), n = [...this.dynamicLayerRequests.values()];
		g(this.id, `${location.pathname}${location.search}`, {
			...t ? { viewport: t } : {},
			...n.length > 0 ? { layers: n } : {},
			...e?.projection ? { projection: e.projection } : {}
		});
	}
	setProjection(e) {
		this.adapter && (this.adapter.setProjection(e) || (this.saveState({ projection: e }), window.location.reload()));
	}
	async restoreState() {
		if (!this.id) return;
		let e = ee(this.id, `${location.pathname}${location.search}`);
		if (e) for (let t of e.layers ?? []) await this.addLayerRequest(t.request, t.fallback, t.options);
	}
	getSavedAdapterPreference() {
		let e = this.getScopedStorageKey("adapter");
		return e ? localStorage.getItem(e) : null;
	}
	resolveRequestedAdapter() {
		return p({
			explicitAdapter: this.getAttribute(Se) ?? this.getAttribute("type"),
			savedAdapter: this.getSavedAdapterPreference(),
			configuredAdapter: this.mapConfig?.type ?? null,
			defaultAdapter: s
		});
	}
	ensureAdapter() {
		if (this.adapterInstance || this.adapterPromise) return;
		let e = this.resolveRequestedAdapter();
		this.adapterPromise = (async () => {
			let t = await u(e);
			return t ? (this.adapterInstance = t, this.activeAdapterName = e, this.toolManagerInstance && t.store && this.toolManagerInstance.setStore(t.store), this.applyCatalogToAdapter(), this.attachMapAccessibility(t), this.dispatchEvent(new CustomEvent("webmapx-map-ready", {
				detail: {
					adapter: this.adapterInstance,
					map: this
				},
				bubbles: !0,
				composed: !0
			})), t) : (console.error(`[webmapx-map] No adapter available for "${e}".`), null);
		})();
	}
	attachMapAccessibility(e) {
		this.mapAccessibility?.dispose();
		let t = this.currentSurface ?? this.ensureMapViewElement();
		if (this.mapAccessibility = Y(t, e, () => this.accessibleMapLabel()), e.store.getState().mapLoaded) {
			this.mapAccessibility.refresh();
			return;
		}
		let n = e.store.subscribe((e) => {
			e.mapLoaded && (n(), this.mapAccessibility?.refresh());
		});
	}
	accessibleMapLabel() {
		let e = this.mapConfig?.label?.trim() || "Map";
		return this.getAttribute("data-webmapx-role") === "compare-reference" ? `${e} (before)` : e;
	}
	async applyCatalogToAdapter() {
		let e = this.adapterInstance, t = this.layerDataConfig;
		!e || !t || (t.attributeMetadata && Object.keys(t.attributeMetadata).length > 0 && e.store.dispatch({ attributeMetadata: t.attributeMetadata }, "INIT"), this.initialStateLayersApplied || (this.initialStateLayersApplied = !0, this.initialLayersPromise = this.applyInitialStateLayers(e, t), this.initialLayersPromise));
	}
	collectInitialActiveLayerRefs() {
		let e = S(b(this));
		if (e?.l?.length) return e.l;
		let t = this.configInstance?.state?.activeLayers;
		if (!t) return (this.configInstance?.layerData?.layers ?? []).map((e) => typeof e?.id == "string" ? e.id : null).filter((e) => e !== null);
		let n = [];
		for (let e of t) {
			if (typeof e == "string") {
				n.push(e);
				continue;
			}
			if (!e || typeof e != "object") continue;
			let t = e, r = typeof t.ref == "string" ? t.ref : typeof t.layerId == "string" ? t.layerId : null;
			r && n.push(r);
		}
		return Array.from(new Set(n));
	}
	collectInitialHiddenLayerRefs() {
		let e = /* @__PURE__ */ new Set();
		if (S(b(this))?.l?.length) return e;
		for (let t of this.configInstance?.state?.activeLayers ?? []) {
			if (!t || typeof t != "object") continue;
			let n = t, r = typeof n.ref == "string" ? n.ref : typeof n.layerId == "string" ? n.layerId : null;
			r && n.visible === !1 && e.add(r);
		}
		return e;
	}
	getBackgroundSeedLayerId() {
		let e = this.collectInitialHiddenLayerRefs();
		return this.collectInitialActiveLayerRefs().find((t) => !e.has(t)) ?? null;
	}
	collectSingleSelectionGroupByLayerId() {
		let e = /* @__PURE__ */ new Map(), t = this.layerDataConfig?.layers;
		if (!Array.isArray(t)) return e;
		for (let n of t) {
			let t = this.getLayerMetadata(n), r = (typeof n.singleGroup == "string" ? n.singleGroup : null) ?? (typeof t?.singleSelectionGroupKey == "string" ? t.singleSelectionGroupKey : null) ?? (typeof t?.selectionGroup == "string" ? t.selectionGroup : null) ?? (typeof t?.["webmapx:selectionGroup"] == "string" ? t["webmapx:selectionGroup"] : null);
			r && r.length > 0 && e.set(n.id, r);
		}
		return e;
	}
	getSingleSelectionGroupKeyForLayer(e, t) {
		return typeof t == "string" && t.length > 0 ? t : this.collectSingleSelectionGroupByLayerId().get(e) ?? null;
	}
	insertIntoLogicalOrder(e, t) {
		if (this.logicalLayerOrder = this.logicalLayerOrder.filter((t) => t !== e), t?.beforeLayerId) {
			let n = this.logicalLayerOrder.indexOf(t.beforeLayerId);
			if (n >= 0) {
				this.logicalLayerOrder.splice(n, 0, e);
				return;
			}
		}
		this.logicalLayerOrder.push(e);
	}
	removeFromLogicalOrder(e) {
		this.logicalLayerOrder = this.logicalLayerOrder.filter((t) => t !== e);
	}
	currentLayerOrder() {
		let e = this.adapterInstance?.store.getState().mapLayers;
		return e ? Object.keys(e) : this.logicalLayerOrder;
	}
	computeInsertOptionsForLayer(e, t) {
		if (t?.beforeLayerId || t?.afterLayerId) return t;
		if (e === "background") {
			let e = this.adapterInstance?.store.getState().mapLayers ?? {}, t = this.currentLayerOrder().find((t) => (e[t]?.legendRole ?? this.logicalLayerRole.get(t) ?? "overlay") !== "background");
			return t ? { beforeLayerId: t } : void 0;
		}
	}
	rememberSingleGroupInsertSlot(e, t, n) {
		let r = this.getSingleSelectionGroupKeyForLayer(t, n);
		if (!r) return;
		let i = e.store.getState().mapLayers;
		oe(r, t, i ? Object.keys(i) : this.logicalLayerOrder, i, this.singleGroupInsertSlotByGroup, this.singleGroupLegendRoleByGroup);
	}
	resolveSingleGroupInsertionOptions(e, t, n) {
		let r = this.getSingleSelectionGroupKeyForLayer(e, n);
		return r ? se(r, this.currentLayerOrder(), t, this.singleGroupInsertSlotByGroup) : t;
	}
	resolveCatalogLegendRole(e, t, n) {
		return ce(e, this.getLayerMetadata(t), this.getSingleSelectionGroupKeyForLayer(e, n) ?? void 0, this.singleGroupLegendRoleByGroup, this.getBackgroundSeedLayerId(), this.collectSingleSelectionGroupByLayerId());
	}
	getConfiguredLayerInformation(e) {
		let t = this.layerDataConfig;
		if (!t) return null;
		let n = t.layers?.find((t) => t.id === e);
		return n ? { layer: n } : null;
	}
	resolveResourceUrl(e, t) {
		try {
			return new URL(e, t).toString().replace(/%7B/gi, "{").replace(/%7D/gi, "}");
		} catch {
			return e;
		}
	}
	resolveStyleBackedSource(e, t, n, r) {
		let i = n.type;
		if (i !== "vector" && i !== "raster" && i !== "geojson") return null;
		if (i === "vector") {
			let e = typeof n.url == "string" ? n.url : null, i = Array.isArray(n.tiles) ? n.tiles.filter((e) => typeof e == "string") : [], a = typeof n.attribution == "string" ? n.attribution : void 0, o = typeof n.minzoom == "number" ? n.minzoom : void 0, s = typeof n.maxzoom == "number" ? n.maxzoom : void 0;
			return !e && i.length === 0 ? null : {
				id: t,
				type: "vector",
				...e ? { url: this.resolveResourceUrl(e, r) } : {},
				...i.length > 0 ? { tiles: i.map((e) => this.resolveResourceUrl(e, r)) } : {},
				...o === void 0 ? {} : { minzoom: o },
				...s === void 0 ? {} : { maxzoom: s },
				...a ? { attribution: a } : {}
			};
		}
		if (i === "raster") {
			let e = Array.isArray(n.tiles) ? n.tiles.filter((e) => typeof e == "string") : [], i = typeof n.attribution == "string" ? n.attribution : void 0;
			return e.length === 0 ? null : {
				id: t,
				type: "raster",
				service: "xyz",
				url: e.map((e) => this.resolveResourceUrl(e, r)),
				tileSize: typeof n.tileSize == "number" ? n.tileSize : void 0,
				minzoom: typeof n.minzoom == "number" ? n.minzoom : void 0,
				maxzoom: typeof n.maxzoom == "number" ? n.maxzoom : void 0,
				...i ? { attribution: i } : {}
			};
		}
		let a = n.data, o = typeof n.attribution == "string" ? n.attribution : void 0;
		return typeof a == "string" ? {
			id: t,
			type: "geojson",
			data: this.resolveResourceUrl(a, r),
			...o ? { attribution: o } : {}
		} : null;
	}
	async expandStyleBackedLayer(e) {
		let t = (e.type === "style" ? e : null)?.url ?? null, n = e.id, r = `style:${n}:`, i = `${n}::${t ?? ""}`;
		if (!t) return null;
		let a = this.styleLayerCache.get(i);
		if (a) return a;
		let o = (async () => {
			try {
				let n = V(t);
				if (n) {
					let { collection: t } = await U(n.collectionUrl);
					return this.expandPortolanCollection(e, t, n.collectionUrl, r, n.styleKey);
				}
				let i = await fetch(t);
				if (!i.ok) return null;
				let a = this.toRecord(await i.json());
				return j(a) ? (console.warn(`[webmapx-map] ${t} is a Portolan/STAC collection, not a style; use "portolan://${t}" to draw it in its publisher's style.`), null) : this.buildExpandedStyleLayer(e, a, t, r);
			} catch {
				return null;
			}
		})();
		return this.styleLayerCache.set(i, o), o.then((e) => {
			!e && this.styleLayerCache.get(i) === o && this.styleLayerCache.delete(i);
		}), o;
	}
	normalizeStyleDocument(e) {
		if (!e || e.sources || e.layers) return e;
		let t = this.toRecord(e.source);
		if (!t) return e;
		if (t.sources || t.layers) return t;
		if (typeof e.type != "string" || typeof t.type != "string") return e;
		let n = typeof e.id == "string" && e.id.length > 0 ? e.id : "source";
		return {
			sources: { [n]: t },
			layers: [{
				...e,
				source: n
			}]
		};
	}
	buildExpandedStyleLayer(e, t, n, r) {
		let i = this.normalizeStyleDocument(t), a = this.toRecord(i?.sources), o = Array.isArray(i?.layers) ? i.layers.map((e) => this.toRecord(e)).filter((e) => !!e) : [];
		if (!a || o.length === 0) return null;
		let s = r ?? `style:${e.id}:`, c = new Set([
			"background",
			"fill",
			"line",
			"circle",
			"symbol",
			"raster",
			"fill-extrusion",
			"hillshade"
		]), l = /* @__PURE__ */ new Map(), u = o.filter((e) => typeof e.type == "string" && c.has(e.type)).map((e) => {
			let t = typeof e.source == "string" ? `${s}${e.source}` : void 0;
			return typeof e.source == "string" && t && l.set(e.source, t), {
				id: typeof e.id == "string" ? `style:${e.id}` : void 0,
				type: e.type,
				source: t,
				"source-layer": e["source-layer"] ?? e.sourceLayer,
				minzoom: e.minzoom ?? e.minZoom,
				maxzoom: e.maxzoom ?? e.maxZoom,
				paint: e.paint,
				layout: e.layout,
				filter: e.filter
			};
		}), d = new Set(u.map((e) => e.source).filter((e) => typeof e == "string" && e.length > 0)), f = {};
		for (let [e, t] of l.entries()) {
			if (!d.has(t)) continue;
			let r = this.toRecord(a[e]);
			if (!r) continue;
			let i = n ? this.resolveStyleBackedSource(e, t, r, n) : this.resolveInlineStyleSource(t, r);
			i && (f[t] = { ...i });
		}
		let p = new Set(Object.keys(f)), m = u.filter((e) => !e.source || p.has(e.source));
		return m.length === 0 ? null : { layer: {
			id: e.id,
			type: "style",
			title: e.title,
			singleGroup: e.singleGroup,
			fallbackLayerId: e.fallbackLayerId,
			minzoom: e.minzoom,
			maxzoom: e.maxzoom,
			metadata: {
				...this.getLayerMetadata(e) ?? {},
				styleUrl: n ?? void 0,
				styleSpriteUrl: typeof t?.sprite == "string" && n ? this.resolveResourceUrl(t.sprite, n) : typeof t?.sprite == "string" ? t.sprite : void 0,
				styleGlyphsUrl: typeof t?.glyphs == "string" && n ? this.resolveResourceUrl(t.glyphs, n) : typeof t?.glyphs == "string" ? t.glyphs : void 0
			},
			sources: f,
			layers: m
		} };
	}
	resolveInlineStyleSource(e, t) {
		let n = t.type;
		if (n !== "vector" && n !== "raster" && n !== "geojson") return null;
		if (n === "vector") {
			let n = typeof t.url == "string" ? t.url : null, r = Array.isArray(t.tiles) ? t.tiles.filter((e) => typeof e == "string") : [];
			return !n && r.length === 0 || !n && r.length === 0 ? null : {
				id: e,
				type: "vector",
				url: n ?? r[0] ?? "",
				...r.length > 0 ? { tiles: r } : {},
				...typeof t.minzoom == "number" ? { minzoom: t.minzoom } : {},
				...typeof t.maxzoom == "number" ? { maxzoom: t.maxzoom } : {},
				...typeof t.attribution == "string" ? { attribution: t.attribution } : {}
			};
		}
		if (n === "raster") {
			let n = Array.isArray(t.tiles) ? t.tiles.filter((e) => typeof e == "string") : [];
			return n.length === 0 ? null : {
				id: e,
				type: "raster",
				service: "xyz",
				url: n,
				...typeof t.tileSize == "number" ? { tileSize: t.tileSize } : {},
				...typeof t.minzoom == "number" ? { minzoom: t.minzoom } : {},
				...typeof t.maxzoom == "number" ? { maxzoom: t.maxzoom } : {},
				...typeof t.attribution == "string" ? { attribution: t.attribution } : {}
			};
		}
		let r = t.data;
		return typeof r == "string" ? {
			id: e,
			type: "geojson",
			data: r,
			...typeof t.attribution == "string" ? { attribution: t.attribution } : {}
		} : null;
	}
	async getLayerInformation(e) {
		let t = this.getConfiguredLayerInformation(e);
		return t ? this.isStyleBackedLayer(t.layer) ? this.expandStyleBackedLayer(t.layer) : t : null;
	}
	resolveCatalogLayerIdFromAddLayerDetail(e) {
		let t = [
			e.catalogLayerId,
			e.layerId,
			e.ref
		];
		for (let e of t) if (typeof e == "string" && this.getConfiguredLayerInformation(e)) return e;
		return null;
	}
	async expandPortolanCollection(e, t, n, r, i) {
		let a = R(t, n);
		if (a.renderPath !== "tiles" && a.renderPath !== "geoparquet") return console.warn(`[webmapx-map] Portolan collection ${n} cannot be drawn: ${a.notDrawable ?? "unknown reason"}`), null;
		let o = i ? a.styles.find((e) => e.key === i) : void 0;
		i && !o && console.warn(`[webmapx-map] ${n} has no style "${i}" (it has: ${a.styles.map((e) => e.key).join(", ") || "none"}); using its default.`);
		let s = o ?? a.styles[0], c = null;
		if (s) {
			try {
				let e = await fetch(s.href), t = e.ok ? this.toRecord(await e.json()) : null;
				c = t ? pe(t, s.href, a) : null;
			} catch {
				c = null;
			}
			c || console.warn(`[webmapx-map] Style "${s.title}" of ${n} could not be read; drawing the collection unstyled.`);
		}
		if (c ??= me(a), !c) return null;
		let l = this.getLayerMetadata(e) ?? {}, u = {
			...e,
			title: e.title ?? a.title,
			metadata: {
				...he(a, s),
				...l
			}
		};
		return this.buildExpandedStyleLayer(u, c, null, r);
	}
	isStyleRequest(e) {
		return !!(this.toRecord(e.style) || typeof e.styleUrl == "string" && e.styleUrl.length > 0);
	}
	resolveStyleUrlFromRequest(e) {
		return typeof e.styleUrl == "string" && e.styleUrl.length > 0 ? e.styleUrl : null;
	}
	resolveFallbackFromRequest(e) {
		let t = this.toRecord(e.fallbackLayer);
		if (t) return t;
		let n = [
			e.fallbackLayerId,
			e.fallbackRef,
			e.fallback
		];
		for (let e of n) if (typeof e == "string" && e.length > 0) return e;
	}
	async tryAddLayerRequest(e, t, n, r = /* @__PURE__ */ new Set(), i) {
		let a = this.resolveCatalogLayerIdFromAddLayerDetail(t);
		if (a) {
			if (r.has(a)) return !1;
			r.add(a);
			let t = this.getConfiguredLayerInformation(a);
			if (!t) return !1;
			let o = this.isStyleBackedLayer(t.layer) ? await this.expandStyleBackedLayer(t.layer) : t, s = o?.layer.metadata?.supportedEngines, c = !!o && (s ? s.includes(this.activeAdapterName) : !this.hasUnsupportedStyleComponents(o));
			if (o && c) {
				let t = this.getSingleSelectionGroupKeyForLayer(a, i);
				if (t) {
					let n = this.collectSingleSelectionGroupByLayerId(), r = Object.keys(e.store.getState().mapLayers ?? {});
					for (let o of r) o !== a && n.get(o) === t && (this.rememberSingleGroupInsertSlot(e, o, i), this.removeFromLogicalOrder(o), this.logicalLayerRole.delete(o), this.dynamicLayerRequests.delete(o), e.removeLogicalLayer(o));
				}
				let r = this.resolveCatalogLegendRole(a, o.layer, t ?? void 0), s = this.resolveSingleGroupInsertionOptions(a, n, i), c = this.computeInsertOptionsForLayer(r, s), l = {
					...o,
					layer: {
						...o.layer,
						metadata: {
							...this.getLayerMetadata(o.layer) ?? {},
							legendRole: r,
							...t ? { singleSelectionGroupKey: t } : {}
						}
					}
				};
				if (await this.addLogicalLayerInternal(e, l, c)) {
					let e = this.getSingleSelectionGroupKeyForLayer(a, i);
					return e && this.singleGroupInsertSlotByGroup.delete(e), !0;
				}
			}
			let l = this.getConfiguredFallbackLayerId(t.layer);
			return l ? this.tryAddLayerRequest(e, { layerId: l }, n, r, i) : !1;
		}
		if (typeof t.layerId == "string" || typeof t.catalogLayerId == "string" || typeof t.ref == "string") return !1;
		if (this.isStyleRequest(t)) {
			let n = await this.getLayerInformationFromStyleRequest(t);
			return !n || this.hasUnsupportedStyleComponents(n) ? !1 : this.addLogicalLayerInternal(e, n);
		}
		let { beforeLayerId: o, afterLayerId: s, fallbackLayer: c, fallbackLayerId: l, fallbackRef: u, fallback: d, ...f } = t;
		return this.addInlineLayerWithTracking(e, f, n);
	}
	async getLayerInformationFromStyleRequest(e) {
		let t = this.toRecord(e.style), n = this.resolveStyleUrlFromRequest(e);
		if (!t && !n) return null;
		let r = this.toRecord(e.metadata) ?? {}, i = typeof e.id == "string" && e.id.length > 0 ? e.id : `runtime-style-${++this.runtimeStyleLayerCounter}`;
		return t ? this.buildExpandedStyleLayer({
			id: i,
			type: "style",
			metadata: {
				...r,
				...n ? { styleUrl: n } : {}
			}
		}, t, n) : this.expandStyleBackedLayer({
			id: i,
			type: "style",
			metadata: {
				...r,
				styleUrl: n ?? void 0
			}
		});
	}
	toRecord(e) {
		return typeof e == "object" && e && !Array.isArray(e) ? e : null;
	}
	getLayerMetadata(e) {
		return this.toRecord(e?.metadata);
	}
	isStyleBackedLayer(e) {
		if (e.type !== "style") return !1;
		let t = e;
		return typeof t.url == "string" && t.url.length > 0;
	}
	getConfiguredFallbackLayerId(e) {
		if (typeof e.fallbackLayerId == "string" && e.fallbackLayerId.length > 0) return e.fallbackLayerId;
		let t = this.getLayerMetadata(e)?.fallbackLayerId;
		return typeof t == "string" && t.length > 0 ? t : null;
	}
	isSourceSupportedByActiveEngine(e) {
		return typeof e?.type == "string" && e.type ? this.adapterInstance?.canDrawSource(e) ?? !1 : !1;
	}
	hasUnsupportedStyleComponents(e) {
		let t = e.layer;
		if (t.type === "allmaps") return !(this.adapterInstance?.canDrawLayerType("allmaps") ?? !1);
		if (t.type === "style") {
			let e = t, n = e.sources ?? {}, r = [];
			for (let e of Object.values(n)) typeof e == "object" && e && typeof e.type == "string" && r.push(e);
			let i = e.layers ?? [];
			for (let e of i) {
				let t = typeof e?.source == "string" ? e.source : null;
				if (!t || t in n) continue;
				let i = this.layerDataConfig?.sources?.find((e) => e.id === t);
				i && typeof i.type == "string" && r.push(i);
			}
			return r.length === 0 ? !1 : r.some((e) => !this.isSourceSupportedByActiveEngine(e));
		}
		let n = t.source;
		if (!n) return !1;
		let r = this.layerDataConfig?.sources?.find((e) => e.id === n) ?? null;
		return r ? !this.isSourceSupportedByActiveEngine(r) : !1;
	}
	isLayerSpecSupported(e) {
		let t = (e?.sources && typeof e.sources == "object" ? Object.values(e.sources) : []).filter((e) => !!e && typeof e == "object" && typeof e.type == "string");
		return t.length === 0 ? !0 : t.every((e) => this.isSourceSupportedByActiveEngine(e));
	}
	async isCatalogLayerSupported(e) {
		let t = this.getConfiguredLayerInformation(e);
		if (!t) return !1;
		let n = t.layer.metadata?.supportedEngines;
		if (n) return n.includes(this.activeAdapterName);
		if (!this.isStyleBackedLayer(t.layer)) return !this.hasUnsupportedStyleComponents(t);
		let r = await this.expandStyleBackedLayer(t.layer);
		return r ? !this.hasUnsupportedStyleComponents(r) : !1;
	}
	async addLogicalLayerInternal(e, r, a) {
		let o = ge(r.layer, this.layerDataConfig?.sources), s = [];
		o.sources && typeof o.sources == "object" && (o.sources = { ...o.sources }, await W(o.sources), s = await i(o.sources, n(e.store.getState().mapTime), (n) => t(n, e.store.getState().lastClickedCoordinates)));
		let c = o, l = c.metadata && typeof c.metadata == "object" ? c.metadata : void 0;
		if (!l?.bounds && typeof c.source == "string") {
			let e = this.layerDataConfig?.sources?.find((e) => e.id === c.source);
			e?.bounds && (c.metadata = {
				...l ?? {},
				bounds: e.bounds
			});
		}
		c.metadata = X(c.metadata, o.sources);
		let u;
		try {
			u = await e.addLayer(c, a);
		} catch {
			return !1;
		}
		if (u) {
			let t = (c.metadata && typeof c.metadata == "object" ? c.metadata : {}).legendRole === "background" ? "background" : "overlay";
			this.logicalLayerRole.set(c.id, t), this.insertIntoLogicalOrder(c.id, a);
			let n = this.mapViewContext(e, typeof c.title == "string" ? c.title : c.id);
			for (let t of s) t.run((n) => {
				let r = e.getSource(t.id);
				return r ? (r.setData(n), !0) : !1;
			}, n);
		}
		return u;
	}
	async addInlineLayerWithTracking(e, r, a) {
		let o = [];
		r.sources && typeof r.sources == "object" && (r.sources = { ...r.sources }, await W(r.sources), o = await i(r.sources, n(e.store.getState().mapTime), (n) => t(n, e.store.getState().lastClickedCoordinates))), r.metadata = X(r.metadata, r.sources);
		let s = (r.metadata && typeof r.metadata == "object" ? r.metadata : {}).legendRole === "background" ? "background" : "overlay", c = this.computeInsertOptionsForLayer(s, a);
		await e.addLayer(r, c && Object.keys(c).length > 0 ? c : void 0);
		let l = typeof r.id == "string" ? r.id : null;
		l && (this.logicalLayerRole.set(l, s), this.insertIntoLogicalOrder(l, c));
		let u = this.mapViewContext(e, typeof r.title == "string" ? r.title : l ?? "Layer");
		for (let t of o) t.run((n) => {
			let r = e.getSource(t.id);
			return r ? (r.setData(n), !0) : !1;
		}, u);
		return !0;
	}
	mapViewContext(e, t) {
		return {
			currentBox: () => {
				let { center: t, zoom: n } = e.getViewportState();
				return r(t, n, this.clientWidth || 1024, this.clientHeight || 768);
			},
			onViewEnd: (t) => e.events.on("view-change-end", (e) => t([
				e.bounds.sw[0],
				e.bounds.sw[1],
				e.bounds.ne[0],
				e.bounds.ne[1]
			])),
			notify: (e) => {
				a(`${t}: ${e}`, { variant: "neutral" });
			}
		};
	}
	async applyInitialStateLayers(e, t) {
		this.applyPermalinkTime(e);
		let n = this.collectInitialActiveLayerRefs(), r = this.collectInitialHiddenLayerRefs();
		for (let t of n) {
			let n = await this.tryAddLayerRequest(e, { layerId: t });
			n && r.has(t) && e.setLayerVisibility(t, !1), n || this.dispatchEvent(new CustomEvent("webmapx-addlayer-failed", {
				detail: { layerId: t },
				bubbles: !0,
				composed: !0
			}));
		}
		await this.restoreState(), await this.applyPermalinkState(e), this.applyConfigTerrainState(e);
	}
	applyConfigTerrainState(e) {
		S(b(this)) || this.configInstance?.state?.terrainEnabled === !0 && e.store.dispatch({ terrainEnabled: !0 }, "UI");
	}
	applyPermalinkTime(e) {
		let t = S(b(this));
		typeof t?.tm != "number" || !Number.isFinite(t.tm) || (e.store.dispatch({ mapTime: {
			mode: "pinned",
			at: t.tm * 1e3
		} }, "INIT"), typeof t.tp == "number" && t.tp > 0 && e.store.dispatch({ mapTimePlay: t.tp * 1e3 }, "INIT"));
	}
	async applyPermalinkState(e) {
		let t = S(b(this));
		if (!t) return;
		if (t.h && t.h.length > 0) {
			let n = e.store.getState().mapLayers ?? {};
			for (let r of t.h) n[r] && e.setLayerVisibility(r, !1);
		}
		if (t.t) {
			let n = e.store.getState().mapLayers ?? {};
			for (let [r, i] of Object.entries(t.t)) n[r] && e.setLayerOpacity(r, (100 - i) / 100);
		}
		t.terrain && e.store.dispatch({ terrainEnabled: !0 }, "UI"), t.x && typeof t.x == "object" && e.store.dispatch({ toolRestore: t.x }, "INIT");
		let n = e.store.getState().mapLayers ?? {}, r = t.l.filter((e) => !n[e] && !(t.terrain && e === "webmapx-terrain-hillshade"));
		r.length > 0 && this.showPermalinkMissingLayersToast(r);
	}
	showPermalinkMissingLayersToast(e) {
		let t = e.length;
		a(`<strong>${t} layer${t > 1 ? "s" : ""} from the permalink could not be restored</strong><br>
      Layers may have been imported from files (not stored in permalink) or the map config may have changed:<br>
      <em>${e.join(", ")}</em>`, {
			variant: "warning",
			duration: 16e3
		});
	}
	toLayerInformation(e) {
		let t = this.toRecord(e), n = this.toRecord(t?.layer);
		if (!n) return null;
		let r = typeof n.id == "string" ? n.id : null, i = typeof n.type == "string" ? n.type : null;
		return !r || !i ? null : { layer: n };
	}
	isSubLayerSpec(e) {
		let t = this.toRecord(e);
		return !!t && typeof t.type == "string";
	}
	isSourceConfig(e) {
		let t = this.toRecord(e);
		return !!t && typeof t.id == "string" && typeof t.type == "string";
	}
};
customElements.get("webmapx-map") || customElements.define("webmapx-map", Q);
//#endregion
//#region src/components/internal/map-context.ts
function Ce(e, t) {
	try {
		let n = e.querySelector(t);
		return n instanceof Q ? n : null;
	} catch (e) {
		return console.error(`[webmapx] Invalid selector "${t}" provided via map attribute.`, e), null;
	}
}
function $(e) {
	let t = e.getAttribute("map");
	if (t) {
		let n = Ce(e.ownerDocument ?? document, t);
		return n || console.error(`[webmapx] No <webmapx-map> found for selector "${t}" on ${e.tagName.toLowerCase()}.`), n;
	}
	let n = e.closest("webmapx-map");
	if (n instanceof Q) return n;
	let r = (e.ownerDocument ?? document).querySelectorAll("webmapx-map:not([data-webmapx-role])");
	return r.length === 1 && r[0] instanceof Q ? r[0] : r.length > 1 ? (console.error(`[webmapx] Multiple <webmapx-map> elements found for ${e.tagName.toLowerCase()}. Set a "map" attribute with an explicit selector.`), null) : (console.error(`[webmapx] Unable to locate a <webmapx-map> for ${e.tagName.toLowerCase()}.`), null);
}
function we(e) {
	let t = $(e);
	return t ? t.adapter : null;
}
//#endregion
//#region \0@oxc-project+runtime@0.133.0/helpers/esm/decorate.js
function Te(e, t, n, r) {
	var i = arguments.length, a = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, o;
	if (typeof Reflect == "object" && typeof Reflect.decorate == "function") a = Reflect.decorate(e, t, n, r);
	else for (var s = e.length - 1; s >= 0; s--) (o = e[s]) && (a = (i < 3 ? o(a) : i > 3 ? o(t, n, a) : o(t, n)) || a);
	return i > 3 && a && Object.defineProperty(t, n, a), a;
}
//#endregion
export { C as a, S as c, d, p as f, ie as i, w as l, l as m, we as n, ne as o, s as p, $ as r, b as s, Te as t, f as u };
