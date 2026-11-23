import { a as e, t } from "./chunk-HEgqtunE.js";
import { t as n } from "./DataView-vhxkpRlZ.js";
import { t as r } from "./__vite-browser-external-BcgHECGb.js";
import { a as i, c as a, i as o, o as s, s as c, t as l } from "./globals-CD4MOw5J.js";
import u from "ol/layer/WebGLTile";
import d from "ol/source/DataTile";
import { asArray as f } from "ol/color";
//#region node_modules/xml-utils/get-attribute.js
var p = /* @__PURE__ */ t(((e, t) => {
	function n(e, t, n) {
		let r = n && n.debug || !1;
		r && console.log("[xml-utils] getting " + t + " in " + e);
		let i = typeof e == "object" ? e.outer : e, a = i.slice(0, i.indexOf(">") + 1), o = ["\"", "'"];
		for (let e = 0; e < o.length; e++) {
			let n = o[e], i = t + "\\=" + n + "([^" + n + "]*)" + n;
			r && console.log("[xml-utils] pattern:", i);
			let s = new RegExp(i).exec(a);
			if (r && console.log("[xml-utils] match:", s), s) return s[1];
		}
	}
	t.exports = n, t.exports.default = n;
})), m = /* @__PURE__ */ t(((e, t) => {
	function n(e, t, n) {
		let r = new RegExp(t).exec(e.slice(n));
		return r ? n + r.index : -1;
	}
	t.exports = n, t.exports.default = n;
})), h = /* @__PURE__ */ t(((e, t) => {
	function n(e, t, n) {
		let r = new RegExp(t).exec(e.slice(n));
		return r ? n + r.index + r[0].length - 1 : -1;
	}
	t.exports = n, t.exports.default = n;
})), g = /* @__PURE__ */ t(((e, t) => {
	function n(e, t) {
		let n = new RegExp(t, "g"), r = e.match(n);
		return r ? r.length : 0;
	}
	t.exports = n, t.exports.default = n;
})), _ = /* @__PURE__ */ t(((e, t) => {
	var n = m(), r = h(), i = g();
	function a(e, t, a) {
		let o = a && a.debug || !1, s = a && a.startIndex || 0;
		o && console.log("[xml-utils] starting findTagByName with", t, " and ", a);
		let c = n(e, `\<${t}[ \n\>\/]`, s);
		if (o && console.log("[xml-utils] start:", c), c === -1) return;
		let l = e.slice(c + t.length), u = r(l, "^[^<]*[ /]>", 0), d = u !== -1 && l[u - 1] === "/";
		if (o && console.log("[xml-utils] selfClosing:", d), d === !1) {
			let e = 0, n = 1, a = 0;
			for (; (u = r(l, "[ /]" + t + ">", e)) !== -1;) {
				let r = l.substring(e, u + 1);
				if (n += i(r, "<" + t + "[ \n	>]"), a += i(r, "</" + t + ">"), a >= n) break;
				e = u;
			}
		}
		let f = c + t.length + u + 1;
		if (o && console.log("[xml-utils] end:", f), f === -1) return;
		let p = e.slice(c, f), m;
		return m = d ? null : p.slice(p.indexOf(">") + 1, p.lastIndexOf("<")), {
			inner: m,
			outer: p,
			start: c,
			end: f
		};
	}
	t.exports = a, t.exports.default = a;
})), v = /* @__PURE__ */ t(((e, t) => {
	var n = _();
	function r(e, t, r) {
		let i = [], a = r && r.debug || !1, o = r && typeof r.nested == "boolean" ? r.nested : !0, s = r && r.startIndex || 0, c;
		for (; c = n(e, t, {
			debug: a,
			startIndex: s
		});) s = o ? c.start + 1 + t.length : c.end, i.push(c);
		return a && console.log("findTagsByName found", i.length, "tags"), i;
	}
	t.exports = r, t.exports.default = r;
})), y = /* @__PURE__ */ e(p(), 1), b = /* @__PURE__ */ e(v(), 1);
function x(e, t) {
	let { width: n, height: r } = e, i = new Uint8Array(n * r * 3), a;
	for (let n = 0, r = 0; n < e.length; ++n, r += 3) a = 256 - e[n] / t * 256, i[r] = a, i[r + 1] = a, i[r + 2] = a;
	return i;
}
function S(e, t) {
	let { width: n, height: r } = e, i = new Uint8Array(n * r * 3), a;
	for (let n = 0, r = 0; n < e.length; ++n, r += 3) a = e[n] / t * 256, i[r] = a, i[r + 1] = a, i[r + 2] = a;
	return i;
}
function C(e, t) {
	let { width: n, height: r } = e, i = new Uint8Array(n * r * 3), a = t.length / 3, o = t.length / 3 * 2;
	for (let n = 0, r = 0; n < e.length; ++n, r += 3) {
		let s = e[n];
		i[r] = t[s] / 65536 * 256, i[r + 1] = t[s + a] / 65536 * 256, i[r + 2] = t[s + o] / 65536 * 256;
	}
	return i;
}
function w(e) {
	let { width: t, height: n } = e, r = new Uint8Array(t * n * 3);
	for (let t = 0, n = 0; t < e.length; t += 4, n += 3) {
		let i = e[t], a = e[t + 1], o = e[t + 2], s = e[t + 3];
		r[n] = 255 * ((255 - i) / 256) * ((255 - s) / 256), r[n + 1] = 255 * ((255 - a) / 256) * ((255 - s) / 256), r[n + 2] = 255 * ((255 - o) / 256) * ((255 - s) / 256);
	}
	return r;
}
function T(e) {
	let { width: t, height: n } = e, r = new Uint8ClampedArray(t * n * 3);
	for (let t = 0, n = 0; t < e.length; t += 3, n += 3) {
		let i = e[t], a = e[t + 1], o = e[t + 2];
		r[n] = i + 1.402 * (o - 128), r[n + 1] = i - .34414 * (a - 128) - .71414 * (o - 128), r[n + 2] = i + 1.772 * (a - 128);
	}
	return r;
}
var E = .95047, ee = 1, te = 1.08883;
function ne(e) {
	let { width: t, height: n } = e, r = new Uint8Array(t * n * 3);
	for (let t = 0, n = 0; t < e.length; t += 3, n += 3) {
		let i = e[t + 0], a = e[t + 1] << 24 >> 24, o = e[t + 2] << 24 >> 24, s = (i + 16) / 116, c = a / 500 + s, l = s - o / 200, u, d, f;
		c = E * (c * c * c > .008856 ? c * c * c : (c - 16 / 116) / 7.787), s = ee * (s * s * s > .008856 ? s * s * s : (s - 16 / 116) / 7.787), l = te * (l * l * l > .008856 ? l * l * l : (l - 16 / 116) / 7.787), u = c * 3.2406 + s * -1.5372 + l * -.4986, d = c * -.9689 + s * 1.8758 + l * .0415, f = c * .0557 + s * -.204 + l * 1.057, u = u > .0031308 ? 1.055 * u ** (1 / 2.4) - .055 : 12.92 * u, d = d > .0031308 ? 1.055 * d ** (1 / 2.4) - .055 : 12.92 * d, f = f > .0031308 ? 1.055 * f ** (1 / 2.4) - .055 : 12.92 * f, r[n] = Math.max(0, Math.min(1, u)) * 255, r[n + 1] = Math.max(0, Math.min(1, d)) * 255, r[n + 2] = Math.max(0, Math.min(1, f)) * 255;
	}
	return r;
}
//#endregion
//#region node_modules/geotiff/dist-module/compression/index.js
var D = /* @__PURE__ */ new Map();
function O(e, t) {
	Array.isArray(e) || (e = [e]), e.forEach((e) => D.set(e, t));
}
async function k(e) {
	let t = D.get(e.Compression);
	if (!t) throw Error(`Unknown compression method identifier: ${e.Compression}`);
	return new (await (t()))(e);
}
O([void 0, 1], () => import("./raw-ByHadOQ0.js").then((e) => e.default)), O(5, () => import("./lzw-F6ACoKfZ.js").then((e) => e.default)), O(6, () => {
	throw Error("old style JPEG compression is not supported.");
}), O(7, () => import("./jpeg-DuVh3VYk.js").then((e) => e.default)), O([8, 32946], () => import("./deflate-CLFYhG92.js").then((e) => e.default)), O(32773, () => import("./packbits-D5mdkGxf.js").then((e) => e.default)), O(34887, () => import("./lerc-CpBRr8-g.js").then(async (e) => (await e.zstd.init(), e)).then((e) => e.default)), O(50001, () => import("./webimage-BlWGQ0dT.js").then((e) => e.default));
//#endregion
//#region node_modules/geotiff/dist-module/resample.js
function A(e, t, n, r = 1) {
	return new (Object.getPrototypeOf(e)).constructor(t * n * r);
}
function re(e, t, n, r, i) {
	let a = t / r, o = n / i;
	return e.map((e) => {
		let s = A(e, r, i);
		for (let c = 0; c < i; ++c) {
			let i = Math.min(Math.round(o * c), n - 1);
			for (let n = 0; n < r; ++n) {
				let o = Math.min(Math.round(a * n), t - 1), l = e[i * t + o];
				s[c * r + n] = l;
			}
		}
		return s;
	});
}
function j(e, t, n) {
	return (1 - n) * e + n * t;
}
function ie(e, t, n, r, i) {
	let a = t / r, o = n / i;
	return e.map((e) => {
		let s = A(e, r, i);
		for (let c = 0; c < i; ++c) {
			let i = o * c, l = Math.floor(i), u = Math.min(Math.ceil(i), n - 1);
			for (let n = 0; n < r; ++n) {
				let o = a * n, d = o % 1, f = Math.floor(o), p = Math.min(Math.ceil(o), t - 1), m = e[l * t + f], h = e[l * t + p], g = e[u * t + f], _ = e[u * t + p], v = j(j(m, h, d), j(g, _, d), i % 1);
				s[c * r + n] = v;
			}
		}
		return s;
	});
}
function ae(e, t, n, r, i, a = "nearest") {
	switch (a.toLowerCase()) {
		case "nearest": return re(e, t, n, r, i);
		case "bilinear":
		case "linear": return ie(e, t, n, r, i);
		default: throw Error(`Unsupported resampling method: '${a}'`);
	}
}
function oe(e, t, n, r, i, a) {
	let o = t / r, s = n / i, c = A(e, r, i, a);
	for (let l = 0; l < i; ++l) {
		let i = Math.min(Math.round(s * l), n - 1);
		for (let n = 0; n < r; ++n) {
			let s = Math.min(Math.round(o * n), t - 1);
			for (let o = 0; o < a; ++o) {
				let u = e[i * t * a + s * a + o];
				c[l * r * a + n * a + o] = u;
			}
		}
	}
	return c;
}
function se(e, t, n, r, i, a) {
	let o = t / r, s = n / i, c = A(e, r, i, a);
	for (let l = 0; l < i; ++l) {
		let i = s * l, u = Math.floor(i), d = Math.min(Math.ceil(i), n - 1);
		for (let n = 0; n < r; ++n) {
			let s = o * n, f = s % 1, p = Math.floor(s), m = Math.min(Math.ceil(s), t - 1);
			for (let o = 0; o < a; ++o) {
				let s = e[u * t * a + p * a + o], h = e[u * t * a + m * a + o], g = e[d * t * a + p * a + o], _ = e[d * t * a + m * a + o], v = j(j(s, h, f), j(g, _, f), i % 1);
				c[l * r * a + n * a + o] = v;
			}
		}
	}
	return c;
}
function ce(e, t, n, r, i, a, o = "nearest") {
	switch (o.toLowerCase()) {
		case "nearest": return oe(e, t, n, r, i, a);
		case "bilinear":
		case "linear": return se(e, t, n, r, i, a);
		default: throw Error(`Unsupported resampling method: '${o}'`);
	}
}
//#endregion
//#region node_modules/geotiff/dist-module/geotiffimage.js
function le(e, t, n) {
	let r = 0;
	for (let i = t; i < n; ++i) r += e[i];
	return r;
}
function M(e, t, n) {
	switch (e) {
		case 1:
			if (t <= 8) return new Uint8Array(n);
			if (t <= 16) return new Uint16Array(n);
			if (t <= 32) return new Uint32Array(n);
			break;
		case 2:
			if (t === 8) return new Int8Array(n);
			if (t === 16) return new Int16Array(n);
			if (t === 32) return new Int32Array(n);
			break;
		case 3:
			switch (t) {
				case 16:
				case 32: return new Float32Array(n);
				case 64: return new Float64Array(n);
				default: break;
			}
			break;
		default: break;
	}
	throw Error("Unsupported data format/bitsPerSample");
}
function ue(e, t) {
	return (e === 1 || e === 2) && t <= 32 && t % 8 == 0 ? !1 : !(e === 3 && (t === 16 || t === 32 || t === 64));
}
function de(e, t, n, r, i, a, o) {
	let s = new DataView(e), c = n === 2 ? o * a : o * a * r, l = n === 2 ? 1 : r, u = M(t, i, c), d = parseInt("1".repeat(i), 2);
	if (t === 1) {
		let e;
		e = n === 1 ? r * i : i;
		let t = a * e;
		t & 7 && (t = t + 7 & -8);
		for (let e = 0; e < o; ++e) {
			let n = e * t;
			for (let t = 0; t < a; ++t) {
				let r = n + t * l * i;
				for (let n = 0; n < l; ++n) {
					let o = r + n * i, c = (e * a + t) * l + n, f = Math.floor(o / 8), p = o % 8;
					p + i <= 8 ? u[c] = s.getUint8(f) >> 8 - i - p & d : p + i <= 16 ? u[c] = s.getUint16(f) >> 16 - i - p & d : p + i <= 24 ? u[c] = (s.getUint16(f) << 8 | s.getUint8(f + 2)) >> 24 - i - p & d : u[c] = s.getUint32(f) >> 32 - i - p & d;
				}
			}
		}
	}
	return u.buffer;
}
var fe = class {
	constructor(e, t, n, r, i, a) {
		this.fileDirectory = e, this.geoKeys = t, this.dataView = n, this.littleEndian = r, this.tiles = i ? {} : null, this.isTiled = !e.StripOffsets;
		let o = e.PlanarConfiguration;
		if (this.planarConfiguration = o === void 0 ? 1 : o, this.planarConfiguration !== 1 && this.planarConfiguration !== 2) throw Error("Invalid planar configuration.");
		this.source = a;
	}
	getFileDirectory() {
		return this.fileDirectory;
	}
	getGeoKeys() {
		return this.geoKeys;
	}
	getWidth() {
		return this.fileDirectory.ImageWidth;
	}
	getHeight() {
		return this.fileDirectory.ImageLength;
	}
	getSamplesPerPixel() {
		return this.fileDirectory.SamplesPerPixel === void 0 ? 1 : this.fileDirectory.SamplesPerPixel;
	}
	getTileWidth() {
		return this.isTiled ? this.fileDirectory.TileWidth : this.getWidth();
	}
	getTileHeight() {
		return this.isTiled ? this.fileDirectory.TileLength : this.fileDirectory.RowsPerStrip === void 0 ? this.getHeight() : Math.min(this.fileDirectory.RowsPerStrip, this.getHeight());
	}
	getBlockWidth() {
		return this.getTileWidth();
	}
	getBlockHeight(e) {
		return this.isTiled || (e + 1) * this.getTileHeight() <= this.getHeight() ? this.getTileHeight() : this.getHeight() - e * this.getTileHeight();
	}
	getBytesPerPixel() {
		let e = 0;
		for (let t = 0; t < this.fileDirectory.BitsPerSample.length; ++t) e += this.getSampleByteSize(t);
		return e;
	}
	getSampleByteSize(e) {
		if (e >= this.fileDirectory.BitsPerSample.length) throw RangeError(`Sample index ${e} is out of range.`);
		return Math.ceil(this.fileDirectory.BitsPerSample[e] / 8);
	}
	getReaderForSample(e) {
		let t = this.fileDirectory.SampleFormat ? this.fileDirectory.SampleFormat[e] : 1, r = this.fileDirectory.BitsPerSample[e];
		switch (t) {
			case 1:
				if (r <= 8) return DataView.prototype.getUint8;
				if (r <= 16) return DataView.prototype.getUint16;
				if (r <= 32) return DataView.prototype.getUint32;
				break;
			case 2:
				if (r <= 8) return DataView.prototype.getInt8;
				if (r <= 16) return DataView.prototype.getInt16;
				if (r <= 32) return DataView.prototype.getInt32;
				break;
			case 3:
				switch (r) {
					case 16: return function(e, t) {
						return n(this, e, t);
					};
					case 32: return DataView.prototype.getFloat32;
					case 64: return DataView.prototype.getFloat64;
					default: break;
				}
				break;
			default: break;
		}
		throw Error("Unsupported data format/bitsPerSample");
	}
	getSampleFormat(e = 0) {
		return this.fileDirectory.SampleFormat ? this.fileDirectory.SampleFormat[e] : 1;
	}
	getBitsPerSample(e = 0) {
		return this.fileDirectory.BitsPerSample[e];
	}
	getArrayForSample(e, t) {
		return M(this.getSampleFormat(e), this.getBitsPerSample(e), t);
	}
	async getTileOrStrip(e, t, n, r, i) {
		let a = Math.ceil(this.getWidth() / this.getTileWidth()), o = Math.ceil(this.getHeight() / this.getTileHeight()), s, { tiles: c } = this;
		this.planarConfiguration === 1 ? s = t * a + e : this.planarConfiguration === 2 && (s = n * a * o + t * a + e);
		let l, u;
		this.isTiled ? (l = this.fileDirectory.TileOffsets[s], u = this.fileDirectory.TileByteCounts[s]) : (l = this.fileDirectory.StripOffsets[s], u = this.fileDirectory.StripByteCounts[s]);
		let d = (await this.source.fetch([{
			offset: l,
			length: u
		}], i))[0], f;
		return c === null || !c[s] ? (f = (async () => {
			let e = await r.decode(this.fileDirectory, d), n = this.getSampleFormat(), i = this.getBitsPerSample();
			return ue(n, i) && (e = de(e, n, this.planarConfiguration, this.getSamplesPerPixel(), i, this.getTileWidth(), this.getBlockHeight(t))), e;
		})(), c !== null && (c[s] = f)) : f = c[s], {
			x: e,
			y: t,
			sample: n,
			data: await f
		};
	}
	async _readRaster(e, t, n, r, i, a, o, s, c) {
		let l = this.getTileWidth(), u = this.getTileHeight(), d = this.getWidth(), f = this.getHeight(), p = Math.max(Math.floor(e[0] / l), 0), m = Math.min(Math.ceil(e[2] / l), Math.ceil(d / l)), h = Math.max(Math.floor(e[1] / u), 0), g = Math.min(Math.ceil(e[3] / u), Math.ceil(f / u)), _ = e[2] - e[0], v = this.getBytesPerPixel(), y = [], b = [];
		for (let e = 0; e < t.length; ++e) this.planarConfiguration === 1 ? y.push(le(this.fileDirectory.BitsPerSample, 0, t[e]) / 8) : y.push(0), b.push(this.getReaderForSample(t[e]));
		let x = [], { littleEndian: S } = this;
		for (let a = h; a < g; ++a) for (let o = p; o < m; ++o) {
			let s;
			this.planarConfiguration === 1 && (s = this.getTileOrStrip(o, a, 0, i, c));
			for (let p = 0; p < t.length; ++p) {
				let m = p, h = t[p];
				this.planarConfiguration === 2 && (v = this.getSampleByteSize(h), s = this.getTileOrStrip(o, a, h, i, c));
				let g = s.then((i) => {
					let a = i.data, o = new DataView(a), s = this.getBlockHeight(i.y), c = i.y * u, p = i.x * l, h = c + s, g = (i.x + 1) * l, x = b[m], C = Math.min(s, s - (h - e[3]), f - c), w = Math.min(l, l - (g - e[2]), d - p);
					for (let i = Math.max(0, e[1] - c); i < C; ++i) for (let a = Math.max(0, e[0] - p); a < w; ++a) {
						let s = (i * l + a) * v, u = x.call(o, s + y[m], S), d;
						r ? (d = (i + c - e[1]) * _ * t.length + (a + p - e[0]) * t.length + m, n[d] = u) : (d = (i + c - e[1]) * _ + a + p - e[0], n[m][d] = u);
					}
				});
				x.push(g);
			}
		}
		if (await Promise.all(x), a && e[2] - e[0] !== a || o && e[3] - e[1] !== o) {
			let i;
			return i = r ? ce(n, e[2] - e[0], e[3] - e[1], a, o, t.length, s) : ae(n, e[2] - e[0], e[3] - e[1], a, o, s), i.width = a, i.height = o, i;
		}
		return n.width = a || e[2] - e[0], n.height = o || e[3] - e[1], n;
	}
	async readRasters({ window: e, samples: t = [], interleave: n, pool: r = null, width: i, height: a, resampleMethod: o, fillValue: s, signal: c } = {}) {
		let l = e || [
			0,
			0,
			this.getWidth(),
			this.getHeight()
		];
		if (l[0] > l[2] || l[1] > l[3]) throw Error("Invalid subsets");
		let u = (l[2] - l[0]) * (l[3] - l[1]), d = this.getSamplesPerPixel();
		if (!t || !t.length) for (let e = 0; e < d; ++e) t.push(e);
		else for (let e = 0; e < t.length; ++e) if (t[e] >= d) return Promise.reject(/* @__PURE__ */ RangeError(`Invalid sample index '${t[e]}'.`));
		let f;
		if (n) f = M(this.fileDirectory.SampleFormat ? Math.max.apply(null, this.fileDirectory.SampleFormat) : 1, Math.max.apply(null, this.fileDirectory.BitsPerSample), u * t.length), s && f.fill(s);
		else {
			f = [];
			for (let e = 0; e < t.length; ++e) {
				let n = this.getArrayForSample(t[e], u);
				Array.isArray(s) && e < s.length ? n.fill(s[e]) : s && !Array.isArray(s) && n.fill(s), f.push(n);
			}
		}
		let p = r || await k(this.fileDirectory);
		return await this._readRaster(l, t, f, n, p, i, a, o, c);
	}
	async readRGB({ window: e, interleave: t = !0, pool: n = null, width: r, height: i, resampleMethod: o, enableAlpha: s = !1, signal: c } = {}) {
		let u = e || [
			0,
			0,
			this.getWidth(),
			this.getHeight()
		];
		if (u[0] > u[2] || u[1] > u[3]) throw Error("Invalid subsets");
		let d = this.fileDirectory.PhotometricInterpretation;
		if (d === a.RGB) {
			let a = [
				0,
				1,
				2
			];
			if (this.fileDirectory.ExtraSamples !== l.Unspecified && s) {
				a = [];
				for (let e = 0; e < this.fileDirectory.BitsPerSample.length; e += 1) a.push(e);
			}
			return this.readRasters({
				window: e,
				interleave: t,
				samples: a,
				pool: n,
				width: r,
				height: i,
				resampleMethod: o,
				signal: c
			});
		}
		let f;
		switch (d) {
			case a.WhiteIsZero:
			case a.BlackIsZero:
			case a.Palette:
				f = [0];
				break;
			case a.CMYK:
				f = [
					0,
					1,
					2,
					3
				];
				break;
			case a.YCbCr:
			case a.CIELab:
				f = [
					0,
					1,
					2
				];
				break;
			default: throw Error("Invalid or unsupported photometric interpretation.");
		}
		let p = {
			window: u,
			interleave: !0,
			samples: f,
			pool: n,
			width: r,
			height: i,
			resampleMethod: o,
			signal: c
		}, { fileDirectory: m } = this, h = await this.readRasters(p), g = 2 ** this.fileDirectory.BitsPerSample[0], _;
		switch (d) {
			case a.WhiteIsZero:
				_ = x(h, g);
				break;
			case a.BlackIsZero:
				_ = S(h, g);
				break;
			case a.Palette:
				_ = C(h, m.ColorMap);
				break;
			case a.CMYK:
				_ = w(h);
				break;
			case a.YCbCr:
				_ = T(h);
				break;
			case a.CIELab:
				_ = ne(h);
				break;
			default: throw Error("Unsupported photometric interpretation.");
		}
		if (!t) {
			let e = new Uint8Array(_.length / 3), t = new Uint8Array(_.length / 3), n = new Uint8Array(_.length / 3);
			for (let r = 0, i = 0; r < _.length; r += 3, ++i) e[i] = _[r], t[i] = _[r + 1], n[i] = _[r + 2];
			_ = [
				e,
				t,
				n
			];
		}
		return _.width = h.width, _.height = h.height, _;
	}
	getTiePoints() {
		if (!this.fileDirectory.ModelTiepoint) return [];
		let e = [];
		for (let t = 0; t < this.fileDirectory.ModelTiepoint.length; t += 6) e.push({
			i: this.fileDirectory.ModelTiepoint[t],
			j: this.fileDirectory.ModelTiepoint[t + 1],
			k: this.fileDirectory.ModelTiepoint[t + 2],
			x: this.fileDirectory.ModelTiepoint[t + 3],
			y: this.fileDirectory.ModelTiepoint[t + 4],
			z: this.fileDirectory.ModelTiepoint[t + 5]
		});
		return e;
	}
	getGDALMetadata(e = null) {
		let t = {};
		if (!this.fileDirectory.GDAL_METADATA) return null;
		let n = this.fileDirectory.GDAL_METADATA, r = (0, b.default)(n, "Item");
		r = e === null ? r.filter((e) => (0, y.default)(e, "sample") === void 0) : r.filter((t) => Number((0, y.default)(t, "sample")) === e);
		for (let e = 0; e < r.length; ++e) {
			let n = r[e];
			t[(0, y.default)(n, "name")] = n.inner;
		}
		return t;
	}
	getGDALNoData() {
		if (!this.fileDirectory.GDAL_NODATA) return null;
		let e = this.fileDirectory.GDAL_NODATA;
		return Number(e.substring(0, e.length - 1));
	}
	getOrigin() {
		let e = this.fileDirectory.ModelTiepoint, t = this.fileDirectory.ModelTransformation;
		if (e && e.length === 6) return [
			e[3],
			e[4],
			e[5]
		];
		if (t) return [
			t[3],
			t[7],
			t[11]
		];
		throw Error("The image does not have an affine transformation.");
	}
	getResolution(e = null) {
		let t = this.fileDirectory.ModelPixelScale, n = this.fileDirectory.ModelTransformation;
		if (t) return [
			t[0],
			-t[1],
			t[2]
		];
		if (n) return n[1] === 0 && n[4] === 0 ? [
			n[0],
			-n[5],
			n[10]
		] : [
			Math.sqrt(n[0] * n[0] + n[4] * n[4]),
			-Math.sqrt(n[1] * n[1] + n[5] * n[5]),
			n[10]
		];
		if (e) {
			let [t, n, r] = e.getResolution();
			return [
				t * e.getWidth() / this.getWidth(),
				n * e.getHeight() / this.getHeight(),
				r * e.getWidth() / this.getWidth()
			];
		}
		throw Error("The image does not have an affine transformation.");
	}
	pixelIsArea() {
		return this.geoKeys.GTRasterTypeGeoKey === 1;
	}
	getBoundingBox(e = !1) {
		let t = this.getHeight(), n = this.getWidth();
		if (this.fileDirectory.ModelTransformation && !e) {
			let [e, r, i, a, o, s, c, l] = this.fileDirectory.ModelTransformation, u = [
				[0, 0],
				[0, t],
				[n, 0],
				[n, t]
			].map(([t, n]) => [a + e * t + r * n, l + o * t + s * n]), d = u.map((e) => e[0]), f = u.map((e) => e[1]);
			return [
				Math.min(...d),
				Math.min(...f),
				Math.max(...d),
				Math.max(...f)
			];
		} else {
			let e = this.getOrigin(), r = this.getResolution(), i = e[0], a = e[1], o = i + r[0] * n, s = a + r[1] * t;
			return [
				Math.min(i, o),
				Math.min(a, s),
				Math.max(i, o),
				Math.max(a, s)
			];
		}
	}
}, pe = class {
	constructor(e) {
		this._dataView = new DataView(e);
	}
	get buffer() {
		return this._dataView.buffer;
	}
	getUint64(e, t) {
		let n = this.getUint32(e, t), r = this.getUint32(e + 4, t), i;
		if (t) {
			if (i = n + 2 ** 32 * r, !Number.isSafeInteger(i)) throw Error(`${i} exceeds MAX_SAFE_INTEGER. Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues`);
			return i;
		}
		if (i = 2 ** 32 * n + r, !Number.isSafeInteger(i)) throw Error(`${i} exceeds MAX_SAFE_INTEGER. Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues`);
		return i;
	}
	getInt64(e, t) {
		let n = 0, r = (this._dataView.getUint8(e + (t ? 7 : 0)) & 128) > 0, i = !0;
		for (let a = 0; a < 8; a++) {
			let o = this._dataView.getUint8(e + (t ? a : 7 - a));
			r && (i ? o !== 0 && (o = ~(o - 1) & 255, i = !1) : o = ~o & 255), n += o * 256 ** a;
		}
		return r && (n = -n), n;
	}
	getUint8(e, t) {
		return this._dataView.getUint8(e, t);
	}
	getInt8(e, t) {
		return this._dataView.getInt8(e, t);
	}
	getUint16(e, t) {
		return this._dataView.getUint16(e, t);
	}
	getInt16(e, t) {
		return this._dataView.getInt16(e, t);
	}
	getUint32(e, t) {
		return this._dataView.getUint32(e, t);
	}
	getInt32(e, t) {
		return this._dataView.getInt32(e, t);
	}
	getFloat16(e, t) {
		return n(this._dataView, e, t);
	}
	getFloat32(e, t) {
		return this._dataView.getFloat32(e, t);
	}
	getFloat64(e, t) {
		return this._dataView.getFloat64(e, t);
	}
}, me = class {
	constructor(e, t, n, r) {
		this._dataView = new DataView(e), this._sliceOffset = t, this._littleEndian = n, this._bigTiff = r;
	}
	get sliceOffset() {
		return this._sliceOffset;
	}
	get sliceTop() {
		return this._sliceOffset + this.buffer.byteLength;
	}
	get littleEndian() {
		return this._littleEndian;
	}
	get bigTiff() {
		return this._bigTiff;
	}
	get buffer() {
		return this._dataView.buffer;
	}
	covers(e, t) {
		return this.sliceOffset <= e && this.sliceTop >= e + t;
	}
	readUint8(e) {
		return this._dataView.getUint8(e - this._sliceOffset, this._littleEndian);
	}
	readInt8(e) {
		return this._dataView.getInt8(e - this._sliceOffset, this._littleEndian);
	}
	readUint16(e) {
		return this._dataView.getUint16(e - this._sliceOffset, this._littleEndian);
	}
	readInt16(e) {
		return this._dataView.getInt16(e - this._sliceOffset, this._littleEndian);
	}
	readUint32(e) {
		return this._dataView.getUint32(e - this._sliceOffset, this._littleEndian);
	}
	readInt32(e) {
		return this._dataView.getInt32(e - this._sliceOffset, this._littleEndian);
	}
	readFloat32(e) {
		return this._dataView.getFloat32(e - this._sliceOffset, this._littleEndian);
	}
	readFloat64(e) {
		return this._dataView.getFloat64(e - this._sliceOffset, this._littleEndian);
	}
	readUint64(e) {
		let t = this.readUint32(e), n = this.readUint32(e + 4), r;
		if (this._littleEndian) {
			if (r = t + 2 ** 32 * n, !Number.isSafeInteger(r)) throw Error(`${r} exceeds MAX_SAFE_INTEGER. Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues`);
			return r;
		}
		if (r = 2 ** 32 * t + n, !Number.isSafeInteger(r)) throw Error(`${r} exceeds MAX_SAFE_INTEGER. Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues`);
		return r;
	}
	readInt64(e) {
		let t = 0, n = (this._dataView.getUint8(e + (this._littleEndian ? 7 : 0)) & 128) > 0, r = !0;
		for (let i = 0; i < 8; i++) {
			let a = this._dataView.getUint8(e + (this._littleEndian ? i : 7 - i));
			n && (r ? a !== 0 && (a = ~(a - 1) & 255, r = !1) : a = ~a & 255), t += a * 256 ** i;
		}
		return n && (t = -t), t;
	}
	readOffset(e) {
		return this._bigTiff ? this.readUint64(e) : this.readUint32(e);
	}
}, N = "\r\n\r\n";
function P(e) {
	if (Object.fromEntries !== void 0) return Object.fromEntries(e);
	let t = {};
	for (let [n, r] of e) t[n.toLowerCase()] = r;
	return t;
}
function F(e) {
	return P(e.split("\r\n").map((e) => {
		let t = e.split(":").map((e) => e.trim());
		return t[0] = t[0].toLowerCase(), t;
	}));
}
function I(e) {
	let [t, ...n] = e.split(";").map((e) => e.trim());
	return {
		type: t,
		params: P(n.map((e) => e.split("=")))
	};
}
function L(e) {
	let t, n, r;
	return e && ([, t, n, r] = e.match(/bytes (\d+)-(\d+)\/(\d+)/), t = parseInt(t, 10), n = parseInt(n, 10), r = parseInt(r, 10)), {
		start: t,
		end: n,
		total: r
	};
}
function R(e, t) {
	let n = null, r = new TextDecoder("ascii"), i = [], a = `--${t}`, o = `${a}--`;
	for (let t = 0; t < 10; ++t) r.decode(new Uint8Array(e, t, a.length)) === a && (n = t);
	if (n === null) throw Error("Could not find initial boundary");
	for (; n < e.byteLength;) {
		let t = r.decode(new Uint8Array(e, n, Math.min(a.length + 1024, e.byteLength - n)));
		if (t.length === 0 || t.startsWith(o)) break;
		if (!t.startsWith(a)) throw Error("Part does not start with boundary");
		let s = t.substr(a.length + 2);
		if (s.length === 0) break;
		let c = s.indexOf(N), l = F(s.substr(0, c)), { start: u, end: d, total: f } = L(l["content-range"]), p = n + a.length + c + 4, m = parseInt(d, 10) + 1 - parseInt(u, 10);
		i.push({
			headers: l,
			data: e.slice(p, p + m),
			offset: u,
			length: m,
			fileSize: f
		}), n = p + m + 4;
	}
	return i;
}
//#endregion
//#region node_modules/geotiff/dist-module/source/basesource.js
var z = class {
	async fetch(e, t = void 0) {
		return Promise.all(e.map((e) => this.fetchSlice(e, t)));
	}
	async fetchSlice(e) {
		throw Error(`fetching of slice ${e} not possible, not implemented`);
	}
	get fileSize() {
		return null;
	}
	async close() {}
}, he = class extends Map {
	constructor(e = {}) {
		if (super(), !(e.maxSize && e.maxSize > 0)) throw TypeError("`maxSize` must be a number greater than 0");
		if (typeof e.maxAge == "number" && e.maxAge === 0) throw TypeError("`maxAge` must be a number greater than 0");
		this.maxSize = e.maxSize, this.maxAge = e.maxAge || Infinity, this.onEviction = e.onEviction, this.cache = /* @__PURE__ */ new Map(), this.oldCache = /* @__PURE__ */ new Map(), this._size = 0;
	}
	_emitEvictions(e) {
		if (typeof this.onEviction == "function") for (let [t, n] of e) this.onEviction(t, n.value);
	}
	_deleteIfExpired(e, t) {
		return typeof t.expiry == "number" && t.expiry <= Date.now() ? (typeof this.onEviction == "function" && this.onEviction(e, t.value), this.delete(e)) : !1;
	}
	_getOrDeleteIfExpired(e, t) {
		if (this._deleteIfExpired(e, t) === !1) return t.value;
	}
	_getItemValue(e, t) {
		return t.expiry ? this._getOrDeleteIfExpired(e, t) : t.value;
	}
	_peek(e, t) {
		let n = t.get(e);
		return this._getItemValue(e, n);
	}
	_set(e, t) {
		this.cache.set(e, t), this._size++, this._size >= this.maxSize && (this._size = 0, this._emitEvictions(this.oldCache), this.oldCache = this.cache, this.cache = /* @__PURE__ */ new Map());
	}
	_moveToRecent(e, t) {
		this.oldCache.delete(e), this._set(e, t);
	}
	*_entriesAscending() {
		for (let e of this.oldCache) {
			let [t, n] = e;
			this.cache.has(t) || this._deleteIfExpired(t, n) === !1 && (yield e);
		}
		for (let e of this.cache) {
			let [t, n] = e;
			this._deleteIfExpired(t, n) === !1 && (yield e);
		}
	}
	get(e) {
		if (this.cache.has(e)) {
			let t = this.cache.get(e);
			return this._getItemValue(e, t);
		}
		if (this.oldCache.has(e)) {
			let t = this.oldCache.get(e);
			if (this._deleteIfExpired(e, t) === !1) return this._moveToRecent(e, t), t.value;
		}
	}
	set(e, t, { maxAge: n = this.maxAge } = {}) {
		let r = typeof n == "number" && n !== Infinity ? Date.now() + n : void 0;
		return this.cache.has(e) ? this.cache.set(e, {
			value: t,
			expiry: r
		}) : this._set(e, {
			value: t,
			expiry: r
		}), this;
	}
	has(e) {
		return this.cache.has(e) ? !this._deleteIfExpired(e, this.cache.get(e)) : this.oldCache.has(e) ? !this._deleteIfExpired(e, this.oldCache.get(e)) : !1;
	}
	peek(e) {
		if (this.cache.has(e)) return this._peek(e, this.cache);
		if (this.oldCache.has(e)) return this._peek(e, this.oldCache);
	}
	delete(e) {
		let t = this.cache.delete(e);
		return t && this._size--, this.oldCache.delete(e) || t;
	}
	clear() {
		this.cache.clear(), this.oldCache.clear(), this._size = 0;
	}
	resize(e) {
		if (!(e && e > 0)) throw TypeError("`maxSize` must be a number greater than 0");
		let t = [...this._entriesAscending()], n = t.length - e;
		n < 0 ? (this.cache = new Map(t), this.oldCache = /* @__PURE__ */ new Map(), this._size = t.length) : (n > 0 && this._emitEvictions(t.slice(0, n)), this.oldCache = new Map(t.slice(n)), this.cache = /* @__PURE__ */ new Map(), this._size = 0), this.maxSize = e;
	}
	*keys() {
		for (let [e] of this) yield e;
	}
	*values() {
		for (let [, e] of this) yield e;
	}
	*[Symbol.iterator]() {
		for (let e of this.cache) {
			let [t, n] = e;
			this._deleteIfExpired(t, n) === !1 && (yield [t, n.value]);
		}
		for (let e of this.oldCache) {
			let [t, n] = e;
			this.cache.has(t) || this._deleteIfExpired(t, n) === !1 && (yield [t, n.value]);
		}
	}
	*entriesDescending() {
		let e = [...this.cache];
		for (let t = e.length - 1; t >= 0; --t) {
			let [n, r] = e[t];
			this._deleteIfExpired(n, r) === !1 && (yield [n, r.value]);
		}
		e = [...this.oldCache];
		for (let t = e.length - 1; t >= 0; --t) {
			let [n, r] = e[t];
			this.cache.has(n) || this._deleteIfExpired(n, r) === !1 && (yield [n, r.value]);
		}
	}
	*entriesAscending() {
		for (let [e, t] of this._entriesAscending()) yield [e, t.value];
	}
	get size() {
		if (!this._size) return this.oldCache.size;
		let e = 0;
		for (let t of this.oldCache.keys()) this.cache.has(t) || e++;
		return Math.min(this._size + e, this.maxSize);
	}
	entries() {
		return this.entriesAscending();
	}
	forEach(e, t = this) {
		for (let [n, r] of this.entriesAscending()) e.call(t, r, n, this);
	}
	get [Symbol.toStringTag]() {
		return JSON.stringify([...this.entriesAscending()]);
	}
};
//#endregion
//#region node_modules/geotiff/dist-module/utils.js
async function ge(e) {
	return new Promise((t) => setTimeout(t, e));
}
function _e(e, t) {
	let n = Array.isArray(e) ? e : Array.from(e), r = Array.isArray(t) ? t : Array.from(t);
	return n.map((e, t) => [e, r[t]]);
}
var B = class e extends Error {
	constructor(t) {
		super(t), Error.captureStackTrace && Error.captureStackTrace(this, e), this.name = "AbortError";
	}
}, ve = class extends Error {
	constructor(e, t) {
		super(t), this.errors = e, this.message = t, this.name = "AggregateError";
	}
}, ye = class {
	constructor(e, t, n = null) {
		this.offset = e, this.length = t, this.data = n;
	}
	get top() {
		return this.offset + this.length;
	}
}, V = class {
	constructor(e, t, n) {
		this.offset = e, this.length = t, this.blockIds = n;
	}
}, be = class extends z {
	constructor(e, { blockSize: t = 65536, cacheSize: n = 100 } = {}) {
		super(), this.source = e, this.blockSize = t, this.blockCache = new he({
			maxSize: n,
			onEviction: (e, t) => {
				this.evictedBlocks.set(e, t);
			}
		}), this.evictedBlocks = /* @__PURE__ */ new Map(), this.blockRequests = /* @__PURE__ */ new Map(), this.blockIdsToFetch = /* @__PURE__ */ new Set(), this.abortedBlockIds = /* @__PURE__ */ new Set();
	}
	get fileSize() {
		return this.source.fileSize;
	}
	async fetch(e, t) {
		let n = [], r = [], i = [];
		this.evictedBlocks.clear();
		for (let { offset: t, length: a } of e) {
			let e = t + a, { fileSize: o } = this;
			o !== null && (e = Math.min(e, o));
			let s = Math.floor(t / this.blockSize) * this.blockSize;
			for (let t = s; t < e; t += this.blockSize) {
				let e = Math.floor(t / this.blockSize);
				!this.blockCache.has(e) && !this.blockRequests.has(e) && (this.blockIdsToFetch.add(e), r.push(e)), this.blockRequests.has(e) && n.push(this.blockRequests.get(e)), i.push(e);
			}
		}
		await ge(), this.fetchBlocks(t);
		let a = [];
		for (let e of r) this.blockRequests.has(e) && a.push(this.blockRequests.get(e));
		await Promise.allSettled(n), await Promise.allSettled(a);
		let o = [], s = i.filter((e) => this.abortedBlockIds.has(e) || !this.blockCache.has(e));
		if (s.forEach((e) => this.blockIdsToFetch.add(e)), s.length > 0 && t && !t.aborted) {
			this.fetchBlocks(null);
			for (let e of s) {
				let t = this.blockRequests.get(e);
				if (!t) throw Error(`Block ${e} is not in the block requests`);
				o.push(t);
			}
			await Promise.allSettled(o);
		}
		if (t && t.aborted) throw new B("Request was aborted");
		let c = i.map((e) => this.blockCache.get(e) || this.evictedBlocks.get(e)), l = c.filter((e) => !e);
		if (l.length) throw new ve(l, "Request failed");
		let u = new Map(_e(i, c));
		return this.readSliceData(e, u);
	}
	fetchBlocks(e) {
		if (this.blockIdsToFetch.size > 0) {
			let t = this.groupBlocks(this.blockIdsToFetch), n = this.source.fetch(t, e);
			for (let r = 0; r < t.length; ++r) {
				let i = t[r];
				for (let t of i.blockIds) this.blockRequests.set(t, (async () => {
					try {
						let e = (await n)[r], i = t * this.blockSize, a = i - e.offset, o = Math.min(a + this.blockSize, e.data.byteLength), s = e.data.slice(a, o), c = new ye(i, s.byteLength, s, t);
						this.blockCache.set(t, c), this.abortedBlockIds.delete(t);
					} catch (n) {
						if (n.name === "AbortError") n.signal = e, this.blockCache.delete(t), this.abortedBlockIds.add(t);
						else throw n;
					} finally {
						this.blockRequests.delete(t);
					}
				})());
			}
			this.blockIdsToFetch.clear();
		}
	}
	groupBlocks(e) {
		let t = Array.from(e).sort((e, t) => e - t);
		if (t.length === 0) return [];
		let n = [], r = null, i = [];
		for (let e of t) r === null || r + 1 === e ? (n.push(e), r = e) : (i.push(new V(n[0] * this.blockSize, n.length * this.blockSize, n)), n = [e], r = e);
		return i.push(new V(n[0] * this.blockSize, n.length * this.blockSize, n)), i;
	}
	readSliceData(e, t) {
		return e.map((e) => {
			let n = e.offset + e.length;
			this.fileSize !== null && (n = Math.min(this.fileSize, n));
			let r = Math.floor(e.offset / this.blockSize), i = Math.floor(n / this.blockSize), a = new ArrayBuffer(e.length), o = new Uint8Array(a);
			for (let a = r; a <= i; ++a) {
				let r = t.get(a), i = r.offset - e.offset, s = r.top - n, c = 0, l = 0, u;
				i < 0 ? c = -i : i > 0 && (l = i), u = s < 0 ? r.length - c : n - r.offset - c;
				let d = new Uint8Array(r.data, c, u);
				o.set(d, l);
			}
			return a;
		});
	}
}, H = class {
	get ok() {
		return this.status >= 200 && this.status <= 299;
	}
	get status() {
		throw Error("not implemented");
	}
	getHeader(e) {
		throw Error("not implemented");
	}
	async getData() {
		throw Error("not implemented");
	}
}, U = class {
	constructor(e) {
		this.url = e;
	}
	async request({ headers: e, signal: t } = {}) {
		throw Error("request is not implemented");
	}
}, xe = class extends H {
	constructor(e) {
		super(), this.response = e;
	}
	get status() {
		return this.response.status;
	}
	getHeader(e) {
		return this.response.headers.get(e);
	}
	async getData() {
		return this.response.arrayBuffer ? await this.response.arrayBuffer() : (await this.response.buffer()).buffer;
	}
}, Se = class extends U {
	constructor(e, t) {
		super(e), this.credentials = t;
	}
	async request({ headers: e, signal: t } = {}) {
		return new xe(await fetch(this.url, {
			headers: e,
			credentials: this.credentials,
			signal: t
		}));
	}
}, Ce = class extends H {
	constructor(e, t) {
		super(), this.xhr = e, this.data = t;
	}
	get status() {
		return this.xhr.status;
	}
	getHeader(e) {
		return this.xhr.getResponseHeader(e);
	}
	async getData() {
		return this.data;
	}
}, we = class extends U {
	constructRequest(e, t) {
		return new Promise((n, r) => {
			let i = new XMLHttpRequest();
			i.open("GET", this.url), i.responseType = "arraybuffer";
			for (let [t, n] of Object.entries(e)) i.setRequestHeader(t, n);
			i.onload = () => {
				let e = i.response;
				n(new Ce(i, e));
			}, i.onerror = r, i.onabort = () => r(new B("Request aborted")), i.send(), t && (t.aborted && i.abort(), t.addEventListener("abort", () => i.abort()));
		});
	}
	async request({ headers: e, signal: t } = {}) {
		return await this.constructRequest(e, t);
	}
}, W = /* @__PURE__ */ e(r(), 1), Te = class extends H {
	constructor(e, t) {
		super(), this.response = e, this.dataPromise = t;
	}
	get status() {
		return this.response.statusCode;
	}
	getHeader(e) {
		return this.response.headers[e];
	}
	async getData() {
		return await this.dataPromise;
	}
}, Ee = class extends U {
	constructor(e) {
		super(e), this.parsedUrl = W.default.parse(this.url), this.httpApi = (this.parsedUrl.protocol, W.default);
	}
	constructRequest(e, t) {
		return new Promise((n, r) => {
			let i = this.httpApi.get({
				...this.parsedUrl,
				headers: e
			}, (e) => {
				n(new Te(e, new Promise((t) => {
					let n = [];
					e.on("data", (e) => {
						n.push(e);
					}), e.on("end", () => {
						let e = Buffer.concat(n).buffer;
						t(e);
					}), e.on("error", r);
				})));
			});
			i.on("error", r), t && (t.aborted && i.destroy(new B("Request aborted")), t.addEventListener("abort", () => i.destroy(new B("Request aborted"))));
		});
	}
	async request({ headers: e, signal: t } = {}) {
		return await this.constructRequest(e, t);
	}
}, G = class extends z {
	constructor(e, t, n, r) {
		super(), this.client = e, this.headers = t, this.maxRanges = n, this.allowFullFile = r, this._fileSize = null;
	}
	async fetch(e, t) {
		return this.maxRanges >= e.length ? this.fetchSlices(e, t) : (this.maxRanges > 0 && e.length, Promise.all(e.map((e) => this.fetchSlice(e, t))));
	}
	async fetchSlices(e, t) {
		let n = await this.client.request({
			headers: {
				...this.headers,
				Range: `bytes=${e.map(({ offset: e, length: t }) => `${e}-${e + t}`).join(",")}`
			},
			signal: t
		});
		if (!n.ok) throw Error("Error fetching data.");
		if (n.status === 206) {
			let { type: r, params: i } = I(n.getHeader("content-type"));
			if (r === "multipart/byteranges") {
				let e = R(await n.getData(), i.boundary);
				return this._fileSize = e[0].fileSize || null, e;
			}
			let a = await n.getData(), { start: o, end: s, total: c } = L(n.getHeader("content-range"));
			this._fileSize = c || null;
			let l = [{
				data: a,
				offset: o,
				length: s - o
			}];
			if (e.length > 1) {
				let n = await Promise.all(e.slice(1).map((e) => this.fetchSlice(e, t)));
				return l.concat(n);
			}
			return l;
		} else {
			if (!this.allowFullFile) throw Error("Server responded with full file");
			let e = await n.getData();
			return this._fileSize = e.byteLength, [{
				data: e,
				offset: 0,
				length: e.byteLength
			}];
		}
	}
	async fetchSlice(e, t) {
		let { offset: n, length: r } = e, i = await this.client.request({
			headers: {
				...this.headers,
				Range: `bytes=${n}-${n + r}`
			},
			signal: t
		});
		if (!i.ok) throw Error("Error fetching data.");
		if (i.status === 206) {
			let e = await i.getData(), { total: t } = L(i.getHeader("content-range"));
			return this._fileSize = t || null, {
				data: e,
				offset: n,
				length: r
			};
		} else {
			if (!this.allowFullFile) throw Error("Server responded with full file");
			let e = await i.getData();
			return this._fileSize = e.byteLength, {
				data: e,
				offset: 0,
				length: e.byteLength
			};
		}
	}
	get fileSize() {
		return this._fileSize;
	}
};
function K(e, { blockSize: t, cacheSize: n }) {
	return t === null ? e : new be(e, {
		blockSize: t,
		cacheSize: n
	});
}
function De(e, { headers: t = {}, credentials: n, maxRanges: r = 0, allowFullFile: i = !1, ...a } = {}) {
	return K(new G(new Se(e, n), t, r, i), a);
}
function Oe(e, { headers: t = {}, maxRanges: n = 0, allowFullFile: r = !1, ...i } = {}) {
	return K(new G(new we(e), t, n, r), i);
}
function ke(e, { headers: t = {}, maxRanges: n = 0, allowFullFile: r = !1, ...i } = {}) {
	return K(new G(new Ee(e), t, n, r), i);
}
function Ae(e, { forceXHR: t = !1, ...n } = {}) {
	return typeof fetch == "function" && !t ? De(e, n) : typeof XMLHttpRequest < "u" ? Oe(e, n) : ke(e, n);
}
//#endregion
//#region node_modules/geotiff/dist-module/geotiff.js
function q(e) {
	switch (e) {
		case s.BYTE:
		case s.ASCII:
		case s.SBYTE:
		case s.UNDEFINED: return 1;
		case s.SHORT:
		case s.SSHORT: return 2;
		case s.LONG:
		case s.SLONG:
		case s.FLOAT:
		case s.IFD: return 4;
		case s.RATIONAL:
		case s.SRATIONAL:
		case s.DOUBLE:
		case s.LONG8:
		case s.SLONG8:
		case s.IFD8: return 8;
		default: throw RangeError(`Invalid field type: ${e}`);
	}
}
function je(e) {
	let t = e.GeoKeyDirectory;
	if (!t) return null;
	let n = {};
	for (let r = 4; r <= t[3] * 4; r += 4) {
		let a = c[t[r]], o = t[r + 1] ? i[t[r + 1]] : null, s = t[r + 2], l = t[r + 3], u = null;
		if (!o) u = l;
		else {
			if (u = e[o], u == null) throw Error(`Could not get value of geoKey '${a}'.`);
			typeof u == "string" ? u = u.substring(l, l + s - 1) : u.subarray && (u = u.subarray(l, l + s), s === 1 && (u = u[0]));
		}
		n[a] = u;
	}
	return n;
}
function J(e, t, n, r) {
	let i = null, a = null, o = q(t);
	switch (t) {
		case s.BYTE:
		case s.ASCII:
		case s.UNDEFINED:
			i = new Uint8Array(n), a = e.readUint8;
			break;
		case s.SBYTE:
			i = new Int8Array(n), a = e.readInt8;
			break;
		case s.SHORT:
			i = new Uint16Array(n), a = e.readUint16;
			break;
		case s.SSHORT:
			i = new Int16Array(n), a = e.readInt16;
			break;
		case s.LONG:
		case s.IFD:
			i = new Uint32Array(n), a = e.readUint32;
			break;
		case s.SLONG:
			i = new Int32Array(n), a = e.readInt32;
			break;
		case s.LONG8:
		case s.IFD8:
			i = Array(n), a = e.readUint64;
			break;
		case s.SLONG8:
			i = Array(n), a = e.readInt64;
			break;
		case s.RATIONAL:
			i = new Uint32Array(n * 2), a = e.readUint32;
			break;
		case s.SRATIONAL:
			i = new Int32Array(n * 2), a = e.readInt32;
			break;
		case s.FLOAT:
			i = new Float32Array(n), a = e.readFloat32;
			break;
		case s.DOUBLE:
			i = new Float64Array(n), a = e.readFloat64;
			break;
		default: throw RangeError(`Invalid field type: ${t}`);
	}
	if (t === s.RATIONAL || t === s.SRATIONAL) for (let t = 0; t < n; t += 2) i[t] = a.call(e, r + t * o), i[t + 1] = a.call(e, r + (t * o + 4));
	else for (let t = 0; t < n; ++t) i[t] = a.call(e, r + t * o);
	return t === s.ASCII ? new TextDecoder("utf-8").decode(i) : i;
}
var Me = class {
	constructor(e, t, n) {
		this.fileDirectory = e, this.geoKeyDirectory = t, this.nextIFDByteOffset = n;
	}
}, Y = class extends Error {
	constructor(e) {
		super(`No image at index ${e}`), this.index = e;
	}
}, Ne = class {
	async readRasters(e = {}) {
		let { window: t, width: n, height: r } = e, { resX: i, resY: a, bbox: o } = e, s = await this.getImage(), c = s, l = await this.getImageCount(), u = s.getBoundingBox();
		if (t && o) throw Error("Both \"bbox\" and \"window\" passed.");
		if (n || r) {
			if (t) {
				let [e, n] = s.getOrigin(), [r, i] = s.getResolution();
				o = [
					e + t[0] * r,
					n + t[1] * i,
					e + t[2] * r,
					n + t[3] * i
				];
			}
			let e = o || u;
			if (n) {
				if (i) throw Error("Both width and resX passed");
				i = (e[2] - e[0]) / n;
			}
			if (r) {
				if (a) throw Error("Both width and resY passed");
				a = (e[3] - e[1]) / r;
			}
		}
		if (i || a) {
			let e = [];
			for (let t = 0; t < l; ++t) {
				let n = await this.getImage(t), { SubfileType: r, NewSubfileType: i } = n.fileDirectory;
				(t === 0 || r === 2 || i & 1) && e.push(n);
			}
			e.sort((e, t) => e.getWidth() - t.getWidth());
			for (let t = 0; t < e.length; ++t) {
				let n = e[t], r = (u[2] - u[0]) / n.getWidth(), o = (u[3] - u[1]) / n.getHeight();
				if (c = n, i && i > r || a && a > o) break;
			}
		}
		let d = t;
		if (o) {
			let [e, t] = s.getOrigin(), [n, r] = c.getResolution(s);
			d = [
				Math.round((o[0] - e) / n),
				Math.round((o[1] - t) / r),
				Math.round((o[2] - e) / n),
				Math.round((o[3] - t) / r)
			], d = [
				Math.min(d[0], d[2]),
				Math.min(d[1], d[3]),
				Math.max(d[0], d[2]),
				Math.max(d[1], d[3])
			];
		}
		return c.readRasters({
			...e,
			window: d
		});
	}
}, Pe = class e extends Ne {
	constructor(e, t, n, r, i = {}) {
		super(), this.source = e, this.littleEndian = t, this.bigTiff = n, this.firstIFDOffset = r, this.cache = i.cache || !1, this.ifdRequests = [], this.ghostValues = null;
	}
	async getSlice(e, t) {
		let n = this.bigTiff ? 4048 : 1024;
		return new me((await this.source.fetch([{
			offset: e,
			length: t === void 0 ? n : t
		}]))[0], e, this.littleEndian, this.bigTiff);
	}
	async parseFileDirectoryAt(e) {
		let t = this.bigTiff ? 20 : 12, n = this.bigTiff ? 8 : 2, r = await this.getSlice(e), a = this.bigTiff ? r.readUint64(e) : r.readUint16(e), c = a * t + (this.bigTiff ? 16 : 6);
		r.covers(e, c) || (r = await this.getSlice(e, c));
		let l = {}, u = e + (this.bigTiff ? 8 : 2);
		for (let e = 0; e < a; u += t, ++e) {
			let e = r.readUint16(u), t = r.readUint16(u + 2), n = this.bigTiff ? r.readUint64(u + 4) : r.readUint32(u + 4), a, c, d = q(t), f = u + (this.bigTiff ? 12 : 8);
			if (d * n <= (this.bigTiff ? 8 : 4)) a = J(r, t, n, f);
			else {
				let e = r.readOffset(f), i = q(t) * n;
				a = r.covers(e, i) ? J(r, t, n, e) : J(await this.getSlice(e, i), t, n, e);
			}
			c = n === 1 && o.indexOf(e) === -1 && !(t === s.RATIONAL || t === s.SRATIONAL) ? a[0] : a, l[i[e]] = c;
		}
		return new Me(l, je(l), r.readOffset(e + n + t * a));
	}
	async requestIFD(e) {
		if (this.ifdRequests[e]) return this.ifdRequests[e];
		if (e === 0) return this.ifdRequests[e] = this.parseFileDirectoryAt(this.firstIFDOffset), this.ifdRequests[e];
		if (!this.ifdRequests[e - 1]) try {
			this.ifdRequests[e - 1] = this.requestIFD(e - 1);
		} catch (t) {
			throw t instanceof Y ? new Y(e) : t;
		}
		return this.ifdRequests[e] = (async () => {
			let t = await this.ifdRequests[e - 1];
			if (t.nextIFDByteOffset === 0) throw new Y(e);
			return this.parseFileDirectoryAt(t.nextIFDByteOffset);
		})(), this.ifdRequests[e];
	}
	async getImage(e = 0) {
		let t = await this.requestIFD(e);
		return new fe(t.fileDirectory, t.geoKeyDirectory, this.dataView, this.littleEndian, this.cache, this.source);
	}
	async getImageCount() {
		let e = 0, t = !0;
		for (; t;) try {
			await this.requestIFD(e), ++e;
		} catch (e) {
			if (e instanceof Y) t = !1;
			else throw e;
		}
		return e;
	}
	async getGhostValues() {
		let e = this.bigTiff ? 16 : 8;
		if (this.ghostValues) return this.ghostValues;
		let t = await this.getSlice(e, 130);
		if (J(t, s.ASCII, 30, e) === "GDAL_STRUCTURAL_METADATA_SIZE=") {
			let n = J(t, s.ASCII, 130, e).split("\n")[0], r = Number(n.split("=")[1].split(" ")[0]) + n.length;
			r > 130 && (t = await this.getSlice(e, r));
			let i = J(t, s.ASCII, r, e);
			this.ghostValues = {}, i.split("\n").filter((e) => e.length > 0).map((e) => e.split("=")).forEach(([e, t]) => {
				this.ghostValues[e] = t;
			});
		}
		return this.ghostValues;
	}
	static async fromSource(t, n, r) {
		let i = (await t.fetch([{
			offset: 0,
			length: 1024
		}], r))[0], a = new pe(i), o = a.getUint16(0, 0), s;
		if (o === 18761) s = !0;
		else if (o === 19789) s = !1;
		else throw TypeError("Invalid byte order value.");
		let c = a.getUint16(2, s), l;
		if (c === 42) l = !1;
		else if (c === 43) {
			if (l = !0, a.getUint16(4, s) !== 8) throw Error("Unsupported offset byte-size.");
		} else throw TypeError("Invalid magic number.");
		let u = l ? a.getUint64(8, s) : a.getUint32(4, s);
		return new e(t, s, l, u, n);
	}
	close() {
		return typeof this.source.close == "function" ? this.source.close() : !1;
	}
};
async function Fe(e, t = {}, n) {
	return Pe.fromSource(Ae(e, t), n);
}
//#endregion
//#region src/map/openlayers-services/hillshade.ts
var X = 40075016.68557849;
function Ie(e) {
	return Math.log2(X / (256 * e));
}
function Z(e, t) {
	let n = e < 2 ? .4 : e < 4.5 ? .35 : .3;
	return t / 2 ** ((e < 15 ? (e - 15) * n : 0) + 28.2562 - e);
}
function Le(e, t, n) {
	let { size: r, values: i } = e, a = r + 2, o = Z(t, r), s = 2 ** t, c = new Uint8Array(r * r * 4);
	for (let e = 0; e < r; e++) {
		let t = (n + (e + .5) / r) / s, l = Math.atan(Math.sinh(Math.PI * (1 - 2 * t))), u = o / Math.cos(l);
		for (let t = 0; t < r; t++) {
			let n = (n, r, o) => {
				let s = i[(e + 1 + r) * a + t + 1 + n];
				return Number.isNaN(s) ? o : s;
			}, o = i[(e + 1) * a + t + 1], s = (e * r + t) * 4;
			if (Number.isNaN(o)) continue;
			let l = n(-1, -1, o), d = n(0, -1, o), f = n(1, -1, o), p = n(-1, 0, o), m = n(1, 0, o), h = n(-1, 1, o), g = n(0, 1, o), _ = n(1, 1, o), v = (f + m + m + _ - (l + p + p + h)) * u, y = (h + g + g + _ - (l + d + d + f)) * u;
			c[s] = Math.round(Math.min(Math.max(v / 8 + .5, 0), 1) * 255), c[s + 1] = Math.round(Math.min(Math.max(y / 8 + .5, 0), 1) * 255), c[s + 3] = 255;
		}
	}
	return c;
}
function Q(e, t) {
	let n;
	try {
		n = f(e ?? t);
	} catch {
		n = f(t);
	}
	let r = n[3] ?? 1;
	return [
		n[0] / 255 * r,
		n[1] / 255 * r,
		n[2] / 255 * r,
		r
	];
}
function Re(e) {
	let t = (e) => [
		"-",
		[
			"*",
			8,
			["band", e]
		],
		4
	], n = t(1), r = t(2), i = ["atan", [
		"*",
		.625,
		["sqrt", [
			"+",
			[
				"*",
				n,
				n
			],
			[
				"*",
				r,
				r
			]
		]]
	]], a = [
		"case",
		[
			"!=",
			n,
			0
		],
		[
			"atan",
			r,
			[
				"-",
				0,
				n
			]
		],
		[
			">",
			r,
			0
		],
		Math.PI / 2,
		-Math.PI / 2
	], o = e.exaggeration, s = 1.875 - o * 1.75, c = Math.PI / 2, l = o === .5 ? i : [
		"*",
		[
			"/",
			[
				"-",
				[
					"^",
					s,
					i
				],
				1
			],
			s ** +c - 1
		],
		c
	], u = Math.min(Math.max(o * 2, 0), 1), d = [
		"-",
		1,
		["cos", l]
	], f = ["abs", [
		"-",
		[
			"%",
			[
				"+",
				[
					"/",
					[
						"+",
						a,
						["var", "azimuth"]
					],
					Math.PI
				],
				.5
			],
			2
		],
		1
	]], p = [
		"*",
		["sin", l],
		u
	], m = Q(e.shadowColor, "#000000"), h = Q(e.highlightColor, "#ffffff"), g = Q(e.accentColor, "#000000"), _ = (e) => [
		"*",
		[
			"+",
			m[e],
			[
				"*",
				h[e] - m[e],
				f
			]
		],
		p
	], v = (e) => [
		"+",
		[
			"*",
			d,
			u * g[e],
			[
				"-",
				1,
				_(3)
			]
		],
		_(e)
	], y = v(3), b = (e) => [
		"*",
		255,
		[
			"/",
			v(e),
			[
				"clamp",
				y,
				1e-6,
				1
			]
		]
	];
	return [
		"case",
		[
			"==",
			["band", 4],
			0
		],
		[
			0,
			0,
			0,
			0
		],
		[
			"color",
			b(0),
			b(1),
			b(2),
			y
		]
	];
}
function $(e, t) {
	let { tileSize: n, maxZoom: r } = e, i = new d({
		tileSize: n,
		maxZoom: r,
		wrapX: !0,
		interpolate: !0,
		attributions: t.attribution,
		zDirection: (e, t, n) => e - Math.sqrt(t * n),
		loader: async (t, r, i, { signal: a }) => {
			let o = await e.load(t, r, i, a);
			if (!o) return new Uint8Array(n * n * 4);
			let s = Le(o, t, i);
			return o.size === n ? s : ze(s, o.size, n);
		}
	}), a = t.illuminationDirection * Math.PI / 180 + Math.PI, o = new u({
		source: i,
		minZoom: t.minZoom,
		maxZoom: t.maxZoom,
		cacheSize: 128,
		style: {
			variables: { azimuth: a },
			color: Re(t)
		}
	});
	if (t.illuminationAnchor !== "map") {
		let e = 0;
		o.on("prerender", (t) => {
			let n = t.frameState?.viewState.rotation ?? 0;
			n !== e && (e = n, o.updateStyleVariables({ azimuth: a - e }));
		});
	}
	return o;
}
function ze(e, t, n) {
	let r = new Uint8Array(n * n * 4);
	for (let i = 0; i < n; i++) for (let a = 0; a < n; a++) {
		let o = (Math.floor(i * t / n) * t + Math.floor(a * t / n)) * 4;
		r.set(e.subarray(o, o + 4), (i * n + a) * 4);
	}
	return r;
}
function Be(e, t, n, r) {
	return e === "terrarium" ? t * 256 + n + r / 256 - 32768 : -1e4 + .1 * (t * 65536 + n * 256 + r);
}
var Ve = 64;
function He(e, t) {
	let n = t.encoding ?? "mapbox", r = /* @__PURE__ */ new Map();
	function i(t, i, a) {
		let o = 2 ** t;
		if (a < 0 || a >= o) return Promise.resolve(null);
		i = (i % o + o) % o;
		let s = `${t}/${i}/${a}`, c = r.get(s);
		return c ? r.delete(s) : c = Ue(e[(i + a) % e.length].replace("{z}", String(t)).replace("{x}", String(i)).replace("{y}", String(a)), n).catch(() => null), r.set(s, c), r.size > Ve && r.delete(r.keys().next().value), c;
	}
	return $({
		tileSize: t.tileSize ?? 512,
		maxZoom: t.sourceMaxZoom ?? 22,
		async load(e, t, n) {
			let [r, a, o, s, c] = await Promise.all([
				i(e, t, n),
				i(e, t, n - 1),
				i(e, t, n + 1),
				i(e, t - 1, n),
				i(e, t + 1, n)
			]);
			if (!r) return null;
			let { size: l, values: u } = r, d = (e) => e && e.size === l ? e.values : null, [f, p, m, h] = [
				d(a),
				d(o),
				d(s),
				d(c)
			], g = l + 2, _ = new Float32Array(g * g);
			for (let e = -1; e <= l; e++) for (let t = -1; t <= l; t++) {
				let n = Math.min(Math.max(e, 0), l - 1), r = Math.min(Math.max(t, 0), l - 1), i = u[n * l + r];
				e === -1 && t === r && f ? i = f[(l - 1) * l + r] : e === l && t === r && p ? i = p[r] : t === -1 && e === n && m ? i = m[n * l + l - 1] : t === l && e === n && h && (i = h[n * l]), _[(e + 1) * g + t + 1] = i;
			}
			return {
				size: l,
				values: _
			};
		}
	}, t);
}
async function Ue(e, t) {
	let n = await fetch(e);
	if (!n.ok) return null;
	let r = await createImageBitmap(await n.blob()), i = r.width, a = new OffscreenCanvas(i, i).getContext("2d", { willReadFrequently: !0 });
	a.drawImage(r, 0, 0), r.close();
	let o = a.getImageData(0, 0, i, i).data, s = new Float32Array(i * i);
	for (let e = 0; e < s.length; e++) {
		let n = e * 4;
		s[e] = o[n + 3] === 0 ? NaN : Be(t, o[n], o[n + 1], o[n + 2]);
	}
	return {
		size: i,
		values: s
	};
}
var We = new Set([
	3857,
	900913,
	3785,
	102100,
	102113
]);
function Ge(e) {
	let t = e.geoKeys ?? {};
	return We.has(t.ProjectedCSTypeGeoKey);
}
async function Ke(e, t) {
	let n = await Fe(e), r = await n.getImage();
	if (!Ge(r)) throw Error(`COG elevation model ${e} is not in EPSG:3857, which a cog:// hillshade requires`);
	let [i, a, o, s] = r.getBoundingBox(), c = r.getGDALNoData(), l = Math.abs(r.getResolution()[0]);
	return $({
		tileSize: 256,
		maxZoom: Math.max(0, Math.round(Ie(l))),
		async load(e, t, r, l) {
			let u = X / 2 ** e, d = u / 256, f = -40075016.68557849 / 2 + t * u - d, p = X / 2 - r * u + d, m = f + u + 2 * d, h = p - u - 2 * d, g = [
				Math.max(f, i),
				Math.max(h, a),
				Math.min(m, o),
				Math.min(p, s)
			], _ = Math.round((g[2] - g[0]) / d), v = Math.round((g[3] - g[1]) / d);
			if (_ <= 0 || v <= 0) return null;
			let y = (await n.readRasters({
				bbox: g,
				width: _,
				height: v,
				samples: [0],
				resampleMethod: "nearest",
				signal: l
			}))[0], b = new Float32Array(258 * 258).fill(NaN), x = Math.round((g[0] - f) / d), S = Math.round((p - g[3]) / d);
			for (let e = 0; e < v && S + e < 258; e++) for (let t = 0; t < _ && x + t < 258; t++) {
				let n = y[e * _ + t];
				b[(S + e) * 258 + x + t] = n === c || !Number.isFinite(n) ? NaN : n;
			}
			return {
				size: 256,
				values: b
			};
		}
	}, t);
}
//#endregion
export { Ke as createCogHillshadeLayer, He as createTileHillshadeLayer };
