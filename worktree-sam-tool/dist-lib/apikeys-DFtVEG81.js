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
	if (!e) return t;
	if (typeof t == "string") return s(t);
	if (Array.isArray(t)) {
		let e = t.map(c);
		return e.some((e, n) => e !== t[n]) ? e : t;
	}
	if (typeof t == "object" && t) {
		let e = !1, n = {};
		for (let [r, i] of Object.entries(t)) {
			let t = r === "data" && typeof i == "object" && i ? i : c(i);
			t !== i && (e = !0), n[r] = t;
		}
		return e ? n : t;
	}
	return t;
}
//#endregion
export { c as i, i as n, s as r, o as t };
