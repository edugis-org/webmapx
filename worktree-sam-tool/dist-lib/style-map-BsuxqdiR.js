import { l as e } from "./decorators-d8E4nZJy.js";
import { a as t, i as n, o as r } from "./chunk.NYIIDP5N-gftugmWL.js";
//#region node_modules/lit-html/directives/style-map.js
var i = "important", a = " !important", o = n(class extends t {
	constructor(e) {
		if (super(e), e.type !== r.ATTRIBUTE || e.name !== "style" || e.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
	}
	render(e) {
		return Object.keys(e).reduce(((t, n) => {
			let r = e[n];
			return r == null ? t : t + `${n = n.includes("-") ? n : n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${r};`;
		}), "");
	}
	update(t, [n]) {
		let { style: r } = t.element;
		if (this.ft === void 0) return this.ft = new Set(Object.keys(n)), this.render(n);
		for (let e of this.ft) n[e] ?? (this.ft.delete(e), e.includes("-") ? r.removeProperty(e) : r[e] = null);
		for (let e in n) {
			let t = n[e];
			if (t != null) {
				this.ft.add(e);
				let n = typeof t == "string" && t.endsWith(a);
				e.includes("-") || n ? r.setProperty(e, n ? t.slice(0, -11) : t, n ? i : "") : r[e] = t;
			}
		}
		return e;
	}
});
//#endregion
export { o as t };
