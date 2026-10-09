import { t as e } from "./geojson-loader-BUzpNOID.js";
import { t } from "./default-paint-EDDI8yhT.js";
import { t as n } from "./throttle-BD7udUwY.js";
import { t as r } from "./wms-feature-info-BjPjL6VU.js";
import { t as i } from "./dom-focus-utils-Bn3WmmrK.js";
import { a, i as o, n as s, o as c, r as l, t as u } from "./deferred-query-service-B6zKgrLz.js";
import { a as d, i as f, o as p, r as m, s as h, t as g } from "./marker-utils-DPLjunnY.js";
import { t as _ } from "./label-placement-Cef3mQiN.js";
//#region src/map/cesium-services/label-collision.ts
function v() {
	return globalThis.Cesium;
}
var y = null;
function b() {
	return y ||= document.createElement("canvas").getContext("2d"), y;
}
var x = /* @__PURE__ */ new WeakMap();
function S(e, t) {
	if (!e || x.has(e) || typeof document > "u") return;
	let n = v();
	if (!n?.JulianDate) return;
	let r = () => {
		try {
			let r = e.scene;
			if (!r) return;
			let i = n.JulianDate.now(), a = b(), o = [];
			for (let e of t()) {
				let t = e?.entities?.values ?? [];
				for (let e of t) {
					if (!e.label) continue;
					let t = e.label.text?.getValue?.(i);
					if (!t) continue;
					let n = e.position?.getValue?.(i);
					if (!n) continue;
					let s = r.cartesianToCanvasCoordinates(n);
					if (!s) continue;
					let c = e.label.font?.getValue?.(i) ?? "12px sans-serif", l = /(\d+(?:\.\d+)?)px/.exec(c), u = l ? Number(l[1]) : 12;
					a.font = c;
					let d = a.measureText(t).width, f = u * 1.2;
					o.push({
						item: e,
						sortKey: e._webmapxSortKey ?? 0,
						box: {
							left: s.x - d / 2,
							right: s.x + d / 2,
							top: s.y - f / 2,
							bottom: s.y + f / 2
						}
					});
				}
			}
			let s = _(o);
			for (let { item: e } of o) e.label.show = s.has(e);
		} catch (e) {
			console.error("[webmapx][cesium] label collision update failed", e);
		}
	};
	x.set(e, r), e.camera.percentageChanged = .01, e.camera.changed.addEventListener(r);
	let i = 0;
	e.scene.postRender.addEventListener(() => {
		let e = performance.now();
		e - i < 250 || (i = e, r());
	}), r();
}
function C(e) {
	x.get(e)?.();
}
//#endregion
//#region src/map/cesium-services/MapLayerService.ts
function w(e, t) {
	let n = e?.entities?.values ?? [];
	for (let e of n) e.polygon && (e.polygon.arcType = t.ArcType.GEODESIC), e.polyline && (e.polyline.arcType = t.ArcType.GEODESIC);
}
function T() {
	return globalThis.Cesium;
}
var E = 6378137, ee = 512, D = 2e4;
function te(e) {
	return Math.max(-85.05112878, Math.min(85.05112878, e));
}
function O(e, t) {
	let n = te(t) * Math.PI / 180;
	return 2 * Math.PI * E * Math.cos(n) / (ee * 2 ** e);
}
function ne(e, t, n, r = 48) {
	let i = t * Math.PI / 180, a = n / E * (180 / Math.PI), o = a / Math.max(1e-6, Math.cos(i)), s = [];
	for (let n = 0; n <= r; n += 1) {
		let i = n / r * Math.PI * 2, c = e + o * Math.cos(i), l = t + a * Math.sin(i);
		s.push([c, l]);
	}
	return s;
}
function k(e, t, n) {
	if (!e) return;
	let r = T(), i = e[t];
	if (r && i && typeof i.getValue == "function") {
		let e = r.JulianDate?.now?.() || new r.JulianDate(), t = i.getValue(e);
		if (t === n || t && typeof t.equals == "function" && t.equals(n)) return;
	}
	e[t] = n;
}
function A(e, t) {
	return e.withAlpha(e.alpha * t);
}
function j(e, t) {
	let n = T(), r = e.material;
	if (n && r?.__webmapxOwned && r instanceof n.ColorMaterialProperty && r.color instanceof n.ConstantProperty) {
		let e = n.JulianDate?.now?.() || new n.JulianDate(), i = r.color.getValue(e);
		if (i === t || i && typeof i.equals == "function" && i.equals(t)) return;
		r.color.setValue(t);
		return;
	}
	let i = new n.ColorMaterialProperty(t);
	i.__webmapxOwned = !0, e.material = i;
}
function M(e) {
	let t = e.minzoom ?? e.minZoom;
	return typeof t == "number" && isFinite(t) ? t : void 0;
}
function N(e) {
	let t = e.maxzoom ?? e.maxZoom;
	return typeof t == "number" && isFinite(t) ? t : void 0;
}
function P(e) {
	if (!(typeof e != "number" || !isFinite(e))) return Math.max(0, Math.floor(e));
}
var re = [
	"service",
	"request",
	"version",
	"layers",
	"styles",
	"format",
	"transparent",
	"crs",
	"srs",
	"width",
	"height",
	"bbox"
];
function ie(e) {
	try {
		let t = new URL(e, window.location.origin), n = t.searchParams.get("layers") ?? t.searchParams.get("LAYERS") ?? "";
		for (let e of [...t.searchParams.keys()]) re.includes(e.toLowerCase()) && t.searchParams.delete(e);
		return {
			baseUrl: t.toString(),
			layers: n
		};
	} catch {
		let [t, n] = e.split("?", 2);
		return {
			baseUrl: t,
			layers: new URLSearchParams(n ?? "").get("layers") ?? ""
		};
	}
}
var ae = class {
	constructor(e, t) {
		this.viewer = e, this.store = t, this.handles = /* @__PURE__ */ new Map(), this.lastZoomLevel = null, this.unsubscribeStore = null, this.busyOps = 0, this.logicalOrder = [], this.applyGeoJsonStylesThrottled = n(() => this.applyAllGeoJsonStyles(), 100), S(this.viewer, () => Array.from(this.handles.values()).filter((e) => e.kind === "geojson").map((e) => e.dataSource)), this.viewer?.scene?.globe?.tileLoadProgressEvent?.addEventListener?.((e) => {
			e > 0 ? this.store.dispatch({ mapBusy: !0 }, "MAP") : this.busyOps === 0 && this.store.dispatch({ mapBusy: !1 }, "MAP");
		}), this.unsubscribeStore = this.store.subscribe((e) => {
			e.zoomLevel != null && (this.lastZoomLevel !== null && Math.abs(e.zoomLevel - this.lastZoomLevel) < .05 || (this.lastZoomLevel = e.zoomLevel, this.applyGeoJsonStylesThrottled(), this.applyImageryVisibility(e.zoomLevel)));
		});
	}
	beginBusyOperation() {
		this.busyOps += 1, this.busyOps === 1 && this.store.dispatch({ mapBusy: !0 }, "MAP");
	}
	endBusyOperation() {
		if (this.busyOps <= 0) {
			this.busyOps = 0;
			return;
		}
		--this.busyOps, this.busyOps === 0 && this.store.dispatch({ mapBusy: !1 }, "MAP");
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
		let n = this.resolveInsertIndex(t);
		if (this.logicalOrder = this.logicalOrder.filter((t) => t !== e), typeof n != "number" || !Number.isFinite(n)) {
			this.logicalOrder.push(e);
			return;
		}
		let r = Math.max(0, Math.min(n, this.logicalOrder.length));
		this.logicalOrder.splice(r, 0, e);
	}
	reapplyImageryOrder() {
		let e = [];
		for (let t of this.logicalOrder) for (let [n, r] of this.handles.entries()) n.startsWith(`${t}::`) && r.kind === "imagery" && e.push(r.imageryLayer);
		for (let t = 0; t < e.length; t += 1) {
			let n = e[t];
			if (this.viewer.imageryLayers.indexOf(n) !== t) {
				try {
					this.viewer.imageryLayers.remove(n, !1);
				} catch {}
				this.viewer.imageryLayers.add(n, t);
			}
		}
	}
	async addImagerySource(e, t, n, r) {
		let i = T();
		if (!i) return !1;
		let a = `${e}::${t}`;
		if (this.handles.has(a)) return !0;
		if (n.type !== "raster") return !1;
		let o = Array.isArray(n.url) ? n.url[0] : n.url;
		if (n.service === "xyz") {
			if (o.startsWith("warpedmap://")) return console.warn("[CESIUM LAYER SERVICE] warpedmap:// (Allmaps) is not supported in Cesium."), !1;
			let t = P(M(n)), s = P(N(n)) ?? 22, c = o.includes("{bbox-epsg-3857}"), l = new i.UrlTemplateImageryProvider({
				url: c ? o.replace("{bbox-epsg-3857}", "{westProjected},{southProjected},{eastProjected},{northProjected}") : o,
				...c ? { tilingScheme: new i.WebMercatorTilingScheme() } : {},
				credit: n.attribution ?? "",
				maximumLevel: s
			});
			this.enforceMaxLevel(l, s);
			let u = new i.ImageryLayer(l);
			return this.viewer.imageryLayers.add(u), this.handles.set(a, {
				kind: "imagery",
				imageryLayer: u,
				minLevel: t,
				maxLevel: s,
				userVisible: !0
			}), this.upsertLogicalOrder(e, r), this.reapplyImageryOrder(), this.applyImageryVisibility(this.store.getState().zoomLevel ?? 0), !0;
		}
		if (n.service === "wms") {
			let t = n, { baseUrl: s, layers: c } = ie(o), l = P(M(t)), u = P(N(t)) ?? 22, d = new i.WebMapServiceImageryProvider({
				url: s,
				layers: t.layers ?? c,
				parameters: {
					transparent: t.transparent ?? !0,
					format: t.format ?? "image/png",
					styles: t.styles ?? "",
					version: t.version ?? "1.1.1",
					crs: "EPSG:3857"
				},
				tilingScheme: new i.WebMercatorTilingScheme(),
				maximumLevel: u,
				credit: t.attribution ?? ""
			});
			this.enforceMaxLevel(d, u);
			let f = new i.ImageryLayer(d);
			return this.viewer.imageryLayers.add(f), this.handles.set(a, {
				kind: "imagery",
				imageryLayer: f,
				minLevel: l,
				maxLevel: u,
				userVisible: !0
			}), this.upsertLogicalOrder(e, r), this.reapplyImageryOrder(), this.applyImageryVisibility(this.store.getState().zoomLevel ?? 0), !0;
		}
		return !1;
	}
	async addGeoJSONSource(t, n, r, i, a) {
		let o = T();
		if (!o) return !1;
		let s = `${t}::${n}`;
		if (this.handles.has(s)) return !0;
		this.beginBusyOperation();
		try {
			let c = r.data, l = typeof c == "string" ? await (await fetch(c)).json() : c, u = e(l), d = u <= D;
			d || console.info(`[CESIUM] Layer "${t}": ${u} vertices exceeds clamp-to-ground limit (${D}), rendering without terrain clamping`);
			let f = await o.GeoJsonDataSource.load(l, { clampToGround: d });
			return w(f, o), await this.viewer.dataSources.add(f), this.applyGeoJsonStyles(f, i, d, 1), this.handles.set(s, {
				kind: "geojson",
				dataSource: f,
				sourceId: n,
				subLayers: i,
				data: l,
				updateToken: 0,
				clampToGround: d,
				opacity: 1
			}), this.upsertLogicalOrder(t, a), !0;
		} catch (e) {
			return console.warn(`[CESIUM] Failed to load GeoJSON layer "${t}":`, e), !1;
		} finally {
			this.endBusyOperation();
		}
	}
	async addLayer(e, t) {
		if (!T()) return !1;
		let n = e.id;
		if (e.type === "allmaps") return console.warn("[CESIUM LAYER SERVICE] Allmaps is not supported in Cesium."), !1;
		if (e.type === "style") {
			let n = a(e);
			return n ? this.addCompositeLayer(n, t) : !1;
		}
		let r = e;
		if (!r.source) return !1;
		let i = e.sources?.[r.source], o = i ? c(r.source, i) : null;
		if (!o) return !1;
		let s = !1;
		return o.type === "raster" ? s = await this.addImagerySource(n, o.id, o, t) : o.type === "geojson" && (s = await this.addGeoJSONSource(n, o.id, o, [r], t)), s;
	}
	async addCompositeLayer(e, t) {
		let n = e.styleId, r = new Set(e.subLayers.map((e) => e.source).filter(Boolean)), i = !1;
		for (let a of r) {
			let r = o(e, a)?.config ?? null;
			r && (r.type === "raster" ? await this.addImagerySource(n, r.id, r, t) && (i = !0) : r.type === "geojson" && await this.addGeoJSONSource(n, r.id, r, e.subLayers, t) && (i = !0));
		}
		return i;
	}
	updateLayerStyle(e, t, n) {
		let r = !1;
		for (let [i, a] of this.handles.entries()) {
			if (a.kind !== "geojson" || !i.startsWith(`${e}::`)) continue;
			let o = a.subLayers.findIndex((e) => e.id === t);
			if (o < 0) continue;
			let s = a.subLayers[o];
			a.subLayers[o] = {
				...s,
				paint: {
					...s.paint ?? {},
					...n
				}
			}, this.applyGeoJsonStyles(a.dataSource, a.subLayers, a.clampToGround, a.opacity), r = !0;
		}
		return r;
	}
	moveLayer(e, t) {
		let n = t ?? null;
		if (n && !this.logicalOrder.includes(n)) {
			let e = Object.keys(this.store.getState().mapLayers ?? {}), t = e.indexOf(n);
			n = t === -1 ? null : e.slice(t + 1).find((e) => this.logicalOrder.includes(e)) ?? null;
		}
		this.upsertLogicalOrder(e, n ? { beforeLayerId: n } : void 0), this.reapplyImageryOrder();
	}
	removeLayer(e) {
		let t = Array.from(this.handles.keys()).filter((t) => t.startsWith(`${e}::`));
		for (let e of t) {
			let t = this.handles.get(e);
			if (t) {
				if (t.kind === "imagery") try {
					this.viewer.imageryLayers.remove(t.imageryLayer, !0);
				} catch {}
				else if (t.kind === "geojson") try {
					this.viewer.dataSources.remove(t.dataSource, !0);
				} catch {}
				this.handles.delete(e);
			}
		}
		this.logicalOrder = this.logicalOrder.filter((t) => t !== e), this.reapplyImageryOrder();
	}
	getVisibleLayers() {
		let e = /* @__PURE__ */ new Set();
		for (let t of this.handles.keys()) e.add(t.split("::")[0]);
		return Array.from(e);
	}
	isLayerVisible(e) {
		for (let t of this.handles.keys()) if (t.startsWith(`${e}::`)) return !0;
		return !1;
	}
	setLayerVisibility(e, t) {
		for (let [n, r] of this.handles.entries()) if (n.startsWith(`${e}::`)) if (r.kind === "imagery") {
			r.userVisible = t;
			let e = this.store.getState().zoomLevel ?? 0, n = r.minLevel !== void 0 && e < r.minLevel;
			r.imageryLayer.show = t && !n;
		} else r.kind === "geojson" && (r.dataSource.show = t);
	}
	setLayerOpacity(e, t) {
		for (let [n, r] of this.handles.entries()) n.startsWith(`${e}::`) && (r.kind === "imagery" ? r.imageryLayer.alpha = t : r.kind === "geojson" && (r.opacity = t, this.applyGeoJsonStyles(r.dataSource, r.subLayers, r.clampToGround, t)));
	}
	getSourceData(e) {
		for (let t of this.handles.values()) if (!(t.kind !== "geojson" || t.sourceId !== e)) return t.data;
		return null;
	}
	getLayerSourceLayers(e) {
		return [];
	}
	async queryLayerFeatures(e, t) {
		for (let [t, n] of this.handles.entries()) if (!(!t.startsWith(`${e}::`) || n.kind !== "geojson")) return n.data;
		return {
			type: "FeatureCollection",
			features: []
		};
	}
	setSourceData(e, t) {
		let n = !1;
		for (let [r, i] of this.handles.entries()) i.kind !== "geojson" || i.sourceId !== e || (i.data = t, i.updateToken += 1, this.replaceGeoJsonDataSource(r, i, i.updateToken), n = !0);
		return n;
	}
	async replaceGeoJsonDataSource(e, t, n) {
		let r = T();
		if (r) {
			this.beginBusyOperation();
			try {
				let i = await r.GeoJsonDataSource.load(t.data, { clampToGround: !1 });
				w(i, r);
				let a = this.handles.get(e);
				if (a?.kind !== "geojson" || a.updateToken !== n) return;
				let o = a.dataSource;
				a.dataSource = i, await this.viewer.dataSources.add(i), this.applyGeoJsonStyles(i, a.subLayers, a.clampToGround, a.opacity);
				try {
					this.viewer.dataSources.remove(o, !0);
				} catch {}
			} finally {
				this.endBusyOperation();
			}
		}
	}
	getVisibleWMSLayers() {
		return [];
	}
	registerInlineLayer(e, t) {
		this.upsertLogicalOrder(e, t);
	}
	unregisterInlineLayer(e) {
		this.logicalOrder = this.logicalOrder.filter((t) => t !== e);
	}
	getLogicalLayerForEntity(e) {
		for (let [t, n] of this.handles.entries()) if (n.kind === "geojson" && n.dataSource?.entities?.contains?.(e)) return t.split("::")[0];
		return null;
	}
	getEntityProperties(e) {
		let t = {}, n = e?.properties?.propertyNames ?? [];
		for (let r of n) t[r] = this.getEntityProperty(e, r);
		return t;
	}
	enforceMaxLevel(e, t) {
		if (typeof t != "number" || !isFinite(t) || typeof e.requestImage != "function") return;
		let n = e.requestImage.bind(e);
		if (e.requestImage = (e, r, i, ...a) => n(e, r, Math.min(i, t), ...a), e.tilingScheme && typeof e.tilingScheme.getNumberOfXTilesAtLevel == "function") {
			let n = e.tilingScheme.getNumberOfXTilesAtLevel.bind(e.tilingScheme);
			e.tilingScheme.getNumberOfXTilesAtLevel = (e) => n(Math.min(e, t));
		}
		if (e.tilingScheme && typeof e.tilingScheme.getNumberOfYTilesAtLevel == "function") {
			let n = e.tilingScheme.getNumberOfYTilesAtLevel.bind(e.tilingScheme);
			e.tilingScheme.getNumberOfYTilesAtLevel = (e) => n(Math.min(e, t));
		}
	}
	applyImageryVisibility(e) {
		for (let t of this.handles.values()) {
			if (t.kind !== "imagery") continue;
			let n = t.minLevel !== void 0 && e < t.minLevel;
			t.imageryLayer.show = t.userVisible && !n;
		}
	}
	getEntityProperty(e, t) {
		let n = T()?.JulianDate?.now?.(), r = e?.properties?.[t];
		if (r?.getValue && n) return r.getValue(n);
		if (r && typeof r == "object" && "valueOf" in r) try {
			return r.valueOf();
		} catch {
			return r;
		}
		return r;
	}
	entityToFeature(e) {
		let t = T()?.JulianDate?.now?.(), n = {};
		if (e?.properties) {
			let r = e.properties.propertyNames ?? Object.keys(e.properties);
			for (let i of r) {
				let r = e.properties[i];
				n[i] = r?.getValue?.(t) ?? r;
			}
		}
		let r = "Point";
		return e?.polygon ? r = "Polygon" : e?.polyline && (r = "LineString"), {
			properties: n,
			geometry: { type: r }
		};
	}
	matchesStyleFilter(e, t) {
		return t ? h(t, this.entityToFeature(e)) : !0;
	}
	resolveNumber(e, t, n) {
		let r = this.store.getState().zoomLevel ?? 0;
		return d(t, this.entityToFeature(e), r, n);
	}
	resolveColor(e, t, n) {
		let r = this.store.getState().zoomLevel ?? 0;
		return f(t, this.entityToFeature(e), r, n);
	}
	resolveString(e, t, n) {
		let r = this.store.getState().zoomLevel ?? 0;
		return p(t, this.entityToFeature(e), r, n);
	}
	applyGeoJsonStyles(e, n, r = !0, i = 1) {
		let a = T();
		if (!a) return;
		let o = n.find((e) => e.type === "circle"), s = n.find((e) => e.type === "line"), c = n.find((e) => e.type === "fill"), l = n.find((e) => e.type === "symbol"), u = l?.layout ?? {}, d = l?.paint ?? {}, f = o?.paint ?? {}, p = s?.paint ?? {}, m = c?.paint ?? {}, h = t, g = e.entities?.values ?? [];
		for (let e of g) {
			let t = this.matchesStyleFilter(e, o?.filter), n = this.matchesStyleFilter(e, s?.filter), g = this.matchesStyleFilter(e, c?.filter), _ = !!(e.position || e.point || e.billboard || e.ellipse);
			if (o && _ && !t && (e.point = void 0, e.billboard = void 0, e.ellipse = void 0, !n && !g)) {
				e.show = !1;
				continue;
			}
			if (o && _ && t && (e.show = !0), o && t && _) {
				let t = this.store.getState().zoomLevel ?? 2, n = a.JulianDate.now(), r = e.position?.getValue?.(n) ?? e.position;
				if (r) {
					let n = this.resolveNumber(e, f["circle-radius"], 6), o = this.resolveColor(e, f["circle-color"], "#FF5722"), s = this.resolveNumber(e, f["circle-opacity"], 1), c = this.resolveColor(e, f["circle-stroke-color"], this.resolveColor(e, p["line-color"], h)), l = this.resolveNumber(e, f["circle-stroke-width"], 1), u = a.Ellipsoid.WGS84.cartesianToCartographic(r), d = u.latitude * 180 / Math.PI, m = O(t, d), g = Math.max(1, n * m);
					e.ellipse ||= new a.EllipseGraphics(), k(e.ellipse, "semiMajorAxis", g), k(e.ellipse, "semiMinorAxis", g), j(e.ellipse, A(a.Color.fromCssColorString(o), s * i)), k(e.ellipse, "outline", !1), k(e.ellipse, "height", 0);
					let _ = ne(a.Math.toDegrees(u.longitude), d, g, 64).map(([e, t]) => a.Cartesian3.fromDegrees(e, t, 0));
					e.polyline ||= new a.PolylineGraphics();
					let v = e.polyline.positions, y = !0;
					if (v && typeof v.getValue == "function") {
						let e = a.JulianDate?.now?.() || new a.JulianDate(), t = v.getValue(e);
						if (Array.isArray(t) && t.length === _.length) {
							y = !1;
							for (let e = 0; e < _.length; e++) if (!t[e].equals(_[e])) {
								y = !0;
								break;
							}
						}
					}
					y && (e.polyline.positions = _), k(e.polyline, "width", Math.max(1, l)), j(e.polyline, A(a.Color.fromCssColorString(c), i)), "clampToGround" in e.polyline && k(e.polyline, "clampToGround", !0), a.HeightReference?.CLAMP_TO_GROUND && k(e.ellipse, "heightReference", a.HeightReference.CLAMP_TO_GROUND), e.billboard = void 0, e.point = void 0;
				}
			}
			if (l && _) {
				if (this.matchesStyleFilter(e, l.filter)) {
					let t = this.resolveString(e, u["text-field"], "");
					if (t) {
						let n = this.resolveColor(e, d["text-color"], "#000000"), r = this.resolveColor(e, d["text-halo-color"], "#ffffff"), i = this.resolveNumber(e, d["text-halo-width"], 0), o = this.resolveNumber(e, u["text-size"], 12);
						e.label ||= new a.LabelGraphics(), k(e.label, "text", t), k(e.label, "font", `${o}px sans-serif`), k(e.label, "fillColor", a.Color.fromCssColorString(n)), k(e.label, "style", a.LabelStyle.FILL_AND_OUTLINE), k(e.label, "outlineColor", a.Color.fromCssColorString(r)), k(e.label, "outlineWidth", Math.max(1, i * 2)), k(e.label, "verticalOrigin", a.VerticalOrigin.CENTER), k(e.label, "horizontalOrigin", a.HorizontalOrigin.CENTER), k(e.label, "disableDepthTestDistance", Infinity), a.HeightReference?.CLAMP_TO_GROUND && "heightReference" in e.label && k(e.label, "heightReference", a.HeightReference.CLAMP_TO_GROUND), e._webmapxSortKey = this.resolveNumber(e, u["symbol-sort-key"], 0);
					}
				}
				o || (e.billboard = void 0, e.point = void 0, e.ellipse = void 0);
			}
			if (e.polyline && s && n) {
				let t = this.resolveColor(e, p["line-color"], h), n = this.resolveNumber(e, p["line-width"], 2);
				j(e.polyline, A(a.Color.fromCssColorString(t), i)), k(e.polyline, "width", n), k(e.polyline, "clampToGround", r);
			}
			if (e.polygon && c && g) {
				let t = this.resolveColor(e, m["fill-color"], h), r = this.resolveNumber(e, m["fill-opacity"], .2);
				j(e.polygon, A(a.Color.fromCssColorString(t), r * i));
				let o = m["fill-outline-color"], c = s && n ? p["line-color"] : void 0, l = o ?? c;
				if (k(e.polygon, "outline", l !== void 0), l !== void 0) {
					let t = this.resolveColor(e, l, h), n = A(a.Color.fromCssColorString(t), i);
					if (e.polygon.outlineColor instanceof a.ConstantProperty) {
						let t = a.JulianDate?.now?.() || new a.JulianDate(), r = e.polygon.outlineColor.getValue(t);
						(!r || !r.equals(n)) && e.polygon.outlineColor.setValue(n);
					} else e.polygon.outlineColor = n;
				}
			}
		}
		l && C(this.viewer);
	}
	applyAllGeoJsonStyles() {
		for (let e of this.handles.values()) e.kind === "geojson" && this.applyGeoJsonStyles(e.dataSource, e.subLayers, e.clampToGround, e.opacity);
	}
};
//#endregion
//#region src/map/cesium-services/MapCoreService.ts
function F() {
	return globalThis.Cesium;
}
function I(e, t, n) {
	if (!e) return;
	let r = F(), i = e[t];
	if (r && i && typeof i.getValue == "function") {
		let e = r.JulianDate?.now?.() || new r.JulianDate(), t = i.getValue(e);
		if (t === n || t && typeof t.equals == "function" && t.equals(n)) return;
	}
	e[t] = n;
}
function L(e, t) {
	let n = F(), r = e.material;
	if (n && r instanceof n.ColorMaterialProperty && r.color instanceof n.ConstantProperty) {
		let e = n.JulianDate?.now?.() || new n.JulianDate(), i = r.color.getValue(e);
		if (i === t || i && typeof i.equals == "function" && i.equals(t)) return;
		r.color.setValue(t);
		return;
	}
	e.material = t;
}
function oe(e) {
	return Math.max(10, 2e7 / 2 ** Math.max(0, e));
}
function R(e) {
	return !isFinite(e) || e <= 0 ? 0 : Math.log2(2e7 / e);
}
var z = 6378137, B = 512;
function V(e) {
	return Math.max(-85.05112878, Math.min(85.05112878, e));
}
function H(e, t) {
	let n = V(t) * Math.PI / 180;
	return 2 * Math.PI * z * Math.cos(n) / (B * 2 ** e);
}
function U(e) {
	return typeof e == "number" && isFinite(e) && e > 0 ? Math.max(.05, Math.min(4, e * .005)) : .05;
}
function W(e) {
	return typeof e == "number" && isFinite(e) ? Math.max(.05, Math.min(16, 2 ** (10 - e))) : 1;
}
function G(e, t, n, r = 48) {
	let i = t * Math.PI / 180, a = n / z * (180 / Math.PI), o = a / Math.max(1e-6, Math.cos(i)), s = [];
	for (let n = 0; n <= r; n += 1) {
		let i = n / r * Math.PI * 2, c = e + o * Math.cos(i), l = t + a * Math.sin(i);
		s.push([c, l]);
	}
	return s;
}
var K = class e {
	constructor(e, t) {
		this.store = e, this.eventBus = t, this.viewer = null, this.readyCbs = [], this.sources = /* @__PURE__ */ new Map(), this.sourceState = /* @__PURE__ */ new Map(), this.minPitch = 0, this.maxPitch = 85, this.enforcingMaxBounds = !1, this.isClamping = !1, this.lastCenter = [0, 0], this.lastStyledZoom = null, this.dispatchViewportStateThrottled = n(() => this.dispatchViewportState(), 100), this.runtimeLayerOrder = [], this.layerOrderRegistry = null, this.layerZStepMeters = .5, this.basePolylinePositions = /* @__PURE__ */ new WeakMap(), this.terrainEnabled = !1, this.arcgisTerrainProvider = null, this.boundKeydown = null;
	}
	initialize(e, t) {
		let n = F();
		if (!n) throw Error("[Cesium] window.Cesium not found. Load CesiumJS before using the cesium adapter.");
		let r = t?.center ?? [0, 0], i = t?.zoom ?? 1, a = this.resolveContainer(e);
		this.minZoom = t?.minZoom, this.maxZoom = t?.maxZoom, this.maxBounds = t?.maxBounds, this.minPitch = typeof t?.minPitch == "number" ? Math.max(0, Math.min(85, t.minPitch)) : 0, this.maxPitch = typeof t?.maxPitch == "number" ? Math.max(0, Math.min(85, t.maxPitch)) : 85, this.minPitch > this.maxPitch && (this.minPitch = this.maxPitch);
		let o = document.createElement("div");
		o.style.display = "none", this.viewer = new n.Viewer(a, {
			animation: !1,
			baseLayerPicker: !1,
			fullscreenButton: !1,
			geocoder: !1,
			homeButton: !1,
			infoBox: !1,
			navigationHelpButton: !1,
			sceneModePicker: !1,
			selectionIndicator: !1,
			timeline: !1,
			vrButton: !1,
			scene3DOnly: !0,
			baseLayer: !1,
			terrainProvider: new n.EllipsoidTerrainProvider(),
			creditContainer: o
		}), navigator.maxTouchPoints > 0 && (this.viewer.scene.highDynamicRange = !1, this.viewer.scene.skyAtmosphere.show = !1, this.viewer.scene.globe.showGroundAtmosphere = !1);
		let s = this.clampZoom(i);
		this.setCameraView(r, s, !1), this.applyZoomDistanceLimits(r[1]), this.maxBounds && (this.viewer.camera.percentageChanged = .01, this.viewer.scene.preUpdate.addEventListener(() => this.enforceMaxBounds())), this.attachEvents(), this.store.dispatch({
			mapLoaded: !0,
			mapBusy: !1,
			mapCenter: r,
			zoomLevel: i,
			mapViewportBounds: this.computeViewportBounds()
		}, "MAP"), this.flushReady();
	}
	setTerrainEnabled(e, t) {
		let n = F();
		if (!n || !this.viewer) return !1;
		if (this.terrainEnabled = e, !e) return this.viewer.terrainProvider = new n.EllipsoidTerrainProvider(), !0;
		if (this.arcgisTerrainProvider) return this.viewer.terrainProvider = this.arcgisTerrainProvider, !0;
		let r = t ?? "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer";
		return Promise.resolve(n.ArcGISTiledElevationTerrainProvider.fromUrl(r)).then((e) => {
			this.arcgisTerrainProvider = e, this.terrainEnabled && this.viewer && (this.viewer.terrainProvider = e);
		}).catch((e) => console.error("[Cesium] failed to load terrain provider", e)), !0;
	}
	isTerrainEnabled() {
		return this.viewer ? this.terrainEnabled : null;
	}
	getElevation(e) {
		let t = F();
		if (!t || !this.viewer || !this.terrainEnabled) return null;
		let n = t.Cartographic.fromDegrees(e[0], e[1]);
		return this.viewer.scene.globe.getHeight(n) ?? null;
	}
	getViewportState() {
		if (!this.viewer) return {
			center: this.lastCenter,
			zoom: 1,
			bearing: 0,
			pitch: 0
		};
		let e = F();
		if (!e) return {
			center: this.lastCenter,
			zoom: 1,
			bearing: 0,
			pitch: 0
		};
		let t = this.viewer.camera, n = this.computeViewportCenter() ?? this.lastCenter;
		this.lastCenter = n;
		let r = t.positionCartographic?.height ?? e.Ellipsoid.WGS84.cartesianToCartographic(t.positionWC).height;
		return {
			center: n,
			zoom: this.cameraHeightMetersToZoom(r, n[1]),
			bearing: t.heading * 180 / Math.PI,
			pitch: e.Math.toDegrees(t.pitch + Math.PI / 2)
		};
	}
	setViewport(e, t, n) {
		if (!this.viewer || !F()) return;
		let r = this.clampZoom(t);
		this.lastCenter = e, this.setCameraView(e, r, n?.animate !== !1), this.applyZoomDistanceLimits(e[1]);
	}
	setZoom(e) {
		let t = this.getViewportState(), n = this.clampZoom(e);
		if (t.zoom === n && n !== e) {
			this.dispatchViewportState();
			return;
		}
		this.setViewport(t.center, e);
	}
	getZoom() {
		return this.getViewportState().zoom;
	}
	getNavigationCapabilities() {
		return {
			bearing: !0,
			pitch: !0,
			keyboard: !1
		};
	}
	getBearing() {
		return this.getViewportState().bearing;
	}
	setBearing(e) {
		if (!this.viewer || !F()) return;
		let t = this.computeViewportCenter();
		if (!t) return;
		let n = this.getPitch();
		this.applyHeadingPitch(t, e, n);
	}
	getPitch() {
		let e = F();
		return !e || !this.viewer ? 0 : e.Math.toDegrees(this.viewer.camera.pitch + Math.PI / 2);
	}
	setPitch(e) {
		if (!this.viewer || !F()) return;
		let t = this.computeViewportCenter();
		if (!t) return;
		let n = this.getBearing(), r = Math.max(this.minPitch, Math.min(this.maxPitch, e));
		this.applyHeadingPitch(t, n, r);
	}
	resetNorth() {
		this.setBearing(0);
	}
	resetNorthPitch() {
		this.viewer && (this.setBearing(0), this.setPitch(0));
	}
	setProjection(e) {
		return !1;
	}
	getProjection() {
		return null;
	}
	applyHeadingPitch(e, t, n) {
		if (!this.viewer) return;
		let r = F();
		if (!r) return;
		let i = this.viewer.camera, a = r.Cartesian3.fromDegrees(e[0], e[1]), o = Math.max(1, r.Cartesian3.distance(i.positionWC, a)), s = r.Math.toRadians(t), c = r.Math.toRadians(-90 + n);
		i.lookAt(a, new r.HeadingPitchRange(s, c, o)), i.lookAtTransform(r.Matrix4.IDENTITY);
	}
	addLayer(e, t) {
		let n = e, r = n?.source;
		if (!r) return !1;
		let i = this.sourceState.get(r);
		if (!i) return !1;
		let a = typeof n?.id == "string" ? n.id : null;
		a && (this.insertRuntimeLayer(a, t), this.layerOrderRegistry?.registerInlineLayer(a, t), i.layers = i.layers.filter((e) => e?.spec?.id !== a));
		let o = {
			spec: n,
			dataSource: null
		};
		return this.insertLayerByOptions(i.layers, o, t) || i.layers.push(o), this.refreshSourceLayerData(r), !0;
	}
	removeLayer(e) {
		let t = e;
		typeof t == "string" && (this.removeRuntimeLayer(t), this.layerOrderRegistry?.unregisterInlineLayer(t));
		for (let [, e] of this.sourceState.entries()) {
			let n = e.layers.length, r = e.layers.filter((e) => e.spec?.id === t);
			if (e.layers = e.layers.filter((e) => e.spec?.id !== t), e.layers.length !== n) {
				for (let e of r) this.removeLayerDataSource(e);
				return;
			}
		}
	}
	addSource(e, t) {
		if (!this.viewer || !F() || this.sources.has(e) || t?.type !== "geojson" || !t.data) return;
		this.sourceState.set(e, {
			data: t.data,
			layers: []
		});
		let n = (t) => {
			let n = this.sourceState.get(e);
			n && (n.data = t, this.refreshSourceLayerData(e));
		}, r = {
			id: e,
			setData: n
		};
		this.sources.set(e, r), n(t.data);
	}
	removeSource(e) {
		let t = this.sourceState.get(e);
		if (t?.layers?.length) for (let e of t.layers) {
			let t = typeof e.spec?.id == "string" ? e.spec.id : null;
			t && this.removeRuntimeLayer(t), this.removeLayerDataSource(e);
		}
		this.sourceState.delete(e), this.sources.delete(e);
	}
	getSource(e) {
		return this.sources.get(e);
	}
	suppressBusySignalForSource(e) {}
	unsuppressBusySignalForSource(e) {}
	project(e) {
		let t = F();
		if (!t || !this.viewer) return [0, 0];
		let n = t.Cartesian3.fromDegrees(e[0], e[1]), r = t.SceneTransforms.worldToWindowCoordinates(this.viewer.scene, n);
		return r ? [r.x, r.y] : [0, 0];
	}
	unproject(e) {
		let t = F();
		if (!t || !this.viewer) return null;
		let n = new t.Cartesian2(e[0], e[1]), r = this.viewer.camera.pickEllipsoid(n, t.Ellipsoid.WGS84);
		if (!r) return null;
		let i = t.Ellipsoid.WGS84.cartesianToCartographic(r);
		return [i.longitude * 180 / Math.PI, i.latitude * 180 / Math.PI];
	}
	fitBounds(e) {
		let t = F();
		if (!(!t || !this.viewer)) try {
			let n = e[0], r = e[1], i = e[2], a = e[3], o = t.Rectangle.fromDegrees(n, r, i, a);
			this.viewer.camera.flyTo({
				destination: o,
				duration: 3
			});
		} catch {
			let n = (e[0] + e[2]) / 2, r = (e[1] + e[3]) / 2, i = this.zoomToCameraHeightMeters(this.getViewportState().zoom, r);
			this.viewer.camera.flyTo({
				destination: t.Cartesian3.fromDegrees(n, r, i),
				duration: 3
			});
		}
	}
	setCursor(e) {
		if (!this.viewer) return;
		let t = this.viewer.canvas;
		t.style.cursor = e;
	}
	setPanEnabled(e) {
		if (!this.viewer) return;
		let t = this.viewer.scene.screenSpaceCameraController;
		t.enableTranslate = e, t.enableRotate = e, t.enableTilt = e, t.enableZoom = e;
	}
	setTouchCaptureEnabled(e) {}
	setDoubleClickZoomEnabled(e) {}
	setLayerVisibility(e, t) {
		for (let n of this.sourceState.values()) for (let r of n.layers) r.spec?.id === e && r.dataSource && (r.dataSource.show = t);
	}
	getSourceData(e) {
		return this.sourceState.get(e)?.data ?? null;
	}
	onMapReady(e) {
		if (this.viewer) {
			e(this.viewer);
			return;
		}
		this.readyCbs.push(e);
	}
	flushReady() {
		this.viewer && this.readyCbs.splice(0).forEach((e) => e(this.viewer));
	}
	attachEvents() {
		if (!this.viewer || !this.eventBus) return;
		let e = F();
		if (!e) return;
		let t = new e.ScreenSpaceEventHandler(this.viewer.scene.canvas), n = (t) => {
			let n = this.viewer.camera.pickEllipsoid(t, e.Ellipsoid.WGS84);
			if (!n) return null;
			let r = e.Ellipsoid.WGS84.cartesianToCartographic(n);
			return [r.longitude * 180 / Math.PI, r.latitude * 180 / Math.PI];
		};
		t.setInputAction((e) => {
			let t = n(e.endPosition);
			if (!t) {
				this.store.dispatch({
					pointerCoordinates: null,
					pointerResolution: null
				}, "MAP");
				return;
			}
			let r = [e.endPosition.x, e.endPosition.y];
			this.eventBus?.emit({
				type: "pointer-move",
				coords: t,
				pixel: r,
				resolution: null,
				originalEvent: e
			}), this.store.dispatch({
				pointerCoordinates: t,
				pointerResolution: null
			}, "MAP");
		}, e.ScreenSpaceEventType.MOUSE_MOVE), t.setInputAction((e) => {
			let t = n(e.position);
			if (!t) return;
			let r = [e.position.x, e.position.y];
			this.eventBus?.emit({
				type: "click",
				coords: t,
				pixel: r,
				resolution: null,
				originalEvent: e
			}), this.store.dispatch({
				lastClickedCoordinates: t,
				pointerCoordinates: t,
				lastClickedResolution: null,
				pointerResolution: null
			}, "MAP");
		}, e.ScreenSpaceEventType.LEFT_CLICK), t.setInputAction((e) => {
			let t = n(e.position);
			if (!t) return;
			let r = [e.position.x, e.position.y];
			this.eventBus?.emit({
				type: "pointer-down",
				coords: t,
				pixel: r,
				button: 0,
				originalEvent: e
			});
		}, e.ScreenSpaceEventType.LEFT_DOWN), t.setInputAction((e) => {
			let t = n(e.position);
			if (!t) return;
			let r = [e.position.x, e.position.y];
			this.eventBus?.emit({
				type: "pointer-up",
				coords: t,
				pixel: r,
				button: 0,
				originalEvent: e
			});
		}, e.ScreenSpaceEventType.LEFT_UP), this.viewer.scene.canvas.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			let t = this.viewer.scene.canvas.getBoundingClientRect(), r = {
				x: e.clientX - t.left,
				y: e.clientY - t.top
			}, i = n(r);
			if (!i) return;
			let a = [r.x, r.y];
			this.eventBus?.emit({
				type: "contextmenu",
				coords: i,
				pixel: a,
				originalEvent: e
			});
		}), this.viewer.camera.moveEnd.addEventListener(() => {
			this.enforceMaxBounds(), this.dispatchViewportState();
		}), this.viewer.camera.changed.addEventListener(() => {
			this.enforceMaxBounds(), this.dispatchViewportStateThrottled();
		});
		let r = this.viewer.scene.canvas;
		r && (r.tabIndex = -1), this.boundKeydown = (e) => {
			if (i(e)) return;
			let t = document.activeElement;
			if (!(t && t !== document.body && t !== document.documentElement && t !== this.viewer?.scene?.canvas)) {
				if (e.key === "+" || e.key === "=") {
					e.preventDefault(), this.setZoom(this.getZoom() + 1);
					return;
				}
				if (e.key === "-") {
					e.preventDefault(), this.setZoom(this.getZoom() - 1);
					return;
				}
				if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
					if (!this.viewer) return;
					e.preventDefault();
					let t = this.viewer.scene.canvas, n = H(this.getZoom(), (this.computeViewportCenter() ?? this.lastCenter)[1]) * t.clientWidth * .15, r = this.viewer.camera;
					e.key === "ArrowLeft" && r.moveLeft(n), e.key === "ArrowRight" && r.moveRight(n), e.key === "ArrowUp" && r.moveUp(n), e.key === "ArrowDown" && r.moveDown(n), this.dispatchViewportState();
				}
			}
		}, document.addEventListener("keydown", this.boundKeydown);
	}
	resolveContainer(e) {
		let t = document.getElementById(e);
		if (!t) throw Error(`[Cesium] Container #${e} not found.`);
		if (t.tagName.toLowerCase() === "webmapx-map") {
			let e = t.querySelector("[slot=\"map-view\"]");
			if (e) return e;
		}
		return t;
	}
	computeViewportCenter() {
		let e = F();
		if (!e || !this.viewer) return null;
		let t = this.viewer.scene.canvas, n = new e.Cartesian2(t.clientWidth / 2, t.clientHeight / 2), r = this.viewer.camera.pickEllipsoid(n, e.Ellipsoid.WGS84);
		if (!r) return null;
		let i = e.Ellipsoid.WGS84.cartesianToCartographic(r);
		return [i.longitude * 180 / Math.PI, i.latitude * 180 / Math.PI];
	}
	computeViewportBounds() {
		let e = F();
		if (!e || !this.viewer) return null;
		let t = this.viewer.scene.canvas, n = [
			new e.Cartesian2(0, t.clientHeight),
			new e.Cartesian2(t.clientWidth, t.clientHeight),
			new e.Cartesian2(t.clientWidth, 0),
			new e.Cartesian2(0, 0)
		], r = [];
		for (let t of n) {
			let n = this.viewer.camera.pickEllipsoid(t, e.Ellipsoid.WGS84);
			if (!n) continue;
			let i = e.Ellipsoid.WGS84.cartesianToCartographic(n);
			r.push([i.longitude * 180 / Math.PI, i.latitude * 180 / Math.PI]);
		}
		return r.length === 0 ? null : (r.length > 0 && (r[0][0] !== r[r.length - 1][0] || r[0][1] !== r[r.length - 1][1]) && r.push(r[0]), {
			type: "Feature",
			properties: {},
			geometry: {
				type: "Polygon",
				coordinates: [r]
			}
		});
	}
	zoomToCameraHeightMeters(e, t) {
		if (!F() || !this.viewer) return oe(e);
		let n = H(e, t), r = this.viewer.scene.canvas, i = Math.max(1, r.clientHeight || r.height || 1), a = this.viewer.camera.frustum, o = a && "fovy" in a ? a.fovy : Math.PI / 3;
		return Math.max(10, n * i / (2 * Math.tan(o / 2)));
	}
	cameraHeightMetersToZoom(e, t) {
		if (!F() || !this.viewer) return R(e);
		let n = this.viewer.scene.canvas, r = Math.max(1, n.clientHeight || n.height || 1), i = this.viewer.camera.frustum, a = i && "fovy" in i ? i.fovy : Math.PI / 3, o = e * 2 * Math.tan(a / 2) / r, s = V(t) * Math.PI / 180, c = 2 * Math.PI * z, l = B * o;
		return !isFinite(l) || l <= 0 ? 0 : Math.log2(c * Math.cos(s) / l);
	}
	clampZoom(e) {
		let t = e, n = this.maxBoundsZoomFloor();
		return n !== void 0 && (t = Math.max(t, n)), this.minZoom !== void 0 && (t = Math.max(t, this.minZoom)), this.maxZoom !== void 0 && (t = Math.min(t, this.maxZoom)), t;
	}
	applyZoomDistanceLimits(e) {
		if (!this.viewer) return;
		let t = this.viewer.scene?.screenSpaceCameraController;
		if (!t) return;
		this.maxZoom !== void 0 && (t.minimumZoomDistance = this.zoomToCameraHeightMeters(this.maxZoom, e));
		let n = this.maxBoundsZoomFloor(), r = n === void 0 ? this.minZoom : Math.max(n, this.minZoom ?? -Infinity);
		r !== void 0 && (t.maximumZoomDistance = this.zoomToCameraHeightMeters(r, e));
	}
	static mercatorYFraction(e) {
		let t = V(e) * Math.PI / 180;
		return .5 - Math.log(Math.tan(Math.PI / 4 + t / 2)) / (2 * Math.PI);
	}
	static mercatorYFractionToLat(e) {
		return (2 * Math.atan(Math.exp((.5 - e) * 2 * Math.PI)) - Math.PI / 2) * 180 / Math.PI;
	}
	maxBoundsZoomFloor() {
		if (!this.maxBounds || !this.viewer) return;
		let t = this.viewer.scene?.canvas, n = t?.clientWidth ?? 0, r = t?.clientHeight ?? 0;
		if (!n || !r) return;
		let [i, a, o, s] = this.maxBounds, c = (o - i) / 360, l = e.mercatorYFraction(a) - e.mercatorYFraction(s);
		if (c <= 0 || l <= 0) return;
		let u = Math.log2(n / (B * c)), d = Math.log2(r / (B * l));
		return Math.max(u, d);
	}
	enforceMaxBounds() {
		if (!this.maxBounds || !this.viewer || this.enforcingMaxBounds) return;
		let t = this.viewer.scene?.canvas, n = t?.clientWidth ?? 0, r = t?.clientHeight ?? 0;
		if (!n || !r) return;
		let i = this.computeViewportCenter();
		if (!i) return;
		let [a, o, s, c] = this.maxBounds, l = this.maxBoundsZoomFloor() ?? -Infinity, u = Math.max(this.getZoom(), l), d = B * 2 ** u, f = n / 2 / d, p = r / 2 / d, m = (e, t, n) => t > n ? (t + n) / 2 : Math.min(Math.max(e, t), n), h = m((i[0] + 180) / 360, (a + 180) / 360 + f, (s + 180) / 360 - f), g = m(e.mercatorYFraction(i[1]), e.mercatorYFraction(c) + p, e.mercatorYFraction(o) - p), _ = [h * 360 - 180, e.mercatorYFractionToLat(g)], v = Math.abs(_[0] - i[0]) > 1e-7 || Math.abs(_[1] - i[1]) > 1e-7, y = u - this.getZoom() > .01;
		if (!(!v && !y)) {
			this.enforcingMaxBounds = !0;
			try {
				this.setCameraView(_, this.clampZoom(u), !1);
			} finally {
				this.enforcingMaxBounds = !1;
			}
		}
	}
	setCameraView(t, n, r) {
		if (!this.viewer) return;
		let i = F();
		if (!i) return;
		let a = this.viewer.camera, o = a.heading, s = a.pitch, c = i.Cartesian3.fromDegrees(t[0], t[1]), l = this.zoomToCameraHeightMeters(n, t[1]), u = Math.max(1, l / Math.max(.01, Math.abs(Math.sin(s)))), d = new i.HeadingPitchRange(o, s, u), f = () => {
			a.lookAt(c, d), a.lookAtTransform(i.Matrix4.IDENTITY);
		};
		if (!r || m()) {
			f();
			return;
		}
		let p = {
			destination: i.Cartesian3.clone(a.position),
			orientation: {
				direction: i.Cartesian3.clone(a.direction),
				up: i.Cartesian3.clone(a.up)
			}
		};
		f();
		let h = i.Cartesian3.clone(a.position), g = {
			direction: i.Cartesian3.clone(a.direction),
			up: i.Cartesian3.clone(a.up)
		};
		a.setView(p);
		let _ = Math.max(1, a.positionCartographic.height), v = Math.max(1, i.Cartographic.fromCartesian(h)?.height ?? _), y = i.Cartesian3.distance(p.destination, h) < e.SHORT_HOP_SCREENS * Math.min(_, v);
		a.flyTo({
			destination: h,
			orientation: g,
			complete: f,
			...y ? { duration: e.SHORT_HOP_SECONDS } : {}
		});
	}
	static {
		this.SHORT_HOP_SCREENS = 1.5;
	}
	static {
		this.SHORT_HOP_SECONDS = .5;
	}
	dispatchViewportState() {
		this.isClamping &&= !1;
		let e = this.getViewportState(), t = this.clampZoom(e.zoom);
		if (t !== e.zoom) {
			this.isClamping = !0, this.setCameraView(e.center, t, !1), this.applyZoomDistanceLimits(e.center[1]);
			return;
		}
		this.applyZoomDistanceLimits(e.center[1]), this.lastCenter = e.center;
		let n = this.computeViewportBounds();
		this.store.dispatch({
			zoomLevel: e.zoom,
			mapCenter: e.center,
			mapViewportBounds: n
		}, "MAP"), (this.lastStyledZoom === null || Math.abs(this.lastStyledZoom - e.zoom) > .05) && (this.lastStyledZoom = e.zoom, this.applyAllSourceStyles());
		let r = n ? n.geometry.coordinates[0][0] : e.center, i = n ? n.geometry.coordinates[0][2] : e.center;
		this.eventBus?.emit({
			type: "view-change-end",
			center: e.center,
			zoom: e.zoom,
			bearing: e.bearing,
			pitch: e.pitch,
			bounds: {
				sw: r,
				ne: i
			}
		}), this.eventBus?.emit({
			type: "zoom-end",
			zoom: e.zoom
		});
	}
	applyAllSourceStyles() {
		for (let e of this.sourceState.keys()) this.applySourceStyles(e);
	}
	applySourceStyles(e) {
		if (!F() || !this.viewer) return;
		let t = this.sourceState.get(e);
		if (t) for (let e of t.layers) this.applyLayerStyle(e);
	}
	applyLayerStyle(e) {
		let n = F();
		if (!n || !this.viewer || !e.dataSource) return;
		let r = e.spec, i = r?.paint ?? {}, a = this.store.getState().zoomLevel ?? 2, o = this.isLayerVisibleAtZoom(r, a), s = W(a), c = this.getLayerZOffset(r, s), l = e.dataSource.entities?.values ?? [];
		for (let e of l) {
			let l = this.getEntityGeometryType(e), u = o && this.entityMatchesLayer(e, r, l);
			if (e.polygon && I(e.polygon, "show", u && r?.type === "fill"), e.polyline && r?.type !== "line" && I(e.polyline, "show", !1), e.billboard && I(e.billboard, "show", !1), e.point && I(e.point, "show", !1), e.ellipse && I(e.ellipse, "show", u && r?.type === "circle"), u) {
				if (r?.type === "fill" && e.polygon) {
					let r = {
						properties: this.getEntityProperties(e),
						geometry: { type: "Polygon" }
					}, o = f(i["fill-color"] ?? "#444444", r, a, t), s = d(i["fill-opacity"] ?? .2, r, a, .2);
					L(e.polygon, n.Color.fromCssColorString(o).withAlpha(s)), I(e.polygon, "outline", !1), I(e.polygon, "height", c);
				}
				if (r?.type === "line") {
					if (!e.polyline && e.polygon) {
						let t = e.polygon.hierarchy?.getValue?.(n.JulianDate.now()) ?? e.polygon.hierarchy, r = t?.positions ?? t;
						Array.isArray(r) && r.length > 0 && (e.polyline = new n.PolylineGraphics(), e.polyline.positions = [...r, r[0]]);
					}
					if (e.polyline) {
						I(e.polyline, "show", !0);
						let r = {
							properties: this.getEntityProperties(e),
							geometry: { type: "LineString" }
						}, o = f(i["line-color"] ?? "#444444", r, a, t), s = d(i["line-width"] ?? 2, r, a, 2);
						L(e.polyline, n.Color.fromCssColorString(o).withAlpha(1)), I(e.polyline, "width", s);
						let l = i["line-dasharray"];
						if (Array.isArray(l) && l.length >= 2 && n.PolylineDashMaterialProperty) {
							let t = e.polyline.material, r = n.Color.fromCssColorString(o).withAlpha(1), i = l[0] + l[1], a = !0;
							if (t instanceof n.PolylineDashMaterialProperty && t.color instanceof n.ConstantProperty) {
								let e = n.JulianDate?.now?.() || new n.JulianDate(), o = t.color.getValue(e);
								o && o.equals(r) && (t.dashLength?.getValue?.(e) ?? t.dashLength) === i && (a = !1);
							}
							a && (e.polyline.material = new n.PolylineDashMaterialProperty({
								color: r,
								dashLength: i
							}));
						}
						this.applyPolylineHeightOffset(e, c);
					}
				}
				if (r?.type === "circle" && (e.position || e.point || e.billboard || e.ellipse)) {
					let t = i["circle-color"] ?? "#444444", r = i["circle-opacity"] ?? 1, o = i["circle-radius"] ?? 6, l = i["circle-stroke-color"] ?? "#444444", u = i["circle-stroke-width"] ?? 1, d = n.JulianDate.now(), f = e.position?.getValue?.(d) ?? e.position;
					if (!f) continue;
					let p = n.Ellipsoid.WGS84.cartesianToCartographic(f), m = p.latitude * 180 / Math.PI, h = H(a, m), g = Math.max(1, Number(o) * h), _ = c + U(g) * s;
					e.ellipse ||= new n.EllipseGraphics(), I(e.ellipse, "show", !0), I(e.ellipse, "semiMajorAxis", g), I(e.ellipse, "semiMinorAxis", g), L(e.ellipse, n.Color.fromCssColorString(String(t)).withAlpha(Number(r))), I(e.ellipse, "outline", !0);
					let v = n.Color.fromCssColorString(String(l)).withAlpha(1);
					if (e.ellipse.outlineColor instanceof n.ConstantProperty) {
						let t = n.JulianDate?.now?.() || new n.JulianDate(), r = e.ellipse.outlineColor.getValue(t);
						(!r || !r.equals(v)) && e.ellipse.outlineColor.setValue(v);
					} else e.ellipse.outlineColor = v;
					I(e.ellipse, "outlineWidth", Number(u));
					let y = G(n.Math.toDegrees(p.longitude), m, g, 64), b = _ + Math.max(1, g * .01), x = y.map(([e, t]) => n.Cartesian3.fromDegrees(e, t, b));
					e.polyline ||= new n.PolylineGraphics(), I(e.polyline, "show", !0);
					let S = e.polyline.positions, C = !0;
					if (S && typeof S.getValue == "function") {
						let e = n.JulianDate?.now?.() || new n.JulianDate(), t = S.getValue(e);
						if (Array.isArray(t) && t.length === x.length) {
							C = !1;
							for (let e = 0; e < x.length; e++) if (!t[e].equals(x[e])) {
								C = !0;
								break;
							}
						}
					}
					C && (e.polyline.positions = x), I(e.polyline, "width", Math.max(1, Number(u))), L(e.polyline, n.Color.fromCssColorString(String(l)).withAlpha(1)), "clampToGround" in e.polyline && I(e.polyline, "clampToGround", !1), n.HeightReference?.CLAMP_TO_GROUND && I(e.ellipse, "heightReference", n.HeightReference.NONE), I(e.ellipse, "height", _), e.billboard = void 0, e.point = void 0;
				}
			}
		}
	}
	isLayerVisibleAtZoom(e, t) {
		let n = this.toNumericZoom(e?.minzoom ?? e?.minZoom), r = this.toNumericZoom(e?.maxzoom ?? e?.maxZoom);
		return !(n !== void 0 && t < n || r !== void 0 && t >= r);
	}
	toNumericZoom(e) {
		return typeof e == "number" && isFinite(e) ? e : void 0;
	}
	getLayerZOffset(e, t = 1) {
		let n = typeof e?.id == "string" ? e.id : null;
		if (!n) return 0;
		let r = this.runtimeLayerOrder.indexOf(n);
		return r < 0 ? 0 : (r + 1) * this.layerZStepMeters * t;
	}
	removeRuntimeLayer(e) {
		this.runtimeLayerOrder = this.runtimeLayerOrder.filter((t) => t !== e);
	}
	insertRuntimeLayer(e, t) {
		this.removeRuntimeLayer(e), this.insertByOptions(this.runtimeLayerOrder, e, t) || this.runtimeLayerOrder.push(e);
	}
	insertLayerByOptions(e, t, n) {
		if (!(typeof t.spec?.id == "string" && t.spec.id)) return !1;
		let r = n?.beforeLayerId;
		if (typeof r == "string") {
			let n = e.findIndex((e) => e.spec?.id === r);
			if (n >= 0) return e.splice(n, 0, t), !0;
		}
		let i = n?.afterLayerId;
		if (typeof i == "string") {
			let n = e.findIndex((e) => e.spec?.id === i);
			if (n >= 0) return e.splice(n + 1, 0, t), !0;
		}
		return !1;
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
	applyPolylineHeightOffset(e, t) {
		let n = F();
		if (!n || !e?.polyline || e._lastHeightOffset === t) return;
		let r = n.JulianDate.now(), i = e.polyline, a = i.positions?.getValue?.(r) ?? i.positions;
		if (!Array.isArray(a) || a.length === 0) return;
		let o = this.basePolylinePositions.get(e);
		if (o || (o = [...a], this.basePolylinePositions.set(e, o)), e._lastHeightOffset = t, !(typeof t == "number" && isFinite(t) && t > 0)) {
			i.positions = o;
			return;
		}
		i.positions = o.map((e) => {
			let r = n.Ellipsoid.WGS84.cartesianToCartographic(e), i = (r.height ?? 0) + t;
			return n.Cartesian3.fromRadians(r.longitude, r.latitude, i);
		});
	}
	refreshSourceLayerData(e) {
		if (!F() || !this.viewer) return;
		let t = this.sourceState.get(e);
		if (!(!t || !t.data)) for (let n of t.layers) this.loadLayerDataSource(e, n);
	}
	async loadLayerDataSource(e, t) {
		let n = F();
		if (!(!n || !this.viewer)) {
			if (t.loading) {
				t.pending = !0;
				return;
			}
			t.loading = !0;
			try {
				for (;;) {
					t.pending = !1;
					let r = this.sourceState.get(e);
					if (!r?.data) return;
					let i = await n.GeoJsonDataSource.load(r.data, { clampToGround: !1 });
					if (w(i, n), !this.sourceState.get(e)?.layers.includes(t)) return;
					let a = t.dataSource;
					if (this.removeLayerDataSource({ dataSource: a }), t.dataSource = i, this.viewer.dataSources.add(i), this.applyLayerStyle(t), setTimeout(() => this.reapplyDataSourceOrder(), 0), !t.pending) return;
				}
			} finally {
				t.loading = !1;
			}
		}
	}
	reapplyDataSourceOrder() {
		if (this.viewer) {
			for (let e of this.runtimeLayerOrder) for (let t of this.sourceState.values()) for (let n of t.layers) if (n.spec?.id === e && n.dataSource) try {
				this.viewer.dataSources.raiseToTop(n.dataSource);
			} catch {}
		}
	}
	removeLayerDataSource(e) {
		if (!e.dataSource || !this.viewer) return;
		let t = e.dataSource, n = this.viewer;
		setTimeout(() => {
			try {
				n.dataSources.remove(t, !0);
			} catch {}
		}, 0);
	}
	getEntityProperties(e) {
		let t = e?.properties;
		if (!t) return {};
		let n = t.propertyNames ?? Object.keys(t), r = {};
		for (let e of n) {
			let n = t[e];
			r[e] = typeof n?.getValue == "function" ? n.getValue(void 0) : n;
		}
		return r;
	}
	getEntityGeometryType(e) {
		return e.position || e.point || e.billboard || e.ellipse ? "Point" : e.polygon ? "Polygon" : e.polyline ? "LineString" : null;
	}
	entityMatchesLayer(e, t, n) {
		let r = t?.type === "fill" ? "Polygon" : t?.type === "line" ? "LineString" : t?.type === "circle" ? "Point" : null;
		return !r || n === r || t?.type === "line" && n === "Polygon" ? this.matchesFilter(e, t?.filter) : !1;
	}
	matchesFilter(e, t) {
		if (!Array.isArray(t) || t.length < 3) return !0;
		let [n, r, i] = t;
		return n === "==" ? this.resolveFilterOperand(e, r) === i : !0;
	}
	resolveFilterOperand(e, t) {
		let n = F()?.JulianDate?.now?.();
		if (t === "$type" || Array.isArray(t) && t[0] === "geometry-type") return this.getEntityGeometryType(e);
		if (Array.isArray(t) && t[0] === "get" && typeof t[1] == "string") {
			let r = e?.properties?.[t[1]];
			return r ? typeof r.getValue == "function" ? r.getValue(n) : r : void 0;
		}
		return t;
	}
	setLayerOrderRegistry(e) {
		this.layerOrderRegistry = e;
	}
	clampImageryProviderMaxLevel(e, t) {
		if (!e || typeof t != "number" || !isFinite(t)) return;
		if (typeof e.requestImage == "function") {
			let n = e.requestImage.bind(e);
			e.requestImage = (e, r, i, ...a) => n(e, r, Math.min(i, t), ...a);
		}
		let n = e.tilingScheme, r = (e) => e ? (r) => e.call(n, Math.min(r, t)) : void 0;
		if (n) {
			if (typeof n.getNumberOfXTilesAtLevel == "function") {
				let e = n.getNumberOfXTilesAtLevel;
				n.getNumberOfXTilesAtLevel = r(e);
			}
			if (typeof n.getNumberOfYTilesAtLevel == "function") {
				let e = n.getNumberOfYTilesAtLevel;
				n.getNumberOfYTilesAtLevel = r(e);
			}
		}
	}
}, se = class {
	toggleTool() {}
	setBufferRadius(e) {}
};
//#endregion
//#region src/map/cesium-services/MapFactoryService.ts
function q() {
	return globalThis.Cesium;
}
function ce(e) {
	return typeof ShadowRoot < "u" && e instanceof ShadowRoot;
}
function J(e) {
	return Math.max(10, 2e7 / 2 ** Math.max(0, e));
}
function le(e) {
	return !isFinite(e) || e <= 0 ? 0 : Math.log2(2e7 / e);
}
var ue = 6378137, de = 512;
function fe(e) {
	return Math.max(-85.05112878, Math.min(85.05112878, e));
}
function pe(e, t) {
	let n = fe(t) * Math.PI / 180;
	return 2 * Math.PI * ue * Math.cos(n) / (de * 2 ** e);
}
function Y(e, t, n) {
	let r = e.scene.canvas, i = Math.max(1, r.clientHeight || r.height || 1), a = e.camera.frustum, o = a && "fovy" in a ? a.fovy : Math.PI / 3, s = pe(t, n);
	return Math.max(10, s * i / (2 * Math.tan(o / 2)));
}
var me = class {
	constructor(e, t, n) {
		this.id = e, this.getDataSource = t, this.setDataFn = n;
	}
	setData(e) {
		this.setDataFn(e);
	}
}, he = class {
	constructor(e, t, n) {
		this.id = e, this.sourceId = t, this.destroyFn = n;
	}
	getSource() {
		return {
			id: this.sourceId,
			setData: () => {}
		};
	}
	remove() {
		this.destroyFn();
	}
}, ge = class {
	constructor(e) {
		this.viewer = e, this.sources = /* @__PURE__ */ new Map(), this.sourceState = /* @__PURE__ */ new Map(), this.layers = /* @__PURE__ */ new Map();
	}
	setViewport(e, t, n, r) {
		let i = q();
		if (!i) return;
		let a = Y(this.viewer, t, e[1]);
		this.viewer.camera.setView({ destination: i.Cartesian3.fromDegrees(e[0], e[1], a) });
	}
	createSource(e, t) {
		if (this.sources.has(e)) return this.sources.get(e);
		let n = q();
		if (!n) return {
			id: e,
			setData: () => {}
		};
		this.sourceState.set(e, {
			dataSource: null,
			layerSpecs: []
		});
		let r = (t) => {
			let r = this.sourceState.get(e);
			if (!r) return;
			let i = r.dataSource;
			n.GeoJsonDataSource.load(t, { clampToGround: !1 }).then((t) => {
				w(t, n), i && this.viewer.dataSources.remove(i, !0), r.dataSource = t, this.viewer.dataSources.add(t), this.applyLayerStyles(e);
			});
		};
		r(t);
		let i = new me(e, () => this.sourceState.get(e)?.dataSource ?? null, r);
		return this.sources.set(e, i), i;
	}
	getSource(e) {
		return this.sources.get(e) ?? null;
	}
	createLayer(e) {
		if (this.layers.has(e.id)) return this.layers.get(e.id);
		let t = this.sourceState.get(e.source);
		t && (t.layerSpecs = [...t.layerSpecs, e], this.applyLayerStyles(e.source));
		let n = new he(e.id, e.source, () => {
			let t = this.sourceState.get(e.source);
			t && (t.layerSpecs = t.layerSpecs.filter((t) => t.id !== e.id), this.applyLayerStyles(e.source)), this.layers.delete(e.id);
		});
		return this.layers.set(e.id, n), n;
	}
	getLayer(e) {
		return this.layers.get(e) ?? null;
	}
	onReady(e) {
		queueMicrotask(e);
	}
	destroy() {
		try {
			this.viewer?.destroy?.();
		} catch {}
		this.sources.clear(), this.sourceState.clear(), this.layers.clear();
	}
	applyLayerStyles(e) {
		let t = q();
		if (!t) return;
		let n = this.sourceState.get(e), r = n?.dataSource;
		if (!n || !r) return;
		let i = n.layerSpecs.filter((e) => e.type === "fill"), a = n.layerSpecs.filter((e) => e.type === "line"), o = i[i.length - 1], s = a[a.length - 1], c = o?.paint?.["fill-color"] ?? "#444444", l = o?.paint?.["fill-opacity"] ?? .2, u = s?.paint?.["line-color"] ?? "#444444", d = s?.paint?.["line-width"] ?? 2, f = r.entities?.values ?? [];
		for (let e of f) e.polygon && (e.polygon.material = t.Color.fromCssColorString(c).withAlpha(l), e.polygon.outline = !0, e.polygon.outlineColor = t.Color.fromCssColorString(u).withAlpha(1)), e.polyline && (e.polyline.material = t.Color.fromCssColorString(u).withAlpha(1), e.polyline.width = d);
	}
}, _e = class {
	applyInsetContainerFixes(e) {
		e.classList.contains("inset-map") && (e.style.transform = "none", e.style.top = "0", e.style.left = "0", e.style.width = "100%", e.style.height = "100%");
	}
	ensureCesiumShadowStyles(e) {
		let t = e.getRootNode();
		if (!ce(t)) return;
		let n = "webmapx-cesium-shadow-styles";
		if (t.querySelector(`#${n}`)) return;
		let r = document.createElement("style");
		r.id = n, r.textContent = "\n            .cesium-viewer,\n            .cesium-viewer-cesiumWidgetContainer,\n            .cesium-widget,\n            .cesium-widget canvas {\n                width: 100%;\n                height: 100%;\n                display: block;\n            }\n            .cesium-widget canvas {\n                outline: none;\n            }\n            .cesium-viewer,\n            .cesium-viewer-cesiumWidgetContainer,\n            .cesium-widget {\n                position: absolute;\n                inset: 0;\n            }\n            /* Keep credits from consuming layout inside shadow DOM insets. */\n            .cesium-widget-credits,\n            .cesium-credit-logoContainer,\n            .cesium-credit-textContainer {\n                display: none !important;\n            }\n        ", t.appendChild(r);
	}
	createMap(e, t) {
		let n = q();
		if (!n) throw Error("[Cesium] window.Cesium not found. Load CesiumJS before using the cesium adapter.");
		this.applyInsetContainerFixes(e), this.ensureCesiumShadowStyles(e);
		let r = t?.center ?? [0, 0], i = t?.zoom ?? 1, a = (Array.isArray(t?.tileUrls) && t.tileUrls.length > 0 ? t.tileUrls[0] : t?.tileUrl) ?? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", o = new n.UrlTemplateImageryProvider({
			url: a,
			...a.includes("{s}") ? { subdomains: [
				"a",
				"b",
				"c"
			] } : {},
			credit: t?.tileAttribution ?? "&copy; OpenStreetMap contributors"
		}), s = document.createElement("div");
		s.style.display = "none";
		let c = new n.Viewer(e, {
			animation: !1,
			baseLayerPicker: !1,
			fullscreenButton: !1,
			geocoder: !1,
			homeButton: !1,
			infoBox: !1,
			navigationHelpButton: !1,
			sceneModePicker: !1,
			selectionIndicator: !1,
			timeline: !1,
			vrButton: !1,
			scene3DOnly: !0,
			baseLayer: new n.ImageryLayer(o),
			terrainProvider: new n.EllipsoidTerrainProvider(),
			creditContainer: s
		}), l = () => {
			try {
				c.resize?.(), c.scene?.requestRender?.();
			} catch {}
		};
		l();
		let u = new ResizeObserver(l);
		u.observe(e);
		let d = c.destroy?.bind(c);
		if (c.destroy = () => (u.disconnect(), d?.()), t?.interactive === !1) {
			let e = c.scene?.screenSpaceCameraController;
			e && (e.enableRotate = !1, e.enableTranslate = !1, e.enableZoom = !1, e.enableTilt = !1, e.enableLook = !1);
		}
		let f = Y(c, i, r[1]);
		return c.camera.setView({ destination: n.Cartesian3.fromDegrees(r[0], r[1], f) }), c._webmapx = {
			project: (e) => {
				let t = n.Cartesian3.fromDegrees(e[0], e[1]), r = n.SceneTransforms.worldToWindowCoordinates(c.scene, t);
				return r ? [r.x, r.y] : [0, 0];
			},
			heightMetersToZoom: le,
			zoomToHeightMeters: J
		}, new ge(c);
	}
};
//#endregion
//#region src/map/cesium-services/MapQueryService.ts
function ve() {
	return globalThis.Cesium;
}
var ye = class {
	constructor(e, t) {
		this.viewer = e, this.layerService = t;
	}
	async queryFeatures(e, t = {}) {
		let { pixel: n } = e, i = ve();
		if (!i || !this.viewer?.scene) return [];
		let a = [], o = t.layerIds?.length ? new Set(t.layerIds) : null, s = this.viewer.scene, c = new i.Cartesian2(n[0], n[1]), l = s.drillPick(c) ?? [];
		for (let e of l) {
			let t = e?.id;
			if (!t) continue;
			let n = this.layerService.getLogicalLayerForEntity(t);
			if (!n || o && !o.has(n)) continue;
			let r = this.layerService.getEntityProperties(t);
			a.push({
				layerId: n,
				properties: r,
				source: "vector"
			});
		}
		if (t.includeWMS) {
			let e = s.canvas, t = e.clientWidth, c = e.clientHeight, l = this.getCameraBounds(i);
			if (l) {
				let e = this.layerService.getVisibleWMSLayers(), i = await Promise.all(e.filter((e) => !o || o.has(e.layerId)).map((e) => r({
					sourceConfig: e.sourceConfig,
					layerId: e.layerId,
					layerTitle: e.layerTitle,
					bounds: l,
					containerWidth: t,
					containerHeight: c,
					pixelX: n[0],
					pixelY: n[1]
				})));
				for (let e of i) a.push(...e);
			}
		}
		return a;
	}
	getCameraBounds(e) {
		try {
			let t = this.viewer.camera.computeViewRectangle(this.viewer.scene.globe.ellipsoid);
			return t ? {
				west: e.Math.toDegrees(t.west),
				south: e.Math.toDegrees(t.south),
				east: e.Math.toDegrees(t.east),
				north: e.Math.toDegrees(t.north)
			} : null;
		} catch {
			return null;
		}
	}
};
//#endregion
//#region src/map/cesium-services/MapMarkerService.ts
function X() {
	return globalThis.Cesium;
}
var be = class {
	constructor(e) {
		this.viewer = e, this.markers = /* @__PURE__ */ new Map();
	}
	add(e, t, n = {}) {
		this.remove(e);
		let r = X();
		if (!r || !this.viewer) return;
		let i = n.color ?? "#e63946", a = this.viewer.entities.add({
			position: r.Cartesian3.fromDegrees(t[0], t[1]),
			billboard: {
				image: g(i),
				width: 24,
				height: 36,
				verticalOrigin: r.VerticalOrigin.BOTTOM,
				horizontalOrigin: r.HorizontalOrigin.CENTER,
				disableDepthTestDistance: Infinity
			}
		}), o = { entity: a };
		n.draggable && (o.dragCleanup = this.attachDrag(a, n)), this.markers.set(e, o);
	}
	move(e, t) {
		let n = X(), r = this.markers.get(e);
		r && n && (r.entity.position = n.Cartesian3.fromDegrees(t[0], t[1]));
	}
	remove(e) {
		let t = this.markers.get(e);
		t && (t.dragCleanup?.(), this.viewer?.entities.remove(t.entity), this.markers.delete(e));
	}
	attachDrag(e, t) {
		let n = X();
		if (!n || !this.viewer) return () => {};
		let r = new n.ScreenSpaceEventHandler(this.viewer.canvas), i = !1;
		return r.setInputAction((t) => {
			let r = this.viewer.scene.pick(t.position);
			n.defined(r) && r.id === e && (i = !0, this.viewer.scene.screenSpaceCameraController.enableRotate = !1, this.viewer.scene.screenSpaceCameraController.enableTranslate = !1);
		}, n.ScreenSpaceEventType.LEFT_DOWN), r.setInputAction((r) => {
			if (!i) return;
			let a = this.viewer.camera.getPickRay(r.endPosition);
			if (!a) return;
			let o = this.viewer.scene.globe.pick(a, this.viewer.scene);
			if (n.defined(o)) {
				let r = n.Cartographic.fromCartesian(o), i = n.Math.toDegrees(r.longitude), a = n.Math.toDegrees(r.latitude);
				e.position = n.Cartesian3.fromDegrees(i, a), t.onDrag?.([i, a]);
			}
		}, n.ScreenSpaceEventType.MOUSE_MOVE), r.setInputAction(() => {
			if (i && (i = !1, this.viewer.scene.screenSpaceCameraController.enableRotate = !0, this.viewer.scene.screenSpaceCameraController.enableTranslate = !0, t.onDragEnd)) {
				let r = e.position?.getValue(n.JulianDate.now());
				if (r) {
					let e = n.Cartographic.fromCartesian(r);
					t.onDragEnd([n.Math.toDegrees(e.longitude), n.Math.toDegrees(e.latitude)]);
				}
			}
		}, n.ScreenSpaceEventType.LEFT_UP), () => {
			r.destroy();
		};
	}
}, Z = null;
function Q(e) {
	let t = "./".endsWith("/") ? "./" : ".//";
	return new URL(e.replace(/^\//, ""), new URL(t, window.location.href)).toString();
}
async function xe() {
	if (!globalThis.Cesium) return Z || (Z = new Promise((e, t) => {
		let n = document.querySelector("script[data-webmapx-cesium]");
		if (n && globalThis.Cesium) {
			e();
			return;
		}
		let r = "webmapx-cesium-widgets-css";
		if (!document.getElementById(r)) {
			let e = document.createElement("link");
			e.id = r, e.rel = "stylesheet", e.href = Q("cesium/Widgets/widgets.css"), document.head.appendChild(e);
		}
		globalThis.CESIUM_BASE_URL = Q("cesium/");
		let i = n ?? document.createElement("script");
		i.setAttribute("data-webmapx-cesium", "true"), i.src = Q("cesium/Cesium.js"), i.async = !0, i.onload = () => {
			globalThis.Cesium ? e() : t(/* @__PURE__ */ Error("[Cesium] Script loaded but window.Cesium is still undefined."));
		}, i.onerror = () => {
			t(/* @__PURE__ */ Error(`[Cesium] Failed to load ${i.src}. Ensure Cesium assets are hosted under /cesium/.`));
		}, n || document.head.appendChild(i);
	}), Z);
}
var $ = class extends l {
	get engineVersion() {
		return globalThis.Cesium?.VERSION ?? "";
	}
	constructor() {
		super(), this.engineId = "cesium", this.markerService = null, this.core = new K(this.store, this.events), this.toolService = new se(), this.logicalLayerExecutor = new s(), this.queryExecutor = new u(this.store), this.queryService = this.queryExecutor, this.mapFactory = new _e(), this.core.onMapReady?.((e) => {
			let t = new ae(e, this.store);
			this.logicalLayerExecutor.bind(t), this.core.setLayerOrderRegistry(t), this.queryExecutor.bind(new ye(e, t)), this.markerService = new be(e);
		});
	}
	engineSetTerrainEnabled(e, t) {
		return this.core.setTerrainEnabled(e, t);
	}
	isTerrainEnabled() {
		return this.core.isTerrainEnabled();
	}
	setDoubleClickZoomEnabled(e) {}
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
		let t = globalThis.Cesium;
		return t ? (this.core.onMapReady?.((n) => {
			let r = n?.scene;
			if (!r) return;
			if (!e) {
				r.backgroundColor = t.Color.BLACK.clone(), r.globe.baseColor = t.Color.BLACK.clone(), r.skyBox && (r.skyBox.show = !0);
				return;
			}
			let i = t.Color.fromCssColorString(e);
			i && (r.backgroundColor = i, r.globe.baseColor = i, r.skyBox && (r.skyBox.show = !1));
		}), !0) : !1;
	}
	canDrawSource(e) {
		if (!super.canDrawSource(e)) return !1;
		let t = Array.isArray(e.url) ? e.url[0] : e.url;
		return !(typeof t == "string" && t.startsWith("warpedmap://"));
	}
	canDrawLayerType(e) {
		return e !== "allmaps";
	}
	getTerrainSourceKind() {
		return "terrain-service";
	}
	getViewProjections() {
		return ["globe"];
	}
};
async function Se() {
	return await xe(), new $();
}
//#endregion
export { $ as CesiumAdapter, Se as createCesiumAdapter };
