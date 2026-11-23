//#region src/utils/toast.ts
function e(e) {
	return String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
async function t(e, t = {}) {
	let { variant: n = "neutral", icon: r = n === "danger" ? "x-circle" : n === "warning" ? "exclamation-triangle" : "info-circle", duration: i = n === "danger" ? Infinity : 8e3, closable: a = !0 } = t;
	await import("./alert-B-ynfNiY.js"), await import("./icon-BQSSCXaI.js");
	let o = Object.assign(document.createElement("sl-alert"), {
		variant: n,
		closable: a,
		duration: i
	});
	o.innerHTML = `<sl-icon slot="icon" name="${r}"></sl-icon>${e}`, document.body.appendChild(o), o.toast();
}
//#endregion
export { t as n, e as t };
