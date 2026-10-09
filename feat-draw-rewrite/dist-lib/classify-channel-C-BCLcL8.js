//#region src/utils/attribute-translations.ts
function e(e, t) {
	let n = (typeof e == "string" ? t?.[e] : e)?.translations, r = /* @__PURE__ */ new Map();
	if (!Array.isArray(n)) return r;
	for (let e of n) {
		let t = e?.name;
		if (typeof t != "string" || t.length === 0) continue;
		let n = e;
		r.set(t, {
			label: typeof n.translation == "string" && n.translation.length > 0 ? n.translation : t,
			unit: typeof n.unit == "string" ? n.unit : "",
			...typeof n.maxvalue == "number" ? { maxvalue: n.maxvalue } : {},
			...Array.isArray(n.valuemap) ? { valuemap: n.valuemap } : {}
		});
	}
	return r;
}
function t(e, t) {
	let n = t?.get(e)?.label;
	return n && n !== e ? `${n} (${e})` : e;
}
//#endregion
//#region src/utils/layer-label.ts
function n(e) {
	for (let t of [
		"label",
		"title",
		"webmapx:title"
	]) {
		let n = e?.[t];
		if (typeof n == "string" && n.length > 0) return n;
	}
	return null;
}
function r(e) {
	return n(e?.metadata && typeof e.metadata == "object" ? e.metadata : null);
}
function i(e) {
	let t = typeof e?.type == "string" ? e.type : "";
	return t ? t === "symbol" ? "label" : t === "circle" ? "points" : t : null;
}
var a = new Set([
	"edit",
	"copy",
	"new",
	"layer",
	"layers",
	"sublayer",
	"style",
	"default",
	"fill",
	"line",
	"symbol",
	"circle",
	"raster",
	"background",
	"hillshade",
	"heatmap",
	"extrusion",
	"label",
	"labels",
	"points",
	"outline"
]);
function o(e, t) {
	let n = e.replace(/^style:/, "");
	t && n.startsWith(t) && (n = n.slice(t.length));
	let r = n.toLowerCase().split(/[\s_\-:.]+/).filter(Boolean);
	if (r.length === 0) return null;
	for (let e of r) if (/[a-z]/.test(e) && /\d/.test(e) || /^[a-z]+$/.test(e) && e.length > 1 && !/[aeiouy]/.test(e)) return null;
	return r.every((e) => a.has(e) || /^\d+$/.test(e)) ? null : r.join(" ");
}
function s(e, t = []) {
	if (!Array.isArray(e)) return t;
	let [n, r, i] = e, a = Array.isArray(r) && r[0] === "get" && typeof r[1] == "string";
	if (n === "all") for (let n of e.slice(1)) s(n, t);
	else if (n === "==" && (a || typeof r == "string") && (typeof i == "string" || typeof i == "number")) {
		if (!a && (r === "$type" || r === "$id")) return t;
		t.push(String(i));
	} else if (n === "match" && a && e[e.length - 1] === !1) {
		let e = Array.isArray(i) ? i : [i];
		t.push(...e.filter((e) => typeof e == "string" || typeof e == "number").map(String));
	}
	return t;
}
function c(e) {
	let t = typeof e?.["source-layer"] == "string" ? e["source-layer"] : "", n = s(e?.filter).map((e) => e.replace(/_/g, " ")), r = t.replace(/_/g, " ");
	return r && n.length > 0 ? `${r}: ${n.join(", ")}` : r || null;
}
function l(e, t, a, s, l) {
	return s ? r(t) ?? n(e) ?? i(t) ?? "" : r(t) ?? o(a, l) ?? c(t) ?? i(t) ?? a.replace(/^style:/, "").replace(/-/g, " ");
}
//#endregion
//#region src/utils/topological-coloring.ts
var u = 1e-7, d = 2, f = 3;
function p(e, t = {}) {
	let n = _(e, t.tolerance ?? 1e-7), r = e.filter((e) => !b(e.geometry)).length, i = v(n, t.maxColors ?? Infinity, t.paletteSize);
	return {
		colors: i,
		colorCount: i.length === 0 ? 0 : Math.max(...i) + 1,
		adjacency: n,
		isolatedRegions: n.filter((t, n) => t.length === 0 && b(e[n]?.geometry)).length,
		skipped: r
	};
}
function m(e) {
	if (!b(e.geometry)) return null;
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	for (let a of x(e.geometry)) for (let [e, o] of a) e < t && (t = e), e > r && (r = e), o < n && (n = o), o > i && (i = o);
	return Number.isFinite(t) ? [
		t,
		n,
		r,
		i
	] : null;
}
function h(e, t) {
	let n = Math.max(0, Math.max(e[0] - t[2], t[0] - e[2])), r = Math.max(0, Math.max(e[1] - t[3], t[1] - e[3]));
	return Math.hypot(n, r);
}
function g(e, t, n = f) {
	let r = 0;
	for (let i = 0; i < t.length; i++) {
		if (t[i].size > 0) continue;
		let a = e[i];
		if (!a) continue;
		let o = [];
		for (let t = 0; t < e.length; t++) {
			if (t === i) continue;
			let n = e[t];
			n && o.push({
				index: t,
				gap: h(a, n)
			});
		}
		o.sort((e, t) => e.gap - t.gap);
		for (let { index: e } of o.slice(0, n)) t[i].has(e) || (t[i].add(e), t[e].add(i), r++);
	}
	return r;
}
function ee(e, t, n, r, i = u) {
	if (n === 0 || r <= 0) return null;
	let a = _(e, i), o = e.map((e) => {
		let r = t(e);
		return r !== null && r >= 0 && r < n ? r : -1;
	}), s = Array.from({ length: n }, () => /* @__PURE__ */ new Set()), c = 0;
	a.forEach((e, t) => {
		let n = o[t];
		if (!(n < 0)) for (let t of e) {
			let e = o[t];
			e < 0 || e === n || s[n].has(e) || (s[n].add(e), s[e].add(n), c++);
		}
	});
	let l = Array.from({ length: n }, () => null);
	return e.forEach((e, t) => {
		let n = o[t];
		if (n < 0) return;
		let r = m(e);
		if (!r) return;
		let i = l[n];
		l[n] = i ? [
			Math.min(i[0], r[0]),
			Math.min(i[1], r[1]),
			Math.max(i[2], r[2]),
			Math.max(i[3], r[3])
		] : r;
	}), c += g(l, s), c === 0 ? null : v(s.map((e) => [...e]), r, r);
}
function _(e, t = u) {
	let n = /* @__PURE__ */ new Map();
	e.forEach((e, r) => {
		if (!b(e.geometry)) return;
		let i = /* @__PURE__ */ new Set();
		for (let a of x(e.geometry)) for (let e of a) {
			let a = re(e, t);
			if (i.has(a)) continue;
			i.add(a);
			let o = n.get(a);
			o ? o.add(r) : n.set(a, new Set([r]));
		}
	});
	let r = /* @__PURE__ */ new Map();
	for (let t of n.values()) {
		if (t.size < 2) continue;
		let n = [...t].sort((e, t) => e - t);
		for (let t = 0; t < n.length; t++) for (let i = t + 1; i < n.length; i++) {
			let a = n[t] * e.length + n[i];
			r.set(a, (r.get(a) ?? 0) + 1);
		}
	}
	let i = e.map(() => []);
	for (let [t, n] of r) {
		if (n < d) continue;
		let r = Math.floor(t / e.length), a = t % e.length;
		i[r].push(a), i[a].push(r);
	}
	return i;
}
function v(e, t = Infinity, n) {
	let r = e.length, i = Array(r).fill(-1), a = e.map(() => /* @__PURE__ */ new Set());
	for (let n = 0; n < r; n++) {
		let n = -1;
		for (let t = 0; t < r; t++) {
			if (i[t] !== -1) continue;
			if (n === -1) {
				n = t;
				continue;
			}
			let r = a[t].size - a[n].size;
			(r > 0 || r === 0 && e[t].length > e[n].length) && (n = t);
		}
		if (n === -1) break;
		let o = 0;
		for (; a[n].has(o) && o < t - 1;) o++;
		if (a[n].has(o)) {
			let r = Array(t).fill(0);
			for (let t of e[n]) i[t] >= 0 && r[i[t]]++;
			o = r.indexOf(Math.min(...r));
		}
		i[n] = o;
		for (let t of e[n]) a[t].add(o);
	}
	return y(e, i, n);
}
function y(e, t, n) {
	let r = t.length === 0 ? 0 : Math.max(...t) + 1, i = Math.max(r, Math.min(n ?? 0, t.length));
	if (i < 2) return t;
	let a = Array(i).fill(0);
	for (let e of t) a[e]++;
	let o = t.map((e, t) => t).sort((e, n) => a[t[n]] - a[t[e]]);
	for (let n of o) {
		let r = new Set(e[n].map((e) => t[e])), o = t[n];
		for (let e = 0; e < i; e++) r.has(e) || a[e] + 1 < a[o] && (o = e);
		o !== t[n] && (a[t[n]]--, a[o]++, t[n] = o);
	}
	return ne(e, t, i, a);
}
var te = 64;
function ne(e, t, n, r) {
	if (n < 3) return t;
	let i = Array.from({ length: n }, () => []);
	t.forEach((e, t) => i[e]?.push(t));
	let a = 0, o = (n) => new Set(e[n].map((e) => t[e])), s = (n) => {
		let r = new Set([t[n]]);
		for (let i of e[n]) {
			r.add(t[i]);
			for (let n of e[i]) r.add(t[n]);
		}
		return r;
	};
	for (let r = 0; r < t.length; r++) {
		let c = s(r);
		if (c.size >= n) continue;
		let l = o(r), u = -1;
		for (let e = 0; e < n; e++) if (!c.has(e) && !l.has(e)) {
			u = e;
			break;
		}
		if (u < 0) continue;
		let d = i[u], f = Math.min(d.length, te);
		for (let n = 0; n < f; n++) {
			let s = d[(a + n) % d.length];
			if (s === r || l.size > 0 && e[r].includes(s) || o(s).has(t[r])) continue;
			let c = t[r];
			t[r] = u, t[s] = c, i[u][i[u].indexOf(s)] = r, i[c][i[c].indexOf(r)] = s, a = (a + n + 1) % Math.max(d.length, 1);
			break;
		}
	}
	return t;
}
function b(e) {
	return e?.type === "Polygon" || e?.type === "MultiPolygon";
}
function x(e) {
	return e.type === "Polygon" ? e.coordinates : e.type === "MultiPolygon" ? e.coordinates.flat() : [];
}
function re(e, t) {
	return `${Math.round(e[0] / t)},${Math.round(e[1] / t)}`;
}
var S = 8;
function C(e, t) {
	if (e.kind === "id") return t.id === void 0 || t.id === null ? null : String(t.id);
	let n = (e.kind === "property" ? [e.name] : e.names).map((e) => {
		let n = t.properties?.[e];
		return n == null ? "" : String(n);
	});
	return e.kind === "property" && n[0] === "" ? null : n.join("");
}
function ie(e) {
	let t = e.filter((e) => b(e.geometry));
	if (t.length === 0) return null;
	let n = t.map((e) => e.id);
	if (n.every((e) => e != null) && new Set(n.map(String)).size === n.length) return { kind: "id" };
	let r = /* @__PURE__ */ new Set();
	for (let e of t) for (let [t, n] of Object.entries(e.properties ?? {})) (typeof n != "object" || !n) && r.add(t);
	let i = [...r].filter((e) => t.every((t) => {
		let n = t.properties?.[e];
		return typeof n != "object" || !n;
	})), a = (e) => new Set(t.map((t) => C({
		kind: "properties",
		names: e
	}, t))).size;
	for (let e of i) {
		let n = t.map((t) => C({
			kind: "property",
			name: e
		}, t));
		if (n.every((e) => e !== null) && new Set(n).size === t.length) return {
			kind: "property",
			name: e
		};
	}
	let o = [...i].sort((e, t) => a([t]) - a([e])), s = [];
	for (let e of o.slice(0, S)) if (s.push(e), a(s) === t.length) return s.length === 1 ? {
		kind: "property",
		name: s[0]
	} : {
		kind: "properties",
		names: [...s]
	};
	return null;
}
//#endregion
//#region src/utils/style-builder.ts
var ae = {
	fill: "fill",
	outline: "line",
	line: "line",
	circle: "circle",
	label: "symbol",
	background: "background"
}, w = {
	fill: "fill-color",
	outline: "line-color",
	line: "line-color",
	circle: "circle-color",
	label: "text-color",
	background: "background-color"
}, T = {
	fill: "fill-opacity",
	outline: "line-opacity",
	line: "line-opacity",
	circle: "circle-opacity",
	label: "text-opacity",
	background: "background-opacity"
}, oe = "#cccccc";
function E(e) {
	let { field: t, maxValue: n, maxRadius: r } = e, i = Number((r / Math.sqrt(Math.max(n, 2 ** -52))).toPrecision(6));
	return {
		coefficient: i,
		expression: [
			"*",
			i,
			["sqrt", ["get", t]]
		]
	};
}
//#endregion
//#region src/utils/layer-style-model.ts
var se = "__webmapx_neighbour_class", D = {
	fill: {
		color: {
			key: w.fill,
			slot: "paint"
		},
		opacity: {
			key: T.fill,
			slot: "paint"
		},
		fillOutline: {
			key: "fill-outline-color",
			slot: "paint"
		}
	},
	outline: {
		color: {
			key: w.outline,
			slot: "paint"
		},
		opacity: {
			key: T.outline,
			slot: "paint"
		},
		width: {
			key: "line-width",
			slot: "paint"
		},
		dash: {
			key: "line-dasharray",
			slot: "paint"
		},
		lineJoin: {
			key: "line-join",
			slot: "layout"
		},
		lineCap: {
			key: "line-cap",
			slot: "layout"
		}
	},
	line: {
		color: {
			key: w.line,
			slot: "paint"
		},
		opacity: {
			key: T.line,
			slot: "paint"
		},
		width: {
			key: "line-width",
			slot: "paint"
		},
		dash: {
			key: "line-dasharray",
			slot: "paint"
		},
		lineJoin: {
			key: "line-join",
			slot: "layout"
		},
		lineCap: {
			key: "line-cap",
			slot: "layout"
		}
	},
	circle: {
		color: {
			key: w.circle,
			slot: "paint"
		},
		opacity: {
			key: T.circle,
			slot: "paint"
		},
		radius: {
			key: "circle-radius",
			slot: "paint"
		},
		strokeColor: {
			key: "circle-stroke-color",
			slot: "paint"
		},
		strokeWidth: {
			key: "circle-stroke-width",
			slot: "paint"
		}
	},
	label: {
		color: {
			key: w.label,
			slot: "paint"
		},
		opacity: {
			key: T.label,
			slot: "paint"
		},
		haloColor: {
			key: "text-halo-color",
			slot: "paint"
		},
		haloWidth: {
			key: "text-halo-width",
			slot: "paint"
		},
		text: {
			key: "text-field",
			slot: "layout"
		},
		textSize: {
			key: "text-size",
			slot: "layout"
		},
		font: {
			key: "text-font",
			slot: "layout"
		},
		placement: {
			key: "symbol-placement",
			slot: "layout"
		},
		anchor: {
			key: "text-anchor",
			slot: "layout"
		},
		offset: {
			key: "text-offset",
			slot: "layout"
		},
		allowOverlap: {
			key: "text-allow-overlap",
			slot: "layout"
		}
	},
	background: {
		color: {
			key: w.background,
			slot: "paint"
		},
		opacity: {
			key: T.background,
			slot: "paint"
		}
	}
};
function ce(e) {
	return e.kind === "id" ? ["to-string", ["id"]] : ["concat", ...(e.kind === "property" ? [e.name] : e.names).flatMap((e, t) => (t === 0 ? [] : [""]).concat([["to-string", ["get", e]]]))];
}
var le = {
	fill: [
		"color",
		"fillOutline",
		"opacity"
	],
	outline: [
		"width",
		"lineJoin",
		"color",
		"opacity"
	],
	line: [
		"width",
		"dash",
		"lineJoin",
		"color",
		"opacity"
	],
	circle: [
		"color",
		"radius",
		"strokeColor",
		"strokeWidth",
		"opacity"
	],
	label: [
		"text",
		"textSize",
		"color",
		"haloColor",
		"haloWidth",
		"opacity"
	],
	background: ["color", "opacity"]
}, ue = { label: [
	"font",
	"placement",
	"anchor",
	"offset",
	"allowOverlap"
] };
function O(e) {
	return le[e] ?? [];
}
function de(e) {
	return ue[e] ?? [];
}
function fe(e) {
	return [...O(e), ...de(e)];
}
function k(e) {
	switch (e.driver) {
		case "single": return e.value;
		case "custom": return e.expression;
		case "neighbours": return e.key && e.assignments ? [
			"match",
			ce(e.key),
			...e.assignments.flatMap(([t, n]) => [t, e.colors[n % e.colors.length]]),
			e.fallbackColor ?? j
		] : [
			"match",
			["get", e.attribute],
			...e.colors.flatMap((e, t) => [t, e]),
			e.fallbackColor ?? j
		];
		case "zoom": return pe(e);
		case "attribute": return ge(e);
	}
}
function pe(e) {
	let t = e.scale ?? 1;
	return [
		"interpolate",
		["linear"],
		["zoom"],
		...e.stops.flatMap(([e, n]) => [e, me(n * t)])
	];
}
function me(e) {
	return Number(e.toFixed(3));
}
function A(e, t) {
	let n = e.stops.map(([t, n]) => [t, n * (e.scale ?? 1)]);
	if (n.length === 0) return null;
	let r = t ?? n[0][0];
	if (r <= n[0][0]) return n[0][1];
	if (r >= n[n.length - 1][0]) return n[n.length - 1][1];
	for (let e = 1; e < n.length; e++) {
		let [t, i] = n[e - 1], [a, o] = n[e];
		if (r <= a) return i + (r - t) / (a - t) * (o - i);
	}
	return n[n.length - 1][1];
}
function he(e, t, n) {
	let r = A({
		...e,
		scale: 1
	}, n);
	return r === null || r === 0 ? {
		driver: "single",
		value: t
	} : {
		...e,
		scale: t / r
	};
}
var j = "#cccccc";
function ge(e) {
	let { attribute: t, classification: n } = e;
	if (n.kind === "proportional") {
		let { coefficient: e, zoomFactor: r } = n, i = (e) => [
			"*",
			e,
			["sqrt", ["get", t]]
		];
		return r === void 0 ? i(e) : [
			"interpolate",
			["exponential", r],
			["zoom"],
			0,
			i(e),
			24,
			i(e * r ** 24)
		];
	}
	if (n.kind === "ranges") {
		let { breaks: e, colors: r, noDataColor: i } = n;
		if (r.length === 1) return r[0];
		let a = [
			"step",
			["to-number", ["get", t]],
			r[0],
			...e.flatMap((e, t) => [e, r[t + 1]])
		];
		return i === void 0 ? a : [
			"case",
			["!", ["has", t]],
			i,
			[
				"==",
				["get", t],
				null
			],
			i,
			a
		];
	}
	return [
		"match",
		n.rawKeys ? ["get", t] : ["to-string", ["get", t]],
		...(n.rawKeys ? n.values.map((e) => Number(e)) : n.values).flatMap((e, t) => [e, n.colors[t]]),
		n.fallbackColor ?? j
	];
}
function _e(e) {
	let t = e.origin ?? {}, n = { ...t.paint ?? {} }, r = { ...t.layout ?? {} }, i = D[e.role] ?? {}, a = new Set([...Object.keys(e.channels), ...Object.keys(e.originChannels ?? {})]);
	for (let t of a) {
		let a = i[t];
		if (!a) continue;
		let o = e.channels[t];
		if (ye(e.originChannels?.[t], o)) continue;
		let s = a.slot === "layout" ? r : n, c = o ? k(o) : void 0;
		c === void 0 ? delete s[a.key] : s[a.key] = c;
	}
	let o = {
		...t,
		id: e.id,
		type: t.type ?? ae[e.role]
	};
	return (Object.keys(n).length > 0 || t.paint) && (o.paint = n), (Object.keys(r).length > 0 || t.layout) && (o.layout = r), ve(o, t, e), M(o, "filter", e.filter), M(o, "minzoom", e.minzoom), M(o, "maxzoom", e.maxzoom), o;
}
function ve(e, t, r) {
	let i = t.metadata && typeof t.metadata == "object" ? t.metadata : null, a = n(i), o = r.title?.trim() ?? "", s = r.noDataLabel?.trim() ?? "";
	if (o === (a ?? "") && s === String(i?.noDataLabel ?? "")) return;
	let c = { ...i ?? {} };
	o ? c.label = o : (delete c.label, delete c.title, delete c["webmapx:title"]), s ? c.noDataLabel = s : delete c.noDataLabel, Object.keys(c).length > 0 ? e.metadata = c : delete e.metadata;
}
function M(e, t, n) {
	n === void 0 ? delete e[t] : e[t] = n;
}
function ye(e, t) {
	return e === t ? !0 : !e || !t ? !1 : JSON.stringify(e) === JSON.stringify(t);
}
//#endregion
//#region src/utils/color-schemes-data.ts
var be = [
	{
		name: "Spectral",
		type: "div",
		sets: [
			{
				colors: [
					"#fc8d59",
					"#ffffbf",
					"#99d594"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#d7191c",
					"#fdae61",
					"#abdda4",
					"#2b83ba"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#d7191c",
					"#fdae61",
					"#ffffbf",
					"#abdda4",
					"#2b83ba"
				],
				blind: "maybe",
				print: "ok",
				screen: "maybe",
				copy: "ok"
			},
			{
				colors: [
					"#d53e4f",
					"#fc8d59",
					"#fee08b",
					"#e6f598",
					"#99d594",
					"#3288bd"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#d53e4f",
					"#fc8d59",
					"#fee08b",
					"#ffffbf",
					"#e6f598",
					"#99d594",
					"#3288bd"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#d53e4f",
					"#f46d43",
					"#fdae61",
					"#fee08b",
					"#e6f598",
					"#abdda4",
					"#66c2a5",
					"#3288bd"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#d53e4f",
					"#f46d43",
					"#fdae61",
					"#fee08b",
					"#ffffbf",
					"#e6f598",
					"#abdda4",
					"#66c2a5",
					"#3288bd"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#9e0142",
					"#d53e4f",
					"#f46d43",
					"#fdae61",
					"#fee08b",
					"#e6f598",
					"#abdda4",
					"#66c2a5",
					"#3288bd",
					"#5e4fa2"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#9e0142",
					"#d53e4f",
					"#f46d43",
					"#fdae61",
					"#fee08b",
					"#ffffbf",
					"#e6f598",
					"#abdda4",
					"#66c2a5",
					"#3288bd",
					"#5e4fa2"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "RdYlGn",
		type: "div",
		sets: [
			{
				colors: [
					"#fc8d59",
					"#ffffbf",
					"#91cf60"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#d7191c",
					"#fdae61",
					"#a6d96a",
					"#1a9641"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#d7191c",
					"#fdae61",
					"#ffffbf",
					"#a6d96a",
					"#1a9641"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#d73027",
					"#fc8d59",
					"#fee08b",
					"#d9ef8b",
					"#91cf60",
					"#1a9850"
				],
				blind: "bad",
				print: "maybe",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#d73027",
					"#fc8d59",
					"#fee08b",
					"#ffffbf",
					"#d9ef8b",
					"#91cf60",
					"#1a9850"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#d73027",
					"#f46d43",
					"#fdae61",
					"#fee08b",
					"#d9ef8b",
					"#a6d96a",
					"#66bd63",
					"#1a9850"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#d73027",
					"#f46d43",
					"#fdae61",
					"#fee08b",
					"#ffffbf",
					"#d9ef8b",
					"#a6d96a",
					"#66bd63",
					"#1a9850"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#a50026",
					"#d73027",
					"#f46d43",
					"#fdae61",
					"#fee08b",
					"#d9ef8b",
					"#a6d96a",
					"#66bd63",
					"#1a9850",
					"#006837"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#a50026",
					"#d73027",
					"#f46d43",
					"#fdae61",
					"#fee08b",
					"#ffffbf",
					"#d9ef8b",
					"#a6d96a",
					"#66bd63",
					"#1a9850",
					"#006837"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "RdBu",
		type: "div",
		sets: [
			{
				colors: [
					"#ef8a62",
					"#f7f7f7",
					"#67a9cf"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#ca0020",
					"#f4a582",
					"#92c5de",
					"#0571b0"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#ca0020",
					"#f4a582",
					"#f7f7f7",
					"#92c5de",
					"#0571b0"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#b2182b",
					"#ef8a62",
					"#fddbc7",
					"#d1e5f0",
					"#67a9cf",
					"#2166ac"
				],
				blind: "ok",
				print: "ok",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#b2182b",
					"#ef8a62",
					"#fddbc7",
					"#f7f7f7",
					"#d1e5f0",
					"#67a9cf",
					"#2166ac"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#b2182b",
					"#d6604d",
					"#f4a582",
					"#fddbc7",
					"#d1e5f0",
					"#92c5de",
					"#4393c3",
					"#2166ac"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#b2182b",
					"#d6604d",
					"#f4a582",
					"#fddbc7",
					"#f7f7f7",
					"#d1e5f0",
					"#92c5de",
					"#4393c3",
					"#2166ac"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#67001f",
					"#b2182b",
					"#d6604d",
					"#f4a582",
					"#fddbc7",
					"#d1e5f0",
					"#92c5de",
					"#4393c3",
					"#2166ac",
					"#053061"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#67001f",
					"#b2182b",
					"#d6604d",
					"#f4a582",
					"#fddbc7",
					"#f7f7f7",
					"#d1e5f0",
					"#92c5de",
					"#4393c3",
					"#2166ac",
					"#053061"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "PiYG",
		type: "div",
		sets: [
			{
				colors: [
					"#e9a3c9",
					"#f7f7f7",
					"#a1d76a"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#d01c8b",
					"#f1b6da",
					"#b8e186",
					"#4dac26"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#d01c8b",
					"#f1b6da",
					"#f7f7f7",
					"#b8e186",
					"#4dac26"
				],
				blind: "ok",
				print: "maybe",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#c51b7d",
					"#e9a3c9",
					"#fde0ef",
					"#e6f5d0",
					"#a1d76a",
					"#4d9221"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#c51b7d",
					"#e9a3c9",
					"#fde0ef",
					"#f7f7f7",
					"#e6f5d0",
					"#a1d76a",
					"#4d9221"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#c51b7d",
					"#de77ae",
					"#f1b6da",
					"#fde0ef",
					"#e6f5d0",
					"#b8e186",
					"#7fbc41",
					"#4d9221"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#c51b7d",
					"#de77ae",
					"#f1b6da",
					"#fde0ef",
					"#f7f7f7",
					"#e6f5d0",
					"#b8e186",
					"#7fbc41",
					"#4d9221"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#8e0152",
					"#c51b7d",
					"#de77ae",
					"#f1b6da",
					"#fde0ef",
					"#e6f5d0",
					"#b8e186",
					"#7fbc41",
					"#4d9221",
					"#276419"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#8e0152",
					"#c51b7d",
					"#de77ae",
					"#f1b6da",
					"#fde0ef",
					"#f7f7f7",
					"#e6f5d0",
					"#b8e186",
					"#7fbc41",
					"#4d9221",
					"#276419"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "PRGn",
		type: "div",
		sets: [
			{
				colors: [
					"#af8dc3",
					"#f7f7f7",
					"#7fbf7b"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#7b3294",
					"#c2a5cf",
					"#a6dba0",
					"#008837"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#7b3294",
					"#c2a5cf",
					"#f7f7f7",
					"#a6dba0",
					"#008837"
				],
				blind: "ok",
				print: "ok",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#762a83",
					"#af8dc3",
					"#e7d4e8",
					"#d9f0d3",
					"#7fbf7b",
					"#1b7837"
				],
				blind: "ok",
				print: "ok",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#762a83",
					"#af8dc3",
					"#e7d4e8",
					"#f7f7f7",
					"#d9f0d3",
					"#7fbf7b",
					"#1b7837"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#762a83",
					"#9970ab",
					"#c2a5cf",
					"#e7d4e8",
					"#d9f0d3",
					"#a6dba0",
					"#5aae61",
					"#1b7837"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#762a83",
					"#9970ab",
					"#c2a5cf",
					"#e7d4e8",
					"#f7f7f7",
					"#d9f0d3",
					"#a6dba0",
					"#5aae61",
					"#1b7837"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#40004b",
					"#762a83",
					"#9970ab",
					"#c2a5cf",
					"#e7d4e8",
					"#d9f0d3",
					"#a6dba0",
					"#5aae61",
					"#1b7837",
					"#00441b"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#40004b",
					"#762a83",
					"#9970ab",
					"#c2a5cf",
					"#e7d4e8",
					"#f7f7f7",
					"#d9f0d3",
					"#a6dba0",
					"#5aae61",
					"#1b7837",
					"#00441b"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "RdYlBu",
		type: "div",
		sets: [
			{
				colors: [
					"#fc8d59",
					"#ffffbf",
					"#91bfdb"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#d7191c",
					"#fdae61",
					"#abd9e9",
					"#2c7bb6"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#d7191c",
					"#fdae61",
					"#ffffbf",
					"#abd9e9",
					"#2c7bb6"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#d73027",
					"#fc8d59",
					"#fee090",
					"#e0f3f8",
					"#91bfdb",
					"#4575b4"
				],
				blind: "ok",
				print: "ok",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#d73027",
					"#fc8d59",
					"#fee090",
					"#ffffbf",
					"#e0f3f8",
					"#91bfdb",
					"#4575b4"
				],
				blind: "ok",
				print: "maybe",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#d73027",
					"#f46d43",
					"#fdae61",
					"#fee090",
					"#e0f3f8",
					"#abd9e9",
					"#74add1",
					"#4575b4"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#d73027",
					"#f46d43",
					"#fdae61",
					"#fee090",
					"#ffffbf",
					"#e0f3f8",
					"#abd9e9",
					"#74add1",
					"#4575b4"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#a50026",
					"#d73027",
					"#f46d43",
					"#fdae61",
					"#fee090",
					"#e0f3f8",
					"#abd9e9",
					"#74add1",
					"#4575b4",
					"#313695"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#a50026",
					"#d73027",
					"#f46d43",
					"#fdae61",
					"#fee090",
					"#ffffbf",
					"#e0f3f8",
					"#abd9e9",
					"#74add1",
					"#4575b4",
					"#313695"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "BrBG",
		type: "div",
		sets: [
			{
				colors: [
					"#d8b365",
					"#f5f5f5",
					"#5ab4ac"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#a6611a",
					"#dfc27d",
					"#80cdc1",
					"#018571"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#a6611a",
					"#dfc27d",
					"#f5f5f5",
					"#80cdc1",
					"#018571"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#8c510a",
					"#d8b365",
					"#f6e8c3",
					"#c7eae5",
					"#5ab4ac",
					"#01665e"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#8c510a",
					"#d8b365",
					"#f6e8c3",
					"#f5f5f5",
					"#c7eae5",
					"#5ab4ac",
					"#01665e"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#8c510a",
					"#bf812d",
					"#dfc27d",
					"#f6e8c3",
					"#c7eae5",
					"#80cdc1",
					"#35978f",
					"#01665e"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#8c510a",
					"#bf812d",
					"#dfc27d",
					"#f6e8c3",
					"#f5f5f5",
					"#c7eae5",
					"#80cdc1",
					"#35978f",
					"#01665e"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#543005",
					"#8c510a",
					"#bf812d",
					"#dfc27d",
					"#f6e8c3",
					"#c7eae5",
					"#80cdc1",
					"#35978f",
					"#01665e",
					"#003c30"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#543005",
					"#8c510a",
					"#bf812d",
					"#dfc27d",
					"#f6e8c3",
					"#f5f5f5",
					"#c7eae5",
					"#80cdc1",
					"#35978f",
					"#01665e",
					"#003c30"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "RdGy",
		type: "div",
		sets: [
			{
				colors: [
					"#ef8a62",
					"#ffffff",
					"#999999"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#ca0020",
					"#f4a582",
					"#bababa",
					"#404040"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#ca0020",
					"#f4a582",
					"#ffffff",
					"#bababa",
					"#404040"
				],
				blind: "maybe",
				print: "ok",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#b2182b",
					"#ef8a62",
					"#fddbc7",
					"#e0e0e0",
					"#999999",
					"#4d4d4d"
				],
				blind: "maybe",
				print: "maybe",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#b2182b",
					"#ef8a62",
					"#fddbc7",
					"#ffffff",
					"#e0e0e0",
					"#999999",
					"#4d4d4d"
				],
				blind: "maybe",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#b2182b",
					"#d6604d",
					"#f4a582",
					"#fddbc7",
					"#e0e0e0",
					"#bababa",
					"#878787",
					"#4d4d4d"
				],
				blind: "maybe",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#b2182b",
					"#d6604d",
					"#f4a582",
					"#fddbc7",
					"#ffffff",
					"#e0e0e0",
					"#bababa",
					"#878787",
					"#4d4d4d"
				],
				blind: "maybe",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#67001f",
					"#b2182b",
					"#d6604d",
					"#f4a582",
					"#fddbc7",
					"#e0e0e0",
					"#bababa",
					"#878787",
					"#4d4d4d",
					"#1a1a1a"
				],
				blind: "maybe",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#67001f",
					"#b2182b",
					"#d6604d",
					"#f4a582",
					"#fddbc7",
					"#ffffff",
					"#e0e0e0",
					"#bababa",
					"#878787",
					"#4d4d4d",
					"#1a1a1a"
				],
				blind: "maybe",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "PuOr",
		type: "div",
		sets: [
			{
				colors: [
					"#f1a340",
					"#f7f7f7",
					"#998ec3"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#e66101",
					"#fdb863",
					"#b2abd2",
					"#5e3c99"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#e66101",
					"#fdb863",
					"#f7f7f7",
					"#b2abd2",
					"#5e3c99"
				],
				blind: "ok",
				print: "maybe",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#b35806",
					"#f1a340",
					"#fee0b6",
					"#d8daeb",
					"#998ec3",
					"#542788"
				],
				blind: "ok",
				print: "maybe",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#b35806",
					"#f1a340",
					"#fee0b6",
					"#f7f7f7",
					"#d8daeb",
					"#998ec3",
					"#542788"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#b35806",
					"#e08214",
					"#fdb863",
					"#fee0b6",
					"#d8daeb",
					"#b2abd2",
					"#8073ac",
					"#542788"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#b35806",
					"#e08214",
					"#fdb863",
					"#fee0b6",
					"#f7f7f7",
					"#d8daeb",
					"#b2abd2",
					"#8073ac",
					"#542788"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#7f3b08",
					"#b35806",
					"#e08214",
					"#fdb863",
					"#fee0b6",
					"#d8daeb",
					"#b2abd2",
					"#8073ac",
					"#542788",
					"#2d004b"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#7f3b08",
					"#b35806",
					"#e08214",
					"#fdb863",
					"#fee0b6",
					"#f7f7f7",
					"#d8daeb",
					"#b2abd2",
					"#8073ac",
					"#542788",
					"#2d004b"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "Set2",
		type: "qual",
		sets: [
			{
				colors: [
					"#66c2a5",
					"#fc8d62",
					"#8da0cb"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#66c2a5",
					"#fc8d62",
					"#8da0cb",
					"#e78ac3"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#66c2a5",
					"#fc8d62",
					"#8da0cb",
					"#e78ac3",
					"#a6d854"
				],
				blind: "maybe",
				print: "ok",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#66c2a5",
					"#fc8d62",
					"#8da0cb",
					"#e78ac3",
					"#a6d854",
					"#ffd92f"
				],
				blind: "maybe",
				print: "maybe",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#66c2a5",
					"#fc8d62",
					"#8da0cb",
					"#e78ac3",
					"#a6d854",
					"#ffd92f",
					"#e5c494"
				],
				blind: "bad",
				print: "maybe",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#66c2a5",
					"#fc8d62",
					"#8da0cb",
					"#e78ac3",
					"#a6d854",
					"#ffd92f",
					"#e5c494",
					"#b3b3b3"
				],
				blind: "bad",
				print: "maybe",
				screen: "maybe",
				copy: "bad"
			}
		]
	},
	{
		name: "Accent",
		type: "qual",
		sets: [
			{
				colors: [
					"#7fc97f",
					"#beaed4",
					"#fdc086"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#7fc97f",
					"#beaed4",
					"#fdc086",
					"#ffff99"
				],
				blind: "bad",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#7fc97f",
					"#beaed4",
					"#fdc086",
					"#ffff99",
					"#386cb0"
				],
				blind: "bad",
				print: "maybe",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#7fc97f",
					"#beaed4",
					"#fdc086",
					"#ffff99",
					"#386cb0",
					"#f0027f"
				],
				blind: "bad",
				print: "maybe",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#7fc97f",
					"#beaed4",
					"#fdc086",
					"#ffff99",
					"#386cb0",
					"#f0027f",
					"#bf5b17"
				],
				blind: "bad",
				print: "maybe",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#7fc97f",
					"#beaed4",
					"#fdc086",
					"#ffff99",
					"#386cb0",
					"#f0027f",
					"#bf5b17",
					"#666666"
				],
				blind: "bad",
				print: "maybe",
				screen: "maybe",
				copy: "bad"
			}
		]
	},
	{
		name: "Set1",
		type: "qual",
		sets: [
			{
				colors: [
					"#e41a1c",
					"#377eb8",
					"#4daf4a"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#e41a1c",
					"#377eb8",
					"#4daf4a",
					"#984ea3"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#e41a1c",
					"#377eb8",
					"#4daf4a",
					"#984ea3",
					"#ff7f00"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#e41a1c",
					"#377eb8",
					"#4daf4a",
					"#984ea3",
					"#ff7f00",
					"#ffff33"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#e41a1c",
					"#377eb8",
					"#4daf4a",
					"#984ea3",
					"#ff7f00",
					"#ffff33",
					"#a65628"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#e41a1c",
					"#377eb8",
					"#4daf4a",
					"#984ea3",
					"#ff7f00",
					"#ffff33",
					"#a65628",
					"#f781bf"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#e41a1c",
					"#377eb8",
					"#4daf4a",
					"#984ea3",
					"#ff7f00",
					"#ffff33",
					"#a65628",
					"#f781bf",
					"#999999"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			}
		]
	},
	{
		name: "Set3",
		type: "qual",
		sets: [
			{
				colors: [
					"#8dd3c7",
					"#ffffb3",
					"#bebada"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#8dd3c7",
					"#ffffb3",
					"#bebada",
					"#fb8072"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "maybe"
			},
			{
				colors: [
					"#8dd3c7",
					"#ffffb3",
					"#bebada",
					"#fb8072",
					"#80b1d3"
				],
				blind: "bad",
				print: "ok",
				screen: "ok",
				copy: "maybe"
			},
			{
				colors: [
					"#8dd3c7",
					"#ffffb3",
					"#bebada",
					"#fb8072",
					"#80b1d3",
					"#fdb462"
				],
				blind: "bad",
				print: "ok",
				screen: "maybe",
				copy: "maybe"
			},
			{
				colors: [
					"#8dd3c7",
					"#ffffb3",
					"#bebada",
					"#fb8072",
					"#80b1d3",
					"#fdb462",
					"#b3de69"
				],
				blind: "bad",
				print: "ok",
				screen: "maybe",
				copy: "maybe"
			},
			{
				colors: [
					"#8dd3c7",
					"#ffffb3",
					"#bebada",
					"#fb8072",
					"#80b1d3",
					"#fdb462",
					"#b3de69",
					"#fccde5"
				],
				blind: "bad",
				print: "ok",
				screen: "maybe",
				copy: "maybe"
			},
			{
				colors: [
					"#8dd3c7",
					"#ffffb3",
					"#bebada",
					"#fb8072",
					"#80b1d3",
					"#fdb462",
					"#b3de69",
					"#fccde5",
					"#d9d9d9"
				],
				blind: "bad",
				print: "maybe",
				screen: "bad",
				copy: "maybe"
			},
			{
				colors: [
					"#8dd3c7",
					"#ffffb3",
					"#bebada",
					"#fb8072",
					"#80b1d3",
					"#fdb462",
					"#b3de69",
					"#fccde5",
					"#d9d9d9",
					"#bc80bd"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#8dd3c7",
					"#ffffb3",
					"#bebada",
					"#fb8072",
					"#80b1d3",
					"#fdb462",
					"#b3de69",
					"#fccde5",
					"#d9d9d9",
					"#bc80bd",
					"#ccebc5"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#8dd3c7",
					"#ffffb3",
					"#bebada",
					"#fb8072",
					"#80b1d3",
					"#fdb462",
					"#b3de69",
					"#fccde5",
					"#d9d9d9",
					"#bc80bd",
					"#ccebc5",
					"#ffed6f"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "Dark2",
		type: "qual",
		sets: [
			{
				colors: [
					"#1b9e77",
					"#d95f02",
					"#7570b3"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#1b9e77",
					"#d95f02",
					"#7570b3",
					"#e7298a"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#1b9e77",
					"#d95f02",
					"#7570b3",
					"#e7298a",
					"#66a61e"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#1b9e77",
					"#d95f02",
					"#7570b3",
					"#e7298a",
					"#66a61e",
					"#e6ab02"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#1b9e77",
					"#d95f02",
					"#7570b3",
					"#e7298a",
					"#66a61e",
					"#e6ab02",
					"#a6761d"
				],
				blind: "bad",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#1b9e77",
					"#d95f02",
					"#7570b3",
					"#e7298a",
					"#66a61e",
					"#e6ab02",
					"#a6761d",
					"#666666"
				],
				blind: "bad",
				print: "ok",
				screen: "ok",
				copy: "bad"
			}
		]
	},
	{
		name: "Paired",
		type: "qual",
		sets: [
			{
				colors: [
					"#a6cee3",
					"#1f78b4",
					"#b2df8a"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#a6cee3",
					"#1f78b4",
					"#b2df8a",
					"#33a02c"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#a6cee3",
					"#1f78b4",
					"#b2df8a",
					"#33a02c",
					"#fb9a99"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#a6cee3",
					"#1f78b4",
					"#b2df8a",
					"#33a02c",
					"#fb9a99",
					"#e31a1c"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#a6cee3",
					"#1f78b4",
					"#b2df8a",
					"#33a02c",
					"#fb9a99",
					"#e31a1c",
					"#fdbf6f"
				],
				blind: "maybe",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#a6cee3",
					"#1f78b4",
					"#b2df8a",
					"#33a02c",
					"#fb9a99",
					"#e31a1c",
					"#fdbf6f",
					"#ff7f00"
				],
				blind: "maybe",
				print: "maybe",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#a6cee3",
					"#1f78b4",
					"#b2df8a",
					"#33a02c",
					"#fb9a99",
					"#e31a1c",
					"#fdbf6f",
					"#ff7f00",
					"#cab2d6"
				],
				blind: "bad",
				print: "maybe",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#a6cee3",
					"#1f78b4",
					"#b2df8a",
					"#33a02c",
					"#fb9a99",
					"#e31a1c",
					"#fdbf6f",
					"#ff7f00",
					"#cab2d6",
					"#6a3d9a"
				],
				blind: "bad",
				print: "maybe",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#a6cee3",
					"#1f78b4",
					"#b2df8a",
					"#33a02c",
					"#fb9a99",
					"#e31a1c",
					"#fdbf6f",
					"#ff7f00",
					"#cab2d6",
					"#6a3d9a",
					"#ffff99"
				],
				blind: "bad",
				print: "maybe",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#a6cee3",
					"#1f78b4",
					"#b2df8a",
					"#33a02c",
					"#fb9a99",
					"#e31a1c",
					"#fdbf6f",
					"#ff7f00",
					"#cab2d6",
					"#6a3d9a",
					"#ffff99",
					"#b15928"
				],
				blind: "unknown",
				print: "unknown",
				screen: "unknown",
				copy: "bad"
			}
		]
	},
	{
		name: "Pastel2",
		type: "qual",
		sets: [
			{
				colors: [
					"#b3e2cd",
					"#fdcdac",
					"#cbd5e8"
				],
				blind: "maybe",
				print: "maybe",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#b3e2cd",
					"#fdcdac",
					"#cbd5e8",
					"#f4cae4"
				],
				blind: "bad",
				print: "bad",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#b3e2cd",
					"#fdcdac",
					"#cbd5e8",
					"#f4cae4",
					"#e6f5c9"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#b3e2cd",
					"#fdcdac",
					"#cbd5e8",
					"#f4cae4",
					"#e6f5c9",
					"#fff2ae"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#b3e2cd",
					"#fdcdac",
					"#cbd5e8",
					"#f4cae4",
					"#e6f5c9",
					"#fff2ae",
					"#f1e2cc"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#b3e2cd",
					"#fdcdac",
					"#cbd5e8",
					"#f4cae4",
					"#e6f5c9",
					"#fff2ae",
					"#f1e2cc",
					"#cccccc"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "Pastel1",
		type: "qual",
		sets: [
			{
				colors: [
					"#fbb4ae",
					"#b3cde3",
					"#ccebc5"
				],
				blind: "maybe",
				print: "maybe",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#fbb4ae",
					"#b3cde3",
					"#ccebc5",
					"#decbe4"
				],
				blind: "bad",
				print: "maybe",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#fbb4ae",
					"#b3cde3",
					"#ccebc5",
					"#decbe4",
					"#fed9a6"
				],
				blind: "bad",
				print: "maybe",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#fbb4ae",
					"#b3cde3",
					"#ccebc5",
					"#decbe4",
					"#fed9a6",
					"#ffffcc"
				],
				blind: "bad",
				print: "bad",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#fbb4ae",
					"#b3cde3",
					"#ccebc5",
					"#decbe4",
					"#fed9a6",
					"#ffffcc",
					"#e5d8bd"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fbb4ae",
					"#b3cde3",
					"#ccebc5",
					"#decbe4",
					"#fed9a6",
					"#ffffcc",
					"#e5d8bd",
					"#fddaec"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fbb4ae",
					"#b3cde3",
					"#ccebc5",
					"#decbe4",
					"#fed9a6",
					"#ffffcc",
					"#e5d8bd",
					"#fddaec",
					"#f2f2f2"
				],
				blind: "bad",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "OrRd",
		type: "seq",
		sets: [
			{
				colors: [
					"#fee8c8",
					"#fdbb84",
					"#e34a33"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#fef0d9",
					"#fdcc8a",
					"#fc8d59",
					"#d7301f"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#fef0d9",
					"#fdcc8a",
					"#fc8d59",
					"#e34a33",
					"#b30000"
				],
				blind: "ok",
				print: "bad",
				screen: "ok",
				copy: "maybe"
			},
			{
				colors: [
					"#fef0d9",
					"#fdd49e",
					"#fdbb84",
					"#fc8d59",
					"#e34a33",
					"#b30000"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fef0d9",
					"#fdd49e",
					"#fdbb84",
					"#fc8d59",
					"#ef6548",
					"#d7301f",
					"#990000"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fff7ec",
					"#fee8c8",
					"#fdd49e",
					"#fdbb84",
					"#fc8d59",
					"#ef6548",
					"#d7301f",
					"#990000"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fff7ec",
					"#fee8c8",
					"#fdd49e",
					"#fdbb84",
					"#fc8d59",
					"#ef6548",
					"#d7301f",
					"#b30000",
					"#7f0000"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "PuBu",
		type: "seq",
		sets: [
			{
				colors: [
					"#ece7f2",
					"#a6bddb",
					"#2b8cbe"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#f1eef6",
					"#bdc9e1",
					"#74a9cf",
					"#0570b0"
				],
				blind: "ok",
				print: "maybe",
				screen: "ok",
				copy: "maybe"
			},
			{
				colors: [
					"#f1eef6",
					"#bdc9e1",
					"#74a9cf",
					"#2b8cbe",
					"#045a8d"
				],
				blind: "ok",
				print: "maybe",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#f1eef6",
					"#d0d1e6",
					"#a6bddb",
					"#74a9cf",
					"#2b8cbe",
					"#045a8d"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f1eef6",
					"#d0d1e6",
					"#a6bddb",
					"#74a9cf",
					"#3690c0",
					"#0570b0",
					"#034e7b"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fff7fb",
					"#ece7f2",
					"#d0d1e6",
					"#a6bddb",
					"#74a9cf",
					"#3690c0",
					"#0570b0",
					"#034e7b"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fff7fb",
					"#ece7f2",
					"#d0d1e6",
					"#a6bddb",
					"#74a9cf",
					"#3690c0",
					"#0570b0",
					"#045a8d",
					"#023858"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "BuPu",
		type: "seq",
		sets: [
			{
				colors: [
					"#e0ecf4",
					"#9ebcda",
					"#8856a7"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#edf8fb",
					"#b3cde3",
					"#8c96c6",
					"#88419d"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "maybe"
			},
			{
				colors: [
					"#edf8fb",
					"#b3cde3",
					"#8c96c6",
					"#8856a7",
					"#810f7c"
				],
				blind: "ok",
				print: "maybe",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#edf8fb",
					"#bfd3e6",
					"#9ebcda",
					"#8c96c6",
					"#8856a7",
					"#810f7c"
				],
				blind: "ok",
				print: "maybe",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#edf8fb",
					"#bfd3e6",
					"#9ebcda",
					"#8c96c6",
					"#8c6bb1",
					"#88419d",
					"#6e016b"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f7fcfd",
					"#e0ecf4",
					"#bfd3e6",
					"#9ebcda",
					"#8c96c6",
					"#8c6bb1",
					"#88419d",
					"#6e016b"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f7fcfd",
					"#e0ecf4",
					"#bfd3e6",
					"#9ebcda",
					"#8c96c6",
					"#8c6bb1",
					"#88419d",
					"#810f7c",
					"#4d004b"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "Oranges",
		type: "seq",
		sets: [
			{
				colors: [
					"#fee6ce",
					"#fdae6b",
					"#e6550d"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#feedde",
					"#fdbe85",
					"#fd8d3c",
					"#d94701"
				],
				blind: "ok",
				print: "maybe",
				screen: "ok",
				copy: "maybe"
			},
			{
				colors: [
					"#feedde",
					"#fdbe85",
					"#fd8d3c",
					"#e6550d",
					"#a63603"
				],
				blind: "ok",
				print: "bad",
				screen: "ok",
				copy: "maybe"
			},
			{
				colors: [
					"#feedde",
					"#fdd0a2",
					"#fdae6b",
					"#fd8d3c",
					"#e6550d",
					"#a63603"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#feedde",
					"#fdd0a2",
					"#fdae6b",
					"#fd8d3c",
					"#f16913",
					"#d94801",
					"#8c2d04"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fff5eb",
					"#fee6ce",
					"#fdd0a2",
					"#fdae6b",
					"#fd8d3c",
					"#f16913",
					"#d94801",
					"#8c2d04"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fff5eb",
					"#fee6ce",
					"#fdd0a2",
					"#fdae6b",
					"#fd8d3c",
					"#f16913",
					"#d94801",
					"#a63603",
					"#7f2704"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "BuGn",
		type: "seq",
		sets: [
			{
				colors: [
					"#e5f5f9",
					"#99d8c9",
					"#2ca25f"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#edf8fb",
					"#b2e2e2",
					"#66c2a4",
					"#238b45"
				],
				blind: "ok",
				print: "ok",
				screen: "maybe",
				copy: "maybe"
			},
			{
				colors: [
					"#edf8fb",
					"#b2e2e2",
					"#66c2a4",
					"#2ca25f",
					"#006d2c"
				],
				blind: "ok",
				print: "maybe",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#edf8fb",
					"#ccece6",
					"#99d8c9",
					"#66c2a4",
					"#2ca25f",
					"#006d2c"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#edf8fb",
					"#ccece6",
					"#99d8c9",
					"#66c2a4",
					"#41ae76",
					"#238b45",
					"#005824"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f7fcfd",
					"#e5f5f9",
					"#ccece6",
					"#99d8c9",
					"#66c2a4",
					"#41ae76",
					"#238b45",
					"#005824"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f7fcfd",
					"#e5f5f9",
					"#ccece6",
					"#99d8c9",
					"#66c2a4",
					"#41ae76",
					"#238b45",
					"#006d2c",
					"#00441b"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "YlOrBr",
		type: "seq",
		sets: [
			{
				colors: [
					"#fff7bc",
					"#fec44f",
					"#d95f0e"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#ffffd4",
					"#fed98e",
					"#fe9929",
					"#cc4c02"
				],
				blind: "ok",
				print: "ok",
				screen: "maybe",
				copy: "maybe"
			},
			{
				colors: [
					"#ffffd4",
					"#fed98e",
					"#fe9929",
					"#d95f0e",
					"#993404"
				],
				blind: "ok",
				print: "maybe",
				screen: "bad",
				copy: "maybe"
			},
			{
				colors: [
					"#ffffd4",
					"#fee391",
					"#fec44f",
					"#fe9929",
					"#d95f0e",
					"#993404"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#ffffd4",
					"#fee391",
					"#fec44f",
					"#fe9929",
					"#ec7014",
					"#cc4c02",
					"#8c2d04"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#ffffe5",
					"#fff7bc",
					"#fee391",
					"#fec44f",
					"#fe9929",
					"#ec7014",
					"#cc4c02",
					"#8c2d04"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#ffffe5",
					"#fff7bc",
					"#fee391",
					"#fec44f",
					"#fe9929",
					"#ec7014",
					"#cc4c02",
					"#993404",
					"#662506"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "YlGn",
		type: "seq",
		sets: [
			{
				colors: [
					"#f7fcb9",
					"#addd8e",
					"#31a354"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#ffffcc",
					"#c2e699",
					"#78c679",
					"#238443"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "maybe"
			},
			{
				colors: [
					"#ffffcc",
					"#c2e699",
					"#78c679",
					"#31a354",
					"#006837"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#ffffcc",
					"#d9f0a3",
					"#addd8e",
					"#78c679",
					"#31a354",
					"#006837"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#ffffcc",
					"#d9f0a3",
					"#addd8e",
					"#78c679",
					"#41ab5d",
					"#238443",
					"#005a32"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#ffffe5",
					"#f7fcb9",
					"#d9f0a3",
					"#addd8e",
					"#78c679",
					"#41ab5d",
					"#238443",
					"#005a32"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#ffffe5",
					"#f7fcb9",
					"#d9f0a3",
					"#addd8e",
					"#78c679",
					"#41ab5d",
					"#238443",
					"#006837",
					"#004529"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "Reds",
		type: "seq",
		sets: [
			{
				colors: [
					"#fee0d2",
					"#fc9272",
					"#de2d26"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#fee5d9",
					"#fcae91",
					"#fb6a4a",
					"#cb181d"
				],
				blind: "ok",
				print: "maybe",
				screen: "maybe",
				copy: "maybe"
			},
			{
				colors: [
					"#fee5d9",
					"#fcae91",
					"#fb6a4a",
					"#de2d26",
					"#a50f15"
				],
				blind: "ok",
				print: "maybe",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fee5d9",
					"#fcbba1",
					"#fc9272",
					"#fb6a4a",
					"#de2d26",
					"#a50f15"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fee5d9",
					"#fcbba1",
					"#fc9272",
					"#fb6a4a",
					"#ef3b2c",
					"#cb181d",
					"#99000d"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fff5f0",
					"#fee0d2",
					"#fcbba1",
					"#fc9272",
					"#fb6a4a",
					"#ef3b2c",
					"#cb181d",
					"#99000d"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fff5f0",
					"#fee0d2",
					"#fcbba1",
					"#fc9272",
					"#fb6a4a",
					"#ef3b2c",
					"#cb181d",
					"#a50f15",
					"#67000d"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "RdPu",
		type: "seq",
		sets: [
			{
				colors: [
					"#fde0dd",
					"#fa9fb5",
					"#c51b8a"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#feebe2",
					"#fbb4b9",
					"#f768a1",
					"#ae017e"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "maybe"
			},
			{
				colors: [
					"#feebe2",
					"#fbb4b9",
					"#f768a1",
					"#c51b8a",
					"#7a0177"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#feebe2",
					"#fcc5c0",
					"#fa9fb5",
					"#f768a1",
					"#c51b8a",
					"#7a0177"
				],
				blind: "ok",
				print: "maybe",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#feebe2",
					"#fcc5c0",
					"#fa9fb5",
					"#f768a1",
					"#dd3497",
					"#ae017e",
					"#7a0177"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fff7f3",
					"#fde0dd",
					"#fcc5c0",
					"#fa9fb5",
					"#f768a1",
					"#dd3497",
					"#ae017e",
					"#7a0177"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fff7f3",
					"#fde0dd",
					"#fcc5c0",
					"#fa9fb5",
					"#f768a1",
					"#dd3497",
					"#ae017e",
					"#7a0177",
					"#49006a"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "Greens",
		type: "seq",
		sets: [
			{
				colors: [
					"#e5f5e0",
					"#a1d99b",
					"#31a354"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#edf8e9",
					"#bae4b3",
					"#74c476",
					"#238b45"
				],
				blind: "ok",
				print: "bad",
				screen: "maybe",
				copy: "maybe"
			},
			{
				colors: [
					"#edf8e9",
					"#bae4b3",
					"#74c476",
					"#31a354",
					"#006d2c"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#edf8e9",
					"#c7e9c0",
					"#a1d99b",
					"#74c476",
					"#31a354",
					"#006d2c"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#edf8e9",
					"#c7e9c0",
					"#a1d99b",
					"#74c476",
					"#41ab5d",
					"#238b45",
					"#005a32"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f7fcf5",
					"#e5f5e0",
					"#c7e9c0",
					"#a1d99b",
					"#74c476",
					"#41ab5d",
					"#238b45",
					"#005a32"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f7fcf5",
					"#e5f5e0",
					"#c7e9c0",
					"#a1d99b",
					"#74c476",
					"#41ab5d",
					"#238b45",
					"#006d2c",
					"#00441b"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "YlGnBu",
		type: "seq",
		sets: [
			{
				colors: [
					"#edf8b1",
					"#7fcdbb",
					"#2c7fb8"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#ffffcc",
					"#a1dab4",
					"#41b6c4",
					"#225ea8"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "maybe"
			},
			{
				colors: [
					"#ffffcc",
					"#a1dab4",
					"#41b6c4",
					"#2c7fb8",
					"#253494"
				],
				blind: "ok",
				print: "ok",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#ffffcc",
					"#c7e9b4",
					"#7fcdbb",
					"#41b6c4",
					"#2c7fb8",
					"#253494"
				],
				blind: "ok",
				print: "maybe",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#ffffcc",
					"#c7e9b4",
					"#7fcdbb",
					"#41b6c4",
					"#1d91c0",
					"#225ea8",
					"#0c2c84"
				],
				blind: "ok",
				print: "maybe",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#ffffd9",
					"#edf8b1",
					"#c7e9b4",
					"#7fcdbb",
					"#41b6c4",
					"#1d91c0",
					"#225ea8",
					"#0c2c84"
				],
				blind: "ok",
				print: "maybe",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#ffffd9",
					"#edf8b1",
					"#c7e9b4",
					"#7fcdbb",
					"#41b6c4",
					"#1d91c0",
					"#225ea8",
					"#253494",
					"#081d58"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "Purples",
		type: "seq",
		sets: [
			{
				colors: [
					"#efedf5",
					"#bcbddc",
					"#756bb1"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#f2f0f7",
					"#cbc9e2",
					"#9e9ac8",
					"#6a51a3"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "maybe"
			},
			{
				colors: [
					"#f2f0f7",
					"#cbc9e2",
					"#9e9ac8",
					"#756bb1",
					"#54278f"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f2f0f7",
					"#dadaeb",
					"#bcbddc",
					"#9e9ac8",
					"#756bb1",
					"#54278f"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f2f0f7",
					"#dadaeb",
					"#bcbddc",
					"#9e9ac8",
					"#807dba",
					"#6a51a3",
					"#4a1486"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fcfbfd",
					"#efedf5",
					"#dadaeb",
					"#bcbddc",
					"#9e9ac8",
					"#807dba",
					"#6a51a3",
					"#4a1486"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fcfbfd",
					"#efedf5",
					"#dadaeb",
					"#bcbddc",
					"#9e9ac8",
					"#807dba",
					"#6a51a3",
					"#54278f",
					"#3f007d"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "GnBu",
		type: "seq",
		sets: [
			{
				colors: [
					"#e0f3db",
					"#a8ddb5",
					"#43a2ca"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#f0f9e8",
					"#bae4bc",
					"#7bccc4",
					"#2b8cbe"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "maybe"
			},
			{
				colors: [
					"#f0f9e8",
					"#bae4bc",
					"#7bccc4",
					"#43a2ca",
					"#0868ac"
				],
				blind: "ok",
				print: "ok",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#f0f9e8",
					"#ccebc5",
					"#a8ddb5",
					"#7bccc4",
					"#43a2ca",
					"#0868ac"
				],
				blind: "ok",
				print: "maybe",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f0f9e8",
					"#ccebc5",
					"#a8ddb5",
					"#7bccc4",
					"#4eb3d3",
					"#2b8cbe",
					"#08589e"
				],
				blind: "ok",
				print: "maybe",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f7fcf0",
					"#e0f3db",
					"#ccebc5",
					"#a8ddb5",
					"#7bccc4",
					"#4eb3d3",
					"#2b8cbe",
					"#08589e"
				],
				blind: "ok",
				print: "maybe",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f7fcf0",
					"#e0f3db",
					"#ccebc5",
					"#a8ddb5",
					"#7bccc4",
					"#4eb3d3",
					"#2b8cbe",
					"#0868ac",
					"#084081"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "Greys",
		type: "seq",
		sets: [
			{
				colors: [
					"#f0f0f0",
					"#bdbdbd",
					"#636363"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#f7f7f7",
					"#cccccc",
					"#969696",
					"#525252"
				],
				blind: "ok",
				print: "ok",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#f7f7f7",
					"#cccccc",
					"#969696",
					"#636363",
					"#252525"
				],
				blind: "ok",
				print: "maybe",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f7f7f7",
					"#d9d9d9",
					"#bdbdbd",
					"#969696",
					"#636363",
					"#252525"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f7f7f7",
					"#d9d9d9",
					"#bdbdbd",
					"#969696",
					"#737373",
					"#525252",
					"#252525"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#ffffff",
					"#f0f0f0",
					"#d9d9d9",
					"#bdbdbd",
					"#969696",
					"#737373",
					"#525252",
					"#252525"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#ffffff",
					"#f0f0f0",
					"#d9d9d9",
					"#bdbdbd",
					"#969696",
					"#737373",
					"#525252",
					"#252525",
					"#000000"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "YlOrRd",
		type: "seq",
		sets: [
			{
				colors: [
					"#ffeda0",
					"#feb24c",
					"#f03b20"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#ffffb2",
					"#fecc5c",
					"#fd8d3c",
					"#e31a1c"
				],
				blind: "ok",
				print: "ok",
				screen: "maybe",
				copy: "maybe"
			},
			{
				colors: [
					"#ffffb2",
					"#fecc5c",
					"#fd8d3c",
					"#f03b20",
					"#bd0026"
				],
				blind: "ok",
				print: "maybe",
				screen: "maybe",
				copy: "maybe"
			},
			{
				colors: [
					"#ffffb2",
					"#fed976",
					"#feb24c",
					"#fd8d3c",
					"#f03b20",
					"#bd0026"
				],
				blind: "ok",
				print: "maybe",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#ffffb2",
					"#fed976",
					"#feb24c",
					"#fd8d3c",
					"#fc4e2a",
					"#e31a1c",
					"#b10026"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#ffffcc",
					"#ffeda0",
					"#fed976",
					"#feb24c",
					"#fd8d3c",
					"#fc4e2a",
					"#e31a1c",
					"#b10026"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#ffffcc",
					"#ffeda0",
					"#fed976",
					"#feb24c",
					"#fd8d3c",
					"#fc4e2a",
					"#e31a1c",
					"#bd0026",
					"#800026"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "PuRd",
		type: "seq",
		sets: [
			{
				colors: [
					"#e7e1ef",
					"#c994c7",
					"#dd1c77"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#f1eef6",
					"#d7b5d8",
					"#df65b0",
					"#ce1256"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "maybe"
			},
			{
				colors: [
					"#f1eef6",
					"#d7b5d8",
					"#df65b0",
					"#dd1c77",
					"#980043"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "bad"
			},
			{
				colors: [
					"#f1eef6",
					"#d4b9da",
					"#c994c7",
					"#df65b0",
					"#dd1c77",
					"#980043"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f1eef6",
					"#d4b9da",
					"#c994c7",
					"#df65b0",
					"#e7298a",
					"#ce1256",
					"#91003f"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f7f4f9",
					"#e7e1ef",
					"#d4b9da",
					"#c994c7",
					"#df65b0",
					"#e7298a",
					"#ce1256",
					"#91003f"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f7f4f9",
					"#e7e1ef",
					"#d4b9da",
					"#c994c7",
					"#df65b0",
					"#e7298a",
					"#ce1256",
					"#980043",
					"#67001f"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "Blues",
		type: "seq",
		sets: [
			{
				colors: [
					"#deebf7",
					"#9ecae1",
					"#3182bd"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#eff3ff",
					"#bdd7e7",
					"#6baed6",
					"#2171b5"
				],
				blind: "ok",
				print: "maybe",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#eff3ff",
					"#bdd7e7",
					"#6baed6",
					"#3182bd",
					"#08519c"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#eff3ff",
					"#c6dbef",
					"#9ecae1",
					"#6baed6",
					"#3182bd",
					"#08519c"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#eff3ff",
					"#c6dbef",
					"#9ecae1",
					"#6baed6",
					"#4292c6",
					"#2171b5",
					"#084594"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f7fbff",
					"#deebf7",
					"#c6dbef",
					"#9ecae1",
					"#6baed6",
					"#4292c6",
					"#2171b5",
					"#084594"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f7fbff",
					"#deebf7",
					"#c6dbef",
					"#9ecae1",
					"#6baed6",
					"#4292c6",
					"#2171b5",
					"#08519c",
					"#08306b"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	},
	{
		name: "PuBuGn",
		type: "seq",
		sets: [
			{
				colors: [
					"#ece2f0",
					"#a6bddb",
					"#1c9099"
				],
				blind: "ok",
				print: "ok",
				screen: "ok",
				copy: "ok"
			},
			{
				colors: [
					"#f6eff7",
					"#bdc9e1",
					"#67a9cf",
					"#02818a"
				],
				blind: "ok",
				print: "maybe",
				screen: "ok",
				copy: "maybe"
			},
			{
				colors: [
					"#f6eff7",
					"#bdc9e1",
					"#67a9cf",
					"#1c9099",
					"#016c59"
				],
				blind: "ok",
				print: "maybe",
				screen: "maybe",
				copy: "bad"
			},
			{
				colors: [
					"#f6eff7",
					"#d0d1e6",
					"#a6bddb",
					"#67a9cf",
					"#1c9099",
					"#016c59"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#f6eff7",
					"#d0d1e6",
					"#a6bddb",
					"#67a9cf",
					"#3690c0",
					"#02818a",
					"#016450"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fff7fb",
					"#ece2f0",
					"#d0d1e6",
					"#a6bddb",
					"#67a9cf",
					"#3690c0",
					"#02818a",
					"#016450"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			},
			{
				colors: [
					"#fff7fb",
					"#ece2f0",
					"#d0d1e6",
					"#a6bddb",
					"#67a9cf",
					"#3690c0",
					"#02818a",
					"#016c59",
					"#014636"
				],
				blind: "ok",
				print: "bad",
				screen: "bad",
				copy: "bad"
			}
		]
	}
];
//#endregion
//#region src/utils/color-schemes-cvd.ts
function N(e) {
	let t = [];
	for (let n = 3; n <= e.length; n++) t.push({
		colors: e.slice(0, n),
		blind: "ok",
		print: "unknown",
		screen: "ok",
		copy: "unknown"
	});
	return t;
}
var xe = [
	{
		name: "OkabeIto",
		type: "qual",
		sets: N([
			"#e69f00",
			"#56b4e9",
			"#009e73",
			"#f0e442",
			"#0072b2",
			"#d55e00",
			"#cc79a7",
			"#000000"
		])
	},
	{
		name: "TolBright",
		type: "qual",
		sets: N([
			"#4477aa",
			"#ee6677",
			"#228833",
			"#ccbb44",
			"#66ccee",
			"#aa3377",
			"#bbbbbb"
		])
	},
	{
		name: "TolMuted",
		type: "qual",
		sets: N([
			"#cc6677",
			"#332288",
			"#ddcc77",
			"#117733",
			"#88ccee",
			"#882255",
			"#44aa99",
			"#999933",
			"#aa4499"
		])
	}
], P = [...be, ...xe], Se = [
	"blind",
	"print",
	"screen",
	"copy"
], F = 3;
function I(e, t) {
	return t ? Se.every((n) => {
		let r = t[n] ?? "bad";
		return r === "bad" ? !0 : r === "maybe" ? e[n] === "ok" || e[n] === "maybe" : e[n] === "ok";
	}) : !0;
}
function L(e, t, n, r) {
	return {
		...t,
		name: e.name,
		type: e.type,
		colors: r ? [...n].reverse() : n
	};
}
function R(e, t, n = {}) {
	let r = Math.floor(e);
	if (!Number.isFinite(r) || r < 1) return [];
	let i = n.reversed ?? !1;
	if (r < F) return P.filter((e) => e.type === t && I(e.sets[0], n.usage)).map((e) => {
		let [t, , n] = e.sets[0].colors, a = r === 1 ? [n] : [t, n];
		return L(e, e.sets[0], a, i);
	});
	let a = r - F;
	return P.filter((e) => e.type === t && e.sets.length > a && I(e.sets[a], n.usage)).map((e) => L(e, e.sets[a], e.sets[a].colors, i));
}
function z(e) {
	return P.filter((t) => t.type === e).reduce((e, t) => Math.max(e, t.sets.length + F - 1), 0);
}
function Ce(e, t, n = {}) {
	let r = P.find((t) => t.name === e);
	return r ? R(t, r.type, n).find((t) => t.name === e) ?? null : null;
}
function we(e) {
	return P.filter((t) => t.type === e).map((e) => e.name);
}
//#endregion
//#region src/utils/classification.ts
var Te = 3e3;
function B(e, t) {
	let n = [], r = 0;
	for (let i of e) {
		let e = i.properties?.[t], a = typeof e == "number" || typeof e == "string" && e.trim() !== "" ? Number(e) : NaN;
		Number.isFinite(a) ? n.push(a) : r++;
	}
	return {
		values: n,
		missing: r
	};
}
function V(e, t) {
	let n = [...e].filter(Number.isFinite).sort((e, t) => e - t), r = t.missing ?? 0;
	if (n.length === 0) return {
		method: t.method,
		breaks: [],
		classes: [],
		min: NaN,
		max: NaN,
		missing: r
	};
	let i = n[0], a = n[n.length - 1], o = new Set(n).size, s = Math.max(1, Math.floor(t.classCount ?? 5)), c = t.method === "manual" ? (t.breaks?.length ?? 0) + 1 : Math.min(s, o), l = t.method === "manual" ? [...t.breaks ?? []].map(Number).filter(Number.isFinite).sort((e, t) => e - t) : Ee(n, c, t.method, i, a), u = t.method === "manual" ? l : Oe(n, l), d = t.method !== "manual" && t.niceBreaks ? Ae(n, u) : u;
	return {
		method: t.method,
		breaks: d,
		classes: ze(n, d, i, a),
		min: i,
		max: a,
		missing: r
	};
}
function Ee(e, t, n, r, i) {
	if (t <= 1 || r === i) return [];
	switch (n) {
		case "equalInterval": return H(r, i, t);
		case "geometric": return De(e, t, r, i);
		case "quantile": return Fe(e, t);
		case "standardDeviation": return Ie(e, t);
		default: return Le(e, t);
	}
}
function H(e, t, n) {
	let r = (t - e) / n;
	return Array.from({ length: n - 1 }, (t, n) => e + r * (n + 1));
}
function De(e, t, n, r) {
	if (n < 0 || r <= 0) return H(n, r, t);
	let i = e.find((e) => e > 0) ?? r, a = Math.max(i, r / 100);
	if (a >= r) return H(n, r, t);
	let o = (r / a) ** (1 / t), s = [];
	for (let e = 1; e < t; e++) s.push(a * o ** e);
	return q(s.map((e) => Number(e.toFixed(6)))).filter((e) => e > n && e < r);
}
function Oe(e, t) {
	if (e.length === 0) return [...t];
	let n = [
		e[0],
		...t,
		e[e.length - 1]
	], r = W(e);
	return t.map((t, i) => {
		if (!Number.isFinite(t)) return t;
		let a = G * Math.min(t - n[i], n[i + 2] - t);
		return Me(Math.max(Ne(e, t) ?? -Infinity, t - a), Math.min(Pe(e, t) ?? Infinity, t + a), t, r);
	});
}
var ke = .1;
function Ae(e, t) {
	if (e.length === 0 || t.length === 0) return [...t];
	let n = [
		e[0],
		...t,
		e[e.length - 1]
	], r = W(e), i = [];
	return t.forEach((a, o) => {
		if (!Number.isFinite(a)) {
			i.push(a);
			return;
		}
		let s = n[o], c = n[o + 2], l = G * Math.min(a - s, c - a), u = U(e, a) - U(e, s), d = U(e, c) - U(e, a) + (o === t.length - 1 ? je(e, c) : 0), f = ke * Math.min(u, d), p = i.length ? i[i.length - 1] : -Infinity, m = a, h = Math.ceil(Math.log10(Math.max(Math.abs(a), l, r))) + 1, g = Math.floor(Math.log10(r));
		search: for (let t = h; t >= g; t--) {
			let n = 10 ** t;
			for (let t of [
				1,
				.5,
				.25
			]) {
				let i = n * t, o = K(Math.round(a / i) * i, i);
				if (!(Math.abs(o / r - Math.round(o / r)) > 1e-9) && !(Math.abs(o - a) > l || o <= p || o <= s || o >= c) && !(Math.abs(U(e, o) - U(e, a)) > f)) {
					m = o;
					break search;
				}
			}
		}
		i.push(m);
	}), i;
}
function U(e, t) {
	let n = 0, r = e.length;
	for (; n < r;) {
		let i = n + r >> 1;
		e[i] < t ? n = i + 1 : r = i;
	}
	return n;
}
function je(e, t) {
	let n = U(e, t), r = 0;
	for (; n < e.length && e[n] === t;) r++, n++;
	return r;
}
function W(e) {
	for (let t = 0; t < 6; t++) {
		let n = 10 ** -t;
		if (e.every((e) => Math.abs(e / n - Math.round(e / n)) < 1e-9)) return n;
	}
	return 10 ** -6;
}
var G = .25;
function Me(e, t, n, r) {
	if (!(t > e)) return n;
	let i = Math.ceil(Math.log10(Math.max(Math.abs(n), t - e))) + 1, a = Math.floor(Math.log10(r));
	for (let o = i; o >= a; o--) {
		let i = 10 ** o;
		for (let a of [
			1,
			.5,
			.25
		]) {
			let o = i * a, s = K(Math.round(n / o) * o, o);
			if (!(Math.abs(s / r - Math.round(s / r)) > 1e-9) && s > e && s <= t) return s;
		}
	}
	return n;
}
function K(e, t) {
	let n = Math.max(0, -Math.floor(Math.log10(t)) + 1);
	return Number(e.toFixed(Math.min(12, n)));
}
function Ne(e, t) {
	let n = 0, r = e.length;
	for (; n < r;) {
		let i = n + r >> 1;
		e[i] < t ? n = i + 1 : r = i;
	}
	return n > 0 ? e[n - 1] : null;
}
function Pe(e, t) {
	let n = 0, r = e.length;
	for (; n < r;) {
		let i = n + r >> 1;
		e[i] < t ? n = i + 1 : r = i;
	}
	return n < e.length ? e[n] : null;
}
function Fe(e, t) {
	let n = [];
	for (let r = 1; r < t; r++) {
		let i = e.length * r / t, a = Math.floor(i), o = i === a ? (e[a - 1] + e[a]) / 2 : e[Math.min(a, e.length - 1)];
		n.push(o);
	}
	return q(n);
}
function Ie(e, t) {
	let n = e.reduce((e, t) => e + t, 0) / e.length, r = e.reduce((e, t) => e + (t - n) ** 2, 0) / e.length, i = Math.sqrt(r);
	if (i === 0) return [];
	let a = [];
	for (let e = 1; e < t; e++) a.push(n + (e - t / 2) * i);
	return q(a.map((e) => Number(e.toFixed(12)))).filter((t) => t > e[0] && t < e[e.length - 1]);
}
function Le(e, t) {
	let n = e.length > 3e3 ? Re(e, Te) : e, r = n.length, i = Math.min(t, new Set(n).size);
	if (i <= 1) return [];
	let a = [], o = [];
	for (let e = 0; e < i; e++) a.push(new Float64Array(r).fill(Infinity)), o.push(new Int32Array(r));
	let s = new Float64Array(r + 1), c = new Float64Array(r + 1);
	for (let e = 0; e < r; e++) s[e + 1] = s[e] + n[e], c[e + 1] = c[e] + n[e] * n[e];
	let l = (e, t) => {
		let n = t - e + 1, r = s[t + 1] - s[e];
		return Math.max(0, c[t + 1] - c[e] - r * r / n);
	};
	for (let e = 0; e < r; e++) a[0][e] = l(0, e);
	for (let e = 1; e < i; e++) for (let t = e; t < r; t++) {
		let n = Infinity, r = e;
		for (let i = e; i <= t; i++) {
			let o = a[e - 1][i - 1] + l(i, t);
			o < n && (n = o, r = i);
		}
		a[e][t] = n, o[e][t] = r;
	}
	let u = [], d = r - 1;
	for (let e = i - 1; e > 0; e--) {
		let t = o[e][d];
		u.unshift((n[t - 1] + n[t]) / 2), d = t - 1;
	}
	return q(u);
}
function Re(e, t) {
	let n = (e.length - 1) / (t - 1);
	return Array.from({ length: t }, (t, r) => e[Math.round(r * n)]);
}
function q(e) {
	return [...new Set(e)].sort((e, t) => e - t);
}
function ze(e, t, n, r) {
	let i = [
		n,
		...t,
		r
	], a = [];
	for (let e = 0; e < i.length - 1; e++) a.push({
		min: i[e],
		max: i[e + 1],
		count: 0
	});
	if (a.length === 0) return a;
	for (let t of e) {
		let e = a.findIndex((e) => t >= e.min && t < e.max);
		e === -1 && (e = a.length - 1), a[e].count++;
	}
	return a;
}
function J(e, t, n = {}) {
	let r = Math.max(1, Math.floor(n.maxCategories ?? 12)), i = /* @__PURE__ */ new Map(), a = 0;
	for (let n of e) {
		let e = n.properties?.[t];
		if (e == null || e === "") {
			a++;
			continue;
		}
		if (typeof e == "object") {
			a++;
			continue;
		}
		let r = String(e), o = i.get(r);
		o ? o.count++ : i.set(r, {
			value: e,
			count: 1
		});
	}
	let o = [...i.values()].sort((e, t) => t.count - e.count || String(e.value).localeCompare(String(t.value))), s = o.slice(0, r), c = o.slice(r);
	return {
		categories: s,
		otherCount: c.reduce((e, t) => e + t.count, 0),
		otherValues: c.length,
		missing: a
	};
}
function Be(e) {
	return e.min < 0 && e.max > 0 ? "div" : "seq";
}
var Ve = {
	naturalBreaks: "Natural breaks",
	quantile: "Equal count",
	geometric: "Each class a step bigger",
	equalInterval: "Equal intervals",
	standardDeviation: "Standard deviation",
	manual: "Manual"
}, He = {
	naturalBreaks: "Puts the boundaries where the data has gaps. A good first choice.",
	quantile: "Every class holds the same number of features. Always a full-looking map.",
	geometric: "Each class covers a multiple of the one below. For data with a long tail.",
	equalInterval: "Classes of equal width. Honest, but skewed data crowds into one class.",
	standardDeviation: "Distance from the average. For data spread evenly around a middle.",
	manual: "Type the boundaries yourself."
}, Ue = [
	"naturalBreaks",
	"quantile",
	"geometric",
	"equalInterval",
	"standardDeviation"
];
function We(e) {
	return {
		attribute: e,
		method: "quantile",
		classCount: 5,
		schemeName: null,
		reversed: !1,
		blindSafe: !1,
		maxCategories: 8,
		cycle: null,
		noDataColor: oe
	};
}
function Ge(e) {
	return e === "number" || e === "integer" || e === "float";
}
function Y(e, t, n) {
	return R(e, t, {
		reversed: n.reversed,
		usage: n.blindSafe ? { blind: "ok" } : void 0
	});
}
function X(e, t, n) {
	return n.blindSafe ? {
		channel: null,
		problem: t === "qual" ? `No colour-blind-safe palette has ${e} distinct colours — the largest colour-blind-safe palette (Tol muted) has nine. Use fewer categories, or turn the filter off.` : `No colour-blind-safe palette has ${e} classes. Use fewer, or turn the filter off.`
	} : {
		channel: null,
		problem: `No palette has ${e} classes. Use fewer.`
	};
}
function Ke(e, t, n) {
	return t ? qe(e, n) : Ye(e, n);
}
function qe(e, t) {
	let { values: n, missing: r } = B(e, t.attribute);
	if (n.length === 0) return null;
	let i = V(n, {
		method: t.method,
		classCount: t.classCount,
		missing: r,
		niceBreaks: t.niceBreaks
	}), a = i.classes;
	if (a.length === 0) return null;
	let o = Be(i), s = Q(a.length, o, t);
	if (!s) return X(a.length, o, t);
	let c = [...s.colors], l = {
		driver: "attribute",
		attribute: t.attribute,
		classification: {
			kind: "ranges",
			breaks: [...i.breaks],
			colors: c,
			noDataColor: t.noDataColor
		},
		schemeName: s.name
	}, u = a.map((e, t) => ({
		color: c[t],
		label: `${$(e.min)} – ${$(e.max)}`
	})), d = a.reduce((e, t) => e + t.count, 0), f = Math.max(...a.map((e) => e.count));
	return {
		channel: l,
		legend: u,
		...d > 0 && f / d > .8 ? { warning: `One class holds ${Math.round(f / d * 100)}% of the features. Try another method, or fewer classes.` } : {}
	};
}
function Z(e, t) {
	return t.cycle === null ? !0 : t.cycle;
}
function Je(e, t) {
	return Z(e, t) ? Math.min(t.maxCategories, z("qual")) : J(e, t.attribute, { maxCategories: t.maxCategories }).categories.length;
}
function Ye(e, t) {
	if (Z(e, t)) {
		let n = J(e, t.attribute, { maxCategories: 2 ** 53 - 1 });
		if (n.categories.length === 0) return null;
		let r = Math.min(t.maxCategories, z("qual")), i = Q(r, "qual", t);
		if (!i) return X(r, "qual", t);
		let a = n.categories.map((e) => String(e.value)), o = new Map(a.map((e, t) => [e, t])), s = ee(e, (e) => o.get(String(e.properties?.[t.attribute])) ?? null, a.length, i.colors.length), c = a.map((e, t) => i.colors[(s?.[t] ?? t) % i.colors.length]);
		return {
			channel: {
				driver: "attribute",
				attribute: t.attribute,
				classification: {
					kind: "categories",
					values: a,
					colors: c,
					fallbackColor: t.noDataColor
				},
				schemeName: i.name
			},
			legend: a.map((e, t) => ({
				color: c[t],
				label: e
			})),
			...a.length > i.colors.length ? { warning: `${a.length} values share ${i.colors.length} colours, so two areas far apart may match. Touching ones do not.` } : {}
		};
	}
	let n = J(e, t.attribute, { maxCategories: t.maxCategories });
	if (n.categories.length === 0) return null;
	let r = Q(n.categories.length, "qual", t);
	if (!r) return X(n.categories.length, "qual", t);
	let i = [...r.colors].slice(0, n.categories.length), a = n.categories.map((e, t) => ({
		color: i[t],
		label: String(e.value)
	})), o = n.otherValues;
	return o > 0 && a.push({
		color: t.noDataColor,
		label: "other"
	}), {
		channel: {
			driver: "attribute",
			attribute: t.attribute,
			classification: {
				kind: "categories",
				values: n.categories.map((e) => String(e.value)),
				colors: i,
				fallbackColor: t.noDataColor
			},
			schemeName: r.name
		},
		legend: a,
		...o > 0 ? { warning: `${o} more value${o === 1 ? "" : "s"} share one grey. Raise the limit, or give every value a colour.` } : {}
	};
}
function Xe(e, t, n, r) {
	let { values: i } = B(e, t), a = Math.max(...i, 0);
	if (i.length === 0 || a <= 0) return null;
	let { coefficient: o } = E({
		field: t,
		maxValue: a,
		maxRadius: n
	});
	return {
		channel: {
			driver: "attribute",
			attribute: t,
			classification: r === void 0 ? {
				kind: "proportional",
				coefficient: o
			} : {
				kind: "proportional",
				coefficient: o / 2 ** r,
				zoomFactor: 2
			}
		},
		legend: []
	};
}
function Q(e, t, n) {
	let r = Y(e, t, n);
	return r.length === 0 ? null : r.find((e) => e.name === n.schemeName) ?? r[0];
}
function $(e) {
	if (!Number.isFinite(e)) return "?";
	let t = Math.abs(e), n = t >= 100 ? 0 : t >= 1 ? 1 : 3;
	return Number(e.toFixed(n)).toLocaleString("en-US");
}
//#endregion
export { e as A, E as C, l as D, C as E, n as O, A as S, ie as T, fe as _, Ke as a, _e as b, Ge as c, V as d, R as f, se as g, D as h, Je as i, t as k, Y as l, we as m, Ve as n, Xe as o, Ce as p, Ue as r, We as s, He as t, J as u, O as v, p as w, he as x, k as y };
