import { a as e, c as t, d as n, i as r, l as i, n as a, r as o, s, t as c, u as l } from "./dist-GiquyDnZ.js";
import * as u from "leaflet";
//#region node_modules/@allmaps/leaflet/dist/WarpedMapLayer.js
var d = {
	interactive: !1,
	className: "",
	pane: "tilePane",
	zIndex: 1
}, f = class extends u.Layer {
	defaultSpecificWarpedMapLayerOptions;
	options;
	container;
	canvas;
	gl;
	renderer;
	_annotationOrAnnotationUrl;
	resizeObserver;
	constructor(e, t) {
		super(), this.defaultSpecificWarpedMapLayerOptions = d, this.options = s(this.defaultSpecificWarpedMapLayerOptions, t), this.initialize(e, t);
	}
	initialize(e, t) {
		this._annotationOrAnnotationUrl = e, u.setOptions(this, t), this._initGl();
	}
	onAdd(e) {
		if (!this._map || !this.container) return this;
		let t = this.options.pane;
		return this._map.getPane(t)?.appendChild(this.container), e.on("zoomend viewreset move", this._update, this), e.on("zoomanim", this._animateZoom, this), e.on("unload", this._unload, this), this.resizeObserver = new ResizeObserver(this._resized.bind(this)), this.resizeObserver.observe(this._map.getContainer(), { box: "content-box" }), this._annotationOrAnnotationUrl && (typeof this._annotationOrAnnotationUrl == "string" && i(this._annotationOrAnnotationUrl) ? this.addGeoreferenceAnnotationByUrl(this._annotationOrAnnotationUrl).then(() => this._update()) : this.addGeoreferenceAnnotation(this._annotationOrAnnotationUrl).then(() => this._update())), this;
	}
	onRemove(e) {
		return this.container && this.container.remove(), e.off("zoomend viewreset move", this._update, this), e.off("zoomanim", this._animateZoom, this), this;
	}
	getBounds() {
		c.assertRenderer(this.renderer);
		let e = this.renderer.warpedMapList.getMapsBbox({ projection: { definition: "EPSG:4326" } });
		if (e) return [[e[1], e[0]], [e[3], e[2]]];
	}
	bringToFront() {
		return this._map && this.container && u.DomUtil.toFront(this.container), this;
	}
	bringToBack() {
		return this._map && this.container && u.DomUtil.toBack(this.container), this;
	}
	getZIndex() {
		return this.options.zIndex;
	}
	setZIndex(e) {
		return this.options.zIndex = e, this._updateZIndex(), this;
	}
	_initGl() {
		if (this.container = u.DomUtil.create("div"), this.container.classList.add("leaflet-layer"), this.container.classList.add("allmaps-warped-map-layer"), this.options.zIndex && this._updateZIndex(), this.canvas = u.DomUtil.create("canvas", void 0, this.container), this.canvas.classList.add("leaflet-zoom-animated"), this.canvas.classList.add("leaflet-image-layer"), this.options.interactive && this.canvas.classList.add("leaflet-interactive"), this.options.className && this.canvas.classList.add(this.options.className), this.gl = this.canvas.getContext("webgl2", { premultipliedAlpha: !0 }), !this.gl) throw Error("WebGL 2 not available");
		this.renderer = new a(this.gl), this.addEventListeners(), this.canvas.addEventListener("webglcontextlost", this.contextLost.bind(this)), this.canvas.addEventListener("webglcontextrestored", this.contextRestored.bind(this));
	}
	_resized(e) {
		if (this.canvas) {
			for (let t of e) {
				let e = t.contentRect.width, n = t.contentRect.height, r = window.devicePixelRatio, i = Math.round(e * r), a = Math.round(n * r);
				this.canvas.width = i, this.canvas.height = a, this.canvas.style.width = e + "px", this.canvas.style.height = n + "px";
			}
			this._update();
		}
	}
	_animateZoom(e) {
		if (!this.canvas) return;
		let t = this._map.getZoomScale(e.zoom), n = this._map._latLngBoundsToNewLayerBounds(this._map.getBounds(), e.zoom, e.center).min;
		u.DomUtil.setTransform(this.canvas, n, t);
	}
	_updateZIndex() {
		this.container && this.options.zIndex !== void 0 && (this.container.style.zIndex = String(this.options.zIndex));
	}
	_update() {
		if (!this._map || !this.renderer || !this.canvas || !this._map.options.crs) return;
		let e = this._map.containerPointToLayerPoint([0, 0]);
		u.DomUtil.setPosition(this.canvas, e);
		let t = this._map.getSize(), r = [t.x, t.y], i = this._map.getCenter(), a = this._map.options.crs.project(i), s = [a.x, a.y], c = this._map.getBounds(), d = this._map.options.crs.project(c.getNorthEast()), f = this._map.options.crs.project(c.getNorthWest()), p = this._map.options.crs.project(c.getSouthWest()), m = this._map.options.crs.project(c.getSouthEast()), h = n(l([
			[d.x, d.y],
			[f.x, f.y],
			[p.x, p.y],
			[m.x, m.y]
		]), r), g = window.devicePixelRatio, _ = new o(r, s, h, { devicePixelRatio: g });
		return this.renderer.render(_), this.container;
	}
	_unload() {
		if (c.assertRenderer(this.renderer), !this.gl) return;
		this.renderer.destroy();
		let e = this.gl.getExtension("WEBGL_lose_context");
		e && e.loseContext();
		let t = this.gl.canvas;
		t.width = 1, t.height = 1, this.resizeObserver?.disconnect(), this.canvas?.addEventListener("webglcontextlost", this.contextLost.bind(this)), this.canvas?.addEventListener("webglcontextrestored", this.contextRestored.bind(this));
	}
	nativeUpdate() {
		this._update();
	}
	nativePassWarpedMapEvent(e) {
		e instanceof r && this._map && this._map.fire(e.type, e.data);
	}
	async addGeoreferenceAnnotation(e, t) {
		c.assertRenderer(this.renderer);
		let n = await this.renderer.addGeoreferenceAnnotation(e, t);
		return this.nativeUpdate(), n;
	}
	async removeGeoreferenceAnnotation(e) {
		c.assertRenderer(this.renderer);
		let t = await this.renderer.warpedMapList.removeGeoreferenceAnnotation(e);
		return this.nativeUpdate(), t;
	}
	async addGeoreferenceAnnotationByUrl(e, t) {
		let n = await fetch(e).then((e) => e.json());
		return this.addGeoreferenceAnnotation(n, t);
	}
	async removeGeoreferenceAnnotationByUrl(e) {
		let t = await fetch(e).then((e) => e.json());
		return this.removeGeoreferenceAnnotation(t);
	}
	async addGeoreferencedMap(e, t) {
		c.assertRenderer(this.renderer);
		let n = this.renderer.addGeoreferencedMap(e, t);
		return this.nativeUpdate(), n;
	}
	async removeGeoreferencedMap(e) {
		c.assertRenderer(this.renderer);
		let t = this.renderer.warpedMapList.removeGeoreferencedMap(e);
		return this.nativeUpdate(), t;
	}
	async removeGeoreferencedMapById(e) {
		c.assertRenderer(this.renderer);
		let t = this.renderer.warpedMapList.removeGeoreferencedMapById(e);
		return this.nativeUpdate(), t;
	}
	addImageInfos(e) {
		c.assertRenderer(this.renderer);
		let t = this.renderer.warpedMapList.addImageInfos(e);
		return this.nativeUpdate(), t;
	}
	async addSprites(e, t, n) {
		c.assertRenderer(this.renderer), await this.renderer.addSprites(e, t, n), this.nativeUpdate();
	}
	getWarpedMapList() {
		return c.assertRenderer(this.renderer), this.renderer.warpedMapList;
	}
	getMapIds() {
		return c.assertRenderer(this.renderer), this.renderer.warpedMapList.getMapIds();
	}
	getWarpedMaps(e) {
		return c.assertRenderer(this.renderer), this.renderer.warpedMapList.getWarpedMaps({ mapIds: e });
	}
	getWarpedMap(e) {
		return c.assertRenderer(this.renderer), this.renderer.warpedMapList.getWarpedMap(e);
	}
	getMapsCenter(e, n) {
		return c.assertRenderer(this.renderer), this.renderer.warpedMapList.getMapsCenter(t({ mapIds: e }, n));
	}
	getMapsBbox(e, n) {
		return c.assertRenderer(this.renderer), this.renderer.warpedMapList.getMapsBbox(t({ mapIds: e }, n));
	}
	getMapsConvexHull(e, n) {
		return c.assertRenderer(this.renderer), this.renderer.warpedMapList.getMapsConvexHull(t({ mapIds: e }, n));
	}
	getMapZIndex(e) {
		return c.assertRenderer(this.renderer), this.renderer.warpedMapList.getMapZIndex(e);
	}
	getOpacity() {
		return this.getLayerOptions().opacity ?? this.getDefaultOptions().opacity;
	}
	getDefaultOptions() {
		return c.assertRenderer(this.renderer), s(this.defaultSpecificWarpedMapLayerOptions, this.renderer.getDefaultOptions());
	}
	getMapDefaultOptions(e) {
		return c.assertRenderer(this.renderer), this.renderer.getMapDefaultOptions(e);
	}
	getLayerOptions() {
		return c.assertRenderer(this.renderer), t(this.options, this.renderer.getOptions());
	}
	getMapMapOptions(e) {
		return c.assertRenderer(this.renderer), this.renderer.getMapMapOptions(e);
	}
	getMapOptions(e) {
		return c.assertRenderer(this.renderer), this.renderer.getMapOptions(e);
	}
	setOpacity(e) {
		this.setLayerOptions({ opacity: e });
	}
	setLayerOptions(e, t) {
		c.assertRenderer(this.renderer), this.options = s(this.options, e), this.renderer.setOptions(e, t);
	}
	setMapGcps(e, t, n) {
		return this.setMapOptions(e, { gcps: t }, void 0, n);
	}
	setMapResourceMask(e, t, n) {
		return this.setMapOptions(e, { resourceMask: t }, void 0, n);
	}
	setMapTransformationType(e, t, n) {
		return this.setMapOptions(e, { transformationType: t }, void 0, n);
	}
	setMapOptions(e, t, n, r) {
		return this.setMapsOptions([e], t, n, r);
	}
	setMapsOptions(e, t, n, r) {
		c.assertRenderer(this.renderer), n && (this.options = s(this.options, n)), this.renderer.setMapsOptions(e, t, n, r);
	}
	setMapsOptionsByMapId(e, t, n) {
		c.assertRenderer(this.renderer), t && (this.options = s(this.options, t)), this.renderer.setMapsOptionsByMapId(e, t, n);
	}
	resetLayerOptions(e, t) {
		c.assertRenderer(this.renderer), this.renderer.resetOptions(e, t);
	}
	resetMapsOptions(e, t, n, r) {
		c.assertRenderer(this.renderer), this.renderer.resetMapsOptions(e, t, n, r);
	}
	resetMapsOptionsByMapId(e, t, n) {
		c.assertRenderer(this.renderer), this.renderer.resetMapsOptionsByMapId(e, t, n);
	}
	bringMapsToFront(e) {
		c.assertRenderer(this.renderer), this.renderer.warpedMapList.bringMapsToFront(e), this.nativeUpdate();
	}
	sendMapsToBack(e) {
		c.assertRenderer(this.renderer), this.renderer.warpedMapList.sendMapsToBack(e), this.nativeUpdate();
	}
	bringMapsForward(e) {
		c.assertRenderer(this.renderer), this.renderer.warpedMapList.bringMapsForward(e), this.nativeUpdate();
	}
	sendMapsBackward(e) {
		c.assertRenderer(this.renderer), this.renderer.warpedMapList.sendMapsBackward(e), this.nativeUpdate();
	}
	clear() {
		c.assertRenderer(this.renderer), this.renderer.clear(), this.nativeUpdate();
	}
	contextLost(e) {
		e.preventDefault(), this.renderer?.contextLost();
	}
	contextRestored(e) {
		e.preventDefault(), this.renderer?.contextRestored();
	}
	addEventListeners() {
		this.renderer && (this.renderer.warpedMapList.addEventListener(e.IMAGEINFOSADDED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.addEventListener(e.GEOREFERENCEANNOTATIONADDED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.addEventListener(e.GEOREFERENCEANNOTATIONREMOVED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.addEventListener(e.WARPEDMAPADDED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.addEventListener(e.WARPEDMAPREMOVED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.addEventListener(e.WARPEDMAPENTERED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.addEventListener(e.WARPEDMAPLEFT, this.nativePassWarpedMapEvent.bind(this)), this.renderer.addEventListener(e.IMAGELOADED, this.nativeUpdate.bind(this)), this.renderer.tileCache.addEventListener(e.MAPTILELOADED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.spritesTileCache.addEventListener(e.MAPTILESLOADEDFROMSPRITES, this.nativePassWarpedMapEvent.bind(this)), this.renderer.tileCache.addEventListener(e.MAPTILEDELETED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.tileCache.addEventListener(e.FIRSTMAPTILELOADED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.tileCache.addEventListener(e.ALLREQUESTEDTILESLOADED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.addEventListener(e.CLEARED, this.nativeUpdate.bind(this)), this.renderer.warpedMapList.addEventListener(e.PREPARECHANGE, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.addEventListener(e.IMMEDIATECHANGE, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.addEventListener(e.ANIMATEDCHANGE, this.nativePassWarpedMapEvent.bind(this)), this.renderer.addEventListener(e.CHANGED, this.nativeUpdate.bind(this)));
	}
	removeEventListeners() {
		this.renderer && (this.renderer.warpedMapList.removeEventListener(e.IMAGEINFOSADDED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.removeEventListener(e.GEOREFERENCEANNOTATIONADDED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.removeEventListener(e.GEOREFERENCEANNOTATIONREMOVED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.removeEventListener(e.WARPEDMAPADDED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.removeEventListener(e.WARPEDMAPREMOVED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.removeEventListener(e.WARPEDMAPENTERED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.removeEventListener(e.WARPEDMAPLEFT, this.nativePassWarpedMapEvent.bind(this)), this.renderer.removeEventListener(e.IMAGELOADED, this.nativeUpdate.bind(this)), this.renderer.tileCache.removeEventListener(e.MAPTILELOADED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.spritesTileCache.removeEventListener(e.MAPTILESLOADEDFROMSPRITES, this.nativePassWarpedMapEvent.bind(this)), this.renderer.tileCache.removeEventListener(e.MAPTILEDELETED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.tileCache.removeEventListener(e.FIRSTMAPTILELOADED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.tileCache.removeEventListener(e.ALLREQUESTEDTILESLOADED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.removeEventListener(e.CLEARED, this.nativeUpdate.bind(this)), this.renderer.warpedMapList.removeEventListener(e.PREPARECHANGE, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.removeEventListener(e.IMMEDIATECHANGE, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.removeEventListener(e.ANIMATEDCHANGE, this.nativePassWarpedMapEvent.bind(this)), this.renderer.removeEventListener(e.CHANGED, this.nativeUpdate.bind(this)));
	}
}, p = function(e, t) {
	return new f(e, t);
};
L.WarpedMapLayer = f, L.warpedMapLayer = p;
//#endregion
export { f as WarpedMapLayer };
