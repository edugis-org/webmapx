//#region node_modules/@zip.js/zip.js/lib/core/constants.js
var e = 4294967295, t = 65535, n = 67324752, r = 134695760, i = r, a = 84233040, o = 33639248, s = 101010256, c = 101075792, l = 117853008, u = 39169, d = 21589, f = 28789, p = 25461, m = 6534, h = 30837, g = 30805, _ = 22613, v = 2048, y = 61440, b = 16384, x = 40960, S = 32768, ee = 2048, te = 1024, C = new Date(2107, 11, 31, 23, 59, 58), w = new Date(1980, 0, 1), ne = Infinity, T = "undefined", E = "function", D = "object", O = "string", k = new Uint8Array(), A = Symbol.asyncDispose || Symbol(), re = "filenameEncoding", ie = "commentEncoding", ae = "extractPrependedData", j = "extractAppendedData", oe = "password", se = "rawPassword", ce = "passThrough", M = "signal", le = "checkPasswordOnly", ue = "checkOverlappingEntryOnly", de = "checkOverlappingEntry", N = "checkAmbiguity", P = "checkLocalDirectory", F = "checkLocalFilename", fe = "checkCrc32", pe = "checkAuthenticationCode", me = "useWebWorkers", he = "useCompressionStream", ge = "transferStreams", _e = "preventClose", ve = "encryptionStrength", ye = "extendedTimestamp", be = "ntfsTimestamp", xe = "keepOrder", I = "level", L = "bufferedWrite", R = "createTempStream", Se = "dataDescriptorSignature", Ce = "useUnicodeFileNames", we = "dataDescriptor", Te = "supportZip64SplitFile", Ee = "encodeText", De = "offset", Oe = "usdz", ke = "unixExtraFieldType", Ae = "localExtraField", je = "centralExtraField", Me = "strictness", Ne = "filenameValidation", Pe = "normalizeFilename", Fe = "maxAppendedDataSize", Ie = "decryptCentralDirectory", Le = "signCentralDirectory", Re = "entry", ze = "filename", Be = "comment", Ve = "strict", He = "balanced", Ue = "tolerant", We = "compressed", Ge = "Invalid option (must be a function)", Ke = "Invalid signal (must be an AbortSignal instance)", qe = "Invalid password (password must be a string, rawPassword must be a Uint8Array)", Je = "Invalid passThrough option (must be a boolean or 'compressed')", Ye = "The operation was aborted", Xe = "AbortError";
function Ze(e) {
	if (e && typeof e != "function") throw Error(Ge);
	return e;
}
function Qe(e) {
	if (e && (typeof e.addEventListener != "function" || typeof e.aborted != "boolean")) throw Error(Ke);
	return e || void 0;
}
function $e(e) {
	if (e && e.aborted) throw e.reason === void 0 ? new DOMException(Ye, Xe) : e.reason;
}
function et(e, t) {
	if (e && typeof e != "string" || t && !(t instanceof Uint8Array)) throw Error(qe);
}
function tt(e) {
	if (e !== void 0 && typeof e != "boolean" && e !== "compressed") throw Error(Je);
	return e;
}
function nt(e, t, n) {
	if (!Number.isInteger(e) || e < 0 || e > t) throw Error(n);
}
function rt(e, t, n) {
	e !== void 0 && nt(e, t, n);
}
function it(e) {
	return typeof e == "string" && e.trim() ? Number(e) : e;
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/configuration.js
var at = 64 * 1024, ot = 64, st = 1, ct = "Invalid maxWorkers (must be an integer greater than 0)", lt = "Invalid baseURI (must be a string)", ut = "Invalid URI (must be a string or a function returning a string)", dt = 2;
try {
	typeof navigator < "u" && navigator.hardwareConcurrency && (dt = navigator.hardwareConcurrency);
} catch {}
var ft = {
	workerURI: "./core/web-worker-wasm.js",
	wasmURI: "./core/streams/zlib-wasm/zlib-streams.wasm",
	chunkSize: at,
	maxWorkers: dt,
	terminateWorkerTimeout: 5e3,
	workerStarvationTimeout: 5e3,
	workerStartupTimeout: 5e3,
	useWebWorkers: !0,
	useCompressionStream: !0,
	transferStreams: !0,
	CompressionStream: typeof CompressionStream < "u" && CompressionStream,
	DecompressionStream: typeof DecompressionStream < "u" && DecompressionStream
}, pt = "maxWorkers", mt = "baseURI", ht = ["wasmURI", "workerURI"], gt = [
	"useCompressionStream",
	"useWebWorkers",
	"transferStreams"
], _t = [
	"chunkSize",
	pt,
	"terminateWorkerTimeout",
	"workerStarvationTimeout",
	"workerStartupTimeout"
], vt = [
	"createWorker",
	"CompressionStream",
	"DecompressionStream",
	"CompressionStreamFallback",
	"DecompressionStreamFallback"
], yt = [
	mt,
	...ht,
	...gt,
	..._t,
	...vt
], bt = { ...ft };
function xt() {
	return bt;
}
function St(e) {
	return Ct(e.chunkSize);
}
function Ct(e) {
	return e = it(e), Number.isInteger(e) && e >= st ? Math.max(e, ot) : at;
}
function wt(e) {
	let t = {};
	for (let n of yt) {
		let r = e[n];
		r !== void 0 && (t[n] = Tt(n, r));
	}
	return t;
}
function Tt(e, t) {
	if (_t.includes(e)) {
		if (t = it(t), e == pt && (!Number.isInteger(t) || t < st)) throw Error(ct);
	} else if (vt.includes(e)) Ze(t);
	else if (e == mt) {
		if (t && typeof t != "string") throw Error(lt);
	} else if (ht.includes(e) && t && typeof t != "string" && typeof t != "function") throw Error(ut);
	return t;
}
function Et(e) {
	e ||= {};
	let { CompressionStreamZlib: t, DecompressionStreamZlib: n } = e;
	if (t === void 0 && n === void 0) return e;
	let r = Object.assign({}, e);
	return r.CompressionStreamFallback === void 0 && (r.CompressionStreamFallback = t), r.DecompressionStreamFallback === void 0 && (r.DecompressionStreamFallback = n), r;
}
function Dt(e) {
	let t = wt(Et(e));
	Object.assign(ft, t), Object.assign(bt, t);
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/codec-registry.js
var Ot = "Invalid codec module", kt = "Compression method not supported", At = /* @__PURE__ */ new Map(), jt = /* @__PURE__ */ new Map();
function Mt(e) {
	return At.get(e);
}
function Nt(e) {
	return jt.get(e);
}
function Pt(e, t) {
	let { CompressionStream: n, DecompressionStream: r } = t;
	if (typeof n != "function" && typeof r != "function") throw Error(Ot);
	jt.set(e, {
		CompressionStream: n,
		DecompressionStream: r
	});
}
async function Ft(e, t) {
	!jt.has(e) && t && Pt(e, await import(
		/* webpackIgnore: true */
		/* @vite-ignore */
		t
));
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/streams/codecs/crc32.js
var It = [
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[]
];
for (let e = 0; e < 256; e++) {
	let t = e;
	for (let e = 0; e < 8; e++) t = t & 1 ? t >>> 1 ^ 3988292384 : t >>> 1;
	It[0][e] = t;
}
for (let e = 0; e < 256; e++) for (let t = 1; t < 8; t++) {
	let n = It[t - 1][e];
	It[t][e] = n >>> 8 ^ It[0][n & 255];
}
var [Lt, Rt, zt, Bt, Vt, Ht, Ut, Wt] = It, Gt = class {
	constructor(e) {
		this.crc = e || -1;
	}
	append(e) {
		let t = this.crc | 0, n = e.length | 0, r = 0;
		if (n >= 8 && e.buffer) {
			let i = new DataView(e.buffer, e.byteOffset, n), a = n - 8;
			for (; r <= a; r += 8) {
				let e = t ^ i.getInt32(r, !0), n = i.getInt32(r + 4, !0);
				t = Wt[e & 255] ^ Ut[e >>> 8 & 255] ^ Ht[e >>> 16 & 255] ^ Vt[e >>> 24 & 255] ^ Bt[n & 255] ^ zt[n >>> 8 & 255] ^ Rt[n >>> 16 & 255] ^ Lt[n >>> 24 & 255];
			}
		}
		for (; r < n; r++) t = t >>> 8 ^ Lt[(t ^ e[r]) & 255];
		this.crc = t;
	}
	get() {
		return ~this.crc;
	}
}, Kt = class extends TransformStream {
	constructor() {
		let e, t = new Gt();
		super({
			transform(e, n) {
				t.append(e), n.enqueue(e);
			},
			flush() {
				let n = new Uint8Array(4);
				new DataView(n.buffer).setUint32(0, t.get()), e.value = n;
			}
		}), e = this;
	}
};
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/util/encode-text.js
function qt(e) {
	if (typeof TextEncoder > "u") {
		e = unescape(encodeURIComponent(e));
		let t = new Uint8Array(e.length);
		for (let n = 0; n < t.length; n++) t[n] = e.charCodeAt(n);
		return t;
	} else return new TextEncoder().encode(e);
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/util/array.js
function Jt(e, t) {
	let n = new Uint8Array(e.length + t.length);
	return n.set(e), n.set(t, e.length), n;
}
function Yt(e) {
	return e.byteOffset || e.byteLength != e.buffer.byteLength ? new Uint8Array(e) : e;
}
function z(e) {
	return new DataView(e.buffer, e.byteOffset, e.byteLength);
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/streams/codecs/aes-hmac-sha1.js
var Xt = 16, Zt = 60, B = 64, Qt = 20, $t = 16, en = 56, tn = new Uint8Array([128]), nn = new Uint8Array(1), rn = new Int32Array([
	1732584193,
	4023233417,
	2562383102,
	271733878,
	3285377520
]), an = 54, on = 92, V = new Uint8Array(256), H = new Int32Array(256), U = new Int32Array(256), W = new Int32Array(256), G = new Int32Array(256), sn = !1;
function cn(e, t) {
	fn();
	let n = new Int32Array(Zt), r = pn(e, n), i = new Int32Array(Xt / 4), a = un(t), o = 0, s = 0, c = 0, l = 0;
	return {
		process(e, t) {
			t && a.update(e, 0, e.length), u(e), t || a.update(e, 0, e.length);
		},
		digest() {
			return a.digest();
		}
	};
	function u(e) {
		let t = new DataView(e.buffer, e.byteOffset, e.byteLength), n = e.length, r = 0;
		for (; r + Xt <= n; r += Xt) d(), t.setInt32(r, t.getInt32(r) ^ i[0]), t.setInt32(r + 4, t.getInt32(r + 4) ^ i[1]), t.setInt32(r + 8, t.getInt32(r + 8) ^ i[2]), t.setInt32(r + 12, t.getInt32(r + 12) ^ i[3]);
		if (r < n) {
			d();
			for (let t = 0; r < n; r++, t++) e[r] ^= i[t >> 2] >>> 24 - 8 * (t & 3);
		}
	}
	function d() {
		o = o + 1 | 0, o || (s = s + 1 | 0, s || (c = c + 1 | 0, c || (l = l + 1 | 0)));
		let e = hn(o) ^ n[0], t = hn(s) ^ n[1], a = hn(c) ^ n[2], u = hn(l) ^ n[3], d = H[e >>> 24] ^ U[t >>> 16 & 255] ^ W[a >>> 8 & 255] ^ G[u & 255] ^ n[4], f = H[t >>> 24] ^ U[a >>> 16 & 255] ^ W[u >>> 8 & 255] ^ G[e & 255] ^ n[5], p = H[a >>> 24] ^ U[u >>> 16 & 255] ^ W[e >>> 8 & 255] ^ G[t & 255] ^ n[6], m = H[u >>> 24] ^ U[e >>> 16 & 255] ^ W[t >>> 8 & 255] ^ G[a & 255] ^ n[7];
		e = H[d >>> 24] ^ U[f >>> 16 & 255] ^ W[p >>> 8 & 255] ^ G[m & 255] ^ n[8], t = H[f >>> 24] ^ U[p >>> 16 & 255] ^ W[m >>> 8 & 255] ^ G[d & 255] ^ n[9], a = H[p >>> 24] ^ U[m >>> 16 & 255] ^ W[d >>> 8 & 255] ^ G[f & 255] ^ n[10], u = H[m >>> 24] ^ U[d >>> 16 & 255] ^ W[f >>> 8 & 255] ^ G[p & 255] ^ n[11], d = H[e >>> 24] ^ U[t >>> 16 & 255] ^ W[a >>> 8 & 255] ^ G[u & 255] ^ n[12], f = H[t >>> 24] ^ U[a >>> 16 & 255] ^ W[u >>> 8 & 255] ^ G[e & 255] ^ n[13], p = H[a >>> 24] ^ U[u >>> 16 & 255] ^ W[e >>> 8 & 255] ^ G[t & 255] ^ n[14], m = H[u >>> 24] ^ U[e >>> 16 & 255] ^ W[t >>> 8 & 255] ^ G[a & 255] ^ n[15], e = H[d >>> 24] ^ U[f >>> 16 & 255] ^ W[p >>> 8 & 255] ^ G[m & 255] ^ n[16], t = H[f >>> 24] ^ U[p >>> 16 & 255] ^ W[m >>> 8 & 255] ^ G[d & 255] ^ n[17], a = H[p >>> 24] ^ U[m >>> 16 & 255] ^ W[d >>> 8 & 255] ^ G[f & 255] ^ n[18], u = H[m >>> 24] ^ U[d >>> 16 & 255] ^ W[f >>> 8 & 255] ^ G[p & 255] ^ n[19], d = H[e >>> 24] ^ U[t >>> 16 & 255] ^ W[a >>> 8 & 255] ^ G[u & 255] ^ n[20], f = H[t >>> 24] ^ U[a >>> 16 & 255] ^ W[u >>> 8 & 255] ^ G[e & 255] ^ n[21], p = H[a >>> 24] ^ U[u >>> 16 & 255] ^ W[e >>> 8 & 255] ^ G[t & 255] ^ n[22], m = H[u >>> 24] ^ U[e >>> 16 & 255] ^ W[t >>> 8 & 255] ^ G[a & 255] ^ n[23], e = H[d >>> 24] ^ U[f >>> 16 & 255] ^ W[p >>> 8 & 255] ^ G[m & 255] ^ n[24], t = H[f >>> 24] ^ U[p >>> 16 & 255] ^ W[m >>> 8 & 255] ^ G[d & 255] ^ n[25], a = H[p >>> 24] ^ U[m >>> 16 & 255] ^ W[d >>> 8 & 255] ^ G[f & 255] ^ n[26], u = H[m >>> 24] ^ U[d >>> 16 & 255] ^ W[f >>> 8 & 255] ^ G[p & 255] ^ n[27], d = H[e >>> 24] ^ U[t >>> 16 & 255] ^ W[a >>> 8 & 255] ^ G[u & 255] ^ n[28], f = H[t >>> 24] ^ U[a >>> 16 & 255] ^ W[u >>> 8 & 255] ^ G[e & 255] ^ n[29], p = H[a >>> 24] ^ U[u >>> 16 & 255] ^ W[e >>> 8 & 255] ^ G[t & 255] ^ n[30], m = H[u >>> 24] ^ U[e >>> 16 & 255] ^ W[t >>> 8 & 255] ^ G[a & 255] ^ n[31], e = H[d >>> 24] ^ U[f >>> 16 & 255] ^ W[p >>> 8 & 255] ^ G[m & 255] ^ n[32], t = H[f >>> 24] ^ U[p >>> 16 & 255] ^ W[m >>> 8 & 255] ^ G[d & 255] ^ n[33], a = H[p >>> 24] ^ U[m >>> 16 & 255] ^ W[d >>> 8 & 255] ^ G[f & 255] ^ n[34], u = H[m >>> 24] ^ U[d >>> 16 & 255] ^ W[f >>> 8 & 255] ^ G[p & 255] ^ n[35], d = H[e >>> 24] ^ U[t >>> 16 & 255] ^ W[a >>> 8 & 255] ^ G[u & 255] ^ n[36], f = H[t >>> 24] ^ U[a >>> 16 & 255] ^ W[u >>> 8 & 255] ^ G[e & 255] ^ n[37], p = H[a >>> 24] ^ U[u >>> 16 & 255] ^ W[e >>> 8 & 255] ^ G[t & 255] ^ n[38], m = H[u >>> 24] ^ U[e >>> 16 & 255] ^ W[t >>> 8 & 255] ^ G[a & 255] ^ n[39];
		let h = 40;
		r > 10 && (e = H[d >>> 24] ^ U[f >>> 16 & 255] ^ W[p >>> 8 & 255] ^ G[m & 255] ^ n[40], t = H[f >>> 24] ^ U[p >>> 16 & 255] ^ W[m >>> 8 & 255] ^ G[d & 255] ^ n[41], a = H[p >>> 24] ^ U[m >>> 16 & 255] ^ W[d >>> 8 & 255] ^ G[f & 255] ^ n[42], u = H[m >>> 24] ^ U[d >>> 16 & 255] ^ W[f >>> 8 & 255] ^ G[p & 255] ^ n[43], d = H[e >>> 24] ^ U[t >>> 16 & 255] ^ W[a >>> 8 & 255] ^ G[u & 255] ^ n[44], f = H[t >>> 24] ^ U[a >>> 16 & 255] ^ W[u >>> 8 & 255] ^ G[e & 255] ^ n[45], p = H[a >>> 24] ^ U[u >>> 16 & 255] ^ W[e >>> 8 & 255] ^ G[t & 255] ^ n[46], m = H[u >>> 24] ^ U[e >>> 16 & 255] ^ W[t >>> 8 & 255] ^ G[a & 255] ^ n[47], h = 48), r > 12 && (e = H[d >>> 24] ^ U[f >>> 16 & 255] ^ W[p >>> 8 & 255] ^ G[m & 255] ^ n[48], t = H[f >>> 24] ^ U[p >>> 16 & 255] ^ W[m >>> 8 & 255] ^ G[d & 255] ^ n[49], a = H[p >>> 24] ^ U[m >>> 16 & 255] ^ W[d >>> 8 & 255] ^ G[f & 255] ^ n[50], u = H[m >>> 24] ^ U[d >>> 16 & 255] ^ W[f >>> 8 & 255] ^ G[p & 255] ^ n[51], d = H[e >>> 24] ^ U[t >>> 16 & 255] ^ W[a >>> 8 & 255] ^ G[u & 255] ^ n[52], f = H[t >>> 24] ^ U[a >>> 16 & 255] ^ W[u >>> 8 & 255] ^ G[e & 255] ^ n[53], p = H[a >>> 24] ^ U[u >>> 16 & 255] ^ W[e >>> 8 & 255] ^ G[t & 255] ^ n[54], m = H[u >>> 24] ^ U[e >>> 16 & 255] ^ W[t >>> 8 & 255] ^ G[a & 255] ^ n[55], h = 56), i[0] = (V[d >>> 24] << 24 | V[f >>> 16 & 255] << 16 | V[p >>> 8 & 255] << 8 | V[m & 255]) ^ n[h], i[1] = (V[f >>> 24] << 24 | V[p >>> 16 & 255] << 16 | V[m >>> 8 & 255] << 8 | V[d & 255]) ^ n[h + 1], i[2] = (V[p >>> 24] << 24 | V[m >>> 16 & 255] << 16 | V[d >>> 8 & 255] << 8 | V[f & 255]) ^ n[h + 2], i[3] = (V[m >>> 24] << 24 | V[d >>> 16 & 255] << 16 | V[f >>> 8 & 255] << 8 | V[p & 255]) ^ n[h + 3];
	}
}
function ln(e, t, n, r) {
	let i = un(e), a = new Uint8Array(r), o = new Uint8Array(t.length + 4), s = new DataView(o.buffer);
	o.set(t);
	for (let e = 1, c = 0; c < r; e++, c += Qt) {
		s.setUint32(t.length, e), i.update(o, 0, o.length);
		let l = i.digest(), u = l.slice();
		for (let e = 1; e < n; e++) {
			i.update(l, 0, Qt), l = i.digest();
			for (let e = 0; e < Qt; e++) u[e] ^= l[e];
		}
		a.set(u.subarray(0, Math.min(Qt, r - c)), c);
	}
	return a;
}
function un(e) {
	let t = dn(), n = new Uint8Array(B), r = new Uint8Array(B);
	e.length > B && (t.update(e, 0, e.length), e = t.digest());
	for (let t = 0; t < B; t++) {
		let i = t < e.length ? e[t] : 0;
		n[t] = i ^ an, r[t] = i ^ on;
	}
	return t.update(n, 0, B), {
		update(e, n, r) {
			t.update(e, n, r);
		},
		digest() {
			let e = t.digest();
			t.update(r, 0, B), t.update(e, 0, Qt);
			let i = t.digest();
			return t.update(n, 0, B), i;
		}
	};
}
function dn() {
	let e = new Int32Array(rn), t = new Int32Array($t), n = new Uint8Array(B), r = new DataView(n.buffer), i = new Uint8Array(8), a = 0, o = 0;
	return {
		update: s,
		digest: c
	};
	function s(e, t, i) {
		let s = t + i;
		if (o += i, a) {
			for (; t < s && a < B;) n[a++] = e[t++];
			a == B && (l(r, 0), a = 0);
		}
		if (t + B <= s) {
			let n = new DataView(e.buffer, e.byteOffset, e.byteLength);
			for (; t + B <= s; t += B) l(n, t);
		}
		for (; t < s;) n[a++] = e[t++];
	}
	function c() {
		let t = o * 8, n = Math.floor(t / 4294967296), r = t >>> 0;
		for (s(tn, 0, 1); a != en;) s(nn, 0, 1);
		i[0] = n >>> 24, i[1] = n >>> 16, i[2] = n >>> 8, i[3] = n, i[4] = r >>> 24, i[5] = r >>> 16, i[6] = r >>> 8, i[7] = r, s(i, 0, 8);
		let c = new Uint8Array(Qt), l = new DataView(c.buffer);
		for (let t = 0; t < e.length; t++) l.setInt32(4 * t, e[t]);
		return e.set(rn), a = 0, o = 0, c;
	}
	function l(n, r) {
		for (let e = 0; e < 16; e++) t[e] = n.getInt32(r + 4 * e);
		let i = e[0], a = e[1], o = e[2], s = e[3], c = e[4], l;
		for (let e = 0; e < 15; e += 5) c = (i << 5 | i >>> 27) + ((o ^ s) & a ^ s) + c + 1518500249 + t[e] | 0, a = a << 30 | a >>> 2, s = (c << 5 | c >>> 27) + ((a ^ o) & i ^ o) + s + 1518500249 + t[e + 1] | 0, i = i << 30 | i >>> 2, o = (s << 5 | s >>> 27) + ((i ^ a) & c ^ a) + o + 1518500249 + t[e + 2] | 0, c = c << 30 | c >>> 2, a = (o << 5 | o >>> 27) + ((c ^ i) & s ^ i) + a + 1518500249 + t[e + 3] | 0, s = s << 30 | s >>> 2, i = (a << 5 | a >>> 27) + ((s ^ c) & o ^ c) + i + 1518500249 + t[e + 4] | 0, o = o << 30 | o >>> 2;
		c = (i << 5 | i >>> 27) + ((o ^ s) & a ^ s) + c + 1518500249 + t[15] | 0, a = a << 30 | a >>> 2, l = t[13] ^ t[8] ^ t[2] ^ t[0], l = l << 1 | l >>> 31, t[0] = l, s = (c << 5 | c >>> 27) + ((a ^ o) & i ^ o) + s + 1518500249 + l | 0, i = i << 30 | i >>> 2, l = t[14] ^ t[9] ^ t[3] ^ t[1], l = l << 1 | l >>> 31, t[1] = l, o = (s << 5 | s >>> 27) + ((i ^ a) & c ^ a) + o + 1518500249 + l | 0, c = c << 30 | c >>> 2, l = t[15] ^ t[10] ^ t[4] ^ t[2], l = l << 1 | l >>> 31, t[2] = l, a = (o << 5 | o >>> 27) + ((c ^ i) & s ^ i) + a + 1518500249 + l | 0, s = s << 30 | s >>> 2, l = t[0] ^ t[11] ^ t[5] ^ t[3], l = l << 1 | l >>> 31, t[3] = l, i = (a << 5 | a >>> 27) + ((s ^ c) & o ^ c) + i + 1518500249 + l | 0, o = o << 30 | o >>> 2;
		for (let e = 20; e < 40; e += 5) l = t[e - 3 & 15] ^ t[e - 8 & 15] ^ t[e - 14 & 15] ^ t[e & 15], l = l << 1 | l >>> 31, t[e & 15] = l, c = (i << 5 | i >>> 27) + (a ^ o ^ s) + c + 1859775393 + l | 0, a = a << 30 | a >>> 2, l = t[e - 2 & 15] ^ t[e - 7 & 15] ^ t[e - 13 & 15] ^ t[e + 1 & 15], l = l << 1 | l >>> 31, t[e + 1 & 15] = l, s = (c << 5 | c >>> 27) + (i ^ a ^ o) + s + 1859775393 + l | 0, i = i << 30 | i >>> 2, l = t[e - 1 & 15] ^ t[e - 6 & 15] ^ t[e - 12 & 15] ^ t[e + 2 & 15], l = l << 1 | l >>> 31, t[e + 2 & 15] = l, o = (s << 5 | s >>> 27) + (c ^ i ^ a) + o + 1859775393 + l | 0, c = c << 30 | c >>> 2, l = t[e & 15] ^ t[e - 5 & 15] ^ t[e - 11 & 15] ^ t[e + 3 & 15], l = l << 1 | l >>> 31, t[e + 3 & 15] = l, a = (o << 5 | o >>> 27) + (s ^ c ^ i) + a + 1859775393 + l | 0, s = s << 30 | s >>> 2, l = t[e + 1 & 15] ^ t[e - 4 & 15] ^ t[e - 10 & 15] ^ t[e + 4 & 15], l = l << 1 | l >>> 31, t[e + 4 & 15] = l, i = (a << 5 | a >>> 27) + (o ^ s ^ c) + i + 1859775393 + l | 0, o = o << 30 | o >>> 2;
		for (let e = 40; e < 60; e += 5) l = t[e - 3 & 15] ^ t[e - 8 & 15] ^ t[e - 14 & 15] ^ t[e & 15], l = l << 1 | l >>> 31, t[e & 15] = l, c = (i << 5 | i >>> 27) + (a & o | (a | o) & s) + c + 2400959708 + l | 0, a = a << 30 | a >>> 2, l = t[e - 2 & 15] ^ t[e - 7 & 15] ^ t[e - 13 & 15] ^ t[e + 1 & 15], l = l << 1 | l >>> 31, t[e + 1 & 15] = l, s = (c << 5 | c >>> 27) + (i & a | (i | a) & o) + s + 2400959708 + l | 0, i = i << 30 | i >>> 2, l = t[e - 1 & 15] ^ t[e - 6 & 15] ^ t[e - 12 & 15] ^ t[e + 2 & 15], l = l << 1 | l >>> 31, t[e + 2 & 15] = l, o = (s << 5 | s >>> 27) + (c & i | (c | i) & a) + o + 2400959708 + l | 0, c = c << 30 | c >>> 2, l = t[e & 15] ^ t[e - 5 & 15] ^ t[e - 11 & 15] ^ t[e + 3 & 15], l = l << 1 | l >>> 31, t[e + 3 & 15] = l, a = (o << 5 | o >>> 27) + (s & c | (s | c) & i) + a + 2400959708 + l | 0, s = s << 30 | s >>> 2, l = t[e + 1 & 15] ^ t[e - 4 & 15] ^ t[e - 10 & 15] ^ t[e + 4 & 15], l = l << 1 | l >>> 31, t[e + 4 & 15] = l, i = (a << 5 | a >>> 27) + (o & s | (o | s) & c) + i + 2400959708 + l | 0, o = o << 30 | o >>> 2;
		for (let e = 60; e < 80; e += 5) l = t[e - 3 & 15] ^ t[e - 8 & 15] ^ t[e - 14 & 15] ^ t[e & 15], l = l << 1 | l >>> 31, t[e & 15] = l, c = (i << 5 | i >>> 27) + (a ^ o ^ s) + c + 3395469782 + l | 0, a = a << 30 | a >>> 2, l = t[e - 2 & 15] ^ t[e - 7 & 15] ^ t[e - 13 & 15] ^ t[e + 1 & 15], l = l << 1 | l >>> 31, t[e + 1 & 15] = l, s = (c << 5 | c >>> 27) + (i ^ a ^ o) + s + 3395469782 + l | 0, i = i << 30 | i >>> 2, l = t[e - 1 & 15] ^ t[e - 6 & 15] ^ t[e - 12 & 15] ^ t[e + 2 & 15], l = l << 1 | l >>> 31, t[e + 2 & 15] = l, o = (s << 5 | s >>> 27) + (c ^ i ^ a) + o + 3395469782 + l | 0, c = c << 30 | c >>> 2, l = t[e & 15] ^ t[e - 5 & 15] ^ t[e - 11 & 15] ^ t[e + 3 & 15], l = l << 1 | l >>> 31, t[e + 3 & 15] = l, a = (o << 5 | o >>> 27) + (s ^ c ^ i) + a + 3395469782 + l | 0, s = s << 30 | s >>> 2, l = t[e + 1 & 15] ^ t[e - 4 & 15] ^ t[e - 10 & 15] ^ t[e + 4 & 15], l = l << 1 | l >>> 31, t[e + 4 & 15] = l, i = (a << 5 | a >>> 27) + (o ^ s ^ c) + i + 3395469782 + l | 0, o = o << 30 | o >>> 2;
		e[0] = e[0] + i | 0, e[1] = e[1] + a | 0, e[2] = e[2] + o | 0, e[3] = e[3] + s | 0, e[4] = e[4] + c | 0;
	}
}
function fn() {
	if (!sn) {
		let e = 1, t = 1;
		do
			e = (e ^ e << 1 ^ (e & 128 ? 27 : 0)) & 255, t = (t ^ t << 1) & 255, t = (t ^ t << 2) & 255, t = (t ^ t << 4) & 255, t & 128 && (t ^= 9), V[e] = (t ^ (t << 1 | t >> 7) ^ (t << 2 | t >> 6) ^ (t << 3 | t >> 5) ^ (t << 4 | t >> 4) ^ 99) & 255;
		while (e != 1);
		V[0] = 99;
		for (let e = 0; e < 256; e++) {
			let t = V[e], n = gn(t), r = n << 24 | t << 16 | t << 8 | n ^ t;
			H[e] = r, U[e] = r >>> 8 | r << 24, W[e] = r >>> 16 | r << 16, G[e] = r >>> 24 | r << 8;
		}
		sn = !0;
	}
}
function pn(e, t) {
	let n = e.length >> 2, r = n + 6, i = 4 * (r + 1), a = 1;
	for (let r = 0; r < n; r++) t[r] = e[4 * r] << 24 | e[4 * r + 1] << 16 | e[4 * r + 2] << 8 | e[4 * r + 3];
	for (let e = n; e < i; e++) {
		let r = t[e - 1];
		e % n == 0 ? (r = mn(r << 8 | r >>> 24) ^ a << 24, a = gn(a)) : n > 6 && e % n == 4 && (r = mn(r)), t[e] = t[e - n] ^ r;
	}
	return r;
}
function mn(e) {
	return V[e >>> 24] << 24 | V[e >>> 16 & 255] << 16 | V[e >>> 8 & 255] << 8 | V[e & 255];
}
function hn(e) {
	return e << 24 | (e & 65280) << 8 | e >>> 8 & 65280 | e >>> 24;
}
function gn(e) {
	return (e << 1 ^ (e >> 7) * 27) & 255;
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/streams/common-crypto.js
var _n = typeof crypto < "u" && typeof crypto.getRandomValues == "function", vn = "Invalid password", yn = "Invalid authentication code", bn = "zipjs-abort-check-password", xn = "Crypto API not supported";
function Sn(e) {
	if (_n) return crypto.getRandomValues(e);
	throw Error(xn);
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/streams/aes-crypto-stream.js
var Cn = 16, wn = "raw", Tn = { name: "PBKDF2" }, En = { name: "HMAC" }, Dn = "SHA-1", On = 1e3, kn = Object.assign({ hash: En }, Tn), An = Object.assign({
	iterations: On,
	hash: { name: Dn }
}, Tn), jn = ["deriveBits"], Mn = [
	8,
	12,
	16
], Nn = [
	16,
	24,
	32
], Pn = 10, Fn = 2, In = typeof crypto != T, Ln = In && crypto.subtle, Rn = In && Ln !== void 0 && typeof Ln.importKey == "function" && typeof Ln.deriveBits == "function", zn = cn, Bn = class extends TransformStream {
	constructor({ password: e, rawPassword: t, encryptionStrength: n, checkPasswordOnly: r, checkAuthenticationCode: i = !0 }) {
		let a = {};
		super({
			start() {
				Un(a, e, t, n);
			},
			async transform(e, t) {
				let { password: n, strength: i, resolveReady: o, ready: s } = a;
				if (n ? (await Kn(a, i, n, K(e, 0, Mn[i] + Fn)), e = K(e, Mn[i] + Fn), r ? (qn(a), t.error(Error(bn))) : o()) : await s, a.discarded) return;
				let c = new Uint8Array(e.length - Pn - (e.length - Pn) % Cn);
				t.enqueue(Gn(a, e, c, 0, Pn, !0));
			},
			async flush(e) {
				let { engine: t, pendingInput: n, ready: r } = a;
				if (t) {
					if (await r, a.discarded) return;
					let o = K(n, n.length - Pn), s = new Uint8Array(K(n, 0, n.length - Pn));
					t.process(s, !0);
					let c = t.digest(), l = +(n.length < Pn);
					for (let e = 0; e < Pn; e++) l |= c[e] ^ o[e];
					if (l && i) {
						e.error(Error(yn));
						return;
					}
					e.enqueue(s);
				}
			}
		}), Wn(this, a);
	}
}, Vn = class extends TransformStream {
	constructor({ password: e, rawPassword: t, encryptionStrength: n }) {
		let r = {};
		super({
			start() {
				Un(r, e, t, n);
			},
			async transform(e, t) {
				let { password: n, strength: i, resolveReady: a, ready: o } = r, s = k;
				if (n ? (s = await Jn(r, i, n), a()) : await o, r.discarded) return;
				let c = new Uint8Array(s.length + e.length - e.length % Cn);
				c.set(s, 0), t.enqueue(Gn(r, e, c, s.length, 0, !1));
			},
			async flush(e) {
				let { engine: t, pendingInput: n, ready: i } = r;
				if (t) {
					if (await i, r.discarded) return;
					let a = new Uint8Array(n);
					t.process(a, !1);
					let o = K(t.digest(), 0, Pn);
					e.enqueue(Jt(a, o));
				}
			}
		}), Wn(this, r);
	}
};
function Hn(e) {
	zn = e || cn;
}
function Un(e, t, n, r) {
	Object.assign(e, {
		ready: new Promise((t) => e.resolveReady = t),
		password: Zn(t, n),
		strength: r - 1,
		pendingInput: k,
		discarded: !1
	});
}
function Wn(e, t) {
	let n = e.readable.getReader(), r = new ReadableStream({
		async pull(e) {
			try {
				let { value: t, done: r } = await n.read();
				r ? e.close() : e.enqueue(t);
			} catch (e) {
				throw qn(t), n.cancel(e).catch(() => {}), e;
			}
		},
		cancel(e) {
			return qn(t), n.cancel(e);
		}
	});
	Object.defineProperty(e, "readable", { get() {
		return r;
	} });
}
function Gn(e, t, n, r, i, a) {
	let { engine: o, pendingInput: s } = e;
	s.length && (t = Jt(s, t));
	let c = t.length - i, l = c - c % Cn;
	if (n = Qn(n, r + l), l) {
		let e = K(n, r, r + l);
		e.set(K(t, 0, l)), o.process(e, a);
	}
	return e.pendingInput = K(t, l), n;
}
async function Kn(e, t, n, r) {
	let i = await Yn(e, t, n, K(r, 0, Mn[t])), a = K(r, Mn[t]);
	if (i[0] != a[0] || i[1] != a[1]) throw qn(e), Error(vn);
}
function qn(e) {
	let { engine: t } = e;
	e.discarded = !0, t && t.dispose && t.dispose();
}
async function Jn(e, t, n) {
	let r = Sn(new Uint8Array(Mn[t]));
	return Jt(r, await Yn(e, t, n, r));
}
async function Yn(e, t, n, r) {
	e.password = null;
	let i = Nn[t], a = await Xn(n, r, i * 2 + Fn);
	return e.engine = zn(K(a, 0, i), K(a, i, i * 2)), e.discarded && qn(e), K(a, i * 2);
}
async function Xn(e, t, n) {
	if (Rn) try {
		let r = await Ln.importKey(wn, e, kn, !1, jn);
		return new Uint8Array(await Ln.deriveBits(Object.assign({ salt: t }, An), r, n * 8));
	} catch {
		Rn = !1;
	}
	return ln(e, t, On, n);
}
function Zn(e, t) {
	return t === void 0 ? qt(e) : t;
}
function Qn(e, t) {
	if (t && t > e.length) {
		let n = e;
		e = new Uint8Array(t), e.set(n, 0);
	}
	return e;
}
function K(e, t, n) {
	return e.subarray(t, n);
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/streams/zip-crypto-stream.js
var $n = 12, er = class extends TransformStream {
	constructor({ password: e, rawPassword: t, passwordVerification: n, checkPasswordOnly: r }) {
		super({
			start() {
				nr(this, e, t, n);
			},
			transform(e, t) {
				let n = this;
				if (n.password || n.rawPassword) {
					let t = rr(n, e.subarray(0, $n));
					if (n.password = n.rawPassword = null, (t[$n - 1] ^ n.passwordVerification) != 0) throw Error(vn);
					e = e.subarray($n);
				}
				r ? t.error(Error(bn)) : t.enqueue(rr(n, e));
			}
		});
	}
}, tr = class extends TransformStream {
	constructor({ password: e, rawPassword: t, passwordVerification: n }) {
		super({
			start() {
				nr(this, e, t, n);
			},
			transform(e, t) {
				let n = this, r, i;
				if (n.password || n.rawPassword) {
					n.password = n.rawPassword = null;
					let t = Sn(new Uint8Array($n));
					t[$n - 1] = n.passwordVerification, r = new Uint8Array(e.length + t.length), r.set(ir(n, t), 0), i = $n;
				} else r = new Uint8Array(e.length), i = 0;
				r.set(ir(n, e), i), t.enqueue(r);
			}
		});
	}
};
function nr(e, t, n, r) {
	Object.assign(e, {
		password: t,
		rawPassword: n,
		passwordVerification: r
	}), ar(e, t, n);
}
function rr(e, t) {
	let n = new Uint8Array(t.length);
	for (let r = 0; r < t.length; r++) n[r] = sr(e) ^ t[r], or(e, n[r]);
	return n;
}
function ir(e, t) {
	let n = new Uint8Array(t.length);
	for (let r = 0; r < t.length; r++) n[r] = sr(e) ^ t[r], or(e, t[r]);
	return n;
}
function ar(e, t, n) {
	let r = [
		305419896,
		591751049,
		878082192
	];
	if (Object.assign(e, {
		cryptoKeys: r,
		crcKey0: new Gt(r[0]),
		crcKey2: new Gt(r[2])
	}), n) for (let t = 0; t < n.length; t++) or(e, n[t]);
	else for (let n = 0; n < t.length; n++) or(e, t.charCodeAt(n));
}
function or(e, t) {
	let [, n] = e.cryptoKeys;
	e.crcKey0.append([t]);
	let r = ~e.crcKey0.get();
	n = lr(Math.imul(lr(n + cr(r)), 134775813) + 1), e.crcKey2.append([n >>> 24]);
	let i = ~e.crcKey2.get();
	e.cryptoKeys = [
		r,
		n,
		i
	];
}
function sr(e) {
	let t = e.cryptoKeys[2] | 2;
	return cr(Math.imul(t, t ^ 1) >>> 8);
}
function cr(e) {
	return e & 255;
}
function lr(e) {
	return e & 4294967295;
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/util/compatible-streams.js
function ur(e) {
	if (e instanceof ReadableStream) return e;
	let t = e.getReader();
	return new ReadableStream({
		async pull(e) {
			try {
				let { value: n, done: r } = await t.read();
				r ? e.close() : e.enqueue(n);
			} catch (e) {
				throw t.cancel(e).catch(() => {}), e;
			}
		},
		cancel(e) {
			return t.cancel(e);
		}
	});
}
function dr(e, t) {
	e = ur(e);
	let n = t ? { type: t } : {};
	if (fr()) return new Response(e).blob().then((e) => t ? new Blob([e], n) : e);
	let r = [];
	return e.pipeTo(new WritableStream({ write(e) {
		r.push(e);
	} })).then(() => new Blob(r, n));
}
function fr() {
	return typeof Blob.prototype.stream != "function" || new Blob([]).stream() instanceof ReadableStream;
}
function pr(e) {
	if (e instanceof WritableStream) return e;
	let t = e.getWriter();
	return new WritableStream({
		write(e) {
			return t.write(e);
		},
		close() {
			return t.close();
		},
		abort(e) {
			return t.abort(e);
		}
	});
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/util/error.js
function mr(e) {
	return !!e && typeof e == "object";
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/streams/zip-entry-stream.js
var hr = "Invalid uncompressed size", gr = "Invalid compressed data", _r = "Codec out of memory", vr = "Invalid CRC32", yr = "Z_MEM_ERROR", br = "deflate-raw", xr = "deflate64-raw", Sr = "gzip", Cr = 10, wr = 8, Tr = [
	31,
	139,
	8
], Er = class extends TransformStream {
	constructor(e, { chunkSize: t, CompressionStreamFallback: n, CompressionStream: r }) {
		super({});
		let { compressed: i, encrypted: a, useCompressionStream: o, zipCrypto: s, computeCrc32: c, level: l, deflate64: u, format: d, compressionMethod: f, inputSize: p } = e, m = this, h, g, _, v = super.readable, y = d && Nt(d), b = Ir(o, r, n), x = c && i && !u && !y && (!a || s) && !!b;
		if ((!a || s) && c && !x && (h = new Kt(), v = Rr(v, h)), i) if (y) v = zr(v, Fr(y.CompressionStream, d, {
			level: l,
			chunkSize: t,
			compressionMethod: f,
			uncompressedSize: p
		}));
		else if (x) _ = new Dr(), v = zr(v, new b(Sr, {
			level: l,
			chunkSize: t
		})), v = Rr(v, _);
		else try {
			v = Lr(v, o, {
				level: l,
				chunkSize: t
			}, r, n);
		} catch (e) {
			if (!o && n) throw Wr(e);
			let t;
			try {
				t = new r(Sr);
			} catch {
				throw Wr(e);
			}
			v = zr(v, t), v = Rr(v, new Dr());
		}
		a && (s ? v = Rr(v, new tr(e)) : (g = new Vn(e), v = Rr(v, g))), Pr(m, v, () => {
			(!a || s) && c && (m.crc32 = x ? _.crc32 : new DataView(h.value.buffer).getUint32(0));
		});
	}
}, Dr = class extends TransformStream {
	constructor() {
		let e, t = Cr, n = new Uint8Array();
		super({
			transform(e, r) {
				if (t) {
					let n = Math.min(t, e.length);
					if (t -= n, e = e.subarray(n), !e.length) return;
				}
				let i = n.length + e.length;
				if (i <= wr) {
					n = Jt(n, e);
					return;
				}
				let a = i - wr, o = Math.min(a, n.length);
				r.enqueue(Jt(n.subarray(0, o), e.subarray(0, a - o))), n = Jt(n.subarray(o), e.subarray(a - o));
			},
			flush() {
				let t = z(n);
				e.crc32 = t.getUint32(0, !0), e.uncompressedSize = t.getUint32(4, !0);
			}
		}), e = this;
	}
};
function Or(e, t, n, r, i) {
	let a = t.writable.getWriter(), o = t.readable.getReader(), s = r === void 0 ? new Gt() : void 0, c = 0, l = !1, u = !1, d, f, p = new ReadableStream({
		start(e) {
			f = e;
		},
		pull() {
			v();
		},
		cancel(e) {
			return u = !0, v(), o.cancel(e);
		}
	});
	return m(), h(), p;
	async function m() {
		let t = e.getReader();
		try {
			let e = new Uint8Array(Cr);
			for (e.set(Tr), await a.write(e);;) {
				await _(), await a.ready;
				let { value: e, done: n } = await Hr(t, i);
				if (n) break;
				await a.write(e);
			}
			s && await a.write(new Uint8Array());
			let o = new Uint8Array(wr), c = z(o);
			c.setUint32(0, s ? s.get() : r, !0), c.setUint32(4, n, !0), l = !0, await a.write(o), await a.close();
		} catch (e) {
			await Br(a, e), await Vr(t, e);
		}
	}
	async function h() {
		try {
			for (;;) {
				let { value: e, done: t } = await g();
				if (t) break;
				if (c += e.length, c > n) throw Error(hr);
				s && s.append(e), f.enqueue(e);
			}
			u || (u = !0, f.close());
		} catch (e) {
			y(e), await Vr(o, e);
		}
	}
	function g() {
		return o.read().catch((e) => {
			if (l) {
				if (!s) throw Kr(e, vr);
				if (c != n) throw Kr(e, hr);
				return { done: !0 };
			}
			throw Ur(e, i);
		});
	}
	function _() {
		if (!u && f.desiredSize <= 0) return new Promise((e) => d = e);
	}
	function v() {
		if (d) {
			let e = d;
			d = void 0, e();
		}
	}
	function y(e) {
		u || (u = !0, f.error(e), v());
	}
}
var kr = class extends TransformStream {
	constructor(e, { chunkSize: t, DecompressionStreamFallback: n, DecompressionStream: r }) {
		super({});
		let { zipCrypto: i, encrypted: a, checkCrc32: o, crc32: s, compressed: c, useCompressionStream: l, deflate64: u, format: d, compressionMethod: f, rawBitFlag: p, outputSize: m } = e, h, g, _, v = super.readable;
		if (a && (i ? v = Rr(v, new er(e)) : (g = new Bn(e), v = Rr(v, g))), c) {
			let e = /* @__PURE__ */ new Set(), i = d && Nt(d), a;
			if (i) v = zr(v, Fr(i.DecompressionStream, d, {
				chunkSize: t,
				compressionMethod: f,
				rawBitFlag: p,
				uncompressedSize: m
			}), e);
			else {
				let i = Ir(l, r, n);
				if (o && !u && s !== void 0 && m !== void 0 && i) try {
					a = new i(Sr, { chunkSize: t });
				} catch {
					a = void 0;
				}
				if (!a) try {
					v = Lr(v, l, {
						chunkSize: t,
						deflate64: u
					}, r, n, e);
				} catch (e) {
					if (u || m === void 0 || !l && n) throw Wr(e);
					try {
						a = new r(Sr);
					} catch {
						throw Wr(e);
					}
				}
			}
			a ? (_ = !0, v = Or(v, a, m, s, e)) : v = qr(v, e);
		}
		o && !_ && (h = new Kt(), v = Rr(v, h)), Pr(this, v, () => {
			if (h && s != new DataView(h.value.buffer).getUint32(0, !1)) throw Error(vr);
		});
	}
}, Ar = /* @__PURE__ */ new Map();
function jr(e, t) {
	if (!e) return !1;
	let n = Ar.get(e);
	n || (n = /* @__PURE__ */ new Map(), Ar.set(e, n));
	let r = n.get(t);
	if (r === void 0) {
		try {
			new e(t), r = !0;
		} catch {
			r = !1;
		}
		n.set(t, r);
	}
	return r;
}
function Mr(e) {
	return jr(e, br);
}
function Nr(e) {
	return jr(e, Sr);
}
function Pr(e, t, n) {
	t = Rr(t, new TransformStream({ flush: n })), Object.defineProperty(e, "readable", { get() {
		return t;
	} });
}
function Fr(e, t, n) {
	if (!e) throw Error(kt);
	return new e(t, n);
}
function Ir(e, t, n) {
	if (e && t) return t;
	if (n && n.requiresModule) return n;
}
function Lr(e, t, n, r, i, a) {
	let o = t && r ? r : i || r, s = n.deflate64 ? xr : br, c;
	try {
		c = new o(s, n);
	} catch (e) {
		if (t && i && o != i) c = new i(s, n);
		else throw e;
	}
	return zr(e, c, a);
}
function Rr(e, t) {
	return ur(e).pipeThrough(t);
}
function zr(e, t, n) {
	let r = t.writable.getWriter(), i = e.getReader();
	return a(), t.readable;
	async function a() {
		try {
			for (;;) {
				await r.ready;
				let e = await Hr(i, n);
				if (e.done) {
					await r.close();
					break;
				}
				await r.write(e.value);
			}
		} catch (e) {
			await Br(r, e), await Vr(i, e);
		}
	}
}
async function Br(e, t) {
	try {
		await e.abort(t);
	} catch {}
}
async function Vr(e, t) {
	try {
		await e.cancel(t);
	} catch {}
}
function Hr(e, t) {
	let n = e.read();
	return t ? n.catch((e) => {
		throw t.add(e), e;
	}) : n;
}
function Ur(e, t) {
	return t.has(e) ? e : Kr(e, Gr(e) ? _r : gr);
}
function Wr(e) {
	return Gr(e) ? Kr(e, _r) : e;
}
function Gr(e) {
	return mr(e) && e.code == yr;
}
function Kr(e, t) {
	let n = Error(t);
	return n.cause = e, n;
}
function qr(e, t) {
	let n = e.getReader();
	return new ReadableStream({
		async pull(e) {
			try {
				let { value: t, done: r } = await n.read();
				r ? e.close() : e.enqueue(t);
			} catch (e) {
				throw await Vr(n, e), Ur(e, t);
			}
		},
		cancel(e) {
			return n.cancel(e);
		}
	});
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/streams/codec-stream.js
var Jr = 64 * 1024, Yr = "message", Xr = "start", Zr = "pull", Qr = "data", $r = "close", ei = "deflate", ti = "inflate", ni = class extends TransformStream {
	constructor(e, t) {
		super({});
		let n = this, { codecType: r } = e, i;
		r.startsWith("deflate") ? i = Er : r.startsWith("inflate") && (i = kr), n.outputSize = 0;
		let a = 0, o = new i(e, t), s = super.readable, c = new TransformStream({
			transform(e, t) {
				e && e.length && (a += e.length, t.enqueue(e));
			},
			flush() {
				Object.assign(n, { inputSize: a });
			}
		}), l = new TransformStream({
			transform(t, r) {
				if (t && t.length && (r.enqueue(t), n.outputSize += t.length, e.outputSize !== void 0 && n.outputSize > e.outputSize)) throw Error(hr);
			},
			flush() {
				let { crc32: e } = o;
				Object.assign(n, {
					crc32: e,
					inputSize: a
				});
			}
		});
		Object.defineProperty(n, "readable", { get() {
			return s.pipeThrough(c).pipeThrough(o).pipeThrough(l);
		} });
	}
}, ri = class extends TransformStream {
	constructor(e) {
		let t = [], n = 0, r = 0;
		(!Number.isFinite(e) || e < 1) && (e = Jr), super({
			transform(a, o) {
				for (t.push(a), n += a.length; n > e;) r += e, o.enqueue(i());
			},
			flush(e) {
				n && (r += n, e.enqueue(a(t, n)));
			}
		}), Object.defineProperty(this, "outputSize", { get: () => r });
		function i() {
			let r = new Uint8Array(e), i = 0;
			for (; i < e;) {
				let n = t[0], a = e - i;
				n.length <= a ? (r.set(n, i), i += n.length, t.shift()) : (r.set(n.subarray(0, a), i), t[0] = n.subarray(a), i += a);
			}
			return n -= e, r;
		}
		function a(e, t) {
			let n = new Uint8Array(t), r = 0;
			for (let t of e) n.set(t, r), r += t.length;
			return n;
		}
	}
}, ii = "Worker startup timeout", ai, oi, si, ci = () => {};
function li({ initModule: e }) {
	ci = e;
}
function ui(e) {
	si = e;
}
async function di(e) {
	let { CompressionStream: t, CompressionStreamFallback: n } = e;
	return n && !n.requiresModule || Mr(t) || Nr(t) ? !0 : n ? await fi(e) : !1;
}
async function fi(e) {
	if (ci) try {
		return await ci(e), !0;
	} catch {}
	return !1;
}
function pi(e) {
	e.createWorker ? oi = !0 : ai = !1;
}
var mi = class {
	constructor(e, { readable: t, writable: n }, r, i) {
		let { options: a, config: o, streamOptions: s, useWebWorkers: c, transferStreams: l, workerURI: u } = r, { createWorker: d } = r, { signal: f } = s;
		return oi && (d = void 0), Object.assign(e, {
			busy: !0,
			generation: (e.generation || 0) + 1,
			readable: t.pipeThrough(new ri(St(o))).pipeThrough(new hi(s), { signal: f }),
			writable: n,
			options: Object.assign({}, a),
			workerOptions: r,
			workerURI: u,
			createWorker: d,
			transferStreams: l,
			terminate() {
				return new Promise((t) => {
					let { worker: n, busy: r } = e;
					r ? (e.terminateResolvers = e.terminateResolvers || [], e.terminateResolvers.push(t)) : (n && (n.terminate(), e.worker = null), t()), e.interface = null;
				});
			},
			onTaskFinished() {
				if (e.busy) {
					let { terminateResolvers: t, worker: n } = e;
					t && (e.terminateResolvers = null, n && (e.terminated = !0, n.terminate())), e.busy = !1;
					let r = i(e);
					t && t.forEach((e) => e(r));
				}
			}
		}), ai === void 0 && (ai = typeof Worker != T), (c && si && (ai && u || d) ? si : _i)(e, o);
	}
}, hi = class extends TransformStream {
	constructor({ onstart: e, onprogress: t, size: n, onend: r }) {
		let i = 0;
		super({
			async start() {
				e && await gi(e, n);
			},
			async transform(e, r) {
				i += e.length, t && await gi(t, i, n), r.enqueue(e);
			},
			async flush() {
				r && await gi(r, i);
			}
		});
	}
};
async function gi(e, ...t) {
	try {
		await e(...t);
	} catch {}
}
function _i(e, t) {
	return { run: () => vi(e, t) };
}
async function vi({ options: e, readable: t, writable: n, onTaskFinished: r, workerOptions: i }, a) {
	let o, s, c;
	try {
		if (e.compressed && !e.format) {
			let t = e.codecType.startsWith(ei), n = t ? a.CompressionStreamFallback : a.DecompressionStreamFallback, r = t ? a.CompressionStream : a.DecompressionStream;
			e.useCompressionStream ? n && n.requiresModule && !Mr(r) && await l() : !await l() && (!n || n.requiresModule) && (e.useCompressionStream = !0);
		}
		e.encrypted && !e.zipCrypto && await l(), o = new ni(e, a), s = new ri(St(a));
		let { signal: r } = i.streamOptions;
		await t.pipeThrough(o).pipeThrough(s).pipeTo(n, {
			preventClose: !0,
			preventAbort: !0,
			signal: r
		});
		let { crc32: c, inputSize: u, outputSize: d } = o;
		return {
			crc32: c,
			inputSize: u,
			outputSize: d
		};
	} catch (e) {
		if (o) {
			let t = s ? s.outputSize : 0;
			if (i.outputSize = t, mr(e)) try {
				e.outputSize = t;
			} catch {}
		}
		throw e;
	} finally {
		r();
	}
	function l() {
		return c ||= fi(a), c;
	}
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/codec-pool.js
var yi = [], bi = [], xi, Si, Ci = 0;
async function wi(e, t) {
	let { options: n, config: r } = t, { transferStreams: i, useWebWorkers: a, useCompressionStream: o, compressed: s, checkCrc32: c, computeCrc32: l, encrypted: u, format: d, codecURI: f } = n, { workerURI: p, createWorker: m, maxWorkers: h } = r;
	d && (f && (n.codecURI = Ti(f, r.baseURI)), await Ft(d, n.codecURI)), t.transferStreams = !d && (i || i === void 0 && r.transferStreams);
	let g = !s && !c && !l && !u, _ = d === void 0 || !!n.codecURI;
	return t.useWebWorkers = !g && _ && (a || a === void 0 && r.useWebWorkers), t.workerURI = t.useWebWorkers && p ? p : void 0, t.createWorker = t.useWebWorkers && m ? m : void 0, n.useCompressionStream = o || o === void 0 && r.useCompressionStream, (await v()).run();
	async function v() {
		let n = yi.find((e) => !e.busy);
		if (n) return Ni(n), new mi(n, e, t, y);
		if (yi.length < h) {
			let n = { indexWorker: Ci };
			return Ci++, yi.push(n), new mi(n, e, t, y);
		} else return new Promise((n) => {
			bi.push({
				resolve: n,
				stream: e,
				workerOptions: t
			}), Si = r.workerStarvationTimeout, Ei();
		});
	}
	function y(e) {
		if (Di(), e.terminated) return e.terminated = !1, ki();
		if (bi.length) {
			let [{ resolve: t, stream: n, workerOptions: r }] = bi.splice(0, 1);
			t(new mi(e, n, r, y)), Ei();
		} else e.worker ? (Ni(e), Mi(e, t)) : yi = yi.filter((t) => t != e);
	}
}
function Ti(e, t) {
	try {
		return new URL(e, t).toString();
	} catch {
		return e;
	}
}
function Ei() {
	!xi && bi.length && Number.isFinite(Si) && Si >= 0 && (xi = setTimeout(Oi, Si));
}
function Di() {
	xi &&= (clearTimeout(xi), null);
}
function Oi() {
	if (xi = null, bi.length) {
		let [{ resolve: e, stream: t, workerOptions: n }] = bi.splice(0, 1);
		e(new mi({}, t, Ai(n), ji)), Ei();
	}
}
function ki() {
	let e = bi.splice(0).map(({ resolve: e, stream: t, workerOptions: n }) => new Promise((r) => {
		e(new mi({}, t, Ai(n), () => {
			ji(), r();
		}));
	}));
	return Di(), Promise.all(e);
}
function Ai(e) {
	return Object.assign({}, e, {
		useWebWorkers: !1,
		workerURI: void 0,
		createWorker: void 0
	});
}
function ji() {
	Di(), Ei();
}
function Mi(e, t) {
	let { config: n } = t, { terminateWorkerTimeout: r } = n;
	Number.isFinite(r) && r >= 0 && (e.terminateTimeout = setTimeout(async () => {
		yi = yi.filter((t) => t != e);
		try {
			await e.terminate();
		} catch {}
	}, r));
}
function Ni(e) {
	let { terminateTimeout: t } = e;
	t && (clearTimeout(t), e.terminateTimeout = null);
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/util/decode-cp437.js
var Pi = "\0☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\xA0".split("");
function Fi(e) {
	let t = "";
	for (let n = 0; n < e.length; n++) t += Pi[e[n]];
	return t;
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/util/decode-text.js
function Ii(e, t) {
	return Ri(e, t, !0);
}
function Li(e) {
	if (e.some((e) => e > 127)) try {
		return new TextDecoder("utf-8", { fatal: !0 }).decode(e), !0;
	} catch {
		return !1;
	}
	else return !1;
}
function Ri(e, t, n) {
	return t && t.trim().toLowerCase() == "cp437" ? Fi(e) : new TextDecoder(t, { ignoreBOM: n }).decode(e);
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/io.js
var zi = "Writer iterator completed too soon", Bi = "Invalid writer (size must be writable)", Vi = "text/plain";
22 + t;
var Hi = "writable", Ui = Symbol(), Wi = class {
	constructor() {
		this.size = 0;
	}
	init() {
		this.initialized = !0;
	}
}, Gi = class extends Wi {
	get readable() {
		return this.createReadable();
	}
	createReadable({ offset: e = 0, size: t, chunkSize: n = St(xt()) } = {}) {
		let r = this, i = 0;
		return n = Ct(n), new ReadableStream({ async pull(a) {
			let o = t === void 0 ? n : Math.min(n, t - i), s = await q(r, e + i, o);
			s.length && (a.enqueue(s), i += s.length), (t !== void 0 && i >= t || !s.length && o) && a.close();
		} });
	}
}, Ki, qi;
function Ji() {
	qi = (async () => {
		try {
			let e = new Blob([new Uint8Array(3)]).slice(1, 2).stream().getReader(), t = 0, n = await e.read();
			for (; !n.done;) t += n.value.length, n = await e.read();
			Ki = t == 1;
		} catch {
			Ki = !1;
		}
	})();
}
var Yi = class extends Gi {
	constructor(e) {
		super(), Object.assign(this, {
			sourceBlob: e,
			size: e.size
		}), qi || Ji();
	}
	createReadable(e) {
		let { sourceBlob: t, size: n } = this, { offset: r = 0, size: i = n - r } = e || {};
		if (typeof t.stream == "function") {
			if (!r && i >= n) return ur(t.stream());
			if (Ki) return ur(t.slice(r, r + i).stream());
		}
		return super.createReadable(e);
	}
	async readUint8Array(e, t) {
		let n = this, r = e + t, i = await (!e && r >= n.size ? n.sourceBlob : n.sourceBlob.slice(e, r)).arrayBuffer();
		return i.byteLength > t && (i = i.slice(e, r)), new Uint8Array(i);
	}
}, Xi = class extends Wi {
	constructor(e) {
		super();
		let t = this, n = new TransformStream();
		Object.defineProperty(t, Hi, { get() {
			return n.writable;
		} }), t.contentType = e, t.blobPromise = dr(n.readable, e), t.blobPromise.catch(() => {});
	}
	getData() {
		return this.blobPromise;
	}
}, Zi = class extends Yi {
	constructor(e) {
		super(new Blob([e], { type: Vi }));
	}
}, Qi = class extends Gi {
	constructor(e) {
		super(), this.readers = e;
	}
	async init() {
		let e = this;
		e.lastDiskNumber = 0, e.diskOffsets = (e.readers = await Promise.all(e.readers.map(ia))).map((t) => {
			let n = e.size;
			return e.size += t.size, n;
		}), super.init();
	}
	getDiskOffset(e) {
		let { diskOffsets: t, size: n } = this, r = t[e];
		return r === void 0 ? n : r;
	}
	async readUint8Array(e, t) {
		let n = this, { readers: r } = this, i, a = 0, o = e;
		for (; r[a] && o >= r[a].size;) o -= r[a].size, a++;
		let s = r[a];
		if (s) {
			let r = s.size;
			if (o + t <= r) i = await q(s, o, t);
			else {
				let a = r - o;
				i = Jt(await q(s, o, a), await n.readUint8Array(e + a, t - a));
			}
		} else i = k;
		return n.lastDiskNumber = Math.max(a, n.lastDiskNumber), i;
	}
}, $i = class extends Wi {
	constructor(e, t = 4294967295) {
		super();
		let n = this;
		Object.assign(n, {
			diskNumber: 0,
			diskOffset: 0,
			size: 0,
			maxSize: t,
			availableSize: t
		});
		let r, i, a, o = new WritableStream({
			async write(t) {
				if (t === Ui) {
					a && await c();
					return;
				}
				let { availableSize: o } = n;
				if (a) t.length >= o ? (await s(t.subarray(0, o)), await c(), t.length > o && await this.write(t.subarray(o))) : await s(t);
				else {
					let { value: o, done: s } = await e.next();
					if (s && !o) throw Error(zi);
					r = o, r.size = 0, r.maxSize && (n.maxSize = r.maxSize), n.availableSize = n.maxSize, await ra(r), i = o.writable, a = i.getWriter(), await this.write(t);
				}
			},
			async close() {
				a && (await a.ready, await l());
			},
			async abort(e) {
				a && await a.abort(e);
			}
		});
		Object.defineProperty(n, Hi, { get() {
			return o;
		} });
		async function s(e) {
			let t = e.length;
			t && (await a.ready, await a.write(e), r.size += t, n.availableSize -= t);
		}
		async function c() {
			await l(), n.diskOffset += r.size, n.diskNumber++, a = null, n.availableSize = n.maxSize;
		}
		async function l() {
			await a.close();
		}
	}
	async closeDisk() {
		let e = this.writable.getWriter();
		try {
			await e.ready, await e.write(Ui);
		} finally {
			e.releaseLock();
		}
	}
}, ea = class {
	constructor(e) {
		return Array.isArray(e) && (e = new Qi(e)), (e instanceof ReadableStream || typeof e.getReader == "function") && (e = { readable: ur(e) }), e;
	}
}, ta = class {
	constructor(e) {
		e.writable === void 0 && typeof e.next == "function" && (e = new $i(e)), (e instanceof WritableStream || typeof e.getWriter == "function") && (e = { writable: pr(e) });
		try {
			e.size = e.size === void 0 ? 0 : e.size;
		} catch {
			throw Error(Bi);
		}
		return e;
	}
};
function na(e) {
	return !!(e && e.getData);
}
async function ra(e, t) {
	if (e.init && !e.initialized) await e.init(t);
	else return Promise.resolve();
}
async function ia(e) {
	return e = new ea(e), await ra(e), (e.size === void 0 || !e.readUint8Array) && (e = new Yi(await dr(e.readable)), await ra(e)), e;
}
function q(e, t, n) {
	return e.readUint8Array(t, n);
}
function aa(e, t) {
	return e.createReadable ? e.createReadable(t) : e.readUint8Array ? Gi.prototype.createReadable.call(e, t) : e.readable;
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/util/warnings.js
function J(e, t, n) {
	if (!e.some((e) => e.reason == t)) {
		let r = { reason: t };
		n !== void 0 && (r.filename = n), e.push(r);
	}
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/zip-entry.js
var oa = "filename", sa = "rawFilename", ca = "comment", la = "rawComment", ua = "uncompressedSize", da = "compressedSize", fa = "offset", pa = "diskNumberStart", ma = "lastModDate", ha = "rawLastModDate", ga = "lastAccessDate", _a = "rawLastAccessDate", va = "creationDate", ya = "rawCreationDate", ba = "internalFileAttributes", xa = "externalFileAttributes", Sa = "msdosAttributesRaw", Ca = "msdosAttributes", wa = "msDosCompatible", Ta = "zip64", Ea = "encrypted", Da = "version", Oa = "versionMadeBy", ka = "zipCrypto", Aa = "directory", ja = "executable", Ma = "symlink", Na = "compressionMethod", Pa = "signature", Fa = "crc32", Ia = "extraField", La = "extraFieldInfoZip", Ra = "extraFieldUnix", za = "extraFieldUnixType1", Ba = "extraFieldPkwareUnix", Va = "unixMode", Ha = "setuid", Ua = "setgid", Wa = "sticky", Ga = [
	oa,
	sa,
	ua,
	da,
	ma,
	ha,
	ca,
	la,
	ga,
	_a,
	va,
	ya,
	fa,
	pa,
	ba,
	xa,
	Sa,
	Ca,
	wa,
	Ta,
	Ea,
	Da,
	Oa,
	ka,
	Aa,
	ja,
	Ma,
	Na,
	Pa,
	Fa,
	Ia,
	Ra,
	La,
	za,
	Ba,
	"uid",
	"gid",
	Va,
	"unixExternalUpper",
	Ha,
	Ua,
	Wa,
	"bitFlag",
	"rawBitFlag",
	"filenameLength",
	"extraFieldLength",
	"filenameUTF8",
	"commentUTF8",
	"rawExtraField",
	"extraFieldZip64",
	"extraFieldUnicodePath",
	"extraFieldUnicodeComment",
	"extraFieldAES",
	"extraFieldNTFS",
	"extraFieldExtendedTimestamp",
	"extraFieldUSDZ"
], Ka = class {
	constructor(e) {
		Ga.forEach((t) => this[t] = e[t]);
	}
}, qa = new Set([
	1,
	u,
	10,
	d,
	f,
	p,
	m,
	h,
	g,
	_,
	13
]);
function Ja(e) {
	if (e) {
		let t = /* @__PURE__ */ new Map();
		if (e.forEach((e, n) => {
			qa.has(n) || t.set(n, e.data);
		}), t.size) return t;
	}
}
function Ya(e, t, n) {
	return e ? t ? 12 : 16 + n * 4 : 0;
}
//#endregion
//#region node_modules/@zip.js/zip.js/lib/core/zip-reader.js
var Xa = "File format is not recognized", Za = "End of central directory not found", Qa = "End of Zip64 central directory locator not found", $a = "Central directory header not found", eo = "Local file header not found", to = "Zip64 extra field not found", no = "File contains encrypted entry", ro = "Encryption method not supported", io = "Split zip file", ao = "Overlapping entry found", oo = "Entry data out of bounds", so = "Ambiguous archive", co = "Encrypted central directory is not supported", lo = "Unsafe filename", uo = "Invalid strictness (must be 'strict', 'balanced' or 'tolerant')", fo = "Invalid filenameValidation (must be 'strict', 'balanced' or 'tolerant')", po = "Invalid maxAppendedDataSize (must be a number greater than or equal to 0)", mo = "64-bit value exceeds Number.MAX_SAFE_INTEGER", ho = "unsorted central directory", go = "unknown version needed to extract", _o = "compressed patched data", vo = "malformed extra field", yo = "unknown zip64 extensible data", bo = "wrapped entries count", xo = "appended data", So = "prepended data", Co = "prepended central directory", wo = "trailing central directory data", To = "duplicate filename", Eo = "mismatched zip64 end of central directory record", Do = "multiple end of central directory records", Oo = "mismatched local file header (filename)", ko = "mismatched local file header (general purpose bit flag)", Ao = "mismatched local file header (compression method)", jo = "mismatched local file header (crc32 or sizes)", Mo = 63, No = /^[a-zA-Z]:/, Po = /(^|[\\/])\.\.([\\/]|$)/, Fo = "utf-8", Io = "UTF8", Lo = "cp437", Ro = 73 | v, zo = 1, Bo = [
	[ua, e],
	[da, e],
	[fa, e],
	[pa, t]
], Vo = {
	[t]: {
		getValue: Q,
		bytes: 4
	},
	[e]: {
		getValue: $,
		bytes: 8
	}
}, Ho = BigInt(2 ** 53 - 1), Uo = 64, Wo = 1032, Go = 0, Ko = 1, qo = 2, Jo = class {
	constructor(e, t = {}) {
		Object.assign(this, {
			reader: new ea(e),
			options: t,
			readRanges: {
				indexes: /* @__PURE__ */ new Set(),
				sortedRanges: [],
				pendingRanges: []
			}
		});
	}
	async *getEntriesGenerator(e = {}) {
		let n = this, { reader: r } = n;
		if (await ra(r), (r.size === void 0 || !r.readUint8Array) && (r = new Yi(await dr(r.readable)), await ra(r)), r.size < 22) throw Error(Xa);
		let i = n.warnings = [], a = Cs(e, n.options), s = a == Ve, c = a != Ue, l = ks(X(n, e, Fe), a), u = Ds(X(n, e, Ne), a), d = X(n, e, Pe), { endOfDirectoryInfo: f, endOfDirectoryReachingEndCount: p } = await As(r, c, l);
		if (!f) throw await vs(r) ? Error(io) : Error(Za);
		c && p > 1 && Ls(Do);
		let m = z(f), h = Q(m, 12), g = Q(m, 16), _ = f.offset, v = Z(m, 20), S = _ + 22 + v, C = r.size - S;
		C > l && Ls(xo), C > 0 && J(i, xo);
		let w = Z(m, 4), ne = r.lastDiskNumber || 0, T = Z(m, 6), E = Z(m, 10), D = 0, O, A, oe, se, ce = 56, M, le = g == 4294967295 || h == 4294967295 || E == 65535 || T == 65535;
		if (g != 4294967295 && T != 65535 && (g += _s(r, T)), le) {
			let e = f.offset >= 20 ? await q(r, f.offset - 20, 20) : k, t = z(e);
			if (e.length == 20 && Q(t, 0) == 117853008) {
				g = _s(r, Q(t, 4)) + $(t, 8);
				let e = await q(r, g, 56), n = z(e), a = f.offset - 20 - 56;
				if ((e.length < 56 || Q(n, 0) != 101075792) && g != a && a >= 0) {
					let t = g;
					g = a, g > t && (D = g - t), e = await q(r, g, 56), n = z(e);
				}
				if (e.length < 56 || Q(n, 0) != 101075792) throw Error(Qa);
				if (oe = !0, se = $(n, 4) > 44, se) {
					let e = Math.min($(n, 4) - 44, r.size - g - 56);
					e > 0 && (ce += e, M = es(await q(r, g + 56, e)));
				}
				w == 65535 ? w = Q(n, 16) : w != Q(n, 16) && Y(s, i, Eo), T == 65535 ? T = Q(n, 20) : T != Q(n, 20) && Y(s, i, Eo), E == 65535 ? E = $(n, 32) : E != $(n, 32) && Y(s, i, Eo), h == 4294967295 ? h = $(n, 40) : h != $(n, 40) && Y(s, i, Eo), g = _s(r, T) + $(n, 48) + D;
			}
		}
		let ue = h, de = f.offset - (oe ? ce + 20 : 0);
		if (g >= r.size && (D = r.size - g - h - 22, g = r.size - h - 22), ne != w) throw Error(io);
		if (g < 0) throw Error(Xa);
		let N = 0, P = await q(r, g, h), F = z(P);
		if (h) {
			if (P.length < 4) throw Error(Xa);
			let e = de - h;
			if (g != e && T == w) {
				let t = Q(F, N) == 33639248 || !!(M && M.compressedSize) || Xo(F), n = !t;
				if (!n && e >= 0 && e + 4 <= r.size && (n = Q(z(await q(r, e, 4)), 0) == o), n) {
					let n = g;
					g = e, g > n && (D += g - n, O = t), P = await q(r, g, h), F = z(P);
				}
			}
		}
		let fe = de - g;
		if (h != fe && fe >= 0 && T == w && (h = fe, P = await q(r, g, h), F = z(P)), g < 0 || g >= r.size) throw Error(Xa);
		n.directoryOffset = g, n.directoryLength = ue;
		let pe = Rs(n, e, Ie), me, he;
		if (pe && E && P.length >= 4 && Q(F, 0) != 33639248 && (se || Xo(F))) {
			let e = $o(M, ue, P.length);
			he = P.subarray(e), P = await pe(P.subarray(0, e), M), F = z(P), ue = P.length, me = !0;
		}
		M && !me && (P.length < 4 || Q(F, 0) == 33639248) && J(i, yo), A = g;
		let ge = X(n, e, re), _e = X(n, e, ie), ve = /* @__PURE__ */ new Set(), ye, be = -1, xe = !s && !oe;
		!E && xe && (E = Zo(F, P, N), E && J(i, bo));
		for (let a = 0; a < E; a++) {
			let o = new Yo(r, n.options);
			if (N + 46 > P.length || Q(F, N) != 33639248) throw a == 0 && !me && (se || Xo(F)) ? Error(co) : Error($a);
			ts(o, F, N + 6);
			let s = !!o.bitFlag.languageEncodingFlag, c = N + 46, l = c + o.filenameLength + o.extraFieldLength, f = Z(F, N + 4), p = f >> 8 == 0, m = f >> 8 == 3, h = Z(F, N + 32), g = l + h, _ = new Uint8Array(P.subarray(c, g)), v = _.subarray(0, o.filenameLength), S = _.subarray(o.filenameLength + o.extraFieldLength), C = s || !ge && Li(v), w = s || !_e && Li(S), ne = Q(F, N + 38), T = ne & 255, O = {
				readOnly: !!(T & 1),
				hidden: !!(T & 2),
				system: !!(T & 4),
				directory: !!(T & 16),
				archive: !!(T & 32)
			}, k = Q(F, N + 42), re = Rs(n, e, "decodeText") || Ii, ie = C ? Fo : ge || Lo, ae = w ? Fo : _e || Lo, j = re(v, ie, ze);
			if (j === void 0 && (j = Ii(v, ie)), d) {
				let e = d(j);
				e !== void 0 && (j = e);
			}
			if (Os(j, u)) {
				let e = /* @__PURE__ */ Error(lo);
				throw e.filename = j, e;
			}
			let oe = re(S, ae, Be);
			oe === void 0 && (oe = Ii(S, ae)), Object.assign(o, {
				index: a,
				decryptedDirectory: me,
				versionMadeBy: f,
				msDosCompatible: p,
				zip64: !1,
				compressedSize: 0,
				uncompressedSize: 0,
				commentLength: h,
				offset: k,
				diskNumberStart: Z(F, N + 34),
				internalFileAttributes: Z(F, N + 36),
				externalFileAttributes: ne,
				msdosAttributesRaw: T,
				msdosAttributes: O,
				rawFilename: v,
				filenameUTF8: C,
				commentUTF8: w,
				rawExtraField: _.subarray(o.filenameLength, o.filenameLength + o.extraFieldLength),
				rawComment: S,
				filename: j,
				comment: oe
			}), ns(o, o, F, N + 6) && J(i, vo, j), o.offset += D;
			let ce = _s(r, o.diskNumberStart) + o.offset;
			A = Math.min(ce, A), ce < be && J(i, ho, j), be = ce, (o.version & 255) > Mo && J(i, go, j), (o.rawBitFlag & 32) == 32 && J(i, _o, j), ve.has(o.filename) && (ye = !0), ve.add(o.filename);
			let M = o.externalFileAttributes >> 16 & t;
			o.unixMode === void 0 && M & 16877 && (o.unixMode = M);
			let le = !!(o.unixMode & ee), ue = !!(o.unixMode & te), de = !!(o.unixMode & 512), fe = ((o.unixMode === void 0 ? M : o.unixMode) & y) == x, pe = !fe && (o.unixMode === void 0 ? m && (M & 73) != 0 : (o.unixMode & 73) != 0), he = o.unixMode !== void 0 && (o.unixMode & 61440) == 16384, I = (M & y) == b;
			Object.assign(o, {
				setuid: le,
				setgid: ue,
				sticky: de,
				symlink: fe,
				unixExternalUpper: M,
				executable: pe,
				directory: he || I || p && O.directory || o.filename.endsWith("/"),
				zipCrypto: o.encrypted && !o.extraFieldAES
			});
			let L = new Ka(o);
			if (L.getData = (e, t) => o.getData(e, L, n.readRanges, t), L.arrayBuffer = async (e) => {
				let t = new TransformStream(), r = dr(t.readable).then((e) => e.arrayBuffer());
				return r.catch(() => {}), await o.getData(t, L, n.readRanges, Object.assign({}, e, { preventClose: !1 })), r;
			}, N = g, a == E - 1 && xe) {
				let e = Zo(F, P, N);
				e && (E += e, J(i, bo));
			}
			let { onprogress: R } = e;
			if (R) try {
				await R(a + 1, E, new Ka(o));
			} catch {}
			yield L;
		}
		let I = N, L = Qo(P.subarray(N)) || (me ? Qo(he) : void 0);
		if (!L && !me) {
			let e = g + N, n = Math.min(de - e, 6 + t);
			n >= 6 && (L = Qo(await q(r, e, n)));
		}
		L && (n.digitalSignature = L, I = N + 6 + L.length), (N != ue && I != ue || !me && N != h && I != h) && Y(s, i, wo), ye && Y(s, i, To);
		let R = X(n, e, ae), Se = X(n, e, j), Ce = (s || R) && E && A == 4 && await ys(r) ? 4 : 0;
		return s && (D || E && A > Ce) && Ls(So), (D || E && A > 4) && J(i, So), O && J(i, Co), R && (n.prependedData = A > Ce ? await q(r, Ce, A - Ce) : k), n.comment = v ? await q(r, _ + 22, v) : k, Se && (n.appendedData = S < r.size ? await q(r, S, r.size - S) : k), !0;
	}
	async getEntries(e = {}) {
		let t = [];
		for await (let n of this.getEntriesGenerator(e)) t.push(n);
		return t;
	}
	async close() {
		let { reader: e } = this;
		!e.readUint8Array && e.readable && !e.readable.locked && await e.readable.cancel();
	}
	[A]() {
		return this.close();
	}
}, Yo = class {
	constructor(e, t) {
		Object.assign(this, {
			reader: e,
			options: t
		});
	}
	async getData(e, t, n, r = {}) {
		let i = this, a = xt(), { reader: o, index: s, offset: c, diskNumberStart: l, extraFieldAES: u, extraFieldZip64: d, compressionMethod: f, bitFlag: p, rawBitFlag: m, crc32: h, rawLastModDate: g, uncompressedSize: _, compressedSize: v } = i, { dataDescriptor: y } = p, b = t.localDirectory = {}, x = t.warnings = [], S = _s(o, l) + c, ee = await q(o, S, 30), te = z(ee), C = X(i, r, oe), w = X(i, r, se), ne = tt(X(i, r, ce)), T = !!ne, E = ne === !0;
		if (et(C, w), C = C && C.length ? C : void 0, w = w && w.length ? w : void 0, u && u.originalCompressionMethod != 99) throw Error(kt);
		if (ee.length < 30 || Q(te, 0) != 67324752) throw Error(eo);
		ts(b, te, 4);
		let { extraFieldLength: D, filenameLength: O } = b, A = b.dataOffset = S + 30 + O + D, re = X(i, r, P), ie = Cs(r, i.options), ae = Ts(re, ie), j = X(i, r, F), N = Es(j === void 0 ? re : j, ie), _e = k;
		if (N && (O || D)) {
			let e = await q(o, S + 30, O + D);
			_e = e.subarray(0, O), b.rawExtraField = e.subarray(O);
		} else b.rawExtraField = D ? await q(o, S + 30 + O, D) : k;
		N && (b.rawFilename = _e), ns(i, b, te, 4, !0) && J(x, vo), Is(i, b, _e, N, ae ? void 0 : x);
		let { lastAccessDate: ve, creationDate: ye, uid: be, gid: xe } = b;
		ve && (t.lastAccessDate = ve), ye && (t.creationDate = ye), be !== void 0 && t.uid === void 0 && (t.uid = be), xe !== void 0 && t.gid === void 0 && (t.gid = xe);
		let I = X(i, r, le), L = i.encrypted && (!E || I), R = L && !u;
		if (E || (t.zipCrypto = R), L && (i.rawBitFlag & 64) == 64) throw Error(ro);
		let Se = T ? void 0 : Mt(f);
		if (f != 0 && f != 8 && f != 9 && !Se && !T) throw Error(kt);
		if (L) {
			if (!R && (u.strength < 1 || u.strength > 3)) throw Error(ro);
			if (!C && !w) throw Error(no);
		}
		if (A + v > o.size) throw Error(oo);
		let Ce = v, we = Qe(X(i, r, M));
		$e(we);
		let Te = X(i, r, de), Ee = X(i, r, ue);
		Ee && (Te = !0);
		let { onstart: De, onprogress: Oe, onend: ke } = r, Ae = f != 0 && !T, je = T ? v - Ya(L, R, u && u.strength) : _, Me = f == 9, Ne = X(i, r, he);
		Me && (Ne = !1);
		let Pe = X(i, r, fe), Fe = (Pe === void 0 ? X(i, r, "checkSignature") : Pe) && !T && (!L || R || u && u.vendorVersion == zo), Ie = {
			options: {
				codecType: ti,
				password: C,
				rawPassword: w,
				zipCrypto: R,
				encryptionStrength: u && u.strength,
				checkCrc32: Fe,
				checkAuthenticationCode: X(i, r, pe),
				passwordVerification: R && (y ? g >>> 8 & 255 : h >>> 24 & 255),
				outputSize: je,
				crc32: h,
				compressed: Ae,
				encrypted: L,
				useWebWorkers: X(i, r, me),
				useCompressionStream: Ne,
				transferStreams: X(i, r, ge),
				deflate64: Me,
				format: Se ? Se.format : void 0,
				codecURI: Se ? Se.codecURI : void 0,
				compressionMethod: f,
				rawBitFlag: m,
				checkPasswordOnly: I
			},
			config: a,
			streamOptions: {
				signal: we,
				size: Ce,
				onstart: De,
				onprogress: Oe,
				onend: ke
			}
		};
		Te && await ds({
			reader: o,
			fileEntry: t,
			index: s,
			offset: S,
			crc32: h,
			compressedSize: v,
			uncompressedSize: _,
			dataOffset: A,
			dataDescriptor: y || b.bitFlag.dataDescriptor,
			extraFieldZip64: d || b.extraFieldZip64,
			readRanges: n
		});
		let Le, Re, ze;
		try {
			if (!Ee) {
				I && (e = new WritableStream()), e = new ta(e), await ra(e, Ss(je, v, Ae)), {writable: Le} = e;
				let { outputSize: t } = await wi({
					readable: ur(o.createReadable({
						offset: A,
						size: Ce
					})),
					writable: Le
				}, Ie);
				if ($e(we), t != je) throw Object.assign(Error(hr), { outputSize: t });
				e.size += t;
			}
		} catch (t) {
			let { outputSize: n } = Ie;
			if (n === void 0 ? mr(t) && t.outputSize !== void 0 && (e.size += t.outputSize) : e.size += n, !I || !mr(t) || t.message != "zipjs-abort-check-password") throw Re = t, ze = !0, t;
		} finally {
			if (!(!na(e) && X(i, r, "preventClose")) && Le && !Le.locked) {
				let e = Le.getWriter();
				if (ze) try {
					await e.abort(Re);
				} catch {}
				else await e.close();
			}
		}
		return I || Ee ? void 0 : e.getData ? e.getData() : Le;
	}
};
function Xo(e) {
	let t = Math.min(e.byteLength, 1024) - 3;
	for (let n = 0; n < t; n++) if (Q(e, n) == 134630224) return !0;
	return !1;
}
function Zo(e, t, n) {
	let r = 0;
	for (; n + 46 <= t.length && Q(e, n) == 33639248;) n += 46 + Z(e, n + 28) + Z(e, n + 30) + Z(e, n + 32), r++;
	return r % 65536 ? 0 : r;
}
function Qo(e) {
	if (e.length >= 6) {
		let t = z(e);
		if (Q(t, 0) == 84233040) {
			let n = Z(t, 4);
			if (6 + n <= e.length) return new Uint8Array(e.subarray(6, 6 + n));
		}
	}
}
function $o(e, t, n) {
	let r = e && e.compressedSize ? e.compressedSize : t;
	return r > 0 && r <= n ? r : n;
}
function es(e) {
	let t = { rawExtensibleData: e };
	if (e.length >= 28) {
		let n = z(e), r = Z(n, 26);
		Object.assign(t, {
			compressionMethod: Z(n, 0),
			compressedSize: $(n, 2),
			uncompressedSize: $(n, 10),
			encryptionAlgorithm: Z(n, 18),
			bitLength: Z(n, 20),
			flags: Z(n, 22),
			hashAlgorithm: Z(n, 24),
			hashData: e.subarray(28, 28 + r)
		});
	}
	return t;
}
function ts(e, t, n) {
	let r = e.rawBitFlag = Z(t, n + 2), i = (r & 1) == 1, a = Q(t, n + 6);
	Object.assign(e, {
		encrypted: i,
		version: Z(t, n),
		bitFlag: {
			level: (r & 6) >> 1,
			dataDescriptor: (r & 8) == 8,
			languageEncodingFlag: (r & v) == v
		},
		rawLastModDate: a,
		lastModDate: zs(a),
		filenameLength: Z(t, n + 22),
		extraFieldLength: Z(t, n + 24)
	});
}
function ns(e, t, n, r, i) {
	let { rawExtraField: a } = t, o = t.extraField = /* @__PURE__ */ new Map(), s = z(a), c = 0, l = !1;
	try {
		for (; c < a.length;) {
			let e = Z(s, c), t = Z(s, c + 2);
			o.set(e, {
				type: e,
				data: a.slice(c + 4, c + 4 + t)
			}), c += 4 + t;
		}
	} catch {
		l = !0;
	}
	c > a.length && (l = !0);
	let v = Z(n, r + 4);
	Object.assign(t, {
		signature: Q(n, r + 10),
		crc32: Q(n, r + 10),
		compressedSize: Q(n, r + 14),
		uncompressedSize: Q(n, r + 18)
	});
	let y = o.get(1);
	if (y) rs(y, t, i) || (l = !0), t.extraFieldZip64 = y;
	else if (Bo.some(([e, n]) => t[e] == n)) if (i) l = !0;
	else throw Error(to);
	let b = o.get(f);
	b && (is(b, oa, sa, t, e), t.extraFieldUnicodePath = b);
	let x = o.get(p);
	x && (is(x, ca, la, t, e), t.extraFieldUnicodeComment = x);
	let S = o.get(u);
	S && (v == 99 || t.encrypted) && S.data.length >= 7 ? (as(S, t, v), t.extraFieldAES = S) : (S && (l = !0), t.compressionMethod = v);
	let ee = o.get(13);
	ee && (ss(ee, t), t.extraFieldPkwareUnix = ee);
	let te = o.get(_);
	te && (ss(te, t), t.extraFieldUnixType1 = te);
	let C = o.get(10);
	C && (os(C, t), t.extraFieldNTFS = C);
	let w = o.get(g), ne;
	if (w && (ne = cs(w, t, !1), t.extraFieldUnix = w), !ne) {
		let e = o.get(h);
		e && (cs(e, t, !0), t.extraFieldInfoZip = e);
	}
	let T = o.get(d);
	T && (us(T, t, i), t.extraFieldExtendedTimestamp = T);
	let E = o.get(m);
	return E && (t.extraFieldUSDZ = E), l;
}
function rs(e, t, n) {
	t.zip64 = !0;
	let r = z(e.data), i = Bo.filter(([e, n]) => t[e] == n), a = i.reduce((e, [, t]) => e + Vo[t].bytes, 0);
	if (e.data.length < a) {
		if (n) return !1;
		throw Error(to);
	}
	let o = [];
	try {
		for (let e = 0, t = 0; e < i.length; e++) {
			let [, n] = i[e], a = Vo[n];
			o.push(a.getValue(r, t)), t += a.bytes;
		}
	} catch (e) {
		if (n) return !1;
		throw e;
	}
	return i.forEach(([n], r) => {
		t[n] = e[n] = o[r];
	}), !0;
}
function is(e, t, n, r, i) {
	if (e.data.length < 5) {
		e.valid = !1;
		return;
	}
	let a = z(e.data), o = new Gt();
	o.append(i[n]);
	let s = z(new Uint8Array(4));
	s.setUint32(0, o.get(), !0);
	let c = Q(a, 1), l = Vs(a, 0);
	Object.assign(e, {
		version: l,
		[t]: Ii(e.data.subarray(5)),
		valid: l == 1 && !i.bitFlag.languageEncodingFlag && c == Q(s, 0)
	}), e.valid && (r[t] = e[t], r[t + Io] = !0);
}
function as(e, t, n) {
	let r = z(e.data), i = Vs(r, 4);
	Object.assign(e, {
		vendorVersion: Vs(r, 0),
		vendorId: Vs(r, 2),
		strength: i,
		originalCompressionMethod: n,
		compressionMethod: Z(r, 5)
	}), t.compressionMethod = e.compressionMethod, e.vendorVersion != zo && (t.crc32 = void 0);
}
function os(e, t) {
	let n = z(e.data), r = 4, i;
	try {
		for (; r < e.data.length && !i;) {
			let t = Z(n, r), a = Z(n, r + 2);
			t == 1 && (i = e.data.slice(r + 4, r + 4 + a)), r += 4 + a;
		}
	} catch {}
	if (i && i.length == 24) {
		let n = z(i), r = n.getBigUint64(0, !0), a = n.getBigUint64(8, !0), o = n.getBigUint64(16, !0);
		Object.assign(e, {
			rawLastModDate: r,
			rawLastAccessDate: a,
			rawCreationDate: o
		});
		let s = {
			lastModDate: Bs(r),
			lastAccessDate: Bs(a),
			creationDate: Bs(o)
		};
		Object.assign(e, s), Object.assign(t, s, {
			rawLastAccessDate: a,
			rawCreationDate: o
		});
	}
}
function ss(e, t) {
	if (e.data.length < 8) return;
	let n = z(e.data), r = {
		lastAccessDate: /* @__PURE__ */ new Date((Q(n, 0) | 0) * 1e3),
		lastModDate: /* @__PURE__ */ new Date((Q(n, 4) | 0) * 1e3)
	};
	e.data.length >= 12 && (r.uid = Z(n, 8), r.gid = Z(n, 10)), Object.assign(e, r), Object.assign(t, r);
}
function cs(e, t, n) {
	try {
		let r = z(e.data), i, a;
		if (n) {
			let t = 0, n = Vs(r, t++), o = Vs(r, t++);
			i = ls(e.data.subarray(t, t + o)), t += o;
			let s = Vs(r, t++);
			a = ls(e.data.subarray(t, t + s)), Object.assign(e, {
				version: n,
				uid: i,
				gid: a
			});
		} else e.data.length >= 4 && (i = Z(r, 0), a = Z(r, 2), Object.assign(e, {
			uid: i,
			gid: a
		}));
		return i !== void 0 && (t.uid = i), a !== void 0 && (t.gid = a), i !== void 0 || a !== void 0;
	} catch {}
}
function ls(e) {
	let t = new Uint8Array(4);
	return t.set(e, 0), new DataView(t.buffer, t.byteOffset, 4).getUint32(0, !0);
}
function us(e, t, n) {
	if (!e.data.length) return;
	let r = z(e.data), i = Vs(r, 0), a = [], o = [];
	n ? ((i & 1) == 1 && (a.push(ma), o.push(ha)), (i & 2) == 2 && (a.push(ga), o.push(_a)), (i & 4) == 4 && (a.push(va), o.push(ya))) : e.data.length >= 5 && (a.push(ma), o.push(ha));
	let s = 1;
	a.forEach((n, i) => {
		if (e.data.length >= s + 4) {
			let a = Q(r, s);
			t[n] = e[n] = /* @__PURE__ */ new Date((a | 0) * 1e3);
			let c = o[i];
			e[c] = a;
		}
		s += 4;
	});
}
async function ds({ reader: e, fileEntry: t, index: n, offset: r, crc32: i, compressedSize: a, uncompressedSize: o, dataOffset: s, dataDescriptor: c, extraFieldZip64: l, readRanges: u }) {
	let d = 0;
	if (c) {
		let n = !!l, r = z(await q(e, s + a, 24)), c = [
			[n, !0],
			[n, !1],
			[!n, !0],
			[!n, !1]
		].map(([e, t]) => hs(r, e, t)).filter((e) => e && e.compressedSize == a && e.uncompressedSize == o), u = c.find((e) => e.crc32 == i) || c[0] || hs(r, n, !0) || hs(r, n, !1);
		u ? (t.localDirectory.dataDescriptor = u, d = gs(u.zip64, u.signature)) : d = gs(n, !1);
	}
	let f = {
		start: r,
		end: s + a + d,
		fileEntry: t
	}, { indexes: p, sortedRanges: m, pendingRanges: h } = u;
	if (!p.has(n)) {
		let e = fs(m, f) || h.find((e) => ps(f, e));
		if (e) {
			let t = /* @__PURE__ */ Error(ao);
			throw t.overlappingEntry = e.fileEntry, t;
		}
		p.add(n), h.push(f), h.length * h.length > m.length && (h.sort((e, t) => e.start - t.start), u.sortedRanges = ms(m, h), h.length = 0);
	}
}
function fs(e, t) {
	let n = 0, r = e.length;
	for (; n < r;) {
		let i = n + r >>> 1;
		e[i].start < t.start ? n = i + 1 : r = i;
	}
	let i = e[n - 1], a = e[n];
	if (i && ps(t, i)) return i;
	if (a && ps(t, a)) return a;
}
function ps(e, t) {
	return e.start < t.end && t.start < e.end;
}
function ms(e, t) {
	let n = [], r = 0, i = 0;
	for (; r < e.length || i < t.length;) i == t.length || r < e.length && e[r].start < t[i].start ? n.push(e[r++]) : n.push(t[i++]);
	return n;
}
function hs(e, t, n) {
	let r = n ? 4 : 0;
	if (e.byteLength < gs(t, n) || n && Q(e, 0) != 134695760) return;
	let i = Q(e, r), a, o;
	try {
		t ? (a = $(e, r + 4), o = $(e, r + 12)) : (a = Q(e, r + 4), o = Q(e, r + 8));
	} catch {
		return;
	}
	return {
		signature: n,
		zip64: t,
		crc32: i,
		compressedSize: a,
		uncompressedSize: o
	};
}
function gs(e, t) {
	return (e ? 20 : 12) + (t ? 4 : 0);
}
function _s(e, t) {
	return e.getDiskOffset ? e.getDiskOffset(t) : 0;
}
async function vs(e) {
	return await bs(e) == r;
}
async function ys(e) {
	let t = await bs(e);
	return t == 134695760 || t == 808471376;
}
async function bs(e) {
	return Q(z(await q(e, 0, 4)));
}
function xs(e) {
	return e === "strict" || e === "balanced" || e === "tolerant";
}
function Ss(e, t, n) {
	return Math.min(e, n ? t * Wo : t);
}
function Cs(e, t) {
	return ws(e, ws(t, He));
}
function ws(e, t) {
	let n = e[Me];
	if (n !== void 0) {
		if (!xs(n)) throw Error(uo);
		return n;
	}
	let r = e[N];
	return r === void 0 ? t : r ? Ve : t == "tolerant" ? Ue : He;
}
function Ts(e, t) {
	return e === void 0 ? t != Ue : !!e;
}
function Es(e, t) {
	return e === void 0 ? t == Ve : !!e;
}
function Ds(e, t) {
	if (e === void 0) return t;
	if (!xs(e)) throw Error(fo);
	return e;
}
function Os(e, t) {
	if (t == "tolerant") return !1;
	let n = e.split("/");
	return n.length > 1 && n[n.length - 1] === "" && n.pop(), Po.test(e) || e.startsWith("/") || e.startsWith("\\") || No.test(e) ? !0 : t == "strict" && (n.includes(".") || n.includes("") || e.includes("\0"));
}
function ks(e, n) {
	if (e !== void 0) {
		let t = it(e);
		if (typeof t != "number" || Number.isNaN(t) || t < 0) throw Error(po);
		return t;
	}
	return n == "strict" ? 0 : n == "tolerant" ? Infinity : t;
}
async function As(e, n, r) {
	let { size: i } = e, a = Math.min(i, 22 + t), o = { remaining: Uo }, s, c, l = 0;
	for await (let [t, r, u, d, f] of Ms(e, a)) {
		let a = Z(t, d + 20);
		if (f + 22 + a == i) {
			let a = await Ps(e, t, r, d, f, i, o);
			if (a == qo) {
				if (s ||= Ns(u, d, f), l++, !n || l > 1) break;
			} else a == Ko && !c && (c = Ns(u, d, f));
		}
	}
	return s ||= c, s ||= await js(e, r, o), {
		endOfDirectoryInfo: s,
		endOfDirectoryReachingEndCount: l
	};
}
async function js(e, n, r) {
	let { size: i } = e, a = Math.min(i, n == Infinity ? i : 22 + t + n), o, s;
	for await (let [t, n, c, l, u] of Ms(e, a)) {
		let a = Ns(c, l, u);
		o ||= a;
		let d = await Ps(e, t, n, l, u, i, r);
		if (d == qo) return a;
		d == Ko && !s && (s = a);
	}
	return s || o;
}
async function* Ms(e, t) {
	let n = e.size - t, r = await q(e, n, t), i = z(r);
	for (let e = r.length - 22; e >= 0; e--) Q(i, e) == 101010256 && (yield [
		i,
		n,
		r,
		e,
		n + e
	]);
}
function Ns(e, t, n) {
	return {
		offset: n,
		buffer: new Uint8Array(e.subarray(t, t + 22)).buffer
	};
}
async function Ps(e, t, n, r, i, a, o) {
	let s = Z(t, r + 10), c = Q(t, r + 12), l = Q(t, r + 16);
	if (s == 65535 || c == 4294967295 || l == 4294967295) return await Fs(e, t, n, i - 20, a, o) == 117853008 ? qo : Go;
	if (!s && !c) return Ko;
	let u = Z(t, r + 6);
	for (let r of [i - c, _s(e, u) + l]) if (await Fs(e, t, n, r, a, o) == 33639248) return qo;
	return Go;
}
async function Fs(e, t, n, r, i, a) {
	if (!(r < 0 || r + 4 > i)) {
		if (r >= n) return Q(t, r - n);
		if (a.remaining > 0) return a.remaining--, Q(z(await q(e, r, 4)), 0);
	}
}
function Is(e, t, n, r, i) {
	let { rawFilename: a } = e, o = !i, s = e.decryptedDirectory && (t.rawBitFlag & 8192) == 8192;
	r && !s && (n.length != a.length || n.some((e, t) => e != a[t])) && Y(o, i, Oo), (t.rawBitFlag & Ro) != (e.rawBitFlag & Ro) && Y(o, i, ko), t.compressionMethod != e.compressionMethod && Y(o, i, Ao), !t.bitFlag.dataDescriptor && !s && (t.crc32 || t.compressedSize || t.uncompressedSize) && (t.crc32 != e.crc32 || t.compressedSize != e.compressedSize || t.uncompressedSize != e.uncompressedSize) && Y(o, i, jo);
}
function Y(e, t, n) {
	e ? Ls(n) : J(t, n);
}
function Ls(e) {
	let t = /* @__PURE__ */ Error(so);
	throw t.reason = e, t;
}
function X(e, t, n) {
	return t[n] === void 0 ? e.options[n] : t[n];
}
function Rs(e, t, n) {
	return Ze(X(e, t, n));
}
function zs(e) {
	let n = (e & 4294901760) >> 16, r = e & t, i = new Date(1980 + ((n & 65024) >> 9), ((n & 480) >> 5) - 1, n & 31, (r & 63488) >> 11, (r & 2016) >> 5, (r & 31) * 2, 0);
	return i < w ? w : i;
}
function Bs(e) {
	return new Date(Number(e / BigInt(1e4) - BigInt(0xa9730b66800)));
}
function Vs(e, t) {
	return e.getUint8(t);
}
function Z(e, t) {
	return e.getUint16(t, !0);
}
function Q(e, t) {
	return e.getUint32(t, !0);
}
function $(e, t) {
	let n = e.getBigUint64(t, !0);
	if (n > Ho) throw Error(mo);
	return Number(n);
}
//#endregion
export { Ua as $, y as $n, Dt as $t, So as A, Ze as An, $r as At, va as B, i as Bn, dr as Bt, ko as C, Oe as Cn, li as Ct, Eo as D, We as Dn, ui as Dt, Oo as E, me as En, vi as Et, bo as F, Qe as Fn, _r as Ft, Ia as G, d as Gn, cn as Gt, Ea as H, k as Hn, Hn as Ht, Jo as I, $e as In, gr as It, ma as J, m as Jn, Yt as Jt, ba as K, h as Kn, Jt as Kt, Ka as L, it as Ln, vr as Lt, go as M, rt as Mn, Yr as Mt, yo as N, tt as Nn, Zr as Nt, Do as O, Be as On, di as Ot, ho as P, et as Pn, Xr as Pt, ha as Q, S as Qn, xt as Qt, ca as R, v as Rn, hr as Rt, vo as S, ke as Sn, ii as St, jo as T, Ce as Tn, pi as Tt, ja as U, s as Un, yn as Ut, Aa as V, a as Vn, ur as Vt, xa as W, u as Wn, vn as Wt, Sa as X, ee as Xn, kt as Xt, Ca as Y, te as Yn, qt as Yt, wa as Z, b as Zn, Mt as Zt, ro as _, se as _n, aa as _t, co as a, Ee as an, e as ar, Da as at, _o as b, Te as bn, q as bt, Za as c, ye as cn, D as cr, ka as ct, po as d, Ae as dn, A as dr, J as dt, L as en, x as er, Ha as et, uo as f, be as fn, l as fr, Yi as ft, lo as g, _e as gn, Zi as gt, io as h, ce as hn, ta as ht, no as i, Se as in, t as ir, Va as it, wo as j, nt as jn, Qr as jt, Co as k, ze as kn, ei as kt, to as l, xe as ln, r as lr, Ya as lt, ao as m, oe as mn, ea as mt, Xa as n, R as nn, ne as nr, Wa as nt, oo as o, ve as on, C as or, Oa as ot, eo as p, De as pn, c as pr, Xi as pt, ga as q, g as qn, z as qt, $a as r, we as rn, n as rr, ua as rt, Qa as s, Re as sn, w as sr, Ta as st, so as t, je as tn, E as tr, Pa as tt, fo as u, I as un, O as ur, Ja as ut, mo as v, M as vn, ra as vt, Ao as w, he as wn, _i as wt, To as x, ge as xn, wi as xt, xo as y, Le as yn, na as yt, Na as z, o as zn, mr as zt };
