//#region src/utils/permalink-state.ts
var e = "webmapx-terrain-hillshade";
function t(t) {
	let n = t.store.getState(), r = n.mapLayers ?? {}, i = Object.keys(r), a = i.filter((e) => r[e]?.visible === !1), o = /* @__PURE__ */ new Map();
	for (let [e, t] of Object.entries(r)) typeof t.transparency == "number" && t.transparency !== 0 && o.set(e, t.transparency);
	let s = t.isTerrainEnabled?.() === !0, c = (e) => {
		let t = r[e]?.ownerTool;
		return typeof t == "string" && t.length > 0 ? t : null;
	}, l = {};
	for (let [e, t] of Object.entries(n.toolStates ?? {})) t && typeof t == "object" && (l[e] = t);
	let u = i.filter((e) => c(e) === null), d = s ? u.filter((t) => t !== e) : u, f = n.mapTime, p = f?.mode === "pinned" ? {
		at: f.at,
		play: n.mapTimePlay ?? null
	} : null;
	return {
		layerIds: d,
		hiddenLayerIds: a.filter((e) => e !== "webmapx-terrain-hillshade" && c(e) === null),
		viewport: t.getViewportState(),
		transparencyOverrides: o,
		projection: t.getProjection?.()?.name ?? null,
		terrainEnabled: s,
		time: p,
		dynamicLayerIds: u.filter((e) => r[e]?.dynamic === !0),
		tools: l
	};
}
//#endregion
export { t as n, e as t };
