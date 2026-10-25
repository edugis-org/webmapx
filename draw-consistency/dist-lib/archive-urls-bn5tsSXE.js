//#region src/map/archive-urls.ts
function e(e) {
	if (typeof e != "string") return null;
	let t = /^(pmtiles|cog):\/\//.exec(e);
	return t ? t[1] : null;
}
function t(e) {
	let t = e.replace(/^(pmtiles|cog):\/\//, ""), n = t.indexOf("#");
	return n >= 0 ? t.slice(0, n) : t;
}
function n(e) {
	let t = /#color:([^,]+),([^,]+),([^,]+)(?:,([c-]*))?$/.exec(e);
	if (!t) return null;
	let n = Number(t[2]), r = Number(t[3]);
	if (!Number.isFinite(n) || !Number.isFinite(r)) return null;
	let i = t[4] ?? "";
	return {
		scheme: t[1],
		min: n,
		max: r,
		continuous: i.includes("c"),
		reverse: i.includes("-")
	};
}
//#endregion
export { e as n, n as r, t };
