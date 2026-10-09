import { a as e, i as t, n, r, t as i } from "./chunk-HEgqtunE.js";
import { t as a } from "./esm-CTuscnN5.js";
import { t as o } from "./lib-CStxbLgN.js";
import { n as s, r as c, t as l } from "./delaunator-vCBbjqMd.js";
//#region node_modules/lodash-es/_freeGlobal.js
var u = typeof global == "object" && global && global.Object === Object && global, d = typeof self == "object" && self && self.Object === Object && self, f = u || d || Function("return this")(), p = f.Symbol, m = Object.prototype, h = m.hasOwnProperty, g = m.toString, _ = p ? p.toStringTag : void 0;
function v(e) {
	var t = h.call(e, _), n = e[_];
	try {
		e[_] = void 0;
		var r = !0;
	} catch {}
	var i = g.call(e);
	return r && (t ? e[_] = n : delete e[_]), i;
}
//#endregion
//#region node_modules/lodash-es/_objectToString.js
var y = Object.prototype.toString;
function b(e) {
	return y.call(e);
}
//#endregion
//#region node_modules/lodash-es/_baseGetTag.js
var x = "[object Null]", S = "[object Undefined]", ee = p ? p.toStringTag : void 0;
function C(e) {
	return e == null ? e === void 0 ? S : x : ee && ee in Object(e) ? v(e) : b(e);
}
//#endregion
//#region node_modules/lodash-es/isObjectLike.js
function w(e) {
	return typeof e == "object" && !!e;
}
//#endregion
//#region node_modules/lodash-es/isSymbol.js
var te = "[object Symbol]";
function ne(e) {
	return typeof e == "symbol" || w(e) && C(e) == te;
}
//#endregion
//#region node_modules/lodash-es/isArray.js
var T = Array.isArray, re = /\s/;
function ie(e) {
	for (var t = e.length; t-- && re.test(e.charAt(t)););
	return t;
}
//#endregion
//#region node_modules/lodash-es/_baseTrim.js
var ae = /^\s+/;
function oe(e) {
	return e && e.slice(0, ie(e) + 1).replace(ae, "");
}
//#endregion
//#region node_modules/lodash-es/isObject.js
function E(e) {
	var t = typeof e;
	return e != null && (t == "object" || t == "function");
}
//#endregion
//#region node_modules/lodash-es/toNumber.js
var se = NaN, ce = /^[-+]0x[0-9a-f]+$/i, le = /^0b[01]+$/i, ue = /^0o[0-7]+$/i, de = parseInt;
function fe(e) {
	if (typeof e == "number") return e;
	if (ne(e)) return se;
	if (E(e)) {
		var t = typeof e.valueOf == "function" ? e.valueOf() : e;
		e = E(t) ? t + "" : t;
	}
	if (typeof e != "string") return e === 0 ? e : +e;
	e = oe(e);
	var n = le.test(e);
	return n || ue.test(e) ? de(e.slice(2), n ? 2 : 8) : ce.test(e) ? se : +e;
}
//#endregion
//#region node_modules/lodash-es/isFunction.js
var D = "[object AsyncFunction]", pe = "[object Function]", me = "[object GeneratorFunction]", O = "[object Proxy]";
function he(e) {
	if (!E(e)) return !1;
	var t = C(e);
	return t == pe || t == me || t == D || t == O;
}
//#endregion
//#region node_modules/lodash-es/_coreJsData.js
var ge = f["__core-js_shared__"], _e = function() {
	var e = /[^.]+$/.exec(ge && ge.keys && ge.keys.IE_PROTO || "");
	return e ? "Symbol(src)_1." + e : "";
}();
function ve(e) {
	return !!_e && _e in e;
}
//#endregion
//#region node_modules/lodash-es/_toSource.js
var ye = Function.prototype.toString;
function be(e) {
	if (e != null) {
		try {
			return ye.call(e);
		} catch {}
		try {
			return e + "";
		} catch {}
	}
	return "";
}
//#endregion
//#region node_modules/lodash-es/_baseIsNative.js
var xe = /[\\^$.*+?()[\]{}|]/g, Se = /^\[object .+?Constructor\]$/, Ce = Function.prototype, we = Object.prototype, Te = Ce.toString, Ee = we.hasOwnProperty, De = RegExp("^" + Te.call(Ee).replace(xe, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");
function Oe(e) {
	return !E(e) || ve(e) ? !1 : (he(e) ? De : Se).test(be(e));
}
//#endregion
//#region node_modules/lodash-es/_getValue.js
function ke(e, t) {
	return e?.[t];
}
//#endregion
//#region node_modules/lodash-es/_getNative.js
function Ae(e, t) {
	var n = ke(e, t);
	return Oe(n) ? n : void 0;
}
//#endregion
//#region node_modules/lodash-es/_WeakMap.js
var je = Ae(f, "WeakMap"), Me = Object.create, Ne = function() {
	function e() {}
	return function(t) {
		if (!E(t)) return {};
		if (Me) return Me(t);
		e.prototype = t;
		var n = new e();
		return e.prototype = void 0, n;
	};
}();
//#endregion
//#region node_modules/lodash-es/_copyArray.js
function Pe(e, t) {
	var n = -1, r = e.length;
	for (t ||= Array(r); ++n < r;) t[n] = e[n];
	return t;
}
//#endregion
//#region node_modules/lodash-es/_defineProperty.js
var Fe = function() {
	try {
		var e = Ae(Object, "defineProperty");
		return e({}, "", {}), e;
	} catch {}
}();
//#endregion
//#region node_modules/lodash-es/_arrayEach.js
function Ie(e, t) {
	for (var n = -1, r = e == null ? 0 : e.length; ++n < r && t(e[n], n, e) !== !1;);
	return e;
}
//#endregion
//#region node_modules/lodash-es/_isIndex.js
var Le = 9007199254740991, Re = /^(?:0|[1-9]\d*)$/;
function ze(e, t) {
	var n = typeof e;
	return t ??= Le, !!t && (n == "number" || n != "symbol" && Re.test(e)) && e > -1 && e % 1 == 0 && e < t;
}
//#endregion
//#region node_modules/lodash-es/_baseAssignValue.js
function Be(e, t, n) {
	t == "__proto__" && Fe ? Fe(e, t, {
		configurable: !0,
		enumerable: !0,
		value: n,
		writable: !0
	}) : e[t] = n;
}
//#endregion
//#region node_modules/lodash-es/eq.js
function Ve(e, t) {
	return e === t || e !== e && t !== t;
}
//#endregion
//#region node_modules/lodash-es/_assignValue.js
var He = Object.prototype.hasOwnProperty;
function Ue(e, t, n) {
	var r = e[t];
	(!(He.call(e, t) && Ve(r, n)) || n === void 0 && !(t in e)) && Be(e, t, n);
}
//#endregion
//#region node_modules/lodash-es/_copyObject.js
function We(e, t, n, r) {
	var i = !n;
	n ||= {};
	for (var a = -1, o = t.length; ++a < o;) {
		var s = t[a], c = r ? r(n[s], e[s], s, n, e) : void 0;
		c === void 0 && (c = e[s]), i ? Be(n, s, c) : Ue(n, s, c);
	}
	return n;
}
//#endregion
//#region node_modules/lodash-es/isLength.js
var Ge = 9007199254740991;
function Ke(e) {
	return typeof e == "number" && e > -1 && e % 1 == 0 && e <= Ge;
}
//#endregion
//#region node_modules/lodash-es/isArrayLike.js
function qe(e) {
	return e != null && Ke(e.length) && !he(e);
}
//#endregion
//#region node_modules/lodash-es/_isPrototype.js
var Je = Object.prototype;
function Ye(e) {
	var t = e && e.constructor;
	return e === (typeof t == "function" && t.prototype || Je);
}
//#endregion
//#region node_modules/lodash-es/_baseTimes.js
function Xe(e, t) {
	for (var n = -1, r = Array(e); ++n < e;) r[n] = t(n);
	return r;
}
//#endregion
//#region node_modules/lodash-es/_baseIsArguments.js
var Ze = "[object Arguments]";
function Qe(e) {
	return w(e) && C(e) == Ze;
}
//#endregion
//#region node_modules/lodash-es/isArguments.js
var $e = Object.prototype, et = $e.hasOwnProperty, tt = $e.propertyIsEnumerable, nt = Qe(function() {
	return arguments;
}()) ? Qe : function(e) {
	return w(e) && et.call(e, "callee") && !tt.call(e, "callee");
};
//#endregion
//#region node_modules/lodash-es/stubFalse.js
function rt() {
	return !1;
}
//#endregion
//#region node_modules/lodash-es/isBuffer.js
var it = typeof exports == "object" && exports && !exports.nodeType && exports, at = it && typeof module == "object" && module && !module.nodeType && module, ot = at && at.exports === it ? f.Buffer : void 0, st = (ot ? ot.isBuffer : void 0) || rt, ct = "[object Arguments]", lt = "[object Array]", ut = "[object Boolean]", dt = "[object Date]", ft = "[object Error]", pt = "[object Function]", mt = "[object Map]", ht = "[object Number]", gt = "[object Object]", _t = "[object RegExp]", vt = "[object Set]", yt = "[object String]", bt = "[object WeakMap]", xt = "[object ArrayBuffer]", St = "[object DataView]", Ct = "[object Float32Array]", wt = "[object Float64Array]", Tt = "[object Int8Array]", Et = "[object Int16Array]", Dt = "[object Int32Array]", Ot = "[object Uint8Array]", kt = "[object Uint8ClampedArray]", At = "[object Uint16Array]", jt = "[object Uint32Array]", k = {};
k[Ct] = k[wt] = k[Tt] = k[Et] = k[Dt] = k[Ot] = k[kt] = k[At] = k[jt] = !0, k[ct] = k[lt] = k[xt] = k[ut] = k[St] = k[dt] = k[ft] = k[pt] = k[mt] = k[ht] = k[gt] = k[_t] = k[vt] = k[yt] = k[bt] = !1;
function Mt(e) {
	return w(e) && Ke(e.length) && !!k[C(e)];
}
//#endregion
//#region node_modules/lodash-es/_baseUnary.js
function Nt(e) {
	return function(t) {
		return e(t);
	};
}
//#endregion
//#region node_modules/lodash-es/_nodeUtil.js
var Pt = typeof exports == "object" && exports && !exports.nodeType && exports, Ft = Pt && typeof module == "object" && module && !module.nodeType && module, It = Ft && Ft.exports === Pt && u.process, Lt = function() {
	try {
		return Ft && Ft.require && Ft.require("util").types || It && It.binding && It.binding("util");
	} catch {}
}(), Rt = Lt && Lt.isTypedArray, zt = Rt ? Nt(Rt) : Mt, Bt = Object.prototype.hasOwnProperty;
function Vt(e, t) {
	var n = T(e), r = !n && nt(e), i = !n && !r && st(e), a = !n && !r && !i && zt(e), o = n || r || i || a, s = o ? Xe(e.length, String) : [], c = s.length;
	for (var l in e) (t || Bt.call(e, l)) && !(o && (l == "length" || i && (l == "offset" || l == "parent") || a && (l == "buffer" || l == "byteLength" || l == "byteOffset") || ze(l, c))) && s.push(l);
	return s;
}
//#endregion
//#region node_modules/lodash-es/_overArg.js
function Ht(e, t) {
	return function(n) {
		return e(t(n));
	};
}
//#endregion
//#region node_modules/lodash-es/_nativeKeys.js
var Ut = Ht(Object.keys, Object), Wt = Object.prototype.hasOwnProperty;
function Gt(e) {
	if (!Ye(e)) return Ut(e);
	var t = [];
	for (var n in Object(e)) Wt.call(e, n) && n != "constructor" && t.push(n);
	return t;
}
//#endregion
//#region node_modules/lodash-es/keys.js
function Kt(e) {
	return qe(e) ? Vt(e) : Gt(e);
}
//#endregion
//#region node_modules/lodash-es/_nativeKeysIn.js
function qt(e) {
	var t = [];
	if (e != null) for (var n in Object(e)) t.push(n);
	return t;
}
//#endregion
//#region node_modules/lodash-es/_baseKeysIn.js
var Jt = Object.prototype.hasOwnProperty;
function Yt(e) {
	if (!E(e)) return qt(e);
	var t = Ye(e), n = [];
	for (var r in e) r == "constructor" && (t || !Jt.call(e, r)) || n.push(r);
	return n;
}
//#endregion
//#region node_modules/lodash-es/keysIn.js
function Xt(e) {
	return qe(e) ? Vt(e, !0) : Yt(e);
}
//#endregion
//#region node_modules/lodash-es/_nativeCreate.js
var Zt = Ae(Object, "create");
//#endregion
//#region node_modules/lodash-es/_hashClear.js
function Qt() {
	this.__data__ = Zt ? Zt(null) : {}, this.size = 0;
}
//#endregion
//#region node_modules/lodash-es/_hashDelete.js
function $t(e) {
	var t = this.has(e) && delete this.__data__[e];
	return this.size -= +!!t, t;
}
//#endregion
//#region node_modules/lodash-es/_hashGet.js
var en = "__lodash_hash_undefined__", tn = Object.prototype.hasOwnProperty;
function nn(e) {
	var t = this.__data__;
	if (Zt) {
		var n = t[e];
		return n === en ? void 0 : n;
	}
	return tn.call(t, e) ? t[e] : void 0;
}
//#endregion
//#region node_modules/lodash-es/_hashHas.js
var rn = Object.prototype.hasOwnProperty;
function an(e) {
	var t = this.__data__;
	return Zt ? t[e] !== void 0 : rn.call(t, e);
}
//#endregion
//#region node_modules/lodash-es/_hashSet.js
var on = "__lodash_hash_undefined__";
function sn(e, t) {
	var n = this.__data__;
	return this.size += +!this.has(e), n[e] = Zt && t === void 0 ? on : t, this;
}
//#endregion
//#region node_modules/lodash-es/_Hash.js
function cn(e) {
	var t = -1, n = e == null ? 0 : e.length;
	for (this.clear(); ++t < n;) {
		var r = e[t];
		this.set(r[0], r[1]);
	}
}
cn.prototype.clear = Qt, cn.prototype.delete = $t, cn.prototype.get = nn, cn.prototype.has = an, cn.prototype.set = sn;
//#endregion
//#region node_modules/lodash-es/_listCacheClear.js
function ln() {
	this.__data__ = [], this.size = 0;
}
//#endregion
//#region node_modules/lodash-es/_assocIndexOf.js
function un(e, t) {
	for (var n = e.length; n--;) if (Ve(e[n][0], t)) return n;
	return -1;
}
//#endregion
//#region node_modules/lodash-es/_listCacheDelete.js
var dn = Array.prototype.splice;
function fn(e) {
	var t = this.__data__, n = un(t, e);
	return n < 0 ? !1 : (n == t.length - 1 ? t.pop() : dn.call(t, n, 1), --this.size, !0);
}
//#endregion
//#region node_modules/lodash-es/_listCacheGet.js
function pn(e) {
	var t = this.__data__, n = un(t, e);
	return n < 0 ? void 0 : t[n][1];
}
//#endregion
//#region node_modules/lodash-es/_listCacheHas.js
function mn(e) {
	return un(this.__data__, e) > -1;
}
//#endregion
//#region node_modules/lodash-es/_listCacheSet.js
function hn(e, t) {
	var n = this.__data__, r = un(n, e);
	return r < 0 ? (++this.size, n.push([e, t])) : n[r][1] = t, this;
}
//#endregion
//#region node_modules/lodash-es/_ListCache.js
function gn(e) {
	var t = -1, n = e == null ? 0 : e.length;
	for (this.clear(); ++t < n;) {
		var r = e[t];
		this.set(r[0], r[1]);
	}
}
gn.prototype.clear = ln, gn.prototype.delete = fn, gn.prototype.get = pn, gn.prototype.has = mn, gn.prototype.set = hn;
//#endregion
//#region node_modules/lodash-es/_Map.js
var _n = Ae(f, "Map");
//#endregion
//#region node_modules/lodash-es/_mapCacheClear.js
function vn() {
	this.size = 0, this.__data__ = {
		hash: new cn(),
		map: new (_n || gn)(),
		string: new cn()
	};
}
//#endregion
//#region node_modules/lodash-es/_isKeyable.js
function yn(e) {
	var t = typeof e;
	return t == "string" || t == "number" || t == "symbol" || t == "boolean" ? e !== "__proto__" : e === null;
}
//#endregion
//#region node_modules/lodash-es/_getMapData.js
function bn(e, t) {
	var n = e.__data__;
	return yn(t) ? n[typeof t == "string" ? "string" : "hash"] : n.map;
}
//#endregion
//#region node_modules/lodash-es/_mapCacheDelete.js
function xn(e) {
	var t = bn(this, e).delete(e);
	return this.size -= +!!t, t;
}
//#endregion
//#region node_modules/lodash-es/_mapCacheGet.js
function Sn(e) {
	return bn(this, e).get(e);
}
//#endregion
//#region node_modules/lodash-es/_mapCacheHas.js
function Cn(e) {
	return bn(this, e).has(e);
}
//#endregion
//#region node_modules/lodash-es/_mapCacheSet.js
function wn(e, t) {
	var n = bn(this, e), r = n.size;
	return n.set(e, t), this.size += n.size == r ? 0 : 1, this;
}
//#endregion
//#region node_modules/lodash-es/_MapCache.js
function Tn(e) {
	var t = -1, n = e == null ? 0 : e.length;
	for (this.clear(); ++t < n;) {
		var r = e[t];
		this.set(r[0], r[1]);
	}
}
Tn.prototype.clear = vn, Tn.prototype.delete = xn, Tn.prototype.get = Sn, Tn.prototype.has = Cn, Tn.prototype.set = wn;
//#endregion
//#region node_modules/lodash-es/_arrayPush.js
function En(e, t) {
	for (var n = -1, r = t.length, i = e.length; ++n < r;) e[i + n] = t[n];
	return e;
}
//#endregion
//#region node_modules/lodash-es/_getPrototype.js
var Dn = Ht(Object.getPrototypeOf, Object);
//#endregion
//#region node_modules/lodash-es/_stackClear.js
function On() {
	this.__data__ = new gn(), this.size = 0;
}
//#endregion
//#region node_modules/lodash-es/_stackDelete.js
function kn(e) {
	var t = this.__data__, n = t.delete(e);
	return this.size = t.size, n;
}
//#endregion
//#region node_modules/lodash-es/_stackGet.js
function An(e) {
	return this.__data__.get(e);
}
//#endregion
//#region node_modules/lodash-es/_stackHas.js
function jn(e) {
	return this.__data__.has(e);
}
//#endregion
//#region node_modules/lodash-es/_stackSet.js
var Mn = 200;
function Nn(e, t) {
	var n = this.__data__;
	if (n instanceof gn) {
		var r = n.__data__;
		if (!_n || r.length < Mn - 1) return r.push([e, t]), this.size = ++n.size, this;
		n = this.__data__ = new Tn(r);
	}
	return n.set(e, t), this.size = n.size, this;
}
//#endregion
//#region node_modules/lodash-es/_Stack.js
function Pn(e) {
	var t = this.__data__ = new gn(e);
	this.size = t.size;
}
Pn.prototype.clear = On, Pn.prototype.delete = kn, Pn.prototype.get = An, Pn.prototype.has = jn, Pn.prototype.set = Nn;
//#endregion
//#region node_modules/lodash-es/_baseAssign.js
function Fn(e, t) {
	return e && We(t, Kt(t), e);
}
//#endregion
//#region node_modules/lodash-es/_baseAssignIn.js
function In(e, t) {
	return e && We(t, Xt(t), e);
}
//#endregion
//#region node_modules/lodash-es/_cloneBuffer.js
var Ln = typeof exports == "object" && exports && !exports.nodeType && exports, Rn = Ln && typeof module == "object" && module && !module.nodeType && module, zn = Rn && Rn.exports === Ln ? f.Buffer : void 0, Bn = zn ? zn.allocUnsafe : void 0;
function Vn(e, t) {
	if (t) return e.slice();
	var n = e.length, r = Bn ? Bn(n) : new e.constructor(n);
	return e.copy(r), r;
}
//#endregion
//#region node_modules/lodash-es/_arrayFilter.js
function Hn(e, t) {
	for (var n = -1, r = e == null ? 0 : e.length, i = 0, a = []; ++n < r;) {
		var o = e[n];
		t(o, n, e) && (a[i++] = o);
	}
	return a;
}
//#endregion
//#region node_modules/lodash-es/stubArray.js
function Un() {
	return [];
}
//#endregion
//#region node_modules/lodash-es/_getSymbols.js
var Wn = Object.prototype.propertyIsEnumerable, Gn = Object.getOwnPropertySymbols, Kn = Gn ? function(e) {
	return e == null ? [] : (e = Object(e), Hn(Gn(e), function(t) {
		return Wn.call(e, t);
	}));
} : Un;
//#endregion
//#region node_modules/lodash-es/_copySymbols.js
function qn(e, t) {
	return We(e, Kn(e), t);
}
//#endregion
//#region node_modules/lodash-es/_getSymbolsIn.js
var Jn = Object.getOwnPropertySymbols ? function(e) {
	for (var t = []; e;) En(t, Kn(e)), e = Dn(e);
	return t;
} : Un;
//#endregion
//#region node_modules/lodash-es/_copySymbolsIn.js
function Yn(e, t) {
	return We(e, Jn(e), t);
}
//#endregion
//#region node_modules/lodash-es/_baseGetAllKeys.js
function Xn(e, t, n) {
	var r = t(e);
	return T(e) ? r : En(r, n(e));
}
//#endregion
//#region node_modules/lodash-es/_getAllKeys.js
function Zn(e) {
	return Xn(e, Kt, Kn);
}
//#endregion
//#region node_modules/lodash-es/_getAllKeysIn.js
function Qn(e) {
	return Xn(e, Xt, Jn);
}
//#endregion
//#region node_modules/lodash-es/_DataView.js
var $n = Ae(f, "DataView"), er = Ae(f, "Promise"), tr = Ae(f, "Set"), nr = "[object Map]", rr = "[object Object]", ir = "[object Promise]", ar = "[object Set]", or = "[object WeakMap]", sr = "[object DataView]", cr = be($n), lr = be(_n), ur = be(er), dr = be(tr), fr = be(je), pr = C;
($n && pr(new $n(/* @__PURE__ */ new ArrayBuffer(1))) != sr || _n && pr(new _n()) != nr || er && pr(er.resolve()) != ir || tr && pr(new tr()) != ar || je && pr(new je()) != or) && (pr = function(e) {
	var t = C(e), n = t == rr ? e.constructor : void 0, r = n ? be(n) : "";
	if (r) switch (r) {
		case cr: return sr;
		case lr: return nr;
		case ur: return ir;
		case dr: return ar;
		case fr: return or;
	}
	return t;
});
var mr = pr, hr = Object.prototype.hasOwnProperty;
function gr(e) {
	var t = e.length, n = new e.constructor(t);
	return t && typeof e[0] == "string" && hr.call(e, "index") && (n.index = e.index, n.input = e.input), n;
}
//#endregion
//#region node_modules/lodash-es/_Uint8Array.js
var _r = f.Uint8Array;
//#endregion
//#region node_modules/lodash-es/_cloneArrayBuffer.js
function vr(e) {
	var t = new e.constructor(e.byteLength);
	return new _r(t).set(new _r(e)), t;
}
//#endregion
//#region node_modules/lodash-es/_cloneDataView.js
function yr(e, t) {
	var n = t ? vr(e.buffer) : e.buffer;
	return new e.constructor(n, e.byteOffset, e.byteLength);
}
//#endregion
//#region node_modules/lodash-es/_cloneRegExp.js
var br = /\w*$/;
function xr(e) {
	var t = new e.constructor(e.source, br.exec(e));
	return t.lastIndex = e.lastIndex, t;
}
//#endregion
//#region node_modules/lodash-es/_cloneSymbol.js
var Sr = p ? p.prototype : void 0, Cr = Sr ? Sr.valueOf : void 0;
function wr(e) {
	return Cr ? Object(Cr.call(e)) : {};
}
//#endregion
//#region node_modules/lodash-es/_cloneTypedArray.js
function Tr(e, t) {
	var n = t ? vr(e.buffer) : e.buffer;
	return new e.constructor(n, e.byteOffset, e.length);
}
//#endregion
//#region node_modules/lodash-es/_initCloneByTag.js
var Er = "[object Boolean]", Dr = "[object Date]", Or = "[object Map]", kr = "[object Number]", Ar = "[object RegExp]", jr = "[object Set]", Mr = "[object String]", Nr = "[object Symbol]", Pr = "[object ArrayBuffer]", Fr = "[object DataView]", Ir = "[object Float32Array]", Lr = "[object Float64Array]", Rr = "[object Int8Array]", zr = "[object Int16Array]", Br = "[object Int32Array]", Vr = "[object Uint8Array]", Hr = "[object Uint8ClampedArray]", Ur = "[object Uint16Array]", Wr = "[object Uint32Array]";
function Gr(e, t, n) {
	var r = e.constructor;
	switch (t) {
		case Pr: return vr(e);
		case Er:
		case Dr: return new r(+e);
		case Fr: return yr(e, n);
		case Ir:
		case Lr:
		case Rr:
		case zr:
		case Br:
		case Vr:
		case Hr:
		case Ur:
		case Wr: return Tr(e, n);
		case Or: return new r();
		case kr:
		case Mr: return new r(e);
		case Ar: return xr(e);
		case jr: return new r();
		case Nr: return wr(e);
	}
}
//#endregion
//#region node_modules/lodash-es/_initCloneObject.js
function Kr(e) {
	return typeof e.constructor == "function" && !Ye(e) ? Ne(Dn(e)) : {};
}
//#endregion
//#region node_modules/lodash-es/_baseIsMap.js
var qr = "[object Map]";
function Jr(e) {
	return w(e) && mr(e) == qr;
}
//#endregion
//#region node_modules/lodash-es/isMap.js
var Yr = Lt && Lt.isMap, Xr = Yr ? Nt(Yr) : Jr, Zr = "[object Set]";
function Qr(e) {
	return w(e) && mr(e) == Zr;
}
//#endregion
//#region node_modules/lodash-es/isSet.js
var $r = Lt && Lt.isSet, ei = $r ? Nt($r) : Qr, ti = 1, ni = 2, ri = 4, ii = "[object Arguments]", ai = "[object Array]", oi = "[object Boolean]", si = "[object Date]", ci = "[object Error]", li = "[object Function]", ui = "[object GeneratorFunction]", di = "[object Map]", fi = "[object Number]", pi = "[object Object]", mi = "[object RegExp]", hi = "[object Set]", gi = "[object String]", _i = "[object Symbol]", vi = "[object WeakMap]", yi = "[object ArrayBuffer]", bi = "[object DataView]", xi = "[object Float32Array]", Si = "[object Float64Array]", Ci = "[object Int8Array]", wi = "[object Int16Array]", Ti = "[object Int32Array]", Ei = "[object Uint8Array]", Di = "[object Uint8ClampedArray]", Oi = "[object Uint16Array]", ki = "[object Uint32Array]", A = {};
A[ii] = A[ai] = A[yi] = A[bi] = A[oi] = A[si] = A[xi] = A[Si] = A[Ci] = A[wi] = A[Ti] = A[di] = A[fi] = A[pi] = A[mi] = A[hi] = A[gi] = A[_i] = A[Ei] = A[Di] = A[Oi] = A[ki] = !0, A[ci] = A[li] = A[vi] = !1;
function Ai(e, t, n, r, i, a) {
	var o, s = t & ti, c = t & ni, l = t & ri;
	if (n && (o = i ? n(e, r, i, a) : n(e)), o !== void 0) return o;
	if (!E(e)) return e;
	var u = T(e);
	if (u) {
		if (o = gr(e), !s) return Pe(e, o);
	} else {
		var d = mr(e), f = d == li || d == ui;
		if (st(e)) return Vn(e, s);
		if (d == pi || d == ii || f && !i) {
			if (o = c || f ? {} : Kr(e), !s) return c ? Yn(e, In(o, e)) : qn(e, Fn(o, e));
		} else {
			if (!A[d]) return i ? e : {};
			o = Gr(e, d, s);
		}
	}
	a ||= new Pn();
	var p = a.get(e);
	if (p) return p;
	a.set(e, o), ei(e) ? e.forEach(function(r) {
		o.add(Ai(r, t, n, r, e, a));
	}) : Xr(e) && e.forEach(function(r, i) {
		o.set(i, Ai(r, t, n, i, e, a));
	});
	var m = u ? void 0 : (l ? c ? Qn : Zn : c ? Xt : Kt)(e);
	return Ie(m || e, function(r, i) {
		m && (i = r, r = e[i]), Ue(o, i, Ai(r, t, n, i, e, a));
	}), o;
}
//#endregion
//#region node_modules/lodash-es/cloneDeep.js
var ji = 1, Mi = 4;
function Ni(e) {
	return Ai(e, ji | Mi);
}
//#endregion
//#region node_modules/lodash-es/_setCacheAdd.js
var Pi = "__lodash_hash_undefined__";
function Fi(e) {
	return this.__data__.set(e, Pi), this;
}
//#endregion
//#region node_modules/lodash-es/_setCacheHas.js
function Ii(e) {
	return this.__data__.has(e);
}
//#endregion
//#region node_modules/lodash-es/_SetCache.js
function Li(e) {
	var t = -1, n = e == null ? 0 : e.length;
	for (this.__data__ = new Tn(); ++t < n;) this.add(e[t]);
}
Li.prototype.add = Li.prototype.push = Fi, Li.prototype.has = Ii;
//#endregion
//#region node_modules/lodash-es/_arraySome.js
function Ri(e, t) {
	for (var n = -1, r = e == null ? 0 : e.length; ++n < r;) if (t(e[n], n, e)) return !0;
	return !1;
}
//#endregion
//#region node_modules/lodash-es/_cacheHas.js
function zi(e, t) {
	return e.has(t);
}
//#endregion
//#region node_modules/lodash-es/_equalArrays.js
var Bi = 1, Vi = 2;
function Hi(e, t, n, r, i, a) {
	var o = n & Bi, s = e.length, c = t.length;
	if (s != c && !(o && c > s)) return !1;
	var l = a.get(e), u = a.get(t);
	if (l && u) return l == t && u == e;
	var d = -1, f = !0, p = n & Vi ? new Li() : void 0;
	for (a.set(e, t), a.set(t, e); ++d < s;) {
		var m = e[d], h = t[d];
		if (r) var g = o ? r(h, m, d, t, e, a) : r(m, h, d, e, t, a);
		if (g !== void 0) {
			if (g) continue;
			f = !1;
			break;
		}
		if (p) {
			if (!Ri(t, function(e, t) {
				if (!zi(p, t) && (m === e || i(m, e, n, r, a))) return p.push(t);
			})) {
				f = !1;
				break;
			}
		} else if (!(m === h || i(m, h, n, r, a))) {
			f = !1;
			break;
		}
	}
	return a.delete(e), a.delete(t), f;
}
//#endregion
//#region node_modules/lodash-es/_mapToArray.js
function Ui(e) {
	var t = -1, n = Array(e.size);
	return e.forEach(function(e, r) {
		n[++t] = [r, e];
	}), n;
}
//#endregion
//#region node_modules/lodash-es/_setToArray.js
function Wi(e) {
	var t = -1, n = Array(e.size);
	return e.forEach(function(e) {
		n[++t] = e;
	}), n;
}
//#endregion
//#region node_modules/lodash-es/_equalByTag.js
var Gi = 1, Ki = 2, qi = "[object Boolean]", Ji = "[object Date]", Yi = "[object Error]", Xi = "[object Map]", Zi = "[object Number]", Qi = "[object RegExp]", $i = "[object Set]", ea = "[object String]", ta = "[object Symbol]", na = "[object ArrayBuffer]", ra = "[object DataView]", ia = p ? p.prototype : void 0, aa = ia ? ia.valueOf : void 0;
function oa(e, t, n, r, i, a, o) {
	switch (n) {
		case ra:
			if (e.byteLength != t.byteLength || e.byteOffset != t.byteOffset) return !1;
			e = e.buffer, t = t.buffer;
		case na: return !(e.byteLength != t.byteLength || !a(new _r(e), new _r(t)));
		case qi:
		case Ji:
		case Zi: return Ve(+e, +t);
		case Yi: return e.name == t.name && e.message == t.message;
		case Qi:
		case ea: return e == t + "";
		case Xi: var s = Ui;
		case $i:
			var c = r & Gi;
			if (s ||= Wi, e.size != t.size && !c) return !1;
			var l = o.get(e);
			if (l) return l == t;
			r |= Ki, o.set(e, t);
			var u = Hi(s(e), s(t), r, i, a, o);
			return o.delete(e), u;
		case ta: if (aa) return aa.call(e) == aa.call(t);
	}
	return !1;
}
//#endregion
//#region node_modules/lodash-es/_equalObjects.js
var sa = 1, ca = Object.prototype.hasOwnProperty;
function la(e, t, n, r, i, a) {
	var o = n & sa, s = Zn(e), c = s.length;
	if (c != Zn(t).length && !o) return !1;
	for (var l = c; l--;) {
		var u = s[l];
		if (!(o ? u in t : ca.call(t, u))) return !1;
	}
	var d = a.get(e), f = a.get(t);
	if (d && f) return d == t && f == e;
	var p = !0;
	a.set(e, t), a.set(t, e);
	for (var m = o; ++l < c;) {
		u = s[l];
		var h = e[u], g = t[u];
		if (r) var _ = o ? r(g, h, u, t, e, a) : r(h, g, u, e, t, a);
		if (!(_ === void 0 ? h === g || i(h, g, n, r, a) : _)) {
			p = !1;
			break;
		}
		m ||= u == "constructor";
	}
	if (p && !m) {
		var v = e.constructor, y = t.constructor;
		v != y && "constructor" in e && "constructor" in t && !(typeof v == "function" && v instanceof v && typeof y == "function" && y instanceof y) && (p = !1);
	}
	return a.delete(e), a.delete(t), p;
}
//#endregion
//#region node_modules/lodash-es/_baseIsEqualDeep.js
var ua = 1, da = "[object Arguments]", fa = "[object Array]", pa = "[object Object]", ma = Object.prototype.hasOwnProperty;
function ha(e, t, n, r, i, a) {
	var o = T(e), s = T(t), c = o ? fa : mr(e), l = s ? fa : mr(t);
	c = c == da ? pa : c, l = l == da ? pa : l;
	var u = c == pa, d = l == pa, f = c == l;
	if (f && st(e)) {
		if (!st(t)) return !1;
		o = !0, u = !1;
	}
	if (f && !u) return a ||= new Pn(), o || zt(e) ? Hi(e, t, n, r, i, a) : oa(e, t, c, n, r, i, a);
	if (!(n & ua)) {
		var p = u && ma.call(e, "__wrapped__"), m = d && ma.call(t, "__wrapped__");
		if (p || m) {
			var h = p ? e.value() : e, g = m ? t.value() : t;
			return a ||= new Pn(), i(h, g, n, r, a);
		}
	}
	return f ? (a ||= new Pn(), la(e, t, n, r, i, a)) : !1;
}
//#endregion
//#region node_modules/lodash-es/_baseIsEqual.js
function ga(e, t, n, r, i) {
	return e === t ? !0 : e == null || t == null || !w(e) && !w(t) ? e !== e && t !== t : ha(e, t, n, r, ga, i);
}
//#endregion
//#region node_modules/lodash-es/now.js
var _a = function() {
	return f.Date.now();
}, va = "Expected a function", ya = Math.max, ba = Math.min;
function xa(e, t, n) {
	var r, i, a, o, s, c, l = 0, u = !1, d = !1, f = !0;
	if (typeof e != "function") throw TypeError(va);
	t = fe(t) || 0, E(n) && (u = !!n.leading, d = "maxWait" in n, a = d ? ya(fe(n.maxWait) || 0, t) : a, f = "trailing" in n ? !!n.trailing : f);
	function p(t) {
		var n = r, a = i;
		return r = i = void 0, l = t, o = e.apply(a, n), o;
	}
	function m(e) {
		return l = e, s = setTimeout(_, t), u ? p(e) : o;
	}
	function h(e) {
		var n = e - c, r = e - l, i = t - n;
		return d ? ba(i, a - r) : i;
	}
	function g(e) {
		var n = e - c, r = e - l;
		return c === void 0 || n >= t || n < 0 || d && r >= a;
	}
	function _() {
		var e = _a();
		if (g(e)) return v(e);
		s = setTimeout(_, h(e));
	}
	function v(e) {
		return s = void 0, f && r ? p(e) : (r = i = void 0, o);
	}
	function y() {
		s !== void 0 && clearTimeout(s), l = 0, r = c = i = s = void 0;
	}
	function b() {
		return s === void 0 ? o : v(_a());
	}
	function x() {
		var e = _a(), n = g(e);
		if (r = arguments, i = this, c = e, n) {
			if (s === void 0) return m(c);
			if (d) return clearTimeout(s), s = setTimeout(_, t), p(c);
		}
		return s === void 0 && (s = setTimeout(_, t)), o;
	}
	return x.cancel = y, x.flush = b, x;
}
//#endregion
//#region node_modules/lodash-es/isEqual.js
function Sa(e, t) {
	return ga(e, t);
}
//#endregion
//#region node_modules/lodash-es/throttle.js
var Ca = "Expected a function";
function wa(e, t, n) {
	var r = !0, i = !0;
	if (typeof e != "function") throw TypeError(Ca);
	return E(n) && (r = "leading" in n ? !!n.leading : r, i = "trailing" in n ? !!n.trailing : i), xa(e, t, {
		leading: r,
		maxWait: t,
		trailing: i
	});
}
//#endregion
//#region node_modules/comlink/dist/esm/comlink.mjs
var Ta = Symbol("Comlink.proxy"), Ea = Symbol("Comlink.endpoint"), Da = Symbol("Comlink.releaseProxy"), Oa = Symbol("Comlink.finalizer"), ka = Symbol("Comlink.thrown"), Aa = (e) => typeof e == "object" && !!e || typeof e == "function", ja = new Map([["proxy", {
	canHandle: (e) => Aa(e) && e[Ta],
	serialize(e) {
		let { port1: t, port2: n } = new MessageChannel();
		return Na(e, t), [n, [n]];
	},
	deserialize(e) {
		return e.start(), Ia(e);
	}
}], ["throw", {
	canHandle: (e) => Aa(e) && ka in e,
	serialize({ value: e }) {
		let t;
		return t = e instanceof Error ? {
			isError: !0,
			value: {
				message: e.message,
				name: e.name,
				stack: e.stack
			}
		} : {
			isError: !1,
			value: e
		}, [t, []];
	},
	deserialize(e) {
		throw e.isError ? Object.assign(Error(e.value.message), e.value) : e.value;
	}
}]]);
function Ma(e, t) {
	for (let n of e) if (t === n || n === "*" || n instanceof RegExp && n.test(t)) return !0;
	return !1;
}
function Na(e, t = globalThis, n = ["*"]) {
	t.addEventListener("message", function r(i) {
		if (!i || !i.data) return;
		if (!Ma(n, i.origin)) {
			console.warn(`Invalid origin '${i.origin}' for comlink proxy`);
			return;
		}
		let { id: a, type: o, path: s } = Object.assign({ path: [] }, i.data), c = (i.data.argumentList || []).map(Xa), l;
		try {
			let t = s.slice(0, -1).reduce((e, t) => e[t], e), n = s.reduce((e, t) => e[t], e);
			switch (o) {
				case "GET":
					l = n;
					break;
				case "SET":
					t[s.slice(-1)[0]] = Xa(i.data.value), l = !0;
					break;
				case "APPLY":
					l = n.apply(t, c);
					break;
				case "CONSTRUCT":
					l = Ja(new n(...c));
					break;
				case "ENDPOINT":
					{
						let { port1: t, port2: n } = new MessageChannel();
						Na(e, n), l = qa(t, [t]);
					}
					break;
				case "RELEASE":
					l = void 0;
					break;
				default: return;
			}
		} catch (e) {
			l = {
				value: e,
				[ka]: 0
			};
		}
		Promise.resolve(l).catch((e) => ({
			value: e,
			[ka]: 0
		})).then((n) => {
			let [i, s] = Ya(n);
			t.postMessage(Object.assign(Object.assign({}, i), { id: a }), s), o === "RELEASE" && (t.removeEventListener("message", r), Fa(t), Oa in e && typeof e[Oa] == "function" && e[Oa]());
		}).catch((e) => {
			let [n, r] = Ya({
				value: /* @__PURE__ */ TypeError("Unserializable return value"),
				[ka]: 0
			});
			t.postMessage(Object.assign(Object.assign({}, n), { id: a }), r);
		});
	}), t.start && t.start();
}
function Pa(e) {
	return e.constructor.name === "MessagePort";
}
function Fa(e) {
	Pa(e) && e.close();
}
function Ia(e, t) {
	let n = /* @__PURE__ */ new Map();
	return e.addEventListener("message", function(e) {
		let { data: t } = e;
		if (!t || !t.id) return;
		let r = n.get(t.id);
		if (r) try {
			r(t);
		} finally {
			n.delete(t.id);
		}
	}), Ua(e, n, [], t);
}
function La(e) {
	if (e) throw Error("Proxy has been released and is not useable");
}
function Ra(e) {
	return Za(e, /* @__PURE__ */ new Map(), { type: "RELEASE" }).then(() => {
		Fa(e);
	});
}
var za = /* @__PURE__ */ new WeakMap(), Ba = "FinalizationRegistry" in globalThis && new FinalizationRegistry((e) => {
	let t = (za.get(e) || 0) - 1;
	za.set(e, t), t === 0 && Ra(e);
});
function Va(e, t) {
	let n = (za.get(t) || 0) + 1;
	za.set(t, n), Ba && Ba.register(e, t, e);
}
function Ha(e) {
	Ba && Ba.unregister(e);
}
function Ua(e, t, n = [], r = function() {}) {
	let i = !1, a = new Proxy(r, {
		get(r, o) {
			if (La(i), o === Da) return () => {
				Ha(a), Ra(e), t.clear(), i = !0;
			};
			if (o === "then") {
				if (n.length === 0) return { then: () => a };
				let r = Za(e, t, {
					type: "GET",
					path: n.map((e) => e.toString())
				}).then(Xa);
				return r.then.bind(r);
			}
			return Ua(e, t, [...n, o]);
		},
		set(r, a, o) {
			La(i);
			let [s, c] = Ya(o);
			return Za(e, t, {
				type: "SET",
				path: [...n, a].map((e) => e.toString()),
				value: s
			}, c).then(Xa);
		},
		apply(r, a, o) {
			La(i);
			let s = n[n.length - 1];
			if (s === Ea) return Za(e, t, { type: "ENDPOINT" }).then(Xa);
			if (s === "bind") return Ua(e, t, n.slice(0, -1));
			let [c, l] = Ga(o);
			return Za(e, t, {
				type: "APPLY",
				path: n.map((e) => e.toString()),
				argumentList: c
			}, l).then(Xa);
		},
		construct(r, a) {
			La(i);
			let [o, s] = Ga(a);
			return Za(e, t, {
				type: "CONSTRUCT",
				path: n.map((e) => e.toString()),
				argumentList: o
			}, s).then(Xa);
		}
	});
	return Va(a, e), a;
}
function Wa(e) {
	return Array.prototype.concat.apply([], e);
}
function Ga(e) {
	let t = e.map(Ya);
	return [t.map((e) => e[0]), Wa(t.map((e) => e[1]))];
}
var Ka = /* @__PURE__ */ new WeakMap();
function qa(e, t) {
	return Ka.set(e, t), e;
}
function Ja(e) {
	return Object.assign(e, { [Ta]: !0 });
}
function Ya(e) {
	for (let [t, n] of ja) if (n.canHandle(e)) {
		let [r, i] = n.serialize(e);
		return [{
			type: "HANDLER",
			name: t,
			value: r
		}, i];
	}
	return [{
		type: "RAW",
		value: e
	}, Ka.get(e) || []];
}
function Xa(e) {
	switch (e.type) {
		case "HANDLER": return ja.get(e.name).deserialize(e.value);
		case "RAW": return e.value;
	}
}
function Za(e, t, n, r) {
	return new Promise((i) => {
		let a = Qa();
		t.set(a, i), e.start && e.start(), e.postMessage(Object.assign({ id: a }, n), r);
	});
}
function Qa() {
	return [
		,
		,
		,
		,
	].fill(0).map(() => Math.floor(Math.random() * (2 ** 53 - 1)).toString(16)).join("-");
}
//#endregion
//#region node_modules/@allmaps/stdlib/dist/fetch.js
async function $a(e, t, n) {
	let r;
	if (r = typeof n == "function" ? await n(e, t) : await fetch(e, t), !r.ok) {
		let t = await r.json();
		throw t && t.error ? Error(t.error) : r.statusText ? Error(r.statusText) : r.status === 404 ? Error(`Not found: ${e} (404)`) : r.status === 500 ? Error("Internal server error (500)") : Error(`Failed to fetch: ${e} (${r.status})`);
	}
	return r;
}
async function eo(e, t, n) {
	return await (await $a(e, t, n)).json();
}
async function to(e, t, n) {
	return await eo(`${e}/info.json`, t, n);
}
//#endregion
//#region node_modules/monotone-chain-convex-hull/lib-esm/index.js
function no(e, t = {}) {
	let { sorted: n } = t;
	n || (e = e.slice().sort(io));
	let r = e.length, i = Array(r * 2), a = 0;
	for (let t = 0; t < r; t++) {
		let n = e[t];
		for (; a >= 2 && ro(i[a - 2], i[a - 1], n) <= 0;) a--;
		i[a++] = n;
	}
	let o = a + 1;
	for (let t = r - 2; t >= 0; t--) {
		let n = e[t];
		for (; a >= o && ro(i[a - 2], i[a - 1], n) <= 0;) a--;
		i[a++] = n;
	}
	return i.slice(0, a - 1);
}
function ro(e, t, n) {
	return (t[1] - e[1]) * (n[0] - e[0]) - (t[0] - e[0]) * (n[1] - e[1]);
}
function io(e, t) {
	return e[0] === t[0] ? e[1] - t[1] : e[0] - t[0];
}
//#endregion
//#region node_modules/@turf/clone/dist/esm/index.js
function ao(e) {
	if (!e) throw Error("geojson is required");
	switch (e.type) {
		case "Feature": return oo(e);
		case "FeatureCollection": return co(e);
		case "Point":
		case "LineString":
		case "Polygon":
		case "MultiPoint":
		case "MultiLineString":
		case "MultiPolygon":
		case "GeometryCollection": return lo(e);
		default: throw Error("unknown GeoJSON type");
	}
}
function oo(e) {
	let t = { type: "Feature" };
	return Object.keys(e).forEach((n) => {
		switch (n) {
			case "type":
			case "properties":
			case "geometry": return;
			default: t[n] = e[n];
		}
	}), t.properties = so(e.properties), e.geometry == null ? t.geometry = null : t.geometry = lo(e.geometry), t;
}
function so(e) {
	let t = {};
	return e && Object.keys(e).forEach((n) => {
		let r = e[n];
		typeof r == "object" ? r === null ? t[n] = null : Array.isArray(r) ? t[n] = r.map((e) => e) : t[n] = so(r) : t[n] = r;
	}), t;
}
function co(e) {
	let t = { type: "FeatureCollection" };
	return Object.keys(e).forEach((n) => {
		switch (n) {
			case "type":
			case "features": return;
			default: t[n] = e[n];
		}
	}), t.features = e.features.map((e) => oo(e)), t;
}
function lo(e) {
	let t = { type: e.type };
	return e.bbox && (t.bbox = e.bbox), e.type === "GeometryCollection" ? (t.geometries = e.geometries.map((e) => lo(e)), t) : (t.coordinates = uo(e.coordinates), t);
}
function uo(e) {
	let t = e;
	return typeof t[0] == "object" ? t.map((e) => uo(e)) : t.slice();
}
//#endregion
//#region node_modules/@turf/helpers/dist/esm/index.js
var fo = 6371008.8, po = {
	centimeters: fo * 100,
	centimetres: fo * 100,
	degrees: 360 / (2 * Math.PI),
	feet: fo * 3.28084,
	inches: fo * 39.37,
	kilometers: fo / 1e3,
	kilometres: fo / 1e3,
	meters: fo,
	metres: fo,
	miles: fo / 1609.344,
	millimeters: fo * 1e3,
	millimetres: fo * 1e3,
	nauticalmiles: fo / 1852,
	radians: 1,
	yards: fo * 1.0936
};
function mo(e, t, n = {}) {
	let r = { type: "Feature" };
	return (n.id === 0 || n.id) && (r.id = n.id), n.bbox && (r.bbox = n.bbox), r.properties = t || {}, r.geometry = e, r;
}
function ho(e, t, n = {}) {
	if (!e) throw Error("coordinates is required");
	if (!Array.isArray(e)) throw Error("coordinates must be an Array");
	if (e.length < 2) throw Error("coordinates must be at least 2 numbers long");
	if (!xo(e[0]) || !xo(e[1])) throw Error("coordinates must contain numbers");
	return mo({
		type: "Point",
		coordinates: e
	}, t, n);
}
function go(e, t = {}) {
	let n = { type: "FeatureCollection" };
	return t.id && (n.id = t.id), t.bbox && (n.bbox = t.bbox), n.features = e, n;
}
function _o(e, t = "kilometers") {
	let n = po[t];
	if (!n) throw Error(t + " units is invalid");
	return e * n;
}
function vo(e, t = "kilometers") {
	let n = po[t];
	if (!n) throw Error(t + " units is invalid");
	return e / n;
}
function yo(e) {
	return e % (2 * Math.PI) * 180 / Math.PI;
}
function bo(e) {
	return e % 360 * Math.PI / 180;
}
function xo(e) {
	return !isNaN(e) && e !== null && !Array.isArray(e);
}
function So(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
//#endregion
//#region node_modules/@turf/invariant/dist/esm/index.js
function Co(e) {
	if (!e) throw Error("coord is required");
	if (!Array.isArray(e)) {
		if (e.type === "Feature" && e.geometry !== null && e.geometry.type === "Point") return [...e.geometry.coordinates];
		if (e.type === "Point") return [...e.coordinates];
	}
	if (Array.isArray(e) && e.length >= 2 && !Array.isArray(e[0]) && !Array.isArray(e[1])) return [...e];
	throw Error("coord must be GeoJSON Point or an Array of numbers");
}
function wo(e) {
	if (Array.isArray(e)) return e;
	if (e.type === "Feature") {
		if (e.geometry !== null) return e.geometry.coordinates;
	} else if (e.coordinates) return e.coordinates;
	throw Error("coords must be GeoJSON Feature, Geometry Object or an Array");
}
//#endregion
//#region node_modules/@turf/boolean-clockwise/dist/esm/index.js
function To(e) {
	let t = wo(e), n = 0, r = 1, i, a;
	for (; r < t.length;) i = a || t[0], a = t[r], n += (a[0] - i[0]) * (a[1] + i[1]), r++;
	return n > 0;
}
//#endregion
//#region node_modules/@turf/meta/dist/esm/index.js
function Eo(e, t) {
	if (e.type === "Feature") t(e, 0);
	else if (e.type === "FeatureCollection") for (var n = 0; n < e.features.length && t(e.features[n], n) !== !1; n++);
}
function Do(e, t) {
	var n, r, i, a, o, s, c, l, u, d, f = 0, p = e.type === "FeatureCollection", m = e.type === "Feature", h = p ? e.features.length : 1;
	for (n = 0; n < h; n++) {
		for (s = p ? e.features[n].geometry : m ? e.geometry : e, l = p ? e.features[n].properties : m ? e.properties : {}, u = p ? e.features[n].bbox : m ? e.bbox : void 0, d = p ? e.features[n].id : m ? e.id : void 0, c = s ? s.type === "GeometryCollection" : !1, o = c ? s.geometries.length : 1, i = 0; i < o; i++) {
			if (a = c ? s.geometries[i] : s, a === null) {
				if (t(null, f, l, u, d) === !1) return !1;
				continue;
			}
			switch (a.type) {
				case "Point":
				case "LineString":
				case "MultiPoint":
				case "Polygon":
				case "MultiLineString":
				case "MultiPolygon":
					if (t(a, f, l, u, d) === !1) return !1;
					break;
				case "GeometryCollection":
					for (r = 0; r < a.geometries.length; r++) if (t(a.geometries[r], f, l, u, d) === !1) return !1;
					break;
				default: throw Error("Unknown Geometry Type");
			}
		}
		f++;
	}
}
//#endregion
//#region node_modules/@turf/rewind/dist/esm/index.js
function Oo(e, t = {}) {
	if (t ||= {}, !So(t)) throw Error("options is invalid");
	let n = t.mutate ?? !1, r = t.reverse ?? !1;
	if (!e) throw Error("<geojson> is required");
	if (typeof r != "boolean") throw Error("<reverse> must be a boolean");
	if (typeof n != "boolean") throw Error("<mutate> must be a boolean");
	!n && e.type !== "Point" && e.type !== "MultiPoint" && (e = ao(e));
	let i = [];
	switch (e.type) {
		case "GeometryCollection": return Do(e, function(e) {
			ko(e, r);
		}), e;
		case "FeatureCollection": return Eo(e, function(e) {
			Eo(ko(e, r), function(e) {
				i.push(e);
			});
		}), go(i);
	}
	return ko(e, r);
}
function ko(e, t) {
	switch (e.type === "Feature" ? e.geometry.type : e.type) {
		case "GeometryCollection": return Do(e, function(e) {
			ko(e, t);
		}), e;
		case "LineString": return Ao(wo(e), t), e;
		case "Polygon": return jo(wo(e), t), e;
		case "MultiLineString": return wo(e).forEach(function(e) {
			Ao(e, t);
		}), e;
		case "MultiPolygon": return wo(e).forEach(function(e) {
			jo(e, t);
		}), e;
		case "Point":
		case "MultiPoint": return e;
	}
}
function Ao(e, t) {
	To(e) === t && e.reverse();
}
function jo(e, t) {
	To(e[0]) !== t && e[0].reverse();
	for (let n = 1; n < e.length; n++) To(e[n]) === t && e[n].reverse();
}
//#endregion
//#region node_modules/@allmaps/stdlib/dist/geometry.js
function Mo(e) {
	return Array.isArray(e) && e.length >= 2 && typeof e[0] == "number" && typeof e[1] == "number";
}
function No(e) {
	return Array.isArray(e) && e.every(Mo);
}
function Po(e) {
	return Array.isArray(e) && e.every(Mo);
}
function Fo(e) {
	return Array.isArray(e) && e.every(Po);
}
function Io(e) {
	return Array.isArray(e) && e.every(Mo);
}
function Lo(e) {
	return Array.isArray(e) && e.every(No);
}
function Ro(e) {
	return Array.isArray(e) && e.every(Fo);
}
function zo(e) {
	return [...e, e[0]];
}
function Bo(e) {
	return e.splice(-1), e;
}
function Vo(e) {
	return e.map((e) => zo(e));
}
function Ho(e) {
	return e.map((e) => Vo(e));
}
function Uo(e) {
	if (e = e.filter(function(e, t, n) {
		return t === 0 || !os(e, n[t - 1]);
	}), e.length < 2) throw Error("LineString should contain at least 2 points");
	return e;
}
function Wo(e) {
	if (e = e.filter(function(e, t, n) {
		return t === 0 || !os(e, n[t - 1]);
	}), as(e) && Bo(e), e.length < 3) throw Error("Ring should contain at least 3 points");
	return e;
}
function Go(e) {
	return e.map((e) => Wo(e));
}
function Ko(e) {
	return e.map((e) => Uo(e));
}
function qo(e) {
	return e.map((e) => Go(e));
}
function Jo(e) {
	return {
		type: "Point",
		coordinates: e
	};
}
function Yo(e) {
	return {
		type: "LineString",
		coordinates: e
	};
}
function Xo(e, t = !0) {
	return Oo({
		type: "Polygon",
		coordinates: t ? Vo(e) : e
	});
}
function Zo(e) {
	return {
		type: "MultiPoint",
		coordinates: e
	};
}
function Qo(e) {
	return {
		type: "MultiLineString",
		coordinates: e
	};
}
function $o(e, t = !0) {
	return Oo({
		type: "MultiPolygon",
		coordinates: t ? Ho(e) : e
	});
}
function es(e, t) {
	if (!t || !t.isMultiGeometry) {
		if (Mo(e)) return Jo(e);
		if (No(e)) return Yo(e);
		if (Fo(e)) return Xo(e);
		throw Error("Geometry type not supported");
	} else if (Io(e)) return Zo(e);
	else if (Lo(e)) return Qo(e);
	else if (Ro(e)) return $o(e);
	else throw Error("Geometry type not supported");
}
function ts(e) {
	return {
		type: "circle",
		coordinates: e
	};
}
function ns(e) {
	return {
		type: "polyline",
		coordinates: e
	};
}
function rs(e) {
	return {
		type: "polygon",
		coordinates: e[0]
	};
}
function is(e) {
	if (Mo(e)) return ts(e);
	if (No(e)) return ns(e);
	if (Fo(e)) return rs(e);
	throw Error("Unsupported GeoJSON Geometry");
}
function as(e) {
	return Array.isArray(e) && e.length >= 2 && os(e[0], e[e.length - 1]);
}
function os(e, t) {
	return e === t ? !0 : e === null || t === null ? !1 : e[0] === t[0] && e[1] === t[1];
}
function ss(e, t) {
	if (e.length !== t.length) throw Error("Point arrays should be of same length");
	return e.map((e, n) => [e, t[n]]);
}
function cs(e) {
	return e.reduce((t, n, r) => [...t, [n, e[(r + 1) % e.length]]], []);
}
function ls(e) {
	return [e[0], -e[1]];
}
function us(e, t, n) {
	return e * (1 - n) + t * n;
}
function ds(e, t, n) {
	return [us(e[0], t[0], n), us(e[1], t[1], n)];
}
function fs(e, t, n) {
	return e.map((e, r) => ds(e, t[r], n));
}
function ps(...e) {
	let t = [0, 0];
	for (let n = 0; n < e.length; n++) t[0] += e[n][0], t[1] += e[n][1];
	return t[0] /= e.length, t[1] /= e.length, t;
}
function ms(e) {
	return Math.atan2(e[1][1] - e[0][1], e[1][0] - e[0][0]);
}
function hs(e, t, n) {
	return [e[0] + Math.cos(n) * t, e[1] + Math.sin(n) * t];
}
function gs(e, t) {
	return Math.sqrt(_s(e, t));
}
function _s(e, t = [0, 0]) {
	return (t[0] - e[0]) ** 2 + (t[1] - e[1]) ** 2;
}
function vs(e, t) {
	if (e.length !== t.length) throw Error("Arrays need to be of same length");
	let n = e.map((e, n) => _s(e, t[n])), r = n.reduce((e, t) => e + t, 0) / n.length;
	return Math.sqrt(r);
}
function ys(e, t) {
	return t === 1 ? e : [e[0] * t, e[1] * t];
}
function bs(e, t) {
	return t === 1 ? e : e.map((e) => ys(e, t));
}
function xs(e, t, n = "add") {
	return n === "add" ? [e[0] + t[0], e[1] + t[1]] : [e[0] - t[0], e[1] - t[1]];
}
function Ss(e, t, n = "add") {
	return os(t, [0, 0]) ? e : e.map((e) => xs(e, t, n));
}
function Cs(e, t = 0, n = void 0, r, i) {
	return t === 0 || t === void 0 ? e : n ? xs(Cs(xs(e, n, "substract"), t, void 0, r, i), n) : (r ||= Math.cos(t), i ||= Math.sin(t), [e[0] * r - e[1] * i, e[0] * i + e[1] * r]);
}
function ws(e, t = 0, n = void 0, r, i) {
	return t === 0 || t === void 0 ? e : (r ||= Math.cos(t), i ||= Math.sin(t), e.map((e) => Cs(e, t, n, r, i)));
}
function Ts(e) {
	return [
		Es(e[0], e[1], e[2]),
		Es(e[1], e[2], e[0]),
		Es(e[2], e[0], e[1])
	];
}
function Es(e, t, n) {
	let r = gs(e, t), i = gs(t, n), a = gs(e, n);
	return Math.acos((r ** 2 + a ** 2 - i ** 2) / (2 * r * a));
}
//#endregion
//#region node_modules/@allmaps/stdlib/dist/geojson.js
function Ds(e) {
	return Array.isArray(e) && e.length >= 2 && e.every((e) => typeof e == "number");
}
function Os(e) {
	return Array.isArray(e) && e.every(Ds);
}
function ks(e) {
	return Array.isArray(e) && e.every(Ds);
}
function As(e) {
	return Array.isArray(e) && e.every(ks);
}
function js(e) {
	return Array.isArray(e) && e.every(Ds);
}
function Ms(e) {
	return Array.isArray(e) && e.every(Os);
}
function Ns(e) {
	return Array.isArray(e) && e.every(As);
}
function Ps(e) {
	return typeof e == "object" && !!e && "type" in e && e.type === "Point" && "coordinates" in e && Ds(e.coordinates);
}
function Fs(e) {
	return typeof e == "object" && !!e && "type" in e && e.type === "LineString" && "coordinates" in e && Os(e.coordinates);
}
function Is(e) {
	return typeof e == "object" && !!e && "type" in e && e.type === "Polygon" && "coordinates" in e && Array.isArray(e.coordinates) && As(e.coordinates);
}
function Ls(e) {
	return typeof e == "object" && !!e && "type" in e && e.type === "MultiPoint" && "coordinates" in e && js(e.coordinates);
}
function Rs(e) {
	return typeof e == "object" && !!e && "type" in e && e.type === "MultiLineString" && "coordinates" in e && Ms(e.coordinates);
}
function zs(e) {
	return typeof e == "object" && !!e && "type" in e && e.type === "MultiPolygon" && "coordinates" in e && Array.isArray(e.coordinates) && Ns(e.coordinates);
}
function Bs(e) {
	let t = typeof e == "object" && !!e, n = t && "type" in e && typeof e.type == "string" && (e.type === "Point" || e.type === "LineString" || e.type === "Polygon" || e.type === "MultiPoint" || e.type === "MultiLineString" || e.type === "MultiPolygon"), r = t && "coordinates" in e && Array.isArray(e.coordinates);
	return n && r;
}
function Vs(e) {
	return e.slice(0, 2);
}
function Hs(e) {
	return Vs(e.coordinates);
}
function Us(e) {
	return Uo(e.coordinates.map(Vs));
}
function Ws(e, t = !1) {
	let n = Go(e.coordinates.map((e) => e.map(Vs)));
	return t ? n.map((e) => [...e, e[0]]) : n;
}
function Gs(e) {
	return e.coordinates.map(Vs);
}
function Ks(e) {
	return Ko(e.coordinates.map((e) => e.map(Vs)));
}
function qs(e, t = !1) {
	let n = qo(e.coordinates.map((e) => e.map((e) => e.map(Vs))));
	return t ? n.map((e) => e.map((e) => [...e, e[0]])) : n;
}
function Js(e) {
	if (Ps(e)) return Hs(e);
	if (Fs(e)) return Us(e);
	if (Is(e)) return Ws(e);
	if (Ls(e)) return Gs(e);
	if (Rs(e)) return Ks(e);
	if (zs(e)) return qs(e);
	throw Error("Geometry type not supported");
}
function Ys(e, t) {
	return {
		type: "Feature",
		properties: t || {},
		geometry: e
	};
}
function Xs(e, t) {
	return {
		type: "FeatureCollection",
		features: e.map((e, n) => t ? Ys(e, t[n]) : Ys(e))
	};
}
function Zs(e) {
	return e.geometry;
}
function Qs(e) {
	return e.features.map(Zs);
}
//#endregion
//#region node_modules/@allmaps/stdlib/dist/bbox.js
var $s = [-180, -90], ec = [180, 90], tc = [-20037508.34, -20048966.1], nc = [20037508.34, 20048966.1];
function rc(e) {
	let t = Infinity, n = -Infinity;
	for (let r of e) t === void 0 ? r >= r && (t = n = r) : (t > r && (t = r), n < r && (n = r));
	return [t, n];
}
function ic(e, t, n) {
	return Math.max(Math.min(e, n), t);
}
function ac(e, t, n) {
	return [ic(e[0], t[0], n[0]), ic(e[1], t[1], n[1])];
}
function oc(e) {
	return ac(e, $s, ec);
}
function sc(e) {
	return ac(e, tc, nc);
}
function j(e, t) {
	if (Mo(e) && (e = [e]), Fo(e) && (e = e.flat()), Ro(e) && (e = e.flat()), Bs(e)) return j(Js(e), t);
	e = e, t?.clipLngLat && (e = e.map((e) => oc(e))), t?.clipWebMercator && (e = e.map((e) => sc(e)));
	let n = [], r = [];
	for (let t of e) n.push(t[0]), r.push(t[1]);
	let [i, a] = rc(n), [o, s] = rc(r);
	return [
		i,
		o,
		a,
		s
	];
}
function cc(e, t) {
	let n = e[2] >= t[0] && t[2] >= e[0], r = e[3] >= t[1] && t[3] >= e[1];
	return n && r;
}
function lc(e, t) {
	let n = Math.max(e[0], t[0]), r = Math.min(e[2], t[2]), i = Math.max(e[1], t[1]), a = Math.min(e[3], t[3]);
	if (n < r && i < a) return [
		n,
		i,
		r,
		a
	];
}
function uc(e, t, n) {
	return n === void 0 && (n = t), [
		e[0] - t,
		e[1] - n,
		e[2] + t,
		e[3] + n
	];
}
function dc(e, t) {
	return !t || t === 0 ? e : uc(e, ...mc(e).map((e) => e * t / 2));
}
function fc(e) {
	return [
		[e[0], e[1]],
		[e[2], e[1]],
		[e[2], e[3]],
		[e[0], e[3]]
	];
}
function pc(e) {
	return [(e[0] + e[2]) / 2, (e[1] + e[3]) / 2];
}
function mc(e) {
	return [e[2] - e[0], e[3] - e[1]];
}
function hc(e) {
	return [.5 * (gs(e[0], e[1]) + gs(e[2], e[3])), .5 * (gs(e[1], e[2]) + gs(e[3], e[0]))];
}
function gc(e) {
	if (e.length !== 0) return no(e);
}
function _c(e, t, n) {
	return n ? n === "contain" ? e[0] / e[1] >= t[0] / t[1] ? e[0] / t[0] : e[1] / t[1] : e[0] / e[1] >= t[0] / t[1] ? e[1] / t[1] : e[0] / t[0] : Math.sqrt(e[0] * e[1] / (t[0] * t[1]));
}
function vc(e, t) {
	return [e[0] * t, e[1] * t];
}
function yc(e) {
	return e[0] * e[1];
}
function bc(e) {
	return [e[0] / 2, e[1] / 2];
}
function xc(e) {
	return [
		0,
		0,
		...e
	];
}
function Sc(e) {
	return fc(xc(e));
}
function Cc(e, t) {
	return _c(hc(e), hc(t));
}
//#endregion
//#region node_modules/@allmaps/stdlib/dist/cache.js
function wc(e, t, n, r = () => !0, i = () => !0) {
	if (e.has(t) && r(e.get(t))) return e.get(t);
	{
		let r = n();
		return i(r) && e.set(t, r), r;
	}
}
function Tc(e, t, n, r, i = () => !0, a = () => !0) {
	if (e.get(t)?.has(n) && i(e.get(t)?.get(n))) return e.get(t)?.get(n);
	{
		let i = r();
		return a(i) && (e.get(t) || e.set(t, /* @__PURE__ */ new Map()), e.get(t)?.set(n, i)), i;
	}
}
function Ec(e, t, n, r, i, a, o = () => !0, s = () => !0) {
	if (e.get(t)?.get(n)?.get(r)?.has(i) && o(e.get(t)?.get(n)?.get(r)?.get(i))) return e.get(t)?.get(n)?.get(r)?.get(i);
	{
		let o = a();
		return s(o) && (e.get(t) || e.set(t, /* @__PURE__ */ new Map()), e.get(t)?.get(n) || e.get(t)?.set(n, /* @__PURE__ */ new Map()), e.get(t)?.get(n)?.get(r) || e.get(t)?.get(n)?.set(r, /* @__PURE__ */ new Map()), e.get(t)?.get(n)?.get(r)?.set(i, o)), o;
	}
}
//#endregion
//#region node_modules/hex-rgb/index.js
var Dc = "a-f\\d", Oc = `#?[${Dc}]{3}[${Dc}]?`, kc = `#?[${Dc}]{6}([${Dc}]{2})?`, Ac = RegExp(`[^#${Dc}]`, "gi"), jc = RegExp(`^${Oc}$|^${kc}$`, "i");
function Mc(e, t = {}) {
	if (typeof e != "string" || Ac.test(e) || !jc.test(e)) throw TypeError("Expected a valid hex string");
	e = e.replace(/^#/, "");
	let n = 1;
	e.length === 8 && (n = Number.parseInt(e.slice(6, 8), 16) / 255, e = e.slice(0, 6)), e.length === 4 && (n = Number.parseInt(e.slice(3, 4).repeat(2), 16) / 255, e = e.slice(0, 3)), e.length === 3 && (e = e[0] + e[0] + e[1] + e[1] + e[2] + e[2]);
	let r = Number.parseInt(e, 16), i = r >> 16, a = r >> 8 & 255, o = r & 255, s = typeof t.alpha == "number" ? t.alpha : n;
	return t.format === "array" ? [
		i,
		a,
		o,
		s
	] : t.format === "css" ? `rgb(${i} ${a} ${o}${s === 1 ? "" : ` / ${Number((s * 100).toFixed(2))}%`})` : {
		red: i,
		green: a,
		blue: o,
		alpha: s
	};
}
//#endregion
//#region node_modules/@allmaps/stdlib/dist/color.js
function Nc(e) {
	return Mc(e, { format: "array" }).slice(0, 3);
}
function Pc(e) {
	let t = Mc(e, { format: "array" });
	return t[3] = 255, t;
}
function Fc(e) {
	return Nc(e).map((e) => e / 255);
}
function Ic(e) {
	return Pc(e).map((e) => e / 255);
}
//#endregion
//#region node_modules/@allmaps/stdlib/dist/main.js
function Lc(e, t, n = (e, t) => e == t) {
	if (e.length !== t.length) return !1;
	for (let r = 0; r < e.length; r++) if (!n(e[r], t[r])) return !1;
	return !0;
}
function Rc(e, t) {
	for (let n = 0; n < t.length; n++) if (e.indexOf(t[n]) === -1) return !1;
	return !0;
}
function zc(e, t) {
	return !e || !t || e.size !== t.size ? !1 : [...e].every((e) => t.has(e));
}
function Bc(e, t, n) {
	let r = {};
	if (n && n.length === 0) return r;
	let i = /* @__PURE__ */ new Map(), a = e ? Object.keys(e) : [];
	n && (a = a.filter((e) => n.includes(e)));
	let o = t ? Object.keys(t) : [];
	for (let e of o) Object.prototype.hasOwnProperty.call(t, e) && i.set(e, t[e]);
	for (let t of a) {
		if (!Object.prototype.hasOwnProperty.call(e, t)) continue;
		let n = e[t];
		(!i.has(t) || !Sa(n, i.get(t))) && (r[t] = n);
	}
	return r;
}
function Vc(e, t) {
	let n = Ni(e);
	for (let e of t) delete n[e];
	return n;
}
function Hc(e) {
	let t;
	try {
		t = new URL(e);
	} catch {
		return !1;
	}
	return t.protocol === "http:" || t.protocol === "https:";
}
//#endregion
//#region node_modules/@allmaps/stdlib/dist/matrix.js
function Uc(e, t, n = 0) {
	if (e <= 0 || t <= 0) throw Error("Empty ArrayMatrix not supported");
	let r = Array(e);
	for (let i = 0; i < e; i++) {
		let e = Array(t);
		for (let r = 0; r < t; r++) e[r] = n;
		r[i] = e;
	}
	return r;
}
function Wc(e) {
	return [e.length, e[0].length];
}
function Gc(e) {
	let t = e.length, n = Array(t);
	for (let r = 0; r < t; r++) n[r] = e[r].slice();
	return n;
}
function Kc(e, t, n, r) {
	let i = Wc(r), a = Gc(e);
	for (let e = 0; e < i[0]; e++) for (let o = 0; o < i[1]; o++) a[t + e][n + o] = r[e][o];
	return a;
}
function qc(e) {
	let t = e.length, n = e[0].length, r = Array(n);
	for (let i = 0; i < n; i++) {
		let n = Array(t);
		for (let r = 0; r < t; r++) n[r] = e[r][i];
		r[i] = n;
	}
	return r;
}
function Jc(e, t = 0) {
	let n = Wc(e), r = e.map((e) => e.map((e) => Wc(e))), i = qc(r.map((e) => e.map((e) => e[0]))), a = i[0];
	if (!i.every((e) => Lc(e, i[0]))) throw Error("The blocks, by block column, must have the same sequence of rows.");
	let o = [], s = 0;
	a.forEach((e) => {
		o.push(s), s += e;
	});
	let c = s, l = r.map((e) => e.map((e) => e[1])), u = l[0];
	if (!l.every((e) => Lc(e, u))) throw Error("The blocks, by block row, must have the same sequence of columns.");
	let d = [];
	s = 0, l[0].forEach((e) => {
		d.push(s), s += e;
	});
	let f = Uc(c, s, t);
	for (let t = 0; t < n[0]; t++) for (let r = 0; r < n[1]; r++) f = Kc(f, o[t], o[r], e[t][r]);
	return f;
}
//#endregion
//#region node_modules/@allmaps/stdlib/dist/options.js
function M(e, ...t) {
	return {
		...e,
		...N(...t)
	};
}
function N(...e) {
	let t = e.filter((e) => e != null);
	return t.length === 0 ? {} : t.length === 1 ? t[0] : Object.assign({}, ...t);
}
function Yc(...e) {
	let t = {};
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		if (r) for (let e in r) {
			let n = r[e];
			n !== void 0 && (t[e] = n);
		}
	}
	return t;
}
function Xc(e, ...t) {
	return {
		...e,
		...Yc(...t)
	};
}
function Zc(e, t) {
	if (!t || Object.keys(t).length === 0) return e;
	let n = {};
	for (let e in t) t[e] !== void 0 && (n[e] = t[e]);
	return {
		...e,
		...n
	};
}
function Qc(e) {
	if (e !== void 0) return e.reduce((e, t) => (e[t] = void 0, e), {});
}
function $c(e) {
	if (e === void 0) return;
	let t = /* @__PURE__ */ new Map();
	for (let n of e.keys()) {
		let r = e.get(n);
		t.set(n, Qc(r));
	}
	return t;
}
//#endregion
//#region node_modules/svg-parser/dist/svg-parser.esm.js
function el(e, t) {
	t === void 0 && (t = {});
	var n = t.offsetLine || 0, r = t.offsetColumn || 0, i = e.split("\n"), a = 0, o = i.map(function(e, t) {
		var n = a + e.length + 1, r = {
			start: a,
			end: n,
			line: t
		};
		return a = n, r;
	}), s = 0;
	function c(e, t) {
		return e.start <= t && t < e.end;
	}
	function l(e, t) {
		return {
			line: n + e.line,
			column: r + t - e.start,
			character: t
		};
	}
	function u(t, n) {
		typeof t == "string" && (t = e.indexOf(t, n || 0));
		for (var r = o[s], i = t >= r.end ? 1 : -1; r;) {
			if (c(r, t)) return l(r, t);
			s += i, r = o[s];
		}
	}
	return u;
}
function tl(e, t, n) {
	if (typeof n == "number") throw Error("locate takes a { startIndex, offsetLine, offsetColumn } object as the third argument");
	return el(e, n)(t, n && n.startIndex);
}
var nl = /[a-zA-Z0-9:_-]/, rl = /[\s\t\r\n]/, il = /['"]/;
function al(e, t) {
	for (var n = ""; t--;) n += e;
	return n;
}
function ol(e) {
	var t = "", n = [], r = s, i = null, a = null;
	function o(t) {
		var n = tl(e, y), r = n.line, i = n.column, a = e.slice(0, y), o = /(^|\n).*$/.exec(a)[0].replace(/\t/g, "  "), s = e.slice(y), c = /.*(\n|$)/.exec(s)[0], l = "" + o + c + "\n" + al(" ", o.length) + "^";
		throw Error(t + " (" + r + ":" + i + "). If this is valid SVG, it's probably a bug in svg-parser. Please raise an issue at https://github.com/Rich-Harris/svg-parser/issues – thanks!\n\n" + l);
	}
	function s() {
		for (; y < e.length && e[y] !== "<" || !nl.test(e[y + 1]);) t += e[y++];
		return c();
	}
	function c() {
		for (var t = ""; y < e.length && e[y] !== "<";) t += e[y++];
		return /\S/.test(t) && i.children.push({
			type: "text",
			value: t
		}), e[y] === "<" ? l : c;
	}
	function l() {
		var t = e[y];
		if (t === "?") return c;
		if (t === "!") {
			if (e.slice(y + 1, y + 3) === "--") return u;
			if (e.slice(y + 1, y + 8) === "[CDATA[") return d;
			if (/doctype/i.test(e.slice(y + 1, y + 8))) return c;
		}
		if (t === "/") return f;
		var r = {
			type: "element",
			tagName: p(),
			properties: {},
			children: []
		};
		i ? i.children.push(r) : a = r;
		for (var s; y < e.length && (s = m());) r.properties[s.name] = s.value;
		var l = !1;
		return e[y] === "/" && (y += 1, l = !0), e[y] !== ">" && o("Expected >"), l || (i = r, n.push(r)), c;
	}
	function u() {
		var t = e.indexOf("-->", y);
		return ~t || o("expected -->"), y = t + 2, c;
	}
	function d() {
		var t = e.indexOf("]]>", y);
		return ~t || o("expected ]]>"), i.children.push(e.slice(y + 7, t)), y = t + 2, c;
	}
	function f() {
		var t = p();
		return t || o("Expected tag name"), t !== i.tagName && o("Expected closing tag </" + t + "> to match opening tag <" + i.tagName + ">"), v(), e[y] !== ">" && o("Expected >"), n.pop(), i = n[n.length - 1], c;
	}
	function p() {
		for (var t = ""; y < e.length && nl.test(e[y]);) t += e[y++];
		return t;
	}
	function m() {
		if (!rl.test(e[y])) return null;
		v();
		var t = p();
		if (!t) return null;
		var n = !0;
		return v(), e[y] === "=" && (y += 1, v(), n = h(), !isNaN(n) && n.trim() !== "" && (n = +n)), {
			name: t,
			value: n
		};
	}
	function h() {
		return il.test(e[y]) ? _() : g();
	}
	function g() {
		var t = "";
		do {
			var n = e[y];
			if (n === " " || n === ">" || n === "/") return t;
			t += n, y += 1;
		} while (y < e.length);
		return t;
	}
	function _() {
		for (var t = e[y++], n = "", r = !1; y < e.length;) {
			var i = e[y++];
			if (i === t && !r) return n;
			i === "\\" && !r && (r = !0), n += r ? "\\" + i : i, r = !1;
		}
	}
	function v() {
		for (; y < e.length && rl.test(e[y]);) y += 1;
	}
	for (var y = s.length; y < e.length;) r || o("Unexpected character"), r = r(), y += 1;
	return r !== c && o("Unexpected end of input"), a.tagName === "svg" && (a.metadata = t), {
		type: "root",
		children: [a]
	};
}
//#endregion
//#region node_modules/@allmaps/stdlib/dist/svg.js
function sl(e) {
	return e.type === "circle";
}
function cl(e) {
	return e.type === "line";
}
function ll(e) {
	return e.type === "polyline";
}
function ul(e) {
	return e.type === "rect";
}
function dl(e) {
	return e.type === "polygon";
}
function* fl(e) {
	function* t(e) {
		if ("children" in e) for (let n of e.children) typeof n != "string" && (yield* t(n));
		yield e;
	}
	let n = ol(e);
	for (let e of t(n)) if ("tagName" in e && e.tagName !== "svg" && e.tagName !== "g") {
		let t = pl(e);
		t && (yield t);
	}
}
function pl(e) {
	let t = e?.tagName?.toLowerCase();
	if (t === "circle") return {
		type: "circle",
		coordinates: [P(e, "cx"), P(e, "cy")]
	};
	if (t === "line") return {
		type: "line",
		coordinates: [[P(e, "x1"), P(e, "y1")], [P(e, "x2"), P(e, "y2")]]
	};
	if (t === "polyline") return {
		type: "polyline",
		coordinates: ml(e)
	};
	if (t === "polygon") return {
		type: "polygon",
		coordinates: ml(e)
	};
	if (t === "rect") return {
		type: "rect",
		coordinates: [
			[P(e, "x"), P(e, "y")],
			[P(e, "x") + P(e, "width"), P(e, "y")],
			[P(e, "x") + P(e, "width"), P(e, "y") + P(e, "height")],
			[P(e, "x"), P(e, "y") + P(e, "height")],
			[P(e, "x"), P(e, "y")]
		]
	};
	throw Error(`Unsupported SVG element: ${t}`);
}
function P(e, t) {
	let n = e?.properties?.[t];
	return Number(n) || 0;
}
function ml(e) {
	let t = e?.properties?.points;
	return t ? String(t).trim().split(/\s+/).map((e) => {
		let t = e.split(",").map((e) => Number(e));
		return [t[0], t[1]];
	}) : [];
}
function hl(e) {
	return e.map((e) => e.join(",")).join(" ");
}
function gl(e) {
	return `<svg xmlns="http://www.w3.org/2000/svg">
  ${e.map(_l).join("\n")}
</svg>`;
}
function _l(e) {
	if (e.type === "circle") return vl("circle", {
		...e.attributes,
		cx: e.coordinates[0],
		cy: e.coordinates[1]
	});
	if (e.type === "line") return vl("line", {
		...e.attributes,
		x1: e.coordinates[0][0],
		y1: e.coordinates[0][1],
		x2: e.coordinates[1][0],
		y2: e.coordinates[1][1]
	});
	if (e.type === "polyline") return vl("polyline", {
		...e.attributes,
		points: hl(e.coordinates)
	});
	if (e.type === "polygon") return vl("polygon", {
		...e.attributes,
		points: hl(e.coordinates)
	});
	if (e.type === "rect") return vl("rect", {
		...e.attributes,
		x: e.coordinates[0][0],
		y: e.coordinates[0][1],
		width: e.coordinates[1][0] - e.coordinates[0][0],
		height: e.coordinates[2][1] - e.coordinates[0][1]
	});
	throw Error("Unknown SVG element");
}
function vl(e, t) {
	return `<${e} ${Object.entries(t).map(([e, t]) => `${e}="${t}"`).join(" ")} />`;
}
function yl(e) {
	if (sl(e) || cl(e) || ll(e)) return e.coordinates;
	if (ul(e) || dl(e)) return [e.coordinates];
	throw Error("Unsupported SVG geometry");
}
//#endregion
//#region node_modules/@allmaps/transform/dist/shared/distortion.js
var bl = [
	"log2sigma",
	"twoOmega",
	"airyKavr",
	"signDetJ",
	"thetaa"
];
function xl(e, t, n, r = 1) {
	if (e.length === 0) return /* @__PURE__ */ new Map();
	if (!t || !n) return new Map(e.map((e) => [e, 0]));
	let { E: i, F: a, a: o, b: s } = Sl(t, n);
	return new Map(e.map((e) => {
		if (bl.indexOf(e) === -1) throw Error("Distortion " + e + " not supported");
		switch (bl.indexOf(e)) {
			case 0: return [e, Cl(o, s, r)];
			case 1: return [e, wl(o, s)];
			case 2: return [e, Tl(o, s, r)];
			case 3: return [e, El(t, n)];
			case 4: return [e, Dl(t, o, s, i, a)];
			default: return [e, 0];
		}
	}));
}
function Sl(e, t) {
	let n = e[0] ** 2 + e[1] ** 2, r = e[0] * t[0] + e[1] * t[1], i = t[0] ** 2 + t[1] ** 2;
	return {
		E: n,
		F: r,
		G: i,
		a: Math.sqrt(.5 * (n + i + Math.sqrt((n - i) ** 2 + 4 * r ** 2))),
		b: Math.sqrt(.5 * (n + i - Math.sqrt((n - i) ** 2 + 4 * r ** 2)))
	};
}
function Cl(e, t, n = 1) {
	return (Math.log(e * t) - 2 * Math.log(n)) / Math.log(2);
}
function wl(e, t) {
	return 2 * Math.asin((e - t) / (e + t));
}
function Tl(e, t, n = 1) {
	return .5 * (Math.log(e / n) ** 2 + Math.log(t / n) ** 2);
}
function El(e, t) {
	return Math.sign(e[0] * t[1] - e[1] * t[0]);
}
function Dl(e, t, n, r, i) {
	return Math.atan(e[1] / e[0]) - Math.sign(-i) * Math.asin(Math.sqrt((1 - t ** 2 / r) / (1 - (t / n) ** 2)));
}
//#endregion
//#region node_modules/@allmaps/transform/dist/transformation-types/BaseTransformation.js
var Ol = class {
	sourcePoints;
	destinationPoints;
	destinationTransformedSourcePoints;
	type;
	pointCount;
	pointCountMinimum;
	errors;
	rmse;
	constructor(e, t, n, r) {
		if (this.sourcePoints = e, this.destinationPoints = t, this.pointCount = this.sourcePoints.length, this.type = n, this.pointCountMinimum = r, this.pointCount < this.pointCountMinimum) throw Error("Not enough control points. A " + this.type + " transformation requires a minimum of " + this.pointCountMinimum + " points, but " + this.pointCount + " are given.");
	}
	setWeightsArrays(e) {
		this.weightsArrays = e, this.processWeightsArrays();
	}
	processWeightsArrays() {}
	getDestinationTransformedSourcePoints() {
		return this.destinationTransformedSourcePoints ||= this.sourcePoints.map((e) => this.evaluateFunction(e)), this.destinationTransformedSourcePoints;
	}
	getMeasures() {
		return {};
	}
	getErrors() {
		if (!this.errors) {
			let e = this.getDestinationTransformedSourcePoints();
			this.errors = this.destinationPoints.map((t, n) => gs(t, e[n]));
		}
		return this.errors;
	}
	getRmse() {
		if (!this.rmse) {
			let e = this.getDestinationTransformedSourcePoints();
			this.destinationTransformedSourcePoints || this.getDestinationTransformedSourcePoints(), this.rmse = vs(this.destinationPoints, e);
		}
		return this.rmse;
	}
}, kl = class extends Ol {
	destinationPointsArrays;
	constructor(e, t, n, r) {
		super(e, t, n, r), this.destinationPointsArrays = this.getDestinationPointsArrays();
	}
}, Al = /* @__PURE__ */ r({ isAnyArray: () => jl });
function jl(e) {
	let t = Ml.call(e);
	return t.endsWith("Array]") && !t.includes("Big");
}
var Ml, Nl = n((() => {
	Ml = Object.prototype.toString;
}));
//#endregion
//#region node_modules/ml-array-max/lib-es6/index.js
function Pl(e) {
	var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
	if (!jl(e)) throw TypeError("input must be an array");
	if (e.length === 0) throw TypeError("input must not be empty");
	var n = t.fromIndex, r = n === void 0 ? 0 : n, i = t.toIndex, a = i === void 0 ? e.length : i;
	if (r < 0 || r >= e.length || !Number.isInteger(r)) throw Error("fromIndex must be a positive integer smaller than length");
	if (a <= r || a > e.length || !Number.isInteger(a)) throw Error("toIndex must be an integer greater than fromIndex and at most equal to length");
	for (var o = e[r], s = r + 1; s < a; s++) e[s] > o && (o = e[s]);
	return o;
}
var Fl = n((() => {
	Nl();
}));
//#endregion
//#region node_modules/ml-array-min/lib-es6/index.js
function Il(e) {
	var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
	if (!jl(e)) throw TypeError("input must be an array");
	if (e.length === 0) throw TypeError("input must not be empty");
	var n = t.fromIndex, r = n === void 0 ? 0 : n, i = t.toIndex, a = i === void 0 ? e.length : i;
	if (r < 0 || r >= e.length || !Number.isInteger(r)) throw Error("fromIndex must be a positive integer smaller than length");
	if (a <= r || a > e.length || !Number.isInteger(a)) throw Error("toIndex must be an integer greater than fromIndex and at most equal to length");
	for (var o = e[r], s = r + 1; s < a; s++) e[s] < o && (o = e[s]);
	return o;
}
var Ll = n((() => {
	Nl();
})), Rl = /* @__PURE__ */ r({ default: () => zl });
function zl(e) {
	var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
	if (!jl(e)) throw TypeError("input must be an array");
	if (e.length === 0) throw TypeError("input must not be empty");
	var n;
	if (t.output !== void 0) {
		if (!jl(t.output)) throw TypeError("output option must be an array if specified");
		n = t.output;
	} else n = Array(e.length);
	var r = Il(e), i = Pl(e);
	if (r === i) throw RangeError("minimum and maximum input values are equal. Cannot rescale a constant array");
	var a = t.min, o = a === void 0 ? t.autoMinMax ? r : 0 : a, s = t.max, c = s === void 0 ? t.autoMinMax ? i : 1 : s;
	if (o >= c) throw RangeError("min option must be smaller than max option");
	for (var l = (c - o) / (i - r), u = 0; u < e.length; u++) n[u] = (e[u] - r) * l + o;
	return n;
}
var Bl = n((() => {
	Nl(), Fl(), Ll();
})), Vl = /* @__PURE__ */ e((/* @__PURE__ */ i(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var n = (Nl(), t(Al)), r = (Bl(), t(Rl)), i = " ".repeat(2), a = " ".repeat(4);
	function o() {
		return s(this);
	}
	function s(e, t = {}) {
		let { maxRows: n = 15, maxColumns: r = 10, maxNumSize: o = 8, padMinus: s = "auto" } = t;
		return `${e.constructor.name} {
${i}[
${a}${c(e, n, r, o, s)}
${i}]
${i}rows: ${e.rows}
${i}columns: ${e.columns}
}`;
	}
	function c(e, t, n, r, i) {
		let { rows: o, columns: s } = e, c = Math.min(o, t), u = Math.min(s, n), d = [];
		if (i === "auto") {
			i = !1;
			loop: for (let t = 0; t < c; t++) for (let n = 0; n < u; n++) if (e.get(t, n) < 0) {
				i = !0;
				break loop;
			}
		}
		for (let t = 0; t < c; t++) {
			let n = [];
			for (let a = 0; a < u; a++) n.push(l(e.get(t, a), r, i));
			d.push(`${n.join(" ")}`);
		}
		return u !== s && (d[d.length - 1] += ` ... ${s - n} more columns`), c !== o && d.push(`... ${o - t} more rows`), d.join(`\n${a}`);
	}
	function l(e, t, n) {
		return (e >= 0 && n ? ` ${u(e, t - 1)}` : u(e, t)).padEnd(t);
	}
	function u(e, t) {
		let n = e.toString();
		if (n.length <= t) return n;
		let r = e.toFixed(t);
		if (r.length > t && (r = e.toFixed(Math.max(0, t - (r.length - t)))), r.length <= t && !r.startsWith("0.000") && !r.startsWith("-0.000")) return r;
		let i = e.toExponential(t);
		return i.length > t && (i = e.toExponential(Math.max(0, t - (i.length - t)))), i.slice(0);
	}
	function d(e, t) {
		e.prototype.add = function(e) {
			return typeof e == "number" ? this.addS(e) : this.addM(e);
		}, e.prototype.addS = function(e) {
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) + e);
			return this;
		}, e.prototype.addM = function(e) {
			if (e = t.checkMatrix(e), this.rows !== e.rows || this.columns !== e.columns) throw RangeError("Matrices dimensions must be equal");
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) + e.get(t, n));
			return this;
		}, e.add = function(e, n) {
			return new t(e).add(n);
		}, e.prototype.sub = function(e) {
			return typeof e == "number" ? this.subS(e) : this.subM(e);
		}, e.prototype.subS = function(e) {
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) - e);
			return this;
		}, e.prototype.subM = function(e) {
			if (e = t.checkMatrix(e), this.rows !== e.rows || this.columns !== e.columns) throw RangeError("Matrices dimensions must be equal");
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) - e.get(t, n));
			return this;
		}, e.sub = function(e, n) {
			return new t(e).sub(n);
		}, e.prototype.subtract = e.prototype.sub, e.prototype.subtractS = e.prototype.subS, e.prototype.subtractM = e.prototype.subM, e.subtract = e.sub, e.prototype.mul = function(e) {
			return typeof e == "number" ? this.mulS(e) : this.mulM(e);
		}, e.prototype.mulS = function(e) {
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) * e);
			return this;
		}, e.prototype.mulM = function(e) {
			if (e = t.checkMatrix(e), this.rows !== e.rows || this.columns !== e.columns) throw RangeError("Matrices dimensions must be equal");
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) * e.get(t, n));
			return this;
		}, e.mul = function(e, n) {
			return new t(e).mul(n);
		}, e.prototype.multiply = e.prototype.mul, e.prototype.multiplyS = e.prototype.mulS, e.prototype.multiplyM = e.prototype.mulM, e.multiply = e.mul, e.prototype.div = function(e) {
			return typeof e == "number" ? this.divS(e) : this.divM(e);
		}, e.prototype.divS = function(e) {
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) / e);
			return this;
		}, e.prototype.divM = function(e) {
			if (e = t.checkMatrix(e), this.rows !== e.rows || this.columns !== e.columns) throw RangeError("Matrices dimensions must be equal");
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) / e.get(t, n));
			return this;
		}, e.div = function(e, n) {
			return new t(e).div(n);
		}, e.prototype.divide = e.prototype.div, e.prototype.divideS = e.prototype.divS, e.prototype.divideM = e.prototype.divM, e.divide = e.div, e.prototype.mod = function(e) {
			return typeof e == "number" ? this.modS(e) : this.modM(e);
		}, e.prototype.modS = function(e) {
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) % e);
			return this;
		}, e.prototype.modM = function(e) {
			if (e = t.checkMatrix(e), this.rows !== e.rows || this.columns !== e.columns) throw RangeError("Matrices dimensions must be equal");
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) % e.get(t, n));
			return this;
		}, e.mod = function(e, n) {
			return new t(e).mod(n);
		}, e.prototype.modulus = e.prototype.mod, e.prototype.modulusS = e.prototype.modS, e.prototype.modulusM = e.prototype.modM, e.modulus = e.mod, e.prototype.and = function(e) {
			return typeof e == "number" ? this.andS(e) : this.andM(e);
		}, e.prototype.andS = function(e) {
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) & e);
			return this;
		}, e.prototype.andM = function(e) {
			if (e = t.checkMatrix(e), this.rows !== e.rows || this.columns !== e.columns) throw RangeError("Matrices dimensions must be equal");
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) & e.get(t, n));
			return this;
		}, e.and = function(e, n) {
			return new t(e).and(n);
		}, e.prototype.or = function(e) {
			return typeof e == "number" ? this.orS(e) : this.orM(e);
		}, e.prototype.orS = function(e) {
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) | e);
			return this;
		}, e.prototype.orM = function(e) {
			if (e = t.checkMatrix(e), this.rows !== e.rows || this.columns !== e.columns) throw RangeError("Matrices dimensions must be equal");
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) | e.get(t, n));
			return this;
		}, e.or = function(e, n) {
			return new t(e).or(n);
		}, e.prototype.xor = function(e) {
			return typeof e == "number" ? this.xorS(e) : this.xorM(e);
		}, e.prototype.xorS = function(e) {
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) ^ e);
			return this;
		}, e.prototype.xorM = function(e) {
			if (e = t.checkMatrix(e), this.rows !== e.rows || this.columns !== e.columns) throw RangeError("Matrices dimensions must be equal");
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) ^ e.get(t, n));
			return this;
		}, e.xor = function(e, n) {
			return new t(e).xor(n);
		}, e.prototype.leftShift = function(e) {
			return typeof e == "number" ? this.leftShiftS(e) : this.leftShiftM(e);
		}, e.prototype.leftShiftS = function(e) {
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) << e);
			return this;
		}, e.prototype.leftShiftM = function(e) {
			if (e = t.checkMatrix(e), this.rows !== e.rows || this.columns !== e.columns) throw RangeError("Matrices dimensions must be equal");
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) << e.get(t, n));
			return this;
		}, e.leftShift = function(e, n) {
			return new t(e).leftShift(n);
		}, e.prototype.signPropagatingRightShift = function(e) {
			return typeof e == "number" ? this.signPropagatingRightShiftS(e) : this.signPropagatingRightShiftM(e);
		}, e.prototype.signPropagatingRightShiftS = function(e) {
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) >> e);
			return this;
		}, e.prototype.signPropagatingRightShiftM = function(e) {
			if (e = t.checkMatrix(e), this.rows !== e.rows || this.columns !== e.columns) throw RangeError("Matrices dimensions must be equal");
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) >> e.get(t, n));
			return this;
		}, e.signPropagatingRightShift = function(e, n) {
			return new t(e).signPropagatingRightShift(n);
		}, e.prototype.rightShift = function(e) {
			return typeof e == "number" ? this.rightShiftS(e) : this.rightShiftM(e);
		}, e.prototype.rightShiftS = function(e) {
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) >>> e);
			return this;
		}, e.prototype.rightShiftM = function(e) {
			if (e = t.checkMatrix(e), this.rows !== e.rows || this.columns !== e.columns) throw RangeError("Matrices dimensions must be equal");
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) >>> e.get(t, n));
			return this;
		}, e.rightShift = function(e, n) {
			return new t(e).rightShift(n);
		}, e.prototype.zeroFillRightShift = e.prototype.rightShift, e.prototype.zeroFillRightShiftS = e.prototype.rightShiftS, e.prototype.zeroFillRightShiftM = e.prototype.rightShiftM, e.zeroFillRightShift = e.rightShift, e.prototype.not = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, ~this.get(e, t));
			return this;
		}, e.not = function(e) {
			return new t(e).not();
		}, e.prototype.abs = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.abs(this.get(e, t)));
			return this;
		}, e.abs = function(e) {
			return new t(e).abs();
		}, e.prototype.acos = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.acos(this.get(e, t)));
			return this;
		}, e.acos = function(e) {
			return new t(e).acos();
		}, e.prototype.acosh = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.acosh(this.get(e, t)));
			return this;
		}, e.acosh = function(e) {
			return new t(e).acosh();
		}, e.prototype.asin = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.asin(this.get(e, t)));
			return this;
		}, e.asin = function(e) {
			return new t(e).asin();
		}, e.prototype.asinh = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.asinh(this.get(e, t)));
			return this;
		}, e.asinh = function(e) {
			return new t(e).asinh();
		}, e.prototype.atan = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.atan(this.get(e, t)));
			return this;
		}, e.atan = function(e) {
			return new t(e).atan();
		}, e.prototype.atanh = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.atanh(this.get(e, t)));
			return this;
		}, e.atanh = function(e) {
			return new t(e).atanh();
		}, e.prototype.cbrt = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.cbrt(this.get(e, t)));
			return this;
		}, e.cbrt = function(e) {
			return new t(e).cbrt();
		}, e.prototype.ceil = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.ceil(this.get(e, t)));
			return this;
		}, e.ceil = function(e) {
			return new t(e).ceil();
		}, e.prototype.clz32 = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.clz32(this.get(e, t)));
			return this;
		}, e.clz32 = function(e) {
			return new t(e).clz32();
		}, e.prototype.cos = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.cos(this.get(e, t)));
			return this;
		}, e.cos = function(e) {
			return new t(e).cos();
		}, e.prototype.cosh = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.cosh(this.get(e, t)));
			return this;
		}, e.cosh = function(e) {
			return new t(e).cosh();
		}, e.prototype.exp = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.exp(this.get(e, t)));
			return this;
		}, e.exp = function(e) {
			return new t(e).exp();
		}, e.prototype.expm1 = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.expm1(this.get(e, t)));
			return this;
		}, e.expm1 = function(e) {
			return new t(e).expm1();
		}, e.prototype.floor = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.floor(this.get(e, t)));
			return this;
		}, e.floor = function(e) {
			return new t(e).floor();
		}, e.prototype.fround = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.fround(this.get(e, t)));
			return this;
		}, e.fround = function(e) {
			return new t(e).fround();
		}, e.prototype.log = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.log(this.get(e, t)));
			return this;
		}, e.log = function(e) {
			return new t(e).log();
		}, e.prototype.log1p = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.log1p(this.get(e, t)));
			return this;
		}, e.log1p = function(e) {
			return new t(e).log1p();
		}, e.prototype.log10 = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.log10(this.get(e, t)));
			return this;
		}, e.log10 = function(e) {
			return new t(e).log10();
		}, e.prototype.log2 = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.log2(this.get(e, t)));
			return this;
		}, e.log2 = function(e) {
			return new t(e).log2();
		}, e.prototype.round = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.round(this.get(e, t)));
			return this;
		}, e.round = function(e) {
			return new t(e).round();
		}, e.prototype.sign = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.sign(this.get(e, t)));
			return this;
		}, e.sign = function(e) {
			return new t(e).sign();
		}, e.prototype.sin = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.sin(this.get(e, t)));
			return this;
		}, e.sin = function(e) {
			return new t(e).sin();
		}, e.prototype.sinh = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.sinh(this.get(e, t)));
			return this;
		}, e.sinh = function(e) {
			return new t(e).sinh();
		}, e.prototype.sqrt = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.sqrt(this.get(e, t)));
			return this;
		}, e.sqrt = function(e) {
			return new t(e).sqrt();
		}, e.prototype.tan = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.tan(this.get(e, t)));
			return this;
		}, e.tan = function(e) {
			return new t(e).tan();
		}, e.prototype.tanh = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.tanh(this.get(e, t)));
			return this;
		}, e.tanh = function(e) {
			return new t(e).tanh();
		}, e.prototype.trunc = function() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) this.set(e, t, Math.trunc(this.get(e, t)));
			return this;
		}, e.trunc = function(e) {
			return new t(e).trunc();
		}, e.pow = function(e, n) {
			return new t(e).pow(n);
		}, e.prototype.pow = function(e) {
			return typeof e == "number" ? this.powS(e) : this.powM(e);
		}, e.prototype.powS = function(e) {
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) ** e);
			return this;
		}, e.prototype.powM = function(e) {
			if (e = t.checkMatrix(e), this.rows !== e.rows || this.columns !== e.columns) throw RangeError("Matrices dimensions must be equal");
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) ** e.get(t, n));
			return this;
		};
	}
	function f(e, t, n) {
		let r = n ? e.rows : e.rows - 1;
		if (t < 0 || t > r) throw RangeError("Row index out of range");
	}
	function p(e, t, n) {
		let r = n ? e.columns : e.columns - 1;
		if (t < 0 || t > r) throw RangeError("Column index out of range");
	}
	function m(e, t) {
		if (t.to1DArray && (t = t.to1DArray()), t.length !== e.columns) throw RangeError("vector size must be the same as the number of columns");
		return t;
	}
	function h(e, t) {
		if (t.to1DArray && (t = t.to1DArray()), t.length !== e.rows) throw RangeError("vector size must be the same as the number of rows");
		return t;
	}
	function g(e, t) {
		if (!n.isAnyArray(t)) throw TypeError("row indices must be an array");
		for (let n = 0; n < t.length; n++) if (t[n] < 0 || t[n] >= e.rows) throw RangeError("row indices are out of range");
	}
	function _(e, t) {
		if (!n.isAnyArray(t)) throw TypeError("column indices must be an array");
		for (let n = 0; n < t.length; n++) if (t[n] < 0 || t[n] >= e.columns) throw RangeError("column indices are out of range");
	}
	function v(e, t, n, r, i) {
		if (arguments.length !== 5) throw RangeError("expected 4 arguments");
		if (b("startRow", t), b("endRow", n), b("startColumn", r), b("endColumn", i), t > n || r > i || t < 0 || t >= e.rows || n < 0 || n >= e.rows || r < 0 || r >= e.columns || i < 0 || i >= e.columns) throw RangeError("Submatrix indices are out of range");
	}
	function y(e, t = 0) {
		let n = [];
		for (let r = 0; r < e; r++) n.push(t);
		return n;
	}
	function b(e, t) {
		if (typeof t != "number") throw TypeError(`${e} must be a number`);
	}
	function x(e) {
		if (e.isEmpty()) throw Error("Empty matrix has no elements to index");
	}
	function S(e) {
		let t = y(e.rows);
		for (let n = 0; n < e.rows; ++n) for (let r = 0; r < e.columns; ++r) t[n] += e.get(n, r);
		return t;
	}
	function ee(e) {
		let t = y(e.columns);
		for (let n = 0; n < e.rows; ++n) for (let r = 0; r < e.columns; ++r) t[r] += e.get(n, r);
		return t;
	}
	function C(e) {
		let t = 0;
		for (let n = 0; n < e.rows; n++) for (let r = 0; r < e.columns; r++) t += e.get(n, r);
		return t;
	}
	function w(e) {
		let t = y(e.rows, 1);
		for (let n = 0; n < e.rows; ++n) for (let r = 0; r < e.columns; ++r) t[n] *= e.get(n, r);
		return t;
	}
	function te(e) {
		let t = y(e.columns, 1);
		for (let n = 0; n < e.rows; ++n) for (let r = 0; r < e.columns; ++r) t[r] *= e.get(n, r);
		return t;
	}
	function ne(e) {
		let t = 1;
		for (let n = 0; n < e.rows; n++) for (let r = 0; r < e.columns; r++) t *= e.get(n, r);
		return t;
	}
	function T(e, t, n) {
		let r = e.rows, i = e.columns, a = [];
		for (let o = 0; o < r; o++) {
			let r = 0, s = 0, c = 0;
			for (let t = 0; t < i; t++) c = e.get(o, t) - n[o], r += c, s += c * c;
			t ? a.push((s - r * r / i) / (i - 1)) : a.push((s - r * r / i) / i);
		}
		return a;
	}
	function re(e, t, n) {
		let r = e.rows, i = e.columns, a = [];
		for (let o = 0; o < i; o++) {
			let i = 0, s = 0, c = 0;
			for (let t = 0; t < r; t++) c = e.get(t, o) - n[o], i += c, s += c * c;
			t ? a.push((s - i * i / r) / (r - 1)) : a.push((s - i * i / r) / r);
		}
		return a;
	}
	function ie(e, t, n) {
		let r = e.rows, i = e.columns, a = r * i, o = 0, s = 0, c = 0;
		for (let t = 0; t < r; t++) for (let r = 0; r < i; r++) c = e.get(t, r) - n, o += c, s += c * c;
		return t ? (s - o * o / a) / (a - 1) : (s - o * o / a) / a;
	}
	function ae(e, t) {
		for (let n = 0; n < e.rows; n++) for (let r = 0; r < e.columns; r++) e.set(n, r, e.get(n, r) - t[n]);
	}
	function oe(e, t) {
		for (let n = 0; n < e.rows; n++) for (let r = 0; r < e.columns; r++) e.set(n, r, e.get(n, r) - t[r]);
	}
	function E(e, t) {
		for (let n = 0; n < e.rows; n++) for (let r = 0; r < e.columns; r++) e.set(n, r, e.get(n, r) - t);
	}
	function se(e) {
		let t = [];
		for (let n = 0; n < e.rows; n++) {
			let r = 0;
			for (let t = 0; t < e.columns; t++) r += e.get(n, t) ** 2 / (e.columns - 1);
			t.push(Math.sqrt(r));
		}
		return t;
	}
	function ce(e, t) {
		for (let n = 0; n < e.rows; n++) for (let r = 0; r < e.columns; r++) e.set(n, r, e.get(n, r) / t[n]);
	}
	function le(e) {
		let t = [];
		for (let n = 0; n < e.columns; n++) {
			let r = 0;
			for (let t = 0; t < e.rows; t++) r += e.get(t, n) ** 2 / (e.rows - 1);
			t.push(Math.sqrt(r));
		}
		return t;
	}
	function ue(e, t) {
		for (let n = 0; n < e.rows; n++) for (let r = 0; r < e.columns; r++) e.set(n, r, e.get(n, r) / t[r]);
	}
	function de(e) {
		let t = e.size - 1, n = 0;
		for (let r = 0; r < e.columns; r++) for (let i = 0; i < e.rows; i++) n += e.get(i, r) ** 2 / t;
		return Math.sqrt(n);
	}
	function fe(e, t) {
		for (let n = 0; n < e.rows; n++) for (let r = 0; r < e.columns; r++) e.set(n, r, e.get(n, r) / t);
	}
	var D = class e {
		static from1DArray(e, t, n) {
			if (e * t !== n.length) throw RangeError("data length does not match given dimensions");
			let r = new O(e, t);
			for (let i = 0; i < e; i++) for (let e = 0; e < t; e++) r.set(i, e, n[i * t + e]);
			return r;
		}
		static rowVector(e) {
			let t = new O(1, e.length);
			for (let n = 0; n < e.length; n++) t.set(0, n, e[n]);
			return t;
		}
		static columnVector(e) {
			let t = new O(e.length, 1);
			for (let n = 0; n < e.length; n++) t.set(n, 0, e[n]);
			return t;
		}
		static zeros(e, t) {
			return new O(e, t);
		}
		static ones(e, t) {
			return new O(e, t).fill(1);
		}
		static rand(e, t, n = {}) {
			if (typeof n != "object") throw TypeError("options must be an object");
			let { random: r = Math.random } = n, i = new O(e, t);
			for (let n = 0; n < e; n++) for (let e = 0; e < t; e++) i.set(n, e, r());
			return i;
		}
		static randInt(e, t, n = {}) {
			if (typeof n != "object") throw TypeError("options must be an object");
			let { min: r = 0, max: i = 1e3, random: a = Math.random } = n;
			if (!Number.isInteger(r)) throw TypeError("min must be an integer");
			if (!Number.isInteger(i)) throw TypeError("max must be an integer");
			if (r >= i) throw RangeError("min must be smaller than max");
			let o = i - r, s = new O(e, t);
			for (let n = 0; n < e; n++) for (let e = 0; e < t; e++) {
				let t = r + Math.round(a() * o);
				s.set(n, e, t);
			}
			return s;
		}
		static eye(e, t, n) {
			t === void 0 && (t = e), n === void 0 && (n = 1);
			let r = Math.min(e, t), i = this.zeros(e, t);
			for (let e = 0; e < r; e++) i.set(e, e, n);
			return i;
		}
		static diag(e, t, n) {
			let r = e.length;
			t === void 0 && (t = r), n === void 0 && (n = t);
			let i = Math.min(r, t, n), a = this.zeros(t, n);
			for (let t = 0; t < i; t++) a.set(t, t, e[t]);
			return a;
		}
		static min(e, t) {
			e = this.checkMatrix(e), t = this.checkMatrix(t);
			let n = e.rows, r = e.columns, i = new O(n, r);
			for (let a = 0; a < n; a++) for (let n = 0; n < r; n++) i.set(a, n, Math.min(e.get(a, n), t.get(a, n)));
			return i;
		}
		static max(e, t) {
			e = this.checkMatrix(e), t = this.checkMatrix(t);
			let n = e.rows, r = e.columns, i = new this(n, r);
			for (let a = 0; a < n; a++) for (let n = 0; n < r; n++) i.set(a, n, Math.max(e.get(a, n), t.get(a, n)));
			return i;
		}
		static checkMatrix(t) {
			return e.isMatrix(t) ? t : new O(t);
		}
		static isMatrix(e) {
			return e != null && e.klass === "Matrix";
		}
		get size() {
			return this.rows * this.columns;
		}
		apply(e) {
			if (typeof e != "function") throw TypeError("callback must be a function");
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) e.call(this, t, n);
			return this;
		}
		to1DArray() {
			let e = [];
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) e.push(this.get(t, n));
			return e;
		}
		to2DArray() {
			let e = [];
			for (let t = 0; t < this.rows; t++) {
				e.push([]);
				for (let n = 0; n < this.columns; n++) e[t].push(this.get(t, n));
			}
			return e;
		}
		toJSON() {
			return this.to2DArray();
		}
		isRowVector() {
			return this.rows === 1;
		}
		isColumnVector() {
			return this.columns === 1;
		}
		isVector() {
			return this.rows === 1 || this.columns === 1;
		}
		isSquare() {
			return this.rows === this.columns;
		}
		isEmpty() {
			return this.rows === 0 || this.columns === 0;
		}
		isSymmetric() {
			if (this.isSquare()) {
				for (let e = 0; e < this.rows; e++) for (let t = 0; t <= e; t++) if (this.get(e, t) !== this.get(t, e)) return !1;
				return !0;
			}
			return !1;
		}
		isDistance() {
			if (!this.isSymmetric()) return !1;
			for (let e = 0; e < this.rows; e++) if (this.get(e, e) !== 0) return !1;
			return !0;
		}
		isEchelonForm() {
			let e = 0, t = 0, n = -1, r = !0, i = !1;
			for (; e < this.rows && r;) {
				for (t = 0, i = !1; t < this.columns && i === !1;) this.get(e, t) === 0 ? t++ : this.get(e, t) === 1 && t > n ? (i = !0, n = t) : (r = !1, i = !0);
				e++;
			}
			return r;
		}
		isReducedEchelonForm() {
			let e = 0, t = 0, n = -1, r = !0, i = !1;
			for (; e < this.rows && r;) {
				for (t = 0, i = !1; t < this.columns && i === !1;) this.get(e, t) === 0 ? t++ : this.get(e, t) === 1 && t > n ? (i = !0, n = t) : (r = !1, i = !0);
				for (let n = t + 1; n < this.rows; n++) this.get(e, n) !== 0 && (r = !1);
				e++;
			}
			return r;
		}
		echelonForm() {
			let e = this.clone(), t = 0, n = 0;
			for (; t < e.rows && n < e.columns;) {
				let r = t;
				for (let i = t; i < e.rows; i++) e.get(i, n) > e.get(r, n) && (r = i);
				if (e.get(r, n) === 0) n++;
				else {
					e.swapRows(t, r);
					let i = e.get(t, n);
					for (let r = n; r < e.columns; r++) e.set(t, r, e.get(t, r) / i);
					for (let r = t + 1; r < e.rows; r++) {
						let i = e.get(r, n) / e.get(t, n);
						e.set(r, n, 0);
						for (let a = n + 1; a < e.columns; a++) e.set(r, a, e.get(r, a) - e.get(t, a) * i);
					}
					t++, n++;
				}
			}
			return e;
		}
		reducedEchelonForm() {
			let e = this.echelonForm(), t = e.columns, n = e.rows, r = n - 1;
			for (; r >= 0;) if (e.maxRow(r) === 0) r--;
			else {
				let i = 0, a = !1;
				for (; i < n && a === !1;) e.get(r, i) === 1 ? a = !0 : i++;
				for (let n = 0; n < r; n++) {
					let a = e.get(n, i);
					for (let o = i; o < t; o++) {
						let t = e.get(n, o) - a * e.get(r, o);
						e.set(n, o, t);
					}
				}
				r--;
			}
			return e;
		}
		set() {
			throw Error("set method is unimplemented");
		}
		get() {
			throw Error("get method is unimplemented");
		}
		repeat(e = {}) {
			if (typeof e != "object") throw TypeError("options must be an object");
			let { rows: t = 1, columns: n = 1 } = e;
			if (!Number.isInteger(t) || t <= 0) throw TypeError("rows must be a positive integer");
			if (!Number.isInteger(n) || n <= 0) throw TypeError("columns must be a positive integer");
			let r = new O(this.rows * t, this.columns * n);
			for (let e = 0; e < t; e++) for (let t = 0; t < n; t++) r.setSubMatrix(this, this.rows * e, this.columns * t);
			return r;
		}
		fill(e) {
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, e);
			return this;
		}
		neg() {
			return this.mulS(-1);
		}
		getRow(e) {
			f(this, e);
			let t = [];
			for (let n = 0; n < this.columns; n++) t.push(this.get(e, n));
			return t;
		}
		getRowVector(e) {
			return O.rowVector(this.getRow(e));
		}
		setRow(e, t) {
			f(this, e), t = m(this, t);
			for (let n = 0; n < this.columns; n++) this.set(e, n, t[n]);
			return this;
		}
		swapRows(e, t) {
			f(this, e), f(this, t);
			for (let n = 0; n < this.columns; n++) {
				let r = this.get(e, n);
				this.set(e, n, this.get(t, n)), this.set(t, n, r);
			}
			return this;
		}
		getColumn(e) {
			p(this, e);
			let t = [];
			for (let n = 0; n < this.rows; n++) t.push(this.get(n, e));
			return t;
		}
		getColumnVector(e) {
			return O.columnVector(this.getColumn(e));
		}
		setColumn(e, t) {
			p(this, e), t = h(this, t);
			for (let n = 0; n < this.rows; n++) this.set(n, e, t[n]);
			return this;
		}
		swapColumns(e, t) {
			p(this, e), p(this, t);
			for (let n = 0; n < this.rows; n++) {
				let r = this.get(n, e);
				this.set(n, e, this.get(n, t)), this.set(n, t, r);
			}
			return this;
		}
		addRowVector(e) {
			e = m(this, e);
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) + e[n]);
			return this;
		}
		subRowVector(e) {
			e = m(this, e);
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) - e[n]);
			return this;
		}
		mulRowVector(e) {
			e = m(this, e);
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) * e[n]);
			return this;
		}
		divRowVector(e) {
			e = m(this, e);
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) / e[n]);
			return this;
		}
		addColumnVector(e) {
			e = h(this, e);
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) + e[t]);
			return this;
		}
		subColumnVector(e) {
			e = h(this, e);
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) - e[t]);
			return this;
		}
		mulColumnVector(e) {
			e = h(this, e);
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) * e[t]);
			return this;
		}
		divColumnVector(e) {
			e = h(this, e);
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.set(t, n, this.get(t, n) / e[t]);
			return this;
		}
		mulRow(e, t) {
			f(this, e);
			for (let n = 0; n < this.columns; n++) this.set(e, n, this.get(e, n) * t);
			return this;
		}
		mulColumn(e, t) {
			p(this, e);
			for (let n = 0; n < this.rows; n++) this.set(n, e, this.get(n, e) * t);
			return this;
		}
		max(e) {
			if (this.isEmpty()) return NaN;
			switch (e) {
				case "row": {
					let e = Array(this.rows).fill(-Infinity);
					for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.get(t, n) > e[t] && (e[t] = this.get(t, n));
					return e;
				}
				case "column": {
					let e = Array(this.columns).fill(-Infinity);
					for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.get(t, n) > e[n] && (e[n] = this.get(t, n));
					return e;
				}
				case void 0: {
					let e = this.get(0, 0);
					for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.get(t, n) > e && (e = this.get(t, n));
					return e;
				}
				default: throw Error(`invalid option: ${e}`);
			}
		}
		maxIndex() {
			x(this);
			let e = this.get(0, 0), t = [0, 0];
			for (let n = 0; n < this.rows; n++) for (let r = 0; r < this.columns; r++) this.get(n, r) > e && (e = this.get(n, r), t[0] = n, t[1] = r);
			return t;
		}
		min(e) {
			if (this.isEmpty()) return NaN;
			switch (e) {
				case "row": {
					let e = Array(this.rows).fill(Infinity);
					for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.get(t, n) < e[t] && (e[t] = this.get(t, n));
					return e;
				}
				case "column": {
					let e = Array(this.columns).fill(Infinity);
					for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.get(t, n) < e[n] && (e[n] = this.get(t, n));
					return e;
				}
				case void 0: {
					let e = this.get(0, 0);
					for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) this.get(t, n) < e && (e = this.get(t, n));
					return e;
				}
				default: throw Error(`invalid option: ${e}`);
			}
		}
		minIndex() {
			x(this);
			let e = this.get(0, 0), t = [0, 0];
			for (let n = 0; n < this.rows; n++) for (let r = 0; r < this.columns; r++) this.get(n, r) < e && (e = this.get(n, r), t[0] = n, t[1] = r);
			return t;
		}
		maxRow(e) {
			if (f(this, e), this.isEmpty()) return NaN;
			let t = this.get(e, 0);
			for (let n = 1; n < this.columns; n++) this.get(e, n) > t && (t = this.get(e, n));
			return t;
		}
		maxRowIndex(e) {
			f(this, e), x(this);
			let t = this.get(e, 0), n = [e, 0];
			for (let r = 1; r < this.columns; r++) this.get(e, r) > t && (t = this.get(e, r), n[1] = r);
			return n;
		}
		minRow(e) {
			if (f(this, e), this.isEmpty()) return NaN;
			let t = this.get(e, 0);
			for (let n = 1; n < this.columns; n++) this.get(e, n) < t && (t = this.get(e, n));
			return t;
		}
		minRowIndex(e) {
			f(this, e), x(this);
			let t = this.get(e, 0), n = [e, 0];
			for (let r = 1; r < this.columns; r++) this.get(e, r) < t && (t = this.get(e, r), n[1] = r);
			return n;
		}
		maxColumn(e) {
			if (p(this, e), this.isEmpty()) return NaN;
			let t = this.get(0, e);
			for (let n = 1; n < this.rows; n++) this.get(n, e) > t && (t = this.get(n, e));
			return t;
		}
		maxColumnIndex(e) {
			p(this, e), x(this);
			let t = this.get(0, e), n = [0, e];
			for (let r = 1; r < this.rows; r++) this.get(r, e) > t && (t = this.get(r, e), n[0] = r);
			return n;
		}
		minColumn(e) {
			if (p(this, e), this.isEmpty()) return NaN;
			let t = this.get(0, e);
			for (let n = 1; n < this.rows; n++) this.get(n, e) < t && (t = this.get(n, e));
			return t;
		}
		minColumnIndex(e) {
			p(this, e), x(this);
			let t = this.get(0, e), n = [0, e];
			for (let r = 1; r < this.rows; r++) this.get(r, e) < t && (t = this.get(r, e), n[0] = r);
			return n;
		}
		diag() {
			let e = Math.min(this.rows, this.columns), t = [];
			for (let n = 0; n < e; n++) t.push(this.get(n, n));
			return t;
		}
		norm(e = "frobenius") {
			switch (e) {
				case "max": return this.max();
				case "frobenius": return Math.sqrt(this.dot(this));
				default: throw RangeError(`unknown norm type: ${e}`);
			}
		}
		cumulativeSum() {
			let e = 0;
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) e += this.get(t, n), this.set(t, n, e);
			return this;
		}
		dot(t) {
			e.isMatrix(t) && (t = t.to1DArray());
			let n = this.to1DArray();
			if (n.length !== t.length) throw RangeError("vectors do not have the same size");
			let r = 0;
			for (let e = 0; e < n.length; e++) r += n[e] * t[e];
			return r;
		}
		mmul(e) {
			e = O.checkMatrix(e);
			let t = this.rows, n = this.columns, r = e.columns, i = new O(t, r), a = new Float64Array(n);
			for (let o = 0; o < r; o++) {
				for (let t = 0; t < n; t++) a[t] = e.get(t, o);
				for (let e = 0; e < t; e++) {
					let t = 0;
					for (let r = 0; r < n; r++) t += this.get(e, r) * a[r];
					i.set(e, o, t);
				}
			}
			return i;
		}
		mpow(e) {
			if (!this.isSquare()) throw RangeError("Matrix must be square");
			if (!Number.isInteger(e) || e < 0) throw RangeError("Exponent must be a non-negative integer");
			let t = O.eye(this.rows), n = this;
			for (let r = e; r >= 1; r /= 2) r & 1 && (t = t.mmul(n)), n = n.mmul(n);
			return t;
		}
		strassen2x2(e) {
			e = O.checkMatrix(e);
			let t = new O(2, 2), n = this.get(0, 0), r = e.get(0, 0), i = this.get(0, 1), a = e.get(0, 1), o = this.get(1, 0), s = e.get(1, 0), c = this.get(1, 1), l = e.get(1, 1), u = (n + c) * (r + l), d = (o + c) * r, f = n * (a - l), p = c * (s - r), m = (n + i) * l, h = (o - n) * (r + a), g = (i - c) * (s + l), _ = u + p - m + g, v = f + m, y = d + p, b = u - d + f + h;
			return t.set(0, 0, _), t.set(0, 1, v), t.set(1, 0, y), t.set(1, 1, b), t;
		}
		strassen3x3(e) {
			e = O.checkMatrix(e);
			let t = new O(3, 3), n = this.get(0, 0), r = this.get(0, 1), i = this.get(0, 2), a = this.get(1, 0), o = this.get(1, 1), s = this.get(1, 2), c = this.get(2, 0), l = this.get(2, 1), u = this.get(2, 2), d = e.get(0, 0), f = e.get(0, 1), p = e.get(0, 2), m = e.get(1, 0), h = e.get(1, 1), g = e.get(1, 2), _ = e.get(2, 0), v = e.get(2, 1), y = e.get(2, 2), b = (n + r + i - a - o - l - u) * h, x = (n - a) * (-f + h), S = o * (-d + f + m - h - g - _ + y), ee = (-n + a + o) * (d - f + h), C = (a + o) * (-d + f), w = n * d, te = (-n + c + l) * (d - p + g), ne = (-n + c) * (p - g), T = (c + l) * (-d + p), re = (n + r + i - o - s - c - l) * g, ie = l * (-d + p + m - h - g - _ + v), ae = (-i + l + u) * (h + _ - v), oe = (i - u) * (h - v), E = i * _, se = (l + u) * (-_ + v), ce = (-i + o + s) * (g + _ - y), le = (i - s) * (g - y), ue = (o + s) * (-_ + y), de = r * m, fe = s * v, D = a * p, pe = c * f, me = u * y, he = w + E + de, ge = b + ee + C + w + ae + E + se, _e = w + te + T + re + E + ce + ue, ve = x + S + ee + w + E + ce + le, ye = x + ee + C + w + fe, be = E + ce + le + ue + D, xe = w + te + ne + ie + ae + oe + E, Se = ae + oe + E + se + pe, Ce = w + te + ne + T + me;
			return t.set(0, 0, he), t.set(0, 1, ge), t.set(0, 2, _e), t.set(1, 0, ve), t.set(1, 1, ye), t.set(1, 2, be), t.set(2, 0, xe), t.set(2, 1, Se), t.set(2, 2, Ce), t;
		}
		mmulStrassen(t) {
			t = O.checkMatrix(t);
			let n = this.clone(), r = n.rows, i = n.columns, a = t.rows, o = t.columns;
			i !== a && console.warn(`Multiplying ${r} x ${i} and ${a} x ${o} matrix: dimensions do not match.`);
			function s(t, n, r) {
				let i = t.rows, a = t.columns;
				if (i === n && a === r) return t;
				{
					let i = e.zeros(n, r);
					return i = i.setSubMatrix(t, 0, 0), i;
				}
			}
			let c = Math.max(r, a), l = Math.max(i, o);
			n = s(n, c, l), t = s(t, c, l);
			function u(t, n, r, i) {
				if (r <= 512 || i <= 512) return t.mmul(n);
				r % 2 == 1 && i % 2 == 1 ? (t = s(t, r + 1, i + 1), n = s(n, r + 1, i + 1)) : r % 2 == 1 ? (t = s(t, r + 1, i), n = s(n, r + 1, i)) : i % 2 == 1 && (t = s(t, r, i + 1), n = s(n, r, i + 1));
				let a = parseInt(t.rows / 2, 10), o = parseInt(t.columns / 2, 10), c = t.subMatrix(0, a - 1, 0, o - 1), l = n.subMatrix(0, a - 1, 0, o - 1), d = t.subMatrix(0, a - 1, o, t.columns - 1), f = n.subMatrix(0, a - 1, o, n.columns - 1), p = t.subMatrix(a, t.rows - 1, 0, o - 1), m = n.subMatrix(a, n.rows - 1, 0, o - 1), h = t.subMatrix(a, t.rows - 1, o, t.columns - 1), g = n.subMatrix(a, n.rows - 1, o, n.columns - 1), _ = u(e.add(c, h), e.add(l, g), a, o), v = u(e.add(p, h), l, a, o), y = u(c, e.sub(f, g), a, o), b = u(h, e.sub(m, l), a, o), x = u(e.add(c, d), g, a, o), S = u(e.sub(p, c), e.add(l, f), a, o), ee = u(e.sub(d, h), e.add(m, g), a, o), C = e.add(_, b);
				C.sub(x), C.add(ee);
				let w = e.add(y, x), te = e.add(v, b), ne = e.sub(_, v);
				ne.add(y), ne.add(S);
				let T = e.zeros(2 * C.rows, 2 * C.columns);
				return T = T.setSubMatrix(C, 0, 0), T = T.setSubMatrix(w, C.rows, 0), T = T.setSubMatrix(te, 0, C.columns), T = T.setSubMatrix(ne, C.rows, C.columns), T.subMatrix(0, r - 1, 0, i - 1);
			}
			return u(n, t, c, l);
		}
		scaleRows(e = {}) {
			if (typeof e != "object") throw TypeError("options must be an object");
			let { min: t = 0, max: n = 1 } = e;
			if (!Number.isFinite(t)) throw TypeError("min must be a number");
			if (!Number.isFinite(n)) throw TypeError("max must be a number");
			if (t >= n) throw RangeError("min must be smaller than max");
			let i = new O(this.rows, this.columns);
			for (let e = 0; e < this.rows; e++) {
				let a = this.getRow(e);
				a.length > 0 && r(a, {
					min: t,
					max: n,
					output: a
				}), i.setRow(e, a);
			}
			return i;
		}
		scaleColumns(e = {}) {
			if (typeof e != "object") throw TypeError("options must be an object");
			let { min: t = 0, max: n = 1 } = e;
			if (!Number.isFinite(t)) throw TypeError("min must be a number");
			if (!Number.isFinite(n)) throw TypeError("max must be a number");
			if (t >= n) throw RangeError("min must be smaller than max");
			let i = new O(this.rows, this.columns);
			for (let e = 0; e < this.columns; e++) {
				let a = this.getColumn(e);
				a.length && r(a, {
					min: t,
					max: n,
					output: a
				}), i.setColumn(e, a);
			}
			return i;
		}
		flipRows() {
			let e = Math.ceil(this.columns / 2);
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < e; n++) {
				let e = this.get(t, n), r = this.get(t, this.columns - 1 - n);
				this.set(t, n, r), this.set(t, this.columns - 1 - n, e);
			}
			return this;
		}
		flipColumns() {
			let e = Math.ceil(this.rows / 2);
			for (let t = 0; t < this.columns; t++) for (let n = 0; n < e; n++) {
				let e = this.get(n, t), r = this.get(this.rows - 1 - n, t);
				this.set(n, t, r), this.set(this.rows - 1 - n, t, e);
			}
			return this;
		}
		kroneckerProduct(e) {
			e = O.checkMatrix(e);
			let t = this.rows, n = this.columns, r = e.rows, i = e.columns, a = new O(t * r, n * i);
			for (let o = 0; o < t; o++) for (let t = 0; t < n; t++) for (let n = 0; n < r; n++) for (let s = 0; s < i; s++) a.set(r * o + n, i * t + s, this.get(o, t) * e.get(n, s));
			return a;
		}
		kroneckerSum(e) {
			if (e = O.checkMatrix(e), !this.isSquare() || !e.isSquare()) throw Error("Kronecker Sum needs two Square Matrices");
			let t = this.rows, n = e.rows, r = this.kroneckerProduct(O.eye(n, n)), i = O.eye(t, t).kroneckerProduct(e);
			return r.add(i);
		}
		transpose() {
			let e = new O(this.columns, this.rows);
			for (let t = 0; t < this.rows; t++) for (let n = 0; n < this.columns; n++) e.set(n, t, this.get(t, n));
			return e;
		}
		sortRows(e = pe) {
			for (let t = 0; t < this.rows; t++) this.setRow(t, this.getRow(t).sort(e));
			return this;
		}
		sortColumns(e = pe) {
			for (let t = 0; t < this.columns; t++) this.setColumn(t, this.getColumn(t).sort(e));
			return this;
		}
		subMatrix(e, t, n, r) {
			v(this, e, t, n, r);
			let i = new O(t - e + 1, r - n + 1);
			for (let a = e; a <= t; a++) for (let t = n; t <= r; t++) i.set(a - e, t - n, this.get(a, t));
			return i;
		}
		subMatrixRow(e, t, n) {
			if (t === void 0 && (t = 0), n === void 0 && (n = this.columns - 1), t > n || t < 0 || t >= this.columns || n < 0 || n >= this.columns) throw RangeError("Argument out of range");
			let r = new O(e.length, n - t + 1);
			for (let i = 0; i < e.length; i++) for (let a = t; a <= n; a++) {
				if (e[i] < 0 || e[i] >= this.rows) throw RangeError(`Row index out of range: ${e[i]}`);
				r.set(i, a - t, this.get(e[i], a));
			}
			return r;
		}
		subMatrixColumn(e, t, n) {
			if (t === void 0 && (t = 0), n === void 0 && (n = this.rows - 1), t > n || t < 0 || t >= this.rows || n < 0 || n >= this.rows) throw RangeError("Argument out of range");
			let r = new O(n - t + 1, e.length);
			for (let i = 0; i < e.length; i++) for (let a = t; a <= n; a++) {
				if (e[i] < 0 || e[i] >= this.columns) throw RangeError(`Column index out of range: ${e[i]}`);
				r.set(a - t, i, this.get(a, e[i]));
			}
			return r;
		}
		setSubMatrix(e, t, n) {
			if (e = O.checkMatrix(e), e.isEmpty()) return this;
			let r = t + e.rows - 1, i = n + e.columns - 1;
			v(this, t, r, n, i);
			for (let r = 0; r < e.rows; r++) for (let i = 0; i < e.columns; i++) this.set(t + r, n + i, e.get(r, i));
			return this;
		}
		selection(e, t) {
			g(this, e), _(this, t);
			let n = new O(e.length, t.length);
			for (let r = 0; r < e.length; r++) {
				let i = e[r];
				for (let e = 0; e < t.length; e++) {
					let a = t[e];
					n.set(r, e, this.get(i, a));
				}
			}
			return n;
		}
		trace() {
			let e = Math.min(this.rows, this.columns), t = 0;
			for (let n = 0; n < e; n++) t += this.get(n, n);
			return t;
		}
		clone() {
			return this.constructor.copy(this, new O(this.rows, this.columns));
		}
		static copy(e, t) {
			for (let [n, r, i] of e.entries()) t.set(n, r, i);
			return t;
		}
		sum(e) {
			switch (e) {
				case "row": return S(this);
				case "column": return ee(this);
				case void 0: return C(this);
				default: throw Error(`invalid option: ${e}`);
			}
		}
		product(e) {
			switch (e) {
				case "row": return w(this);
				case "column": return te(this);
				case void 0: return ne(this);
				default: throw Error(`invalid option: ${e}`);
			}
		}
		mean(e) {
			let t = this.sum(e);
			switch (e) {
				case "row":
					for (let e = 0; e < this.rows; e++) t[e] /= this.columns;
					return t;
				case "column":
					for (let e = 0; e < this.columns; e++) t[e] /= this.rows;
					return t;
				case void 0: return t / this.size;
				default: throw Error(`invalid option: ${e}`);
			}
		}
		variance(e, t = {}) {
			if (typeof e == "object" && (t = e, e = void 0), typeof t != "object") throw TypeError("options must be an object");
			let { unbiased: r = !0, mean: i = this.mean(e) } = t;
			if (typeof r != "boolean") throw TypeError("unbiased must be a boolean");
			switch (e) {
				case "row":
					if (!n.isAnyArray(i)) throw TypeError("mean must be an array");
					return T(this, r, i);
				case "column":
					if (!n.isAnyArray(i)) throw TypeError("mean must be an array");
					return re(this, r, i);
				case void 0:
					if (typeof i != "number") throw TypeError("mean must be a number");
					return ie(this, r, i);
				default: throw Error(`invalid option: ${e}`);
			}
		}
		standardDeviation(e, t) {
			typeof e == "object" && (t = e, e = void 0);
			let n = this.variance(e, t);
			if (e === void 0) return Math.sqrt(n);
			for (let e = 0; e < n.length; e++) n[e] = Math.sqrt(n[e]);
			return n;
		}
		center(e, t = {}) {
			if (typeof e == "object" && (t = e, e = void 0), typeof t != "object") throw TypeError("options must be an object");
			let { center: r = this.mean(e) } = t;
			switch (e) {
				case "row":
					if (!n.isAnyArray(r)) throw TypeError("center must be an array");
					return ae(this, r), this;
				case "column":
					if (!n.isAnyArray(r)) throw TypeError("center must be an array");
					return oe(this, r), this;
				case void 0:
					if (typeof r != "number") throw TypeError("center must be a number");
					return E(this, r), this;
				default: throw Error(`invalid option: ${e}`);
			}
		}
		scale(e, t = {}) {
			if (typeof e == "object" && (t = e, e = void 0), typeof t != "object") throw TypeError("options must be an object");
			let r = t.scale;
			switch (e) {
				case "row":
					if (r === void 0) r = se(this);
					else if (!n.isAnyArray(r)) throw TypeError("scale must be an array");
					return ce(this, r), this;
				case "column":
					if (r === void 0) r = le(this);
					else if (!n.isAnyArray(r)) throw TypeError("scale must be an array");
					return ue(this, r), this;
				case void 0:
					if (r === void 0) r = de(this);
					else if (typeof r != "number") throw TypeError("scale must be a number");
					return fe(this, r), this;
				default: throw Error(`invalid option: ${e}`);
			}
		}
		toString(e) {
			return s(this, e);
		}
		[Symbol.iterator]() {
			return this.entries();
		}
		*entries() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) yield [
				e,
				t,
				this.get(e, t)
			];
		}
		*values() {
			for (let e = 0; e < this.rows; e++) for (let t = 0; t < this.columns; t++) yield this.get(e, t);
		}
	};
	D.prototype.klass = "Matrix", typeof Symbol < "u" && (D.prototype[Symbol.for("nodejs.util.inspect.custom")] = o);
	function pe(e, t) {
		return e - t;
	}
	function me(e) {
		return e.every((e) => typeof e == "number");
	}
	D.random = D.rand, D.randomInt = D.randInt, D.diagonal = D.diag, D.prototype.diagonal = D.prototype.diag, D.identity = D.eye, D.prototype.negate = D.prototype.neg, D.prototype.tensorProduct = D.prototype.kroneckerProduct;
	var O = class e extends D {
		data;
		#e(e, t) {
			if (this.data = [], Number.isInteger(t) && t >= 0) for (let n = 0; n < e; n++) this.data.push(new Float64Array(t));
			else throw TypeError("nColumns must be a positive integer");
			this.rows = e, this.columns = t;
		}
		constructor(t, r) {
			if (super(), e.isMatrix(t)) this.#e(t.rows, t.columns), e.copy(t, this);
			else if (Number.isInteger(t) && t >= 0) this.#e(t, r);
			else if (n.isAnyArray(t)) {
				let e = t;
				if (t = e.length, r = t ? e[0].length : 0, typeof r != "number") throw TypeError("Data must be a 2D array with at least one element");
				this.data = [];
				for (let n = 0; n < t; n++) {
					if (e[n].length !== r) throw RangeError("Inconsistent array dimensions");
					if (!me(e[n])) throw TypeError("Input data contains non-numeric values");
					this.data.push(Float64Array.from(e[n]));
				}
				this.rows = t, this.columns = r;
			} else throw TypeError("First argument must be a positive number or an array");
		}
		set(e, t, n) {
			return this.data[e][t] = n, this;
		}
		get(e, t) {
			return this.data[e][t];
		}
		removeRow(e) {
			return f(this, e), this.data.splice(e, 1), --this.rows, this;
		}
		addRow(e, t) {
			return t === void 0 && (t = e, e = this.rows), f(this, e, !0), t = Float64Array.from(m(this, t)), this.data.splice(e, 0, t), this.rows += 1, this;
		}
		removeColumn(e) {
			p(this, e);
			for (let t = 0; t < this.rows; t++) {
				let n = new Float64Array(this.columns - 1);
				for (let r = 0; r < e; r++) n[r] = this.data[t][r];
				for (let r = e + 1; r < this.columns; r++) n[r - 1] = this.data[t][r];
				this.data[t] = n;
			}
			return --this.columns, this;
		}
		addColumn(e, t) {
			t === void 0 && (t = e, e = this.columns), p(this, e, !0), t = h(this, t);
			for (let n = 0; n < this.rows; n++) {
				let r = new Float64Array(this.columns + 1), i = 0;
				for (; i < e; i++) r[i] = this.data[n][i];
				for (r[i++] = t[n]; i < this.columns + 1; i++) r[i] = this.data[n][i - 1];
				this.data[n] = r;
			}
			return this.columns += 1, this;
		}
	};
	d(D, O);
	var he = class e extends D {
		#e;
		get size() {
			return this.#e.size;
		}
		get rows() {
			return this.#e.rows;
		}
		get columns() {
			return this.#e.columns;
		}
		get diagonalSize() {
			return this.rows;
		}
		static isSymmetricMatrix(e) {
			return O.isMatrix(e) && e.klassType === "SymmetricMatrix";
		}
		static zeros(e) {
			return new this(e);
		}
		static ones(e) {
			return new this(e).fill(1);
		}
		constructor(e) {
			if (super(), O.isMatrix(e)) {
				if (!e.isSymmetric()) throw TypeError("not symmetric data");
				this.#e = O.copy(e, new O(e.rows, e.rows));
			} else if (Number.isInteger(e) && e >= 0) this.#e = new O(e, e);
			else if (this.#e = new O(e), !this.isSymmetric()) throw TypeError("not symmetric data");
		}
		clone() {
			let t = new e(this.diagonalSize);
			for (let [e, n, r] of this.upperRightEntries()) t.set(e, n, r);
			return t;
		}
		toMatrix() {
			return new O(this);
		}
		get(e, t) {
			return this.#e.get(e, t);
		}
		set(e, t, n) {
			return this.#e.set(e, t, n), this.#e.set(t, e, n), this;
		}
		removeCross(e) {
			return this.#e.removeRow(e), this.#e.removeColumn(e), this;
		}
		addCross(e, t) {
			t === void 0 && (t = e, e = this.diagonalSize);
			let n = t.slice();
			return n.splice(e, 1), this.#e.addRow(e, n), this.#e.addColumn(e, t), this;
		}
		applyMask(e) {
			if (e.length !== this.diagonalSize) throw RangeError("Mask size do not match with matrix size");
			let t = [];
			for (let [n, r] of e.entries()) r || t.push(n);
			t.reverse();
			for (let e of t) this.removeCross(e);
			return this;
		}
		toCompact() {
			let { diagonalSize: e } = this, t = Array(e * (e + 1) / 2);
			for (let n = 0, r = 0, i = 0; i < t.length; i++) t[i] = this.get(r, n), ++n >= e && (n = ++r);
			return t;
		}
		static fromCompact(t) {
			let n = t.length, r = (Math.sqrt(8 * n + 1) - 1) / 2;
			if (!Number.isInteger(r)) throw TypeError(`This array is not a compact representation of a Symmetric Matrix, ${JSON.stringify(t)}`);
			let i = new e(r);
			for (let e = 0, a = 0, o = 0; o < n; o++) i.set(e, a, t[o]), ++e >= r && (e = ++a);
			return i;
		}
		*upperRightEntries() {
			for (let e = 0, t = 0; e < this.diagonalSize;) {
				let n = this.get(e, t);
				yield [
					e,
					t,
					n
				], ++t >= this.diagonalSize && (t = ++e);
			}
		}
		*upperRightValues() {
			for (let e = 0, t = 0; e < this.diagonalSize;) yield this.get(e, t), ++t >= this.diagonalSize && (t = ++e);
		}
	};
	he.prototype.klassType = "SymmetricMatrix";
	var ge = class e extends he {
		static isDistanceMatrix(e) {
			return he.isSymmetricMatrix(e) && e.klassSubType === "DistanceMatrix";
		}
		constructor(e) {
			if (super(e), !this.isDistance()) throw TypeError("Provided arguments do no produce a distance matrix");
		}
		set(e, t, n) {
			return e === t && (n = 0), super.set(e, t, n);
		}
		addCross(e, t) {
			return t === void 0 && (t = e, e = this.diagonalSize), t = t.slice(), t[e] = 0, super.addCross(e, t);
		}
		toSymmetricMatrix() {
			return new he(this);
		}
		clone() {
			let t = new e(this.diagonalSize);
			for (let [e, n, r] of this.upperRightEntries()) e !== n && t.set(e, n, r);
			return t;
		}
		toCompact() {
			let { diagonalSize: e } = this, t = (e - 1) * e / 2, n = Array(t);
			for (let t = 1, r = 0, i = 0; i < n.length; i++) n[i] = this.get(r, t), ++t >= e && (t = ++r + 1);
			return n;
		}
		static fromCompact(e) {
			let t = e.length;
			if (t === 0) return new this(0);
			let n = (Math.sqrt(8 * t + 1) + 1) / 2;
			if (!Number.isInteger(n)) throw TypeError(`This array is not a compact representation of a DistanceMatrix, ${JSON.stringify(e)}`);
			let r = new this(n);
			for (let i = 1, a = 0, o = 0; o < t; o++) r.set(i, a, e[o]), ++i >= n && (i = ++a + 1);
			return r;
		}
	};
	ge.prototype.klassSubType = "DistanceMatrix";
	var _e = class extends D {
		constructor(e) {
			super(), this.data = e, this.rows = e.length, this.columns = e[0].length;
		}
		set(e, t, n) {
			return this.data[e][t] = n, this;
		}
		get(e, t) {
			return this.data[e][t];
		}
	}, ve = class {
		constructor(e) {
			e = _e.checkMatrix(e);
			let t = e.clone(), n = t.rows, r = t.columns, i = new Float64Array(n), a = 1, o, s, c, l, u, d, f, p, m;
			for (o = 0; o < n; o++) i[o] = o;
			for (p = new Float64Array(n), s = 0; s < r; s++) {
				for (o = 0; o < n; o++) p[o] = t.get(o, s);
				for (o = 0; o < n; o++) {
					for (m = Math.min(o, s), u = 0, c = 0; c < m; c++) u += t.get(o, c) * p[c];
					p[o] -= u, t.set(o, s, p[o]);
				}
				for (l = s, o = s + 1; o < n; o++) Math.abs(p[o]) > Math.abs(p[l]) && (l = o);
				if (l !== s) {
					for (c = 0; c < r; c++) d = t.get(l, c), t.set(l, c, t.get(s, c)), t.set(s, c, d);
					f = i[l], i[l] = i[s], i[s] = f, a = -a;
				}
				if (s < n && t.get(s, s) !== 0) for (o = s + 1; o < n; o++) t.set(o, s, t.get(o, s) / t.get(s, s));
			}
			this.LU = t, this.pivotVector = i, this.pivotSign = a;
		}
		isSingular() {
			let e = this.LU, t = e.columns;
			for (let n = 0; n < t; n++) if (e.get(n, n) === 0) return !0;
			return !1;
		}
		solve(e) {
			e = O.checkMatrix(e);
			let t = this.LU;
			if (t.rows !== e.rows) throw Error("Invalid matrix dimensions");
			if (this.isSingular()) throw Error("LU matrix is singular");
			let n = e.columns, r = e.subMatrixRow(this.pivotVector, 0, n - 1), i = t.columns, a, o, s;
			for (s = 0; s < i; s++) for (a = s + 1; a < i; a++) for (o = 0; o < n; o++) r.set(a, o, r.get(a, o) - r.get(s, o) * t.get(a, s));
			for (s = i - 1; s >= 0; s--) {
				for (o = 0; o < n; o++) r.set(s, o, r.get(s, o) / t.get(s, s));
				for (a = 0; a < s; a++) for (o = 0; o < n; o++) r.set(a, o, r.get(a, o) - r.get(s, o) * t.get(a, s));
			}
			return r;
		}
		get determinant() {
			let e = this.LU;
			if (!e.isSquare()) throw Error("Matrix must be square");
			let t = this.pivotSign, n = e.columns;
			for (let r = 0; r < n; r++) t *= e.get(r, r);
			return t;
		}
		get lowerTriangularMatrix() {
			let e = this.LU, t = e.rows, n = e.columns, r = new O(t, n);
			for (let i = 0; i < t; i++) for (let t = 0; t < n; t++) i > t ? r.set(i, t, e.get(i, t)) : i === t ? r.set(i, t, 1) : r.set(i, t, 0);
			return r;
		}
		get upperTriangularMatrix() {
			let e = this.LU, t = e.rows, n = e.columns, r = new O(t, n);
			for (let i = 0; i < t; i++) for (let t = 0; t < n; t++) i <= t ? r.set(i, t, e.get(i, t)) : r.set(i, t, 0);
			return r;
		}
		get pivotPermutationVector() {
			return Array.from(this.pivotVector);
		}
	};
	function ye(e, t) {
		let n = 0;
		return Math.abs(e) > Math.abs(t) ? (n = t / e, Math.abs(e) * Math.sqrt(1 + n * n)) : t === 0 ? 0 : (n = e / t, Math.abs(t) * Math.sqrt(1 + n * n));
	}
	var be = class {
		constructor(e) {
			e = _e.checkMatrix(e);
			let t = e.clone(), n = e.rows, r = e.columns, i = new Float64Array(r), a, o, s, c;
			for (s = 0; s < r; s++) {
				let e = 0;
				for (a = s; a < n; a++) e = ye(e, t.get(a, s));
				if (e !== 0) {
					for (t.get(s, s) < 0 && (e = -e), a = s; a < n; a++) t.set(a, s, t.get(a, s) / e);
					for (t.set(s, s, t.get(s, s) + 1), o = s + 1; o < r; o++) {
						for (c = 0, a = s; a < n; a++) c += t.get(a, s) * t.get(a, o);
						for (c = -c / t.get(s, s), a = s; a < n; a++) t.set(a, o, t.get(a, o) + c * t.get(a, s));
					}
				}
				i[s] = -e;
			}
			this.QR = t, this.Rdiag = i;
		}
		solve(e) {
			e = O.checkMatrix(e);
			let t = this.QR, n = t.rows;
			if (e.rows !== n) throw Error("Matrix row dimensions must agree");
			if (!this.isFullRank()) throw Error("Matrix is rank deficient");
			let r = e.columns, i = e.clone(), a = t.columns, o, s, c, l;
			for (c = 0; c < a; c++) for (s = 0; s < r; s++) {
				for (l = 0, o = c; o < n; o++) l += t.get(o, c) * i.get(o, s);
				for (l = -l / t.get(c, c), o = c; o < n; o++) i.set(o, s, i.get(o, s) + l * t.get(o, c));
			}
			for (c = a - 1; c >= 0; c--) {
				for (s = 0; s < r; s++) i.set(c, s, i.get(c, s) / this.Rdiag[c]);
				for (o = 0; o < c; o++) for (s = 0; s < r; s++) i.set(o, s, i.get(o, s) - i.get(c, s) * t.get(o, c));
			}
			return i.subMatrix(0, a - 1, 0, r - 1);
		}
		isFullRank() {
			let e = this.QR.columns;
			for (let t = 0; t < e; t++) if (this.Rdiag[t] === 0) return !1;
			return !0;
		}
		get upperTriangularMatrix() {
			let e = this.QR, t = e.columns, n = new O(t, t), r, i;
			for (r = 0; r < t; r++) for (i = 0; i < t; i++) r < i ? n.set(r, i, e.get(r, i)) : r === i ? n.set(r, i, this.Rdiag[r]) : n.set(r, i, 0);
			return n;
		}
		get orthogonalMatrix() {
			let e = this.QR, t = e.rows, n = e.columns, r = new O(t, n), i, a, o, s;
			for (o = n - 1; o >= 0; o--) {
				for (i = 0; i < t; i++) r.set(i, o, 0);
				for (r.set(o, o, 1), a = o; a < n; a++) if (e.get(o, o) !== 0) {
					for (s = 0, i = o; i < t; i++) s += e.get(i, o) * r.get(i, a);
					for (s = -s / e.get(o, o), i = o; i < t; i++) r.set(i, a, r.get(i, a) + s * e.get(i, o));
				}
			}
			return r;
		}
	}, xe = class {
		constructor(e, t = {}) {
			if (e = _e.checkMatrix(e), e.isEmpty()) throw Error("Matrix must be non-empty");
			let n = e.rows, r = e.columns, { computeLeftSingularVectors: i = !0, computeRightSingularVectors: a = !0, autoTranspose: o = !1 } = t, s = !!i, c = !!a, l = !1, u;
			if (n < r) if (!o) u = e.clone(), console.warn("Computing SVD on a matrix with more columns than rows. Consider enabling autoTranspose");
			else {
				u = e.transpose(), n = u.rows, r = u.columns, l = !0;
				let t = s;
				s = c, c = t;
			}
			else u = e.clone();
			let d = Math.min(n, r), f = Math.min(n + 1, r), p = new Float64Array(f), m = new O(n, d), h = new O(r, r), g = new Float64Array(r), _ = new Float64Array(n), v = new Float64Array(f);
			for (let e = 0; e < f; e++) v[e] = e;
			let y = Math.min(n - 1, r), b = Math.max(0, Math.min(r - 2, n)), x = Math.max(y, b);
			for (let e = 0; e < x; e++) {
				if (e < y) {
					p[e] = 0;
					for (let t = e; t < n; t++) p[e] = ye(p[e], u.get(t, e));
					if (p[e] !== 0) {
						u.get(e, e) < 0 && (p[e] = -p[e]);
						for (let t = e; t < n; t++) u.set(t, e, u.get(t, e) / p[e]);
						u.set(e, e, u.get(e, e) + 1);
					}
					p[e] = -p[e];
				}
				for (let t = e + 1; t < r; t++) {
					if (e < y && p[e] !== 0) {
						let r = 0;
						for (let i = e; i < n; i++) r += u.get(i, e) * u.get(i, t);
						r = -r / u.get(e, e);
						for (let i = e; i < n; i++) u.set(i, t, u.get(i, t) + r * u.get(i, e));
					}
					g[t] = u.get(e, t);
				}
				if (s && e < y) for (let t = e; t < n; t++) m.set(t, e, u.get(t, e));
				if (e < b) {
					g[e] = 0;
					for (let t = e + 1; t < r; t++) g[e] = ye(g[e], g[t]);
					if (g[e] !== 0) {
						g[e + 1] < 0 && (g[e] = 0 - g[e]);
						for (let t = e + 1; t < r; t++) g[t] /= g[e];
						g[e + 1] += 1;
					}
					if (g[e] = -g[e], e + 1 < n && g[e] !== 0) {
						for (let t = e + 1; t < n; t++) _[t] = 0;
						for (let t = e + 1; t < n; t++) for (let n = e + 1; n < r; n++) _[t] += g[n] * u.get(t, n);
						for (let t = e + 1; t < r; t++) {
							let r = -g[t] / g[e + 1];
							for (let i = e + 1; i < n; i++) u.set(i, t, u.get(i, t) + r * _[i]);
						}
					}
					if (c) for (let t = e + 1; t < r; t++) h.set(t, e, g[t]);
				}
			}
			let S = Math.min(r, n + 1);
			if (y < r && (p[y] = u.get(y, y)), n < S && (p[S - 1] = 0), b + 1 < S && (g[b] = u.get(b, S - 1)), g[S - 1] = 0, s) {
				for (let e = y; e < d; e++) {
					for (let t = 0; t < n; t++) m.set(t, e, 0);
					m.set(e, e, 1);
				}
				for (let e = y - 1; e >= 0; e--) if (p[e] !== 0) {
					for (let t = e + 1; t < d; t++) {
						let r = 0;
						for (let i = e; i < n; i++) r += m.get(i, e) * m.get(i, t);
						r = -r / m.get(e, e);
						for (let i = e; i < n; i++) m.set(i, t, m.get(i, t) + r * m.get(i, e));
					}
					for (let t = e; t < n; t++) m.set(t, e, -m.get(t, e));
					m.set(e, e, 1 + m.get(e, e));
					for (let t = 0; t < e - 1; t++) m.set(t, e, 0);
				} else {
					for (let t = 0; t < n; t++) m.set(t, e, 0);
					m.set(e, e, 1);
				}
			}
			if (c) for (let e = r - 1; e >= 0; e--) {
				if (e < b && g[e] !== 0) for (let t = e + 1; t < r; t++) {
					let n = 0;
					for (let i = e + 1; i < r; i++) n += h.get(i, e) * h.get(i, t);
					n = -n / h.get(e + 1, e);
					for (let i = e + 1; i < r; i++) h.set(i, t, h.get(i, t) + n * h.get(i, e));
				}
				for (let t = 0; t < r; t++) h.set(t, e, 0);
				h.set(e, e, 1);
			}
			let ee = S - 1, C = 2 ** -52;
			for (; S > 0;) {
				let e, t;
				for (e = S - 2; e >= -1 && e !== -1; e--) {
					let t = Number.MIN_VALUE + C * Math.abs(p[e] + Math.abs(p[e + 1]));
					if (Math.abs(g[e]) <= t || Number.isNaN(g[e])) {
						g[e] = 0;
						break;
					}
				}
				if (e === S - 2) t = 4;
				else {
					let n;
					for (n = S - 1; n >= e && n !== e; n--) {
						let t = (n === S ? 0 : Math.abs(g[n])) + (n === e + 1 ? 0 : Math.abs(g[n - 1]));
						if (Math.abs(p[n]) <= C * t) {
							p[n] = 0;
							break;
						}
					}
					n === e ? t = 3 : n === S - 1 ? t = 1 : (t = 2, e = n);
				}
				switch (e++, t) {
					case 1: {
						let t = g[S - 2];
						g[S - 2] = 0;
						for (let n = S - 2; n >= e; n--) {
							let i = ye(p[n], t), a = p[n] / i, o = t / i;
							if (p[n] = i, n !== e && (t = -o * g[n - 1], g[n - 1] = a * g[n - 1]), c) for (let e = 0; e < r; e++) i = a * h.get(e, n) + o * h.get(e, S - 1), h.set(e, S - 1, -o * h.get(e, n) + a * h.get(e, S - 1)), h.set(e, n, i);
						}
						break;
					}
					case 2: {
						let t = g[e - 1];
						g[e - 1] = 0;
						for (let r = e; r < S; r++) {
							let i = ye(p[r], t), a = p[r] / i, o = t / i;
							if (p[r] = i, t = -o * g[r], g[r] = a * g[r], s) for (let t = 0; t < n; t++) i = a * m.get(t, r) + o * m.get(t, e - 1), m.set(t, e - 1, -o * m.get(t, r) + a * m.get(t, e - 1)), m.set(t, r, i);
						}
						break;
					}
					case 3: {
						let t = Math.max(Math.abs(p[S - 1]), Math.abs(p[S - 2]), Math.abs(g[S - 2]), Math.abs(p[e]), Math.abs(g[e])), i = p[S - 1] / t, a = p[S - 2] / t, o = g[S - 2] / t, l = p[e] / t, u = g[e] / t, d = ((a + i) * (a - i) + o * o) / 2, f = i * o * (i * o), _ = 0;
						(d !== 0 || f !== 0) && (_ = d < 0 ? 0 - Math.sqrt(d * d + f) : Math.sqrt(d * d + f), _ = f / (d + _));
						let v = (l + i) * (l - i) + _, y = l * u;
						for (let t = e; t < S - 1; t++) {
							let i = ye(v, y);
							i === 0 && (i = Number.MIN_VALUE);
							let a = v / i, o = y / i;
							if (t !== e && (g[t - 1] = i), v = a * p[t] + o * g[t], g[t] = a * g[t] - o * p[t], y = o * p[t + 1], p[t + 1] = a * p[t + 1], c) for (let e = 0; e < r; e++) i = a * h.get(e, t) + o * h.get(e, t + 1), h.set(e, t + 1, -o * h.get(e, t) + a * h.get(e, t + 1)), h.set(e, t, i);
							if (i = ye(v, y), i === 0 && (i = Number.MIN_VALUE), a = v / i, o = y / i, p[t] = i, v = a * g[t] + o * p[t + 1], p[t + 1] = -o * g[t] + a * p[t + 1], y = o * g[t + 1], g[t + 1] = a * g[t + 1], s && t < n - 1) for (let e = 0; e < n; e++) i = a * m.get(e, t) + o * m.get(e, t + 1), m.set(e, t + 1, -o * m.get(e, t) + a * m.get(e, t + 1)), m.set(e, t, i);
						}
						g[S - 2] = v;
						break;
					}
					case 4:
						if (p[e] <= 0 && (p[e] = p[e] < 0 ? -p[e] : 0, c)) for (let t = 0; t <= ee; t++) h.set(t, e, -h.get(t, e));
						for (; e < ee && !(p[e] >= p[e + 1]);) {
							let t = p[e];
							if (p[e] = p[e + 1], p[e + 1] = t, c && e < r - 1) for (let n = 0; n < r; n++) t = h.get(n, e + 1), h.set(n, e + 1, h.get(n, e)), h.set(n, e, t);
							if (s && e < n - 1) for (let r = 0; r < n; r++) t = m.get(r, e + 1), m.set(r, e + 1, m.get(r, e)), m.set(r, e, t);
							e++;
						}
						S--;
						break;
				}
			}
			if (l) {
				let e = h;
				h = m, m = e;
			}
			this.m = n, this.n = r, this.s = p, this.U = m, this.V = h;
		}
		solve(e) {
			let t = e, n = this.threshold, r = this.s.length, i = O.zeros(r, r);
			for (let e = 0; e < r; e++) Math.abs(this.s[e]) <= n ? i.set(e, e, 0) : i.set(e, e, 1 / this.s[e]);
			let a = this.U, o = this.rightSingularVectors, s = o.mmul(i), c = o.rows, l = a.rows, u = O.zeros(c, l);
			for (let e = 0; e < c; e++) for (let t = 0; t < l; t++) {
				let n = 0;
				for (let i = 0; i < r; i++) n += s.get(e, i) * a.get(t, i);
				u.set(e, t, n);
			}
			return u.mmul(t);
		}
		solveForDiagonal(e) {
			return this.solve(O.diag(e));
		}
		inverse() {
			let e = this.V, t = this.threshold, n = e.rows, r = e.columns, i = new O(n, this.s.length);
			for (let a = 0; a < n; a++) for (let n = 0; n < r; n++) Math.abs(this.s[n]) > t && i.set(a, n, e.get(a, n) / this.s[n]);
			let a = this.U, o = a.rows, s = a.columns, c = new O(n, o);
			for (let e = 0; e < n; e++) for (let t = 0; t < o; t++) {
				let n = 0;
				for (let r = 0; r < s; r++) n += i.get(e, r) * a.get(t, r);
				c.set(e, t, n);
			}
			return c;
		}
		get condition() {
			return this.s[0] / this.s[Math.min(this.m, this.n) - 1];
		}
		get norm2() {
			return this.s[0];
		}
		get rank() {
			let e = Math.max(this.m, this.n) * this.s[0] * 2 ** -52, t = 0, n = this.s;
			for (let r = 0, i = n.length; r < i; r++) n[r] > e && t++;
			return t;
		}
		get diagonal() {
			return Array.from(this.s);
		}
		get threshold() {
			return 2 ** -52 / 2 * Math.max(this.m, this.n) * this.s[0];
		}
		get leftSingularVectors() {
			return this.U;
		}
		get rightSingularVectors() {
			return this.V;
		}
		get diagonalMatrix() {
			return O.diag(this.s);
		}
	};
	function Se(e, t = !1) {
		return e = _e.checkMatrix(e), t ? new xe(e).inverse() : Ce(e, O.eye(e.rows));
	}
	function Ce(e, t, n = !1) {
		return e = _e.checkMatrix(e), t = _e.checkMatrix(t), n ? new xe(e).solve(t) : e.isSquare() ? new ve(e).solve(t) : new be(e).solve(t);
	}
	function we(e, t = 2 ** -52) {
		if (e = O.checkMatrix(e), e.isEmpty()) return e.transpose();
		let n = new xe(e, { autoTranspose: !0 }), r = n.leftSingularVectors, i = n.rightSingularVectors, a = n.diagonal;
		for (let e = 0; e < a.length; e++) Math.abs(a[e]) > t ? a[e] = 1 / a[e] : a[e] = 0;
		return i.mmul(O.diag(a).mmul(r.transpose()));
	}
	e.Matrix = O, e.SingularValueDecomposition = xe, e.default = O, e.inverse = Se, e.pseudoInverse = we;
})))(), 1), Hl = Vl.SingularValueDecomposition, Ul = (Vl.Matrix, Vl.Matrix), Wl = Vl.inverse, Gl = Vl.pseudoInverse;
//#endregion
//#region node_modules/@allmaps/transform/dist/shared/solve-functions.js
function Kl(e, t) {
	let n = new Ul([...e[0], ...e[1]]), r = Ul.columnVector([...t[0], ...t[1]]);
	return Gl(n).mmul(r).to1DArray();
}
function ql(e, t) {
	let n = new Ul(e), r = [Ul.columnVector(t[0]), Ul.columnVector(t[1])], i = Gl(n);
	return [i.mmul(r[0]), i.mmul(r[1])].map((e) => e.to1DArray());
}
function Jl(e, t) {
	let n = new Ul(e), r = [Ul.columnVector(t[0]), Ul.columnVector(t[1])], i = Wl(n);
	return [i.mmul(r[0]), i.mmul(r[1])].map((e) => e.to1DArray());
}
function Yl(e, t) {
	let n = [];
	for (let r = 0; r < t; r++) n.push(e[0][r]), n.push(e[1][r]);
	let r = new Hl(n);
	return Ul.from1DArray(3, 3, r.rightSingularVectors.getColumn(8)).transpose().to2DArray();
}
//#endregion
//#region node_modules/@allmaps/transform/dist/transformation-types/Helmert.js
var Xl = class extends kl {
	coefsArrayMatrices;
	coefsArrayMatricesSize;
	weightsArray;
	weightsArrays;
	constructor(e, t) {
		super(e, t, "helmert", 2), this.coefsArrayMatrices = this.getCoefsArrayMatrices(), this.coefsArrayMatricesSize = this.coefsArrayMatrices.map((e) => Wc(e));
	}
	getDestinationPointsArrays() {
		return [this.destinationPoints.map((e) => e[0]), this.destinationPoints.map((e) => e[1])];
	}
	getCoefsArrayMatrices() {
		let e = Uc(this.pointCount, 4, 0), t = Uc(this.pointCount, 4, 0);
		for (let n = 0; n < this.pointCount; n++) {
			let r = this.getSourcePointCoefsArrays(this.sourcePoints[n]);
			e = Kc(e, n, 0, [r[0]]), t = Kc(t, n, 0, [r[1]]);
		}
		return [e, t];
	}
	getSourcePointCoefsArrays(e) {
		return [[
			1,
			0,
			e[0],
			-e[1]
		], [
			0,
			1,
			e[1],
			e[0]
		]];
	}
	solve() {
		this.weightsArray = Kl(this.coefsArrayMatrices, this.destinationPointsArrays), this.weightsArrays = [this.weightsArray, this.weightsArray];
	}
	getMeasures() {
		if (this.weightsArrays || this.solve(), !this.weightsArray) throw Error("Helmert weights not computed");
		let e = {};
		return e.scale = Math.sqrt(this.weightsArray[2] ** 2 + this.weightsArray[3] ** 2), e.rotation = Math.atan2(this.weightsArray[3], this.weightsArray[2]), e.translation = [this.weightsArray[0], this.weightsArray[1]], e;
	}
	evaluateFunction(e) {
		if (this.weightsArrays || this.solve(), !this.weightsArray) throw Error("Helmert weights not computed");
		return [this.weightsArray[0] + this.weightsArray[2] * e[0] - this.weightsArray[3] * e[1], this.weightsArray[1] + this.weightsArray[2] * e[1] + this.weightsArray[3] * e[0]];
	}
	evaluatePartialDerivativeX(e) {
		if (this.weightsArrays || this.solve(), !this.weightsArray) throw Error("Helmert weights not computed");
		return [this.weightsArray[2], this.weightsArray[3]];
	}
	evaluatePartialDerivativeY(e) {
		if (this.weightsArrays || this.solve(), !this.weightsArray) throw Error("Helmert weights not computed");
		return [-this.weightsArray[3], this.weightsArray[2]];
	}
}, Zl = class extends Ol {
	weightsArrays;
	constructor(e, t) {
		super(e, t, "straight", 2);
	}
	solve() {
		let e = new Xl(this.sourcePoints, this.destinationPoints).getMeasures().scale, t = this.sourcePoints.reduce((e, t) => [e[0] + t[0], e[1] + t[1]]).map((e) => e / this.pointCount), n = this.destinationPoints.reduce((e, t) => [e[0] + t[0], e[1] + t[1]]).map((e) => e / this.pointCount), r = n.map((n, r) => n - t[r] * e);
		this.weightsArrays = {
			scale: e,
			sourcePointsCenter: t,
			destinationPointsCenter: n,
			translation: r
		};
	}
	evaluateFunction(e) {
		if (this.weightsArrays || this.solve(), !this.weightsArrays) throw Error("Weights not computed");
		return [this.weightsArrays.translation[0] + this.weightsArrays.scale * e[0], this.weightsArrays.translation[1] + this.weightsArrays.scale * e[1]];
	}
	evaluatePartialDerivativeX(e) {
		if (this.weightsArrays || this.solve(), !this.weightsArrays) throw Error("Weights not computed");
		return [this.weightsArrays.scale, 0];
	}
	evaluatePartialDerivativeY(e) {
		if (this.weightsArrays || this.solve(), !this.weightsArrays) throw Error("Weights not computed");
		return [0, this.weightsArrays.scale];
	}
}, Ql = class extends kl {
	constructor(e, t, n, r) {
		super(e, t, n, r);
	}
	getCoefsArrayMatrices() {
		let e = this.getCoefsArrayMatrix();
		return [e, e];
	}
	getSourcePointCoefsArrays(e) {
		let t = this.getSourcePointCoefsArray(e);
		return [t, t];
	}
}, $l = class extends Ql {
	coefsArrayMatrices;
	coefsArrayMatrix;
	coefsArrayMatricesSize;
	coefsArrayMatrixSize;
	order;
	weightsArrays;
	constructor(e, t, n) {
		n ||= 1;
		let r = (n + 1) * (n + 2) / 2;
		if (super(e, t, "polynomial" + n, r), this.order = n, this.order < 1 || this.order > 3) throw Error("Only polynomial transformations of order 1, 2 or 3 are supported");
		this.coefsArrayMatrices = this.getCoefsArrayMatrices(), this.coefsArrayMatrix = this.coefsArrayMatrices[0], this.coefsArrayMatricesSize = this.coefsArrayMatrices.map((e) => Wc(e)), this.coefsArrayMatrixSize = Wc(this.coefsArrayMatrix);
	}
	getDestinationPointsArrays() {
		return [this.destinationPoints.map((e) => e[0]), this.destinationPoints.map((e) => e[1])];
	}
	getCoefsArrayMatrix() {
		let e = Uc(this.pointCount, this.pointCountMinimum, 0);
		for (let t = 0; t < this.pointCount; t++) e = Kc(e, t, 0, [this.getSourcePointCoefsArray(this.sourcePoints[t])]);
		return e;
	}
	solve() {
		this.weightsArrays = ql(this.coefsArrayMatrix, this.destinationPointsArrays);
	}
}, eu = class e extends $l {
	constructor(e, t) {
		super(e, t, 1);
	}
	getSourcePointCoefsArray(t) {
		return e.getPolynomial1SourcePointCoefsArray(t);
	}
	static getPolynomial1SourcePointCoefsArray(e) {
		return [
			1,
			e[0],
			e[1]
		];
	}
	getHomogeneousTransform() {
		if (this.weightsArrays) return [
			this.weightsArrays[0][1],
			this.weightsArrays[1][1],
			this.weightsArrays[0][2],
			this.weightsArrays[1][2],
			this.weightsArrays[0][0],
			this.weightsArrays[1][0]
		];
	}
	setWeightsArraysFromHomogeneousTransform(e) {
		this.weightsArrays = [[
			e[4],
			e[0],
			e[2]
		], [
			e[5],
			e[1],
			e[3]
		]];
	}
	getMeasures() {
		if (this.weightsArrays || this.solve(), !this.weightsArrays) throw Error("Weights not computed");
		let e = {};
		e.translation = [this.weightsArrays[0][0], this.weightsArrays[1][0]];
		let t = this.weightsArrays[0][1], n = this.weightsArrays[1][1], r = this.weightsArrays[0][2], i = this.weightsArrays[1][2], a = t * i - n * r;
		if (t != 0 || n != 0) {
			let o = Math.sqrt(t * t + n * n);
			e.rotation = n > 0 ? Math.acos(t / o) : -Math.acos(t / o), e.scales = [o, a / o], e.shears = [Math.atan((t * r + n * i) / (o * o)), 0];
		} else if (r != 0 || i != 0) {
			let o = Math.sqrt(r * r + i * i);
			e.rotation = Math.PI / 2 - (i > 0 ? Math.acos(-r / o) : -Math.acos(r / o)), e.scales = [a / o, o], e.shears = [0, Math.atan((t * r + n * i) / (o * o))];
		}
		return e;
	}
	evaluateFunction(e) {
		if (this.weightsArrays || this.solve(), !this.weightsArrays) throw Error("Weights not computed");
		let t = [0, 0];
		for (let n = 0; n < 2; n++) t[n] += this.weightsArrays[n][0] + this.weightsArrays[n][1] * e[0] + this.weightsArrays[n][2] * e[1];
		return t;
	}
	evaluatePartialDerivativeX(e) {
		if (this.weightsArrays || this.solve(), !this.weightsArrays) throw Error("Weights not computed");
		let t = [0, 0];
		for (let e = 0; e < 2; e++) t[e] += this.weightsArrays[e][1];
		return t;
	}
	evaluatePartialDerivativeY(e) {
		if (this.weightsArrays || this.solve(), !this.weightsArrays) throw Error("Weights not computed");
		let t = [0, 0];
		for (let e = 0; e < 2; e++) t[e] += this.weightsArrays[e][2];
		return t;
	}
}, tu = class e extends $l {
	constructor(e, t) {
		super(e, t, 2);
	}
	getSourcePointCoefsArray(t) {
		return e.getPolynomial2SourcePointCoefsArray(t);
	}
	static getPolynomial2SourcePointCoefsArray(e) {
		return [
			1,
			e[0],
			e[1],
			e[0] ** 2,
			e[1] ** 2,
			e[0] * e[1]
		];
	}
	evaluateFunction(e) {
		if (this.weightsArrays || this.solve(), !this.weightsArrays) throw Error("Weights not computed");
		let t = [0, 0];
		for (let n = 0; n < 2; n++) t[n] += this.weightsArrays[n][0] + this.weightsArrays[n][1] * e[0] + this.weightsArrays[n][2] * e[1] + this.weightsArrays[n][3] * e[0] ** 2 + this.weightsArrays[n][4] * e[1] ** 2 + this.weightsArrays[n][5] * e[0] * e[1];
		return t;
	}
	evaluatePartialDerivativeX(e) {
		if (this.weightsArrays || this.solve(), !this.weightsArrays) throw Error("Weights not computed");
		let t = [0, 0];
		for (let n = 0; n < 2; n++) t[n] += this.weightsArrays[n][1] + 2 * this.weightsArrays[n][3] * e[0] + this.weightsArrays[n][5] * e[1];
		return t;
	}
	evaluatePartialDerivativeY(e) {
		if (this.weightsArrays || this.solve(), !this.weightsArrays) throw Error("Weights not computed");
		let t = [0, 0];
		for (let n = 0; n < 2; n++) t[n] += this.weightsArrays[n][2] + 2 * this.weightsArrays[n][4] * e[1] + this.weightsArrays[n][5] * e[0];
		return t;
	}
}, nu = class e extends $l {
	constructor(e, t) {
		super(e, t, 3);
	}
	getSourcePointCoefsArray(t) {
		return e.getPolynomial3SourcePointCoefsArray(t);
	}
	static getPolynomial3SourcePointCoefsArray(e) {
		return [
			1,
			e[0],
			e[1],
			e[0] ** 2,
			e[1] ** 2,
			e[0] * e[1],
			e[0] ** 3,
			e[1] ** 3,
			e[0] ** 2 * e[1],
			e[0] * e[1] ** 2
		];
	}
	evaluateFunction(e) {
		if (this.weightsArrays || this.solve(), !this.weightsArrays) throw Error("Weights not computed");
		let t = [0, 0];
		for (let n = 0; n < 2; n++) t[n] += this.weightsArrays[n][0] + this.weightsArrays[n][1] * e[0] + this.weightsArrays[n][2] * e[1] + this.weightsArrays[n][3] * e[0] ** 2 + this.weightsArrays[n][4] * e[1] ** 2 + this.weightsArrays[n][5] * e[0] * e[1] + this.weightsArrays[n][6] * e[0] ** 3 + this.weightsArrays[n][7] * e[1] ** 3 + this.weightsArrays[n][8] * e[0] ** 2 * e[1] + this.weightsArrays[n][9] * e[0] * e[1] ** 2;
		return t;
	}
	evaluatePartialDerivativeX(e) {
		if (this.weightsArrays || this.solve(), !this.weightsArrays) throw Error("Weights not computed");
		let t = [0, 0];
		for (let n = 0; n < 2; n++) t[n] += this.weightsArrays[n][1] + 2 * this.weightsArrays[n][3] * e[0] + this.weightsArrays[n][5] * e[1] + 3 * this.weightsArrays[n][6] * e[0] ** 2 + 2 * this.weightsArrays[n][8] * e[0] * e[1] + this.weightsArrays[n][9] * e[1] ** 2;
		return t;
	}
	evaluatePartialDerivativeY(e) {
		if (this.weightsArrays || this.solve(), !this.weightsArrays) throw Error("Weights not computed");
		let t = [0, 0];
		for (let n = 0; n < 2; n++) t[n] += this.weightsArrays[n][2] + 2 * this.weightsArrays[n][4] * e[1] + this.weightsArrays[n][5] * e[0] + 3 * this.weightsArrays[n][7] * e[1] ** 2 + this.weightsArrays[n][8] * e[0] ** 2 + 2 * this.weightsArrays[n][9] * e[0] * e[1];
		return t;
	}
}, ru = class extends Ol {
	coefsArrayMatrices;
	weightsArrays;
	constructor(e, t) {
		super(e, t, "projective", 4), this.coefsArrayMatrices = [Uc(this.pointCount, 9, 0), Uc(this.pointCount, 9, 0)];
		for (let n = 0; n < this.pointCount; n++) this.coefsArrayMatrices[0][n][0] = -e[n][0], this.coefsArrayMatrices[0][n][1] = -e[n][1], this.coefsArrayMatrices[0][n][2] = -1, this.coefsArrayMatrices[0][n][3] = 0, this.coefsArrayMatrices[0][n][4] = 0, this.coefsArrayMatrices[0][n][5] = 0, this.coefsArrayMatrices[0][n][6] = t[n][0] * e[n][0], this.coefsArrayMatrices[0][n][7] = t[n][0] * e[n][1], this.coefsArrayMatrices[0][n][8] = t[n][0], this.coefsArrayMatrices[1][n][0] = 0, this.coefsArrayMatrices[1][n][1] = 0, this.coefsArrayMatrices[1][n][2] = 0, this.coefsArrayMatrices[1][n][3] = -e[n][0], this.coefsArrayMatrices[1][n][4] = -e[n][1], this.coefsArrayMatrices[1][n][5] = -1, this.coefsArrayMatrices[1][n][6] = t[n][1] * e[n][0], this.coefsArrayMatrices[1][n][7] = t[n][1] * e[n][1], this.coefsArrayMatrices[1][n][8] = t[n][1];
	}
	solve() {
		this.weightsArrays = Yl(this.coefsArrayMatrices, this.pointCount);
	}
	evaluateFunction(e) {
		if (this.weightsArrays || this.solve(), !this.weightsArrays) throw Error("Weights not computed");
		let t = this.weightsArrays[0][2] * e[0] + this.weightsArrays[1][2] * e[1] + this.weightsArrays[2][2], n = this.weightsArrays[0][0] * e[0] + this.weightsArrays[1][0] * e[1] + this.weightsArrays[2][0], r = this.weightsArrays[0][1] * e[0] + this.weightsArrays[1][1] * e[1] + this.weightsArrays[2][1];
		return [n / t, r / t];
	}
	evaluatePartialDerivativeX(e) {
		if (this.weightsArrays || this.solve(), !this.weightsArrays) throw Error("Weights not computed");
		let t = this.weightsArrays[0][2] * e[0] + this.weightsArrays[1][2] * e[1] + this.weightsArrays[2][2], n = this.weightsArrays[0][0] * e[0] + this.weightsArrays[1][0] * e[1] + this.weightsArrays[2][0], r = this.weightsArrays[0][1] * e[0] + this.weightsArrays[1][1] * e[1] + this.weightsArrays[2][1];
		return [(t * this.weightsArrays[0][0] - this.weightsArrays[0][2] * n) / t ** 2, (t * this.weightsArrays[0][1] - this.weightsArrays[0][2] * r) / t ** 2];
	}
	evaluatePartialDerivativeY(e) {
		if (this.weightsArrays || this.solve(), !this.weightsArrays) throw Error("Weights not computed");
		let t = this.weightsArrays[0][2] * e[0] + this.weightsArrays[1][2] * e[1] + this.weightsArrays[2][2], n = this.weightsArrays[0][0] * e[0] + this.weightsArrays[1][0] * e[1] + this.weightsArrays[2][0], r = this.weightsArrays[0][1] * e[0] + this.weightsArrays[1][1] * e[1] + this.weightsArrays[2][1];
		return [(t * this.weightsArrays[1][0] - this.weightsArrays[1][2] * n) / t ** 2, (t * this.weightsArrays[1][1] - this.weightsArrays[1][2] * r) / t ** 2];
	}
}, iu = class extends Ql {
	kernelFunction;
	normFunction;
	epsilon;
	coefsArrayMatrices;
	coefsArrayMatrix;
	coefsArrayMatricesSize;
	coefsArrayMatrixSize;
	weightsArrays;
	rbfWeightsArrays;
	affineWeightsArrays;
	constructor(e, t, n, r, i, a) {
		super(e, t, i, 3), this.kernelFunction = n, this.normFunction = r, this.epsilon = a, this.coefsArrayMatrices = this.getCoefsArrayMatrices(), this.coefsArrayMatrix = this.coefsArrayMatrices[0], this.coefsArrayMatricesSize = this.coefsArrayMatrices.map((e) => Wc(e)), this.coefsArrayMatrixSize = Wc(this.coefsArrayMatrix);
	}
	getDestinationPointsArrays() {
		return [[
			...this.destinationPoints,
			[0, 0],
			[0, 0],
			[0, 0]
		].map((e) => e[0]), [
			...this.destinationPoints,
			[0, 0],
			[0, 0],
			[0, 0]
		].map((e) => e[1])];
	}
	getCoefsArrayMatrix() {
		let e = Uc(this.pointCount, this.pointCount, 0);
		for (let t = 0; t < this.pointCount; t++) for (let n = 0; n < this.pointCount; n++) e[t][n] = this.normFunction(this.sourcePoints[t], this.sourcePoints[n]);
		if (this.epsilon === void 0) {
			let t = e.map((e) => e.reduce((e, t) => e + t, 0)).reduce((e, t) => e + t, 0);
			this.epsilon = t / (this.pointCount ** 2 - this.pointCount);
		}
		let t = Uc(this.pointCount, this.pointCount, 0);
		for (let n = 0; n < this.pointCount; n++) for (let r = 0; r < this.pointCount; r++) t[n][r] = this.kernelFunction(e[n][r], { epsilon: this.epsilon });
		let n = Uc(this.pointCount, 3, 0);
		for (let e = 0; e < this.pointCount; e++) n = Kc(n, e, 0, [eu.getPolynomial1SourcePointCoefsArray(this.sourcePoints[e])]);
		let r = Uc(3, 3, 0);
		return Jc([[t, n], [qc(n), r]]);
	}
	getSourcePointCoefsArray(e) {
		return [...this.getRbfKernelSourcePointCoefsArray(e), ...eu.getPolynomial1SourcePointCoefsArray(e)];
	}
	getRbfKernelSourcePointCoefsArray(e) {
		let t = [];
		for (let n = 0; n < this.pointCount; n++) t.push(this.kernelFunction(this.normFunction(this.sourcePoints[n], e), { epsilon: this.epsilon }));
		return t;
	}
	setWeightsArrays(e, t) {
		t && (this.epsilon = t), super.setWeightsArrays(e);
	}
	solve() {
		this.weightsArrays = Jl(this.coefsArrayMatrix, this.destinationPointsArrays), this.processWeightsArrays();
	}
	processWeightsArrays() {
		if (!this.weightsArrays) throw Error("Weights not computed");
		this.rbfWeightsArrays = this.weightsArrays.map((e) => e.slice(0, this.pointCount)), this.affineWeightsArrays = this.weightsArrays.map((e) => e.slice(this.pointCount));
	}
	evaluateFunction(e) {
		if (this.weightsArrays || this.solve(), !this.rbfWeightsArrays || !this.affineWeightsArrays) throw Error("RBF weights not computed");
		let t = this.rbfWeightsArrays, n = this.affineWeightsArrays, r = this.sourcePoints.map((t) => this.normFunction(e, t)), i = [0, 0];
		for (let a = 0; a < 2; a++) i[a] = r.reduce((e, n, r) => e + this.kernelFunction(n, { epsilon: this.epsilon }) * t[a][r], 0), i[a] += n[a][0] + n[a][1] * e[0] + n[a][2] * e[1];
		return i;
	}
	evaluatePartialDerivativeX(e) {
		if (this.weightsArrays || this.solve(), !this.rbfWeightsArrays || !this.affineWeightsArrays) throw Error("RBF weights not computed");
		let t = this.rbfWeightsArrays, n = this.affineWeightsArrays, r = this.sourcePoints.map((t) => this.normFunction(e, t)), i = [0, 0];
		for (let a = 0; a < 2; a++) i[a] = r.reduce((n, r, i) => n + (r === 0 ? 0 : this.kernelFunction(r, {
			derivative: 1,
			epsilon: this.epsilon
		}) * ((e[0] - this.sourcePoints[i][0]) / r) * t[a][i]), 0), i[a] += n[a][1];
		return i;
	}
	evaluatePartialDerivativeY(e) {
		if (this.weightsArrays || this.solve(), !this.rbfWeightsArrays || !this.affineWeightsArrays) throw Error("RBF weights not computed");
		let t = this.rbfWeightsArrays, n = this.affineWeightsArrays, r = this.sourcePoints.map((t) => this.normFunction(e, t)), i = [0, 0];
		for (let a = 0; a < 2; a++) i[a] = r.reduce((n, r, i) => n + (r === 0 ? 0 : this.kernelFunction(r, {
			derivative: 1,
			epsilon: this.epsilon
		}) * ((e[1] - this.sourcePoints[i][1]) / r) * t[a][i]), 0), i[a] += n[a][2];
		return i;
	}
};
//#endregion
//#region node_modules/@allmaps/transform/dist/shared/kernel-functions.js
function au(e, t) {
	if (!t.derivative) return e;
	if (t.derivative === 1) return 1;
	throw Error("Derivate of order " + t.derivative + " not implemented");
}
function ou(e, t) {
	if (!t.derivative) return e === 0 ? 0 : e ** 2 * Math.log(e);
	if (t.derivative === 1) return e === 0 ? 0 : e + 2 * e * Math.log(e);
	throw Error("Derivate of order " + t.derivative + " not implemented");
}
//#endregion
//#region node_modules/@allmaps/transform/dist/shared/norm-functions.js
function su(e, t) {
	let n = t[0] - e[0], r = t[1] - e[1];
	return Math.sqrt(n * n + r * r);
}
//#endregion
//#region node_modules/@turf/midpoint/node_modules/@turf/bearing/dist/esm/index.js
function cu(e, t, n = {}) {
	if (n.final === !0) return lu(e, t);
	let r = Co(e), i = Co(t), a = bo(r[0]), o = bo(i[0]), s = bo(r[1]), c = bo(i[1]), l = Math.sin(o - a) * Math.cos(c), u = Math.cos(s) * Math.sin(c) - Math.sin(s) * Math.cos(c) * Math.cos(o - a);
	return yo(Math.atan2(l, u));
}
function lu(e, t) {
	let n = cu(t, e);
	return n = (n + 180) % 360, n;
}
//#endregion
//#region node_modules/@turf/midpoint/node_modules/@turf/destination/dist/esm/index.js
function uu(e, t, n, r = {}) {
	let i = Co(e), a = bo(i[0]), o = bo(i[1]), s = bo(n), c = vo(t, r.units), l = Math.asin(Math.sin(o) * Math.cos(c) + Math.cos(o) * Math.sin(c) * Math.cos(s)), u = yo(a + Math.atan2(Math.sin(s) * Math.sin(c) * Math.cos(o), Math.cos(c) - Math.sin(o) * Math.sin(l))), d = yo(l);
	return i[2] === void 0 ? ho([u, d], r.properties) : ho([
		u,
		d,
		i[2]
	], r.properties);
}
//#endregion
//#region node_modules/@turf/midpoint/node_modules/@turf/distance/dist/esm/index.js
function du(e, t, n = {}) {
	var r = Co(e), i = Co(t), a = bo(i[1] - r[1]), o = bo(i[0] - r[0]), s = bo(r[1]), c = bo(i[1]), l = Math.sin(a / 2) ** 2 + Math.sin(o / 2) ** 2 * Math.cos(s) * Math.cos(c);
	return _o(2 * Math.atan2(Math.sqrt(l), Math.sqrt(1 - l)), n.units);
}
//#endregion
//#region node_modules/@turf/midpoint/dist/esm/index.js
function fu(e, t) {
	let n = du(e, t), r = cu(e, t);
	return uu(e, n / 2, r);
}
var pu = fu, mu = {
	maxDepth: 0,
	minOffsetRatio: 0,
	minOffsetDistance: Infinity,
	minLineDistance: Infinity,
	sourceMidPointFunction: ps,
	destinationMidPointFunction: ps,
	destinationDistanceFunction: gs
};
function hu(e, t, n) {
	return e = Uo(e), Cu(Su(e.map((e) => ({
		source: e,
		destination: t(e)
	})), !1).map((e) => _u(e, t, n, 0)).flat(1), !0);
}
function gu(e, t, n) {
	return e = Wo(e), Cu(Su(e.map((e) => ({
		source: e,
		destination: t(e)
	})), !0).map((e) => _u(e, t, n, 0)).flat(1), !1);
}
function _u(e, t, n, r) {
	let i = vu(e, t, n, r);
	return i ? [_u([e[0], i], t, n, r + 1), _u([i, e[1]], t, n, r + 1)].flat(1) : [e];
}
function vu(e, t, n, r) {
	if (r >= n.maxDepth || n.maxDepth <= 0) return;
	let { sourceMidPoint: i, destinationMidPointFromRefinementFunction: a, destinationMidPointsDistance: o, destinationLineDistance: s, destinationRefinedLineDistance: c } = yu(e, t, n);
	return bu({
		destinationMidPointsDistance: o,
		destinationLineDistance: s,
		destinationRefinedLineDistance: c
	}, n) ? {
		source: i,
		destination: a
	} : void 0;
}
function yu(e, t, n) {
	let r = n.sourceMidPointFunction(e[0].source, e[1].source), i = n.destinationMidPointFunction(e[0].destination, e[1].destination), a = t(r), o = n.destinationDistanceFunction(e[0].destination, e[1].destination), s = n.destinationDistanceFunction(t(e[0].source), t(e[1].source));
	return {
		sourceMidPoint: r,
		destinationMidPointFromRefinementFunction: a,
		destinationMidPointsDistance: n.destinationDistanceFunction(i, a),
		destinationLineDistance: o,
		destinationRefinedLineDistance: s
	};
}
function bu({ destinationMidPointsDistance: e, destinationLineDistance: t, destinationRefinedLineDistance: n }, r) {
	return e / t > r.minOffsetRatio || e > r.minOffsetDistance || n > r.minLineDistance;
}
function xu(e, t, n) {
	let r = fc(e), i = r[2], a = r[3], o = r[1], s = r[0], c = n.sourceMidPointFunction(i, o), l = n.sourceMidPointFunction(a, s), u = n.sourceMidPointFunction(i, a), d = n.sourceMidPointFunction(o, s), f = [c, l], p = [u, d], m = hu(f, t, n).map((e) => e.source), h = hu(p, t, n).map((e) => e.source);
	if (m.length === 2 && h.length === 2) return;
	let g = [];
	for (let e = 0; e < m.length - 1; e++) g.push(_s(m[e], m[e + 1]));
	let _ = Math.sqrt(Math.min(...g)), v = [];
	for (let e = 0; e < h.length - 1; e++) v.push(_s(h[e], h[e + 1]));
	let y = Math.sqrt(Math.min(...v));
	return Math.min(_, y);
}
function Su(e, t = !1) {
	let n = e.length - +!t, r = [];
	for (let t = 0; t < n; t++) r.push([e[t], e[(t + 1) % e.length]]);
	return r;
}
function Cu(e, t = !1) {
	let n = e.map((e) => e[0]);
	return t && n.push(e[e.length - 1][1]), n;
}
//#endregion
//#region node_modules/@allmaps/transform/dist/shared/transform-functions.js
var wu = {
	maxDepth: 0,
	minOffsetRatio: 0,
	minOffsetDistance: Infinity,
	minLineDistance: Infinity,
	sourceIsGeographic: !1,
	destinationIsGeographic: !1,
	isMultiGeometry: !1,
	distortionMeasures: [],
	referenceScale: 1,
	preForward: (e) => e,
	postForward: (e) => e,
	preBackward: (e) => e,
	postBackward: (e) => e
}, Tu = {
	differentHandedness: !1,
	...wu
};
function Eu(e) {
	if (e === void 0) return {};
	let t = e;
	return e.geoIsGeographic && (t.destinationIsGeographic = e.geoIsGeographic), e.postToGeo && (t.postForward = e.postToGeo), e.preToResource && (t.preBackward = e.preToResource), t;
}
function Du(e) {
	return e === void 0 ? {} : Eu(e);
}
function Ou(e) {
	if (e === void 0) return {};
	let t = e;
	return e.destinationIsGeographic && (t.geoIsGeographic = e.destinationIsGeographic), e.postForward && (t.postToGeo = e.postForward), e.preBackward && (t.preToResource = e.preBackward), t;
}
function ku(e) {
	return e ?? {};
}
Ou(wu);
var Au = ku(Tu);
function ju(e) {
	let t = M(mu, {
		minOffsetRatio: e.minOffsetRatio,
		minOffsetDistance: e.minOffsetDistance,
		minLineDistance: e.minLineDistance,
		maxDepth: e.maxDepth
	});
	return e.sourceIsGeographic && (t.sourceMidPointFunction = (e, t) => pu(e, t).geometry.coordinates), e.destinationIsGeographic && (t.destinationMidPointFunction = (e, t) => pu(e, t).geometry.coordinates, t.destinationDistanceFunction = a), t;
}
function Mu(e) {
	let t = M(mu, {
		minOffsetRatio: e.minOffsetRatio,
		minOffsetDistance: e.minOffsetDistance,
		minLineDistance: e.minLineDistance,
		maxDepth: e.maxDepth
	});
	return e.destinationIsGeographic && (t.sourceMidPointFunction = (e, t) => pu(e, t).geometry.coordinates), e.sourceIsGeographic && (t.destinationMidPointFunction = (e, t) => pu(e, t).geometry.coordinates, t.destinationDistanceFunction = a), t;
}
//#endregion
//#region node_modules/@allmaps/transform/dist/shared/conversion-functions.js
function Nu(e) {
	return {
		source: e.destination,
		destination: e.source
	};
}
function Pu(e) {
	return e.destination;
}
function Fu(e) {
	return e.source;
}
function Iu(e) {
	return e.geo;
}
function Lu(e) {
	return e.resource;
}
function Ru(e) {
	return {
		resource: e.source,
		geo: e.destination,
		partialDerivativeX: e.partialDerivativeX,
		partialDerivativeY: e.partialDerivativeY,
		distortions: e.distortions,
		distortion: e.distortion
	};
}
function zu(e) {
	return {
		source: e.resource,
		destination: e.geo,
		partialDerivativeX: e.partialDerivativeX,
		partialDerivativeY: e.partialDerivativeY,
		distortions: e.distortions,
		distortion: e.distortion
	};
}
//#endregion
//#region node_modules/@allmaps/transform/dist/transformers/BaseGcpTransformer.js
var Bu = class {
	generalGcpsInternal;
	sourcePointsInternal;
	destinationPointsInternal;
	type;
	transformerOptions;
	forwardTransformation;
	backwardTransformation;
	constructor(e, t = "polynomial", n) {
		if (this.transformerOptions = M(Tu, n), e.length === 0) throw Error("No control points");
		this.generalGcpsInternal = e, this.sourcePointsInternal = this.generalGcpsInternal.map((e) => {
			let t = this.transformerOptions.differentHandedness ? ls(e.source) : e.source;
			return this.transformerOptions.preForward(t);
		}), this.destinationPointsInternal = this.generalGcpsInternal.map((e) => this.transformerOptions.preBackward(e.destination)), this.type = t;
	}
	getForwardTransformationInternal() {
		return this.forwardTransformation ||= this.createTransformation(this.sourcePointsInternal, this.destinationPointsInternal), this.forwardTransformation;
	}
	getBackwardTransformationInternal() {
		return this.backwardTransformation ||= this.createTransformation(this.destinationPointsInternal, this.sourcePointsInternal), this.backwardTransformation;
	}
	createTransformation(e, t) {
		if (this.type === "straight") return new Zl(e, t);
		if (this.type === "helmert") return new Xl(e, t);
		if (this.type === "polynomial1" || this.type === "polynomial") return new eu(e, t);
		if (this.type === "polynomial2") return new tu(e, t);
		if (this.type === "polynomial3") return new nu(e, t);
		if (this.type === "projective") return new ru(e, t);
		if (this.type === "thinPlateSpline") return new iu(e, t, ou, su, "thinPlateSpline");
		if (this.type === "linear") return new iu(e, t, au, su, "linear");
		throw Error(`Unsupported transformation type: ${this.type}`);
	}
	getForwardTransformationResolutionInternal(e, t) {
		let n = M(this.transformerOptions, t);
		return xu(e, (e) => this.transformForwardInternal(e, n), ju(n));
	}
	getBackwardTransformationResolutionInternal(e, t) {
		let n = M(this.transformerOptions, t);
		return xu(e, (e) => this.transformBackwardInternal(e, n), Mu(n));
	}
	transformForwardInternal(e, t, n = Pu) {
		let r = M(this.transformerOptions, t);
		if (r.isMultiGeometry) {
			if (t && (t.isMultiGeometry = !1), Io(e) || Lo(e) || Ro(e)) return e.map((e) => this.transformForwardInternal(e, t, n));
			throw Error("Geometry type not supported");
		} else {
			if (Mo(e)) return this.transformPointForwardInternal(e, r, n);
			if (No(e)) return this.transformLineStringForwardInternal(e, r, n);
			if (Fo(e)) return this.transformPolygonForwardInternal(e, r, n);
			throw Error("Geometry type not supported");
		}
	}
	transformBackwardInternal(e, t, n = Fu) {
		let r = M(this.transformerOptions, t);
		if (r.isMultiGeometry) {
			if (t && (t.isMultiGeometry = !1), Io(e) || Lo(e) || Ro(e)) return e.map((e) => this.transformBackwardInternal(e, t, n));
			throw Error("Geometry type not supported");
		} else {
			if (Mo(e)) return this.transformPointBackwardInternal(e, r, n);
			if (No(e)) return this.transformLineStringBackwardInternal(e, r, n);
			if (Fo(e)) return this.transformPolygonBackwardInternal(e, r, n);
			throw Error("Geometry type not supported");
		}
	}
	transformPointForwardInternal(e, t, n = Pu) {
		let r = this.getForwardTransformationInternal(), i = this.transformerOptions.differentHandedness ? ls(e) : e;
		i = t.preForward(i);
		let a = r.evaluateFunction(i);
		a = t.postForward(a);
		let o, s, c = /* @__PURE__ */ new Map();
		return t.distortionMeasures.length > 0 && (o = r.evaluatePartialDerivativeX(i), s = r.evaluatePartialDerivativeY(i), c = xl(t.distortionMeasures, o, s, t.referenceScale)), n({
			source: e,
			destination: a,
			partialDerivativeX: o,
			partialDerivativeY: s,
			distortions: c
		});
	}
	transformPointBackwardInternal(e, t, n = Fu) {
		let r = this.getBackwardTransformationInternal(), i = t.preBackward(e), a = r.evaluateFunction(i);
		a = t.postBackward(a), a = this.transformerOptions.differentHandedness ? ls(a) : a;
		let o, s, c = /* @__PURE__ */ new Map();
		return t.distortionMeasures.length > 0 && (o = r.evaluatePartialDerivativeX(i), o = this.transformerOptions.differentHandedness ? ls(o) : o, s = r.evaluatePartialDerivativeY(i), s = this.transformerOptions.differentHandedness ? ls(s) : s, c = xl(t.distortionMeasures, o, s, t.referenceScale)), n({
			source: a,
			destination: i,
			partialDerivativeX: o,
			partialDerivativeY: s,
			distortions: c
		});
	}
	transformLineStringForwardInternal(e, t, n) {
		return hu(e, (e) => this.transformPointForwardInternal(e, t), ju(t)).map((e) => n(e));
	}
	transformLineStringBackwardInternal(e, t, n) {
		return hu(e, (e) => this.transformPointBackwardInternal(e, t), Mu(t)).map((e) => n(Nu(e)));
	}
	transformRingForwardInternal(e, t, n) {
		return gu(e, (e) => this.transformPointForwardInternal(e, t), ju(t)).map((e) => n(e));
	}
	transformRingBackwardInternal(e, t, n) {
		return gu(e, (e) => this.transformPointBackwardInternal(e, t), Mu(t)).map((e) => n(Nu(e)));
	}
	transformPolygonForwardInternal(e, t, n) {
		return e.map((e) => this.transformRingForwardInternal(e, t, n));
	}
	transformPolygonBackwardInternal(e, t, n) {
		return e.map((e) => this.transformRingBackwardInternal(e, t, n));
	}
}, Vu = class e extends Bu {
	constructor(e, t = "polynomial", n) {
		let r = e.filter((e) => e.geo && e.resource).map(zu);
		n = N({ differentHandedness: !0 }, n), super(r, t, Du(n));
	}
	get gcps() {
		return this.generalGcpsInternal.map(Ru);
	}
	getToGeoTransformation() {
		return super.getForwardTransformationInternal();
	}
	getToResourceTransformation() {
		return super.getBackwardTransformationInternal();
	}
	getToGeoTransformationResolution(e, t) {
		let n = Eu(t);
		return super.getForwardTransformationResolutionInternal(e, n);
	}
	getToResourceTransformationResolution(e, t) {
		let n = Eu(t);
		return super.getBackwardTransformationResolutionInternal(e, n);
	}
	getTransformerOptions() {
		return this.transformerOptions;
	}
	setTransformerOptionsInternal(e) {
		this.transformerOptions = M(this.transformerOptions, Du(e));
	}
	transformToGeo(e, t, n = Iu) {
		let r = (e) => n(Ru(e)), i = t ? Eu(t) : void 0;
		return super.transformForwardInternal(e, i, r);
	}
	transformToResource(e, t, n = Lu) {
		let r = (e) => n(Ru(e)), i = t ? Eu(t) : void 0;
		return super.transformBackwardInternal(e, i, r);
	}
	static transformSvgToGeojson(e, t, n) {
		return n = N({ geoIsGeographic: !0 }, n), es(e.transformToGeo(yl(t), n));
	}
	static transformSvgStringToGeojsonFeatureCollection(e, t, n) {
		let r = [];
		for (let i of fl(t)) {
			let t = this.transformSvgToGeojson(e, i, n);
			r.push(t);
		}
		return Xs(r);
	}
	static transformGeojsonToSvg(e, t, n) {
		return n = N({ geoIsGeographic: !0 }, n), is(e.transformToResource(Js(t), n));
	}
	static transformGeojsonFeatureCollectionToSvgString(e, t, n) {
		let r = [];
		for (let i of Qs(t)) {
			let t = this.transformGeojsonToSvg(e, i, n);
			r.push(t);
		}
		return gl(r);
	}
	static fromGeoreferencedMap(t, n) {
		return new e(t.gcps, n?.transformationType || t.transformation?.type, n);
	}
}, Hu = [
	"EPSG:4326",
	"+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees",
	"GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]]",
	"GEOGCRS[\"WGS 84\",ENSEMBLE[\"World Geodetic System 1984 ensemble\",MEMBER[\"World Geodetic System 1984 (Transit)\"],MEMBER[\"World Geodetic System 1984 (G730)\"],MEMBER[\"World Geodetic System 1984 (G873)\"],MEMBER[\"World Geodetic System 1984 (G1150)\"],MEMBER[\"World Geodetic System 1984 (G1674)\"],MEMBER[\"World Geodetic System 1984 (G1762)\"],MEMBER[\"World Geodetic System 1984 (G2139)\"],MEMBER[\"World Geodetic System 1984 (G2296)\"],ELLIPSOID[\"WGS 84\",6378137,298.257223563,LENGTHUNIT[\"metre\",1]],ENSEMBLEACCURACY[2.0]],PRIMEM[\"Greenwich\",0,ANGLEUNIT[\"degree\",0.0174532925199433]],CS[ellipsoidal,2],AXIS[\"geodetic latitude (Lat)\",north,ORDER[1],ANGLEUNIT[\"degree\",0.0174532925199433]],AXIS[\"geodetic longitude (Lon)\",east,ORDER[2],ANGLEUNIT[\"degree\",0.0174532925199433]],USAGE[SCOPE[\"Horizontal component of 3D system.\"],AREA[\"World.\"],BBOX[-90,-180,90,180]],ID[\"EPSG\",4326]]",
	"+proj=longlat +datum=WGS84 +no_defs +type=crs",
	"WGS84"
], Uu = [
	"EPSG:3857",
	"+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs",
	"PROJCS[\"WGS 84 / Pseudo-Mercator\",GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]],PROJECTION[\"Mercator_1SP\"],PARAMETER[\"central_meridian\",0],PARAMETER[\"scale_factor\",1],PARAMETER[\"false_easting\",0],PARAMETER[\"false_northing\",0],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AXIS[\"Easting\",EAST],AXIS[\"Northing\",NORTH],EXTENSION[\"PROJ4\",\"+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs\"],AUTHORITY[\"EPSG\",\"3857\"]]",
	"PROJCRS[\"WGS 84 / Pseudo-Mercator\",BASEGEOGCRS[\"WGS 84\",ENSEMBLE[\"World Geodetic System 1984 ensemble\",MEMBER[\"World Geodetic System 1984 (Transit)\"],MEMBER[\"World Geodetic System 1984 (G730)\"],MEMBER[\"World Geodetic System 1984 (G873)\"],MEMBER[\"World Geodetic System 1984 (G1150)\"],MEMBER[\"World Geodetic System 1984 (G1674)\"],MEMBER[\"World Geodetic System 1984 (G1762)\"],MEMBER[\"World Geodetic System 1984 (G2139)\"],MEMBER[\"World Geodetic System 1984 (G2296)\"],ELLIPSOID[\"WGS 84\",6378137,298.257223563,LENGTHUNIT[\"metre\",1]],ENSEMBLEACCURACY[2.0]],PRIMEM[\"Greenwich\",0,ANGLEUNIT[\"degree\",0.0174532925199433]],ID[\"EPSG\",4326]],CONVERSION[\"Popular Visualisation Pseudo-Mercator\",METHOD[\"Popular Visualisation Pseudo Mercator\",ID[\"EPSG\",1024]],PARAMETER[\"Latitude of natural origin\",0,ANGLEUNIT[\"degree\",0.0174532925199433],ID[\"EPSG\",8801]],PARAMETER[\"Longitude of natural origin\",0,ANGLEUNIT[\"degree\",0.0174532925199433],ID[\"EPSG\",8802]],PARAMETER[\"False easting\",0,LENGTHUNIT[\"metre\",1],ID[\"EPSG\",8806]],PARAMETER[\"False northing\",0,LENGTHUNIT[\"metre\",1],ID[\"EPSG\",8807]]],CS[Cartesian,2],AXIS[\"easting (X)\",east,ORDER[1],LENGTHUNIT[\"metre\",1]],AXIS[\"northing (Y)\",north,ORDER[2],LENGTHUNIT[\"metre\",1]],USAGE[SCOPE[\"Web mapping and visualisation.\"],AREA[\"World between 85.06°S and 85.06°N.\"],BBOX[-85.06,-180,85.06,180]],ID[\"EPSG\",3857]]",
	"EPSG:3785",
	"GOOGLE",
	"EPSG:900913",
	"EPSG:102113"
], Wu = {
	name: "EPSG:4326 - WGS 84",
	definition: Hu[0]
}, Gu = {
	name: "EPSG:3857 - WGS 84 / Pseudo-Mercator",
	definition: Uu[0]
}, Ku = {
	internalProjection: Gu,
	projection: Gu,
	...Au
};
({ ...Au });
var qu = o(Wu.definition, Gu.definition), Ju = qu.forward;
qu.inverse;
function Yu(e) {
	let t = Hu.indexOf(e), n = Uu.indexOf(e);
	return t == -1 ? n == -1 ? e : Gu.definition : Wu.definition;
}
function Xu(e, t) {
	return Yu(String(e?.definition)) == Yu(String(t?.definition));
}
//#endregion
//#region node_modules/@allmaps/project/dist/projected-transformers/ProjectedGcpTransformer.js
var Zu = class e extends Vu {
	internalProjection;
	projection;
	internalProjectionToProjection;
	projectionToInternalProjection;
	lonLatToProjection;
	projectionToLonLat;
	constructor(e, t = "polynomial", n) {
		let r = Xc(Ku, n), i = o(r.internalProjection.definition, r.projection.definition), a = i.forward, s = i.inverse, c = o(Wu.definition, r.projection.definition), l = c.forward, u = c.inverse, d = {
			...n,
			postToGeo: a,
			preToResource: s
		};
		e = e.filter((e) => e.geo && e.resource).map((e) => ({
			resource: e.resource,
			geo: l(e.geo)
		})), super(e, t, d), this.internalProjection = r.internalProjection, this.projection = r.projection, this.internalProjectionToProjection = a, this.projectionToInternalProjection = s, this.lonLatToProjection = l, this.projectionToLonLat = u;
	}
	get gcps() {
		return super.gcps;
	}
	get lonlatGcps() {
		return this.projectedGcps.map(({ resource: e, geo: t }) => ({
			resource: e,
			geo: this.projectionToLonLat(t)
		}));
	}
	get interalProjectedGcps() {
		return this.projectedGcps.map(({ resource: e, geo: t }) => ({
			resource: e,
			geo: this.projectionToInternalProjection(t)
		}));
	}
	get projectedGcps() {
		return this.gcps;
	}
	transformToGeo(e, t, n) {
		let r = t?.projection, i = t;
		if (r) {
			let e = o(this.internalProjection.definition, r.definition), t = e.forward, n = e.inverse;
			i = N(i, {
				postToGeo: t,
				preToResource: n
			});
		}
		return super.transformToGeo(e, i, n);
	}
	transformToResource(e, t, n) {
		let r = t?.projection, i = t;
		if (r) {
			let e = o(this.internalProjection.definition, r.definition), t = e.forward, n = e.inverse;
			i = N(i, {
				postToGeo: t,
				preToResource: n
			});
		}
		return super.transformToResource(e, i, n);
	}
	static fromGeoreferencedMap(t, n) {
		return n = M({
			transformationType: t.transformation?.type,
			internalProjection: t.resourceCrs
		}, n), new e(t.gcps, n.transformationType, n);
	}
	static setProjection(e, t) {
		if (Xu(t, e.projection)) return e;
		let n = o(e.internalProjection.definition, t.definition), r = n.forward, i = n.inverse, a = o(Wu.definition, t.definition), s = a.forward, c = a.inverse, l = {
			postToGeo: r,
			preToResource: i
		};
		return e.setTransformerOptionsInternal(l), e.projection = t, e.internalProjectionToProjection = r, e.projectionToInternalProjection = i, e.lonLatToProjection = s, e.projectionToLonLat = c, e;
	}
}, F = /* @__PURE__ */ ((e) => (e.IMAGEINFOSADDED = "imageinfosadded", e.GEOREFERENCEANNOTATIONADDED = "georeferenceannotationadded", e.GEOREFERENCEANNOTATIONREMOVED = "georeferenceannotationremoved", e.WARPEDMAPADDED = "warpedmapadded", e.WARPEDMAPREMOVED = "warpedmapremoved", e.WARPEDMAPENTERED = "warpedmapentered", e.WARPEDMAPLEFT = "warpedmapleft", e.IMAGELOADED = "imageloaded", e.TILEFETCHED = "tilefetched", e.TILEFETCHERROR = "tilefetcherror", e.TILESFROMSPRITETILE = "tilesfromspritetile", e.MAPTILELOADED = "maptileloaded", e.MAPTILESLOADEDFROMSPRITES = "maptilesloadedfromsprites", e.MAPTILEDELETED = "maptiledeleted", e.FIRSTMAPTILELOADED = "firstmaptileloaded", e.ALLREQUESTEDTILESLOADED = "allrequestedtilesloaded", e.TEXTURESUPDATED = "texturesupdated", e.CLEARED = "cleared", e.PREPARECHANGE = "preparechange", e.IMMEDIATECHANGE = "immediatechange", e.ANIMATEDCHANGE = "animatedchange", e.CHANGED = "changed", e))(F || {}), I = class extends Event {
	data;
	constructor(e, t) {
		super(e), this.data = t;
	}
}, Qu = 4, $u = 2, ed = class extends EventTarget {
	cacheableTileFactory;
	fetchFn;
	tileCacheForTilesFromSprites;
	tilesByTileUrl = /* @__PURE__ */ new Map();
	mapIdsByTileUrl = /* @__PURE__ */ new Map();
	tileUrlsByMapId = /* @__PURE__ */ new Map();
	tilesFetchingCount = 0;
	fetchableTiles = [];
	constructor(e, t) {
		super(), this.setOptions(t), this.cacheableTileFactory = e;
	}
	getCacheableTiles() {
		return this.tilesByTileUrl.values();
	}
	getCacheableTile(e) {
		return this.tilesByTileUrl.get(e);
	}
	getMapCacheableTiles(e) {
		let t = [], n = this.tileUrlsByMapId.get(e);
		if (n) for (let e of n) {
			let n = this.tilesByTileUrl.get(e);
			n && t.push(n);
		}
		return t;
	}
	getCachedTiles() {
		let e = [];
		for (let t of this.tilesByTileUrl.values()) t.isCachedTile() && e.push(t);
		return e;
	}
	getCachedTile(e) {
		let t = this.tilesByTileUrl.get(e);
		if (t && t.isCachedTile()) return t;
	}
	getMapCachedTiles(e) {
		let t = [], n = this.tileUrlsByMapId.get(e);
		if (n) for (let e of n) {
			let n = this.tilesByTileUrl.get(e);
			n && n.isCachedTile() && t.push(n);
		}
		return t;
	}
	getTileUrls() {
		return this.tilesByTileUrl.keys();
	}
	getMapTileUrls(e) {
		return this.tileUrlsByMapId.get(e) || /* @__PURE__ */ new Set();
	}
	setOptions(e) {
		this.fetchFn = e?.fetchFn, this.tileCacheForTilesFromSprites = e?.tileCacheForSprites;
	}
	requestFetchableTiles(e) {
		if (!zc(new Set(this.fetchableTiles.map((e) => e.fetchableTileKey)), new Set(e.map((e) => e.fetchableTileKey)))) {
			for (let t of e) this.requestFetchableTile(t);
			this.fetchableTiles = e;
		}
	}
	async allRequestedTilesLoaded() {
		return new Promise((e) => {
			if (this.finished) e();
			else {
				let t = () => {
					this.removeEventListener(F.ALLREQUESTEDTILESLOADED, t), e();
				};
				this.addEventListener(F.ALLREQUESTEDTILESLOADED, t);
			}
		});
	}
	prune(e) {
		for (let [t, n] of this.mapIdsByTileUrl.entries()) for (let r of n) {
			let n = e.get(r), i = this.tilesByTileUrl.get(t);
			i && i.shouldPrune(n, {
				maxHigherLog2ScaleFactorDiff: Qu,
				maxLowerLog2ScaleFactorDiff: $u
			}) && this.removeCacheableTileForMapId(t, r);
		}
	}
	clear() {
		for (let e of this.getCacheableTiles()) e.abort(), this.removeEventListenersFromCacheableTile(e);
		this.tilesByTileUrl = /* @__PURE__ */ new Map(), this.mapIdsByTileUrl = /* @__PURE__ */ new Map(), this.tileUrlsByMapId = /* @__PURE__ */ new Map(), this.tilesFetchingCount = 0;
	}
	destroy() {
		this.clear();
	}
	requestFetchableTile(e) {
		let t = e.mapId, n = e.tileUrl;
		if (this.tilesByTileUrl.has(n)) this.tilesByTileUrl.get(n)?.isCachedTile() && this.dispatchEvent(new I(F.MAPTILELOADED, {
			mapIds: [t],
			tileUrl: n
		}));
		else {
			let t = this.cacheableTileFactory(e, this.fetchFn);
			this.addEventListenersToCacheableTile(t), this.addCacheableTile(t);
		}
		this.addTileUrlForMapId(n, t), this.addMapIdForTileUrl(t, n);
	}
	addCacheableTile(e) {
		this.tilesByTileUrl.set(e.fetchableTile.tileUrl, e), e.fetch(), this.updateTilesFetchingCount(1);
	}
	addCachedTile(e) {
		let t = e.fetchableTile.mapId, n = e.fetchableTile.tileUrl;
		this.tilesByTileUrl.has(n) || (this.tilesByTileUrl.set(n, e), this.addTileUrlForMapId(n, t), this.addMapIdForTileUrl(t, n), this.dispatchEvent(new I(F.MAPTILELOADED, {
			mapIds: [t],
			tileUrl: n
		})));
	}
	removeCacheableTileForMapId(e, t) {
		let n = this.tilesByTileUrl.get(e);
		if (!n) return;
		let r = this.removeMapIdForTileUrl(t, e);
		this.removeTileUrlForMapId(e, t), r.size || (n.isCachedTile() || (n.abort(), this.updateTilesFetchingCount(-1)), this.tilesByTileUrl.delete(e)), this.dispatchEvent(new I(F.MAPTILEDELETED, {
			mapIds: [t],
			tileUrl: e
		}));
	}
	tileFetched(e) {
		if (e instanceof I) {
			if (!e.data?.tileUrl) throw Error("Event data missing");
			let { tileUrl: t } = e.data;
			this.updateTilesFetchingCount(-1);
			for (let e of this.mapIdsByTileUrl.get(t) || []) this.dispatchEvent(new I(F.MAPTILELOADED, {
				mapIds: [e],
				tileUrl: t
			})), this.tileUrlsByMapId.get(e)?.values().next().value === t && this.dispatchEvent(new I(F.FIRSTMAPTILELOADED, {
				mapIds: [e],
				tileUrl: t
			}));
			this.tileCacheForTilesFromSprites && this.tilesByTileUrl.get(t)?.applySprites();
		}
	}
	tileFetchError(e) {
		if (e instanceof I) {
			if (!e.data?.tileUrl) throw Error("Event data missing");
			let { tileUrl: t } = e.data;
			this.tilesByTileUrl.has(t) || this.updateTilesFetchingCount(-1);
		}
	}
	tilesFromSpriteTile(e) {
		if (e instanceof I) {
			if (!e.data?.tileUrl) throw Error("Event data missing");
			let { tileUrl: t } = e.data;
			this.passTilesFromSprites(t);
		}
	}
	passTilesFromSprites(e) {
		let t;
		if (!e) t = Array.from(this.getCacheableTiles());
		else {
			let n = this.tilesByTileUrl.get(e);
			t = n ? [n] : [];
		}
		for (let e of t) {
			let t = e.getCachedTilesFromSprites();
			if (!t) throw Error("Cached tiles from sprites not found");
			for (let e of t) {
				if (!e.isCachedTile()) break;
				this.tileCacheForTilesFromSprites?.addCachedTile(e);
			}
			let n = t.map((e) => e.fetchableTile.mapId);
			this.dispatchEvent(new I(F.MAPTILESLOADEDFROMSPRITES, {
				mapIds: n,
				spritesInfo: e.fetchableTile.options?.spritesInfo
			}));
		}
	}
	addMapIdForTileUrl(e, t) {
		let n = this.mapIdsByTileUrl.get(t);
		return n ? n.add(e) : n = /* @__PURE__ */ new Set([e]), this.mapIdsByTileUrl.set(t, n), n;
	}
	removeMapIdForTileUrl(e, t) {
		let n = this.mapIdsByTileUrl.get(t);
		if (n) n.delete(e);
		else return /* @__PURE__ */ new Set();
		return n.size ? this.mapIdsByTileUrl.set(t, n) : this.mapIdsByTileUrl.delete(t), n;
	}
	addTileUrlForMapId(e, t) {
		let n = this.tileUrlsByMapId.get(t);
		return n ? n.add(e) : n = /* @__PURE__ */ new Set([e]), this.tileUrlsByMapId.set(t, n), n;
	}
	removeTileUrlForMapId(e, t) {
		let n = this.tileUrlsByMapId.get(t);
		return n ? (n.delete(e), n.size ? this.tileUrlsByMapId.set(t, n) : this.tileUrlsByMapId.delete(t), n) : /* @__PURE__ */ new Set();
	}
	get finished() {
		return this.tilesFetchingCount === 0;
	}
	updateTilesFetchingCount(e) {
		this.tilesFetchingCount += e, this.tilesFetchingCount === 0 && this.dispatchEvent(new I(F.ALLREQUESTEDTILESLOADED));
	}
	addEventListenersToCacheableTile(e) {
		e.addEventListener(F.TILEFETCHED, this.tileFetched.bind(this)), e.addEventListener(F.TILEFETCHERROR, this.tileFetchError.bind(this)), e.addEventListener(F.TILESFROMSPRITETILE, this.tilesFromSpriteTile.bind(this));
	}
	removeEventListenersFromCacheableTile(e) {
		e.removeEventListener(F.TILEFETCHED, this.tileFetched.bind(this)), e.removeEventListener(F.TILEFETCHERROR, this.tileFetchError.bind(this)), e.removeEventListener(F.TILESFROMSPRITETILE, this.tilesFromSpriteTile.bind(this));
	}
};
//#endregion
//#region node_modules/@allmaps/id/dist/checksum.js
function td(e) {
	return Array.isArray(e) ? `[${e.map((e) => td(e)).join(",")}]` : typeof e == "number" ? `${e}` : typeof e == "string" ? `"${e}"` : typeof e == "object" && e ? Object.keys(e).sort().map((t) => `${t}:${td(e[t])}`).join("|") : String(e);
}
//#endregion
//#region node_modules/@allmaps/id/dist/index.js
var nd = 16;
async function rd(e) {
	let t = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(e));
	return Array.from(new Uint8Array(t)).map((e) => e.toString(16).padStart(2, "0")).join("");
}
async function id(e, t = nd) {
	return (await rd(String(e))).slice(0, t);
}
async function ad(e, t = nd) {
	return await id(td(e), t);
}
//#endregion
//#region node_modules/zod/v3/helpers/util.js
var L;
(function(e) {
	e.assertEqual = (e) => {};
	function t(e) {}
	e.assertIs = t;
	function n(e) {
		throw Error();
	}
	e.assertNever = n, e.arrayToEnum = (e) => {
		let t = {};
		for (let n of e) t[n] = n;
		return t;
	}, e.getValidEnumValues = (t) => {
		let n = e.objectKeys(t).filter((e) => typeof t[t[e]] != "number"), r = {};
		for (let e of n) r[e] = t[e];
		return e.objectValues(r);
	}, e.objectValues = (t) => e.objectKeys(t).map(function(e) {
		return t[e];
	}), e.objectKeys = typeof Object.keys == "function" ? (e) => Object.keys(e) : (e) => {
		let t = [];
		for (let n in e) Object.prototype.hasOwnProperty.call(e, n) && t.push(n);
		return t;
	}, e.find = (e, t) => {
		for (let n of e) if (t(n)) return n;
	}, e.isInteger = typeof Number.isInteger == "function" ? (e) => Number.isInteger(e) : (e) => typeof e == "number" && Number.isFinite(e) && Math.floor(e) === e;
	function r(e, t = " | ") {
		return e.map((e) => typeof e == "string" ? `'${e}'` : e).join(t);
	}
	e.joinValues = r, e.jsonStringifyReplacer = (e, t) => typeof t == "bigint" ? t.toString() : t;
})(L ||= {});
var od;
(function(e) {
	e.mergeShapes = (e, t) => ({
		...e,
		...t
	});
})(od ||= {});
var R = L.arrayToEnum([
	"string",
	"nan",
	"number",
	"integer",
	"float",
	"boolean",
	"date",
	"bigint",
	"symbol",
	"function",
	"undefined",
	"null",
	"array",
	"object",
	"unknown",
	"promise",
	"void",
	"never",
	"map",
	"set"
]), sd = (e) => {
	switch (typeof e) {
		case "undefined": return R.undefined;
		case "string": return R.string;
		case "number": return Number.isNaN(e) ? R.nan : R.number;
		case "boolean": return R.boolean;
		case "function": return R.function;
		case "bigint": return R.bigint;
		case "symbol": return R.symbol;
		case "object": return Array.isArray(e) ? R.array : e === null ? R.null : e.then && typeof e.then == "function" && e.catch && typeof e.catch == "function" ? R.promise : typeof Map < "u" && e instanceof Map ? R.map : typeof Set < "u" && e instanceof Set ? R.set : typeof Date < "u" && e instanceof Date ? R.date : R.object;
		default: return R.unknown;
	}
}, z = L.arrayToEnum([
	"invalid_type",
	"invalid_literal",
	"custom",
	"invalid_union",
	"invalid_union_discriminator",
	"invalid_enum_value",
	"unrecognized_keys",
	"invalid_arguments",
	"invalid_return_type",
	"invalid_date",
	"invalid_string",
	"too_small",
	"too_big",
	"invalid_intersection_types",
	"not_multiple_of",
	"not_finite"
]), cd = class e extends Error {
	get errors() {
		return this.issues;
	}
	constructor(e) {
		super(), this.issues = [], this.addIssue = (e) => {
			this.issues = [...this.issues, e];
		}, this.addIssues = (e = []) => {
			this.issues = [...this.issues, ...e];
		};
		let t = new.target.prototype;
		Object.setPrototypeOf ? Object.setPrototypeOf(this, t) : this.__proto__ = t, this.name = "ZodError", this.issues = e;
	}
	format(e) {
		let t = e || function(e) {
			return e.message;
		}, n = { _errors: [] }, r = (e) => {
			for (let i of e.issues) if (i.code === "invalid_union") i.unionErrors.map(r);
			else if (i.code === "invalid_return_type") r(i.returnTypeError);
			else if (i.code === "invalid_arguments") r(i.argumentsError);
			else if (i.path.length === 0) n._errors.push(t(i));
			else {
				let e = n, r = 0;
				for (; r < i.path.length;) {
					let n = i.path[r];
					r === i.path.length - 1 ? (e[n] = e[n] || { _errors: [] }, e[n]._errors.push(t(i))) : e[n] = e[n] || { _errors: [] }, e = e[n], r++;
				}
			}
		};
		return r(this), n;
	}
	static assert(t) {
		if (!(t instanceof e)) throw Error(`Not a ZodError: ${t}`);
	}
	toString() {
		return this.message;
	}
	get message() {
		return JSON.stringify(this.issues, L.jsonStringifyReplacer, 2);
	}
	get isEmpty() {
		return this.issues.length === 0;
	}
	flatten(e = (e) => e.message) {
		let t = {}, n = [];
		for (let r of this.issues) if (r.path.length > 0) {
			let n = r.path[0];
			t[n] = t[n] || [], t[n].push(e(r));
		} else n.push(e(r));
		return {
			formErrors: n,
			fieldErrors: t
		};
	}
	get formErrors() {
		return this.flatten();
	}
};
cd.create = (e) => new cd(e);
//#endregion
//#region node_modules/zod/v3/locales/en.js
var ld = (e, t) => {
	let n;
	switch (e.code) {
		case z.invalid_type:
			n = e.received === R.undefined ? "Required" : `Expected ${e.expected}, received ${e.received}`;
			break;
		case z.invalid_literal:
			n = `Invalid literal value, expected ${JSON.stringify(e.expected, L.jsonStringifyReplacer)}`;
			break;
		case z.unrecognized_keys:
			n = `Unrecognized key(s) in object: ${L.joinValues(e.keys, ", ")}`;
			break;
		case z.invalid_union:
			n = "Invalid input";
			break;
		case z.invalid_union_discriminator:
			n = `Invalid discriminator value. Expected ${L.joinValues(e.options)}`;
			break;
		case z.invalid_enum_value:
			n = `Invalid enum value. Expected ${L.joinValues(e.options)}, received '${e.received}'`;
			break;
		case z.invalid_arguments:
			n = "Invalid function arguments";
			break;
		case z.invalid_return_type:
			n = "Invalid function return type";
			break;
		case z.invalid_date:
			n = "Invalid date";
			break;
		case z.invalid_string:
			typeof e.validation == "object" ? "includes" in e.validation ? (n = `Invalid input: must include "${e.validation.includes}"`, typeof e.validation.position == "number" && (n = `${n} at one or more positions greater than or equal to ${e.validation.position}`)) : "startsWith" in e.validation ? n = `Invalid input: must start with "${e.validation.startsWith}"` : "endsWith" in e.validation ? n = `Invalid input: must end with "${e.validation.endsWith}"` : L.assertNever(e.validation) : n = e.validation === "regex" ? "Invalid" : `Invalid ${e.validation}`;
			break;
		case z.too_small:
			n = e.type === "array" ? `Array must contain ${e.exact ? "exactly" : e.inclusive ? "at least" : "more than"} ${e.minimum} element(s)` : e.type === "string" ? `String must contain ${e.exact ? "exactly" : e.inclusive ? "at least" : "over"} ${e.minimum} character(s)` : e.type === "number" || e.type === "bigint" ? `Number must be ${e.exact ? "exactly equal to " : e.inclusive ? "greater than or equal to " : "greater than "}${e.minimum}` : e.type === "date" ? `Date must be ${e.exact ? "exactly equal to " : e.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(e.minimum))}` : "Invalid input";
			break;
		case z.too_big:
			n = e.type === "array" ? `Array must contain ${e.exact ? "exactly" : e.inclusive ? "at most" : "less than"} ${e.maximum} element(s)` : e.type === "string" ? `String must contain ${e.exact ? "exactly" : e.inclusive ? "at most" : "under"} ${e.maximum} character(s)` : e.type === "number" ? `Number must be ${e.exact ? "exactly" : e.inclusive ? "less than or equal to" : "less than"} ${e.maximum}` : e.type === "bigint" ? `BigInt must be ${e.exact ? "exactly" : e.inclusive ? "less than or equal to" : "less than"} ${e.maximum}` : e.type === "date" ? `Date must be ${e.exact ? "exactly" : e.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(e.maximum))}` : "Invalid input";
			break;
		case z.custom:
			n = "Invalid input";
			break;
		case z.invalid_intersection_types:
			n = "Intersection results could not be merged";
			break;
		case z.not_multiple_of:
			n = `Number must be a multiple of ${e.multipleOf}`;
			break;
		case z.not_finite:
			n = "Number must be finite";
			break;
		default: n = t.defaultError, L.assertNever(e);
	}
	return { message: n };
}, ud = ld;
function dd() {
	return ud;
}
//#endregion
//#region node_modules/zod/v3/helpers/parseUtil.js
var fd = (e) => {
	let { data: t, path: n, errorMaps: r, issueData: i } = e, a = [...n, ...i.path || []], o = {
		...i,
		path: a
	};
	if (i.message !== void 0) return {
		...i,
		path: a,
		message: i.message
	};
	let s = "", c = r.filter((e) => !!e).slice().reverse();
	for (let e of c) s = e(o, {
		data: t,
		defaultError: s
	}).message;
	return {
		...i,
		path: a,
		message: s
	};
};
function B(e, t) {
	let n = dd(), r = fd({
		issueData: t,
		data: e.data,
		path: e.path,
		errorMaps: [
			e.common.contextualErrorMap,
			e.schemaErrorMap,
			n,
			n === ld ? void 0 : ld
		].filter((e) => !!e)
	});
	e.common.issues.push(r);
}
var pd = class e {
	constructor() {
		this.value = "valid";
	}
	dirty() {
		this.value === "valid" && (this.value = "dirty");
	}
	abort() {
		this.value !== "aborted" && (this.value = "aborted");
	}
	static mergeArray(e, t) {
		let n = [];
		for (let r of t) {
			if (r.status === "aborted") return V;
			r.status === "dirty" && e.dirty(), n.push(r.value);
		}
		return {
			status: e.value,
			value: n
		};
	}
	static async mergeObjectAsync(t, n) {
		let r = [];
		for (let e of n) {
			let t = await e.key, n = await e.value;
			r.push({
				key: t,
				value: n
			});
		}
		return e.mergeObjectSync(t, r);
	}
	static mergeObjectSync(e, t) {
		let n = {};
		for (let r of t) {
			let { key: t, value: i } = r;
			if (t.status === "aborted" || i.status === "aborted") return V;
			t.status === "dirty" && e.dirty(), i.status === "dirty" && e.dirty(), t.value !== "__proto__" && (i.value !== void 0 || r.alwaysSet) && (n[t.value] = i.value);
		}
		return {
			status: e.value,
			value: n
		};
	}
}, V = Object.freeze({ status: "aborted" }), md = (e) => ({
	status: "dirty",
	value: e
}), H = (e) => ({
	status: "valid",
	value: e
}), hd = (e) => e.status === "aborted", gd = (e) => e.status === "dirty", _d = (e) => e.status === "valid", vd = (e) => typeof Promise < "u" && e instanceof Promise, U;
(function(e) {
	e.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, e.toString = (e) => typeof e == "string" ? e : e?.message;
})(U ||= {});
//#endregion
//#region node_modules/zod/v3/types.js
var yd = class {
	constructor(e, t, n, r) {
		this._cachedPath = [], this.parent = e, this.data = t, this._path = n, this._key = r;
	}
	get path() {
		return this._cachedPath.length || (Array.isArray(this._key) ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
	}
}, bd = (e, t) => {
	if (_d(t)) return {
		success: !0,
		data: t.value
	};
	if (!e.common.issues.length) throw Error("Validation failed but no issues detected.");
	return {
		success: !1,
		get error() {
			if (this._error) return this._error;
			let t = new cd(e.common.issues);
			return this._error = t, this._error;
		}
	};
};
function W(e) {
	if (!e) return {};
	let { errorMap: t, invalid_type_error: n, required_error: r, description: i } = e;
	if (t && (n || r)) throw Error("Can't use \"invalid_type_error\" or \"required_error\" in conjunction with custom error map.");
	return t ? {
		errorMap: t,
		description: i
	} : {
		errorMap: (t, i) => {
			let { message: a } = e;
			return t.code === "invalid_enum_value" ? { message: a ?? i.defaultError } : i.data === void 0 ? { message: a ?? r ?? i.defaultError } : t.code === "invalid_type" ? { message: a ?? n ?? i.defaultError } : { message: i.defaultError };
		},
		description: i
	};
}
var G = class {
	get description() {
		return this._def.description;
	}
	_getType(e) {
		return sd(e.data);
	}
	_getOrReturnCtx(e, t) {
		return t || {
			common: e.parent.common,
			data: e.data,
			parsedType: sd(e.data),
			schemaErrorMap: this._def.errorMap,
			path: e.path,
			parent: e.parent
		};
	}
	_processInputParams(e) {
		return {
			status: new pd(),
			ctx: {
				common: e.parent.common,
				data: e.data,
				parsedType: sd(e.data),
				schemaErrorMap: this._def.errorMap,
				path: e.path,
				parent: e.parent
			}
		};
	}
	_parseSync(e) {
		let t = this._parse(e);
		if (vd(t)) throw Error("Synchronous parse encountered promise.");
		return t;
	}
	_parseAsync(e) {
		let t = this._parse(e);
		return Promise.resolve(t);
	}
	parse(e, t) {
		let n = this.safeParse(e, t);
		if (n.success) return n.data;
		throw n.error;
	}
	safeParse(e, t) {
		let n = {
			common: {
				issues: [],
				async: t?.async ?? !1,
				contextualErrorMap: t?.errorMap
			},
			path: t?.path || [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data: e,
			parsedType: sd(e)
		};
		return bd(n, this._parseSync({
			data: e,
			path: n.path,
			parent: n
		}));
	}
	"~validate"(e) {
		let t = {
			common: {
				issues: [],
				async: !!this["~standard"].async
			},
			path: [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data: e,
			parsedType: sd(e)
		};
		if (!this["~standard"].async) try {
			let n = this._parseSync({
				data: e,
				path: [],
				parent: t
			});
			return _d(n) ? { value: n.value } : { issues: t.common.issues };
		} catch (e) {
			e?.message?.toLowerCase()?.includes("encountered") && (this["~standard"].async = !0), t.common = {
				issues: [],
				async: !0
			};
		}
		return this._parseAsync({
			data: e,
			path: [],
			parent: t
		}).then((e) => _d(e) ? { value: e.value } : { issues: t.common.issues });
	}
	async parseAsync(e, t) {
		let n = await this.safeParseAsync(e, t);
		if (n.success) return n.data;
		throw n.error;
	}
	async safeParseAsync(e, t) {
		let n = {
			common: {
				issues: [],
				contextualErrorMap: t?.errorMap,
				async: !0
			},
			path: t?.path || [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data: e,
			parsedType: sd(e)
		}, r = this._parse({
			data: e,
			path: n.path,
			parent: n
		});
		return bd(n, await (vd(r) ? r : Promise.resolve(r)));
	}
	refine(e, t) {
		let n = (e) => typeof t == "string" || t === void 0 ? { message: t } : typeof t == "function" ? t(e) : t;
		return this._refinement((t, r) => {
			let i = e(t), a = () => r.addIssue({
				code: z.custom,
				...n(t)
			});
			return typeof Promise < "u" && i instanceof Promise ? i.then((e) => e ? !0 : (a(), !1)) : i ? !0 : (a(), !1);
		});
	}
	refinement(e, t) {
		return this._refinement((n, r) => e(n) ? !0 : (r.addIssue(typeof t == "function" ? t(n, r) : t), !1));
	}
	_refinement(e) {
		return new wf({
			schema: this,
			typeName: K.ZodEffects,
			effect: {
				type: "refinement",
				refinement: e
			}
		});
	}
	superRefine(e) {
		return this._refinement(e);
	}
	constructor(e) {
		this.spa = this.safeParseAsync, this._def = e, this.parse = this.parse.bind(this), this.safeParse = this.safeParse.bind(this), this.parseAsync = this.parseAsync.bind(this), this.safeParseAsync = this.safeParseAsync.bind(this), this.spa = this.spa.bind(this), this.refine = this.refine.bind(this), this.refinement = this.refinement.bind(this), this.superRefine = this.superRefine.bind(this), this.optional = this.optional.bind(this), this.nullable = this.nullable.bind(this), this.nullish = this.nullish.bind(this), this.array = this.array.bind(this), this.promise = this.promise.bind(this), this.or = this.or.bind(this), this.and = this.and.bind(this), this.transform = this.transform.bind(this), this.brand = this.brand.bind(this), this.default = this.default.bind(this), this.catch = this.catch.bind(this), this.describe = this.describe.bind(this), this.pipe = this.pipe.bind(this), this.readonly = this.readonly.bind(this), this.isNullable = this.isNullable.bind(this), this.isOptional = this.isOptional.bind(this), this["~standard"] = {
			version: 1,
			vendor: "zod",
			validate: (e) => this["~validate"](e)
		};
	}
	optional() {
		return Tf.create(this, this._def);
	}
	nullable() {
		return Ef.create(this, this._def);
	}
	nullish() {
		return this.nullable().optional();
	}
	array() {
		return af.create(this);
	}
	promise() {
		return Cf.create(this, this._def);
	}
	or(e) {
		return cf.create([this, e], this._def);
	}
	and(e) {
		return ff.create(this, e, this._def);
	}
	transform(e) {
		return new wf({
			...W(this._def),
			schema: this,
			typeName: K.ZodEffects,
			effect: {
				type: "transform",
				transform: e
			}
		});
	}
	default(e) {
		let t = typeof e == "function" ? e : () => e;
		return new Df({
			...W(this._def),
			innerType: this,
			defaultValue: t,
			typeName: K.ZodDefault
		});
	}
	brand() {
		return new Af({
			typeName: K.ZodBranded,
			type: this,
			...W(this._def)
		});
	}
	catch(e) {
		let t = typeof e == "function" ? e : () => e;
		return new Of({
			...W(this._def),
			innerType: this,
			catchValue: t,
			typeName: K.ZodCatch
		});
	}
	describe(e) {
		let t = this.constructor;
		return new t({
			...this._def,
			description: e
		});
	}
	pipe(e) {
		return jf.create(this, e);
	}
	readonly() {
		return Mf.create(this);
	}
	isOptional() {
		return this.safeParse(void 0).success;
	}
	isNullable() {
		return this.safeParse(null).success;
	}
}, xd = /^c[^\s-]{8,}$/i, Sd = /^[0-9a-z]+$/, Cd = /^[0-9A-HJKMNP-TV-Z]{26}$/i, wd = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, Td = /^[a-z0-9_-]{21}$/i, Ed = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, Dd = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, Od = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, kd = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", Ad, jd = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, Md = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, Nd = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, Pd = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, Fd = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, Id = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, Ld = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", Rd = RegExp(`^${Ld}$`);
function zd(e) {
	let t = "[0-5]\\d";
	e.precision ? t = `${t}\\.\\d{${e.precision}}` : e.precision ?? (t = `${t}(\\.\\d+)?`);
	let n = e.precision ? "+" : "?";
	return `([01]\\d|2[0-3]):[0-5]\\d(:${t})${n}`;
}
function Bd(e) {
	return RegExp(`^${zd(e)}$`);
}
function Vd(e) {
	let t = `${Ld}T${zd(e)}`, n = [];
	return n.push(e.local ? "Z?" : "Z"), e.offset && n.push("([+-]\\d{2}:?\\d{2})"), t = `${t}(${n.join("|")})`, RegExp(`^${t}$`);
}
function Hd(e, t) {
	return !!((t === "v4" || !t) && jd.test(e) || (t === "v6" || !t) && Nd.test(e));
}
function Ud(e, t) {
	if (!Ed.test(e)) return !1;
	try {
		let [n] = e.split(".");
		if (!n) return !1;
		let r = n.replace(/-/g, "+").replace(/_/g, "/").padEnd(n.length + (4 - n.length % 4) % 4, "="), i = JSON.parse(atob(r));
		return !(typeof i != "object" || !i || "typ" in i && i?.typ !== "JWT" || !i.alg || t && i.alg !== t);
	} catch {
		return !1;
	}
}
function Wd(e, t) {
	return !!((t === "v4" || !t) && Md.test(e) || (t === "v6" || !t) && Pd.test(e));
}
var Gd = class e extends G {
	_parse(e) {
		if (this._def.coerce && (e.data = String(e.data)), this._getType(e) !== R.string) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.string,
				received: t.parsedType
			}), V;
		}
		let t = new pd(), n;
		for (let r of this._def.checks) if (r.kind === "min") e.data.length < r.value && (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.too_small,
			minimum: r.value,
			type: "string",
			inclusive: !0,
			exact: !1,
			message: r.message
		}), t.dirty());
		else if (r.kind === "max") e.data.length > r.value && (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.too_big,
			maximum: r.value,
			type: "string",
			inclusive: !0,
			exact: !1,
			message: r.message
		}), t.dirty());
		else if (r.kind === "length") {
			let i = e.data.length > r.value, a = e.data.length < r.value;
			(i || a) && (n = this._getOrReturnCtx(e, n), i ? B(n, {
				code: z.too_big,
				maximum: r.value,
				type: "string",
				inclusive: !0,
				exact: !0,
				message: r.message
			}) : a && B(n, {
				code: z.too_small,
				minimum: r.value,
				type: "string",
				inclusive: !0,
				exact: !0,
				message: r.message
			}), t.dirty());
		} else if (r.kind === "email") Od.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "email",
			code: z.invalid_string,
			message: r.message
		}), t.dirty());
		else if (r.kind === "emoji") Ad ||= new RegExp(kd, "u"), Ad.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "emoji",
			code: z.invalid_string,
			message: r.message
		}), t.dirty());
		else if (r.kind === "uuid") wd.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "uuid",
			code: z.invalid_string,
			message: r.message
		}), t.dirty());
		else if (r.kind === "nanoid") Td.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "nanoid",
			code: z.invalid_string,
			message: r.message
		}), t.dirty());
		else if (r.kind === "cuid") xd.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "cuid",
			code: z.invalid_string,
			message: r.message
		}), t.dirty());
		else if (r.kind === "cuid2") Sd.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "cuid2",
			code: z.invalid_string,
			message: r.message
		}), t.dirty());
		else if (r.kind === "ulid") Cd.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "ulid",
			code: z.invalid_string,
			message: r.message
		}), t.dirty());
		else if (r.kind === "url") try {
			new URL(e.data);
		} catch {
			n = this._getOrReturnCtx(e, n), B(n, {
				validation: "url",
				code: z.invalid_string,
				message: r.message
			}), t.dirty();
		}
		else r.kind === "regex" ? (r.regex.lastIndex = 0, r.regex.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "regex",
			code: z.invalid_string,
			message: r.message
		}), t.dirty())) : r.kind === "trim" ? e.data = e.data.trim() : r.kind === "includes" ? e.data.includes(r.value, r.position) || (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.invalid_string,
			validation: {
				includes: r.value,
				position: r.position
			},
			message: r.message
		}), t.dirty()) : r.kind === "toLowerCase" ? e.data = e.data.toLowerCase() : r.kind === "toUpperCase" ? e.data = e.data.toUpperCase() : r.kind === "startsWith" ? e.data.startsWith(r.value) || (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.invalid_string,
			validation: { startsWith: r.value },
			message: r.message
		}), t.dirty()) : r.kind === "endsWith" ? e.data.endsWith(r.value) || (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.invalid_string,
			validation: { endsWith: r.value },
			message: r.message
		}), t.dirty()) : r.kind === "datetime" ? Vd(r).test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.invalid_string,
			validation: "datetime",
			message: r.message
		}), t.dirty()) : r.kind === "date" ? Rd.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.invalid_string,
			validation: "date",
			message: r.message
		}), t.dirty()) : r.kind === "time" ? Bd(r).test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.invalid_string,
			validation: "time",
			message: r.message
		}), t.dirty()) : r.kind === "duration" ? Dd.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "duration",
			code: z.invalid_string,
			message: r.message
		}), t.dirty()) : r.kind === "ip" ? Hd(e.data, r.version) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "ip",
			code: z.invalid_string,
			message: r.message
		}), t.dirty()) : r.kind === "jwt" ? Ud(e.data, r.alg) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "jwt",
			code: z.invalid_string,
			message: r.message
		}), t.dirty()) : r.kind === "cidr" ? Wd(e.data, r.version) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "cidr",
			code: z.invalid_string,
			message: r.message
		}), t.dirty()) : r.kind === "base64" ? Fd.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "base64",
			code: z.invalid_string,
			message: r.message
		}), t.dirty()) : r.kind === "base64url" ? Id.test(e.data) || (n = this._getOrReturnCtx(e, n), B(n, {
			validation: "base64url",
			code: z.invalid_string,
			message: r.message
		}), t.dirty()) : L.assertNever(r);
		return {
			status: t.value,
			value: e.data
		};
	}
	_regex(e, t, n) {
		return this.refinement((t) => e.test(t), {
			validation: t,
			code: z.invalid_string,
			...U.errToObj(n)
		});
	}
	_addCheck(t) {
		return new e({
			...this._def,
			checks: [...this._def.checks, t]
		});
	}
	email(e) {
		return this._addCheck({
			kind: "email",
			...U.errToObj(e)
		});
	}
	url(e) {
		return this._addCheck({
			kind: "url",
			...U.errToObj(e)
		});
	}
	emoji(e) {
		return this._addCheck({
			kind: "emoji",
			...U.errToObj(e)
		});
	}
	uuid(e) {
		return this._addCheck({
			kind: "uuid",
			...U.errToObj(e)
		});
	}
	nanoid(e) {
		return this._addCheck({
			kind: "nanoid",
			...U.errToObj(e)
		});
	}
	cuid(e) {
		return this._addCheck({
			kind: "cuid",
			...U.errToObj(e)
		});
	}
	cuid2(e) {
		return this._addCheck({
			kind: "cuid2",
			...U.errToObj(e)
		});
	}
	ulid(e) {
		return this._addCheck({
			kind: "ulid",
			...U.errToObj(e)
		});
	}
	base64(e) {
		return this._addCheck({
			kind: "base64",
			...U.errToObj(e)
		});
	}
	base64url(e) {
		return this._addCheck({
			kind: "base64url",
			...U.errToObj(e)
		});
	}
	jwt(e) {
		return this._addCheck({
			kind: "jwt",
			...U.errToObj(e)
		});
	}
	ip(e) {
		return this._addCheck({
			kind: "ip",
			...U.errToObj(e)
		});
	}
	cidr(e) {
		return this._addCheck({
			kind: "cidr",
			...U.errToObj(e)
		});
	}
	datetime(e) {
		return typeof e == "string" ? this._addCheck({
			kind: "datetime",
			precision: null,
			offset: !1,
			local: !1,
			message: e
		}) : this._addCheck({
			kind: "datetime",
			precision: e?.precision === void 0 ? null : e?.precision,
			offset: e?.offset ?? !1,
			local: e?.local ?? !1,
			...U.errToObj(e?.message)
		});
	}
	date(e) {
		return this._addCheck({
			kind: "date",
			message: e
		});
	}
	time(e) {
		return typeof e == "string" ? this._addCheck({
			kind: "time",
			precision: null,
			message: e
		}) : this._addCheck({
			kind: "time",
			precision: e?.precision === void 0 ? null : e?.precision,
			...U.errToObj(e?.message)
		});
	}
	duration(e) {
		return this._addCheck({
			kind: "duration",
			...U.errToObj(e)
		});
	}
	regex(e, t) {
		return this._addCheck({
			kind: "regex",
			regex: e,
			...U.errToObj(t)
		});
	}
	includes(e, t) {
		return this._addCheck({
			kind: "includes",
			value: e,
			position: t?.position,
			...U.errToObj(t?.message)
		});
	}
	startsWith(e, t) {
		return this._addCheck({
			kind: "startsWith",
			value: e,
			...U.errToObj(t)
		});
	}
	endsWith(e, t) {
		return this._addCheck({
			kind: "endsWith",
			value: e,
			...U.errToObj(t)
		});
	}
	min(e, t) {
		return this._addCheck({
			kind: "min",
			value: e,
			...U.errToObj(t)
		});
	}
	max(e, t) {
		return this._addCheck({
			kind: "max",
			value: e,
			...U.errToObj(t)
		});
	}
	length(e, t) {
		return this._addCheck({
			kind: "length",
			value: e,
			...U.errToObj(t)
		});
	}
	nonempty(e) {
		return this.min(1, U.errToObj(e));
	}
	trim() {
		return new e({
			...this._def,
			checks: [...this._def.checks, { kind: "trim" }]
		});
	}
	toLowerCase() {
		return new e({
			...this._def,
			checks: [...this._def.checks, { kind: "toLowerCase" }]
		});
	}
	toUpperCase() {
		return new e({
			...this._def,
			checks: [...this._def.checks, { kind: "toUpperCase" }]
		});
	}
	get isDatetime() {
		return !!this._def.checks.find((e) => e.kind === "datetime");
	}
	get isDate() {
		return !!this._def.checks.find((e) => e.kind === "date");
	}
	get isTime() {
		return !!this._def.checks.find((e) => e.kind === "time");
	}
	get isDuration() {
		return !!this._def.checks.find((e) => e.kind === "duration");
	}
	get isEmail() {
		return !!this._def.checks.find((e) => e.kind === "email");
	}
	get isURL() {
		return !!this._def.checks.find((e) => e.kind === "url");
	}
	get isEmoji() {
		return !!this._def.checks.find((e) => e.kind === "emoji");
	}
	get isUUID() {
		return !!this._def.checks.find((e) => e.kind === "uuid");
	}
	get isNANOID() {
		return !!this._def.checks.find((e) => e.kind === "nanoid");
	}
	get isCUID() {
		return !!this._def.checks.find((e) => e.kind === "cuid");
	}
	get isCUID2() {
		return !!this._def.checks.find((e) => e.kind === "cuid2");
	}
	get isULID() {
		return !!this._def.checks.find((e) => e.kind === "ulid");
	}
	get isIP() {
		return !!this._def.checks.find((e) => e.kind === "ip");
	}
	get isCIDR() {
		return !!this._def.checks.find((e) => e.kind === "cidr");
	}
	get isBase64() {
		return !!this._def.checks.find((e) => e.kind === "base64");
	}
	get isBase64url() {
		return !!this._def.checks.find((e) => e.kind === "base64url");
	}
	get minLength() {
		let e = null;
		for (let t of this._def.checks) t.kind === "min" && (e === null || t.value > e) && (e = t.value);
		return e;
	}
	get maxLength() {
		let e = null;
		for (let t of this._def.checks) t.kind === "max" && (e === null || t.value < e) && (e = t.value);
		return e;
	}
};
Gd.create = (e) => new Gd({
	checks: [],
	typeName: K.ZodString,
	coerce: e?.coerce ?? !1,
	...W(e)
});
function Kd(e, t) {
	let n = (e.toString().split(".")[1] || "").length, r = (t.toString().split(".")[1] || "").length, i = n > r ? n : r;
	return Number.parseInt(e.toFixed(i).replace(".", "")) % Number.parseInt(t.toFixed(i).replace(".", "")) / 10 ** i;
}
var qd = class e extends G {
	constructor() {
		super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
	}
	_parse(e) {
		if (this._def.coerce && (e.data = Number(e.data)), this._getType(e) !== R.number) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.number,
				received: t.parsedType
			}), V;
		}
		let t, n = new pd();
		for (let r of this._def.checks) r.kind === "int" ? L.isInteger(e.data) || (t = this._getOrReturnCtx(e, t), B(t, {
			code: z.invalid_type,
			expected: "integer",
			received: "float",
			message: r.message
		}), n.dirty()) : r.kind === "min" ? (r.inclusive ? e.data < r.value : e.data <= r.value) && (t = this._getOrReturnCtx(e, t), B(t, {
			code: z.too_small,
			minimum: r.value,
			type: "number",
			inclusive: r.inclusive,
			exact: !1,
			message: r.message
		}), n.dirty()) : r.kind === "max" ? (r.inclusive ? e.data > r.value : e.data >= r.value) && (t = this._getOrReturnCtx(e, t), B(t, {
			code: z.too_big,
			maximum: r.value,
			type: "number",
			inclusive: r.inclusive,
			exact: !1,
			message: r.message
		}), n.dirty()) : r.kind === "multipleOf" ? Kd(e.data, r.value) !== 0 && (t = this._getOrReturnCtx(e, t), B(t, {
			code: z.not_multiple_of,
			multipleOf: r.value,
			message: r.message
		}), n.dirty()) : r.kind === "finite" ? Number.isFinite(e.data) || (t = this._getOrReturnCtx(e, t), B(t, {
			code: z.not_finite,
			message: r.message
		}), n.dirty()) : L.assertNever(r);
		return {
			status: n.value,
			value: e.data
		};
	}
	gte(e, t) {
		return this.setLimit("min", e, !0, U.toString(t));
	}
	gt(e, t) {
		return this.setLimit("min", e, !1, U.toString(t));
	}
	lte(e, t) {
		return this.setLimit("max", e, !0, U.toString(t));
	}
	lt(e, t) {
		return this.setLimit("max", e, !1, U.toString(t));
	}
	setLimit(t, n, r, i) {
		return new e({
			...this._def,
			checks: [...this._def.checks, {
				kind: t,
				value: n,
				inclusive: r,
				message: U.toString(i)
			}]
		});
	}
	_addCheck(t) {
		return new e({
			...this._def,
			checks: [...this._def.checks, t]
		});
	}
	int(e) {
		return this._addCheck({
			kind: "int",
			message: U.toString(e)
		});
	}
	positive(e) {
		return this._addCheck({
			kind: "min",
			value: 0,
			inclusive: !1,
			message: U.toString(e)
		});
	}
	negative(e) {
		return this._addCheck({
			kind: "max",
			value: 0,
			inclusive: !1,
			message: U.toString(e)
		});
	}
	nonpositive(e) {
		return this._addCheck({
			kind: "max",
			value: 0,
			inclusive: !0,
			message: U.toString(e)
		});
	}
	nonnegative(e) {
		return this._addCheck({
			kind: "min",
			value: 0,
			inclusive: !0,
			message: U.toString(e)
		});
	}
	multipleOf(e, t) {
		return this._addCheck({
			kind: "multipleOf",
			value: e,
			message: U.toString(t)
		});
	}
	finite(e) {
		return this._addCheck({
			kind: "finite",
			message: U.toString(e)
		});
	}
	safe(e) {
		return this._addCheck({
			kind: "min",
			inclusive: !0,
			value: -(2 ** 53 - 1),
			message: U.toString(e)
		})._addCheck({
			kind: "max",
			inclusive: !0,
			value: 2 ** 53 - 1,
			message: U.toString(e)
		});
	}
	get minValue() {
		let e = null;
		for (let t of this._def.checks) t.kind === "min" && (e === null || t.value > e) && (e = t.value);
		return e;
	}
	get maxValue() {
		let e = null;
		for (let t of this._def.checks) t.kind === "max" && (e === null || t.value < e) && (e = t.value);
		return e;
	}
	get isInt() {
		return !!this._def.checks.find((e) => e.kind === "int" || e.kind === "multipleOf" && L.isInteger(e.value));
	}
	get isFinite() {
		let e = null, t = null;
		for (let n of this._def.checks) if (n.kind === "finite" || n.kind === "int" || n.kind === "multipleOf") return !0;
		else n.kind === "min" ? (t === null || n.value > t) && (t = n.value) : n.kind === "max" && (e === null || n.value < e) && (e = n.value);
		return Number.isFinite(t) && Number.isFinite(e);
	}
};
qd.create = (e) => new qd({
	checks: [],
	typeName: K.ZodNumber,
	coerce: e?.coerce || !1,
	...W(e)
});
var Jd = class e extends G {
	constructor() {
		super(...arguments), this.min = this.gte, this.max = this.lte;
	}
	_parse(e) {
		if (this._def.coerce) try {
			e.data = BigInt(e.data);
		} catch {
			return this._getInvalidInput(e);
		}
		if (this._getType(e) !== R.bigint) return this._getInvalidInput(e);
		let t, n = new pd();
		for (let r of this._def.checks) r.kind === "min" ? (r.inclusive ? e.data < r.value : e.data <= r.value) && (t = this._getOrReturnCtx(e, t), B(t, {
			code: z.too_small,
			type: "bigint",
			minimum: r.value,
			inclusive: r.inclusive,
			message: r.message
		}), n.dirty()) : r.kind === "max" ? (r.inclusive ? e.data > r.value : e.data >= r.value) && (t = this._getOrReturnCtx(e, t), B(t, {
			code: z.too_big,
			type: "bigint",
			maximum: r.value,
			inclusive: r.inclusive,
			message: r.message
		}), n.dirty()) : r.kind === "multipleOf" ? e.data % r.value !== BigInt(0) && (t = this._getOrReturnCtx(e, t), B(t, {
			code: z.not_multiple_of,
			multipleOf: r.value,
			message: r.message
		}), n.dirty()) : L.assertNever(r);
		return {
			status: n.value,
			value: e.data
		};
	}
	_getInvalidInput(e) {
		let t = this._getOrReturnCtx(e);
		return B(t, {
			code: z.invalid_type,
			expected: R.bigint,
			received: t.parsedType
		}), V;
	}
	gte(e, t) {
		return this.setLimit("min", e, !0, U.toString(t));
	}
	gt(e, t) {
		return this.setLimit("min", e, !1, U.toString(t));
	}
	lte(e, t) {
		return this.setLimit("max", e, !0, U.toString(t));
	}
	lt(e, t) {
		return this.setLimit("max", e, !1, U.toString(t));
	}
	setLimit(t, n, r, i) {
		return new e({
			...this._def,
			checks: [...this._def.checks, {
				kind: t,
				value: n,
				inclusive: r,
				message: U.toString(i)
			}]
		});
	}
	_addCheck(t) {
		return new e({
			...this._def,
			checks: [...this._def.checks, t]
		});
	}
	positive(e) {
		return this._addCheck({
			kind: "min",
			value: BigInt(0),
			inclusive: !1,
			message: U.toString(e)
		});
	}
	negative(e) {
		return this._addCheck({
			kind: "max",
			value: BigInt(0),
			inclusive: !1,
			message: U.toString(e)
		});
	}
	nonpositive(e) {
		return this._addCheck({
			kind: "max",
			value: BigInt(0),
			inclusive: !0,
			message: U.toString(e)
		});
	}
	nonnegative(e) {
		return this._addCheck({
			kind: "min",
			value: BigInt(0),
			inclusive: !0,
			message: U.toString(e)
		});
	}
	multipleOf(e, t) {
		return this._addCheck({
			kind: "multipleOf",
			value: e,
			message: U.toString(t)
		});
	}
	get minValue() {
		let e = null;
		for (let t of this._def.checks) t.kind === "min" && (e === null || t.value > e) && (e = t.value);
		return e;
	}
	get maxValue() {
		let e = null;
		for (let t of this._def.checks) t.kind === "max" && (e === null || t.value < e) && (e = t.value);
		return e;
	}
};
Jd.create = (e) => new Jd({
	checks: [],
	typeName: K.ZodBigInt,
	coerce: e?.coerce ?? !1,
	...W(e)
});
var Yd = class extends G {
	_parse(e) {
		if (this._def.coerce && (e.data = !!e.data), this._getType(e) !== R.boolean) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.boolean,
				received: t.parsedType
			}), V;
		}
		return H(e.data);
	}
};
Yd.create = (e) => new Yd({
	typeName: K.ZodBoolean,
	coerce: e?.coerce || !1,
	...W(e)
});
var Xd = class e extends G {
	_parse(e) {
		if (this._def.coerce && (e.data = new Date(e.data)), this._getType(e) !== R.date) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.date,
				received: t.parsedType
			}), V;
		}
		if (Number.isNaN(e.data.getTime())) return B(this._getOrReturnCtx(e), { code: z.invalid_date }), V;
		let t = new pd(), n;
		for (let r of this._def.checks) r.kind === "min" ? e.data.getTime() < r.value && (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.too_small,
			message: r.message,
			inclusive: !0,
			exact: !1,
			minimum: r.value,
			type: "date"
		}), t.dirty()) : r.kind === "max" ? e.data.getTime() > r.value && (n = this._getOrReturnCtx(e, n), B(n, {
			code: z.too_big,
			message: r.message,
			inclusive: !0,
			exact: !1,
			maximum: r.value,
			type: "date"
		}), t.dirty()) : L.assertNever(r);
		return {
			status: t.value,
			value: new Date(e.data.getTime())
		};
	}
	_addCheck(t) {
		return new e({
			...this._def,
			checks: [...this._def.checks, t]
		});
	}
	min(e, t) {
		return this._addCheck({
			kind: "min",
			value: e.getTime(),
			message: U.toString(t)
		});
	}
	max(e, t) {
		return this._addCheck({
			kind: "max",
			value: e.getTime(),
			message: U.toString(t)
		});
	}
	get minDate() {
		let e = null;
		for (let t of this._def.checks) t.kind === "min" && (e === null || t.value > e) && (e = t.value);
		return e == null ? null : new Date(e);
	}
	get maxDate() {
		let e = null;
		for (let t of this._def.checks) t.kind === "max" && (e === null || t.value < e) && (e = t.value);
		return e == null ? null : new Date(e);
	}
};
Xd.create = (e) => new Xd({
	checks: [],
	coerce: e?.coerce || !1,
	typeName: K.ZodDate,
	...W(e)
});
var Zd = class extends G {
	_parse(e) {
		if (this._getType(e) !== R.symbol) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.symbol,
				received: t.parsedType
			}), V;
		}
		return H(e.data);
	}
};
Zd.create = (e) => new Zd({
	typeName: K.ZodSymbol,
	...W(e)
});
var Qd = class extends G {
	_parse(e) {
		if (this._getType(e) !== R.undefined) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.undefined,
				received: t.parsedType
			}), V;
		}
		return H(e.data);
	}
};
Qd.create = (e) => new Qd({
	typeName: K.ZodUndefined,
	...W(e)
});
var $d = class extends G {
	_parse(e) {
		if (this._getType(e) !== R.null) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.null,
				received: t.parsedType
			}), V;
		}
		return H(e.data);
	}
};
$d.create = (e) => new $d({
	typeName: K.ZodNull,
	...W(e)
});
var ef = class extends G {
	constructor() {
		super(...arguments), this._any = !0;
	}
	_parse(e) {
		return H(e.data);
	}
};
ef.create = (e) => new ef({
	typeName: K.ZodAny,
	...W(e)
});
var tf = class extends G {
	constructor() {
		super(...arguments), this._unknown = !0;
	}
	_parse(e) {
		return H(e.data);
	}
};
tf.create = (e) => new tf({
	typeName: K.ZodUnknown,
	...W(e)
});
var nf = class extends G {
	_parse(e) {
		let t = this._getOrReturnCtx(e);
		return B(t, {
			code: z.invalid_type,
			expected: R.never,
			received: t.parsedType
		}), V;
	}
};
nf.create = (e) => new nf({
	typeName: K.ZodNever,
	...W(e)
});
var rf = class extends G {
	_parse(e) {
		if (this._getType(e) !== R.undefined) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.void,
				received: t.parsedType
			}), V;
		}
		return H(e.data);
	}
};
rf.create = (e) => new rf({
	typeName: K.ZodVoid,
	...W(e)
});
var af = class e extends G {
	_parse(e) {
		let { ctx: t, status: n } = this._processInputParams(e), r = this._def;
		if (t.parsedType !== R.array) return B(t, {
			code: z.invalid_type,
			expected: R.array,
			received: t.parsedType
		}), V;
		if (r.exactLength !== null) {
			let e = t.data.length > r.exactLength.value, i = t.data.length < r.exactLength.value;
			(e || i) && (B(t, {
				code: e ? z.too_big : z.too_small,
				minimum: i ? r.exactLength.value : void 0,
				maximum: e ? r.exactLength.value : void 0,
				type: "array",
				inclusive: !0,
				exact: !0,
				message: r.exactLength.message
			}), n.dirty());
		}
		if (r.minLength !== null && t.data.length < r.minLength.value && (B(t, {
			code: z.too_small,
			minimum: r.minLength.value,
			type: "array",
			inclusive: !0,
			exact: !1,
			message: r.minLength.message
		}), n.dirty()), r.maxLength !== null && t.data.length > r.maxLength.value && (B(t, {
			code: z.too_big,
			maximum: r.maxLength.value,
			type: "array",
			inclusive: !0,
			exact: !1,
			message: r.maxLength.message
		}), n.dirty()), t.common.async) return Promise.all([...t.data].map((e, n) => r.type._parseAsync(new yd(t, e, t.path, n)))).then((e) => pd.mergeArray(n, e));
		let i = [...t.data].map((e, n) => r.type._parseSync(new yd(t, e, t.path, n)));
		return pd.mergeArray(n, i);
	}
	get element() {
		return this._def.type;
	}
	min(t, n) {
		return new e({
			...this._def,
			minLength: {
				value: t,
				message: U.toString(n)
			}
		});
	}
	max(t, n) {
		return new e({
			...this._def,
			maxLength: {
				value: t,
				message: U.toString(n)
			}
		});
	}
	length(t, n) {
		return new e({
			...this._def,
			exactLength: {
				value: t,
				message: U.toString(n)
			}
		});
	}
	nonempty(e) {
		return this.min(1, e);
	}
};
af.create = (e, t) => new af({
	type: e,
	minLength: null,
	maxLength: null,
	exactLength: null,
	typeName: K.ZodArray,
	...W(t)
});
function of(e) {
	if (e instanceof sf) {
		let t = {};
		for (let n in e.shape) {
			let r = e.shape[n];
			t[n] = Tf.create(of(r));
		}
		return new sf({
			...e._def,
			shape: () => t
		});
	} else if (e instanceof af) return new af({
		...e._def,
		type: of(e.element)
	});
	else if (e instanceof Tf) return Tf.create(of(e.unwrap()));
	else if (e instanceof Ef) return Ef.create(of(e.unwrap()));
	else if (e instanceof pf) return pf.create(e.items.map((e) => of(e)));
	else return e;
}
var sf = class e extends G {
	constructor() {
		super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = this.extend;
	}
	_getCached() {
		if (this._cached !== null) return this._cached;
		let e = this._def.shape(), t = L.objectKeys(e);
		return this._cached = {
			shape: e,
			keys: t
		}, this._cached;
	}
	_parse(e) {
		if (this._getType(e) !== R.object) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.object,
				received: t.parsedType
			}), V;
		}
		let { status: t, ctx: n } = this._processInputParams(e), { shape: r, keys: i } = this._getCached(), a = [];
		if (!(this._def.catchall instanceof nf && this._def.unknownKeys === "strip")) for (let e in n.data) i.includes(e) || a.push(e);
		let o = [];
		for (let e of i) {
			let t = r[e], i = n.data[e];
			o.push({
				key: {
					status: "valid",
					value: e
				},
				value: t._parse(new yd(n, i, n.path, e)),
				alwaysSet: e in n.data
			});
		}
		if (this._def.catchall instanceof nf) {
			let e = this._def.unknownKeys;
			if (e === "passthrough") for (let e of a) o.push({
				key: {
					status: "valid",
					value: e
				},
				value: {
					status: "valid",
					value: n.data[e]
				}
			});
			else if (e === "strict") a.length > 0 && (B(n, {
				code: z.unrecognized_keys,
				keys: a
			}), t.dirty());
			else if (e !== "strip") throw Error("Internal ZodObject error: invalid unknownKeys value.");
		} else {
			let e = this._def.catchall;
			for (let t of a) {
				let r = n.data[t];
				o.push({
					key: {
						status: "valid",
						value: t
					},
					value: e._parse(new yd(n, r, n.path, t)),
					alwaysSet: t in n.data
				});
			}
		}
		return n.common.async ? Promise.resolve().then(async () => {
			let e = [];
			for (let t of o) {
				let n = await t.key, r = await t.value;
				e.push({
					key: n,
					value: r,
					alwaysSet: t.alwaysSet
				});
			}
			return e;
		}).then((e) => pd.mergeObjectSync(t, e)) : pd.mergeObjectSync(t, o);
	}
	get shape() {
		return this._def.shape();
	}
	strict(t) {
		return U.errToObj, new e({
			...this._def,
			unknownKeys: "strict",
			...t === void 0 ? {} : { errorMap: (e, n) => {
				let r = this._def.errorMap?.(e, n).message ?? n.defaultError;
				return e.code === "unrecognized_keys" ? { message: U.errToObj(t).message ?? r } : { message: r };
			} }
		});
	}
	strip() {
		return new e({
			...this._def,
			unknownKeys: "strip"
		});
	}
	passthrough() {
		return new e({
			...this._def,
			unknownKeys: "passthrough"
		});
	}
	extend(t) {
		return new e({
			...this._def,
			shape: () => ({
				...this._def.shape(),
				...t
			})
		});
	}
	merge(t) {
		return new e({
			unknownKeys: t._def.unknownKeys,
			catchall: t._def.catchall,
			shape: () => ({
				...this._def.shape(),
				...t._def.shape()
			}),
			typeName: K.ZodObject
		});
	}
	setKey(e, t) {
		return this.augment({ [e]: t });
	}
	catchall(t) {
		return new e({
			...this._def,
			catchall: t
		});
	}
	pick(t) {
		let n = {};
		for (let e of L.objectKeys(t)) t[e] && this.shape[e] && (n[e] = this.shape[e]);
		return new e({
			...this._def,
			shape: () => n
		});
	}
	omit(t) {
		let n = {};
		for (let e of L.objectKeys(this.shape)) t[e] || (n[e] = this.shape[e]);
		return new e({
			...this._def,
			shape: () => n
		});
	}
	deepPartial() {
		return of(this);
	}
	partial(t) {
		let n = {};
		for (let e of L.objectKeys(this.shape)) {
			let r = this.shape[e];
			t && !t[e] ? n[e] = r : n[e] = r.optional();
		}
		return new e({
			...this._def,
			shape: () => n
		});
	}
	required(t) {
		let n = {};
		for (let e of L.objectKeys(this.shape)) if (t && !t[e]) n[e] = this.shape[e];
		else {
			let t = this.shape[e];
			for (; t instanceof Tf;) t = t._def.innerType;
			n[e] = t;
		}
		return new e({
			...this._def,
			shape: () => n
		});
	}
	keyof() {
		return bf(L.objectKeys(this.shape));
	}
};
sf.create = (e, t) => new sf({
	shape: () => e,
	unknownKeys: "strip",
	catchall: nf.create(),
	typeName: K.ZodObject,
	...W(t)
}), sf.strictCreate = (e, t) => new sf({
	shape: () => e,
	unknownKeys: "strict",
	catchall: nf.create(),
	typeName: K.ZodObject,
	...W(t)
}), sf.lazycreate = (e, t) => new sf({
	shape: e,
	unknownKeys: "strip",
	catchall: nf.create(),
	typeName: K.ZodObject,
	...W(t)
});
var cf = class extends G {
	_parse(e) {
		let { ctx: t } = this._processInputParams(e), n = this._def.options;
		function r(e) {
			for (let t of e) if (t.result.status === "valid") return t.result;
			for (let n of e) if (n.result.status === "dirty") return t.common.issues.push(...n.ctx.common.issues), n.result;
			let n = e.map((e) => new cd(e.ctx.common.issues));
			return B(t, {
				code: z.invalid_union,
				unionErrors: n
			}), V;
		}
		if (t.common.async) return Promise.all(n.map(async (e) => {
			let n = {
				...t,
				common: {
					...t.common,
					issues: []
				},
				parent: null
			};
			return {
				result: await e._parseAsync({
					data: t.data,
					path: t.path,
					parent: n
				}),
				ctx: n
			};
		})).then(r);
		{
			let e, r = [];
			for (let i of n) {
				let n = {
					...t,
					common: {
						...t.common,
						issues: []
					},
					parent: null
				}, a = i._parseSync({
					data: t.data,
					path: t.path,
					parent: n
				});
				if (a.status === "valid") return a;
				a.status === "dirty" && !e && (e = {
					result: a,
					ctx: n
				}), n.common.issues.length && r.push(n.common.issues);
			}
			if (e) return t.common.issues.push(...e.ctx.common.issues), e.result;
			let i = r.map((e) => new cd(e));
			return B(t, {
				code: z.invalid_union,
				unionErrors: i
			}), V;
		}
	}
	get options() {
		return this._def.options;
	}
};
cf.create = (e, t) => new cf({
	options: e,
	typeName: K.ZodUnion,
	...W(t)
});
var lf = (e) => e instanceof vf ? lf(e.schema) : e instanceof wf ? lf(e.innerType()) : e instanceof yf ? [e.value] : e instanceof xf ? e.options : e instanceof Sf ? L.objectValues(e.enum) : e instanceof Df ? lf(e._def.innerType) : e instanceof Qd ? [void 0] : e instanceof $d ? [null] : e instanceof Tf ? [void 0, ...lf(e.unwrap())] : e instanceof Ef ? [null, ...lf(e.unwrap())] : e instanceof Af || e instanceof Mf ? lf(e.unwrap()) : e instanceof Of ? lf(e._def.innerType) : [], uf = class e extends G {
	_parse(e) {
		let { ctx: t } = this._processInputParams(e);
		if (t.parsedType !== R.object) return B(t, {
			code: z.invalid_type,
			expected: R.object,
			received: t.parsedType
		}), V;
		let n = this.discriminator, r = t.data[n], i = this.optionsMap.get(r);
		return i ? t.common.async ? i._parseAsync({
			data: t.data,
			path: t.path,
			parent: t
		}) : i._parseSync({
			data: t.data,
			path: t.path,
			parent: t
		}) : (B(t, {
			code: z.invalid_union_discriminator,
			options: Array.from(this.optionsMap.keys()),
			path: [n]
		}), V);
	}
	get discriminator() {
		return this._def.discriminator;
	}
	get options() {
		return this._def.options;
	}
	get optionsMap() {
		return this._def.optionsMap;
	}
	static create(t, n, r) {
		let i = /* @__PURE__ */ new Map();
		for (let e of n) {
			let n = lf(e.shape[t]);
			if (!n.length) throw Error(`A discriminator value for key \`${t}\` could not be extracted from all schema options`);
			for (let r of n) {
				if (i.has(r)) throw Error(`Discriminator property ${String(t)} has duplicate value ${String(r)}`);
				i.set(r, e);
			}
		}
		return new e({
			typeName: K.ZodDiscriminatedUnion,
			discriminator: t,
			options: n,
			optionsMap: i,
			...W(r)
		});
	}
};
function df(e, t) {
	let n = sd(e), r = sd(t);
	if (e === t) return {
		valid: !0,
		data: e
	};
	if (n === R.object && r === R.object) {
		let n = L.objectKeys(t), r = L.objectKeys(e).filter((e) => n.indexOf(e) !== -1), i = {
			...e,
			...t
		};
		for (let n of r) {
			let r = df(e[n], t[n]);
			if (!r.valid) return { valid: !1 };
			i[n] = r.data;
		}
		return {
			valid: !0,
			data: i
		};
	} else if (n === R.array && r === R.array) {
		if (e.length !== t.length) return { valid: !1 };
		let n = [];
		for (let r = 0; r < e.length; r++) {
			let i = e[r], a = t[r], o = df(i, a);
			if (!o.valid) return { valid: !1 };
			n.push(o.data);
		}
		return {
			valid: !0,
			data: n
		};
	} else if (n === R.date && r === R.date && +e == +t) return {
		valid: !0,
		data: e
	};
	else return { valid: !1 };
}
var ff = class extends G {
	_parse(e) {
		let { status: t, ctx: n } = this._processInputParams(e), r = (e, r) => {
			if (hd(e) || hd(r)) return V;
			let i = df(e.value, r.value);
			return i.valid ? ((gd(e) || gd(r)) && t.dirty(), {
				status: t.value,
				value: i.data
			}) : (B(n, { code: z.invalid_intersection_types }), V);
		};
		return n.common.async ? Promise.all([this._def.left._parseAsync({
			data: n.data,
			path: n.path,
			parent: n
		}), this._def.right._parseAsync({
			data: n.data,
			path: n.path,
			parent: n
		})]).then(([e, t]) => r(e, t)) : r(this._def.left._parseSync({
			data: n.data,
			path: n.path,
			parent: n
		}), this._def.right._parseSync({
			data: n.data,
			path: n.path,
			parent: n
		}));
	}
};
ff.create = (e, t, n) => new ff({
	left: e,
	right: t,
	typeName: K.ZodIntersection,
	...W(n)
});
var pf = class e extends G {
	_parse(e) {
		let { status: t, ctx: n } = this._processInputParams(e);
		if (n.parsedType !== R.array) return B(n, {
			code: z.invalid_type,
			expected: R.array,
			received: n.parsedType
		}), V;
		if (n.data.length < this._def.items.length) return B(n, {
			code: z.too_small,
			minimum: this._def.items.length,
			inclusive: !0,
			exact: !1,
			type: "array"
		}), V;
		!this._def.rest && n.data.length > this._def.items.length && (B(n, {
			code: z.too_big,
			maximum: this._def.items.length,
			inclusive: !0,
			exact: !1,
			type: "array"
		}), t.dirty());
		let r = [...n.data].map((e, t) => {
			let r = this._def.items[t] || this._def.rest;
			return r ? r._parse(new yd(n, e, n.path, t)) : null;
		}).filter((e) => !!e);
		return n.common.async ? Promise.all(r).then((e) => pd.mergeArray(t, e)) : pd.mergeArray(t, r);
	}
	get items() {
		return this._def.items;
	}
	rest(t) {
		return new e({
			...this._def,
			rest: t
		});
	}
};
pf.create = (e, t) => {
	if (!Array.isArray(e)) throw Error("You must pass an array of schemas to z.tuple([ ... ])");
	return new pf({
		items: e,
		typeName: K.ZodTuple,
		rest: null,
		...W(t)
	});
};
var mf = class e extends G {
	get keySchema() {
		return this._def.keyType;
	}
	get valueSchema() {
		return this._def.valueType;
	}
	_parse(e) {
		let { status: t, ctx: n } = this._processInputParams(e);
		if (n.parsedType !== R.object) return B(n, {
			code: z.invalid_type,
			expected: R.object,
			received: n.parsedType
		}), V;
		let r = [], i = this._def.keyType, a = this._def.valueType;
		for (let e in n.data) r.push({
			key: i._parse(new yd(n, e, n.path, e)),
			value: a._parse(new yd(n, n.data[e], n.path, e)),
			alwaysSet: e in n.data
		});
		return n.common.async ? pd.mergeObjectAsync(t, r) : pd.mergeObjectSync(t, r);
	}
	get element() {
		return this._def.valueType;
	}
	static create(t, n, r) {
		return n instanceof G ? new e({
			keyType: t,
			valueType: n,
			typeName: K.ZodRecord,
			...W(r)
		}) : new e({
			keyType: Gd.create(),
			valueType: t,
			typeName: K.ZodRecord,
			...W(n)
		});
	}
}, hf = class extends G {
	get keySchema() {
		return this._def.keyType;
	}
	get valueSchema() {
		return this._def.valueType;
	}
	_parse(e) {
		let { status: t, ctx: n } = this._processInputParams(e);
		if (n.parsedType !== R.map) return B(n, {
			code: z.invalid_type,
			expected: R.map,
			received: n.parsedType
		}), V;
		let r = this._def.keyType, i = this._def.valueType, a = [...n.data.entries()].map(([e, t], a) => ({
			key: r._parse(new yd(n, e, n.path, [a, "key"])),
			value: i._parse(new yd(n, t, n.path, [a, "value"]))
		}));
		if (n.common.async) {
			let e = /* @__PURE__ */ new Map();
			return Promise.resolve().then(async () => {
				for (let n of a) {
					let r = await n.key, i = await n.value;
					if (r.status === "aborted" || i.status === "aborted") return V;
					(r.status === "dirty" || i.status === "dirty") && t.dirty(), e.set(r.value, i.value);
				}
				return {
					status: t.value,
					value: e
				};
			});
		} else {
			let e = /* @__PURE__ */ new Map();
			for (let n of a) {
				let r = n.key, i = n.value;
				if (r.status === "aborted" || i.status === "aborted") return V;
				(r.status === "dirty" || i.status === "dirty") && t.dirty(), e.set(r.value, i.value);
			}
			return {
				status: t.value,
				value: e
			};
		}
	}
};
hf.create = (e, t, n) => new hf({
	valueType: t,
	keyType: e,
	typeName: K.ZodMap,
	...W(n)
});
var gf = class e extends G {
	_parse(e) {
		let { status: t, ctx: n } = this._processInputParams(e);
		if (n.parsedType !== R.set) return B(n, {
			code: z.invalid_type,
			expected: R.set,
			received: n.parsedType
		}), V;
		let r = this._def;
		r.minSize !== null && n.data.size < r.minSize.value && (B(n, {
			code: z.too_small,
			minimum: r.minSize.value,
			type: "set",
			inclusive: !0,
			exact: !1,
			message: r.minSize.message
		}), t.dirty()), r.maxSize !== null && n.data.size > r.maxSize.value && (B(n, {
			code: z.too_big,
			maximum: r.maxSize.value,
			type: "set",
			inclusive: !0,
			exact: !1,
			message: r.maxSize.message
		}), t.dirty());
		let i = this._def.valueType;
		function a(e) {
			let n = /* @__PURE__ */ new Set();
			for (let r of e) {
				if (r.status === "aborted") return V;
				r.status === "dirty" && t.dirty(), n.add(r.value);
			}
			return {
				status: t.value,
				value: n
			};
		}
		let o = [...n.data.values()].map((e, t) => i._parse(new yd(n, e, n.path, t)));
		return n.common.async ? Promise.all(o).then((e) => a(e)) : a(o);
	}
	min(t, n) {
		return new e({
			...this._def,
			minSize: {
				value: t,
				message: U.toString(n)
			}
		});
	}
	max(t, n) {
		return new e({
			...this._def,
			maxSize: {
				value: t,
				message: U.toString(n)
			}
		});
	}
	size(e, t) {
		return this.min(e, t).max(e, t);
	}
	nonempty(e) {
		return this.min(1, e);
	}
};
gf.create = (e, t) => new gf({
	valueType: e,
	minSize: null,
	maxSize: null,
	typeName: K.ZodSet,
	...W(t)
});
var _f = class e extends G {
	constructor() {
		super(...arguments), this.validate = this.implement;
	}
	_parse(e) {
		let { ctx: t } = this._processInputParams(e);
		if (t.parsedType !== R.function) return B(t, {
			code: z.invalid_type,
			expected: R.function,
			received: t.parsedType
		}), V;
		function n(e, n) {
			return fd({
				data: e,
				path: t.path,
				errorMaps: [
					t.common.contextualErrorMap,
					t.schemaErrorMap,
					dd(),
					ld
				].filter((e) => !!e),
				issueData: {
					code: z.invalid_arguments,
					argumentsError: n
				}
			});
		}
		function r(e, n) {
			return fd({
				data: e,
				path: t.path,
				errorMaps: [
					t.common.contextualErrorMap,
					t.schemaErrorMap,
					dd(),
					ld
				].filter((e) => !!e),
				issueData: {
					code: z.invalid_return_type,
					returnTypeError: n
				}
			});
		}
		let i = { errorMap: t.common.contextualErrorMap }, a = t.data;
		if (this._def.returns instanceof Cf) {
			let e = this;
			return H(async function(...t) {
				let o = new cd([]), s = await e._def.args.parseAsync(t, i).catch((e) => {
					throw o.addIssue(n(t, e)), o;
				}), c = await Reflect.apply(a, this, s);
				return await e._def.returns._def.type.parseAsync(c, i).catch((e) => {
					throw o.addIssue(r(c, e)), o;
				});
			});
		} else {
			let e = this;
			return H(function(...t) {
				let o = e._def.args.safeParse(t, i);
				if (!o.success) throw new cd([n(t, o.error)]);
				let s = Reflect.apply(a, this, o.data), c = e._def.returns.safeParse(s, i);
				if (!c.success) throw new cd([r(s, c.error)]);
				return c.data;
			});
		}
	}
	parameters() {
		return this._def.args;
	}
	returnType() {
		return this._def.returns;
	}
	args(...t) {
		return new e({
			...this._def,
			args: pf.create(t).rest(tf.create())
		});
	}
	returns(t) {
		return new e({
			...this._def,
			returns: t
		});
	}
	implement(e) {
		return this.parse(e);
	}
	strictImplement(e) {
		return this.parse(e);
	}
	static create(t, n, r) {
		return new e({
			args: t || pf.create([]).rest(tf.create()),
			returns: n || tf.create(),
			typeName: K.ZodFunction,
			...W(r)
		});
	}
}, vf = class extends G {
	get schema() {
		return this._def.getter();
	}
	_parse(e) {
		let { ctx: t } = this._processInputParams(e);
		return this._def.getter()._parse({
			data: t.data,
			path: t.path,
			parent: t
		});
	}
};
vf.create = (e, t) => new vf({
	getter: e,
	typeName: K.ZodLazy,
	...W(t)
});
var yf = class extends G {
	_parse(e) {
		if (e.data !== this._def.value) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				received: t.data,
				code: z.invalid_literal,
				expected: this._def.value
			}), V;
		}
		return {
			status: "valid",
			value: e.data
		};
	}
	get value() {
		return this._def.value;
	}
};
yf.create = (e, t) => new yf({
	value: e,
	typeName: K.ZodLiteral,
	...W(t)
});
function bf(e, t) {
	return new xf({
		values: e,
		typeName: K.ZodEnum,
		...W(t)
	});
}
var xf = class e extends G {
	_parse(e) {
		if (typeof e.data != "string") {
			let t = this._getOrReturnCtx(e), n = this._def.values;
			return B(t, {
				expected: L.joinValues(n),
				received: t.parsedType,
				code: z.invalid_type
			}), V;
		}
		if (this._cache ||= new Set(this._def.values), !this._cache.has(e.data)) {
			let t = this._getOrReturnCtx(e), n = this._def.values;
			return B(t, {
				received: t.data,
				code: z.invalid_enum_value,
				options: n
			}), V;
		}
		return H(e.data);
	}
	get options() {
		return this._def.values;
	}
	get enum() {
		let e = {};
		for (let t of this._def.values) e[t] = t;
		return e;
	}
	get Values() {
		let e = {};
		for (let t of this._def.values) e[t] = t;
		return e;
	}
	get Enum() {
		let e = {};
		for (let t of this._def.values) e[t] = t;
		return e;
	}
	extract(t, n = this._def) {
		return e.create(t, {
			...this._def,
			...n
		});
	}
	exclude(t, n = this._def) {
		return e.create(this.options.filter((e) => !t.includes(e)), {
			...this._def,
			...n
		});
	}
};
xf.create = bf;
var Sf = class extends G {
	_parse(e) {
		let t = L.getValidEnumValues(this._def.values), n = this._getOrReturnCtx(e);
		if (n.parsedType !== R.string && n.parsedType !== R.number) {
			let e = L.objectValues(t);
			return B(n, {
				expected: L.joinValues(e),
				received: n.parsedType,
				code: z.invalid_type
			}), V;
		}
		if (this._cache ||= new Set(L.getValidEnumValues(this._def.values)), !this._cache.has(e.data)) {
			let e = L.objectValues(t);
			return B(n, {
				received: n.data,
				code: z.invalid_enum_value,
				options: e
			}), V;
		}
		return H(e.data);
	}
	get enum() {
		return this._def.values;
	}
};
Sf.create = (e, t) => new Sf({
	values: e,
	typeName: K.ZodNativeEnum,
	...W(t)
});
var Cf = class extends G {
	unwrap() {
		return this._def.type;
	}
	_parse(e) {
		let { ctx: t } = this._processInputParams(e);
		return t.parsedType !== R.promise && t.common.async === !1 ? (B(t, {
			code: z.invalid_type,
			expected: R.promise,
			received: t.parsedType
		}), V) : H((t.parsedType === R.promise ? t.data : Promise.resolve(t.data)).then((e) => this._def.type.parseAsync(e, {
			path: t.path,
			errorMap: t.common.contextualErrorMap
		})));
	}
};
Cf.create = (e, t) => new Cf({
	type: e,
	typeName: K.ZodPromise,
	...W(t)
});
var wf = class extends G {
	innerType() {
		return this._def.schema;
	}
	sourceType() {
		return this._def.schema._def.typeName === K.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
	}
	_parse(e) {
		let { status: t, ctx: n } = this._processInputParams(e), r = this._def.effect || null, i = {
			addIssue: (e) => {
				B(n, e), e.fatal ? t.abort() : t.dirty();
			},
			get path() {
				return n.path;
			}
		};
		if (i.addIssue = i.addIssue.bind(i), r.type === "preprocess") {
			let e = r.transform(n.data, i);
			if (n.common.async) return Promise.resolve(e).then(async (e) => {
				if (t.value === "aborted") return V;
				let r = await this._def.schema._parseAsync({
					data: e,
					path: n.path,
					parent: n
				});
				return r.status === "aborted" ? V : r.status === "dirty" || t.value === "dirty" ? md(r.value) : r;
			});
			{
				if (t.value === "aborted") return V;
				let r = this._def.schema._parseSync({
					data: e,
					path: n.path,
					parent: n
				});
				return r.status === "aborted" ? V : r.status === "dirty" || t.value === "dirty" ? md(r.value) : r;
			}
		}
		if (r.type === "refinement") {
			let e = (e) => {
				let t = r.refinement(e, i);
				if (n.common.async) return Promise.resolve(t);
				if (t instanceof Promise) throw Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
				return e;
			};
			if (n.common.async === !1) {
				let r = this._def.schema._parseSync({
					data: n.data,
					path: n.path,
					parent: n
				});
				return r.status === "aborted" ? V : (r.status === "dirty" && t.dirty(), e(r.value), {
					status: t.value,
					value: r.value
				});
			} else return this._def.schema._parseAsync({
				data: n.data,
				path: n.path,
				parent: n
			}).then((n) => n.status === "aborted" ? V : (n.status === "dirty" && t.dirty(), e(n.value).then(() => ({
				status: t.value,
				value: n.value
			}))));
		}
		if (r.type === "transform") if (n.common.async === !1) {
			let e = this._def.schema._parseSync({
				data: n.data,
				path: n.path,
				parent: n
			});
			if (!_d(e)) return V;
			let a = r.transform(e.value, i);
			if (a instanceof Promise) throw Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
			return {
				status: t.value,
				value: a
			};
		} else return this._def.schema._parseAsync({
			data: n.data,
			path: n.path,
			parent: n
		}).then((e) => _d(e) ? Promise.resolve(r.transform(e.value, i)).then((e) => ({
			status: t.value,
			value: e
		})) : V);
		L.assertNever(r);
	}
};
wf.create = (e, t, n) => new wf({
	schema: e,
	typeName: K.ZodEffects,
	effect: t,
	...W(n)
}), wf.createWithPreprocess = (e, t, n) => new wf({
	schema: t,
	effect: {
		type: "preprocess",
		transform: e
	},
	typeName: K.ZodEffects,
	...W(n)
});
var Tf = class extends G {
	_parse(e) {
		return this._getType(e) === R.undefined ? H(void 0) : this._def.innerType._parse(e);
	}
	unwrap() {
		return this._def.innerType;
	}
};
Tf.create = (e, t) => new Tf({
	innerType: e,
	typeName: K.ZodOptional,
	...W(t)
});
var Ef = class extends G {
	_parse(e) {
		return this._getType(e) === R.null ? H(null) : this._def.innerType._parse(e);
	}
	unwrap() {
		return this._def.innerType;
	}
};
Ef.create = (e, t) => new Ef({
	innerType: e,
	typeName: K.ZodNullable,
	...W(t)
});
var Df = class extends G {
	_parse(e) {
		let { ctx: t } = this._processInputParams(e), n = t.data;
		return t.parsedType === R.undefined && (n = this._def.defaultValue()), this._def.innerType._parse({
			data: n,
			path: t.path,
			parent: t
		});
	}
	removeDefault() {
		return this._def.innerType;
	}
};
Df.create = (e, t) => new Df({
	innerType: e,
	typeName: K.ZodDefault,
	defaultValue: typeof t.default == "function" ? t.default : () => t.default,
	...W(t)
});
var Of = class extends G {
	_parse(e) {
		let { ctx: t } = this._processInputParams(e), n = {
			...t,
			common: {
				...t.common,
				issues: []
			}
		}, r = this._def.innerType._parse({
			data: n.data,
			path: n.path,
			parent: { ...n }
		});
		return vd(r) ? r.then((e) => ({
			status: "valid",
			value: e.status === "valid" ? e.value : this._def.catchValue({
				get error() {
					return new cd(n.common.issues);
				},
				input: n.data
			})
		})) : {
			status: "valid",
			value: r.status === "valid" ? r.value : this._def.catchValue({
				get error() {
					return new cd(n.common.issues);
				},
				input: n.data
			})
		};
	}
	removeCatch() {
		return this._def.innerType;
	}
};
Of.create = (e, t) => new Of({
	innerType: e,
	typeName: K.ZodCatch,
	catchValue: typeof t.catch == "function" ? t.catch : () => t.catch,
	...W(t)
});
var kf = class extends G {
	_parse(e) {
		if (this._getType(e) !== R.nan) {
			let t = this._getOrReturnCtx(e);
			return B(t, {
				code: z.invalid_type,
				expected: R.nan,
				received: t.parsedType
			}), V;
		}
		return {
			status: "valid",
			value: e.data
		};
	}
};
kf.create = (e) => new kf({
	typeName: K.ZodNaN,
	...W(e)
});
var Af = class extends G {
	_parse(e) {
		let { ctx: t } = this._processInputParams(e), n = t.data;
		return this._def.type._parse({
			data: n,
			path: t.path,
			parent: t
		});
	}
	unwrap() {
		return this._def.type;
	}
}, jf = class e extends G {
	_parse(e) {
		let { status: t, ctx: n } = this._processInputParams(e);
		if (n.common.async) return (async () => {
			let e = await this._def.in._parseAsync({
				data: n.data,
				path: n.path,
				parent: n
			});
			return e.status === "aborted" ? V : e.status === "dirty" ? (t.dirty(), md(e.value)) : this._def.out._parseAsync({
				data: e.value,
				path: n.path,
				parent: n
			});
		})();
		{
			let e = this._def.in._parseSync({
				data: n.data,
				path: n.path,
				parent: n
			});
			return e.status === "aborted" ? V : e.status === "dirty" ? (t.dirty(), {
				status: "dirty",
				value: e.value
			}) : this._def.out._parseSync({
				data: e.value,
				path: n.path,
				parent: n
			});
		}
	}
	static create(t, n) {
		return new e({
			in: t,
			out: n,
			typeName: K.ZodPipeline
		});
	}
}, Mf = class extends G {
	_parse(e) {
		let t = this._def.innerType._parse(e), n = (e) => (_d(e) && (e.value = Object.freeze(e.value)), e);
		return vd(t) ? t.then((e) => n(e)) : n(t);
	}
	unwrap() {
		return this._def.innerType;
	}
};
Mf.create = (e, t) => new Mf({
	innerType: e,
	typeName: K.ZodReadonly,
	...W(t)
}), sf.lazycreate;
var K;
(function(e) {
	e.ZodString = "ZodString", e.ZodNumber = "ZodNumber", e.ZodNaN = "ZodNaN", e.ZodBigInt = "ZodBigInt", e.ZodBoolean = "ZodBoolean", e.ZodDate = "ZodDate", e.ZodSymbol = "ZodSymbol", e.ZodUndefined = "ZodUndefined", e.ZodNull = "ZodNull", e.ZodAny = "ZodAny", e.ZodUnknown = "ZodUnknown", e.ZodNever = "ZodNever", e.ZodVoid = "ZodVoid", e.ZodArray = "ZodArray", e.ZodObject = "ZodObject", e.ZodUnion = "ZodUnion", e.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", e.ZodIntersection = "ZodIntersection", e.ZodTuple = "ZodTuple", e.ZodRecord = "ZodRecord", e.ZodMap = "ZodMap", e.ZodSet = "ZodSet", e.ZodFunction = "ZodFunction", e.ZodLazy = "ZodLazy", e.ZodLiteral = "ZodLiteral", e.ZodEnum = "ZodEnum", e.ZodEffects = "ZodEffects", e.ZodNativeEnum = "ZodNativeEnum", e.ZodOptional = "ZodOptional", e.ZodNullable = "ZodNullable", e.ZodDefault = "ZodDefault", e.ZodCatch = "ZodCatch", e.ZodPromise = "ZodPromise", e.ZodBranded = "ZodBranded", e.ZodPipeline = "ZodPipeline", e.ZodReadonly = "ZodReadonly";
})(K ||= {});
var q = Gd.create, J = qd.create;
kf.create, Jd.create;
var Nf = Yd.create;
Xd.create, Zd.create, Qd.create, $d.create;
var Pf = ef.create, Ff = tf.create;
nf.create, rf.create;
var If = af.create, Y = sf.create;
sf.strictCreate;
var X = cf.create;
uf.create, ff.create;
var Lf = pf.create, Rf = mf.create;
hf.create, gf.create, _f.create;
var zf = vf.create, Z = yf.create, Bf = xf.create;
Sf.create, Cf.create, wf.create, Tf.create, Ef.create, wf.createWithPreprocess, jf.create;
var Vf = {
	string: ((e) => Gd.create({
		...e,
		coerce: !0
	})),
	number: ((e) => qd.create({
		...e,
		coerce: !0
	})),
	boolean: ((e) => Yd.create({
		...e,
		coerce: !0
	})),
	bigint: ((e) => Jd.create({
		...e,
		coerce: !0
	})),
	date: ((e) => Xd.create({
		...e,
		coerce: !0
	}))
};
//#endregion
//#region node_modules/@allmaps/annotation/dist/schemas/shared.js
function Hf(e) {
	if (e) return Array.isArray(e) ? e : [e];
}
var Uf = X([
	q(),
	J(),
	Nf()
]), Wf = Rf(q(), Uf.array()), Gf = Lf([J(), J()]), Kf = Y({
	type: Z("Point"),
	coordinates: Gf
}), qf = Gf.array().min(3), Jf = [
	"ImageService1",
	"ImageService2",
	"ImageService3"
], Yf = [...Jf, "Canvas"], Xf = Bf(Jf), Zf = Bf(Yf), Qf = Y({
	id: q().url(),
	type: q(),
	label: Wf.optional()
}).extend({ partOf: zf(() => Qf.array()).optional() }), $f = X([Qf.array(), Qf]).transform(Hf), ep = Y({
	type: Bf([
		"helmert",
		"polynomial",
		"thinPlateSpline",
		"projective",
		"straight",
		"linear"
	]),
	options: Y({}).passthrough().optional()
});
function tp(e) {
	let t = e.toLowerCase();
	if (t === "thinplatespline" || t === "thin-plate-spline") return { type: "thinPlateSpline" };
	if (t === "polynomial1") return {
		type: "polynomial",
		options: { order: 1 }
	};
	if (t === "polynomial2") return {
		type: "polynomial",
		options: { order: 2 }
	};
}
var np = X([ep, Ff()]).transform((e) => {
	let { success: t, data: n } = ep.safeParse(e);
	if (t) return n;
	if (e === "string") return tp(e);
	if (e && typeof e == "object" && "type" in e && typeof e.type == "string") return tp(e.type);
}), rp = Y({
	id: q().url().optional(),
	name: q().optional(),
	definition: X([q(), Ff()])
}), ip = X([q().url().array(), q().url()]), ap = Y({
	type: Z("SvgSelector"),
	value: q().regex(/^<svg\s+width="\d+"\s+height="\d+"\s*>\s*<polygon\s+points="\s*(-?\d+(\.\d+)?,-?\d+(\.\d+)?\s+){2,}-?\d+(\.\d+)?,-?\d+(\.\d+)?\s*"\s*\/>\s*<\/svg>$/)
}), op = Y({
	source: q().url(),
	service: If(Y({
		"@id": q().url(),
		type: Zf
	})).length(1),
	selector: ap
}), sp = Y({ pixelCoords: Gf }), cp = Y({
	type: Z("FeatureCollection"),
	transformation: np.optional(),
	features: If(Y({
		type: Z("Feature"),
		properties: sp,
		geometry: Kf
	}))
}), lp = Y({
	id: q().optional(),
	type: Z("Annotation"),
	"@context": ip.optional(),
	motivation: q().default("georeferencing").optional(),
	target: op,
	body: cp
}), up = Y({
	id: q().optional(),
	type: Z("AnnotationPage"),
	"@context": ip.optional(),
	items: If(lp)
}), dp = /<polygon\s+points="\s*(-?\d+(\.\d+)?,-?\d+(\.\d+)?\s+){2,}-?\d+(\.\d+)?,-?\d+(\.\d+)?\s*"\s*\/>/, fp = RegExp(`^<svg\\s+width="\\d+"\\s+height="\\d+"\\s*>\\s*${dp.source}\\s*</svg>$`), pp = RegExp(`^<svg\\s+height="\\d+"\\s+width="\\d+"\\s*>\\s*${dp.source}\\s*</svg>$`), mp = RegExp(`^<svg\\s*>\\s*${dp.source}\\s*</svg>$`), hp = q().regex(mp), gp = q().regex(fp), _p = q().regex(pp), vp = Y({
	type: Z("SvgSelector"),
	value: X([
		hp,
		gp,
		_p
	])
}), yp = X([
	Y({
		"@id": q().url(),
		type: Xf,
		height: J().positive(),
		width: J().positive(),
		partOf: $f.optional()
	}),
	Y({
		id: q().url(),
		type: Xf,
		height: J().positive().optional(),
		width: J().positive().optional(),
		partOf: $f.optional()
	}),
	Y({
		id: q().url(),
		type: Z("Canvas"),
		height: J().positive().optional(),
		width: J().positive().optional(),
		partOf: $f.optional()
	})
]), bp = Y({
	type: Z("SpecificResource"),
	source: yp,
	selector: vp
}), xp = Y({ resourceCoords: Gf }), Sp = Y({
	type: Z("FeatureCollection"),
	transformation: np.optional(),
	resourceCrs: rp.optional(),
	features: If(Y({
		type: Z("Feature"),
		properties: xp,
		geometry: Kf
	}))
}), Cp = Y({
	id: q().optional(),
	type: Z("Annotation"),
	"@context": ip.optional(),
	motivation: q().default("georeferencing").optional(),
	created: q().datetime().optional(),
	modified: q().datetime().optional(),
	target: bp,
	body: Sp
}), wp = Y({
	id: q().optional(),
	type: Z("AnnotationPage"),
	"@context": ip.optional(),
	items: If(Cp)
});
X([lp, Cp]), X([up, wp]), X([sp, xp]);
//#endregion
//#region node_modules/@allmaps/annotation/dist/before-parse.js
function Tp(e) {
	return Array.isArray(e);
}
function Ep(e) {
	return !!(e && typeof e == "object" && "type" in e && e.type === "AnnotationPage" && "items" in e);
}
function Dp(e) {
	return !!(e && typeof e == "object" && "type" in e && e.type === "GeoreferencedMap");
}
function Op(e) {
	return !!(e && typeof e == "object" && "target" in e && e.target && typeof e.target == "object" && "source" in e.target && typeof e.target.source == "string");
}
//#endregion
//#region node_modules/@allmaps/annotation/dist/guards.js
function kp(e) {
	return "type" in e && e.type === "GeoreferencedMap";
}
function Ap(e) {
	return "source" in e.target && typeof e.target.source == "object";
}
//#endregion
//#region node_modules/@allmaps/annotation/dist/parser.js
function jp(e) {
	return {
		id: Mp(e),
		...Rp(e),
		type: Np(e),
		partOf: Pp(e)
	};
}
function Mp(e) {
	if (Ap(e)) {
		let t = e.target.source;
		return "id" in t ? t.id : t["@id"];
	} else return e.target.service[0]["@id"];
}
function Np(e) {
	return "service" in e.target ? e.target.service[0].type : e.target.source.type;
}
function Pp(e) {
	if (Ap(e)) return e.target.source.partOf;
}
function Fp(e) {
	return "pixelCoords" in e ? e.pixelCoords : e.resourceCoords;
}
function Ip(e) {
	return e.body.features.map((e) => ({
		resource: Fp(e.properties),
		geo: e.geometry.coordinates
	}));
}
function Lp(e) {
	if (Ap(e)) return {
		created: e.created,
		modified: e.modified
	};
}
function Rp(e) {
	if (Ap(e)) return {
		width: e.target.source.width,
		height: e.target.source.height
	};
	let t = e.target.selector.value, n = /width="(?<width>\d+)"/.exec(t), r = /height="(?<height>\d+)"/.exec(t), i = n?.groups?.width, a = r?.groups?.height;
	if (!i || !a) throw Error("Could not parse image dimensions");
	return {
		width: parseInt(i),
		height: parseInt(a)
	};
}
function zp(e) {
	let t = e.target.selector.value, n = /points="(?<points>.+)"/.exec(t)?.groups;
	if (n && n.points) {
		let e = n.points.trim().split(/\s+/);
		if (e[0] === e[e.length - 1] && e.splice(-1), e.length >= 3) return e.map((e) => {
			let t = e.split(",");
			if (t.length === 2) return [parseFloat(t[0]), parseFloat(t[1])];
			throw Error("Could not parse resource mask");
		});
		throw Error("Could not parse resource mask");
	} else throw Error("Could not parse resource mask");
}
function Bp(e) {
	let t;
	return "resourceCrs" in e.body && (t = e.body.resourceCrs), {
		"@context": "https://schemas.allmaps.org/map/2/context.json",
		type: "GeoreferencedMap",
		id: e.id,
		...Lp(e),
		resource: jp(e),
		gcps: Ip(e),
		resourceMask: zp(e),
		transformation: e.body.transformation,
		resourceCrs: t
	};
}
function Vp(e) {
	if (Ep(e)) {
		let t;
		return t = "items" in e && Array.isArray(e.items) && Op(e.items[0]) ? up.parse(e) : wp.parse(e), t.items.map((e) => Bp(e));
	} else {
		let t;
		return t = Op(e) ? lp.parse(e) : Cp.parse(e), [Bp(t)];
	}
}
//#endregion
//#region node_modules/@allmaps/annotation/dist/schemas/georeferenced-map/georeferenced-map.1.js
var Hp = Y({
	image: Gf,
	world: Gf
}), Up = Y({
	uri: q().url(),
	width: J(),
	height: J(),
	type: Xf
}), Wp = Y({
	id: q().optional(),
	version: J().min(1).max(1).default(1),
	image: Up,
	gcps: Hp.array(),
	pixelMask: qf,
	transformation: np.optional()
}), Gp = If(Wp), Kp = Y({
	resource: Gf,
	geo: Gf
}), qp = Y({
	id: q().url(),
	height: J().positive().optional(),
	width: J().positive().optional(),
	type: Zf,
	partOf: $f.optional()
}), Jp = Y({
	"@context": Z("https://schemas.allmaps.org/map/2/context.json").optional(),
	type: Z("GeoreferencedMap"),
	id: q().optional(),
	created: q().datetime().optional(),
	modified: q().datetime().optional(),
	resource: qp,
	gcps: Kp.array(),
	resourceMask: qf,
	transformation: np.optional(),
	resourceCrs: rp.optional()
}), Yp = If(Jp);
X([Wp, Jp]), X([Gp, Yp]), X([Hp, Kp]);
//#endregion
//#region node_modules/@allmaps/annotation/dist/generator.js
function Xp(e) {
	let t, n, r;
	kp(e) ? (t = e.resource.width, n = e.resource.height, r = e.resourceMask) : (t = e.image.width, n = e.image.height, r = e.pixelMask);
	let i = "<svg>";
	return t && n && (i = `<svg width="${t}" height="${n}">`), {
		type: "SvgSelector",
		value: `${i}<polygon points="${r.map((e) => e.join(",")).join(" ")}" /></svg>`
	};
}
function Zp(e) {
	let t, n, r, i, a;
	if (kp(e)) {
		if (e.resource.type === "Canvas") return {
			id: e.resource.id,
			type: e.resource.type,
			height: e.resource.height,
			width: e.resource.width,
			partOf: e.resource.partOf
		};
		t = e.resource.id, n = e.resource.type, r = e.resource.width, i = e.resource.height, a = e.resource.partOf;
	} else t = e.image.uri, n = e.image.type, r = e.image.width, i = e.image.height;
	return {
		id: t,
		type: n,
		height: i,
		width: r,
		partOf: a
	};
}
function Qp(e) {
	if (kp(e)) return {
		created: e.created,
		modified: e.modified
	};
}
function $p() {
	return ["http://iiif.io/api/extension/georef/1/context.json", "http://iiif.io/api/presentation/3/context.json"];
}
function em(e) {
	let t, n;
	return "resource" in e ? (t = e.resource, n = e.geo) : (t = e.image, n = e.world), {
		type: "Feature",
		properties: { resourceCoords: t },
		geometry: {
			type: "Point",
			coordinates: n
		}
	};
}
function tm(e) {
	let t = {
		type: "SpecificResource",
		source: Zp(e),
		selector: Xp(e)
	}, n;
	"resourceCrs" in e && (n = e.resourceCrs);
	let r = {
		type: "FeatureCollection",
		transformation: e.transformation,
		resourceCrs: n,
		features: e.gcps.map((e) => em(e))
	};
	return {
		id: e.id,
		type: "Annotation",
		"@context": $p(),
		...Qp(e),
		motivation: "georeferencing",
		target: t,
		body: r
	};
}
function nm(e) {
	if (Tp(e)) {
		let t;
		return t = Dp(e[0]) ? Yp.parse(e) : Gp.parse(e), {
			type: "AnnotationPage",
			"@context": "http://www.w3.org/ns/anno.jsonld",
			items: t.map((e) => tm(e))
		};
	} else {
		let t;
		return t = Dp(e) ? Jp.parse(e) : Wp.parse(e), tm(t);
	}
}
//#endregion
//#region node_modules/@allmaps/annotation/dist/convert.js
function rm(e) {
	return kp(e) ? e : Vp(nm(e))[0];
}
function im(e) {
	return e.map(rm);
}
//#endregion
//#region node_modules/@allmaps/annotation/dist/validator.js
function am(e) {
	if (Tp(e)) {
		let t;
		return t = Dp(e[0]) ? Yp.parse(e) : Gp.parse(e), im(t);
	} else {
		let t;
		return t = Dp(e) ? Jp.parse(e) : Wp.parse(e), rm(t);
	}
}
//#endregion
//#region node_modules/@allmaps/iiif-parser/dist/schemas/image.1.js
var om = /^https?:\/\/library.stanford.edu\/iiif\/image-api\/1.1\/compliance.html#level(?<level>[012])$/, sm = q().regex(om), cm = sm, lm = Z("http://library.stanford.edu/iiif/image-api/1.1/context.json"), um = Y({
	"@context": lm,
	"@id": q().url(),
	profile: sm.optional(),
	width: J().int(),
	height: J().int(),
	scale_factors: J().array().optional(),
	tile_width: J().optional(),
	tile_height: J().optional()
}), dm = Y({
	width: J().int(),
	height: J().int()
}), fm = Y({
	width: J().int(),
	height: J().int().optional(),
	scaleFactors: If(J().int())
}), pm = Bf([
	"ImageService1",
	"ImageService2",
	"ImageService3"
]), mm = Vf.date(), hm = X([mm, Pf()]).transform((e) => {
	let { success: t, data: n } = mm.safeParse(e);
	if (t) return n;
}), gm = Y({}).passthrough(), _m = /^https?:\/\/iiif.io\/api\/image\/2.*level(?<level>[012])(.json)?$/, vm = q().regex(_m), ym = X([vm, Y({
	formats: q().array().optional(),
	maxArea: J().int().optional(),
	maxHeight: J().int().optional(),
	maxWidth: J().int().optional(),
	qualities: q().array().optional(),
	supports: q().array().optional()
})]);
function bm(e) {
	return e !== void 0;
}
var xm = X([vm, If(X([ym, Ff()]).transform((e) => {
	let { success: t, data: n } = ym.safeParse(e);
	if (t) return n;
}))]).transform((e) => {
	if (e && Array.isArray(e)) {
		let t = e[0];
		if (typeof t != "string") throw Error("First profile must be a string");
		return [t, ...e.slice(1).filter(bm)];
	}
	return e;
}), Sm = X([
	Z("http://iiif.io/api/image/2/context.json"),
	Z("https://iiif.io/api/image/2/context.json"),
	q().url()
]), Cm = Y({
	"@id": q().url(),
	"@type": X([Z("iiif:Image"), Z("ImageService2")]).optional(),
	"@context": Sm,
	protocol: Z("http://iiif.io/api/image"),
	width: J().int(),
	height: J().int(),
	profile: xm,
	sizes: dm.array().optional(),
	tiles: fm.array().optional()
}), wm = Bf([
	"level0",
	"level1",
	"level2"
]), Tm = Y({
	id: q().url(),
	type: Z("ImageService3"),
	protocol: Z("http://iiif.io/api/image"),
	profile: wm,
	width: J().int(),
	height: J().int(),
	maxWidth: J().int().optional(),
	maxHeight: J().int().optional(),
	maxArea: J().int().optional(),
	sizes: dm.array().optional(),
	tiles: fm.array().optional(),
	extraFeatures: q().array().optional()
}), Em = X([Y({
	"@id": q().url(),
	"@type": pm.optional(),
	profile: X([
		cm,
		xm,
		wm
	]),
	width: J().int().optional(),
	height: J().int().optional(),
	"@context": X([
		lm,
		Z("http://iiif.io/api/image/1/context.json"),
		Sm
	]).optional()
}), X([X([Y({
	id: q().url(),
	type: Z("ImageService2"),
	profile: xm
}), Y({
	"@id": q().url(),
	"@type": Z("ImageService2"),
	profile: xm
})]), Y({
	id: q().url(),
	type: pm,
	profile: Bf([
		"level0",
		"level1",
		"level2"
	]).catch("level0")
})])]), Dm = Rf(q(), q().array());
Y({
	label: Dm.optional(),
	value: Dm.optional()
});
function Om(e) {
	if (e) return Array.isArray(e) ? e : [e];
}
function km(e) {
	if (typeof e == "string") return { none: [e] };
	if (Array.isArray(e)) {
		let t = {};
		return e.forEach((e) => {
			if (typeof e == "string") t.none ||= [], t.none.push(e);
			else if (typeof e == "object") t = {
				...t,
				...km(e)
			};
			else throw Error("Unable to parse string");
		}), t;
	} else if (e && typeof e == "object") {
		let t = e["@language"] || "none", n = e["@value"] || "";
		return { [t]: Array.isArray(n) ? n : [n] };
	}
}
function Am(e) {
	if (!e) return;
	let t = {};
	for (let n in e) t[n] = e[n];
	return t;
}
function jm(e) {
	if (e) {
		let t = km(e.label), n = km(e.value);
		if (t && n) return {
			label: t,
			value: n
		};
	}
}
function Mm(e) {
	if (e) {
		let t = Am(e.label), n = Am(e.value);
		if (t && n) return {
			label: t,
			value: n
		};
	}
}
function Nm(e) {
	return e !== void 0;
}
function Pm(e) {
	if (Array.isArray(e)) return e.length === 0 ? void 0 : e.map(jm).filter(Nm);
	if (e) throw Error("Unable to parse metadata");
}
function Fm(e) {
	if (Array.isArray(e)) return e.length === 0 ? void 0 : e.map(Mm).filter(Nm);
	if (e) throw Error("Unable to parse metadata");
}
function Im(e) {
	if (e) {
		if (typeof e == "string") return {
			label: { none: ["Attribution"] },
			value: { none: [e] }
		};
		{
			let t = km(e);
			if (t) return {
				label: { none: ["Attribution"] },
				value: t
			};
		}
	}
}
function Lm(e) {
	return e?.map((e) => typeof e == "string" ? { id: e } : {
		id: e["@id"],
		type: e["@type"],
		format: e.format,
		width: e.width,
		height: e.height
	});
}
function Rm(e) {
	return e?.map((e) => ({
		id: e["@id"],
		type: e["@type"],
		label: km(e.label),
		format: e.format
	}));
}
function zm(e) {
	if (e) return typeof e == "string" ? [{ id: e }] : Array.isArray(e) ? e.map((e) => typeof e == "string" ? { id: e } : {
		id: e["@id"],
		label: km(e.label),
		format: e.format
	}) : [{
		id: e["@id"],
		label: km(e.label),
		format: e.format
	}];
}
//#endregion
//#region node_modules/@allmaps/iiif-parser/dist/schemas/presentation.2.js
var Bm = X([
	q(),
	J(),
	Nf()
]).transform((e) => String(e)), Vm = X([Bm.array(), Bm]), Hm = Y({
	"@id": q().url(),
	format: q().optional(),
	label: Vm.optional()
}), Um = X([
	Hm,
	Hm.array(),
	Bm,
	Bm.array()
]), Wm = X([q(), Y({
	"@id": q(),
	"@type": q().optional(),
	format: q().optional(),
	height: J().optional(),
	width: J().optional()
})]), Gm = X([Wm.array(), Wm]).transform(Om), Km = Y({
	"@id": q().url(),
	"@type": q().optional(),
	label: Vm.optional(),
	format: q().optional()
}), qm = X([Km.array(), Km]).transform(Om), Jm = X([Y({
	"@value": Vm,
	"@language": q().optional()
}), Y({
	value: Vm,
	language: q().optional()
})]).transform((e) => "value" in e ? {
	"@value": e.value,
	"@language": e.language
} : e), Ym = X([
	Jm.array(),
	Jm,
	Vm
]), Xm = X([q(), Ym]), Zm = Y({
	label: Ym.optional(),
	value: Ym.optional()
}), Qm = X([Zm, Pf()]).transform((e) => {
	let { success: t, data: n } = Zm.safeParse(e);
	if (t) return n;
}).array(), $m = Y({ resource: Y({
	width: J().int().optional(),
	height: J().int().optional(),
	service: Em
}) }), eh = Y({
	"@id": q().url(),
	"@type": Z("sc:Canvas"),
	width: J().int(),
	height: J().int(),
	images: $m.array().length(1),
	label: Ym.optional(),
	description: Ym.optional(),
	related: Um.optional(),
	attribution: Xm.optional(),
	thumbnail: Gm.optional(),
	rendering: qm.optional(),
	metadata: Qm.optional(),
	navDate: hm.optional(),
	navPlace: gm.optional()
}), th = Y({ canvases: eh.array().nonempty() }), nh = Y({
	"@id": q().url(),
	"@type": Z("sc:Manifest"),
	sequences: th.array().length(1),
	label: Ym.optional(),
	description: Ym.optional(),
	metadata: Qm.optional(),
	related: Um.optional(),
	attribution: Xm.optional(),
	rendering: qm.optional(),
	thumbnail: Gm.optional(),
	navDate: hm.optional(),
	navPlace: gm.optional()
}), rh = zf(() => Y({
	"@id": q().url(),
	"@type": Z("sc:Manifest"),
	label: Ym.optional(),
	description: Ym.optional(),
	metadata: Qm.optional(),
	thumbnail: Gm.optional(),
	navDate: hm.optional(),
	navPlace: gm.optional()
})), ih = zf(() => {
	let e = X([
		rh,
		ih,
		ah
	]);
	return Y({
		"@id": q().url(),
		"@type": Z("sc:Collection"),
		manifests: e.array().optional(),
		collections: e.array().optional(),
		members: e.array().optional(),
		label: Ym.optional(),
		description: Ym.optional(),
		metadata: Qm.optional(),
		thumbnail: Gm.optional(),
		navDate: hm.optional(),
		navPlace: gm.optional(),
		related: Um.optional(),
		attribution: Xm.optional(),
		rendering: qm.optional()
	});
}), ah = Y({
	"@id": q().url(),
	"@type": Z("sc:Collection"),
	label: Ym.optional(),
	description: Ym.optional(),
	metadata: Qm.optional(),
	thumbnail: Gm.optional(),
	navDate: hm.optional(),
	navPlace: gm.optional()
}), oh = X([
	q(),
	J(),
	Nf()
]).transform((e) => String(e)), Q = Rf(q(), oh.array()), sh = Q, ch = Y({
	id: q().url(),
	type: q().optional(),
	label: Q,
	format: q().optional(),
	language: X([q(), If(q())]).optional()
}), lh = Y({
	id: q().url(),
	type: q().optional(),
	label: Q,
	format: q().optional()
}), uh = X([lh.array(), lh]).transform(Om), dh = X([ch.array(), ch]).transform(Om), fh = Y({
	id: q(),
	type: q().optional(),
	format: q().optional(),
	width: J().int().optional(),
	height: J().int().optional()
}), ph = X([fh.array(), fh]).transform(Om), mh = Y({
	id: q().url(),
	type: q().optional(),
	format: q().optional(),
	profile: q().optional()
}), hh = X([mh.array(), mh]).transform(Om), gh = Y({
	id: q().url(),
	type: Z("AnnotationPage"),
	items: Y({}).passthrough().array().optional()
}).array(), _h = Y({
	label: Q,
	value: Q
}), vh = X([_h, Pf()]).transform((e) => {
	let { success: t, data: n } = _h.safeParse(e);
	if (t) return n;
}), yh = vh.array(), bh = vh, xh = X([
	Y({
		type: Z("Image"),
		width: J().int().optional(),
		height: J().int().optional(),
		service: Em.array()
	}),
	Y({ type: Z("Video") }),
	Y({ type: Z("Sound") })
]), Sh = Y({
	type: Z("Choice"),
	items: xh.array()
}), Ch = Y({
	type: Z("Annotation"),
	body: X([
		xh,
		xh.array().length(1),
		Sh
	])
}), wh = Y({
	type: Z("AnnotationPage"),
	items: Ch.array().length(1)
}), Th = Y({
	id: q().url(),
	type: Z("Canvas"),
	width: J().int(),
	height: J().int(),
	items: wh.array(),
	label: Q.optional(),
	description: Q.optional(),
	metadata: yh.optional(),
	navDate: hm.optional(),
	navPlace: gm.optional(),
	homepage: dh.optional(),
	thumbnail: ph.optional(),
	rendering: uh.optional(),
	seeAlso: hh.optional(),
	summary: sh.optional(),
	requiredStatement: bh.optional(),
	annotations: gh.optional()
}), Eh = Y({
	id: q().url(),
	type: Z("Manifest"),
	items: Th.array(),
	label: Q.optional(),
	description: Q.optional(),
	metadata: yh.optional(),
	navDate: hm.optional(),
	navPlace: gm.optional(),
	homepage: dh.optional(),
	thumbnail: ph.optional(),
	rendering: uh.optional(),
	seeAlso: hh.optional(),
	summary: sh.optional(),
	requiredStatement: bh.optional(),
	annotations: gh.optional()
}), Dh = zf(() => Y({
	id: q().url(),
	type: Z("Manifest"),
	label: Q.optional(),
	description: Q.optional(),
	metadata: yh.optional(),
	navDate: hm.optional(),
	navPlace: gm.optional(),
	thumbnail: ph.optional()
})), Oh = zf(() => Y({
	id: q().url(),
	type: Z("Collection"),
	items: X([
		Dh,
		Oh,
		kh
	]).array(),
	label: Q.optional(),
	description: Q.optional(),
	metadata: yh.optional(),
	navDate: hm.optional(),
	navPlace: gm.optional(),
	thumbnail: ph.optional(),
	homepage: dh.optional(),
	rendering: uh.optional(),
	seeAlso: hh.optional(),
	summary: sh.optional(),
	requiredStatement: bh.optional(),
	annotations: gh.optional()
})), kh = Y({
	id: q().url(),
	type: Z("Collection"),
	label: Q.optional(),
	description: Q.optional(),
	metadata: yh.optional(),
	navDate: hm.optional(),
	navPlace: gm.optional(),
	thumbnail: ph.optional()
}), Ah = X([
	um,
	Cm,
	Tm
]);
X([eh, Th]);
var jh = X([nh, Eh]), Mh = X([ih, Oh]);
X([
	um,
	X([
		ih,
		nh,
		eh,
		Cm
	]),
	X([
		Oh,
		Eh,
		Th,
		Tm
	])
]);
//#endregion
//#region node_modules/@allmaps/iiif-parser/dist/lib/tiles.js
function Nh({ width: e, height: t }, n, r, i) {
	let a = r * n.originalWidth, o = i * n.originalHeight, s = r * n.originalWidth + n.width * n.scaleFactor > e ? e - r * n.originalWidth : n.width * n.scaleFactor, c = i * n.originalHeight + n.height * n.scaleFactor > t ? t - i * n.originalHeight : n.height * n.scaleFactor, l = n.width, u = n.height;
	return a + n.width * n.scaleFactor > e && (l = Math.floor((e - a + n.scaleFactor - 1) / n.scaleFactor)), o + n.height * n.scaleFactor > t && (u = Math.floor((t - o + n.scaleFactor - 1) / n.scaleFactor)), {
		region: {
			x: a,
			y: o,
			width: s,
			height: c
		},
		size: {
			width: l,
			height: u
		}
	};
}
function Ph({ width: e, height: t }, n = 768) {
	let r = Math.max(e, t) / n, i = Math.ceil(Math.log(r) / Math.log(2));
	return {
		scaleFactors: Array.from({ length: i }, (e, t) => 2 ** t),
		width: n
	};
}
function Fh({ width: e, height: t }, n, r) {
	let i = n.height || n.width, a = n.width * r, o = i * r;
	return {
		scaleFactor: r,
		width: n.width,
		height: i,
		originalWidth: a,
		originalHeight: o,
		columns: Math.ceil(e / a),
		rows: Math.ceil(t / o)
	};
}
function Ih(e, t) {
	return t.map((t) => t.scaleFactors.map((n) => Fh(e, t, n))).flat();
}
function Lh(e) {
	return !!e.some((e) => e.width && e.scaleFactors && e.scaleFactors.length);
}
function Rh(e, t, n) {
	if (!t || !Lh(t)) if (n) t = [Ph(e)];
	else throw Error("Image does not support tiles or custom regions and sizes.");
	return Ih(e, t);
}
//#endregion
//#region node_modules/@allmaps/iiif-parser/dist/lib/image-requests.js
function zh(e, t, n = "cover") {
	if (n === "cover" || n === "contain") {
		let r = t.width / e.width, i = t.height / e.height, a = n === "cover" ? Math.max(r, i) : Math.min(r, i);
		return {
			width: e.width * a,
			height: e.height * a
		};
	} else throw Error("Mode must be either \"cover\" or \"contain\"");
}
var Bh = .8, Vh = 1.5;
function Hh(e, t, n = "cover", { sizes: r, tileZoomLevels: i, supportsAnyRegionAndSize: a, maxWidth: o, maxHeight: s, maxArea: c }) {
	let { width: l, height: u } = zh(e, t, n);
	if (o && l > o && (u = u / l * o, l = o), s && u > s && (l = l / u * s, u = s), c && l * u > c) {
		let e = u / l, t = Math.floor(Math.sqrt(c / e)) * e;
		l = Math.floor(t) / e, u = l * e;
	}
	let d = e.width / e.height;
	if (l = Math.floor(l), u = Math.round(l / d), r) {
		let e;
		for (let t of r) {
			let n = t.width / l;
			if (n >= Bh && n <= Vh) {
				e = t;
				break;
			}
		}
		if (e) return { size: e };
	}
	if (a) return { size: {
		width: Math.round(l),
		height: Math.round(u)
	} };
	if (i) {
		let t = e.width / l, n = i[i.map(({ scaleFactor: e }, n) => ({
			index: n,
			scaleFactor: e,
			diff: Math.abs(e - t)
		})).sort((e, t) => e.diff - t.diff)[0].index], r = Math.ceil(e.width / (n.scaleFactor * i[0].width)), a = Math.ceil(e.height / (n.scaleFactor * i[0].height)), o = [];
		for (let t = 0; t < a; t++) {
			let i = [];
			for (let a = 0; a < r; a++) {
				let r = Nh(e, n, a, t);
				i.push(r);
			}
			o.push(i);
		}
		return o;
	}
	throw Error("Unable to create thumbnail");
}
//#endregion
//#region node_modules/@allmaps/iiif-parser/dist/lib/profile.js
var Uh = ["regionByPx", "sizeByWh"];
function Wh(e) {
	let t = e.match(om);
	if (t && t.groups) return parseInt(t.groups.level);
}
function Gh(e) {
	let t = e.match(_m);
	if (t && t.groups) return parseInt(t.groups.level);
}
function Kh(e) {
	return {
		maxWidth: e?.maxWidth,
		maxHeight: e?.maxHeight,
		maxArea: e?.maxArea,
		supportsAnyRegionAndSize: Uh.every((t) => e?.supports && e?.supports?.includes(t))
	};
}
function qh(e) {
	if ("type" in e && e.type === "ImageService3") return 3;
	if ("type" in e && e.type === "ImageService2" || "@type" in e && e["@type"] === "ImageService2" || "@context" in e && e["@context"] === "http://iiif.io/api/image/2/context.json") return 2;
	if ("@context" in e && (e["@context"] === "http://library.stanford.edu/iiif/image-api/1.1/context.json" || e["@context"] === "http://iiif.io/api/image/1/context.json")) return 1;
	if ("profile" in e) {
		let t;
		return t = Array.isArray(e.profile) ? e.profile[0] : e.profile, t.match(om) ? 1 : t.match(_m) ? 2 : 3;
	} else throw Error("Unsupported IIIF Image Service");
}
function Jh(e) {
	if ("type" in e || "@type" in e) {
		let t = e.profile, n = !1;
		return t === "level0" || typeof t == "string" && t.endsWith("level0.json") ? "extraFeatures" in e && (n = Uh.every((t) => e.extraFeatures && e.extraFeatures.includes(t))) : n = !0, {
			maxWidth: "maxWidth" in e ? e.maxWidth : void 0,
			maxHeight: "maxHeight" in e ? e.maxHeight : void 0,
			maxArea: "maxArea" in e ? e.maxArea : void 0,
			supportsAnyRegionAndSize: n
		};
	} else if (Array.isArray(e.profile)) {
		let t = !1, n = -Infinity, r = -Infinity, i = -Infinity;
		return e.profile.forEach((e) => {
			if (typeof e == "string") {
				let n = Gh(e);
				n && (t ||= n >= 1);
			} else {
				let { maxWidth: a, maxHeight: o, maxArea: s, supportsAnyRegionAndSize: c } = Kh(e);
				a !== void 0 && (r = Math.max(a, r)), o !== void 0 && (n = Math.max(o, n)), s !== void 0 && (i = Math.max(s, i)), t ||= c;
			}
		}), {
			maxWidth: r >= 0 ? r : void 0,
			maxHeight: n >= 0 ? n : void 0,
			maxArea: i >= 0 ? i : void 0,
			supportsAnyRegionAndSize: t
		};
	} else if ("profile" in e && e.profile) {
		let t = Wh(e.profile), n = Gh(e.profile);
		return t ? { supportsAnyRegionAndSize: t >= 1 } : n ? { supportsAnyRegionAndSize: n >= 1 } : { supportsAnyRegionAndSize: !1 };
	} else throw Error("Invalid Image");
}
//#endregion
//#region node_modules/@allmaps/iiif-parser/dist/classes/image.js
var Yh = "image", Xh = class {
	embedded = !0;
	uri;
	type = Yh;
	maxWidth;
	maxHeight;
	maxArea;
	supportsAnyRegionAndSize;
	width;
	height;
	majorVersion;
	constructor(e, t) {
		let { parsedCanvas: n } = t || {};
		if (n && "service" in e) {
			let t = e, n, r;
			if (Array.isArray(t.service) ? t.service.forEach((e) => {
				try {
					let t = qh(e);
					(!r || t > r) && (r = t, n = e);
				} catch {}
			}) : n = t.service, !n) throw Error("Unsupported IIIF Image Service");
			if ("@id" in n) this.uri = n["@id"];
			else if ("id" in n) this.uri = n.id;
			else throw Error("Unsupported IIIF Image Service");
			if ("type" in n && n.type === "ImageService3") this.majorVersion = 3;
			else if ("type" in n && n.type === "ImageService2" || "@type" in n && n["@type"] === "ImageService2" || "@context" in n && n["@context"] === "http://iiif.io/api/image/2/context.json") this.majorVersion = 2;
			else if ("@context" in n && (n["@context"] === "http://library.stanford.edu/iiif/image-api/1.1/context.json" || n["@context"] === "http://iiif.io/api/image/1/context.json")) this.majorVersion = 1;
			else if ("profile" in n) {
				let e;
				if (Array.isArray(n.profile) && n.profile.length > 0) e = n.profile[0];
				else if (typeof n.profile == "string") e = n.profile;
				else throw Error("Unsupported IIIF Image Service");
				e.match(om) ? this.majorVersion = 1 : e.match(_m) ? this.majorVersion = 2 : this.majorVersion = 3;
			} else throw Error("Unsupported IIIF Image Service");
			if ("profile" in n) {
				let e = Jh(n);
				this.supportsAnyRegionAndSize = e.supportsAnyRegionAndSize, this.maxWidth = e.maxWidth, this.maxHeight = e.maxHeight, this.maxArea = e.maxArea;
			} else this.supportsAnyRegionAndSize = !1;
		} else {
			if ("@id" in e) this.uri = e["@id"];
			else if ("id" in e) this.uri = e.id;
			else throw Error("Unsupported IIIF Image");
			if ("type" in e && e.type === "ImageService3") this.majorVersion = 3;
			else if ("@type" in e && e["@type"] === "iiif:Image" || "@context" in e && e["@context"] === "http://iiif.io/api/image/2/context.json") this.majorVersion = 2;
			else if ("@context" in e && e["@context"] === "http://library.stanford.edu/iiif/image-api/1.1/context.json") this.majorVersion = 1;
			else throw Error("Unsupported IIIF Image");
			if ("profile" in e) {
				let t = Jh(e);
				this.supportsAnyRegionAndSize = t.supportsAnyRegionAndSize, this.maxWidth = t.maxWidth, this.maxHeight = t.maxHeight, this.maxArea = t.maxArea;
			} else this.supportsAnyRegionAndSize = !1;
		}
		if (e.width !== void 0) this.width = e.width;
		else if (n) this.width = n.width;
		else throw Error("Width not present on either Canvas or Image Resource");
		if (e.height !== void 0) this.height = e.height;
		else if (n) this.height = n.height;
		else throw Error("Height not present on either Canvas or Image Resource");
	}
	getImageUrl(e) {
		let { region: t, size: n } = e, r, i, a, o, s;
		t ? (s = `${t.x},${t.y},${t.width},${t.height}`, a = t.height, o = t.width) : (s = "full", a = this.height, o = this.width);
		let c;
		if (n) {
			r = Math.round(n.width), i = Math.round(n.height);
			let e = String(r), t = String(i), s = o / a, l = i * s / s;
			this.majorVersion <= 2 && i === Math.round(l) && (t = ""), c = `${e},${t}`;
		} else r = this.width, i = this.height, c = this.majorVersion === 2 ? "full" : "max";
		let l = r * i;
		if (this.maxWidth !== void 0 && r > this.maxWidth) throw Error(`Width of requested image is too large: ${r} > ${this.maxWidth}`);
		if (this.maxHeight !== void 0 && i > this.maxHeight) throw Error(`Height of requested image is too large: ${i} > ${this.maxHeight}`);
		if (this.maxArea !== void 0 && l > this.maxArea) throw Error(`Area of requested image is too large: ${l} > ${this.maxArea}`);
		let u = this.majorVersion === 1 ? "native" : "default";
		return `${this.uri}/${s}/${c}/0/${u}.jpg`;
	}
	getImageRequest(e, t = "cover") {
		return Hh({
			width: this.width,
			height: this.height
		}, e, t, {
			supportsAnyRegionAndSize: this.supportsAnyRegionAndSize,
			maxWidth: this.maxWidth,
			maxHeight: this.maxHeight,
			maxArea: this.maxArea
		});
	}
}, Zh = class e extends Xh {
	source;
	tileZoomLevels;
	sizes;
	embedded = !1;
	constructor(e, t) {
		super(e), this.source = t?.source;
		let n = Jh(e), r;
		"tiles" in e && (r = e.tiles), this.tileZoomLevels = Rh({
			width: this.width,
			height: this.height
		}, r, n.supportsAnyRegionAndSize), "sizes" in e && (this.sizes = e.sizes);
	}
	static parse(t, n) {
		let { majorVersion: r, keepSource: i } = n || {}, a;
		return a = r === 1 ? um.parse(t) : r === 2 ? Cm.parse(t) : r === 3 ? Tm.parse(t) : Ah.parse(t), new e(a, i ? { source: t } : {});
	}
	getTileImageRequest(e, t, n) {
		return Nh({
			width: this.width,
			height: this.height
		}, e, t, n);
	}
	getImageRequest(e, t = "cover") {
		return Hh({
			width: this.width,
			height: this.height
		}, e, t, {
			supportsAnyRegionAndSize: this.supportsAnyRegionAndSize,
			sizes: this.sizes,
			tileZoomLevels: this.tileZoomLevels,
			maxWidth: this.maxWidth,
			maxHeight: this.maxHeight,
			maxArea: this.maxArea
		});
	}
}, Qh = "canvas", $h = class {
	uri;
	type = Qh;
	height;
	width;
	image;
	label;
	description;
	metadata;
	navDate;
	navPlace;
	homepage;
	thumbnail;
	rendering;
	seeAlso;
	summary;
	requiredStatement;
	annotations;
	constructor(e) {
		if (this.width = e.width, this.height = e.height, "@id" in e) this.uri = e["@id"], this.description = km(e.description), this.label = km(e.label), this.metadata = Pm(e.metadata), this.navDate = e.navDate, this.navPlace = e.navPlace, this.requiredStatement = Im(e.attribution), this.thumbnail = Lm(e.thumbnail), this.rendering = Rm(e.rendering), this.homepage = zm(e.related), this.image = new Xh(e.images[0].resource, { parsedCanvas: e });
		else if ("id" in e) {
			this.uri = e.id, this.label = Am(e.label), this.description = Am(e.description), this.metadata = Fm(e.metadata), this.navDate = e.navDate, this.navPlace = e.navPlace, this.homepage = e.homepage, this.thumbnail = e.thumbnail, this.rendering = e.rendering, this.seeAlso = e.seeAlso, this.summary = e.summary, this.requiredStatement = e.requiredStatement, this.annotations = e.annotations;
			let t = e.items[0].items[0].body, n;
			if (Array.isArray(t) ? n = t.find((e) => e.type === "Image") : t.type === "Image" ? n = t : t.type === "Choice" && (n = t.items.find((e) => e.type === "Image")), n) this.image = new Xh(n, { parsedCanvas: e });
			else throw Error("No image found on IIIF Canvas");
		} else throw Error("Invalid IIIF Canvas");
	}
}, eg = "manifest", tg = class {
	embedded = !0;
	uri;
	type = eg;
	label;
	description;
	metadata;
	navDate;
	navPlace;
	thumbnail;
	majorVersion;
	constructor(e) {
		if ("@type" in e) this.uri = e["@id"], this.majorVersion = 2, this.label = km(e.label), this.description = km(e.description), this.metadata = Pm(e.metadata), this.navDate = e.navDate, this.navPlace = e.navPlace;
		else if ("type" in e) this.uri = e.id, this.majorVersion = 3, this.label = Am(e.label), this.description = Am(e.description), this.metadata = Fm(e.metadata), this.navDate = e.navDate, this.navPlace = e.navPlace, this.thumbnail = e.thumbnail;
		else throw Error("Unsupported Manifest");
	}
}, ng = class e extends tg {
	source;
	canvases = [];
	homepage;
	rendering;
	seeAlso;
	summary;
	requiredStatement;
	annotations;
	embedded = !1;
	constructor(e, t) {
		if (super(e), this.source = t?.source, "@type" in e) {
			let t = e.sequences[0];
			this.canvases = this.#e(t.canvases), this.requiredStatement = Im(e.attribution), this.thumbnail = Lm(e.thumbnail), this.rendering = Rm(e.rendering), this.homepage = zm(e.related);
		} else if ("type" in e) this.homepage = e.homepage, this.rendering = e.rendering, this.seeAlso = e.seeAlso, this.summary = e.summary, this.requiredStatement = e.requiredStatement, this.annotations = e.annotations, this.canvases = this.#e(e.items);
		else throw Error("Unsupported Manifest");
	}
	#e(e) {
		return e.flatMap((e) => {
			try {
				return new $h(e);
			} catch {
				return [];
			}
		});
	}
	static parse(t, n) {
		let { majorVersion: r, keepSource: i } = n || {}, a;
		return a = r === 2 ? nh.parse(t) : r === 3 ? Eh.parse(t) : jh.parse(t), new e(a, i ? { source: t } : {});
	}
	get images() {
		return this.canvases.map((e) => e.image);
	}
	async #t(e, t) {
		if (e instanceof Zh) return e;
		{
			let n = await t(`${e.uri}/info.json`).then((e) => e.json());
			return Zh.parse(n, { keepSource: this.source !== void 0 });
		}
	}
	async fetchAllItems(e = globalThis.fetch) {
		let t = [];
		for await (let n of this.fetchNextItem(e)) t.push(n);
		return t;
	}
	async *fetchNextItem(e = globalThis.fetch, t = 0) {
		for (let n of this.canvases) {
			let r = await this.#t(n.image, e);
			n.image = r, yield {
				item: r,
				depth: t,
				parent: {
					uri: this.uri,
					type: this.type
				}
			};
		}
	}
	async fetchImageByUri(e, t = globalThis.fetch) {
		for (let n of this.canvases) if (n.image.uri === e) {
			let e = await this.#t(n.image, t);
			return n.image = e, e;
		}
	}
}, rg, ig = "collection", ag = {
	maxDepth: Infinity,
	fetchCollections: !0,
	fetchManifests: !0,
	fetchImages: !1,
	fetchFn: globalThis.fetch
}, og = class {
	uri;
	type = ig;
	majorVersion;
	label;
	description;
	metadata;
	navDate;
	navPlace;
	thumbnail;
	embedded = !0;
	constructor(e) {
		if ("@type" in e) this.uri = e["@id"], this.majorVersion = 2, this.label = km(e.label), this.description = km(e.description), this.metadata = Pm(e.metadata), this.thumbnail = Lm(e.thumbnail), this.navDate = e.navDate, this.navPlace = e.navPlace;
		else if ("type" in e) this.uri = e.id, this.majorVersion = 3, this.label = Am(e.label), this.description = Am(e.description), this.metadata = Fm(e.metadata), this.navDate = e.navDate, this.navPlace = e.navPlace, this.thumbnail = e.thumbnail;
		else throw Error("Unsupported Collection");
	}
	static parse(e, t) {
		let { majorVersion: n, keepSource: r } = t || {}, i;
		return i = n === 2 ? ih.parse(e) : n === 3 ? Oh.parse(e) : Mh.parse(e), new sg(i, r ? { source: e } : {});
	}
}, sg = class extends og {
	source;
	items = [];
	embedded = !1;
	homepage;
	rendering;
	seeAlso;
	summary;
	requiredStatement;
	annotations;
	constructor(e, t) {
		if (super(e), this.source = t?.source, "@type" in e) {
			this.requiredStatement = Im(e.attribution), this.rendering = Rm(e.rendering), this.homepage = zm(e.related);
			let t = "manifests" in e && e.manifests ? e.manifests : [], n = "collections" in e && e.collections ? e.collections : [], r = "members" in e && e.members ? e.members : [], i = [
				...t,
				...n,
				...r
			];
			this.items = i.map((e) => this.#e(e));
		} else if ("type" in e) this.homepage = e.homepage, this.rendering = e.rendering, this.seeAlso = e.seeAlso, this.summary = e.summary, this.requiredStatement = e.requiredStatement, this.annotations = e.annotations, "items" in e && (this.items = e.items.map((e) => this.#e(e)));
		else throw Error("Unsupported Collection");
	}
	#e(e) {
		if ("@type" in e) {
			if (e["@type"] === "sc:Collection") return "manifests" in e || "collections" in e || "members" in e ? new rg(e) : new og(e);
			if (e["@type"] === "sc:Manifest") return new tg(e);
		} else if ("type" in e) {
			if (e.type === "Collection") return "items" in e ? new rg(e) : new og(e);
			if (e.type === "Manifest") return new tg(e);
		}
		throw Error("Unsupported Collection item");
	}
	static parse(e, t) {
		let { majorVersion: n, keepSource: r } = t || {}, i;
		return i = n === 2 ? ih.parse(e) : n === 3 ? Oh.parse(e) : Mh.parse(e), new rg(i, r ? { source: e } : {});
	}
	get canvases() {
		return this.items.reduce((e, t) => t instanceof ng ? [...e, ...t.canvases] : t instanceof tg ? e : t instanceof rg ? [...e, ...t.canvases] : e, []);
	}
	get images() {
		return this.canvases.map((e) => e.image);
	}
	async fetchItemWithIndex(e, t = fetch) {
		let n = this.items[e];
		if (n.type === "manifest" && n.embedded === !0) {
			let r = n.uri, i = await t(r).then((e) => e.json()), a = ng.parse(i, { keepSource: this.source !== void 0 });
			this.items[e] = a;
		} else if (n.type === "collection" && n.embedded === !0) {
			let r = n.uri, i = await t(r).then((e) => e.json()), a = rg.parse(i, { keepSource: this.source !== void 0 });
			this.items[e] = a;
		}
		return this.items[e];
	}
	async fetchItemWithId(e, t = fetch) {
		let n = this.items.findIndex((t) => t.uri === e);
		if (n >= 0) return await this.fetchItemWithIndex(n, t);
	}
	getItemAtPath(e) {
		let t = this;
		for (let n of e) {
			if ("items" in t) t = t.items[n];
			else if ("canvases" in t) t = t.canvases[n];
			else return;
			if (!t) return;
		}
		return t;
	}
	async fetchUntilPath(e) {
		let t = this;
		for (let n of e) {
			let e = t.items[n];
			if (e && e.embedded === !0 && await t.fetchItemWithIndex(n), t.items[n] instanceof rg) t = t.items[n];
			else break;
		}
	}
	async fetchAllItems(e) {
		let t = [];
		for await (let n of this.fetchNextItem(e)) t.push(n);
		return t;
	}
	async *fetchNextItem(e, t = 0) {
		if (e = {
			...ag,
			...e
		}, Number.isNaN(e.maxDepth)) return;
		e.maxDepth === void 0 && (e.maxDepth = ag.maxDepth), e.fetchImages === void 0 && (e.fetchImages = ag.fetchImages), e.fetchManifests === void 0 && (e.fetchManifests = ag.fetchManifests);
		let n = ag.fetchFn;
		if (e.fetchFn && (n = e.fetchFn), !(t >= e.maxDepth)) {
			for (let [r, i] of this.items.entries()) if (i instanceof ng) e.fetchImages && (yield* i.fetchNextItem(n, t + 1));
			else if (i.type === "manifest" && i.embedded === !0 && e.fetchManifests) {
				let i = await this.fetchItemWithIndex(r);
				i instanceof ng && (yield {
					item: i,
					depth: t + 1,
					parent: {
						uri: this.uri,
						type: this.type
					}
				}, t + 1 < e.maxDepth && e.fetchImages && (yield* i.fetchNextItem(n, t + 2)));
			} else if (i.type === "collection" && i.embedded === !0 && e.fetchCollections) {
				let n = await this.fetchItemWithIndex(r);
				n instanceof rg && (yield {
					item: n,
					depth: t + 1,
					parent: {
						uri: this.uri,
						type: this.type
					}
				}, t + 1 < e.maxDepth && (yield* n.fetchNextItem(e, t + 2)));
			}
		}
	}
};
rg = sg;
//#endregion
//#region node_modules/quickselect/index.js
function cg(e, t, n = 0, r = e.length - 1, i = ug) {
	for (; r > n;) {
		if (r - n > 600) {
			let a = r - n + 1, o = t - n + 1, s = Math.log(a), c = .5 * Math.exp(2 * s / 3), l = .5 * Math.sqrt(s * c * (a - c) / a) * (o - a / 2 < 0 ? -1 : 1);
			cg(e, t, Math.max(n, Math.floor(t - o * c / a + l)), Math.min(r, Math.floor(t + (a - o) * c / a + l)), i);
		}
		let a = e[t], o = n, s = r;
		for (lg(e, n, t), i(e[r], a) > 0 && lg(e, n, r); o < s;) {
			for (lg(e, o, s), o++, s--; i(e[o], a) < 0;) o++;
			for (; i(e[s], a) > 0;) s--;
		}
		i(e[n], a) === 0 ? lg(e, n, s) : (s++, lg(e, s, r)), s <= t && (n = s + 1), t <= s && (r = s - 1);
	}
}
function lg(e, t, n) {
	let r = e[t];
	e[t] = e[n], e[n] = r;
}
function ug(e, t) {
	return e < t ? -1 : +(e > t);
}
//#endregion
//#region node_modules/rbush/index.js
var dg = class {
	constructor(e = 9) {
		this._maxEntries = Math.max(4, e), this._minEntries = Math.max(2, Math.ceil(this._maxEntries * .4)), this.clear();
	}
	all() {
		return this._all(this.data, []);
	}
	search(e) {
		let t = this.data, n = [];
		if (!Cg(e, t)) return n;
		let r = this.toBBox, i = [];
		for (; t;) {
			for (let a = 0; a < t.children.length; a++) {
				let o = t.children[a], s = t.leaf ? r(o) : o;
				Cg(e, s) && (t.leaf ? n.push(o) : Sg(e, s) ? this._all(o, n) : i.push(o));
			}
			t = i.pop();
		}
		return n;
	}
	collides(e) {
		let t = this.data;
		if (!Cg(e, t)) return !1;
		let n = [];
		for (; t;) {
			for (let r = 0; r < t.children.length; r++) {
				let i = t.children[r], a = t.leaf ? this.toBBox(i) : i;
				if (Cg(e, a)) {
					if (t.leaf || Sg(e, a)) return !0;
					n.push(i);
				}
			}
			t = n.pop();
		}
		return !1;
	}
	load(e) {
		if (!(e && e.length)) return this;
		if (e.length < this._minEntries) {
			for (let t = 0; t < e.length; t++) this.insert(e[t]);
			return this;
		}
		let t = this._build(e.slice(), 0, e.length - 1, 0);
		if (!this.data.children.length) this.data = t;
		else if (this.data.height === t.height) this._splitRoot(this.data, t);
		else {
			if (this.data.height < t.height) {
				let e = this.data;
				this.data = t, t = e;
			}
			this._insert(t, this.data.height - t.height - 1, !0);
		}
		return this;
	}
	insert(e) {
		return e && this._insert(e, this.data.height - 1), this;
	}
	clear() {
		return this.data = wg([]), this;
	}
	remove(e, t) {
		if (!e) return this;
		let n = this.data, r = this.toBBox(e), i = [], a = [], o, s, c;
		for (; n || i.length;) {
			if (n || (n = i.pop(), s = i[i.length - 1], o = a.pop(), c = !0), n.leaf) {
				let r = fg(e, n.children, t);
				if (r !== -1) return n.children.splice(r, 1), i.push(n), this._condense(i), this;
			}
			!c && !n.leaf && Sg(n, r) ? (i.push(n), a.push(o), o = 0, s = n, n = n.children[0]) : s ? (o++, n = s.children[o], c = !1) : n = null;
		}
		return this;
	}
	toBBox(e) {
		return e;
	}
	compareMinX(e, t) {
		return e.minX - t.minX;
	}
	compareMinY(e, t) {
		return e.minY - t.minY;
	}
	toJSON() {
		return this.data;
	}
	fromJSON(e) {
		return this.data = e, this;
	}
	_all(e, t) {
		let n = [];
		for (; e;) e.leaf ? t.push(...e.children) : n.push(...e.children), e = n.pop();
		return t;
	}
	_build(e, t, n, r) {
		let i = n - t + 1, a = this._maxEntries, o;
		if (i <= a) return o = wg(e.slice(t, n + 1)), pg(o, this.toBBox), o;
		r || (r = Math.ceil(Math.log(i) / Math.log(a)), a = Math.ceil(i / a ** (r - 1))), o = wg([]), o.leaf = !1, o.height = r;
		let s = Math.ceil(i / a), c = s * Math.ceil(Math.sqrt(a));
		Tg(e, t, n, c, this.compareMinX);
		for (let i = t; i <= n; i += c) {
			let t = Math.min(i + c - 1, n);
			Tg(e, i, t, s, this.compareMinY);
			for (let n = i; n <= t; n += s) {
				let i = Math.min(n + s - 1, t);
				o.children.push(this._build(e, n, i, r - 1));
			}
		}
		return pg(o, this.toBBox), o;
	}
	_chooseSubtree(e, t, n, r) {
		for (; r.push(t), !(t.leaf || r.length - 1 === n);) {
			let n = Infinity, r = Infinity, i;
			for (let a = 0; a < t.children.length; a++) {
				let o = t.children[a], s = vg(o), c = bg(e, o) - s;
				c < r ? (r = c, n = s < n ? s : n, i = o) : c === r && s < n && (n = s, i = o);
			}
			t = i || t.children[0];
		}
		return t;
	}
	_insert(e, t, n) {
		let r = n ? e : this.toBBox(e), i = [], a = this._chooseSubtree(r, this.data, t, i);
		for (a.children.push(e), hg(a, r); t >= 0 && i[t].children.length > this._maxEntries;) this._split(i, t), t--;
		this._adjustParentBBoxes(r, i, t);
	}
	_split(e, t) {
		let n = e[t], r = n.children.length, i = this._minEntries;
		this._chooseSplitAxis(n, i, r);
		let a = this._chooseSplitIndex(n, i, r), o = wg(n.children.splice(a, n.children.length - a));
		o.height = n.height, o.leaf = n.leaf, pg(n, this.toBBox), pg(o, this.toBBox), t ? e[t - 1].children.push(o) : this._splitRoot(n, o);
	}
	_splitRoot(e, t) {
		this.data = wg([e, t]), this.data.height = e.height + 1, this.data.leaf = !1, pg(this.data, this.toBBox);
	}
	_chooseSplitIndex(e, t, n) {
		let r, i = Infinity, a = Infinity;
		for (let o = t; o <= n - t; o++) {
			let t = mg(e, 0, o, this.toBBox), s = mg(e, o, n, this.toBBox), c = xg(t, s), l = vg(t) + vg(s);
			c < i ? (i = c, r = o, a = l < a ? l : a) : c === i && l < a && (a = l, r = o);
		}
		return r || n - t;
	}
	_chooseSplitAxis(e, t, n) {
		let r = e.leaf ? this.compareMinX : gg, i = e.leaf ? this.compareMinY : _g;
		this._allDistMargin(e, t, n, r) < this._allDistMargin(e, t, n, i) && e.children.sort(r);
	}
	_allDistMargin(e, t, n, r) {
		e.children.sort(r);
		let i = this.toBBox, a = mg(e, 0, t, i), o = mg(e, n - t, n, i), s = yg(a) + yg(o);
		for (let r = t; r < n - t; r++) {
			let t = e.children[r];
			hg(a, e.leaf ? i(t) : t), s += yg(a);
		}
		for (let r = n - t - 1; r >= t; r--) {
			let t = e.children[r];
			hg(o, e.leaf ? i(t) : t), s += yg(o);
		}
		return s;
	}
	_adjustParentBBoxes(e, t, n) {
		for (let r = n; r >= 0; r--) hg(t[r], e);
	}
	_condense(e) {
		for (let t = e.length - 1, n; t >= 0; t--) e[t].children.length === 0 ? t > 0 ? (n = e[t - 1].children, n.splice(n.indexOf(e[t]), 1)) : this.clear() : pg(e[t], this.toBBox);
	}
};
function fg(e, t, n) {
	if (!n) return t.indexOf(e);
	for (let r = 0; r < t.length; r++) if (n(e, t[r])) return r;
	return -1;
}
function pg(e, t) {
	mg(e, 0, e.children.length, t, e);
}
function mg(e, t, n, r, i) {
	i ||= wg(null), i.minX = Infinity, i.minY = Infinity, i.maxX = -Infinity, i.maxY = -Infinity;
	for (let a = t; a < n; a++) {
		let t = e.children[a];
		hg(i, e.leaf ? r(t) : t);
	}
	return i;
}
function hg(e, t) {
	return e.minX = Math.min(e.minX, t.minX), e.minY = Math.min(e.minY, t.minY), e.maxX = Math.max(e.maxX, t.maxX), e.maxY = Math.max(e.maxY, t.maxY), e;
}
function gg(e, t) {
	return e.minX - t.minX;
}
function _g(e, t) {
	return e.minY - t.minY;
}
function vg(e) {
	return (e.maxX - e.minX) * (e.maxY - e.minY);
}
function yg(e) {
	return e.maxX - e.minX + (e.maxY - e.minY);
}
function bg(e, t) {
	return (Math.max(t.maxX, e.maxX) - Math.min(t.minX, e.minX)) * (Math.max(t.maxY, e.maxY) - Math.min(t.minY, e.minY));
}
function xg(e, t) {
	let n = Math.max(e.minX, t.minX), r = Math.max(e.minY, t.minY), i = Math.min(e.maxX, t.maxX), a = Math.min(e.maxY, t.maxY);
	return Math.max(0, i - n) * Math.max(0, a - r);
}
function Sg(e, t) {
	return e.minX <= t.minX && e.minY <= t.minY && t.maxX <= e.maxX && t.maxY <= e.maxY;
}
function Cg(e, t) {
	return t.minX <= e.maxX && t.minY <= e.maxY && t.maxX >= e.minX && t.maxY >= e.minY;
}
function wg(e) {
	return {
		children: e,
		height: 1,
		leaf: !0,
		minX: Infinity,
		minY: Infinity,
		maxX: -Infinity,
		maxY: -Infinity
	};
}
function Tg(e, t, n, r, i) {
	let a = [t, n];
	for (; a.length;) {
		if (n = a.pop(), t = a.pop(), n - t <= r) continue;
		let o = t + Math.ceil((n - t) / r / 2) * r;
		cg(e, o, t, n, i), a.push(t, o, o, n);
	}
}
//#endregion
//#region node_modules/point-in-polygon-hao/dist/esm/index.js
function Eg(e, t) {
	var n, r, i = 0, a, o, s, l, u, d, f, p = e[0], m = e[1], h = t.length;
	for (n = 0; n < h; n++) {
		r = 0;
		var g = t[n], _ = g.length - 1;
		if (d = g[0], d[0] !== g[_][0] && d[1] !== g[_][1]) throw Error("First and last coordinates in a ring must be the same");
		for (o = d[0] - p, s = d[1] - m; r < _; r++) {
			if (f = g[r + 1], l = f[0] - p, u = f[1] - m, s === 0 && u === 0) {
				if (l <= 0 && o >= 0 || o <= 0 && l >= 0) return 0;
			} else if (u >= 0 && s <= 0 || u <= 0 && s >= 0) {
				if (a = c(o, l, s, u, 0, 0), a === 0) return 0;
				(a > 0 && u > 0 && s <= 0 || a < 0 && u <= 0 && s > 0) && i++;
			}
			d = f, s = u, o = l;
		}
	}
	return i % 2 != 0;
}
//#endregion
//#region node_modules/@allmaps/render/dist/maps/RTree.js
var Dg = !0, Og = class {
	rbush = new dg();
	polygonsById = /* @__PURE__ */ new Map();
	bboxesById = /* @__PURE__ */ new Map();
	itemsById = /* @__PURE__ */ new Map();
	addItem(e, t) {
		this.removeItem(e);
		let n = j(t), r = {
			minX: n[0],
			minY: n[1],
			maxX: n[2],
			maxY: n[3],
			id: e
		};
		this.polygonsById.set(e, t), this.bboxesById.set(e, n), this.itemsById.set(e, r), this.rbush.insert(r);
	}
	removeItem(e) {
		let t = this.itemsById.get(e);
		t && (this.rbush.remove(t), this.polygonsById.delete(e), this.bboxesById.delete(e), this.itemsById.delete(e));
	}
	clear() {
		this.polygonsById.clear(), this.bboxesById.clear(), this.itemsById.clear(), this.rbush.clear();
	}
	search(e, t, n, r) {
		return this.rbush.search({
			minX: e,
			minY: t,
			maxX: n,
			maxY: r
		});
	}
	getBbox(e) {
		return this.bboxesById.get(e);
	}
	getPolygon(e) {
		return this.polygonsById.get(e);
	}
	searchFromBbox(e) {
		let [t, n, r, i] = e;
		return this.search(t, n, r, i).map((e) => e.id);
	}
	searchFromPoint(e, t = Dg) {
		let [n, r, i, a] = [
			e[0],
			e[1],
			e[0],
			e[1]
		], o = this.search(n, r, i, a);
		return t ? o.filter((t) => {
			let n = this.polygonsById.get(t.id);
			return n ? Eg(e, Vo(n)) : !1;
		}).map((e) => e.id) : o.map((e) => e.id);
	}
}, kg = "#222222", Ag = "#ffffff", jg = "inherit", Mg = "currentColor", Ng = "transparent", Pg = [
	"#dff7fa",
	"#c0eff5",
	"#a1e7f0",
	"#82dfeb",
	"#63d8e6",
	"#4facb8",
	"#3b818a",
	"#27565c",
	"#132b2d"
], Fg = [
	"#d7d9ee",
	"#b0b4de",
	"#898ecd",
	"#6269bd",
	"#3b44ad",
	"#2f368a",
	"#232867",
	"#171b45",
	"#0b0d22"
], Ig = [
	"#f3dcf0",
	"#e7b9e1",
	"#dc97d2",
	"#d074c3",
	"#c552b5",
	"#9d4190",
	"#76316c",
	"#4e2048",
	"#271024"
], Lg = [
	"#ffddf1",
	"#ffbbe3",
	"#ff99d5",
	"#ff77c7",
	"#ff56ba",
	"#cc4494",
	"#99336f",
	"#66224a",
	"#321125"
], Rg = [
	"#ffe3d0",
	"#ffc7a1",
	"#ffab72",
	"#ff8f43",
	"#ff7415",
	"#cc5c10",
	"#99450c",
	"#662e08",
	"#321704"
], zg = [
	"#fededf",
	"#febebf",
	"#fe9e9f",
	"#fe7e7f",
	"#fe5e60",
	"#cb4b4c",
	"#983839",
	"#652526",
	"#321213"
], Bg = [
	"#e0f2e8",
	"#c1e6d2",
	"#a2d9bb",
	"#83cda5",
	"#64c18f",
	"#509a72",
	"#3c7355",
	"#284d39",
	"#13261c"
], Vg = [
	"#fff3d9",
	"#ffe8b3",
	"#ffdd8d",
	"#ffd267",
	"#ffc742",
	"#cc9f34",
	"#997727",
	"#664f1a",
	"#32270d"
], Hg = [
	"#efefef",
	"#e0e0e0",
	"#d0d0d0",
	"#c1c1c1",
	"#b2b2b2",
	"#8e8e8e",
	"#6a6a6a",
	"#474747",
	"#232323"
], Ug = {
	blue: Pg,
	darkblue: Fg,
	purple: Ig,
	pink: Lg,
	orange: Rg,
	red: zg,
	green: Bg,
	yellow: Vg,
	gray: Hg
}, Wg = Pg[4], Gg = Fg[4], Kg = Ig[4], qg = Lg[4], Jg = Rg[4], Yg = zg[4], Xg = Bg[4], Zg = Vg[4], Qg = Hg[4];
//#endregion
//#region node_modules/@allmaps/tailwind/dist/theme-colors.js
function $g(e, t) {
	return t.reduce((t, n, r) => {
		let i = `${e}-${(r + 1) * 100}`;
		return t[i] = n, t;
	}, {});
}
({
	blue: Wg,
	darkblue: Gg,
	purple: Kg,
	pink: qg,
	orange: Jg,
	red: Yg,
	green: Xg,
	yellow: Zg,
	gray: Qg,
	black: kg,
	white: Ag,
	inherit: jg,
	current: Mg,
	transparent: Ng,
	...$g("blue", Ug.blue),
	...$g("darkblue", Ug.darkblue),
	...$g("purple", Ug.purple),
	...$g("pink", Ug.pink),
	...$g("orange", Ug.orange),
	...$g("red", Ug.red),
	...$g("green", Ug.green),
	...$g("yellow", Ug.yellow),
	...$g("gray", Ug.gray)
}).black;
//#endregion
//#region node_modules/@allmaps/triangulate/dist/shared.js
function e_(e, t) {
	let n = gs(...e), r = Math.ceil(n / t) - 1, i = ms(e), a = e[0], o = [a];
	for (let e = 1; e <= r; e++) a = hs(a, t, i), o.push(a);
	return o;
}
function t_(e, t) {
	e = zo(e);
	let n = [];
	for (let r = 0; r < e.length - 1; r++) n = n.concat(e_([e[r], e[r + 1]], t));
	return n;
}
function n_(e, t) {
	return e.map((e) => t_(e, t));
}
function r_(e, t) {
	let n = [];
	for (let r = e[0] + t, i = 0; r <= e[2]; i++, r += t) for (let i = e[1] + t, a = 0; i <= e[3]; a++, i += t) n.push([r, i]);
	return n;
}
function i_(e, t) {
	try {
		return Eg(e, Vo(t)) === !0;
	} catch (e) {
		return console.error("Error determining if point is inside polygon:", e), !1;
	}
}
//#endregion
//#region node_modules/@kninnug/constrainautor/lib/Constrainautor.mjs
var a_ = class {
	constructor(e, t) {
		this.W = e, this.bs = t;
	}
	add(e) {
		let t = this.W, n = e / t | 0, r = e % t;
		return this.bs[n] |= 1 << r, this;
	}
	delete(e) {
		let t = this.W, n = e / t | 0, r = e % t;
		return this.bs[n] &= ~(1 << r), this;
	}
	set(e, t) {
		let n = this.W, r = e / n | 0, i = 1 << e % n;
		return this.bs[r] ^= (-t ^ this.bs[r]) & i, t;
	}
	has(e) {
		let t = this.W, n = e / t | 0, r = e % t;
		return !!(this.bs[n] & 1 << r);
	}
	forEach(e) {
		let t = this.W, n = this.bs, r = n.length;
		for (let i = 0; i < r; i++) {
			let r = 0;
			for (; n[i] && r < t;) n[i] & 1 << r && e(i * t + r), r++;
		}
		return this;
	}
}, o_ = class extends a_ {
	constructor(e) {
		let t = new Uint8Array(Math.ceil(e / 8)).fill(0);
		super(8, t);
	}
};
function s_(e) {
	return e % 3 == 2 ? e - 2 : e + 1;
}
function c_(e) {
	return e % 3 == 0 ? e + 2 : e - 1;
}
var l_ = class {
	constructor(e, t) {
		if (!e || typeof e != "object" || !e.triangles || !e.halfedges || !e.coords) throw Error("Expected an object with Delaunator output");
		if (e.triangles.length % 3 || e.halfedges.length !== e.triangles.length || e.coords.length % 2) throw Error("Delaunator output appears inconsistent");
		if (e.triangles.length < 3) throw Error("No edges in triangulation");
		this.del = e;
		let n = 2 ** 32 - 1, r = e.coords.length >> 1, i = e.triangles.length;
		this.vertMap = new Uint32Array(r).fill(n), this.flips = new o_(i), this.consd = new o_(i);
		for (let t = 0; t < i; t++) {
			let r = e.triangles[t];
			this.vertMap[r] === n && this.updateVert(t);
		}
		t && this.constrainAll(t);
	}
	constrainOne(e, t) {
		let { triangles: n, halfedges: r } = this.del, i = this.vertMap, a = this.consd, o = i[e], s = o;
		do {
			let i = n[s], a = s_(s);
			if (i === t) return this.protect(s);
			let o = c_(s), c = n[o];
			if (c === t) return this.protect(a), a;
			if (this.intersectSegments(e, t, c, i)) {
				s = o;
				break;
			}
			s = r[a];
		} while (s !== -1 && s !== o);
		let c = s, l = -1;
		for (; s !== -1;) {
			let i = r[s], o = c_(s), u = c_(i), d = s_(i);
			if (i === -1) throw Error("Constraining edge exited the hull");
			if (a.has(s)) throw Error("Edge intersects already constrained edge");
			if (this.isCollinear(e, t, n[s]) || this.isCollinear(e, t, n[i])) throw Error("Constraining edge intersects point");
			if (!this.intersectSegments(n[s], n[i], n[o], n[u])) {
				if (l === -1 && (l = s), n[u] === t) {
					if (s === l) throw Error("Infinite loop: non-convex quadrilateral");
					s = l, l = -1;
					continue;
				}
				if (this.intersectSegments(e, t, n[u], n[i])) s = u;
				else if (this.intersectSegments(e, t, n[d], n[u])) s = d;
				else if (l === s) throw Error("Infinite loop: no further intersect after non-convex");
				continue;
			}
			if (this.flipDiagonal(s), this.intersectSegments(e, t, n[o], n[u]) && (l === -1 && (l = o), l === o)) throw Error("Infinite loop: flipped diagonal still intersects");
			n[u] === t ? (c = u, s = l, l = -1) : this.intersectSegments(e, t, n[d], n[u]) && (s = d);
		}
		let u = this.flips;
		this.protect(c);
		do {
			var d = 0;
			u.forEach((e) => {
				u.delete(e);
				let t = r[e];
				t !== -1 && (u.delete(t), this.isDelaunay(e) || (this.flipDiagonal(e), d++));
			});
		} while (d > 0);
		return this.findEdge(e, t);
	}
	delaunify(e = !1) {
		let t = this.del.halfedges, n = this.flips, r = this.consd, i = t.length;
		do {
			var a = 0;
			for (let e = 0; e < i; e++) {
				if (r.has(e)) continue;
				n.delete(e);
				let i = t[e];
				i !== -1 && (n.delete(i), this.isDelaunay(e) || (this.flipDiagonal(e), a++));
			}
		} while (e && a > 0);
		return this;
	}
	constrainAll(e) {
		let t = e.length;
		for (let n = 0; n < t; n++) {
			let t = e[n];
			this.constrainOne(t[0], t[1]);
		}
		return this;
	}
	isConstrained(e) {
		return this.consd.has(e);
	}
	findEdge(e, t) {
		let n = this.vertMap[t], { triangles: r, halfedges: i } = this.del, a = n, o = -1;
		do {
			if (r[a] === e) return a;
			o = s_(a), a = i[o];
		} while (a !== -1 && a !== n);
		return r[s_(o)] === e ? -o : Infinity;
	}
	protect(e) {
		let t = this.del.halfedges[e], n = this.flips, r = this.consd;
		return n.delete(e), r.add(e), t === -1 ? -e : (n.delete(t), r.add(t), t);
	}
	markFlip(e) {
		let t = this.del.halfedges, n = this.flips;
		if (this.consd.has(e)) return !1;
		let r = t[e];
		return r !== -1 && (n.add(e), n.add(r)), !0;
	}
	flipDiagonal(e) {
		let { triangles: t, halfedges: n } = this.del, r = this.flips, i = this.consd, a = n[e], o = c_(e), s = s_(e), c = c_(a), l = s_(a), u = n[o], d = n[c];
		if (i.has(e)) throw Error("Trying to flip a constrained edge");
		return t[e] = t[c], n[e] = d, r.set(e, r.has(c)) || i.set(e, i.has(c)), d !== -1 && (n[d] = e), n[o] = c, t[a] = t[o], n[a] = u, r.set(a, r.has(o)) || i.set(a, i.has(o)), u !== -1 && (n[u] = a), n[c] = o, this.markFlip(e), this.markFlip(s), this.markFlip(a), this.markFlip(l), r.add(o), i.delete(o), r.add(c), i.delete(c), this.updateVert(e), this.updateVert(s), this.updateVert(a), this.updateVert(l), o;
	}
	isDelaunay(e) {
		let { triangles: t, halfedges: n } = this.del, r = n[e];
		if (r === -1) return !0;
		let i = t[c_(e)], a = t[e], o = t[s_(e)], s = t[c_(r)];
		return !this.inCircle(i, a, o, s);
	}
	updateVert(e) {
		let { triangles: t, halfedges: n } = this.del, r = this.vertMap, i = t[e], a = c_(e), o = n[a];
		for (; o !== -1 && o !== e;) a = c_(o), o = n[a];
		return r[i] = a, a;
	}
	intersectSegments(e, t, n, r) {
		let i = this.del.coords;
		return e === n || e === r || t === n || t === r ? !1 : u_(i[e * 2], i[e * 2 + 1], i[t * 2], i[t * 2 + 1], i[n * 2], i[n * 2 + 1], i[r * 2], i[r * 2 + 1]);
	}
	inCircle(e, t, n, r) {
		let i = this.del.coords;
		return s(i[e * 2], i[e * 2 + 1], i[t * 2], i[t * 2 + 1], i[n * 2], i[n * 2 + 1], i[r * 2], i[r * 2 + 1]) < 0;
	}
	isCollinear(e, t, n) {
		let r = this.del.coords;
		return c(r[e * 2], r[e * 2 + 1], r[t * 2], r[t * 2 + 1], r[n * 2], r[n * 2 + 1]) === 0;
	}
};
l_.intersectSegments = u_;
function u_(e, t, n, r, i, a, o, s) {
	let l = c(e, t, i, a, o, s), u = c(n, r, i, a, o, s);
	if (l > 0 && u > 0 || l < 0 && u < 0) return !1;
	let d = c(i, a, e, t, n, r), f = c(o, s, e, t, n, r);
	return d > 0 && f > 0 || d < 0 && f < 0 ? !1 : l === 0 && u === 0 && d === 0 && f === 0 ? !(Math.max(i, o) < Math.min(e, n) || Math.max(e, n) < Math.min(i, o) || Math.max(a, s) < Math.min(t, r) || Math.max(t, r) < Math.min(a, s)) : !0;
}
//#endregion
//#region node_modules/@allmaps/triangulate/dist/index.js
var d_ = {
	steinerPoints: [],
	minimumTriangleAngle: 1e-4
};
function f_(e, t, n) {
	let r = M(d_, n), i = r.steinerPoints, a = r.minimumTriangleAngle;
	e = Go(e);
	let o = [], s = [], c = [], u = [];
	t ? (o = n_(e, t), s = o.flat(), c = r_(j(e), t), u = c.filter((t) => i_(t, e))) : (o = e, s = e.flat());
	let d = i.filter((t) => i_(t, e)), f = [
		...s,
		...u,
		...d
	], p = new l(f.flat()), m = 0, h = o.map((e) => {
		let t = e.map((e, t) => m + t);
		return m += e.length, t;
	}), g = h.map((e) => e.map((t) => [t, (t + 1) % e.length])).flat(), _ = new l_(p);
	_.delaunify(!0), _.constrainAll(g);
	let v = [], y = [], b = [];
	for (let e = 0; e < _.del.triangles.length; e += 3) v.push([
		_.del.triangles[e],
		_.del.triangles[e + 1],
		_.del.triangles[e + 2]
	]), y.push([
		f[_.del.triangles[e]],
		f[_.del.triangles[e + 1]],
		f[_.del.triangles[e + 2]]
	]), b.push(_.del.triangles[e] < s.length || _.del.triangles[e + 1] < s.length || _.del.triangles[e + 2] < s.length);
	let x = y.map((t, n) => b[n] ? i_(ps(...t), e) && Ts(t).every((e) => e >= a) : !0);
	v = v.filter((e, t) => x[t]), y = y.filter((e, t) => x[t]);
	let S = [];
	for (let e = 0; e < g.length; e += 1) S.push([f[g[e][0]], f[g[e][1]]]);
	return {
		interpolatedPolygon: o,
		interpolatedPolygonPoints: s,
		gridPoints: c,
		gridPointsInPolygon: u,
		uniquePoints: f,
		triangles: y,
		uniquePointIndexTriangles: v,
		uniquePointIndexInterpolatedPolygon: h,
		uniquePointIndexEdges: g
	};
}
//#endregion
//#region node_modules/@allmaps/render/dist/shared/homogeneous-transform.js
function p_(e, t) {
	let n = t[0], r = t[1];
	return [e[0] * n + e[2] * r + e[4], e[1] * n + e[3] * r + e[5]];
}
function m_() {
	return [
		1,
		0,
		0,
		1,
		0,
		0
	];
}
function h_(e, t) {
	let n = e[0], r = e[1], i = e[2], a = e[3], o = e[4], s = e[5], c = t[0], l = t[1], u = t[2], d = t[3], f = t[4], p = t[5];
	return [
		n * c + i * l,
		r * c + a * l,
		n * u + i * d,
		r * u + a * d,
		n * f + i * p + o,
		r * f + a * p + s
	];
}
function g_(e, t, n, r, i, a, o) {
	let s = Math.sin(i), c = Math.cos(i);
	return [
		n * c,
		r * s,
		-n * s,
		r * c,
		a * n * c - o * n * s + e,
		a * r * s + o * r * c + t
	];
}
function __(e) {
	let t = v_(e), n = e[0], r = e[1], i = e[2], a = e[3], o = e[4], s = e[5];
	return [
		a / t,
		-r / t,
		-i / t,
		n / t,
		(i * s - a * o) / t,
		-(n * s - r * o) / t
	];
}
function v_(e) {
	return e[0] * e[3] - e[1] * e[2];
}
function y_(e) {
	let t = [
		1,
		0,
		0,
		0,
		0,
		1,
		0,
		0,
		0,
		0,
		1,
		0,
		0,
		0,
		0,
		1
	];
	return t[0] = e[0], t[1] = e[1], t[4] = e[2], t[5] = e[3], t[12] = e[4], t[13] = e[5], t;
}
//#endregion
//#region node_modules/@allmaps/render/dist/maps/WarpedMap.js
var b_ = {
	gcps: [],
	resourceMask: [],
	transformationType: "polynomial",
	internalProjection: Gu,
	projection: Gu,
	visible: !0,
	applyMask: !0,
	distortionMeasure: void 0
}, x_ = {
	minOffsetRatio: .01,
	maxDepth: 5,
	differentHandedness: !0
}, S_ = {
	...b_,
	...x_
}, C_ = class e extends EventTarget {
	mapId;
	georeferencedMap;
	defaultOptions;
	georeferencedMapOptions;
	listOptions;
	mapOptions;
	options;
	fetchingImageInfo;
	image;
	tileSize;
	abortController;
	mixed = !1;
	gcps;
	projectedGcps;
	resourcePoints;
	geoPoints;
	projectedGeoPoints;
	projectedGeoPreviousTransformedResourcePoints;
	projectedGeoTransformedResourcePoints;
	resourceFullMask;
	resourceFullMaskBbox;
	resourceFullMaskRectangle;
	resourceAppliableMask;
	resourceAppliableMaskBbox;
	resourceAppliableMaskRectangle;
	resourceMask;
	resourceMaskBbox;
	resourceMaskRectangle;
	previousTransformationType;
	transformationType;
	previousInternalProjection;
	internalProjection;
	projection;
	projectedPreviousTransformer;
	projectedTransformer;
	projectedTransformerCache;
	projectedTransformerDoubleCache;
	geoFullMask;
	geoFullMaskBbox;
	geoFullMaskRectangle;
	geoAppliableMask;
	geoAppliableMaskBbox;
	geoAppliableMaskRectangle;
	geoMask;
	geoMaskBbox;
	geoMaskRectangle;
	projectedGeoFullMask;
	projectedGeoFullMaskBbox;
	projectedGeoFullMaskRectangle;
	projectedGeoAppliableMask;
	projectedGeoAppliableMaskBbox;
	projectedGeoAppliableMaskRectangle;
	projectedGeoMask;
	projectedGeoMaskBbox;
	projectedGeoMaskRectangle;
	resourceToProjectedGeoScale;
	previousDistortionMeasure;
	distortionMeasure;
	tileZoomLevelForViewport;
	overviewTileZoomLevelForViewport;
	projectedGeoBufferedViewportRectangleForViewport;
	projectedGeoBufferedViewportRectangleBboxForViewport;
	resourceBufferedViewportRingForViewport;
	resourceBufferedViewportRingBboxForViewport;
	resourceBufferedViewportRingBboxAndResourceMaskBboxIntersectionForViewport;
	fetchableTilesForViewport = [];
	overviewFetchableTilesForViewport = [];
	constructor(e, t, n = {}, r = {}) {
		super(), this.mapId = e, this.georeferencedMap = t, this.projectedTransformerCache = /* @__PURE__ */ new Map(), this.projectedTransformerDoubleCache = /* @__PURE__ */ new Map(), this.fetchingImageInfo = !1, this.mapOptions = r, this.listOptions = n, this.georeferencedMapOptions = {
			transformationType: t.transformation?.type,
			internalProjection: t.resourceCrs,
			gcps: t.gcps,
			resourceMask: t.resourceMask
		}, this.setDefaultOptions(), this.applyOptions({ init: !0 });
	}
	static getDefaultOptions() {
		return b_;
	}
	getDefaultAndGeoreferencedMapOptions() {
		return Xc(this.defaultOptions, this.georeferencedMapOptions);
	}
	getResourceToViewportScale(e) {
		return Cc(this.resourceMaskRectangle, this.projectedGeoMaskRectangle.map((t) => p_(e.projectedGeoToViewportHomogeneousTransform, t)));
	}
	getResourceToCanvasScale(e) {
		return this.getResourceToViewportScale(e) / e.devicePixelRatio;
	}
	getReferenceScale() {
		return this.getProjectedTransformer("helmert").getToGeoTransformation().getMeasures().scale;
	}
	getProjectedTransformer(e, t) {
		let n = Xc(S_, {
			projection: this.projection,
			internalProjection: this.internalProjection
		}, t);
		return Tc(this.projectedTransformerDoubleCache, e, this.projection.definition, () => {
			let t = wc(this.projectedTransformerCache, e, () => new Zu(this.gcps, e, Vc(n, ["projection"])));
			return Zu.setProjection(Ni(t), n.projection);
		});
	}
	setMapOptions(e, t, n) {
		let r = [];
		return e !== void 0 && Object.keys(e).length > 0 && (this.mapOptions = M(this.mapOptions, e), r.push(...Object.keys(e))), t !== void 0 && Object.keys(t).length > 0 && (this.listOptions = M(this.listOptions, t), r.push(...Object.keys(t))), this.applyOptions(N(n, { optionKeysPossiblyChanged: r }));
	}
	setListOptions(e, t) {
		return this.setMapOptions(void 0, e, t);
	}
	setDefaultOptions() {
		this.defaultOptions = e.getDefaultOptions();
	}
	applyOptions(e) {
		let t = Xc(this.defaultOptions, this.georeferencedMapOptions, this.listOptions, this.mapOptions), n = e?.optionKeysPossiblyChanged?.filter((t) => e.optionKeysToOmit ? !e.optionKeysToOmit.includes(t) : !0), r = Bc(t, this.options, n);
		if (this.options = Zc(this.options, r), e?.init) this.gcps = this.options.gcps, this.resourceFullMask = this.getResourceFullMask(), this.resourceAppliableMask = this.georeferencedMap.resourceMask, this.resourceMask = this.options.applyMask ? this.resourceAppliableMask : this.resourceFullMask, this.updateResourceMaskProperties(), this.transformationType = this.options.transformationType, this.previousTransformationType = this.transformationType, this.internalProjection = this.options.internalProjection, this.previousInternalProjection = this.internalProjection, this.projection = this.options.projection, this.updateProjectedTransformerProperties();
		else {
			if ("gcps" in r && this.setGcps(this.options.gcps), "resourceMask" in r || "applyMask" in r) {
				let e = this.getResourceFullMask(), t = this.options.resourceMask, n = this.options.applyMask ? t : e;
				this.setResourceMask(e, t, n);
			}
			"transformationType" in r && this.setTransformationType(this.options.transformationType), "internalProjection" in r && this.setInternalProjection(this.options.internalProjection), "projection" in r && this.setProjection(this.options.projection), "distortionMeasure" in r && this.setDistortionMeasure(this.options.distortionMeasure);
		}
		return r;
	}
	shouldRenderMap() {
		return this.options.visible !== !1;
	}
	shouldRenderLines() {
		return this.options.visible !== !1;
	}
	shouldRenderPoints() {
		return this.options.visible !== !1;
	}
	setGcps(e) {
		this.gcps = e, this.clearProjectedTransformerCaches(), this.updateProjectedTransformerProperties();
	}
	setResourceMask(e, t, n) {
		this.resourceFullMask = e, this.resourceAppliableMask = t, this.resourceMask = n, this.updateResourceMaskProperties(), this.updateGeoMaskProperties(), this.updateProjectedGeoMaskProperties();
	}
	setTransformationType(e) {
		this.transformationType = e, this.previousTransformationType ||= this.transformationType, this.updateProjectedTransformerProperties();
	}
	setDistortionMeasure(e) {
		this.distortionMeasure = e;
	}
	setInternalProjection(e) {
		this.internalProjection = e || S_.internalProjection || Gu, this.previousInternalProjection ||= this.internalProjection, this.clearProjectedTransformerCaches(), this.updateProjectedTransformerProperties();
	}
	setProjection(e) {
		this.projection = e || S_.projection || Gu, this.updateProjectedTransformerProperties();
	}
	setTileZoomLevelForViewport(e) {
		this.tileZoomLevelForViewport = e;
	}
	setOverviewTileZoomLevelForViewport(e) {
		this.overviewTileZoomLevelForViewport = e;
	}
	setProjectedGeoBufferedViewportRectangleForViewport(e) {
		this.projectedGeoBufferedViewportRectangleForViewport = e, this.projectedGeoBufferedViewportRectangleBboxForViewport = e ? j(e) : void 0;
	}
	setResourceBufferedViewportRingForViewport(e) {
		this.resourceBufferedViewportRingForViewport = e, this.resourceBufferedViewportRingBboxForViewport = e ? j(e) : void 0;
	}
	setResourceBufferedViewportRingBboxAndResourceMaskBboxIntersectionForViewport(e) {
		this.resourceBufferedViewportRingBboxAndResourceMaskBboxIntersectionForViewport = e;
	}
	setFetchableTilesForViewport(e) {
		this.fetchableTilesForViewport = e;
	}
	setOverviewFetchableTilesForViewport(e) {
		this.overviewFetchableTilesForViewport = e;
	}
	resetForViewport() {
		this.setTileZoomLevelForViewport(), this.setOverviewTileZoomLevelForViewport(), this.setProjectedGeoBufferedViewportRectangleForViewport(), this.setResourceBufferedViewportRingForViewport(), this.setFetchableTilesForViewport([]), this.setOverviewFetchableTilesForViewport([]);
	}
	resetPrevious() {
		this.mixed = !1, this.previousTransformationType = this.transformationType, this.previousDistortionMeasure = this.distortionMeasure, this.previousInternalProjection = this.internalProjection, this.projectedPreviousTransformer = Ni(this.projectedTransformer), this.projectedGeoPreviousTransformedResourcePoints = this.projectedGeoTransformedResourcePoints;
	}
	mixPreviousAndNew(e) {
		this.mixed = !0, this.previousTransformationType = this.transformationType, this.previousDistortionMeasure = this.distortionMeasure, this.previousInternalProjection = this.internalProjection, this.projectedPreviousTransformer = Ni(this.projectedTransformer), this.projectedGeoPreviousTransformedResourcePoints = fs(this.projectedGeoTransformedResourcePoints, this.projectedGeoPreviousTransformedResourcePoints, e);
	}
	hasImage() {
		return this.image !== void 0;
	}
	async loadImage(e) {
		try {
			let t = this.georeferencedMap.resource.id;
			if (e && e.has(t)) this.image = e.get(t);
			else {
				this.fetchingImageInfo = !0, this.abortController = new AbortController();
				let n = this.abortController.signal, r = await to(t, { signal: n }, this.options.fetchFn);
				this.abortController = void 0, this.image = Zh.parse(r), e && e.set(t, this.image);
			}
			this.tileSize = [Math.max(...this.image.tileZoomLevels.map((e) => e.width)), Math.max(...this.image.tileZoomLevels.map((e) => e.height))], this.dispatchEvent(new I(F.IMAGELOADED));
		} catch (e) {
			throw this.fetchingImageInfo = !1, e;
		} finally {
			this.fetchingImageInfo = !1;
		}
	}
	updateResourceMaskProperties() {
		this.resourceFullMaskBbox = j(this.resourceFullMask), this.resourceFullMaskRectangle = fc(this.resourceFullMaskBbox), this.resourceAppliableMaskBbox = j(this.resourceAppliableMask), this.resourceAppliableMaskRectangle = fc(this.resourceAppliableMaskBbox), this.resourceMaskBbox = j(this.resourceMask), this.resourceMaskRectangle = fc(this.resourceMaskBbox);
	}
	getResourceFullMask() {
		let e = this.georeferencedMap.resource.width, t = this.georeferencedMap.resource.height;
		return e && t ? Sc([e, t]) : fc(this.resourceMaskBbox);
	}
	updateGeoMaskProperties() {
		this.updateFullGeoMask(), this.updateAppliableGeoMask(), this.updateGeoMask();
	}
	updateProjectedGeoMaskProperties() {
		this.updateProjectedFullGeoMask(), this.updateProjectedAppliableGeoMask(), this.updateProjectedGeoMask(), this.updateResourceToProjectedGeoScale();
	}
	updateProjectedTransformerProperties() {
		this.updateProjectedTransformer(), this.updateGeoMaskProperties(), this.updateProjectedGeoMaskProperties(), this.updateGcpsProperties();
	}
	updateProjectedTransformer() {
		this.projectedTransformer = this.getProjectedTransformer(this.transformationType), this.projectedPreviousTransformer ||= this.projectedTransformer;
	}
	updateFullGeoMask() {
		this.geoFullMask = this.projectedTransformer.transformToGeo([this.resourceFullMask], { projection: Wu })[0], this.geoFullMaskBbox = j(this.geoFullMask), this.geoFullMaskRectangle = this.projectedTransformer.transformToGeo([this.resourceFullMaskRectangle], {
			maxDepth: 0,
			projection: Wu
		})[0];
	}
	updateAppliableGeoMask() {
		this.geoAppliableMask = this.projectedTransformer.transformToGeo([this.resourceAppliableMask], { projection: Wu })[0], this.geoAppliableMaskBbox = j(this.geoAppliableMask), this.geoAppliableMaskRectangle = this.projectedTransformer.transformToGeo([this.resourceAppliableMaskRectangle], {
			maxDepth: 0,
			projection: Wu
		})[0];
	}
	updateGeoMask() {
		this.geoMask = this.projectedTransformer.transformToGeo([this.resourceMask], { projection: Wu })[0], this.geoMaskBbox = j(this.geoMask), this.geoMaskRectangle = this.projectedTransformer.transformToGeo([this.resourceMaskRectangle], {
			maxDepth: 0,
			projection: Wu
		})[0];
	}
	updateProjectedFullGeoMask() {
		this.projectedGeoFullMask = this.projectedTransformer.transformToGeo([this.resourceFullMask])[0], this.projectedGeoFullMaskBbox = j(this.projectedGeoFullMask), this.projectedGeoFullMaskRectangle = this.projectedTransformer.transformToGeo([this.resourceFullMaskRectangle], { maxDepth: 0 })[0];
	}
	updateProjectedAppliableGeoMask() {
		this.projectedGeoAppliableMask = this.projectedTransformer.transformToGeo([this.resourceAppliableMask])[0], this.projectedGeoAppliableMaskBbox = j(this.projectedGeoAppliableMask), this.projectedGeoAppliableMaskRectangle = this.projectedTransformer.transformToGeo([this.resourceAppliableMaskRectangle], { maxDepth: 0 })[0];
	}
	updateProjectedGeoMask() {
		this.projectedGeoMask = this.projectedTransformer.transformToGeo([this.resourceMask])[0], this.projectedGeoMaskBbox = j(this.projectedGeoMask), this.projectedGeoMaskRectangle = this.projectedTransformer.transformToGeo([this.resourceMaskRectangle], { maxDepth: 0 })[0];
	}
	updateResourceToProjectedGeoScale() {
		this.resourceToProjectedGeoScale = Cc(this.resourceMaskRectangle, this.projectedGeoMaskRectangle);
	}
	updateGcpsProperties() {
		this.projectedGcps = this.gcps.map(({ resource: e, geo: t }) => ({
			resource: e,
			geo: this.projectedTransformer.lonLatToProjection(t)
		})), this.resourcePoints = this.gcps.map((e) => e.resource), this.geoPoints = this.gcps.map((e) => e.geo), this.projectedGeoPoints = this.projectedGcps.map((e) => e.geo), this.projectedGeoTransformedResourcePoints = this.gcps.map((e) => this.projectedTransformer.transformToGeo(e.resource)), this.projectedGeoPreviousTransformedResourcePoints ||= this.projectedGeoTransformedResourcePoints;
	}
	clearProjectedTransformerCaches() {
		this.projectedTransformerCache = /* @__PURE__ */ new Map(), this.projectedTransformerDoubleCache = /* @__PURE__ */ new Map();
	}
	destroy() {
		this.abortController && this.abortController.abort();
	}
}, w_ = { distortionMeasures: ["log2sigma", "twoOmega"] }, T_ = class e extends C_ {
	previousResourceResolution;
	resourceResolution;
	triangulateErrorCount = 0;
	projectedGcpPreviousTriangulation;
	projectedGcpTriangulation;
	resourceTriangulationCache;
	projectedGcpTriangulationCache;
	resourceTrianglePoints = [];
	projectedGeoPreviousTrianglePoints = [];
	projectedGeoTrianglePoints = [];
	previousTrianglePointsDistortion = [];
	trianglePointsDistortion = [];
	projectedGeoPreviousTriangulationAppliableMask = [];
	projectedGeoTriangulationAppliableMask = [];
	projectedGeoPreviousTriangulationMask = [];
	projectedGeoTriangulationMask = [];
	constructor(e, t, n, r) {
		super(e, t, n, r), this.resourceTriangulationCache = /* @__PURE__ */ new Map(), this.projectedGcpTriangulationCache = /* @__PURE__ */ new Map(), this.updateTriangulation();
	}
	static getDefaultOptions() {
		return M(w_, super.getDefaultOptions());
	}
	setDefaultOptions() {
		this.defaultOptions = e.getDefaultOptions();
	}
	setGcps(e) {
		super.setGcps(e), this.clearResourceTriangulationCaches(), this.updateTriangulation();
	}
	setResourceMask(e, t, n) {
		super.setResourceMask(e, t, n), this.updateTriangulation();
	}
	setDistortionMeasure(e) {
		super.setDistortionMeasure(e), this.updateTrianglePointsDistortion();
	}
	setInternalProjection(e) {
		super.setInternalProjection(e), this.updateTriangulation();
	}
	setProjection(e) {
		super.setProjection(e), this.clearProjectedTriangulationCaches(), this.updateTriangulation();
	}
	resetPrevious() {
		super.resetPrevious(), this.previousResourceResolution = this.resourceResolution, this.projectedGcpPreviousTriangulation = this.projectedGcpTriangulation, this.projectedGeoPreviousTrianglePoints = this.projectedGeoTrianglePoints, this.previousTrianglePointsDistortion = this.trianglePointsDistortion, this.projectedGeoPreviousTriangulationAppliableMask = this.projectedGeoTriangulationAppliableMask, this.projectedGeoPreviousTriangulationMask = this.projectedGeoTriangulationMask;
	}
	mixPreviousAndNew(e) {
		if (super.mixPreviousAndNew(e), this.projectedGcpPreviousTriangulation && this.projectedGcpTriangulation) {
			let t = this.projectedGcpPreviousTriangulation, n = this.projectedGcpTriangulation;
			this.previousResourceResolution = this.resourceResolution, this.projectedGcpPreviousTriangulation = {
				resourceResolution: t.resourceResolution,
				gcpUniquePoints: t.gcpUniquePoints.map((t, r) => ({
					resource: t.resource,
					geo: ds(n.gcpUniquePoints[r].geo, t.geo, e),
					distortions: n.gcpUniquePoints[r].distortions,
					distortion: us(n.gcpUniquePoints[r].distortion || 0, t.distortion || 0, e)
				})),
				uniquePointIndices: t.uniquePointIndices,
				uniquePointIndexInterpolatedPolygon: t.uniquePointIndexInterpolatedPolygon
			}, this.projectedGeoPreviousTrianglePoints = t.uniquePointIndices.map((e) => t.gcpUniquePoints[e].geo), this.previousTrianglePointsDistortion = t.uniquePointIndices.map((e) => t.gcpUniquePoints[e].distortion);
		}
		this.projectedGeoPreviousTriangulationAppliableMask = fs(this.projectedGeoTriangulationAppliableMask, this.projectedGeoPreviousTriangulationAppliableMask, e), this.projectedGeoPreviousTriangulationMask = fs(this.projectedGeoTriangulationMask, this.projectedGeoPreviousTriangulationMask, e);
	}
	updateTriangulation() {
		if (!this.resourceTriangulationCache || !this.projectedGcpTriangulationCache) return;
		let e = this.options.resourceResolution || this.projectedTransformer.getToGeoTransformationResolution(this.resourceMaskBbox), t = !1;
		e && this.previousResourceResolution && (t = this.previousResourceResolution < e, this.resourceResolution = Math.min(e, this.previousResourceResolution)), e && !this.previousResourceResolution && (t = !0, this.resourceResolution = e), !e && this.previousResourceResolution ? this.resourceResolution = this.previousResourceResolution : !e && !this.previousResourceResolution && (this.resourceResolution = void 0), this.projectedGcpTriangulation = Ec(this.projectedGcpTriangulationCache, this.resourceResolution, String(this.resourceMask), this.transformationType, this.internalProjection.definition, () => {
			let { uniquePoints: e, uniquePointIndexTriangles: t, uniquePointIndexInterpolatedPolygon: n } = Tc(this.resourceTriangulationCache, this.resourceResolution, String(this.resourceMask), () => f_([this.resourceMask], this.resourceResolution, { steinerPoints: this.gcps.map((e) => e.resource) }));
			return {
				resourceResolution: this.resourceResolution,
				gcpUniquePoints: e.map((e) => this.projectedTransformer.transformToGeo(e, {
					distortionMeasures: this.options.distortionMeasures,
					referenceScale: this.getReferenceScale()
				}, (e) => e)),
				uniquePointIndices: t.flat(),
				uniquePointIndexInterpolatedPolygon: n
			};
		}), this.projectedGcpPreviousTriangulation ||= this.projectedGcpTriangulation, t && (this.previousResourceResolution = this.resourceResolution, this.projectedGcpPreviousTriangulation = Ec(this.projectedGcpTriangulationCache, this.previousResourceResolution, String(this.resourceMask), this.previousTransformationType, this.previousInternalProjection.definition, () => {
			if (!this.projectedGcpTriangulation) throw Error("No projectedGcpTriangulation");
			let e = this.projectedGcpTriangulation;
			return {
				resourceResolution: this.projectedGcpTriangulation.resourceResolution,
				gcpUniquePoints: this.projectedGcpTriangulation.gcpUniquePoints.map((e) => this.projectedPreviousTransformer.transformToGeo(e.resource, {
					distortionMeasures: this.options.distortionMeasures,
					referenceScale: this.getReferenceScale()
				}, (e) => e)),
				uniquePointIndices: this.projectedGcpTriangulation.uniquePointIndices,
				uniquePointIndexInterpolatedPolygon: e.uniquePointIndexInterpolatedPolygon
			};
		}, () => !this.mixed, () => !this.mixed)), this.updateTrianglePoints();
	}
	updateTrianglePoints() {
		if (!this.projectedGcpPreviousTriangulation || !this.projectedGcpTriangulation) return;
		let e = this.projectedGcpPreviousTriangulation, t = this.projectedGcpTriangulation;
		this.resourceTrianglePoints = this.projectedGcpTriangulation.uniquePointIndices.map((e) => t.gcpUniquePoints[e].resource), this.projectedGeoPreviousTrianglePoints = this.projectedGcpPreviousTriangulation.uniquePointIndices.map((t) => e.gcpUniquePoints[t].geo), this.projectedGeoTrianglePoints = this.projectedGcpTriangulation.uniquePointIndices.map((e) => t.gcpUniquePoints[e].geo), this.projectedGeoPreviousTriangulationMask = this.projectedGcpPreviousTriangulation.uniquePointIndexInterpolatedPolygon.map((t) => t.map((t) => e.gcpUniquePoints[t].geo)).flat(), this.projectedGeoTriangulationMask = this.projectedGcpTriangulation.uniquePointIndexInterpolatedPolygon.map((e) => e.map((e) => t.gcpUniquePoints[e].geo)).flat(), this.projectedGeoTriangulationAppliableMask = this.projectedTransformer.transformToGeo(n_([this.resourceAppliableMask], this.resourceResolution)[0], { isMultiGeometry: !0 }), this.projectedGeoPreviousTriangulationAppliableMask.length == 0 && (this.projectedGeoPreviousTriangulationAppliableMask = this.projectedGeoTriangulationAppliableMask), this.updateTrianglePointsDistortion();
	}
	updateTrianglePointsDistortion() {
		if (!this.projectedGcpPreviousTriangulation || !this.projectedGcpTriangulation) return;
		let e = this.projectedGcpPreviousTriangulation, t = this.projectedGcpTriangulation;
		this.previousTrianglePointsDistortion = e.uniquePointIndices.map((t) => {
			let n = e.gcpUniquePoints[t].distortions;
			return !this.previousDistortionMeasure || !n ? 0 : n.get(this.previousDistortionMeasure);
		}), this.trianglePointsDistortion = t.uniquePointIndices.map((e) => {
			let n = t.gcpUniquePoints[e].distortions;
			return !this.distortionMeasure || !n ? 0 : n.get(this.distortionMeasure);
		});
	}
	updateProjectedTransformerProperties() {
		super.updateProjectedTransformerProperties(), this.updateTriangulation();
	}
	clearProjectedTransformerCaches() {
		super.clearProjectedTransformerCaches(), this.clearResourceTriangulationCaches();
	}
	clearResourceTriangulationCaches() {
		this.resourceTriangulationCache = /* @__PURE__ */ new Map(), this.clearProjectedTriangulationCaches();
	}
	clearProjectedTriangulationCaches() {
		this.projectedGcpTriangulationCache = /* @__PURE__ */ new Map();
	}
};
//#endregion
//#region node_modules/@allmaps/render/dist/shared/webgl2.js
function E_(e, t, n) {
	let r = e.createShader(t);
	if (r) {
		if (e.shaderSource(r, n), e.compileShader(r), e.getShaderParameter(r, e.COMPILE_STATUS)) return r;
		{
			let t = e.getShaderInfoLog(r);
			throw e.deleteShader(r), Error("Failed to compile shader: " + t);
		}
	} else throw Error("Failed to create shader");
}
function D_(e, t, n) {
	let r = e.createProgram();
	if (r) {
		if (e.attachShader(r, t), e.attachShader(r, n), e.linkProgram(r), e.getProgramParameter(r, e.LINK_STATUS)) return r;
		{
			let t = e.getProgramInfoLog(r);
			throw e.deleteProgram(r), Error("Failed to link program: " + t);
		}
	} else throw Error("Failed to create program");
}
function $(e, t, n, r, i) {
	let a = e.createBuffer();
	if (!a) throw Error("Failed to create buffer");
	e.bindBuffer(e.ARRAY_BUFFER, a), e.bufferData(e.ARRAY_BUFFER, n, e.STATIC_DRAW);
	let o = e.FLOAT, s = e.getAttribLocation(t, i);
	return e.vertexAttribPointer(s, r, o, !1, 0, 0), e.enableVertexAttribArray(s), a;
}
//#endregion
//#region node_modules/@allmaps/render/dist/shared/tiles.js
function O_(e, t, n, r) {
	let i = Infinity, a = e.at(-1);
	for (let o of e) {
		let e = Math.abs(Math.log2(o.scaleFactor) - (Math.log2(t + n) + r));
		e < i && (i = e, a = o);
	}
	return a;
}
function k_(e, t, n) {
	return N_(j_(A_(e, t)), t, n);
}
function A_(e, t) {
	return e.map((e) => [e[0] / t.originalWidth, e[1] / t.originalHeight]);
}
function j_(e) {
	let t = {};
	for (let n = 0; n < e.length; n++) M_([e[n], e[(n + 1) % e.length]]).forEach(([e, n]) => {
		t[e] || (t[e] = [Infinity, -Infinity]), n < t[e][0] && (t[e][0] = n), n > t[e][1] && (t[e][1] = n);
	});
	return t;
}
function M_([e, t]) {
	let n = Math.floor(e[0]), r = Math.floor(e[1]), i = Math.floor(t[0]), a = Math.floor(t[1]), o = [[n, r]];
	if (n === i && r === a) return o;
	let s = Math.sign(t[0] - e[0]), c = Math.sign(t[1] - e[1]), l = Math.abs(e[0] - n - Math.max(0, s)), u = Math.abs(e[1] - r - Math.max(0, c)), d = Math.abs(e[0] - t[0]), f = Math.abs(e[1] - t[1]), p = l / d, m = u / f, h = 1 / d, g = 1 / f;
	for (; !(n === i && r === a);) f === 0 ? n += s : d === 0 ? r += c : p < m ? (p += h, n += s) : (m += g, r += c), o.push([n, r]);
	return o;
}
function N_(e, t, n) {
	let r = [];
	for (let i in e) {
		let a = parseInt(i);
		if (a < 0 || a >= t.columns) break;
		let o = Math.max(e[a][0], 0), s = Math.min(e[a][1], t.rows - 1);
		for (let e = o; e <= s; e++) r.push({
			column: a,
			row: e,
			tileZoomLevel: t,
			imageSize: n
		});
	}
	return r;
}
function P_(e, t, n, r) {
	let i = Math.floor(e.column * e.tileZoomLevel.scaleFactor / n);
	i = i >= 0 ? i : 0;
	let a = Math.ceil((e.column + 1) * e.tileZoomLevel.scaleFactor / n), o = Math.floor(e.row * e.tileZoomLevel.scaleFactor / n);
	o = o >= 0 ? o : 0;
	let s = Math.ceil((e.row + 1) * e.tileZoomLevel.scaleFactor / n);
	return F_(n, t, i, a, o, s, r);
}
function F_(e, t, n, r, i, a, o = (e) => !0) {
	let s = t.tileZoomLevels.find((t) => t.scaleFactor === e), c = [t.width, t.height];
	if (!s) return [];
	n ||= 0, r ||= s.columns, i ||= 0, a ||= s.rows;
	let l = [];
	for (let e = n; e < r; e++) for (let t = i; t < a; t++) {
		let n = {
			column: e,
			row: t,
			tileZoomLevel: s,
			imageSize: c
		};
		o(n) && l.push(n);
	}
	return l;
}
function I_(e, t) {
	return _s(L_(e), t);
}
function L_(e) {
	let t = z_(e);
	return [(t[2] - t[0]) / 2 + t[0], (t[3] - t[1]) / 2 + t[1]];
}
function R_(e) {
	return [e.column * e.tileZoomLevel.originalWidth, e.row * e.tileZoomLevel.originalHeight];
}
function z_(e) {
	let t = R_(e), n = Math.min(t[0] + e.tileZoomLevel.originalWidth, e.imageSize[0]), r = Math.min(t[1] + e.tileZoomLevel.originalHeight, e.imageSize[1]);
	return [
		t[0],
		t[1],
		n,
		r
	];
}
function B_(e) {
	return [e.tileZoomLevel.width, e.tileZoomLevel.height];
}
function V_(e) {
	return yc(B_(e));
}
function H_(e) {
	return e.rows * e.width * e.columns * e.height;
}
function U_(e, t, n, r, i, a) {
	let o = [], s = G_(e, t, n, r, a);
	for (let e of s) e && o.push(e);
	if (o.length === 0) {
		let r = W_(e, t, n, i, Math.max(...t.tileZoomLevels.map((e) => e.scaleFactor)), a);
		r && o.push(r);
	}
	return o;
}
function W_(e, t, n, r, i, a) {
	let o = 2 ** (Math.log2(n) + 1);
	if (o > i || r <= 0) return;
	let s = K_(e, t, o, a);
	return s === void 0 ? W_(e, t, o, r--, i, a) : s;
}
function G_(e, t, n, r, i) {
	let a = 2 ** (Math.log2(n) - 1);
	if (a <= 0 || r <= 0) return [];
	let o = q_(e, t, a, i), s = q_(e, t, a, (e) => !0);
	return o.length === s.length ? o : [...o, ...G_(e, t, a, r--, i)];
}
function K_(e, t, n, r) {
	let i = P_(e, t, n, r);
	if (i.length !== 0) return i[0];
}
function q_(e, t, n, r) {
	return P_(e, t, n, r);
}
function J_(e) {
	return Y_(e.mapId, e.tileUrl);
}
function Y_(e, t) {
	return `${e}:${t}`;
}
function X_(e) {
	return Z_(e.tileZoomLevel.scaleFactor, e.row, e.column);
}
function Z_(e, t, n) {
	return `${e}:${t}:${n}`;
}
//#endregion
//#region node_modules/@allmaps/render/dist/maps/WebGL2WarpedMap.js
var Q_ = 200, $_ = {
	leading: !0,
	trailing: !0
}, ev = {
	viewportSize: 6,
	color: kg,
	viewportBorderSize: 0,
	borderColor: Ag
}, tv = {
	viewportSize: 16,
	color: kg,
	viewportBorderSize: 1,
	borderColor: Ag
}, nv = {
	renderGcps: !1,
	renderGcpsColor: Wg,
	renderTransformedGcps: !1,
	renderTransformedGcpsColor: qg,
	renderVectors: !1,
	renderVectorsSize: 6,
	renderVectorsColor: kg,
	renderFullMask: !1,
	renderFullMaskSize: 8,
	renderFullMaskColor: Xg,
	renderAppliableMask: !1,
	renderAppliableMaskSize: 8,
	renderAppliableMaskColor: qg,
	renderMask: !1,
	renderMaskSize: 8,
	renderMaskColor: qg,
	opacity: 1,
	saturation: 1,
	removeColor: !1,
	removeColorColor: kg,
	removeColorThreshold: 0,
	removeColorHardness: .7,
	colorize: !1,
	colorizeColor: qg,
	renderGrid: !1,
	renderGridColor: kg,
	distortionColor00: Yg,
	distortionColor01: Gg,
	distortionColor1: Xg,
	distortionColor2: Zg,
	distortionColor3: Yg,
	debugTiles: !1,
	debugTriangles: !1,
	debugTriangulation: !1
}, rv = 5, iv = 1;
function av(e, t, n, r) {
	return (i, a, o, s) => new ov(i, a, e, t, n, r, o, s);
}
var ov = class e extends T_ {
	gl;
	mapProgram;
	linesProgram;
	pointsProgram;
	mapVao = null;
	linesVao = null;
	pointsVao = null;
	lineGroups = [];
	pointGroups = [];
	cachedTilesByTileKey;
	cachedTilesByTileUrl;
	cachedTilesForTexture = [];
	previousCachedTilesForTexture = [];
	cachedTilesTextureArray = null;
	cachedTilesResourceOriginPointsAndSizesTexture = null;
	cachedTilesScaleFactorsTexture = null;
	invertedRenderHomogeneousTransform;
	throttledUpdateTextures;
	constructor(e, t, n, r, i, a, o, s) {
		super(e, t, o, s), this.cachedTilesByTileKey = /* @__PURE__ */ new Map(), this.cachedTilesByTileUrl = /* @__PURE__ */ new Map(), this.gl = n, this.initializeWebGL(r, i, a), this.invertedRenderHomogeneousTransform = m_(), this.throttledUpdateTextures = wa(this.updateTextures.bind(this), Q_, $_);
	}
	initializeWebGL(e, t, n) {
		this.mapProgram = e, this.linesProgram = t, this.pointsProgram = n, this.mapVao = this.gl.createVertexArray(), this.linesVao = this.gl.createVertexArray(), this.pointsVao = this.gl.createVertexArray(), this.cachedTilesTextureArray = this.gl.createTexture(), this.cachedTilesScaleFactorsTexture = this.gl.createTexture(), this.cachedTilesResourceOriginPointsAndSizesTexture = this.gl.createTexture();
	}
	static getDefaultOptions() {
		return M(nv, super.getDefaultOptions());
	}
	setDefaultOptions() {
		this.defaultOptions = e.getDefaultOptions();
	}
	applyOptions(e) {
		let t = super.applyOptions(e);
		return this.options.opacity = (this.listOptions?.opacity ?? this.defaultOptions.opacity) * (this.mapOptions?.opacity ?? 1), this.options.saturation = (this.listOptions?.saturation ?? this.defaultOptions.saturation) * (this.mapOptions?.saturation ?? 1), t;
	}
	shouldRenderMap() {
		return super.shouldRenderMap() && this.options.renderMaps !== !1 && this.options.opacity !== 0;
	}
	shouldRenderLines() {
		return super.shouldRenderLines() && this.options.renderLines !== !1 && (this.options.renderFullMask || this.options.renderAppliableMask || this.options.renderMask || this.options.renderVectors);
	}
	shouldRenderPoints() {
		return super.shouldRenderPoints() && this.options.renderPoints !== !1 && (this.options.renderGcps || this.options.renderTransformedGcps || this.options.debugTriangulation);
	}
	updateVertexBuffers(e) {
		this.invertedRenderHomogeneousTransform = __(e), this.shouldRenderMap() && this.updateVertexBuffersMap(e), this.shouldRenderLines() && this.updateVertexBuffersLines(e), this.shouldRenderPoints() && this.updateVertexBuffersPoints(e);
	}
	clearTextures() {}
	addCachedTileAndUpdateTextures(e) {
		this.cachedTilesByTileKey.has(e.fetchableTile.tileKey) || (this.cachedTilesByTileKey.set(e.fetchableTile.tileKey, e), this.cachedTilesByTileUrl.set(e.fetchableTile.tileUrl, e), this.throttledUpdateTextures());
	}
	removeCachedTileAndUpdateTextures(e) {
		let t = this.cachedTilesByTileUrl.get(e);
		t && (this.cachedTilesByTileKey.delete(t.fetchableTile.tileKey), this.cachedTilesByTileUrl.delete(e), this.throttledUpdateTextures());
	}
	cancelThrottledFunctions() {
		this.throttledUpdateTextures.cancel();
	}
	destroy() {
		this.gl.deleteVertexArray(this.mapVao), this.gl.deleteVertexArray(this.linesVao), this.gl.deleteVertexArray(this.pointsVao), this.gl.deleteTexture(this.cachedTilesTextureArray), this.gl.deleteTexture(this.cachedTilesScaleFactorsTexture), this.gl.deleteTexture(this.cachedTilesResourceOriginPointsAndSizesTexture), this.cancelThrottledFunctions(), super.destroy();
	}
	setLineGroups() {
		this.lineGroups = [], this.options.renderVectors && this.lineGroups.push({
			projectedGeoLines: ss(this.projectedGeoPoints, this.projectedGeoTransformedResourcePoints),
			projectedGeoPreviousLines: ss(this.projectedGeoPoints, this.projectedGeoPreviousTransformedResourcePoints),
			viewportSize: this.options.renderVectorsSize,
			color: this.options.renderVectorsColor,
			viewportBorderSize: this.options.renderVectorsBorderSize,
			borderColor: this.options.renderVectorsBorderColor
		}), this.options.renderFullMask && this.lineGroups.push({
			projectedGeoLines: cs(this.projectedGeoFullMask),
			viewportSize: this.options.renderFullMaskSize,
			color: this.options.renderFullMaskColor,
			viewportBorderSize: this.options.renderFullMaskBorderSize,
			borderColor: this.options.renderFullMaskBorderColor
		}), this.options.renderAppliableMask && this.lineGroups.push({
			projectedGeoLines: cs(this.projectedGeoTriangulationAppliableMask),
			projectedGeoPreviousLines: cs(this.projectedGeoPreviousTriangulationAppliableMask),
			viewportSize: this.options.renderAppliableMaskSize,
			color: this.options.renderAppliableMaskColor,
			viewportBorderSize: this.options.renderAppliableMaskBorderSize,
			borderColor: this.options.renderAppliableMaskBorderColor
		}), this.options.renderMask && this.lineGroups.push({
			projectedGeoLines: cs(this.projectedGeoTriangulationMask),
			projectedGeoPreviousLines: cs(this.projectedGeoPreviousTriangulationMask),
			viewportSize: this.options.renderMaskSize,
			color: this.options.renderMaskColor,
			viewportBorderSize: this.options.renderMaskBorderSize,
			borderColor: this.options.renderMaskBorderColor
		});
	}
	setPointGroups() {
		this.pointGroups = [], this.options.renderGcps && this.pointGroups.push({
			projectedGeoPoints: this.projectedGeoPoints,
			viewportSize: this.options.renderGcpsSize,
			color: this.options.renderGcpsColor,
			viewportBorderSize: this.options.renderGcpsBorderSize,
			borderColor: this.options.renderGcpsBorderColor
		}), this.options.renderTransformedGcps && this.pointGroups.push({
			projectedGeoPoints: this.projectedGeoTransformedResourcePoints,
			projectedGeoPreviousPoints: this.projectedGeoPreviousTransformedResourcePoints,
			viewportSize: this.options.renderTransformedGcpsSize,
			color: this.options.renderTransformedGcpsColor,
			viewportBorderSize: this.options.renderTransformedGcpsBorderSize,
			borderColor: this.options.renderTransformedGcpsBorderColor
		}), this.options.debugTriangulation && (this.pointGroups.push({
			projectedGeoPoints: this.projectedGeoPreviousTrianglePoints,
			color: Qg
		}), this.pointGroups.push({
			projectedGeoPoints: this.projectedGeoTrianglePoints,
			color: Zg
		}));
	}
	updateVertexBuffersMap(e) {
		if (!this.mapVao) return;
		let t = this.gl, n = this.mapProgram;
		t.bindVertexArray(this.mapVao), $(t, n, new Float32Array(this.resourceTrianglePoints.flat()), 2, "a_resourceTrianglePoint");
		let r = this.projectedGeoPreviousTrianglePoints.map((t) => p_(e, t));
		$(t, n, new Float32Array(r.flat()), 2, "a_clipPreviousTrianglePoint");
		let i = this.projectedGeoTrianglePoints.map((t) => p_(e, t));
		$(t, n, new Float32Array(i.flat()), 2, "a_clipTrianglePoint"), $(t, n, new Float32Array(this.previousTrianglePointsDistortion), 1, "a_previousTrianglePointDistortion"), $(t, n, new Float32Array(this.trianglePointsDistortion), 1, "a_trianglePointDistortion"), $(t, n, new Float32Array(this.resourceTrianglePoints.length).map((e, t) => t), 1, "a_trianglePointIndex");
	}
	updateVertexBuffersLines(e) {
		if (!this.linesVao) return;
		let t = this.gl, n = this.linesProgram;
		t.bindVertexArray(this.linesVao), this.setLineGroups();
		let r = this.lineGroups.reduce((e, t) => e.concat(t.projectedGeoLines), []).map((e) => [
			e[0],
			e[0],
			e[0],
			e[1],
			e[1],
			e[1]
		]).flat().map((t) => p_(e, t));
		$(t, n, new Float32Array(r.flat()), 2, "a_clipPoint");
		let i = this.lineGroups.reduce((e, t) => e.concat(t.projectedGeoLines), []).map((e) => [
			e[1],
			e[1],
			e[1],
			e[0],
			e[0],
			e[0]
		]).flat().map((t) => p_(e, t));
		$(t, n, new Float32Array(i.flat()), 2, "a_clipOtherPoint");
		let a = this.lineGroups.reduce((e, t) => e.concat(t.projectedGeoPreviousLines || t.projectedGeoLines), []).map((e) => [
			e[0],
			e[0],
			e[0],
			e[1],
			e[1],
			e[1]
		]).flat().map((t) => p_(e, t));
		$(t, n, new Float32Array(a.flat()), 2, "a_clipPreviousPoint");
		let o = this.lineGroups.reduce((e, t) => e.concat(t.projectedGeoPreviousLines || t.projectedGeoLines), []).map((e) => [
			e[1],
			e[1],
			e[1],
			e[0],
			e[0],
			e[0]
		]).flat().map((t) => p_(e, t));
		$(t, n, new Float32Array(o.flat()), 2, "a_clipPreviousOtherPoint");
		let s = this.lineGroups.reduce((e, t) => e.concat(t.projectedGeoLines.flatMap((e) => [
			0,
			0,
			1,
			0,
			0,
			1
		])), []);
		$(t, n, new Float32Array(s), 1, "a_isOtherPoint");
		let c = this.lineGroups.reduce((e, t) => e.concat(t.projectedGeoLines.flatMap((e) => [
			1,
			-1,
			1,
			1,
			-1,
			1
		])), []);
		$(t, n, new Float32Array(c), 1, "a_normalSign");
		let l = this.lineGroups.reduce((e, t) => e.concat(t.projectedGeoLines.flatMap((e) => [
			,
			,
			,
			,
			,
			,
		].fill(t.viewportSize ?? ev.viewportSize))), []);
		$(t, n, new Float32Array(l), 1, "a_viewportSize");
		let u = this.lineGroups.reduce((e, t) => {
			let n = Ic(t.color ?? ev.color);
			return e.concat(t.projectedGeoLines.flatMap((e) => [
				,
				,
				,
				,
				,
				,
			].fill(n)));
		}, []);
		$(t, n, new Float32Array(u.flat()), 4, "a_color");
		let d = this.lineGroups.reduce((e, t) => e.concat(t.projectedGeoLines.flatMap((e) => [
			,
			,
			,
			,
			,
			,
		].fill(t.viewportBorderSize ?? ev.viewportBorderSize))), []);
		$(t, n, new Float32Array(d), 1, "a_viewportBorderSize");
		let f = this.lineGroups.reduce((e, t) => {
			let n = Ic(t.borderColor ?? ev.borderColor);
			return e.concat(t.projectedGeoLines.flatMap((e) => [
				,
				,
				,
				,
				,
				,
			].fill(n)));
		}, []);
		$(t, n, new Float32Array(f.flat()), 4, "a_borderColor");
	}
	updateVertexBuffersPoints(e) {
		if (!this.pointsVao) return;
		let t = this.gl, n = this.pointsProgram;
		t.bindVertexArray(this.pointsVao), this.setPointGroups();
		let r = this.pointGroups.reduce((e, t) => e.concat(t.projectedGeoPoints), []).map((t) => p_(e, t));
		$(t, n, new Float32Array(r.flat()), 2, "a_clipPoint");
		let i = this.pointGroups.reduce((e, t) => e.concat(t.projectedGeoPreviousPoints || t.projectedGeoPoints), []).map((t) => p_(e, t));
		$(t, n, new Float32Array(i.flat()), 2, "a_clipPreviousPoint");
		let a = this.pointGroups.reduce((e, t) => e.concat(t.projectedGeoPoints.map((e) => t.viewportSize ?? tv.viewportSize)), []);
		$(t, n, new Float32Array(a), 1, "a_viewportSize");
		let o = this.pointGroups.reduce((e, t) => {
			let n = Ic(t.color ?? tv.color);
			return e.concat(t.projectedGeoPoints.map((e) => n));
		}, []);
		$(t, n, new Float32Array(o.flat()), 4, "a_color");
		let s = this.pointGroups.reduce((e, t) => e.concat(t.projectedGeoPoints.map((e) => t.viewportBorderSize ?? tv.viewportBorderSize)), []);
		$(t, n, new Float32Array(s), 1, "a_viewportBorderSize");
		let c = this.pointGroups.reduce((e, t) => {
			let n = Ic(t.borderColor ?? tv.borderColor);
			return e.concat(t.projectedGeoPoints.map((e) => n));
		}, []);
		$(t, n, new Float32Array(c.flat()), 4, "a_borderColor");
	}
	async updateTextures() {
		let e = this.gl;
		if (this.updateCachedTilesForTextures(), this.cachedTilesForTexture.length == 0 || this.cachedTilesForTexture.length !== 0 && Rc(this.previousCachedTilesForTexture.map((e) => e.fetchableTile.tileUrl), this.cachedTilesForTexture.map((e) => e.fetchableTile.tileUrl)) || !this.image) return;
		let t = this.tileSize[0], n = this.tileSize[1], r = this.cachedTilesForTexture.length;
		e.pixelStorei(e.UNPACK_ALIGNMENT, 4), e.bindTexture(e.TEXTURE_2D_ARRAY, this.cachedTilesTextureArray), e.texImage3D(e.TEXTURE_2D_ARRAY, 0, e.RGBA, t, n, r, 0, e.RGBA, e.UNSIGNED_BYTE, null);
		for (let n = 0; n < this.cachedTilesForTexture.length; n++) {
			let r = this.cachedTilesForTexture[n].data;
			if (r.width !== t || r.width !== t) throw Error("Cached tile doesn't fit in texture");
			let i = e.createBuffer();
			e.bindBuffer(e.PIXEL_UNPACK_BUFFER, i), e.bufferData(e.PIXEL_UNPACK_BUFFER, r.data, e.STATIC_DRAW), e.texSubImage3D(e.TEXTURE_2D_ARRAY, 0, 0, 0, n, r.width, r.height, 1, e.RGBA, e.UNSIGNED_BYTE, 0), e.bindBuffer(e.PIXEL_UNPACK_BUFFER, null);
		}
		e.texParameteri(e.TEXTURE_2D_ARRAY, e.TEXTURE_MIN_FILTER, e.LINEAR), e.texParameteri(e.TEXTURE_2D_ARRAY, e.TEXTURE_MAG_FILTER, e.LINEAR), e.texParameteri(e.TEXTURE_2D_ARRAY, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D_ARRAY, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE);
		let i = this.cachedTilesForTexture.map((e) => {
			if (e && e.fetchableTile && e.fetchableTile.options && e.fetchableTile.options.imageRequest && e.fetchableTile.options.imageRequest.region) return [
				e.fetchableTile.options.imageRequest.region.x,
				e.fetchableTile.options.imageRequest.region.y,
				e.fetchableTile.options.imageRequest.region.width,
				e.fetchableTile.options.imageRequest.region.height
			];
			throw Error("Missing resource origin points and sizes");
		});
		e.bindTexture(e.TEXTURE_2D, this.cachedTilesResourceOriginPointsAndSizesTexture), e.texImage2D(e.TEXTURE_2D, 0, e.R32I, 1, this.cachedTilesForTexture.length * 4, 0, e.RED_INTEGER, e.INT, new Int32Array(i.flat())), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.NEAREST), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.NEAREST), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE);
		let a = this.cachedTilesForTexture.map((e) => e.fetchableTile.tile.tileZoomLevel.scaleFactor);
		e.bindTexture(e.TEXTURE_2D, this.cachedTilesScaleFactorsTexture), e.texImage2D(e.TEXTURE_2D, 0, e.R32I, 1, this.cachedTilesForTexture.length, 0, e.RED_INTEGER, e.INT, new Int32Array(a)), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.NEAREST), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.NEAREST), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), this.dispatchEvent(new I(F.TEXTURESUPDATED));
	}
	updateCachedTilesForTextures() {
		let e = [], t = [], n = [], r = [];
		for (let n of this.fetchableTilesForViewport) {
			let r = this.cachedTilesByTileUrl.get(n.tileUrl);
			if (r) e.push(r);
			else for (let e of this.getCachedTilesAtOtherScaleFactors(n.tile)) t.push(e);
		}
		r.push(...Array.from(this.cachedTilesByTileUrl.values()).filter((e) => e.isTileFromSprites()));
		for (let t of this.overviewFetchableTilesForViewport) {
			let r = this.cachedTilesByTileUrl.get(t.tileUrl);
			if (r) {
				let t = this.tileZoomLevelForViewport ? this.tileZoomLevelForViewport.rows * this.tileZoomLevelForViewport.columns : void 0;
				(e.length === 0 || t && e.length < t) && n.push(r);
			}
		}
		let i = [
			...e,
			...t,
			...r,
			...n
		], a = /* @__PURE__ */ new Map();
		i.forEach((e) => a.set(e.fetchableTile.tileUrl, e)), i = [...a.values()], this.previousCachedTilesForTexture = this.cachedTilesForTexture, this.cachedTilesForTexture = i;
	}
	getCachedTilesAtOtherScaleFactors(e) {
		if (this.cachedTilesByTileUrl.size === 0 || !this.tileZoomLevelForViewport) return [];
		let t = [];
		for (e of U_(e, this.image, this.tileZoomLevelForViewport.scaleFactor, iv, rv, this.tileInCachedTiles.bind(this))) {
			let n = this.tileToCachedTile(e);
			if (n) t.push(n);
			else throw Error("Tile supposed to be in cache isn't.");
		}
		return t;
	}
	tileToCachedTile(e) {
		return this.cachedTilesByTileKey.get(X_(e));
	}
	tileInCachedTiles(e) {
		return this.cachedTilesByTileKey.has(X_(e));
	}
}, sv = {}, cv = {
	createRTree: !0,
	rtreeUpdatedOptions: [
		"gcps",
		"resourceMask",
		"transformationType",
		"internalProjection",
		"projection"
	],
	animatedOptions: [
		"transformationType",
		"internalProjection",
		"distortionMeasure"
	],
	projection: Gu
}, lv = class extends EventTarget {
	warpedMapFactory;
	warpedMapsById;
	zIndices;
	imagesById;
	rtree;
	options;
	constructor(e, t) {
		super(), this.warpedMapsById = /* @__PURE__ */ new Map(), this.zIndices = /* @__PURE__ */ new Map(), this.imagesById = /* @__PURE__ */ new Map(), this.warpedMapFactory = e, this.options = M(cv, t), this.options.createRTree && (this.rtree = new Og());
	}
	async addGeoreferencedMap(e, t) {
		let n = am(e), r = Array.isArray(n) ? n[0] : n;
		return this.addGeoreferencedMapInternal(r, t);
	}
	async removeGeoreferencedMap(e) {
		let t = am(e), n = Array.isArray(t) ? t[0] : t;
		return this.removeGeoreferencedMapInternal(n);
	}
	async removeGeoreferencedMapById(e) {
		return this.removeGeoreferencedMapByIdInternal(e);
	}
	async addGeoreferenceAnnotation(e, t) {
		let n = [], r = Vp(e), i = await Promise.allSettled(r.map((e) => this.addGeoreferencedMapInternal(e, t)));
		for (let e of i) e.status === "fulfilled" ? n.push(e.value) : n.push(e.reason);
		return this.dispatchEvent(new I(F.GEOREFERENCEANNOTATIONADDED)), this.dispatchEvent(new I(F.CHANGED)), n;
	}
	async removeGeoreferenceAnnotation(e) {
		let t = [], n = Vp(e);
		for (let e of n) {
			let n = await this.removeGeoreferencedMapInternal(e);
			t.push(n);
		}
		return this.dispatchEvent(new I(F.GEOREFERENCEANNOTATIONREMOVED)), t;
	}
	addImageInfos(e) {
		let t = [];
		for (let n of e) {
			let e = Zh.parse(n);
			this.imagesById.set(e.uri, e), t.push(e.uri);
		}
		return this.dispatchEvent(new I(F.IMAGEINFOSADDED)), t;
	}
	getMapIds(e) {
		return Array.from(this.getWarpedMaps(e)).map((e) => e.mapId);
	}
	getWarpedMaps(e) {
		let t = M(sv, e), n;
		n = t.mapIds === void 0 ? this.rtree && t.geoBbox ? this.rtree.searchFromBbox(t.geoBbox) : this.rtree && t.geoPoint ? this.rtree.searchFromPoint(t.geoPoint) : Array.from(this.warpedMapsById.keys()) : t.mapIds;
		let r = [];
		if (n === void 0) return r;
		for (let e of n) {
			let n = this.warpedMapsById.get(e);
			n && (!t.onlyVisible || n.options.visible) && r.push(n);
		}
		return r.sort((e, t) => this.orderMapIdsByZIndex(e.mapId, t.mapId)), r;
	}
	getWarpedMap(e) {
		return this.warpedMapsById.get(e);
	}
	getMapsCenter(e) {
		let t = this.getMapsBbox(e);
		if (t) return pc(t);
	}
	getMapsBbox(e) {
		let t = this.getProjectedGeoMaskPoints(e);
		if (t.length !== 0) return j(t);
	}
	getMapsConvexHull(e) {
		return gc(this.getProjectedGeoMaskPoints(e));
	}
	getMapZIndex(e) {
		return this.zIndices.get(e);
	}
	getDefaultOptions() {
		return M(cv, ov.getDefaultOptions());
	}
	getMapDefaultOptions(e) {
		return this.getWarpedMap(e)?.getDefaultAndGeoreferencedMapOptions();
	}
	getOptions() {
		return this.options;
	}
	getMapMapOptions(e) {
		let t = this.getWarpedMaps({ mapIds: [e] });
		return Array.from(t)[0]?.mapOptions;
	}
	getMapOptions(e) {
		let t = this.getWarpedMaps({ mapIds: [e] });
		return Array.from(t)[0]?.options;
	}
	setOptions(e, t) {
		this.options = M(this.options, e), this.internalSetMapsOptionsByMapId(void 0, e, t);
	}
	setMapsOptions(e, t, n, r) {
		let i = /* @__PURE__ */ new Map();
		for (let n of e) i.set(n, t);
		this.internalSetMapsOptionsByMapId(i, n, r);
	}
	setMapsOptionsByMapId(e, t, n) {
		this.internalSetMapsOptionsByMapId(e, t, n);
	}
	resetOptions(e, t) {
		e && e.length == 0 && (e = Object.keys(this.getDefaultOptions())), this.setOptions(Qc(e), t);
	}
	resetMapsOptions(e, t, n, r) {
		t && t.length == 0 && (t = Object.keys(this.getDefaultOptions())), n && n.length == 0 && (n = Object.keys(this.getDefaultOptions())), this.setMapsOptions(e, Qc(t), Qc(n), r);
	}
	resetMapsOptionsByMapId(e, t, n) {
		if (e && e.size == 0) {
			let t = this.getMapIds(), n = Object.keys(this.getDefaultOptions());
			for (let r of t) e.set(r, n);
		}
		t && t.length == 0 && (t = Object.keys(this.getDefaultOptions())), this.setMapsOptionsByMapId($c(e), Qc(t), n);
	}
	bringMapsToFront(e) {
		let t = this.warpedMapsById.size;
		for (let n of e) this.zIndices.has(n) && (this.zIndices.set(n, t), t++);
		this.removeZIndexHoles(), this.dispatchEvent(new I(F.CHANGED));
	}
	sendMapsToBack(e) {
		let t = -Array.from(e).length;
		for (let n of e) this.zIndices.has(n) && (this.zIndices.set(n, t), t++);
		this.removeZIndexHoles(), this.dispatchEvent(new I(F.CHANGED));
	}
	bringMapsForward(e) {
		for (let [e, t] of this.zIndices.entries()) this.zIndices.set(e, t * 2);
		for (let t of e) {
			let e = this.zIndices.get(t);
			e !== void 0 && this.zIndices.set(t, e + 3);
		}
		this.removeZIndexHoles(), this.dispatchEvent(new I(F.CHANGED));
	}
	sendMapsBackward(e) {
		for (let [e, t] of this.zIndices.entries()) this.zIndices.set(e, t * 2);
		for (let t of e) {
			let e = this.zIndices.get(t);
			e !== void 0 && this.zIndices.set(t, e - 3);
		}
		this.removeZIndexHoles(), this.dispatchEvent(new I(F.CHANGED));
	}
	orderMapIdsByZIndex(e, t) {
		let n = this.getMapZIndex(e), r = this.getMapZIndex(t);
		return n !== void 0 && r !== void 0 ? n - r : 0;
	}
	clear() {
		this.warpedMapsById = /* @__PURE__ */ new Map(), this.zIndices = /* @__PURE__ */ new Map(), this.rtree?.clear(), this.dispatchEvent(new I(F.CLEARED));
	}
	destroy() {
		for (let e of this.getWarpedMaps()) this.removeEventListenersFromWarpedMap(e), e.destroy();
		this.clear();
	}
	async addGeoreferencedMapInternal(e, t) {
		let n = await this.getOrComputeMapId(e), r = this.warpedMapFactory(n, e, this.options, t);
		return this.warpedMapsById.set(n, r), this.zIndices.set(n, this.warpedMapsById.size - 1), this.addToOrUpdateRtree(r), this.addEventListenersToWarpedMap(r), this.dispatchEvent(new I(F.WARPEDMAPADDED, { mapIds: [n] })), n;
	}
	async removeGeoreferencedMapInternal(e) {
		let t = await this.getOrComputeMapId(e);
		return this.removeGeoreferencedMapByIdInternal(t);
	}
	async removeGeoreferencedMapByIdInternal(e) {
		let t = this.warpedMapsById.get(e);
		if (t) this.warpedMapsById.delete(e), this.zIndices.delete(e), this.removeFromRtree(t), this.dispatchEvent(new I(F.WARPEDMAPREMOVED, { mapIds: [e] })), this.removeZIndexHoles(), this.dispatchEvent(new I(F.CHANGED)), t.destroy();
		else throw Error(`No map found with ID ${e}`);
		return e;
	}
	async getOrComputeMapId(e) {
		return e.id || await ad(e);
	}
	getProjectedGeoMaskPoints(e) {
		let t = this.getWarpedMaps(e), n = e?.projection;
		if (n) {
			let e = [];
			for (let n of t) e.push(...n.geoMask);
			return e.map((e) => o(n.definition, e));
		} else {
			let e = [];
			for (let n of t) e.push(...n.projectedGeoMask);
			return e;
		}
	}
	internalSetMapsOptionsByMapId(e, t, n) {
		if (this.warpedMapsById.size === 0 || e?.size === 0) return;
		n?.animate !== void 0 && this.dispatchEvent(new I(F.PREPARECHANGE, { mapIds: this.getMapIds() }));
		let r = [], i = [];
		for (let a of this.getWarpedMaps()) {
			let o;
			if (n?.animate === void 0) {
				let n = e?.get(a.mapId);
				o = a.setMapOptions(n, t, { optionKeysToOmit: this.options.animatedOptions });
			} else {
				let n = e?.get(a.mapId);
				o = a.setMapOptions(n, t);
			}
			let s = Object.keys(o);
			s.length > 0 && (r.push(...s), i.push(a.mapId)), this.options.rtreeUpdatedOptions.some((e) => e in o) && this.addToOrUpdateRtree(a);
		}
		r = Array.from(new Set(r)), n?.animate === void 0 || n?.animate === !1 ? (r.length > 0 && this.dispatchEvent(new I(F.IMMEDIATECHANGE, {
			mapIds: i,
			optionKeys: r
		})), n?.animate === void 0 && this.internalSetMapsOptionsByMapId(e, t, N(n, { animate: !0 }))) : r.length > 0 && this.dispatchEvent(new I(F.ANIMATEDCHANGE, {
			mapIds: i,
			optionKeys: r
		}));
	}
	addToOrUpdateRtree(e) {
		this.rtree && (this.rtree.removeItem(e.mapId), this.rtree.addItem(e.mapId, [e.geoMask]));
	}
	removeFromRtree(e) {
		this.rtree && this.rtree.removeItem(e.mapId);
	}
	removeZIndexHoles() {
		let e = [...this.zIndices.entries()].sort((e, t) => e[1] - t[1]), t = 0;
		for (let n of e) {
			let e = n[0];
			this.zIndices.set(e, t), t++;
		}
	}
	imageLoaded(e) {
		this.dispatchEvent(new I(F.IMAGELOADED, { mapIds: [e] }));
	}
	addEventListenersToWarpedMap(e) {
		e.addEventListener(F.IMAGELOADED, this.imageLoaded.bind(this, e.mapId));
	}
	removeEventListenersFromWarpedMap(e) {
		e.removeEventListener(F.IMAGELOADED, this.imageLoaded.bind(this, e.mapId));
	}
}, uv = class e {
	mapId;
	tile;
	tileUrl;
	tileKey;
	fetchableTileKey;
	options;
	constructor(e, t, n, r) {
		this.tile = e, this.mapId = t, this.tileUrl = n, this.options = r, this.tileKey = X_(e), this.fetchableTileKey = J_(this);
	}
	static fromWarpedMap(t, n, r) {
		let i = n.image.getTileImageRequest(t.tileZoomLevel, t.column, t.row);
		return new e(t, n.mapId, n.image.getImageUrl(i), N(r, { imageRequest: i }));
	}
	static fromSprite(t, n, r, i) {
		let a = r.tileSize[0], o = r.tileSize[1], s = {
			column: 0,
			row: 0,
			tileZoomLevel: {
				scaleFactor: t.scaleFactor,
				width: a,
				height: o,
				originalWidth: a * t.scaleFactor,
				originalHeight: o * t.scaleFactor,
				columns: 1,
				rows: 1
			},
			imageSize: n
		}, c = r.image.getTileImageRequest(s.tileZoomLevel, s.column, s.row);
		return new e(s, r.mapId, t.imageId, N(i, { imageRequest: c }));
	}
}, dv = {}, fv = 0, pv = 2, mv = 4, hv = 10, gv = 0, _v = -.5, vv = Infinity, yv = 2, bv = 1024 * 1024, xv = 10, Sv = 40, Cv = 100, wv = class extends EventTarget {
	warpedMapList;
	tileCache;
	spritesTileCache;
	mapsInPreviousViewport = /* @__PURE__ */ new Set();
	mapsInViewport = /* @__PURE__ */ new Set();
	mapsWithFetchableTilesForViewport = /* @__PURE__ */ new Set();
	mapsWithRequestedTilesForViewport = /* @__PURE__ */ new Set();
	viewport;
	options;
	constructor(e, t, n) {
		super(), this.options = M(dv, n), this.warpedMapList = new lv(e, n), this.tileCache = new ed(t, n), this.spritesTileCache = new ed(t, N(n, { tileCacheForSprites: this.tileCache }));
	}
	async addGeoreferenceAnnotation(e, t) {
		return this.warpedMapList.addGeoreferenceAnnotation(e, t);
	}
	async addGeoreferencedMap(e, t) {
		return this.warpedMapList.addGeoreferencedMap(e, t);
	}
	async addSprites(e, t, n) {
		let r = {
			sprites: e,
			imageUrl: t,
			imageSize: n
		}, i = {
			column: 0,
			row: 0,
			tileZoomLevel: {
				scaleFactor: 1,
				width: r.imageSize[0],
				height: r.imageSize[1],
				originalWidth: 0,
				originalHeight: 0,
				columns: 1,
				rows: 1
			},
			imageSize: r.imageSize
		}, a = /* @__PURE__ */ new Map();
		for (let e of this.warpedMapList.getWarpedMaps()) {
			if (e.hasImage() || await e.loadImage(this.warpedMapList.imagesById), !e.hasImage()) break;
			let t = e.georeferencedMap.resource.id;
			a.has(t) || a.set(t, []), a.get(e.georeferencedMap.resource.id)?.push(e);
		}
		let o = new Promise((e) => {
			this.spritesTileCache.addEventListener(F.MAPTILESLOADEDFROMSPRITES, e, { once: !0 });
		});
		return this.spritesTileCache.requestFetchableTiles([new uv(i, r.imageUrl, r.imageUrl, {
			spritesInfo: r,
			warpedMapsByResourceId: a
		})]), o;
	}
	getDefaultOptions() {
		return M(dv, this.warpedMapList.getDefaultOptions());
	}
	getMapDefaultOptions(e) {
		return this.warpedMapList.getMapDefaultOptions(e);
	}
	getOptions() {
		return N(this.options, this.warpedMapList.getOptions());
	}
	getMapMapOptions(e) {
		return this.warpedMapList.getMapMapOptions(e);
	}
	getMapOptions(e) {
		return this.warpedMapList.getMapOptions(e);
	}
	setOptions(e, t) {
		this.options = M(this.options, e), this.tileCache.setOptions(e), this.warpedMapList.setOptions(e, t);
	}
	setMapsOptions(e, t, n, r) {
		n && (this.options = N(this.options, n), this.tileCache.setOptions(n)), this.warpedMapList.setMapsOptions(e, t, n, r);
	}
	setMapsOptionsByMapId(e, t, n) {
		t && (this.options = N(this.options, t), this.tileCache.setOptions(t)), this.warpedMapList.setMapsOptionsByMapId(e, t, n);
	}
	resetOptions(e, t) {
		this.warpedMapList.resetOptions(e, t);
	}
	resetMapsOptions(e, t, n, r) {
		this.warpedMapList.resetMapsOptions(e, t, n, r);
	}
	resetMapsOptionsByMapId(e, t, n) {
		this.warpedMapList.resetMapsOptionsByMapId(e, t, n);
	}
	loadMissingImagesInViewport() {
		if (!this.viewport) return [];
		let e = j(this.viewport.getGeoBufferedRectangle());
		return Array.from(this.warpedMapList.getWarpedMaps({ geoBbox: e })).filter((e) => !e.hasImage() && !e.fetchingImageInfo).map((e) => e.loadImage(this.warpedMapList.imagesById));
	}
	someImagesInViewport() {
		return this.viewport ? Array.from(this.findMapsInViewport(this.shouldAnticipateInteraction() ? hv : 0)).map((e) => this.warpedMapList.getWarpedMap(e)).map((e) => e.hasImage()).some(Boolean) : !1;
	}
	shouldRequestFetchableTiles() {
		return !0;
	}
	shouldAnticipateInteraction() {
		return !1;
	}
	assureProjection() {
		this.viewport && (Xu(this.warpedMapList.options.projection, this.viewport.projection) || (this.warpedMapList.options.projection = this.viewport.projection, this.warpedMapList.setOptions({ projection: this.viewport.projection })));
	}
	requestFetchableTiles() {
		if (!this.shouldRequestFetchableTiles()) return;
		let e = [], t = [], n = this.findMapsInViewport(this.shouldAnticipateInteraction() ? fv : 0), r = this.findMapsInViewport(this.shouldAnticipateInteraction() ? pv : 0), i = this.findMapsInViewport(this.shouldAnticipateInteraction() ? mv : 0), a = this.findMapsInViewport(this.shouldAnticipateInteraction() ? hv : 0);
		for (let e of this.warpedMapList.getWarpedMaps()) e.resetForViewport();
		for (let t of i) e.push(...this.getMapFetchableTilesForViewport(t, n));
		let o = e.map((e) => V_(e.tile)).reduce((e, t) => e + t, 0), s = 0, c = this.tileCache.getCachedTiles().filter((e) => e.isTileFromSprites()).filter((e) => this.warpedMapList.getWarpedMap(e.fetchableTile.mapId)?.options.visible != 0).map((e) => e.fetchableTile);
		if (this.shouldAnticipateInteraction()) for (let e of a) {
			let n = this.getMapOverviewFetchableTilesForViewport(e, o + s, r, c);
			s += n.map((e) => V_(e.tile)).reduce((e, t) => e + t, 0), t.push(...n);
		}
		let l = [
			...e,
			...c,
			...t
		], u = l.filter((e) => this.warpedMapList.getWarpedMap(e.mapId)?.shouldRenderMap());
		this.tileCache.requestFetchableTiles(u), this.pruneTileCache(a), this.updateMapsForViewport(l);
	}
	findMapsInViewport(e = 0) {
		if (!this.viewport) return /* @__PURE__ */ new Set();
		let t = this.viewport, n = j(this.viewport.getGeoBufferedRectangle(e));
		return new Set(Array.from(this.warpedMapList.getWarpedMaps({ geoBbox: n })).map((e) => ({
			warpedMap: e,
			projectedGeoSquaredDistanceToViewportCenter: _s(pc(e.projectedGeoMaskBbox), t.projectedGeoCenter)
		})).sort((e, t) => e && t ? e.projectedGeoSquaredDistanceToViewportCenter - t.projectedGeoSquaredDistanceToViewportCenter : 0).map((e) => e.warpedMap.mapId));
	}
	getMapFetchableTilesForViewport(e, t) {
		if (!this.viewport) return [];
		let n = this.viewport, r = this.warpedMapList.getWarpedMap(e);
		if (!r || !r.options.visible || !r.hasImage()) return [];
		let i = O_(r.image.tileZoomLevels, r.getResourceToViewportScale(n), gv, _v);
		r.setTileZoomLevelForViewport(i);
		let a = {
			maxDepth: 0,
			sourceIsGeographic: !1,
			destinationIsGeographic: !0
		}, o = n.getProjectedGeoBufferedRectangle(this.shouldAnticipateInteraction() ? fv : 0), s = (r.transformationType === "thinPlateSpline" && r.gcps.length > Cv ? r.getProjectedTransformer("polynomial") : r.projectedTransformer).transformToResource([o], a)[0];
		if (r.setProjectedGeoBufferedViewportRectangleForViewport(o), r.setResourceBufferedViewportRingForViewport(s), !r.resourceBufferedViewportRingBboxForViewport || !r.resourceBufferedViewportRingBboxForViewport) throw Error("No resourceBufferedViewportRingBboxForViewport or resourceBufferedViewportRingBboxForViewport");
		let c = lc(r.resourceBufferedViewportRingBboxForViewport, r.resourceMaskBbox);
		if (r.setResourceBufferedViewportRingBboxAndResourceMaskBboxIntersectionForViewport(c), !t.has(e) || !c) return [];
		let l = k_(fc(c), i, [r.image.width, r.image.height]);
		l = this.filterOutTilesCloseToSpriteTiles(l, r);
		let u = pc(r.resourceBufferedViewportRingBboxForViewport);
		l.sort((e, t) => I_(e, u) - I_(t, u));
		let d = l.map((e) => uv.fromWarpedMap(e, r));
		return r.setFetchableTilesForViewport(d), d;
	}
	getMapOverviewFetchableTilesForViewport(e, t, n, r) {
		if (!this.viewport) return [];
		let i = this.warpedMapList.getWarpedMap(e);
		if (!i || !i.options.visible || !i.hasImage() || t > this.viewport.viewportResolution * xv || n.size > Sv || r.length > 0) return [];
		let a = i.image.tileZoomLevels.filter((e) => H_(e) <= bv).sort((e, t) => e.scaleFactor - t.scaleFactor).at(-1);
		if (i.setOverviewTileZoomLevelForViewport(a), !n.has(e) || !a || i.tileZoomLevelForViewport && a.scaleFactor <= i.tileZoomLevelForViewport.scaleFactor) return [];
		let o = F_(a.scaleFactor, i.image);
		o = this.filterOutTilesCloseToSpriteTiles(o, i);
		let s = o.map((e) => uv.fromWarpedMap(e, i));
		return i.setOverviewFetchableTilesForViewport(s), s;
	}
	updateMapsForViewport(e) {
		this.mapsWithFetchableTilesForViewport = new Set(e.map((e) => e.mapId).sort((e, t) => this.warpedMapList.orderMapIdsByZIndex(e, t))), this.mapsInPreviousViewport = this.mapsInViewport, this.mapsInViewport = this.findMapsInViewport();
		let t = Array.from(this.mapsInPreviousViewport), n = Array.from(this.mapsInViewport), r = n.filter((e) => !t.includes(e)), i = t.filter((e) => !n.includes(e));
		for (let e of r) this.dispatchEvent(new I(F.WARPEDMAPENTERED, { mapIds: [e] }));
		for (let e of i) this.clearMap(e), this.dispatchEvent(new I(F.WARPEDMAPLEFT, { mapIds: [e] }));
		return {
			mapsEnteringViewport: r,
			mapsLeavingViewport: i
		};
	}
	pruneTileCache(e) {
		let t = /* @__PURE__ */ new Map();
		for (let n of this.warpedMapList.getWarpedMaps({ mapIds: e })) t.set(n.mapId, {
			tileZoomLevelForViewport: n.tileZoomLevelForViewport,
			overviewTileZoomLevelForViewport: n.overviewTileZoomLevelForViewport,
			resourceViewportRingBboxForViewport: n.resourceBufferedViewportRingBboxForViewport
		});
		this.tileCache.prune(t);
	}
	filterOutTilesCloseToSpriteTiles(e, t) {
		let n = this.tileCache.getMapCachedTiles(t.mapId).filter((e) => e.isTileFromSprites()).map((e) => e.fetchableTile.tile.tileZoomLevel.scaleFactor);
		return e.filter((e) => {
			for (let t of n) {
				let n = Math.log2(e.tileZoomLevel.scaleFactor) - Math.log2(t), r = n <= vv, i = -n <= yv;
				if (r && i) return !1;
			}
			return !0;
		});
	}
	destroy() {
		this.tileCache.destroy(), this.warpedMapList.destroy();
	}
	clearMap(e) {}
	mapTileLoaded(e) {}
	mapTileDeleted(e) {}
	imageLoaded(e) {}
	warpedMapAdded(e) {}
	warpedMapRemoved(e) {}
	prepareChange(e) {}
	immediateChange(e) {}
	animatedChange(e) {}
	addEventListeners() {
		this.tileCache.addEventListener(F.MAPTILELOADED, this.mapTileLoaded.bind(this)), this.tileCache.addEventListener(F.MAPTILEDELETED, this.mapTileDeleted.bind(this)), this.warpedMapList.addEventListener(F.IMAGELOADED, this.imageLoaded.bind(this)), this.warpedMapList.addEventListener(F.WARPEDMAPADDED, this.warpedMapAdded.bind(this)), this.warpedMapList.addEventListener(F.WARPEDMAPREMOVED, this.warpedMapRemoved.bind(this)), this.warpedMapList.addEventListener(F.PREPARECHANGE, this.prepareChange.bind(this)), this.warpedMapList.addEventListener(F.ANIMATEDCHANGE, this.animatedChange.bind(this)), this.warpedMapList.addEventListener(F.IMMEDIATECHANGE, this.immediateChange.bind(this));
	}
	removeEventListeners() {
		this.tileCache.removeEventListener(F.MAPTILELOADED, this.mapTileLoaded.bind(this)), this.tileCache.removeEventListener(F.MAPTILEDELETED, this.mapTileDeleted.bind(this)), this.warpedMapList.removeEventListener(F.IMAGELOADED, this.imageLoaded.bind(this)), this.warpedMapList.removeEventListener(F.WARPEDMAPADDED, this.warpedMapAdded.bind(this)), this.warpedMapList.removeEventListener(F.WARPEDMAPREMOVED, this.warpedMapRemoved.bind(this)), this.warpedMapList.removeEventListener(F.PREPARECHANGE, this.prepareChange.bind(this)), this.warpedMapList.removeEventListener(F.IMMEDIATECHANGE, this.immediateChange.bind(this)), this.warpedMapList.removeEventListener(F.ANIMATEDCHANGE, this.animatedChange.bind(this));
	}
}, Tv = class extends EventTarget {
	fetchableTile;
	fetchFn;
	abortController;
	data;
	cachedTilesFromSprites;
	constructor(e, t) {
		super(), this.fetchableTile = e, this.fetchFn = t, this.abortController = new AbortController();
	}
	isCachedTile() {
		return this.data !== void 0;
	}
	isTileFromSprites() {
		return this.fetchableTile.options?.spritesInfo != null;
	}
	getCachedTilesFromSprites() {
		return this.cachedTilesFromSprites;
	}
	abort() {
		this.abortController.signal.aborted || this.abortController.abort();
	}
	shouldPrune(e, t) {
		let n = this.fetchableTile.tile;
		if (this.isTileFromSprites()) return !1;
		if (!e) return !0;
		if (e.overviewTileZoomLevelForViewport && n.tileZoomLevel.scaleFactor == e.overviewTileZoomLevelForViewport.scaleFactor) return !1;
		if (e.resourceViewportRingBboxForViewport === void 0 || e.tileZoomLevelForViewport === void 0) return !0;
		let r = Math.log2(n.tileZoomLevel.scaleFactor) - Math.log2(e.tileZoomLevelForViewport.scaleFactor);
		return r > t.maxHigherLog2ScaleFactorDiff || -r > t.maxLowerLog2ScaleFactorDiff || !cc(dc(z_(n), Math.max(0, r)), e.resourceViewportRingBboxForViewport);
	}
}, Ev = class e extends Tv {
	#e;
	#t;
	constructor(e, t, n, r) {
		super(e, r), this.#e = t, this.#t = n;
	}
	async fetch() {
		try {
			this.#e.getImageData(this.fetchableTile.tileUrl, Ja(() => this.abortController.abort()), this.fetchFn, this.fetchableTile.tile.tileZoomLevel.width, this.fetchableTile.tile.tileZoomLevel.height).then((e) => {
				this.data = e, this.dispatchEvent(new I(F.TILEFETCHED, { tileUrl: this.fetchableTile.tileUrl }));
			}).catch((e) => {
				e instanceof Error && e.name === "AbortError" ? console.log("Fetch aborted") : console.error(e);
			});
		} catch (e) {
			e instanceof Error && e.name === "AbortError" || this.dispatchEvent(new I(F.TILEFETCHERROR, { tileUrl: this.fetchableTile.tileUrl }));
		}
		return this.data;
	}
	async applySprites() {
		let e = this.data, t = this.fetchableTile.options?.spritesInfo, n = this.fetchableTile.options?.warpedMapsByResourceId;
		if (!e || !t || !n) return;
		let r = new Map(Array.from(n.entries()).map(([e, t]) => [e, t.map((e) => e.tileSize)]));
		return this.#t.applySprites(e, t.sprites, r).then((e) => {
			this.cachedTilesFromSprites = this.spritesDataToCachedTiles(e, t, n), this.dispatchEvent(new I(F.TILESFROMSPRITETILE, { tileUrl: this.fetchableTile.tileUrl }));
		});
	}
	spritesDataToCachedTiles(e, t, n) {
		let r = [], i = 0;
		for (let a of t.sprites) {
			let o = n.get(a.imageId);
			if (!o) break;
			for (let n of o) {
				let o = new Dv(uv.fromSprite(a, t.imageSize, n, { spritesInfo: t }), this.#e, this.#t, e[i]);
				r.push(o), i++;
			}
		}
		return r;
	}
	static createFactory(t, n) {
		return (r, i) => new e(r, t, n, i);
	}
}, Dv = class extends Ev {
	constructor(e, t, n, r) {
		super(e, t, n), this.data = r;
	}
}, Ov = {
	rotation: 0,
	devicePixelRatio: 1,
	projection: Gu
}, kv = { zoom: 1 }, Av = { fit: "contain" }, jv = class e {
	geoCenter;
	geoRectangle;
	geoSize;
	geoResolution;
	geoRectangleBbox;
	projection;
	projectedGeoCenter;
	projectedGeoRectangle;
	projectedGeoSize;
	projectedGeoResolution;
	projectedGeoRectangleBbox;
	rotation;
	projectedGeoPerViewportScale;
	viewportCenter;
	viewportRectangle;
	viewportSize;
	viewportResolution;
	viewportBbox;
	devicePixelRatio;
	canvasCenter;
	canvasRectangle;
	canvasSize;
	canvasResolution;
	canvasBbox;
	projectedGeoPerCanvasScale;
	projectedGeoToViewportHomogeneousTransform = [
		1,
		0,
		0,
		1,
		0,
		0
	];
	projectedGeoToCanvasHomogeneousTransform = [
		1,
		0,
		0,
		1,
		0,
		0
	];
	projectedGeoToClipHomogeneousTransform = [
		1,
		0,
		0,
		1,
		0,
		0
	];
	viewportToClipHomogeneousTransform = [
		1,
		0,
		0,
		1,
		0,
		0
	];
	constructor(e, t, n, r) {
		let i = M(Ov, r);
		this.projectedGeoCenter = t, this.projectedGeoPerViewportScale = n, this.rotation = i.rotation, this.viewportSize = [Math.round(e[0]), Math.round(e[1])], this.devicePixelRatio = i.devicePixelRatio, this.projection = i.projection, this.projectedGeoRectangle = this.computeProjectedGeoRectangle(this.viewportSize, this.projectedGeoPerViewportScale, this.rotation, this.projectedGeoCenter), this.projectedGeoRectangleBbox = j(this.projectedGeoRectangle), this.projectedGeoSize = vc(this.viewportSize, n), this.projectedGeoResolution = yc(this.projectedGeoSize), this.geoRectangle = this.projectedGeoRectangle.map((e) => o(this.projection.definition, Wu.definition, Xu(this.projection, Gu) ? sc(e) : e)), this.geoRectangleBbox = j(this.geoRectangle), this.geoCenter = pc(this.geoRectangleBbox), this.geoSize = mc(this.geoRectangleBbox), this.geoResolution = yc(this.geoSize), this.viewportResolution = yc(this.viewportSize), this.viewportCenter = bc(this.viewportSize), this.viewportBbox = xc(this.viewportSize), this.viewportRectangle = fc(this.viewportBbox), this.canvasCenter = ys(this.viewportCenter, this.devicePixelRatio), this.canvasSize = vc(this.viewportSize, this.devicePixelRatio), this.canvasResolution = yc(this.canvasSize), this.canvasBbox = xc(this.canvasSize), this.canvasRectangle = fc(this.canvasBbox), this.projectedGeoPerCanvasScale = this.projectedGeoPerViewportScale / this.devicePixelRatio, this.projectedGeoToViewportHomogeneousTransform = this.composeProjectedGeoToViewportHomogeneousTransform(), this.projectedGeoToCanvasHomogeneousTransform = this.composeProjectedGeoToCanvasHomogeneousTransform(), this.projectedGeoToClipHomogeneousTransform = this.composeProjectedGeoToClipHomogeneousTransform(), this.viewportToClipHomogeneousTransform = this.composeViewportToClipHomogeneousTransform();
	}
	static fromSizeAndMaps(e, t, n) {
		let r = t.getMapsConvexHull(n);
		if (!r) throw Error("Maps have no projected convex hull. Possibly because WarpedMapList or Array is empty.");
		return this.fromSizeAndProjectedGeoPolygon(e, [r], n);
	}
	static fromSizeAndGeoPolygon(e, t, n) {
		let r = M({
			...Ov,
			...kv,
			...Av
		}, n), i = t.map((e) => e.map((e) => o(r.projection.definition, e)));
		return this.fromSizeAndProjectedGeoPolygon(e, i, n);
	}
	static fromSizeAndProjectedGeoPolygon(t, n, r) {
		let i = M({
			...Ov,
			...kv,
			...Av
		}, r), a = n[0], o = j(ws(a, -i.rotation)), s = mc(o), c = pc(o), l = _c(s, t, i.fit);
		return new e(t, Cs(c, i.rotation), l * i.zoom, i);
	}
	static fromScaleAndMaps(e, t, n) {
		let r = t.getMapsConvexHull(n);
		if (!r) throw Error("Maps have no projected convex hull. Possibly because WarpedMapList or Array is empty.");
		return this.fromScaleAndProjectedGeoPolygon(e, [r], n);
	}
	static fromScaleAndGeoPolygon(e, t, n) {
		let r = M({
			...Ov,
			...kv,
			...Av
		}, n), i = t.map((e) => e.map((e) => o(r.projection.definition, e)));
		return this.fromScaleAndProjectedGeoPolygon(e, i, n);
	}
	static fromScaleAndProjectedGeoPolygon(t, n, r) {
		let i = M({
			...Ov,
			...kv
		}, r), a = n[0], o = j(bs(ws(a, -i.rotation), 1 / t));
		return new e(mc(o), Cs(ys(pc(o), t), i.rotation), t * i.zoom, i);
	}
	getProjectedGeoBufferedRectangle(e) {
		return fc(dc(this.viewportBbox, e)).map((e) => p_(__(this.projectedGeoToViewportHomogeneousTransform), e));
	}
	getGeoBufferedRectangle(e) {
		return this.getProjectedGeoBufferedRectangle(e).map((e) => o(this.projection.definition, Wu.definition, Xu(this.projection, Gu) ? sc(e) : e));
	}
	composeProjectedGeoToViewportHomogeneousTransform() {
		return g_(this.viewportCenter[0], this.viewportCenter[1], 1 / this.projectedGeoPerViewportScale, -1 / this.projectedGeoPerViewportScale, -this.rotation, -this.projectedGeoCenter[0], -this.projectedGeoCenter[1]);
	}
	composeProjectedGeoToCanvasHomogeneousTransform() {
		return g_(this.canvasCenter[0], this.canvasCenter[1], 1 / this.projectedGeoPerCanvasScale, -1 / this.projectedGeoPerCanvasScale, -this.rotation, -this.projectedGeoCenter[0], -this.projectedGeoCenter[1]);
	}
	composeProjectedGeoToClipHomogeneousTransform() {
		return g_(0, 0, 2 / (this.projectedGeoPerViewportScale * this.viewportSize[0]), 2 / (this.projectedGeoPerViewportScale * this.viewportSize[1]), -this.rotation, -this.projectedGeoCenter[0], -this.projectedGeoCenter[1]);
	}
	composeViewportToClipHomogeneousTransform() {
		return g_(0, 0, 2 / this.viewportSize[0], -2 / this.viewportSize[1], 0, -this.viewportCenter[0], -this.viewportCenter[1]);
	}
	computeProjectedGeoRectangle(e, t, n, r) {
		let i = Sc(vc(e, t));
		return Ss(ws(Ss(i, ps(...i), "substract"), n), r);
	}
}, Mv = "#version 300 es\n\nprecision highp float;\n\nfloat easing(float t) {\n  return t;\n\n  \n  \n}\n\nuniform mat4 u_renderHomogeneousTransform;\nuniform float u_animationProgress;\n\nin vec2 a_resourceTrianglePoint;\nin vec2 a_clipPreviousTrianglePoint;\nin vec2 a_clipTrianglePoint;\nin float a_previousTrianglePointDistortion;\nin float a_trianglePointDistortion;\nin float a_trianglePointIndex;\n\nout vec2 v_resourceTrianglePoint;\nout float v_trianglePointDistortion;\nout float v_trianglePointIndex;\nout vec4 v_trianglePointBarycentric;\n\nvoid main() {\n  \n  vec2 clipTrianglePoint = mix(a_clipPreviousTrianglePoint, a_clipTrianglePoint, easing(u_animationProgress));\n  float trianglePointDistortion = mix(a_previousTrianglePointDistortion, a_trianglePointDistortion, easing(u_animationProgress));\n\n  \n  \n  \n\n  gl_Position = u_renderHomogeneousTransform * vec4(clipTrianglePoint, 0.0f, 1.0f);\n\n  \n  v_resourceTrianglePoint = a_resourceTrianglePoint;\n  v_trianglePointDistortion = trianglePointDistortion;\n  v_trianglePointIndex = a_trianglePointIndex;\n\n  float trianglePointLocalIndex = mod(a_trianglePointIndex, 3.0f);\n  if(trianglePointLocalIndex == 0.0f)\n    v_trianglePointBarycentric = vec4(1.0f, 0, 0, 1.0f);\n  if(trianglePointLocalIndex == 1.0f)\n    v_trianglePointBarycentric = vec4(0.0f, 1.0f, 0, 1.0f);\n  if(trianglePointLocalIndex == 2.0f)\n    v_trianglePointBarycentric = vec4(0.0f, 0, 1.0f, 1.0f);\n}", Nv = "#version 300 es\n\nprecision highp float;\nprecision highp isampler2D;\n\nfloat easing(float t) {\n  return t;\n\n  \n  \n}\n\nuniform float u_opacity;\nuniform float u_saturation;\n\nuniform bool u_removeColor;\nuniform vec3 u_removeColorColor;\nuniform float u_removeColorThreshold;\nuniform float u_removeColorHardness;\n\nuniform bool u_colorize;\nuniform vec3 u_colorizeColor;\n\nuniform bool u_renderGrid;\nuniform vec4 u_renderGridColor;\n\nuniform bool u_distortion;\nuniform int u_distortionMeasure;\nuniform vec4 u_distortionColor00;\nuniform vec4 u_distortionColor01;\nuniform vec4 u_distortionColor1;\nuniform vec4 u_distortionColor2;\nuniform vec4 u_distortionColor3;\n\nuniform int u_scaleFactorForViewport;\n\nuniform lowp sampler2DArray u_cachedTilesTextureArray;\nuniform isampler2D u_cachedTilesResourceOriginPointsAndSizesTexture;\nuniform isampler2D u_cachedTilesScaleFactorsTexture;\n\nuniform float u_debugTriangles;\nuniform float u_debugTiles;\n\nin vec2 v_resourceTrianglePoint;\nin float v_trianglePointDistortion;\nin float v_trianglePointIndex;\nin vec4 v_trianglePointBarycentric;\n\nout vec4 color;\n\nvoid main() {\n  float resourceTrianglePointX = v_resourceTrianglePoint.x;\n  float resourceTrianglePointY = v_resourceTrianglePoint.y;\n\n  \n  ivec3 cachedTilesTextureSize = textureSize(u_cachedTilesTextureArray, 0);\n  int cachedTilesCount = cachedTilesTextureSize.z;\n\n  \n  int smallestScaleFactor;\n  bool found = false;\n  int foundIndex;\n\n  \n  vec3 cachedTilesTexturePoint = vec3(0.0f, 0.0f, 0.0f);\n\n  \n  color = vec4(0.0f, 0.0f, 0.0f, 0.0f);\n\n  \n  for(int index = 0; index < cachedTilesCount; index += 1) {\n\n    \n    float cachedTileResourceOriginPointX = float(texelFetch(u_cachedTilesResourceOriginPointsAndSizesTexture, ivec2(0, (index * 4)), 0));\n    float cachedTileResourceOriginPointY = float(texelFetch(u_cachedTilesResourceOriginPointsAndSizesTexture, ivec2(0, (index * 4) + 1), 0));\n    float cachedTileDimensionWidth = float(texelFetch(u_cachedTilesResourceOriginPointsAndSizesTexture, ivec2(0, (index * 4) + 2), 0));\n    float cachedTileDimensionHeight = float(texelFetch(u_cachedTilesResourceOriginPointsAndSizesTexture, ivec2(0, (index * 4) + 3), 0));\n\n    int cachedTileScaleFactor = texelFetch(u_cachedTilesScaleFactorsTexture, ivec2(0, index), 0).r;\n\n    \n    if(resourceTrianglePointX >= cachedTileResourceOriginPointX &&\n      resourceTrianglePointX < cachedTileResourceOriginPointX + cachedTileDimensionWidth &&\n      resourceTrianglePointY >= cachedTileResourceOriginPointY &&\n      resourceTrianglePointY < cachedTileResourceOriginPointY + cachedTileDimensionHeight) {\n\n      \n      \n      \n      \n      \n      if(!(smallestScaleFactor > 0) || cachedTileScaleFactor <= smallestScaleFactor) {\n        smallestScaleFactor = cachedTileScaleFactor;\n        found = true;\n        foundIndex = index;\n\n        float cachedTilePointX = (resourceTrianglePointX - cachedTileResourceOriginPointX) / float(cachedTileScaleFactor);\n        float cachedTilePointY = (resourceTrianglePointY - cachedTileResourceOriginPointY) / float(cachedTileScaleFactor);\n\n        float cachedTilesTexturePointX = cachedTilePointX / float(cachedTilesTextureSize.x);\n        float cachedTilesTexturePointY = cachedTilePointY / float(cachedTilesTextureSize.y);\n\n        cachedTilesTexturePoint = vec3(cachedTilesTexturePointX, cachedTilesTexturePointY, index);\n      }\n    }\n  }\n\n  if(found == true) {\n    \n    color = texture(u_cachedTilesTextureArray, cachedTilesTexturePoint);\n\n    if(u_removeColorThreshold > 0.0f) {\n  vec3 backgroundColorDiff = color.rgb - u_removeColorColor.rgb;\n  float backgroundColorDistance = length(backgroundColorDiff);\n  if(u_removeColor && backgroundColorDistance < u_removeColorThreshold) {\n    float amount = smoothstep(u_removeColorThreshold - u_removeColorThreshold * (1.0f - u_removeColorHardness), u_removeColorThreshold, backgroundColorDistance);\n    color = vec4(color.rgb * amount, amount);\n  }\n}\n\nfloat gray = 0.21f * color.r + 0.71f * color.g + 0.07f * color.b;\ncolor = vec4(color.rgb * (u_saturation) + (gray * (1.0f - u_saturation)), color.a);\n\nif(u_colorize) {\n  color = vec4((u_colorizeColor + color.rgb) * color.a, color.a);\n}\n\ncolor = vec4(color.rgb * u_opacity, color.a * u_opacity);\n    if(u_distortion) {\n  \n  \n\n  float trianglePointDistortion = v_trianglePointDistortion;\n\n  \n  \n  trianglePointDistortion = floor(trianglePointDistortion * 10.0f) / 10.0f;\n\n  \n  float trianglePointDistortionMix = clamp(trianglePointDistortion, -1.0f, 1.0f);\n\n  switch(u_distortionMeasure) {\n    case 0:\n      if(trianglePointDistortion > 0.0f) {\n        color = mix(color, u_distortionColor00, trianglePointDistortionMix);\n      } else {\n        color = mix(color, u_distortionColor01, abs(trianglePointDistortionMix));\n      }\n      break;\n    case 1:\n      color = mix(color, u_distortionColor1, trianglePointDistortionMix);\n      break;\n    case 2:\n      color = mix(color, u_distortionColor2, trianglePointDistortionMix);\n      break;\n    case 3:\n      color = trianglePointDistortion == -1.0f ? u_distortionColor3 : color;\n      break;\n    default:\n      color = color;\n  }\n}\n\nif(u_renderGrid) {\n  float gridSize = 20.0f * float(u_scaleFactorForViewport);\n  float gridWidth = 2.0f * float(u_scaleFactorForViewport);\n  if(mod(float(resourceTrianglePointX) + gridWidth / 2.0f, gridSize) < gridWidth || mod(float(resourceTrianglePointY) + gridWidth / 2.0f, gridSize) < gridWidth) {\n    color = u_renderGridColor;\n  }\n}\n    float viewportWidth = 4.0;\n\nif(bool(u_debugTriangles)) {\n  \n  \n  \n\n  float barycentricTriangleDist = min(min(v_trianglePointBarycentric.x, v_trianglePointBarycentric.y), v_trianglePointBarycentric.z);\n  \n  \n  float barycentricTriangleDistPixelSize = length(vec2(dFdx(barycentricTriangleDist), dFdy(barycentricTriangleDist)));\n  \n  float TriangleDistThreshold = viewportWidth * barycentricTriangleDistPixelSize / 2.0;\n\n  if(barycentricTriangleDist < TriangleDistThreshold) {\n    color = vec4(0.0, 0.0, 0.0, 1.0);\n  }\n}\n\nif(bool(u_debugTiles)) {\n  float resourceDist = min(cachedTilesTexturePoint.x, cachedTilesTexturePoint.y);\n  \n  \n  float resourceDistPixelSize = length(vec2(dFdx(resourceDist), dFdy(resourceDist)));\n  float resourceDistThreshold = viewportWidth * resourceDistPixelSize;\n\n  if(resourceDist < resourceDistThreshold) {\n    color = vec4(0.0, 0.0, 1.0, 1.0);\n  }\n}\n  }\n}", Pv = "#version 300 es\n\nprecision highp float;\n\nfloat easing(float t) {\n  return t;\n\n  \n  \n}\n\nuniform mat4 u_renderHomogeneousTransform;\nuniform mat4 u_viewportToClipHomogeneousTransform;\nuniform mat4 u_clipToViewportHomogeneousTransform;\nuniform float u_animationProgress;\n\nin vec2 a_clipPoint;\nin vec2 a_clipOtherPoint;\nin vec2 a_clipPreviousPoint;\nin vec2 a_clipPreviousOtherPoint;\nin float a_isOtherPoint;\nin float a_normalSign;\nin float a_viewportSize;\nin vec4 a_color;\nin float a_viewportBorderSize;\nin vec4 a_borderColor;\n\nout float v_viewportLineLength;\nout vec2 v_linePoint;\nout float v_viewportSize;\nout vec4 v_color;\nout float v_viewportBorderSize;\nout vec4 v_borderColor;\nout float v_viewportFeatherSize;\nout float v_viewportTotalSize;\n\nvoid main() {\n  vec2 clipPoint = mix(a_clipPreviousPoint, a_clipPoint, easing(u_animationProgress));\n  vec2 clipOtherPoint = mix(a_clipPreviousOtherPoint, a_clipOtherPoint, easing(u_animationProgress));\n\n  vec2 viewportPoint = (u_clipToViewportHomogeneousTransform * u_renderHomogeneousTransform * vec4(clipPoint, 0.0f, 1.0f)).xy;\n  vec2 viewportOtherPoint = (u_clipToViewportHomogeneousTransform * u_renderHomogeneousTransform * vec4(clipOtherPoint, 0.0f, 1.0f)).xy;\n\n  vec2 viewportLine = vec2(viewportOtherPoint.x-viewportPoint.x, viewportOtherPoint.y-viewportPoint.y);\n  vec2 viewportNormalizedLine = normalize(viewportLine);\n  vec2 viewportNormalizedLineNormal = vec2(viewportNormalizedLine.y, -viewportNormalizedLine.x);\n  v_viewportLineLength = length(viewportLine);\n\n  v_viewportFeatherSize = 1.0;\n\n  v_viewportTotalSize = a_viewportSize + a_viewportBorderSize + v_viewportFeatherSize;\n  float lineX = -1.0 * v_viewportTotalSize / 2.0 + a_isOtherPoint * (v_viewportLineLength + 2.0 * (v_viewportTotalSize / 2.0));\n  float lineY = a_normalSign * v_viewportTotalSize / 2.0;\n  v_linePoint = vec2(lineX, lineY);\n  \n  \n  \n  \n  \n  \n\n  v_viewportSize = a_viewportSize;\n  v_color = a_color;\n  v_viewportBorderSize = a_viewportBorderSize;\n  v_borderColor = a_borderColor;\n\n  gl_Position =  u_viewportToClipHomogeneousTransform * vec4(viewportPoint + lineX * viewportNormalizedLine + lineY * viewportNormalizedLineNormal, 0, 1);\n}", Fv = "#version 300 es\n\nprecision highp float;\nprecision highp isampler2D;\n\nin float v_viewportLineLength;\nin vec2 v_linePoint;\nin float v_viewportSize;\nin vec4 v_color;\nin float v_viewportBorderSize;\nin vec4 v_borderColor;\nin float v_viewportFeatherSize;\nin float v_viewportTotalSize;\n\nout vec4 color;\n\nvoid main() {\n  float distance;\n  if (v_linePoint.x < 0.0) {\n    distance = length(v_linePoint - vec2(0.0,0.0)) / (v_viewportTotalSize / 2.0);\n  } else if (v_linePoint.x > v_viewportLineLength) {\n    distance = length(v_linePoint - vec2(v_viewportLineLength,0.0)) / (v_viewportTotalSize / 2.0);\n  } else {\n    distance = abs(v_linePoint.y) / (v_viewportTotalSize / 2.0);\n  }\n  if (distance > 1.0) {\n    discard;\n  }\n  float viewportDistance = distance * v_viewportTotalSize / 2.0;\n\n  \n  color = vec4(0, 0, 0, 0);\n  if (v_viewportSize >= v_viewportFeatherSize) {\n    color = v_color;\n  }\n\n  \n  \n  \n  float borderSmoothStep;\n  if(v_viewportBorderSize >= v_viewportFeatherSize) {\n    borderSmoothStep = smoothstep(\n      v_viewportSize / 2.0 - v_viewportBorderSize / 2.0 - v_viewportFeatherSize / 2.0,\n      v_viewportSize / 2.0 - v_viewportBorderSize / 2.0 + v_viewportFeatherSize / 2.0,\n      viewportDistance\n    );\n    color = ((1.0 - borderSmoothStep) * color) + (borderSmoothStep * v_borderColor);\n  }\n\n  \n  \n  \n  borderSmoothStep = smoothstep(\n      v_viewportSize / 2.0 + v_viewportBorderSize / 2.0 - v_viewportFeatherSize / 2.0,\n      v_viewportSize / 2.0 + v_viewportBorderSize / 2.0 + v_viewportFeatherSize / 2.0,\n      viewportDistance\n  );\n  color = ((1.0 - borderSmoothStep) * color) + (borderSmoothStep * vec4(0, 0, 0, 0));\n}", Iv = "#version 300 es\n\nprecision highp float;\n\nfloat easing(float t) {\n  return t;\n\n  \n  \n}\n\nuniform mat4 u_renderHomogeneousTransform;\nuniform float u_animationProgress;\nuniform float u_devicePixelRatio;\n\nin float a_viewportSize;\nin vec4 a_color;\nin float a_viewportBorderSize;\nin vec4 a_borderColor;\n\nin vec2 a_clipPoint;\nin vec2 a_clipPreviousPoint;\n\nout float v_viewportSize;\nout vec4 v_color;\nout float v_viewportBorderSize;\nout vec4 v_borderColor;\nout float v_viewportFeatherSize;\nout float v_viewportTotalSize;\n\nvoid main() {\n  vec2 clipPoint = mix(a_clipPreviousPoint, a_clipPoint, easing(u_animationProgress));\n\n  gl_Position = u_renderHomogeneousTransform * vec4(clipPoint, 0.0f, 1.0f);\n\n  v_viewportFeatherSize = 1.0;\n\n  v_viewportTotalSize = a_viewportSize + a_viewportBorderSize + v_viewportFeatherSize;\n  gl_PointSize = v_viewportTotalSize * u_devicePixelRatio;\n  \n  \n  \n  \n  \n  \n  \n\n  v_viewportSize = a_viewportSize;\n  v_color = a_color;\n  v_viewportBorderSize = a_viewportBorderSize;\n  v_borderColor = a_borderColor;\n}", Lv = "#version 300 es\n\nprecision highp float;\nprecision highp isampler2D;\n\nin float v_viewportSize;\nin vec4 v_color;\nin float v_viewportBorderSize;\nin vec4 v_borderColor;\nin float v_viewportFeatherSize;\nin float v_viewportTotalSize;\n\nout vec4 color;\n\nvoid main() {\n  \n  float distance = length(2.0 * gl_PointCoord - 1.0);\n  if (distance > 1.0) {\n    discard;\n  }\n  float viewportDistance = distance * v_viewportTotalSize / 2.0;\n\n  \n  color = vec4(0, 0, 0, 0);\n  if (v_viewportSize >= v_viewportFeatherSize) {\n    color = v_color;\n  }\n\n  \n  \n  \n  float borderSmoothStep;\n  if(v_viewportBorderSize >= v_viewportFeatherSize) {\n    borderSmoothStep = smoothstep(\n      v_viewportSize / 2.0 - v_viewportBorderSize / 2.0 - v_viewportFeatherSize / 2.0,\n      v_viewportSize / 2.0 - v_viewportBorderSize / 2.0 + v_viewportFeatherSize / 2.0,\n      viewportDistance\n    );\n    color = ((1.0 - borderSmoothStep) * color) + (borderSmoothStep * v_borderColor);\n  }\n\n  \n  \n  \n  borderSmoothStep = smoothstep(\n      v_viewportSize / 2.0 + v_viewportBorderSize / 2.0 - v_viewportFeatherSize / 2.0,\n      v_viewportSize / 2.0 + v_viewportBorderSize / 2.0 + v_viewportFeatherSize / 2.0,\n      viewportDistance\n  );\n  color = ((1.0 - borderSmoothStep) * color) + (borderSmoothStep * vec4(0, 0, 0, 0));\n}", Rv = typeof self < "u" && self.Blob && new Blob(["URL.revokeObjectURL(import.meta.url);", ((e) => Uint8Array.from(atob(e), (e) => e.charCodeAt(0)))("LyoqCiAqIEBsaWNlbnNlCiAqIENvcHlyaWdodCAyMDE5IEdvb2dsZSBMTEMKICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFwYWNoZS0yLjAKICovCmNvbnN0IHByb3h5TWFya2VyID0gU3ltYm9sKCJDb21saW5rLnByb3h5Iik7CmNvbnN0IGNyZWF0ZUVuZHBvaW50ID0gU3ltYm9sKCJDb21saW5rLmVuZHBvaW50Iik7CmNvbnN0IHJlbGVhc2VQcm94eSA9IFN5bWJvbCgiQ29tbGluay5yZWxlYXNlUHJveHkiKTsKY29uc3QgZmluYWxpemVyID0gU3ltYm9sKCJDb21saW5rLmZpbmFsaXplciIpOwpjb25zdCB0aHJvd01hcmtlciA9IFN5bWJvbCgiQ29tbGluay50aHJvd24iKTsKY29uc3QgaXNPYmplY3QgPSAodmFsKSA9PiB0eXBlb2YgdmFsID09PSAib2JqZWN0IiAmJiB2YWwgIT09IG51bGwgfHwgdHlwZW9mIHZhbCA9PT0gImZ1bmN0aW9uIjsKY29uc3QgcHJveHlUcmFuc2ZlckhhbmRsZXIgPSB7CiAgY2FuSGFuZGxlOiAodmFsKSA9PiBpc09iamVjdCh2YWwpICYmIHZhbFtwcm94eU1hcmtlcl0sCiAgc2VyaWFsaXplKG9iaikgewogICAgY29uc3QgeyBwb3J0MSwgcG9ydDIgfSA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpOwogICAgZXhwb3NlKG9iaiwgcG9ydDEpOwogICAgcmV0dXJuIFtwb3J0MiwgW3BvcnQyXV07CiAgfSwKICBkZXNlcmlhbGl6ZShwb3J0KSB7CiAgICBwb3J0LnN0YXJ0KCk7CiAgICByZXR1cm4gd3JhcChwb3J0KTsKICB9Cn07CmNvbnN0IHRocm93VHJhbnNmZXJIYW5kbGVyID0gewogIGNhbkhhbmRsZTogKHZhbHVlKSA9PiBpc09iamVjdCh2YWx1ZSkgJiYgdGhyb3dNYXJrZXIgaW4gdmFsdWUsCiAgc2VyaWFsaXplKHsgdmFsdWUgfSkgewogICAgbGV0IHNlcmlhbGl6ZWQ7CiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBFcnJvcikgewogICAgICBzZXJpYWxpemVkID0gewogICAgICAgIGlzRXJyb3I6IHRydWUsCiAgICAgICAgdmFsdWU6IHsKICAgICAgICAgIG1lc3NhZ2U6IHZhbHVlLm1lc3NhZ2UsCiAgICAgICAgICBuYW1lOiB2YWx1ZS5uYW1lLAogICAgICAgICAgc3RhY2s6IHZhbHVlLnN0YWNrCiAgICAgICAgfQogICAgICB9OwogICAgfSBlbHNlIHsKICAgICAgc2VyaWFsaXplZCA9IHsgaXNFcnJvcjogZmFsc2UsIHZhbHVlIH07CiAgICB9CiAgICByZXR1cm4gW3NlcmlhbGl6ZWQsIFtdXTsKICB9LAogIGRlc2VyaWFsaXplKHNlcmlhbGl6ZWQpIHsKICAgIGlmIChzZXJpYWxpemVkLmlzRXJyb3IpIHsKICAgICAgdGhyb3cgT2JqZWN0LmFzc2lnbihuZXcgRXJyb3Ioc2VyaWFsaXplZC52YWx1ZS5tZXNzYWdlKSwgc2VyaWFsaXplZC52YWx1ZSk7CiAgICB9CiAgICB0aHJvdyBzZXJpYWxpemVkLnZhbHVlOwogIH0KfTsKY29uc3QgdHJhbnNmZXJIYW5kbGVycyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKFsKICBbInByb3h5IiwgcHJveHlUcmFuc2ZlckhhbmRsZXJdLAogIFsidGhyb3ciLCB0aHJvd1RyYW5zZmVySGFuZGxlcl0KXSk7CmZ1bmN0aW9uIGlzQWxsb3dlZE9yaWdpbihhbGxvd2VkT3JpZ2lucywgb3JpZ2luKSB7CiAgZm9yIChjb25zdCBhbGxvd2VkT3JpZ2luIG9mIGFsbG93ZWRPcmlnaW5zKSB7CiAgICBpZiAob3JpZ2luID09PSBhbGxvd2VkT3JpZ2luIHx8IGFsbG93ZWRPcmlnaW4gPT09ICIqIikgewogICAgICByZXR1cm4gdHJ1ZTsKICAgIH0KICAgIGlmIChhbGxvd2VkT3JpZ2luIGluc3RhbmNlb2YgUmVnRXhwICYmIGFsbG93ZWRPcmlnaW4udGVzdChvcmlnaW4pKSB7CiAgICAgIHJldHVybiB0cnVlOwogICAgfQogIH0KICByZXR1cm4gZmFsc2U7Cn0KZnVuY3Rpb24gZXhwb3NlKG9iaiwgZXAgPSBnbG9iYWxUaGlzLCBhbGxvd2VkT3JpZ2lucyA9IFsiKiJdKSB7CiAgZXAuYWRkRXZlbnRMaXN0ZW5lcigibWVzc2FnZSIsIGZ1bmN0aW9uIGNhbGxiYWNrKGV2KSB7CiAgICBpZiAoIWV2IHx8ICFldi5kYXRhKSB7CiAgICAgIHJldHVybjsKICAgIH0KICAgIGlmICghaXNBbGxvd2VkT3JpZ2luKGFsbG93ZWRPcmlnaW5zLCBldi5vcmlnaW4pKSB7CiAgICAgIGNvbnNvbGUud2FybihgSW52YWxpZCBvcmlnaW4gJyR7ZXYub3JpZ2lufScgZm9yIGNvbWxpbmsgcHJveHlgKTsKICAgICAgcmV0dXJuOwogICAgfQogICAgY29uc3QgeyBpZCwgdHlwZSwgcGF0aCB9ID0gT2JqZWN0LmFzc2lnbih7IHBhdGg6IFtdIH0sIGV2LmRhdGEpOwogICAgY29uc3QgYXJndW1lbnRMaXN0ID0gKGV2LmRhdGEuYXJndW1lbnRMaXN0IHx8IFtdKS5tYXAoZnJvbVdpcmVWYWx1ZSk7CiAgICBsZXQgcmV0dXJuVmFsdWU7CiAgICB0cnkgewogICAgICBjb25zdCBwYXJlbnQgPSBwYXRoLnNsaWNlKDAsIC0xKS5yZWR1Y2UoKG9iajIsIHByb3ApID0+IG9iajJbcHJvcF0sIG9iaik7CiAgICAgIGNvbnN0IHJhd1ZhbHVlID0gcGF0aC5yZWR1Y2UoKG9iajIsIHByb3ApID0+IG9iajJbcHJvcF0sIG9iaik7CiAgICAgIHN3aXRjaCAodHlwZSkgewogICAgICAgIGNhc2UgIkdFVCI6CiAgICAgICAgICB7CiAgICAgICAgICAgIHJldHVyblZhbHVlID0gcmF3VmFsdWU7CiAgICAgICAgICB9CiAgICAgICAgICBicmVhazsKICAgICAgICBjYXNlICJTRVQiOgogICAgICAgICAgewogICAgICAgICAgICBwYXJlbnRbcGF0aC5zbGljZSgtMSlbMF1dID0gZnJvbVdpcmVWYWx1ZShldi5kYXRhLnZhbHVlKTsKICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSB0cnVlOwogICAgICAgICAgfQogICAgICAgICAgYnJlYWs7CiAgICAgICAgY2FzZSAiQVBQTFkiOgogICAgICAgICAgewogICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHJhd1ZhbHVlLmFwcGx5KHBhcmVudCwgYXJndW1lbnRMaXN0KTsKICAgICAgICAgIH0KICAgICAgICAgIGJyZWFrOwogICAgICAgIGNhc2UgIkNPTlNUUlVDVCI6CiAgICAgICAgICB7CiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gbmV3IHJhd1ZhbHVlKC4uLmFyZ3VtZW50TGlzdCk7CiAgICAgICAgICAgIHJldHVyblZhbHVlID0gcHJveHkodmFsdWUpOwogICAgICAgICAgfQogICAgICAgICAgYnJlYWs7CiAgICAgICAgY2FzZSAiRU5EUE9JTlQiOgogICAgICAgICAgewogICAgICAgICAgICBjb25zdCB7IHBvcnQxLCBwb3J0MiB9ID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7CiAgICAgICAgICAgIGV4cG9zZShvYmosIHBvcnQyKTsKICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSB0cmFuc2Zlcihwb3J0MSwgW3BvcnQxXSk7CiAgICAgICAgICB9CiAgICAgICAgICBicmVhazsKICAgICAgICBjYXNlICJSRUxFQVNFIjoKICAgICAgICAgIHsKICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSB2b2lkIDA7CiAgICAgICAgICB9CiAgICAgICAgICBicmVhazsKICAgICAgICBkZWZhdWx0OgogICAgICAgICAgcmV0dXJuOwogICAgICB9CiAgICB9IGNhdGNoICh2YWx1ZSkgewogICAgICByZXR1cm5WYWx1ZSA9IHsgdmFsdWUsIFt0aHJvd01hcmtlcl06IDAgfTsKICAgIH0KICAgIFByb21pc2UucmVzb2x2ZShyZXR1cm5WYWx1ZSkuY2F0Y2goKHZhbHVlKSA9PiB7CiAgICAgIHJldHVybiB7IHZhbHVlLCBbdGhyb3dNYXJrZXJdOiAwIH07CiAgICB9KS50aGVuKChyZXR1cm5WYWx1ZTIpID0+IHsKICAgICAgY29uc3QgW3dpcmVWYWx1ZSwgdHJhbnNmZXJhYmxlc10gPSB0b1dpcmVWYWx1ZShyZXR1cm5WYWx1ZTIpOwogICAgICBlcC5wb3N0TWVzc2FnZShPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHdpcmVWYWx1ZSksIHsgaWQgfSksIHRyYW5zZmVyYWJsZXMpOwogICAgICBpZiAodHlwZSA9PT0gIlJFTEVBU0UiKSB7CiAgICAgICAgZXAucmVtb3ZlRXZlbnRMaXN0ZW5lcigibWVzc2FnZSIsIGNhbGxiYWNrKTsKICAgICAgICBjbG9zZUVuZFBvaW50KGVwKTsKICAgICAgICBpZiAoZmluYWxpemVyIGluIG9iaiAmJiB0eXBlb2Ygb2JqW2ZpbmFsaXplcl0gPT09ICJmdW5jdGlvbiIpIHsKICAgICAgICAgIG9ialtmaW5hbGl6ZXJdKCk7CiAgICAgICAgfQogICAgICB9CiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHsKICAgICAgY29uc3QgW3dpcmVWYWx1ZSwgdHJhbnNmZXJhYmxlc10gPSB0b1dpcmVWYWx1ZSh7CiAgICAgICAgdmFsdWU6IG5ldyBUeXBlRXJyb3IoIlVuc2VyaWFsaXphYmxlIHJldHVybiB2YWx1ZSIpLAogICAgICAgIFt0aHJvd01hcmtlcl06IDAKICAgICAgfSk7CiAgICAgIGVwLnBvc3RNZXNzYWdlKE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgd2lyZVZhbHVlKSwgeyBpZCB9KSwgdHJhbnNmZXJhYmxlcyk7CiAgICB9KTsKICB9KTsKICBpZiAoZXAuc3RhcnQpIHsKICAgIGVwLnN0YXJ0KCk7CiAgfQp9CmZ1bmN0aW9uIGlzTWVzc2FnZVBvcnQoZW5kcG9pbnQpIHsKICByZXR1cm4gZW5kcG9pbnQuY29uc3RydWN0b3IubmFtZSA9PT0gIk1lc3NhZ2VQb3J0IjsKfQpmdW5jdGlvbiBjbG9zZUVuZFBvaW50KGVuZHBvaW50KSB7CiAgaWYgKGlzTWVzc2FnZVBvcnQoZW5kcG9pbnQpKQogICAgZW5kcG9pbnQuY2xvc2UoKTsKfQpmdW5jdGlvbiB3cmFwKGVwLCB0YXJnZXQpIHsKICBjb25zdCBwZW5kaW5nTGlzdGVuZXJzID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTsKICBlcC5hZGRFdmVudExpc3RlbmVyKCJtZXNzYWdlIiwgZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShldikgewogICAgY29uc3QgeyBkYXRhIH0gPSBldjsKICAgIGlmICghZGF0YSB8fCAhZGF0YS5pZCkgewogICAgICByZXR1cm47CiAgICB9CiAgICBjb25zdCByZXNvbHZlciA9IHBlbmRpbmdMaXN0ZW5lcnMuZ2V0KGRhdGEuaWQpOwogICAgaWYgKCFyZXNvbHZlcikgewogICAgICByZXR1cm47CiAgICB9CiAgICB0cnkgewogICAgICByZXNvbHZlcihkYXRhKTsKICAgIH0gZmluYWxseSB7CiAgICAgIHBlbmRpbmdMaXN0ZW5lcnMuZGVsZXRlKGRhdGEuaWQpOwogICAgfQogIH0pOwogIHJldHVybiBjcmVhdGVQcm94eShlcCwgcGVuZGluZ0xpc3RlbmVycywgW10sIHRhcmdldCk7Cn0KZnVuY3Rpb24gdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNSZWxlYXNlZCkgewogIGlmIChpc1JlbGVhc2VkKSB7CiAgICB0aHJvdyBuZXcgRXJyb3IoIlByb3h5IGhhcyBiZWVuIHJlbGVhc2VkIGFuZCBpcyBub3QgdXNlYWJsZSIpOwogIH0KfQpmdW5jdGlvbiByZWxlYXNlRW5kcG9pbnQoZXApIHsKICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKSwgewogICAgdHlwZTogIlJFTEVBU0UiCiAgfSkudGhlbigoKSA9PiB7CiAgICBjbG9zZUVuZFBvaW50KGVwKTsKICB9KTsKfQpjb25zdCBwcm94eUNvdW50ZXIgPSAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtNYXAoKTsKY29uc3QgcHJveHlGaW5hbGl6ZXJzID0gIkZpbmFsaXphdGlvblJlZ2lzdHJ5IiBpbiBnbG9iYWxUaGlzICYmIG5ldyBGaW5hbGl6YXRpb25SZWdpc3RyeSgoZXApID0+IHsKICBjb25zdCBuZXdDb3VudCA9IChwcm94eUNvdW50ZXIuZ2V0KGVwKSB8fCAwKSAtIDE7CiAgcHJveHlDb3VudGVyLnNldChlcCwgbmV3Q291bnQpOwogIGlmIChuZXdDb3VudCA9PT0gMCkgewogICAgcmVsZWFzZUVuZHBvaW50KGVwKTsKICB9Cn0pOwpmdW5jdGlvbiByZWdpc3RlclByb3h5KHByb3h5MiwgZXApIHsKICBjb25zdCBuZXdDb3VudCA9IChwcm94eUNvdW50ZXIuZ2V0KGVwKSB8fCAwKSArIDE7CiAgcHJveHlDb3VudGVyLnNldChlcCwgbmV3Q291bnQpOwogIGlmIChwcm94eUZpbmFsaXplcnMpIHsKICAgIHByb3h5RmluYWxpemVycy5yZWdpc3Rlcihwcm94eTIsIGVwLCBwcm94eTIpOwogIH0KfQpmdW5jdGlvbiB1bnJlZ2lzdGVyUHJveHkocHJveHkyKSB7CiAgaWYgKHByb3h5RmluYWxpemVycykgewogICAgcHJveHlGaW5hbGl6ZXJzLnVucmVnaXN0ZXIocHJveHkyKTsKICB9Cn0KZnVuY3Rpb24gY3JlYXRlUHJveHkoZXAsIHBlbmRpbmdMaXN0ZW5lcnMsIHBhdGggPSBbXSwgdGFyZ2V0ID0gZnVuY3Rpb24oKSB7Cn0pIHsKICBsZXQgaXNQcm94eVJlbGVhc2VkID0gZmFsc2U7CiAgY29uc3QgcHJveHkyID0gbmV3IFByb3h5KHRhcmdldCwgewogICAgZ2V0KF90YXJnZXQsIHByb3ApIHsKICAgICAgdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNQcm94eVJlbGVhc2VkKTsKICAgICAgaWYgKHByb3AgPT09IHJlbGVhc2VQcm94eSkgewogICAgICAgIHJldHVybiAoKSA9PiB7CiAgICAgICAgICB1bnJlZ2lzdGVyUHJveHkocHJveHkyKTsKICAgICAgICAgIHJlbGVhc2VFbmRwb2ludChlcCk7CiAgICAgICAgICBwZW5kaW5nTGlzdGVuZXJzLmNsZWFyKCk7CiAgICAgICAgICBpc1Byb3h5UmVsZWFzZWQgPSB0cnVlOwogICAgICAgIH07CiAgICAgIH0KICAgICAgaWYgKHByb3AgPT09ICJ0aGVuIikgewogICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgewogICAgICAgICAgcmV0dXJuIHsgdGhlbjogKCkgPT4gcHJveHkyIH07CiAgICAgICAgfQogICAgICAgIGNvbnN0IHIgPSByZXF1ZXN0UmVzcG9uc2VNZXNzYWdlKGVwLCBwZW5kaW5nTGlzdGVuZXJzLCB7CiAgICAgICAgICB0eXBlOiAiR0VUIiwKICAgICAgICAgIHBhdGg6IHBhdGgubWFwKChwKSA9PiBwLnRvU3RyaW5nKCkpCiAgICAgICAgfSkudGhlbihmcm9tV2lyZVZhbHVlKTsKICAgICAgICByZXR1cm4gci50aGVuLmJpbmQocik7CiAgICAgIH0KICAgICAgcmV0dXJuIGNyZWF0ZVByb3h5KGVwLCBwZW5kaW5nTGlzdGVuZXJzLCBbLi4ucGF0aCwgcHJvcF0pOwogICAgfSwKICAgIHNldChfdGFyZ2V0LCBwcm9wLCByYXdWYWx1ZSkgewogICAgICB0aHJvd0lmUHJveHlSZWxlYXNlZChpc1Byb3h5UmVsZWFzZWQpOwogICAgICBjb25zdCBbdmFsdWUsIHRyYW5zZmVyYWJsZXNdID0gdG9XaXJlVmFsdWUocmF3VmFsdWUpOwogICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgcGVuZGluZ0xpc3RlbmVycywgewogICAgICAgIHR5cGU6ICJTRVQiLAogICAgICAgIHBhdGg6IFsuLi5wYXRoLCBwcm9wXS5tYXAoKHApID0+IHAudG9TdHJpbmcoKSksCiAgICAgICAgdmFsdWUKICAgICAgfSwgdHJhbnNmZXJhYmxlcykudGhlbihmcm9tV2lyZVZhbHVlKTsKICAgIH0sCiAgICBhcHBseShfdGFyZ2V0LCBfdGhpc0FyZywgcmF3QXJndW1lbnRMaXN0KSB7CiAgICAgIHRocm93SWZQcm94eVJlbGVhc2VkKGlzUHJveHlSZWxlYXNlZCk7CiAgICAgIGNvbnN0IGxhc3QgPSBwYXRoW3BhdGgubGVuZ3RoIC0gMV07CiAgICAgIGlmIChsYXN0ID09PSBjcmVhdGVFbmRwb2ludCkgewogICAgICAgIHJldHVybiByZXF1ZXN0UmVzcG9uc2VNZXNzYWdlKGVwLCBwZW5kaW5nTGlzdGVuZXJzLCB7CiAgICAgICAgICB0eXBlOiAiRU5EUE9JTlQiCiAgICAgICAgfSkudGhlbihmcm9tV2lyZVZhbHVlKTsKICAgICAgfQogICAgICBpZiAobGFzdCA9PT0gImJpbmQiKSB7CiAgICAgICAgcmV0dXJuIGNyZWF0ZVByb3h5KGVwLCBwZW5kaW5nTGlzdGVuZXJzLCBwYXRoLnNsaWNlKDAsIC0xKSk7CiAgICAgIH0KICAgICAgY29uc3QgW2FyZ3VtZW50TGlzdCwgdHJhbnNmZXJhYmxlc10gPSBwcm9jZXNzQXJndW1lbnRzKHJhd0FyZ3VtZW50TGlzdCk7CiAgICAgIHJldHVybiByZXF1ZXN0UmVzcG9uc2VNZXNzYWdlKGVwLCBwZW5kaW5nTGlzdGVuZXJzLCB7CiAgICAgICAgdHlwZTogIkFQUExZIiwKICAgICAgICBwYXRoOiBwYXRoLm1hcCgocCkgPT4gcC50b1N0cmluZygpKSwKICAgICAgICBhcmd1bWVudExpc3QKICAgICAgfSwgdHJhbnNmZXJhYmxlcykudGhlbihmcm9tV2lyZVZhbHVlKTsKICAgIH0sCiAgICBjb25zdHJ1Y3QoX3RhcmdldCwgcmF3QXJndW1lbnRMaXN0KSB7CiAgICAgIHRocm93SWZQcm94eVJlbGVhc2VkKGlzUHJveHlSZWxlYXNlZCk7CiAgICAgIGNvbnN0IFthcmd1bWVudExpc3QsIHRyYW5zZmVyYWJsZXNdID0gcHJvY2Vzc0FyZ3VtZW50cyhyYXdBcmd1bWVudExpc3QpOwogICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgcGVuZGluZ0xpc3RlbmVycywgewogICAgICAgIHR5cGU6ICJDT05TVFJVQ1QiLAogICAgICAgIHBhdGg6IHBhdGgubWFwKChwKSA9PiBwLnRvU3RyaW5nKCkpLAogICAgICAgIGFyZ3VtZW50TGlzdAogICAgICB9LCB0cmFuc2ZlcmFibGVzKS50aGVuKGZyb21XaXJlVmFsdWUpOwogICAgfQogIH0pOwogIHJlZ2lzdGVyUHJveHkocHJveHkyLCBlcCk7CiAgcmV0dXJuIHByb3h5MjsKfQpmdW5jdGlvbiBteUZsYXQoYXJyKSB7CiAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIGFycik7Cn0KZnVuY3Rpb24gcHJvY2Vzc0FyZ3VtZW50cyhhcmd1bWVudExpc3QpIHsKICBjb25zdCBwcm9jZXNzZWQgPSBhcmd1bWVudExpc3QubWFwKHRvV2lyZVZhbHVlKTsKICByZXR1cm4gW3Byb2Nlc3NlZC5tYXAoKHYpID0+IHZbMF0pLCBteUZsYXQocHJvY2Vzc2VkLm1hcCgodikgPT4gdlsxXSkpXTsKfQpjb25zdCB0cmFuc2ZlckNhY2hlID0gLyogQF9fUFVSRV9fICovIG5ldyBXZWFrTWFwKCk7CmZ1bmN0aW9uIHRyYW5zZmVyKG9iaiwgdHJhbnNmZXJzKSB7CiAgdHJhbnNmZXJDYWNoZS5zZXQob2JqLCB0cmFuc2ZlcnMpOwogIHJldHVybiBvYmo7Cn0KZnVuY3Rpb24gcHJveHkob2JqKSB7CiAgcmV0dXJuIE9iamVjdC5hc3NpZ24ob2JqLCB7IFtwcm94eU1hcmtlcl06IHRydWUgfSk7Cn0KZnVuY3Rpb24gdG9XaXJlVmFsdWUodmFsdWUpIHsKICBmb3IgKGNvbnN0IFtuYW1lLCBoYW5kbGVyXSBvZiB0cmFuc2ZlckhhbmRsZXJzKSB7CiAgICBpZiAoaGFuZGxlci5jYW5IYW5kbGUodmFsdWUpKSB7CiAgICAgIGNvbnN0IFtzZXJpYWxpemVkVmFsdWUsIHRyYW5zZmVyYWJsZXNdID0gaGFuZGxlci5zZXJpYWxpemUodmFsdWUpOwogICAgICByZXR1cm4gWwogICAgICAgIHsKICAgICAgICAgIHR5cGU6ICJIQU5ETEVSIiwKICAgICAgICAgIG5hbWUsCiAgICAgICAgICB2YWx1ZTogc2VyaWFsaXplZFZhbHVlCiAgICAgICAgfSwKICAgICAgICB0cmFuc2ZlcmFibGVzCiAgICAgIF07CiAgICB9CiAgfQogIHJldHVybiBbCiAgICB7CiAgICAgIHR5cGU6ICJSQVciLAogICAgICB2YWx1ZQogICAgfSwKICAgIHRyYW5zZmVyQ2FjaGUuZ2V0KHZhbHVlKSB8fCBbXQogIF07Cn0KZnVuY3Rpb24gZnJvbVdpcmVWYWx1ZSh2YWx1ZSkgewogIHN3aXRjaCAodmFsdWUudHlwZSkgewogICAgY2FzZSAiSEFORExFUiI6CiAgICAgIHJldHVybiB0cmFuc2ZlckhhbmRsZXJzLmdldCh2YWx1ZS5uYW1lKS5kZXNlcmlhbGl6ZSh2YWx1ZS52YWx1ZSk7CiAgICBjYXNlICJSQVciOgogICAgICByZXR1cm4gdmFsdWUudmFsdWU7CiAgfQp9CmZ1bmN0aW9uIHJlcXVlc3RSZXNwb25zZU1lc3NhZ2UoZXAsIHBlbmRpbmdMaXN0ZW5lcnMsIG1zZywgdHJhbnNmZXJzKSB7CiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7CiAgICBjb25zdCBpZCA9IGdlbmVyYXRlVVVJRCgpOwogICAgcGVuZGluZ0xpc3RlbmVycy5zZXQoaWQsIHJlc29sdmUpOwogICAgaWYgKGVwLnN0YXJ0KSB7CiAgICAgIGVwLnN0YXJ0KCk7CiAgICB9CiAgICBlcC5wb3N0TWVzc2FnZShPYmplY3QuYXNzaWduKHsgaWQgfSwgbXNnKSwgdHJhbnNmZXJzKTsKICB9KTsKfQpmdW5jdGlvbiBnZW5lcmF0ZVVVSUQoKSB7CiAgcmV0dXJuIG5ldyBBcnJheSg0KS5maWxsKDApLm1hcCgoKSA9PiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUikudG9TdHJpbmcoMTYpKS5qb2luKCItIik7Cn0KYXN5bmMgZnVuY3Rpb24gZmV0Y2hVcmwoaW5wdXQsIGluaXQsIGZldGNoRm4pIHsKICBsZXQgcmVzcG9uc2U7CiAgaWYgKHR5cGVvZiBmZXRjaEZuID09PSAiZnVuY3Rpb24iKSB7CiAgICByZXNwb25zZSA9IGF3YWl0IGZldGNoRm4oaW5wdXQsIGluaXQpOwogIH0gZWxzZSB7CiAgICByZXNwb25zZSA9IGF3YWl0IGZldGNoKGlucHV0LCBpbml0KTsKICB9CiAgaWYgKCFyZXNwb25zZS5vaykgewogICAgY29uc3QganNvbiA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTsKICAgIGlmIChqc29uICYmIGpzb24uZXJyb3IpIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKGpzb24uZXJyb3IpOwogICAgfSBlbHNlIGlmIChyZXNwb25zZS5zdGF0dXNUZXh0KSB7CiAgICAgIHRocm93IG5ldyBFcnJvcihyZXNwb25zZS5zdGF0dXNUZXh0KTsKICAgIH0gZWxzZSBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDQpIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKGBOb3QgZm91bmQ6ICR7aW5wdXR9ICg0MDQpYCk7CiAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNTAwKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcigiSW50ZXJuYWwgc2VydmVyIGVycm9yICg1MDApIik7CiAgICB9IGVsc2UgewogICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBmZXRjaDogJHtpbnB1dH0gKCR7cmVzcG9uc2Uuc3RhdHVzfSlgKTsKICAgIH0KICB9CiAgcmV0dXJuIHJlc3BvbnNlOwp9CmNvbnN0IGZldGNoQW5kR2V0SW1hZ2VEYXRhV29ya2VyID0gewogIGFzeW5jIGdldEltYWdlRGF0YSh0aWxlVXJsLCBvbkFib3J0LCBmZXRjaEZuLCB3aWR0aCwgaGVpZ2h0KSB7CiAgICBjb25zdCB3b3JrZXJBYm9ydENvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7CiAgICBvbkFib3J0KCk7CiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoVXJsKAogICAgICB0aWxlVXJsLAogICAgICB7CiAgICAgICAgc2lnbmFsOiB3b3JrZXJBYm9ydENvbnRyb2xsZXIuc2lnbmFsCiAgICAgIH0sCiAgICAgIGZldGNoRm4KICAgICk7CiAgICBjb25zdCBibG9iID0gYXdhaXQgcmVzcG9uc2UuYmxvYigpOwogICAgY29uc3QgaW1hZ2VCaXRtYXAgPSBhd2FpdCBjcmVhdGVJbWFnZUJpdG1hcChibG9iLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTsKICAgIGNvbnN0IGNhbnZhcyA9IG5ldyBPZmZzY3JlZW5DYW52YXMod2lkdGgsIGhlaWdodCk7CiAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoIjJkIik7CiAgICBpZiAoIWNvbnRleHQpIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKCJDb3VsZCBub3QgY3JlYXRlIE9mZnNjcmVlbkNhbnZhcyBjb250ZXh0Iik7CiAgICB9CiAgICBjb250ZXh0LmRyYXdJbWFnZShpbWFnZUJpdG1hcCwgMCwgMCk7CiAgICBjb25zdCBpbWFnZURhdGEgPSBjb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB3aWR0aCwgaGVpZ2h0KTsKICAgIHJldHVybiB0cmFuc2ZlcihpbWFnZURhdGEsIFtpbWFnZURhdGEuZGF0YS5idWZmZXJdKTsKICB9Cn07CmV4cG9zZShmZXRjaEFuZEdldEltYWdlRGF0YVdvcmtlcik7Ci8vIyBzb3VyY2VNYXBwaW5nVVJMPWZldGNoLWFuZC1nZXQtaW1hZ2UtZGF0YS1CQzRZc0lHNy5qcy5tYXAK")], { type: "text/javascript;charset=utf-8" });
function zv(e) {
	let t;
	try {
		if (t = Rv && (self.URL || self.webkitURL).createObjectURL(Rv), !t) throw "";
		let n = new Worker(t, {
			type: "module",
			name: e?.name
		});
		return n.addEventListener("error", () => {
			(self.URL || self.webkitURL).revokeObjectURL(t);
		}), n;
	} catch {
		return new Worker("data:text/javascript;base64,LyoqCiAqIEBsaWNlbnNlCiAqIENvcHlyaWdodCAyMDE5IEdvb2dsZSBMTEMKICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFwYWNoZS0yLjAKICovCmNvbnN0IHByb3h5TWFya2VyID0gU3ltYm9sKCJDb21saW5rLnByb3h5Iik7CmNvbnN0IGNyZWF0ZUVuZHBvaW50ID0gU3ltYm9sKCJDb21saW5rLmVuZHBvaW50Iik7CmNvbnN0IHJlbGVhc2VQcm94eSA9IFN5bWJvbCgiQ29tbGluay5yZWxlYXNlUHJveHkiKTsKY29uc3QgZmluYWxpemVyID0gU3ltYm9sKCJDb21saW5rLmZpbmFsaXplciIpOwpjb25zdCB0aHJvd01hcmtlciA9IFN5bWJvbCgiQ29tbGluay50aHJvd24iKTsKY29uc3QgaXNPYmplY3QgPSAodmFsKSA9PiB0eXBlb2YgdmFsID09PSAib2JqZWN0IiAmJiB2YWwgIT09IG51bGwgfHwgdHlwZW9mIHZhbCA9PT0gImZ1bmN0aW9uIjsKY29uc3QgcHJveHlUcmFuc2ZlckhhbmRsZXIgPSB7CiAgY2FuSGFuZGxlOiAodmFsKSA9PiBpc09iamVjdCh2YWwpICYmIHZhbFtwcm94eU1hcmtlcl0sCiAgc2VyaWFsaXplKG9iaikgewogICAgY29uc3QgeyBwb3J0MSwgcG9ydDIgfSA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpOwogICAgZXhwb3NlKG9iaiwgcG9ydDEpOwogICAgcmV0dXJuIFtwb3J0MiwgW3BvcnQyXV07CiAgfSwKICBkZXNlcmlhbGl6ZShwb3J0KSB7CiAgICBwb3J0LnN0YXJ0KCk7CiAgICByZXR1cm4gd3JhcChwb3J0KTsKICB9Cn07CmNvbnN0IHRocm93VHJhbnNmZXJIYW5kbGVyID0gewogIGNhbkhhbmRsZTogKHZhbHVlKSA9PiBpc09iamVjdCh2YWx1ZSkgJiYgdGhyb3dNYXJrZXIgaW4gdmFsdWUsCiAgc2VyaWFsaXplKHsgdmFsdWUgfSkgewogICAgbGV0IHNlcmlhbGl6ZWQ7CiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBFcnJvcikgewogICAgICBzZXJpYWxpemVkID0gewogICAgICAgIGlzRXJyb3I6IHRydWUsCiAgICAgICAgdmFsdWU6IHsKICAgICAgICAgIG1lc3NhZ2U6IHZhbHVlLm1lc3NhZ2UsCiAgICAgICAgICBuYW1lOiB2YWx1ZS5uYW1lLAogICAgICAgICAgc3RhY2s6IHZhbHVlLnN0YWNrCiAgICAgICAgfQogICAgICB9OwogICAgfSBlbHNlIHsKICAgICAgc2VyaWFsaXplZCA9IHsgaXNFcnJvcjogZmFsc2UsIHZhbHVlIH07CiAgICB9CiAgICByZXR1cm4gW3NlcmlhbGl6ZWQsIFtdXTsKICB9LAogIGRlc2VyaWFsaXplKHNlcmlhbGl6ZWQpIHsKICAgIGlmIChzZXJpYWxpemVkLmlzRXJyb3IpIHsKICAgICAgdGhyb3cgT2JqZWN0LmFzc2lnbihuZXcgRXJyb3Ioc2VyaWFsaXplZC52YWx1ZS5tZXNzYWdlKSwgc2VyaWFsaXplZC52YWx1ZSk7CiAgICB9CiAgICB0aHJvdyBzZXJpYWxpemVkLnZhbHVlOwogIH0KfTsKY29uc3QgdHJhbnNmZXJIYW5kbGVycyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKFsKICBbInByb3h5IiwgcHJveHlUcmFuc2ZlckhhbmRsZXJdLAogIFsidGhyb3ciLCB0aHJvd1RyYW5zZmVySGFuZGxlcl0KXSk7CmZ1bmN0aW9uIGlzQWxsb3dlZE9yaWdpbihhbGxvd2VkT3JpZ2lucywgb3JpZ2luKSB7CiAgZm9yIChjb25zdCBhbGxvd2VkT3JpZ2luIG9mIGFsbG93ZWRPcmlnaW5zKSB7CiAgICBpZiAob3JpZ2luID09PSBhbGxvd2VkT3JpZ2luIHx8IGFsbG93ZWRPcmlnaW4gPT09ICIqIikgewogICAgICByZXR1cm4gdHJ1ZTsKICAgIH0KICAgIGlmIChhbGxvd2VkT3JpZ2luIGluc3RhbmNlb2YgUmVnRXhwICYmIGFsbG93ZWRPcmlnaW4udGVzdChvcmlnaW4pKSB7CiAgICAgIHJldHVybiB0cnVlOwogICAgfQogIH0KICByZXR1cm4gZmFsc2U7Cn0KZnVuY3Rpb24gZXhwb3NlKG9iaiwgZXAgPSBnbG9iYWxUaGlzLCBhbGxvd2VkT3JpZ2lucyA9IFsiKiJdKSB7CiAgZXAuYWRkRXZlbnRMaXN0ZW5lcigibWVzc2FnZSIsIGZ1bmN0aW9uIGNhbGxiYWNrKGV2KSB7CiAgICBpZiAoIWV2IHx8ICFldi5kYXRhKSB7CiAgICAgIHJldHVybjsKICAgIH0KICAgIGlmICghaXNBbGxvd2VkT3JpZ2luKGFsbG93ZWRPcmlnaW5zLCBldi5vcmlnaW4pKSB7CiAgICAgIGNvbnNvbGUud2FybihgSW52YWxpZCBvcmlnaW4gJyR7ZXYub3JpZ2lufScgZm9yIGNvbWxpbmsgcHJveHlgKTsKICAgICAgcmV0dXJuOwogICAgfQogICAgY29uc3QgeyBpZCwgdHlwZSwgcGF0aCB9ID0gT2JqZWN0LmFzc2lnbih7IHBhdGg6IFtdIH0sIGV2LmRhdGEpOwogICAgY29uc3QgYXJndW1lbnRMaXN0ID0gKGV2LmRhdGEuYXJndW1lbnRMaXN0IHx8IFtdKS5tYXAoZnJvbVdpcmVWYWx1ZSk7CiAgICBsZXQgcmV0dXJuVmFsdWU7CiAgICB0cnkgewogICAgICBjb25zdCBwYXJlbnQgPSBwYXRoLnNsaWNlKDAsIC0xKS5yZWR1Y2UoKG9iajIsIHByb3ApID0+IG9iajJbcHJvcF0sIG9iaik7CiAgICAgIGNvbnN0IHJhd1ZhbHVlID0gcGF0aC5yZWR1Y2UoKG9iajIsIHByb3ApID0+IG9iajJbcHJvcF0sIG9iaik7CiAgICAgIHN3aXRjaCAodHlwZSkgewogICAgICAgIGNhc2UgIkdFVCI6CiAgICAgICAgICB7CiAgICAgICAgICAgIHJldHVyblZhbHVlID0gcmF3VmFsdWU7CiAgICAgICAgICB9CiAgICAgICAgICBicmVhazsKICAgICAgICBjYXNlICJTRVQiOgogICAgICAgICAgewogICAgICAgICAgICBwYXJlbnRbcGF0aC5zbGljZSgtMSlbMF1dID0gZnJvbVdpcmVWYWx1ZShldi5kYXRhLnZhbHVlKTsKICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSB0cnVlOwogICAgICAgICAgfQogICAgICAgICAgYnJlYWs7CiAgICAgICAgY2FzZSAiQVBQTFkiOgogICAgICAgICAgewogICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHJhd1ZhbHVlLmFwcGx5KHBhcmVudCwgYXJndW1lbnRMaXN0KTsKICAgICAgICAgIH0KICAgICAgICAgIGJyZWFrOwogICAgICAgIGNhc2UgIkNPTlNUUlVDVCI6CiAgICAgICAgICB7CiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gbmV3IHJhd1ZhbHVlKC4uLmFyZ3VtZW50TGlzdCk7CiAgICAgICAgICAgIHJldHVyblZhbHVlID0gcHJveHkodmFsdWUpOwogICAgICAgICAgfQogICAgICAgICAgYnJlYWs7CiAgICAgICAgY2FzZSAiRU5EUE9JTlQiOgogICAgICAgICAgewogICAgICAgICAgICBjb25zdCB7IHBvcnQxLCBwb3J0MiB9ID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7CiAgICAgICAgICAgIGV4cG9zZShvYmosIHBvcnQyKTsKICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSB0cmFuc2Zlcihwb3J0MSwgW3BvcnQxXSk7CiAgICAgICAgICB9CiAgICAgICAgICBicmVhazsKICAgICAgICBjYXNlICJSRUxFQVNFIjoKICAgICAgICAgIHsKICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSB2b2lkIDA7CiAgICAgICAgICB9CiAgICAgICAgICBicmVhazsKICAgICAgICBkZWZhdWx0OgogICAgICAgICAgcmV0dXJuOwogICAgICB9CiAgICB9IGNhdGNoICh2YWx1ZSkgewogICAgICByZXR1cm5WYWx1ZSA9IHsgdmFsdWUsIFt0aHJvd01hcmtlcl06IDAgfTsKICAgIH0KICAgIFByb21pc2UucmVzb2x2ZShyZXR1cm5WYWx1ZSkuY2F0Y2goKHZhbHVlKSA9PiB7CiAgICAgIHJldHVybiB7IHZhbHVlLCBbdGhyb3dNYXJrZXJdOiAwIH07CiAgICB9KS50aGVuKChyZXR1cm5WYWx1ZTIpID0+IHsKICAgICAgY29uc3QgW3dpcmVWYWx1ZSwgdHJhbnNmZXJhYmxlc10gPSB0b1dpcmVWYWx1ZShyZXR1cm5WYWx1ZTIpOwogICAgICBlcC5wb3N0TWVzc2FnZShPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHdpcmVWYWx1ZSksIHsgaWQgfSksIHRyYW5zZmVyYWJsZXMpOwogICAgICBpZiAodHlwZSA9PT0gIlJFTEVBU0UiKSB7CiAgICAgICAgZXAucmVtb3ZlRXZlbnRMaXN0ZW5lcigibWVzc2FnZSIsIGNhbGxiYWNrKTsKICAgICAgICBjbG9zZUVuZFBvaW50KGVwKTsKICAgICAgICBpZiAoZmluYWxpemVyIGluIG9iaiAmJiB0eXBlb2Ygb2JqW2ZpbmFsaXplcl0gPT09ICJmdW5jdGlvbiIpIHsKICAgICAgICAgIG9ialtmaW5hbGl6ZXJdKCk7CiAgICAgICAgfQogICAgICB9CiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHsKICAgICAgY29uc3QgW3dpcmVWYWx1ZSwgdHJhbnNmZXJhYmxlc10gPSB0b1dpcmVWYWx1ZSh7CiAgICAgICAgdmFsdWU6IG5ldyBUeXBlRXJyb3IoIlVuc2VyaWFsaXphYmxlIHJldHVybiB2YWx1ZSIpLAogICAgICAgIFt0aHJvd01hcmtlcl06IDAKICAgICAgfSk7CiAgICAgIGVwLnBvc3RNZXNzYWdlKE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgd2lyZVZhbHVlKSwgeyBpZCB9KSwgdHJhbnNmZXJhYmxlcyk7CiAgICB9KTsKICB9KTsKICBpZiAoZXAuc3RhcnQpIHsKICAgIGVwLnN0YXJ0KCk7CiAgfQp9CmZ1bmN0aW9uIGlzTWVzc2FnZVBvcnQoZW5kcG9pbnQpIHsKICByZXR1cm4gZW5kcG9pbnQuY29uc3RydWN0b3IubmFtZSA9PT0gIk1lc3NhZ2VQb3J0IjsKfQpmdW5jdGlvbiBjbG9zZUVuZFBvaW50KGVuZHBvaW50KSB7CiAgaWYgKGlzTWVzc2FnZVBvcnQoZW5kcG9pbnQpKQogICAgZW5kcG9pbnQuY2xvc2UoKTsKfQpmdW5jdGlvbiB3cmFwKGVwLCB0YXJnZXQpIHsKICBjb25zdCBwZW5kaW5nTGlzdGVuZXJzID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTsKICBlcC5hZGRFdmVudExpc3RlbmVyKCJtZXNzYWdlIiwgZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShldikgewogICAgY29uc3QgeyBkYXRhIH0gPSBldjsKICAgIGlmICghZGF0YSB8fCAhZGF0YS5pZCkgewogICAgICByZXR1cm47CiAgICB9CiAgICBjb25zdCByZXNvbHZlciA9IHBlbmRpbmdMaXN0ZW5lcnMuZ2V0KGRhdGEuaWQpOwogICAgaWYgKCFyZXNvbHZlcikgewogICAgICByZXR1cm47CiAgICB9CiAgICB0cnkgewogICAgICByZXNvbHZlcihkYXRhKTsKICAgIH0gZmluYWxseSB7CiAgICAgIHBlbmRpbmdMaXN0ZW5lcnMuZGVsZXRlKGRhdGEuaWQpOwogICAgfQogIH0pOwogIHJldHVybiBjcmVhdGVQcm94eShlcCwgcGVuZGluZ0xpc3RlbmVycywgW10sIHRhcmdldCk7Cn0KZnVuY3Rpb24gdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNSZWxlYXNlZCkgewogIGlmIChpc1JlbGVhc2VkKSB7CiAgICB0aHJvdyBuZXcgRXJyb3IoIlByb3h5IGhhcyBiZWVuIHJlbGVhc2VkIGFuZCBpcyBub3QgdXNlYWJsZSIpOwogIH0KfQpmdW5jdGlvbiByZWxlYXNlRW5kcG9pbnQoZXApIHsKICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKSwgewogICAgdHlwZTogIlJFTEVBU0UiCiAgfSkudGhlbigoKSA9PiB7CiAgICBjbG9zZUVuZFBvaW50KGVwKTsKICB9KTsKfQpjb25zdCBwcm94eUNvdW50ZXIgPSAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtNYXAoKTsKY29uc3QgcHJveHlGaW5hbGl6ZXJzID0gIkZpbmFsaXphdGlvblJlZ2lzdHJ5IiBpbiBnbG9iYWxUaGlzICYmIG5ldyBGaW5hbGl6YXRpb25SZWdpc3RyeSgoZXApID0+IHsKICBjb25zdCBuZXdDb3VudCA9IChwcm94eUNvdW50ZXIuZ2V0KGVwKSB8fCAwKSAtIDE7CiAgcHJveHlDb3VudGVyLnNldChlcCwgbmV3Q291bnQpOwogIGlmIChuZXdDb3VudCA9PT0gMCkgewogICAgcmVsZWFzZUVuZHBvaW50KGVwKTsKICB9Cn0pOwpmdW5jdGlvbiByZWdpc3RlclByb3h5KHByb3h5MiwgZXApIHsKICBjb25zdCBuZXdDb3VudCA9IChwcm94eUNvdW50ZXIuZ2V0KGVwKSB8fCAwKSArIDE7CiAgcHJveHlDb3VudGVyLnNldChlcCwgbmV3Q291bnQpOwogIGlmIChwcm94eUZpbmFsaXplcnMpIHsKICAgIHByb3h5RmluYWxpemVycy5yZWdpc3Rlcihwcm94eTIsIGVwLCBwcm94eTIpOwogIH0KfQpmdW5jdGlvbiB1bnJlZ2lzdGVyUHJveHkocHJveHkyKSB7CiAgaWYgKHByb3h5RmluYWxpemVycykgewogICAgcHJveHlGaW5hbGl6ZXJzLnVucmVnaXN0ZXIocHJveHkyKTsKICB9Cn0KZnVuY3Rpb24gY3JlYXRlUHJveHkoZXAsIHBlbmRpbmdMaXN0ZW5lcnMsIHBhdGggPSBbXSwgdGFyZ2V0ID0gZnVuY3Rpb24oKSB7Cn0pIHsKICBsZXQgaXNQcm94eVJlbGVhc2VkID0gZmFsc2U7CiAgY29uc3QgcHJveHkyID0gbmV3IFByb3h5KHRhcmdldCwgewogICAgZ2V0KF90YXJnZXQsIHByb3ApIHsKICAgICAgdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNQcm94eVJlbGVhc2VkKTsKICAgICAgaWYgKHByb3AgPT09IHJlbGVhc2VQcm94eSkgewogICAgICAgIHJldHVybiAoKSA9PiB7CiAgICAgICAgICB1bnJlZ2lzdGVyUHJveHkocHJveHkyKTsKICAgICAgICAgIHJlbGVhc2VFbmRwb2ludChlcCk7CiAgICAgICAgICBwZW5kaW5nTGlzdGVuZXJzLmNsZWFyKCk7CiAgICAgICAgICBpc1Byb3h5UmVsZWFzZWQgPSB0cnVlOwogICAgICAgIH07CiAgICAgIH0KICAgICAgaWYgKHByb3AgPT09ICJ0aGVuIikgewogICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgewogICAgICAgICAgcmV0dXJuIHsgdGhlbjogKCkgPT4gcHJveHkyIH07CiAgICAgICAgfQogICAgICAgIGNvbnN0IHIgPSByZXF1ZXN0UmVzcG9uc2VNZXNzYWdlKGVwLCBwZW5kaW5nTGlzdGVuZXJzLCB7CiAgICAgICAgICB0eXBlOiAiR0VUIiwKICAgICAgICAgIHBhdGg6IHBhdGgubWFwKChwKSA9PiBwLnRvU3RyaW5nKCkpCiAgICAgICAgfSkudGhlbihmcm9tV2lyZVZhbHVlKTsKICAgICAgICByZXR1cm4gci50aGVuLmJpbmQocik7CiAgICAgIH0KICAgICAgcmV0dXJuIGNyZWF0ZVByb3h5KGVwLCBwZW5kaW5nTGlzdGVuZXJzLCBbLi4ucGF0aCwgcHJvcF0pOwogICAgfSwKICAgIHNldChfdGFyZ2V0LCBwcm9wLCByYXdWYWx1ZSkgewogICAgICB0aHJvd0lmUHJveHlSZWxlYXNlZChpc1Byb3h5UmVsZWFzZWQpOwogICAgICBjb25zdCBbdmFsdWUsIHRyYW5zZmVyYWJsZXNdID0gdG9XaXJlVmFsdWUocmF3VmFsdWUpOwogICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgcGVuZGluZ0xpc3RlbmVycywgewogICAgICAgIHR5cGU6ICJTRVQiLAogICAgICAgIHBhdGg6IFsuLi5wYXRoLCBwcm9wXS5tYXAoKHApID0+IHAudG9TdHJpbmcoKSksCiAgICAgICAgdmFsdWUKICAgICAgfSwgdHJhbnNmZXJhYmxlcykudGhlbihmcm9tV2lyZVZhbHVlKTsKICAgIH0sCiAgICBhcHBseShfdGFyZ2V0LCBfdGhpc0FyZywgcmF3QXJndW1lbnRMaXN0KSB7CiAgICAgIHRocm93SWZQcm94eVJlbGVhc2VkKGlzUHJveHlSZWxlYXNlZCk7CiAgICAgIGNvbnN0IGxhc3QgPSBwYXRoW3BhdGgubGVuZ3RoIC0gMV07CiAgICAgIGlmIChsYXN0ID09PSBjcmVhdGVFbmRwb2ludCkgewogICAgICAgIHJldHVybiByZXF1ZXN0UmVzcG9uc2VNZXNzYWdlKGVwLCBwZW5kaW5nTGlzdGVuZXJzLCB7CiAgICAgICAgICB0eXBlOiAiRU5EUE9JTlQiCiAgICAgICAgfSkudGhlbihmcm9tV2lyZVZhbHVlKTsKICAgICAgfQogICAgICBpZiAobGFzdCA9PT0gImJpbmQiKSB7CiAgICAgICAgcmV0dXJuIGNyZWF0ZVByb3h5KGVwLCBwZW5kaW5nTGlzdGVuZXJzLCBwYXRoLnNsaWNlKDAsIC0xKSk7CiAgICAgIH0KICAgICAgY29uc3QgW2FyZ3VtZW50TGlzdCwgdHJhbnNmZXJhYmxlc10gPSBwcm9jZXNzQXJndW1lbnRzKHJhd0FyZ3VtZW50TGlzdCk7CiAgICAgIHJldHVybiByZXF1ZXN0UmVzcG9uc2VNZXNzYWdlKGVwLCBwZW5kaW5nTGlzdGVuZXJzLCB7CiAgICAgICAgdHlwZTogIkFQUExZIiwKICAgICAgICBwYXRoOiBwYXRoLm1hcCgocCkgPT4gcC50b1N0cmluZygpKSwKICAgICAgICBhcmd1bWVudExpc3QKICAgICAgfSwgdHJhbnNmZXJhYmxlcykudGhlbihmcm9tV2lyZVZhbHVlKTsKICAgIH0sCiAgICBjb25zdHJ1Y3QoX3RhcmdldCwgcmF3QXJndW1lbnRMaXN0KSB7CiAgICAgIHRocm93SWZQcm94eVJlbGVhc2VkKGlzUHJveHlSZWxlYXNlZCk7CiAgICAgIGNvbnN0IFthcmd1bWVudExpc3QsIHRyYW5zZmVyYWJsZXNdID0gcHJvY2Vzc0FyZ3VtZW50cyhyYXdBcmd1bWVudExpc3QpOwogICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgcGVuZGluZ0xpc3RlbmVycywgewogICAgICAgIHR5cGU6ICJDT05TVFJVQ1QiLAogICAgICAgIHBhdGg6IHBhdGgubWFwKChwKSA9PiBwLnRvU3RyaW5nKCkpLAogICAgICAgIGFyZ3VtZW50TGlzdAogICAgICB9LCB0cmFuc2ZlcmFibGVzKS50aGVuKGZyb21XaXJlVmFsdWUpOwogICAgfQogIH0pOwogIHJlZ2lzdGVyUHJveHkocHJveHkyLCBlcCk7CiAgcmV0dXJuIHByb3h5MjsKfQpmdW5jdGlvbiBteUZsYXQoYXJyKSB7CiAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIGFycik7Cn0KZnVuY3Rpb24gcHJvY2Vzc0FyZ3VtZW50cyhhcmd1bWVudExpc3QpIHsKICBjb25zdCBwcm9jZXNzZWQgPSBhcmd1bWVudExpc3QubWFwKHRvV2lyZVZhbHVlKTsKICByZXR1cm4gW3Byb2Nlc3NlZC5tYXAoKHYpID0+IHZbMF0pLCBteUZsYXQocHJvY2Vzc2VkLm1hcCgodikgPT4gdlsxXSkpXTsKfQpjb25zdCB0cmFuc2ZlckNhY2hlID0gLyogQF9fUFVSRV9fICovIG5ldyBXZWFrTWFwKCk7CmZ1bmN0aW9uIHRyYW5zZmVyKG9iaiwgdHJhbnNmZXJzKSB7CiAgdHJhbnNmZXJDYWNoZS5zZXQob2JqLCB0cmFuc2ZlcnMpOwogIHJldHVybiBvYmo7Cn0KZnVuY3Rpb24gcHJveHkob2JqKSB7CiAgcmV0dXJuIE9iamVjdC5hc3NpZ24ob2JqLCB7IFtwcm94eU1hcmtlcl06IHRydWUgfSk7Cn0KZnVuY3Rpb24gdG9XaXJlVmFsdWUodmFsdWUpIHsKICBmb3IgKGNvbnN0IFtuYW1lLCBoYW5kbGVyXSBvZiB0cmFuc2ZlckhhbmRsZXJzKSB7CiAgICBpZiAoaGFuZGxlci5jYW5IYW5kbGUodmFsdWUpKSB7CiAgICAgIGNvbnN0IFtzZXJpYWxpemVkVmFsdWUsIHRyYW5zZmVyYWJsZXNdID0gaGFuZGxlci5zZXJpYWxpemUodmFsdWUpOwogICAgICByZXR1cm4gWwogICAgICAgIHsKICAgICAgICAgIHR5cGU6ICJIQU5ETEVSIiwKICAgICAgICAgIG5hbWUsCiAgICAgICAgICB2YWx1ZTogc2VyaWFsaXplZFZhbHVlCiAgICAgICAgfSwKICAgICAgICB0cmFuc2ZlcmFibGVzCiAgICAgIF07CiAgICB9CiAgfQogIHJldHVybiBbCiAgICB7CiAgICAgIHR5cGU6ICJSQVciLAogICAgICB2YWx1ZQogICAgfSwKICAgIHRyYW5zZmVyQ2FjaGUuZ2V0KHZhbHVlKSB8fCBbXQogIF07Cn0KZnVuY3Rpb24gZnJvbVdpcmVWYWx1ZSh2YWx1ZSkgewogIHN3aXRjaCAodmFsdWUudHlwZSkgewogICAgY2FzZSAiSEFORExFUiI6CiAgICAgIHJldHVybiB0cmFuc2ZlckhhbmRsZXJzLmdldCh2YWx1ZS5uYW1lKS5kZXNlcmlhbGl6ZSh2YWx1ZS52YWx1ZSk7CiAgICBjYXNlICJSQVciOgogICAgICByZXR1cm4gdmFsdWUudmFsdWU7CiAgfQp9CmZ1bmN0aW9uIHJlcXVlc3RSZXNwb25zZU1lc3NhZ2UoZXAsIHBlbmRpbmdMaXN0ZW5lcnMsIG1zZywgdHJhbnNmZXJzKSB7CiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7CiAgICBjb25zdCBpZCA9IGdlbmVyYXRlVVVJRCgpOwogICAgcGVuZGluZ0xpc3RlbmVycy5zZXQoaWQsIHJlc29sdmUpOwogICAgaWYgKGVwLnN0YXJ0KSB7CiAgICAgIGVwLnN0YXJ0KCk7CiAgICB9CiAgICBlcC5wb3N0TWVzc2FnZShPYmplY3QuYXNzaWduKHsgaWQgfSwgbXNnKSwgdHJhbnNmZXJzKTsKICB9KTsKfQpmdW5jdGlvbiBnZW5lcmF0ZVVVSUQoKSB7CiAgcmV0dXJuIG5ldyBBcnJheSg0KS5maWxsKDApLm1hcCgoKSA9PiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUikudG9TdHJpbmcoMTYpKS5qb2luKCItIik7Cn0KYXN5bmMgZnVuY3Rpb24gZmV0Y2hVcmwoaW5wdXQsIGluaXQsIGZldGNoRm4pIHsKICBsZXQgcmVzcG9uc2U7CiAgaWYgKHR5cGVvZiBmZXRjaEZuID09PSAiZnVuY3Rpb24iKSB7CiAgICByZXNwb25zZSA9IGF3YWl0IGZldGNoRm4oaW5wdXQsIGluaXQpOwogIH0gZWxzZSB7CiAgICByZXNwb25zZSA9IGF3YWl0IGZldGNoKGlucHV0LCBpbml0KTsKICB9CiAgaWYgKCFyZXNwb25zZS5vaykgewogICAgY29uc3QganNvbiA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTsKICAgIGlmIChqc29uICYmIGpzb24uZXJyb3IpIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKGpzb24uZXJyb3IpOwogICAgfSBlbHNlIGlmIChyZXNwb25zZS5zdGF0dXNUZXh0KSB7CiAgICAgIHRocm93IG5ldyBFcnJvcihyZXNwb25zZS5zdGF0dXNUZXh0KTsKICAgIH0gZWxzZSBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDQpIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKGBOb3QgZm91bmQ6ICR7aW5wdXR9ICg0MDQpYCk7CiAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNTAwKSB7CiAgICAgIHRocm93IG5ldyBFcnJvcigiSW50ZXJuYWwgc2VydmVyIGVycm9yICg1MDApIik7CiAgICB9IGVsc2UgewogICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBmZXRjaDogJHtpbnB1dH0gKCR7cmVzcG9uc2Uuc3RhdHVzfSlgKTsKICAgIH0KICB9CiAgcmV0dXJuIHJlc3BvbnNlOwp9CmNvbnN0IGZldGNoQW5kR2V0SW1hZ2VEYXRhV29ya2VyID0gewogIGFzeW5jIGdldEltYWdlRGF0YSh0aWxlVXJsLCBvbkFib3J0LCBmZXRjaEZuLCB3aWR0aCwgaGVpZ2h0KSB7CiAgICBjb25zdCB3b3JrZXJBYm9ydENvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7CiAgICBvbkFib3J0KCk7CiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoVXJsKAogICAgICB0aWxlVXJsLAogICAgICB7CiAgICAgICAgc2lnbmFsOiB3b3JrZXJBYm9ydENvbnRyb2xsZXIuc2lnbmFsCiAgICAgIH0sCiAgICAgIGZldGNoRm4KICAgICk7CiAgICBjb25zdCBibG9iID0gYXdhaXQgcmVzcG9uc2UuYmxvYigpOwogICAgY29uc3QgaW1hZ2VCaXRtYXAgPSBhd2FpdCBjcmVhdGVJbWFnZUJpdG1hcChibG9iLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTsKICAgIGNvbnN0IGNhbnZhcyA9IG5ldyBPZmZzY3JlZW5DYW52YXMod2lkdGgsIGhlaWdodCk7CiAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoIjJkIik7CiAgICBpZiAoIWNvbnRleHQpIHsKICAgICAgdGhyb3cgbmV3IEVycm9yKCJDb3VsZCBub3QgY3JlYXRlIE9mZnNjcmVlbkNhbnZhcyBjb250ZXh0Iik7CiAgICB9CiAgICBjb250ZXh0LmRyYXdJbWFnZShpbWFnZUJpdG1hcCwgMCwgMCk7CiAgICBjb25zdCBpbWFnZURhdGEgPSBjb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB3aWR0aCwgaGVpZ2h0KTsKICAgIHJldHVybiB0cmFuc2ZlcihpbWFnZURhdGEsIFtpbWFnZURhdGEuZGF0YS5idWZmZXJdKTsKICB9Cn07CmV4cG9zZShmZXRjaEFuZEdldEltYWdlRGF0YVdvcmtlcik7Ci8vIyBzb3VyY2VNYXBwaW5nVVJMPWZldGNoLWFuZC1nZXQtaW1hZ2UtZGF0YS1CQzRZc0lHNy5qcy5tYXAK", {
			type: "module",
			name: e?.name
		});
	}
}
var Bv = typeof self < "u" && self.Blob && new Blob(["URL.revokeObjectURL(import.meta.url);", ((e) => Uint8Array.from(atob(e), (e) => e.charCodeAt(0)))("LyoqCiAqIEBsaWNlbnNlCiAqIENvcHlyaWdodCAyMDE5IEdvb2dsZSBMTEMKICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFwYWNoZS0yLjAKICovCmNvbnN0IHByb3h5TWFya2VyID0gU3ltYm9sKCJDb21saW5rLnByb3h5Iik7CmNvbnN0IGNyZWF0ZUVuZHBvaW50ID0gU3ltYm9sKCJDb21saW5rLmVuZHBvaW50Iik7CmNvbnN0IHJlbGVhc2VQcm94eSA9IFN5bWJvbCgiQ29tbGluay5yZWxlYXNlUHJveHkiKTsKY29uc3QgZmluYWxpemVyID0gU3ltYm9sKCJDb21saW5rLmZpbmFsaXplciIpOwpjb25zdCB0aHJvd01hcmtlciA9IFN5bWJvbCgiQ29tbGluay50aHJvd24iKTsKY29uc3QgaXNPYmplY3QgPSAodmFsKSA9PiB0eXBlb2YgdmFsID09PSAib2JqZWN0IiAmJiB2YWwgIT09IG51bGwgfHwgdHlwZW9mIHZhbCA9PT0gImZ1bmN0aW9uIjsKY29uc3QgcHJveHlUcmFuc2ZlckhhbmRsZXIgPSB7CiAgY2FuSGFuZGxlOiAodmFsKSA9PiBpc09iamVjdCh2YWwpICYmIHZhbFtwcm94eU1hcmtlcl0sCiAgc2VyaWFsaXplKG9iaikgewogICAgY29uc3QgeyBwb3J0MSwgcG9ydDIgfSA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpOwogICAgZXhwb3NlKG9iaiwgcG9ydDEpOwogICAgcmV0dXJuIFtwb3J0MiwgW3BvcnQyXV07CiAgfSwKICBkZXNlcmlhbGl6ZShwb3J0KSB7CiAgICBwb3J0LnN0YXJ0KCk7CiAgICByZXR1cm4gd3JhcChwb3J0KTsKICB9Cn07CmNvbnN0IHRocm93VHJhbnNmZXJIYW5kbGVyID0gewogIGNhbkhhbmRsZTogKHZhbHVlKSA9PiBpc09iamVjdCh2YWx1ZSkgJiYgdGhyb3dNYXJrZXIgaW4gdmFsdWUsCiAgc2VyaWFsaXplKHsgdmFsdWUgfSkgewogICAgbGV0IHNlcmlhbGl6ZWQ7CiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBFcnJvcikgewogICAgICBzZXJpYWxpemVkID0gewogICAgICAgIGlzRXJyb3I6IHRydWUsCiAgICAgICAgdmFsdWU6IHsKICAgICAgICAgIG1lc3NhZ2U6IHZhbHVlLm1lc3NhZ2UsCiAgICAgICAgICBuYW1lOiB2YWx1ZS5uYW1lLAogICAgICAgICAgc3RhY2s6IHZhbHVlLnN0YWNrCiAgICAgICAgfQogICAgICB9OwogICAgfSBlbHNlIHsKICAgICAgc2VyaWFsaXplZCA9IHsgaXNFcnJvcjogZmFsc2UsIHZhbHVlIH07CiAgICB9CiAgICByZXR1cm4gW3NlcmlhbGl6ZWQsIFtdXTsKICB9LAogIGRlc2VyaWFsaXplKHNlcmlhbGl6ZWQpIHsKICAgIGlmIChzZXJpYWxpemVkLmlzRXJyb3IpIHsKICAgICAgdGhyb3cgT2JqZWN0LmFzc2lnbihuZXcgRXJyb3Ioc2VyaWFsaXplZC52YWx1ZS5tZXNzYWdlKSwgc2VyaWFsaXplZC52YWx1ZSk7CiAgICB9CiAgICB0aHJvdyBzZXJpYWxpemVkLnZhbHVlOwogIH0KfTsKY29uc3QgdHJhbnNmZXJIYW5kbGVycyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKFsKICBbInByb3h5IiwgcHJveHlUcmFuc2ZlckhhbmRsZXJdLAogIFsidGhyb3ciLCB0aHJvd1RyYW5zZmVySGFuZGxlcl0KXSk7CmZ1bmN0aW9uIGlzQWxsb3dlZE9yaWdpbihhbGxvd2VkT3JpZ2lucywgb3JpZ2luKSB7CiAgZm9yIChjb25zdCBhbGxvd2VkT3JpZ2luIG9mIGFsbG93ZWRPcmlnaW5zKSB7CiAgICBpZiAob3JpZ2luID09PSBhbGxvd2VkT3JpZ2luIHx8IGFsbG93ZWRPcmlnaW4gPT09ICIqIikgewogICAgICByZXR1cm4gdHJ1ZTsKICAgIH0KICAgIGlmIChhbGxvd2VkT3JpZ2luIGluc3RhbmNlb2YgUmVnRXhwICYmIGFsbG93ZWRPcmlnaW4udGVzdChvcmlnaW4pKSB7CiAgICAgIHJldHVybiB0cnVlOwogICAgfQogIH0KICByZXR1cm4gZmFsc2U7Cn0KZnVuY3Rpb24gZXhwb3NlKG9iaiwgZXAgPSBnbG9iYWxUaGlzLCBhbGxvd2VkT3JpZ2lucyA9IFsiKiJdKSB7CiAgZXAuYWRkRXZlbnRMaXN0ZW5lcigibWVzc2FnZSIsIGZ1bmN0aW9uIGNhbGxiYWNrKGV2KSB7CiAgICBpZiAoIWV2IHx8ICFldi5kYXRhKSB7CiAgICAgIHJldHVybjsKICAgIH0KICAgIGlmICghaXNBbGxvd2VkT3JpZ2luKGFsbG93ZWRPcmlnaW5zLCBldi5vcmlnaW4pKSB7CiAgICAgIGNvbnNvbGUud2FybihgSW52YWxpZCBvcmlnaW4gJyR7ZXYub3JpZ2lufScgZm9yIGNvbWxpbmsgcHJveHlgKTsKICAgICAgcmV0dXJuOwogICAgfQogICAgY29uc3QgeyBpZCwgdHlwZSwgcGF0aCB9ID0gT2JqZWN0LmFzc2lnbih7IHBhdGg6IFtdIH0sIGV2LmRhdGEpOwogICAgY29uc3QgYXJndW1lbnRMaXN0ID0gKGV2LmRhdGEuYXJndW1lbnRMaXN0IHx8IFtdKS5tYXAoZnJvbVdpcmVWYWx1ZSk7CiAgICBsZXQgcmV0dXJuVmFsdWU7CiAgICB0cnkgewogICAgICBjb25zdCBwYXJlbnQgPSBwYXRoLnNsaWNlKDAsIC0xKS5yZWR1Y2UoKG9iajIsIHByb3ApID0+IG9iajJbcHJvcF0sIG9iaik7CiAgICAgIGNvbnN0IHJhd1ZhbHVlID0gcGF0aC5yZWR1Y2UoKG9iajIsIHByb3ApID0+IG9iajJbcHJvcF0sIG9iaik7CiAgICAgIHN3aXRjaCAodHlwZSkgewogICAgICAgIGNhc2UgIkdFVCI6CiAgICAgICAgICB7CiAgICAgICAgICAgIHJldHVyblZhbHVlID0gcmF3VmFsdWU7CiAgICAgICAgICB9CiAgICAgICAgICBicmVhazsKICAgICAgICBjYXNlICJTRVQiOgogICAgICAgICAgewogICAgICAgICAgICBwYXJlbnRbcGF0aC5zbGljZSgtMSlbMF1dID0gZnJvbVdpcmVWYWx1ZShldi5kYXRhLnZhbHVlKTsKICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSB0cnVlOwogICAgICAgICAgfQogICAgICAgICAgYnJlYWs7CiAgICAgICAgY2FzZSAiQVBQTFkiOgogICAgICAgICAgewogICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHJhd1ZhbHVlLmFwcGx5KHBhcmVudCwgYXJndW1lbnRMaXN0KTsKICAgICAgICAgIH0KICAgICAgICAgIGJyZWFrOwogICAgICAgIGNhc2UgIkNPTlNUUlVDVCI6CiAgICAgICAgICB7CiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gbmV3IHJhd1ZhbHVlKC4uLmFyZ3VtZW50TGlzdCk7CiAgICAgICAgICAgIHJldHVyblZhbHVlID0gcHJveHkodmFsdWUpOwogICAgICAgICAgfQogICAgICAgICAgYnJlYWs7CiAgICAgICAgY2FzZSAiRU5EUE9JTlQiOgogICAgICAgICAgewogICAgICAgICAgICBjb25zdCB7IHBvcnQxLCBwb3J0MiB9ID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7CiAgICAgICAgICAgIGV4cG9zZShvYmosIHBvcnQyKTsKICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSB0cmFuc2Zlcihwb3J0MSwgW3BvcnQxXSk7CiAgICAgICAgICB9CiAgICAgICAgICBicmVhazsKICAgICAgICBjYXNlICJSRUxFQVNFIjoKICAgICAgICAgIHsKICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSB2b2lkIDA7CiAgICAgICAgICB9CiAgICAgICAgICBicmVhazsKICAgICAgICBkZWZhdWx0OgogICAgICAgICAgcmV0dXJuOwogICAgICB9CiAgICB9IGNhdGNoICh2YWx1ZSkgewogICAgICByZXR1cm5WYWx1ZSA9IHsgdmFsdWUsIFt0aHJvd01hcmtlcl06IDAgfTsKICAgIH0KICAgIFByb21pc2UucmVzb2x2ZShyZXR1cm5WYWx1ZSkuY2F0Y2goKHZhbHVlKSA9PiB7CiAgICAgIHJldHVybiB7IHZhbHVlLCBbdGhyb3dNYXJrZXJdOiAwIH07CiAgICB9KS50aGVuKChyZXR1cm5WYWx1ZTIpID0+IHsKICAgICAgY29uc3QgW3dpcmVWYWx1ZSwgdHJhbnNmZXJhYmxlc10gPSB0b1dpcmVWYWx1ZShyZXR1cm5WYWx1ZTIpOwogICAgICBlcC5wb3N0TWVzc2FnZShPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHdpcmVWYWx1ZSksIHsgaWQgfSksIHRyYW5zZmVyYWJsZXMpOwogICAgICBpZiAodHlwZSA9PT0gIlJFTEVBU0UiKSB7CiAgICAgICAgZXAucmVtb3ZlRXZlbnRMaXN0ZW5lcigibWVzc2FnZSIsIGNhbGxiYWNrKTsKICAgICAgICBjbG9zZUVuZFBvaW50KGVwKTsKICAgICAgICBpZiAoZmluYWxpemVyIGluIG9iaiAmJiB0eXBlb2Ygb2JqW2ZpbmFsaXplcl0gPT09ICJmdW5jdGlvbiIpIHsKICAgICAgICAgIG9ialtmaW5hbGl6ZXJdKCk7CiAgICAgICAgfQogICAgICB9CiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHsKICAgICAgY29uc3QgW3dpcmVWYWx1ZSwgdHJhbnNmZXJhYmxlc10gPSB0b1dpcmVWYWx1ZSh7CiAgICAgICAgdmFsdWU6IG5ldyBUeXBlRXJyb3IoIlVuc2VyaWFsaXphYmxlIHJldHVybiB2YWx1ZSIpLAogICAgICAgIFt0aHJvd01hcmtlcl06IDAKICAgICAgfSk7CiAgICAgIGVwLnBvc3RNZXNzYWdlKE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgd2lyZVZhbHVlKSwgeyBpZCB9KSwgdHJhbnNmZXJhYmxlcyk7CiAgICB9KTsKICB9KTsKICBpZiAoZXAuc3RhcnQpIHsKICAgIGVwLnN0YXJ0KCk7CiAgfQp9CmZ1bmN0aW9uIGlzTWVzc2FnZVBvcnQoZW5kcG9pbnQpIHsKICByZXR1cm4gZW5kcG9pbnQuY29uc3RydWN0b3IubmFtZSA9PT0gIk1lc3NhZ2VQb3J0IjsKfQpmdW5jdGlvbiBjbG9zZUVuZFBvaW50KGVuZHBvaW50KSB7CiAgaWYgKGlzTWVzc2FnZVBvcnQoZW5kcG9pbnQpKQogICAgZW5kcG9pbnQuY2xvc2UoKTsKfQpmdW5jdGlvbiB3cmFwKGVwLCB0YXJnZXQpIHsKICBjb25zdCBwZW5kaW5nTGlzdGVuZXJzID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTsKICBlcC5hZGRFdmVudExpc3RlbmVyKCJtZXNzYWdlIiwgZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShldikgewogICAgY29uc3QgeyBkYXRhIH0gPSBldjsKICAgIGlmICghZGF0YSB8fCAhZGF0YS5pZCkgewogICAgICByZXR1cm47CiAgICB9CiAgICBjb25zdCByZXNvbHZlciA9IHBlbmRpbmdMaXN0ZW5lcnMuZ2V0KGRhdGEuaWQpOwogICAgaWYgKCFyZXNvbHZlcikgewogICAgICByZXR1cm47CiAgICB9CiAgICB0cnkgewogICAgICByZXNvbHZlcihkYXRhKTsKICAgIH0gZmluYWxseSB7CiAgICAgIHBlbmRpbmdMaXN0ZW5lcnMuZGVsZXRlKGRhdGEuaWQpOwogICAgfQogIH0pOwogIHJldHVybiBjcmVhdGVQcm94eShlcCwgcGVuZGluZ0xpc3RlbmVycywgW10sIHRhcmdldCk7Cn0KZnVuY3Rpb24gdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNSZWxlYXNlZCkgewogIGlmIChpc1JlbGVhc2VkKSB7CiAgICB0aHJvdyBuZXcgRXJyb3IoIlByb3h5IGhhcyBiZWVuIHJlbGVhc2VkIGFuZCBpcyBub3QgdXNlYWJsZSIpOwogIH0KfQpmdW5jdGlvbiByZWxlYXNlRW5kcG9pbnQoZXApIHsKICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKSwgewogICAgdHlwZTogIlJFTEVBU0UiCiAgfSkudGhlbigoKSA9PiB7CiAgICBjbG9zZUVuZFBvaW50KGVwKTsKICB9KTsKfQpjb25zdCBwcm94eUNvdW50ZXIgPSAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtNYXAoKTsKY29uc3QgcHJveHlGaW5hbGl6ZXJzID0gIkZpbmFsaXphdGlvblJlZ2lzdHJ5IiBpbiBnbG9iYWxUaGlzICYmIG5ldyBGaW5hbGl6YXRpb25SZWdpc3RyeSgoZXApID0+IHsKICBjb25zdCBuZXdDb3VudCA9IChwcm94eUNvdW50ZXIuZ2V0KGVwKSB8fCAwKSAtIDE7CiAgcHJveHlDb3VudGVyLnNldChlcCwgbmV3Q291bnQpOwogIGlmIChuZXdDb3VudCA9PT0gMCkgewogICAgcmVsZWFzZUVuZHBvaW50KGVwKTsKICB9Cn0pOwpmdW5jdGlvbiByZWdpc3RlclByb3h5KHByb3h5MiwgZXApIHsKICBjb25zdCBuZXdDb3VudCA9IChwcm94eUNvdW50ZXIuZ2V0KGVwKSB8fCAwKSArIDE7CiAgcHJveHlDb3VudGVyLnNldChlcCwgbmV3Q291bnQpOwogIGlmIChwcm94eUZpbmFsaXplcnMpIHsKICAgIHByb3h5RmluYWxpemVycy5yZWdpc3Rlcihwcm94eTIsIGVwLCBwcm94eTIpOwogIH0KfQpmdW5jdGlvbiB1bnJlZ2lzdGVyUHJveHkocHJveHkyKSB7CiAgaWYgKHByb3h5RmluYWxpemVycykgewogICAgcHJveHlGaW5hbGl6ZXJzLnVucmVnaXN0ZXIocHJveHkyKTsKICB9Cn0KZnVuY3Rpb24gY3JlYXRlUHJveHkoZXAsIHBlbmRpbmdMaXN0ZW5lcnMsIHBhdGggPSBbXSwgdGFyZ2V0ID0gZnVuY3Rpb24oKSB7Cn0pIHsKICBsZXQgaXNQcm94eVJlbGVhc2VkID0gZmFsc2U7CiAgY29uc3QgcHJveHkyID0gbmV3IFByb3h5KHRhcmdldCwgewogICAgZ2V0KF90YXJnZXQsIHByb3ApIHsKICAgICAgdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNQcm94eVJlbGVhc2VkKTsKICAgICAgaWYgKHByb3AgPT09IHJlbGVhc2VQcm94eSkgewogICAgICAgIHJldHVybiAoKSA9PiB7CiAgICAgICAgICB1bnJlZ2lzdGVyUHJveHkocHJveHkyKTsKICAgICAgICAgIHJlbGVhc2VFbmRwb2ludChlcCk7CiAgICAgICAgICBwZW5kaW5nTGlzdGVuZXJzLmNsZWFyKCk7CiAgICAgICAgICBpc1Byb3h5UmVsZWFzZWQgPSB0cnVlOwogICAgICAgIH07CiAgICAgIH0KICAgICAgaWYgKHByb3AgPT09ICJ0aGVuIikgewogICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgewogICAgICAgICAgcmV0dXJuIHsgdGhlbjogKCkgPT4gcHJveHkyIH07CiAgICAgICAgfQogICAgICAgIGNvbnN0IHIgPSByZXF1ZXN0UmVzcG9uc2VNZXNzYWdlKGVwLCBwZW5kaW5nTGlzdGVuZXJzLCB7CiAgICAgICAgICB0eXBlOiAiR0VUIiwKICAgICAgICAgIHBhdGg6IHBhdGgubWFwKChwKSA9PiBwLnRvU3RyaW5nKCkpCiAgICAgICAgfSkudGhlbihmcm9tV2lyZVZhbHVlKTsKICAgICAgICByZXR1cm4gci50aGVuLmJpbmQocik7CiAgICAgIH0KICAgICAgcmV0dXJuIGNyZWF0ZVByb3h5KGVwLCBwZW5kaW5nTGlzdGVuZXJzLCBbLi4ucGF0aCwgcHJvcF0pOwogICAgfSwKICAgIHNldChfdGFyZ2V0LCBwcm9wLCByYXdWYWx1ZSkgewogICAgICB0aHJvd0lmUHJveHlSZWxlYXNlZChpc1Byb3h5UmVsZWFzZWQpOwogICAgICBjb25zdCBbdmFsdWUsIHRyYW5zZmVyYWJsZXNdID0gdG9XaXJlVmFsdWUocmF3VmFsdWUpOwogICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgcGVuZGluZ0xpc3RlbmVycywgewogICAgICAgIHR5cGU6ICJTRVQiLAogICAgICAgIHBhdGg6IFsuLi5wYXRoLCBwcm9wXS5tYXAoKHApID0+IHAudG9TdHJpbmcoKSksCiAgICAgICAgdmFsdWUKICAgICAgfSwgdHJhbnNmZXJhYmxlcykudGhlbihmcm9tV2lyZVZhbHVlKTsKICAgIH0sCiAgICBhcHBseShfdGFyZ2V0LCBfdGhpc0FyZywgcmF3QXJndW1lbnRMaXN0KSB7CiAgICAgIHRocm93SWZQcm94eVJlbGVhc2VkKGlzUHJveHlSZWxlYXNlZCk7CiAgICAgIGNvbnN0IGxhc3QgPSBwYXRoW3BhdGgubGVuZ3RoIC0gMV07CiAgICAgIGlmIChsYXN0ID09PSBjcmVhdGVFbmRwb2ludCkgewogICAgICAgIHJldHVybiByZXF1ZXN0UmVzcG9uc2VNZXNzYWdlKGVwLCBwZW5kaW5nTGlzdGVuZXJzLCB7CiAgICAgICAgICB0eXBlOiAiRU5EUE9JTlQiCiAgICAgICAgfSkudGhlbihmcm9tV2lyZVZhbHVlKTsKICAgICAgfQogICAgICBpZiAobGFzdCA9PT0gImJpbmQiKSB7CiAgICAgICAgcmV0dXJuIGNyZWF0ZVByb3h5KGVwLCBwZW5kaW5nTGlzdGVuZXJzLCBwYXRoLnNsaWNlKDAsIC0xKSk7CiAgICAgIH0KICAgICAgY29uc3QgW2FyZ3VtZW50TGlzdCwgdHJhbnNmZXJhYmxlc10gPSBwcm9jZXNzQXJndW1lbnRzKHJhd0FyZ3VtZW50TGlzdCk7CiAgICAgIHJldHVybiByZXF1ZXN0UmVzcG9uc2VNZXNzYWdlKGVwLCBwZW5kaW5nTGlzdGVuZXJzLCB7CiAgICAgICAgdHlwZTogIkFQUExZIiwKICAgICAgICBwYXRoOiBwYXRoLm1hcCgocCkgPT4gcC50b1N0cmluZygpKSwKICAgICAgICBhcmd1bWVudExpc3QKICAgICAgfSwgdHJhbnNmZXJhYmxlcykudGhlbihmcm9tV2lyZVZhbHVlKTsKICAgIH0sCiAgICBjb25zdHJ1Y3QoX3RhcmdldCwgcmF3QXJndW1lbnRMaXN0KSB7CiAgICAgIHRocm93SWZQcm94eVJlbGVhc2VkKGlzUHJveHlSZWxlYXNlZCk7CiAgICAgIGNvbnN0IFthcmd1bWVudExpc3QsIHRyYW5zZmVyYWJsZXNdID0gcHJvY2Vzc0FyZ3VtZW50cyhyYXdBcmd1bWVudExpc3QpOwogICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgcGVuZGluZ0xpc3RlbmVycywgewogICAgICAgIHR5cGU6ICJDT05TVFJVQ1QiLAogICAgICAgIHBhdGg6IHBhdGgubWFwKChwKSA9PiBwLnRvU3RyaW5nKCkpLAogICAgICAgIGFyZ3VtZW50TGlzdAogICAgICB9LCB0cmFuc2ZlcmFibGVzKS50aGVuKGZyb21XaXJlVmFsdWUpOwogICAgfQogIH0pOwogIHJlZ2lzdGVyUHJveHkocHJveHkyLCBlcCk7CiAgcmV0dXJuIHByb3h5MjsKfQpmdW5jdGlvbiBteUZsYXQoYXJyKSB7CiAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIGFycik7Cn0KZnVuY3Rpb24gcHJvY2Vzc0FyZ3VtZW50cyhhcmd1bWVudExpc3QpIHsKICBjb25zdCBwcm9jZXNzZWQgPSBhcmd1bWVudExpc3QubWFwKHRvV2lyZVZhbHVlKTsKICByZXR1cm4gW3Byb2Nlc3NlZC5tYXAoKHYpID0+IHZbMF0pLCBteUZsYXQocHJvY2Vzc2VkLm1hcCgodikgPT4gdlsxXSkpXTsKfQpjb25zdCB0cmFuc2ZlckNhY2hlID0gLyogQF9fUFVSRV9fICovIG5ldyBXZWFrTWFwKCk7CmZ1bmN0aW9uIHRyYW5zZmVyKG9iaiwgdHJhbnNmZXJzKSB7CiAgdHJhbnNmZXJDYWNoZS5zZXQob2JqLCB0cmFuc2ZlcnMpOwogIHJldHVybiBvYmo7Cn0KZnVuY3Rpb24gcHJveHkob2JqKSB7CiAgcmV0dXJuIE9iamVjdC5hc3NpZ24ob2JqLCB7IFtwcm94eU1hcmtlcl06IHRydWUgfSk7Cn0KZnVuY3Rpb24gdG9XaXJlVmFsdWUodmFsdWUpIHsKICBmb3IgKGNvbnN0IFtuYW1lLCBoYW5kbGVyXSBvZiB0cmFuc2ZlckhhbmRsZXJzKSB7CiAgICBpZiAoaGFuZGxlci5jYW5IYW5kbGUodmFsdWUpKSB7CiAgICAgIGNvbnN0IFtzZXJpYWxpemVkVmFsdWUsIHRyYW5zZmVyYWJsZXNdID0gaGFuZGxlci5zZXJpYWxpemUodmFsdWUpOwogICAgICByZXR1cm4gWwogICAgICAgIHsKICAgICAgICAgIHR5cGU6ICJIQU5ETEVSIiwKICAgICAgICAgIG5hbWUsCiAgICAgICAgICB2YWx1ZTogc2VyaWFsaXplZFZhbHVlCiAgICAgICAgfSwKICAgICAgICB0cmFuc2ZlcmFibGVzCiAgICAgIF07CiAgICB9CiAgfQogIHJldHVybiBbCiAgICB7CiAgICAgIHR5cGU6ICJSQVciLAogICAgICB2YWx1ZQogICAgfSwKICAgIHRyYW5zZmVyQ2FjaGUuZ2V0KHZhbHVlKSB8fCBbXQogIF07Cn0KZnVuY3Rpb24gZnJvbVdpcmVWYWx1ZSh2YWx1ZSkgewogIHN3aXRjaCAodmFsdWUudHlwZSkgewogICAgY2FzZSAiSEFORExFUiI6CiAgICAgIHJldHVybiB0cmFuc2ZlckhhbmRsZXJzLmdldCh2YWx1ZS5uYW1lKS5kZXNlcmlhbGl6ZSh2YWx1ZS52YWx1ZSk7CiAgICBjYXNlICJSQVciOgogICAgICByZXR1cm4gdmFsdWUudmFsdWU7CiAgfQp9CmZ1bmN0aW9uIHJlcXVlc3RSZXNwb25zZU1lc3NhZ2UoZXAsIHBlbmRpbmdMaXN0ZW5lcnMsIG1zZywgdHJhbnNmZXJzKSB7CiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7CiAgICBjb25zdCBpZCA9IGdlbmVyYXRlVVVJRCgpOwogICAgcGVuZGluZ0xpc3RlbmVycy5zZXQoaWQsIHJlc29sdmUpOwogICAgaWYgKGVwLnN0YXJ0KSB7CiAgICAgIGVwLnN0YXJ0KCk7CiAgICB9CiAgICBlcC5wb3N0TWVzc2FnZShPYmplY3QuYXNzaWduKHsgaWQgfSwgbXNnKSwgdHJhbnNmZXJzKTsKICB9KTsKfQpmdW5jdGlvbiBnZW5lcmF0ZVVVSUQoKSB7CiAgcmV0dXJuIG5ldyBBcnJheSg0KS5maWxsKDApLm1hcCgoKSA9PiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUikudG9TdHJpbmcoMTYpKS5qb2luKCItIik7Cn0KY29uc3QgQXBwbHlTcHJpdGVzSW1hZ2VEYXRhV29ya2VyID0gewogIGFzeW5jIGFwcGx5U3ByaXRlcyhpbWFnZURhdGEsIHNwcml0ZXMsIHRpbGVTaXplc0J5UmVzb3VyY2VJZCkgewogICAgY29uc3QgY2xpcHBlZEltYWdlRGF0YXMgPSBbXTsKICAgIGZvciAoY29uc3Qgc3ByaXRlIG9mIHNwcml0ZXMpIHsKICAgICAgY29uc3QgdGlsZVNpemVzID0gdGlsZVNpemVzQnlSZXNvdXJjZUlkLmdldChzcHJpdGUuaW1hZ2VJZCk7CiAgICAgIGlmICghdGlsZVNpemVzKSB7CiAgICAgICAgYnJlYWs7CiAgICAgIH0KICAgICAgZm9yIChjb25zdCB0aWxlU2l6ZSBvZiB0aWxlU2l6ZXMpIHsKICAgICAgICBjb25zdCBjbGlwcGVkSW1hZ2VEYXRhID0gbmV3IEltYWdlRGF0YSguLi50aWxlU2l6ZSk7CiAgICAgICAgaWYgKHNwcml0ZS53aWR0aCA+IHRpbGVTaXplWzBdIHx8IHNwcml0ZS5oZWlnaHQgPiB0aWxlU2l6ZVsxXSkgewogICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCJTcHJpdGVzIGxhcmdlciB0aGVuIG9uZSB0aWxlIG5vdCBzdXBwb3J0ZWQgeWV0Iik7CiAgICAgICAgfQogICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgc3ByaXRlLmhlaWdodDsgeSsrKSB7CiAgICAgICAgICBjb25zdCBzcmNTdGFydEluZGV4ID0gKChzcHJpdGUueSArIHkpICogaW1hZ2VEYXRhLndpZHRoICsgc3ByaXRlLngpICogNDsKICAgICAgICAgIGNvbnN0IGRlc3RTdGFydEluZGV4ID0geSAqIHRpbGVTaXplWzBdICogNDsKICAgICAgICAgIGNvbnN0IHJvd0xlbmd0aCA9IHNwcml0ZS53aWR0aCAqIDQ7CiAgICAgICAgICBjbGlwcGVkSW1hZ2VEYXRhLmRhdGEuc2V0KAogICAgICAgICAgICBpbWFnZURhdGEuZGF0YS5zdWJhcnJheShzcmNTdGFydEluZGV4LCBzcmNTdGFydEluZGV4ICsgcm93TGVuZ3RoKSwKICAgICAgICAgICAgZGVzdFN0YXJ0SW5kZXgKICAgICAgICAgICk7CiAgICAgICAgfQogICAgICAgIGNsaXBwZWRJbWFnZURhdGFzLnB1c2goY2xpcHBlZEltYWdlRGF0YSk7CiAgICAgIH0KICAgIH0KICAgIHJldHVybiB0cmFuc2ZlcigKICAgICAgY2xpcHBlZEltYWdlRGF0YXMsCiAgICAgIGNsaXBwZWRJbWFnZURhdGFzLm1hcCgoY2xpcHBlZEltYWdlRGF0YSkgPT4gY2xpcHBlZEltYWdlRGF0YS5kYXRhLmJ1ZmZlcikKICAgICk7CiAgfQp9OwpleHBvc2UoQXBwbHlTcHJpdGVzSW1hZ2VEYXRhV29ya2VyKTsKLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwbHktc3ByaXRlcy1pbWFnZS1kYXRhLURaYThtU0daLmpzLm1hcAo=")], { type: "text/javascript;charset=utf-8" });
function Vv(e) {
	let t;
	try {
		if (t = Bv && (self.URL || self.webkitURL).createObjectURL(Bv), !t) throw "";
		let n = new Worker(t, {
			type: "module",
			name: e?.name
		});
		return n.addEventListener("error", () => {
			(self.URL || self.webkitURL).revokeObjectURL(t);
		}), n;
	} catch {
		return new Worker("data:text/javascript;base64,LyoqCiAqIEBsaWNlbnNlCiAqIENvcHlyaWdodCAyMDE5IEdvb2dsZSBMTEMKICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFwYWNoZS0yLjAKICovCmNvbnN0IHByb3h5TWFya2VyID0gU3ltYm9sKCJDb21saW5rLnByb3h5Iik7CmNvbnN0IGNyZWF0ZUVuZHBvaW50ID0gU3ltYm9sKCJDb21saW5rLmVuZHBvaW50Iik7CmNvbnN0IHJlbGVhc2VQcm94eSA9IFN5bWJvbCgiQ29tbGluay5yZWxlYXNlUHJveHkiKTsKY29uc3QgZmluYWxpemVyID0gU3ltYm9sKCJDb21saW5rLmZpbmFsaXplciIpOwpjb25zdCB0aHJvd01hcmtlciA9IFN5bWJvbCgiQ29tbGluay50aHJvd24iKTsKY29uc3QgaXNPYmplY3QgPSAodmFsKSA9PiB0eXBlb2YgdmFsID09PSAib2JqZWN0IiAmJiB2YWwgIT09IG51bGwgfHwgdHlwZW9mIHZhbCA9PT0gImZ1bmN0aW9uIjsKY29uc3QgcHJveHlUcmFuc2ZlckhhbmRsZXIgPSB7CiAgY2FuSGFuZGxlOiAodmFsKSA9PiBpc09iamVjdCh2YWwpICYmIHZhbFtwcm94eU1hcmtlcl0sCiAgc2VyaWFsaXplKG9iaikgewogICAgY29uc3QgeyBwb3J0MSwgcG9ydDIgfSA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpOwogICAgZXhwb3NlKG9iaiwgcG9ydDEpOwogICAgcmV0dXJuIFtwb3J0MiwgW3BvcnQyXV07CiAgfSwKICBkZXNlcmlhbGl6ZShwb3J0KSB7CiAgICBwb3J0LnN0YXJ0KCk7CiAgICByZXR1cm4gd3JhcChwb3J0KTsKICB9Cn07CmNvbnN0IHRocm93VHJhbnNmZXJIYW5kbGVyID0gewogIGNhbkhhbmRsZTogKHZhbHVlKSA9PiBpc09iamVjdCh2YWx1ZSkgJiYgdGhyb3dNYXJrZXIgaW4gdmFsdWUsCiAgc2VyaWFsaXplKHsgdmFsdWUgfSkgewogICAgbGV0IHNlcmlhbGl6ZWQ7CiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBFcnJvcikgewogICAgICBzZXJpYWxpemVkID0gewogICAgICAgIGlzRXJyb3I6IHRydWUsCiAgICAgICAgdmFsdWU6IHsKICAgICAgICAgIG1lc3NhZ2U6IHZhbHVlLm1lc3NhZ2UsCiAgICAgICAgICBuYW1lOiB2YWx1ZS5uYW1lLAogICAgICAgICAgc3RhY2s6IHZhbHVlLnN0YWNrCiAgICAgICAgfQogICAgICB9OwogICAgfSBlbHNlIHsKICAgICAgc2VyaWFsaXplZCA9IHsgaXNFcnJvcjogZmFsc2UsIHZhbHVlIH07CiAgICB9CiAgICByZXR1cm4gW3NlcmlhbGl6ZWQsIFtdXTsKICB9LAogIGRlc2VyaWFsaXplKHNlcmlhbGl6ZWQpIHsKICAgIGlmIChzZXJpYWxpemVkLmlzRXJyb3IpIHsKICAgICAgdGhyb3cgT2JqZWN0LmFzc2lnbihuZXcgRXJyb3Ioc2VyaWFsaXplZC52YWx1ZS5tZXNzYWdlKSwgc2VyaWFsaXplZC52YWx1ZSk7CiAgICB9CiAgICB0aHJvdyBzZXJpYWxpemVkLnZhbHVlOwogIH0KfTsKY29uc3QgdHJhbnNmZXJIYW5kbGVycyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKFsKICBbInByb3h5IiwgcHJveHlUcmFuc2ZlckhhbmRsZXJdLAogIFsidGhyb3ciLCB0aHJvd1RyYW5zZmVySGFuZGxlcl0KXSk7CmZ1bmN0aW9uIGlzQWxsb3dlZE9yaWdpbihhbGxvd2VkT3JpZ2lucywgb3JpZ2luKSB7CiAgZm9yIChjb25zdCBhbGxvd2VkT3JpZ2luIG9mIGFsbG93ZWRPcmlnaW5zKSB7CiAgICBpZiAob3JpZ2luID09PSBhbGxvd2VkT3JpZ2luIHx8IGFsbG93ZWRPcmlnaW4gPT09ICIqIikgewogICAgICByZXR1cm4gdHJ1ZTsKICAgIH0KICAgIGlmIChhbGxvd2VkT3JpZ2luIGluc3RhbmNlb2YgUmVnRXhwICYmIGFsbG93ZWRPcmlnaW4udGVzdChvcmlnaW4pKSB7CiAgICAgIHJldHVybiB0cnVlOwogICAgfQogIH0KICByZXR1cm4gZmFsc2U7Cn0KZnVuY3Rpb24gZXhwb3NlKG9iaiwgZXAgPSBnbG9iYWxUaGlzLCBhbGxvd2VkT3JpZ2lucyA9IFsiKiJdKSB7CiAgZXAuYWRkRXZlbnRMaXN0ZW5lcigibWVzc2FnZSIsIGZ1bmN0aW9uIGNhbGxiYWNrKGV2KSB7CiAgICBpZiAoIWV2IHx8ICFldi5kYXRhKSB7CiAgICAgIHJldHVybjsKICAgIH0KICAgIGlmICghaXNBbGxvd2VkT3JpZ2luKGFsbG93ZWRPcmlnaW5zLCBldi5vcmlnaW4pKSB7CiAgICAgIGNvbnNvbGUud2FybihgSW52YWxpZCBvcmlnaW4gJyR7ZXYub3JpZ2lufScgZm9yIGNvbWxpbmsgcHJveHlgKTsKICAgICAgcmV0dXJuOwogICAgfQogICAgY29uc3QgeyBpZCwgdHlwZSwgcGF0aCB9ID0gT2JqZWN0LmFzc2lnbih7IHBhdGg6IFtdIH0sIGV2LmRhdGEpOwogICAgY29uc3QgYXJndW1lbnRMaXN0ID0gKGV2LmRhdGEuYXJndW1lbnRMaXN0IHx8IFtdKS5tYXAoZnJvbVdpcmVWYWx1ZSk7CiAgICBsZXQgcmV0dXJuVmFsdWU7CiAgICB0cnkgewogICAgICBjb25zdCBwYXJlbnQgPSBwYXRoLnNsaWNlKDAsIC0xKS5yZWR1Y2UoKG9iajIsIHByb3ApID0+IG9iajJbcHJvcF0sIG9iaik7CiAgICAgIGNvbnN0IHJhd1ZhbHVlID0gcGF0aC5yZWR1Y2UoKG9iajIsIHByb3ApID0+IG9iajJbcHJvcF0sIG9iaik7CiAgICAgIHN3aXRjaCAodHlwZSkgewogICAgICAgIGNhc2UgIkdFVCI6CiAgICAgICAgICB7CiAgICAgICAgICAgIHJldHVyblZhbHVlID0gcmF3VmFsdWU7CiAgICAgICAgICB9CiAgICAgICAgICBicmVhazsKICAgICAgICBjYXNlICJTRVQiOgogICAgICAgICAgewogICAgICAgICAgICBwYXJlbnRbcGF0aC5zbGljZSgtMSlbMF1dID0gZnJvbVdpcmVWYWx1ZShldi5kYXRhLnZhbHVlKTsKICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSB0cnVlOwogICAgICAgICAgfQogICAgICAgICAgYnJlYWs7CiAgICAgICAgY2FzZSAiQVBQTFkiOgogICAgICAgICAgewogICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHJhd1ZhbHVlLmFwcGx5KHBhcmVudCwgYXJndW1lbnRMaXN0KTsKICAgICAgICAgIH0KICAgICAgICAgIGJyZWFrOwogICAgICAgIGNhc2UgIkNPTlNUUlVDVCI6CiAgICAgICAgICB7CiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gbmV3IHJhd1ZhbHVlKC4uLmFyZ3VtZW50TGlzdCk7CiAgICAgICAgICAgIHJldHVyblZhbHVlID0gcHJveHkodmFsdWUpOwogICAgICAgICAgfQogICAgICAgICAgYnJlYWs7CiAgICAgICAgY2FzZSAiRU5EUE9JTlQiOgogICAgICAgICAgewogICAgICAgICAgICBjb25zdCB7IHBvcnQxLCBwb3J0MiB9ID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7CiAgICAgICAgICAgIGV4cG9zZShvYmosIHBvcnQyKTsKICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSB0cmFuc2Zlcihwb3J0MSwgW3BvcnQxXSk7CiAgICAgICAgICB9CiAgICAgICAgICBicmVhazsKICAgICAgICBjYXNlICJSRUxFQVNFIjoKICAgICAgICAgIHsKICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSB2b2lkIDA7CiAgICAgICAgICB9CiAgICAgICAgICBicmVhazsKICAgICAgICBkZWZhdWx0OgogICAgICAgICAgcmV0dXJuOwogICAgICB9CiAgICB9IGNhdGNoICh2YWx1ZSkgewogICAgICByZXR1cm5WYWx1ZSA9IHsgdmFsdWUsIFt0aHJvd01hcmtlcl06IDAgfTsKICAgIH0KICAgIFByb21pc2UucmVzb2x2ZShyZXR1cm5WYWx1ZSkuY2F0Y2goKHZhbHVlKSA9PiB7CiAgICAgIHJldHVybiB7IHZhbHVlLCBbdGhyb3dNYXJrZXJdOiAwIH07CiAgICB9KS50aGVuKChyZXR1cm5WYWx1ZTIpID0+IHsKICAgICAgY29uc3QgW3dpcmVWYWx1ZSwgdHJhbnNmZXJhYmxlc10gPSB0b1dpcmVWYWx1ZShyZXR1cm5WYWx1ZTIpOwogICAgICBlcC5wb3N0TWVzc2FnZShPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHdpcmVWYWx1ZSksIHsgaWQgfSksIHRyYW5zZmVyYWJsZXMpOwogICAgICBpZiAodHlwZSA9PT0gIlJFTEVBU0UiKSB7CiAgICAgICAgZXAucmVtb3ZlRXZlbnRMaXN0ZW5lcigibWVzc2FnZSIsIGNhbGxiYWNrKTsKICAgICAgICBjbG9zZUVuZFBvaW50KGVwKTsKICAgICAgICBpZiAoZmluYWxpemVyIGluIG9iaiAmJiB0eXBlb2Ygb2JqW2ZpbmFsaXplcl0gPT09ICJmdW5jdGlvbiIpIHsKICAgICAgICAgIG9ialtmaW5hbGl6ZXJdKCk7CiAgICAgICAgfQogICAgICB9CiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHsKICAgICAgY29uc3QgW3dpcmVWYWx1ZSwgdHJhbnNmZXJhYmxlc10gPSB0b1dpcmVWYWx1ZSh7CiAgICAgICAgdmFsdWU6IG5ldyBUeXBlRXJyb3IoIlVuc2VyaWFsaXphYmxlIHJldHVybiB2YWx1ZSIpLAogICAgICAgIFt0aHJvd01hcmtlcl06IDAKICAgICAgfSk7CiAgICAgIGVwLnBvc3RNZXNzYWdlKE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgd2lyZVZhbHVlKSwgeyBpZCB9KSwgdHJhbnNmZXJhYmxlcyk7CiAgICB9KTsKICB9KTsKICBpZiAoZXAuc3RhcnQpIHsKICAgIGVwLnN0YXJ0KCk7CiAgfQp9CmZ1bmN0aW9uIGlzTWVzc2FnZVBvcnQoZW5kcG9pbnQpIHsKICByZXR1cm4gZW5kcG9pbnQuY29uc3RydWN0b3IubmFtZSA9PT0gIk1lc3NhZ2VQb3J0IjsKfQpmdW5jdGlvbiBjbG9zZUVuZFBvaW50KGVuZHBvaW50KSB7CiAgaWYgKGlzTWVzc2FnZVBvcnQoZW5kcG9pbnQpKQogICAgZW5kcG9pbnQuY2xvc2UoKTsKfQpmdW5jdGlvbiB3cmFwKGVwLCB0YXJnZXQpIHsKICBjb25zdCBwZW5kaW5nTGlzdGVuZXJzID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTsKICBlcC5hZGRFdmVudExpc3RlbmVyKCJtZXNzYWdlIiwgZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShldikgewogICAgY29uc3QgeyBkYXRhIH0gPSBldjsKICAgIGlmICghZGF0YSB8fCAhZGF0YS5pZCkgewogICAgICByZXR1cm47CiAgICB9CiAgICBjb25zdCByZXNvbHZlciA9IHBlbmRpbmdMaXN0ZW5lcnMuZ2V0KGRhdGEuaWQpOwogICAgaWYgKCFyZXNvbHZlcikgewogICAgICByZXR1cm47CiAgICB9CiAgICB0cnkgewogICAgICByZXNvbHZlcihkYXRhKTsKICAgIH0gZmluYWxseSB7CiAgICAgIHBlbmRpbmdMaXN0ZW5lcnMuZGVsZXRlKGRhdGEuaWQpOwogICAgfQogIH0pOwogIHJldHVybiBjcmVhdGVQcm94eShlcCwgcGVuZGluZ0xpc3RlbmVycywgW10sIHRhcmdldCk7Cn0KZnVuY3Rpb24gdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNSZWxlYXNlZCkgewogIGlmIChpc1JlbGVhc2VkKSB7CiAgICB0aHJvdyBuZXcgRXJyb3IoIlByb3h5IGhhcyBiZWVuIHJlbGVhc2VkIGFuZCBpcyBub3QgdXNlYWJsZSIpOwogIH0KfQpmdW5jdGlvbiByZWxlYXNlRW5kcG9pbnQoZXApIHsKICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKSwgewogICAgdHlwZTogIlJFTEVBU0UiCiAgfSkudGhlbigoKSA9PiB7CiAgICBjbG9zZUVuZFBvaW50KGVwKTsKICB9KTsKfQpjb25zdCBwcm94eUNvdW50ZXIgPSAvKiBAX19QVVJFX18gKi8gbmV3IFdlYWtNYXAoKTsKY29uc3QgcHJveHlGaW5hbGl6ZXJzID0gIkZpbmFsaXphdGlvblJlZ2lzdHJ5IiBpbiBnbG9iYWxUaGlzICYmIG5ldyBGaW5hbGl6YXRpb25SZWdpc3RyeSgoZXApID0+IHsKICBjb25zdCBuZXdDb3VudCA9IChwcm94eUNvdW50ZXIuZ2V0KGVwKSB8fCAwKSAtIDE7CiAgcHJveHlDb3VudGVyLnNldChlcCwgbmV3Q291bnQpOwogIGlmIChuZXdDb3VudCA9PT0gMCkgewogICAgcmVsZWFzZUVuZHBvaW50KGVwKTsKICB9Cn0pOwpmdW5jdGlvbiByZWdpc3RlclByb3h5KHByb3h5MiwgZXApIHsKICBjb25zdCBuZXdDb3VudCA9IChwcm94eUNvdW50ZXIuZ2V0KGVwKSB8fCAwKSArIDE7CiAgcHJveHlDb3VudGVyLnNldChlcCwgbmV3Q291bnQpOwogIGlmIChwcm94eUZpbmFsaXplcnMpIHsKICAgIHByb3h5RmluYWxpemVycy5yZWdpc3Rlcihwcm94eTIsIGVwLCBwcm94eTIpOwogIH0KfQpmdW5jdGlvbiB1bnJlZ2lzdGVyUHJveHkocHJveHkyKSB7CiAgaWYgKHByb3h5RmluYWxpemVycykgewogICAgcHJveHlGaW5hbGl6ZXJzLnVucmVnaXN0ZXIocHJveHkyKTsKICB9Cn0KZnVuY3Rpb24gY3JlYXRlUHJveHkoZXAsIHBlbmRpbmdMaXN0ZW5lcnMsIHBhdGggPSBbXSwgdGFyZ2V0ID0gZnVuY3Rpb24oKSB7Cn0pIHsKICBsZXQgaXNQcm94eVJlbGVhc2VkID0gZmFsc2U7CiAgY29uc3QgcHJveHkyID0gbmV3IFByb3h5KHRhcmdldCwgewogICAgZ2V0KF90YXJnZXQsIHByb3ApIHsKICAgICAgdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNQcm94eVJlbGVhc2VkKTsKICAgICAgaWYgKHByb3AgPT09IHJlbGVhc2VQcm94eSkgewogICAgICAgIHJldHVybiAoKSA9PiB7CiAgICAgICAgICB1bnJlZ2lzdGVyUHJveHkocHJveHkyKTsKICAgICAgICAgIHJlbGVhc2VFbmRwb2ludChlcCk7CiAgICAgICAgICBwZW5kaW5nTGlzdGVuZXJzLmNsZWFyKCk7CiAgICAgICAgICBpc1Byb3h5UmVsZWFzZWQgPSB0cnVlOwogICAgICAgIH07CiAgICAgIH0KICAgICAgaWYgKHByb3AgPT09ICJ0aGVuIikgewogICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgewogICAgICAgICAgcmV0dXJuIHsgdGhlbjogKCkgPT4gcHJveHkyIH07CiAgICAgICAgfQogICAgICAgIGNvbnN0IHIgPSByZXF1ZXN0UmVzcG9uc2VNZXNzYWdlKGVwLCBwZW5kaW5nTGlzdGVuZXJzLCB7CiAgICAgICAgICB0eXBlOiAiR0VUIiwKICAgICAgICAgIHBhdGg6IHBhdGgubWFwKChwKSA9PiBwLnRvU3RyaW5nKCkpCiAgICAgICAgfSkudGhlbihmcm9tV2lyZVZhbHVlKTsKICAgICAgICByZXR1cm4gci50aGVuLmJpbmQocik7CiAgICAgIH0KICAgICAgcmV0dXJuIGNyZWF0ZVByb3h5KGVwLCBwZW5kaW5nTGlzdGVuZXJzLCBbLi4ucGF0aCwgcHJvcF0pOwogICAgfSwKICAgIHNldChfdGFyZ2V0LCBwcm9wLCByYXdWYWx1ZSkgewogICAgICB0aHJvd0lmUHJveHlSZWxlYXNlZChpc1Byb3h5UmVsZWFzZWQpOwogICAgICBjb25zdCBbdmFsdWUsIHRyYW5zZmVyYWJsZXNdID0gdG9XaXJlVmFsdWUocmF3VmFsdWUpOwogICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgcGVuZGluZ0xpc3RlbmVycywgewogICAgICAgIHR5cGU6ICJTRVQiLAogICAgICAgIHBhdGg6IFsuLi5wYXRoLCBwcm9wXS5tYXAoKHApID0+IHAudG9TdHJpbmcoKSksCiAgICAgICAgdmFsdWUKICAgICAgfSwgdHJhbnNmZXJhYmxlcykudGhlbihmcm9tV2lyZVZhbHVlKTsKICAgIH0sCiAgICBhcHBseShfdGFyZ2V0LCBfdGhpc0FyZywgcmF3QXJndW1lbnRMaXN0KSB7CiAgICAgIHRocm93SWZQcm94eVJlbGVhc2VkKGlzUHJveHlSZWxlYXNlZCk7CiAgICAgIGNvbnN0IGxhc3QgPSBwYXRoW3BhdGgubGVuZ3RoIC0gMV07CiAgICAgIGlmIChsYXN0ID09PSBjcmVhdGVFbmRwb2ludCkgewogICAgICAgIHJldHVybiByZXF1ZXN0UmVzcG9uc2VNZXNzYWdlKGVwLCBwZW5kaW5nTGlzdGVuZXJzLCB7CiAgICAgICAgICB0eXBlOiAiRU5EUE9JTlQiCiAgICAgICAgfSkudGhlbihmcm9tV2lyZVZhbHVlKTsKICAgICAgfQogICAgICBpZiAobGFzdCA9PT0gImJpbmQiKSB7CiAgICAgICAgcmV0dXJuIGNyZWF0ZVByb3h5KGVwLCBwZW5kaW5nTGlzdGVuZXJzLCBwYXRoLnNsaWNlKDAsIC0xKSk7CiAgICAgIH0KICAgICAgY29uc3QgW2FyZ3VtZW50TGlzdCwgdHJhbnNmZXJhYmxlc10gPSBwcm9jZXNzQXJndW1lbnRzKHJhd0FyZ3VtZW50TGlzdCk7CiAgICAgIHJldHVybiByZXF1ZXN0UmVzcG9uc2VNZXNzYWdlKGVwLCBwZW5kaW5nTGlzdGVuZXJzLCB7CiAgICAgICAgdHlwZTogIkFQUExZIiwKICAgICAgICBwYXRoOiBwYXRoLm1hcCgocCkgPT4gcC50b1N0cmluZygpKSwKICAgICAgICBhcmd1bWVudExpc3QKICAgICAgfSwgdHJhbnNmZXJhYmxlcykudGhlbihmcm9tV2lyZVZhbHVlKTsKICAgIH0sCiAgICBjb25zdHJ1Y3QoX3RhcmdldCwgcmF3QXJndW1lbnRMaXN0KSB7CiAgICAgIHRocm93SWZQcm94eVJlbGVhc2VkKGlzUHJveHlSZWxlYXNlZCk7CiAgICAgIGNvbnN0IFthcmd1bWVudExpc3QsIHRyYW5zZmVyYWJsZXNdID0gcHJvY2Vzc0FyZ3VtZW50cyhyYXdBcmd1bWVudExpc3QpOwogICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgcGVuZGluZ0xpc3RlbmVycywgewogICAgICAgIHR5cGU6ICJDT05TVFJVQ1QiLAogICAgICAgIHBhdGg6IHBhdGgubWFwKChwKSA9PiBwLnRvU3RyaW5nKCkpLAogICAgICAgIGFyZ3VtZW50TGlzdAogICAgICB9LCB0cmFuc2ZlcmFibGVzKS50aGVuKGZyb21XaXJlVmFsdWUpOwogICAgfQogIH0pOwogIHJlZ2lzdGVyUHJveHkocHJveHkyLCBlcCk7CiAgcmV0dXJuIHByb3h5MjsKfQpmdW5jdGlvbiBteUZsYXQoYXJyKSB7CiAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIGFycik7Cn0KZnVuY3Rpb24gcHJvY2Vzc0FyZ3VtZW50cyhhcmd1bWVudExpc3QpIHsKICBjb25zdCBwcm9jZXNzZWQgPSBhcmd1bWVudExpc3QubWFwKHRvV2lyZVZhbHVlKTsKICByZXR1cm4gW3Byb2Nlc3NlZC5tYXAoKHYpID0+IHZbMF0pLCBteUZsYXQocHJvY2Vzc2VkLm1hcCgodikgPT4gdlsxXSkpXTsKfQpjb25zdCB0cmFuc2ZlckNhY2hlID0gLyogQF9fUFVSRV9fICovIG5ldyBXZWFrTWFwKCk7CmZ1bmN0aW9uIHRyYW5zZmVyKG9iaiwgdHJhbnNmZXJzKSB7CiAgdHJhbnNmZXJDYWNoZS5zZXQob2JqLCB0cmFuc2ZlcnMpOwogIHJldHVybiBvYmo7Cn0KZnVuY3Rpb24gcHJveHkob2JqKSB7CiAgcmV0dXJuIE9iamVjdC5hc3NpZ24ob2JqLCB7IFtwcm94eU1hcmtlcl06IHRydWUgfSk7Cn0KZnVuY3Rpb24gdG9XaXJlVmFsdWUodmFsdWUpIHsKICBmb3IgKGNvbnN0IFtuYW1lLCBoYW5kbGVyXSBvZiB0cmFuc2ZlckhhbmRsZXJzKSB7CiAgICBpZiAoaGFuZGxlci5jYW5IYW5kbGUodmFsdWUpKSB7CiAgICAgIGNvbnN0IFtzZXJpYWxpemVkVmFsdWUsIHRyYW5zZmVyYWJsZXNdID0gaGFuZGxlci5zZXJpYWxpemUodmFsdWUpOwogICAgICByZXR1cm4gWwogICAgICAgIHsKICAgICAgICAgIHR5cGU6ICJIQU5ETEVSIiwKICAgICAgICAgIG5hbWUsCiAgICAgICAgICB2YWx1ZTogc2VyaWFsaXplZFZhbHVlCiAgICAgICAgfSwKICAgICAgICB0cmFuc2ZlcmFibGVzCiAgICAgIF07CiAgICB9CiAgfQogIHJldHVybiBbCiAgICB7CiAgICAgIHR5cGU6ICJSQVciLAogICAgICB2YWx1ZQogICAgfSwKICAgIHRyYW5zZmVyQ2FjaGUuZ2V0KHZhbHVlKSB8fCBbXQogIF07Cn0KZnVuY3Rpb24gZnJvbVdpcmVWYWx1ZSh2YWx1ZSkgewogIHN3aXRjaCAodmFsdWUudHlwZSkgewogICAgY2FzZSAiSEFORExFUiI6CiAgICAgIHJldHVybiB0cmFuc2ZlckhhbmRsZXJzLmdldCh2YWx1ZS5uYW1lKS5kZXNlcmlhbGl6ZSh2YWx1ZS52YWx1ZSk7CiAgICBjYXNlICJSQVciOgogICAgICByZXR1cm4gdmFsdWUudmFsdWU7CiAgfQp9CmZ1bmN0aW9uIHJlcXVlc3RSZXNwb25zZU1lc3NhZ2UoZXAsIHBlbmRpbmdMaXN0ZW5lcnMsIG1zZywgdHJhbnNmZXJzKSB7CiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7CiAgICBjb25zdCBpZCA9IGdlbmVyYXRlVVVJRCgpOwogICAgcGVuZGluZ0xpc3RlbmVycy5zZXQoaWQsIHJlc29sdmUpOwogICAgaWYgKGVwLnN0YXJ0KSB7CiAgICAgIGVwLnN0YXJ0KCk7CiAgICB9CiAgICBlcC5wb3N0TWVzc2FnZShPYmplY3QuYXNzaWduKHsgaWQgfSwgbXNnKSwgdHJhbnNmZXJzKTsKICB9KTsKfQpmdW5jdGlvbiBnZW5lcmF0ZVVVSUQoKSB7CiAgcmV0dXJuIG5ldyBBcnJheSg0KS5maWxsKDApLm1hcCgoKSA9PiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUikudG9TdHJpbmcoMTYpKS5qb2luKCItIik7Cn0KY29uc3QgQXBwbHlTcHJpdGVzSW1hZ2VEYXRhV29ya2VyID0gewogIGFzeW5jIGFwcGx5U3ByaXRlcyhpbWFnZURhdGEsIHNwcml0ZXMsIHRpbGVTaXplc0J5UmVzb3VyY2VJZCkgewogICAgY29uc3QgY2xpcHBlZEltYWdlRGF0YXMgPSBbXTsKICAgIGZvciAoY29uc3Qgc3ByaXRlIG9mIHNwcml0ZXMpIHsKICAgICAgY29uc3QgdGlsZVNpemVzID0gdGlsZVNpemVzQnlSZXNvdXJjZUlkLmdldChzcHJpdGUuaW1hZ2VJZCk7CiAgICAgIGlmICghdGlsZVNpemVzKSB7CiAgICAgICAgYnJlYWs7CiAgICAgIH0KICAgICAgZm9yIChjb25zdCB0aWxlU2l6ZSBvZiB0aWxlU2l6ZXMpIHsKICAgICAgICBjb25zdCBjbGlwcGVkSW1hZ2VEYXRhID0gbmV3IEltYWdlRGF0YSguLi50aWxlU2l6ZSk7CiAgICAgICAgaWYgKHNwcml0ZS53aWR0aCA+IHRpbGVTaXplWzBdIHx8IHNwcml0ZS5oZWlnaHQgPiB0aWxlU2l6ZVsxXSkgewogICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCJTcHJpdGVzIGxhcmdlciB0aGVuIG9uZSB0aWxlIG5vdCBzdXBwb3J0ZWQgeWV0Iik7CiAgICAgICAgfQogICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgc3ByaXRlLmhlaWdodDsgeSsrKSB7CiAgICAgICAgICBjb25zdCBzcmNTdGFydEluZGV4ID0gKChzcHJpdGUueSArIHkpICogaW1hZ2VEYXRhLndpZHRoICsgc3ByaXRlLngpICogNDsKICAgICAgICAgIGNvbnN0IGRlc3RTdGFydEluZGV4ID0geSAqIHRpbGVTaXplWzBdICogNDsKICAgICAgICAgIGNvbnN0IHJvd0xlbmd0aCA9IHNwcml0ZS53aWR0aCAqIDQ7CiAgICAgICAgICBjbGlwcGVkSW1hZ2VEYXRhLmRhdGEuc2V0KAogICAgICAgICAgICBpbWFnZURhdGEuZGF0YS5zdWJhcnJheShzcmNTdGFydEluZGV4LCBzcmNTdGFydEluZGV4ICsgcm93TGVuZ3RoKSwKICAgICAgICAgICAgZGVzdFN0YXJ0SW5kZXgKICAgICAgICAgICk7CiAgICAgICAgfQogICAgICAgIGNsaXBwZWRJbWFnZURhdGFzLnB1c2goY2xpcHBlZEltYWdlRGF0YSk7CiAgICAgIH0KICAgIH0KICAgIHJldHVybiB0cmFuc2ZlcigKICAgICAgY2xpcHBlZEltYWdlRGF0YXMsCiAgICAgIGNsaXBwZWRJbWFnZURhdGFzLm1hcCgoY2xpcHBlZEltYWdlRGF0YSkgPT4gY2xpcHBlZEltYWdlRGF0YS5kYXRhLmJ1ZmZlcikKICAgICk7CiAgfQp9OwpleHBvc2UoQXBwbHlTcHJpdGVzSW1hZ2VEYXRhV29ya2VyKTsKLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwbHktc3ByaXRlcy1pbWFnZS1kYXRhLURaYThtU0daLmpzLm1hcAo=", {
			type: "module",
			name: e?.name
		});
	}
}
//#endregion
//#region node_modules/@allmaps/render/dist/renderers/WebGL2Renderer.js
var Hv = 200, Uv = {
	leading: !0,
	trailing: !0
}, Wv = 50, Gv = {
	leading: !0,
	trailing: !0
}, Kv = 100 * 2 ** -52, qv = 5, Jv = 750, Yv = {}, Xv = class extends wv {
	#e;
	#t;
	gl;
	mapProgram;
	linesProgram;
	pointsProgram;
	uniformCache;
	previousSignificantViewport;
	lastAnimationFrameRequestId;
	animating = !1;
	animationStart;
	animationProgress = 0;
	disableRender = !1;
	throttledPrepareRenderInternal;
	throttledChanged;
	constructor(e, t) {
		let n = E_(e, e.VERTEX_SHADER, Mv), r = E_(e, e.FRAGMENT_SHADER, Nv), i = E_(e, e.VERTEX_SHADER, Pv), a = E_(e, e.FRAGMENT_SHADER, Fv), o = E_(e, e.VERTEX_SHADER, Iv), s = E_(e, e.FRAGMENT_SHADER, Lv), c = D_(e, n, r), l = D_(e, i, a), u = D_(e, o, s), d = new zv(), f = new Vv(), p = Ia(d), m = Ia(f);
		super(av(e, c, l, u), Ev.createFactory(p, m), t), this.#e = d, this.#t = f, this.gl = e, this.options = M(Yv, this.options), this.mapProgram = c, this.linesProgram = l, this.pointsProgram = u, this.uniformCache = /* @__PURE__ */ new Map(), e.deleteShader(n), e.deleteShader(r), e.deleteShader(n), e.deleteShader(r), e.deleteShader(n), e.deleteShader(r), e.disable(e.DEPTH_TEST), this.addEventListeners(), this.throttledPrepareRenderInternal = wa(this.prepareRenderInternal.bind(this), Hv, Uv), this.throttledChanged = wa(this.changed.bind(this), Wv, Gv);
	}
	initializeWebGL(e) {
		let t = E_(e, e.VERTEX_SHADER, Mv), n = E_(e, e.FRAGMENT_SHADER, Nv), r = E_(e, e.VERTEX_SHADER, Pv), i = E_(e, e.FRAGMENT_SHADER, Fv), a = E_(e, e.VERTEX_SHADER, Iv), o = E_(e, e.FRAGMENT_SHADER, Lv), s = D_(e, t, n), c = D_(e, r, i), l = D_(e, a, o);
		this.gl = e, this.mapProgram = s, this.linesProgram = c, this.pointsProgram = l, this.uniformCache = /* @__PURE__ */ new Map(), e.disable(e.DEPTH_TEST);
		for (let e of this.warpedMapList.getWarpedMaps()) e.initializeWebGL(s, c, l);
	}
	render(e) {
		this.disableRender || (this.viewport = e || this.viewport || jv.fromSizeAndMaps([this.gl.canvas.width, this.gl.canvas.width], this.warpedMapList), this.loadMissingImagesInViewport(), this.someImagesInViewport() && this.throttledPrepareRenderInternal(), this.renderInternal());
	}
	clear() {
		this.warpedMapList.clear(), this.mapsInViewport = /* @__PURE__ */ new Set(), this.mapsWithFetchableTilesForViewport = /* @__PURE__ */ new Set(), this.gl.clear(this.gl.DEPTH_BUFFER_BIT | this.gl.COLOR_BUFFER_BIT), this.tileCache.clear();
	}
	cancelThrottledFunctions() {
		this.throttledPrepareRenderInternal.cancel(), this.throttledChanged.cancel();
	}
	destroy() {
		this.cancelThrottledFunctions();
		for (let e of this.warpedMapList.getWarpedMaps()) this.removeEventListenersFromWebGL2WarpedMap(e);
		this.removeEventListeners(), super.destroy(), this.gl.deleteProgram(this.mapProgram), this.gl.deleteProgram(this.linesProgram), this.gl.deleteProgram(this.pointsProgram), this.#e.terminate(), this.#t.terminate();
	}
	getUniformLocation(e, t, n) {
		let r = this.uniformCache.get(t);
		if (r || (r = /* @__PURE__ */ new Map(), this.uniformCache.set(t, r)), !r.has(n)) {
			let i = e.getUniformLocation(t, n);
			r.set(n, i);
		}
		return r.get(n);
	}
	updateMapsForViewport(e) {
		let { mapsEnteringViewport: t, mapsLeavingViewport: n } = super.updateMapsForViewport(e);
		return this.updateVertexBuffers(t), {
			mapsEnteringViewport: t,
			mapsLeavingViewport: n
		};
	}
	resetPrevious(e) {
		let t = this.warpedMapList.getWarpedMaps({ mapIds: e });
		for (let e of t) e.resetPrevious();
	}
	updateVertexBuffers(e) {
		if (!this.viewport) return;
		let t = this.warpedMapList.getWarpedMaps({ mapIds: e });
		for (let e of t) e.updateVertexBuffers(this.viewport.projectedGeoToClipHomogeneousTransform);
	}
	prepareRenderInternal() {
		this.assureProjection(), this.requestFetchableTiles();
	}
	shouldRequestFetchableTiles() {
		if (!this.viewport || this.animating) return !1;
		if (this.previousSignificantViewport) {
			let e = [];
			for (let t = 0; t < 4; t++) e.push(_s(this.previousSignificantViewport.projectedGeoRectangle[t], this.viewport.projectedGeoRectangle[t]) / this.viewport.projectedGeoPerViewportScale ** 2);
			let t = Math.max(...e);
			return t < Kv ? !0 : t > qv ** 2 ? (this.previousSignificantViewport = this.viewport, !0) : !1;
		} else return this.previousSignificantViewport = this.viewport, !0;
	}
	shouldAnticipateInteraction() {
		return !0;
	}
	renderInternal() {
		if (!this.viewport) return;
		let e = this.gl;
		e.viewport(0, 0, e.canvas.width, e.canvas.height), e.enable(e.BLEND), e.blendFunc(e.ONE, e.ONE_MINUS_SRC_ALPHA), this.renderMapsInternal(), this.renderLinesInternal(), this.renderPointsInternal();
	}
	renderMapsInternal() {
		if (this.viewport) {
			this.setMapProgramUniforms();
			for (let e of this.mapsWithFetchableTilesForViewport) {
				let t = this.warpedMapList.getWarpedMap(e);
				if (!t || !t.shouldRenderMap()) continue;
				this.setMapProgramMapUniforms(t);
				let n = t.resourceTrianglePoints.length, r = this.gl.TRIANGLES;
				this.gl.bindVertexArray(t.mapVao), this.gl.drawArrays(r, 0, n);
			}
		}
	}
	renderLinesInternal() {
		this.setLinesProgramUniforms();
		for (let e of this.mapsWithFetchableTilesForViewport) {
			let t = this.warpedMapList.getWarpedMap(e);
			if (!t || !t.shouldRenderLines()) continue;
			this.setLinesProgramMapUniforms(t);
			let n = t.lineGroups.reduce((e, t) => e + t.projectedGeoLines.length, 0) * 6, r = this.gl.TRIANGLES;
			this.gl.bindVertexArray(t.linesVao), this.gl.drawArrays(r, 0, n);
		}
	}
	renderPointsInternal() {
		this.setPointsProgramUniforms();
		for (let e of this.mapsWithFetchableTilesForViewport) {
			let t = this.warpedMapList.getWarpedMap(e);
			if (!t || !t.shouldRenderPoints()) continue;
			this.setPointsProgramMapUniforms(t);
			let n = t.pointGroups.reduce((e, t) => e + t.projectedGeoPoints.length, 0), r = this.gl.POINTS;
			this.gl.bindVertexArray(t.pointsVao), this.gl.drawArrays(r, 0, n);
		}
	}
	setMapProgramUniforms() {
		let e = this.mapProgram, t = this.gl;
		t.useProgram(e);
		let n = this.getUniformLocation(t, e, "u_animationProgress");
		t.uniform1f(n, this.animationProgress);
	}
	setMapProgramMapUniforms(e) {
		if (!this.viewport) return;
		let t = this.gl, n = this.mapProgram;
		t.useProgram(n);
		let r = h_(this.viewport.projectedGeoToClipHomogeneousTransform, e.invertedRenderHomogeneousTransform), i = this.getUniformLocation(t, n, "u_renderHomogeneousTransform");
		t.uniformMatrix4fv(i, !1, y_(r));
		let a = this.getUniformLocation(t, n, "u_opacity");
		t.uniform1f(a, e.options.opacity);
		let o = this.getUniformLocation(t, n, "u_saturation");
		t.uniform1f(o, e.options.saturation);
		let s = this.getUniformLocation(t, n, "u_removeColor");
		t.uniform1f(s, +!!e.options.removeColor);
		let c = this.getUniformLocation(t, n, "u_removeColorColor");
		t.uniform3fv(c, Fc(e.options.removeColorColor));
		let l = this.getUniformLocation(t, n, "u_removeColorThreshold");
		t.uniform1f(l, e.options.removeColorThreshold);
		let u = this.getUniformLocation(t, n, "u_removeColorHardness");
		t.uniform1f(u, e.options.removeColorHardness);
		let d = this.getUniformLocation(t, n, "u_colorize");
		t.uniform1f(d, +!!e.options.colorize);
		let f = this.getUniformLocation(t, n, "u_colorizeColor");
		t.uniform3fv(f, Fc(e.options.colorizeColor));
		let p = this.getUniformLocation(t, n, "u_renderGrid");
		t.uniform1f(p, +!!e.options.renderGrid);
		let m = this.getUniformLocation(t, n, "u_renderGridColor");
		t.uniform4fv(m, Ic(e.options.renderGridColor));
		let h = this.getUniformLocation(t, n, "u_distortion");
		t.uniform1f(h, +!!e.distortionMeasure);
		let g = this.getUniformLocation(t, n, "u_distortionMeasure");
		t.uniform1i(g, e.distortionMeasure ? bl.indexOf(e.distortionMeasure) : 0);
		let _ = this.getUniformLocation(t, n, "u_distortionColor00");
		t.uniform4fv(_, Ic(e.options.distortionColor00));
		let v = this.getUniformLocation(t, n, "u_distortionColor01");
		t.uniform4fv(v, Ic(e.options.distortionColor01));
		let y = this.getUniformLocation(t, n, "u_distortionColor1");
		t.uniform4fv(y, Ic(e.options.distortionColor1));
		let b = this.getUniformLocation(t, n, "u_distortionColor2");
		t.uniform4fv(b, Ic(e.options.distortionColor2));
		let x = this.getUniformLocation(t, n, "u_distortionColor3");
		t.uniform4fv(x, Ic(e.options.distortionColor3));
		let S = this.getUniformLocation(t, n, "u_debugTriangles");
		t.uniform1f(S, +!!e.options.debugTriangles);
		let ee = this.getUniformLocation(t, n, "u_debugTiles");
		t.uniform1f(ee, +!!e.options.debugTiles);
		let C = this.getUniformLocation(t, n, "u_scaleFactorForViewport"), w = e.tileZoomLevelForViewport ? e.tileZoomLevelForViewport.scaleFactor : 1;
		t.uniform1i(C, w);
		let te = this.getUniformLocation(t, n, "u_cachedTilesTextureArray");
		t.uniform1i(te, 0), t.activeTexture(t.TEXTURE0), t.bindTexture(t.TEXTURE_2D_ARRAY, e.cachedTilesTextureArray);
		let ne = this.getUniformLocation(t, n, "u_cachedTilesResourceOriginPointsAndSizesTexture");
		t.uniform1i(ne, 1), t.activeTexture(t.TEXTURE1), t.bindTexture(t.TEXTURE_2D, e.cachedTilesResourceOriginPointsAndSizesTexture);
		let T = this.getUniformLocation(t, n, "u_cachedTilesScaleFactorsTexture");
		t.uniform1i(T, 2), t.activeTexture(t.TEXTURE2), t.bindTexture(t.TEXTURE_2D, e.cachedTilesScaleFactorsTexture);
	}
	setLinesProgramUniforms() {
		if (!this.viewport) return;
		let e = this.gl, t = this.linesProgram;
		e.useProgram(t);
		let n = this.getUniformLocation(e, t, "u_viewportToClipHomogeneousTransform");
		e.uniformMatrix4fv(n, !1, y_(this.viewport.viewportToClipHomogeneousTransform));
		let r = this.getUniformLocation(e, t, "u_clipToViewportHomogeneousTransform");
		e.uniformMatrix4fv(r, !1, y_(__(this.viewport.viewportToClipHomogeneousTransform)));
		let i = this.getUniformLocation(e, t, "u_animationProgress");
		e.uniform1f(i, this.animationProgress);
	}
	setLinesProgramMapUniforms(e) {
		if (!this.viewport) return;
		let t = this.gl, n = this.linesProgram;
		t.useProgram(n);
		let r = h_(this.viewport.projectedGeoToClipHomogeneousTransform, e.invertedRenderHomogeneousTransform), i = this.getUniformLocation(t, n, "u_renderHomogeneousTransform");
		t.uniformMatrix4fv(i, !1, y_(r));
	}
	setPointsProgramUniforms() {
		if (!this.viewport) return;
		let e = this.gl, t = this.pointsProgram;
		e.useProgram(t);
		let n = this.getUniformLocation(e, t, "u_animationProgress");
		e.uniform1f(n, this.animationProgress);
		let r = this.getUniformLocation(e, t, "u_devicePixelRatio");
		e.uniform1f(r, this.viewport.devicePixelRatio);
	}
	setPointsProgramMapUniforms(e) {
		if (!this.viewport) return;
		let t = this.gl, n = this.pointsProgram;
		t.useProgram(n);
		let r = h_(this.viewport.projectedGeoToClipHomogeneousTransform, e.invertedRenderHomogeneousTransform), i = this.getUniformLocation(t, n, "u_renderHomogeneousTransform");
		t.uniformMatrix4fv(i, !1, y_(r));
	}
	startAnimation(e) {
		this.changed(), this.updateVertexBuffers(e), this.lastAnimationFrameRequestId !== void 0 && cancelAnimationFrame(this.lastAnimationFrameRequestId), this.animating = !0, this.animationProgress = 0, this.animationStart = void 0, this.lastAnimationFrameRequestId = requestAnimationFrame(((t) => this.animationFrame(t, e)).bind(this));
	}
	animationFrame(e, t) {
		this.animationStart ||= e, e - this.animationStart < Jv ? (this.animationProgress = (e - this.animationStart) / Jv, this.changed(), this.renderInternal(), this.lastAnimationFrameRequestId = requestAnimationFrame(((e) => this.animationFrame(e, t)).bind(this))) : this.finishAnimation(t);
	}
	finishAnimation(e) {
		this.resetPrevious(e), this.updateVertexBuffers(e), this.animating = !1, this.animationProgress = 0, this.animationStart = void 0, this.changed();
	}
	changed() {
		this.dispatchEvent(new I(F.CHANGED));
	}
	imageLoaded(e) {
		e instanceof I && this.dispatchEvent(new I(F.IMAGELOADED, e.data));
	}
	clearMap(e) {
		let t = this.warpedMapList.getWarpedMap(e);
		t && t.clearTextures();
	}
	mapTileLoaded(e) {
		if (e instanceof I) {
			if (!e.data?.mapIds || !e.data?.tileUrl) throw Error("Event data missing");
			let { mapIds: t, tileUrl: n } = e.data, r = t[0], i = this.tileCache.getCacheableTile(n);
			if (!i || !i.isCachedTile()) return;
			let a = this.warpedMapList.getWarpedMap(r);
			if (!a) return;
			a.addCachedTileAndUpdateTextures(i);
		}
	}
	mapTileDeleted(e) {
		if (e instanceof I) {
			if (!e.data?.mapIds || !e.data.tileUrl) throw Error("Event data missing");
			let { mapIds: t, tileUrl: n } = e.data, r = t[0], i = this.warpedMapList.getWarpedMap(r);
			if (!i) return;
			i.removeCachedTileAndUpdateTextures(n);
		}
	}
	warpedMapAdded(e) {
		if (e instanceof I) {
			if (!e.data?.mapIds) throw Error("Event data missing");
			let { mapIds: t } = e.data, n = t[0], r = this.warpedMapList.getWarpedMap(n);
			r && this.addEventListenersToWebGL2WarpedMap(r);
		}
	}
	prepareChange(e) {
		if (e instanceof I) {
			if (!e.data?.mapIds) throw Error("Event data missing");
			let { mapIds: t } = e.data;
			for (let e of this.warpedMapList.getWarpedMaps({ mapIds: t })) this.animating && e.mixPreviousAndNew(1 - this.animationProgress);
		}
	}
	animatedChange(e) {
		if (e instanceof I) {
			if (!e.data?.mapIds) throw Error("Event data missing");
			let { mapIds: t } = e.data;
			this.startAnimation(t);
		}
	}
	immediateChange(e) {
		if (e instanceof I) {
			if (!e.data?.mapIds) throw Error("Event data missing");
			let { mapIds: t } = e.data;
			this.finishAnimation(t);
		}
	}
	addEventListenersToWebGL2WarpedMap(e) {
		e.addEventListener(F.TEXTURESUPDATED, this.throttledChanged.bind(this));
	}
	removeEventListenersFromWebGL2WarpedMap(e) {
		e.removeEventListener(F.TEXTURESUPDATED, this.throttledChanged.bind(this));
	}
	contextLost() {
		this.disableRender = !0, this.cancelThrottledFunctions();
		for (let e of this.warpedMapList.getWarpedMaps()) e.cancelThrottledFunctions();
		this.tileCache.clear();
	}
	contextRestored() {
		this.initializeWebGL(this.gl), this.disableRender = !1;
	}
}, Zv = "Renderer not defined. Add the layer to a map before calling this function.", Qv = "Canvas not defined. Add the layer to a map before calling this function.", $v = class e {
	defaultSpecificWarpedMapLayerOptions;
	options;
	container;
	canvas;
	gl;
	renderer;
	constructor(e, t) {
		this.defaultSpecificWarpedMapLayerOptions = e, this.options = M(this.defaultSpecificWarpedMapLayerOptions, t);
	}
	async addGeoreferenceAnnotation(t, n) {
		e.assertRenderer(this.renderer);
		let r = await this.renderer.addGeoreferenceAnnotation(t, n);
		return this.nativeUpdate(), r;
	}
	async removeGeoreferenceAnnotation(t) {
		e.assertRenderer(this.renderer);
		let n = await this.renderer.warpedMapList.removeGeoreferenceAnnotation(t);
		return this.nativeUpdate(), n;
	}
	async addGeoreferenceAnnotationByUrl(e, t) {
		let n = await fetch(e).then((e) => e.json());
		return this.addGeoreferenceAnnotation(n, t);
	}
	async removeGeoreferenceAnnotationByUrl(e) {
		let t = await fetch(e).then((e) => e.json());
		return this.removeGeoreferenceAnnotation(t);
	}
	async addGeoreferencedMap(t, n) {
		e.assertRenderer(this.renderer);
		let r = this.renderer.addGeoreferencedMap(t, n);
		return this.nativeUpdate(), r;
	}
	async removeGeoreferencedMap(t) {
		e.assertRenderer(this.renderer);
		let n = this.renderer.warpedMapList.removeGeoreferencedMap(t);
		return this.nativeUpdate(), n;
	}
	async removeGeoreferencedMapById(t) {
		e.assertRenderer(this.renderer);
		let n = this.renderer.warpedMapList.removeGeoreferencedMapById(t);
		return this.nativeUpdate(), n;
	}
	addImageInfos(t) {
		e.assertRenderer(this.renderer);
		let n = this.renderer.warpedMapList.addImageInfos(t);
		return this.nativeUpdate(), n;
	}
	async addSprites(t, n, r) {
		e.assertRenderer(this.renderer), await this.renderer.addSprites(t, n, r), this.nativeUpdate();
	}
	getWarpedMapList() {
		return e.assertRenderer(this.renderer), this.renderer.warpedMapList;
	}
	getMapIds() {
		return e.assertRenderer(this.renderer), this.renderer.warpedMapList.getMapIds();
	}
	getWarpedMaps(t) {
		return e.assertRenderer(this.renderer), this.renderer.warpedMapList.getWarpedMaps({ mapIds: t });
	}
	getWarpedMap(t) {
		return e.assertRenderer(this.renderer), this.renderer.warpedMapList.getWarpedMap(t);
	}
	getMapsCenter(t, n) {
		return e.assertRenderer(this.renderer), this.renderer.warpedMapList.getMapsCenter(N({ mapIds: t }, n));
	}
	getMapsBbox(t, n) {
		return e.assertRenderer(this.renderer), this.renderer.warpedMapList.getMapsBbox(N({ mapIds: t }, n));
	}
	getMapsConvexHull(t, n) {
		return e.assertRenderer(this.renderer), this.renderer.warpedMapList.getMapsConvexHull(N({ mapIds: t }, n));
	}
	getMapZIndex(t) {
		return e.assertRenderer(this.renderer), this.renderer.warpedMapList.getMapZIndex(t);
	}
	getOpacity() {
		return this.getLayerOptions().opacity ?? this.getDefaultOptions().opacity;
	}
	getDefaultOptions() {
		return e.assertRenderer(this.renderer), M(this.defaultSpecificWarpedMapLayerOptions, this.renderer.getDefaultOptions());
	}
	getMapDefaultOptions(t) {
		return e.assertRenderer(this.renderer), this.renderer.getMapDefaultOptions(t);
	}
	getLayerOptions() {
		return e.assertRenderer(this.renderer), N(this.options, this.renderer.getOptions());
	}
	getMapMapOptions(t) {
		return e.assertRenderer(this.renderer), this.renderer.getMapMapOptions(t);
	}
	getMapOptions(t) {
		return e.assertRenderer(this.renderer), this.renderer.getMapOptions(t);
	}
	setOpacity(e) {
		this.setLayerOptions({ opacity: e });
	}
	setLayerOptions(t, n) {
		e.assertRenderer(this.renderer), this.options = M(this.options, t), this.renderer.setOptions(t, n);
	}
	setMapGcps(e, t, n) {
		return this.setMapOptions(e, { gcps: t }, void 0, n);
	}
	setMapResourceMask(e, t, n) {
		return this.setMapOptions(e, { resourceMask: t }, void 0, n);
	}
	setMapTransformationType(e, t, n) {
		return this.setMapOptions(e, { transformationType: t }, void 0, n);
	}
	setMapOptions(e, t, n, r) {
		return this.setMapsOptions([e], t, n, r);
	}
	setMapsOptions(t, n, r, i) {
		e.assertRenderer(this.renderer), r && (this.options = M(this.options, r)), this.renderer.setMapsOptions(t, n, r, i);
	}
	setMapsOptionsByMapId(t, n, r) {
		e.assertRenderer(this.renderer), n && (this.options = M(this.options, n)), this.renderer.setMapsOptionsByMapId(t, n, r);
	}
	resetLayerOptions(t, n) {
		e.assertRenderer(this.renderer), this.renderer.resetOptions(t, n);
	}
	resetMapsOptions(t, n, r, i) {
		e.assertRenderer(this.renderer), this.renderer.resetMapsOptions(t, n, r, i);
	}
	resetMapsOptionsByMapId(t, n, r) {
		e.assertRenderer(this.renderer), this.renderer.resetMapsOptionsByMapId(t, n, r);
	}
	bringMapsToFront(t) {
		e.assertRenderer(this.renderer), this.renderer.warpedMapList.bringMapsToFront(t), this.nativeUpdate();
	}
	sendMapsToBack(t) {
		e.assertRenderer(this.renderer), this.renderer.warpedMapList.sendMapsToBack(t), this.nativeUpdate();
	}
	bringMapsForward(t) {
		e.assertRenderer(this.renderer), this.renderer.warpedMapList.bringMapsForward(t), this.nativeUpdate();
	}
	sendMapsBackward(t) {
		e.assertRenderer(this.renderer), this.renderer.warpedMapList.sendMapsBackward(t), this.nativeUpdate();
	}
	clear() {
		e.assertRenderer(this.renderer), this.renderer.clear(), this.nativeUpdate();
	}
	contextLost(e) {
		e.preventDefault(), this.renderer?.contextLost();
	}
	contextRestored(e) {
		e.preventDefault(), this.renderer?.contextRestored();
	}
	addEventListeners() {
		this.renderer && (this.renderer.warpedMapList.addEventListener(F.IMAGEINFOSADDED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.addEventListener(F.GEOREFERENCEANNOTATIONADDED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.addEventListener(F.GEOREFERENCEANNOTATIONREMOVED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.addEventListener(F.WARPEDMAPADDED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.addEventListener(F.WARPEDMAPREMOVED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.addEventListener(F.WARPEDMAPENTERED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.addEventListener(F.WARPEDMAPLEFT, this.nativePassWarpedMapEvent.bind(this)), this.renderer.addEventListener(F.IMAGELOADED, this.nativeUpdate.bind(this)), this.renderer.tileCache.addEventListener(F.MAPTILELOADED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.spritesTileCache.addEventListener(F.MAPTILESLOADEDFROMSPRITES, this.nativePassWarpedMapEvent.bind(this)), this.renderer.tileCache.addEventListener(F.MAPTILEDELETED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.tileCache.addEventListener(F.FIRSTMAPTILELOADED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.tileCache.addEventListener(F.ALLREQUESTEDTILESLOADED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.addEventListener(F.CLEARED, this.nativeUpdate.bind(this)), this.renderer.warpedMapList.addEventListener(F.PREPARECHANGE, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.addEventListener(F.IMMEDIATECHANGE, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.addEventListener(F.ANIMATEDCHANGE, this.nativePassWarpedMapEvent.bind(this)), this.renderer.addEventListener(F.CHANGED, this.nativeUpdate.bind(this)));
	}
	removeEventListeners() {
		this.renderer && (this.renderer.warpedMapList.removeEventListener(F.IMAGEINFOSADDED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.removeEventListener(F.GEOREFERENCEANNOTATIONADDED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.removeEventListener(F.GEOREFERENCEANNOTATIONREMOVED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.removeEventListener(F.WARPEDMAPADDED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.removeEventListener(F.WARPEDMAPREMOVED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.removeEventListener(F.WARPEDMAPENTERED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.removeEventListener(F.WARPEDMAPLEFT, this.nativePassWarpedMapEvent.bind(this)), this.renderer.removeEventListener(F.IMAGELOADED, this.nativeUpdate.bind(this)), this.renderer.tileCache.removeEventListener(F.MAPTILELOADED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.spritesTileCache.removeEventListener(F.MAPTILESLOADEDFROMSPRITES, this.nativePassWarpedMapEvent.bind(this)), this.renderer.tileCache.removeEventListener(F.MAPTILEDELETED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.tileCache.removeEventListener(F.FIRSTMAPTILELOADED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.tileCache.removeEventListener(F.ALLREQUESTEDTILESLOADED, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.removeEventListener(F.CLEARED, this.nativeUpdate.bind(this)), this.renderer.warpedMapList.removeEventListener(F.PREPARECHANGE, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.removeEventListener(F.IMMEDIATECHANGE, this.nativePassWarpedMapEvent.bind(this)), this.renderer.warpedMapList.removeEventListener(F.ANIMATEDCHANGE, this.nativePassWarpedMapEvent.bind(this)), this.renderer.removeEventListener(F.CHANGED, this.nativeUpdate.bind(this)));
	}
	static assertRenderer(e) {
		if (!e) throw Error(Zv);
	}
	static assertCanvas(e) {
		if (!e) throw Error(Qv);
	}
};
//#endregion
export { F as a, N as c, _c as d, I as i, Hc as l, Xv as n, Ju as o, jv as r, M as s, $v as t, hc as u };
