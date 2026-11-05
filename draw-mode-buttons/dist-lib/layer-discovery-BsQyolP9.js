import { t as e } from "./lib-CStxbLgN.js";
import { n as t, r as n, t as r } from "./dist-DJD3GgY0.js";
import { n as i, r as a, t as o } from "./default-paint-EDDI8yhT.js";
import { t as s } from "./epsg-definitions-DZvXR1Xj.js";
import { t as c } from "./wms-url-builder-BO6EoMZm.js";
//#region src/utils/esri-drawing-info.ts
function l(e, t = 1) {
	if (!e) return;
	let [n, r, i, a = 255] = e;
	return `rgba(${n}, ${r}, ${i}, ${a / 255 * t})`;
}
function u(e) {
	return typeof e == "number" ? (100 - Math.min(100, Math.max(0, e))) / 100 : 1;
}
function d(e) {
	return typeof e == "number" ? e : void 0;
}
var f = {
	esrislsdash: [4, 3],
	esrislsdot: [1, 3],
	esrislsdashdot: [
		4,
		3,
		1,
		3
	],
	esrislsdashdotdot: [
		4,
		3,
		1,
		3,
		1,
		3
	]
};
function p(e, t, n = 1) {
	if (!e) return {};
	switch (t) {
		case "fill": {
			let t = {}, r = l(e.outline?.color, n);
			r && (t["fill-outline-color"] = r);
			let i = l(e.color, n);
			return i && (t["fill-color"] = i), t;
		}
		case "line": {
			let t = {}, r = l(e.color, n);
			r && (t["line-color"] = r);
			let i = d(e.width);
			i !== void 0 && (t["line-width"] = i);
			let a = f[(e.style ?? "").toLowerCase()];
			return a && (t["line-dasharray"] = a), t;
		}
		case "circle": {
			let t = {}, r = l(e.color, n);
			r && (t["circle-color"] = r);
			let i = d(e.size);
			i !== void 0 && (t["circle-radius"] = i / 2);
			let a = l(e.outline?.color, n);
			a && (t["circle-stroke-color"] = a);
			let o = d(e.outline?.width);
			return o !== void 0 && (t["circle-stroke-width"] = o), t;
		}
	}
}
function m(e, t) {
	let n = e?.outline, r = d(n?.width);
	if (!n || r === void 0 || r <= 1) return;
	let i = l(n.color, t);
	if (!i) return;
	let a = {
		"line-color": i,
		"line-width": r
	}, o = f[(n.style ?? "").toLowerCase()];
	return o && (a["line-dasharray"] = o), { paint: a };
}
var h = {
	fill: "fill-color",
	line: "line-color",
	circle: "circle-color"
};
function g(e) {
	let t = [
		e.field1,
		e.field2,
		e.field3
	].filter((e) => !!e);
	if (t.length === 0) return;
	if (t.length === 1) return ["get", t[0]];
	let n = e.fieldDelimiter ?? ",", r = ["concat"];
	return t.forEach((e, t) => {
		t > 0 && r.push(n), r.push(["to-string", ["get", e]]);
	}), r;
}
function _(e, t) {
	let n = e?.renderer;
	if (!n) return;
	let r = u(n.transparency);
	switch (n.type) {
		case "simple": {
			let e = p(n.symbol, t, r);
			if (!Object.keys(e).length) return;
			let i = t === "fill" ? m(n.symbol, r) : void 0;
			return {
				paint: e,
				...i ? { outline: i } : {}
			};
		}
		case "uniqueValue": {
			let e = g(n), i = n.uniqueValueInfos;
			if (!e || !i?.length) return;
			let a = h[t], o = ["match", e], s, c = /* @__PURE__ */ new Set();
			for (let e of i) {
				let t = l(e.symbol?.color, r);
				t && (c.has(e.value) || (c.add(e.value), o.push(e.value, t), s ??= t));
			}
			if (s = l(n.defaultSymbol?.color, r) ?? s, !s) return;
			o.push(s);
			let u = p(i[0]?.symbol, t, r);
			u[a] = o;
			let d = t === "fill" ? m(i[0]?.symbol, r) : void 0;
			return {
				paint: u,
				...d ? { outline: d } : {}
			};
		}
		case "classBreaks": {
			let e = n.field, i = n.classBreakInfos;
			if (!e || !i?.length) return;
			let a = h[t], o = ["step", ["get", e]], s = l(i[0]?.symbol?.color, r) ?? l(n.defaultSymbol?.color, r);
			if (!s) return;
			o.push(s);
			for (let e = 0; e < i.length - 1; e++) {
				let t = l(i[e + 1]?.symbol?.color, r) ?? l(n.defaultSymbol?.color, r);
				if (!t) return;
				o.push(i[e].classMaxValue, t);
			}
			let c = p(i[0]?.symbol, t, r);
			c[a] = o;
			let u = t === "fill" ? m(i[0]?.symbol, r) : void 0;
			return {
				paint: c,
				...u ? { outline: u } : {}
			};
		}
		default: return;
	}
}
//#endregion
//#region src/utils/layer-discovery.ts
typeof window < "u" && window.addEventListener("unhandledrejection", (e) => {
	e.reason?.name === "ServiceExceptionError" && /No service:\s*\(\s*WMTS\s*\)/.test(String(e.reason?.message)) && e.preventDefault();
});
function v(e) {
	return e.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "layer";
}
function y(e) {
	return e.split("?")[0].split("#")[0];
}
var b = [
	"service",
	"request",
	"version",
	"layers",
	"styles",
	"format",
	"transparent",
	"crs",
	"srs",
	"width",
	"height",
	"bbox"
];
function x(e, t) {
	try {
		let n = new URL(e), r = n.searchParams.get("layers") ?? n.searchParams.get("LAYERS");
		r && t?.(r);
		for (let e of [...n.searchParams.keys()]) b.includes(e.toLowerCase()) && n.searchParams.delete(e);
		return n.toString();
	} catch {
		return e;
	}
}
function S(e, t, n = {}) {
	return {
		id: e,
		type: "raster",
		tiles: t,
		url: t,
		service: "xyz",
		...n
	};
}
function C(e) {
	if (!e || e.length !== 4) return;
	let t = e.map((e) => typeof e == "number" ? e : parseFloat(String(e)));
	return t.every(Number.isFinite) ? t : void 0;
}
function w(e) {
	if (!Number.isFinite(e) || e <= 0) return 0;
	let t = Math.log2(559082264.02867 / e);
	return Math.max(0, Math.round(t * 100) / 100);
}
function T(e) {
	let t = e.match(/^(.*\/)(\d+)\/(\d+)\/(\d+)(\.[a-z0-9]+)?(\?.*)?$/i);
	if (!t) return null;
	let [, n, , , , r] = t, i = `${n}{z}/{x}/{y}${r ?? ""}`;
	return {
		serviceType: "xyz",
		title: `XYZ tiles (${n.replace(/^https?:\/\//, "")})`,
		source: S("xyz", [i]),
		layer: {
			id: "xyz",
			type: "raster",
			source: "xyz",
			title: "XYZ tiles"
		}
	};
}
function E(e) {
	let t = e.match(/^(.*\/)([\w.-]+)\/mvt\/\d+\/\d+\/\d+(\?.*)?$/i);
	if (!t) return null;
	let [, n, r, s] = t, c = `${n}${r}/mvt/{z}/{x}/{y}${s ?? ""}`, l = r, u = {
		id: l,
		type: "vector",
		tiles: [c]
	}, d = [
		{
			id: "fill",
			type: "fill",
			source: l,
			"source-layer": r,
			filter: [
				"==",
				["geometry-type"],
				"Polygon"
			],
			paint: {
				"fill-color": o,
				"fill-opacity": i,
				"fill-outline-color": a
			}
		},
		{
			id: "line",
			type: "line",
			source: l,
			"source-layer": r,
			filter: [
				"in",
				["geometry-type"],
				["literal", ["Polygon", "LineString"]]
			],
			paint: {
				"line-color": o,
				"line-width": 1
			}
		},
		{
			id: "circle",
			type: "circle",
			source: l,
			"source-layer": r,
			filter: [
				"==",
				["geometry-type"],
				"Point"
			],
			paint: {
				"circle-color": o,
				"circle-radius": 4
			}
		}
	];
	return {
		serviceType: "xyz",
		title: `${r} (MVT)`,
		source: u,
		layer: {
			id: l,
			type: "style",
			version: 8,
			title: r,
			sources: { [l]: u },
			layers: d
		}
	};
}
function D(e) {
	let t = e.match(/^(.*\/(?:MapServer|ImageServer))\/tile\/\d+\/\d+\/\d+(\?.*)?$/i);
	if (!t) return null;
	let n = t[1], r = `${n}/tile/{z}/{y}/{x}`, i = "esri-tile";
	return {
		base: n,
		layer: {
			serviceType: "esri-tile",
			title: `Esri tile cache (${n.split("/").slice(-2).join("/")})`,
			source: S(i, [r]),
			layer: {
				id: i,
				type: "raster",
				source: i,
				title: "Esri tile cache"
			}
		}
	};
}
function O(e) {
	let t = e.match(/^(.*\/rest\/services\/.*\/(?:MapServer|FeatureServer|ImageServer))/i);
	return t ? t[1] : null;
}
async function k(e) {
	try {
		let t = await fetch(e);
		return t.ok ? await t.json() : null;
	} catch {
		return null;
	}
}
async function A(e) {
	let t = await k(`${e}${e.includes("?") ? "&" : "?"}f=json`);
	return !t || typeof t.currentVersion != "number" ? null : t;
}
function j(e, t) {
	let n = Array.isArray(t.folders) ? t.folders : void 0, r = Array.isArray(t.services) ? t.services : void 0;
	if (!n && !r) return null;
	let i = e.replace(/\/+$/, ""), a = i.match(/^(.*\/rest\/services)/i), o = a ? a[1] : i, s = [];
	for (let e of n ?? []) s.push({
		name: e,
		url: `${i}/${e}`,
		kind: "folder"
	});
	for (let e of r ?? []) s.push({
		name: e.name,
		url: `${o}/${e.name}/${e.type}`,
		kind: "service",
		type: e.type
	});
	return s;
}
function M(e, t) {
	let n = e?.title?.trim(), r = e?.url?.trim();
	return n && r ? `<a href="${P(r)}" target="_blank" rel="noopener">${N(n)}</a>` : n ? N(n) : r ? `<a href="${P(r)}" target="_blank" rel="noopener">${N(F(r) ?? r)}</a>` : t;
}
function N(e) {
	return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function P(e) {
	return N(e).replace(/"/g, "&quot;");
}
function F(e) {
	try {
		return new URL(e).hostname.replace(/^www\./, "");
	} catch {
		return null;
	}
}
async function I(e) {
	try {
		let n = await new t(e).isReady(), r = n.getServiceInfo(), i = n.getFlattenedLayers(), a = n.getVersion(), o = [];
		for (let t of i) {
			if (!t.name) continue;
			let i = t.name, s = null;
			try {
				s = n.getLayerByName(t.name);
			} catch {
				s = null;
			}
			let l = C(s?.boundingBoxes?.["EPSG:4326"] ?? s?.boundingBoxes?.["CRS:84"]), u = typeof s?.maxScaleDenominator == "number" ? w(s.maxScaleDenominator) : void 0, d = typeof s?.minScaleDenominator == "number" ? w(s.minScaleDenominator) : void 0, f = s?.styles?.find((e) => e.legendUrl)?.legendUrl;
			o.push({
				serviceType: "wms",
				title: `${t.title || t.name} (WMS)`,
				...t.abstract ? { abstract: t.abstract } : {},
				source: S(i, [c({
					baseUrl: x(n.getOperationUrl("GetMap") || e, (e) => {
						e !== t.name && console.debug(`[layer-discovery] GetMap operation URL for "${t.name}" already specified layers="${e}" — overriding with the discovered layer name.`);
					}),
					layers: t.name,
					version: a
				})], {
					tileSize: 256,
					...M(s?.attribution, r?.title) ? { attribution: M(s?.attribution, r?.title) } : {},
					...l ? { bounds: l } : {},
					...s?.queryable ? {
						service: "wms",
						gfiUrl: x(n.getOperationUrl("GetFeatureInfo") || n.getOperationUrl("GetMap") || e),
						gfiLayers: t.name,
						gfiVersion: a
					} : {}
				}),
				layer: {
					id: i,
					type: "raster",
					source: i,
					title: t.title || t.name,
					...u === void 0 ? {} : { minzoom: u },
					...d === void 0 ? {} : { maxzoom: d },
					...t.abstract || l || f || s?.queryable === !1 ? { metadata: {
						...t.abstract ? { abstract: t.abstract } : {},
						...l ? { bounds: l } : {},
						...f ? { legendurl: f } : {},
						...s?.queryable === !1 ? { queryable: !1 } : {}
					} } : {}
				}
			});
		}
		return o;
	} catch {
		return [];
	}
}
async function L(e) {
	try {
		let t = await new r(e).isReady(), n = t.getServiceInfo(), i = [];
		for (let e of t.getLayers()) {
			let r = e.matrixSets[0];
			if (!r) continue;
			let a = t.getTileUrl(e.name, e.defaultStyle, r.identifier, "{z}", "{y}", "{x}");
			if (!a) continue;
			let o = a.replace(/%7B/gi, "{").replace(/%7D/gi, "}"), s = e.name, c = C(e.latLonBoundingBox);
			i.push({
				serviceType: "wmts",
				title: `${e.name} (WMTS)`,
				source: S(s, [o], {
					...n?.title ? { attribution: n.title } : {},
					...c ? { bounds: c } : {}
				}),
				layer: {
					id: s,
					type: "raster",
					source: s,
					title: e.name,
					...c ? { metadata: { bounds: c } } : {}
				}
			});
		}
		return i;
	} catch {
		return [];
	}
}
async function R(e) {
	try {
		let t = await new n(e).isReady(), r = t.getFeatureTypes(), s = t.getVersion(), c = t.supportsStartIndex(), l = [];
		for (let e of r) {
			if (!e.name || !t.supportsJson(e.name)) continue;
			let n = e.name, r = t.getFeatureUrl(e.name, {
				outputFormat: "application/json",
				outputCrs: "EPSG:4326"
			}) ?? t.getFeatureUrl(e.name);
			if (!r) continue;
			let u = C(e.boundingBox);
			l.push({
				serviceType: "wfs",
				title: `${e.title || e.name} (WFS)`,
				...e.abstract ? { abstract: e.abstract } : {},
				source: {
					id: n,
					type: "geojson",
					data: r,
					service: "wfs",
					wfsVersion: s,
					wfsSupportsPaging: c,
					...u ? { bounds: u } : {}
				},
				layer: {
					id: n,
					type: "fill",
					source: n,
					title: e.title || e.name,
					paint: {
						"fill-color": o,
						"fill-opacity": i,
						"fill-outline-color": a
					},
					...e.abstract || u ? { metadata: {
						...e.abstract ? { abstract: e.abstract } : {},
						...u ? { bounds: u } : {}
					} } : {}
				}
			});
		}
		return l;
	} catch {
		return [];
	}
}
var z = {
	esriGeometryPoint: "circle",
	esriGeometryMultipoint: "circle",
	esriGeometryPolyline: "line",
	esriGeometryPolygon: "fill"
};
function B(t) {
	let n = t;
	if (!n) return;
	let r = n.spatialReference, i = r?.latestWkid ?? r?.wkid, { xmin: a, ymin: o, xmax: c, ymax: l } = n;
	if (![
		a,
		o,
		c,
		l
	].every(Number.isFinite)) return;
	if (i === 4326 || i === 4269) return [
		a,
		o,
		c,
		l
	];
	let u = i === void 0 ? void 0 : s[String(i)];
	if (u) try {
		let t = e(u, "EPSG:4326"), [n, r] = t.forward([a, o]), [i, s] = t.forward([c, l]);
		return [
			n,
			r,
			i,
			s
		].every(Number.isFinite) ? [
			n,
			r,
			i,
			s
		] : void 0;
	} catch {
		return;
	}
}
async function V(e, t, n, r, i) {
	let a = t.id, s = typeof t.geometryType == "string" ? t.geometryType : void 0;
	if (a === void 0 || !s || !(s in z)) return null;
	let c = v(String(t.name ?? a)), l = `${e}/${a}/query?where=1%3D1&outFields=*&f=geojson&outSR=4326`, u = B(t.extent) ?? n, d = typeof t.description == "string" && t.description ? t.description : r, f = typeof t.minScale == "number" && t.minScale > 0 ? w(t.minScale) : void 0, p = typeof t.maxScale == "number" && t.maxScale > 0 ? w(t.maxScale) : void 0, m = z[s], h = (i === void 0 ? await k(`${e}/${a}?f=json`) : i)?.drawingInfo, g = _(h, m);
	m === "circle" && !g?.paint?.["circle-color"] && (g = {
		...g,
		paint: {
			"circle-color": o,
			"circle-radius": 5,
			...g?.paint
		}
	});
	let y = String(t.name ?? `Layer ${a}`), b = {
		id: c,
		type: "geojson",
		data: l,
		service: "esri-feature",
		...u ? { bounds: u } : {}
	}, x = d || u ? {
		...d ? { abstract: d } : {},
		...u ? { bounds: u } : {}
	} : void 0;
	return g?.outline ? {
		serviceType: "esri-feature",
		title: `${y} (Esri features)`,
		...d ? { abstract: d } : {},
		source: b,
		layer: {
			id: c,
			type: "style",
			version: 8,
			title: y,
			...f === void 0 ? {} : { minzoom: f },
			...p === void 0 ? {} : { maxzoom: p },
			sources: { [c]: b },
			layers: [{
				id: "fill",
				type: m,
				source: c,
				...g.paint ? { paint: g.paint } : {}
			}, {
				id: "outline",
				type: "line",
				source: c,
				paint: g.outline.paint
			}],
			...x ? { metadata: x } : {}
		}
	} : {
		serviceType: "esri-feature",
		title: `${y} (Esri features)`,
		...d ? { abstract: d } : {},
		source: b,
		layer: {
			id: c,
			type: m,
			source: c,
			title: y,
			...f === void 0 ? {} : { minzoom: f },
			...p === void 0 ? {} : { maxzoom: p },
			...g?.paint ? { paint: g.paint } : {},
			...g?.layout ? { layout: g.layout } : {},
			...x ? { metadata: x } : {}
		}
	};
}
async function H(e, t, n) {
	let r = (await k(`${e}/${String(t.defaultStyles).replace(/^\/+/, "")}`))?.layers;
	if (!r?.length) return null;
	let i = v(String(t.name ?? "vector-tiles")), a = t.tileInfo, o = a?.lods, s = a?.maxLOD ?? (o?.length ? o[o.length - 1]?.level : void 0), c = {
		id: i,
		type: "vector",
		tiles: [`${e}/tile/{z}/{y}/{x}.pbf`],
		...typeof s == "number" ? { maxzoom: s } : {}
	}, l = r.filter((e) => e.type !== "background").map((e) => ({
		...e,
		source: i
	})), u = String(t.name ?? "Vector tiles");
	return {
		serviceType: "esri-vector-tile",
		title: `${u} (Esri vector tiles)`,
		...n ? { abstract: n } : {},
		source: c,
		layer: {
			id: i,
			type: "style",
			version: 8,
			title: u,
			sources: { [i]: c },
			layers: l,
			...n ? { metadata: { abstract: n } } : {}
		}
	};
}
async function U(e) {
	let t = await k(`${e}?f=json`);
	if (!t) return [];
	let n = [], r = B(t.fullExtent), i = typeof t.description == "string" && t.description ? t.description : void 0;
	if (t.tileInfo) {
		let a = "esri-tile", o = `${e}/tile/{z}/{y}/{x}`;
		n.push({
			serviceType: "esri-tile",
			title: `${t.mapName || t.name || "Esri"} tile cache`,
			...i ? { abstract: i } : {},
			source: S(a, [o], r ? { bounds: r } : {}),
			layer: {
				id: a,
				type: "raster",
				source: a,
				title: String(t.mapName || t.name || "Esri tile cache"),
				...i || r ? { metadata: {
					...i ? { abstract: i } : {},
					...r ? { bounds: r } : {}
				} } : {}
			}
		});
	}
	if (Array.isArray(t.tiles) && typeof t.defaultStyles == "string") {
		let r = await H(e, t, i);
		r && n.push(r);
	}
	let a = typeof t.capabilities == "string" ? t.capabilities.split(",").map((e) => e.trim().toUpperCase()) : [], o = t.documentInfo, s = typeof o?.Title == "string" && o.Title ? o.Title : void 0;
	if (a.includes("WMS")) {
		let t = await I(`${e}/WMSServer`);
		for (let e of t) s && (e.title = s, e.layer.title = s);
		n.push(...t);
	} else if (Array.isArray(t.layers) && t.layers.length > 0) {
		let a = "esri-export", o = t.layers.map((e) => e.id).filter((e) => typeof e == "number"), c = `${e}/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&dpi=96&format=png32&transparent=true&f=image&layers=${encodeURIComponent(`show:${o.join(",")}`)}`, l = typeof t.minScale == "number" && t.minScale > 0 ? w(t.minScale) : void 0, u = typeof t.maxScale == "number" && t.maxScale > 0 ? w(t.maxScale) : void 0, d;
		if (t.layers.length === 1) {
			let t = (await k(`${e}/legend?f=json`))?.layers?.[0]?.legend?.[0];
			typeof t?.imageData == "string" && typeof t?.contentType == "string" && (d = `data:${t.contentType};base64,${t.imageData}`);
		}
		n.push({
			serviceType: "esri-tile",
			title: s ?? `${t.mapName || t.name || "Esri"} (export)`,
			...i ? { abstract: i } : {},
			source: S(a, [c], r ? { bounds: r } : {}),
			layer: {
				id: a,
				type: "raster",
				source: a,
				title: s ?? String(t.mapName || t.name || "Esri export"),
				...l === void 0 ? {} : { minzoom: l },
				...u === void 0 ? {} : { maxzoom: u },
				...i || r || d ? { metadata: {
					...i ? { abstract: i } : {},
					...r ? { bounds: r } : {},
					...d ? { legendurl: d } : {}
				} } : {}
			}
		});
	}
	if (Array.isArray(t.layers)) {
		let a = await Promise.all(t.layers.map((t) => V(e, t, r, i)));
		for (let e of a) e && n.push(e);
	} else if (typeof t.geometryType == "string") {
		let a = await V(e.replace(/\/\d+$/, ""), t, r, i, t);
		a && n.push(a);
	}
	return n;
}
async function W(e) {
	let t = e.trim();
	if (!t) return { layers: [] };
	let n = y(t), r = await A(n);
	if (r) {
		let e = j(n, r);
		return e ? {
			layers: [],
			catalog: e
		} : { layers: G(await U(n), t) };
	}
	let i = [], a = [], o = E(t);
	o && i.push(o);
	let s = o ? null : T(t);
	s && i.push(s);
	let c = D(t);
	c && i.push(c.layer), a.push(I(n)), a.push(L(n)), a.push(R(n));
	let l = O(t) ?? (c ? c.base : null);
	l && a.push(U(l));
	let u = await Promise.all(a);
	for (let e of u) i.push(...e);
	return { layers: G(i, t) };
}
function G(e, t) {
	let n;
	try {
		n = new URL(t).searchParams;
	} catch {
		return e;
	}
	let r = /* @__PURE__ */ new Set();
	for (let e of [
		"LAYERS",
		"layers",
		"LAYER",
		"layer"
	]) {
		let t = n.get(e);
		if (t) for (let e of t.split(",")) {
			let t = e.trim();
			t && r.add(t.toLowerCase());
		}
	}
	if (r.size === 0) return e;
	let i = (e) => {
		let t = e.layer.id?.toLowerCase() ?? "";
		return Array.from(r).some((e) => t === e || t.includes(e));
	}, a = [], o = [];
	for (let t of e) (i(t) ? a : o).push(t);
	return [...a, ...o];
}
//#endregion
export { I as n, M as r, W as t };
