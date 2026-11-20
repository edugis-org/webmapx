import { c as e, d as t, l as n, o as r, s as i, t as a } from "./tool-accent-D6W4FrKq.js";
import { a as o, c as s, d as c, i as l, l as u, n as d, r as f, u as p } from "./appearance-8d96KWh4.js";
//#region src/config/schema-version.ts
var m = 0;
function h(e) {
	return e == null ? "missing" : typeof e != "number" || !Number.isFinite(e) ? "invalid" : e > 0 ? "newer" : e < 0 ? "older" : "current";
}
//#endregion
//#region src/config/validator.ts
var g = new Set(["nominatim"]), _ = {
	root: [
		"version",
		"baseUrl",
		"apiKeysFile",
		"project",
		"map",
		"runtimeMap",
		"layerData",
		"catalog",
		"library",
		"state",
		"ui",
		"tools",
		"stories",
		"plugins",
		"_devTools"
	],
	map: [
		"label",
		"center",
		"zoom",
		"minZoom",
		"maxZoom",
		"minPitch",
		"maxPitch",
		"type",
		"style",
		"styleUrl",
		"bearing",
		"pitch",
		"projection",
		"backgroundColor"
	],
	runtimeMap: [
		"minZoom",
		"maxZoom",
		"minPitch",
		"maxPitch",
		"maxBounds"
	],
	layerData: [
		"sources",
		"layers",
		"attributeMetadata"
	],
	catalog: [
		"label",
		"tree",
		"sources",
		"layers"
	],
	treeNode: [
		"label",
		"layerId",
		"selectionMode",
		"selectionGroup",
		"allowNone",
		"stackOrder",
		"checked",
		"expanded",
		"children",
		"separator"
	],
	state: [
		"activeBackground",
		"activeLayers",
		"activeExclusiveLayers",
		"terrainEnabled"
	],
	stateLayer: [
		"id",
		"ref",
		"layerId",
		"visible",
		"timeState",
		"paint",
		"layout",
		"metadata",
		"source",
		"type"
	],
	sourceBase: [
		"id",
		"type",
		"attribution"
	],
	sourceRaster: [
		"service",
		"url",
		"tiles",
		"tileSize",
		"minzoom",
		"maxzoom",
		"bounds",
		"scheme",
		"volatile",
		"attribution",
		"layers",
		"format",
		"transparent",
		"version",
		"crs"
	],
	sourceGeojson: [
		"data",
		"attribution",
		"minzoom",
		"maxzoom",
		"bounds",
		"buffer",
		"tolerance",
		"cluster",
		"clusterRadius",
		"clusterMaxZoom",
		"lineMetrics",
		"generateId"
	],
	sourceVector: [
		"url",
		"tiles",
		"bounds",
		"scheme",
		"minzoom",
		"maxzoom",
		"attribution",
		"volatile"
	],
	sourceRasterDem: [
		"tiles",
		"url",
		"tileSize",
		"encoding",
		"maxzoom",
		"attribution"
	],
	layer: [
		"id",
		"type",
		"source",
		"source-layer",
		"sources",
		"layers",
		"url",
		"annotation",
		"fallbackLayerId",
		"singleGroup",
		"title",
		"metadata",
		"minzoom",
		"maxzoom",
		"paint",
		"layout",
		"filter",
		"featureInfoLimit"
	],
	styleLayer: [
		"id",
		"type",
		"source",
		"sourceLayer",
		"source-layer",
		"metadata",
		"minzoom",
		"maxzoom",
		"paint",
		"layout",
		"filter"
	],
	tool: [
		"enabled",
		"label",
		"icon"
	],
	toolInsetMap: [
		"enabled",
		"type",
		"position",
		"label",
		"icon",
		"zoomOffset",
		"baseScale",
		"styleUrl",
		"background"
	],
	toolInsetMapBackground: [
		"service",
		"url",
		"tiles",
		"attribution",
		"tileSize"
	],
	toolSearch: [
		"enabled",
		"type",
		"label",
		"title",
		"icon",
		"endpoint",
		"params",
		"maxResults",
		"defaultZoom",
		"marker",
		"persistOnSelect",
		"provider",
		"attribution"
	]
}, v = [
	"maplibre",
	"openlayers",
	"leaflet",
	"cesium"
], y = [
	"raster",
	"geojson",
	"vector",
	"raster-dem"
], b = [
	"xyz",
	"wms",
	"wmts"
], x = [
	"background",
	"fill",
	"line",
	"circle",
	"symbol",
	"raster",
	"fill-extrusion",
	"heatmap",
	"hillshade"
], S = ["multiple", "single"];
function C(e) {
	let t = [], n = [];
	if (!G(e)) return t.push({
		severity: "error",
		path: "",
		message: "Configuration must be an object"
	}), {
		valid: !1,
		errors: t,
		warnings: n
	};
	let r = e;
	q(r, _.root, "", n), L(r.version, n), D(r.map, t, n), O(r.runtimeMap, t, n);
	let i = G(r.runtimeMap) ? r.runtimeMap.maxBounds : void 0, a = G(r.map) ? r.map.center : void 0;
	if (Array.isArray(i) && i.length === 4 && i.every((e) => typeof e == "number") && Array.isArray(a) && a.length === 2 && a.every((e) => typeof e == "number")) {
		let [e, t, r, o] = i, [s, c] = a;
		(s < e || s > r || c < t || c > o) && n.push({
			severity: "warning",
			path: "map.center",
			message: "\"center\" lies outside \"runtimeMap.maxBounds\" — the map will clamp to the bounds on load"
		});
	}
	let o = /* @__PURE__ */ new Set();
	if (r.layerData !== void 0 && ({layerIds: o} = E(r.layerData, t, n, "layerData")), r.catalog !== void 0) {
		n.push({
			severity: "warning",
			path: "catalog",
			message: "\"catalog\" is deprecated; use \"layerData\" and place tree under layerTree tool config"
		});
		let e = k(r.catalog, t, n);
		r.layerData === void 0 && (o = e.layerIds);
	}
	return r.layerData === void 0 && r.catalog === void 0 && t.push({
		severity: "error",
		path: "layerData",
		message: "Missing required \"layerData\" section"
	}), A(r.state, o, t, n), r.tools !== void 0 && I(r.tools, "tools", o, t, n), r.stories !== void 0 && W(r.stories, o, t, n), R(r.plugins, n), V(r.ui, n), {
		valid: t.length === 0,
		errors: t,
		warnings: n
	};
}
function w(e) {
	if (Array.isArray(e)) return { entries: e };
	if (!G(e)) return null;
	let t = e, n = Object.keys(t);
	return {
		entries: n.map((e) => {
			let n = t[e];
			return G(n) ? {
				id: e,
				...n
			} : n;
		}),
		keys: n
	};
}
function T(e, t, n) {
	return n ? `${e}.${n[t]}` : `${e}[${t}]`;
}
function E(e, t, n, r) {
	let i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
	if (!G(e)) return t.push({
		severity: "error",
		path: r,
		message: `"${r}" must be an object`
	}), {
		sourceIds: i,
		layerIds: a
	};
	let o = e;
	q(o, _.layerData, r, n);
	let s = w(o.sources);
	o.sources === void 0 ? t.push({
		severity: "error",
		path: `${r}.sources`,
		message: "Missing required \"sources\" array"
	}) : s ? j(s.entries, `${r}.sources`, i, t, n, s.keys) : t.push({
		severity: "error",
		path: `${r}.sources`,
		message: "\"sources\" must be an array, or an object keyed by source id"
	});
	let c = w(o.layers);
	return o.layers === void 0 ? t.push({
		severity: "error",
		path: `${r}.layers`,
		message: "Missing required \"layers\" array"
	}) : c ? (M(c.entries, `${r}.layers`, i, a, t, n, c.keys), c.entries.forEach((e, n) => {
		if (!G(e)) return;
		let i = e, o = T(`${r}.layers`, n, c.keys);
		if (i.fallbackLayerId !== void 0 && typeof i.fallbackLayerId != "string") {
			t.push({
				severity: "error",
				path: `${o}.fallbackLayerId`,
				message: "\"fallbackLayerId\" must be a string"
			});
			return;
		}
		typeof i.fallbackLayerId == "string" && !a.has(i.fallbackLayerId) && t.push({
			severity: "error",
			path: `${o}.fallbackLayerId`,
			message: `Layer "${i.fallbackLayerId}" not found in layers`
		});
	})) : t.push({
		severity: "error",
		path: `${r}.layers`,
		message: "\"layers\" must be an array, or an object keyed by layer id"
	}), {
		sourceIds: i,
		layerIds: a
	};
}
function D(e, t, n) {
	if (e === void 0) {
		t.push({
			severity: "error",
			path: "map",
			message: "Missing required \"map\" section"
		});
		return;
	}
	if (!G(e)) {
		t.push({
			severity: "error",
			path: "map",
			message: "\"map\" must be an object"
		});
		return;
	}
	let r = e;
	q(r, _.map, "map", n), r.center === void 0 ? t.push({
		severity: "error",
		path: "map.center",
		message: "Missing required \"center\""
	}) : K(r.center) || t.push({
		severity: "error",
		path: "map.center",
		message: "\"center\" must be [longitude, latitude] array with valid values"
	}), r.zoom === void 0 ? t.push({
		severity: "error",
		path: "map.zoom",
		message: "Missing required \"zoom\""
	}) : (typeof r.zoom != "number" || r.zoom < 0 || r.zoom > 24) && t.push({
		severity: "error",
		path: "map.zoom",
		message: "\"zoom\" must be a number between 0 and 24"
	}), r.type === void 0 ? t.push({
		severity: "error",
		path: "map.type",
		message: "Missing required \"type\""
	}) : v.includes(r.type) || t.push({
		severity: "error",
		path: "map.type",
		message: `"type" must be one of: ${v.join(", ")}`
	}), r.minZoom !== void 0 && (typeof r.minZoom != "number" || r.minZoom < 0 || r.minZoom > 24) ? t.push({
		severity: "error",
		path: "map.minZoom",
		message: "\"minZoom\" must be a number between 0 and 24"
	}) : r.minZoom !== void 0 && n.push({
		severity: "warning",
		path: "map.minZoom",
		message: "\"map.minZoom\" is deprecated; use \"runtimeMap.minZoom\""
	}), r.maxZoom !== void 0 && (typeof r.maxZoom != "number" || r.maxZoom < 0 || r.maxZoom > 24) ? t.push({
		severity: "error",
		path: "map.maxZoom",
		message: "\"maxZoom\" must be a number between 0 and 24"
	}) : r.maxZoom !== void 0 && n.push({
		severity: "warning",
		path: "map.maxZoom",
		message: "\"map.maxZoom\" is deprecated; use \"runtimeMap.maxZoom\""
	}), typeof r.minZoom == "number" && typeof r.maxZoom == "number" && r.minZoom > r.maxZoom && t.push({
		severity: "error",
		path: "map.minZoom",
		message: "\"minZoom\" cannot be greater than \"maxZoom\""
	}), r.minPitch !== void 0 && (typeof r.minPitch != "number" || r.minPitch < 0 || r.minPitch > 85) ? t.push({
		severity: "error",
		path: "map.minPitch",
		message: "\"minPitch\" must be a number between 0 and 85"
	}) : r.minPitch !== void 0 && n.push({
		severity: "warning",
		path: "map.minPitch",
		message: "\"map.minPitch\" is deprecated; use \"runtimeMap.minPitch\""
	}), r.maxPitch !== void 0 && (typeof r.maxPitch != "number" || r.maxPitch < 0 || r.maxPitch > 85) ? t.push({
		severity: "error",
		path: "map.maxPitch",
		message: "\"maxPitch\" must be a number between 0 and 85"
	}) : r.maxPitch !== void 0 && n.push({
		severity: "warning",
		path: "map.maxPitch",
		message: "\"map.maxPitch\" is deprecated; use \"runtimeMap.maxPitch\""
	}), typeof r.minPitch == "number" && typeof r.maxPitch == "number" && r.minPitch > r.maxPitch && t.push({
		severity: "error",
		path: "map.minPitch",
		message: "\"minPitch\" cannot be greater than \"maxPitch\""
	});
}
function O(e, t, n) {
	let r = "runtimeMap";
	if (e === void 0) return;
	if (!G(e)) {
		t.push({
			severity: "error",
			path: r,
			message: "\"runtimeMap\" must be an object"
		});
		return;
	}
	let i = e;
	if (q(i, _.runtimeMap, r, n), i.minZoom !== void 0 && (typeof i.minZoom != "number" || i.minZoom < 0 || i.minZoom > 24) && t.push({
		severity: "error",
		path: `${r}.minZoom`,
		message: "\"minZoom\" must be a number between 0 and 24"
	}), i.maxZoom !== void 0 && (typeof i.maxZoom != "number" || i.maxZoom < 0 || i.maxZoom > 24) && t.push({
		severity: "error",
		path: `${r}.maxZoom`,
		message: "\"maxZoom\" must be a number between 0 and 24"
	}), typeof i.minZoom == "number" && typeof i.maxZoom == "number" && i.minZoom > i.maxZoom && t.push({
		severity: "error",
		path: `${r}.minZoom`,
		message: "\"minZoom\" cannot be greater than \"maxZoom\""
	}), i.minPitch !== void 0 && (typeof i.minPitch != "number" || i.minPitch < 0 || i.minPitch > 85) && t.push({
		severity: "error",
		path: `${r}.minPitch`,
		message: "\"minPitch\" must be a number between 0 and 85"
	}), i.maxPitch !== void 0 && (typeof i.maxPitch != "number" || i.maxPitch < 0 || i.maxPitch > 85) && t.push({
		severity: "error",
		path: `${r}.maxPitch`,
		message: "\"maxPitch\" must be a number between 0 and 85"
	}), typeof i.minPitch == "number" && typeof i.maxPitch == "number" && i.minPitch > i.maxPitch && t.push({
		severity: "error",
		path: `${r}.minPitch`,
		message: "\"minPitch\" cannot be greater than \"maxPitch\""
	}), i.maxBounds !== void 0) {
		let e = i.maxBounds;
		if (!Array.isArray(e) || e.length !== 4 || e.some((e) => typeof e != "number" || !Number.isFinite(e))) t.push({
			severity: "error",
			path: `${r}.maxBounds`,
			message: "\"maxBounds\" must be [west, south, east, north] — an array of 4 numbers (lon/lat degrees)"
		});
		else {
			let [i, a, o, s] = e;
			i >= o && t.push({
				severity: "error",
				path: `${r}.maxBounds`,
				message: "\"maxBounds\" west must be less than east (antimeridian-crossing boxes are not supported)"
			}), a >= s && t.push({
				severity: "error",
				path: `${r}.maxBounds`,
				message: "\"maxBounds\" south must be less than north"
			}), (a < -90 || s > 90) && t.push({
				severity: "error",
				path: `${r}.maxBounds`,
				message: "\"maxBounds\" latitudes must be within [-90, 90]"
			}), (i < -180 || o > 180) && n.push({
				severity: "warning",
				path: `${r}.maxBounds`,
				message: "\"maxBounds\" longitudes outside [-180, 180]"
			});
		}
	}
}
function k(e, t, n) {
	let r = "catalog", i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
	if (e === void 0) return t.push({
		severity: "error",
		path: r,
		message: "Missing required \"catalog\" section"
	}), {
		sourceIds: i,
		layerIds: a
	};
	if (!G(e)) return t.push({
		severity: "error",
		path: r,
		message: "\"catalog\" must be an object"
	}), {
		sourceIds: i,
		layerIds: a
	};
	let o = e;
	return q(o, _.catalog, r, n), o.sources === void 0 ? t.push({
		severity: "error",
		path: `${r}.sources`,
		message: "Missing required \"sources\" array"
	}) : Array.isArray(o.sources) ? j(o.sources, `${r}.sources`, i, t, n) : t.push({
		severity: "error",
		path: `${r}.sources`,
		message: "\"sources\" must be an array"
	}), o.layers === void 0 ? t.push({
		severity: "error",
		path: `${r}.layers`,
		message: "Missing required \"layers\" array"
	}) : Array.isArray(o.layers) ? (M(o.layers, `${r}.layers`, i, a, t, n), o.layers.forEach((e, n) => {
		if (!G(e)) return;
		let i = e, o = `${r}.layers[${n}]`;
		if (i.fallbackLayerId !== void 0 && typeof i.fallbackLayerId != "string") {
			t.push({
				severity: "error",
				path: `${o}.fallbackLayerId`,
				message: "\"fallbackLayerId\" must be a string"
			});
			return;
		}
		typeof i.fallbackLayerId == "string" && !a.has(i.fallbackLayerId) && t.push({
			severity: "error",
			path: `${o}.fallbackLayerId`,
			message: `Layer "${i.fallbackLayerId}" not found in layers`
		});
	})) : t.push({
		severity: "error",
		path: `${r}.layers`,
		message: "\"layers\" must be an array"
	}), o.tree === void 0 ? t.push({
		severity: "error",
		path: `${r}.tree`,
		message: "Missing required \"tree\" array"
	}) : Array.isArray(o.tree) ? P(o.tree, `${r}.tree`, a, t, n) : t.push({
		severity: "error",
		path: `${r}.tree`,
		message: "\"tree\" must be an array"
	}), {
		sourceIds: i,
		layerIds: a
	};
}
function A(e, t, n, r) {
	let i = "state";
	if (e === void 0) return;
	if (!G(e)) {
		n.push({
			severity: "error",
			path: i,
			message: "\"state\" must be an object"
		});
		return;
	}
	let a = e;
	q(a, _.state, i, r), a.activeBackground !== void 0 && typeof a.activeBackground != "string" && n.push({
		severity: "error",
		path: `${i}.activeBackground`,
		message: "\"activeBackground\" must be a string"
	}), a.activeLayers === void 0 || (Array.isArray(a.activeLayers) ? a.activeLayers.forEach((e, a) => {
		let o = `${i}.activeLayers[${a}]`;
		if (typeof e == "string") {
			t.has(e) || n.push({
				severity: "error",
				path: o,
				message: `Layer "${e}" not found in layers`
			});
			return;
		}
		if (!G(e)) {
			n.push({
				severity: "error",
				path: o,
				message: "Active layer entry must be a string ref or object"
			});
			return;
		}
		let s = e;
		q(s, _.stateLayer, o, r);
		let c = typeof s.ref == "string" ? s.ref : typeof s.layerId == "string" ? s.layerId : null;
		c && !t.has(c) && n.push({
			severity: "error",
			path: `${o}.ref`,
			message: `Layer "${c}" not found in layers`
		}), s.visible !== void 0 && typeof s.visible != "boolean" && n.push({
			severity: "error",
			path: `${o}.visible`,
			message: "\"visible\" must be a boolean"
		});
	}) : n.push({
		severity: "error",
		path: `${i}.activeLayers`,
		message: "\"activeLayers\" must be an array"
	})), a.activeExclusiveLayers !== void 0 && (G(a.activeExclusiveLayers) ? Object.entries(a.activeExclusiveLayers).forEach(([e, r]) => {
		let a = `${i}.activeExclusiveLayers.${e}`;
		if (typeof r != "string" || r.length === 0) {
			n.push({
				severity: "error",
				path: a,
				message: "Exclusive group value must be a non-empty layer id string"
			});
			return;
		}
		t.has(r) || n.push({
			severity: "error",
			path: a,
			message: `Layer "${r}" not found in layers`
		});
	}) : n.push({
		severity: "error",
		path: `${i}.activeExclusiveLayers`,
		message: "\"activeExclusiveLayers\" must be an object"
	}));
}
function j(e, t, n, r, i, a) {
	e.forEach((e, o) => {
		let s = T(t, o, a);
		if (!G(e)) {
			r.push({
				severity: "error",
				path: s,
				message: "Source must be an object"
			});
			return;
		}
		let c = e;
		if (typeof c.id != "string" || c.id.length === 0 ? r.push({
			severity: "error",
			path: `${s}.id`,
			message: "Source must have a non-empty string \"id\""
		}) : (n.has(c.id) && r.push({
			severity: "error",
			path: `${s}.id`,
			message: `Duplicate source ID: "${c.id}"`
		}), n.add(c.id)), !y.includes(c.type)) {
			r.push({
				severity: "error",
				path: `${s}.type`,
				message: `Source "type" must be one of: ${y.join(", ")}`
			});
			return;
		}
		let l = [..._.sourceBase];
		if (c.type === "raster") {
			l.push(..._.sourceRaster);
			let e = typeof c.url == "string" && c.url.length > 0, t = (e) => Array.isArray(e) && e.length > 0 && e.every((e) => typeof e == "string" && e.length > 0), n = t(c.url), i = t(c.tiles);
			!e && !n && !i && r.push({
				severity: "error",
				path: `${s}.url`,
				message: "Raster source requires a non-empty \"url\" (string or string array) or \"tiles\" array"
			}), c.service !== void 0 && !b.includes(c.service) && r.push({
				severity: "error",
				path: `${s}.service`,
				message: `Raster "service" must be one of: ${b.join(", ")}`
			}), c.tileSize !== void 0 && (typeof c.tileSize != "number" || c.tileSize <= 0) && r.push({
				severity: "error",
				path: `${s}.tileSize`,
				message: "\"tileSize\" must be a positive number"
			}), c.minZoom !== void 0 && r.push({
				severity: "error",
				path: `${s}.minZoom`,
				message: "\"minZoom\" is not supported; use \"minzoom\" (Mapbox/MapLibre style spec)"
			}), c.maxZoom !== void 0 && r.push({
				severity: "error",
				path: `${s}.maxZoom`,
				message: "\"maxZoom\" is not supported; use \"maxzoom\" (Mapbox/MapLibre style spec)"
			});
			let a = c.minzoom, o = c.maxzoom;
			a !== void 0 && (typeof a != "number" || a > 24) && r.push({
				severity: "error",
				path: `${s}.minzoom`,
				message: "\"minzoom\" must be a number not greater than 24"
			}), o !== void 0 && (typeof o != "number" || o < 0 || o > 24) && r.push({
				severity: "error",
				path: `${s}.maxzoom`,
				message: "\"maxzoom\" must be a number between 0 and 24"
			}), typeof a == "number" && typeof o == "number" && a > o && r.push({
				severity: "error",
				path: `${s}.minzoom`,
				message: "\"minzoom\" cannot be greater than \"maxzoom\""
			});
		} else if (c.type === "geojson") l.push(..._.sourceGeojson), c.data === void 0 ? r.push({
			severity: "error",
			path: `${s}.data`,
			message: "GeoJSON source requires \"data\""
		}) : typeof c.data != "string" && !G(c.data) && r.push({
			severity: "error",
			path: `${s}.data`,
			message: "\"data\" must be a URL string or GeoJSON object"
		});
		else if (c.type === "vector") {
			l.push(..._.sourceVector);
			let e = typeof c.url == "string" && c.url.length > 0, t = Array.isArray(c.tiles) && c.tiles.length > 0;
			!e && !t && r.push({
				severity: "error",
				path: `${s}.url`,
				message: "Vector source requires a \"url\" or \"tiles\""
			});
		} else if (c.type === "raster-dem") {
			l.push(..._.sourceRasterDem);
			let e = Array.isArray(c.tiles) && c.tiles.length > 0 && c.tiles.every((e) => typeof e == "string" && e.length > 0), t = typeof c.url == "string" && c.url.length > 0;
			!e && !t && r.push({
				severity: "error",
				path: `${s}.tiles`,
				message: "Raster-dem source requires a non-empty \"tiles\" string array or a \"url\""
			});
		}
		q(c, l, s, i), c.attribution === void 0 && i.push({
			severity: "warning",
			path: s,
			message: "Source is missing \"attribution\""
		});
	});
}
function M(e, t, n, r, i, a, o) {
	e.forEach((e, s) => {
		let c = T(t, s, o);
		if (!G(e)) {
			i.push({
				severity: "error",
				path: c,
				message: "Layer must be an object"
			});
			return;
		}
		let l = e;
		q(l, l.type === "style" ? [
			..._.layer,
			"attribution",
			"version"
		] : _.layer, c, a), typeof l.id != "string" || l.id.length === 0 ? i.push({
			severity: "error",
			path: `${c}.id`,
			message: "Layer must have a non-empty string \"id\""
		}) : (r.has(l.id) && i.push({
			severity: "error",
			path: `${c}.id`,
			message: `Duplicate layer ID: "${l.id}"`
		}), r.add(l.id));
		let u = l.type;
		if (u === "allmaps") (typeof l.annotation != "string" || l.annotation.length === 0) && i.push({
			severity: "error",
			path: `${c}.annotation`,
			message: "Allmaps layer must have an \"annotation\" URL"
		});
		else if (u === "style") {
			if (Array.isArray(l.layers) && l.layers.length > 0) {
				let e = G(l.sources) ? Object.keys(l.sources) : [], t = e.length > 0 ? new Set([...n, ...e]) : n;
				N(l.layers, `${c}.layers`, t, i, a);
			}
		} else typeof u == "string" && x.includes(u) ? typeof l.source != "string" && u !== "background" && a.push({
			severity: "warning",
			path: `${c}.source`,
			message: "Standard layer should have a \"source\""
		}) : u !== void 0 && i.push({
			severity: "error",
			path: `${c}.type`,
			message: `Unknown layer type: "${u}"`
		});
	});
}
function N(e, t, n, r, i) {
	e.forEach((e, a) => {
		let o = `${t}[${a}]`;
		if (!G(e)) {
			r.push({
				severity: "error",
				path: o,
				message: "Style layer must be an object"
			});
			return;
		}
		let s = e;
		q(s, _.styleLayer, o, i), s.minZoom !== void 0 && r.push({
			severity: "error",
			path: `${o}.minZoom`,
			message: "\"minZoom\" is not supported; use \"minzoom\" (Mapbox/MapLibre style spec)"
		}), s.maxZoom !== void 0 && r.push({
			severity: "error",
			path: `${o}.maxZoom`,
			message: "\"maxZoom\" is not supported; use \"maxzoom\" (Mapbox/MapLibre style spec)"
		}), x.includes(s.type) || r.push({
			severity: "error",
			path: `${o}.type`,
			message: `Style layer "type" must be one of: ${x.join(", ")}`
		}), s.type !== "background" && (typeof s.source != "string" || s.source.length === 0 ? r.push({
			severity: "error",
			path: `${o}.source`,
			message: "Style layer must have a \"source\""
		}) : n.has(s.source) || r.push({
			severity: "error",
			path: `${o}.source`,
			message: `Source "${s.source}" not found in sources`
		}), s.minzoom !== void 0 && (typeof s.minzoom != "number" || s.minzoom > 24) && r.push({
			severity: "error",
			path: `${o}.minzoom`,
			message: "\"minzoom\" must be a number not greater than 24"
		}), s.maxzoom !== void 0 && (typeof s.maxzoom != "number" || s.maxzoom < 0 || s.maxzoom > 24) && r.push({
			severity: "error",
			path: `${o}.maxzoom`,
			message: "\"maxzoom\" must be a number between 0 and 24"
		}));
	});
}
function P(e, t, n, r, i) {
	e.forEach((e, a) => {
		F(e, `${t}[${a}]`, n, r, i);
	});
}
function F(e, t, n, r, i) {
	if (!G(e)) {
		r.push({
			severity: "error",
			path: t,
			message: "Tree node must be an object"
		});
		return;
	}
	let a = e;
	if (q(a, _.treeNode, t, i), a.separator === !0) {
		(typeof a.label != "string" || a.label.length === 0) && r.push({
			severity: "error",
			path: `${t}.label`,
			message: "Separator node must have a non-empty \"label\""
		});
		return;
	}
	!(typeof a.layerId == "string" && a.layerId.length > 0) && (typeof a.label != "string" || a.label.length === 0) && r.push({
		severity: "error",
		path: `${t}.label`,
		message: "Tree node must have a non-empty \"label\""
	});
	let o = a.layerId !== void 0, s = a.children !== void 0;
	o && s && i.push({
		severity: "warning",
		path: t,
		message: "Tree node has both \"layerId\" and \"children\" - consider separating leaf and group nodes"
	}), o && (typeof a.layerId == "string" ? n.has(a.layerId) || r.push({
		severity: "error",
		path: `${t}.layerId`,
		message: `Layer "${a.layerId}" not found in layers`
	}) : r.push({
		severity: "error",
		path: `${t}.layerId`,
		message: "\"layerId\" must be a string"
	})), s && (Array.isArray(a.children) ? a.children.forEach((e, a) => {
		F(e, `${t}.children[${a}]`, n, r, i);
	}) : r.push({
		severity: "error",
		path: `${t}.children`,
		message: "\"children\" must be an array"
	})), a.checked !== void 0 && typeof a.checked != "boolean" && r.push({
		severity: "error",
		path: `${t}.checked`,
		message: "\"checked\" must be a boolean"
	}), a.expanded !== void 0 && typeof a.expanded != "boolean" && r.push({
		severity: "error",
		path: `${t}.expanded`,
		message: "\"expanded\" must be a boolean"
	}), a.selectionMode !== void 0 && !S.includes(a.selectionMode) && r.push({
		severity: "error",
		path: `${t}.selectionMode`,
		message: `"selectionMode" must be one of: ${S.join(", ")}`
	}), a.selectionGroup !== void 0 && typeof a.selectionGroup != "string" && r.push({
		severity: "error",
		path: `${t}.selectionGroup`,
		message: "\"selectionGroup\" must be a string"
	}), a.allowNone !== void 0 && typeof a.allowNone != "boolean" && r.push({
		severity: "error",
		path: `${t}.allowNone`,
		message: "\"allowNone\" must be a boolean"
	}), a.stackOrder !== void 0 && (typeof a.stackOrder != "number" || !Number.isFinite(a.stackOrder)) && r.push({
		severity: "error",
		path: `${t}.stackOrder`,
		message: "\"stackOrder\" must be a finite number"
	}), a.selectionMode === "single" && !s && i.push({
		severity: "warning",
		path: `${t}.selectionMode`,
		message: "\"selectionMode: single\" is typically used on group nodes with children"
	}), a.allowNone !== void 0 && a.selectionMode !== "single" && i.push({
		severity: "warning",
		path: `${t}.allowNone`,
		message: "\"allowNone\" only applies when \"selectionMode\" is \"single\""
	});
}
function I(e, t, n, r, i) {
	if (!G(e)) {
		i.push({
			severity: "warning",
			path: t,
			message: "\"tools\" should be an object"
		});
		return;
	}
	Object.entries(e).forEach(([e, a]) => {
		let o = `${t}.${e}`;
		if (!G(a)) {
			i.push({
				severity: "warning",
				path: o,
				message: "Tool config should be an object"
			});
			return;
		}
		let s = a;
		if (s.enabled === void 0 ? i.push({
			severity: "warning",
			path: o,
			message: "Tool config is missing \"enabled\" property"
		}) : typeof s.enabled != "boolean" && i.push({
			severity: "warning",
			path: `${o}.enabled`,
			message: "\"enabled\" should be a boolean"
		}), H(s, o, i), s.type === "toolbar" ? (s.labels !== void 0 && typeof s.labels != "boolean" && i.push({
			severity: "warning",
			path: `${o}.labels`,
			message: "\"labels\" should be true or false"
		}), B(s.items, `${o}.items`, i)) : z(e, o, "section", i), Array.isArray(s.items) && s.items.forEach((e, t) => {
			if (!G(e)) return;
			let a = `${o}.items[${t}]`, s = e;
			if (H(s, a, i), s.type === "layerTree") {
				if (s.catalog !== void 0 && i.push({
					severity: "warning",
					path: `${a}.catalog`,
					message: "\"catalog\" reference is deprecated; embed \"tree\" in this layerTree tool item"
				}), s.tree === void 0) {
					i.push({
						severity: "warning",
						path: `${a}.tree`,
						message: "LayerTree tool item should define a \"tree\" array"
					});
					return;
				}
				if (!Array.isArray(s.tree)) {
					r.push({
						severity: "error",
						path: `${a}.tree`,
						message: "\"tree\" must be an array"
					});
					return;
				}
				P(s.tree, `${a}.tree`, n, r, i);
			}
		}), e === "search" && (q(s, _.toolSearch, o, i), s.provider !== void 0 && (typeof s.provider == "string" ? g.has(s.provider.toLowerCase()) || i.push({
			severity: "warning",
			path: `${o}.provider`,
			message: `Unknown search provider "${s.provider}"`
		}) : i.push({
			severity: "warning",
			path: `${o}.provider`,
			message: "\"provider\" should be a string"
		})), s.attribution !== void 0 && typeof s.attribution != "string" && i.push({
			severity: "warning",
			path: `${o}.attribution`,
			message: "\"attribution\" should be a string"
		})), e === "insetMap" && (q(s, _.toolInsetMap, o, i), s.zoomOffset !== void 0 && (typeof s.zoomOffset != "number" || !Number.isFinite(s.zoomOffset)) && i.push({
			severity: "warning",
			path: `${o}.zoomOffset`,
			message: "\"zoomOffset\" should be a finite number"
		}), s.baseScale !== void 0 && (typeof s.baseScale != "number" || !Number.isFinite(s.baseScale) || s.baseScale <= 0) && i.push({
			severity: "warning",
			path: `${o}.baseScale`,
			message: "\"baseScale\" should be a positive finite number"
		}), s.styleUrl !== void 0 && typeof s.styleUrl != "string" && i.push({
			severity: "warning",
			path: `${o}.styleUrl`,
			message: "\"styleUrl\" should be a string"
		}), s.background !== void 0)) if (!G(s.background)) i.push({
			severity: "warning",
			path: `${o}.background`,
			message: "\"background\" should be an object"
		});
		else {
			let e = s.background;
			q(e, _.toolInsetMapBackground, `${o}.background`, i), e.service !== "xyz" && i.push({
				severity: "warning",
				path: `${o}.background.service`,
				message: "Only \"xyz\" background service is currently supported"
			});
			let t = typeof e.url == "string" && e.url.length > 0, n = Array.isArray(e.tiles) && e.tiles.length > 0 && e.tiles.every((e) => typeof e == "string" && e.length > 0);
			!t && !n && i.push({
				severity: "warning",
				path: `${o}.background`,
				message: "Provide either \"url\" or non-empty string array \"tiles\""
			}), e.url !== void 0 && (typeof e.url != "string" || e.url.length === 0) && i.push({
				severity: "warning",
				path: `${o}.background.url`,
				message: "\"url\" should be a non-empty string when provided"
			}), e.tiles !== void 0 && !n && i.push({
				severity: "warning",
				path: `${o}.background.tiles`,
				message: "\"tiles\" should be a non-empty string array when provided"
			}), e.attribution !== void 0 && typeof e.attribution != "string" && i.push({
				severity: "warning",
				path: `${o}.background.attribution`,
				message: "\"attribution\" should be a string"
			}), e.tileSize !== void 0 && (typeof e.tileSize != "number" || !Number.isFinite(e.tileSize) || e.tileSize <= 0) && i.push({
				severity: "warning",
				path: `${o}.background.tileSize`,
				message: "\"tileSize\" should be a positive finite number"
			});
		}
	});
}
function L(e, t) {
	let n = h(e);
	if (n === "invalid") {
		t.push({
			severity: "warning",
			path: "version",
			message: `"version" should be a number; found ${typeof e}`
		});
		return;
	}
	n === "newer" && t.push({
		severity: "warning",
		path: "version",
		message: `This config declares schema version ${String(e)}, but this build of webmapx reads version 0 — anything newer will be ignored, and the map may be missing features the config asks for`
	});
}
function R(e, t) {
	if (e !== void 0) {
		if (!Array.isArray(e)) {
			t.push({
				severity: "warning",
				path: "plugins",
				message: "\"plugins\" should be an array of module URLs"
			});
			return;
		}
		if (e.forEach((e, n) => {
			(typeof e != "string" || !e.trim()) && t.push({
				severity: "warning",
				path: `plugins[${n}]`,
				message: "A plugin should be a non-empty module URL"
			});
		}), e.length !== 0) for (let e of t) e.message.startsWith("Unknown tool \"") && (e.message += " (or it comes from a plugin that has not been loaded)");
	}
}
function z(i, a, o, s) {
	let c = t(i), l = n[c] !== void 0, u = r[c] !== void 0, d = !l && !u && e.has(c);
	if (!(l || d) && !(o === "section" && u)) {
		if (o === "item" && u) {
			s.push({
				severity: "warning",
				path: a,
				message: `"${i}" is a standalone map control, so it needs its own "tools" section rather than a toolbar item — it will not appear`
			});
			return;
		}
		s.push({
			severity: "warning",
			path: a,
			message: `Unknown tool "${i}" — either a typo, or a tool this version of webmapx does not have; it will be skipped`
		});
	}
}
function B(e, n, r) {
	Array.isArray(e) && e.forEach((e, o) => {
		if (!G(e)) return;
		let s = `${n}[${o}]`, c = e, l = c.type;
		if (l === void 0) {
			r.push({
				severity: "warning",
				path: `${s}.type`,
				message: "Toolbar item is missing \"type\", which is what decides the tool it builds — it will be skipped"
			});
			return;
		}
		if (typeof l != "string") {
			r.push({
				severity: "warning",
				path: `${s}.type`,
				message: "\"type\" should be a string"
			});
			return;
		}
		if (c.color !== void 0 && (typeof c.color != "string" || c.color.trim() === "") && r.push({
			severity: "warning",
			path: `${s}.color`,
			message: `"color" should be a palette name (${a.join(", ")}) or a CSS colour — the default colour is used instead`
		}), i.has(t(l))) {
			B(c.items, `${s}.items`, r);
			return;
		}
		z(l, `${s}.type`, "item", r);
	});
}
function V(e, t) {
	if (e === void 0) return;
	if (!G(e)) {
		t.push({
			severity: "warning",
			path: "ui",
			message: "\"ui\" should be an object, e.g. { \"style\": \"classroom\", \"theme\": \"auto\" }"
		});
		return;
	}
	let n = e;
	q(n, [
		"style",
		"theme",
		"palette",
		"font"
	], "ui", t), n.palette !== void 0 && !u(n.palette) && t.push({
		severity: "warning",
		path: "ui.palette",
		message: `Unknown palette ${JSON.stringify(n.palette)}; expected one of ${f.join(", ")} — "default" is used instead`
	}), n.font !== void 0 && !s(n.font) && t.push({
		severity: "warning",
		path: "ui.font",
		message: `Unknown font ${JSON.stringify(n.font)}; expected one of ${d.join(", ")} — the style's own font is used instead`
	}), n.style !== void 0 && !p(n.style) && t.push({
		severity: "warning",
		path: "ui.style",
		message: `Unknown style ${JSON.stringify(n.style)}; expected one of ${l.join(", ")} — "atlas" is used instead`
	}), n.theme !== void 0 && !c(n.theme) && t.push({
		severity: "warning",
		path: "ui.theme",
		message: `Unknown theme ${JSON.stringify(n.theme)}; expected one of ${o.join(", ")} — "auto" is used instead`
	});
}
function H(e, t, n) {
	e.label !== void 0 && typeof e.label != "string" && n.push({
		severity: "warning",
		path: `${t}.label`,
		message: "\"label\" should be a string"
	}), e.title !== void 0 && typeof e.title != "string" && n.push({
		severity: "warning",
		path: `${t}.title`,
		message: "\"title\" should be a string"
	}), U(e.icon, `${t}.icon`, n);
}
function U(e, t, n) {
	if (e === void 0) return;
	if (typeof e == "string") {
		e.trim().length === 0 && n.push({
			severity: "warning",
			path: t,
			message: "\"icon\" should not be an empty string"
		});
		return;
	}
	if (!G(e)) {
		n.push({
			severity: "warning",
			path: t,
			message: "\"icon\" should be a string or an object with \"name\", \"library\", or \"src\""
		});
		return;
	}
	let r = e;
	r.name !== void 0 && typeof r.name != "string" && n.push({
		severity: "warning",
		path: `${t}.name`,
		message: "\"name\" should be a string"
	}), r.library !== void 0 && typeof r.library != "string" && n.push({
		severity: "warning",
		path: `${t}.library`,
		message: "\"library\" should be a string"
	}), r.src !== void 0 && typeof r.src != "string" && n.push({
		severity: "warning",
		path: `${t}.src`,
		message: "\"src\" should be a string"
	}), r.name === void 0 && r.src === void 0 && n.push({
		severity: "warning",
		path: t,
		message: "\"icon\" object should define either \"name\" or \"src\""
	});
}
function W(e, t, n, r) {
	let i = "stories";
	if (!G(e)) {
		n.push({
			severity: "error",
			path: i,
			message: "\"stories\" must be an object"
		});
		return;
	}
	if (!Array.isArray(e.stories)) {
		n.push({
			severity: "error",
			path: `${i}.stories`,
			message: "\"stories.stories\" must be an array"
		});
		return;
	}
	e.stories.forEach((e, a) => {
		let o = `${i}.stories[${a}]`;
		if (!G(e)) {
			n.push({
				severity: "error",
				path: o,
				message: "Story entry must be an object"
			});
			return;
		}
		if ((typeof e.name != "string" || e.name.length === 0) && n.push({
			severity: "error",
			path: `${o}.name`,
			message: "\"name\" must be a non-empty string"
		}), !Array.isArray(e.chapters)) {
			n.push({
				severity: "error",
				path: `${o}.chapters`,
				message: "\"chapters\" must be an array"
			});
			return;
		}
		e.chapters.forEach((e, i) => {
			let a = `${o}.chapters[${i}]`;
			if (!G(e)) {
				n.push({
					severity: "error",
					path: a,
					message: "Chapter entry must be an object"
				});
				return;
			}
			if ((typeof e.id != "string" || e.id.length === 0) && n.push({
				severity: "error",
				path: `${a}.id`,
				message: "\"id\" must be a non-empty string"
			}), !Array.isArray(e.steps)) {
				n.push({
					severity: "error",
					path: `${a}.steps`,
					message: "\"steps\" must be an array"
				});
				return;
			}
			e.steps.forEach((e, i) => {
				let o = `${a}.steps[${i}]`;
				if (!G(e)) {
					n.push({
						severity: "error",
						path: o,
						message: "Step entry must be an object"
					});
					return;
				}
				e.html !== void 0 && e.htmlUrl !== void 0 && r.push({
					severity: "warning",
					path: o,
					message: "\"html\" and \"htmlUrl\" are both set; \"htmlUrl\" takes precedence"
				});
				let s = e.state;
				if (!G(s)) {
					n.push({
						severity: "error",
						path: `${o}.state`,
						message: "\"state\" must be an object"
					});
					return;
				}
				Array.isArray(s.layers) ? s.layers.forEach((e) => {
					typeof e == "string" && !t.has(e) && r.push({
						severity: "warning",
						path: `${o}.state.layers`,
						message: `Layer "${e}" not found in layers`
					});
				}) : n.push({
					severity: "error",
					path: `${o}.state.layers`,
					message: "\"state.layers\" must be an array of layer ids"
				});
				let c = s.view;
				(!G(c) || !K(c.center) || typeof c.zoom != "number") && n.push({
					severity: "error",
					path: `${o}.state.view`,
					message: "\"state.view\" must be { center: [lng, lat], zoom, bearing?, pitch? }"
				});
			});
		});
	});
}
function G(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function K(e) {
	if (!Array.isArray(e) || e.length !== 2) return !1;
	let [t, n] = e;
	return typeof t == "number" && typeof n == "number" && t >= -180 && t <= 180 && n >= -90 && n <= 90;
}
function q(e, t, n, r) {
	Object.keys(e).forEach((e) => {
		t.includes(e) || r.push({
			severity: "warning",
			path: n ? `${n}.${e}` : e,
			message: `Unknown key "${e}"`
		});
	});
}
//#endregion
export { m as n, h as r, C as t };
