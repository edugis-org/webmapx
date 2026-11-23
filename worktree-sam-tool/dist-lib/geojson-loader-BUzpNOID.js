import { t as e } from "./src-C2ElxtZY.js";
import { l as t, u as n } from "./map-clock-BmIiPfc8.js";
//#region src/map/geojson-loader.ts
async function r(r, i = /* @__PURE__ */ new Date(), a = (e) => e) {
	let o = [], s = Object.values(r).filter((e) => e && e.type === "geojson" && typeof e.data == "string");
	return await Promise.all(s.map(async (r) => {
		if (t(r.data)) {
			let e = r.data;
			r.data = n(a(e), i), r.internalFuncUrl = e;
			return;
		}
		if (r.service === "wfs") {
			let e = await c(r);
			e && o.push(e);
			return;
		}
		if (r.service === "esri-feature") {
			let e = await l(r);
			e && o.push(e);
			return;
		}
		let s = r.data, u = s.indexOf("#"), d = u >= 0 ? s.slice(0, u) : s, f = u >= 0 ? s.slice(u + 1) : null, p = await fetch(d);
		if (!p.ok) throw Error(`geojson-loader: failed to fetch ${d}: ${p.status}`);
		let m = await p.json();
		if (m?.type === "Topology") {
			let t = m.objects, n = f ?? Object.keys(t)[0];
			if (!n || !t[n]) throw Error(`geojson-loader: object "${n}" not found in ${d}`);
			r.data = e(m, t[n]);
		} else r.data = m;
	})), o;
}
var i = 6e6, a = 1e4;
function o(e) {
	return (e.features ?? []).reduce((e, t) => e + s(t.geometry), 0);
}
function s(e) {
	if (!e) return 0;
	switch (e.type) {
		case "GeometryCollection": return e.geometries.reduce((e, t) => e + s(t), 0);
		case "Point": return 1;
		case "MultiPoint":
		case "LineString": return e.coordinates.length;
		case "MultiLineString":
		case "Polygon": return e.coordinates.reduce((e, t) => e + t.length, 0);
		case "MultiPolygon": return e.coordinates.reduce((e, t) => e + t.reduce((e, t) => e + t.length, 0), 0);
		default: return 0;
	}
}
async function c(e) {
	let t = !!e.wfsSupportsPaging, n = e.wfsVersion === "2.0.0" ? "COUNT" : "MAXFEATURES", r = e.data, o = (e) => {
		let i = new URL(r);
		for (let e of [...i.searchParams.keys()]) [
			"maxfeatures",
			"count",
			"startindex"
		].includes(e.toLowerCase()) && i.searchParams.delete(e);
		return i.searchParams.set(n, String(a)), t && e > 0 && i.searchParams.set("STARTINDEX", String(e)), i;
	}, c = async (e) => {
		let t = o(e), n = await fetch(t.toString());
		if (!n.ok) throw Error(`geojson-loader: failed to fetch ${t}: ${n.status}`);
		return await n.json();
	}, l = await c(0), u = [...l.features ?? []], d = l.crs, f = l.numberMatched, p = 0;
	for (let e of u) p += s(e.geometry);
	f !== void 0 && (e.featureCount = f), e.data = {
		type: "FeatureCollection",
		features: u,
		...d ? { crs: d } : {}
	};
	let m = f !== void 0 && u.length >= f;
	return !t || (l.features?.length ?? 0) === 0 || m || p >= i ? null : {
		id: e.id,
		run: (t) => {
			(async () => {
				let n = u.length;
				for (;;) {
					let r = await c(n), a = r.features ?? [];
					u.push(...a);
					for (let e of a) p += s(e.geometry);
					f ??= r.numberMatched, f !== void 0 && (e.featureCount = f);
					let o = {
						type: "FeatureCollection",
						features: u,
						...d ? { crs: d } : {}
					};
					if (e.data = o, !t(o) || a.length === 0 || f !== void 0 && u.length >= f || p >= i) break;
					n += a.length;
				}
			})();
		}
	};
}
async function l(e) {
	let t = e.data, n = async (e) => {
		let n = new URL(t);
		n.searchParams.set("resultRecordCount", String(a)), n.searchParams.set("resultOffset", String(e));
		let r = await fetch(n.toString());
		if (!r.ok) throw Error(`geojson-loader: failed to fetch ${n}: ${r.status}`);
		return await r.json();
	}, r = await n(0), o = [...r.features ?? []], c = 0;
	for (let e of o) c += s(e.geometry);
	return e.data = {
		type: "FeatureCollection",
		features: o
	}, !r.exceededTransferLimit || o.length === 0 || c >= i ? null : {
		id: e.id,
		run: (t) => {
			(async () => {
				let r = o.length;
				for (;;) {
					let a = await n(r), l = a.features ?? [];
					o.push(...l);
					for (let e of l) c += s(e.geometry);
					let u = {
						type: "FeatureCollection",
						features: o
					};
					if (e.data = u, !t(u) || !a.exceededTransferLimit || l.length === 0 || c >= i) break;
					r += l.length;
				}
			})();
		}
	};
}
//#endregion
export { r as n, o as t };
