//#endregion
//#region node_modules/@petamoriken/float16/src/_util/primordials.mjs
function e(e) {
	return (t, ...r) => n(e, t, r);
}
function t(t, n) {
	return e(i(t, n).get);
}
var { apply: n, construct: r, defineProperty: ee, get: te, getOwnPropertyDescriptor: i, getPrototypeOf: a, has: ne, ownKeys: o, set: re, setPrototypeOf: ie } = Reflect, { EPSILON: s, MAX_SAFE_INTEGER: ae, isFinite: oe, isNaN: se } = Number, { iterator: c, species: ce, toStringTag: l, for: le } = Symbol, u = Object, { create: d, defineProperty: ue, freeze: de, is: fe } = u, f = u.prototype;
f.__lookupGetter__ && f.__lookupGetter__, u.hasOwn || f.hasOwnProperty;
var p = Array;
p.isArray;
var m = p.prototype;
m.join, m.push, m.toLocaleString;
var h = m[c], g = e(h), { abs: pe, trunc: me } = Math, _ = ArrayBuffer;
_.isView;
var v = _.prototype;
v.slice, t(v, "byteLength");
var y = typeof SharedArrayBuffer < "u" ? SharedArrayBuffer : null;
y && t(y.prototype, "byteLength");
var b = a(Uint8Array);
b.from;
var x = b.prototype;
x[c], x.keys, x.values, x.entries, x.set, x.reverse, x.fill, x.copyWithin, x.sort, x.slice, x.subarray, t(x, "buffer"), t(x, "byteOffset"), t(x, "length"), t(x, l);
var S = Uint8Array, C = Uint16Array, w = Uint32Array, T = Float32Array, E = a([][c]()), D = e(E.next), O = e((function* () {})().next), k = a(E), A = DataView.prototype, j = e(A.getUint16);
A.setUint16;
var M = WeakSet.prototype;
M.add, M.has;
var N = WeakMap, P = N.prototype, F = e(P.get);
P.has;
var I = e(P.set), L = new N(), R = d(null, {
	next: { value: function() {
		return D(F(L, this));
	} },
	[c]: { value: function() {
		return this;
	} }
});
function z(e) {
	if (e[c] === h && E.next === D) return e;
	let t = d(R);
	return I(L, t, g(e)), t;
}
var B = new N(), V = d(k, { next: {
	value: function() {
		return O(F(B, this));
	},
	writable: !0,
	configurable: !0
} });
for (let e of o(E)) e !== "next" && ue(V, e, i(E, e));
//#endregion
//#region node_modules/@petamoriken/float16/src/_util/converter.mjs
var H = 1 / s, U = 6103515625e-14, W = .0009765625;
W * U, W * H;
var G = new _(4), K = new T(G), q = new w(G), J = new C(512), Y = new S(512);
for (let e = 0; e < 256; ++e) {
	let t = e - 127;
	t < -24 ? (J[e] = 0, J[e | 256] = 32768, Y[e] = 24, Y[e | 256] = 24) : t < -14 ? (J[e] = 1024 >> -t - 14, J[e | 256] = 1024 >> -t - 14 | 32768, Y[e] = -t - 1, Y[e | 256] = -t - 1) : t <= 15 ? (J[e] = t + 15 << 10, J[e | 256] = t + 15 << 10 | 32768, Y[e] = 13, Y[e | 256] = 13) : t < 128 ? (J[e] = 31744, J[e | 256] = 64512, Y[e] = 24, Y[e | 256] = 24) : (J[e] = 31744, J[e | 256] = 64512, Y[e] = 13, Y[e | 256] = 13);
}
var X = new w(2048);
for (let e = 1; e < 1024; ++e) {
	let t = e << 13, n = 0;
	for (; !(t & 8388608);) t <<= 1, n -= 8388608;
	t &= -8388609, n += 947912704, X[e] = t | n;
}
for (let e = 1024; e < 2048; ++e) X[e] = 939524096 + (e - 1024 << 13);
var Z = new w(64);
for (let e = 1; e < 31; ++e) Z[e] = e << 23;
Z[31] = 1199570944, Z[32] = 2147483648;
for (let e = 33; e < 63; ++e) Z[e] = 2147483648 + (e - 32 << 23);
Z[63] = 3347054592;
var Q = new C(64);
for (let e = 1; e < 64; ++e) e !== 32 && (Q[e] = 1024);
function he(e) {
	let t = e >> 10;
	return q[0] = X[Q[t] + (e & 1023)] + Z[t], K[0];
}
//#endregion
//#region node_modules/@petamoriken/float16/src/DataView.mjs
function $(e, t, ...n) {
	return he(j(e, t, ...z(n)));
}
//#endregion
export { $ as t };
