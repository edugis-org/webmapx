import { t as e } from "./wms-url-builder-BO6EoMZm.js";
import { t } from "./wms-feature-info-BjPjL6VU.js";
import { a as n, c as r, i, n as a, t as o } from "./deferred-query-service-CIWOaT4O.js";
import { t as s } from "./esm-DTXnX1Aq.js";
import { n as c } from "./archive-urls-bn5tsSXE.js";
import { t as l } from "./vector-tile-features-D3gzYoEP.js";
import * as u from "maplibre-gl";
//#region src/map/maplibre-services/print-map.ts
async function d(e, t, n) {
	let r = e.unproject(n.center), i = new u.Map({
		container: t,
		style: e.getStyle(),
		center: r,
		zoom: e.getZoom() + Math.log2(n.scale),
		bearing: e.getBearing(),
		pitch: e.getPitch(),
		interactive: !1,
		attributionControl: !1
	});
	try {
		await new Promise((e, t) => {
			let n = setTimeout(() => t(/* @__PURE__ */ Error("Map render timed out (30 s)")), 3e4);
			i.once("idle", () => {
				clearTimeout(n), e();
			});
		});
	} catch (e) {
		throw i.remove(), e;
	}
	return () => i.remove();
}
//#endregion
//#region src/map/maplibre-services/MapCoreService.ts
function f(e) {
	return "sourceId" in e;
}
var p = class e {
	constructor(e, t) {
		this.store = e, this.eventBus = t, this.mapInstance = null, this.backgroundColor = null, this.mapReadyCallbacks = [], this.lastContainerId = null, this.lastInitOptions = void 0, this.silentSourceIds = /* @__PURE__ */ new Set(), this.geoJSONData = /* @__PURE__ */ new Map(), this.moveRafHandle = null, this.moveRafPending = !1, this.isMoving = !1, this.initialConfig = {
			center: [10.45, 51.17],
			zoom: 4,
			pitch: 0,
			bearing: 0,
			style: {
				version: 8,
				sources: {},
				layers: []
			}
		};
	}
	getViewportState() {
		return this.mapInstance ? {
			center: this.mapInstance.getCenter().toArray(),
			zoom: this.mapInstance.getZoom(),
			bearing: this.mapInstance.getBearing(),
			pitch: this.mapInstance.getPitch()
		} : {
			center: [0, 0],
			zoom: 1,
			bearing: 0,
			pitch: 0
		};
	}
	setViewport(e, t, n) {
		if (this.mapInstance) {
			if (n?.animate === !1) {
				this.mapInstance.jumpTo({
					center: e,
					zoom: t
				});
				return;
			}
			this.mapInstance.flyTo({
				center: e,
				zoom: t
			});
		}
	}
	initialize(e, t) {
		this.lastContainerId = e, this.lastInitOptions = t, this.backgroundColor = t?.backgroundColor ?? null;
		let n = t?.center ?? this.initialConfig.center, r = t?.zoom ?? this.initialConfig.zoom, i = this.resolveContainer(e), a = this.projectionSpecFor(t?.projection), o;
		o = t?.style ? {
			version: 8,
			sources: t.style.sources || {},
			layers: t.style.layers || [],
			...t.style.glyphs && { glyphs: t.style.glyphs },
			...t.style.sprite && { sprite: t.style.sprite },
			...t.style.name && { name: t.style.name },
			...a
		} : t?.styleUrl ? t.styleUrl : {
			...this.initialConfig.style,
			...a
		}, this.mapInstance = new u.Map({
			container: i,
			center: n,
			zoom: r,
			minZoom: t?.minZoom,
			maxZoom: t?.maxZoom,
			minPitch: t?.minPitch,
			maxPitch: t?.maxPitch,
			maxBounds: t?.maxBounds,
			pitch: t?.pitch ?? this.initialConfig.pitch,
			bearing: t?.bearing ?? this.initialConfig.bearing,
			attributionControl: !1,
			...t?.backgroundColor ? { canvasContextAttributes: { alpha: !0 } } : {},
			style: o
		}), this.flushMapReadyCallbacks();
		let s = this.mapInstance.getCanvasContainer();
		s && (s.tabIndex = -1), this.mapInstance.on("load", () => {
			let e = this.buildViewportFeature();
			this.store.dispatch({
				mapLoaded: !0,
				zoomLevel: r,
				mapCenter: n,
				mapViewportBounds: e
			}, "MAP"), this.applyGlobeFog();
		}), this.mapInstance.on("dataloading", (e) => {
			f(e) && e.sourceId && this.silentSourceIds.has(e.sourceId) || this.store.dispatch({ mapBusy: !0 }, "MAP");
		}), this.mapInstance.on("idle", () => {
			this.store.dispatch({ mapBusy: !1 }, "MAP");
		}), this.mapInstance.on("zoomend", () => {
			let e = this.mapInstance.getZoom(), t = this.buildViewportFeature();
			this.store.dispatch({
				zoomLevel: e,
				mapViewportBounds: t
			}, "MAP"), this.eventBus?.emit({
				type: "zoom-end",
				zoom: e
			});
		}), this.mapInstance.on("movestart", () => {
			this.isMoving = !0;
		}), this.mapInstance.on("moveend", () => {
			this.isMoving = !1, this.moveRafHandle !== null && (cancelAnimationFrame(this.moveRafHandle), this.moveRafHandle = null, this.moveRafPending = !1);
			let e = this.mapInstance.getCenter().toArray(), t = this.mapInstance.getZoom(), n = this.buildViewportFeature();
			this.store.dispatch({
				mapCenter: e,
				zoomLevel: t,
				mapViewportBounds: n
			}, "MAP"), this.emitViewChangeEnd();
		}), this.mapInstance.on("move", () => {
			this.moveRafPending || (this.moveRafPending = !0, this.moveRafHandle = requestAnimationFrame(() => {
				this.moveRafHandle = null, this.moveRafPending = !1, this.emitViewChange();
			}));
		}), this.attachPointerEvents(this.mapInstance);
	}
	attachPointerEvents(e) {
		e.on("mousemove", (t) => {
			if (this.isMoving) return;
			let n = [t.lngLat.lng, t.lngLat.lat], r = [t.point.x, t.point.y], i = this.computePointerResolution(t);
			if (this.isCursorBeyondHorizon(e, t.point.x, t.point.y)) {
				this.store.dispatch({
					pointerCoordinates: null,
					pointerResolution: null
				}, "MAP");
				return;
			}
			this.eventBus?.emit({
				type: "pointer-move",
				coords: n,
				pixel: r,
				resolution: i,
				originalEvent: t.originalEvent
			}), this.store.dispatch({
				pointerCoordinates: n,
				pointerResolution: i
			}, "MAP");
		}), e.on("mousedown", (e) => {
			let t = [e.lngLat.lng, e.lngLat.lat], n = [e.point.x, e.point.y];
			this.eventBus?.emit({
				type: "pointer-down",
				coords: t,
				pixel: n,
				button: e.originalEvent.button,
				originalEvent: e.originalEvent
			});
		}), e.on("mouseup", (e) => {
			let t = [e.lngLat.lng, e.lngLat.lat], n = [e.point.x, e.point.y];
			this.eventBus?.emit({
				type: "pointer-up",
				coords: t,
				pixel: n,
				button: e.originalEvent.button,
				originalEvent: e.originalEvent
			});
		});
		let t = e.getCanvas();
		t.addEventListener("pointerdown", (n) => {
			if (n.pointerType === "mouse") return;
			let r = t.getBoundingClientRect(), i = [n.clientX - r.left, n.clientY - r.top], a = e.unproject(i), o = [a.lng, a.lat];
			this.eventBus?.emit({
				type: "pointer-down",
				coords: o,
				pixel: i,
				button: 0,
				originalEvent: n
			});
		}), t.addEventListener("pointermove", (n) => {
			if (n.pointerType === "mouse") return;
			let r = t.getBoundingClientRect(), i = [n.clientX - r.left, n.clientY - r.top], a = e.unproject(i), o = [a.lng, a.lat];
			this.eventBus?.emit({
				type: "pointer-move",
				coords: o,
				pixel: i,
				resolution: null,
				originalEvent: n
			});
		}), t.addEventListener("pointerup", (n) => {
			if (n.pointerType === "mouse") return;
			let r = t.getBoundingClientRect(), i = [n.clientX - r.left, n.clientY - r.top], a = e.unproject(i), o = [a.lng, a.lat];
			this.eventBus?.emit({
				type: "pointer-up",
				coords: o,
				pixel: i,
				button: 0,
				originalEvent: n
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
		}), e.on("click", (e) => {
			let t = [e.lngLat.lng, e.lngLat.lat], n = [e.point.x, e.point.y], r = this.computePointerResolution(e);
			this.eventBus?.emit({
				type: "click",
				coords: t,
				pixel: n,
				resolution: r,
				originalEvent: e.originalEvent
			}), this.store.dispatch({
				lastClickedCoordinates: t,
				lastClickedResolution: r,
				pointerCoordinates: t,
				pointerResolution: r
			}, "MAP");
		}), e.on("dblclick", (e) => {
			let t = [e.lngLat.lng, e.lngLat.lat], n = [e.point.x, e.point.y];
			this.eventBus?.emit({
				type: "dblclick",
				coords: t,
				pixel: n,
				originalEvent: e.originalEvent
			});
		}), e.on("contextmenu", (e) => {
			let t = [e.lngLat.lng, e.lngLat.lat], n = [e.point.x, e.point.y];
			this.eventBus?.emit({
				type: "contextmenu",
				coords: t,
				pixel: n,
				originalEvent: e.originalEvent
			});
		});
	}
	isCursorBeyondHorizon(e, t, n) {
		if (e.getProjection?.()?.type === "globe") {
			let r = e.unproject([t, n]), i = e.project(r), a = i.x - t, o = i.y - n;
			return a * a + o * o > 100;
		}
		let r = e.getPitch();
		if (r === 0) return !1;
		let i = e.transform;
		if (!i) return !1;
		let a = i.cameraToCenterDistance ?? 0;
		if (a === 0) return !1;
		let o = Math.PI / 180, s = a * Math.min(.85 * Math.tan((90 - r) * o), Math.tan((89.25 - r) * o)), c = i.rollInRadians ?? 0, l = e.getCanvas(), u = l.clientHeight, d = l.clientWidth;
		return (u / 2 - n) * Math.cos(c) + (d / 2 - t) * Math.sin(c) > s - 4;
	}
	computePointerResolution(e) {
		if (!this.mapInstance || !e.point || this.isMoving) return null;
		let t = this.mapInstance, n = e.point, r = e.lngLat, i = t.unproject([n.x + 1, n.y]), a = t.unproject([n.x, n.y + 1]), o = Math.abs(i.lng - r.lng), s = Math.abs(a.lat - r.lat);
		return !isFinite(o) || !isFinite(s) ? null : {
			lng: Math.max(o, 1e-12),
			lat: Math.max(s, 1e-12)
		};
	}
	emitViewChange() {
		if (!this.eventBus || !this.mapInstance) return;
		let e = this.mapInstance.getCenter(), t = this.mapInstance.getBounds();
		this.eventBus.emit({
			type: "view-change",
			center: [e.lng, e.lat],
			zoom: this.mapInstance.getZoom(),
			bearing: this.mapInstance.getBearing(),
			pitch: this.mapInstance.getPitch(),
			bounds: {
				sw: [t.getSouthWest().lng, t.getSouthWest().lat],
				ne: [t.getNorthEast().lng, t.getNorthEast().lat]
			}
		});
	}
	emitViewChangeEnd() {
		if (!this.eventBus || !this.mapInstance) return;
		let e = this.mapInstance.getCenter(), t = this.mapInstance.getBounds();
		this.eventBus.emit({
			type: "view-change-end",
			center: [e.lng, e.lat],
			zoom: this.mapInstance.getZoom(),
			bearing: this.mapInstance.getBearing(),
			pitch: this.mapInstance.getPitch(),
			bounds: {
				sw: [t.getSouthWest().lng, t.getSouthWest().lat],
				ne: [t.getNorthEast().lng, t.getNorthEast().lat]
			}
		});
	}
	onMapReady(e) {
		if (this.mapInstance) {
			e(this.mapInstance);
			return;
		}
		this.mapReadyCallbacks.push(e);
	}
	setZoom(e) {
		this.mapInstance && this.mapInstance.setZoom(e);
	}
	getZoom() {
		return this.mapInstance ? this.mapInstance.getZoom() : this.initialConfig.zoom;
	}
	addLayer(e, t) {
		if (!this.mapInstance || e?.id && this.mapInstance.getLayer(e.id)) return !1;
		if (t?.beforeLayerId) return this.mapInstance.addLayer(e, t.beforeLayerId), !0;
		if (t?.afterLayerId) {
			let n = this.mapInstance.getStyle(), r = Array.isArray(n?.layers) ? n.layers : [], i = r.findIndex((e) => e?.id === t.afterLayerId), a = i >= 0 && i + 1 < r.length ? r[i + 1]?.id : void 0;
			return this.mapInstance.addLayer(e, a), !0;
		}
		return this.mapInstance.addLayer(e), !0;
	}
	removeLayer(e) {
		this.mapInstance?.getLayer(e) && this.mapInstance.removeLayer(e);
	}
	static {
		this.TERRAIN_SOURCE_ID = "webmapx-terrain-dem";
	}
	static {
		this.TERRAIN_HILLSHADE_LAYER_ID = "webmapx-terrain-hillshade";
	}
	static {
		this.TERRAIN_SOURCE_CONFIG = {
			type: "raster-dem",
			tiles: [
				"https://t1.edugis.nl/mapproxy/nextzenelevation/wmts/nextzenelevation/webmercator/{z}/{x}/{y}.png",
				"https://t2.edugis.nl/mapproxy/nextzenelevation/wmts/nextzenelevation/webmercator/{z}/{x}/{y}.png",
				"https://t3.edugis.nl/mapproxy/nextzenelevation/wmts/nextzenelevation/webmercator/{z}/{x}/{y}.png",
				"https://t4.edugis.nl/mapproxy/nextzenelevation/wmts/nextzenelevation/webmercator/{z}/{x}/{y}.png"
			],
			tileSize: 256,
			encoding: "terrarium",
			maxzoom: 15,
			attribution: "NextZen"
		};
	}
	ensureTerrainSource(t, n) {
		if (!this.mapInstance) return null;
		let r = e.TERRAIN_SOURCE_ID;
		if (!this.mapInstance.getSource(r)) {
			let i = n ?? (typeof t?.id == "string" ? t.id : void 0), a = [
				i ? this.mapInstance.getSource(i)?.serialize?.() : void 0,
				t,
				e.TERRAIN_SOURCE_CONFIG
			].find((t) => e.canAddressTiles(t));
			if (!a) return null;
			this.mapInstance.addSource(r, a);
		}
		return r;
	}
	static canAddressTiles(e) {
		return !e || typeof e != "object" ? !1 : Array.isArray(e.tiles) && e.tiles.length > 0 ? !0 : typeof e.url == "string" && e.url.length > 0;
	}
	setTerrainEnabled(t, n, r) {
		if (!this.mapInstance || t && this.mapInstance.getProjection?.()?.type === "globe") return !1;
		try {
			if (t) {
				let t = this.ensureTerrainSource(n, r);
				if (!t) return !1;
				this.mapInstance.setTerrain({
					source: t,
					exaggeration: 1
				}), !r && !this.mapInstance.getLayer(e.TERRAIN_HILLSHADE_LAYER_ID) && this.mapInstance.addLayer({
					id: e.TERRAIN_HILLSHADE_LAYER_ID,
					type: "hillshade",
					source: e.TERRAIN_SOURCE_ID,
					paint: { "hillshade-exaggeration": .2 }
				});
			} else this.mapInstance.setTerrain(null), this.mapInstance.getLayer(e.TERRAIN_HILLSHADE_LAYER_ID) && this.mapInstance.removeLayer(e.TERRAIN_HILLSHADE_LAYER_ID), !(this.mapInstance.getStyle()?.layers ?? []).some((t) => t.source === e.TERRAIN_SOURCE_ID) && this.mapInstance.getSource(e.TERRAIN_SOURCE_ID) && this.mapInstance.removeSource(e.TERRAIN_SOURCE_ID);
		} catch (e) {
			return console.error("[MapLibre] setTerrain failed", e), this.mapInstance.setTerrain(null), !1;
		}
		return !0;
	}
	isTerrainEnabled() {
		return this.mapInstance ? !!this.mapInstance.getTerrain() : null;
	}
	getElevation(e) {
		return !this.mapInstance || !this.mapInstance.getTerrain() ? null : this.mapInstance.queryTerrainElevation(e) ?? null;
	}
	addSource(e, t) {
		this.mapInstance?.addSource(e, t), t?.type === "geojson" && t.data && typeof t.data == "object" && this.geoJSONData.set(e, t.data);
	}
	removeSource(e) {
		this.mapInstance?.getSource(e) && this.mapInstance.removeSource(e), this.geoJSONData.delete(e);
	}
	getSource(e) {
		let t = this.mapInstance?.getSource(e);
		if (t) return {
			id: e,
			setData: (n) => {
				t.setData(n), this.geoJSONData.set(e, n);
			}
		};
	}
	project(e) {
		if (!this.mapInstance) return console.warn("[CORE SERVICE - MapLibre] project called before map instance is ready."), [0, 0];
		try {
			let t = this.mapInstance.project(e);
			return [t.x, t.y];
		} catch {
			return [0, 0];
		}
	}
	unproject(e) {
		if (!this.mapInstance) return console.warn("[CORE SERVICE - MapLibre] unproject called before map instance is ready."), null;
		let t = [e[0], e[1]], n = this.mapInstance.unproject(t);
		return [n.lng, n.lat];
	}
	fitBounds(e) {
		if (this.mapInstance) try {
			this.mapInstance.fitBounds([[e[0], e[1]], [e[2], e[3]]], {
				padding: 40,
				animate: !0,
				duration: 3e3,
				essential: !0
			});
		} catch {
			let t = (e[0] + e[2]) / 2, n = (e[1] + e[3]) / 2;
			this.setViewport([t, n], this.initialConfig.zoom);
		}
	}
	setCursor(e) {
		this.mapInstance && (this.mapInstance.getCanvas().style.cursor = e);
	}
	setPanEnabled(e) {
		this.mapInstance && (e ? this.mapInstance.dragPan.enable() : (this.mapInstance.dragPan.disable(), this.isMoving = !1));
	}
	setTouchCaptureEnabled(e) {}
	setDoubleClickZoomEnabled(e) {
		this.mapInstance && (e ? this.mapInstance.doubleClickZoom.enable() : this.mapInstance.doubleClickZoom.disable());
	}
	setLayerVisibility(e, t) {
		if (this.mapInstance) try {
			this.mapInstance.setLayoutProperty(e, "visibility", t ? "visible" : "none");
		} catch {}
	}
	getSourceData(e) {
		let t = this.geoJSONData.get(e), n = this.mapInstance?.getSource(e);
		if (n?.type === "geojson") try {
			let r = n.serialize()?.data;
			if (r && typeof r == "object") return this.geoJSONData.set(e, r), r;
			if (t) return t;
			if (typeof r == "string") return r;
		} catch {}
		return t ?? null;
	}
	suppressBusySignalForSource(e) {
		this.silentSourceIds.add(e);
	}
	unsuppressBusySignalForSource(e) {
		this.silentSourceIds.delete(e);
	}
	getNavigationCapabilities() {
		return {
			bearing: !0,
			pitch: !0,
			keyboard: !0
		};
	}
	getBearing() {
		return this.mapInstance?.getBearing() ?? 0;
	}
	setBearing(e) {
		this.mapInstance?.setBearing(e);
	}
	getPitch() {
		return this.mapInstance?.getPitch() ?? 0;
	}
	setPitch(e) {
		this.mapInstance?.setPitch(e);
	}
	resetNorth() {
		this.mapInstance?.resetNorth();
	}
	resetNorthPitch() {
		this.mapInstance?.resetNorthPitch();
	}
	setBackgroundColor(e) {
		this.backgroundColor = e, this.applyGlobeFog();
	}
	applyGlobeFog() {
		if (!this.mapInstance) return;
		let e = this.mapInstance.getProjection?.()?.type === "globe", t = this.mapInstance.getCanvas?.();
		t && (t.style.background = this.backgroundColor ?? (e ? "#000008" : "var(--color-background-secondary, #f4f4f4)"));
		try {
			this.mapInstance.setSky(e ? { "sky-color": this.backgroundColor ?? "#000000" } : void 0);
		} catch {}
	}
	static {
		this.SUPPORTED_PROJECTIONS = [
			"mercator",
			"globe",
			"vertical-perspective"
		];
	}
	projectionSpecFor(t) {
		return t ? e.SUPPORTED_PROJECTIONS.includes(t) ? { projection: { type: t } } : (console.warn(`[projection] MapLibre cannot draw in "${t}" — it offers ${e.SUPPORTED_PROJECTIONS.join(", ")}. The map is drawn in Web Mercator; OpenLayers is the engine that draws arbitrary projections.`), {}) : {};
	}
	setProjection(t) {
		if (!this.mapInstance) return !1;
		let n = typeof t == "string" ? t : t.name;
		if (!e.SUPPORTED_PROJECTIONS.includes(n)) return !1;
		try {
			let e = typeof t == "string" ? { type: t } : {
				type: t.name,
				center: t.center,
				parallels: t.parallels
			};
			return this.mapInstance.setProjection(e), this.applyGlobeFog(), !0;
		} catch {
			return !1;
		}
	}
	getProjection() {
		if (!this.mapInstance) return { name: "mercator" };
		try {
			let e = this.mapInstance.getProjection();
			return {
				name: e?.type ?? e?.name ?? "mercator",
				...e?.center ? { center: e.center } : {},
				...e?.parallels ? { parallels: e.parallels } : {}
			};
		} catch {
			return { name: "mercator" };
		}
	}
	dispatchViewportBoundsSnapshot() {
		let e = this.buildViewportFeature();
		this.store.dispatch({ mapViewportBounds: e }, "MAP");
	}
	computeFrustumCorners(e, t) {
		if (!this.mapInstance) return null;
		let n = this.mapInstance.getCenter(), r = this.mapInstance.getZoom(), i = this.mapInstance.getPitch(), a = this.mapInstance.getBearing(), o = this.mapInstance.transform?.fov ?? 36.87, s = i * Math.PI / 180, c = a * Math.PI / 180, l = o * Math.PI / 180, u = 2 * Math.atan(Math.tan(l / 2) * e / t), d = Math.sin(c), f = Math.cos(c), p = Math.sin(s), m = Math.cos(s), h = [
			d * p,
			f * p,
			-m
		], g = [
			f,
			-d,
			0
		], _ = [
			d * m,
			f * m,
			p
		], v = 111320, y = v * (360 / (512 * 2 ** r)), b = .5 * t / Math.tan(l / 2), x = Math.tan(l / 2), S = Math.tan(u / 2), C = 85.05112878, w = v * Math.cos(n.lat * Math.PI / 180) || 1e-6, T = b * y, E = -T * p * d, D = -T * p * f, O = T * m, k = [
			[-1, -1],
			[1, -1],
			[1, 1],
			[-1, 1]
		], A = [];
		for (let [e, t] of k) {
			let r = h[0] + e * S * g[0] + t * x * _[0], i = h[1] + e * S * g[1] + t * x * _[1], a = h[2] + e * S * g[2] + t * x * _[2];
			if (a >= 0) {
				let e = i >= 0 ? C : -85.05112878;
				A.push([n.lng + E / w, e]);
			} else {
				let e = -O / a, t = E + e * r, o = D + e * i;
				A.push([n.lng + t / w, Math.max(-85.05112878, Math.min(C, n.lat + o / v))]);
			}
		}
		return A;
	}
	buildViewportFeature() {
		if (!this.mapInstance) return null;
		let e = this.mapInstance;
		if (e.getProjection?.()?.type === "globe") return this.buildGlobeViewportFeature();
		let t = e.getCanvas(), n = t?.clientWidth || 0, r = t?.clientHeight || 0;
		if (n === 0 || r === 0 || [
			[0, 0],
			[n, 0],
			[n, r],
			[0, r]
		].some(([t, n]) => this.isCursorBeyondHorizon(e, t, n)) && e.getZoom() <= 10) return null;
		let i = [];
		for (let t = 0; t < 16; t++) {
			let a = t / 16, o, s;
			a < .25 ? (o = a * 4 * n, s = 0) : a < .5 ? (o = n, s = (a - .25) * 4 * r) : a < .75 ? (o = (1 - (a - .5) * 4) * n, s = r) : (o = 0, s = (1 - (a - .75) * 4) * r);
			let c = e.unproject([o, s]), l = (c.lng % 360 + 540) % 360 - 180;
			i.push([l, c.lat]);
		}
		if (i.length < 3) return null;
		let a = [i[0]];
		for (let e = 1; e < i.length; e++) {
			let t = i[e][0], n = a[e - 1][0];
			for (; t - n > 180;) t -= 360;
			for (; t - n < -180;) t += 360;
			a.push([t, i[e][1]]);
		}
		let o = a.map(([e]) => e);
		return Math.max(...o) - Math.min(...o) > 355 ? null : (a.push(a[0]), {
			type: "Feature",
			properties: { role: "mapViewport" },
			geometry: {
				type: "Polygon",
				coordinates: [a]
			}
		});
	}
	buildGlobeViewportFeature() {
		let e = this.mapInstance;
		if (!e) return null;
		let t = e.getCanvas(), n = t?.clientWidth || 0, r = t?.clientHeight || 0;
		if (n === 0 || r === 0) return null;
		let i = [];
		for (let e = 0; e < 32; e++) {
			let t = e / 32, a, o;
			t < .25 ? (a = t * 4 * n, o = 0) : t < .5 ? (a = n, o = (t - .25) * 4 * r) : t < .75 ? (a = (1 - (t - .5) * 4) * n, o = r) : (a = 0, o = (1 - (t - .75) * 4) * r), i.push([a, o]);
		}
		let a = [];
		for (let [t, n] of i) {
			let r = e.unproject([t, n]), i = e.project(r), o = i.x - t, s = i.y - n;
			o * o + s * s > 100 || a.push([r.lng, r.lat]);
		}
		if (a.length < 3) return null;
		let o = [a[0]];
		for (let e = 1; e < a.length; e++) {
			let t = a[e][0], n = o[e - 1][0];
			for (; t - n > 180;) t -= 360;
			for (; t - n < -180;) t += 360;
			o.push([t, a[e][1]]);
		}
		return o.push(o[0]), {
			type: "Feature",
			properties: { role: "mapViewport" },
			geometry: {
				type: "Polygon",
				coordinates: [o]
			}
		};
	}
	resolveContainer(e) {
		let t = document.getElementById(e);
		if (!t) return console.warn(`[CORE SERVICE] Container #${e} not found. Falling back to ID.`), e;
		if (t.tagName.toLowerCase() === "webmapx-map") {
			let e = t.querySelector("[slot=\"map-view\"]");
			if (e) return e;
			console.warn("[CORE SERVICE] <webmapx-map> is missing a [slot=\"map-view\"] element. Using host as fallback.");
		}
		return t;
	}
	flushMapReadyCallbacks() {
		if (this.mapInstance) for (let e of this.mapReadyCallbacks) try {
			e(this.mapInstance);
		} catch (e) {
			console.error("[CORE SERVICE] mapReady callback failed.", e);
		}
	}
	supportsRuntimeProjection() {
		return typeof this.mapInstance?.setProjection == "function";
	}
	destroyAndReinitialize(e) {
		if (!this.mapInstance || !this.lastContainerId) return;
		let t = this.getViewportState();
		this.mapInstance.remove(), this.mapInstance = null, this.initialize(this.lastContainerId, {
			...this.lastInitOptions,
			center: t.center,
			zoom: t.zoom,
			bearing: t.bearing,
			pitch: t.pitch,
			projection: e
		});
	}
}, m = class {
	constructor(e) {
		this.mapLibreInstance = {}, this.mapLibreInstance = e;
	}
	setBufferRadius(e) {
		console.log(`[SERVICE TEMPLATE] Set buffer radius to ${e}km on MapLibre.`);
	}
	toggleTool() {
		console.log("[SERVICE TEMPLATE] Toggled buffer tool activation.");
	}
}, h = "https://demotiles.maplibre.org/style.json";
function g(e) {
	return e.includes("{s}") ? [
		"a",
		"b",
		"c"
	].map((t) => e.replace("{s}", t)) : [e];
}
var _ = class {
	constructor(e, t) {
		this.id = e, this.map = t;
	}
	setData(e) {
		let t = this.map.getSource(this.id);
		t && t.setData(e);
	}
}, v = class {
	constructor(e, t, n) {
		this.id = e, this.sourceId = t, this.map = n;
	}
	getSource() {
		return new _(this.sourceId, this.map);
	}
	remove() {
		this.map.getLayer(this.id) && this.map.removeLayer(this.id);
	}
}, y = class {
	constructor(e) {
		this.map = e;
	}
	setViewport(e, t, n, r) {
		this.map.jumpTo({
			center: e,
			zoom: t,
			bearing: n ?? 0,
			pitch: r ?? 0
		});
	}
	createSource(e, t) {
		return this.map.getSource(e) || this.map.addSource(e, {
			type: "geojson",
			data: t
		}), new _(e, this.map);
	}
	getSource(e) {
		return this.map.getSource(e) ? new _(e, this.map) : null;
	}
	createLayer(e) {
		return this.map.getLayer(e.id) || this.map.addLayer(e), new v(e.id, e.source, this.map);
	}
	getLayer(e) {
		let t = this.map.getLayer(e);
		if (t) {
			let n = t.source;
			return new v(e, n, this.map);
		}
		return null;
	}
	onReady(e) {
		this.map.isStyleLoaded() ? e() : this.map.once("load", e);
	}
	destroy() {
		this.map.remove();
	}
}, b = class {
	createMap(e, t) {
		let n = Array.isArray(t?.tileUrls) && t.tileUrls.length > 0 ? t.tileUrls : typeof t?.tileUrl == "string" && t.tileUrl.length > 0 ? g(t.tileUrl) : void 0, r = t?.style ?? (n ? {
			version: 8,
			sources: { insetBackground: {
				type: "raster",
				tiles: n,
				tileSize: t?.tileSize ?? 256,
				...t?.tileAttribution ? { attribution: t.tileAttribution } : {}
			} },
			layers: [{
				id: "inset-background",
				type: "raster",
				source: "insetBackground"
			}]
		} : void 0) ?? t?.styleUrl ?? h, i = new u.Map({
			container: e,
			style: r,
			center: t?.center ?? [0, 0],
			zoom: t?.zoom ?? 1,
			attributionControl: !1,
			interactive: t?.interactive ?? !0
		});
		return t?.interactive === !1 && (i.boxZoom?.disable(), i.scrollZoom?.disable(), i.dragPan?.disable(), i.dragRotate?.disable(), i.keyboard?.disable(), i.doubleClickZoom?.disable(), i.touchZoomRotate?.disable()), new y(i);
	}
}, x = {
	fill: ["fill-opacity"],
	line: ["line-opacity"],
	circle: ["circle-opacity"],
	raster: ["raster-opacity"],
	"fill-extrusion": ["fill-extrusion-opacity"],
	heatmap: ["heatmap-opacity"],
	background: ["background-opacity"],
	symbol: ["icon-opacity", "text-opacity"],
	hillshade: [
		"hillshade-shadow-color",
		"hillshade-highlight-color",
		"hillshade-accent-color"
	]
};
function S(e, t) {
	let n = e.indexOf("?"), r = n === -1 ? e : e.slice(0, n + 1) + e.slice(n + 1).replace(/#/g, "%23"), i;
	try {
		i = new URL(r, typeof window < "u" ? window.location.href : "http://localhost/");
	} catch {
		return e;
	}
	for (let [e, n] of Object.entries(t)) {
		for (let t of [...i.searchParams.keys()]) t.toLowerCase() === e.toLowerCase() && i.searchParams.delete(t);
		n !== null && i.searchParams.set(e, n);
	}
	return i.href.replace(/%7B/g, "{").replace(/%7D/g, "}");
}
var C = class t {
	constructor(e, t) {
		this.logicalToNative = /* @__PURE__ */ new Map(), this.logicalSourceToNative = /* @__PURE__ */ new Map(), this.nativeLayerToSource = /* @__PURE__ */ new Map(), this.warpedMapLayers = /* @__PURE__ */ new Map(), this.nativeSourceToConfig = /* @__PURE__ */ new Map(), this.sourceIdCounter = 0, this.logicalLayerLegendRole = /* @__PURE__ */ new Map(), this._pendingHillshade = /* @__PURE__ */ new Map(), this.map = e, this.store = t;
	}
	resolveLegendRole(e) {
		return (e?.metadata && typeof e.metadata == "object" ? e.metadata : null)?.legendRole === "background" ? "background" : "overlay";
	}
	findNextStyleLayerId(e) {
		let t = this.map.getStyle()?.layers ?? [];
		for (let n = 0; n < t.length; n += 1) if (t[n].id === e) return t[n + 1]?.id;
	}
	resolveInsertBeforeLayerIdFromOptions(e) {
		if (e?.beforeLayerId) {
			for (let t of this.logicalToNative.get(e.beforeLayerId) ?? []) if (this.map.getLayer(t)) return t;
			if (this.map.getLayer(e.beforeLayerId)) return e.beforeLayerId;
		}
		if (e?.afterLayerId) {
			let t = this.logicalToNative.get(e.afterLayerId) ?? [];
			for (let e = t.length - 1; e >= 0; --e) if (this.map.getLayer(t[e])) return this.findNextStyleLayerId(t[e]);
			if (this.map.getLayer(e.afterLayerId)) return this.findNextStyleLayerId(e.afterLayerId);
		}
	}
	collectBackgroundNativeLayerIds() {
		let e = /* @__PURE__ */ new Set();
		for (let [t, n] of this.logicalToNative.entries()) if ((this.logicalLayerLegendRole.get(t) ?? "overlay") === "background") for (let t of n) e.add(t);
		return e;
	}
	findBackgroundInsertionBeforeLayerId() {
		let e = this.collectBackgroundNativeLayerIds();
		for (let [t, n] of this.logicalToNative.entries()) if (this.logicalLayerLegendRole.get(t) !== "background") {
			for (let t of n) if (!e.has(t)) return t;
		}
	}
	getNativeSourceId(e) {
		return this.logicalSourceToNative.get(e);
	}
	getOrCreateNativeSourceId(e) {
		if (this.logicalSourceToNative.has(e)) return this.logicalSourceToNative.get(e);
		let t = `src-${e.replace(/[^a-zA-Z0-9_-]/g, "-")}-${this.sourceIdCounter++}`;
		return this.logicalSourceToNative.set(e, t), t;
	}
	ensureNativeSource(t, n) {
		if (this.map.getSource(t)) {
			this.nativeSourceToConfig.has(t) || this.nativeSourceToConfig.set(t, n);
			return;
		}
		let r = { type: n.type };
		if (n.type === "raster") {
			if (n.service === "xyz" || n.service === void 0) {
				let e = Array.isArray(n.url) ? n.url : [n.url];
				r = c(e[0]) ? {
					type: "raster",
					url: e[0],
					tileSize: 256
				} : {
					type: "raster",
					tiles: e
				}, "tileSize" in n && (r.tileSize = n.tileSize), "bounds" in n && (r.bounds = n.bounds), typeof n.minzoom == "number" && (r.minzoom = n.minzoom), typeof n.maxzoom == "number" && (r.maxzoom = n.maxzoom), "scheme" in n && (r.scheme = n.scheme), typeof n.attribution == "string" && (r.attribution = n.attribution), typeof n.volatile == "boolean" && (r.volatile = n.volatile);
			} else if (n.service === "wms") {
				let t = n, i = n.tiles, a;
				a = i?.length ? i : [e({
					baseUrl: Array.isArray(t.url) ? t.url[0] : t.url,
					layers: t.layers ?? "",
					version: t.version,
					styles: t.styles,
					format: t.format,
					transparent: t.transparent,
					crs: t.crs,
					tileSize: t.tileSize
				})], r = {
					type: "raster",
					tiles: a
				}, "tileSize" in n && (r.tileSize = n.tileSize), "bounds" in n && (r.bounds = n.bounds), typeof n.minzoom == "number" && (r.minzoom = n.minzoom), typeof n.maxzoom == "number" && (r.maxzoom = n.maxzoom), "scheme" in n && (r.scheme = n.scheme), typeof n.attribution == "string" && (r.attribution = n.attribution), typeof n.volatile == "boolean" && (r.volatile = n.volatile);
			}
		} else if (n.type === "geojson") r = {
			type: "geojson",
			data: n.data
		}, typeof n.attribution == "string" && (r.attribution = n.attribution);
		else if (n.type === "raster-dem") {
			let e = n;
			r = Array.isArray(e.tiles) && e.tiles.length > 0 ? {
				type: "raster-dem",
				tiles: e.tiles
			} : {
				type: "raster-dem",
				url: e.url,
				...c(e.url) ? { tileSize: 256 } : {}
			}, typeof e.tileSize == "number" && (r.tileSize = e.tileSize), typeof e.encoding == "string" && (r.encoding = e.encoding), typeof e.maxzoom == "number" && (r.maxzoom = e.maxzoom), typeof e.attribution == "string" && (r.attribution = e.attribution);
		} else if (n.type === "vector") {
			let e = n;
			r = e.tiles ? {
				type: "vector",
				tiles: e.tiles
			} : {
				type: "vector",
				url: e.url
			}, typeof e.minzoom == "number" && (r.minzoom = e.minzoom), typeof e.maxzoom == "number" && (r.maxzoom = e.maxzoom), typeof e.attribution == "string" && (r.attribution = e.attribution);
		}
		this.map.addSource(t, r), this.nativeSourceToConfig.set(t, n);
	}
	buildNativeLayer(e, t, n, r) {
		let i = {
			id: e,
			type: t.type,
			source: n,
			metadata: { mapLayerId: r }
		};
		return t["source-layer"] && (i["source-layer"] = t["source-layer"]), t.minzoom !== void 0 && (i.minzoom = t.minzoom), t.maxzoom !== void 0 && (i.maxzoom = t.maxzoom), t.paint && typeof t.paint == "object" && (i.paint = t.paint), t.layout && typeof t.layout == "object" && (i.layout = t.layout), Array.isArray(t.filter) && (i.filter = t.filter), i;
	}
	async addAllmapsLayer(e, t, n) {
		let { WarpedMapLayer: r } = await import("./dist-yj_DDg3O.js"), i = `warpedmap-${e}`, a = new r({ layerId: i });
		return this.map.addLayer(a, n), await a.addGeoreferenceAnnotationByUrl(t), this.warpedMapLayers.set(e, a), this.logicalToNative.set(e, [i]), !0;
	}
	registerCompositeSource(e, t) {
		let n = this.getOrCreateNativeSourceId(e);
		return this.ensureNativeSource(n, t), n;
	}
	static {
		this.LAYOUT_KEYS = new Set([
			"text-size",
			"icon-size",
			"text-field",
			"visibility"
		]);
	}
	applyHillshadePaintThrottled(e, t, n) {
		let r = this._pendingHillshade.get(e);
		if (r) {
			r.key = t, r.value = n;
			return;
		}
		let i = requestAnimationFrame(() => {
			let t = this._pendingHillshade.get(e);
			t && (this._pendingHillshade.delete(e), this.map.setPaintProperty(e, t.key, t.value), this.map.triggerRepaint());
		});
		this._pendingHillshade.set(e, {
			key: t,
			value: n,
			rafId: i
		});
	}
	static layerTypeForKey(e) {
		return e.startsWith("fill-extrusion") ? "fill-extrusion" : e.startsWith("text-") || e.startsWith("icon-") ? "symbol" : e.split("-")[0];
	}
	applyStyleProperty(e, n, r) {
		t.LAYOUT_KEYS.has(n) ? (this.map.setLayoutProperty(e, n, r), this.map.triggerRepaint()) : n === "hillshade-exaggeration" ? this.applyHillshadePaintThrottled(e, n, r) : (this.map.setPaintProperty(e, n, r), this.map.triggerRepaint());
	}
	updateLayerStyle(e, n, r) {
		let i = `${e}-${n}`;
		if (this.map.getLayer(i)) {
			for (let [e, t] of Object.entries(r)) this.applyStyleProperty(i, e, t);
			return !0;
		}
		if (e !== n) return !1;
		let a = !1, o = this.logicalToNative.get(e) ?? [];
		for (let e of o) if (this.map.getLayer(e)) for (let [n, i] of Object.entries(r)) {
			let r = t.layerTypeForKey(n);
			e.endsWith(`-${r}`) && (this.applyStyleProperty(e, n, i), a = !0);
		}
		return a;
	}
	async addLayer(e, t) {
		let n = e.id, i = e.metadata?.logicalLayerId, a = i ?? n, o = this.resolveLegendRole(e), s = this.resolveInsertBeforeLayerIdFromOptions(t) ?? (o === "background" ? this.findBackgroundInsertionBeforeLayerId() : void 0);
		if (e.type === "allmaps") {
			let t = await this.addAllmapsLayer(n, e.annotation, s);
			return t && this.logicalLayerLegendRole.set(n, o), t;
		}
		let c = e;
		if (c.type === "background") {
			let e = `${a}-${n}-background`;
			if (!this.map.getLayer(e)) {
				let t = {
					id: e,
					type: "background"
				};
				c.paint && (t.paint = c.paint), c.layout && (t.layout = c.layout), this.map.addLayer(t, s);
			}
			return this.logicalLayerLegendRole.set(a, o), this.logicalToNative.set(a, [e]), !0;
		}
		if (!c.source) return !1;
		let l = e.sources?.[c.source], u = l ? r(c.source, l) : null, d;
		if (u) d = this.getOrCreateNativeSourceId(u.id), this.ensureNativeSource(d, u);
		else {
			let e = c.source;
			d = this.logicalSourceToNative.get(e) ?? e;
		}
		if (!this.map.getSource(d)) return !1;
		let f = u ? u.id : d, p = i ? `${i}-${n}` : `${n}-${f}-${c.type}`;
		this.map.getLayer(p) || (this.map.addLayer(this.buildNativeLayer(p, c, d, a), s), c.type === "hillshade" && this.map.setPaintProperty(p, "hillshade-exaggeration-transition", {
			duration: 0,
			delay: 0
		})), this.logicalLayerLegendRole.set(a, o);
		let m = this.logicalToNative.get(a) ?? [];
		return this.logicalToNative.set(a, Array.from(new Set([...m, p]))), this.nativeLayerToSource.set(p, d), !0;
	}
	moveLayer(e, t) {
		let n = this.logicalToNative.get(e) ?? [], r = t ? this.resolveInsertBeforeLayerIdFromOptions({ beforeLayerId: t }) : void 0;
		for (let e of n) if (this.map.getLayer(e)) try {
			this.map.moveLayer(e, r);
		} catch {}
	}
	removeLayer(e) {
		if (this.warpedMapLayers.has(e)) {
			for (let t of this.logicalToNative.get(e) ?? []) this.map.getLayer(t) && this.map.removeLayer(t);
			this.warpedMapLayers.delete(e), this.logicalToNative.delete(e), this.logicalLayerLegendRole.delete(e);
			return;
		}
		let t = this.logicalToNative.get(e) ?? [], n = /* @__PURE__ */ new Set();
		for (let e of t) {
			let t = this.nativeLayerToSource.get(e);
			t && n.add(t), this.map.getLayer(e) && this.map.removeLayer(e), this.nativeLayerToSource.delete(e);
		}
		this.logicalToNative.delete(e), this.logicalLayerLegendRole.delete(e);
		let r = this.map.getTerrain?.();
		if (r && n.has(r.source)) {
			this.map.setTerrain(null);
			let e = r.source;
			this.map.getSource(e) && !n.has(e) && this.map.removeSource(e);
		}
		for (let e of n) {
			let t = !1;
			for (let n of this.nativeLayerToSource.values()) if (n === e) {
				t = !0;
				break;
			}
			if (!t && this.map.getSource(e)) {
				this.map.removeSource(e);
				for (let [t, n] of this.logicalSourceToNative.entries()) if (n === e) {
					this.logicalSourceToNative.delete(t);
					break;
				}
			}
		}
	}
	getVisibleLayers() {
		return Array.from(this.logicalToNative.keys());
	}
	isLayerVisible(e) {
		return this.logicalToNative.has(e);
	}
	setLayerVisibility(e, t) {
		let n = this.logicalToNative.get(e) ?? [];
		for (let e of n) try {
			this.map.setLayoutProperty(e, "visibility", t ? "visible" : "none");
		} catch {}
	}
	scaleOpacityValue(e, t) {
		if (typeof e == "number") return e * t;
		if (!Array.isArray(e)) return t;
		let [n, ...r] = e;
		if (n === "interpolate" && r.length >= 2) {
			let [e, n, ...i] = r;
			return [
				"interpolate",
				e,
				n,
				...i.map((e, n) => n % 2 == 1 ? this.scaleOpacityValue(e, t) : e)
			];
		}
		if (n === "step" && r.length >= 1) {
			let [e, n, ...i] = r, a = i.map((e, n) => n % 2 == 1 ? this.scaleOpacityValue(e, t) : e);
			return [
				"step",
				e,
				this.scaleOpacityValue(n, t),
				...a
			];
		}
		return t;
	}
	getAuthoredOpacity(e, t, n) {
		let r = this.store.getState().mapLayers?.[e];
		if (!r) return;
		let i = Array.isArray(r.sublayers) ? r.sublayers : null, a;
		if (i) {
			let n = i.find((n) => `${e}-${n.id}` === t);
			a = n?.paint && typeof n.paint == "object" ? n.paint : void 0;
		} else a = r.paint && typeof r.paint == "object" ? r.paint : void 0;
		return a?.[n];
	}
	setLayerOpacity(e, t) {
		let n = this.warpedMapLayers.get(e);
		if (n) {
			n.setOpacity(t);
			return;
		}
		let r = this.logicalToNative.get(e) ?? [];
		for (let n of r) try {
			let r = this.map.getLayer(n), i = r ? x[r.type] : void 0;
			if (!i) continue;
			if (r.type === "hillshade") {
				this.map.setPaintProperty(n, "hillshade-shadow-color", `rgba(0,0,0,${t})`), this.map.setPaintProperty(n, "hillshade-highlight-color", `rgba(255,255,255,${t})`), this.map.setPaintProperty(n, "hillshade-accent-color", `rgba(0,0,0,${t})`);
				continue;
			}
			for (let r of i) {
				let i = this.getAuthoredOpacity(e, n, r);
				i === void 0 ? this.map.setPaintProperty(n, r, t) : t === 1 ? this.map.setPaintProperty(n, r, i) : this.map.setPaintProperty(n, r, this.scaleOpacityValue(i, t));
			}
		} catch {}
	}
	getSourceConfig(e) {
		let t = this.logicalSourceToNative.get(e);
		return t ? this.nativeSourceToConfig.get(t) ?? null : null;
	}
	getSourceData(e) {
		let t = this.logicalSourceToNative.get(e);
		if (!t) return null;
		let n = this.map.getSource(t);
		if (!n || n.type !== "geojson") return null;
		try {
			let e = n.serialize?.()?.data;
			if (typeof e == "string" || e && typeof e == "object") return e;
		} catch {}
		return null;
	}
	setSourceTiles(e, t) {
		let n = this.logicalSourceToNative.get(e) ?? e, r = this.map.getSource(n);
		return typeof r?.setTiles == "function" ? (r.setTiles(t), !0) : !1;
	}
	setSourceParams(e, t) {
		let n = this.getSourceTiles(e);
		if (!n || n.length === 0) return !1;
		let r = n.map((e) => S(e, t));
		return this.setSourceTiles(e, r);
	}
	getSourceTiles(e) {
		let t = this.logicalSourceToNative.get(e) ?? e, n = this.map.getSource(t);
		if (Array.isArray(n?.tiles) && n.tiles.length > 0) return [...n.tiles];
		let r = n?.serialize?.();
		return Array.isArray(r?.tiles) && r.tiles.length > 0 ? [...r.tiles] : typeof r?.url == "string" ? [r.url] : null;
	}
	querySourceFeatures(e, t = {}) {
		let n = this.logicalSourceToNative.get(e);
		if (!n || !this.map.getSource(n)) return null;
		try {
			let e = t.sourceLayer ? { sourceLayer: t.sourceLayer } : void 0, r = this.map.querySourceFeatures(n, e);
			return { features: this.dedupeSourceFeatures(r.map((e) => e.toJSON())) };
		} catch {
			return null;
		}
	}
	getLayerSourceLayers(e) {
		let t = this.logicalToNative.get(e) ?? [], n = /* @__PURE__ */ new Set();
		for (let e of t) {
			let t = this.map.getLayer(e)?.["source-layer"];
			typeof t == "string" && t && n.add(t);
		}
		return [...n];
	}
	async queryLayerFeatures(e, t) {
		let n = this.logicalToNative.get(e) ?? [];
		if (n.length === 0) return {
			type: "FeatureCollection",
			features: []
		};
		let r = n[0], i = this.nativeLayerToSource.get(r), a = i ? this.map.getSource(i) : null;
		if ((a?.type ?? "") === "geojson") {
			try {
				let e = a.serialize?.()?.data;
				if (e && typeof e == "object" && e.type === "FeatureCollection") return e;
			} catch {}
			return {
				type: "FeatureCollection",
				features: []
			};
		}
		try {
			let e = this.map.queryRenderedFeatures(void 0, { layers: n });
			return t?.sourceLayer && (e = e.filter((e) => e.sourceLayer === t.sourceLayer)), l(e.map((e) => {
				let t = e, n = t._x !== void 0 && t._y !== void 0 && t._z !== void 0;
				return {
					feature: e.toJSON(),
					tile: n ? {
						z: t._z,
						x: t._x,
						y: t._y
					} : void 0,
					sourceLayer: e.sourceLayer,
					id: e.id
				};
			}));
		} catch {
			return {
				type: "FeatureCollection",
				features: []
			};
		}
	}
	dedupeSourceFeatures(e) {
		let t = /* @__PURE__ */ new Set();
		return e.filter((e) => {
			let n = JSON.stringify([e.id, e.geometry]);
			return t.has(n) ? !1 : (t.add(n), !0);
		});
	}
	setSourceData(e, t) {
		let n = this.logicalSourceToNative.get(e);
		if (!n) return !1;
		let r = this.map.getSource(n);
		return !r || r.type !== "geojson" || typeof r.setData != "function" ? !1 : (r.setData(t), !0);
	}
	getVisibleWMSLayers() {
		let e = [];
		for (let t of this.logicalToNative.keys()) {
			let n = this.logicalToNative.get(t) ?? [];
			for (let r of n) {
				let n = this.nativeLayerToSource.get(r);
				if (!n) continue;
				let i = this.nativeSourceToConfig.get(n);
				if (i?.type === "raster" && i.service === "wms") {
					let n = i, r = "gfiUrl" in n ? {
						...n,
						url: n.gfiUrl,
						layers: n.gfiLayers,
						version: n.gfiVersion
					} : n;
					e.push({
						layerId: t,
						sourceConfig: r
					});
				}
				break;
			}
		}
		return e;
	}
}, w = class {
	constructor(e, t, n) {
		this.map = e, this.layerService = t, this.store = n;
	}
	async queryFeatures(e, n = {}) {
		let { pixel: r, lngLat: i } = e, a = n.tolerancePx ?? 5, o = [], s = [[r[0] - a, r[1] - a], [r[0] + a, r[1] + a]], c = n.layerIds?.length ? new Set(n.layerIds) : null, l = this.store.getState().mapLayers ?? {}, u = this.map.queryRenderedFeatures(s);
		for (let e of u) {
			let t = this.resolveRegisteredLayerId(e.layer, l);
			if (!t || c && !c.has(t)) continue;
			let n = this.resolveLayerTitle(t, l), r = typeof e.layer?.id == "string" ? e.layer.id : "", i = `${t}-style:`, a = r.startsWith(i) ? r.slice(i.length) : void 0, s = typeof e.layer?.type == "string" ? e.layer.type : void 0;
			o.push({
				layerId: t,
				...n ? { layerTitle: n } : {},
				properties: e.properties,
				geometry: e.geometry,
				source: "vector",
				...a ? { subLayerId: a } : {},
				...s ? { subLayerType: s } : {}
			});
		}
		if (n.includeWMS) {
			let e = this.map.getContainer(), n = e.clientWidth, i = e.clientHeight, a = this.map.getBounds(), s = {
				west: a.getWest(),
				south: a.getSouth(),
				east: a.getEast(),
				north: a.getNorth()
			}, l = this.layerService.getVisibleWMSLayers(), u = await Promise.all(l.filter((e) => !c || c.has(e.layerId)).map((e) => t({
				sourceConfig: e.sourceConfig,
				layerId: e.layerId,
				layerTitle: e.layerTitle,
				bounds: s,
				containerWidth: n,
				containerHeight: i,
				pixelX: r[0],
				pixelY: r[1]
			})));
			for (let e of u) o.push(...e);
		}
		return o;
	}
	resolveRegisteredLayerId(e, t) {
		let n = e.metadata && typeof e.metadata == "object" ? e.metadata : {}, r = typeof n.mapLayerId == "string" ? n.mapLayerId : typeof e.id == "string" ? e.id : null;
		return r && t[r] ? r : null;
	}
	resolveLayerTitle(e, t) {
		let n = t[e];
		return typeof n?.label == "string" && n.label.length > 0 ? n.label : null;
	}
}, T = class {
	constructor(e) {
		this.map = e, this.markers = /* @__PURE__ */ new Map();
	}
	add(e, t, n = {}) {
		this.remove(e);
		let r = n.color ?? "#e63946", a = n.glyph ? document.createElement("div") : void 0;
		a && (a.innerHTML = i(r, n.glyph));
		let o = new u.Marker({
			...a ? {
				element: a,
				anchor: "bottom"
			} : { color: r },
			draggable: n.draggable ?? !1
		}).setLngLat([t[0], t[1]]).addTo(this.map);
		n.onDrag && o.on("drag", () => {
			let e = o.getLngLat();
			n.onDrag([e.lng, e.lat]);
		}), n.onDragEnd && o.on("dragend", () => {
			let e = o.getLngLat();
			n.onDragEnd([e.lng, e.lat]);
		}), this.markers.set(e, o);
	}
	move(e, t) {
		this.markers.get(e)?.setLngLat([t[0], t[1]]);
	}
	remove(e) {
		let t = this.markers.get(e);
		t && (t.remove(), this.markers.delete(e));
	}
}, E = "webmapx-background-color";
u.addProtocol("pmtiles", new s({ metadata: !0 }).tile), u.addProtocol("cog", async (e) => {
	let { cogProtocol: t } = await import("./esm-BDZpFc3m.js");
	return t(e);
});
var D = new Set([
	"raster",
	"geojson",
	"vector",
	"raster-dem"
]), O = new Set(["pmtiles", "cog"]), k = class extends n {
	constructor() {
		super(), this.engineId = "maplibre", this.engineVersion = typeof u.getVersion == "function" ? u.getVersion() : u.version ?? "", this.markerService = null, this.layerService = null, this.pendingCompositeSources = [], this._decomposeComposite = !0, this.backgroundListenerAttached = !1, this.core = new p(this.store, this.events), this.toolService = new m({}), this.logicalLayerExecutor = new a(), this.queryExecutor = new o(this.store), this.queryService = this.queryExecutor, this.mapFactory = new b(), this.core.onMapReady?.((e) => {
			let t = () => {
				let t = new C(e, this.store);
				this.layerService = t;
				for (let { id: e, config: n } of this.pendingCompositeSources) t.registerCompositeSource(e, n);
				this.pendingCompositeSources = [], this.logicalLayerExecutor.bind(t), this.queryExecutor.bind(new w(e, t, this.store)), this.markerService = new T(e);
			};
			if (typeof e?.once == "function") {
				e.once("load", t);
				return;
			}
			t();
		});
	}
	engineSetTerrainEnabled(e, t) {
		let n = t?.id, r = n ? this.layerService?.getNativeSourceId(n) : void 0;
		return this.core.setTerrainEnabled(e, t, r);
	}
	isTerrainEnabled() {
		return this.core.isTerrainEnabled();
	}
	engineSetProjection(e) {
		return this.core.setProjection(e);
	}
	getProjection() {
		return this.core.getProjection();
	}
	getSourceData(e) {
		let t = this.core.getSourceData(e);
		if (t !== null) return t;
		let n = this.layerService?.getNativeSourceId(e);
		if (n && n !== e) {
			let e = this.core.getSourceData(n);
			if (e !== null) return e;
		}
		return this.logicalLayerExecutor.getSourceData(e);
	}
	getSourceConfig(e) {
		return this.layerService?.getSourceConfig(e) ?? super.getSourceConfig(e);
	}
	engineSetSourceTiles(e, t) {
		return this.layerService?.setSourceTiles(e, t) ?? !1;
	}
	engineSetSourceParams(e, t) {
		return this.layerService?.setSourceParams(e, t) ?? !1;
	}
	getSourceTiles(e) {
		return this.layerService?.getSourceTiles(e) ?? null;
	}
	getSource(e) {
		let t = this.core.getSource(e);
		if (t) return t;
		let n = this.layerService?.getNativeSourceId(e);
		if (n && n !== e) {
			let e = this.core.getSource(n);
			if (e) return e;
		}
		return super.getSource(e);
	}
	suppressBusySignalForSource(e) {
		for (let t of this.busySignalIds(e)) this.core.suppressBusySignalForSource(t);
	}
	unsuppressBusySignalForSource(e) {
		for (let t of this.busySignalIds(e)) this.core.unsuppressBusySignalForSource(t);
	}
	busySignalIds(e) {
		let t = this.layerService?.getNativeSourceId(e);
		return t && t !== e ? [e, t] : [e];
	}
	querySourceFeatures(e, t) {
		return this.logicalLayerExecutor.querySourceFeatures(e, t);
	}
	async engineAddLayer(e, t) {
		return await this.logicalLayerExecutor.addLayer(e, t) ? !0 : e?.metadata?.logicalLayerId ? !1 : this.core.addLayer(e, t);
	}
	engineRegisterCompositeSource(e, t) {
		this.layerService ? this.layerService.registerCompositeSource(e, t) : this.pendingCompositeSources.push({
			id: e,
			config: t
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
		return this.core.setBackgroundColor?.(e), this.core.onMapReady?.((t) => {
			let n = t?.getContainer?.();
			n && (n.style.backgroundColor = e ?? "");
			let r = () => {
				if (typeof t.getStyle != "function" || !t.getStyle()) return;
				let n = t.getLayer?.(E);
				if (!e) {
					n && t.removeLayer(E);
					return;
				}
				if (n) {
					t.setPaintProperty(E, "background-color", e);
					return;
				}
				let r = t.getStyle().layers?.[0]?.id;
				t.addLayer({
					id: E,
					type: "background",
					paint: { "background-color": e }
				}, r);
			};
			r(), this.backgroundListenerAttached || (this.backgroundListenerAttached = !0, t.on("styledata", r));
		}), !0;
	}
	getTerrainSourceKind() {
		return "raster-dem";
	}
	getViewProjections() {
		return ["mercator", "globe"];
	}
	renderPrintMap(e, t) {
		return new Promise((n, r) => {
			let i = this.core;
			if (typeof i.onMapReady != "function") {
				r(/* @__PURE__ */ Error("MapLibre map not initialised."));
				return;
			}
			i.onMapReady((i) => {
				d(i, e, t).then(n, r);
			});
		});
	}
	drawableSourceTypes() {
		return D;
	}
	tileProtocols() {
		return O;
	}
};
//#endregion
export { k as MapLibreAdapter };
