import { a as e, h as t, n, p as r } from "./decorators-d8E4nZJy.js";
import { a as i, c as a, i as o, l as s, s as c } from "./directive-helpers-Debt3Tx3.js";
import { r as l } from "./chunk.NYIIDP5N-gftugmWL.js";
import { t as u } from "./chunk.6CTB5ZDJ-DjZrBd6Y.js";
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.3KSWVBQ5.js
var d = t`
  :host {
    --arrow-color: var(--sl-color-neutral-1000);
    --arrow-size: 6px;

    /*
     * These properties are computed to account for the arrow's dimensions after being rotated 45º. The constant
     * 0.7071 is derived from sin(45), which is the diagonal size of the arrow's container after rotating.
     */
    --arrow-size-diagonal: calc(var(--arrow-size) * 0.7071);
    --arrow-padding-offset: calc(var(--arrow-size-diagonal) - var(--arrow-size));

    display: contents;
  }

  .popup {
    position: absolute;
    isolation: isolate;
    max-width: var(--auto-size-available-width, none);
    max-height: var(--auto-size-available-height, none);
  }

  .popup--fixed {
    position: fixed;
  }

  .popup:not(.popup--active) {
    display: none;
  }

  .popup__arrow {
    position: absolute;
    width: calc(var(--arrow-size-diagonal) * 2);
    height: calc(var(--arrow-size-diagonal) * 2);
    rotate: 45deg;
    background: var(--arrow-color);
    z-index: -1;
  }

  /* Hover bridge */
  .popup-hover-bridge:not(.popup-hover-bridge--visible) {
    display: none;
  }

  .popup-hover-bridge {
    position: fixed;
    z-index: calc(var(--sl-z-index-dropdown) - 1);
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    clip-path: polygon(
      var(--hover-bridge-top-left-x, 0) var(--hover-bridge-top-left-y, 0),
      var(--hover-bridge-top-right-x, 0) var(--hover-bridge-top-right-y, 0),
      var(--hover-bridge-bottom-right-x, 0) var(--hover-bridge-bottom-right-y, 0),
      var(--hover-bridge-bottom-left-x, 0) var(--hover-bridge-bottom-left-y, 0)
    );
  }
`, f = Math.min, p = Math.max, m = Math.round, h = Math.floor, g = (e) => ({
	x: e,
	y: e
}), _ = {
	left: "right",
	right: "left",
	bottom: "top",
	top: "bottom"
}, v = {
	start: "end",
	end: "start"
};
function y(e, t, n) {
	return p(e, f(t, n));
}
function b(e, t) {
	return typeof e == "function" ? e(t) : e;
}
function x(e) {
	return e.split("-")[0];
}
function S(e) {
	return e.split("-")[1];
}
function C(e) {
	return e === "x" ? "y" : "x";
}
function w(e) {
	return e === "y" ? "height" : "width";
}
var T = /*#__PURE__*/ new Set(["top", "bottom"]);
function E(e) {
	return T.has(x(e)) ? "y" : "x";
}
function D(e) {
	return C(E(e));
}
function O(e, t, n) {
	n === void 0 && (n = !1);
	let r = S(e), i = D(e), a = w(i), o = i === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
	return t.reference[a] > t.floating[a] && (o = F(o)), [o, F(o)];
}
function k(e) {
	let t = F(e);
	return [
		A(e),
		t,
		A(t)
	];
}
function A(e) {
	return e.replace(/start|end/g, (e) => v[e]);
}
var j = ["left", "right"], M = ["right", "left"], ee = ["top", "bottom"], N = ["bottom", "top"];
function te(e, t, n) {
	switch (e) {
		case "top":
		case "bottom": return n ? t ? M : j : t ? j : M;
		case "left":
		case "right": return t ? ee : N;
		default: return [];
	}
}
function P(e, t, n, r) {
	let i = S(e), a = te(x(e), n === "start", r);
	return i && (a = a.map((e) => e + "-" + i), t && (a = a.concat(a.map(A)))), a;
}
function F(e) {
	return e.replace(/left|right|bottom|top/g, (e) => _[e]);
}
function I(e) {
	return {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		...e
	};
}
function ne(e) {
	return typeof e == "number" ? {
		top: e,
		right: e,
		bottom: e,
		left: e
	} : I(e);
}
function L(e) {
	let { x: t, y: n, width: r, height: i } = e;
	return {
		width: r,
		height: i,
		top: n,
		left: t,
		right: t + r,
		bottom: n + i,
		x: t,
		y: n
	};
}
//#endregion
//#region node_modules/@floating-ui/core/dist/floating-ui.core.mjs
function re(e, t, n) {
	let { reference: r, floating: i } = e, a = E(t), o = D(t), s = w(o), c = x(t), l = a === "y", u = r.x + r.width / 2 - i.width / 2, d = r.y + r.height / 2 - i.height / 2, f = r[s] / 2 - i[s] / 2, p;
	switch (c) {
		case "top":
			p = {
				x: u,
				y: r.y - i.height
			};
			break;
		case "bottom":
			p = {
				x: u,
				y: r.y + r.height
			};
			break;
		case "right":
			p = {
				x: r.x + r.width,
				y: d
			};
			break;
		case "left":
			p = {
				x: r.x - i.width,
				y: d
			};
			break;
		default: p = {
			x: r.x,
			y: r.y
		};
	}
	switch (S(t)) {
		case "start":
			p[o] -= f * (n && l ? -1 : 1);
			break;
		case "end":
			p[o] += f * (n && l ? -1 : 1);
			break;
	}
	return p;
}
var ie = async (e, t, n) => {
	let { placement: r = "bottom", strategy: i = "absolute", middleware: a = [], platform: o } = n, s = a.filter(Boolean), c = await (o.isRTL == null ? void 0 : o.isRTL(t)), l = await o.getElementRects({
		reference: e,
		floating: t,
		strategy: i
	}), { x: u, y: d } = re(l, r, c), f = r, p = {}, m = 0;
	for (let n = 0; n < s.length; n++) {
		let { name: a, fn: h } = s[n], { x: g, y: _, data: v, reset: y } = await h({
			x: u,
			y: d,
			initialPlacement: r,
			placement: f,
			strategy: i,
			middlewareData: p,
			rects: l,
			platform: o,
			elements: {
				reference: e,
				floating: t
			}
		});
		u = g ?? u, d = _ ?? d, p = {
			...p,
			[a]: {
				...p[a],
				...v
			}
		}, y && m <= 50 && (m++, typeof y == "object" && (y.placement && (f = y.placement), y.rects && (l = y.rects === !0 ? await o.getElementRects({
			reference: e,
			floating: t,
			strategy: i
		}) : y.rects), {x: u, y: d} = re(l, f, c)), n = -1);
	}
	return {
		x: u,
		y: d,
		placement: f,
		strategy: i,
		middlewareData: p
	};
};
async function ae(e, t) {
	t === void 0 && (t = {});
	let { x: n, y: r, platform: i, rects: a, elements: o, strategy: s } = e, { boundary: c = "clippingAncestors", rootBoundary: l = "viewport", elementContext: u = "floating", altBoundary: d = !1, padding: f = 0 } = b(t, e), p = ne(f), m = o[d ? u === "floating" ? "reference" : "floating" : u], h = L(await i.getClippingRect({
		element: await (i.isElement == null ? void 0 : i.isElement(m)) ?? !0 ? m : m.contextElement || await (i.getDocumentElement == null ? void 0 : i.getDocumentElement(o.floating)),
		boundary: c,
		rootBoundary: l,
		strategy: s
	})), g = u === "floating" ? {
		x: n,
		y: r,
		width: a.floating.width,
		height: a.floating.height
	} : a.reference, _ = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(o.floating)), v = await (i.isElement == null ? void 0 : i.isElement(_)) && await (i.getScale == null ? void 0 : i.getScale(_)) || {
		x: 1,
		y: 1
	}, y = L(i.convertOffsetParentRelativeRectToViewportRelativeRect ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
		elements: o,
		rect: g,
		offsetParent: _,
		strategy: s
	}) : g);
	return {
		top: (h.top - y.top + p.top) / v.y,
		bottom: (y.bottom - h.bottom + p.bottom) / v.y,
		left: (h.left - y.left + p.left) / v.x,
		right: (y.right - h.right + p.right) / v.x
	};
}
var oe = (e) => ({
	name: "arrow",
	options: e,
	async fn(t) {
		let { x: n, y: r, placement: i, rects: a, platform: o, elements: s, middlewareData: c } = t, { element: l, padding: u = 0 } = b(e, t) || {};
		if (l == null) return {};
		let d = ne(u), p = {
			x: n,
			y: r
		}, m = D(i), h = w(m), g = await o.getDimensions(l), _ = m === "y", v = _ ? "top" : "left", x = _ ? "bottom" : "right", C = _ ? "clientHeight" : "clientWidth", T = a.reference[h] + a.reference[m] - p[m] - a.floating[h], E = p[m] - a.reference[m], O = await (o.getOffsetParent == null ? void 0 : o.getOffsetParent(l)), k = O ? O[C] : 0;
		(!k || !await (o.isElement == null ? void 0 : o.isElement(O))) && (k = s.floating[C] || a.floating[h]);
		let A = T / 2 - E / 2, j = k / 2 - g[h] / 2 - 1, M = f(d[v], j), ee = f(d[x], j), N = M, te = k - g[h] - ee, P = k / 2 - g[h] / 2 + A, F = y(N, P, te), I = !c.arrow && S(i) != null && P !== F && a.reference[h] / 2 - (P < N ? M : ee) - g[h] / 2 < 0, L = I ? P < N ? P - N : P - te : 0;
		return {
			[m]: p[m] + L,
			data: {
				[m]: F,
				centerOffset: P - F - L,
				...I && { alignmentOffset: L }
			},
			reset: I
		};
	}
}), se = function(e) {
	return e === void 0 && (e = {}), {
		name: "flip",
		options: e,
		async fn(t) {
			var n;
			let { placement: r, middlewareData: i, rects: a, initialPlacement: o, platform: s, elements: c } = t, { mainAxis: l = !0, crossAxis: u = !0, fallbackPlacements: d, fallbackStrategy: f = "bestFit", fallbackAxisSideDirection: p = "none", flipAlignment: m = !0, ...h } = b(e, t);
			if ((n = i.arrow) != null && n.alignmentOffset) return {};
			let g = x(r), _ = E(o), v = x(o) === o, y = await (s.isRTL == null ? void 0 : s.isRTL(c.floating)), S = d || (v || !m ? [F(o)] : k(o)), C = p !== "none";
			!d && C && S.push(...P(o, m, p, y));
			let w = [o, ...S], T = await ae(t, h), D = [], A = i.flip?.overflows || [];
			if (l && D.push(T[g]), u) {
				let e = O(r, a, y);
				D.push(T[e[0]], T[e[1]]);
			}
			if (A = [...A, {
				placement: r,
				overflows: D
			}], !D.every((e) => e <= 0)) {
				let e = (i.flip?.index || 0) + 1, t = w[e];
				if (t && (!(u === "alignment" && _ !== E(t)) || A.every((e) => E(e.placement) === _ ? e.overflows[0] > 0 : !0))) return {
					data: {
						index: e,
						overflows: A
					},
					reset: { placement: t }
				};
				let n = A.filter((e) => e.overflows[0] <= 0).sort((e, t) => e.overflows[1] - t.overflows[1])[0]?.placement;
				if (!n) switch (f) {
					case "bestFit": {
						let e = A.filter((e) => {
							if (C) {
								let t = E(e.placement);
								return t === _ || t === "y";
							}
							return !0;
						}).map((e) => [e.placement, e.overflows.filter((e) => e > 0).reduce((e, t) => e + t, 0)]).sort((e, t) => e[1] - t[1])[0]?.[0];
						e && (n = e);
						break;
					}
					case "initialPlacement":
						n = o;
						break;
				}
				if (r !== n) return { reset: { placement: n } };
			}
			return {};
		}
	};
}, ce = /*#__PURE__*/ new Set(["left", "top"]);
async function le(e, t) {
	let { placement: n, platform: r, elements: i } = e, a = await (r.isRTL == null ? void 0 : r.isRTL(i.floating)), o = x(n), s = S(n), c = E(n) === "y", l = ce.has(o) ? -1 : 1, u = a && c ? -1 : 1, d = b(t, e), { mainAxis: f, crossAxis: p, alignmentAxis: m } = typeof d == "number" ? {
		mainAxis: d,
		crossAxis: 0,
		alignmentAxis: null
	} : {
		mainAxis: d.mainAxis || 0,
		crossAxis: d.crossAxis || 0,
		alignmentAxis: d.alignmentAxis
	};
	return s && typeof m == "number" && (p = s === "end" ? m * -1 : m), c ? {
		x: p * u,
		y: f * l
	} : {
		x: f * l,
		y: p * u
	};
}
var ue = function(e) {
	return e === void 0 && (e = 0), {
		name: "offset",
		options: e,
		async fn(t) {
			var n;
			let { x: r, y: i, placement: a, middlewareData: o } = t, s = await le(t, e);
			return a === o.offset?.placement && (n = o.arrow) != null && n.alignmentOffset ? {} : {
				x: r + s.x,
				y: i + s.y,
				data: {
					...s,
					placement: a
				}
			};
		}
	};
}, de = function(e) {
	return e === void 0 && (e = {}), {
		name: "shift",
		options: e,
		async fn(t) {
			let { x: n, y: r, placement: i } = t, { mainAxis: a = !0, crossAxis: o = !1, limiter: s = { fn: (e) => {
				let { x: t, y: n } = e;
				return {
					x: t,
					y: n
				};
			} }, ...c } = b(e, t), l = {
				x: n,
				y: r
			}, u = await ae(t, c), d = E(x(i)), f = C(d), p = l[f], m = l[d];
			if (a) {
				let e = f === "y" ? "top" : "left", t = f === "y" ? "bottom" : "right", n = p + u[e], r = p - u[t];
				p = y(n, p, r);
			}
			if (o) {
				let e = d === "y" ? "top" : "left", t = d === "y" ? "bottom" : "right", n = m + u[e], r = m - u[t];
				m = y(n, m, r);
			}
			let h = s.fn({
				...t,
				[f]: p,
				[d]: m
			});
			return {
				...h,
				data: {
					x: h.x - n,
					y: h.y - r,
					enabled: {
						[f]: a,
						[d]: o
					}
				}
			};
		}
	};
}, fe = function(e) {
	return e === void 0 && (e = {}), {
		name: "size",
		options: e,
		async fn(t) {
			var n, r;
			let { placement: i, rects: a, platform: o, elements: s } = t, { apply: c = () => {}, ...l } = b(e, t), u = await ae(t, l), d = x(i), m = S(i), h = E(i) === "y", { width: g, height: _ } = a.floating, v, y;
			d === "top" || d === "bottom" ? (v = d, y = m === (await (o.isRTL == null ? void 0 : o.isRTL(s.floating)) ? "start" : "end") ? "left" : "right") : (y = d, v = m === "end" ? "top" : "bottom");
			let C = _ - u.top - u.bottom, w = g - u.left - u.right, T = f(_ - u[v], C), D = f(g - u[y], w), O = !t.middlewareData.shift, k = T, A = D;
			if ((n = t.middlewareData.shift) != null && n.enabled.x && (A = w), (r = t.middlewareData.shift) != null && r.enabled.y && (k = C), O && !m) {
				let e = p(u.left, 0), t = p(u.right, 0), n = p(u.top, 0), r = p(u.bottom, 0);
				h ? A = g - 2 * (e !== 0 || t !== 0 ? e + t : p(u.left, u.right)) : k = _ - 2 * (n !== 0 || r !== 0 ? n + r : p(u.top, u.bottom));
			}
			await c({
				...t,
				availableWidth: A,
				availableHeight: k
			});
			let j = await o.getDimensions(s.floating);
			return g !== j.width || _ !== j.height ? { reset: { rects: !0 } } : {};
		}
	};
};
//#endregion
//#region node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
function R() {
	return typeof window < "u";
}
function z(e) {
	return pe(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function B(e) {
	var t;
	return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function V(e) {
	return ((pe(e) ? e.ownerDocument : e.document) || window.document)?.documentElement;
}
function pe(e) {
	return R() ? e instanceof Node || e instanceof B(e).Node : !1;
}
function H(e) {
	return R() ? e instanceof Element || e instanceof B(e).Element : !1;
}
function U(e) {
	return R() ? e instanceof HTMLElement || e instanceof B(e).HTMLElement : !1;
}
function me(e) {
	return !R() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof B(e).ShadowRoot;
}
var he = /*#__PURE__*/ new Set(["inline", "contents"]);
function W(e) {
	let { overflow: t, overflowX: n, overflowY: r, display: i } = J(e);
	return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !he.has(i);
}
var ge = /*#__PURE__*/ new Set([
	"table",
	"td",
	"th"
]);
function _e(e) {
	return ge.has(z(e));
}
var ve = [":popover-open", ":modal"];
function G(e) {
	return ve.some((t) => {
		try {
			return e.matches(t);
		} catch {
			return !1;
		}
	});
}
var ye = [
	"transform",
	"translate",
	"scale",
	"rotate",
	"perspective"
], be = [
	"transform",
	"translate",
	"scale",
	"rotate",
	"perspective",
	"filter"
], xe = [
	"paint",
	"layout",
	"strict",
	"content"
];
function K(e) {
	let t = Ce(), n = H(e) ? J(e) : e;
	return ye.some((e) => n[e] ? n[e] !== "none" : !1) || (n.containerType ? n.containerType !== "normal" : !1) || !t && (n.backdropFilter ? n.backdropFilter !== "none" : !1) || !t && (n.filter ? n.filter !== "none" : !1) || be.some((e) => (n.willChange || "").includes(e)) || xe.some((e) => (n.contain || "").includes(e));
}
function Se(e) {
	let t = Y(e);
	for (; U(t) && !q(t);) {
		if (K(t)) return t;
		if (G(t)) return null;
		t = Y(t);
	}
	return null;
}
function Ce() {
	return typeof CSS > "u" || !CSS.supports ? !1 : CSS.supports("-webkit-backdrop-filter", "none");
}
var we = /*#__PURE__*/ new Set([
	"html",
	"body",
	"#document"
]);
function q(e) {
	return we.has(z(e));
}
function J(e) {
	return B(e).getComputedStyle(e);
}
function Te(e) {
	return H(e) ? {
		scrollLeft: e.scrollLeft,
		scrollTop: e.scrollTop
	} : {
		scrollLeft: e.scrollX,
		scrollTop: e.scrollY
	};
}
function Y(e) {
	if (z(e) === "html") return e;
	let t = e.assignedSlot || e.parentNode || me(e) && e.host || V(e);
	return me(t) ? t.host : t;
}
function Ee(e) {
	let t = Y(e);
	return q(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : U(t) && W(t) ? t : Ee(t);
}
function X(e, t, n) {
	t === void 0 && (t = []), n === void 0 && (n = !0);
	let r = Ee(e), i = r === e.ownerDocument?.body, a = B(r);
	if (i) {
		let e = De(a);
		return t.concat(a, a.visualViewport || [], W(r) ? r : [], e && n ? X(e) : []);
	}
	return t.concat(r, X(r, [], n));
}
function De(e) {
	return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
//#endregion
//#region node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function Oe(e) {
	let t = J(e), n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0, i = U(e), a = i ? e.offsetWidth : n, o = i ? e.offsetHeight : r, s = m(n) !== a || m(r) !== o;
	return s && (n = a, r = o), {
		width: n,
		height: r,
		$: s
	};
}
function ke(e) {
	return H(e) ? e : e.contextElement;
}
function Z(e) {
	let t = ke(e);
	if (!U(t)) return g(1);
	let n = t.getBoundingClientRect(), { width: r, height: i, $: a } = Oe(t), o = (a ? m(n.width) : n.width) / r, s = (a ? m(n.height) : n.height) / i;
	return (!o || !Number.isFinite(o)) && (o = 1), (!s || !Number.isFinite(s)) && (s = 1), {
		x: o,
		y: s
	};
}
var Ae = /*#__PURE__*/ g(0);
function je(e) {
	let t = B(e);
	return !Ce() || !t.visualViewport ? Ae : {
		x: t.visualViewport.offsetLeft,
		y: t.visualViewport.offsetTop
	};
}
function Me(e, t, n) {
	return t === void 0 && (t = !1), !n || t && n !== B(e) ? !1 : t;
}
function Q(e, t, n, r) {
	t === void 0 && (t = !1), n === void 0 && (n = !1);
	let i = e.getBoundingClientRect(), a = ke(e), o = g(1);
	t && (r ? H(r) && (o = Z(r)) : o = Z(e));
	let s = Me(a, n, r) ? je(a) : g(0), c = (i.left + s.x) / o.x, l = (i.top + s.y) / o.y, u = i.width / o.x, d = i.height / o.y;
	if (a) {
		let e = B(a), t = r && H(r) ? B(r) : r, n = e, i = De(n);
		for (; i && r && t !== n;) {
			let e = Z(i), t = i.getBoundingClientRect(), r = J(i), a = t.left + (i.clientLeft + parseFloat(r.paddingLeft)) * e.x, o = t.top + (i.clientTop + parseFloat(r.paddingTop)) * e.y;
			c *= e.x, l *= e.y, u *= e.x, d *= e.y, c += a, l += o, n = B(i), i = De(n);
		}
	}
	return L({
		width: u,
		height: d,
		x: c,
		y: l
	});
}
function Ne(e, t) {
	let n = Te(e).scrollLeft;
	return t ? t.left + n : Q(V(e)).left + n;
}
function Pe(e, t) {
	let n = e.getBoundingClientRect();
	return {
		x: n.left + t.scrollLeft - Ne(e, n),
		y: n.top + t.scrollTop
	};
}
function Fe(e) {
	let { elements: t, rect: n, offsetParent: r, strategy: i } = e, a = i === "fixed", o = V(r), s = t ? G(t.floating) : !1;
	if (r === o || s && a) return n;
	let c = {
		scrollLeft: 0,
		scrollTop: 0
	}, l = g(1), u = g(0), d = U(r);
	if ((d || !d && !a) && ((z(r) !== "body" || W(o)) && (c = Te(r)), U(r))) {
		let e = Q(r);
		l = Z(r), u.x = e.x + r.clientLeft, u.y = e.y + r.clientTop;
	}
	let f = o && !d && !a ? Pe(o, c) : g(0);
	return {
		width: n.width * l.x,
		height: n.height * l.y,
		x: n.x * l.x - c.scrollLeft * l.x + u.x + f.x,
		y: n.y * l.y - c.scrollTop * l.y + u.y + f.y
	};
}
function Ie(e) {
	return Array.from(e.getClientRects());
}
function Le(e) {
	let t = V(e), n = Te(e), r = e.ownerDocument.body, i = p(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth), a = p(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight), o = -n.scrollLeft + Ne(e), s = -n.scrollTop;
	return J(r).direction === "rtl" && (o += p(t.clientWidth, r.clientWidth) - i), {
		width: i,
		height: a,
		x: o,
		y: s
	};
}
var Re = 25;
function ze(e, t) {
	let n = B(e), r = V(e), i = n.visualViewport, a = r.clientWidth, o = r.clientHeight, s = 0, c = 0;
	if (i) {
		a = i.width, o = i.height;
		let e = Ce();
		(!e || e && t === "fixed") && (s = i.offsetLeft, c = i.offsetTop);
	}
	let l = Ne(r);
	if (l <= 0) {
		let e = r.ownerDocument, t = e.body, n = getComputedStyle(t), i = e.compatMode === "CSS1Compat" && parseFloat(n.marginLeft) + parseFloat(n.marginRight) || 0, o = Math.abs(r.clientWidth - t.clientWidth - i);
		o <= Re && (a -= o);
	} else l <= Re && (a += l);
	return {
		width: a,
		height: o,
		x: s,
		y: c
	};
}
var Be = /*#__PURE__*/ new Set(["absolute", "fixed"]);
function Ve(e, t) {
	let n = Q(e, !0, t === "fixed"), r = n.top + e.clientTop, i = n.left + e.clientLeft, a = U(e) ? Z(e) : g(1);
	return {
		width: e.clientWidth * a.x,
		height: e.clientHeight * a.y,
		x: i * a.x,
		y: r * a.y
	};
}
function He(e, t, n) {
	let r;
	if (t === "viewport") r = ze(e, n);
	else if (t === "document") r = Le(V(e));
	else if (H(t)) r = Ve(t, n);
	else {
		let n = je(e);
		r = {
			x: t.x - n.x,
			y: t.y - n.y,
			width: t.width,
			height: t.height
		};
	}
	return L(r);
}
function Ue(e, t) {
	let n = Y(e);
	return n === t || !H(n) || q(n) ? !1 : J(n).position === "fixed" || Ue(n, t);
}
function We(e, t) {
	let n = t.get(e);
	if (n) return n;
	let r = X(e, [], !1).filter((e) => H(e) && z(e) !== "body"), i = null, a = J(e).position === "fixed", o = a ? Y(e) : e;
	for (; H(o) && !q(o);) {
		let t = J(o), n = K(o);
		!n && t.position === "fixed" && (i = null), (a ? !n && !i : !n && t.position === "static" && i && Be.has(i.position) || W(o) && !n && Ue(e, o)) ? r = r.filter((e) => e !== o) : i = t, o = Y(o);
	}
	return t.set(e, r), r;
}
function Ge(e) {
	let { element: t, boundary: n, rootBoundary: r, strategy: i } = e, a = [...n === "clippingAncestors" ? G(t) ? [] : We(t, this._c) : [].concat(n), r], o = a[0], s = a.reduce((e, n) => {
		let r = He(t, n, i);
		return e.top = p(r.top, e.top), e.right = f(r.right, e.right), e.bottom = f(r.bottom, e.bottom), e.left = p(r.left, e.left), e;
	}, He(t, o, i));
	return {
		width: s.right - s.left,
		height: s.bottom - s.top,
		x: s.left,
		y: s.top
	};
}
function Ke(e) {
	let { width: t, height: n } = Oe(e);
	return {
		width: t,
		height: n
	};
}
function qe(e, t, n) {
	let r = U(t), i = V(t), a = n === "fixed", o = Q(e, !0, a, t), s = {
		scrollLeft: 0,
		scrollTop: 0
	}, c = g(0);
	function l() {
		c.x = Ne(i);
	}
	if (r || !r && !a) if ((z(t) !== "body" || W(i)) && (s = Te(t)), r) {
		let e = Q(t, !0, a, t);
		c.x = e.x + t.clientLeft, c.y = e.y + t.clientTop;
	} else i && l();
	a && !r && i && l();
	let u = i && !r && !a ? Pe(i, s) : g(0);
	return {
		x: o.left + s.scrollLeft - c.x - u.x,
		y: o.top + s.scrollTop - c.y - u.y,
		width: o.width,
		height: o.height
	};
}
function Je(e) {
	return J(e).position === "static";
}
function Ye(e, t) {
	if (!U(e) || J(e).position === "fixed") return null;
	if (t) return t(e);
	let n = e.offsetParent;
	return V(e) === n && (n = n.ownerDocument.body), n;
}
function Xe(e, t) {
	let n = B(e);
	if (G(e)) return n;
	if (!U(e)) {
		let t = Y(e);
		for (; t && !q(t);) {
			if (H(t) && !Je(t)) return t;
			t = Y(t);
		}
		return n;
	}
	let r = Ye(e, t);
	for (; r && _e(r) && Je(r);) r = Ye(r, t);
	return r && q(r) && Je(r) && !K(r) ? n : r || Se(e) || n;
}
var Ze = async function(e) {
	let t = this.getOffsetParent || Xe, n = this.getDimensions, r = await n(e.floating);
	return {
		reference: qe(e.reference, await t(e.floating), e.strategy),
		floating: {
			x: 0,
			y: 0,
			width: r.width,
			height: r.height
		}
	};
};
function Qe(e) {
	return J(e).direction === "rtl";
}
var $e = {
	convertOffsetParentRelativeRectToViewportRelativeRect: Fe,
	getDocumentElement: V,
	getClippingRect: Ge,
	getOffsetParent: Xe,
	getElementRects: Ze,
	getClientRects: Ie,
	getDimensions: Ke,
	getScale: Z,
	isElement: H,
	isRTL: Qe
};
function et(e, t) {
	return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function tt(e, t) {
	let n = null, r, i = V(e);
	function a() {
		var e;
		clearTimeout(r), (e = n) == null || e.disconnect(), n = null;
	}
	function o(s, c) {
		s === void 0 && (s = !1), c === void 0 && (c = 1), a();
		let l = e.getBoundingClientRect(), { left: u, top: d, width: m, height: g } = l;
		if (s || t(), !m || !g) return;
		let _ = h(d), v = h(i.clientWidth - (u + m)), y = h(i.clientHeight - (d + g)), b = h(u), x = {
			rootMargin: -_ + "px " + -v + "px " + -y + "px " + -b + "px",
			threshold: p(0, f(1, c)) || 1
		}, S = !0;
		function C(t) {
			let n = t[0].intersectionRatio;
			if (n !== c) {
				if (!S) return o();
				n ? o(!1, n) : r = setTimeout(() => {
					o(!1, 1e-7);
				}, 1e3);
			}
			n === 1 && !et(l, e.getBoundingClientRect()) && o(), S = !1;
		}
		try {
			n = new IntersectionObserver(C, {
				...x,
				root: i.ownerDocument
			});
		} catch {
			n = new IntersectionObserver(C, x);
		}
		n.observe(e);
	}
	return o(!0), a;
}
function nt(e, t, n, r) {
	r === void 0 && (r = {});
	let { ancestorScroll: i = !0, ancestorResize: a = !0, elementResize: o = typeof ResizeObserver == "function", layoutShift: s = typeof IntersectionObserver == "function", animationFrame: c = !1 } = r, l = ke(e), u = i || a ? [...l ? X(l) : [], ...X(t)] : [];
	u.forEach((e) => {
		i && e.addEventListener("scroll", n, { passive: !0 }), a && e.addEventListener("resize", n);
	});
	let d = l && s ? tt(l, n) : null, f = -1, p = null;
	o && (p = new ResizeObserver((e) => {
		let [r] = e;
		r && r.target === l && p && (p.unobserve(t), cancelAnimationFrame(f), f = requestAnimationFrame(() => {
			var e;
			(e = p) == null || e.observe(t);
		})), n();
	}), l && !c && p.observe(l), p.observe(t));
	let m, h = c ? Q(e) : null;
	c && g();
	function g() {
		let t = Q(e);
		h && !et(h, t) && n(), h = t, m = requestAnimationFrame(g);
	}
	return n(), () => {
		var e;
		u.forEach((e) => {
			i && e.removeEventListener("scroll", n), a && e.removeEventListener("resize", n);
		}), d?.(), (e = p) == null || e.disconnect(), p = null, c && cancelAnimationFrame(m);
	};
}
var rt = ue, it = de, at = se, ot = fe, st = oe, ct = (e, t, n) => {
	let r = /* @__PURE__ */ new Map(), i = {
		platform: $e,
		...n
	}, a = {
		...i.platform,
		_c: r
	};
	return ie(e, t, {
		...i,
		platform: a
	});
};
//#endregion
//#region node_modules/composed-offset-position/dist/composed-offset-position.browser.min.mjs
function lt(e) {
	return dt(e);
}
function ut(e) {
	return e.assignedSlot ? e.assignedSlot : e.parentNode instanceof ShadowRoot ? e.parentNode.host : e.parentNode;
}
function dt(e) {
	for (let t = e; t; t = ut(t)) if (t instanceof Element && getComputedStyle(t).display === "none") return null;
	for (let t = ut(e); t; t = ut(t)) {
		if (!(t instanceof Element)) continue;
		let e = getComputedStyle(t);
		if (e.display !== "contents" && (e.position !== "static" || K(e) || t.tagName === "BODY")) return t;
	}
	return null;
}
//#endregion
//#region node_modules/@shoelace-style/shoelace/dist/chunks/chunk.5JY5FUCG.js
function ft(e) {
	return typeof e == "object" && !!e && "getBoundingClientRect" in e && ("contextElement" in e ? e.contextElement instanceof Element : !0);
}
var $ = class extends o {
	constructor() {
		super(...arguments), this.localize = new u(this), this.active = !1, this.placement = "top", this.strategy = "absolute", this.distance = 0, this.skidding = 0, this.arrow = !1, this.arrowPlacement = "anchor", this.arrowPadding = 10, this.flip = !1, this.flipFallbackPlacements = "", this.flipFallbackStrategy = "best-fit", this.flipPadding = 0, this.shift = !1, this.shiftPadding = 0, this.autoSizePadding = 0, this.hoverBridge = !1, this.updateHoverBridge = () => {
			if (this.hoverBridge && this.anchorEl) {
				let e = this.anchorEl.getBoundingClientRect(), t = this.popup.getBoundingClientRect(), n = this.placement.includes("top") || this.placement.includes("bottom"), r = 0, i = 0, a = 0, o = 0, s = 0, c = 0, l = 0, u = 0;
				n ? e.top < t.top ? (r = e.left, i = e.bottom, a = e.right, o = e.bottom, s = t.left, c = t.top, l = t.right, u = t.top) : (r = t.left, i = t.bottom, a = t.right, o = t.bottom, s = e.left, c = e.top, l = e.right, u = e.top) : e.left < t.left ? (r = e.right, i = e.top, a = t.left, o = t.top, s = e.right, c = e.bottom, l = t.left, u = t.bottom) : (r = t.right, i = t.top, a = e.left, o = e.top, s = t.right, c = t.bottom, l = e.left, u = e.bottom), this.style.setProperty("--hover-bridge-top-left-x", `${r}px`), this.style.setProperty("--hover-bridge-top-left-y", `${i}px`), this.style.setProperty("--hover-bridge-top-right-x", `${a}px`), this.style.setProperty("--hover-bridge-top-right-y", `${o}px`), this.style.setProperty("--hover-bridge-bottom-left-x", `${s}px`), this.style.setProperty("--hover-bridge-bottom-left-y", `${c}px`), this.style.setProperty("--hover-bridge-bottom-right-x", `${l}px`), this.style.setProperty("--hover-bridge-bottom-right-y", `${u}px`);
			}
		};
	}
	async connectedCallback() {
		super.connectedCallback(), await this.updateComplete, this.start();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.stop();
	}
	async updated(e) {
		super.updated(e), e.has("active") && (this.active ? this.start() : this.stop()), e.has("anchor") && this.handleAnchorChange(), this.active && (await this.updateComplete, this.reposition());
	}
	async handleAnchorChange() {
		if (await this.stop(), this.anchor && typeof this.anchor == "string") {
			let e = this.getRootNode();
			this.anchorEl = e.getElementById(this.anchor);
		} else this.anchor instanceof Element || ft(this.anchor) ? this.anchorEl = this.anchor : this.anchorEl = this.querySelector("[slot=\"anchor\"]");
		this.anchorEl instanceof HTMLSlotElement && (this.anchorEl = this.anchorEl.assignedElements({ flatten: !0 })[0]), this.anchorEl && this.active && this.start();
	}
	start() {
		!this.anchorEl || !this.active || (this.cleanup = nt(this.anchorEl, this.popup, () => {
			this.reposition();
		}));
	}
	async stop() {
		return new Promise((e) => {
			this.cleanup ? (this.cleanup(), this.cleanup = void 0, this.removeAttribute("data-current-placement"), this.style.removeProperty("--auto-size-available-width"), this.style.removeProperty("--auto-size-available-height"), requestAnimationFrame(() => e())) : e();
		});
	}
	reposition() {
		if (!this.active || !this.anchorEl) return;
		let e = [rt({
			mainAxis: this.distance,
			crossAxis: this.skidding
		})];
		this.sync ? e.push(ot({ apply: ({ rects: e }) => {
			let t = this.sync === "width" || this.sync === "both", n = this.sync === "height" || this.sync === "both";
			this.popup.style.width = t ? `${e.reference.width}px` : "", this.popup.style.height = n ? `${e.reference.height}px` : "";
		} })) : (this.popup.style.width = "", this.popup.style.height = ""), this.flip && e.push(at({
			boundary: this.flipBoundary,
			fallbackPlacements: this.flipFallbackPlacements,
			fallbackStrategy: this.flipFallbackStrategy === "best-fit" ? "bestFit" : "initialPlacement",
			padding: this.flipPadding
		})), this.shift && e.push(it({
			boundary: this.shiftBoundary,
			padding: this.shiftPadding
		})), this.autoSize ? e.push(ot({
			boundary: this.autoSizeBoundary,
			padding: this.autoSizePadding,
			apply: ({ availableWidth: e, availableHeight: t }) => {
				this.autoSize === "vertical" || this.autoSize === "both" ? this.style.setProperty("--auto-size-available-height", `${t}px`) : this.style.removeProperty("--auto-size-available-height"), this.autoSize === "horizontal" || this.autoSize === "both" ? this.style.setProperty("--auto-size-available-width", `${e}px`) : this.style.removeProperty("--auto-size-available-width");
			}
		})) : (this.style.removeProperty("--auto-size-available-width"), this.style.removeProperty("--auto-size-available-height")), this.arrow && e.push(st({
			element: this.arrowEl,
			padding: this.arrowPadding
		}));
		let t = this.strategy === "absolute" ? (e) => $e.getOffsetParent(e, lt) : $e.getOffsetParent;
		ct(this.anchorEl, this.popup, {
			placement: this.placement,
			middleware: e,
			strategy: this.strategy,
			platform: a(s({}, $e), { getOffsetParent: t })
		}).then(({ x: e, y: t, middlewareData: n, placement: r }) => {
			let i = this.localize.dir() === "rtl", a = {
				top: "bottom",
				right: "left",
				bottom: "top",
				left: "right"
			}[r.split("-")[0]];
			if (this.setAttribute("data-current-placement", r), Object.assign(this.popup.style, {
				left: `${e}px`,
				top: `${t}px`
			}), this.arrow) {
				let e = n.arrow.x, t = n.arrow.y, r = "", o = "", s = "", c = "";
				if (this.arrowPlacement === "start") {
					let n = typeof e == "number" ? `calc(${this.arrowPadding}px - var(--arrow-padding-offset))` : "";
					r = typeof t == "number" ? `calc(${this.arrowPadding}px - var(--arrow-padding-offset))` : "", o = i ? n : "", c = i ? "" : n;
				} else if (this.arrowPlacement === "end") {
					let n = typeof e == "number" ? `calc(${this.arrowPadding}px - var(--arrow-padding-offset))` : "";
					o = i ? "" : n, c = i ? n : "", s = typeof t == "number" ? `calc(${this.arrowPadding}px - var(--arrow-padding-offset))` : "";
				} else this.arrowPlacement === "center" ? (c = typeof e == "number" ? "calc(50% - var(--arrow-size-diagonal))" : "", r = typeof t == "number" ? "calc(50% - var(--arrow-size-diagonal))" : "") : (c = typeof e == "number" ? `${e}px` : "", r = typeof t == "number" ? `${t}px` : "");
				Object.assign(this.arrowEl.style, {
					top: r,
					right: o,
					bottom: s,
					left: c,
					[a]: "calc(var(--arrow-size-diagonal) * -1)"
				});
			}
		}), requestAnimationFrame(() => this.updateHoverBridge()), this.emit("sl-reposition");
	}
	render() {
		return r`
      <slot name="anchor" @slotchange=${this.handleAnchorChange}></slot>

      <span
        part="hover-bridge"
        class=${l({
			"popup-hover-bridge": !0,
			"popup-hover-bridge--visible": this.hoverBridge && this.active
		})}
      ></span>

      <div
        part="popup"
        class=${l({
			popup: !0,
			"popup--active": this.active,
			"popup--fixed": this.strategy === "fixed",
			"popup--has-arrow": this.arrow
		})}
      >
        <slot></slot>
        ${this.arrow ? r`<div part="arrow" class="popup__arrow" role="presentation"></div>` : ""}
      </div>
    `;
	}
};
$.styles = [i, d], c([n(".popup")], $.prototype, "popup", 2), c([n(".popup__arrow")], $.prototype, "arrowEl", 2), c([e()], $.prototype, "anchor", 2), c([e({
	type: Boolean,
	reflect: !0
})], $.prototype, "active", 2), c([e({ reflect: !0 })], $.prototype, "placement", 2), c([e({ reflect: !0 })], $.prototype, "strategy", 2), c([e({ type: Number })], $.prototype, "distance", 2), c([e({ type: Number })], $.prototype, "skidding", 2), c([e({ type: Boolean })], $.prototype, "arrow", 2), c([e({ attribute: "arrow-placement" })], $.prototype, "arrowPlacement", 2), c([e({
	attribute: "arrow-padding",
	type: Number
})], $.prototype, "arrowPadding", 2), c([e({ type: Boolean })], $.prototype, "flip", 2), c([e({
	attribute: "flip-fallback-placements",
	converter: {
		fromAttribute: (e) => e.split(" ").map((e) => e.trim()).filter((e) => e !== ""),
		toAttribute: (e) => e.join(" ")
	}
})], $.prototype, "flipFallbackPlacements", 2), c([e({ attribute: "flip-fallback-strategy" })], $.prototype, "flipFallbackStrategy", 2), c([e({ type: Object })], $.prototype, "flipBoundary", 2), c([e({
	attribute: "flip-padding",
	type: Number
})], $.prototype, "flipPadding", 2), c([e({ type: Boolean })], $.prototype, "shift", 2), c([e({ type: Object })], $.prototype, "shiftBoundary", 2), c([e({
	attribute: "shift-padding",
	type: Number
})], $.prototype, "shiftPadding", 2), c([e({ attribute: "auto-size" })], $.prototype, "autoSize", 2), c([e()], $.prototype, "sync", 2), c([e({ type: Object })], $.prototype, "autoSizeBoundary", 2), c([e({
	attribute: "auto-size-padding",
	type: Number
})], $.prototype, "autoSizePadding", 2), c([e({
	attribute: "hover-bridge",
	type: Boolean
})], $.prototype, "hoverBridge", 2);
//#endregion
export { $ as t };
