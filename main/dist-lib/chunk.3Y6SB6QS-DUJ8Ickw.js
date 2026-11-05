//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.3Y6SB6QS.js
var e = "";
function t(t) {
	e = t;
}
function n(n = "") {
	if (!e) {
		let e = [...document.getElementsByTagName("script")], n = e.find((e) => e.hasAttribute("data-shoelace"));
		if (n) t(n.getAttribute("data-shoelace"));
		else {
			let n = e.find((e) => /shoelace(\.min)?\.js($|\?)/.test(e.src) || /shoelace-autoloader(\.min)?\.js($|\?)/.test(e.src)), r = "";
			n && (r = n.getAttribute("src")), t(r.split("/").slice(0, -1).join("/"));
		}
	}
	return e.replace(/\/$/, "") + (n ? `/${n.replace(/^\//, "")}` : "");
}
//#endregion
export { t as n, n as t };
