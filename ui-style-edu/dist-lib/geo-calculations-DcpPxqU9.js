//#region src/utils/geo-calculations.ts
var e = 637100880;
function t(t, n) {
	let [r, i] = t, [a, o] = n, s = (e) => e * Math.PI / 180, c = s(o - i), l = s(a - r), u = Math.sin(c / 2) ** 2 + Math.cos(s(i)) * Math.cos(s(o)) * Math.sin(l / 2) ** 2;
	return e * (2 * Math.atan2(Math.sqrt(u), Math.sqrt(1 - u)));
}
var n = 6371008.8, r = Math.PI / 180;
function i(e) {
	return e ? e.type === "Polygon" ? [e.coordinates] : e.type === "MultiPolygon" ? e.coordinates : e.type === "GeometryCollection" ? e.geometries.flatMap(i) : [] : [];
}
function a(e, t) {
	let n = t - e;
	return Number.isFinite(n) ? n - 360 * Math.round(n / 360) : 0;
}
function o(e) {
	let t = 0;
	for (let n = 0; n < e.length - 1; n++) t += a(e[n][0], e[n + 1][0]);
	return t;
}
function s(e) {
	if (e.length === 0) return e;
	let t = e[0], n = e[e.length - 1];
	return t[0] === n[0] && t[1] === n[1] ? e : [...e, t];
}
function c(e) {
	let t = e.reduce((e, t) => e + t[1], 0) >= 0, i = e.map(([e, i]) => {
		let a = i * r, o = n * Math.sqrt(2 / Math.max(1 + (t ? Math.sin(a) : -Math.sin(a)), 1e-12));
		return [o * Math.cos(a) * Math.sin(e * r), o * Math.cos(a) * Math.cos(e * r)];
	}), a = 0;
	for (let e = 0; e < i.length - 1; e++) a += i[e][0] * i[e + 1][1] - i[e + 1][0] * i[e][1];
	return a / 2;
}
function l(e) {
	let t = s(e);
	if (t.length < 4) return 0;
	if (Math.abs(o(t)) > 350) return c(t);
	let i = 0;
	for (let e = 0; e < t.length - 1; e++) {
		let [n, o] = t[e], [s, c] = t[e + 1];
		i += a(n, s) * r * (2 + Math.sin(o * r) + Math.sin(c * r));
	}
	return i * n * n / 2;
}
function u(e) {
	let t = 0;
	for (let n of i(e)) {
		if (!n.length) continue;
		let e = Math.abs(l(n[0])), r = n.slice(1).reduce((e, t) => e + Math.abs(l(t)), 0);
		t += Math.max(e - r, 0);
	}
	return t;
}
function d(e, t, n) {
	let r = (e) => e * Math.PI / 180, i = (e) => e * 180 / Math.PI, a = t / 6371008.8, o = r(n), s = r(e[1]), c = r(e[0]), l = Math.asin(Math.sin(s) * Math.cos(a) + Math.cos(s) * Math.sin(a) * Math.cos(o));
	return [(i(c + Math.atan2(Math.sin(o) * Math.sin(a) * Math.cos(s), Math.cos(a) - Math.sin(s) * Math.sin(l))) + 540) % 360 - 180, i(l)];
}
function f(e, t, n = 64) {
	let r = [];
	for (let i = 0; i < n; i++) r.push(d(e, t, i / n * 360));
	return r.push(r[0]), r;
}
var p = 30.48, m = 5280, h = 4046.8564224, g = 640;
function _(e, t, n) {
	return e.toLocaleString(n, {
		minimumFractionDigits: t,
		maximumFractionDigits: t
	});
}
function v(e, t, n) {
	return `${_(e, e < 10 ? 3 : e < 100 ? 2 : +(e < 1e3), n)} ${t}`;
}
function y(e, t = "metric", n) {
	if (t === "imperial") {
		let t = e / p;
		return t < m ? `${_(t, 0, n)} ft` : v(t / m, "mi", n);
	}
	let r = e / 100;
	return r < 1e3 ? `${_(r, 0, n)} m` : v(r / 1e3, "km", n);
}
function b(e, t = "metric", n) {
	if (t === "imperial") {
		let t = e / h;
		return t < .1 ? `${_(e / (p / 100) ** 2, 0, n)} sq ft` : t < g ? `${_(t, t < 100 ? 2 : 0, n)} acres` : v(t / g, "sq mi", n);
	}
	if (e < 1e4) return `${_(e, 0, n)} m²`;
	let r = e / 1e4;
	return r < 100 ? `${_(r, 2, n)} ha` : v(e / 1e6, "km²", n);
}
//#endregion
export { t as a, y as i, u as n, i as o, b as r, a as s, f as t };
