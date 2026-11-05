import { n as e } from "./esm-JeL8Q4pw.js";
import { n as t } from "./esm-DTXnX1Aq.js";
import { r as n, t as r } from "./archive-urls-bn5tsSXE.js";
import i from "ol/layer/Tile";
import a from "ol/source/DataTile.js";
import o from "ol/TileState.js";
import { MVT as s } from "ol/format.js";
import c from "ol/source/VectorTile.js";
import { createXYZ as l, extentFromProjection as u } from "ol/tilegrid.js";
import d from "ol/layer/WebGLTile";
import f from "ol/source/GeoTIFF";
import p from "ol/TileState";
//#region node_modules/ol-pmtiles/dist/esm/index.js
var m = Object.defineProperty, h = Object.getOwnPropertySymbols, g = Object.prototype.hasOwnProperty, _ = Object.prototype.propertyIsEnumerable, v = (e, t, n) => t in e ? m(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, y = (e, t) => {
	for (var n in t ||= {}) g.call(t, n) && v(e, n, t[n]);
	if (h) for (var n of h(t)) _.call(t, n) && v(e, n, t[n]);
	return e;
}, b = (e, t) => m(e, "name", {
	value: t,
	configurable: !0
}), x = (e, t, n) => new Promise((r, i) => {
	var a = (e) => {
		try {
			s(n.next(e));
		} catch (e) {
			i(e);
		}
	}, o = (e) => {
		try {
			s(n.throw(e));
		} catch (e) {
			i(e);
		}
	}, s = (e) => e.done ? r(e.value) : Promise.resolve(e.value).then(a, o);
	s((n = n.apply(e, t)).next());
}), S = class extends a {
	constructor(e) {
		super(y(y({}, e), { state: "loading" })), this.loadImage = /* @__PURE__ */ b((e) => new Promise((t, n) => {
			let r = new Image();
			r.addEventListener("load", () => t(r)), r.addEventListener("error", () => n(/* @__PURE__ */ Error("load failed"))), r.src = e;
		}), "loadImage");
		let n = new t(e.url);
		n.getHeader().then((t) => {
			let r = e.projection === void 0 ? "EPSG:3857" : e.projection;
			this.tileGrid = e.tileGrid || l({
				extent: u(r),
				maxResolution: e.maxResolution,
				minZoom: t.minZoom,
				maxZoom: t.maxZoom,
				tileSize: e.tileSize
			}), this.setLoader((e, t, r) => x(this, null, function* () {
				let i = yield n.getZxy(e, t, r);
				if (!i) return new Uint8Array();
				let a = URL.createObjectURL(new Blob([i.data])), o = yield this.loadImage(a);
				return URL.revokeObjectURL(a), o;
			})), this.setState("ready");
		});
	}
};
b(S, "PMTilesRasterSource");
var C = S;
b(class extends c {
	constructor(e) {
		super(y(y({}, e), {
			state: "loading",
			url: "pmtiles://{z}/{x}/{y}",
			format: e.format || new s()
		})), this.tileLoadFunction = /* @__PURE__ */ b((e, t) => {
			let n = e, r = /* @__PURE__ */ new RegExp(/pmtiles:\/\/(\d+)\/(\d+)\/(\d+)/), i = t.match(r);
			if (!(i && i.length >= 4)) throw Error("Could not parse tile URL");
			let a = +i[1], s = +i[2], c = +i[3];
			n.setLoader((e, t, r) => {
				this.pmtiles_.getZxy(a, s, c).then((t) => {
					if (t) {
						let i = n.getFormat();
						n.setFeatures(i.readFeatures(t.data, {
							extent: e,
							featureProjection: r
						})), n.setState(o.LOADED);
					} else n.setFeatures([]), n.setState(o.EMPTY);
				}).catch((e) => {
					n.setFeatures([]), n.setState(o.ERROR);
				});
			});
		}, "tileLoadFunction"), this.pmtiles_ = new t(e.url), this.pmtiles_.getHeader().then((t) => {
			let n = e.projection || "EPSG:3857", r = e.extent || u(n);
			this.tileGrid = e.tileGrid || l({
				extent: r,
				maxResolution: e.maxResolution,
				maxZoom: e.maxZoom === void 0 ? t.maxZoom : e.maxZoom,
				minZoom: t.minZoom,
				tileSize: e.tileSize || 512
			}), this.setTileLoadFunction(this.tileLoadFunction), this.setState("ready");
		});
	}
}, "PMTilesVectorSource");
//#endregion
//#region src/map/openlayers-services/archive-layers.ts
var w = /* @__PURE__ */ new Map();
function T(e) {
	let n = r(e), i = w.get(n);
	return i || (i = new t(n), w.set(n, i)), i;
}
async function E(e) {
	let t = T(e), n = await t.getHeader();
	return {
		urlTemplate: "pmtiles://{z}/{x}/{y}",
		minZoom: n.minZoom,
		maxZoom: n.maxZoom,
		tileLoadFunction: (e, n) => {
			let r = e, [i, a, o] = (/pmtiles:\/\/(\d+)\/(\d+)\/(\d+)/.exec(n) ?? []).slice(1).map(Number);
			r.setLoader((e, n, s) => {
				t.getZxy(i, a, o).then((t) => {
					if (!t) {
						r.setFeatures([]), r.setState(p.EMPTY);
						return;
					}
					r.setFeatures(r.getFormat().readFeatures(t.data, {
						extent: e,
						featureProjection: s
					})), r.setState(p.LOADED);
				}).catch(() => {
					r.setFeatures([]), r.setState(p.ERROR);
				});
			});
		}
	};
}
function D(e, t) {
	return new i({
		source: new C({
			url: r(e),
			attributions: t.attribution,
			tileSize: 256
		}),
		minZoom: t.minZoom,
		maxZoom: t.maxZoom,
		opacity: t.opacity
	});
}
function O(t) {
	let n = e({
		colorScheme: t.scheme,
		min: t.min,
		max: t.max,
		isContinuous: t.continuous,
		isReverse: t.reverse
	}), r = ["band", 1];
	if (t.continuous) {
		let e = [];
		for (let r = 0; r <= 16; r++) {
			let i = t.min + (t.max - t.min) * (r / 16);
			e.push(i, [...n(i), 1]);
		}
		return [
			"interpolate",
			["linear"],
			r,
			...e
		];
	}
	let i = n.domain(), a = ["case"];
	for (let e of i) a.push([
		"<",
		r,
		e
	], [...n(e - 2 ** -52 * Math.abs(e || 1)), 1]);
	return a.push([...n(t.max), 1]), a;
}
function k(e, t) {
	let i = n(e), a = new f({
		sources: [{ url: r(e) }],
		normalize: !i,
		convertToRGB: i ? !1 : "auto"
	});
	return t.attribution && a.setAttributions(t.attribution), new d({
		source: a,
		minZoom: t.minZoom,
		maxZoom: t.maxZoom,
		opacity: t.opacity,
		...i ? { style: { color: [
			"case",
			[
				"==",
				["band", 2],
				0
			],
			[
				0,
				0,
				0,
				0
			],
			O(i)
		] } } : {}
	});
}
//#endregion
export { k as createCogLayer, D as createPmtilesRasterLayer, E as pmtilesVectorTileInfo };
