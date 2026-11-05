import { p as e } from "./decorators-d8E4nZJy.js";
//#region node_modules/lit-html/static.js
var t = Symbol.for(""), n = (e) => {
	if (e?.r === t) return e?._$litStatic$;
}, r = (e, ...n) => ({
	_$litStatic$: n.reduce(((t, n, r) => t + ((e) => {
		if (e._$litStatic$ !== void 0) return e._$litStatic$;
		throw Error(`Value passed to 'literal' function must be a 'literal' result: ${e}. Use 'unsafeStatic' to pass non-literal values, but\n            take care to ensure page security.`);
	})(n) + e[r + 1]), e[0]),
	r: t
}), i = /* @__PURE__ */ new Map(), a = ((e) => (t, ...r) => {
	let a = r.length, o, s, c = [], l = [], u, d = 0, f = !1;
	for (; d < a;) {
		for (u = t[d]; d < a && (s = r[d], o = n(s)) !== void 0;) u += o + t[++d], f = !0;
		d !== a && l.push(s), c.push(u), d++;
	}
	if (d === a && c.push(t[a]), f) {
		let e = c.join("$$lit$$");
		(t = i.get(e)) === void 0 && (c.raw = c, i.set(e, t = c)), r = l;
	}
	return e(t, ...r);
})(e);
//#endregion
export { a as n, r as t };
