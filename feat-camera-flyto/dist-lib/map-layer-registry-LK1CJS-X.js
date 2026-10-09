//#region src/map/map-layer-registry.ts
function e(e, t) {
	let n = t?.metadata && typeof t.metadata == "object" ? { ...t.metadata } : {}, r = typeof n.mapLayerId == "string" ? n.mapLayerId : typeof t?.id == "string" ? t.id : null;
	if (!r) return;
	if (delete n.mapLayerId, (typeof n.label != "string" || n.label.length === 0) && (typeof t?.title == "string" && t.title.length > 0 ? n.label = t.title : n.label = r), typeof t?.source == "string" && typeof n.sourceId != "string" && (n.sourceId = t.source), typeof t?.type == "string" && typeof n.layerType != "string" && (n.layerType = t.type), typeof t?.["source-layer"] == "string" && typeof n.sourceLayer != "string" && (n.sourceLayer = t["source-layer"]), t?.paint && typeof t.paint == "object" && !n.paint && (n.paint = t.paint), t?.layout && typeof t.layout == "object" && !n.layout && (n.layout = t.layout), typeof t?.minzoom == "number" && typeof n.minzoom != "number" && (n.minzoom = t.minzoom), typeof t?.maxzoom == "number" && typeof n.maxzoom != "number" && (n.maxzoom = t.maxzoom), t?.sources && typeof t.sources == "object") for (let [e, i] of Object.entries(t.sources)) {
		let t = i;
		if (t?.type === "geojson" && t?.data && typeof t.data == "object") {
			n.sourceData ||= t.data, typeof n.sourceId != "string" && (n.sourceId = `${r}:${e}`);
			break;
		}
	}
	if (typeof n.attribution != "string" && t?.sources && typeof t.sources == "object") for (let e of Object.values(t.sources)) {
		let t = e;
		if (typeof t?.attribution == "string" && t.attribution) {
			n.attribution = t.attribution;
			break;
		}
	}
	if (t?.type === "style" && Array.isArray(t.layers) && t.layers.length > 0) {
		let e = t.layers.find((e) => e?.type && e.type !== "background") ?? t.layers[0];
		e?.type && (n.layerType = e.type), e?.paint && typeof e.paint == "object" && !n.paint && (n.paint = e.paint), n.sublayers ||= t.layers;
	}
	let i = e.getState().mapLayers ?? {}, a = i[r] ?? {}, o = r in i;
	e.dispatch({ mapLayers: {
		...i,
		[r]: {
			...a,
			...n,
			hideFromLegend: o ? a.hideFromLegend : n.hideFromLegend,
			label: typeof a.label == "string" && a.label.length > 0 ? a.label : n.label,
			legendRole: a.legendRole ?? n.legendRole,
			sourceId: a.sourceId ?? n.sourceId,
			layerType: n.layerType ?? a.layerType,
			sourceLayer: n.sourceLayer ?? a.sourceLayer,
			sublayers: n.sublayers ?? a.sublayers,
			sourceData: n.sourceData ?? a.sourceData,
			attribution: n.attribution ?? a.attribution,
			minzoom: n.minzoom ?? a.minzoom,
			maxzoom: n.maxzoom ?? a.maxzoom
		}
	} }, "MAP");
}
function t(e, t, n) {
	let r = e.getState().mapLayers ?? {};
	if (!(t in r)) return;
	let i = Object.keys(r).filter((e) => e !== t), a = i.length;
	if (n) {
		let e = i.indexOf(n);
		e !== -1 && (a = e);
	}
	i.splice(a, 0, t);
	let o = {};
	for (let e of i) o[e] = r[e];
	e.dispatch({ mapLayers: o }, "MAP");
}
function n(e, t) {
	let n = e.getState().mapLayers ?? {};
	if (!(t in n)) return;
	let { [t]: r, ...i } = n;
	e.dispatch({ mapLayers: i }, "MAP");
}
//#endregion
export { t as n, n as r, e as t };
