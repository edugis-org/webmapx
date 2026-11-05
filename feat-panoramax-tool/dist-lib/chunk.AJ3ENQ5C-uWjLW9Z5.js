import { c as e, l as t } from "./directive-helpers-Debt3Tx3.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.K7JGTRV7.js
var n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new WeakMap();
function i(e) {
	return e ?? {
		keyframes: [],
		options: { duration: 0 }
	};
}
function a(e, t) {
	return t.toLowerCase() === "rtl" ? {
		keyframes: e.rtlKeyframes || e.keyframes,
		options: e.options
	} : e;
}
function o(e, t) {
	n.set(e, i(t));
}
function s(e, t, i) {
	let o = r.get(e);
	if (o?.[t]) return a(o[t], i.dir);
	let s = n.get(t);
	return s ? a(s, i.dir) : {
		keyframes: [],
		options: { duration: 0 }
	};
}
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.B4BZKR24.js
function c(e, t) {
	return new Promise((n) => {
		function r(i) {
			i.target === e && (e.removeEventListener(t, r), n());
		}
		e.addEventListener(t, r);
	});
}
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.AJ3ENQ5C.js
function l(n, r, i) {
	return new Promise((a) => {
		if (i?.duration === Infinity) throw Error("Promise-based animations must be finite.");
		let o = n.animate(r, e(t({}, i), { duration: d() ? 0 : i.duration }));
		o.addEventListener("cancel", a, { once: !0 }), o.addEventListener("finish", a, { once: !0 });
	});
}
function u(e) {
	return e = e.toString().toLowerCase(), e.indexOf("ms") > -1 ? parseFloat(e) : e.indexOf("s") > -1 ? parseFloat(e) * 1e3 : parseFloat(e);
}
function d() {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function f(e) {
	return Promise.all(e.getAnimations().map((e) => new Promise((t) => {
		e.cancel(), requestAnimationFrame(t);
	})));
}
function p(n, r) {
	return n.map((n) => e(t({}, n), { height: n.height === "auto" ? `${r}px` : n.height }));
}
//#endregion
export { c as a, f as i, u as n, s as o, p as r, o as s, l as t };
