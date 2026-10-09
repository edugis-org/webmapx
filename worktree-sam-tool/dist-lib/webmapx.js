import { l as e, o as t, t as n, u as r } from "./tool-registry-DwdDkYMx.js";
import { c as i, d as a, h as o, p as s, s as c } from "./decorators-d8E4nZJy.js";
import { c as l, s as u } from "./decorate-CjQrowRB.js";
import { t as d } from "./webmapx-base-tool-CoutX2Sw.js";
import { t as f } from "./webmapx-modal-tool-BYZX-Eb9.js";
import { t as p } from "./validator-C1ADOs-P.js";
import { n as m } from "./apikeys-DFtVEG81.js";
import { n as h } from "./chunk.3Y6SB6QS-DUJ8Ickw.js";
//#region src/bootstrap/engine-loader.ts
var g = {
	maplibre: () => import("./maplibre-adapter-CPnl7pON.js"),
	openlayers: () => import("./openlayers-adapter-vPZhprEx.js"),
	leaflet: () => import("./leaflet-adapter-VGThvF6r.js"),
	cesium: () => import("./cesium-adapter-f0wUeFNC.js")
};
async function _(e) {
	let t = g[e];
	if (!t) throw Error(`[webmapx] Unknown engine: "${e}". Valid: ${Object.keys(g).join(", ")}`);
	await t();
}
//#endregion
//#region src/bootstrap/tool-loader.ts
var v = {
	draw: () => import("./webmapx-draw-tool-CcaGiPcL.js"),
	measure: () => import("./webmapx-measure-tool-C3QgBa8A.js"),
	print: () => import("./webmapx-print-tool-oPfuQ50l.js"),
	"import-layer": () => import("./webmapx-import-layer-tool-BtVEIr1D.js"),
	search: () => import("./webmapx-search-tool-tmfcH-qY.js"),
	geolocation: () => import("./webmapx-geolocation-tool-Ca-zE6ye.js"),
	info: () => import("./webmapx-info-tool-DbhlAS6R.js"),
	maplanguage: () => import("./webmapx-language-osmvector-BT6rsGoN.js"),
	"3d": () => import("./webmapx-3d-tool-dRcoGDvT.js"),
	truearea: () => import("./webmapx-truearea-tool-aMDCZTJD.js"),
	projection: () => import("./webmapx-projection-tool-DUls_Wue.js"),
	timeSlider: () => import("./webmapx-time-slider-tool-DNWENav7.js"),
	deeptime: () => import("./webmapx-deeptime-tool-C4RPKZi0.js"),
	sealevel: () => import("./webmapx-sealevel-tool-cCyQ-Oqx.js"),
	compare: () => import("./webmapx-compare-tool-0hdF8dhY.js"),
	cartogram: () => import("./webmapx-cartogram-tool-Dz2-AxMw.js"),
	coordinates: () => import("./webmapx-coordinates-tool-CJmJT7h4.js"),
	settings: () => import("./webmapx-settings-BYV1DirV.js"),
	routing: () => import("./webmapx-routing-tool-oBjRcjxY.js"),
	isochrone: () => import("./webmapx-isochrone-tool-C9-D5Vyn.js"),
	buffer: () => import("./webmapx-buffer-tool-cAgVmL8V.js"),
	geoprocessing: () => import("./webmapx-geoprocessing-tool-DzSOMtML.js"),
	segment: () => import("./webmapx-segment-tool-B4fLIBBU.js"),
	"data-analyzer": () => import("./webmapx-data-analyzer-tool-BIv1YE3T.js"),
	"config-edit": () => import("./webmapx-config-edit-tool-Cee2GIB6.js"),
	stories: () => import("./webmapx-stories-tool-CISP8pCO.js"),
	layerLegend3d: () => import("./webmapx-layer-legend3d-Czbx_BDm.js")
};
async function y(r) {
	await import("./webmapx-core-bundle-D4SsA5zi.js"), await Promise.all(r.map((r) => {
		let i = e(r), a = v[i];
		return a ? a() : (!n.has(i) && !t.has(i) && console.warn(`[webmapx] Unknown tool: "${r}" — skipped`), Promise.resolve());
	}));
}
function b(e) {
	if (!e) return [];
	let t = [], n = (e, r) => {
		if (typeof e.type == "string" ? e.type !== "toolbar" && t.push(e.type) : r !== null && t.push(r), Array.isArray(e.items)) for (let t of e.items) t && typeof t == "object" && n(t, null);
	};
	for (let [t, r] of Object.entries(e)) !r || typeof r != "object" || n(r, t);
	return t;
}
//#endregion
//#region node_modules/i18next/dist/esm/i18next.js
var x = (e) => typeof e == "string", S = () => {
	let e, t, n = new Promise((n, r) => {
		e = n, t = r;
	});
	return n.resolve = e, n.reject = t, n;
}, C = (e) => e == null ? "" : String(e), w = (e, t, n) => {
	e.forEach((e) => {
		t[e] && (n[e] = t[e]);
	});
}, T = /###/g, E = (e) => e && e.includes("###") ? e.replace(T, ".") : e, D = (e) => !e || x(e), O = (e, t, n) => {
	let r = x(t) ? t.split(".") : t, i = 0;
	for (; i < r.length - 1;) {
		if (D(e)) return {};
		let t = E(r[i]);
		!e[t] && n && (e[t] = new n()), e = Object.prototype.hasOwnProperty.call(e, t) ? e[t] : {}, ++i;
	}
	return D(e) ? {} : {
		obj: e,
		k: E(r[i])
	};
}, k = (e, t, n) => {
	let { obj: r, k: i } = O(e, t, Object);
	if (r !== void 0 || t.length === 1) {
		r[i] = n;
		return;
	}
	let a = t[t.length - 1], o = t.slice(0, t.length - 1), s = O(e, o, Object);
	for (; s.obj === void 0 && o.length;) a = `${o[o.length - 1]}.${a}`, o = o.slice(0, o.length - 1), s = O(e, o, Object), s?.obj && s.obj[`${s.k}.${a}`] !== void 0 && (s.obj = void 0);
	s.obj[`${s.k}.${a}`] = n;
}, A = (e, t, n, r) => {
	let { obj: i, k: a } = O(e, t, Object);
	i[a] = i[a] || [], i[a].push(n);
}, j = (e, t) => {
	let { obj: n, k: r } = O(e, t);
	if (n && Object.prototype.hasOwnProperty.call(n, r)) return n[r];
}, ee = (e, t, n) => {
	let r = j(e, n);
	return r === void 0 ? j(t, n) : r;
}, te = (e, t, n) => {
	for (let r in t) r !== "__proto__" && r !== "constructor" && (r in e ? x(e[r]) || e[r] instanceof String || x(t[r]) || t[r] instanceof String ? n && (e[r] = t[r]) : te(e[r], t[r], n) : e[r] = t[r]);
	return e;
}, M = (e) => e.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), ne = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;",
	"/": "&#x2F;"
}, re = (e) => x(e) ? e.replace(/[&<>"'\/]/g, (e) => ne[e]) : e, ie = class {
	constructor(e) {
		this.capacity = e, this.regExpMap = /* @__PURE__ */ new Map(), this.regExpQueue = [];
	}
	getRegExp(e) {
		let t = this.regExpMap.get(e);
		if (t !== void 0) return t;
		let n = new RegExp(e);
		return this.regExpQueue.length === this.capacity && this.regExpMap.delete(this.regExpQueue.shift()), this.regExpMap.set(e, n), this.regExpQueue.push(e), n;
	}
}, ae = [
	" ",
	",",
	"?",
	"!",
	";"
], oe = new ie(20), se = (e, t, n) => {
	t ||= "", n ||= "";
	let r = ae.filter((e) => !t.includes(e) && !n.includes(e));
	if (r.length === 0) return !0;
	let i = oe.getRegExp(`(${r.map((e) => e === "?" ? "\\?" : e).join("|")})`), a = !i.test(e);
	if (!a) {
		let t = e.indexOf(n);
		t > 0 && !i.test(e.substring(0, t)) && (a = !0);
	}
	return a;
}, N = (e, t, n = ".") => {
	if (!e) return;
	if (e[t]) return Object.prototype.hasOwnProperty.call(e, t) ? e[t] : void 0;
	let r = t.split(n), i = e;
	for (let e = 0; e < r.length;) {
		if (!i || typeof i != "object") return;
		let t, a = "";
		for (let o = e; o < r.length; ++o) if (o !== e && (a += n), a += r[o], t = i[a], t !== void 0) {
			if ([
				"string",
				"number",
				"boolean"
			].includes(typeof t) && o < r.length - 1) continue;
			e += o - e + 1;
			break;
		}
		i = t;
	}
	return i;
}, P = (e) => e?.replace(/_/g, "-"), ce = {
	type: "logger",
	log(e) {
		this.output("log", e);
	},
	warn(e) {
		this.output("warn", e);
	},
	error(e) {
		this.output("error", e);
	},
	output(e, t) {
		console?.[e]?.apply?.(console, t);
	}
}, F = new class e {
	constructor(e, t = {}) {
		this.init(e, t);
	}
	init(e, t = {}) {
		this.prefix = t.prefix || "i18next:", this.logger = e || ce, this.options = t, this.debug = t.debug;
	}
	log(...e) {
		return this.forward(e, "log", "", !0);
	}
	warn(...e) {
		return this.forward(e, "warn", "", !0);
	}
	error(...e) {
		return this.forward(e, "error", "");
	}
	deprecate(...e) {
		return this.forward(e, "warn", "WARNING DEPRECATED: ", !0);
	}
	forward(e, t, n, r) {
		return r && !this.debug ? null : (e = e.map((e) => x(e) ? e.replace(/[\r\n\x00-\x1F\x7F]/g, " ") : e), x(e[0]) && (e[0] = `${n}${this.prefix} ${e[0]}`), this.logger[t](e));
	}
	create(t) {
		return new e(this.logger, {
			prefix: `${this.prefix}:${t}:`,
			...this.options
		});
	}
	clone(t) {
		return t ||= this.options, t.prefix = t.prefix || this.prefix, new e(this.logger, t);
	}
}(), I = class {
	constructor() {
		this.observers = {};
	}
	on(e, t) {
		return e.split(" ").forEach((e) => {
			this.observers[e] || (this.observers[e] = /* @__PURE__ */ new Map());
			let n = this.observers[e].get(t) || 0;
			this.observers[e].set(t, n + 1);
		}), this;
	}
	off(e, t) {
		if (this.observers[e]) {
			if (!t) {
				delete this.observers[e];
				return;
			}
			this.observers[e].delete(t);
		}
	}
	once(e, t) {
		let n = (...r) => {
			t(...r), this.off(e, n);
		};
		return this.on(e, n), this;
	}
	emit(e, ...t) {
		this.observers[e] && Array.from(this.observers[e].entries()).forEach(([e, n]) => {
			for (let r = 0; r < n; r++) e(...t);
		}), this.observers["*"] && Array.from(this.observers["*"].entries()).forEach(([n, r]) => {
			for (let i = 0; i < r; i++) n(e, ...t);
		});
	}
}, le = class extends I {
	constructor(e, t = {
		ns: ["translation"],
		defaultNS: "translation"
	}) {
		super(), this.data = e || {}, this.options = t, this.options.keySeparator === void 0 && (this.options.keySeparator = "."), this.options.ignoreJSONStructure === void 0 && (this.options.ignoreJSONStructure = !0);
	}
	addNamespaces(e) {
		this.options.ns.includes(e) || this.options.ns.push(e);
	}
	removeNamespaces(e) {
		let t = this.options.ns.indexOf(e);
		t > -1 && this.options.ns.splice(t, 1);
	}
	getResource(e, t, n, r = {}) {
		let i = r.keySeparator === void 0 ? this.options.keySeparator : r.keySeparator, a = r.ignoreJSONStructure === void 0 ? this.options.ignoreJSONStructure : r.ignoreJSONStructure, o;
		e.includes(".") ? o = e.split(".") : (o = [e, t], n && (Array.isArray(n) ? o.push(...n) : x(n) && i ? o.push(...n.split(i)) : o.push(n)));
		let s = j(this.data, o);
		return !s && !t && !n && e.includes(".") && (e = o[0], t = o[1], n = o.slice(2).join(".")), s || !a || !x(n) ? s : N(this.data?.[e]?.[t], n, i);
	}
	addResource(e, t, n, r, i = { silent: !1 }) {
		let a = i.keySeparator === void 0 ? this.options.keySeparator : i.keySeparator, o = [e, t];
		n && (o = o.concat(a ? n.split(a) : n)), e.includes(".") && (o = e.split("."), r = t, t = o[1]), this.addNamespaces(t), k(this.data, o, r), i.silent || this.emit("added", e, t, n, r);
	}
	addResources(e, t, n, r = { silent: !1 }) {
		for (let r in n) (x(n[r]) || Array.isArray(n[r])) && this.addResource(e, t, r, n[r], { silent: !0 });
		r.silent || this.emit("added", e, t, n);
	}
	addResourceBundle(e, t, n, r, i, a = {
		silent: !1,
		skipCopy: !1
	}) {
		let o = [e, t];
		e.includes(".") && (o = e.split("."), r = n, n = t, t = o[1]), this.addNamespaces(t);
		let s = j(this.data, o) || {};
		a.skipCopy || (n = JSON.parse(JSON.stringify(n))), r ? te(s, n, i) : s = {
			...s,
			...n
		}, k(this.data, o, s), a.silent || this.emit("added", e, t, n);
	}
	removeResourceBundle(e, t) {
		this.hasResourceBundle(e, t) && delete this.data[e][t], this.removeNamespaces(t), this.emit("removed", e, t);
	}
	hasResourceBundle(e, t) {
		return this.getResource(e, t) !== void 0;
	}
	getResourceBundle(e, t) {
		return t ||= this.options.defaultNS, this.getResource(e, t);
	}
	getDataByLanguage(e) {
		return this.data[e];
	}
	hasLanguageSomeTranslations(e) {
		let t = this.getDataByLanguage(e);
		return !!(t && Object.keys(t) || []).find((e) => t[e] && Object.keys(t[e]).length > 0);
	}
	toJSON() {
		return this.data;
	}
}, ue = {
	processors: {},
	addPostProcessor(e) {
		this.processors[e.name] = e;
	},
	handle(e, t, n, r, i) {
		return e.forEach((e) => {
			t = this.processors[e]?.process(t, n, r, i) ?? t;
		}), t;
	}
}, de = Symbol("i18next/PATH_KEY");
function fe() {
	let e = [], t = Object.create(null), n;
	return t.get = (r, i) => (n?.revoke?.(), i === de ? e : (e.push(i), n = Proxy.revocable(r, t), n.proxy)), Proxy.revocable(Object.create(null), t).proxy;
}
function L(e, t) {
	let { [de]: n } = e(fe()), r = t?.keySeparator ?? ".", i = t?.nsSeparator ?? ":", a = t?.enableSelector === "strict";
	if (n.length > 1 && i) {
		let e = t?.ns, o = a ? Array.isArray(e) ? e : e ? [e] : null : Array.isArray(e) ? e : null;
		if (o && (a ? o : o.length > 1 ? o.slice(1) : []).includes(n[0])) return `${n[0]}${i}${n.slice(1).join(r)}`;
	}
	return n.join(r);
}
var R = (e) => !x(e) && typeof e != "boolean" && typeof e != "number", z = class e extends I {
	constructor(e, t = {}) {
		super(), w([
			"resourceStore",
			"languageUtils",
			"pluralResolver",
			"interpolator",
			"backendConnector",
			"i18nFormat",
			"utils"
		], e, this), this.options = t, this.options.keySeparator === void 0 && (this.options.keySeparator = "."), this.logger = F.create("translator"), this.checkedLoadedFor = {};
	}
	changeLanguage(e) {
		e && (this.language = e);
	}
	exists(e, t = { interpolation: {} }) {
		let n = { ...t };
		if (e == null) return !1;
		let r = this.resolve(e, n);
		if (r?.res === void 0) return !1;
		let i = R(r.res);
		return !(n.returnObjects === !1 && i);
	}
	extractFromKey(e, t) {
		let n = t.nsSeparator === void 0 ? this.options.nsSeparator : t.nsSeparator;
		n === void 0 && (n = ":");
		let r = t.keySeparator === void 0 ? this.options.keySeparator : t.keySeparator, i = t.ns || this.options.defaultNS || [], a = n && e.includes(n), o = !this.options.userDefinedKeySeparator && !t.keySeparator && !this.options.userDefinedNsSeparator && !t.nsSeparator && !se(e, n, r);
		if (a && !o) {
			let t = e.match(this.interpolator.nestingRegexp);
			if (t && t.length > 0) return {
				key: e,
				namespaces: x(i) ? [i] : i
			};
			let a = e.split(n);
			(n !== r || n === r && this.options.ns.includes(a[0])) && (i = a.shift()), e = a.join(r);
		}
		return {
			key: e,
			namespaces: x(i) ? [i] : i
		};
	}
	translate(t, n, r) {
		let i = typeof n == "object" ? { ...n } : n;
		if (typeof i != "object" && this.options.overloadTranslationOptionHandler && (i = this.options.overloadTranslationOptionHandler(arguments)), typeof i == "object" && (i = { ...i }), i ||= {}, t == null) return "";
		typeof t == "function" && (t = L(t, {
			...this.options,
			...i
		})), Array.isArray(t) || (t = [String(t)]), t = t.map((e) => typeof e == "function" ? L(e, {
			...this.options,
			...i
		}) : String(e));
		let a = i.returnDetails === void 0 ? this.options.returnDetails : i.returnDetails, o = i.keySeparator === void 0 ? this.options.keySeparator : i.keySeparator, { key: s, namespaces: c } = this.extractFromKey(t[t.length - 1], i), l = c[c.length - 1], u = i.nsSeparator === void 0 ? this.options.nsSeparator : i.nsSeparator;
		u === void 0 && (u = ":");
		let d = i.lng || this.language, f = i.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;
		if (d?.toLowerCase() === "cimode") return f ? a ? {
			res: `${l}${u}${s}`,
			usedKey: s,
			exactUsedKey: s,
			usedLng: d,
			usedNS: l,
			usedParams: this.getUsedParamsDetails(i)
		} : `${l}${u}${s}` : a ? {
			res: s,
			usedKey: s,
			exactUsedKey: s,
			usedLng: d,
			usedNS: l,
			usedParams: this.getUsedParamsDetails(i)
		} : s;
		let p = this.resolve(t, i), m = p?.res, h = p?.usedKey || s, g = p?.exactUsedKey || s, _ = [
			"[object Number]",
			"[object Function]",
			"[object RegExp]"
		], v = i.joinArrays === void 0 ? this.options.joinArrays : i.joinArrays, y = !this.i18nFormat || this.i18nFormat.handleAsObject, b = i.count !== void 0 && !x(i.count), S = e.hasDefaultValue(i), C = b ? this.pluralResolver.getSuffix(d, i.count, i) : "", w = i.ordinal && b ? this.pluralResolver.getSuffix(d, i.count, { ordinal: !1 }) : "", T = b && !i.ordinal && i.count === 0, E = T && i[`defaultValue${this.options.pluralSeparator}zero`] || i[`defaultValue${C}`] || i[`defaultValue${w}`] || i.defaultValue, D = m;
		y && !m && S && (D = E);
		let O = R(D), k = Object.prototype.toString.apply(D);
		if (y && D && O && !_.includes(k) && !(x(v) && Array.isArray(D))) {
			if (!i.returnObjects && !this.options.returnObjects) {
				this.options.returnedObjectHandler || this.logger.warn("accessing an object - but returnObjects options is not enabled!");
				let e = this.options.returnedObjectHandler ? this.options.returnedObjectHandler(h, D, {
					...i,
					ns: c
				}) : `key '${s} (${this.language})' returned an object instead of string.`;
				return a ? (p.res = e, p.usedParams = this.getUsedParamsDetails(i), p) : e;
			}
			if (o) {
				let e = Array.isArray(D), t = e ? [] : {}, n = e ? g : h;
				for (let e in D) if (Object.prototype.hasOwnProperty.call(D, e)) {
					let r = `${n}${o}${e}`;
					S && !m ? t[e] = this.translate(r, {
						...i,
						defaultValue: R(E) ? E[e] : void 0,
						joinArrays: !1,
						ns: c
					}) : t[e] = this.translate(r, {
						...i,
						joinArrays: !1,
						ns: c
					}), t[e] === r && (t[e] = D[e]);
				}
				m = t;
			}
		} else if (y && x(v) && Array.isArray(m)) m = m.join(v), m &&= this.extendTranslation(m, t, i, r);
		else {
			let e = !1, n = !1;
			!this.isValidLookup(m) && S && (e = !0, m = E), this.isValidLookup(m) || (n = !0, m = s);
			let a = (i.missingKeyNoValueFallbackToKey || this.options.missingKeyNoValueFallbackToKey) && n ? void 0 : m, c = S && E !== m && this.options.updateMissing;
			if (n || e || c) {
				if (this.logger.log(c ? "updateKey" : "missingKey", d, l, b && !c ? `${s}${this.pluralResolver.getSuffix(d, i.count, i)}` : s, c ? E : m), o) {
					let e = this.resolve(s, {
						...i,
						keySeparator: !1
					});
					e && e.res && this.logger.warn("Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.");
				}
				let e = [], t = this.languageUtils.getFallbackCodes(this.options.fallbackLng, i.lng || this.language);
				if (this.options.saveMissingTo === "fallback" && t && t[0]) for (let n = 0; n < t.length; n++) e.push(t[n]);
				else this.options.saveMissingTo === "all" ? e = this.languageUtils.toResolveHierarchy(i.lng || this.language) : e.push(i.lng || this.language);
				let n = (e, t, n) => {
					let r = S && n !== m ? n : a;
					this.options.missingKeyHandler ? this.options.missingKeyHandler(e, l, t, r, c, i) : this.backendConnector?.saveMissing && this.backendConnector.saveMissing(e, l, t, r, c, i), this.emit("missingKey", e, l, t, m);
				};
				this.options.saveMissing && (this.options.saveMissingPlurals && b ? e.forEach((e) => {
					let t = this.pluralResolver.getSuffixes(e, i);
					T && i[`defaultValue${this.options.pluralSeparator}zero`] && !t.includes(`${this.options.pluralSeparator}zero`) && t.push(`${this.options.pluralSeparator}zero`), t.forEach((t) => {
						n([e], s + t, i[`defaultValue${t}`] || E);
					});
				}) : n(e, s, E));
			}
			m = this.extendTranslation(m, t, i, p, r), n && m === s && this.options.appendNamespaceToMissingKey && (m = `${l}${u}${s}`), (n || e) && this.options.parseMissingKeyHandler && (m = this.options.parseMissingKeyHandler(this.options.appendNamespaceToMissingKey ? `${l}${u}${s}` : s, e ? m : void 0, i));
		}
		return a ? (p.res = m, p.usedParams = this.getUsedParamsDetails(i), p) : m;
	}
	extendTranslation(e, t, n, r, i) {
		if (this.i18nFormat?.parse) e = this.i18nFormat.parse(e, {
			...this.options.interpolation.defaultVariables,
			...n
		}, n.lng || this.language || r.usedLng, r.usedNS, r.usedKey, { resolved: r });
		else if (!n.skipInterpolation) {
			n.interpolation && this.interpolator.init({
				...n,
				interpolation: {
					...this.options.interpolation,
					...n.interpolation
				}
			});
			let a = x(e) && (n?.interpolation?.skipOnVariables === void 0 ? this.options.interpolation.skipOnVariables : n.interpolation.skipOnVariables), o;
			if (a) {
				let t = e.match(this.interpolator.nestingRegexp);
				o = t && t.length;
			}
			let s = n.replace && !x(n.replace) ? n.replace : n;
			if (this.options.interpolation.defaultVariables && (s = {
				...this.options.interpolation.defaultVariables,
				...s
			}), e = this.interpolator.interpolate(e, s, n.lng || this.language || r.usedLng, n), a) {
				let t = e.match(this.interpolator.nestingRegexp), r = t && t.length;
				o < r && (n.nest = !1);
			}
			!n.lng && r && r.res && (n.lng = this.language || r.usedLng), n.nest !== !1 && (e = this.interpolator.nest(e, (...e) => i?.[0] === e[0] && !n.context ? (this.logger.warn(`It seems you are nesting recursively key: ${e[0]} in key: ${t[0]}`), null) : this.translate(...e, t), n)), n.interpolation && this.interpolator.reset();
		}
		let a = n.postProcess || this.options.postProcess, o = x(a) ? [a] : a;
		return e != null && o?.length && n.applyPostProcessor !== !1 && (e = ue.handle(o, e, t, this.options && this.options.postProcessPassResolved ? {
			i18nResolved: {
				...r,
				usedParams: this.getUsedParamsDetails(n)
			},
			...n
		} : n, this)), e;
	}
	resolve(e, t = {}) {
		let n, r, i, a, o;
		return x(e) && (e = [e]), Array.isArray(e) && (e = e.map((e) => typeof e == "function" ? L(e, {
			...this.options,
			...t
		}) : e)), e.forEach((e) => {
			if (this.isValidLookup(n)) return;
			let s = this.extractFromKey(e, t), c = s.key;
			r = c;
			let l = s.namespaces;
			this.options.fallbackNS && (l = l.concat(this.options.fallbackNS));
			let u = t.count !== void 0 && !x(t.count), d = u && !t.ordinal && t.count === 0, f = t.context !== void 0 && (x(t.context) || typeof t.context == "number") && t.context !== "", p = t.lngs ? t.lngs : this.languageUtils.toResolveHierarchy(t.lng || this.language, t.fallbackLng);
			l.forEach((e) => {
				this.isValidLookup(n) || (o = e, !this.checkedLoadedFor[`${p[0]}-${e}`] && this.utils?.hasLoadedNamespace && !this.utils?.hasLoadedNamespace(o) && (this.checkedLoadedFor[`${p[0]}-${e}`] = !0, this.logger.warn(`key "${r}" for languages "${p.join(", ")}" won't get resolved as namespace "${o}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!")), p.forEach((r) => {
					if (this.isValidLookup(n)) return;
					a = r;
					let o = [c];
					if (this.i18nFormat?.addLookupKeys) this.i18nFormat.addLookupKeys(o, c, r, e, t);
					else {
						let e;
						u && (e = this.pluralResolver.getSuffix(r, t.count, t));
						let n = `${this.options.pluralSeparator}zero`, i = `${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;
						if (u && (t.ordinal && e.startsWith(i) && o.push(c + e.replace(i, this.options.pluralSeparator)), o.push(c + e), d && o.push(c + n)), f) {
							let r = `${c}${this.options.contextSeparator || "_"}${t.context}`;
							o.push(r), u && (t.ordinal && e.startsWith(i) && o.push(r + e.replace(i, this.options.pluralSeparator)), o.push(r + e), d && o.push(r + n));
						}
					}
					let s;
					for (; s = o.pop();) this.isValidLookup(n) || (i = s, n = this.getResource(r, e, s, t));
				}));
			});
		}), {
			res: n,
			usedKey: r,
			exactUsedKey: i,
			usedLng: a,
			usedNS: o
		};
	}
	isValidLookup(e) {
		return e !== void 0 && !(!this.options.returnNull && e === null) && !(!this.options.returnEmptyString && e === "");
	}
	getResource(e, t, n, r = {}) {
		return this.i18nFormat?.getResource ? this.i18nFormat.getResource(e, t, n, r) : this.resourceStore.getResource(e, t, n, r);
	}
	getUsedParamsDetails(e = {}) {
		let t = [
			"defaultValue",
			"ordinal",
			"context",
			"replace",
			"lng",
			"lngs",
			"fallbackLng",
			"ns",
			"keySeparator",
			"nsSeparator",
			"returnObjects",
			"returnDetails",
			"joinArrays",
			"postProcess",
			"interpolation"
		], n = e.replace && !x(e.replace), r = n ? e.replace : e;
		if (n && e.count !== void 0 && (r.count = e.count), this.options.interpolation.defaultVariables && (r = {
			...this.options.interpolation.defaultVariables,
			...r
		}), !n) {
			r = { ...r };
			for (let e of t) delete r[e];
		}
		return r;
	}
	static hasDefaultValue(e) {
		for (let t in e) if (Object.prototype.hasOwnProperty.call(e, t) && t.startsWith("defaultValue") && e[t] !== void 0) return !0;
		return !1;
	}
}, B = class {
	constructor(e) {
		this.options = e, this.supportedLngs = this.options.supportedLngs || !1, this.logger = F.create("languageUtils");
	}
	getScriptPartFromCode(e) {
		if (e = P(e), !e || !e.includes("-")) return null;
		let t = e.split("-");
		return t.length === 2 || (t.pop(), t[t.length - 1].toLowerCase() === "x") ? null : this.formatLanguageCode(t.join("-"));
	}
	getLanguagePartFromCode(e) {
		if (e = P(e), !e || !e.includes("-")) return e;
		let t = e.split("-");
		return this.formatLanguageCode(t[0]);
	}
	formatLanguageCode(e) {
		if (x(e) && e.includes("-")) {
			let t;
			try {
				t = Intl.getCanonicalLocales(e)[0];
			} catch {}
			return t && this.options.lowerCaseLng && (t = t.toLowerCase()), t || (this.options.lowerCaseLng ? e.toLowerCase() : e);
		}
		return this.options.cleanCode || this.options.lowerCaseLng ? e.toLowerCase() : e;
	}
	isSupportedCode(e) {
		return (this.options.load === "languageOnly" || this.options.nonExplicitSupportedLngs) && (e = this.getLanguagePartFromCode(e)), !this.supportedLngs || !this.supportedLngs.length || this.supportedLngs.includes(e);
	}
	getBestMatchFromCodes(e) {
		if (!e) return null;
		let t;
		return e.forEach((e) => {
			if (t) return;
			let n = this.formatLanguageCode(e);
			(!this.options.supportedLngs || this.isSupportedCode(n)) && (t = n);
		}), !t && this.options.supportedLngs && e.forEach((e) => {
			if (t) return;
			let n = this.getScriptPartFromCode(e);
			if (this.isSupportedCode(n)) return t = n;
			let r = this.getLanguagePartFromCode(e);
			if (this.isSupportedCode(r)) return t = r;
			t = this.options.supportedLngs.find((e) => e === r ? !0 : !e.includes("-") && !r.includes("-") ? !1 : !!(e.includes("-") && !r.includes("-") && e.slice(0, e.indexOf("-")) === r || e.startsWith(r) && r.length > 1));
		}), t ||= this.getFallbackCodes(this.options.fallbackLng)[0], t;
	}
	getFallbackCodes(e, t) {
		if (!e) return [];
		if (typeof e == "function" && (e = e(t)), x(e) && (e = [e]), Array.isArray(e)) return e;
		if (!t) return e.default || [];
		let n = e[t];
		return n ||= e[this.getScriptPartFromCode(t)], n ||= e[this.formatLanguageCode(t)], n ||= e[this.getLanguagePartFromCode(t)], n ||= e.default, n || [];
	}
	toResolveHierarchy(e, t) {
		let n = this.getFallbackCodes((t === !1 ? [] : t) || this.options.fallbackLng || [], e), r = [], i = (e) => {
			e && (this.isSupportedCode(e) ? r.push(e) : this.logger.warn(`rejecting language code not found in supportedLngs: ${e}`));
		};
		return x(e) && (e.includes("-") || e.includes("_")) ? (this.options.load !== "languageOnly" && i(this.formatLanguageCode(e)), this.options.load !== "languageOnly" && this.options.load !== "currentOnly" && i(this.getScriptPartFromCode(e)), this.options.load !== "currentOnly" && i(this.getLanguagePartFromCode(e))) : x(e) && i(this.formatLanguageCode(e)), n.forEach((e) => {
			r.includes(e) || i(this.formatLanguageCode(e));
		}), r;
	}
}, V = {
	zero: 0,
	one: 1,
	two: 2,
	few: 3,
	many: 4,
	other: 5
}, H = {
	select: (e) => e === 1 ? "one" : "other",
	resolvedOptions: () => ({ pluralCategories: ["one", "other"] })
}, pe = class {
	constructor(e, t = {}) {
		this.languageUtils = e, this.options = t, this.logger = F.create("pluralResolver"), this.pluralRulesCache = {};
	}
	clearCache() {
		this.pluralRulesCache = {};
	}
	getRule(e, t = {}) {
		let n = P(e === "dev" ? "en" : e), r = t.ordinal ? "ordinal" : "cardinal", i = JSON.stringify({
			cleanedCode: n,
			type: r
		});
		if (i in this.pluralRulesCache) return this.pluralRulesCache[i];
		let a;
		try {
			a = new Intl.PluralRules(n, { type: r });
		} catch {
			if (typeof Intl > "u") return this.logger.error("No Intl support, please use an Intl polyfill!"), H;
			if (!e.match(/-|_/)) return H;
			let n = this.languageUtils.getLanguagePartFromCode(e);
			a = this.getRule(n, t);
		}
		return this.pluralRulesCache[i] = a, a;
	}
	needsPlural(e, t = {}) {
		let n = this.getRule(e, t);
		return n ||= this.getRule("dev", t), n?.resolvedOptions().pluralCategories.length > 1;
	}
	getPluralFormsOfKey(e, t, n = {}) {
		return this.getSuffixes(e, n).map((e) => `${t}${e}`);
	}
	getSuffixes(e, t = {}) {
		let n = this.getRule(e, t);
		return n ||= this.getRule("dev", t), n ? n.resolvedOptions().pluralCategories.sort((e, t) => V[e] - V[t]).map((e) => `${this.options.prepend}${t.ordinal ? `ordinal${this.options.prepend}` : ""}${e}`) : [];
	}
	getSuffix(e, t, n = {}) {
		let r = this.getRule(e, n);
		return r ? `${this.options.prepend}${n.ordinal ? `ordinal${this.options.prepend}` : ""}${r.select(t)}` : (this.logger.warn(`no plural rule found for: ${e}`), this.getSuffix("dev", t, n));
	}
}, U = (e, t, n, r = ".", i = !0) => {
	let a = ee(e, t, n);
	return !a && i && x(n) && (a = N(e, n, r), a === void 0 && (a = N(t, n, r))), a;
}, W = (e) => e.replace(/\$/g, "$$$$"), me = class {
	constructor(e = {}) {
		this.logger = F.create("interpolator"), this.options = e, this.format = e?.interpolation?.format || ((e) => e), this.init(e);
	}
	init(e = {}) {
		e.interpolation ||= { escapeValue: !0 };
		let { escape: t, escapeValue: n, useRawValueToEscape: r, prefix: i, prefixEscaped: a, suffix: o, suffixEscaped: s, formatSeparator: c, unescapeSuffix: l, unescapePrefix: u, nestingPrefix: d, nestingPrefixEscaped: f, nestingSuffix: p, nestingSuffixEscaped: m, nestingOptionsSeparator: h, maxReplaces: g, alwaysFormat: _ } = e.interpolation;
		this.escape = t === void 0 ? re : t, this.escapeValue = n === void 0 ? !0 : n, this.useRawValueToEscape = r === void 0 ? !1 : r, this.prefix = i ? M(i) : a || "{{", this.suffix = o ? M(o) : s || "}}", this.formatSeparator = c || ",", this.unescapePrefix = l ? "" : u ? M(u) : "-", this.unescapeSuffix = this.unescapePrefix ? "" : l ? M(l) : "", this.nestingPrefix = d ? M(d) : f || M("$t("), this.nestingSuffix = p ? M(p) : m || M(")"), this.nestingOptionsSeparator = h || ",", this.maxReplaces = g || 1e3, this.alwaysFormat = _ === void 0 ? !1 : _, this.resetRegExp();
	}
	reset() {
		this.options && this.init(this.options);
	}
	resetRegExp() {
		let e = (e, t) => e?.source === t ? (e.lastIndex = 0, e) : new RegExp(t, "g");
		this.regexp = e(this.regexp, `${this.prefix}(.+?)${this.suffix}`), this.regexpUnescape = e(this.regexpUnescape, `${this.prefix}${this.unescapePrefix}(.+?)${this.unescapeSuffix}${this.suffix}`), this.nestingRegexp = e(this.nestingRegexp, `${this.nestingPrefix}((?:[^()"']+|"[^"]*"|'[^']*'|\\((?:[^()]|"[^"]*"|'[^']*')*\\))*?)${this.nestingSuffix}`);
	}
	interpolate(e, t, n, r) {
		let i, a, o, s = this.options && this.options.interpolation && this.options.interpolation.defaultVariables || {}, c = (e) => {
			if (!e.includes(this.formatSeparator)) {
				let i = U(t, s, e, this.options.keySeparator, this.options.ignoreJSONStructure);
				return this.alwaysFormat ? this.format(i, void 0, n, {
					...r,
					...t,
					interpolationkey: e
				}) : i;
			}
			let i = e.split(this.formatSeparator), a = i.shift().trim(), o = i.join(this.formatSeparator).trim();
			return this.format(U(t, s, a, this.options.keySeparator, this.options.ignoreJSONStructure), o, n, {
				...r,
				...t,
				interpolationkey: a
			});
		};
		this.resetRegExp(), !this.escapeValue && typeof e == "string" && /\$t\([^)]*\{[^}]*\{\{/.test(e) && this.logger.warn("nesting options string contains interpolated variables with escapeValue: false — if any of those values are attacker-controlled they can inject additional nesting options (e.g. redirect lng/ns). Sanitise untrusted input before passing it to t(), or keep escapeValue: true.");
		let l = r?.missingInterpolationHandler || this.options.missingInterpolationHandler, u = r?.interpolation?.skipOnVariables === void 0 ? this.options.interpolation.skipOnVariables : r.interpolation.skipOnVariables;
		return [{
			regex: this.regexpUnescape,
			safeValue: (e) => W(e)
		}, {
			regex: this.regexp,
			safeValue: (e) => this.escapeValue ? W(this.escape(e)) : W(e)
		}].forEach((t) => {
			for (o = 0; i = t.regex.exec(e);) {
				let n = i[1].trim();
				if (a = c(n), a === void 0) if (typeof l == "function") {
					let t = l(e, i, r);
					a = x(t) ? t : "";
				} else if (r && Object.prototype.hasOwnProperty.call(r, n)) a = "";
				else if (u) {
					a = i[0];
					continue;
				} else this.logger.warn(`missed to pass in variable ${n} for interpolating ${e}`), a = "";
				else !x(a) && !this.useRawValueToEscape && (a = C(a));
				let s = t.safeValue(a);
				if (e = e.replace(i[0], s), u ? (t.regex.lastIndex += a.length, t.regex.lastIndex -= i[0].length) : t.regex.lastIndex = 0, o++, o >= this.maxReplaces) break;
			}
		}), e;
	}
	nest(e, t, n = {}) {
		let r, i, a, o = (e, t) => {
			let n = this.nestingOptionsSeparator;
			if (!e.includes(n)) return e;
			let r = e.split(RegExp(`${M(n)}[ ]*{`)), i = `{${r[1]}`;
			e = r[0], i = this.interpolate(i, a);
			let o = i.match(/'/g), s = i.match(/"/g);
			((o?.length ?? 0) % 2 == 0 && !s || (s?.length ?? 0) % 2 != 0) && (i = i.replace(/'/g, "\""));
			try {
				a = JSON.parse(i), t && (a = {
					...t,
					...a
				});
			} catch (t) {
				return this.logger.warn(`failed parsing options string in nesting for key ${e}`, t), `${e}${n}${i}`;
			}
			return a.defaultValue && a.defaultValue.includes(this.prefix) && delete a.defaultValue, e;
		};
		for (; r = this.nestingRegexp.exec(e);) {
			let s = [];
			a = { ...n }, a = a.replace && !x(a.replace) ? a.replace : a, a.applyPostProcessor = !1, delete a.defaultValue;
			let c = /{.*}/.test(r[1]) ? r[1].lastIndexOf("}") + 1 : r[1].indexOf(this.formatSeparator);
			if (c !== -1 && (s = r[1].slice(c).split(this.formatSeparator).map((e) => e.trim()).filter(Boolean), r[1] = r[1].slice(0, c)), i = t(o.call(this, r[1].trim(), a), a), i && r[0] === e && !x(i)) return i;
			x(i) || (i = C(i)), i ||= (this.logger.warn(`missed to resolve ${r[1]} for nesting ${e}`), ""), s.length && (i = s.reduce((e, t) => this.format(e, t, n.lng, {
				...n,
				interpolationkey: r[1].trim()
			}), i.trim())), e = e.replace(r[0], i), this.regexp.lastIndex = 0;
		}
		return e;
	}
}, he = (e) => {
	let t = e.toLowerCase().trim(), n = {};
	if (e.includes("(")) {
		let r = e.split("(");
		t = r[0].toLowerCase().trim();
		let i = r[1].slice(0, -1);
		t === "currency" && !i.includes(":") ? n.currency ||= i.trim() : t === "relativetime" && !i.includes(":") ? n.range ||= i.trim() : i.split(";").forEach((e) => {
			if (e) {
				let [t, ...r] = e.split(":"), i = r.join(":").trim().replace(/^'+|'+$/g, ""), a = t.trim();
				n[a] || (n[a] = i), i === "false" && (n[a] = !1), i === "true" && (n[a] = !0), isNaN(i) || (n[a] = parseInt(i, 10));
			}
		});
	}
	return {
		formatName: t,
		formatOptions: n
	};
}, ge = (e) => {
	let t = {};
	return (n, r, i) => {
		let a = i;
		i && i.interpolationkey && i.formatParams && i.formatParams[i.interpolationkey] && i[i.interpolationkey] && (a = {
			...a,
			[i.interpolationkey]: void 0
		});
		let o = r + JSON.stringify(a), s = t[o];
		return s || (s = e(P(r), i), t[o] = s), s(n);
	};
}, _e = (e) => (t, n, r) => e(P(n), r)(t), ve = class {
	constructor(e = {}) {
		this.logger = F.create("formatter"), this.options = e, this.init(e);
	}
	init(e, t = { interpolation: {} }) {
		this.formatSeparator = t.interpolation.formatSeparator || ",";
		let n = t.cacheInBuiltFormats ? ge : _e;
		this.formats = {
			number: n((e, t) => {
				let n = new Intl.NumberFormat(e, { ...t });
				return (e) => n.format(e);
			}),
			currency: n((e, t) => {
				let n = new Intl.NumberFormat(e, {
					...t,
					style: "currency"
				});
				return (e) => n.format(e);
			}),
			datetime: n((e, t) => {
				let n = new Intl.DateTimeFormat(e, { ...t });
				return (e) => n.format(e);
			}),
			relativetime: n((e, t) => {
				let n = new Intl.RelativeTimeFormat(e, { ...t });
				return (e) => n.format(e, t.range || "day");
			}),
			list: n((e, t) => {
				let n = new Intl.ListFormat(e, { ...t });
				return (e) => n.format(e);
			})
		};
	}
	add(e, t) {
		this.formats[e.toLowerCase().trim()] = t;
	}
	addCached(e, t) {
		this.formats[e.toLowerCase().trim()] = ge(t);
	}
	format(e, t, n, r = {}) {
		if (!t || e == null) return e;
		let i = t.split(this.formatSeparator);
		if (i.length > 1 && i[0].indexOf("(") > 1 && !i[0].includes(")") && i.find((e) => e.includes(")"))) {
			let e = i.findIndex((e) => e.includes(")"));
			i[0] = [i[0], ...i.splice(1, e)].join(this.formatSeparator);
		}
		return i.reduce((e, t) => {
			let { formatName: i, formatOptions: a } = he(t);
			if (this.formats[i]) {
				let t = e;
				try {
					let o = r?.formatParams?.[r.interpolationkey] || {}, s = o.locale || o.lng || r.locale || r.lng || n;
					t = this.formats[i](e, s, {
						...a,
						...r,
						...o
					});
				} catch (e) {
					this.logger.warn(e);
				}
				return t;
			} else this.logger.warn(`there was no format function for ${i}`);
			return e;
		}, e);
	}
}, ye = (e, t) => {
	e.pending[t] !== void 0 && (delete e.pending[t], e.pendingCount--);
}, be = class extends I {
	constructor(e, t, n, r = {}) {
		super(), this.backend = e, this.store = t, this.services = n, this.languageUtils = n.languageUtils, this.options = r, this.logger = F.create("backendConnector"), this.waitingReads = [], this.maxParallelReads = r.maxParallelReads || 10, this.readingCalls = 0, this.maxRetries = r.maxRetries >= 0 ? r.maxRetries : 5, this.retryTimeout = r.retryTimeout >= 1 ? r.retryTimeout : 350, this.state = {}, this.queue = [], this.backend?.init?.(n, r.backend, r);
	}
	queueLoad(e, t, n, r) {
		let i = {}, a = {}, o = {}, s = {};
		return e.forEach((e) => {
			let r = !0;
			t.forEach((t) => {
				let o = `${e}|${t}`;
				!n.reload && this.store.hasResourceBundle(e, t) ? this.state[o] = 2 : this.state[o] < 0 || (this.state[o] === 1 ? a[o] === void 0 && (a[o] = !0) : (this.state[o] = 1, r = !1, a[o] === void 0 && (a[o] = !0), i[o] === void 0 && (i[o] = !0), s[t] === void 0 && (s[t] = !0)));
			}), r || (o[e] = !0);
		}), (Object.keys(i).length || Object.keys(a).length) && this.queue.push({
			pending: a,
			pendingCount: Object.keys(a).length,
			loaded: {},
			errors: [],
			callback: r
		}), {
			toLoad: Object.keys(i),
			pending: Object.keys(a),
			toLoadLanguages: Object.keys(o),
			toLoadNamespaces: Object.keys(s)
		};
	}
	loaded(e, t, n) {
		let r = e.split("|"), i = r[0], a = r[1];
		t && this.emit("failedLoading", i, a, t), !t && n && this.store.addResourceBundle(i, a, n, void 0, void 0, { skipCopy: !0 }), this.state[e] = t ? -1 : 2, t && n && (this.state[e] = 0);
		let o = {};
		this.queue.forEach((n) => {
			A(n.loaded, [i], a), ye(n, e), t && n.errors.push(t), n.pendingCount === 0 && !n.done && (Object.keys(n.loaded).forEach((e) => {
				o[e] || (o[e] = {});
				let t = n.loaded[e];
				t.length && t.forEach((t) => {
					o[e][t] === void 0 && (o[e][t] = !0);
				});
			}), n.done = !0, n.errors.length ? n.callback(n.errors) : n.callback());
		}), this.emit("loaded", o), this.queue = this.queue.filter((e) => !e.done);
	}
	read(e, t, n, r = 0, i = this.retryTimeout, a) {
		if (!e.length) return a(null, {});
		if (this.readingCalls >= this.maxParallelReads) {
			this.waitingReads.push({
				lng: e,
				ns: t,
				fcName: n,
				tried: r,
				wait: i,
				callback: a
			});
			return;
		}
		this.readingCalls++;
		let o = (o, s) => {
			if (this.readingCalls--, this.waitingReads.length > 0) {
				let e = this.waitingReads.shift();
				this.read(e.lng, e.ns, e.fcName, e.tried, e.wait, e.callback);
			}
			if (o && s && r < this.maxRetries) {
				setTimeout(() => {
					this.read(e, t, n, r + 1, i * 2, a);
				}, i);
				return;
			}
			a(o, s);
		}, s = this.backend[n].bind(this.backend);
		if (s.length === 2) {
			try {
				let n = s(e, t);
				n && typeof n.then == "function" ? n.then((e) => o(null, e)).catch(o) : o(null, n);
			} catch (e) {
				o(e);
			}
			return;
		}
		return s(e, t, o);
	}
	prepareLoading(e, t, n = {}, r) {
		if (!this.backend) return this.logger.warn("No backend was added via i18next.use. Will not load resources."), r && r();
		x(e) && (e = this.languageUtils.toResolveHierarchy(e)), x(t) && (t = [t]);
		let i = this.queueLoad(e, t, n, r);
		if (!i.toLoad.length) return i.pending.length || r(), null;
		i.toLoad.forEach((e) => {
			this.loadOne(e);
		});
	}
	load(e, t, n) {
		this.prepareLoading(e, t, {}, n);
	}
	reload(e, t, n) {
		this.prepareLoading(e, t, { reload: !0 }, n);
	}
	loadOne(e, t = "") {
		let n = e.split("|"), r = n[0], i = n[1];
		this.read(r, i, "read", void 0, void 0, (n, a) => {
			n && this.logger.warn(`${t}loading namespace ${i} for language ${r} failed`, n), !n && a && this.logger.log(`${t}loaded namespace ${i} for language ${r}`, a), this.loaded(e, n, a);
		});
	}
	saveMissing(e, t, n, r, i, a = {}, o = () => {}) {
		if (this.services?.utils?.hasLoadedNamespace && !this.services?.utils?.hasLoadedNamespace(t)) {
			this.logger.warn(`did not save key "${n}" as the namespace "${t}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
			return;
		}
		if (!(n == null || n === "")) {
			if (this.backend?.create) {
				let s = {
					...a,
					isUpdate: i
				}, c = this.backend.create.bind(this.backend);
				if (c.length < 6) try {
					let i;
					i = c.length === 5 ? c(e, t, n, r, s) : c(e, t, n, r), i && typeof i.then == "function" ? i.then((e) => o(null, e)).catch(o) : o(null, i);
				} catch (e) {
					o(e);
				}
				else c(e, t, n, r, o, s);
			}
			!e || !e[0] || this.store.addResource(e[0], t, n, r);
		}
	}
}, G = () => ({
	debug: !1,
	initAsync: !0,
	ns: ["translation"],
	defaultNS: ["translation"],
	fallbackLng: ["dev"],
	fallbackNS: !1,
	supportedLngs: !1,
	nonExplicitSupportedLngs: !1,
	load: "all",
	preload: !1,
	keySeparator: ".",
	nsSeparator: ":",
	pluralSeparator: "_",
	contextSeparator: "_",
	enableSelector: !1,
	partialBundledLanguages: !1,
	saveMissing: !1,
	updateMissing: !1,
	saveMissingTo: "fallback",
	saveMissingPlurals: !0,
	missingKeyHandler: !1,
	missingInterpolationHandler: !1,
	postProcess: !1,
	postProcessPassResolved: !1,
	returnNull: !1,
	returnEmptyString: !0,
	returnObjects: !1,
	joinArrays: !1,
	returnedObjectHandler: !1,
	parseMissingKeyHandler: !1,
	appendNamespaceToMissingKey: !1,
	appendNamespaceToCIMode: !1,
	overloadTranslationOptionHandler: (e) => {
		let t = {};
		if (typeof e[1] == "object" && (t = e[1]), x(e[1]) && (t.defaultValue = e[1]), x(e[2]) && (t.tDescription = e[2]), typeof e[2] == "object" || typeof e[3] == "object") {
			let n = e[3] || e[2];
			Object.keys(n).forEach((e) => {
				t[e] = n[e];
			});
		}
		return t;
	},
	interpolation: {
		escapeValue: !0,
		prefix: "{{",
		suffix: "}}",
		formatSeparator: ",",
		unescapePrefix: "-",
		nestingPrefix: "$t(",
		nestingSuffix: ")",
		nestingOptionsSeparator: ",",
		maxReplaces: 1e3,
		skipOnVariables: !0
	},
	cacheInBuiltFormats: !0
}), xe = (e) => (x(e.ns) && (e.ns = [e.ns]), x(e.fallbackLng) && (e.fallbackLng = [e.fallbackLng]), x(e.fallbackNS) && (e.fallbackNS = [e.fallbackNS]), e.supportedLngs && !e.supportedLngs.includes("cimode") && (e.supportedLngs = e.supportedLngs.concat(["cimode"])), e), K = () => {}, Se = (e) => {
	Object.getOwnPropertyNames(Object.getPrototypeOf(e)).forEach((t) => {
		typeof e[t] == "function" && (e[t] = e[t].bind(e));
	});
}, q = class e extends I {
	constructor(e = {}, t) {
		if (super(), this.options = xe(e), this.services = {}, this.logger = F, this.modules = { external: [] }, Se(this), t && !this.isInitialized && !e.isClone) {
			if (!this.options.initAsync) return this.init(e, t), this;
			setTimeout(() => {
				this.init(e, t);
			}, 0);
		}
	}
	init(e = {}, t) {
		this.isInitializing = !0, typeof e == "function" && (t = e, e = {}), e.defaultNS == null && e.ns && (x(e.ns) ? e.defaultNS = e.ns : e.ns.includes("translation") || (e.defaultNS = e.ns[0]));
		let n = G();
		this.options = {
			...n,
			...this.options,
			...xe(e)
		}, this.options.interpolation = {
			...n.interpolation,
			...this.options.interpolation
		}, e.keySeparator !== void 0 && (this.options.userDefinedKeySeparator = e.keySeparator), e.nsSeparator !== void 0 && (this.options.userDefinedNsSeparator = e.nsSeparator), typeof this.options.overloadTranslationOptionHandler != "function" && (this.options.overloadTranslationOptionHandler = n.overloadTranslationOptionHandler);
		let r = (e) => e ? typeof e == "function" ? new e() : e : null;
		if (!this.options.isClone) {
			this.modules.logger ? F.init(r(this.modules.logger), this.options) : F.init(null, this.options);
			let e;
			e = this.modules.formatter ? this.modules.formatter : ve;
			let t = new B(this.options);
			this.store = new le(this.options.resources, this.options);
			let n = this.services;
			n.logger = F, n.resourceStore = this.store, n.languageUtils = t, n.pluralResolver = new pe(t, { prepend: this.options.pluralSeparator }), e && (n.formatter = r(e), n.formatter.init && n.formatter.init(n, this.options), this.options.interpolation.format = n.formatter.format.bind(n.formatter)), n.interpolator = new me(this.options), n.utils = { hasLoadedNamespace: this.hasLoadedNamespace.bind(this) }, n.backendConnector = new be(r(this.modules.backend), n.resourceStore, n, this.options), n.backendConnector.on("*", (e, ...t) => {
				this.emit(e, ...t);
			}), this.modules.languageDetector && (n.languageDetector = r(this.modules.languageDetector), n.languageDetector.init && n.languageDetector.init(n, this.options.detection, this.options)), this.modules.i18nFormat && (n.i18nFormat = r(this.modules.i18nFormat), n.i18nFormat.init && n.i18nFormat.init(this)), this.translator = new z(this.services, this.options), this.translator.on("*", (e, ...t) => {
				this.emit(e, ...t);
			}), this.modules.external.forEach((e) => {
				e.init && e.init(this);
			});
		}
		if (this.format = this.options.interpolation.format, t ||= K, this.options.fallbackLng && !this.services.languageDetector && !this.options.lng) {
			let e = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
			e.length > 0 && e[0] !== "dev" && (this.options.lng = e[0]);
		}
		!this.services.languageDetector && !this.options.lng && this.logger.warn("init: no languageDetector is used and no lng is defined"), [
			"getResource",
			"hasResourceBundle",
			"getResourceBundle",
			"getDataByLanguage"
		].forEach((e) => {
			this[e] = (...t) => this.store[e](...t);
		}), [
			"addResource",
			"addResources",
			"addResourceBundle",
			"removeResourceBundle"
		].forEach((e) => {
			this[e] = (...t) => (this.store[e](...t), this);
		});
		let i = S(), a = () => {
			let e = (e, n) => {
				this.isInitializing = !1, this.isInitialized && !this.initializedStoreOnce && this.logger.warn("init: i18next is already initialized. You should call init just once!"), this.isInitialized = !0, this.options.isClone || this.logger.log("initialized", this.options), this.emit("initialized", this.options), i.resolve(n), t(e, n);
			};
			if ((this.languages || this.isLanguageChangingTo) && !this.isInitialized) return e(null, this.t.bind(this));
			this.changeLanguage(this.options.lng, e);
		};
		return this.options.resources || !this.options.initAsync ? a() : setTimeout(a, 0), i;
	}
	loadResources(e, t = K) {
		let n = t, r = x(e) ? e : this.language;
		if (typeof e == "function" && (n = e), !this.options.resources || this.options.partialBundledLanguages) {
			if (r?.toLowerCase() === "cimode" && (!this.options.preload || this.options.preload.length === 0)) return n();
			let e = [], t = (t) => {
				t && t !== "cimode" && this.services.languageUtils.toResolveHierarchy(t).forEach((t) => {
					t !== "cimode" && (e.includes(t) || e.push(t));
				});
			};
			r ? t(r) : this.services.languageUtils.getFallbackCodes(this.options.fallbackLng).forEach((e) => t(e)), this.options.preload?.forEach?.((e) => t(e)), this.services.backendConnector.load(e, this.options.ns, (e) => {
				!e && !this.resolvedLanguage && this.language && this.setResolvedLanguage(this.language), n(e);
			});
		} else n(null);
	}
	reloadResources(e, t, n) {
		let r = S();
		return typeof e == "function" && (n = e, e = void 0), typeof t == "function" && (n = t, t = void 0), e ||= this.languages, t ||= this.options.ns, n ||= K, this.services.backendConnector.reload(e, t, (e) => {
			r.resolve(), n(e);
		}), r;
	}
	use(e) {
		if (!e) throw Error("You are passing an undefined module! Please check the object you are passing to i18next.use()");
		if (!e.type) throw Error("You are passing a wrong module! Please check the object you are passing to i18next.use()");
		return e.type === "backend" && (this.modules.backend = e), (e.type === "logger" || e.log && e.warn && e.error) && (this.modules.logger = e), e.type === "languageDetector" && (this.modules.languageDetector = e), e.type === "i18nFormat" && (this.modules.i18nFormat = e), e.type === "postProcessor" && ue.addPostProcessor(e), e.type === "formatter" && (this.modules.formatter = e), e.type === "3rdParty" && this.modules.external.push(e), this;
	}
	setResolvedLanguage(e) {
		if (!(!e || !this.languages) && !["cimode", "dev"].includes(e)) {
			for (let e = 0; e < this.languages.length; e++) {
				let t = this.languages[e];
				if (!["cimode", "dev"].includes(t) && this.store.hasLanguageSomeTranslations(t)) {
					this.resolvedLanguage = t;
					break;
				}
			}
			!this.resolvedLanguage && !this.languages.includes(e) && this.store.hasLanguageSomeTranslations(e) && (this.resolvedLanguage = e, this.languages.unshift(e));
		}
	}
	changeLanguage(e, t) {
		this.isLanguageChangingTo = e;
		let n = S();
		this.emit("languageChanging", e);
		let r = (e) => {
			this.language = e, this.languages = this.services.languageUtils.toResolveHierarchy(e), this.resolvedLanguage = void 0, this.setResolvedLanguage(e);
		}, i = (i, a) => {
			a ? this.isLanguageChangingTo === e && (r(a), this.translator.changeLanguage(a), this.isLanguageChangingTo = void 0, this.emit("languageChanged", a), this.logger.log("languageChanged", a)) : this.isLanguageChangingTo = void 0, n.resolve((...e) => this.t(...e)), t && t(i, (...e) => this.t(...e));
		}, a = (t) => {
			!e && !t && this.services.languageDetector && (t = []);
			let n = x(t) ? t : t && t[0], a = this.store.hasLanguageSomeTranslations(n) ? n : this.services.languageUtils.getBestMatchFromCodes(x(t) ? [t] : t);
			a && (this.language || r(a), this.translator.language || this.translator.changeLanguage(a), this.services.languageDetector?.cacheUserLanguage?.(a)), this.loadResources(a, (e) => {
				i(e, a);
			});
		};
		return !e && this.services.languageDetector && !this.services.languageDetector.async ? a(this.services.languageDetector.detect()) : !e && this.services.languageDetector && this.services.languageDetector.async ? this.services.languageDetector.detect.length === 0 ? this.services.languageDetector.detect().then(a) : this.services.languageDetector.detect(a) : a(e), n;
	}
	getFixedT(e, t, n, r) {
		let i = r?.scopeNs, a = (e, t, ...r) => {
			let o;
			o = typeof t == "object" ? { ...t } : this.options.overloadTranslationOptionHandler([e, t].concat(r)), o.lng = o.lng || a.lng, o.lngs = o.lngs || a.lngs;
			let s = o.ns !== void 0 && o.ns !== null;
			o.ns = o.ns || a.ns, o.keyPrefix !== "" && (o.keyPrefix = o.keyPrefix || n || a.keyPrefix);
			let c = {
				...this.options,
				...o
			};
			Array.isArray(i) && !s && (c.ns = i), typeof o.keyPrefix == "function" && (o.keyPrefix = L(o.keyPrefix, c));
			let l = this.options.keySeparator || ".", u;
			return o.keyPrefix && Array.isArray(e) ? u = e.map((e) => (typeof e == "function" && (e = L(e, c)), `${o.keyPrefix}${l}${e}`)) : (typeof e == "function" && (e = L(e, c)), u = o.keyPrefix ? `${o.keyPrefix}${l}${e}` : e), this.t(u, o);
		};
		return x(e) ? a.lng = e : a.lngs = e, a.ns = t, a.keyPrefix = n, a;
	}
	t(...e) {
		return this.translator?.translate(...e);
	}
	exists(...e) {
		return this.translator?.exists(...e);
	}
	setDefaultNamespace(e) {
		this.options.defaultNS = e;
	}
	hasLoadedNamespace(e, t = {}) {
		if (!this.isInitialized) return this.logger.warn("hasLoadedNamespace: i18next was not initialized", this.languages), !1;
		if (!this.languages || !this.languages.length) return this.logger.warn("hasLoadedNamespace: i18n.languages were undefined or empty", this.languages), !1;
		let n = t.lng || this.resolvedLanguage || this.languages[0], r = this.options ? this.options.fallbackLng : !1, i = this.languages[this.languages.length - 1];
		if (n.toLowerCase() === "cimode") return !0;
		let a = (e, t) => {
			let n = this.services.backendConnector.state[`${e}|${t}`];
			return n === -1 || n === 0 || n === 2;
		};
		if (t.precheck) {
			let e = t.precheck(this, a);
			if (e !== void 0) return e;
		}
		return !!(this.hasResourceBundle(n, e) || !this.services.backendConnector.backend || this.options.resources && !this.options.partialBundledLanguages || a(n, e) && (!r || a(i, e)));
	}
	loadNamespaces(e, t) {
		let n = S();
		return this.options.ns ? (x(e) && (e = [e]), e.forEach((e) => {
			this.options.ns.includes(e) || this.options.ns.push(e);
		}), this.loadResources((e) => {
			n.resolve(), t && t(e);
		}), n) : (t && t(), Promise.resolve());
	}
	loadLanguages(e, t) {
		let n = S();
		x(e) && (e = [e]);
		let r = this.options.preload || [], i = e.filter((e) => !r.includes(e) && this.services.languageUtils.isSupportedCode(e));
		return i.length ? (this.options.preload = r.concat(i), this.loadResources((e) => {
			n.resolve(), t && t(e);
		}), n) : (t && t(), Promise.resolve());
	}
	dir(e) {
		if (e ||= this.resolvedLanguage || (this.languages?.length > 0 ? this.languages[0] : this.language), !e) return "rtl";
		try {
			let t = new Intl.Locale(e);
			if (t && t.getTextInfo) {
				let e = t.getTextInfo();
				if (e && e.direction) return e.direction;
			}
		} catch {}
		let t = /* @__PURE__ */ "ar.shu.sqr.ssh.xaa.yhd.yud.aao.abh.abv.acm.acq.acw.acx.acy.adf.ads.aeb.aec.afb.ajp.apc.apd.arb.arq.ars.ary.arz.auz.avl.ayh.ayl.ayn.ayp.bbz.pga.he.iw.ps.pbt.pbu.pst.prp.prd.ug.ur.ydd.yds.yih.ji.yi.hbo.men.xmn.fa.jpr.peo.pes.prs.dv.sam.ckb".split("."), n = this.services?.languageUtils || new B(G());
		return e.toLowerCase().indexOf("-latn") > 1 ? "ltr" : t.includes(n.getLanguagePartFromCode(e)) || e.toLowerCase().indexOf("-arab") > 1 ? "rtl" : "ltr";
	}
	static createInstance(t = {}, n) {
		let r = new e(t, n);
		return r.createInstance = e.createInstance, r;
	}
	cloneInstance(t = {}, n = K) {
		let r = t.forkResourceStore;
		r && delete t.forkResourceStore;
		let i = {
			...this.options,
			...t,
			isClone: !0
		}, a = new e(i);
		if ((t.debug !== void 0 || t.prefix !== void 0) && (a.logger = a.logger.clone(t)), [
			"store",
			"services",
			"language"
		].forEach((e) => {
			a[e] = this[e];
		}), a.services = { ...this.services }, a.services.utils = { hasLoadedNamespace: a.hasLoadedNamespace.bind(a) }, r && (a.store = new le(Object.keys(this.store.data).reduce((e, t) => (e[t] = { ...this.store.data[t] }, e[t] = Object.keys(e[t]).reduce((n, r) => (n[r] = { ...e[t][r] }, n), e[t]), e), {}), i), a.services.resourceStore = a.store), t.interpolation) {
			let e = {
				...G().interpolation,
				...this.options.interpolation,
				...t.interpolation
			}, n = {
				...i,
				interpolation: e
			};
			a.services.interpolator = new me(n);
		}
		return a.translator = new z(a.services, i), a.translator.on("*", (e, ...t) => {
			a.emit(e, ...t);
		}), a.init(i, n), a.translator.options = i, a.translator.backendConnector.services.utils = { hasLoadedNamespace: a.hasLoadedNamespace.bind(a) }, a;
	}
	toJSON() {
		return {
			options: this.options,
			store: this.store,
			language: this.language,
			languages: this.languages,
			resolvedLanguage: this.resolvedLanguage
		};
	}
}.createInstance();
q.createInstance, q.dir, q.init, q.loadResources, q.reloadResources, q.use, q.changeLanguage, q.getFixedT, q.t, q.exists, q.setDefaultNamespace, q.hasLoadedNamespace, q.loadNamespaces, q.loadLanguages;
var Ce = {
	tools: {
		draw: "Draw",
		measure: "Measure",
		print: "Print",
		search: "Search",
		import: "Import layer",
		geolocation: "My location",
		info: "Info",
		"3d": "3D view",
		truearea: "True area",
		settings: "Settings"
	},
	common: {
		close: "Close",
		cancel: "Cancel",
		ok: "OK",
		loading: "Loading..."
	}
}, J = q.createInstance(), we = !1;
async function Te() {
	we || (we = !0, await J.init({
		lng: "en",
		fallbackLng: "en",
		ns: ["webmapx"],
		defaultNS: "webmapx",
		resources: { en: { webmapx: Ce } },
		interpolation: { escapeValue: !1 }
	}));
}
function Ee(e, t) {
	return J.t(e, t);
}
//#endregion
//#region src/bootstrap/plugin-url.ts
var De = [
	"https://cdn.jsdelivr.net/npm/",
	"https://unpkg.com/",
	"https://esm.sh/"
];
function Oe(e, t, n = typeof location < "u" ? location.origin : null) {
	let r;
	try {
		r = new URL(e, t);
	} catch {
		return null;
	}
	return n && r.origin === n || De.some((e) => r.href.startsWith(e)) ? r.href : null;
}
//#endregion
//#region src/config/loader.ts
function Y(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function X(e, t) {
	if (e.startsWith("pmtiles://")) return `pmtiles://${X(e.slice(10), t)}`;
	if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(e)) return e;
	try {
		return new URL(e, t).toString();
	} catch {
		return e;
	}
}
function ke(e, t) {
	if (!e.startsWith("internalfunc://")) return e;
	let [n, r] = e.split("?");
	if (!r) return e;
	let i = new URLSearchParams(r), a = i.get("data");
	return a ? (i.set("data", X(a, t)), `${n}?${i.toString().replace(/%7B/gi, "{").replace(/%7D/gi, "}")}`) : e;
}
function Z(e, t, n) {
	if (!Y(t)) return {
		id: e,
		type: "geojson",
		data: t
	};
	let r = {
		id: e,
		...t
	};
	return r.type === "raster" && r.url === void 0 && Array.isArray(r.tiles) && (r.url = r.tiles), r.type === "raster" && r.service === void 0 && (r.service = "xyz"), typeof r.data == "string" && (r.data = r.data.startsWith("internalfunc://") ? ke(r.data, n) : X(r.data, n)), typeof r.url == "string" ? r.url = X(r.url, n) : Array.isArray(r.url) && (r.url = r.url.map((e) => typeof e == "string" ? X(e, n) : e)), Array.isArray(r.tiles) && (r.tiles = r.tiles.map((e) => typeof e == "string" ? X(e, n) : e)), r;
}
function Ae(e, t) {
	return Y(e) ? Object.entries(e).map(([e, n]) => Z(e, n, t)) : [];
}
function Q(e, t) {
	let n = typeof e.source == "string" ? t?.get(e.source) ?? e.source : void 0, r = e["source-layer"] ?? e.sourceLayer, i = e.minzoom ?? e.minZoom, a = e.maxzoom ?? e.maxZoom, o = { ...e };
	return n !== void 0 && (o.source = n), r !== void 0 && (o["source-layer"] = r), i !== void 0 && (o.minzoom = i), a !== void 0 && (o.maxzoom = a), delete o.sourceLayer, delete o.minZoom, delete o.maxZoom, o;
}
function je(e, t, n) {
	return Array.isArray(e) ? e.filter(Y).map((e) => Me(e, t, n)) : Y(e) ? Object.entries(e).map(([e, r]) => Y(r) ? Me({
		id: e,
		...r
	}, t, n) : null).filter(Boolean) : [];
}
function Me(e, t, n) {
	let r = typeof e.id == "string" ? e.id : null;
	if (!r) return null;
	let i = typeof e.fallbackLayerId == "string" ? e.fallbackLayerId : typeof e.fallbackRef == "string" ? e.fallbackRef : void 0, a = typeof e.singleGroup == "string" ? e.singleGroup : typeof e.selectionGroup == "string" ? e.selectionGroup : void 0, o = Y(e.metadata) ? {
		...e.metadata,
		...a ? {
			selectionGroup: a,
			singleSelectionGroupKey: a
		} : {},
		...i ? { fallbackLayerId: i } : {}
	} : a || i ? {
		...a ? {
			selectionGroup: a,
			singleSelectionGroupKey: a
		} : {},
		...i ? { fallbackLayerId: i } : {}
	} : void 0, s = {
		...e,
		id: r,
		...i ? { fallbackLayerId: i } : {},
		...a ? { singleGroup: a } : {},
		...o ? { metadata: o } : {}
	};
	if (e.type === "allmaps") return s;
	if (e.type === "style") {
		let i = {}, a = /* @__PURE__ */ new Map();
		if (Y(e.sources)) for (let [o, s] of Object.entries(e.sources)) {
			let e = `${r}:${o}`;
			a.set(o, e), t.push(Z(e, s, n)), i[o] = s;
		}
		let o = Array.isArray(e.layers) ? e.layers.filter(Y).map((e) => Q(e, a)) : [];
		return {
			...s,
			type: "style",
			...typeof e.url == "string" ? { url: X(e.url, n) } : {},
			sources: e.sources ?? {},
			layers: o
		};
	}
	let c = e.type === "background";
	if (typeof e.type == "string" && (typeof e.source == "string" || c) && !e.layerset && !e.style) {
		let t = e["source-layer"] ?? e.sourceLayer, n = e.minzoom ?? e.minZoom, r = e.maxzoom ?? e.maxZoom, i = { ...s };
		return t !== void 0 && (i["source-layer"] = t), n !== void 0 && (i.minzoom = n), r !== void 0 && (i.maxzoom = r), delete i.sourceLayer, delete i.minZoom, delete i.maxZoom, i;
	}
	if (Array.isArray(e.layerset)) {
		let t = e.layerset.filter(Y).map((e) => Q(e));
		return {
			...s,
			type: "style",
			layers: t,
			layerset: void 0
		};
	}
	if (Y(e.style)) {
		let i = e.style, a = /* @__PURE__ */ new Map(), o = {};
		if (Y(i.sources)) for (let [e, s] of Object.entries(i.sources)) {
			let i = `${r}:${e}`;
			a.set(e, i), t.push(Z(i, s, n)), o[e] = s;
		}
		let c = Array.isArray(i.layers) ? i.layers.filter(Y).map((e) => Q(e, a)) : [], l = typeof i.url == "string" ? X(i.url, n) : void 0;
		return {
			...s,
			type: "style",
			...l ? { url: l } : {},
			sources: o,
			layers: c,
			style: void 0
		};
	}
	return null;
}
function Ne(e, t) {
	let n = (e) => {
		let t = e.selectionMode;
		if (t === "single" || t === "multiple") return t;
	}, r = (e) => typeof e.selectionGroup == "string" ? e.selectionGroup : void 0, i = (e) => typeof e.allowNone == "boolean" ? e.allowNone : void 0, a = (e) => typeof e.stackOrder == "number" && Number.isFinite(e.stackOrder) ? e.stackOrder : void 0, o = (e) => {
		if (!Y(e)) return null;
		let t = typeof e.kind == "string" ? e.kind : void 0;
		if (t === "group") {
			let t = Array.isArray(e.children) ? e.children.map(o).filter((e) => e !== null) : [];
			return {
				label: typeof e.title == "string" ? e.title : "Group",
				expanded: e.expanded === !0,
				...n(e) ? { selectionMode: n(e) } : {},
				...r(e) ? { selectionGroup: r(e) } : {},
				...i(e) === void 0 ? {} : { allowNone: i(e) },
				...a(e) === void 0 ? {} : { stackOrder: a(e) },
				children: t
			};
		}
		if (t === "layer") {
			let t = typeof e.ref == "string" ? e.ref : void 0;
			return t ? {
				label: typeof e.title == "string" ? e.title : t,
				layerId: t,
				...n(e) ? { selectionMode: n(e) } : {},
				...r(e) ? { selectionGroup: r(e) } : {},
				...i(e) === void 0 ? {} : { allowNone: i(e) },
				...a(e) === void 0 ? {} : { stackOrder: a(e) }
			} : null;
		}
		return null;
	};
	if (!Y(e)) return t.map((e) => !Y(e) || typeof e.id != "string" ? null : {
		label: e.id,
		layerId: e.id
	}).filter(Boolean);
	let s = Object.values(e).find((e) => Y(e)), c = (Array.isArray(s?.items) ? s.items : []).map(o).filter((e) => e !== null);
	return c.length > 0 ? c : t.map((e) => !Y(e) || typeof e.id != "string" ? null : {
		label: e.id,
		layerId: e.id
	}).filter(Boolean);
}
function Pe(e, t) {
	if (!Y(e)) return;
	let n = JSON.parse(JSON.stringify(e)), r = (e) => {
		typeof e.data == "string" && e.data.length > 0 && (e.data = X(e.data, t));
		for (let t of Object.values(e)) if (Array.isArray(t)) for (let e of t) Y(e) && r(e);
	};
	for (let e of Object.values(n)) Y(e) && r(e);
	return n;
}
function Fe(e, t) {
	if (!Y(e)) return;
	let n = JSON.parse(JSON.stringify(e)), r = Object.values(n).filter((e) => Y(e));
	for (let e of r) {
		let r = Array.isArray(e.items) ? e.items : [];
		for (let e of r) if (Y(e) && e.type === "layerTree") return Array.isArray(e.tree) && e.tree.length > 0 || (e.tree = t), delete e.catalog, n;
	}
	return n;
}
function Ie(e, t) {
	if (!Y(e)) return {
		sources: [],
		layers: []
	};
	let n = e, r = Array.isArray(n.sources) ? n.sources.filter(Y).map((e) => Z(typeof e.id == "string" ? e.id : "", e, t)) : Ae(n.sources, t), i = [], a = je(n.layers, i, t), o = /* @__PURE__ */ new Map();
	for (let e of [...r, ...i]) Y(e) && typeof e.id == "string" && !o.has(e.id) && o.set(e.id, e);
	return {
		sources: Array.from(o.values()),
		layers: a.map((e) => {
			if (!Y(e)) return e;
			let t = e, n = typeof t.source == "string" ? t.source : null, r = n ? o.get(n) : null;
			if (!r || r.type !== "raster" || r.service !== "wms") return e;
			let i = Y(t.metadata) ? { ...t.metadata } : {};
			if (typeof i.getFeatureInfoUrl == "string") return e;
			let a = Array.isArray(r.url) ? r.url[0] : r.url;
			if (typeof a != "string") return e;
			let s = r.layers ?? "", c = r.version ?? "1.1.1", l = new URL(a);
			return l.searchParams.set("SERVICE", "WMS"), l.searchParams.set("REQUEST", "GetFeatureInfo"), l.searchParams.set("VERSION", String(c)), l.searchParams.set("LAYERS", String(s)), l.searchParams.set("QUERY_LAYERS", String(s)), i.getFeatureInfoUrl = l.toString(), i.getFeatureInfoFormat = r.format ?? "application/json", {
				...t,
				metadata: i
			};
		})
	};
}
function Le(e, t) {
	return !Y(e) || !Array.isArray(e.stories) ? e : {
		...e,
		stories: e.stories.map((e) => !Y(e) || !Array.isArray(e.chapters) ? e : {
			...e,
			chapters: e.chapters.map((e) => !Y(e) || !Array.isArray(e.steps) ? e : {
				...e,
				steps: e.steps.map((e) => !Y(e) || typeof e.htmlUrl != "string" ? e : {
					...e,
					htmlUrl: X(e.htmlUrl, t)
				})
			})
		})
	};
}
function Re(e, t) {
	if (!Y(e)) return e;
	let n = e, r = n.stories === void 0 ? void 0 : Le(n.stories, t), i = Pe(n.tools, t), a = t, o = X(typeof n.apiKeysFile == "string" && n.apiKeysFile.trim() ? n.apiKeysFile.trim() : "./apikeys.json", t);
	if (m(o), Y(n.layerData)) return {
		...n,
		layerData: Ie(n.layerData, t),
		baseUrl: a,
		apiKeysFile: o,
		...i === void 0 ? {} : { tools: i },
		...r === void 0 ? {} : { stories: r }
	};
	if (Y(n.catalog)) {
		let e = n.catalog;
		return {
			...n,
			layerData: {
				sources: Array.isArray(e.sources) ? e.sources : [],
				layers: Array.isArray(e.layers) ? e.layers : []
			},
			catalog: n.catalog,
			baseUrl: a,
			apiKeysFile: o,
			...i === void 0 ? {} : { tools: i },
			...r === void 0 ? {} : { stories: r }
		};
	}
	if (!Y(n.library)) return {
		...n,
		baseUrl: a,
		apiKeysFile: o,
		...r === void 0 ? {} : { stories: r }
	};
	let s = n.library, c = Ae(s.sources, t), l = je(s.layers, c, t), u = Ne(s.catalogs, l), d = Fe(i ?? n.tools, u);
	return {
		map: n.map,
		runtimeMap: Y(n.runtimeMap) ? n.runtimeMap : void 0,
		layerData: {
			sources: c,
			layers: l
		},
		tools: d,
		baseUrl: a,
		apiKeysFile: o,
		state: Y(n.state) ? n.state : void 0,
		version: typeof n.version == "number" ? n.version : void 0,
		project: Y(n.project) ? n.project : void 0,
		...Array.isArray(n.plugins) ? { plugins: n.plugins } : {},
		...r === void 0 ? {} : { stories: r }
	};
}
function ze(e, t, n = typeof document < "u" ? document.baseURI : "http://localhost/") {
	let r = Re(e, n), i = p(r);
	if (!i.valid) {
		let e = i.errors.map((e) => `  ${e.path}: ${e.message}`).join("\n");
		throw Error(`Invalid config from "${t}":\n${e}`);
	}
	return i.warnings.length > 0 && (console.warn(`[config] Warnings for "${t}":`), i.warnings.forEach((e) => console.warn(`  ${e.path}: ${e.message}`))), r;
}
//#endregion
//#region src/bootstrap/plugin-loader.ts
var Be = Object.freeze({
	registerTool: r,
	WebmapxBaseTool: d,
	WebmapxModalTool: f,
	LitElement: c,
	html: s,
	css: o,
	svg: a,
	nothing: i,
	i18n: J,
	t: Ee
}), Ve = /* @__PURE__ */ new Map();
async function He(e, t = typeof document < "u" ? document.baseURI : "") {
	if (Array.isArray(e)) for (let n of e) {
		if (typeof n != "string" || !n.trim()) continue;
		let e = Oe(n.trim(), t);
		if (!e) {
			console.warn(`[webmapx] Plugin skipped — not same-origin and not from a trusted CDN: ${n}`), console.warn("[webmapx] Allowed CDNs: " + De.join(", "));
			continue;
		}
		let r = Ve.get(e);
		r || (r = Ue(e), Ve.set(e, r)), await r;
	}
}
async function Ue(e) {
	try {
		let t = await import(
			/* @vite-ignore */
			e
), n = t.default?.register ?? t.register;
		if (typeof n != "function") {
			console.warn(`[webmapx] Plugin has no register() export: ${e}`);
			return;
		}
		await n(Be);
	} catch (t) {
		console.error(`[webmapx] Failed to load plugin: ${e}`, t);
	}
}
//#endregion
//#region src/bootstrap/locale-loader.ts
var We = "https://cdn.jsdelivr.net/npm/@edugis-org/webmapx@0.2.15/src/locales";
async function Ge(e) {
	if (J.hasResourceBundle(e, "webmapx")) {
		await J.changeLanguage(e);
		return;
	}
	try {
		let t = `${We}/${e}/core.json`, n = await fetch(t).then((e) => {
			if (!e.ok) throw Error(`HTTP ${e.status}`);
			return e.json();
		});
		J.addResourceBundle(e, "webmapx", n), await J.changeLanguage(e);
	} catch (t) {
		console.error(`[webmapx] Failed to load locale "${e}", falling back to EN`, t);
	}
}
//#endregion
//#region src/utils/config-edit-mode.ts
var Ke = "configedit";
function qe(e) {
	return e !== null && e !== "" && e !== "false" && e !== "0";
}
function Je(e) {
	let t = new URLSearchParams(window.location.search), n = t.get(`${Ke}.${e}`);
	return n === null ? e === 0 ? qe(t.get(Ke)) : !1 : qe(n);
}
//#endregion
//#region src/bootstrap/resolve-init-options.ts
async function Ye(e) {
	let { mapConfig: t, permalinkState: n, fallbackViewport: r, fallbackProjection: i } = e, a = t.style, o = typeof a == "string", s = {
		center: t.center ?? [0, 0],
		zoom: t.zoom ?? 2,
		...t.bearing == null ? {} : { bearing: t.bearing },
		...t.pitch == null ? {} : { pitch: t.pitch },
		...t.minZoom == null ? {} : { minZoom: t.minZoom },
		...t.maxZoom == null ? {} : { maxZoom: t.maxZoom },
		...t.minPitch == null ? {} : { minPitch: t.minPitch },
		...t.maxPitch == null ? {} : { maxPitch: t.maxPitch },
		...t.maxBounds == null ? {} : { maxBounds: t.maxBounds },
		...t.backgroundColor == null ? {} : { backgroundColor: t.backgroundColor },
		...o ? { styleUrl: a } : { style: a }
	};
	if (n?.v) {
		let [e, t, r, i, a] = n.v;
		s.center = [e, t], s.zoom = r, i === 0 ? delete s.bearing : s.bearing = i, a === 0 ? delete s.pitch : s.pitch = a;
	} else r && (s.center = r.center, s.zoom = r.zoom);
	let c = n?.p ?? i ?? t.projection ?? null;
	if (c && (s.projection = c, o)) try {
		s.style = await (await fetch(a)).json(), delete s.styleUrl;
	} catch (e) {
		console.warn("[webmapx] Failed to fetch style for projection injection:", e);
	}
	return s;
}
//#endregion
//#region src/bootstrap/inject-config-edit-tool.ts
async function $(e) {
	await import("./webmapx-config-edit-tool-Cee2GIB6.js");
	let t = e.querySelector("webmapx-layout");
	t || (t = document.createElement("webmapx-layout"), e.appendChild(t));
	let n = t.querySelector("webmapx-control-group[slot=\"top-left\"]"), r = n?.querySelector("webmapx-toolbar"), i = n?.querySelector("webmapx-tool-panel");
	if (n || (n = document.createElement("webmapx-control-group"), n.setAttribute("slot", "top-left"), n.setAttribute("orientation", "vertical"), n.setAttribute("panel-position", "after"), r = document.createElement("webmapx-toolbar"), i = document.createElement("webmapx-tool-panel"), n.appendChild(r), n.appendChild(i), t.appendChild(n)), r || (r = document.createElement("webmapx-toolbar"), n.prepend(r)), i || (i = document.createElement("webmapx-tool-panel"), n.appendChild(i)), !r.querySelector("[name=\"settings\"]")) {
		await import("./webmapx-settings-BYV1DirV.js");
		let e = document.createElement("sl-button");
		e.setAttribute("name", "settings"), e.setAttribute("circle", ""), e.title = "Settings", e.innerHTML = "<sl-icon name=\"gear\"></sl-icon>", r.appendChild(e);
		let t = document.createElement("webmapx-settings");
		t.setAttribute("tool-id", "settings"), i.appendChild(t);
	}
	if (!r.querySelector("[name=\"configedit\"]")) {
		let e = document.createElement("sl-button");
		e.setAttribute("name", "configedit"), e.setAttribute("circle", ""), e.title = "Edit config", e.innerHTML = "<sl-icon name=\"pencil-square\"></sl-icon>", r.appendChild(e);
		let t = document.createElement("webmapx-config-edit-tool");
		t.setAttribute("tool-id", "configedit"), i.appendChild(t);
	}
}
//#endregion
//#region src/bootstrap/WebMapX.ts
var Xe = "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2/cdn/", Ze = {
	version: 8,
	sources: {},
	layers: []
};
function Qe(e) {
	return { mainToolbar: {
		type: "toolbar",
		enabled: !0,
		position: "top-left",
		items: e.map((e) => ({
			type: e,
			id: e
		}))
	} };
}
var $e = class {
	static async mount(e, t) {
		let n = t.configUrl, r;
		if (typeof t.config == "string") {
			let e = await fetch(t.config);
			if (!e.ok) throw Error(`[webmapx] Failed to load config: ${t.config}`);
			r = await e.json(), n = e.url;
		} else r = t.config;
		h(Xe), await Te();
		let i = r.map?.type, a = r.engine ?? i ?? "maplibre", o = Array.isArray(r.tools) ? r.tools : [], s = o.length > 0 ? o : b(r.tools);
		await He(r.plugins, n), await Promise.all([_(a), y(s)]), r.locale && r.locale !== "en" && await Ge(r.locale);
		let c = document.querySelector(e);
		if (!c) throw Error(`[webmapx] Mount target not found: "${e}"`);
		let d = `${e.replace(/^#/, "").replace(/[^a-zA-Z0-9_-]/g, "-") || "map"}-webmapx`;
		c.innerHTML = `<webmapx-map id="${d}" adapter="${a}"></webmapx-map>`;
		let f = c.querySelector("webmapx-map"), p = r.map, { engine: m, tools: g, locale: v, plugins: x, ...S } = r, C = o.length > 0 ? Qe(o) : typeof g == "object" && !Array.isArray(g) ? g : void 0, w = ze({
			...S,
			map: {
				type: a,
				center: [0, 0],
				zoom: 2,
				...p
			},
			...C ? { tools: C } : {}
		}, "WebMapX.mount", n);
		f.setConfig(w);
		let T = await f.getAdapterAsync?.();
		if (!T) {
			console.error("[webmapx] Adapter not available — check engine config.");
			return;
		}
		let E = p?.style ?? Ze, D = w.runtimeMap, O = l(u(f)), k = await Ye({
			mapConfig: {
				center: p?.center,
				zoom: p?.zoom,
				bearing: p?.bearing,
				pitch: p?.pitch,
				minZoom: D?.minZoom ?? p?.minZoom,
				maxZoom: D?.maxZoom ?? p?.maxZoom,
				minPitch: D?.minPitch ?? p?.minPitch,
				maxPitch: D?.maxPitch ?? p?.maxPitch,
				maxBounds: D?.maxBounds,
				style: E,
				projection: p?.projection,
				backgroundColor: p?.backgroundColor
			},
			permalinkState: O
		});
		T.initialize(d, k);
		let A = document.createElement("webmapx-layout");
		f.appendChild(A);
		let { buildLayoutFromConfig: j } = await import("./dynamic-layout-hAjPK4nZ.js");
		j(A, C ?? w.tools), (r._devTools?.configedit === !0 || Je(0)) && await $(f);
	}
	static async enableConfigEditTool(e) {
		let t = document.querySelector(`${e} webmapx-map:not([data-webmapx-role])`) ?? document.querySelector(e);
		if (!t) throw Error(`[webmapx] enableConfigEditTool: no element found for "${e}"`);
		await $(t);
	}
};
//#endregion
export { $e as WebMapX, d as WebmapxBaseTool, Ge as changeLocale, J as i18n, r as registerTool, Ee as t };
