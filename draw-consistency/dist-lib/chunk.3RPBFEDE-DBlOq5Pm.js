import { c as e, l as t } from "./directive-helpers-Debt3Tx3.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.3RPBFEDE.js
var n = /* @__PURE__ */ new WeakMap(), r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new WeakMap(), a = /* @__PURE__ */ new WeakSet(), o = /* @__PURE__ */ new WeakMap(), s = class {
	constructor(e, r) {
		this.handleFormData = (e) => {
			let t = this.options.disabled(this.host), n = this.options.name(this.host), r = this.options.value(this.host), i = this.host.tagName.toLowerCase() === "sl-button";
			this.host.isConnected && !t && !i && typeof n == "string" && n.length > 0 && r !== void 0 && (Array.isArray(r) ? r.forEach((t) => {
				e.formData.append(n, t.toString());
			}) : e.formData.append(n, r.toString()));
		}, this.handleFormSubmit = (e) => {
			var t;
			let r = this.options.disabled(this.host), i = this.options.reportValidity;
			this.form && !this.form.noValidate && ((t = n.get(this.form)) == null || t.forEach((e) => {
				this.setUserInteracted(e, !0);
			})), this.form && !this.form.noValidate && !r && !i(this.host) && (e.preventDefault(), e.stopImmediatePropagation());
		}, this.handleFormReset = () => {
			this.options.setValue(this.host, this.options.defaultValue(this.host)), this.setUserInteracted(this.host, !1), o.set(this.host, []);
		}, this.handleInteraction = (e) => {
			let t = o.get(this.host);
			t.includes(e.type) || t.push(e.type), t.length === this.options.assumeInteractionOn.length && this.setUserInteracted(this.host, !0);
		}, this.checkFormValidity = () => {
			if (this.form && !this.form.noValidate) {
				let e = this.form.querySelectorAll("*");
				for (let t of e) if (typeof t.checkValidity == "function" && !t.checkValidity()) return !1;
			}
			return !0;
		}, this.reportFormValidity = () => {
			if (this.form && !this.form.noValidate) {
				let e = this.form.querySelectorAll("*");
				for (let t of e) if (typeof t.reportValidity == "function" && !t.reportValidity()) return !1;
			}
			return !0;
		}, (this.host = e).addController(this), this.options = t({
			form: (e) => {
				let t = e.form;
				if (t) {
					let n = e.getRootNode().querySelector(`#${t}`);
					if (n) return n;
				}
				return e.closest("form");
			},
			name: (e) => e.name,
			value: (e) => e.value,
			defaultValue: (e) => e.defaultValue,
			disabled: (e) => e.disabled ?? !1,
			reportValidity: (e) => typeof e.reportValidity == "function" ? e.reportValidity() : !0,
			checkValidity: (e) => typeof e.checkValidity == "function" ? e.checkValidity() : !0,
			setValue: (e, t) => e.value = t,
			assumeInteractionOn: ["sl-input"]
		}, r);
	}
	hostConnected() {
		let e = this.options.form(this.host);
		e && this.attachForm(e), o.set(this.host, []), this.options.assumeInteractionOn.forEach((e) => {
			this.host.addEventListener(e, this.handleInteraction);
		});
	}
	hostDisconnected() {
		this.detachForm(), o.delete(this.host), this.options.assumeInteractionOn.forEach((e) => {
			this.host.removeEventListener(e, this.handleInteraction);
		});
	}
	hostUpdated() {
		let e = this.options.form(this.host);
		e || this.detachForm(), e && this.form !== e && (this.detachForm(), this.attachForm(e)), this.host.hasUpdated && this.setValidity(this.host.validity.valid);
	}
	attachForm(e) {
		e ? (this.form = e, n.has(this.form) ? n.get(this.form).add(this.host) : n.set(this.form, /* @__PURE__ */ new Set([this.host])), this.form.addEventListener("formdata", this.handleFormData), this.form.addEventListener("submit", this.handleFormSubmit), this.form.addEventListener("reset", this.handleFormReset), r.has(this.form) || (r.set(this.form, this.form.reportValidity), this.form.reportValidity = () => this.reportFormValidity()), i.has(this.form) || (i.set(this.form, this.form.checkValidity), this.form.checkValidity = () => this.checkFormValidity())) : this.form = void 0;
	}
	detachForm() {
		if (!this.form) return;
		let e = n.get(this.form);
		e && (e.delete(this.host), e.size <= 0 && (this.form.removeEventListener("formdata", this.handleFormData), this.form.removeEventListener("submit", this.handleFormSubmit), this.form.removeEventListener("reset", this.handleFormReset), r.has(this.form) && (this.form.reportValidity = r.get(this.form), r.delete(this.form)), i.has(this.form) && (this.form.checkValidity = i.get(this.form), i.delete(this.form)), this.form = void 0));
	}
	setUserInteracted(e, t) {
		t ? a.add(e) : a.delete(e), e.requestUpdate();
	}
	doAction(e, t) {
		if (this.form) {
			let n = document.createElement("button");
			n.type = e, n.style.position = "absolute", n.style.width = "0", n.style.height = "0", n.style.clipPath = "inset(50%)", n.style.overflow = "hidden", n.style.whiteSpace = "nowrap", t && (n.name = t.name, n.value = t.value, [
				"formaction",
				"formenctype",
				"formmethod",
				"formnovalidate",
				"formtarget"
			].forEach((e) => {
				t.hasAttribute(e) && n.setAttribute(e, t.getAttribute(e));
			})), this.form.append(n), n.click(), n.remove();
		}
	}
	getForm() {
		return this.form ?? null;
	}
	reset(e) {
		this.doAction("reset", e);
	}
	submit(e) {
		this.doAction("submit", e);
	}
	setValidity(e) {
		let t = this.host, n = !!a.has(t), r = !!t.required;
		t.toggleAttribute("data-required", r), t.toggleAttribute("data-optional", !r), t.toggleAttribute("data-invalid", !e), t.toggleAttribute("data-valid", e), t.toggleAttribute("data-user-invalid", !e && n), t.toggleAttribute("data-user-valid", e && n);
	}
	updateValidity() {
		let e = this.host;
		this.setValidity(e.validity.valid);
	}
	emitInvalidEvent(e) {
		let t = new CustomEvent("sl-invalid", {
			bubbles: !1,
			composed: !1,
			cancelable: !0,
			detail: {}
		});
		e || t.preventDefault(), this.host.dispatchEvent(t) || e?.preventDefault();
	}
}, c = Object.freeze({
	badInput: !1,
	customError: !1,
	patternMismatch: !1,
	rangeOverflow: !1,
	rangeUnderflow: !1,
	stepMismatch: !1,
	tooLong: !1,
	tooShort: !1,
	typeMismatch: !1,
	valid: !0,
	valueMissing: !1
}), l = Object.freeze(e(t({}, c), {
	valid: !1,
	valueMissing: !0
})), u = Object.freeze(e(t({}, c), {
	valid: !1,
	customError: !0
}));
//#endregion
export { l as i, u as n, c as r, s as t };
