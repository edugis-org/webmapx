//#region src/map/default-paint.ts
var e = "#444444", t = "#000000", n = .3, r = {
	fill: {
		"fill-color": e,
		"fill-opacity": n,
		"fill-outline-color": t
	},
	line: {
		"line-color": e,
		"line-width": 2
	},
	circle: {
		"circle-color": e,
		"circle-radius": 6
	}
};
function i(e) {
	let t = e.paint;
	return t == null || typeof t == "object" && Object.keys(t).length === 0;
}
function a(e) {
	if (!e || typeof e != "object") return e;
	let t = e;
	if (Array.isArray(t.layers)) return {
		...t,
		layers: t.layers.map((e) => a(e))
	};
	let n = r[String(t.type)];
	return !n || !i(t) ? e : {
		...t,
		paint: { ...n }
	};
}
//#endregion
export { a as i, n, t as r, e as t };
