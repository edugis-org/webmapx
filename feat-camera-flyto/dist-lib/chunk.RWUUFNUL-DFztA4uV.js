//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.RWUUFNUL.js
function e(e, t) {
	return {
		top: Math.round(e.getBoundingClientRect().top - t.getBoundingClientRect().top),
		left: Math.round(e.getBoundingClientRect().left - t.getBoundingClientRect().left)
	};
}
var t = /* @__PURE__ */ new Set();
function n() {
	let e = document.documentElement.clientWidth;
	return Math.abs(window.innerWidth - e);
}
function r() {
	let e = Number(getComputedStyle(document.body).paddingRight.replace(/px/, ""));
	return isNaN(e) || !e ? 0 : e;
}
function i(e) {
	if (t.add(e), !document.documentElement.classList.contains("sl-scroll-lock")) {
		let e = n() + r(), t = getComputedStyle(document.documentElement).scrollbarGutter;
		(!t || t === "auto") && (t = "stable"), e < 2 && (t = ""), document.documentElement.style.setProperty("--sl-scroll-lock-gutter", t), document.documentElement.classList.add("sl-scroll-lock"), document.documentElement.style.setProperty("--sl-scroll-lock-size", `${e}px`);
	}
}
function a(e) {
	t.delete(e), t.size === 0 && (document.documentElement.classList.remove("sl-scroll-lock"), document.documentElement.style.removeProperty("--sl-scroll-lock-size"));
}
function o(t, n, r = "vertical", i = "smooth") {
	let a = e(t, n), o = a.top + n.scrollTop, s = a.left + n.scrollLeft, c = n.scrollLeft, l = n.scrollLeft + n.offsetWidth, u = n.scrollTop, d = n.scrollTop + n.offsetHeight;
	(r === "horizontal" || r === "both") && (s < c ? n.scrollTo({
		left: s,
		behavior: i
	}) : s + t.clientWidth > l && n.scrollTo({
		left: s - n.offsetWidth + t.clientWidth,
		behavior: i
	})), (r === "vertical" || r === "both") && (o < u ? n.scrollTo({
		top: o,
		behavior: i
	}) : o + t.clientHeight > d && n.scrollTo({
		top: o - n.offsetHeight + t.clientHeight,
		behavior: i
	}));
}
//#endregion
export { o as n, a as r, i as t };
