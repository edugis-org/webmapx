//#region src/utils/appearance.ts
var e = [
	"atlas",
	"folio",
	"console",
	"classroom",
	"glass",
	"pebble",
	"studio",
	"island",
	"ink"
], t = [
	"auto",
	"light",
	"dark"
], n = [
	"default",
	"ocean",
	"forest",
	"coral",
	"violet",
	"graphite"
], r = [
	"style",
	"system",
	"inter",
	"poppins",
	"nunito",
	"atkinson",
	"lexend",
	"merriweather",
	"condensed",
	"mono"
], i = {
	style: "atlas",
	theme: "auto",
	palette: "default",
	font: "style"
}, a = "webmapx-style", o = "webmapx-theme", s = "webmapx-appearance-chosen", c = "webmapx-appearance-change", l = {
	light: "atlas",
	dark: "atlas",
	compact: "console",
	glossy: "atlas"
};
function u(t) {
	return typeof t == "string" && e.includes(t);
}
function d(e) {
	return typeof e == "string" && t.includes(e);
}
function f(e) {
	return typeof e == "string" && n.includes(e);
}
function p(e) {
	return typeof e == "string" && r.includes(e);
}
var m = {}, h = null;
function g() {
	try {
		return typeof localStorage > "u" ? null : localStorage;
	} catch {
		return null;
	}
}
function _() {
	let e = g();
	if (!e || e.getItem(s) !== "1") return {};
	let t = e.getItem(a), n = e.getItem(o);
	return {
		...u(t) ? { style: t } : t && l[t] ? { style: l[t] } : {},
		...d(n) ? { theme: n } : {}
	};
}
function v() {
	return {
		...i,
		...m,
		..._()
	};
}
function y(e) {
	return e === "auto" ? typeof matchMedia == "function" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" : e;
}
function b() {
	let e = v();
	if (typeof document > "u") return e;
	let t = document.documentElement, n = y(e.theme);
	return t.setAttribute("data-style", e.style), t.setAttribute("data-theme", n), x(t, "data-palette", e.palette === "default" ? null : e.palette), x(t, "data-font", e.font === "style" ? null : e.font), t.classList.toggle("sl-theme-dark", n === "dark"), t.style.colorScheme = n, S(), document.dispatchEvent(new CustomEvent(c, { detail: {
		...e,
		resolvedTheme: n
	} })), e;
}
function x(e, t, n) {
	n === null ? e.removeAttribute(t) : e.setAttribute(t, n);
}
function S() {
	h || typeof matchMedia != "function" || (h = matchMedia("(prefers-color-scheme: dark)"), h.addEventListener("change", () => {
		v().theme === "auto" && b();
	}));
}
function C(e) {
	let t = e && typeof e == "object" ? e : {};
	m = {
		...u(t.style) ? { style: t.style } : {},
		...d(t.theme) ? { theme: t.theme } : {},
		...f(t.palette) ? { palette: t.palette } : {},
		...p(t.font) ? { font: t.font } : {}
	}, b();
}
function w(e) {
	let t = g(), n = {
		...v(),
		...e
	};
	try {
		t?.setItem(a, n.style), t?.setItem(o, n.theme), t?.setItem(s, "1");
	} catch {}
	return t || (m = {
		...m,
		...e
	}), b();
}
//#endregion
export { t as a, p as c, d, y as f, e as i, f as l, r as n, w as o, C as p, n as r, v as s, c as t, u };
