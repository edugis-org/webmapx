import { d as e, i as t, n, o as r, r as i, t as a, u as o } from "./dist-GiquyDnZ.js";
//#region node_modules/@allmaps/maplibre/dist/WarpedMapLayer.js
var s = {
	layerId: "warped-map-layer",
	layerType: "custom",
	layerRenderingMode: "2d"
}, c = class extends a {
	id;
	type;
	renderingMode;
	map;
	constructor(e) {
		super(s, e), this.id = this.options.layerId, this.type = this.options.layerType, this.renderingMode = this.options.layerRenderingMode;
	}
	onAdd(e, t) {
		this.map = e, this.renderer = new n(t, this.options), this.addEventListeners(), this.map.on("webglcontextlost", this.contextLost.bind(this)), this.map.on("webglcontextrestored", this.contextRestored.bind(this));
	}
	onRemove() {
		this.renderer && (this.removeEventListeners(), this.map?.off("webglcontextlost", this.contextLost.bind(this)), this.map?.off("webglcontextrestored", this.contextRestored.bind(this)), this.renderer.destroy());
	}
	getBounds() {
		a.assertRenderer(this.renderer);
		let e = this.renderer.warpedMapList.getMapsBbox({ projection: { definition: "EPSG:4326" } });
		if (e) return [[e[0], e[1]], [e[2], e[3]]];
	}
	render() {
		if (!this.map || !this.renderer) return;
		let t = this.map.getCanvas(), n = [t.width / window.devicePixelRatio, t.height / window.devicePixelRatio], a = this.map.getCenter(), s = r([a.lng, a.lat]), c = this.map.unproject([0, n[1]]), l = this.map.unproject([n[0], n[1]]), u = this.map.unproject([n[0], 0]), d = this.map.unproject([0, 0]), f = e(o([
			r([c.lng, c.lat]),
			r([l.lng, l.lat]),
			r([u.lng, u.lat]),
			r([d.lng, d.lat])
		]), n), p = -(this.map.getBearing() / 180) * Math.PI, m = window.devicePixelRatio, h = new i(n, s, f, {
			rotation: p,
			devicePixelRatio: m
		});
		this.renderer.render(h);
	}
	nativeUpdate() {
		this.map?.triggerRepaint();
	}
	nativePassWarpedMapEvent(e) {
		e instanceof t && this.map && this.map.fire(e.type, {
			...e.data,
			layerId: this.id
		});
	}
};
//#endregion
export { c as WarpedMapLayer };
