import { t as e } from "./lib-CStxbLgN.js";
import { t } from "./wms-feature-info-BjPjL6VU.js";
import { t as n } from "./dom-focus-utils-DlRk2798.js";
import { i as r, n as i, o as a, r as o, s, t as c } from "./view-projections-C5IjVhUX.js";
import { a as l, i as u, n as d, o as f, r as p, t as m } from "./deferred-query-service-B6zKgrLz.js";
import { i as h, n as g } from "./marker-utils-W8OQ8hyL.js";
import { t as ee } from "./vector-tile-features-D3gzYoEP.js";
import { equivalent as te, fromLonLat as _, get as v, getTransform as ne, transform as y, transformExtent as b } from "ol/proj";
import { register as re } from "ol/proj/proj4";
import { VERSION as ie } from "ol/util.js";
import x from "ol/Map";
import S from "ol/View";
import { apply as C, stylefunction as w } from "ol-mapbox-style";
import "ol/ol.css";
import T from "ol/layer/Vector";
import E from "ol/source/Vector";
import ae from "ol/format/GeoJSON";
import { defaults as oe } from "ol/interaction/defaults";
import se from "ol/interaction/KeyboardPan";
import ce from "ol/interaction/KeyboardZoom";
import { noModifierKeys as le, platformModifierKey as ue } from "ol/events/condition";
import D from "ol/layer/Tile";
import de from "ol/source/OSM";
import O from "ol/source/XYZ";
import { Fill as k, Stroke as A, Style as j } from "ol/style";
import { unByKey as fe } from "ol/Observable";
import { intersects as pe } from "ol/extent";
import M from "ol/layer/VectorTile";
import N from "ol/source/VectorTile";
import P from "ol/format/MVT";
import { toFeature as me } from "ol/render/Feature";
import he from "ol/source/ImageWMS";
import ge from "ol/layer/Image";
import _e from "ol/source/TileWMS";
import { createXYZ as F } from "ol/tilegrid";
import { createFromTemplate as ve } from "ol/tileurlfunction";
import ye from "ol/Feature";
import be from "ol/geom/Polygon";
import xe from "ol/style/Style";
import Se from "ol/style/Fill";
import Ce from "ol/Overlay";
//#region src/map/openlayers-services/projection-support.ts
var I = "EPSG:4326", L = /* @__PURE__ */ new Set();
function R(t) {
	if (L.has(t)) return v(t);
	let n = r(t);
	n?.proj4 && (e.defs(t, n.proj4), re(e));
	let i = v(t);
	if (!i) return null;
	if (i.getUnits() === "degrees") return console.error(`[projection] ${t} uses degrees; a view in degrees breaks vector-tile scaling in OpenLayers.`), null;
	if (n?.proj4) {
		let e = Te(t);
		if (!e) return null;
		i.setExtent(e), i.setGlobal(we.has(t));
	}
	return L.add(t), i;
}
var we = new Set([
	"EPSG:6933",
	"ESRI:54009",
	"EPSG:8857",
	"ESRI:54001"
]);
function Te(t) {
	let n = e(I, t), [r, i] = a(t), o = Infinity, s = Infinity, c = -Infinity, l = -Infinity;
	for (let e = -180; e <= 180; e += 2) for (let t = r; t <= i; t += 2) {
		let r;
		try {
			r = n.forward([e, t]);
		} catch {
			continue;
		}
		!Number.isFinite(r[0]) || !Number.isFinite(r[1]) || (o = Math.min(o, r[0]), c = Math.max(c, r[0]), s = Math.min(s, r[1]), l = Math.max(l, r[1]));
	}
	let u = c - o, d = l - s;
	return !Number.isFinite(u) || !Number.isFinite(d) || u <= 0 || d <= 0 || u > Ee ? (console.error(`[projection] ${t} has no usable extent (${u} x ${d}); check its latitudeRange.`), null) : [
		o,
		s,
		c,
		l
	];
}
var Ee = 6e7;
function z(e) {
	return typeof e?.getView == "function" ? e.getView()?.getProjection()?.getCode() ?? "EPSG:3857" : c;
}
function B(e) {
	return z(e);
}
function V(e, t) {
	return y([t[0], t[1]], I, z(e));
}
function H(e, t) {
	return y([t[0], t[1]], z(e), I);
}
//#endregion
//#region src/utils/crs-identifier.ts
var De = {
	CRS84: "EPSG:4326",
	CRS83: "EPSG:4269",
	CRS27: "EPSG:4267",
	84: "EPSG:4326",
	83: "EPSG:4269",
	27: "EPSG:4267"
};
function Oe(e) {
	if (!e) return null;
	let t = e.trim();
	if (!t) return null;
	let n = /^urn:(?:x-)?ogc:def:crs:([^:]+):([^:]*):(.+)$/i.exec(t);
	if (n) return U(n[1], n[3]);
	let r = /^https?:\/\/[^/]*opengis\.net\/def\/crs\/([^/]+)\/[^/]*\/(.+)$/i.exec(t);
	if (r) return U(r[1], r[2]);
	let i = /^https?:\/\/[^/]*opengis\.net\/gml\/srs\/([a-z]+)\.xml#(\d+)$/i.exec(t);
	if (i) return U(i[1], i[2]);
	let a = /^([A-Za-z][A-Za-z0-9_-]*)::?([^:]+)$/.exec(t);
	return a ? U(a[1], a[2]) : /^\d+$/.test(t) ? `EPSG:${t}` : null;
}
function U(e, t) {
	let n = e.trim().toUpperCase(), r = t.trim();
	if (n === "OGC" || n === "CRS") {
		let e = De[r.toUpperCase()];
		if (e) return e;
	}
	return n === "EPSG" && r === "4326" ? "EPSG:4326" : `${n}:${r}`;
}
//#endregion
//#region src/map/openlayers-services/geojson-format.ts
var W = "EPSG:4326", G = class extends ae {
	readProjectionFromObject(e) {
		return v(ke(e)) ?? v(W);
	}
};
function ke(e) {
	let t = Ae(e);
	if (!t) return W;
	let n = Oe(t);
	return !n || n === W ? W : v(n) ? n : (console.warn(`[projection] GeoJSON declares "${t}" (${n}), which this build has no definition for; reading it as ${W}.`), W);
}
function Ae(e) {
	if (!e || typeof e != "object") return null;
	let t = e.crs;
	if (!t || typeof t != "object") return null;
	let { type: n, properties: r } = t;
	return r ? n === "name" && typeof r.name == "string" ? r.name : n === "EPSG" && r.code != null ? `EPSG:${String(r.code)}` : null : null;
}
//#endregion
//#region src/map/openlayers-services/MapCoreService.ts
var je = class e {
	static {
		this.ZOOM_OFFSET = 1;
	}
	constructor(e, t) {
		this.store = e, this.eventBus = t, this.mapInstance = null, this.panDisabled = !1, this.mapReadyCallbacks = [], this.silentSourceIds = /* @__PURE__ */ new Set(), this.initialConfig = {
			center: [10.45, 51.17],
			zoom: 4
		}, this.layerOrderRegistry = null, this.sources = /* @__PURE__ */ new Map(), this.pendingTileLoads = 0;
	}
	toMapCoord(e) {
		return V(this.mapInstance, e);
	}
	toLonLat(e) {
		return H(this.mapInstance, e);
	}
	featureProjection() {
		return B(this.mapInstance);
	}
	toLogicalBearing(e) {
		return -(e.getRotation() || 0) * 180 / Math.PI;
	}
	toOLZoom(t) {
		return t + e.ZOOM_OFFSET;
	}
	fromOLZoom(t) {
		return t - e.ZOOM_OFFSET;
	}
	getViewportState() {
		if (this.mapInstance) {
			let e = this.mapInstance.getView();
			return {
				center: this.toLonLat(e.getCenter() || [0, 0]),
				zoom: this.fromOLZoom(e.getZoom() || 1),
				bearing: this.toLogicalBearing(e),
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
		if (!this.mapInstance) return;
		let r = this.clampZoom(t), i = this.mapInstance.getView();
		n?.animate === !1 ? (i.setCenter(this.toMapCoord(e)), i.setZoom(this.toOLZoom(r))) : i.animate({
			center: this.toMapCoord(e),
			zoom: this.toOLZoom(r),
			duration: 500
		}), r !== t && this.scheduleViewportSync();
	}
	resolveInitialProjection(e) {
		return !e || e === "mercator" || e === "EPSG:3857" ? null : r(e) ? R(e) || (console.warn(`[projection] "${e}" could not be registered; the map is drawn in Web Mercator.`), null) : (console.warn(`[projection] "${e}" is not a view projection this build offers; the map is drawn in Web Mercator.`), null);
	}
	initialize(e, t) {
		let r = t?.center ?? this.initialConfig.center, i = t?.zoom ?? this.initialConfig.zoom, a = this.toOLZoom(i);
		this.minZoom = t?.minZoom, this.maxZoom = t?.maxZoom;
		let s = t?.minZoom, c = t?.maxZoom, l = this.resolveContainer(e), u = this.resolveInitialProjection(t?.projection), d = u?.getCode() ?? "EPSG:3857", f = {
			center: y(o(d, r), "EPSG:4326", d),
			zoom: a,
			multiWorld: !0
		};
		s !== void 0 && (f.minZoom = this.toOLZoom(s)), c !== void 0 && (f.maxZoom = this.toOLZoom(c)), t?.maxBounds && (this.maxBounds = t.maxBounds, f.extent = b(t.maxBounds, "EPSG:4326", d)), u && (f.projection = u), this.mapInstance = new x({
			target: l,
			layers: [],
			view: new S({ ...f }),
			controls: [],
			keyboardEventTarget: document,
			interactions: oe({ keyboard: !1 }).extend([new se({ condition: (e) => le(e) && !n(e.originalEvent) }), new ce({ condition: (e) => !ue(e) && !n(e.originalEvent) })])
		});
		let p = this.mapInstance.getViewport();
		if (p && (p.tabIndex = -1), t?.styleUrl) C(this.mapInstance, t.styleUrl).catch((e) => {
			console.error("[OL CORE] Failed to apply style from URL:", e);
		});
		else if (t?.style) {
			let e = {
				version: 8,
				...t.style
			};
			Array.isArray(e.layers) && e.layers.length > 0 && C(this.mapInstance, e).catch((e) => {
				console.error("[OL CORE] Failed to apply inline style:", e);
			});
		}
		this.mapInstance.once("rendercomplete", () => {
			let e = this.buildViewportFeature();
			this.store.dispatch({
				mapLoaded: !0,
				zoomLevel: i,
				mapCenter: r,
				mapViewportBounds: e
			}, "MAP"), this.flushMapReadyCallbacks();
		}), this.attachLoadingEvents(this.mapInstance), this.attachViewEvents(this.mapInstance.getView()), this.mapInstance.on("moveend", () => {
			this.emitViewChangeEnd();
		}), this.mapInstance.on("pointerdrag", () => {
			this.dispatchViewportBoundsSnapshot(), this.emitViewChange();
		}), this.attachPointerEvents(this.mapInstance);
	}
	attachViewEvents(e) {
		e.on("change:resolution", () => {
			let t = this.fromOLZoom(e.getZoom() || 0), n = this.buildViewportFeature();
			this.store.dispatch({
				zoomLevel: t,
				mapViewportBounds: n
			}, "MAP"), this.eventBus?.emit({
				type: "zoom-end",
				zoom: t
			});
		}), e.on("change:center", () => {
			let t = this.toLonLat(e.getCenter() || [0, 0]), n = this.fromOLZoom(e.getZoom() || 0), r = this.buildViewportFeature();
			this.store.dispatch({
				mapCenter: t,
				zoomLevel: n,
				mapViewportBounds: r
			}, "MAP");
		}), e.on("change:rotation", () => {
			let t = this.toLonLat(e.getCenter() || [0, 0]), n = this.fromOLZoom(e.getZoom() || 0), r = this.buildViewportFeature();
			this.store.dispatch({
				mapCenter: t,
				zoomLevel: n,
				mapViewportBounds: r
			}, "MAP"), this.emitViewChange();
		});
	}
	attachPointerEvents(e) {
		e.on("pointermove", (e) => {
			if (e.dragging && !this.panDisabled) return;
			let t = this.toLonLat(e.coordinate), n = [e.pixel[0], e.pixel[1]], r = this.computePointerResolution();
			this.eventBus?.emit({
				type: "pointer-move",
				coords: t,
				pixel: n,
				resolution: r,
				originalEvent: e.originalEvent
			}), this.store.dispatch({
				pointerCoordinates: t,
				pointerResolution: r
			}, "MAP");
		}), e.getViewport().addEventListener("mouseout", (e) => {
			this.eventBus?.emit({
				type: "pointer-leave",
				originalEvent: e
			}), this.store.dispatch({
				pointerCoordinates: null,
				pointerResolution: null
			}, "MAP");
		}), e.on("click", (e) => {
			let t = this.toLonLat(e.coordinate), n = [e.pixel[0], e.pixel[1]], r = this.computePointerResolution();
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
			let t = this.toLonLat(e.coordinate), n = [e.pixel[0], e.pixel[1]];
			this.eventBus?.emit({
				type: "dblclick",
				coords: t,
				pixel: n,
				originalEvent: e.originalEvent
			});
		}), e.getViewport().addEventListener("pointerdown", (t) => {
			let n = e.getEventPixel(t), r = e.getCoordinateFromPixel(n);
			if (!r) return;
			let i = this.toLonLat(r);
			this.eventBus?.emit({
				type: "pointer-down",
				coords: i,
				pixel: n,
				button: t.button,
				originalEvent: t
			});
		}), e.getViewport().addEventListener("pointerup", (t) => {
			let n = e.getEventPixel(t), r = e.getCoordinateFromPixel(n);
			if (!r) return;
			let i = this.toLonLat(r);
			this.eventBus?.emit({
				type: "pointer-up",
				coords: i,
				pixel: n,
				button: t.button,
				originalEvent: t
			});
		}), e.getViewport().addEventListener("pointercancel", () => {
			this.eventBus?.emit({ type: "pointer-cancel" });
		}), e.getViewport().addEventListener("contextmenu", (t) => {
			t.preventDefault();
			let n = e.getEventPixel(t), r = e.getCoordinateFromPixel(n);
			if (r) {
				let e = this.toLonLat(r);
				this.eventBus?.emit({
					type: "contextmenu",
					coords: e,
					pixel: [n[0], n[1]],
					originalEvent: t
				});
			}
		});
	}
	computePointerResolution() {
		if (!this.mapInstance) return null;
		let e = this.mapInstance.getView().getResolution();
		if (!e) return null;
		let t = e / 111320;
		return {
			lng: t,
			lat: t
		};
	}
	emitViewChange() {
		if (!this.eventBus || !this.mapInstance) return;
		let e = this.mapInstance.getView(), t = this.toLonLat(e.getCenter() || [0, 0]), n = e.calculateExtent(this.mapInstance.getSize()), r = this.toLonLat([n[0], n[1]]), i = this.toLonLat([n[2], n[3]]);
		this.eventBus.emit({
			type: "view-change",
			center: t,
			zoom: this.fromOLZoom(e.getZoom() || 0),
			bearing: this.toLogicalBearing(e),
			pitch: 0,
			bounds: {
				sw: r,
				ne: i
			}
		});
	}
	emitViewChangeEnd() {
		if (!this.eventBus || !this.mapInstance) return;
		let e = this.mapInstance.getView(), t = this.toLonLat(e.getCenter() || [0, 0]), n = e.calculateExtent(this.mapInstance.getSize()), r = this.toLonLat([n[0], n[1]]), i = this.toLonLat([n[2], n[3]]);
		this.eventBus.emit({
			type: "view-change-end",
			center: t,
			zoom: this.fromOLZoom(e.getZoom() || 0),
			bearing: this.toLogicalBearing(e),
			pitch: 0,
			bounds: {
				sw: r,
				ne: i
			}
		});
	}
	setZoom(e) {
		if (this.mapInstance) {
			let t = this.clampZoom(e), n = this.mapInstance.getView();
			if (this.fromOLZoom(n.getZoom() || 0) === t && t !== e) {
				this.scheduleViewportSync();
				return;
			}
			n.setZoom(this.toOLZoom(t));
		}
	}
	getZoom() {
		return this.fromOLZoom(this.mapInstance?.getView().getZoom() || this.toOLZoom(this.initialConfig.zoom));
	}
	getNavigationCapabilities() {
		return {
			bearing: !0,
			pitch: !1,
			keyboard: !0
		};
	}
	getBearing() {
		let e = this.mapInstance?.getView();
		return e ? this.toLogicalBearing(e) : 0;
	}
	setBearing(e) {
		let t = this.mapInstance?.getView();
		t && t.setRotation(-e * Math.PI / 180);
	}
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
	resetNorth() {
		this.setBearing(0);
	}
	resetNorthPitch() {
		this.resetNorth();
	}
	setProjection(e) {
		let t = typeof e == "string" ? e : e.name;
		if (!this.mapInstance || !r(t)) return !1;
		let n = R(t);
		if (!n) return !1;
		let i = this.mapInstance.getView(), a = i.getProjection();
		if (te(a, n)) return !0;
		let c = o(t, this.toLonLat(i.getCenter() ?? [0, 0])), l = (i.getResolution() ?? 1) / s(a.getCode(), c[1]) * s(t, c[1]), u;
		try {
			u = new S({
				projection: n,
				multiWorld: !0,
				center: y(c, "EPSG:4326", t),
				resolution: l,
				rotation: i.getRotation(),
				...this.minZoom === void 0 ? {} : { minZoom: this.toOLZoom(this.minZoom) },
				...this.maxZoom === void 0 ? {} : { maxZoom: this.toOLZoom(this.maxZoom) },
				...this.maxBounds ? { extent: b(this.maxBounds, "EPSG:4326", t) } : {}
			});
		} catch (e) {
			return console.error(`[projection] could not build a view in ${t}; the map was left unchanged.`, e), !1;
		}
		return this.reprojectRenderedGeometry(a.getCode(), t) ? (this.mapInstance.setView(u), this.attachViewEvents(u), this.scheduleViewportSync(), !0) : !1;
	}
	reprojectRenderedGeometry(e, t) {
		if (!this.mapInstance) return !1;
		let n = ne(e, t);
		if (typeof n != "function") return console.error(`[projection] OpenLayers has no transform from ${e} to ${t}; the view was left unchanged.`), !1;
		let r = 0, i = /* @__PURE__ */ new Set(), a = (e) => {
			for (let t of e.getFeatures()) {
				let e = t.getGeometry();
				if (!(!e || i.has(e))) {
					i.add(e);
					try {
						e.applyTransform(n);
					} catch {
						r++;
					}
				}
			}
		}, o = (e) => {
			let t = typeof e?.getSource == "function" ? e.getSource() : null;
			t instanceof E && a(t), (typeof e?.getLayers == "function" ? e.getLayers() : null)?.forEach?.(o);
		};
		for (let e of this.layerOrderRegistry?.sharedVectorSources?.() ?? []) a(e);
		return this.mapInstance.getLayers().forEach(o), this.mapInstance.getOverlays().forEach((e) => {
			let t = e.getPosition();
			if (t) try {
				e.setPosition(n(t, void 0, t.length));
			} catch {
				r++;
			}
		}), r > 0 && console.warn(`[projection] ${r} ${r === 1 ? "feature" : "features"} could not be converted to ${t} and were left where they were.`), !0;
	}
	getProjection() {
		return { name: z(this.mapInstance) };
	}
	scheduleViewportSync() {
		this.mapInstance && requestAnimationFrame(() => {
			if (!this.mapInstance) return;
			let e = this.mapInstance.getView(), t = this.toLonLat(e.getCenter() || [0, 0]), n = this.fromOLZoom(e.getZoom() || 0), r = this.buildViewportFeature();
			this.store.dispatch({
				zoomLevel: n,
				mapCenter: t,
				mapViewportBounds: r
			}, "MAP"), this.emitViewChangeEnd();
		});
	}
	clampZoom(e) {
		let t = e;
		return this.minZoom !== void 0 && (t = Math.max(t, this.minZoom)), this.maxZoom !== void 0 && (t = Math.min(t, this.maxZoom)), t;
	}
	setLayerOrderRegistry(e) {
		this.layerOrderRegistry = e;
	}
	addLayer(e, t) {
		if (!this.mapInstance) return !1;
		let n = e.source, r = this.sources.get(n);
		if (!r) return console.error(`[OL CORE] Source "${n}" not found for layer "${e.id}".`), !1;
		let i = e?.metadata && typeof e.metadata == "object" ? e.metadata : {};
		r.olLayer.__mapLayerId = typeof i.mapLayerId == "string" ? i.mapLayerId : e.id, this.layerOrderRegistry?.registerInlineLayer(r.olLayer.__mapLayerId ?? e.id, r.olLayer, t);
		let a = t?.beforeLayerId, o = t?.afterLayerId;
		if (typeof a == "string") {
			let t = r.layers.findIndex((e) => e?.id === a);
			t >= 0 ? r.layers.splice(t, 0, e) : r.layers.push(e);
		} else if (typeof o == "string") {
			let t = r.layers.findIndex((e) => e?.id === o);
			t >= 0 ? r.layers.splice(t + 1, 0, e) : r.layers.push(e);
		} else r.layers.push(e);
		return this.updateStyle(n), !0;
	}
	removeLayer(e) {
		for (let [t, n] of this.sources.entries()) {
			let r = n.layers.findIndex((t) => t.id === e);
			if (r > -1) {
				n.layers.splice(r, 1), n.layers.length === 0 ? (this.mapInstance?.removeLayer(n.olLayer), this.sources.delete(t), this.layerOrderRegistry?.unregisterInlineLayer(e)) : this.updateStyle(t);
				return;
			}
		}
	}
	addSource(e, t) {
		if (this.sources.has(e)) return;
		let n = new E({ features: new G().readFeatures(t.data, {
			dataProjection: "EPSG:4326",
			featureProjection: this.featureProjection()
		}) });
		n.set("_webmapx_source_id", e);
		let r = new T({ source: n });
		this.sources.set(e, {
			source: n,
			layers: [],
			olLayer: r
		}), this.mapInstance?.addLayer(r);
	}
	removeSource(e) {
		let t = this.sources.get(e);
		t && (this.mapInstance?.removeLayer(t.olLayer), this.sources.delete(e));
	}
	getSource(e) {
		let t = this.sources.get(e);
		if (t) return {
			id: e,
			setData: (e) => {
				t.source.clear(), t.source.addFeatures(new G().readFeatures(e, {
					dataProjection: "EPSG:4326",
					featureProjection: this.featureProjection()
				}));
			}
		};
	}
	project(e) {
		if (!this.mapInstance) return console.warn("[CORE SERVICE - OpenLayers] project called before map instance is ready."), [0, 0];
		let t = this.toMapCoord(e), n = this.mapInstance.getPixelFromCoordinate(t);
		return n ? [n[0], n[1]] : [0, 0];
	}
	unproject(e) {
		if (!this.mapInstance) return null;
		let t = this.mapInstance.getCoordinateFromPixel([e[0], e[1]]);
		return t ? this.toLonLat(t) : null;
	}
	fitBounds(e) {
		if (!this.mapInstance) return;
		let t = this.toMapCoord([e[0], e[1]]), n = this.toMapCoord([e[2], e[3]]), r = [
			t[0],
			t[1],
			n[0],
			n[1]
		];
		this.mapInstance.getView().fit(r, {
			size: this.mapInstance.getSize(),
			padding: [
				40,
				40,
				40,
				40
			],
			duration: 3e3
		});
	}
	setCursor(e) {
		if (!this.mapInstance) return;
		let t = this.mapInstance.getViewport();
		t.style.cursor = e;
	}
	setPanEnabled(e) {
		this.mapInstance && (this.panDisabled = !e, this.mapInstance.getInteractions().forEach((t) => {
			t.constructor?.name === "DragPan" && t.setActive(e);
		}));
	}
	setTouchCaptureEnabled(e) {
		if (!this.mapInstance) return;
		let t = this.mapInstance.getViewport();
		t.style.touchAction = e ? "" : "none";
	}
	setDoubleClickZoomEnabled(e) {}
	setLayerVisibility(e, t) {
		let n = this.sources.get(e);
		n?.olLayer && n.olLayer.setVisible(t);
	}
	getSourceData(e) {
		let t = this.sources.get(e);
		if (!t) return null;
		let n = new G();
		return {
			type: "FeatureCollection",
			features: t.source.getFeatures().map((e) => JSON.parse(n.writeFeature(e, {
				dataProjection: "EPSG:4326",
				featureProjection: this.featureProjection()
			})))
		};
	}
	updateStyle(e) {
		let t = this.sources.get(e);
		if (!t) return;
		let n = {
			version: 8,
			sources: { [e]: { type: "geojson" } },
			layers: t.layers
		};
		w(t.olLayer, n, e);
	}
	suppressBusySignalForSource(e) {
		this.silentSourceIds.add(e);
	}
	unsuppressBusySignalForSource(e) {
		this.silentSourceIds.delete(e);
	}
	onMapReady(e) {
		if (this.mapInstance) {
			e(this.mapInstance);
			return;
		}
		this.mapReadyCallbacks.push(e);
	}
	flushMapReadyCallbacks() {
		this.mapInstance && this.mapReadyCallbacks.splice(0).forEach((e) => {
			try {
				e(this.mapInstance);
			} catch (e) {
				console.error("[OL CORE SERVICE] mapReady callback failed.", e);
			}
		});
	}
	attachLoadingEvents(e) {
		let t = (e) => {
			let t = e.getSource?.();
			if (!t) return;
			let n = t.get?.("_webmapx_source_id");
			t.on?.("tileloadstart", () => {
				n && this.silentSourceIds.has(n) || (this.pendingTileLoads++, this.store.dispatch({ mapBusy: !0 }, "MAP"));
			});
			let r = () => {
				this.pendingTileLoads = Math.max(0, this.pendingTileLoads - 1), this.pendingTileLoads === 0 && this.store.dispatch({ mapBusy: !1 }, "MAP");
			};
			t.on?.("tileloadend", r), t.on?.("tileloaderror", r);
		};
		e.getLayers().forEach(t), e.getLayers().on("add", (e) => {
			t(e.element);
		}), e.on("rendercomplete", () => {
			this.pendingTileLoads === 0 && this.store.dispatch({ mapBusy: !1 }, "MAP");
		}), e.on("loadstart", () => {
			this.store.dispatch({ mapBusy: !0 }, "MAP");
		});
	}
	dispatchViewportBoundsSnapshot() {
		let e = this.buildViewportFeature();
		this.store.dispatch({ mapViewportBounds: e }, "MAP");
	}
	buildViewportFeature() {
		if (!this.mapInstance) return null;
		let e = this.mapInstance.getView(), t = this.mapInstance.getSize();
		if (!t) return null;
		let n = [], r = e.getCenter(), i = e.getResolution();
		if (r && typeof i == "number") {
			let a = e.getRotation(), o = t[0] * i / 2, s = t[1] * i / 2, c = Math.cos(a), l = Math.sin(a), u = (e, t) => {
				let n = [r[0] + e * c - t * l, r[1] + e * l + t * c];
				return this.toLonLat(n);
			};
			n.push(u(-o, -s), u(o, -s), u(o, s), u(-o, s));
		}
		if (n.length === 0) {
			let r = e.calculateExtent(t), i = this.toLonLat([r[0], r[1]]), a = this.toLonLat([r[2], r[3]]);
			n.push([i[0], i[1]], [i[0], a[1]], [a[0], a[1]], [a[0], i[1]]);
		}
		return n.length > 0 && n.push(n[0]), {
			type: "Feature",
			properties: { role: "mapViewport" },
			geometry: {
				type: "Polygon",
				coordinates: [n]
			}
		};
	}
	resolveContainer(e) {
		let t = document.getElementById(e);
		if (!t) throw Error(`Container #${e} not found.`);
		if (t.tagName.toLowerCase() === "webmapx-map") {
			let e = t.querySelector("[slot=\"map-view\"]");
			if (e) return e;
		}
		return t;
	}
}, Me = class {
	constructor() {}
	setBufferRadius(e) {
		console.log(`[OL SERVICE] Set buffer radius to ${e}km.`);
	}
	toggleTool() {
		console.log("[OL SERVICE] Toggled tool activation.");
	}
}, K = class {
	constructor(e, t) {
		this.id = e, this.source = t;
	}
	setData(e) {
		this.source.clear();
		let t = new G().readFeatures(e, { featureProjection: "EPSG:3857" });
		this.source.addFeatures(t);
	}
}, q = class {
	constructor(e, t, n, r) {
		this.id = e, this.layer = t, this.sourceId = n, this.map = r;
	}
	getSource() {
		return new K(this.sourceId, this.layer.getSource());
	}
	remove() {
		this.map.removeLayer(this.layer);
	}
}, J = 1, Ne = class {
	constructor(e) {
		this.map = e, this.sources = new globalThis.Map(), this.layers = new globalThis.Map();
	}
	setViewport(e, t, n, r) {
		this.map.getView().animate({
			center: _(e),
			zoom: t + J,
			rotation: n ? n * Math.PI / 180 : 0,
			duration: 0
		});
	}
	createSource(e, t) {
		if (!this.sources.has(e)) {
			let n = new E({ features: new G().readFeatures(t, { featureProjection: "EPSG:3857" }) });
			this.sources.set(e, n);
		}
		return new K(e, this.sources.get(e));
	}
	getSource(e) {
		let t = this.sources.get(e);
		return t ? new K(e, t) : null;
	}
	createLayer(e) {
		if (!this.layers.has(e.id)) {
			let t = this.sources.get(e.source);
			if (!t) throw Error(`Source "${e.source}" not found. Create source before layer.`);
			let n = new T({
				source: t,
				style: this.createStyle(e)
			});
			n.__layerId = e.id, this.map.addLayer(n), this.layers.set(e.id, n);
		}
		return new q(e.id, this.layers.get(e.id), e.source, this.map);
	}
	getLayer(e) {
		let t = this.layers.get(e);
		return t ? new q(e, t, Array.from(this.sources.entries()).find(([e, n]) => n === t.getSource())?.[0] ?? "", this.map) : null;
	}
	onReady(e) {
		this.map.once("rendercomplete", e), setTimeout(() => {
			this.map.getView() && e();
		}, 0);
	}
	destroy() {
		this.map.setTarget(void 0), this.sources.clear(), this.layers.clear();
	}
	createStyle(e) {
		let t = e.paint || {};
		switch (e.type) {
			case "fill": return new j({
				fill: new k({ color: this.toRgba(t["fill-color"] || "#000000", t["fill-opacity"] ?? 1) }),
				stroke: new A({
					color: this.toRgba(t["fill-color"] || "#000000", t["fill-opacity"] ?? 1),
					width: 1
				})
			});
			case "line": return new j({ stroke: new A({
				color: this.toRgba(t["line-color"] || "#000000", t["line-opacity"] ?? 1),
				width: t["line-width"] || 1
			}) });
			case "circle": return new j({
				fill: new k({ color: "#3399CC" }),
				stroke: new A({
					color: "#fff",
					width: 1
				})
			});
			default: return new j();
		}
	}
	toRgba(e, t) {
		if (e.startsWith("#")) {
			let n = e.slice(1);
			return `rgba(${parseInt(n.slice(0, 2), 16)}, ${parseInt(n.slice(2, 4), 16)}, ${parseInt(n.slice(4, 6), 16)}, ${t})`;
		}
		return e;
	}
}, Pe = class {
	createMap(e, t) {
		let n = t?.center ?? [0, 0], r = (t?.zoom ?? 2) + J, i = new x({
			target: e,
			layers: [new D({ source: t?.tileUrl || Array.isArray(t?.tileUrls) && t.tileUrls.length > 0 ? new O({
				...Array.isArray(t?.tileUrls) && t.tileUrls.length > 0 ? { urls: t.tileUrls } : { url: t?.tileUrl },
				tileSize: t.tileSize ?? 256,
				attributions: t.tileAttribution
			}) : new de({ attributions: t?.tileAttribution }) })],
			view: new S({
				center: _(n),
				zoom: r
			}),
			controls: []
		});
		return t?.interactive === !1 && i.getInteractions().forEach((e) => {
			e.setActive(!1);
		}), new Ne(i);
	}
};
//#endregion
//#region src/map/openlayers-services/filter-prefilter.ts
function Fe(e, t) {
	return Z(e, t) !== !1;
}
function Y(e) {
	if (!Array.isArray(e) || e.length === 0) return !1;
	let [t, ...n] = e;
	return t === "all" ? n.some(Y) : t === "any" ? n.length > 0 && n.every(Y) : X.has(t) && n.length === 2 && Q(n[0], n[1]) !== null && $(n[1]);
}
var X = new Set([
	"==",
	"!=",
	"<",
	"<=",
	">",
	">="
]);
function Z(e, t) {
	if (!Array.isArray(e) || e.length === 0) return null;
	let [n, ...r] = e;
	if (n === "all") {
		let e = !0;
		for (let n of r) {
			let r = Z(n, t);
			if (r === !1) return !1;
			r === null && (e = null);
		}
		return e;
	}
	if (n === "any") {
		let e = !1;
		for (let n of r) {
			let r = Z(n, t);
			if (r === !0) return !0;
			r === null && (e = null);
		}
		return e;
	}
	if (!X.has(n) || r.length !== 2) return null;
	let i = Q(r[0], r[1]);
	return i === null || !$(r[1]) ? null : Le(n, t[i], Ie(r[1]));
}
function Q(e, t) {
	return Array.isArray(e) && e[0] === "get" && e.length === 2 && typeof e[1] == "string" ? e[1] : typeof e == "string" && !Array.isArray(t) && !e.startsWith("$") ? e : null;
}
function $(e) {
	return Array.isArray(e) ? e[0] === "literal" && e.length === 2 && !Array.isArray(e[1]) : e === null || [
		"string",
		"number",
		"boolean"
	].includes(typeof e);
}
function Ie(e) {
	return Array.isArray(e) ? e[1] : e;
}
function Le(e, t, n) {
	if (e === "==") return t === n;
	if (e === "!=") return t !== n;
	if (typeof t != typeof n || typeof t != "number" && typeof t != "string") return !1;
	let r = t, i = n;
	return e === "<" ? r < i : e === "<=" ? r <= i : e === ">" ? r > i : r >= i;
}
//#endregion
//#region src/map/openlayers-services/MapLayerService.ts
var Re = "warpedmap://", ze = [
	-2e7,
	-2e7,
	2e7,
	2e7
];
function Be(e, t) {
	let n = e.indexOf("?"), r = n === -1 ? e : e.slice(0, n + 1) + e.slice(n + 1).replace(/#/g, "%23"), i;
	try {
		i = new URL(r, window.location.href);
	} catch {
		return e;
	}
	for (let [e, n] of Object.entries(t)) {
		for (let t of [...i.searchParams.keys()]) t.toLowerCase() === e.toLowerCase() && i.searchParams.delete(t);
		n !== null && i.searchParams.set(e, n);
	}
	return i.href.replace(/%7B/g, "{").replace(/%7D/g, "}");
}
var Ve = class e {
	static {
		this.LAYOUT_KEYS = new Set([
			"text-size",
			"icon-size",
			"text-field",
			"visibility"
		]);
	}
	constructor(e, t) {
		this.logicalToNative = /* @__PURE__ */ new Map(), this.logicalSourceToNative = /* @__PURE__ */ new Map(), this.nativeLayerToSource = /* @__PURE__ */ new Map(), this.nativeLayerInstances = /* @__PURE__ */ new Map(), this.rasterOpacityAuthored = /* @__PURE__ */ new Map(), this.rasterOpacityFactor = /* @__PURE__ */ new Map(), this.spriteResourceCache = /* @__PURE__ */ new Map(), this.warpedMapLayers = /* @__PURE__ */ new Map(), this.compositeSubLayerCache = /* @__PURE__ */ new Map(), this.geojsonSources = /* @__PURE__ */ new Map(), this.geojsonViews = /* @__PURE__ */ new Map(), this.styleBackedLayerCache = /* @__PURE__ */ new Map(), this.sourceIdCounter = 0, this.map = e, this.store = t;
	}
	findLayerIndexByInstance(e) {
		return this.map.getLayers().getArray().findIndex((t) => t === e);
	}
	resolveInsertIndexFromOptions(e) {
		if (e?.beforeLayerId) {
			let t = this.logicalToNative.get(e.beforeLayerId) ?? [];
			for (let e of t) {
				let t = this.nativeLayerInstances.get(e);
				if (!t) continue;
				let n = this.findLayerIndexByInstance(t);
				if (n >= 0) return n;
			}
			let n = this.map.getLayers().getArray().findIndex((t) => t.__mapLayerId === e.beforeLayerId);
			if (n >= 0) return n;
		}
		if (e?.afterLayerId) {
			let t = this.logicalToNative.get(e.afterLayerId) ?? [];
			for (let e = t.length - 1; e >= 0; --e) {
				let n = this.nativeLayerInstances.get(t[e]);
				if (!n) continue;
				let r = this.findLayerIndexByInstance(n);
				if (r >= 0) return r + 1;
			}
			let n = this.map.getLayers().getArray().findIndex((t) => t.__mapLayerId === e.afterLayerId);
			if (n >= 0) return n + 1;
		}
	}
	resolveInsertIndex(e) {
		let t = this.resolveInsertIndexFromOptions(e);
		if (t !== void 0) return t;
		let n = e?.beforeLayerId ?? e?.afterLayerId;
		if (!n) return;
		let r = e?.beforeLayerId !== void 0, i = 0;
		for (let [e, t] of this.logicalToNative.entries()) {
			if (e === n) return r ? i : i + t.length;
			for (let e of t) this.nativeLayerInstances.has(e) && i++;
		}
	}
	addMapLayerAtIndex(e, t) {
		if (typeof t != "number" || !Number.isFinite(t)) {
			this.map.addLayer(e);
			return;
		}
		let n = this.map.getLayers(), r = Math.max(0, Math.min(t, n.getLength()));
		return n.insertAt(r, e), r + 1;
	}
	sourceIdAliases(e) {
		let t = new Set([e]), n = this.logicalSourceToNative.get(e);
		n && t.add(n);
		for (let [n, r] of this.logicalSourceToNative.entries()) r === e && t.add(n);
		return t;
	}
	setSourceTiles(e, t) {
		let [n] = t;
		if (!n) return !1;
		let r = !1, i = this.sourceIdAliases(e);
		for (let [e, t] of this.nativeLayerToSource.entries()) {
			if (!i.has(t)) continue;
			let a = this.nativeLayerInstances.get(e)?.getSource?.();
			if (a) if (typeof a.updateParams == "function") {
				let { params: e } = this.parseUrlParams(n), t = {};
				for (let [n, r] of Object.entries(e)) t[n.toUpperCase()] = r;
				let i = a.getParams?.();
				if (i) for (let e of Object.keys(i)) e.toUpperCase() in t || delete i[e];
				a.updateParams(t), r = !0;
			} else typeof a.setUrl == "function" && (a.setUrl(n), r = !0);
		}
		return r;
	}
	setSourceParams(e, t) {
		let n = this.sourceIdAliases(e), r = !1;
		for (let [e, i] of this.nativeLayerToSource.entries()) {
			if (!n.has(i)) continue;
			let a = this.nativeLayerInstances.get(e)?.getSource?.();
			if (!a) continue;
			if (typeof a.updateParams == "function") {
				let e = a.getParams?.(), n = {};
				for (let [r, i] of Object.entries(t)) {
					if (e) for (let t of Object.keys(e)) t.toLowerCase() === r.toLowerCase() && delete e[t];
					i !== null && (n[r.toUpperCase()] = i);
				}
				a.updateParams(n), r = !0;
				continue;
			}
			let o = a.getUrls?.()?.[0] ?? a.getUrl?.();
			typeof o != "string" || typeof a.setUrl != "function" || (a.setUrl(Be(o, t)), r = !0);
		}
		return r;
	}
	getSourceTiles(e) {
		let t = this.sourceIdAliases(e);
		for (let [e, n] of this.nativeLayerToSource.entries()) {
			if (!t.has(n)) continue;
			let r = this.nativeLayerInstances.get(e)?.getSource?.();
			if (!r) continue;
			let i = r.getUrls?.()?.[0] ?? r.getUrl?.();
			if (typeof i != "string") continue;
			let a = r.getParams?.();
			if (!a) return [i];
			let o = new URL(i, window.location.href);
			for (let [e, t] of Object.entries(a)) t != null && o.searchParams.set(e, String(t));
			return [o.href.replace(/%7B/g, "{").replace(/%7D/g, "}")];
		}
		return null;
	}
	getOrCreateNativeSourceId(e) {
		if (this.logicalSourceToNative.has(e.id)) return this.logicalSourceToNative.get(e.id);
		let t = `src-${e.id}-${this.sourceIdCounter++}`;
		return this.logicalSourceToNative.set(e.id, t), t;
	}
	isWarpedMapSource(e) {
		return e.type === "raster" && "url" in e ? (Array.isArray(e.url) ? e.url[0] : e.url).startsWith(Re) : !1;
	}
	parseWarpedMapUrl(e) {
		return e.startsWith(Re) ? "https://" + e.slice(12) : e;
	}
	async addWarpedMapLayer(e, t, n) {
		let { WarpedMapLayer: r } = await import("./dist-BdJRhgqw.js"), i = `warpedmap-${e}`, a = new r(), o = a;
		return typeof o.getDeclutter != "function" && (o.getDeclutter = () => !1), typeof o.renderDeferred != "function" && (o.renderDeferred = () => {}), this.addMapLayerAtIndex(a, n), await a.addGeoreferenceAnnotationByUrl(t), this.warpedMapLayers.set(e, a), this.nativeLayerInstances.set(i, a), this.logicalToNative.set(e, [i]), !0;
	}
	async addLayer(e, t) {
		let n = e.id, r = this.resolveInsertIndex(t);
		if (e.type === "allmaps") return this.addWarpedMapLayer(n, e.annotation, r);
		if (e.type === "style") {
			let n = l(e);
			return n ? this.addCompositeLayer(n, t) : !1;
		}
		let i = e;
		if (!i.source) return !1;
		let a = e.sources?.[i.source], o = a ? f(i.source, a) : null;
		if (!o) return !1;
		if (this.isWarpedMapSource(o)) {
			let e = Array.isArray(o.url) ? o.url[0] : o.url, t = this.parseWarpedMapUrl(e);
			return this.addWarpedMapLayer(n, t, r);
		}
		let s = this.getOrCreateNativeSourceId(o), c = [], u = `${n}-${o.id}-${i.type}`;
		if (!this.nativeLayerInstances.has(u)) {
			let e = await this.createLayer(u, i, o);
			e && (e.__mapLayerId = n, this.addMapLayerAtIndex(e, r), this.nativeLayerInstances.set(u, e), this.compositeSubLayerCache.set(u, {
				spec: i,
				sourceConfig: o
			}));
		}
		return c.push(u), this.nativeLayerToSource.set(u, s), this.logicalToNative.set(n, this.mergeNativeLayerIds(n, c)), c.length > 0;
	}
	async addCompositeLayer(e, t) {
		let n = e.styleId, r = this.resolveInsertIndex(t), i = e.rawConfig, a = [];
		for (let t of e.subLayers.filter((e) => e.type === "background")) {
			let e = `${n}-${t.id}`;
			if (!this.nativeLayerInstances.has(e)) {
				let i = this.createBackgroundLayer(t);
				i.__mapLayerId = n, r = this.addMapLayerAtIndex(i, r), this.nativeLayerInstances.set(e, i);
			}
			a.push(e);
		}
		let o = e.sources.filter((e) => e.config.type === "vector");
		if (o.length > 0 && typeof e.metadata?.styleUrl == "string") {
			let t = e.subLayers.filter((e) => e.type === "raster");
			for (let i of t) {
				let t = u(e, i.source);
				if (!t || t.config.type !== "raster") continue;
				let o = `${n}-${i.id}`;
				if (!this.nativeLayerInstances.has(o)) {
					let e = await this.createLayer(o, i, t.config);
					e && (e.__mapLayerId = n, r = this.addMapLayerAtIndex(e, r), this.nativeLayerInstances.set(o, e), this.compositeSubLayerCache.set(o, {
						spec: i,
						sourceConfig: t.config
					}), this.nativeLayerToSource.set(o, this.getOrCreateNativeSourceId(t.config)));
				}
				a.push(o);
			}
			for (let e of o) {
				if (!this.isStyleBackedVectorSource(i, e.config)) continue;
				let t = this.getOrCreateNativeSourceId(e.config), o = `${n}-${e.config.id}-vector-style`;
				if (!this.nativeLayerInstances.has(o)) {
					let t = await this.createStyleBackedVectorTileLayer(o, i, e.config);
					if (!t) return !1;
					let { layer: a, mapboxLayerIds: s, spriteResources: c } = t;
					a.__mapLayerId = n, r = this.addMapLayerAtIndex(a, r), this.nativeLayerInstances.set(o, a), this.styleBackedLayerCache.set(o, {
						layer: a,
						layerConfig: i,
						sourceConfig: e.config,
						mapboxLayerIds: s,
						spriteResources: c
					});
				}
				a.push(o), this.nativeLayerToSource.set(o, t);
			}
		} else for (let t of e.subLayers) {
			let i = u(e, t.source);
			if (!i) continue;
			let o = this.getOrCreateNativeSourceId(i.config), s = `${n}-${t.id}`;
			if (!this.nativeLayerInstances.has(s)) {
				let e = await this.createLayer(s, t, i.config);
				e && (e.__mapLayerId = n, r = this.addMapLayerAtIndex(e, r), this.nativeLayerInstances.set(s, e), this.compositeSubLayerCache.set(s, {
					spec: t,
					sourceConfig: i.config
				}));
			}
			a.push(s), this.nativeLayerToSource.set(s, o);
		}
		return this.logicalToNative.set(n, this.mergeNativeLayerIds(n, a)), a.length > 0;
	}
	updateLayerStyle(e, t, n) {
		let r = `${e}-${t}`;
		return this.rebuildWithPaint(r, n) || e === t && this.updateStandardLayerStyle(e, n) ? !0 : this.updateStyleBackedSubLayer(e, t, n);
	}
	static layerTypeForKey(e) {
		return e.startsWith("fill-extrusion") ? "fill-extrusion" : e.startsWith("text-") || e.startsWith("icon-") ? "symbol" : e.split("-")[0];
	}
	updateStandardLayerStyle(t, n) {
		let r = !1;
		for (let i of this.logicalToNative.get(t) ?? []) {
			let t = Object.fromEntries(Object.entries(n).filter(([t]) => i.endsWith(`-${e.layerTypeForKey(t)}`)));
			Object.keys(t).length !== 0 && this.rebuildWithPaint(i, t) && (r = !0);
		}
		return r;
	}
	rebuildWithPaint(e, t) {
		let n = this.compositeSubLayerCache.get(e), r = this.nativeLayerInstances.get(e);
		if (!n || !r) return !1;
		let i = {
			...n.spec,
			paint: {
				...n.spec.paint ?? {},
				...t
			}
		};
		if (n.sourceConfig.type === "geojson" && r instanceof T && [
			"fill",
			"line",
			"circle",
			"symbol"
		].includes(i.type)) return this.applyGeoJSONStyle(r, e, n.sourceConfig, i), this.compositeSubLayerCache.set(e, {
			spec: i,
			sourceConfig: n.sourceConfig
		}), !0;
		let a = this.findLayerIndexByInstance(r);
		return this.createLayer(e, i, n.sourceConfig).then((t) => {
			if (!t) return;
			t.__mapLayerId = r.__mapLayerId;
			let o = this.map.getLayers(), s = this.findLayerIndexByInstance(r);
			s >= 0 ? (o.removeAt(s), o.insertAt(s, t)) : a >= 0 ? o.insertAt(Math.min(a, o.getLength()), t) : this.map.addLayer(t), this.nativeLayerInstances.set(e, t), this.compositeSubLayerCache.set(e, {
				spec: i,
				sourceConfig: n.sourceConfig
			});
		}), !0;
	}
	updateStyleBackedSubLayer(t, n, r) {
		for (let [i, a] of this.styleBackedLayerCache) {
			if (!i.startsWith(`${t}-`)) continue;
			let o = (a.layerConfig.layers ?? []).find((e) => e.id === n);
			if (!o) continue;
			for (let [t, n] of Object.entries(r)) e.LAYOUT_KEYS.has(t) ? o.layout = {
				...o.layout ?? {},
				[t]: n
			} : o.paint = {
				...o.paint ?? {},
				[t]: n
			};
			let s = this.buildStyleBackedGlStyle(a.layerConfig, a.sourceConfig);
			return w(a.layer, s, a.mapboxLayerIds, void 0, a.spriteResources?.spriteData, a.spriteResources?.spriteImageUrl), a.layer.changed(), !0;
		}
		return !1;
	}
	mergeNativeLayerIds(e, t) {
		let n = this.logicalToNative.get(e) ?? [];
		return Array.from(new Set([...n, ...t]));
	}
	isStyleBackedVectorSource(e, t) {
		let n = e?.metadata;
		return t.type === "vector" && typeof n?.styleUrl == "string" && e.type === "style" && Array.isArray(e.layers) && e.layers.length > 0;
	}
	async createStyleBackedVectorTileLayer(e, t, n) {
		let r = await this.resolveVectorTileSourceInfo(n);
		if (!r) return null;
		let { urlTemplate: i, minZoom: a, maxZoom: o } = r, s = new M({
			source: new N({
				format: new P(),
				attributions: n.attribution,
				...a === void 0 ? {} : { minZoom: a },
				...o === void 0 ? {} : { maxZoom: o },
				...o === void 0 ? { url: i } : { tileUrlFunction: this.createClampedVectorTileUrlFunction(i, o) }
			}),
			declutter: !0
		}), c = this.buildStyleBackedGlStyle(t, n), l = await this.resolveStyleSpriteResources(t?.metadata ?? {}), u = (t.type === "style" ? t.layers ?? [] : []).map((e) => typeof e.id == "string" ? e.id : null).filter((e) => typeof e == "string" && e.length > 0), d = u.length > 0 ? u : n.id;
		return w(s, c, d, void 0, l?.spriteData, l?.spriteImageUrl), s.__layerId = e, {
			layer: s,
			mapboxLayerIds: d,
			spriteResources: l ?? null
		};
	}
	buildStyleBackedGlStyle(e, t) {
		let n = e?.metadata ?? {}, r = e.type === "style" ? e.layers ?? [] : [], i = { type: "vector" };
		typeof t.url == "string" && t.url.length > 0 && (i.url = t.url);
		let a = Array.isArray(t.tiles) ? t.tiles.filter((e) => typeof e == "string" && e.length > 0) : [];
		return a.length > 0 && (i.tiles = a), typeof t.minzoom == "number" && (i.minzoom = t.minzoom), typeof t.attribution == "string" && (i.attribution = t.attribution), {
			version: 8,
			...typeof n.styleSpriteUrl == "string" ? { sprite: n.styleSpriteUrl } : {},
			...typeof n.styleGlyphsUrl == "string" ? { glyphs: n.styleGlyphsUrl } : {},
			sources: { [t.id]: i },
			layers: r.map((e) => ({
				id: e.id,
				type: e.type,
				source: t.id,
				...typeof e["source-layer"] == "string" ? { "source-layer": e["source-layer"] } : {},
				...typeof e.minzoom == "number" ? { minzoom: e.minzoom } : {},
				...typeof e.maxzoom == "number" ? { maxzoom: e.maxzoom } : {},
				...e.filter ? { filter: e.filter } : {},
				...e.layout ? { layout: e.layout } : {},
				...e.paint ? { paint: e.paint } : {}
			}))
		};
	}
	async resolveStyleSpriteResources(e) {
		let t = typeof e.styleSpriteUrl == "string" ? e.styleSpriteUrl : null;
		return t ? (this.spriteResourceCache.has(t) || this.spriteResourceCache.set(t, (async () => {
			try {
				let e = this.buildSpriteAssetUrl(t, ".json"), n = await fetch(e);
				if (!n.ok) return null;
				let r = await n.json();
				return typeof r != "object" || !r || Array.isArray(r) ? null : {
					spriteData: r,
					spriteImageUrl: this.buildSpriteAssetUrl(t, ".png")
				};
			} catch {
				return null;
			}
		})()), this.spriteResourceCache.get(t) ?? null) : null;
	}
	buildSpriteAssetUrl(e, t) {
		try {
			let n = new URL(e);
			return n.pathname.endsWith(t) || (n.pathname = `${n.pathname}${t}`), n.toString();
		} catch {
			return e.endsWith(t) ? e : `${e}${t}`;
		}
	}
	async createLayer(e, t, n) {
		if (t.type === "raster" && n.type === "raster") {
			if (n.service === "xyz") return this.createXYZLayer(e, n, t);
			if (n.service === "wms") return this.createWMSLayer(e, n, t);
		} else if ([
			"fill",
			"line",
			"circle",
			"symbol"
		].includes(t.type) && n.type === "geojson") return this.createGeoJSONLayer(e, n, t);
		else if ([
			"fill",
			"line",
			"circle",
			"symbol"
		].includes(t.type) && n.type === "vector") return this.createVectorTileLayer(e, n, t);
		return null;
	}
	createBackgroundLayer(e) {
		let t = 20037508.342789244, n = [
			[-20037508.342789244, -20037508.342789244],
			[t, -20037508.342789244],
			[t, t],
			[-20037508.342789244, t],
			[-20037508.342789244, -20037508.342789244]
		], r = e.paint ?? {}, i = typeof r["background-color"] == "string" ? r["background-color"] : "#ffffff", a = new ye({ geometry: new be([n]) });
		return a.setStyle(new xe({ fill: new Se({ color: i }) })), new T({
			source: new E({ features: [a] }),
			opacity: this.getLiteralNumberValue(r["background-opacity"], 1)
		});
	}
	async resolveVectorTileUrl(e) {
		return (await this.resolveVectorTileSourceInfo(e))?.urlTemplate ?? null;
	}
	async resolveVectorTileSourceInfo(e) {
		let t = typeof e.minzoom == "number" ? e.minzoom : void 0, n = typeof e.maxzoom == "number" ? e.maxzoom : void 0, r = Array.isArray(e.tiles) ? e.tiles.filter((e) => typeof e == "string") : [];
		if (r.length > 0) return {
			urlTemplate: r[0],
			...t === void 0 ? {} : { minZoom: t },
			...n === void 0 ? {} : { maxZoom: n }
		};
		let i = e.url;
		if (typeof i != "string" || i.length === 0) return null;
		if (i.includes("{z}") && i.includes("{x}") && i.includes("{y}")) return {
			urlTemplate: i,
			...t === void 0 ? {} : { minZoom: t },
			...n === void 0 ? {} : { maxZoom: n }
		};
		try {
			let e = await fetch(i);
			if (!e.ok) return null;
			let r = await e.json();
			if (Array.isArray(r?.tiles)) {
				let e = r.tiles.find((e) => typeof e == "string");
				if (typeof e == "string") return {
					urlTemplate: e,
					...t === void 0 ? typeof r?.minzoom == "number" ? { minZoom: r.minzoom } : {} : { minZoom: t },
					...n === void 0 ? typeof r?.maxzoom == "number" ? { maxZoom: r.maxzoom } : {} : { maxZoom: n }
				};
			}
		} catch {
			return null;
		}
		return null;
	}
	createClampedVectorTileUrlFunction(e, t) {
		let n = ve(e, null);
		return (e, r, i) => {
			if (!e || e.length < 3) return;
			let [a, o, s] = e;
			if (!Number.isInteger(a) || !Number.isInteger(o) || !Number.isInteger(s) || a <= t) return n(e, r, i);
			let c = 2 ** (a - t);
			return n([
				t,
				Math.floor(o / c),
				Math.floor(s / c)
			], r, i);
		};
	}
	createBboxTileUrlFunction(e) {
		let t = F();
		return (n) => {
			if (!n || n.length < 3) return;
			let [, r, i] = n, a = t.getTileCoordExtent(n).join(",");
			return e[Math.abs(r + i) % e.length].replace("{bbox-epsg-3857}", a);
		};
	}
	getLiteralNumberValue(e, t) {
		return typeof e == "number" && Number.isFinite(e) ? e : t;
	}
	bindDynamicRasterOpacity(e, t, n) {
		this.rasterOpacityAuthored.set(t, n), this.applyRasterOpacity(t), !(typeof n != "object" || !n) && this.map.getView().on("change:resolution", () => this.applyRasterOpacity(t));
	}
	applyRasterOpacity(e) {
		let t = this.nativeLayerInstances.get(e), n = this.rasterOpacityAuthored.get(e);
		if (!t || n === void 0) return;
		let r = this.rasterOpacityFactor.get(e) ?? 1, i = this.map.getView().getZoom() ?? 0, a = typeof n == "number" ? n : h(n, { properties: {} }, i, 1);
		t.setOpacity(a * r);
	}
	createVectorTileLayer(e, t, n) {
		return this.resolveVectorTileSourceInfo(t).then((r) => {
			if (!r) return null;
			let { urlTemplate: i, minZoom: a, maxZoom: o } = r, s = new M({
				source: new N({
					format: new P(),
					attributions: t.attribution,
					...a === void 0 ? {} : { minZoom: a },
					...o === void 0 ? {} : { maxZoom: o },
					...o === void 0 ? { url: i } : { tileUrlFunction: this.createClampedVectorTileUrlFunction(i, o) }
				}),
				minZoom: n.minzoom,
				maxZoom: n.maxzoom
			}), c = e, l = n.id ?? e;
			return w(s, {
				version: 8,
				sources: { [c]: {
					type: "vector",
					tiles: [i]
				} },
				layers: [{
					...n,
					id: l,
					source: c
				}]
			}, [l]), s.__layerId = e, s;
		});
	}
	createXYZLayer(e, t, n) {
		let r = Array.isArray(t.url) ? t.url : [t.url], i = new D({
			source: r.some((e) => e.includes("{bbox-epsg-3857}")) ? new O({
				tileUrlFunction: this.createBboxTileUrlFunction(r),
				tileSize: t.tileSize,
				attributions: t.attribution,
				minZoom: t.minzoom,
				maxZoom: t.maxzoom
			}) : new O({
				urls: r,
				tileSize: t.tileSize,
				attributions: t.attribution,
				minZoom: t.minzoom,
				maxZoom: t.maxzoom
			}),
			minZoom: n.minzoom,
			maxZoom: n.maxzoom,
			opacity: this.getLiteralNumberValue(n.paint?.["raster-opacity"], 1)
		});
		return this.bindDynamicRasterOpacity(i, e, n.paint?.["raster-opacity"]), i.__layerId = e, i;
	}
	createWMSLayer(e, t, n) {
		let r = Array.isArray(t.url) ? t.url[0] : t.url;
		if (r.includes("{bbox-epsg-3857}")) return this.createXYZLayer(e, t, n);
		let { baseUrl: i, params: a } = this.parseUrlParams(r), o = new Set(Object.keys(a).map((e) => e.toLowerCase()));
		o.has("format") || (a.FORMAT = t.format || "image/png"), o.has("transparent") || (a.TRANSPARENT = t.transparent === !1 ? "false" : "true"), t.layers && !o.has("layers") && (a.LAYERS = t.layers), t.styles && !o.has("styles") && (a.STYLES = t.styles), t.version && !o.has("version") && (a.VERSION = t.version);
		let s;
		if (t.tileSize) {
			let e = F({
				tileSize: t.tileSize,
				minZoom: t.minzoom,
				maxZoom: t.maxzoom
			});
			s = new D({
				source: new _e({
					url: i,
					params: a,
					attributions: t.attribution,
					tileGrid: e
				}),
				minZoom: n.minzoom,
				maxZoom: n.maxzoom,
				opacity: this.getLiteralNumberValue(n.paint?.["raster-opacity"], 1)
			});
		} else s = new ge({
			source: new he({
				url: i,
				params: a,
				attributions: t.attribution,
				ratio: 1
			}),
			minZoom: n.minzoom,
			maxZoom: n.maxzoom,
			opacity: this.getLiteralNumberValue(n.paint?.["raster-opacity"], 1)
		});
		return this.bindDynamicRasterOpacity(s, e, n.paint?.["raster-opacity"]), s.__layerId = e, s;
	}
	parseUrlParams(e) {
		let t = e.indexOf("?");
		if (t === -1) return {
			baseUrl: e,
			params: {}
		};
		let n = e.substring(0, t), r = e.substring(t + 1), i = {};
		for (let e of r.split("&")) {
			let t = e.indexOf("=");
			if (t !== -1) {
				let n = e.substring(0, t);
				i[n] = decodeURIComponent(e.substring(t + 1));
			} else e && (i[e] = "");
		}
		return {
			baseUrl: n,
			params: i
		};
	}
	createGeoJSONLayer(e, t, n) {
		let r = this.getOrCreateNativeSourceId(t), i = this.geojsonSources.get(r);
		i || (i = new E({
			features: typeof t.data == "string" ? void 0 : new G().readFeatures(t.data, { featureProjection: B(this.map) }),
			url: typeof t.data == "string" ? t.data : void 0,
			format: typeof t.data == "string" ? new G() : void 0,
			attributions: t.attribution
		}), this.geojsonSources.set(r, i));
		let a = new T({
			source: Y(n.filter) ? this.filteredView(r, i, n.filter) : i,
			minZoom: n.minzoom,
			maxZoom: n.maxzoom,
			declutter: n.type === "symbol" || n.type === "circle"
		});
		return this.applyGeoJSONStyle(a, e, t, n), a.__layerId = e, a;
	}
	filteredView(e, t, n) {
		let r = JSON.stringify(n), i = this.geojsonViews.get(e);
		i || (i = /* @__PURE__ */ new Map(), this.geojsonViews.set(e, i));
		let a = i.get(r);
		if (a) return a.source;
		let o = (e) => !!e && Fe(n, e.getProperties()), s = new E({ features: t.getFeatures().filter(o) }), c = [], l = () => {
			let e = c;
			c = [], s.addFeatures(e);
		}, u = [
			t.on("addfeature", (e) => {
				o(e.feature) && (c.length === 0 && queueMicrotask(l), c.push(e.feature));
			}),
			t.on("removefeature", (e) => {
				e.feature && s.hasFeature(e.feature) && s.removeFeature(e.feature);
			}),
			t.on("clear", () => {
				c = [], s.clear(!0);
			})
		];
		return i.set(r, {
			source: s,
			keys: u
		}), this.ensureLoaded(t), s;
	}
	ensureLoaded(e) {
		if (!e.getUrl() || e.__webmapxLoadRequested) return;
		e.__webmapxLoadRequested = !0;
		let t = v(B(this.map));
		t && e.loadFeatures([
			-Infinity,
			-Infinity,
			Infinity,
			Infinity
		], 1, t);
	}
	sharedVectorSources() {
		return this.geojsonSources.values();
	}
	featureSourceOf(e, t) {
		let n = this.nativeLayerToSource.get(e);
		return (n ? this.geojsonSources.get(n) : void 0) ?? t?.getSource?.();
	}
	applyGeoJSONStyle(e, t, n, r) {
		let i = t, a = r.id ?? t;
		w(e, {
			version: 8,
			sources: { [i]: {
				type: "geojson",
				data: n.data ?? {
					type: "FeatureCollection",
					features: []
				}
			} },
			layers: [{
				...r,
				id: a,
				source: i
			}]
		}, [a]);
	}
	moveLayer(e, t) {
		let n = (this.logicalToNative.get(e) ?? []).map((e) => this.nativeLayerInstances.get(e)).filter((e) => !!e);
		if (n.length === 0) return;
		let r = this.map.getLayers(), i = t ? this.resolveInsertIndex({ beforeLayerId: t }) : void 0;
		i === void 0 && (i = r.getLength());
		for (let e of n) {
			let t = this.findLayerIndexByInstance(e);
			t !== -1 && (r.removeAt(t), t < i && i--);
		}
		i = Math.max(0, Math.min(i, r.getLength())), n.forEach((e, t) => r.insertAt(i + t, e));
	}
	removeLayer(e) {
		if (this.warpedMapLayers.has(e)) {
			let t = this.warpedMapLayers.get(e);
			this.map.removeLayer(t);
			let n = this.logicalToNative.get(e) || [];
			for (let e of n) this.nativeLayerInstances.delete(e);
			this.warpedMapLayers.delete(e), this.logicalToNative.delete(e);
			return;
		}
		let t = this.logicalToNative.get(e) || [], n = /* @__PURE__ */ new Set();
		for (let e of t) {
			let t = this.nativeLayerToSource.get(e);
			t && n.add(t);
			let r = this.nativeLayerInstances.get(e);
			r && (this.map.removeLayer(r), this.nativeLayerInstances.delete(e)), this.nativeLayerToSource.delete(e), this.compositeSubLayerCache.delete(e);
		}
		this.logicalToNative.delete(e);
		for (let e of n) {
			let t = !1;
			for (let n of this.nativeLayerToSource.values()) if (n === e) {
				t = !0;
				break;
			}
			if (!t) {
				this.geojsonSources.delete(e);
				for (let t of this.geojsonViews.get(e)?.values() ?? []) fe(t.keys);
				this.geojsonViews.delete(e);
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
		for (let e of n) this.nativeLayerInstances.get(e)?.setVisible(t);
	}
	setLayerOpacity(e, t) {
		let n = this.logicalToNative.get(e) ?? [];
		for (let e of n) {
			if (this.rasterOpacityAuthored.has(e)) {
				this.rasterOpacityFactor.set(e, t), this.applyRasterOpacity(e);
				continue;
			}
			this.nativeLayerInstances.get(e)?.setOpacity(t);
		}
	}
	hasSourceData(e) {
		let t = this.logicalSourceToNative.get(e);
		return t ? this.geojsonSources.has(t) : !1;
	}
	getSourceData(e) {
		let t = this.logicalSourceToNative.get(e);
		if (!t) return null;
		let n = new G();
		for (let [e, r] of this.nativeLayerToSource.entries()) {
			if (r !== t) continue;
			let i = this.nativeLayerInstances.get(e), a = this.featureSourceOf(e, i);
			if (!a || typeof a.getFeatures != "function") continue;
			let o = a.getFeatures().map((e) => JSON.parse(n.writeFeature(e, {
				dataProjection: "EPSG:4326",
				featureProjection: B(this.map)
			})));
			if (o.length === 0 && typeof a.getUrl == "function") {
				let e = a.getUrl();
				if (typeof e == "string") return e;
			}
			return {
				type: "FeatureCollection",
				features: o
			};
		}
		return null;
	}
	getLayerSourceLayers(e) {
		let t = this.logicalToNative.get(e) ?? [], n = /* @__PURE__ */ new Set();
		for (let e of t) {
			let t = this.compositeSubLayerCache.get(e)?.spec?.["source-layer"];
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
		let r = new G(), i = [], a = [], o = /* @__PURE__ */ new Set();
		for (let e of n) {
			let n = this.nativeLayerInstances.get(e);
			if (!n) continue;
			let s = this.featureSourceOf(e, n);
			if (!s) continue;
			if (typeof s.getFeatures == "function" && !(s instanceof N)) {
				let t = this.nativeLayerToSource.get(e) ?? `layer:${e}`;
				if (o.has(t)) continue;
				o.add(t);
				let n = s.getFeatures();
				for (let e of n) try {
					let t = JSON.parse(r.writeFeature(e, {
						dataProjection: "EPSG:4326",
						featureProjection: B(this.map)
					}));
					i.push(t);
				} catch {}
				continue;
			}
			if (!(s instanceof N)) continue;
			let c = this.map.getView(), l = this.map.getSize() ?? [0, 0], u = c.getProjection().getCode(), d = s.getProjection?.()?.getCode() ?? "EPSG:3857", f = c.calculateExtent(l), p = d === u, m = p ? f : b(f, u, d), h = p ? f : ze, g;
			try {
				g = n.getFeaturesInExtent?.(h) ?? [];
			} catch {
				g = [];
			}
			p || (g = g.filter((e) => {
				let t = e.getExtent?.() ?? e.getGeometry?.()?.getExtent?.();
				return t ? pe(t, m) : !0;
			}));
			for (let e of g) {
				if (t?.sourceLayer) {
					let n = e.get?.("layer") ?? e.sourceLayer;
					if (n && n !== t.sourceLayer) continue;
				}
				try {
					let t = typeof e.getFlatCoordinates == "function" ? me(e) : e, n = JSON.parse(r.writeFeature(t, {
						dataProjection: "EPSG:4326",
						featureProjection: d
					}));
					a.push({
						feature: n,
						sourceLayer: e.get?.("layer") ?? e.sourceLayer,
						id: e.getId?.()
					});
				} catch {}
			}
		}
		return a.length && i.push(...ee(a).features), {
			type: "FeatureCollection",
			features: i
		};
	}
	setSourceData(e, t) {
		let n = this.logicalSourceToNative.get(e);
		if (!n) return !1;
		let r = !1, i = /* @__PURE__ */ new Set();
		for (let [e, a] of this.nativeLayerToSource.entries()) {
			if (a !== n) continue;
			let o = this.nativeLayerInstances.get(e), s = this.featureSourceOf(e, o);
			!s || typeof s.clear != "function" || i.has(s) || (i.add(s), s.clear(), s.addFeatures(new G().readFeatures(t, {
				dataProjection: "EPSG:4326",
				featureProjection: B(this.map)
			})), r = !0);
		}
		return r;
	}
	registerInlineLayer(e, t, n) {
		let r = `${e}-inline`;
		this.nativeLayerInstances.set(r, t), this.logicalToNative.set(e, [r]);
	}
	unregisterInlineLayer(e) {
		let t = this.logicalToNative.get(e) ?? [];
		for (let e of t) this.nativeLayerInstances.delete(e);
		this.logicalToNative.delete(e);
	}
	getVisibleWMSLayers() {
		return [];
	}
}, He = class {
	constructor(e, t, n) {
		this.map = e, this.layerService = t, this.store = n;
	}
	async queryFeatures(e, n = {}) {
		let { pixel: r } = e, i = n.tolerancePx ?? 5, a = [], o = n.layerIds?.length ? new Set(n.layerIds) : null, s = this.store.getState().mapLayers ?? {};
		this.map.forEachFeatureAtPixel(r, (e, t) => {
			let n = t?.__layerId, r = this.resolveRegisteredLayerId(t, n, s);
			if (!r || o && !o.has(r)) return;
			let i = this.resolveLayerTitle(r, s), c = e.getProperties();
			delete c.geometry;
			let l, u, d = -1, f = e.get?.("layer");
			if (f) {
				let t = s[r], n = Array.isArray(t?.sublayers) ? t.sublayers : [], i = this.store.getState().zoomLevel ?? 0, a = e.getGeometry?.()?.getType?.(), o = a?.includes("Polygon") ? new Set(["fill", "fill-extrusion"]) : a?.includes("LineString") ? new Set(["line"]) : a?.includes("Point") ? new Set(["circle", "symbol"]) : null, p = o ? [!0, !1] : [!1];
				outer: for (let e of p) for (let t = n.length - 1; t >= 0; t--) {
					let r = n[t];
					if (r?.["source-layer"] !== f && r?.sourceLayer !== f || e && o && !o.has(r?.type) || r?.layout?.visibility === "none") continue;
					let a = typeof r?.minzoom == "number" ? r.minzoom : 0, s = typeof r?.maxzoom == "number" ? r.maxzoom + 1 : 24;
					if (!(i < a || i >= s) && !(r?.filter && !this.matchesFilter(r.filter, c))) {
						l = String(r.id ?? "").replace(/^style:/, ""), u = r.type, d = t;
						break outer;
					}
				}
			}
			a.push({
				layerId: r,
				...i ? { layerTitle: i } : {},
				properties: c,
				source: "vector",
				...l ? {
					subLayerId: l,
					subLayerType: u
				} : {},
				_subLayerIndex: d
			});
		}, { hitTolerance: i }), a.sort((e, t) => (t._subLayerIndex ?? -1) - (e._subLayerIndex ?? -1));
		let c = /* @__PURE__ */ new Set(), l = [];
		for (let e of a) {
			let t = `${e.layerId}|${e.subLayerId ?? ""}`;
			c.has(t) || (c.add(t), l.push(e));
		}
		if (a.length = 0, a.push(...l.map((e) => {
			let t = { ...e };
			return delete t._subLayerIndex, t;
		})), n.includeWMS) {
			let e = this.map.getView(), n = this.map.getSize() ?? [0, 0], i = e.calculateExtent(n), s = H(this.map, [i[0], i[1]]), c = H(this.map, [i[2], i[3]]), l = {
				west: s[0],
				south: s[1],
				east: c[0],
				north: c[1]
			}, u = this.layerService.getVisibleWMSLayers(), d = await Promise.all(u.filter((e) => !o || o.has(e.layerId)).map((e) => t({
				sourceConfig: e.sourceConfig,
				layerId: e.layerId,
				layerTitle: e.layerTitle,
				bounds: l,
				containerWidth: n[0],
				containerHeight: n[1],
				pixelX: r[0],
				pixelY: r[1]
			})));
			for (let e of d) a.push(...e);
		}
		return a;
	}
	matchesFilter(e, t) {
		if (!Array.isArray(e) || e.length === 0) return !0;
		let n = e[0];
		if (n === "all") return e.slice(1).every((e) => this.matchesFilter(e, t));
		if (n === "any") return e.slice(1).some((e) => this.matchesFilter(e, t));
		if (n === "none") return !e.slice(1).some((e) => this.matchesFilter(e, t));
		let r = (e) => {
			if (Array.isArray(e) && e[0] === "get") return t[e[1]];
			if (!(Array.isArray(e) && e[0] === "geometry-type") && !(Array.isArray(e) && e[0] === "zoom")) return e;
		}, i = r(e[1]), a = r(e[2]);
		if (n === "==" || n === "===") return i === a;
		if (n === "!=" || n === "!==") return i !== a;
		if (n === "<") return Number(i) < Number(a);
		if (n === "<=") return Number(i) <= Number(a);
		if (n === ">") return Number(i) > Number(a);
		if (n === ">=") return Number(i) >= Number(a);
		if (n === "match") {
			let t = r(e[1]);
			for (let n = 2; n + 1 < e.length; n += 2) {
				let r = e[n];
				if (Array.isArray(r) ? r.includes(t) : r === t) return !!e[n + 1];
			}
			return !!e[e.length - 1];
		}
		if (n === "in") {
			let t = r(e[1]);
			return e.slice(2).includes(t);
		}
		return n === "has" ? t[e[1]] !== void 0 : n === "!has" ? t[e[1]] === void 0 : !0;
	}
	resolveRegisteredLayerId(e, t, n) {
		let r = typeof e.__mapLayerId == "string" ? e.__mapLayerId : t ?? null;
		return r && n[r] ? r : null;
	}
	resolveLayerTitle(e, t) {
		let n = t[e];
		return typeof n?.label == "string" && n.label.length > 0 ? n.label : null;
	}
}, Ue = class {
	constructor(e) {
		this.map = e, this.markers = /* @__PURE__ */ new Map();
	}
	add(e, t, n = {}) {
		this.remove(e);
		let r = n.color ?? "#e63946", i = n.draggable ?? !1, a = document.createElement("div");
		a.style.cssText = "cursor:pointer;user-select:none;", a.innerHTML = g(r);
		let o = new Ce({
			element: a,
			positioning: "bottom-center",
			stopEvent: !1,
			position: V(this.map, [t[0], t[1]])
		});
		this.map.addOverlay(o);
		let s = {
			overlay: o,
			element: a,
			draggable: i
		};
		i && (s.dragCleanup = this.attachDrag(a, o, n)), this.markers.set(e, s);
	}
	move(e, t) {
		let n = this.markers.get(e);
		n && n.overlay.setPosition(V(this.map, [t[0], t[1]]));
	}
	remove(e) {
		let t = this.markers.get(e);
		t && (t.dragCleanup?.(), this.map.removeOverlay(t.overlay), this.markers.delete(e));
	}
	attachDrag(e, t, n) {
		let r = !1, i = (t) => {
			t.preventDefault(), r = !0, e.setPointerCapture(t.pointerId);
		}, a = (e) => {
			if (!r) return;
			let i = this.map.getTargetElement().getBoundingClientRect(), a = [e.clientX - i.left, e.clientY - i.top], o = this.map.getCoordinateFromPixel(a);
			if (o && (t.setPosition(o), n.onDrag)) {
				let e = H(this.map, o);
				n.onDrag([e[0], e[1]]);
			}
		}, o = () => {
			if (r && (r = !1, n.onDragEnd)) {
				let e = t.getPosition();
				if (e) {
					let t = H(this.map, e);
					n.onDragEnd([t[0], t[1]]);
				}
			}
		};
		return e.addEventListener("pointerdown", i), e.addEventListener("pointermove", a), e.addEventListener("pointerup", o), () => {
			e.removeEventListener("pointerdown", i), e.removeEventListener("pointermove", a), e.removeEventListener("pointerup", o);
		};
	}
}, We = new Set([
	"raster",
	"geojson",
	"vector",
	"raster-dem"
]), Ge = class extends p {
	constructor() {
		super(), this.engineId = "openlayers", this.engineVersion = ie, this.markerService = null, this.layerService = null, this.core = new je(this.store, this.events), this.toolService = new Me(), this.logicalLayerExecutor = new d(), this.queryExecutor = new m(this.store), this.queryService = this.queryExecutor, this.mapFactory = new Pe(), this.core.onMapReady?.((e) => {
			let t = new Ve(e, this.store);
			this.layerService = t, this.core.setLayerOrderRegistry(t), this.logicalLayerExecutor.bind(t), this.queryExecutor.bind(new He(e, t, this.store)), this.markerService = new Ue(e);
		});
	}
	setTouchCaptureEnabled(e) {
		this.core.setTouchCaptureEnabled(e);
	}
	engineSetProjection(e) {
		return this.core.setProjection(e);
	}
	getProjection() {
		return this.core.getProjection();
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
			let n = t?.getTargetElement?.();
			n && (n.style.backgroundColor = e ?? "");
		}), !0;
	}
	getViewProjections() {
		return i.map((e) => e.id);
	}
	drawableSourceTypes() {
		return We;
	}
};
//#endregion
export { Ge as OpenLayersAdapter };
