//#region src/utils/wms-url-builder.ts
var e = class {
	constructor() {
		this.values = /* @__PURE__ */ new Map(), this.originalKeys = /* @__PURE__ */ new Map();
	}
	set(e, t) {
		let n = e.toLowerCase();
		this.originalKeys.has(n) || this.originalKeys.set(n, e), this.values.set(n, t);
	}
	get(e) {
		return this.values.get(e.toLowerCase());
	}
	has(e) {
		return this.values.has(e.toLowerCase());
	}
	getOriginalKey(e) {
		return this.originalKeys.get(e.toLowerCase()) || e;
	}
	entries() {
		let e = [];
		for (let [t, n] of this.values) {
			let r = this.originalKeys.get(t) || t;
			e.push([r, n]);
		}
		return e;
	}
};
function t(t) {
	let { baseUrl: r, layers: i, version: a = "1.3.0", styles: o = "", format: s = "image/png", transparent: c = !0, crs: l = "EPSG:3857", tileSize: u = 256, extraParams: d = {} } = t, f;
	try {
		f = new URL(r, window?.location?.origin || "http://localhost");
	} catch {
		let e = document.createElement("a");
		e.href = r, f = new URL(e.href, window?.location?.origin || "http://localhost");
	}
	let p = new e();
	f.searchParams.forEach((e, t) => {
		p.set(t, e);
	});
	for (let [e, t] of Object.entries(d)) p.set(e, t);
	p.has("service") || p.set("service", "WMS"), p.has("request") || p.set("request", "GetMap"), p.has("version") || p.set("version", a), p.has("layers") || p.set("layers", i), p.has("styles") || p.set("styles", o), p.has("format") || p.set("format", s), p.has("transparent") || p.set("transparent", c ? "TRUE" : "FALSE");
	let m = n(p.get("version") || a);
	!p.has("crs") && !p.has("srs") && p.set(m ? "crs" : "srs", l), p.set("bbox", "{bbox-epsg-3857}"), p.has("width") || p.set("width", String(u)), p.has("height") || p.set("height", String(u));
	let h = p.entries().map(([e, t]) => t.includes("{") && t.includes("}") ? `${e}=${t}` : `${e}=${encodeURIComponent(t)}`);
	return `${r.split("?")[0].replace(/[?&]+$/, "")}?${h.join("&")}`;
}
function n(e) {
	let t = e.trim().split(".").map(Number);
	return t.length >= 2 && (t[0] > 1 || t[0] === 1 && t[1] >= 3);
}
//#endregion
export { t };
