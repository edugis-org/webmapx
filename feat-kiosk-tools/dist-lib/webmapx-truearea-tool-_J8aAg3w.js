import { h as e, i as t, o as n, p as r } from "./decorators-d8E4nZJy.js";
import { r as i, t as a } from "./decorate-Bl-DXcQA.js";
import { t as o } from "./webmapx-modal-tool-CvWzMu9K.js";
import { t as s } from "./esm-CTuscnN5.js";
import "./button-DE9ytwxI.js";
import "./icon-Qf3FyAAL.js";
import { t as c } from "./form-label-styles-CiXgi-FX.js";
import "./icon-button-DxwGf0BN.js";
import "./radio-group-DcrmsMH6.js";
import "./radio-button-a8zeRuOI.js";
import "./option-C8qYanYH.js";
//#region node_modules/@turf/bearing/node_modules/@turf/helpers/dist/esm/index.js
var l = 6371008.8;
l * 100, l * 100, 360 / (2 * Math.PI), l * 3.28084, l * 39.37, l / 1e3, l / 1e3, l / 1609.344, l * 1e3, l * 1e3, l / 1852, l * 1.0936;
function u(e) {
	return e % (2 * Math.PI) * 180 / Math.PI;
}
function d(e) {
	return e % 360 * Math.PI / 180;
}
//#endregion
//#region node_modules/@turf/bearing/node_modules/@turf/invariant/dist/esm/index.js
function f(e) {
	if (!e) throw Error("coord is required");
	if (!Array.isArray(e)) {
		if (e.type === "Feature" && e.geometry !== null && e.geometry.type === "Point") return [...e.geometry.coordinates];
		if (e.type === "Point") return [...e.coordinates];
	}
	if (Array.isArray(e) && e.length >= 2 && !Array.isArray(e[0]) && !Array.isArray(e[1])) return [...e];
	throw Error("coord must be GeoJSON Point or an Array of numbers");
}
//#endregion
//#region node_modules/@turf/bearing/dist/esm/index.js
function p(e, t, n = {}) {
	if (n.final === !0) return m(e, t);
	let r = f(e), i = f(t), a = d(r[0]), o = d(i[0]), s = d(r[1]), c = d(i[1]), l = Math.sin(o - a) * Math.cos(c), p = Math.cos(s) * Math.sin(c) - Math.sin(s) * Math.cos(c) * Math.cos(o - a);
	return u(Math.atan2(l, p));
}
function m(e, t) {
	let n = p(t, e);
	return n = (n + 180) % 360, n;
}
var h = p, g = 6371008.8, _ = {
	centimeters: g * 100,
	centimetres: g * 100,
	degrees: 360 / (2 * Math.PI),
	feet: g * 3.28084,
	inches: g * 39.37,
	kilometers: g / 1e3,
	kilometres: g / 1e3,
	meters: g,
	metres: g,
	miles: g / 1609.344,
	millimeters: g * 1e3,
	millimetres: g * 1e3,
	nauticalmiles: g / 1852,
	radians: 1,
	yards: g * 1.0936
};
function v(e, t, n = {}) {
	let r = { type: "Feature" };
	return (n.id === 0 || n.id) && (r.id = n.id), n.bbox && (r.bbox = n.bbox), r.properties = t || {}, r.geometry = e, r;
}
function y(e, t, n = {}) {
	if (!e) throw Error("coordinates is required");
	if (!Array.isArray(e)) throw Error("coordinates must be an Array");
	if (e.length < 2) throw Error("coordinates must be at least 2 numbers long");
	if (!C(e[0]) || !C(e[1])) throw Error("coordinates must contain numbers");
	return v({
		type: "Point",
		coordinates: e
	}, t, n);
}
function b(e, t = "kilometers") {
	let n = _[t];
	if (!n) throw Error(t + " units is invalid");
	return e / n;
}
function x(e) {
	return e % (2 * Math.PI) * 180 / Math.PI;
}
function S(e) {
	return e % 360 * Math.PI / 180;
}
function C(e) {
	return !isNaN(e) && e !== null && !Array.isArray(e);
}
//#endregion
//#region node_modules/@turf/destination/node_modules/@turf/invariant/dist/esm/index.js
function w(e) {
	if (!e) throw Error("coord is required");
	if (!Array.isArray(e)) {
		if (e.type === "Feature" && e.geometry !== null && e.geometry.type === "Point") return [...e.geometry.coordinates];
		if (e.type === "Point") return [...e.coordinates];
	}
	if (Array.isArray(e) && e.length >= 2 && !Array.isArray(e[0]) && !Array.isArray(e[1])) return [...e];
	throw Error("coord must be GeoJSON Point or an Array of numbers");
}
//#endregion
//#region node_modules/@turf/destination/dist/esm/index.js
function T(e, t, n, r = {}) {
	let i = w(e), a = S(i[0]), o = S(i[1]), s = S(n), c = b(t, r.units), l = Math.asin(Math.sin(o) * Math.cos(c) + Math.cos(o) * Math.sin(c) * Math.cos(s)), u = x(a + Math.atan2(Math.sin(s) * Math.sin(c) * Math.cos(o), Math.cos(c) - Math.sin(o) * Math.sin(l))), d = x(l);
	return i[2] === void 0 ? y([u, d], r.properties) : y([
		u,
		d,
		i[2]
	], r.properties);
}
var E = T, D = [
	"#e63946",
	"#2a9d8f",
	"#e9c46a",
	"#457b9d",
	"#f4a261",
	"#6a4c93",
	"#06d6a0",
	"#ff6b6b"
], O = "truearea", k = `${O}:data`, A = "truearea-ghost", j = `${A}:data`;
function M(e) {
	let t = [];
	if (e.type === "Polygon" ? t = e.coordinates[0] : e.type === "MultiPolygon" ? t = e.coordinates.flat(2) : e.type === "LineString" ? t = e.coordinates : e.type === "MultiLineString" ? t = e.coordinates.flat() : e.type === "Point" && (t = [e.coordinates]), t.length === 0) return [0, 0];
	let n = t.reduce((e, t) => [e[0] + t[0], e[1] + t[1]], [0, 0]);
	return [n[0] / t.length, n[1] / t.length];
}
function N(e, t) {
	let n = !1;
	for (let r = 0, i = t.length - 1; r < t.length; i = r++) {
		let a = t[r][0], o = t[r][1], s = t[i][0], c = t[i][1];
		o > e[1] != c > e[1] && e[0] < (s - a) * (e[1] - o) / (c - o) + a && (n = !n);
	}
	return n;
}
function P(e, t) {
	return t.type === "Polygon" ? N(e, t.coordinates[0]) && !t.coordinates.slice(1).some((t) => N(e, t)) : t.type === "MultiPolygon" ? t.coordinates.some((t) => N(e, t[0]) && !t.slice(1).some((t) => N(e, t))) : !1;
}
function F(e, t) {
	if (t.type === "Polygon") return M(t);
	if (t.type === "MultiPolygon") {
		let n = t.coordinates.find((t) => N(e, t[0]) && !t.slice(1).some((t) => N(e, t)));
		if (n) {
			let e = n[0], t = e.reduce((e, t) => [e[0] + t[0], e[1] + t[1]], [0, 0]);
			return [t[0] / e.length, t[1] / e.length];
		}
	}
	return M(t);
}
function I(e, t, n) {
	let r = {
		type: "Feature",
		geometry: {
			type: "Point",
			coordinates: n
		},
		properties: {}
	}, i = (e) => {
		let n = {
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: e
			},
			properties: {}
		}, i = h(r, n);
		return E(r, s(r, n, { units: "kilometers" }), i + t, { units: "kilometers" }).geometry.coordinates;
	}, a = (e) => e.map(i);
	return e.type === "Polygon" ? {
		type: "Polygon",
		coordinates: e.coordinates.map(a)
	} : e.type === "MultiPolygon" ? {
		type: "MultiPolygon",
		coordinates: e.coordinates.map((e) => e.map(a))
	} : e;
}
function L(e, t, n, r) {
	let i = r + t, a = Math.PI / 180, o = (e) => {
		let t = Math.cos(e[1] * a), o = e[1] + n, s = Math.cos(o * a), c = s > 1e-6 ? t / s : 1;
		return [i + (e[0] - r) * c, o];
	}, s = (e) => e.map(o);
	return e.type === "Polygon" ? {
		type: "Polygon",
		coordinates: e.coordinates.map(s)
	} : e.type === "MultiPolygon" ? {
		type: "MultiPolygon",
		coordinates: e.coordinates.map((e) => e.map(s))
	} : e;
}
function R(e, t) {
	let n = {
		type: "Feature",
		geometry: {
			type: "Point",
			coordinates: t
		},
		properties: {}
	}, r = (e) => e.map((e) => ({
		bearing: h(n, {
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: e
			},
			properties: {}
		}),
		distance: s(n, {
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: e
			},
			properties: {}
		}, { units: "kilometers" })
	}));
	return e.type === "Polygon" ? e.coordinates.map(r) : e.type === "MultiPolygon" ? e.coordinates.flat().map(r) : [];
}
function z(e, t, n) {
	let r = {
		type: "Feature",
		geometry: {
			type: "Point",
			coordinates: t
		},
		properties: {}
	}, i = 0, a = () => (n[i++] ?? []).map(({ bearing: e, distance: t }) => E(r, t, e, { units: "kilometers" }).geometry.coordinates);
	return e.type === "Polygon" ? {
		type: "Polygon",
		coordinates: e.coordinates.map(() => a())
	} : e.type === "MultiPolygon" ? {
		type: "MultiPolygon",
		coordinates: e.coordinates.map((e) => e.map(() => a()))
	} : e;
}
var B = class extends o {
	constructor(...e) {
		super(...e), this.toolId = "truearea", this.mapElement = null, this.availableLayers = [], this.selectedLayerId = "", this.copies = [], this.dragging = !1, this.lastTouchedCopyId = null, this.rotationDeg = 0, this.geodesic = !0, this.copyMeta = /* @__PURE__ */ new Map(), this.features = [], this.colorIdx = 0, this.hoverPanSuspended = !1, this.unsubEvents = [], this.dragState = null;
	}
	onActivate() {
		this.adapter && this.adapter.setTouchCaptureEnabled(!1), this.bindEvents();
	}
	onDeactivate() {
		this.cleanupEvents(), this.adapter && (this.adapter.setPanEnabled(!0), this.adapter.setTouchCaptureEnabled(!0), this.adapter.setCursor("")), this.hoverPanSuspended = !1, this.dragState = null, this.dragging = !1, this.clearGhost(), this.copies.length === 0 && this.cleanupLayers();
	}
	static {
		this.styles = [c, e`
        :host { display: none; padding: var(--webmapx-tool-padding, 0); font-size: 0.875rem; min-width: 200px; }
        :host([active]) { display: block; }
        label { display: block; margin-bottom: 0.25rem; }
        sl-select { width: 100%; margin-bottom: 0.75rem; }
        .hint { color: var(--color-text-muted, #6b7681); font-style: italic; margin-bottom: 0.5rem; font-size: 0.8rem; }
        .copy-item { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.5rem; }
        .copy-swatch { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; }
        .copy-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .clear-btn { display: block; width: 100%; }
        .clear-btn::part(base) { width: 100%; }
        .no-copies { color: var(--color-text-muted, #6b7681); font-style: italic; font-size: 0.8rem; margin-bottom: 0.5rem; margin-top: 0.25rem; }
        .dragging-hint { color: var(--color-primary, #2b6c8f); font-size: 0.8rem; margin-bottom: 0.4rem; }
        .method-row { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--color-text-secondary, #5a6773); }
        .method-row input { cursor: pointer; }
        .rotation-row { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.5rem; }
        /* The browser's own slider in the shared slider colour, like every other tool's. */
        .rotation-row input[type=range] { flex: 1; min-width: 0; }
        .rotation-value { font-variant-numeric: tabular-nums; min-width: 3.5em; text-align: right; font-size: 0.8rem; color: var(--color-text-secondary, #5a6773); }
    `];
	}
	onMapAttached(e) {
		super.onMapAttached(e), this.mapElement = i(this), this.refreshLayers(e.store.getState()), this.active && (e.setTouchCaptureEnabled(!1), this.bindEvents());
	}
	onMapDetached() {
		this.cleanupEvents(), this.cleanupLayers(), this.dragState = null, this.dragging = !1, this.features = [], this.copies = [], this.copyMeta.clear(), this.availableLayers = [], this.mapElement = null, super.onMapDetached();
	}
	onStateChanged(e) {
		this.refreshLayers(e);
	}
	refreshLayers(e) {
		let t = e.mapLayers ?? {}, n = [];
		for (let [e, r] of Object.entries(t)) {
			if (e === O || e.startsWith("truearea-")) continue;
			let t = r.sourceData;
			if (!t || !this.hasPolygonFeatures(t)) continue;
			let i = r.label ?? e;
			n.push({
				id: e,
				label: String(i),
				sourceId: e
			});
		}
		this.availableLayers = n, this.selectedLayerId && !n.find((e) => e.id === this.selectedLayerId) && (this.selectedLayerId = n[0]?.id ?? ""), !this.selectedLayerId && n.length > 0 && (this.selectedLayerId = n[0].id);
	}
	hasPolygonFeatures(e) {
		return e.features.some((e) => e.geometry?.type === "Polygon" || e.geometry?.type === "MultiPolygon");
	}
	async setupLayers() {
		!this.adapter || !this.mapElement || (this.adapter.hasLayer(O) || await this.mapElement.addLayerRequest({
			id: O,
			type: "style",
			version: 8,
			metadata: {
				label: "TrueArea copies",
				legendRole: "overlay",
				attribution: "<a href=\"https://thetruesize.com\">The True Size Of</a>"
			},
			sources: { data: {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: []
				}
			} },
			layers: [{
				id: "truearea-fill",
				type: "fill",
				source: "data",
				paint: {
					"fill-color": ["get", "color"],
					"fill-opacity": .35
				}
			}, {
				id: "truearea-line",
				type: "line",
				source: "data",
				paint: {
					"line-color": ["get", "color"],
					"line-width": 2
				}
			}]
		}), this.adapter.hasLayer(A) || await this.mapElement.addLayerRequest({
			id: A,
			type: "style",
			version: 8,
			metadata: { hideFromLegend: !0 },
			sources: { data: {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features: []
				}
			} },
			layers: [{
				id: "truearea-ghost-fill",
				type: "fill",
				source: "data",
				paint: {
					"fill-color": ["get", "color"],
					"fill-opacity": .2
				}
			}, {
				id: "truearea-ghost-line",
				type: "line",
				source: "data",
				paint: {
					"line-color": ["get", "color"],
					"line-width": 2,
					"line-dasharray": [4, 3]
				},
				hideFromLegend: !0
			}]
		}));
	}
	cleanupLayers() {
		!this.adapter || !this.mapElement || [A, O].forEach((e) => {
			this.adapter.hasLayer(e) && this.mapElement.removeInlineLayer(e);
		});
	}
	bindEvents() {
		if (!this.adapter) return;
		this.cleanupEvents();
		let e = this.adapter.events.on("pointer-down", (e) => this.onPointerDown(e)), t = this.adapter.events.on("pointer-move", (e) => this.onDrag(e)), n = this.adapter.events.on("pointer-up", (e) => this.onDragEnd(e)), r = this.adapter.events.on("pointer-cancel", () => this.onDragCancel());
		this.unsubEvents = [
			e,
			t,
			n,
			r
		];
	}
	cleanupEvents() {
		this.unsubEvents.forEach((e) => e()), this.unsubEvents = [];
	}
	getSelectedSource() {
		let e = this.availableLayers.find((e) => e.id === this.selectedLayerId);
		return e ? {
			sourceId: e.sourceId,
			label: e.label
		} : null;
	}
	findCopyAt(e) {
		return this.features.find((t) => t.geometry && P(e, t.geometry));
	}
	findSourceFeatureAt(e) {
		if (!this.adapter) return;
		let t = this.getSelectedSource();
		if (!t) return;
		let n = (this.adapter.store.getState().mapLayers ?? {})[t.sourceId]?.sourceData;
		if (n) return n.features.find((t) => t.geometry && P(e, t.geometry));
	}
	updateHoverState(e) {
		if (!this.adapter) return;
		let t = !!(this.findCopyAt(e) ?? this.findSourceFeatureAt(e));
		t !== this.hoverPanSuspended && (this.hoverPanSuspended = t, this.adapter.setPanEnabled(!t), this.adapter.setCursor(t ? "grab" : ""));
	}
	async onPointerDown(e) {
		if (!this.adapter) return;
		let t = e.coords;
		this.updateHoverState(t), await this.setupLayers();
		let n = this.findCopyAt(t);
		if (n) {
			let e = n.properties?.copyId, r = this.copies.find((t) => t.id === e), i = n.properties?.color ?? D[0], a = r?.label ?? e;
			this.features = this.features.filter((t) => t.properties?.copyId !== e), this.updateTrueAreaSource();
			let o = F(t, n.geometry), s = R(n.geometry, o);
			if (this.dragState = {
				feature: n,
				centroid: o,
				startCoords: t,
				color: i,
				label: a,
				existingCopyId: e,
				bearingDistances: s
			}, this.dragging = !0, e !== this.lastTouchedCopyId) {
				this.lastTouchedCopyId = e, this.rotationDeg = n.properties?.rotation ?? 0;
				let t = this.copyMeta.get(e);
				t && (this.geodesic = t.geodesic);
			}
			this.adapter.setCursor("grabbing"), this.updateGhost(t);
			return;
		}
		let r = this.findSourceFeatureAt(t);
		if (!r || !this.getSelectedSource()) return;
		let i = F(t, r.geometry), a = R(r.geometry, i), o = D[this.colorIdx % D.length], s = String(r.properties?.name ?? r.properties?.label ?? r.properties?.id ?? `Copy ${this.copies.length + 1}`);
		this.dragState = {
			feature: r,
			centroid: i,
			startCoords: t,
			color: o,
			label: s,
			bearingDistances: a
		}, this.dragging = !0, this.adapter.setCursor("grabbing"), this.updateGhost(t);
	}
	onDrag(e) {
		if (!this.dragState) {
			this.updateHoverState(e.coords);
			return;
		}
		this.updateGhost(e.coords);
	}
	updateGhost(e) {
		if (!this.dragState || !this.adapter) return;
		let { centroid: t, startCoords: n, color: r, bearingDistances: i, feature: a } = this.dragState, o = e[0] - n[0], s = e[1] - n[1], c = [t[0] + o, t[1] + s], l = {
			type: "FeatureCollection",
			features: [{
				type: "Feature",
				geometry: this.geodesic ? z(a.geometry, c, i) : L(a.geometry, o, s, t[0]),
				properties: { color: r }
			}]
		};
		this.adapter.getSource(j)?.setData(l);
	}
	onDragCancel() {
		this.adapter && (this.hoverPanSuspended = !1, this.adapter.setPanEnabled(!0), this.adapter.setCursor(""), this.dragState?.existingCopyId && (this.features = [...this.features, this.dragState.feature], this.updateTrueAreaSource()), this.dragState = null, this.dragging = !1, this.clearGhost());
	}
	onDragEnd(e) {
		if (!this.adapter) {
			this.dragState = null, this.dragging = !1;
			return;
		}
		if (!this.dragState) {
			this.updateHoverState(e.coords);
			return;
		}
		let { feature: t, centroid: n, startCoords: r, color: i, label: a, bearingDistances: o } = this.dragState, s = e.coords[0] - r[0], c = e.coords[1] - r[1], { existingCopyId: l } = this.dragState;
		if (Math.abs(s) < 1e-6 && Math.abs(c) < 1e-6) {
			l && (this.features = [...this.features, t], this.updateTrueAreaSource()), this.dragState = null, this.dragging = !1, this.clearGhost(), this.refreshHoverAfterDrag(e.coords);
			return;
		}
		let u = [n[0] + s, n[1] + c], d = this.geodesic ? z(t.geometry, u, o) : L(t.geometry, s, c, n[0]), f = l ?? `copy-${Date.now()}`, p = l ? this.lastTouchedCopyId === l ? this.rotationDeg : t.properties?.rotation ?? 0 : 0;
		if (l) {
			let e = this.copyMeta.get(l);
			if (e) {
				let t = [e.placedCentroid[0] + s, e.placedCentroid[1] + c];
				this.copyMeta.set(l, {
					...e,
					placedCentroid: t,
					geodesic: this.geodesic
				});
			}
		} else this.copyMeta.set(f, {
			origGeom: t.geometry,
			origCentroid: n,
			placedCentroid: u,
			bearingDistances: o,
			geodesic: this.geodesic
		});
		this.features = [...this.features, {
			type: "Feature",
			geometry: d,
			properties: {
				...t.properties,
				color: i,
				copyId: f,
				rotation: p
			}
		}];
		let m = {
			type: "FeatureCollection",
			features: this.features
		};
		this.adapter.getSource(k)?.setData(m), l || (this.copies = [...this.copies, {
			id: f,
			label: a,
			color: i
		}], this.colorIdx++, this.lastTouchedCopyId = f, this.rotationDeg = 0), this.dragState = null, this.dragging = !1, this.clearGhost(), this.refreshHoverAfterDrag(e.coords);
	}
	refreshHoverAfterDrag(e) {
		this.adapter && (this.hoverPanSuspended = !1, this.adapter.setPanEnabled(!0), this.adapter.setCursor(""), this.updateHoverState(e));
	}
	clearGhost() {
		this.adapter && this.adapter.getSource(j)?.setData({
			type: "FeatureCollection",
			features: []
		});
	}
	recomputeLastCopy() {
		if (!this.lastTouchedCopyId) return;
		let e = this.copyMeta.get(this.lastTouchedCopyId);
		if (!e) return;
		let { origGeom: t, origCentroid: n, placedCentroid: r, bearingDistances: i } = e;
		this.copyMeta.set(this.lastTouchedCopyId, {
			...e,
			geodesic: this.geodesic
		});
		let a = r[0] - n[0], o = r[1] - n[1], s = this.geodesic ? z(t, r, i) : L(t, a, o, n[0]), c = this.rotationDeg, l = c === 0 ? s : I(s, c, r), u = this.lastTouchedCopyId;
		this.features = this.features.map((e) => e.properties?.copyId === u ? {
			...e,
			geometry: l,
			properties: {
				...e.properties,
				rotation: c
			}
		} : e), this.updateTrueAreaSource();
	}
	removeCopy(e) {
		if (this.copies = this.copies.filter((t) => t.id !== e), this.features = this.features.filter((t) => t.properties?.copyId !== e), this.copyMeta.delete(e), this.lastTouchedCopyId === e) if (this.lastTouchedCopyId = this.copies[this.copies.length - 1]?.id ?? null, this.lastTouchedCopyId) {
			this.rotationDeg = this.features.find((e) => e.properties?.copyId === this.lastTouchedCopyId)?.properties?.rotation ?? 0;
			let e = this.copyMeta.get(this.lastTouchedCopyId);
			e && (this.geodesic = e.geodesic);
		} else this.rotationDeg = 0;
		this.updateTrueAreaSource();
	}
	rotateLastCopy(e) {
		if (!this.lastTouchedCopyId) return;
		let t = this.features.find((e) => e.properties?.copyId === this.lastTouchedCopyId);
		if (!t?.geometry) return;
		let n = e - (t.properties?.rotation ?? 0), r = this.copyMeta.get(this.lastTouchedCopyId), i = r ? r.placedCentroid : M(t.geometry), a = I(t.geometry, n, i);
		this.features = this.features.map((t) => t.properties?.copyId === this.lastTouchedCopyId ? {
			...t,
			geometry: a,
			properties: {
				...t.properties,
				rotation: e
			}
		} : t), this.rotationDeg = e, this.updateTrueAreaSource();
	}
	clearAll() {
		this.copies = [], this.features = [], this.copyMeta.clear(), this.lastTouchedCopyId = null, this.rotationDeg = 0, this.updateTrueAreaSource();
	}
	updateTrueAreaSource() {
		this.adapter && this.adapter.getSource(k)?.setData({
			type: "FeatureCollection",
			features: this.features
		});
	}
	render() {
		return r`
            ${this.availableLayers.length === 0 ? r`<div class="field-label">Source layer</div><div class="hint">No visible polygon layers on map.</div>` : r`
                    <sl-select size="small" hoist label="Source layer"
                        .value=${String(Math.max(0, this.availableLayers.findIndex((e) => e.id === this.selectedLayerId)))}
                        @sl-change=${(e) => {
			this.selectedLayerId = this.availableLayers[Number(e.target.value)]?.id ?? this.selectedLayerId;
		}}>
                        ${this.availableLayers.map((e, t) => r`
                            <sl-option value=${String(t)}>${e.label}</sl-option>
                        `)}
                    </sl-select>
                    ${this.dragging ? r`<div class="dragging-hint">Drag to target location, release to place.</div>` : r`<div class="hint">Click and drag a polygon to compare sizes.</div>`}
                `}

            ${(() => {
			let e = this.copies.find((e) => e.id === this.lastTouchedCopyId);
			return !e && this.availableLayers.length === 0 ? "" : e ? r`
                    <div class="copy-item">
                        <div class="copy-swatch" style="background:${e.color}"></div>
                        <span class="copy-label" title=${e.label}>${e.label}</span>
                        <sl-icon-button name="x-lg" label="Remove copy" @click=${() => this.removeCopy(e.id)}></sl-icon-button>
                    </div>
                    <div class="rotation-row">
                        <input type="range" aria-label="Rotation" min="-180" max="180" step="1"
                            .value=${String(this.rotationDeg)}
                            @input=${(e) => this.rotateLastCopy(Number(e.target.value))}
                        />
                        <sl-button size="small" class="icon-only" title="Reset rotation to 0°" @click=${() => this.rotateLastCopy(0)}>
                            <sl-icon name="arrow-counterclockwise" label="Reset rotation to 0°"></sl-icon>
                        </sl-button>
                        <span class="rotation-value">${this.rotationDeg}°</span>
                    </div>
                    <div class="method-row">
                        <sl-radio-group size="small" label="Method"
                            help-text="Geodesic keeps the true shape on the globe, so borders may rotate"
                            .value=${this.geodesic ? "geodesic" : "simple"}
                            @sl-change=${(e) => {
				this.geodesic = e.target.value === "geodesic", this.recomputeLastCopy();
			}}>
                            <sl-radio-button value="simple">Simple</sl-radio-button>
                            <sl-radio-button value="geodesic">Geodesic</sl-radio-button>
                        </sl-radio-group>
                    </div>

                    ${this.copies.length > 0 ? r`<sl-button class="clear-btn" size="small" @click=${() => this.clearAll()}>Clear all</sl-button>` : ""}
                ` : r`<div class="no-copies">No copy selected. Click a polygon on the map.</div>`;
		})()}
        `;
	}
};
a([t()], B.prototype, "availableLayers", void 0), a([t()], B.prototype, "selectedLayerId", void 0), a([t()], B.prototype, "copies", void 0), a([t()], B.prototype, "dragging", void 0), a([t()], B.prototype, "lastTouchedCopyId", void 0), a([t()], B.prototype, "rotationDeg", void 0), a([t()], B.prototype, "geodesic", void 0), B = a([n("webmapx-truearea-tool")], B);
//#endregion
export { B as WebmapxTrueAreaTool };
