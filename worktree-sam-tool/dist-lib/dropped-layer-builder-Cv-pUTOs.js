import { a as e } from "./chunk-HEgqtunE.js";
import { I as t, ft as n, pt as r } from "./zip-reader-Bai44Y8Q.js";
import { n as i, t as a } from "./default-paint-EDDI8yhT.js";
import "./zip.js-CnrAYY-x.js";
import { r as o, t as s } from "./file-sniff-CyTSFhus.js";
//#region src/utils/qml-style.ts
function c(e) {
	if (e.startsWith("#")) return e;
	let t = e.split(",").slice(0, 4).map(Number);
	if (t.length >= 3 && t.every((e) => !Number.isNaN(e))) {
		let [e, n, r, i = 255] = t;
		return i < 255 ? `rgba(${e},${n},${r},${(i / 255).toFixed(2)})` : `rgb(${e},${n},${r})`;
	}
	return e;
}
function l(e, t) {
	for (let n of Array.from(e.querySelectorAll(":scope > prop"))) if (n.getAttribute("k") === t) return n.getAttribute("v") ?? void 0;
	for (let n of Array.from(e.querySelectorAll(":scope > Option > Option"))) if (n.getAttribute("name") === t) return n.getAttribute("value") ?? void 0;
}
function u(e) {
	let t = e.getAttribute("type"), n = e.querySelector(":scope > layer");
	if (!n) return null;
	if (t === "fill") {
		let e = l(n, "color"), t = l(n, "outline_color") ?? l(n, "line_color");
		return {
			type: "fill",
			color: e ? c(e) : void 0,
			outlineColor: t ? c(t) : void 0
		};
	}
	if (t === "line") {
		let e = l(n, "line_color") ?? l(n, "color"), t = l(n, "line_width") ?? l(n, "width");
		return {
			type: "line",
			color: e ? c(e) : void 0,
			width: t ? Math.max(1, parseFloat(t) * 2) : void 0
		};
	}
	if (t === "marker") {
		let e = l(n, "color"), t = l(n, "size");
		return {
			type: "circle",
			color: e ? c(e) : void 0,
			radius: t ? Math.max(1, parseFloat(t) * 2) : void 0
		};
	}
	return null;
}
function d(e, t, n) {
	if (e.type === "fill") {
		let r = {};
		t !== void 0 && (r["fill-color"] = t);
		let i = n ?? e.outlineColor;
		return i !== void 0 && (r["fill-outline-color"] = i), r;
	}
	if (e.type === "line") {
		let n = { "line-width": e.width ?? 2 };
		return t !== void 0 && (n["line-color"] = t), n;
	}
	let r = { "circle-radius": e.radius ?? 8 };
	return t !== void 0 && (r["circle-color"] = t), r;
}
function f(e) {
	let t = e.replace(/<!DOCTYPE[^>]*>/i, ""), n = new DOMParser().parseFromString(t, "application/xml");
	if (n.querySelector("parsererror")) return null;
	let r = n.querySelector("renderer-v2");
	if (!r) return null;
	let i = r.getAttribute("type"), a = n.querySelector("qgis > layerOpacity")?.textContent, o = a ? parseFloat(a) : void 0;
	if (i === "categorizedSymbol") {
		let e = r.getAttribute("attr"), t = Array.from(r.querySelectorAll(":scope > categories > category")), n = /* @__PURE__ */ new Map();
		for (let e of Array.from(r.querySelectorAll(":scope > symbols > symbol"))) {
			let t = e.getAttribute("name");
			t && n.set(t, e);
		}
		let i = null, a = ["match", ["to-string", ["get", e ?? ""]]], s = ["match", ["to-string", ["get", e ?? ""]]], c, l, f = !1;
		for (let e of t) {
			let t = e.getAttribute("symbol"), r = e.getAttribute("value") ?? "", o = t ? n.get(t) : void 0;
			if (!o) continue;
			let d = u(o);
			if (!d) continue;
			i ||= d;
			let p = d.color;
			if (p) {
				if (d.outlineColor && (f = !0), r === "" && e.getAttribute("render") !== "false") {
					c = p, l = d.outlineColor;
					continue;
				}
				a.push(r, p), s.push(r, d.outlineColor ?? p);
			}
		}
		if (!i || !e || a.length <= 2) return null;
		a.push(c ?? i.color ?? "#444444"), s.push(l ?? c ?? i.outlineColor ?? i.color ?? "#444444");
		let p = d(i, a, f ? s : void 0);
		return i.type === "fill" && o !== void 0 && (p["fill-opacity"] = o), {
			type: i.type,
			paint: p
		};
	}
	let s = n.querySelector("renderer-v2 > symbols > symbol");
	if (!s) return null;
	let c = u(s);
	if (!c) return null;
	let l = d(c, c.color);
	return c.type === "fill" && o !== void 0 && (l["fill-opacity"] = o), {
		type: c.type,
		paint: l
	};
}
//#endregion
//#region src/utils/dropped-layer-builder.ts
function p(e) {
	return e.split("/").pop() || e;
}
function m(e) {
	let t = e.lastIndexOf(".");
	return t > 0 ? e.slice(0, t) : e;
}
function h(e) {
	return m(e).replace(/[^a-zA-Z0-9_-]/g, "-");
}
async function g(e) {
	let i = new t(new n(e)), a = await i.getEntries(), o = [];
	for (let e of a) e.directory || !e.getData || o.push({
		name: e.filename,
		blob: await e.getData(new r())
	});
	return await i.close(), o;
}
async function _(e) {
	let t = [], n = [];
	for (let r of e) await s(r) ? t.push(...y(await g(r))) : n.push({
		name: r.name,
		blob: r
	});
	return n.length > 0 && t.push(n), t;
}
var v = /\.(gml|fgb|gpkg)$/i;
function y(e) {
	let t = [], n = /* @__PURE__ */ new Set(), r = e.filter((e) => /_style\.json$/i.test(e.name));
	for (let i of r) {
		let r = i.name.replace(/_style\.json$/i, "").toLowerCase(), a = [i];
		n.add(i);
		for (let t of e) n.has(t) || m(t.name).toLowerCase() === r && (a.push(t), n.add(t));
		t.push(a);
	}
	let i = e.filter((e) => !n.has(e)), a = i.filter((e) => v.test(e.name)), o = i.filter((e) => !v.test(e.name));
	for (let e of a) t.push([e]), n.add(e);
	return o.length > 0 && t.push(o), t.length > 0 ? t : [e];
}
var b = a;
function x(e) {
	let t = /* @__PURE__ */ new Set(), n = (e) => {
		e && (t.add(e.type), e.type === "GeometryCollection" && e.geometries.forEach(n));
	};
	for (let t of e.features) n(t.geometry);
	return t;
}
function S(e, t, n, r, a) {
	let o = `${e}${t}`, s = x(r), c = s.has("Polygon") || s.has("MultiPolygon"), l = s.has("LineString") || s.has("MultiLineString"), u = s.has("Point") || s.has("MultiPoint"), d = [];
	c && d.push({
		id: `${o}-fill`,
		type: "fill",
		source: n,
		filter: [
			"match",
			["geometry-type"],
			["Polygon", "MultiPolygon"],
			!0,
			!1
		],
		paint: a?.type === "fill" ? a.paint : {
			"fill-color": b,
			"fill-opacity": i
		}
	});
	let f = c && a?.type === "fill" && "fill-outline-color" in a.paint;
	return (l || c && !f) && d.push({
		id: `${o}-line`,
		type: "line",
		source: n,
		filter: [
			"match",
			["geometry-type"],
			[
				"LineString",
				"MultiLineString",
				"Polygon",
				"MultiPolygon"
			],
			!0,
			!1
		],
		paint: a?.type === "line" ? a.paint : {
			"line-color": b,
			"line-width": 2
		}
	}), u && d.push({
		id: `${o}-circle`,
		type: "circle",
		source: n,
		filter: [
			"match",
			["geometry-type"],
			["Point", "MultiPoint"],
			!0,
			!1
		],
		paint: a?.type === "circle" ? a.paint : {
			"circle-color": b,
			"circle-radius": 8
		}
	}), d;
}
var C = [
	"lon",
	"lng",
	"longitude",
	"long",
	"x",
	"lengtegraad",
	"lengte",
	"längengrad",
	"laengengrad",
	"länge",
	"laenge",
	"longitud"
], w = [
	"lat",
	"latitude",
	"y",
	"breedtegraad",
	"breedte",
	"breitengrad",
	"breite",
	"latitud"
];
function T(e, t) {
	return e.find((e) => t.some((t) => t.toLowerCase() === e));
}
function E(e, t) {
	if (e.length === 0) return null;
	let n = Object.keys(e[0]), r = T(C, n), i = T(w, n);
	if (!r || !i) return console.warn(`[csv-import] "${t}": no coordinate columns found. Tried lon=${C.join("/")}, lat=${w.join("/")}`), null;
	let a = [];
	for (let t of e) {
		let e = Number(t[r]), n = Number(t[i]);
		if (!isFinite(e) || !isFinite(n)) continue;
		let o = {};
		for (let [e, n] of Object.entries(t)) e !== r && e !== i && (o[e] = n);
		a.push({
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [e, n]
			},
			properties: o
		});
	}
	return a.length === 0 ? null : {
		type: "FeatureCollection",
		features: a
	};
}
async function D(t, n) {
	let r = [], i = null, a = !1, s = !1, c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map(), d = null;
	for (let p of t) {
		let t = await o(p.blob), h = p.name.toLowerCase();
		if (h.endsWith(".dbf")) l.set(m(h), p);
		else if (h.endsWith(".prj")) u.set(m(h), p);
		else if (t.kind === "geojson") try {
			r.push({
				name: p.name,
				data: JSON.parse(await p.blob.text())
			});
		} catch {}
		else if (t.kind === "topojson") try {
			let e = JSON.parse(await p.blob.text()), { feature: t } = await import("./src-CqnzJbRr.js"), n = e.objects;
			for (let [i, a] of Object.entries(n)) {
				let o = t(e, a);
				r.push({
					name: Object.keys(n).length > 1 ? `${p.name}#${i}` : p.name,
					data: o
				});
			}
		} catch {}
		else if (t.kind === "maplibre-style" && !i) try {
			i = {
				name: p.name,
				style: JSON.parse(await p.blob.text())
			};
		} catch {}
		else if (t.kind === "gpx") try {
			let { gpx: e } = await import("./togeojson.es-DAgiTBvg.js"), t = new DOMParser().parseFromString(await p.blob.text(), "text/xml");
			r.push({
				name: p.name,
				data: e(t)
			});
		} catch {}
		else if (t.kind === "kml") try {
			let { kml: e } = await import("./togeojson.es-DAgiTBvg.js"), t = new DOMParser().parseFromString(await p.blob.text(), "text/xml");
			r.push({
				name: p.name,
				data: e(t)
			});
		} catch {}
		else if (t.kind === "kmz") try {
			let { kml: e } = await import("./togeojson.es-DAgiTBvg.js"), t = (await g(p.blob)).find((e) => e.name.toLowerCase().endsWith(".kml"));
			if (t) {
				let n = new DOMParser().parseFromString(await t.blob.text(), "text/xml");
				r.push({
					name: p.name,
					data: e(n)
				});
			}
		} catch {}
		else if (t.kind === "csv") try {
			let t = E((await import("./papaparse.min-B7v3c0D7.js").then((t) => /* @__PURE__ */ e(t.default, 1))).default.parse(await p.blob.text(), {
				header: !0,
				skipEmptyLines: !0,
				dynamicTyping: !0
			}).data, p.name);
			t && r.push({
				name: p.name,
				data: t
			});
		} catch {}
		else if (t.kind === "shp" && h.endsWith(".shp")) c.set(m(h), p);
		else if (t.kind === "gpkg") {
			a = !0;
			try {
				let { confirmLargeFile: e, showGdalProgress: t } = await import("./gdal-progress-dialog-DYIKO4p_.js");
				if (!await e(p.name, p.blob.size)) continue;
				let i = { fn: () => {} }, a = t(p.name, () => i.fn());
				try {
					let { runInspectFile: e, runConvertFileLayer: t, runCloseFile: o, terminateSpatialWorker: c } = await import("./spatial-worker-manager-Ce9nHtWO.js");
					i.fn = c, a.setStep("Loading into memory…");
					let l = await p.blob.arrayBuffer();
					if (a.cancelled) continue;
					a.setStep("Opening file…");
					let { sessionKey: u, layers: d } = await e(l, p.name);
					try {
						if (a.cancelled) continue;
						let e;
						if (d.length <= 1) e = d.map((e) => e.name);
						else {
							a.setStep("Waiting for layer selection…");
							let t = n ? await n(p.name, d) : d.map((e) => e.name);
							if (!t || t.length === 0 || a.cancelled) continue;
							e = t;
						}
						e.length > 1 && (s = !0);
						for (let n of e) {
							if (a.cancelled) break;
							a.setStep(`Converting "${n}"…`);
							let e = await t(u, n);
							a.cancelled || r.push({
								name: `${m(p.name)}_${n}`,
								title: n,
								data: e
							});
						}
					} finally {
						o(u);
					}
				} finally {
					a.cancelled || (a.setStep("Layer(s) import: done"), await new Promise((e) => setTimeout(e, 2e3))), a.close();
				}
			} catch (e) {
				console.error(`[dropped-layer-builder] failed to convert "${p.name}" via GDAL`, e);
			}
		} else if (t.kind === "fgb") {
			a = !0;
			try {
				let { confirmLargeFile: e, showGdalProgress: t } = await import("./gdal-progress-dialog-DYIKO4p_.js");
				if (!await e(p.name, p.blob.size)) continue;
				let n = { fn: () => {} }, i = t(p.name, () => n.fn());
				try {
					let { runConvertToGeoJSON: e, terminateSpatialWorker: t } = await import("./spatial-worker-manager-Ce9nHtWO.js");
					n.fn = t, i.setStep("Converting…");
					let a = await e(await p.blob.arrayBuffer(), p.name);
					i.cancelled || r.push({
						name: p.name,
						data: a
					});
				} finally {
					i.cancelled || (i.setStep("Layer(s) import: done"), await new Promise((e) => setTimeout(e, 2e3))), i.close();
				}
			} catch (e) {
				console.error(`[dropped-layer-builder] failed to convert "${p.name}" via GDAL`, e);
			}
		} else if (t.kind === "gml") {
			a = !0;
			try {
				let { confirmLargeFile: e, showGdalProgress: t } = await import("./gdal-progress-dialog-DYIKO4p_.js");
				if (!await e(p.name, p.blob.size)) continue;
				let i = { fn: () => {} }, a = t(p.name, () => i.fn());
				try {
					let { runInspectFile: e, runConvertFileLayer: t, runCloseFile: o, terminateSpatialWorker: s } = await import("./spatial-worker-manager-Ce9nHtWO.js");
					i.fn = s, a.setStep("Loading into memory…");
					let c = await p.blob.arrayBuffer();
					if (a.cancelled) continue;
					a.setStep("Opening file…");
					let { sessionKey: l, layers: u } = await e(c, p.name);
					try {
						if (a.cancelled) continue;
						let e;
						if (u.length <= 1) e = u.map((e) => e.name);
						else {
							a.setStep("Waiting for layer selection…");
							let t = n ? await n(p.name, u) : u.map((e) => e.name);
							if (!t || t.length === 0 || a.cancelled) continue;
							e = t;
						}
						for (let n of e) {
							if (a.cancelled) break;
							a.setStep(`Converting "${n}"…`);
							let e = await t(l, n);
							a.cancelled || r.push({
								name: `${m(p.name)}_${n}`,
								data: e
							});
						}
					} finally {
						o(l);
					}
				} finally {
					a.cancelled || (a.setStep("Layer(s) import: done"), await new Promise((e) => setTimeout(e, 2e3))), a.close();
				}
			} catch (e) {
				console.error(`[dropped-layer-builder] failed to convert "${p.name}" via GDAL`, e);
			}
		} else t.kind === "qml" && (d = f(await p.blob.text()));
	}
	if (c.size > 0) {
		let { shapefileToGeoJSONInWorker: e } = await import("./shapefile-DHfW7Z7c.js");
		for (let [t, n] of c) {
			let i = l.get(t), a = u.get(t);
			try {
				let t = await e(await n.blob.arrayBuffer(), i ? await i.blob.arrayBuffer() : null, a ? await a.blob.text() : null);
				r.push({
					name: p(n.name),
					data: t
				});
			} catch (e) {
				console.error(`[dropped-layer-builder] failed to parse shapefile "${n.name}"`, e);
			}
		}
	}
	if (r.length === 0 && !i) {
		if (a) {
			let { showToast: e } = await import("./toast-CrdWDpWE.js");
			return e(`Import failed: ${t.map((e) => e.name).join(", ")}`, {
				variant: "warning",
				duration: 8e3
			}), [];
		}
		return [];
	}
	let _ = (e) => {
		let t = h(typeof i?.style.id == "string" ? i.style.id : e.length > 0 ? e[0].name : "layer"), n = `${t}:`, r = /* @__PURE__ */ new Map();
		for (let t of e) {
			let e = h(t.name), i = {
				sourceKey: `${n}${e}`,
				data: t.data
			};
			r.set(t.name.toLowerCase(), i), r.set(m(t.name).toLowerCase(), i), r.set(e.toLowerCase(), i);
		}
		let a = {}, o;
		if (i) {
			let e = i.style.sources ?? {}, t = /* @__PURE__ */ new Map();
			for (let [i, o] of Object.entries(e)) {
				let e = typeof o.data == "string" ? r.get(o.data.toLowerCase()) : void 0;
				if (e) a[e.sourceKey] = {
					...o,
					data: e.data
				}, t.set(i, e.sourceKey);
				else {
					let e = `${n}${h(i)}`;
					a[e] = o, t.set(i, e);
				}
			}
			o = (i.style.layers ?? []).filter((e) => !e.source || t.has(e.source)).map((e) => ({
				...e,
				id: `${n}${h(e.id ?? e.type)}`,
				source: e.source ? t.get(e.source) ?? e.source : e.source
			}));
		} else {
			o = [];
			for (let t of e) {
				let e = h(t.name), r = `${n}${e}`;
				a[r] = {
					type: "geojson",
					data: t.data
				}, o.push(...S(n, e, r, t.data, d));
			}
		}
		let s = i?.style.metadata ?? {};
		return {
			id: t,
			type: "style",
			version: 8,
			title: typeof i?.style.title == "string" ? i.style.title : e[0]?.title ?? e[0]?.name ?? t,
			metadata: {
				...s,
				dynamic: !0
			},
			sources: a,
			layers: o
		};
	};
	return s ? r.map((e) => _([e])) : [_(r)];
}
//#endregion
export { D as buildLayerConfigsFromGroup, _ as groupDroppedFiles };
