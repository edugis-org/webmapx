import { c as e, l as t } from "./decorators-d8E4nZJy.js";
import { a as n, i as r, o as i } from "./chunk.NYIIDP5N-gftugmWL.js";
//#region node_modules/lit-html/directives/unsafe-html.js
var a = class extends n {
	constructor(t) {
		if (super(t), this.it = e, t.type !== i.CHILD) throw Error(this.constructor.directiveName + "() can only be used in child bindings");
	}
	render(n) {
		if (n === e || n == null) return this._t = void 0, this.it = n;
		if (n === t) return n;
		if (typeof n != "string") throw Error(this.constructor.directiveName + "() called with a non-string value");
		if (n === this.it) return this._t;
		this.it = n;
		let r = [n];
		return r.raw = r, this._t = {
			_$litType$: this.constructor.resultType,
			strings: r,
			values: []
		};
	}
};
a.directiveName = "unsafeHTML", a.resultType = 1;
var o = r(a);
//#endregion
export { o as t };
