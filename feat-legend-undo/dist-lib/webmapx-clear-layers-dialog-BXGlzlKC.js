import { a as e, t } from "./chunk-HEgqtunE.js";
import { a as n, c as r, d as i, h as a, i as o, n as s, o as c, p as l, s as u } from "./decorators-d8E4nZJy.js";
import { t as d } from "./decorate-JFLkHk_V.js";
import { t as f } from "./webmapx-base-tool-CziCRWn_.js";
import "./button-DE9ytwxI.js";
import "./checkbox-DigllOlW.js";
import "./dialog-DHGOXEHq.js";
import "./icon-Qf3FyAAL.js";
import { gt as p, pt as m } from "./zip-reader-Bai44Y8Q.js";
import { t as h } from "./control-surface-styles-zbl1JfZH.js";
import "./spinner-DHQKbDmr.js";
import "./input-eCCT7kEl.js";
import { A as g, D as _, E as v, O as y, S as b, T as x, _ as S, a as C, b as w, c as T, d as E, f as D, g as O, h as k, i as ee, k as te, l as ne, m as re, n as ie, o as ae, p as oe, r as se, s as ce, t as le, u as ue, v as de, w as fe, x as pe } from "./classify-channel-C-BCLcL8.js";
import "./default-paint-EDDI8yhT.js";
import { a as me, c as he, i as ge, l as _e, n as ve, o as ye, s as be, u as A } from "./wms-sld-probe-D-FUNTV3.js";
import { t as xe } from "./unsafe-html-AhVMIhPF.js";
import { t as Se } from "./sanitize-html-CfMF_sc2.js";
import { r as Ce } from "./attribution-format-BnXMQyW7.js";
import { a as j, i as M, n as we, r as Te, t as Ee } from "./tooltip-BpVD9b5o.js";
import { r as N, t as De } from "./data-colors-BglhXRFr.js";
import { t as Oe } from "./throttle-BD7udUwY.js";
import { t as ke } from "./zip.js-CnrAYY-x.js";
//#region src/utils/attribute-info.ts
var Ae = 200;
function je(e) {
	if (!e) return [];
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = n.properties;
		if (!(!e || typeof e != "object")) for (let [n, r] of Object.entries(e)) {
			let e = t.get(n);
			e || (e = {
				values: [],
				distinct: /* @__PURE__ */ new Set(),
				presentCount: 0
			}, t.set(n, e)), r != null && (e.values.length < Ae && e.values.push(r), e.distinct.add(String(r)), e.presentCount += 1);
		}
	}
	return [...t.entries()].sort(([e], [t]) => e.localeCompare(t)).map(([t, n]) => ({
		name: t,
		type: Me(n.values),
		values: n.values,
		presentCount: n.presentCount,
		missingCount: e.length - n.presentCount,
		uniqueCount: n.distinct.size
	}));
}
function Me(e) {
	if (e.length === 0) return "unknown";
	let t = new Set(e.map(Ne));
	return t.size === 1 ? [...t][0] : "mixed";
}
function Ne(e) {
	return typeof e == "number" ? "number" : typeof e == "boolean" ? "boolean" : e instanceof Date ? "date" : Array.isArray(e) ? "array" : e && typeof e == "object" ? "object" : typeof e == "string" ? Pe(e) ? "date" : "string" : "unknown";
}
function Pe(e) {
	return /^\d{4}-\d{2}-\d{2}(?:[T ][\d:.+-Z]*)?$/.test(e) ? !Number.isNaN(Date.parse(e)) : !1;
}
//#endregion
//#region node_modules/@simonwep/pickr/dist/themes/nano.min.css
var Fe = /* @__PURE__ */ e((/* @__PURE__ */ t(((e, t) => {
	(function(n, r) {
		typeof e == "object" && typeof t == "object" ? t.exports = r() : typeof define == "function" && define.amd ? define([], r) : typeof e == "object" ? e.Pickr = r() : n.Pickr = r();
	})(self, (() => (() => {
		var e = {
			d: (t, n) => {
				for (var r in n) e.o(n, r) && !e.o(t, r) && Object.defineProperty(t, r, {
					enumerable: !0,
					get: n[r]
				});
			},
			o: (e, t) => Object.prototype.hasOwnProperty.call(e, t),
			r: (e) => {
				typeof Symbol < "u" && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(e, "__esModule", { value: !0 });
			}
		}, t = {};
		e.d(t, { default: () => O });
		var n = {};
		function r(e, t, n, r, i = {}) {
			t instanceof HTMLCollection || t instanceof NodeList ? t = Array.from(t) : Array.isArray(t) || (t = [t]), Array.isArray(n) || (n = [n]);
			for (let a of t) for (let t of n) a[e](t, r, {
				capture: !1,
				...i
			});
			return Array.prototype.slice.call(arguments, 1);
		}
		e.r(n), e.d(n, {
			adjustableInputNumbers: () => u,
			createElementFromString: () => o,
			createFromTemplate: () => s,
			eventPath: () => c,
			off: () => a,
			on: () => i,
			resolveElement: () => l
		});
		let i = r.bind(null, "addEventListener"), a = r.bind(null, "removeEventListener");
		function o(e) {
			let t = document.createElement("div");
			return t.innerHTML = e.trim(), t.firstElementChild;
		}
		function s(e) {
			let t = (e, t) => {
				let n = e.getAttribute(t);
				return e.removeAttribute(t), n;
			}, n = (e, r = {}) => {
				let i = t(e, ":obj"), a = t(e, ":ref"), o = i ? r[i] = {} : r;
				a && (r[a] = e);
				for (let r of Array.from(e.children)) {
					let e = t(r, ":arr"), i = n(r, e ? {} : o);
					e && (o[e] || (o[e] = [])).push(Object.keys(i).length ? i : r);
				}
				return r;
			};
			return n(o(e));
		}
		function c(e) {
			let t = e.path || e.composedPath && e.composedPath();
			if (t) return t;
			let n = e.target.parentElement;
			for (t = [e.target, n]; n = n.parentElement;) t.push(n);
			return t.push(document, window), t;
		}
		function l(e) {
			return e instanceof Element ? e : typeof e == "string" ? e.split(/>>/g).reduce(((e, t, n, r) => (e = e.querySelector(t), n < r.length - 1 ? e.shadowRoot : e)), document) : null;
		}
		function u(e, t = ((e) => e)) {
			function n(n) {
				let r = [
					.001,
					.01,
					.1
				][Number(n.shiftKey || 2 * n.ctrlKey)] * (n.deltaY < 0 ? 1 : -1), i = 0, a = e.selectionStart;
				e.value = e.value.replace(/[\d.]+/g, ((e, n) => n <= a && n + e.length >= a ? (a = n, t(Number(e), r, i)) : (i++, e))), e.focus(), e.setSelectionRange(a, a), n.preventDefault(), e.dispatchEvent(new Event("input"));
			}
			i(e, "focus", (() => i(window, "wheel", n, { passive: !1 }))), i(e, "blur", (() => a(window, "wheel", n)));
		}
		let { min: d, max: f, floor: p, round: m } = Math;
		function h(e, t, n) {
			t /= 100, n /= 100;
			let r = p(e = e / 360 * 6), i = e - r, a = n * (1 - t), o = n * (1 - i * t), s = n * (1 - (1 - i) * t), c = r % 6;
			return [
				255 * [
					n,
					o,
					a,
					a,
					s,
					n
				][c],
				255 * [
					s,
					n,
					n,
					o,
					a,
					a
				][c],
				255 * [
					a,
					a,
					s,
					n,
					n,
					o
				][c]
			];
		}
		function g(e, t, n) {
			let r = (2 - (t /= 100)) * (n /= 100) / 2;
			return r !== 0 && (t = r === 1 ? 0 : r < .5 ? t * n / (2 * r) : t * n / (2 - 2 * r)), [
				e,
				100 * t,
				100 * r
			];
		}
		function _(e, t, n) {
			let r = d(e /= 255, t /= 255, n /= 255), i = f(e, t, n), a = i - r, o, s;
			if (a === 0) o = s = 0;
			else {
				s = a / i;
				let r = ((i - e) / 6 + a / 2) / a, c = ((i - t) / 6 + a / 2) / a, l = ((i - n) / 6 + a / 2) / a;
				e === i ? o = l - c : t === i ? o = 1 / 3 + r - l : n === i && (o = 2 / 3 + c - r), o < 0 ? o += 1 : o > 1 && --o;
			}
			return [
				360 * o,
				100 * s,
				100 * i
			];
		}
		function v(e, t, n, r) {
			return t /= 100, n /= 100, [..._(255 * (1 - d(1, (e /= 100) * (1 - (r /= 100)) + r)), 255 * (1 - d(1, t * (1 - r) + r)), 255 * (1 - d(1, n * (1 - r) + r)))];
		}
		function y(e, t, n) {
			t /= 100;
			let r = 2 * (t *= (n /= 100) < .5 ? n : 1 - n) / (n + t) * 100, i = 100 * (n + t);
			return [
				e,
				isNaN(r) ? 0 : r,
				i
			];
		}
		function b(e) {
			return _(...e.match(/.{2}/g).map(((e) => parseInt(e, 16))));
		}
		function x(e) {
			e = e.match(/^[a-zA-Z]+$/) ? function(e) {
				if (e.toLowerCase() === "black") return "#000";
				let t = document.createElement("canvas").getContext("2d");
				return t.fillStyle = e, t.fillStyle === "#000" ? null : t.fillStyle;
			}(e) : e;
			let t = {
				cmyk: /^cmyk\D+([\d.]+)\D+([\d.]+)\D+([\d.]+)\D+([\d.]+)/i,
				rgba: /^rgba?\D+([\d.]+)(%?)\D+([\d.]+)(%?)\D+([\d.]+)(%?)\D*?(([\d.]+)(%?)|$)/i,
				hsla: /^hsla?\D+([\d.]+)\D+([\d.]+)\D+([\d.]+)\D*?(([\d.]+)(%?)|$)/i,
				hsva: /^hsva?\D+([\d.]+)\D+([\d.]+)\D+([\d.]+)\D*?(([\d.]+)(%?)|$)/i,
				hexa: /^#?(([\dA-Fa-f]{3,4})|([\dA-Fa-f]{6})|([\dA-Fa-f]{8}))$/i
			}, n = (e) => e.map(((e) => /^(|\d+)\.\d+|\d+$/.test(e) ? Number(e) : void 0)), r;
			t: for (let i in t) if (r = t[i].exec(e)) switch (i) {
				case "cmyk": {
					let [, e, t, a, o] = n(r);
					if (e > 100 || t > 100 || a > 100 || o > 100) break t;
					return {
						values: v(e, t, a, o),
						type: i
					};
				}
				case "rgba": {
					let [, e, , t, , a, , , o] = n(r);
					if (e = r[2] === "%" ? e / 100 * 255 : e, t = r[4] === "%" ? t / 100 * 255 : t, a = r[6] === "%" ? a / 100 * 255 : a, o = r[9] === "%" ? o / 100 : o, e > 255 || t > 255 || a > 255 || o < 0 || o > 1) break t;
					return {
						values: [..._(e, t, a), o],
						a: o,
						type: i
					};
				}
				case "hexa": {
					let [, e] = r;
					e.length !== 4 && e.length !== 3 || (e = e.split("").map(((e) => e + e)).join(""));
					let t = e.substring(0, 6), n = e.substring(6);
					return n = n ? parseInt(n, 16) / 255 : void 0, {
						values: [...b(t), n],
						a: n,
						type: i
					};
				}
				case "hsla": {
					let [, e, t, a, , o] = n(r);
					if (o = r[6] === "%" ? o / 100 : o, e > 360 || t > 100 || a > 100 || o < 0 || o > 1) break t;
					return {
						values: [...y(e, t, a), o],
						a: o,
						type: i
					};
				}
				case "hsva": {
					let [, e, t, a, , o] = n(r);
					if (o = r[6] === "%" ? o / 100 : o, e > 360 || t > 100 || a > 100 || o < 0 || o > 1) break t;
					return {
						values: [
							e,
							t,
							a,
							o
						],
						a: o,
						type: i
					};
				}
			}
			return {
				values: null,
				type: null
			};
		}
		function S(e = 0, t = 0, n = 0, r = 1) {
			let i = (e, t) => (n = -1) => t(~n ? e.map(((e) => Number(e.toFixed(n)))) : e), a = {
				h: e,
				s: t,
				v: n,
				a: r,
				toHSVA() {
					let e = [
						a.h,
						a.s,
						a.v,
						a.a
					];
					return e.toString = i(e, ((e) => `hsva(${e[0]}, ${e[1]}%, ${e[2]}%, ${a.a})`)), e;
				},
				toHSLA() {
					let e = [...g(a.h, a.s, a.v), a.a];
					return e.toString = i(e, ((e) => `hsla(${e[0]}, ${e[1]}%, ${e[2]}%, ${a.a})`)), e;
				},
				toRGBA() {
					let e = [...h(a.h, a.s, a.v), a.a];
					return e.toString = i(e, ((e) => `rgba(${e[0]}, ${e[1]}, ${e[2]}, ${a.a})`)), e;
				},
				toCMYK() {
					let e = function(e, t, n) {
						let r = h(e, t, n), i = r[0] / 255, a = r[1] / 255, o = r[2] / 255, s = d(1 - i, 1 - a, 1 - o);
						return [
							100 * (s === 1 ? 0 : (1 - i - s) / (1 - s)),
							100 * (s === 1 ? 0 : (1 - a - s) / (1 - s)),
							100 * (s === 1 ? 0 : (1 - o - s) / (1 - s)),
							100 * s
						];
					}(a.h, a.s, a.v);
					return e.toString = i(e, ((e) => `cmyk(${e[0]}%, ${e[1]}%, ${e[2]}%, ${e[3]}%)`)), e;
				},
				toHEXA() {
					let e = function(e, t, n) {
						return h(e, t, n).map(((e) => m(e).toString(16).padStart(2, "0")));
					}(a.h, a.s, a.v), t = a.a >= 1 ? "" : Number((255 * a.a).toFixed(0)).toString(16).toUpperCase().padStart(2, "0");
					return t && e.push(t), e.toString = () => `#${e.join("").toUpperCase()}`, e;
				},
				clone: () => S(a.h, a.s, a.v, a.a)
			};
			return a;
		}
		let C = (e) => Math.max(Math.min(e, 1), 0);
		function w(e) {
			let t = {
				options: Object.assign({
					lock: null,
					onchange: () => 0,
					onstop: () => 0
				}, e),
				_keyboard(e) {
					let { options: n } = t, { type: r, key: i } = e;
					if (document.activeElement === n.wrapper) {
						let { lock: n } = t.options, a = i === "ArrowUp", o = i === "ArrowRight", s = i === "ArrowDown", c = i === "ArrowLeft";
						if (r === "keydown" && (a || o || s || c)) {
							let r = 0, i = 0;
							n === "v" ? r = a || o ? 1 : -1 : n === "h" ? r = a || o ? -1 : 1 : (i = a ? -1 : +!!s, r = c ? -1 : +!!o), t.update(C(t.cache.x + .01 * r), C(t.cache.y + .01 * i)), e.preventDefault();
						} else i.startsWith("Arrow") && (t.options.onstop(), e.preventDefault());
					}
				},
				_tapstart(e) {
					i(document, [
						"mouseup",
						"touchend",
						"touchcancel"
					], t._tapstop), i(document, ["mousemove", "touchmove"], t._tapmove), e.cancelable && e.preventDefault(), t._tapmove(e);
				},
				_tapmove(e) {
					let { options: n, cache: r } = t, { lock: i, element: a, wrapper: o } = n, s = o.getBoundingClientRect(), c = 0, l = 0;
					if (e) {
						let t = e && e.touches && e.touches[0];
						c = e ? (t || e).clientX : 0, l = e ? (t || e).clientY : 0, c < s.left ? c = s.left : c > s.left + s.width && (c = s.left + s.width), l < s.top ? l = s.top : l > s.top + s.height && (l = s.top + s.height), c -= s.left, l -= s.top;
					} else r && (c = r.x * s.width, l = r.y * s.height);
					i !== "h" && (a.style.left = `calc(${c / s.width * 100}% - ${a.offsetWidth / 2}px)`), i !== "v" && (a.style.top = `calc(${l / s.height * 100}% - ${a.offsetHeight / 2}px)`), t.cache = {
						x: c / s.width,
						y: l / s.height
					};
					let u = C(c / s.width), d = C(l / s.height);
					switch (i) {
						case "v": return n.onchange(u);
						case "h": return n.onchange(d);
						default: return n.onchange(u, d);
					}
				},
				_tapstop() {
					t.options.onstop(), a(document, [
						"mouseup",
						"touchend",
						"touchcancel"
					], t._tapstop), a(document, ["mousemove", "touchmove"], t._tapmove);
				},
				trigger() {
					t._tapmove();
				},
				update(e = 0, n = 0) {
					let { left: r, top: i, width: a, height: o } = t.options.wrapper.getBoundingClientRect();
					t.options.lock === "h" && (n = e), t._tapmove({
						clientX: r + a * e,
						clientY: i + o * n
					});
				},
				destroy() {
					let { options: e, _tapstart: n, _keyboard: r } = t;
					a(document, ["keydown", "keyup"], r), a([e.wrapper, e.element], "mousedown", n), a([e.wrapper, e.element], "touchstart", n, { passive: !1 });
				}
			}, { options: n, _tapstart: r, _keyboard: o } = t;
			return i([n.wrapper, n.element], "mousedown", r), i([n.wrapper, n.element], "touchstart", r, { passive: !1 }), i(document, ["keydown", "keyup"], o), t;
		}
		function T(e = {}) {
			e = Object.assign({
				onchange: () => 0,
				className: "",
				elements: []
			}, e);
			let t = i(e.elements, "click", ((t) => {
				e.elements.forEach(((n) => n.classList[t.target === n ? "add" : "remove"](e.className))), e.onchange(t), t.stopPropagation();
			}));
			return { destroy: () => a(...t) };
		}
		let E = {
			variantFlipOrder: {
				start: "sme",
				middle: "mse",
				end: "ems"
			},
			positionFlipOrder: {
				top: "tbrl",
				right: "rltb",
				bottom: "btrl",
				left: "lrbt"
			},
			position: "bottom",
			margin: 8,
			padding: 0
		}, D = (e, t, n) => {
			let r = typeof e != "object" || e instanceof HTMLElement ? {
				reference: e,
				popper: t,
				...n
			} : e;
			return { update(e = r) {
				let { reference: t, popper: n } = Object.assign(r, e);
				if (!n || !t) throw Error("Popper- or reference-element missing.");
				return ((e, t, n) => {
					let { container: r, arrow: i, margin: a, padding: o, position: s, variantFlipOrder: c, positionFlipOrder: l } = {
						container: document.documentElement.getBoundingClientRect(),
						...E,
						...n
					}, { left: u, top: d } = t.style;
					t.style.left = "0", t.style.top = "0";
					let f = e.getBoundingClientRect(), p = t.getBoundingClientRect(), m = {
						t: f.top - p.height - a,
						b: f.bottom + a,
						r: f.right + a,
						l: f.left - p.width - a
					}, h = {
						vs: f.left,
						vm: f.left + f.width / 2 - p.width / 2,
						ve: f.left + f.width - p.width,
						hs: f.top,
						hm: f.bottom - f.height / 2 - p.height / 2,
						he: f.bottom - p.height
					}, [g, _ = "middle"] = s.split("-"), v = l[g], y = c[_], { top: b, left: x, bottom: S, right: C } = r;
					for (let e of v) {
						let n = e === "t" || e === "b", r = m[e], [a, s] = n ? ["top", "left"] : ["left", "top"], [c, l] = n ? [p.height, p.width] : [p.width, p.height], [u, d] = n ? [S, C] : [C, S], [g, _] = n ? [b, x] : [x, b];
						if (!(r < g || r + c + o > u)) for (let u of y) {
							let m = h[(n ? "v" : "h") + u];
							if (!(m < _ || m + l + o > d)) {
								if (m -= p[s], r -= p[a], t.style[s] = `${m}px`, t.style[a] = `${r}px`, i) {
									let t = n ? f.width / 2 : f.height / 2, o = l / 2, d = t > o, p = m + {
										s: d ? o : t,
										m: o,
										e: d ? o : l - t
									}[u], h = r + {
										t: c,
										b: 0,
										r: 0,
										l: c
									}[e];
									i.style[s] = `${p}px`, i.style[a] = `${h}px`;
								}
								return e + u;
							}
						}
					}
					return t.style.left = u, t.style.top = d, null;
				})(t, n, r);
			} };
		};
		class O {
			static utils = n;
			static version = "1.9.1";
			static I18N_DEFAULTS = {
				"ui:dialog": "color picker dialog",
				"btn:toggle": "toggle color picker dialog",
				"btn:swatch": "color swatch",
				"btn:last-color": "use previous color",
				"btn:save": "Save",
				"btn:cancel": "Cancel",
				"btn:clear": "Clear",
				"aria:btn:save": "save and close",
				"aria:btn:cancel": "cancel and close",
				"aria:btn:clear": "clear and close",
				"aria:input": "color input field",
				"aria:palette": "color selection area",
				"aria:hue": "hue selection slider",
				"aria:opacity": "selection slider"
			};
			static DEFAULT_OPTIONS = {
				appClass: null,
				theme: "classic",
				useAsButton: !1,
				padding: 8,
				disabled: !1,
				comparison: !0,
				closeOnScroll: !1,
				outputPrecision: 0,
				lockOpacity: !1,
				autoReposition: !0,
				container: "body",
				components: { interaction: {} },
				i18n: {},
				swatches: null,
				inline: !1,
				sliders: null,
				default: "#42445a",
				defaultRepresentation: null,
				position: "bottom-middle",
				adjustableNumbers: !0,
				showAlways: !1,
				closeWithKey: "Escape"
			};
			_initializingActive = !0;
			_recalc = !0;
			_nanopop = null;
			_root = null;
			_color = S();
			_lastColor = S();
			_swatchColors = [];
			_setupAnimationFrame = null;
			_eventListener = {
				init: [],
				save: [],
				hide: [],
				show: [],
				clear: [],
				change: [],
				changestop: [],
				cancel: [],
				swatchselect: []
			};
			constructor(e) {
				this.options = e = Object.assign({ ...O.DEFAULT_OPTIONS }, e);
				let { swatches: t, components: n, theme: r, sliders: i, lockOpacity: a, padding: o } = e;
				["nano", "monolith"].includes(r) && !i && (e.sliders = "h"), n.interaction ||= {};
				let { preview: s, opacity: c, hue: l, palette: u } = n;
				n.opacity = !a && c, n.palette = u || s || c || l, this._preBuild(), this._buildComponents(), this._bindEvents(), this._finalBuild(), t && t.length && t.forEach(((e) => this.addSwatch(e)));
				let { button: d, app: f } = this._root;
				this._nanopop = D(d, f, { margin: o }), d.setAttribute("role", "button"), d.setAttribute("aria-label", this._t("btn:toggle"));
				let p = this;
				this._setupAnimationFrame = requestAnimationFrame((function t() {
					if (!f.offsetWidth) return requestAnimationFrame(t);
					p.setColor(e.default), p._rePositioningPicker(), e.defaultRepresentation && (p._representation = e.defaultRepresentation, p.setColorRepresentation(p._representation)), e.showAlways && p.show(), p._initializingActive = !1, p._emit("init");
				}));
			}
			static create = (e) => new O(e);
			_preBuild() {
				let { options: e } = this;
				for (let t of ["el", "container"]) e[t] = l(e[t]);
				this._root = ((e) => {
					let { components: t, useAsButton: n, inline: r, appClass: i, theme: a, lockOpacity: o } = e.options, c = (e) => e ? "" : "style=\"display:none\" hidden", l = (t) => e._t(t), u = s(`\n      <div :ref="root" class="pickr">\n\n        ${n ? "" : "<button type=\"button\" :ref=\"button\" class=\"pcr-button\"></button>"}\n\n        <div :ref="app" class="pcr-app ${i || ""}" data-theme="${a}" ${r ? "style=\"position: unset\"" : ""} aria-label="${l("ui:dialog")}" role="window">\n          <div class="pcr-selection" ${c(t.palette)}>\n            <div :obj="preview" class="pcr-color-preview" ${c(t.preview)}>\n              <button type="button" :ref="lastColor" class="pcr-last-color" aria-label="${l("btn:last-color")}"></button>\n              <div :ref="currentColor" class="pcr-current-color"></div>\n            </div>\n\n            <div :obj="palette" class="pcr-color-palette">\n              <div :ref="picker" class="pcr-picker"></div>\n              <div :ref="palette" class="pcr-palette" tabindex="0" aria-label="${l("aria:palette")}" role="listbox"></div>\n            </div>\n\n            <div :obj="hue" class="pcr-color-chooser" ${c(t.hue)}>\n              <div :ref="picker" class="pcr-picker"></div>\n              <div :ref="slider" class="pcr-hue pcr-slider" tabindex="0" aria-label="${l("aria:hue")}" role="slider"></div>\n            </div>\n\n            <div :obj="opacity" class="pcr-color-opacity" ${c(t.opacity)}>\n              <div :ref="picker" class="pcr-picker"></div>\n              <div :ref="slider" class="pcr-opacity pcr-slider" tabindex="0" aria-label="${l("aria:opacity")}" role="slider"></div>\n            </div>\n          </div>\n\n          <div class="pcr-swatches ${t.palette ? "" : "pcr-last"}" :ref="swatches"></div>\n\n          <div :obj="interaction" class="pcr-interaction" ${c(Object.keys(t.interaction).length)}>\n            <input :ref="result" class="pcr-result" type="text" spellcheck="false" ${c(t.interaction.input)} aria-label="${l("aria:input")}">\n\n            <input :arr="options" class="pcr-type" data-type="HEXA" value="${o ? "HEX" : "HEXA"}" type="button" ${c(t.interaction.hex)}>\n            <input :arr="options" class="pcr-type" data-type="RGBA" value="${o ? "RGB" : "RGBA"}" type="button" ${c(t.interaction.rgba)}>\n            <input :arr="options" class="pcr-type" data-type="HSLA" value="${o ? "HSL" : "HSLA"}" type="button" ${c(t.interaction.hsla)}>\n            <input :arr="options" class="pcr-type" data-type="HSVA" value="${o ? "HSV" : "HSVA"}" type="button" ${c(t.interaction.hsva)}>\n            <input :arr="options" class="pcr-type" data-type="CMYK" value="CMYK" type="button" ${c(t.interaction.cmyk)}>\n\n            <input :ref="save" class="pcr-save" value="${l("btn:save")}" type="button" ${c(t.interaction.save)} aria-label="${l("aria:btn:save")}">\n            <input :ref="cancel" class="pcr-cancel" value="${l("btn:cancel")}" type="button" ${c(t.interaction.cancel)} aria-label="${l("aria:btn:cancel")}">\n            <input :ref="clear" class="pcr-clear" value="${l("btn:clear")}" type="button" ${c(t.interaction.clear)} aria-label="${l("aria:btn:clear")}">\n          </div>\n        </div>\n      </div>\n    `), d = u.interaction;
					return d.options.find(((e) => !e.hidden && !e.classList.add("active"))), d.type = () => d.options.find(((e) => e.classList.contains("active"))), u;
				})(this), e.useAsButton && (this._root.button = e.el), e.container.appendChild(this._root.root);
			}
			_finalBuild() {
				let e = this.options, t = this._root;
				if (e.container.removeChild(t.root), e.inline) {
					let n = e.el.parentElement;
					e.el.nextSibling ? n.insertBefore(t.app, e.el.nextSibling) : n.appendChild(t.app);
				} else e.container.appendChild(t.app);
				e.useAsButton ? e.inline && e.el.remove() : e.el.parentNode.replaceChild(t.root, e.el), e.disabled && this.disable(), e.comparison || (t.button.style.transition = "none", e.useAsButton || (t.preview.lastColor.style.transition = "none")), this.hide();
			}
			_buildComponents() {
				let e = this, t = this.options.components, n = (e.options.sliders || "v").repeat(2), [r, i] = n.match(/^[vh]+$/g) ? n : [], a = () => this._color ||= this._lastColor.clone(), o = {
					palette: w({
						element: e._root.palette.picker,
						wrapper: e._root.palette.palette,
						onstop: () => e._emit("changestop", "slider", e),
						onchange(n, r) {
							if (!t.palette) return;
							let i = a(), { _root: o, options: s } = e, { lastColor: c, currentColor: l } = o.preview;
							e._recalc && (i.s = 100 * n, i.v = 100 - 100 * r, i.v < 0 && (i.v = 0), e._updateOutput("slider"));
							let u = i.toRGBA().toString(0);
							this.element.style.background = u, this.wrapper.style.background = `\n                        linear-gradient(to top, rgba(0, 0, 0, ${i.a}), transparent),\n                        linear-gradient(to left, hsla(${i.h}, 100%, 50%, ${i.a}), rgba(255, 255, 255, ${i.a}))\n                    `, s.comparison ? s.useAsButton || e._lastColor || c.style.setProperty("--pcr-color", u) : (o.button.style.setProperty("--pcr-color", u), o.button.classList.remove("clear"));
							let d = i.toHEXA().toString();
							for (let { el: t, color: n } of e._swatchColors) t.classList[d === n.toHEXA().toString() ? "add" : "remove"]("pcr-active");
							l.style.setProperty("--pcr-color", u);
						}
					}),
					hue: w({
						lock: i === "v" ? "h" : "v",
						element: e._root.hue.picker,
						wrapper: e._root.hue.slider,
						onstop: () => e._emit("changestop", "slider", e),
						onchange(n) {
							if (!t.hue || !t.palette) return;
							let r = a();
							e._recalc && (r.h = 360 * n), this.element.style.backgroundColor = `hsl(${r.h}, 100%, 50%)`, o.palette.trigger();
						}
					}),
					opacity: w({
						lock: r === "v" ? "h" : "v",
						element: e._root.opacity.picker,
						wrapper: e._root.opacity.slider,
						onstop: () => e._emit("changestop", "slider", e),
						onchange(n) {
							if (!t.opacity || !t.palette) return;
							let r = a();
							e._recalc && (r.a = Math.round(100 * n) / 100), this.element.style.background = `rgba(0, 0, 0, ${r.a})`, o.palette.trigger();
						}
					}),
					selectable: T({
						elements: e._root.interaction.options,
						className: "active",
						onchange(t) {
							e._representation = t.target.getAttribute("data-type").toUpperCase(), e._recalc && e._updateOutput("swatch");
						}
					})
				};
				this._components = o;
			}
			_bindEvents() {
				let { _root: e, options: t } = this, n = [
					i(e.interaction.clear, "click", (() => this._clearColor())),
					i([e.interaction.cancel, e.preview.lastColor], "click", (() => {
						this.setHSVA(...(this._lastColor || this._color).toHSVA(), !0), this._emit("cancel");
					})),
					i(e.interaction.save, "click", (() => {
						!this.applyColor() && !t.showAlways && this.hide();
					})),
					i(e.interaction.result, ["keyup", "input"], ((e) => {
						this.setColor(e.target.value, !0) && !this._initializingActive && (this._emit("change", this._color, "input", this), this._emit("changestop", "input", this)), e.stopImmediatePropagation();
					})),
					i(e.interaction.result, ["focus", "blur"], ((e) => {
						this._recalc = e.type === "blur", this._recalc && this._updateOutput(null);
					})),
					i([
						e.palette.palette,
						e.palette.picker,
						e.hue.slider,
						e.hue.picker,
						e.opacity.slider,
						e.opacity.picker
					], ["mousedown", "touchstart"], (() => this._recalc = !0), { passive: !0 })
				];
				if (!t.showAlways) {
					let r = t.closeWithKey;
					n.push(i(e.button, "click", (() => this.isOpen() ? this.hide() : this.show())), i(document, "keyup", ((e) => this.isOpen() && (e.key === r || e.code === r) && this.hide())), i(document, ["touchstart", "mousedown"], ((t) => {
						this.isOpen() && !c(t).some(((t) => t === e.app || t === e.button)) && this.hide();
					}), { capture: !0 }));
				}
				if (t.adjustableNumbers) {
					let t = {
						rgba: [
							255,
							255,
							255,
							1
						],
						hsva: [
							360,
							100,
							100,
							1
						],
						hsla: [
							360,
							100,
							100,
							1
						],
						cmyk: [
							100,
							100,
							100,
							100
						]
					};
					u(e.interaction.result, ((e, n, r) => {
						let i = t[this.getColorRepresentation().toLowerCase()];
						if (i) {
							let t = i[r], a = e + (t >= 100 ? 1e3 * n : n);
							return a <= 0 ? 0 : Number((a < t ? a : t).toPrecision(3));
						}
						return e;
					}));
				}
				if (t.autoReposition && !t.inline) {
					let e = null, r = this;
					n.push(i(window, ["scroll", "resize"], (() => {
						r.isOpen() && (t.closeOnScroll && r.hide(), e === null ? (e = setTimeout((() => e = null), 100), requestAnimationFrame((function t() {
							r._rePositioningPicker(), e !== null && requestAnimationFrame(t);
						}))) : (clearTimeout(e), e = setTimeout((() => e = null), 100)));
					}), { capture: !0 }));
				}
				this._eventBindings = n;
			}
			_rePositioningPicker() {
				let { options: e } = this;
				if (!e.inline && !this._nanopop.update({
					container: document.body.getBoundingClientRect(),
					position: e.position
				})) {
					let e = this._root.app, t = e.getBoundingClientRect();
					e.style.top = (window.innerHeight - t.height) / 2 + "px", e.style.left = (window.innerWidth - t.width) / 2 + "px";
				}
			}
			_updateOutput(e) {
				let { _root: t, _color: n, options: r } = this;
				if (t.interaction.type()) {
					let e = `to${t.interaction.type().getAttribute("data-type")}`;
					t.interaction.result.value = typeof n[e] == "function" ? n[e]().toString(r.outputPrecision) : "";
				}
				!this._initializingActive && this._recalc && this._emit("change", n, e, this);
			}
			_clearColor(e = !1) {
				let { _root: t, options: n } = this;
				n.useAsButton || t.button.style.setProperty("--pcr-color", "rgba(0, 0, 0, 0.15)"), t.button.classList.add("clear"), n.showAlways || this.hide(), this._lastColor = null, this._initializingActive || e || (this._emit("save", null), this._emit("clear"));
			}
			_parseLocalColor(e) {
				let { values: t, type: n, a: r } = x(e), { lockOpacity: i } = this.options, a = r !== void 0 && r !== 1;
				return t && t.length === 3 && (t[3] = void 0), {
					values: !t || i && a ? null : t,
					type: n
				};
			}
			_t(e) {
				return this.options.i18n[e] || O.I18N_DEFAULTS[e];
			}
			_emit(e, ...t) {
				this._eventListener[e].forEach(((e) => e(...t, this)));
			}
			on(e, t) {
				return this._eventListener[e].push(t), this;
			}
			off(e, t) {
				let n = this._eventListener[e] || [], r = n.indexOf(t);
				return ~r && n.splice(r, 1), this;
			}
			addSwatch(e) {
				let { values: t } = this._parseLocalColor(e);
				if (t) {
					let { _swatchColors: e, _root: n } = this, r = S(...t), a = o(`<button type="button" style="--pcr-color: ${r.toRGBA().toString(0)}" aria-label="${this._t("btn:swatch")}"/>`);
					return n.swatches.appendChild(a), e.push({
						el: a,
						color: r
					}), this._eventBindings.push(i(a, "click", (() => {
						this.setHSVA(...r.toHSVA(), !0), this._emit("swatchselect", r), this._emit("change", r, "swatch", this);
					}))), !0;
				}
				return !1;
			}
			removeSwatch(e) {
				let t = this._swatchColors[e];
				if (t) {
					let { el: n } = t;
					return this._root.swatches.removeChild(n), this._swatchColors.splice(e, 1), !0;
				}
				return !1;
			}
			applyColor(e = !1) {
				let { preview: t, button: n } = this._root, r = this._color.toRGBA().toString(0);
				return t.lastColor.style.setProperty("--pcr-color", r), this.options.useAsButton || n.style.setProperty("--pcr-color", r), n.classList.remove("clear"), this._lastColor = this._color.clone(), this._initializingActive || e || this._emit("save", this._color), this;
			}
			destroy() {
				cancelAnimationFrame(this._setupAnimationFrame), this._eventBindings.forEach(((e) => a(...e))), Object.keys(this._components).forEach(((e) => this._components[e].destroy()));
			}
			destroyAndRemove() {
				this.destroy();
				let { root: e, app: t } = this._root;
				e.parentElement && e.parentElement.removeChild(e), t.parentElement.removeChild(t), Object.keys(this).forEach(((e) => this[e] = null));
			}
			hide() {
				return !!this.isOpen() && (this._root.app.classList.remove("visible"), this._emit("hide"), !0);
			}
			show() {
				return !this.options.disabled && !this.isOpen() && (this._root.app.classList.add("visible"), this._rePositioningPicker(), this._emit("show", this._color), this);
			}
			isOpen() {
				return this._root.app.classList.contains("visible");
			}
			setHSVA(e = 360, t = 0, n = 0, r = 1, i = !1) {
				let a = this._recalc;
				if (this._recalc = !1, e < 0 || e > 360 || t < 0 || t > 100 || n < 0 || n > 100 || r < 0 || r > 1) return !1;
				this._color = S(e, t, n, r);
				let { hue: o, opacity: s, palette: c } = this._components;
				return o.update(e / 360), s.update(r), c.update(t / 100, 1 - n / 100), i || this.applyColor(), a && this._updateOutput(), this._recalc = a, !0;
			}
			setColor(e, t = !1) {
				if (e === null) return this._clearColor(t), !0;
				let { values: n, type: r } = this._parseLocalColor(e);
				if (n) {
					let e = r.toUpperCase(), { options: i } = this._root.interaction, a = i.find(((t) => t.getAttribute("data-type") === e));
					if (a && !a.hidden) for (let e of i) e.classList[e === a ? "add" : "remove"]("active");
					return !!this.setHSVA(...n, t) && this.setColorRepresentation(e);
				}
				return !1;
			}
			setColorRepresentation(e) {
				return e = e.toUpperCase(), !!this._root.interaction.options.find(((t) => t.getAttribute("data-type").startsWith(e) && !t.click()));
			}
			getColorRepresentation() {
				return this._representation;
			}
			getColor() {
				return this._color;
			}
			getSelectedColor() {
				return this._lastColor;
			}
			getRoot() {
				return this._root;
			}
			disable() {
				return this.hide(), this.options.disabled = !0, this._root.button.classList.add("disabled"), this;
			}
			enable() {
				return this.options.disabled = !1, this._root.button.classList.remove("disabled"), this;
			}
		}
		return t = t.default;
	})()));
})))(), 1), Ie = [
	"#000000",
	"#ffffff",
	"#7f7f7f",
	"#ff0000",
	"#ff8000",
	"#ffff00",
	"#00ff00",
	"#008000",
	"#00ffff",
	"#0000ff",
	"#8000ff",
	"#ff00ff",
	"rgba(0,0,0,0)"
];
function Le(e) {
	let { button: t, value: n, onChange: r, paintButton: i = !0 } = e, a = Fe.default.create({
		el: t,
		theme: "nano",
		default: n,
		useAsButton: !0,
		comparison: !1,
		appClass: "webmapx-pickr",
		autoReposition: !1,
		swatches: Ie,
		components: {
			preview: !0,
			opacity: !0,
			hue: !0,
			interaction: {
				input: !0,
				cancel: !0,
				save: !0,
				rgba: !1,
				hsla: !1,
				hsva: !1,
				cmyk: !1,
				hex: !1
			}
		}
	});
	Re(a, t);
	let o = n;
	return a.on("change", (e) => {
		let n = e.toRGBA().toString(0);
		i && (t.style.background = n), r(n);
	}), a.on("save", () => {
		o = a.getColor()?.toRGBA().toString(0) ?? o, a.hide();
	}), a.on("cancel", () => {
		i && (t.style.background = o), e.onCancel?.(o), a.hide();
	}), a;
}
function Re(e, t) {
	let n = e.getRoot().app;
	!n || typeof n.showPopover != "function" || (n.popover = "manual", n.style.border = "0", n.style.padding = "0", n.style.overflow = "visible", e.on("show", () => {
		ze(n, t), n.matches(":popover-open") || n.showPopover(), Ve(n, t);
	}), e.on("hide", () => {
		n.matches(":popover-open") && n.hidePopover();
	}));
}
function ze(e, t) {
	let n = Be(t) ?? document.body;
	e.parentElement !== n && (e.matches(":popover-open") && e.hidePopover(), n.appendChild(e));
}
function Be(e) {
	let t = e;
	for (; t;) {
		if (t instanceof ShadowRoot) {
			t = t.host;
			continue;
		}
		if (!(t instanceof Element)) return null;
		let e = t.closest("dialog");
		if (!e) {
			let e = t.getRootNode();
			if (!(e instanceof ShadowRoot)) return null;
			t = e;
			continue;
		}
		if (e.matches(":modal") && e.getRootNode() === document) return e;
		t = e.parentNode;
	}
	return null;
}
function Ve(e, t) {
	let n = t.getBoundingClientRect(), { width: r, height: i } = e.getBoundingClientRect(), a = n.bottom + 6, o = a + i <= window.innerHeight ? a : Math.max(6, n.top - 6 - i), s = Math.min(Math.max(6, n.left), window.innerWidth - r - 6);
	e.style.position = "fixed", e.style.margin = "0", e.style.inset = "auto", e.style.left = `${s}px`, e.style.top = `${o}px`;
}
//#endregion
//#region src/utils/legend-numbers.ts
var He = 1e4, Ue = 4;
function We(e, t = {}) {
	let n = t.unit ?? "";
	if (!Number.isFinite(e)) return `?${n}`;
	let r = Math.abs(e), i = t.decimals ?? (r >= 100 ? 0 : r >= 1 ? 1 : 3);
	if (t.compact !== !1) {
		let t = Ge(e, n);
		if (t) return t;
	}
	return `${Number(e.toFixed(i)).toLocaleString("en-US", {
		minimumFractionDigits: i,
		maximumFractionDigits: i,
		useGrouping: r >= He
	})}${n}`;
}
function Ge(e, t) {
	let n = Math.abs(e);
	return n >= 1e9 ? `${Number((e / 1e9).toFixed(1))}B${t}` : n >= 1e6 ? `${Number((e / 1e6).toFixed(1))}M${t}` : null;
}
function P(e, t) {
	let n = Ke(e), r = e.map((e) => Ge(e, "")), i = r.every((e) => e !== null) && new Set(r).size === e.length;
	return (e) => We(e, {
		unit: t,
		decimals: n,
		compact: i
	});
}
function Ke(e) {
	for (let t = 0; t <= Ue; t++) {
		let n = e.map((e) => e.toFixed(t));
		if (new Set(n).size === e.length) return t;
	}
	return Ue;
}
function F(e) {
	let t = e?.paint;
	return t && typeof t == "object" && !Array.isArray(t) ? t : {};
}
function qe(e) {
	let t = e?.metadata;
	return t && typeof t == "object" && !Array.isArray(t) ? t : {};
}
function Je(e, t) {
	return JSON.stringify(e ?? null) === JSON.stringify(t ?? null);
}
function Ye(e) {
	let t = qe(e);
	return [
		"label",
		"title",
		"name",
		"legend"
	].some((e) => t[e] !== void 0);
}
function Xe(e, t) {
	let n = e[t], r = e[t + 1];
	if (!n || n.type !== "fill" || !r || r.type !== "line") return -1;
	if (qe(r).outlineOf === n.id) return t + 1;
	if (Ye(r)) return -1;
	for (let e of [
		"source",
		"source-layer",
		"filter",
		"minzoom",
		"maxzoom"
	]) if (!Je(n[e], r[e])) return -1;
	let i = F(r);
	return typeof (i["line-color"] ?? "#000000") != "string" || typeof (i["line-width"] ?? 1) != "number" || i["line-opacity"] !== void 0 && typeof i["line-opacity"] != "number" ? -1 : t + 1;
}
function Ze(e) {
	let t = /* @__PURE__ */ new Map();
	return e.forEach((n, r) => {
		let i = Xe(e, r);
		i >= 0 && t.set(String(n.id ?? ""), String(e[i].id ?? ""));
	}), t;
}
function Qe(e) {
	let t = F(e)["fill-opacity"] ?? 1;
	return typeof t == "number" ? t : null;
}
function $e(e, t) {
	if (t) {
		let e = F(t);
		return {
			color: String(e["line-color"] ?? "#000000"),
			width: Number(e["line-width"] ?? 1),
			opacity: Number(e["line-opacity"] ?? 1)
		};
	}
	let n = F(e)["fill-outline-color"];
	if (typeof n == "string") return {
		color: n,
		width: 1,
		opacity: Qe(e) ?? 1
	};
	let r = F(e)["fill-color"];
	return {
		color: typeof r == "string" ? r : "#000000",
		width: 0,
		opacity: 1
	};
}
function et(e, t, n) {
	return t.width !== 1 || Qe(e) !== t.opacity ? !1 : Object.keys(F(n ?? void 0)).filter((e) => ![
		"line-color",
		"line-width",
		"line-opacity"
	].includes(e)).length === 0;
}
function tt(e, t) {
	let n = new Set(e.map((e) => String(e.id ?? "")));
	if (!n.has(t)) return t;
	for (let e = 2;; e += 1) if (!n.has(`${t}-${e}`)) return `${t}-${e}`;
}
function nt(e, t, n) {
	let r = e.findIndex((e) => String(e.id ?? "") === t && e.type === "fill");
	if (r < 0) return e;
	let i = e[r], a = Xe(e, r), o = a >= 0 ? e[a] : null, s = e.filter((e, t) => t !== a), c = { ...F(i) }, l = null;
	if (n.width <= 0) delete c["fill-outline-color"];
	else if (et(i, n, o)) c["fill-outline-color"] = n.color;
	else {
		delete c["fill-outline-color"];
		let e = o ?? {
			id: tt(s, `${t}-outline`),
			type: "line",
			...Object.fromEntries([
				"source",
				"source-layer",
				"filter",
				"minzoom",
				"maxzoom"
			].filter((e) => i[e] !== void 0).map((e) => [e, i[e]])),
			metadata: { outlineOf: t }
		}, r = {
			...F(e),
			"line-color": n.color,
			"line-width": n.width
		};
		(n.opacity !== 1 || r["line-opacity"] !== void 0) && (r["line-opacity"] = n.opacity);
		let a = e.layout && typeof e.layout == "object" ? e.layout : {};
		l = {
			...e,
			layout: {
				"line-join": "round",
				"line-cap": "round",
				...a
			},
			paint: r
		};
	}
	let u = {
		...i,
		paint: c
	}, d = s.map((e) => e === i ? u : e);
	return l && d.splice(d.indexOf(u) + 1, 0, l), d;
}
//#endregion
//#region src/utils/wms-source.ts
function rt(e) {
	let t = typeof window < "u" ? window.location.href : "http://localhost/";
	return new URL(e, t);
}
function it(e) {
	for (let t of ["url", "tiles"]) {
		let n = e[t];
		if (typeof n == "string") return {
			urls: [n],
			slot: {
				key: t,
				array: !1
			}
		};
		if (Array.isArray(n) && n.every((e) => typeof e == "string")) return {
			urls: n,
			slot: {
				key: t,
				array: !0
			}
		};
	}
	return null;
}
function I(e, t) {
	for (let [n, r] of e.entries()) if (n.toLowerCase() === t) return r;
	return null;
}
function L(e) {
	if (!e || typeof e != "object") return null;
	let t = it(e);
	if (!t) return null;
	let [n] = t.urls, r;
	try {
		r = rt(n);
	} catch {
		return null;
	}
	let i = r.searchParams, a = I(i, "service"), o = I(i, "request");
	if (!((typeof e.service == "string" ? e.service.toLowerCase() : "") === "wms" || a?.toLowerCase() === "wms" || o?.toLowerCase() === "getmap")) return null;
	let s = I(i, "layers") ?? (typeof e.layers == "string" ? e.layers : "");
	if (!s) return null;
	let c = new URL(r.href);
	return c.search = "", {
		endpoint: c.href,
		layers: s,
		style: I(i, "styles") ?? (typeof e.styles == "string" ? e.styles : ""),
		version: I(i, "version") ?? (typeof e.version == "string" ? e.version : void 0)
	};
}
function at(e, t) {
	let n;
	try {
		n = rt(e);
	} catch {
		return e;
	}
	let r = !1;
	for (let e of [...n.searchParams.keys()]) e.toLowerCase() === "styles" && (n.searchParams.set(e, t), r = !0);
	return r || n.searchParams.set("STYLES", t), decodeURIComponent(n.href);
}
async function ot(e) {
	let { WmsEndpoint: t } = await import("./dist-Qv7sN2XG.js"), n = await new t(e.endpoint).isReady(), r = e.layers.split(",")[0].trim();
	return (n.getLayerByName(r)?.styles ?? []).map((e) => ({
		name: e.name,
		title: e.title || e.name,
		...e.legendUrl ? { legendUrl: e.legendUrl } : {}
	}));
}
//#endregion
//#region src/components/webmapx-layer-legend.ts
var R, st = "#bdbdbd";
function z(e) {
	return String(e).replace(/([_/.])(?=\S)/g, "$1​");
}
var ct = "__legend-outline-width";
function B(e, t) {
	return t === "line" ? `linear-gradient(to bottom, transparent 0 33%, ${e} 33% 67%, transparent 67% 100%)` : e;
}
function V(e) {
	return e === "interpolate" || e === "interpolate-hcl" || e === "interpolate-lab";
}
var H = class extends f {
	static {
		R = this;
	}
	constructor(...e) {
		super(...e), this.layerId = "", this.collapsible = !0, this.meta = null, this.failedLegendUrl = null, this.zoom = 2, this.legendCollapsed = !0, this.legendOverflowing = !1, this.editOverrides = {}, this.outlineWork = Promise.resolve(), this.editorOpenKey = null, this.terrainEnabled = !1, this.legendResizeObserver = null, this.measureLegendQueued = !1, this.pickrInstances = /* @__PURE__ */ new Map(), this.pickrOriginal = /* @__PURE__ */ new Map();
	}
	static {
		this.carriedOver = /* @__PURE__ */ new Map();
	}
	static {
		this.collapsedLegendHeight = 180;
	}
	static {
		this.styles = a`
        :host { display: block; }
        .legend-wrap { display: flex; flex-direction: column; gap: 2px; }
        .legend-collapse {
            position: relative;
        }
        .legend-collapse-content {
            overflow: visible;
        }
        .legend-collapse.collapsed .legend-collapse-content {
            max-height: ${R.collapsedLegendHeight}px;
            overflow: hidden;
        }
        .legend-collapse.collapsed::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            bottom: 26px;
            height: 42px;
            pointer-events: none;
            background: linear-gradient(
                to bottom,
                rgba(255, 255, 255, 0),
                var(--webmapx-legend-bg, var(--color-background, #fff))
            );
        }
        .legend-toggle {
            display: inline-flex;
            align-items: center;
            align-self: flex-start;
            margin-top: 4px;
            padding: 0;
            border: 0;
            background: none;
            color: var(--webmapx-legend-title-color, var(--color-primary, #2b6c8f));
            font: inherit;
            font-size: 0.75rem;
            line-height: 1.2;
            cursor: pointer;
        }
        .legend-toggle:hover {
            text-decoration: underline;
        }
        /* Top-aligned: a label that wraps to several lines keeps its swatch beside the first line, where reading starts. */
        .legend-row { display: flex; align-items: flex-start; gap: 6px; min-height: 18px; width: 100%; padding: 0; border: 0; background: transparent; font: inherit; color: inherit; text-align: left; }
        .legend-label { font-size: 0.75rem; color: var(--color-text-primary, #16202a); line-height: 1.2; min-width: 0; overflow-wrap: anywhere; }
        .legend-img { max-width: 100%; width: auto; height: auto; display: block; border-radius: 3px; align-self: flex-start; }
        .img-error { font-size: 0.75rem; color: var(--sl-color-danger-600, #c0392b); font-style: italic; }
        .sub-group-title { font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary, #5a6773); margin-top: 4px; }
        .sub-row { padding-left: 8px; }
        .editable { cursor: pointer; }
        output.expression { font-style: italic; opacity: 0.7; }
        .editable:hover { background: var(--color-background-secondary, #f4f6f8); }
        .style-editor {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 6px 4px 8px 8px;
            font-size: 0.75rem;
            color: var(--color-text-primary, #16202a);
        }
        .style-editor-row { display: flex; align-items: center; gap: 6px; }
        .style-editor-row label { flex: 0 0 5.5rem; }
        .style-editor-row input[type='range'] { flex: 1 1 auto; min-width: 0; }
        .style-editor-row output { flex: 0 0 2.5rem; text-align: right; color: var(--color-text-secondary, #5a6773); }
        .color-swatch {
            width: 20px;
            height: 12px;
            padding: 0;
            border: 1px solid var(--color-border, #d5dce3);
            border-radius: 3px;
            cursor: pointer;
            background-image:
                linear-gradient(45deg, #bbb 25%, transparent 25%, transparent 75%, #bbb 75%),
                linear-gradient(45deg, #bbb 25%, transparent 25%, transparent 75%, #bbb 75%);
            background-size: 6px 6px;
            background-position: 0 0, 3px 3px;
        }
        /* An outline is a line, so its swatch draws one rather than a filled
           block — with a fill and an outline row side by side, two identical
           blocks say nothing about which is which. */
        .color-swatch.line {
            background-image: none;
            border-color: transparent;
        }
    `;
	}
	connectedCallback() {
		super.connectedCallback(), this.legendResizeObserver = new ResizeObserver(() => this.queueLegendMeasure());
	}
	firstUpdated() {
		this.observeLegendContent(), this.queueLegendMeasure();
	}
	onStateChanged(e) {
		let t = (e.mapLayers ?? {})[this.layerId];
		this.meta = t ?? null, this.dropSupersededOverrides(), typeof e.zoomLevel == "number" && (this.zoom = e.zoomLevel), this.terrainEnabled = this.adapter?.isTerrainEnabled() === !0;
	}
	dropSupersededOverrides() {
		let e = Object.entries(this.editOverrides);
		if (e.length === 0) return;
		let t = !1, n = {};
		for (let [r, i] of e) {
			let e = this.paintOfSublayer(r), a = {};
			for (let [n, r] of Object.entries(i)) e && JSON.stringify(e[n]) === JSON.stringify(r) ? a[n] = r : t = !0;
			Object.keys(a).length > 0 && (n[r] = a);
		}
		t && (this.editOverrides = n);
	}
	paintOfSublayer(e) {
		let t = this.meta;
		if (!t) return null;
		let n = (e) => e && typeof e == "object" ? e : {};
		if (!e || e === this.layerId) {
			let e = {
				...n(t.paint),
				...n(t.layout)
			};
			if (Object.keys(e).length > 0 || !Array.isArray(t.sublayers)) return e;
		}
		let r = (t) => {
			if (!Array.isArray(t)) return null;
			for (let i of t) {
				let t = n(i);
				if (String(t.id ?? "") === e) return {
					...n(t.paint),
					...n(t.layout)
				};
				let a = r(t.sublayers);
				if (a) return a;
			}
			return null;
		};
		return r(t.sublayers);
	}
	observeLegendContent() {
		if (!this.legendResizeObserver) return;
		this.legendResizeObserver.disconnect();
		let e = this.renderRoot?.querySelector(".legend-collapse-content");
		e && this.legendResizeObserver.observe(e);
	}
	queueLegendMeasure() {
		this.measureLegendQueued || (this.measureLegendQueued = !0, requestAnimationFrame(() => {
			this.measureLegendQueued = !1, this.measureLegendOverflow();
		}));
	}
	measureLegendOverflow() {
		if (!this.collapsible) {
			this.legendOverflowing &&= !1;
			return;
		}
		let e = this.renderRoot?.querySelector(".legend-collapse-content"), t = !!(e && e.scrollHeight > R.collapsedLegendHeight + 1);
		this.legendOverflowing !== t && (this.legendOverflowing = t);
	}
	renderCollapsibleLegend(e) {
		let t = this.collapsible && this.legendOverflowing && this.legendCollapsed, n = this.collapsible && this.legendOverflowing;
		return l`
            <div class="legend-collapse ${t ? "collapsed" : ""}">
                <div class="legend-collapse-content">
                    ${e}
                </div>
                ${n ? l`
                    <button
                        type="button"
                        class="legend-toggle"
                        @click=${() => {
			this.legendCollapsed = !this.legendCollapsed;
		}}>
                        ${this.legendCollapsed ? "show more..." : "show less"}
                    </button>
                ` : ""}
            </div>
        `;
	}
	evalAtZoom(e, t) {
		if (!Array.isArray(e)) return e;
		let n = e[0];
		if (V(n) && e.length >= 4) {
			let n = [];
			for (let t = 3; t + 1 < e.length; t += 2) n.push([Number(e[t]), e[t + 1]]);
			if (n.length === 0) return null;
			if (t <= n[0][0]) return n[0][1];
			if (t >= n[n.length - 1][0]) return n[n.length - 1][1];
			for (let e = 0; e < n.length - 1; e++) {
				let [r, i] = n[e], [a, o] = n[e + 1];
				if (t >= r && t <= a) {
					if (typeof i == "number" && typeof o == "number") {
						let e = (t - r) / (a - r);
						return i + (o - i) * e;
					}
					return t - r < a - t ? i : o;
				}
			}
		}
		if (n === "step" && e.length >= 3) {
			let n = e[2];
			for (let r = 3; r + 1 < e.length; r += 2) t >= Number(e[r]) && (n = e[r + 1]);
			return n;
		}
		return n === "literal" ? e[1] : e;
	}
	evalFilter(e, t) {
		if (!Array.isArray(e) || e.length === 0) return !0;
		let n = e[0];
		if (n === "all") return e.slice(1).every((e) => this.evalFilter(e, t));
		if (n === "any") return e.slice(1).some((e) => this.evalFilter(e, t));
		if (n === "none") return !e.slice(1).some((e) => this.evalFilter(e, t));
		let r = e[1], i = e[2], a = Array.isArray(r) && r[0] === "zoom", o = Array.isArray(i) && i[0] === "zoom";
		if (a || o) {
			let e = t, o = Number(a ? i : r), s = a ? e : o, c = a ? o : e;
			if (n === "==" || n === "===") return s === c;
			if (n === "!=" || n === "!==") return s !== c;
			if (n === "<") return s < c;
			if (n === "<=") return s <= c;
			if (n === ">") return s > c;
			if (n === ">=") return s >= c;
		}
		return !0;
	}
	extractDataCases(e, t) {
		if (!Array.isArray(e)) return null;
		let n = e[0];
		if (n === "match" && e.length >= 5) {
			let n = this.getPropName(e[1]), r = n ? t?.get(n) : void 0, i = r?.unit ?? "", a = r?.valuemap, o = [];
			for (let t = 2; t + 1 < e.length - 1; t += 2) {
				let n = e[t], r = Array.isArray(n) ? n.join(", ") : String(n), s = a?.find((e) => String(e.value) === String(n)), c = s ? s.label : i ? `${r}${i}` : r;
				o.push({
					label: c,
					paint: e[t + 1],
					path: [t + 1]
				});
			}
			return o.push({
				label: "",
				paint: e[e.length - 1],
				path: [e.length - 1]
			}), o.length > 1 ? o : null;
		}
		if (n === "step" && e.length >= 5) {
			let n = e[1];
			if (!Array.isArray(n) || n[0] === "zoom") return null;
			let r = this.getPropName(n), i = (r ? t?.get(r) : void 0)?.unit ?? "", a = [];
			for (let t = 3; t + 1 < e.length; t += 2) typeof e[t] == "number" && a.push(e[t]);
			let o = P(a, i), s = (e) => o(e), c = [{
				label: a.length > 0 ? `< ${s(a[0])}` : "",
				paint: e[2],
				path: [2]
			}];
			for (let t = 3, n = 0; t + 1 < e.length; t += 2, n += 1) {
				let r = a[n], i = a[n + 1];
				c.push({
					label: i === void 0 ? `≥ ${s(r)}` : `${s(r)} – ${s(i)}`,
					paint: e[t + 1],
					path: [t + 1]
				});
			}
			return c;
		}
		if (V(n) && e.length >= 5) {
			let n = e[2];
			if (!Array.isArray(n) || n[0] === "zoom") return null;
			let r = this.getPropName(n), i = (r ? t?.get(r) : void 0)?.unit ?? "", a = [];
			for (let t = 3; t + 1 < e.length; t += 2) typeof e[t] == "number" && a.push(e[t]);
			let o = P(a, i), s = [];
			for (let t = 3; t + 1 < e.length; t += 2) {
				let n = e[t];
				s.push({
					label: typeof n == "number" ? o(n) : String(n),
					paint: e[t + 1],
					path: [t + 1]
				});
			}
			return s.length > 1 ? s : null;
		}
		if (n === "case" && e.length >= 3) {
			let n = [];
			for (let r = 1; r + 1 < e.length; r += 2) {
				let i = this.conditionLabel(e[r], t) ?? `class ${Math.floor(r / 2) + 1}`;
				n.push({
					label: i,
					paint: e[r + 1],
					path: [r + 1]
				});
			}
			return n.push({
				label: "",
				paint: e[e.length - 1],
				path: [e.length - 1]
			}), n.length <= 1 ? null : this.expandNestedCases(n, t);
		}
		return null;
	}
	expandNestedCases(e, t) {
		let n = [];
		for (let r of e) {
			let e = Array.isArray(r.paint) ? this.extractDataCases(r.paint, t) : null;
			e ? n.push(...e.map((e) => ({
				...e,
				path: [...r.path, ...e.path]
			}))) : n.push(r);
		}
		let r = [], i = [];
		for (let e of n) (e.label === "" && typeof e.paint == "string" && n.some((t) => t !== e && t.label === "" && t.paint === e.paint) ? r : i).push(e);
		return r.length > 0 ? [...i, r[0]] : i;
	}
	extractColorRamp(e, t) {
		if (!Array.isArray(e) || !V(e[0]) || e.length < 7) return null;
		let n = e[2];
		if (!Array.isArray(n) || n[0] === "zoom") return null;
		let r = [];
		for (let t = 3; t + 1 < e.length; t += 2) {
			if (typeof e[t] != "number" || typeof e[t + 1] != "string") return null;
			r.push({
				value: e[t],
				color: e[t + 1]
			});
		}
		let i = this.getPropName(n), a = i ? t?.get(i) : void 0;
		return {
			title: a?.label || i || "",
			unit: a?.unit ?? "",
			stops: r
		};
	}
	renderColorRamp(e) {
		let { stops: t } = e, n = t[0].value, r = t[t.length - 1].value - n || 1, i = t.map((e) => `${e.color} ${(e.value - n) / r * 100}%`).join(", "), a = P(t.map((e) => e.value), e.unit);
		return l`
            <div class="legend-row" style="flex-direction:column;align-items:flex-start;gap:2px">
                ${e.title ? l`<span class="legend-label" title=${e.title}>${z(e.title)}</span>` : ""}
                <div style="width:150px;height:15px;background:linear-gradient(to right, ${i})"></div>
                <div style="width:150px;display:flex;justify-content:space-between;font-size:0.85em">
                    <span>${a(t[0].value)}</span><span>${a(t[t.length - 1].value)}</span>
                </div>
            </div>`;
	}
	isDataDriven(e) {
		if (!Array.isArray(e)) return !1;
		let t = e[0];
		return t === "match" || t === "case" ? !0 : t === "step" ? !(Array.isArray(e[1]) && e[1][0] === "zoom") : V(t) ? Array.isArray(e[2]) && e[2][0] !== "zoom" : !1;
	}
	renderZoomHint(e, t, n) {
		let r = n > t;
		return l`<div class="legend-row"><span class="legend-label">${r ? "zoom out" : "zoom in"} to level ${r ? t : e} for display</span></div>`;
	}
	renderCompositeLegend(e, t) {
		let n = [], r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Map(), a = e.filter((e) => !!e && typeof e == "object"), o = Ze(a), s = new Set(o.values()), c = e.length - s.size === 1, u = this.getAttrTranslations(), d = Infinity, f = -Infinity;
		for (let t of e) {
			let e = t;
			if (!e || typeof e.type != "string" || e.hideFromLegend === !0 || e.layout?.visibility === "none") continue;
			let n = typeof e.minzoom == "number" ? e.minzoom : 0, r = (typeof e.maxzoom == "number" ? e.maxzoom : 24) + 1;
			d = Math.min(d, n), f = Math.max(f, r);
		}
		if (d !== Infinity && (t < d || t >= f)) return this.renderZoomHint(d, f - 1, t);
		for (let d of [...e].reverse()) {
			let e = d;
			if (!e || typeof e.type != "string" || e.hideFromLegend === !0 || s.has(String(e.id ?? ""))) continue;
			let f = typeof e.minzoom == "number" ? e.minzoom : 0, p = typeof e.maxzoom == "number" ? e.maxzoom : 24;
			if (t < f || t >= p + 1 || e.filter && !this.evalFilter(e.filter, t) || e.layout?.visibility === "none") continue;
			let m = e.type, h = e.paint && typeof e.paint == "object" ? e.paint : {}, g = e.layout && typeof e.layout == "object" ? e.layout : {}, v = String(e.id ?? ""), y = _(this.meta, e, v, c, this.layerId), b = {};
			for (let [e, n] of Object.entries(h)) b[e] = this.isDataDriven(n) ? n : this.evalAtZoom(n, t);
			let x = {};
			for (let [e, n] of Object.entries(g)) x[e] = this.evalAtZoom(n, t);
			let S = { ...b }, C = { ...x }, w = this.editOverrides[v];
			w && (Object.assign(b, w), "text-size" in w && (x["text-size"] = w["text-size"]));
			let T = o.has(v) ? a.find((e) => String(e.id ?? "") === o.get(v)) : void 0;
			if (m === "fill") {
				let t = $e(e, T ?? null);
				T && (b["fill-outline-color"] = t.color), b[ct] = t.width;
			}
			let E = m === "fill" ? "fill-color" : m === "fill-extrusion" ? "fill-extrusion-color" : m === "line" ? "line-color" : m === "circle" ? "circle-color" : m === "symbol" ? "text-color" : m === "background" ? "background-color" : null, D = E ? b[E] ?? h[E] : null, O = D ? this.extractDataCases(D, u) : null, k = this.extractColorRamp(D, u);
			if (k) {
				let e = `${m}|${v}`;
				if (r.has(e)) continue;
				r.add(e), i.has(e) || i.set(e, [v]), c || n.push(l`<div class="sub-group-title">${y}</div>`), n.push(this.renderColorRamp(k));
			} else if (O && O.length > 1) {
				let a = `${m}|${v}`;
				if (r.has(a)) continue;
				r.add(a), i.has(a) || i.set(a, [v]), c || n.push(l`<div class="sub-group-title">${y}</div>`);
				let o = Array.isArray(D) ? D : null, s = typeof e.metadata?.noDataLabel == "string" ? String(e.metadata.noDataLabel) : "";
				for (let e = 0; e < O.length; e++) {
					let { paint: i, path: a } = O[e], c = O[e].label === "" ? s : O[e].label;
					if (c === "") continue;
					let u = {
						...b,
						[E]: i
					}, d = this.renderSwatch(m, u, t, x);
					if (!d) continue;
					let f = `${m}|${String(i)}`;
					if (r.has(f)) continue;
					r.add(f);
					let p = o && typeof i == "string" && a.length > 0 ? l`<button type="button" style="background:none;border:none;padding:0;cursor:pointer;display:flex;align-items:center"
                            @click=${(e) => {
						e.stopPropagation(), this.openStopColorPicker(e.currentTarget, [v], E, o, a, i);
					}}>
                            ${d}</button>` : d;
					n.push(l`
                        <div class="legend-row sub-row">
                            ${p}
                            <span class="legend-label" title=${c}>${z(c)}</span>
                        </div>`);
				}
				m === "fill" && n.push(...this.renderClassedOutline(v, b));
			} else if (m === "circle") {
				let e = `${m}|${v}`;
				r.has(e) || (r.add(e), i.has(e) || i.set(e, [v]), c || n.push(l`<div class="sub-group-title">${y}</div>`), n.push(...this.renderLegendItems([v], m, b)));
			} else {
				let e = E ? String(S[E] ?? "#aaa") : "#aaa", a = `${m}|${e}`;
				if (m === "line") {
					let t = S["line-dasharray"];
					a = `line|${e}|${Array.isArray(t) ? t.join(",") : String(t ?? "")}`;
				} else if (m === "fill" && T) a = `fill|${v}`;
				else if (m === "symbol") {
					let t = C["text-size"] ?? S["text-size"], n = Math.round(Number(typeof t == "number" ? t : 12)), r = (Array.isArray(C["text-font"]) ? C["text-font"] : []).join(" ").toLowerCase(), i = r.includes("bold") || r.includes("black") ? "700" : r.includes("semibold") || r.includes("demibold") || r.includes("medium") ? "600" : "400", o = Math.round(Number(S["text-halo-width"] ?? 0) * 2) / 2;
					a = `symbol|${e}|${n}|${i}|${o}|${o > 0 ? String(S["text-halo-color"] ?? "") : ""}`;
				}
				if (i.has(a) || i.set(a, []), i.get(a).push(v), r.has(a)) continue;
				r.add(a);
				let o = this.renderSwatch(m, b, t, x);
				if (!o) continue;
				let s = this.isEditableType(m, b, !0), c = i.get(a), u = c.includes(this.editorOpenKey ?? "");
				if (n.push(l`
                    ${s ? l`<button type="button" class="legend-row editable" aria-expanded=${u}
                            @click=${() => {
					this.editorOpenKey = u ? null : c[0];
				}}>
                            ${o}
                            <span class="legend-label" title=${y}>${z(y)}</span>
                        </button>` : l`<div class="legend-row">
                            ${o}
                            <span class="legend-label" title=${y}>${z(y)}</span>
                        </div>`}`), s && u) {
					let e = m === "symbol" ? {
						...b,
						"text-size": x["text-size"] ?? b["text-size"]
					} : b;
					n.push(this.renderStyleEditor(c, m, e));
				}
			}
		}
		return l`<div class="legend-wrap">${n}</div>`;
	}
	resolveSwatchColor(e, t) {
		return typeof e == "string" ? e : t;
	}
	renderSwatch(e, t, n, r) {
		if (e === "fill") {
			let e = this.resolveSwatchColor(t["fill-color"], "#000000"), n = Number(t["fill-opacity"] ?? .7), r = String(t["fill-outline-color"] ?? e), a = Math.min(Number(t[ct] ?? 1) || 1, 3), o = Math.max(1, a / 2);
			return i`<svg width="20" height="12" style="flex-shrink:0">
                <rect x="${o}" y="${o}" width="${20 - 2 * o}" height="${12 - 2 * o}" fill="${e}" fill-opacity="${n}"
                    stroke="${r}" stroke-width="${a}" rx="1"/>
            </svg>`;
		}
		if (e === "fill-extrusion") return i`<svg width="20" height="12" style="flex-shrink:0">
                <rect x="1" y="1" width="18" height="10" fill="${String(t["fill-extrusion-color"] ?? "#aaa")}" fill-opacity="${Number(t["fill-extrusion-opacity"] ?? .8)}" stroke="none"/>
                <line x1="19" y1="1" x2="19" y2="11" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>
                <line x1="1" y1="11" x2="19" y2="11" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>
            </svg>`;
		if (e === "line") return i`<svg width="20" height="12" style="flex-shrink:0">
                <line x1="1" y1="6" x2="19" y2="6" stroke="${this.resolveSwatchColor(t["line-color"], "#616161")}" stroke-width="${Math.min(Number(t["line-width"] ?? 2), 4)}"
                    stroke-dasharray="${Array.isArray(t["line-dasharray"]) ? t["line-dasharray"].join(" ") : ""}" stroke-linecap="round"/>
            </svg>`;
		if (e === "circle") {
			let e = String(t["circle-color"] ?? "#aaa");
			return i`<svg width="20" height="12" style="flex-shrink:0">
                <circle cx="10" cy="6" r="${Math.min(Number(t["circle-radius"] ?? 4), 5)}" fill="${e}" stroke="${String(t["circle-stroke-color"] ?? e)}" stroke-width="${Number(t["circle-stroke-width"] ?? 0)}"/>
            </svg>`;
		}
		if (e === "symbol") {
			let e = String(t["text-color"] ?? "#555"), n = t["text-halo-width"] && Number(t["text-halo-width"]) > 0 ? String(t["text-halo-color"] ?? "rgba(255,255,255,0.8)") : null, a = r?.["text-size"] ?? t["text-size"], o = Math.min(Math.max(Math.round((typeof a == "number" ? a : 12) * .9), 7), 24), s = (Array.isArray(r?.["text-font"]) ? r["text-font"] : []).join(" ").toLowerCase(), c = s.includes("bold") || s.includes("black") ? "700" : s.includes("semibold") || s.includes("demibold") || s.includes("medium") ? "600" : "400", l = s.includes("italic") || s.includes("oblique") ? "italic" : "normal", u = Math.max(20, o + 4);
			return i`<svg width="${u}" height="${o + 4}" style="flex-shrink:0">
                ${n ? i`<text x="${u / 2}" y="${o}" text-anchor="middle"
                    font-size="${o}" font-weight="${c}" font-style="${l}"
                    stroke="${n}" stroke-width="3" stroke-linejoin="round"
                    fill="none" font-family="sans-serif">A</text>` : ""}
                <text x="${u / 2}" y="${o}" text-anchor="middle"
                    font-size="${o}" font-weight="${c}" font-style="${l}"
                    fill="${e}" font-family="sans-serif">A</text>
            </svg>`;
		}
		return e === "background" ? i`<svg width="20" height="12" style="flex-shrink:0">
                <rect x="1" y="1" width="18" height="10" fill="${String(t["background-color"] ?? "#eee")}" rx="1"/>
            </svg>` : e === "raster" || e === "hillshade" ? i`<svg width="20" height="12" style="flex-shrink:0">
                <defs><pattern id="rp" width="4" height="4" patternUnits="userSpaceOnUse">
                    <rect width="2" height="2" fill="#ccc"/>
                    <rect x="2" y="2" width="2" height="2" fill="#eee"/>
                </pattern></defs>
                <rect x="1" y="1" width="18" height="10" fill="url(#rp)" rx="1"/>
            </svg>` : null;
	}
	extractLegendStops(e) {
		if (typeof e == "string" || typeof e == "number") return [{
			value: null,
			paint: e
		}];
		if (!Array.isArray(e)) return [{
			value: null,
			paint: null
		}];
		let t = e[0];
		if (V(t)) {
			let t = [];
			for (let n = 3; n + 1 < e.length; n += 2) t.push({
				value: e[n],
				paint: e[n + 1]
			});
			return t.length ? t : [{
				value: null,
				paint: null
			}];
		}
		if (t === "step") {
			let t = [{
				value: null,
				paint: e[2]
			}];
			for (let n = 3; n + 1 < e.length; n += 2) t.push({
				value: e[n],
				paint: e[n + 1]
			});
			return t;
		}
		if (t === "match") {
			let t = [];
			for (let n = 2; n + 1 < e.length - 1; n += 2) t.push({
				value: e[n],
				paint: e[n + 1]
			});
			return t.length ? t : [{
				value: null,
				paint: null
			}];
		}
		return [{
			value: null,
			paint: null
		}];
	}
	renderBubbleLegend(e, t, n) {
		let r = Math.min(n, 1.5), a = Math.max(...e.map((e) => e.radius)), o = a + r + 2, s = o * 2, c = a * 2 + r * 2 + 4, u = c - 2, d = s + 8, f = s + 60, p = [...e].sort((e, t) => t.radius - e.radius).map((e) => {
			let n = Math.max(1, e.radius * 1), a = u - n - r, s = a - n;
			return i`
                <circle cx="${o}" cy="${a}" r="${n}"
                    fill="${e.color}" fill-opacity="0.75"
                    stroke="${t}" stroke-width="${r}"/>
                <line x1="${o + n + r}" y1="${s}" x2="${d - 2}" y2="${s}"
                    stroke="#999" stroke-width="0.5" stroke-dasharray="2 2"/>
                <text x="${d}" y="${s + 4}" font-size="9" fill="#555">${e.value}</text>
            `;
		}), m = Math.max(14, Math.floor((s + 60) / e.length)), h = e.length * m, g = e.map((e, t) => i`<rect x="${t * m}" y="0" width="${m}" height="${8}" fill="${e.color}"/>
                <text x="${t * m + m / 2}" y="${17}" font-size="8"
                    text-anchor="middle" fill="#555">${e.value}</text>`), _ = e.every((t) => t.color === e[0].color);
		return l`
            <div class="legend-row" style="flex-direction:column;align-items:flex-start;gap:6px">
                ${i`<svg width="${f}" height="${c}" style="overflow:visible">
                    <line x1="${o}" y1="${u}" x2="${o}" y2="2" stroke="#bbb" stroke-width="1"/>
                    ${p}
                </svg>`}
                ${_ ? "" : i`<svg width="${h}" height="${20}" style="overflow:visible">
                    ${g}
                </svg>`}
            </div>`;
	}
	renderCircleRow(e, t, n, r, a) {
		let o = Math.min(Math.max(r, 2), 12), s = Math.min(n, 2), c = (o + s) * 2 + 2;
		return l`
            <div class="legend-row">
                ${i`<svg width="${c}" height="${c}" style="flex-shrink:0">
                    <circle cx="${c / 2}" cy="${c / 2}" r="${o}"
                        fill="${e}" stroke="${t}" stroke-width="${s}"/>
                </svg>`}
                ${a === null ? "" : l`<span class="legend-label" title=${a}>${z(a)}</span>`}
            </div>`;
	}
	renderFillRow(e, t, n, r, a) {
		let o = i`<svg width="24" height="14" style="flex-shrink:0">
            <rect x="1" y="1" width="22" height="12"
                fill="${e}" fill-opacity="${n}"
                stroke="${t}" stroke-width="1.5" rx="2"/>
        </svg>`;
		return l`
            <div class="legend-row">
                ${a ? l`<button type="button" aria-label=${r ? `Change colour for ${r}` : "Change colour"} style="background:none;border:none;padding:0;cursor:pointer;display:flex;align-items:center" @click=${a}>${o}</button>` : o}
                ${r === null ? "" : l`<span class="legend-label" title=${r}>${z(r)}</span>`}
            </div>`;
	}
	colorExprStopIndices(e) {
		let t = e[0];
		if (t === "match") {
			let t = [];
			for (let n = 3; n < e.length - 1; n += 2) t.push(n);
			return t;
		}
		if (t === "case") {
			if (e.slice(1).some((e, t) => t % 2 == 1 && typeof e != "string") || typeof e[e.length - 1] != "string") return null;
			let t = [];
			for (let n = 1; n + 1 < e.length; n += 2) t.push(n + 1);
			return t;
		}
		if (t === "step") {
			let t = [2];
			for (let n = 3; n + 1 < e.length; n += 2) t.push(n + 1);
			return t;
		}
		return null;
	}
	openStopColorPicker(e, t, n, r, i, a) {
		let o = `${t.join(",")}::${n}::${i.join(".")}`;
		this.openColorPicker(e, t, o, a, (e) => {
			let a = (t, n) => {
				let r = [...t], o = i[n];
				return r[o] = n === i.length - 1 ? e : a(t[o], n + 1), r;
			};
			this.setPaintOverride(t, n, a(r, 0));
		}, !1);
	}
	renderLineRow(e, t, n, r) {
		return l`
            <div class="legend-row">
                ${i`<svg width="24" height="14" style="flex-shrink:0">
                    <line x1="2" y1="7" x2="22" y2="7"
                        stroke="${e}" stroke-width="${Math.min(t, 4)}"
                        stroke-dasharray="${n}" stroke-linecap="round"/>
                </svg>`}
                ${r === null ? "" : l`<span class="legend-label" title=${r}>${z(r)}</span>`}
            </div>`;
	}
	renderEditableLineRow(e, t, n, r, a, o, s) {
		return l`
            <div class="legend-row">
                <button type="button" class="color-swatch" style="background:transparent; border:none; padding:0; width:24px; height:14px; flex-shrink:0; cursor:pointer;"
                    @click=${(n) => {
			n.stopPropagation(), this.openStopColorPicker(n.currentTarget, e, "line-color", o, s, t);
		}}>
                    ${i`<svg width="24" height="14">
                        <line x1="2" y1="7" x2="22" y2="7"
                            stroke="${t}" stroke-width="${Math.min(n, 4)}"
                            stroke-dasharray="${r}" stroke-linecap="round"/>
                    </svg>`}
                </button>
                ${a === null ? "" : l`<span class="legend-label" title=${a}>${z(a)}</span>`}
            </div>`;
	}
	getAttrTranslations() {
		return g(this.meta?.attributes, this.adapter?.store.getState().attributeMetadata);
	}
	getPropName(e) {
		return Array.isArray(e) && e[0] === "get" && typeof e[1] == "string" ? e[1] : null;
	}
	conditionLabel(e, t) {
		if (!Array.isArray(e) || e.length < 3) return "";
		let n = e[0], r = this.getPropName(e[1]), i = e[2], a = r ? t?.get(r) : void 0, o = a?.unit ?? "";
		if (a?.valuemap) {
			let e = a.valuemap.find((e) => String(e.value) === String(i) && (e.operator === void 0 || e.operator === n));
			if (e) return e.label;
		}
		return n === "==" ? typeof i == "number" || typeof i == "string" ? `${i}${o}` : "" : [
			"<",
			"<=",
			">",
			">="
		].includes(n) && (typeof i == "number" || typeof i == "string") ? `${n} ${i}${o}` : "";
	}
	formatNumber(e, t, n) {
		return We(e, {
			unit: t,
			decimals: n
		});
	}
	mergeNoDataRows(e) {
		let t = /* @__PURE__ */ new Set();
		return e.filter((e) => e.label === "" ? t.has(e.color) ? !1 : (t.add(e.color), !0) : !0);
	}
	extractColorClasses(e, t) {
		if (!Array.isArray(e)) return null;
		let n = e[0];
		if (n === "step" && e.length >= 5) {
			let n = e[1];
			if (!Array.isArray(n) || n[0] === "zoom") return null;
			let r = this.getPropName(n), i = (r ? t?.get(r) : void 0)?.unit ?? "", a = [];
			for (let t = 3; t + 1 < e.length; t += 2) typeof e[t] == "number" && a.push(e[t]);
			let o = [], s = P(a, i);
			typeof e[2] == "string" && a.length > 0 && o.push({
				label: `< ${s(a[0])}`,
				color: e[2]
			});
			for (let t = 3, n = 0; t + 1 < e.length; t += 2, n += 1) {
				let r = e[t + 1];
				if (typeof r != "string") continue;
				let i = a[n + 1];
				o.push({
					label: i === void 0 ? `≥ ${s(a[n])}` : `${s(a[n])} – ${s(i)}`,
					color: r
				});
			}
			return o.length > 1 ? o : null;
		}
		if (n === "case") {
			let n = [];
			for (let r = 1; r + 1 < e.length; r += 2) {
				let i = this.conditionLabel(e[r], t);
				if (i === null) continue;
				let a = e[r + 1];
				typeof a == "string" ? n.push({
					label: i || "",
					color: a
				}) : n.push(...this.extractColorClasses(a, t) ?? []);
			}
			let r = e[e.length - 1];
			return typeof r == "string" ? n.push({
				label: "",
				color: r
			}) : n.push(...this.extractColorClasses(r, t) ?? []), n.length > 1 ? this.mergeNoDataRows(n) : null;
		}
		if (n === "match") {
			let n = this.getPropName(e[1]), r = n ? t?.get(n) : void 0, i = r?.unit ?? "", a = r?.valuemap, o = [];
			for (let t = 2; t + 1 < e.length - 1; t += 2) {
				let n = (Array.isArray(e[t]), e[t]), r = Array.isArray(n) ? n.join(", ") : String(n), s = a?.find((e) => String(e.value) === String(n)), c = s ? s.label : i ? `${r}${i}` : r, l = typeof e[t + 1] == "string" ? e[t + 1] : "";
				l && o.push({
					label: c,
					color: l
				});
			}
			let s = e[e.length - 1];
			return typeof s == "string" && o.push({
				label: "",
				color: s
			}), o.length > 1 ? o : null;
		}
		return null;
	}
	textFieldName(e) {
		if (typeof e == "string") {
			let t = e.match(/^\{([^}]+)\}$/);
			return t ? t[1] : null;
		}
		if (!Array.isArray(e)) return null;
		if (e[0] === "get" && typeof e[1] == "string") return e[1];
		for (let t of e.slice(1)) {
			let e = this.textFieldName(t);
			if (e) return e;
		}
		return null;
	}
	isZoomExpression(e) {
		if (!Array.isArray(e)) return !1;
		let t = e[0];
		return (V(t) || t === "step") && Array.isArray(e[1]) ? e[1][0] === "zoom" || e[2]?.[0] === "zoom" : V(t) && e.length >= 3 ? Array.isArray(e[2]) && e[2][0] === "zoom" : !1;
	}
	parseRadiusFormula(e) {
		if (!Array.isArray(e)) return null;
		if (e[0] === "*" && typeof e[1] == "number") {
			let t = e[2];
			if (Array.isArray(t) && t[0] === "sqrt" && Array.isArray(t[1]) && t[1][0] === "get") return {
				coeff: e[1],
				base: 0,
				prop: t[1][1],
				isSqrt: !0
			};
			if (Array.isArray(t) && t[0] === "get") return {
				coeff: e[1],
				base: 0,
				prop: t[1],
				isSqrt: !1
			};
		}
		if (e[0] === "+") {
			let t = typeof e[1] == "number" ? e[1] : typeof e[2] == "number" ? e[2] : 0, n = [e[1], e[2]].find((e) => Array.isArray(e) && e[0] === "*");
			if (n && Array.isArray(n)) {
				let e = n[2];
				if (Array.isArray(e) && e[0] === "sqrt" && Array.isArray(e[1]) && e[1][0] === "get") return {
					coeff: n[1],
					base: t,
					prop: e[1][1],
					isSqrt: !0
				};
			}
		}
		return null;
	}
	extractProportionalRadius(e, t) {
		let n = this.parseRadiusFormula(e);
		if (n) return n;
		if (!Array.isArray(e) || e[0] !== "interpolate") return null;
		let r = e[1], i = Array.isArray(r) && r[0] === "exponential" && typeof r[1] == "number" ? r[1] : 1, a = [];
		for (let t = 3; t + 1 < e.length; t += 2) a.push({
			z: Number(e[t]),
			expr: e[t + 1]
		});
		if (a.length === 0) return null;
		let o = a[0], s = a[a.length - 1];
		for (let e = 0; e < a.length - 1; e++) if (t >= a[e].z && t <= a[e + 1].z) {
			o = a[e], s = a[e + 1];
			break;
		}
		let c = this.parseRadiusFormula(o.expr), l = this.parseRadiusFormula(s.expr);
		if (!c && !l) return null;
		if (o.z === s.z || t <= o.z) return c ?? l;
		if (t >= s.z) return l ?? c;
		let u;
		u = i !== 1 && i > 0 ? (i ** +(t - o.z) - 1) / (i ** +(s.z - o.z) - 1) : (t - o.z) / (s.z - o.z), u = Math.max(0, Math.min(1, u));
		let d = c ?? {
			coeff: 0,
			base: 0,
			prop: l.prop,
			isSqrt: l.isSqrt
		}, f = l ?? {
			coeff: 0,
			base: 0,
			prop: c.prop,
			isSqrt: c.isSqrt
		};
		return {
			coeff: d.coeff + u * (f.coeff - d.coeff),
			base: d.base + u * (f.base - d.base),
			prop: f.prop || d.prop,
			isSqrt: f.isSqrt || d.isSqrt
		};
	}
	toCssColor(e, t) {
		if (typeof e == "string") return e;
		if (Array.isArray(e) && (e[0] === "match" || e[0] === "case") && e.length >= 2) {
			let t = e[e.length - 1];
			if (typeof t == "string") return t;
		}
		return t;
	}
	destroyPickrs() {
		for (let e of this.pickrInstances.values()) e.destroyAndRemove();
		this.pickrInstances.clear(), this.pickrOriginal.clear();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.legendResizeObserver?.disconnect(), this.legendResizeObserver = null, this.destroyPickrs();
	}
	updated(e) {
		if (e.has("layerId")) {
			this.legendCollapsed = !0;
			let e = R.carriedOver.get(this.layerId);
			e && (R.carriedOver.delete(this.layerId), this.editorOpenKey = e.editorOpenKey, this.legendCollapsed = e.legendCollapsed), this.store && this.onStateChanged(this.store.getState());
		}
		e.has("editorOpenKey") && this.destroyPickrs(), this.observeLegendContent(), this.queueLegendMeasure();
	}
	openColorPicker(e, t, n, r, i, a = !0) {
		let o = `${t.join(",")}::${n}`, s = i ?? ((e) => this.setPaintOverride(t, n, e)), c = this.pickrInstances.get(o);
		c ? (c.setColor(r), this.pickrOriginal.set(o, r)) : (c = Fe.default.create({
			el: e,
			theme: "nano",
			default: r,
			useAsButton: !0,
			comparison: !1,
			appClass: "webmapx-pickr",
			autoReposition: !1,
			swatches: Ie,
			components: {
				preview: !0,
				opacity: !0,
				hue: !0,
				interaction: {
					input: !0,
					cancel: !0,
					save: !0,
					rgba: !1,
					hsla: !1,
					hsva: !1,
					cmyk: !1,
					hex: !1
				}
			}
		}), c.on("change", (t) => {
			let n = t.toRGBA().toString(0);
			a && (e.style.background = n), s(n);
		}), c.on("save", () => {
			c.hide();
		}), c.on("cancel", () => {
			let t = this.pickrOriginal.get(o);
			a && (e.style.background = t), s(t), c.hide();
		}), !a && e.style.backgroundColor === "transparent" && c.on("hide", () => {
			e.style.background = "transparent";
		}), Re(c, e), this.pickrInstances.set(o, c), this.pickrOriginal.set(o, r), c.show());
	}
	setPaintOverride(e, t, n) {
		let r = { ...this.editOverrides };
		for (let i of e) r[i] = {
			...r[i] ?? {},
			[t]: n
		}, this.adapter?.updateLayerStyle(this.layerId, i || this.layerId, { [t]: n });
		this.isConnected && (this.editOverrides = r);
	}
	renderRangeRow(e, t, n, r, i, a, o, s = "") {
		let c = !Number.isFinite(r), u = c ? (i + a) / 2 : r;
		return l`
            <div class="style-editor-row">
                <label>${t}
                    <input type="range" min=${i} max=${a} step=${o} .value=${String(u)}
                        title=${c ? "Data-driven value — moving this slider replaces the expression with a fixed number" : ""}
                        @input=${(t) => {
			let r = Number(t.target.value);
			for (let t of e) this.adapter?.updateLayerStyle(this.layerId, t || this.layerId, { [n]: r });
			let i = t.target.closest(".style-editor-row")?.querySelector("output");
			i && (i.textContent = `${r}${s}`, i.classList.remove("expression"));
		}}
                        @change=${(t) => this.setPaintOverride(e, n, Number(t.target.value))}>
                </label>
                <output class=${c ? "expression" : ""}>${c ? "expression" : l`${r}${s}`}</output>
            </div>`;
	}
	renderClassedOutline(e, t) {
		let n = this.toCssColor(t["fill-outline-color"], "#000000"), r = Math.min(Number(t[ct] ?? 1) || 1, 4), a = `${e}::outline`, o = this.editorOpenKey === a;
		return [l`
            <button type="button" class="legend-row sub-row editable" aria-expanded=${o} aria-label="Edit outline"
                @click=${(e) => {
			e.stopPropagation(), this.editorOpenKey = o ? null : a;
		}}>
                ${i`<svg width="24" height="14" style="flex-shrink:0">
                    <line x1="2" y1="7" x2="22" y2="7" stroke="${n}" stroke-width="${r}" stroke-linecap="round"/>
                </svg>`}
                <span class="legend-label">outline</span>
            </button>`, ...o ? [l`<div class="style-editor">${this.renderOutlineRows(e, t)}</div>`] : []];
	}
	fillOutlineOf(e) {
		let t = this.adapter?.getSubLayers(this.layerId);
		if (!t) return null;
		let n = t.findIndex((t) => String(t.id ?? "") === e && t.type === "fill");
		if (n < 0) return null;
		let r = Xe(t, n), i = r >= 0 ? t[r] : null;
		return {
			subs: t,
			outline: $e(t[n], i),
			companionId: i ? String(i.id ?? "") : null
		};
	}
	applyFillOutline(e, t) {
		return this.outlineWork = this.outlineWork.then(async () => {
			let n = this.adapter, r = this.fillOutlineOf(e);
			if (!n || !r) return;
			let i = nt(r.subs, e, {
				...r.outline,
				...t
			}), a = i.length === r.subs.length && i.every((e, t) => e.id === r.subs[t].id && JSON.stringify(e.layout ?? null) === JSON.stringify(r.subs[t].layout ?? null)), o = [], s = !1;
			if (a && i.forEach((e, t) => {
				let n = r.subs[t].paint ?? {}, i = e.paint ?? {};
				Object.keys(n).some((e) => !(e in i)) && (s = !0);
				let a = Object.fromEntries(Object.entries(i).filter(([e, t]) => JSON.stringify(n[e]) !== JSON.stringify(t)));
				Object.keys(a).length > 0 && o.push([String(e.id ?? ""), a]);
			}), a && !s) {
				for (let [e, t] of o) n.updateLayerStyle(this.layerId, e, t);
				return;
			}
			n.canRebuildLayer(this.layerId) && (R.carriedOver.set(this.layerId, {
				editorOpenKey: this.editorOpenKey,
				legendCollapsed: this.legendCollapsed
			}), await n.setSubLayers(this.layerId, i), R.carriedOver.delete(this.layerId));
		}).catch((e) => {
			console.warn("[webmapx-layer-legend] outline change failed", e);
		}), this.outlineWork;
	}
	renderOutlineRows(e, t) {
		let n = this.fillOutlineOf(e), r = !!n && (n.companionId !== null || this.adapter?.canRebuildLayer(this.layerId) === !0);
		if (!n || !r) {
			let n = this.toCssColor(t["fill-outline-color"], this.toCssColor(t["fill-color"], "#000000"));
			return [this.renderColorRow([e], "outline color", "fill-outline-color", n, "line")];
		}
		let { outline: i, companionId: a } = n, o = this.toCssColor(i.color, "#000000");
		return [l`
            <div class="style-editor-row">
                <label>outline color</label>
                <button type="button" class="color-swatch line" aria-label="Outline colour"
                    style="background:${B(o, "line")}"
                    @click=${(t) => {
			let n = t.currentTarget;
			this.openColorPicker(n, [e], "outline", o, (t) => {
				n.style.background = B(t, "line");
				let r = this.fillOutlineOf(e)?.outline.width ?? 0;
				this.applyFillOutline(e, r > 0 ? { color: t } : {
					color: t,
					width: 1
				});
			}, !1);
		}}></button>
            </div>`, l`
            <div class="style-editor-row">
                <label>outline width
                    <input type="range" min="0" max="10" step="0.5" .value=${String(i.width)}
                        @input=${(e) => {
			let t = Number(e.target.value);
			a && t > 0 && this.adapter?.updateLayerStyle(this.layerId, a, { "line-width": t });
			let n = e.target.closest(".style-editor-row")?.querySelector("output");
			n && (n.textContent = t === 0 ? "none" : `${t}px`);
		}}
                        @change=${(t) => {
			this.applyFillOutline(e, { width: Number(t.target.value) });
		}}>
                </label>
                <output>${i.width === 0 ? "none" : `${i.width}px`}</output>
            </div>`];
	}
	renderColorRow(e, t, n, r, i = "area") {
		return l`
            <div class="style-editor-row">
                <label>${t}</label>
                <button type="button" class="color-swatch ${i === "line" ? "line" : ""}"
                    style="background:${B(r, i)}"
                    @click=${(t) => {
			let a = t.currentTarget;
			this.openColorPicker(a, e, n, r, (t) => {
				a.style.background = B(t, i), this.setPaintOverride(e, n, t);
			}, !1);
		}}></button>
            </div>`;
	}
	renderStyleEditor(e, t, n) {
		if (t === "fill" || t === "fill-extrusion") {
			let r = t === "fill" ? "fill-color" : "fill-extrusion-color", i = this.toCssColor(n[r], "#000000"), a = t === "fill" ? "fill-opacity" : "fill-extrusion-opacity", o = Number(n[a] ?? 1), s = [this.renderColorRow(e, "fill color", r, i), this.renderRangeRow(e, "opacity", a, o, 0, 1, .05)];
			if (t === "fill" && e.length === 1) s.push(...this.renderOutlineRows(e[0] || this.layerId, n));
			else if (t === "fill") {
				let t = this.toCssColor(n["fill-outline-color"], i);
				s.push(this.renderColorRow(e, "outline color", "fill-outline-color", t, "line"));
			}
			return l`<div class="style-editor">${s}</div>`;
		}
		if (t === "line") {
			let t = this.toCssColor(n["line-color"], "#000000"), r = Number(n["line-width"] ?? 2), i = Number(n["line-opacity"] ?? 1);
			return l`<div class="style-editor">
                ${this.renderColorRow(e, "line color", "line-color", t)}
                ${this.renderRangeRow(e, "width", "line-width", r, .5, 10, .5, "px")}
                ${this.renderRangeRow(e, "opacity", "line-opacity", i, 0, 1, .05)}
            </div>`;
		}
		if (t === "circle") {
			let t = this.toCssColor(n["circle-color"], "#000000"), r = Number(n["circle-radius"] ?? 5), i = this.toCssColor(n["circle-stroke-color"], t), a = Number(n["circle-stroke-width"] ?? 0), o = Number(n["circle-opacity"] ?? 1);
			return l`<div class="style-editor">
                ${this.renderRangeRow(e, "radius", "circle-radius", r, 1, 30, 1, "px")}
                ${this.renderColorRow(e, "fill color", "circle-color", t)}
                ${this.renderRangeRow(e, "opacity", "circle-opacity", o, 0, 1, .05)}
                ${this.renderRangeRow(e, "outline width", "circle-stroke-width", a, 0, 10, .5, "px")}
                ${this.renderColorRow(e, "outline color", "circle-stroke-color", i, "line")}
            </div>`;
		}
		if (t === "symbol") {
			let t = this.toCssColor(n["text-color"], "#1f2937"), r = Number(n["text-opacity"] ?? 1), i = Number(n["text-size"] ?? 12), a = n["text-halo-color"] !== void 0 || Number(n["text-halo-width"] ?? 0) > 0, o = this.toCssColor(n["text-halo-color"], "#ffffff");
			return l`<div class="style-editor">
                ${this.renderRangeRow(e, "size", "text-size", i, 8, 32, 1, "px")}
                ${this.renderColorRow(e, "text color", "text-color", t)}
                ${this.renderRangeRow(e, "opacity", "text-opacity", r, 0, 1, .05)}
                ${a ? this.renderColorRow(e, "halo color", "text-halo-color", o) : ""}
            </div>`;
		}
		if (t === "background") {
			let t = this.toCssColor(n["background-color"], "#ffffff"), r = Number(n["background-opacity"] ?? 1);
			return l`<div class="style-editor">
                ${this.renderColorRow(e, "color", "background-color", t)}
                ${this.renderRangeRow(e, "opacity", "background-opacity", r, 0, 1, .05)}
            </div>`;
		}
		if (t === "raster") {
			let t = n["raster-opacity"], r = Array.isArray(t) ? this.evalAtZoom(t, this.zoom) : t, i = Number(isFinite(Number(r)) ? r : 1);
			return l`<div class="style-editor">
                ${this.renderRangeRow(e, "opacity", "raster-opacity", i, 0, 1, .05)}
            </div>`;
		}
		return l``;
	}
	renderHillshadeTerrainCheckbox() {
		return l`
            <div class="style-editor-row" style="padding:2px 0">
                <input type="checkbox" id="hillshade-terrain-${this.layerId}" .checked=${this.terrainEnabled}
                    @change=${(e) => this.toggleTerrainFromHillshade(e.target.checked)}>
                <label for="hillshade-terrain-${this.layerId}" style="flex:1">Show terrain in 3D</label>
            </div>`;
	}
	toggleTerrainFromHillshade(e) {
		let t, n = typeof this.meta?.sourceId == "string" ? this.meta.sourceId : void 0;
		if (n && (t = this.layerDataConfig?.sources?.find((e) => e?.id === n) ?? (this.adapter?.getSource(n) ? {
			id: n,
			type: "raster-dem"
		} : void 0)), !t) {
			let e = Array.isArray(this.meta?.sublayers) ? this.meta.sublayers : [];
			for (let n of e) {
				if (n?.type !== "hillshade") continue;
				let e = typeof n.source == "string" ? n.source : "source", r = `${this.layerId}:${e}`;
				if (this.adapter?.getSource(r)) {
					t = {
						id: r,
						type: "raster-dem"
					};
					break;
				}
			}
		}
		this.adapter?.setTerrainEnabled(e, t), this.terrainEnabled = this.adapter?.isTerrainEnabled() === !0;
	}
	isEditableType(e, t, n = !1) {
		if (!e) return !1;
		if (e === "hillshade") return !0;
		if (e === "raster") return n;
		let r = e === "fill" ? "fill-color" : e === "fill-extrusion" ? "fill-extrusion-color" : e === "line" ? "line-color" : e === "circle" ? "circle-color" : e === "symbol" ? "text-color" : e === "background" ? "background-color" : null;
		return r ? !Array.isArray(t[r]) : !1;
	}
	renderLegendItems(e, t, n, r) {
		let a = this.getAttrTranslations();
		if (t === "circle") {
			let e = String(n["circle-stroke-color"] ?? "#aaa"), t = Number(n["circle-stroke-width"] ?? 1), r = n["circle-color"], i = n["circle-radius"], o = String(Array.isArray(r) ? this.evalAtZoom(r, this.zoom) ?? r[r.length - 1] ?? "#000000" : r ?? "#000000"), s = this.extractColorClasses(r, a), c = this.extractProportionalRadius(i, this.zoom);
			if (c) {
				let { coeff: n, base: r, isSqrt: i } = c, l = (e) => r + n * (i ? Math.sqrt(e) : e), u = (e) => {
					let t = Math.max(0, e - r);
					return i ? (t / n) ** 2 : t / n;
				}, d = c.prop ? a.get(c.prop) : void 0, f = typeof d?.maxvalue == "number" ? d.maxvalue : null, p = Math.max(r + 1, 3), m = f === null ? r + 38 : l(f), h = [
					0,
					1 / 3,
					2 / 3,
					1
				].map((e) => p * (m / p) ** +e), g = h.map((e) => u(e)), _ = c.prop ? a.get(c.prop)?.unit : void 0, v = h.map((e) => Math.max(1, e)), y = v[v.length - 1], b = y < 4 ? 4 / y : 1, x = g.map((e, t) => ({
					value: this.formatNumber(e, _),
					color: o,
					radius: Math.max(1, Math.round(v[t] * b))
				})), S = /* @__PURE__ */ new Set(), C = x.filter((e) => !S.has(e.radius) && S.add(e.radius));
				if (s) {
					let n = C.map((e) => ({
						...e,
						color: st
					}));
					return [this.renderBubbleLegend(n, e, t), ...s.filter((e) => e.label !== "").map((n) => this.renderCircleRow(n.color, e, t, 6, n.label))];
				}
				return [this.renderBubbleLegend(C, e, t)];
			}
			if (s) {
				let n = this.evalAtZoom(i, this.zoom), r = Math.min(Number(isFinite(Number(n)) ? n : 6), 20);
				return s.filter((e) => e.label !== "").map((n) => this.renderCircleRow(n.color, e, t, r, n.label));
			}
			let l = this.extractLegendStops(r), u = this.isZoomExpression(i), d = u ? [] : this.extractLegendStops(i), f = [], p = Math.max(l.length, d.length || 1), m = "";
			for (let e = 0; e < p; e++) {
				let t = String(l[e]?.paint ?? l[0]?.paint ?? "#444444"), n = d.length > 0 ? d[e]?.paint ?? d[0]?.paint ?? 6 : this.evalAtZoom(i, this.zoom) ?? 6, r = Array.isArray(n) ? this.evalAtZoom(n, this.zoom) : n, a = Math.min(Number(isFinite(Number(r)) ? r : 6), 50), o = `${t}|${a}`;
				if (o === m) continue;
				m = o;
				let s = (!u && (l[e]?.value ?? d[e]?.value)) ?? null;
				f.push({
					value: s === null ? "" : String(s),
					color: t,
					radius: a
				});
			}
			return f.length > 1 && d.length > 1 ? [this.renderBubbleLegend(f, e, t)] : f.map((n) => this.renderCircleRow(n.color, e, t, n.radius, n.value));
		}
		if (t === "fill" || t === "fill-extrusion") {
			let r = t === "fill" ? "fill-color" : "fill-extrusion-color", i = Number(n[t === "fill" ? "fill-opacity" : "fill-extrusion-opacity"] ?? (t === "fill" ? .7 : .8)), o = String(t === "fill" ? n["fill-outline-color"] ?? n["fill-color"] ?? "#aaa" : n["fill-extrusion-color"] ?? "#aaa"), s = n[r], c = this.extractColorClasses(s, a);
			if (c) {
				let t = Array.isArray(s) ? this.colorExprStopIndices(s) : null;
				return c.filter((e) => e.label !== "").map((n, a) => {
					let c = t?.[a] ?? null, l = c !== null && Array.isArray(s) ? (t) => {
						t.stopPropagation(), this.openStopColorPicker(t.currentTarget, e, r, s, [c], n.color);
					} : void 0;
					return this.renderFillRow(n.color, o, i, n.label, l);
				});
			}
			return this.extractLegendStops(s).filter((e, t, n) => n.length === 1 || e.value !== null).map((e) => this.renderFillRow(String(e.paint ?? "#444444"), o, i, e.value === null ? "" : String(e.value)));
		}
		if (t === "line") {
			let t = n["line-color"], r = this.extractLegendStops(t), i = this.extractLegendStops(n["line-width"]), a = Array.isArray(n["line-dasharray"]) ? n["line-dasharray"].join(" ") : "", o = Array.isArray(t) ? this.colorExprStopIndices(t) : null;
			return r.map((n, s) => {
				let c = Number(i[s]?.paint ?? i[0]?.paint ?? 2), l = n.value === null ? "" : String(n.value), u = String(n.paint ?? "#444444");
				return o && o.length === r.length ? this.renderEditableLineRow(e, u, c, a, l, t, [o[s]]) : this.renderLineRow(u, c, a, l);
			});
		}
		if (t === "symbol") {
			let e = String(n["text-color"] ?? "#1f2937"), t = this.textFieldName(r?.["text-field"]);
			return [l`
                <div class="legend-row">
                    ${i`<svg width="24" height="14" style="flex-shrink:0">
                        <text x="12" y="11" text-anchor="middle" font-size="11"
                            fill="${e}" font-family="sans-serif">A</text>
                    </svg>`}
                    ${t ? l`<span class="legend-label" title=${t}>${z(t)}</span>` : ""}
                </div>`];
		}
		if (t === "background") {
			let e = this.resolveSwatchColor(n["background-color"], "#ffffff"), t = Number(n["background-opacity"] ?? 1);
			return [this.renderFillRow(e, e, t, "")];
		}
		return t === "raster" || t === "hillshade" ? [l`
                <div class="legend-row">
                    ${i`<svg width="24" height="14" style="flex-shrink:0">
                        <defs>
                            <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
                                <rect width="2" height="2" fill="#ccc"/>
                                <rect x="2" y="2" width="2" height="2" fill="#eee"/>
                            </pattern>
                        </defs>
                        <rect x="1" y="1" width="22" height="12" fill="url(#grid)" rx="2"/>
                    </svg>`}
                </div>`] : [];
	}
	wmsLegendUrl(e) {
		if (e?.layerType !== "raster") return null;
		let t = typeof e?.sourceId == "string" ? e.sourceId : null;
		if (!t || !this.adapter) return null;
		let n = L(this.adapter.getSourceConfig?.(t) ?? null);
		if (!n) return null;
		let r = e?.sourceParams && typeof e.sourceParams == "object" ? e.sourceParams : {};
		return _e(n.endpoint, n.layers.split(",")[0].trim(), {
			sld: r.SLD_BODY ?? null,
			style: r.STYLES ?? n.style,
			version: n.version
		});
	}
	render() {
		if (!this.layerId) return l``;
		let e = this.meta, t = typeof e?.layerType == "string" ? e.layerType : null, n = e?.paint && typeof e.paint == "object" ? e.paint : {}, r = e?.layout && typeof e.layout == "object" ? e.layout : void 0, i = (typeof e?.legendurl == "string" && e.legendurl.length > 0 ? e.legendurl : null) ?? this.wmsLegendUrl(e), a = typeof e?.label == "string" ? e.label : this.layerId, o = Array.isArray(e?.sublayers) ? e.sublayers : null, s = typeof e?.minzoom == "number" ? e.minzoom : 0, c = typeof e?.maxzoom == "number" ? e.maxzoom : 24;
		if (this.zoom < s || this.zoom > c) return this.renderZoomHint(s, c, this.zoom);
		if (o && o.length > 0) {
			let e = this.renderCompositeLegend(o, this.zoom);
			return o.length === 1 && typeof o[0]?.type == "string" && o[0].type === "hillshade" ? this.renderCollapsibleLegend(l`
                <div class="legend-wrap">
                    ${e}
                    ${this.renderHillshadeTerrainCheckbox()}
                </div>`) : this.renderCollapsibleLegend(e);
		}
		let u = s, d = c;
		if (this.zoom < u || this.zoom > d) return this.renderZoomHint(u, d, this.zoom);
		let f = t && [
			"fill",
			"fill-extrusion",
			"line",
			"circle",
			"symbol",
			"raster",
			"background",
			"hillshade"
		].includes(t) && !i, p = [this.layerId], m = this.editOverrides[this.layerId], h = m ? {
			...n,
			...m
		} : n, g = !o && f && this.isEditableType(t, h), _ = this.editorOpenKey === this.layerId;
		return this.renderCollapsibleLegend(l`
            <div class="legend-wrap">
                ${f ? l`
                    ${g ? l`<button type="button" class="editable legend-row" aria-expanded=${_} aria-label=${`Edit style of ${a}`}
                            @click=${() => {
			this.editorOpenKey = _ ? null : this.layerId;
		}}>
                            ${this.renderLegendItems(p, t, h, r)}
                        </button>` : l`<div>${this.renderLegendItems(p, t, h, r)}</div>`}
                    ${t === "hillshade" ? this.renderHillshadeTerrainCheckbox() : ""}
                    ${g && _ ? this.renderStyleEditor(p, t, h) : ""}
                ` : ""}
                ${i ? this.failedLegendUrl === i ? l`<span class="img-error">⚠ invalid legend image</span>` : l`
                    <img class="legend-img" src=${i} alt=${a}
                        @error=${() => {
			this.failedLegendUrl = i;
		}}>
                ` : ""}
            </div>
        `);
	}
};
d([n({
	type: String,
	attribute: "layer-id"
})], H.prototype, "layerId", void 0), d([n({
	type: Boolean,
	reflect: !0
})], H.prototype, "collapsible", void 0), d([o()], H.prototype, "meta", void 0), d([o()], H.prototype, "failedLegendUrl", void 0), d([o()], H.prototype, "zoom", void 0), d([o()], H.prototype, "legendCollapsed", void 0), d([o()], H.prototype, "legendOverflowing", void 0), d([o()], H.prototype, "editOverrides", void 0), d([o()], H.prototype, "editorOpenKey", void 0), d([o()], H.prototype, "terrainEnabled", void 0), H = R = d([c("webmapx-layer-legend")], H);
//#endregion
//#region src/components/webmapx-layer-info-dialog.ts
var lt = /^https:\/\/\S+$/i, U = class extends u {
	constructor(...e) {
		super(...e), this.dialogTitle = "", this.attribution = "", this.featureSummary = "", this.content = { kind: "none" }, this.fetchToken = 0;
	}
	static {
		this.styles = [
			h,
			j,
			a`
        :host { display: block; }

        sl-dialog::part(panel) {
            min-width: min(420px, 90vw);
            max-width: min(640px, 90vw);
        }

        .abstract {
            font-size: var(--webmapx-font-size-md, 0.9rem);
            line-height: 1.4;
            max-height: 60vh;
            overflow-y: auto;
        }

        .abstract img { max-width: 100%; }

        .placeholder {
            color: var(--color-text-muted, #6b7681);
            font-style: italic;
        }

        .layer-meta {
            margin-top: 0.75rem;
            padding-top: 0.5rem;
            border-top: 1px solid var(--color-border-light, #e2e7ec);
        }

        .feature-summary {
            font-size: var(--webmapx-font-size-md, 0.85rem);
            color: var(--color-text-secondary, #5a6773);
        }

        .feature-summary + .attribution {
            margin-top: 0.5rem;
        }

        .attribution {
            font-size: var(--webmapx-font-size-sm, 0.8rem);
            color: var(--color-text-muted, #6b7681);
        }

        .loading {
            display: flex;
            align-items: center;
            gap: var(--webmapx-space-sm, 0.5rem);
            color: var(--color-text-muted, #6b7681);
        }

        .footer {
            display: flex;
            justify-content: flex-end;
            margin-top: 1rem;
        }
    `
		];
	}
	open(e, t, n, r) {
		Te(this), this.fetchToken += 1, this.dialogTitle = e, this.attribution = n?.trim() ?? "", this.featureSummary = r?.trim() ?? "", this.dialog?.show();
		let i = t?.trim();
		if (!i) {
			this.content = { kind: "none" };
			return;
		}
		if (lt.test(i)) {
			this.loadFromUrl(i);
			return;
		}
		this.content = {
			kind: "html",
			html: Se(i)
		};
	}
	close() {
		this.dialog?.hide();
	}
	async loadFromUrl(e) {
		this.content = { kind: "loading" };
		let t = ++this.fetchToken;
		try {
			let n = await fetch(e);
			if (!n.ok) throw Error(`HTTP ${n.status}`);
			let r = await n.text();
			if (t !== this.fetchToken) return;
			this.content = {
				kind: "html",
				html: Se(r)
			};
		} catch {
			if (t !== this.fetchToken) return;
			this.content = {
				kind: "error",
				message: "Could not load layer information."
			};
		}
	}
	renderContent() {
		switch (this.content.kind) {
			case "none": return this.featureSummary ? null : l`<p class="placeholder">No detailed layer information available.</p>`;
			case "loading": return l`<div class="loading"><sl-spinner></sl-spinner> Loading layer information…</div>`;
			case "error": return l`<p class="placeholder">${this.content.message}</p>`;
			case "html": return l`<div class="abstract">${xe(this.content.html)}</div>`;
		}
	}
	render() {
		return M(l`
                <sl-dialog label=${this.dialogTitle}
                           @sl-request-close=${(e) => {
			e.detail?.source === "overlay" && this.close();
		}}>
                    ${this.renderContent()}
                    ${this.featureSummary || this.attribution ? l`<div class="layer-meta">
                            ${this.featureSummary ? l`<div class="feature-summary">${this.featureSummary}</div>` : null}
                            ${this.attribution ? l`<div class="attribution"><strong>Attribution:</strong> ${Ce(this.attribution)}</div>` : null}
                        </div>` : null}
                    <div class="footer">
                        <sl-button autofocus @click=${this.close}>Close</sl-button>
                    </div>
                </sl-dialog>
        `);
	}
};
d([o()], U.prototype, "dialogTitle", void 0), d([o()], U.prototype, "attribution", void 0), d([o()], U.prototype, "featureSummary", void 0), d([o()], U.prototype, "content", void 0), d([s("sl-dialog")], U.prototype, "dialog", void 0), U = d([c("webmapx-layer-info-dialog")], U);
//#endregion
//#region src/components/styler/panel-chrome.ts
var ut = a`
    :host { display: none; }
    :host([visible]) { display: block; }

    /* The host is a bare frame around .panel, so the box the UA gives a popover
       — centred, bordered, padded, scrollable — has to come off, or it draws a
       small white square over the map for as long as the panel is open. */
    :host([popover]) {
        position: static;
        inset: auto;
        width: auto;
        height: auto;
        margin: 0;
        border: none;
        padding: 0;
        background: transparent;
        overflow: visible;
    }

    .panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        width: min(26rem, 96vw);
        max-height: min(80vh, 44rem);
        background: var(--color-surface, #fff);
        color: var(--color-text-primary, #16202a);
        border: 1px solid var(--color-border, #cbd5df);
        border-radius: var(--webmapx-radius-md, 0.5rem);
        box-shadow: var(--webmapx-shadow-lg, 0 10px 30px rgba(0, 0, 0, 0.25));
    }

    .panel-head {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.5rem 0.6rem;
        border-bottom: 1px solid var(--color-border-light, #e2e7ec);
        background: var(--color-surface-raised, #f4f6f8);
        border-radius: var(--webmapx-radius-md, 0.5rem) var(--webmapx-radius-md, 0.5rem) 0 0;
        /* The whole header is the handle, so there is no small target to hit. */
        cursor: move;
        touch-action: none;
        user-select: none;
    }
    /* Decorative, and hidden from assistive technology: dragging is not
       something this icon makes available to a keyboard. */
    .drag-grip {
        flex: 0 0 auto;
        font-size: 1rem;
        color: var(--color-text-secondary, #5a6773);
        opacity: 0.55;
    }
    .panel-title { flex: 1 1 auto; font-weight: 600; }
    .panel-close {
        background: none;
        border: none;
        padding: 0.15rem 0.35rem;
        font: inherit;
        color: var(--color-text-secondary, #5a6773);
        cursor: pointer;
    }
    .panel-close:hover { color: var(--color-text-primary, #16202a); }

    .panel-body { overflow: auto; padding: 0.75rem; }

    .footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        padding: 0.5rem 0.6rem;
        border-top: 1px solid var(--color-border-light, #e2e7ec);
    }
`, dt = class extends u {
	constructor(...e) {
		super(...e), this.position = null, this.drag = null, this.onPanelKeydown = (e) => {
			e.key === "Escape" && this.isVisible && this.closePanel();
		}, this.onDrag = (e) => {
			!this.drag || e.pointerId !== this.drag.pointerId || (this.position = {
				x: e.clientX - this.drag.dx,
				y: e.clientY - this.drag.dy
			});
		}, this.endDrag = (e) => {
			if (!this.drag || e.pointerId !== this.drag.pointerId) return;
			let t = e.currentTarget;
			t.releasePointerCapture?.(e.pointerId), t.removeEventListener("pointermove", this.onDrag), t.removeEventListener("pointerup", this.endDrag), t.removeEventListener("pointercancel", this.endDrag), this.drag = null, this.clampPosition();
		};
	}
	panelPosition() {
		return this.position ? `left:${this.position.x}px; top:${this.position.y}px; transform:none` : "";
	}
	showPanel() {
		we(this), document.addEventListener("keydown", this.onPanelKeydown), this.updateComplete.then(() => this.ensureOnScreen());
	}
	hidePanel() {
		Ee(this), document.removeEventListener("keydown", this.onPanelKeydown);
	}
	startDrag(e) {
		let t = e.currentTarget, n = t.parentElement;
		if (!n || e.button !== 0 || e.target.closest(".panel-close")) return;
		let r = n.getBoundingClientRect();
		this.drag = {
			pointerId: e.pointerId,
			dx: e.clientX - r.left,
			dy: e.clientY - r.top
		}, t.setPointerCapture(e.pointerId), t.addEventListener("pointermove", this.onDrag), t.addEventListener("pointerup", this.endDrag), t.addEventListener("pointercancel", this.endDrag), e.preventDefault();
	}
	ensureOnScreen() {
		if (!this.position) return;
		let e = this.panelBox();
		if (!e) return;
		let t = Math.min(Math.max(this.position.x, 0), Math.max(window.innerWidth - e.width, 0)), n = Math.min(Math.max(this.position.y, 0), Math.max(window.innerHeight - e.height, 0));
		(t !== this.position.x || n !== this.position.y) && (this.position = {
			x: t,
			y: n
		});
	}
	clampPosition() {
		let e = this.panelBox();
		!e || !this.position || (this.position = {
			x: Math.min(Math.max(this.position.x, 160 - e.width), window.innerWidth - 160),
			y: Math.min(Math.max(this.position.y, 0), window.innerHeight - 48)
		});
	}
	panelBox() {
		let e = this.renderRoot?.querySelector(".panel");
		return e ? e.getBoundingClientRect() : null;
	}
};
d([o()], dt.prototype, "position", void 0);
//#endregion
//#region src/components/styler/channel-controls.ts
var ft = {
	opacity: {
		min: 0,
		max: 1,
		step: .05,
		unit: ""
	},
	width: {
		min: .5,
		max: 12,
		step: .5,
		unit: " px"
	},
	radius: {
		min: 1,
		max: 30,
		step: 1,
		unit: " px"
	},
	strokeWidth: {
		min: 0,
		max: 6,
		step: .5,
		unit: " px"
	},
	textSize: {
		min: 8,
		max: 40,
		step: 1,
		unit: " px"
	},
	haloWidth: {
		min: 0,
		max: 4,
		step: .2,
		unit: " px"
	}
}, pt = {
	opacity: 1,
	width: 1,
	radius: 5,
	strokeWidth: 0,
	textSize: 16,
	haloWidth: 0
}, W = [
	"color",
	"strokeColor",
	"haloColor",
	"fillOutline"
], G = {
	color: "Colour",
	opacity: "Opacity",
	width: "Width",
	radius: "Size",
	dash: "Pattern",
	fillOutline: "Edge",
	lineJoin: "Corners",
	lineCap: "Ends",
	strokeColor: "Outline colour",
	strokeWidth: "Outline width",
	text: "Text",
	textSize: "Text size",
	haloColor: "Halo colour",
	haloWidth: "Halo width",
	font: "Font",
	placement: "Placement",
	anchor: "Position",
	offset: "Distance",
	allowOverlap: "Overlap"
}, mt = [
	{
		label: "Solid",
		value: null
	},
	{
		label: "Dashed",
		value: [2, 2]
	},
	{
		label: "Dotted",
		value: [.5, 2]
	},
	{
		label: "Dash-dot",
		value: [
			4,
			2,
			.5,
			2
		]
	}
];
function ht(e) {
	if (!e || e.driver !== "single") return e ? "Custom" : "Solid";
	let t = Array.isArray(e.value) ? [...e.value] : null;
	if (!t) return "Solid";
	let n = mt.find((e) => e.value && e.value.join() === t.join());
	return n ? n.label : "Custom";
}
function gt(e) {
	if (!e) return null;
	if (e.driver === "single" && typeof e.value == "string") {
		let t = /^\{([^{}]+)\}$/.exec(e.value);
		return t ? t[1] : null;
	}
	if (e.driver !== "custom") return null;
	let t = e.expression;
	return Array.isArray(t) && t[0] === "get" && typeof t[1] == "string" ? t[1] : null;
}
function _t(e) {
	return {
		driver: "custom",
		expression: ["get", e]
	};
}
//#endregion
//#region src/components/styler/style-entry.ts
var vt = {
	fill: "Fill",
	outline: "Outline",
	line: "Line",
	circle: "Points",
	label: "Labels",
	background: "Background"
};
function yt(e) {
	let t = (t) => e.some((e) => t.test(e)), n = [];
	return t(/polygon/i) && n.push("outline", "fill", "label"), t(/linestring/i) && n.push("line", "label"), t(/point/i) && n.push("circle", "label"), n.length === 0 ? [
		"fill",
		"outline",
		"line",
		"circle",
		"label"
	] : n.filter((e, t) => n.indexOf(e) === t);
}
function bt(e) {
	return e?.driver === "single" && typeof e.value == "string" ? e.value : null;
}
function xt(e) {
	let t = bt(e);
	if (t) return [t];
	if (e?.driver === "neighbours") return [...e.colors].slice(0, 6);
	if (e?.driver === "attribute" && e.classification.kind !== "proportional") {
		let t = e.classification.colors;
		if (t.length <= 6) return [...t];
		let n = (t.length - 1) / 5;
		return Array.from({ length: 6 }, (e, r) => t[Math.round(r * n)]);
	}
	return [];
}
function St(e, t) {
	let n = [];
	for (let r of de(e.role)) {
		let i = wt(e.role, r, e.channels[r], t);
		i && n.push(i);
	}
	let r = [];
	e.filter !== void 0 && r.push("filtered"), (e.minzoom !== void 0 || e.maxzoom !== void 0) && r.push(Ct(e.minzoom, e.maxzoom));
	let i = [...n.slice(0, 2), ...r].join(", ");
	return i ? `${vt[e.role]} — ${i}` : vt[e.role];
}
function Ct(e, t) {
	return e !== void 0 && t !== void 0 ? `z${e}–${t}` : e === void 0 ? `to z${t}` : `z${e}+`;
}
function wt(e, t, n, r) {
	if (!n) return null;
	if (n.driver === "custom") return t === "color" ? "a custom expression" : null;
	if (n.driver === "neighbours") return "no two neighbours alike";
	if (n.driver === "attribute") {
		let e = n.classification, t = r?.get(n.attribute)?.label ?? n.attribute;
		return e.kind === "proportional" ? `sized by ${t}${e.zoomFactor ? ", grows with zoom" : ""}` : `by ${t}, ${e.kind === "ranges" ? e.colors.length : e.values.length} ${e.kind === "ranges" ? "classes" : "categories"}${n.schemeName ? `, ${n.schemeName}` : ""}`;
	}
	if (n.driver === "zoom") {
		let e = n.stops.map(([, e]) => e * (n.scale ?? 1)), t = Math.min(...e), r = Math.max(...e);
		return t === r ? `${t}px` : `${t}–${r}px by zoom`;
	}
	return t === "color" ? typeof n.value == "string" ? n.value : null : t === "width" || t === "radius" || t === "textSize" ? typeof n.value == "number" ? `${n.value}px` : null : t === "text" && typeof n.value == "string" ? n.value : null;
}
function Tt(e, t) {
	let n = {};
	switch (e) {
		case "fill":
			n.color = {
				driver: "single",
				value: N
			};
			break;
		case "outline":
			n.color = {
				driver: "single",
				value: De
			}, n.width = {
				driver: "single",
				value: 1
			}, n.lineJoin = {
				driver: "single",
				value: "round"
			}, n.lineCap = {
				driver: "single",
				value: "round"
			};
			break;
		case "line":
			n.color = {
				driver: "single",
				value: N
			}, n.width = {
				driver: "single",
				value: 2
			}, n.lineJoin = {
				driver: "single",
				value: "round"
			}, n.lineCap = {
				driver: "single",
				value: "round"
			};
			break;
		case "circle":
			n.color = {
				driver: "single",
				value: N
			}, n.radius = {
				driver: "single",
				value: 5
			}, n.strokeColor = {
				driver: "single",
				value: De
			}, n.strokeWidth = {
				driver: "single",
				value: 1
			};
			break;
		case "label":
			n.textSize = {
				driver: "single",
				value: 12
			}, n.color = {
				driver: "single",
				value: De
			}, n.haloColor = {
				driver: "single",
				value: "#ffffff"
			}, n.haloWidth = {
				driver: "single",
				value: 1.4
			};
			break;
		case "background":
			n.color = {
				driver: "single",
				value: N
			};
			break;
	}
	return {
		id: t,
		role: e,
		channels: n
	};
}
function Et(e, t) {
	for (let n = t.length + 1;; n++) {
		let r = `${e}--style-${n}`;
		if (!t.includes(r)) return r;
	}
}
function Dt(e, t) {
	return {
		id: t,
		role: e.role,
		channels: JSON.parse(JSON.stringify(e.channels)),
		...e.filter === void 0 ? {} : { filter: JSON.parse(JSON.stringify(e.filter)) },
		...e.minzoom === void 0 ? {} : { minzoom: e.minzoom },
		...e.maxzoom === void 0 ? {} : { maxzoom: e.maxzoom }
	};
}
//#endregion
//#region src/utils/style-decoder.ts
var Ot = {
	fill: "fill",
	line: "line",
	circle: "circle",
	symbol: "label",
	background: "background"
};
function kt(e, t) {
	let n = Ot[e ?? ""] ?? "fill";
	return n === "line" && t && /polygon/i.test(t) ? "outline" : n;
}
function At(e) {
	if (e !== void 0) return typeof e == "string" || typeof e == "number" || typeof e == "boolean" || Array.isArray(e) && e.length > 0 && e.every((e) => typeof e == "number") || Array.isArray(e) && jt(e) ? {
		driver: "single",
		value: e
	} : Array.isArray(e) ? Mt(e) ?? {
		driver: "custom",
		expression: e
	} : {
		driver: "custom",
		expression: e
	};
}
function jt(e) {
	return e.every((e) => typeof e == "string") && e.some((e) => e.includes(" "));
}
function Mt(e) {
	let [t] = e;
	if (t === "case") return Pt(e);
	if (t === "step") return zt(e, void 0);
	if (t === "match") return Ht(e);
	if (t === "*") return Ut(e);
	if (t === "interpolate") return Wt(e) ?? Nt(e);
}
function Nt(e) {
	let [, t, n] = e;
	if (!Array.isArray(t) || t[0] !== "linear" || !Array.isArray(n) || n[0] !== "zoom") return;
	let r = e.slice(3);
	if (r.length < 4 || r.length % 2 != 0) return;
	let i = [];
	for (let e = 0; e < r.length; e += 2) {
		let t = r[e], n = r[e + 1];
		if (typeof t != "number" || typeof n != "number" || i.length > 0 && t <= i[i.length - 1][0]) return;
		i.push([t, n]);
	}
	return {
		driver: "zoom",
		stops: i
	};
}
function Pt(e) {
	if (e.length === 6) {
		let [, t, n, r, i, a] = e, o = Lt(t);
		if (o && n === i && typeof n == "string" && Rt(r, o) && Array.isArray(a) && a[0] === "step") return zt(a, n);
	}
	return Ft(e);
}
function Ft(e) {
	if (e.length < 4 || e.length % 2 != 0) return;
	let t = 1, n = null, r;
	for (;;) {
		let i = e[t], a = e[t + 1];
		if (typeof a != "string") return;
		let o = Lt(i) ?? It(i);
		if (!o) break;
		if (n && o !== n || r !== void 0 && r !== a) return;
		n = o, r = a, t += 2;
	}
	let i = [], a = [];
	for (; t < e.length - 1; t += 2) {
		let r = e[t], o = e[t + 1];
		if (typeof o != "string" || !Array.isArray(r) || r[0] !== "<" && r[0] !== "<=") return;
		let s = r[1], c = r[2], l = K(s);
		if (!l || typeof c != "number" || n && l !== n || i.length > 0 && c <= i[i.length - 1]) return;
		n = l, i.push(c), a.push(o);
	}
	let o = e[e.length - 1];
	if (!(!n || a.length === 0 || typeof o != "string")) return a.push(o), q(n, {
		kind: "ranges",
		breaks: i,
		colors: a,
		...r === void 0 ? {} : { noDataColor: r }
	});
}
function It(e) {
	if (!Array.isArray(e) || e[0] !== "==" || e[2] !== null) return null;
	let t = e[1];
	return Array.isArray(t) && t[0] === "get" && typeof t[1] == "string" ? t[1] : null;
}
function Lt(e) {
	if (!Array.isArray(e) || e[0] !== "!") return null;
	let t = e[1];
	return !Array.isArray(t) || t[0] !== "has" || typeof t[1] != "string" ? null : t[1];
}
function Rt(e, t) {
	return Array.isArray(e) && e[0] === "==" && e[2] === null && Array.isArray(e[1]) && e[1][0] === "get" && e[1][1] === t;
}
function zt(e, t) {
	let n = K(e[1]);
	if (!n || e.length < 3 || (e.length - 3) % 2 != 0) return;
	let r = [], i = [];
	if (typeof e[2] == "string") {
		r.push(e[2]);
		for (let t = 3; t < e.length; t += 2) {
			let n = e[t], a = e[t + 1];
			if (typeof n != "number" || typeof a != "string") return;
			i.push(n), r.push(a);
		}
		return q(n, {
			kind: "ranges",
			breaks: i,
			colors: r,
			...t === void 0 ? {} : { noDataColor: t }
		});
	}
}
function Bt(e) {
	if (!Array.isArray(e)) return null;
	if (e[0] === "to-string" && Array.isArray(e[1]) && e[1][0] === "id" && e[1].length === 1) return { kind: "id" };
	if (e[0] !== "concat" || e.length < 2 || e.length % 2 != 0) return null;
	let t = [];
	for (let n = 1; n < e.length; n++) {
		let r = e[n];
		if (n % 2 == 0) {
			if (r !== "") return null;
			continue;
		}
		if (!Array.isArray(r) || r[0] !== "to-string") return null;
		let i = r[1];
		if (!Array.isArray(i) || i[0] !== "get" || typeof i[1] != "string" || i.length !== 2) return null;
		t.push(i[1]);
	}
	return t.length === 0 ? null : t.length === 1 ? {
		kind: "property",
		name: t[0]
	} : {
		kind: "properties",
		names: t
	};
}
function Vt(e, t) {
	if (e.length < 5 || e.length % 2 != 1) return;
	let n = [], r = [];
	for (let t = 2; t < e.length - 1; t += 2) {
		let i = e[t], a = e[t + 1];
		if (typeof i != "string" || typeof a != "string") return;
		let o = n.indexOf(a);
		o < 0 && (o = n.push(a) - 1), r.push([i, o]);
	}
	let i = e[e.length - 1];
	return {
		driver: "neighbours",
		key: t,
		assignments: r,
		colors: n,
		...typeof i == "string" ? { fallbackColor: i } : {}
	};
}
function Ht(e) {
	let t = e[1], n = Bt(t);
	if (n) return Vt(e, n);
	let r = Array.isArray(t) && t[0] === "get" && typeof t[1] == "string", i = r ? t[1] : K(t);
	if (!i || e.length < 5 || e.length % 2 != 1) return;
	let a = [], o = [];
	for (let t = 2; t < e.length - 1; t += 2) {
		let n = e[t], r = e[t + 1];
		if (typeof r != "string" || typeof n != "string" && typeof n != "number") return;
		a.push(String(n)), o.push(r);
	}
	let s = e[e.length - 1], c = typeof s == "string" ? s : void 0;
	return r && i === "__webmapx_neighbour_class" ? {
		driver: "neighbours",
		attribute: i,
		colors: o,
		...c === void 0 ? {} : { fallbackColor: c }
	} : q(i, {
		kind: "categories",
		values: a,
		colors: o,
		...c === void 0 ? {} : { fallbackColor: c },
		...r ? { rawKeys: !0 } : {}
	});
}
function Ut(e) {
	if (e.length !== 3 || typeof e[1] != "number") return;
	let t = e[2];
	if (!Array.isArray(t) || t[0] !== "sqrt") return;
	let n = t[1];
	if (!(!Array.isArray(n) || n[0] !== "get" || typeof n[1] != "string")) return q(n[1], {
		kind: "proportional",
		coefficient: e[1]
	});
}
function Wt(e) {
	if (e.length !== 7) return;
	let [, t, n, r, i, a, o] = e;
	if (!Array.isArray(t) || t[0] !== "exponential" || typeof t[1] != "number" || !Array.isArray(n) || n[0] !== "zoom" || typeof r != "number" || typeof a != "number" || a <= r) return;
	let s = Array.isArray(i) ? Ut(i) : void 0, c = Array.isArray(o) ? Ut(o) : void 0;
	if (s?.driver !== "attribute" || c?.driver !== "attribute" || s.attribute !== c.attribute || s.classification.kind !== "proportional" || c.classification.kind !== "proportional") return;
	let l = t[1], u = s.classification.coefficient, d = u * l ** (a - r);
	if (!(Math.abs(c.classification.coefficient - d) > 1e-9 * Math.abs(d))) return q(s.attribute, {
		kind: "proportional",
		coefficient: u / l ** r,
		zoomFactor: l
	});
}
function K(e) {
	return Array.isArray(e) ? e[0] === "get" ? typeof e[1] == "string" ? e[1] : null : e[0] === "to-number" || e[0] === "to-string" ? K(e[1]) : null : null;
}
function q(e, t) {
	let n = Kt(t.kind === "proportional" ? [] : t.colors);
	return {
		driver: "attribute",
		attribute: e,
		classification: t,
		...n ? { schemeName: n } : {}
	};
}
var Gt = [
	"seq",
	"div",
	"qual"
];
function Kt(e) {
	if (e.length < 3) return null;
	for (let t of Gt) for (let n of re(t)) {
		let t = oe(n, e.length);
		if (t && t.colors.length === e.length && t.colors.every((t, n) => qt(t, e[n]))) return n;
	}
	return null;
}
function qt(e, t) {
	return e.trim().toLowerCase() === t.trim().toLowerCase();
}
function Jt(e, t) {
	let n = kt(e.type, t), r = k[n] ?? {}, i = {};
	for (let t of S(n)) {
		let n = r[t];
		if (!n) continue;
		let a = At((n.slot === "layout" ? e.layout : e.paint)?.[n.key]);
		a && (i[t] = a);
	}
	let a = {
		id: e.id ?? "",
		role: n,
		channels: i,
		origin: e,
		originChannels: JSON.parse(JSON.stringify(i))
	}, o = e.metadata && typeof e.metadata == "object" ? e.metadata : null, s = y(o);
	return s && (a.title = s), typeof o?.noDataLabel == "string" && o.noDataLabel.length > 0 && (a.noDataLabel = o.noDataLabel), e.filter !== void 0 && (a.filter = e.filter), typeof e.minzoom == "number" && (a.minzoom = e.minzoom), typeof e.maxzoom == "number" && (a.maxzoom = e.maxzoom), a;
}
//#endregion
//#region src/components/styler/style-list.ts
function Yt(e, t, n = []) {
	let r = typeof t.source == "string" ? t.source : "";
	if (!r) return "";
	let i = `${e}:${r}`;
	return n.includes(i) ? i : n.includes(r) ? r : i;
}
var Xt = new Set([
	"fill",
	"line",
	"circle",
	"symbol",
	"background"
]);
function Zt(e, t, n) {
	return t.map((t, r) => {
		let i = Yt(e, t, n.map((e) => e.sourceId)) || n[0]?.sourceId || "", a = n.find((e) => e.sourceId === i)?.geometryTypes?.join(" "), o = Xt.has(String(t.type ?? "")), s = Jt(t, a);
		return s.id ||= `${e}--${r}`, {
			entry: s,
			sourceId: i,
			styleable: o
		};
	});
}
function Qt(e) {
	let t = [];
	for (let n of e) {
		let e = n.geometryTypes?.join(" ");
		for (let r of n.layers) {
			let i = {
				id: r.id,
				type: r.type,
				...r.paint ? { paint: r.paint } : {},
				...r.layout ? { layout: r.layout } : {}
			};
			t.push({
				entry: Jt(i, e),
				sourceId: n.sourceId,
				styleable: !0
			});
		}
	}
	return t;
}
function $t(e) {
	return e.map((e) => w(e.entry));
}
function en(e, t, n) {
	let r = e.findIndex((e) => e.entry.id === t), i = e.findIndex((e) => e.entry.id === n);
	if (r < 0 || i < 0 || r === i) return [...e];
	let a = [...e], [o] = a.splice(r, 1);
	return a.splice(i, 0, o), a;
}
//#endregion
//#region src/components/styler/style-context.ts
function tn(e, t, n = 1.1) {
	return nn(e) > nn(t) * n;
}
function nn(e) {
	let t = e.east >= e.west ? e.east - e.west : e.east + 360 - e.west;
	return Math.abs(t) * Math.abs(e.north - e.south);
}
function rn(e) {
	return e.some((e) => (e.features?.length ?? 0) > 0);
}
//#endregion
//#region src/components/styler/raster-branch.ts
function an(e, t, n) {
	if (!e || !L(e.sourceConfig)) return { kind: "tiles" };
	if (!(t && (t.getTiles?.(e.sourceId) ?? null) !== null)) return { kind: "fixed" };
	let r = n ?? [];
	return r.length < 2 ? r.length === 1 ? {
		kind: "single",
		only: r[0]
	} : { kind: "single" } : { kind: "choice" };
}
function on(e, t, n) {
	let r = t?.getTiles?.(e.sourceId) ?? null, i = e.sourceConfig?.tiles ?? e.sourceConfig?.url;
	return (r ?? (Array.isArray(i) ? i : typeof i == "string" ? [i] : [])).map((e) => at(A(e, null), n));
}
//#endregion
//#region src/components/styler/wms-sld-branch.ts
var sn = 2e3, cn = 156543.03392804097, ln = 256, un = 2048, J = 20037508.342789244;
function dn(e, t) {
	let n = Math.max(-85.05112878, Math.min(85.05112878, t));
	return [e * J / 180, Math.log(Math.tan((90 + n) * Math.PI / 360)) * J / Math.PI];
}
function fn(e, t) {
	let n = [];
	if (e) {
		let [t, r] = dn(e.center[0], e.center[1]), i = cn / 2 ** e.zoom;
		if (e.size) {
			let [a, o] = e.size, s = i * a / 2, c = i * o / 2;
			n.push({
				bbox: [
					t - s,
					r - c,
					t + s,
					r + c
				],
				size: pn(a, o)
			});
		}
		let a = ln / 2 * i;
		n.push({
			bbox: [
				t - a,
				r - a,
				t + a,
				r + a
			],
			size: [ln * 2, ln * 2]
		});
	}
	if (Array.isArray(t) && t.length === 4) {
		let [e, r] = dn(t[0], t[1]), [i, a] = dn(t[2], t[3]);
		n.push({ bbox: [
			e,
			r,
			i,
			a
		] });
	}
	return n.length === 0 && n.push({ bbox: [
		-20037508.342789244,
		-20037508.342789244,
		J,
		J
	] }), n;
}
function pn(e, t) {
	let n = Math.max(e, t);
	if (n <= un) return [Math.round(e), Math.round(t)];
	let r = un / n;
	return [Math.max(1, Math.round(e * r)), Math.max(1, Math.round(t * r))];
}
function mn() {
	return {
		driver: "single",
		color: "#3182bd",
		strokeColor: "",
		attribute: null,
		method: "quantile",
		classCount: 5,
		scheme: "",
		values: null
	};
}
function hn(e) {
	let t = { ...e.strokeColor ? { strokeColor: e.strokeColor } : {} };
	if (e.driver === "single" || !e.attribute) return {
		style: {
			kind: "single",
			color: e.color,
			...t
		},
		classes: [{
			label: "all features",
			color: e.color
		}]
	};
	let n = e.values ?? [];
	if (n.length === 0) return {
		style: null,
		classes: [],
		problem: "No values came back for that column, so there is nothing to classify."
	};
	let r = n.filter((e) => typeof e == "number" && Number.isFinite(e));
	if (r.length >= n.length * .8 && r.length > 1) {
		let n = E(r, {
			method: e.method,
			classCount: e.classCount
		});
		if (n.classes.length === 0) return {
			style: null,
			classes: [],
			problem: "Those values are all the same, so there is nothing to classify."
		};
		let i = gn(e.scheme, n.classes.length, "seq"), a = he(e.attribute, n.classes, i, t);
		return {
			style: a,
			classes: a.breaks.map((e, t) => ({
				label: e.label ?? String(t),
				color: e.color
			}))
		};
	}
	let i = ue(n.filter((e) => e != null && e !== "").map((e) => ({
		type: "Feature",
		properties: { value: e },
		geometry: null
	})), "value", { maxCategories: e.classCount });
	if (i.categories.length === 0) return {
		style: null,
		classes: [],
		problem: "That column is empty in every feature we sampled."
	};
	let a = gn(e.scheme, i.categories.length, "qual"), o = be(e.attribute, i.categories.map((e) => e.value), a, {
		...t,
		otherColor: "#cccccc"
	});
	return {
		style: o,
		classes: [...o.categories.map((e) => ({
			label: String(e.value),
			color: e.color
		})), ...i.otherValues > 0 ? [{
			label: "other",
			color: "#cccccc"
		}] : []]
	};
}
function gn(e, t, n) {
	let r = D(t, n);
	return (r.find((t) => t.name === e) ?? r[0])?.colors ?? Array.from({ length: t }, () => "#3182bd");
}
function _n(e, t, n) {
	let r = hn(n);
	return r.style ? {
		sld: ye(e, t, r.style),
		classes: r.classes
	} : {
		sld: null,
		classes: [],
		problem: r.problem
	};
}
//#endregion
//#region src/utils/wms-attributes.ts
function vn(e) {
	return /point/i.test(e) ? "point" : /(line|curve)/i.test(e) ? "line" : /(polygon|surface)/i.test(e) ? "polygon" : null;
}
function yn(e) {
	for (let t of e.matchAll(/<(?:[a-z0-9]+:)?element\b([^>]*)\/?>/gi)) {
		let e = /\btype\s*=\s*"([^"]+)"/i.exec(t[1])?.[1];
		if (!e || !/gml:/i.test(e)) continue;
		let n = vn(e);
		if (n) return n;
	}
	return null;
}
var bn = /^(xsd:)?(int|integer|long|short|byte|decimal|double|float|number)$/i;
function xn(e) {
	let t = [];
	try {
		let n = new URL(e);
		if (/wms/i.test(n.pathname)) {
			let e = new URL(n.href);
			e.pathname = n.pathname.replace(/wms/gi, (e) => e === "WMS" ? "WFS" : "wfs"), t.push(e.href);
		}
		t.push(n.href);
	} catch {
		return [];
	}
	return [...new Set(t)];
}
function Sn(e) {
	let t = [];
	for (let n of e.matchAll(/<(?:[a-z0-9]+:)?element\b([^>]*)\/?>/gi)) {
		let e = n[1], r = /\bname\s*=\s*"([^"]+)"/i.exec(e)?.[1], i = /\btype\s*=\s*"([^"]+)"/i.exec(e)?.[1];
		if (!r || !i || /gml:/i.test(i)) continue;
		let a = i.replace(/^[a-z0-9]+:/i, "");
		RegExp(`^${r}Type$`, "i").test(a) || t.push({
			name: r,
			type: a,
			numeric: bn.test(a)
		});
	}
	return t;
}
function Cn(e, t) {
	let n = (e) => e.split(":").pop() ?? e, r = n(t);
	return e.find((e) => e === t) ?? e.find((e) => n(e) === r) ?? null;
}
function wn(e) {
	let t = [];
	for (let n of e.matchAll(/<(?:[a-z0-9]+:)?Name>([^<]+)<\/(?:[a-z0-9]+:)?Name>/gi)) t.push(n[1].trim());
	return t;
}
function Tn(e, t) {
	let n = new URL(e);
	for (let e of [...n.searchParams.keys()]) /^(service|request|version|typename|typenames|outputformat|count|maxfeatures|propertyname)$/i.test(e) && n.searchParams.delete(e);
	for (let [e, r] of Object.entries(t)) n.searchParams.set(e, r);
	return n.href;
}
async function En(e, t = fetch) {
	let n = e.layers.split(",")[0].trim();
	for (let r of xn(e.endpoint)) try {
		let e = await t(Tn(r, {
			SERVICE: "WFS",
			REQUEST: "GetCapabilities"
		}));
		if (!e.ok) continue;
		let i = await e.text();
		if (!/WFS_Capabilities/i.test(i)) continue;
		let a = /<(?:[a-z0-9]+:)?WFS_Capabilities[^>]*\bversion="([\d.]+)"/i.exec(i)?.[1] ?? "2.0.0", o = Cn(wn(i), n);
		if (!o) continue;
		let s = await t(Tn(r, {
			SERVICE: "WFS",
			VERSION: a,
			REQUEST: "DescribeFeatureType",
			TYPENAME: o,
			TYPENAMES: o
		}));
		if (!s.ok) continue;
		let c = await s.text(), l = Sn(c);
		if (l.length === 0) continue;
		return {
			attributes: l,
			geometry: yn(c),
			from: "wfs",
			wfs: {
				url: r,
				typeName: o,
				version: a
			}
		};
	} catch {}
	return null;
}
function Dn(e) {
	try {
		let t = JSON.parse(e)?.features?.[0]?.properties;
		return t && typeof t == "object" ? t : null;
	} catch {
		let t = (/<[a-z0-9]*:?(?:FIELDS|featureMember|Feature)\b[\s\S]*?>([\s\S]*)</i.exec(e), e), n = {};
		for (let e of t.matchAll(/<([a-z0-9_]+:)?([a-z0-9_]+)>([^<]*)<\/\1?\2>/gi)) {
			let [, , t, r] = e;
			/^(boundedBy|geom|geometry|the_geom|Box|coordinates|pos|posList)$/i.test(t) || (n[t] = r.trim());
		}
		for (let e of t.matchAll(/\b([a-z0-9_]+)\s*=\s*"([^"]*)"/gi)) {
			let [, t, r] = e;
			/^(xmlns|xsi|gml|version|srsName|fid|schemaLocation)/i.test(t) || t in n || (n[t] = r);
		}
		return Object.keys(n).length > 0 ? n : null;
	}
}
function On(e) {
	return Object.entries(e).filter(([e]) => !/^(geom|geometry|the_geom|boundedBy)$/i.test(e)).map(([e, t]) => {
		let n = typeof t == "number" || typeof t == "string" && t.trim() !== "" && Number.isFinite(Number(t));
		return {
			name: e,
			type: n ? "number" : "string",
			numeric: n
		};
	});
}
async function kn(e, t, n, r = fetch) {
	let i = e.version.startsWith("2");
	try {
		let a = await r(Tn(e.url, {
			SERVICE: "WFS",
			VERSION: e.version,
			REQUEST: "GetFeature",
			[i ? "TYPENAMES" : "TYPENAME"]: e.typeName,
			[i ? "COUNT" : "MAXFEATURES"]: String(n),
			OUTPUTFORMAT: "application/json",
			PROPERTYNAME: t
		}));
		if (!a.ok) return null;
		let o = JSON.parse(await a.text()), s = Array.isArray(o?.features) ? o.features : null;
		return s ? s.map((e) => e?.properties?.[t]) : null;
	} catch {
		return null;
	}
}
var An = [
	"application/json",
	"application/geo+json",
	"application/vnd.ogc.gml",
	"text/plain"
];
async function jn(e, t, n = fetch) {
	let { probeGetMapUrl: r } = await import("./wms-sld-probe-C4sEhAzC.js"), i = e.layers.split(",")[0].trim(), a = e.version && /^1\.[0-3]\.\d$/.test(e.version) ? e.version : "1.3.0", o = {
		I: String(t.i),
		J: String(t.j),
		X: String(t.i),
		Y: String(t.j)
	};
	for (let s of An) try {
		let c = await n(r(e, t.bbox, {
			REQUEST: "GetFeatureInfo",
			QUERY_LAYERS: i,
			INFO_FORMAT: s,
			FEATURE_COUNT: "1",
			VERSION: a,
			...o
		}, t.size));
		if (!c.ok) continue;
		let l = Dn(await c.text());
		if (!l) continue;
		let u = On(l);
		if (u.length > 0) return {
			attributes: u,
			from: "featureinfo"
		};
	} catch {}
	return null;
}
async function Mn(e, t, n = fetch) {
	return await En(e, n) || (t ? jn(e, t, n) : null);
}
//#endregion
//#region src/components/styler/label-more.ts
var Nn = new Set(["maplibre", "openlayers"]);
function Pn(e) {
	return e === void 0 || Nn.has(e);
}
function Fn(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) for (let e of n ?? []) {
		let n = e?.layout?.["text-font"];
		In(n) && (t.has(n[0]) || t.set(n[0], [...n]));
	}
	return [...t.values()].sort((e, t) => e[0].localeCompare(t[0]));
}
function In(e) {
	return Array.isArray(e) && e.length > 0 && e.every((e) => typeof e == "string" && e.length > 0) && e.some((e) => e.includes(" "));
}
function Ln(e) {
	return e?.driver === "single" && In(e.value) ? [...e.value] : null;
}
function Rn(e) {
	return e.some((e) => /polygon/i.test(e)) ? [{
		value: "point",
		label: "Inside the area"
	}, {
		value: "line",
		label: "Along the edge"
	}] : e.some((e) => /line/i.test(e)) ? [
		{
			value: "point",
			label: "Flat, at one spot"
		},
		{
			value: "line",
			label: "Along the line, repeated"
		},
		{
			value: "line-center",
			label: "Along the line, once"
		}
	] : [];
}
function zn(e) {
	return e ? e.driver === "single" && (e.value === "point" || e.value === "line" || e.value === "line-center") ? e.value : null : "point";
}
var Bn = {
	center: "On the spot",
	above: "Above",
	below: "Below",
	right: "Right",
	left: "Left"
}, Vn = {
	center: "center",
	above: "bottom",
	below: "top",
	right: "left",
	left: "right"
}, Hn = {
	center: [0, 0],
	above: [0, -1],
	below: [0, 1],
	right: [1, 0],
	left: [-1, 0]
};
function Un(e, t) {
	let n = e === void 0 ? "center" : e.driver === "single" ? e.value : null, r = Object.keys(Vn).find((e) => Vn[e] === n);
	if (!r) return null;
	let i = [0, 0];
	if (t !== void 0) {
		if (t.driver !== "single" || !Array.isArray(t.value) || t.value.length !== 2) return null;
		let [e, n] = t.value;
		if (typeof e != "number" || typeof n != "number") return null;
		i = [e, n];
	}
	if (r === "center") return i[0] === 0 && i[1] === 0 ? {
		direction: r,
		distance: 0
	} : null;
	let [a, o] = Hn[r], s = i[0] * a + i[1] * o, c = i[0] * o - i[1] * a;
	return s < 0 || c !== 0 ? null : {
		direction: r,
		distance: s
	};
}
function Wn(e) {
	if (e.direction === "center") return {};
	let [t, n] = Hn[e.direction], r = Math.max(0, e.distance);
	return {
		anchor: {
			driver: "single",
			value: Vn[e.direction]
		},
		...r === 0 ? {} : { offset: {
			driver: "single",
			value: [t * r + 0, n * r + 0]
		} }
	};
}
function Gn(e) {
	let { font: t, placement: n, anchor: r, offset: i, allowOverlap: a } = e.channels;
	if (t !== void 0 || n !== void 0 && zn(n) !== "point") return !0;
	let o = Un(r, i);
	return !o || o.direction !== "center" ? !0 : a !== void 0 && !(a.driver === "single" && a.value === !1);
}
//#endregion
//#region src/components/webmapx-layer-styler.ts
var Kn = 80, qn = 4, Jn = 900, Yn = 28, Xn = 32, Y = 6, Zn = "This layer is drawn from a style document on the server, so its styles cannot be added to, removed or reordered", Qn = {
	single: "Single value",
	attribute: "By attribute",
	neighbours: "By neighbours",
	zoom: "Grows with zoom",
	custom: "Custom (expression)"
}, X = class extends dt {
	constructor(...e) {
		super(...e), this.visible = !1, this.panelTitle = "Layer style", this.list = [], this.groups = [], this.sourceId = null, this.expandedId = null, this.layerOpacity = 1, this.filterText = "", this.message = null, this.wmsStyles = null, this.wmsStyle = "", this.wmsLoading = !1, this.sldProbe = null, this.sldProbing = !1, this.sldAttributes = null, this.sldLoadingValues = !1, this.sldDraft = mn(), this.sldApplied = !1, this.sldClasses = [], this.sldProblem = null, this.sldVerifying = !1, this.sldAttempt = 0, this.layerId = "", this.context = null, this.listIsWritable = !1, this.work = Promise.resolve(), this.openedWith = [], this.touched = !1, this.pickers = /* @__PURE__ */ new Map(), this.classifySettings = /* @__PURE__ */ new Map(), this.neighbourColors = /* @__PURE__ */ new Map(), this.neighbourPalettes = /* @__PURE__ */ new Map(), this.lastColoring = null, this.moreOpen = /* @__PURE__ */ new Set(), this.textDrafts = /* @__PURE__ */ new Map(), this.sampleAttempt = 0, this.sampledExtent = null, this.unwatchView = null, this.pending = /* @__PURE__ */ new Map(), this.releasePending = Oe(() => {
			let e = [...this.pending.values()];
			this.pending.clear();
			for (let t of e) t();
		}, Kn), this.metadataWritten = /* @__PURE__ */ new Set();
	}
	static {
		this.styles = [
			h,
			ut,
			a`
        .sections { display: flex; flex-direction: column; gap: 0.6rem; }

        .row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .row > label, .row > .name {
            flex: 0 0 7.5rem;
            font-size: 0.85rem;
            color: var(--color-text-secondary, #5a6773);
        }
        .row input[type="range"] { flex: 1 1 auto; min-width: 0; }
        /* A text field takes the rest of the row: a name and a legend wording
           are both longer than the box a shrink-wrapped input would give them. */
        .row input.grow {
            flex: 1 1 auto;
            min-width: 0;
            font: inherit;
            padding: 0.2rem 0.35rem;
            border: 1px solid var(--color-border, #cbd5df);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            background: var(--color-surface, #fff);
            color: var(--color-text-primary, #16202a);
        }
        .row .value { flex: 0 0 3.5rem; text-align: right; font-variant-numeric: tabular-nums; }

        /* The same "show more..." link the legend uses when it is taller than
           its box, so one pattern means "there is more here" everywhere. */
        .more-toggle {
            position: relative;
            align-self: flex-start;
            padding: 0;
            border: 0;
            background: none;
            color: var(--color-primary, #2b6cb0);
            font: inherit;
            font-size: 0.8rem;
            cursor: pointer;
        }
        .more-toggle:hover { text-decoration: underline; }
        /* Marks a tier holding something other than the defaults, which the
           collapsed row would otherwise hide. */
        .more-toggle.overridden::after {
            content: '';
            position: absolute;
            top: 0.05rem;
            right: -0.55rem;
            width: 0.4rem;
            height: 0.4rem;
            border-radius: 50%;
            background: var(--color-primary, #2b6cb0);
        }

        .source-line {
            font-size: 0.85rem;
            color: var(--color-text-secondary, #5a6773);
        }

        .list-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-weight: 600;
            font-size: 0.9rem;
        }

        .entry {
            border: 1px solid var(--color-border, #cbd5df);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            overflow: hidden;
        }
        .entry + .entry { margin-top: 0.35rem; }
        .entry-head {
            display: flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0.35rem 0.45rem;
            background: var(--color-surface-raised, #f4f6f8);
        }
        .entry-summary {
            flex: 1 1 auto;
            /* A flex item will not shrink below its content unless told to, and
               a sublayer id is one long unbreakable word — without this it
               pushed the reorder and delete buttons out of the row entirely. */
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 0.4rem;
            background: none;
            border: 0;
            padding: 0.1rem;
            font: inherit;
            text-align: left;
            color: inherit;
            cursor: pointer;
        }
        .swatch {
            flex: 0 0 auto;
            width: 0.9rem;
            height: 0.9rem;
            border-radius: 0.15rem;
            border: 1px solid var(--color-border, #cbd5df);
        }
        .entry-actions button {
            background: none;
            border: 0;
            padding: 0.15rem 0.25rem;
            font: inherit;
            color: var(--color-text-secondary, #5a6773);
            cursor: pointer;
        }
        /* Never squeezed out by a long name: the row's controls come first. */
        /* Never squeezed out by a long name: the row's controls come first. */
        .entry-actions { display: flex; align-items: center; gap: 0.1rem; flex: 0 0 auto; }
        /* Icons rather than glyphs: ⧉ and 🗑 are missing from enough system
           fonts to come out as tofu boxes, which is what they did. */
        .entry-actions sl-icon { font-size: 0.85rem; display: block; }
        .entry-actions button:hover:not([disabled]) { color: var(--color-text-primary, #16202a); }
        .entry-actions button[disabled] { opacity: 0.35; cursor: not-allowed; }
        .entry-body {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            padding: 0.5rem;
        }

        .color-button {
            width: 1.6rem;
            height: 1.6rem;
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            border: 1px solid var(--color-border, #cbd5df);
            cursor: pointer;
            padding: 0;
        }

        .custom {
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 0.72rem;
            background: var(--color-surface-raised, #f4f6f8);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            padding: 0.35rem;
            margin: 0;
            overflow-x: auto;
            max-height: 6rem;
        }

        .warning {
            font-size: 0.8rem;
            padding: 0.45rem 0.55rem;
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            background: var(--color-warning-surface, #fff4e0);
            color: var(--color-text-primary, #16202a);
        }
        .muted { font-size: 0.8rem; color: var(--color-text-secondary, #5a6773); }
        .raster { display: flex; flex-direction: column; gap: 0.35rem; }
        .raster p { margin: 0; }
        .choices { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .choice {
            display: flex;
            flex-direction: column;
            gap: 0.15rem;
            align-items: flex-start;
            text-align: left;
            padding: 0.45rem 0.6rem;
            border: 1px solid var(--color-border, #d6dbe1);
            border-radius: var(--webmapx-radius, 6px);
            background: var(--color-surface, #fff);
            color: inherit;
            font: inherit;
            cursor: pointer;
        }
        .choice[aria-pressed="true"] {
            border-color: var(--color-primary, #2b6cb0);
            outline: 2px solid var(--color-primary, #2b6cb0);
            outline-offset: -1px;
        }
        .style-legend { max-width: 100%; max-height: 6rem; margin-top: 0.25rem; }
        .sld { margin-top: 0.35rem; padding-top: 0.5rem; border-top: 1px solid var(--color-border, #d6dbe1); }
        .sld-legend { display: flex; flex-wrap: wrap; gap: 0.35rem; font-size: 0.75rem; }
        .sld-class { display: inline-flex; align-items: center; gap: 0.25rem; }
        .sld-class .swatch { width: 0.75rem; height: 0.75rem; border-radius: 2px; display: inline-block; }
        /* An inline action inside a sentence, which is a control, not decoration. */
        button.link {
            background: none;
            border: 0;
            padding: 0;
            font: inherit;
            color: var(--color-primary, #2b6cb0);
            text-decoration: underline;
            cursor: pointer;
        }

        .filter-row { margin: 0.35rem 0; }
        .filter-row input[type="search"] { flex: 1 1 auto; min-width: 0; }
        /* Which of a multi-source layer's datasets an entry draws. */
        .entry-text { display: flex; flex-direction: column; gap: 0.05rem; min-width: 0; }
        /* One line, clipped: the name identifies the row, and a forty-character
           id wrapping over three lines buries the summary that explains it. */
        .entry-name {
            font-weight: 600;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .entry-detail {
            font-size: 0.78rem;
            color: var(--color-text-secondary, #5a6773);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .source-key {
            margin-left: 0.3rem;
            color: var(--color-text-secondary, #5a6773);
            font-size: 0.75rem;
        }
        .check-row { gap: 0.35rem; }
        /* A checkbox and its words stay on one line: wrapping between them puts
           the label under the box and reads as two controls. */
        .check { display: flex; align-items: center; gap: 0.3rem; font-size: 0.85rem; }
        .check input { flex: 0 0 auto; }
        .checks { display: flex; flex-wrap: wrap; gap: 0.15rem 0.6rem; min-width: 0; }
        .check-row { align-items: flex-start; }

        /* Level 4 sits under the channel it drives, indented so the nesting is
           visible without a box around every classification. */
        .level4 {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
            margin: 0.1rem 0 0.35rem 0.6rem;
            padding-left: 0.5rem;
            border-left: 2px solid var(--color-border-light, #e2e7ec);
        }
        /* Indented by the level-4 rule, so the label column gives room back. */
        .level4 .row > .name { flex-basis: 5.5rem; }
        .schemes { display: flex; flex-wrap: wrap; gap: 0.25rem; }
        .scheme {
            display: flex;
            border: 1px solid var(--color-border, #cbd5df);
            border-radius: var(--webmapx-radius-sm, 0.35rem);
            padding: 0;
            overflow: hidden;
            cursor: pointer;
            background: none;
        }
        .scheme span { width: 0.85rem; height: 0.85rem; display: block; }
        .scheme[aria-pressed="true"] { outline: 2px solid var(--color-primary, #2b6cb0); outline-offset: 1px; }
    `
		];
	}
	get isVisible() {
		return this.visible;
	}
	closePanel() {
		this.close();
	}
	open(e) {
		this.context = e, this.layerId = e.layerId, this.panelTitle = e.title, this.groups = e.groups, this.message = null, this.expandedId = null, this.classifySettings = /* @__PURE__ */ new Map(), this.wmsStyles = null, this.wmsLoading = !1, this.wmsStyle = L(e.raster?.sourceConfig)?.style ?? "", this.sldProbe = null, this.sldProbing = !1, this.sldAttributes = null, this.sldDraft = mn(), this.sldApplied = !1, this.sldClasses = [], this.sldProblem = null, this.sldVerifying = !1, this.sldAttempt++, this.destroyPickers(), this.adopt(e), this.visible = !0, this.showPanel(), this.loadGroups(e), this.watchTheView(e);
	}
	watchTheView(e) {
		this.unwatchView?.(), this.unwatchView = e.watchView?.((t) => {
			if (this.context !== e || !this.visible || !this.viewportLimited()) return;
			let n = this.sampledExtent;
			this.sampledExtent = t, !(n ? !tn(t, n) : rn(this.groups)) && this.resampleUntilDrawn(e);
		}) ?? null;
	}
	async resampleUntilDrawn(e) {
		let t = ++this.sampleAttempt;
		for (let n = 0; n < qn; n++) {
			let n = await this.loadGroups(e, { keepWhenEmpty: !0 });
			if (this.context !== e || t !== this.sampleAttempt || n || (await new Promise((e) => setTimeout(e, Jn)), this.context !== e || t !== this.sampleAttempt)) return;
		}
	}
	viewportLimited() {
		return this.groups.some((e) => e.completeData === !1);
	}
	async loadGroups(e, t = {}) {
		if (!e.resample) return !1;
		let n = await e.resample();
		if (this.context !== e) return !1;
		let r = rn(n);
		return t.keepWhenEmpty && !r && rn(this.groups) ? !1 : (this.groups = n, this.touched || this.openedWith.length === 0 || (this.list = Zt(this.layerId, this.openedWith, n)), r);
	}
	close() {
		this.flushPending(), this.unwatchView?.(), this.unwatchView = null, this.sampledExtent = null, this.visible = !1, this.destroyPickers(), this.hidePanel();
	}
	disconnectedCallback() {
		this.unwatchView?.(), this.unwatchView = null, this.destroyPickers(), super.disconnectedCallback();
	}
	adopt(e) {
		let t = e.layers?.getSubLayers?.(e.layerId) ?? null, n = Array.isArray(t) && t.length > 0;
		this.listIsWritable = n && !!e.layers?.setSubLayers && e.layers?.canRebuild?.(e.layerId) !== !1, this.openedWith = n ? t.map((e) => ({ ...e })) : [], this.touched = !1, this.list = n ? Zt(e.layerId, t, e.groups) : Qt(e.groups), this.sourceId = null;
	}
	sourceIds() {
		let e = this.groups.map((e) => e.sourceId);
		for (let t of this.list) t.sourceId && !e.includes(t.sourceId) && e.push(t.sourceId);
		return e;
	}
	group(e) {
		return this.groups.find((t) => t.sourceId === e) ?? null;
	}
	visibleEntries() {
		let e = this.filterText.trim().toLowerCase();
		return this.list.filter((e) => !this.sourceId || e.sourceId === this.sourceId).filter((t) => !e || this.entryLabel(t).toLowerCase().includes(e)).slice().reverse();
	}
	entryLabel(e) {
		let t = this.displayEntryName(e) ?? e.entry.id;
		return e.styleable ? `${t} ${St(e.entry, this.context?.attributeLabels)}` : `${t} ${e.entry.origin?.type ?? ""}`;
	}
	displayEntryName(e, t = {}) {
		if (t.authored !== !1 && e.entry.title) return e.entry.title;
		let n = e.entry.id, r = t.authored === !1 ? {
			...e.entry.origin ?? {},
			metadata: void 0
		} : e.entry.origin;
		return _(this.context?.layerMeta ?? null, r, n, this.list.length === 1, this.layerId) || null;
	}
	sourceLabel(e) {
		let t = this.group(e), n = e.split(":").pop() || e;
		return t ? `${n} — ${t.featureCountLabel}` : n;
	}
	applyEntry(e, t) {
		this.schedule(`${e.entry.id}:${t}`, () => {
			let n = this.list.find((t) => t.entry.id === e.entry.id) ?? e;
			this.work = this.work.then(() => this.applyEntryNow(n, t));
		});
	}
	schedule(e, t) {
		this.pending.set(e, t), this.releasePending();
	}
	flushPending() {
		if (this.releasePending.flush(), this.pending.size === 0) return;
		let e = [...this.pending.values()];
		this.pending.clear();
		for (let t of e) t();
	}
	applyEntryNow(e, t) {
		let n = w(e.entry), r = k[e.entry.role]?.[t]?.slot === "layout", i = e.entry.channels[t] === void 0;
		if (r || i || t === "fillOutline" || !this.context?.apply) {
			this.rebuildNow();
			return;
		}
		let a = n.paint ?? {}, o = this.context.apply(e.entry.id, a);
		this.message = o === !1 ? "The map did not accept this change: this part of the layer is described in the legend but is not drawn on the map." : null;
	}
	async resetStyle() {
		if (this.pending.clear(), this.openedWith.length === 0) {
			this.message = "This panel has nothing to put back: it never read the layer as a whole.";
			return;
		}
		let e = this.context?.layers;
		if (e?.setSubLayers && this.listIsWritable) {
			if (!await e.setSubLayers(this.layerId, this.openedWith.map((e) => ({ ...e })))) {
				this.message = "The map did not accept the original styles.";
				return;
			}
		} else if (this.context?.apply) for (let e of this.openedWith) e.id && this.context.apply(e.id, e.paint ?? {});
		this.list = Zt(this.layerId, this.openedWith, this.groups), this.classifySettings = /* @__PURE__ */ new Map(), this.expandedId = null, this.touched = !1, this.message = null;
	}
	rebuild() {
		this.flushPending(), this.work = this.work.then(() => this.rebuildNow());
	}
	async rebuildNow() {
		let e = this.context?.layers;
		if (!e?.setSubLayers || !this.listIsWritable) {
			this.message = "This layer cannot be rebuilt here, so the style list cannot be changed. Its existing styles can still be edited.";
			return;
		}
		let t = await e.setSubLayers(this.layerId, $t(this.list));
		this.message = t ? null : "The map did not accept the new style list.", t && this.refreshOrigins();
	}
	refreshOrigins() {
		let e = this.context?.layers?.getSubLayers?.(this.layerId);
		if (!Array.isArray(e)) return;
		let t = new Map(e.map((e) => [String(e.id ?? ""), e]));
		this.list = this.list.map((e) => {
			let n = t.get(e.entry.id);
			if (!n) return e;
			let r = Jt(n, this.group(e.sourceId)?.geometryTypes?.join(" "));
			return {
				...e,
				entry: {
					...e.entry,
					origin: r.origin,
					originChannels: r.originChannels
				}
			};
		});
	}
	setChannel(e, t, n, r = {}) {
		let i = this.list.find((t) => t.entry.id === e.entry.id) ?? e, a = { ...i.entry.channels };
		n ? a[t] = n : delete a[t];
		let o = (i.entry.role === "line" || i.entry.role === "outline") && t !== "lineJoin" && t !== "lineCap" && !a.lineJoin && !a.lineCap;
		o && (a.lineJoin = {
			driver: "single",
			value: "round"
		}, a.lineCap = {
			driver: "single",
			value: "round"
		});
		let s = {
			...i.entry,
			channels: a
		};
		this.list = this.list.map((e) => e === i ? {
			...e,
			entry: s
		} : e), this.touched = !0;
		let c = this.list.find((e) => e.entry.id === s.id);
		o && this.applyEntry(c, "lineJoin"), !r.silent && this.applyEntry(c, t);
	}
	setEntryField(e, t, n, r = { finished: !0 }) {
		let i = this.list.find((t) => t.entry.id === e.entry.id) ?? e, a = n.trim(), o = (i.entry[t] ?? "") === a;
		if (!o) {
			let e = { ...i.entry };
			a ? e[t] = a : delete e[t], this.list = this.list.map((t) => t === i ? {
				...t,
				entry: e
			} : t), this.touched = !0;
			let n = this.list.find((t) => t.entry.id === e.id);
			if (this.writeEntryMetadata(n)) {
				this.metadataWritten.add(e.id);
				return;
			}
		}
		r.finished && !this.metadataWritten.has(i.entry.id) && !o && this.rebuild();
	}
	writeEntryMetadata(e) {
		let t = this.context?.layers?.setSubLayerMetadata;
		if (!t || !this.context) return !1;
		let n = w(e.entry).metadata;
		return t(this.context.layerId, e.entry.id, n && typeof n == "object" ? n : null);
	}
	setTextDraft(e, t) {
		let n = new Map(this.textDrafts);
		t === null ? n.delete(e) : n.set(e, t), this.textDrafts = n;
	}
	addEntry(e) {
		this.touched = !0;
		let t = Et(this.layerId, this.list.map((e) => e.entry.id)), n = this.sourceId ?? this.sourceIds()[0] ?? "", r = Tt(e, t);
		r.origin = this.sublayerShell(n), this.list = [...this.list, {
			entry: r,
			sourceId: n,
			styleable: !0
		}], this.expandedId = t, this.rebuild();
	}
	sublayerShell(e) {
		let t = this.list.find((t) => t.sourceId === e)?.entry.origin, n = {};
		return t && typeof t.source == "string" && (n.source = t.source), t && typeof t["source-layer"] == "string" && (n["source-layer"] = t["source-layer"]), n;
	}
	duplicate(e) {
		this.touched = !0;
		let t = Et(this.layerId, this.list.map((e) => e.entry.id)), n = Dt(e.entry, t);
		n.origin = this.sublayerShell(e.sourceId);
		let r = this.list.indexOf(e);
		this.list = [
			...this.list.slice(0, r + 1),
			{
				...e,
				entry: n
			},
			...this.list.slice(r + 1)
		], this.expandedId = t, this.rebuild();
	}
	removeEntry(e) {
		this.touched = !0, this.list = this.list.filter((t) => t !== e), this.expandedId === e.entry.id && (this.expandedId = null), this.rebuild();
	}
	move(e, t) {
		t && (this.touched = !0, this.list = en(this.list, e.entry.id, t.entry.id), this.rebuild());
	}
	setLayerOpacity(e) {
		this.layerOpacity = e, this.context?.sourceControl?.setLayerOpacity(e);
	}
	render() {
		return l`
            <div class="panel" role="dialog" aria-modal="false" aria-label=${this.panelTitle}
                 style=${this.panelPosition()}>
                <header class="panel-head" title="Drag to move"
                        @pointerdown=${(e) => this.startDrag(e)}>
                    <sl-icon class="drag-grip" name="grip-vertical" aria-hidden="true"></sl-icon>
                    <span class="panel-title">${this.panelTitle}</span>
                    <button class="panel-close" type="button" aria-label="Close" @click=${() => this.close()}>✕</button>
                </header>
                <div class="panel-body">
                    <div class="sections">
                        ${this.renderLayerOpacity()}
                        ${this.renderSource()}
                        ${this.renderRaster()}
                        ${this.renderList()}
                        ${this.message ? l`<div class="warning">${this.message}</div>` : r}
                    </div>
                </div>
                <div class="footer">
                    <sl-button size="small" ?disabled=${!this.touched} @click=${() => void this.resetStyle()}>Reset</sl-button>
                    <sl-button size="small" variant="primary" @click=${() => this.close()}>Done</sl-button>
                </div>
            </div>
        `;
	}
	renderLayerOpacity() {
		return this.context?.sourceControl ? l`
            <div class="row">
                <label for="layer-opacity">Layer opacity</label>
                <input id="layer-opacity" type="range" min="0" max="1" step="0.05"
                       .value=${String(this.layerOpacity)}
                       @input=${(e) => this.setLayerOpacity(Number(e.target.value))}>
                <span class="value">${Math.round(this.layerOpacity * 100)}%</span>
            </div>
        ` : r;
	}
	renderSource() {
		let e = this.group(this.sourceId) ?? this.groups[0] ?? null, t = e?.completeData === !1;
		return l`
            ${e ? l`<div class="source-line">Data: ${e.featureCountLabel}</div>` : r}
            ${t ? l`
                <div class="warning">
                    This layer arrives as tiles, so what the panel knows about it is what the map has drawn.
                    Move to a part of the map that represents the whole before classifying.
                </div>` : r}
        `;
	}
	renderRaster() {
		let e = this.context?.raster;
		if (!e) return r;
		let t = L(e.sourceConfig);
		t && this.wmsStyles === null && !this.wmsLoading && this.loadWmsStyles(t);
		let n = (this.context?.sourceControl?.getTiles?.(e.sourceId) ?? null) !== null;
		if (t && n && this.sldProbe === null && !this.sldProbing && this.loadSldBranch(t), this.wmsLoading) return l`<div class="raster"><strong>Styles</strong>
                <p class="muted">Asking the service which ways it can draw this layer…</p></div>`;
		let i = an(e, this.context?.sourceControl, this.wmsStyles);
		if (i.kind === "tiles") return l`<div class="raster"><strong>Images, not features</strong>
                <p class="muted">
                    This layer arrives as finished pictures from a tile service, so there is nothing here to colour
                    or classify — the drawing was done before the tiles were sent. Its opacity is above.
                </p></div>`;
		if (i.kind === "fixed") return l`<div class="raster"><strong>Drawn by the service</strong>
                <p class="muted">
                    A WMS decides the colours itself, and this map engine cannot ask it for a different style once
                    the layer is on the map. Its opacity is what can be changed here.
                </p></div>${this.renderSldBranch(t)}`;
		if (i.kind === "single") return l`<div class="raster"><strong>Drawn by the service</strong>
                <p class="muted">
                    ${i.only ? `This service draws this layer one way only ("${i.only.title}").` : "This service advertises no named styles for this layer, so it draws it one way only."}
                    A WMS decides the colours itself; only its opacity can be changed here.
                </p></div>${this.renderSldBranch(t)}`;
		let a = this.wmsStyles ?? [];
		return l`
            <div class="raster">
                <strong>Which style?</strong>
                <p class="muted">
                    ${this.sldApplied ? "Your own style is drawing this layer. Choosing one of these hands it back to the service." : "The service draws this layer; these are the ways it offers."}
                </p>
                <div class="choices">
                    ${a.map((e) => l`
                        <button class="choice" type="button"
                                aria-pressed=${!this.sldApplied && e.name === this.wmsStyle ? "true" : "false"}
                                @click=${() => this.applyWmsStyle(e.name)}>
                            <span>${e.title}</span>
                            ${e.legendUrl ? l`<img class="style-legend" src=${e.legendUrl} alt="" loading="lazy">` : r}
                        </button>
                    `)}
                </div>
            </div>
            ${this.renderSldBranch(t)}
        `;
	}
	renderSldBranch(e) {
		let t = this.context?.raster;
		if (!(t && (this.context?.sourceControl?.getTiles?.(t.sourceId) ?? null) !== null)) return r;
		if (this.sldProbing) return l`<p class="muted">Asking the service whether it can draw a style of your own…</p>`;
		if (!this.sldProbe?.supported) return this.sldProbe?.reason === "no-ink" ? l`
                    <div class="raster">
                        <p class="muted">
                            This layer draws nothing where the map is looking, so it cannot be styled here yet.
                            Move to somewhere it has data, then look again.
                        </p>
                        <div class="row">
                            <sl-button size="small" @click=${() => void this.retrySldProbe(e)}>Look again</sl-button>
                        </div>
                    </div>` : r;
		let n = this.sldAttributes?.attributes ?? [], i = this.sldAttributes?.from === "featureinfo";
		return l`
            <div class="raster sld">
                <strong>Or draw it yourself</strong>
                <p class="muted">This service will draw its data the way you ask, so it can be coloured here.</p>
                <div class="row">
                    <label for="sld-driver">Colour by</label>
                    <select id="sld-driver" .value=${this.sldDraft.driver}
                            @change=${(e) => this.setDraft({ driver: e.target.value })}>
                        <option value="single">One colour</option>
                        <option value="attribute" ?disabled=${n.length === 0}>An attribute</option>
                    </select>
                </div>
                ${this.sldDraft.driver === "single" ? l`
                    <div class="row">
                        <label>Colour</label>
                        <button id="sld-color" class="color-button" type="button"
                                style=${`background:${this.sldDraft.color}`}
                                aria-label=${`Colour: ${this.sldDraft.color}`}
                                @click=${(e) => this.openPicker("sld:color", e.currentTarget, this.sldDraft.color, (e) => this.setDraft({ color: e }))}></button>
                    </div>` : this.renderSldAttribute(n, i)}
                <div class="row">
                    <label>Outline</label>
                    <button id="sld-stroke" class="color-button" type="button"
                            style=${`background:${this.sldDraft.strokeColor || "transparent"}`}
                            aria-label=${`Outline: ${this.sldDraft.strokeColor || "none"}`}
                            @click=${(e) => this.openPicker("sld:stroke", e.currentTarget, this.sldDraft.strokeColor || "#333333", (e) => this.setDraft({ strokeColor: e }))}></button>
                    <button type="button" @click=${() => this.setDraft({ strokeColor: "" })}
                            ?disabled=${!this.sldDraft.strokeColor}>None</button>
                </div>
                ${this.sldClasses.length > 1 ? l`
                    <div class="sld-legend">
                        ${this.sldClasses.map((e) => l`
                            <span class="sld-class">
                                <span class="swatch" style="background:${e.color}"></span>${e.label}
                            </span>`)}
                    </div>` : r}
                ${this.sldProblem ? l`<div class="warning">${this.sldProblem}</div>` : r}
                <div class="row">
                    <!-- Never disabled while a check is in flight: a check is
                         about a style the user may already have changed, and
                         swallowing the next click is worse than superseding the
                         check, which the attempt counter makes safe. -->
                    <sl-button size="small" variant="primary"
                               ?disabled=${this.sldLoadingValues}
                               @click=${() => void this.applySld(e)}>Draw it</sl-button>
                    ${this.sldVerifying ? l`<span class="muted">Checking…</span>` : r}
                    <sl-button size="small" ?disabled=${!this.sldApplied}
                               @click=${() => this.clearSld()}>Back to the service's style</sl-button>
                </div>
            </div>
        `;
	}
	renderSldAttribute(e, t) {
		return l`
            <div class="row">
                <label for="sld-attribute">Attribute</label>
                <select id="sld-attribute" .value=${this.sldDraft.attribute ?? ""}
                        @change=${(e) => void this.chooseSldAttribute(e.target.value)}>
                    <option value="">Choose…</option>
                    ${e.map((e) => l`
                        <option value=${e.name} ?selected=${e.name === this.sldDraft.attribute}>
                            ${e.name}${e.numeric ? " (number)" : ""}
                        </option>`)}
                </select>
            </div>
            <div class="row">
                <label for="sld-classes">Classes</label>
                <input id="sld-classes" type="number" min="2" max="9" .value=${String(this.sldDraft.classCount)}
                       @input=${(e) => void this.setDraft({ classCount: Number(e.target.value) || 5 })}>
            </div>
            ${this.sldLoadingValues ? l`<p class="muted">Reading values from the service…</p>` : r}
            ${t ? l`
                <p class="muted">
                    This service publishes no data service alongside its pictures, so these column names come from a
                    single feature and there are no values to classify by. One colour is what can be drawn here.
                </p>` : r}
        `;
	}
	setDraft(e) {
		this.sldAttempt++, this.sldVerifying = !1, this.sldDraft = {
			...this.sldDraft,
			...e
		};
		let t = hn(this.sldDraft);
		this.sldClasses = t.classes, this.sldProblem = t.problem ?? null;
	}
	sldGeometry() {
		return this.sldAttributes?.geometry ?? this.sldProbe?.geometry ?? "unknown";
	}
	async chooseSldAttribute(e) {
		this.setDraft({
			attribute: e || null,
			values: null
		});
		let t = this.sldAttributes?.wfs;
		if (!(!e || !t)) {
			this.sldLoadingValues = !0;
			try {
				let n = await kn(t, e, sn);
				this.setDraft({ values: n ?? [] });
			} finally {
				this.sldLoadingValues = !1;
			}
		}
	}
	async retrySldProbe(e) {
		this.sldProbe = null, await this.loadSldBranch(e, { force: !0 });
	}
	async loadSldBranch(e, t = {}) {
		let n = this.context;
		this.sldProbing = !0;
		try {
			let r = await ge(e, fn(n?.sourceControl?.getView?.() ?? null, n?.bounds ?? null), void 0, t);
			if (this.context !== n || (this.sldProbe = r, !r.supported)) return;
			let i = await Mn(e, r.hit ?? null);
			if (this.context !== n) return;
			this.sldAttributes = i;
		} catch {
			this.context === n && (this.sldProbe = {
				supported: !1,
				reason: "error"
			});
		} finally {
			this.context === n && (this.sldProbing = !1);
		}
	}
	async applySld(e) {
		let t = this.context?.raster;
		if (!t) return;
		let n = _n(e.layers.split(",")[0].trim(), this.sldGeometry(), this.sldDraft);
		if (this.sldClasses = n.classes, this.sldProblem = n.problem ?? null, !n.sld || !this.writeSourceParams(t.sourceId, {
			SLD_BODY: n.sld,
			STYLES: ""
		}, (e) => A(e, n.sld))) return;
		this.sldApplied = !0, this.message = null;
		let r = ++this.sldAttempt, i = this.context;
		this.sldProblem = null, this.sldVerifying = !0;
		try {
			let [t] = fn(this.context?.sourceControl?.getView?.() ?? null, this.context?.bounds ?? null), a = await me(A(ve(e, t.bbox, {}, t.size ?? void 0), n.sld));
			if (r !== this.sldAttempt || this.context !== i) return;
			if (a.ok) {
				this.sldProblem = null;
				return;
			}
			this.sldApplied = a.problem !== "too-long", this.sldProblem = a.problem === "too-long" ? "This service will not accept a request this long. Use fewer classes, or an attribute with shorter values." : a.detail ? `The service refused this style: ${a.detail}` : "The service refused this style.";
		} catch (e) {
			r === this.sldAttempt && (this.sldProblem = `The style could not be checked: ${String(e?.message ?? e)}`);
		} finally {
			r === this.sldAttempt && (this.sldVerifying = !1);
		}
	}
	clearSld() {
		let e = this.context?.raster;
		if (!e) return;
		let t = this.wmsStyle;
		this.writeSourceParams(e.sourceId, {
			SLD_BODY: null,
			STYLES: t
		}, (e) => at(A(e, null), t)) && (this.sldApplied = !1, this.sldClasses = []);
	}
	writeSourceParams(e, t, n) {
		return (this.context?.sourceControl)?.setParams?.(e, t) ? !0 : this.writeSourceUrls(e, n) !== null;
	}
	writeSourceUrls(e, t) {
		let n = this.context?.sourceControl, r = n?.getTiles?.(e) ?? null;
		if (!r || r.length === 0) return this.message = "This map engine cannot change this layer's request while it is on the map.", null;
		let i = r.map(t);
		return n?.setTiles(e, i) ? i : (this.message = "This map engine cannot change this layer's request while it is on the map.", null);
	}
	async loadWmsStyles(e) {
		this.wmsLoading = !0;
		try {
			this.wmsStyles = await ot(e);
		} catch {
			this.wmsStyles = [], this.message = "The service did not answer with the styles it offers.";
		} finally {
			this.wmsLoading = !1;
		}
	}
	applyWmsStyle(e) {
		let t = this.context?.raster;
		if (t) {
			if (!this.writeSourceParams(t.sourceId, {
				STYLES: e,
				SLD_BODY: null
			}, (n) => on(t, this.context?.sourceControl, e)[0] ?? n)) {
				this.message = "This map engine cannot change a layer's style while it is on the map.";
				return;
			}
			this.wmsStyle = e, this.sldApplied = !1, this.sldClasses = [], this.message = null;
		}
	}
	renderList() {
		let e = this.visibleEntries(), t = this.group(this.sourceId) ?? this.groups[0] ?? null, n = yt(t?.geometryTypes ?? []), i = this.list.some((e) => e.styleable) || (t?.geometryTypes?.length ?? 0) > 0, a = this.sourceIds().length > 1;
		return l`
            <div>
                <div class="list-head">
                    <span>Styles</span>
                    ${this.listIsWritable && i ? l`
                        <select aria-label="Add a style"
                                @change=${(e) => {
			let t = e.target, n = t.value;
			t.value = "", n && this.addEntry(n);
		}}>
                            <option value="">+ Add style</option>
                            ${n.map((e) => l`<option value=${e}>${vt[e]}</option>`)}
                        </select>` : r}
                </div>
                ${this.renderFilter()}
                ${this.list.length === 0 ? l`<p class="muted">This layer draws nothing this panel can style.</p>` : e.length === 0 ? l`<p class="muted">No style matches that.</p>` : e.map((t) => this.renderEntry(t, e, a))}
                ${!i && this.list.length > 0 ? l`
                    <p class="muted">
                        This layer arrives as finished pictures rather than features, so there is nothing here to
                        colour. What it can be asked is above.
                    </p>` : r}
                ${!this.listIsWritable && this.list.length > 0 && i ? l`
                    <p class="muted">
                        This layer's styles come from a style document on the server, so they can be recoloured here
                        but not added to, removed or reordered.
                    </p>` : r}
            </div>
        `;
	}
	renderFilter() {
		if (this.list.length <= 12) return r;
		let e = this.sourceIds();
		return l`
            <div class="row filter-row">
                <input type="search" placeholder="Filter styles" aria-label="Filter styles"
                       .value=${this.filterText}
                       @input=${(e) => {
			this.filterText = e.target.value;
		}}>
                ${e.length > 1 ? l`
                    <select aria-label="Show styles drawing from"
                            @change=${(e) => {
			this.sourceId = e.target.value || null;
		}}>
                        <option value="">All data</option>
                        ${e.map((e) => l`<option value=${e} ?selected=${e === this.sourceId}>${this.sourceLabel(e)}</option>`)}
                    </select>` : r}
            </div>
        `;
	}
	renderEntry(e, t, n) {
		let i = this.expandedId === e.entry.id, a = t.indexOf(e), o = xt(e.entry.channels.color), s = this.displayEntryName(e), c = this.listIsWritable, u = t[a - 1], d = t[a + 1];
		return l`
            <div class="entry">
                <div class="entry-head">
                    <button class="entry-summary" type="button" aria-expanded=${i}
                            @click=${() => {
			this.expandedId = i ? null : e.entry.id;
		}}>
                        <span class="swatch" style=${$n(o)}></span>
                        <span class="entry-text">
                            ${s ? l`<span class="entry-name">${s}</span>` : r}
                            <span class=${s ? "entry-detail" : ""}>
                                ${e.styleable ? St(e.entry, this.context?.attributeLabels) : `${e.entry.origin?.type ?? "Other"} — not styled here`}
                                ${n ? l`<small class="source-key">${e.sourceId.split(":").pop()}</small>` : r}
                            </span>
                        </span>
                    </button>
                    <span class="entry-actions">
                        ${c ? l`
                            <button type="button" aria-label="Move up, so it draws on top"
                                    title=${a === 0 ? "Already drawn on top" : "Move up"}
                                    ?disabled=${a === 0} @click=${() => this.move(e, u)}>
                                <sl-icon name="arrow-up"></sl-icon>
                            </button>
                            <button type="button" aria-label="Move down, so it draws underneath"
                                    title=${a === t.length - 1 ? "Already at the bottom" : "Move down"}
                                    ?disabled=${a === t.length - 1} @click=${() => this.move(e, d)}>
                                <sl-icon name="arrow-down"></sl-icon>
                            </button>` : r}
                        <button type="button" aria-label="Duplicate this style"
                                title=${this.listIsWritable ? "Duplicate" : Zn}
                                ?disabled=${!this.listIsWritable} @click=${() => this.duplicate(e)}>
                            <sl-icon name="copy"></sl-icon>
                        </button>
                        <button type="button" aria-label="Delete this style"
                                title=${this.listIsWritable ? this.list.length <= 1 ? "A layer needs at least one style" : "Delete" : Zn}
                                ?disabled=${!this.listIsWritable || this.list.length <= 1} @click=${() => this.removeEntry(e)}>
                            <sl-icon name="trash"></sl-icon>
                        </button>
                    </span>
                </div>
                ${i ? l`<div class="entry-body">${this.renderChannels(e)}</div>` : r}
            </div>
        `;
	}
	renderChannels(e) {
		return e.styleable ? [
			this.renderTitle(e),
			...de(e.entry.role).map((t) => this.renderChannel(e, t)),
			this.renderMoreToggle(e)
		] : l`<p class="muted">
                This part of the layer is drawn as <code>${e.entry.origin?.type}</code>, which this panel has no
                controls for. It is left exactly as it is.
            </p>`;
	}
	renderTitle(e) {
		let t = this.displayEntryName(e, { authored: !1 }) ?? St(e.entry, this.context?.attributeLabels), n = `${e.entry.id}:title`, r = (e) => e.trim() === t ? "" : e;
		return l`
            <div class="row">
                <span class="name">Name</span>
                <input type="text" class="grow" aria-label="What this style is called"
                       placeholder=${t}
                       .value=${this.textDrafts.get(n) ?? e.entry.title ?? t}
                       @input=${(t) => {
			let i = t.target.value;
			this.setTextDraft(n, i), this.setEntryField(e, "title", r(i), { finished: !1 });
		}}
                       @change=${(t) => {
			this.setTextDraft(n, null), this.setEntryField(e, "title", r(t.target.value));
		}}>
            </div>
        `;
	}
	canClassify(e) {
		return W.includes(e) || e === "radius" || e === "textSize";
	}
	featuresOf(e) {
		return this.group(e.sourceId)?.features ?? this.groups[0]?.features ?? [];
	}
	attributesOf(e) {
		return this.group(e.sourceId)?.attributes ?? this.groups[0]?.attributes ?? [];
	}
	attributeDriverBlocker(e) {
		return this.featuresOf(e).length === 0 ? "No features are loaded" : this.attributesOf(e).length === 0 ? "This layer has no columns" : null;
	}
	settingsKey(e, t) {
		return `${e.entry.id}:${t}`;
	}
	settingsFor(e, t) {
		let n = this.settingsKey(e, t), r = this.classifySettings.get(n);
		if (r) return r;
		let i = e.entry.channels[t], a = this.attributesOf(e), o = a.find((e) => T(e.type))?.name ?? a[0]?.name ?? "";
		if (i?.driver !== "attribute") return ce(o);
		let s = i.classification, c = ce(i.attribute || o);
		return c.schemeName = i.schemeName ?? null, s.kind === "ranges" && (c.classCount = s.colors.length, s.noDataColor && (c.noDataColor = s.noDataColor)), s.kind === "categories" && (c.maxCategories = Math.max(s.values.length, 1), c.cycle = !0, s.fallbackColor && (c.noDataColor = s.fallbackColor)), s.kind === "proportional" && (c.growWithZoom = s.zoomFactor !== void 0), c;
	}
	updateSettings(e, t, n) {
		let r = this.settingsFor(e, t), i = {
			...r,
			...n
		}, a = new Map(this.classifySettings);
		a.set(this.settingsKey(e, t), i), this.classifySettings = a, this.renameForAttribute(e, r.attribute, i.attribute), this.applyClassification(e, t, i);
	}
	renameForAttribute(e, t, n) {
		if (!t || !n || t === n) return;
		let r = this.list.find((t) => t.entry.id === e.entry.id) ?? e;
		r.entry.title === t && this.setEntryField(r, "title", n);
	}
	applyClassification(e, t, n) {
		this.schedule(`${e.entry.id}:${t}:classify`, () => {
			let r = this.list.find((t) => t.entry.id === e.entry.id) ?? e;
			this.classifyNow(r, t, n);
		});
	}
	classifyNow(e, t, n) {
		let r = this.featuresOf(e);
		if (!n.attribute || r.length === 0) return;
		let i = t === "radius" || t === "textSize" ? t === "radius" ? ae(r, n.attribute, Yn, n.growWithZoom === !1 ? void 0 : this.context?.sourceControl?.getView?.()?.zoom) : ae(r, n.attribute, Xn) : C(r, this.isNumeric(e, n.attribute), n);
		if (!i) {
			this.message = `Nothing to classify: “${n.attribute}” has no usable values.`;
			return;
		}
		if (i.channel === null) {
			this.message = i.problem;
			return;
		}
		this.message = i.warning ?? null, this.setChannel(e, t, i.channel);
	}
	isNumeric(e, t) {
		return T(this.attributesOf(e).find((e) => e.name === t)?.type);
	}
	neighbourDriverBlocker(e, t) {
		if (!W.includes(t)) return "Not something neighbours can decide";
		let n = this.group(e.sourceId) ?? this.groups[0] ?? null, r = (n?.geometryTypes ?? []).some((e) => /polygon/i.test(e));
		return n && !r ? "Areas only" : this.featuresOf(e).length === 0 ? "No features are loaded" : !this.canWriteFeatures(e) && !x(this.featuresOf(e)) ? "Nothing tells these areas apart: no id, and no columns unique together" : null;
	}
	canWriteFeatures(e) {
		let t = this.group(e.sourceId) ?? this.groups[0] ?? null;
		return !t || !this.context?.writeFeatures || t.completeData === !1 ? !1 : t.sourceConfig?.type === "geojson" && (t.features?.length ?? 0) > 0;
	}
	renderNeighbours(e, t) {
		let n = this.neighbourColors.get(this.settingsKey(e, t)) ?? Y, i = this.lastColoring;
		return l`
            <div class="level4">
                <div class="row">
                    <span class="name">Colours</span>
                    <input type="range" min="4" max="12" step="1" aria-label="How many colours to spread over"
                           .value=${String(n)}
                           @input=${(n) => this.applyNeighbours(e, t, Number(n.target.value))}>
                    <span class="value">${n}</span>
                </div>
                ${this.renderNeighbourPalette(e, t)}
                <p class="muted">
                    A colour here names no value, so this map has no legend — it is for showing where the areas are
                    and where their borders run.
                </p>
                ${e.entry.channels[t]?.key ? l`
                    <p class="muted">
                        This layer's data cannot be added to, so every area is named in the style, coloured from the
                        areas drawn now. An area that comes into view later is drawn in the fallback colour until the
                        colouring is run again: move the Colours slider to do that.
                    </p>` : r}
                ${i && i.isolatedRegions > 0 ? l`
                    <p class="muted">
                        ${i.isolatedRegions} of ${i.isolatedRegions + i.colors.length - i.isolatedRegions}
                        areas touch nothing. A few is normal — real islands — but if most do, the borders in this data
                        do not share coordinates and the colouring means little.
                    </p>` : r}
            </div>
        `;
	}
	neighbourPalette(e, t) {
		return this.neighbourPalettes.get(this.settingsKey(e, t)) ?? {
			schemeName: null,
			reversed: !1,
			blindSafe: !1
		};
	}
	neighbourSchemes(e, t, n) {
		return ne(Math.min(Math.max(n, 3), 12), "qual", this.neighbourPalette(e, t));
	}
	neighbourScheme(e, t, n) {
		let r = this.neighbourSchemes(e, t, n), { schemeName: i } = this.neighbourPalette(e, t);
		return r.find((e) => e.name === i) ?? r[0] ?? null;
	}
	noNeighbourSchemeMessage(e, t, n) {
		return this.neighbourPalette(e, t).blindSafe ? `No colour-blind-safe palette has ${n} colours. Use fewer colours, or untick Colour-blind safe.` : `No palette has ${n} distinct colours.`;
	}
	updateNeighbourPalette(e, t, n) {
		let r = new Map(this.neighbourPalettes);
		r.set(this.settingsKey(e, t), {
			...this.neighbourPalette(e, t),
			...n
		}), this.neighbourPalettes = r, this.applyNeighbours(e, t, this.neighbourColors.get(this.settingsKey(e, t)) ?? Y);
	}
	renderNeighbourPalette(e, t) {
		let n = e.entry.channels[t], r = this.neighbourPalette(e, t), i = this.neighbourColors.get(this.settingsKey(e, t)) ?? (n?.driver === "neighbours" ? n.colors.length : Y), a = n?.driver === "neighbours" ? n.colors.length : null, o = this.neighbourSchemes(e, t, i), s = this.neighbourScheme(e, t, i)?.name ?? null;
		return l`
            <div class="row check-row">
                <span class="name">Palette</span>
                <div class="checks">
                    <label class="check">
                        <input type="checkbox" .checked=${r.reversed}
                               @change=${(n) => this.updateNeighbourPalette(e, t, { reversed: n.target.checked })}>
                        Reverse
                    </label>
                    <label class="check">
                        <input type="checkbox" .checked=${r.blindSafe}
                               @change=${(n) => this.updateNeighbourPalette(e, t, { blindSafe: n.target.checked })}>
                        Colour-blind safe
                    </label>
                </div>
            </div>
            ${o.length === 0 ? l`<div class="warning">
                    ${this.noNeighbourSchemeMessage(e, t, i)}
                    ${a === null ? "" : ` The map still shows the last colouring, with ${a} colours.`}
                  </div>` : l`
                    <div class="schemes">
                        ${o.map((n) => l`
                            <button class="scheme" type="button" aria-label=${n.name}
                                    aria-pressed=${n.name === s}
                                    title=${n.name}
                                    @click=${() => this.updateNeighbourPalette(e, t, { schemeName: n.name })}>
                                ${n.colors.map((e) => l`<span style=${`background:${e}`}></span>`)}
                            </button>`)}
                    </div>`}
        `;
	}
	applyKeyedNeighbours(e, t, n, r) {
		let i = x(n);
		if (!i) {
			this.message = "Nothing tells these areas apart (no id, and no columns unique together), so a colouring cannot name them.";
			return;
		}
		let a = this.neighbourScheme(e, t, r.colorCount);
		if (!a) {
			this.message = null;
			return;
		}
		let o = /* @__PURE__ */ new Map();
		n.forEach((e, t) => {
			let n = v(i, e), a = r.colors[t];
			n === null || a === void 0 || o.has(n) || o.set(n, a);
		}), this.message = null, this.setChannel(e, t, {
			driver: "neighbours",
			key: i,
			assignments: [...o],
			colors: Array.from({ length: r.colorCount }, (e, t) => a.colors[t % a.colors.length])
		});
	}
	applyNeighbours(e, t, n) {
		let r = new Map(this.neighbourColors);
		r.set(this.settingsKey(e, t), n), this.neighbourColors = r;
		let i = this.group(e.sourceId) ?? this.groups[0] ?? null, a = i?.features;
		if (!i || !a?.length) {
			this.message = "Colouring by neighbours needs the layer’s own features, and this layer has not handed them over.";
			return;
		}
		let o = fe(a, { paletteSize: n });
		if (this.lastColoring = o, !this.canWriteFeatures(e)) {
			this.applyKeyedNeighbours(e, t, a, o);
			return;
		}
		if (!this.context?.writeFeatures) return;
		if (a.forEach((e, t) => {
			let n = o.colors[t];
			n !== void 0 && (e.properties = {
				...e.properties ?? {},
				[O]: n
			});
		}), !this.context.writeFeatures(i.sourceId, a)) {
			this.message = "This layer’s data could not be added to, so the colouring has nothing the map can name.";
			return;
		}
		let s = this.neighbourScheme(e, t, o.colorCount);
		if (!s) {
			this.message = null;
			return;
		}
		this.message = null, this.setChannel(e, t, {
			driver: "neighbours",
			attribute: O,
			colors: Array.from({ length: o.colorCount }, (e, t) => s.colors[t % s.colors.length])
		});
	}
	renderChannel(e, t) {
		let n = e.entry.channels[t], i = G[t];
		if (t === "text") return this.renderTextChannel(e, n);
		if (t === "fillOutline") return this.renderFillEdge(e, n);
		if (t === "lineJoin") return this.renderCorners(e, n);
		let a = this.canClassify(t), o = a ? this.attributeDriverBlocker(e) : "Not something a column can decide", s = this.neighbourDriverBlocker(e, t), c = ["single"];
		a && c.push("attribute"), W.includes(t) && c.push("neighbours"), n && !c.includes(n.driver) && c.push(n.driver);
		let u = (e) => e === "attribute" ? o : e === "neighbours" ? s : null;
		return l`
            <div class="row">
                <span class="name">${i}</span>
                ${c.length > 1 ? l`
                    <select aria-label=${`How ${i.toLowerCase()} is decided`}
                            @change=${(n) => this.changeDriver(e, t, n.target.value)}>
                        ${c.map((e) => l`
                            <option value=${e}
                                    ?selected=${e === (n?.driver ?? "single")}
                                    ?disabled=${!!u(e)}>
                                ${Qn[e]}${u(e) ? ` — ${u(e)}` : ""}
                            </option>`)}
                    </select>` : r}
                ${this.renderChannelValue(e, t, n)}
            </div>
            ${n?.driver === "attribute" ? this.renderClassification(e, t) : r}
            ${n?.driver === "neighbours" ? this.renderNeighbours(e, t) : r}
            ${n?.driver === "zoom" ? l`
                <p class="muted">${tr(n)}</p>` : r}
            ${n && n.driver === "custom" && t !== "dash" ? l`<pre class="custom">${JSON.stringify(n.expression)}</pre>` : r}
        `;
	}
	renderClassification(e, t) {
		let n = this.settingsFor(e, t), i = this.attributesOf(e), a = this.isNumeric(e, n.attribute), o = t === "radius" || t === "textSize";
		return l`
            <div class="level4">
                ${i.length === 0 ? l`
                    <p class="muted">
                        No columns to classify by yet — the map has drawn no features of this layer here. Move to
                        where it draws, and this fills itself in.
                    </p>` : r}
                <div class="row">
                    <span class="name">Attribute</span>
                    <select aria-label="Attribute to classify by"
                            @change=${(n) => this.updateSettings(e, t, { attribute: n.target.value })}>
                        ${i.map((e) => {
			let t = !T(e.type) && e.uniqueCount >= e.presentCount && e.presentCount > 1, r = o && !T(e.type);
			return l`
                                <option value=${e.name} ?selected=${e.name === n.attribute}
                                        ?disabled=${r}>
                                    ${te(e.name, this.context?.attributeLabels)}${t ? " — a colour each" : r ? " — not a number" : ""}
                                </option>`;
		})}
                    </select>
                </div>
                ${o ? l`
                    <p class="muted">
                        Sized straight from the value — twice the value draws twice the area, which a class
                        boundary would throw away. No classes, and no legend of them.
                    </p>
                    ${t === "radius" ? l`
                        <div class="row check-row">
                            <span class="name">Zoom</span>
                            <div class="checks">
                                <label class="check">
                                    <input type="checkbox" .checked=${n.growWithZoom !== !1}
                                           @change=${(n) => this.updateSettings(e, t, { growWithZoom: n.target.checked })}>
                                    Grow with zoom
                                </label>
                            </div>
                        </div>` : r}` : a ? this.renderNumericLevel4(e, t, n) : this.renderCategoryLevel4(e, t, n)}
                ${o ? r : this.renderPalette(e, t, n)}
                ${o ? r : this.renderNoData(e, t, n)}
            </div>
        `;
	}
	renderNoData(e, t, n) {
		if (!W.includes(t)) return r;
		let i = this.isNumeric(e, n.attribute), a = n.noDataColor, o = `${e.entry.id}:${t}:nodata`;
		return l`
            <div class="row">
                <span class="name">${i ? "No value" : "No value, or not listed"}</span>
                <button class="color-button" type="button" style=${`background:${a}`}
                        aria-label=${`Colour for features with no value: ${a}`}
                        @click=${(n) => this.openPicker(o, n.currentTarget, a, (n) => this.updateSettings(e, t, { noDataColor: n }))}></button>
                <input type="text" class="grow" aria-label="What the legend calls them — leave empty to leave them out"
                       placeholder="Not in the legend"
                       .value=${e.entry.noDataLabel ?? ""}
                       @input=${(t) => this.setEntryField(e, "noDataLabel", t.target.value, { finished: !1 })}
                       @change=${(t) => this.setEntryField(e, "noDataLabel", t.target.value)}>
            </div>
        `;
	}
	renderNumericLevel4(e, t, n) {
		return l`
            <div class="row">
                <span class="name">Method</span>
                <select aria-label="How the numbers are divided"
                        title=${le[n.method]}
                        @change=${(n) => this.updateSettings(e, t, { method: n.target.value })}>
                    ${se.map((e) => l`
                        <option value=${e} ?selected=${e === n.method}>${ie[e]}</option>`)}
                </select>
            </div>
            <p class="muted">${le[n.method]}</p>
            <div class="row">
                <span class="name">Classes</span>
                <input type="range" min="2" max="9" step="1" aria-label="Number of classes"
                       .value=${String(n.classCount)}
                       @input=${(n) => this.updateSettings(e, t, { classCount: Number(n.target.value) })}>
                <span class="value">${n.classCount}</span>
            </div>
        `;
	}
	renderCategoryLevel4(e, t, n) {
		return l`
            <div class="row">
                <span class="name">Colours</span>
                <input type="range" min="2" max="12" step="1" aria-label="How many colours to use"
                       .value=${String(n.maxCategories)}
                       @input=${(n) => this.updateSettings(e, t, { maxCategories: Number(n.target.value) })}>
                <span class="value">${n.maxCategories}</span>
            </div>
        `;
	}
	renderPalette(e, t, n) {
		let r = e.entry.channels[t], i = this.isNumeric(e, n.attribute), a = i ? "seq" : "qual", o = i ? r?.driver === "attribute" && r.classification.kind !== "proportional" ? r.classification.colors.length : n.classCount : ee(this.featuresOf(e), n), s = ne(o, a, n), c = r?.driver === "attribute" ? r.schemeName : n.schemeName;
		return l`
            <div class="row check-row">
                <span class="name">Palette</span>
                <div class="checks">
                    <label class="check">
                        <input type="checkbox" .checked=${n.reversed}
                               @change=${(n) => this.updateSettings(e, t, { reversed: n.target.checked })}>
                        Reverse
                    </label>
                    <label class="check">
                        <input type="checkbox" .checked=${n.blindSafe}
                               @change=${(n) => this.updateSettings(e, t, { blindSafe: n.target.checked })}>
                        Colour-blind safe
                    </label>
                </div>
            </div>
            ${s.length === 0 ? l`<p class="muted">No palette has ${o} colours under these settings.</p>` : l`
                    <div class="schemes">
                        ${s.map((n) => l`
                            <button class="scheme" type="button" aria-label=${n.name}
                                    aria-pressed=${n.name === c}
                                    title=${n.name}
                                    @click=${() => this.updateSettings(e, t, { schemeName: n.name })}>
                                ${n.colors.map((e) => l`<span style=${`background:${e}`}></span>`)}
                            </button>`)}
                    </div>`}
        `;
	}
	renderChannelValue(e, t, n) {
		if (n?.driver === "zoom") return this.renderZoomSize(e, t, n);
		if (n && n.driver !== "single") return l`<span class="muted">${rr(n)}</span>`;
		if (W.includes(t)) return this.renderColor(e, t, n);
		if (t === "dash") return this.renderDash(e, n);
		let i = ft[t];
		if (!i) return r;
		let a = typeof n?.value == "number" ? n.value : pt[t] ?? i.min;
		return l`
            <input type="range" min=${i.min} max=${i.max} step=${i.step}
                   aria-label=${G[t]}
                   .value=${String(a)}
                   @input=${(n) => this.setChannel(e, t, {
			driver: "single",
			value: Number(n.target.value)
		})}>
            <span class="value">${t === "opacity" ? `${Math.round(a * 100)}%` : `${a}${i.unit}`}</span>
        `;
	}
	renderZoomSize(e, t, n) {
		let r = ft[t], i = this.context?.sourceControl?.getView?.()?.zoom, a = b(n, i);
		return l`
            ${r && a !== null ? l`
                <input type="range" min=${r.min} max=${r.max} step=${r.step}
                       aria-label=${`${G[t]} at this zoom`}
                       .value=${String(a)}
                       @input=${(r) => {
			let a = Number(r.target.value);
			this.setChannel(e, t, pe(n, a, i));
		}}>
                <span class="value">${er(a)}${r.unit}</span>` : l`<span class="muted">${rr(n)}</span>`}
        `;
	}
	renderColor(e, t, n) {
		let r = bt(n) ?? "#000000", i = `${e.entry.id}:${t}`;
		return l`
            <button class="color-button" type="button" style=${`background:${r}`}
                    aria-label=${`${G[t]}: ${r}`}
                    @click=${(n) => this.openPicker(i, n.currentTarget, r, (n) => this.setChannel(e, t, {
			driver: "single",
			value: n
		}))}></button>
        `;
	}
	renderDash(e, t) {
		let n = ht(t);
		return l`
            <select aria-label="Line pattern"
                    @change=${(t) => {
			let n = mt.find((e) => e.label === t.target.value);
			this.setChannel(e, "dash", n?.value ? {
				driver: "single",
				value: n.value
			} : void 0);
		}}>
                ${mt.map((e) => l`
                    <option value=${e.label} ?selected=${e.label === n}>${e.label}</option>`)}
                ${n === "Custom" ? l`<option value="Custom" selected>Custom</option>` : r}
            </select>
        `;
	}
	renderCorners(e, t) {
		let n = t?.driver === "single" && typeof t.value == "string" ? t.value : "miter";
		return l`
            <div class="row">
                <span class="name">${G.lineJoin}</span>
                <select aria-label="Corners and ends"
                        @change=${(t) => {
			let n = t.target.value === "round";
			this.setChannel(e, "lineCap", {
				driver: "single",
				value: n ? "round" : "butt"
			}, { silent: !0 }), this.setChannel(e, "lineJoin", {
				driver: "single",
				value: n ? "round" : "miter"
			});
		}}>
                    <option value="round" ?selected=${n === "round"}>Round</option>
                    <option value="miter" ?selected=${n !== "round"}>Sharp</option>
                </select>
            </div>
        `;
	}
	renderFillEdge(e, t) {
		let n = t !== void 0, i = bt(t) ?? "#000000";
		return l`
            <div class="row check-row">
                <span class="name">${G.fillOutline}</span>
                <label class="check">
                    <input type="checkbox" .checked=${n}
                           @change=${(t) => this.setChannel(e, "fillOutline", t.target.checked ? {
			driver: "single",
			value: i
		} : void 0)}>
                    Draw a 1px edge
                </label>
                ${n ? this.renderColor(e, "fillOutline", t) : r}
            </div>
            ${n ? l`<p class="muted">A thicker boundary is an Outline style of its own — add one above.</p>` : r}
        `;
	}
	renderTextChannel(e, t) {
		let n = ((this.group(e.sourceId) ?? this.groups[0] ?? null)?.attributes ?? []).map((e) => e.name), i = gt(t), a = t && !i;
		return l`
            <div class="row">
                <span class="name">${G.text}</span>
                ${a ? l`<span class="muted">a custom expression</span>` : l`
                        <select aria-label="Label text"
                                @change=${(t) => {
			let n = t.target.value;
			this.setChannel(e, "text", n ? _t(n) : void 0);
		}}>
                            <option value="">None</option>
                            ${n.map((e) => l`
                                <option value=${e} ?selected=${e === i}>${e}</option>`)}
                        </select>`}
            </div>
            ${a ? l`<pre class="custom">${JSON.stringify(t.driver === "custom" ? t.expression : t)}</pre>` : r}
        `;
	}
	renderMoreToggle(e) {
		if (e.entry.role !== "label" || !Pn(this.context?.engine)) return r;
		let t = this.moreOpen.has(e.entry.id), n = Gn(e.entry);
		return l`
            <button type="button" class=${n ? "more-toggle overridden" : "more-toggle"}
                    aria-expanded=${t ? "true" : "false"}
                    aria-label=${n ? "Font, placement and overlap (changed)" : "Font, placement and overlap"}
                    title="Font, placement and overlap"
                    @click=${() => {
			let n = new Set(this.moreOpen);
			t ? n.delete(e.entry.id) : n.add(e.entry.id), this.moreOpen = n;
		}}>${t ? "show less" : "show more..."}</button>
            ${t ? this.renderLabelMore(e) : r}
        `;
	}
	renderLabelMore(e) {
		let { font: t, placement: n, anchor: i, offset: a, allowOverlap: o } = e.entry.channels, s = Rn((this.group(e.sourceId) ?? this.groups[0] ?? null)?.geometryTypes ?? []), c = zn(n), u = Un(i, a);
		return l`
            <div class="level4">
                ${this.renderFont(e, t)}
                ${s.length > 0 || c !== "point" ? l`
                    <div class="row">
                        <span class="name">${G.placement}</span>
                        ${c === null ? l`<span class="muted">a custom expression</span>` : l`
                                <select aria-label="Where the label sits"
                                        @change=${(t) => {
			let n = t.target.value;
			this.setChannel(e, "placement", n === "point" ? void 0 : {
				driver: "single",
				value: n
			});
		}}>
                                    ${s.map((e) => l`
                                        <option value=${e.value} ?selected=${e.value === c}>${e.label}</option>`)}
                                    ${s.some((e) => e.value === c) ? r : l`<option value=${c} selected>${c}</option>`}
                                </select>`}
                    </div>` : r}
                ${c === "point" ? this.renderPosition(e, u) : r}
                <div class="row check-row">
                    <span class="name">${G.allowOverlap}</span>
                    <label class="check">
                        <input type="checkbox"
                               .checked=${o?.driver === "single" && o.value === !0}
                               ?disabled=${o !== void 0 && o.driver !== "single"}
                               @change=${(t) => this.setChannel(e, "allowOverlap", t.target.checked ? {
			driver: "single",
			value: !0
		} : void 0)}>
                        Draw every label, even where they collide
                    </label>
                </div>
            </div>
        `;
	}
	renderFont(e, t) {
		if (t && !Ln(t)) return l`
                <div class="row">
                    <span class="name">${G.font}</span>
                    <span class="muted">a custom expression</span>
                </div>`;
		let n = Ln(t), i = this.context?.fontStacks?.() ?? [], a = n && !i.some((e) => e[0] === n[0]) ? [n, ...i] : i;
		return l`
            <div class="row">
                <span class="name">${G.font}</span>
                <select aria-label="Label font"
                        @change=${(t) => {
			let n = a[Number(t.target.value)];
			this.setChannel(e, "font", n ? {
				driver: "single",
				value: n
			} : void 0);
		}}>
                    <option value="-1" ?selected=${!n}>Map default</option>
                    ${a.map((e, t) => l`
                        <option value=${String(t)} ?selected=${n?.[0] === e[0]}>${e[0]}</option>`)}
                </select>
            </div>
            ${a.length === 0 ? l`
                <p class="muted">
                    No other layer on this map names a font. A face the map cannot draw shows no text at all, so only
                    the default is offered.
                </p>` : r}
        `;
	}
	renderPosition(e, t) {
		if (!t) return l`
                <div class="row">
                    <span class="name">${G.anchor}</span>
                    <span class="muted">set in the layer in a way this control cannot show</span>
                </div>`;
		let n = (t) => {
			let { anchor: n, offset: r } = Wn(t);
			this.setChannel(e, "offset", r, { silent: !0 }), this.setChannel(e, "anchor", n);
		}, i = t.direction === "center" ? 0 : t.distance;
		return l`
            <div class="row">
                <span class="name">${G.anchor}</span>
                <select aria-label="Which side of the point"
                        @change=${(e) => n({
			direction: e.target.value,
			distance: t.direction === "center" ? .5 : t.distance
		})}>
                    ${Object.keys(Bn).map((e) => l`
                        <option value=${e} ?selected=${e === t.direction}>${Bn[e]}</option>`)}
                </select>
            </div>
            ${t.direction === "center" ? r : l`
                <div class="row">
                    <span class="name">${G.offset}</span>
                    <input type="range" min="0" max="3" step="0.25" aria-label="Distance from the point"
                           .value=${String(i)}
                           @input=${(e) => n({
			direction: t.direction,
			distance: Number(e.target.value)
		})}>
                    <span class="value">${i} em</span>
                </div>`}
        `;
	}
	changeDriver(e, t, n) {
		if (n === "attribute") {
			this.applyClassification(e, t, this.settingsFor(e, t));
			return;
		}
		if (n === "neighbours") {
			this.applyNeighbours(e, t, this.neighbourColors.get(this.settingsKey(e, t)) ?? Y);
			return;
		}
		if (n !== "single") return;
		let r = Tt(e.entry.role, e.entry.id).channels[t];
		this.setChannel(e, t, r ?? {
			driver: "single",
			value: "#000000"
		});
	}
	openPicker(e, t, n, r) {
		let i = this.pickers.get(e);
		if (i && i.button === t) {
			i.instance.setColor(n);
			return;
		}
		i?.instance.destroy();
		let a = Le({
			button: t,
			value: n,
			paintButton: !1,
			onChange: r
		});
		this.pickers.set(e, {
			button: t,
			instance: a
		}), a.show();
	}
	destroyPickers() {
		for (let e of this.pickers.values()) e.instance.destroy();
		this.pickers.clear();
	}
};
d([n({
	type: Boolean,
	reflect: !0
})], X.prototype, "visible", void 0), d([o()], X.prototype, "panelTitle", void 0), d([o()], X.prototype, "list", void 0), d([o()], X.prototype, "groups", void 0), d([o()], X.prototype, "sourceId", void 0), d([o()], X.prototype, "expandedId", void 0), d([o()], X.prototype, "layerOpacity", void 0), d([o()], X.prototype, "filterText", void 0), d([o()], X.prototype, "message", void 0), d([o()], X.prototype, "wmsStyles", void 0), d([o()], X.prototype, "wmsStyle", void 0), d([o()], X.prototype, "wmsLoading", void 0), d([o()], X.prototype, "sldProbe", void 0), d([o()], X.prototype, "sldProbing", void 0), d([o()], X.prototype, "sldAttributes", void 0), d([o()], X.prototype, "sldLoadingValues", void 0), d([o()], X.prototype, "sldDraft", void 0), d([o()], X.prototype, "sldApplied", void 0), d([o()], X.prototype, "sldClasses", void 0), d([o()], X.prototype, "sldProblem", void 0), d([o()], X.prototype, "sldVerifying", void 0), d([o()], X.prototype, "classifySettings", void 0), d([o()], X.prototype, "neighbourColors", void 0), d([o()], X.prototype, "neighbourPalettes", void 0), d([o()], X.prototype, "lastColoring", void 0), d([o()], X.prototype, "moreOpen", void 0), d([o()], X.prototype, "textDrafts", void 0), X = d([c("webmapx-layer-styler")], X);
function $n(e) {
	return e.length === 0 ? "background:transparent" : e.length === 1 ? `background:${e[0]}` : `background:linear-gradient(90deg, ${e.map((t, n) => `${t} ${n / e.length * 100}%, ${t} ${(n + 1) / e.length * 100}%`).join(", ")})`;
}
function er(e) {
	return Number(e.toFixed(1));
}
function tr(e) {
	let t = e.scale ?? 1;
	return `Grows with zoom: ${e.stops.map(([e, n]) => `${er(n * t)}px at z${e}`).join(", ")}. Between and beyond those, it follows the line.`;
}
function nr(e) {
	let t = e.stops.map(([, t]) => t * (e.scale ?? 1)), n = Math.min(...t), r = Math.max(...t);
	return n === r ? `${n}px` : `${n}–${r}px by zoom`;
}
function rr(e) {
	if (e.driver === "neighbours") return "no two neighbours alike";
	if (e.driver === "custom") return "a custom expression";
	if (e.driver === "single") return String(e.value);
	if (e.driver === "zoom") return nr(e);
	let t = e.classification;
	if (t.kind === "proportional") return `sized by ${e.attribute}${t.zoomFactor ? ", grows with zoom" : ""}`;
	let n = t.kind === "ranges" ? t.colors.length : t.values.length, r = t.kind === "ranges" ? "classes" : "categories";
	return `${e.attribute}, ${n} ${r}`;
}
//#endregion
//#region src/components/webmapx-save-layers-dialog.ts
var Z, ir = 7, ar = 10 ** ir;
function or(e) {
	return typeof e == "number" ? Math.round(e * ar) / ar : Array.isArray(e) ? e.map(or) : e;
}
function sr(e) {
	return e.type === "GeometryCollection" ? {
		...e,
		geometries: e.geometries.map(sr)
	} : {
		...e,
		coordinates: or(e.coordinates)
	};
}
function cr(e, t) {
	return typeof e == "string" ? e : JSON.stringify(t ? {
		...e,
		features: e.features.map((e) => e.geometry ? {
			...e,
			geometry: sr(e.geometry)
		} : e)
	} : e);
}
var lr = "map-layers", Q = class extends u {
	static {
		Z = this;
	}
	constructor(...e) {
		super(...e), this.items = [], this.filename = lr, this.includeStyle = !0, this.zip = !0, this.roundCoordinates = !0, this.filenameEdited = !1;
	}
	static {
		this.styles = [
			h,
			j,
			a`
        :host { display: block; }

        sl-dialog::part(panel) {
            min-width: min(420px, 90vw);
            max-width: min(520px, 90vw);
        }

        .layer-list {
            display: flex;
            flex-direction: column;
            gap: var(--webmapx-space-xs, 0.4rem);
            max-height: 40vh;
            overflow-y: auto;
            margin-bottom: var(--webmapx-space-md, 0.75rem);
        }

        .layer-row sl-checkbox::part(label) {
            display: flex;
            align-items: center;
            gap: var(--webmapx-space-xs, 0.4rem);
        }

        .unsupported {
            color: var(--color-text-muted, #6b7681);
            font-size: var(--webmapx-font-size-sm, 0.8rem);
        }

        .external-hint {
            color: var(--color-text-muted, #6b7681);
            font-size: var(--webmapx-font-size-sm, 0.8rem);
        }

        .options {
            display: flex;
            flex-direction: column;
            gap: var(--webmapx-space-sm, 0.5rem);
            margin-top: var(--webmapx-space-md, 0.75rem);
        }

        .footer {
            display: flex;
            justify-content: flex-end;
            gap: var(--webmapx-space-sm, 0.5rem);
            margin-top: var(--webmapx-space-lg, 1rem);
        }
    `
		];
	}
	open(e, t) {
		Te(this), this.items = e.map((e) => {
			let n = e.sourceData ?? (e.sourceId ? t?.getSourceData(e.sourceId) ?? null : null), r = n !== null || e.sourceConfig != null;
			return {
				...e,
				data: n,
				checked: r
			};
		}), this.filenameEdited = !1, this.syncFilenameToSelection(), this.includeStyle = !0, this.zip = !0, this.roundCoordinates = !0, this.dialog?.show();
	}
	close() {
		this.dialog?.hide();
	}
	get selectedItems() {
		return this.items.filter((e) => e.checked && (e.data !== null || e.sourceConfig != null));
	}
	get singleFileEligible() {
		return this.selectedItems.length === 1 && !this.includeStyle;
	}
	toggleItem(e, t) {
		this.items = this.items.map((n) => n.layerId === e ? {
			...n,
			checked: t
		} : n), this.syncFilenameToSelection();
	}
	syncFilenameToSelection() {
		if (this.filenameEdited) return;
		let e = this.selectedItems;
		this.filename = e.length === 1 ? Z.sanitizeFileBase(e[0].label ?? e[0].layerId) : lr;
	}
	static sanitizeFileBase(e) {
		return e.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "layer";
	}
	buildFileBases(e) {
		let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Set();
		for (let r of e) {
			let e = Z.sanitizeFileBase(r.label ?? r.layerId), i = e, a = 2;
			for (; n.has(i);) i = `${e}_${a++}`;
			n.add(i), t.set(r.layerId, i);
		}
		return t;
	}
	buildStyleConfig(e, t) {
		let n = {}, r = [], i = e.layerId;
		return e.data === null && e.sourceConfig != null ? n[i] = e.sourceConfig : n[i] = {
			type: "geojson",
			data: `${t}.geojson`
		}, Array.isArray(e.sublayers) && e.sublayers.length > 0 ? e.sublayers.forEach((t, n) => {
			let a = t, o = a.metadata && typeof a.metadata == "object" ? a.metadata : {}, s = String(a.id ?? ""), c = typeof o.label == "string" && o.label.length > 0 ? o.label : s.replace(/^[^:]*:/, "").replace(/-/g, " ");
			r.push({
				...a,
				id: s || `${e.layerId}_${n}`,
				source: i,
				metadata: {
					...o,
					label: c
				}
			});
		}) : r.push({
			id: e.layerId,
			type: e.layerType ?? "fill",
			source: i,
			metadata: { label: e.label },
			...e.paint ? { paint: e.paint } : {}
		}), {
			version: 8,
			id: e.layerId,
			title: e.label,
			sources: n,
			layers: r
		};
	}
	async handleDownload() {
		let e = this.selectedItems;
		if (e.length === 0) return;
		let t = (this.filenameInput?.value ?? this.filename).trim() || lr;
		if (this.singleFileEligible && !this.zip) {
			let n = e[0], r = cr(n.data, this.roundCoordinates);
			this.downloadBlob(new Blob([r], { type: "application/geo+json" }), `${t}.geojson`), this.close();
			return;
		}
		let n = [...e].reverse(), r = this.buildFileBases(n), i = new ke(new m("application/zip"));
		for (let e of n) {
			let t = e.data === null && e.sourceConfig != null;
			if (!t) {
				let t = cr(e.data, this.roundCoordinates);
				await i.add(`${r.get(e.layerId)}.geojson`, new p(t));
			}
			if (this.includeStyle || t) {
				let t = this.buildStyleConfig(e, r.get(e.layerId));
				await i.add(`${r.get(e.layerId)}_style.json`, new p(JSON.stringify(t, null, 2)));
			}
		}
		this.downloadBlob(await i.close(), `${t}.zip`), this.close();
	}
	downloadBlob(e, t) {
		let n = URL.createObjectURL(e), r = document.createElement("a");
		r.href = n, r.download = t, r.click(), URL.revokeObjectURL(n);
	}
	render() {
		let e = this.selectedItems.length, t = this.singleFileEligible;
		return M(l`
                <sl-dialog label="Save layer(s)"
                           @sl-request-close=${(e) => {
			e.detail?.source === "overlay" && this.close();
		}}>
                    <div class="layer-list">
                        ${this.items.map((e) => l`
                            <div class="layer-row">
                                <sl-checkbox
                                    ?checked=${e.checked}
                                    ?disabled=${e.data === null && e.sourceConfig == null}
                                    @sl-change=${(t) => this.toggleItem(e.layerId, t.target.checked)}
                                >
                                    ${e.label}
                                    ${e.data === null && e.sourceConfig == null ? l`<span class="unsupported">(no exportable data)</span>` : null}
                                    ${e.data === null && e.sourceConfig != null ? l`<span class="external-hint">(style only)</span>` : null}
                                </sl-checkbox>
                            </div>
                        `)}
                    </div>

                    <sl-input class="filename-input" label="Filename" .value=${this.filename}
                              @sl-input=${(e) => {
			this.filename = e.target.value, this.filenameEdited = !0;
		}}>
                    </sl-input>

                    <div class="options">
                        <sl-checkbox ?checked=${this.includeStyle}
                                      @sl-change=${(e) => {
			this.includeStyle = e.target.checked;
		}}>
                            Include style
                        </sl-checkbox>
                        <sl-checkbox ?checked=${this.roundCoordinates}
                                      @sl-change=${(e) => {
			this.roundCoordinates = e.target.checked;
		}}>
                            Round coordinates to ${ir} decimals (about 5 cm)
                        </sl-checkbox>
                        ${t ? l`
                            <sl-checkbox ?checked=${this.zip}
                                          @sl-change=${(e) => {
			this.zip = e.target.checked;
		}}>
                                Save as .zip
                            </sl-checkbox>
                        ` : null}
                    </div>

                    <div slot="footer" class="footer">
                        <sl-button autofocus @click=${this.close}>Cancel</sl-button>
                        <sl-button variant="primary" ?disabled=${e === 0} @click=${() => this.handleDownload()}>
                            Download
                        </sl-button>
                    </div>
                </sl-dialog>
        `);
	}
};
d([o()], Q.prototype, "items", void 0), d([o()], Q.prototype, "filename", void 0), d([o()], Q.prototype, "includeStyle", void 0), d([o()], Q.prototype, "zip", void 0), d([o()], Q.prototype, "roundCoordinates", void 0), d([s("sl-dialog")], Q.prototype, "dialog", void 0), d([s(".filename-input")], Q.prototype, "filenameInput", void 0), Q = Z = d([c("webmapx-save-layers-dialog")], Q);
//#endregion
//#region src/components/webmapx-permalink-dialog.ts
var $ = class extends u {
	constructor(...e) {
		super(...e), this.url = "", this.hasConfig = !1, this.dynamicLayerIds = [], this.copied = !1;
	}
	static {
		this.styles = [
			h,
			j,
			a`
        :host { display: block; }

        sl-dialog::part(panel) {
            min-width: min(480px, 90vw);
            max-width: min(620px, 90vw);
        }

        .url-box {
            font-family: var(--sl-font-mono);
            font-size: var(--webmapx-font-size-sm, 0.78rem);
            background: var(--color-background-secondary, #f4f6f8);
            border: 1px solid var(--color-border, #d5dce3);
            border-radius: var(--sl-border-radius-medium);
            padding: var(--webmapx-space-sm, 0.5rem) var(--webmapx-space-md, 0.75rem);
            word-break: break-all;
            margin-bottom: var(--webmapx-space-md, 0.75rem);
            user-select: all;
            line-height: 1.5;
        }

        .warning {
            display: flex;
            align-items: flex-start;
            gap: var(--webmapx-space-xs, 0.4rem);
            font-size: var(--webmapx-font-size-md, 0.85rem);
            color: var(--sl-color-warning-800);
            background: var(--sl-color-warning-50);
            border: 1px solid var(--sl-color-warning-200);
            border-radius: var(--sl-border-radius-medium);
            padding: var(--webmapx-space-sm, 0.5rem) var(--webmapx-space-sm, 0.65rem);
            margin-bottom: var(--webmapx-space-md, 0.75rem);
        }

        .warning sl-icon {
            flex-shrink: 0;
            margin-top: 0.1rem;
        }
    `
		];
	}
	open(e, t, n = []) {
		Te(this), this.url = e, this.hasConfig = t, this.dynamicLayerIds = n, this.copied = !1, this.dialog.show();
	}
	async handleCopy() {
		await navigator.clipboard.writeText(this.url), this.copied = !0, setTimeout(() => {
			this.copied = !1;
		}, 2e3);
	}
	render() {
		return M(l`
                <sl-dialog label="Permalink">
                    ${this.dynamicLayerIds.length > 0 ? l`
                        <div class="warning">
                            <sl-icon name="exclamation-triangle"></sl-icon>
                            <span>
                                <strong>${this.dynamicLayerIds.length} imported layer${this.dynamicLayerIds.length > 1 ? "s" : ""} will not restore</strong>
                                — layers added from files (${this.dynamicLayerIds.join(", ")}) are not stored in the permalink.
                                Recipients will see those layers missing.
                            </span>
                        </div>
                    ` : null}
                    ${this.hasConfig ? null : l`
                        <div class="warning">
                            <sl-icon name="exclamation-triangle"></sl-icon>
                            <span>Config was not loaded from a URL — layer state may not restore for recipients using a different config.</span>
                        </div>
                    `}
                    <div class="url-box">${this.url}</div>
                    <div slot="footer" style="display:flex;gap:0.5rem;justify-content:flex-end">
                        <sl-button @click=${() => this.dialog.hide()}>Close</sl-button>
                        <sl-button variant="primary" @click=${this.handleCopy}>
                            <sl-icon slot="prefix" name=${this.copied ? "check2" : "clipboard"}></sl-icon>
                            ${this.copied ? "Copied!" : "Copy to clipboard"}
                        </sl-button>
                    </div>
                </sl-dialog>
        `);
	}
};
d([o()], $.prototype, "url", void 0), d([o()], $.prototype, "hasConfig", void 0), d([o()], $.prototype, "dynamicLayerIds", void 0), d([o()], $.prototype, "copied", void 0), d([s("sl-dialog")], $.prototype, "dialog", void 0), $ = d([c("webmapx-permalink-dialog")], $);
//#endregion
//#region src/components/webmapx-clear-layers-dialog.ts
var ur = class extends u {
	static {
		this.styles = [j, a`
        :host { display: block; }
    `];
	}
	open() {
		Te(this), this.dialog.show();
	}
	hide() {
		this.dialog?.hide();
	}
	handleConfirm() {
		this.dispatchEvent(new CustomEvent("webmapx-clear-layers-confirm", {
			bubbles: !0,
			composed: !0
		}));
	}
	render() {
		return M(l`
                <sl-dialog label="Alle kaartlagen wissen">
                    <p>Dit wist alle kaartlagen uit 'actieve lagen'. Sla zelfgemaakte lagen eerst op. Je kunt bestaande lagen weer openen via de kaartlagen knop.</p>
                    <sl-button slot="footer" variant="default" @click=${() => this.hide()}>Annuleren</sl-button>
                    <sl-button slot="footer" variant="danger" @click=${() => this.handleConfirm()}>Wissen</sl-button>
                </sl-dialog>
        `);
	}
};
d([s("sl-dialog")], ur.prototype, "dialog", void 0), ur = d([c("webmapx-clear-layers-dialog")], ur);
//#endregion
export { je as n, Fn as t };
