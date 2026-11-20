import { t as e } from "./src-C2ElxtZY.js";
import { l as t, u as n } from "./map-clock-BmIiPfc8.js";
//#region src/map/wfs-requests.ts
var r = 1e3, i = 5e3, a = [
	"count",
	"maxfeatures",
	"startindex",
	"resulttype",
	"bbox"
];
function o(e, t) {
	for (let [n, r] of e.searchParams) if (n.toLowerCase() === t) return r;
}
function s(e, t) {
	for (let n of [...e.searchParams.keys()]) t.includes(n.toLowerCase()) && e.searchParams.delete(n);
}
function c(e) {
	let t;
	try {
		t = new URL(e);
	} catch {
		return null;
	}
	if (o(t, "request")?.toLowerCase() !== "getfeature") return null;
	let n = o(t, "service");
	if (n && n.toUpperCase() !== "WFS") return null;
	let r = o(t, "typenames") ?? o(t, "typename");
	return r ? {
		version: o(t, "version") ?? "2.0.0",
		typeName: r
	} : null;
}
function l(e, t) {
	let [n, r, i, a] = t;
	return e.startsWith("1.0") ? `${n},${r},${i},${a},EPSG:4326` : `${r},${n},${a},${i},urn:ogc:def:crs:EPSG::4326`;
}
function u(e, t) {
	let n = new URL(e);
	s(n, a);
	let r = t.version.startsWith("2");
	return n.searchParams.set(r ? "COUNT" : "MAXFEATURES", String(t.pageSize)), t.startIndex && n.searchParams.set("STARTINDEX", String(t.startIndex)), t.box && n.searchParams.set("BBOX", l(t.version, t.box)), n.toString();
}
function d(e, t) {
	let n = new URL(e);
	return s(n, [...a, "outputformat"]), n.searchParams.set("RESULTTYPE", "hits"), t.box && n.searchParams.set("BBOX", l(t.version, t.box)), n.toString();
}
function f(e) {
	let t = /\bnumber(?:Matched|OfFeatures)\s*=\s*"(\d+)"/.exec(e);
	return t ? Number(t[1]) : void 0;
}
async function p(e, t = i, n) {
	let r = new AbortController(), a = setTimeout(() => r.abort(), t), o = () => r.abort();
	n?.addEventListener("abort", o);
	try {
		let t = await fetch(e, { signal: r.signal });
		return t.ok ? f(await t.text()) : void 0;
	} catch {
		return;
	} finally {
		clearTimeout(a), n?.removeEventListener("abort", o);
	}
}
function m(e, t, n) {
	let r = n * (360 / (512 * 2 ** t)), i = r * Math.cos(e[1] * Math.PI / 180);
	return [
		e[0] - r,
		e[1] - i,
		e[0] + r,
		e[1] + i
	];
}
function h(e, t, n, r) {
	let i = 6378137, a = 2 * Math.PI * i / (512 * 2 ** t), o = e[0] * Math.PI / 180 * i, s = Math.log(Math.tan(Math.PI / 4 + e[1] * Math.PI / 360)) * i, c = (e) => Math.max(-180, Math.min(180, e / i * 180 / Math.PI)), l = (e) => Math.max(-85.0511, Math.min(85.0511, (2 * Math.atan(Math.exp(e / i)) - Math.PI / 2) * 180 / Math.PI));
	return [
		c(o - n / 2 * a),
		l(s - r / 2 * a),
		c(o + n / 2 * a),
		l(s + r / 2 * a)
	];
}
function g(e, t) {
	return e[0] <= t[0] && e[1] <= t[1] && e[2] >= t[2] && e[3] >= t[3];
}
function _(e, t) {
	let n = (e[2] - e[0]) * t, r = (e[3] - e[1]) * t;
	return [
		Math.max(-180, e[0] - n),
		Math.max(-90, e[1] - r),
		Math.min(180, e[2] + n),
		Math.min(90, e[3] + r)
	];
}
//#endregion
//#region src/map/geojson-loader.ts
async function v(r, i = /* @__PURE__ */ new Date(), a = (e) => e) {
	let o = [], s = Object.values(r).filter((e) => e && e.type === "geojson" && typeof e.data == "string");
	return await Promise.all(s.map(async (r) => {
		if (t(r.data)) {
			let e = r.data;
			r.data = n(a(e), i), r.internalFuncUrl = e;
			return;
		}
		if (r.data.startsWith("geoparquet://")) {
			let { geoParquetUrlToGeoJSON: e } = await import("./geoparquet-DIClBVpb.js");
			r.data = await e(r.data.slice(13));
			return;
		}
		if (r.service === "wfs" || r.service === void 0 && c(r.data)) {
			let e = await w(r);
			e && o.push(e);
			return;
		}
		if (r.service === "esri-feature") {
			let e = await T(r);
			e && o.push(e);
			return;
		}
		let s = r.data, l = s.indexOf("#"), u = l >= 0 ? s.slice(0, l) : s, d = l >= 0 ? s.slice(l + 1) : null, f = await fetch(u);
		if (!f.ok) throw Error(`geojson-loader: failed to fetch ${u}: ${f.status}`);
		let p = await f.json();
		if (p?.type === "Topology") {
			let t = p.objects, n = d ?? Object.keys(t)[0];
			if (!n || !t[n]) throw Error(`geojson-loader: object "${n}" not found in ${u}`);
			r.data = e(p, t[n]);
		} else r.data = p;
	})), o;
}
var y = 6e6, b = 1e4;
function x(e) {
	return e.id === void 0 ? JSON.stringify(e) : `id:${e.id}`;
}
function S(e) {
	return (e.features ?? []).reduce((e, t) => e + C(t.geometry), 0);
}
function C(e) {
	if (!e) return 0;
	switch (e.type) {
		case "GeometryCollection": return e.geometries.reduce((e, t) => e + C(t), 0);
		case "Point": return 1;
		case "MultiPoint":
		case "LineString": return e.coordinates.length;
		case "MultiLineString":
		case "Polygon": return e.coordinates.reduce((e, t) => e + t.length, 0);
		case "MultiPolygon": return e.coordinates.reduce((e, t) => e + t.reduce((e, t) => e + t.length, 0), 0);
		default: return 0;
	}
}
async function w(e) {
	let t = e.data, n = String(e.wfsVersion ?? c(t)?.version ?? "2.0.0"), a = Number(e.wfsPageSize) > 0 ? Number(e.wfsPageSize) : r, o = e.wfsSupportsPaging ?? n.startsWith("2"), s = async (e, r, i) => {
		let o = u(t, {
			version: n,
			pageSize: a,
			startIndex: e,
			box: r
		}), s = await fetch(o, { signal: i });
		if (!s.ok) throw Error(`geojson-loader: failed to fetch ${o}: ${s.status}`);
		return await s.json();
	}, l = (e, t) => ({
		type: "FeatureCollection",
		features: e,
		...t ? { crs: t } : {}
	}), f = Number.isFinite(e.featureCount) ? Number(e.featureCount) : await p(d(t, { version: n }));
	if (f !== void 0 && (e.featureCount = f), f === void 0 || Math.ceil(f / a) > 5) return e.data = l([]), e.wfsPerView = !0, {
		id: e.id,
		run: (e, t) => S(e, t)
	};
	let m = await s(0), h = [...m.features ?? []], v = m.crs, b = 0;
	for (let e of h) b += C(e.geometry);
	if (e.data = l(h, v), !o || h.length === 0 || f <= a || b >= y) return null;
	return {
		id: e.id,
		run: (t) => {
			(async () => {
				let n = new Set(h.map(x));
				for (let r = a; r < f; r += a) {
					let i = await s(r), a = (i.features ?? []).filter((e) => {
						let t = x(e);
						return n.has(t) ? !1 : (n.add(t), !0);
					});
					if (!i.features?.length) break;
					h.push(...a);
					for (let e of a) b += C(e.geometry);
					if (e.data = l(h, v), !t(e.data) || b >= y) break;
				}
			})();
		}
	};
	function S(r, c) {
		if (!c) return;
		let u = null, f = 0, m = null, h = !1, v = null, y = async (v) => {
			if (u && g(u, v)) return;
			let y = _(v, .25), S = ++f;
			m?.abort(), m = new AbortController();
			let C = m.signal, w = new AbortController();
			C.addEventListener("abort", () => w.abort());
			let T = p(d(t, {
				version: n,
				box: y
			}), i, w.signal), E = await s(0, y, C);
			if (S !== f) {
				w.abort();
				return;
			}
			let D = [...E.features ?? []], O;
			if (D.length < a / 2 ? (w.abort(), O = D.length) : O = await T, S !== f) return;
			let k = O !== void 0 && (D.length >= O || O <= a);
			if (!k && O !== void 0 && o && Math.ceil(O / a) <= 5) {
				let e = new Set(D.map(x));
				for (let t = a; t < O; t += a) {
					let n = await s(t, y, C);
					if (S !== f) return;
					if (!n.features?.length) break;
					for (let t of n.features) {
						let n = x(t);
						e.has(n) || (e.add(n), D.push(t));
					}
				}
				k = !0;
			}
			if (e.data = l(D, E.crs), !r(e.data)) {
				b();
				return;
			}
			u = k ? y : null, k ? h = !1 : h || (h = !0, c.notify(O === void 0 ? `Showing the first ${D.length.toLocaleString()} features here. Zoom in to see them all.` : `${D.length.toLocaleString()} of ${O.toLocaleString()} features shown. Zoom in to see them all.`));
		}, b = () => {
			v?.(), v = null, m?.abort();
		}, S = (e) => {
			y(e).catch(() => {});
		};
		v = c.onViewEnd(S), S(c.currentBox());
	}
}
async function T(e) {
	let t = e.data, n = async (e) => {
		let n = new URL(t);
		n.searchParams.set("resultRecordCount", String(b)), n.searchParams.set("resultOffset", String(e));
		let r = await fetch(n.toString());
		if (!r.ok) throw Error(`geojson-loader: failed to fetch ${n}: ${r.status}`);
		return await r.json();
	}, r = await n(0), i = [...r.features ?? []], a = 0;
	for (let e of i) a += C(e.geometry);
	return e.data = {
		type: "FeatureCollection",
		features: i
	}, !r.exceededTransferLimit || i.length === 0 || a >= y ? null : {
		id: e.id,
		run: (t) => {
			(async () => {
				let r = i.length;
				for (;;) {
					let o = await n(r), s = o.features ?? [];
					i.push(...s);
					for (let e of s) a += C(e.geometry);
					let c = {
						type: "FeatureCollection",
						features: i
					};
					if (e.data = c, !t(c) || !o.exceededTransferLimit || s.length === 0 || a >= y) break;
					r += s.length;
				}
			})();
		}
	};
}
//#endregion
export { c as a, h as i, v as n, u as o, m as r, S as t };
