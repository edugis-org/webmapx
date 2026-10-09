//#region src/utils/layer-transparency.ts
function e(e, t, n) {
	let r = e.store.getState().mapLayers, i = r[t], a = i;
	if (a?.layerType === "hillshade") {
		i && e.store.dispatch({ mapLayers: {
			...r,
			[t]: {
				...i,
				transparency: n
			}
		} }, "UI");
		let o = (a?.sublayers)?.find((e) => e?.type === "hillshade")?.id ?? t;
		e.updateLayerStyle(t, o, { "hillshade-exaggeration": (100 - n) / 100 });
	} else e.setLayerOpacity(t, (100 - n) / 100);
}
//#endregion
export { e as t };
