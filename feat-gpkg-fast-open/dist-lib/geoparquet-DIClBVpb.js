import { t as e } from "./lib-CStxbLgN.js";
import { t } from "./epsg-definitions-DZvXR1Xj.js";
//#region node_modules/hyparquet/src/constants.js
var n = [
	"BOOLEAN",
	"INT32",
	"INT64",
	"INT96",
	"FLOAT",
	"DOUBLE",
	"BYTE_ARRAY",
	"FIXED_LEN_BYTE_ARRAY"
], r = [
	"PLAIN",
	"GROUP_VAR_INT",
	"PLAIN_DICTIONARY",
	"RLE",
	"BIT_PACKED",
	"DELTA_BINARY_PACKED",
	"DELTA_LENGTH_BYTE_ARRAY",
	"DELTA_BYTE_ARRAY",
	"RLE_DICTIONARY",
	"BYTE_STREAM_SPLIT"
], i = [
	"REQUIRED",
	"OPTIONAL",
	"REPEATED"
], a = [
	"UTF8",
	"MAP",
	"MAP_KEY_VALUE",
	"LIST",
	"ENUM",
	"DECIMAL",
	"DATE",
	"TIME_MILLIS",
	"TIME_MICROS",
	"TIMESTAMP_MILLIS",
	"TIMESTAMP_MICROS",
	"UINT_8",
	"UINT_16",
	"UINT_32",
	"UINT_64",
	"INT_8",
	"INT_16",
	"INT_32",
	"INT_64",
	"JSON",
	"BSON",
	"INTERVAL"
], o = [
	"UNCOMPRESSED",
	"SNAPPY",
	"GZIP",
	"LZO",
	"BROTLI",
	"LZ4",
	"ZSTD",
	"LZ4_RAW"
], s = [
	"DATA_PAGE",
	"INDEX_PAGE",
	"DICTIONARY_PAGE",
	"DATA_PAGE_V2"
], c = [
	"UNORDERED",
	"ASCENDING",
	"DESCENDING"
], l = [
	"SPHERICAL",
	"VINCENTY",
	"THOMAS",
	"ANDOYER",
	"KARNEY"
];
//#endregion
//#region node_modules/hyparquet/src/wkb.js
function u(e) {
	let t = d(e);
	if (t.type === 1) return {
		type: "Point",
		coordinates: f(e, t)
	};
	if (t.type === 2) return {
		type: "LineString",
		coordinates: p(e, t)
	};
	if (t.type === 3) return {
		type: "Polygon",
		coordinates: m(e, t)
	};
	if (t.type === 4) {
		let n = [];
		for (let r = 0; r < t.count; r++) n.push(f(e, d(e)));
		return {
			type: "MultiPoint",
			coordinates: n
		};
	} else if (t.type === 5) {
		let n = [];
		for (let r = 0; r < t.count; r++) n.push(p(e, d(e)));
		return {
			type: "MultiLineString",
			coordinates: n
		};
	} else if (t.type === 6) {
		let n = [];
		for (let r = 0; r < t.count; r++) n.push(m(e, d(e)));
		return {
			type: "MultiPolygon",
			coordinates: n
		};
	} else if (t.type === 7) {
		let n = [];
		for (let r = 0; r < t.count; r++) n.push(u(e));
		return {
			type: "GeometryCollection",
			geometries: n
		};
	} else throw Error(`Unsupported geometry type: ${t.type}`);
}
function d(e) {
	let { view: t } = e, n = t.getUint8(e.offset++) === 1, r = t.getUint32(e.offset, n);
	e.offset += 4;
	let i = r % 1e3, a = Math.floor(r / 1e3), o = 0;
	i > 1 && i <= 7 && (o = t.getUint32(e.offset, n), e.offset += 4);
	let s = 2;
	return a && s++, a === 3 && s++, {
		littleEndian: n,
		type: i,
		dim: s,
		count: o
	};
}
function f(e, t) {
	let n = [];
	for (let r = 0; r < t.dim; r++) {
		let r = e.view.getFloat64(e.offset, t.littleEndian);
		e.offset += 8, n.push(r);
	}
	return n;
}
function p(e, t) {
	let n = [];
	for (let r = 0; r < t.count; r++) n.push(f(e, t));
	return n;
}
function m(e, t) {
	let { view: n } = e, r = [];
	for (let i = 0; i < t.count; i++) {
		let i = n.getUint32(e.offset, t.littleEndian);
		e.offset += 4, r.push(p(e, {
			...t,
			count: i
		}));
	}
	return r;
}
//#endregion
//#region node_modules/hyparquet/src/convert.js
var h = new TextDecoder(), g = {
	timestampFromMilliseconds(e) {
		return new Date(Number(e));
	},
	timestampFromMicroseconds(e) {
		return new Date(Number(e / 1000n));
	},
	timestampFromNanoseconds(e) {
		return new Date(Number(e / 1000000n));
	},
	dateFromDays(e) {
		return /* @__PURE__ */ new Date(e * 864e5);
	},
	stringFromBytes(e) {
		return e && h.decode(e);
	},
	jsonFromBytes(e) {
		return e && JSON.parse(h.decode(e));
	},
	geometryFromBytes(e) {
		return e && u({
			view: new DataView(e.buffer, e.byteOffset, e.byteLength),
			offset: 0
		});
	},
	geographyFromBytes(e) {
		return e && u({
			view: new DataView(e.buffer, e.byteOffset, e.byteLength),
			offset: 0
		});
	},
	uuidFromBytes(e) {
		if (!e) return;
		let t = Array.from(e, (e) => e.toString(16).padStart(2, "0")).join("");
		return t.slice(0, 8) + "-" + t.slice(8, 12) + "-" + t.slice(12, 16) + "-" + t.slice(16, 20) + "-" + t.slice(20, 32);
	}
};
function _(e, t, n, r) {
	if (t && n.endsWith("_DICTIONARY")) {
		let n = e;
		e instanceof Uint8Array && !(t instanceof Uint8Array) && (n = new t.constructor(e.length));
		for (let r = 0; r < e.length; r++) n[r] = t[e[r]];
		return n;
	} else return v(e, r);
}
function v(e, t) {
	let { element: n, parsers: r, utf8: i = !0, schemaPath: a } = t, { type: o, converted_type: s, logical_type: c } = n, l = n.repetition_type !== "REQUIRED";
	if (a?.some((e) => e.element.logical_type?.type === "VARIANT") && o === "BYTE_ARRAY" && s !== "UTF8" && c?.type !== "STRING") return e;
	if (s === "DECIMAL") {
		let t = 10 ** -(n.scale || 0), r = Array(e.length);
		for (let n = 0; n < r.length; n++) e[n] instanceof Uint8Array ? r[n] = y(e[n]) * t : r[n] = Number(e[n]) * t;
		return r;
	}
	if (!s && o === "INT96") return Array.from(e).map((e) => r.timestampFromNanoseconds(b(e)));
	if (s === "DATE") return Array.from(e).map((e) => r.dateFromDays(e));
	if (s === "TIMESTAMP_MILLIS") return Array.from(e).map((e) => r.timestampFromMilliseconds(e));
	if (s === "TIMESTAMP_MICROS") return Array.from(e).map((e) => r.timestampFromMicroseconds(e));
	if (s === "JSON") return e.map((e) => r.jsonFromBytes(e));
	if (s === "BSON") throw Error("parquet bson not supported");
	if (s === "INTERVAL") throw Error("parquet interval not supported");
	if (c?.type === "GEOMETRY") return e.map((e) => r.geometryFromBytes(e));
	if (c?.type === "GEOGRAPHY") return e.map((e) => r.geographyFromBytes(e));
	if (c?.type === "UUID") return e.map((e) => r.uuidFromBytes(e));
	if (s === "UTF8" || c?.type === "STRING" || i && o === "BYTE_ARRAY") return e.map((e) => r.stringFromBytes(e));
	if (s === "UINT_64" || c?.type === "INTEGER" && c.bitWidth === 64 && !c.isSigned) {
		if (e instanceof BigInt64Array) return new BigUint64Array(e.buffer, e.byteOffset, e.length);
		let t = l ? Array(e.length) : new BigUint64Array(e.length);
		for (let n = 0; n < t.length; n++) t[n] = e[n];
		return t;
	}
	if (s === "UINT_32" || c?.type === "INTEGER" && c.bitWidth === 32 && !c.isSigned) {
		if (e instanceof Int32Array) return new Uint32Array(e.buffer, e.byteOffset, e.length);
		let t = l ? Array(e.length) : new Uint32Array(e.length);
		for (let n = 0; n < t.length; n++) t[n] = e[n] < 0 ? 4294967296 + e[n] : e[n];
		return t;
	}
	if (c?.type === "FLOAT16") return Array.from(e).map(x);
	if (c?.type === "TIMESTAMP") {
		let { unit: t } = c, n = r.timestampFromMilliseconds;
		t === "MICROS" && (n = r.timestampFromMicroseconds), t === "NANOS" && (n = r.timestampFromNanoseconds);
		let i = Array(e.length);
		for (let t = 0; t < i.length; t++) i[t] = n(e[t]);
		return i;
	}
	return e;
}
function y(e) {
	if (!e.length) return 0;
	let t = 0n;
	for (let n of e) t = t * 256n + BigInt(n);
	let n = e.length * 8;
	return t >= 2n ** BigInt(n - 1) && (t -= 2n ** BigInt(n)), Number(t);
}
function b(e) {
	let t = (e >> 64n) - 2440588n, n = e & 18446744073709551615n;
	return t * 86400000000000n + n;
}
function x(e) {
	if (!e) return;
	let t = e[1] << 8 | e[0], n = t >> 15 ? -1 : 1, r = t >> 10 & 31, i = t & 1023;
	return r === 0 ? n * 2 ** -14 * (i / 1024) : r === 31 ? i ? NaN : n * Infinity : n * 2 ** (r - 15) * (1 + i / 1024);
}
//#endregion
//#region node_modules/hyparquet/src/schema.js
function S(e, t, n) {
	let r = e[t], i = [], a = 1;
	if (r.num_children) for (; i.length < r.num_children;) {
		let r = e[t + a], o = S(e, t + a, [...n, r.name]);
		a += o.count, i.push(o);
	}
	return {
		count: a,
		element: r,
		children: i,
		path: n
	};
}
function C(e, t) {
	let n = S(e, 0, []), r = [n];
	for (let e of t) {
		let i = n.children.find((t) => t.element.name === e);
		if (!i) throw Error(`parquet schema element not found: ${t}`);
		r.push(i), n = i;
	}
	return r;
}
function w(e) {
	let t = [];
	function n(e) {
		if (e.children.length) for (let t of e.children) n(t);
		else t.push(e.path.join("."));
	}
	return n(e), t;
}
function T(e) {
	let t = 0;
	for (let { element: n } of e) n.repetition_type === "REPEATED" && t++;
	return t;
}
function E(e) {
	let t = 0;
	for (let { element: n } of e.slice(1)) n.repetition_type !== "REQUIRED" && t++;
	return t;
}
function D(e) {
	if (!e || e.element.converted_type !== "LIST" || e.children.length > 1) return !1;
	let t = e.children[0];
	return !(t.children.length > 1 || t.element.repetition_type !== "REPEATED");
}
function O(e) {
	if (!e || e.element.converted_type !== "MAP" || e.children.length > 1) return !1;
	let t = e.children[0];
	return !(t.children.length !== 2 || t.element.repetition_type !== "REPEATED" || t.children.find((e) => e.element.name === "key")?.element.repetition_type === "REPEATED" || t.children.find((e) => e.element.name === "value")?.element.repetition_type === "REPEATED");
}
function k(e) {
	if (e.length !== 2) return !1;
	let [, t] = e;
	return !(t.element.repetition_type === "REPEATED" || t.children.length);
}
//#endregion
//#region node_modules/hyparquet/src/thrift.js
var A = 0, j = 1, M = 2, N = 3, ee = 4, te = 5, ne = 6, re = 7, P = 8, ie = 9, ae = 12;
function F(e) {
	let t = {}, n = 0;
	for (; e.offset < e.view.byteLength;) {
		let r = e.view.getUint8(e.offset++), i = r & 15;
		if (i === A) break;
		let a = r >> 4;
		n = a ? n + a : R(e), t[`field_${n}`] = I(e, i);
	}
	return t;
}
function I(e, t) {
	switch (t) {
		case j: return !0;
		case M: return !1;
		case N: return e.view.getInt8(e.offset++);
		case ee:
		case te: return R(e);
		case ne: return se(e);
		case re: {
			let t = e.view.getFloat64(e.offset, !0);
			return e.offset += 8, t;
		}
		case P: {
			let t = L(e), n = new Uint8Array(e.view.buffer, e.view.byteOffset + e.offset, t);
			return e.offset += t, n;
		}
		case ie: {
			let t = e.view.getUint8(e.offset++), n = t & 15, r = t >> 4;
			r === 15 && (r = L(e));
			let i = n === j || n === M, a = Array(r);
			for (let t = 0; t < r; t++) a[t] = i ? I(e, N) === 1 : I(e, n);
			return a;
		}
		case ae: return F(e);
		default: throw Error(`thrift unhandled type: ${t}`);
	}
}
function L(e) {
	let t = 0, n = 0;
	for (;;) {
		let r = e.view.getUint8(e.offset++);
		if (t |= (r & 127) << n, !(r & 128)) return t;
		n += 7;
	}
}
function oe(e) {
	let t = 0n, n = 0n;
	for (;;) {
		let r = e.view.getUint8(e.offset++);
		if (t |= BigInt(r & 127) << n, !(r & 128)) return t;
		n += 7n;
	}
}
function R(e) {
	let t = L(e);
	return t >>> 1 ^ -(t & 1);
}
function se(e) {
	let t = oe(e);
	return t >> 1n ^ -(t & 1n);
}
//#endregion
//#region node_modules/hyparquet/src/geoparquet.js
function ce(e, t) {
	let n = /* @__PURE__ */ new Map(), r = t?.find(({ key: e }) => e === "geo")?.value, i = (r && JSON.parse(r)?.columns) ?? {};
	for (let [e, t] of Object.entries(i)) {
		if (t.encoding !== "WKB") continue;
		let r = t.edges === "spherical" ? "GEOGRAPHY" : "GEOMETRY", i = t.crs?.id ?? t.crs?.ids?.[0], a = i ? `${i.authority}:${i.code.toString()}` : void 0;
		n.set(e, {
			type: r,
			crs: a
		});
	}
	for (let t = 1; t < e.length; t++) {
		let { logical_type: r, name: i, num_children: a, type: o } = e[t];
		if (a) {
			t += a;
			continue;
		}
		o === "BYTE_ARRAY" && !r && (e[t].logical_type = n.get(i));
	}
}
//#endregion
//#region node_modules/hyparquet/src/metadata.js
var le = 1 << 19, ue = new TextDecoder();
function z(e) {
	return e && ue.decode(e);
}
async function de(e, { parsers: t, initialFetchSize: n = le, geoparquet: r = !0 } = {}) {
	if (!e || !(e.byteLength >= 0)) throw Error("parquet expected AsyncBuffer");
	let i = Math.max(0, e.byteLength - n), a = await e.slice(i, e.byteLength), o = new DataView(a);
	if (o.getUint32(a.byteLength - 4, !0) !== 827474256) throw Error("parquet file invalid (footer != PAR1)");
	let s = o.getUint32(a.byteLength - 8, !0);
	if (s > e.byteLength - 8) throw Error(`parquet metadata length ${s} exceeds available buffer ${e.byteLength - 8}`);
	if (s + 8 > n) {
		let n = e.byteLength - s - 8, o = await e.slice(n, i), c = new ArrayBuffer(s + 8), l = new Uint8Array(c);
		return l.set(new Uint8Array(o)), l.set(new Uint8Array(a), i - n), fe(c, {
			parsers: t,
			geoparquet: r
		});
	} else return fe(a, {
		parsers: t,
		geoparquet: r
	});
}
function fe(e, { parsers: t, geoparquet: c = !0 } = {}) {
	if (!(e instanceof ArrayBuffer)) throw Error("parquet expected ArrayBuffer");
	let l = new DataView(e), u = {
		...g,
		...t
	};
	if (l.byteLength < 8) throw Error("parquet file is too short");
	if (l.getUint32(l.byteLength - 4, !0) !== 827474256) throw Error("parquet file invalid (footer != PAR1)");
	let d = l.byteLength - 8, f = l.getUint32(d, !0);
	if (f > l.byteLength - 8) throw Error(`parquet metadata length ${f} exceeds available buffer ${l.byteLength - 8}`);
	let p = F({
		view: l,
		offset: d - f
	}), m = p.field_1, h = p.field_2.map((e) => ({
		type: n[e.field_1],
		type_length: e.field_2,
		repetition_type: i[e.field_3],
		name: z(e.field_4),
		num_children: e.field_5,
		converted_type: a[e.field_6],
		scale: e.field_7,
		precision: e.field_8,
		field_id: e.field_9,
		logical_type: me(e.field_10)
	})), _ = h.filter((e) => e.type), v = p.field_3, y = p.field_4.map((e) => ({
		columns: e.field_1.map((e, t) => ({
			file_path: z(e.field_1),
			file_offset: e.field_2,
			meta_data: e.field_3 && {
				type: n[e.field_3.field_1],
				encodings: e.field_3.field_2?.map((e) => r[e]),
				path_in_schema: e.field_3.field_3.map(z),
				codec: o[e.field_3.field_4],
				num_values: e.field_3.field_5,
				total_uncompressed_size: e.field_3.field_6,
				total_compressed_size: e.field_3.field_7,
				key_value_metadata: e.field_3.field_8?.map((e) => ({
					key: z(e.field_1),
					value: z(e.field_2)
				})),
				data_page_offset: e.field_3.field_9,
				index_page_offset: e.field_3.field_10,
				dictionary_page_offset: e.field_3.field_11,
				statistics: ge(e.field_3.field_12, _[t], u),
				encoding_stats: e.field_3.field_13?.map((e) => ({
					page_type: s[e.field_1],
					encoding: r[e.field_2],
					count: e.field_3
				})),
				bloom_filter_offset: e.field_3.field_14,
				bloom_filter_length: e.field_3.field_15,
				size_statistics: e.field_3.field_16 && {
					unencoded_byte_array_data_bytes: e.field_3.field_16.field_1,
					repetition_level_histogram: e.field_3.field_16.field_2,
					definition_level_histogram: e.field_3.field_16.field_3
				},
				geospatial_statistics: e.field_3.field_17 && {
					bbox: e.field_3.field_17.field_1 && {
						xmin: e.field_3.field_17.field_1.field_1,
						xmax: e.field_3.field_17.field_1.field_2,
						ymin: e.field_3.field_17.field_1.field_3,
						ymax: e.field_3.field_17.field_1.field_4,
						zmin: e.field_3.field_17.field_1.field_5,
						zmax: e.field_3.field_17.field_1.field_6,
						mmin: e.field_3.field_17.field_1.field_7,
						mmax: e.field_3.field_17.field_1.field_8
					},
					geospatial_types: e.field_3.field_17.field_2
				}
			},
			offset_index_offset: e.field_4,
			offset_index_length: e.field_5,
			column_index_offset: e.field_6,
			column_index_length: e.field_7,
			crypto_metadata: e.field_8,
			encrypted_column_metadata: e.field_9
		})),
		total_byte_size: e.field_2,
		num_rows: e.field_3,
		sorting_columns: e.field_4?.map((e) => ({
			column_idx: e.field_1,
			descending: e.field_2,
			nulls_first: e.field_3
		})),
		file_offset: e.field_5,
		total_compressed_size: e.field_6,
		ordinal: e.field_7
	})), b = p.field_5?.map((e) => ({
		key: z(e.field_1),
		value: z(e.field_2)
	})), x = z(p.field_6);
	return c && ce(h, b), {
		version: m,
		schema: h,
		num_rows: v,
		row_groups: y,
		key_value_metadata: b,
		created_by: x,
		metadata_length: f
	};
}
function pe({ schema: e }) {
	return C(e, [])[0];
}
function me(e) {
	return e?.field_1 ? { type: "STRING" } : e?.field_2 ? { type: "MAP" } : e?.field_3 ? { type: "LIST" } : e?.field_4 ? { type: "ENUM" } : e?.field_5 ? {
		type: "DECIMAL",
		scale: e.field_5.field_1,
		precision: e.field_5.field_2
	} : e?.field_6 ? { type: "DATE" } : e?.field_7 ? {
		type: "TIME",
		isAdjustedToUTC: e.field_7.field_1,
		unit: he(e.field_7.field_2)
	} : e?.field_8 ? {
		type: "TIMESTAMP",
		isAdjustedToUTC: e.field_8.field_1,
		unit: he(e.field_8.field_2)
	} : e?.field_10 ? {
		type: "INTEGER",
		bitWidth: e.field_10.field_1,
		isSigned: e.field_10.field_2
	} : e?.field_11 ? { type: "NULL" } : e?.field_12 ? { type: "JSON" } : e?.field_13 ? { type: "BSON" } : e?.field_14 ? { type: "UUID" } : e?.field_15 ? { type: "FLOAT16" } : e?.field_16 ? {
		type: "VARIANT",
		specification_version: e.field_16.field_1
	} : e?.field_17 ? {
		type: "GEOMETRY",
		crs: z(e.field_17.field_1)
	} : e?.field_18 ? {
		type: "GEOGRAPHY",
		crs: z(e.field_18.field_1),
		algorithm: l[e.field_18.field_2]
	} : e;
}
function he(e) {
	if (e.field_1) return "MILLIS";
	if (e.field_2) return "MICROS";
	if (e.field_3) return "NANOS";
	throw Error("parquet time unit required");
}
function ge(e, t, n) {
	return e && {
		max: _e(e.field_1, t, n),
		min: _e(e.field_2, t, n),
		null_count: e.field_3,
		distinct_count: e.field_4,
		max_value: _e(e.field_5, t, n),
		min_value: _e(e.field_6, t, n),
		is_max_value_exact: e.field_7,
		is_min_value_exact: e.field_8
	};
}
function _e(e, t, n) {
	let { type: r, converted_type: i, logical_type: a } = t;
	if (e === void 0) return e;
	if (r === "BOOLEAN") return e[0] === 1;
	if (r === "BYTE_ARRAY") return n.stringFromBytes(e);
	let o = new DataView(e.buffer, e.byteOffset, e.byteLength);
	if (r === "FLOAT" && o.byteLength === 4) return o.getFloat32(0, !0);
	if (r === "DOUBLE" && o.byteLength === 8) return o.getFloat64(0, !0);
	if (r === "INT32" && i === "DECIMAL" && o.byteLength === 4) return o.getInt32(0, !0) * 10 ** -(t.scale || 0);
	if (r === "INT64" && i === "DECIMAL" && o.byteLength === 8) return Number(o.getBigInt64(0, !0)) * 10 ** -(t.scale || 0);
	if (r === "INT32" && i === "DATE") return n.dateFromDays(o.getInt32(0, !0));
	if (r === "INT64" && i === "TIMESTAMP_MILLIS") return n.timestampFromMilliseconds(o.getBigInt64(0, !0));
	if (r === "INT64" && i === "TIMESTAMP_MICROS") return n.timestampFromMicroseconds(o.getBigInt64(0, !0));
	if (r === "INT64" && a?.type === "TIMESTAMP" && a?.unit === "NANOS") return n.timestampFromNanoseconds(o.getBigInt64(0, !0));
	if (r === "INT64" && a?.type === "TIMESTAMP" && a?.unit === "MICROS") return n.timestampFromMicroseconds(o.getBigInt64(0, !0));
	if (r === "INT64" && a?.type === "TIMESTAMP") return n.timestampFromMilliseconds(o.getBigInt64(0, !0));
	let s = i?.startsWith("UINT_") || a?.type === "INTEGER" && !a.isSigned;
	return r === "INT32" && s && o.byteLength === 4 ? o.getUint32(0, !0) : r === "INT64" && s && o.byteLength === 8 ? o.getBigUint64(0, !0) : r === "INT32" && o.byteLength === 4 ? o.getInt32(0, !0) : r === "INT64" && o.byteLength === 8 ? o.getBigInt64(0, !0) : i === "DECIMAL" ? y(e) * 10 ** -(t.scale || 0) : a?.type === "FLOAT16" ? x(e) : a?.type === "UUID" ? n.uuidFromBytes(e) : e;
}
//#endregion
//#region node_modules/hyparquet/src/indexes.js
function ve(e, t, n = void 0) {
	let r = {
		...g,
		...n
	}, i = F(e);
	return {
		null_pages: i.field_1,
		min_values: i.field_2.map((e) => _e(e, t, r)),
		max_values: i.field_3.map((e) => _e(e, t, r)),
		boundary_order: c[i.field_4],
		null_counts: i.field_5,
		repetition_level_histograms: i.field_6,
		definition_level_histograms: i.field_7
	};
}
function ye(e) {
	let t = F(e);
	return {
		page_locations: t.field_1.map((e) => ({
			offset: e.field_1,
			compressed_page_size: e.field_2,
			first_row_index: e.field_3
		})),
		unencoded_byte_array_data_bytes: t.field_2
	};
}
//#endregion
//#region node_modules/hyparquet/src/xxhash.js
var B = 18446744073709551615n, be = 11400714785074694791n, xe = 14029467366897019727n, Se = 1609587929392839161n, Ce = 9650029242287828579n, we = 2870177450012600261n;
function V(e, t) {
	return (e << t | e >> 64n - t) & B;
}
function Te(e, t) {
	return e = e + t * xe & B, e = V(e, 31n), e * be & B;
}
function Ee(e, t) {
	return e ^= Te(0n, t), e * be + Ce & B;
}
function H(e, t = 0n) {
	let n = new DataView(e.buffer, e.byteOffset, e.byteLength), r = e.byteLength, i = 0, a;
	if (r >= 32) {
		let e = t + be + xe & B, o = t + xe & B, s = t, c = t - be & B;
		for (; i + 32 <= r;) e = Te(e, n.getBigUint64(i, !0)), i += 8, o = Te(o, n.getBigUint64(i, !0)), i += 8, s = Te(s, n.getBigUint64(i, !0)), i += 8, c = Te(c, n.getBigUint64(i, !0)), i += 8;
		a = V(e, 1n) + V(o, 7n) + V(s, 12n) + V(c, 18n) & B, a = Ee(a, e), a = Ee(a, o), a = Ee(a, s), a = Ee(a, c);
	} else a = t + we & B;
	for (a = a + BigInt(r) & B; i + 8 <= r;) a ^= Te(0n, n.getBigUint64(i, !0)), a = V(a, 27n) * be + Ce & B, i += 8;
	for (i + 4 <= r && (a ^= BigInt(n.getUint32(i, !0)) * be & B, a = V(a, 23n) * xe + Se & B, i += 4); i < r;) a ^= BigInt(n.getUint8(i)) * we & B, a = V(a, 11n) * be & B, i += 1;
	return a ^= a >> 33n, a = a * xe & B, a ^= a >> 29n, a = a * Se & B, a ^= a >> 32n, a;
}
//#endregion
//#region node_modules/hyparquet/src/bloom.js
var De = new TextEncoder(), Oe = new Uint32Array([
	1203114875,
	1150766481,
	2284105051,
	2729912477,
	1884591559,
	770785867,
	2667333959,
	1550580529
]);
function ke(e, t) {
	return Number((e >> 32n) * BigInt(t) >> 32n);
}
function Ae(e) {
	let t = new Uint32Array(8), n = Number(e & 4294967295n) | 0;
	for (let e = 0; e < 8; e++) t[e] = 1 << (Math.imul(n, Oe[e]) >>> 27);
	return t;
}
function je(e, t) {
	let n = ke(t, e.length >> 3) << 3, r = Ae(t);
	for (let t = 0; t < 8; t++) if ((e[n + t] & r[t]) === 0) return !1;
	return !0;
}
function Me(e) {
	let t = F(e), n = t.field_1;
	if (typeof n != "number" || n <= 0 || n % 32 != 0 || !t.field_2?.field_1 || !t.field_3?.field_1 || !t.field_4?.field_1) return;
	let { view: r, offset: i } = e;
	if (i + n > r.byteLength) throw Error(`parquet bloom filter truncated: need ${n} bytes, have ${r.byteLength - i}`);
	let a = new Uint32Array(n >> 2);
	for (let e = 0; e < a.length; e++) a[e] = r.getUint32(i + e * 4, !0);
	return e.offset = i + n, {
		numBytes: n,
		blocks: a
	};
}
function Ne(e, t) {
	if (e == null) return;
	let { type: n, converted_type: r, logical_type: i } = t;
	if (n === "BOOLEAN") return typeof e == "boolean" ? H(new Uint8Array([+!!e])) : void 0;
	if (n === "FLOAT") {
		if (typeof e != "number") return;
		let t = /* @__PURE__ */ new ArrayBuffer(4);
		return new DataView(t).setFloat32(0, e, !0), H(new Uint8Array(t));
	}
	if (n === "DOUBLE") {
		if (typeof e != "number") return;
		let t = /* @__PURE__ */ new ArrayBuffer(8);
		return new DataView(t).setFloat64(0, e, !0), H(new Uint8Array(t));
	}
	if (n === "INT32") {
		if (r === "DATE" || r === "DECIMAL" || r === "TIME_MILLIS" || i?.type === "DATE" || i?.type === "TIME" || i?.type === "DECIMAL" || typeof e != "number" || !Number.isInteger(e)) return;
		let t = /* @__PURE__ */ new ArrayBuffer(4);
		return new DataView(t).setInt32(0, e | 0, !0), H(new Uint8Array(t));
	}
	if (n === "INT64") {
		if (r === "TIMESTAMP_MILLIS" || r === "TIMESTAMP_MICROS" || r === "TIME_MICROS" || r === "DECIMAL" || i?.type === "TIMESTAMP" || i?.type === "TIME" || i?.type === "DECIMAL") return;
		let t;
		if (typeof e == "bigint") t = e;
		else if (typeof e == "number" && Number.isSafeInteger(e)) t = BigInt(e);
		else return;
		let n = /* @__PURE__ */ new ArrayBuffer(8);
		return new DataView(n).setBigUint64(0, BigInt.asUintN(64, t), !0), H(new Uint8Array(n));
	}
	if (n === "BYTE_ARRAY") return r === "JSON" || r === "BSON" || r === "DECIMAL" || i?.type === "JSON" || i?.type === "BSON" || i?.type === "VARIANT" || i?.type === "GEOMETRY" || i?.type === "GEOGRAPHY" ? void 0 : typeof e == "string" ? H(De.encode(e)) : e instanceof Uint8Array ? H(e) : void 0;
	if (n === "FIXED_LEN_BYTE_ARRAY") return r === "DECIMAL" || r === "INTERVAL" || i?.type === "DECIMAL" || i?.type === "UUID" || i?.type === "FLOAT16" || i?.type === "GEOMETRY" || i?.type === "GEOGRAPHY" ? void 0 : e instanceof Uint8Array ? H(e) : void 0;
}
function Pe(e) {
	let t = /* @__PURE__ */ new Set();
	return Fe(e, t), t;
}
function Fe(e, t) {
	if (e) {
		if ("$and" in e && Array.isArray(e.$and)) {
			for (let n of e.$and) Fe(n, t);
			return;
		}
		if ("$or" in e && Array.isArray(e.$or)) {
			for (let n of e.$or) Fe(n, t);
			return;
		}
		if (!("$nor" in e)) for (let [n, r] of Object.entries(e)) n.startsWith("$") || (typeof r == "object" && r && !Array.isArray(r) ? ("$eq" in r || "$in" in r) && t.add(n) : t.add(n));
	}
}
//#endregion
//#region node_modules/hyparquet/src/utils.js
function Ie(e, t) {
	let n = 1e4;
	for (let r = 0; r < t.length; r += n) e.push(...t.slice(r, r + n));
}
function U(e, t, n = !0) {
	if (n ? e === t : e == t) return !0;
	if (!e || !t || typeof e != "object" || typeof t != "object") return !1;
	if (e instanceof Uint8Array && t instanceof Uint8Array) {
		if (e.length !== t.length) return !1;
		for (let n = 0; n < e.length; n++) if (e[n] !== t[n]) return !1;
		return !0;
	}
	if (e instanceof Date || t instanceof Date) return e instanceof Date && t instanceof Date && e.getTime() === t.getTime();
	if (Array.isArray(e) && Array.isArray(t)) {
		if (e.length !== t.length) return !1;
		for (let r = 0; r < e.length; r++) if (!U(e[r], t[r], n)) return !1;
		return !0;
	}
	let r = Object.keys(e);
	if (r.length !== Object.keys(t).length) return !1;
	for (let i of r) if (!U(e[i], t[i], n)) return !1;
	return !0;
}
async function Le(e, t = {}, n = globalThis.fetch) {
	let r = new AbortController(), i = new Headers(t.headers);
	i.set("Range", "bytes=0-0");
	let a = await n(e, {
		...t,
		headers: i,
		signal: r.signal
	});
	if (!a.ok) throw Error(`fetch with range failed ${a.status}`);
	if (a.status === 206) {
		let e = a.headers.get("Content-Range");
		if (!e) throw Error("missing content-range header");
		let t = e.match(/bytes \d+-\d+\/(\d+)/);
		if (!t) throw Error(`invalid content-range header: ${e}`);
		return parseInt(t[1]);
	}
	if (a.status === 200) {
		let e = a.headers.get("Content-Length");
		if (r.abort(), e) return parseInt(e);
	}
	throw Error("server does not support range requests and missing content-length");
}
async function Re(e, t, n) {
	let r = n ?? globalThis.fetch, i = await r(e, {
		...t,
		method: "HEAD"
	});
	if (i.status === 403) return Le(e, t, r);
	if (!i.ok) throw Error(`fetch head failed ${i.status}`);
	let a = i.headers.get("Content-Length");
	return a ? parseInt(a) : Le(e, t, r);
}
async function ze({ url: e, byteLength: t, requestInit: n, fetch: r }) {
	if (!e) throw Error("missing url");
	let i = r ?? globalThis.fetch;
	t ??= await Re(e, n, i);
	let a, o = n || {};
	return {
		byteLength: t,
		async slice(t, n) {
			if (a) return a.then((e) => e.slice(t, n));
			let r = new Headers(o.headers), s = n === void 0 ? "" : n - 1;
			r.set("Range", `bytes=${t}-${s}`);
			let c = await i(e, {
				...o,
				headers: r
			});
			if (!c.ok || !c.body) throw Error(`fetch failed ${c.status}`);
			if (c.status === 200) return a = c.arrayBuffer(), a.then((e) => e.slice(t, n));
			if (c.status === 206) return c.arrayBuffer();
			throw Error(`fetch received unexpected status code ${c.status}`);
		}
	};
}
function Be({ byteLength: e, slice: t }, { minSize: n = le } = {}) {
	if (e < n) {
		let n = t(0, e);
		return {
			byteLength: e,
			async slice(e, t) {
				return (await n).slice(e, t);
			}
		};
	}
	let r = /* @__PURE__ */ new Map();
	return {
		byteLength: e,
		slice(n, i) {
			let a = Ve(n, i, e), o = r.get(a);
			if (o) return o;
			let s = t(n, i);
			return r.set(a, s), s;
		}
	};
}
function Ve(e, t, n) {
	if (e < 0) {
		if (t !== void 0) throw Error(`invalid suffix range [${e}, ${t}]`);
		return n === void 0 ? `${e},` : `${n + e},${n}`;
	} else if (t !== void 0) {
		if (e > t) throw Error(`invalid empty range [${e}, ${t}]`);
		return `${e},${t}`;
	} else if (n === void 0) return `${e},`;
	else return `${e},${n}`;
}
function He(e) {
	if (!e) return [];
	if (e.length === 1) return e[0];
	let t = [];
	for (let n of e) Ie(t, n);
	return t;
}
//#endregion
//#region node_modules/hyparquet/src/filter.js
var Ue = new TextEncoder();
function We(e) {
	if (!e) return [];
	let t = [];
	return "$and" in e && Array.isArray(e.$and) ? t.push(...e.$and.flatMap(We)) : "$or" in e && Array.isArray(e.$or) ? t.push(...e.$or.flatMap(We)) : "$nor" in e && Array.isArray(e.$nor) ? t.push(...e.$nor.flatMap(We)) : t.push(...Object.keys(e)), [...new Set(t)];
}
function Ge(e) {
	return [...new Set(We(e).map((e) => e.split(".")[0]))];
}
function Ke(e, t, n = !0) {
	return "$and" in t && Array.isArray(t.$and) ? t.$and.every((t) => Ke(e, t, n)) : "$or" in t && Array.isArray(t.$or) ? t.$or.some((t) => Ke(e, t, n)) : "$nor" in t && Array.isArray(t.$nor) ? !t.$nor.some((t) => Ke(e, t, n)) : Object.entries(t).every(([t, r]) => {
		let i = nt(e, t);
		return typeof r != "object" || !r || Array.isArray(r) ? U(i, r, n) : Object.entries(r || {}).every(([e, t]) => e === "$gt" ? i != null && i > t : e === "$gte" ? i != null && i >= t : e === "$lt" ? i != null && i < t : e === "$lte" ? i != null && i <= t : e === "$eq" ? U(i, t, n) : e === "$ne" ? !U(i, t, n) : e === "$in" ? Array.isArray(t) && qe(i, t, n) : e === "$nin" ? Array.isArray(t) && !qe(i, t, n) : e === "$not" ? !Ke({ value: i }, { value: t }, n) : !0);
	});
}
function qe(e, t, n) {
	return t.some((t) => U(e, t, n) || Array.isArray(e) && e.some((e) => U(e, t, n)));
}
function Je({ rowGroup: e, physicalColumns: t, filter: n, strict: r = !0, bloomFilters: i, schemaElements: a }) {
	if (!n) return !1;
	if ("$and" in n && Array.isArray(n.$and)) return n.$and.some((n) => Je({
		rowGroup: e,
		physicalColumns: t,
		filter: n,
		strict: r,
		bloomFilters: i,
		schemaElements: a
	}));
	if ("$or" in n && Array.isArray(n.$or)) return n.$or.every((n) => Je({
		rowGroup: e,
		physicalColumns: t,
		filter: n,
		strict: r,
		bloomFilters: i,
		schemaElements: a
	}));
	if ("$nor" in n && Array.isArray(n.$nor)) return !1;
	for (let [o, s] of Object.entries(n)) {
		let n = t.indexOf(o);
		if (n === -1) continue;
		let { min: c, max: l, min_value: u, max_value: d, null_count: f } = e.columns[n].meta_data?.statistics || {}, p = u === void 0 ? c : u, m = d === void 0 ? l : d, h = p !== void 0 && m !== void 0, g = i?.[o], _ = a?.[o], v = Ke({ value: null }, { value: s }, r) && (f === void 0 || f > 0);
		if (h && !v && Ye(s, p, m, r, _)) return !0;
		for (let [e, t] of Object.entries(s || {})) if (g && _) {
			if (e === "$eq") {
				let e = Ne(t, _);
				if (e !== void 0 && !je(g.blocks, e)) return !0;
			}
			if (e === "$in" && Array.isArray(t) && t.length > 0) {
				let e = !0;
				for (let n of t) {
					let t = Ne(n, _);
					if (t === void 0 || je(g.blocks, t)) {
						e = !1;
						break;
					}
				}
				if (e) return !0;
			}
		}
	}
	return !1;
}
function Ye(e, t, n, r, i) {
	if (t === void 0 || n === void 0) return !1;
	let a = i?.type === "FLOAT" || i?.type === "DOUBLE" || i?.logical_type?.type === "FLOAT16";
	for (let [o, s] of Object.entries(e || {})) {
		let e = Xe(t, s, r, i), c = Xe(n, s, r, i), l = !(t instanceof Uint8Array || n instanceof Uint8Array) && (i?.type !== "BYTE_ARRAY" || typeof s == "string" && [...s].every((e) => e.charCodeAt(0) <= 127));
		if (o === "$gt" && l && c !== void 0 && c <= 0 || o === "$gte" && l && c !== void 0 && c < 0 || o === "$lt" && l && e !== void 0 && e >= 0 || o === "$lte" && l && e !== void 0 && e > 0) return !0;
		if (o === "$eq") {
			let e = Xe(s, t, r, i), a = Xe(s, n, r, i);
			if (e !== void 0 && e < 0 || a !== void 0 && a > 0) return !0;
		}
		if (o === "$ne" && !a && U(t, n, r) && U(t, s, r) || o === "$in" && Array.isArray(s) && s.every((e) => {
			let a = Xe(e, t, r, i), o = Xe(e, n, r, i);
			return a !== void 0 && a < 0 || o !== void 0 && o > 0;
		}) || o === "$nin" && !a && Array.isArray(s) && U(t, n, r) && s.some((e) => U(t, e, r))) return !0;
	}
	return !1;
}
function Xe(e, t, n, r) {
	if (r?.type === "BYTE_ARRAY") return typeof e != "string" || typeof t != "string" ? void 0 : Ze(Ue.encode(e), Ue.encode(t));
	if (e instanceof Uint8Array || t instanceof Uint8Array) return !(e instanceof Uint8Array) || !(t instanceof Uint8Array) ? void 0 : Ze(e, t);
	if (e < t) return -1;
	if (e > t) return 1;
	if (U(e, t, n)) return 0;
}
function Ze(e, t) {
	let n = Math.min(e.length, t.length);
	for (let r = 0; r < n; r++) {
		if (e[r] < t[r]) return -1;
		if (e[r] > t[r]) return 1;
	}
	return e.length < t.length ? -1 : +(e.length > t.length);
}
function Qe(e, t) {
	return Ke({ value: null }, { value: e }, t);
}
function $e(e, t, n, r = !0) {
	if (!e) return;
	if ("$and" in e && Array.isArray(e.$and)) {
		let i;
		for (let a of e.$and) i = et(i, $e(a, t, n, r));
		return i;
	}
	if ("$or" in e && Array.isArray(e.$or)) {
		let i = [];
		for (let a of e.$or) {
			let e = $e(a, t, n, r);
			if (!e) return;
			i = tt(i, e);
		}
		return i;
	}
	if ("$nor" in e && Array.isArray(e.$nor)) return;
	let i;
	for (let [a, o] of Object.entries(e)) {
		let e = t[a];
		if (!e) continue;
		let s = Qe(o, r), c = [];
		for (let t = 0; t < e.pageStarts.length; t++) {
			let i = e.pageStarts[t], a = t + 1 < e.pageStarts.length ? e.pageStarts[t + 1] : n, l = e.nullCounts?.[t], u = s && (l === void 0 || l > 0);
			if (!(!e.nullPages[t] && !u && Ye(o, e.minValues[t], e.maxValues[t], r, e.element))) {
				let e = c[c.length - 1];
				e && e[1] === i ? e[1] = a : c.push([i, a]);
			}
		}
		i = et(i, c);
	}
	return i;
}
function et(e, t) {
	if (!e) return t;
	if (!t) return e;
	let n = [], r = 0, i = 0;
	for (; r < e.length && i < t.length;) {
		let a = Math.max(e[r][0], t[i][0]), o = Math.min(e[r][1], t[i][1]);
		a < o && n.push([a, o]), e[r][1] < t[i][1] ? r++ : i++;
	}
	return n;
}
function tt(e, t) {
	let n = [], r = 0, i = 0;
	for (; r < e.length || i < t.length;) {
		let a = i >= t.length || r < e.length && e[r][0] <= t[i][0] ? e[r++] : t[i++], o = n[n.length - 1];
		o && a[0] <= o[1] ? o[1] = Math.max(o[1], a[1]) : n.push([a[0], a[1]]);
	}
	return n;
}
function nt(e, t) {
	let n = e;
	for (let e of t.split(".")) n = n?.[e];
	return n;
}
//#endregion
//#region node_modules/hyparquet/src/plan.js
var rt = 1 << 21, it = 8192;
function at(e) {
	let { metadata: t, rowStart: n = 0, columns: r, useOffsetIndex: i = !1 } = e;
	if (!t) throw Error("parquetPlan requires metadata");
	let a = [], o = [], s = [], c = ot(e);
	for (let e of c.groups) {
		let t = st({
			...e,
			columns: r,
			useOffsetIndex: i
		});
		a.push(...t.groups), o.push(...t.fetches), s.push(...t.indexes);
	}
	return o.push(...s), {
		metadata: t,
		rowStart: n,
		rowEnd: c.rowEnd,
		columns: r,
		fetches: o,
		groups: a
	};
}
function ot({ metadata: e, rowStart: t = 0, rowEnd: n = Infinity, columns: r, filter: i, filterStrict: a = !0, bloomFiltersByGroup: o, schemaElements: s, pageRangesByGroup: c, pageLocationsByGroup: l }) {
	if (!e) throw Error("parquetPlan requires metadata");
	let u = pe(e), d = w(u), f = i ? {
		...pt(u),
		...s
	} : s, p = [], m = 0;
	for (let s = 0; s < e.row_groups.length; s++) {
		let u = e.row_groups[s], h = Number(u.num_rows), g = m + h;
		if (h > 0 && g > t && m < n && !Je({
			rowGroup: u,
			physicalColumns: d,
			filter: i,
			strict: a,
			bloomFilters: o?.[s],
			schemaElements: f
		})) {
			let e = Math.max(t - m, 0), i = Math.min(n - m, h), a = c?.[s], o = l?.[s], d = a ? a.map(([t, n]) => [Math.max(t, e), Math.min(n, i)]).filter(([e, t]) => e < t) : [[e, i]];
			d.length > 1 && (d = u.columns.every((e) => {
				let t = e.meta_data?.path_in_schema[0], n = e.meta_data?.path_in_schema.join(".");
				return r && t && !r.includes(t) ? !0 : !!(e.offset_index_offset && e.offset_index_length) || !!(n && o?.[n]);
			}) ? ct(d, u, r, o) : [[d[0][0], d[d.length - 1][1]]]), d.length && p.push({
				rowGroup: u,
				groupIndex: s,
				groupStart: m,
				groupRows: h,
				ranges: d,
				pageRanges: a,
				pageLocations: o
			});
		}
		m = g;
	}
	return {
		groups: p,
		rowEnd: isFinite(n) ? n : m
	};
}
function st({ rowGroup: e, groupStart: t, groupRows: n, ranges: r, columns: i, useOffsetIndex: a = !1, pageRanges: o, pageLocations: s }) {
	let c = [], l = [], u = [], d = r.length > 1 || r[0][0] > 0 || r[0][1] < n;
	for (let t of e.columns) {
		let e = t.meta_data;
		if (t.file_path) throw Error("parquet file_path not supported");
		if (!e) throw Error("parquet column metadata is undefined");
		if (i && !i.includes(e.path_in_schema[0])) continue;
		let n = e.dictionary_page_offset || e.data_page_offset, r = Number(n), l = Number(n + e.total_compressed_size), u = s?.[e.path_in_schema.join(".")];
		if (u && d) c.push({
			columnMetadata: e,
			pageLocations: u,
			range: {
				startByte: r,
				endByte: l
			}
		});
		else if ((a || o) && t.offset_index_offset && t.offset_index_length && d) {
			let r = Number(t.offset_index_offset);
			c.push({
				columnMetadata: e,
				offsetIndex: {
					startByte: r,
					endByte: r + t.offset_index_length
				},
				range: {
					startByte: Number(n),
					endByte: l
				}
			});
		} else c.push({
			columnMetadata: e,
			range: {
				startByte: r,
				endByte: l
			}
		});
	}
	let f = [], p;
	for (let e of c) "pageLocations" in e || ("offsetIndex" in e ? u.push(e.offsetIndex) : i ? f.push(e.range) : p && e.range.endByte - p.startByte <= rt ? p.endByte = e.range.endByte : (p && l.push(p), p = { ...e.range }));
	return p && l.push(p), l.push(...ft(f, it, rt)), {
		groups: r.map(([r, i]) => ({
			chunks: c,
			rowGroup: e,
			groupStart: t,
			groupRows: n,
			selectStart: r,
			selectEnd: i
		})),
		fetches: l,
		indexes: u
	};
}
function ct(e, t, n, r) {
	let i = t.columns.filter((e) => !n || n.includes(e.meta_data?.path_in_schema[0] || "")).map((e) => r?.[e.meta_data?.path_in_schema.join(".") || ""]), a = [];
	for (let n of e) {
		let e = a[a.length - 1], r = e && i.some((r) => {
			if (!r) return !0;
			let i = lt(e, r, Number(t.num_rows)), a = lt(n, r, Number(t.num_rows));
			return i[0] <= a[1] && a[0] <= i[1];
		});
		e && r ? e[1] = n[1] : a.push([...n]);
	}
	return a;
}
function lt([e, t], n, r) {
	let i = Infinity, a = -Infinity;
	for (let o = 0; o < n.length; o++) {
		let s = Number(n[o].first_row_index);
		(o + 1 < n.length ? Number(n[o + 1].first_row_index) : r) > e && s < t && (i = Math.min(i, o), a = o);
	}
	return [i, a];
}
async function ut({ file: e, metadata: t, filter: n, filterStrict: r = !0 }) {
	let i = t.row_groups.map(() => ({})), a = Pe(n);
	if (a.size === 0) return i;
	let o = w(pe(t)), s = [];
	return t.row_groups.forEach((t, c) => {
		if (!Je({
			rowGroup: t,
			physicalColumns: o,
			filter: n,
			strict: r
		})) for (let n of a) {
			let r = o.indexOf(n);
			if (r === -1) continue;
			let a = t.columns[r]?.meta_data;
			if (!a?.bloom_filter_offset || !a.bloom_filter_length) continue;
			let l = Number(a.bloom_filter_offset), u = l + a.bloom_filter_length;
			s.push((async () => {
				let t = await e.slice(l, u), r = Me({
					view: new DataView(t),
					offset: 0
				});
				r && (i[c][n] = r);
			})());
		}
	}), s.length && await Promise.all(s), i;
}
async function dt({ file: e, metadata: t, filter: n, filterStrict: r = !0, rowStart: i = 0, rowEnd: a = Infinity, columns: o, bloomFiltersByGroup: s, schemaElements: c, parsers: l }) {
	let u = t.row_groups.map(() => void 0), d = t.row_groups.map(() => ({}));
	if (n && "$nor" in n && Array.isArray(n.$nor)) return {
		pageRangesByGroup: u,
		pageLocationsByGroup: d
	};
	let f = We(n);
	if (!f.length) return {
		pageRangesByGroup: u,
		pageLocationsByGroup: d
	};
	let p = pe(t), m = w(p), h = {
		...pt(p),
		...c
	}, g = [], _ = [], v = [], y = 0;
	if (t.row_groups.forEach((e, t) => {
		let c = Number(e.num_rows), u = y + c, p = c > 0 && u > i && y < a;
		if (y = u, !p || Je({
			rowGroup: e,
			physicalColumns: m,
			filter: n,
			strict: r,
			bloomFilters: s?.[t],
			schemaElements: h
		})) return;
		let b = {}, x = 0, S = /* @__PURE__ */ new Set(), C = !1;
		for (let n of f) {
			let r = m.indexOf(n);
			if (r === -1) continue;
			let i = e.columns[r];
			if (!i?.meta_data || !i.column_index_offset || !i.column_index_length || !i.offset_index_offset || !i.offset_index_length) continue;
			let a = h[n];
			if (!a) continue;
			C = !0, S.add(n);
			let o = Number(i.column_index_offset), s = Number(i.offset_index_offset), c = o + i.column_index_length, u = s + i.offset_index_length;
			g.push({
				startByte: o,
				endByte: c
			}, {
				startByte: s,
				endByte: u
			}), x++, _.push(async (e) => {
				let [r, i] = await Promise.all([e.slice(o, c), e.slice(s, u)]), f = ve({
					view: new DataView(r),
					offset: 0
				}, a, l), p = ye({
					view: new DataView(i),
					offset: 0
				});
				d[t][n] = p.page_locations, b[n] = {
					minValues: f.min_values,
					maxValues: f.max_values,
					nullPages: f.null_pages,
					nullCounts: f.null_counts,
					pageStarts: p.page_locations.map((e) => Number(e.first_row_index)),
					element: a
				};
			});
		}
		if (C) for (let n of e.columns) {
			let e = n.meta_data;
			if (!e) continue;
			let r = e.path_in_schema[0], i = e.path_in_schema.join(".");
			if (o && !o.includes(r) || S.has(i) || !n.offset_index_offset || !n.offset_index_length) continue;
			S.add(i);
			let a = Number(n.offset_index_offset), s = a + n.offset_index_length;
			g.push({
				startByte: a,
				endByte: s
			}), x++, _.push(async (e) => {
				let n = await e.slice(a, s), r = ye({
					view: new DataView(n),
					offset: 0
				});
				d[t][i] = r.page_locations;
			});
		}
		x && v.push({
			rgIdx: t,
			groupRows: c,
			columnPages: b
		});
	}), _.length) {
		let t = mt(e, { fetches: ft(g) });
		await Promise.all(_.map((e) => e(t)));
		for (let { rgIdx: e, groupRows: t, columnPages: i } of v) u[e] = $e(n, i, t, r);
	}
	return {
		pageRangesByGroup: u,
		pageLocationsByGroup: d
	};
}
function ft(e, t = 0, n = Infinity) {
	let r = e.map((e) => ({ ...e })).sort((e, t) => e.startByte - t.startByte || e.endByte - t.endByte), i = [];
	for (let e of r) {
		let r = i[i.length - 1];
		r && e.startByte <= r.endByte + t && Math.max(r.endByte, e.endByte) - r.startByte <= n ? r.endByte = Math.max(r.endByte, e.endByte) : i.push(e);
	}
	return i;
}
function pt(e) {
	let t = {};
	function n(e) {
		if (e.children.length) for (let t of e.children) n(t);
		else t[e.path.join(".")] = e.element;
	}
	return n(e), t;
}
function mt(e, { fetches: t }) {
	let n = t.map(({ startByte: t, endByte: n }) => e.slice(t, n));
	return {
		byteLength: e.byteLength,
		slice(r, i = e.byteLength) {
			let a = t.findIndex(({ startByte: e, endByte: t }) => e <= r && i <= t);
			if (a < 0) return e.slice(r, i);
			if (t[a].startByte !== r || t[a].endByte !== i) {
				let e = r - t[a].startByte, o = i - t[a].startByte;
				return n[a] instanceof Promise ? n[a].then((t) => t.slice(e, o)) : n[a].slice(e, o);
			} else return n[a];
		}
	};
}
//#endregion
//#region node_modules/hyparquet/src/variant.js
var ht = new TextDecoder(), gt = /* @__PURE__ */ new WeakMap();
function _t(e, t = g) {
	if (Array.isArray(e)) return e.map((e) => _t(e, t));
	if (typeof e != "object") return e;
	if ("metadata" in e) {
		let n = bt(e.metadata), r = e.typed_value && vt(e.typed_value, n, t), i = e.value && St(yt(e.value), n, t);
		return r && i ? {
			...i,
			...r
		} : r ?? i;
	}
	return e;
}
function vt(e, t, n) {
	if (e instanceof Date) return e;
	if (e && typeof e == "object" && !Array.isArray(e) && !(e instanceof Uint8Array)) {
		if ("typed_value" in e && e.typed_value !== null && e.typed_value !== void 0) return vt(e.typed_value, t, n);
		if ("value" in e && e.value instanceof Uint8Array) return St(yt(e.value), t, n);
		if ("typed_value" in e || "value" in e) return null;
		let r = {};
		for (let [i, a] of Object.entries(e)) t.dictionary.includes(i) && (r[i] = vt(a, t, n));
		return r;
	}
	return e instanceof Uint8Array ? St(yt(e), t, n) : Array.isArray(e) ? e.map((e) => vt(e, t, n)) : e;
}
function yt(e) {
	return {
		view: new DataView(e.buffer, e.byteOffset, e.byteLength),
		offset: 0
	};
}
function bt(e) {
	let t = gt.get(e.buffer);
	t || (t = /* @__PURE__ */ new Map(), gt.set(e.buffer, t));
	let n = `${e.byteOffset}:${e.byteLength}`, r = t.get(n);
	if (r) return r;
	let i = yt(e), a = i.view.getUint8(i.offset++), o = a & 15;
	if (o !== 1) throw Error(`parquet unsupported variant metadata version: ${o}`);
	let s = (a >> 4 & 1) == 1, c = (a >> 6 & 3) + 1, l = xt(i, c), u = Array(l + 1);
	for (let e = 0; e < u.length; e++) u[e] = xt(i, c);
	let d = i.offset, f = Array(l);
	for (let t = 0; t < l; t++) {
		let n = u[t], r = u[t + 1], i = new Uint8Array(e.buffer, e.byteOffset + d + n, r - n);
		f[t] = ht.decode(i);
	}
	let p = {
		dictionary: f,
		sorted: s
	};
	return t.set(n, p), p;
}
function xt(e, t) {
	let n = 0;
	for (let r = 0; r < t; r++) n |= e.view.getUint8(e.offset + r) << r * 8;
	return e.offset += t, n;
}
function St(e, t, n) {
	let r = e.view.getUint8(e.offset++), i = r & 3, a = r >> 2;
	if (i === 0) return Ct(e, a, n);
	if (i === 2) return wt(e, a, t, n);
	if (i === 3) return Tt(e, a, t, n);
	let o = new Uint8Array(e.view.buffer, e.view.byteOffset + e.offset, a);
	return e.offset += a, ht.decode(o);
}
function Ct(e, t, n) {
	switch (t) {
		case 0: return null;
		case 1: return !0;
		case 2: return !1;
		case 3: {
			let t = e.view.getInt8(e.offset);
			return e.offset += 1, t;
		}
		case 4: {
			let t = e.view.getInt16(e.offset, !0);
			return e.offset += 2, t;
		}
		case 5: {
			let t = e.view.getInt32(e.offset, !0);
			return e.offset += 4, t;
		}
		case 6: {
			let t = e.view.getBigInt64(e.offset, !0);
			return e.offset += 8, t;
		}
		case 7: {
			let t = e.view.getFloat64(e.offset, !0);
			return e.offset += 8, t;
		}
		case 8: return Et(e, 4);
		case 9: return Et(e, 8);
		case 10: return Et(e, 16);
		case 11: {
			let t = e.view.getInt32(e.offset, !0);
			return e.offset += 4, n.dateFromDays(t);
		}
		case 12:
		case 13: {
			let t = e.view.getBigInt64(e.offset, !0);
			return e.offset += 8, n.timestampFromMicroseconds(t);
		}
		case 14: {
			let t = e.view.getFloat32(e.offset, !0);
			return e.offset += 4, t;
		}
		case 15: return Dt(e);
		case 16: {
			let t = Dt(e);
			return ht.decode(t);
		}
		case 17: {
			let t = e.view.getBigInt64(e.offset, !0);
			return e.offset += 8, t;
		}
		case 18:
		case 19: {
			let t = e.view.getBigInt64(e.offset, !0);
			return e.offset += 8, n.timestampFromNanoseconds(t);
		}
		case 20: {
			let t = new Uint8Array(e.view.buffer, e.view.byteOffset + e.offset, 16);
			e.offset += 16;
			let n = Array.from(t, (e) => e.toString(16).padStart(2, "0")).join("");
			return `${n.slice(0, 8)}-${n.slice(8, 12)}-${n.slice(12, 16)}-${n.slice(16, 20)}-${n.slice(20)}`;
		}
		default: throw Error(`parquet unsupported variant primitive type: ${t}`);
	}
}
function wt(e, t, n, r) {
	let i = (t & 3) + 1, a = (t >> 2 & 3) + 1, o = t >> 4 & 1 ? xt(e, 4) : e.view.getUint8(e.offset++), s = Array(o);
	for (let t = 0; t < o; t++) s[t] = xt(e, a);
	let c = Array(o + 1);
	for (let t = 0; t < c.length; t++) c[t] = xt(e, i);
	let l = {};
	for (let t = 0; t < o; t++) {
		let i = n.dictionary[s[t]];
		l[i] = St({
			view: e.view,
			offset: e.offset + c[t]
		}, n, r);
	}
	return e.offset += c[c.length - 1], l;
}
function Tt(e, t, n, r) {
	let i = t & 3, a = t >> 2 & 1, o = i + 1, s = xt(e, a ? 4 : 1), c = Array(s + 1);
	for (let t = 0; t < c.length; t++) c[t] = xt(e, o);
	let l = e.offset, u = Array(s);
	for (let t = 0; t < s; t++) u[t] = St({
		view: e.view,
		offset: l + c[t]
	}, n, r);
	return e.offset = l + c[c.length - 1], u;
}
function Et(e, t) {
	let n = e.view.getUint8(e.offset);
	e.offset += 1;
	let r;
	if (t === 4) r = BigInt(e.view.getInt32(e.offset, !0)), e.offset += 4;
	else if (t === 8) r = e.view.getBigInt64(e.offset, !0), e.offset += 8;
	else {
		let t = e.view.getBigUint64(e.offset, !0);
		r = e.view.getBigInt64(e.offset + 8, !0) << 64n | t, e.offset += 16;
	}
	return Number(r) * 10 ** -n;
}
function Dt(e) {
	let t = e.view.getUint32(e.offset, !0);
	e.offset += 4;
	let n = new Uint8Array(e.view.buffer, e.view.byteOffset + e.offset, t);
	return e.offset += t, n;
}
//#endregion
//#region node_modules/hyparquet/src/assemble.js
function Ot(e, t, n, r, i) {
	let a = E(i);
	if (!t?.length && !n.length) {
		if (!a || !r.length) return r;
		t = Array(r.length).fill(a);
	}
	let o = t?.length || n.length, s = i.map(({ element: e }) => e.repetition_type), c = 0, l = [e], u = e, d = 0, f = 0, p = 0;
	if (n[0]) for (; d < s.length - 2 && p < n[0];) d++, s[d] !== "REQUIRED" && (u = u.at(-1), l.push(u), f++), s[d] === "REPEATED" && p++;
	for (let e = 0; e < o; e++) {
		let i = t?.length ? t[e] : a, o = n[e];
		for (; d && (o < p || s[d] !== "REPEATED");) s[d] !== "REQUIRED" && (l.pop(), f--), s[d] === "REPEATED" && p--, d--;
		for (u = l.at(-1); (d < s.length - 2 || s[d + 1] === "REPEATED") && (f < i || s[d + 1] === "REQUIRED");) {
			if (d++, s[d] !== "REQUIRED") {
				let e = [];
				u.push(e), u = e, l.push(e), f++;
			}
			s[d] === "REPEATED" && p++;
		}
		i === a ? u.push(r[c++]) : d === s.length - 2 ? u.push(null) : u.push([]);
	}
	if (!e.length) for (let e = 0; e < a; e++) {
		let e = [];
		u.push(e), u = e;
	}
	return e;
}
function kt(e, t, n, r = 0) {
	let i = t.path.join("."), a = t.element.repetition_type === "OPTIONAL", o = a ? r + 1 : r;
	if (D(t)) {
		let s = t.children[0], c = o;
		s.children.length === 1 && (s = s.children[0], c++), kt(e, s, n, c);
		let l = s.path.join("."), u = e.get(l);
		if (!u) throw Error("parquet list column missing values");
		a && At(u, r), e.set(i, u), e.delete(l);
		return;
	}
	if (O(t)) {
		let s = t.children[0].element.name;
		kt(e, t.children[0].children[0], n, o + 1), kt(e, t.children[0].children[1], n, o + 1);
		let c = e.get(`${i}.${s}.key`), l = e.get(`${i}.${s}.value`);
		if (!c) throw Error("parquet map column missing keys");
		if (!l) throw Error("parquet map column missing values");
		if (c.length !== l.length) throw Error("parquet map column key/value length mismatch");
		let u = jt(c, l, o);
		a && At(u, r), e.delete(`${i}.${s}.key`), e.delete(`${i}.${s}.value`), e.set(i, u);
		return;
	}
	if (t.children.length) {
		let o = t.element.repetition_type === "REQUIRED" ? r : r + 1, s = {};
		for (let r of t.children) {
			kt(e, r, n, o);
			let t = e.get(r.path.join("."));
			if (!t) throw Error("parquet struct missing child data");
			s[r.element.name] = t;
		}
		for (let n of t.children) e.delete(n.path.join("."));
		let c = Mt(s, o);
		t.element.logical_type?.type === "VARIANT" && (c = _t(c, n)), a && At(c, r), e.set(i, c);
	}
}
function At(e, t) {
	for (let n = 0; n < e.length; n++) t ? At(e[n], t - 1) : e[n] = e[n][0];
}
function jt(e, t, n) {
	let r = [];
	for (let i = 0; i < e.length; i++) if (n) r.push(jt(e[i], t[i], n - 1));
	else if (e[i]) {
		let n = {};
		for (let r = 0; r < e[i].length; r++) {
			let a = t[i][r];
			n[e[i][r]] = a === void 0 ? null : a;
		}
		r.push(n);
	} else r.push(void 0);
	return r;
}
function Mt(e, t) {
	let n = Object.keys(e), r = e[n[0]]?.length, i = [];
	for (let a = 0; a < r; a++) {
		let o = {};
		for (let t of n) {
			if (e[t].length !== r) throw Error("parquet struct parsing error");
			o[t] = e[t][a];
		}
		t ? i.push(Mt(o, t - 1)) : i.push(o);
	}
	return i;
}
//#endregion
//#region node_modules/hyparquet/src/delta.js
function Nt(e, t, n) {
	if (n instanceof Int32Array) {
		Pt(e, t, n);
		return;
	}
	let r = L(e), i = L(e);
	L(e);
	let a = se(e), o = 0;
	n[o++] = a;
	let s = r / i;
	for (; o < t;) {
		let r = se(e), c = new Uint8Array(i);
		for (let t = 0; t < i; t++) c[t] = e.view.getUint8(e.offset++);
		for (let l = 0; l < i && o < t; l++) {
			let i = c[l];
			if (i) {
				let c = 0, l = s, u = (1n << BigInt(i)) - 1n;
				for (; l && o < t;) {
					let t = BigInt(e.view.getUint32(e.offset, !0) >>> c) & u;
					for (c += i; c >= 32;) c -= 32, e.offset += 4, c && (t |= BigInt(e.view.getUint32(e.offset, !0)) << BigInt(i - c) & u);
					let s = r + t;
					a += s, n[o++] = a, l--;
				}
				l && (e.offset += Math.ceil((l * i + c) / 8));
			} else for (let e = 0; e < s && o < t; e++) a += r, n[o++] = a;
		}
	}
}
function Pt(e, t, n) {
	let r = L(e), i = L(e);
	L(e);
	let a = R(e), o = 0;
	n[o++] = a;
	let s = r / i;
	for (; o < t;) {
		let r = R(e), c = e.offset;
		e.offset += i;
		for (let l = 0; l < i && o < t; l++) {
			let i = e.view.getUint8(c + l), u = e.offset + s * i / 8, d = 0;
			for (let c = 0; c < s && o < t; c++) {
				let t = 0, s = 0;
				for (; s < i;) {
					let n = Math.min(8 - d, i - s);
					t |= (e.view.getUint8(e.offset) >>> d & (1 << n) - 1) << s, s += n, d += n, d === 8 && (d = 0, e.offset++);
				}
				a = a + r + t | 0, n[o++] = a;
			}
			e.offset = u;
		}
	}
}
function Ft(e, t, n) {
	let r = new Int32Array(t);
	Nt(e, t, r);
	for (let i = 0; i < t; i++) n[i] = new Uint8Array(e.view.buffer, e.view.byteOffset + e.offset, r[i]), e.offset += r[i];
}
function It(e, t, n) {
	let r = new Int32Array(t);
	Nt(e, t, r);
	let i = new Int32Array(t);
	Nt(e, t, i);
	for (let a = 0; a < t; a++) {
		let t = new Uint8Array(e.view.buffer, e.view.byteOffset + e.offset, i[a]);
		r[a] ? (n[a] = new Uint8Array(r[a] + i[a]), n[a].set(n[a - 1].subarray(0, r[a])), n[a].set(t, r[a])) : n[a] = t, e.offset += i[a];
	}
}
//#endregion
//#region node_modules/hyparquet/src/encoding.js
function W(e, t, n, r) {
	r === void 0 && (r = e.view.getUint32(e.offset, !0), e.offset += 4);
	let i = e.offset, a = 0;
	for (; a < n.length;) {
		let r = L(e);
		if (r & 1) a = Rt(e, r, t, n, a);
		else {
			let i = r >>> 1;
			Lt(e, i, t, n, a), a += i;
		}
	}
	e.offset = i + r;
}
function Lt(e, t, n, r, i) {
	let a = n + 7 >> 3, o = 0;
	for (let t = 0; t < a; t++) o |= e.view.getUint8(e.offset++) << (t << 3);
	for (let e = 0; e < t; e++) r[i + e] = o;
}
function Rt(e, t, n, r, i) {
	let a = t >> 1 << 3, o = (1 << n) - 1, s = 0;
	if (e.offset < e.view.byteLength) s = e.view.getUint8(e.offset++);
	else if (o) throw Error(`parquet bitpack offset ${e.offset} out of range`);
	let c = 8, l = 0;
	for (; a;) l > 8 ? (l -= 8, c -= 8, s >>>= 8) : c - l < n ? (s |= e.view.getUint8(e.offset) << c, e.offset++, c += 8) : (i < r.length && (r[i++] = s >> l & o), a--, l += n);
	return i;
}
function zt(e, t, n, r) {
	let i = Bt(n, r), a = new Uint8Array(t * i);
	for (let n = 0; n < i; n++) for (let r = 0; r < t; r++) a[r * i + n] = e.view.getUint8(e.offset++);
	if (n === "FLOAT") return new Float32Array(a.buffer);
	if (n === "DOUBLE") return new Float64Array(a.buffer);
	if (n === "INT32") return new Int32Array(a.buffer);
	if (n === "INT64") return new BigInt64Array(a.buffer);
	if (n === "FIXED_LEN_BYTE_ARRAY") {
		let e = Array(t);
		for (let n = 0; n < t; n++) e[n] = a.subarray(n * i, (n + 1) * i);
		return e;
	}
	throw Error(`parquet byte_stream_split unsupported type: ${n}`);
}
function Bt(e, t) {
	switch (e) {
		case "INT32":
		case "FLOAT": return 4;
		case "INT64":
		case "DOUBLE": return 8;
		case "FIXED_LEN_BYTE_ARRAY":
			if (!t) throw Error("parquet byteWidth missing type_length");
			return t;
		default: throw Error(`parquet unsupported type: ${e}`);
	}
}
//#endregion
//#region node_modules/hyparquet/src/plain.js
function Vt(e, t, n, r) {
	if (n === 0) return [];
	if (t === "BOOLEAN") return Ht(e, n);
	if (t === "INT32") return Ut(e, n);
	if (t === "INT64") return Wt(e, n);
	if (t === "INT96") return Gt(e, n);
	if (t === "FLOAT") return Kt(e, n);
	if (t === "DOUBLE") return qt(e, n);
	if (t === "BYTE_ARRAY") return Jt(e, n);
	if (t === "FIXED_LEN_BYTE_ARRAY") {
		if (!r) throw Error("parquet missing fixed length");
		return Yt(e, n, r);
	} else throw Error(`parquet unhandled type: ${t}`);
}
function Ht(e, t) {
	let n = Array(t);
	for (let r = 0; r < t; r++) {
		let t = e.offset + (r / 8 | 0), i = r % 8;
		n[r] = (e.view.getUint8(t) & 1 << i) != 0;
	}
	return e.offset += Math.ceil(t / 8), n;
}
function Ut(e, t) {
	let n = (e.view.byteOffset + e.offset) % 4 ? new Int32Array(Xt(e.view.buffer, e.view.byteOffset + e.offset, t * 4)) : new Int32Array(e.view.buffer, e.view.byteOffset + e.offset, t);
	return e.offset += t * 4, n;
}
function Wt(e, t) {
	let n = (e.view.byteOffset + e.offset) % 8 ? new BigInt64Array(Xt(e.view.buffer, e.view.byteOffset + e.offset, t * 8)) : new BigInt64Array(e.view.buffer, e.view.byteOffset + e.offset, t);
	return e.offset += t * 8, n;
}
function Gt(e, t) {
	let n = Array(t);
	for (let r = 0; r < t; r++) {
		let t = e.view.getBigInt64(e.offset + r * 12, !0), i = e.view.getInt32(e.offset + r * 12 + 8, !0);
		n[r] = BigInt(i) << 64n | t;
	}
	return e.offset += t * 12, n;
}
function Kt(e, t) {
	let n = (e.view.byteOffset + e.offset) % 4 ? new Float32Array(Xt(e.view.buffer, e.view.byteOffset + e.offset, t * 4)) : new Float32Array(e.view.buffer, e.view.byteOffset + e.offset, t);
	return e.offset += t * 4, n;
}
function qt(e, t) {
	let n = (e.view.byteOffset + e.offset) % 8 ? new Float64Array(Xt(e.view.buffer, e.view.byteOffset + e.offset, t * 8)) : new Float64Array(e.view.buffer, e.view.byteOffset + e.offset, t);
	return e.offset += t * 8, n;
}
function Jt(e, t) {
	let n = Array(t);
	for (let r = 0; r < t; r++) {
		let t = e.view.getUint32(e.offset, !0);
		e.offset += 4, n[r] = new Uint8Array(e.view.buffer, e.view.byteOffset + e.offset, t), e.offset += t;
	}
	return n;
}
function Yt(e, t, n) {
	let r = Array(t);
	for (let i = 0; i < t; i++) r[i] = new Uint8Array(e.view.buffer, e.view.byteOffset + e.offset, n), e.offset += n;
	return r;
}
function Xt(e, t, n) {
	let r = new ArrayBuffer(n);
	return new Uint8Array(r).set(new Uint8Array(e, t, n)), r;
}
//#endregion
//#region node_modules/hyparquet/src/snappy.js
var Zt = [
	0,
	255,
	65535,
	16777215,
	4294967295
];
function Qt(e, t, n, r, i) {
	for (let a = 0; a < i; a++) n[r + a] = e[t + a];
}
function $t(e, t) {
	let n = e.byteLength, r = t.byteLength, i = 0, a = 0;
	for (; i < n;) {
		let t = e[i];
		if (i++, t < 128) break;
	}
	if (r && i >= n) throw Error("invalid snappy length header");
	for (; i < n;) {
		let r = e[i], o = 0;
		if (i++, i >= n) throw Error("missing eof marker");
		if (r & 3) {
			let s = 0;
			switch (r & 3) {
				case 1:
					o = (r >>> 2 & 7) + 4, s = e[i] + (r >>> 5 << 8), i++;
					break;
				case 2:
					if (n <= i + 1) throw Error("snappy error end of input");
					o = (r >>> 2) + 1, s = e[i] + (e[i + 1] << 8), i += 2;
					break;
				case 3:
					if (n <= i + 3) throw Error("snappy error end of input");
					o = (r >>> 2) + 1, s = e[i] + (e[i + 1] << 8) + (e[i + 2] << 16) + (e[i + 3] << 24), i += 4;
					break;
				default: break;
			}
			if (s === 0 || isNaN(s)) throw Error(`invalid offset ${s} pos ${i} inputLength ${n}`);
			if (s > a) throw Error("cannot copy from before start of buffer");
			Qt(t, a - s, t, a, o), a += o;
		} else {
			let o = (r >>> 2) + 1;
			if (o > 60) {
				if (i + 3 >= n) throw Error("snappy error literal pos + 3 >= inputLength");
				let t = o - 60;
				o = e[i] + (e[i + 1] << 8) + (e[i + 2] << 16) + (e[i + 3] << 24), o = (o & Zt[t]) + 1, i += t;
			}
			if (i + o > n) throw Error("snappy error literal exceeds input length");
			Qt(e, i, t, a, o), i += o, a += o;
		}
	}
	if (a !== r) throw Error("premature end of input");
}
//#endregion
//#region node_modules/hyparquet/src/datapage.js
function en(e, t, { type: n, element: r, schemaPath: i }) {
	let a = new DataView(e.buffer, e.byteOffset, e.byteLength), o = {
		view: a,
		offset: 0
	}, s, c = tn(o, t, i), { definitionLevels: l, numNulls: u } = nn(o, t, i), d = t.num_values - u;
	if (t.encoding === "PLAIN") s = Vt(o, n, d, r.type_length);
	else if (t.encoding === "PLAIN_DICTIONARY" || t.encoding === "RLE_DICTIONARY" || t.encoding === "RLE") {
		let e = n === "BOOLEAN" ? 1 : a.getUint8(o.offset++);
		e ? (s = Array(d), n === "BOOLEAN" ? (W(o, e, s), s = s.map((e) => !!e)) : W(o, e, s, a.byteLength - o.offset)) : s = new Uint8Array(d);
	} else if (t.encoding === "BYTE_STREAM_SPLIT") s = zt(o, d, n, r.type_length);
	else if (t.encoding === "DELTA_BINARY_PACKED") s = n === "INT32" ? new Int32Array(d) : new BigInt64Array(d), Nt(o, d, s);
	else if (t.encoding === "DELTA_LENGTH_BYTE_ARRAY") s = Array(d), Ft(o, d, s);
	else throw Error(`parquet unsupported encoding: ${t.encoding}`);
	return {
		definitionLevels: l,
		repetitionLevels: c,
		dataPage: s
	};
}
function tn(e, t, n) {
	if (n.length > 1) {
		let r = T(n);
		if (r) {
			let n = Array(t.num_values);
			return W(e, cn(r), n), n;
		}
	}
	return [];
}
function nn(e, t, n) {
	let r = E(n);
	if (!r) return {
		definitionLevels: [],
		numNulls: 0
	};
	let i = Array(t.num_values);
	W(e, cn(r), i);
	let a = t.num_values;
	for (let e of i) e === r && a--;
	return a === 0 && (i.length = 0), {
		definitionLevels: i,
		numNulls: a
	};
}
function rn(e, t, n, r) {
	let i, a = r?.[n];
	if (n === "UNCOMPRESSED") i = e;
	else if (a) i = a(e, t);
	else if (n === "SNAPPY") i = new Uint8Array(t), $t(e, i);
	else throw Error(`parquet unsupported compression codec: ${n}`);
	if (i?.length !== t) throw Error(`parquet decompressed page length ${i?.length} does not match header ${t}`);
	return i;
}
function an(e, t, n) {
	let r = {
		view: new DataView(e.buffer, e.byteOffset, e.byteLength),
		offset: 0
	}, { type: i, element: a, schemaPath: o, codec: s, compressors: c } = n, l = t.data_page_header_v2;
	if (!l) throw Error("parquet data page header v2 is undefined");
	let u = on(r, l, o);
	r.offset = l.repetition_levels_byte_length;
	let d = sn(r, l, o), f = t.uncompressed_page_size - l.definition_levels_byte_length - l.repetition_levels_byte_length, p = e.subarray(r.offset);
	l.is_compressed !== !1 && (p = rn(p, f, s, c));
	let m = new DataView(p.buffer, p.byteOffset, p.byteLength), h = {
		view: m,
		offset: 0
	}, g, _ = l.num_values - l.num_nulls;
	if (l.encoding === "PLAIN") g = Vt(h, i, _, a.type_length);
	else if (l.encoding === "RLE") g = Array(_), W(h, 1, g), g = g.map((e) => !!e);
	else if (l.encoding === "PLAIN_DICTIONARY" || l.encoding === "RLE_DICTIONARY") {
		let e = m.getUint8(h.offset++);
		g = Array(_), W(h, e, g, f - 1);
	} else if (l.encoding === "DELTA_BINARY_PACKED") g = i === "INT32" ? new Int32Array(_) : new BigInt64Array(_), Nt(h, _, g);
	else if (l.encoding === "DELTA_LENGTH_BYTE_ARRAY") g = Array(_), Ft(h, _, g);
	else if (l.encoding === "DELTA_BYTE_ARRAY") g = Array(_), It(h, _, g);
	else if (l.encoding === "BYTE_STREAM_SPLIT") g = zt(h, _, i, a.type_length);
	else throw Error(`parquet unsupported encoding: ${l.encoding}`);
	return {
		definitionLevels: d,
		repetitionLevels: u,
		dataPage: g
	};
}
function on(e, t, n) {
	let r = T(n);
	if (!r) return [];
	let i = Array(t.num_values);
	return W(e, cn(r), i, t.repetition_levels_byte_length), i;
}
function sn(e, t, n) {
	let r = E(n);
	if (r) {
		let n = Array(t.num_values);
		return W(e, cn(r), n, t.definition_levels_byte_length), n;
	}
}
function cn(e) {
	return 32 - Math.clz32(e);
}
//#endregion
//#region node_modules/hyparquet/src/column.js
function ln(e, { groupStart: t, selectStart: n, selectEnd: r }, i, a) {
	let { pathInSchema: o, schemaPath: s } = i, c = k(s), l = [], u, d, f = 0, p = 0, m = a && (() => {
		d && a({
			pathInSchema: o,
			columnData: d,
			rowStart: t + f - d.length,
			rowEnd: t + f
		});
	});
	for (; (c ? f < r : e.offset < e.view.byteLength - 1) && !(e.offset >= e.view.byteLength - 1);) {
		let t = dn(e);
		if (t.type === "DICTIONARY_PAGE") {
			let { data: n } = un(e, t, i, u, void 0, 0);
			n && (u = v(n, i));
		} else {
			let r = d?.length || 0, a = un(e, t, i, u, d, n - f);
			a.skipped ? (l.length || (p += a.skipped), f += a.skipped) : a.data && d === a.data ? f += a.data.length - r : a.data && a.data.length && (m?.(), l.push(a.data), f += a.data.length, d = a.data);
		}
	}
	return m?.(), {
		data: l,
		skipped: p
	};
}
function un(e, t, n, r, i, a) {
	let { type: o, element: s, schemaPath: c, codec: l, compressors: u } = n, d = new Uint8Array(e.view.buffer, e.view.byteOffset + e.offset, t.compressed_page_size);
	if (e.offset += t.compressed_page_size, t.type === "DATA_PAGE") {
		let e = t.data_page_header;
		if (!e) throw Error("parquet data page header is undefined");
		if (a > e.num_values && k(c)) return { skipped: e.num_values };
		let { definitionLevels: o, repetitionLevels: s, dataPage: f } = en(rn(d, Number(t.uncompressed_page_size), l, u), e, n), p = _(f, r, e.encoding, n);
		return {
			skipped: 0,
			data: Ot(Array.isArray(i) ? i : [], o, s, p, c)
		};
	} else if (t.type === "DATA_PAGE_V2") {
		let e = t.data_page_header_v2;
		if (!e) throw Error("parquet data page header v2 is undefined");
		if (a > e.num_rows) return { skipped: e.num_values };
		let { definitionLevels: o, repetitionLevels: s, dataPage: l } = an(d, t, n), u = _(l, r, e.encoding, n);
		return {
			skipped: 0,
			data: Ot(Array.isArray(i) ? i : [], o, s, u, c)
		};
	} else if (t.type === "DICTIONARY_PAGE") {
		let e = t.dictionary_page_header;
		if (!e) throw Error("parquet dictionary page header is undefined");
		let n = rn(d, Number(t.uncompressed_page_size), l, u);
		return {
			skipped: 0,
			data: Vt({
				view: new DataView(n.buffer, n.byteOffset, n.byteLength),
				offset: 0
			}, o, e.num_values, s.type_length)
		};
	} else throw Error(`parquet unsupported page type: ${t.type}`);
}
function dn(e) {
	let t = F(e);
	return {
		type: s[t.field_1],
		uncompressed_page_size: t.field_2,
		compressed_page_size: t.field_3,
		crc: t.field_4,
		data_page_header: t.field_5 && {
			num_values: t.field_5.field_1,
			encoding: r[t.field_5.field_2],
			definition_level_encoding: r[t.field_5.field_3],
			repetition_level_encoding: r[t.field_5.field_4],
			statistics: t.field_5.field_5 && {
				max: t.field_5.field_5.field_1,
				min: t.field_5.field_5.field_2,
				null_count: t.field_5.field_5.field_3,
				distinct_count: t.field_5.field_5.field_4,
				max_value: t.field_5.field_5.field_5,
				min_value: t.field_5.field_5.field_6
			}
		},
		index_page_header: t.field_6,
		dictionary_page_header: t.field_7 && {
			num_values: t.field_7.field_1,
			encoding: r[t.field_7.field_2],
			is_sorted: t.field_7.field_3
		},
		data_page_header_v2: t.field_8 && {
			num_values: t.field_8.field_1,
			num_nulls: t.field_8.field_2,
			num_rows: t.field_8.field_3,
			encoding: r[t.field_8.field_4],
			definition_levels_byte_length: t.field_8.field_5,
			repetition_levels_byte_length: t.field_8.field_6,
			is_compressed: t.field_8.field_7 === void 0 ? !0 : t.field_8.field_7,
			statistics: t.field_8.field_8
		}
	};
}
//#endregion
//#region node_modules/hyparquet/src/rowgroup.js
function fn(e, { metadata: t }, n) {
	let r = [];
	for (let i of n.chunks) {
		let { path_in_schema: a } = i.columnMetadata, o = C(t.schema, a), s = {
			pathInSchema: a,
			element: o[o.length - 1].element,
			schemaPath: o,
			...e,
			...i.columnMetadata,
			parsers: {
				...g,
				...e.parsers
			}
		}, { startByte: c, endByte: l } = i.range;
		"pageLocations" in i ? r.push({
			pathInSchema: a,
			data: pn(e, n, i, i.pageLocations, s)
		}) : "offsetIndex" in i ? r.push({
			pathInSchema: a,
			data: Promise.resolve(e.file.slice(i.offsetIndex.startByte, i.offsetIndex.endByte)).then((t) => {
				let r = ye({
					view: new DataView(t),
					offset: 0
				}).page_locations;
				return pn(e, n, i, r, s);
			})
		}) : r.push({
			pathInSchema: a,
			data: Promise.resolve(e.file.slice(c, l)).then((t) => ln({
				view: new DataView(t),
				offset: 0
			}, n, s, e.onPage))
		});
	}
	return {
		groupStart: n.groupStart,
		groupRows: n.groupRows,
		selectStart: n.selectStart,
		selectEnd: n.selectEnd,
		asyncColumns: r
	};
}
async function pn(e, t, n, r, i) {
	let { data_page_offset: a, dictionary_page_offset: o } = n.columnMetadata, { selectStart: s, selectEnd: c } = t, { startByte: l, endByte: u } = n.range, d = -1, f = o || a < r[0].offset;
	for (let e = 0; e < r.length; e++) {
		let n = r[e], i = Number(n.first_row_index), a = e + 1 < r.length ? Number(r[e + 1].first_row_index) : t.groupRows;
		d < 0 && a > s && (l = Number(n.offset), d = i), i < c && (u = Number(n.offset) + n.compressed_page_size);
	}
	d < 0 && (d = 0);
	let p;
	if (f && d) {
		let t = Number(r[0].offset) - n.range.startByte, [i, a] = await Promise.all([e.file.slice(n.range.startByte, Number(r[0].offset)), e.file.slice(l, u)]), o = new Uint8Array(t + a.byteLength);
		o.set(new Uint8Array(i, 0, t)), o.set(new Uint8Array(a), t), p = new DataView(o.buffer);
	} else p = f ? new DataView(await e.file.slice(n.range.startByte, u)) : new DataView(await e.file.slice(l, u));
	let { data: m, skipped: h } = ln({
		view: p,
		offset: 0
	}, d ? {
		...t,
		groupStart: t.groupStart + d,
		selectStart: t.selectStart - d,
		selectEnd: t.selectEnd - d
	} : t, i, e.onPage);
	return {
		data: m,
		skipped: d + h
	};
}
async function mn({ asyncColumns: e }, t, n, r, i) {
	let a = await Promise.all(e.map((e) => e.data.then(({ skipped: e, data: t }) => ({
		skipped: e,
		data: He(t)
	})))), o = n - t;
	if (i === "object") {
		let n = Array(o);
		for (let r = 0; r < o; r++) {
			let i = {};
			for (let n = 0; n < e.length; n++) {
				let { data: o, skipped: s } = a[n];
				i[e[n].pathInSchema[0]] = o[t + r - s];
			}
			n[r] = i;
		}
		return n;
	}
	let s = e.map((e) => e.pathInSchema[0]).filter((e) => !r || r.includes(e)), c = r ?? s, l = c.map((t) => e.findIndex((e) => e.pathInSchema[0] === t)), u = Array(o);
	for (let n = 0; n < o; n++) {
		let r = Array(e.length);
		for (let e = 0; e < c.length; e++) {
			let i = l[e];
			if (i < 0) throw Error(`parquet column not found: ${c[e]}`);
			let { data: o, skipped: s } = a[i];
			r[e] = o[t + n - s];
		}
		u[n] = r;
	}
	return u;
}
function hn(e, t, n) {
	let { asyncColumns: r } = e, i = {
		...g,
		...n
	}, a = [];
	for (let n of t.children) if (n.children.length) {
		let t = r.filter((e) => e.pathInSchema[0] === n.element.name);
		if (!t.length) continue;
		a.push({
			pathInSchema: n.path,
			data: (async () => {
				let r = await Promise.all(t.map((e) => e.data)), a = /* @__PURE__ */ new Map(), o = r.map(({ data: e }) => He(e)), s = Math.max(e.selectStart ?? 0, ...r.map((e) => e.skipped)), c = Math.min(e.selectEnd ?? Infinity, ...r.map((e, t) => e.skipped + o[t].length));
				for (let e = 0; e < t.length; e++) {
					let n = s - r[e].skipped, i = Math.max(0, c - s);
					a.set(t[e].pathInSchema.join("."), o[e].slice(n, n + i));
				}
				kt(a, n, i);
				let l = a.get(n.element.name);
				if (!l) throw Error("parquet column data not assembled");
				return {
					data: [l],
					skipped: s
				};
			})()
		});
	} else {
		let e = r.find((e) => e.pathInSchema[0] === n.element.name);
		e && a.push(e);
	}
	return {
		...e,
		asyncColumns: a
	};
}
//#endregion
//#region node_modules/hyparquet/src/scan.js
async function gn(e) {
	let t = await _n(e);
	return {
		options: t,
		plan: at(t)
	};
}
async function _n(e) {
	let t = e.metadata ?? await de(e.file, e), n = pe(t).children.map((e) => e.element.name), r = Ge(e.filter).filter((e) => !n.includes(e));
	if (r.length) throw Error(`parquet filter columns not found: ${r.join(", ")}`);
	if (e.columns) {
		let t = e.columns.filter((e) => !n.includes(e));
		if (t.length) throw Error(`parquet column not found: ${t[0]}`);
	}
	let i = {
		...e,
		metadata: t
	};
	return i = await yn(i), i = await bn(i), i;
}
function vn(e, t) {
	let n = {
		...e,
		file: mt(e.file, t)
	};
	return t.groups.map((e) => fn(n, t, e));
}
async function yn(e) {
	if (!e.useBloomFilters || !e.filter || !e.metadata) return e;
	let t = pe(e.metadata), n = {};
	for (let e of t.children) n[e.element.name] = e.element;
	let r = await ut({
		file: e.file,
		metadata: e.metadata,
		filter: e.filter,
		filterStrict: e.filterStrict
	});
	return {
		...e,
		bloomFiltersByGroup: r,
		schemaElements: n
	};
}
async function bn(e) {
	if (!e.usePageIndex || !e.filter || !e.metadata) return e;
	let { pageRangesByGroup: t, pageLocationsByGroup: n } = await dt({
		file: e.file,
		metadata: e.metadata,
		filter: e.filter,
		filterStrict: e.filterStrict,
		rowStart: e.rowStart,
		rowEnd: e.rowEnd,
		columns: e.columns,
		bloomFiltersByGroup: e.bloomFiltersByGroup,
		schemaElements: e.schemaElements,
		parsers: e.parsers
	});
	return {
		...e,
		pageRangesByGroup: t,
		pageLocationsByGroup: n
	};
}
//#endregion
//#region node_modules/hyparquet/src/read.js
var xn = Symbol("rowIndex");
async function Sn(e) {
	e.metadata ??= await de(e.file, e);
	let { rowStart: t = 0, rowEnd: n, columns: r, onChunk: i, onComplete: a, rowFormat: o, filter: s, filterStrict: c = !0 } = e;
	if (s && o !== "object") throw Error("parquet filter requires rowFormat: \"object\"");
	if (e.includeRowIndex && o !== "object") throw Error("parquet includeRowIndex requires rowFormat: \"object\"");
	let l = Ge(s), u = r;
	if (r && l.length) {
		let e = new Set(r), t = l.filter((t) => !e.has(t));
		t.length && (u = [...r, ...t]);
	}
	let d = await gn(u === r ? e : {
		...e,
		columns: u
	}), f = d.options, p = u !== r, m = vn(f, d.plan);
	if (!a && !i) {
		await Cn(m);
		return;
	}
	if (!f.metadata) throw Error("parquet requires metadata");
	let h = pe(f.metadata), g = m.map((t) => hn(t, h, e.parsers));
	if (i) for (let e of g) for (let t of e.asyncColumns) t.data.then(({ data: n, skipped: r }) => {
		let a = e.groupStart + r;
		for (let e of n) i({
			columnName: t.pathInSchema[0],
			columnData: e,
			rowStart: a,
			rowEnd: a + e.length
		}), a += e.length;
	}, () => {});
	if (a) {
		await Cn(g);
		let i = [];
		for (let a of g) {
			let d = a.selectStart ?? Math.max(t - a.groupStart, 0), f = a.selectEnd ?? Math.min((n ?? Infinity) - a.groupStart, a.groupRows), m = o === "object" ? await mn(a, d, f, u, "object") : await mn(a, d, f, r, "array");
			if (e.includeRowIndex) for (let e = 0; e < m.length; e++) Object.defineProperty(m[e], xn, { value: a.groupStart + d + e });
			if (s) {
				for (let e of m) if (Ke(e, s, c)) {
					if (p && r) for (let t of l) r.includes(t) || delete e[t];
					i.push(e);
				}
			} else Ie(i, m);
		}
		a(i);
	} else await Cn(g);
}
async function Cn(e) {
	let t = e.flatMap((e) => e.asyncColumns.map((e) => e.data)), n = (await Promise.allSettled(t)).find((e) => e.status === "rejected");
	if (n) throw n.reason;
}
function wn(e) {
	return new Promise((t, n) => {
		Sn({
			...e,
			rowFormat: "object",
			onComplete: t
		}).catch(n);
	});
}
//#endregion
//#region node_modules/fzstd/esm/index.mjs
var Tn = ArrayBuffer, G = Uint8Array, En = Uint16Array, Dn = Int16Array, On = Int32Array, kn = function(e, t, n) {
	if (G.prototype.slice) return G.prototype.slice.call(e, t, n);
	(t == null || t < 0) && (t = 0), (n == null || n > e.length) && (n = e.length);
	var r = new G(n - t);
	return r.set(e.subarray(t, n)), r;
}, An = function(e, t, n, r) {
	if (G.prototype.fill) return G.prototype.fill.call(e, t, n, r);
	for ((n == null || n < 0) && (n = 0), (r == null || r > e.length) && (r = e.length); n < r; ++n) e[n] = t;
	return e;
}, jn = function(e, t, n, r) {
	if (G.prototype.copyWithin) return G.prototype.copyWithin.call(e, t, n, r);
	for ((n == null || n < 0) && (n = 0), (r == null || r > e.length) && (r = e.length); n < r;) e[t++] = e[n++];
}, Mn = [
	"invalid zstd data",
	"window size too large (>2046MB)",
	"invalid block type",
	"FSE accuracy too high",
	"match distance too far back",
	"unexpected EOF"
], K = function(e, t, n) {
	var r = Error(t || Mn[e]);
	if (r.code = e, Error.captureStackTrace && Error.captureStackTrace(r, K), !n) throw r;
	return r;
}, Nn = function(e, t, n) {
	for (var r = 0, i = 0; r < n; ++r) i |= e[t++] << (r << 3);
	return i;
}, Pn = function(e, t) {
	return (e[t] | e[t + 1] << 8 | e[t + 2] << 16 | e[t + 3] << 24) >>> 0;
}, Fn = function(e, t) {
	var n = e[0] | e[1] << 8 | e[2] << 16;
	if (n == 3126568 && e[3] == 253) {
		var r = e[4], i = r >> 5 & 1, a = r >> 2 & 1, o = r & 3, s = r >> 6;
		r & 8 && K(0);
		var c = 6 - i, l = o == 3 ? 4 : o, u = Nn(e, c, l);
		c += l;
		var d = s ? 1 << s : i, f = Nn(e, c, d) + (s == 1 && 256), p = f;
		if (!i) {
			var m = 1 << 10 + (e[5] >> 3);
			p = m + (m >> 3) * (e[5] & 7);
		}
		p > 2145386496 && K(1);
		var h = new G((t == 1 ? f || p : t ? 0 : p) + 12);
		return h[0] = 1, h[4] = 4, h[8] = 8, {
			b: c + d,
			y: 0,
			l: 0,
			d: u,
			w: t && t != 1 ? t : h.subarray(12),
			e: p,
			o: new On(h.buffer, 0, 3),
			u: f,
			c: a,
			m: Math.min(131072, p)
		};
	} else if ((n >> 4 | e[3] << 20) == 25481893) return Pn(e, 4) + 8;
	K(0);
}, In = function(e) {
	for (var t = 0; 1 << t <= e; ++t);
	return t - 1;
}, Ln = function(e, t, n) {
	var r = (t << 3) + 4, i = (e[t] & 15) + 5;
	i > n && K(3);
	for (var a = 1 << i, o = a, s = -1, c = -1, l = -1, u = a, d = new Tn(512 + (a << 2)), f = new Dn(d, 0, 256), p = new En(d, 0, 256), m = new En(d, 512, a), h = 512 + (a << 1), g = new G(d, h, a), _ = new G(d, h + a); s < 255 && o > 0;) {
		var v = In(o + 1), y = r >> 3, b = (1 << v + 1) - 1, x = (e[y] | e[y + 1] << 8 | e[y + 2] << 16) >> (r & 7) & b, S = (1 << v) - 1, C = b - o - 1, w = x & S;
		if (w < C ? (r += v, x = w) : (r += v + 1, x > S && (x -= C)), f[++s] = --x, x == -1 ? (o += x, g[--u] = s) : o -= x, !x) do {
			var T = r >> 3;
			c = (e[T] | e[T + 1] << 8) >> (r & 7) & 3, r += 2, s += c;
		} while (c == 3);
	}
	(s > 255 || o) && K(0);
	for (var E = 0, D = (a >> 1) + (a >> 3) + 3, O = a - 1, k = 0; k <= s; ++k) {
		var A = f[k];
		if (A < 1) {
			p[k] = -A;
			continue;
		}
		for (l = 0; l < A; ++l) {
			g[E] = k;
			do
				E = E + D & O;
			while (E >= u);
		}
	}
	for (E && K(0), l = 0; l < a; ++l) {
		var j = p[g[l]]++;
		m[l] = (j << (_[l] = i - In(j))) - a;
	}
	return [r + 7 >> 3, {
		b: i,
		s: g,
		n: _,
		t: m
	}];
}, Rn = function(e, t) {
	var n = 0, r = -1, i = new G(292), a = e[t], o = i.subarray(0, 256), s = i.subarray(256, 268), c = new En(i.buffer, 268);
	if (a < 128) {
		var l = Ln(e, t + 1, 6), u = l[0], d = l[1];
		t += a;
		var f = u << 3, p = e[t];
		p || K(0);
		for (var m = 0, h = 0, g = d.b, _ = g, v = (++t << 3) - 8 + In(p); v -= g, !(v < f);) {
			var y = v >> 3;
			if (m += (e[y] | e[y + 1] << 8) >> (v & 7) & (1 << g) - 1, o[++r] = d.s[m], v -= _, v < f) break;
			y = v >> 3, h += (e[y] | e[y + 1] << 8) >> (v & 7) & (1 << _) - 1, o[++r] = d.s[h], g = d.n[m], m = d.t[m], _ = d.n[h], h = d.t[h];
		}
		++r > 255 && K(0);
	} else {
		for (r = a - 127; n < r; n += 2) {
			var b = e[++t];
			o[n] = b >> 4, o[n + 1] = b & 15;
		}
		++t;
	}
	var x = 0;
	for (n = 0; n < r; ++n) {
		var S = o[n];
		S > 11 && K(0), x += S && 1 << S - 1;
	}
	var C = In(x) + 1, w = 1 << C, T = w - x;
	for (T & T - 1 && K(0), o[r++] = In(T) + 1, n = 0; n < r; ++n) {
		var S = o[n];
		++s[o[n] = S && C + 1 - S];
	}
	var E = new G(w << 1), D = E.subarray(0, w), O = E.subarray(w);
	for (c[C] = 0, n = C; n > 0; --n) {
		var k = c[n];
		An(O, n, k, c[n - 1] = k + s[n] * (1 << C - n));
	}
	for (c[0] != w && K(0), n = 0; n < r; ++n) {
		var A = o[n];
		if (A) {
			var j = c[A];
			An(D, n, j, c[A] = j + (1 << C - A));
		}
	}
	return [t, {
		n: O,
		b: C,
		s: D
	}];
}, zn = (/*#__PURE__*/ Ln(/*#__PURE__*/ new G([
	81,
	16,
	99,
	140,
	49,
	198,
	24,
	99,
	12,
	33,
	196,
	24,
	99,
	102,
	102,
	134,
	70,
	146,
	4
]), 0, 6))[1], Bn = (/*#__PURE__*/ Ln(/*#__PURE__*/ new G([
	33,
	20,
	196,
	24,
	99,
	140,
	33,
	132,
	16,
	66,
	8,
	33,
	132,
	16,
	66,
	8,
	33,
	68,
	68,
	68,
	68,
	68,
	68,
	68,
	68,
	36,
	9
]), 0, 6))[1], Vn = (/*#__PURE__ */ Ln(/*#__PURE__*/ new G([
	32,
	132,
	16,
	66,
	102,
	70,
	68,
	68,
	68,
	68,
	36,
	73,
	2
]), 0, 5))[1], Hn = function(e, t) {
	for (var n = e.length, r = new On(n), i = 0; i < n; ++i) r[i] = t, t += 1 << e[i];
	return r;
}, Un = /*#__PURE__ */ new G((/*#__PURE__ */ new On([
	0,
	0,
	0,
	0,
	16843009,
	50528770,
	134678020,
	202050057,
	269422093
])).buffer, 0, 36), Wn = /*#__PURE__ */ Hn(Un, 0), Gn = /*#__PURE__ */ new G((/*#__PURE__ */ new On([
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	16843009,
	50528770,
	117769220,
	185207048,
	252579084,
	16
])).buffer, 0, 53), Kn = /*#__PURE__ */ Hn(Gn, 3), qn = function(e, t, n) {
	var r = e.length, i = t.length, a = e[r - 1], o = (1 << n.b) - 1, s = -n.b;
	a || K(0);
	for (var c = 0, l = n.b, u = (r << 3) - 8 + In(a) - l, d = -1; u > s && d < i;) {
		var f = u >> 3, p = (e[f] | e[f + 1] << 8 | e[f + 2] << 16) >> (u & 7);
		c = (c << l | p) & o, t[++d] = n.s[c], u -= l = n.n[c];
	}
	(u != s || d + 1 != i) && K(0);
}, Jn = function(e, t, n) {
	var r = 6, i = t.length + 3 >> 2, a = i << 1, o = i + a;
	qn(e.subarray(r, r += e[0] | e[1] << 8), t.subarray(0, i), n), qn(e.subarray(r, r += e[2] | e[3] << 8), t.subarray(i, a), n), qn(e.subarray(r, r += e[4] | e[5] << 8), t.subarray(a, o), n), qn(e.subarray(r), t.subarray(o), n);
}, Yn = function(e, t, n) {
	var r, i = t.b, a = e[i], o = a >> 1 & 3;
	t.l = a & 1;
	var s = a >> 3 | e[i + 1] << 5 | e[i + 2] << 13, c = (i += 3) + s;
	if (o == 1) return i >= e.length ? void 0 : (t.b = i + 1, n ? (An(n, e[i], t.y, t.y += s), n) : An(new G(s), e[i]));
	if (!(c > e.length)) {
		if (o == 0) return t.b = c, n ? (n.set(e.subarray(i, c), t.y), t.y += s, n) : kn(e, i, c);
		if (o == 2) {
			var l = e[i], u = l & 3, d = l >> 2 & 3, f = l >> 4, p = 0, m = 0;
			u < 2 ? d & 1 ? f |= e[++i] << 4 | (d & 2 && e[++i] << 12) : f = l >> 3 : (m = d, d < 2 ? (f |= (e[++i] & 63) << 4, p = e[i] >> 6 | e[++i] << 2) : d == 2 ? (f |= e[++i] << 4 | (e[++i] & 3) << 12, p = e[i] >> 2 | e[++i] << 6) : (f |= e[++i] << 4 | (e[++i] & 63) << 12, p = e[i] >> 6 | e[++i] << 2 | e[++i] << 10)), ++i;
			var h = n ? n.subarray(t.y, t.y + t.m) : new G(t.m), g = h.length - f;
			if (u == 0) h.set(e.subarray(i, i += f), g);
			else if (u == 1) An(h, e[i++], g);
			else {
				var _ = t.h;
				if (u == 2) {
					var v = Rn(e, i);
					p += i - (i = v[0]), t.h = _ = v[1];
				} else _ || K(0);
				(m ? Jn : qn)(e.subarray(i, i += p), h.subarray(g), _);
			}
			var y = e[i++];
			if (y) {
				y == 255 ? y = (e[i++] | e[i++] << 8) + 32512 : y > 127 && (y = y - 128 << 8 | e[i++]);
				var b = e[i++];
				b & 3 && K(0);
				for (var x = [
					Bn,
					Vn,
					zn
				], S = 2; S > -1; --S) {
					var C = b >> (S << 1) + 2 & 3;
					if (C == 1) {
						var w = new G([
							0,
							0,
							e[i++]
						]);
						x[S] = {
							s: w.subarray(2, 3),
							n: w.subarray(0, 1),
							t: new En(w.buffer, 0, 1),
							b: 0
						};
					} else C == 2 ? (r = Ln(e, i, 9 - (S & 1)), i = r[0], x[S] = r[1]) : C == 3 && (t.t || K(0), x[S] = t.t[S]);
				}
				var T = t.t = x, E = T[0], D = T[1], O = T[2], k = e[c - 1];
				k || K(0);
				var A = (c << 3) - 8 + In(k) - O.b, j = A >> 3, M = 0, N = (e[j] | e[j + 1] << 8) >> (A & 7) & (1 << O.b) - 1;
				j = (A -= D.b) >> 3;
				var ee = (e[j] | e[j + 1] << 8) >> (A & 7) & (1 << D.b) - 1;
				j = (A -= E.b) >> 3;
				var te = (e[j] | e[j + 1] << 8) >> (A & 7) & (1 << E.b) - 1;
				for (++y; --y;) {
					var ne = O.s[N], re = O.n[N], P = E.s[te], ie = E.n[te], ae = D.s[ee], F = D.n[ee];
					j = (A -= ae) >> 3;
					var I = 1 << ae, L = I + ((e[j] | e[j + 1] << 8 | e[j + 2] << 16 | e[j + 3] << 24) >>> (A & 7) & I - 1);
					j = (A -= Gn[P]) >> 3;
					var oe = Kn[P] + ((e[j] | e[j + 1] << 8 | e[j + 2] << 16) >> (A & 7) & (1 << Gn[P]) - 1);
					j = (A -= Un[ne]) >> 3;
					var R = Wn[ne] + ((e[j] | e[j + 1] << 8 | e[j + 2] << 16) >> (A & 7) & (1 << Un[ne]) - 1);
					if (j = (A -= re) >> 3, N = O.t[N] + ((e[j] | e[j + 1] << 8) >> (A & 7) & (1 << re) - 1), j = (A -= ie) >> 3, te = E.t[te] + ((e[j] | e[j + 1] << 8) >> (A & 7) & (1 << ie) - 1), j = (A -= F) >> 3, ee = D.t[ee] + ((e[j] | e[j + 1] << 8) >> (A & 7) & (1 << F) - 1), L > 3) t.o[2] = t.o[1], t.o[1] = t.o[0], t.o[0] = L -= 3;
					else {
						var se = L - (R != 0);
						se ? (L = se == 3 ? t.o[0] - 1 : t.o[se], se > 1 && (t.o[2] = t.o[1]), t.o[1] = t.o[0], t.o[0] = L) : L = t.o[0];
					}
					for (var S = 0; S < R; ++S) h[M + S] = h[g + S];
					M += R, g += R;
					var ce = M - L;
					if (ce < 0) {
						var le = -ce, ue = t.e + ce;
						le > oe && (le = oe);
						for (var S = 0; S < le; ++S) h[M + S] = t.w[ue + S];
						M += le, oe -= le, ce = 0;
					}
					for (var S = 0; S < oe; ++S) h[M + S] = h[ce + S];
					M += oe;
				}
				if (M != g) for (; g < h.length;) h[M++] = h[g++];
				else M = h.length;
				n ? t.y += M : h = kn(h, 0, M);
			} else if (n) {
				if (t.y += f, g) for (var S = 0; S < f; ++S) h[S] = h[g + S];
			} else g && (h = kn(h, g));
			return t.b = c, h;
		}
		K(2);
	}
}, Xn = function(e, t) {
	if (e.length == 1) return e[0];
	for (var n = new G(t), r = 0, i = 0; r < e.length; ++r) {
		var a = e[r];
		n.set(a, i), i += a.length;
	}
	return n;
};
function Zn(e, t) {
	for (var n = [], r = +!t, i = 0, a = 0; e.length;) {
		var o = Fn(e, r || t);
		if (typeof o == "object") {
			for (r ? (t = null, o.w.length == o.u && (n.push(t = o.w), a += o.u)) : (n.push(t), o.e = 0); !o.l;) {
				var s = Yn(e, o, t);
				s || K(5), t ? o.e = o.y : (n.push(s), a += s.length, jn(o.w, 0, s.length), o.w.set(s, o.w.length - s.length));
			}
			i = o.b + o.c * 4;
		} else i = o;
		e = e.subarray(i);
	}
	return Xn(n, a);
}
//#endregion
//#region node_modules/hysnappy/js/uncompress.js
function Qn() {
	let e = $n();
	return (t, n) => {
		let { memory: r, uncompress: i } = e.exports, a = 68e3, o = a + t.byteLength, s = a + t.byteLength + n;
		if (r.buffer.byteLength < s) {
			let e = 64 * 1024, t = r.buffer.byteLength / e, n = Math.ceil(s / e) - t;
			r.grow(n);
		}
		let c = new Uint8Array(r.buffer);
		c.set(t, a);
		let l = i(a, t.byteLength, o);
		if (l === -1) throw Error("invalid snappy length header");
		if (l === -2) throw Error("missing eof marker");
		if (l === -3) throw Error("premature end of input");
		if (l) throw Error(`failed to uncompress data ${l}`);
		return c.slice(o, o + n);
	};
}
function $n() {
	let e = atob(er), t = new Uint8Array(e.length);
	for (let n = 0; n < e.length; n += 1) t[n] = e.charCodeAt(n);
	let n = new WebAssembly.Module(t);
	return new WebAssembly.Instance(n);
}
var er = "AGFzbQEAAAABEANgAABgA39/fwF/YAF/AX8DBgUAAQEBAgUDAQACBj8KfwFBoIwEC38AQYAIC38AQaAMC38AQaAMC38AQaCMBAt/AEGACAt/AEGgjAQLfwBBgIAIC38AQQALfwBBAQsHwQEOBm1lbW9yeQIAEV9fd2FzbV9jYWxsX2N0b3JzAAAGbWVtY3B5AAEHbWVtbW92ZQACCnVuY29tcHJlc3MAAwxfX2Rzb19oYW5kbGUDAQpfX2RhdGFfZW5kAwILX19zdGFja19sb3cDAwxfX3N0YWNrX2hpZ2gDBA1fX2dsb2JhbF9iYXNlAwULX19oZWFwX2Jhc2UDBgpfX2hlYXBfZW5kAwcNX19tZW1vcnlfYmFzZQMIDF9fdGFibGVfYmFzZQMJCuASBQIAC8sBAQN/AkAgAkUNAAJAAkAgAkEHcSIDDQAgACEEIAIhBQwBCyAAIQQgAiEFA0AgBCABLQAAOgAAIARBAWohBCABQQFqIQEgBUF/aiEFIANBf2oiAw0ACwsgAkEISQ0AA0AgBCABLQAAOgAAIAQgAS0AAToAASAEIAEtAAI6AAIgBCABLQADOgADIAQgAS0ABDoABCAEIAEtAAU6AAUgBCABLQAGOgAGIAQgAS0ABzoAByAEQQhqIQQgAUEIaiEBIAVBeGoiBQ0ACwsgAAugAwEEfwJAIAAgAUYNAAJAAkAgACABSQ0AIAEgAmoiAyAASw0BCyACRQ0BAkACQCACQQdxIgMNACAAIQQgAiEFDAELIAAhBCACIQUDQCAEIAEtAAA6AAAgBEEBaiEEIAFBAWohASAFQX9qIQUgA0F/aiIDDQALCyACQQhJDQEDQCAEIAEtAAA6AAAgBCABLQABOgABIAQgAS0AAjoAAiAEIAEtAAM6AAMgBCABLQAEOgAEIAQgAS0ABToABSAEIAEtAAY6AAYgBCABLQAHOgAHIARBCGohBCABQQhqIQEgBUF4aiIFDQAMAgsLIAJFDQACQAJAIAJBA3EiBA0AIAAgAmohBiACIQUMAQsgAiEFA0AgBUF/aiIFIABqIgYgBSABaiIDLQAAOgAAIARBf2oiBA0ACwsgAkEESQ0AIAZBfGohASADQXxqIQQDQCABQQNqIARBA2otAAA6AAAgAUECaiAEQQJqLQAAOgAAIAFBAWogBEEBai0AADoAACABIAQtAAA6AAAgAUF8aiEBIARBfGohBCAFQXxqIgUNAAsLIAALswoBCX8jgICAgABBIGsiAySAgICAACADQQlqQgA3AAAgA0IANwIEIAMgA0EYajYCAEF/IQQCQCABRQ0AIAMgAUF/aiIFNgIcIAMgAEEBajYCGCAALAAAIgZB/wBxIQcCQCAGQX9KDQAgBUUNASADIAFBfmoiBTYCHCADIABBAmo2AhggACwAASIGQf8AcUEHdCAHciEHQX8hBCAGQX9KDQAgBUUNASADIAFBfWoiBTYCHCADIABBA2o2AhggACwAAiIGQf8AcUEOdCAHciEHQX8hBCAGQX9KDQAgBUUNASADIAFBfGoiBTYCHCADIABBBGo2AhggACwAAyIGQf8AcUEVdCAHciEHQX8hBCAGQX9KDQAgBUUNASADIAFBe2o2AhwgAyAAQQVqNgIYIAAsAAQiAUEASA0BIAFBHHQgB3IhBwsgAiAHaiEIAkACQCADEISAgIAADQAgAiEADAELIAMoAgQhASACIQADQAJAIAMoAgggAWtBBEoNACADIAE2AgQgAxCEgICAAEUNAiADKAIEIQELIAFBAWohBQJAAkAgAS0AACIGQQNxDQAgCCAAayEJIAMoAggiCiAFayEEIAZBAnYiC0EBaiEHAkAgBkE/Sw0AIARBEEkNACAJQRBIDQAgACABKAIBNgIAIAAgASgCBTYCBCAAIAEoAgk2AgggACABKAINNgIMIAAgB2ohACADKAIIIAUgB2oiAWtBBEoNAyADIAE2AgQgAxCEgICAAEUNBAwCCwJAAkAgBkHwAU8NACAFIQYMAQsgCiAFIAtBRWoiAWoiBmshBCABQQJ0QYCIgIAAaigCACAFKAIAcUEBaiEHCwJAIAcgBE0NAANAIAggAGsgBEkNBSAAIAYgBBCBgICAACEAIAMoAgAiASABKAIAIgkgAygCDCIFaiIGNgIAIAFBBGoiASABKAIAIgogBWsiATYCACADIAE2AgwgACAEaiEAIAFFDQUgAyAJIApqNgIIIAcgBGshByABIQQgByABSw0ACyAIIABrIQkLIAkgB0kNAyAAIAYgBxCBgICAACAHaiEAIAMoAgggBiAHaiIBa0EESg0CIAMgATYCBCADEISAgIAADQEMAwsgACACayAGQQF0QaCIgIAAai8BACIBQQt2IgpBAnRBgIiAgABq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", tr = 4096, nr = 8224, rr = 2 * tr - 1, ir = new Uint32Array([
	0,
	1,
	3,
	7,
	15,
	31,
	63,
	127,
	255,
	511,
	1023,
	2047,
	4095,
	8191,
	16383,
	32767,
	65535,
	131071,
	262143,
	524287,
	1048575,
	2097151,
	4194303,
	8388607,
	16777215
]), ar = class {
	constructor(e) {
		this.buf_ = new Uint8Array(nr), this.input_ = e, this.buf_ptr_ = 0, this.val_ = 0, this.pos_ = 0, this.bit_pos_ = 0, this.bit_end_pos_ = 0, this.eos_ = 0, this.reset();
	}
	static READ_SIZE = tr;
	static IBUF_MASK = rr;
	reset() {
		this.buf_ptr_ = 0, this.val_ = 0, this.pos_ = 0, this.bit_pos_ = 0, this.bit_end_pos_ = 0, this.eos_ = 0, this.readMoreInput();
		for (let e = 0; e < 4; e++) this.val_ |= this.buf_[this.pos_] << 8 * e, this.pos_++;
		return this.bit_end_pos_ > 0;
	}
	readMoreInput() {
		if (!(this.bit_end_pos_ > 256)) if (this.eos_) {
			if (this.bit_pos_ > this.bit_end_pos_) throw Error("Unexpected end of input " + this.bit_pos_ + " " + this.bit_end_pos_);
		} else {
			let e = this.buf_ptr_, t = this.input_.read(this.buf_, e, tr);
			if (t < 0) throw Error("Unexpected end of input");
			if (t < tr) {
				this.eos_ = 1;
				for (let n = 0; n < 32; n++) this.buf_[e + t + n] = 0;
			}
			if (e === 0) {
				for (let e = 0; e < 32; e++) this.buf_[(tr << 1) + e] = this.buf_[e];
				this.buf_ptr_ = tr;
			} else this.buf_ptr_ = 0;
			this.bit_end_pos_ += t << 3;
		}
	}
	fillBitWindow() {
		for (; this.bit_pos_ >= 8;) this.val_ >>>= 8, this.val_ |= this.buf_[this.pos_ & rr] << 24, this.pos_++, this.bit_pos_ = this.bit_pos_ - 8 >>> 0, this.bit_end_pos_ = this.bit_end_pos_ - 8 >>> 0;
	}
	readBits(e) {
		32 - this.bit_pos_ < e && this.fillBitWindow();
		let t = this.val_ >>> this.bit_pos_ & ir[e];
		return this.bit_pos_ += e, t;
	}
}, or = 8, sr = 8, cr = 255, lr = 18, ur = new Uint8Array([
	1,
	2,
	3,
	4,
	0,
	5,
	17,
	6,
	16,
	7,
	8,
	9,
	10,
	11,
	12,
	13,
	14,
	15
]), dr = new Uint16Array([
	256,
	402,
	436,
	468,
	500,
	534,
	566,
	598,
	630,
	662,
	694,
	726,
	758,
	790,
	822,
	854,
	886,
	920,
	952,
	984,
	1016,
	1048,
	1080
]), q = class {
	constructor(e, t) {
		this.bits = e, this.value = t;
	}
}, fr = 16, pr = 15;
function mr(e, t) {
	let n = 1 << t - 1;
	for (; e & n;) n >>= 1;
	return (e & n - 1) + n;
}
function hr(e, t, n, r, i) {
	do
		r -= n, e[t + r] = new q(i.bits, i.value);
	while (r > 0);
}
function gr(e, t, n) {
	let r = 1 << t - n;
	for (; t < pr && (r -= e[t], !(r <= 0));) ++t, r <<= 1;
	return t - n;
}
function _r(e, t, n, r, i) {
	let a = t, o = new Int32Array(16), s = new Int32Array(16), c = new Int32Array(i);
	for (let e = 0; e < i; e++) o[r[e]]++;
	s[1] = 0;
	for (let e = 1; e < pr; e++) s[e + 1] = s[e] + o[e];
	for (let e = 0; e < i; e++) r[e] !== 0 && (c[s[r[e]]++] = e);
	let l = n, u = 1 << l, d = u;
	if (s[pr] === 1) {
		for (let n = 0; n < d; ++n) e[t + n] = new q(0, c[0] & 65535);
		return d;
	}
	let f = 0, p = 0;
	for (let r = 1, i = 2; r <= n; ++r, i <<= 1) for (; o[r] > 0; --o[r]) {
		let n = new q(r & 255, c[p++] & 65535);
		hr(e, t + f, i, u, n), f = mr(f, r);
	}
	let m = d - 1, h = -1;
	for (let r = n + 1, i = 2; r <= pr; ++r, i <<= 1) for (; o[r] > 0; --o[r]) {
		(f & m) !== h && (t += u, l = gr(o, r, n), u = 1 << l, d += u, h = f & m, e[a + h] = new q(l + n & 255, t - a - h & 65535));
		let s = new q(r - n & 255, c[p++] & 65535);
		hr(e, t + (f >> n), i, u, s), f = mr(f, r);
	}
	return d;
}
function vr(e, t, n, r) {
	let i = new Uint8Array(e);
	r.readMoreInput();
	let a = r.readBits(2);
	if (a === 1) {
		let t = e - 1, n = 0, a = new Int32Array(4), o = r.readBits(2) + 1;
		for (; t;) t >>= 1, n++;
		for (let t = 0; t < o; t++) a[t] = r.readBits(n) % e, i[a[t]] = 2;
		switch (i[a[0]] = 1, o) {
			case 1: break;
			case 3:
				if (a[0] === a[1] || a[0] === a[2] || a[1] === a[2]) throw Error("[ReadHuffmanCode] invalid symbols");
				break;
			case 2:
				if (a[0] === a[1]) throw Error("[ReadHuffmanCode] invalid symbols");
				i[a[1]] = 1;
				break;
			case 4:
				if (a[0] === a[1] || a[0] === a[2] || a[0] === a[3] || a[1] === a[2] || a[1] === a[3] || a[2] === a[3]) throw Error("[ReadHuffmanCode] invalid symbols");
				r.readBits(1) ? (i[a[2]] = 3, i[a[3]] = 3) : i[a[0]] = 2;
				break;
		}
	} else {
		let t = new Uint8Array(lr), n = 32, o = 0, s = [
			new q(2, 0),
			new q(2, 4),
			new q(2, 3),
			new q(3, 2),
			new q(2, 0),
			new q(2, 4),
			new q(2, 3),
			new q(4, 1),
			new q(2, 0),
			new q(2, 4),
			new q(2, 3),
			new q(3, 2),
			new q(2, 0),
			new q(2, 4),
			new q(2, 3),
			new q(4, 5)
		];
		for (let e = a; e < lr && n > 0; e++) {
			let i = ur[e], a = 0;
			r.fillBitWindow(), a += r.val_ >>> r.bit_pos_ & 15, r.bit_pos_ += s[a].bits;
			let c = s[a].value;
			t[i] = c, c !== 0 && (n -= 32 >> c, o++);
		}
		if (!(o === 1 || n === 0)) throw Error("[ReadHuffmanCode] invalid num_codes or space");
		br(t, e, i, r);
	}
	let o = _r(t, n, sr, i, e);
	if (!o) throw Error("brotli BuildHuffmanTable failed");
	return o;
}
function yr(e, t, n) {
	n.fillBitWindow(), t += n.val_ >>> n.bit_pos_ & cr;
	let r = e[t].bits - sr;
	return r > 0 && (n.bit_pos_ += sr, t += e[t].value, t += n.val_ >>> n.bit_pos_ & (1 << r) - 1), n.bit_pos_ += e[t].bits, e[t].value;
}
function br(e, t, n, r) {
	let i = 0, a = or, o = 0, s = 0, c = 32768, l = [];
	for (let e = 0; e < 32; e++) l.push(new q(0, 0));
	for (_r(l, 0, 5, e, lr); i < t && c > 0;) {
		let e = 0;
		r.readMoreInput(), r.fillBitWindow(), e += r.val_ >>> r.bit_pos_ & 31, r.bit_pos_ += l[e].bits;
		let u = l[e].value & 255;
		if (u < fr) o = 0, n[i++] = u, u !== 0 && (a = u, c -= 32768 >> u);
		else {
			let e = u - 14, l = 0;
			u === fr && (l = a), s !== l && (o = 0, s = l);
			let d = o;
			o > 0 && (o -= 2, o <<= e), o += r.readBits(e) + 3;
			let f = o - d;
			if (i + f > t) throw Error("[ReadHuffmanCodeLengths] symbol + repeat_delta > num_symbols");
			for (let e = 0; e < f; e++) n[i + e] = s;
			i += f, s !== 0 && (c -= f << 15 - s);
		}
	}
	if (c !== 0) throw Error("[ReadHuffmanCodeLengths] space = " + c);
	for (; i < t; i++) n[i] = 0;
}
var xr = class {
	constructor(e, t) {
		this.alphabet_size = e, this.num_htrees = t, this.codes = Array(t + t * dr[e + 31 >>> 5]), this.htrees = new Uint32Array(t);
	}
	decode(e) {
		let t = 0;
		for (let n = 0; n < this.num_htrees; n++) this.htrees[n] = t, t += vr(this.alphabet_size, this.codes, t, e);
	}
};
//#endregion
//#region node_modules/hyparquet-compressors/src/brotli.prefix.js
function Sr([e, t]) {
	return {
		offset: e,
		nbits: t
	};
}
var Cr = [
	[1, 2],
	[5, 2],
	[9, 2],
	[13, 2],
	[17, 3],
	[25, 3],
	[33, 3],
	[41, 3],
	[49, 4],
	[65, 4],
	[81, 4],
	[97, 4],
	[113, 5],
	[145, 5],
	[177, 5],
	[209, 5],
	[241, 6],
	[305, 6],
	[369, 7],
	[497, 8],
	[753, 9],
	[1265, 10],
	[2289, 11],
	[4337, 12],
	[8433, 13],
	[16625, 24]
].map(Sr), wr = [
	[0, 0],
	[1, 0],
	[2, 0],
	[3, 0],
	[4, 0],
	[5, 0],
	[6, 1],
	[8, 1],
	[10, 2],
	[14, 2],
	[18, 3],
	[26, 3],
	[34, 4],
	[50, 4],
	[66, 5],
	[98, 5],
	[130, 6],
	[194, 7],
	[322, 8],
	[578, 9],
	[1090, 10],
	[2114, 12],
	[6210, 14],
	[22594, 24]
].map(Sr), Tr = [
	[2, 0],
	[3, 0],
	[4, 0],
	[5, 0],
	[6, 0],
	[7, 0],
	[8, 0],
	[9, 0],
	[10, 1],
	[12, 1],
	[14, 2],
	[18, 2],
	[22, 3],
	[30, 3],
	[38, 4],
	[54, 4],
	[70, 5],
	[102, 5],
	[134, 6],
	[198, 7],
	[326, 8],
	[582, 9],
	[1094, 10],
	[2118, 24]
].map(Sr), Er = [
	0,
	0,
	8,
	8,
	0,
	16,
	8,
	16,
	16
], Dr = [
	0,
	8,
	0,
	8,
	16,
	0,
	16,
	8,
	16
], J = 1080, Or = new Uint8Array([
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
]), kr = new Uint8Array([
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
]);
function Ar(e, t) {
	let n = new Uint16Array(31);
	for (let r = 0; r < 31; r++) n[r] = t += 1 << e[r - 1];
	let r = new Int32Array(n[30]);
	for (let e = 1; e < 30; e++) for (let t = n[e]; t < n[e + 1]; ++t) r[t] = t - n[e] << 5 | e;
	return {
		base: n,
		rev: r
	};
}
var { base: jr, rev: Mr } = Ar(Or, 2);
jr[28] = 258, Mr[258] = 28;
var { base: Nr } = Ar(kr, 0), Pr = new Uint16Array(32768);
for (let e = 0; e < 32768; e++) {
	let t = (e & 43690) >> 1 | (e & 21845) << 1;
	t = (t & 52428) >> 2 | (t & 13107) << 2, t = (t & 61680) >> 4 | (t & 3855) << 4, Pr[e] = ((t & 65280) >> 8 | (t & 255) << 8) >> 1;
}
function Fr(e, t, n) {
	let r = new Uint16Array(t);
	for (let t = 0; t < e.length; t++) e[t] && ++r[e[t] - 1];
	let i = new Uint16Array(t);
	for (let e = 1; e < t; e++) i[e] = i[e - 1] + r[e - 1] << 1;
	let a;
	if (n) {
		a = new Uint16Array(1 << t);
		let n = 15 - t;
		for (let r = 0; r < e.length; r++) if (e[r]) {
			let o = r << 4 | e[r], s = t - e[r], c = i[e[r] - 1]++ << s;
			for (let e = c | (1 << s) - 1; c <= e; c++) a[Pr[c] >> n] = o;
		}
	} else {
		a = new Uint16Array(e.length);
		for (let t = 0; t < e.length; t++) e[t] && (a[t] = Pr[i[e[t] - 1]++] >> 15 - e[t]);
	}
	return a;
}
var Ir = new Uint8Array(288);
for (let e = 0; e < 144; e++) Ir[e] = 8;
for (let e = 144; e < 256; e++) Ir[e] = 9;
for (let e = 256; e < 280; e++) Ir[e] = 7;
for (let e = 280; e < 288; e++) Ir[e] = 8;
var Lr = new Uint8Array(32);
for (let e = 0; e < 32; e++) Lr[e] = 5;
var Rr = /*#__PURE__*/ Fr(Ir, 9, 1), zr = /*#__PURE__*/ Fr(Lr, 5, 1);
//#endregion
//#region node_modules/hyparquet-compressors/src/brotli.blocks.js
function Br(e, t, n, r, i, a, o) {
	let s = n * 2, c = n, l = yr(t, n * J, o), u;
	u = l === 0 ? i[s + (a[c] & 1)] : l === 1 ? i[s + (a[c] - 1 & 1)] + 1 : l - 2, u >= e && (u -= e), r[n] = u, i[s + (a[c] & 1)] = u, a[c]++;
}
function Vr(e) {
	let t = {
		meta_block_length: 0,
		input_end: 0,
		is_uncompressed: 0,
		is_metadata: !1
	};
	if (t.input_end = e.readBits(1), t.input_end && e.readBits(1)) return t;
	let n = e.readBits(2) + 4;
	if (n === 7) {
		if (t.is_metadata = !0, e.readBits(1) !== 0) throw Error("Invalid reserved bit");
		let n = e.readBits(2);
		if (n === 0) return t;
		for (let r = 0; r < n; r++) {
			let i = e.readBits(8);
			if (r + 1 === n && n > 1 && i === 0) throw Error("Invalid size byte");
			t.meta_block_length |= i << r * 8;
		}
	} else for (let r = 0; r < n; r++) {
		let i = e.readBits(4);
		if (r + 1 === n && n > 4 && i === 0) throw Error("Invalid size nibble");
		t.meta_block_length |= i << r * 4;
	}
	return t.meta_block_length++, !t.input_end && !t.is_metadata && (t.is_uncompressed = e.readBits(1)), t;
}
function Hr(e, t, n, r, i, a) {
	let o = i + 1, s = n & i, c = a.pos_ & ar.IBUF_MASK;
	if (t < 8 || a.bit_pos_ + (t << 3) < a.bit_end_pos_) {
		for (; t-- > 0;) a.readMoreInput(), r[s++] = a.readBits(8), s === o && (e.write(r, o), s = 0);
		return;
	}
	if (a.bit_end_pos_ < 32) throw Error("copyUncompressedBlockToOutput: br.bit_end_pos_ < 32");
	for (; a.bit_pos_ < 32;) r[s] = a.val_ >>> a.bit_pos_, a.bit_pos_ += 8, s++, t--;
	let l = a.bit_end_pos_ - a.bit_pos_ >> 3;
	if (c + l > ar.IBUF_MASK) {
		let e = ar.IBUF_MASK + 1 - c;
		for (let t = 0; t < e; t++) r[s + t] = a.buf_[c + t];
		l -= e, s += e, t -= e, c = 0;
	}
	for (let e = 0; e < l; e++) r[s + e] = a.buf_[c + e];
	if (s += l, t -= l, s >= o) {
		e.write(r, o), s -= o;
		for (let e = 0; e < s; e++) r[e] = r[o + e];
	}
	for (; s + t >= o;) {
		if (l = o - s, a.input_.read(r, s, l) < l) throw Error("copyUncompressedBlockToOutput: not enough bytes");
		e.write(r, o), t -= l, s = 0;
	}
	if (a.input_.read(r, s, t) < t) throw Error("copyUncompressedBlockToOutput: not enough bytes");
	a.reset();
}
function Ur(e) {
	if (e.readBits(1)) {
		let t = e.readBits(3);
		return t === 0 ? 1 : e.readBits(t) + (1 << t);
	}
	return 0;
}
function Wr(e) {
	if (e.readBits(1) === 0) return 16;
	let t = e.readBits(3);
	return t > 0 ? 17 + t : (t = e.readBits(3), t > 0 ? 8 + t : 17);
}
function Gr(e) {
	let t = e.bit_pos_ + 7 & -8;
	return !e.readBits(t - e.bit_pos_);
}
function Kr(e, t, n) {
	let { offset: r, nbits: i } = Cr[yr(e, t, n)];
	return r + n.readBits(i);
}
//#endregion
//#region node_modules/hyparquet-compressors/src/brotli.context.js
var qr = new Uint8Array([
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	4,
	4,
	0,
	0,
	4,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	8,
	12,
	16,
	12,
	12,
	20,
	12,
	16,
	24,
	28,
	12,
	12,
	32,
	12,
	36,
	12,
	44,
	44,
	44,
	44,
	44,
	44,
	44,
	44,
	44,
	44,
	32,
	32,
	24,
	40,
	28,
	12,
	12,
	48,
	52,
	52,
	52,
	48,
	52,
	52,
	52,
	48,
	52,
	52,
	52,
	52,
	52,
	48,
	52,
	52,
	52,
	52,
	52,
	48,
	52,
	52,
	52,
	52,
	52,
	24,
	12,
	28,
	12,
	12,
	12,
	56,
	60,
	60,
	60,
	56,
	60,
	60,
	60,
	56,
	60,
	60,
	60,
	60,
	60,
	56,
	60,
	60,
	60,
	60,
	60,
	56,
	60,
	60,
	60,
	60,
	60,
	24,
	12,
	28,
	12,
	0,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	0,
	1,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	2,
	3,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
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
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	1,
	1,
	1,
	1,
	1,
	1,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	7,
	0,
	8,
	8,
	8,
	8,
	8,
	8,
	8,
	8,
	8,
	8,
	8,
	8,
	8,
	8,
	8,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	24,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	32,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	40,
	48,
	48,
	48,
	48,
	48,
	48,
	48,
	48,
	48,
	48,
	48,
	48,
	48,
	48,
	48,
	56,
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	12,
	13,
	14,
	15,
	16,
	17,
	18,
	19,
	20,
	21,
	22,
	23,
	24,
	25,
	26,
	27,
	28,
	29,
	30,
	31,
	32,
	33,
	34,
	35,
	36,
	37,
	38,
	39,
	40,
	41,
	42,
	43,
	44,
	45,
	46,
	47,
	48,
	49,
	50,
	51,
	52,
	53,
	54,
	55,
	56,
	57,
	58,
	59,
	60,
	61,
	62,
	63,
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	12,
	13,
	14,
	15,
	16,
	17,
	18,
	19,
	20,
	21,
	22,
	23,
	24,
	25,
	26,
	27,
	28,
	29,
	30,
	31,
	32,
	33,
	34,
	35,
	36,
	37,
	38,
	39,
	40,
	41,
	42,
	43,
	44,
	45,
	46,
	47,
	48,
	49,
	50,
	51,
	52,
	53,
	54,
	55,
	56,
	57,
	58,
	59,
	60,
	61,
	62,
	63,
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	12,
	13,
	14,
	15,
	16,
	17,
	18,
	19,
	20,
	21,
	22,
	23,
	24,
	25,
	26,
	27,
	28,
	29,
	30,
	31,
	32,
	33,
	34,
	35,
	36,
	37,
	38,
	39,
	40,
	41,
	42,
	43,
	44,
	45,
	46,
	47,
	48,
	49,
	50,
	51,
	52,
	53,
	54,
	55,
	56,
	57,
	58,
	59,
	60,
	61,
	62,
	63,
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	12,
	13,
	14,
	15,
	16,
	17,
	18,
	19,
	20,
	21,
	22,
	23,
	24,
	25,
	26,
	27,
	28,
	29,
	30,
	31,
	32,
	33,
	34,
	35,
	36,
	37,
	38,
	39,
	40,
	41,
	42,
	43,
	44,
	45,
	46,
	47,
	48,
	49,
	50,
	51,
	52,
	53,
	54,
	55,
	56,
	57,
	58,
	59,
	60,
	61,
	62,
	63,
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
	6,
	6,
	6,
	6,
	7,
	7,
	7,
	7,
	8,
	8,
	8,
	8,
	9,
	9,
	9,
	9,
	10,
	10,
	10,
	10,
	11,
	11,
	11,
	11,
	12,
	12,
	12,
	12,
	13,
	13,
	13,
	13,
	14,
	14,
	14,
	14,
	15,
	15,
	15,
	15,
	16,
	16,
	16,
	16,
	17,
	17,
	17,
	17,
	18,
	18,
	18,
	18,
	19,
	19,
	19,
	19,
	20,
	20,
	20,
	20,
	21,
	21,
	21,
	21,
	22,
	22,
	22,
	22,
	23,
	23,
	23,
	23,
	24,
	24,
	24,
	24,
	25,
	25,
	25,
	25,
	26,
	26,
	26,
	26,
	27,
	27,
	27,
	27,
	28,
	28,
	28,
	28,
	29,
	29,
	29,
	29,
	30,
	30,
	30,
	30,
	31,
	31,
	31,
	31,
	32,
	32,
	32,
	32,
	33,
	33,
	33,
	33,
	34,
	34,
	34,
	34,
	35,
	35,
	35,
	35,
	36,
	36,
	36,
	36,
	37,
	37,
	37,
	37,
	38,
	38,
	38,
	38,
	39,
	39,
	39,
	39,
	40,
	40,
	40,
	40,
	41,
	41,
	41,
	41,
	42,
	42,
	42,
	42,
	43,
	43,
	43,
	43,
	44,
	44,
	44,
	44,
	45,
	45,
	45,
	45,
	46,
	46,
	46,
	46,
	47,
	47,
	47,
	47,
	48,
	48,
	48,
	48,
	49,
	49,
	49,
	49,
	50,
	50,
	50,
	50,
	51,
	51,
	51,
	51,
	52,
	52,
	52,
	52,
	53,
	53,
	53,
	53,
	54,
	54,
	54,
	54,
	55,
	55,
	55,
	55,
	56,
	56,
	56,
	56,
	57,
	57,
	57,
	57,
	58,
	58,
	58,
	58,
	59,
	59,
	59,
	59,
	60,
	60,
	60,
	60,
	61,
	61,
	61,
	61,
	62,
	62,
	62,
	62,
	63,
	63,
	63,
	63,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0
]), Jr = new Uint16Array([
	1024,
	1536,
	1280,
	1536,
	0,
	256,
	768,
	512
]);
//#endregion
//#region node_modules/hyparquet-compressors/src/brotli.contextmap.js
function Yr(e, t) {
	let n = 0;
	t.readMoreInput();
	let r = Ur(t) + 1, i = new Uint8Array(e);
	if (r <= 1) return [r, i];
	t.readBits(1) && (n = t.readBits(4) + 1);
	let a = [];
	for (let e = 0; e < J; e++) a[e] = new q(0, 0);
	vr(r + n, a, 0, t);
	for (let r = 0; r < e;) {
		t.readMoreInput();
		let o = yr(a, 0, t);
		if (o === 0) i[r] = 0, r++;
		else if (o <= n) {
			let n = 1 + (1 << o) + t.readBits(o);
			for (; --n;) {
				if (r >= e) throw Error("[DecodeContextMap] i >= context_map_size");
				i[r] = 0, r++;
			}
		} else i[r] = o - n, r++;
	}
	return t.readBits(1) && Zr(i, e), [r, i];
}
function Xr(e, t) {
	let n = e[t];
	for (let n = t; n; n--) e[n] = e[n - 1];
	e[0] = n;
}
function Zr(e, t) {
	let n = new Uint8Array(256);
	for (let e = 0; e < 256; e++) n[e] = e;
	for (let r = 0; r < t; r++) {
		let t = e[r];
		e[r] = n[t], t && Xr(n, t);
	}
}
//#endregion
//#region node_modules/hyparquet-compressors/src/brotli.streams.js
var Qr = class {
	constructor(e) {
		this.buffer = e, this.pos = 0;
	}
	read(e, t, n) {
		this.pos + n > this.buffer.length && (n = this.buffer.length - this.pos);
		for (let r = 0; r < n; r++) e[t + r] = this.buffer[this.pos + r];
		return this.pos += n, n;
	}
}, $r = class {
	constructor(e) {
		this.buffer = e, this.pos = 0;
	}
	write(e, t) {
		if (this.pos + t > this.buffer.length) throw Error("brotli output buffer is not large enough");
		return this.buffer.set(e.subarray(0, t), this.pos), this.pos += t, t;
	}
}, ei = new Uint8Array([
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
]);
function Y(e, t, n) {
	let r = t / 8 | 0;
	return (e[r] | e[r + 1] << 8) >> (t & 7) & n;
}
function ti(e, t) {
	let n = t / 8 | 0;
	return (e[n] | e[n + 1] << 8 | e[n + 2] << 16) >> (t & 7);
}
function ni(e) {
	return (e + 7) / 8 | 0;
}
function ri(e, t) {
	if (e[t++] !== 31 || e[t++] !== 139 || e[t++] !== 8) return 0;
	let n = e[t++];
	t += 6, n & 4 && (t += (e[t + 10] | e[t + 11] << 8) + 2);
	for (let r = (n >> 3 & 1) + (n >> 4 & 1); r > 0; r -= Number(!e[t++]));
	return t + (n & 2);
}
function ii(e, t, n = 0, r = 0) {
	let i = t ?? new Uint8Array(1024);
	if (!(e.length - n)) return i;
	let a = ri(e, n);
	if (a === e.length - 8) return i;
	if (a > e.length - 8) throw Error("unexpected EOF");
	let o = a * 8, s = 0, c = 0, l = 0, u, d, f = e.length * 8;
	function p(e) {
		if (!t && e > i.length) {
			let t = i;
			i = new Uint8Array(Math.max(t.length * 2, e)), i.set(t);
		}
	}
	do {
		if (!u) {
			s = Y(e, o, 1);
			let t = Y(e, o + 1, 3);
			if (o += 3, !t) {
				let t = ni(o) + 4, n = e[t - 4] | e[t - 3] << 8, a = t + n;
				if (a > e.length) throw Error("unexpected EOF");
				p(r + n), i.set(e.subarray(t, a), r), r += n, o = a * 8;
				continue;
			} else if (t === 1) u = Rr, d = zr, c = 9, l = 5;
			else if (t === 2) {
				let t = Y(e, o, 31) + 257, n = Y(e, o + 10, 15) + 4, r = t + Y(e, o + 5, 31) + 1;
				o += 14;
				let i = new Uint8Array(r), a = new Uint8Array(19);
				for (let t = 0; t < n; ++t) a[ei[t]] = Y(e, o + t * 3, 7);
				o += n * 3;
				let s = Math.max(...a), f = (1 << s) - 1, p = Fr(a, s, 1);
				for (let t = 0; t < r;) {
					let n = p[Y(e, o, f)];
					o += n & 15;
					let r = n >> 4;
					if (r < 16) i[t++] = r;
					else {
						let n = 0, a = 0;
						for (r === 16 ? (a = 3 + Y(e, o, 3), o += 2, n = i[t - 1]) : r === 17 ? (a = 3 + Y(e, o, 7), o += 3) : r === 18 && (a = 11 + Y(e, o, 127), o += 7); a--;) i[t++] = n;
					}
				}
				let m = i.subarray(0, t), h = i.subarray(t);
				c = Math.max(...m), l = Math.max(...h), u = Fr(m, c, 1), d = Fr(h, l, 1);
			} else throw Error("invalid block type");
			if (o > f) throw Error("unexpected EOF");
		}
		p(r + 131072);
		let t = (1 << c) - 1, n = (1 << l) - 1;
		for (;;) {
			let a = u[ti(e, o) & t], s = a >> 4;
			if (o += a & 15, o > f) throw Error("unexpected EOF");
			if (!a) throw Error("invalid length/literal");
			if (s < 256) i[r++] = s;
			else if (s === 256) {
				u = void 0;
				break;
			} else {
				let t = s - 254;
				if (s > 264) {
					let n = s - 257, r = Or[n];
					t = Y(e, o, (1 << r) - 1) + jr[n], o += r;
				}
				if (!d) throw Error("invalid distance map");
				let a = d[ti(e, o) & n], c = a >> 4;
				if (!a) throw Error("invalid distance");
				o += a & 15;
				let l = Nr[c];
				if (c > 3) {
					let t = kr[c];
					l += ti(e, o) & (1 << t) - 1, o += t;
				}
				if (o > f) throw Error("unexpected EOF");
				let u = r + t;
				if (r < l) throw Error("unexpected dictionary case");
				for (p(u); r < u; r++) i[r] = i[r - l];
			}
		}
		u && (s = 1);
	} while (!s);
	if (r < i.length) {
		let t = Math.ceil(o / 8) + 8;
		ii(e, i, t, r);
	}
	return t ? i : i.subarray(0, r);
}
//#endregion
//#region node_modules/hyparquet-compressors/src/brotli.dictionary.js
var ai = "\nH4sIAAAAAAAAAzy96XIcx7Uu+tuI4DuU2meLxDbRAElNJgYHR0neGrgFyr7bPg5FdlV2dwHVVa3KKoBN\nSRHggIHgAFKcBc4zJQIgOGIggYjDF6D+kf8U56K6GxH3Ie73rYRsGRLQnZWVwxq+tXKtlYlf0V40GAZ+\nUQe6mBSU2+9GnvZUokw5GozCoGb8RLt+UouqOuxLTRL4/boYaz0Yxf2J3pfUtIqjAR0XIq8W4JdiFFcK\nUdRfDVQt8Ad04Ie6rINqOapo43u6EsV81guisJSUdWXA14NFP/SqqoT31kwxDYKyVl6i44pWblnFWhXj\nqJLEqa6ouF8VAp1Wo7Dsl8oYpw5U6IV60OgBHYYYj6uMLkRJuRqZJDXaqyhPl9GmrPHeskpCVdGf+WF/\nIYhKxt+vC2iP8aFdP/r3QzwTr291/lSOAk+Hnhn0k/IX6B/D8AbRh/FLYYK2ZTWgS+jLaB26KgiqKikP\navw3SE1Fh2nRDypVFSd9kR8mZd8EvklKUYSxam8Q8xzUBt8VTAVzV4GJMJwo9t0y3m8CZZJEK0y3Uivi\nmX4/LA36QaDx+aCKvQKeLfqx3oM16w+jQYUO89WwVMH6J5hsECmvhLU3OiiGUaIrqVsuaq5FWIsjt993\nozAKXR1gn8rYE8/X3ifYnzgNdBnrpvrUPj8sRm6QFgI1aAJtTFkFRcM9RF/7o1Bv6uj4D/zHuNigvaCj\nWLm6EKTY/zQe1Lq/iL/LIJoS1gmbiP3G2Ms6xJr09+tqUlUGnfrVOIoqn+z9/DPQS7i3VgU9olM80691\ntRioEuinH6vjFTGfBOONsecJaLYvrVQTrJaH/jAGfA8KBi1i9LV+rBXWISliX1SaRKCNOO+ChlTQD7qu\nDmBNPPRfAa1jR5MkjcNChB/QCTghiCOj0zjYYLDwcRRoPApSTAyWG3ursY+Bl++rlsAalQEV1/BMAloO\nDQjGi6Pq30DTblStbcp35LraVY9JsBABdsPHy7A+VfBZvuQXsQaJa8xfSrGq4Q3hu6WkM8Z+YIxJgHka\n5aM75eEdDvYv6IvKIWikvxrFmJtJ1n+9rc0DXXa1F3qqURQXOG+s4df53vwg6KYCft1c3df5KfYyVmH/\nIPoeVCFoKCAxef/s+FdnVaXBINbbpLH+XxvW/3FQ+UkFewPaM6VImxJ4AltTqmIs77S1OQHoJw39BPvG\nfvpBh5VByI99lSBnyNOY4uaO6j4sHcY+iPlGQTEK0acfGFXEt+hZVY0LORCj72IQDRZUoWaqKjTgi/cw\n3g/wA9YxoP0EfBcM+v0+ZEJiEhBO7GP6pfYAPDioVX+CvdgNmQO+x5qEBnvYj+2uxWlo+tKgBknWvwn9\nlSIVlCACDN6nvZL2ve6c0Yl5H9/l+8xf3sOY/aKzwUQR9hFyAnSYpAW9X5MaQoxDe6DpBNwcYetAXnFl\n00fVfS5kQBnrXsA49oOWByIssjK1GDwLmgyqGKOP9XJB/1vwrj7sfaJKpuAnBrQVgPmSfgiwELTbhQUu\nYdH+2vvlF16a1L6gfFGBrkUp1j3BEvlhn9q/36VsqmlT9E15cHAwH/sGfRZMNdYDmzAP/K03Y2LbwY8e\nxrGlo2NjAXsOKsDY4hCyxCtE+/JF5ccBxoP1Yt9xX4o5a7fsFze8UwWd6QE/+F8bcqCJuBLgWQ/0UIV8\n3tjR0cFZerEaLKdgimqUFNPQK4CPyrEuQrIE/bpmEvRRBr2D9yHXdbAJxGhSP8GjwVe9vTmKfOxJ7eNd\ne3NYM6180ByH5HsGS9sZqoFaCQyR+FXzxz//+c8YB2SjVwO/m9ZO54dqufoXyO4AfB0MQsHsL2/N/rN9\nXYsD4QR5FeRbWrZ9iH6qqSlDkyRYmk4XNPCf7V3tZWi4D7FGkDFJDBnmvPuuA20SYD+hXUBVGETFh4zq\n96sJ9h86Cvoh0CXQTBWb8R7WdF3LuhaX9A2ZkMdgugpxjwaDVrDXpdSHnA6wUQavBpMoSqSo0u5XSu/+\n8aPNQQpdi36xlJ0gqloJ9FZOKpQSgRenpd1f7doVQj6FWMO/gFgDUiHWfoA6ALyF9XNA/3Gsg1oBOsiA\nVry0X4fKKFdV9SBoo5QGxb2bt2wtg9ZA90kJMgXCH7ovjSGvapsw//XrWztbO3M9FQOh5YN//NgzkC8F\nDc6BHN+76aOt2HpDBsD8gw+wiEXQw/8dumgKUc1AhuTRRW7Pl717CxhPP/autfOHH6C8alg3b8PX/9X6\nbao87E29DQq3Df+D0K/imXXAHcneTX/eOuC7kH5ezdOFpAcTgywLQs1xRoN7N32w1YNs0wMq2Lvpw60B\n1h90C3JUQRX8E0YDCvxgSjrUzv8dOmOiImRTRSe+yHHTVd4C2ZjGReCAKnRJVxL3QOf6rd+/swH/1RhX\nswB6gnyJOzpaOyt+0O+0tfX4cRQC53geeGsQ+2QiP6imiWnvM+3ABrW9mzdv/bR3+xd7N3dsVZ6qYK3w\nrs09fRCC6zc666Fik72bN211MB/oWYh6X1UgW7raqz0mSoPPPv1iF/gReCXGGry3tau8qecjrC1EQNef\nQad7O97bWgHW2vreB/8ADWg/dMv/A8wF8uKYV9a3toKuY+xJSUOngrRC4J7Q27rlw398ExW/Wf+v1k7Q\n1ka0bSSQiTXihmgwKIAXtr7/wT/+qgbUFryv5fsfWv5jx5b/2LrlvX/06WJx1/+z51PI0vKAD3UH0jbA\nF+hj9duUOhT8APqBrkqwdvkC6NADvZaBRSAvgJHCZOuWD/7xyd69e9o2d2wqRtDU6GPXFzudfRA4W99/\n7x/bv9z5Px766Gz5oUXv89H+/X9AvxnQTrL+h9ZOYJEErN6pgOZ++KGr/Z/+v/KfQf/0V/7Po0G8JwHN\nKc8zkBYB2HFfZ8sffoDIikLsZR6KoaPj/VasRa0Pot6AqMCxkLNREWvR6mzu6ACNg4exGIB/wKngibjm\nYl+TGihLA1P4UZiHMnOh50p4L3Ri/n2s055yfifkAaCe4KsQfN0PWoGmUSH04T7QiQu6b/Ggc93Ar7ZC\n+HyI57AOHTv/ttN8+K+ergR8SQTs/+lPrYPYN4CMqArlEVUTqPxA79723wZ0ErZt/mBvQHkOWv/6q8+c\nQhoAl0f9nT+sa/lk17ad4LlWVShAXqtww6Y/fwR8VqZQ6Gr3QVuQJSlxNHCCX9Xft7W809GxuTUE0P/n\npn91/vNfnS2fRSUHeiVZ1/KHP0BflqBTKwXIp9bv1rV0kCawD/3R1v8Pcg1r3bPObG1vd/AgpCLxbWlD\n63ctaOpAb67H9KpeqqD/VJL/656PW7Gx36ZRgv+2gMchIX9YB1J4Dz/v4+cD/HyIn4/w8+fNHfLPJvxs\nxs8W/KDdZrTbjHab0W4z2m1Guy1otwXttqDdFrTbgnZb0G4L2m1hf/hsE77bhDab0LYDz3Tg2Q5814E2\nHWjbgWfQARYDP2iHf4HQ8PMRfj7Ezwf4eR8/7+FnC34242cTftDuI7T7CO0+QruP0O4jtPsI7T5Cu4/Q\n7iO0+wjtPkS7D9HuQ7T7EO0+RLsP0e5DtPsQ7T5Euw/R7gO0+wDtPkC7D9DuA7T7AO0+QLsP0O4DtPsA\n7d5Hu/fR7n20ex/t3ke799HufbR7H+3eR7v3MeMOzvq9TVv+DLWEyeN/wKxR5dV1WBOJJuiqAsckkReV\ngctdCCz1ajYq+BDQr6aUMq+mBnwPesMQcUWQSxEtEvyuXOyt5/dFsN0i4NQQupgWBaQpODYoRd+mr+4T\n1YboEzoCUACcAx1UUH18H8k5UqVUVVNAzDACSwJ7Q4YFqU9VByOnFsGeUBCOcdXH+wt4Z8AGQeT5Efgi\n5rj8189fP3z9Ej9Lr1/8OvT64a9Dvx769aB89vT1Mj5dwl9zaPUSvz+Rv5ZeP8N3S/hk7tfh15fR9in+\nmf31KHo4+vrHX4/+egDfPsLvj/Dfy+zj9ezrq/j3InrCU6+vvb6Fz5++voS2B9Huinz6Av0/fH0eP2fw\nc/nXQ/h8Fu97+voC3v/09fzrl/jsBf65gecOvX729sDb8Tc33468HX5zFz/zbw+9PYy/x97MvpnBN3fx\n/ZG3o2/H3h5+O4yfQ/iEv4++uffmMX4//OY2nh2VPsbfHsQzo/jsF/R0j79J23H8fhht+d9Db55Ir8No\nP/x25M3P+GwcbUbeTMkTw/jmCd7+BNjdJNh4HQWwphOY5bCDsTtAdbT6CTkKxIcxvzXU/rTsAX9AQ7At\nfLfow3ImqIyrNHOhooHyYG0BkcFMh0iIPeA/owFq0yo9BobuAgNypBEHc38Qv9Bki60ABjCk5Q47uwqJ\nDuyD9+o4hmEcQveqQpQm9AsAWCYBrcFAzP4ENgmkGYxQoMO4JO4FI7Y5qYew2YVZ6qbGhdET0+gLCjRj\nCNFggwiVKXolYLcr2jsVvLvmU7PSW2AAv0PaoewerwfagJ4BHAI+gJJ/F4CxE/OAiR3Frq5SQdOQhkYr\n+aEq4gnoUj8Blkw1vRn4ArgGqlPvSyJAVyJk9IxP8WyYAMQbU0j9IBHTF0pAA32lXg3M6NG8Dj1DUxP/\nxdKVYQrT5WLAmlBrUMdoDOhDV4BHP0WIVRvQQLmmXPT3wbzGgMII6C+m5wXYFDgLOlIFMQzsmBat+TaF\nfsaSVHU5ragQWpquC1/8C9DO0PZeARzpwrRxKVqw4sDo5QB2USjGzyBEjaZDx9CbYjx2DRER6wKmD2s+\nTcowk/AsXmew2El5kO4ZTtoD6bnEYgmXM60ksCcoVOKEzpTaDkiGflpwMX1L2FBYqoGqaSKPuMZ31FIx\n07lMLhY2webFDkAt6aqaVmkeG1WtBrVPub8F4KpSWoVwpJ+E1IResKaG5rjBBsUQUNhaCsJ+ulpophFw\nAxqYFI9VlTyL7klbIb0uIYmGviPt7SWxcuDmY3IARFsIfEBvToSFLSrQL/1KNZWCCLlbBtMPNH0V7Zyg\nR2+W8QB3a7DKAhpLKulLYb4mZfooYFeakIMu0E3gRvQn0BnHCWp6RIxbc/lvgGM6WAwla/8gtxl4TodV\nX7uE9X5QxEQ1zUpyHvS8X4HJqkgdPoxAwh40BynTZadJPWC/1C0XuM5xVAMqMv0amwcUg/mRLMBgDlcC\nYD0py44SXdWiYhEk4UZVzcWEiQUWB3rgTluvHMRCTH8I9EecxERTCrY4phqF2FARMjAxCHd7KTI+I9WB\nVqu1yHVhaupishW43ZRBxQnXACYlGYd+N5PGgDtFvpIEjI3mWqVJ1IndSXSe9leFTAJjTwX/Q8oxeBmm\nCnSLJR7Ep3gvzd4QUtCnc8Itf8X+6IqEhIzdMsGPpqfP0M1ovCgtwJKqhW4CbqIVHg1iL3WxRjaA9QKz\nmHYpKGEAGwrepbfS7CBf9lJyEXjX+sTTCDsqAM5zdQct8F6KzSr4M6DfBSCXEkEkNQx4CnPrBDX09Bi6\n5IyicwKbZzSRK+V4KIPGBlSxhPgzoYvV0MfGb2tkMNjk2HxDXy8Fd0zuDkswoLf0cMtKBN3tlRTyl5vs\n7SFzol3oJRGkD2CE722gA7RAjwg9fuylCCPNJ3kHgXh8a8U1/xqMJrR12tthgimPBlqpVk12UcrTWu3c\nRWKlLzjn0rqDdAwTceXCvMj1kImB+NUAnRiwhP392pQAPBIM972eOKJjGN/W2MFG0R2ENJ4bU3f4JRjR\ng5DQngIBY0GM7qFHRofffN377h+3/LmTWHffNyRqKAIMLewD5fepfXlFq8GAZcp0vTn0HRO8Q56G0Kah\nGsj10AkQiteL3kSQBVYD8j6Ke6l7iDKxgxAK9BObPlUV8RDA7PZBc+CUWFHlYB6bexRsOGAvMCO4KFa5\ntvb2v9MFauiHMnQcmz1kYswyKVPnhXRO/MVgAAmYlyQI8EUJl9D9WsTOaKiywVwP1h+MHaeUsVD0f6M+\n303JkA91wi1pgflcc75roUeSHnNDtxZJBavtgQa+5WInsfgMC1FMxz9kB4YLYUu/SEKq1H68mSaV+LPp\n0zM7yNjgbkg4SnSeExg6lOgIxVrT510hu1CrUZ76RtzbXkrRrPcpU4zB7XSPbPz+ezFUqjmMFZtHt0Qu\nonuhqxC39xQxr9jQJ+fpalJ27AkA2NSllOdpgzgvOyFjSiHdVGaQo+JoOyFcunN0X0NlYUafY+ZOPp/v\nagd0DUsFTpqHIA49h508VgB5x3EN0gLErovUFSX9Dc9B8hXSBmCIwrfYripPUOSgoKs9iXvo/jEcvKNA\nIRRANHUDiLB94BI6Dco8pTFUuC59zY6BEDeAaqG4ho2zAZRKJ7r3DTEEXZ9GsDtJqF9OYoQZyecenQCd\ng1QnmJvRG1o7c852wiM8mu7rozu+CpkY0MnT09rpFze0Uch6CsAR8Mro3YRWmD3PXfZps5eqEkqCk9GV\nnoKKcz15E7vdCSUDBFh3ziU6LIPWapvfE9GXpFUfdFkjDquC6TEJkIb4qg1lRx4CXfP4QAf0D5p215h2\nnkB08ogCAiUtFgs+OqVn39D919EPTlOwY9e10KsPTKNT3e1890PnR+IF5JHKd7R/FQ+bXM7XB1mVebzl\nxORnglRDz3KupspR1Epn+TYiUJ5WGTDiph7YQGmJDmax0rtps5gfWrGCdHR2VilV6FI0PF8wHfs+6Ojg\nqUFO/LgFqo5EYcEqPkQZ0VsAButqp3MZM4JwauPmkaTymEfLHypkEgf2/p93b/vvrvY4Kum4SLf+DvLM\nZjpMechj6EnqAmMmCX3xZjPHAggW9rc633/vBPQM8jQn+GMHRJoDcnJ4bucNcsUp4Dr71Nb/96DxQdVd\n9NzHgA41HnvAfiP8xYJVE+qZ7ZSdrc473Y5HzEqvB10tFaijfl2rwLwMeKKWpxvbqRI7g6fDGj2Jhggn\nt4nLMUhATg9WpXfvtq/2krYcHzg23OjAlqc7oYUANz/gAwyIKxXyJQRfQsvwAIzQOgqr5F/yTEvUBtzC\nUwk5ajHUlA6dbyG9Lt8pLyro9dxM3+ve1EGF0MnjOie/OV/xeYiWo9sbUAPbs4OYqwBxqDdzpNjk1j/x\nl+/pxAb/QROXyeKbNnfkHKpYiL6edS1UEN2eDxBAjscXWHDKzpY/FotFMBEgCxFejvAByhqPtdL7vEl4\nATirGlqHM+whbsUhHlW4XMQcJy2nQ6YNvNbm0dBqeTdIOul5NVvf++gfXTy7bYtTMBpPnhwqSKD1fjEV\nqqbbyeU6oQygj7hqm3giAfGvQrrRI0rD7qj7PzbvdiiNYJoXdJdfKTn4yfVsdIp9hr85Oa7f53uj6nae\n2OVCPRjUdmJP+t39WrCyHxArk0ne7ymqb3M9+8ttbripA7vZtinX2kkU3s3TQui3NKhRlhg6kzqxel3v\n0GMRODz0gLJbJ7vv9NGWIMc73K08OHddyyBxCc8+TEpx4/GoowCm6U/IW+CjnMMzWuBnDI1OEPD3t6DR\nNKr4JoItAhnqaTnboWfEVFMaoK9mIzpNXl1PfEhcoIBE0SciMJ6nk6DMFHKGfpSYQ1PorAKRCrhagcqK\n1Lfpqyl6VYx59TiIVC31VFHz+IHeEACjhHZmhFElkaGHxQgF84w2UvR2BGmJR2S1iEeT1gGCFSECAF0Y\n+lQ5PoUBvZoyHIsCQEs9cdrQeo+AfHVIvAi7ySPDEuzp+NV1wCLO2PXjvsiI20bFRFaAFmk1KtONKmSA\nt0FnAJpHUO/KhDzGJzTTnKoCB2oerfniB4IocX1VBLTk8ZEPuIeFrUJSRIUU0yS6jhVILOCfiigSKCfe\nj34LNOIwBJABXvTqcSXiJKM+/glc82qhzCZcgxrgv6sqaR8wMtBQXEypSPCiqAT7QPkl4OIBrgsdWAB8\nWHzuJZa3gveAtqCvsXd0WYVhBAEGAOVizOAeumANFsenU6oMTRabCKAXK4VVBTO+ehxCcu2P6FgQ35QZ\n4JhVNaphpCFBFhiOn0Uu2DmW4yPYSBgLhYjLx+jWMvSShCSa8NV12ny+2ECwnUBGrgxX0ZYMSBuYO+wA\nDAOrAXStCZN1FZoYapHd4GnGQtAtBnRLLxpoqBTQ88ZXYyEqCiKZ1rFdwNAHVX9r32EUjSA3KtOpN+Cr\nPghfIOhX96lzSPIxbGLQTZ8CeYOeYX6pgBpZB5pmMNCckj0EWI1MkPK4HpuMrgKuG56ghR3TTyiExDAG\nlwedA3g5RgUi8aIBYCZDt59RlULEQ1uP7XxFbCu8oEwKqx0AuQ+rC9lPIw7T812FxXg11RfxVdgypYWn\nKArABn5sUh1wBJEpiseGHkZut0yQ6wjLnf4o7qqCRRYRlinSbkLdEGif4ReFKKALE6sGIgT44oBeHZB9\ncxkHgydga4AY2CMHdJ07jQ54LkXXJyXIfVInmZ18gplQKSkCZvzmir2VgOHRFSULaK2GdcMmBRWgy4gA\nUpypNCuAUHxMi9OH7AJlYxIQ+JQlwPNVccaKwaZEqBmfx7jcMtobAOYQPPhY033TR+SoFV2y5l3aqp1e\nRC2NjqHwCXpS61QDDRk652qGwxd1UeChTBxrgeEuT6/TKg1fkB4MW8qetAK1hadCmLqUPIQ1oEBYBtW0\nAH2JpxgvAzxlSOcVsGCsGCRE55gBn8YuJhTLIWssHidYFVqghGYojlsW9wT2h07HWJcwKj9hnAvYFpYS\nxwnejYK0EtLSiiEWaXGLw7BH+/RcAEiXknIR8g1mZ0wXOBYOuA5UDFlLLsYEtHjH0koFK0DLPObqaq9q\nnU37YJ55Vcg6tyYqIKGVTxYFhLfSBHoXkgTWHLBEyRPjUhxdRpyEQFI+dnpQzPWqBjFqMl6pBgmZEuvS\nkVAEc8eMM0IPrlBSVCwCBoMNMUA6EKFi00KFbgj6AsXJatIqo3+A0QKYS3QTeeLgBTwr86Q6lf7LoNRB\nEA1mKj5b82WhT7uJuAWN9faCrCFb3HIscVsVjBAET59dWWgspLLFODFHiHuQGucKfvs2VXTkJZQ5dLAZ\nOiC5g5yFxLTwoArjh1lJKxtrFfFwGRYU+sHSf0aZg+kkdEphbSm2K0TwGrJZM2pIe0lUKgVa3NCga54e\nk25914UiBRURV1Vq1GSDKklgjcjhdVIUJ3dZsCWjm3I9jGnTHui9mAbCyTWxVcVjwn0HLYC2XAyH0qlk\n/ZBG73MZhkIPQIn7ivGUZTGKUPOJuMSth9tgvzA2KAfoJ8Z5RPEAKVN/JStGNgeBkSkJLqiHXczEMHoA\ngFs2I+cQ/NEpo5OSeHjIUyQg0CTQWZEgoQYRGlRE0NBb7MJMJrf6ocTbKVLLDnHeRbLL4s+FVPG8QO/i\nCSTF4SAdmCXl1irC49jstFRmbJcWsK3pgy/5IcetoJl8vgsKwSUWhwCRswJP/GSE9ox9URx/JOepQj81\nMREZDgE159LehBwAv5c9TUkdCy2BY4kBUoiLpMJYwZovnknhNS2ue/OFyBYvpXyw3kQ5OzCM+tIeIYV1\nLMEU8gNwLlavRG87z3cLwjt05TEaC6xjPhbZRZ8sLSN6Vl1Zq4J4WYFiY1UFHWD3rC8MwoN0DkiX1DAL\n0l4VlmPSZgdRpbytMOSnRI8jFHwKcQxZz/gWgB/03evGfjXBGOicJ5HSqoHI83xyKh1hJHvOsU28CFhH\nrAOoEAJBCQ3wJEV7dK5ob4esIRaYDrQynRUqYHwh4wlzDuwbyA2uCWz37+i1wQCL/r5Ijgs+ETrPMzxm\ngwvhQQogvgBcw+QDBdRV/kokYSIz4jkG+TyBDPKE/rcLp8P6SJOauIYp30pR0isSTFHSA6kJRUMqcbRW\nI4hFnHAHY81vPhcJL1oItE33fK/oAhHzhiPQ3rthwVQ76dQ3Wgxxh6o69LrotnV4Pu7LeU13DswKbCHR\nfcBKAxI9QWtoq7O3rB2PHrWSnEuZ7bs+/vQL53OwBPUyHfWu2ANlkcxKTIpP5S0UPInZVcFm616RpeB3\ncIOHv93EHguAd8DpvcIX+ZaWL0Nx6miPJkuuZw9wuF8VZ5YpS2QCdg09fClSIpa1FyI2ofgTe0XaeJpO\nG7pvg5qzQedL+YIuM+4iIp1gIiAcngNoiQLED0+dxLWbGMJCmZVv7PGTt4UG/veEdJ6it9Wt8QQISk5i\nX2HQ72eUHqW90E9PQdcg/drE/0/pVE1EG3rEM6HeHUV0CChGf4pDpOUbiuyceGBFDhuTc9phw+XFGosk\nMlUoIf5yH6PROD5sMKSZPyCcGxYlymqndcfSHs2papXaDMyT65HDRcMY137DCGAxwVx6bKFtMGeMVm+D\nUgdK5LIRBGM/94iG7SrEGMsglUssp3Til9He99/TLcT553p8q8XAY6pGzs/1MNYI8kSHsD8h11LKEIC4\nUNz8ZhM9g9+L+uEa4iM5TcnRc4O3k4g6ORMlukwFm+SMgZ+AyGMelBSxHMlWcTw4cuKV3yZaQA6WjLHH\nfZQb3ifWuU9/YPz13t1tH+Xk6NHZLlog7/wd6IYHhX4k/mLgt5CxQTHQZtL336lEqpA+xdcCBAUBnwAF\ngQ9g2ZS442RNekmc73wTKyy0qgl6cfFKeg1zPWWRGFwMHuaRv+UIych5aqcsgyfO1y5YCsLd3MO2Nka2\nQkL5SQ2TYbQInlepeMOcTXKaERUS+qeJ04wSV9dG59PQpaNEezXhIAc6BPpFDo7zlOjakxOh2jck1vxu\nQXR0XGvvc9GYgdGOX9wjmA173a9rrZ0SSyumdUmwmRwvm52CgX9gkO53YB80344+u9qLQuFyspkvCh6W\nMwrTJZ5eHtw4HVV8VlEgOgxLTOAYZgBsN8EnnpzHGUbN+OH74oyiUwicRTsgzBMQbVADKhEbAKv3jUxJ\nKMEIbyo5Kd5YFO0m6Eti0WkBY5gbhDviXsGBpF327NVyPS3/SWG3t8xthubBTPsIaWqMZe9q51FvsQYc\niy582DNxTY5wu3eIFBVHnKPkhOUbgXE8hlUe5dIAdLGLtZXzlpZesQ6cnXQGuwQmsZz8G/Foe9vovnYY\nwRvUvH+fL+d6mAPAcVLgyWm6odmcGolHoJPyn//qlDiEfCmF8RMDHzDSlSPcytNZ7X1JcOHwWCPnQMql\nPJHBJsNE4GGYnDVjlQBTisAu0Gg7rCUGgxlSVI6Ee0X7tLT8HVI5USCbWKIDtuJBRlfHRCeJrF6u1fmT\nk5Md7ymk5Ag5xzWfi46mxiGSrAoEpEzmMVWuZ0DCDsQGjuUsExoKYIWWYELXWiLYHpsHzRSqgZ5+hj8b\nyo1cjxxNm245H5YDYacsvXVYhm9p+TR0HAmT2AM7td9vk0XEOyAHt4vGl7NBp01oabPIHOZI5Ho6xOX6\npUi5NhFPFdIVCIN0y3hGp0PY0ZHgCCPWQasW64/o248ZG5dzHGskSM9twvzQX7v2VbfKkSpzJvyQRjsQ\nIwM5jJxrrJOjb6flD+TBHgaH/QGfez0t8m1LQZUZNxRzk0qMtAVPlmDRVmWOJq7i3xIxM7YyN1U/N9qY\nHlp5eboxf2D1lzMry9frB2bweTb5sj52amXxwcrc0Mrcz9nwg2xirjF9vXFypDm9kF2ezCZmVhZv1y8d\nz8av188/Wz3/BM1WFhZWFu5mpw80R3/Ons+uvDiwMvdT/ertxqWj2fPbKy8vNQ+caTxerD+6Xr90pPHy\nVOOXi/UjQ/i9OXMY3fK9y4c4pF+uNc7cq489X71zbvX6Uz44NFwfR8uZ1fPTqzcuNCbnsuHHK3NHmy9f\n1k9eajy5sfJyGY80X2JUz7JL9xoLyytzi2jZfHq4fu5i8+7I6o1T2eSV7Nbx+uN72cgxvn3xUv3Ms+b5\niWxkOJuer5+41zx+Mps7mF1aqD8bwzo07i9gXtnEqWzu0Mri0Mr8WHb7ZTZxtHHmav3JYja51Dgyym9n\nz2Z3DtavXKofOVrHs+cerp5frF8awi/1c/PZi4ns2PmVhQf1iZMrS5Mc9sKJ+uST7NZPzeWLWDQsSGPx\nauPq7dUDp+tzc/WxiWx+OTs1ng0/W1k8h/6b1+9l00ey4XuNB7IdL37KTl1oLk82rx9rHJzPRhcbR8bq\nlw81zjzNpk6uzJ1rnD3WnF5qTl/Pho83n8zXz15sHnyUjV/Lhm9z2OP30C12Njs7gp3Kjv+UTd9onHiI\nRVuZG68/fY65rLw8mz1/1FicaODZe0PNmTuNxZHGraXs2ELj4mL28mz90gPs3eqloeadAyuLz+vXXtTP\nzNSPHQDZrF4cXj29VD9xG79n08+yxQUMpg4CmDi6emG4ObNYf3w2Wzq68vJ44+U0XlF/emJ16Ej96H2s\nRv3a8+zl6ezI8WxspDG7WD/xI+aYTV5bmQNd3apfOI1VzU6eWL36eGUeMz3ePPRydQjLOIpmoLTG3VMg\nElAmPsdLs1uj2ckxEE926y5GgvFj6RrXzjTuP1uZO432WNLVQ/dWr883Jqfx9tXRY83lC/ULM9mLoezu\n0fqh4WzkKVa1efgUaJJ0dfpA48ixbG46G7+PT7Jj50hdCyfZ/9Qd/H9l/lp26WF2eaj+dKJ5d6w+fhYN\nQPmNe0exUPXZg/WhE6Ai8Es2dDEbv4pxgkrxFQaAWaNxc3omu3oCRAjKwUJxT1/O1o9ONg9cyG4+rF84\nsbK4yN05cDtbeF4/+7B+fLqxdILcOvuy+fLOyuLRxuLxlZcjmAVX7OkB0CpYElwGbuVcZi7XLyw1bi2Q\nkBYms+NnsRFgW1AU1rx+5STHP7lUPz8MUsTIs+HnmBc6AZVmY+fBNdjHbO4cKC2bGWlcOwC2It2euJuN\nPeOzxxayqwsgD6wtRoX2IKrV0eOcI6h34Vh27lL9wQ1QL6gRXWGRyQULk82hQ82Zs6B2kuLV+eb0FAZM\ngjyznC1cqo9huxcaJ2ayG4dW71ysz81kJ49xGe/NghLw1OoQRM1QNv0T927iFDf99IH6tdFsdERed6J5\n92Y28hgjxMKKTDuK/rOJ8eaTm1jS+tg5SBgwAmTOyuJNcFzj7gwWJLsNbl3AOnOmZ4ayM9PZKIbxsHFn\nERImWzgDmYNlQXtQI4bUeHGuuQTBchXcB7nXnLlBKsXWXwL/PqZwuHI4WxoD79d/nKqfWWosHm4sjmKO\njalzjckn4BqQRDY+Wb98G3RVv3hw9dxpCs+xh41DU6vn76GT1TPToF6s8+rlK9ncXPPobHNmqnFxKVu4\nk80dq1+aJD3cflyfOdNcOtTgGEaadw9zZciJ0yT48/fqh0GfBxqPlrKX9+vnIcYpnVZ/uUBpcw+Ca371\n8g3s4+roqezWYch8iJfViydBipB4q6efgd3IKZjU2MjKwi+NI/fJGosTzZO3688hYa5xhNPPsLONu8dB\nciKHn2NSZLrx69Qmp8ab0w8hSah9Fo82n9xbHZ1onHlOUnw5m50+nr04SxUwfhstMWbuxfIvq0NXsx/v\nYVW59Q9/giTHRBpnHjdnSKX1a9exI82Z29mJkWziUTbxM7iguXwGYr/5ZGpl/mF28njj7kMRJiOgKDLg\nzBPyFMTywpls6r7Iz9PUL/eOZgsToJPm2IP6pUPZ6evsjZv4LJs+tLJ8uT5+qzkEmXNmZXE8u3W/8fP5\nbOImRGt96EBj/Bn/fWQ+G/ulOX0Lr8uWh1evL0LmQyNkDyf40rFT2RCplN/+/CP0b3ZsuH70werBm5AP\neC8lIeTnyDDF0UlMbZ6cDv69O4KZrl68Acak3lwexVAbZ2ahU0iokJyjC7LOx/FVfeompDomWL9wtX52\neGXhKOiH+vfaKOZI+T9+vbl0GpyIN4L8sOON60PQFxRlCyNkmcWFxhTo+TS0GxXQyUOQtyQqKJexH7OZ\neby3eQT8PkONPHKM/AtZcelq46fDfPaXo42pI42FuxDm2RWIponVn49l01fI42PPMH0MFVAB42lMLQm/\nH81OXM3GJuvnr1FNQAMCEgwdJa4Ad4+N1o+NZsfPkwvOT61OjmSTN0QnCnNBrU9eq0/dagzfBZXWn89m\nlx5jjiQ56NPnV4TOr4LIMR7okeYy5vUCCoLMTnl4GpwreoS6hmpl5jBUW/PukWzpPDnl+Amqs4WpbPoY\niKd++Cq/mj7SvDmMBuDQ1YPT1BEQgwt3Vm9eJQq6+LJx+Fnz5QOilPHb7G36IZEMZPt1vPcYGJ+79vAU\nxchpSLBLzdvL4ERs4urwj9nCeTwOfbeyeKH+YAkSAOqeUgu7PH2MApbI5Bw0HTTp6o2RbOYFURbme2wR\nFAK5wf8vTmTDc1zVyWvZ/ONsAlxwGFyZ3bgCPq1fPgl0RLK8cWVl/ije1TxATVo/O4YdJ23PPwEwg7Ij\nxYIgwbYzR4A3oLZWlqfrZ+aziYMrcyfqR05nxx+CQyGNKeVuPGzePUhwMnWBYOzRUuP2leaJ57JQ9zHZ\nxuLdxuLUystrwCGU/9CJ964DKUGUEW9ABt66ujo53Lx4on4a6uzS6s0TwBjkx6fPoeVJny9PA9U0rk4R\nsl6+jpWvP1psnDvfXD5JhLNwF7OAuofEw7I0x4Bgx0CZxJ+TV4EQyFZnJ1aBoEjbh/EKoseHhyi0H48S\nMQLBjt9rPrkKBZGNgE/R1TLAJ6i3fu4l4c3E+eb0PSwOeRYIeeL46p0xoqwXCxS/Q3ebxw5lYHkg5KMX\nV16cWj3/COsJIqSWuXS8eXeIgn3iIB4Bs0BIkgexv8uXmzPAUUsr83fA4NyIp0ehGRt3idzA4FwcKLLp\nn5oHrzduU+/Uz00BiQFdUAdhhcevgHewm8Cuq6OjnNfJ21BeRCPYu8lpstvYLDRv/dRhootLR6h/b402\nb74kqoEgvbSApYPWy6bOg7yx0ZCfFPIjYNhTRE2Xb5AjgB4pD69AsLC3h09AYKBe4aZxYJjmwxv4f/3i\nNLiJUmUOZDO+8uIapcHYL/WpY/XJR/Wjt0WPTBI2Dx8nB038TI15/hkV8ePR5r3x5tIS+Aucwh2cvkEY\nOXQAvQF4410wGWiVPHkC6d149gi4lMgfGmr0Z7APmB3vgpYB1AG5rl6+z/1aoIalHAbdvoACugn9no1d\nW714i4s/NtccP4iFAm7BjtQfXK+fnYPKzh6eoiYd+xE4DZqxfkRGBX48eYIIcPievPcpZMvKy8dQOo2p\nM1ANRBrLl1d/ugShhxfVbw6BxrAX2DvoAkyz/uhHbjRk9dxc48xPzdHHHM/JEWJCID3oSkCaW4DEz/DS\n5pXj2fxc484EMT9Q1ssbVGSjI8C6lCeArLBxxh7Why7XD4EIT1CPHJ8AF0ATYWrEz7dfgjtowhw7AlFJ\nUoQEm4e5dIkE9uIX0Ay2m8bLEUiPwyBFbHf98jJoFSANIguMRnPpwmnMjpBvHJwySRENm+L4KBacanrh\nDvfryH3y1NknAKIY3urQNUpO0tj51av3IU+aT+bYDyaIrZycWz1/idIY2uHlLDUdrCrIc+CZ6XmuMJZr\nXKyky9chD2kqAj1Oc2tA8AJynmWzw2AcSM7m8hUwKRRQdhx24hIepGnw/G52+zZEBK0YaD0YsJdvW5MW\nNAzaI81AmULpQNqPX+Hig6nvjEGjYYPAX6tnLmKjOYWTY8B7EOnZ0AsQGCc7eapx+Sb0MkQTrbCFn6Ge\nVi9QnVGiHlmuHx2GmF09uywct0AUAYsJWhi2yeITcBmEc31+KXt+J5t4DO5eWXwJEoKmAIvBqoL2h6yj\nUQbaOHM1OwXz6ia4CfCVNjjo5wWoYr555BFIDvPCvtNUBDdBYsDAPwz6OU5RP3yX2wdNCsG4fJJkA6G0\nfL75+CYx2zMA8tHs0lVC5acX67NXYdlRAZ24R+gLow/jvzxFfXrkLq0zkOXQNUgbgha0mV8WW3KhPjHR\nXH6YTVyAlUSWX7xKfj8ivHDxfnNmiRDrGCU2cSMsOLz0xCJ10JHjsMppHcw/ARXVLx/E2EADK3MvQb1U\n3xeh3Ubql37mHCFvaaTAzr0JCUMsdGQsu3y+ufALdgHzzRZGMGzgdhKe8Avt8UtXm7Py+SHYApcIdw9O\nN6ZnAS1op88ehBLMJs5BllIbwlCdnMPKg7WJisdGVn+8CrsGfzauTxNXQ1YvHaVldHkIVkP9CiyFi80Z\nIKJpoqDpy80nlyFRCVpunsDc6yfEWoeFNfNjNn0NPAKxQ7h1/2zzl3ONc0v4CoYJJQNGAsH7y0Vq0sPL\njV9u12cmRKRMZbcsR4/gE2qfW/frT26DrYgkJx42DtwERQGjYsr0n8z9DH2UTV+gOwImA5D/5BzV9NiF\nxtnbhL54aglm3RiNo6VlAunJKVAg7dCx5Wz2aP3aBMURjESsNshm9Enj5wOkqAOnBYg+EHfKaTBF/fpN\nUuz4YwiTbOJOdusc+Xf4EPA8TQAChgvAbNnkpGjn682fgdJPrP50snH3ANaKy3X3MFRn/dlY88l8NjwL\nLsuWLwA40UkFI3TuDvf95HFMtnHxBX0jL4ZgSVGNUrOfF01BSoPEgE1By1EsOPyO3mCtiIl6FTqagJ9o\nkz4oohQggctXoaqw1+ACyrFh+iiwOFRGLy407g5hGQH8sCYQoasHxutjj0hFEzfp21m4lT2cJepYvgzz\nXCwIMPJBvJqyhZiKLrJsdpYkB3V5+Cq4tT49Toq6fqV+8lL28Gg2C2V6ggba2PPmkxu0lW4+XL0K2EZ3\nED4hnLv8E+XG/COYRZgdRRww1eQ4LeiLp/DJKvj92DCkuvjQntESfDpJCAdD4OikCJxjGAxl2oWZxqUX\njcvYC0CUJ9k9KIhJIkmsz/Ff6Dp4caF+6BrIMrs5SmE4PNs8MkMn2PAwXTQP7mDHVy8CJz/DXIhegEAm\nZmCT4nXQkvQ8wHKBdUkbZIkegxsv0M/Ki/MAvfXzE/SDwVrEpmDjsNFT6HAGlLM6dJAC9sRV7DVAF8Ug\nOjk3CloCtG4sLkPKNe4RBTUWx7BiNDqO3IcdRx/LyUuNowCBk9jxlbnbFHoP55rLl7KRi5zypSOwZBu/\nYJ2PwH5pzl4HmWGhOPLbLxuLl/FhdvwADdvlQ83lSUwKhgD0EZ1OLy5k48tsicE/uNl8OpHNw0I5Q2cm\ncAKY6+Qp0Q4PKaiBu6aXgBUhc/iWp4eBYMk1156s/jTRuDxE6XTrLp2BF2bqM2dJIRcXKKuPnSOXTR8j\n42Czrp6A8KT5A/ELpX/kNORt48wN+jfuHBQP1T1af8uXG4BYk9caT65RPgBbAnsfvEdcNLlEb+ThSVE9\n4JGbUFsCmWjjU4NPH6mf+LEO4Dd7ZHX0mEi5SZhvNGzvL6zeOQfwTIvj3OHV+7NE13NH0YbrMALrnvwC\nM3xl/sjqhcfZ8BHsPv1RLw6uLExnIwAGRxsn7lPHLd3CvhNDPjwFpQw6oT1+b5Zae/g5um2cWQRoIXp5\nTKMV6p5YFED60EvQNh131x9QR8OyuHS0Pjdcv/1T/eSVxoNT9BJfO7C6SFQGyiHZz15tHp3AdhOdzi02\npq+vXnhWn37avLeYjYw3lhebM6cghME42YGfiIhevFiZP0Gjb3qGW/b8duPoUH346Mo8AOdc48QMmfoq\nxNEi13z5KdHIFTp7geK4krCUjy1jOm7KMA4dDviM6/Ni35MQydgPfdePEl9XqlE1ir9NtZsyUIUnnl4k\nAbOhBGwa1juIlQTOhmFUKcRa4mfDqo6ZhKUYvyohpcb1U095cs4eqTREn9KP8eQTiZqPq7HGe40uvVoI\nJY7UDESM5ZDAUsN0klCVVYG5yyU5SGNIrpHQQg6b0Sjfpn7VBj4aia01KiiloXKjONaRTe5kSK8fqzj2\nC4w+RG9lGbnmATgPMjhOVSn4axGJjDtlqLlhoN+rqVArxu242gbhSuyohOYWFENwY4mFxXhSxulJbE9U\nYcBmMMBoQH6O+coqGQnANRKkG0pVACWRvIbnUIxm5im7p5nPHRV5xiaRnkbiYSJmTvhKgjM5R6yYG1Wq\nNnNbG4n24a7FeIEv4Zk8v7WRkLHEfxqP8TeYY+z6qhp5GASztZPI8zlQ/F4IJKiYUQKYa8D6HX7kxr7x\nsZvMQ8JOpewBv+siKQSrEmNlJb1KawZGRRJALRHKnpIeVFTk6mEF0FS38eCcK6OMnJUbiVWLGLNk+2c0\nKFYqkrhBI1HXBpP1GWXLnBEJozax2v/qMd5Z8DnTlDFuUaC9KNEh9heTfbVgJDqP0bJ+qBjXhPFyZZTL\nsKbIfXXd8/dL3Cdj//CUZHsp7v5+UrgfRNhFjpkkH7+6v8/HO149rur9pCpPDbya8nSkB3h2WVXMAq5o\nhpAzlJVpQEyXKL667vqBqwp4SCKCJXzVQ594OupTVcxCgmFNQShEIqeNhNHGEi0cFmW1sdfccYb6GknX\n5Uwx94IfFFREjgDhkCsNY5iUxDd60esnrxd/nfh1VLLkF14/xM8cs95/PS6fPPr1gOTKP8bvy78O4fOD\n0ubpr0fwc0jy6n+ST2bx23PJqV+0mfavf5RnlyULf4q9SY8vfh3Fpy+YrY+/F/lvZvHj2SXJ6n+M1mvf\nvz7Dsb2+yvfyO/QnGfySYf/i9YL091j6f8TeZWwvXl9/fe/1Sfz3IZ69a2chzz6Sb/Ekxn1DxvxEPuNb\nX8h8Zdb49kf5BG/5dVhmzb5ZY4Atn+Cfl+j5R/vGtbEx1//H30eIZw+s9cA2Q+hx9t8VA+bwxEtZ0yvy\nD9d6RN7+UNrYOgasLLAklQOW0DPHaesXLP16AL09+e3W2d9uj/52a/6322Py+9Bvt+bkk7O/3VqST47+\nduvMb7ce/nbrZ/n3Pfl2Qhrg/8u/3ZqSp0b5ID9Bm1vy1Lz8e0QenJc2M/yF/15iGza+jd/7FHlaWl7i\n//nU8G+3Hvx26478fv63W2Py1ZL8PiGdTMsb7/126+lanxzV7d//jXddkJFc+r2fIXmd9MPfn0rLe/LJ\nvd/7RPsjMovp31dgWlpiDI/kkznpbVqeuiOfnJanRuTDB9JgSj55IN3+xAf51T1pc17Wdkh6G3oz//bw\n2yNvbvPfb0ffPHxz982NN9NvZt/Mv5nBP3d//xw/T6Wuw8Lb8TezUslhhPUZ0J41GEbQfvbNM7Q7/PbQ\n21H8fRefjr0dfntQ6jzMSyWHu/I5W7Biw8/o+SCrO6DfqTf30RPe+/YAPnuO3u7h7bPS8jZHhd+G0eIu\nWs5wtFJbYlwqScy/eYZvx98ewO9Tb36Rt3Jso+j3Jt/45sHaTEbx+2PWosB4Rt7MyJgey7tmMTvOlFUl\nHrKWBFrelNoUw+jRjvhnmQlGgKdYo+IpnnqCnyl8MibVKlgN466Mlk/wPbOc1+/PYoQ30fcY5nkXT99c\n+3yEb5OxcCZj+Ocgx4uWI2+mudry28/S5zDeePfNdZnduLRh66fcG1mf2bcHWR2Dq8Q1ln2ZkXHclPZY\nZ+zdz1xdPDGCzx6gj2EZw8/ckzcP8Nt9rNIIWo7jrcNoz1ksvHmET0Ywh8fccRnPYanSwRW2ozuI9bkn\n877LFUZPN4VGWLXjOvdExjG8tneHWNED35LmfsY3HNW9f6/6Y1mZQ/KueaGKGYwP45K3ch3mpbdR6X+U\nMwfdzL55zjFIbJjkBjFGkrGnaZCUGeQaFG0EtsA6BjylVYlGlDAlj5U1pLqDRKoVlSn7UdhlY+wl5CSu\nAe5ITq9E0zNdn7rbZgKYOA1DyX6O+DirETCSV2KTmV3DPM5BHUjRReAzN9BpKKUXQs2s9n6iGxXWvBrU\nqk3LNxLQN6DcGvpktHmvnRHL0aBTz5fciFhLdnIs88UbCiw/UfalaITNAzBr4cp8C8Nddcx4V0bIsPhA\nmZHRgY27zytPch6lsof2BrVEOwu2dJlU7aUuy9zwL4AZhnwync1VoU2e8Ewq0xXQzNwit8y0hTSWOhbM\nMmHBkQLARU2ilKV0p2K+pxRui5mYgO8qimnu2oYlGlkCAoKQWAGDKDHODyBHJzWbjyFrzVQyicn3EkCf\nEtMUGGlrGJbJeLhAcncJ1kJCd4Yo1wjiMVymjDPMSYK+mFJXldSEgLFMNpdkYx86wyN4u2wn666hb/ul\n3sfgWbOWW1FgvKard3GmprzD0llSjhlytUfCpR1gRFv2gaHxiRqQ6DsaCJi7pBuVdC9IgZXuiGfjmqdd\nRjYxWZXJI77h/rHuB5aYxRP8hHU2GbxYkoS6gPTBlAEtLY0NdJL6GKxRIfmuLN4IeG2zHIxNyjA2PptF\nu7hmJDDsAGOAfckOIWl4fonIvOq7XJ5ttuZKhcYGV14x6DewO23TZKxFpAIQLinSZk+027B4I3GdAI1a\n4sYYKcv5pSZxCtpmdpi/WWpNmWwQ1DSTzjzmSDBgjQH+wmMDfgRIiYXE5xylJB0IzXe1p0HPuhYGvbKo\nQCB1SSSezw8ZwcfQTabylbSyU2EBNIB6icDXXlXSDMLUvn+nnburJK3775bVGEmbMikHbOSCysEj2tvG\n8iFMyaB9A9IocascG+dmg3oZx0dq2JYy6ywp6UTmLqkthkPBX3vsFrtK+NcmyDDPQJJdiOpdzfwBbrCs\ntSHVwTLp3iRv+sQKAafbCfWgs8Pug01t8npJISr4wsoeyhBfSjiQScDX5IcdzG4rST2iAgsyMmTTFLTk\nkkgsuPZ26jQxTOkJSfMSvx/bOjssJpMM6rXk/qBm7PxAUpx0r2VfyJcqyXNf2S/4CRN+32lr22GFh9TA\nYUL1APchSiUKdC3vZS05ZoMVWtWUNqAWOd2dsyH3DgPOpTCHUMinYktyT0AFzCICm9VsYotp28Sagi2S\niBBXdlhhxeK0oc0KIoFVmVpTYoEUhklawSkx/Nr7mNQfQgozC8hjaG1c6fFhuaSeHixrS1LMBPF67Y65\nKmGg/jarA2xOkS3wBG4IfT4v0kbXmOeCld/B7MBSVGbJEVX72HI4M4ZAtButCBKSAilq1qUukRkHSLuG\ngYmSewXCpwAKavmWFiYL4LUOiMwD7YADtkMyYHN3UOpCSWKJHZab9NFKfxpLLeqcIxnYNo3D0L71pSgz\nsxU+syK9nErCox86bAVJoPzY7MAKMp2ZGYYqKMQ2PNuXPKtAWpe2sg5vd85mTzhrSUqM9MeagZkrfsos\nkH7MdluFZUjVLk9y4/9l5/651dpMS3GSSCI7u3NUpoHex6hpUkEimQcFRs4OaKn4peM2m35n0+kMazLg\ncZb3xdx3gxmK0T4qNwYmQ1fRaBZhBZW1z6+klbIVcpArvhfUIJ8rUoUUVAIFj3Gy7LfEexupbYWpYATa\n5lanrPYaKpPUQJ54q9NrcUjMDMVUU5ZEldpXFlZgzUQ3UiZTwKFnvE8JeeftEmyzqGSXR43sGF0iF38V\nQZQnjk3nMHuU61vRzNyAtOoMSvkihrtuHdQOy35vEy25lqVhvrHZeiy5hEkrVwQEKyhj36Xohva2OhLK\nm1gwVKDWNUkBO1H0E8ZFY4C9VsCzMinWDBIYHZpKJPKFdfLwH984LGjOucdGi6cEW8H61N05UXUgaFYW\nGmDMP1MRuA9SubSiuaL78P6KzQeOtU0M2qrFreZhkRzWBWJ4tgIPi0oeVDUuubMtZR6rzTIzOyz4slll\nRorAQY+zaJqR1BAMQipgrGupsqY1NHosqZEu641XE8FuDCSOJVnNBm3bNE4WAmOKnLN+PRkPAoRzhzIN\nJIcVwhwyxKp5C7C0AlmCKZlWLeKCyWqmNS9JPpJx7K7lIUGTiGvH+sI8G9Tv2BycWIquMU6ftYr0Lgny\nhzAWbb+WZLnDQj9ffGZBCFlO6JDKNn5jUyKY0kE6Y0B0rodCPCAslM6oCPBdGyBn/1oamfb+mrI8MvVR\nVSrEQQtXzN4yVJxxKtF+ohtuoy9lWZjWqC0zQ8BT3G0VitpYZvkt7X0Z1CoAGt9YIWkTWY0Up8LEAKlC\n313LorTpjIzPB1IUH24iwkN2xObHSpGxoFayibBSIgv0Z4vUUPGxG6sULeXnWZWi7FdZsMdnaq2ILsnO\nIUxhQSIvTWSrmB3KbEQLGRP5viS8FjAZgTmE2y2eB/rle39wpDDPHgsnoSIprViyHiS2G4QBQW/TE41k\n0mlvF3mHGqdIbc9UXAAe3lcAadOrZS5tdpV2WyjNPLKoyCImLB8kpYuorkPmXLJc1oaO1naWku6T6toU\nF9aM6E10taxDJhDo0IkKYlRIeaZ1LZ9L5pnDFcNQc44UvbEpywZ6ZTeIvKXlc7CRY3OzjMTyYx+s1Cv6\nAslYJANDo8NUyhsy6wIWiqwSCya5PowRgHRj+iwtfaxZLMDZziI5acWWJupJBn1BZhETM2qs7s7ycwq4\nPNaOTaNgDRnaY+WYTkQyLdlRcrIEXEKUsmrxuhZnhzXuQOvgSZb0Nxgg3+4oI2/3wT6SWthFtujpYuV7\nAAlBDutabL6esWPRdkG2EsyiF9ci4002/UDKi7U4xu5YwdbMsgmnzqCWtLyODluvDfQOIgQMpQSTyh8Q\nnj5VuFPwea1CjddbOCxq6nADWRwdf70bK6iETl7XwMrbrLwWljZY4t2JfwFVMXmP9OkzNYSlgPiGbVaU\n/A2wDPbnAIiRX6YUMsZlCUIViGp1uv9uhYdUCYOIdUSd2mQVr0tJYi8TkbCYzjbI39gXHVfWO383VxMo\nEo/pLgOcEdOWOwuKgsWwMDdHBglIoxgiA2tKHe4o2pS0PoFH2dlfmZIIyCGZJpLwRjVh0zRsGoizW3Jd\nHKIZsm+tSnKT0ocubcWKL3URQ8cvWqMpsQlhHgkIr223UqBgs23axG7ZyoqcYvczLTsv+VO5HowMb01g\ngwRarD3SvOT84Dsscuonu+WyAY95T+QL6gFlpD5ergez5DrbNFkASN4Y0MNrMZyC3DKCTVWOSK0KDdS4\n1i6ZU/mihQAe9gTqjMVpoNlci9ml5IHYMrS+/ES0fZiKSPqr1FB3RFSahNAPfxal+CRlAbiSZb1Ye9MK\nFGewHHG4JNKURTSkMIUByMd4ZelYMlPy3W1Ct+mVmgUOy/hzN6MKt5NICURF/YcX2aTFrkKNm+l8YSHq\nHuvssCmvLKdJ9mDiEnR5L9gD/UlNt6C2h5oJEjJyeIJFyyallUyj1NgqCcwZpnYykpVseIUKlon1hGhl\nKclrosUOoWOTCDe02UQsMSNyPbR6Er/aa01nW+nA7E3jfgxCCqfqOC8lNDcILmhpKVgalNJ1vIaDeZpr\nlR+6v2JdjNiTbPKgVuU9KL6Yxf7vKUQtkuq09Y9pIAwkh2ZGLlIQCQZTwJXy8AIdtJuu+UOMFFPFxHZa\nJ5dd1patjlQClLpvPMZKIRwqYlBhq+iewvj2SXU7SW9d12KrHOT/sq8SOANyr43YaqwAxzoC3CTeqYA2\nGvi4ra2nNQ+OjTfYjD3Dy1XwAOtA4X9iVu/Xf2MaKAhF0kRB47HbnWvfY31IHrPL6UkSzJdYILhHSmk4\nvLXG8cO/snJbWd5MgGlttS7JRu9RjsBg3tsQrpcrReKNzi7r4SnCtiMqI8NE8ScpzaHaNj+2NQ5kKiAb\nWi6fS5mVwOb6mT1rjqWNQFWe49i8wTX3D0vUSiZ9ESzdYktgmI/lJh1nm7Vz+GxFiZ6zlTEAEGsscSc6\nQEQz2xtKLyBe37B2HCxz1smPmIQGHJzEO2y1ks9TA2Ri/m7NKxhUFcGm4r2jtsZ6fip5ohuldmZQa6ed\n+40Cy8idAlKLYMO2VMoskkVBbta7tfHTUDgOkJg79ol2eEmPTQU32+Qwttbyhz+w4thOGJUaQsjaapIM\nl+thajdYRnDPfr0Ndl9ZVTbY0hHfWQaqptJ1q6ixDTbrsWXntr3b/un8J3EicIXYRTQqEoxeEtfphWN1\nxZrzjdT7Wy9iBrJMUjmNX9xA2PBpIsN9l5fQdDq5HqlDyxtuQC9fWh+ntkCXV+KI7GHuZlgS9ONEoZT7\nFVhRrLmUfOQq65dKoPMHQ1rVrPkZDpA8hVHDEjcM3/EKEJBwzoFF3J3zmLIdVe0bEsyBFGAzZA2Mf46C\n1SnBzSpwaby3doqksMmCChiCcn5A1L/4DqFet1nvK2vz6jRW1ockR9pglSAgJhpcm5ioGSPOv2JNBJFU\nXyn6ZG0M2k12WqxIkxXL0yJ76tiCK5KPiV4+k5IHznZq2KhIbSjuxZAXx1ANglL66aTsTyQ5eb1NjMw5\ntpRN96CVptTyX/mlzhaZH8thcIbbsFEbHTdOpX4N6xrkeujHRL9ScNOwmB2NbBoG6e+GprFZwQ7YkC4K\nwYrdTss6KXqZRFJk4Ctrse+xfuHdFmvsoaOApXmkdMXf/JiktVaQYYd1a+2xaNTmwndWCRVY60LR5fmZ\nWKuOrWNitoUATGHN6nfnK+va2WWtcmt+GNdSOTYdlGKhGB0oYvW02UI0X1g8KLmgAJm/V4dQLCdkS3IY\n3rJEcCLFgoxIvkKN+lbqdsf96BP0CYKsAXzSFcjv0Lmy8owXRmHjWlp6oSid9VIFeb2tumH6dY0Fw0X3\nBwFT1NFSKta2dtI7qQcdW63HkVrZEKaxwwRmKaXQuTbaTvG9Qh9JnrexCbAOvRE6KPZar8puLUnbA6KE\ntdRDMmV6YKGWEvqXgGRdqZlAde6wShS1p9mZ9lMq2jJBG8Ug9pNBK/J4CxE2QDmSYpzbmisnSZVvBifa\nqhMtUnYoqNlaNLFrDQcyOnsXXBf22uME+jvxooDlnJNa0doWFPIANdraVSalo0n3ihXplC1dfyUlTkKp\nH2CSbQHdKUqUjXg9aF4J9s315AWGel4kOKtoF4T1V9GG/hCVlHdajbfDuo5tzRvTapUNhrAG03gjHFGC\nFV30yX1qDc2iX0w0L8FxeBlbXkp35uVagtAr2nLysNVYSgg8FUi+dgny2+12PsfL82JkQ/pZZFy1BUCU\nI3WtWX8NS8AK9hQC4v9yCmK2xLzZzKH1TDXvsFaCw+AWwfqxVCVZK3LECgqJaKdE6gEHUeoVY7pa0Nnn\n4qzYxMMu+ntgQULpbbfuYaL+SB5giNGA5VupEA/wLDXsPF6zApFhazo4UmhEe59Zv/cnUhDKkRufarw4\nCH/VxNsEaSoFMyRqiBCDlehzPUZGUOJVP6DB7ZKV3cqqddjs2NZe+hjKmGdn2AAHmiZl7TXP1iMwLA7s\ngFisS49lNrnF1I1YCSV2jqVIKQCAR6G5vMhNZSHLrK0vxfRZmaaYWg+UY4te9OxmuTdTo7YXONWHzfS+\ntsceHK64FCIe8tgzRUecAa5OBVw4n1t72ubzt2gaE2FS0OJbgyzYwfpo/j4SEbV9xXf/2CH/I+HF9Et5\ngKaOLTTmiLYFYgGxyAoCmzrdUl+Y50Cs2mH2WFDKewyIIxN5bzEV5/SA3LlUsrWYoAPExmdsFCxZqeKt\n1+q8GPKYppdONIq40VzyB6tw2NJnbbwlhv4CFZJZbGY9ltIhGmvNQ2tuaBWnUWunFA62jEetbaUNT1Op\njmKfdflsySPD8qv4sZ5Z8LpDYbdD0Lax1aec7akYmms1jPZaqwDsK/Rd1axaUYo8VqXbq0qkz23CVFup\ntiBYvpIKLaB0hmDJDZQQSLb0wbufsSBQEA5qhyyxw57H/TWFVDcVa6/QtUJdJScTDiS+4Vgg4mjASdXw\n9RuF+GBNRWwdtIiGZDla1iehtUGrcA0mQFUQhtryVrZqmNnOGg+x1P/hATj5HqLZ0iAvz3RYfj6G3o53\nWzdTH0+vYX2KLs/nrXlMaBKy3I3Dq1NsaSLWwwHfh/KfxMYk5hw5vokd1gimBMXrwkhuKBOqgwypVUCB\nYhDwdgsdd9iyEIQHQL8Wj+fa/9PpeuefO8RIc7ojcY44tF3BR3K1m+dY9EuzxfxbvRjHGhcQhnhgUA4H\nXWOrn/HaSpZO4Y2QFICYP5duzUcq0s1xbKm4H8Rrt8EWEiyz2Foh2jdoVZ2dmMdabfvBY44XwTSJrXM8\n74iCHhzM57CfBTGIS1LxPdrKdcNa5x1xnFl3kfn+++9+6Bz0BQJERVML7fLwnNRITVJNDyeJnVVX9sYq\nFUHqGFvAzhoqXWCnXkClbdYLbs3cvLUGkx3WGhSCzDl/9wOAj4pJYcUWeOdYit0q+FJbNy9XAmywxRAd\nW3fQSJ2YqBiyJpoKdtiTbNayC5TcVYAFkdsAglqbdfG02SKLXe2B39PSknfEvQjGIxVD/NLRv2vNJy51\nvpwBX4mtVmW1ygCkR89enAaCnmNxxrmWGwkKWK8vDSgIy2T6qN9WT9zYbYlow1rhNPGzAgFLkXfWasby\nfS6VS5z/4j2rXm2tGhSL97Mz8aV72+WKVyPV+7vaCeqIbWw9RwJ4SOGyXyHV0IwoYBvFjsuzzj9Lg8Pe\n5LWOnFYSmby959ET50OVxdKSmqWvrb4QdO0ze9KrHGGFT3RcEB6N/X5Qsq2HmF8r9yjF/9aOvqu8BBLs\nJJ602LHy06GPEyYd0AXveKRTFEwSW0wkZ+OOw1OPCu8u9WORtNBxfvJfFvkDC0ehH9l6jc5aecA1PWFL\nEtI1Sm9orpUXqW0QZ0DAw21KFFtVbW3QG/fYqAEsI+8YdOgT7845Vp/5oTgDuuwxhq1s87eerv/dDpFI\nFxBPpC1YNyzIGgPeihKWO1aUeafbWY+/6Q6Va2vjBCtha8Fs3RarApAcpTDm7lp3EauLcbZyCthmKwZu\nBClRb7D6Mr6jygSr7Qi4ciFLqdEZVxJ9a523UhWfYmbtLNJqPEydtbh3WAvTFq8yPdZslZWg1w/YsxDY\nknqORFZgKmIV5Ktma875i2NvjklATjzqYsl2bKqtt2ikyD5GxjtE6MbwSDeEFYIS0Hl3jorInkkxzmO7\nKsCeCe352JqYEXcDz2ATOYLbZgS+2kp0htznx2Rd+glpdoN+PmHF4SjcvOa5dF2iC1sk1GE5fh6dWpjW\nKrfobahSmqF765MFm/01DWpYxj85OSJcHnDS7Qq0RqcT6FEsYbr6HLntdP2f1kMdWkTs2BpqVDYcjq2z\nZ3i5MneFZ95qrRCo02VJimBLDiHZcgNLtoERSC4wMcC0vBI678i5mlxgIiU68Xut3fJvoSTIB4qBG/6p\nvfNCLhsB9LPwYHN1n7Oluq9PbjPJy61IjrIVVPMwVIhYLD23dYtPrpP0SdUkBWPztk9HVKTTbWu3bqSt\nw5vpbGFAW2CKTjIGIPE6TEcZW7PUkwKCsa3N3+JQCUdSZZWIumjphfoxpMfXoduDS051Zc8PBy2sGCyL\nF5ZnXeDiQtzD+z6tL8exJ8TdoqSAIFLa9to34j9TskXONq/ix+Lu3ae9Tlv91vncxijtIV1vdChJYj8i\nluIRYiwKFvzO0ondObn2hIWg7GEw0a+SmYiQFfQrwlhuPXCwWBUif96L5bCmGXgyTQzkkinW0G1RiggC\nv0D2RGKk2UJpRogvpMMM7F8hbOLBii8g0fPFqb2bh7MwXsUzt8EWz6Q/sopubJyHQ2KgUqA1wSNXnjsb\ndy3MgMWsfi8m10ZDDVsFKxm6uWZrT5p2q0Z3xBEGrBxb75FXMHBiiZiDIiCwD1o0Xet3jB2DjBOAFVhT\nj5dVQaPtlv/lLE/n5IoH5TDJI6oZIimHd8XwEo3QHgbHFSvB0oJcwRBriWUjFANFWpjWI8GPmJiWG3a/\nsEcGfmjLAUeyGH9nSdb15gt7rCpFJlUoxwm0A0Q7QmYRtNlyvTUiK7keVzSercv5HWE/KwFKDVXwoESG\n5K3v35FKYRvk3qZcT8oa+rkep5cOZTotBkQFQPtCW0F/Yv8IfVnwGMIGk7anco5jjyPoMgFZbcjt/PLz\nHZENOBQ+Z1yEmDnOf9mwDVtTkIfIEk8UUf0OWgjdaWFa4q0JapEhYQUGFX0ezOohHhbPl6We9aJFocGl\nvq+3nSFcsG+jxJYKk1ph1i7eXBJfTHWHDSHJr9WhtmVfJVihzANYnjsy6JCyzpVeRLfxpMKxIVyMHTA0\nFcpSzJDxWZwAZIONhesuWD8fDSlozO5uh26VLkuuLVJulGdZclQrzLhWfDQvGD0KqdihPvPWh8gzLFo2\noN9iFNsCsY6tVYhpyz1jkZWRtuhfnnJQSEwitHZYb72xlYA5aMyGRAqOJsrCjlpxz70jCZNOfMzInv9h\nYVmUkbQL+CclDBl6IjDNHlt9U7DwADiYVz18asG6LQG+UTlyhsPHsRRfSP0/R24A0TFvfWfZbHatfq+L\nOxiJ33yDLWJsUYWIGsy1zTLgHql7KUsrsCLmVlkr6Rtb/3qjxFlI2KkfeRvpc7fnt9avJoGDcri+FuPJ\n2pUErrVtNhAlkXPDWr/FGqKC17WQm7AriqFXURimLFoa7LABjuLsZ0KRUGsUC5Cg1waLiuYb8aEby31l\ntkRem41rNl+6PCrjZQ000iwHOPR84YGd1uug6dQjYjFlnqvxnraAJ3eBdTPhz24/kZgVBlgNUE7Y0FJR\nKGvFDY0luhZrpOV9mo7Qg9b0snrzG+Xw0jGAoX6WvLehUBuJqDGxbyyBymVhvH+EK7DRRttBwcrCFITx\nKnKHHNSn1IF37BmfQz4TNWGIjW0NZcfSmRE0EddskXTj2EOiPTZ+CUKGW2djyL2i3HrIg3VyhxzD+yGj\n9ABUqKDpMbMucV5nxMViiV9YPvZgWmKCgkBu2HOULd7p2IrfeXZNDfaZElzBI+E0+QQLCCoQ67pQ4/Ga\ntXp4Gub5Uji6IGFMNTF9AmX1mJFal4khj5VIHvS+hrEupub3utJO99e9fKbXHpPZsphGzmhBjrICeUoL\nvM+etG/kdZA8h02lXqSwUxBY8NRu5co339i6rJ+oGCLPa5c7l6yME0xJ7ypjvRhwwTLzQIf9NWye+poZ\ncJ6WA811LdsSVv5VcoSd2nu1aht5T3RAYwt/5XrWqmDKbYuOAlynNxzUw4WVCvbYvLWAbRECDquiOt+1\n2Pgj3gfNSW8UZqT2oneUltrfef+05o67SmjiE9ZapiSSoIW1upLfWaJlHB19HkWJTeWC8I5yzA8jq9i3\nMyBpkLE4ScwcR16yhZUVXcoBVOi45tpH8deGkS5d1E4E1qxL65s2GyVWtp49lsPEW2h9yh2MmgcIvI6N\n/t1EbBlqbdpLcophfBtcVrQqYXtaBLiKbHnOLnG+Q17H3P9ohz0yECvHD20N0LXgcVGfAN6wbgcA9m11\nfOcHXqLFEzaHHcmNOirg0VnI8F/KwfYk5bWPLGbLg/BesF5F4n95DNjmdCmnHNvrFqCsnS++3OvYcvob\nZU8UhF/s2Jr5dNMnVsOKKbmuxSr7fNlyh4yQp2A+j2dyZM5cT1QAfmL5Yp5oRzmqh6Ivih1rtIvBWjDE\npJq7H4olT9kM0lcsIp/ov/I2Lx3/D33v7ziEU1hthiBI+C/ltGNslB5GSqDxFxuMavMl1tS1U/Dl7kpR\nsN05LIbMKBG7+itJt9hoK0A7toC2Y+NRBuUeWFAn/SbKqVqfVWQFfJvdwE4bemSLqTu2KrKNr9CDVauL\n5YImR8qeY9LKkXiKDb4otzXHQqc9+9bh/hqDk8QxQXlF8vnOHgtxlKpawzDIV/TsiFedPvsWuWiNOlB8\n6f877ejYskOJz9BREunwhz/YaFXhTEjSrt4dX326Z+9XNoDFVltvl6DzaN/22qfehtw+SQA1GwftMSfG\nYoQoiw64zJbldyxANc7XdOjK2WFZSTly7JFscaHG8to8ULMHHdaw9dptIX57PVc4EAXEKHgDT/mUZdiC\nPb7/1B7Di8e4FPHAHgO1bOTYOLIu67NQnSwL3dVuy6Abia9SiUUONgUg1o6tAS783V5WjtjsVRtd+wn1\nUTc9ZFxn5kUDCfxNSchf9z//1bmhmNra5Ka9R9zhdL1Bo35q10X4oesdewBkHBsSsl37fRJZBSX46ppn\nw/YlI1unEKj9kNElpf0AJgqEI/62jjdFU0v1aWY/4P2JvQSmwtRgN6q+ul6S2yhhcjBIWi5Uidwk5RVU\nqYQIswuSvzRQ9i4HJrWbf2fEK559vrrP+AnXV8Z+p2wOVWTT8Vmlnem+Nu5Cha8W8FykmPvtMUuYsboV\nDKLASx+p2WxKfGRvkoI93Cc2kWDicrSWby5ZRV7EcuolxojKpRtMJecVfrydkTh/wIarcpzRqwVexRyJ\n7oiMTW2KbJKQvcJJsk5iFqDntU5+hAHxlqSK5LhHNmPcaOsMkmu1mPeCpYppfepXs1EiYTq8MsrzS5Fc\nSeHJPqAzcQ34SllnHFaC2VOllA782BYAMGu1BfiXr8XM54VETOSC8Hs1laS8SCnkvUzMOucNSBS9fVFR\n9IqSbCuet/E7JRFyENKS4W6wYAyGxuj9V49DCZtKJF8WA7RJ+fbKA8Nbf1xWL3BdtoTtg6nHcnGX3J/L\nqERe6hO/uk5bJ/bXKhOYytq+M0t/CjgPdBMqu+RSlAFj4e1CPu+2qjBznBLn1UIoV4RFciFYhdeEYVmV\nVASQeH/GWsht2RV7bTNtMZ7W8zCdfxPkMy4LPKmAo9bSkHhpppwA8qSLThe5ozjmHaL2loDfb7LR+2za\njXjksR90olJKcqsSOdn3GIJTW0tENGtTDtYS6cz+Nol22LqWdgOcUGTujbbJCwnvx2LaPSuuJyLfbMqI\nWcvW8Yhf+aAE7sp8fcnbov+JjkdGkZGemVnFUHQbR6YCGvdEnzboSMdruVxAj0YS6GjLgzoCXt9MrL+W\nuyPCjup0LZfOSDIBgUZYk3QlVTASXSk5ejzXHbC3ccOYV/sZOyYRFIwvtMf04vXEiwesbHO61s6SaYAz\nNoPHDwxES6KSiMK1pByvILcHsR79oFgaa/smnjY68sxadtJna/tsvTvMm7T5bXLrNd8PecsYiQo4kIEz\nvycWWIUd1ORgnRk0crtrTLZQVAZFLvcAs1m0uG8lKlRuppEY+4RpRv8/W2/aJNd5XgnKu1Hd6H1fr1Pt\nZmFcqALk6Qk3qlAOECRFyNxCgKye8fQoblXeqrpEVmZ13kwASUkRAEhwEynKtkjJMm2KIkhCEAGCAAEC\nIAl+gP2d/GQw5os7goSoiZnfMPOcc57nvW+yRwuqKpd73/uuz3LOedA2iFUgTqdk7CrKRPK4IFuuZAUp\n0p+c3dn0bSuiEr1D0VChzEYsmGJdpVA6y1sojWIvMM5I/ilG1+YpDHz7vm07rBwIfx9mEau0DlnichPj\nD6gponOw+jEPiMW3uRnsRgQB7MojZBExH/lc9syen5sQvmVDqNoGVXeveCCIbc4irqEcCrwK1UbAfB5j\n6neJcpiU9XAV1WMVquJ8I6oMzBkgI5091TjQvLsxaIiaAGAH7QfIFW5YubWFc2DDSZ2qDbO8ZJvSmGEy\nEQY6he/SPW2iZl04CdFj8BPC1NfsQxWJp+vS5QccGzHm1ZGQYnbf9XrnSt1fcMJZrENNN/KLZIx4u229\n4LCxCXDM+h4BIuLdUHS0i4fEclCRt9VVds39vk4AGOACY42T/roH+JYdjd/dUwTxdMRy7EDwYwEdjP1D\nVQGGiKyT/4lKWuujDXGfbZ4zjEggKvdR8GoRthBRd3XCcvGQt8dCtU+yMOla5fsq5ydjFRsofICeRORY\n63/Qw0CLHdbFvLUVO1JAplMIIY2ixRMmbZwq1KgiT1Q16U0AAMF6Va7R9jkg8rbAlTMvdYStg/Ojy8ro\nRHRpn/4PgjfNOwppdXnJDM6lETgw3I9E9apQ0JmhNrYWFG9H3bJ4oT37vdZ5sMycS904QbtBMBNRSkEm\nMI6bA+znwRtHQMBO0UrJsc4yrDG4QqK+1uXXxZspCqcq3uf7hjSGVkc8rFm1Q/savB7YzR7om3GOb0P7\n3CxEcqVQ2q8vupMqE1jXMQbfc3Q8cJY0uBued2IEcr/4auz/4sl0nbbdIK+D/WCltn0P+RVUBavWhbWq\ngV4ilBtQBaZ//ZyZMKFj8+4hGWo9AkbsfixtX2p12dzqqj7KwrLzvBvSS2aKwiFrjVevmwTzzRHkXdXq\nwvoXChXgUOzztsrMA7X9y+6GZ9S8sflmxoEQeAzXL9MFtpFhyXb+DzumWTwYdOs0R7kt3CfqRqE6Up3l\nTqH6S8Ws1h1qNuJ+HpWd4fk9XEW40jqrLnV+YBBq7pOLzrODyY26f7QasK6BCgFKw9w+bOVONlbtkD3F\nF0VVaqhSwJiU7b96nnEPmawlZ4445gAgKp7D9JPs51Kv5rwmrcmGjnW7SbxD4Gq1WlJkb1nzD/FFwUKF\ncqh2IICLc8+B0sWmSh+OVuFh2r0dR7aH68/OY0cKdHr1I5xhHkYsdrjb6GSrrurmzMxwsdnCYfXjTZRz\n73NeuIpA47B5hhOwJ+GcBNvHI4oTnMU47x8ed8l4dAr2PNLQuE7hC1gcd1TcI0i+A7epNDdJhd5Y2m1E\negbPT9RAKnlOzRcKi3ZrglUKUR9Wq50y/3Z2CjFXHRhFEiG2P4fuuZMg9iOBUpXcRe4ztiCdlQzFKRqG\nMn96kz3FHcwB3iEw0B182tqrwmGfJRYNnDJyNwqdq2uTe8yHwZnPILCNULB4HAXdOH22T1QDAf5HOD++\nDkJzuRnEruE3XB1D+8DqxPUDEKjgyl7rVcdgV+53O7lXHh1yPqm9y6o7yQpXHO8io8xiPZnTimm87HIW\n5qZvAgrTd6GIgnW8cAKIn9gseFBgwQ1gyVlg3xmOxutOTNrb6XAe2h9HsTsTl8GNtsuKYLZ+lPXsFL6P\ndrG7NqL9cV/8j6gWXW8tgi1/lz1bx710+A6oUy08W6fA3MIMErIFtEizwFX1kfsehguhW9d5aEhFH9SN\nwxpntrmmiAtx2OFhq8P2WYSUsL+BrkobmLkHVmxkiFIsFK6DLTh6ezuC79ztIBm3ExtVz+wU1dDZ4V2P\ncU42t4D+hmgJonhw2MBP8fNlidX8cMAI2Nu4iMg86p4hxlIovrQ3xFO0fXSW5x2ArH0PKiC1mHDj3jqO\nqHlPQ3n7u05hL5w829wt/iOqHGEeNg/6Pt9xkLyWG+taDhEXdcWTpnQ7iBxJa+BdbjfRQbUHmC9Edp8Q\n0dBbc5hSYSbZRm1ei2t0FGQMrdTw9OHHTZgtxfoYaj9ENgxBU+1iYCny+QvHHjcOFC6cR1bt/L3f+0//\neefuDpgT8CXdeR8WodXByo17dnkGYQQfCXPZBUGanc5BYgjA+tGxPgXduPa8t2mDoDjYLsy3dHx/m/fz\noutU5WYdjEbzR2dm9hGggBpI2McYPFqCCMDqoJvwmp1lRJdwLrnADIDbI2w0D9vkRhCNoGx7Dgexz0Oc\nhFxO28exjzpbsRFZcmabyDuYF1Lb8Wj84mggZMbSAnHUy4PDPcQDSie/IR5HVvcup5q6AkLzVZ+3rn3R\nLWaP2ka3UcwXej7YIdjHaE/ViWw9dImVwudT4QSLjgtWFK6vgiAN7cNFlyRYdHJWoCG0r5W9OZ9/gaCf\nF3WiY94FKTfLHt4DSmDVdneg3qBNMdqw+WgP0qVD01T/Eaa33c58OsLyWLzW7s/VxvZLGMXBpIGmKdis\nsjtw6ksHcQyzc3pLng53LuHSkidRvgHJmK3mWy4d0rh4REzLwpmdBctu92HfK8+5tKL4ZM/pUIVvuIWz\n5p2/3CwpllqEzoIrsYAWaHu8QFmwq+Tf9yY7XIxiVB4jtQI0ELzv7Z5xzYkGu/z45tlGtZkPDQp3VDW/\nts+Y2YT6qhPbNa0L64ZetdnRazbJJ0BoDoa97h1AN/W6YGr4cO0NeRz3tze3ji0C9L2zcF62i/40/jzd\nI6XsdTs3NrdYBVnxAaR5SKoSfTy2yV28D+e30NFLTqjcH/EdBFDW6mMzvlD8eCuWfMN3mYyG+THA5iUH\nUxRuWLl5U5Bibvs20z+QNnA1mOAiMhOGeSTdn/VguwvWYd9xGaXCet5sgmXZQcjjqv4eFg3tI5FLFZdA\nUzUtG9+35lW18wBrk1r/T+AUxPt2747rJe1glqRuClf1aNhPNk4uPYB5Yz5KH06vbfY2I4UN2oudDjbi\nwyUyvsgCQR+lcQ2VzvJ6uakbirZcIFuC9ebzqUBSnehX7EKMK23t2b11rJj3DzhbpXGs8Zd65SMT7Kx9\nxNmsg9i/5L9wG+jQ2rHzXECtpQV3N/39PV9a8ECfa4cV7rcWymx3Che88XS07RQOI3MRmZlZlYLbMati\ncDs2zLgZNYfr2u3G4WDz5k/6f/Xo6OZ7w8M3X6+gAAdlN4ZIb/60T5SYmZUexPfa3aiZzkh400dkGROc\ndlg98HEceLQ/1kW5Plip4SB5GL/xADeq6MGwKrEP4fxEyGZ886d2fdrb+P6ECqnqhsHWzetwy22tNwPo\nhsq+wLnLfQJx0x7CDqyR2Ec8CsHoEaLe9C8Q2YAWrcfL0JBRba3zhEJDe+vmJfoZ5pmaMcWIfFNu3vwp\nDN8jjJbYxgD1oS7lSrfoqJGwWg6dhDnYAmENzBDc156HSQuEQX2Be7Kh4fegpXvz0rBrrskjyKIMHikj\nMSIALquI2sBK4QftK3t24gD8pJSJtmMbJ4/7srImPud/l540aLz/SmrH1kcGJf6wNlLT2J4Lf1AXVXkI\n+PHQnIlkhdmFRJ4A1zFAmL1EJ/brEnFJ3M9THLZXr1JRt7RW91gBu+b7a4iy4HVG4GHXhL/BUFEjggHH\nHdmbZqVkeKsKRS75YeXQ4zEDRWnwNzxLzT8YeA/fvHQECQPF30aD0c2frsLAsPcfhlAya8pb+5WOKuG6\njuE+IQGCBoidCvKC9d7Nc0gSHGH/SMfOv4d5xMwO4q4DzGeKc6A6ckXqKfYE/GLz8+Ylc2AGiPSw30gv\nQlF4rDL4V1LntR2J/cTxsH4abKn/mUeocX/auwOQKY/YdVANEtcDWKVeqYceFyxp13BdESBblpqm9qmb\n5xCI7N68BBql62Ng3TGjAk3qm+cGSH2vQvPGVi72XbN7YC+bg4D+WUEkBspOgJ2TvG/nYanxh9+FfmQx\n8+F6KXr2gMYZZhfjnUAfajw8k3POnIMj1BmmDNgjkJGGZNSI8W6y/5RoAjrl5jmoA1Mpu+LyXR/b54/g\na9YuW6ZQPA5138aeyc6GR5ifuflWifwI4M6egFK8reJJwMqonl9sRJm0dWmLF3BpPQcgR9J/FuW38lyX\nzQP1T+nquxc+vPzRCSjZ4udHJz96JukA20/87WrC7334vD6XlHuhxws1XeoMf3TKP3eN14S2sK5zVfeB\n8i0/79ez/+v9C1Qafsuug9ZctU/wb3yWir03qMd7zVrymKsQvy9NY6oC37D26Oc13Omj42iz/YX7S//4\nPb3/0XfZ9if9/lehDuyqyW+7BrBUey+4zu8Ftv0t3pO6w/YNKAI/B0Vf/MWnPgnFZbs2Wo7ne5fXwPcv\n83v2XN4+a48+Qw1ltJ/tQPvwChWQcZ/vfPQ4++k7GA22AvrBb1u7pZx8mVd7m8+pfrpovz/p/fUex+eq\nPdsFV2x+lCrIF+xbVCu2327wiS/4uHznw3eoz/xd6hVfwjhR9fiS9981b/VJqku/b5/R92/4817wn5g9\nx9mjV+1anBd87RnMG84jKUVTs9nae5U6sI9JD/bWWaizfnyKurBSjP0pX79ARdTHqH77hp32T0vd9tZP\npK4LCwBarlSLvfzxCdd8bVVo8c2n7d0n7ZW3ocFq70tLV5qzr/PbT0Jn9tYr9u7P7Irnqbir/5+jeiyu\n8hg1ep+EVuutK7eu33rH2szrugLwo3wH98dV36QC8GP2qTPe/kdvvU11WWgFn4LGrivRvg5dXbTL3nsN\nGr1oqf18h8qy0Iulmq7aj1Zbi6Xi+5a1/JQ/7wko2H58ktq8p3i9i67K+1Mo5NrPN12x9mn2KNRwpXH8\nUyjJ4rtU28U330B/2GdfoUbxU64g/Drvfc566Br74Yr99bbf45J95zH1J3R8+e03qb37unRv7W4/DR1e\nqvNekWYyx/SE7u9avWft/RO3rvC66L3z7FuMyxlv3+t6n+rE0DGmTi/1d9Hnp2QV2mi94v37JjWbX/cx\nfRzPQ/3msxyZU9QfPo/fNC5f8P/8kv/3l/2/v+r//cIv/fKv/Oqv/fpv/Mav/9qv/sov/9IXfnPbzN/5\nu9v/3t//+39v+9/9OzPbfvMf/MN/9I//yT/9Z//8n/+zf/pP/vE/+of/4F/8y3/1r//Nv/13//7f/7t/\n+2/+9b/6l//i/7X/xD3w+y/Zz1/2//+S//9X+F786b/9pv/3C2zUr1hTfu0Lv/6F34i4lqKsYKBEhlzl\nExQr3twEA2hih0/dQ5SF4kow3O86dNfCMWowEVJmjgJomuB7otJBNdpo2dnVUDEvCkut8Bg3T87degSv\nAZIddsJhNj+DMedlSnPAiO8Uztax83qstAyTloDoDTyspbBF3ZvIn5Nmbw8xocpFKCCbD4YgNME8x1zE\nL410haEGOxqOmegH6IUZ/E5korbA1AdNCCByNcNzyK6sZh4g2EuMFCb4RHUMgA4o/CKmzUyaPJftM0Rn\n4/tIaVB46856wLzR5NsBvIz0W0NMGxzofe5YNoGkaLpwZBHLbkqqxIza5KgrDZgFQ5yVGRPELQDSb45t\njxFZV8NaWpDWJ6QLFXu02zCpaa21EbNmIP2LV3ApQaceqbpxiy4l6/rgjdmzEFM32jCfuW9T5wFPphXz\na9ayZnbHIux3Ps5mva7xKvswalZDos9cRimmUNS1IZsG0nxwP49UQrLB/UcwBYlHpA6QGJwonlinSDl0\nJ232IDatHHXdbFKrBp+pWGXdzLV9veoYQ/flliJv3QCiNMRtIzTl6mg2kdbWEKtEckth9mUyWPG+wMX2\ny0IEGkHvYfLB0bZ7OysxyszcHYXMH3kz9hlAOW++XtbNvTaxJ0cHA+TvSnncDsRpbIFQ4GeGbAbc/i6z\nZeF7gyJHFEN3v7kfJNNAMw4Xbu50nA8Cf2tjXHB5xkPs4VqG3hFABhVlxQpGhUB7p5u3pqr2jgWuEHPY\nAl1VmYqZgDw0ZNlgcD2/UPYkfkvZQMcBON2is+Cg/Kp7dyyrLTCgDvRHsyinwqDyuO98UrsXmzyjNKU1\n4wGbLMQOVky8Qr5aSnpVd3R0UECxoREpZiSsIJnrLnXcWSaHvF+ClqM8Z/dOIpbJih4qRT9iQhA0efgM\nCBJThxTcwnia5m44Uyt2gyUHSy5Hoty+24yJ0A0+6qII4XadL1c+E+AKMf1rbpJdnHn3TRKvmgBGzdd9\nYgkofyYM0P7Ynx28NG4CZUM5F4j/VYF3akiMwHD2BSgHYXZdQpucNZLdJVV+BfBmpmsmLgnXm4DdyTGN\nBPGikAIOUVJ6TXLZtm/Yvk7dFHyBs7xmxsquLB1OSDJgtSFES60nPCoAhVsbA0hRVpvWeVtVgIMaopoA\no9gR8WZI8vHKSshRT2pzsIpUHEn/nH7HRtoumrFnBT26jjS+0pBNOgP8XqAP1l3OKGsz2B0roVNuG7dt\ncYpiepa6G/CqJvLnM824UcbdMxjFrmarHuLk6kUufGazhmyHeWrKkluPuboG4slgzdoEkoSZNd4DXg9T\nra2C7LjLMGPvFcipi02fO7aLalG9VgNGAAQeUOLUSOlDPSZIK2Mc/V/xYGFBpD0lHTz82i176zhpNzYD\n4NQAk0JxZ2HD+xVzI+OhwFpYBpF9URpdeBinpBHYp8zTbEBFBE2TwSDx/B2MSq5uFIEW6e6MvOg91coQ\nqoZFJHCLyCTuIeQBm50tQOa6cfiCQQdLpodIxd6OZuYqlFxLHUD7HDBXyB6CusExpxrfi874A/wTWeNA\n2RSbBCjYUUL4DsVZ19Y02SIyuc1D7NTx4HE8b3PWxdJIsC1BUhxYtx/dGARO0QNDjXgqNZx0pSqZixQK\nEhPgCPa0rtR+a0ACPCA77wItsy5lByQIMhfWQqwzSi4mzBM+wfBTZOG6EAWmwbEztsiqjzECEL7nc8Mh\nbsAoLEt0KpLmhWvLVt0HPBxcxGm1tAZwAyyrA44ALIpBf6U3HppdN2Z2mQ9Yb0kLpKEWWXG/9R9ZNOXK\nQGaGq/s6vxCw9QpdAPNCktK2a/UhfkCUX/cI1SibrWMO/F/1jbFrRunejtkzHUfYsUSFRG2LAEd6lYvB\nMNBijaf7qu5BoPfwhGW3y4TUbMyRwkP0Fakt1EJyoxTa0fYc2N4PxvYO7SLrFhbNGlHdLVTdug7tGjZf\nQVgdjwfdAxJVtH1BW8vTqc6Js9YC8IzAkj3KSg3xEEJB1mGrHaUiNXQ4ji26kONGBfF7KDARLjoeRvat\nigRf146Jsi/dBt+akLurgQNlFQK0R0xkWxF3Oaxn4nsvCytA8MgMMwlYmolOSBoxT8JmNSJ2gZ3vKN75\n2E6X1ojGg1QGVjcEoSA/3lBYigL5NYj34AfZEVQEaoaoHAie8MSCQQ6LrxSwVF1YjPuuAWjr9DCFNjqF\ny9dFsquSPAs1pTcrKk8Fbmmygp0TqY6ycO1zjg5mJXaA/mh5aeGBwfCoHbIwmYku4jDZFue4Wngnw9lA\nUsCeBzJ74hrAEGcayUomdIvoBj9u5r1aAjZ8eTdDm1hHOHBAUGiUzWUgl1FcSsjVS7ATDOYVwXRKVVaw\nxctTyz6zrz0CiBRCeT6HAu6rhzh3bZKR5wZeplQpjlQgnKODKxdrqEfUevHMFk4wicZC9qLHLa6LShzD\nwVGqQ3F3By1LEhM23wJ/22wOepBMqRpi8G0Poy1KSxzymmRYEny+YdYy6XLUW6h8Q6M0+hZ2YaqNAo9A\nAhFZW4LwikEGBRAm9THK3FtwnX6Yl8Jr2sXujnOZAmqY+Czv12iKbtKJeEjg8rJHkXSMP/bMVVho5qhC\ndHgIk0b4CElbAS7zW3+0nxqQnWVHYRx0cFnhKgu2VVY4r+1b88UBaigh16ZOE+FhhBSsoITzwkAJFEVQ\nYuOi2L3JznBQZbPR+B+5MI6N/07BbNbcyEauEJ2wXo32k01Krx/jtbSgxOIyKVCbTnauJckpi7qR0gBN\nR2CBaapxv++PqHKI9J5gSXV19Ou1G29m/+lJpcdgZwSelmoff2ib3iNj20tnJeDQm9Amgzut9B38OuEx\nod5zxLa1Aop6RzRtvl4frrcwW2VdEFwiSbWJrI6jIIpY83HSRx7aAWSwD6XVXI6YQOMpQ3WkISidPcn7\nONuddh2lebviXMEeq1wvcDlSogdoj+ERDkn2lGRXblJOUNpsSObCgXEPdh07bClMwdOcNjb2KYTs2TD0\niiRyMWsxpofC7BG9ATlFbMKYPX3b99eBGPKEum0OW+CAARNJNXdKAvfE/JQyuF3w23Guo8VdiPdpKmLf\nKJ1i6aoqkHdXEryQrifkNOzT3PTLwjXAe9jHGsolMTQzWHvQJ23h0ke2lunf1arjtImDw8zcHtc54SsN\nzRKvhkI9DGras3CAzaVvBhZTVGqq9K3rXl7SCYlbJiTNH9xcF6CGWnOQ7IL9De3JSvVn+PVIkuMkH5Wb\nWyiwwb0Xg/LlIWV510t6SSA2q/oGBEm6RQnWIEZs0KcELgYO3/o6fDRngNMWFR750Abt82FUigICCcRk\nQOUdQttIh82+tT9sv3iurotWV1iLFSX7lwLZ6Mi27TPuxq0CIaejJEAJyyWJ+vZ7UUSJB8eZAgeyRhtp\nZ0DYXXIRUlITqaBQe2dgXUfTFIemNIexM4ptDhWAIamOzdfCU3APyPb5dTLQRhV1ALBEwVDUIYlNHRd3\nrfS5AIB0lv1ehI4rrFdJ9NGWMAtacE8A2oAuML1Ks3KRB4YNu38DEmA1VDvEHLCZSoQfNNqaGosZSXs9\n+0zAFBRDo4CEh+koIFOagcE4E6MQlJg4Agccuul2QagwHkY1A6xpkEOi4IBZuZA3A8i9DOjMktkRPWg8\nqIWb0NFDANc2mZkZly52Lb3RQLQcBK+cN9EsB4MoLGGHdtcsFTXe4lgg9YdhYkVb2N2lA/d6pPz6tgMl\nrKNeY4vmrqtU7beRXVmp0AW+bwRLpDmKqIjZhf2IVASVdg+19FYQ35A0un3DBeyL3TCoEBRcdkurN5GG\nLeYkdn4c2wHgLoLRRpYxmxpxl0JaVdCyqWxfQa82ERqyPWu4b10AaYV9pCC/tWGWWnBJbM6uA2UUJIy5\nNbPdGGKiwQDrI3BKSxCh4jaItcMadhIsgMVIg+FwBTKAGdGIKMJuwYYf0Z456RzZAx5kiS+dgwiam01C\nJhcs4DjEAzxtloxGYHnkCk6gQWtBBAC3CZ+oeyjsVYjqcauMQdkrNQtAinH0w8hxyVSorTSE+iemgd3C\no0QRo54kUO4qt0yIGHqIyDqq2ye/HQNH9awiqH4x3F8ixx7XKYu2CpnibO4dD4aSkQI6BuKGNsGLSDdA\nzYQQrRnZdaPusuyNgtLXRMnOmG2x6tYFlE/BK48g2AgidyizIGMAB1uc2QGSWlpy5YZl8bOtDYHT6QfQ\nejlOm10UuOD27hy9OQa+wWDmIU6vxgxyyuWqehd2LSdUzjEeLZlGQaeLiMHucdnr3mQ/j087KXBBye+C\n3Y4+wvTjUYu3aH4LIkgzzJUxoMPTpOFGuD08etQskRviYtMb1f22VMabFAuG1JWt8tmIi22icEEzGJVb\nQcMsCx+xu5AcwBUlH83T00tSqGCLNRGqyt/CcUQyugwquxm2p05Bc8NsElh56A3Hs9aJUdS4+MPqIGKe\nRZCDSmojiGoEJSCblCXZ8Kwb4ZBL1zStR1yswMYVAb6PdVFIjcZmiODxjmukuctYOPZdTgC0cHsE2Pe6\nUOZ8t5JdXQXqvFAwAbuEXYe1cJYWnHHinaoZDmGSihw8tMGWvr7PQhH3Hrr/PspCwHed7HHt7v0bCA76\nDsnDhEpkyOCFO1DsDPSqH/Tm+gZ/D5QbUmvKOJuIjQO5ei2SFD3Qtqq/fnlsx9hofKT+60t/9Yz9iYLZ\nf/Ws//K31x7726s/+NurP7n9g1dvv/jGZ2f/UoC9T8/9QIg9++X/ef7F/+vyuf/7hbc/uXr9k3ePf3Lt\nyc/Ov/zz8z9Arfo3vv/Z+Qv44pnvfvazFz599vjtF5/99OmXP/2zM59c/5PPTnz/5+//8e0nP/j0xQuf\nXH/9kw/e+uTa937x6JlPn7j+86ee/PnpG7e/+yefvfzM7ddetBc/+977t3/83mcf/PknV4/fPvfq7e+/\n+cm7P/z0/F/84uwzn7154uc/PvHp69//9I9/+Ml7P7r9/IXbz57/9Pqf3r7y5GdvX/vs+KlPn/7LT0+9\n8en505+dP/PZ+eufPnP99jtvffripU+vnrz9J+duf/+GtefTZ37wyfU37JVPT7/+6bnXfv79lz678vTt\nv3jV/v25Pc73HsfFP3j59ok3rc0BJ2xs7t08Zz7DAKYbJnK5UgK2jQzJmCC4augYsG4CCZp91RPMCbYW\n8rY2w92psSU9JsJr5eZ15HTJPhdaiJXaqRIg7wbBWKEHHX5adwdhvA2PhJOVkIQAXgHUR5kUgqH6MGbJ\nTde53MIZEy6yqT3ANRAzmtC71THhd+I63zxX1ps3X4Z9ESjZchjwqiFzLkBagm7Pm5oZd/Ona2Dpo0SW\nY7IEIhOZVrcgTg4z9eUeatU7/9w2XQdQNR4xq0vb/pGqKBvnbA8aB2VF1VrreWvMzZdXR+KVEBjpfVg7\nksxeQS+zV7Fw2NR4Ckd5E65GGF/Zc94LlRfsBWghULUSXnoJFac+6hn2H7HmV49EANm8/B5nSxkwvsbN\nMkyBIZCVfSDxXmYmA5BcYsTQZk6SrdK/FWjBJmCS0fODJopqn2RJ7A+85DaKjp9kYWwVBb/Kf1/lu5f5\n1gV+7ImoRK4i5Sf+9vSf+1v4/Bv89zVW7L4W11FV8mv88HNxneNshm76GptxJr5+ultDqWKw2ngJcDTp\nwt++epL1y8/wM+f5+2n+/jN+/QKLo1/li6ejSRejbLnu/njc4kJUDb8Sb1lLXuArF3k7Nen5uJeKlL/B\neurHvan45Ud8imd4R/XYxahQ/gILnD8Vdcpf4/9Oq846r6BOuBL1zk/xuz/gTc/FXX4Q5d7Vkxeyeu0a\nuKeiSDwHzvvZOuqElznHWy95b+MBv8NC7M9HJ5yKe/0gCrefZm+kausvRUed5IfVnu/FTc9Hj6nlN2LQ\n7c+no0r9j+Je34su0gVVEv4Dvqjevsi+0nx4IwZaj6O5eiN69Tg74Q027wxbq68/EQ17HK97XXnNZ81V\njc5TbO25KGN/IZ7iRZ8q3s/n/bnw7ln++2I84Ktxr+Ns/7Woaq9G/jj+1IdP8JG1gk7zxTRbTkfzXmOb\n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\n+y++LtIcOB5PrcLur8W9XuSTnkS9eG//1agFf7V95DRv/Qrsf3z+xayvLscKusrLnon+POMF7ts2q69+\nGCXUL7bP5b16nO15Ij7P5uHKp9nmC+zJk+yli+3Y+Tq6EaXkH8/2jcvx+pl2DqvfMMfeiK9ci8/rM1dj\nnV5j807zk5pvmv8vRZ+cjkG5EnNAbb7iDda4t3M19eETsd6f5NWuRJ+8lu0Px7NnzPYcf6LoUtw3tecC\nq9WnfYb3xdXOZ/Mnzc/jMUsv8y0WsvfxeiGbY6dizrzKm6a1prXwwvT+eZzf0lo7z2f/IK6j+a9N/vnp\nPf9afOa1bM5oYl/M9oGfRZ+8ETv5ad+j8JXz0bAf8InS9S/ECnqv7Qe89Xi8dTZG/EyMAluibmnX+wtT\ne0U7uLHWfJ5f9odN+4P/qbHQ3HuG1+e08V36QnvG+fOmfj7FP6/yM29EI5/zZ/TPXI0Bupg94xPx7wu8\nwmW+/k52Vl7w72Lf0Hn3ahp3qkVDF/tpKiS/TT3pR5Pq86Vb74Ri88cnoC798Sm+foWKyK1Ws5SUT926\nSDXvpAOeFJZfzzSW37QrvAldcOhphzI4Xp3SEH9Myti438cn/V7hAVNVmrrXev0NtMnVpi+46jh+P4fP\n+jXPfXySV1J73qLudVzzdXvvFBSp7TpX/fNQ6H6cn4K+9ROhUU4V6VeSNvlbt37Cp4DW+Jnsvk9Sn5tt\nc4VzKVJfomq3FL+hzX0Kz88+DWXst6hv/rj0xqVdTR3xS9Sf1uuPUsX8rPfb43zKM1KsvnUWz4/r8NUr\n1Et/mq9Dxfws+iB9lxrdrtd9ht94068v3XK1B9d+x5/xvM2Dp29d4hXfSnrdP8v+vUwFbe/zVuvcZkbb\nJ+ehh+7j/oara7fa8U/E62lMoe99DXMvxiKe8dZraI36wa7qiuPWX49TuTzUvWNcMPPe8vnzpv32JK+M\n+X/d/oJO+mW2IObGGSq+n/W2XcXrjCsi8ge3vS0nisj/3gxmJm1wx55SUmN9PPToZb99h3LTEVam+DDY\neIPN2R1MhkivZQIUDyJ7KqK1Wg9Xx5secZzPscE5Jr9Z+hwSs81tZ2JWwHlAB8Fztq2eUu1y1p1U5D20\nNMlAP4KSuvP2TyeERIdKtYd8IsJh9yO/s7oxhuyJyBae+d3L5F9kZhhkjzDs1hBlrT2hkWEgvrgWIHQy\n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", oi;
function si() {
	if (!oi) {
		oi = new Uint8Array(122784);
		let e = atob(ai), t = new Uint8Array(e.length);
		for (let n = 0; n < e.length; n++) t[n] = e.charCodeAt(n);
		ii(t, oi);
	}
	return oi;
}
//#endregion
//#region node_modules/hyparquet-compressors/src/brotli.transform.js
var X = 0, ci = 1, li = 2, ui = 3, di = 4, fi = 5, pi = 6, mi = 7, hi = 8, gi = 9, Z = 10, Q = 11, _i = 12, vi = 13, yi = 14, bi = 15, xi = 16, Si = 17, Ci = 18, wi = 20, $ = class {
	constructor(e, t, n) {
		this.prefix = new Uint8Array(e.length), this.transform = t, this.suffix = new Uint8Array(n.length);
		for (let t = 0; t < e.length; t++) this.prefix[t] = e.charCodeAt(t);
		for (let e = 0; e < n.length; e++) this.suffix[e] = n.charCodeAt(e);
	}
}, Ti = [
	new $("", X, ""),
	new $("", X, " "),
	new $(" ", X, " "),
	new $("", _i, ""),
	new $("", Z, " "),
	new $("", X, " the "),
	new $(" ", X, ""),
	new $("s ", X, " "),
	new $("", X, " of "),
	new $("", Z, ""),
	new $("", X, " and "),
	new $("", vi, ""),
	new $("", ci, ""),
	new $(", ", X, " "),
	new $("", X, ", "),
	new $(" ", Z, " "),
	new $("", X, " in "),
	new $("", X, " to "),
	new $("e ", X, " "),
	new $("", X, "\""),
	new $("", X, "."),
	new $("", X, "\">"),
	new $("", X, "\n"),
	new $("", ui, ""),
	new $("", X, "]"),
	new $("", X, " for "),
	new $("", yi, ""),
	new $("", li, ""),
	new $("", X, " a "),
	new $("", X, " that "),
	new $(" ", Z, ""),
	new $("", X, ". "),
	new $(".", X, ""),
	new $(" ", X, ", "),
	new $("", bi, ""),
	new $("", X, " with "),
	new $("", X, "'"),
	new $("", X, " from "),
	new $("", X, " by "),
	new $("", xi, ""),
	new $("", Si, ""),
	new $(" the ", X, ""),
	new $("", di, ""),
	new $("", X, ". The "),
	new $("", Q, ""),
	new $("", X, " on "),
	new $("", X, " as "),
	new $("", X, " is "),
	new $("", mi, ""),
	new $("", ci, "ing "),
	new $("", X, "\n	"),
	new $("", X, ":"),
	new $(" ", X, ". "),
	new $("", X, "ed "),
	new $("", wi, ""),
	new $("", Ci, ""),
	new $("", pi, ""),
	new $("", X, "("),
	new $("", Z, ", "),
	new $("", hi, ""),
	new $("", X, " at "),
	new $("", X, "ly "),
	new $(" the ", X, " of "),
	new $("", fi, ""),
	new $("", gi, ""),
	new $(" ", Z, ", "),
	new $("", Z, "\""),
	new $(".", X, "("),
	new $("", Q, " "),
	new $("", Z, "\">"),
	new $("", X, "=\""),
	new $(" ", X, "."),
	new $(".com/", X, ""),
	new $(" the ", X, " of the "),
	new $("", Z, "'"),
	new $("", X, ". This "),
	new $("", X, ","),
	new $(".", X, " "),
	new $("", Z, "("),
	new $("", Z, "."),
	new $("", X, " not "),
	new $(" ", X, "=\""),
	new $("", X, "er "),
	new $(" ", Q, " "),
	new $("", X, "al "),
	new $(" ", Q, ""),
	new $("", X, "='"),
	new $("", Q, "\""),
	new $("", Z, ". "),
	new $(" ", X, "("),
	new $("", X, "ful "),
	new $(" ", Z, ". "),
	new $("", X, "ive "),
	new $("", X, "less "),
	new $("", Q, "'"),
	new $("", X, "est "),
	new $(" ", Z, "."),
	new $("", Q, "\">"),
	new $(" ", X, "='"),
	new $("", Z, ","),
	new $("", X, "ize "),
	new $("", Q, "."),
	new $("Â\xA0", X, ""),
	new $(" ", X, ","),
	new $("", Z, "=\""),
	new $("", Q, "=\""),
	new $("", X, "ous "),
	new $("", Q, ", "),
	new $("", Z, "='"),
	new $(" ", Z, ","),
	new $(" ", Q, "=\""),
	new $(" ", Q, ", "),
	new $("", Q, ","),
	new $("", Q, "("),
	new $("", Q, ". "),
	new $(" ", Q, "."),
	new $("", Q, "='"),
	new $(" ", Q, ". "),
	new $(" ", Z, "=\""),
	new $(" ", Q, "='"),
	new $(" ", Z, "='")
], Ei = Ti.length;
function Di(e, t) {
	return e[t] < 192 ? (e[t] >= 97 && e[t] <= 122 && (e[t] ^= 32), 1) : e[t] < 224 ? (e[t + 1] ^= 32, 2) : (e[t + 2] ^= 5, 3);
}
function Oi(e, t, n, r, i) {
	let a = si(), { prefix: o } = Ti[i], { suffix: s } = Ti[i], c = Ti[i].transform, l = c < _i ? 0 : c - (_i - 1), u = t;
	l > r && (l = r);
	let d = 0;
	for (; d < o.length;) e[t++] = o[d++];
	n += l, r -= l, c <= gi && (r -= c);
	for (let i = 0; i < r; i++) e[t++] = a[n + i];
	let f = t - r;
	if (c === Z) Di(e, f);
	else if (c === Q) for (; r > 0;) {
		let t = Di(e, f);
		f += t, r -= t;
	}
	let p = 0;
	for (; p < s.length;) e[t++] = s[p++];
	return t - u;
}
//#endregion
//#region node_modules/hyparquet-compressors/src/brotli.js
var ki = 256, Ai = 704, ji = 26, Mi = 6, Ni = 2, Pi = 16, Fi = new Uint8Array([
	3,
	2,
	1,
	0,
	3,
	3,
	3,
	3,
	3,
	3,
	2,
	2,
	2,
	2,
	2,
	2
]), Ii = new Int8Array([
	0,
	0,
	0,
	0,
	-1,
	1,
	-2,
	2,
	-3,
	3,
	-1,
	1,
	-2,
	2,
	-3,
	3
]), Li = new Uint32Array([
	0,
	0,
	0,
	0,
	0,
	4096,
	9216,
	21504,
	35840,
	44032,
	53248,
	63488,
	74752,
	87040,
	93696,
	100864,
	104704,
	106752,
	108928,
	113536,
	115968,
	118528,
	119872,
	121280,
	122016
]), Ri = new Uint8Array([
	0,
	0,
	0,
	0,
	10,
	10,
	11,
	11,
	10,
	10,
	10,
	10,
	10,
	9,
	9,
	8,
	7,
	7,
	8,
	7,
	7,
	6,
	6,
	5,
	5
]), zi = 4, Bi = 24;
function Vi(e, t) {
	let n = new Uint8Array(t);
	return Hi(new Qr(e), new $r(n)), n;
}
function Hi(e, t) {
	let n = 0, r = 0, i = 0, a = [
		16,
		15,
		11,
		4
	], o = 0, s = [
		new xr(0, 0),
		new xr(0, 0),
		new xr(0, 0)
	], c = 128 + ar.READ_SIZE, l = new ar(e), u = Wr(l), d = (1 << u) - 16, f = 1 << u, p = f - 1, m = new Uint8Array(f + c + Bi), h = f, g = [], _ = [];
	for (let e = 0; e < 3 * J; e++) g[e] = new q(0, 0), _[e] = new q(0, 0);
	for (; !r;) {
		let e = [
			1 << 28,
			1 << 28,
			1 << 28
		], c = [0], u = [
			1,
			1,
			1
		], v = [
			0,
			1,
			0,
			1,
			0,
			1
		], y = [0];
		for (let e = 0; e < 3; e++) s[e].codes = [], s[e].htrees = new Uint32Array();
		l.readMoreInput();
		let b = Vr(l), x = b.meta_block_length;
		if (n + x > t.buffer.length) {
			let e = new Uint8Array(n + x);
			e.set(t.buffer), t.buffer = e;
		}
		if (r = b.input_end, b.is_metadata) {
			for (Gr(l); x > 0; --x) l.readMoreInput(), l.readBits(8);
			continue;
		}
		if (x === 0) continue;
		if (b.is_uncompressed) {
			l.bit_pos_ = l.bit_pos_ + 7 & -8, Hr(t, x, n, m, p, l), n += x;
			continue;
		}
		for (let t = 0; t < 3; t++) u[t] = Ur(l) + 1, u[t] >= 2 && (vr(u[t] + 2, g, t * J, l), vr(ji, _, t * J, l), e[t] = Kr(_, t * J, l), y[t] = 1);
		l.readMoreInput();
		let S = l.readBits(2), C = Pi + (l.readBits(4) << S), w = (1 << S) - 1, T = C + (48 << S), E = new Uint8Array(u[0]);
		for (let e = 0; e < u[0]; e++) l.readMoreInput(), E[e] = l.readBits(2) << 1;
		let [D, O] = Yr(u[0] << Mi, l), [k, A] = Yr(u[2] << Ni, l);
		s[0] = new xr(ki, D), s[1] = new xr(Ai, u[1]), s[2] = new xr(T, k);
		for (let e = 0; e < 3; ++e) s[e].decode(l);
		let j = 0, M = 0, N = E[c[0]], ee = Jr[N], te = Jr[N + 1], ne = s[1].htrees[0];
		for (; x > 0;) {
			let r;
			l.readMoreInput(), e[1] === 0 && (Br(u[1], g, 1, c, v, y, l), e[1] = Kr(_, J, l), ne = s[1].htrees[c[1]]), e[1]--;
			let b = yr(s[1].codes, ne, l), T = b >> 6;
			T >= 2 ? (T -= 2, r = -1) : r = 0;
			let D = wr[Er[T] + (b >> 3 & 7)], k = D.offset + l.readBits(D.nbits), re = Tr[Dr[T] + (b & 7)], P = re.offset + l.readBits(re.nbits), ie = m[n - 1 & p], ae = m[n - 2 & p];
			for (let r = 0; r < k; r++) {
				l.readMoreInput(), e[0] === 0 && (Br(u[0], g, 0, c, v, y, l), e[0] = Kr(_, 0, l), j = c[0] << Mi, N = E[c[0]], ee = Jr[N], te = Jr[N + 1]);
				let r = qr[ee + ie] | qr[te + ae], i = O[j + r];
				e[0]--, ae = ie, ie = yr(s[0].codes, s[0].htrees[i], l), m[n & p] = ie, (n & p) === p && t.write(m, f), n++;
			}
			if (x -= k, x <= 0) break;
			if (r < 0) {
				l.readMoreInput(), e[2] === 0 && (Br(u[2], g, 2, c, v, y, l), e[2] = Kr(_, 2 * J, l), M = c[2] << Ni), e[2]--;
				let t = (P > 4 ? 3 : P - 2) & 255, n = A[M + t];
				if (r = yr(s[2].codes, s[2].htrees[n], l), r >= C) {
					r -= C;
					let e = r & w;
					r >>= S;
					let t = (r >> 1) + 1;
					r = C + ((2 + (r & 1) << t) - 4 + l.readBits(t) << S) + e;
				}
			}
			let F = Ui(r, a, o);
			if (F < 0) throw Error("[BrotliDecompress] invalid distance");
			i = n < d && i !== d ? n : d;
			let I = n & p;
			if (F > i) if (P >= zi && P <= Bi) {
				let e = Li[P], r = F - i - 1, a = Ri[P], o = r & (1 << a) - 1, s = r >> a;
				if (e += o * P, s < Ei) {
					let r = Oi(m, I, e, P, s);
					if (I += r, n += r, x -= r, I >= h) {
						t.write(m, f);
						for (let e = 0; e < I - h; e++) m[e] = m[h + e];
					}
				} else throw Error("Invalid backward reference");
			} else throw Error("Invalid backward reference");
			else {
				if (r > 0 && (a[o & 3] = F, o++), P > x) throw Error("Invalid backward reference");
				for (let e = 0; e < P; e++) m[n & p] = m[n - F & p], (n & p) === p && t.write(m, f), n++, x--;
			}
		}
		n &= 1073741823;
	}
	t.write(m, n & p);
}
function Ui(e, t, n) {
	return e < Pi ? (n += Fi[e], n &= 3, t[n] + Ii[e]) : e - Pi + 1;
}
//#endregion
//#region node_modules/hyparquet-compressors/src/lz4.js
function Wi(e, t) {
	let n = new Uint8Array(t);
	try {
		let t = 0, r = 0;
		for (; t < e.length - 8;) {
			let i = e[t++] << 24 | e[t++] << 16 | e[t++] << 8 | e[t++], a = e[t++] << 24 | e[t++] << 16 | e[t++] << 8 | e[t++];
			if (e.length - t < a || n.length < i || Ki(e.subarray(t, t + a), n, r) !== i) throw Error("lz4 not hadoop");
			if (t += a, r += i, t === e.length) return n;
		}
		if (t < e.length) throw Error("lz4 not hadoop");
	} catch (t) {
		if (t instanceof Error && t.message !== "lz4 not hadoop") throw t;
		Ki(e, n, 0);
	}
	return n;
}
function Gi(e, t) {
	let n = new Uint8Array(t);
	return Ki(e, n, 0), n;
}
function Ki(e, t, n) {
	let r = n;
	for (let i = 0; i < e.length;) {
		let a = e[i++], o = a >> 4;
		if (o) {
			let a = o + 240;
			for (; a === 255;) o += a = e[i++];
			if (t.set(e.subarray(i, i + o), r), r += o, i += o, i >= e.length) return r - n;
		}
		let s = e[i++] | e[i++] << 8;
		if (!s || s > r) throw Error(`lz4 offset out of range ${s}`);
		let c = a & 15, l = c + 240;
		for (; l === 255;) c += l = e[i++];
		c += 4;
		let u = r - s, d = r + c;
		for (; r < d;) t[r++] = t[u++];
	}
	return r - n;
}
//#endregion
//#region node_modules/hyparquet-compressors/src/compressors.js
var qi = {
	SNAPPY: Qn(),
	GZIP: (e, t) => ii(e, new Uint8Array(t)),
	BROTLI: Vi,
	ZSTD: (e) => Zn(e),
	LZ4: Wi,
	LZ4_RAW: Gi
};
//#endregion
//#region src/utils/geoparquet.ts
function Ji(e) {
	let t = e.key_value_metadata?.find(({ key: e }) => e === "geo")?.value;
	if (!t) return null;
	try {
		return JSON.parse(t);
	} catch {
		return null;
	}
}
function Yi(e) {
	let t = Ji(e);
	if (!t?.columns) throw Error("Parquet file has no GeoParquet \"geo\" metadata");
	let n = t.primary_column && t.columns[t.primary_column] ? t.primary_column : Object.keys(t.columns)[0], r = t.columns[n];
	if (!r) throw Error("GeoParquet metadata names no geometry column");
	if (r.encoding !== "WKB") throw Error(`GeoParquet geometry encoding "${r.encoding}" is not supported (only WKB)`);
	let i;
	if (r.crs === void 0) i = "OGC:CRS84";
	else if (r.crs === null) i = null;
	else {
		let e = r.crs.id;
		i = e?.authority && e.code !== void 0 ? `${e.authority}:${e.code}` : null;
	}
	return {
		geometryColumn: n,
		crs: i,
		rowCount: Number(e.num_rows)
	};
}
function Xi(e) {
	return e === null || e === "OGC:CRS84" || e === "EPSG:4326";
}
function Zi(n) {
	let r = /^EPSG:(\d+)$/i.exec(n)?.[1], i = r && (t[r] ?? (e.defs(`EPSG:${r}`) ? `EPSG:${r}` : void 0));
	if (!i) throw Error(`GeoParquet CRS ${n} is not known here, cannot reproject to WGS84`);
	let a = e(i, "EPSG:4326");
	return (e) => a.forward(e);
}
function Qi(e, t) {
	if (e.type === "GeometryCollection") {
		e.geometries.forEach((e) => Qi(e, t));
		return;
	}
	let n = (e) => {
		if (typeof e[0] == "number") {
			let [n, r] = t(e);
			e[0] = n, e[1] = r;
			return;
		}
		for (let t of e) n(t);
	};
	n(e.coordinates);
}
function $i(e) {
	if (typeof e == "bigint") return e >= BigInt(-(2 ** 53 - 1)) && e <= BigInt(2 ** 53 - 1) ? Number(e) : e.toString();
	if (e instanceof Date) return e.toISOString();
	if (!(e instanceof Uint8Array)) return Array.isArray(e) ? e.map($i) : e && typeof e == "object" ? Object.fromEntries(Object.entries(e).map(([e, t]) => [e, $i(t)])) : e;
}
async function ea(e) {
	let t = e instanceof ArrayBuffer ? e : Be(e), n = await de(t), { geometryColumn: r, crs: i } = Yi(n), a = Xi(i) ? null : Zi(i), o = await wn({
		file: t,
		metadata: n,
		compressors: qi
	}), s = [];
	for (let e of o) {
		let t = e[r];
		if (!t) continue;
		a && Qi(t, a);
		let n = {};
		for (let [t, i] of Object.entries(e)) {
			if (t === r) continue;
			let e = $i(i);
			e !== void 0 && (n[t] = e);
		}
		s.push({
			type: "Feature",
			geometry: t,
			properties: n
		});
	}
	return {
		type: "FeatureCollection",
		features: s
	};
}
async function ta(e) {
	return ea(await ze({ url: e }));
}
//#endregion
export { ea as geoParquetToGeoJSON, ta as geoParquetUrlToGeoJSON };
