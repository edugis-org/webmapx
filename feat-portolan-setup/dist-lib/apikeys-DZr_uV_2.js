//#region src/config/apikeys.ts
var e = null, t = null, n = null, r = "config/apikeys.json";
function i(r) {
	r !== n && (n = r, e = null, t = null);
}
async function a() {
	try {
		let t = await fetch(n ?? r);
		t.ok && (e = await t.json());
	} catch {}
}
function o() {
	return t ||= a(), t;
}
function s(t) {
	return e ? t.replace(/\{key-([^}]+)\}/g, (t, n) => e[n] ?? t) : t;
}
function c(t) {
	return e ? l(t, s) : t;
}
function l(e, t) {
	if (typeof e == "string") return t(e);
	if (Array.isArray(e)) {
		let n = e.map((e) => l(e, t));
		return n.some((t, n) => t !== e[n]) ? n : e;
	}
	if (typeof e == "object" && e) {
		let n = !1, r = {};
		for (let [i, a] of Object.entries(e)) {
			let e = i === "data" && typeof a == "object" && a ? a : l(a, t);
			e !== a && (n = !0), r[i] = e;
		}
		return n ? r : e;
	}
	return e;
}
//#endregion
export { c as a, s as i, l as n, i as r, o as t };
