import { c as e, l as t } from "./decorators-d8E4nZJy.js";
//#region node_modules/lit-html/directive.js
var n = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, r = (e) => (...t) => ({
	_$litDirective$: e,
	values: t
}), i = class {
	constructor(e) {}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AT(e, t, n) {
		this._$Ct = e, this._$AM = t, this._$Ci = n;
	}
	_$AS(e, t) {
		return this.update(e, t);
	}
	update(e, t) {
		return this.render(...t);
	}
}, a = r(class extends i {
	constructor(e) {
		if (super(e), e.type !== n.ATTRIBUTE || e.name !== "class" || e.strings?.length > 2) throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.");
	}
	render(e) {
		return " " + Object.keys(e).filter(((t) => e[t])).join(" ") + " ";
	}
	update(e, [n]) {
		if (this.st === void 0) {
			this.st = /* @__PURE__ */ new Set(), e.strings !== void 0 && (this.nt = new Set(e.strings.join(" ").split(/\s/).filter(((e) => e !== ""))));
			for (let e in n) n[e] && !this.nt?.has(e) && this.st.add(e);
			return this.render(n);
		}
		let r = e.element.classList;
		for (let e of this.st) e in n || (r.remove(e), this.st.delete(e));
		for (let e in n) {
			let t = !!n[e];
			t === this.st.has(e) || this.nt?.has(e) || (t ? (r.add(e), this.st.add(e)) : (r.remove(e), this.st.delete(e)));
		}
		return t;
	}
}), o = (t) => t ?? e, s = class {
	constructor(e, ...t) {
		this.slotNames = [], this.handleSlotChange = (e) => {
			let t = e.target;
			(this.slotNames.includes("[default]") && !t.name || t.name && this.slotNames.includes(t.name)) && this.host.requestUpdate();
		}, (this.host = e).addController(this), this.slotNames = t;
	}
	hasDefaultSlot() {
		return [...this.host.childNodes].some((e) => {
			if (e.nodeType === e.TEXT_NODE && e.textContent.trim() !== "") return !0;
			if (e.nodeType === e.ELEMENT_NODE) {
				let t = e;
				if (t.tagName.toLowerCase() === "sl-visually-hidden") return !1;
				if (!t.hasAttribute("slot")) return !0;
			}
			return !1;
		});
	}
	hasNamedSlot(e) {
		return this.host.querySelector(`:scope > [slot="${e}"]`) !== null;
	}
	test(e) {
		return e === "[default]" ? this.hasDefaultSlot() : this.hasNamedSlot(e);
	}
	hostConnected() {
		this.host.shadowRoot.addEventListener("slotchange", this.handleSlotChange);
	}
	hostDisconnected() {
		this.host.shadowRoot.removeEventListener("slotchange", this.handleSlotChange);
	}
};
//#endregion
export { i as a, r as i, o as n, n as o, a as r, s as t };
