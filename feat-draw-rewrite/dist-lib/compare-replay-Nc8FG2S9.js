//#region src/utils/compare-replay.ts
var e = "compare-reference", t = "data-compare-split";
function n(n) {
	let r = n.querySelector(`:scope > webmapx-map[data-webmapx-role="${e}"]`), i = r?.adapter;
	if (!r || !i) return null;
	let a = Number(r.getAttribute(t));
	return {
		element: r,
		adapter: i,
		split: Number.isFinite(a) ? a : 50
	};
}
async function r(t, n, r, s) {
	let u = s?.replayLiveMap !== !1, p = t.config;
	if (!p) return null;
	let m = document.createElement("webmapx-map");
	m.id = `${t.id || "map"}-compare-reference`, m.dataset.webmapxRole = e, m.setAttribute("adapter", n.engineId), m.style.position = "absolute", m.style.inset = "0", m.style.pointerEvents = "none";
	let h = r.querySelector(":scope > webmapx-layout");
	r.insertBefore(m, h);
	let g = await m.getAdapterAsync();
	if (!g) return m.remove(), null;
	if (u && i(n, g), m.setConfig(p), g.initialize(m.id, a(p, n)), await m.whenLayersReady(), u) {
		let e = await c(t, m);
		o(n, g);
		for (let t of e) await m.addLayerRequest(t.request, t.fallback, t.options);
		l(n, g), d(n, g);
	} else f(n, g);
	return {
		element: m,
		adapter: g
	};
}
function i(e, t) {
	let { mapTime: n, deepTimeMa: r } = e.store.getState();
	n && n.mode === "pinned" && t.store.dispatch({ mapTime: n }, "INIT"), typeof r == "number" && t.store.dispatch({ deepTimeMa: r }, "INIT");
}
function a(e, t) {
	let n = e.map ?? {}, r = t.getViewportState(), i = e.runtimeMap;
	return {
		center: r.center,
		zoom: r.zoom,
		minZoom: i?.minZoom ?? n.minZoom,
		maxZoom: i?.maxZoom ?? n.maxZoom,
		minPitch: i?.minPitch ?? n.minPitch,
		maxPitch: i?.maxPitch ?? n.maxPitch,
		maxBounds: i?.maxBounds,
		style: n.style,
		backgroundColor: n.backgroundColor,
		projection: t.getProjection()?.name ?? n.projection
	};
}
function o(e, t) {
	let n = e.store.getState().mapLayers ?? {};
	for (let r of s(n)) {
		let n = e.getSourceData(r);
		if (!n || typeof n == "string") continue;
		if (t.getSource(r)) {
			t.setSourceData(r, n);
			continue;
		}
		let i = e.getSourceConfig(r);
		t.addSource(r, {
			type: "geojson",
			...i ?? {},
			data: n
		});
	}
}
function s(e) {
	let t = /* @__PURE__ */ new Set();
	for (let [n, r] of Object.entries(e)) {
		let e = r;
		typeof e.sourceId == "string" && t.add(e.sourceId);
		let i = Array.isArray(e.sublayers) ? e.sublayers : [];
		for (let e of i) typeof e.source == "string" && t.add(`${n}:${e.source}`);
	}
	return [...t];
}
async function c(e, t) {
	let n = [];
	for (let r of e.runtimeLayerRequests) await t.addLayerRequest(r.request, r.fallback, r.options) || n.push(r);
	return n;
}
function l(e, t) {
	let n = e.store.getState().mapLayers ?? {}, r = t.store.getState().mapLayers ?? {}, i = Object.keys(n).filter((e) => r[e]), a = null;
	for (let e of i) {
		let r = n[e];
		r.visible === !1 && t.setLayerVisibility(e, !1);
		let i = typeof r.transparency == "number" ? r.transparency : 0;
		i > 0 && t.setLayerOpacity(e, (100 - i) / 100), u(t, e, r), a && t.moveLayer(e, null), a = e;
	}
}
function u(e, t, n) {
	let r = Array.isArray(n.sublayers) ? n.sublayers : null;
	if (r) {
		for (let n of r) {
			let r = n.paint, i = typeof n.id == "string" ? n.id : null;
			r && i && Object.keys(r).length > 0 && e.updateLayerStyle(t, i, r);
		}
		return;
	}
	let i = n.paint;
	i && Object.keys(i).length > 0 && e.updateLayerStyle(t, t, i);
}
function d(e, t) {
	let n = e.getProjection();
	n && t.setProjection(n), e.isTerrainEnabled() === !0 && t.setTerrainEnabled(!0), f(e, t);
}
function f(e, t) {
	let { center: n, zoom: r, bearing: i, pitch: a } = e.getViewportState();
	t.setViewport(n, r, { animate: !1 }), t.setBearing(i), t.setPitch(a);
}
//#endregion
export { f as i, r as n, n as r, t };
