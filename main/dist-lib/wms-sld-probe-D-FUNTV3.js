//#region src/utils/wms-sld.ts
var e = [414, 431];
function t(e) {
	return String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function n(e, n) {
	return `<CssParameter name="${e}">${t(n)}</CssParameter>`;
}
function r(e) {
	let t = String(e ?? "").trim(), n = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i.exec(t);
	if (n) {
		let e = (e) => Math.max(0, Math.min(255, Math.round(Number(e)))).toString(16).padStart(2, "0"), t = n[4], r = t === void 0 ? 1 : t.endsWith("%") ? Number(t.slice(0, -1)) / 100 : Number(t);
		return {
			color: `#${e(n[1])}${e(n[2])}${e(n[3])}`,
			opacity: Number.isFinite(r) ? Math.max(0, Math.min(1, r)) : 1
		};
	}
	let r = /^#([0-9a-f]{3,8})$/i.exec(t);
	if (r) {
		let e = r[1];
		if (e.length === 3 || e.length === 4) {
			let t = [...e].map((e) => e + e).join("");
			return {
				color: `#${t.slice(0, 6)}`.toLowerCase(),
				opacity: e.length === 4 ? parseInt(t.slice(6, 8), 16) / 255 : 1
			};
		}
		if (e.length === 6) return {
			color: `#${e}`.toLowerCase(),
			opacity: 1
		};
		if (e.length === 8) return {
			color: `#${e.slice(0, 6)}`.toLowerCase(),
			opacity: parseInt(e.slice(6, 8), 16) / 255
		};
	}
	return {
		color: t || "#000000",
		opacity: 1
	};
}
function i(e, i, a) {
	let { color: o, opacity: s } = r(i), c = (a.opacity ?? 1) * s, l = a.strokeColor ? r(a.strokeColor) : null, u = l?.color, d = a.strokeWidth ?? 1, f = `<Fill>${n("fill", o)}${c < 1 ? n("fill-opacity", c) : ""}</Fill>`, p = u ? `<Stroke>${n("stroke", u)}${n("stroke-width", d)}${(l?.opacity ?? 1) < 1 ? n("stroke-opacity", l.opacity) : ""}</Stroke>` : "";
	return e === "polygon" ? `<PolygonSymbolizer>${f}${p}</PolygonSymbolizer>` : e === "line" ? `<LineSymbolizer><Stroke>${n("stroke", o)}${n("stroke-width", d)}${c < 1 ? n("stroke-opacity", c) : ""}</Stroke></LineSymbolizer>` : `<PointSymbolizer><Graphic><Mark><WellKnownName>circle</WellKnownName>${f}${p}</Mark><Size>${t(a.size ?? 8)}</Size></Graphic></PointSymbolizer>`;
}
function a(e, t, n) {
	return [
		"polygon",
		"line",
		"point"
	].map((r, a) => s(`${n}-${a}`, t, i(r, o(e), e))).join("");
}
function o(e) {
	return e.kind === "single" ? e.color : e.kind === "categories" ? e.categories[0]?.color ?? "#000000" : e.breaks[0]?.color ?? "#000000";
}
function s(e, n, r) {
	return `<Rule><Name>${t(e)}</Name>${n}${r}</Rule>`;
}
function c(e, n, r) {
	return `<ogc:${e}><ogc:PropertyName>${t(n)}</ogc:PropertyName><ogc:Literal>${t(r)}</ogc:Literal></ogc:${e}>`;
}
function l(e, t) {
	if (t.kind === "single") return e === "unknown" ? a(t, "", "all") : s("all", "", i(e, t.color, t));
	if (t.kind === "categories") {
		let n = t.categories.map((n) => s(String(n.label ?? n.value), `<ogc:Filter>${c("PropertyIsEqualTo", t.attribute, n.value)}</ogc:Filter>`, i(e, n.color, t)));
		return t.otherColor && n.push(`<Rule><Name>other</Name><ElseFilter/>${i(e, t.otherColor, t)}</Rule>`), n.join("");
	}
	let n = null;
	return t.breaks.map((r) => {
		let a = [];
		n !== null && a.push(c("PropertyIsGreaterThanOrEqualTo", t.attribute, n)), r.upTo !== null && a.push(c("PropertyIsLessThan", t.attribute, r.upTo)), n = r.upTo;
		let o = a.length === 0 ? "" : `<ogc:Filter>${a.length > 1 ? `<ogc:And>${a.join("")}</ogc:And>` : a[0]}</ogc:Filter>`;
		return s(r.label ?? `${r.upTo ?? "max"}`, o, i(e, r.color, t));
	}).join("");
}
function u(e, n, r) {
	return `<?xml version="1.0" encoding="UTF-8"?><StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc"><NamedLayer><Name>${t(e)}</Name><UserStyle><Name>webmapx</Name><FeatureTypeStyle>` + l(n, r) + "</FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>";
}
function d(e) {
	let t = e.indexOf("?");
	return t === -1 ? e : e.slice(0, t + 1) + e.slice(t + 1).replace(/#/g, "%23");
}
function f(e, t) {
	let n;
	try {
		n = new URL(d(e), typeof window < "u" ? window.location.href : "http://localhost/");
	} catch {
		return e;
	}
	for (let e of [...n.searchParams.keys()]) e.toLowerCase() === "sld_body" && n.searchParams.delete(e), e.toLowerCase() === "styles" && n.searchParams.set(e, "");
	return t && n.searchParams.set("SLD_BODY", t), n.href.replace(/%7B/g, "{").replace(/%7D/g, "}");
}
function p(e, t, n, r = {}) {
	return {
		kind: "graduated",
		attribute: e,
		breaks: t.map((e, r) => ({
			upTo: r === t.length - 1 ? null : e.max,
			color: n[r] ?? n[n.length - 1] ?? "#cccccc",
			label: r === t.length - 1 ? `${e.min} and above` : `${e.min} – ${e.max}`
		})),
		...r
	};
}
function m(e, t, n, r = {}) {
	return {
		kind: "categories",
		attribute: e,
		categories: t.map((e, t) => ({
			value: typeof e == "boolean" ? String(e) : e,
			color: n[t] ?? n[n.length - 1] ?? "#cccccc"
		})),
		...r
	};
}
function h(e, t, n = {}) {
	let r;
	try {
		r = new URL(e, typeof window < "u" ? window.location.href : "http://localhost/");
	} catch {
		return "";
	}
	for (let e of [...r.searchParams.keys()]) /^(service|version|request|layer|layers|format|style|styles|sld|sld_body|width|height|bbox|crs|srs|transparent)$/i.test(e) && r.searchParams.delete(e);
	let i = n.version && /^1\.[0-3]\.\d$/.test(n.version) ? n.version : "1.1.1";
	return r.searchParams.set("SERVICE", "WMS"), r.searchParams.set("VERSION", i), r.searchParams.set("REQUEST", "GetLegendGraphic"), r.searchParams.set("LAYER", t), r.searchParams.set("FORMAT", "image/png"), n.sld ? r.searchParams.set("SLD_BODY", n.sld) : n.style && r.searchParams.set("STYLE", n.style), r.href;
}
//#endregion
//#region src/utils/wms-sld-probe.ts
var g = 256, _ = 200, v = 48, y = .002, b = 4e3, x = /* @__PURE__ */ new Map();
function S(e) {
	return `${e.endpoint}|${e.layers}`;
}
function C(e, t, n = {}, r = [g, g]) {
	let i = new URL(e.endpoint), a = e.version && /^1\.[0-3]\.\d$/.test(e.version) ? e.version : "1.3.0", o = {
		SERVICE: "WMS",
		VERSION: a,
		REQUEST: "GetMap",
		LAYERS: e.layers,
		STYLES: "",
		FORMAT: "image/png",
		TRANSPARENT: "true",
		WIDTH: String(Math.round(r[0])),
		HEIGHT: String(Math.round(r[1])),
		[a === "1.3.0" ? "CRS" : "SRS"]: "EPSG:3857",
		BBOX: t.join(","),
		...n
	};
	for (let [e, t] of Object.entries(o)) i.searchParams.set(e, t);
	return i.href;
}
function w(e, t, n, r = _) {
	let i = null, a = t / 2, o = n / 2;
	for (let s = 0; s < n; s++) for (let n = 0; n < t; n++) {
		if (e[(s * t + n) * 4 + 3] < r) continue;
		let c = (n - a) ** 2 + (s - o) ** 2;
		(!i || c < i.d) && (i = {
			i: n,
			j: s,
			d: c
		});
	}
	return i ? {
		i: i.i,
		j: i.j
	} : null;
}
async function T(e) {
	if (typeof createImageBitmap != "function") return null;
	let t;
	try {
		t = await createImageBitmap(e);
	} catch {
		return null;
	}
	let n = (typeof OffscreenCanvas == "function" ? new OffscreenCanvas(t.width, t.height) : Object.assign(document.createElement("canvas"), {
		width: t.width,
		height: t.height
	})).getContext("2d");
	if (!n) return null;
	n.drawImage(t, 0, 0);
	let r = n.getImageData(0, 0, t.width, t.height);
	return t.close?.(), {
		data: r.data,
		width: r.width,
		height: r.height
	};
}
async function E(e) {
	if (!e.ok) return null;
	let t = e.headers.get("content-type") ?? "";
	if (/xml|text|html/.test(t)) return null;
	let n = await e.arrayBuffer();
	return {
		blob: new Blob([n], { type: t }),
		bytes: new Uint8Array(n)
	};
}
function D(e) {
	let t = 0;
	for (let n = 3; n < e.length; n += 4) e[n] >= v && t++;
	return t;
}
function O(e, t) {
	if (e.length !== t.length) return !1;
	for (let n = 0; n < e.length; n++) if (e[n] !== t[n]) return !1;
	return !0;
}
async function k(e, t, n = fetch) {
	for (let r of t) try {
		let t = r.size ?? [g, g], i = await E(await n(C(e, r.bbox, {}, t)));
		if (!i) continue;
		let a = await T(i.blob), o = a ? w(a.data, a.width, a.height) ?? w(a.data, a.width, a.height, v) : {
			i: Math.round(t[0] / 2),
			j: Math.round(t[1] / 2)
		};
		if (!o) continue;
		let s = e.layers.split(",")[0].trim(), c = async (i) => {
			let a = u(s, i, {
				kind: "single",
				color: "#ff00ff",
				strokeColor: "#ff00ff",
				strokeWidth: 4,
				size: 12
			});
			return E(await n(f(C(e, r.bbox, {}, t), a)));
		}, l = await c("unknown");
		if (!l) return {
			supported: !1,
			reason: "error"
		};
		if (O(i.bytes, l.bytes)) return {
			supported: !1,
			reason: "ignored"
		};
		let d = "unknown";
		for (let e of [
			"polygon",
			"line",
			"point"
		]) {
			let t = await c(e);
			if (!t) continue;
			let n = await T(t.blob);
			if (n ? D(n.data) > n.width * n.height * y : t.bytes.length > b) {
				d = e;
				break;
			}
		}
		return {
			supported: !0,
			geometry: d,
			hit: {
				...o,
				bbox: r.bbox,
				size: t
			}
		};
	} catch {
		return {
			supported: !1,
			reason: "error"
		};
	}
	return {
		supported: !1,
		reason: "no-ink"
	};
}
function A(e, t, n = fetch, r = {}) {
	let i = S(e);
	r.force && x.delete(i);
	let a = r.force ? void 0 : x.get(i);
	if (a) return a;
	let o = k(e, t, n).then((e) => (!e.supported && e.reason !== "ignored" && x.delete(i), e));
	return x.set(i, o), o;
}
async function j(t, n = fetch) {
	let r;
	try {
		r = await n(t);
	} catch (e) {
		return {
			ok: !1,
			problem: t.length > 7e3 ? "too-long" : "unreachable",
			detail: String(e?.message ?? e)
		};
	}
	if (e.includes(r.status)) return {
		ok: !1,
		problem: "too-long",
		status: r.status
	};
	let i = r.headers.get("content-type") ?? "";
	if (!r.ok) return {
		ok: !1,
		problem: "rejected",
		status: r.status
	};
	if (/xml|text|html/.test(i)) {
		let e = await r.text();
		return {
			ok: !1,
			problem: "rejected",
			detail: (/<ServiceException(?:\s[^>]*)?>([\s\S]*?)<\/ServiceException>/i.exec(e)?.[1]?.trim())?.replace(/\s+/g, " ").slice(0, 200)
		};
	}
	return { ok: !0 };
}
//#endregion
export { j as a, p as c, A as i, h as l, C as n, u as o, k as r, m as s, w as t, f as u };
