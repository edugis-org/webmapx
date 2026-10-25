import "./lib-CStxbLgN.js";
//#region node_modules/but-unzip/index.browser.min.mjs
try {
	let t = () => new DecompressionStream("deflate-raw"), n = (e) => new Response(e);
	t(), e = (e) => n(n(e).body.pipeThrough(t())).arrayBuffer().then((e) => new Uint8Array(e));
} catch {}
var e;
new TextDecoder(), globalThis.URL;
//#endregion
//#region node_modules/shpjs/lib/parseShp.js
function t(e) {
	let t = 0, n = 1, r = e.length, i, a, o = [
		e[0][0],
		e[0][1],
		e[0][0],
		e[0][1]
	];
	for (; n < r;) i = a || e[0], a = e[n], t += (a[0] - i[0]) * (a[1] + i[1]), n++, a[0] < o[0] && (o[0] = a[0]), a[1] < o[1] && (o[1] = a[1]), a[0] > o[2] && (o[2] = a[0]), a[1] > o[3] && (o[3] = a[1]);
	return {
		ring: e,
		clockWise: t > 0,
		bbox: o,
		children: []
	};
}
function n(e, t) {
	return !(e.bbox[0] > t.bbox[0] || e.bbox[1] > t.bbox[1] || e.bbox[2] < t.bbox[2] || e.bbox[3] < t.bbox[3]);
}
function r(e, i = !1) {
	let a = [], o = [];
	for (let n of e) {
		let e = t(n);
		e.clockWise === i ? o.push(e) : a.push(e);
	}
	let s = [];
	for (let e of o) {
		let t;
		for (let r of a) n(r, e) && (t ? n(t, r) && (t = r) : t = r);
		t ? t.children.push(e.ring) : s.push(e);
	}
	if (i) return {
		outers: a,
		orphens: s
	};
	if (s.length && !i) {
		let t = r(e, !0);
		if (t.orphens.length === 0) {
			let e = [];
			for (let n of t.outers) e.push([n.ring.toReversed()].concat(n.children.map((e) => e.toReversed())));
			return e;
		}
	}
	let c = [];
	for (let e of a) c.push([e.ring].concat(e.children));
	return c;
}
o.prototype.parsePoint = function(e) {
	return {
		type: "Point",
		coordinates: this.parseCoord(e, 0)
	};
}, o.prototype.parseZPoint = function(e) {
	let t = this.parsePoint(e);
	return t.coordinates.push(e.getFloat64(16, !0)), t;
}, o.prototype.parsePointArray = function(e, t, n) {
	let r = [], i = 0;
	for (; i < n;) r.push(this.parseCoord(e, t)), t += 16, i++;
	return r;
}, o.prototype.parseZPointArray = function(e, t, n, r) {
	let i = 0;
	for (; i < n;) r[i].push(e.getFloat64(t, !0)), i++, t += 8;
	return r;
}, o.prototype.parseArrayGroup = function(e, t, n, r, i) {
	let a = [], o = 0, s, c = 0, l;
	for (; o < r;) o++, n += 4, s = c, c = o === r ? i : e.getInt32(n, !0), l = c - s, l && (a.push(this.parsePointArray(e, t, l)), t += l << 4);
	return a;
}, o.prototype.parseZArrayGroup = function(e, t, n, r) {
	let i = 0;
	for (; i < n;) r[i] = this.parseZPointArray(e, t, r[i].length, r[i]), t += r[i].length << 3, i++;
	return r;
}, o.prototype.parseMultiPoint = function(e) {
	let t = {}, n = e.getInt32(32, !0);
	if (!n) return null;
	let r = this.parseCoord(e, 0), i = this.parseCoord(e, 16);
	return t.bbox = [
		r[0],
		r[1],
		i[0],
		i[1]
	], n === 1 ? (t.type = "Point", t.coordinates = this.parseCoord(e, 36)) : (t.type = "MultiPoint", t.coordinates = this.parsePointArray(e, 36, n)), t;
}, o.prototype.parseZMultiPoint = function(e) {
	let t = this.parseMultiPoint(e);
	if (!t) return null;
	let n;
	if (t.type === "Point") return t.coordinates.push(e.getFloat64(72, !0)), t;
	n = t.coordinates.length;
	let r = 52 + (n << 4);
	return t.coordinates = this.parseZPointArray(e, r, n, t.coordinates), t;
}, o.prototype.parsePolyline = function(e) {
	let t = {}, n = e.getInt32(32, !0);
	if (!n) return null;
	let r = this.parseCoord(e, 0), i = this.parseCoord(e, 16);
	t.bbox = [
		r[0],
		r[1],
		i[0],
		i[1]
	];
	let a = e.getInt32(36, !0), o, s;
	return n === 1 ? (t.type = "LineString", o = 44, t.coordinates = this.parsePointArray(e, o, a)) : (t.type = "MultiLineString", o = 40 + (n << 2), s = 40, t.coordinates = this.parseArrayGroup(e, o, s, n, a)), t;
}, o.prototype.parseZPolyline = function(e) {
	let t = this.parsePolyline(e);
	if (!t) return null;
	let n = t.coordinates.length, r;
	return t.type === "LineString" ? (r = 60 + (n << 4), t.coordinates = this.parseZPointArray(e, r, n, t.coordinates), t) : (r = 56 + (t.coordinates.reduce(function(e, t) {
		return e + t.length;
	}, 0) << 4) + (n << 2), t.coordinates = this.parseZArrayGroup(e, r, n, t.coordinates), t);
}, o.prototype.polyFuncs = function(e) {
	return e && (e.type === "LineString" ? (e.type = "Polygon", e.coordinates = [e.coordinates], e) : (e.coordinates = r(e.coordinates), e.coordinates.length === 1 ? (e.type = "Polygon", e.coordinates = e.coordinates[0], e) : (e.type = "MultiPolygon", e)));
}, o.prototype.parsePolygon = function(e) {
	return this.polyFuncs(this.parsePolyline(e));
}, o.prototype.parseZPolygon = function(e) {
	return this.polyFuncs(this.parseZPolyline(e));
};
var i = {
	1: "parsePoint",
	3: "parsePolyline",
	5: "parsePolygon",
	8: "parseMultiPoint",
	11: "parseZPoint",
	13: "parseZPolyline",
	15: "parseZPolygon",
	18: "parseZMultiPoint"
};
function a(e) {
	return e ? function(t, n) {
		let r = [t.getFloat64(n, !0), t.getFloat64(n + 8, !0)];
		return e.inverse(r);
	} : function(e, t) {
		return [e.getFloat64(t, !0), e.getFloat64(t + 8, !0)];
	};
}
function o(e, t) {
	if (!(this instanceof o)) return new o(e, t);
	this.buffer = e, this.headers = this.parseHeader(), this.shpFuncs(t), this.rows = this.getRows();
}
o.prototype.shpFuncs = function(e) {
	let t = this.headers.shpCode;
	if (t > 20 && (t -= 20), !(t in i)) throw Error(`I don't know shp type "${t}"`);
	this.parseFunc = this[i[t]], this.parseCoord = a(e);
}, o.prototype.getShpCode = function() {
	return this.parseHeader().shpCode;
}, o.prototype.parseHeader = function() {
	let e = this.buffer;
	return {
		length: e.getInt32(24) << 1,
		version: e.getInt32(28, !0),
		shpCode: e.getInt32(32, !0),
		bbox: [
			e.getFloat64(36, !0),
			e.getFloat64(44, !0),
			e.getFloat64(52, !0),
			e.getFloat64(60, !0)
		]
	};
}, o.prototype.getRows = function() {
	let e = 100, t = this.buffer.byteLength - 8, n = [], r;
	for (; e <= t && (r = this.getRow(e), r);) e += 8, e += r.len, r.type ? n.push(this.parseFunc(r.data)) : n.push(null);
	return n;
}, o.prototype.getRow = function(e) {
	let t = this.buffer.getInt32(e), n = this.buffer.getInt32(e + 4) << 1;
	if (n === 0) return {
		id: t,
		len: n,
		type: 0
	};
	if (!(e + n + 8 > this.buffer.byteLength)) return {
		id: t,
		len: n,
		data: new DataView(this.buffer.buffer, this.buffer.byteOffset + e + 12, n - 4),
		type: this.buffer.getInt32(e + 8, !0)
	};
}, globalThis.URL, new TextDecoder();
//#endregion
//#region src/utils/shapefile.ts
function s(e, t, n) {
	return new Promise((r, i) => {
		let a = new Worker(new URL(
			/* @vite-ignore */
			"" + new URL("assets/shapefile.worker-BcmBomVd.js", import.meta.url).href,
			"" + import.meta.url
		), { type: "module" });
		a.onmessage = (e) => {
			a.terminate(), e.data.success && e.data.data ? r(e.data.data) : i(Error(e.data.error ?? "shapefile worker failed"));
		}, a.onerror = (e) => {
			a.terminate(), i(e.error ?? Error(e.message));
		};
		let o = [e];
		t && o.push(t), a.postMessage({
			shpBuffer: e,
			dbfBuffer: t,
			prjText: n
		}, o);
	});
}
//#endregion
export { s as shapefileToGeoJSONInWorker };
