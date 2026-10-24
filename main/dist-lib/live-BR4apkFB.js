import { c as e, l as t, m as n } from "./decorators-d8E4nZJy.js";
import { n as r, r as i } from "./directive-helpers-Debt3Tx3.js";
import { a, i as o, o as s } from "./chunk.NYIIDP5N-gftugmWL.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.GI7VDIWX.js
var c = (e = "value") => (t, r) => {
	let i = t.constructor, a = i.prototype.attributeChangedCallback;
	i.prototype.attributeChangedCallback = function(t, o, s) {
		let c = i.getPropertyOptions(e);
		if (t === (typeof c.attribute == "string" ? c.attribute : e)) {
			let t = c.converter || n, i = (typeof t == "function" ? t : t?.fromAttribute ?? n.fromAttribute)(s, c.type);
			this[e] !== i && (this[r] = i);
		}
		a.call(this, t, o, s);
	};
}, l = o(class extends a {
	constructor(e) {
		if (super(e), e.type !== s.PROPERTY && e.type !== s.ATTRIBUTE && e.type !== s.BOOLEAN_ATTRIBUTE) throw Error("The `live` directive is not allowed on child or event bindings");
		if (!r(e)) throw Error("`live` bindings can only contain a single expression");
	}
	render(e) {
		return e;
	}
	update(n, [r]) {
		if (r === t || r === e) return r;
		let a = n.element, o = n.name;
		if (n.type === s.PROPERTY) {
			if (r === a[o]) return t;
		} else if (n.type === s.BOOLEAN_ATTRIBUTE) {
			if (!!r === a.hasAttribute(o)) return t;
		} else if (n.type === s.ATTRIBUTE && a.getAttribute(o) === r + "") return t;
		return i(n), r;
	}
});
//#endregion
export { c as n, l as t };
