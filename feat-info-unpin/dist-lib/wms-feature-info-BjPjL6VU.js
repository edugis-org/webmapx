//#region src/utils/layer-queryable.ts
function e(e) {
	if (!e || typeof e != "object") return !0;
	let t = e;
	return "queryable" in t ? !!t.queryable : !0;
}
function t(t) {
	if (!t) return null;
	let n = Object.entries(t), r = n.filter(([, t]) => e(t)).map(([e]) => e);
	return r.length === n.length ? null : r;
}
//#endregion
//#region src/map/wms-feature-info.ts
var n = 6378137;
function r(e) {
	return e * Math.PI / 180 * n;
}
function i(e) {
	let t = Math.max(-85.05112878, Math.min(85.05112878, e));
	return Math.log(Math.tan(Math.PI / 4 + t * Math.PI / 360)) * n;
}
function a(e) {
	let t = e.sourceConfig, n = t.version ?? "1.3.0", a = Array.isArray(t.url) ? t.url[0] : t.url, o = t.layers ?? "", { bounds: s, containerWidth: c, containerHeight: l, pixelX: u, pixelY: d } = e, f = new URL(a), p = [
		"service",
		"request",
		"version",
		"layers",
		"query_layers",
		"width",
		"height",
		"feature_count",
		"info_format",
		"crs",
		"srs",
		"bbox",
		"i",
		"j",
		"x",
		"y",
		"styles"
	];
	for (let e of [...f.searchParams.keys()]) p.includes(e.toLowerCase()) && f.searchParams.delete(e);
	f.searchParams.set("SERVICE", "WMS"), f.searchParams.set("REQUEST", "GetFeatureInfo"), f.searchParams.set("VERSION", n), f.searchParams.set("LAYERS", o), f.searchParams.set("QUERY_LAYERS", o), f.searchParams.set("WIDTH", String(Math.round(c))), f.searchParams.set("HEIGHT", String(Math.round(l))), f.searchParams.set("FEATURE_COUNT", String(e.featureCount ?? 1));
	let m = t.format === "image/png" || !t.format ? "application/json" : t.format;
	f.searchParams.set("INFO_FORMAT", m);
	let { west: h, south: g, east: _, north: v } = s, y = t.crs ?? "EPSG:4326", b = y === "EPSG:3857" || y === "EPSG:900913" ? [
		r(h),
		i(g),
		r(_),
		i(v)
	] : [
		h,
		g,
		_,
		v
	];
	if (n.startsWith("1.3")) {
		f.searchParams.set("CRS", y);
		let e = y === "EPSG:4326";
		f.searchParams.set("BBOX", e ? `${b[1]},${b[0]},${b[3]},${b[2]}` : `${b[0]},${b[1]},${b[2]},${b[3]}`), f.searchParams.set("I", String(Math.round(u))), f.searchParams.set("J", String(Math.round(d)));
	} else f.searchParams.set("SRS", y), f.searchParams.set("BBOX", `${b[0]},${b[1]},${b[2]},${b[3]}`), f.searchParams.set("X", String(Math.round(u))), f.searchParams.set("Y", String(Math.round(d)));
	return t.styles && f.searchParams.set("STYLES", t.styles), f.toString();
}
function o(e, t, n) {
	return typeof e != "object" || !e || e.type !== "FeatureCollection" ? [] : (e.features ?? []).map((e) => ({
		layerId: t,
		layerTitle: n,
		properties: e.properties ?? {},
		geometry: e.geometry ?? void 0,
		source: "wms"
	}));
}
function s(e, t, n) {
	let r;
	try {
		r = new DOMParser().parseFromString(e, "text/xml");
	} catch {
		return [{
			layerId: t,
			layerTitle: n,
			properties: { _raw: e },
			source: "wms"
		}];
	}
	let i = [], a = c(r.documentElement);
	for (let e of a) {
		let r = {};
		for (let t = 0; t < e.attributes.length; t++) {
			let n = e.attributes[t];
			if (n.name.startsWith("xmlns")) continue;
			let i = n.value.trim();
			if (!i) continue;
			let a = n.name.replace(/^[^:]+:/, "");
			r[a] = isNaN(Number(i)) || i === "" ? i : Number(i);
		}
		for (let t = 0; t < e.children.length; t++) {
			let n = e.children[t];
			if (n.children.length > 0 || n.namespaceURI === "http://www.opengis.net/gml") continue;
			let i = n.localName ?? n.nodeName.replace(/^[^:]+:/, ""), a = n.textContent?.trim() ?? "";
			i && a && (r[i] = isNaN(Number(a)) || a === "" ? a : Number(a));
		}
		Object.keys(r).length > 0 && i.push({
			layerId: t,
			layerTitle: n,
			properties: r,
			source: "wms"
		});
	}
	if (i.length === 0 && e.trim()) {
		let r = {}, a = /<([A-Za-z_][A-Za-z0-9_:]*)(?:\s[^>]*)?>([^<]+)<\/\1>/g, o;
		for (; (o = a.exec(e)) !== null;) {
			let e = o[1].replace(/^[^:]+:/, ""), t = o[2].trim();
			t && (r[e] = isNaN(Number(t)) || t === "" ? t : Number(t));
		}
		Object.keys(r).length > 0 && i.push({
			layerId: t,
			layerTitle: n,
			properties: r,
			source: "wms"
		});
	}
	return i;
}
function c(e) {
	let t = e.getElementsByTagNameNS("http://www.opengis.net/gml", "featureMember");
	if (t.length > 0) {
		let e = [];
		for (let n = 0; n < t.length; n++) {
			let r = t[n].children[0];
			r && e.push(r);
		}
		return e;
	}
	let n = e.getElementsByTagNameNS("http://www.opengis.net/gml", "boundedBy");
	if (n.length > 0) {
		let e = [];
		for (let t = 0; t < n.length; t++) {
			let r = n[t].parentElement;
			r && e.push(r);
		}
		return e;
	}
	let r = e.querySelectorAll("FIELDS, Layer");
	return r.length > 0 ? Array.from(r) : e.children.length > 0 && e.children[0].children.length > 0 ? [e.children[0]] : [e];
}
async function l(e) {
	let t;
	try {
		t = a(e);
	} catch {
		return [];
	}
	try {
		let n = await fetch(t);
		if (!n.ok) return [];
		let r = n.headers.get("content-type") ?? "";
		if (r.includes("application/json") || r.includes("text/json")) return o(await n.json(), e.layerId, e.layerTitle);
		let i = await n.text();
		return !i.trim() || i.includes("no features") || i.includes("ServiceException") ? [] : s(i, e.layerId, e.layerTitle);
	} catch {
		return [];
	}
}
//#endregion
export { e as n, t as r, l as t };
