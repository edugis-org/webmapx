//#region src/utils/dom-focus-utils.ts
function e(e) {
	let t = typeof e.composedPath == "function" ? e.composedPath() : [e.target];
	for (let e of t) {
		let t = e;
		if (!t || typeof t.tagName != "string") continue;
		let n = t.tagName.toLowerCase();
		if (n === "input" || n === "textarea" || n === "select" || t.isContentEditable) return !0;
	}
	return !1;
}
var t = new Set([
	"text",
	"search",
	"email",
	"number",
	"password",
	"tel",
	"url",
	"date",
	"datetime-local",
	"month",
	"time",
	"week"
]);
function n(e) {
	let n = typeof e.composedPath == "function" ? e.composedPath() : [e.target];
	for (let e of n) {
		let n = e;
		if (!n || typeof n.tagName != "string") continue;
		let r = n.tagName.toLowerCase();
		if (r === "textarea") return !n.readOnly;
		if (r === "input") {
			let e = n;
			return t.has((e.type || "text").toLowerCase()) && !e.readOnly;
		}
		if (n.isContentEditable) return !0;
	}
	return !1;
}
//#endregion
export { n, e as t };
