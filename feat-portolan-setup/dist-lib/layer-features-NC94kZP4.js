//#region src/utils/layer-features.ts
function e(e, t) {
	if (!t || !e) return !1;
	let n = e.getSourceConfig(t)?.type;
	return typeof n == "string" && n !== "geojson";
}
async function t(t, n, r = {}) {
	let i = r.sourceData;
	if (i && typeof i == "object" && Array.isArray(i.features)) return {
		features: i.features,
		complete: !0
	};
	if (!t?.queryLayerFeatures) return {
		features: null,
		complete: !1
	};
	let a = !e(t, r.sourceId);
	try {
		return {
			features: (await t.queryLayerFeatures(n, r.sourceLayer ? { sourceLayer: r.sourceLayer } : void 0))?.features ?? null,
			complete: a
		};
	} catch {
		return {
			features: null,
			complete: a
		};
	}
}
//#endregion
export { t as n, e as t };
