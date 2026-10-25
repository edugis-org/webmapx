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
//#endregion
export { e as t };
