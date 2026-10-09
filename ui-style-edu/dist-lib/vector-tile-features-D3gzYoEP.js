//#region node_modules/flatqueue/index.js
var e = class {
	constructor(e = Infinity, t = Float64Array, n = Uint32Array) {
		let r = e !== Infinity;
		this.ids = r ? new n(e) : [], this.values = r ? new t(e) : [], this.capacity = e, this.length = 0;
	}
	clear() {
		this.length = 0;
	}
	push(e, t) {
		if (this.length === this.capacity) throw RangeError("Queue is at capacity.");
		let n = this.length++;
		for (; n > 0;) {
			let e = n - 1 >> 1, r = this.values[e];
			if (t >= r) break;
			this.ids[n] = this.ids[e], this.values[n] = r, n = e;
		}
		this.ids[n] = e, this.values[n] = t;
	}
	pop() {
		if (this.length === 0) return;
		let e = this.ids, t = this.values, n = e[0], r = --this.length;
		if (r > 0) {
			let n = e[r], i = t[r], a = 0, o = r >> 1;
			for (; a < o;) {
				let n = (a << 1) + 1, o = n + 1, s = n + (o < r & +(t[o] < t[n]));
				if (t[s] >= i) break;
				e[a] = e[s], t[a] = t[s], a = s;
			}
			e[a] = n, t[a] = i;
		}
		return n;
	}
	peek() {
		return this.length > 0 ? this.ids[0] : void 0;
	}
	peekValue() {
		return this.length > 0 ? this.values[0] : void 0;
	}
	shrink() {
		Array.isArray(this.ids) && (this.ids.length = this.length), Array.isArray(this.values) && (this.values.length = this.length);
	}
}, t = [
	Int8Array,
	Uint8Array,
	Uint8ClampedArray,
	Int16Array,
	Uint16Array,
	Int32Array,
	Uint32Array,
	Float32Array,
	Float64Array
], n = 3, r = class r {
	static from(e, i = 0) {
		if (i % 8 != 0) throw Error("byteOffset must be 8-byte aligned.");
		if (!e || e.byteLength === void 0 || "buffer" in e) throw Error("Data must be an instance of ArrayBuffer or SharedArrayBuffer.");
		let [a, o] = new Uint8Array(e, i + 0, 2);
		if (a !== 251) throw Error("Data does not appear to be in a Flatbush format.");
		let s = o >> 4;
		if (s !== n) throw Error(`Got v${s} data when expected v${n}.`);
		let c = t[o & 15];
		if (!c) throw Error("Unrecognized array type.");
		let [l] = new Uint16Array(e, i + 2, 1), [u] = new Uint32Array(e, i + 4, 1);
		return new r(u, l, c, void 0, e, i);
	}
	constructor(r, i = 16, a = Float64Array, o = ArrayBuffer, s, c = 0) {
		if (r === void 0) throw Error("Missing required argument: numItems.");
		if (isNaN(r) || r <= 0) throw Error(`Unexpected numItems value: ${r}.`);
		this.numItems = +r, this.nodeSize = Math.min(Math.max(+i, 2), 65535), this.byteOffset = c;
		let l = r, u = l;
		this._levelBounds = [l * 4];
		do
			l = Math.ceil(l / this.nodeSize), u += l, this._levelBounds.push(u * 4);
		while (l !== 1);
		this.ArrayType = a, this.IndexArrayType = u < 16384 ? Uint16Array : Uint32Array;
		let d = t.indexOf(a), f = u * 4 * a.BYTES_PER_ELEMENT;
		if (d < 0) throw Error(`Unexpected typed array class: ${a}.`);
		let p = a, m = this.IndexArrayType;
		if (s) this.data = s, this._boxes = new p(s, c + 8, u * 4), this._indices = new m(s, c + 8 + f, u), this._pos = u * 4, this.minX = this._boxes[this._pos - 4], this.minY = this._boxes[this._pos - 3], this.maxX = this._boxes[this._pos - 2], this.maxY = this._boxes[this._pos - 1];
		else {
			let e = this.data = new o(8 + f + u * this.IndexArrayType.BYTES_PER_ELEMENT);
			this._boxes = new p(e, 8, u * 4), this._indices = new m(e, 8 + f, u), this._pos = 0, this.minX = Infinity, this.minY = Infinity, this.maxX = -Infinity, this.maxY = -Infinity, new Uint8Array(e, 0, 2).set([251, (n << 4) + d]), new Uint16Array(e, 2, 1)[0] = i, new Uint32Array(e, 4, 1)[0] = r;
		}
		this._queue = new e();
	}
	add(e, t, n = e, r = t) {
		let i = this._pos, a = i >> 2, o = this._boxes;
		return this._indices[a] = a, o[i] = e, o[i + 1] = t, o[i + 2] = n, o[i + 3] = r, this._pos = i + 4, e < this.minX && (this.minX = e), t < this.minY && (this.minY = t), n > this.maxX && (this.maxX = n), r > this.maxY && (this.maxY = r), a;
	}
	finish() {
		if (this._pos >> 2 !== this.numItems) throw Error(`Added ${this._pos >> 2} items when expected ${this.numItems}.`);
		let e = this._boxes;
		if (this.numItems <= this.nodeSize) {
			e[this._pos++] = this.minX, e[this._pos++] = this.minY, e[this._pos++] = this.maxX, e[this._pos++] = this.maxY;
			return;
		}
		let { numItems: t, minX: n, minY: r, nodeSize: i, _indices: o, _levelBounds: c } = this, l = this.maxX - n || 1, u = this.maxY - r || 1, d = new Int32Array(t), f = 65535, p = f / l, m = f / u;
		for (let i = 0, a = 0; i < t; i++) {
			let t = e[a++], o = e[a++], c = e[a++], l = e[a++];
			d[i] = s(p * ((t + c) / 2 - n) | 0, m * ((o + l) / 2 - r) | 0);
		}
		a(d, e, o, 0, t - 1, i);
		let h = t * 4;
		for (let t = 0, n = 0; t < c.length - 1; t++) {
			let r = c[t];
			for (; n < r;) {
				let t = n, a = e[n++], s = e[n++], c = e[n++], l = e[n++];
				for (let t = 1; t < i && n < r; t++) a = Math.min(a, e[n++]), s = Math.min(s, e[n++]), c = Math.max(c, e[n++]), l = Math.max(l, e[n++]);
				o[h >> 2] = t, e[h++] = a, e[h++] = s, e[h++] = c, e[h++] = l;
			}
		}
		this._pos = h;
	}
	search(e, t, n, r, i) {
		if (this._pos !== this._boxes.length) throw Error("Data not yet indexed - call index.finish().");
		let { _boxes: a, _levelBounds: o, _indices: s, nodeSize: c } = this, l = this.numItems * 4, u = a.length - 4, d = o.length - 1, f = [], p = [], m = !1;
		for (; u !== void 0;) {
			let h = Math.min(u + c * 4, o[d]), g = u >= l;
			if (m) this._collectContained(u, h, d, l, p, i);
			else for (let o = u; o < h; o += 4) {
				let c = a[o];
				if (n < c) continue;
				let l = a[o + 1];
				if (r < l) continue;
				let u = a[o + 2];
				if (e > u) continue;
				let m = a[o + 3];
				if (t > m) continue;
				let h = s[o >> 2] | 0;
				if (g) {
					let i = +(e <= c && t <= l && n >= u && r >= m);
					f.push(h | i, d - 1);
				} else (i === void 0 || i(h, c, l, u, m)) && p.push(h);
			}
			d = f.pop(), u = f.pop(), u !== void 0 && (m = (u & 1) == 1, u &= -2);
		}
		return p;
	}
	_collectContained(e, t, n, r, i, a) {
		let o = this._boxes, s = this._indices, c = e;
		for (let e = n; e > 0; e--) c = s[c >> 2];
		let l = Math.min(c + (t - e) * this.nodeSize ** n, r);
		if (a === void 0) for (; c < l; c += 4) i.push(s[c >> 2] | 0);
		else for (; c < l; c += 4) {
			let e = s[c >> 2] | 0;
			a(e, o[c], o[c + 1], o[c + 2], o[c + 3]) && i.push(e);
		}
	}
	neighbors(e, t, n = Infinity, r = Infinity, a) {
		if (this._pos !== this._boxes.length) throw Error("Data not yet indexed - call index.finish().");
		let { _boxes: o, _levelBounds: s, _indices: c, _queue: l, nodeSize: u } = this, d = this.numItems * 4, f = u * 4, p = [], m = r * r, h = n === 1, g = m;
		for (l.push(o.length - 4 << 1, 0); l.length;) {
			let r = l.ids[0];
			if (r & 1) {
				if (l.pop(), p.push(r >> 1), p.length === n) break;
				continue;
			}
			l.pop();
			let u = r >> 1, m = u < d, _ = Math.min(u + f, i(u, s));
			for (let n = u; n < _; n += 4) {
				let r = o[n], i = o[n + 1], s = o[n + 2], u = o[n + 3], d = Math.max(Math.max(r - e, e - s), 0), f = Math.max(Math.max(i - t, t - u), 0), p = d * d + f * f;
				if (p > g) continue;
				let _ = c[n >> 2] | 0;
				m ? (a === void 0 || a(_)) && (l.push(_ << 1 | 1, p), h && p < g && (g = p)) : l.push(_ << 1, p);
			}
		}
		return l.clear(), p;
	}
};
function i(e, t) {
	let n = 0, r = t.length - 1;
	for (; n < r;) {
		let i = n + r >> 1;
		t[i] > e ? r = i : n = i + 1;
	}
	return t[n];
}
function a(e, t, n, r, i, a) {
	let s = [r, i];
	for (; s.length;) {
		let r = s.pop() || 0, i = s.pop() || 0;
		if (r - i <= a && Math.floor(i / a) >= Math.floor(r / a)) continue;
		let c = e[i], l = e[i + r >> 1], u = e[r], d = c > l == c > u ? l < c == l < u ? u : l : c, f = i - 1, p = r + 1;
		for (;;) {
			do
				f++;
			while (e[f] < d);
			do
				p--;
			while (e[p] > d);
			if (f >= p) break;
			o(e, t, n, f, p);
		}
		s.push(i, p, p + 1, r);
	}
}
function o(e, t, n, r, i) {
	let a = e[r];
	e[r] = e[i], e[i] = a;
	let o = 4 * r, s = 4 * i, c = t[o], l = t[o + 1], u = t[o + 2], d = t[o + 3];
	t[o] = t[s], t[o + 1] = t[s + 1], t[o + 2] = t[s + 2], t[o + 3] = t[s + 3], t[s] = c, t[s + 1] = l, t[s + 2] = u, t[s + 3] = d;
	let f = n[r];
	n[r] = n[i], n[i] = f;
}
function s(e, t) {
	let n = e ^ t, r = 65535 ^ n, i = 65535 ^ (e | t), a = e & (t ^ 65535), o = n | r >> 1, s = n >> 1 ^ n, c = i ^ (i >> 1 ^ r & a >> 1), l = a ^ (n & i >> 1 ^ a >> 1);
	return n = o & o >> 2 ^ s & s >> 2, r = o & s >> 2 ^ s & (o ^ s) >> 2, i = c ^ (o & c >> 2 ^ s & l >> 2), a = l ^ (s & c >> 2 ^ (o ^ s) & l >> 2), o = n & n >> 4 ^ r & r >> 4, s = n & r >> 4 ^ r & (n ^ r) >> 4, c = i ^ (n & i >> 4 ^ r & a >> 4), l = a ^ (r & i >> 4 ^ (n ^ r) & a >> 4), i = c ^ (o & c >> 8 ^ s & l >> 8), a = l ^ (s & c >> 8 ^ (o ^ s) & l >> 8), i ^= i >> 1, a ^= a >> 1, n = e ^ t, r = a | 65535 ^ (n | i), n = (n | n << 8) & 16711935, n = (n | n << 4) & 252645135, n = (n | n << 2) & 858993459, n = (n | n << 1) & 1431655765, r = (r | r << 8) & 16711935, r = (r | r << 4) & 252645135, r = (r | r << 2) & 858993459, r = (r | r << 1) & 1431655765, ((r << 1 | n) >>> 0) - 2147483648;
}
//#endregion
//#region node_modules/bignumber.js/bignumber.mjs
var c = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i, l = Math.ceil, u = Math.floor, d = "[BigNumber Error] ", f = d + "Number primitive has more than 15 significant digits: ", p = 0x5af3107a4000, m = 14, h = 9007199254740991, g = [
	1,
	10,
	100,
	1e3,
	1e4,
	1e5,
	1e6,
	1e7,
	1e8,
	1e9,
	1e10,
	1e11,
	0xe8d4a51000,
	0x9184e72a000
], _ = 1e7, v = 1e9;
function y(e) {
	var t, n, r, i = L.prototype = {
		constructor: L,
		toString: null,
		valueOf: null
	}, a = new L(1), o = 20, s = 4, D = -7, O = 21, k = -1e7, A = 1e7, j = !1, M = 1, N = 0, P = {
		prefix: "",
		groupSize: 3,
		secondaryGroupSize: 0,
		groupSeparator: ",",
		decimalSeparator: ".",
		fractionGroupSize: 0,
		fractionGroupSeparator: "\xA0",
		suffix: ""
	}, F = "0123456789abcdefghijklmnopqrstuvwxyz", I = !0;
	function L(e, t) {
		var i, a, l, d, p, g, _, v, y = this;
		if (!(y instanceof L)) return new L(e, t);
		if (t == null) {
			if (e && e._isBigNumber === !0) {
				y.s = e.s, !e.c || e.e > A ? y.c = y.e = null : e.e < k ? y.c = [y.e = 0] : (y.e = e.e, y.c = e.c.slice());
				return;
			}
			if ((g = typeof e == "number") && e * 0 == 0) {
				if (y.s = 1 / e < 0 ? (e = -e, -1) : 1, e === ~~e) {
					for (d = 0, p = e; p >= 10; p /= 10, d++);
					d > A ? y.c = y.e = null : (y.e = d, y.c = [e]);
					return;
				}
				v = String(e);
			} else {
				if (!c.test(v = String(e))) return r(y, v, g);
				y.s = v.charCodeAt(0) == 45 ? (v = v.slice(1), -1) : 1;
			}
			(d = v.indexOf(".")) > -1 && (v = v.replace(".", "")), (p = v.search(/e/i)) > 0 ? (d < 0 && (d = p), d += +v.slice(p + 1), v = v.substring(0, p)) : d < 0 && (d = v.length);
		} else {
			if (C(t, 2, F.length, "Base"), t == 10 && I) return y = new L(e), V(y, o + y.e + 1, s);
			if (v = String(e), g = typeof e == "number") {
				if (e * 0 != 0) return r(y, v, g, t);
				if (y.s = 1 / e < 0 ? (v = v.slice(1), -1) : 1, L.DEBUG && v.replace(/^0\.0*|\./, "").length > 15) throw Error(f + e);
			} else y.s = v.charCodeAt(0) === 45 ? (v = v.slice(1), -1) : 1;
			for (i = F.slice(0, t), d = p = 0, _ = v.length; p < _; p++) if (i.indexOf(a = v.charAt(p)) < 0) {
				if (a == ".") {
					if (p > d) {
						d = _;
						continue;
					}
				} else if (!l && (v == v.toUpperCase() && (v = v.toLowerCase()) || v == v.toLowerCase() && (v = v.toUpperCase()))) {
					l = !0, p = -1, d = 0;
					continue;
				}
				return r(y, String(e), g, t);
			}
			g = !1, v = n(v, t, 10, y.s), (d = v.indexOf(".")) > -1 ? v = v.replace(".", "") : d = v.length;
		}
		for (p = 0; v.charCodeAt(p) === 48; p++);
		for (_ = v.length; v.charCodeAt(--_) === 48;);
		if (v = v.slice(p, ++_)) {
			if (_ -= p, g && L.DEBUG && _ > 15 && (e > h || e !== u(e))) throw Error(f + y.s * e);
			if ((d = d - p - 1) > A) y.c = y.e = null;
			else if (d < k) y.c = [y.e = 0];
			else {
				if (y.e = d, y.c = [], p = (d + 1) % m, d < 0 && (p += m), p < _) {
					for (p && y.c.push(+v.slice(0, p)), _ -= m; p < _;) y.c.push(+v.slice(p, p += m));
					p = m - (v = v.slice(p)).length;
				} else p -= _;
				for (; p--; v += "0");
				y.c.push(+v);
			}
		} else y.c = [y.e = 0];
	}
	L.clone = y, L.ROUND_UP = 0, L.ROUND_DOWN = 1, L.ROUND_CEIL = 2, L.ROUND_FLOOR = 3, L.ROUND_HALF_UP = 4, L.ROUND_HALF_DOWN = 5, L.ROUND_HALF_EVEN = 6, L.ROUND_HALF_CEIL = 7, L.ROUND_HALF_FLOOR = 8, L.EUCLID = 9, L.config = L.set = function(e) {
		var t, n;
		if (e != null) if (typeof e == "object") {
			if (e.hasOwnProperty(t = "DECIMAL_PLACES") && (n = e[t], C(n, 0, v, t), o = n), e.hasOwnProperty(t = "ROUNDING_MODE") && (n = e[t], C(n, 0, 8, t), s = n), e.hasOwnProperty(t = "EXPONENTIAL_AT") && (n = e[t], n && n.pop ? (C(n[0], -v, 0, t), C(n[1], 0, v, t), D = n[0], O = n[1]) : (C(n, -v, v, t), D = -(O = n < 0 ? -n : n))), e.hasOwnProperty(t = "RANGE")) if (n = e[t], n && n.pop) C(n[0], -v, -1, t), C(n[1], 1, v, t), k = n[0], A = n[1];
			else if (C(n, -v, v, t), n) k = -(A = n < 0 ? -n : n);
			else throw Error(d + t + " cannot be zero: " + n);
			if (e.hasOwnProperty(t = "CRYPTO")) if (n = e[t], n === !!n) if (n) if (typeof crypto < "u" && crypto && (crypto.getRandomValues || crypto.randomBytes)) j = n;
			else throw j = !n, Error(d + "crypto unavailable");
			else j = n;
			else throw Error(d + t + " not true or false: " + n);
			if (e.hasOwnProperty(t = "MODULO_MODE") && (n = e[t], C(n, 0, 9, t), M = n), e.hasOwnProperty(t = "POW_PRECISION") && (n = e[t], C(n, 0, v, t), N = n), e.hasOwnProperty(t = "FORMAT")) if (n = e[t], typeof n == "object") P = n;
			else throw Error(d + t + " not an object: " + n);
			if (e.hasOwnProperty(t = "ALPHABET")) if (n = e[t], typeof n == "string" && !/^.?$|[+\-.\s]|(.).*\1/.test(n)) I = n.slice(0, 10) == "0123456789", F = n;
			else throw Error(d + t + " invalid: " + n);
		} else throw Error(d + "Object expected: " + e);
		return {
			DECIMAL_PLACES: o,
			ROUNDING_MODE: s,
			EXPONENTIAL_AT: [D, O],
			RANGE: [k, A],
			CRYPTO: j,
			MODULO_MODE: M,
			POW_PRECISION: N,
			FORMAT: P,
			ALPHABET: F
		};
	}, L.isBigNumber = function(e) {
		if (!e || e._isBigNumber !== !0) return !1;
		if (!L.DEBUG) return !0;
		var t, n, r = e.c, i = e.e, a = e.s;
		out: if ({}.toString.call(r) == "[object Array]") {
			if ((a === 1 || a === -1) && i >= -v && i <= v && i === u(i)) {
				if (r[0] === 0) {
					if (i === 0 && r.length === 1) return !0;
					break out;
				}
				if (t = (i + 1) % m, t < 1 && (t += m), String(r[0]).length == t) {
					for (t = 0; t < r.length; t++) if (n = r[t], n < 0 || n >= p || n !== u(n)) break out;
					if (n !== 0) return !0;
				}
			}
		} else if (r === null && i === null && (a === null || a === 1 || a === -1)) return !0;
		throw Error(d + "Invalid BigNumber: " + e);
	}, L.maximum = L.max = function() {
		return z(arguments, -1);
	}, L.minimum = L.min = function() {
		return z(arguments, 1);
	}, L.random = (function() {
		var e = 9007199254740992, t = Math.random() * e & 2097151 ? function() {
			return u(Math.random() * e);
		} : function() {
			return (Math.random() * 1073741824 | 0) * 8388608 + (Math.random() * 8388608 | 0);
		};
		return function(e) {
			var n, r, i, s, c, f = 0, p = [], h = new L(a);
			if (e == null ? e = o : C(e, 0, v), s = l(e / m), j) if (crypto.getRandomValues) {
				for (n = crypto.getRandomValues(new Uint32Array(s *= 2)); f < s;) c = n[f] * 131072 + (n[f + 1] >>> 11), c >= 9e15 ? (r = crypto.getRandomValues(new Uint32Array(2)), n[f] = r[0], n[f + 1] = r[1]) : (p.push(c % 0x5af3107a4000), f += 2);
				f = s / 2;
			} else if (crypto.randomBytes) {
				for (n = crypto.randomBytes(s *= 7); f < s;) c = (n[f] & 31) * 281474976710656 + n[f + 1] * 1099511627776 + n[f + 2] * 4294967296 + n[f + 3] * 16777216 + (n[f + 4] << 16) + (n[f + 5] << 8) + n[f + 6], c >= 9e15 ? crypto.randomBytes(7).copy(n, f) : (p.push(c % 0x5af3107a4000), f += 7);
				f = s / 7;
			} else throw j = !1, Error(d + "crypto unavailable");
			if (!j) for (; f < s;) c = t(), c < 9e15 && (p[f++] = c % 0x5af3107a4000);
			for (s = p[--f], e %= m, s && e && (c = g[m - e], p[f] = u(s / c) * c); p[f] === 0; p.pop(), f--);
			if (f < 0) p = [i = 0];
			else {
				for (i = -1; p[0] === 0; p.splice(0, 1), i -= m);
				for (f = 1, c = p[0]; c >= 10; c /= 10, f++);
				f < m && (i -= m - f);
			}
			return h.e = i, h.c = p, h;
		};
	})(), L.sum = function() {
		for (var e = 1, t = arguments, n = new L(t[0]); e < t.length;) n = n.plus(t[e++]);
		return n;
	}, n = (function() {
		var e = "0123456789";
		function n(e, t, n, r) {
			for (var i, a = [0], o, s = 0, c = e.length; s < c;) {
				for (o = a.length; o--; a[o] *= t);
				for (a[0] += r.indexOf(e.charAt(s++)), i = 0; i < a.length; i++) a[i] > n - 1 && (a[i + 1] ?? (a[i + 1] = 0), a[i + 1] += a[i] / n | 0, a[i] %= n);
			}
			return a.reverse();
		}
		return function(r, i, a, c, l) {
			var u, d, f, p, m, h, g, _, v = r.indexOf("."), y = o, b = s;
			for (v >= 0 && (p = N, N = 0, r = r.replace(".", ""), _ = new L(i), h = _.pow(r.length - v), N = p, _.c = n(E(x(h.c), h.e, "0"), 10, a, e), _.e = _.c.length), g = n(r, i, a, l ? (u = F, e) : (u = e, F)), f = p = g.length; g[--p] == 0; g.pop());
			if (!g[0]) return u.charAt(0);
			if (v < 0 ? --f : (h.c = g, h.e = f, h.s = c, h = t(h, _, y, b, a), g = h.c, m = h.r, f = h.e), d = f + y + 1, v = g[d], p = a / 2, m = m || d < 0 || g[d + 1] != null, m = b < 4 ? (v != null || m) && (b == 0 || b == (h.s < 0 ? 3 : 2)) : v > p || v == p && (b == 4 || m || b == 6 && g[d - 1] & 1 || b == (h.s < 0 ? 8 : 7)), d < 1 || !g[0]) r = m ? E(u.charAt(1), -y, u.charAt(0)) : u.charAt(0);
			else {
				if (g.length = d, m) for (--a; ++g[--d] > a;) g[d] = 0, d || (++f, g = [1].concat(g));
				for (p = g.length; !g[--p];);
				for (v = 0, r = ""; v <= p; r += u.charAt(g[v++]));
				r = E(r, f, u.charAt(0));
			}
			return r;
		};
	})(), t = (function() {
		function e(e, t, n) {
			var r, i, a, o, s = 0, c = e.length, l = t % _, u = t / _ | 0;
			for (e = e.slice(); c--;) a = e[c] % _, o = e[c] / _ | 0, r = u * a + o * l, i = l * a + r % _ * _ + s, s = (i / n | 0) + (r / _ | 0) + u * o, e[c] = i % n;
			return s && (e = [s].concat(e)), e;
		}
		function t(e, t, n, r) {
			var i, a;
			if (n != r) a = n > r ? 1 : -1;
			else for (i = a = 0; i < n; i++) if (e[i] != t[i]) {
				a = e[i] > t[i] ? 1 : -1;
				break;
			}
			return a;
		}
		function n(e, t, n, r) {
			for (var i = 0; n--;) e[n] -= i, i = +(e[n] < t[n]), e[n] = i * r + e[n] - t[n];
			for (; !e[0] && e.length > 1; e.splice(0, 1));
		}
		return function(r, i, a, o, s) {
			var c, l, d, f, h, g, _, v, y, x, S, C, w, T, E, D, O, k = r.s == i.s ? 1 : -1, A = r.c, j = i.c;
			if (!A || !A[0] || !j || !j[0]) return new L(!r.s || !i.s || (A ? j && A[0] == j[0] : !j) ? NaN : A && A[0] == 0 || !j ? k * 0 : k / 0);
			for (v = new L(k), y = v.c = [], l = r.e - i.e, k = a + l + 1, s || (s = p, l = b(r.e / m) - b(i.e / m), k = k / m | 0), d = 0; j[d] == (A[d] || 0); d++);
			if (j[d] > (A[d] || 0) && l--, k < 0) y.push(1), f = !0;
			else {
				for (T = A.length, D = j.length, d = 0, k += 2, h = u(s / (j[0] + 1)), h > 1 && (j = e(j, h, s), A = e(A, h, s), D = j.length, T = A.length), w = D, x = A.slice(0, D), S = x.length; S < D; x[S++] = 0);
				O = j.slice(), O = [0].concat(O), E = j[0], j[1] >= s / 2 && E++;
				do {
					if (h = 0, c = t(j, x, D, S), c < 0) {
						if (C = x[0], D != S && (C = C * s + (x[1] || 0)), h = u(C / E), h > 1) for (h >= s && (h = s - 1), g = e(j, h, s), _ = g.length, S = x.length; t(g, x, _, S) == 1;) h--, n(g, D < _ ? O : j, _, s), _ = g.length, c = 1;
						else h == 0 && (c = h = 1), g = j.slice(), _ = g.length;
						if (_ < S && (g = [0].concat(g)), n(x, g, S, s), S = x.length, c == -1) for (; t(j, x, D, S) < 1;) h++, n(x, D < S ? O : j, S, s), S = x.length;
					} else c === 0 && (h++, x = [0]);
					y[d++] = h, x[0] ? x[S++] = A[w] || 0 : (x = [A[w]], S = 1);
				} while ((w++ < T || x[0] != null) && k--);
				f = x[0] != null, y[0] || y.splice(0, 1);
			}
			if (s == p) {
				for (d = 1, k = y[0]; k >= 10; k /= 10, d++);
				V(v, a + (v.e = d + l * m - 1) + 1, o, f);
			} else v.e = l, v.r = +f;
			return v;
		};
	})();
	function R(e, t, n, r) {
		var i, a, o, c, l;
		if (n == null ? n = s : C(n, 0, 8), !e.c) return e.toString();
		if (i = e.c[0], o = e.e, t == null) l = x(e.c), l = r == 1 || r == 2 && (o <= D || o >= O) ? T(l, o) : E(l, o, "0");
		else if (e = V(new L(e), t, n), a = e.e, l = x(e.c), c = l.length, r == 1 || r == 2 && (t <= a || a <= D)) {
			for (; c < t; l += "0", c++);
			l = T(l, a);
		} else if (t -= o + (r === 2 && a > o), l = E(l, a, "0"), a + 1 > c) {
			if (--t > 0) for (l += "."; t--; l += "0");
		} else if (t += a - c, t > 0) for (a + 1 == c && (l += "."); t--; l += "0");
		return e.s < 0 && i ? "-" + l : l;
	}
	function z(e, t) {
		for (var n, r, i = 1, a = new L(e[0]); i < e.length; i++) r = new L(e[i]), (!r.s || (n = S(a, r)) === t || n === 0 && a.s === t) && (a = r);
		return a;
	}
	function B(e, t, n) {
		for (var r = 1, i = t.length; !t[--i]; t.pop());
		for (i = t[0]; i >= 10; i /= 10, r++);
		return (n = r + n * m - 1) > A ? e.c = e.e = null : n < k ? e.c = [e.e = 0] : (e.e = n, e.c = t), e;
	}
	r = (function() {
		var e = /^(-?)0([xbo])(?=\w[\w.]*$)/i, t = /^([^.]+)\.$/, n = /^\.([^.]+)$/, r = /^-?(Infinity|NaN)$/, i = /^\s*\+(?=[\w.])|^\s+|\s+$/g;
		return function(a, o, s, c) {
			var l, u = s ? o : o.replace(i, "");
			if (r.test(u)) a.s = isNaN(u) ? null : u < 0 ? -1 : 1;
			else {
				if (!s && (u = u.replace(e, function(e, t, n) {
					return l = (n = n.toLowerCase()) == "x" ? 16 : n == "b" ? 2 : 8, !c || c == l ? t : e;
				}), c && (l = c, u = u.replace(t, "$1").replace(n, "0.$1")), o != u)) return new L(u, l);
				if (L.DEBUG) throw Error(d + "Not a" + (c ? " base " + c : "") + " number: " + o);
				a.s = null;
			}
			a.c = a.e = null;
		};
	})();
	function V(e, t, n, r) {
		var i, a, o, s, c, d, f, h = e.c, _ = g;
		if (h) {
			out: {
				for (i = 1, s = h[0]; s >= 10; s /= 10, i++);
				if (a = t - i, a < 0) a += m, o = t, c = h[d = 0], f = u(c / _[i - o - 1] % 10);
				else if (d = l((a + 1) / m), d >= h.length) if (r) {
					for (; h.length <= d; h.push(0));
					c = f = 0, i = 1, a %= m, o = a - m + 1;
				} else break out;
				else {
					for (c = s = h[d], i = 1; s >= 10; s /= 10, i++);
					a %= m, o = a - m + i, f = o < 0 ? 0 : u(c / _[i - o - 1] % 10);
				}
				if (r = r || t < 0 || h[d + 1] != null || (o < 0 ? c : c % _[i - o - 1]), r = n < 4 ? (f || r) && (n == 0 || n == (e.s < 0 ? 3 : 2)) : f > 5 || f == 5 && (n == 4 || r || n == 6 && (a > 0 ? o > 0 ? c / _[i - o] : 0 : h[d - 1]) % 10 & 1 || n == (e.s < 0 ? 8 : 7)), t < 1 || !h[0]) return h.length = 0, r ? (t -= e.e + 1, h[0] = _[(m - t % m) % m], e.e = -t || 0) : h[0] = e.e = 0, e;
				if (a == 0 ? (h.length = d, s = 1, d--) : (h.length = d + 1, s = _[m - a], h[d] = o > 0 ? u(c / _[i - o] % _[o]) * s : 0), r) for (;;) if (d == 0) {
					for (a = 1, o = h[0]; o >= 10; o /= 10, a++);
					for (o = h[0] += s, s = 1; o >= 10; o /= 10, s++);
					a != s && (e.e++, h[0] == p && (h[0] = 1));
					break;
				} else {
					if (h[d] += s, h[d] != p) break;
					h[d--] = 0, s = 1;
				}
				for (a = h.length; h[--a] === 0; h.pop());
			}
			e.e > A ? e.c = e.e = null : e.e < k && (e.c = [e.e = 0]);
		}
		return e;
	}
	function H(e) {
		var t, n = e.e;
		return n === null ? e.toString() : (t = x(e.c), t = n <= D || n >= O ? T(t, n) : E(t, n, "0"), e.s < 0 ? "-" + t : t);
	}
	return i.absoluteValue = i.abs = function() {
		var e = new L(this);
		return e.s < 0 && (e.s = 1), e;
	}, i.comparedTo = function(e, t) {
		return S(this, new L(e, t));
	}, i.decimalPlaces = i.dp = function(e, t) {
		var n, r, i, a = this;
		if (e != null) return C(e, 0, v), t == null ? t = s : C(t, 0, 8), V(new L(a), e + a.e + 1, t);
		if (!(n = a.c)) return null;
		if (r = ((i = n.length - 1) - b(this.e / m)) * m, i = n[i]) for (; i % 10 == 0; i /= 10, r--);
		return r < 0 && (r = 0), r;
	}, i.dividedBy = i.div = function(e, n) {
		return t(this, new L(e, n), o, s);
	}, i.dividedToIntegerBy = i.idiv = function(e, n) {
		return t(this, new L(e, n), 0, 1);
	}, i.exponentiatedBy = i.pow = function(e, t) {
		var n, r, i, o, c, f, p, h, g, _ = this;
		if (e = new L(e), e.c && !e.isInteger()) throw Error(d + "Exponent not an integer: " + H(e));
		if (t != null && (t = new L(t)), f = e.e > 14, !_.c || !_.c[0] || _.c[0] == 1 && !_.e && _.c.length == 1 || !e.c || !e.c[0]) return g = new L(H(_) ** (f ? e.s * (2 - w(e)) : +H(e))), t ? g.mod(t) : g;
		if (p = e.s < 0, t) {
			if (t.c ? !t.c[0] : !t.s) return new L(NaN);
			r = !p && _.isInteger() && t.isInteger(), r && (_ = _.mod(t));
		} else if (e.e > 9 && (_.e > 0 || _.e < -1 || (_.e == 0 ? _.c[0] > 1 || f && _.c[1] >= 24e7 : _.c[0] < 8e13 || f && _.c[0] <= 9999975e7))) return o = _.s < 0 && w(e) ? -0 : 0, _.e > -1 && (o = 1 / o), new L(p ? 1 / o : o);
		else N && (o = l(N / m + 2));
		for (f ? (n = new L(.5), p && (e.s = 1), h = w(e)) : (i = Math.abs(+H(e)), h = i % 2), g = new L(a);;) {
			if (h) {
				if (g = g.times(_), !g.c) break;
				o ? g.c.length > o && (g.c.length = o) : r && (g = g.mod(t));
			}
			if (i) {
				if (i = u(i / 2), i === 0) break;
				h = i % 2;
			} else if (e = e.times(n), V(e, e.e + 1, 1), e.e > 14) h = w(e);
			else {
				if (i = +H(e), i === 0) break;
				h = i % 2;
			}
			_ = _.times(_), o ? _.c && _.c.length > o && (_.c.length = o) : r && (_ = _.mod(t));
		}
		return r ? g : (p && (g = a.div(g)), t ? g.mod(t) : o ? V(g, N, s, c) : g);
	}, i.integerValue = function(e) {
		var t = new L(this);
		return e == null ? e = s : C(e, 0, 8), V(t, t.e + 1, e);
	}, i.isEqualTo = i.eq = function(e, t) {
		return S(this, new L(e, t)) === 0;
	}, i.isFinite = function() {
		return !!this.c;
	}, i.isGreaterThan = i.gt = function(e, t) {
		return S(this, new L(e, t)) > 0;
	}, i.isGreaterThanOrEqualTo = i.gte = function(e, t) {
		return (t = S(this, new L(e, t))) === 1 || t === 0;
	}, i.isInteger = function() {
		return !!this.c && b(this.e / m) > this.c.length - 2;
	}, i.isLessThan = i.lt = function(e, t) {
		return S(this, new L(e, t)) < 0;
	}, i.isLessThanOrEqualTo = i.lte = function(e, t) {
		return (t = S(this, new L(e, t))) === -1 || t === 0;
	}, i.isNaN = function() {
		return !this.s;
	}, i.isNegative = function() {
		return this.s < 0;
	}, i.isPositive = function() {
		return this.s > 0;
	}, i.isZero = function() {
		return !!this.c && this.c[0] == 0;
	}, i.minus = function(e, t) {
		var n, r, i, a, o = this, c = o.s;
		if (e = new L(e, t), t = e.s, !c || !t) return new L(NaN);
		if (c != t) return e.s = -t, o.plus(e);
		var l = o.e / m, u = e.e / m, d = o.c, f = e.c;
		if (!l || !u) {
			if (!d || !f) return d ? (e.s = -t, e) : new L(f ? o : NaN);
			if (!d[0] || !f[0]) return f[0] ? (e.s = -t, e) : new L(d[0] ? o : s == 3 ? -0 : 0);
		}
		if (l = b(l), u = b(u), d = d.slice(), c = l - u) {
			for ((a = c < 0) ? (c = -c, i = d) : (u = l, i = f), i.reverse(), t = c; t--; i.push(0));
			i.reverse();
		} else for (r = (a = (c = d.length) < (t = f.length)) ? c : t, c = t = 0; t < r; t++) if (d[t] != f[t]) {
			a = d[t] < f[t];
			break;
		}
		if (a && (i = d, d = f, f = i, e.s = -e.s), t = (r = f.length) - (n = d.length), t > 0) for (; t--; d[n++] = 0);
		for (t = p - 1; r > c;) {
			if (d[--r] < f[r]) {
				for (n = r; n && !d[--n]; d[n] = t);
				--d[n], d[r] += p;
			}
			d[r] -= f[r];
		}
		for (; d[0] == 0; d.splice(0, 1), --u);
		return d[0] ? B(e, d, u) : (e.s = s == 3 ? -1 : 1, e.c = [e.e = 0], e);
	}, i.modulo = i.mod = function(e, n) {
		var r, i, a = this;
		return e = new L(e, n), !a.c || !e.s || e.c && !e.c[0] ? new L(NaN) : !e.c || a.c && !a.c[0] ? new L(a) : (M == 9 ? (i = e.s, e.s = 1, r = t(a, e, 0, 3), e.s = i, r.s *= i) : r = t(a, e, 0, M), e = a.minus(r.times(e)), !e.c[0] && M == 1 && (e.s = a.s), e);
	}, i.multipliedBy = i.times = function(e, t) {
		var n, r, i, a, o, s, c, l, u, d, f, h, g, v, y, x = this, S = x.c, C = (e = new L(e, t)).c;
		if (!S || !C || !S[0] || !C[0]) return !x.s || !e.s || S && !S[0] && !C || C && !C[0] && !S ? e.c = e.e = e.s = null : (e.s *= x.s, !S || !C ? e.c = e.e = null : (e.c = [0], e.e = 0)), e;
		for (r = b(x.e / m) + b(e.e / m), e.s *= x.s, c = S.length, d = C.length, c < d && (g = S, S = C, C = g, i = c, c = d, d = i), i = c + d, g = []; i--; g.push(0));
		for (v = p, y = _, i = d; --i >= 0;) {
			for (n = 0, f = C[i] % y, h = C[i] / y | 0, o = c, a = i + o; a > i;) l = S[--o] % y, u = S[o] / y | 0, s = h * l + u * f, l = f * l + s % y * y + g[a] + n, n = (l / v | 0) + (s / y | 0) + h * u, g[a--] = l % v;
			g[a] = n;
		}
		return n ? ++r : g.splice(0, 1), B(e, g, r);
	}, i.negated = function() {
		var e = new L(this);
		return e.s = -e.s || null, e;
	}, i.plus = function(e, t) {
		var n, r = this, i = r.s;
		if (e = new L(e, t), t = e.s, !i || !t) return new L(NaN);
		if (i != t) return e.s = -t, r.minus(e);
		var a = r.e / m, o = e.e / m, s = r.c, c = e.c;
		if (!a || !o) {
			if (!s || !c) return new L(i / 0);
			if (!s[0] || !c[0]) return c[0] ? e : new L(s[0] ? r : i * 0);
		}
		if (a = b(a), o = b(o), s = s.slice(), i = a - o) {
			for (i > 0 ? (o = a, n = c) : (i = -i, n = s), n.reverse(); i--; n.push(0));
			n.reverse();
		}
		for (i = s.length, t = c.length, i - t < 0 && (n = c, c = s, s = n, t = i), i = 0; t;) i = (s[--t] = s[t] + c[t] + i) / p | 0, s[t] = p === s[t] ? 0 : s[t] % p;
		return i && (s = [i].concat(s), ++o), B(e, s, o);
	}, i.precision = i.sd = function(e, t) {
		var n, r, i, a = this;
		if (e != null && e !== !!e) return C(e, 1, v), t == null ? t = s : C(t, 0, 8), V(new L(a), e, t);
		if (!(n = a.c)) return null;
		if (i = n.length - 1, r = i * m + 1, i = n[i]) {
			for (; i % 10 == 0; i /= 10, r--);
			for (i = n[0]; i >= 10; i /= 10, r++);
		}
		return e && a.e + 1 > r && (r = a.e + 1), r;
	}, i.shiftedBy = function(e) {
		return C(e, -h, h), this.times("1e" + e);
	}, i.squareRoot = i.sqrt = function() {
		var e, n, r, i, a, c = this, l = c.c, u = c.s, d = c.e, f = o + 4, p = new L("0.5");
		if (u !== 1 || !l || !l[0]) return new L(!u || u < 0 && (!l || l[0]) ? NaN : l ? c : Infinity);
		if (u = Math.sqrt(+H(c)), u == 0 || u == Infinity ? (n = x(l), (n.length + d) % 2 == 0 && (n += "0"), u = Math.sqrt(+n), d = b((d + 1) / 2) - (d < 0 || d % 2), u == Infinity ? n = "5e" + d : (n = u.toExponential(), n = n.slice(0, n.indexOf("e") + 1) + d), r = new L(n)) : r = new L(u + ""), r.c[0]) {
			for (d = r.e, u = d + f, u < 3 && (u = 0);;) if (a = r, r = p.times(a.plus(t(c, a, f, 1))), x(a.c).slice(0, u) === (n = x(r.c)).slice(0, u)) if (r.e < d && --u, n = n.slice(u - 3, u + 1), n == "9999" || !i && n == "4999") {
				if (!i && (V(a, a.e + o + 2, 0), a.times(a).eq(c))) {
					r = a;
					break;
				}
				f += 4, u += 4, i = 1;
			} else {
				(!+n || !+n.slice(1) && n.charAt(0) == "5") && (V(r, r.e + o + 2, 1), e = !r.times(r).eq(c));
				break;
			}
		}
		return V(r, r.e + o + 1, s, e);
	}, i.toExponential = function(e, t) {
		return e != null && (C(e, 0, v), e++), R(this, e, t, 1);
	}, i.toFixed = function(e, t) {
		return e != null && (C(e, 0, v), e = e + this.e + 1), R(this, e, t);
	}, i.toFormat = function(e, t, n) {
		var r, i = this;
		if (n == null) e != null && t && typeof t == "object" ? (n = t, t = null) : e && typeof e == "object" ? (n = e, e = t = null) : n = P;
		else if (typeof n != "object") throw Error(d + "Argument not an object: " + n);
		if (r = i.toFixed(e, t), i.c) {
			var a, o = r.split("."), s = +n.groupSize, c = +n.secondaryGroupSize, l = n.groupSeparator || "", u = o[0], f = o[1], p = i.s < 0, m = p ? u.slice(1) : u, h = m.length;
			if (c && (a = s, s = c, c = a, h -= a), s > 0 && h > 0) {
				for (a = h % s || s, u = m.substr(0, a); a < h; a += s) u += l + m.substr(a, s);
				c > 0 && (u += l + m.slice(a)), p && (u = "-" + u);
			}
			r = f ? u + (n.decimalSeparator || "") + ((c = +n.fractionGroupSize) ? f.replace(RegExp("\\d{" + c + "}\\B", "g"), "$&" + (n.fractionGroupSeparator || "")) : f) : u;
		}
		return (n.prefix || "") + r + (n.suffix || "");
	}, i.toFraction = function(e) {
		var n, r, i, o, c, l, u, f, p, h, _, v, y = this, b = y.c;
		if (e != null && (u = new L(e), !u.isInteger() && (u.c || u.s !== 1) || u.lt(a))) throw Error(d + "Argument " + (u.isInteger() ? "out of range: " : "not an integer: ") + H(u));
		if (!b) return new L(y);
		for (n = new L(a), p = r = new L(a), i = f = new L(a), v = x(b), c = n.e = v.length - y.e - 1, n.c[0] = g[(l = c % m) < 0 ? m + l : l], e = !e || u.comparedTo(n) > 0 ? c > 0 ? n : p : u, l = A, A = Infinity, u = new L(v), f.c[0] = 0; h = t(u, n, 0, 1), o = r.plus(h.times(i)), o.comparedTo(e) != 1;) r = i, i = o, p = f.plus(h.times(o = p)), f = o, n = u.minus(h.times(o = n)), u = o;
		return o = t(e.minus(r), i, 0, 1), f = f.plus(o.times(p)), r = r.plus(o.times(i)), f.s = p.s = y.s, c *= 2, _ = t(p, i, c, s).minus(y).abs().comparedTo(t(f, r, c, s).minus(y).abs()) < 1 ? [p, i] : [f, r], A = l, _;
	}, i.toNumber = function() {
		return +H(this);
	}, i.toPrecision = function(e, t) {
		return e != null && C(e, 1, v), R(this, e, t, 2);
	}, i.toString = function(e) {
		var t, r = this, i = r.s, a = r.e;
		return a === null ? i ? (t = "Infinity", i < 0 && (t = "-" + t)) : t = "NaN" : (e == null ? t = a <= D || a >= O ? T(x(r.c), a) : E(x(r.c), a, "0") : e === 10 && I ? (r = V(new L(r), o + a + 1, s), t = E(x(r.c), r.e, "0")) : (C(e, 2, F.length, "Base"), t = n(E(x(r.c), a, "0"), 10, e, i, !0)), i < 0 && r.c[0] && (t = "-" + t)), t;
	}, i.valueOf = i.toJSON = function() {
		return H(this);
	}, i._isBigNumber = !0, i[Symbol.toStringTag] = "BigNumber", i[Symbol.for("nodejs.util.inspect.custom")] = i.valueOf, e != null && L.set(e), L;
}
function b(e) {
	var t = e | 0;
	return e > 0 || e === t ? t : t - 1;
}
function x(e) {
	for (var t, n, r = 1, i = e.length, a = e[0] + ""; r < i;) {
		for (t = e[r++] + "", n = m - t.length; n--; t = "0" + t);
		a += t;
	}
	for (i = a.length; a.charCodeAt(--i) === 48;);
	return a.slice(0, i + 1 || 1);
}
function S(e, t) {
	var n, r, i = e.c, a = t.c, o = e.s, s = t.s, c = e.e, l = t.e;
	if (!o || !s) return null;
	if (n = i && !i[0], r = a && !a[0], n || r) return n ? r ? 0 : -s : o;
	if (o != s) return o;
	if (n = o < 0, r = c == l, !i || !a) return r ? 0 : !i ^ n ? 1 : -1;
	if (!r) return c > l ^ n ? 1 : -1;
	for (s = (c = i.length) < (l = a.length) ? c : l, o = 0; o < s; o++) if (i[o] != a[o]) return i[o] > a[o] ^ n ? 1 : -1;
	return c == l ? 0 : c > l ^ n ? 1 : -1;
}
function C(e, t, n, r) {
	if (e < t || e > n || e !== u(e)) throw Error(d + (r || "Argument") + (typeof e == "number" ? e < t || e > n ? " out of range: " : " not an integer: " : " not a primitive number: ") + String(e));
}
function w(e) {
	var t = e.c.length - 1;
	return b(e.e / m) == t && e.c[t] % 2 != 0;
}
function T(e, t) {
	return (e.length > 1 ? e.charAt(0) + "." + e.slice(1) : e) + (t < 0 ? "e" : "e+") + t;
}
function E(e, t, n) {
	var r, i;
	if (t < 0) {
		for (i = n + "."; ++t; i += n);
		e = i + e;
	} else if (r = e.length, ++t > r) {
		for (i = n, t -= r; --t; i += n);
		e += i;
	} else t < r && (e = e.slice(0, t) + "." + e.slice(t));
	return e;
}
var D = y(), O = class {
	key;
	left = null;
	right = null;
	constructor(e) {
		this.key = e;
	}
}, k = class extends O {
	constructor(e) {
		super(e);
	}
}, A = class {
	size = 0;
	modificationCount = 0;
	splayCount = 0;
	splay(e) {
		let t = this.root;
		if (t == null) return this.compare(e, e), -1;
		let n = null, r = null, i = null, a = null, o = t, s = this.compare, c;
		for (;;) if (c = s(o.key, e), c > 0) {
			let t = o.left;
			if (t == null || (c = s(t.key, e), c > 0 && (o.left = t.right, t.right = o, o = t, t = o.left, t == null))) break;
			n == null ? r = o : n.left = o, n = o, o = t;
		} else if (c < 0) {
			let t = o.right;
			if (t == null || (c = s(t.key, e), c < 0 && (o.right = t.left, t.left = o, o = t, t = o.right, t == null))) break;
			i == null ? a = o : i.right = o, i = o, o = t;
		} else break;
		return i != null && (i.right = o.left, o.left = a), n != null && (n.left = o.right, o.right = r), this.root !== o && (this.root = o, this.splayCount++), c;
	}
	splayMin(e) {
		let t = e, n = t.left;
		for (; n != null;) {
			let e = n;
			t.left = e.right, e.right = t, t = e, n = t.left;
		}
		return t;
	}
	splayMax(e) {
		let t = e, n = t.right;
		for (; n != null;) {
			let e = n;
			t.right = e.left, e.left = t, t = e, n = t.right;
		}
		return t;
	}
	_delete(e) {
		if (this.root == null || this.splay(e) != 0) return null;
		let t = this.root, n = t, r = t.left;
		if (this.size--, r == null) this.root = t.right;
		else {
			let e = t.right;
			t = this.splayMax(r), t.right = e, this.root = t;
		}
		return this.modificationCount++, n;
	}
	addNewRoot(e, t) {
		this.size++, this.modificationCount++;
		let n = this.root;
		if (n == null) {
			this.root = e;
			return;
		}
		t < 0 ? (e.left = n, e.right = n.right, n.right = null) : (e.right = n, e.left = n.left, n.left = null), this.root = e;
	}
	_first() {
		let e = this.root;
		return e == null ? null : (this.root = this.splayMin(e), this.root);
	}
	_last() {
		let e = this.root;
		return e == null ? null : (this.root = this.splayMax(e), this.root);
	}
	clear() {
		this.root = null, this.size = 0, this.modificationCount++;
	}
	has(e) {
		return this.validKey(e) && this.splay(e) == 0;
	}
	defaultCompare() {
		return (e, t) => e < t ? -1 : +(e > t);
	}
	wrap() {
		return {
			getRoot: () => this.root,
			setRoot: (e) => {
				this.root = e;
			},
			getSize: () => this.size,
			getModificationCount: () => this.modificationCount,
			getSplayCount: () => this.splayCount,
			setSplayCount: (e) => {
				this.splayCount = e;
			},
			splay: (e) => this.splay(e),
			has: (e) => this.has(e)
		};
	}
}, j = class e extends A {
	root = null;
	compare;
	validKey;
	constructor(e, t) {
		super(), this.compare = e ?? this.defaultCompare(), this.validKey = t ?? ((e) => e != null && e != null);
	}
	delete(e) {
		return this.validKey(e) ? this._delete(e) != null : !1;
	}
	deleteAll(e) {
		for (let t of e) this.delete(t);
	}
	forEach(e) {
		let t = this[Symbol.iterator](), n;
		for (; n = t.next(), !n.done;) e(n.value, n.value, this);
	}
	add(e) {
		let t = this.splay(e);
		return t != 0 && this.addNewRoot(new k(e), t), this;
	}
	addAndReturn(e) {
		let t = this.splay(e);
		return t != 0 && this.addNewRoot(new k(e), t), this.root.key;
	}
	addAll(e) {
		for (let t of e) this.add(t);
	}
	isEmpty() {
		return this.root == null;
	}
	isNotEmpty() {
		return this.root != null;
	}
	single() {
		if (this.size == 0) throw "Bad state: No element";
		if (this.size > 1) throw "Bad state: Too many element";
		return this.root.key;
	}
	first() {
		if (this.size == 0) throw "Bad state: No element";
		return this._first().key;
	}
	last() {
		if (this.size == 0) throw "Bad state: No element";
		return this._last().key;
	}
	lastBefore(e) {
		if (e == null) throw "Invalid arguments(s)";
		if (this.root == null) return null;
		if (this.splay(e) < 0) return this.root.key;
		let t = this.root.left;
		if (t == null) return null;
		let n = t.right;
		for (; n != null;) t = n, n = t.right;
		return t.key;
	}
	firstAfter(e) {
		if (e == null) throw "Invalid arguments(s)";
		if (this.root == null) return null;
		if (this.splay(e) > 0) return this.root.key;
		let t = this.root.right;
		if (t == null) return null;
		let n = t.left;
		for (; n != null;) t = n, n = t.left;
		return t.key;
	}
	retainAll(t) {
		let n = new e(this.compare, this.validKey), r = this.modificationCount;
		for (let e of t) {
			if (r != this.modificationCount) throw "Concurrent modification during iteration.";
			this.validKey(e) && this.splay(e) == 0 && n.add(this.root.key);
		}
		n.size != this.size && (this.root = n.root, this.size = n.size, this.modificationCount++);
	}
	lookup(e) {
		return !this.validKey(e) || this.splay(e) != 0 ? null : this.root.key;
	}
	intersection(t) {
		let n = new e(this.compare, this.validKey);
		for (let e of this) t.has(e) && n.add(e);
		return n;
	}
	difference(t) {
		let n = new e(this.compare, this.validKey);
		for (let e of this) t.has(e) || n.add(e);
		return n;
	}
	union(e) {
		let t = this.clone();
		return t.addAll(e), t;
	}
	clone() {
		let t = new e(this.compare, this.validKey);
		return t.size = this.size, t.root = this.copyNode(this.root), t;
	}
	copyNode(e) {
		if (e == null) return null;
		function t(e, n) {
			let r, i;
			do {
				if (r = e.left, i = e.right, r != null) {
					let e = new k(r.key);
					n.left = e, t(r, e);
				}
				if (i != null) {
					let t = new k(i.key);
					n.right = t, e = i, n = t;
				}
			} while (i != null);
		}
		let n = new k(e.key);
		return t(e, n), n;
	}
	toSet() {
		return this.clone();
	}
	entries() {
		return new P(this.wrap());
	}
	keys() {
		return this[Symbol.iterator]();
	}
	values() {
		return this[Symbol.iterator]();
	}
	[Symbol.iterator]() {
		return new N(this.wrap());
	}
	[Symbol.toStringTag] = "[object Set]";
}, M = class {
	tree;
	path = [];
	modificationCount = null;
	splayCount;
	constructor(e) {
		this.tree = e, this.splayCount = e.getSplayCount();
	}
	[Symbol.iterator]() {
		return this;
	}
	next() {
		return this.moveNext() ? {
			done: !1,
			value: this.current()
		} : {
			done: !0,
			value: null
		};
	}
	current() {
		if (!this.path.length) return null;
		let e = this.path[this.path.length - 1];
		return this.getValue(e);
	}
	rebuildPath(e) {
		this.path.splice(0, this.path.length), this.tree.splay(e), this.path.push(this.tree.getRoot()), this.splayCount = this.tree.getSplayCount();
	}
	findLeftMostDescendent(e) {
		for (; e != null;) this.path.push(e), e = e.left;
	}
	moveNext() {
		if (this.modificationCount != this.tree.getModificationCount()) {
			if (this.modificationCount == null) {
				this.modificationCount = this.tree.getModificationCount();
				let e = this.tree.getRoot();
				for (; e != null;) this.path.push(e), e = e.left;
				return this.path.length > 0;
			}
			throw "Concurrent modification during iteration.";
		}
		if (!this.path.length) return !1;
		this.splayCount != this.tree.getSplayCount() && this.rebuildPath(this.path[this.path.length - 1].key);
		let e = this.path[this.path.length - 1], t = e.right;
		if (t != null) {
			for (; t != null;) this.path.push(t), t = t.left;
			return !0;
		}
		for (this.path.pop(); this.path.length && this.path[this.path.length - 1].right === e;) e = this.path.pop();
		return this.path.length > 0;
	}
}, N = class extends M {
	getValue(e) {
		return e.key;
	}
}, P = class extends M {
	getValue(e) {
		return [e.key, e.key];
	}
}, F = (e) => () => e, I = (e) => {
	let t = e ? (t, n) => n.minus(t).abs().isLessThanOrEqualTo(e) : F(!1);
	return (e, n) => t(e, n) ? 0 : e.comparedTo(n);
};
function L(e) {
	let t = e ? (t, n, r, i, a) => t.exponentiatedBy(2).isLessThanOrEqualTo(i.minus(n).exponentiatedBy(2).plus(a.minus(r).exponentiatedBy(2)).times(e)) : F(!1);
	return (e, n, r) => {
		let i = e.x, a = e.y, o = r.x, s = r.y, c = a.minus(s).times(n.x.minus(o)).minus(i.minus(o).times(n.y.minus(s)));
		return t(c, i, a, o, s) ? 0 : c.comparedTo(0);
	};
}
var R = (e) => e, z = (e) => {
	if (e) {
		let t = new j(I(e)), n = new j(I(e)), r = (e, t) => t.addAndReturn(e), i = (e) => ({
			x: r(e.x, t),
			y: r(e.y, n)
		});
		return i({
			x: new D(0),
			y: new D(0)
		}), i;
	}
	return R;
}, B = (e) => ({
	set: (e) => {
		V = B(e);
	},
	reset: () => B(e),
	compare: I(e),
	snap: z(e),
	orient: L(e)
}), V = B(), H = (e, t) => e.ll.x.isLessThanOrEqualTo(t.x) && t.x.isLessThanOrEqualTo(e.ur.x) && e.ll.y.isLessThanOrEqualTo(t.y) && t.y.isLessThanOrEqualTo(e.ur.y), U = (e, t) => {
	if (t.ur.x.isLessThan(e.ll.x) || e.ur.x.isLessThan(t.ll.x) || t.ur.y.isLessThan(e.ll.y) || e.ur.y.isLessThan(t.ll.y)) return null;
	let n = e.ll.x.isLessThan(t.ll.x) ? t.ll.x : e.ll.x, r = e.ur.x.isLessThan(t.ur.x) ? e.ur.x : t.ur.x, i = e.ll.y.isLessThan(t.ll.y) ? t.ll.y : e.ll.y, a = e.ur.y.isLessThan(t.ur.y) ? e.ur.y : t.ur.y;
	return {
		ll: {
			x: n,
			y: i
		},
		ur: {
			x: r,
			y: a
		}
	};
}, W = (e, t) => e.x.times(t.y).minus(e.y.times(t.x)), ee = (e, t) => e.x.times(t.x).plus(e.y.times(t.y)), G = (e) => ee(e, e).sqrt(), te = (e, t, n) => {
	let r = {
		x: t.x.minus(e.x),
		y: t.y.minus(e.y)
	}, i = {
		x: n.x.minus(e.x),
		y: n.y.minus(e.y)
	};
	return W(i, r).div(G(i)).div(G(r));
}, ne = (e, t, n) => {
	let r = {
		x: t.x.minus(e.x),
		y: t.y.minus(e.y)
	}, i = {
		x: n.x.minus(e.x),
		y: n.y.minus(e.y)
	};
	return ee(i, r).div(G(i)).div(G(r));
}, re = (e, t, n) => t.y.isZero() ? null : {
	x: e.x.plus(t.x.div(t.y).times(n.minus(e.y))),
	y: n
}, ie = (e, t, n) => t.x.isZero() ? null : {
	x: n,
	y: e.y.plus(t.y.div(t.x).times(n.minus(e.x)))
}, ae = (e, t, n, r) => {
	if (t.x.isZero()) return ie(n, r, e.x);
	if (r.x.isZero()) return ie(e, t, n.x);
	if (t.y.isZero()) return re(n, r, e.y);
	if (r.y.isZero()) return re(e, t, n.y);
	let i = W(t, r);
	if (i.isZero()) return null;
	let a = {
		x: n.x.minus(e.x),
		y: n.y.minus(e.y)
	}, o = W(a, t).div(i), s = W(a, r).div(i), c = e.x.plus(s.times(t.x)), l = n.x.plus(o.times(r.x)), u = e.y.plus(s.times(t.y)), d = n.y.plus(o.times(r.y));
	return {
		x: c.plus(l).div(2),
		y: u.plus(d).div(2)
	};
}, K = class e {
	point;
	isLeft;
	segment;
	otherSE;
	consumedBy;
	static compare(t, n) {
		let r = e.comparePoints(t.point, n.point);
		return r === 0 ? (t.point !== n.point && t.link(n), t.isLeft === n.isLeft ? Y.compare(t.segment, n.segment) : t.isLeft ? 1 : -1) : r;
	}
	static comparePoints(e, t) {
		return e.x.isLessThan(t.x) ? -1 : e.x.isGreaterThan(t.x) ? 1 : e.y.isLessThan(t.y) ? -1 : +!!e.y.isGreaterThan(t.y);
	}
	constructor(e, t) {
		e.events === void 0 ? e.events = [this] : e.events.push(this), this.point = e, this.isLeft = t;
	}
	link(e) {
		if (e.point === this.point) throw Error("Tried to link already linked events");
		let t = e.point.events;
		for (let e = 0, n = t.length; e < n; e++) {
			let n = t[e];
			this.point.events.push(n), n.point = this.point;
		}
		this.checkForConsuming();
	}
	checkForConsuming() {
		let e = this.point.events.length;
		for (let t = 0; t < e; t++) {
			let n = this.point.events[t];
			if (n.segment.consumedBy === void 0) for (let r = t + 1; r < e; r++) {
				let e = this.point.events[r];
				e.consumedBy === void 0 && n.otherSE.point.events === e.otherSE.point.events && n.segment.consume(e.segment);
			}
		}
	}
	getAvailableLinkedEvents() {
		let e = [];
		for (let t = 0, n = this.point.events.length; t < n; t++) {
			let n = this.point.events[t];
			n !== this && !n.segment.ringOut && n.segment.isInResult() && e.push(n);
		}
		return e;
	}
	getLeftmostComparator(e) {
		let t = /* @__PURE__ */ new Map(), n = (n) => {
			let r = n.otherSE;
			t.set(n, {
				sine: te(this.point, e.point, r.point),
				cosine: ne(this.point, e.point, r.point)
			});
		};
		return (e, r) => {
			t.has(e) || n(e), t.has(r) || n(r);
			let { sine: i, cosine: a } = t.get(e), { sine: o, cosine: s } = t.get(r);
			return i.isGreaterThanOrEqualTo(0) && o.isGreaterThanOrEqualTo(0) ? a.isLessThan(s) ? 1 : a.isGreaterThan(s) ? -1 : 0 : i.isLessThan(0) && o.isLessThan(0) ? a.isLessThan(s) ? -1 : +!!a.isGreaterThan(s) : o.isLessThan(i) ? -1 : +!!o.isGreaterThan(i);
		};
	}
}, oe = class e {
	events;
	poly;
	_isExteriorRing;
	_enclosingRing;
	static factory(t) {
		let n = [];
		for (let r = 0, i = t.length; r < i; r++) {
			let i = t[r];
			if (!i.isInResult() || i.ringOut) continue;
			let a = null, o = i.leftSE, s = i.rightSE, c = [o], l = o.point, u = [];
			for (; a = o, o = s, c.push(o), o.point !== l;) for (;;) {
				let t = o.getAvailableLinkedEvents();
				if (t.length === 0) {
					let e = c[0].point, t = c[c.length - 1].point;
					throw Error(`Unable to complete output ring starting at [${e.x}, ${e.y}]. Last matching segment found ends at [${t.x}, ${t.y}].`);
				}
				if (t.length === 1) {
					s = t[0].otherSE;
					break;
				}
				let r = null;
				for (let e = 0, t = u.length; e < t; e++) if (u[e].point === o.point) {
					r = e;
					break;
				}
				if (r !== null) {
					let t = u.splice(r)[0], i = c.splice(t.index);
					i.unshift(i[0].otherSE), n.push(new e(i.reverse()));
					continue;
				}
				u.push({
					index: c.length,
					point: o.point
				});
				let i = o.getLeftmostComparator(a);
				s = t.sort(i)[0].otherSE;
				break;
			}
			n.push(new e(c));
		}
		return n;
	}
	constructor(e) {
		this.events = e;
		for (let t = 0, n = e.length; t < n; t++) e[t].segment.ringOut = this;
		this.poly = null;
	}
	getGeom() {
		let e = this.events[0].point, t = [e];
		for (let n = 1, r = this.events.length - 1; n < r; n++) {
			let r = this.events[n].point, i = this.events[n + 1].point;
			V.orient(r, e, i) !== 0 && (t.push(r), e = r);
		}
		if (t.length === 1) return null;
		let n = t[0], r = t[1];
		V.orient(n, e, r) === 0 && t.shift(), t.push(t[0]);
		let i = this.isExteriorRing() ? 1 : -1, a = this.isExteriorRing() ? 0 : t.length - 1, o = this.isExteriorRing() ? t.length : -1, s = [];
		for (let e = a; e != o; e += i) s.push([t[e].x.toNumber(), t[e].y.toNumber()]);
		return s;
	}
	isExteriorRing() {
		if (this._isExteriorRing === void 0) {
			let e = this.enclosingRing();
			this._isExteriorRing = e ? !e.isExteriorRing() : !0;
		}
		return this._isExteriorRing;
	}
	enclosingRing() {
		return this._enclosingRing === void 0 && (this._enclosingRing = this._calcEnclosingRing()), this._enclosingRing;
	}
	_calcEnclosingRing() {
		let e = this.events[0];
		for (let t = 1, n = this.events.length; t < n; t++) {
			let n = this.events[t];
			K.compare(e, n) > 0 && (e = n);
		}
		let t = e.segment.prevInResult(), n = t ? t.prevInResult() : null;
		for (;;) {
			if (!t) return null;
			if (!n) return t.ringOut;
			if (n.ringOut !== t.ringOut) return n.ringOut?.enclosingRing() === t.ringOut ? t.ringOut?.enclosingRing() : t.ringOut;
			t = n.prevInResult(), n = t ? t.prevInResult() : null;
		}
	}
}, se = class {
	exteriorRing;
	interiorRings;
	constructor(e) {
		this.exteriorRing = e, e.poly = this, this.interiorRings = [];
	}
	addInterior(e) {
		this.interiorRings.push(e), e.poly = this;
	}
	getGeom() {
		let e = this.exteriorRing.getGeom();
		if (e === null) return null;
		let t = [e];
		for (let e = 0, n = this.interiorRings.length; e < n; e++) {
			let n = this.interiorRings[e].getGeom();
			n !== null && t.push(n);
		}
		return t;
	}
}, ce = class {
	rings;
	polys;
	constructor(e) {
		this.rings = e, this.polys = this._composePolys(e);
	}
	getGeom() {
		let e = [];
		for (let t = 0, n = this.polys.length; t < n; t++) {
			let n = this.polys[t].getGeom();
			n !== null && e.push(n);
		}
		return e;
	}
	_composePolys(e) {
		let t = [];
		for (let n = 0, r = e.length; n < r; n++) {
			let r = e[n];
			if (!r.poly) if (r.isExteriorRing()) t.push(new se(r));
			else {
				let e = r.enclosingRing();
				e?.poly || t.push(new se(e)), e?.poly?.addInterior(r);
			}
		}
		return t;
	}
}, le = class {
	queue;
	tree;
	segments;
	constructor(e, t = Y.compare) {
		this.queue = e, this.tree = new j(t), this.segments = [];
	}
	process(e) {
		let t = e.segment, n = [];
		if (e.consumedBy) return e.isLeft ? this.queue.delete(e.otherSE) : this.tree.delete(t), n;
		e.isLeft && this.tree.add(t);
		let r = t, i = t;
		do
			r = this.tree.lastBefore(r);
		while (r != null && r.consumedBy != null);
		do
			i = this.tree.firstAfter(i);
		while (i != null && i.consumedBy != null);
		if (e.isLeft) {
			let a = null;
			if (r) {
				let e = r.getIntersection(t);
				if (e !== null && (t.isAnEndpoint(e) || (a = e), !r.isAnEndpoint(e))) {
					let t = this._splitSafely(r, e);
					for (let e = 0, r = t.length; e < r; e++) n.push(t[e]);
				}
			}
			let o = null;
			if (i) {
				let e = i.getIntersection(t);
				if (e !== null && (t.isAnEndpoint(e) || (o = e), !i.isAnEndpoint(e))) {
					let t = this._splitSafely(i, e);
					for (let e = 0, r = t.length; e < r; e++) n.push(t[e]);
				}
			}
			if (a !== null || o !== null) {
				let e = null;
				e = a === null ? o : o === null || K.comparePoints(a, o) <= 0 ? a : o, this.queue.delete(t.rightSE), n.push(t.rightSE);
				let r = t.split(e);
				for (let e = 0, t = r.length; e < t; e++) n.push(r[e]);
			}
			n.length > 0 ? (this.tree.delete(t), n.push(e)) : (this.segments.push(t), t.prev = r);
		} else {
			if (r && i) {
				let e = r.getIntersection(i);
				if (e !== null) {
					if (!r.isAnEndpoint(e)) {
						let t = this._splitSafely(r, e);
						for (let e = 0, r = t.length; e < r; e++) n.push(t[e]);
					}
					if (!i.isAnEndpoint(e)) {
						let t = this._splitSafely(i, e);
						for (let e = 0, r = t.length; e < r; e++) n.push(t[e]);
					}
				}
			}
			this.tree.delete(t);
		}
		return n;
	}
	_splitSafely(e, t) {
		this.tree.delete(e);
		let n = e.rightSE;
		this.queue.delete(n);
		let r = e.split(t);
		return r.push(n), e.consumedBy === void 0 && this.tree.add(e), r;
	}
}, q = new class {
	type;
	numMultiPolys;
	run(e, t, n) {
		q.type = e;
		let r = [new pe(t, !0)];
		for (let e = 0, t = n.length; e < t; e++) r.push(new pe(n[e], !1));
		if (q.numMultiPolys = r.length, q.type === "difference") {
			let e = r[0], t = 1;
			for (; t < r.length;) U(r[t].bbox, e.bbox) === null ? r.splice(t, 1) : t++;
		}
		if (q.type === "intersection") for (let e = 0, t = r.length; e < t; e++) {
			let t = r[e];
			for (let n = e + 1, i = r.length; n < i; n++) if (U(t.bbox, r[n].bbox) === null) return [];
		}
		let i = new j(K.compare);
		for (let e = 0, t = r.length; e < t; e++) {
			let t = r[e].getSweepEvents();
			for (let e = 0, n = t.length; e < n; e++) i.add(t[e]);
		}
		let a = new le(i), o = null;
		for (i.size != 0 && (o = i.first(), i.delete(o)); o;) {
			let e = a.process(o);
			for (let t = 0, n = e.length; t < n; t++) {
				let n = e[t];
				n.consumedBy === void 0 && i.add(n);
			}
			i.size == 0 ? o = null : (o = i.first(), i.delete(o));
		}
		return V.reset(), new ce(oe.factory(a.segments)).getGeom();
	}
}(), J = q, ue = 0, Y = class e {
	id;
	leftSE;
	rightSE;
	rings;
	windings;
	ringOut;
	consumedBy;
	prev;
	_prevInResult;
	_beforeState;
	_afterState;
	_isInResult;
	static compare(e, t) {
		let n = e.leftSE.point.x, r = t.leftSE.point.x, i = e.rightSE.point.x, a = t.rightSE.point.x;
		if (a.isLessThan(n)) return 1;
		if (i.isLessThan(r)) return -1;
		let o = e.leftSE.point.y, s = t.leftSE.point.y, c = e.rightSE.point.y, l = t.rightSE.point.y;
		if (n.isLessThan(r)) {
			if (s.isLessThan(o) && s.isLessThan(c)) return 1;
			if (s.isGreaterThan(o) && s.isGreaterThan(c)) return -1;
			let n = e.comparePoint(t.leftSE.point);
			if (n < 0) return 1;
			if (n > 0) return -1;
			let r = t.comparePoint(e.rightSE.point);
			return r === 0 ? -1 : r;
		}
		if (n.isGreaterThan(r)) {
			if (o.isLessThan(s) && o.isLessThan(l)) return -1;
			if (o.isGreaterThan(s) && o.isGreaterThan(l)) return 1;
			let n = t.comparePoint(e.leftSE.point);
			if (n !== 0) return n;
			let r = e.comparePoint(t.rightSE.point);
			return r < 0 ? 1 : r > 0 ? -1 : 1;
		}
		if (o.isLessThan(s)) return -1;
		if (o.isGreaterThan(s)) return 1;
		if (i.isLessThan(a)) {
			let n = t.comparePoint(e.rightSE.point);
			if (n !== 0) return n;
		}
		if (i.isGreaterThan(a)) {
			let n = e.comparePoint(t.rightSE.point);
			if (n < 0) return 1;
			if (n > 0) return -1;
		}
		if (!i.eq(a)) {
			let e = c.minus(o), t = i.minus(n), u = l.minus(s), d = a.minus(r);
			if (e.isGreaterThan(t) && u.isLessThan(d)) return 1;
			if (e.isLessThan(t) && u.isGreaterThan(d)) return -1;
		}
		return i.isGreaterThan(a) ? 1 : i.isLessThan(a) || c.isLessThan(l) ? -1 : c.isGreaterThan(l) ? 1 : e.id < t.id ? -1 : +(e.id > t.id);
	}
	constructor(e, t, n, r) {
		this.id = ++ue, this.leftSE = e, e.segment = this, e.otherSE = t, this.rightSE = t, t.segment = this, t.otherSE = e, this.rings = n, this.windings = r;
	}
	static fromRing(t, n, r) {
		let i, a, o, s = K.comparePoints(t, n);
		if (s < 0) i = t, a = n, o = 1;
		else if (s > 0) i = n, a = t, o = -1;
		else throw Error(`Tried to create degenerate segment at [${t.x}, ${t.y}]`);
		return new e(new K(i, !0), new K(a, !1), [r], [o]);
	}
	replaceRightSE(e) {
		this.rightSE = e, this.rightSE.segment = this, this.rightSE.otherSE = this.leftSE, this.leftSE.otherSE = this.rightSE;
	}
	bbox() {
		let e = this.leftSE.point.y, t = this.rightSE.point.y;
		return {
			ll: {
				x: this.leftSE.point.x,
				y: e.isLessThan(t) ? e : t
			},
			ur: {
				x: this.rightSE.point.x,
				y: e.isGreaterThan(t) ? e : t
			}
		};
	}
	vector() {
		return {
			x: this.rightSE.point.x.minus(this.leftSE.point.x),
			y: this.rightSE.point.y.minus(this.leftSE.point.y)
		};
	}
	isAnEndpoint(e) {
		return e.x.eq(this.leftSE.point.x) && e.y.eq(this.leftSE.point.y) || e.x.eq(this.rightSE.point.x) && e.y.eq(this.rightSE.point.y);
	}
	comparePoint(e) {
		return V.orient(this.leftSE.point, e, this.rightSE.point);
	}
	getIntersection(e) {
		let t = this.bbox(), n = e.bbox(), r = U(t, n);
		if (r === null) return null;
		let i = this.leftSE.point, a = this.rightSE.point, o = e.leftSE.point, s = e.rightSE.point, c = H(t, o) && this.comparePoint(o) === 0, l = H(n, i) && e.comparePoint(i) === 0, u = H(t, s) && this.comparePoint(s) === 0, d = H(n, a) && e.comparePoint(a) === 0;
		if (l && c) return d && !u ? a : !d && u ? s : null;
		if (l) return u && i.x.eq(s.x) && i.y.eq(s.y) ? null : i;
		if (c) return d && a.x.eq(o.x) && a.y.eq(o.y) ? null : o;
		if (d && u) return null;
		if (d) return a;
		if (u) return s;
		let f = ae(i, this.vector(), o, e.vector());
		return f === null || !H(r, f) ? null : V.snap(f);
	}
	split(t) {
		let n = [], r = t.events !== void 0, i = new K(t, !0), a = new K(t, !1), o = this.rightSE;
		this.replaceRightSE(a), n.push(a), n.push(i);
		let s = new e(i, o, this.rings.slice(), this.windings.slice());
		return K.comparePoints(s.leftSE.point, s.rightSE.point) > 0 && s.swapEvents(), K.comparePoints(this.leftSE.point, this.rightSE.point) > 0 && this.swapEvents(), r && (i.checkForConsuming(), a.checkForConsuming()), n;
	}
	swapEvents() {
		let e = this.rightSE;
		this.rightSE = this.leftSE, this.leftSE = e, this.leftSE.isLeft = !0, this.rightSE.isLeft = !1;
		for (let e = 0, t = this.windings.length; e < t; e++) this.windings[e] *= -1;
	}
	consume(t) {
		let n = this, r = t;
		for (; n.consumedBy;) n = n.consumedBy;
		for (; r.consumedBy;) r = r.consumedBy;
		let i = e.compare(n, r);
		if (i !== 0) {
			if (i > 0) {
				let e = n;
				n = r, r = e;
			}
			if (n.prev === r) {
				let e = n;
				n = r, r = e;
			}
			for (let e = 0, t = r.rings.length; e < t; e++) {
				let t = r.rings[e], i = r.windings[e], a = n.rings.indexOf(t);
				a === -1 ? (n.rings.push(t), n.windings.push(i)) : n.windings[a] += i;
			}
			r.rings = null, r.windings = null, r.consumedBy = n, r.leftSE.consumedBy = n.leftSE, r.rightSE.consumedBy = n.rightSE;
		}
	}
	prevInResult() {
		return this._prevInResult === void 0 && (this.prev ? this.prev.isInResult() ? this._prevInResult = this.prev : this._prevInResult = this.prev.prevInResult() : this._prevInResult = null), this._prevInResult;
	}
	beforeState() {
		if (this._beforeState !== void 0) return this._beforeState;
		if (!this.prev) this._beforeState = {
			rings: [],
			windings: [],
			multiPolys: []
		};
		else {
			let e = this.prev.consumedBy || this.prev;
			this._beforeState = e.afterState();
		}
		return this._beforeState;
	}
	afterState() {
		if (this._afterState !== void 0) return this._afterState;
		let e = this.beforeState();
		this._afterState = {
			rings: e.rings.slice(0),
			windings: e.windings.slice(0),
			multiPolys: []
		};
		let t = this._afterState.rings, n = this._afterState.windings, r = this._afterState.multiPolys;
		for (let e = 0, r = this.rings.length; e < r; e++) {
			let r = this.rings[e], i = this.windings[e], a = t.indexOf(r);
			a === -1 ? (t.push(r), n.push(i)) : n[a] += i;
		}
		let i = [], a = [];
		for (let e = 0, r = t.length; e < r; e++) {
			if (n[e] === 0) continue;
			let r = t[e], o = r.poly;
			if (a.indexOf(o) === -1) if (r.isExterior) i.push(o);
			else {
				a.indexOf(o) === -1 && a.push(o);
				let e = i.indexOf(r.poly);
				e !== -1 && i.splice(e, 1);
			}
		}
		for (let e = 0, t = i.length; e < t; e++) {
			let t = i[e].multiPoly;
			r.indexOf(t) === -1 && r.push(t);
		}
		return this._afterState;
	}
	isInResult() {
		if (this.consumedBy) return !1;
		if (this._isInResult !== void 0) return this._isInResult;
		let e = this.beforeState().multiPolys, t = this.afterState().multiPolys;
		switch (J.type) {
			case "union": {
				let n = e.length === 0, r = t.length === 0;
				this._isInResult = n !== r;
				break;
			}
			case "intersection": {
				let n, r;
				e.length < t.length ? (n = e.length, r = t.length) : (n = t.length, r = e.length), this._isInResult = r === J.numMultiPolys && n < r;
				break;
			}
			case "xor": {
				let n = Math.abs(e.length - t.length);
				this._isInResult = n % 2 == 1;
				break;
			}
			case "difference": {
				let n = (e) => e.length === 1 && e[0].isSubject;
				this._isInResult = n(e) !== n(t);
				break;
			}
		}
		return this._isInResult;
	}
}, de = class {
	poly;
	isExterior;
	segments;
	bbox;
	constructor(e, t, n) {
		if (!Array.isArray(e) || e.length === 0 || (this.poly = t, this.isExterior = n, this.segments = [], typeof e[0][0] != "number" || typeof e[0][1] != "number")) throw Error("Input geometry is not a valid Polygon or MultiPolygon");
		let r = V.snap({
			x: new D(e[0][0]),
			y: new D(e[0][1])
		});
		this.bbox = {
			ll: {
				x: r.x,
				y: r.y
			},
			ur: {
				x: r.x,
				y: r.y
			}
		};
		let i = r;
		for (let t = 1, n = e.length; t < n; t++) {
			if (typeof e[t][0] != "number" || typeof e[t][1] != "number") throw Error("Input geometry is not a valid Polygon or MultiPolygon");
			let n = V.snap({
				x: new D(e[t][0]),
				y: new D(e[t][1])
			});
			n.x.eq(i.x) && n.y.eq(i.y) || (this.segments.push(Y.fromRing(i, n, this)), n.x.isLessThan(this.bbox.ll.x) && (this.bbox.ll.x = n.x), n.y.isLessThan(this.bbox.ll.y) && (this.bbox.ll.y = n.y), n.x.isGreaterThan(this.bbox.ur.x) && (this.bbox.ur.x = n.x), n.y.isGreaterThan(this.bbox.ur.y) && (this.bbox.ur.y = n.y), i = n);
		}
		(!r.x.eq(i.x) || !r.y.eq(i.y)) && this.segments.push(Y.fromRing(i, r, this));
	}
	getSweepEvents() {
		let e = [];
		for (let t = 0, n = this.segments.length; t < n; t++) {
			let n = this.segments[t];
			e.push(n.leftSE), e.push(n.rightSE);
		}
		return e;
	}
}, fe = class {
	multiPoly;
	exteriorRing;
	interiorRings;
	bbox;
	constructor(e, t) {
		if (!Array.isArray(e)) throw Error("Input geometry is not a valid Polygon or MultiPolygon");
		this.exteriorRing = new de(e[0], this, !0), this.bbox = {
			ll: {
				x: this.exteriorRing.bbox.ll.x,
				y: this.exteriorRing.bbox.ll.y
			},
			ur: {
				x: this.exteriorRing.bbox.ur.x,
				y: this.exteriorRing.bbox.ur.y
			}
		}, this.interiorRings = [];
		for (let t = 1, n = e.length; t < n; t++) {
			let n = new de(e[t], this, !1);
			n.bbox.ll.x.isLessThan(this.bbox.ll.x) && (this.bbox.ll.x = n.bbox.ll.x), n.bbox.ll.y.isLessThan(this.bbox.ll.y) && (this.bbox.ll.y = n.bbox.ll.y), n.bbox.ur.x.isGreaterThan(this.bbox.ur.x) && (this.bbox.ur.x = n.bbox.ur.x), n.bbox.ur.y.isGreaterThan(this.bbox.ur.y) && (this.bbox.ur.y = n.bbox.ur.y), this.interiorRings.push(n);
		}
		this.multiPoly = t;
	}
	getSweepEvents() {
		let e = this.exteriorRing.getSweepEvents();
		for (let t = 0, n = this.interiorRings.length; t < n; t++) {
			let n = this.interiorRings[t].getSweepEvents();
			for (let t = 0, r = n.length; t < r; t++) e.push(n[t]);
		}
		return e;
	}
}, pe = class {
	isSubject;
	polys;
	bbox;
	constructor(e, t) {
		if (!Array.isArray(e)) throw Error("Input geometry is not a valid Polygon or MultiPolygon");
		try {
			typeof e[0][0][0] == "number" && (e = [e]);
		} catch {}
		this.polys = [], this.bbox = {
			ll: {
				x: new D(Infinity),
				y: new D(Infinity)
			},
			ur: {
				x: new D(-Infinity),
				y: new D(-Infinity)
			}
		};
		for (let t = 0, n = e.length; t < n; t++) {
			let n = new fe(e[t], this);
			n.bbox.ll.x.isLessThan(this.bbox.ll.x) && (this.bbox.ll.x = n.bbox.ll.x), n.bbox.ll.y.isLessThan(this.bbox.ll.y) && (this.bbox.ll.y = n.bbox.ll.y), n.bbox.ur.x.isGreaterThan(this.bbox.ur.x) && (this.bbox.ur.x = n.bbox.ur.x), n.bbox.ur.y.isGreaterThan(this.bbox.ur.y) && (this.bbox.ur.y = n.bbox.ur.y), this.polys.push(n);
		}
		this.isSubject = t;
	}
	getSweepEvents() {
		let e = [];
		for (let t = 0, n = this.polys.length; t < n; t++) {
			let n = this.polys[t].getSweepEvents();
			for (let t = 0, r = n.length; t < r; t++) e.push(n[t]);
		}
		return e;
	}
}, me = (e, ...t) => J.run("union", e, t);
V.set;
//#endregion
//#region node_modules/@turf/union/node_modules/@turf/helpers/dist/esm/index.js
var X = 6371008.8;
X * 100, X * 100, 360 / (2 * Math.PI), X * 3.28084, X * 39.37, X / 1e3, X / 1e3, X / 1609.344, X * 1e3, X * 1e3, X / 1852, X * 1.0936;
function he(e, t, n = {}) {
	let r = { type: "Feature" };
	return (n.id === 0 || n.id) && (r.id = n.id), n.bbox && (r.bbox = n.bbox), r.properties = t || {}, r.geometry = e, r;
}
function ge(e, t, n = {}) {
	for (let t of e) {
		if (t.length < 4) throw Error("Each LinearRing of a Polygon must have 4 or more Positions.");
		if (t[t.length - 1].length !== t[0].length) throw Error("First and last Position are not equivalent.");
		for (let e = 0; e < t[t.length - 1].length; e++) if (t[t.length - 1][e] !== t[0][e]) throw Error("First and last Position are not equivalent.");
	}
	return he({
		type: "Polygon",
		coordinates: e
	}, t, n);
}
function _e(e, t, n = {}) {
	return he({
		type: "MultiPolygon",
		coordinates: e
	}, t, n);
}
//#endregion
//#region node_modules/@turf/union/node_modules/@turf/meta/dist/esm/index.js
function ve(e, t) {
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
//#region node_modules/@turf/union/dist/esm/index.js
function ye(e, t = {}) {
	let n = [];
	if (ve(e, (e) => {
		n.push(e.coordinates);
	}), n.length < 2) throw Error("Must have at least 2 geometries");
	let r = me(n[0], ...n.slice(1));
	return r.length === 0 ? null : r.length === 1 ? ge(r[0], t.properties) : _e(r, t.properties);
}
var be = ye;
//#endregion
//#region node_modules/@turf/bbox/node_modules/@turf/meta/dist/esm/index.js
function xe(e, t, n) {
	if (e !== null) for (var r, i, a, o, s, c, l, u = 0, d = 0, f, p = e.type, m = p === "FeatureCollection", h = p === "Feature", g = m ? e.features.length : 1, _ = 0; _ < g; _++) {
		l = m ? e.features[_].geometry : h ? e.geometry : e, f = l ? l.type === "GeometryCollection" : !1, s = f ? l.geometries.length : 1;
		for (var v = 0; v < s; v++) {
			var y = 0, b = 0;
			if (o = f ? l.geometries[v] : l, o !== null) {
				c = o.coordinates;
				var x = o.type;
				switch (u = n && (x === "Polygon" || x === "MultiPolygon") ? 1 : 0, x) {
					case null: break;
					case "Point":
						if (t(c, d, _, y, b) === !1) return !1;
						d++, y++;
						break;
					case "LineString":
					case "MultiPoint":
						for (r = 0; r < c.length; r++) {
							if (t(c[r], d, _, y, b) === !1) return !1;
							d++, x === "MultiPoint" && y++;
						}
						x === "LineString" && y++;
						break;
					case "Polygon":
					case "MultiLineString":
						for (r = 0; r < c.length; r++) {
							for (i = 0; i < c[r].length - u; i++) {
								if (t(c[r][i], d, _, y, b) === !1) return !1;
								d++;
							}
							x === "MultiLineString" && y++, x === "Polygon" && b++;
						}
						x === "Polygon" && y++;
						break;
					case "MultiPolygon":
						for (r = 0; r < c.length; r++) {
							for (b = 0, i = 0; i < c[r].length; i++) {
								for (a = 0; a < c[r][i].length - u; a++) {
									if (t(c[r][i][a], d, _, y, b) === !1) return !1;
									d++;
								}
								b++;
							}
							y++;
						}
						break;
					case "GeometryCollection":
						for (r = 0; r < o.geometries.length; r++) if (xe(o.geometries[r], t, n) === !1) return !1;
						break;
					default: throw Error("Unknown Geometry Type");
				}
			}
		}
	}
}
//#endregion
//#region node_modules/@turf/bbox/dist/esm/index.js
function Se(e, t = {}) {
	if (e.bbox != null && !0 !== t.recompute) return e.bbox;
	let n = [
		Infinity,
		Infinity,
		-Infinity,
		-Infinity
	];
	return xe(e, (e) => {
		n[0] > e[0] && (n[0] = e[0]), n[1] > e[1] && (n[1] = e[1]), n[2] < e[0] && (n[2] = e[0]), n[3] < e[1] && (n[3] = e[1]);
	}), n;
}
var Z = Se, Q = 1e-6;
function Ce(e, t, n) {
	let r = Math.PI - 2 * Math.PI * t / 2 ** n, i = Math.PI - 2 * Math.PI * (t + 1) / 2 ** n, a = e / 2 ** n * 360 - 180, o = (e + 1) / 2 ** n * 360 - 180, s = (e) => Math.atan(Math.sinh(e)) * 180 / Math.PI;
	return [
		a,
		s(i),
		o,
		s(r)
	];
}
function we(e, t, n, r, i) {
	let a = (e, a) => [
		e[0] >= t,
		e[0] <= r,
		e[1] >= n,
		e[1] <= i
	][a], o = (e, a, o) => {
		let s = a[0] - e[0], c = a[1] - e[1];
		if (o === 0) {
			let n = (t - e[0]) / s;
			return [t, e[1] + n * c];
		}
		if (o === 1) {
			let t = (r - e[0]) / s;
			return [r, e[1] + t * c];
		}
		if (o === 2) {
			let t = (n - e[1]) / c;
			return [e[0] + t * s, n];
		}
		let l = (i - e[1]) / c;
		return [e[0] + l * s, i];
	}, s = e;
	for (let e = 0; e < 4; e++) {
		if (!s.length) return null;
		let t = s;
		s = [];
		for (let n = 0; n < t.length; n++) {
			let r = t[n], i = t[(n + t.length - 1) % t.length], c = a(r, e), l = a(i, e);
			c ? (l || s.push(o(i, r, e)), s.push(r)) : l && s.push(o(i, r, e));
		}
	}
	return s.length < 3 ? null : ((s[0][0] !== s[s.length - 1][0] || s[0][1] !== s[s.length - 1][1]) && s.push(s[0]), s);
}
function Te(e, t, n, r, i) {
	if (e.type === "Polygon") {
		let a = e.coordinates.map((e) => we(e, t, n, r, i)).filter(Boolean);
		return a.length ? {
			type: "Polygon",
			coordinates: a
		} : null;
	}
	if (e.type === "MultiPolygon") {
		let a = e.coordinates.map((e) => e.map((e) => we(e, t, n, r, i)).filter(Boolean)).filter((e) => e.length);
		return a.length ? {
			type: "MultiPolygon",
			coordinates: a
		} : null;
	}
	return e;
}
function Ee(e, t) {
	if (e === t || !e && !t) return !0;
	let n = Object.keys(e ?? {}), r = Object.keys(t ?? {});
	if (n.length !== r.length) return !1;
	for (let r of n) if (e[r] !== t[r]) return !1;
	return !0;
}
function $(e, t) {
	return typeof e[0] == "number" ? [
		e[0] + t,
		e[1],
		...e.slice(2)
	] : e.map((e) => $(e, t));
}
function De(e) {
	if (e.type === "GeometryCollection") return {
		type: "GeometryCollection",
		geometries: e.geometries.map(De)
	};
	let [t, , n] = Z({
		type: "Feature",
		properties: null,
		geometry: e
	});
	if (!Number.isFinite(t) || !Number.isFinite(n) || t <= 180 && n >= -180) return e;
	let r = Math.round((t + n) / 2 / 360);
	return r === 0 ? e : {
		...e,
		coordinates: $(e.coordinates, -r * 360)
	};
}
function Oe(e, t, n) {
	let i = t.map((e, t) => t), a = (e) => {
		for (; i[e] !== e;) i[e] = i[i[e]], e = i[e];
		return e;
	}, o = (e, t) => {
		let n = a(e), r = a(t);
		n !== r && (i[Math.max(n, r)] = Math.min(n, r));
	}, s = t.map((e, t) => e.touchesBorder ? t : -1).filter((e) => e >= 0);
	if (s.length > 1) {
		let i = s.map((n) => Z(e[t[n].index])), a = new r(i.length);
		for (let [e, t, n, r] of i) a.add(e, t, n, r);
		a.finish();
		for (let r = 0; r < s.length; r++) {
			let c = t[s[r]].index, [l, u, d, f] = i[r];
			for (let i of a.search(l - Q, u - Q, d + Q, f + Q)) {
				if (i <= r) continue;
				let a = t[s[i]].index;
				n[c] === n[a] && Ee(e[c].properties, e[a].properties) && o(s[r], s[i]);
			}
		}
	}
	let c = /* @__PURE__ */ new Map();
	for (let r = 0; r < t.length; r++) {
		let i = e[t[r].index], a = t[r].id === void 0 ? `=${JSON.stringify(i.properties ?? null)}` : `#${String(t[r].id)}`;
		if (a === "={}" || a === "=null") continue;
		let o = `${n[t[r].index]}|${a}`, s = c.get(o);
		s ? s.push(r) : c.set(o, [r]);
	}
	for (let e of c.values()) if (!(e.length < 2) && !(t[e[0]].id === void 0 && new Set(e.map((e) => t[e].tileKey)).size !== e.length)) for (let t = 1; t < e.length; t++) o(e[0], e[t]);
	let l = /* @__PURE__ */ new Map();
	for (let e = 0; e < t.length; e++) {
		let t = a(e), n = l.get(t);
		n ? n.push(e) : l.set(t, [e]);
	}
	for (let n of l.values()) {
		if (n.length < 2) continue;
		let r = be({
			type: "FeatureCollection",
			features: n.map((n) => e[t[n].index])
		}) ?? null;
		if (!r) continue;
		let i = t[n[0]].index;
		r.properties = e[i].properties, r.id = e[i].id, e[i] = r;
		for (let r of n.slice(1)) e[t[r].index] = null;
	}
}
function ke(e) {
	return Z(e).map((e) => e.toFixed(7)).join(",");
}
function Ae(e) {
	if (!e.length) return {
		type: "FeatureCollection",
		features: []
	};
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Set(), r = [], i = [], a = [];
	for (let o of e) {
		let e = {
			...o.feature,
			geometry: De(o.feature.geometry)
		}, s = o.tile ? `${o.tile.z}/${o.tile.x}/${o.tile.y}` : "";
		if (o.tile) {
			t.has(s) || t.set(s, Ce(o.tile.x, o.tile.y, o.tile.z));
			let [n, r, i, a] = t.get(s), c = Te(e.geometry, n, r, i, a);
			c && (e = {
				...e,
				geometry: c
			});
		}
		let c = o.id ?? e.id ?? JSON.stringify(e.properties ?? null), l = `${s}|${o.sourceLayer ?? ""}|${c}|${ke(e)}`;
		if (n.has(l)) continue;
		n.add(l);
		let u = i.push(e) - 1;
		if (a[u] = o.sourceLayer ?? "", o.tile) {
			let [n, i, a, c] = t.get(s), [l, d, f, p] = Z(e);
			r.push({
				index: u,
				tileKey: s,
				id: o.id ?? e.id,
				touchesBorder: l <= n + Q || f >= a - Q || d <= i + Q || p >= c - Q
			});
		}
	}
	return r.length > 1 && Oe(i, r, a), {
		type: "FeatureCollection",
		features: i.filter((e) => e !== null)
	};
}
//#endregion
export { Ae as t };
