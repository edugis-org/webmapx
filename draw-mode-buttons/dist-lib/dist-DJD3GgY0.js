import { t as e } from "./chunk-HEgqtunE.js";
//#region node_modules/@camptocamp/ogc-client/dist/worker/index.js
var t = 0;
function n() {
	return t++;
}
var r = Object.defineProperty, i = Object.getOwnPropertyDescriptor, a = Object.getOwnPropertyNames, o = Object.prototype.hasOwnProperty, s = (e, t) => {
	for (var n in t) r(e, n, {
		get: t[n],
		enumerable: !0
	});
}, c = (e, t, n, s) => {
	if (t && typeof t == "object" || typeof t == "function") for (let c of a(t)) !o.call(e, c) && c !== n && r(e, c, {
		get: () => t[c],
		enumerable: !(s = i(t, c)) || s.enumerable
	});
	return e;
}, l = (e) => c(r({}, "__esModule", { value: !0 }), e), u = {};
s(u, {
	XmlCdata: () => O,
	XmlComment: () => k,
	XmlDeclaration: () => A,
	XmlDocument: () => M,
	XmlDocumentType: () => N,
	XmlElement: () => j,
	XmlError: () => P,
	XmlNode: () => E,
	XmlProcessingInstruction: () => F,
	XmlText: () => D,
	parseXml: () => te
}), l(u);
var d = "", f = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g, p = class {
	constructor(e) {
		if (this.k = this.q(e, !0), this.d = 0, this.length = e.length, this.n = this.k !== this.length, this.m = e, this.n) {
			let t = [];
			for (let n = 0, r = 0; r < this.k; ++r) t[r] = n, n += e.codePointAt(n) > 65535 ? 2 : 1;
			this.y = t;
		}
	}
	get z() {
		return this.d >= this.k;
	}
	q(e, t = this.n) {
		return t ? e.replace(f, "_").length : e.length;
	}
	g(e = 1) {
		this.d = Math.min(this.k, this.d + e);
	}
	i(e = this.d) {
		return this.n ? this.y[e] ?? Infinity : e;
	}
	F(e = 1) {
		let t = this.h(e);
		return this.g(e), t;
	}
	G(e) {
		if (!e.sticky) throw Error("`regex` must have a sticky flag (\"y\")");
		e.lastIndex = this.i();
		let t = e.exec(this.m);
		if (t === null || t.length === 0) return d;
		let n = t[0];
		return this.g(this.q(n)), n;
	}
	v(e) {
		let t, n = d;
		for (; (t = this.h()) && e(t);) n += t, this.g();
		return n;
	}
	Q(e) {
		if (this.b(e)) return e;
		if (this.n) {
			let { length: t } = e, n = this.q(e);
			if (n !== t && e === this.h(n)) return this.g(n), e;
		}
		return d;
	}
	b(e) {
		let { length: t } = e;
		return this.h(t) === e ? (this.g(t), e) : d;
	}
	A(e) {
		let t = this.m.slice(this.i()), n = t.search(e);
		if (n <= 0) return d;
		let r = t.slice(0, n);
		return this.g(this.q(r)), r;
	}
	t(e) {
		let { m: t } = this, n = this.i(), r = t.indexOf(e, n);
		if (r <= 0) return d;
		let i = t.slice(n, r);
		return this.g(this.q(i)), i;
	}
	h(e = 1) {
		let { d: t, n, m: r } = this;
		return n ? t >= this.k ? d : r.slice(this.i(t), this.i(t + e)) : r.slice(t, t + e);
	}
	o(e = 0) {
		this.d = e >= 0 ? Math.min(this.k, e) : Math.max(0, this.d + e);
	}
}, m = /[^"&<]+/y, h = /[^'&<]+/y, g = /\r\n|[\n\r\t]/g, _ = /<|&|]]>/, v = Object.freeze(Object.assign(/* @__PURE__ */ Object.create(null), {
	amp: "&",
	apos: "'",
	gt: ">",
	lt: "<",
	quot: "\""
}));
function y(e) {
	let t = w(e);
	return t >= 97 && t <= 122 || t >= 65 && t <= 90 || t >= 48 && t <= 57 || t === 45 || t === 46 || t === 183 || t >= 768 && t <= 879 || t >= 8255 && t <= 8256 || b(e, t);
}
function b(e, t = w(e)) {
	return t >= 97 && t <= 122 || t >= 65 && t <= 90 || t === 58 || t === 95 || t >= 192 && t <= 214 || t >= 216 && t <= 246 || t >= 248 && t <= 767 || t >= 880 && t <= 893 || t >= 895 && t <= 8191 || t >= 8204 && t <= 8205 || t >= 8304 && t <= 8591 || t >= 11264 && t <= 12271 || t >= 12289 && t <= 55295 || t >= 63744 && t <= 64975 || t >= 65008 && t <= 65533 || t >= 65536 && t <= 983039;
}
function x(e) {
	return e === "#" || y(e);
}
function S(e) {
	let t = w(e);
	return t === 32 || t === 9 || t === 10 || t === 13;
}
function C(e) {
	return e === 9 || e === 10 || e === 13 || e >= 32 && e <= 55295 || e >= 57344 && e <= 65533 || e >= 65536 && e <= 1114111;
}
function w(e) {
	return e.codePointAt(0) || -1;
}
var T = class {
	constructor() {
		this.parent = null, this.start = -1, this.end = -1;
	}
	get document() {
		return this.parent?.document ?? null;
	}
	get isRootNode() {
		return this.parent !== null && this.parent === this.document && this.type === T.TYPE_ELEMENT;
	}
	get preserveWhitespace() {
		return !!this.parent?.preserveWhitespace;
	}
	get type() {
		return "";
	}
	toJSON() {
		let e = { type: this.type };
		return this.isRootNode && (e.isRootNode = !0), this.preserveWhitespace && (e.preserveWhitespace = !0), this.start !== -1 && (e.start = this.start, e.end = this.end), e;
	}
}, E = T;
E.TYPE_CDATA = "cdata", E.TYPE_COMMENT = "comment", E.TYPE_DOCUMENT = "document", E.TYPE_DOCUMENT_TYPE = "doctype", E.TYPE_ELEMENT = "element", E.TYPE_PROCESSING_INSTRUCTION = "pi", E.TYPE_TEXT = "text", E.TYPE_XML_DECLARATION = "xmldecl";
var D = class extends E {
	constructor(e = "") {
		super(), this.text = e;
	}
	get type() {
		return E.TYPE_TEXT;
	}
	toJSON() {
		return Object.assign(E.prototype.toJSON.call(this), { text: this.text });
	}
}, O = class extends D {
	get type() {
		return E.TYPE_CDATA;
	}
}, k = class extends E {
	constructor(e = "") {
		super(), this.content = e;
	}
	get type() {
		return E.TYPE_COMMENT;
	}
	toJSON() {
		return Object.assign(E.prototype.toJSON.call(this), { content: this.content });
	}
}, A = class extends E {
	constructor(e, t, n) {
		super(), this.version = e, this.encoding = t ?? null, this.standalone = n ?? null;
	}
	get type() {
		return E.TYPE_XML_DECLARATION;
	}
	toJSON() {
		let e = E.prototype.toJSON.call(this);
		e.version = this.version;
		for (let t of ["encoding", "standalone"]) this[t] !== null && (e[t] = this[t]);
		return e;
	}
}, j = class extends E {
	constructor(e, t = /* @__PURE__ */ Object.create(null), n = []) {
		super(), this.name = e, this.attributes = t, this.children = n;
	}
	get isEmpty() {
		return this.children.length === 0;
	}
	get preserveWhitespace() {
		let e = this;
		for (; e instanceof j;) {
			if ("xml:space" in e.attributes) return e.attributes["xml:space"] === "preserve";
			e = e.parent;
		}
		return !1;
	}
	get text() {
		return this.children.map((e) => "text" in e ? e.text : "").join("");
	}
	get type() {
		return E.TYPE_ELEMENT;
	}
	toJSON() {
		return Object.assign(E.prototype.toJSON.call(this), {
			name: this.name,
			attributes: this.attributes,
			children: this.children.map((e) => e.toJSON())
		});
	}
}, M = class extends E {
	constructor(e = []) {
		super(), this.children = e;
	}
	get document() {
		return this;
	}
	get root() {
		for (let e of this.children) if (e instanceof j) return e;
		return null;
	}
	get text() {
		return this.children.map((e) => "text" in e ? e.text : "").join("");
	}
	get type() {
		return E.TYPE_DOCUMENT;
	}
	toJSON() {
		return Object.assign(E.prototype.toJSON.call(this), { children: this.children.map((e) => e.toJSON()) });
	}
}, N = class extends E {
	constructor(e, t, n, r) {
		super(), this.name = e, this.publicId = t ?? null, this.systemId = n ?? null, this.internalSubset = r ?? null;
	}
	get type() {
		return E.TYPE_DOCUMENT_TYPE;
	}
	toJSON() {
		let e = E.prototype.toJSON.call(this);
		e.name = this.name;
		for (let t of [
			"publicId",
			"systemId",
			"internalSubset"
		]) this[t] !== null && (e[t] = this[t]);
		return e;
	}
}, P = class extends Error {
	constructor(e, t, n) {
		let r = 1, i = "", a = 1;
		for (let e = 0; e < t; ++e) {
			let t = n[e];
			t === "\n" ? (r = 1, i = "", a += 1) : (r += 1, i += t);
		}
		let o = n.indexOf("\n", t);
		i += o === -1 ? n.slice(t) : n.slice(t, o);
		let s = 0;
		i.length > 50 && (r < 40 ? i = i.slice(0, 50) : (s = r - 20, i = i.slice(s, r + 30))), super(`${e} (line ${a}, column ${r})
  ${i}
` + " ".repeat(r - s + 1) + "^\n"), this.column = r, this.excerpt = i, this.line = a, this.name = "XmlError", this.pos = t;
	}
}, F = class extends E {
	constructor(e, t = "") {
		super(), this.name = e, this.content = t;
	}
	get type() {
		return E.TYPE_PROCESSING_INSTRUCTION;
	}
	toJSON() {
		return Object.assign(E.prototype.toJSON.call(this), {
			name: this.name,
			content: this.content
		});
	}
}, I = "", ee = class {
	constructor(e, t = {}) {
		let n = this.document = new M(), r = this.c = new p(e);
		if (this.l = n, this.f = t, this.f.includeOffsets && (n.start = 0, n.end = e.length), r.b("﻿"), this.H(), !this.B()) throw this.a("Root element is missing or invalid");
		for (; this.w(););
		if (!r.z) throw this.a("Extra content at the end of the document");
	}
	j(e, t) {
		return e.parent = this.l, this.f.includeOffsets && (e.start = this.c.i(t), e.end = this.c.i()), this.l.children.push(e), !0;
	}
	x(e, t) {
		let { children: n } = this.l, { length: r } = n;
		if (e = L(e), r > 0) {
			let t = n[r - 1];
			if (t?.type === E.TYPE_TEXT) {
				let n = t;
				return n.text += e, this.f.includeOffsets && (n.end = this.c.i()), !0;
			}
		}
		return this.j(new D(e), t);
	}
	I() {
		let e = /* @__PURE__ */ Object.create(null);
		for (; this.e();) {
			let t = this.r();
			if (!t) break;
			let n = this.u() && this.J();
			if (n === !1) throw this.a("Attribute value expected");
			if (t in e) throw this.a(`Duplicate attribute: ${t}`);
			if (t === "xml:space" && n !== "default" && n !== "preserve") throw this.a("Value of the `xml:space` attribute must be \"default\" or \"preserve\"");
			e[t] = n;
		}
		if (this.f.sortAttributes) {
			let t = Object.keys(e).sort(), n = /* @__PURE__ */ Object.create(null);
			for (let r = 0; r < t.length; ++r) {
				let i = t[r];
				n[i] = e[i];
			}
			e = n;
		}
		return e;
	}
	J() {
		let { c: e } = this, t = e.h();
		if (t !== "\"" && t !== "'") return !1;
		e.g();
		let n, r = !1, i = I, a = t === "\"" ? m : h;
		matchLoop: for (; !e.z;) switch (n = e.G(a), n && (this.p(n), i += n.replace(g, " ")), e.h()) {
			case t:
				r = !0;
				break matchLoop;
			case "&":
				i += this.C();
				continue;
			case "<": throw this.a("Unescaped `<` is not allowed in an attribute value");
			case I: break matchLoop;
		}
		if (!r) throw this.a("Unclosed attribute");
		return e.g(), i;
	}
	K() {
		let { c: e } = this, t = e.d;
		if (!e.b("<![CDATA[")) return !1;
		let n = e.t("]]>");
		if (this.p(n), !e.b("]]>")) throw this.a("Unclosed CDATA section");
		return this.f.preserveCdata ? this.j(new O(L(n)), t) : this.x(n, t);
	}
	L() {
		let { c: e } = this, t = e.d, n = e.A(_);
		if (!n) return !1;
		if (this.p(n), e.h(3) === "]]>") throw this.a("Element content may not contain the CDATA section close delimiter `]]>`");
		return this.x(n, t);
	}
	D() {
		let { c: e } = this, t = e.d;
		if (!e.b("<!--")) return !1;
		let n = e.t("--");
		if (this.p(n), !e.b("-->")) throw e.h(2) === "--" ? this.a("The string `--` isn't allowed inside a comment") : this.a("Unclosed comment");
		return this.f.preserveComments ? this.j(new k(L(n)), t) : !0;
	}
	M() {
		let e = this.c.d, t = this.C();
		return t ? this.x(t, e) : !1;
	}
	N() {
		let { c: e } = this, t = e.d;
		if (!e.b("<!DOCTYPE")) return !1;
		let n = this.e() && this.r();
		if (!n) throw this.a("Expected a name");
		let r, i;
		if (this.e()) {
			if (e.b("PUBLIC")) {
				if (r = this.e() && this.O(), r === !1) throw this.a("Expected a public identifier");
				this.e();
			}
			if (r !== void 0 || e.b("SYSTEM")) {
				if (this.e(), i = this.s(), i === !1) throw this.a("Expected a system identifier");
				this.e();
			}
		}
		let a;
		if (e.b("[")) {
			if (a = e.A(/\][\x20\t\r\n]*>/), !e.b("]")) throw this.a("Unclosed internal subset");
			this.e();
		}
		if (!e.b(">")) throw this.a("Unclosed doctype declaration");
		return this.f.preserveDocumentType ? this.j(new N(n, r, i, a), t) : !0;
	}
	B() {
		let { c: e } = this, t = e.d;
		if (!e.b("<")) return !1;
		let n = this.r();
		if (!n) return e.o(t), !1;
		let r = this.I(), i = !!e.b("/>"), a = new j(n, r);
		if (a.parent = this.l, !i) {
			if (!e.b(">")) throw this.a(`Unclosed start tag for element \`${n}\``);
			this.l = a;
			do
				this.L();
			while (this.B() || this.M() || this.K() || this.E() || this.D());
			let t = e.d, r;
			if (!e.b("</") || !(r = this.r()) || r !== n) throw e.o(t), this.a(`Missing end tag for element ${n}`);
			if (this.e(), !e.b(">")) throw this.a(`Unclosed end tag for element ${n}`);
			this.l = a.parent;
		}
		return this.j(a, t);
	}
	u() {
		return this.e(), this.c.b("=") ? (this.e(), !0) : !1;
	}
	w() {
		return this.D() || this.E() || this.e();
	}
	r() {
		return b(this.c.h()) ? this.c.v(y) : I;
	}
	E() {
		let { c: e } = this, t = e.d;
		if (!e.b("<?")) return !1;
		let n = this.r();
		if (n) {
			if (n.toLowerCase() === "xml") throw e.o(t), this.a("XML declaration isn't allowed here");
		} else throw this.a("Invalid processing instruction");
		if (!this.e()) {
			if (e.b("?>")) return this.j(new F(n), t);
			throw this.a("Whitespace is required after a processing instruction name");
		}
		let r = e.t("?>");
		if (this.p(r), !e.b("?>")) throw this.a("Unterminated processing instruction");
		return this.j(new F(n, L(r)), t);
	}
	H() {
		let { c: e } = this, t = e.d;
		for (this.P(); this.w(););
		if (this.N()) for (; this.w(););
		return t < e.d;
	}
	O() {
		let e = this.c.d, t = this.s();
		if (t !== !1 && !/^[-\x20\r\na-zA-Z0-9'()+,./:=?;!*#@$_%]*$/.test(t)) throw this.c.o(e), this.a("Invalid character in public identifier");
		return t;
	}
	C() {
		let { c: e } = this;
		if (!e.b("&")) return !1;
		let t = e.v(x);
		if (e.F() !== ";") throw this.a("Unterminated reference (a reference must end with `;`)");
		let n;
		if (t[0] === "#") {
			let e = t[1] === "x" ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10);
			if (isNaN(e)) throw this.a("Invalid character reference");
			if (!C(e)) throw this.a("Character reference resolves to an invalid character");
			n = String.fromCodePoint(e);
		} else if (n = v[t], n === void 0) {
			let { ignoreUndefinedEntities: n, resolveUndefinedEntity: r } = this.f, i = `&${t};`;
			if (r) {
				let e = r(i);
				if (e != null) {
					let t = typeof e;
					if (t !== "string") throw TypeError(`\`resolveUndefinedEntity()\` must return a string, \`null\`, or \`undefined\`, but returned a value of type ${t}`);
					return e;
				}
			}
			if (n) return i;
			throw e.o(-i.length), this.a(`Named entity isn't defined: ${i}`);
		}
		return n;
	}
	s() {
		let { c: e } = this, t = e.b("\"") || e.b("'");
		if (!t) return !1;
		let n = e.t(t);
		if (this.p(n), !e.b(t)) throw this.a("Missing end quote");
		return n;
	}
	e() {
		return !!this.c.v(S);
	}
	P() {
		let { c: e } = this, t = e.d;
		if (!e.b("<?xml")) return !1;
		if (!this.e()) throw this.a("Invalid XML declaration");
		let n = !!e.b("version") && this.u() && this.s();
		if (n === !1) throw this.a("XML version is missing or invalid");
		if (!/^1\.[0-9]+$/.test(n)) throw this.a("Invalid character in version number");
		let r, i;
		if (this.e() && (r = !!e.b("encoding") && this.u() && this.s(), r && this.e(), i = !!e.b("standalone") && this.u() && this.s(), i)) {
			if (i !== "yes" && i !== "no") throw this.a("Only \"yes\" and \"no\" are permitted as values of `standalone`");
			this.e();
		}
		if (!e.b("?>")) throw this.a("Invalid or unclosed XML declaration");
		return this.f.preserveXmlDeclaration ? this.j(new A(n, r || void 0, i || void 0), t) : !0;
	}
	a(e) {
		let { c: t } = this;
		return new P(e, t.d, t.m);
	}
	p(e) {
		let { length: t } = e;
		for (let n = 0; n < t; ++n) {
			let t = e.codePointAt(n);
			if (!C(t)) throw this.c.o(-([...e].length - n)), this.a("Invalid character");
			t > 65535 && (n += 1);
		}
	}
};
function L(e) {
	let t = 0;
	for (; (t = e.indexOf("\r", t)) !== -1;) e = e[t + 1] === "\n" ? e.slice(0, t) + e.slice(t + 1) : e.slice(0, t) + "\n" + e.slice(t + 1);
	return e;
}
function te(e, t) {
	return new ee(e, t).document;
}
var ne = class extends Error {
	constructor(e, t, n) {
		super(e), this.httpStatus = t, this.isCrossOriginRelated = n, this.name = "EndpointError";
	}
}, re = class extends Error {
	constructor(e, t, n, r, i) {
		super(e), this.requestUrl = t, this.code = n, this.locator = r, this.response = i, this.name = "ServiceExceptionError";
	}
};
function ie(e) {
	if (e.name === "ServiceExceptionError") {
		let t = new re(e.message, e.requestUrl, e.code, e.locator, e.response);
		return t.stack = e.stack, t;
	}
	if (e.name === "EndpointError") {
		let t = new ne(e.message, e.httpStatus, e.isCrossOriginRelated);
		return t.stack = e.stack, t;
	}
	let t = Error(e.message);
	return t.stack = e.stack, t;
}
var ae = new EventTarget();
function R(e, t, r) {
	return new Promise((i, a) => {
		let o = n(), s = {
			requestId: o,
			taskName: e,
			params: r
		};
		t === null ? ae.dispatchEvent(new CustomEvent("ogc-client.request", { detail: s })) : t.postMessage(s);
		let c = (e) => {
			e.requestId === o && (t === null ? ae.removeEventListener("ogc-client.response", l) : t.removeEventListener("message", u), "error" in e ? a(ie(e.error)) : i(e.response));
		}, l = (e) => c(e.detail), u = (e) => c(e.data);
		t === null ? ae.addEventListener("ogc-client.response", l) : t.addEventListener("message", u);
	});
}
var oe = typeof window < "u" && window.Blob && new Blob([atob("KGZ1bmN0aW9uKCkgewogICJ1c2Ugc3RyaWN0IjsKICAvKiEgQHJncm92ZS9wYXJzZS14bWwgdjQuMS4wIHwgSVNDIExpY2Vuc2UgfCBDb3B5cmlnaHQgUnlhbiBHcm92ZSAqLwogIHZhciBfX2RlZlByb3AgPSBPYmplY3QuZGVmaW5lUHJvcGVydHk7CiAgdmFyIF9fZ2V0T3duUHJvcERlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yOwogIHZhciBfX2dldE93blByb3BOYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzOwogIHZhciBfX2hhc093blByb3AgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5OwogIHZhciBfX2V4cG9ydCA9ICh0YXJnZXQsIGFsbCkgPT4gewogICAgZm9yICh2YXIgbmFtZSBpbiBhbGwpCiAgICAgIF9fZGVmUHJvcCh0YXJnZXQsIG5hbWUsIHsgZ2V0OiBhbGxbbmFtZV0sIGVudW1lcmFibGU6IHRydWUgfSk7CiAgfTsKICB2YXIgX19jb3B5UHJvcHMgPSAodG8sIGZyb20sIGV4Y2VwdCwgZGVzYykgPT4gewogICAgaWYgKGZyb20gJiYgdHlwZW9mIGZyb20gPT09ICJvYmplY3QiIHx8IHR5cGVvZiBmcm9tID09PSAiZnVuY3Rpb24iKSB7CiAgICAgIGZvciAobGV0IGtleSBvZiBfX2dldE93blByb3BOYW1lcyhmcm9tKSkKICAgICAgICBpZiAoIV9faGFzT3duUHJvcC5jYWxsKHRvLCBrZXkpICYmIGtleSAhPT0gZXhjZXB0KQogICAgICAgICAgX19kZWZQcm9wKHRvLCBrZXksIHsgZ2V0OiAoKSA9PiBmcm9tW2tleV0sIGVudW1lcmFibGU6ICEoZGVzYyA9IF9fZ2V0T3duUHJvcERlc2MoZnJvbSwga2V5KSkgfHwgZGVzYy5lbnVtZXJhYmxlIH0pOwogICAgfQogICAgcmV0dXJuIHRvOwogIH07CiAgdmFyIF9fdG9Db21tb25KUyA9IChtb2QpID0+IF9fY29weVByb3BzKF9fZGVmUHJvcCh7fSwgIl9fZXNNb2R1bGUiLCB7IHZhbHVlOiB0cnVlIH0pLCBtb2QpOwogIHZhciBzcmNfZXhwb3J0cyA9IHt9OwogIF9fZXhwb3J0KHNyY19leHBvcnRzLCB7CiAgICBYbWxDZGF0YTogKCkgPT4gWG1sQ2RhdGEsCiAgICBYbWxDb21tZW50OiAoKSA9PiBYbWxDb21tZW50LAogICAgWG1sRGVjbGFyYXRpb246ICgpID0+IFhtbERlY2xhcmF0aW9uLAogICAgWG1sRG9jdW1lbnQ6ICgpID0+IFhtbERvY3VtZW50LAogICAgWG1sRG9jdW1lbnRUeXBlOiAoKSA9PiBYbWxEb2N1bWVudFR5cGUsCiAgICBYbWxFbGVtZW50OiAoKSA9PiBYbWxFbGVtZW50LAogICAgWG1sRXJyb3I6ICgpID0+IFhtbEVycm9yLAogICAgWG1sTm9kZTogKCkgPT4gWG1sTm9kZSwKICAgIFhtbFByb2Nlc3NpbmdJbnN0cnVjdGlvbjogKCkgPT4gWG1sUHJvY2Vzc2luZ0luc3RydWN0aW9uLAogICAgWG1sVGV4dDogKCkgPT4gWG1sVGV4dCwKICAgIHBhcnNlWG1sOiAoKSA9PiBwYXJzZVhtbAogIH0pOwogIHZhciBicm93c2VyID0gX190b0NvbW1vbkpTKHNyY19leHBvcnRzKTsKICB2YXIgZW1wdHlTdHJpbmcgPSAiIjsKICB2YXIgc3Vycm9nYXRlUGFpciA9IC9bXHVEODAwLVx1REJGRl1bXHVEQzAwLVx1REZGRl0vZzsKICB2YXIgU3RyaW5nU2Nhbm5lciA9IGNsYXNzIHsKICAgIGNvbnN0cnVjdG9yKHN0cmluZykgewogICAgICB0aGlzLmsgPSB0aGlzLnEoc3RyaW5nLCB0cnVlKTsKICAgICAgdGhpcy5kID0gMDsKICAgICAgdGhpcy5sZW5ndGggPSBzdHJpbmcubGVuZ3RoOwogICAgICB0aGlzLm4gPSB0aGlzLmsgIT09IHRoaXMubGVuZ3RoOwogICAgICB0aGlzLm0gPSBzdHJpbmc7CiAgICAgIGlmICh0aGlzLm4pIHsKICAgICAgICBsZXQgY2hhcnNUb0J5dGVzID0gW107CiAgICAgICAgZm9yIChsZXQgYnl0ZUluZGV4ID0gMCwgY2hhckluZGV4ID0gMDsgY2hhckluZGV4IDwgdGhpcy5rOyArK2NoYXJJbmRleCkgewogICAgICAgICAgY2hhcnNUb0J5dGVzW2NoYXJJbmRleF0gPSBieXRlSW5kZXg7CiAgICAgICAgICBieXRlSW5kZXggKz0gc3RyaW5nLmNvZGVQb2ludEF0KGJ5dGVJbmRleCkgPiA2NTUzNSA/IDIgOiAxOwogICAgICAgIH0KICAgICAgICB0aGlzLnkgPSBjaGFyc1RvQnl0ZXM7CiAgICAgIH0KICAgIH0KICAgIC8qKgogICAgICogV2hldGhlciB0aGUgY3VycmVudCBjaGFyYWN0ZXIgaW5kZXggaXMgYXQgdGhlIGVuZCBvZiB0aGUgaW5wdXQgc3RyaW5nLgogICAgICovCiAgICBnZXQgeigpIHsKICAgICAgcmV0dXJuIHRoaXMuZCA+PSB0aGlzLms7CiAgICB9CiAgICAvLyAtLSBQcm90ZWN0ZWQgTWV0aG9kcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KICAgIC8qKgogICAgICogUmV0dXJucyB0aGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgaW4gdGhlIGdpdmVuIHN0cmluZywgd2hpY2ggbWF5IGRpZmZlciBmcm9tCiAgICAgKiB0aGUgYnl0ZSBsZW5ndGggaWYgdGhlIHN0cmluZyBjb250YWlucyBtdWx0aWJ5dGUgY2hhcmFjdGVycy4KICAgICAqLwogICAgcShzdHJpbmcsIG11bHRpQnl0ZVNhZmUgPSB0aGlzLm4pIHsKICAgICAgcmV0dXJuIG11bHRpQnl0ZVNhZmUgPyBzdHJpbmcucmVwbGFjZShzdXJyb2dhdGVQYWlyLCAiXyIpLmxlbmd0aCA6IHN0cmluZy5sZW5ndGg7CiAgICB9CiAgICAvLyAtLSBQdWJsaWMgTWV0aG9kcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KICAgIC8qKgogICAgICogQWR2YW5jZXMgdGhlIHNjYW5uZXIgYnkgdGhlIGdpdmVuIG51bWJlciBvZiBjaGFyYWN0ZXJzLCBzdG9wcGluZyBpZiB0aGUgZW5kCiAgICAgKiBvZiB0aGUgc3RyaW5nIGlzIHJlYWNoZWQuCiAgICAgKi8KICAgIGcoY291bnQgPSAxKSB7CiAgICAgIHRoaXMuZCA9IE1hdGgubWluKHRoaXMuaywgdGhpcy5kICsgY291bnQpOwogICAgfQogICAgLyoqCiAgICAgKiBSZXR1cm5zIHRoZSBieXRlIGluZGV4IG9mIHRoZSBnaXZlbiBjaGFyYWN0ZXIgaW5kZXggaW4gdGhlIHN0cmluZy4gVGhlIHR3bwogICAgICogbWF5IGRpZmZlciBpbiBzdHJpbmdzIHRoYXQgY29udGFpbiBtdWx0aWJ5dGUgY2hhcmFjdGVycy4KICAgICAqLwogICAgaShjaGFySW5kZXggPSB0aGlzLmQpIHsKICAgICAgdmFyIF9hOwogICAgICByZXR1cm4gdGhpcy5uID8gKF9hID0gdGhpcy55W2NoYXJJbmRleF0pICE9IG51bGwgPyBfYSA6IEluZmluaXR5IDogY2hhckluZGV4OwogICAgfQogICAgLyoqCiAgICAgKiBDb25zdW1lcyBhbmQgcmV0dXJucyB0aGUgZ2l2ZW4gbnVtYmVyIG9mIGNoYXJhY3RlcnMgaWYgcG9zc2libGUsIGFkdmFuY2luZwogICAgICogdGhlIHNjYW5uZXIgYW5kIHN0b3BwaW5nIGlmIHRoZSBlbmQgb2YgdGhlIHN0cmluZyBpcyByZWFjaGVkLgogICAgICoKICAgICAqIElmIG5vIGNoYXJhY3RlcnMgY291bGQgYmUgY29uc3VtZWQsIGFuIGVtcHR5IHN0cmluZyB3aWxsIGJlIHJldHVybmVkLgogICAgICovCiAgICBGKGNvdW50ID0gMSkgewogICAgICBsZXQgY2hhcnMgPSB0aGlzLmgoY291bnQpOwogICAgICB0aGlzLmcoY291bnQpOwogICAgICByZXR1cm4gY2hhcnM7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGEgbWF0Y2ggZm9yIHRoZSBnaXZlbiBzdGlja3kgcmVnZXgsIGFkdmFuY2VzIHRoZSBzY2FubmVyLCB1cGRhdGVzCiAgICAgKiB0aGUgYGxhc3RJbmRleGAgcHJvcGVydHkgb2YgdGhlIHJlZ2V4LCBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgc3RyaW5nLgogICAgICoKICAgICAqIFRoZSByZWdleCBtdXN0IGhhdmUgYSBzdGlja3kgZmxhZyAoInkiKSBzbyB0aGF0IGl0cyBgbGFzdEluZGV4YCBwcm9wIGNhbiBiZQogICAgICogdXNlZCB0byBhbmNob3IgdGhlIG1hdGNoIGF0IHRoZSBjdXJyZW50IHNjYW5uZXIgcG9zaXRpb24uCiAgICAgKgogICAgICogUmV0dXJucyB0aGUgY29uc3VtZWQgc3RyaW5nLCBvciBhbiBlbXB0eSBzdHJpbmcgaWYgbm90aGluZyB3YXMgY29uc3VtZWQuCiAgICAgKi8KICAgIEcocmVnZXgpIHsKICAgICAgaWYgKCFyZWdleC5zdGlja3kpIHsKICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ByZWdleGAgbXVzdCBoYXZlIGEgc3RpY2t5IGZsYWcgKCJ5IiknKTsKICAgICAgfQogICAgICByZWdleC5sYXN0SW5kZXggPSB0aGlzLmkoKTsKICAgICAgbGV0IHJlc3VsdCA9IHJlZ2V4LmV4ZWModGhpcy5tKTsKICAgICAgaWYgKHJlc3VsdCA9PT0gbnVsbCB8fCByZXN1bHQubGVuZ3RoID09PSAwKSB7CiAgICAgICAgcmV0dXJuIGVtcHR5U3RyaW5nOwogICAgICB9CiAgICAgIGxldCBtYXRjaCA9IHJlc3VsdFswXTsKICAgICAgdGhpcy5nKHRoaXMucShtYXRjaCkpOwogICAgICByZXR1cm4gbWF0Y2g7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGFuZCByZXR1cm5zIGFsbCBjaGFyYWN0ZXJzIGZvciB3aGljaCB0aGUgZ2l2ZW4gZnVuY3Rpb24gcmV0dXJucyBhCiAgICAgKiB0cnV0aHkgdmFsdWUsIHN0b3BwaW5nIG9uIHRoZSBmaXJzdCBmYWxzeSByZXR1cm4gdmFsdWUgb3IgaWYgdGhlIGVuZCBvZiB0aGUKICAgICAqIGlucHV0IGlzIHJlYWNoZWQuCiAgICAgKi8KICAgIHYoZm4pIHsKICAgICAgbGV0IGNoYXI7CiAgICAgIGxldCBtYXRjaCA9IGVtcHR5U3RyaW5nOwogICAgICB3aGlsZSAoKGNoYXIgPSB0aGlzLmgoKSkgJiYgZm4oY2hhcikpIHsKICAgICAgICBtYXRjaCArPSBjaGFyOwogICAgICAgIHRoaXMuZygpOwogICAgICB9CiAgICAgIHJldHVybiBtYXRjaDsKICAgIH0KICAgIC8qKgogICAgICogQ29uc3VtZXMgdGhlIGdpdmVuIHN0cmluZyBpZiBpdCBleGlzdHMgYXQgdGhlIGN1cnJlbnQgY2hhcmFjdGVyIGluZGV4LCBhbmQKICAgICAqIGFkdmFuY2VzIHRoZSBzY2FubmVyLgogICAgICoKICAgICAqIElmIHRoZSBnaXZlbiBzdHJpbmcgZG9lc24ndCBleGlzdCBhdCB0aGUgY3VycmVudCBjaGFyYWN0ZXIgaW5kZXgsIGFuIGVtcHR5CiAgICAgKiBzdHJpbmcgd2lsbCBiZSByZXR1cm5lZCBhbmQgdGhlIHNjYW5uZXIgd2lsbCBub3QgYmUgYWR2YW5jZWQuCiAgICAgKi8KICAgIFEoc3RyaW5nVG9Db25zdW1lKSB7CiAgICAgIGlmICh0aGlzLmIoc3RyaW5nVG9Db25zdW1lKSkgewogICAgICAgIHJldHVybiBzdHJpbmdUb0NvbnN1bWU7CiAgICAgIH0KICAgICAgaWYgKHRoaXMubikgewogICAgICAgIGxldCB7IGxlbmd0aCB9ID0gc3RyaW5nVG9Db25zdW1lOwogICAgICAgIGxldCBjaGFyTGVuZ3RoVG9NYXRjaCA9IHRoaXMucShzdHJpbmdUb0NvbnN1bWUpOwogICAgICAgIGlmIChjaGFyTGVuZ3RoVG9NYXRjaCAhPT0gbGVuZ3RoICYmIHN0cmluZ1RvQ29uc3VtZSA9PT0gdGhpcy5oKGNoYXJMZW5ndGhUb01hdGNoKSkgewogICAgICAgICAgdGhpcy5nKGNoYXJMZW5ndGhUb01hdGNoKTsKICAgICAgICAgIHJldHVybiBzdHJpbmdUb0NvbnN1bWU7CiAgICAgICAgfQogICAgICB9CiAgICAgIHJldHVybiBlbXB0eVN0cmluZzsKICAgIH0KICAgIC8qKgogICAgICogRG9lcyB0aGUgc2FtZSB0aGluZyBhcyBgY29uc3VtZVN0cmluZygpYCwgYnV0IGRvZXNuJ3Qgc3VwcG9ydCBjb25zdW1pbmcKICAgICAqIG11bHRpYnl0ZSBjaGFyYWN0ZXJzLiBUaGlzIGNhbiBiZSBmYXN0ZXIgaWYgeW91IG9ubHkgbmVlZCB0byBtYXRjaCBzaW5nbGUKICAgICAqIGJ5dGUgY2hhcmFjdGVycy4KICAgICAqLwogICAgYihzdHJpbmdUb0NvbnN1bWUpIHsKICAgICAgbGV0IHsgbGVuZ3RoIH0gPSBzdHJpbmdUb0NvbnN1bWU7CiAgICAgIGlmICh0aGlzLmgobGVuZ3RoKSA9PT0gc3RyaW5nVG9Db25zdW1lKSB7CiAgICAgICAgdGhpcy5nKGxlbmd0aCk7CiAgICAgICAgcmV0dXJuIHN0cmluZ1RvQ29uc3VtZTsKICAgICAgfQogICAgICByZXR1cm4gZW1wdHlTdHJpbmc7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGNoYXJhY3RlcnMgdW50aWwgdGhlIGdpdmVuIGdsb2JhbCByZWdleCBpcyBtYXRjaGVkLCBhZHZhbmNpbmcgdGhlCiAgICAgKiBzY2FubmVyIHVwIHRvIChidXQgbm90IGJleW9uZCkgdGhlIGJlZ2lubmluZyBvZiB0aGUgbWF0Y2guIElmIHRoZSByZWdleAogICAgICogZG9lc24ndCBtYXRjaCwgbm90aGluZyB3aWxsIGJlIGNvbnN1bWVkLgogICAgICoKICAgICAqIFJldHVybnMgdGhlIGNvbnN1bWVkIHN0cmluZywgb3IgYW4gZW1wdHkgc3RyaW5nIGlmIG5vdGhpbmcgd2FzIGNvbnN1bWVkLgogICAgICovCiAgICBBKHJlZ2V4KSB7CiAgICAgIGxldCByZXN0T2ZTdHJpbmcgPSB0aGlzLm0uc2xpY2UodGhpcy5pKCkpOwogICAgICBsZXQgbWF0Y2hCeXRlSW5kZXggPSByZXN0T2ZTdHJpbmcuc2VhcmNoKHJlZ2V4KTsKICAgICAgaWYgKG1hdGNoQnl0ZUluZGV4IDw9IDApIHsKICAgICAgICByZXR1cm4gZW1wdHlTdHJpbmc7CiAgICAgIH0KICAgICAgbGV0IHJlc3VsdCA9IHJlc3RPZlN0cmluZy5zbGljZSgwLCBtYXRjaEJ5dGVJbmRleCk7CiAgICAgIHRoaXMuZyh0aGlzLnEocmVzdWx0KSk7CiAgICAgIHJldHVybiByZXN1bHQ7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGNoYXJhY3RlcnMgdW50aWwgdGhlIGdpdmVuIHN0cmluZyBpcyBmb3VuZCwgYWR2YW5jaW5nIHRoZSBzY2FubmVyCiAgICAgKiB1cCB0byAoYnV0IG5vdCBiZXlvbmQpIHRoYXQgcG9pbnQuIElmIHRoZSBzdHJpbmcgaXMgbmV2ZXIgZm91bmQsIG5vdGhpbmcKICAgICAqIHdpbGwgYmUgY29uc3VtZWQuCiAgICAgKgogICAgICogUmV0dXJucyB0aGUgY29uc3VtZWQgc3RyaW5nLCBvciBhbiBlbXB0eSBzdHJpbmcgaWYgbm90aGluZyB3YXMgY29uc3VtZWQuCiAgICAgKi8KICAgIHQoc2VhcmNoU3RyaW5nKSB7CiAgICAgIGxldCB7IG06IHN0cmluZyB9ID0gdGhpczsKICAgICAgbGV0IGJ5dGVJbmRleCA9IHRoaXMuaSgpOwogICAgICBsZXQgbWF0Y2hCeXRlSW5kZXggPSBzdHJpbmcuaW5kZXhPZihzZWFyY2hTdHJpbmcsIGJ5dGVJbmRleCk7CiAgICAgIGlmIChtYXRjaEJ5dGVJbmRleCA8PSAwKSB7CiAgICAgICAgcmV0dXJuIGVtcHR5U3RyaW5nOwogICAgICB9CiAgICAgIGxldCByZXN1bHQgPSBzdHJpbmcuc2xpY2UoYnl0ZUluZGV4LCBtYXRjaEJ5dGVJbmRleCk7CiAgICAgIHRoaXMuZyh0aGlzLnEocmVzdWx0KSk7CiAgICAgIHJldHVybiByZXN1bHQ7CiAgICB9CiAgICAvKioKICAgICAqIFJldHVybnMgdGhlIGdpdmVuIG51bWJlciBvZiBjaGFyYWN0ZXJzIHN0YXJ0aW5nIGF0IHRoZSBjdXJyZW50IGNoYXJhY3RlcgogICAgICogaW5kZXgsIHdpdGhvdXQgYWR2YW5jaW5nIHRoZSBzY2FubmVyIGFuZCB3aXRob3V0IGV4Y2VlZGluZyB0aGUgZW5kIG9mIHRoZQogICAgICogaW5wdXQgc3RyaW5nLgogICAgICovCiAgICBoKGNvdW50ID0gMSkgewogICAgICBsZXQgeyBkOiBjaGFySW5kZXgsIG46IG11bHRpQnl0ZU1vZGUsIG06IHN0cmluZyB9ID0gdGhpczsKICAgICAgaWYgKG11bHRpQnl0ZU1vZGUpIHsKICAgICAgICBpZiAoY2hhckluZGV4ID49IHRoaXMuaykgewogICAgICAgICAgcmV0dXJuIGVtcHR5U3RyaW5nOwogICAgICAgIH0KICAgICAgICByZXR1cm4gc3RyaW5nLnNsaWNlKAogICAgICAgICAgdGhpcy5pKGNoYXJJbmRleCksCiAgICAgICAgICB0aGlzLmkoY2hhckluZGV4ICsgY291bnQpCiAgICAgICAgKTsKICAgICAgfQogICAgICByZXR1cm4gc3RyaW5nLnNsaWNlKGNoYXJJbmRleCwgY2hhckluZGV4ICsgY291bnQpOwogICAgfQogICAgLyoqCiAgICAgKiBSZXNldHMgdGhlIHNjYW5uZXIgcG9zaXRpb24gdG8gdGhlIGdpdmVuIGNoYXJhY3RlciBfaW5kZXhfLCBvciB0byB0aGUgc3RhcnQKICAgICAqIG9mIHRoZSBpbnB1dCBzdHJpbmcgaWYgbm8gaW5kZXggaXMgZ2l2ZW4uCiAgICAgKgogICAgICogSWYgX2luZGV4XyBpcyBuZWdhdGl2ZSwgdGhlIHNjYW5uZXIgcG9zaXRpb24gd2lsbCBiZSBtb3ZlZCBiYWNrd2FyZCBieSB0aGF0CiAgICAgKiBtYW55IGNoYXJhY3RlcnMsIHN0b3BwaW5nIGlmIHRoZSBiZWdpbm5pbmcgb2YgdGhlIHN0cmluZyBpcyByZWFjaGVkLgogICAgICovCiAgICBvKGluZGV4ID0gMCkgewogICAgICB0aGlzLmQgPSBpbmRleCA+PSAwID8gTWF0aC5taW4odGhpcy5rLCBpbmRleCkgOiBNYXRoLm1heCgwLCB0aGlzLmQgKyBpbmRleCk7CiAgICB9CiAgfTsKICB2YXIgYXR0VmFsdWVDaGFyRG91YmxlUXVvdGUgPSAvW14iJjxdKy95OwogIHZhciBhdHRWYWx1ZUNoYXJTaW5nbGVRdW90ZSA9IC9bXicmPF0rL3k7CiAgdmFyIGF0dFZhbHVlTm9ybWFsaXplZFdoaXRlc3BhY2UgPSAvXHJcbnxbXG5cclx0XS9nOwogIHZhciBlbmRDaGFyRGF0YSA9IC88fCZ8XV0+LzsKICB2YXIgcHJlZGVmaW5lZEVudGl0aWVzID0gT2JqZWN0LmZyZWV6ZShPYmplY3QuYXNzaWduKC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpLCB7CiAgICBhbXA6ICImIiwKICAgIGFwb3M6ICInIiwKICAgIGd0OiAiPiIsCiAgICBsdDogIjwiLAogICAgcXVvdDogJyInCiAgfSkpOwogIGZ1bmN0aW9uIGlzTmFtZUNoYXIoY2hhcikgewogICAgbGV0IGNwID0gZ2V0Q29kZVBvaW50KGNoYXIpOwogICAgcmV0dXJuIGNwID49IDk3ICYmIGNwIDw9IDEyMiB8fCBjcCA+PSA2NSAmJiBjcCA8PSA5MCB8fCBjcCA+PSA0OCAmJiBjcCA8PSA1NyB8fCBjcCA9PT0gNDUgfHwgY3AgPT09IDQ2IHx8IGNwID09PSAxODMgfHwgY3AgPj0gNzY4ICYmIGNwIDw9IDg3OSB8fCBjcCA+PSA4MjU1ICYmIGNwIDw9IDgyNTYgfHwgaXNOYW1lU3RhcnRDaGFyKGNoYXIsIGNwKTsKICB9CiAgZnVuY3Rpb24gaXNOYW1lU3RhcnRDaGFyKGNoYXIsIGNwID0gZ2V0Q29kZVBvaW50KGNoYXIpKSB7CiAgICByZXR1cm4gY3AgPj0gOTcgJiYgY3AgPD0gMTIyIHx8IGNwID49IDY1ICYmIGNwIDw9IDkwIHx8IGNwID09PSA1OCB8fCBjcCA9PT0gOTUgfHwgY3AgPj0gMTkyICYmIGNwIDw9IDIxNCB8fCBjcCA+PSAyMTYgJiYgY3AgPD0gMjQ2IHx8IGNwID49IDI0OCAmJiBjcCA8PSA3NjcgfHwgY3AgPj0gODgwICYmIGNwIDw9IDg5MyB8fCBjcCA+PSA4OTUgJiYgY3AgPD0gODE5MSB8fCBjcCA+PSA4MjA0ICYmIGNwIDw9IDgyMDUgfHwgY3AgPj0gODMwNCAmJiBjcCA8PSA4NTkxIHx8IGNwID49IDExMjY0ICYmIGNwIDw9IDEyMjcxIHx8IGNwID49IDEyMjg5ICYmIGNwIDw9IDU1Mjk1IHx8IGNwID49IDYzNzQ0ICYmIGNwIDw9IDY0OTc1IHx8IGNwID49IDY1MDA4ICYmIGNwIDw9IDY1NTMzIHx8IGNwID49IDY1NTM2ICYmIGNwIDw9IDk4MzAzOTsKICB9CiAgZnVuY3Rpb24gaXNSZWZlcmVuY2VDaGFyKGNoYXIpIHsKICAgIHJldHVybiBjaGFyID09PSAiIyIgfHwgaXNOYW1lQ2hhcihjaGFyKTsKICB9CiAgZnVuY3Rpb24gaXNXaGl0ZXNwYWNlKGNoYXIpIHsKICAgIGxldCBjcCA9IGdldENvZGVQb2ludChjaGFyKTsKICAgIHJldHVybiBjcCA9PT0gMzIgfHwgY3AgPT09IDkgfHwgY3AgPT09IDEwIHx8IGNwID09PSAxMzsKICB9CiAgZnVuY3Rpb24gaXNYbWxDb2RlUG9pbnQoY3ApIHsKICAgIHJldHVybiBjcCA9PT0gOSB8fCBjcCA9PT0gMTAgfHwgY3AgPT09IDEzIHx8IGNwID49IDMyICYmIGNwIDw9IDU1Mjk1IHx8IGNwID49IDU3MzQ0ICYmIGNwIDw9IDY1NTMzIHx8IGNwID49IDY1NTM2ICYmIGNwIDw9IDExMTQxMTE7CiAgfQogIGZ1bmN0aW9uIGdldENvZGVQb2ludChjaGFyKSB7CiAgICByZXR1cm4gY2hhci5jb2RlUG9pbnRBdCgwKSB8fCAtMTsKICB9CiAgdmFyIF9YbWxOb2RlID0gY2xhc3MgewogICAgY29uc3RydWN0b3IoKSB7CiAgICAgIHRoaXMucGFyZW50ID0gbnVsbDsKICAgICAgdGhpcy5zdGFydCA9IC0xOwogICAgICB0aGlzLmVuZCA9IC0xOwogICAgfQogICAgLyoqCiAgICAgKiBEb2N1bWVudCB0aGF0IGNvbnRhaW5zIHRoaXMgbm9kZSwgb3IgYG51bGxgIGlmIHRoaXMgbm9kZSBpcyBub3QgYXNzb2NpYXRlZAogICAgICogd2l0aCBhIGRvY3VtZW50LgogICAgICovCiAgICBnZXQgZG9jdW1lbnQoKSB7CiAgICAgIHZhciBfYSwgX2I7CiAgICAgIHJldHVybiAoX2IgPSAoX2EgPSB0aGlzLnBhcmVudCkgPT0gbnVsbCA/IHZvaWQgMCA6IF9hLmRvY3VtZW50KSAhPSBudWxsID8gX2IgOiBudWxsOwogICAgfQogICAgLyoqCiAgICAgKiBXaGV0aGVyIHRoaXMgbm9kZSBpcyB0aGUgcm9vdCBub2RlIG9mIHRoZSBkb2N1bWVudCAoYWxzbyBrbm93biBhcyB0aGUKICAgICAqIGRvY3VtZW50IGVsZW1lbnQpLgogICAgICovCiAgICBnZXQgaXNSb290Tm9kZSgpIHsKICAgICAgcmV0dXJuIHRoaXMucGFyZW50ICE9PSBudWxsICYmIHRoaXMucGFyZW50ID09PSB0aGlzLmRvY3VtZW50ICYmIHRoaXMudHlwZSA9PT0gX1htbE5vZGUuVFlQRV9FTEVNRU5UOwogICAgfQogICAgLyoqCiAgICAgKiBXaGV0aGVyIHdoaXRlc3BhY2Ugc2hvdWxkIGJlIHByZXNlcnZlZCBpbiB0aGUgY29udGVudCBvZiB0aGlzIGVsZW1lbnQgYW5kCiAgICAgKiBpdHMgY2hpbGRyZW4uCiAgICAgKgogICAgICogVGhpcyBpcyBpbmZsdWVuY2VkIGJ5IHRoZSB2YWx1ZSBvZiB0aGUgc3BlY2lhbCBgeG1sOnNwYWNlYCBhdHRyaWJ1dGUsIGFuZAogICAgICogd2lsbCBiZSBgdHJ1ZWAgZm9yIGFueSBub2RlIHdob3NlIGB4bWw6c3BhY2VgIGF0dHJpYnV0ZSBpcyBzZXQgdG8KICAgICAqICJwcmVzZXJ2ZSIuIElmIGEgbm9kZSBoYXMgbm8gc3VjaCBhdHRyaWJ1dGUsIGl0IHdpbGwgaW5oZXJpdCB0aGUgdmFsdWUgb2YKICAgICAqIHRoZSBuZWFyZXN0IGFuY2VzdG9yIHRoYXQgZG9lcyAoaWYgYW55KS4KICAgICAqCiAgICAgKiBAc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy14bWwtMjAwODExMjYvI3NlYy13aGl0ZS1zcGFjZQogICAgICovCiAgICBnZXQgcHJlc2VydmVXaGl0ZXNwYWNlKCkgewogICAgICB2YXIgX2E7CiAgICAgIHJldHVybiAhISgoX2EgPSB0aGlzLnBhcmVudCkgPT0gbnVsbCA/IHZvaWQgMCA6IF9hLnByZXNlcnZlV2hpdGVzcGFjZSk7CiAgICB9CiAgICAvKioKICAgICAqIFR5cGUgb2YgdGhpcyBub2RlLgogICAgICoKICAgICAqIFRoZSB2YWx1ZSBvZiB0aGlzIHByb3BlcnR5IGlzIGEgc3RyaW5nIHRoYXQgbWF0Y2hlcyBvbmUgb2YgdGhlIHN0YXRpYwogICAgICogYFRZUEVfKmAgcHJvcGVydGllcyBvbiB0aGUgYFhtbE5vZGVgIGNsYXNzIChlLmcuIGBUWVBFX0VMRU1FTlRgLAogICAgICogYFRZUEVfVEVYVGAsIGV0Yy4pLgogICAgICoKICAgICAqIFRoZSBgWG1sTm9kZWAgY2xhc3MgaXRzZWxmIGlzIGEgYmFzZSBjbGFzcyBhbmQgZG9lc24ndCBoYXZlIGl0cyBvd24gdHlwZQogICAgICogbmFtZS4KICAgICAqLwogICAgZ2V0IHR5cGUoKSB7CiAgICAgIHJldHVybiAiIjsKICAgIH0KICAgIC8qKgogICAgICogUmV0dXJucyBhIEpTT04tc2VyaWFsaXphYmxlIG9iamVjdCByZXByZXNlbnRpbmcgdGhpcyBub2RlLCBtaW51cyBwcm9wZXJ0aWVzCiAgICAgKiB0aGF0IGNvdWxkIHJlc3VsdCBpbiBjaXJjdWxhciByZWZlcmVuY2VzLgogICAgICovCiAgICB0b0pTT04oKSB7CiAgICAgIGxldCBqc29uID0gewogICAgICAgIHR5cGU6IHRoaXMudHlwZQogICAgICB9OwogICAgICBpZiAodGhpcy5pc1Jvb3ROb2RlKSB7CiAgICAgICAganNvbi5pc1Jvb3ROb2RlID0gdHJ1ZTsKICAgICAgfQogICAgICBpZiAodGhpcy5wcmVzZXJ2ZVdoaXRlc3BhY2UpIHsKICAgICAgICBqc29uLnByZXNlcnZlV2hpdGVzcGFjZSA9IHRydWU7CiAgICAgIH0KICAgICAgaWYgKHRoaXMuc3RhcnQgIT09IC0xKSB7CiAgICAgICAganNvbi5zdGFydCA9IHRoaXMuc3RhcnQ7CiAgICAgICAganNvbi5lbmQgPSB0aGlzLmVuZDsKICAgICAgfQogICAgICByZXR1cm4ganNvbjsKICAgIH0KICB9OwogIHZhciBYbWxOb2RlID0gX1htbE5vZGU7CiAgWG1sTm9kZS5UWVBFX0NEQVRBID0gImNkYXRhIjsKICBYbWxOb2RlLlRZUEVfQ09NTUVOVCA9ICJjb21tZW50IjsKICBYbWxOb2RlLlRZUEVfRE9DVU1FTlQgPSAiZG9jdW1lbnQiOwogIFhtbE5vZGUuVFlQRV9ET0NVTUVOVF9UWVBFID0gImRvY3R5cGUiOwogIFhtbE5vZGUuVFlQRV9FTEVNRU5UID0gImVsZW1lbnQiOwogIFhtbE5vZGUuVFlQRV9QUk9DRVNTSU5HX0lOU1RSVUNUSU9OID0gInBpIjsKICBYbWxOb2RlLlRZUEVfVEVYVCA9ICJ0ZXh0IjsKICBYbWxOb2RlLlRZUEVfWE1MX0RFQ0xBUkFUSU9OID0gInhtbGRlY2wiOwogIHZhciBYbWxUZXh0ID0gY2xhc3MgZXh0ZW5kcyBYbWxOb2RlIHsKICAgIGNvbnN0cnVjdG9yKHRleHQgPSAiIikgewogICAgICBzdXBlcigpOwogICAgICB0aGlzLnRleHQgPSB0ZXh0OwogICAgfQogICAgZ2V0IHR5cGUoKSB7CiAgICAgIHJldHVybiBYbWxOb2RlLlRZUEVfVEVYVDsKICAgIH0KICAgIHRvSlNPTigpIHsKICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oWG1sTm9kZS5wcm90b3R5cGUudG9KU09OLmNhbGwodGhpcyksIHsKICAgICAgICB0ZXh0OiB0aGlzLnRleHQKICAgICAgfSk7CiAgICB9CiAgfTsKICB2YXIgWG1sQ2RhdGEgPSBjbGFzcyBleHRlbmRzIFhtbFRleHQgewogICAgZ2V0IHR5cGUoKSB7CiAgICAgIHJldHVybiBYbWxOb2RlLlRZUEVfQ0RBVEE7CiAgICB9CiAgfTsKICB2YXIgWG1sQ29tbWVudCA9IGNsYXNzIGV4dGVuZHMgWG1sTm9kZSB7CiAgICBjb25zdHJ1Y3Rvcihjb250ZW50ID0gIiIpIHsKICAgICAgc3VwZXIoKTsKICAgICAgdGhpcy5jb250ZW50ID0gY29udGVudDsKICAgIH0KICAgIGdldCB0eXBlKCkgewogICAgICByZXR1cm4gWG1sTm9kZS5UWVBFX0NPTU1FTlQ7CiAgICB9CiAgICB0b0pTT04oKSB7CiAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKFhtbE5vZGUucHJvdG90eXBlLnRvSlNPTi5jYWxsKHRoaXMpLCB7CiAgICAgICAgY29udGVudDogdGhpcy5jb250ZW50CiAgICAgIH0pOwogICAgfQogIH07CiAgdmFyIFhtbERlY2xhcmF0aW9uID0gY2xhc3MgZXh0ZW5kcyBYbWxOb2RlIHsKICAgIGNvbnN0cnVjdG9yKHZlcnNpb24sIGVuY29kaW5nLCBzdGFuZGFsb25lKSB7CiAgICAgIHN1cGVyKCk7CiAgICAgIHRoaXMudmVyc2lvbiA9IHZlcnNpb247CiAgICAgIHRoaXMuZW5jb2RpbmcgPSBlbmNvZGluZyAhPSBudWxsID8gZW5jb2RpbmcgOiBudWxsOwogICAgICB0aGlzLnN0YW5kYWxvbmUgPSBzdGFuZGFsb25lICE9IG51bGwgPyBzdGFuZGFsb25lIDogbnVsbDsKICAgIH0KICAgIGdldCB0eXBlKCkgewogICAgICByZXR1cm4gWG1sTm9kZS5UWVBFX1hNTF9ERUNMQVJBVElPTjsKICAgIH0KICAgIHRvSlNPTigpIHsKICAgICAgbGV0IGpzb24gPSBYbWxOb2RlLnByb3RvdHlwZS50b0pTT04uY2FsbCh0aGlzKTsKICAgICAganNvbi52ZXJzaW9uID0gdGhpcy52ZXJzaW9uOwogICAgICBmb3IgKGxldCBrZXkgb2YgWyJlbmNvZGluZyIsICJzdGFuZGFsb25lIl0pIHsKICAgICAgICBpZiAodGhpc1trZXldICE9PSBudWxsKSB7CiAgICAgICAgICBqc29uW2tleV0gPSB0aGlzW2tleV07CiAgICAgICAgfQogICAgICB9CiAgICAgIHJldHVybiBqc29uOwogICAgfQogIH07CiAgdmFyIFhtbEVsZW1lbnQgPSBjbGFzcyBleHRlbmRzIFhtbE5vZGUgewogICAgY29uc3RydWN0b3IobmFtZSwgYXR0cmlidXRlcyA9IC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpLCBjaGlsZHJlbiA9IFtdKSB7CiAgICAgIHN1cGVyKCk7CiAgICAgIHRoaXMubmFtZSA9IG5hbWU7CiAgICAgIHRoaXMuYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXM7CiAgICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjsKICAgIH0KICAgIC8qKgogICAgICogV2hldGhlciB0aGlzIGVsZW1lbnQgaXMgZW1wdHkgKG1lYW5pbmcgaXQgaGFzIG5vIGNoaWxkcmVuKS4KICAgICAqLwogICAgZ2V0IGlzRW1wdHkoKSB7CiAgICAgIHJldHVybiB0aGlzLmNoaWxkcmVuLmxlbmd0aCA9PT0gMDsKICAgIH0KICAgIGdldCBwcmVzZXJ2ZVdoaXRlc3BhY2UoKSB7CiAgICAgIGxldCBub2RlID0gdGhpczsKICAgICAgd2hpbGUgKG5vZGUgaW5zdGFuY2VvZiBYbWxFbGVtZW50KSB7CiAgICAgICAgaWYgKCJ4bWw6c3BhY2UiIGluIG5vZGUuYXR0cmlidXRlcykgewogICAgICAgICAgcmV0dXJuIG5vZGUuYXR0cmlidXRlc1sieG1sOnNwYWNlIl0gPT09ICJwcmVzZXJ2ZSI7CiAgICAgICAgfQogICAgICAgIG5vZGUgPSBub2RlLnBhcmVudDsKICAgICAgfQogICAgICByZXR1cm4gZmFsc2U7CiAgICB9CiAgICAvKioKICAgICAqIFRleHQgY29udGVudCBvZiB0aGlzIGVsZW1lbnQgYW5kIGFsbCBpdHMgZGVzY2VuZGFudHMuCiAgICAgKi8KICAgIGdldCB0ZXh0KCkgewogICAgICByZXR1cm4gdGhpcy5jaGlsZHJlbi5tYXAoKGNoaWxkKSA9PiAidGV4dCIgaW4gY2hpbGQgPyBjaGlsZC50ZXh0IDogIiIpLmpvaW4oIiIpOwogICAgfQogICAgZ2V0IHR5cGUoKSB7CiAgICAgIHJldHVybiBYbWxOb2RlLlRZUEVfRUxFTUVOVDsKICAgIH0KICAgIHRvSlNPTigpIHsKICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oWG1sTm9kZS5wcm90b3R5cGUudG9KU09OLmNhbGwodGhpcyksIHsKICAgICAgICBuYW1lOiB0aGlzLm5hbWUsCiAgICAgICAgYXR0cmlidXRlczogdGhpcy5hdHRyaWJ1dGVzLAogICAgICAgIGNoaWxkcmVuOiB0aGlzLmNoaWxkcmVuLm1hcCgoY2hpbGQpID0+IGNoaWxkLnRvSlNPTigpKQogICAgICB9KTsKICAgIH0KICB9OwogIHZhciBYbWxEb2N1bWVudCA9IGNsYXNzIGV4dGVuZHMgWG1sTm9kZSB7CiAgICBjb25zdHJ1Y3RvcihjaGlsZHJlbiA9IFtdKSB7CiAgICAgIHN1cGVyKCk7CiAgICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjsKICAgIH0KICAgIGdldCBkb2N1bWVudCgpIHsKICAgICAgcmV0dXJuIHRoaXM7CiAgICB9CiAgICAvKioKICAgICAqIFJvb3QgZWxlbWVudCBvZiB0aGlzIGRvY3VtZW50LCBvciBgbnVsbGAgaWYgdGhpcyBkb2N1bWVudCBpcyBlbXB0eS4KICAgICAqLwogICAgZ2V0IHJvb3QoKSB7CiAgICAgIGZvciAobGV0IGNoaWxkIG9mIHRoaXMuY2hpbGRyZW4pIHsKICAgICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBYbWxFbGVtZW50KSB7CiAgICAgICAgICByZXR1cm4gY2hpbGQ7CiAgICAgICAgfQogICAgICB9CiAgICAgIHJldHVybiBudWxsOwogICAgfQogICAgLyoqCiAgICAgKiBUZXh0IGNvbnRlbnQgb2YgdGhpcyBkb2N1bWVudCBhbmQgYWxsIGl0cyBkZXNjZW5kYW50cy4KICAgICAqLwogICAgZ2V0IHRleHQoKSB7CiAgICAgIHJldHVybiB0aGlzLmNoaWxkcmVuLm1hcCgoY2hpbGQpID0+ICJ0ZXh0IiBpbiBjaGlsZCA/IGNoaWxkLnRleHQgOiAiIikuam9pbigiIik7CiAgICB9CiAgICBnZXQgdHlwZSgpIHsKICAgICAgcmV0dXJuIFhtbE5vZGUuVFlQRV9ET0NVTUVOVDsKICAgIH0KICAgIHRvSlNPTigpIHsKICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oWG1sTm9kZS5wcm90b3R5cGUudG9KU09OLmNhbGwodGhpcyksIHsKICAgICAgICBjaGlsZHJlbjogdGhpcy5jaGlsZHJlbi5tYXAoKGNoaWxkKSA9PiBjaGlsZC50b0pTT04oKSkKICAgICAgfSk7CiAgICB9CiAgfTsKICB2YXIgWG1sRG9jdW1lbnRUeXBlID0gY2xhc3MgZXh0ZW5kcyBYbWxOb2RlIHsKICAgIGNvbnN0cnVjdG9yKG5hbWUsIHB1YmxpY0lkLCBzeXN0ZW1JZCwgaW50ZXJuYWxTdWJzZXQpIHsKICAgICAgc3VwZXIoKTsKICAgICAgdGhpcy5uYW1lID0gbmFtZTsKICAgICAgdGhpcy5wdWJsaWNJZCA9IHB1YmxpY0lkICE9IG51bGwgPyBwdWJsaWNJZCA6IG51bGw7CiAgICAgIHRoaXMuc3lzdGVtSWQgPSBzeXN0ZW1JZCAhPSBudWxsID8gc3lzdGVtSWQgOiBudWxsOwogICAgICB0aGlzLmludGVybmFsU3Vic2V0ID0gaW50ZXJuYWxTdWJzZXQgIT0gbnVsbCA/IGludGVybmFsU3Vic2V0IDogbnVsbDsKICAgIH0KICAgIGdldCB0eXBlKCkgewogICAgICByZXR1cm4gWG1sTm9kZS5UWVBFX0RPQ1VNRU5UX1RZUEU7CiAgICB9CiAgICB0b0pTT04oKSB7CiAgICAgIGxldCBqc29uID0gWG1sTm9kZS5wcm90b3R5cGUudG9KU09OLmNhbGwodGhpcyk7CiAgICAgIGpzb24ubmFtZSA9IHRoaXMubmFtZTsKICAgICAgZm9yIChsZXQga2V5IG9mIFsicHVibGljSWQiLCAic3lzdGVtSWQiLCAiaW50ZXJuYWxTdWJzZXQiXSkgewogICAgICAgIGlmICh0aGlzW2tleV0gIT09IG51bGwpIHsKICAgICAgICAgIGpzb25ba2V5XSA9IHRoaXNba2V5XTsKICAgICAgICB9CiAgICAgIH0KICAgICAgcmV0dXJuIGpzb247CiAgICB9CiAgfTsKICB2YXIgWG1sRXJyb3IgPSBjbGFzcyBleHRlbmRzIEVycm9yIHsKICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2UsIGNoYXJJbmRleCwgeG1sKSB7CiAgICAgIGxldCBjb2x1bW4gPSAxOwogICAgICBsZXQgZXhjZXJwdCA9ICIiOwogICAgICBsZXQgbGluZSA9IDE7CiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hhckluZGV4OyArK2kpIHsKICAgICAgICBsZXQgY2hhciA9IHhtbFtpXTsKICAgICAgICBpZiAoY2hhciA9PT0gIlxuIikgewogICAgICAgICAgY29sdW1uID0gMTsKICAgICAgICAgIGV4Y2VycHQgPSAiIjsKICAgICAgICAgIGxpbmUgKz0gMTsKICAgICAgICB9IGVsc2UgewogICAgICAgICAgY29sdW1uICs9IDE7CiAgICAgICAgICBleGNlcnB0ICs9IGNoYXI7CiAgICAgICAgfQogICAgICB9CiAgICAgIGxldCBlb2wgPSB4bWwuaW5kZXhPZigiXG4iLCBjaGFySW5kZXgpOwogICAgICBleGNlcnB0ICs9IGVvbCA9PT0gLTEgPyB4bWwuc2xpY2UoY2hhckluZGV4KSA6IHhtbC5zbGljZShjaGFySW5kZXgsIGVvbCk7CiAgICAgIGxldCBleGNlcnB0U3RhcnQgPSAwOwogICAgICBpZiAoZXhjZXJwdC5sZW5ndGggPiA1MCkgewogICAgICAgIGlmIChjb2x1bW4gPCA0MCkgewogICAgICAgICAgZXhjZXJwdCA9IGV4Y2VycHQuc2xpY2UoMCwgNTApOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICBleGNlcnB0U3RhcnQgPSBjb2x1bW4gLSAyMDsKICAgICAgICAgIGV4Y2VycHQgPSBleGNlcnB0LnNsaWNlKGV4Y2VycHRTdGFydCwgY29sdW1uICsgMzApOwogICAgICAgIH0KICAgICAgfQogICAgICBzdXBlcigKICAgICAgICBgJHttZXNzYWdlfSAobGluZSAke2xpbmV9LCBjb2x1bW4gJHtjb2x1bW59KQogICR7ZXhjZXJwdH0KYCArICIgIi5yZXBlYXQoY29sdW1uIC0gZXhjZXJwdFN0YXJ0ICsgMSkgKyAiXlxuIgogICAgICApOwogICAgICB0aGlzLmNvbHVtbiA9IGNvbHVtbjsKICAgICAgdGhpcy5leGNlcnB0ID0gZXhjZXJwdDsKICAgICAgdGhpcy5saW5lID0gbGluZTsKICAgICAgdGhpcy5uYW1lID0gIlhtbEVycm9yIjsKICAgICAgdGhpcy5wb3MgPSBjaGFySW5kZXg7CiAgICB9CiAgfTsKICB2YXIgWG1sUHJvY2Vzc2luZ0luc3RydWN0aW9uID0gY2xhc3MgZXh0ZW5kcyBYbWxOb2RlIHsKICAgIGNvbnN0cnVjdG9yKG5hbWUsIGNvbnRlbnQgPSAiIikgewogICAgICBzdXBlcigpOwogICAgICB0aGlzLm5hbWUgPSBuYW1lOwogICAgICB0aGlzLmNvbnRlbnQgPSBjb250ZW50OwogICAgfQogICAgZ2V0IHR5cGUoKSB7CiAgICAgIHJldHVybiBYbWxOb2RlLlRZUEVfUFJPQ0VTU0lOR19JTlNUUlVDVElPTjsKICAgIH0KICAgIHRvSlNPTigpIHsKICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oWG1sTm9kZS5wcm90b3R5cGUudG9KU09OLmNhbGwodGhpcyksIHsKICAgICAgICBuYW1lOiB0aGlzLm5hbWUsCiAgICAgICAgY29udGVudDogdGhpcy5jb250ZW50CiAgICAgIH0pOwogICAgfQogIH07CiAgdmFyIGVtcHR5U3RyaW5nMiA9ICIiOwogIHZhciBQYXJzZXIgPSBjbGFzcyB7CiAgICAvKioKICAgICAqIEBwYXJhbSB4bWwgWE1MIHN0cmluZyB0byBwYXJzZS4KICAgICAqIEBwYXJhbSBvcHRpb25zIFBhcnNlciBvcHRpb25zLgogICAgICovCiAgICBjb25zdHJ1Y3Rvcih4bWwsIG9wdGlvbnMgPSB7fSkgewogICAgICBsZXQgZG9jID0gdGhpcy5kb2N1bWVudCA9IG5ldyBYbWxEb2N1bWVudCgpOwogICAgICBsZXQgc2Nhbm5lciA9IHRoaXMuYyA9IG5ldyBTdHJpbmdTY2FubmVyKHhtbCk7CiAgICAgIHRoaXMubCA9IGRvYzsKICAgICAgdGhpcy5mID0gb3B0aW9uczsKICAgICAgaWYgKHRoaXMuZi5pbmNsdWRlT2Zmc2V0cykgewogICAgICAgIGRvYy5zdGFydCA9IDA7CiAgICAgICAgZG9jLmVuZCA9IHhtbC5sZW5ndGg7CiAgICAgIH0KICAgICAgc2Nhbm5lci5iKCJcdUZFRkYiKTsKICAgICAgdGhpcy5IKCk7CiAgICAgIGlmICghdGhpcy5CKCkpIHsKICAgICAgICB0aHJvdyB0aGlzLmEoIlJvb3QgZWxlbWVudCBpcyBtaXNzaW5nIG9yIGludmFsaWQiKTsKICAgICAgfQogICAgICB3aGlsZSAodGhpcy53KCkpIHsKICAgICAgfQogICAgICBpZiAoIXNjYW5uZXIueikgewogICAgICAgIHRocm93IHRoaXMuYSgiRXh0cmEgY29udGVudCBhdCB0aGUgZW5kIG9mIHRoZSBkb2N1bWVudCIpOwogICAgICB9CiAgICB9CiAgICAvKioKICAgICAqIEFkZHMgdGhlIGdpdmVuIGBYbWxOb2RlYCBhcyBhIGNoaWxkIG9mIGB0aGlzLmN1cnJlbnROb2RlYC4KICAgICAqLwogICAgaihub2RlLCBjaGFySW5kZXgpIHsKICAgICAgbm9kZS5wYXJlbnQgPSB0aGlzLmw7CiAgICAgIGlmICh0aGlzLmYuaW5jbHVkZU9mZnNldHMpIHsKICAgICAgICBub2RlLnN0YXJ0ID0gdGhpcy5jLmkoY2hhckluZGV4KTsKICAgICAgICBub2RlLmVuZCA9IHRoaXMuYy5pKCk7CiAgICAgIH0KICAgICAgdGhpcy5sLmNoaWxkcmVuLnB1c2gobm9kZSk7CiAgICAgIHJldHVybiB0cnVlOwogICAgfQogICAgLyoqCiAgICAgKiBBZGRzIHRoZSBnaXZlbiBfdGV4dF8gdG8gdGhlIGRvY3VtZW50LCBlaXRoZXIgYnkgYXBwZW5kaW5nIGl0IHRvIGEKICAgICAqIHByZWNlZGluZyBgWG1sVGV4dGAgbm9kZSAoaWYgcG9zc2libGUpIG9yIGJ5IGNyZWF0aW5nIGEgbmV3IGBYbWxUZXh0YCBub2RlLgogICAgICovCiAgICB4KHRleHQsIGNoYXJJbmRleCkgewogICAgICBsZXQgeyBjaGlsZHJlbiB9ID0gdGhpcy5sOwogICAgICBsZXQgeyBsZW5ndGggfSA9IGNoaWxkcmVuOwogICAgICB0ZXh0ID0gbm9ybWFsaXplTGluZUJyZWFrcyh0ZXh0KTsKICAgICAgaWYgKGxlbmd0aCA+IDApIHsKICAgICAgICBsZXQgcHJldk5vZGUgPSBjaGlsZHJlbltsZW5ndGggLSAxXTsKICAgICAgICBpZiAoKHByZXZOb2RlID09IG51bGwgPyB2b2lkIDAgOiBwcmV2Tm9kZS50eXBlKSA9PT0gWG1sTm9kZS5UWVBFX1RFWFQpIHsKICAgICAgICAgIGxldCB0ZXh0Tm9kZSA9IHByZXZOb2RlOwogICAgICAgICAgdGV4dE5vZGUudGV4dCArPSB0ZXh0OwogICAgICAgICAgaWYgKHRoaXMuZi5pbmNsdWRlT2Zmc2V0cykgewogICAgICAgICAgICB0ZXh0Tm9kZS5lbmQgPSB0aGlzLmMuaSgpOwogICAgICAgICAgfQogICAgICAgICAgcmV0dXJuIHRydWU7CiAgICAgICAgfQogICAgICB9CiAgICAgIHJldHVybiB0aGlzLmoobmV3IFhtbFRleHQodGV4dCksIGNoYXJJbmRleCk7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGVsZW1lbnQgYXR0cmlidXRlcy4KICAgICAqCiAgICAgKiBAc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy14bWwtMjAwODExMjYvI3NlYy1zdGFydHRhZ3MKICAgICAqLwogICAgSSgpIHsKICAgICAgbGV0IGF0dHJpYnV0ZXMgPSAvKiBAX19QVVJFX18gKi8gT2JqZWN0LmNyZWF0ZShudWxsKTsKICAgICAgd2hpbGUgKHRoaXMuZSgpKSB7CiAgICAgICAgbGV0IGF0dHJOYW1lID0gdGhpcy5yKCk7CiAgICAgICAgaWYgKCFhdHRyTmFtZSkgewogICAgICAgICAgYnJlYWs7CiAgICAgICAgfQogICAgICAgIGxldCBhdHRyVmFsdWUgPSB0aGlzLnUoKSAmJiB0aGlzLkooKTsKICAgICAgICBpZiAoYXR0clZhbHVlID09PSBmYWxzZSkgewogICAgICAgICAgdGhyb3cgdGhpcy5hKCJBdHRyaWJ1dGUgdmFsdWUgZXhwZWN0ZWQiKTsKICAgICAgICB9CiAgICAgICAgaWYgKGF0dHJOYW1lIGluIGF0dHJpYnV0ZXMpIHsKICAgICAgICAgIHRocm93IHRoaXMuYShgRHVwbGljYXRlIGF0dHJpYnV0ZTogJHthdHRyTmFtZX1gKTsKICAgICAgICB9CiAgICAgICAgaWYgKGF0dHJOYW1lID09PSAieG1sOnNwYWNlIiAmJiBhdHRyVmFsdWUgIT09ICJkZWZhdWx0IiAmJiBhdHRyVmFsdWUgIT09ICJwcmVzZXJ2ZSIpIHsKICAgICAgICAgIHRocm93IHRoaXMuYSgnVmFsdWUgb2YgdGhlIGB4bWw6c3BhY2VgIGF0dHJpYnV0ZSBtdXN0IGJlICJkZWZhdWx0IiBvciAicHJlc2VydmUiJyk7CiAgICAgICAgfQogICAgICAgIGF0dHJpYnV0ZXNbYXR0ck5hbWVdID0gYXR0clZhbHVlOwogICAgICB9CiAgICAgIGlmICh0aGlzLmYuc29ydEF0dHJpYnV0ZXMpIHsKICAgICAgICBsZXQgYXR0ck5hbWVzID0gT2JqZWN0LmtleXMoYXR0cmlidXRlcykuc29ydCgpOwogICAgICAgIGxldCBzb3J0ZWRBdHRyaWJ1dGVzID0gLyogQF9fUFVSRV9fICovIE9iamVjdC5jcmVhdGUobnVsbCk7CiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRyTmFtZXMubGVuZ3RoOyArK2kpIHsKICAgICAgICAgIGxldCBhdHRyTmFtZSA9IGF0dHJOYW1lc1tpXTsKICAgICAgICAgIHNvcnRlZEF0dHJpYnV0ZXNbYXR0ck5hbWVdID0gYXR0cmlidXRlc1thdHRyTmFtZV07CiAgICAgICAgfQogICAgICAgIGF0dHJpYnV0ZXMgPSBzb3J0ZWRBdHRyaWJ1dGVzOwogICAgICB9CiAgICAgIHJldHVybiBhdHRyaWJ1dGVzOwogICAgfQogICAgLyoqCiAgICAgKiBDb25zdW1lcyBhbiBgQXR0VmFsdWVgIChhdHRyaWJ1dGUgdmFsdWUpIGlmIHBvc3NpYmxlLgogICAgICoKICAgICAqIEByZXR1cm5zCiAgICAgKiAgIENvbnRlbnRzIG9mIHRoZSBgQXR0VmFsdWVgIG1pbnVzIHF1b3Rlcywgb3IgYGZhbHNlYCBpZiBub3RoaW5nIHdhcwogICAgICogICBjb25zdW1lZC4gQW4gZW1wdHkgc3RyaW5nIGluZGljYXRlcyB0aGF0IGFuIGBBdHRWYWx1ZWAgd2FzIGNvbnN1bWVkIGJ1dAogICAgICogICB3YXMgZW1wdHkuCiAgICAgKgogICAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMteG1sLTIwMDgxMTI2LyNOVC1BdHRWYWx1ZQogICAgICovCiAgICBKKCkgewogICAgICBsZXQgeyBjOiBzY2FubmVyIH0gPSB0aGlzOwogICAgICBsZXQgcXVvdGUgPSBzY2FubmVyLmgoKTsKICAgICAgaWYgKHF1b3RlICE9PSAnIicgJiYgcXVvdGUgIT09ICInIikgewogICAgICAgIHJldHVybiBmYWxzZTsKICAgICAgfQogICAgICBzY2FubmVyLmcoKTsKICAgICAgbGV0IGNoYXJzOwogICAgICBsZXQgaXNDbG9zZWQgPSBmYWxzZTsKICAgICAgbGV0IHZhbHVlID0gZW1wdHlTdHJpbmcyOwogICAgICBsZXQgcmVnZXggPSBxdW90ZSA9PT0gJyInID8gYXR0VmFsdWVDaGFyRG91YmxlUXVvdGUgOiBhdHRWYWx1ZUNoYXJTaW5nbGVRdW90ZTsKICAgICAgbWF0Y2hMb29wOgogICAgICAgIHdoaWxlICghc2Nhbm5lci56KSB7CiAgICAgICAgICBjaGFycyA9IHNjYW5uZXIuRyhyZWdleCk7CiAgICAgICAgICBpZiAoY2hhcnMpIHsKICAgICAgICAgICAgdGhpcy5wKGNoYXJzKTsKICAgICAgICAgICAgdmFsdWUgKz0gY2hhcnMucmVwbGFjZShhdHRWYWx1ZU5vcm1hbGl6ZWRXaGl0ZXNwYWNlLCAiICIpOwogICAgICAgICAgfQogICAgICAgICAgc3dpdGNoIChzY2FubmVyLmgoKSkgewogICAgICAgICAgICBjYXNlIHF1b3RlOgogICAgICAgICAgICAgIGlzQ2xvc2VkID0gdHJ1ZTsKICAgICAgICAgICAgICBicmVhayBtYXRjaExvb3A7CiAgICAgICAgICAgIGNhc2UgIiYiOgogICAgICAgICAgICAgIHZhbHVlICs9IHRoaXMuQygpOwogICAgICAgICAgICAgIGNvbnRpbnVlOwogICAgICAgICAgICBjYXNlICI8IjoKICAgICAgICAgICAgICB0aHJvdyB0aGlzLmEoIlVuZXNjYXBlZCBgPGAgaXMgbm90IGFsbG93ZWQgaW4gYW4gYXR0cmlidXRlIHZhbHVlIik7CiAgICAgICAgICAgIGNhc2UgZW1wdHlTdHJpbmcyOgogICAgICAgICAgICAgIGJyZWFrIG1hdGNoTG9vcDsKICAgICAgICAgIH0KICAgICAgICB9CiAgICAgIGlmICghaXNDbG9zZWQpIHsKICAgICAgICB0aHJvdyB0aGlzLmEoIlVuY2xvc2VkIGF0dHJpYnV0ZSIpOwogICAgICB9CiAgICAgIHNjYW5uZXIuZygpOwogICAgICByZXR1cm4gdmFsdWU7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGEgQ0RBVEEgc2VjdGlvbiBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBAcmV0dXJucyBXaGV0aGVyIGEgQ0RBVEEgc2VjdGlvbiB3YXMgY29uc3VtZWQuCiAgICAgKiBAc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy14bWwtMjAwODExMjYvI3NlYy1jZGF0YS1zZWN0CiAgICAgKi8KICAgIEsoKSB7CiAgICAgIGxldCB7IGM6IHNjYW5uZXIgfSA9IHRoaXM7CiAgICAgIGxldCBzdGFydEluZGV4ID0gc2Nhbm5lci5kOwogICAgICBpZiAoIXNjYW5uZXIuYigiPCFbQ0RBVEFbIikpIHsKICAgICAgICByZXR1cm4gZmFsc2U7CiAgICAgIH0KICAgICAgbGV0IHRleHQgPSBzY2FubmVyLnQoIl1dPiIpOwogICAgICB0aGlzLnAodGV4dCk7CiAgICAgIGlmICghc2Nhbm5lci5iKCJdXT4iKSkgewogICAgICAgIHRocm93IHRoaXMuYSgiVW5jbG9zZWQgQ0RBVEEgc2VjdGlvbiIpOwogICAgICB9CiAgICAgIHJldHVybiB0aGlzLmYucHJlc2VydmVDZGF0YSA/IHRoaXMuaihuZXcgWG1sQ2RhdGEobm9ybWFsaXplTGluZUJyZWFrcyh0ZXh0KSksIHN0YXJ0SW5kZXgpIDogdGhpcy54KHRleHQsIHN0YXJ0SW5kZXgpOwogICAgfQogICAgLyoqCiAgICAgKiBDb25zdW1lcyBjaGFyYWN0ZXIgZGF0YSBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBAcmV0dXJucyBXaGV0aGVyIGNoYXJhY3RlciBkYXRhIHdhcyBjb25zdW1lZC4KICAgICAqIEBzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSLzIwMDgvUkVDLXhtbC0yMDA4MTEyNi8jZHQtY2hhcmRhdGEKICAgICAqLwogICAgTCgpIHsKICAgICAgbGV0IHsgYzogc2Nhbm5lciB9ID0gdGhpczsKICAgICAgbGV0IHN0YXJ0SW5kZXggPSBzY2FubmVyLmQ7CiAgICAgIGxldCBjaGFyRGF0YSA9IHNjYW5uZXIuQShlbmRDaGFyRGF0YSk7CiAgICAgIGlmICghY2hhckRhdGEpIHsKICAgICAgICByZXR1cm4gZmFsc2U7CiAgICAgIH0KICAgICAgdGhpcy5wKGNoYXJEYXRhKTsKICAgICAgaWYgKHNjYW5uZXIuaCgzKSA9PT0gIl1dPiIpIHsKICAgICAgICB0aHJvdyB0aGlzLmEoIkVsZW1lbnQgY29udGVudCBtYXkgbm90IGNvbnRhaW4gdGhlIENEQVRBIHNlY3Rpb24gY2xvc2UgZGVsaW1pdGVyIGBdXT5gIik7CiAgICAgIH0KICAgICAgcmV0dXJuIHRoaXMueChjaGFyRGF0YSwgc3RhcnRJbmRleCk7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGEgY29tbWVudCBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBAcmV0dXJucyBXaGV0aGVyIGEgY29tbWVudCB3YXMgY29uc3VtZWQuCiAgICAgKiBAc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy14bWwtMjAwODExMjYvI05ULUNvbW1lbnQKICAgICAqLwogICAgRCgpIHsKICAgICAgbGV0IHsgYzogc2Nhbm5lciB9ID0gdGhpczsKICAgICAgbGV0IHN0YXJ0SW5kZXggPSBzY2FubmVyLmQ7CiAgICAgIGlmICghc2Nhbm5lci5iKCI8IS0tIikpIHsKICAgICAgICByZXR1cm4gZmFsc2U7CiAgICAgIH0KICAgICAgbGV0IGNvbnRlbnQgPSBzY2FubmVyLnQoIi0tIik7CiAgICAgIHRoaXMucChjb250ZW50KTsKICAgICAgaWYgKCFzY2FubmVyLmIoIi0tPiIpKSB7CiAgICAgICAgaWYgKHNjYW5uZXIuaCgyKSA9PT0gIi0tIikgewogICAgICAgICAgdGhyb3cgdGhpcy5hKCJUaGUgc3RyaW5nIGAtLWAgaXNuJ3QgYWxsb3dlZCBpbnNpZGUgYSBjb21tZW50Iik7CiAgICAgICAgfQogICAgICAgIHRocm93IHRoaXMuYSgiVW5jbG9zZWQgY29tbWVudCIpOwogICAgICB9CiAgICAgIHJldHVybiB0aGlzLmYucHJlc2VydmVDb21tZW50cyA/IHRoaXMuaihuZXcgWG1sQ29tbWVudChub3JtYWxpemVMaW5lQnJlYWtzKGNvbnRlbnQpKSwgc3RhcnRJbmRleCkgOiB0cnVlOwogICAgfQogICAgLyoqCiAgICAgKiBDb25zdW1lcyBhIHJlZmVyZW5jZSBpbiBhIGNvbnRlbnQgY29udGV4dCBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBUaGlzIGRpZmZlcnMgZnJvbSBgY29uc3VtZVJlZmVyZW5jZSgpYCBpbiB0aGF0IGEgY29uc3VtZWQgcmVmZXJlbmNlIHdpbGwgYmUKICAgICAqIGFkZGVkIHRvIHRoZSBkb2N1bWVudCBhcyBhIHRleHQgbm9kZSBpbnN0ZWFkIG9mIHJldHVybmVkLgogICAgICoKICAgICAqIEByZXR1cm5zIFdoZXRoZXIgYSByZWZlcmVuY2Ugd2FzIGNvbnN1bWVkLgogICAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMteG1sLTIwMDgxMTI2LyNlbnRwcm9jCiAgICAgKi8KICAgIE0oKSB7CiAgICAgIGxldCBzdGFydEluZGV4ID0gdGhpcy5jLmQ7CiAgICAgIGxldCByZWYgPSB0aGlzLkMoKTsKICAgICAgcmV0dXJuIHJlZiA/IHRoaXMueChyZWYsIHN0YXJ0SW5kZXgpIDogZmFsc2U7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGEgZG9jdHlwZSBkZWNsYXJhdGlvbiBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBUaGlzIGlzIGEgbG9vc2UgaW1wbGVtZW50YXRpb24gc2luY2UgZG9jdHlwZSBkZWNsYXJhdGlvbnMgYXJlIGN1cnJlbnRseQogICAgICogZGlzY2FyZGVkIHdpdGhvdXQgZnVydGhlciBwYXJzaW5nLgogICAgICoKICAgICAqIEByZXR1cm5zIFdoZXRoZXIgYSBkb2N0eXBlIGRlY2xhcmF0aW9uIHdhcyBjb25zdW1lZC4KICAgICAqIEBzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSLzIwMDgvUkVDLXhtbC0yMDA4MTEyNi8jZHRkCiAgICAgKi8KICAgIE4oKSB7CiAgICAgIGxldCB7IGM6IHNjYW5uZXIgfSA9IHRoaXM7CiAgICAgIGxldCBzdGFydEluZGV4ID0gc2Nhbm5lci5kOwogICAgICBpZiAoIXNjYW5uZXIuYigiPCFET0NUWVBFIikpIHsKICAgICAgICByZXR1cm4gZmFsc2U7CiAgICAgIH0KICAgICAgbGV0IG5hbWUgPSB0aGlzLmUoKSAmJiB0aGlzLnIoKTsKICAgICAgaWYgKCFuYW1lKSB7CiAgICAgICAgdGhyb3cgdGhpcy5hKCJFeHBlY3RlZCBhIG5hbWUiKTsKICAgICAgfQogICAgICBsZXQgcHVibGljSWQ7CiAgICAgIGxldCBzeXN0ZW1JZDsKICAgICAgaWYgKHRoaXMuZSgpKSB7CiAgICAgICAgaWYgKHNjYW5uZXIuYigiUFVCTElDIikpIHsKICAgICAgICAgIHB1YmxpY0lkID0gdGhpcy5lKCkgJiYgdGhpcy5PKCk7CiAgICAgICAgICBpZiAocHVibGljSWQgPT09IGZhbHNlKSB7CiAgICAgICAgICAgIHRocm93IHRoaXMuYSgiRXhwZWN0ZWQgYSBwdWJsaWMgaWRlbnRpZmllciIpOwogICAgICAgICAgfQogICAgICAgICAgdGhpcy5lKCk7CiAgICAgICAgfQogICAgICAgIGlmIChwdWJsaWNJZCAhPT0gdm9pZCAwIHx8IHNjYW5uZXIuYigiU1lTVEVNIikpIHsKICAgICAgICAgIHRoaXMuZSgpOwogICAgICAgICAgc3lzdGVtSWQgPSB0aGlzLnMoKTsKICAgICAgICAgIGlmIChzeXN0ZW1JZCA9PT0gZmFsc2UpIHsKICAgICAgICAgICAgdGhyb3cgdGhpcy5hKCJFeHBlY3RlZCBhIHN5c3RlbSBpZGVudGlmaWVyIik7CiAgICAgICAgICB9CiAgICAgICAgICB0aGlzLmUoKTsKICAgICAgICB9CiAgICAgIH0KICAgICAgbGV0IGludGVybmFsU3Vic2V0OwogICAgICBpZiAoc2Nhbm5lci5iKCJbIikpIHsKICAgICAgICBpbnRlcm5hbFN1YnNldCA9IHNjYW5uZXIuQSgvXF1bXHgyMFx0XHJcbl0qPi8pOwogICAgICAgIGlmICghc2Nhbm5lci5iKCJdIikpIHsKICAgICAgICAgIHRocm93IHRoaXMuYSgiVW5jbG9zZWQgaW50ZXJuYWwgc3Vic2V0Iik7CiAgICAgICAgfQogICAgICAgIHRoaXMuZSgpOwogICAgICB9CiAgICAgIGlmICghc2Nhbm5lci5iKCI+IikpIHsKICAgICAgICB0aHJvdyB0aGlzLmEoIlVuY2xvc2VkIGRvY3R5cGUgZGVjbGFyYXRpb24iKTsKICAgICAgfQogICAgICByZXR1cm4gdGhpcy5mLnByZXNlcnZlRG9jdW1lbnRUeXBlID8gdGhpcy5qKG5ldyBYbWxEb2N1bWVudFR5cGUobmFtZSwgcHVibGljSWQsIHN5c3RlbUlkLCBpbnRlcm5hbFN1YnNldCksIHN0YXJ0SW5kZXgpIDogdHJ1ZTsKICAgIH0KICAgIC8qKgogICAgICogQ29uc3VtZXMgYW4gZWxlbWVudCBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBAcmV0dXJucyBXaGV0aGVyIGFuIGVsZW1lbnQgd2FzIGNvbnN1bWVkLgogICAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMteG1sLTIwMDgxMTI2LyNOVC1lbGVtZW50CiAgICAgKi8KICAgIEIoKSB7CiAgICAgIGxldCB7IGM6IHNjYW5uZXIgfSA9IHRoaXM7CiAgICAgIGxldCBzdGFydEluZGV4ID0gc2Nhbm5lci5kOwogICAgICBpZiAoIXNjYW5uZXIuYigiPCIpKSB7CiAgICAgICAgcmV0dXJuIGZhbHNlOwogICAgICB9CiAgICAgIGxldCBuYW1lID0gdGhpcy5yKCk7CiAgICAgIGlmICghbmFtZSkgewogICAgICAgIHNjYW5uZXIubyhzdGFydEluZGV4KTsKICAgICAgICByZXR1cm4gZmFsc2U7CiAgICAgIH0KICAgICAgbGV0IGF0dHJpYnV0ZXMgPSB0aGlzLkkoKTsKICAgICAgbGV0IGlzRW1wdHkgPSAhIXNjYW5uZXIuYigiLz4iKTsKICAgICAgbGV0IGVsZW1lbnQgPSBuZXcgWG1sRWxlbWVudChuYW1lLCBhdHRyaWJ1dGVzKTsKICAgICAgZWxlbWVudC5wYXJlbnQgPSB0aGlzLmw7CiAgICAgIGlmICghaXNFbXB0eSkgewogICAgICAgIGlmICghc2Nhbm5lci5iKCI+IikpIHsKICAgICAgICAgIHRocm93IHRoaXMuYShgVW5jbG9zZWQgc3RhcnQgdGFnIGZvciBlbGVtZW50IFxgJHtuYW1lfVxgYCk7CiAgICAgICAgfQogICAgICAgIHRoaXMubCA9IGVsZW1lbnQ7CiAgICAgICAgZG8gewogICAgICAgICAgdGhpcy5MKCk7CiAgICAgICAgfSB3aGlsZSAodGhpcy5CKCkgfHwgdGhpcy5NKCkgfHwgdGhpcy5LKCkgfHwgdGhpcy5FKCkgfHwgdGhpcy5EKCkpOwogICAgICAgIGxldCBlbmRUYWdNYXJrID0gc2Nhbm5lci5kOwogICAgICAgIGxldCBlbmRUYWdOYW1lOwogICAgICAgIGlmICghc2Nhbm5lci5iKCI8LyIpIHx8ICEoZW5kVGFnTmFtZSA9IHRoaXMucigpKSB8fCBlbmRUYWdOYW1lICE9PSBuYW1lKSB7CiAgICAgICAgICBzY2FubmVyLm8oZW5kVGFnTWFyayk7CiAgICAgICAgICB0aHJvdyB0aGlzLmEoYE1pc3NpbmcgZW5kIHRhZyBmb3IgZWxlbWVudCAke25hbWV9YCk7CiAgICAgICAgfQogICAgICAgIHRoaXMuZSgpOwogICAgICAgIGlmICghc2Nhbm5lci5iKCI+IikpIHsKICAgICAgICAgIHRocm93IHRoaXMuYShgVW5jbG9zZWQgZW5kIHRhZyBmb3IgZWxlbWVudCAke25hbWV9YCk7CiAgICAgICAgfQogICAgICAgIHRoaXMubCA9IGVsZW1lbnQucGFyZW50OwogICAgICB9CiAgICAgIHJldHVybiB0aGlzLmooZWxlbWVudCwgc3RhcnRJbmRleCk7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGFuIGBFcWAgcHJvZHVjdGlvbiBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBAcmV0dXJucyBXaGV0aGVyIGFuIGBFcWAgcHJvZHVjdGlvbiB3YXMgY29uc3VtZWQuCiAgICAgKiBAc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy14bWwtMjAwODExMjYvI05ULUVxCiAgICAgKi8KICAgIHUoKSB7CiAgICAgIHRoaXMuZSgpOwogICAgICBpZiAodGhpcy5jLmIoIj0iKSkgewogICAgICAgIHRoaXMuZSgpOwogICAgICAgIHJldHVybiB0cnVlOwogICAgICB9CiAgICAgIHJldHVybiBmYWxzZTsKICAgIH0KICAgIC8qKgogICAgICogQ29uc3VtZXMgYE1pc2NgIGNvbnRlbnQgaWYgcG9zc2libGUuCiAgICAgKgogICAgICogQHJldHVybnMgV2hldGhlciBhbnl0aGluZyB3YXMgY29uc3VtZWQuCiAgICAgKiBAc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy14bWwtMjAwODExMjYvI05ULU1pc2MKICAgICAqLwogICAgdygpIHsKICAgICAgcmV0dXJuIHRoaXMuRCgpIHx8IHRoaXMuRSgpIHx8IHRoaXMuZSgpOwogICAgfQogICAgLyoqCiAgICAgKiBDb25zdW1lcyBvbmUgb3IgbW9yZSBgTmFtZWAgY2hhcmFjdGVycyBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBAcmV0dXJucyBgTmFtZWAgY2hhcmFjdGVycywgb3IgYW4gZW1wdHkgc3RyaW5nIGlmIG5vbmUgd2VyZSBjb25zdW1lZC4KICAgICAqIEBzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSLzIwMDgvUkVDLXhtbC0yMDA4MTEyNi8jTlQtTmFtZQogICAgICovCiAgICByKCkgewogICAgICByZXR1cm4gaXNOYW1lU3RhcnRDaGFyKHRoaXMuYy5oKCkpID8gdGhpcy5jLnYoaXNOYW1lQ2hhcikgOiBlbXB0eVN0cmluZzI7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGEgcHJvY2Vzc2luZyBpbnN0cnVjdGlvbiBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBAcmV0dXJucyBXaGV0aGVyIGEgcHJvY2Vzc2luZyBpbnN0cnVjdGlvbiB3YXMgY29uc3VtZWQuCiAgICAgKiBAc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy14bWwtMjAwODExMjYvI3NlYy1waQogICAgICovCiAgICBFKCkgewogICAgICBsZXQgeyBjOiBzY2FubmVyIH0gPSB0aGlzOwogICAgICBsZXQgc3RhcnRJbmRleCA9IHNjYW5uZXIuZDsKICAgICAgaWYgKCFzY2FubmVyLmIoIjw/IikpIHsKICAgICAgICByZXR1cm4gZmFsc2U7CiAgICAgIH0KICAgICAgbGV0IG5hbWUgPSB0aGlzLnIoKTsKICAgICAgaWYgKG5hbWUpIHsKICAgICAgICBpZiAobmFtZS50b0xvd2VyQ2FzZSgpID09PSAieG1sIikgewogICAgICAgICAgc2Nhbm5lci5vKHN0YXJ0SW5kZXgpOwogICAgICAgICAgdGhyb3cgdGhpcy5hKCJYTUwgZGVjbGFyYXRpb24gaXNuJ3QgYWxsb3dlZCBoZXJlIik7CiAgICAgICAgfQogICAgICB9IGVsc2UgewogICAgICAgIHRocm93IHRoaXMuYSgiSW52YWxpZCBwcm9jZXNzaW5nIGluc3RydWN0aW9uIik7CiAgICAgIH0KICAgICAgaWYgKCF0aGlzLmUoKSkgewogICAgICAgIGlmIChzY2FubmVyLmIoIj8+IikpIHsKICAgICAgICAgIHJldHVybiB0aGlzLmoobmV3IFhtbFByb2Nlc3NpbmdJbnN0cnVjdGlvbihuYW1lKSwgc3RhcnRJbmRleCk7CiAgICAgICAgfQogICAgICAgIHRocm93IHRoaXMuYSgiV2hpdGVzcGFjZSBpcyByZXF1aXJlZCBhZnRlciBhIHByb2Nlc3NpbmcgaW5zdHJ1Y3Rpb24gbmFtZSIpOwogICAgICB9CiAgICAgIGxldCBjb250ZW50ID0gc2Nhbm5lci50KCI/PiIpOwogICAgICB0aGlzLnAoY29udGVudCk7CiAgICAgIGlmICghc2Nhbm5lci5iKCI/PiIpKSB7CiAgICAgICAgdGhyb3cgdGhpcy5hKCJVbnRlcm1pbmF0ZWQgcHJvY2Vzc2luZyBpbnN0cnVjdGlvbiIpOwogICAgICB9CiAgICAgIHJldHVybiB0aGlzLmoobmV3IFhtbFByb2Nlc3NpbmdJbnN0cnVjdGlvbihuYW1lLCBub3JtYWxpemVMaW5lQnJlYWtzKGNvbnRlbnQpKSwgc3RhcnRJbmRleCk7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGEgcHJvbG9nIGlmIHBvc3NpYmxlLgogICAgICoKICAgICAqIEByZXR1cm5zIFdoZXRoZXIgYSBwcm9sb2cgd2FzIGNvbnN1bWVkLgogICAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMteG1sLTIwMDgxMTI2LyNzZWMtcHJvbG9nLWR0ZAogICAgICovCiAgICBIKCkgewogICAgICBsZXQgeyBjOiBzY2FubmVyIH0gPSB0aGlzOwogICAgICBsZXQgc3RhcnRJbmRleCA9IHNjYW5uZXIuZDsKICAgICAgdGhpcy5QKCk7CiAgICAgIHdoaWxlICh0aGlzLncoKSkgewogICAgICB9CiAgICAgIGlmICh0aGlzLk4oKSkgewogICAgICAgIHdoaWxlICh0aGlzLncoKSkgewogICAgICAgIH0KICAgICAgfQogICAgICByZXR1cm4gc3RhcnRJbmRleCA8IHNjYW5uZXIuZDsKICAgIH0KICAgIC8qKgogICAgICogQ29uc3VtZXMgYSBwdWJsaWMgaWRlbnRpZmllciBsaXRlcmFsIGlmIHBvc3NpYmxlLgogICAgICoKICAgICAqIEByZXR1cm5zCiAgICAgKiAgIFZhbHVlIG9mIHRoZSBwdWJsaWMgaWRlbnRpZmllciBsaXRlcmFsIG1pbnVzIHF1b3Rlcywgb3IgYGZhbHNlYCBpZgogICAgICogICBub3RoaW5nIHdhcyBjb25zdW1lZC4gQW4gZW1wdHkgc3RyaW5nIGluZGljYXRlcyB0aGF0IGEgcHVibGljIGlkIGxpdGVyYWwKICAgICAqICAgd2FzIGNvbnN1bWVkIGJ1dCB3YXMgZW1wdHkuCiAgICAgKgogICAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMteG1sLTIwMDgxMTI2LyNOVC1QdWJpZExpdGVyYWwKICAgICAqLwogICAgTygpIHsKICAgICAgbGV0IHN0YXJ0SW5kZXggPSB0aGlzLmMuZDsKICAgICAgbGV0IHZhbHVlID0gdGhpcy5zKCk7CiAgICAgIGlmICh2YWx1ZSAhPT0gZmFsc2UgJiYgIS9eWy1ceDIwXHJcbmEtekEtWjAtOScoKSssLi86PT87ISojQCRfJV0qJC8udGVzdCh2YWx1ZSkpIHsKICAgICAgICB0aGlzLmMubyhzdGFydEluZGV4KTsKICAgICAgICB0aHJvdyB0aGlzLmEoIkludmFsaWQgY2hhcmFjdGVyIGluIHB1YmxpYyBpZGVudGlmaWVyIik7CiAgICAgIH0KICAgICAgcmV0dXJuIHZhbHVlOwogICAgfQogICAgLyoqCiAgICAgKiBDb25zdW1lcyBhIHJlZmVyZW5jZSBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBUaGlzIGRpZmZlcnMgZnJvbSBgY29uc3VtZUNvbnRlbnRSZWZlcmVuY2UoKWAgaW4gdGhhdCBhIGNvbnN1bWVkIHJlZmVyZW5jZQogICAgICogd2lsbCBiZSByZXR1cm5lZCByYXRoZXIgdGhhbiBhZGRlZCB0byB0aGUgZG9jdW1lbnQuCiAgICAgKgogICAgICogQHJldHVybnMKICAgICAqICAgUGFyc2VkIHJlZmVyZW5jZSB2YWx1ZSwgb3IgYGZhbHNlYCBpZiBub3RoaW5nIHdhcyBjb25zdW1lZCAodG8KICAgICAqICAgZGlzdGluZ3Vpc2ggZnJvbSBhIHJlZmVyZW5jZSB0aGF0IHJlc29sdmVzIHRvIGFuIGVtcHR5IHN0cmluZykuCiAgICAgKgogICAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMteG1sLTIwMDgxMTI2LyNOVC1SZWZlcmVuY2UKICAgICAqLwogICAgQygpIHsKICAgICAgbGV0IHsgYzogc2Nhbm5lciB9ID0gdGhpczsKICAgICAgaWYgKCFzY2FubmVyLmIoIiYiKSkgewogICAgICAgIHJldHVybiBmYWxzZTsKICAgICAgfQogICAgICBsZXQgcmVmID0gc2Nhbm5lci52KGlzUmVmZXJlbmNlQ2hhcik7CiAgICAgIGlmIChzY2FubmVyLkYoKSAhPT0gIjsiKSB7CiAgICAgICAgdGhyb3cgdGhpcy5hKCJVbnRlcm1pbmF0ZWQgcmVmZXJlbmNlIChhIHJlZmVyZW5jZSBtdXN0IGVuZCB3aXRoIGA7YCkiKTsKICAgICAgfQogICAgICBsZXQgcGFyc2VkVmFsdWU7CiAgICAgIGlmIChyZWZbMF0gPT09ICIjIikgewogICAgICAgIGxldCBjb2RlUG9pbnQgPSByZWZbMV0gPT09ICJ4IiA/IHBhcnNlSW50KHJlZi5zbGljZSgyKSwgMTYpIDogcGFyc2VJbnQocmVmLnNsaWNlKDEpLCAxMCk7CiAgICAgICAgaWYgKGlzTmFOKGNvZGVQb2ludCkpIHsKICAgICAgICAgIHRocm93IHRoaXMuYSgiSW52YWxpZCBjaGFyYWN0ZXIgcmVmZXJlbmNlIik7CiAgICAgICAgfQogICAgICAgIGlmICghaXNYbWxDb2RlUG9pbnQoY29kZVBvaW50KSkgewogICAgICAgICAgdGhyb3cgdGhpcy5hKCJDaGFyYWN0ZXIgcmVmZXJlbmNlIHJlc29sdmVzIHRvIGFuIGludmFsaWQgY2hhcmFjdGVyIik7CiAgICAgICAgfQogICAgICAgIHBhcnNlZFZhbHVlID0gU3RyaW5nLmZyb21Db2RlUG9pbnQoY29kZVBvaW50KTsKICAgICAgfSBlbHNlIHsKICAgICAgICBwYXJzZWRWYWx1ZSA9IHByZWRlZmluZWRFbnRpdGllc1tyZWZdOwogICAgICAgIGlmIChwYXJzZWRWYWx1ZSA9PT0gdm9pZCAwKSB7CiAgICAgICAgICBsZXQgewogICAgICAgICAgICBpZ25vcmVVbmRlZmluZWRFbnRpdGllcywKICAgICAgICAgICAgcmVzb2x2ZVVuZGVmaW5lZEVudGl0eQogICAgICAgICAgfSA9IHRoaXMuZjsKICAgICAgICAgIGxldCB3cmFwcGVkUmVmID0gYCYke3JlZn07YDsKICAgICAgICAgIGlmIChyZXNvbHZlVW5kZWZpbmVkRW50aXR5KSB7CiAgICAgICAgICAgIGxldCByZXNvbHZlZFZhbHVlID0gcmVzb2x2ZVVuZGVmaW5lZEVudGl0eSh3cmFwcGVkUmVmKTsKICAgICAgICAgICAgaWYgKHJlc29sdmVkVmFsdWUgIT09IG51bGwgJiYgcmVzb2x2ZWRWYWx1ZSAhPT0gdm9pZCAwKSB7CiAgICAgICAgICAgICAgbGV0IHR5cGUgPSB0eXBlb2YgcmVzb2x2ZWRWYWx1ZTsKICAgICAgICAgICAgICBpZiAodHlwZSAhPT0gInN0cmluZyIpIHsKICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFxgcmVzb2x2ZVVuZGVmaW5lZEVudGl0eSgpXGAgbXVzdCByZXR1cm4gYSBzdHJpbmcsIFxgbnVsbFxgLCBvciBcYHVuZGVmaW5lZFxgLCBidXQgcmV0dXJuZWQgYSB2YWx1ZSBvZiB0eXBlICR7dHlwZX1gKTsKICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVkVmFsdWU7CiAgICAgICAgICAgIH0KICAgICAgICAgIH0KICAgICAgICAgIGlmIChpZ25vcmVVbmRlZmluZWRFbnRpdGllcykgewogICAgICAgICAgICByZXR1cm4gd3JhcHBlZFJlZjsKICAgICAgICAgIH0KICAgICAgICAgIHNjYW5uZXIubygtd3JhcHBlZFJlZi5sZW5ndGgpOwogICAgICAgICAgdGhyb3cgdGhpcy5hKGBOYW1lZCBlbnRpdHkgaXNuJ3QgZGVmaW5lZDogJHt3cmFwcGVkUmVmfWApOwogICAgICAgIH0KICAgICAgfQogICAgICByZXR1cm4gcGFyc2VkVmFsdWU7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGEgYFN5c3RlbUxpdGVyYWxgIGlmIHBvc3NpYmxlLgogICAgICoKICAgICAqIEEgYFN5c3RlbUxpdGVyYWxgIGlzIHNpbWlsYXIgdG8gYW4gYXR0cmlidXRlIHZhbHVlLCBidXQgYWxsb3dzIHRoZQogICAgICogY2hhcmFjdGVycyBgPGAgYW5kIGAmYCBhbmQgZG9lc24ndCByZXBsYWNlIHJlZmVyZW5jZXMuCiAgICAgKgogICAgICogQHJldHVybnMKICAgICAqICAgVmFsdWUgb2YgdGhlIGBTeXN0ZW1MaXRlcmFsYCBtaW51cyBxdW90ZXMsIG9yIGBmYWxzZWAgaWYgbm90aGluZyB3YXMKICAgICAqICAgY29uc3VtZWQuIEFuIGVtcHR5IHN0cmluZyBpbmRpY2F0ZXMgdGhhdCBhIGBTeXN0ZW1MaXRlcmFsYCB3YXMgY29uc3VtZWQKICAgICAqICAgYnV0IHdhcyBlbXB0eS4KICAgICAqCiAgICAgKiBAc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy14bWwtMjAwODExMjYvI05ULVN5c3RlbUxpdGVyYWwKICAgICAqLwogICAgcygpIHsKICAgICAgbGV0IHsgYzogc2Nhbm5lciB9ID0gdGhpczsKICAgICAgbGV0IHF1b3RlID0gc2Nhbm5lci5iKCciJykgfHwgc2Nhbm5lci5iKCInIik7CiAgICAgIGlmICghcXVvdGUpIHsKICAgICAgICByZXR1cm4gZmFsc2U7CiAgICAgIH0KICAgICAgbGV0IHZhbHVlID0gc2Nhbm5lci50KHF1b3RlKTsKICAgICAgdGhpcy5wKHZhbHVlKTsKICAgICAgaWYgKCFzY2FubmVyLmIocXVvdGUpKSB7CiAgICAgICAgdGhyb3cgdGhpcy5hKCJNaXNzaW5nIGVuZCBxdW90ZSIpOwogICAgICB9CiAgICAgIHJldHVybiB2YWx1ZTsKICAgIH0KICAgIC8qKgogICAgICogQ29uc3VtZXMgb25lIG9yIG1vcmUgd2hpdGVzcGFjZSBjaGFyYWN0ZXJzIGlmIHBvc3NpYmxlLgogICAgICoKICAgICAqIEByZXR1cm5zIFdoZXRoZXIgYW55IHdoaXRlc3BhY2UgY2hhcmFjdGVycyB3ZXJlIGNvbnN1bWVkLgogICAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMteG1sLTIwMDgxMTI2LyN3aGl0ZQogICAgICovCiAgICBlKCkgewogICAgICByZXR1cm4gISF0aGlzLmMudihpc1doaXRlc3BhY2UpOwogICAgfQogICAgLyoqCiAgICAgKiBDb25zdW1lcyBhbiBYTUwgZGVjbGFyYXRpb24gaWYgcG9zc2libGUuCiAgICAgKgogICAgICogQHJldHVybnMgV2hldGhlciBhbiBYTUwgZGVjbGFyYXRpb24gd2FzIGNvbnN1bWVkLgogICAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMteG1sLTIwMDgxMTI2LyNOVC1YTUxEZWNsCiAgICAgKi8KICAgIFAoKSB7CiAgICAgIGxldCB7IGM6IHNjYW5uZXIgfSA9IHRoaXM7CiAgICAgIGxldCBzdGFydEluZGV4ID0gc2Nhbm5lci5kOwogICAgICBpZiAoIXNjYW5uZXIuYigiPD94bWwiKSkgewogICAgICAgIHJldHVybiBmYWxzZTsKICAgICAgfQogICAgICBpZiAoIXRoaXMuZSgpKSB7CiAgICAgICAgdGhyb3cgdGhpcy5hKCJJbnZhbGlkIFhNTCBkZWNsYXJhdGlvbiIpOwogICAgICB9CiAgICAgIGxldCB2ZXJzaW9uID0gISFzY2FubmVyLmIoInZlcnNpb24iKSAmJiB0aGlzLnUoKSAmJiB0aGlzLnMoKTsKICAgICAgaWYgKHZlcnNpb24gPT09IGZhbHNlKSB7CiAgICAgICAgdGhyb3cgdGhpcy5hKCJYTUwgdmVyc2lvbiBpcyBtaXNzaW5nIG9yIGludmFsaWQiKTsKICAgICAgfSBlbHNlIGlmICghL14xXC5bMC05XSskLy50ZXN0KHZlcnNpb24pKSB7CiAgICAgICAgdGhyb3cgdGhpcy5hKCJJbnZhbGlkIGNoYXJhY3RlciBpbiB2ZXJzaW9uIG51bWJlciIpOwogICAgICB9CiAgICAgIGxldCBlbmNvZGluZzsKICAgICAgbGV0IHN0YW5kYWxvbmU7CiAgICAgIGlmICh0aGlzLmUoKSkgewogICAgICAgIGVuY29kaW5nID0gISFzY2FubmVyLmIoImVuY29kaW5nIikgJiYgdGhpcy51KCkgJiYgdGhpcy5zKCk7CiAgICAgICAgaWYgKGVuY29kaW5nKSB7CiAgICAgICAgICB0aGlzLmUoKTsKICAgICAgICB9CiAgICAgICAgc3RhbmRhbG9uZSA9ICEhc2Nhbm5lci5iKCJzdGFuZGFsb25lIikgJiYgdGhpcy51KCkgJiYgdGhpcy5zKCk7CiAgICAgICAgaWYgKHN0YW5kYWxvbmUpIHsKICAgICAgICAgIGlmIChzdGFuZGFsb25lICE9PSAieWVzIiAmJiBzdGFuZGFsb25lICE9PSAibm8iKSB7CiAgICAgICAgICAgIHRocm93IHRoaXMuYSgnT25seSAieWVzIiBhbmQgIm5vIiBhcmUgcGVybWl0dGVkIGFzIHZhbHVlcyBvZiBgc3RhbmRhbG9uZWAnKTsKICAgICAgICAgIH0KICAgICAgICAgIHRoaXMuZSgpOwogICAgICAgIH0KICAgICAgfQogICAgICBpZiAoIXNjYW5uZXIuYigiPz4iKSkgewogICAgICAgIHRocm93IHRoaXMuYSgiSW52YWxpZCBvciB1bmNsb3NlZCBYTUwgZGVjbGFyYXRpb24iKTsKICAgICAgfQogICAgICByZXR1cm4gdGhpcy5mLnByZXNlcnZlWG1sRGVjbGFyYXRpb24gPyB0aGlzLmoobmV3IFhtbERlY2xhcmF0aW9uKAogICAgICAgIHZlcnNpb24sCiAgICAgICAgZW5jb2RpbmcgfHwgdm9pZCAwLAogICAgICAgIHN0YW5kYWxvbmUgfHwgdm9pZCAwCiAgICAgICksIHN0YXJ0SW5kZXgpIDogdHJ1ZTsKICAgIH0KICAgIC8qKgogICAgICogUmV0dXJucyBhbiBgWG1sRXJyb3JgIGZvciB0aGUgY3VycmVudCBzY2FubmVyIHBvc2l0aW9uLgogICAgICovCiAgICBhKG1lc3NhZ2UpIHsKICAgICAgbGV0IHsgYzogc2Nhbm5lciB9ID0gdGhpczsKICAgICAgcmV0dXJuIG5ldyBYbWxFcnJvcihtZXNzYWdlLCBzY2FubmVyLmQsIHNjYW5uZXIubSk7CiAgICB9CiAgICAvKioKICAgICAqIFRocm93cyBhbiBpbnZhbGlkIGNoYXJhY3RlciBlcnJvciBpZiBhbnkgY2hhcmFjdGVyIGluIHRoZSBnaXZlbiBfc3RyaW5nXwogICAgICogaXNuJ3QgYSB2YWxpZCBYTUwgY2hhcmFjdGVyLgogICAgICovCiAgICBwKHN0cmluZykgewogICAgICBsZXQgeyBsZW5ndGggfSA9IHN0cmluZzsKICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkgewogICAgICAgIGxldCBjcCA9IHN0cmluZy5jb2RlUG9pbnRBdChpKTsKICAgICAgICBpZiAoIWlzWG1sQ29kZVBvaW50KGNwKSkgewogICAgICAgICAgdGhpcy5jLm8oLShbLi4uc3RyaW5nXS5sZW5ndGggLSBpKSk7CiAgICAgICAgICB0aHJvdyB0aGlzLmEoIkludmFsaWQgY2hhcmFjdGVyIik7CiAgICAgICAgfQogICAgICAgIGlmIChjcCA+IDY1NTM1KSB7CiAgICAgICAgICBpICs9IDE7CiAgICAgICAgfQogICAgICB9CiAgICB9CiAgfTsKICBmdW5jdGlvbiBub3JtYWxpemVMaW5lQnJlYWtzKHRleHQpIHsKICAgIGxldCBpID0gMDsKICAgIHdoaWxlICgoaSA9IHRleHQuaW5kZXhPZigiXHIiLCBpKSkgIT09IC0xKSB7CiAgICAgIHRleHQgPSB0ZXh0W2kgKyAxXSA9PT0gIlxuIiA/IHRleHQuc2xpY2UoMCwgaSkgKyB0ZXh0LnNsaWNlKGkgKyAxKSA6IHRleHQuc2xpY2UoMCwgaSkgKyAiXG4iICsgdGV4dC5zbGljZShpICsgMSk7CiAgICB9CiAgICByZXR1cm4gdGV4dDsKICB9CiAgZnVuY3Rpb24gcGFyc2VYbWwoeG1sLCBvcHRpb25zKSB7CiAgICByZXR1cm4gbmV3IFBhcnNlcih4bWwsIG9wdGlvbnMpLmRvY3VtZW50OwogIH0KICBjbGFzcyBYbWxQYXJzZUVycm9yIGV4dGVuZHMgRXJyb3IgewogICAgY29uc3RydWN0b3IobWVzc2FnZSkgewogICAgICBzdXBlcihtZXNzYWdlKTsKICAgIH0KICB9CiAgZnVuY3Rpb24gcGFyc2VYbWxTdHJpbmcoeG1sU3RyaW5nKSB7CiAgICBsZXQgZG9jID0gbnVsbDsKICAgIHRyeSB7CiAgICAgIGRvYyA9IGJyb3dzZXIucGFyc2VYbWwoeG1sU3RyaW5nKTsKICAgIH0gY2F0Y2ggKGUpIHsKICAgICAgdGhyb3cgbmV3IFhtbFBhcnNlRXJyb3IoZS5tZXNzYWdlKTsKICAgIH0KICAgIHJldHVybiBkb2M7CiAgfQogIGZ1bmN0aW9uIHN0cmlwTmFtZXNwYWNlKG5hbWUpIHsKICAgIGNvbnN0IGNvbG9uID0gbmFtZS5pbmRleE9mKCI6Iik7CiAgICByZXR1cm4gY29sb24gPiAtMSA/IG5hbWUuc3Vic3RyKGNvbG9uICsgMSkgOiBuYW1lOwogIH0KICBmdW5jdGlvbiBnZXRSb290RWxlbWVudCh4bWxEb2MpIHsKICAgIHJldHVybiB4bWxEb2MuY2hpbGRyZW5bMF07CiAgfQogIGZ1bmN0aW9uIGdldEVsZW1lbnROYW1lKGVsZW1lbnQpIHsKICAgIHJldHVybiBlbGVtZW50Lm5hbWUgfHwgIiI7CiAgfQogIGZ1bmN0aW9uIGZpbmRDaGlsZHJlbkVsZW1lbnQoZWxlbWVudCwgbmFtZSwgbmVzdGVkID0gZmFsc2UpIHsKICAgIGNvbnN0IHN0cmlwcGVkTmFtZSA9IHN0cmlwTmFtZXNwYWNlKG5hbWUpOwogICAgZnVuY3Rpb24gcmVkdWNlcihwcmV2LCBjdXJyKSB7CiAgICAgIGlmIChzdHJpcE5hbWVzcGFjZShnZXRFbGVtZW50TmFtZShjdXJyKSkgPT09IHN0cmlwcGVkTmFtZSkgewogICAgICAgIHByZXYucHVzaChjdXJyKTsKICAgICAgfQogICAgICBpZiAobmVzdGVkICYmIEFycmF5LmlzQXJyYXkoY3Vyci5jaGlsZHJlbikpIHsKICAgICAgICByZXR1cm4gWy4uLnByZXYsIC4uLmN1cnIuY2hpbGRyZW4ucmVkdWNlKHJlZHVjZXIsIFtdKV07CiAgICAgIH0gZWxzZSB7CiAgICAgICAgcmV0dXJuIHByZXY7CiAgICAgIH0KICAgIH0KICAgIHJldHVybiBlbGVtZW50ICYmIEFycmF5LmlzQXJyYXkoZWxlbWVudC5jaGlsZHJlbikgPyBlbGVtZW50LmNoaWxkcmVuLnJlZHVjZShyZWR1Y2VyLCBbXSkgOiBbXTsKICB9CiAgZnVuY3Rpb24gZmluZENoaWxkRWxlbWVudChlbGVtZW50LCBuYW1lLCBuZXN0ZWQgPSBmYWxzZSkgewogICAgcmV0dXJuIGZpbmRDaGlsZHJlbkVsZW1lbnQoZWxlbWVudCwgbmFtZSwgbmVzdGVkKVswXSB8fCBudWxsOwogIH0KICBmdW5jdGlvbiBnZXRDaGlsZHJlbkVsZW1lbnQoZWxlbWVudCkgewogICAgcmV0dXJuIGVsZW1lbnQgJiYgQXJyYXkuaXNBcnJheShlbGVtZW50LmNoaWxkcmVuKSA/IFsKICAgICAgLi4uZWxlbWVudC5jaGlsZHJlbi5maWx0ZXIoCiAgICAgICAgKGVsKSA9PiBlbCBpbnN0YW5jZW9mIGJyb3dzZXIuWG1sRWxlbWVudAogICAgICApCiAgICBdIDogW107CiAgfQogIGZ1bmN0aW9uIGdldEVsZW1lbnRUZXh0KGVsZW1lbnQpIHsKICAgIGNvbnN0IHRleHROb2RlID0gZWxlbWVudCAmJiBBcnJheS5pc0FycmF5KGVsZW1lbnQuY2hpbGRyZW4pID8gZWxlbWVudC5jaGlsZHJlbi5maW5kKChub2RlKSA9PiBub2RlLnR5cGUgPT09ICJ0ZXh0IikgOiBudWxsOwogICAgcmV0dXJuIHRleHROb2RlID8gdGV4dE5vZGUudGV4dCA6ICIiOwogIH0KICBmdW5jdGlvbiBnZXRFbGVtZW50QXR0cmlidXRlKGVsZW1lbnQsIGF0dHJOYW1lKSB7CiAgICByZXR1cm4gZWxlbWVudCAmJiBlbGVtZW50LmF0dHJpYnV0ZXNbYXR0ck5hbWVdIHx8ICIiOwogIH0KICBjbGFzcyBFbmRwb2ludEVycm9yIGV4dGVuZHMgRXJyb3IgewogICAgY29uc3RydWN0b3IobWVzc2FnZSwgaHR0cFN0YXR1cywgaXNDcm9zc09yaWdpblJlbGF0ZWQpIHsKICAgICAgc3VwZXIobWVzc2FnZSk7CiAgICAgIHRoaXMuaHR0cFN0YXR1cyA9IGh0dHBTdGF0dXM7CiAgICAgIHRoaXMuaXNDcm9zc09yaWdpblJlbGF0ZWQgPSBpc0Nyb3NzT3JpZ2luUmVsYXRlZDsKICAgICAgdGhpcy5uYW1lID0gIkVuZHBvaW50RXJyb3IiOwogICAgfQogIH0KICBjbGFzcyBTZXJ2aWNlRXhjZXB0aW9uRXJyb3IgZXh0ZW5kcyBFcnJvciB7CiAgICAvKioKICAgICAqIENvbnN0cnVjdG9yCiAgICAgKiBAcGFyYW0gbWVzc2FnZSBFcnJvciBtZXNzYWdlCiAgICAgKiBAcGFyYW0gcmVxdWVzdFVybCBVUkwgd2hpY2ggcmVzdWx0ZWQgaW4gdGhlIFNlcnZpY2VFeGNlcHRpb24KICAgICAqIEBwYXJhbSBjb2RlIE9wdGlvbmFsIFNlcnZpY2VFeGNlcHRpb24gY29kZQogICAgICogQHBhcmFtIGxvY2F0b3IgT3B0aW9uYWwgU2VydmljZUV4Y2VwdGlvbiBsb2NhdG9yCiAgICAgKiBAcGFyYW0gcmVzcG9uc2UgT3B0aW9uYWwgcmVzcG9uc2UgY29udGVudCByZWNlaXZlZAogICAgICovCiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlLCByZXF1ZXN0VXJsLCBjb2RlLCBsb2NhdG9yLCByZXNwb25zZSkgewogICAgICBzdXBlcihtZXNzYWdlKTsKICAgICAgdGhpcy5yZXF1ZXN0VXJsID0gcmVxdWVzdFVybDsKICAgICAgdGhpcy5jb2RlID0gY29kZTsKICAgICAgdGhpcy5sb2NhdG9yID0gbG9jYXRvcjsKICAgICAgdGhpcy5yZXNwb25zZSA9IHJlc3BvbnNlOwogICAgICB0aGlzLm5hbWUgPSAiU2VydmljZUV4Y2VwdGlvbkVycm9yIjsKICAgIH0KICB9CiAgZnVuY3Rpb24gcGFyc2Uoc2VydmljZUV4Y2VwdGlvbiwgdXJsKSB7CiAgICBjb25zdCBlcnJvckNvZGUgPSBnZXRFbGVtZW50QXR0cmlidXRlKHNlcnZpY2VFeGNlcHRpb24sICJjb2RlIikgfHwgZ2V0RWxlbWVudEF0dHJpYnV0ZShzZXJ2aWNlRXhjZXB0aW9uLCAiZXhjZXB0aW9uQ29kZSIpOwogICAgY29uc3QgZXJyb3JMb2NhdG9yID0gZ2V0RWxlbWVudEF0dHJpYnV0ZShzZXJ2aWNlRXhjZXB0aW9uLCAibG9jYXRvciIpOwogICAgY29uc3QgdGV4dEVsZW1lbnQgPSBmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2VFeGNlcHRpb24sICJFeGNlcHRpb25UZXh0IikgfHwgc2VydmljZUV4Y2VwdGlvbjsKICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGdldEVsZW1lbnRUZXh0KHRleHRFbGVtZW50KS50cmltKCk7CiAgICByZXR1cm4gbmV3IFNlcnZpY2VFeGNlcHRpb25FcnJvcigKICAgICAgZXJyb3JNZXNzYWdlLAogICAgICB1cmwsCiAgICAgIGVycm9yQ29kZSwKICAgICAgZXJyb3JMb2NhdG9yLAogICAgICBzZXJ2aWNlRXhjZXB0aW9uLmRvY3VtZW50CiAgICApOwogIH0KICBmdW5jdGlvbiBjaGVjayhyZXNwb25zZSwgdXJsKSB7CiAgICBjb25zdCByb290RWwgPSBnZXRSb290RWxlbWVudChyZXNwb25zZSk7CiAgICBjb25zdCByb290RWxOYW1lID0gc3RyaXBOYW1lc3BhY2UoZ2V0RWxlbWVudE5hbWUocm9vdEVsKSk7CiAgICBpZiAocm9vdEVsTmFtZSA9PT0gIlNlcnZpY2VFeGNlcHRpb25SZXBvcnQiKSB7CiAgICAgIGNvbnN0IGVycm9yID0gZmluZENoaWxkRWxlbWVudChyb290RWwsICJTZXJ2aWNlRXhjZXB0aW9uIik7CiAgICAgIGlmIChlcnJvcikgewogICAgICAgIHRocm93IHBhcnNlKGVycm9yLCB1cmwpOwogICAgICB9CiAgICB9CiAgICBpZiAocm9vdEVsTmFtZSA9PT0gIkV4Y2VwdGlvblJlcG9ydCIpIHsKICAgICAgY29uc3QgZXJyb3IgPSBmaW5kQ2hpbGRFbGVtZW50KHJvb3RFbCwgIkV4Y2VwdGlvbiIpOwogICAgICBpZiAoZXJyb3IpIHsKICAgICAgICB0aHJvdyBwYXJzZShlcnJvciwgdXJsKTsKICAgICAgfQogICAgfQogICAgcmV0dXJuIHJlc3BvbnNlOwogIH0KICBmdW5jdGlvbiBlbmNvZGVFcnJvcihlcnJvcikgewogICAgY29uc3QgYmFzZSA9IHsKICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSwKICAgICAgc3RhY2s6IGVycm9yLnN0YWNrLAogICAgICBuYW1lOiBlcnJvci5uYW1lCiAgICB9OwogICAgaWYgKGVycm9yIGluc3RhbmNlb2YgU2VydmljZUV4Y2VwdGlvbkVycm9yKSB7CiAgICAgIHJldHVybiB7CiAgICAgICAgLi4uYmFzZSwKICAgICAgICBjb2RlOiBlcnJvci5jb2RlLAogICAgICAgIGxvY2F0b3I6IGVycm9yLmxvY2F0b3IsCiAgICAgICAgcmVzcG9uc2U6IGVycm9yLnJlc3BvbnNlLAogICAgICAgIHJlcXVlc3RVcmw6IGVycm9yLnJlcXVlc3RVcmwKICAgICAgfTsKICAgIH0KICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVuZHBvaW50RXJyb3IpIHsKICAgICAgcmV0dXJuIHsKICAgICAgICAuLi5iYXNlLAogICAgICAgIGh0dHBTdGF0dXM6IGVycm9yLmh0dHBTdGF0dXMsCiAgICAgICAgaXNDcm9zc09yaWdpblJlbGF0ZWQ6IGVycm9yLmlzQ3Jvc3NPcmlnaW5SZWxhdGVkCiAgICAgIH07CiAgICB9CiAgICByZXR1cm4gYmFzZTsKICB9CiAgY29uc3QgZmFsbGJhY2tFdmVudFRhcmdldCA9IG5ldyBFdmVudFRhcmdldCgpOwogIGZ1bmN0aW9uIGFkZFRhc2tIYW5kbGVyKHRhc2tOYW1lLCBzY29wZSwgaGFuZGxlcikgewogICAgY29uc3QgdXNlV29ya2VyID0gdHlwZW9mIFdvcmtlckdsb2JhbFNjb3BlICE9PSAidW5kZWZpbmVkIjsKICAgIGNvbnN0IGV2ZW50SGFuZGxlciA9IGFzeW5jIChyZXF1ZXN0KSA9PiB7CiAgICAgIGlmIChyZXF1ZXN0LnRhc2tOYW1lID09PSB0YXNrTmFtZSkgewogICAgICAgIGxldCByZXNwb25zZSwgZXJyb3I7CiAgICAgICAgdHJ5IHsKICAgICAgICAgIHJlc3BvbnNlID0gYXdhaXQgaGFuZGxlcihyZXF1ZXN0LnBhcmFtcyk7CiAgICAgICAgfSBjYXRjaCAoZSkgewogICAgICAgICAgZXJyb3IgPSBlbmNvZGVFcnJvcihlKTsKICAgICAgICB9CiAgICAgICAgY29uc3QgbWVzc2FnZSA9ICgKICAgICAgICAgIC8qKiBAdHlwZSB7V29ya2VyUmVzcG9uc2V9ICovCiAgICAgICAgICB7CiAgICAgICAgICAgIHRhc2tOYW1lLAogICAgICAgICAgICByZXF1ZXN0SWQ6IHJlcXVlc3QucmVxdWVzdElkLAogICAgICAgICAgICAuLi5yZXNwb25zZSAmJiB7IHJlc3BvbnNlIH0sCiAgICAgICAgICAgIC4uLmVycm9yICYmIHsgZXJyb3IgfQogICAgICAgICAgfQogICAgICAgICk7CiAgICAgICAgaWYgKHVzZVdvcmtlcikgewogICAgICAgICAgc2NvcGUucG9zdE1lc3NhZ2UobWVzc2FnZSk7CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgIGZhbGxiYWNrRXZlbnRUYXJnZXQuZGlzcGF0Y2hFdmVudCgKICAgICAgICAgICAgbmV3IEN1c3RvbUV2ZW50KCJvZ2MtY2xpZW50LnJlc3BvbnNlIiwgewogICAgICAgICAgICAgIGRldGFpbDogbWVzc2FnZQogICAgICAgICAgICB9KQogICAgICAgICAgKTsKICAgICAgICB9CiAgICAgIH0KICAgIH07CiAgICBpZiAodXNlV29ya2VyKSB7CiAgICAgIHNjb3BlLmFkZEV2ZW50TGlzdGVuZXIoIm1lc3NhZ2UiLCAoZXZlbnQpID0+IGV2ZW50SGFuZGxlcihldmVudC5kYXRhKSk7CiAgICB9IGVsc2UgewogICAgICBmYWxsYmFja0V2ZW50VGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoCiAgICAgICAgIm9nYy1jbGllbnQucmVxdWVzdCIsCiAgICAgICAgKGV2ZW50KSA9PiBldmVudEhhbmRsZXIoZXZlbnQuZGV0YWlsKQogICAgICApOwogICAgfQogIH0KICBjb25zdCBFTkNPRElOR1MgPSBbInV0Zi04IiwgInV0Zi0xNiIsICJpc28tODg1OS0xIl07CiAgY29uc3QgRkFMTEJBQ0tfRU5DT0RJTkcgPSAidXRmLTgiOwogIGZ1bmN0aW9uIGV4dHJhY3RFbmNvZGluZyhjb250ZW50VHlwZSkgewogICAgY29uc3QgbWF0Y2hlcyA9IC9jaGFyc2V0PShbXjtdKykvLmV4ZWMoY29udGVudFR5cGUpOwogICAgcmV0dXJuIG1hdGNoZXMgPyBtYXRjaGVzWzFdIDogbnVsbDsKICB9CiAgZnVuY3Rpb24gZGVjb2RlU3RyaW5nKGJ1ZmZlciwgY29udGVudFR5cGUpIHsKICAgIGNvbnN0IGVuY29kaW5nSGludCA9IGNvbnRlbnRUeXBlID8gZXh0cmFjdEVuY29kaW5nKGNvbnRlbnRUeXBlKSA6IG51bGw7CiAgICBjb25zdCBlbmNvZGluZ0F0dGVtcHRzID0gZW5jb2RpbmdIaW50ID8gW2VuY29kaW5nSGludCwgLi4uRU5DT0RJTkdTXSA6IEVOQ09ESU5HUzsKICAgIGZvciAoY29uc3QgZW5jb2Rpbmcgb2YgZW5jb2RpbmdBdHRlbXB0cykgewogICAgICB0cnkgewogICAgICAgIGNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoZW5jb2RpbmcsIHsgZmF0YWw6IHRydWUgfSk7CiAgICAgICAgcmV0dXJuIGRlY29kZXIuZGVjb2RlKGJ1ZmZlcik7CiAgICAgIH0gY2F0Y2ggKGUpIHsKICAgICAgfQogICAgfQogICAgY29uc29sZS53YXJuKAogICAgICBgW29nYy1jbGllbnRdIFhNTCBkb2N1bWVudCBlbmNvZGluZyBjb3VsZCBub3QgYmUgZGV0ZXJtaW5lZCwgZmFsbGluZyBiYWNrIHRvICR7RkFMTEJBQ0tfRU5DT0RJTkd9LmAKICAgICk7CiAgICByZXR1cm4gbmV3IFRleHREZWNvZGVyKEZBTExCQUNLX0VOQ09ESU5HKS5kZWNvZGUoYnVmZmVyKTsKICB9CiAgY29uc3QgZmV0Y2hQcm9taXNlcyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7CiAgbGV0IGZldGNoT3B0aW9ucyA9IHt9OwogIGZ1bmN0aW9uIHNldEZldGNoT3B0aW9ucyhvcHRpb25zKSB7CiAgICBmZXRjaE9wdGlvbnMgPSBvcHRpb25zOwogIH0KICBmdW5jdGlvbiBnZXRGZXRjaE9wdGlvbnMoKSB7CiAgICByZXR1cm4gZmV0Y2hPcHRpb25zOwogIH0KICBmdW5jdGlvbiBzaGFyZWRGZXRjaCh1cmwsIG1ldGhvZCA9ICJHRVQiLCBhc0pzb24pIHsKICAgIGxldCBmZXRjaEtleSA9IGAke21ldGhvZH0jJHt1cmx9YDsKICAgIGlmIChhc0pzb24pIHsKICAgICAgZmV0Y2hLZXkgPSBgJHttZXRob2R9I2FzSnNvbiMke3VybH1gOwogICAgfQogICAgaWYgKGZldGNoUHJvbWlzZXMuaGFzKGZldGNoS2V5KSkgewogICAgICByZXR1cm4gZmV0Y2hQcm9taXNlcy5nZXQoZmV0Y2hLZXkpOwogICAgfQogICAgY29uc3Qgb3B0aW9ucyA9IHsgLi4uZ2V0RmV0Y2hPcHRpb25zKCkgfTsKICAgIG9wdGlvbnMubWV0aG9kID0gbWV0aG9kOwogICAgaWYgKGFzSnNvbikgewogICAgICBvcHRpb25zLmhlYWRlcnMgPSAiaGVhZGVycyIgaW4gb3B0aW9ucyA/IG9wdGlvbnMuaGVhZGVycyA6IHt9OwogICAgICBvcHRpb25zLmhlYWRlcnNbIkFjY2VwdCJdID0gImFwcGxpY2F0aW9uL2pzb24sYXBwbGljYXRpb24vc2NoZW1hK2pzb24iOwogICAgfQogICAgY29uc3QgcHJvbWlzZSA9IGZldGNoKHVybCwgb3B0aW9ucykuY2F0Y2goKGUpID0+IGUpLnRoZW4oKHJlc3ApID0+IHsKICAgICAgZmV0Y2hQcm9taXNlcy5kZWxldGUoZmV0Y2hLZXkpOwogICAgICByZXR1cm4gcmVzcDsKICAgIH0pOwogICAgZmV0Y2hQcm9taXNlcy5zZXQoZmV0Y2hLZXksIHByb21pc2UpOwogICAgcmV0dXJuIHByb21pc2UudGhlbigocmVzcCkgPT4gewogICAgICBpZiAocmVzcCBpbnN0YW5jZW9mIEVycm9yKQogICAgICAgIHRocm93IHJlc3A7CiAgICAgIHJldHVybiByZXNwLmNsb25lKCk7CiAgICB9KTsKICB9CiAgZnVuY3Rpb24gcXVlcnlYbWxEb2N1bWVudCh1cmwpIHsKICAgIHJldHVybiBzaGFyZWRGZXRjaCh1cmwpLmNhdGNoKAogICAgICAoKSA9PiAoCiAgICAgICAgLy8gYXR0ZW1wdCBhIEhFQUQgdG8gc2VlIGlmIHRoZSBmYWlsdXJlIGNvbWVzIGZyb20gQ09SUyBvciB0aGUgc2VydmljZSBpcyBnZW5lcmFsbHkgdW5yZWFjaGFibGUKICAgICAgICBmZXRjaCh1cmwsIHsgLi4uZ2V0RmV0Y2hPcHRpb25zKCksIG1ldGhvZDogIkhFQUQiLCBtb2RlOiAibm8tY29ycyIgfSkuY2F0Y2goKGVycm9yKSA9PiB7CiAgICAgICAgICB0aHJvdyBuZXcgRW5kcG9pbnRFcnJvcigKICAgICAgICAgICAgYEZldGNoaW5nIHRoZSBkb2N1bWVudCBmYWlsZWQgZWl0aGVyIGR1ZSB0byBuZXR3b3JrIGVycm9ycyBvciB1bnJlYWNoYWJsZSBob3N0LCBlcnJvciBpczogJHtlcnJvci5tZXNzYWdlfWAsCiAgICAgICAgICAgIDAsCiAgICAgICAgICAgIGZhbHNlCiAgICAgICAgICApOwogICAgICAgIH0pLnRoZW4oKCkgPT4gewogICAgICAgICAgdGhyb3cgbmV3IEVuZHBvaW50RXJyb3IoCiAgICAgICAgICAgIGBUaGUgZG9jdW1lbnQgY291bGQgbm90IGJlIGZldGNoZWQgZHVlIHRvIENPUlMgbGltaXRhdGlvbnNgLAogICAgICAgICAgICAwLAogICAgICAgICAgICB0cnVlCiAgICAgICAgICApOwogICAgICAgIH0pCiAgICAgICkKICAgICkudGhlbihhc3luYyAocmVzcCkgPT4gewogICAgICBpZiAoIXJlc3Aub2spIHsKICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcmVzcC50ZXh0KCk7CiAgICAgICAgdGhyb3cgbmV3IEVuZHBvaW50RXJyb3IoCiAgICAgICAgICBgUmVjZWl2ZWQgYW4gZXJyb3Igd2l0aCBjb2RlICR7cmVzcC5zdGF0dXN9OiAke3RleHR9YCwKICAgICAgICAgIHJlc3Auc3RhdHVzLAogICAgICAgICAgZmFsc2UKICAgICAgICApOwogICAgICB9CiAgICAgIGNvbnN0IGJ1ZmZlciA9IGF3YWl0IHJlc3AuYXJyYXlCdWZmZXIoKTsKICAgICAgY29uc3QgY29udGVudFR5cGVIZWFkZXIgPSByZXNwLmhlYWRlcnMuZ2V0KCJDb250ZW50LVR5cGUiKTsKICAgICAgcmV0dXJuIGRlY29kZVN0cmluZyhidWZmZXIsIGNvbnRlbnRUeXBlSGVhZGVyKTsKICAgIH0pLnRoZW4oKHhtbCkgPT4gcGFyc2VYbWxTdHJpbmcoeG1sKSk7CiAgfQogIGZ1bmN0aW9uIHNldFF1ZXJ5UGFyYW1zKHVybCwgcGFyYW1zKSB7CiAgICBjb25zdCBlbmNvZGVkVXJsTWF0Y2ggPSB1cmwubWF0Y2goLyhodHRwcz8lM0ElMkYlMkZbXi9dKykkLyk7CiAgICBpZiAoZW5jb2RlZFVybE1hdGNoKSB7CiAgICAgIGNvbnN0IGVuY29kZWRVcmwgPSBlbmNvZGVkVXJsTWF0Y2hbMV07CiAgICAgIGNvbnN0IG1vZGlmaWVkVXJsID0gc2V0UXVlcnlQYXJhbXMoZGVjb2RlVVJJQ29tcG9uZW50KGVuY29kZWRVcmwpLCBwYXJhbXMpOwogICAgICByZXR1cm4gdXJsLnJlcGxhY2UoZW5jb2RlZFVybCwgZW5jb2RlVVJJQ29tcG9uZW50KG1vZGlmaWVkVXJsKSk7CiAgICB9CiAgICBjb25zdCB1cmxPYmogPSBuZXcgVVJMKHVybCk7CiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMocGFyYW1zKTsKICAgIGNvbnN0IGtleXNMb3dlciA9IGtleXMubWFwKChrZXkpID0+IGtleS50b0xvd2VyQ2FzZSgpKTsKICAgIGNvbnN0IHRvRGVsZXRlID0gW107CiAgICBmb3IgKGNvbnN0IHBhcmFtIG9mIHVybE9iai5zZWFyY2hQYXJhbXMua2V5cygpKSB7CiAgICAgIGlmIChrZXlzTG93ZXIuaW5kZXhPZihwYXJhbS50b0xvd2VyQ2FzZSgpKSA+IC0xKSB7CiAgICAgICAgdG9EZWxldGUucHVzaChwYXJhbSk7CiAgICAgIH0KICAgIH0KICAgIHRvRGVsZXRlLm1hcCgocGFyYW0pID0+IHVybE9iai5zZWFyY2hQYXJhbXMuZGVsZXRlKHBhcmFtKSk7CiAgICBrZXlzLmZvckVhY2goCiAgICAgIChrZXkpID0+IHVybE9iai5zZWFyY2hQYXJhbXMuc2V0KAogICAgICAgIGtleSwKICAgICAgICBwYXJhbXNba2V5XSA9PT0gdHJ1ZSA/ICIiIDogcGFyYW1zW2tleV0KICAgICAgKQogICAgKTsKICAgIHJldHVybiB1cmxPYmoudG9TdHJpbmcoKTsKICB9CiAgY29uc3QgTGF0TG9uQ3JzTGlzdCA9IFsKICAgICJFUFNHOjQwNDYiLAogICAgLy8gUkdSREMgMjAwNQogICAgIkVQU0c6NDA3NSIsCiAgICAvLyBTUkVGOTgKICAgICJFUFNHOjQxMjAiLAogICAgLy8gR3JlZWsKICAgICJFUFNHOjQxMjIiLAogICAgLy8gQVRTNzcKICAgICJFUFNHOjQxMjQiLAogICAgLy8gUlQ5MAogICAgIkVQU0c6NDEyNiIsCiAgICAvLyBMS1M5NCAoRVRSUzg5KQogICAgIkVQU0c6NDE0OSIsCiAgICAvLyBDSDE5MDMKICAgICJFUFNHOjQxNTEiLAogICAgLy8gQ0hUUkY5NQogICAgIkVQU0c6NDE1MyIsCiAgICAvLyBSYXNzYWRpcmFuCiAgICAiRVBTRzo0MTU1IiwKICAgIC8vIERhYm9sYSAxOTgxCiAgICAiRVBTRzo0MTU3IiwKICAgIC8vIE1vdW50IERpbGxvbgogICAgIkVQU0c6NDE1OSIsCiAgICAvLyBFTEQ3OQogICAgIkVQU0c6NDE2MSIsCiAgICAvLyBQYW1wYSBkZWwgQ2FzdGlsbG8KICAgICJFUFNHOjQxNjMiLAogICAgLy8gWWVtZW4gTkdOOTYKICAgICJFUFNHOjQxNjUiLAogICAgLy8gQmlzc2F1CiAgICAiRVBTRzo0MTY3IiwKICAgIC8vIE5aR0QyMDAwCiAgICAiRVBTRzo0MTY5IiwKICAgIC8vIEFtZXJpY2FuIFNhbW9hIDE5NjIKICAgICJFUFNHOjQxNzEiLAogICAgLy8gUkdGOTMKICAgICJFUFNHOjQxNzMiLAogICAgLy8gSVJFTkVUOTUKICAgICJFUFNHOjQxNzUiLAogICAgLy8gU2llcnJhIExlb25lIDE5NjgKICAgICJFUFNHOjQxNzgiLAogICAgLy8gUHVsa292byAxOTQyKDgzKQogICAgIkVQU0c6NDE4MCIsCiAgICAvLyBFU1Q5NwogICAgIkVQU0c6NDE4MiIsCiAgICAvLyBBem9yZXMgT2NjaWRlbnRhbCAxOTM5CiAgICAiRVBTRzo0MTg0IiwKICAgIC8vIEF6b3JlcyBPcmllbnRhbCAxOTQwCiAgICAiRVBTRzo0MTg4IiwKICAgIC8vIE9TTkkgMTk1MgogICAgIkVQU0c6NDE5MCIsCiAgICAvLyBQT1NHQVIgOTgKICAgICJFUFNHOjQxOTEiLAogICAgLy8gQWxiYW5pYW4gMTk4NwogICAgIkVQU0c6NDE5NiIsCiAgICAvLyBBbW1hc3NhbGlrIDE5NTgKICAgICJFUFNHOjQxOTgiLAogICAgLy8gS291c3NlcmkKICAgICJFUFNHOjQyMDIiLAogICAgLy8gQUdENjYKICAgICJFUFNHOjQyMTAiLAogICAgLy8gQXJjIDE5NjAKICAgICJFUFNHOjQyMTEiLAogICAgLy8gQmF0YXZpYQogICAgIkVQU0c6NDIxNCIsCiAgICAvLyBCZWlqaW5nIDE5NTQKICAgICJFUFNHOjQyMjYiLAogICAgLy8gQ290ZSBkJ0l2b2lyZQogICAgIkVQU0c6NDIyOSIsCiAgICAvLyBFZ3lwdCAxOTA3CiAgICAiRVBTRzo0MjMxIiwKICAgIC8vIEVEODcKICAgICJFUFNHOjQyMzMiLAogICAgLy8gR2FuZGFqaWthIDE5NzAKICAgICJFUFNHOjQyMzYiLAogICAgLy8gSHUgVHp1IFNoYW4gMTk1MAogICAgIkVQU0c6NDIzOCIsCiAgICAvLyBJRDc0CiAgICAiRVBTRzo0MjQwIiwKICAgIC8vIEluZGlhbiAxOTc1CiAgICAiRVBTRzo0MjQyIiwKICAgIC8vIEpBRDY5CiAgICAiRVBTRzo0MjQ0IiwKICAgIC8vIEthbmRhd2FsYQogICAgIkVQU0c6NDI0NiIsCiAgICAvLyBLT0MKICAgICJFUFNHOjQyNDgiLAogICAgLy8gUFNBRDU2CiAgICAiRVBTRzo0MjUwIiwKICAgIC8vIExlaWdvbgogICAgIkVQU0c6NDI1MiIsCiAgICAvLyBMb21lCiAgICAiRVBTRzo0MjU1IiwKICAgIC8vIEhlcmF0IE5vcnRoCiAgICAiRVBTRzo0MjU4IiwKICAgIC8vIEVUUlM4OQogICAgIkVQU0c6NDI2MSIsCiAgICAvLyBNZXJjaGljaAogICAgIkVQU0c6NDI2NCIsCiAgICAvLyBNaGFzdAogICAgIkVQU0c6NDI2NyIsCiAgICAvLyBOQUQyNwogICAgIkVQU0c6NDI3MCIsCiAgICAvLyBOYWhyd2FuIDE5NjcKICAgICJFUFNHOjQyNzMiLAogICAgLy8gTkdPIDE5NDgKICAgICJFUFNHOjQyNzYiLAogICAgLy8gTlNXQyA5Wi0yCiAgICAiRVBTRzo0Mjc5IiwKICAgIC8vIE9TKFNOKTgwCiAgICAiRVBTRzo0MjgxIiwKICAgIC8vIFBhbGVzdGluZSAxOTIzCiAgICAiRVBTRzo0Mjg0IiwKICAgIC8vIFB1bGtvdm8gMTk0MgogICAgIkVQU0c6NDI4NiIsCiAgICAvLyBRYXRhciAxOTQ4CiAgICAiRVBTRzo0Mjg4IiwKICAgIC8vIExvbWEgUXVpbnRhbmEKICAgICJFUFNHOjQyOTIiLAogICAgLy8gU2FwcGVyIEhpbGwgMTk0MwogICAgIkVQU0c6NDI5NSIsCiAgICAvLyBTZXJpbmR1bmcKICAgICJFUFNHOjQyOTciLAogICAgLy8gVGFuYW5hcml2ZQogICAgIkVQU0c6NDI5OSIsCiAgICAvLyBUTTY1CiAgICAiRVBTRzo0MzAyIiwKICAgIC8vIFRyaW5pZGFkIDE5MDMKICAgICJFUFNHOjQzMjQiLAogICAgLy8gV0dTIDcyQkUKICAgICJFUFNHOjQzMjYiCiAgICAvLyBXR1MgODQKICBdOwogIGZ1bmN0aW9uIGhhc0ludmVydGVkQ29vcmRpbmF0ZXMoY3JzTmFtZSkgewogICAgcmV0dXJuIExhdExvbkNyc0xpc3QuaW5kZXhPZihzaW1wbGlmeUVwc2dVcm4oY3JzTmFtZSkpID4gLTE7CiAgfQogIGZ1bmN0aW9uIHNpbXBsaWZ5RXBzZ1VybihmdWxsQ3JzTmFtZSkgewogICAgaWYgKC9edXJuOig/OngtKT9vZ2M6ZGVmOmNyczplcHNnOi8udGVzdChmdWxsQ3JzTmFtZS50b0xvd2VyQ2FzZSgpKSkgewogICAgICBjb25zdCBjb2RlID0gLyhbMC05XSspJC8uZXhlYyhmdWxsQ3JzTmFtZSlbMV07CiAgICAgIHJldHVybiBgRVBTRzoke2NvZGV9YDsKICAgIH0KICAgIHJldHVybiBmdWxsQ3JzTmFtZTsKICB9CiAgZnVuY3Rpb24gcmVhZE9wZXJhdGlvblVybHNGcm9tQ2FwYWJpbGl0aWVzJDEoY2FwYWJpbGl0aWVzRG9jKSB7CiAgICBjb25zdCB1cmxzID0ge307CiAgICBjb25zdCBjYXBhYmlsaXR5ID0gZmluZENoaWxkRWxlbWVudCgKICAgICAgZ2V0Um9vdEVsZW1lbnQoY2FwYWJpbGl0aWVzRG9jKSwKICAgICAgIkNhcGFiaWxpdHkiCiAgICApOwogICAgY29uc3QgcmVxdWVzdCA9IGZpbmRDaGlsZEVsZW1lbnQoY2FwYWJpbGl0eSwgIlJlcXVlc3QiKTsKICAgIGdldENoaWxkcmVuRWxlbWVudChyZXF1ZXN0KS5mb3JFYWNoKChvcGVyYXRpb24pID0+IHsKICAgICAgY29uc3Qgb3BlcmF0aW9uTmFtZSA9IHN0cmlwTmFtZXNwYWNlKGdldEVsZW1lbnROYW1lKG9wZXJhdGlvbikpOwogICAgICB1cmxzW29wZXJhdGlvbk5hbWVdID0gcGFyc2VPcGVyYXRpb24ob3BlcmF0aW9uKTsKICAgIH0pOwogICAgcmV0dXJuIHVybHM7CiAgfQogIGZ1bmN0aW9uIHJlYWRWZXJzaW9uRnJvbUNhcGFiaWxpdGllcyQxKGNhcGFiaWxpdGllc0RvYykgewogICAgcmV0dXJuIGdldFJvb3RFbGVtZW50KGNhcGFiaWxpdGllc0RvYykuYXR0cmlidXRlc1sidmVyc2lvbiJdOwogIH0KICBmdW5jdGlvbiByZWFkTGF5ZXJzRnJvbUNhcGFiaWxpdGllcyQxKGNhcGFiaWxpdGllc0RvYykgewogICAgY29uc3QgdmVyc2lvbiA9IHJlYWRWZXJzaW9uRnJvbUNhcGFiaWxpdGllcyQxKGNhcGFiaWxpdGllc0RvYyk7CiAgICBjb25zdCBjYXBhYmlsaXR5ID0gZmluZENoaWxkRWxlbWVudCgKICAgICAgZ2V0Um9vdEVsZW1lbnQoY2FwYWJpbGl0aWVzRG9jKSwKICAgICAgIkNhcGFiaWxpdHkiCiAgICApOwogICAgcmV0dXJuIGZpbmRDaGlsZHJlbkVsZW1lbnQoY2FwYWJpbGl0eSwgIkxheWVyIikubWFwKAogICAgICAobGF5ZXJFbCkgPT4gcGFyc2VMYXllcihsYXllckVsLCB2ZXJzaW9uKQogICAgKTsKICB9CiAgZnVuY3Rpb24gcmVhZE91dHB1dEZvcm1hdHNGcm9tQ2FwYWJpbGl0aWVzJDEoY2FwYWJpbGl0aWVzRG9jKSB7CiAgICBjb25zdCBjYXBhYmlsaXR5ID0gZmluZENoaWxkRWxlbWVudCgKICAgICAgZ2V0Um9vdEVsZW1lbnQoY2FwYWJpbGl0aWVzRG9jKSwKICAgICAgIkNhcGFiaWxpdHkiCiAgICApOwogICAgY29uc3QgZ2V0TWFwID0gZmluZENoaWxkRWxlbWVudCgKICAgICAgZmluZENoaWxkRWxlbWVudChjYXBhYmlsaXR5LCAiUmVxdWVzdCIpLAogICAgICAiR2V0TWFwIgogICAgKTsKICAgIGNvbnN0IG91dHB1dEZvcm1hdHMgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KGdldE1hcCwgIkZvcm1hdCIpLm1hcCgKICAgICAgZ2V0RWxlbWVudFRleHQKICAgICk7CiAgICByZXR1cm4gb3V0cHV0Rm9ybWF0czsKICB9CiAgZnVuY3Rpb24gcmVhZEluZm9Gb3JtYXRzRnJvbUNhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXNEb2MpIHsKICAgIGNvbnN0IGNhcGFiaWxpdHkgPSBmaW5kQ2hpbGRFbGVtZW50KAogICAgICBnZXRSb290RWxlbWVudChjYXBhYmlsaXRpZXNEb2MpLAogICAgICAiQ2FwYWJpbGl0eSIKICAgICk7CiAgICBjb25zdCBnZXRGZWF0dXJlSW5mbyA9IGZpbmRDaGlsZEVsZW1lbnQoCiAgICAgIGZpbmRDaGlsZEVsZW1lbnQoY2FwYWJpbGl0eSwgIlJlcXVlc3QiKSwKICAgICAgIkdldEZlYXR1cmVJbmZvIgogICAgKTsKICAgIGNvbnN0IG91dHB1dEZvcm1hdHMgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KGdldEZlYXR1cmVJbmZvLCAiRm9ybWF0IikubWFwKAogICAgICBnZXRFbGVtZW50VGV4dAogICAgKTsKICAgIHJldHVybiBvdXRwdXRGb3JtYXRzOwogIH0KICBmdW5jdGlvbiByZWFkRXhjZXB0aW9uRm9ybWF0c0Zyb21DYXBhYmlsaXRpZXMoY2FwYWJpbGl0aWVzRG9jKSB7CiAgICBjb25zdCBjYXBhYmlsaXR5ID0gZmluZENoaWxkRWxlbWVudCgKICAgICAgZ2V0Um9vdEVsZW1lbnQoY2FwYWJpbGl0aWVzRG9jKSwKICAgICAgIkNhcGFiaWxpdHkiCiAgICApOwogICAgY29uc3QgZXhjZXB0aW9uID0gZmluZENoaWxkRWxlbWVudChjYXBhYmlsaXR5LCAiRXhjZXB0aW9uIik7CiAgICBjb25zdCBleGNlcHRpb25Gb3JtYXRzID0gZmluZENoaWxkcmVuRWxlbWVudChleGNlcHRpb24sICJGb3JtYXQiKS5tYXAoCiAgICAgIGdldEVsZW1lbnRUZXh0CiAgICApOwogICAgcmV0dXJuIGV4Y2VwdGlvbkZvcm1hdHM7CiAgfQogIGZ1bmN0aW9uIHJlYWRJbmZvRnJvbUNhcGFiaWxpdGllcyQyKGNhcGFiaWxpdGllc0RvYykgewogICAgY29uc3Qgc2VydmljZSA9IGZpbmRDaGlsZEVsZW1lbnQoZ2V0Um9vdEVsZW1lbnQoY2FwYWJpbGl0aWVzRG9jKSwgIlNlcnZpY2UiKTsKICAgIGNvbnN0IG91dHB1dEZvcm1hdHMgPSByZWFkT3V0cHV0Rm9ybWF0c0Zyb21DYXBhYmlsaXRpZXMkMShjYXBhYmlsaXRpZXNEb2MpOwogICAgY29uc3QgaW5mb0Zvcm1hdHMgPSByZWFkSW5mb0Zvcm1hdHNGcm9tQ2FwYWJpbGl0aWVzKGNhcGFiaWxpdGllc0RvYyk7CiAgICBjb25zdCBleGNlcHRpb25Gb3JtYXRzID0gcmVhZEV4Y2VwdGlvbkZvcm1hdHNGcm9tQ2FwYWJpbGl0aWVzKGNhcGFiaWxpdGllc0RvYyk7CiAgICBjb25zdCBrZXl3b3JkcyA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoCiAgICAgIGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZSwgIktleXdvcmRMaXN0IiksCiAgICAgICJLZXl3b3JkIgogICAgKS5tYXAoZ2V0RWxlbWVudFRleHQpLmZpbHRlcigodiwgaSwgYXJyKSA9PiBhcnIuaW5kZXhPZih2KSA9PT0gaSk7CiAgICBjb25zdCBwcm92aWRlciA9IHJlYWRQcm92aWRlckZyb21DYXBhYmlsaXRpZXMkMShjYXBhYmlsaXRpZXNEb2MpOwogICAgcmV0dXJuIHsKICAgICAgdGl0bGU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZSwgIlRpdGxlIikpLAogICAgICBuYW1lOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2UsICJOYW1lIikpLAogICAgICBhYnN0cmFjdDogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChzZXJ2aWNlLCAiQWJzdHJhY3QiKSksCiAgICAgIG91dHB1dEZvcm1hdHMsCiAgICAgIGluZm9Gb3JtYXRzLAogICAgICBleGNlcHRpb25Gb3JtYXRzLAogICAgICBmZWVzOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2UsICJGZWVzIikpLAogICAgICBjb25zdHJhaW50czogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChzZXJ2aWNlLCAiQWNjZXNzQ29uc3RyYWludHMiKSksCiAgICAgIHByb3ZpZGVyLAogICAgICBrZXl3b3JkcwogICAgfTsKICB9CiAgZnVuY3Rpb24gcGFyc2VPcGVyYXRpb24ob3BlcmF0aW9uKSB7CiAgICBjb25zdCB1cmxzID0ge307CiAgICBjb25zdCBkY3BUeXBlID0gZmluZENoaWxkcmVuRWxlbWVudChvcGVyYXRpb24sICJEQ1BUeXBlIik7CiAgICBjb25zdCBodHRwID0gZGNwVHlwZS5mbGF0TWFwKChkKSA9PiBmaW5kQ2hpbGRFbGVtZW50KGQsICJIVFRQIikpOwogICAgY29uc3QgbWV0aG9kcyA9IGh0dHAuZmxhdE1hcCgoaCkgPT4gZ2V0Q2hpbGRyZW5FbGVtZW50KGgpKTsKICAgIG1ldGhvZHMuZm9yRWFjaCgobWV0aG9kKSA9PiB7CiAgICAgIGNvbnN0IG9ubGluZVJlc291cmNlID0gZmluZENoaWxkRWxlbWVudChtZXRob2QsICJPbmxpbmVSZXNvdXJjZSIpOwogICAgICBjb25zdCBtZXRob2ROYW1lID0gc3RyaXBOYW1lc3BhY2UoZ2V0RWxlbWVudE5hbWUobWV0aG9kKSk7CiAgICAgIHVybHNbbWV0aG9kTmFtZV0gPSBnZXRFbGVtZW50QXR0cmlidXRlKG9ubGluZVJlc291cmNlLCAieGxpbms6aHJlZiIpOwogICAgfSk7CiAgICByZXR1cm4gdXJsczsKICB9CiAgZnVuY3Rpb24gcGFyc2VMYXllcihsYXllckVsLCB2ZXJzaW9uLCBpbmhlcml0ZWRTcnMgPSBbXSwgaW5oZXJpdGVkU3R5bGVzID0gW10sIGluaGVyaXRlZEF0dHJpYnV0aW9uID0gbnVsbCwgaW5oZXJpdGVkQm91bmRpbmdCb3hlcyA9IG51bGwsIGluaGVyaXRlZE1heFNjYWxlRGVub20gPSBudWxsLCBpbmhlcml0ZWRNaW5TY2FsZURlbm9tID0gbnVsbCkgewogICAgY29uc3Qgc3JzVGFnID0gdmVyc2lvbiA9PT0gIjEuMy4wIiA/ICJDUlMiIDogIlNSUyI7CiAgICBjb25zdCBzcnNMaXN0ID0gZmluZENoaWxkcmVuRWxlbWVudChsYXllckVsLCBzcnNUYWcpLm1hcChnZXRFbGVtZW50VGV4dCk7CiAgICBjb25zdCBhdmFpbGFibGVDcnMgPSBzcnNMaXN0Lmxlbmd0aCA+IDAgPyBzcnNMaXN0IDogaW5oZXJpdGVkU3JzOwogICAgY29uc3QgbGF5ZXJTdHlsZXMgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KGxheWVyRWwsICJTdHlsZSIpLm1hcCgKICAgICAgcGFyc2VMYXllclN0eWxlCiAgICApOwogICAgY29uc3Qgc3R5bGVzID0gbGF5ZXJTdHlsZXMubGVuZ3RoID4gMCA/IGxheWVyU3R5bGVzIDogaW5oZXJpdGVkU3R5bGVzOwogICAgZnVuY3Rpb24gcGFyc2VCQm94MihiYm94RWwpIHsKICAgICAgY29uc3Qgc3JzID0gZ2V0RWxlbWVudEF0dHJpYnV0ZShiYm94RWwsIHNyc1RhZyk7CiAgICAgIGNvbnN0IGF0dHJzID0gaGFzSW52ZXJ0ZWRDb29yZGluYXRlcyhzcnMpICYmIHZlcnNpb24gPT09ICIxLjMuMCIgPyBbIm1pbnkiLCAibWlueCIsICJtYXh5IiwgIm1heHgiXSA6IFsibWlueCIsICJtaW55IiwgIm1heHgiLCAibWF4eSJdOwogICAgICByZXR1cm4gYXR0cnMubWFwKChuYW1lKSA9PiBnZXRFbGVtZW50QXR0cmlidXRlKGJib3hFbCwgbmFtZSkpOwogICAgfQogICAgZnVuY3Rpb24gcGFyc2VFeEdlb2dyYXBoaWNCb3VuZGluZ0JveChiYm94RWwpIHsKICAgICAgcmV0dXJuIFsKICAgICAgICAid2VzdEJvdW5kTG9uZ2l0dWRlIiwKICAgICAgICAic291dGhCb3VuZExhdGl0dWRlIiwKICAgICAgICAiZWFzdEJvdW5kTG9uZ2l0dWRlIiwKICAgICAgICAibm9ydGhCb3VuZExhdGl0dWRlIgogICAgICBdLm1hcCgobmFtZSkgPT4gZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChiYm94RWwsIG5hbWUpKSk7CiAgICB9CiAgICBmdW5jdGlvbiBwYXJzZUxhdExvbkJvdW5kaW5nQm94KGJib3hFbCkgewogICAgICByZXR1cm4gWyJtaW54IiwgIm1pbnkiLCAibWF4eCIsICJtYXh5Il0ubWFwKAogICAgICAgIChuYW1lKSA9PiBnZXRFbGVtZW50QXR0cmlidXRlKGJib3hFbCwgbmFtZSkKICAgICAgKTsKICAgIH0KICAgIGZ1bmN0aW9uIHBhcnNlU2NhbGVIaW50VmFsdWUodGV4dFZhbHVlLCBkZWZhdWx0VmFsdWUpIHsKICAgICAgaWYgKHRleHRWYWx1ZSA9PT0gIiIpIHsKICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlOwogICAgICB9CiAgICAgIHJldHVybiBNYXRoLnNxcnQoMC41ICogcGFyc2VGbG9hdCh0ZXh0VmFsdWUpICoqIDIpIC8gMjhlLTU7CiAgICB9CiAgICBmdW5jdGlvbiBwYXJzZVNjYWxlSGludCgpIHsKICAgICAgY29uc3Qgc2NhbGVIaW50ID0gZmluZENoaWxkRWxlbWVudChsYXllckVsLCAiU2NhbGVIaW50Iik7CiAgICAgIGlmICghc2NhbGVIaW50KSB7CiAgICAgICAgcmV0dXJuIFtpbmhlcml0ZWRNaW5TY2FsZURlbm9tLCBpbmhlcml0ZWRNYXhTY2FsZURlbm9tXTsKICAgICAgfQogICAgICBjb25zdCBtaW4gPSBnZXRFbGVtZW50QXR0cmlidXRlKHNjYWxlSGludCwgIm1pbiIpOwogICAgICBjb25zdCBtYXggPSBnZXRFbGVtZW50QXR0cmlidXRlKHNjYWxlSGludCwgIm1heCIpOwogICAgICByZXR1cm4gWwogICAgICAgIHBhcnNlU2NhbGVIaW50VmFsdWUobWluLCBpbmhlcml0ZWRNaW5TY2FsZURlbm9tKSwKICAgICAgICBwYXJzZVNjYWxlSGludFZhbHVlKG1heCwgaW5oZXJpdGVkTWF4U2NhbGVEZW5vbSkKICAgICAgXTsKICAgIH0KICAgIGZ1bmN0aW9uIHBhcnNlU2NhbGVEZW5vbWluYXRvcihuYW1lLCBpbmhlcml0ZWRWYWx1ZSkgewogICAgICBjb25zdCB0ZXh0VmFsdWUgPSBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KGxheWVyRWwsIG5hbWUpKTsKICAgICAgcmV0dXJuIHRleHRWYWx1ZSA9PT0gIiIgPyBpbmhlcml0ZWRWYWx1ZSA6IHBhcnNlRmxvYXQodGV4dFZhbHVlKTsKICAgIH0KICAgIGNvbnN0IGF0dHJpYnV0aW9uRWwgPSBmaW5kQ2hpbGRFbGVtZW50KGxheWVyRWwsICJBdHRyaWJ1dGlvbiIpOwogICAgY29uc3QgYXR0cmlidXRpb24gPSBhdHRyaWJ1dGlvbkVsICE9PSBudWxsID8gcGFyc2VMYXllckF0dHJpYnV0aW9uKGF0dHJpYnV0aW9uRWwpIDogaW5oZXJpdGVkQXR0cmlidXRpb247CiAgICBjb25zdCBsYXRMb25CYm94RWwgPSB2ZXJzaW9uID09PSAiMS4zLjAiID8gZmluZENoaWxkRWxlbWVudChsYXllckVsLCAiRVhfR2VvZ3JhcGhpY0JvdW5kaW5nQm94IikgOiBmaW5kQ2hpbGRFbGVtZW50KGxheWVyRWwsICJMYXRMb25Cb3VuZGluZ0JveCIpOwogICAgY29uc3QgYmFzZUJvdW5kaW5nQm94ID0ge307CiAgICBpZiAobGF0TG9uQmJveEVsKSB7CiAgICAgIGJhc2VCb3VuZGluZ0JveFsiRVBTRzo0MzI2Il0gPSB2ZXJzaW9uID09PSAiMS4zLjAiID8gcGFyc2VFeEdlb2dyYXBoaWNCb3VuZGluZ0JveChsYXRMb25CYm94RWwpIDogcGFyc2VMYXRMb25Cb3VuZGluZ0JveChsYXRMb25CYm94RWwpOwogICAgfQogICAgbGV0IGJvdW5kaW5nQm94ZXMgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KGxheWVyRWwsICJCb3VuZGluZ0JveCIpLnJlZHVjZSgKICAgICAgKHByZXYsIGJib3hFbCkgPT4gKHsKICAgICAgICAuLi5wcmV2LAogICAgICAgIFtnZXRFbGVtZW50QXR0cmlidXRlKGJib3hFbCwgc3JzVGFnKV06IHBhcnNlQkJveDIoYmJveEVsKQogICAgICB9KSwKICAgICAgYmFzZUJvdW5kaW5nQm94CiAgICApOwogICAgYm91bmRpbmdCb3hlcyA9IE9iamVjdC5rZXlzKGJvdW5kaW5nQm94ZXMpLmxlbmd0aCA+IDAgfHwgaW5oZXJpdGVkQm91bmRpbmdCb3hlcyA9PT0gbnVsbCA/IGJvdW5kaW5nQm94ZXMgOiBpbmhlcml0ZWRCb3VuZGluZ0JveGVzOwogICAgY29uc3QgcXVlcnlhYmxlID0gbGF5ZXJFbC5hdHRyaWJ1dGVzLnF1ZXJ5YWJsZSA9PT0gIjEiIHx8IGxheWVyRWwuYXR0cmlidXRlcy5xdWVyeWFibGUgPT09ICJ0cnVlIiA/IHRydWUgOiBmYWxzZTsKICAgIGNvbnN0IG9wYXF1ZSA9IGxheWVyRWwuYXR0cmlidXRlcy5vcGFxdWUgPT09ICIxIiB8fCBsYXllckVsLmF0dHJpYnV0ZXMub3BhcXVlID09PSAidHJ1ZSIgPyB0cnVlIDogZmFsc2U7CiAgICBjb25zdCBrZXl3b3JkcyA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoCiAgICAgIGZpbmRDaGlsZEVsZW1lbnQobGF5ZXJFbCwgIktleXdvcmRMaXN0IiksCiAgICAgICJLZXl3b3JkIgogICAgKS5tYXAoZ2V0RWxlbWVudFRleHQpLmZpbHRlcigodiwgaSwgYXJyKSA9PiBhcnIuaW5kZXhPZih2KSA9PT0gaSk7CiAgICBsZXQgbWluU2NhbGVEZW5vbWluYXRvciwgbWF4U2NhbGVEZW5vbWluYXRvcjsKICAgIGlmICh2ZXJzaW9uID09PSAiMS4zLjAiKSB7CiAgICAgIG1pblNjYWxlRGVub21pbmF0b3IgPSBwYXJzZVNjYWxlRGVub21pbmF0b3IoCiAgICAgICAgIk1pblNjYWxlRGVub21pbmF0b3IiLAogICAgICAgIGluaGVyaXRlZE1pblNjYWxlRGVub20KICAgICAgKTsKICAgICAgbWF4U2NhbGVEZW5vbWluYXRvciA9IHBhcnNlU2NhbGVEZW5vbWluYXRvcigKICAgICAgICAiTWF4U2NhbGVEZW5vbWluYXRvciIsCiAgICAgICAgaW5oZXJpdGVkTWF4U2NhbGVEZW5vbQogICAgICApOwogICAgfSBlbHNlIHsKICAgICAgW21pblNjYWxlRGVub21pbmF0b3IsIG1heFNjYWxlRGVub21pbmF0b3JdID0gcGFyc2VTY2FsZUhpbnQoKTsKICAgIH0KICAgIGNvbnN0IG1ldGFkYXRhID0gZmluZENoaWxkcmVuRWxlbWVudChsYXllckVsLCAiTWV0YWRhdGFVUkwiKS5tYXAoCiAgICAgIChtZXRhZGF0YVVybEVsKSA9PiAoewogICAgICAgIHR5cGU6IGdldEVsZW1lbnRBdHRyaWJ1dGUobWV0YWRhdGFVcmxFbCwgInR5cGUiKSwKICAgICAgICBmb3JtYXQ6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQobWV0YWRhdGFVcmxFbCwgIkZvcm1hdCIpKSwKICAgICAgICB1cmw6IGdldEVsZW1lbnRBdHRyaWJ1dGUoCiAgICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KG1ldGFkYXRhVXJsRWwsICJPbmxpbmVSZXNvdXJjZSIpLAogICAgICAgICAgInhsaW5rOmhyZWYiCiAgICAgICAgKQogICAgICB9KQogICAgKTsKICAgIGNvbnN0IGNoaWxkcmVuID0gZmluZENoaWxkcmVuRWxlbWVudChsYXllckVsLCAiTGF5ZXIiKS5tYXAoCiAgICAgIChsYXllcikgPT4gcGFyc2VMYXllcigKICAgICAgICBsYXllciwKICAgICAgICB2ZXJzaW9uLAogICAgICAgIGF2YWlsYWJsZUNycywKICAgICAgICBzdHlsZXMsCiAgICAgICAgYXR0cmlidXRpb24sCiAgICAgICAgYm91bmRpbmdCb3hlcywKICAgICAgICBtYXhTY2FsZURlbm9taW5hdG9yLAogICAgICAgIG1pblNjYWxlRGVub21pbmF0b3IKICAgICAgKQogICAgKTsKICAgIHJldHVybiB7CiAgICAgIG5hbWU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQobGF5ZXJFbCwgIk5hbWUiKSksCiAgICAgIHRpdGxlOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KGxheWVyRWwsICJUaXRsZSIpKSwKICAgICAgYWJzdHJhY3Q6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQobGF5ZXJFbCwgIkFic3RyYWN0IikpLAogICAgICBhdmFpbGFibGVDcnMsCiAgICAgIHN0eWxlcywKICAgICAgYXR0cmlidXRpb24sCiAgICAgIGJvdW5kaW5nQm94ZXMsCiAgICAgIGtleXdvcmRzLAogICAgICBxdWVyeWFibGUsCiAgICAgIG9wYXF1ZSwKICAgICAgLi4ubWluU2NhbGVEZW5vbWluYXRvciAhPT0gbnVsbCA/IHsgbWluU2NhbGVEZW5vbWluYXRvciB9IDoge30sCiAgICAgIC4uLm1heFNjYWxlRGVub21pbmF0b3IgIT09IG51bGwgPyB7IG1heFNjYWxlRGVub21pbmF0b3IgfSA6IHt9LAogICAgICAuLi5tZXRhZGF0YS5sZW5ndGggJiYgeyBtZXRhZGF0YSB9LAogICAgICAuLi5jaGlsZHJlbi5sZW5ndGggJiYgeyBjaGlsZHJlbiB9CiAgICB9OwogIH0KICBmdW5jdGlvbiBwYXJzZUxheWVyU3R5bGUoc3R5bGVFbCkgewogICAgY29uc3QgbGVnZW5kVXJsID0gZ2V0RWxlbWVudEF0dHJpYnV0ZSgKICAgICAgZmluZENoaWxkRWxlbWVudChmaW5kQ2hpbGRFbGVtZW50KHN0eWxlRWwsICJMZWdlbmRVUkwiKSwgIk9ubGluZVJlc291cmNlIiksCiAgICAgICJ4bGluazpocmVmIgogICAgKTsKICAgIGNvbnN0IGFic3RyYWN0ID0gZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChzdHlsZUVsLCAiQWJzdHJhY3QiKSk7CiAgICByZXR1cm4gewogICAgICBuYW1lOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KHN0eWxlRWwsICJOYW1lIikpLAogICAgICB0aXRsZTogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChzdHlsZUVsLCAiVGl0bGUiKSksCiAgICAgIC4uLmFic3RyYWN0ICYmIHsgYWJzdHJhY3QgfSwKICAgICAgLi4ubGVnZW5kVXJsICYmIHsgbGVnZW5kVXJsIH0KICAgIH07CiAgfQogIGZ1bmN0aW9uIHBhcnNlTGF5ZXJBdHRyaWJ1dGlvbihhdHRyaWJ1dGlvbkVsKSB7CiAgICBjb25zdCBsb2dvVXJsID0gZ2V0RWxlbWVudEF0dHJpYnV0ZSgKICAgICAgZmluZENoaWxkRWxlbWVudCgKICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KGF0dHJpYnV0aW9uRWwsICJMb2dvVVJMIiksCiAgICAgICAgIk9ubGluZVJlc291cmNlIgogICAgICApLAogICAgICAieGxpbms6aHJlZiIKICAgICk7CiAgICBjb25zdCB1cmwgPSBnZXRFbGVtZW50QXR0cmlidXRlKAogICAgICBmaW5kQ2hpbGRFbGVtZW50KGF0dHJpYnV0aW9uRWwsICJPbmxpbmVSZXNvdXJjZSIpLAogICAgICAieGxpbms6aHJlZiIKICAgICk7CiAgICBjb25zdCB0aXRsZSA9IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoYXR0cmlidXRpb25FbCwgIlRpdGxlIikpOwogICAgcmV0dXJuIHsKICAgICAgLi4udGl0bGUgJiYgeyB0aXRsZSB9LAogICAgICAuLi51cmwgJiYgeyB1cmwgfSwKICAgICAgLi4ubG9nb1VybCAmJiB7IGxvZ29VcmwgfQogICAgfTsKICB9CiAgZnVuY3Rpb24gcmVhZFByb3ZpZGVyRnJvbUNhcGFiaWxpdGllcyQxKGNhcGFiaWxpdGllc0RvYykgewogICAgY29uc3Qgc2VydmljZSA9IGZpbmRDaGlsZEVsZW1lbnQoZ2V0Um9vdEVsZW1lbnQoY2FwYWJpbGl0aWVzRG9jKSwgIlNlcnZpY2UiKTsKICAgIGNvbnN0IGNvbnRhY3RJbmZvcm1hdGlvbiA9IGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZSwgIkNvbnRhY3RJbmZvcm1hdGlvbiIpOwogICAgY29uc3QgY29udGFjdFBlcnNvblByaW1hcnkgPSBmaW5kQ2hpbGRFbGVtZW50KAogICAgICBjb250YWN0SW5mb3JtYXRpb24sCiAgICAgICJDb250YWN0UGVyc29uUHJpbWFyeSIKICAgICk7CiAgICBjb25zdCBhZGRyZXNzID0gZmluZENoaWxkRWxlbWVudChjb250YWN0SW5mb3JtYXRpb24sICJDb250YWN0QWRkcmVzcyIpOwogICAgcmV0dXJuIHsKICAgICAgY29udGFjdDogewogICAgICAgIG5hbWU6IGdldEVsZW1lbnRUZXh0KAogICAgICAgICAgZmluZENoaWxkRWxlbWVudChjb250YWN0UGVyc29uUHJpbWFyeSwgIkNvbnRhY3RQZXJzb24iKQogICAgICAgICksCiAgICAgICAgb3JnYW5pemF0aW9uOiBnZXRFbGVtZW50VGV4dCgKICAgICAgICAgIGZpbmRDaGlsZEVsZW1lbnQoY29udGFjdFBlcnNvblByaW1hcnksICJDb250YWN0T3JnYW5pemF0aW9uIikKICAgICAgICApLAogICAgICAgIHBvc2l0aW9uOiBnZXRFbGVtZW50VGV4dCgKICAgICAgICAgIGZpbmRDaGlsZEVsZW1lbnQoY29udGFjdEluZm9ybWF0aW9uLCAiQ29udGFjdFBvc2l0aW9uIikKICAgICAgICApLAogICAgICAgIHBob25lOiBnZXRFbGVtZW50VGV4dCgKICAgICAgICAgIGZpbmRDaGlsZEVsZW1lbnQoY29udGFjdEluZm9ybWF0aW9uLCAiQ29udGFjdFZvaWNlVGVsZXBob25lIikKICAgICAgICApLAogICAgICAgIGZheDogZ2V0RWxlbWVudFRleHQoCiAgICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KGNvbnRhY3RJbmZvcm1hdGlvbiwgIkNvbnRhY3RGYWNzaW1pbGVUZWxlcGhvbmUiKQogICAgICAgICksCiAgICAgICAgYWRkcmVzczogewogICAgICAgICAgZGVsaXZlcnlQb2ludDogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChhZGRyZXNzLCAiQWRkcmVzcyIpKSwKICAgICAgICAgIGNpdHk6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoYWRkcmVzcywgIkNpdHkiKSksCiAgICAgICAgICBhZG1pbmlzdHJhdGl2ZUFyZWE6IGdldEVsZW1lbnRUZXh0KAogICAgICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KGFkZHJlc3MsICJTdGF0ZU9yUHJvdmluY2UiKQogICAgICAgICAgKSwKICAgICAgICAgIHBvc3RhbENvZGU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoYWRkcmVzcywgIlBvc3RDb2RlIikpLAogICAgICAgICAgY291bnRyeTogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChhZGRyZXNzLCAiQ291bnRyeSIpKQogICAgICAgIH0sCiAgICAgICAgZW1haWw6IGdldEVsZW1lbnRUZXh0KAogICAgICAgICAgZmluZENoaWxkRWxlbWVudChjb250YWN0SW5mb3JtYXRpb24sICJDb250YWN0RWxlY3Ryb25pY01haWxBZGRyZXNzIikKICAgICAgICApCiAgICAgIH0KICAgIH07CiAgfQogIGZ1bmN0aW9uIHJlYWRQcm92aWRlckZyb21DYXBhYmlsaXRpZXMoY2FwYWJpbGl0aWVzRG9jKSB7CiAgICBjb25zdCBzZXJ2aWNlUHJvdmlkZXIgPSBmaW5kQ2hpbGRFbGVtZW50KAogICAgICBnZXRSb290RWxlbWVudChjYXBhYmlsaXRpZXNEb2MpLAogICAgICAiU2VydmljZVByb3ZpZGVyIgogICAgKTsKICAgIGNvbnN0IHNlcnZpY2VDb250YWN0ID0gZmluZENoaWxkRWxlbWVudChzZXJ2aWNlUHJvdmlkZXIsICJTZXJ2aWNlQ29udGFjdCIpOwogICAgY29uc3QgY29udGFjdEluZm8gPSBmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2VDb250YWN0LCAiQ29udGFjdEluZm8iKTsKICAgIGNvbnN0IHBob25lID0gZmluZENoaWxkRWxlbWVudChjb250YWN0SW5mbywgIlBob25lIik7CiAgICBjb25zdCBhZGRyZXNzID0gZmluZENoaWxkRWxlbWVudChjb250YWN0SW5mbywgIkFkZHJlc3MiKTsKICAgIHJldHVybiB7CiAgICAgIG5hbWU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZVByb3ZpZGVyLCAiUHJvdmlkZXJOYW1lIikpLAogICAgICBzaXRlOiBnZXRFbGVtZW50QXR0cmlidXRlKAogICAgICAgIGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZVByb3ZpZGVyLCAiUHJvdmlkZXJTaXRlIiksCiAgICAgICAgInhsaW5rOmhyZWYiCiAgICAgICksCiAgICAgIGNvbnRhY3Q6IHsKICAgICAgICBuYW1lOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2VDb250YWN0LCAiSW5kaXZpZHVhbE5hbWUiKSksCiAgICAgICAgcG9zaXRpb246IGdldEVsZW1lbnRUZXh0KAogICAgICAgICAgZmluZENoaWxkRWxlbWVudChzZXJ2aWNlQ29udGFjdCwgIlBvc2l0aW9uTmFtZSIpCiAgICAgICAgKSwKICAgICAgICBwaG9uZTogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChwaG9uZSwgIlZvaWNlIikpLAogICAgICAgIGZheDogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChwaG9uZSwgIkZhY3NpbWlsZSIpKSwKICAgICAgICBhZGRyZXNzOiB7CiAgICAgICAgICBkZWxpdmVyeVBvaW50OiBnZXRFbGVtZW50VGV4dCgKICAgICAgICAgICAgZmluZENoaWxkRWxlbWVudChhZGRyZXNzLCAiRGVsaXZlcnlQb2ludCIpCiAgICAgICAgICApLAogICAgICAgICAgY2l0eTogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChhZGRyZXNzLCAiQ2l0eSIpKSwKICAgICAgICAgIGFkbWluaXN0cmF0aXZlQXJlYTogZ2V0RWxlbWVudFRleHQoCiAgICAgICAgICAgIGZpbmRDaGlsZEVsZW1lbnQoYWRkcmVzcywgIkFkbWluaXN0cmF0aXZlQXJlYSIpCiAgICAgICAgICApLAogICAgICAgICAgcG9zdGFsQ29kZTogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChhZGRyZXNzLCAiUG9zdGFsQ29kZSIpKSwKICAgICAgICAgIGNvdW50cnk6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoYWRkcmVzcywgIkNvdW50cnkiKSkKICAgICAgICB9LAogICAgICAgIGVtYWlsOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KGFkZHJlc3MsICJFbGVjdHJvbmljTWFpbEFkZHJlc3MiKSkKICAgICAgfQogICAgfTsKICB9CiAgZnVuY3Rpb24gcmVhZE9wZXJhdGlvblVybHNGcm9tQ2FwYWJpbGl0aWVzKGNhcGFiaWxpdGllc0RvYykgewogICAgY29uc3QgdXJscyA9IHt9OwogICAgY29uc3QgY2FwYWJpbGl0aWVzID0gZ2V0Um9vdEVsZW1lbnQoY2FwYWJpbGl0aWVzRG9jKTsKICAgIGNvbnN0IG9wZXJhdGlvbnNNZXRhZGF0YSA9IGZpbmRDaGlsZEVsZW1lbnQoCiAgICAgIGNhcGFiaWxpdGllcywKICAgICAgIk9wZXJhdGlvbnNNZXRhZGF0YSIKICAgICk7CiAgICBpZiAob3BlcmF0aW9uc01ldGFkYXRhKSB7CiAgICAgIGZpbmRDaGlsZHJlbkVsZW1lbnQob3BlcmF0aW9uc01ldGFkYXRhLCAiT3BlcmF0aW9uIikuZm9yRWFjaCgKICAgICAgICAob3BlcmF0aW9uKSA9PiB7CiAgICAgICAgICBjb25zdCBuYW1lID0gZ2V0RWxlbWVudEF0dHJpYnV0ZShvcGVyYXRpb24sICJuYW1lIik7CiAgICAgICAgICB1cmxzW25hbWVdID0gcGFyc2VPcGVyYXRpb24xMTAob3BlcmF0aW9uKTsKICAgICAgICB9CiAgICAgICk7CiAgICB9IGVsc2UgewogICAgICBjb25zdCBjYXBhYmlsaXR5ID0gZmluZENoaWxkRWxlbWVudChjYXBhYmlsaXRpZXMsICJDYXBhYmlsaXR5Iik7CiAgICAgIGNvbnN0IHJlcXVlc3QgPSBmaW5kQ2hpbGRFbGVtZW50KGNhcGFiaWxpdHksICJSZXF1ZXN0Iik7CiAgICAgIGdldENoaWxkcmVuRWxlbWVudChyZXF1ZXN0KS5mb3JFYWNoKChvcGVyYXRpb24pID0+IHsKICAgICAgICBjb25zdCBuYW1lID0gc3RyaXBOYW1lc3BhY2UoZ2V0RWxlbWVudE5hbWUob3BlcmF0aW9uKSk7CiAgICAgICAgdXJsc1tuYW1lXSA9IHBhcnNlT3BlcmF0aW9uMTAwKG9wZXJhdGlvbik7CiAgICAgIH0pOwogICAgfQogICAgcmV0dXJuIHVybHM7CiAgfQogIGZ1bmN0aW9uIHJlYWRWZXJzaW9uRnJvbUNhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXNEb2MpIHsKICAgIHJldHVybiBnZXRSb290RWxlbWVudChjYXBhYmlsaXRpZXNEb2MpLmF0dHJpYnV0ZXNbInZlcnNpb24iXTsKICB9CiAgZnVuY3Rpb24gcmVhZE91dHB1dEZvcm1hdHNGcm9tQ2FwYWJpbGl0aWVzKGNhcGFiaWxpdGllc0RvYykgewogICAgY29uc3QgdmVyc2lvbiA9IHJlYWRWZXJzaW9uRnJvbUNhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXNEb2MpOwogICAgbGV0IG91dHB1dEZvcm1hdHM7CiAgICBpZiAodmVyc2lvbi5zdGFydHNXaXRoKCIxLjAiKSkgewogICAgICBjb25zdCBnZXRGZWF0dXJlID0gZmluZENoaWxkRWxlbWVudCgKICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KAogICAgICAgICAgZmluZENoaWxkRWxlbWVudChnZXRSb290RWxlbWVudChjYXBhYmlsaXRpZXNEb2MpLCAiQ2FwYWJpbGl0eSIpLAogICAgICAgICAgIlJlcXVlc3QiCiAgICAgICAgKSwKICAgICAgICAiR2V0RmVhdHVyZSIKICAgICAgKTsKICAgICAgb3V0cHV0Rm9ybWF0cyA9IGdldENoaWxkcmVuRWxlbWVudCgKICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KGdldEZlYXR1cmUsICJSZXN1bHRGb3JtYXQiKQogICAgICApLm1hcChnZXRFbGVtZW50TmFtZSk7CiAgICB9IGVsc2UgewogICAgICBjb25zdCBvcGVyYXRpb25zID0gZmluZENoaWxkRWxlbWVudCgKICAgICAgICBnZXRSb290RWxlbWVudChjYXBhYmlsaXRpZXNEb2MpLAogICAgICAgICJPcGVyYXRpb25zTWV0YWRhdGEiCiAgICAgICk7CiAgICAgIGNvbnN0IGdldEZlYXR1cmUgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KG9wZXJhdGlvbnMsICJPcGVyYXRpb24iKS5maW5kKAogICAgICAgIChlbCkgPT4gZ2V0RWxlbWVudEF0dHJpYnV0ZShlbCwgIm5hbWUiKSA9PT0gIkdldEZlYXR1cmUiCiAgICAgICk7CiAgICAgIGNvbnN0IHBhcmFtZXRlciA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoZ2V0RmVhdHVyZSwgIlBhcmFtZXRlciIpLmZpbmQoCiAgICAgICAgKGVsKSA9PiBnZXRFbGVtZW50QXR0cmlidXRlKGVsLCAibmFtZSIpID09PSAib3V0cHV0Rm9ybWF0IgogICAgICApOwogICAgICBvdXRwdXRGb3JtYXRzID0gZmluZENoaWxkcmVuRWxlbWVudChwYXJhbWV0ZXIsICJWYWx1ZSIsIHRydWUpLm1hcCgKICAgICAgICBnZXRFbGVtZW50VGV4dAogICAgICApOwogICAgfQogICAgcmV0dXJuIG91dHB1dEZvcm1hdHM7CiAgfQogIGZ1bmN0aW9uIHJlYWRJbmZvRnJvbUNhcGFiaWxpdGllcyQxKGNhcGFiaWxpdGllc0RvYykgewogICAgY29uc3QgdmVyc2lvbiA9IHJlYWRWZXJzaW9uRnJvbUNhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXNEb2MpOwogICAgY29uc3Qgc2VydmljZVRhZyA9IHZlcnNpb24uc3RhcnRzV2l0aCgiMS4wIikgPyAiU2VydmljZSIgOiAiU2VydmljZUlkZW50aWZpY2F0aW9uIjsKICAgIGNvbnN0IG5hbWVUYWcgPSB2ZXJzaW9uLnN0YXJ0c1dpdGgoIjEuMCIpID8gIk5hbWUiIDogIlNlcnZpY2VUeXBlIjsKICAgIGNvbnN0IHNlcnZpY2UgPSBmaW5kQ2hpbGRFbGVtZW50KGdldFJvb3RFbGVtZW50KGNhcGFiaWxpdGllc0RvYyksIHNlcnZpY2VUYWcpOwogICAgbGV0IGtleXdvcmRzOwogICAgaWYgKHZlcnNpb24uc3RhcnRzV2l0aCgiMS4wIikpIHsKICAgICAga2V5d29yZHMgPSBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2UsICJLZXl3b3JkcyIpKS5zcGxpdCgiLCIpLm1hcCgoa2V5d29yZCkgPT4ga2V5d29yZC50cmltKCkpOwogICAgfSBlbHNlIHsKICAgICAga2V5d29yZHMgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KAogICAgICAgIGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZSwgIktleXdvcmRzIiksCiAgICAgICAgIktleXdvcmQiCiAgICAgICkubWFwKGdldEVsZW1lbnRUZXh0KTsKICAgIH0KICAgIGxldCBwcm92aWRlcjsKICAgIGlmICh2ZXJzaW9uICE9PSAiMS4wLjAiKSB7CiAgICAgIHByb3ZpZGVyID0gcmVhZFByb3ZpZGVyRnJvbUNhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXNEb2MpOwogICAgfQogICAgcmV0dXJuIHsKICAgICAgdGl0bGU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZSwgIlRpdGxlIikpLAogICAgICBuYW1lOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2UsIG5hbWVUYWcpKSwKICAgICAgYWJzdHJhY3Q6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZSwgIkFic3RyYWN0IikpLAogICAgICBmZWVzOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2UsICJGZWVzIikpLAogICAgICBjb25zdHJhaW50czogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChzZXJ2aWNlLCAiQWNjZXNzQ29uc3RyYWludHMiKSksCiAgICAgIGtleXdvcmRzLAogICAgICBwcm92aWRlciwKICAgICAgb3V0cHV0Rm9ybWF0czogcmVhZE91dHB1dEZvcm1hdHNGcm9tQ2FwYWJpbGl0aWVzKGNhcGFiaWxpdGllc0RvYykKICAgIH07CiAgfQogIGZ1bmN0aW9uIHJlYWRGZWF0dXJlVHlwZXNGcm9tQ2FwYWJpbGl0aWVzKGNhcGFiaWxpdGllc0RvYykgewogICAgY29uc3QgdmVyc2lvbiA9IHJlYWRWZXJzaW9uRnJvbUNhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXNEb2MpOwogICAgY29uc3Qgb3V0cHV0Rm9ybWF0cyA9IHJlYWRPdXRwdXRGb3JtYXRzRnJvbUNhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXNEb2MpOwogICAgY29uc3QgY2FwYWJpbGl0eSA9IGZpbmRDaGlsZEVsZW1lbnQoCiAgICAgIGdldFJvb3RFbGVtZW50KGNhcGFiaWxpdGllc0RvYyksCiAgICAgICJGZWF0dXJlVHlwZUxpc3QiCiAgICApOwogICAgcmV0dXJuIGZpbmRDaGlsZHJlbkVsZW1lbnQoY2FwYWJpbGl0eSwgIkZlYXR1cmVUeXBlIikubWFwKAogICAgICAoZmVhdHVyZVR5cGVFbCkgPT4gcGFyc2VGZWF0dXJlVHlwZShmZWF0dXJlVHlwZUVsLCB2ZXJzaW9uLCBvdXRwdXRGb3JtYXRzKQogICAgKTsKICB9CiAgZnVuY3Rpb24gcGFyc2VPcGVyYXRpb24xMDAob3BlcmF0aW9uKSB7CiAgICBjb25zdCB1cmxzID0ge307CiAgICBjb25zdCBkY3BUeXBlID0gZmluZENoaWxkcmVuRWxlbWVudChvcGVyYXRpb24sICJEQ1BUeXBlIik7CiAgICBjb25zdCBodHRwID0gZGNwVHlwZS5mbGF0TWFwKChkKSA9PiBmaW5kQ2hpbGRyZW5FbGVtZW50KGQsICJIVFRQIikpOwogICAgY29uc3QgbWV0aG9kcyA9IGh0dHAuZmxhdE1hcCgoaCkgPT4gZ2V0Q2hpbGRyZW5FbGVtZW50KGgpKTsKICAgIG1ldGhvZHMuZm9yRWFjaCgobWV0aG9kKSA9PiB7CiAgICAgIGNvbnN0IG1ldGhvZE5hbWUgPSBzdHJpcE5hbWVzcGFjZShnZXRFbGVtZW50TmFtZShtZXRob2QpKTsKICAgICAgdXJsc1ttZXRob2ROYW1lXSA9IGdldEVsZW1lbnRBdHRyaWJ1dGUobWV0aG9kLCAib25saW5lUmVzb3VyY2UiKTsKICAgIH0pOwogICAgcmV0dXJuIHVybHM7CiAgfQogIGZ1bmN0aW9uIHBhcnNlT3BlcmF0aW9uMTEwKG9wZXJhdGlvbikgewogICAgY29uc3QgdXJscyA9IHt9OwogICAgY29uc3QgZGNwVHlwZSA9IGZpbmRDaGlsZHJlbkVsZW1lbnQob3BlcmF0aW9uLCAiRENQIik7CiAgICBjb25zdCBodHRwID0gZGNwVHlwZS5mbGF0TWFwKChkKSA9PiBmaW5kQ2hpbGRFbGVtZW50KGQsICJIVFRQIikpOwogICAgY29uc3QgbWV0aG9kcyA9IGh0dHAuZmxhdE1hcCgoaCkgPT4gZ2V0Q2hpbGRyZW5FbGVtZW50KGgpKTsKICAgIG1ldGhvZHMuZm9yRWFjaCgobWV0aG9kKSA9PiB7CiAgICAgIGNvbnN0IG1ldGhvZE5hbWUgPSBzdHJpcE5hbWVzcGFjZShnZXRFbGVtZW50TmFtZShtZXRob2QpKTsKICAgICAgdXJsc1ttZXRob2ROYW1lXSA9IGdldEVsZW1lbnRBdHRyaWJ1dGUobWV0aG9kLCAieGxpbms6aHJlZiIpOwogICAgfSk7CiAgICByZXR1cm4gdXJsczsKICB9CiAgZnVuY3Rpb24gcGFyc2VGZWF0dXJlVHlwZShmZWF0dXJlVHlwZUVsLCBzZXJ2aWNlVmVyc2lvbiwgZGVmYXVsdE91dHB1dEZvcm1hdHMpIHsKICAgIGNvbnN0IHNyc1RhZyA9IHNlcnZpY2VWZXJzaW9uLnN0YXJ0c1dpdGgoIjIuIikgPyAiQ1JTIiA6ICJTUlMiOwogICAgY29uc3QgZGVmYXVsdFNyc1RhZyA9IHNlcnZpY2VWZXJzaW9uLnN0YXJ0c1dpdGgoIjEuMCIpID8gIlNSUyIgOiBgRGVmYXVsdCR7c3JzVGFnfWA7CiAgICBmdW5jdGlvbiBwYXJzZUJCb3gxMDAoKSB7CiAgICAgIGNvbnN0IGJib3hFbCA9IGZpbmRDaGlsZEVsZW1lbnQoZmVhdHVyZVR5cGVFbCwgIkxhdExvbmdCb3VuZGluZ0JveCIpOwogICAgICByZXR1cm4gWyJtaW54IiwgIm1pbnkiLCAibWF4eCIsICJtYXh5Il0ubWFwKChuYW1lKSA9PiBnZXRFbGVtZW50QXR0cmlidXRlKGJib3hFbCwgbmFtZSkpLm1hcChwYXJzZUZsb2F0KTsKICAgIH0KICAgIGZ1bmN0aW9uIHBhcnNlQkJveDIoKSB7CiAgICAgIGNvbnN0IGJib3hFbCA9IGZpbmRDaGlsZEVsZW1lbnQoZmVhdHVyZVR5cGVFbCwgIldHUzg0Qm91bmRpbmdCb3giKTsKICAgICAgcmV0dXJuIFsiTG93ZXJDb3JuZXIiLCAiVXBwZXJDb3JuZXIiXS5tYXAoKGVsTmFtZSkgPT4gZmluZENoaWxkRWxlbWVudChiYm94RWwsIGVsTmFtZSkpLm1hcCgoY29ybmVyRWwpID0+IGdldEVsZW1lbnRUZXh0KGNvcm5lckVsKS5zcGxpdCgiICIpKS5yZWR1Y2UoKHByZXYsIGN1cnIpID0+IFsuLi5wcmV2LCAuLi5jdXJyXSkubWFwKHBhcnNlRmxvYXQpOwogICAgfQogICAgY29uc3Qgb3RoZXJDcnMgPSBzZXJ2aWNlVmVyc2lvbi5zdGFydHNXaXRoKCIxLjAiKSA/IFtdIDogZmluZENoaWxkcmVuRWxlbWVudChmZWF0dXJlVHlwZUVsLCBgT3RoZXIke3Nyc1RhZ31gKS5tYXAoZ2V0RWxlbWVudFRleHQpLm1hcChzaW1wbGlmeUVwc2dVcm4pOwogICAgY29uc3Qgb3V0cHV0Rm9ybWF0cyA9IHNlcnZpY2VWZXJzaW9uLnN0YXJ0c1dpdGgoIjEuMCIpID8gW10gOiBmaW5kQ2hpbGRyZW5FbGVtZW50KAogICAgICBmaW5kQ2hpbGRFbGVtZW50KGZlYXR1cmVUeXBlRWwsICJPdXRwdXRGb3JtYXRzIiksCiAgICAgICJGb3JtYXQiCiAgICApLm1hcChnZXRFbGVtZW50VGV4dCk7CiAgICBjb25zdCBrZXl3b3JkcyA9IHNlcnZpY2VWZXJzaW9uLnN0YXJ0c1dpdGgoIjEuMCIpID8gZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChmZWF0dXJlVHlwZUVsLCAiS2V5d29yZHMiKSkuc3BsaXQoIiwiKS5tYXAoKGtleXdvcmQpID0+IGtleXdvcmQudHJpbSgpKSA6IGZpbmRDaGlsZHJlbkVsZW1lbnQoCiAgICAgIGZpbmRDaGlsZEVsZW1lbnQoZmVhdHVyZVR5cGVFbCwgIktleXdvcmRzIiksCiAgICAgICJLZXl3b3JkIgogICAgKS5tYXAoZ2V0RWxlbWVudFRleHQpLmZpbHRlcigodiwgaSwgYXJyKSA9PiBhcnIuaW5kZXhPZih2KSA9PT0gaSk7CiAgICBjb25zdCBtZXRhZGF0YSA9IHNlcnZpY2VWZXJzaW9uID09PSAiMi4wLjAiID8gZmluZENoaWxkcmVuRWxlbWVudChmZWF0dXJlVHlwZUVsLCAiTWV0YWRhdGFVUkwiKS5tYXAoCiAgICAgIChtZXRhZGF0YVVybEVsKSA9PiAoewogICAgICAgIHVybDogZ2V0RWxlbWVudEF0dHJpYnV0ZShtZXRhZGF0YVVybEVsLCAieGxpbms6aHJlZiIpCiAgICAgIH0pCiAgICApIDogZmluZENoaWxkcmVuRWxlbWVudChmZWF0dXJlVHlwZUVsLCAiTWV0YWRhdGFVUkwiKS5tYXAoCiAgICAgIChtZXRhZGF0YVVybEVsKSA9PiAoewogICAgICAgIGZvcm1hdDogZ2V0RWxlbWVudEF0dHJpYnV0ZShtZXRhZGF0YVVybEVsLCAiZm9ybWF0IiksCiAgICAgICAgdHlwZTogZ2V0RWxlbWVudEF0dHJpYnV0ZShtZXRhZGF0YVVybEVsLCAidHlwZSIpLAogICAgICAgIHVybDogZ2V0RWxlbWVudFRleHQobWV0YWRhdGFVcmxFbCkudHJpbSgpCiAgICAgIH0pCiAgICApOwogICAgcmV0dXJuIHsKICAgICAgbmFtZTogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChmZWF0dXJlVHlwZUVsLCAiTmFtZSIpKSwKICAgICAgdGl0bGU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZmVhdHVyZVR5cGVFbCwgIlRpdGxlIikpLAogICAgICBhYnN0cmFjdDogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChmZWF0dXJlVHlwZUVsLCAiQWJzdHJhY3QiKSksCiAgICAgIGRlZmF1bHRDcnM6IHNpbXBsaWZ5RXBzZ1VybigKICAgICAgICBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KGZlYXR1cmVUeXBlRWwsIGRlZmF1bHRTcnNUYWcpKQogICAgICApLAogICAgICBvdGhlckNycywKICAgICAgb3V0cHV0Rm9ybWF0czogb3V0cHV0Rm9ybWF0cy5sZW5ndGggPiAwID8gb3V0cHV0Rm9ybWF0cyA6IGRlZmF1bHRPdXRwdXRGb3JtYXRzLAogICAgICBsYXRMb25Cb3VuZGluZ0JveDogc2VydmljZVZlcnNpb24uc3RhcnRzV2l0aCgiMS4wIikgPyBwYXJzZUJCb3gxMDAoKSA6IHBhcnNlQkJveDIoKSwKICAgICAga2V5d29yZHMsCiAgICAgIC4uLm1ldGFkYXRhLmxlbmd0aCAmJiB7IG1ldGFkYXRhIH0KICAgIH07CiAgfQogIGZ1bmN0aW9uIHBhcnNlQkJveCh4bWxFbGVtZW50KSB7CiAgICBjb25zdCByZXN1bHQgPSBbIkxvd2VyQ29ybmVyIiwgIlVwcGVyQ29ybmVyIl0ubWFwKChlbE5hbWUpID0+IGZpbmRDaGlsZEVsZW1lbnQoeG1sRWxlbWVudCwgZWxOYW1lKSkubWFwKChjb3JuZXJFbCkgPT4gZ2V0RWxlbWVudFRleHQoY29ybmVyRWwpLnNwbGl0KCIgIikpLnJlZHVjZSgocHJldiwgY3VycikgPT4gWy4uLnByZXYsIC4uLmN1cnJdKS5tYXAocGFyc2VGbG9hdCk7CiAgICBpZiAocmVzdWx0LnNvbWUoTnVtYmVyLmlzTmFOKSkKICAgICAgcmV0dXJuIG51bGw7CiAgICByZXR1cm4gcmVzdWx0OwogIH0KICBmdW5jdGlvbiByZWFkSW5mb0Zyb21DYXBhYmlsaXRpZXMoY2FwYWJpbGl0aWVzRG9jKSB7CiAgICBjb25zdCByb290RWwgPSBnZXRSb290RWxlbWVudChjYXBhYmlsaXRpZXNEb2MpOwogICAgY29uc3Qgc2VydmljZSA9IGZpbmRDaGlsZEVsZW1lbnQocm9vdEVsLCAiU2VydmljZUlkZW50aWZpY2F0aW9uIik7CiAgICBjb25zdCBrZXl3b3JkcyA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoCiAgICAgIGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZSwgIktleXdvcmRzIiksCiAgICAgICJLZXl3b3JkIgogICAgKS5tYXAoZ2V0RWxlbWVudFRleHQpOwogICAgY29uc3QgbWV0YWRhdGEgPSBmaW5kQ2hpbGRFbGVtZW50KHJvb3RFbCwgIk9wZXJhdGlvbnNNZXRhZGF0YSIpOwogICAgY29uc3QgZ2V0VGlsZU9wZXJhdGlvbiA9IGZpbmRDaGlsZHJlbkVsZW1lbnQobWV0YWRhdGEsICJPcGVyYXRpb24iKS5maW5kKAogICAgICAoZWwpID0+IGdldEVsZW1lbnRBdHRyaWJ1dGUoZWwsICJuYW1lIikgPT0gIkdldFRpbGUiCiAgICApOwogICAgY29uc3QgZ2V0VGlsZVVybHMgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KGdldFRpbGVPcGVyYXRpb24sICJHZXQiLCB0cnVlKS5yZWR1Y2UoCiAgICAgIChwcmV2LCBjdXJyKSA9PiB7CiAgICAgICAgY29uc3QgZW5jb2RpbmdUeXBlID0gZ2V0RWxlbWVudFRleHQoCiAgICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KGN1cnIsICJWYWx1ZSIsIHRydWUpCiAgICAgICAgKTsKICAgICAgICBjb25zdCB1cmwgPSBnZXRFbGVtZW50QXR0cmlidXRlKGN1cnIsICJ4bGluazpocmVmIik7CiAgICAgICAgaWYgKGVuY29kaW5nVHlwZS50b0xvd2VyQ2FzZSgpID09PSAicmVzdGZ1bCIpCiAgICAgICAgICByZXR1cm4geyAuLi5wcmV2LCByZXN0OiB1cmwgfTsKICAgICAgICByZXR1cm4geyAuLi5wcmV2LCBrdnA6IHVybCB9OwogICAgICB9LAogICAgICB7fQogICAgKTsKICAgIHJldHVybiB7CiAgICAgIHRpdGxlOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2UsICJUaXRsZSIpKSwKICAgICAgbmFtZTogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChzZXJ2aWNlLCAiU2VydmljZVR5cGUiKSksCiAgICAgIGFic3RyYWN0OiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2UsICJBYnN0cmFjdCIpKSwKICAgICAgZmVlczogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChzZXJ2aWNlLCAiRmVlcyIpKSwKICAgICAgY29uc3RyYWludHM6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZSwgIkFjY2Vzc0NvbnN0cmFpbnRzIikpLAogICAgICBrZXl3b3JkcywKICAgICAgcHJvdmlkZXI6IHJlYWRQcm92aWRlckZyb21DYXBhYmlsaXRpZXMoY2FwYWJpbGl0aWVzRG9jKSwKICAgICAgZ2V0VGlsZVVybHMKICAgIH07CiAgfQogIGZ1bmN0aW9uIHJlYWRNYXRyaXhTZXRzRnJvbUNhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXNEb2MpIHsKICAgIGZ1bmN0aW9uIHBhcnNlTWF0cml4U2V0KGVsZW1lbnQpIHsKICAgICAgY29uc3QgdG9wTGVmdCA9IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudCwgIlRvcExlZnRDb3JuZXIiKSkuc3BsaXQoIiAiKS5tYXAocGFyc2VGbG9hdCk7CiAgICAgIHJldHVybiB7CiAgICAgICAgaWRlbnRpZmllcjogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChlbGVtZW50LCAiSWRlbnRpZmllciIpKSwKICAgICAgICB0aWxlV2lkdGg6IHBhcnNlSW50KAogICAgICAgICAgZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChlbGVtZW50LCAiVGlsZVdpZHRoIikpCiAgICAgICAgKSwKICAgICAgICB0aWxlSGVpZ2h0OiBwYXJzZUludCgKICAgICAgICAgIGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudCwgIlRpbGVIZWlnaHQiKSkKICAgICAgICApLAogICAgICAgIG1hdHJpeFdpZHRoOiBwYXJzZUludCgKICAgICAgICAgIGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudCwgIk1hdHJpeFdpZHRoIikpCiAgICAgICAgKSwKICAgICAgICBtYXRyaXhIZWlnaHQ6IHBhcnNlSW50KAogICAgICAgICAgZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChlbGVtZW50LCAiTWF0cml4SGVpZ2h0IikpCiAgICAgICAgKSwKICAgICAgICBzY2FsZURlbm9taW5hdG9yOiBwYXJzZUZsb2F0KAogICAgICAgICAgZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChlbGVtZW50LCAiU2NhbGVEZW5vbWluYXRvciIpKQogICAgICAgICksCiAgICAgICAgdG9wTGVmdAogICAgICB9OwogICAgfQogICAgY29uc3QgY29udGVudHMgPSBmaW5kQ2hpbGRFbGVtZW50KAogICAgICBnZXRSb290RWxlbWVudChjYXBhYmlsaXRpZXNEb2MpLAogICAgICAiQ29udGVudHMiCiAgICApOwogICAgY29uc3QgbWF0cml4U2V0cyA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoY29udGVudHMsICJUaWxlTWF0cml4U2V0Iik7CiAgICByZXR1cm4gbWF0cml4U2V0cy5tYXAoKGVsZW1lbnQpID0+IHsKICAgICAgY29uc3Qgd2VsbEtub3duU2NhbGVTZXQgPSBnZXRFbGVtZW50VGV4dCgKICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KGVsZW1lbnQsICJXZWxsS25vd25TY2FsZVNldCIpCiAgICAgICk7CiAgICAgIGNvbnN0IGJvdW5kaW5nQm94ID0gcGFyc2VCQm94KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudCwgIkJvdW5kaW5nQm94IikpOwogICAgICByZXR1cm4gewogICAgICAgIGlkZW50aWZpZXI6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudCwgIklkZW50aWZpZXIiKSksCiAgICAgICAgY3JzOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KGVsZW1lbnQsICJTdXBwb3J0ZWRDUlMiKSksCiAgICAgICAgdGlsZU1hdHJpY2VzOiBmaW5kQ2hpbGRyZW5FbGVtZW50KGVsZW1lbnQsICJUaWxlTWF0cml4IikubWFwKAogICAgICAgICAgcGFyc2VNYXRyaXhTZXQKICAgICAgICApLAogICAgICAgIC4uLmJvdW5kaW5nQm94ICYmIHsgYm91bmRpbmdCb3ggfSwKICAgICAgICAuLi53ZWxsS25vd25TY2FsZVNldCAmJiB7IHdlbGxLbm93blNjYWxlU2V0IH0KICAgICAgfTsKICAgIH0pOwogIH0KICBmdW5jdGlvbiByZWFkTGF5ZXJzRnJvbUNhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXNEb2MpIHsKICAgIGNvbnN0IHJvb3RFbCA9IGdldFJvb3RFbGVtZW50KGNhcGFiaWxpdGllc0RvYyk7CiAgICBjb25zdCBjb250ZW50c0VsID0gZmluZENoaWxkRWxlbWVudChyb290RWwsICJDb250ZW50cyIpOwogICAgZnVuY3Rpb24gZ2V0TWF0cml4U2V0Q3JzKGNvbnRlbnRzRWwyLCBpZGVudGlmaWVyKSB7CiAgICAgIGNvbnN0IG1hdHJpeFNldCA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoY29udGVudHNFbDIsICJUaWxlTWF0cml4U2V0IikuZmluZCgKICAgICAgICAobWF0cml4U2V0RWwpID0+IHsKICAgICAgICAgIGNvbnN0IGlkZW50aWZpZXJFbCA9IGZpbmRDaGlsZEVsZW1lbnQobWF0cml4U2V0RWwsICJJZGVudGlmaWVyIik7CiAgICAgICAgICByZXR1cm4gZ2V0RWxlbWVudFRleHQoaWRlbnRpZmllckVsKSA9PT0gaWRlbnRpZmllcjsKICAgICAgICB9CiAgICAgICk7CiAgICAgIHJldHVybiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KG1hdHJpeFNldCwgIlN1cHBvcnRlZENSUyIpKTsKICAgIH0KICAgIGZ1bmN0aW9uIHBhcnNlTWF0cml4U2V0TGluayhlbGVtZW50KSB7CiAgICAgIGNvbnN0IGlkZW50aWZpZXIgPSBnZXRFbGVtZW50VGV4dCgKICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KGVsZW1lbnQsICJUaWxlTWF0cml4U2V0IikKICAgICAgKTsKICAgICAgY29uc3QgY3JzID0gZ2V0TWF0cml4U2V0Q3JzKGNvbnRlbnRzRWwsIGlkZW50aWZpZXIpOwogICAgICByZXR1cm4gewogICAgICAgIGlkZW50aWZpZXIsCiAgICAgICAgY3JzLAogICAgICAgIGxpbWl0czogZmluZENoaWxkcmVuRWxlbWVudChlbGVtZW50LCAiVGlsZU1hdHJpeExpbWl0cyIsIHRydWUpLm1hcCgKICAgICAgICAgIChlbGVtZW50MikgPT4gKHsKICAgICAgICAgICAgdGlsZU1hdHJpeDogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChlbGVtZW50MiwgIlRpbGVNYXRyaXgiKSksCiAgICAgICAgICAgIG1pblRpbGVSb3c6IHBhcnNlSW50KAogICAgICAgICAgICAgIGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudDIsICJNaW5UaWxlUm93IikpCiAgICAgICAgICAgICksCiAgICAgICAgICAgIG1pblRpbGVDb2w6IHBhcnNlSW50KAogICAgICAgICAgICAgIGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudDIsICJNaW5UaWxlQ29sIikpCiAgICAgICAgICAgICksCiAgICAgICAgICAgIG1heFRpbGVSb3c6IHBhcnNlSW50KAogICAgICAgICAgICAgIGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudDIsICJNYXhUaWxlUm93IikpCiAgICAgICAgICAgICksCiAgICAgICAgICAgIG1heFRpbGVDb2w6IHBhcnNlSW50KAogICAgICAgICAgICAgIGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudDIsICJNYXhUaWxlQ29sIikpCiAgICAgICAgICAgICkKICAgICAgICAgIH0pCiAgICAgICAgKQogICAgICB9OwogICAgfQogICAgY29uc3QgZ2V0VGlsZU9wZXJhdGlvbiA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoCiAgICAgIGZpbmRDaGlsZEVsZW1lbnQocm9vdEVsLCAiT3BlcmF0aW9uc01ldGFkYXRhIiksCiAgICAgICJPcGVyYXRpb24iCiAgICApLmZpbmQoKGVsKSA9PiBnZXRFbGVtZW50QXR0cmlidXRlKGVsLCAibmFtZSIpID09ICJHZXRUaWxlIik7CiAgICBjb25zdCBnZXRLdnBFbHQgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KGdldFRpbGVPcGVyYXRpb24sICJHZXQiLCB0cnVlKS5maWx0ZXIoCiAgICAgIChlbHQpID0+IHsKICAgICAgICBjb25zdCBlbmNvZGluZ1R5cGUgPSBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KGVsdCwgIlZhbHVlIiwgdHJ1ZSkpOwogICAgICAgIHJldHVybiBlbmNvZGluZ1R5cGUudG9Mb3dlckNhc2UoKSA9PT0gImt2cCI7CiAgICAgIH0KICAgIClbMF07CiAgICBjb25zdCBnZXRLdnBVcmwgPSBnZXRLdnBFbHQgPyBnZXRFbGVtZW50QXR0cmlidXRlKGdldEt2cEVsdCwgInhsaW5rOmhyZWYiKSA6ICIiOwogICAgY29uc3QgY29udGVudHMgPSBmaW5kQ2hpbGRFbGVtZW50KHJvb3RFbCwgIkNvbnRlbnRzIik7CiAgICBjb25zdCBsYXllcnMgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KGNvbnRlbnRzLCAiTGF5ZXIiKTsKICAgIHJldHVybiBsYXllcnMubWFwKChlbGVtZW50KSA9PiB7CiAgICAgIGNvbnN0IGxhdExvbkJvdW5kaW5nQm94ID0gcGFyc2VCQm94KAogICAgICAgIGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudCwgIldHUzg0Qm91bmRpbmdCb3giKQogICAgICApOwogICAgICBsZXQgZGVmYXVsdFN0eWxlID0gIiI7CiAgICAgIGNvbnN0IHN0eWxlcyA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoZWxlbWVudCwgIlN0eWxlIikubWFwKChlbGVtZW50MikgPT4gewogICAgICAgIGNvbnN0IGxlZ2VuZFVybCA9IGdldEVsZW1lbnRBdHRyaWJ1dGUoCiAgICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KGVsZW1lbnQyLCAiTGVnZW5kVVJMIiksCiAgICAgICAgICAieGxpbms6aHJlZiIKICAgICAgICApOwogICAgICAgIGNvbnN0IGFic3RyYWN0ID0gZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChlbGVtZW50MiwgIkFic3RyYWN0IikpOwogICAgICAgIGNvbnN0IHN0eWxlID0gewogICAgICAgICAgdGl0bGU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudDIsICJUaXRsZSIpKSwKICAgICAgICAgIG5hbWU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudDIsICJJZGVudGlmaWVyIikpLAogICAgICAgICAgLi4uYWJzdHJhY3QgJiYgeyBhYnN0cmFjdCB9LAogICAgICAgICAgLi4ubGVnZW5kVXJsICYmIHsgbGVnZW5kVXJsIH0KICAgICAgICB9OwogICAgICAgIGlmIChnZXRFbGVtZW50QXR0cmlidXRlKGVsZW1lbnQyLCAiaXNEZWZhdWx0IikgPT09ICJ0cnVlIikgewogICAgICAgICAgZGVmYXVsdFN0eWxlID0gc3R5bGUubmFtZTsKICAgICAgICB9CiAgICAgICAgcmV0dXJuIHN0eWxlOwogICAgICB9KTsKICAgICAgY29uc3Qgb3V0cHV0Rm9ybWF0cyA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoZWxlbWVudCwgIkZvcm1hdCIpLm1hcCgKICAgICAgICBnZXRFbGVtZW50VGV4dAogICAgICApOwogICAgICBjb25zdCByZXNvdXJjZUxpbmtzID0gZmluZENoaWxkcmVuRWxlbWVudCgKICAgICAgICBlbGVtZW50LAogICAgICAgICJSZXNvdXJjZVVSTCIKICAgICAgKS5maWx0ZXIoCiAgICAgICAgKGVsZW1lbnQyKSA9PiBnZXRFbGVtZW50QXR0cmlidXRlKGVsZW1lbnQyLCAicmVzb3VyY2VUeXBlIikgPT09ICJ0aWxlIgogICAgICApLm1hcCgoZWxlbWVudDIpID0+IHsKICAgICAgICBjb25zdCBmb3JtYXQgPSBnZXRFbGVtZW50QXR0cmlidXRlKGVsZW1lbnQyLCAiZm9ybWF0Iik7CiAgICAgICAgY29uc3QgdXJsID0gZ2V0RWxlbWVudEF0dHJpYnV0ZShlbGVtZW50MiwgInRlbXBsYXRlIik7CiAgICAgICAgcmV0dXJuIHsgZm9ybWF0LCB1cmwsIGVuY29kaW5nOiAiUkVTVCIgfTsKICAgICAgfSk7CiAgICAgIGlmIChnZXRLdnBVcmwpIHsKICAgICAgICByZXNvdXJjZUxpbmtzLnB1c2goCiAgICAgICAgICAuLi5vdXRwdXRGb3JtYXRzLm1hcCgoZm9ybWF0KSA9PiAoewogICAgICAgICAgICBlbmNvZGluZzogIktWUCIsCiAgICAgICAgICAgIHVybDogZ2V0S3ZwVXJsLAogICAgICAgICAgICBmb3JtYXQKICAgICAgICAgIH0pKQogICAgICAgICk7CiAgICAgIH0KICAgICAgY29uc3QgbWF0cml4U2V0cyA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoZWxlbWVudCwgIlRpbGVNYXRyaXhTZXRMaW5rIikubWFwKAogICAgICAgIHBhcnNlTWF0cml4U2V0TGluawogICAgICApOwogICAgICBjb25zdCBkaW1lbnNpb25zID0gZmluZENoaWxkcmVuRWxlbWVudChlbGVtZW50LCAiRGltZW5zaW9uIikubWFwKAogICAgICAgIChlbGVtZW50MikgPT4gewogICAgICAgICAgY29uc3QgaWRlbnRpZmllciA9IGdldEVsZW1lbnRUZXh0KAogICAgICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KGVsZW1lbnQyLCAiSWRlbnRpZmllciIpCiAgICAgICAgICApOwogICAgICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gZ2V0RWxlbWVudFRleHQoCiAgICAgICAgICAgIGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudDIsICJEZWZhdWx0IikKICAgICAgICAgICk7CiAgICAgICAgICBjb25zdCB2YWx1ZXMgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KGVsZW1lbnQyLCAiVmFsdWVzIikubWFwKAogICAgICAgICAgICBnZXRFbGVtZW50VGV4dAogICAgICAgICAgKTsKICAgICAgICAgIHJldHVybiB7IGlkZW50aWZpZXIsIGRlZmF1bHRWYWx1ZSwgdmFsdWVzIH07CiAgICAgICAgfQogICAgICApOwogICAgICByZXR1cm4gewogICAgICAgIG5hbWU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudCwgIklkZW50aWZpZXIiKSksCiAgICAgICAgdGl0bGU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudCwgIlRpdGxlIikpLAogICAgICAgIGFic3RyYWN0OiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KGVsZW1lbnQsICJBYnN0cmFjdCIpKSwKICAgICAgICBzdHlsZXMsCiAgICAgICAgcmVzb3VyY2VMaW5rcywKICAgICAgICBtYXRyaXhTZXRzLAogICAgICAgIGRlZmF1bHRTdHlsZSwKICAgICAgICAuLi5sYXRMb25Cb3VuZGluZ0JveCAmJiB7IGxhdExvbkJvdW5kaW5nQm94IH0sCiAgICAgICAgLi4uZGltZW5zaW9ucyAmJiB7IGRpbWVuc2lvbnMgfQogICAgICB9OwogICAgfSk7CiAgfQogIGZ1bmN0aW9uIHBhcnNlRmVhdHVyZVByb3BzKGdldEZlYXR1cmVzRG9jLCBmZWF0dXJlVHlwZUZ1bGwsIHNlcnZpY2VWZXJzaW9uKSB7CiAgICBjb25zdCBjb2xsZWN0aW9uID0gZ2V0Um9vdEVsZW1lbnQoZ2V0RmVhdHVyZXNEb2MpOwogICAgbGV0IG1lbWJlcnM7CiAgICBpZiAoc2VydmljZVZlcnNpb24uc3RhcnRzV2l0aCgiMi4wIikpIHsKICAgICAgbWVtYmVycyA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoY29sbGVjdGlvbiwgIm1lbWJlciIpLm1hcCgKICAgICAgICAocGFyZW50KSA9PiBnZXRDaGlsZHJlbkVsZW1lbnQocGFyZW50KVswXQogICAgICApOwogICAgfSBlbHNlIHsKICAgICAgY29uc3QgbWVtYmVyc1Jvb3QgPSBmaW5kQ2hpbGRFbGVtZW50KGNvbGxlY3Rpb24sICJmZWF0dXJlTWVtYmVycyIpOwogICAgICBtZW1iZXJzID0gbWVtYmVyc1Jvb3QgPyBnZXRDaGlsZHJlbkVsZW1lbnQobWVtYmVyc1Jvb3QpIDogZmluZENoaWxkcmVuRWxlbWVudChjb2xsZWN0aW9uLCAiZmVhdHVyZU1lbWJlciIpLm1hcCgKICAgICAgICAocGFyZW50KSA9PiBnZXRDaGlsZHJlbkVsZW1lbnQocGFyZW50KVswXQogICAgICApOwogICAgfQogICAgY29uc3QgaWRBdHRyID0gc2VydmljZVZlcnNpb24gPT09ICIxLjAuMCIgPyAiZmlkIiA6ICJnbWw6aWQiOwogICAgZnVuY3Rpb24gaXNFbGVtZW50UHJvcGVydHkocHJvcE5hbWUpIHsKICAgICAgcmV0dXJuIHByb3BOYW1lIGluIGZlYXR1cmVUeXBlRnVsbC5wcm9wZXJ0aWVzOwogICAgfQogICAgZnVuY3Rpb24gcGFyc2VFbGVtZW50UHJvcGVydHlWYWx1ZShwcm9wTmFtZSwgdmFsdWVBc1N0cmluZykgewogICAgICBjb25zdCB0eXBlID0gZmVhdHVyZVR5cGVGdWxsLnByb3BlcnRpZXNbcHJvcE5hbWVdOwogICAgICBzd2l0Y2ggKHR5cGUpIHsKICAgICAgICBjYXNlICJpbnRlZ2VyIjoKICAgICAgICAgIHJldHVybiBwYXJzZUludCh2YWx1ZUFzU3RyaW5nKTsKICAgICAgICBjYXNlICJmbG9hdCI6CiAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZUFzU3RyaW5nKTsKICAgICAgICBjYXNlICJib29sZWFuIjoKICAgICAgICAgIHJldHVybiB2YWx1ZUFzU3RyaW5nID09PSAidHJ1ZSI7CiAgICAgICAgZGVmYXVsdDoKICAgICAgICAgIHJldHVybiB2YWx1ZUFzU3RyaW5nOwogICAgICB9CiAgICB9CiAgICBmdW5jdGlvbiBnZXRQcm9wZXJ0aWVzKG1lbWJlckVsKSB7CiAgICAgIHJldHVybiBnZXRDaGlsZHJlbkVsZW1lbnQobWVtYmVyRWwpLmZpbHRlcigoZWwpID0+IGlzRWxlbWVudFByb3BlcnR5KHN0cmlwTmFtZXNwYWNlKGdldEVsZW1lbnROYW1lKGVsKSkpKS5yZWR1Y2UoKHByZXYsIGN1cnIpID0+IHsKICAgICAgICBjb25zdCBwcm9wTmFtZSA9IHN0cmlwTmFtZXNwYWNlKGdldEVsZW1lbnROYW1lKGN1cnIpKTsKICAgICAgICByZXR1cm4gewogICAgICAgICAgLi4ucHJldiwKICAgICAgICAgIFtwcm9wTmFtZV06IHBhcnNlRWxlbWVudFByb3BlcnR5VmFsdWUocHJvcE5hbWUsIGdldEVsZW1lbnRUZXh0KGN1cnIpKQogICAgICAgIH07CiAgICAgIH0sIHt9KTsKICAgIH0KICAgIHJldHVybiBtZW1iZXJzLm1hcCgoZWwpID0+ICh7CiAgICAgIGlkOiBnZXRFbGVtZW50QXR0cmlidXRlKGVsLCBpZEF0dHIpLAogICAgICBwcm9wZXJ0aWVzOiBnZXRQcm9wZXJ0aWVzKGVsKQogICAgfSkpOwogIH0KICBmdW5jdGlvbiBjb21wdXRlRmVhdHVyZVByb3BzRGV0YWlscyhmZWF0dXJlc1dpdGhQcm9wcykgewogICAgcmV0dXJuIGZlYXR1cmVzV2l0aFByb3BzLnJlZHVjZSgocHJldiwgY3VycikgPT4gewogICAgICBmb3IgKGNvbnN0IHByb3BOYW1lIGluIGN1cnIucHJvcGVydGllcykgewogICAgICAgIGNvbnN0IHByb3BWYWx1ZSA9IGN1cnIucHJvcGVydGllc1twcm9wTmFtZV07CiAgICAgICAgaWYgKCEocHJvcE5hbWUgaW4gcHJldikpIHsKICAgICAgICAgIHByZXZbcHJvcE5hbWVdID0geyB1bmlxdWVWYWx1ZXM6IFtdIH07CiAgICAgICAgfQogICAgICAgIGNvbnN0IHVuaXF1ZVZhbHVlID0gcHJldltwcm9wTmFtZV0udW5pcXVlVmFsdWVzLmZpbmQoCiAgICAgICAgICAodikgPT4gdi52YWx1ZSA9PT0gcHJvcFZhbHVlCiAgICAgICAgKTsKICAgICAgICBpZiAodW5pcXVlVmFsdWUpCiAgICAgICAgICB1bmlxdWVWYWx1ZS5jb3VudCsrOwogICAgICAgIGVsc2UKICAgICAgICAgIHByZXZbcHJvcE5hbWVdLnVuaXF1ZVZhbHVlcy5wdXNoKHsgdmFsdWU6IHByb3BWYWx1ZSwgY291bnQ6IDEgfSk7CiAgICAgIH0KICAgICAgcmV0dXJuIHByZXY7CiAgICB9LCB7fSk7CiAgfQogIGZ1bmN0aW9uIGdlbmVyYXRlR2V0RmVhdHVyZVVybChzZXJ2aWNlVXJsLCB2ZXJzaW9uLCBmZWF0dXJlVHlwZSwgb3V0cHV0Rm9ybWF0LCBtYXhGZWF0dXJlcywgYXR0cmlidXRlcywgaGl0c09ubHksIG91dHB1dENycywgZXh0ZW50LCBleHRlbnRDcnMsIHN0YXJ0SW5kZXgsIHNvcnRCeSkgewogICAgY29uc3QgdHlwZVBhcmFtID0gdmVyc2lvbiA9PT0gIjIuMC4wIiA/ICJUWVBFTkFNRVMiIDogIlRZUEVOQU1FIjsKICAgIGNvbnN0IGNvdW50UGFyYW0gPSB2ZXJzaW9uID09PSAiMi4wLjAiID8gIkNPVU5UIiA6ICJNQVhGRUFUVVJFUyI7CiAgICBjb25zdCBuZXdQYXJhbXMgPSB7CiAgICAgIFNFUlZJQ0U6ICJXRlMiLAogICAgICBSRVFVRVNUOiAiR2V0RmVhdHVyZSIsCiAgICAgIFZFUlNJT046IHZlcnNpb24sCiAgICAgIFt0eXBlUGFyYW1dOiBmZWF0dXJlVHlwZQogICAgfTsKICAgIGlmIChvdXRwdXRGb3JtYXQgIT09IHZvaWQgMCkKICAgICAgbmV3UGFyYW1zLk9VVFBVVEZPUk1BVCA9IG91dHB1dEZvcm1hdDsKICAgIGlmIChhdHRyaWJ1dGVzICE9PSB2b2lkIDApCiAgICAgIG5ld1BhcmFtcy5QUk9QRVJUWU5BTUUgPSBhdHRyaWJ1dGVzLmpvaW4oIiwiKTsKICAgIGlmIChoaXRzT25seSkgewogICAgICBuZXdQYXJhbXMuUkVTVUxUVFlQRSA9ICJoaXRzIjsKICAgICAgbmV3UGFyYW1zW2NvdW50UGFyYW1dID0gIjEiOwogICAgfSBlbHNlIGlmIChtYXhGZWF0dXJlcyAhPT0gdm9pZCAwKQogICAgICBuZXdQYXJhbXNbY291bnRQYXJhbV0gPSBtYXhGZWF0dXJlcy50b1N0cmluZygxMCk7CiAgICBpZiAob3V0cHV0Q3JzKSB7CiAgICAgIG5ld1BhcmFtcy5TUlNOQU1FID0gb3V0cHV0Q3JzOwogICAgfQogICAgaWYgKGV4dGVudCkgewogICAgICBjb25zdCBleHRlbnRKb2luZWQgPSBleHRlbnQuam9pbigiLCIpOwogICAgICBuZXdQYXJhbXMuQkJPWCA9IGV4dGVudENycyA/IGAke2V4dGVudEpvaW5lZH0sJHtleHRlbnRDcnN9YCA6IGV4dGVudEpvaW5lZDsKICAgIH0KICAgIGlmIChzdGFydEluZGV4KSB7CiAgICAgIG5ld1BhcmFtcy5TVEFSVElOREVYID0gc3RhcnRJbmRleC50b1N0cmluZygxMCk7CiAgICB9CiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHNldFF1ZXJ5UGFyYW1zKHNlcnZpY2VVcmwsIG5ld1BhcmFtcykpOwogICAgaWYgKEFycmF5LmlzQXJyYXkoc29ydEJ5KSAmJiBzb3J0QnkubGVuZ3RoID4gMCkgewogICAgICBjb25zdCBzb3J0cyA9IHNvcnRCeS5tYXAoKGZpZWxkU29ydCkgPT4gYCR7ZmllbGRTb3J0WzFdfSAke2ZpZWxkU29ydFswXX1gKS5qb2luKCIsIik7CiAgICAgIHVybC5zZWFyY2hQYXJhbXMuc2V0KCJTT1JUQlkiLCBzb3J0cyk7CiAgICB9CiAgICByZXR1cm4gdXJsLnRvU3RyaW5nKCk7CiAgfQogIGFkZFRhc2tIYW5kbGVyKAogICAgInBhcnNlV21zQ2FwYWJpbGl0aWVzIiwKICAgIGdsb2JhbFRoaXMsCiAgICAoeyB1cmwgfSkgPT4gcXVlcnlYbWxEb2N1bWVudCh1cmwpLnRoZW4oKHhtbERvYykgPT4gY2hlY2soeG1sRG9jLCB1cmwpKS50aGVuKCh4bWxEb2MpID0+ICh7CiAgICAgIGluZm86IHJlYWRJbmZvRnJvbUNhcGFiaWxpdGllcyQyKHhtbERvYyksCiAgICAgIGxheWVyczogcmVhZExheWVyc0Zyb21DYXBhYmlsaXRpZXMkMSh4bWxEb2MpLAogICAgICB1cmw6IHJlYWRPcGVyYXRpb25VcmxzRnJvbUNhcGFiaWxpdGllcyQxKHhtbERvYyksCiAgICAgIHZlcnNpb246IHJlYWRWZXJzaW9uRnJvbUNhcGFiaWxpdGllcyQxKHhtbERvYykKICAgIH0pKQogICk7CiAgYWRkVGFza0hhbmRsZXIoCiAgICAicGFyc2VXZnNDYXBhYmlsaXRpZXMiLAogICAgZ2xvYmFsVGhpcywKICAgICh7IHVybCB9KSA9PiBxdWVyeVhtbERvY3VtZW50KHVybCkudGhlbigoeG1sRG9jKSA9PiBjaGVjayh4bWxEb2MsIHVybCkpLnRoZW4oKHhtbERvYykgPT4gKHsKICAgICAgaW5mbzogcmVhZEluZm9Gcm9tQ2FwYWJpbGl0aWVzJDEoeG1sRG9jKSwKICAgICAgZmVhdHVyZVR5cGVzOiByZWFkRmVhdHVyZVR5cGVzRnJvbUNhcGFiaWxpdGllcyh4bWxEb2MpLAogICAgICB1cmw6IHJlYWRPcGVyYXRpb25VcmxzRnJvbUNhcGFiaWxpdGllcyh4bWxEb2MpLAogICAgICB2ZXJzaW9uOiByZWFkVmVyc2lvbkZyb21DYXBhYmlsaXRpZXMoeG1sRG9jKQogICAgfSkpCiAgKTsKICBhZGRUYXNrSGFuZGxlcigKICAgICJxdWVyeVdmc0ZlYXR1cmVUeXBlRGV0YWlscyIsCiAgICBnbG9iYWxUaGlzLAogICAgKHsKICAgICAgdXJsLAogICAgICBzZXJ2aWNlVmVyc2lvbiwKICAgICAgZmVhdHVyZVR5cGVGdWxsCiAgICB9KSA9PiB7CiAgICAgIGNvbnN0IGdldEZlYXR1cmVVcmwgPSBnZW5lcmF0ZUdldEZlYXR1cmVVcmwoCiAgICAgICAgdXJsLAogICAgICAgIHNlcnZpY2VWZXJzaW9uLAogICAgICAgIGZlYXR1cmVUeXBlRnVsbC5uYW1lLAogICAgICAgIHZvaWQgMCwKICAgICAgICB2b2lkIDAsCiAgICAgICAgT2JqZWN0LmtleXMoZmVhdHVyZVR5cGVGdWxsLnByb3BlcnRpZXMpCiAgICAgICk7CiAgICAgIHJldHVybiBxdWVyeVhtbERvY3VtZW50KGdldEZlYXR1cmVVcmwpLnRoZW4oKGdldEZlYXR1cmVEb2MpID0+ICh7CiAgICAgICAgcHJvcHM6IGNvbXB1dGVGZWF0dXJlUHJvcHNEZXRhaWxzKAogICAgICAgICAgcGFyc2VGZWF0dXJlUHJvcHMoZ2V0RmVhdHVyZURvYywgZmVhdHVyZVR5cGVGdWxsLCBzZXJ2aWNlVmVyc2lvbikKICAgICAgICApCiAgICAgIH0pKTsKICAgIH0KICApOwogIGFkZFRhc2tIYW5kbGVyKAogICAgInVwZGF0ZUZldGNoT3B0aW9ucyIsCiAgICBnbG9iYWxUaGlzLAogICAgKHsgb3B0aW9ucyB9KSA9PiB7CiAgICAgIHNldEZldGNoT3B0aW9ucyhvcHRpb25zKTsKICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7fSk7CiAgICB9CiAgKTsKICBhZGRUYXNrSGFuZGxlcigKICAgICJwYXJzZVdtdHNDYXBhYmlsaXRpZXMiLAogICAgZ2xvYmFsVGhpcywKICAgICh7IHVybCB9KSA9PiBxdWVyeVhtbERvY3VtZW50KHVybCkudGhlbigoeG1sRG9jKSA9PiBjaGVjayh4bWxEb2MsIHVybCkpLnRoZW4oKHhtbERvYykgPT4gKHsKICAgICAgaW5mbzogcmVhZEluZm9Gcm9tQ2FwYWJpbGl0aWVzKHhtbERvYyksCiAgICAgIGxheWVyczogcmVhZExheWVyc0Zyb21DYXBhYmlsaXRpZXMoeG1sRG9jKSwKICAgICAgbWF0cml4U2V0czogcmVhZE1hdHJpeFNldHNGcm9tQ2FwYWJpbGl0aWVzKHhtbERvYykKICAgIH0pKQogICk7Cn0pKCk7Ci8vIyBzb3VyY2VNYXBwaW5nVVJMPXdvcmtlci1MRGtNT3gwZC5qcy5tYXAK")], { type: "text/javascript;charset=utf-8" });
function se(e) {
	let t;
	try {
		if (t = oe && (window.URL || window.webkitURL).createObjectURL(oe), !t) throw "";
		let n = new Worker(t, { name: e?.name });
		return n.addEventListener("error", () => {
			(window.URL || window.webkitURL).revokeObjectURL(t);
		}), n;
	} catch {
		return new Worker("data:text/javascript;base64,KGZ1bmN0aW9uKCkgewogICJ1c2Ugc3RyaWN0IjsKICAvKiEgQHJncm92ZS9wYXJzZS14bWwgdjQuMS4wIHwgSVNDIExpY2Vuc2UgfCBDb3B5cmlnaHQgUnlhbiBHcm92ZSAqLwogIHZhciBfX2RlZlByb3AgPSBPYmplY3QuZGVmaW5lUHJvcGVydHk7CiAgdmFyIF9fZ2V0T3duUHJvcERlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yOwogIHZhciBfX2dldE93blByb3BOYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzOwogIHZhciBfX2hhc093blByb3AgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5OwogIHZhciBfX2V4cG9ydCA9ICh0YXJnZXQsIGFsbCkgPT4gewogICAgZm9yICh2YXIgbmFtZSBpbiBhbGwpCiAgICAgIF9fZGVmUHJvcCh0YXJnZXQsIG5hbWUsIHsgZ2V0OiBhbGxbbmFtZV0sIGVudW1lcmFibGU6IHRydWUgfSk7CiAgfTsKICB2YXIgX19jb3B5UHJvcHMgPSAodG8sIGZyb20sIGV4Y2VwdCwgZGVzYykgPT4gewogICAgaWYgKGZyb20gJiYgdHlwZW9mIGZyb20gPT09ICJvYmplY3QiIHx8IHR5cGVvZiBmcm9tID09PSAiZnVuY3Rpb24iKSB7CiAgICAgIGZvciAobGV0IGtleSBvZiBfX2dldE93blByb3BOYW1lcyhmcm9tKSkKICAgICAgICBpZiAoIV9faGFzT3duUHJvcC5jYWxsKHRvLCBrZXkpICYmIGtleSAhPT0gZXhjZXB0KQogICAgICAgICAgX19kZWZQcm9wKHRvLCBrZXksIHsgZ2V0OiAoKSA9PiBmcm9tW2tleV0sIGVudW1lcmFibGU6ICEoZGVzYyA9IF9fZ2V0T3duUHJvcERlc2MoZnJvbSwga2V5KSkgfHwgZGVzYy5lbnVtZXJhYmxlIH0pOwogICAgfQogICAgcmV0dXJuIHRvOwogIH07CiAgdmFyIF9fdG9Db21tb25KUyA9IChtb2QpID0+IF9fY29weVByb3BzKF9fZGVmUHJvcCh7fSwgIl9fZXNNb2R1bGUiLCB7IHZhbHVlOiB0cnVlIH0pLCBtb2QpOwogIHZhciBzcmNfZXhwb3J0cyA9IHt9OwogIF9fZXhwb3J0KHNyY19leHBvcnRzLCB7CiAgICBYbWxDZGF0YTogKCkgPT4gWG1sQ2RhdGEsCiAgICBYbWxDb21tZW50OiAoKSA9PiBYbWxDb21tZW50LAogICAgWG1sRGVjbGFyYXRpb246ICgpID0+IFhtbERlY2xhcmF0aW9uLAogICAgWG1sRG9jdW1lbnQ6ICgpID0+IFhtbERvY3VtZW50LAogICAgWG1sRG9jdW1lbnRUeXBlOiAoKSA9PiBYbWxEb2N1bWVudFR5cGUsCiAgICBYbWxFbGVtZW50OiAoKSA9PiBYbWxFbGVtZW50LAogICAgWG1sRXJyb3I6ICgpID0+IFhtbEVycm9yLAogICAgWG1sTm9kZTogKCkgPT4gWG1sTm9kZSwKICAgIFhtbFByb2Nlc3NpbmdJbnN0cnVjdGlvbjogKCkgPT4gWG1sUHJvY2Vzc2luZ0luc3RydWN0aW9uLAogICAgWG1sVGV4dDogKCkgPT4gWG1sVGV4dCwKICAgIHBhcnNlWG1sOiAoKSA9PiBwYXJzZVhtbAogIH0pOwogIHZhciBicm93c2VyID0gX190b0NvbW1vbkpTKHNyY19leHBvcnRzKTsKICB2YXIgZW1wdHlTdHJpbmcgPSAiIjsKICB2YXIgc3Vycm9nYXRlUGFpciA9IC9bXHVEODAwLVx1REJGRl1bXHVEQzAwLVx1REZGRl0vZzsKICB2YXIgU3RyaW5nU2Nhbm5lciA9IGNsYXNzIHsKICAgIGNvbnN0cnVjdG9yKHN0cmluZykgewogICAgICB0aGlzLmsgPSB0aGlzLnEoc3RyaW5nLCB0cnVlKTsKICAgICAgdGhpcy5kID0gMDsKICAgICAgdGhpcy5sZW5ndGggPSBzdHJpbmcubGVuZ3RoOwogICAgICB0aGlzLm4gPSB0aGlzLmsgIT09IHRoaXMubGVuZ3RoOwogICAgICB0aGlzLm0gPSBzdHJpbmc7CiAgICAgIGlmICh0aGlzLm4pIHsKICAgICAgICBsZXQgY2hhcnNUb0J5dGVzID0gW107CiAgICAgICAgZm9yIChsZXQgYnl0ZUluZGV4ID0gMCwgY2hhckluZGV4ID0gMDsgY2hhckluZGV4IDwgdGhpcy5rOyArK2NoYXJJbmRleCkgewogICAgICAgICAgY2hhcnNUb0J5dGVzW2NoYXJJbmRleF0gPSBieXRlSW5kZXg7CiAgICAgICAgICBieXRlSW5kZXggKz0gc3RyaW5nLmNvZGVQb2ludEF0KGJ5dGVJbmRleCkgPiA2NTUzNSA/IDIgOiAxOwogICAgICAgIH0KICAgICAgICB0aGlzLnkgPSBjaGFyc1RvQnl0ZXM7CiAgICAgIH0KICAgIH0KICAgIC8qKgogICAgICogV2hldGhlciB0aGUgY3VycmVudCBjaGFyYWN0ZXIgaW5kZXggaXMgYXQgdGhlIGVuZCBvZiB0aGUgaW5wdXQgc3RyaW5nLgogICAgICovCiAgICBnZXQgeigpIHsKICAgICAgcmV0dXJuIHRoaXMuZCA+PSB0aGlzLms7CiAgICB9CiAgICAvLyAtLSBQcm90ZWN0ZWQgTWV0aG9kcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KICAgIC8qKgogICAgICogUmV0dXJucyB0aGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgaW4gdGhlIGdpdmVuIHN0cmluZywgd2hpY2ggbWF5IGRpZmZlciBmcm9tCiAgICAgKiB0aGUgYnl0ZSBsZW5ndGggaWYgdGhlIHN0cmluZyBjb250YWlucyBtdWx0aWJ5dGUgY2hhcmFjdGVycy4KICAgICAqLwogICAgcShzdHJpbmcsIG11bHRpQnl0ZVNhZmUgPSB0aGlzLm4pIHsKICAgICAgcmV0dXJuIG11bHRpQnl0ZVNhZmUgPyBzdHJpbmcucmVwbGFjZShzdXJyb2dhdGVQYWlyLCAiXyIpLmxlbmd0aCA6IHN0cmluZy5sZW5ndGg7CiAgICB9CiAgICAvLyAtLSBQdWJsaWMgTWV0aG9kcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0KICAgIC8qKgogICAgICogQWR2YW5jZXMgdGhlIHNjYW5uZXIgYnkgdGhlIGdpdmVuIG51bWJlciBvZiBjaGFyYWN0ZXJzLCBzdG9wcGluZyBpZiB0aGUgZW5kCiAgICAgKiBvZiB0aGUgc3RyaW5nIGlzIHJlYWNoZWQuCiAgICAgKi8KICAgIGcoY291bnQgPSAxKSB7CiAgICAgIHRoaXMuZCA9IE1hdGgubWluKHRoaXMuaywgdGhpcy5kICsgY291bnQpOwogICAgfQogICAgLyoqCiAgICAgKiBSZXR1cm5zIHRoZSBieXRlIGluZGV4IG9mIHRoZSBnaXZlbiBjaGFyYWN0ZXIgaW5kZXggaW4gdGhlIHN0cmluZy4gVGhlIHR3bwogICAgICogbWF5IGRpZmZlciBpbiBzdHJpbmdzIHRoYXQgY29udGFpbiBtdWx0aWJ5dGUgY2hhcmFjdGVycy4KICAgICAqLwogICAgaShjaGFySW5kZXggPSB0aGlzLmQpIHsKICAgICAgdmFyIF9hOwogICAgICByZXR1cm4gdGhpcy5uID8gKF9hID0gdGhpcy55W2NoYXJJbmRleF0pICE9IG51bGwgPyBfYSA6IEluZmluaXR5IDogY2hhckluZGV4OwogICAgfQogICAgLyoqCiAgICAgKiBDb25zdW1lcyBhbmQgcmV0dXJucyB0aGUgZ2l2ZW4gbnVtYmVyIG9mIGNoYXJhY3RlcnMgaWYgcG9zc2libGUsIGFkdmFuY2luZwogICAgICogdGhlIHNjYW5uZXIgYW5kIHN0b3BwaW5nIGlmIHRoZSBlbmQgb2YgdGhlIHN0cmluZyBpcyByZWFjaGVkLgogICAgICoKICAgICAqIElmIG5vIGNoYXJhY3RlcnMgY291bGQgYmUgY29uc3VtZWQsIGFuIGVtcHR5IHN0cmluZyB3aWxsIGJlIHJldHVybmVkLgogICAgICovCiAgICBGKGNvdW50ID0gMSkgewogICAgICBsZXQgY2hhcnMgPSB0aGlzLmgoY291bnQpOwogICAgICB0aGlzLmcoY291bnQpOwogICAgICByZXR1cm4gY2hhcnM7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGEgbWF0Y2ggZm9yIHRoZSBnaXZlbiBzdGlja3kgcmVnZXgsIGFkdmFuY2VzIHRoZSBzY2FubmVyLCB1cGRhdGVzCiAgICAgKiB0aGUgYGxhc3RJbmRleGAgcHJvcGVydHkgb2YgdGhlIHJlZ2V4LCBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgc3RyaW5nLgogICAgICoKICAgICAqIFRoZSByZWdleCBtdXN0IGhhdmUgYSBzdGlja3kgZmxhZyAoInkiKSBzbyB0aGF0IGl0cyBgbGFzdEluZGV4YCBwcm9wIGNhbiBiZQogICAgICogdXNlZCB0byBhbmNob3IgdGhlIG1hdGNoIGF0IHRoZSBjdXJyZW50IHNjYW5uZXIgcG9zaXRpb24uCiAgICAgKgogICAgICogUmV0dXJucyB0aGUgY29uc3VtZWQgc3RyaW5nLCBvciBhbiBlbXB0eSBzdHJpbmcgaWYgbm90aGluZyB3YXMgY29uc3VtZWQuCiAgICAgKi8KICAgIEcocmVnZXgpIHsKICAgICAgaWYgKCFyZWdleC5zdGlja3kpIHsKICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ByZWdleGAgbXVzdCBoYXZlIGEgc3RpY2t5IGZsYWcgKCJ5IiknKTsKICAgICAgfQogICAgICByZWdleC5sYXN0SW5kZXggPSB0aGlzLmkoKTsKICAgICAgbGV0IHJlc3VsdCA9IHJlZ2V4LmV4ZWModGhpcy5tKTsKICAgICAgaWYgKHJlc3VsdCA9PT0gbnVsbCB8fCByZXN1bHQubGVuZ3RoID09PSAwKSB7CiAgICAgICAgcmV0dXJuIGVtcHR5U3RyaW5nOwogICAgICB9CiAgICAgIGxldCBtYXRjaCA9IHJlc3VsdFswXTsKICAgICAgdGhpcy5nKHRoaXMucShtYXRjaCkpOwogICAgICByZXR1cm4gbWF0Y2g7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGFuZCByZXR1cm5zIGFsbCBjaGFyYWN0ZXJzIGZvciB3aGljaCB0aGUgZ2l2ZW4gZnVuY3Rpb24gcmV0dXJucyBhCiAgICAgKiB0cnV0aHkgdmFsdWUsIHN0b3BwaW5nIG9uIHRoZSBmaXJzdCBmYWxzeSByZXR1cm4gdmFsdWUgb3IgaWYgdGhlIGVuZCBvZiB0aGUKICAgICAqIGlucHV0IGlzIHJlYWNoZWQuCiAgICAgKi8KICAgIHYoZm4pIHsKICAgICAgbGV0IGNoYXI7CiAgICAgIGxldCBtYXRjaCA9IGVtcHR5U3RyaW5nOwogICAgICB3aGlsZSAoKGNoYXIgPSB0aGlzLmgoKSkgJiYgZm4oY2hhcikpIHsKICAgICAgICBtYXRjaCArPSBjaGFyOwogICAgICAgIHRoaXMuZygpOwogICAgICB9CiAgICAgIHJldHVybiBtYXRjaDsKICAgIH0KICAgIC8qKgogICAgICogQ29uc3VtZXMgdGhlIGdpdmVuIHN0cmluZyBpZiBpdCBleGlzdHMgYXQgdGhlIGN1cnJlbnQgY2hhcmFjdGVyIGluZGV4LCBhbmQKICAgICAqIGFkdmFuY2VzIHRoZSBzY2FubmVyLgogICAgICoKICAgICAqIElmIHRoZSBnaXZlbiBzdHJpbmcgZG9lc24ndCBleGlzdCBhdCB0aGUgY3VycmVudCBjaGFyYWN0ZXIgaW5kZXgsIGFuIGVtcHR5CiAgICAgKiBzdHJpbmcgd2lsbCBiZSByZXR1cm5lZCBhbmQgdGhlIHNjYW5uZXIgd2lsbCBub3QgYmUgYWR2YW5jZWQuCiAgICAgKi8KICAgIFEoc3RyaW5nVG9Db25zdW1lKSB7CiAgICAgIGlmICh0aGlzLmIoc3RyaW5nVG9Db25zdW1lKSkgewogICAgICAgIHJldHVybiBzdHJpbmdUb0NvbnN1bWU7CiAgICAgIH0KICAgICAgaWYgKHRoaXMubikgewogICAgICAgIGxldCB7IGxlbmd0aCB9ID0gc3RyaW5nVG9Db25zdW1lOwogICAgICAgIGxldCBjaGFyTGVuZ3RoVG9NYXRjaCA9IHRoaXMucShzdHJpbmdUb0NvbnN1bWUpOwogICAgICAgIGlmIChjaGFyTGVuZ3RoVG9NYXRjaCAhPT0gbGVuZ3RoICYmIHN0cmluZ1RvQ29uc3VtZSA9PT0gdGhpcy5oKGNoYXJMZW5ndGhUb01hdGNoKSkgewogICAgICAgICAgdGhpcy5nKGNoYXJMZW5ndGhUb01hdGNoKTsKICAgICAgICAgIHJldHVybiBzdHJpbmdUb0NvbnN1bWU7CiAgICAgICAgfQogICAgICB9CiAgICAgIHJldHVybiBlbXB0eVN0cmluZzsKICAgIH0KICAgIC8qKgogICAgICogRG9lcyB0aGUgc2FtZSB0aGluZyBhcyBgY29uc3VtZVN0cmluZygpYCwgYnV0IGRvZXNuJ3Qgc3VwcG9ydCBjb25zdW1pbmcKICAgICAqIG11bHRpYnl0ZSBjaGFyYWN0ZXJzLiBUaGlzIGNhbiBiZSBmYXN0ZXIgaWYgeW91IG9ubHkgbmVlZCB0byBtYXRjaCBzaW5nbGUKICAgICAqIGJ5dGUgY2hhcmFjdGVycy4KICAgICAqLwogICAgYihzdHJpbmdUb0NvbnN1bWUpIHsKICAgICAgbGV0IHsgbGVuZ3RoIH0gPSBzdHJpbmdUb0NvbnN1bWU7CiAgICAgIGlmICh0aGlzLmgobGVuZ3RoKSA9PT0gc3RyaW5nVG9Db25zdW1lKSB7CiAgICAgICAgdGhpcy5nKGxlbmd0aCk7CiAgICAgICAgcmV0dXJuIHN0cmluZ1RvQ29uc3VtZTsKICAgICAgfQogICAgICByZXR1cm4gZW1wdHlTdHJpbmc7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGNoYXJhY3RlcnMgdW50aWwgdGhlIGdpdmVuIGdsb2JhbCByZWdleCBpcyBtYXRjaGVkLCBhZHZhbmNpbmcgdGhlCiAgICAgKiBzY2FubmVyIHVwIHRvIChidXQgbm90IGJleW9uZCkgdGhlIGJlZ2lubmluZyBvZiB0aGUgbWF0Y2guIElmIHRoZSByZWdleAogICAgICogZG9lc24ndCBtYXRjaCwgbm90aGluZyB3aWxsIGJlIGNvbnN1bWVkLgogICAgICoKICAgICAqIFJldHVybnMgdGhlIGNvbnN1bWVkIHN0cmluZywgb3IgYW4gZW1wdHkgc3RyaW5nIGlmIG5vdGhpbmcgd2FzIGNvbnN1bWVkLgogICAgICovCiAgICBBKHJlZ2V4KSB7CiAgICAgIGxldCByZXN0T2ZTdHJpbmcgPSB0aGlzLm0uc2xpY2UodGhpcy5pKCkpOwogICAgICBsZXQgbWF0Y2hCeXRlSW5kZXggPSByZXN0T2ZTdHJpbmcuc2VhcmNoKHJlZ2V4KTsKICAgICAgaWYgKG1hdGNoQnl0ZUluZGV4IDw9IDApIHsKICAgICAgICByZXR1cm4gZW1wdHlTdHJpbmc7CiAgICAgIH0KICAgICAgbGV0IHJlc3VsdCA9IHJlc3RPZlN0cmluZy5zbGljZSgwLCBtYXRjaEJ5dGVJbmRleCk7CiAgICAgIHRoaXMuZyh0aGlzLnEocmVzdWx0KSk7CiAgICAgIHJldHVybiByZXN1bHQ7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGNoYXJhY3RlcnMgdW50aWwgdGhlIGdpdmVuIHN0cmluZyBpcyBmb3VuZCwgYWR2YW5jaW5nIHRoZSBzY2FubmVyCiAgICAgKiB1cCB0byAoYnV0IG5vdCBiZXlvbmQpIHRoYXQgcG9pbnQuIElmIHRoZSBzdHJpbmcgaXMgbmV2ZXIgZm91bmQsIG5vdGhpbmcKICAgICAqIHdpbGwgYmUgY29uc3VtZWQuCiAgICAgKgogICAgICogUmV0dXJucyB0aGUgY29uc3VtZWQgc3RyaW5nLCBvciBhbiBlbXB0eSBzdHJpbmcgaWYgbm90aGluZyB3YXMgY29uc3VtZWQuCiAgICAgKi8KICAgIHQoc2VhcmNoU3RyaW5nKSB7CiAgICAgIGxldCB7IG06IHN0cmluZyB9ID0gdGhpczsKICAgICAgbGV0IGJ5dGVJbmRleCA9IHRoaXMuaSgpOwogICAgICBsZXQgbWF0Y2hCeXRlSW5kZXggPSBzdHJpbmcuaW5kZXhPZihzZWFyY2hTdHJpbmcsIGJ5dGVJbmRleCk7CiAgICAgIGlmIChtYXRjaEJ5dGVJbmRleCA8PSAwKSB7CiAgICAgICAgcmV0dXJuIGVtcHR5U3RyaW5nOwogICAgICB9CiAgICAgIGxldCByZXN1bHQgPSBzdHJpbmcuc2xpY2UoYnl0ZUluZGV4LCBtYXRjaEJ5dGVJbmRleCk7CiAgICAgIHRoaXMuZyh0aGlzLnEocmVzdWx0KSk7CiAgICAgIHJldHVybiByZXN1bHQ7CiAgICB9CiAgICAvKioKICAgICAqIFJldHVybnMgdGhlIGdpdmVuIG51bWJlciBvZiBjaGFyYWN0ZXJzIHN0YXJ0aW5nIGF0IHRoZSBjdXJyZW50IGNoYXJhY3RlcgogICAgICogaW5kZXgsIHdpdGhvdXQgYWR2YW5jaW5nIHRoZSBzY2FubmVyIGFuZCB3aXRob3V0IGV4Y2VlZGluZyB0aGUgZW5kIG9mIHRoZQogICAgICogaW5wdXQgc3RyaW5nLgogICAgICovCiAgICBoKGNvdW50ID0gMSkgewogICAgICBsZXQgeyBkOiBjaGFySW5kZXgsIG46IG11bHRpQnl0ZU1vZGUsIG06IHN0cmluZyB9ID0gdGhpczsKICAgICAgaWYgKG11bHRpQnl0ZU1vZGUpIHsKICAgICAgICBpZiAoY2hhckluZGV4ID49IHRoaXMuaykgewogICAgICAgICAgcmV0dXJuIGVtcHR5U3RyaW5nOwogICAgICAgIH0KICAgICAgICByZXR1cm4gc3RyaW5nLnNsaWNlKAogICAgICAgICAgdGhpcy5pKGNoYXJJbmRleCksCiAgICAgICAgICB0aGlzLmkoY2hhckluZGV4ICsgY291bnQpCiAgICAgICAgKTsKICAgICAgfQogICAgICByZXR1cm4gc3RyaW5nLnNsaWNlKGNoYXJJbmRleCwgY2hhckluZGV4ICsgY291bnQpOwogICAgfQogICAgLyoqCiAgICAgKiBSZXNldHMgdGhlIHNjYW5uZXIgcG9zaXRpb24gdG8gdGhlIGdpdmVuIGNoYXJhY3RlciBfaW5kZXhfLCBvciB0byB0aGUgc3RhcnQKICAgICAqIG9mIHRoZSBpbnB1dCBzdHJpbmcgaWYgbm8gaW5kZXggaXMgZ2l2ZW4uCiAgICAgKgogICAgICogSWYgX2luZGV4XyBpcyBuZWdhdGl2ZSwgdGhlIHNjYW5uZXIgcG9zaXRpb24gd2lsbCBiZSBtb3ZlZCBiYWNrd2FyZCBieSB0aGF0CiAgICAgKiBtYW55IGNoYXJhY3RlcnMsIHN0b3BwaW5nIGlmIHRoZSBiZWdpbm5pbmcgb2YgdGhlIHN0cmluZyBpcyByZWFjaGVkLgogICAgICovCiAgICBvKGluZGV4ID0gMCkgewogICAgICB0aGlzLmQgPSBpbmRleCA+PSAwID8gTWF0aC5taW4odGhpcy5rLCBpbmRleCkgOiBNYXRoLm1heCgwLCB0aGlzLmQgKyBpbmRleCk7CiAgICB9CiAgfTsKICB2YXIgYXR0VmFsdWVDaGFyRG91YmxlUXVvdGUgPSAvW14iJjxdKy95OwogIHZhciBhdHRWYWx1ZUNoYXJTaW5nbGVRdW90ZSA9IC9bXicmPF0rL3k7CiAgdmFyIGF0dFZhbHVlTm9ybWFsaXplZFdoaXRlc3BhY2UgPSAvXHJcbnxbXG5cclx0XS9nOwogIHZhciBlbmRDaGFyRGF0YSA9IC88fCZ8XV0+LzsKICB2YXIgcHJlZGVmaW5lZEVudGl0aWVzID0gT2JqZWN0LmZyZWV6ZShPYmplY3QuYXNzaWduKC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpLCB7CiAgICBhbXA6ICImIiwKICAgIGFwb3M6ICInIiwKICAgIGd0OiAiPiIsCiAgICBsdDogIjwiLAogICAgcXVvdDogJyInCiAgfSkpOwogIGZ1bmN0aW9uIGlzTmFtZUNoYXIoY2hhcikgewogICAgbGV0IGNwID0gZ2V0Q29kZVBvaW50KGNoYXIpOwogICAgcmV0dXJuIGNwID49IDk3ICYmIGNwIDw9IDEyMiB8fCBjcCA+PSA2NSAmJiBjcCA8PSA5MCB8fCBjcCA+PSA0OCAmJiBjcCA8PSA1NyB8fCBjcCA9PT0gNDUgfHwgY3AgPT09IDQ2IHx8IGNwID09PSAxODMgfHwgY3AgPj0gNzY4ICYmIGNwIDw9IDg3OSB8fCBjcCA+PSA4MjU1ICYmIGNwIDw9IDgyNTYgfHwgaXNOYW1lU3RhcnRDaGFyKGNoYXIsIGNwKTsKICB9CiAgZnVuY3Rpb24gaXNOYW1lU3RhcnRDaGFyKGNoYXIsIGNwID0gZ2V0Q29kZVBvaW50KGNoYXIpKSB7CiAgICByZXR1cm4gY3AgPj0gOTcgJiYgY3AgPD0gMTIyIHx8IGNwID49IDY1ICYmIGNwIDw9IDkwIHx8IGNwID09PSA1OCB8fCBjcCA9PT0gOTUgfHwgY3AgPj0gMTkyICYmIGNwIDw9IDIxNCB8fCBjcCA+PSAyMTYgJiYgY3AgPD0gMjQ2IHx8IGNwID49IDI0OCAmJiBjcCA8PSA3NjcgfHwgY3AgPj0gODgwICYmIGNwIDw9IDg5MyB8fCBjcCA+PSA4OTUgJiYgY3AgPD0gODE5MSB8fCBjcCA+PSA4MjA0ICYmIGNwIDw9IDgyMDUgfHwgY3AgPj0gODMwNCAmJiBjcCA8PSA4NTkxIHx8IGNwID49IDExMjY0ICYmIGNwIDw9IDEyMjcxIHx8IGNwID49IDEyMjg5ICYmIGNwIDw9IDU1Mjk1IHx8IGNwID49IDYzNzQ0ICYmIGNwIDw9IDY0OTc1IHx8IGNwID49IDY1MDA4ICYmIGNwIDw9IDY1NTMzIHx8IGNwID49IDY1NTM2ICYmIGNwIDw9IDk4MzAzOTsKICB9CiAgZnVuY3Rpb24gaXNSZWZlcmVuY2VDaGFyKGNoYXIpIHsKICAgIHJldHVybiBjaGFyID09PSAiIyIgfHwgaXNOYW1lQ2hhcihjaGFyKTsKICB9CiAgZnVuY3Rpb24gaXNXaGl0ZXNwYWNlKGNoYXIpIHsKICAgIGxldCBjcCA9IGdldENvZGVQb2ludChjaGFyKTsKICAgIHJldHVybiBjcCA9PT0gMzIgfHwgY3AgPT09IDkgfHwgY3AgPT09IDEwIHx8IGNwID09PSAxMzsKICB9CiAgZnVuY3Rpb24gaXNYbWxDb2RlUG9pbnQoY3ApIHsKICAgIHJldHVybiBjcCA9PT0gOSB8fCBjcCA9PT0gMTAgfHwgY3AgPT09IDEzIHx8IGNwID49IDMyICYmIGNwIDw9IDU1Mjk1IHx8IGNwID49IDU3MzQ0ICYmIGNwIDw9IDY1NTMzIHx8IGNwID49IDY1NTM2ICYmIGNwIDw9IDExMTQxMTE7CiAgfQogIGZ1bmN0aW9uIGdldENvZGVQb2ludChjaGFyKSB7CiAgICByZXR1cm4gY2hhci5jb2RlUG9pbnRBdCgwKSB8fCAtMTsKICB9CiAgdmFyIF9YbWxOb2RlID0gY2xhc3MgewogICAgY29uc3RydWN0b3IoKSB7CiAgICAgIHRoaXMucGFyZW50ID0gbnVsbDsKICAgICAgdGhpcy5zdGFydCA9IC0xOwogICAgICB0aGlzLmVuZCA9IC0xOwogICAgfQogICAgLyoqCiAgICAgKiBEb2N1bWVudCB0aGF0IGNvbnRhaW5zIHRoaXMgbm9kZSwgb3IgYG51bGxgIGlmIHRoaXMgbm9kZSBpcyBub3QgYXNzb2NpYXRlZAogICAgICogd2l0aCBhIGRvY3VtZW50LgogICAgICovCiAgICBnZXQgZG9jdW1lbnQoKSB7CiAgICAgIHZhciBfYSwgX2I7CiAgICAgIHJldHVybiAoX2IgPSAoX2EgPSB0aGlzLnBhcmVudCkgPT0gbnVsbCA/IHZvaWQgMCA6IF9hLmRvY3VtZW50KSAhPSBudWxsID8gX2IgOiBudWxsOwogICAgfQogICAgLyoqCiAgICAgKiBXaGV0aGVyIHRoaXMgbm9kZSBpcyB0aGUgcm9vdCBub2RlIG9mIHRoZSBkb2N1bWVudCAoYWxzbyBrbm93biBhcyB0aGUKICAgICAqIGRvY3VtZW50IGVsZW1lbnQpLgogICAgICovCiAgICBnZXQgaXNSb290Tm9kZSgpIHsKICAgICAgcmV0dXJuIHRoaXMucGFyZW50ICE9PSBudWxsICYmIHRoaXMucGFyZW50ID09PSB0aGlzLmRvY3VtZW50ICYmIHRoaXMudHlwZSA9PT0gX1htbE5vZGUuVFlQRV9FTEVNRU5UOwogICAgfQogICAgLyoqCiAgICAgKiBXaGV0aGVyIHdoaXRlc3BhY2Ugc2hvdWxkIGJlIHByZXNlcnZlZCBpbiB0aGUgY29udGVudCBvZiB0aGlzIGVsZW1lbnQgYW5kCiAgICAgKiBpdHMgY2hpbGRyZW4uCiAgICAgKgogICAgICogVGhpcyBpcyBpbmZsdWVuY2VkIGJ5IHRoZSB2YWx1ZSBvZiB0aGUgc3BlY2lhbCBgeG1sOnNwYWNlYCBhdHRyaWJ1dGUsIGFuZAogICAgICogd2lsbCBiZSBgdHJ1ZWAgZm9yIGFueSBub2RlIHdob3NlIGB4bWw6c3BhY2VgIGF0dHJpYnV0ZSBpcyBzZXQgdG8KICAgICAqICJwcmVzZXJ2ZSIuIElmIGEgbm9kZSBoYXMgbm8gc3VjaCBhdHRyaWJ1dGUsIGl0IHdpbGwgaW5oZXJpdCB0aGUgdmFsdWUgb2YKICAgICAqIHRoZSBuZWFyZXN0IGFuY2VzdG9yIHRoYXQgZG9lcyAoaWYgYW55KS4KICAgICAqCiAgICAgKiBAc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy14bWwtMjAwODExMjYvI3NlYy13aGl0ZS1zcGFjZQogICAgICovCiAgICBnZXQgcHJlc2VydmVXaGl0ZXNwYWNlKCkgewogICAgICB2YXIgX2E7CiAgICAgIHJldHVybiAhISgoX2EgPSB0aGlzLnBhcmVudCkgPT0gbnVsbCA/IHZvaWQgMCA6IF9hLnByZXNlcnZlV2hpdGVzcGFjZSk7CiAgICB9CiAgICAvKioKICAgICAqIFR5cGUgb2YgdGhpcyBub2RlLgogICAgICoKICAgICAqIFRoZSB2YWx1ZSBvZiB0aGlzIHByb3BlcnR5IGlzIGEgc3RyaW5nIHRoYXQgbWF0Y2hlcyBvbmUgb2YgdGhlIHN0YXRpYwogICAgICogYFRZUEVfKmAgcHJvcGVydGllcyBvbiB0aGUgYFhtbE5vZGVgIGNsYXNzIChlLmcuIGBUWVBFX0VMRU1FTlRgLAogICAgICogYFRZUEVfVEVYVGAsIGV0Yy4pLgogICAgICoKICAgICAqIFRoZSBgWG1sTm9kZWAgY2xhc3MgaXRzZWxmIGlzIGEgYmFzZSBjbGFzcyBhbmQgZG9lc24ndCBoYXZlIGl0cyBvd24gdHlwZQogICAgICogbmFtZS4KICAgICAqLwogICAgZ2V0IHR5cGUoKSB7CiAgICAgIHJldHVybiAiIjsKICAgIH0KICAgIC8qKgogICAgICogUmV0dXJucyBhIEpTT04tc2VyaWFsaXphYmxlIG9iamVjdCByZXByZXNlbnRpbmcgdGhpcyBub2RlLCBtaW51cyBwcm9wZXJ0aWVzCiAgICAgKiB0aGF0IGNvdWxkIHJlc3VsdCBpbiBjaXJjdWxhciByZWZlcmVuY2VzLgogICAgICovCiAgICB0b0pTT04oKSB7CiAgICAgIGxldCBqc29uID0gewogICAgICAgIHR5cGU6IHRoaXMudHlwZQogICAgICB9OwogICAgICBpZiAodGhpcy5pc1Jvb3ROb2RlKSB7CiAgICAgICAganNvbi5pc1Jvb3ROb2RlID0gdHJ1ZTsKICAgICAgfQogICAgICBpZiAodGhpcy5wcmVzZXJ2ZVdoaXRlc3BhY2UpIHsKICAgICAgICBqc29uLnByZXNlcnZlV2hpdGVzcGFjZSA9IHRydWU7CiAgICAgIH0KICAgICAgaWYgKHRoaXMuc3RhcnQgIT09IC0xKSB7CiAgICAgICAganNvbi5zdGFydCA9IHRoaXMuc3RhcnQ7CiAgICAgICAganNvbi5lbmQgPSB0aGlzLmVuZDsKICAgICAgfQogICAgICByZXR1cm4ganNvbjsKICAgIH0KICB9OwogIHZhciBYbWxOb2RlID0gX1htbE5vZGU7CiAgWG1sTm9kZS5UWVBFX0NEQVRBID0gImNkYXRhIjsKICBYbWxOb2RlLlRZUEVfQ09NTUVOVCA9ICJjb21tZW50IjsKICBYbWxOb2RlLlRZUEVfRE9DVU1FTlQgPSAiZG9jdW1lbnQiOwogIFhtbE5vZGUuVFlQRV9ET0NVTUVOVF9UWVBFID0gImRvY3R5cGUiOwogIFhtbE5vZGUuVFlQRV9FTEVNRU5UID0gImVsZW1lbnQiOwogIFhtbE5vZGUuVFlQRV9QUk9DRVNTSU5HX0lOU1RSVUNUSU9OID0gInBpIjsKICBYbWxOb2RlLlRZUEVfVEVYVCA9ICJ0ZXh0IjsKICBYbWxOb2RlLlRZUEVfWE1MX0RFQ0xBUkFUSU9OID0gInhtbGRlY2wiOwogIHZhciBYbWxUZXh0ID0gY2xhc3MgZXh0ZW5kcyBYbWxOb2RlIHsKICAgIGNvbnN0cnVjdG9yKHRleHQgPSAiIikgewogICAgICBzdXBlcigpOwogICAgICB0aGlzLnRleHQgPSB0ZXh0OwogICAgfQogICAgZ2V0IHR5cGUoKSB7CiAgICAgIHJldHVybiBYbWxOb2RlLlRZUEVfVEVYVDsKICAgIH0KICAgIHRvSlNPTigpIHsKICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oWG1sTm9kZS5wcm90b3R5cGUudG9KU09OLmNhbGwodGhpcyksIHsKICAgICAgICB0ZXh0OiB0aGlzLnRleHQKICAgICAgfSk7CiAgICB9CiAgfTsKICB2YXIgWG1sQ2RhdGEgPSBjbGFzcyBleHRlbmRzIFhtbFRleHQgewogICAgZ2V0IHR5cGUoKSB7CiAgICAgIHJldHVybiBYbWxOb2RlLlRZUEVfQ0RBVEE7CiAgICB9CiAgfTsKICB2YXIgWG1sQ29tbWVudCA9IGNsYXNzIGV4dGVuZHMgWG1sTm9kZSB7CiAgICBjb25zdHJ1Y3Rvcihjb250ZW50ID0gIiIpIHsKICAgICAgc3VwZXIoKTsKICAgICAgdGhpcy5jb250ZW50ID0gY29udGVudDsKICAgIH0KICAgIGdldCB0eXBlKCkgewogICAgICByZXR1cm4gWG1sTm9kZS5UWVBFX0NPTU1FTlQ7CiAgICB9CiAgICB0b0pTT04oKSB7CiAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKFhtbE5vZGUucHJvdG90eXBlLnRvSlNPTi5jYWxsKHRoaXMpLCB7CiAgICAgICAgY29udGVudDogdGhpcy5jb250ZW50CiAgICAgIH0pOwogICAgfQogIH07CiAgdmFyIFhtbERlY2xhcmF0aW9uID0gY2xhc3MgZXh0ZW5kcyBYbWxOb2RlIHsKICAgIGNvbnN0cnVjdG9yKHZlcnNpb24sIGVuY29kaW5nLCBzdGFuZGFsb25lKSB7CiAgICAgIHN1cGVyKCk7CiAgICAgIHRoaXMudmVyc2lvbiA9IHZlcnNpb247CiAgICAgIHRoaXMuZW5jb2RpbmcgPSBlbmNvZGluZyAhPSBudWxsID8gZW5jb2RpbmcgOiBudWxsOwogICAgICB0aGlzLnN0YW5kYWxvbmUgPSBzdGFuZGFsb25lICE9IG51bGwgPyBzdGFuZGFsb25lIDogbnVsbDsKICAgIH0KICAgIGdldCB0eXBlKCkgewogICAgICByZXR1cm4gWG1sTm9kZS5UWVBFX1hNTF9ERUNMQVJBVElPTjsKICAgIH0KICAgIHRvSlNPTigpIHsKICAgICAgbGV0IGpzb24gPSBYbWxOb2RlLnByb3RvdHlwZS50b0pTT04uY2FsbCh0aGlzKTsKICAgICAganNvbi52ZXJzaW9uID0gdGhpcy52ZXJzaW9uOwogICAgICBmb3IgKGxldCBrZXkgb2YgWyJlbmNvZGluZyIsICJzdGFuZGFsb25lIl0pIHsKICAgICAgICBpZiAodGhpc1trZXldICE9PSBudWxsKSB7CiAgICAgICAgICBqc29uW2tleV0gPSB0aGlzW2tleV07CiAgICAgICAgfQogICAgICB9CiAgICAgIHJldHVybiBqc29uOwogICAgfQogIH07CiAgdmFyIFhtbEVsZW1lbnQgPSBjbGFzcyBleHRlbmRzIFhtbE5vZGUgewogICAgY29uc3RydWN0b3IobmFtZSwgYXR0cmlidXRlcyA9IC8qIEBfX1BVUkVfXyAqLyBPYmplY3QuY3JlYXRlKG51bGwpLCBjaGlsZHJlbiA9IFtdKSB7CiAgICAgIHN1cGVyKCk7CiAgICAgIHRoaXMubmFtZSA9IG5hbWU7CiAgICAgIHRoaXMuYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXM7CiAgICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjsKICAgIH0KICAgIC8qKgogICAgICogV2hldGhlciB0aGlzIGVsZW1lbnQgaXMgZW1wdHkgKG1lYW5pbmcgaXQgaGFzIG5vIGNoaWxkcmVuKS4KICAgICAqLwogICAgZ2V0IGlzRW1wdHkoKSB7CiAgICAgIHJldHVybiB0aGlzLmNoaWxkcmVuLmxlbmd0aCA9PT0gMDsKICAgIH0KICAgIGdldCBwcmVzZXJ2ZVdoaXRlc3BhY2UoKSB7CiAgICAgIGxldCBub2RlID0gdGhpczsKICAgICAgd2hpbGUgKG5vZGUgaW5zdGFuY2VvZiBYbWxFbGVtZW50KSB7CiAgICAgICAgaWYgKCJ4bWw6c3BhY2UiIGluIG5vZGUuYXR0cmlidXRlcykgewogICAgICAgICAgcmV0dXJuIG5vZGUuYXR0cmlidXRlc1sieG1sOnNwYWNlIl0gPT09ICJwcmVzZXJ2ZSI7CiAgICAgICAgfQogICAgICAgIG5vZGUgPSBub2RlLnBhcmVudDsKICAgICAgfQogICAgICByZXR1cm4gZmFsc2U7CiAgICB9CiAgICAvKioKICAgICAqIFRleHQgY29udGVudCBvZiB0aGlzIGVsZW1lbnQgYW5kIGFsbCBpdHMgZGVzY2VuZGFudHMuCiAgICAgKi8KICAgIGdldCB0ZXh0KCkgewogICAgICByZXR1cm4gdGhpcy5jaGlsZHJlbi5tYXAoKGNoaWxkKSA9PiAidGV4dCIgaW4gY2hpbGQgPyBjaGlsZC50ZXh0IDogIiIpLmpvaW4oIiIpOwogICAgfQogICAgZ2V0IHR5cGUoKSB7CiAgICAgIHJldHVybiBYbWxOb2RlLlRZUEVfRUxFTUVOVDsKICAgIH0KICAgIHRvSlNPTigpIHsKICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oWG1sTm9kZS5wcm90b3R5cGUudG9KU09OLmNhbGwodGhpcyksIHsKICAgICAgICBuYW1lOiB0aGlzLm5hbWUsCiAgICAgICAgYXR0cmlidXRlczogdGhpcy5hdHRyaWJ1dGVzLAogICAgICAgIGNoaWxkcmVuOiB0aGlzLmNoaWxkcmVuLm1hcCgoY2hpbGQpID0+IGNoaWxkLnRvSlNPTigpKQogICAgICB9KTsKICAgIH0KICB9OwogIHZhciBYbWxEb2N1bWVudCA9IGNsYXNzIGV4dGVuZHMgWG1sTm9kZSB7CiAgICBjb25zdHJ1Y3RvcihjaGlsZHJlbiA9IFtdKSB7CiAgICAgIHN1cGVyKCk7CiAgICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjsKICAgIH0KICAgIGdldCBkb2N1bWVudCgpIHsKICAgICAgcmV0dXJuIHRoaXM7CiAgICB9CiAgICAvKioKICAgICAqIFJvb3QgZWxlbWVudCBvZiB0aGlzIGRvY3VtZW50LCBvciBgbnVsbGAgaWYgdGhpcyBkb2N1bWVudCBpcyBlbXB0eS4KICAgICAqLwogICAgZ2V0IHJvb3QoKSB7CiAgICAgIGZvciAobGV0IGNoaWxkIG9mIHRoaXMuY2hpbGRyZW4pIHsKICAgICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBYbWxFbGVtZW50KSB7CiAgICAgICAgICByZXR1cm4gY2hpbGQ7CiAgICAgICAgfQogICAgICB9CiAgICAgIHJldHVybiBudWxsOwogICAgfQogICAgLyoqCiAgICAgKiBUZXh0IGNvbnRlbnQgb2YgdGhpcyBkb2N1bWVudCBhbmQgYWxsIGl0cyBkZXNjZW5kYW50cy4KICAgICAqLwogICAgZ2V0IHRleHQoKSB7CiAgICAgIHJldHVybiB0aGlzLmNoaWxkcmVuLm1hcCgoY2hpbGQpID0+ICJ0ZXh0IiBpbiBjaGlsZCA/IGNoaWxkLnRleHQgOiAiIikuam9pbigiIik7CiAgICB9CiAgICBnZXQgdHlwZSgpIHsKICAgICAgcmV0dXJuIFhtbE5vZGUuVFlQRV9ET0NVTUVOVDsKICAgIH0KICAgIHRvSlNPTigpIHsKICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oWG1sTm9kZS5wcm90b3R5cGUudG9KU09OLmNhbGwodGhpcyksIHsKICAgICAgICBjaGlsZHJlbjogdGhpcy5jaGlsZHJlbi5tYXAoKGNoaWxkKSA9PiBjaGlsZC50b0pTT04oKSkKICAgICAgfSk7CiAgICB9CiAgfTsKICB2YXIgWG1sRG9jdW1lbnRUeXBlID0gY2xhc3MgZXh0ZW5kcyBYbWxOb2RlIHsKICAgIGNvbnN0cnVjdG9yKG5hbWUsIHB1YmxpY0lkLCBzeXN0ZW1JZCwgaW50ZXJuYWxTdWJzZXQpIHsKICAgICAgc3VwZXIoKTsKICAgICAgdGhpcy5uYW1lID0gbmFtZTsKICAgICAgdGhpcy5wdWJsaWNJZCA9IHB1YmxpY0lkICE9IG51bGwgPyBwdWJsaWNJZCA6IG51bGw7CiAgICAgIHRoaXMuc3lzdGVtSWQgPSBzeXN0ZW1JZCAhPSBudWxsID8gc3lzdGVtSWQgOiBudWxsOwogICAgICB0aGlzLmludGVybmFsU3Vic2V0ID0gaW50ZXJuYWxTdWJzZXQgIT0gbnVsbCA/IGludGVybmFsU3Vic2V0IDogbnVsbDsKICAgIH0KICAgIGdldCB0eXBlKCkgewogICAgICByZXR1cm4gWG1sTm9kZS5UWVBFX0RPQ1VNRU5UX1RZUEU7CiAgICB9CiAgICB0b0pTT04oKSB7CiAgICAgIGxldCBqc29uID0gWG1sTm9kZS5wcm90b3R5cGUudG9KU09OLmNhbGwodGhpcyk7CiAgICAgIGpzb24ubmFtZSA9IHRoaXMubmFtZTsKICAgICAgZm9yIChsZXQga2V5IG9mIFsicHVibGljSWQiLCAic3lzdGVtSWQiLCAiaW50ZXJuYWxTdWJzZXQiXSkgewogICAgICAgIGlmICh0aGlzW2tleV0gIT09IG51bGwpIHsKICAgICAgICAgIGpzb25ba2V5XSA9IHRoaXNba2V5XTsKICAgICAgICB9CiAgICAgIH0KICAgICAgcmV0dXJuIGpzb247CiAgICB9CiAgfTsKICB2YXIgWG1sRXJyb3IgPSBjbGFzcyBleHRlbmRzIEVycm9yIHsKICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2UsIGNoYXJJbmRleCwgeG1sKSB7CiAgICAgIGxldCBjb2x1bW4gPSAxOwogICAgICBsZXQgZXhjZXJwdCA9ICIiOwogICAgICBsZXQgbGluZSA9IDE7CiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hhckluZGV4OyArK2kpIHsKICAgICAgICBsZXQgY2hhciA9IHhtbFtpXTsKICAgICAgICBpZiAoY2hhciA9PT0gIlxuIikgewogICAgICAgICAgY29sdW1uID0gMTsKICAgICAgICAgIGV4Y2VycHQgPSAiIjsKICAgICAgICAgIGxpbmUgKz0gMTsKICAgICAgICB9IGVsc2UgewogICAgICAgICAgY29sdW1uICs9IDE7CiAgICAgICAgICBleGNlcnB0ICs9IGNoYXI7CiAgICAgICAgfQogICAgICB9CiAgICAgIGxldCBlb2wgPSB4bWwuaW5kZXhPZigiXG4iLCBjaGFySW5kZXgpOwogICAgICBleGNlcnB0ICs9IGVvbCA9PT0gLTEgPyB4bWwuc2xpY2UoY2hhckluZGV4KSA6IHhtbC5zbGljZShjaGFySW5kZXgsIGVvbCk7CiAgICAgIGxldCBleGNlcnB0U3RhcnQgPSAwOwogICAgICBpZiAoZXhjZXJwdC5sZW5ndGggPiA1MCkgewogICAgICAgIGlmIChjb2x1bW4gPCA0MCkgewogICAgICAgICAgZXhjZXJwdCA9IGV4Y2VycHQuc2xpY2UoMCwgNTApOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICBleGNlcnB0U3RhcnQgPSBjb2x1bW4gLSAyMDsKICAgICAgICAgIGV4Y2VycHQgPSBleGNlcnB0LnNsaWNlKGV4Y2VycHRTdGFydCwgY29sdW1uICsgMzApOwogICAgICAgIH0KICAgICAgfQogICAgICBzdXBlcigKICAgICAgICBgJHttZXNzYWdlfSAobGluZSAke2xpbmV9LCBjb2x1bW4gJHtjb2x1bW59KQogICR7ZXhjZXJwdH0KYCArICIgIi5yZXBlYXQoY29sdW1uIC0gZXhjZXJwdFN0YXJ0ICsgMSkgKyAiXlxuIgogICAgICApOwogICAgICB0aGlzLmNvbHVtbiA9IGNvbHVtbjsKICAgICAgdGhpcy5leGNlcnB0ID0gZXhjZXJwdDsKICAgICAgdGhpcy5saW5lID0gbGluZTsKICAgICAgdGhpcy5uYW1lID0gIlhtbEVycm9yIjsKICAgICAgdGhpcy5wb3MgPSBjaGFySW5kZXg7CiAgICB9CiAgfTsKICB2YXIgWG1sUHJvY2Vzc2luZ0luc3RydWN0aW9uID0gY2xhc3MgZXh0ZW5kcyBYbWxOb2RlIHsKICAgIGNvbnN0cnVjdG9yKG5hbWUsIGNvbnRlbnQgPSAiIikgewogICAgICBzdXBlcigpOwogICAgICB0aGlzLm5hbWUgPSBuYW1lOwogICAgICB0aGlzLmNvbnRlbnQgPSBjb250ZW50OwogICAgfQogICAgZ2V0IHR5cGUoKSB7CiAgICAgIHJldHVybiBYbWxOb2RlLlRZUEVfUFJPQ0VTU0lOR19JTlNUUlVDVElPTjsKICAgIH0KICAgIHRvSlNPTigpIHsKICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oWG1sTm9kZS5wcm90b3R5cGUudG9KU09OLmNhbGwodGhpcyksIHsKICAgICAgICBuYW1lOiB0aGlzLm5hbWUsCiAgICAgICAgY29udGVudDogdGhpcy5jb250ZW50CiAgICAgIH0pOwogICAgfQogIH07CiAgdmFyIGVtcHR5U3RyaW5nMiA9ICIiOwogIHZhciBQYXJzZXIgPSBjbGFzcyB7CiAgICAvKioKICAgICAqIEBwYXJhbSB4bWwgWE1MIHN0cmluZyB0byBwYXJzZS4KICAgICAqIEBwYXJhbSBvcHRpb25zIFBhcnNlciBvcHRpb25zLgogICAgICovCiAgICBjb25zdHJ1Y3Rvcih4bWwsIG9wdGlvbnMgPSB7fSkgewogICAgICBsZXQgZG9jID0gdGhpcy5kb2N1bWVudCA9IG5ldyBYbWxEb2N1bWVudCgpOwogICAgICBsZXQgc2Nhbm5lciA9IHRoaXMuYyA9IG5ldyBTdHJpbmdTY2FubmVyKHhtbCk7CiAgICAgIHRoaXMubCA9IGRvYzsKICAgICAgdGhpcy5mID0gb3B0aW9uczsKICAgICAgaWYgKHRoaXMuZi5pbmNsdWRlT2Zmc2V0cykgewogICAgICAgIGRvYy5zdGFydCA9IDA7CiAgICAgICAgZG9jLmVuZCA9IHhtbC5sZW5ndGg7CiAgICAgIH0KICAgICAgc2Nhbm5lci5iKCJcdUZFRkYiKTsKICAgICAgdGhpcy5IKCk7CiAgICAgIGlmICghdGhpcy5CKCkpIHsKICAgICAgICB0aHJvdyB0aGlzLmEoIlJvb3QgZWxlbWVudCBpcyBtaXNzaW5nIG9yIGludmFsaWQiKTsKICAgICAgfQogICAgICB3aGlsZSAodGhpcy53KCkpIHsKICAgICAgfQogICAgICBpZiAoIXNjYW5uZXIueikgewogICAgICAgIHRocm93IHRoaXMuYSgiRXh0cmEgY29udGVudCBhdCB0aGUgZW5kIG9mIHRoZSBkb2N1bWVudCIpOwogICAgICB9CiAgICB9CiAgICAvKioKICAgICAqIEFkZHMgdGhlIGdpdmVuIGBYbWxOb2RlYCBhcyBhIGNoaWxkIG9mIGB0aGlzLmN1cnJlbnROb2RlYC4KICAgICAqLwogICAgaihub2RlLCBjaGFySW5kZXgpIHsKICAgICAgbm9kZS5wYXJlbnQgPSB0aGlzLmw7CiAgICAgIGlmICh0aGlzLmYuaW5jbHVkZU9mZnNldHMpIHsKICAgICAgICBub2RlLnN0YXJ0ID0gdGhpcy5jLmkoY2hhckluZGV4KTsKICAgICAgICBub2RlLmVuZCA9IHRoaXMuYy5pKCk7CiAgICAgIH0KICAgICAgdGhpcy5sLmNoaWxkcmVuLnB1c2gobm9kZSk7CiAgICAgIHJldHVybiB0cnVlOwogICAgfQogICAgLyoqCiAgICAgKiBBZGRzIHRoZSBnaXZlbiBfdGV4dF8gdG8gdGhlIGRvY3VtZW50LCBlaXRoZXIgYnkgYXBwZW5kaW5nIGl0IHRvIGEKICAgICAqIHByZWNlZGluZyBgWG1sVGV4dGAgbm9kZSAoaWYgcG9zc2libGUpIG9yIGJ5IGNyZWF0aW5nIGEgbmV3IGBYbWxUZXh0YCBub2RlLgogICAgICovCiAgICB4KHRleHQsIGNoYXJJbmRleCkgewogICAgICBsZXQgeyBjaGlsZHJlbiB9ID0gdGhpcy5sOwogICAgICBsZXQgeyBsZW5ndGggfSA9IGNoaWxkcmVuOwogICAgICB0ZXh0ID0gbm9ybWFsaXplTGluZUJyZWFrcyh0ZXh0KTsKICAgICAgaWYgKGxlbmd0aCA+IDApIHsKICAgICAgICBsZXQgcHJldk5vZGUgPSBjaGlsZHJlbltsZW5ndGggLSAxXTsKICAgICAgICBpZiAoKHByZXZOb2RlID09IG51bGwgPyB2b2lkIDAgOiBwcmV2Tm9kZS50eXBlKSA9PT0gWG1sTm9kZS5UWVBFX1RFWFQpIHsKICAgICAgICAgIGxldCB0ZXh0Tm9kZSA9IHByZXZOb2RlOwogICAgICAgICAgdGV4dE5vZGUudGV4dCArPSB0ZXh0OwogICAgICAgICAgaWYgKHRoaXMuZi5pbmNsdWRlT2Zmc2V0cykgewogICAgICAgICAgICB0ZXh0Tm9kZS5lbmQgPSB0aGlzLmMuaSgpOwogICAgICAgICAgfQogICAgICAgICAgcmV0dXJuIHRydWU7CiAgICAgICAgfQogICAgICB9CiAgICAgIHJldHVybiB0aGlzLmoobmV3IFhtbFRleHQodGV4dCksIGNoYXJJbmRleCk7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGVsZW1lbnQgYXR0cmlidXRlcy4KICAgICAqCiAgICAgKiBAc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy14bWwtMjAwODExMjYvI3NlYy1zdGFydHRhZ3MKICAgICAqLwogICAgSSgpIHsKICAgICAgbGV0IGF0dHJpYnV0ZXMgPSAvKiBAX19QVVJFX18gKi8gT2JqZWN0LmNyZWF0ZShudWxsKTsKICAgICAgd2hpbGUgKHRoaXMuZSgpKSB7CiAgICAgICAgbGV0IGF0dHJOYW1lID0gdGhpcy5yKCk7CiAgICAgICAgaWYgKCFhdHRyTmFtZSkgewogICAgICAgICAgYnJlYWs7CiAgICAgICAgfQogICAgICAgIGxldCBhdHRyVmFsdWUgPSB0aGlzLnUoKSAmJiB0aGlzLkooKTsKICAgICAgICBpZiAoYXR0clZhbHVlID09PSBmYWxzZSkgewogICAgICAgICAgdGhyb3cgdGhpcy5hKCJBdHRyaWJ1dGUgdmFsdWUgZXhwZWN0ZWQiKTsKICAgICAgICB9CiAgICAgICAgaWYgKGF0dHJOYW1lIGluIGF0dHJpYnV0ZXMpIHsKICAgICAgICAgIHRocm93IHRoaXMuYShgRHVwbGljYXRlIGF0dHJpYnV0ZTogJHthdHRyTmFtZX1gKTsKICAgICAgICB9CiAgICAgICAgaWYgKGF0dHJOYW1lID09PSAieG1sOnNwYWNlIiAmJiBhdHRyVmFsdWUgIT09ICJkZWZhdWx0IiAmJiBhdHRyVmFsdWUgIT09ICJwcmVzZXJ2ZSIpIHsKICAgICAgICAgIHRocm93IHRoaXMuYSgnVmFsdWUgb2YgdGhlIGB4bWw6c3BhY2VgIGF0dHJpYnV0ZSBtdXN0IGJlICJkZWZhdWx0IiBvciAicHJlc2VydmUiJyk7CiAgICAgICAgfQogICAgICAgIGF0dHJpYnV0ZXNbYXR0ck5hbWVdID0gYXR0clZhbHVlOwogICAgICB9CiAgICAgIGlmICh0aGlzLmYuc29ydEF0dHJpYnV0ZXMpIHsKICAgICAgICBsZXQgYXR0ck5hbWVzID0gT2JqZWN0LmtleXMoYXR0cmlidXRlcykuc29ydCgpOwogICAgICAgIGxldCBzb3J0ZWRBdHRyaWJ1dGVzID0gLyogQF9fUFVSRV9fICovIE9iamVjdC5jcmVhdGUobnVsbCk7CiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRyTmFtZXMubGVuZ3RoOyArK2kpIHsKICAgICAgICAgIGxldCBhdHRyTmFtZSA9IGF0dHJOYW1lc1tpXTsKICAgICAgICAgIHNvcnRlZEF0dHJpYnV0ZXNbYXR0ck5hbWVdID0gYXR0cmlidXRlc1thdHRyTmFtZV07CiAgICAgICAgfQogICAgICAgIGF0dHJpYnV0ZXMgPSBzb3J0ZWRBdHRyaWJ1dGVzOwogICAgICB9CiAgICAgIHJldHVybiBhdHRyaWJ1dGVzOwogICAgfQogICAgLyoqCiAgICAgKiBDb25zdW1lcyBhbiBgQXR0VmFsdWVgIChhdHRyaWJ1dGUgdmFsdWUpIGlmIHBvc3NpYmxlLgogICAgICoKICAgICAqIEByZXR1cm5zCiAgICAgKiAgIENvbnRlbnRzIG9mIHRoZSBgQXR0VmFsdWVgIG1pbnVzIHF1b3Rlcywgb3IgYGZhbHNlYCBpZiBub3RoaW5nIHdhcwogICAgICogICBjb25zdW1lZC4gQW4gZW1wdHkgc3RyaW5nIGluZGljYXRlcyB0aGF0IGFuIGBBdHRWYWx1ZWAgd2FzIGNvbnN1bWVkIGJ1dAogICAgICogICB3YXMgZW1wdHkuCiAgICAgKgogICAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMteG1sLTIwMDgxMTI2LyNOVC1BdHRWYWx1ZQogICAgICovCiAgICBKKCkgewogICAgICBsZXQgeyBjOiBzY2FubmVyIH0gPSB0aGlzOwogICAgICBsZXQgcXVvdGUgPSBzY2FubmVyLmgoKTsKICAgICAgaWYgKHF1b3RlICE9PSAnIicgJiYgcXVvdGUgIT09ICInIikgewogICAgICAgIHJldHVybiBmYWxzZTsKICAgICAgfQogICAgICBzY2FubmVyLmcoKTsKICAgICAgbGV0IGNoYXJzOwogICAgICBsZXQgaXNDbG9zZWQgPSBmYWxzZTsKICAgICAgbGV0IHZhbHVlID0gZW1wdHlTdHJpbmcyOwogICAgICBsZXQgcmVnZXggPSBxdW90ZSA9PT0gJyInID8gYXR0VmFsdWVDaGFyRG91YmxlUXVvdGUgOiBhdHRWYWx1ZUNoYXJTaW5nbGVRdW90ZTsKICAgICAgbWF0Y2hMb29wOgogICAgICAgIHdoaWxlICghc2Nhbm5lci56KSB7CiAgICAgICAgICBjaGFycyA9IHNjYW5uZXIuRyhyZWdleCk7CiAgICAgICAgICBpZiAoY2hhcnMpIHsKICAgICAgICAgICAgdGhpcy5wKGNoYXJzKTsKICAgICAgICAgICAgdmFsdWUgKz0gY2hhcnMucmVwbGFjZShhdHRWYWx1ZU5vcm1hbGl6ZWRXaGl0ZXNwYWNlLCAiICIpOwogICAgICAgICAgfQogICAgICAgICAgc3dpdGNoIChzY2FubmVyLmgoKSkgewogICAgICAgICAgICBjYXNlIHF1b3RlOgogICAgICAgICAgICAgIGlzQ2xvc2VkID0gdHJ1ZTsKICAgICAgICAgICAgICBicmVhayBtYXRjaExvb3A7CiAgICAgICAgICAgIGNhc2UgIiYiOgogICAgICAgICAgICAgIHZhbHVlICs9IHRoaXMuQygpOwogICAgICAgICAgICAgIGNvbnRpbnVlOwogICAgICAgICAgICBjYXNlICI8IjoKICAgICAgICAgICAgICB0aHJvdyB0aGlzLmEoIlVuZXNjYXBlZCBgPGAgaXMgbm90IGFsbG93ZWQgaW4gYW4gYXR0cmlidXRlIHZhbHVlIik7CiAgICAgICAgICAgIGNhc2UgZW1wdHlTdHJpbmcyOgogICAgICAgICAgICAgIGJyZWFrIG1hdGNoTG9vcDsKICAgICAgICAgIH0KICAgICAgICB9CiAgICAgIGlmICghaXNDbG9zZWQpIHsKICAgICAgICB0aHJvdyB0aGlzLmEoIlVuY2xvc2VkIGF0dHJpYnV0ZSIpOwogICAgICB9CiAgICAgIHNjYW5uZXIuZygpOwogICAgICByZXR1cm4gdmFsdWU7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGEgQ0RBVEEgc2VjdGlvbiBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBAcmV0dXJucyBXaGV0aGVyIGEgQ0RBVEEgc2VjdGlvbiB3YXMgY29uc3VtZWQuCiAgICAgKiBAc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy14bWwtMjAwODExMjYvI3NlYy1jZGF0YS1zZWN0CiAgICAgKi8KICAgIEsoKSB7CiAgICAgIGxldCB7IGM6IHNjYW5uZXIgfSA9IHRoaXM7CiAgICAgIGxldCBzdGFydEluZGV4ID0gc2Nhbm5lci5kOwogICAgICBpZiAoIXNjYW5uZXIuYigiPCFbQ0RBVEFbIikpIHsKICAgICAgICByZXR1cm4gZmFsc2U7CiAgICAgIH0KICAgICAgbGV0IHRleHQgPSBzY2FubmVyLnQoIl1dPiIpOwogICAgICB0aGlzLnAodGV4dCk7CiAgICAgIGlmICghc2Nhbm5lci5iKCJdXT4iKSkgewogICAgICAgIHRocm93IHRoaXMuYSgiVW5jbG9zZWQgQ0RBVEEgc2VjdGlvbiIpOwogICAgICB9CiAgICAgIHJldHVybiB0aGlzLmYucHJlc2VydmVDZGF0YSA/IHRoaXMuaihuZXcgWG1sQ2RhdGEobm9ybWFsaXplTGluZUJyZWFrcyh0ZXh0KSksIHN0YXJ0SW5kZXgpIDogdGhpcy54KHRleHQsIHN0YXJ0SW5kZXgpOwogICAgfQogICAgLyoqCiAgICAgKiBDb25zdW1lcyBjaGFyYWN0ZXIgZGF0YSBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBAcmV0dXJucyBXaGV0aGVyIGNoYXJhY3RlciBkYXRhIHdhcyBjb25zdW1lZC4KICAgICAqIEBzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSLzIwMDgvUkVDLXhtbC0yMDA4MTEyNi8jZHQtY2hhcmRhdGEKICAgICAqLwogICAgTCgpIHsKICAgICAgbGV0IHsgYzogc2Nhbm5lciB9ID0gdGhpczsKICAgICAgbGV0IHN0YXJ0SW5kZXggPSBzY2FubmVyLmQ7CiAgICAgIGxldCBjaGFyRGF0YSA9IHNjYW5uZXIuQShlbmRDaGFyRGF0YSk7CiAgICAgIGlmICghY2hhckRhdGEpIHsKICAgICAgICByZXR1cm4gZmFsc2U7CiAgICAgIH0KICAgICAgdGhpcy5wKGNoYXJEYXRhKTsKICAgICAgaWYgKHNjYW5uZXIuaCgzKSA9PT0gIl1dPiIpIHsKICAgICAgICB0aHJvdyB0aGlzLmEoIkVsZW1lbnQgY29udGVudCBtYXkgbm90IGNvbnRhaW4gdGhlIENEQVRBIHNlY3Rpb24gY2xvc2UgZGVsaW1pdGVyIGBdXT5gIik7CiAgICAgIH0KICAgICAgcmV0dXJuIHRoaXMueChjaGFyRGF0YSwgc3RhcnRJbmRleCk7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGEgY29tbWVudCBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBAcmV0dXJucyBXaGV0aGVyIGEgY29tbWVudCB3YXMgY29uc3VtZWQuCiAgICAgKiBAc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy14bWwtMjAwODExMjYvI05ULUNvbW1lbnQKICAgICAqLwogICAgRCgpIHsKICAgICAgbGV0IHsgYzogc2Nhbm5lciB9ID0gdGhpczsKICAgICAgbGV0IHN0YXJ0SW5kZXggPSBzY2FubmVyLmQ7CiAgICAgIGlmICghc2Nhbm5lci5iKCI8IS0tIikpIHsKICAgICAgICByZXR1cm4gZmFsc2U7CiAgICAgIH0KICAgICAgbGV0IGNvbnRlbnQgPSBzY2FubmVyLnQoIi0tIik7CiAgICAgIHRoaXMucChjb250ZW50KTsKICAgICAgaWYgKCFzY2FubmVyLmIoIi0tPiIpKSB7CiAgICAgICAgaWYgKHNjYW5uZXIuaCgyKSA9PT0gIi0tIikgewogICAgICAgICAgdGhyb3cgdGhpcy5hKCJUaGUgc3RyaW5nIGAtLWAgaXNuJ3QgYWxsb3dlZCBpbnNpZGUgYSBjb21tZW50Iik7CiAgICAgICAgfQogICAgICAgIHRocm93IHRoaXMuYSgiVW5jbG9zZWQgY29tbWVudCIpOwogICAgICB9CiAgICAgIHJldHVybiB0aGlzLmYucHJlc2VydmVDb21tZW50cyA/IHRoaXMuaihuZXcgWG1sQ29tbWVudChub3JtYWxpemVMaW5lQnJlYWtzKGNvbnRlbnQpKSwgc3RhcnRJbmRleCkgOiB0cnVlOwogICAgfQogICAgLyoqCiAgICAgKiBDb25zdW1lcyBhIHJlZmVyZW5jZSBpbiBhIGNvbnRlbnQgY29udGV4dCBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBUaGlzIGRpZmZlcnMgZnJvbSBgY29uc3VtZVJlZmVyZW5jZSgpYCBpbiB0aGF0IGEgY29uc3VtZWQgcmVmZXJlbmNlIHdpbGwgYmUKICAgICAqIGFkZGVkIHRvIHRoZSBkb2N1bWVudCBhcyBhIHRleHQgbm9kZSBpbnN0ZWFkIG9mIHJldHVybmVkLgogICAgICoKICAgICAqIEByZXR1cm5zIFdoZXRoZXIgYSByZWZlcmVuY2Ugd2FzIGNvbnN1bWVkLgogICAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMteG1sLTIwMDgxMTI2LyNlbnRwcm9jCiAgICAgKi8KICAgIE0oKSB7CiAgICAgIGxldCBzdGFydEluZGV4ID0gdGhpcy5jLmQ7CiAgICAgIGxldCByZWYgPSB0aGlzLkMoKTsKICAgICAgcmV0dXJuIHJlZiA/IHRoaXMueChyZWYsIHN0YXJ0SW5kZXgpIDogZmFsc2U7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGEgZG9jdHlwZSBkZWNsYXJhdGlvbiBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBUaGlzIGlzIGEgbG9vc2UgaW1wbGVtZW50YXRpb24gc2luY2UgZG9jdHlwZSBkZWNsYXJhdGlvbnMgYXJlIGN1cnJlbnRseQogICAgICogZGlzY2FyZGVkIHdpdGhvdXQgZnVydGhlciBwYXJzaW5nLgogICAgICoKICAgICAqIEByZXR1cm5zIFdoZXRoZXIgYSBkb2N0eXBlIGRlY2xhcmF0aW9uIHdhcyBjb25zdW1lZC4KICAgICAqIEBzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSLzIwMDgvUkVDLXhtbC0yMDA4MTEyNi8jZHRkCiAgICAgKi8KICAgIE4oKSB7CiAgICAgIGxldCB7IGM6IHNjYW5uZXIgfSA9IHRoaXM7CiAgICAgIGxldCBzdGFydEluZGV4ID0gc2Nhbm5lci5kOwogICAgICBpZiAoIXNjYW5uZXIuYigiPCFET0NUWVBFIikpIHsKICAgICAgICByZXR1cm4gZmFsc2U7CiAgICAgIH0KICAgICAgbGV0IG5hbWUgPSB0aGlzLmUoKSAmJiB0aGlzLnIoKTsKICAgICAgaWYgKCFuYW1lKSB7CiAgICAgICAgdGhyb3cgdGhpcy5hKCJFeHBlY3RlZCBhIG5hbWUiKTsKICAgICAgfQogICAgICBsZXQgcHVibGljSWQ7CiAgICAgIGxldCBzeXN0ZW1JZDsKICAgICAgaWYgKHRoaXMuZSgpKSB7CiAgICAgICAgaWYgKHNjYW5uZXIuYigiUFVCTElDIikpIHsKICAgICAgICAgIHB1YmxpY0lkID0gdGhpcy5lKCkgJiYgdGhpcy5PKCk7CiAgICAgICAgICBpZiAocHVibGljSWQgPT09IGZhbHNlKSB7CiAgICAgICAgICAgIHRocm93IHRoaXMuYSgiRXhwZWN0ZWQgYSBwdWJsaWMgaWRlbnRpZmllciIpOwogICAgICAgICAgfQogICAgICAgICAgdGhpcy5lKCk7CiAgICAgICAgfQogICAgICAgIGlmIChwdWJsaWNJZCAhPT0gdm9pZCAwIHx8IHNjYW5uZXIuYigiU1lTVEVNIikpIHsKICAgICAgICAgIHRoaXMuZSgpOwogICAgICAgICAgc3lzdGVtSWQgPSB0aGlzLnMoKTsKICAgICAgICAgIGlmIChzeXN0ZW1JZCA9PT0gZmFsc2UpIHsKICAgICAgICAgICAgdGhyb3cgdGhpcy5hKCJFeHBlY3RlZCBhIHN5c3RlbSBpZGVudGlmaWVyIik7CiAgICAgICAgICB9CiAgICAgICAgICB0aGlzLmUoKTsKICAgICAgICB9CiAgICAgIH0KICAgICAgbGV0IGludGVybmFsU3Vic2V0OwogICAgICBpZiAoc2Nhbm5lci5iKCJbIikpIHsKICAgICAgICBpbnRlcm5hbFN1YnNldCA9IHNjYW5uZXIuQSgvXF1bXHgyMFx0XHJcbl0qPi8pOwogICAgICAgIGlmICghc2Nhbm5lci5iKCJdIikpIHsKICAgICAgICAgIHRocm93IHRoaXMuYSgiVW5jbG9zZWQgaW50ZXJuYWwgc3Vic2V0Iik7CiAgICAgICAgfQogICAgICAgIHRoaXMuZSgpOwogICAgICB9CiAgICAgIGlmICghc2Nhbm5lci5iKCI+IikpIHsKICAgICAgICB0aHJvdyB0aGlzLmEoIlVuY2xvc2VkIGRvY3R5cGUgZGVjbGFyYXRpb24iKTsKICAgICAgfQogICAgICByZXR1cm4gdGhpcy5mLnByZXNlcnZlRG9jdW1lbnRUeXBlID8gdGhpcy5qKG5ldyBYbWxEb2N1bWVudFR5cGUobmFtZSwgcHVibGljSWQsIHN5c3RlbUlkLCBpbnRlcm5hbFN1YnNldCksIHN0YXJ0SW5kZXgpIDogdHJ1ZTsKICAgIH0KICAgIC8qKgogICAgICogQ29uc3VtZXMgYW4gZWxlbWVudCBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBAcmV0dXJucyBXaGV0aGVyIGFuIGVsZW1lbnQgd2FzIGNvbnN1bWVkLgogICAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMteG1sLTIwMDgxMTI2LyNOVC1lbGVtZW50CiAgICAgKi8KICAgIEIoKSB7CiAgICAgIGxldCB7IGM6IHNjYW5uZXIgfSA9IHRoaXM7CiAgICAgIGxldCBzdGFydEluZGV4ID0gc2Nhbm5lci5kOwogICAgICBpZiAoIXNjYW5uZXIuYigiPCIpKSB7CiAgICAgICAgcmV0dXJuIGZhbHNlOwogICAgICB9CiAgICAgIGxldCBuYW1lID0gdGhpcy5yKCk7CiAgICAgIGlmICghbmFtZSkgewogICAgICAgIHNjYW5uZXIubyhzdGFydEluZGV4KTsKICAgICAgICByZXR1cm4gZmFsc2U7CiAgICAgIH0KICAgICAgbGV0IGF0dHJpYnV0ZXMgPSB0aGlzLkkoKTsKICAgICAgbGV0IGlzRW1wdHkgPSAhIXNjYW5uZXIuYigiLz4iKTsKICAgICAgbGV0IGVsZW1lbnQgPSBuZXcgWG1sRWxlbWVudChuYW1lLCBhdHRyaWJ1dGVzKTsKICAgICAgZWxlbWVudC5wYXJlbnQgPSB0aGlzLmw7CiAgICAgIGlmICghaXNFbXB0eSkgewogICAgICAgIGlmICghc2Nhbm5lci5iKCI+IikpIHsKICAgICAgICAgIHRocm93IHRoaXMuYShgVW5jbG9zZWQgc3RhcnQgdGFnIGZvciBlbGVtZW50IFxgJHtuYW1lfVxgYCk7CiAgICAgICAgfQogICAgICAgIHRoaXMubCA9IGVsZW1lbnQ7CiAgICAgICAgZG8gewogICAgICAgICAgdGhpcy5MKCk7CiAgICAgICAgfSB3aGlsZSAodGhpcy5CKCkgfHwgdGhpcy5NKCkgfHwgdGhpcy5LKCkgfHwgdGhpcy5FKCkgfHwgdGhpcy5EKCkpOwogICAgICAgIGxldCBlbmRUYWdNYXJrID0gc2Nhbm5lci5kOwogICAgICAgIGxldCBlbmRUYWdOYW1lOwogICAgICAgIGlmICghc2Nhbm5lci5iKCI8LyIpIHx8ICEoZW5kVGFnTmFtZSA9IHRoaXMucigpKSB8fCBlbmRUYWdOYW1lICE9PSBuYW1lKSB7CiAgICAgICAgICBzY2FubmVyLm8oZW5kVGFnTWFyayk7CiAgICAgICAgICB0aHJvdyB0aGlzLmEoYE1pc3NpbmcgZW5kIHRhZyBmb3IgZWxlbWVudCAke25hbWV9YCk7CiAgICAgICAgfQogICAgICAgIHRoaXMuZSgpOwogICAgICAgIGlmICghc2Nhbm5lci5iKCI+IikpIHsKICAgICAgICAgIHRocm93IHRoaXMuYShgVW5jbG9zZWQgZW5kIHRhZyBmb3IgZWxlbWVudCAke25hbWV9YCk7CiAgICAgICAgfQogICAgICAgIHRoaXMubCA9IGVsZW1lbnQucGFyZW50OwogICAgICB9CiAgICAgIHJldHVybiB0aGlzLmooZWxlbWVudCwgc3RhcnRJbmRleCk7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGFuIGBFcWAgcHJvZHVjdGlvbiBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBAcmV0dXJucyBXaGV0aGVyIGFuIGBFcWAgcHJvZHVjdGlvbiB3YXMgY29uc3VtZWQuCiAgICAgKiBAc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy14bWwtMjAwODExMjYvI05ULUVxCiAgICAgKi8KICAgIHUoKSB7CiAgICAgIHRoaXMuZSgpOwogICAgICBpZiAodGhpcy5jLmIoIj0iKSkgewogICAgICAgIHRoaXMuZSgpOwogICAgICAgIHJldHVybiB0cnVlOwogICAgICB9CiAgICAgIHJldHVybiBmYWxzZTsKICAgIH0KICAgIC8qKgogICAgICogQ29uc3VtZXMgYE1pc2NgIGNvbnRlbnQgaWYgcG9zc2libGUuCiAgICAgKgogICAgICogQHJldHVybnMgV2hldGhlciBhbnl0aGluZyB3YXMgY29uc3VtZWQuCiAgICAgKiBAc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy14bWwtMjAwODExMjYvI05ULU1pc2MKICAgICAqLwogICAgdygpIHsKICAgICAgcmV0dXJuIHRoaXMuRCgpIHx8IHRoaXMuRSgpIHx8IHRoaXMuZSgpOwogICAgfQogICAgLyoqCiAgICAgKiBDb25zdW1lcyBvbmUgb3IgbW9yZSBgTmFtZWAgY2hhcmFjdGVycyBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBAcmV0dXJucyBgTmFtZWAgY2hhcmFjdGVycywgb3IgYW4gZW1wdHkgc3RyaW5nIGlmIG5vbmUgd2VyZSBjb25zdW1lZC4KICAgICAqIEBzZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSLzIwMDgvUkVDLXhtbC0yMDA4MTEyNi8jTlQtTmFtZQogICAgICovCiAgICByKCkgewogICAgICByZXR1cm4gaXNOYW1lU3RhcnRDaGFyKHRoaXMuYy5oKCkpID8gdGhpcy5jLnYoaXNOYW1lQ2hhcikgOiBlbXB0eVN0cmluZzI7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGEgcHJvY2Vzc2luZyBpbnN0cnVjdGlvbiBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBAcmV0dXJucyBXaGV0aGVyIGEgcHJvY2Vzc2luZyBpbnN0cnVjdGlvbiB3YXMgY29uc3VtZWQuCiAgICAgKiBAc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy14bWwtMjAwODExMjYvI3NlYy1waQogICAgICovCiAgICBFKCkgewogICAgICBsZXQgeyBjOiBzY2FubmVyIH0gPSB0aGlzOwogICAgICBsZXQgc3RhcnRJbmRleCA9IHNjYW5uZXIuZDsKICAgICAgaWYgKCFzY2FubmVyLmIoIjw/IikpIHsKICAgICAgICByZXR1cm4gZmFsc2U7CiAgICAgIH0KICAgICAgbGV0IG5hbWUgPSB0aGlzLnIoKTsKICAgICAgaWYgKG5hbWUpIHsKICAgICAgICBpZiAobmFtZS50b0xvd2VyQ2FzZSgpID09PSAieG1sIikgewogICAgICAgICAgc2Nhbm5lci5vKHN0YXJ0SW5kZXgpOwogICAgICAgICAgdGhyb3cgdGhpcy5hKCJYTUwgZGVjbGFyYXRpb24gaXNuJ3QgYWxsb3dlZCBoZXJlIik7CiAgICAgICAgfQogICAgICB9IGVsc2UgewogICAgICAgIHRocm93IHRoaXMuYSgiSW52YWxpZCBwcm9jZXNzaW5nIGluc3RydWN0aW9uIik7CiAgICAgIH0KICAgICAgaWYgKCF0aGlzLmUoKSkgewogICAgICAgIGlmIChzY2FubmVyLmIoIj8+IikpIHsKICAgICAgICAgIHJldHVybiB0aGlzLmoobmV3IFhtbFByb2Nlc3NpbmdJbnN0cnVjdGlvbihuYW1lKSwgc3RhcnRJbmRleCk7CiAgICAgICAgfQogICAgICAgIHRocm93IHRoaXMuYSgiV2hpdGVzcGFjZSBpcyByZXF1aXJlZCBhZnRlciBhIHByb2Nlc3NpbmcgaW5zdHJ1Y3Rpb24gbmFtZSIpOwogICAgICB9CiAgICAgIGxldCBjb250ZW50ID0gc2Nhbm5lci50KCI/PiIpOwogICAgICB0aGlzLnAoY29udGVudCk7CiAgICAgIGlmICghc2Nhbm5lci5iKCI/PiIpKSB7CiAgICAgICAgdGhyb3cgdGhpcy5hKCJVbnRlcm1pbmF0ZWQgcHJvY2Vzc2luZyBpbnN0cnVjdGlvbiIpOwogICAgICB9CiAgICAgIHJldHVybiB0aGlzLmoobmV3IFhtbFByb2Nlc3NpbmdJbnN0cnVjdGlvbihuYW1lLCBub3JtYWxpemVMaW5lQnJlYWtzKGNvbnRlbnQpKSwgc3RhcnRJbmRleCk7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGEgcHJvbG9nIGlmIHBvc3NpYmxlLgogICAgICoKICAgICAqIEByZXR1cm5zIFdoZXRoZXIgYSBwcm9sb2cgd2FzIGNvbnN1bWVkLgogICAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMteG1sLTIwMDgxMTI2LyNzZWMtcHJvbG9nLWR0ZAogICAgICovCiAgICBIKCkgewogICAgICBsZXQgeyBjOiBzY2FubmVyIH0gPSB0aGlzOwogICAgICBsZXQgc3RhcnRJbmRleCA9IHNjYW5uZXIuZDsKICAgICAgdGhpcy5QKCk7CiAgICAgIHdoaWxlICh0aGlzLncoKSkgewogICAgICB9CiAgICAgIGlmICh0aGlzLk4oKSkgewogICAgICAgIHdoaWxlICh0aGlzLncoKSkgewogICAgICAgIH0KICAgICAgfQogICAgICByZXR1cm4gc3RhcnRJbmRleCA8IHNjYW5uZXIuZDsKICAgIH0KICAgIC8qKgogICAgICogQ29uc3VtZXMgYSBwdWJsaWMgaWRlbnRpZmllciBsaXRlcmFsIGlmIHBvc3NpYmxlLgogICAgICoKICAgICAqIEByZXR1cm5zCiAgICAgKiAgIFZhbHVlIG9mIHRoZSBwdWJsaWMgaWRlbnRpZmllciBsaXRlcmFsIG1pbnVzIHF1b3Rlcywgb3IgYGZhbHNlYCBpZgogICAgICogICBub3RoaW5nIHdhcyBjb25zdW1lZC4gQW4gZW1wdHkgc3RyaW5nIGluZGljYXRlcyB0aGF0IGEgcHVibGljIGlkIGxpdGVyYWwKICAgICAqICAgd2FzIGNvbnN1bWVkIGJ1dCB3YXMgZW1wdHkuCiAgICAgKgogICAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMteG1sLTIwMDgxMTI2LyNOVC1QdWJpZExpdGVyYWwKICAgICAqLwogICAgTygpIHsKICAgICAgbGV0IHN0YXJ0SW5kZXggPSB0aGlzLmMuZDsKICAgICAgbGV0IHZhbHVlID0gdGhpcy5zKCk7CiAgICAgIGlmICh2YWx1ZSAhPT0gZmFsc2UgJiYgIS9eWy1ceDIwXHJcbmEtekEtWjAtOScoKSssLi86PT87ISojQCRfJV0qJC8udGVzdCh2YWx1ZSkpIHsKICAgICAgICB0aGlzLmMubyhzdGFydEluZGV4KTsKICAgICAgICB0aHJvdyB0aGlzLmEoIkludmFsaWQgY2hhcmFjdGVyIGluIHB1YmxpYyBpZGVudGlmaWVyIik7CiAgICAgIH0KICAgICAgcmV0dXJuIHZhbHVlOwogICAgfQogICAgLyoqCiAgICAgKiBDb25zdW1lcyBhIHJlZmVyZW5jZSBpZiBwb3NzaWJsZS4KICAgICAqCiAgICAgKiBUaGlzIGRpZmZlcnMgZnJvbSBgY29uc3VtZUNvbnRlbnRSZWZlcmVuY2UoKWAgaW4gdGhhdCBhIGNvbnN1bWVkIHJlZmVyZW5jZQogICAgICogd2lsbCBiZSByZXR1cm5lZCByYXRoZXIgdGhhbiBhZGRlZCB0byB0aGUgZG9jdW1lbnQuCiAgICAgKgogICAgICogQHJldHVybnMKICAgICAqICAgUGFyc2VkIHJlZmVyZW5jZSB2YWx1ZSwgb3IgYGZhbHNlYCBpZiBub3RoaW5nIHdhcyBjb25zdW1lZCAodG8KICAgICAqICAgZGlzdGluZ3Vpc2ggZnJvbSBhIHJlZmVyZW5jZSB0aGF0IHJlc29sdmVzIHRvIGFuIGVtcHR5IHN0cmluZykuCiAgICAgKgogICAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMteG1sLTIwMDgxMTI2LyNOVC1SZWZlcmVuY2UKICAgICAqLwogICAgQygpIHsKICAgICAgbGV0IHsgYzogc2Nhbm5lciB9ID0gdGhpczsKICAgICAgaWYgKCFzY2FubmVyLmIoIiYiKSkgewogICAgICAgIHJldHVybiBmYWxzZTsKICAgICAgfQogICAgICBsZXQgcmVmID0gc2Nhbm5lci52KGlzUmVmZXJlbmNlQ2hhcik7CiAgICAgIGlmIChzY2FubmVyLkYoKSAhPT0gIjsiKSB7CiAgICAgICAgdGhyb3cgdGhpcy5hKCJVbnRlcm1pbmF0ZWQgcmVmZXJlbmNlIChhIHJlZmVyZW5jZSBtdXN0IGVuZCB3aXRoIGA7YCkiKTsKICAgICAgfQogICAgICBsZXQgcGFyc2VkVmFsdWU7CiAgICAgIGlmIChyZWZbMF0gPT09ICIjIikgewogICAgICAgIGxldCBjb2RlUG9pbnQgPSByZWZbMV0gPT09ICJ4IiA/IHBhcnNlSW50KHJlZi5zbGljZSgyKSwgMTYpIDogcGFyc2VJbnQocmVmLnNsaWNlKDEpLCAxMCk7CiAgICAgICAgaWYgKGlzTmFOKGNvZGVQb2ludCkpIHsKICAgICAgICAgIHRocm93IHRoaXMuYSgiSW52YWxpZCBjaGFyYWN0ZXIgcmVmZXJlbmNlIik7CiAgICAgICAgfQogICAgICAgIGlmICghaXNYbWxDb2RlUG9pbnQoY29kZVBvaW50KSkgewogICAgICAgICAgdGhyb3cgdGhpcy5hKCJDaGFyYWN0ZXIgcmVmZXJlbmNlIHJlc29sdmVzIHRvIGFuIGludmFsaWQgY2hhcmFjdGVyIik7CiAgICAgICAgfQogICAgICAgIHBhcnNlZFZhbHVlID0gU3RyaW5nLmZyb21Db2RlUG9pbnQoY29kZVBvaW50KTsKICAgICAgfSBlbHNlIHsKICAgICAgICBwYXJzZWRWYWx1ZSA9IHByZWRlZmluZWRFbnRpdGllc1tyZWZdOwogICAgICAgIGlmIChwYXJzZWRWYWx1ZSA9PT0gdm9pZCAwKSB7CiAgICAgICAgICBsZXQgewogICAgICAgICAgICBpZ25vcmVVbmRlZmluZWRFbnRpdGllcywKICAgICAgICAgICAgcmVzb2x2ZVVuZGVmaW5lZEVudGl0eQogICAgICAgICAgfSA9IHRoaXMuZjsKICAgICAgICAgIGxldCB3cmFwcGVkUmVmID0gYCYke3JlZn07YDsKICAgICAgICAgIGlmIChyZXNvbHZlVW5kZWZpbmVkRW50aXR5KSB7CiAgICAgICAgICAgIGxldCByZXNvbHZlZFZhbHVlID0gcmVzb2x2ZVVuZGVmaW5lZEVudGl0eSh3cmFwcGVkUmVmKTsKICAgICAgICAgICAgaWYgKHJlc29sdmVkVmFsdWUgIT09IG51bGwgJiYgcmVzb2x2ZWRWYWx1ZSAhPT0gdm9pZCAwKSB7CiAgICAgICAgICAgICAgbGV0IHR5cGUgPSB0eXBlb2YgcmVzb2x2ZWRWYWx1ZTsKICAgICAgICAgICAgICBpZiAodHlwZSAhPT0gInN0cmluZyIpIHsKICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFxgcmVzb2x2ZVVuZGVmaW5lZEVudGl0eSgpXGAgbXVzdCByZXR1cm4gYSBzdHJpbmcsIFxgbnVsbFxgLCBvciBcYHVuZGVmaW5lZFxgLCBidXQgcmV0dXJuZWQgYSB2YWx1ZSBvZiB0eXBlICR7dHlwZX1gKTsKICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVkVmFsdWU7CiAgICAgICAgICAgIH0KICAgICAgICAgIH0KICAgICAgICAgIGlmIChpZ25vcmVVbmRlZmluZWRFbnRpdGllcykgewogICAgICAgICAgICByZXR1cm4gd3JhcHBlZFJlZjsKICAgICAgICAgIH0KICAgICAgICAgIHNjYW5uZXIubygtd3JhcHBlZFJlZi5sZW5ndGgpOwogICAgICAgICAgdGhyb3cgdGhpcy5hKGBOYW1lZCBlbnRpdHkgaXNuJ3QgZGVmaW5lZDogJHt3cmFwcGVkUmVmfWApOwogICAgICAgIH0KICAgICAgfQogICAgICByZXR1cm4gcGFyc2VkVmFsdWU7CiAgICB9CiAgICAvKioKICAgICAqIENvbnN1bWVzIGEgYFN5c3RlbUxpdGVyYWxgIGlmIHBvc3NpYmxlLgogICAgICoKICAgICAqIEEgYFN5c3RlbUxpdGVyYWxgIGlzIHNpbWlsYXIgdG8gYW4gYXR0cmlidXRlIHZhbHVlLCBidXQgYWxsb3dzIHRoZQogICAgICogY2hhcmFjdGVycyBgPGAgYW5kIGAmYCBhbmQgZG9lc24ndCByZXBsYWNlIHJlZmVyZW5jZXMuCiAgICAgKgogICAgICogQHJldHVybnMKICAgICAqICAgVmFsdWUgb2YgdGhlIGBTeXN0ZW1MaXRlcmFsYCBtaW51cyBxdW90ZXMsIG9yIGBmYWxzZWAgaWYgbm90aGluZyB3YXMKICAgICAqICAgY29uc3VtZWQuIEFuIGVtcHR5IHN0cmluZyBpbmRpY2F0ZXMgdGhhdCBhIGBTeXN0ZW1MaXRlcmFsYCB3YXMgY29uc3VtZWQKICAgICAqICAgYnV0IHdhcyBlbXB0eS4KICAgICAqCiAgICAgKiBAc2VlIGh0dHBzOi8vd3d3LnczLm9yZy9UUi8yMDA4L1JFQy14bWwtMjAwODExMjYvI05ULVN5c3RlbUxpdGVyYWwKICAgICAqLwogICAgcygpIHsKICAgICAgbGV0IHsgYzogc2Nhbm5lciB9ID0gdGhpczsKICAgICAgbGV0IHF1b3RlID0gc2Nhbm5lci5iKCciJykgfHwgc2Nhbm5lci5iKCInIik7CiAgICAgIGlmICghcXVvdGUpIHsKICAgICAgICByZXR1cm4gZmFsc2U7CiAgICAgIH0KICAgICAgbGV0IHZhbHVlID0gc2Nhbm5lci50KHF1b3RlKTsKICAgICAgdGhpcy5wKHZhbHVlKTsKICAgICAgaWYgKCFzY2FubmVyLmIocXVvdGUpKSB7CiAgICAgICAgdGhyb3cgdGhpcy5hKCJNaXNzaW5nIGVuZCBxdW90ZSIpOwogICAgICB9CiAgICAgIHJldHVybiB2YWx1ZTsKICAgIH0KICAgIC8qKgogICAgICogQ29uc3VtZXMgb25lIG9yIG1vcmUgd2hpdGVzcGFjZSBjaGFyYWN0ZXJzIGlmIHBvc3NpYmxlLgogICAgICoKICAgICAqIEByZXR1cm5zIFdoZXRoZXIgYW55IHdoaXRlc3BhY2UgY2hhcmFjdGVycyB3ZXJlIGNvbnN1bWVkLgogICAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMteG1sLTIwMDgxMTI2LyN3aGl0ZQogICAgICovCiAgICBlKCkgewogICAgICByZXR1cm4gISF0aGlzLmMudihpc1doaXRlc3BhY2UpOwogICAgfQogICAgLyoqCiAgICAgKiBDb25zdW1lcyBhbiBYTUwgZGVjbGFyYXRpb24gaWYgcG9zc2libGUuCiAgICAgKgogICAgICogQHJldHVybnMgV2hldGhlciBhbiBYTUwgZGVjbGFyYXRpb24gd2FzIGNvbnN1bWVkLgogICAgICogQHNlZSBodHRwczovL3d3dy53My5vcmcvVFIvMjAwOC9SRUMteG1sLTIwMDgxMTI2LyNOVC1YTUxEZWNsCiAgICAgKi8KICAgIFAoKSB7CiAgICAgIGxldCB7IGM6IHNjYW5uZXIgfSA9IHRoaXM7CiAgICAgIGxldCBzdGFydEluZGV4ID0gc2Nhbm5lci5kOwogICAgICBpZiAoIXNjYW5uZXIuYigiPD94bWwiKSkgewogICAgICAgIHJldHVybiBmYWxzZTsKICAgICAgfQogICAgICBpZiAoIXRoaXMuZSgpKSB7CiAgICAgICAgdGhyb3cgdGhpcy5hKCJJbnZhbGlkIFhNTCBkZWNsYXJhdGlvbiIpOwogICAgICB9CiAgICAgIGxldCB2ZXJzaW9uID0gISFzY2FubmVyLmIoInZlcnNpb24iKSAmJiB0aGlzLnUoKSAmJiB0aGlzLnMoKTsKICAgICAgaWYgKHZlcnNpb24gPT09IGZhbHNlKSB7CiAgICAgICAgdGhyb3cgdGhpcy5hKCJYTUwgdmVyc2lvbiBpcyBtaXNzaW5nIG9yIGludmFsaWQiKTsKICAgICAgfSBlbHNlIGlmICghL14xXC5bMC05XSskLy50ZXN0KHZlcnNpb24pKSB7CiAgICAgICAgdGhyb3cgdGhpcy5hKCJJbnZhbGlkIGNoYXJhY3RlciBpbiB2ZXJzaW9uIG51bWJlciIpOwogICAgICB9CiAgICAgIGxldCBlbmNvZGluZzsKICAgICAgbGV0IHN0YW5kYWxvbmU7CiAgICAgIGlmICh0aGlzLmUoKSkgewogICAgICAgIGVuY29kaW5nID0gISFzY2FubmVyLmIoImVuY29kaW5nIikgJiYgdGhpcy51KCkgJiYgdGhpcy5zKCk7CiAgICAgICAgaWYgKGVuY29kaW5nKSB7CiAgICAgICAgICB0aGlzLmUoKTsKICAgICAgICB9CiAgICAgICAgc3RhbmRhbG9uZSA9ICEhc2Nhbm5lci5iKCJzdGFuZGFsb25lIikgJiYgdGhpcy51KCkgJiYgdGhpcy5zKCk7CiAgICAgICAgaWYgKHN0YW5kYWxvbmUpIHsKICAgICAgICAgIGlmIChzdGFuZGFsb25lICE9PSAieWVzIiAmJiBzdGFuZGFsb25lICE9PSAibm8iKSB7CiAgICAgICAgICAgIHRocm93IHRoaXMuYSgnT25seSAieWVzIiBhbmQgIm5vIiBhcmUgcGVybWl0dGVkIGFzIHZhbHVlcyBvZiBgc3RhbmRhbG9uZWAnKTsKICAgICAgICAgIH0KICAgICAgICAgIHRoaXMuZSgpOwogICAgICAgIH0KICAgICAgfQogICAgICBpZiAoIXNjYW5uZXIuYigiPz4iKSkgewogICAgICAgIHRocm93IHRoaXMuYSgiSW52YWxpZCBvciB1bmNsb3NlZCBYTUwgZGVjbGFyYXRpb24iKTsKICAgICAgfQogICAgICByZXR1cm4gdGhpcy5mLnByZXNlcnZlWG1sRGVjbGFyYXRpb24gPyB0aGlzLmoobmV3IFhtbERlY2xhcmF0aW9uKAogICAgICAgIHZlcnNpb24sCiAgICAgICAgZW5jb2RpbmcgfHwgdm9pZCAwLAogICAgICAgIHN0YW5kYWxvbmUgfHwgdm9pZCAwCiAgICAgICksIHN0YXJ0SW5kZXgpIDogdHJ1ZTsKICAgIH0KICAgIC8qKgogICAgICogUmV0dXJucyBhbiBgWG1sRXJyb3JgIGZvciB0aGUgY3VycmVudCBzY2FubmVyIHBvc2l0aW9uLgogICAgICovCiAgICBhKG1lc3NhZ2UpIHsKICAgICAgbGV0IHsgYzogc2Nhbm5lciB9ID0gdGhpczsKICAgICAgcmV0dXJuIG5ldyBYbWxFcnJvcihtZXNzYWdlLCBzY2FubmVyLmQsIHNjYW5uZXIubSk7CiAgICB9CiAgICAvKioKICAgICAqIFRocm93cyBhbiBpbnZhbGlkIGNoYXJhY3RlciBlcnJvciBpZiBhbnkgY2hhcmFjdGVyIGluIHRoZSBnaXZlbiBfc3RyaW5nXwogICAgICogaXNuJ3QgYSB2YWxpZCBYTUwgY2hhcmFjdGVyLgogICAgICovCiAgICBwKHN0cmluZykgewogICAgICBsZXQgeyBsZW5ndGggfSA9IHN0cmluZzsKICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkgewogICAgICAgIGxldCBjcCA9IHN0cmluZy5jb2RlUG9pbnRBdChpKTsKICAgICAgICBpZiAoIWlzWG1sQ29kZVBvaW50KGNwKSkgewogICAgICAgICAgdGhpcy5jLm8oLShbLi4uc3RyaW5nXS5sZW5ndGggLSBpKSk7CiAgICAgICAgICB0aHJvdyB0aGlzLmEoIkludmFsaWQgY2hhcmFjdGVyIik7CiAgICAgICAgfQogICAgICAgIGlmIChjcCA+IDY1NTM1KSB7CiAgICAgICAgICBpICs9IDE7CiAgICAgICAgfQogICAgICB9CiAgICB9CiAgfTsKICBmdW5jdGlvbiBub3JtYWxpemVMaW5lQnJlYWtzKHRleHQpIHsKICAgIGxldCBpID0gMDsKICAgIHdoaWxlICgoaSA9IHRleHQuaW5kZXhPZigiXHIiLCBpKSkgIT09IC0xKSB7CiAgICAgIHRleHQgPSB0ZXh0W2kgKyAxXSA9PT0gIlxuIiA/IHRleHQuc2xpY2UoMCwgaSkgKyB0ZXh0LnNsaWNlKGkgKyAxKSA6IHRleHQuc2xpY2UoMCwgaSkgKyAiXG4iICsgdGV4dC5zbGljZShpICsgMSk7CiAgICB9CiAgICByZXR1cm4gdGV4dDsKICB9CiAgZnVuY3Rpb24gcGFyc2VYbWwoeG1sLCBvcHRpb25zKSB7CiAgICByZXR1cm4gbmV3IFBhcnNlcih4bWwsIG9wdGlvbnMpLmRvY3VtZW50OwogIH0KICBjbGFzcyBYbWxQYXJzZUVycm9yIGV4dGVuZHMgRXJyb3IgewogICAgY29uc3RydWN0b3IobWVzc2FnZSkgewogICAgICBzdXBlcihtZXNzYWdlKTsKICAgIH0KICB9CiAgZnVuY3Rpb24gcGFyc2VYbWxTdHJpbmcoeG1sU3RyaW5nKSB7CiAgICBsZXQgZG9jID0gbnVsbDsKICAgIHRyeSB7CiAgICAgIGRvYyA9IGJyb3dzZXIucGFyc2VYbWwoeG1sU3RyaW5nKTsKICAgIH0gY2F0Y2ggKGUpIHsKICAgICAgdGhyb3cgbmV3IFhtbFBhcnNlRXJyb3IoZS5tZXNzYWdlKTsKICAgIH0KICAgIHJldHVybiBkb2M7CiAgfQogIGZ1bmN0aW9uIHN0cmlwTmFtZXNwYWNlKG5hbWUpIHsKICAgIGNvbnN0IGNvbG9uID0gbmFtZS5pbmRleE9mKCI6Iik7CiAgICByZXR1cm4gY29sb24gPiAtMSA/IG5hbWUuc3Vic3RyKGNvbG9uICsgMSkgOiBuYW1lOwogIH0KICBmdW5jdGlvbiBnZXRSb290RWxlbWVudCh4bWxEb2MpIHsKICAgIHJldHVybiB4bWxEb2MuY2hpbGRyZW5bMF07CiAgfQogIGZ1bmN0aW9uIGdldEVsZW1lbnROYW1lKGVsZW1lbnQpIHsKICAgIHJldHVybiBlbGVtZW50Lm5hbWUgfHwgIiI7CiAgfQogIGZ1bmN0aW9uIGZpbmRDaGlsZHJlbkVsZW1lbnQoZWxlbWVudCwgbmFtZSwgbmVzdGVkID0gZmFsc2UpIHsKICAgIGNvbnN0IHN0cmlwcGVkTmFtZSA9IHN0cmlwTmFtZXNwYWNlKG5hbWUpOwogICAgZnVuY3Rpb24gcmVkdWNlcihwcmV2LCBjdXJyKSB7CiAgICAgIGlmIChzdHJpcE5hbWVzcGFjZShnZXRFbGVtZW50TmFtZShjdXJyKSkgPT09IHN0cmlwcGVkTmFtZSkgewogICAgICAgIHByZXYucHVzaChjdXJyKTsKICAgICAgfQogICAgICBpZiAobmVzdGVkICYmIEFycmF5LmlzQXJyYXkoY3Vyci5jaGlsZHJlbikpIHsKICAgICAgICByZXR1cm4gWy4uLnByZXYsIC4uLmN1cnIuY2hpbGRyZW4ucmVkdWNlKHJlZHVjZXIsIFtdKV07CiAgICAgIH0gZWxzZSB7CiAgICAgICAgcmV0dXJuIHByZXY7CiAgICAgIH0KICAgIH0KICAgIHJldHVybiBlbGVtZW50ICYmIEFycmF5LmlzQXJyYXkoZWxlbWVudC5jaGlsZHJlbikgPyBlbGVtZW50LmNoaWxkcmVuLnJlZHVjZShyZWR1Y2VyLCBbXSkgOiBbXTsKICB9CiAgZnVuY3Rpb24gZmluZENoaWxkRWxlbWVudChlbGVtZW50LCBuYW1lLCBuZXN0ZWQgPSBmYWxzZSkgewogICAgcmV0dXJuIGZpbmRDaGlsZHJlbkVsZW1lbnQoZWxlbWVudCwgbmFtZSwgbmVzdGVkKVswXSB8fCBudWxsOwogIH0KICBmdW5jdGlvbiBnZXRDaGlsZHJlbkVsZW1lbnQoZWxlbWVudCkgewogICAgcmV0dXJuIGVsZW1lbnQgJiYgQXJyYXkuaXNBcnJheShlbGVtZW50LmNoaWxkcmVuKSA/IFsKICAgICAgLi4uZWxlbWVudC5jaGlsZHJlbi5maWx0ZXIoCiAgICAgICAgKGVsKSA9PiBlbCBpbnN0YW5jZW9mIGJyb3dzZXIuWG1sRWxlbWVudAogICAgICApCiAgICBdIDogW107CiAgfQogIGZ1bmN0aW9uIGdldEVsZW1lbnRUZXh0KGVsZW1lbnQpIHsKICAgIGNvbnN0IHRleHROb2RlID0gZWxlbWVudCAmJiBBcnJheS5pc0FycmF5KGVsZW1lbnQuY2hpbGRyZW4pID8gZWxlbWVudC5jaGlsZHJlbi5maW5kKChub2RlKSA9PiBub2RlLnR5cGUgPT09ICJ0ZXh0IikgOiBudWxsOwogICAgcmV0dXJuIHRleHROb2RlID8gdGV4dE5vZGUudGV4dCA6ICIiOwogIH0KICBmdW5jdGlvbiBnZXRFbGVtZW50QXR0cmlidXRlKGVsZW1lbnQsIGF0dHJOYW1lKSB7CiAgICByZXR1cm4gZWxlbWVudCAmJiBlbGVtZW50LmF0dHJpYnV0ZXNbYXR0ck5hbWVdIHx8ICIiOwogIH0KICBjbGFzcyBFbmRwb2ludEVycm9yIGV4dGVuZHMgRXJyb3IgewogICAgY29uc3RydWN0b3IobWVzc2FnZSwgaHR0cFN0YXR1cywgaXNDcm9zc09yaWdpblJlbGF0ZWQpIHsKICAgICAgc3VwZXIobWVzc2FnZSk7CiAgICAgIHRoaXMuaHR0cFN0YXR1cyA9IGh0dHBTdGF0dXM7CiAgICAgIHRoaXMuaXNDcm9zc09yaWdpblJlbGF0ZWQgPSBpc0Nyb3NzT3JpZ2luUmVsYXRlZDsKICAgICAgdGhpcy5uYW1lID0gIkVuZHBvaW50RXJyb3IiOwogICAgfQogIH0KICBjbGFzcyBTZXJ2aWNlRXhjZXB0aW9uRXJyb3IgZXh0ZW5kcyBFcnJvciB7CiAgICAvKioKICAgICAqIENvbnN0cnVjdG9yCiAgICAgKiBAcGFyYW0gbWVzc2FnZSBFcnJvciBtZXNzYWdlCiAgICAgKiBAcGFyYW0gcmVxdWVzdFVybCBVUkwgd2hpY2ggcmVzdWx0ZWQgaW4gdGhlIFNlcnZpY2VFeGNlcHRpb24KICAgICAqIEBwYXJhbSBjb2RlIE9wdGlvbmFsIFNlcnZpY2VFeGNlcHRpb24gY29kZQogICAgICogQHBhcmFtIGxvY2F0b3IgT3B0aW9uYWwgU2VydmljZUV4Y2VwdGlvbiBsb2NhdG9yCiAgICAgKiBAcGFyYW0gcmVzcG9uc2UgT3B0aW9uYWwgcmVzcG9uc2UgY29udGVudCByZWNlaXZlZAogICAgICovCiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlLCByZXF1ZXN0VXJsLCBjb2RlLCBsb2NhdG9yLCByZXNwb25zZSkgewogICAgICBzdXBlcihtZXNzYWdlKTsKICAgICAgdGhpcy5yZXF1ZXN0VXJsID0gcmVxdWVzdFVybDsKICAgICAgdGhpcy5jb2RlID0gY29kZTsKICAgICAgdGhpcy5sb2NhdG9yID0gbG9jYXRvcjsKICAgICAgdGhpcy5yZXNwb25zZSA9IHJlc3BvbnNlOwogICAgICB0aGlzLm5hbWUgPSAiU2VydmljZUV4Y2VwdGlvbkVycm9yIjsKICAgIH0KICB9CiAgZnVuY3Rpb24gcGFyc2Uoc2VydmljZUV4Y2VwdGlvbiwgdXJsKSB7CiAgICBjb25zdCBlcnJvckNvZGUgPSBnZXRFbGVtZW50QXR0cmlidXRlKHNlcnZpY2VFeGNlcHRpb24sICJjb2RlIikgfHwgZ2V0RWxlbWVudEF0dHJpYnV0ZShzZXJ2aWNlRXhjZXB0aW9uLCAiZXhjZXB0aW9uQ29kZSIpOwogICAgY29uc3QgZXJyb3JMb2NhdG9yID0gZ2V0RWxlbWVudEF0dHJpYnV0ZShzZXJ2aWNlRXhjZXB0aW9uLCAibG9jYXRvciIpOwogICAgY29uc3QgdGV4dEVsZW1lbnQgPSBmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2VFeGNlcHRpb24sICJFeGNlcHRpb25UZXh0IikgfHwgc2VydmljZUV4Y2VwdGlvbjsKICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGdldEVsZW1lbnRUZXh0KHRleHRFbGVtZW50KS50cmltKCk7CiAgICByZXR1cm4gbmV3IFNlcnZpY2VFeGNlcHRpb25FcnJvcigKICAgICAgZXJyb3JNZXNzYWdlLAogICAgICB1cmwsCiAgICAgIGVycm9yQ29kZSwKICAgICAgZXJyb3JMb2NhdG9yLAogICAgICBzZXJ2aWNlRXhjZXB0aW9uLmRvY3VtZW50CiAgICApOwogIH0KICBmdW5jdGlvbiBjaGVjayhyZXNwb25zZSwgdXJsKSB7CiAgICBjb25zdCByb290RWwgPSBnZXRSb290RWxlbWVudChyZXNwb25zZSk7CiAgICBjb25zdCByb290RWxOYW1lID0gc3RyaXBOYW1lc3BhY2UoZ2V0RWxlbWVudE5hbWUocm9vdEVsKSk7CiAgICBpZiAocm9vdEVsTmFtZSA9PT0gIlNlcnZpY2VFeGNlcHRpb25SZXBvcnQiKSB7CiAgICAgIGNvbnN0IGVycm9yID0gZmluZENoaWxkRWxlbWVudChyb290RWwsICJTZXJ2aWNlRXhjZXB0aW9uIik7CiAgICAgIGlmIChlcnJvcikgewogICAgICAgIHRocm93IHBhcnNlKGVycm9yLCB1cmwpOwogICAgICB9CiAgICB9CiAgICBpZiAocm9vdEVsTmFtZSA9PT0gIkV4Y2VwdGlvblJlcG9ydCIpIHsKICAgICAgY29uc3QgZXJyb3IgPSBmaW5kQ2hpbGRFbGVtZW50KHJvb3RFbCwgIkV4Y2VwdGlvbiIpOwogICAgICBpZiAoZXJyb3IpIHsKICAgICAgICB0aHJvdyBwYXJzZShlcnJvciwgdXJsKTsKICAgICAgfQogICAgfQogICAgcmV0dXJuIHJlc3BvbnNlOwogIH0KICBmdW5jdGlvbiBlbmNvZGVFcnJvcihlcnJvcikgewogICAgY29uc3QgYmFzZSA9IHsKICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSwKICAgICAgc3RhY2s6IGVycm9yLnN0YWNrLAogICAgICBuYW1lOiBlcnJvci5uYW1lCiAgICB9OwogICAgaWYgKGVycm9yIGluc3RhbmNlb2YgU2VydmljZUV4Y2VwdGlvbkVycm9yKSB7CiAgICAgIHJldHVybiB7CiAgICAgICAgLi4uYmFzZSwKICAgICAgICBjb2RlOiBlcnJvci5jb2RlLAogICAgICAgIGxvY2F0b3I6IGVycm9yLmxvY2F0b3IsCiAgICAgICAgcmVzcG9uc2U6IGVycm9yLnJlc3BvbnNlLAogICAgICAgIHJlcXVlc3RVcmw6IGVycm9yLnJlcXVlc3RVcmwKICAgICAgfTsKICAgIH0KICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVuZHBvaW50RXJyb3IpIHsKICAgICAgcmV0dXJuIHsKICAgICAgICAuLi5iYXNlLAogICAgICAgIGh0dHBTdGF0dXM6IGVycm9yLmh0dHBTdGF0dXMsCiAgICAgICAgaXNDcm9zc09yaWdpblJlbGF0ZWQ6IGVycm9yLmlzQ3Jvc3NPcmlnaW5SZWxhdGVkCiAgICAgIH07CiAgICB9CiAgICByZXR1cm4gYmFzZTsKICB9CiAgY29uc3QgZmFsbGJhY2tFdmVudFRhcmdldCA9IG5ldyBFdmVudFRhcmdldCgpOwogIGZ1bmN0aW9uIGFkZFRhc2tIYW5kbGVyKHRhc2tOYW1lLCBzY29wZSwgaGFuZGxlcikgewogICAgY29uc3QgdXNlV29ya2VyID0gdHlwZW9mIFdvcmtlckdsb2JhbFNjb3BlICE9PSAidW5kZWZpbmVkIjsKICAgIGNvbnN0IGV2ZW50SGFuZGxlciA9IGFzeW5jIChyZXF1ZXN0KSA9PiB7CiAgICAgIGlmIChyZXF1ZXN0LnRhc2tOYW1lID09PSB0YXNrTmFtZSkgewogICAgICAgIGxldCByZXNwb25zZSwgZXJyb3I7CiAgICAgICAgdHJ5IHsKICAgICAgICAgIHJlc3BvbnNlID0gYXdhaXQgaGFuZGxlcihyZXF1ZXN0LnBhcmFtcyk7CiAgICAgICAgfSBjYXRjaCAoZSkgewogICAgICAgICAgZXJyb3IgPSBlbmNvZGVFcnJvcihlKTsKICAgICAgICB9CiAgICAgICAgY29uc3QgbWVzc2FnZSA9ICgKICAgICAgICAgIC8qKiBAdHlwZSB7V29ya2VyUmVzcG9uc2V9ICovCiAgICAgICAgICB7CiAgICAgICAgICAgIHRhc2tOYW1lLAogICAgICAgICAgICByZXF1ZXN0SWQ6IHJlcXVlc3QucmVxdWVzdElkLAogICAgICAgICAgICAuLi5yZXNwb25zZSAmJiB7IHJlc3BvbnNlIH0sCiAgICAgICAgICAgIC4uLmVycm9yICYmIHsgZXJyb3IgfQogICAgICAgICAgfQogICAgICAgICk7CiAgICAgICAgaWYgKHVzZVdvcmtlcikgewogICAgICAgICAgc2NvcGUucG9zdE1lc3NhZ2UobWVzc2FnZSk7CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgIGZhbGxiYWNrRXZlbnRUYXJnZXQuZGlzcGF0Y2hFdmVudCgKICAgICAgICAgICAgbmV3IEN1c3RvbUV2ZW50KCJvZ2MtY2xpZW50LnJlc3BvbnNlIiwgewogICAgICAgICAgICAgIGRldGFpbDogbWVzc2FnZQogICAgICAgICAgICB9KQogICAgICAgICAgKTsKICAgICAgICB9CiAgICAgIH0KICAgIH07CiAgICBpZiAodXNlV29ya2VyKSB7CiAgICAgIHNjb3BlLmFkZEV2ZW50TGlzdGVuZXIoIm1lc3NhZ2UiLCAoZXZlbnQpID0+IGV2ZW50SGFuZGxlcihldmVudC5kYXRhKSk7CiAgICB9IGVsc2UgewogICAgICBmYWxsYmFja0V2ZW50VGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoCiAgICAgICAgIm9nYy1jbGllbnQucmVxdWVzdCIsCiAgICAgICAgKGV2ZW50KSA9PiBldmVudEhhbmRsZXIoZXZlbnQuZGV0YWlsKQogICAgICApOwogICAgfQogIH0KICBjb25zdCBFTkNPRElOR1MgPSBbInV0Zi04IiwgInV0Zi0xNiIsICJpc28tODg1OS0xIl07CiAgY29uc3QgRkFMTEJBQ0tfRU5DT0RJTkcgPSAidXRmLTgiOwogIGZ1bmN0aW9uIGV4dHJhY3RFbmNvZGluZyhjb250ZW50VHlwZSkgewogICAgY29uc3QgbWF0Y2hlcyA9IC9jaGFyc2V0PShbXjtdKykvLmV4ZWMoY29udGVudFR5cGUpOwogICAgcmV0dXJuIG1hdGNoZXMgPyBtYXRjaGVzWzFdIDogbnVsbDsKICB9CiAgZnVuY3Rpb24gZGVjb2RlU3RyaW5nKGJ1ZmZlciwgY29udGVudFR5cGUpIHsKICAgIGNvbnN0IGVuY29kaW5nSGludCA9IGNvbnRlbnRUeXBlID8gZXh0cmFjdEVuY29kaW5nKGNvbnRlbnRUeXBlKSA6IG51bGw7CiAgICBjb25zdCBlbmNvZGluZ0F0dGVtcHRzID0gZW5jb2RpbmdIaW50ID8gW2VuY29kaW5nSGludCwgLi4uRU5DT0RJTkdTXSA6IEVOQ09ESU5HUzsKICAgIGZvciAoY29uc3QgZW5jb2Rpbmcgb2YgZW5jb2RpbmdBdHRlbXB0cykgewogICAgICB0cnkgewogICAgICAgIGNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoZW5jb2RpbmcsIHsgZmF0YWw6IHRydWUgfSk7CiAgICAgICAgcmV0dXJuIGRlY29kZXIuZGVjb2RlKGJ1ZmZlcik7CiAgICAgIH0gY2F0Y2ggKGUpIHsKICAgICAgfQogICAgfQogICAgY29uc29sZS53YXJuKAogICAgICBgW29nYy1jbGllbnRdIFhNTCBkb2N1bWVudCBlbmNvZGluZyBjb3VsZCBub3QgYmUgZGV0ZXJtaW5lZCwgZmFsbGluZyBiYWNrIHRvICR7RkFMTEJBQ0tfRU5DT0RJTkd9LmAKICAgICk7CiAgICByZXR1cm4gbmV3IFRleHREZWNvZGVyKEZBTExCQUNLX0VOQ09ESU5HKS5kZWNvZGUoYnVmZmVyKTsKICB9CiAgY29uc3QgZmV0Y2hQcm9taXNlcyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7CiAgbGV0IGZldGNoT3B0aW9ucyA9IHt9OwogIGZ1bmN0aW9uIHNldEZldGNoT3B0aW9ucyhvcHRpb25zKSB7CiAgICBmZXRjaE9wdGlvbnMgPSBvcHRpb25zOwogIH0KICBmdW5jdGlvbiBnZXRGZXRjaE9wdGlvbnMoKSB7CiAgICByZXR1cm4gZmV0Y2hPcHRpb25zOwogIH0KICBmdW5jdGlvbiBzaGFyZWRGZXRjaCh1cmwsIG1ldGhvZCA9ICJHRVQiLCBhc0pzb24pIHsKICAgIGxldCBmZXRjaEtleSA9IGAke21ldGhvZH0jJHt1cmx9YDsKICAgIGlmIChhc0pzb24pIHsKICAgICAgZmV0Y2hLZXkgPSBgJHttZXRob2R9I2FzSnNvbiMke3VybH1gOwogICAgfQogICAgaWYgKGZldGNoUHJvbWlzZXMuaGFzKGZldGNoS2V5KSkgewogICAgICByZXR1cm4gZmV0Y2hQcm9taXNlcy5nZXQoZmV0Y2hLZXkpOwogICAgfQogICAgY29uc3Qgb3B0aW9ucyA9IHsgLi4uZ2V0RmV0Y2hPcHRpb25zKCkgfTsKICAgIG9wdGlvbnMubWV0aG9kID0gbWV0aG9kOwogICAgaWYgKGFzSnNvbikgewogICAgICBvcHRpb25zLmhlYWRlcnMgPSAiaGVhZGVycyIgaW4gb3B0aW9ucyA/IG9wdGlvbnMuaGVhZGVycyA6IHt9OwogICAgICBvcHRpb25zLmhlYWRlcnNbIkFjY2VwdCJdID0gImFwcGxpY2F0aW9uL2pzb24sYXBwbGljYXRpb24vc2NoZW1hK2pzb24iOwogICAgfQogICAgY29uc3QgcHJvbWlzZSA9IGZldGNoKHVybCwgb3B0aW9ucykuY2F0Y2goKGUpID0+IGUpLnRoZW4oKHJlc3ApID0+IHsKICAgICAgZmV0Y2hQcm9taXNlcy5kZWxldGUoZmV0Y2hLZXkpOwogICAgICByZXR1cm4gcmVzcDsKICAgIH0pOwogICAgZmV0Y2hQcm9taXNlcy5zZXQoZmV0Y2hLZXksIHByb21pc2UpOwogICAgcmV0dXJuIHByb21pc2UudGhlbigocmVzcCkgPT4gewogICAgICBpZiAocmVzcCBpbnN0YW5jZW9mIEVycm9yKQogICAgICAgIHRocm93IHJlc3A7CiAgICAgIHJldHVybiByZXNwLmNsb25lKCk7CiAgICB9KTsKICB9CiAgZnVuY3Rpb24gcXVlcnlYbWxEb2N1bWVudCh1cmwpIHsKICAgIHJldHVybiBzaGFyZWRGZXRjaCh1cmwpLmNhdGNoKAogICAgICAoKSA9PiAoCiAgICAgICAgLy8gYXR0ZW1wdCBhIEhFQUQgdG8gc2VlIGlmIHRoZSBmYWlsdXJlIGNvbWVzIGZyb20gQ09SUyBvciB0aGUgc2VydmljZSBpcyBnZW5lcmFsbHkgdW5yZWFjaGFibGUKICAgICAgICBmZXRjaCh1cmwsIHsgLi4uZ2V0RmV0Y2hPcHRpb25zKCksIG1ldGhvZDogIkhFQUQiLCBtb2RlOiAibm8tY29ycyIgfSkuY2F0Y2goKGVycm9yKSA9PiB7CiAgICAgICAgICB0aHJvdyBuZXcgRW5kcG9pbnRFcnJvcigKICAgICAgICAgICAgYEZldGNoaW5nIHRoZSBkb2N1bWVudCBmYWlsZWQgZWl0aGVyIGR1ZSB0byBuZXR3b3JrIGVycm9ycyBvciB1bnJlYWNoYWJsZSBob3N0LCBlcnJvciBpczogJHtlcnJvci5tZXNzYWdlfWAsCiAgICAgICAgICAgIDAsCiAgICAgICAgICAgIGZhbHNlCiAgICAgICAgICApOwogICAgICAgIH0pLnRoZW4oKCkgPT4gewogICAgICAgICAgdGhyb3cgbmV3IEVuZHBvaW50RXJyb3IoCiAgICAgICAgICAgIGBUaGUgZG9jdW1lbnQgY291bGQgbm90IGJlIGZldGNoZWQgZHVlIHRvIENPUlMgbGltaXRhdGlvbnNgLAogICAgICAgICAgICAwLAogICAgICAgICAgICB0cnVlCiAgICAgICAgICApOwogICAgICAgIH0pCiAgICAgICkKICAgICkudGhlbihhc3luYyAocmVzcCkgPT4gewogICAgICBpZiAoIXJlc3Aub2spIHsKICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcmVzcC50ZXh0KCk7CiAgICAgICAgdGhyb3cgbmV3IEVuZHBvaW50RXJyb3IoCiAgICAgICAgICBgUmVjZWl2ZWQgYW4gZXJyb3Igd2l0aCBjb2RlICR7cmVzcC5zdGF0dXN9OiAke3RleHR9YCwKICAgICAgICAgIHJlc3Auc3RhdHVzLAogICAgICAgICAgZmFsc2UKICAgICAgICApOwogICAgICB9CiAgICAgIGNvbnN0IGJ1ZmZlciA9IGF3YWl0IHJlc3AuYXJyYXlCdWZmZXIoKTsKICAgICAgY29uc3QgY29udGVudFR5cGVIZWFkZXIgPSByZXNwLmhlYWRlcnMuZ2V0KCJDb250ZW50LVR5cGUiKTsKICAgICAgcmV0dXJuIGRlY29kZVN0cmluZyhidWZmZXIsIGNvbnRlbnRUeXBlSGVhZGVyKTsKICAgIH0pLnRoZW4oKHhtbCkgPT4gcGFyc2VYbWxTdHJpbmcoeG1sKSk7CiAgfQogIGZ1bmN0aW9uIHNldFF1ZXJ5UGFyYW1zKHVybCwgcGFyYW1zKSB7CiAgICBjb25zdCBlbmNvZGVkVXJsTWF0Y2ggPSB1cmwubWF0Y2goLyhodHRwcz8lM0ElMkYlMkZbXi9dKykkLyk7CiAgICBpZiAoZW5jb2RlZFVybE1hdGNoKSB7CiAgICAgIGNvbnN0IGVuY29kZWRVcmwgPSBlbmNvZGVkVXJsTWF0Y2hbMV07CiAgICAgIGNvbnN0IG1vZGlmaWVkVXJsID0gc2V0UXVlcnlQYXJhbXMoZGVjb2RlVVJJQ29tcG9uZW50KGVuY29kZWRVcmwpLCBwYXJhbXMpOwogICAgICByZXR1cm4gdXJsLnJlcGxhY2UoZW5jb2RlZFVybCwgZW5jb2RlVVJJQ29tcG9uZW50KG1vZGlmaWVkVXJsKSk7CiAgICB9CiAgICBjb25zdCB1cmxPYmogPSBuZXcgVVJMKHVybCk7CiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMocGFyYW1zKTsKICAgIGNvbnN0IGtleXNMb3dlciA9IGtleXMubWFwKChrZXkpID0+IGtleS50b0xvd2VyQ2FzZSgpKTsKICAgIGNvbnN0IHRvRGVsZXRlID0gW107CiAgICBmb3IgKGNvbnN0IHBhcmFtIG9mIHVybE9iai5zZWFyY2hQYXJhbXMua2V5cygpKSB7CiAgICAgIGlmIChrZXlzTG93ZXIuaW5kZXhPZihwYXJhbS50b0xvd2VyQ2FzZSgpKSA+IC0xKSB7CiAgICAgICAgdG9EZWxldGUucHVzaChwYXJhbSk7CiAgICAgIH0KICAgIH0KICAgIHRvRGVsZXRlLm1hcCgocGFyYW0pID0+IHVybE9iai5zZWFyY2hQYXJhbXMuZGVsZXRlKHBhcmFtKSk7CiAgICBrZXlzLmZvckVhY2goCiAgICAgIChrZXkpID0+IHVybE9iai5zZWFyY2hQYXJhbXMuc2V0KAogICAgICAgIGtleSwKICAgICAgICBwYXJhbXNba2V5XSA9PT0gdHJ1ZSA/ICIiIDogcGFyYW1zW2tleV0KICAgICAgKQogICAgKTsKICAgIHJldHVybiB1cmxPYmoudG9TdHJpbmcoKTsKICB9CiAgY29uc3QgTGF0TG9uQ3JzTGlzdCA9IFsKICAgICJFUFNHOjQwNDYiLAogICAgLy8gUkdSREMgMjAwNQogICAgIkVQU0c6NDA3NSIsCiAgICAvLyBTUkVGOTgKICAgICJFUFNHOjQxMjAiLAogICAgLy8gR3JlZWsKICAgICJFUFNHOjQxMjIiLAogICAgLy8gQVRTNzcKICAgICJFUFNHOjQxMjQiLAogICAgLy8gUlQ5MAogICAgIkVQU0c6NDEyNiIsCiAgICAvLyBMS1M5NCAoRVRSUzg5KQogICAgIkVQU0c6NDE0OSIsCiAgICAvLyBDSDE5MDMKICAgICJFUFNHOjQxNTEiLAogICAgLy8gQ0hUUkY5NQogICAgIkVQU0c6NDE1MyIsCiAgICAvLyBSYXNzYWRpcmFuCiAgICAiRVBTRzo0MTU1IiwKICAgIC8vIERhYm9sYSAxOTgxCiAgICAiRVBTRzo0MTU3IiwKICAgIC8vIE1vdW50IERpbGxvbgogICAgIkVQU0c6NDE1OSIsCiAgICAvLyBFTEQ3OQogICAgIkVQU0c6NDE2MSIsCiAgICAvLyBQYW1wYSBkZWwgQ2FzdGlsbG8KICAgICJFUFNHOjQxNjMiLAogICAgLy8gWWVtZW4gTkdOOTYKICAgICJFUFNHOjQxNjUiLAogICAgLy8gQmlzc2F1CiAgICAiRVBTRzo0MTY3IiwKICAgIC8vIE5aR0QyMDAwCiAgICAiRVBTRzo0MTY5IiwKICAgIC8vIEFtZXJpY2FuIFNhbW9hIDE5NjIKICAgICJFUFNHOjQxNzEiLAogICAgLy8gUkdGOTMKICAgICJFUFNHOjQxNzMiLAogICAgLy8gSVJFTkVUOTUKICAgICJFUFNHOjQxNzUiLAogICAgLy8gU2llcnJhIExlb25lIDE5NjgKICAgICJFUFNHOjQxNzgiLAogICAgLy8gUHVsa292byAxOTQyKDgzKQogICAgIkVQU0c6NDE4MCIsCiAgICAvLyBFU1Q5NwogICAgIkVQU0c6NDE4MiIsCiAgICAvLyBBem9yZXMgT2NjaWRlbnRhbCAxOTM5CiAgICAiRVBTRzo0MTg0IiwKICAgIC8vIEF6b3JlcyBPcmllbnRhbCAxOTQwCiAgICAiRVBTRzo0MTg4IiwKICAgIC8vIE9TTkkgMTk1MgogICAgIkVQU0c6NDE5MCIsCiAgICAvLyBQT1NHQVIgOTgKICAgICJFUFNHOjQxOTEiLAogICAgLy8gQWxiYW5pYW4gMTk4NwogICAgIkVQU0c6NDE5NiIsCiAgICAvLyBBbW1hc3NhbGlrIDE5NTgKICAgICJFUFNHOjQxOTgiLAogICAgLy8gS291c3NlcmkKICAgICJFUFNHOjQyMDIiLAogICAgLy8gQUdENjYKICAgICJFUFNHOjQyMTAiLAogICAgLy8gQXJjIDE5NjAKICAgICJFUFNHOjQyMTEiLAogICAgLy8gQmF0YXZpYQogICAgIkVQU0c6NDIxNCIsCiAgICAvLyBCZWlqaW5nIDE5NTQKICAgICJFUFNHOjQyMjYiLAogICAgLy8gQ290ZSBkJ0l2b2lyZQogICAgIkVQU0c6NDIyOSIsCiAgICAvLyBFZ3lwdCAxOTA3CiAgICAiRVBTRzo0MjMxIiwKICAgIC8vIEVEODcKICAgICJFUFNHOjQyMzMiLAogICAgLy8gR2FuZGFqaWthIDE5NzAKICAgICJFUFNHOjQyMzYiLAogICAgLy8gSHUgVHp1IFNoYW4gMTk1MAogICAgIkVQU0c6NDIzOCIsCiAgICAvLyBJRDc0CiAgICAiRVBTRzo0MjQwIiwKICAgIC8vIEluZGlhbiAxOTc1CiAgICAiRVBTRzo0MjQyIiwKICAgIC8vIEpBRDY5CiAgICAiRVBTRzo0MjQ0IiwKICAgIC8vIEthbmRhd2FsYQogICAgIkVQU0c6NDI0NiIsCiAgICAvLyBLT0MKICAgICJFUFNHOjQyNDgiLAogICAgLy8gUFNBRDU2CiAgICAiRVBTRzo0MjUwIiwKICAgIC8vIExlaWdvbgogICAgIkVQU0c6NDI1MiIsCiAgICAvLyBMb21lCiAgICAiRVBTRzo0MjU1IiwKICAgIC8vIEhlcmF0IE5vcnRoCiAgICAiRVBTRzo0MjU4IiwKICAgIC8vIEVUUlM4OQogICAgIkVQU0c6NDI2MSIsCiAgICAvLyBNZXJjaGljaAogICAgIkVQU0c6NDI2NCIsCiAgICAvLyBNaGFzdAogICAgIkVQU0c6NDI2NyIsCiAgICAvLyBOQUQyNwogICAgIkVQU0c6NDI3MCIsCiAgICAvLyBOYWhyd2FuIDE5NjcKICAgICJFUFNHOjQyNzMiLAogICAgLy8gTkdPIDE5NDgKICAgICJFUFNHOjQyNzYiLAogICAgLy8gTlNXQyA5Wi0yCiAgICAiRVBTRzo0Mjc5IiwKICAgIC8vIE9TKFNOKTgwCiAgICAiRVBTRzo0MjgxIiwKICAgIC8vIFBhbGVzdGluZSAxOTIzCiAgICAiRVBTRzo0Mjg0IiwKICAgIC8vIFB1bGtvdm8gMTk0MgogICAgIkVQU0c6NDI4NiIsCiAgICAvLyBRYXRhciAxOTQ4CiAgICAiRVBTRzo0Mjg4IiwKICAgIC8vIExvbWEgUXVpbnRhbmEKICAgICJFUFNHOjQyOTIiLAogICAgLy8gU2FwcGVyIEhpbGwgMTk0MwogICAgIkVQU0c6NDI5NSIsCiAgICAvLyBTZXJpbmR1bmcKICAgICJFUFNHOjQyOTciLAogICAgLy8gVGFuYW5hcml2ZQogICAgIkVQU0c6NDI5OSIsCiAgICAvLyBUTTY1CiAgICAiRVBTRzo0MzAyIiwKICAgIC8vIFRyaW5pZGFkIDE5MDMKICAgICJFUFNHOjQzMjQiLAogICAgLy8gV0dTIDcyQkUKICAgICJFUFNHOjQzMjYiCiAgICAvLyBXR1MgODQKICBdOwogIGZ1bmN0aW9uIGhhc0ludmVydGVkQ29vcmRpbmF0ZXMoY3JzTmFtZSkgewogICAgcmV0dXJuIExhdExvbkNyc0xpc3QuaW5kZXhPZihzaW1wbGlmeUVwc2dVcm4oY3JzTmFtZSkpID4gLTE7CiAgfQogIGZ1bmN0aW9uIHNpbXBsaWZ5RXBzZ1VybihmdWxsQ3JzTmFtZSkgewogICAgaWYgKC9edXJuOig/OngtKT9vZ2M6ZGVmOmNyczplcHNnOi8udGVzdChmdWxsQ3JzTmFtZS50b0xvd2VyQ2FzZSgpKSkgewogICAgICBjb25zdCBjb2RlID0gLyhbMC05XSspJC8uZXhlYyhmdWxsQ3JzTmFtZSlbMV07CiAgICAgIHJldHVybiBgRVBTRzoke2NvZGV9YDsKICAgIH0KICAgIHJldHVybiBmdWxsQ3JzTmFtZTsKICB9CiAgZnVuY3Rpb24gcmVhZE9wZXJhdGlvblVybHNGcm9tQ2FwYWJpbGl0aWVzJDEoY2FwYWJpbGl0aWVzRG9jKSB7CiAgICBjb25zdCB1cmxzID0ge307CiAgICBjb25zdCBjYXBhYmlsaXR5ID0gZmluZENoaWxkRWxlbWVudCgKICAgICAgZ2V0Um9vdEVsZW1lbnQoY2FwYWJpbGl0aWVzRG9jKSwKICAgICAgIkNhcGFiaWxpdHkiCiAgICApOwogICAgY29uc3QgcmVxdWVzdCA9IGZpbmRDaGlsZEVsZW1lbnQoY2FwYWJpbGl0eSwgIlJlcXVlc3QiKTsKICAgIGdldENoaWxkcmVuRWxlbWVudChyZXF1ZXN0KS5mb3JFYWNoKChvcGVyYXRpb24pID0+IHsKICAgICAgY29uc3Qgb3BlcmF0aW9uTmFtZSA9IHN0cmlwTmFtZXNwYWNlKGdldEVsZW1lbnROYW1lKG9wZXJhdGlvbikpOwogICAgICB1cmxzW29wZXJhdGlvbk5hbWVdID0gcGFyc2VPcGVyYXRpb24ob3BlcmF0aW9uKTsKICAgIH0pOwogICAgcmV0dXJuIHVybHM7CiAgfQogIGZ1bmN0aW9uIHJlYWRWZXJzaW9uRnJvbUNhcGFiaWxpdGllcyQxKGNhcGFiaWxpdGllc0RvYykgewogICAgcmV0dXJuIGdldFJvb3RFbGVtZW50KGNhcGFiaWxpdGllc0RvYykuYXR0cmlidXRlc1sidmVyc2lvbiJdOwogIH0KICBmdW5jdGlvbiByZWFkTGF5ZXJzRnJvbUNhcGFiaWxpdGllcyQxKGNhcGFiaWxpdGllc0RvYykgewogICAgY29uc3QgdmVyc2lvbiA9IHJlYWRWZXJzaW9uRnJvbUNhcGFiaWxpdGllcyQxKGNhcGFiaWxpdGllc0RvYyk7CiAgICBjb25zdCBjYXBhYmlsaXR5ID0gZmluZENoaWxkRWxlbWVudCgKICAgICAgZ2V0Um9vdEVsZW1lbnQoY2FwYWJpbGl0aWVzRG9jKSwKICAgICAgIkNhcGFiaWxpdHkiCiAgICApOwogICAgcmV0dXJuIGZpbmRDaGlsZHJlbkVsZW1lbnQoY2FwYWJpbGl0eSwgIkxheWVyIikubWFwKAogICAgICAobGF5ZXJFbCkgPT4gcGFyc2VMYXllcihsYXllckVsLCB2ZXJzaW9uKQogICAgKTsKICB9CiAgZnVuY3Rpb24gcmVhZE91dHB1dEZvcm1hdHNGcm9tQ2FwYWJpbGl0aWVzJDEoY2FwYWJpbGl0aWVzRG9jKSB7CiAgICBjb25zdCBjYXBhYmlsaXR5ID0gZmluZENoaWxkRWxlbWVudCgKICAgICAgZ2V0Um9vdEVsZW1lbnQoY2FwYWJpbGl0aWVzRG9jKSwKICAgICAgIkNhcGFiaWxpdHkiCiAgICApOwogICAgY29uc3QgZ2V0TWFwID0gZmluZENoaWxkRWxlbWVudCgKICAgICAgZmluZENoaWxkRWxlbWVudChjYXBhYmlsaXR5LCAiUmVxdWVzdCIpLAogICAgICAiR2V0TWFwIgogICAgKTsKICAgIGNvbnN0IG91dHB1dEZvcm1hdHMgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KGdldE1hcCwgIkZvcm1hdCIpLm1hcCgKICAgICAgZ2V0RWxlbWVudFRleHQKICAgICk7CiAgICByZXR1cm4gb3V0cHV0Rm9ybWF0czsKICB9CiAgZnVuY3Rpb24gcmVhZEluZm9Gb3JtYXRzRnJvbUNhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXNEb2MpIHsKICAgIGNvbnN0IGNhcGFiaWxpdHkgPSBmaW5kQ2hpbGRFbGVtZW50KAogICAgICBnZXRSb290RWxlbWVudChjYXBhYmlsaXRpZXNEb2MpLAogICAgICAiQ2FwYWJpbGl0eSIKICAgICk7CiAgICBjb25zdCBnZXRGZWF0dXJlSW5mbyA9IGZpbmRDaGlsZEVsZW1lbnQoCiAgICAgIGZpbmRDaGlsZEVsZW1lbnQoY2FwYWJpbGl0eSwgIlJlcXVlc3QiKSwKICAgICAgIkdldEZlYXR1cmVJbmZvIgogICAgKTsKICAgIGNvbnN0IG91dHB1dEZvcm1hdHMgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KGdldEZlYXR1cmVJbmZvLCAiRm9ybWF0IikubWFwKAogICAgICBnZXRFbGVtZW50VGV4dAogICAgKTsKICAgIHJldHVybiBvdXRwdXRGb3JtYXRzOwogIH0KICBmdW5jdGlvbiByZWFkRXhjZXB0aW9uRm9ybWF0c0Zyb21DYXBhYmlsaXRpZXMoY2FwYWJpbGl0aWVzRG9jKSB7CiAgICBjb25zdCBjYXBhYmlsaXR5ID0gZmluZENoaWxkRWxlbWVudCgKICAgICAgZ2V0Um9vdEVsZW1lbnQoY2FwYWJpbGl0aWVzRG9jKSwKICAgICAgIkNhcGFiaWxpdHkiCiAgICApOwogICAgY29uc3QgZXhjZXB0aW9uID0gZmluZENoaWxkRWxlbWVudChjYXBhYmlsaXR5LCAiRXhjZXB0aW9uIik7CiAgICBjb25zdCBleGNlcHRpb25Gb3JtYXRzID0gZmluZENoaWxkcmVuRWxlbWVudChleGNlcHRpb24sICJGb3JtYXQiKS5tYXAoCiAgICAgIGdldEVsZW1lbnRUZXh0CiAgICApOwogICAgcmV0dXJuIGV4Y2VwdGlvbkZvcm1hdHM7CiAgfQogIGZ1bmN0aW9uIHJlYWRJbmZvRnJvbUNhcGFiaWxpdGllcyQyKGNhcGFiaWxpdGllc0RvYykgewogICAgY29uc3Qgc2VydmljZSA9IGZpbmRDaGlsZEVsZW1lbnQoZ2V0Um9vdEVsZW1lbnQoY2FwYWJpbGl0aWVzRG9jKSwgIlNlcnZpY2UiKTsKICAgIGNvbnN0IG91dHB1dEZvcm1hdHMgPSByZWFkT3V0cHV0Rm9ybWF0c0Zyb21DYXBhYmlsaXRpZXMkMShjYXBhYmlsaXRpZXNEb2MpOwogICAgY29uc3QgaW5mb0Zvcm1hdHMgPSByZWFkSW5mb0Zvcm1hdHNGcm9tQ2FwYWJpbGl0aWVzKGNhcGFiaWxpdGllc0RvYyk7CiAgICBjb25zdCBleGNlcHRpb25Gb3JtYXRzID0gcmVhZEV4Y2VwdGlvbkZvcm1hdHNGcm9tQ2FwYWJpbGl0aWVzKGNhcGFiaWxpdGllc0RvYyk7CiAgICBjb25zdCBrZXl3b3JkcyA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoCiAgICAgIGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZSwgIktleXdvcmRMaXN0IiksCiAgICAgICJLZXl3b3JkIgogICAgKS5tYXAoZ2V0RWxlbWVudFRleHQpLmZpbHRlcigodiwgaSwgYXJyKSA9PiBhcnIuaW5kZXhPZih2KSA9PT0gaSk7CiAgICBjb25zdCBwcm92aWRlciA9IHJlYWRQcm92aWRlckZyb21DYXBhYmlsaXRpZXMkMShjYXBhYmlsaXRpZXNEb2MpOwogICAgcmV0dXJuIHsKICAgICAgdGl0bGU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZSwgIlRpdGxlIikpLAogICAgICBuYW1lOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2UsICJOYW1lIikpLAogICAgICBhYnN0cmFjdDogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChzZXJ2aWNlLCAiQWJzdHJhY3QiKSksCiAgICAgIG91dHB1dEZvcm1hdHMsCiAgICAgIGluZm9Gb3JtYXRzLAogICAgICBleGNlcHRpb25Gb3JtYXRzLAogICAgICBmZWVzOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2UsICJGZWVzIikpLAogICAgICBjb25zdHJhaW50czogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChzZXJ2aWNlLCAiQWNjZXNzQ29uc3RyYWludHMiKSksCiAgICAgIHByb3ZpZGVyLAogICAgICBrZXl3b3JkcwogICAgfTsKICB9CiAgZnVuY3Rpb24gcGFyc2VPcGVyYXRpb24ob3BlcmF0aW9uKSB7CiAgICBjb25zdCB1cmxzID0ge307CiAgICBjb25zdCBkY3BUeXBlID0gZmluZENoaWxkcmVuRWxlbWVudChvcGVyYXRpb24sICJEQ1BUeXBlIik7CiAgICBjb25zdCBodHRwID0gZGNwVHlwZS5mbGF0TWFwKChkKSA9PiBmaW5kQ2hpbGRFbGVtZW50KGQsICJIVFRQIikpOwogICAgY29uc3QgbWV0aG9kcyA9IGh0dHAuZmxhdE1hcCgoaCkgPT4gZ2V0Q2hpbGRyZW5FbGVtZW50KGgpKTsKICAgIG1ldGhvZHMuZm9yRWFjaCgobWV0aG9kKSA9PiB7CiAgICAgIGNvbnN0IG9ubGluZVJlc291cmNlID0gZmluZENoaWxkRWxlbWVudChtZXRob2QsICJPbmxpbmVSZXNvdXJjZSIpOwogICAgICBjb25zdCBtZXRob2ROYW1lID0gc3RyaXBOYW1lc3BhY2UoZ2V0RWxlbWVudE5hbWUobWV0aG9kKSk7CiAgICAgIHVybHNbbWV0aG9kTmFtZV0gPSBnZXRFbGVtZW50QXR0cmlidXRlKG9ubGluZVJlc291cmNlLCAieGxpbms6aHJlZiIpOwogICAgfSk7CiAgICByZXR1cm4gdXJsczsKICB9CiAgZnVuY3Rpb24gcGFyc2VMYXllcihsYXllckVsLCB2ZXJzaW9uLCBpbmhlcml0ZWRTcnMgPSBbXSwgaW5oZXJpdGVkU3R5bGVzID0gW10sIGluaGVyaXRlZEF0dHJpYnV0aW9uID0gbnVsbCwgaW5oZXJpdGVkQm91bmRpbmdCb3hlcyA9IG51bGwsIGluaGVyaXRlZE1heFNjYWxlRGVub20gPSBudWxsLCBpbmhlcml0ZWRNaW5TY2FsZURlbm9tID0gbnVsbCkgewogICAgY29uc3Qgc3JzVGFnID0gdmVyc2lvbiA9PT0gIjEuMy4wIiA/ICJDUlMiIDogIlNSUyI7CiAgICBjb25zdCBzcnNMaXN0ID0gZmluZENoaWxkcmVuRWxlbWVudChsYXllckVsLCBzcnNUYWcpLm1hcChnZXRFbGVtZW50VGV4dCk7CiAgICBjb25zdCBhdmFpbGFibGVDcnMgPSBzcnNMaXN0Lmxlbmd0aCA+IDAgPyBzcnNMaXN0IDogaW5oZXJpdGVkU3JzOwogICAgY29uc3QgbGF5ZXJTdHlsZXMgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KGxheWVyRWwsICJTdHlsZSIpLm1hcCgKICAgICAgcGFyc2VMYXllclN0eWxlCiAgICApOwogICAgY29uc3Qgc3R5bGVzID0gbGF5ZXJTdHlsZXMubGVuZ3RoID4gMCA/IGxheWVyU3R5bGVzIDogaW5oZXJpdGVkU3R5bGVzOwogICAgZnVuY3Rpb24gcGFyc2VCQm94MihiYm94RWwpIHsKICAgICAgY29uc3Qgc3JzID0gZ2V0RWxlbWVudEF0dHJpYnV0ZShiYm94RWwsIHNyc1RhZyk7CiAgICAgIGNvbnN0IGF0dHJzID0gaGFzSW52ZXJ0ZWRDb29yZGluYXRlcyhzcnMpICYmIHZlcnNpb24gPT09ICIxLjMuMCIgPyBbIm1pbnkiLCAibWlueCIsICJtYXh5IiwgIm1heHgiXSA6IFsibWlueCIsICJtaW55IiwgIm1heHgiLCAibWF4eSJdOwogICAgICByZXR1cm4gYXR0cnMubWFwKChuYW1lKSA9PiBnZXRFbGVtZW50QXR0cmlidXRlKGJib3hFbCwgbmFtZSkpOwogICAgfQogICAgZnVuY3Rpb24gcGFyc2VFeEdlb2dyYXBoaWNCb3VuZGluZ0JveChiYm94RWwpIHsKICAgICAgcmV0dXJuIFsKICAgICAgICAid2VzdEJvdW5kTG9uZ2l0dWRlIiwKICAgICAgICAic291dGhCb3VuZExhdGl0dWRlIiwKICAgICAgICAiZWFzdEJvdW5kTG9uZ2l0dWRlIiwKICAgICAgICAibm9ydGhCb3VuZExhdGl0dWRlIgogICAgICBdLm1hcCgobmFtZSkgPT4gZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChiYm94RWwsIG5hbWUpKSk7CiAgICB9CiAgICBmdW5jdGlvbiBwYXJzZUxhdExvbkJvdW5kaW5nQm94KGJib3hFbCkgewogICAgICByZXR1cm4gWyJtaW54IiwgIm1pbnkiLCAibWF4eCIsICJtYXh5Il0ubWFwKAogICAgICAgIChuYW1lKSA9PiBnZXRFbGVtZW50QXR0cmlidXRlKGJib3hFbCwgbmFtZSkKICAgICAgKTsKICAgIH0KICAgIGZ1bmN0aW9uIHBhcnNlU2NhbGVIaW50VmFsdWUodGV4dFZhbHVlLCBkZWZhdWx0VmFsdWUpIHsKICAgICAgaWYgKHRleHRWYWx1ZSA9PT0gIiIpIHsKICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlOwogICAgICB9CiAgICAgIHJldHVybiBNYXRoLnNxcnQoMC41ICogcGFyc2VGbG9hdCh0ZXh0VmFsdWUpICoqIDIpIC8gMjhlLTU7CiAgICB9CiAgICBmdW5jdGlvbiBwYXJzZVNjYWxlSGludCgpIHsKICAgICAgY29uc3Qgc2NhbGVIaW50ID0gZmluZENoaWxkRWxlbWVudChsYXllckVsLCAiU2NhbGVIaW50Iik7CiAgICAgIGlmICghc2NhbGVIaW50KSB7CiAgICAgICAgcmV0dXJuIFtpbmhlcml0ZWRNaW5TY2FsZURlbm9tLCBpbmhlcml0ZWRNYXhTY2FsZURlbm9tXTsKICAgICAgfQogICAgICBjb25zdCBtaW4gPSBnZXRFbGVtZW50QXR0cmlidXRlKHNjYWxlSGludCwgIm1pbiIpOwogICAgICBjb25zdCBtYXggPSBnZXRFbGVtZW50QXR0cmlidXRlKHNjYWxlSGludCwgIm1heCIpOwogICAgICByZXR1cm4gWwogICAgICAgIHBhcnNlU2NhbGVIaW50VmFsdWUobWluLCBpbmhlcml0ZWRNaW5TY2FsZURlbm9tKSwKICAgICAgICBwYXJzZVNjYWxlSGludFZhbHVlKG1heCwgaW5oZXJpdGVkTWF4U2NhbGVEZW5vbSkKICAgICAgXTsKICAgIH0KICAgIGZ1bmN0aW9uIHBhcnNlU2NhbGVEZW5vbWluYXRvcihuYW1lLCBpbmhlcml0ZWRWYWx1ZSkgewogICAgICBjb25zdCB0ZXh0VmFsdWUgPSBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KGxheWVyRWwsIG5hbWUpKTsKICAgICAgcmV0dXJuIHRleHRWYWx1ZSA9PT0gIiIgPyBpbmhlcml0ZWRWYWx1ZSA6IHBhcnNlRmxvYXQodGV4dFZhbHVlKTsKICAgIH0KICAgIGNvbnN0IGF0dHJpYnV0aW9uRWwgPSBmaW5kQ2hpbGRFbGVtZW50KGxheWVyRWwsICJBdHRyaWJ1dGlvbiIpOwogICAgY29uc3QgYXR0cmlidXRpb24gPSBhdHRyaWJ1dGlvbkVsICE9PSBudWxsID8gcGFyc2VMYXllckF0dHJpYnV0aW9uKGF0dHJpYnV0aW9uRWwpIDogaW5oZXJpdGVkQXR0cmlidXRpb247CiAgICBjb25zdCBsYXRMb25CYm94RWwgPSB2ZXJzaW9uID09PSAiMS4zLjAiID8gZmluZENoaWxkRWxlbWVudChsYXllckVsLCAiRVhfR2VvZ3JhcGhpY0JvdW5kaW5nQm94IikgOiBmaW5kQ2hpbGRFbGVtZW50KGxheWVyRWwsICJMYXRMb25Cb3VuZGluZ0JveCIpOwogICAgY29uc3QgYmFzZUJvdW5kaW5nQm94ID0ge307CiAgICBpZiAobGF0TG9uQmJveEVsKSB7CiAgICAgIGJhc2VCb3VuZGluZ0JveFsiRVBTRzo0MzI2Il0gPSB2ZXJzaW9uID09PSAiMS4zLjAiID8gcGFyc2VFeEdlb2dyYXBoaWNCb3VuZGluZ0JveChsYXRMb25CYm94RWwpIDogcGFyc2VMYXRMb25Cb3VuZGluZ0JveChsYXRMb25CYm94RWwpOwogICAgfQogICAgbGV0IGJvdW5kaW5nQm94ZXMgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KGxheWVyRWwsICJCb3VuZGluZ0JveCIpLnJlZHVjZSgKICAgICAgKHByZXYsIGJib3hFbCkgPT4gKHsKICAgICAgICAuLi5wcmV2LAogICAgICAgIFtnZXRFbGVtZW50QXR0cmlidXRlKGJib3hFbCwgc3JzVGFnKV06IHBhcnNlQkJveDIoYmJveEVsKQogICAgICB9KSwKICAgICAgYmFzZUJvdW5kaW5nQm94CiAgICApOwogICAgYm91bmRpbmdCb3hlcyA9IE9iamVjdC5rZXlzKGJvdW5kaW5nQm94ZXMpLmxlbmd0aCA+IDAgfHwgaW5oZXJpdGVkQm91bmRpbmdCb3hlcyA9PT0gbnVsbCA/IGJvdW5kaW5nQm94ZXMgOiBpbmhlcml0ZWRCb3VuZGluZ0JveGVzOwogICAgY29uc3QgcXVlcnlhYmxlID0gbGF5ZXJFbC5hdHRyaWJ1dGVzLnF1ZXJ5YWJsZSA9PT0gIjEiIHx8IGxheWVyRWwuYXR0cmlidXRlcy5xdWVyeWFibGUgPT09ICJ0cnVlIiA/IHRydWUgOiBmYWxzZTsKICAgIGNvbnN0IG9wYXF1ZSA9IGxheWVyRWwuYXR0cmlidXRlcy5vcGFxdWUgPT09ICIxIiB8fCBsYXllckVsLmF0dHJpYnV0ZXMub3BhcXVlID09PSAidHJ1ZSIgPyB0cnVlIDogZmFsc2U7CiAgICBjb25zdCBrZXl3b3JkcyA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoCiAgICAgIGZpbmRDaGlsZEVsZW1lbnQobGF5ZXJFbCwgIktleXdvcmRMaXN0IiksCiAgICAgICJLZXl3b3JkIgogICAgKS5tYXAoZ2V0RWxlbWVudFRleHQpLmZpbHRlcigodiwgaSwgYXJyKSA9PiBhcnIuaW5kZXhPZih2KSA9PT0gaSk7CiAgICBsZXQgbWluU2NhbGVEZW5vbWluYXRvciwgbWF4U2NhbGVEZW5vbWluYXRvcjsKICAgIGlmICh2ZXJzaW9uID09PSAiMS4zLjAiKSB7CiAgICAgIG1pblNjYWxlRGVub21pbmF0b3IgPSBwYXJzZVNjYWxlRGVub21pbmF0b3IoCiAgICAgICAgIk1pblNjYWxlRGVub21pbmF0b3IiLAogICAgICAgIGluaGVyaXRlZE1pblNjYWxlRGVub20KICAgICAgKTsKICAgICAgbWF4U2NhbGVEZW5vbWluYXRvciA9IHBhcnNlU2NhbGVEZW5vbWluYXRvcigKICAgICAgICAiTWF4U2NhbGVEZW5vbWluYXRvciIsCiAgICAgICAgaW5oZXJpdGVkTWF4U2NhbGVEZW5vbQogICAgICApOwogICAgfSBlbHNlIHsKICAgICAgW21pblNjYWxlRGVub21pbmF0b3IsIG1heFNjYWxlRGVub21pbmF0b3JdID0gcGFyc2VTY2FsZUhpbnQoKTsKICAgIH0KICAgIGNvbnN0IG1ldGFkYXRhID0gZmluZENoaWxkcmVuRWxlbWVudChsYXllckVsLCAiTWV0YWRhdGFVUkwiKS5tYXAoCiAgICAgIChtZXRhZGF0YVVybEVsKSA9PiAoewogICAgICAgIHR5cGU6IGdldEVsZW1lbnRBdHRyaWJ1dGUobWV0YWRhdGFVcmxFbCwgInR5cGUiKSwKICAgICAgICBmb3JtYXQ6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQobWV0YWRhdGFVcmxFbCwgIkZvcm1hdCIpKSwKICAgICAgICB1cmw6IGdldEVsZW1lbnRBdHRyaWJ1dGUoCiAgICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KG1ldGFkYXRhVXJsRWwsICJPbmxpbmVSZXNvdXJjZSIpLAogICAgICAgICAgInhsaW5rOmhyZWYiCiAgICAgICAgKQogICAgICB9KQogICAgKTsKICAgIGNvbnN0IGNoaWxkcmVuID0gZmluZENoaWxkcmVuRWxlbWVudChsYXllckVsLCAiTGF5ZXIiKS5tYXAoCiAgICAgIChsYXllcikgPT4gcGFyc2VMYXllcigKICAgICAgICBsYXllciwKICAgICAgICB2ZXJzaW9uLAogICAgICAgIGF2YWlsYWJsZUNycywKICAgICAgICBzdHlsZXMsCiAgICAgICAgYXR0cmlidXRpb24sCiAgICAgICAgYm91bmRpbmdCb3hlcywKICAgICAgICBtYXhTY2FsZURlbm9taW5hdG9yLAogICAgICAgIG1pblNjYWxlRGVub21pbmF0b3IKICAgICAgKQogICAgKTsKICAgIHJldHVybiB7CiAgICAgIG5hbWU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQobGF5ZXJFbCwgIk5hbWUiKSksCiAgICAgIHRpdGxlOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KGxheWVyRWwsICJUaXRsZSIpKSwKICAgICAgYWJzdHJhY3Q6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQobGF5ZXJFbCwgIkFic3RyYWN0IikpLAogICAgICBhdmFpbGFibGVDcnMsCiAgICAgIHN0eWxlcywKICAgICAgYXR0cmlidXRpb24sCiAgICAgIGJvdW5kaW5nQm94ZXMsCiAgICAgIGtleXdvcmRzLAogICAgICBxdWVyeWFibGUsCiAgICAgIG9wYXF1ZSwKICAgICAgLi4ubWluU2NhbGVEZW5vbWluYXRvciAhPT0gbnVsbCA/IHsgbWluU2NhbGVEZW5vbWluYXRvciB9IDoge30sCiAgICAgIC4uLm1heFNjYWxlRGVub21pbmF0b3IgIT09IG51bGwgPyB7IG1heFNjYWxlRGVub21pbmF0b3IgfSA6IHt9LAogICAgICAuLi5tZXRhZGF0YS5sZW5ndGggJiYgeyBtZXRhZGF0YSB9LAogICAgICAuLi5jaGlsZHJlbi5sZW5ndGggJiYgeyBjaGlsZHJlbiB9CiAgICB9OwogIH0KICBmdW5jdGlvbiBwYXJzZUxheWVyU3R5bGUoc3R5bGVFbCkgewogICAgY29uc3QgbGVnZW5kVXJsID0gZ2V0RWxlbWVudEF0dHJpYnV0ZSgKICAgICAgZmluZENoaWxkRWxlbWVudChmaW5kQ2hpbGRFbGVtZW50KHN0eWxlRWwsICJMZWdlbmRVUkwiKSwgIk9ubGluZVJlc291cmNlIiksCiAgICAgICJ4bGluazpocmVmIgogICAgKTsKICAgIGNvbnN0IGFic3RyYWN0ID0gZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChzdHlsZUVsLCAiQWJzdHJhY3QiKSk7CiAgICByZXR1cm4gewogICAgICBuYW1lOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KHN0eWxlRWwsICJOYW1lIikpLAogICAgICB0aXRsZTogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChzdHlsZUVsLCAiVGl0bGUiKSksCiAgICAgIC4uLmFic3RyYWN0ICYmIHsgYWJzdHJhY3QgfSwKICAgICAgLi4ubGVnZW5kVXJsICYmIHsgbGVnZW5kVXJsIH0KICAgIH07CiAgfQogIGZ1bmN0aW9uIHBhcnNlTGF5ZXJBdHRyaWJ1dGlvbihhdHRyaWJ1dGlvbkVsKSB7CiAgICBjb25zdCBsb2dvVXJsID0gZ2V0RWxlbWVudEF0dHJpYnV0ZSgKICAgICAgZmluZENoaWxkRWxlbWVudCgKICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KGF0dHJpYnV0aW9uRWwsICJMb2dvVVJMIiksCiAgICAgICAgIk9ubGluZVJlc291cmNlIgogICAgICApLAogICAgICAieGxpbms6aHJlZiIKICAgICk7CiAgICBjb25zdCB1cmwgPSBnZXRFbGVtZW50QXR0cmlidXRlKAogICAgICBmaW5kQ2hpbGRFbGVtZW50KGF0dHJpYnV0aW9uRWwsICJPbmxpbmVSZXNvdXJjZSIpLAogICAgICAieGxpbms6aHJlZiIKICAgICk7CiAgICBjb25zdCB0aXRsZSA9IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoYXR0cmlidXRpb25FbCwgIlRpdGxlIikpOwogICAgcmV0dXJuIHsKICAgICAgLi4udGl0bGUgJiYgeyB0aXRsZSB9LAogICAgICAuLi51cmwgJiYgeyB1cmwgfSwKICAgICAgLi4ubG9nb1VybCAmJiB7IGxvZ29VcmwgfQogICAgfTsKICB9CiAgZnVuY3Rpb24gcmVhZFByb3ZpZGVyRnJvbUNhcGFiaWxpdGllcyQxKGNhcGFiaWxpdGllc0RvYykgewogICAgY29uc3Qgc2VydmljZSA9IGZpbmRDaGlsZEVsZW1lbnQoZ2V0Um9vdEVsZW1lbnQoY2FwYWJpbGl0aWVzRG9jKSwgIlNlcnZpY2UiKTsKICAgIGNvbnN0IGNvbnRhY3RJbmZvcm1hdGlvbiA9IGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZSwgIkNvbnRhY3RJbmZvcm1hdGlvbiIpOwogICAgY29uc3QgY29udGFjdFBlcnNvblByaW1hcnkgPSBmaW5kQ2hpbGRFbGVtZW50KAogICAgICBjb250YWN0SW5mb3JtYXRpb24sCiAgICAgICJDb250YWN0UGVyc29uUHJpbWFyeSIKICAgICk7CiAgICBjb25zdCBhZGRyZXNzID0gZmluZENoaWxkRWxlbWVudChjb250YWN0SW5mb3JtYXRpb24sICJDb250YWN0QWRkcmVzcyIpOwogICAgcmV0dXJuIHsKICAgICAgY29udGFjdDogewogICAgICAgIG5hbWU6IGdldEVsZW1lbnRUZXh0KAogICAgICAgICAgZmluZENoaWxkRWxlbWVudChjb250YWN0UGVyc29uUHJpbWFyeSwgIkNvbnRhY3RQZXJzb24iKQogICAgICAgICksCiAgICAgICAgb3JnYW5pemF0aW9uOiBnZXRFbGVtZW50VGV4dCgKICAgICAgICAgIGZpbmRDaGlsZEVsZW1lbnQoY29udGFjdFBlcnNvblByaW1hcnksICJDb250YWN0T3JnYW5pemF0aW9uIikKICAgICAgICApLAogICAgICAgIHBvc2l0aW9uOiBnZXRFbGVtZW50VGV4dCgKICAgICAgICAgIGZpbmRDaGlsZEVsZW1lbnQoY29udGFjdEluZm9ybWF0aW9uLCAiQ29udGFjdFBvc2l0aW9uIikKICAgICAgICApLAogICAgICAgIHBob25lOiBnZXRFbGVtZW50VGV4dCgKICAgICAgICAgIGZpbmRDaGlsZEVsZW1lbnQoY29udGFjdEluZm9ybWF0aW9uLCAiQ29udGFjdFZvaWNlVGVsZXBob25lIikKICAgICAgICApLAogICAgICAgIGZheDogZ2V0RWxlbWVudFRleHQoCiAgICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KGNvbnRhY3RJbmZvcm1hdGlvbiwgIkNvbnRhY3RGYWNzaW1pbGVUZWxlcGhvbmUiKQogICAgICAgICksCiAgICAgICAgYWRkcmVzczogewogICAgICAgICAgZGVsaXZlcnlQb2ludDogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChhZGRyZXNzLCAiQWRkcmVzcyIpKSwKICAgICAgICAgIGNpdHk6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoYWRkcmVzcywgIkNpdHkiKSksCiAgICAgICAgICBhZG1pbmlzdHJhdGl2ZUFyZWE6IGdldEVsZW1lbnRUZXh0KAogICAgICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KGFkZHJlc3MsICJTdGF0ZU9yUHJvdmluY2UiKQogICAgICAgICAgKSwKICAgICAgICAgIHBvc3RhbENvZGU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoYWRkcmVzcywgIlBvc3RDb2RlIikpLAogICAgICAgICAgY291bnRyeTogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChhZGRyZXNzLCAiQ291bnRyeSIpKQogICAgICAgIH0sCiAgICAgICAgZW1haWw6IGdldEVsZW1lbnRUZXh0KAogICAgICAgICAgZmluZENoaWxkRWxlbWVudChjb250YWN0SW5mb3JtYXRpb24sICJDb250YWN0RWxlY3Ryb25pY01haWxBZGRyZXNzIikKICAgICAgICApCiAgICAgIH0KICAgIH07CiAgfQogIGZ1bmN0aW9uIHJlYWRQcm92aWRlckZyb21DYXBhYmlsaXRpZXMoY2FwYWJpbGl0aWVzRG9jKSB7CiAgICBjb25zdCBzZXJ2aWNlUHJvdmlkZXIgPSBmaW5kQ2hpbGRFbGVtZW50KAogICAgICBnZXRSb290RWxlbWVudChjYXBhYmlsaXRpZXNEb2MpLAogICAgICAiU2VydmljZVByb3ZpZGVyIgogICAgKTsKICAgIGNvbnN0IHNlcnZpY2VDb250YWN0ID0gZmluZENoaWxkRWxlbWVudChzZXJ2aWNlUHJvdmlkZXIsICJTZXJ2aWNlQ29udGFjdCIpOwogICAgY29uc3QgY29udGFjdEluZm8gPSBmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2VDb250YWN0LCAiQ29udGFjdEluZm8iKTsKICAgIGNvbnN0IHBob25lID0gZmluZENoaWxkRWxlbWVudChjb250YWN0SW5mbywgIlBob25lIik7CiAgICBjb25zdCBhZGRyZXNzID0gZmluZENoaWxkRWxlbWVudChjb250YWN0SW5mbywgIkFkZHJlc3MiKTsKICAgIHJldHVybiB7CiAgICAgIG5hbWU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZVByb3ZpZGVyLCAiUHJvdmlkZXJOYW1lIikpLAogICAgICBzaXRlOiBnZXRFbGVtZW50QXR0cmlidXRlKAogICAgICAgIGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZVByb3ZpZGVyLCAiUHJvdmlkZXJTaXRlIiksCiAgICAgICAgInhsaW5rOmhyZWYiCiAgICAgICksCiAgICAgIGNvbnRhY3Q6IHsKICAgICAgICBuYW1lOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2VDb250YWN0LCAiSW5kaXZpZHVhbE5hbWUiKSksCiAgICAgICAgcG9zaXRpb246IGdldEVsZW1lbnRUZXh0KAogICAgICAgICAgZmluZENoaWxkRWxlbWVudChzZXJ2aWNlQ29udGFjdCwgIlBvc2l0aW9uTmFtZSIpCiAgICAgICAgKSwKICAgICAgICBwaG9uZTogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChwaG9uZSwgIlZvaWNlIikpLAogICAgICAgIGZheDogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChwaG9uZSwgIkZhY3NpbWlsZSIpKSwKICAgICAgICBhZGRyZXNzOiB7CiAgICAgICAgICBkZWxpdmVyeVBvaW50OiBnZXRFbGVtZW50VGV4dCgKICAgICAgICAgICAgZmluZENoaWxkRWxlbWVudChhZGRyZXNzLCAiRGVsaXZlcnlQb2ludCIpCiAgICAgICAgICApLAogICAgICAgICAgY2l0eTogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChhZGRyZXNzLCAiQ2l0eSIpKSwKICAgICAgICAgIGFkbWluaXN0cmF0aXZlQXJlYTogZ2V0RWxlbWVudFRleHQoCiAgICAgICAgICAgIGZpbmRDaGlsZEVsZW1lbnQoYWRkcmVzcywgIkFkbWluaXN0cmF0aXZlQXJlYSIpCiAgICAgICAgICApLAogICAgICAgICAgcG9zdGFsQ29kZTogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChhZGRyZXNzLCAiUG9zdGFsQ29kZSIpKSwKICAgICAgICAgIGNvdW50cnk6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoYWRkcmVzcywgIkNvdW50cnkiKSkKICAgICAgICB9LAogICAgICAgIGVtYWlsOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KGFkZHJlc3MsICJFbGVjdHJvbmljTWFpbEFkZHJlc3MiKSkKICAgICAgfQogICAgfTsKICB9CiAgZnVuY3Rpb24gcmVhZE9wZXJhdGlvblVybHNGcm9tQ2FwYWJpbGl0aWVzKGNhcGFiaWxpdGllc0RvYykgewogICAgY29uc3QgdXJscyA9IHt9OwogICAgY29uc3QgY2FwYWJpbGl0aWVzID0gZ2V0Um9vdEVsZW1lbnQoY2FwYWJpbGl0aWVzRG9jKTsKICAgIGNvbnN0IG9wZXJhdGlvbnNNZXRhZGF0YSA9IGZpbmRDaGlsZEVsZW1lbnQoCiAgICAgIGNhcGFiaWxpdGllcywKICAgICAgIk9wZXJhdGlvbnNNZXRhZGF0YSIKICAgICk7CiAgICBpZiAob3BlcmF0aW9uc01ldGFkYXRhKSB7CiAgICAgIGZpbmRDaGlsZHJlbkVsZW1lbnQob3BlcmF0aW9uc01ldGFkYXRhLCAiT3BlcmF0aW9uIikuZm9yRWFjaCgKICAgICAgICAob3BlcmF0aW9uKSA9PiB7CiAgICAgICAgICBjb25zdCBuYW1lID0gZ2V0RWxlbWVudEF0dHJpYnV0ZShvcGVyYXRpb24sICJuYW1lIik7CiAgICAgICAgICB1cmxzW25hbWVdID0gcGFyc2VPcGVyYXRpb24xMTAob3BlcmF0aW9uKTsKICAgICAgICB9CiAgICAgICk7CiAgICB9IGVsc2UgewogICAgICBjb25zdCBjYXBhYmlsaXR5ID0gZmluZENoaWxkRWxlbWVudChjYXBhYmlsaXRpZXMsICJDYXBhYmlsaXR5Iik7CiAgICAgIGNvbnN0IHJlcXVlc3QgPSBmaW5kQ2hpbGRFbGVtZW50KGNhcGFiaWxpdHksICJSZXF1ZXN0Iik7CiAgICAgIGdldENoaWxkcmVuRWxlbWVudChyZXF1ZXN0KS5mb3JFYWNoKChvcGVyYXRpb24pID0+IHsKICAgICAgICBjb25zdCBuYW1lID0gc3RyaXBOYW1lc3BhY2UoZ2V0RWxlbWVudE5hbWUob3BlcmF0aW9uKSk7CiAgICAgICAgdXJsc1tuYW1lXSA9IHBhcnNlT3BlcmF0aW9uMTAwKG9wZXJhdGlvbik7CiAgICAgIH0pOwogICAgfQogICAgcmV0dXJuIHVybHM7CiAgfQogIGZ1bmN0aW9uIHJlYWRWZXJzaW9uRnJvbUNhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXNEb2MpIHsKICAgIHJldHVybiBnZXRSb290RWxlbWVudChjYXBhYmlsaXRpZXNEb2MpLmF0dHJpYnV0ZXNbInZlcnNpb24iXTsKICB9CiAgZnVuY3Rpb24gcmVhZE91dHB1dEZvcm1hdHNGcm9tQ2FwYWJpbGl0aWVzKGNhcGFiaWxpdGllc0RvYykgewogICAgY29uc3QgdmVyc2lvbiA9IHJlYWRWZXJzaW9uRnJvbUNhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXNEb2MpOwogICAgbGV0IG91dHB1dEZvcm1hdHM7CiAgICBpZiAodmVyc2lvbi5zdGFydHNXaXRoKCIxLjAiKSkgewogICAgICBjb25zdCBnZXRGZWF0dXJlID0gZmluZENoaWxkRWxlbWVudCgKICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KAogICAgICAgICAgZmluZENoaWxkRWxlbWVudChnZXRSb290RWxlbWVudChjYXBhYmlsaXRpZXNEb2MpLCAiQ2FwYWJpbGl0eSIpLAogICAgICAgICAgIlJlcXVlc3QiCiAgICAgICAgKSwKICAgICAgICAiR2V0RmVhdHVyZSIKICAgICAgKTsKICAgICAgb3V0cHV0Rm9ybWF0cyA9IGdldENoaWxkcmVuRWxlbWVudCgKICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KGdldEZlYXR1cmUsICJSZXN1bHRGb3JtYXQiKQogICAgICApLm1hcChnZXRFbGVtZW50TmFtZSk7CiAgICB9IGVsc2UgewogICAgICBjb25zdCBvcGVyYXRpb25zID0gZmluZENoaWxkRWxlbWVudCgKICAgICAgICBnZXRSb290RWxlbWVudChjYXBhYmlsaXRpZXNEb2MpLAogICAgICAgICJPcGVyYXRpb25zTWV0YWRhdGEiCiAgICAgICk7CiAgICAgIGNvbnN0IGdldEZlYXR1cmUgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KG9wZXJhdGlvbnMsICJPcGVyYXRpb24iKS5maW5kKAogICAgICAgIChlbCkgPT4gZ2V0RWxlbWVudEF0dHJpYnV0ZShlbCwgIm5hbWUiKSA9PT0gIkdldEZlYXR1cmUiCiAgICAgICk7CiAgICAgIGNvbnN0IHBhcmFtZXRlciA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoZ2V0RmVhdHVyZSwgIlBhcmFtZXRlciIpLmZpbmQoCiAgICAgICAgKGVsKSA9PiBnZXRFbGVtZW50QXR0cmlidXRlKGVsLCAibmFtZSIpID09PSAib3V0cHV0Rm9ybWF0IgogICAgICApOwogICAgICBvdXRwdXRGb3JtYXRzID0gZmluZENoaWxkcmVuRWxlbWVudChwYXJhbWV0ZXIsICJWYWx1ZSIsIHRydWUpLm1hcCgKICAgICAgICBnZXRFbGVtZW50VGV4dAogICAgICApOwogICAgfQogICAgcmV0dXJuIG91dHB1dEZvcm1hdHM7CiAgfQogIGZ1bmN0aW9uIHJlYWRJbmZvRnJvbUNhcGFiaWxpdGllcyQxKGNhcGFiaWxpdGllc0RvYykgewogICAgY29uc3QgdmVyc2lvbiA9IHJlYWRWZXJzaW9uRnJvbUNhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXNEb2MpOwogICAgY29uc3Qgc2VydmljZVRhZyA9IHZlcnNpb24uc3RhcnRzV2l0aCgiMS4wIikgPyAiU2VydmljZSIgOiAiU2VydmljZUlkZW50aWZpY2F0aW9uIjsKICAgIGNvbnN0IG5hbWVUYWcgPSB2ZXJzaW9uLnN0YXJ0c1dpdGgoIjEuMCIpID8gIk5hbWUiIDogIlNlcnZpY2VUeXBlIjsKICAgIGNvbnN0IHNlcnZpY2UgPSBmaW5kQ2hpbGRFbGVtZW50KGdldFJvb3RFbGVtZW50KGNhcGFiaWxpdGllc0RvYyksIHNlcnZpY2VUYWcpOwogICAgbGV0IGtleXdvcmRzOwogICAgaWYgKHZlcnNpb24uc3RhcnRzV2l0aCgiMS4wIikpIHsKICAgICAga2V5d29yZHMgPSBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2UsICJLZXl3b3JkcyIpKS5zcGxpdCgiLCIpLm1hcCgoa2V5d29yZCkgPT4ga2V5d29yZC50cmltKCkpOwogICAgfSBlbHNlIHsKICAgICAga2V5d29yZHMgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KAogICAgICAgIGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZSwgIktleXdvcmRzIiksCiAgICAgICAgIktleXdvcmQiCiAgICAgICkubWFwKGdldEVsZW1lbnRUZXh0KTsKICAgIH0KICAgIGxldCBwcm92aWRlcjsKICAgIGlmICh2ZXJzaW9uICE9PSAiMS4wLjAiKSB7CiAgICAgIHByb3ZpZGVyID0gcmVhZFByb3ZpZGVyRnJvbUNhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXNEb2MpOwogICAgfQogICAgcmV0dXJuIHsKICAgICAgdGl0bGU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZSwgIlRpdGxlIikpLAogICAgICBuYW1lOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2UsIG5hbWVUYWcpKSwKICAgICAgYWJzdHJhY3Q6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZSwgIkFic3RyYWN0IikpLAogICAgICBmZWVzOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2UsICJGZWVzIikpLAogICAgICBjb25zdHJhaW50czogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChzZXJ2aWNlLCAiQWNjZXNzQ29uc3RyYWludHMiKSksCiAgICAgIGtleXdvcmRzLAogICAgICBwcm92aWRlciwKICAgICAgb3V0cHV0Rm9ybWF0czogcmVhZE91dHB1dEZvcm1hdHNGcm9tQ2FwYWJpbGl0aWVzKGNhcGFiaWxpdGllc0RvYykKICAgIH07CiAgfQogIGZ1bmN0aW9uIHJlYWRGZWF0dXJlVHlwZXNGcm9tQ2FwYWJpbGl0aWVzKGNhcGFiaWxpdGllc0RvYykgewogICAgY29uc3QgdmVyc2lvbiA9IHJlYWRWZXJzaW9uRnJvbUNhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXNEb2MpOwogICAgY29uc3Qgb3V0cHV0Rm9ybWF0cyA9IHJlYWRPdXRwdXRGb3JtYXRzRnJvbUNhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXNEb2MpOwogICAgY29uc3QgY2FwYWJpbGl0eSA9IGZpbmRDaGlsZEVsZW1lbnQoCiAgICAgIGdldFJvb3RFbGVtZW50KGNhcGFiaWxpdGllc0RvYyksCiAgICAgICJGZWF0dXJlVHlwZUxpc3QiCiAgICApOwogICAgcmV0dXJuIGZpbmRDaGlsZHJlbkVsZW1lbnQoY2FwYWJpbGl0eSwgIkZlYXR1cmVUeXBlIikubWFwKAogICAgICAoZmVhdHVyZVR5cGVFbCkgPT4gcGFyc2VGZWF0dXJlVHlwZShmZWF0dXJlVHlwZUVsLCB2ZXJzaW9uLCBvdXRwdXRGb3JtYXRzKQogICAgKTsKICB9CiAgZnVuY3Rpb24gcGFyc2VPcGVyYXRpb24xMDAob3BlcmF0aW9uKSB7CiAgICBjb25zdCB1cmxzID0ge307CiAgICBjb25zdCBkY3BUeXBlID0gZmluZENoaWxkcmVuRWxlbWVudChvcGVyYXRpb24sICJEQ1BUeXBlIik7CiAgICBjb25zdCBodHRwID0gZGNwVHlwZS5mbGF0TWFwKChkKSA9PiBmaW5kQ2hpbGRyZW5FbGVtZW50KGQsICJIVFRQIikpOwogICAgY29uc3QgbWV0aG9kcyA9IGh0dHAuZmxhdE1hcCgoaCkgPT4gZ2V0Q2hpbGRyZW5FbGVtZW50KGgpKTsKICAgIG1ldGhvZHMuZm9yRWFjaCgobWV0aG9kKSA9PiB7CiAgICAgIGNvbnN0IG1ldGhvZE5hbWUgPSBzdHJpcE5hbWVzcGFjZShnZXRFbGVtZW50TmFtZShtZXRob2QpKTsKICAgICAgdXJsc1ttZXRob2ROYW1lXSA9IGdldEVsZW1lbnRBdHRyaWJ1dGUobWV0aG9kLCAib25saW5lUmVzb3VyY2UiKTsKICAgIH0pOwogICAgcmV0dXJuIHVybHM7CiAgfQogIGZ1bmN0aW9uIHBhcnNlT3BlcmF0aW9uMTEwKG9wZXJhdGlvbikgewogICAgY29uc3QgdXJscyA9IHt9OwogICAgY29uc3QgZGNwVHlwZSA9IGZpbmRDaGlsZHJlbkVsZW1lbnQob3BlcmF0aW9uLCAiRENQIik7CiAgICBjb25zdCBodHRwID0gZGNwVHlwZS5mbGF0TWFwKChkKSA9PiBmaW5kQ2hpbGRFbGVtZW50KGQsICJIVFRQIikpOwogICAgY29uc3QgbWV0aG9kcyA9IGh0dHAuZmxhdE1hcCgoaCkgPT4gZ2V0Q2hpbGRyZW5FbGVtZW50KGgpKTsKICAgIG1ldGhvZHMuZm9yRWFjaCgobWV0aG9kKSA9PiB7CiAgICAgIGNvbnN0IG1ldGhvZE5hbWUgPSBzdHJpcE5hbWVzcGFjZShnZXRFbGVtZW50TmFtZShtZXRob2QpKTsKICAgICAgdXJsc1ttZXRob2ROYW1lXSA9IGdldEVsZW1lbnRBdHRyaWJ1dGUobWV0aG9kLCAieGxpbms6aHJlZiIpOwogICAgfSk7CiAgICByZXR1cm4gdXJsczsKICB9CiAgZnVuY3Rpb24gcGFyc2VGZWF0dXJlVHlwZShmZWF0dXJlVHlwZUVsLCBzZXJ2aWNlVmVyc2lvbiwgZGVmYXVsdE91dHB1dEZvcm1hdHMpIHsKICAgIGNvbnN0IHNyc1RhZyA9IHNlcnZpY2VWZXJzaW9uLnN0YXJ0c1dpdGgoIjIuIikgPyAiQ1JTIiA6ICJTUlMiOwogICAgY29uc3QgZGVmYXVsdFNyc1RhZyA9IHNlcnZpY2VWZXJzaW9uLnN0YXJ0c1dpdGgoIjEuMCIpID8gIlNSUyIgOiBgRGVmYXVsdCR7c3JzVGFnfWA7CiAgICBmdW5jdGlvbiBwYXJzZUJCb3gxMDAoKSB7CiAgICAgIGNvbnN0IGJib3hFbCA9IGZpbmRDaGlsZEVsZW1lbnQoZmVhdHVyZVR5cGVFbCwgIkxhdExvbmdCb3VuZGluZ0JveCIpOwogICAgICByZXR1cm4gWyJtaW54IiwgIm1pbnkiLCAibWF4eCIsICJtYXh5Il0ubWFwKChuYW1lKSA9PiBnZXRFbGVtZW50QXR0cmlidXRlKGJib3hFbCwgbmFtZSkpLm1hcChwYXJzZUZsb2F0KTsKICAgIH0KICAgIGZ1bmN0aW9uIHBhcnNlQkJveDIoKSB7CiAgICAgIGNvbnN0IGJib3hFbCA9IGZpbmRDaGlsZEVsZW1lbnQoZmVhdHVyZVR5cGVFbCwgIldHUzg0Qm91bmRpbmdCb3giKTsKICAgICAgcmV0dXJuIFsiTG93ZXJDb3JuZXIiLCAiVXBwZXJDb3JuZXIiXS5tYXAoKGVsTmFtZSkgPT4gZmluZENoaWxkRWxlbWVudChiYm94RWwsIGVsTmFtZSkpLm1hcCgoY29ybmVyRWwpID0+IGdldEVsZW1lbnRUZXh0KGNvcm5lckVsKS5zcGxpdCgiICIpKS5yZWR1Y2UoKHByZXYsIGN1cnIpID0+IFsuLi5wcmV2LCAuLi5jdXJyXSkubWFwKHBhcnNlRmxvYXQpOwogICAgfQogICAgY29uc3Qgb3RoZXJDcnMgPSBzZXJ2aWNlVmVyc2lvbi5zdGFydHNXaXRoKCIxLjAiKSA/IFtdIDogZmluZENoaWxkcmVuRWxlbWVudChmZWF0dXJlVHlwZUVsLCBgT3RoZXIke3Nyc1RhZ31gKS5tYXAoZ2V0RWxlbWVudFRleHQpLm1hcChzaW1wbGlmeUVwc2dVcm4pOwogICAgY29uc3Qgb3V0cHV0Rm9ybWF0cyA9IHNlcnZpY2VWZXJzaW9uLnN0YXJ0c1dpdGgoIjEuMCIpID8gW10gOiBmaW5kQ2hpbGRyZW5FbGVtZW50KAogICAgICBmaW5kQ2hpbGRFbGVtZW50KGZlYXR1cmVUeXBlRWwsICJPdXRwdXRGb3JtYXRzIiksCiAgICAgICJGb3JtYXQiCiAgICApLm1hcChnZXRFbGVtZW50VGV4dCk7CiAgICBjb25zdCBrZXl3b3JkcyA9IHNlcnZpY2VWZXJzaW9uLnN0YXJ0c1dpdGgoIjEuMCIpID8gZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChmZWF0dXJlVHlwZUVsLCAiS2V5d29yZHMiKSkuc3BsaXQoIiwiKS5tYXAoKGtleXdvcmQpID0+IGtleXdvcmQudHJpbSgpKSA6IGZpbmRDaGlsZHJlbkVsZW1lbnQoCiAgICAgIGZpbmRDaGlsZEVsZW1lbnQoZmVhdHVyZVR5cGVFbCwgIktleXdvcmRzIiksCiAgICAgICJLZXl3b3JkIgogICAgKS5tYXAoZ2V0RWxlbWVudFRleHQpLmZpbHRlcigodiwgaSwgYXJyKSA9PiBhcnIuaW5kZXhPZih2KSA9PT0gaSk7CiAgICBjb25zdCBtZXRhZGF0YSA9IHNlcnZpY2VWZXJzaW9uID09PSAiMi4wLjAiID8gZmluZENoaWxkcmVuRWxlbWVudChmZWF0dXJlVHlwZUVsLCAiTWV0YWRhdGFVUkwiKS5tYXAoCiAgICAgIChtZXRhZGF0YVVybEVsKSA9PiAoewogICAgICAgIHVybDogZ2V0RWxlbWVudEF0dHJpYnV0ZShtZXRhZGF0YVVybEVsLCAieGxpbms6aHJlZiIpCiAgICAgIH0pCiAgICApIDogZmluZENoaWxkcmVuRWxlbWVudChmZWF0dXJlVHlwZUVsLCAiTWV0YWRhdGFVUkwiKS5tYXAoCiAgICAgIChtZXRhZGF0YVVybEVsKSA9PiAoewogICAgICAgIGZvcm1hdDogZ2V0RWxlbWVudEF0dHJpYnV0ZShtZXRhZGF0YVVybEVsLCAiZm9ybWF0IiksCiAgICAgICAgdHlwZTogZ2V0RWxlbWVudEF0dHJpYnV0ZShtZXRhZGF0YVVybEVsLCAidHlwZSIpLAogICAgICAgIHVybDogZ2V0RWxlbWVudFRleHQobWV0YWRhdGFVcmxFbCkudHJpbSgpCiAgICAgIH0pCiAgICApOwogICAgcmV0dXJuIHsKICAgICAgbmFtZTogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChmZWF0dXJlVHlwZUVsLCAiTmFtZSIpKSwKICAgICAgdGl0bGU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZmVhdHVyZVR5cGVFbCwgIlRpdGxlIikpLAogICAgICBhYnN0cmFjdDogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChmZWF0dXJlVHlwZUVsLCAiQWJzdHJhY3QiKSksCiAgICAgIGRlZmF1bHRDcnM6IHNpbXBsaWZ5RXBzZ1VybigKICAgICAgICBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KGZlYXR1cmVUeXBlRWwsIGRlZmF1bHRTcnNUYWcpKQogICAgICApLAogICAgICBvdGhlckNycywKICAgICAgb3V0cHV0Rm9ybWF0czogb3V0cHV0Rm9ybWF0cy5sZW5ndGggPiAwID8gb3V0cHV0Rm9ybWF0cyA6IGRlZmF1bHRPdXRwdXRGb3JtYXRzLAogICAgICBsYXRMb25Cb3VuZGluZ0JveDogc2VydmljZVZlcnNpb24uc3RhcnRzV2l0aCgiMS4wIikgPyBwYXJzZUJCb3gxMDAoKSA6IHBhcnNlQkJveDIoKSwKICAgICAga2V5d29yZHMsCiAgICAgIC4uLm1ldGFkYXRhLmxlbmd0aCAmJiB7IG1ldGFkYXRhIH0KICAgIH07CiAgfQogIGZ1bmN0aW9uIHBhcnNlQkJveCh4bWxFbGVtZW50KSB7CiAgICBjb25zdCByZXN1bHQgPSBbIkxvd2VyQ29ybmVyIiwgIlVwcGVyQ29ybmVyIl0ubWFwKChlbE5hbWUpID0+IGZpbmRDaGlsZEVsZW1lbnQoeG1sRWxlbWVudCwgZWxOYW1lKSkubWFwKChjb3JuZXJFbCkgPT4gZ2V0RWxlbWVudFRleHQoY29ybmVyRWwpLnNwbGl0KCIgIikpLnJlZHVjZSgocHJldiwgY3VycikgPT4gWy4uLnByZXYsIC4uLmN1cnJdKS5tYXAocGFyc2VGbG9hdCk7CiAgICBpZiAocmVzdWx0LnNvbWUoTnVtYmVyLmlzTmFOKSkKICAgICAgcmV0dXJuIG51bGw7CiAgICByZXR1cm4gcmVzdWx0OwogIH0KICBmdW5jdGlvbiByZWFkSW5mb0Zyb21DYXBhYmlsaXRpZXMoY2FwYWJpbGl0aWVzRG9jKSB7CiAgICBjb25zdCByb290RWwgPSBnZXRSb290RWxlbWVudChjYXBhYmlsaXRpZXNEb2MpOwogICAgY29uc3Qgc2VydmljZSA9IGZpbmRDaGlsZEVsZW1lbnQocm9vdEVsLCAiU2VydmljZUlkZW50aWZpY2F0aW9uIik7CiAgICBjb25zdCBrZXl3b3JkcyA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoCiAgICAgIGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZSwgIktleXdvcmRzIiksCiAgICAgICJLZXl3b3JkIgogICAgKS5tYXAoZ2V0RWxlbWVudFRleHQpOwogICAgY29uc3QgbWV0YWRhdGEgPSBmaW5kQ2hpbGRFbGVtZW50KHJvb3RFbCwgIk9wZXJhdGlvbnNNZXRhZGF0YSIpOwogICAgY29uc3QgZ2V0VGlsZU9wZXJhdGlvbiA9IGZpbmRDaGlsZHJlbkVsZW1lbnQobWV0YWRhdGEsICJPcGVyYXRpb24iKS5maW5kKAogICAgICAoZWwpID0+IGdldEVsZW1lbnRBdHRyaWJ1dGUoZWwsICJuYW1lIikgPT0gIkdldFRpbGUiCiAgICApOwogICAgY29uc3QgZ2V0VGlsZVVybHMgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KGdldFRpbGVPcGVyYXRpb24sICJHZXQiLCB0cnVlKS5yZWR1Y2UoCiAgICAgIChwcmV2LCBjdXJyKSA9PiB7CiAgICAgICAgY29uc3QgZW5jb2RpbmdUeXBlID0gZ2V0RWxlbWVudFRleHQoCiAgICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KGN1cnIsICJWYWx1ZSIsIHRydWUpCiAgICAgICAgKTsKICAgICAgICBjb25zdCB1cmwgPSBnZXRFbGVtZW50QXR0cmlidXRlKGN1cnIsICJ4bGluazpocmVmIik7CiAgICAgICAgaWYgKGVuY29kaW5nVHlwZS50b0xvd2VyQ2FzZSgpID09PSAicmVzdGZ1bCIpCiAgICAgICAgICByZXR1cm4geyAuLi5wcmV2LCByZXN0OiB1cmwgfTsKICAgICAgICByZXR1cm4geyAuLi5wcmV2LCBrdnA6IHVybCB9OwogICAgICB9LAogICAgICB7fQogICAgKTsKICAgIHJldHVybiB7CiAgICAgIHRpdGxlOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2UsICJUaXRsZSIpKSwKICAgICAgbmFtZTogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChzZXJ2aWNlLCAiU2VydmljZVR5cGUiKSksCiAgICAgIGFic3RyYWN0OiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KHNlcnZpY2UsICJBYnN0cmFjdCIpKSwKICAgICAgZmVlczogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChzZXJ2aWNlLCAiRmVlcyIpKSwKICAgICAgY29uc3RyYWludHM6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoc2VydmljZSwgIkFjY2Vzc0NvbnN0cmFpbnRzIikpLAogICAgICBrZXl3b3JkcywKICAgICAgcHJvdmlkZXI6IHJlYWRQcm92aWRlckZyb21DYXBhYmlsaXRpZXMoY2FwYWJpbGl0aWVzRG9jKSwKICAgICAgZ2V0VGlsZVVybHMKICAgIH07CiAgfQogIGZ1bmN0aW9uIHJlYWRNYXRyaXhTZXRzRnJvbUNhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXNEb2MpIHsKICAgIGZ1bmN0aW9uIHBhcnNlTWF0cml4U2V0KGVsZW1lbnQpIHsKICAgICAgY29uc3QgdG9wTGVmdCA9IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudCwgIlRvcExlZnRDb3JuZXIiKSkuc3BsaXQoIiAiKS5tYXAocGFyc2VGbG9hdCk7CiAgICAgIHJldHVybiB7CiAgICAgICAgaWRlbnRpZmllcjogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChlbGVtZW50LCAiSWRlbnRpZmllciIpKSwKICAgICAgICB0aWxlV2lkdGg6IHBhcnNlSW50KAogICAgICAgICAgZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChlbGVtZW50LCAiVGlsZVdpZHRoIikpCiAgICAgICAgKSwKICAgICAgICB0aWxlSGVpZ2h0OiBwYXJzZUludCgKICAgICAgICAgIGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudCwgIlRpbGVIZWlnaHQiKSkKICAgICAgICApLAogICAgICAgIG1hdHJpeFdpZHRoOiBwYXJzZUludCgKICAgICAgICAgIGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudCwgIk1hdHJpeFdpZHRoIikpCiAgICAgICAgKSwKICAgICAgICBtYXRyaXhIZWlnaHQ6IHBhcnNlSW50KAogICAgICAgICAgZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChlbGVtZW50LCAiTWF0cml4SGVpZ2h0IikpCiAgICAgICAgKSwKICAgICAgICBzY2FsZURlbm9taW5hdG9yOiBwYXJzZUZsb2F0KAogICAgICAgICAgZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChlbGVtZW50LCAiU2NhbGVEZW5vbWluYXRvciIpKQogICAgICAgICksCiAgICAgICAgdG9wTGVmdAogICAgICB9OwogICAgfQogICAgY29uc3QgY29udGVudHMgPSBmaW5kQ2hpbGRFbGVtZW50KAogICAgICBnZXRSb290RWxlbWVudChjYXBhYmlsaXRpZXNEb2MpLAogICAgICAiQ29udGVudHMiCiAgICApOwogICAgY29uc3QgbWF0cml4U2V0cyA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoY29udGVudHMsICJUaWxlTWF0cml4U2V0Iik7CiAgICByZXR1cm4gbWF0cml4U2V0cy5tYXAoKGVsZW1lbnQpID0+IHsKICAgICAgY29uc3Qgd2VsbEtub3duU2NhbGVTZXQgPSBnZXRFbGVtZW50VGV4dCgKICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KGVsZW1lbnQsICJXZWxsS25vd25TY2FsZVNldCIpCiAgICAgICk7CiAgICAgIGNvbnN0IGJvdW5kaW5nQm94ID0gcGFyc2VCQm94KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudCwgIkJvdW5kaW5nQm94IikpOwogICAgICByZXR1cm4gewogICAgICAgIGlkZW50aWZpZXI6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudCwgIklkZW50aWZpZXIiKSksCiAgICAgICAgY3JzOiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KGVsZW1lbnQsICJTdXBwb3J0ZWRDUlMiKSksCiAgICAgICAgdGlsZU1hdHJpY2VzOiBmaW5kQ2hpbGRyZW5FbGVtZW50KGVsZW1lbnQsICJUaWxlTWF0cml4IikubWFwKAogICAgICAgICAgcGFyc2VNYXRyaXhTZXQKICAgICAgICApLAogICAgICAgIC4uLmJvdW5kaW5nQm94ICYmIHsgYm91bmRpbmdCb3ggfSwKICAgICAgICAuLi53ZWxsS25vd25TY2FsZVNldCAmJiB7IHdlbGxLbm93blNjYWxlU2V0IH0KICAgICAgfTsKICAgIH0pOwogIH0KICBmdW5jdGlvbiByZWFkTGF5ZXJzRnJvbUNhcGFiaWxpdGllcyhjYXBhYmlsaXRpZXNEb2MpIHsKICAgIGNvbnN0IHJvb3RFbCA9IGdldFJvb3RFbGVtZW50KGNhcGFiaWxpdGllc0RvYyk7CiAgICBjb25zdCBjb250ZW50c0VsID0gZmluZENoaWxkRWxlbWVudChyb290RWwsICJDb250ZW50cyIpOwogICAgZnVuY3Rpb24gZ2V0TWF0cml4U2V0Q3JzKGNvbnRlbnRzRWwyLCBpZGVudGlmaWVyKSB7CiAgICAgIGNvbnN0IG1hdHJpeFNldCA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoY29udGVudHNFbDIsICJUaWxlTWF0cml4U2V0IikuZmluZCgKICAgICAgICAobWF0cml4U2V0RWwpID0+IHsKICAgICAgICAgIGNvbnN0IGlkZW50aWZpZXJFbCA9IGZpbmRDaGlsZEVsZW1lbnQobWF0cml4U2V0RWwsICJJZGVudGlmaWVyIik7CiAgICAgICAgICByZXR1cm4gZ2V0RWxlbWVudFRleHQoaWRlbnRpZmllckVsKSA9PT0gaWRlbnRpZmllcjsKICAgICAgICB9CiAgICAgICk7CiAgICAgIHJldHVybiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KG1hdHJpeFNldCwgIlN1cHBvcnRlZENSUyIpKTsKICAgIH0KICAgIGZ1bmN0aW9uIHBhcnNlTWF0cml4U2V0TGluayhlbGVtZW50KSB7CiAgICAgIGNvbnN0IGlkZW50aWZpZXIgPSBnZXRFbGVtZW50VGV4dCgKICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KGVsZW1lbnQsICJUaWxlTWF0cml4U2V0IikKICAgICAgKTsKICAgICAgY29uc3QgY3JzID0gZ2V0TWF0cml4U2V0Q3JzKGNvbnRlbnRzRWwsIGlkZW50aWZpZXIpOwogICAgICByZXR1cm4gewogICAgICAgIGlkZW50aWZpZXIsCiAgICAgICAgY3JzLAogICAgICAgIGxpbWl0czogZmluZENoaWxkcmVuRWxlbWVudChlbGVtZW50LCAiVGlsZU1hdHJpeExpbWl0cyIsIHRydWUpLm1hcCgKICAgICAgICAgIChlbGVtZW50MikgPT4gKHsKICAgICAgICAgICAgdGlsZU1hdHJpeDogZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChlbGVtZW50MiwgIlRpbGVNYXRyaXgiKSksCiAgICAgICAgICAgIG1pblRpbGVSb3c6IHBhcnNlSW50KAogICAgICAgICAgICAgIGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudDIsICJNaW5UaWxlUm93IikpCiAgICAgICAgICAgICksCiAgICAgICAgICAgIG1pblRpbGVDb2w6IHBhcnNlSW50KAogICAgICAgICAgICAgIGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudDIsICJNaW5UaWxlQ29sIikpCiAgICAgICAgICAgICksCiAgICAgICAgICAgIG1heFRpbGVSb3c6IHBhcnNlSW50KAogICAgICAgICAgICAgIGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudDIsICJNYXhUaWxlUm93IikpCiAgICAgICAgICAgICksCiAgICAgICAgICAgIG1heFRpbGVDb2w6IHBhcnNlSW50KAogICAgICAgICAgICAgIGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudDIsICJNYXhUaWxlQ29sIikpCiAgICAgICAgICAgICkKICAgICAgICAgIH0pCiAgICAgICAgKQogICAgICB9OwogICAgfQogICAgY29uc3QgZ2V0VGlsZU9wZXJhdGlvbiA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoCiAgICAgIGZpbmRDaGlsZEVsZW1lbnQocm9vdEVsLCAiT3BlcmF0aW9uc01ldGFkYXRhIiksCiAgICAgICJPcGVyYXRpb24iCiAgICApLmZpbmQoKGVsKSA9PiBnZXRFbGVtZW50QXR0cmlidXRlKGVsLCAibmFtZSIpID09ICJHZXRUaWxlIik7CiAgICBjb25zdCBnZXRLdnBFbHQgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KGdldFRpbGVPcGVyYXRpb24sICJHZXQiLCB0cnVlKS5maWx0ZXIoCiAgICAgIChlbHQpID0+IHsKICAgICAgICBjb25zdCBlbmNvZGluZ1R5cGUgPSBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KGVsdCwgIlZhbHVlIiwgdHJ1ZSkpOwogICAgICAgIHJldHVybiBlbmNvZGluZ1R5cGUudG9Mb3dlckNhc2UoKSA9PT0gImt2cCI7CiAgICAgIH0KICAgIClbMF07CiAgICBjb25zdCBnZXRLdnBVcmwgPSBnZXRLdnBFbHQgPyBnZXRFbGVtZW50QXR0cmlidXRlKGdldEt2cEVsdCwgInhsaW5rOmhyZWYiKSA6ICIiOwogICAgY29uc3QgY29udGVudHMgPSBmaW5kQ2hpbGRFbGVtZW50KHJvb3RFbCwgIkNvbnRlbnRzIik7CiAgICBjb25zdCBsYXllcnMgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KGNvbnRlbnRzLCAiTGF5ZXIiKTsKICAgIHJldHVybiBsYXllcnMubWFwKChlbGVtZW50KSA9PiB7CiAgICAgIGNvbnN0IGxhdExvbkJvdW5kaW5nQm94ID0gcGFyc2VCQm94KAogICAgICAgIGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudCwgIldHUzg0Qm91bmRpbmdCb3giKQogICAgICApOwogICAgICBsZXQgZGVmYXVsdFN0eWxlID0gIiI7CiAgICAgIGNvbnN0IHN0eWxlcyA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoZWxlbWVudCwgIlN0eWxlIikubWFwKChlbGVtZW50MikgPT4gewogICAgICAgIGNvbnN0IGxlZ2VuZFVybCA9IGdldEVsZW1lbnRBdHRyaWJ1dGUoCiAgICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KGVsZW1lbnQyLCAiTGVnZW5kVVJMIiksCiAgICAgICAgICAieGxpbms6aHJlZiIKICAgICAgICApOwogICAgICAgIGNvbnN0IGFic3RyYWN0ID0gZ2V0RWxlbWVudFRleHQoZmluZENoaWxkRWxlbWVudChlbGVtZW50MiwgIkFic3RyYWN0IikpOwogICAgICAgIGNvbnN0IHN0eWxlID0gewogICAgICAgICAgdGl0bGU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudDIsICJUaXRsZSIpKSwKICAgICAgICAgIG5hbWU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudDIsICJJZGVudGlmaWVyIikpLAogICAgICAgICAgLi4uYWJzdHJhY3QgJiYgeyBhYnN0cmFjdCB9LAogICAgICAgICAgLi4ubGVnZW5kVXJsICYmIHsgbGVnZW5kVXJsIH0KICAgICAgICB9OwogICAgICAgIGlmIChnZXRFbGVtZW50QXR0cmlidXRlKGVsZW1lbnQyLCAiaXNEZWZhdWx0IikgPT09ICJ0cnVlIikgewogICAgICAgICAgZGVmYXVsdFN0eWxlID0gc3R5bGUubmFtZTsKICAgICAgICB9CiAgICAgICAgcmV0dXJuIHN0eWxlOwogICAgICB9KTsKICAgICAgY29uc3Qgb3V0cHV0Rm9ybWF0cyA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoZWxlbWVudCwgIkZvcm1hdCIpLm1hcCgKICAgICAgICBnZXRFbGVtZW50VGV4dAogICAgICApOwogICAgICBjb25zdCByZXNvdXJjZUxpbmtzID0gZmluZENoaWxkcmVuRWxlbWVudCgKICAgICAgICBlbGVtZW50LAogICAgICAgICJSZXNvdXJjZVVSTCIKICAgICAgKS5maWx0ZXIoCiAgICAgICAgKGVsZW1lbnQyKSA9PiBnZXRFbGVtZW50QXR0cmlidXRlKGVsZW1lbnQyLCAicmVzb3VyY2VUeXBlIikgPT09ICJ0aWxlIgogICAgICApLm1hcCgoZWxlbWVudDIpID0+IHsKICAgICAgICBjb25zdCBmb3JtYXQgPSBnZXRFbGVtZW50QXR0cmlidXRlKGVsZW1lbnQyLCAiZm9ybWF0Iik7CiAgICAgICAgY29uc3QgdXJsID0gZ2V0RWxlbWVudEF0dHJpYnV0ZShlbGVtZW50MiwgInRlbXBsYXRlIik7CiAgICAgICAgcmV0dXJuIHsgZm9ybWF0LCB1cmwsIGVuY29kaW5nOiAiUkVTVCIgfTsKICAgICAgfSk7CiAgICAgIGlmIChnZXRLdnBVcmwpIHsKICAgICAgICByZXNvdXJjZUxpbmtzLnB1c2goCiAgICAgICAgICAuLi5vdXRwdXRGb3JtYXRzLm1hcCgoZm9ybWF0KSA9PiAoewogICAgICAgICAgICBlbmNvZGluZzogIktWUCIsCiAgICAgICAgICAgIHVybDogZ2V0S3ZwVXJsLAogICAgICAgICAgICBmb3JtYXQKICAgICAgICAgIH0pKQogICAgICAgICk7CiAgICAgIH0KICAgICAgY29uc3QgbWF0cml4U2V0cyA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoZWxlbWVudCwgIlRpbGVNYXRyaXhTZXRMaW5rIikubWFwKAogICAgICAgIHBhcnNlTWF0cml4U2V0TGluawogICAgICApOwogICAgICBjb25zdCBkaW1lbnNpb25zID0gZmluZENoaWxkcmVuRWxlbWVudChlbGVtZW50LCAiRGltZW5zaW9uIikubWFwKAogICAgICAgIChlbGVtZW50MikgPT4gewogICAgICAgICAgY29uc3QgaWRlbnRpZmllciA9IGdldEVsZW1lbnRUZXh0KAogICAgICAgICAgICBmaW5kQ2hpbGRFbGVtZW50KGVsZW1lbnQyLCAiSWRlbnRpZmllciIpCiAgICAgICAgICApOwogICAgICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gZ2V0RWxlbWVudFRleHQoCiAgICAgICAgICAgIGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudDIsICJEZWZhdWx0IikKICAgICAgICAgICk7CiAgICAgICAgICBjb25zdCB2YWx1ZXMgPSBmaW5kQ2hpbGRyZW5FbGVtZW50KGVsZW1lbnQyLCAiVmFsdWVzIikubWFwKAogICAgICAgICAgICBnZXRFbGVtZW50VGV4dAogICAgICAgICAgKTsKICAgICAgICAgIHJldHVybiB7IGlkZW50aWZpZXIsIGRlZmF1bHRWYWx1ZSwgdmFsdWVzIH07CiAgICAgICAgfQogICAgICApOwogICAgICByZXR1cm4gewogICAgICAgIG5hbWU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudCwgIklkZW50aWZpZXIiKSksCiAgICAgICAgdGl0bGU6IGdldEVsZW1lbnRUZXh0KGZpbmRDaGlsZEVsZW1lbnQoZWxlbWVudCwgIlRpdGxlIikpLAogICAgICAgIGFic3RyYWN0OiBnZXRFbGVtZW50VGV4dChmaW5kQ2hpbGRFbGVtZW50KGVsZW1lbnQsICJBYnN0cmFjdCIpKSwKICAgICAgICBzdHlsZXMsCiAgICAgICAgcmVzb3VyY2VMaW5rcywKICAgICAgICBtYXRyaXhTZXRzLAogICAgICAgIGRlZmF1bHRTdHlsZSwKICAgICAgICAuLi5sYXRMb25Cb3VuZGluZ0JveCAmJiB7IGxhdExvbkJvdW5kaW5nQm94IH0sCiAgICAgICAgLi4uZGltZW5zaW9ucyAmJiB7IGRpbWVuc2lvbnMgfQogICAgICB9OwogICAgfSk7CiAgfQogIGZ1bmN0aW9uIHBhcnNlRmVhdHVyZVByb3BzKGdldEZlYXR1cmVzRG9jLCBmZWF0dXJlVHlwZUZ1bGwsIHNlcnZpY2VWZXJzaW9uKSB7CiAgICBjb25zdCBjb2xsZWN0aW9uID0gZ2V0Um9vdEVsZW1lbnQoZ2V0RmVhdHVyZXNEb2MpOwogICAgbGV0IG1lbWJlcnM7CiAgICBpZiAoc2VydmljZVZlcnNpb24uc3RhcnRzV2l0aCgiMi4wIikpIHsKICAgICAgbWVtYmVycyA9IGZpbmRDaGlsZHJlbkVsZW1lbnQoY29sbGVjdGlvbiwgIm1lbWJlciIpLm1hcCgKICAgICAgICAocGFyZW50KSA9PiBnZXRDaGlsZHJlbkVsZW1lbnQocGFyZW50KVswXQogICAgICApOwogICAgfSBlbHNlIHsKICAgICAgY29uc3QgbWVtYmVyc1Jvb3QgPSBmaW5kQ2hpbGRFbGVtZW50KGNvbGxlY3Rpb24sICJmZWF0dXJlTWVtYmVycyIpOwogICAgICBtZW1iZXJzID0gbWVtYmVyc1Jvb3QgPyBnZXRDaGlsZHJlbkVsZW1lbnQobWVtYmVyc1Jvb3QpIDogZmluZENoaWxkcmVuRWxlbWVudChjb2xsZWN0aW9uLCAiZmVhdHVyZU1lbWJlciIpLm1hcCgKICAgICAgICAocGFyZW50KSA9PiBnZXRDaGlsZHJlbkVsZW1lbnQocGFyZW50KVswXQogICAgICApOwogICAgfQogICAgY29uc3QgaWRBdHRyID0gc2VydmljZVZlcnNpb24gPT09ICIxLjAuMCIgPyAiZmlkIiA6ICJnbWw6aWQiOwogICAgZnVuY3Rpb24gaXNFbGVtZW50UHJvcGVydHkocHJvcE5hbWUpIHsKICAgICAgcmV0dXJuIHByb3BOYW1lIGluIGZlYXR1cmVUeXBlRnVsbC5wcm9wZXJ0aWVzOwogICAgfQogICAgZnVuY3Rpb24gcGFyc2VFbGVtZW50UHJvcGVydHlWYWx1ZShwcm9wTmFtZSwgdmFsdWVBc1N0cmluZykgewogICAgICBjb25zdCB0eXBlID0gZmVhdHVyZVR5cGVGdWxsLnByb3BlcnRpZXNbcHJvcE5hbWVdOwogICAgICBzd2l0Y2ggKHR5cGUpIHsKICAgICAgICBjYXNlICJpbnRlZ2VyIjoKICAgICAgICAgIHJldHVybiBwYXJzZUludCh2YWx1ZUFzU3RyaW5nKTsKICAgICAgICBjYXNlICJmbG9hdCI6CiAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZUFzU3RyaW5nKTsKICAgICAgICBjYXNlICJib29sZWFuIjoKICAgICAgICAgIHJldHVybiB2YWx1ZUFzU3RyaW5nID09PSAidHJ1ZSI7CiAgICAgICAgZGVmYXVsdDoKICAgICAgICAgIHJldHVybiB2YWx1ZUFzU3RyaW5nOwogICAgICB9CiAgICB9CiAgICBmdW5jdGlvbiBnZXRQcm9wZXJ0aWVzKG1lbWJlckVsKSB7CiAgICAgIHJldHVybiBnZXRDaGlsZHJlbkVsZW1lbnQobWVtYmVyRWwpLmZpbHRlcigoZWwpID0+IGlzRWxlbWVudFByb3BlcnR5KHN0cmlwTmFtZXNwYWNlKGdldEVsZW1lbnROYW1lKGVsKSkpKS5yZWR1Y2UoKHByZXYsIGN1cnIpID0+IHsKICAgICAgICBjb25zdCBwcm9wTmFtZSA9IHN0cmlwTmFtZXNwYWNlKGdldEVsZW1lbnROYW1lKGN1cnIpKTsKICAgICAgICByZXR1cm4gewogICAgICAgICAgLi4ucHJldiwKICAgICAgICAgIFtwcm9wTmFtZV06IHBhcnNlRWxlbWVudFByb3BlcnR5VmFsdWUocHJvcE5hbWUsIGdldEVsZW1lbnRUZXh0KGN1cnIpKQogICAgICAgIH07CiAgICAgIH0sIHt9KTsKICAgIH0KICAgIHJldHVybiBtZW1iZXJzLm1hcCgoZWwpID0+ICh7CiAgICAgIGlkOiBnZXRFbGVtZW50QXR0cmlidXRlKGVsLCBpZEF0dHIpLAogICAgICBwcm9wZXJ0aWVzOiBnZXRQcm9wZXJ0aWVzKGVsKQogICAgfSkpOwogIH0KICBmdW5jdGlvbiBjb21wdXRlRmVhdHVyZVByb3BzRGV0YWlscyhmZWF0dXJlc1dpdGhQcm9wcykgewogICAgcmV0dXJuIGZlYXR1cmVzV2l0aFByb3BzLnJlZHVjZSgocHJldiwgY3VycikgPT4gewogICAgICBmb3IgKGNvbnN0IHByb3BOYW1lIGluIGN1cnIucHJvcGVydGllcykgewogICAgICAgIGNvbnN0IHByb3BWYWx1ZSA9IGN1cnIucHJvcGVydGllc1twcm9wTmFtZV07CiAgICAgICAgaWYgKCEocHJvcE5hbWUgaW4gcHJldikpIHsKICAgICAgICAgIHByZXZbcHJvcE5hbWVdID0geyB1bmlxdWVWYWx1ZXM6IFtdIH07CiAgICAgICAgfQogICAgICAgIGNvbnN0IHVuaXF1ZVZhbHVlID0gcHJldltwcm9wTmFtZV0udW5pcXVlVmFsdWVzLmZpbmQoCiAgICAgICAgICAodikgPT4gdi52YWx1ZSA9PT0gcHJvcFZhbHVlCiAgICAgICAgKTsKICAgICAgICBpZiAodW5pcXVlVmFsdWUpCiAgICAgICAgICB1bmlxdWVWYWx1ZS5jb3VudCsrOwogICAgICAgIGVsc2UKICAgICAgICAgIHByZXZbcHJvcE5hbWVdLnVuaXF1ZVZhbHVlcy5wdXNoKHsgdmFsdWU6IHByb3BWYWx1ZSwgY291bnQ6IDEgfSk7CiAgICAgIH0KICAgICAgcmV0dXJuIHByZXY7CiAgICB9LCB7fSk7CiAgfQogIGZ1bmN0aW9uIGdlbmVyYXRlR2V0RmVhdHVyZVVybChzZXJ2aWNlVXJsLCB2ZXJzaW9uLCBmZWF0dXJlVHlwZSwgb3V0cHV0Rm9ybWF0LCBtYXhGZWF0dXJlcywgYXR0cmlidXRlcywgaGl0c09ubHksIG91dHB1dENycywgZXh0ZW50LCBleHRlbnRDcnMsIHN0YXJ0SW5kZXgsIHNvcnRCeSkgewogICAgY29uc3QgdHlwZVBhcmFtID0gdmVyc2lvbiA9PT0gIjIuMC4wIiA/ICJUWVBFTkFNRVMiIDogIlRZUEVOQU1FIjsKICAgIGNvbnN0IGNvdW50UGFyYW0gPSB2ZXJzaW9uID09PSAiMi4wLjAiID8gIkNPVU5UIiA6ICJNQVhGRUFUVVJFUyI7CiAgICBjb25zdCBuZXdQYXJhbXMgPSB7CiAgICAgIFNFUlZJQ0U6ICJXRlMiLAogICAgICBSRVFVRVNUOiAiR2V0RmVhdHVyZSIsCiAgICAgIFZFUlNJT046IHZlcnNpb24sCiAgICAgIFt0eXBlUGFyYW1dOiBmZWF0dXJlVHlwZQogICAgfTsKICAgIGlmIChvdXRwdXRGb3JtYXQgIT09IHZvaWQgMCkKICAgICAgbmV3UGFyYW1zLk9VVFBVVEZPUk1BVCA9IG91dHB1dEZvcm1hdDsKICAgIGlmIChhdHRyaWJ1dGVzICE9PSB2b2lkIDApCiAgICAgIG5ld1BhcmFtcy5QUk9QRVJUWU5BTUUgPSBhdHRyaWJ1dGVzLmpvaW4oIiwiKTsKICAgIGlmIChoaXRzT25seSkgewogICAgICBuZXdQYXJhbXMuUkVTVUxUVFlQRSA9ICJoaXRzIjsKICAgICAgbmV3UGFyYW1zW2NvdW50UGFyYW1dID0gIjEiOwogICAgfSBlbHNlIGlmIChtYXhGZWF0dXJlcyAhPT0gdm9pZCAwKQogICAgICBuZXdQYXJhbXNbY291bnRQYXJhbV0gPSBtYXhGZWF0dXJlcy50b1N0cmluZygxMCk7CiAgICBpZiAob3V0cHV0Q3JzKSB7CiAgICAgIG5ld1BhcmFtcy5TUlNOQU1FID0gb3V0cHV0Q3JzOwogICAgfQogICAgaWYgKGV4dGVudCkgewogICAgICBjb25zdCBleHRlbnRKb2luZWQgPSBleHRlbnQuam9pbigiLCIpOwogICAgICBuZXdQYXJhbXMuQkJPWCA9IGV4dGVudENycyA/IGAke2V4dGVudEpvaW5lZH0sJHtleHRlbnRDcnN9YCA6IGV4dGVudEpvaW5lZDsKICAgIH0KICAgIGlmIChzdGFydEluZGV4KSB7CiAgICAgIG5ld1BhcmFtcy5TVEFSVElOREVYID0gc3RhcnRJbmRleC50b1N0cmluZygxMCk7CiAgICB9CiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHNldFF1ZXJ5UGFyYW1zKHNlcnZpY2VVcmwsIG5ld1BhcmFtcykpOwogICAgaWYgKEFycmF5LmlzQXJyYXkoc29ydEJ5KSAmJiBzb3J0QnkubGVuZ3RoID4gMCkgewogICAgICBjb25zdCBzb3J0cyA9IHNvcnRCeS5tYXAoKGZpZWxkU29ydCkgPT4gYCR7ZmllbGRTb3J0WzFdfSAke2ZpZWxkU29ydFswXX1gKS5qb2luKCIsIik7CiAgICAgIHVybC5zZWFyY2hQYXJhbXMuc2V0KCJTT1JUQlkiLCBzb3J0cyk7CiAgICB9CiAgICByZXR1cm4gdXJsLnRvU3RyaW5nKCk7CiAgfQogIGFkZFRhc2tIYW5kbGVyKAogICAgInBhcnNlV21zQ2FwYWJpbGl0aWVzIiwKICAgIGdsb2JhbFRoaXMsCiAgICAoeyB1cmwgfSkgPT4gcXVlcnlYbWxEb2N1bWVudCh1cmwpLnRoZW4oKHhtbERvYykgPT4gY2hlY2soeG1sRG9jLCB1cmwpKS50aGVuKCh4bWxEb2MpID0+ICh7CiAgICAgIGluZm86IHJlYWRJbmZvRnJvbUNhcGFiaWxpdGllcyQyKHhtbERvYyksCiAgICAgIGxheWVyczogcmVhZExheWVyc0Zyb21DYXBhYmlsaXRpZXMkMSh4bWxEb2MpLAogICAgICB1cmw6IHJlYWRPcGVyYXRpb25VcmxzRnJvbUNhcGFiaWxpdGllcyQxKHhtbERvYyksCiAgICAgIHZlcnNpb246IHJlYWRWZXJzaW9uRnJvbUNhcGFiaWxpdGllcyQxKHhtbERvYykKICAgIH0pKQogICk7CiAgYWRkVGFza0hhbmRsZXIoCiAgICAicGFyc2VXZnNDYXBhYmlsaXRpZXMiLAogICAgZ2xvYmFsVGhpcywKICAgICh7IHVybCB9KSA9PiBxdWVyeVhtbERvY3VtZW50KHVybCkudGhlbigoeG1sRG9jKSA9PiBjaGVjayh4bWxEb2MsIHVybCkpLnRoZW4oKHhtbERvYykgPT4gKHsKICAgICAgaW5mbzogcmVhZEluZm9Gcm9tQ2FwYWJpbGl0aWVzJDEoeG1sRG9jKSwKICAgICAgZmVhdHVyZVR5cGVzOiByZWFkRmVhdHVyZVR5cGVzRnJvbUNhcGFiaWxpdGllcyh4bWxEb2MpLAogICAgICB1cmw6IHJlYWRPcGVyYXRpb25VcmxzRnJvbUNhcGFiaWxpdGllcyh4bWxEb2MpLAogICAgICB2ZXJzaW9uOiByZWFkVmVyc2lvbkZyb21DYXBhYmlsaXRpZXMoeG1sRG9jKQogICAgfSkpCiAgKTsKICBhZGRUYXNrSGFuZGxlcigKICAgICJxdWVyeVdmc0ZlYXR1cmVUeXBlRGV0YWlscyIsCiAgICBnbG9iYWxUaGlzLAogICAgKHsKICAgICAgdXJsLAogICAgICBzZXJ2aWNlVmVyc2lvbiwKICAgICAgZmVhdHVyZVR5cGVGdWxsCiAgICB9KSA9PiB7CiAgICAgIGNvbnN0IGdldEZlYXR1cmVVcmwgPSBnZW5lcmF0ZUdldEZlYXR1cmVVcmwoCiAgICAgICAgdXJsLAogICAgICAgIHNlcnZpY2VWZXJzaW9uLAogICAgICAgIGZlYXR1cmVUeXBlRnVsbC5uYW1lLAogICAgICAgIHZvaWQgMCwKICAgICAgICB2b2lkIDAsCiAgICAgICAgT2JqZWN0LmtleXMoZmVhdHVyZVR5cGVGdWxsLnByb3BlcnRpZXMpCiAgICAgICk7CiAgICAgIHJldHVybiBxdWVyeVhtbERvY3VtZW50KGdldEZlYXR1cmVVcmwpLnRoZW4oKGdldEZlYXR1cmVEb2MpID0+ICh7CiAgICAgICAgcHJvcHM6IGNvbXB1dGVGZWF0dXJlUHJvcHNEZXRhaWxzKAogICAgICAgICAgcGFyc2VGZWF0dXJlUHJvcHMoZ2V0RmVhdHVyZURvYywgZmVhdHVyZVR5cGVGdWxsLCBzZXJ2aWNlVmVyc2lvbikKICAgICAgICApCiAgICAgIH0pKTsKICAgIH0KICApOwogIGFkZFRhc2tIYW5kbGVyKAogICAgInVwZGF0ZUZldGNoT3B0aW9ucyIsCiAgICBnbG9iYWxUaGlzLAogICAgKHsgb3B0aW9ucyB9KSA9PiB7CiAgICAgIHNldEZldGNoT3B0aW9ucyhvcHRpb25zKTsKICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7fSk7CiAgICB9CiAgKTsKICBhZGRUYXNrSGFuZGxlcigKICAgICJwYXJzZVdtdHNDYXBhYmlsaXRpZXMiLAogICAgZ2xvYmFsVGhpcywKICAgICh7IHVybCB9KSA9PiBxdWVyeVhtbERvY3VtZW50KHVybCkudGhlbigoeG1sRG9jKSA9PiBjaGVjayh4bWxEb2MsIHVybCkpLnRoZW4oKHhtbERvYykgPT4gKHsKICAgICAgaW5mbzogcmVhZEluZm9Gcm9tQ2FwYWJpbGl0aWVzKHhtbERvYyksCiAgICAgIGxheWVyczogcmVhZExheWVyc0Zyb21DYXBhYmlsaXRpZXMoeG1sRG9jKSwKICAgICAgbWF0cml4U2V0czogcmVhZE1hdHJpeFNldHNGcm9tQ2FwYWJpbGl0aWVzKHhtbERvYykKICAgIH0pKQogICk7Cn0pKCk7Ci8vIyBzb3VyY2VNYXBwaW5nVVJMPXdvcmtlci1MRGtNT3gwZC5qcy5tYXAK", { name: e?.name });
	} finally {
		t && (window.URL || window.webkitURL).revokeObjectURL(t);
	}
}
var ce = !1, le;
function z() {
	return ce ? null : (le ||= new se(), le);
}
function ue(e) {
	return R("parseWmsCapabilities", z(), { url: e });
}
function de(e) {
	return R("parseWfsCapabilities", z(), { url: e });
}
function fe(e, t, n) {
	return R("queryWfsFeatureTypeDetails", z(), {
		url: e,
		serviceVersion: t,
		featureTypeFull: n
	});
}
function pe(e) {
	return R("parseWmtsCapabilities", z(), { url: e });
}
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/shared/xml-utils.js
var me = (/* @__PURE__ */ e(((e, t) => {
	var n = Object.defineProperty, r = Object.getOwnPropertyDescriptor, i = Object.getOwnPropertyNames, a = Object.prototype.hasOwnProperty, o = (e, t) => {
		for (var r in t) n(e, r, {
			get: t[r],
			enumerable: !0
		});
	}, s = (e, t, o, s) => {
		if (t && typeof t == "object" || typeof t == "function") for (let c of i(t)) !a.call(e, c) && c !== o && n(e, c, {
			get: () => t[c],
			enumerable: !(s = r(t, c)) || s.enumerable
		});
		return e;
	}, c = (e) => s(n({}, "__esModule", { value: !0 }), e), l = {};
	o(l, {
		XmlCdata: () => E,
		XmlComment: () => D,
		XmlDeclaration: () => O,
		XmlDocument: () => A,
		XmlDocumentType: () => j,
		XmlElement: () => k,
		XmlError: () => M,
		XmlNode: () => w,
		XmlProcessingInstruction: () => N,
		XmlText: () => T,
		parseXml: () => ee
	}), t.exports = c(l);
	var u = "", d = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g, f = class {
		constructor(e) {
			if (this.k = this.u(e, !0), this.d = 0, this.length = e.length, this.l = this.k !== this.length, this.h = e, this.l) {
				let t = [];
				for (let n = 0, r = 0; r < this.k; ++r) t[r] = n, n += e.codePointAt(n) > 65535 ? 2 : 1;
				this.A = t;
			}
		}
		get B() {
			return this.d >= this.k;
		}
		u(e, t = this.l) {
			return t ? e.replace(d, "_").length : e.length;
		}
		p(e = 1) {
			this.d = Math.min(this.k, this.d + e);
		}
		f(e = this.d) {
			return this.l ? this.A[e] ?? Infinity : e;
		}
		G(e = 1) {
			let t = this.m(e);
			return this.p(e), t;
		}
		v(e) {
			let t = this.f(), n = this.h.slice(t, t + e);
			return this.p(this.u(n)), n;
		}
		w(e) {
			let { length: t, l: n, h: r } = this, i = this.f(), a = i;
			if (n) for (; a < t;) {
				let t = r[a], n = t >= "\ud800" && t <= "\udbff";
				if (n && (t += r[a + 1]), !e(t)) break;
				a += n ? 2 : 1;
			}
			else for (; a < t && e(r[a]);) ++a;
			return this.v(a - i);
		}
		b(e) {
			let { length: t } = e, n = this.f();
			return e === this.h.slice(n, n + t) ? (this.p(t === 1 ? 1 : this.u(e)), e) : u;
		}
		x(e) {
			let t = this.h.slice(this.f()).search(e);
			return t > 0 ? this.v(t) : u;
		}
		s(e) {
			let t = this.f(), n = this.h.indexOf(e, t);
			return n > 0 ? this.v(n - t) : u;
		}
		m(e = 1) {
			let { d: t, h: n } = this;
			return this.l ? n.slice(this.f(t), this.f(t + e)) : n.slice(t, t + e);
		}
		n(e = 0) {
			this.d = e >= 0 ? Math.min(this.k, e) : Math.max(0, this.d + e);
		}
	}, p = /["&<]/, m = /['&<]/, h = /\r\n|[\n\r\t]/g, g = /<|&|]]>/, _ = Object.freeze(Object.assign(/* @__PURE__ */ Object.create(null), {
		amp: "&",
		apos: "'",
		gt: ">",
		lt: "<",
		quot: "\""
	}));
	function v(e) {
		let t = e.codePointAt(0);
		return t >= 97 && t <= 122 || t >= 65 && t <= 90 || t >= 48 && t <= 57 || t === 45 || t === 46 || t === 183 || t >= 768 && t <= 879 || t === 8255 || t === 8256 || y(e, t);
	}
	function y(e, t = e.codePointAt(0)) {
		return t >= 97 && t <= 122 || t >= 65 && t <= 90 || t === 58 || t === 95 || t >= 192 && t <= 214 || t >= 216 && t <= 246 || t >= 248 && t <= 767 || t >= 880 && t <= 893 || t >= 895 && t <= 8191 || t === 8204 || t === 8205 || t >= 8304 && t <= 8591 || t >= 11264 && t <= 12271 || t >= 12289 && t <= 55295 || t >= 63744 && t <= 64975 || t >= 65008 && t <= 65533 || t >= 65536 && t <= 983039;
	}
	function b(e) {
		return e === "#" || v(e);
	}
	function x(e) {
		let t = e.codePointAt(0);
		return t === 32 || t === 9 || t === 10 || t === 13;
	}
	function S(e) {
		return e >= 32 && e <= 55295 || e === 10 || e === 9 || e === 13 || e >= 57344 && e <= 65533 || e >= 65536 && e <= 1114111;
	}
	var C = class e {
		constructor() {
			this.parent = null, this.start = -1, this.end = -1;
		}
		get document() {
			return this.parent?.document ?? null;
		}
		get isRootNode() {
			return this.parent !== null && this.parent === this.document && this.type === e.TYPE_ELEMENT;
		}
		get preserveWhitespace() {
			return !!this.parent?.preserveWhitespace;
		}
		get type() {
			return "";
		}
		toJSON() {
			let e = { type: this.type };
			return this.isRootNode && (e.isRootNode = !0), this.preserveWhitespace && (e.preserveWhitespace = !0), this.start !== -1 && (e.start = this.start, e.end = this.end), e;
		}
	};
	C.TYPE_CDATA = "cdata", C.TYPE_COMMENT = "comment", C.TYPE_DOCUMENT = "document", C.TYPE_DOCUMENT_TYPE = "doctype", C.TYPE_ELEMENT = "element", C.TYPE_PROCESSING_INSTRUCTION = "pi", C.TYPE_TEXT = "text", C.TYPE_XML_DECLARATION = "xmldecl";
	var w = C, T = class extends w {
		constructor(e = "") {
			super(), this.text = e;
		}
		get type() {
			return w.TYPE_TEXT;
		}
		toJSON() {
			return Object.assign(w.prototype.toJSON.call(this), { text: this.text });
		}
	}, E = class extends T {
		get type() {
			return w.TYPE_CDATA;
		}
	}, D = class extends w {
		constructor(e = "") {
			super(), this.content = e;
		}
		get type() {
			return w.TYPE_COMMENT;
		}
		toJSON() {
			return Object.assign(w.prototype.toJSON.call(this), { content: this.content });
		}
	}, O = class extends w {
		constructor(e, t, n) {
			super(), this.version = e, this.encoding = t ?? null, this.standalone = n ?? null;
		}
		get type() {
			return w.TYPE_XML_DECLARATION;
		}
		toJSON() {
			let e = w.prototype.toJSON.call(this);
			e.version = this.version;
			for (let t of ["encoding", "standalone"]) this[t] !== null && (e[t] = this[t]);
			return e;
		}
	}, k = class e extends w {
		constructor(e, t = /* @__PURE__ */ Object.create(null), n = []) {
			super(), this.name = e, this.attributes = t, this.children = n;
		}
		get isEmpty() {
			return this.children.length === 0;
		}
		get preserveWhitespace() {
			let t = this;
			for (; t instanceof e;) {
				if ("xml:space" in t.attributes) return t.attributes["xml:space"] === "preserve";
				t = t.parent;
			}
			return !1;
		}
		get text() {
			return this.children.map((e) => "text" in e ? e.text : "").join("");
		}
		get type() {
			return w.TYPE_ELEMENT;
		}
		toJSON() {
			return Object.assign(w.prototype.toJSON.call(this), {
				name: this.name,
				attributes: this.attributes,
				children: this.children.map((e) => e.toJSON())
			});
		}
	}, A = class extends w {
		constructor(e = []) {
			super(), this.children = e;
		}
		get document() {
			return this;
		}
		get root() {
			for (let e of this.children) if (e instanceof k) return e;
			return null;
		}
		get text() {
			return this.children.map((e) => "text" in e ? e.text : "").join("");
		}
		get type() {
			return w.TYPE_DOCUMENT;
		}
		toJSON() {
			return Object.assign(w.prototype.toJSON.call(this), { children: this.children.map((e) => e.toJSON()) });
		}
	}, j = class extends w {
		constructor(e, t, n, r) {
			super(), this.name = e, this.publicId = t ?? null, this.systemId = n ?? null, this.internalSubset = r ?? null;
		}
		get type() {
			return w.TYPE_DOCUMENT_TYPE;
		}
		toJSON() {
			let e = w.prototype.toJSON.call(this);
			e.name = this.name;
			for (let t of [
				"publicId",
				"systemId",
				"internalSubset"
			]) this[t] !== null && (e[t] = this[t]);
			return e;
		}
	}, M = class extends Error {
		constructor(e, t, n) {
			let r = 1, i = "", a = 1;
			for (let e = 0; e < t; ++e) {
				let t = n[e];
				t === "\n" ? (r = 1, i = "", a += 1) : (r += 1, i += t);
			}
			let o = n.indexOf("\n", t);
			i += o === -1 ? n.slice(t) : n.slice(t, o);
			let s = 0;
			i.length > 50 && (r < 40 ? i = i.slice(0, 50) : (s = r - 20, i = i.slice(s, r + 30))), super(`${e} (line ${a}, column ${r})
  ${i}
` + " ".repeat(r - s + 1) + "^\n"), this.column = r, this.excerpt = i, this.line = a, this.name = "XmlError", this.pos = t;
		}
	}, N = class extends w {
		constructor(e, t = "") {
			super(), this.name = e, this.content = t;
		}
		get type() {
			return w.TYPE_PROCESSING_INSTRUCTION;
		}
		toJSON() {
			return Object.assign(w.prototype.toJSON.call(this), {
				name: this.name,
				content: this.content
			});
		}
	}, P = "", F = class {
		constructor(e, t = {}) {
			let n = this.document = new A();
			this.j = n, this.g = t, this.c = new f(e), this.g.includeOffsets && (n.start = 0, n.end = e.length), this.parse();
		}
		i(e, t) {
			return e.parent = this.j, this.g.includeOffsets && (e.start = this.c.f(t), e.end = this.c.f()), this.j.children.push(e), !0;
		}
		y(e, t) {
			let { children: n } = this.j, { length: r } = n;
			if (e = I(e), r > 0) {
				let t = n[r - 1];
				if (t?.type === w.TYPE_TEXT) {
					let n = t;
					return n.text += e, this.g.includeOffsets && (n.end = this.c.f()), !0;
				}
			}
			return this.i(new T(e), t);
		}
		H() {
			let e = /* @__PURE__ */ Object.create(null);
			for (; this.e();) {
				let t = this.q();
				if (!t) break;
				let n = this.t() && this.I();
				if (n === !1) throw this.a("Attribute value expected");
				if (t in e) throw this.a(`Duplicate attribute: ${t}`);
				if (t === "xml:space" && n !== "default" && n !== "preserve") throw this.a("Value of the `xml:space` attribute must be \"default\" or \"preserve\"");
				e[t] = n;
			}
			if (this.g.sortAttributes) {
				let t = Object.keys(e).sort(), n = /* @__PURE__ */ Object.create(null);
				for (let r = 0; r < t.length; ++r) {
					let i = t[r];
					n[i] = e[i];
				}
				e = n;
			}
			return e;
		}
		I() {
			let { c: e } = this, t = e.m();
			if (t !== "\"" && t !== "'") return !1;
			e.p();
			let n, r = !1, i = P, a = t === "\"" ? p : m;
			matchLoop: for (; !e.B;) switch (n = e.x(a), n && (this.o(n), i += n.replace(h, " ")), e.m()) {
				case t:
					r = !0;
					break matchLoop;
				case "&":
					i += this.C();
					continue;
				case "<": throw this.a("Unescaped `<` is not allowed in an attribute value");
				default: break matchLoop;
			}
			if (!r) throw this.a("Unclosed attribute");
			return e.p(), i;
		}
		J() {
			let { c: e } = this, t = e.d;
			if (!e.b("<![CDATA[")) return !1;
			let n = e.s("]]>");
			if (this.o(n), !e.b("]]>")) throw this.a("Unclosed CDATA section");
			return this.g.preserveCdata ? this.i(new E(I(n)), t) : this.y(n, t);
		}
		K() {
			let { c: e } = this, t = e.d, n = e.x(g);
			if (!n) return !1;
			if (this.o(n), e.m(3) === "]]>") throw this.a("Element content may not contain the CDATA section close delimiter `]]>`");
			return this.y(n, t);
		}
		D() {
			let { c: e } = this, t = e.d;
			if (!e.b("<!--")) return !1;
			let n = e.s("--");
			if (this.o(n), !e.b("-->")) throw e.m(2) === "--" ? this.a("The string `--` isn't allowed inside a comment") : this.a("Unclosed comment");
			return this.g.preserveComments ? this.i(new D(I(n)), t) : !0;
		}
		L() {
			let e = this.c.d, t = this.C();
			return t ? this.y(t, e) : !1;
		}
		M() {
			let { c: e } = this, t = e.d;
			if (!e.b("<!DOCTYPE")) return !1;
			let n = this.e() && this.q();
			if (!n) throw this.a("Expected a name");
			let r, i;
			if (this.e()) {
				if (e.b("PUBLIC")) {
					if (r = this.e() && this.N(), r === !1) throw this.a("Expected a public identifier");
					this.e();
				}
				if (r !== void 0 || e.b("SYSTEM")) {
					if (this.e(), i = this.r(), i === !1) throw this.a("Expected a system identifier");
					this.e();
				}
			}
			let a;
			if (e.b("[")) {
				if (a = e.x(/\][\x20\t\r\n]*>/), !e.b("]")) throw this.a("Unclosed internal subset");
				this.e();
			}
			if (!e.b(">")) throw this.a("Unclosed doctype declaration");
			return this.g.preserveDocumentType ? this.i(new j(n, r, i, a), t) : !0;
		}
		E() {
			let { c: e } = this, t = e.d;
			if (!e.b("<")) return !1;
			let n = this.q();
			if (!n) return e.n(t), !1;
			let r = this.H(), i = !!e.b("/>"), a = new k(n, r);
			if (a.parent = this.j, !i) {
				if (!e.b(">")) throw this.a(`Unclosed start tag for element \`${n}\``);
				this.j = a;
				do
					this.K();
				while (this.E() || this.L() || this.J() || this.F() || this.D());
				let t = e.d, r;
				if (!e.b("</") || !(r = this.q()) || r !== n) throw e.n(t), this.a(`Missing end tag for element ${n}`);
				if (this.e(), !e.b(">")) throw this.a(`Unclosed end tag for element ${n}`);
				this.j = a.parent;
			}
			return this.i(a, t);
		}
		t() {
			return this.e(), this.c.b("=") ? (this.e(), !0) : !1;
		}
		z() {
			return this.D() || this.F() || this.e();
		}
		q() {
			return y(this.c.m()) ? this.c.w(v) : P;
		}
		F() {
			let { c: e } = this, t = e.d;
			if (!e.b("<?")) return !1;
			let n = this.q();
			if (n) {
				if (n.toLowerCase() === "xml") throw e.n(t), this.a("XML declaration isn't allowed here");
			} else throw this.a("Invalid processing instruction");
			if (!this.e()) {
				if (e.b("?>")) return this.i(new N(n), t);
				throw this.a("Whitespace is required after a processing instruction name");
			}
			let r = e.s("?>");
			if (this.o(r), !e.b("?>")) throw this.a("Unterminated processing instruction");
			return this.i(new N(n, I(r)), t);
		}
		O() {
			let { c: e } = this, t = e.d;
			for (this.P(); this.z(););
			if (this.M()) for (; this.z(););
			return t < e.d;
		}
		N() {
			let e = this.c.d, t = this.r();
			if (t !== !1 && !/^[-\x20\r\na-zA-Z0-9'()+,./:=?;!*#@$_%]*$/.test(t)) throw this.c.n(e), this.a("Invalid character in public identifier");
			return t;
		}
		C() {
			let { c: e } = this;
			if (!e.b("&")) return !1;
			let t = e.w(b);
			if (e.G() !== ";") throw this.a("Unterminated reference (a reference must end with `;`)");
			let n;
			if (t[0] === "#") {
				let e = t[1] === "x" ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10);
				if (isNaN(e)) throw this.a("Invalid character reference");
				if (!S(e)) throw this.a("Character reference resolves to an invalid character");
				n = String.fromCodePoint(e);
			} else if (n = _[t], n === void 0) {
				let { ignoreUndefinedEntities: n, resolveUndefinedEntity: r } = this.g, i = `&${t};`;
				if (r) {
					let e = r(i);
					if (e != null) {
						let t = typeof e;
						if (t !== "string") throw TypeError(`\`resolveUndefinedEntity()\` must return a string, \`null\`, or \`undefined\`, but returned a value of type ${t}`);
						return e;
					}
				}
				if (n) return i;
				throw e.n(-i.length), this.a(`Named entity isn't defined: ${i}`);
			}
			return n;
		}
		r() {
			let { c: e } = this, t = e.b("\"") || e.b("'");
			if (!t) return !1;
			let n = e.s(t);
			if (this.o(n), !e.b(t)) throw this.a("Missing end quote");
			return n;
		}
		e() {
			return !!this.c.w(x);
		}
		P() {
			let { c: e } = this, t = e.d;
			if (!e.b("<?xml")) return !1;
			if (!this.e()) throw this.a("Invalid XML declaration");
			let n = !!e.b("version") && this.t() && this.r();
			if (n === !1) throw this.a("XML version is missing or invalid");
			if (!/^1\.[0-9]+$/.test(n)) throw this.a("Invalid character in version number");
			let r, i;
			if (this.e()) {
				if (r = !!e.b("encoding") && this.t() && this.r(), r) {
					if (!/^[A-Za-z][\w.-]*$/.test(r)) throw this.a("Invalid character in encoding name");
					this.e();
				}
				if (i = !!e.b("standalone") && this.t() && this.r(), i) {
					if (i !== "yes" && i !== "no") throw this.a("Only \"yes\" and \"no\" are permitted as values of `standalone`");
					this.e();
				}
			}
			if (!e.b("?>")) throw this.a("Invalid or unclosed XML declaration");
			return this.g.preserveXmlDeclaration ? this.i(new O(n, r || void 0, i || void 0), t) : !0;
		}
		a(e) {
			let { c: t } = this;
			return new M(e, t.d, t.h);
		}
		parse() {
			if (this.c.b("﻿"), this.O(), !this.E()) throw this.a("Root element is missing or invalid");
			for (; this.z(););
			if (!this.c.B) throw this.a("Extra content at the end of the document");
		}
		o(e) {
			let { length: t } = e;
			for (let n = 0; n < t; ++n) {
				let t = e.codePointAt(n);
				if (!S(t)) throw this.c.n(-([...e].length - n)), this.a("Invalid character");
				t > 65535 && (n += 1);
			}
		}
	};
	function I(e) {
		let t = 0;
		for (; (t = e.indexOf("\r", t)) !== -1;) e = e[t + 1] === "\n" ? e.slice(0, t) + e.slice(t + 1) : e.slice(0, t) + "\n" + e.slice(t + 1);
		return e;
	}
	function ee(e, t) {
		return new F(e, t).document;
	}
})))(), he = class extends Error {
	constructor(e) {
		super(e);
	}
};
function ge(e) {
	let t = null;
	try {
		t = (0, me.parseXml)(e);
	} catch (e) {
		throw new he(e.message);
	}
	return t;
}
function B(e) {
	let t = e.indexOf(":");
	return t > -1 ? e.substr(t + 1) : e;
}
function V(e) {
	return e.children[0];
}
function H(e) {
	return e.name || "";
}
function U(e, t, n = !1) {
	let r = B(t);
	function i(e, t) {
		return B(H(t)) === r && e.push(t), n && Array.isArray(t.children) ? [...e, ...t.children.reduce(i, [])] : e;
	}
	return e && Array.isArray(e.children) ? e.children.reduce(i, []) : [];
}
function W(e, t, n = !1) {
	return U(e, t, n)[0] || null;
}
function G(e) {
	return e && Array.isArray(e.children) ? [...e.children.filter((e) => e instanceof me.XmlElement)] : [];
}
function K(e) {
	let t = e && Array.isArray(e.children) ? e.children.find((e) => e.type === "text") : null;
	return t ? t.text : "";
}
function q(e, t) {
	return e && e.attributes[t] || "";
}
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/shared/errors.js
var J = class extends Error {
	constructor(e, t, n) {
		super(e), this.httpStatus = t, this.isCrossOriginRelated = n, this.name = "EndpointError";
	}
}, _e = class extends Error {
	constructor(e, t, n, r, i) {
		super(e), this.requestUrl = t, this.code = n, this.locator = r, this.response = i, this.name = "ServiceExceptionError";
	}
};
function ve(e, t) {
	let n = q(e, "code") || q(e, "exceptionCode"), r = q(e, "locator");
	return new _e(K(W(e, "ExceptionText") || e).trim(), t, n, r, e.document);
}
function ye(e, t) {
	let n = V(e), r = B(H(n));
	if (r === "ServiceExceptionReport") {
		let e = W(n, "ServiceException");
		if (e) throw ve(e, t);
	}
	if (r === "ExceptionReport") {
		let e = W(n, "Exception");
		if (e) throw ve(e, t);
	}
	return e;
}
function be(e) {
	let t = {
		message: e.message,
		stack: e.stack,
		name: e.name
	};
	return e instanceof _e ? {
		...t,
		code: e.code,
		locator: e.locator,
		response: e.response,
		requestUrl: e.requestUrl
	} : e instanceof J ? {
		...t,
		httpStatus: e.httpStatus,
		isCrossOriginRelated: e.isCrossOriginRelated
	} : t;
}
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/shared/encoding.js
var xe = [
	"utf-8",
	"utf-16",
	"iso-8859-1"
], Se = "utf-8";
function Ce(e) {
	let t = /charset=([^;]+)/.exec(e);
	return t ? t[1] : null;
}
function we(e, t) {
	let n = t ? Ce(t) : null, r = n ? [n, ...xe] : xe;
	for (let t of r) try {
		return new TextDecoder(t, { fatal: !0 }).decode(e);
	} catch {}
	return console.warn(`[ogc-client] XML document encoding could not be determined, falling back to ${Se}.`), new TextDecoder(Se).decode(e);
}
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/shared/http-utils.js
var Te = /* @__PURE__ */ new Map(), Ee = {}, De = null;
function Oe(e) {
	Ee = e, De && De(e);
}
function ke() {
	return Ee;
}
function Ae(e, t = "GET", n) {
	let r = `${t}#${e}`;
	if (n && (r = `${t}#asJson#${e}`), Te.has(r)) return Te.get(r);
	let i = { ...ke() };
	i.method = t, n && (i.headers = "headers" in i ? i.headers : {}, i.headers.Accept = "application/json,application/schema+json");
	let a = fetch(e, i).catch((e) => e).then((e) => (Te.delete(r), e));
	return Te.set(r, a), a.then((e) => {
		if (e instanceof Error) throw e;
		return e.clone();
	});
}
function Y(e) {
	return Ae(e).catch(() => fetch(e, {
		...ke(),
		method: "HEAD",
		mode: "no-cors"
	}).catch((e) => {
		throw new J(`Fetching the document failed either due to network errors or unreachable host, error is: ${e.message}`, 0, !1);
	}).then(() => {
		throw new J("The document could not be fetched due to CORS limitations", 0, !0);
	})).then(async (e) => {
		if (!e.ok) {
			let t = await e.text();
			throw new J(`Received an error with code ${e.status}: ${t}`, e.status, !1);
		}
		return we(await e.arrayBuffer(), e.headers.get("Content-Type"));
	}).then((e) => ge(e));
}
function X(e, t) {
	let n = e.match(/(https?%3A%2F%2F[^/]+)$/);
	if (n) {
		let r = n[1], i = X(decodeURIComponent(r), t);
		return e.replace(r, encodeURIComponent(i));
	}
	let r = new URL(e), i = Object.keys(t), a = i.map((e) => e.toLowerCase()), o = [];
	for (let e of r.searchParams.keys()) a.indexOf(e.toLowerCase()) > -1 && o.push(e);
	return o.map((e) => r.searchParams.delete(e)), i.forEach((e) => r.searchParams.set(e, t[e] === !0 ? "" : t[e])), r.toString();
}
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/wfs/featuretypeinfo.js
function je(e, t, n, r) {
	let { name: i, title: a, abstract: o, defaultCrs: s, otherCrs: c, outputFormats: l, latLonBoundingBox: u, keywords: d, metadata: f } = e, p = r.startsWith("2.0") ? "numberMatched" : "numberOfFeatures", m = parseInt(q(V(n), p)), h = U(V(t), "complexType", !0)[0], g = U(h, "element", !0), _ = g.filter((e) => /^xsd:|^xs:/.test(q(e, "type"))).reduce((e, t) => ({
		...e,
		[q(t, "name")]: Me(q(t, "type"))
	}), {}), v = g.filter((e) => q(e, "type").startsWith("gml:"))[0], y = v ? q(v, "name") : void 0, b = v ? Ne(q(v, "type")) : void 0;
	return {
		name: i,
		...a && { title: a },
		...o && { abstract: o },
		...u && { boundingBox: u },
		...s && { defaultCrs: s },
		...c && { otherCrs: c },
		...l && { outputFormats: l },
		properties: _,
		...y && { geometryName: y },
		...b && { geometryType: b },
		...!Number.isNaN(m) && { objectCount: m },
		...d && { keywords: d },
		...f && { metadata: f }
	};
}
function Me(e) {
	switch (e.indexOf(":") > -1 ? e.substr(e.indexOf(":") + 1) : e) {
		case "string": return "string";
		case "boolean": return "boolean";
		case "float":
		case "double":
		case "decimal": return "float";
		case "long":
		case "byte":
		case "integer":
		case "int":
		case "positiveInteger":
		case "negativeInteger":
		case "nonPositiveInteger":
		case "nonNegativeInteger":
		case "short":
		case "unsignedLong":
		case "unsignedInt":
		case "unsignedShort":
		case "unsignedByte": return "integer";
		default: return "string";
	}
}
function Ne(e) {
	switch (e.indexOf(":") > -1 ? e.substr(e.indexOf(":") + 1) : e) {
		case "PointPropertyType": return "point";
		case "MultiPointPropertyType": return "multipoint";
		case "CurvePropertyType":
		case "LineStringPropertyType": return "linestring";
		case "MultiCurvePropertyType":
		case "MultiLineStringPropertyType": return "linestring";
		case "PolygonPropertyType":
		case "SurfacePropertyType": return "polygon";
		case "MultiPolygonPropertyType":
		case "MultiSurfacePropertyType": return "multipolygon";
		default: return "unknown";
	}
}
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/shared/cache.js
var Pe = 1e3 * 60 * 60;
function Fe() {
	return Pe;
}
var Z;
function Ie() {
	return Z === void 0 ? "caches" in globalThis ? (Z = caches.open("ogc-client").catch((e) => (console.info("[ogc-client] Cache could not be accessed for the following reason:", e), null)), Z) : (Z = Promise.resolve(null), Z) : Z;
}
async function Le(e, ...t) {
	let n = await Ie();
	if (!n) return;
	let r = "https://cache/" + t.join("/");
	try {
		await n.put(r, new Response(JSON.stringify(e), { headers: { "x-expiry": (Date.now() + Fe()).toString(10) } }));
	} catch (e) {
		console.info("[ogc-client] Caching failed once for the following reason and will not be retried:", e), Z = Promise.resolve(null);
	}
}
async function Re(...e) {
	let t = await Ie();
	if (!t) return;
	let n = "https://cache/" + e.join("/");
	return t.match(n).then((e) => !!e && parseInt(e.headers.get("x-expiry")) > Date.now());
}
async function ze(...e) {
	let t = await Ie();
	if (!t) return;
	let n = "https://cache/" + e.join("/"), r = await t.match(n);
	return r ? r.clone().json() : null;
}
var Be = /* @__PURE__ */ new Map();
async function Q(e, ...t) {
	if (await Ve(), await Re(...t)) return ze(...t);
	let n = t.join("#");
	if (Be.has(n)) return Be.get(n);
	let r = e();
	r instanceof Promise && (r.then(() => Be.delete(n)), Be.set(n, r));
	let i = await r;
	return await Le(i, ...t), i;
}
async function Ve() {
	let e = await Ie();
	if (!e) return;
	let t = await e.keys();
	for (let n of t) {
		let t = await e.match(n);
		parseInt(t.headers.get("x-expiry")) <= Date.now() && await e.delete(n);
	}
}
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/wfs/url.js
function He(e, t, n, r, i, a, o, s, c, l, u, d) {
	let f = t === "2.0.0" ? "TYPENAMES" : "TYPENAME", p = t === "2.0.0" ? "COUNT" : "MAXFEATURES", m = {
		SERVICE: "WFS",
		REQUEST: "GetFeature",
		VERSION: t,
		[f]: n
	};
	if (r !== void 0 && (m.OUTPUTFORMAT = r), a !== void 0 && (m.PROPERTYNAME = a.join(",")), o ? (m.RESULTTYPE = "hits", m[p] = "1") : i !== void 0 && (m[p] = i.toString(10)), s && (m.SRSNAME = s), c) {
		let e = c.join(",");
		m.BBOX = l ? `${e},${l}` : e;
	}
	u && (m.STARTINDEX = u.toString(10));
	let h = new URL(X(e, m));
	if (Array.isArray(d) && d.length > 0) {
		let e = d.map((e) => `${e[1]} ${e[0]}`).join(",");
		h.searchParams.set("SORTBY", e);
	}
	return h.toString();
}
function Ue(e, t, n) {
	return X(e, {
		SERVICE: "WFS",
		REQUEST: "DescribeFeatureType",
		VERSION: t,
		[t === "2.0.0" ? "TYPENAMES" : "TYPENAME"]: n
	});
}
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/shared/mime-type.js
function We(e) {
	return e.toLowerCase().indexOf("json") > -1;
}
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/wfs/endpoint.js
var Ge = class {
	_capabilitiesUrl;
	_capabilitiesPromise;
	_info;
	_featureTypes;
	_url;
	_version;
	constructor(e) {
		this._capabilitiesUrl = X(e, {
			SERVICE: "WFS",
			REQUEST: "GetCapabilities"
		}), this._capabilitiesPromise = Q(() => de(this._capabilitiesUrl), "WFS", "CAPABILITIES", this._capabilitiesUrl).then(({ info: e, featureTypes: t, url: n, version: r }) => {
			this._info = e, this._featureTypes = t, this._url = n, this._version = r;
		});
	}
	isReady() {
		return this._capabilitiesPromise.then(() => this);
	}
	getServiceInfo() {
		return this._info;
	}
	getFeatureTypes() {
		return this._featureTypes.map((e) => ({
			name: e.name,
			..."title" in e && { title: e.title },
			..."abstract" in e && { abstract: e.abstract },
			..."latLonBoundingBox" in e && { boundingBox: e.latLonBoundingBox }
		}));
	}
	_getFeatureTypeByName(e) {
		if (!this._featureTypes) return null;
		let t = B(e) !== e;
		return this._featureTypes.find((n) => t ? n.name === e : B(n.name) === e) || null;
	}
	getFeatureTypeSummary(e) {
		let t = this._getFeatureTypeByName(e);
		return t ? {
			name: t.name,
			..."title" in t && { title: t.title },
			..."abstract" in t && { abstract: t.abstract },
			..."latLonBoundingBox" in t && { boundingBox: t.latLonBoundingBox },
			defaultCrs: t.defaultCrs,
			otherCrs: t.otherCrs,
			outputFormats: t.outputFormats,
			keywords: t.keywords,
			..."metadata" in t && { metadata: t.metadata }
		} : null;
	}
	getFeatureTypeFull(e) {
		let t = this._getFeatureTypeByName(e);
		return t ? Q(() => {
			let n = Ue(this.getOperationUrl("DescribeFeatureType"), this._version, e), r = He(this.getOperationUrl("GetFeature"), this._version, e, void 0, void 0, void 0, !0);
			return Promise.all([Y(n), Y(r)]).then(([e, n]) => je(t, e, n, this._version));
		}, "WFS", "FEATURETYPEINFO", this._capabilitiesUrl, e) : null;
	}
	getSingleFeatureTypeName() {
		return this._featureTypes && this._featureTypes.length === 1 ? this._featureTypes[0].name : null;
	}
	async getFeatureTypePropDetails(e) {
		let t = await this.getFeatureTypeFull(e);
		return t === null ? null : Q(() => fe(this._capabilitiesUrl, this._version, t).then((e) => e.props), "WFS", "FEATURETYPEPROPDETAILS", this._capabilitiesUrl, e);
	}
	getVersion() {
		return this._version;
	}
	_getJsonCompatibleOutputFormat(e) {
		let t = this._getFeatureTypeByName(e);
		if (!t) throw Error(`The following feature type was not found in the service: ${e}`);
		let n = t.outputFormats.filter(We);
		return n.length ? n[0] : null;
	}
	supportsJson(e) {
		return this._featureTypes ? !!this._getJsonCompatibleOutputFormat(e) : null;
	}
	supportsStartIndex() {
		return this._version ? this._version >= "2.0.0" : !1;
	}
	getFeatureUrl(e, t) {
		if (!this._featureTypes) return null;
		let { maxFeatures: n, asJson: r, outputFormat: i, outputCrs: a, extent: o, extentCrs: s, startIndex: c, attributes: l, hitsOnly: u } = t || {}, d = this._getFeatureTypeByName(e);
		if (!d) throw Error(`The following feature type was not found in the service: ${e}`);
		let f = i;
		if (r) {
			if (f = this._getJsonCompatibleOutputFormat(e) || void 0, !f) throw Error(`The endpoint does not appear to support GeoJSON for the feature type ${d.name}`);
		} else i && d.outputFormats.indexOf(i) === -1 && console.warn(`[ogc-client] The following output format type was not found in the feature type ${d.name}: ${i}`);
		return He(this.getOperationUrl("GetFeature"), this._version, d.name, f, n, l, u, a, o, s, c);
	}
	getCapabilitiesUrl() {
		let e = this.getOperationUrl("GetCapabilities");
		return e ? X(e, {
			SERVICE: "WMS",
			REQUEST: "GetCapabilities"
		}) : this._capabilitiesUrl;
	}
	getOperationUrl(e, t = "Get") {
		return this._url ? this._url[e]?.[t] : null;
	}
};
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/wms/url.js
function Ke(e, t, n, r, i, a, o, s, c) {
	let l = t === "1.3.0" ? "CRS" : "SRS", u = {
		SERVICE: "WMS",
		REQUEST: "GetMap",
		VERSION: t,
		LAYERS: n,
		STYLES: c ?? ""
	};
	return u.WIDTH = r.toString(), u.HEIGHT = i.toString(), u.FORMAT = s ?? "image/png", u[l] = a, u.BBOX = o.join(","), X(e, u);
}
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/wms/endpoint.js
var qe = class {
	_capabilitiesUrl;
	_capabilitiesPromise;
	_info;
	_layers;
	_url;
	_version;
	constructor(e) {
		this._capabilitiesUrl = X(e, {
			SERVICE: "WMS",
			REQUEST: "GetCapabilities"
		}), this._capabilitiesPromise = Q(() => ue(this._capabilitiesUrl), "WMS", "CAPABILITIES", this._capabilitiesUrl).then(({ info: e, layers: t, url: n, version: r }) => {
			this._info = e, this._layers = t, this._url = n, this._version = r;
		});
	}
	isReady() {
		return this._capabilitiesPromise.then(() => this);
	}
	getServiceInfo() {
		return this._info;
	}
	getLayers() {
		function e(t) {
			return {
				title: t.title,
				name: t.name,
				abstract: t.abstract,
				..."children" in t && { children: t.children.map(e) }
			};
		}
		return this._layers.map(e);
	}
	getFlattenedLayers() {
		return this.getLayers().flatMap(Je);
	}
	getLayerByName(e) {
		let t = null;
		function n(r) {
			if (t === null) {
				if (r.name === e) {
					t = r;
					return;
				}
				"children" in r && r.children.map(n);
			}
		}
		return this._layers.map(n), t;
	}
	getSingleLayerName() {
		if (!this._layers) return null;
		let e = [];
		function t(n) {
			n.name && e.push(n), "children" in n && n.children.map(t);
		}
		return this._layers.map(t), e.length === 1 ? e[0].name : null;
	}
	getVersion() {
		return this._version;
	}
	getMapUrl(e, t) {
		if (!this._layers) return null;
		let { widthPx: n, heightPx: r, crs: i, extent: a, outputFormat: o, styles: s } = t;
		return Ke(this.getOperationUrl("GetMap") || this._capabilitiesUrl, this._version, e.join(","), n, r, i, a, o, s === void 0 ? "" : s.join(","));
	}
	getCapabilitiesUrl() {
		let e = this.getOperationUrl("GetCapabilities");
		return e ? X(e, {
			SERVICE: "WMS",
			REQUEST: "GetCapabilities"
		}) : this._capabilitiesUrl;
	}
	getOperationUrl(e, t = "Get") {
		return this._url ? this._url[e]?.[t] : null;
	}
};
function Je(e) {
	let t = {
		title: e.title,
		name: e.name,
		abstract: e.abstract
	};
	return "children" in e && Array.isArray(e.children) ? [t, ...e.children.flatMap(Je)] : [t];
}
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/wmts/url.js
function Ye(e, t, n, r, i, a, o, s, c) {
	let l = {
		layer: n,
		style: r,
		tilematrixset: i,
		Service: "WMTS",
		Request: "GetTile",
		Format: c,
		TileMatrix: a,
		TileCol: s.toString(),
		TileRow: o.toString()
	};
	if (t === "REST") {
		let t = e;
		for (let e in l) t = t.replace(RegExp(`{${e}}`, "ig"), l[e]);
		return t;
	} else return X(e, l);
}
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/wmts/endpoint.js
var Xe = class {
	_capabilitiesPromise;
	_info = null;
	_layers = null;
	_matrixSets = null;
	constructor(e) {
		let t = X(e, {
			SERVICE: "WMTS",
			REQUEST: "GetCapabilities"
		});
		this._capabilitiesPromise = Q(() => pe(t), "WMTS", "CAPABILITIES", t).then(({ info: e, layers: t, matrixSets: n }) => {
			this._info = e, this._layers = t, this._matrixSets = n;
		});
	}
	isReady() {
		return this._capabilitiesPromise.then(() => this);
	}
	getServiceInfo() {
		return this._info;
	}
	getLayers() {
		return this._layers;
	}
	getMatrixSets() {
		return this._matrixSets;
	}
	getMatrixSetByIdentifier(e) {
		return this._matrixSets ? this._matrixSets.find((t) => t.identifier === e) ?? null : null;
	}
	getLayerByName(e) {
		return this._layers ? this._layers.find((t) => t.name === e) ?? null : null;
	}
	getSingleLayerName() {
		return this._layers && this._layers.length === 1 ? this._layers[0].name : null;
	}
	getLayerResourceLink(e, t) {
		if (!this._layers) return null;
		let n = this.getLayerByName(e), r = 0;
		t && (r = n.resourceLinks.findIndex((e) => e.format === t) || 0);
		let i = n.resourceLinks[r];
		return t && i.format !== t && console.warn(`[ogc-client] Requested '${t}' format for the WMTS layer but it is not available in REST encoding, falling back to '${i.format}'`), i;
	}
	getTileUrl(e, t, n, r, i, a, o) {
		if (!this._layers) return null;
		let s = this.getLayerResourceLink(e, o);
		return Ye(s.url, s.encoding, e, t, n, r, i, a, s.format);
	}
	getDefaultDimensions(e) {
		if (!this._layers) return null;
		let t = this.getLayerByName(e);
		return t.dimensions ? t.dimensions.reduce((e, t) => ({
			...e,
			[t.identifier]: t.defaultValue
		}), {}) : {};
	}
	tileGridModule;
	getOpenLayersTileGrid(e, t) {
		if (!this._layers) return null;
		this.tileGridModule ||= import("./ol-tilegrid-C0osMwGI.js").catch((e) => (console.warn("[ogc-client] Cannot use getOpenLayersTileGrid, the 'ol' package is probably not available.\n", e), null));
		let n = this.getLayerByName(e), r = n.matrixSets.find((e) => e.identifier === t) ?? n.matrixSets[0], i = this.getMatrixSetByIdentifier(r.identifier);
		return this.tileGridModule.then((e) => e ? e.buildOpenLayersTileGrid(i, r.limits) : null);
	}
}, Ze = new EventTarget();
function $(e, t, n) {
	let r = typeof WorkerGlobalScope < "u", i = async (i) => {
		if (i.taskName === e) {
			let a, o;
			try {
				a = await n(i.params);
			} catch (e) {
				o = be(e);
			}
			let s = {
				taskName: e,
				requestId: i.requestId,
				...a && { response: a },
				...o && { error: o }
			};
			r ? t.postMessage(s) : Ze.dispatchEvent(new CustomEvent("ogc-client.response", { detail: s }));
		}
	};
	r ? t.addEventListener("message", (e) => i(e.data)) : Ze.addEventListener("ogc-client.request", (e) => i(e.detail));
}
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/shared/crs-utils.js
var Qe = /* @__PURE__ */ "EPSG:4046.EPSG:4075.EPSG:4120.EPSG:4122.EPSG:4124.EPSG:4126.EPSG:4149.EPSG:4151.EPSG:4153.EPSG:4155.EPSG:4157.EPSG:4159.EPSG:4161.EPSG:4163.EPSG:4165.EPSG:4167.EPSG:4169.EPSG:4171.EPSG:4173.EPSG:4175.EPSG:4178.EPSG:4180.EPSG:4182.EPSG:4184.EPSG:4188.EPSG:4190.EPSG:4191.EPSG:4196.EPSG:4198.EPSG:4202.EPSG:4210.EPSG:4211.EPSG:4214.EPSG:4226.EPSG:4229.EPSG:4231.EPSG:4233.EPSG:4236.EPSG:4238.EPSG:4240.EPSG:4242.EPSG:4244.EPSG:4246.EPSG:4248.EPSG:4250.EPSG:4252.EPSG:4255.EPSG:4258.EPSG:4261.EPSG:4264.EPSG:4267.EPSG:4270.EPSG:4273.EPSG:4276.EPSG:4279.EPSG:4281.EPSG:4284.EPSG:4286.EPSG:4288.EPSG:4292.EPSG:4295.EPSG:4297.EPSG:4299.EPSG:4302.EPSG:4324.EPSG:4326".split(".");
function $e(e) {
	return Qe.indexOf(et(e)) > -1;
}
function et(e) {
	return /^urn:(?:x-)?ogc:def:crs:epsg:/.test(e.toLowerCase()) ? `EPSG:${/([0-9]+)$/.exec(e)[1]}` : e;
}
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/wms/capabilities.js
function tt(e) {
	let t = {};
	return G(W(W(V(e), "Capability"), "Request")).forEach((e) => {
		let n = B(H(e));
		t[n] = ct(e);
	}), t;
}
function nt(e) {
	return V(e).attributes.version;
}
function rt(e) {
	let t = nt(e);
	return U(W(V(e), "Capability"), "Layer").map((e) => lt(e, t));
}
function it(e) {
	return U(W(W(W(V(e), "Capability"), "Request"), "GetMap"), "Format").map(K);
}
function at(e) {
	return U(W(W(W(V(e), "Capability"), "Request"), "GetFeatureInfo"), "Format").map(K);
}
function ot(e) {
	return U(W(W(V(e), "Capability"), "Exception"), "Format").map(K);
}
function st(e) {
	let t = W(V(e), "Service"), n = it(e), r = at(e), i = ot(e), a = U(W(t, "KeywordList"), "Keyword").map(K).filter((e, t, n) => n.indexOf(e) === t), o = ft(e);
	return {
		title: K(W(t, "Title")),
		name: K(W(t, "Name")),
		abstract: K(W(t, "Abstract")),
		outputFormats: n,
		infoFormats: r,
		exceptionFormats: i,
		fees: K(W(t, "Fees")),
		constraints: K(W(t, "AccessConstraints")),
		provider: o,
		keywords: a
	};
}
function ct(e) {
	let t = {};
	return U(e, "DCPType").flatMap((e) => W(e, "HTTP")).flatMap((e) => G(e)).forEach((e) => {
		let n = W(e, "OnlineResource"), r = B(H(e));
		t[r] = q(n, "xlink:href");
	}), t;
}
function lt(e, t, n = [], r = [], i = null, a = null, o = null, s = null) {
	let c = t === "1.3.0" ? "CRS" : "SRS", l = U(e, c).map(K), u = l.length > 0 ? l : n, d = U(e, "Style").map(ut), f = d.length > 0 ? d : r;
	function p(e) {
		return ($e(q(e, c)) && t === "1.3.0" ? [
			"miny",
			"minx",
			"maxy",
			"maxx"
		] : [
			"minx",
			"miny",
			"maxx",
			"maxy"
		]).map((t) => q(e, t));
	}
	function m(e) {
		return [
			"westBoundLongitude",
			"southBoundLatitude",
			"eastBoundLongitude",
			"northBoundLatitude"
		].map((t) => K(W(e, t)));
	}
	function h(e) {
		return [
			"minx",
			"miny",
			"maxx",
			"maxy"
		].map((t) => q(e, t));
	}
	function g(e, t) {
		return e === "" ? t : Math.sqrt(.5 * parseFloat(e) ** 2) / 28e-5;
	}
	function _() {
		let t = W(e, "ScaleHint");
		if (!t) return [s, o];
		let n = q(t, "min"), r = q(t, "max");
		return [g(n, s), g(r, o)];
	}
	function v(t, n) {
		let r = K(W(e, t));
		return r === "" ? n : parseFloat(r);
	}
	let y = W(e, "Attribution"), b = y === null ? i : dt(y), x = t === "1.3.0" ? W(e, "EX_GeographicBoundingBox") : W(e, "LatLonBoundingBox"), S = {};
	x && (S["EPSG:4326"] = t === "1.3.0" ? m(x) : h(x));
	let C = U(e, "BoundingBox").reduce((e, t) => ({
		...e,
		[q(t, c)]: p(t)
	}), S);
	C = Object.keys(C).length > 0 || a === null ? C : a;
	let w = e.attributes.queryable === "1" || e.attributes.queryable === "true", T = e.attributes.opaque === "1" || e.attributes.opaque === "true", E = U(W(e, "KeywordList"), "Keyword").map(K).filter((e, t, n) => n.indexOf(e) === t), D, O;
	t === "1.3.0" ? (D = v("MinScaleDenominator", s), O = v("MaxScaleDenominator", o)) : [D, O] = _();
	let k = U(e, "MetadataURL").map((e) => ({
		type: q(e, "type"),
		format: K(W(e, "Format")),
		url: q(W(e, "OnlineResource"), "xlink:href")
	})), A = U(e, "Layer").map((e) => lt(e, t, u, f, b, C, O, D));
	return {
		name: K(W(e, "Name")),
		title: K(W(e, "Title")),
		abstract: K(W(e, "Abstract")),
		availableCrs: u,
		styles: f,
		attribution: b,
		boundingBoxes: C,
		keywords: E,
		queryable: w,
		opaque: T,
		...D === null ? {} : { minScaleDenominator: D },
		...O === null ? {} : { maxScaleDenominator: O },
		...k.length && { metadata: k },
		...A.length && { children: A }
	};
}
function ut(e) {
	let t = q(W(W(e, "LegendURL"), "OnlineResource"), "xlink:href"), n = K(W(e, "Abstract"));
	return {
		name: K(W(e, "Name")),
		title: K(W(e, "Title")),
		...n && { abstract: n },
		...t && { legendUrl: t }
	};
}
function dt(e) {
	let t = q(W(W(e, "LogoURL"), "OnlineResource"), "xlink:href"), n = q(W(e, "OnlineResource"), "xlink:href"), r = K(W(e, "Title"));
	return {
		...r && { title: r },
		...n && { url: n },
		...t && { logoUrl: t }
	};
}
function ft(e) {
	let t = W(W(V(e), "Service"), "ContactInformation"), n = W(t, "ContactPersonPrimary"), r = W(t, "ContactAddress");
	return { contact: {
		name: K(W(n, "ContactPerson")),
		organization: K(W(n, "ContactOrganization")),
		position: K(W(t, "ContactPosition")),
		phone: K(W(t, "ContactVoiceTelephone")),
		fax: K(W(t, "ContactFacsimileTelephone")),
		address: {
			deliveryPoint: K(W(r, "Address")),
			city: K(W(r, "City")),
			administrativeArea: K(W(r, "StateOrProvince")),
			postalCode: K(W(r, "PostCode")),
			country: K(W(r, "Country"))
		},
		email: K(W(t, "ContactElectronicMailAddress"))
	} };
}
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/shared/ows.js
function pt(e) {
	let t = W(V(e), "ServiceProvider"), n = W(t, "ServiceContact"), r = W(n, "ContactInfo"), i = W(r, "Phone"), a = W(r, "Address");
	return {
		name: K(W(t, "ProviderName")),
		site: q(W(t, "ProviderSite"), "xlink:href"),
		contact: {
			name: K(W(n, "IndividualName")),
			position: K(W(n, "PositionName")),
			phone: K(W(i, "Voice")),
			fax: K(W(i, "Facsimile")),
			address: {
				deliveryPoint: K(W(a, "DeliveryPoint")),
				city: K(W(a, "City")),
				administrativeArea: K(W(a, "AdministrativeArea")),
				postalCode: K(W(a, "PostalCode")),
				country: K(W(a, "Country"))
			},
			email: K(W(a, "ElectronicMailAddress"))
		}
	};
}
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/wfs/capabilities.js
function mt(e) {
	let t = {}, n = V(e), r = W(n, "OperationsMetadata");
	return r ? U(r, "Operation").forEach((e) => {
		let n = q(e, "name");
		t[n] = bt(e);
	}) : G(W(W(n, "Capability"), "Request")).forEach((e) => {
		let n = B(H(e));
		t[n] = yt(e);
	}), t;
}
function ht(e) {
	return V(e).attributes.version;
}
function gt(e) {
	let t = ht(e), n;
	return n = t.startsWith("1.0") ? G(W(W(W(W(V(e), "Capability"), "Request"), "GetFeature"), "ResultFormat")).map(H) : U(U(U(W(V(e), "OperationsMetadata"), "Operation").find((e) => q(e, "name") === "GetFeature"), "Parameter").find((e) => q(e, "name") === "outputFormat"), "Value", !0).map(K), n;
}
function _t(e) {
	let t = ht(e), n = t.startsWith("1.0") ? "Service" : "ServiceIdentification", r = t.startsWith("1.0") ? "Name" : "ServiceType", i = W(V(e), n), a;
	a = t.startsWith("1.0") ? K(W(i, "Keywords")).split(",").map((e) => e.trim()) : U(W(i, "Keywords"), "Keyword").map(K);
	let o;
	return t !== "1.0.0" && (o = pt(e)), {
		title: K(W(i, "Title")),
		name: K(W(i, r)),
		abstract: K(W(i, "Abstract")),
		fees: K(W(i, "Fees")),
		constraints: K(W(i, "AccessConstraints")),
		keywords: a,
		provider: o,
		outputFormats: gt(e)
	};
}
function vt(e) {
	let t = ht(e), n = gt(e);
	return U(W(V(e), "FeatureTypeList"), "FeatureType").map((e) => xt(e, t, n));
}
function yt(e) {
	let t = {};
	return U(e, "DCPType").flatMap((e) => U(e, "HTTP")).flatMap((e) => G(e)).forEach((e) => {
		let n = B(H(e));
		t[n] = q(e, "onlineResource");
	}), t;
}
function bt(e) {
	let t = {};
	return U(e, "DCP").flatMap((e) => W(e, "HTTP")).flatMap((e) => G(e)).forEach((e) => {
		let n = B(H(e));
		t[n] = q(e, "xlink:href");
	}), t;
}
function xt(e, t, n) {
	let r = t.startsWith("2.") ? "CRS" : "SRS", i = t.startsWith("1.0") ? "SRS" : `Default${r}`;
	function a() {
		let t = W(e, "LatLongBoundingBox");
		return [
			"minx",
			"miny",
			"maxx",
			"maxy"
		].map((e) => q(t, e)).map(parseFloat);
	}
	function o() {
		let t = W(e, "WGS84BoundingBox");
		return ["LowerCorner", "UpperCorner"].map((e) => W(t, e)).map((e) => K(e).split(" ")).reduce((e, t) => [...e, ...t]).map(parseFloat);
	}
	let s = t.startsWith("1.0") ? [] : U(e, `Other${r}`).map(K).map(et), c = t.startsWith("1.0") ? [] : U(W(e, "OutputFormats"), "Format").map(K), l = t.startsWith("1.0") ? K(W(e, "Keywords")).split(",").map((e) => e.trim()) : U(W(e, "Keywords"), "Keyword").map(K).filter((e, t, n) => n.indexOf(e) === t), u = t === "2.0.0" ? U(e, "MetadataURL").map((e) => ({ url: q(e, "xlink:href") })) : U(e, "MetadataURL").map((e) => ({
		format: q(e, "format"),
		type: q(e, "type"),
		url: K(e).trim()
	}));
	return {
		name: K(W(e, "Name")),
		title: K(W(e, "Title")),
		abstract: K(W(e, "Abstract")),
		defaultCrs: et(K(W(e, i))),
		otherCrs: s,
		outputFormats: c.length > 0 ? c : n,
		latLonBoundingBox: t.startsWith("1.0") ? a() : o(),
		keywords: l,
		...u.length && { metadata: u }
	};
}
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/wmts/capabilities.js
function St(e) {
	let t = ["LowerCorner", "UpperCorner"].map((t) => W(e, t)).map((e) => K(e).split(" ")).reduce((e, t) => [...e, ...t]).map(parseFloat);
	return t.some(Number.isNaN) ? null : t;
}
function Ct(e) {
	let t = V(e), n = W(t, "ServiceIdentification"), r = U(W(n, "Keywords"), "Keyword").map(K), i = U(U(W(t, "OperationsMetadata"), "Operation").find((e) => q(e, "name") == "GetTile"), "Get", !0).reduce((e, t) => {
		let n = K(W(t, "Value", !0)), r = q(t, "xlink:href");
		return n.toLowerCase() === "restful" ? {
			...e,
			rest: r
		} : {
			...e,
			kvp: r
		};
	}, {});
	return {
		title: K(W(n, "Title")),
		name: K(W(n, "ServiceType")),
		abstract: K(W(n, "Abstract")),
		fees: K(W(n, "Fees")),
		constraints: K(W(n, "AccessConstraints")),
		keywords: r,
		provider: pt(e),
		getTileUrls: i
	};
}
function wt(e) {
	function t(e) {
		let t = K(W(e, "TopLeftCorner")).split(" ").map(parseFloat);
		return {
			identifier: K(W(e, "Identifier")),
			tileWidth: parseInt(K(W(e, "TileWidth"))),
			tileHeight: parseInt(K(W(e, "TileHeight"))),
			matrixWidth: parseInt(K(W(e, "MatrixWidth"))),
			matrixHeight: parseInt(K(W(e, "MatrixHeight"))),
			scaleDenominator: parseFloat(K(W(e, "ScaleDenominator"))),
			topLeft: t
		};
	}
	return U(W(V(e), "Contents"), "TileMatrixSet").map((e) => {
		let n = K(W(e, "WellKnownScaleSet")), r = St(W(e, "BoundingBox"));
		return {
			identifier: K(W(e, "Identifier")),
			crs: K(W(e, "SupportedCRS")),
			tileMatrices: U(e, "TileMatrix").map(t),
			...r && { boundingBox: r },
			...n && { wellKnownScaleSet: n }
		};
	});
}
function Tt(e) {
	let t = V(e), n = W(t, "Contents");
	function r(e, t) {
		return K(W(U(e, "TileMatrixSet").find((e) => K(W(e, "Identifier")) === t), "SupportedCRS"));
	}
	function i(e) {
		let t = K(W(e, "TileMatrixSet"));
		return {
			identifier: t,
			crs: r(n, t),
			limits: U(e, "TileMatrixLimits", !0).map((e) => ({
				tileMatrix: K(W(e, "TileMatrix")),
				minTileRow: parseInt(K(W(e, "MinTileRow"))),
				minTileCol: parseInt(K(W(e, "MinTileCol"))),
				maxTileRow: parseInt(K(W(e, "MaxTileRow"))),
				maxTileCol: parseInt(K(W(e, "MaxTileCol")))
			}))
		};
	}
	let a = U(U(W(t, "OperationsMetadata"), "Operation").find((e) => q(e, "name") == "GetTile"), "Get", !0).filter((e) => K(W(e, "Value", !0)).toLowerCase() === "kvp")[0], o = a ? q(a, "xlink:href") : "";
	return U(W(t, "Contents"), "Layer").map((e) => {
		let t = St(W(e, "WGS84BoundingBox")), n = "", r = U(e, "Style").map((e) => {
			let t = q(W(e, "LegendURL"), "xlink:href"), r = K(W(e, "Abstract")), i = {
				title: K(W(e, "Title")),
				name: K(W(e, "Identifier")),
				...r && { abstract: r },
				...t && { legendUrl: t }
			};
			return q(e, "isDefault") === "true" && (n = i.name), i;
		}), a = U(e, "Format").map(K), s = U(e, "ResourceURL").filter((e) => q(e, "resourceType") === "tile").map((e) => ({
			format: q(e, "format"),
			url: q(e, "template"),
			encoding: "REST"
		}));
		o && s.push(...a.map((e) => ({
			encoding: "KVP",
			url: o,
			format: e
		})));
		let c = U(e, "TileMatrixSetLink").map(i), l = U(e, "Dimension").map((e) => ({
			identifier: K(W(e, "Identifier")),
			defaultValue: K(W(e, "Default")),
			values: U(e, "Values").map(K)
		}));
		return {
			name: K(W(e, "Identifier")),
			title: K(W(e, "Title")),
			abstract: K(W(e, "Abstract")),
			styles: r,
			resourceLinks: s,
			matrixSets: c,
			defaultStyle: n,
			...t && { latLonBoundingBox: t },
			...l && { dimensions: l }
		};
	});
}
//#endregion
//#region node_modules/@camptocamp/ogc-client/dist/wfs/featureprops.js
function Et(e, t, n) {
	let r = V(e), i;
	if (n.startsWith("2.0")) i = U(r, "member").map((e) => G(e)[0]);
	else {
		let e = W(r, "featureMembers");
		i = e ? G(e) : U(r, "featureMember").map((e) => G(e)[0]);
	}
	let a = n === "1.0.0" ? "fid" : "gml:id";
	function o(e) {
		return e in t.properties;
	}
	function s(e, n) {
		switch (t.properties[e]) {
			case "integer": return parseInt(n);
			case "float": return parseFloat(n);
			case "boolean": return n === "true";
			default: return n;
		}
	}
	function c(e) {
		return G(e).filter((e) => o(B(H(e)))).reduce((e, t) => {
			let n = B(H(t));
			return {
				...e,
				[n]: s(n, K(t))
			};
		}, {});
	}
	return i.map((e) => ({
		id: q(e, a),
		properties: c(e)
	}));
}
function Dt(e) {
	return e.reduce((e, t) => {
		for (let n in t.properties) {
			let r = t.properties[n];
			n in e || (e[n] = { uniqueValues: [] });
			let i = e[n].uniqueValues.find((e) => e.value === r);
			i ? i.count++ : e[n].uniqueValues.push({
				value: r,
				count: 1
			});
		}
		return e;
	}, {});
}
$("parseWmsCapabilities", globalThis, ({ url: e }) => Y(e).then((t) => ye(t, e)).then((e) => ({
	info: st(e),
	layers: rt(e),
	url: tt(e),
	version: nt(e)
}))), $("parseWfsCapabilities", globalThis, ({ url: e }) => Y(e).then((t) => ye(t, e)).then((e) => ({
	info: _t(e),
	featureTypes: vt(e),
	url: mt(e),
	version: ht(e)
}))), $("queryWfsFeatureTypeDetails", globalThis, ({ url: e, serviceVersion: t, featureTypeFull: n }) => Y(He(e, t, n.name, void 0, void 0, Object.keys(n.properties))).then((e) => ({ props: Dt(Et(e, n, t)) }))), $("updateFetchOptions", globalThis, ({ options: e }) => (Oe(e), Promise.resolve({}))), $("parseWmtsCapabilities", globalThis, ({ url: e }) => Y(e).then((t) => ye(t, e)).then((e) => ({
	info: Ct(e),
	layers: Tt(e),
	matrixSets: wt(e)
})));
//#endregion
export { Oe as a, _e as c, Q as i, ye as l, qe as n, Ae as o, Ge as r, J as s, Xe as t };
