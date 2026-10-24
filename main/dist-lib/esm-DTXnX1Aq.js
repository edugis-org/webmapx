//#region node_modules/fflate/esm/browser.js
var e = Uint8Array, t = Uint16Array, n = Int32Array, r = new e([
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	4,
	4,
	4,
	4,
	5,
	5,
	5,
	5,
	0,
	0,
	0,
	0
]), i = new e([
	0,
	0,
	0,
	0,
	1,
	1,
	2,
	2,
	3,
	3,
	4,
	4,
	5,
	5,
	6,
	6,
	7,
	7,
	8,
	8,
	9,
	9,
	10,
	10,
	11,
	11,
	12,
	12,
	13,
	13,
	0,
	0
]), a = new e([
	16,
	17,
	18,
	0,
	8,
	7,
	9,
	6,
	10,
	5,
	11,
	4,
	12,
	3,
	13,
	2,
	14,
	1,
	15
]), o = function(e, r) {
	for (var i = new t(31), a = 0; a < 31; ++a) i[a] = r += 1 << e[a - 1];
	for (var o = new n(i[30]), a = 1; a < 30; ++a) for (var s = i[a]; s < i[a + 1]; ++s) o[s] = s - i[a] << 5 | a;
	return {
		b: i,
		r: o
	};
}, s = o(r, 2), c = s.b, l = s.r;
c[28] = 258, l[258] = 28;
var u = o(i, 0), d = u.b;
u.r;
for (var f = new t(32768), p = 0; p < 32768; ++p) {
	var m = (p & 43690) >> 1 | (p & 21845) << 1;
	m = (m & 52428) >> 2 | (m & 13107) << 2, m = (m & 61680) >> 4 | (m & 3855) << 4, f[p] = ((m & 65280) >> 8 | (m & 255) << 8) >> 1;
}
for (var h = (function(e, n, r) {
	for (var i = e.length, a = 0, o = new t(n); a < i; ++a) e[a] && ++o[e[a] - 1];
	var s = new t(n);
	for (a = 1; a < n; ++a) s[a] = s[a - 1] + o[a - 1] << 1;
	var c;
	if (r) {
		c = new t(1 << n);
		var l = 15 - n;
		for (a = 0; a < i; ++a) if (e[a]) for (var u = a << 4 | e[a], d = n - e[a], p = s[e[a] - 1]++ << d, m = p | (1 << d) - 1; p <= m; ++p) c[f[p] >> l] = u;
	} else for (c = new t(i), a = 0; a < i; ++a) e[a] && (c[a] = f[s[e[a] - 1]++] >> 15 - e[a]);
	return c;
}), g = new e(288), p = 0; p < 144; ++p) g[p] = 8;
for (var p = 144; p < 256; ++p) g[p] = 9;
for (var p = 256; p < 280; ++p) g[p] = 7;
for (var p = 280; p < 288; ++p) g[p] = 8;
for (var _ = new e(32), p = 0; p < 32; ++p) _[p] = 5;
var ee = /*#__PURE__*/ h(g, 9, 1), te = /*#__PURE__*/ h(_, 5, 1), v = function(e) {
	for (var t = e[0], n = 1; n < e.length; ++n) e[n] > t && (t = e[n]);
	return t;
}, y = function(e, t, n) {
	var r = t / 8 | 0;
	return (e[r] | e[r + 1] << 8) >> (t & 7) & n;
}, ne = function(e, t) {
	var n = t / 8 | 0;
	return (e[n] | e[n + 1] << 8 | e[n + 2] << 16) >> (t & 7);
}, re = function(e) {
	return (e + 7) / 8 | 0;
}, ie = function(t, n, r) {
	return (n == null || n < 0) && (n = 0), (r == null || r > t.length) && (r = t.length), new e(t.subarray(n, r));
}, b = [
	"unexpected EOF",
	"invalid block type",
	"invalid length/literal",
	"invalid distance",
	"stream finished",
	"no stream handler",
	,
	"no callback",
	"invalid UTF-8 data",
	"extra field too long",
	"date not in range 1980-2099",
	"filename too long",
	"stream finishing",
	"invalid zip data"
], x = function(e, t, n) {
	var r = Error(t || b[e]);
	if (r.code = e, Error.captureStackTrace && Error.captureStackTrace(r, x), !n) throw r;
	return r;
}, S = function(t, n, o, s) {
	var l = t.length, u = s ? s.length : 0;
	if (!l || n.f && !n.l) return o || new e(0);
	var f = !o, p = f || n.i != 2, m = n.i;
	f && (o = new e(l * 3));
	var g = function(t) {
		var n = o.length;
		if (t > n) {
			var r = new e(Math.max(n * 2, t));
			r.set(o), o = r;
		}
	}, _ = n.f || 0, b = n.p || 0, S = n.b || 0, C = n.l, w = n.d, T = n.m, E = n.n, D = l * 8;
	do {
		if (!C) {
			_ = y(t, b, 1);
			var O = y(t, b + 1, 3);
			if (b += 3, !O) {
				var k = re(b) + 4, A = t[k - 4] | t[k - 3] << 8, j = k + A;
				if (j > l) {
					m && x(0);
					break;
				}
				p && g(S + A), o.set(t.subarray(k, j), S), n.b = S += A, n.p = b = j * 8, n.f = _;
				continue;
			} else if (O == 1) C = ee, w = te, T = 9, E = 5;
			else if (O == 2) {
				var M = y(t, b, 31) + 257, ae = y(t, b + 10, 15) + 4, N = M + y(t, b + 5, 31) + 1;
				b += 14;
				for (var P = new e(N), F = new e(19), I = 0; I < ae; ++I) F[a[I]] = y(t, b + I * 3, 7);
				b += ae * 3;
				for (var R = v(F), z = (1 << R) - 1, oe = h(F, R, 1), I = 0; I < N;) {
					var B = oe[y(t, b, z)];
					b += B & 15;
					var k = B >> 4;
					if (k < 16) P[I++] = k;
					else {
						var V = 0, H = 0;
						for (k == 16 ? (H = 3 + y(t, b, 3), b += 2, V = P[I - 1]) : k == 17 ? (H = 3 + y(t, b, 7), b += 3) : k == 18 && (H = 11 + y(t, b, 127), b += 7); H--;) P[I++] = V;
					}
				}
				var U = P.subarray(0, M), W = P.subarray(M);
				T = v(U), E = v(W), C = h(U, T, 1), w = h(W, E, 1);
			} else x(1);
			if (b > D) {
				m && x(0);
				break;
			}
		}
		p && g(S + 131072);
		for (var se = (1 << T) - 1, G = (1 << E) - 1, K = b;; K = b) {
			var V = C[ne(t, b) & se], q = V >> 4;
			if (b += V & 15, b > D) {
				m && x(0);
				break;
			}
			if (V || x(2), q < 256) o[S++] = q;
			else if (q == 256) {
				K = b, C = null;
				break;
			} else {
				var ce = q - 254;
				if (q > 264) {
					var I = q - 257, J = r[I];
					ce = y(t, b, (1 << J) - 1) + c[I], b += J;
				}
				var Y = w[ne(t, b) & G], X = Y >> 4;
				Y || x(3), b += Y & 15;
				var W = d[X];
				if (X > 3) {
					var J = i[X];
					W += ne(t, b) & (1 << J) - 1, b += J;
				}
				if (b > D) {
					m && x(0);
					break;
				}
				p && g(S + 131072);
				var Z = S + ce;
				if (S < W) {
					var Q = u - W, $ = Math.min(W, Z);
					for (Q + S < 0 && x(3); S < $; ++S) o[S] = s[Q + S];
				}
				for (; S < Z; ++S) o[S] = o[S - W];
			}
		}
		n.l = C, n.p = K, n.b = S, n.f = _, C && (_ = 1, n.m = T, n.d = w, n.n = E);
	} while (!_);
	return S != o.length && f ? ie(o, 0, S) : o.subarray(0, S);
}, C = /*#__PURE__*/ new e(0), w = function(e) {
	(e[0] != 31 || e[1] != 139 || e[2] != 8) && x(6, "invalid gzip data");
	var t = e[3], n = 10;
	t & 4 && (n += (e[10] | e[11] << 8) + 2);
	for (var r = (t >> 3 & 1) + (t >> 4 & 1); r > 0; r -= !e[n++]);
	return n + (t & 2);
}, T = function(e) {
	var t = e.length;
	return (e[t - 4] | e[t - 3] << 8 | e[t - 2] << 16 | e[t - 1] << 24) >>> 0;
}, E = function(e, t) {
	return ((e[0] & 15) != 8 || e[0] >> 4 > 7 || (e[0] << 8 | e[1]) % 31) && x(6, "invalid zlib data"), (e[1] >> 5 & 1) == +!t && x(6, "invalid zlib data: " + (e[1] & 32 ? "need" : "unexpected") + " dictionary"), (e[1] >> 3 & 4) + 2;
};
function D(e, t) {
	return S(e, { i: 2 }, t && t.out, t && t.dictionary);
}
function O(t, n) {
	var r = w(t);
	return r + 8 > t.length && x(6, "invalid gzip data"), S(t.subarray(r, -8), { i: 2 }, n && n.out || new e(T(t)), n && n.dictionary);
}
function k(e, t) {
	return S(e.subarray(E(e, t && t.dictionary), -4), { i: 2 }, t && t.out, t && t.dictionary);
}
function A(e, t) {
	return e[0] == 31 && e[1] == 139 && e[2] == 8 ? O(e, t) : (e[0] & 15) != 8 || e[0] >> 4 > 7 || (e[0] << 8 | e[1]) % 31 ? D(e, t) : k(e, t);
}
var j = typeof TextDecoder < "u" && /*#__PURE__*/ new TextDecoder();
try {
	j.decode(C, { stream: !0 });
} catch {}
//#endregion
//#region node_modules/pmtiles/dist/esm/index.js
var M = Object.defineProperty, ae = Math.pow, N = (e, t) => M(e, "name", {
	value: t,
	configurable: !0
}), P = (e, t, n) => new Promise((r, i) => {
	var a = (e) => {
		try {
			s(n.next(e));
		} catch (e) {
			i(e);
		}
	}, o = (e) => {
		try {
			s(n.throw(e));
		} catch (e) {
			i(e);
		}
	}, s = (e) => e.done ? r(e.value) : Promise.resolve(e.value).then(a, o);
	s((n = n.apply(e, t)).next());
});
N((e, t) => {
	let n = !1, r = "";
	return new (L.GridLayer.extend({
		createTile: N((t, i) => {
			let a = document.createElement("img"), o = new AbortController(), s = o.signal;
			return a.cancel = () => {
				o.abort();
			}, n ||= (e.getHeader().then((e) => {
				e.tileType === 1 || e.tileType === 6 ? console.error("Error: archive contains vector tiles, but leafletRasterLayer is for displaying raster tiles. See https://github.com/protomaps/PMTiles/tree/main/js for details.") : e.tileType === 2 ? r = "image/png" : e.tileType === 3 ? r = "image/jpeg" : e.tileType === 4 ? r = "image/webp" : e.tileType === 5 && (r = "image/avif");
			}), !0), e.getZxy(t.z, t.x, t.y, s).then((e) => {
				if (e) {
					let t = new Blob([e.data], { type: r });
					a.src = window.URL.createObjectURL(t);
				} else a.style.display = "none";
				a.cancel = void 0, i(void 0, a);
			}).catch((e) => {
				if (e.name !== "AbortError") throw e;
			}), a;
		}, "createTile"),
		_removeTile: N(function(e) {
			let t = this._tiles[e];
			t && (t.el.cancel && t.el.cancel(), t.el.src && window.URL.revokeObjectURL(t.el.src), t.el.width = 0, t.el.height = 0, t.el.deleted = !0, L.DomUtil.remove(t.el), delete this._tiles[e], this.fire("tileunload", {
				tile: t.el,
				coords: this._keyToTileCoords(e)
			}));
		}, "_removeTile")
	}))(t);
}, "leafletRasterLayer");
var F = N((e) => (t, n) => {
	if (n instanceof AbortController) return e(t, n);
	let r = new AbortController();
	return e(t, r).then((e) => n(void 0, e.data, e.cacheControl || "", e.expires || ""), (e) => n(e)).catch((e) => n(e)), { cancel: N(() => r.abort(), "cancel") };
}, "v3compat"), I = class {
	constructor(e) {
		this.tilev4 = N((e, t) => P(this, null, function* () {
			if (e.type === "json") {
				let n = e.url.substr(10), r = this.tiles.get(n);
				if (r || (r = new ge(n), this.tiles.set(n, r)), this.metadata) {
					let n = yield r.getTileJson(e.url);
					return t.signal.throwIfAborted(), { data: n };
				}
				let i = yield r.getHeader();
				return t.signal.throwIfAborted(), (i.minLon >= i.maxLon || i.minLat >= i.maxLat) && console.error(`Bounds of PMTiles archive ${i.minLon},${i.minLat},${i.maxLon},${i.maxLat} are not valid.`), { data: {
					tiles: [`${e.url}/{z}/{x}/{y}`],
					minzoom: i.minZoom,
					maxzoom: i.maxZoom,
					bounds: [
						i.minLon,
						i.minLat,
						i.maxLon,
						i.maxLat
					]
				} };
			}
			let n = /* @__PURE__ */ new RegExp(/pmtiles:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/), r = e.url.match(n);
			if (!r) throw Error("Invalid PMTiles protocol URL");
			let i = r[1], a = this.tiles.get(i);
			a || (a = new ge(i), this.tiles.set(i, a));
			let o = r[2], s = r[3], c = r[4], l = yield a?.getZxy(+o, +s, +c, t.signal);
			if (t.signal.throwIfAborted(), l) return {
				data: new Uint8Array(l.data),
				cacheControl: l.cacheControl,
				expires: l.expires
			};
			let u = yield a.getHeader();
			if (u.tileType === 1 || u.tileType === 6) {
				if (this.errorOnMissingTile) throw Error("Tile not found.");
				return { data: new Uint8Array() };
			}
			return { data: null };
		}), "tilev4"), this.tile = F(this.tilev4), this.tiles = /* @__PURE__ */ new Map(), this.metadata = e?.metadata || !1, this.errorOnMissingTile = e?.errorOnMissingTile || !1;
	}
	add(e) {
		this.tiles.set(e.source.getKey(), e);
	}
	get(e) {
		return this.tiles.get(e);
	}
};
N(I, "Protocol");
var R = I;
function z(e, t) {
	return (t >>> 0) * 4294967296 + (e >>> 0);
}
N(z, "toNum");
function oe(e, t) {
	let n = t.buf, r = n[t.pos++], i = (r & 112) >> 4;
	if (r < 128 || (r = n[t.pos++], i |= (r & 127) << 3, r < 128) || (r = n[t.pos++], i |= (r & 127) << 10, r < 128) || (r = n[t.pos++], i |= (r & 127) << 17, r < 128) || (r = n[t.pos++], i |= (r & 127) << 24, r < 128) || (r = n[t.pos++], i |= (r & 1) << 31, r < 128)) return z(e, i);
	throw Error("Expected varint not more than 10 bytes");
}
N(oe, "readVarintRemainder");
function B(e) {
	let t = e.buf, n = t[e.pos++], r = n & 127;
	return n < 128 || (n = t[e.pos++], r |= (n & 127) << 7, n < 128) || (n = t[e.pos++], r |= (n & 127) << 14, n < 128) || (n = t[e.pos++], r |= (n & 127) << 21, n < 128) ? r : (n = t[e.pos], r |= (n & 15) << 28, oe(r, e));
}
N(B, "readVarint");
function V(e, t, n, r, i) {
	return i === 0 ? r === 0 ? [n, t] : [e - 1 - n, e - 1 - t] : [t, n];
}
N(V, "rotate");
function H(e, t, n) {
	if (e > 26) throw Error("Tile zoom level exceeds max safe number limit (26)");
	if (t >= 1 << e || n >= 1 << e) throw Error("tile x/y outside zoom level bounds");
	let r = ((1 << e) * (1 << e) - 1) / 3, i = e - 1, [a, o] = [t, n];
	for (let e = 1 << i; e > 0; e >>= 1) {
		let t = a & e, n = o & e;
		r += (3 * t ^ n) * (1 << i), [a, o] = V(e, a, o, t, n), i--;
	}
	return r;
}
N(H, "zxyToTileId");
function U(e) {
	let t = 3 * e + 1;
	return t < 4294967296 ? 31 - Math.clz32(t) : 63 - Math.clz32(t / 4294967296);
}
N(U, "tileIdToZ");
function W(e) {
	let t = U(e) >> 1;
	if (t > 26) throw Error("Tile zoom level exceeds max safe number limit (26)");
	let n = e - ((1 << t) * (1 << t) - 1) / 3, r = 0, i = 0, a = 1 << t;
	for (let e = 1; e < a; e <<= 1) {
		let t = e & n / 2, a = e & (n ^ t);
		[r, i] = V(e, r, i, t, a), n /= 2, r += t, i += a;
	}
	return [
		t,
		r,
		i
	];
}
N(W, "tileIdToZxy");
var se = ((e) => (e[e.Unknown = 0] = "Unknown", e[e.None = 1] = "None", e[e.Gzip = 2] = "Gzip", e[e.Brotli = 3] = "Brotli", e[e.Zstd = 4] = "Zstd", e))(se || {});
function G(e, t) {
	return P(this, null, function* () {
		if (t === 1 || t === 0) return e;
		if (t === 2) {
			if (globalThis.DecompressionStream === void 0) return A(new Uint8Array(e));
			let t = new Response(e).body;
			if (!t) throw Error("Failed to read response stream");
			let n = t.pipeThrough(new globalThis.DecompressionStream("gzip"));
			return new Response(n).arrayBuffer();
		}
		throw Error("Compression method not supported");
	});
}
N(G, "defaultDecompress");
var K = ((e) => (e[e.Unknown = 0] = "Unknown", e[e.Mvt = 1] = "Mvt", e[e.Png = 2] = "Png", e[e.Jpeg = 3] = "Jpeg", e[e.Webp = 4] = "Webp", e[e.Avif = 5] = "Avif", e[e.Mlt = 6] = "Mlt", e))(K || {});
function q(e) {
	return e === 1 ? ".mvt" : e === 2 ? ".png" : e === 3 ? ".jpg" : e === 4 ? ".webp" : e === 5 ? ".avif" : e === 6 ? ".mlt" : "";
}
N(q, "tileTypeExt");
var ce = 127;
function J(e, t) {
	let n = 0, r = e.length - 1;
	for (; n <= r;) {
		let i = r + n >> 1, a = t - e[i].tileId;
		if (a > 0) n = i + 1;
		else if (a < 0) r = i - 1;
		else return e[i];
	}
	return r >= 0 && (e[r].runLength === 0 || t - e[r].tileId < e[r].runLength) ? e[r] : null;
}
N(J, "findTile"), N(class {
	constructor(e) {
		this.file = e;
	}
	getKey() {
		return this.file.name;
	}
	getBytes(e, t) {
		return P(this, null, function* () {
			return { data: yield this.file.slice(e, e + t).arrayBuffer() };
		});
	}
}, "FileSource");
var Y = class {
	constructor(e, t = new Headers(), n = void 0) {
		this.url = e, this.customHeaders = t, this.credentials = n, this.mustReload = !1;
		let r = "";
		"navigator" in globalThis && (r = globalThis.navigator?.userAgent ?? "");
		let i = r.indexOf("Windows") > -1, a = /Chrome|Chromium|Edg|OPR|Brave/.test(r);
		this.chromeWindowsNoCache = !1, i && a && (this.chromeWindowsNoCache = !0);
	}
	getKey() {
		return this.url;
	}
	setHeaders(e) {
		this.customHeaders = e;
	}
	getBytes(e, t, n, r) {
		return P(this, null, function* () {
			let i, a;
			n ? a = n : (i = new AbortController(), a = i.signal);
			let o = new Headers(this.customHeaders);
			o.set("range", `bytes=${e}-${e + t - 1}`);
			let s;
			this.mustReload ? s = "reload" : this.chromeWindowsNoCache && (s = "no-store");
			let c = yield fetch(this.url, {
				signal: a,
				cache: s,
				headers: o,
				credentials: this.credentials
			});
			if (e === 0 && c.status === 416) {
				let e = c.headers.get("Content-Range");
				if (!e || !e.startsWith("bytes */")) throw Error("Missing content-length on 416 response");
				let t = +e.substr(8);
				o.set("range", `bytes=0-${t - 1}`), c = yield fetch(this.url, {
					signal: a,
					cache: "reload",
					headers: o,
					credentials: this.credentials
				});
			}
			let l = c.headers.get("Etag");
			if (l != null && l.startsWith("W/") && (l = null), c.status === 416 || r && l && l !== r) throw this.mustReload = !0, new ue(`Server returned non-matching ETag ${r} after one retry. Check browser extensions and servers for issues that may affect correct ETag headers.`);
			if (c.status >= 300) throw Error(`Bad response code: ${c.status}`);
			let u = c.headers.get("Content-Length");
			if (c.status === 200 && (!u || +u > t)) throw i && i.abort(), /* @__PURE__ */ Error("Server returned no content-length header or content-length exceeding request. Check that your storage backend supports HTTP Byte Serving.");
			return {
				data: yield c.arrayBuffer(),
				etag: l || void 0,
				cacheControl: c.headers.get("Cache-Control") || void 0,
				expires: c.headers.get("Expires") || void 0
			};
		});
	}
};
N(Y, "FetchSource");
var X = Y;
function Z(e, t) {
	let n = e.getUint32(t + 4, !0), r = e.getUint32(t + 0, !0);
	return n * ae(2, 32) + r;
}
N(Z, "getUint64");
function Q(e, t) {
	let n = new DataView(e), r = n.getUint8(7);
	if (r > 3) throw Error(`Archive is spec version ${r} but this library supports up to spec version 3`);
	return {
		specVersion: r,
		rootDirectoryOffset: Z(n, 8),
		rootDirectoryLength: Z(n, 16),
		jsonMetadataOffset: Z(n, 24),
		jsonMetadataLength: Z(n, 32),
		leafDirectoryOffset: Z(n, 40),
		leafDirectoryLength: Z(n, 48),
		tileDataOffset: Z(n, 56),
		tileDataLength: Z(n, 64),
		numAddressedTiles: Z(n, 72),
		numTileEntries: Z(n, 80),
		numTileContents: Z(n, 88),
		clustered: n.getUint8(96) === 1,
		internalCompression: n.getUint8(97),
		tileCompression: n.getUint8(98),
		tileType: n.getUint8(99),
		minZoom: n.getUint8(100),
		maxZoom: n.getUint8(101),
		minLon: n.getInt32(102, !0) / 1e7,
		minLat: n.getInt32(106, !0) / 1e7,
		maxLon: n.getInt32(110, !0) / 1e7,
		maxLat: n.getInt32(114, !0) / 1e7,
		centerZoom: n.getUint8(118),
		centerLon: n.getInt32(119, !0) / 1e7,
		centerLat: n.getInt32(123, !0) / 1e7,
		etag: t
	};
}
N(Q, "bytesToHeader");
function $(e) {
	let t = {
		buf: new Uint8Array(e),
		pos: 0
	}, n = B(t), r = [], i = 0;
	for (let e = 0; e < n; e++) {
		let e = B(t);
		r.push({
			tileId: i + e,
			offset: 0,
			length: 0,
			runLength: 1
		}), i += e;
	}
	for (let e = 0; e < n; e++) r[e].runLength = B(t);
	for (let e = 0; e < n; e++) r[e].length = B(t);
	for (let e = 0; e < n; e++) {
		let n = B(t);
		n === 0 && e > 0 ? r[e].offset = r[e - 1].offset + r[e - 1].length : r[e].offset = n - 1;
	}
	return r;
}
N($, "deserializeIndex");
var le = class extends Error {};
N(le, "EtagMismatch");
var ue = le;
function de(e, t) {
	return P(this, null, function* () {
		let n = yield e.getBytes(0, 16384);
		if (new DataView(n.data).getUint16(0, !0) !== 19792) throw Error("Wrong magic number for PMTiles archive");
		let r = Q(n.data.slice(0, ce), n.etag), i = n.data.slice(r.rootDirectoryOffset, r.rootDirectoryOffset + r.rootDirectoryLength), a = `${e.getKey()}|${r.etag || ""}|${r.rootDirectoryOffset}|${r.rootDirectoryLength}`, o = $(yield t(i, r.internalCompression));
		return [r, [
			a,
			o.length,
			o
		]];
	});
}
N(de, "getHeaderAndRoot");
function fe(e, t, n, r, i, a) {
	return P(this, null, function* () {
		let o = $(yield t((yield e.getBytes(n, r, a, i.etag)).data, i.internalCompression));
		if (o.length === 0) throw Error("Empty directory is invalid");
		return o;
	});
}
N(fe, "getDirectory"), N(class {
	constructor(e = 100, t = !0, n = G) {
		this.cache = /* @__PURE__ */ new Map(), this.maxCacheEntries = e, this.counter = 1, this.decompress = n;
	}
	getHeader(e) {
		return P(this, null, function* () {
			let t = e.getKey(), n = this.cache.get(t);
			if (n) return n.lastUsed = this.counter++, n.data;
			let r = yield de(e, this.decompress);
			return r[1] && this.cache.set(r[1][0], {
				lastUsed: this.counter++,
				data: r[1][2]
			}), this.cache.set(t, {
				lastUsed: this.counter++,
				data: r[0]
			}), this.prune(), r[0];
		});
	}
	getDirectory(e, t, n, r, i) {
		return P(this, null, function* () {
			let a = `${e.getKey()}|${r.etag || ""}|${t}|${n}`, o = this.cache.get(a);
			if (o) return o.lastUsed = this.counter++, o.data;
			let s = yield fe(e, this.decompress, t, n, r, i);
			return this.cache.set(a, {
				lastUsed: this.counter++,
				data: s
			}), this.prune(), s;
		});
	}
	prune() {
		if (this.cache.size > this.maxCacheEntries) {
			let e = Infinity, t;
			this.cache.forEach((n, r) => {
				n.lastUsed < e && (e = n.lastUsed, t = r);
			}), t && this.cache.delete(t);
		}
	}
	invalidate(e) {
		return P(this, null, function* () {
			this.cache.delete(e.getKey());
		});
	}
}, "ResolvedValueCache");
var pe = class {
	constructor(e = 100, t = !0, n = G) {
		this.cache = /* @__PURE__ */ new Map(), this.invalidations = /* @__PURE__ */ new Map(), this.pendingFetches = /* @__PURE__ */ new Map(), this.maxCacheEntries = e, this.counter = 1, this.decompress = n;
	}
	getHeader(e) {
		return P(this, null, function* () {
			let t = e.getKey(), n = this.cache.get(t);
			if (n) return n.lastUsed = this.counter++, yield n.data;
			let r = new Promise((t, n) => {
				de(e, this.decompress).then((e) => {
					e[1] && this.cache.set(e[1][0], {
						lastUsed: this.counter++,
						data: Promise.resolve(e[1][2])
					}), t(e[0]), this.prune();
				}).catch((e) => {
					n(e);
				});
			});
			return this.cache.set(t, {
				lastUsed: this.counter++,
				data: r
			}), r;
		});
	}
	trackSignal(e, t, n) {
		t.refs++, n.addEventListener("abort", () => {
			--t.refs <= 0 && this.pendingFetches.get(e) === t && (t.controller.abort(), this.cache.delete(e), this.pendingFetches.delete(e));
		}, { once: !0 });
	}
	getDirectory(e, t, n, r, i) {
		return P(this, null, function* () {
			let a = `${e.getKey()}|${r.etag || ""}|${t}|${n}`, o = this.cache.get(a);
			if (o) {
				o.lastUsed = this.counter++;
				let e = this.pendingFetches.get(a);
				return e && this.trackSignal(a, e, i ?? new AbortController().signal), yield o.data;
			}
			let s = new AbortController(), c = {
				controller: s,
				refs: 0
			};
			this.trackSignal(a, c, i ?? new AbortController().signal), this.pendingFetches.set(a, c);
			let l = new Promise((i, o) => {
				fe(e, this.decompress, t, n, r, s.signal).then((e) => {
					this.pendingFetches.delete(a), i(e), this.prune();
				}).catch((e) => {
					o(e);
				});
			});
			return this.cache.set(a, {
				lastUsed: this.counter++,
				data: l
			}), l;
		});
	}
	prune() {
		if (this.cache.size >= this.maxCacheEntries) {
			let e = Infinity, t;
			this.cache.forEach((n, r) => {
				n.lastUsed < e && (e = n.lastUsed, t = r);
			}), t && this.cache.delete(t);
		}
	}
	invalidate(e) {
		return P(this, null, function* () {
			let t = e.getKey();
			if (this.invalidations.get(t)) return yield this.invalidations.get(t);
			this.cache.delete(e.getKey());
			let n = new Promise((n, r) => {
				this.getHeader(e).then((e) => {
					n(), this.invalidations.delete(t);
				}).catch((e) => {
					r(e);
				});
			});
			this.invalidations.set(t, n);
		});
	}
};
N(pe, "SharedPromiseCache");
var me = pe, he = class {
	constructor(e, t, n) {
		typeof e == "string" ? this.source = new X(e) : this.source = e, n ? this.decompress = n : this.decompress = G, t ? this.cache = t : this.cache = new me();
	}
	getHeader() {
		return P(this, null, function* () {
			return yield this.cache.getHeader(this.source);
		});
	}
	getZxyAttempt(e, t, n, r) {
		return P(this, null, function* () {
			let i = H(e, t, n), a = yield this.cache.getHeader(this.source);
			if (r?.throwIfAborted(), e < a.minZoom || e > a.maxZoom) return;
			let o = a.rootDirectoryOffset, s = a.rootDirectoryLength;
			for (let e = 0; e <= 3; e++) {
				let e = yield this.cache.getDirectory(this.source, o, s, a, r);
				r?.throwIfAborted();
				let t = J(e, i);
				if (t) {
					if (t.runLength > 0) {
						let e = yield this.source.getBytes(a.tileDataOffset + t.offset, t.length, r, a.etag);
						return {
							data: yield this.decompress(e.data, a.tileCompression),
							cacheControl: e.cacheControl,
							expires: e.expires
						};
					}
					o = a.leafDirectoryOffset + t.offset, s = t.length;
				} else return;
			}
			throw Error("Maximum directory depth exceeded");
		});
	}
	getZxy(e, t, n, r) {
		return P(this, null, function* () {
			try {
				return yield this.getZxyAttempt(e, t, n, r);
			} catch (i) {
				if (i instanceof ue) return this.cache.invalidate(this.source), yield this.getZxyAttempt(e, t, n, r);
				throw i;
			}
		});
	}
	getMetadataAttempt() {
		return P(this, null, function* () {
			let e = yield this.cache.getHeader(this.source), t = yield this.source.getBytes(e.jsonMetadataOffset, e.jsonMetadataLength, void 0, e.etag), n = yield this.decompress(t.data, e.internalCompression), r = new TextDecoder("utf-8");
			return JSON.parse(r.decode(n));
		});
	}
	getMetadata() {
		return P(this, null, function* () {
			try {
				return yield this.getMetadataAttempt();
			} catch (e) {
				if (e instanceof ue) return this.cache.invalidate(this.source), yield this.getMetadataAttempt();
				throw e;
			}
		});
	}
	getTileJson(e) {
		return P(this, null, function* () {
			let t = yield this.getHeader(), n = yield this.getMetadata();
			return {
				tilejson: "3.0.0",
				scheme: "xyz",
				tiles: [`${e}/{z}/{x}/{y}${q(t.tileType)}`],
				vector_layers: n.vector_layers,
				attribution: n.attribution,
				description: n.description,
				name: n.name,
				version: n.version,
				bounds: [
					t.minLon,
					t.minLat,
					t.maxLon,
					t.maxLat
				],
				center: [
					t.centerLon,
					t.centerLat,
					t.centerZoom
				],
				minzoom: t.minZoom,
				maxzoom: t.maxZoom
			};
		});
	}
};
N(he, "PMTiles");
var ge = he;
//#endregion
export { ge as n, R as t };
