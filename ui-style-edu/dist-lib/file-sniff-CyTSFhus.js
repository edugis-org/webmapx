import { I as e, ft as t, pt as n } from "./zip-reader-Bai44Y8Q.js";
import "./zip.js-CnrAYY-x.js";
//#region src/utils/file-sniff.ts
var r = 8192;
function i() {
	let e = navigator.deviceMemory;
	return typeof e == "number" && e > 0 ? Math.min(e * .1 * 1e9, 500 * 1024 * 1024) : 100 * 1024 * 1024;
}
function a(e, t, n) {
	if (e.length < t + n.length) return !1;
	for (let r = 0; r < n.length; r++) if (e[t + r] !== n[r]) return !1;
	return !0;
}
var o = [
	",",
	";",
	"	",
	"|"
];
function s(e) {
	for (let t = 0; t < e.length; t++) {
		let n = e.charCodeAt(t);
		if (n < 32 && n !== 9 && n !== 10 && n !== 13 || n === 65533) return !0;
	}
	return !1;
}
function c(e) {
	if (s(e)) return null;
	let t = e.split(/\r?\n/).filter((e) => e.length > 0).slice(0, 5);
	t.length > 1 && (t = t.slice(0, -1));
	let n = t[0] ?? "";
	if (!n) return null;
	let r = null, i = 0;
	for (let e of o) {
		let t = n.split(e).length - 1;
		t > i && (i = t, r = e);
	}
	if (!r || i < 1) return null;
	for (let e of t) if (e.split(r).length - 1 !== i) return null;
	return {
		kind: "csv",
		description: `CSV (${{
			",": "comma",
			";": "semicolon",
			"	": "tab",
			"|": "pipe"
		}[r]}-delimited, ${i + 1} columns)`
	};
}
function l(e) {
	let t;
	try {
		t = JSON.parse(e);
	} catch {
		return {
			kind: "json",
			description: "JSON (could not parse)"
		};
	}
	if (typeof t != "object" || !t) return {
		kind: "json",
		description: "JSON (unrecognized structure)"
	};
	let n = t, r = n.type;
	return r === "Topology" && n.objects && n.arcs ? {
		kind: "topojson",
		description: "TopoJSON"
	} : r === "FeatureCollection" || r === "Feature" || r === "Point" || r === "MultiPoint" || r === "LineString" || r === "MultiLineString" || r === "Polygon" || r === "MultiPolygon" || r === "GeometryCollection" ? {
		kind: "geojson",
		description: `GeoJSON (${r})`
	} : n.sources && n.layers ? {
		kind: "maplibre-style",
		description: "MapLibre style.json"
	} : n.version !== void 0 && n.project && n.map ? {
		kind: "webmapx-config",
		description: "webmapx config.json"
	} : {
		kind: "json",
		description: "JSON (unrecognized structure)"
	};
}
async function u(r) {
	let a;
	try {
		let n = new e(new t(r));
		a = await n.getEntries(), await n.close();
	} catch {
		return {
			kind: "zip",
			description: "ZIP archive (could not list contents)",
			rejected: !0
		};
	}
	let o = a.map((e) => e.filename.toLowerCase());
	if (o.some((e) => e.startsWith("xl/"))) return {
		kind: "xlsx",
		description: "Excel workbook (.xlsx)"
	};
	if (o.includes("doc.kml") || o.some((e) => e.endsWith(".kml"))) return {
		kind: "kmz",
		description: "KMZ (zipped KML)"
	};
	let s = i(), c = [];
	for (let e of a) {
		if (e.directory || !e.getData) continue;
		let t;
		try {
			t = await e.getData(new n());
		} catch {
			c.push({
				path: e.filename,
				size: 0,
				result: {
					kind: "unknown",
					description: "Could not read entry",
					rejected: !0
				}
			});
			continue;
		}
		if (t.size > s) {
			c.push({
				path: e.filename,
				size: t.size,
				result: {
					kind: "too-large",
					description: `File too large (${(t.size / 1e6).toFixed(1)} MB, limit ${(s / 1e6).toFixed(0)} MB)`,
					rejected: !0
				}
			});
			continue;
		}
		let r = await p(t);
		c.push({
			path: e.filename,
			size: t.size,
			result: r
		});
	}
	return {
		kind: "zip",
		description: `ZIP archive (${a.length} entries)`,
		children: c
	};
}
function d(e) {
	let t = e.slice(0, 2048);
	return /<gpx[\s>]/i.test(t) ? {
		kind: "gpx",
		description: "GPX track/route"
	} : /<kml[\s>]/i.test(t) ? {
		kind: "kml",
		description: "KML"
	} : /<qgis[\s>]/i.test(t) ? {
		kind: "qml",
		description: "QGIS layer style (.qml)"
	} : /<wfs:FeatureCollection/i.test(t) || /<gml:/i.test(t) || /xmlns(?::\w+)?=["']http:\/\/www\.opengis\.net\/gml/i.test(t) ? {
		kind: "gml",
		description: "GML"
	} : /^\s*<\?xml/i.test(t) || /^\s*</.test(t) ? {
		kind: "xml",
		description: "XML (unrecognized format)",
		rejected: !0
	} : null;
}
async function f(e) {
	let t = new Uint8Array(await e.slice(0, 4).arrayBuffer());
	return a(t, 0, [
		80,
		75,
		3,
		4
	]) || a(t, 0, [
		80,
		75,
		5,
		6
	]);
}
async function p(e) {
	let t = new Uint8Array(await e.slice(0, r).arrayBuffer());
	if (a(t, 0, [
		80,
		75,
		3,
		4
	]) || a(t, 0, [
		80,
		75,
		5,
		6
	])) return u(e);
	if (a(t, 0, [
		83,
		81,
		76,
		105,
		116,
		101
	])) return {
		kind: "gpkg",
		description: "GeoPackage"
	};
	if (a(t, 0, [
		73,
		73,
		42,
		0
	]) || a(t, 0, [
		77,
		77,
		0,
		42
	])) return {
		kind: "geotiff",
		description: "GeoTIFF - not yet supported",
		rejected: !0
	};
	if (a(t, 0, [
		208,
		207,
		17,
		224
	])) return {
		kind: "xls",
		description: "Excel workbook (.xls, legacy) - not yet supported",
		rejected: !0
	};
	if (a(t, 0, [
		0,
		0,
		39,
		10
	])) return {
		kind: "shp",
		description: "Shapefile geometry (.shp)"
	};
	if (a(t, 0, [
		102,
		103,
		98
	]) && a(t, 4, [
		102,
		103,
		98
	])) return {
		kind: "fgb",
		description: "FlatGeobuf"
	};
	let n = new TextDecoder("utf-8", { fatal: !1 }).decode(t).trim();
	return d(n) || (n.startsWith("{") || n.startsWith("[") ? l(e.size <= t.length ? n : await e.text()) : c(n) || {
		kind: "unknown",
		description: "Unrecognized file type",
		rejected: !0
	});
}
async function m(e) {
	let t = i();
	return e.size > t ? {
		kind: "too-large",
		description: `File too large (${(e.size / 1e6).toFixed(1)} MB, limit ${(t / 1e6).toFixed(0)} MB)`,
		rejected: !0
	} : p(e);
}
//#endregion
export { m as i, i as n, p as r, f as t };
