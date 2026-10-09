import { a as e, i as t, l as n, o as r, s as i } from "./tool-registry-C8PtHfVi.js";
//#region src/config/schema-version.ts
var a = 0;
function o(e) {
	return e == null ? "missing" : typeof e != "number" || !Number.isFinite(e) ? "invalid" : e > 0 ? "newer" : e < 0 ? "older" : "current";
}
//#endregion
//#region src/config/validator.ts
var s = new Set(["nominatim"]), c = {
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
}, l = [
	"maplibre",
	"openlayers",
	"leaflet",
	"cesium"
], u = [
	"raster",
	"geojson",
	"vector",
	"raster-dem"
], d = [
	"xyz",
	"wms",
	"wmts"
], f = [
	"background",
	"fill",
	"line",
	"circle",
	"symbol",
	"raster",
	"fill-extrusion",
	"heatmap",
	"hillshade"
], p = ["multiple", "single"];
function m(e) {
	let t = [], n = [];
	if (!F(e)) return t.push({
		severity: "error",
		path: "",
		message: "Configuration must be an object"
	}), {
		valid: !1,
		errors: t,
		warnings: n
	};
	let r = e;
	L(r, c.root, "", n), O(r.version, n), v(r.map, t, n), y(r.runtimeMap, t, n);
	let i = F(r.runtimeMap) ? r.runtimeMap.maxBounds : void 0, a = F(r.map) ? r.map.center : void 0;
	if (Array.isArray(i) && i.length === 4 && i.every((e) => typeof e == "number") && Array.isArray(a) && a.length === 2 && a.every((e) => typeof e == "number")) {
		let [e, t, r, o] = i, [s, c] = a;
		(s < e || s > r || c < t || c > o) && n.push({
			severity: "warning",
			path: "map.center",
			message: "\"center\" lies outside \"runtimeMap.maxBounds\" — the map will clamp to the bounds on load"
		});
	}
	let o = /* @__PURE__ */ new Set();
	if (r.layerData !== void 0 && ({layerIds: o} = _(r.layerData, t, n, "layerData")), r.catalog !== void 0) {
		n.push({
			severity: "warning",
			path: "catalog",
			message: "\"catalog\" is deprecated; use \"layerData\" and place tree under layerTree tool config"
		});
		let e = b(r.catalog, t, n);
		r.layerData === void 0 && (o = e.layerIds);
	}
	return r.layerData === void 0 && r.catalog === void 0 && t.push({
		severity: "error",
		path: "layerData",
		message: "Missing required \"layerData\" section"
	}), x(r.state, o, t, n), r.tools !== void 0 && D(r.tools, "tools", o, t, n), r.stories !== void 0 && P(r.stories, o, t, n), k(r.plugins, n), {
		valid: t.length === 0,
		errors: t,
		warnings: n
	};
}
function h(e) {
	if (Array.isArray(e)) return { entries: e };
	if (!F(e)) return null;
	let t = e, n = Object.keys(t);
	return {
		entries: n.map((e) => {
			let n = t[e];
			return F(n) ? {
				id: e,
				...n
			} : n;
		}),
		keys: n
	};
}
function g(e, t, n) {
	return n ? `${e}.${n[t]}` : `${e}[${t}]`;
}
function _(e, t, n, r) {
	let i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
	if (!F(e)) return t.push({
		severity: "error",
		path: r,
		message: `"${r}" must be an object`
	}), {
		sourceIds: i,
		layerIds: a
	};
	let o = e;
	L(o, c.layerData, r, n);
	let s = h(o.sources);
	o.sources === void 0 ? t.push({
		severity: "error",
		path: `${r}.sources`,
		message: "Missing required \"sources\" array"
	}) : s ? S(s.entries, `${r}.sources`, i, t, n, s.keys) : t.push({
		severity: "error",
		path: `${r}.sources`,
		message: "\"sources\" must be an array, or an object keyed by source id"
	});
	let l = h(o.layers);
	return o.layers === void 0 ? t.push({
		severity: "error",
		path: `${r}.layers`,
		message: "Missing required \"layers\" array"
	}) : l ? (C(l.entries, `${r}.layers`, i, a, t, n, l.keys), l.entries.forEach((e, n) => {
		if (!F(e)) return;
		let i = e, o = g(`${r}.layers`, n, l.keys);
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
function v(e, t, n) {
	if (e === void 0) {
		t.push({
			severity: "error",
			path: "map",
			message: "Missing required \"map\" section"
		});
		return;
	}
	if (!F(e)) {
		t.push({
			severity: "error",
			path: "map",
			message: "\"map\" must be an object"
		});
		return;
	}
	let r = e;
	L(r, c.map, "map", n), r.center === void 0 ? t.push({
		severity: "error",
		path: "map.center",
		message: "Missing required \"center\""
	}) : I(r.center) || t.push({
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
	}) : l.includes(r.type) || t.push({
		severity: "error",
		path: "map.type",
		message: `"type" must be one of: ${l.join(", ")}`
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
function y(e, t, n) {
	let r = "runtimeMap";
	if (e === void 0) return;
	if (!F(e)) {
		t.push({
			severity: "error",
			path: r,
			message: "\"runtimeMap\" must be an object"
		});
		return;
	}
	let i = e;
	if (L(i, c.runtimeMap, r, n), i.minZoom !== void 0 && (typeof i.minZoom != "number" || i.minZoom < 0 || i.minZoom > 24) && t.push({
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
function b(e, t, n) {
	let r = "catalog", i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
	if (e === void 0) return t.push({
		severity: "error",
		path: r,
		message: "Missing required \"catalog\" section"
	}), {
		sourceIds: i,
		layerIds: a
	};
	if (!F(e)) return t.push({
		severity: "error",
		path: r,
		message: "\"catalog\" must be an object"
	}), {
		sourceIds: i,
		layerIds: a
	};
	let o = e;
	return L(o, c.catalog, r, n), o.sources === void 0 ? t.push({
		severity: "error",
		path: `${r}.sources`,
		message: "Missing required \"sources\" array"
	}) : Array.isArray(o.sources) ? S(o.sources, `${r}.sources`, i, t, n) : t.push({
		severity: "error",
		path: `${r}.sources`,
		message: "\"sources\" must be an array"
	}), o.layers === void 0 ? t.push({
		severity: "error",
		path: `${r}.layers`,
		message: "Missing required \"layers\" array"
	}) : Array.isArray(o.layers) ? (C(o.layers, `${r}.layers`, i, a, t, n), o.layers.forEach((e, n) => {
		if (!F(e)) return;
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
	}) : Array.isArray(o.tree) ? T(o.tree, `${r}.tree`, a, t, n) : t.push({
		severity: "error",
		path: `${r}.tree`,
		message: "\"tree\" must be an array"
	}), {
		sourceIds: i,
		layerIds: a
	};
}
function x(e, t, n, r) {
	let i = "state";
	if (e === void 0) return;
	if (!F(e)) {
		n.push({
			severity: "error",
			path: i,
			message: "\"state\" must be an object"
		});
		return;
	}
	let a = e;
	L(a, c.state, i, r), a.activeBackground !== void 0 && typeof a.activeBackground != "string" && n.push({
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
		if (!F(e)) {
			n.push({
				severity: "error",
				path: o,
				message: "Active layer entry must be a string ref or object"
			});
			return;
		}
		let s = e;
		L(s, c.stateLayer, o, r);
		let l = typeof s.ref == "string" ? s.ref : typeof s.layerId == "string" ? s.layerId : null;
		l && !t.has(l) && n.push({
			severity: "error",
			path: `${o}.ref`,
			message: `Layer "${l}" not found in layers`
		}), s.visible !== void 0 && typeof s.visible != "boolean" && n.push({
			severity: "error",
			path: `${o}.visible`,
			message: "\"visible\" must be a boolean"
		});
	}) : n.push({
		severity: "error",
		path: `${i}.activeLayers`,
		message: "\"activeLayers\" must be an array"
	})), a.activeExclusiveLayers !== void 0 && (F(a.activeExclusiveLayers) ? Object.entries(a.activeExclusiveLayers).forEach(([e, r]) => {
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
function S(e, t, n, r, i, a) {
	e.forEach((e, o) => {
		let s = g(t, o, a);
		if (!F(e)) {
			r.push({
				severity: "error",
				path: s,
				message: "Source must be an object"
			});
			return;
		}
		let l = e;
		if (typeof l.id != "string" || l.id.length === 0 ? r.push({
			severity: "error",
			path: `${s}.id`,
			message: "Source must have a non-empty string \"id\""
		}) : (n.has(l.id) && r.push({
			severity: "error",
			path: `${s}.id`,
			message: `Duplicate source ID: "${l.id}"`
		}), n.add(l.id)), !u.includes(l.type)) {
			r.push({
				severity: "error",
				path: `${s}.type`,
				message: `Source "type" must be one of: ${u.join(", ")}`
			});
			return;
		}
		let f = [...c.sourceBase];
		if (l.type === "raster") {
			f.push(...c.sourceRaster);
			let e = typeof l.url == "string" && l.url.length > 0, t = (e) => Array.isArray(e) && e.length > 0 && e.every((e) => typeof e == "string" && e.length > 0), n = t(l.url), i = t(l.tiles);
			!e && !n && !i && r.push({
				severity: "error",
				path: `${s}.url`,
				message: "Raster source requires a non-empty \"url\" (string or string array) or \"tiles\" array"
			}), l.service !== void 0 && !d.includes(l.service) && r.push({
				severity: "error",
				path: `${s}.service`,
				message: `Raster "service" must be one of: ${d.join(", ")}`
			}), l.tileSize !== void 0 && (typeof l.tileSize != "number" || l.tileSize <= 0) && r.push({
				severity: "error",
				path: `${s}.tileSize`,
				message: "\"tileSize\" must be a positive number"
			}), l.minZoom !== void 0 && r.push({
				severity: "error",
				path: `${s}.minZoom`,
				message: "\"minZoom\" is not supported; use \"minzoom\" (Mapbox/MapLibre style spec)"
			}), l.maxZoom !== void 0 && r.push({
				severity: "error",
				path: `${s}.maxZoom`,
				message: "\"maxZoom\" is not supported; use \"maxzoom\" (Mapbox/MapLibre style spec)"
			});
			let a = l.minzoom, o = l.maxzoom;
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
		} else if (l.type === "geojson") f.push(...c.sourceGeojson), l.data === void 0 ? r.push({
			severity: "error",
			path: `${s}.data`,
			message: "GeoJSON source requires \"data\""
		}) : typeof l.data != "string" && !F(l.data) && r.push({
			severity: "error",
			path: `${s}.data`,
			message: "\"data\" must be a URL string or GeoJSON object"
		});
		else if (l.type === "vector") {
			f.push(...c.sourceVector);
			let e = typeof l.url == "string" && l.url.length > 0, t = Array.isArray(l.tiles) && l.tiles.length > 0;
			!e && !t && r.push({
				severity: "error",
				path: `${s}.url`,
				message: "Vector source requires a \"url\" or \"tiles\""
			});
		} else l.type === "raster-dem" && (f.push(...c.sourceRasterDem), Array.isArray(l.tiles) && l.tiles.length > 0 && l.tiles.every((e) => typeof e == "string" && e.length > 0) || r.push({
			severity: "error",
			path: `${s}.tiles`,
			message: "Raster-dem source requires a non-empty \"tiles\" string array"
		}));
		L(l, f, s, i), l.attribution === void 0 && i.push({
			severity: "warning",
			path: s,
			message: "Source is missing \"attribution\""
		});
	});
}
function C(e, t, n, r, i, a, o) {
	e.forEach((e, s) => {
		let l = g(t, s, o);
		if (!F(e)) {
			i.push({
				severity: "error",
				path: l,
				message: "Layer must be an object"
			});
			return;
		}
		let u = e;
		L(u, u.type === "style" ? [
			...c.layer,
			"attribution",
			"version"
		] : c.layer, l, a), typeof u.id != "string" || u.id.length === 0 ? i.push({
			severity: "error",
			path: `${l}.id`,
			message: "Layer must have a non-empty string \"id\""
		}) : (r.has(u.id) && i.push({
			severity: "error",
			path: `${l}.id`,
			message: `Duplicate layer ID: "${u.id}"`
		}), r.add(u.id));
		let d = u.type;
		if (d === "allmaps") (typeof u.annotation != "string" || u.annotation.length === 0) && i.push({
			severity: "error",
			path: `${l}.annotation`,
			message: "Allmaps layer must have an \"annotation\" URL"
		});
		else if (d === "style") {
			if (Array.isArray(u.layers) && u.layers.length > 0) {
				let e = F(u.sources) ? Object.keys(u.sources) : [], t = e.length > 0 ? new Set([...n, ...e]) : n;
				w(u.layers, `${l}.layers`, t, i, a);
			}
		} else typeof d == "string" && f.includes(d) ? typeof u.source != "string" && d !== "background" && a.push({
			severity: "warning",
			path: `${l}.source`,
			message: "Standard layer should have a \"source\""
		}) : d !== void 0 && i.push({
			severity: "error",
			path: `${l}.type`,
			message: `Unknown layer type: "${d}"`
		});
	});
}
function w(e, t, n, r, i) {
	e.forEach((e, a) => {
		let o = `${t}[${a}]`;
		if (!F(e)) {
			r.push({
				severity: "error",
				path: o,
				message: "Style layer must be an object"
			});
			return;
		}
		let s = e;
		L(s, c.styleLayer, o, i), s.minZoom !== void 0 && r.push({
			severity: "error",
			path: `${o}.minZoom`,
			message: "\"minZoom\" is not supported; use \"minzoom\" (Mapbox/MapLibre style spec)"
		}), s.maxZoom !== void 0 && r.push({
			severity: "error",
			path: `${o}.maxZoom`,
			message: "\"maxZoom\" is not supported; use \"maxzoom\" (Mapbox/MapLibre style spec)"
		}), f.includes(s.type) || r.push({
			severity: "error",
			path: `${o}.type`,
			message: `Style layer "type" must be one of: ${f.join(", ")}`
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
function T(e, t, n, r, i) {
	e.forEach((e, a) => {
		E(e, `${t}[${a}]`, n, r, i);
	});
}
function E(e, t, n, r, i) {
	if (!F(e)) {
		r.push({
			severity: "error",
			path: t,
			message: "Tree node must be an object"
		});
		return;
	}
	let a = e;
	if (L(a, c.treeNode, t, i), a.separator === !0) {
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
		E(e, `${t}.children[${a}]`, n, r, i);
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
	}), a.selectionMode !== void 0 && !p.includes(a.selectionMode) && r.push({
		severity: "error",
		path: `${t}.selectionMode`,
		message: `"selectionMode" must be one of: ${p.join(", ")}`
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
function D(e, t, n, r, i) {
	if (!F(e)) {
		i.push({
			severity: "warning",
			path: t,
			message: "\"tools\" should be an object"
		});
		return;
	}
	Object.entries(e).forEach(([e, a]) => {
		let o = `${t}.${e}`;
		if (!F(a)) {
			i.push({
				severity: "warning",
				path: o,
				message: "Tool config should be an object"
			});
			return;
		}
		let l = a;
		if (l.enabled === void 0 ? i.push({
			severity: "warning",
			path: o,
			message: "Tool config is missing \"enabled\" property"
		}) : typeof l.enabled != "boolean" && i.push({
			severity: "warning",
			path: `${o}.enabled`,
			message: "\"enabled\" should be a boolean"
		}), M(l, o, i), l.type === "toolbar" ? j(l.items, `${o}.items`, i) : A(e, o, "section", i), Array.isArray(l.items) && l.items.forEach((e, t) => {
			if (!F(e)) return;
			let a = `${o}.items[${t}]`, s = e;
			if (M(s, a, i), s.type === "layerTree") {
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
				T(s.tree, `${a}.tree`, n, r, i);
			}
		}), e === "search" && (L(l, c.toolSearch, o, i), l.provider !== void 0 && (typeof l.provider == "string" ? s.has(l.provider.toLowerCase()) || i.push({
			severity: "warning",
			path: `${o}.provider`,
			message: `Unknown search provider "${l.provider}"`
		}) : i.push({
			severity: "warning",
			path: `${o}.provider`,
			message: "\"provider\" should be a string"
		})), l.attribution !== void 0 && typeof l.attribution != "string" && i.push({
			severity: "warning",
			path: `${o}.attribution`,
			message: "\"attribution\" should be a string"
		})), e === "insetMap" && (L(l, c.toolInsetMap, o, i), l.zoomOffset !== void 0 && (typeof l.zoomOffset != "number" || !Number.isFinite(l.zoomOffset)) && i.push({
			severity: "warning",
			path: `${o}.zoomOffset`,
			message: "\"zoomOffset\" should be a finite number"
		}), l.baseScale !== void 0 && (typeof l.baseScale != "number" || !Number.isFinite(l.baseScale) || l.baseScale <= 0) && i.push({
			severity: "warning",
			path: `${o}.baseScale`,
			message: "\"baseScale\" should be a positive finite number"
		}), l.styleUrl !== void 0 && typeof l.styleUrl != "string" && i.push({
			severity: "warning",
			path: `${o}.styleUrl`,
			message: "\"styleUrl\" should be a string"
		}), l.background !== void 0)) if (!F(l.background)) i.push({
			severity: "warning",
			path: `${o}.background`,
			message: "\"background\" should be an object"
		});
		else {
			let e = l.background;
			L(e, c.toolInsetMapBackground, `${o}.background`, i), e.service !== "xyz" && i.push({
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
function O(e, t) {
	let n = o(e);
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
function k(e, t) {
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
function A(e, a, o, s) {
	let c = n(e), l = i[c] !== void 0, u = t[c] !== void 0, d = !l && !u && r.has(c);
	if (!(l || d) && !(o === "section" && u)) {
		if (o === "item" && u) {
			s.push({
				severity: "warning",
				path: a,
				message: `"${e}" is a standalone map control, so it needs its own "tools" section rather than a toolbar item — it will not appear`
			});
			return;
		}
		s.push({
			severity: "warning",
			path: a,
			message: `Unknown tool "${e}" — either a typo, or a tool this version of webmapx does not have; it will be skipped`
		});
	}
}
function j(t, r, i) {
	Array.isArray(t) && t.forEach((t, a) => {
		if (!F(t)) return;
		let o = `${r}[${a}]`, s = t, c = s.type;
		if (c === void 0) {
			i.push({
				severity: "warning",
				path: `${o}.type`,
				message: "Toolbar item is missing \"type\", which is what decides the tool it builds — it will be skipped"
			});
			return;
		}
		if (typeof c != "string") {
			i.push({
				severity: "warning",
				path: `${o}.type`,
				message: "\"type\" should be a string"
			});
			return;
		}
		if (e.has(n(c))) {
			j(s.items, `${o}.items`, i);
			return;
		}
		A(c, `${o}.type`, "item", i);
	});
}
function M(e, t, n) {
	e.label !== void 0 && typeof e.label != "string" && n.push({
		severity: "warning",
		path: `${t}.label`,
		message: "\"label\" should be a string"
	}), e.title !== void 0 && typeof e.title != "string" && n.push({
		severity: "warning",
		path: `${t}.title`,
		message: "\"title\" should be a string"
	}), N(e.icon, `${t}.icon`, n);
}
function N(e, t, n) {
	if (e === void 0) return;
	if (typeof e == "string") {
		e.trim().length === 0 && n.push({
			severity: "warning",
			path: t,
			message: "\"icon\" should not be an empty string"
		});
		return;
	}
	if (!F(e)) {
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
function P(e, t, n, r) {
	let i = "stories";
	if (!F(e)) {
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
		if (!F(e)) {
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
			if (!F(e)) {
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
				if (!F(e)) {
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
				if (!F(s)) {
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
				(!F(c) || !I(c.center) || typeof c.zoom != "number") && n.push({
					severity: "error",
					path: `${o}.state.view`,
					message: "\"state.view\" must be { center: [lng, lat], zoom, bearing?, pitch? }"
				});
			});
		});
	});
}
function F(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function I(e) {
	if (!Array.isArray(e) || e.length !== 2) return !1;
	let [t, n] = e;
	return typeof t == "number" && typeof n == "number" && t >= -180 && t <= 180 && n >= -90 && n <= 90;
}
function L(e, t, n, r) {
	Object.keys(e).forEach((e) => {
		t.includes(e) || r.push({
			severity: "warning",
			path: n ? `${n}.${e}` : e,
			message: `Unknown key "${e}"`
		});
	});
}
//#endregion
export { a as n, o as r, m as t };
