//#region src/utils/appearance.ts
var e = [
	"atlas",
	"folio",
	"console",
	"classroom"
], t = [
	"auto",
	"light",
	"dark"
], n = {
	style: "atlas",
	theme: "auto"
}, r = "webmapx-style", i = "webmapx-theme", a = "webmapx-appearance-chosen", o = "webmapx-appearance-change", s = {
	light: "atlas",
	dark: "atlas",
	compact: "console",
	glossy: "atlas"
};
function c(t) {
	return typeof t == "string" && e.includes(t);
}
function l(e) {
	return typeof e == "string" && t.includes(e);
}
var u = {}, d = null;
function f() {
	try {
		return typeof localStorage > "u" ? null : localStorage;
	} catch {
		return null;
	}
}
function p() {
	let e = f();
	if (!e || e.getItem(a) !== "1") return {};
	let t = e.getItem(r), n = e.getItem(i);
	return {
		...c(t) ? { style: t } : t && s[t] ? { style: s[t] } : {},
		...l(n) ? { theme: n } : {}
	};
}
function m() {
	return {
		...n,
		...u,
		...p()
	};
}
function h(e) {
	return e === "auto" ? typeof matchMedia == "function" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" : e;
}
function g() {
	let e = m();
	if (typeof document > "u") return e;
	let t = document.documentElement, n = h(e.theme);
	return t.setAttribute("data-style", e.style), t.setAttribute("data-theme", n), t.classList.toggle("sl-theme-dark", n === "dark"), t.style.colorScheme = n, _(), document.dispatchEvent(new CustomEvent(o, { detail: {
		...e,
		resolvedTheme: n
	} })), e;
}
function _() {
	d || typeof matchMedia != "function" || (d = matchMedia("(prefers-color-scheme: dark)"), d.addEventListener("change", () => {
		m().theme === "auto" && g();
	}));
}
function v(e) {
	let t = e && typeof e == "object" ? e : {};
	u = {
		...c(t.style) ? { style: t.style } : {},
		...l(t.theme) ? { theme: t.theme } : {}
	}, g();
}
function y(e) {
	let t = f(), n = {
		...m(),
		...e
	};
	try {
		t?.setItem(r, n.style), t?.setItem(i, n.theme), t?.setItem(a, "1");
	} catch {}
	return t || (u = {
		...u,
		...e
	}), g();
}
//#endregion
export { m as a, h as c, y as i, v as l, e as n, c as o, t as r, l as s, o as t };
