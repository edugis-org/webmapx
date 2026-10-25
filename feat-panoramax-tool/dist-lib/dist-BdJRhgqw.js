import { a as e, c as t, i as n, n as r, r as i, s as a, t as o } from "./dist-GiquyDnZ.js";
import s from "ol/layer/Layer.js";
import c from "ol/events/Event.js";
//#region node_modules/@allmaps/openlayers/dist/OLWarpedMapEvent.js
var l = class extends c {
	data;
	constructor(e, t) {
		super(e), this.data = t;
	}
}, u = {}, d = class extends s {
	defaultSpecificWarpedMapLayerOptions;
	options;
	container;
	canvas;
	gl;
	renderer;
	canvasSize = [0, 0];
	resizeObserver;
	constructor(e) {
		super({}), this.defaultSpecificWarpedMapLayerOptions = u, this.options = a(this.defaultSpecificWarpedMapLayerOptions, e);
		let t = document.createElement("div");
		this.container = t, t.style.position = "absolute", t.style.width = "100%", t.style.height = "100%", t.classList.add("ol-layer"), t.classList.add("allmaps-warped-map-layer");
		let n = document.createElement("canvas");
		n.style.position = "absolute", n.style.left = "0", n.style.width = "100%", n.style.height = "100%", t.appendChild(n);
		let i = n.getContext("webgl2", { premultipliedAlpha: !0 });
		if (!i) throw Error("WebGL 2 not available");
		this.resizeObserver = new ResizeObserver(this.resized.bind(this)), this.resizeObserver.observe(n, { box: "content-box" }), this.canvas = n, this.gl = i, this.renderer = new r(this.gl, e), this.addEventListeners(), this.canvas.addEventListener("webglcontextlost", this.contextLost.bind(this)), this.canvas.addEventListener("webglcontextrestored", this.contextRestored.bind(this));
	}
	getLonLatExtent() {
		return this.renderer.warpedMapList.getMapsBbox({ projection: { definition: "EPSG:4326" } });
	}
	dispose() {
		this.renderer.destroy();
		let e = this.gl?.getExtension("WEBGL_lose_context");
		e && e.loseContext();
		let t = this.gl?.canvas;
		t && (t.width = 1, t.height = 1), this.resizeObserver.disconnect(), this.removeEventListeners(), this.canvas?.removeEventListener("webglcontextlost", this.contextLost.bind(this)), this.canvas?.removeEventListener("webglcontextrestored", this.contextRestored.bind(this));
	}
	render(e) {
		this.canvas && this.resizeCanvas(this.canvas, this.canvasSize);
		let t = new i(e.size, e.viewState.center, e.viewState.resolution, {
			rotation: e.viewState.rotation,
			devicePixelRatio: window.devicePixelRatio,
			projection: { definition: e.viewState.projection.getCode() }
		});
		return this.renderer.render(t), this.container;
	}
	resized(e) {
		for (let t of e) {
			let e = t.contentRect.width, n = t.contentRect.height, r = window.devicePixelRatio, i = Math.round(e * r), a = Math.round(n * r);
			this.canvasSize = [i, a];
		}
		this.nativeUpdate();
	}
	resizeCanvas(e, [t, n]) {
		let r = e.width !== t || e.height !== n;
		return r && (e.width = t, e.height = n), r;
	}
	nativeUpdate() {
		this.changed();
	}
	nativePassWarpedMapEvent(e) {
		if (e instanceof n) {
			let t = new l(e.type, e.data);
			this.dispatchEvent(t);
		}
	}
	async addGeoreferenceAnnotation(e, t) {
		o.assertRenderer(this.renderer);
		let n = await this.renderer.addGeoreferenceAnnotation(e, t);
		return this.nativeUpdate(), n;
	}
	async removeGeoreferenceAnnotation(e) {
		o.assertRenderer(this.renderer);
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
		o.assertRenderer(this.renderer);
		let n = this.renderer.addGeoreferencedMap(e, t);
		return this.nativeUpdate(), n;
	}
	async removeGeoreferencedMap(e) {
		o.assertRenderer(this.renderer);
		let t = this.renderer.warpedMapList.removeGeoreferencedMap(e);
		return this.nativeUpdate(), t;
	}
	async removeGeoreferencedMapById(e) {
		o.assertRenderer(this.renderer);
		let t = this.renderer.warpedMapList.removeGeoreferencedMapById(e);
		return this.nativeUpdate(), t;
	}
	addImageInfos(e) {
		o.assertRenderer(this.renderer);
		let t = this.renderer.warpedMapList.addImageInfos(e);
		return this.nativeUpdate(), t;
	}
	async addSprites(e, t, n) {
		o.assertRenderer(this.renderer), await this.renderer.addSprites(e, t, n), this.nativeUpdate();
	}
	getWarpedMapList() {
		return o.assertRenderer(this.renderer), this.renderer.warpedMapList;
	}
	getMapIds() {
		return o.assertRenderer(this.renderer), this.renderer.warpedMapList.getMapIds();
	}
	getWarpedMaps(e) {
		return o.assertRenderer(this.renderer), this.renderer.warpedMapList.getWarpedMaps({ mapIds: e });
	}
	getWarpedMap(e) {
		return o.assertRenderer(this.renderer), this.renderer.warpedMapList.getWarpedMap(e);
	}
	getMapsCenter(e, n) {
		return o.assertRenderer(this.renderer), this.renderer.warpedMapList.getMapsCenter(t({ mapIds: e }, n));
	}
	getMapsBbox(e, n) {
		return o.assertRenderer(this.renderer), this.renderer.warpedMapList.getMapsBbox(t({ mapIds: e }, n));
	}
	getMapsConvexHull(e, n) {
		return o.assertRenderer(this.renderer), this.renderer.warpedMapList.getMapsConvexHull(t({ mapIds: e }, n));
	}
	getMapZIndex(e) {
		return o.assertRenderer(this.renderer), this.renderer.warpedMapList.getMapZIndex(e);
	}
	getOpacity() {
		return this.getLayerOptions().opacity ?? this.getDefaultOptions().opacity;
	}
	getDefaultOptions() {
		return o.assertRenderer(this.renderer), a(this.defaultSpecificWarpedMapLayerOptions, this.renderer.getDefaultOptions());
	}
	getMapDefaultOptions(e) {
		return o.assertRenderer(this.renderer), this.renderer.getMapDefaultOptions(e);
	}
	getLayerOptions() {
		return o.assertRenderer(this.renderer), t(this.options, this.renderer.getOptions());
	}
	getMapMapOptions(e) {
		return o.assertRenderer(this.renderer), this.renderer.getMapMapOptions(e);
	}
	getMapOptions(e) {
		return o.assertRenderer(this.renderer), this.renderer.getMapOptions(e);
	}
	setOpacity(e) {
		this.setLayerOptions({ opacity: e });
	}
	setLayerOptions(e, t) {
		o.assertRenderer(this.renderer), this.options = a(this.options, e), this.renderer.setOptions(e, t);
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
		o.assertRenderer(this.renderer), n && (this.options = a(this.options, n)), this.renderer.setMapsOptions(e, t, n, r);
	}
	setMapsOptionsByMapId(e, t, n) {
		o.assertRenderer(this.renderer), t && (this.options = a(this.options, t)), this.renderer.setMapsOptionsByMapId(e, t, n);
	}
	resetLayerOptions(e, t) {
		o.assertRenderer(this.renderer), this.renderer.resetOptions(e, t);
	}
	resetMapsOptions(e, t, n, r) {
		o.assertRenderer(this.renderer), this.renderer.resetMapsOptions(e, t, n, r);
	}
	resetMapsOptionsByMapId(e, t, n) {
		o.assertRenderer(this.renderer), this.renderer.resetMapsOptionsByMapId(e, t, n);
	}
	bringMapsToFront(e) {
		o.assertRenderer(this.renderer), this.renderer.warpedMapList.bringMapsToFront(e), this.nativeUpdate();
	}
	sendMapsToBack(e) {
		o.assertRenderer(this.renderer), this.renderer.warpedMapList.sendMapsToBack(e), this.nativeUpdate();
	}
	bringMapsForward(e) {
		o.assertRenderer(this.renderer), this.renderer.warpedMapList.bringMapsForward(e), this.nativeUpdate();
	}
	sendMapsBackward(e) {
		o.assertRenderer(this.renderer), this.renderer.warpedMapList.sendMapsBackward(e), this.nativeUpdate();
	}
	clear() {
		o.assertRenderer(this.renderer), this.renderer.clear(), this.nativeUpdate();
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
};
//#endregion
export { d as WarpedMapLayer };
