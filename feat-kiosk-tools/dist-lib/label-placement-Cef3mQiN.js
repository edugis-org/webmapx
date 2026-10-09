//#region src/map/label-placement.ts
function e(e) {
	let t = [...e].sort((e, t) => e.sortKey - t.sortKey), n = [], r = /* @__PURE__ */ new Set();
	for (let { item: e, box: i } of t) n.some((e) => !(i.right < e.left || i.left > e.right || i.bottom < e.top || i.top > e.bottom)) || (n.push(i), r.add(e));
	return r;
}
//#endregion
export { e as t };
