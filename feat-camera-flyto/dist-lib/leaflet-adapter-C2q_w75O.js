import { t as e } from "./default-paint-EDDI8yhT.js";
import { t } from "./wms-feature-info-BjPjL6VU.js";
import { a as n, i as r, n as i, o as a, r as o, t as s } from "./deferred-query-service-B6zKgrLz.js";
import { a as c, i as l, n as u, o as d, r as f, s as p } from "./marker-utils-DPLjunnY.js";
import { t as m } from "./label-placement-Cef3mQiN.js";
import * as h from "leaflet";
import { version as g } from "leaflet";
//#region src/map/leaflet-services/label-collision.ts
var _ = /* @__PURE__ */ new WeakMap(), v = /* @__PURE__ */ new WeakMap();
function y(e) {
	let t = _.get(e);
	if (!t) return;
	let n = [];
	for (let e of t) e.eachLayer((e) => {
		let t = e._icon, r = t?.querySelector("span");
		!t || !r || n.push({
			el: t,
			measureEl: r,
			sortKey: e._webmapxSortKey ?? 0
		});
	});
	let r = m(n.map(({ el: e, measureEl: t, sortKey: n }) => ({
		item: e,
		sortKey: n,
		box: t.getBoundingClientRect()
	})));
	for (let { el: e } of n) e.style.visibility = r.has(e) ? "visible" : "hidden";
}
function b(e, t) {
	let n = _.get(t);
	n || (n = /* @__PURE__ */ new Set(), _.set(t, n)), n.add(e);
	let r = v.get(t);
	r || (r = () => y(t), v.set(t, r), t.on("zoomend moveend", r));
	let i = r;
	e.on("add", i), e.on("remove", () => {
		n.delete(e), n.size === 0 ? (t.off("zoomend moveend", i), v.delete(t), _.delete(t)) : i();
	});
}
//#endregion
//#region src/map/leaflet-services/LeafletLayerFactory.ts
if (typeof document < "u" && typeof document.getElementById == "function" && !document.getElementById("webmapx-symbol-label-style")) {
	let e = document.createElement("style");
	e.id = "webmapx-symbol-label-style", e.textContent = ".webmapx-symbol-label { background: none; border: none; }", document.head.appendChild(e);
}
function x(e) {
	return e.replace(/[&<>"']/g, (e) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;"
	})[e]);
}
function S(e) {
	let t = h.CRS.EPSG3857.project(e.getSouthWest()), n = h.CRS.EPSG3857.project(e.getNorthEast());
	return [
		t.x,
		t.y,
		n.x,
		n.y
	].join(",");
}
var C = h.TileLayer.extend({ getTileUrl(e) {
	let t = this._tileCoordsToBounds(e);
	return this._url.replace("{bbox-epsg-3857}", S(t));
} }), w = class t {
	static createXYZLayer(e, t, n) {
		if (t.type !== "raster" || t.service !== "xyz") return null;
		let r = Array.isArray(t.url) ? t.url[0] : t.url, i = t.tileSize || 256, a = {
			attribution: t.attribution,
			tileSize: i,
			zoomOffset: i === 512 ? -1 : 0,
			minZoom: t.minzoom,
			maxNativeZoom: t.maxzoom,
			...n ? { pane: n } : {}
		}, o = r.includes("{bbox-epsg-3857}") ? new C(r, a) : h.tileLayer(r, a);
		return {
			id: `${e}-raster-xyz`,
			type: "raster",
			layer: o
		};
	}
	static createWMSLayer(e, t, n) {
		if (t.type !== "raster" || t.service !== "wms") return null;
		let r = t, i = Array.isArray(r.url) ? r.url[0] : r.url;
		if (i.includes("{bbox-epsg-3857}")) {
			let t = new C(i, {
				attribution: r.attribution,
				minZoom: r.minzoom,
				maxNativeZoom: r.maxzoom,
				...n ? { pane: n } : {}
			});
			return {
				id: `${e}-raster-wms`,
				type: "raster",
				layer: t
			};
		}
		let a = (() => {
			let e = i.split("?")[1];
			if (e) return new URLSearchParams(e).get("layers") ?? new URLSearchParams(e).get("LAYERS") ?? void 0;
		})(), o = h.tileLayer.wms(i, {
			layers: r.layers || a || "",
			styles: r.styles || "",
			format: r.format || "image/png",
			transparent: r.transparent ?? !0,
			version: r.version || "1.1.1",
			crs: r.crs === "EPSG:4326" ? h.CRS.EPSG4326 : h.CRS.EPSG3857,
			attribution: r.attribution,
			minZoom: r.minzoom,
			maxNativeZoom: r.maxzoom,
			...n ? { pane: n } : {}
		});
		return {
			id: `${e}-raster-wms`,
			type: "raster",
			layer: o
		};
	}
	static createGeoJSONLayer(e, n, r, i, a, o) {
		let s = [], l = a ? { pane: a } : {};
		for (let n of i) {
			if (![
				"fill",
				"line",
				"circle",
				"symbol"
			].includes(n.type)) continue;
			let i = t.createFilterFunction(n.filter), a = h.geoJSON(r, {
				style: (e) => t.convertPaintToLeafletStyle(n, e),
				pointToLayer: (e, r) => {
					if (n.type === "circle") {
						let i = t.resolveNumberExpression(n.paint?.["circle-radius"], e, 6);
						return h.circleMarker(r, {
							radius: i,
							...t.convertPaintToLeafletStyle(n, e),
							interactive: !0,
							...l
						});
					}
					if (n.type === "symbol") {
						let i = h.marker(r, {
							icon: t.createTextLabelIcon(n, e),
							interactive: !1,
							...l
						});
						return i._webmapxSortKey = c(n.layout?.["symbol-sort-key"], e ?? { properties: {} }, 0, 0), i;
					}
					return h.marker(r, {
						opacity: 0,
						interactive: !1,
						...l
					});
				},
				filter: i,
				interactive: !0,
				...l
			}), u = n.id ? `${e}-${n.id}` : `${e}-${n.type}-${s.length}`;
			s.push({
				id: u,
				type: "geojson",
				layer: a
			}), n.type === "symbol" && o && b(a, o);
		}
		return s;
	}
	static createTextLabelIcon(e, t) {
		let n = t ?? { properties: {} }, r = e.layout || {}, i = e.paint || {}, a = d(r["text-field"], n, 0, ""), o = l(i["text-color"], n, 0, "#000"), s = l(i["text-halo-color"], n, 0, "transparent"), u = c(i["text-halo-width"], n, 0, 0), f = `<span style="color:${o};font-size:${c(r["text-size"], n, 0, 12)}px;text-shadow:${u > 0 ? [
			[-1, -1],
			[1, -1],
			[-1, 1],
			[1, 1]
		].map(([e, t]) => `${e * u}px ${t * u}px 0 ${s}`).join(", ") : "none"};white-space:nowrap;">${x(a)}</span>`;
		return h.divIcon({
			className: "webmapx-symbol-label",
			html: f,
			iconSize: [0, 0]
		});
	}
	static createFilterFunction(e) {
		if (!(!e || !Array.isArray(e))) return (t) => p(e, t);
	}
	static resolveNumberExpression(e, t, n) {
		return c(e, t ?? { properties: {} }, 0, n);
	}
	static resolveColorExpression(e, t, n) {
		return l(e, t ?? { properties: {} }, 0, n);
	}
	static convertPaintToLeafletStyle(t, n) {
		let r = t.paint || {}, i = n ?? { properties: {} }, a = {};
		switch (t.type) {
			case "fill":
				a.fillColor = l(r["fill-color"], i, 0, e), a.fillOpacity = c(r["fill-opacity"], i, 0, .5), a.color = l(r["fill-outline-color"], i, 0, a.fillColor), a.weight = 1, a.opacity = 1;
				break;
			case "line":
				a.color = l(r["line-color"], i, 0, e), a.weight = c(r["line-width"], i, 0, 3), a.opacity = c(r["line-opacity"], i, 0, 1), a.fill = !1, r["line-dasharray"] && (a.dashArray = Array.isArray(r["line-dasharray"]) ? r["line-dasharray"].join(" ") : r["line-dasharray"]);
				break;
			case "circle":
				a.fillColor = l(r["circle-color"], i, 0, e), a.fillOpacity = c(r["circle-opacity"], i, 0, 1), a.color = l(r["circle-stroke-color"], i, 0, a.fillColor), a.weight = c(r["circle-stroke-width"], i, 0, 1), a.opacity = c(r["circle-stroke-opacity"], i, 0, 1);
				break;
		}
		return a;
	}
}, T = 1, E = class {
	constructor(e, t) {
		this.store = e, this.eventBus = t, this.layerOrderRegistry = null, this.mapInstance = null, this.mapReadyCallbacks = [], this.silentSourceIds = /* @__PURE__ */ new Set(), this.sources = /* @__PURE__ */ new Map(), this.geoJSONData = /* @__PURE__ */ new Map(), this.logicalToNative = /* @__PURE__ */ new Map(), this.sourceToLayers = /* @__PURE__ */ new Map(), this.runtimeLayerOrder = [], this.runtimeLayerZoomRange = /* @__PURE__ */ new Map(), this.initialConfig = {
			center: [51.17, 10.45],
			zoom: 4
		};
	}
	setLayerOrderRegistry(e) {
		this.layerOrderRegistry = e;
	}
	applyZIndexIsolation(e) {
		e.style.isolation = "isolate", e.style.zIndex = "0", e.style.position = "relative";
	}
	injectLeafletCSSFixes() {
		let e = "webmapx-leaflet-fixes";
		if (document.getElementById(e)) return;
		let t = document.createElement("style");
		t.id = e, t.textContent = "\n            .leaflet-container { background: var(--webmapx-map-background, #f2efe9); }\n            .leaflet-tile-pane { background: var(--webmapx-map-background, #f2efe9); }\n            .leaflet-container img.leaflet-tile { mix-blend-mode: normal; }\n        ", document.head.appendChild(t);
	}
	getViewportState() {
		if (this.mapInstance) {
			let e = this.mapInstance.getCenter(), t = this.mapInstance.getZoom() - T;
			return {
				center: [e.lng, e.lat],
				zoom: t,
				bearing: 0,
				pitch: 0
			};
		}
		return {
			center: [0, 0],
			zoom: 1,
			bearing: 0,
			pitch: 0
		};
	}
	setViewport(e, t, n) {
		if (this.mapInstance) {
			let r = this.clampZoom(t), i = Math.round(r) + T;
			n?.animate === !1 || f() ? this.mapInstance.setView([e[1], e[0]], i, { animate: !1 }) : this.mapInstance.flyTo([e[1], e[0]], i), r !== t && this.scheduleViewportSync();
		}
	}
	initialize(e, t) {
		let n = t?.center ? [t.center[1], t.center[0]] : this.initialConfig.center, r = t?.zoom ?? this.initialConfig.zoom, i = Math.round(r) + T;
		this.minZoom = t?.minZoom, this.maxZoom = t?.maxZoom;
		let a = t?.minZoom === void 0 ? void 0 : Math.round(t.minZoom) + T, o = t?.maxZoom === void 0 ? void 0 : Math.round(t.maxZoom) + T, s = this.resolveContainer(e);
		s instanceof HTMLElement && this.applyZIndexIsolation(s), this.injectLeafletCSSFixes();
		let c = t?.maxBounds ? h.latLngBounds([t.maxBounds[1], t.maxBounds[0]], [t.maxBounds[3], t.maxBounds[2]]) : void 0;
		this.mapInstance = h.map(s, {
			center: n,
			zoom: i,
			minZoom: a,
			maxZoom: o,
			attributionControl: !1,
			zoomControl: !1,
			...c ? {
				maxBounds: c,
				maxBoundsViscosity: 1
			} : {}
		}), c && this.applyMaxBoundsZoomFloor(this.mapInstance, c, a), this.flushMapReadyCallbacks(), this.setupBaseLayers(t), this.setupMapEvents(this.mapInstance, r, n);
	}
	applyMaxBoundsZoomFloor(e, t, n) {
		let r = () => {
			let r = e.getBoundsZoom(t, !0);
			e.setMinZoom(Math.max(r, n ?? -Infinity));
		};
		e.whenReady(r), e.on("resize", r);
	}
	setupBaseLayers(e) {
		if (e?.style?.sources) for (let t of Object.values(e.style.sources)) t.type === "raster" && t.tiles?.length && h.tileLayer(t.tiles[0], {
			attribution: t.attribution || "",
			tileSize: t.tileSize || 256,
			minZoom: t.minzoom,
			maxNativeZoom: t.maxzoom
		}).addTo(this.mapInstance);
		else e?.styleUrl && (async () => {
			await this.loadStyleFromUrl(e.styleUrl);
		})();
	}
	setupMapEvents(e, t, n) {
		e.whenReady(() => {
			this.store.dispatch({
				mapLoaded: !0,
				zoomLevel: t,
				mapCenter: [n[1], n[0]],
				mapViewportBounds: this.buildViewportFeature()
			}, "MAP");
		}), e.on("loading", () => this.store.dispatch({ mapBusy: !0 }, "MAP")), e.on("load", () => this.store.dispatch({ mapBusy: !1 }, "MAP")), e.on("zoomend", () => {
			let t = e.getZoom() - T;
			this.applyRuntimeLayerVisibility(), this.store.dispatch({
				zoomLevel: t,
				mapViewportBounds: this.buildViewportFeature()
			}, "MAP"), this.eventBus?.emit({
				type: "zoom-end",
				zoom: t
			});
		}), e.on("moveend", () => {
			let t = e.getCenter(), n = e.getZoom() - T;
			this.store.dispatch({
				mapCenter: [t.lng, t.lat],
				zoomLevel: n,
				mapViewportBounds: this.buildViewportFeature()
			}, "MAP"), this.emitViewChangeEnd();
		}), e.on("move", () => {
			this.dispatchViewportBoundsSnapshot(), this.emitViewChange();
		}), this.attachPointerEvents(e);
	}
	attachPointerEvents(e) {
		e.on("mousemove", (e) => this.emitPointerEvent("pointer-move", e)), e.on("mousedown", (e) => {
			let t = [e.latlng.lng, e.latlng.lat], n = [e.layerPoint.x, e.layerPoint.y];
			this.eventBus?.emit({
				type: "pointer-down",
				coords: t,
				pixel: n,
				button: e.originalEvent.button,
				originalEvent: e.originalEvent
			});
		}), e.on("mouseup", (e) => {
			let t = [e.latlng.lng, e.latlng.lat], n = [e.layerPoint.x, e.layerPoint.y];
			this.eventBus?.emit({
				type: "pointer-up",
				coords: t,
				pixel: n,
				button: e.originalEvent.button,
				originalEvent: e.originalEvent
			});
		});
		let t = e.getContainer(), n = (n) => {
			let r = t.getBoundingClientRect(), i = h.point(n.clientX - r.left, n.clientY - r.top), a = e.containerPointToLatLng(i), o = [i.x, i.y];
			return {
				coords: [a.lng, a.lat],
				pixel: o
			};
		};
		t.addEventListener("pointermove", (e) => {
			if (e.pointerType === "mouse") return;
			let t = n(e);
			t && this.eventBus?.emit({
				type: "pointer-move",
				coords: t.coords,
				pixel: t.pixel,
				resolution: null,
				originalEvent: e
			});
		}), t.addEventListener("pointerdown", (e) => {
			if (e.pointerType === "mouse") return;
			let t = n(e);
			t && this.eventBus?.emit({
				type: "pointer-down",
				coords: t.coords,
				pixel: t.pixel,
				button: 0,
				originalEvent: e
			});
		}), t.addEventListener("pointerup", (e) => {
			if (e.pointerType === "mouse") return;
			let t = n(e);
			t && this.eventBus?.emit({
				type: "pointer-up",
				coords: t.coords,
				pixel: t.pixel,
				button: 0,
				originalEvent: e
			});
		}), t.addEventListener("pointercancel", () => {
			this.eventBus?.emit({ type: "pointer-cancel" });
		}), e.on("mouseout", (e) => {
			this.eventBus?.emit({
				type: "pointer-leave",
				originalEvent: e.originalEvent
			}), this.store.dispatch({
				pointerCoordinates: null,
				pointerResolution: null
			}, "MAP");
		}), e.on("click", (e) => this.emitPointerEvent("click", e, !0)), e.on("dblclick", (e) => this.emitPointerEvent("dblclick", e)), e.on("contextmenu", (e) => this.emitPointerEvent("contextmenu", e));
	}
	emitPointerEvent(e, t, n = !1) {
		let r = [t.latlng.lng, t.latlng.lat], i = [t.layerPoint.x, t.layerPoint.y], a = this.computePointerResolution(t), o = {
			type: e,
			coords: r,
			pixel: i,
			resolution: a,
			originalEvent: t.originalEvent
		};
		this.eventBus?.emit(o), n && this.store.dispatch({
			lastClickedCoordinates: r,
			lastClickedResolution: a
		}, "MAP"), e === "pointer-move" && this.store.dispatch({
			pointerCoordinates: r,
			pointerResolution: a
		}, "MAP");
	}
	project(e) {
		if (!this.mapInstance) return console.warn("[CORE SERVICE - Leaflet] project called before map instance is ready."), [0, 0];
		let t = h.latLng(e[1], e[0]), n = this.mapInstance.latLngToContainerPoint(t);
		return [n.x, n.y];
	}
	unproject(e) {
		if (!this.mapInstance) return null;
		let t = this.mapInstance.containerPointToLatLng({
			x: e[0],
			y: e[1]
		});
		return t ? [t.lng, t.lat] : null;
	}
	fitBounds(e) {
		if (!this.mapInstance) return;
		let t = h.latLng(e[1], e[0]), n = h.latLng(e[3], e[2]), r = h.latLngBounds(t, n);
		this.mapInstance.flyToBounds(r, {
			padding: [40, 40],
			duration: 3
		});
	}
	setCursor(e) {
		this.mapInstance && (this.mapInstance.getContainer().style.cursor = e);
	}
	setPanEnabled(e) {
		this.mapInstance && (e ? this.mapInstance.dragging.enable() : this.mapInstance.dragging.disable());
	}
	setTouchCaptureEnabled(e) {
		if (!this.mapInstance) return;
		let t = this.mapInstance.getContainer();
		t.style.touchAction = e ? "" : "none";
	}
	setDoubleClickZoomEnabled(e) {
		this.mapInstance && (e ? this.mapInstance.doubleClickZoom.enable() : this.mapInstance.doubleClickZoom.disable());
	}
	setLayerVisibility(e, t) {
		this.mapInstance && (this.logicalToNative.get(e) ?? []).forEach((e) => {
			t ? this.mapInstance.hasLayer(e) || this.mapInstance.addLayer(e) : this.mapInstance.hasLayer(e) && this.mapInstance.removeLayer(e);
		});
	}
	getSourceData(e) {
		let t = this.geoJSONData.get(e);
		if (t) return t;
		let n = this.sources.get(e);
		return !n || n.type !== "geojson" ? null : typeof n.data == "string" ? n.data : n.data && typeof n.data == "object" ? (this.geoJSONData.set(e, n.data), n.data) : null;
	}
	computePointerResolution(e) {
		if (!this.mapInstance || !e.layerPoint) return null;
		let { x: t, y: n } = e.layerPoint, r = this.mapInstance.layerPointToLatLng([t + 1, n]), i = this.mapInstance.layerPointToLatLng([t, n + 1]), a = Math.abs(r.lng - e.latlng.lng), o = Math.abs(i.lat - e.latlng.lat);
		return !isFinite(a) || !isFinite(o) ? null : {
			lng: Math.max(a, 1e-12),
			lat: Math.max(o, 1e-12)
		};
	}
	emitViewChange() {
		if (!this.eventBus || !this.mapInstance) return;
		let e = this.mapInstance.getCenter(), t = this.mapInstance.getBounds(), n = this.mapInstance.getZoom() - T;
		this.eventBus.emit({
			type: "view-change",
			center: [e.lng, e.lat],
			zoom: n,
			bearing: 0,
			pitch: 0,
			bounds: {
				sw: [t.getSouthWest().lng, t.getSouthWest().lat],
				ne: [t.getNorthEast().lng, t.getNorthEast().lat]
			}
		});
	}
	emitViewChangeEnd() {
		if (!this.eventBus || !this.mapInstance) return;
		let e = this.mapInstance.getCenter(), t = this.mapInstance.getBounds(), n = this.mapInstance.getZoom() - T;
		this.eventBus.emit({
			type: "view-change-end",
			center: [e.lng, e.lat],
			zoom: n,
			bearing: 0,
			pitch: 0,
			bounds: {
				sw: [t.getSouthWest().lng, t.getSouthWest().lat],
				ne: [t.getNorthEast().lng, t.getNorthEast().lat]
			}
		});
	}
	onMapReady(e) {
		this.mapInstance ? e(this.mapInstance) : this.mapReadyCallbacks.push(e);
	}
	setZoom(e) {
		if (!this.mapInstance) return;
		let t = this.clampZoom(e);
		if (this.mapInstance.getZoom() - T === t && t !== e) {
			this.scheduleViewportSync();
			return;
		}
		this.mapInstance.setZoom(Math.round(t) + T);
	}
	getZoom() {
		return this.mapInstance ? this.mapInstance.getZoom() - T : this.initialConfig.zoom;
	}
	getNavigationCapabilities() {
		return {
			bearing: !1,
			pitch: !1,
			keyboard: !0
		};
	}
	getBearing() {
		return 0;
	}
	setBearing(e) {}
	getPitch() {
		return 0;
	}
	setPitch(e) {}
	setTerrainEnabled(e) {
		return !1;
	}
	isTerrainEnabled() {
		return null;
	}
	resetNorth() {}
	resetNorthPitch() {
		this.resetNorth();
	}
	setProjection(e) {
		return !1;
	}
	getProjection() {
		return null;
	}
	scheduleViewportSync() {
		this.mapInstance && requestAnimationFrame(() => {
			if (!this.mapInstance) return;
			let e = this.mapInstance.getCenter(), t = this.mapInstance.getZoom() - T, n = this.buildViewportFeature();
			this.store.dispatch({
				mapCenter: [e.lng, e.lat],
				zoomLevel: t,
				mapViewportBounds: n
			}, "MAP"), this.emitViewChangeEnd();
		});
	}
	clampZoom(e) {
		let t = e;
		return this.minZoom !== void 0 && (t = Math.max(t, this.minZoom)), this.maxZoom !== void 0 && (t = Math.min(t, this.maxZoom)), t;
	}
	addLayer(e, t) {
		if (!this.mapInstance) return !1;
		let n = e.source;
		if (!n) return e?.addTo === "function" && e.addTo(this.mapInstance), !1;
		let r = this.sources.get(n);
		if (!r) return console.warn(`[CORE SERVICE] Source "${n}" not found for layer "${e.id}".`), !1;
		let i = this.geoJSONData.get(n) || r.data || {
			type: "FeatureCollection",
			features: []
		}, a = Array.isArray(e.layers) ? e.layers : [e], o = w.createGeoJSONLayer(e.id ?? e.source, r, i, a);
		this.runtimeLayerZoomRange.set(e.id, this.readLayerZoomRange(e));
		let s = [];
		for (let e of o) e.layer.addTo(this.mapInstance), s.push(e.layer);
		return this.removeRuntimeLayer(e.id), this.insertByOptions(this.runtimeLayerOrder, e.id, t) || this.runtimeLayerOrder.push(e.id), this.logicalToNative.set(e.id, s), this.layerOrderRegistry?.registerInlineLayer(e.id, s, t), this.applyRuntimeLayerVisibility(), this.sourceToLayers.has(n) || this.sourceToLayers.set(n, []), this.sourceToLayers.get(n).push(e.id), !0;
	}
	removeLayer(e) {
		let t = this.logicalToNative.get(e);
		if (t && this.mapInstance) {
			t.forEach((e) => this.mapInstance.removeLayer(e)), this.logicalToNative.delete(e), this.removeRuntimeLayer(e), this.runtimeLayerZoomRange.delete(e);
			for (let [t, n] of this.sourceToLayers.entries()) {
				let r = n.indexOf(e);
				if (r > -1) {
					n.splice(r, 1), n.length === 0 && this.sourceToLayers.delete(t);
					break;
				}
			}
			this.layerOrderRegistry?.unregisterInlineLayer(e), this.applyRuntimeLayerOrder();
		}
	}
	addSource(e, t) {
		this.sources.set(e, t), t?.type === "geojson" && t.data && typeof t.data == "object" && this.geoJSONData.set(e, t.data);
	}
	removeSource(e) {
		let t = this.sourceToLayers.get(e);
		t && t.forEach((e) => this.removeLayer(e)), this.sources.delete(e), this.geoJSONData.delete(e);
	}
	removeRuntimeLayer(e) {
		this.runtimeLayerOrder = this.runtimeLayerOrder.filter((t) => t !== e), this.runtimeLayerZoomRange.delete(e);
	}
	readLayerZoomRange(e) {
		return {
			minzoom: this.toNumericZoom(e?.minzoom ?? e?.minZoom),
			maxzoom: this.toNumericZoom(e?.maxzoom ?? e?.maxZoom)
		};
	}
	toNumericZoom(e) {
		return typeof e == "number" && isFinite(e) ? e : void 0;
	}
	isLayerVisibleAtZoom(e, t) {
		let n = this.runtimeLayerZoomRange.get(e);
		return n ? !(n.minzoom !== void 0 && t < n.minzoom || n.maxzoom !== void 0 && t >= n.maxzoom) : !0;
	}
	applyRuntimeLayerVisibility() {
		if (!this.mapInstance) return;
		let e = this.mapInstance.getZoom() - T;
		for (let t of this.runtimeLayerOrder) {
			let n = this.isLayerVisibleAtZoom(t, e), r = this.logicalToNative.get(t) ?? [];
			for (let e of r) n ? this.mapInstance.hasLayer(e) || e.addTo(this.mapInstance) : this.mapInstance.hasLayer(e) && this.mapInstance.removeLayer(e);
		}
		this.applyRuntimeLayerOrder();
	}
	insertByOptions(e, t, n) {
		let r = n?.beforeLayerId;
		if (typeof r == "string") {
			let n = e.indexOf(r);
			if (n >= 0) return e.splice(n, 0, t), !0;
		}
		let i = n?.afterLayerId;
		if (typeof i == "string") {
			let n = e.indexOf(i);
			if (n >= 0) return e.splice(n + 1, 0, t), !0;
		}
		return !1;
	}
	applyRuntimeLayerOrder() {
		if (this.mapInstance) for (let e of this.runtimeLayerOrder) {
			let t = this.logicalToNative.get(e) ?? [];
			for (let e of t) e.bringToFront?.();
		}
	}
	getSource(e) {
		if (this.sources.has(e)) return {
			id: e,
			setData: (t) => {
				this.geoJSONData.set(e, t);
				let n = this.sourceToLayers.get(e);
				if (n) for (let e of n) {
					let n = this.logicalToNative.get(e);
					n && n.forEach((e) => {
						"clearLayers" in e && "addData" in e && (e.clearLayers(), e.addData(t));
					});
				}
			}
		};
	}
	suppressBusySignalForSource(e) {
		this.silentSourceIds.add(e);
	}
	unsuppressBusySignalForSource(e) {
		this.silentSourceIds.delete(e);
	}
	dispatchViewportBoundsSnapshot() {
		let e = this.buildViewportFeature();
		this.store.dispatch({ mapViewportBounds: e }, "MAP");
	}
	buildViewportFeature() {
		if (!this.mapInstance) return null;
		let e = this.mapInstance.getBounds();
		if (!e) return null;
		let t = e.getSouthWest(), n = e.getNorthEast();
		return {
			type: "Feature",
			properties: { role: "mapViewport" },
			geometry: {
				type: "Polygon",
				coordinates: [[
					[t.lng, t.lat],
					[t.lng, n.lat],
					[n.lng, n.lat],
					[n.lng, t.lat],
					[t.lng, t.lat]
				]]
			}
		};
	}
	resolveContainer(e) {
		let t = document.getElementById(e);
		if (!t) return e;
		if (t.tagName.toLowerCase() === "webmapx-map") {
			let e = t.querySelector("[slot=\"map-view\"]");
			if (e) return e;
		}
		return t;
	}
	flushMapReadyCallbacks() {
		this.mapInstance && this.mapReadyCallbacks.splice(0).forEach((e) => {
			try {
				e(this.mapInstance);
			} catch (e) {
				console.error("[CORE SERVICE] mapReady callback failed.", e);
			}
		});
	}
	async loadStyleFromUrl(e) {
		if (!this.mapInstance) return !1;
		try {
			let t = await fetch(e);
			if (!t.ok) return !1;
			let n = await t.json(), r = 0;
			if (n.sources) for (let e of Object.values(n.sources)) e.type === "raster" && e.tiles?.length && (h.tileLayer(e.tiles[0], {
				attribution: e.attribution || "",
				tileSize: e.tileSize || 256,
				minZoom: e.minzoom,
				maxNativeZoom: e.maxzoom
			}).addTo(this.mapInstance), r++);
			return r > 0;
		} catch (e) {
			return console.error("[CORE SERVICE] Error loading style:", e), !1;
		}
	}
}, D = class {
	constructor(e) {
		this.leafletInstance = {}, this.leafletInstance = e;
	}
	setBufferRadius(e) {
		console.log(`[SERVICE TEMPLATE] Set buffer radius to ${e}km on Leaflet.`);
	}
	toggleTool() {
		console.log("[SERVICE TEMPLATE] Toggled buffer tool activation.");
	}
}, O = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", k = "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors", A = 1;
function j(e) {
	return e.endsWith(".json") || e.includes("/style");
}
var M = class {
	constructor(e, t) {
		this.id = e, this.layer = t;
	}
	setData(e) {
		this.layer.clearLayers(), this.layer.addData(e);
	}
}, N = class {
	constructor(e, t, n, r) {
		this.id = e, this.layer = t, this.source = n, this.map = r;
	}
	getSource() {
		return this.source;
	}
	remove() {
		this.map.removeLayer(this.layer);
	}
}, P = class {
	constructor(e) {
		this.map = e, this.sources = /* @__PURE__ */ new Map(), this.layers = /* @__PURE__ */ new Map(), this.geoJsonLayers = /* @__PURE__ */ new Map(), this.resizeObserver = null;
		let t = e.getContainer();
		this.resizeObserver = new ResizeObserver(() => {
			e.invalidateSize({ animate: !1 });
		}), this.resizeObserver.observe(t);
	}
	setViewport(e, t, n, r) {
		let i = Math.max(0, Math.round(t) + A);
		this.map.setView([e[1], e[0]], i, { animate: !1 });
	}
	createSource(e, t) {
		if (!this.sources.has(e)) {
			let n = h.geoJSON(t);
			this.geoJsonLayers.set(e, n);
			let r = new M(e, n);
			this.sources.set(e, r);
		}
		return this.sources.get(e);
	}
	getSource(e) {
		return this.sources.get(e) || null;
	}
	createLayer(e) {
		if (!this.layers.has(e.id)) {
			let t = this.geoJsonLayers.get(e.source);
			if (!t) throw Error(`Source ${e.source} not found for layer ${e.id}`);
			let n = this.toLeafletStyle(e);
			t.setStyle(n), t.addTo(this.map);
			let r = this.sources.get(e.source), i = new N(e.id, t, r, this.map);
			this.layers.set(e.id, i);
		}
		return this.layers.get(e.id);
	}
	getLayer(e) {
		return this.layers.get(e) || null;
	}
	onReady(e) {
		this.map.whenReady(() => {
			let t = () => {
				this.map.invalidateSize({ animate: !1 });
			};
			t(), setTimeout(t, 0), setTimeout(t, 50), setTimeout(() => {
				t(), e();
			}, 100);
		});
	}
	destroy() {
		this.resizeObserver &&= (this.resizeObserver.disconnect(), null), this.map.remove();
	}
	toLeafletStyle(e) {
		let t = {};
		if (e.paint) switch (e.type) {
			case "fill":
				"fill-color" in e.paint && (t.fillColor = e.paint["fill-color"]), "fill-opacity" in e.paint && (t.fillOpacity = e.paint["fill-opacity"]), t.stroke = !1;
				break;
			case "line":
				"line-color" in e.paint && (t.color = e.paint["line-color"]), "line-width" in e.paint && (t.weight = e.paint["line-width"]), "line-opacity" in e.paint && (t.opacity = e.paint["line-opacity"]), t.fill = !1;
				break;
			case "circle":
				"circle-color" in e.paint && (t.fillColor = e.paint["circle-color"]), "circle-opacity" in e.paint && (t.fillOpacity = e.paint["circle-opacity"]);
				break;
			case "symbol": break;
		}
		return t;
	}
}, F = class {
	constructor() {
		this.shadowStyleId = "webmapx-leaflet-shadow-styles";
	}
	createMap(e, t) {
		this.ensureLeafletShadowStyles(e);
		let n = {
			center: t?.center ? [t.center[1], t.center[0]] : [0, 0],
			zoom: Math.max(0, Math.round(t?.zoom ?? 1) + A),
			attributionControl: !1,
			zoomControl: !1,
			className: "leaflet-edge-buffered"
		}, r = h.map(e, n), i = Array.isArray(t?.tileUrls) && t.tileUrls.length > 0 ? t.tileUrls[0] : t?.tileUrl;
		return i ? h.tileLayer(i, {
			attribution: t?.tileAttribution ?? k,
			tileSize: t?.tileSize
		}).addTo(r) : t?.styleUrl && !j(t.styleUrl) ? h.tileLayer(t.styleUrl, { attribution: t.tileAttribution ?? k }).addTo(r) : h.tileLayer(O, { attribution: t?.tileAttribution ?? k }).addTo(r), t?.interactive === !1 && (r.dragging.disable(), r.touchZoom.disable(), r.doubleClickZoom.disable(), r.scrollWheelZoom.disable(), r.boxZoom.disable(), r.keyboard.disable(), r.tap && r.tap.disable()), new P(r);
	}
	ensureLeafletShadowStyles(e) {
		let t = e.getRootNode();
		if (!(t instanceof ShadowRoot) || t.querySelector(`#${this.shadowStyleId}`)) return;
		let n = document.createElement("style");
		n.id = this.shadowStyleId, n.textContent = "\n            .leaflet-pane,\n            .leaflet-tile,\n            .leaflet-marker-icon,\n            .leaflet-marker-shadow,\n            .leaflet-tile-container,\n            .leaflet-pane > svg,\n            .leaflet-pane > canvas,\n            .leaflet-zoom-box,\n            .leaflet-image-layer,\n            .leaflet-layer {\n                position: absolute;\n                left: 0;\n                top: 0;\n            }\n            .leaflet-container {\n                overflow: hidden;\n            }\n            .leaflet-container .leaflet-marker-pane img,\n            .leaflet-container .leaflet-shadow-pane img,\n            .leaflet-container .leaflet-tile-pane img,\n            .leaflet-container img.leaflet-image-layer,\n            .leaflet-container .leaflet-tile {\n                max-width: none !important;\n                max-height: none !important;\n                width: auto;\n                padding: 0;\n            }\n            .leaflet-container img.leaflet-tile {\n                mix-blend-mode: normal;\n            }\n            .leaflet-tile {\n                visibility: hidden;\n            }\n            .leaflet-tile-loaded {\n                visibility: inherit;\n            }\n            .leaflet-pane { z-index: 400; }\n            .leaflet-tile-pane { z-index: 200; }\n            .leaflet-overlay-pane { z-index: 400; }\n            .leaflet-shadow-pane { z-index: 500; }\n            .leaflet-marker-pane { z-index: 600; }\n            .leaflet-tooltip-pane { z-index: 650; }\n            .leaflet-popup-pane { z-index: 700; }\n            .leaflet-map-pane canvas { z-index: 100; }\n            .leaflet-map-pane svg { z-index: 200; }\n            .leaflet-zoom-animated {\n                transform-origin: 0 0;\n            }\n        ", t.appendChild(n);
	}
}, I = "warpedmap://", L = 300, R = class {
	constructor(e, t) {
		this.logicalToNative = /* @__PURE__ */ new Map(), this.logicalToWMSSource = /* @__PURE__ */ new Map(), this.nativeLayerInstances = /* @__PURE__ */ new Map(), this.nativeLayerToSource = /* @__PURE__ */ new Map(), this.warpedMapLayers = /* @__PURE__ */ new Map(), this.compositeSubLayerCache = /* @__PURE__ */ new Map(), this.sourceIdCounter = 0, this.busyOps = 0, this.logicalOrder = [], this.layerPanes = /* @__PURE__ */ new Map(), this.map = e, this.store = t;
	}
	beginBusyOperation() {
		this.busyOps += 1, this.busyOps === 1 && this.store.dispatch({ mapBusy: !0 }, "MAP");
	}
	endBusyOperation() {
		if (this.busyOps <= 0) {
			this.busyOps = 0, this.store.dispatch({ mapBusy: !1 }, "MAP");
			return;
		}
		--this.busyOps, this.busyOps === 0 && this.store.dispatch({ mapBusy: !1 }, "MAP");
	}
	attachTileBusyEvents(e) {
		let t = e;
		typeof t.on == "function" && (t.__webmapxBusyBound || (t.__webmapxBusyBound = !0, t.on("loading", () => this.beginBusyOperation()), t.on("load", () => this.endBusyOperation()), t.on("tileerror", () => this.endBusyOperation())));
	}
	resolveInsertIndex(e) {
		if (e?.beforeLayerId) {
			let t = this.logicalOrder.indexOf(e.beforeLayerId);
			if (t >= 0) return t;
		}
		if (e?.afterLayerId) {
			let t = this.logicalOrder.indexOf(e.afterLayerId);
			if (t >= 0) return t + 1;
		}
	}
	upsertLogicalOrder(e, t) {
		if (this.logicalOrder = this.logicalOrder.filter((t) => t !== e), typeof t != "number" || !Number.isFinite(t)) {
			this.logicalOrder.push(e);
			return;
		}
		let n = Math.max(0, Math.min(t, this.logicalOrder.length));
		this.logicalOrder.splice(n, 0, e);
	}
	ensurePane(e) {
		let t = this.layerPanes.get(e);
		if (t) return t;
		let n = `webmapx-${e.replace(/[^a-zA-Z0-9_-]/g, "-")}`, r = n, i = 1;
		for (; this.map.getPane(r);) r = `${n}-${i++}`;
		return this.map.createPane(r), this.layerPanes.set(e, r), r;
	}
	removePane(e) {
		let t = this.layerPanes.get(e);
		if (!t) return;
		this.map.getPane(t)?.remove();
		let n = this.map._panes;
		n && delete n[t];
		let r = this.map._paneRenderers, i = r?.[t];
		i && (this.map.removeLayer(i), delete r[t]), this.layerPanes.delete(e);
	}
	removePaneIfUntracked(e) {
		this.logicalToNative.has(e) || this.warpedMapLayers.has(e) || this.removePane(e);
	}
	reapplyLogicalOrder() {
		this.logicalOrder.forEach((e, t) => {
			let n = this.layerPanes.get(e);
			if (n) {
				let e = this.map.getPane(n);
				e && (e.style.zIndex = String(L + t));
				return;
			}
			let r = this.logicalToNative.get(e) ?? [];
			for (let e of r) {
				let t = this.nativeLayerInstances.get(e);
				!t || !this.map.hasLayer(t) || (this.map.removeLayer(t), this.map.addLayer(t));
			}
		});
	}
	isWarpedMapSource(e) {
		return e.type === "raster" && "url" in e ? (Array.isArray(e.url) ? e.url[0] : e.url).startsWith(I) : !1;
	}
	parseWarpedMapUrl(e) {
		return e.startsWith(I) ? "https://" + e.slice(12) : e;
	}
	async addWarpedMapLayer(e, t) {
		try {
			this.beginBusyOperation();
			let { WarpedMapLayer: n } = await import("./dist-C6237G7V.js"), r = `warpedmap-${e}`, i = new n(t, { pane: this.ensurePane(e) });
			return i.addTo(this.map), this.warpedMapLayers.set(e, i), this.nativeLayerInstances.set(r, i), this.logicalToNative.set(e, [r]), !0;
		} catch (t) {
			return console.warn("[LEAFLET LAYER SERVICE] @allmaps/leaflet not available or error loading warped map:", t), this.removePaneIfUntracked(e), !1;
		} finally {
			this.endBusyOperation();
		}
	}
	async addLayer(e, t) {
		let r = e.id, i = this.resolveInsertIndex(t);
		if (e.type === "allmaps") {
			let t = await this.addWarpedMapLayer(r, e.annotation);
			return t && (this.upsertLogicalOrder(r, i), this.reapplyLogicalOrder()), t;
		}
		if (e.type === "style") {
			let r = n(e);
			return r ? this.addCompositeLayer(r, t) : !1;
		}
		let o = e;
		if (!o.source) return !1;
		let s = e.sources?.[o.source], c = s ? a(o.source, s) : null;
		if (!c) return !1;
		if (this.isWarpedMapSource(c)) {
			let e = Array.isArray(c.url) ? c.url[0] : c.url, t = this.parseWarpedMapUrl(e), n = await this.addWarpedMapLayer(r, t);
			return n && (this.upsertLogicalOrder(r, i), this.reapplyLogicalOrder()), n;
		}
		let l = [], u = [o], d = this.ensurePane(r);
		if (c.type === "raster") {
			let t = c.service === "xyz" ? w.createXYZLayer(r, c, d) : w.createWMSLayer(r, c, d);
			t && !this.nativeLayerInstances.has(t.id) && (this.attachTileBusyEvents(t.layer), t.layer.addTo(this.map), this.nativeLayerInstances.set(t.id, t.layer), l.push(t.id)), c.service === "wms" && this.logicalToWMSSource.set(r, {
				layerTitle: e.title,
				sourceConfig: c
			});
		} else if (c.type === "geojson") {
			let e = await this.fetchGeoJSON(c);
			if (!e) return this.removePaneIfUntracked(r), !1;
			let t = w.createGeoJSONLayer(r, c, e, u, d, this.map);
			for (let n of t) this.nativeLayerInstances.has(n.id) || (n.layer.addTo(this.map), this.nativeLayerInstances.set(n.id, n.layer), this.nativeLayerToSource.set(n.id, c.id), l.push(n.id), n.id === `${r}-${o.id}` && this.compositeSubLayerCache.set(n.id, {
				spec: o,
				sourceConfig: c,
				data: e
			}));
		} else if (c.type === "vector") return console.warn("[LEAFLET LAYER SERVICE] Vector tile sources require leaflet.vectorgrid plugin"), this.removePaneIfUntracked(r), !1;
		return l.length === 0 ? (this.removePaneIfUntracked(r), !1) : (this.logicalToNative.set(r, l), this.upsertLogicalOrder(r, i), this.reapplyLogicalOrder(), !0);
	}
	async fetchGeoJSON(e) {
		if (typeof e.data != "string") return e.data;
		try {
			return this.beginBusyOperation(), await (await fetch(e.data)).json();
		} catch (e) {
			return console.error("[LEAFLET LAYER SERVICE] Failed to fetch GeoJSON:", e), null;
		} finally {
			this.endBusyOperation();
		}
	}
	async addCompositeLayer(e, t) {
		let n = e.styleId, i = this.resolveInsertIndex(t), a = [], o = this.ensurePane(n), s = /* @__PURE__ */ new Map();
		for (let t of e.subLayers) {
			let e = t.source ?? "";
			s.has(e) || s.set(e, []), s.get(e).push(t);
		}
		for (let [t, i] of s.entries()) {
			let s = r(e, t)?.config ?? null;
			if (s) {
				if (s.type === "raster") {
					let e = s.service === "xyz" ? w.createXYZLayer(n, s, o) : w.createWMSLayer(n, s, o);
					e && !this.nativeLayerInstances.has(e.id) && (this.attachTileBusyEvents(e.layer), e.layer.addTo(this.map), this.nativeLayerInstances.set(e.id, e.layer), a.push(e.id));
				} else if (s.type === "geojson") {
					let e = await this.fetchGeoJSON(s);
					if (!e) continue;
					let t = w.createGeoJSONLayer(n, s, e, i, o, this.map);
					for (let r of t) if (!this.nativeLayerInstances.has(r.id)) {
						r.layer.addTo(this.map), this.nativeLayerInstances.set(r.id, r.layer), this.nativeLayerToSource.set(r.id, s.id), a.push(r.id);
						let t = i.find((e) => r.id === `${n}-${e.id}`);
						t && this.compositeSubLayerCache.set(r.id, {
							spec: t,
							sourceConfig: s,
							data: e
						});
					}
				}
			}
		}
		return a.length === 0 ? (this.removePaneIfUntracked(n), !1) : (this.logicalToNative.set(n, a), this.upsertLogicalOrder(n, i), this.reapplyLogicalOrder(), !0);
	}
	updateLayerStyle(e, t, n) {
		let r = `${e}-${t}`, i = this.compositeSubLayerCache.get(r), a = this.nativeLayerInstances.get(r);
		if (!i || !a || typeof a.setStyle != "function") return !1;
		let o = {
			...i.spec,
			paint: {
				...i.spec.paint ?? {},
				...n
			}
		};
		return a.setStyle((e) => w.convertPaintToLeafletStyle(o, e)), this.compositeSubLayerCache.set(r, {
			...i,
			spec: o
		}), !0;
	}
	moveLayer(e, t) {
		let n = t ?? null;
		if (n && !this.logicalOrder.includes(n)) {
			let e = Object.keys(this.store.getState().mapLayers ?? {}), t = e.indexOf(n);
			n = t === -1 ? null : e.slice(t + 1).find((e) => this.logicalOrder.includes(e)) ?? null;
		}
		let r = n ? this.resolveInsertIndex({ beforeLayerId: n }) : void 0;
		this.upsertLogicalOrder(e, r), this.reapplyLogicalOrder();
	}
	removeLayer(e) {
		if (this.warpedMapLayers.has(e)) {
			let t = this.warpedMapLayers.get(e);
			t && this.map.removeLayer(t), this.warpedMapLayers.delete(e);
		}
		let t = this.logicalToNative.get(e) || [];
		for (let e of t) {
			let t = this.nativeLayerInstances.get(e);
			t && (this.map.removeLayer(t), this.nativeLayerInstances.delete(e), this.nativeLayerToSource.delete(e), this.compositeSubLayerCache.delete(e));
		}
		this.logicalToNative.delete(e), this.logicalToWMSSource.delete(e), this.logicalOrder = this.logicalOrder.filter((t) => t !== e), this.removePane(e);
	}
	getVisibleLayers() {
		return Array.from(this.logicalToNative.keys());
	}
	isLayerVisible(e) {
		return this.logicalToNative.has(e);
	}
	setLayerOpacity(e, t) {
		let n = this.logicalToNative.get(e) ?? [];
		for (let e of n) {
			let n = this.nativeLayerInstances.get(e);
			n && (typeof n.setOpacity == "function" ? n.setOpacity(t) : typeof n.setStyle == "function" && n.setStyle({
				opacity: t,
				fillOpacity: t
			}));
		}
	}
	setLayerVisibility(e, t) {
		let n = this.logicalToNative.get(e) ?? [];
		for (let e of n) {
			let n = this.nativeLayerInstances.get(e);
			n && (t ? this.map.hasLayer(n) || this.map.addLayer(n) : this.map.hasLayer(n) && this.map.removeLayer(n));
		}
	}
	getSourceData(e) {
		for (let [t, n] of this.nativeLayerToSource.entries()) {
			if (n !== e) continue;
			let r = this.nativeLayerInstances.get(t), i = r && typeof r.toGeoJSON == "function" ? r.toGeoJSON() : null;
			if (i) {
				if (i.type === "FeatureCollection") return i;
				if (i.type === "Feature") return {
					type: "FeatureCollection",
					features: [i]
				};
			}
		}
		return null;
	}
	getLayerSourceLayers(e) {
		return [];
	}
	async queryLayerFeatures(e, t) {
		let n = this.logicalToNative.get(e) ?? [];
		for (let e of n) {
			let t = this.nativeLayerToSource.get(e);
			if (!t) continue;
			let n = this.getSourceData(t);
			if (n && typeof n == "object") return n;
		}
		return {
			type: "FeatureCollection",
			features: []
		};
	}
	setSourceData(e, t) {
		let n = !1;
		for (let [r, i] of this.nativeLayerToSource.entries()) {
			if (i !== e) continue;
			let a = this.nativeLayerInstances.get(r);
			!a || typeof a.clearLayers != "function" || typeof a.addData != "function" || (a.clearLayers(), a.addData(t), n = !0);
		}
		return n;
	}
	queryVectorFeaturesAtPixel(e, t, n, r) {
		let i = [], a = h.point(t[0], t[1]);
		for (let [t, o] of this.logicalToNative.entries()) if (!(r && !r.has(t))) for (let r of o) {
			let o = this.nativeLayerInstances.get(r);
			if (!o || typeof o.getLayers != "function") continue;
			let s = o;
			for (let r of s.getLayers()) if (this.isHitAtPixel(e, r, a, n)) {
				let e = r.feature;
				e?.properties && i.push({
					layerId: t,
					properties: e.properties
				});
			}
		}
		return i;
	}
	isHitAtPixel(e, t, n, r) {
		if (t instanceof h.CircleMarker) {
			let i = e.latLngToContainerPoint(t.getLatLng()), a = t.getRadius() + r;
			return i.distanceTo(n) <= a;
		}
		if (t instanceof h.Polygon) {
			let i = t.getLatLngs(), a = (t) => t.map((t) => e.latLngToContainerPoint(t)), o = i[0][0], s = o != null && typeof o.lat == "number", c = [];
			if (s) c.push(i.map(a));
			else for (let e of i) c.push(e.map(a));
			if (t.options?.fill === !1) {
				for (let e of c) for (let t of e) for (let e = 0; e < t.length; e++) {
					let i = t[e], a = t[(e + 1) % t.length];
					if (this.pointToSegmentDistancePx(n, i, a) <= r) return !0;
				}
				return !1;
			}
			if (!t.getBounds().contains(e.containerPointToLatLng(n))) return !1;
			for (let e of c) {
				let [t, ...r] = e;
				if (!(!t || !this.pointInRing(n, t)) && !r.some((e) => this.pointInRing(n, e))) return !0;
			}
			return !1;
		}
		if (t instanceof h.Polyline) {
			let i = t.getLatLngs().flat(2);
			for (let t = 0; t < i.length - 1; t++) {
				let a = e.latLngToContainerPoint(i[t]), o = e.latLngToContainerPoint(i[t + 1]);
				if (this.pointToSegmentDistancePx(n, a, o) <= r) return !0;
			}
		}
		return !1;
	}
	pointInRing(e, t) {
		let n = !1;
		for (let r = 0, i = t.length - 1; r < t.length; i = r++) {
			let a = t[r].x, o = t[r].y, s = t[i].x, c = t[i].y;
			o > e.y != c > e.y && e.x < (s - a) * (e.y - o) / (c - o) + a && (n = !n);
		}
		return n;
	}
	pointToSegmentDistancePx(e, t, n) {
		let r = n.x - t.x, i = n.y - t.y, a = r * r + i * i;
		if (a === 0) return e.distanceTo(t);
		let o = Math.max(0, Math.min(1, ((e.x - t.x) * r + (e.y - t.y) * i) / a));
		return e.distanceTo(h.point(t.x + o * r, t.y + o * i));
	}
	registerInlineLayer(e, t, n) {
		let r = this.resolveInsertIndex(n), i = [];
		for (let n = 0; n < t.length; n++) {
			let r = `${e}-inline-${n}`;
			this.nativeLayerInstances.set(r, t[n]), i.push(r);
		}
		this.logicalToNative.set(e, i), this.upsertLogicalOrder(e, r);
	}
	unregisterInlineLayer(e) {
		let t = this.logicalToNative.get(e) ?? [];
		for (let e of t) this.nativeLayerInstances.delete(e);
		this.logicalToNative.delete(e), this.logicalOrder = this.logicalOrder.filter((t) => t !== e);
	}
	getVisibleWMSLayers() {
		let e = [];
		for (let [t, n] of this.logicalToWMSSource.entries()) this.logicalToNative.has(t) && e.push({
			layerId: t,
			...n
		});
		return e;
	}
}, z = class {
	constructor(e, t) {
		this.map = e, this.layerService = t;
	}
	async queryFeatures(e, n = {}) {
		let { pixel: r } = e, i = n.tolerancePx ?? 5, a = [], o = n.layerIds?.length ? new Set(n.layerIds) : null, s = this.layerService.queryVectorFeaturesAtPixel(this.map, r, i, o ?? void 0);
		for (let e of s) a.push({
			layerId: e.layerId,
			properties: e.properties,
			source: "vector"
		});
		if (n.includeWMS) {
			let e = this.map.getBounds(), n = this.map.getSize(), i = {
				west: e.getWest(),
				south: e.getSouth(),
				east: e.getEast(),
				north: e.getNorth()
			}, s = this.layerService.getVisibleWMSLayers(), c = await Promise.all(s.filter((e) => !o || o.has(e.layerId)).map((e) => t({
				sourceConfig: e.sourceConfig,
				layerId: e.layerId,
				layerTitle: e.layerTitle,
				bounds: i,
				containerWidth: n.x,
				containerHeight: n.y,
				pixelX: r[0],
				pixelY: r[1]
			})));
			for (let e of c) a.push(...e);
		}
		return a;
	}
};
//#endregion
//#region src/map/leaflet-services/MapMarkerService.ts
function B(e) {
	return h.divIcon({
		html: u(e),
		className: "",
		iconSize: [24, 36],
		iconAnchor: [12, 36]
	});
}
var V = class {
	constructor(e) {
		this.map = e, this.markers = /* @__PURE__ */ new Map();
	}
	add(e, t, n = {}) {
		this.remove(e);
		let r = n.color ?? "#e63946", i = h.marker([t[1], t[0]], {
			icon: B(r),
			draggable: n.draggable ?? !1
		}).addTo(this.map);
		n.onDrag && i.on("drag", () => {
			let e = i.getLatLng();
			n.onDrag([e.lng, e.lat]);
		}), n.onDragEnd && i.on("dragend", () => {
			let e = i.getLatLng();
			n.onDragEnd([e.lng, e.lat]);
		}), this.markers.set(e, i);
	}
	move(e, t) {
		this.markers.get(e)?.setLatLng([t[1], t[0]]);
	}
	remove(e) {
		let t = this.markers.get(e);
		t && (t.remove(), this.markers.delete(e));
	}
}, H = class extends o {
	constructor() {
		super(), this.engineId = "leaflet", this.engineVersion = g, this.markerService = null, this.core = new E(this.store, this.events), this.toolService = new D({}), this.logicalLayerExecutor = new i(), this.queryExecutor = new s(this.store), this.queryService = this.queryExecutor, this.mapFactory = new F(), this.core.onMapReady?.((e) => {
			let t = new R(e, this.store);
			this.core.setLayerOrderRegistry(t), this.logicalLayerExecutor.bind(t), this.queryExecutor.bind(new z(e, t)), this.markerService = new V(e);
		});
	}
	getCore() {
		return this.core;
	}
	getLogicalLayerExecutor() {
		return this.logicalLayerExecutor;
	}
	getMarkerService() {
		return this.markerService;
	}
	engineSetBackgroundColor(e) {
		return this.core.onMapReady?.((t) => {
			let n = t?.getContainer?.();
			n && (e ? (n.style.setProperty("--webmapx-map-background", e), n.style.backgroundColor = e) : (n.style.removeProperty("--webmapx-map-background"), n.style.removeProperty("background-color")));
		}), !0;
	}
};
//#endregion
export { H as LeafletAdapter };
