import { a as e, c as t, d as n, h as r, i, o as a, p as o } from "./decorators-d8E4nZJy.js";
import { t as s } from "./decorate-D2tFcxUg.js";
import { n as c, t as l } from "./src-C2ElxtZY.js";
import { t as u } from "./webmapx-modal-tool-B2NMM-Q1.js";
import { t as d } from "./delaunator-vCBbjqMd.js";
import "./alert-Dzf1BSLu.js";
import "./button-DE9ytwxI.js";
import "./checkbox-DigllOlW.js";
import "./icon-Qf3FyAAL.js";
import "./spinner-DHQKbDmr.js";
import "./input-eCCT7kEl.js";
import { t as f } from "./form-label-styles-CiXgi-FX.js";
import { r as p, t as m } from "./data-colors-BglhXRFr.js";
import { t as h } from "./layer-features-NC94kZP4.js";
import "./icon-button-DxwGf0BN.js";
import { n as g, o as _, s as v } from "./geo-calculations-DcpPxqU9.js";
import { c as y, n as b, r as x, t as S } from "./spatial-worker-manager-CJbIhckt.js";
import "./option-C8qYanYH.js";
import { t as C } from "./announce-DxxaToE8.js";
import { t as w } from "./section-heading-styles-DkCw_K2W.js";
//#region node_modules/tinyqueue/index.js
var T = class {
	constructor(e = [], t = (e, t) => e < t ? -1 : +(e > t)) {
		if (this.data = e, this.length = this.data.length, this.compare = t, this.length > 0) for (let e = (this.length >> 1) - 1; e >= 0; e--) this._down(e);
	}
	push(e) {
		this.data.push(e), this._up(this.length++);
	}
	pop() {
		if (this.length === 0) return;
		let e = this.data[0], t = this.data.pop();
		return --this.length > 0 && (this.data[0] = t, this._down(0)), e;
	}
	peek() {
		return this.data[0];
	}
	_up(e) {
		let { data: t, compare: n } = this, r = t[e];
		for (; e > 0;) {
			let i = e - 1 >> 1, a = t[i];
			if (n(r, a) >= 0) break;
			t[e] = a, e = i;
		}
		t[e] = r;
	}
	_down(e) {
		let { data: t, compare: n } = this, r = this.length >> 1, i = t[e];
		for (; e < r;) {
			let r = (e << 1) + 1, a = r + 1;
			if (a < this.length && n(t[a], t[r]) < 0 && (r = a), n(t[r], i) >= 0) break;
			t[e] = t[r], e = r;
		}
		t[e] = i;
	}
}, E = 32;
function D(e, t = 1, n = !1) {
	let r = Infinity, i = Infinity, a = -Infinity, o = -Infinity;
	for (let [t, n] of e[0]) t < r && (r = t), n < i && (i = n), t > a && (a = t), n > o && (o = n);
	let s = a - r, c = o - i, l = Math.max(t, Math.min(s, c));
	if (l === t) {
		let e = [r, i];
		return e.distance = 0, e;
	}
	let u = 0;
	for (let t of e) u += t.length;
	let d = new Float64Array(u * 2), f = [], p = 0;
	for (let t of e) {
		for (let e = 0; e < t.length; e++) d[p++] = t[e][0], d[p++] = t[e][1];
		f.push(p);
	}
	let m = ee(d, f), h = new T([], (e, t) => t.max - e.max), g = A(d, f, m), _ = new O(r + s / 2, i + c / 2, 0, d, f, m, -Infinity, null);
	_.d > g.d && (g = _);
	let v = 2;
	function y(e, r, i, a) {
		let o = new O(e, r, i, d, f, m, g.d - Math.max(0, i * Math.SQRT2 - t), a);
		v++, o.max > g.d + t && h.push(o), o.d > g.d && (g = o, n && console.log(`found best ${Math.round(1e4 * o.d) / 1e4} after ${v} probes`));
	}
	let b = l / 2;
	for (let e = r; e < a; e += l) for (let t = i; t < o; t += l) y(e + b, t + b, b, null);
	for (; h.length;) {
		let e = h.pop();
		if (e.max - g.d <= t) break;
		b = e.h / 2, y(e.x - b, e.y - b, b, e), y(e.x + b, e.y - b, b, e), y(e.x - b, e.y + b, b, e), y(e.x + b, e.y + b, b, e);
	}
	n && console.log(`num probes: ${v}\nbest distance: ${g.d}`);
	let x = [g.x, g.y];
	return x.distance = g.d, x;
}
function O(e, t, n, r, i, a, o, s) {
	this.x = e, this.y = t, this.h = n, this.nsx1 = 0, this.nsy1 = 0, this.nsx2 = 0, this.nsy2 = 0, this.d = k(this, r, i, a, o, s), this.max = this.d + n * Math.SQRT2;
}
function k(e, t, n, r, i, a) {
	let o = e.x, s = e.y, c = !1, l = Infinity, u = i > 0 ? i * i : -1;
	if (a !== null && (e.nsx1 = a.nsx1, e.nsy1 = a.nsy1, e.nsx2 = a.nsx2, e.nsy2 = a.nsy2, l = j(o, s, a.nsx1, a.nsy1, a.nsx2, a.nsy2), l <= u)) return i;
	let d = E * 2, f = n.length, p = 0, m = 0;
	for (let a = 0; a < f; a++) {
		let f = n[a], h = t[f - 2], g = t[f - 1];
		for (let n = m; n < f; n += d, p += 4) {
			let a = n + d;
			a > f && (a = f);
			let m = r[p], _ = r[p + 1], v = r[p + 2], y = r[p + 3], b = o < m ? m - o : o > v ? o - v : 0, x = s < _ ? _ - s : s > y ? s - y : 0, S = b * b + x * x >= l, C = s < _ || s >= y || o > v;
			if (S && C) {
				h = t[a - 2], g = t[a - 1];
				continue;
			}
			for (let r = n; r < a; r += 2) {
				let n = t[r], a = t[r + 1];
				if (!C && a > s != g > s && o < (h - n) * (s - a) / (g - a) + n && (c = !c), !S) {
					let t = j(o, s, n, a, h, g);
					if (t < l && (l = t, e.nsx1 = n, e.nsy1 = a, e.nsx2 = h, e.nsy2 = g, l <= u)) return i;
				}
				h = n, g = a;
			}
		}
		m = f;
	}
	return l === 0 ? 0 : (c ? 1 : -1) * Math.sqrt(l);
}
function ee(e, t) {
	let n = E * 2, r = 0, i = 0;
	for (let e = 0; e < t.length; e++) r += Math.ceil((t[e] - i) / n), i = t[e];
	let a = new Float64Array(r * 4), o = 0;
	i = 0;
	for (let r = 0; r < t.length; r++) {
		let s = t[r];
		for (let t = i; t < s; t += n, o += 4) {
			let r = t + n < s ? t + n : s, c = t === i ? s - 2 : t - 2, l = e[c], u = e[c + 1], d = l, f = u;
			for (let n = t; n < r; n += 2) {
				let t = e[n], r = e[n + 1];
				t < l ? l = t : t > d && (d = t), r < u ? u = r : r > f && (f = r);
			}
			a[o] = l, a[o + 1] = u, a[o + 2] = d, a[o + 3] = f;
		}
		i = s;
	}
	return a;
}
function A(e, t, n) {
	let r = 0, i = 0, a = 0, o = t[0];
	for (let t = 0, n = o - 2; t < o; n = t, t += 2) {
		let o = e[t], s = e[t + 1], c = e[n], l = e[n + 1], u = o * l - c * s;
		i += (o + c) * u, a += (s + l) * u, r += u * 3;
	}
	let s = new O(i / r, a / r, 0, e, t, n, -Infinity, null);
	return r === 0 || s.d < 0 ? new O(e[0], e[1], 0, e, t, n, -Infinity, null) : s;
}
function j(e, t, n, r, i, a) {
	let o = i - n, s = a - r;
	if (o !== 0 || s !== 0) {
		let c = ((e - n) * o + (t - r) * s) / (o * o + s * s);
		c > 1 ? (n = i, r = a) : c > 0 && (n += o * c, r += s * c);
	}
	return o = e - n, s = t - r, o * o + s * s;
}
//#endregion
//#region node_modules/d3-delaunay/src/path.js
var te = 1e-6, M = class {
	constructor() {
		this._x0 = this._y0 = this._x1 = this._y1 = null, this._ = "";
	}
	moveTo(e, t) {
		this._ += `M${this._x0 = this._x1 = +e},${this._y0 = this._y1 = +t}`;
	}
	closePath() {
		this._x1 !== null && (this._x1 = this._x0, this._y1 = this._y0, this._ += "Z");
	}
	lineTo(e, t) {
		this._ += `L${this._x1 = +e},${this._y1 = +t}`;
	}
	arc(e, t, n) {
		e = +e, t = +t, n = +n;
		let r = e + n, i = t;
		if (n < 0) throw Error("negative radius");
		this._x1 === null ? this._ += `M${r},${i}` : (Math.abs(this._x1 - r) > te || Math.abs(this._y1 - i) > te) && (this._ += "L" + r + "," + i), n && (this._ += `A${n},${n},0,1,1,${e - n},${t}A${n},${n},0,1,1,${this._x1 = r},${this._y1 = i}`);
	}
	rect(e, t, n, r) {
		this._ += `M${this._x0 = this._x1 = +e},${this._y0 = this._y1 = +t}h${+n}v${+r}h${-n}Z`;
	}
	value() {
		return this._ || null;
	}
}, N = class {
	constructor() {
		this._ = [];
	}
	moveTo(e, t) {
		this._.push([e, t]);
	}
	closePath() {
		this._.push(this._[0].slice());
	}
	lineTo(e, t) {
		this._.push([e, t]);
	}
	value() {
		return this._.length ? this._ : null;
	}
}, ne = class {
	constructor(e, [t, n, r, i] = [
		0,
		0,
		960,
		500
	]) {
		if (!((r = +r) >= (t = +t)) || !((i = +i) >= (n = +n))) throw Error("invalid bounds");
		this.delaunay = e, this._circumcenters = new Float64Array(e.points.length * 2), this.vectors = new Float64Array(e.points.length * 2), this.xmax = r, this.xmin = t, this.ymax = i, this.ymin = n, this._init();
	}
	update() {
		return this.delaunay.update(), this._init(), this;
	}
	_init() {
		let { delaunay: { points: e, hull: t, triangles: n }, vectors: r } = this, i, a, o = this.circumcenters = this._circumcenters.subarray(0, n.length / 3 * 2);
		for (let r = 0, s = 0, c = n.length, l, u; r < c; r += 3, s += 2) {
			let c = n[r] * 2, d = n[r + 1] * 2, f = n[r + 2] * 2, p = e[c], m = e[c + 1], h = e[d], g = e[d + 1], _ = e[f], v = e[f + 1], y = h - p, b = g - m, x = _ - p, S = v - m, C = (y * S - b * x) * 2;
			if (Math.abs(C) < 1e-9) {
				if (i === void 0) {
					i = a = 0;
					for (let n of t) i += e[n * 2], a += e[n * 2 + 1];
					i /= t.length, a /= t.length;
				}
				let n = 1e9 * Math.sign((i - p) * S - (a - m) * x);
				l = (p + _) / 2 - n * S, u = (m + v) / 2 + n * x;
			} else {
				let e = 1 / C, t = y * y + b * b, n = x * x + S * S;
				l = p + (S * t - b * n) * e, u = m + (y * n - x * t) * e;
			}
			o[s] = l, o[s + 1] = u;
		}
		let s = t[t.length - 1], c, l = s * 4, u, d = e[2 * s], f, p = e[2 * s + 1];
		r.fill(0);
		for (let n = 0; n < t.length; ++n) s = t[n], c = l, u = d, f = p, l = s * 4, d = e[2 * s], p = e[2 * s + 1], r[c + 2] = r[l] = f - p, r[c + 3] = r[l + 1] = d - u;
	}
	render(e) {
		let t = e == null ? e = new M() : void 0, { delaunay: { halfedges: n, inedges: r, hull: i }, circumcenters: a, vectors: o } = this;
		if (i.length <= 1) return null;
		for (let t = 0, r = n.length; t < r; ++t) {
			let r = n[t];
			if (r < t) continue;
			let i = Math.floor(t / 3) * 2, o = Math.floor(r / 3) * 2, s = a[i], c = a[i + 1], l = a[o], u = a[o + 1];
			this._renderSegment(s, c, l, u, e);
		}
		let s, c = i[i.length - 1];
		for (let t = 0; t < i.length; ++t) {
			s = c, c = i[t];
			let n = Math.floor(r[c] / 3) * 2, l = a[n], u = a[n + 1], d = s * 4, f = this._project(l, u, o[d + 2], o[d + 3]);
			f && this._renderSegment(l, u, f[0], f[1], e);
		}
		return t && t.value();
	}
	renderBounds(e) {
		let t = e == null ? e = new M() : void 0;
		return e.rect(this.xmin, this.ymin, this.xmax - this.xmin, this.ymax - this.ymin), t && t.value();
	}
	renderCell(e, t) {
		let n = t == null ? t = new M() : void 0, r = this._clip(e);
		if (r === null || !r.length) return;
		t.moveTo(r[0], r[1]);
		let i = r.length;
		for (; r[0] === r[i - 2] && r[1] === r[i - 1] && i > 1;) i -= 2;
		for (let e = 2; e < i; e += 2) (r[e] !== r[e - 2] || r[e + 1] !== r[e - 1]) && t.lineTo(r[e], r[e + 1]);
		return t.closePath(), n && n.value();
	}
	*cellPolygons() {
		let { delaunay: { points: e } } = this;
		for (let t = 0, n = e.length / 2; t < n; ++t) {
			let e = this.cellPolygon(t);
			e && (e.index = t, yield e);
		}
	}
	cellPolygon(e) {
		let t = new N();
		return this.renderCell(e, t), t.value();
	}
	_renderSegment(e, t, n, r, i) {
		let a, o = this._regioncode(e, t), s = this._regioncode(n, r);
		o === 0 && s === 0 ? (i.moveTo(e, t), i.lineTo(n, r)) : (a = this._clipSegment(e, t, n, r, o, s)) && (i.moveTo(a[0], a[1]), i.lineTo(a[2], a[3]));
	}
	contains(e, t, n) {
		return (t = +t, t !== t) || (n = +n, n !== n) ? !1 : this.delaunay._step(e, t, n) === e;
	}
	*neighbors(e) {
		let t = this._clip(e);
		if (t) for (let n of this.delaunay.neighbors(e)) {
			let e = this._clip(n);
			if (e) {
				loop: for (let r = 0, i = t.length; r < i; r += 2) for (let a = 0, o = e.length; a < o; a += 2) if (t[r] === e[a] && t[r + 1] === e[a + 1] && t[(r + 2) % i] === e[(a + o - 2) % o] && t[(r + 3) % i] === e[(a + o - 1) % o]) {
					yield n;
					break loop;
				}
			}
		}
	}
	_cell(e) {
		let { circumcenters: t, delaunay: { inedges: n, halfedges: r, triangles: i } } = this, a = n[e];
		if (a === -1) return null;
		let o = [], s = a;
		do {
			let n = Math.floor(s / 3);
			if (o.push(t[n * 2], t[n * 2 + 1]), s = s % 3 == 2 ? s - 2 : s + 1, i[s] !== e) break;
			s = r[s];
		} while (s !== a && s !== -1);
		return o;
	}
	_clip(e) {
		if (e === 0 && this.delaunay.hull.length === 1) return [
			this.xmax,
			this.ymin,
			this.xmax,
			this.ymax,
			this.xmin,
			this.ymax,
			this.xmin,
			this.ymin
		];
		let t = this._cell(e);
		if (t === null) return null;
		let { vectors: n } = this, r = e * 4;
		return this._simplify(n[r] || n[r + 1] ? this._clipInfinite(e, t, n[r], n[r + 1], n[r + 2], n[r + 3]) : this._clipFinite(e, t));
	}
	_clipFinite(e, t) {
		let n = t.length, r = null, i, a, o = t[n - 2], s = t[n - 1], c, l = this._regioncode(o, s), u, d = 0;
		for (let f = 0; f < n; f += 2) if (i = o, a = s, o = t[f], s = t[f + 1], c = l, l = this._regioncode(o, s), c === 0 && l === 0) u = d, d = 0, r ? r.push(o, s) : r = [o, s];
		else {
			let t, n, f, p, m;
			if (c === 0) {
				if ((t = this._clipSegment(i, a, o, s, c, l)) === null) continue;
				[n, f, p, m] = t;
			} else {
				if ((t = this._clipSegment(o, s, i, a, l, c)) === null) continue;
				[p, m, n, f] = t, u = d, d = this._edgecode(n, f), u && d && this._edge(e, u, d, r, r.length), r ? r.push(n, f) : r = [n, f];
			}
			u = d, d = this._edgecode(p, m), u && d && this._edge(e, u, d, r, r.length), r ? r.push(p, m) : r = [p, m];
		}
		if (r) u = d, d = this._edgecode(r[0], r[1]), u && d && this._edge(e, u, d, r, r.length);
		else if (this.contains(e, (this.xmin + this.xmax) / 2, (this.ymin + this.ymax) / 2)) return [
			this.xmax,
			this.ymin,
			this.xmax,
			this.ymax,
			this.xmin,
			this.ymax,
			this.xmin,
			this.ymin
		];
		return r;
	}
	_clipSegment(e, t, n, r, i, a) {
		let o = i < a;
		for (o && ([e, t, n, r, i, a] = [
			n,
			r,
			e,
			t,
			a,
			i
		]);;) {
			if (i === 0 && a === 0) return o ? [
				n,
				r,
				e,
				t
			] : [
				e,
				t,
				n,
				r
			];
			if (i & a) return null;
			let s, c, l = i || a;
			l & 8 ? (s = e + (n - e) * (this.ymax - t) / (r - t), c = this.ymax) : l & 4 ? (s = e + (n - e) * (this.ymin - t) / (r - t), c = this.ymin) : l & 2 ? (c = t + (r - t) * (this.xmax - e) / (n - e), s = this.xmax) : (c = t + (r - t) * (this.xmin - e) / (n - e), s = this.xmin), i ? (e = s, t = c, i = this._regioncode(e, t)) : (n = s, r = c, a = this._regioncode(n, r));
		}
	}
	_clipInfinite(e, t, n, r, i, a) {
		let o = Array.from(t), s;
		if ((s = this._project(o[0], o[1], n, r)) && o.unshift(s[0], s[1]), (s = this._project(o[o.length - 2], o[o.length - 1], i, a)) && o.push(s[0], s[1]), o = this._clipFinite(e, o)) for (let t = 0, n = o.length, r, i = this._edgecode(o[n - 2], o[n - 1]); t < n; t += 2) r = i, i = this._edgecode(o[t], o[t + 1]), r && i && (t = this._edge(e, r, i, o, t), n = o.length);
		else this.contains(e, (this.xmin + this.xmax) / 2, (this.ymin + this.ymax) / 2) && (o = [
			this.xmin,
			this.ymin,
			this.xmax,
			this.ymin,
			this.xmax,
			this.ymax,
			this.xmin,
			this.ymax
		]);
		return o;
	}
	_edge(e, t, n, r, i) {
		for (; t !== n;) {
			let n, a;
			switch (t) {
				case 5:
					t = 4;
					continue;
				case 4:
					t = 6, n = this.xmax, a = this.ymin;
					break;
				case 6:
					t = 2;
					continue;
				case 2:
					t = 10, n = this.xmax, a = this.ymax;
					break;
				case 10:
					t = 8;
					continue;
				case 8:
					t = 9, n = this.xmin, a = this.ymax;
					break;
				case 9:
					t = 1;
					continue;
				case 1:
					t = 5, n = this.xmin, a = this.ymin;
					break;
			}
			(r[i] !== n || r[i + 1] !== a) && this.contains(e, n, a) && (r.splice(i, 0, n, a), i += 2);
		}
		return i;
	}
	_project(e, t, n, r) {
		let i = Infinity, a, o, s;
		if (r < 0) {
			if (t <= this.ymin) return null;
			(a = (this.ymin - t) / r) < i && (s = this.ymin, o = e + (i = a) * n);
		} else if (r > 0) {
			if (t >= this.ymax) return null;
			(a = (this.ymax - t) / r) < i && (s = this.ymax, o = e + (i = a) * n);
		}
		if (n > 0) {
			if (e >= this.xmax) return null;
			(a = (this.xmax - e) / n) < i && (o = this.xmax, s = t + (i = a) * r);
		} else if (n < 0) {
			if (e <= this.xmin) return null;
			(a = (this.xmin - e) / n) < i && (o = this.xmin, s = t + (i = a) * r);
		}
		return [o, s];
	}
	_edgecode(e, t) {
		return (e === this.xmin ? 1 : e === this.xmax ? 2 : 0) | (t === this.ymin ? 4 : t === this.ymax ? 8 : 0);
	}
	_regioncode(e, t) {
		return (e < this.xmin ? 1 : e > this.xmax ? 2 : 0) | (t < this.ymin ? 4 : t > this.ymax ? 8 : 0);
	}
	_simplify(e) {
		if (e && e.length > 4) {
			for (let t = 0; t < e.length; t += 2) {
				let n = (t + 2) % e.length, r = (t + 4) % e.length;
				(e[t] === e[n] && e[n] === e[r] || e[t + 1] === e[n + 1] && e[n + 1] === e[r + 1]) && (e.splice(n, 2), t -= 2);
			}
			e.length || (e = null);
		}
		return e;
	}
}, re = 2 * Math.PI, P = Math.pow;
function ie(e) {
	return e[0];
}
function ae(e) {
	return e[1];
}
function oe(e) {
	let { triangles: t, coords: n } = e;
	for (let e = 0; e < t.length; e += 3) {
		let r = 2 * t[e], i = 2 * t[e + 1], a = 2 * t[e + 2];
		if ((n[a] - n[r]) * (n[i + 1] - n[r + 1]) - (n[i] - n[r]) * (n[a + 1] - n[r + 1]) > 1e-10) return !1;
	}
	return !0;
}
function se(e, t, n) {
	return [e + Math.sin(e + t) * n, t + Math.cos(e - t) * n];
}
var ce = class e {
	static from(t, n = ie, r = ae, i) {
		return new e("length" in t ? le(t, n, r, i) : Float64Array.from(ue(t, n, r, i)));
	}
	constructor(e) {
		this._delaunator = new d(e), this.inedges = new Int32Array(e.length / 2), this._hullIndex = new Int32Array(e.length / 2), this.points = this._delaunator.coords, this._init();
	}
	update() {
		return this._delaunator.update(), this._init(), this;
	}
	_init() {
		let e = this._delaunator, t = this.points;
		if (e.hull && e.hull.length > 2 && oe(e)) {
			this.collinear = Int32Array.from({ length: t.length / 2 }, (e, t) => t).sort((e, n) => t[2 * e] - t[2 * n] || t[2 * e + 1] - t[2 * n + 1]);
			let e = this.collinear[0], n = this.collinear[this.collinear.length - 1], r = [
				t[2 * e],
				t[2 * e + 1],
				t[2 * n],
				t[2 * n + 1]
			], i = 1e-8 * Math.hypot(r[3] - r[1], r[2] - r[0]);
			for (let e = 0, n = t.length / 2; e < n; ++e) {
				let n = se(t[2 * e], t[2 * e + 1], i);
				t[2 * e] = n[0], t[2 * e + 1] = n[1];
			}
			this._delaunator = new d(t);
		} else delete this.collinear;
		let n = this.halfedges = this._delaunator.halfedges, r = this.hull = this._delaunator.hull, i = this.triangles = this._delaunator.triangles, a = this.inedges.fill(-1), o = this._hullIndex.fill(-1);
		for (let e = 0, t = n.length; e < t; ++e) {
			let t = i[e % 3 == 2 ? e - 2 : e + 1];
			(n[e] === -1 || a[t] === -1) && (a[t] = e);
		}
		for (let e = 0, t = r.length; e < t; ++e) o[r[e]] = e;
		r.length <= 2 && r.length > 0 && (this.triangles = new Int32Array(3).fill(-1), this.halfedges = new Int32Array(3).fill(-1), this.triangles[0] = r[0], a[r[0]] = 1, r.length === 2 && (a[r[1]] = 0, this.triangles[1] = r[1], this.triangles[2] = r[1]));
	}
	voronoi(e) {
		return new ne(this, e);
	}
	*neighbors(e) {
		let { inedges: t, hull: n, _hullIndex: r, halfedges: i, triangles: a, collinear: o } = this;
		if (o) {
			let t = o.indexOf(e);
			t > 0 && (yield o[t - 1]), t < o.length - 1 && (yield o[t + 1]);
			return;
		}
		let s = t[e];
		if (s === -1) return;
		let c = s, l = -1;
		do {
			if (yield l = a[c], c = c % 3 == 2 ? c - 2 : c + 1, a[c] !== e) return;
			if (c = i[c], c === -1) {
				let t = n[(r[e] + 1) % n.length];
				t !== l && (yield t);
				return;
			}
		} while (c !== s);
	}
	find(e, t, n = 0) {
		if ((e = +e, e !== e) || (t = +t, t !== t)) return -1;
		let r = n, i;
		for (; (i = this._step(n, e, t)) >= 0 && i !== n && i !== r;) n = i;
		return i;
	}
	_step(e, t, n) {
		let { inedges: r, hull: i, _hullIndex: a, halfedges: o, triangles: s, points: c } = this;
		if (r[e] === -1 || !c.length) return (e + 1) % (c.length >> 1);
		let l = e, u = P(t - c[e * 2], 2) + P(n - c[e * 2 + 1], 2), d = r[e], f = d;
		do {
			let r = s[f], d = P(t - c[r * 2], 2) + P(n - c[r * 2 + 1], 2);
			if (d < u && (u = d, l = r), f = f % 3 == 2 ? f - 2 : f + 1, s[f] !== e) break;
			if (f = o[f], f === -1) {
				if (f = i[(a[e] + 1) % i.length], f !== r && P(t - c[f * 2], 2) + P(n - c[f * 2 + 1], 2) < u) return f;
				break;
			}
		} while (f !== d);
		return l;
	}
	render(e) {
		let t = e == null ? e = new M() : void 0, { points: n, halfedges: r, triangles: i } = this;
		for (let t = 0, a = r.length; t < a; ++t) {
			let a = r[t];
			if (a < t) continue;
			let o = i[t] * 2, s = i[a] * 2;
			e.moveTo(n[o], n[o + 1]), e.lineTo(n[s], n[s + 1]);
		}
		return this.renderHull(e), t && t.value();
	}
	renderPoints(e, t) {
		t === void 0 && (!e || typeof e.moveTo != "function") && (t = e, e = null), t = t == null ? 2 : +t;
		let n = e == null ? e = new M() : void 0, { points: r } = this;
		for (let n = 0, i = r.length; n < i; n += 2) {
			let i = r[n], a = r[n + 1];
			e.moveTo(i + t, a), e.arc(i, a, t, 0, re);
		}
		return n && n.value();
	}
	renderHull(e) {
		let t = e == null ? e = new M() : void 0, { hull: n, points: r } = this, i = n[0] * 2, a = n.length;
		e.moveTo(r[i], r[i + 1]);
		for (let t = 1; t < a; ++t) {
			let i = 2 * n[t];
			e.lineTo(r[i], r[i + 1]);
		}
		return e.closePath(), t && t.value();
	}
	hullPolygon() {
		let e = new N();
		return this.renderHull(e), e.value();
	}
	renderTriangle(e, t) {
		let n = t == null ? t = new M() : void 0, { points: r, triangles: i } = this, a = i[e *= 3] * 2, o = i[e + 1] * 2, s = i[e + 2] * 2;
		return t.moveTo(r[a], r[a + 1]), t.lineTo(r[o], r[o + 1]), t.lineTo(r[s], r[s + 1]), t.closePath(), n && n.value();
	}
	*trianglePolygons() {
		let { triangles: e } = this;
		for (let t = 0, n = e.length / 3; t < n; ++t) yield this.trianglePolygon(t);
	}
	trianglePolygon(e) {
		let t = new N();
		return this.renderTriangle(e, t), t.value();
	}
};
function le(e, t, n, r) {
	let i = e.length, a = new Float64Array(i * 2);
	for (let o = 0; o < i; ++o) {
		let i = e[o];
		a[o * 2] = t.call(r, i, o, e), a[o * 2 + 1] = n.call(r, i, o, e);
	}
	return a;
}
function* ue(e, t, n, r) {
	let i = 0;
	for (let a of e) yield t.call(r, a, i, e), yield n.call(r, a, i, e), ++i;
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/geometry/flat.js
function de(e) {
	return e.coords.length >>> 1;
}
function F(e, t) {
	return [e.ringStart[t], e.ringStart[t + 1]];
}
function fe(e) {
	if (e.length < 2) return !1;
	let t = e[0], n = e[e.length - 1];
	return t[0] === n[0] && t[1] === n[1];
}
var pe = class extends Error {};
function me(e) {
	let t = [], n = [], r = [], i = [], a = [], o = 0, s = 0, c = 0;
	for (let l of e) {
		let e = l.geometry;
		r.push(c), i.push(e.type);
		let u = e.type === "Polygon" ? [e.coordinates] : e.coordinates;
		for (let e of u) {
			if (n.push(s), c++, e.length === 0) throw new pe("polygon with no rings");
			for (let n of e) {
				let e = fe(n) ? n.length - 1 : n.length;
				if (e < 3) throw new pe(`ring with ${e} distinct vertices (need >= 3)`);
				t.push(o), s++;
				for (let t = 0; t < e; t++) {
					let e = n[t], r = e[0], i = e[1];
					if (!Number.isFinite(r) || !Number.isFinite(i)) throw new pe(`non-finite coordinate [${r}, ${i}]`);
					a.push(r, i), o++;
				}
			}
		}
	}
	return t.push(o), n.push(s), r.push(c), {
		coords: Float64Array.from(a),
		ringStart: Uint32Array.from(t),
		ringCount: s,
		polyStart: Uint32Array.from(n),
		polyCount: c,
		featStart: Uint32Array.from(r),
		featCount: e.length,
		featType: i
	};
}
function he(e) {
	let t = [];
	for (let n = 0; n < e.featCount; n++) {
		let r = [];
		for (let t = e.featStart[n]; t < e.featStart[n + 1]; t++) {
			let n = [];
			for (let r = e.polyStart[t]; r < e.polyStart[t + 1]; r++) {
				let [t, i] = F(e, r), a = Array(i - t + 1);
				for (let n = t; n < i; n++) a[n - t] = [e.coords[2 * n], e.coords[2 * n + 1]];
				a[i - t] = a[0].slice(), n.push(a);
			}
			r.push(n);
		}
		t.push(e.featType[n] === "Polygon" ? {
			type: "Polygon",
			coordinates: r[0]
		} : {
			type: "MultiPolygon",
			coordinates: r
		});
	}
	return t;
}
function ge(e) {
	return {
		...e,
		coords: e.coords.slice()
	};
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/geometry/area.js
function I(e, t) {
	let [n, r] = F(e, t);
	if (r - n < 3) return 0;
	let i = e.coords[2 * n], a = e.coords[2 * n + 1], o = 0, s = e.coords[2 * (r - 1)] - i, c = e.coords[2 * (r - 1) + 1] - a;
	for (let t = n; t < r; t++) {
		let n = e.coords[2 * t] - i, r = e.coords[2 * t + 1] - a;
		o += s * r - n * c, s = n, c = r;
	}
	return o / 2;
}
function _e(e, t) {
	let n = 0;
	for (let r = e.featStart[t]; r < e.featStart[t + 1]; r++) {
		let t = e.polyStart[r], i = e.polyStart[r + 1], a = 0, o = 0, s = -1, c = t;
		for (let n = t; n < i; n++) {
			let t = Math.abs(I(e, n));
			t > s && (s = t, c = n);
		}
		for (let n = t; n < i; n++) {
			let t = Math.abs(I(e, n));
			n === c ? a += t : o += t;
		}
		n += Math.max(0, a - o);
	}
	return n;
}
function ve(e, t) {
	let n = e.polyStart[t], r = e.polyStart[t + 1], i = -1, a = n;
	for (let t = n; t < r; t++) {
		let n = Math.abs(I(e, t));
		n > i && (i = n, a = t);
	}
	let o = 0, s = 0;
	for (let t = n; t < r; t++) {
		let n = Math.abs(I(e, t));
		t === a ? o += n : s += n;
	}
	return Math.max(0, o - s);
}
function ye(e, t) {
	let n = e.polyStart[t], r = e.polyStart[t + 1], i = -1, a = n;
	for (let t = n; t < r; t++) {
		let n = Math.abs(I(e, t));
		n > i && (i = n, a = t);
	}
	let o = 0, s = 0, c = 0;
	for (let t = n; t < r; t++) {
		let [n, r] = F(e, t), i = e.coords[2 * n], l = e.coords[2 * n + 1], u = 0, d = 0, f = 0, p = e.coords[2 * (r - 1)] - i, m = e.coords[2 * (r - 1) + 1] - l;
		for (let t = n; t < r; t++) {
			let n = e.coords[2 * t] - i, r = e.coords[2 * t + 1] - l, a = p * r - n * m;
			u += a, d += (p + n) * a, f += (m + r) * a, p = n, m = r;
		}
		if (u === 0) continue;
		let h = (t === a ? 1 : -1) * Math.abs(u / 2);
		o += (d / (3 * u) + i) * h, s += (f / (3 * u) + l) * h, c += h;
	}
	if (c !== 0 && Number.isFinite(o / c) && Number.isFinite(s / c)) return [o / c, s / c];
	let [l, u] = F(e, n), d = 0, f = 0;
	for (let t = l; t < u; t++) d += e.coords[2 * t], f += e.coords[2 * t + 1];
	let p = u - l;
	return p > 0 ? [d / p, f / p] : [0, 0];
}
function L(e) {
	let t = new Float64Array(e.featCount);
	for (let n = 0; n < e.featCount; n++) t[n] = _e(e, n);
	return t;
}
function be(e, t) {
	let n = 0, r = 0, i = 0;
	for (let a = e.featStart[t]; a < e.featStart[t + 1]; a++) {
		let t = e.polyStart[a], o = e.polyStart[a + 1], s = -1, c = t;
		for (let n = t; n < o; n++) {
			let t = Math.abs(I(e, n));
			t > s && (s = t, c = n);
		}
		for (let a = t; a < o; a++) {
			let [t, o] = F(e, a), s = e.coords[2 * t], l = e.coords[2 * t + 1], u = 0, d = 0, f = 0, p = e.coords[2 * (o - 1)] - s, m = e.coords[2 * (o - 1) + 1] - l;
			for (let n = t; n < o; n++) {
				let t = e.coords[2 * n] - s, r = e.coords[2 * n + 1] - l, i = p * r - t * m;
				u += i, d += (p + t) * i, f += (m + r) * i, p = t, m = r;
			}
			if (u === 0) continue;
			let h = u / 2, g = (a === c ? 1 : -1) * Math.abs(h);
			n += (d / (3 * u) + s) * g, r += (f / (3 * u) + l) * g, i += g;
		}
	}
	if (i !== 0 && Number.isFinite(n / i) && Number.isFinite(r / i)) return [n / i, r / i];
	let a = 0, o = 0, s = 0, c = e.featStart[t], l = e.featStart[t + 1];
	for (let t = c; t < l; t++) for (let n = e.polyStart[t]; n < e.polyStart[t + 1]; n++) {
		let [t, r] = F(e, n);
		for (let n = t; n < r; n++) a += e.coords[2 * n], o += e.coords[2 * n + 1], s++;
	}
	return s > 0 ? [a / s, o / s] : [0, 0];
}
function xe(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	for (let a = 0; a < e.coords.length; a += 2) {
		let o = e.coords[a], s = e.coords[a + 1];
		o < t && (t = o), o > r && (r = o), s < n && (n = s), s > i && (i = s);
	}
	return [
		t,
		n,
		r,
		i
	];
}
function Se(e, t, n, r) {
	for (let i = 0; i < e.coords.length; i += 2) e.coords[i] = e.coords[i] * t + n, e.coords[i + 1] = e.coords[i + 1] * t + r;
}
function Ce(e, t) {
	let n = 0, r = 0, i = 0;
	for (let a = 0; a < e.featCount; a++) {
		let [o, s] = be(e, a), c = t[a] ?? 1;
		n += o * c, r += s * c, i += c;
	}
	return i > 0 ? [n / i, r / i] : [0, 0];
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/topology/densify.js
function we(e, t, n, r) {
	return e < n || e === n && t <= r;
}
function Te(e) {
	let [t, n, r, i] = xe(e);
	return Math.hypot(r - t, i - n) / 400;
}
function Ee(e, t, n = 6) {
	if (!(t > 0)) return {
		geometry: e,
		inserted: 0,
		spacing: t
	};
	let r = e.coords.length >>> 1, i = Math.max(r * n, 4096), a = 0;
	for (let n = 0; n < e.ringCount; n++) {
		let [r, i] = F(e, n);
		for (let n = r; n < i; n++) {
			let o = n + 1 < i ? n + 1 : r;
			a += 1 + De(e, n, o, t);
		}
	}
	if (a === r) return {
		geometry: e,
		inserted: 0,
		spacing: t
	};
	if (a > i) return Ee(e, a / i * t, n);
	let o = new Float64Array(a * 2), s = new Uint32Array(e.ringCount + 1), c = 0;
	for (let n = 0; n < e.ringCount; n++) {
		s[n] = c;
		let [r, i] = F(e, n);
		for (let n = r; n < i; n++) {
			let a = n + 1 < i ? n + 1 : r, s = e.coords[2 * n], l = e.coords[2 * n + 1], u = e.coords[2 * a], d = e.coords[2 * a + 1];
			o[2 * c] = s, o[2 * c + 1] = l, c++;
			let f = De(e, n, a, t);
			if (f === 0) continue;
			let p = we(s, l, u, d), m = p ? s : u, h = p ? l : d, g = p ? u : s, _ = p ? d : l;
			for (let e = 1; e <= f; e++) {
				let t = (p ? e : f + 1 - e) / (f + 1);
				o[2 * c] = m + (g - m) * t, o[2 * c + 1] = h + (_ - h) * t, c++;
			}
		}
	}
	return s[e.ringCount] = c, {
		geometry: {
			...e,
			coords: o,
			ringStart: s
		},
		inserted: c - r,
		spacing: t
	};
}
function De(e, t, n, r) {
	let i = e.coords[2 * n] - e.coords[2 * t], a = e.coords[2 * n + 1] - e.coords[2 * t + 1], o = Math.hypot(i, a);
	return o <= r ? 0 : Math.ceil(o / r) - 1;
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/io/validate.js
var Oe = class extends Error {};
function ke(e) {
	if (!e || e.type !== "FeatureCollection") throw new Oe("input must be a GeoJSON FeatureCollection");
	let t = e;
	if (!Array.isArray(t.features)) throw new Oe("FeatureCollection has no features array");
	let n = [], r = [];
	return t.features.forEach((e, t) => {
		let i = e.geometry;
		if (!i) {
			r.push(t);
			return;
		}
		if (i.type === "Polygon" || i.type === "MultiPolygon") {
			n.push({
				feature: e,
				index: t
			});
			return;
		}
		if (i.type === "GeometryCollection") {
			let r = i.geometries;
			if (r.length > 0 && r.every((e) => e.type === "Polygon" || e.type === "MultiPolygon")) {
				let i = r.flatMap((e) => e.type === "Polygon" ? [e.coordinates] : e.coordinates);
				n.push({
					feature: {
						...e,
						geometry: {
							type: "MultiPolygon",
							coordinates: i
						}
					},
					index: t
				});
				return;
			}
		}
		r.push(t);
	}), {
		collection: t,
		area: n,
		passthrough: r
	};
}
function Ae(e) {
	let [t, n, r, i] = e;
	return t >= -180.5 && r <= 180.5 && n >= -90.5 && i <= 90.5;
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/io/values.js
function je(e, t, n) {
	return typeof e == "function" ? e(t, n) : t.properties ? t.properties[e] : void 0;
}
function Me(e, t, n, r) {
	let i = e.length, a = new Float64Array(i), o = Array(i).fill(!1), s = Array(i).fill(!1), c = [], l = 0, u = 0;
	for (let n = 0; n < i; n++) {
		let i = je(t, e[n], n), s;
		if (s = i == null || i === "" ? NaN : typeof i == "number" ? i : typeof i == "string" ? Number(i) : NaN, Number.isFinite(s)) {
			if (s < 0) {
				if (r === "error") throw new Oe(`feature ${n} has negative value ${s}; cartograms need non-negative values (set negative: 'clamp' to floor at zero)`);
				c.push(`feature ${n}: negative value ${s} clamped to 0`), s = 0;
			}
			a[n] = s, o[n] = !0, l += s, u++;
		}
	}
	let d = [], f = i - u;
	if (f > 0) switch (n) {
		case "error": throw new Oe(`${f} of ${i} features have a missing or non-numeric value (set missing: 'zero' | 'mean' | 'drop' to handle them)`);
		case "zero":
			for (let e = 0; e < i; e++) o[e] || (a[e] = 0, s[e] = !0);
			c.push(`${f} missing values set to 0`);
			break;
		case "mean": {
			let e = u > 0 ? l / u : 0;
			for (let t = 0; t < i; t++) o[t] || (a[t] = e, s[t] = !0);
			c.push(`${f} missing values set to the mean (${e})`);
			break;
		}
		case "drop":
			for (let e = 0; e < i; e++) o[e] || d.push(e);
			c.push(`${f} features dropped for missing values`);
			break;
	}
	return {
		values: a,
		substituted: s,
		dropped: d,
		warnings: c
	};
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/io/project.js
var R = 6371008.8, z = Math.PI / 180, Ne = 180 / Math.PI;
function Pe() {
	return {
		name: "none",
		forward: (e, t) => [e, t],
		inverse: (e, t) => [e, t]
	};
}
function Fe(e, t) {
	let n = e * z, r = t * z, i = Math.sin(r), a = Math.cos(r);
	return {
		name: "laea",
		forward(e, t) {
			let r = e * z - n, o = t * z, s = Math.sin(o), c = Math.cos(o), l = Math.cos(r), u = 1 + i * s + a * c * l;
			u <= 1e-12 && (u = 1e-12);
			let d = R * Math.sqrt(2 / u);
			return [d * c * Math.sin(r), d * (a * s - i * c * l)];
		},
		inverse(r, o) {
			let s = Math.hypot(r, o);
			if (s < 1e-12) return [e, t];
			let c = Math.min(1, Math.max(-1, s / (2 * R))), l = 2 * Math.asin(c), u = Math.sin(l), d = Math.cos(l), f = Math.asin(Math.min(1, Math.max(-1, d * i + o * u * a / s)));
			return [(n + Math.atan2(r * u, s * a * d - o * i * u)) * Ne, f * Ne];
		}
	};
}
function Ie(e, t = 30) {
	let n = e * z, r = Math.cos(t * z);
	return {
		name: "cylindrical-equal-area",
		forward(e, t) {
			return [R * (e * z - n) * r, R * Math.sin(t * z) / r];
		},
		inverse(e, t) {
			let i = (e / (R * r) + n) * Ne, a = Math.min(1, Math.max(-1, t * r / R));
			return [i, Math.asin(a) * Ne];
		}
	};
}
function Le(e = 0) {
	let t = e * z, n = 1.340264, r = -.081106, i = 893e-6, a = .003796, o = Math.sqrt(3) / 2, s = (e) => {
		let t = e * e, o = t * t * t;
		return n + 3 * r * t + o * (7 * i + 9 * a * t);
	}, c = (e) => {
		let t = e * e, o = t * e, s = o * o * e;
		return n * e + r * o + s * (i + a * t);
	};
	return {
		name: "equal-earth",
		forward(e, n) {
			let r = e * z - t, i = Math.asin(Math.min(1, Math.max(-1, o * Math.sin(n * z))));
			return [R * r * Math.cos(i) / (o * s(i)), R * c(i)];
		},
		inverse(n, r) {
			let i = r / R, a = i;
			for (let e = 0; e < 12; e++) {
				let e = (c(a) - i) / s(a);
				if (a -= e, Math.abs(e) < 1e-14) break;
			}
			let l = Math.asin(Math.min(1, Math.max(-1, Math.sin(a) / o))) * Ne, u = Math.cos(a);
			return [u === 0 ? e : (t + n / R * o * s(a) / u) * Ne, l];
		}
	};
}
function Re(e, t) {
	if (t === "none") return Pe();
	let [n, r, i, a] = xe(e), o = Ae([
		n,
		r,
		i,
		a
	]);
	if (t === "auto" && !o) return Pe();
	if (!o) throw Error(`projection '${t}' requires lon/lat input, but coordinates span [${n}, ${r}] .. [${i}, ${a}]`);
	let s = (n + i) / 2, c = (r + a) / 2, l = i - n;
	return t === "equal-earth" ? Le(s) : t === "cylindrical-equal-area" ? Ie(s) : t === "laea" ? Fe(s, c) : l > 180 ? Le(s) : Fe(s, c);
}
function ze(e, t) {
	if (t.name === "none") return;
	let n = e.coords;
	for (let e = 0; e < n.length; e += 2) {
		let [r, i] = t.forward(n[e], n[e + 1]);
		n[e] = r, n[e + 1] = i;
	}
}
function Be(e, t) {
	if (t.name === "none") return;
	let n = e.coords;
	for (let e = 0; e < n.length; e += 2) {
		let [r, i] = t.inverse(n[e], n[e + 1]);
		n[e] = r, n[e + 1] = i;
	}
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/io/wrap.js
function Ve(e) {
	let t = e.ringStart.length - 1;
	for (let n = 0; n < t; n++) {
		let [t, r] = F(e, n), i = e.coords[2 * t];
		for (let n = t + 1; n < r; n++) {
			let t = e.coords[2 * n] - 360 * Math.round((e.coords[2 * n] - i) / 360);
			e.coords[2 * n] = t, i = t;
		}
	}
}
function He(e) {
	if (e.type === "Polygon") {
		let t = We(e.coordinates);
		return t ? t.length === 1 ? {
			type: "Polygon",
			coordinates: t[0]
		} : {
			type: "MultiPolygon",
			coordinates: t
		} : e;
	}
	let t = !1, n = [];
	for (let r of e.coordinates) {
		let e = We(r);
		e ? (t = !0, n.push(...e)) : n.push(r);
	}
	return t ? {
		type: "MultiPolygon",
		coordinates: n
	} : e;
}
function Ue(e) {
	for (let t of e) for (let [e] of t) if (e < -180 || e > 180) return !1;
	return !0;
}
function We(e) {
	if (e.length === 0) return null;
	let t = e.map(Ge);
	if (Ue(t) && Ue(e)) return null;
	let n = t[0], r = Infinity, i = -Infinity;
	for (let [e] of n) e < r && (r = e), e > i && (i = e);
	let a = [], o = Math.floor((r + 180) / 360), s = Math.floor((i + 180) / 360);
	for (let e = o; e <= s; e++) {
		let n = -360 * e, r = t.map((e) => Ke(e.map(([e, t]) => [e + n, t]))), i = r[0];
		i.length < 4 || a.push([i, ...r.slice(1).filter((e) => e.length >= 4)]);
	}
	return a.length > 0 ? a : null;
}
function Ge(e) {
	if (e.length === 0) return e;
	let t = [[e[0][0], e[0][1]]], n = e[0][0];
	for (let r = 1; r < e.length; r++) {
		let i = e[r][0] - 360 * Math.round((e[r][0] - n) / 360);
		t.push([i, e[r][1]]), n = i;
	}
	return t;
}
function Ke(e) {
	let t = qe(qe(e, (e) => e[0] >= -180, -180), (e) => e[0] <= 180, 180);
	if (t.length === 0) return t;
	let n = t[0], r = t[t.length - 1];
	return (n[0] !== r[0] || n[1] !== r[1]) && t.push([n[0], n[1]]), t;
}
function qe(e, t, n) {
	if (e.length === 0) return e;
	let r = e.length > 1 && e[0][0] === e[e.length - 1][0] && e[0][1] === e[e.length - 1][1] ? e.slice(0, -1) : e, i = [];
	for (let e = 0; e < r.length; e++) {
		let a = r[e], o = r[(e - 1 + r.length) % r.length], s = t(a);
		if (s !== t(o)) {
			let e = (n - o[0]) / (a[0] - o[0]);
			i.push([n, o[1] + e * (a[1] - o[1])]);
		}
		s && i.push([a[0], a[1]]);
	}
	return i;
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/methods/olson.js
function Je(e, t, n) {
	let r = L(e), i = e.featCount, a = 0, o = 0;
	for (let e = 0; e < i; e++) a += r[e], o += t[e];
	let s = new Float64Array(i);
	if (o <= 0 || a <= 0) return s;
	for (let e = 0; e < i; e++) s[e] = a * t[e] / o;
	let c = 1;
	if (n.fit === "max") {
		let e = 0;
		for (let t = 0; t < i; t++) r[t] > 0 && (e = Math.max(e, Math.sqrt(s[t] / r[t])));
		e > 0 && (c = 1 / e);
	}
	for (let t = 0; t < i; t++) {
		let n = r[t];
		if (n <= 0) continue;
		let i = c * Math.sqrt(s[t] / n);
		if (s[t] = s[t] * c * c, i !== 1) for (let n = e.featStart[t]; n < e.featStart[t + 1]; n++) {
			let [t, r] = ye(e, n), a = e.ringStart[e.polyStart[n]], o = e.ringStart[e.polyStart[n + 1]];
			for (let n = a; n < o; n++) e.coords[2 * n] = t + (e.coords[2 * n] - t) * i, e.coords[2 * n + 1] = r + (e.coords[2 * n + 1] - r) * i;
		}
	}
	return s;
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/topology/vertices.js
function Ye(e) {
	let t = e.coords.length >>> 1, n = new Uint32Array(t), r = /* @__PURE__ */ new Map(), i = [], a = [], o = [];
	for (let s = 0; s < t; s++) {
		let t = e.coords[2 * s], c = e.coords[2 * s + 1], l = `${t},${c}`, u = r.get(l);
		u === void 0 && (u = i.length, r.set(l, u), i.push(t), a.push(c), o.push(0)), n[s] = u, o[u]++;
	}
	let s = new Float64Array(i.length * 2);
	for (let e = 0; e < i.length; e++) s[2 * e] = i[e], s[2 * e + 1] = a[e];
	return {
		count: i.length,
		coords: s,
		ids: n,
		multiplicity: Uint32Array.from(o)
	};
}
function Xe(e, t) {
	let n = e.coords.length >>> 1;
	for (let r = 0; r < n; r++) {
		let n = t.ids[r];
		e.coords[2 * r] = t.coords[2 * n], e.coords[2 * r + 1] = t.coords[2 * n + 1];
	}
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/methods/dcn.js
var B = {
	iterations: 60,
	targetError: .02,
	cutoff: 5,
	damping: 1,
	smoothing: 2,
	sources: "part",
	shapeAnchor: .25
};
function Ze(e, t, n) {
	let r = e.featCount, i = L(e), a = 0, o = 0;
	for (let e = 0; e < r; e++) a += i[e], o += t[e];
	let s = new Float64Array(r);
	if (o <= 0 || a <= 0) return {
		iterations: 0,
		meanError: 0,
		targetAreas: s,
		foldRetries: 0,
		converged: !0
	};
	for (let e = 0; e < r; e++) s[e] = a * t[e] / o;
	let c = a / r * .001;
	for (let e = 0; e < r; e++) s[e] < c && (s[e] = c);
	let l = Ye(e), u = n.shapeAnchor > 0 ? et(e, l) : null, d = n.sources === "part", f = d ? e.polyCount : r, p = new Uint32Array(f);
	if (d) for (let t = 0; t < r; t++) for (let n = e.featStart[t]; n < e.featStart[t + 1]; n++) p[n] = t;
	else for (let e = 0; e < r; e++) p[e] = e;
	let m = new Float64Array(f), h = new Float64Array(f), g = new Float64Array(f), _ = new Float64Array(f), v = new Float64Array(l.count), y = new Float64Array(l.count), b = new Float64Array(l.count), x = new Float64Array(l.count), S = new Float64Array(l.count), C = new Float64Array(l.coords.length), w = nt(e), T = it(L(e), s), E = 0, D = 0, O = T <= n.targetError, k = n.damping;
	for (let t = 0; t < n.iterations && !O && !n.signal?.aborted; t++) {
		D = t + 1;
		let r = L(e);
		for (let t = 0; t < f; t++) {
			let n = p[t], [i, a] = d ? ye(e, t) : be(e, n), o = d ? ve(e, t) : r[n], c = r[n] > 0 ? Math.sqrt(s[n] / r[n]) : 1;
			m[t] = i, h[t] = a, g[t] = Math.sqrt(Math.max(o, 0) / Math.PI), _[t] = g[t] * c;
		}
		v.fill(0), y.fill(0), x.fill(0), S.fill(0), b.fill(Infinity), Qe(l, n, m, h, g, _, v, y, b, x, S);
		for (let e = 0; e < l.count; e++) {
			let t = x[e];
			t > 0 && (v[e] /= t, y[e] /= t);
		}
		for (let e = 0; e < l.count; e++) {
			let t = b[e];
			if (!Number.isFinite(t)) continue;
			let n = Math.hypot(v[e], y[e]);
			n > t && n > 0 && (v[e] *= t / n, y[e] *= t / n);
		}
		for (let t = 0; t < n.smoothing; t++) $e(e, l, v, y);
		let a = 1 / (1 + T);
		for (let e = 0; e < l.count; e++) v[e] *= a, y[e] *= a;
		C.set(l.coords);
		let o = !1;
		for (let t = 0; t < 8; t++) {
			for (let e = 0; e < l.count; e++) l.coords[2 * e] = C[2 * e] + v[e] * k, l.coords[2 * e + 1] = C[2 * e + 1] + y[e] * k;
			if (Xe(e, l), u && tt(e, l, u, i, L(e), n.shapeAnchor), !rt(e, w)) {
				o = !0;
				break;
			}
			E++, k /= 2;
		}
		if (!o) {
			l.coords.set(C), Xe(e, l), k = Math.max(k / 4, n.damping / 1024);
			continue;
		}
		k = Math.min(n.damping, k * 1.3), T = it(L(e), s), n.onIteration?.(D, T), T <= n.targetError && (O = !0);
	}
	return {
		iterations: D,
		meanError: T,
		targetAreas: s,
		foldRetries: E,
		converged: O
	};
}
function Qe(e, t, n, r, i, a, o, s, c, l, u) {
	let d = n.length, f = Infinity, p = Infinity, m = -Infinity, h = -Infinity;
	for (let t = 0; t < e.count; t++) {
		let n = e.coords[2 * t], r = e.coords[2 * t + 1];
		n < f && (f = n), n > m && (m = n), r < p && (p = r), r > h && (h = r);
	}
	let g = Float64Array.from(i, (e, n) => t.cutoff * Math.max(e, a[n])), _ = Math.max(at(g), 1e-9), v = Math.max(1, Math.min(2048, Math.ceil((m - f) / _) + 1)), y = Math.max(1, Math.min(2048, Math.ceil((h - p) / _) + 1)), b = (m - f) / v || 1, x = (h - p) / y || 1, S = new Uint32Array(v * y + 1), C = new Uint32Array(e.count);
	for (let t = 0; t < e.count; t++) {
		let n = Math.min(v - 1, Math.max(0, Math.floor((e.coords[2 * t] - f) / b))), r = Math.min(y - 1, Math.max(0, Math.floor((e.coords[2 * t + 1] - p) / x))) * v + n;
		C[t] = r, S[r + 1]++;
	}
	for (let e = 0; e < v * y; e++) S[e + 1] += S[e];
	let w = new Uint32Array(e.count), T = S.slice(0, v * y);
	for (let t = 0; t < e.count; t++) w[T[C[t]]++] = t;
	for (let t = 0; t < d; t++) {
		let d = i[t], m = a[t] - d;
		if (m === 0 || d <= 0) continue;
		let h = g[t], _ = Math.max(0, Math.floor((n[t] - h - f) / b)), C = Math.min(v - 1, Math.floor((n[t] + h - f) / b)), T = Math.max(0, Math.floor((r[t] - h - p) / x)), E = Math.min(y - 1, Math.floor((r[t] + h - p) / x)), D = h * h;
		for (let i = T; i <= E; i++) for (let f = _; f <= C; f++) {
			let p = i * v + f;
			for (let i = S[p]; i < S[p + 1]; i++) {
				let f = w[i], p = e.coords[2 * f] - n[t], g = e.coords[2 * f + 1] - r[t], _ = p * p + g * g;
				if (_ >= D || _ === 0) continue;
				let v = Math.sqrt(_), y = v > d ? m * d / v : m * (_ / (d * d)) * (4 - 3 * v / d), b = v / h, x = (1 - b * b) * (1 - b * b) / (1 + v), S = y * x / v;
				o[f] += p * S, s[f] += g * S, l[f] += x, x > u[f] && (u[f] = x, c[f] = .5 * Math.min(d, a[t]));
			}
		}
	}
}
function $e(e, t, n, r) {
	let i = new Float64Array(t.count), a = new Float64Array(t.count), o = new Uint32Array(t.count);
	for (let s = 0; s < e.ringCount; s++) {
		let [c, l] = F(e, s);
		for (let e = c; e < l; e++) {
			let s = e === c ? l - 1 : e - 1, u = e + 1 < l ? e + 1 : c, d = t.ids[e];
			i[d] += (n[t.ids[s]] + n[t.ids[u]]) / 2, a[d] += (r[t.ids[s]] + r[t.ids[u]]) / 2, o[d]++;
		}
	}
	for (let e = 0; e < t.count; e++) o[e] !== 0 && (n[e] = .5 * n[e] + .5 * (i[e] / o[e]), r[e] = .5 * r[e] + .5 * (a[e] / o[e]));
}
function et(e, t) {
	let n = e.coords.length >>> 1, r = new Float64Array(n), i = new Float64Array(n), a = new Uint32Array(n);
	for (let t = 0; t < e.featCount; t++) for (let n = e.featStart[t]; n < e.featStart[t + 1]; n++) for (let o = e.polyStart[n]; o < e.polyStart[n + 1]; o++) {
		let [n, s] = F(e, o);
		for (let o = n; o < s; o++) {
			let c = o === n ? s - 1 : o - 1, l = o + 1 < s ? o + 1 : n;
			r[o] = e.coords[2 * o] - (e.coords[2 * c] + e.coords[2 * l]) / 2, i[o] = e.coords[2 * o + 1] - (e.coords[2 * c + 1] + e.coords[2 * l + 1]) / 2, a[o] = t;
		}
	}
	return {
		ox: r,
		oy: i,
		feature: a
	};
}
function tt(e, t, n, r, i, a) {
	e.coords.length >>> 1;
	let o = new Float64Array(t.count), s = new Float64Array(t.count), c = new Uint32Array(t.count), l = new Float64Array(e.featCount);
	for (let t = 0; t < e.featCount; t++) l[t] = r[t] > 0 ? Math.sqrt(Math.max(i[t], 0) / r[t]) : 1;
	for (let r = 0; r < e.ringCount; r++) {
		let [i, a] = F(e, r);
		for (let r = i; r < a; r++) {
			let u = r === i ? a - 1 : r - 1, d = r + 1 < a ? r + 1 : i, f = (e.coords[2 * u] + e.coords[2 * d]) / 2, p = (e.coords[2 * u + 1] + e.coords[2 * d + 1]) / 2, m = l[n.feature[r]], h = f + n.ox[r] * m, g = p + n.oy[r] * m, _ = t.ids[r];
			o[_] += h - e.coords[2 * r], s[_] += g - e.coords[2 * r + 1], c[_]++;
		}
	}
	for (let e = 0; e < t.count; e++) c[e] !== 0 && (t.coords[2 * e] += a * o[e] / c[e], t.coords[2 * e + 1] += a * s[e] / c[e]);
	Xe(e, t);
}
function nt(e) {
	let t = new Int8Array(e.ringCount), n = new Float64Array(e.ringCount), r = 0;
	for (let i = 0; i < e.ringCount; i++) {
		let a = I(e, i);
		t[i] = Math.sign(a), n[i] = Math.abs(a), r += n[i];
	}
	let i = r / Math.max(1, e.ringCount) * 1e-6, a = new Uint8Array(e.ringCount);
	for (let t = 0; t < e.ringCount; t++) a[t] = +(n[t] <= i);
	return {
		orientation: t,
		ignore: a
	};
}
function rt(e, t) {
	for (let n = 0; n < e.ringCount; n++) {
		if (t.ignore[n]) continue;
		let r = Math.sign(I(e, n));
		if (r !== 0 && t.orientation[n] !== 0 && r !== t.orientation[n]) return !0;
	}
	return !1;
}
function it(e, t) {
	let n = 0, r = 0;
	for (let i = 0; i < e.length; i++) n += e[i], r += t[i];
	let i = 0;
	for (let a = 0; a < e.length; a++) {
		let o = n > 0 ? e[a] / n : 0, s = r > 0 ? t[a] / r : 0, c = Math.max(o, s);
		i += c === 0 ? 0 : Math.abs(o - s) / c;
	}
	return e.length > 0 ? i / e.length : 0;
}
function at(e) {
	if (e.length === 0) return 0;
	let t = Float64Array.from(e).sort();
	return t[t.length >> 1];
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/metrics/topology.js
function ot(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Set();
	for (let r = 0; r < e.featCount; r++) for (let i = e.featStart[r]; i < e.featStart[r + 1]; i++) for (let a = e.polyStart[i]; a < e.polyStart[i + 1]; a++) {
		let [i, o] = F(e, a), s = e.coords[2 * (o - 1)], c = e.coords[2 * (o - 1) + 1];
		for (let a = i; a < o; a++) {
			let i = e.coords[2 * a], o = e.coords[2 * a + 1], l = st(s, c, i, o), u = t.get(l);
			u === void 0 ? t.set(l, r) : u !== r && n.add(u < r ? `${u}|${r}` : `${r}|${u}`), s = i, c = o;
		}
	}
	return n;
}
function st(e, t, n, r) {
	return e < n || e === n && t <= r ? `${e},${t},${n},${r}` : `${n},${r},${e},${t}`;
}
function ct(e, t) {
	let n = ot(e), r = ot(t), i = 0;
	for (let e of r) n.has(e) && i++;
	let a = n.size + r.size - i;
	return {
		error: a === 0 ? 0 : 1 - i / a,
		inputEdges: n.size,
		outputEdges: r.size,
		sharedEdges: i
	};
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/methods/dorling.js
var lt = 1.5, ut = {
	shape: "circle",
	iterations: 200,
	anchor: .15,
	attraction: .3,
	repulsion: 1,
	segments: 64,
	fill: .3
};
function dt(e, t, n) {
	let r = e.featCount, i = L(e), a = 0, o = 0;
	for (let e = 0; e < r; e++) a += i[e], o += t[e];
	let s = new Float64Array(r), c = new Float64Array(r), l = new Float64Array(r), u = new Float64Array(r), d = new Float64Array(r), f = new Float64Array(r);
	for (let i = 0; i < r; i++) {
		let r = e.featStart[i], p = -1;
		for (let t = e.featStart[i]; t < e.featStart[i + 1]; t++) {
			let n = ve(e, t);
			n > p && (p = n, r = t);
		}
		let [m, h] = p > 0 ? ye(e, r) : be(e, i);
		l[i] = m, u[i] = h, d[i] = m, f[i] = h;
		let g = n.shape === "circle" ? n.fill : n.fill * 2 / Math.PI;
		s[i] = o > 0 ? a * g * t[i] / o : 0, c[i] = n.shape === "circle" ? Math.sqrt(s[i] / Math.PI) : Math.sqrt(s[i]) / 2;
	}
	let p = Array.from(ot(e), (e) => {
		let [t, n] = e.split("|");
		return [Number(t), Number(n)];
	}), m = Float64Array.from(c, (e) => n.shape === "circle" ? e : e * Math.SQRT2), h = 0, g = !1, _ = new Float64Array(r), v = new Float64Array(r);
	for (let e = 0; e < n.iterations && !n.signal?.aborted; e++) {
		h = e + 1, _.fill(0), v.fill(0), ft(l, u, m, _, v, n);
		for (let [e, t] of p) {
			let r = l[t] - l[e], i = u[t] - u[e], a = Math.hypot(r, i), o = m[e] + m[t];
			if (a <= o || a === 0) continue;
			let s = (a - o) / a * n.attraction * .5;
			_[e] += r * s, v[e] += i * s, _[t] -= r * s, v[t] -= i * s;
		}
		let t = n.anchor * (1 - e / n.iterations), i = 0;
		for (let e = 0; e < r; e++) {
			_[e] += (d[e] - l[e]) * t, v[e] += (f[e] - u[e]) * t;
			let n = Math.hypot(_[e], v[e]), r = m[e] > 0 ? m[e] : Infinity;
			n > r && n > 0 && (_[e] *= r / n, v[e] *= r / n), l[e] += _[e], u[e] += v[e], Math.min(n, r) > i && (i = Math.min(n, r));
		}
		if (n.onIteration?.(h, i), i < vt(m) * .001) {
			g = !0;
			break;
		}
	}
	let y = vt(m) * 1e-7, b = 0;
	for (let e = 0; e < 400 && (b++, !(mt(l, u, m) <= y)); e++);
	let x = ht(l, u, m, n);
	return {
		geometry: gt(e, l, u, c, n),
		targetAreas: s,
		iterations: h,
		overlaps: x,
		sweeps: b,
		converged: g
	};
}
function ft(e, t, n, r, i, a) {
	let o = e.length, s = Math.max(2 * _t(n), 1e-9), c = /* @__PURE__ */ new Map();
	for (let n = 0; n < o; n++) {
		let r = `${Math.floor(e[n] / s)},${Math.floor(t[n] / s)}`, i = c.get(r);
		i ? i.push(n) : c.set(r, [n]);
	}
	for (let l = 0; l < o; l++) {
		let o = Math.floor(e[l] / s), u = Math.floor(t[l] / s);
		for (let s = -1; s <= 1; s++) for (let d = -1; d <= 1; d++) {
			let f = c.get(`${o + s},${u + d}`);
			if (f) for (let o of f) {
				if (o <= l) continue;
				let s = e[o] - e[l], c = t[o] - t[l], u = s * s + c * c, d = n[l] + n[o];
				if (u >= d * d) continue;
				let f = Math.sqrt(u);
				if (f === 0) {
					r[l] -= d * .25, r[o] += d * .25;
					continue;
				}
				let p = (d - f) / f * .5 * a.repulsion;
				r[l] -= s * p, i[l] -= c * p, r[o] += s * p, i[o] += c * p;
			}
		}
	}
}
function pt(e, t, n) {
	let r = e.length, i = Infinity, a = Infinity, o = -Infinity, s = -Infinity;
	for (let n = 0; n < r; n++) e[n] < i && (i = e[n]), e[n] > o && (o = e[n]), t[n] < a && (a = t[n]), t[n] > s && (s = t[n]);
	let c = Math.max(1, Math.min(1024, Math.ceil((o - i) / n) + 1)), l = Math.max(1, Math.min(1024, Math.ceil((s - a) / n) + 1)), u = (o - i) / c || 1, d = (s - a) / l || 1, f = new Uint32Array(c * l + 1), p = new Uint32Array(r);
	for (let n = 0; n < r; n++) {
		let r = Math.min(c - 1, Math.max(0, Math.floor((e[n] - i) / u)));
		p[n] = Math.min(l - 1, Math.max(0, Math.floor((t[n] - a) / d))) * c + r, f[p[n] + 1]++;
	}
	for (let e = 0; e < c * l; e++) f[e + 1] += f[e];
	let m = new Uint32Array(r), h = f.slice(0, c * l);
	for (let e = 0; e < r; e++) m[h[p[e]]++] = e;
	return {
		cols: c,
		rows: l,
		minX: i,
		minY: a,
		cw: u,
		ch: d,
		start: f,
		order: m
	};
}
function mt(e, t, n) {
	let r = e.length, i = vt(n), a = pt(e, t, Math.max(2 * i, 1e-9)), o = Math.max(Math.min(a.cw, a.ch), 1e-12), s = [], c = Math.max(4 * i, 1e-12);
	for (let e = 0; e < r; e++) n[e] > c && s.push(e);
	let l = 0, u = (r, i) => {
		let a = n[r], o = n[i];
		if (a <= 0 || o <= 0) return;
		let s = e[i] - e[r], c = t[i] - t[r], u = a + o, d = Math.hypot(s, c);
		if (d >= u) return;
		let f = u - d;
		if (f > l && (l = f), d === 0) {
			e[r] -= u / 2, e[i] += u / 2;
			return;
		}
		let p = lt * f / d / 2;
		e[r] -= s * p, t[r] -= c * p, e[i] += s * p, t[i] += c * p;
	};
	for (let i = 0; i < r; i++) {
		if (n[i] <= 0) continue;
		let r = Math.min(Math.max(a.cols, a.rows), Math.max(1, Math.ceil((n[i] + c) / o))), s = Math.min(a.cols - 1, Math.max(0, Math.floor((e[i] - a.minX) / a.cw))), l = Math.min(a.rows - 1, Math.max(0, Math.floor((t[i] - a.minY) / a.ch)));
		for (let e = -r; e <= r; e++) {
			let t = l + e;
			if (!(t < 0 || t >= a.rows)) for (let e = -r; e <= r; e++) {
				let n = s + e;
				if (n < 0 || n >= a.cols) continue;
				let r = t * a.cols + n;
				for (let e = a.start[r]; e < a.start[r + 1]; e++) {
					let t = a.order[e];
					t <= i || u(i, t);
				}
			}
		}
	}
	for (let e of s) for (let t = 0; t < r; t++) t !== e && u(Math.min(t, e), Math.max(t, e));
	return l;
}
function ht(e, t, n, r) {
	let i = e.length, a = Math.max(2 * _t(n), 1e-9), o = /* @__PURE__ */ new Map();
	for (let n = 0; n < i; n++) {
		let r = `${Math.floor(e[n] / a)},${Math.floor(t[n] / a)}`, i = o.get(r);
		i ? i.push(n) : o.set(r, [n]);
	}
	let s = 0;
	for (let r = 0; r < i; r++) {
		let i = Math.floor(e[r] / a), c = Math.floor(t[r] / a);
		for (let a = -1; a <= 1; a++) for (let l = -1; l <= 1; l++) for (let u of o.get(`${i + a},${c + l}`) ?? []) {
			if (u <= r) continue;
			let i = (n[r] + n[u]) * .999999;
			Math.hypot(e[u] - e[r], t[u] - t[r]) < i && s++;
		}
	}
	return s;
}
function gt(e, t, n, r, i) {
	let a = e.featCount, o = i.shape === "circle" ? Math.max(8, i.segments) : 4, s = new Float64Array(a * o * 2), c = new Uint32Array(a + 1), l = new Uint32Array(a + 1), u = new Uint32Array(a + 1);
	for (let e = 0; e < a; e++) {
		c[e] = e * o, l[e] = e, u[e] = e;
		let a = i.shape === "circle" ? Math.PI * r[e] * r[e] : 4 * r[e] * r[e];
		if (i.shape === "square") {
			let i = r[e], a = [
				[-i, -i],
				[i, -i],
				[i, i],
				[-i, i]
			];
			for (let r = 0; r < 4; r++) s[2 * (e * o + r)] = t[e] + a[r][0], s[2 * (e * o + r) + 1] = n[e] + a[r][1];
			continue;
		}
		let d = a > 0 ? Math.sqrt(2 * a / (o * Math.sin(2 * Math.PI / o))) : 0;
		for (let r = 0; r < o; r++) {
			let i = 2 * Math.PI * r / o;
			s[2 * (e * o + r)] = t[e] + d * Math.cos(i), s[2 * (e * o + r) + 1] = n[e] + d * Math.sin(i);
		}
	}
	return c[a] = a * o, l[a] = a, u[a] = a, {
		coords: s,
		ringStart: c,
		ringCount: a,
		polyStart: l,
		polyCount: a,
		featStart: u,
		featCount: a,
		featType: Array(a).fill("Polygon")
	};
}
function _t(e) {
	let t = 0;
	for (let n of e) n > t && (t = n);
	return t;
}
function vt(e) {
	if (e.length === 0) return 0;
	let t = Float64Array.from(e).sort();
	return t[t.length >> 1];
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/methods/diffusion/fft.js
var yt = class {
	n;
	cos;
	sin;
	rev;
	constructor(e) {
		if (e < 2 || e & e - 1) throw Error(`FFT size must be a power of two, got ${e}`);
		this.n = e, this.cos = new Float64Array(e / 2), this.sin = new Float64Array(e / 2);
		for (let t = 0; t < e / 2; t++) this.cos[t] = Math.cos(-2 * Math.PI * t / e), this.sin[t] = Math.sin(-2 * Math.PI * t / e);
		this.rev = new Uint32Array(e);
		let t = Math.log2(e);
		for (let n = 0; n < e; n++) {
			let e = 0;
			for (let r = 0; r < t; r++) n & 1 << r && (e |= 1 << t - 1 - r);
			this.rev[n] = e;
		}
	}
	transform(e, t) {
		let { n, rev: r, cos: i, sin: a } = this;
		for (let i = 0; i < n; i++) {
			let n = r[i];
			if (n > i) {
				let r = e[i];
				e[i] = e[n], e[n] = r, r = t[i], t[i] = t[n], t[n] = r;
			}
		}
		for (let r = 2; r <= n; r <<= 1) {
			let o = r >> 1, s = n / r;
			for (let c = 0; c < n; c += r) for (let n = c, r = 0; n < c + o; n++, r += s) {
				let s = n + o, c = i[r], l = a[r], u = e[s] * c - t[s] * l, d = e[s] * l + t[s] * c;
				e[s] = e[n] - u, t[s] = t[n] - d, e[n] += u, t[n] += d;
			}
		}
	}
}, bt = class {
	n;
	fft;
	re;
	im;
	cosHalf;
	sinHalf;
	constructor(e) {
		this.n = e, this.fft = new yt(2 * e), this.re = new Float64Array(2 * e), this.im = new Float64Array(2 * e), this.cosHalf = new Float64Array(e + 1), this.sinHalf = new Float64Array(e + 1);
		for (let t = 0; t <= e; t++) this.cosHalf[t] = Math.cos(-Math.PI * t / (2 * e)), this.sinHalf[t] = Math.sin(-Math.PI * t / (2 * e));
	}
	forward(e, t, n) {
		let { n: r, re: i, im: a } = this;
		for (let o = 0; o < r; o++) {
			let s = e[t + o * n];
			i[o] = s, i[2 * r - 1 - o] = s, a[o] = 0, a[2 * r - 1 - o] = 0;
		}
		this.fft.transform(i, a);
		for (let o = 0; o < r; o++) e[t + o * n] = (i[o] * this.cosHalf[o] - a[o] * this.sinHalf[o]) / 2;
	}
	inverseSine(e, t, n) {
		let { n: r, re: i, im: a } = this;
		i.fill(0), a.fill(0);
		for (let o = 1; o < r; o++) {
			let s = e[t + o * n], c = this.cosHalf[o], l = -this.sinHalf[o], u = s * c, d = s * l;
			i[o] = u, a[o] = d, i[2 * r - o] = -u, a[2 * r - o] = d;
		}
		for (let e = 0; e < 2 * r; e++) a[e] = -a[e];
		this.fft.transform(i, a);
		for (let i = 0; i < r; i++) e[t + i * n] = -a[i] / r;
	}
	inverse(e, t, n) {
		let { n: r, re: i, im: a } = this;
		i.fill(0), a.fill(0), i[0] = e[t];
		for (let o = 1; o < r; o++) {
			let s = e[t + o * n], c = this.cosHalf[o], l = -this.sinHalf[o], u = s * c, d = s * l;
			i[o] = u, a[o] = d, i[2 * r - o] = u, a[2 * r - o] = -d;
		}
		for (let e = 0; e < 2 * r; e++) a[e] = -a[e];
		this.fft.transform(i, a);
		for (let a = 0; a < r; a++) e[t + a * n] = i[a] / r;
	}
};
function xt(e, t, n, r, i) {
	for (let i = 0; i < n; i++) r.forward(e, i * t, 1);
	for (let n = 0; n < t; n++) i.forward(e, n, t);
}
function St(e, t, n, r, i) {
	for (let n = 0; n < t; n++) i.inverse(e, n, t);
	for (let i = 0; i < n; i++) r.inverse(e, i * t, 1);
}
function Ct(e, t, n, r, i, a) {
	for (let n = 0; n < t; n++) a === "y" ? i.inverseSine(e, n, t) : i.inverse(e, n, t);
	for (let i = 0; i < n; i++) a === "x" ? r.inverseSine(e, i * t, 1) : r.inverse(e, i * t, 1);
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/methods/diffusion/grid.js
function wt(e, t, n, r) {
	let [i, a, o, s] = xe(e), c = o - i, l = s - a, u = Math.max(c, l) * r, d = (i + o) / 2, f = (a + s) / 2, p = d - u / 2, m = f - u / 2, h = u / n, g = new Int32Array(n * n).fill(-1);
	Et(e, g, n, p, m, h);
	let _ = Tt(e, g, n, p, m, h), v = L(e), y = 0, b = 0;
	for (let n = 0; n < e.featCount; n++) y += t[n], b += v[n];
	let x = b > 0 ? y / b : 1, S = x * 1e-6, C = new Float64Array(e.featCount);
	for (let e = 0; e < g.length; e++) {
		let t = g[e];
		t >= 0 && C[t]++;
	}
	let w = new Float64Array(n * n), T = 0;
	for (let e = 0; e < g.length; e++) {
		let n = g[e];
		if (n < 0) w[e] = x, T++;
		else {
			let r = C[n] * h * h, i = v[n] < h * h ? Math.max(t[n] / Math.max(r, v[n]), x) : t[n] / v[n];
			w[e] = Math.max(i, S);
		}
	}
	let E = 0;
	for (let e = 0; e < w.length; e++) E += w[e];
	let D = E / w.length;
	if (D > 0) for (let e = 0; e < w.length; e++) w[e] /= D;
	return {
		nx: n,
		ny: n,
		x0: p,
		y0: m,
		h,
		rho: w,
		owner: g,
		seaFraction: T / g.length,
		underResolved: _
	};
}
function Tt(e, t, n, r, i, a) {
	let o = new Int32Array(e.featCount);
	for (let e = 0; e < t.length; e++) {
		let n = t[e];
		n >= 0 && o[n]++;
	}
	let s = 0;
	for (let c = 0; c < e.featCount; c++) {
		if (o[c] > 0) continue;
		let [l, u] = be(e, c), d = Math.min(n - 1, Math.max(0, Math.floor((l - r) / a))), f = Math.min(n - 1, Math.max(0, Math.floor((u - i) / a))), p = -1, m = -1;
		for (let e = 0; e < n && p < 0; e++) {
			for (let r = -e; r <= e && p < 0; r++) for (let i = -e; i <= e && p < 0; i++) {
				if (e > 0 && Math.abs(r) !== e && Math.abs(i) !== e) continue;
				let a = f + r, s = d + i;
				if (a < 0 || a >= n || s < 0 || s >= n) continue;
				let c = a * n + s, l = t[c];
				l < 0 ? p = c : m < 0 && o[l] > 1 && (m = c);
			}
			p < 0 && m >= 0 && e >= 2 && (p = m);
		}
		if (p < 0) continue;
		let h = t[p];
		h >= 0 && o[h]--, t[p] = c, o[c] = 1, s++;
	}
	return s;
}
function Et(e, t, n, r, i, a) {
	let o = [];
	for (let s = 0; s < e.featCount; s++) for (let c = e.featStart[s]; c < e.featStart[s + 1]; c++) {
		let l = e.polyStart[c], u = e.polyStart[c + 1], d = Infinity, f = -Infinity;
		for (let t = l; t < u; t++) {
			let [n, r] = F(e, t);
			for (let t = n; t < r; t++) {
				let n = e.coords[2 * t + 1];
				n < d && (d = n), n > f && (f = n);
			}
		}
		let p = Math.max(0, Math.ceil((d - i) / a - .5)), m = Math.min(n - 1, Math.floor((f - i) / a - .5));
		for (let c = p; c <= m; c++) {
			let d = i + (c + .5) * a;
			o.length = 0;
			for (let t = l; t < u; t++) {
				let [n, r] = F(e, t), i = e.coords[2 * (r - 1)], a = e.coords[2 * (r - 1) + 1];
				for (let t = n; t < r; t++) {
					let n = e.coords[2 * t], r = e.coords[2 * t + 1];
					a <= d != r <= d && o.push(i + (d - a) / (r - a) * (n - i)), i = n, a = r;
				}
			}
			if (!(o.length < 2)) {
				o.sort((e, t) => e - t);
				for (let e = 0; e + 1 < o.length; e += 2) {
					let i = Math.max(0, Math.ceil((o[e] - r) / a - .5)), l = Math.min(n - 1, Math.floor((o[e + 1] - r) / a - .5)), u = c * n;
					for (let e = i; e <= l; e++) t[u + e] = s;
				}
			}
		}
	}
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/methods/diffusion/index.js
var V = {
	grid: 512,
	padding: 1.5,
	targetError: .01,
	stepsPerRun: 200,
	tolerance: .2,
	floorCells: .05,
	gradient: "differences",
	runs: 10,
	blur: 4
};
function Dt(e, t, n) {
	let r = e.featCount, i = L(e), a = 0, o = 0;
	for (let e = 0; e < r; e++) a += i[e], o += t[e];
	let s = new Float64Array(r);
	if (o <= 0 || a <= 0) return {
		targetAreas: s,
		steps: 0,
		meanError: 0,
		converged: !0,
		time: 0,
		seaFraction: 0,
		underResolved: 0
	};
	let [c, l, u, d] = xe(e), f = (Math.max(u - c, d - l) * n.padding / n.grid) ** 2, p = new Float64Array(r), m = 0;
	for (let e = 0; e < r; e++) {
		let r = Math.min(f * n.floorCells, i[e]), s = a > 0 ? o * r / a : 0;
		p[e] = Math.max(t[e], s), m += p[e];
	}
	for (let e = 0; e < r; e++) s[e] = a * p[e] / m;
	let h = [];
	for (let e = 0, t = Math.min(128, n.grid); e < n.runs; e++) h.push(t), t = Math.min(n.grid, t * 2);
	let g = /* @__PURE__ */ new Map(), _ = /* @__PURE__ */ new Map(), v = /* @__PURE__ */ new Map(), y = (e) => {
		let t = g.get(e);
		if (!t) {
			t = new bt(e), g.set(e, t);
			let n = new Float64Array(e), r = new Float64Array(e);
			for (let t = 0; t < e; t++) r[t] = Math.PI * t / e, n[t] = r[t] * r[t];
			_.set(e, {
				k2: n,
				kx: r
			}), v.set(e, {
				rho: new Float64Array(e * e),
				vxA: new Float64Array(e * e),
				vyA: new Float64Array(e * e),
				vxB: new Float64Array(e * e),
				vyB: new Float64Array(e * e),
				scratch: new Float64Array(e * e),
				gradScratch: new Float64Array(e * e)
			});
		}
		return {
			dct: t,
			..._.get(e),
			...v.get(e)
		};
	}, b = e.coords.length >>> 1, x = new Float64Array(b), S = new Float64Array(b), C = new Float64Array(b), w = new Float64Array(b), T = Nt(L(e), s), E = T <= n.targetError, D = 0, O = 0, k = 0, ee = 0, A = 0;
	for (let t = 0; t < n.runs && !E && !n.signal?.aborted; t++) {
		let r = h[t], { dct: i, k2: a, kx: o, rho: c, vxA: l, vyA: u, vxB: d, vyB: f, scratch: m, gradScratch: g } = y(r), _ = 8 * (r / Math.PI * (r / Math.PI)), v = wt(e, p, r, n.padding);
		k = v.seaFraction, ee = v.underResolved;
		let j = Float64Array.from(v.rho);
		xt(j, r, r, i, i);
		let te = n.blur * .5 ** Math.max(0, t - h.indexOf(r));
		if (te > .05) {
			let e = te * te / 2;
			for (let t = 0; t < r; t++) for (let n = 0; n < r; n++) j[t * r + n] *= Math.exp(-(a[n] + a[t]) * e);
		}
		for (let t = 0; t < b; t++) x[t] = (e.coords[2 * t] - v.x0) / v.h, S[t] = (e.coords[2 * t + 1] - v.y0) / v.h;
		let M = 0, N = .05;
		kt(j, r, i, a, o, M, n.gradient, c, l, u, m, g);
		let ne = 0;
		for (; M < _ && ne < n.stepsPerRun && !n.signal?.aborted;) {
			kt(j, r, i, a, o, M + N, n.gradient, c, d, f, m, g), D++, ne++;
			let e = 0, t = 0;
			for (let n = 0; n < b; n++) {
				let [i, a] = jt(l, u, r, x[n], S[n]), o = x[n] + i * N, s = S[n] + a * N, [c, p] = jt(d, f, r, o, s), m = x[n] + (i + c) / 2 * N, h = S[n] + (a + p) / 2 * N;
				C[n] = m, w[n] = h;
				let g = Math.abs(m - o) + Math.abs(h - s);
				g > e && (e = g);
				let _ = Math.abs(m - x[n]) + Math.abs(h - S[n]);
				_ > t && (t = _);
			}
			if (e > n.tolerance && N > 1e-6) {
				N *= Math.max(.2, .9 * Math.sqrt(n.tolerance / e));
				continue;
			}
			x.set(C), S.set(w), M += N, l.set(d), u.set(f);
			let s = e > 0 ? .9 * Math.sqrt(n.tolerance / e) : 4;
			if (N *= Math.min(4, Math.max(1, s)), t < .001) break;
		}
		A = M, Mt(e, x, S, v);
		let re = T;
		if (T = Nt(L(e), s), n.onIteration?.(t + 1, T), T <= n.targetError && (E = !0), re > 0 && T > re * .999) {
			if (O++, O >= 3) break;
		} else O = 0;
	}
	return {
		targetAreas: s,
		steps: D,
		meanError: T,
		converged: E,
		time: A,
		seaFraction: k,
		underResolved: ee
	};
}
function Ot(e, t, n, r, i, a, o) {
	for (let t = 0; t < n; t++) {
		let r = i[t];
		for (let s = 0; s < n; s++) {
			let c = Math.exp(-(i[s] + r) * a);
			o[t * n + s] = e[t * n + s] * c;
		}
	}
	St(o, n, n, r, r), t.set(o);
}
function kt(e, t, n, r, i, a, o, s, c, l, u, d) {
	if (Ot(e, s, t, n, r, a, u), o === "differences") {
		At(s, c, l, t);
		return;
	}
	for (let o of ["x", "y"]) {
		for (let n = 0; n < t; n++) for (let s = 0; s < t; s++) {
			let c = n * t + s;
			d[c] = e[c] * Math.exp(-(r[s] + r[n]) * a) * -(o === "x" ? i[s] : i[n]);
		}
		Ct(d, t, t, n, n, o);
		let u = o === "x" ? c : l;
		for (let e = 0; e < t * t; e++) u[e] = -d[e] / Math.max(s[e], .001);
	}
}
function At(e, t, n, r) {
	for (let i = 0; i < r; i++) for (let a = 0; a < r; a++) {
		let o = i * r + a, s = a > 0 ? o - 1 : o, c = a < r - 1 ? o + 1 : o, l = i > 0 ? o - r : o, u = i < r - 1 ? o + r : o, d = Math.max(e[o], .001);
		t[o] = -((e[c] - e[s]) / (c === s ? 1 : a > 0 && a < r - 1 ? 2 : 1)) / d, n[o] = -((e[u] - e[l]) / (u === l ? 1 : i > 0 && i < r - 1 ? 2 : 1)) / d;
	}
}
function jt(e, t, n, r, i) {
	let a = Math.min(n - 1.001, Math.max(0, r - .5)), o = Math.min(n - 1.001, Math.max(0, i - .5)), s = Math.floor(a), c = Math.floor(o), l = a - s, u = o - c, d = Math.min(n - 1, s + 1), f = Math.min(n - 1, c + 1), p = c * n + s, m = c * n + d, h = f * n + s, g = f * n + d, _ = (e, t, n, r) => (e * (1 - l) + t * l) * (1 - u) + (n * (1 - l) + r * l) * u;
	return [_(e[p], e[m], e[h], e[g]), _(t[p], t[m], t[h], t[g])];
}
function Mt(e, t, n, r) {
	let i = t.length;
	for (let a = 0; a < i; a++) e.coords[2 * a] = r.x0 + t[a] * r.h, e.coords[2 * a + 1] = r.y0 + n[a] * r.h;
	return L(e);
}
function Nt(e, t) {
	let n = 0, r = 0;
	for (let i = 0; i < e.length; i++) n += e[i], r += t[i];
	let i = 0;
	for (let a = 0; a < e.length; a++) {
		let o = n > 0 ? e[a] / n : 0, s = r > 0 ? t[a] / r : 0, c = Math.max(o, s);
		i += c === 0 ? 0 : Math.abs(o - s) / c;
	}
	return e.length > 0 ? i / e.length : 0;
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/metrics/area.js
function Pt(e, t) {
	let n = e.length, r = 0, i = 0;
	for (let a = 0; a < n; a++) r += e[a], i += t[a];
	let a = new Float64Array(n);
	for (let o = 0; o < n; o++) {
		let n = r > 0 ? e[o] / r : 0, s = i > 0 ? t[o] / i : 0, c = Math.max(n, s);
		a[o] = c === 0 ? 0 : Math.abs(n - s) / c;
	}
	return {
		perFeature: a,
		summary: Ft(a)
	};
}
function Ft(e) {
	if (e.length === 0) return {
		mean: 0,
		max: 0,
		median: 0,
		p90: 0
	};
	let t = 0, n = 0;
	for (let r of e) t += r, r > n && (n = r);
	let r = Float64Array.from(e).sort();
	return {
		mean: t / e.length,
		max: n,
		median: It(r, .5),
		p90: It(r, .9)
	};
}
function It(e, t) {
	let n = (e.length - 1) * t, r = Math.floor(n), i = Math.ceil(n);
	return e[r] + (e[i] - e[r]) * (n - r);
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/metrics/shape.js
function Lt(e, t) {
	let n = 0;
	for (let r = e.featStart[t]; r < e.featStart[t + 1]; r++) for (let t = e.polyStart[r]; t < e.polyStart[r + 1]; t++) {
		let [r, i] = F(e, t), a = e.coords[2 * (i - 1)], o = e.coords[2 * (i - 1) + 1];
		for (let t = r; t < i; t++) {
			let r = e.coords[2 * t], i = e.coords[2 * t + 1];
			n += Math.hypot(r - a, i - o), a = r, o = i;
		}
	}
	return n;
}
function Rt(e, t) {
	let n = _e(e, t), r = Lt(e, t);
	return r <= 0 ? 0 : 4 * Math.PI * n / (r * r);
}
function zt(e, t) {
	let n = e.featCount, r = new Float64Array(n), i = new Float64Array(n), a = 0, o = -Infinity, s = 0, c = 0, l = 0, u = 0;
	for (let d = 0; d < n; d++) {
		let n = Rt(e, d), f = Rt(t, d) - n;
		r[d] = f, a += f, f > o && (o = f), f > 0 && (s++, c += f);
		let p = _e(e, d), m = _e(t, d), h = Lt(e, d), g = Lt(t, d);
		p > 0 && h > 0 && m > 0 ? (i[d] = g / (h * Math.sqrt(m / p)), l += i[d], u++) : i[d] = 1;
	}
	return {
		compactnessDrift: r,
		meanCompactnessDrift: n > 0 ? a / n : 0,
		maxCompactnessDrift: n > 0 ? o : 0,
		meanPositiveDrift: s > 0 ? c / s : 0,
		fractionRounder: n > 0 ? s / n : 0,
		detailRetention: i,
		meanDetailRetention: u > 0 ? l / u : 1
	};
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/metrics/orientation.js
function Bt(e, t) {
	let n = Math.min(e.featCount, t.featCount);
	if (n < 2) return {
		x: 1,
		y: 1,
		mean: 1
	};
	let r = new Float64Array(n), i = new Float64Array(n), a = new Float64Array(n), o = new Float64Array(n);
	for (let s = 0; s < n; s++) {
		let [n, c] = be(e, s), [l, u] = be(t, s);
		r[s] = n, i[s] = c, a[s] = l, o[s] = u;
	}
	let s = Vt(r, a), c = Vt(i, o);
	return {
		x: s,
		y: c,
		mean: (s + c) / 2
	};
}
function Vt(e, t) {
	return Ut(Ht(e), Ht(t));
}
function Ht(e) {
	let t = e.length, n = Array.from({ length: t }, (e, t) => t).sort((t, n) => e[t] - e[n]), r = new Float64Array(t), i = 0;
	for (; i < t;) {
		let a = i;
		for (; a + 1 < t && e[n[a + 1]] === e[n[i]];) a++;
		let o = (i + a) / 2;
		for (let e = i; e <= a; e++) r[n[e]] = o;
		i = a + 1;
	}
	return r;
}
function Ut(e, t) {
	let n = e.length, r = 0, i = 0;
	for (let a = 0; a < n; a++) r += e[a], i += t[a];
	r /= n, i /= n;
	let a = 0, o = 0, s = 0;
	for (let c = 0; c < n; c++) {
		let n = e[c] - r, l = t[c] - i;
		a += n * l, o += n * n, s += l * l;
	}
	let c = Math.sqrt(o * s);
	return c === 0 ? 1 : a / c;
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/metrics/validity.js
function Wt(e, t = 1e3) {
	let n = 0;
	for (let r = 0; r < e.ringCount && n < t; r++) n += Gt(e, r, t - n);
	return n;
}
function Gt(e, t, n) {
	let [r, i] = F(e, t), a = i - r;
	if (a < 4) return 0;
	let o = Infinity, s = Infinity, c = -Infinity, l = -Infinity;
	for (let t = r; t < i; t++) {
		let n = e.coords[2 * t], r = e.coords[2 * t + 1];
		n < o && (o = n), n > c && (c = n), r < s && (s = r), r > l && (l = r);
	}
	let u = Math.max(1, Math.min(256, Math.ceil(Math.sqrt(a)))), d = Math.max((c - o) / u, 1e-12), f = Math.max((l - s) / u, 1e-12), p = /* @__PURE__ */ new Map(), m = 0;
	for (let t = 0; t < a && m < n; t++) {
		let i = r + t, c = r + (t + 1) % a, l = e.coords[2 * i], h = e.coords[2 * i + 1], g = e.coords[2 * c], _ = e.coords[2 * c + 1], v = Math.min(u - 1, Math.max(0, Math.floor((Math.min(l, g) - o) / d))), y = Math.min(u - 1, Math.max(0, Math.floor((Math.max(l, g) - o) / d))), b = Math.min(u - 1, Math.max(0, Math.floor((Math.min(h, _) - s) / f))), x = Math.min(u - 1, Math.max(0, Math.floor((Math.max(h, _) - s) / f))), S = /* @__PURE__ */ new Set();
		for (let i = b; i <= x && m < n; i++) for (let o = v; o <= y && m < n; o++) {
			let n = i * u + o, s = p.get(n);
			if (s) for (let n of s) {
				if (S.has(n) || (S.add(n), n === t || (n + 1) % a === t || (t + 1) % a === n)) continue;
				let i = r + n, o = r + (n + 1) % a;
				Kt(l, h, g, _, e.coords[2 * i], e.coords[2 * i + 1], e.coords[2 * o], e.coords[2 * o + 1]) && m++;
			}
			let c = p.get(n);
			c || (c = [], p.set(n, c)), c.push(t);
		}
	}
	return m;
}
function Kt(e, t, n, r, i, a, o, s) {
	let c = qt(i, a, o, s, e, t), l = qt(i, a, o, s, n, r), u = qt(e, t, n, r, i, a), d = qt(e, t, n, r, o, s);
	return (c > 0 && l < 0 || c < 0 && l > 0) && (u > 0 && d < 0 || u < 0 && d > 0);
}
function qt(e, t, n, r, i, a) {
	return (n - e) * (a - t) - (r - t) * (i - e);
}
//#endregion
//#region node_modules/@edugis/cartogram/dist/index.js
function Jt(e, t) {
	let n = [], { collection: r, area: i, passthrough: a } = ke(e);
	a.length > 0 && n.push(`${a.length} non-areal features passed through untransformed`);
	let { values: o, substituted: s, dropped: c, warnings: l } = Me(i.map((e) => e.feature), t.value, t.missing ?? "error", t.negative ?? "error");
	n.push(...l);
	let u = new Set(c), d = i.filter((e, t) => !u.has(t)), f = Float64Array.from(Array.from(o).filter((e, t) => !u.has(t))), p = s.filter((e, t) => !u.has(t)), m = me(d.map((e) => e.feature)), h = Re(m, t.projection ?? "auto");
	h.name !== "none" && Ve(m), ze(m, h);
	let g = t.method === "dcn" || t.method === "flow", _ = t.densify ?? "auto", v = _ === !1 ? 0 : _ === "auto" ? g ? Te(m) : 0 : _, y;
	if (v > 0) {
		let e = Ee(m, v);
		m = e.geometry, y = {
			inserted: e.inserted,
			spacing: e.spacing
		};
	}
	let b = t.metrics === !1 && !t.includeBaseline ? null : ge(m), x = L(m), S = Yt(), C, w, T;
	switch (t.method) {
		case "identity":
			C = x.slice();
			break;
		case "olson":
			C = Je(m, f, { fit: t.fit ?? "total" });
			break;
		case "dcn": {
			let e = Ze(m, f, {
				iterations: t.iterations ?? B.iterations,
				targetError: t.targetError ?? B.targetError,
				cutoff: t.cutoff ?? B.cutoff,
				damping: t.damping ?? B.damping,
				shapeAnchor: t.shapeAnchor ?? B.shapeAnchor,
				smoothing: t.smoothing ?? B.smoothing,
				sources: t.sources ?? B.sources,
				onIteration: t.onIteration,
				signal: t.signal
			});
			C = e.targetAreas, w = {
				iterations: e.iterations,
				meanError: e.meanError,
				converged: e.converged,
				foldRetries: e.foldRetries
			};
			break;
		}
		case "flow": {
			let e = t.grid === "auto" ? Zt(m, f, t.padding ?? V.padding) : t.grid ?? V.grid, r = {
				grid: e,
				padding: t.padding ?? V.padding,
				targetError: t.targetError ?? V.targetError,
				stepsPerRun: t.stepsPerRun ?? V.stepsPerRun,
				tolerance: t.tolerance ?? V.tolerance,
				floorCells: t.floorCells ?? V.floorCells,
				gradient: t.gradient ?? V.gradient,
				runs: t.runs ?? V.runs,
				blur: t.blur ?? V.blur,
				onIteration: t.onIteration,
				signal: t.signal
			}, i = Dt(m, f, r);
			C = i.targetAreas, T = { grid: e }, i.underResolved > 0 && n.push(`${i.underResolved} features are smaller than one grid cell and had to be given one; their areas are quantized to the grid. Increase \`grid\` for accuracy.`), w = {
				iterations: i.steps,
				meanError: i.meanError,
				converged: i.converged,
				foldRetries: 0,
				diffusionTime: i.time,
				seaFraction: i.seaFraction
			};
			break;
		}
		case "dorling":
		case "demers": {
			let e = dt(m, f, {
				shape: t.method === "demers" ? "square" : "circle",
				iterations: t.iterations ?? ut.iterations,
				anchor: t.anchor ?? ut.anchor,
				attraction: t.attraction ?? ut.attraction,
				repulsion: t.repulsion ?? ut.repulsion,
				segments: t.segments ?? ut.segments,
				fill: t.fill ?? ut.fill,
				onIteration: t.onIteration,
				signal: t.signal
			});
			m = e.geometry, C = e.targetAreas, w = {
				iterations: e.iterations,
				meanError: 0,
				converged: e.converged,
				foldRetries: 0,
				overlaps: e.overlaps
			}, e.overlaps > 0 && n.push(`${e.overlaps} pairs still overlap after relaxation`);
			break;
		}
		default: throw Error(`unknown method: ${JSON.stringify(t)}`);
	}
	let E = Yt() - S;
	if ((t.method === "flow" || t.method === "dcn") && (t.preserveTotalArea ?? !0) && b) {
		let e = x.reduce((e, t) => e + t, 0), t = L(m).reduce((e, t) => e + t, 0);
		if (e > 0 && t > 0) {
			let n = Math.sqrt(e / t), [r, i] = Ce(b, x), [a, o] = Ce(m, x);
			Se(m, n, r - a * n, i - o * n);
		}
	}
	let D = t.fitLatitude ?? 85;
	if (D !== !1 && h.name !== "none") {
		let e = Xt(m, h, D);
		e && (Se(m, e.factor, e.tx, e.ty), n.push(e.factor === 1 ? `the cartogram reached outside the world (beyond ${D} degrees of latitude) and was re-centred to bring it back in. Nothing was scaled: relative areas, size and shape are all unchanged.` : `the cartogram reached outside the world (beyond ${D} degrees of latitude) and was scaled to ${(e.factor * 100).toFixed(1)}% and re-centred to bring it back in. Relative areas are unchanged; only the overall size and position are.`));
	}
	let O = L(m), { perFeature: k, summary: ee } = Pt(O, f), A = {
		areaError: ee,
		featureCount: m.featCount,
		vertexCount: de(m),
		runtimeMs: E,
		...y ? { densification: y } : {},
		...T ? { resolved: T } : {}
	}, j;
	if (b) {
		A.topology = ct(b, m), A.orientation = Bt(b, m), A.selfIntersections = Wt(m);
		let e = zt(b, m);
		j = e.compactnessDrift, A.shape = {
			meanCompactnessDrift: e.meanCompactnessDrift,
			maxCompactnessDrift: e.maxCompactnessDrift,
			meanPositiveDrift: e.meanPositiveDrift,
			fractionRounder: e.fractionRounder,
			meanDetailRetention: e.meanDetailRetention
		};
	}
	let te = d.map((e, t) => ({
		index: e.index,
		id: e.feature.id,
		value: f[t],
		inputArea: x[t],
		targetArea: C[t],
		outputArea: O[t],
		error: k[t],
		substituted: p[t],
		...j ? { compactnessDrift: j[t] } : {}
	}));
	t.unproject !== !1 && Be(m, h);
	let M = he(m).map((e) => t.unproject !== !1 && h.name !== "none" ? He(e) : e), N = /* @__PURE__ */ new Map();
	d.forEach((e, t) => N.set(e.index, t));
	let ne = new Set(c.map((e) => i[e].index)), re = [];
	r.features.forEach((e, t) => {
		let n = N.get(t);
		n === void 0 ? ne.has(t) || re.push(e) : re.push({
			...e,
			geometry: M[n]
		});
	});
	let P = {
		featureCollection: {
			...r,
			type: "FeatureCollection",
			features: re
		},
		diagnostics: te,
		metrics: A,
		warnings: n
	};
	if (w && (P.iteration = w), t.includeBaseline && b) {
		t.unproject !== !1 && Be(b, h);
		let e = he(b);
		P.baseline = {
			type: "FeatureCollection",
			features: d.map((t, n) => ({
				...t.feature,
				geometry: e[n]
			}))
		};
	}
	return P;
}
function Yt() {
	return typeof performance < "u" ? performance.now() : Date.now();
}
function Xt(e, t, n) {
	let r = e.coords;
	if (r.length === 0) return null;
	let i = Infinity, a = -Infinity, o = Infinity, s = -Infinity;
	for (let e = 0; e < r.length; e += 2) r[e] < i && (i = r[e]), r[e] > a && (a = r[e]), r[e + 1] < o && (o = r[e + 1]), r[e + 1] > s && (s = r[e + 1]);
	let c = (i + a) / 2, l = (o + s) / 2, u = (e) => ({
		factor: e,
		tx: -e * c,
		ty: -e * l
	}), d = (e, i, a) => {
		for (let o = 0; o < r.length; o += 2) {
			let [, s] = t.inverse(r[o] * e + i, r[o + 1] * e + a);
			if (!(Math.abs(s) <= n)) return !1;
		}
		return !0;
	}, f = (e) => {
		let { tx: t, ty: n } = u(e);
		return d(e, t, n);
	};
	if (d(1, 0, 0)) return null;
	if (f(1)) return u(1);
	let p = 0, m = 1;
	for (let e = 0; e < 40; e++) {
		let e = (p + m) / 2;
		f(e) ? p = e : m = e;
	}
	return u(p);
}
function Zt(e, t, n) {
	let r = L(e), i = e.featCount, a = 0;
	for (let e = 0; e < i; e++) a += t[e];
	if (!(a > 0) || i === 0) return V.grid;
	let o = a / (10 * i), s = Infinity;
	for (let e = 0; e < i; e++) t[e] >= o && r[e] > 0 && r[e] < s && (s = r[e]);
	if (!Number.isFinite(s)) return V.grid;
	let [c, l, u, d] = xe(e), f = Math.max(u - c, d - l) * n / Math.sqrt(s), p = 1 << Math.ceil(Math.log2(Math.max(f, 1)));
	return Math.min(1024, Math.max(V.grid, p));
}
//#endregion
//#region src/utils/cartogram.ts
var Qt = .05, $t = 64, en = 60, H = 6371008.8, U = Math.PI / 180, tn = 180 / Math.PI;
function nn(e, t) {
	let n = _(e);
	if (t <= 0 || n.length < 2) return {
		geometry: e,
		dropped: 0,
		areaDropped: 0
	};
	let r = n.map((e) => ({
		polygon: e,
		area: g({
			type: "Polygon",
			coordinates: e
		})
	})), i = r.reduce((e, t) => e + t.area, 0);
	if (!i) return {
		geometry: e,
		dropped: 0,
		areaDropped: 0
	};
	let a = 0;
	for (let e = 1; e < r.length; e++) r[e].area > r[a].area && (a = e);
	let o = r.filter((e, n) => n === a || e.area / i >= t);
	if (o.length === r.length) return {
		geometry: e,
		dropped: 0,
		areaDropped: 0
	};
	let s = i - o.reduce((e, t) => e + t.area, 0), c = o.map((e) => e.polygon);
	return {
		geometry: c.length === 1 ? {
			type: "Polygon",
			coordinates: c[0]
		} : {
			type: "MultiPolygon",
			coordinates: c
		},
		dropped: r.length - o.length,
		areaDropped: s
	};
}
function rn(e) {
	return an(_(e));
}
function an(e) {
	let t = 0, n = 0, r = 0, i = on(e);
	for (let a of e) {
		let e = a[0]?.map(([e, t]) => [e < 0 ? e + i : e, t]);
		if (!e || e.length < 4) continue;
		let o = 0, s = 0, c = 0;
		for (let t = 0; t < e.length - 1; t++) {
			let n = e[t][0] * e[t + 1][1] - e[t + 1][0] * e[t][1];
			c += n, o += (e[t][0] + e[t + 1][0]) * n, s += (e[t][1] + e[t + 1][1]) * n;
		}
		if (c /= 2, Math.abs(c) < 1e-12) continue;
		let l = Math.abs(c);
		t += o / (6 * c) * l, n += s / (6 * c) * l, r += l;
	}
	return r ? [gn(t / r), n / r] : null;
}
function on(e) {
	let t = Infinity, n = -Infinity, r = Infinity, i = -Infinity;
	for (let a of e) for (let e of a) for (let [a] of e) {
		let e = a < 0 ? a + 360 : a;
		t = Math.min(t, a), n = Math.max(n, a), r = Math.min(r, e), i = Math.max(i, e);
	}
	return i - r < n - t ? 360 : 0;
}
function sn([e, t]) {
	let n = e * U, r = t * U, i = Math.sin(r), a = Math.cos(r);
	return {
		forward([e, t]) {
			let r = e * U, o = t * U, s = Math.cos(o), c = Math.sin(o), l = Math.cos(r - n), u = 1 + i * c + a * s * l;
			if (u <= 1e-12) return [0, 0];
			let d = H * Math.sqrt(2 / u);
			return [d * s * Math.sin(r - n), d * (a * c - i * s * l)];
		},
		inverse([r, o]) {
			let s = Math.hypot(r, o);
			if (s < 1e-9) return [e, t];
			let c = 2 * Math.asin(Math.min(s / (2 * H), 1)), l = Math.sin(c), u = Math.cos(c), d = Math.asin(u * i + o * l * a / s);
			return [gn((n + Math.atan2(r * l, s * a * u - o * i * l)) * tn), d * tn];
		}
	};
}
var W = 180;
function cn(e) {
	if (e.type === "Polygon") {
		let t = ln(e.coordinates);
		return t ? t.length === 1 ? {
			type: "Polygon",
			coordinates: t[0]
		} : {
			type: "MultiPolygon",
			coordinates: t
		} : e;
	}
	if (e.type === "MultiPolygon") {
		let t = [], n = !1;
		for (let r of e.coordinates) {
			let e = ln(r);
			e ? (n = !0, t.push(...e)) : t.push(r);
		}
		return n ? {
			type: "MultiPolygon",
			coordinates: t
		} : e;
	}
	return e;
}
function ln(e) {
	if (!e.length) return null;
	let t = dn(e[0]);
	if (!t) return un(e);
	let n = [];
	for (let r of e.slice(1)) {
		let e = dn(r, fn(t));
		e && n.push(e);
	}
	let r = [];
	for (let e of [
		-2 * W,
		0,
		2 * W
	]) {
		let i = pn(t, e);
		if (!i) continue;
		let a = [i];
		for (let t of n) {
			let n = pn(t, e);
			n && a.push(n);
		}
		r.push(a);
	}
	return r.length ? r : null;
}
function un(e) {
	let t = !1, n = e.map((e) => e.map(([e, n]) => ((e > W || e < -180) && (t = !0), [Math.min(Math.max(e, -180), W), n])));
	return t ? [n] : null;
}
function dn(e, t) {
	if (e.length < 4) return null;
	let n = [e[0]], r = Math.abs(e[0][0]) > W;
	for (let t = 1; t < e.length; t++) {
		let i = n[t - 1][0], a = i + v(i, e[t][0]);
		r ||= Math.abs(a) > W, n.push([a, e[t][1]]);
	}
	if (Math.abs(n[n.length - 1][0] - n[0][0]) > 1.5 * W) return null;
	let i = Math.round((fn(n) - (t ?? 0)) / (2 * W));
	return !i && !r ? null : i ? n.map(([e, t]) => [e - i * 2 * W, t]) : n;
}
function fn(e) {
	let t = 0;
	for (let [n] of e) t += n;
	return t / e.length;
}
function pn(e, t) {
	let n = e.length > 1 && e[0][0] === e[e.length - 1][0] && e[0][1] === e[e.length - 1][1] ? e.slice(0, -1) : e, r = t ? n.map(([e, n]) => [e + t, n]) : n;
	if (r = mn(r, -180, !0), r = mn(r, W, !1), r.length < 3) return null;
	let i = [...r, r[0]];
	return Math.abs(hn(i)) < 1e-9 ? null : i;
}
function mn(e, t, n) {
	let r = (e) => n ? e[0] >= t : e[0] <= t, i = [];
	for (let n = 0; n < e.length; n++) {
		let a = e[n], o = e[(n + e.length - 1) % e.length];
		if (r(a) !== r(o)) {
			let e = (t - o[0]) / (a[0] - o[0]);
			i.push([t, o[1] + e * (a[1] - o[1])]);
		}
		r(a) && i.push(a);
	}
	return i;
}
function hn(e) {
	let t = 0;
	for (let n = 0; n < e.length - 1; n++) t += e[n][0] * e[n + 1][1] - e[n + 1][0] * e[n][1];
	return t / 2;
}
function gn(e) {
	return e > 180 ? e - 360 * Math.ceil((e - 180) / 360) : e < -180 ? e + 360 * Math.ceil((-e - 180) / 360) : e;
}
function _n(e, t) {
	let n = (e) => Array.isArray(e) ? typeof e[0] == "number" ? t(e) : e.map(n) : e;
	return e.type === "GeometryCollection" ? {
		...e,
		geometries: e.geometries.map((e) => _n(e, t))
	} : {
		...e,
		coordinates: n(e.coordinates)
	};
}
function vn(e, t, n) {
	let r = sn(n);
	return _n(e, (e) => {
		let [n, i] = r.forward(e);
		return r.inverse([n * t, i * t]);
	});
}
function yn(e, t) {
	let n = _(e);
	if (n.length <= 1) {
		let r = an(n);
		return r ? vn(e, t, r) : e;
	}
	let r = [];
	for (let e of n) {
		let n = an([e]);
		if (!n) continue;
		let i = vn({
			type: "Polygon",
			coordinates: e
		}, t, n);
		r.push(i.coordinates);
	}
	return {
		type: "MultiPolygon",
		coordinates: r
	};
}
function bn(e, t) {
	let n = sn(e), r = [];
	for (let e = 0; e <= $t; e++) {
		let i = e / $t * 2 * Math.PI;
		r.push(n.inverse([t * Math.cos(i), t * Math.sin(i)]));
	}
	return {
		type: "Polygon",
		coordinates: [r]
	};
}
function xn(e) {
	let t = !1, n = _n(e, ([e, n, ...r]) => {
		let i = gn(e), a = Math.min(Math.max(n, -90), 90);
		return (i !== e || a !== n) && (t = !0), [
			i,
			a,
			...r
		];
	});
	return t ? n : e;
}
function Sn(e, t, n = 0, r = 0) {
	let i = [], a = {
		missingValue: 0,
		zeroValue: 0,
		negativeValue: 0,
		noArea: 0,
		belowMinimum: 0
	}, o = 0, s = 0, c = 0;
	for (let n of e.features) {
		let e = n.geometry ? nn(n.geometry, r / 100) : null;
		e && (o += e.dropped, s += e.areaDropped);
		let l = e ? {
			...n,
			geometry: xn(e.geometry)
		} : n, u = l.properties?.[t], d = typeof u == "number" || typeof u == "string" ? Number(u) : NaN;
		if (u == null || u === "" || !Number.isFinite(d)) {
			a.missingValue++;
			continue;
		}
		if (d === 0) {
			a.zeroValue++;
			continue;
		}
		if (d < 0) {
			a.negativeValue++;
			continue;
		}
		let f = g(l.geometry), p = rn(l.geometry);
		if (!f || !p) {
			a.noArea++;
			continue;
		}
		c += f, i.push({
			feature: l,
			value: d,
			area: f,
			centre: p
		});
	}
	let l = {
		count: o,
		areaShare: c + s > 0 ? s / (c + s) : 0
	};
	if (n > 0 && i.length) {
		let e = i.reduce((e, t) => e + t.value, 0) * n / 100, t = i.filter((t) => t.value >= e);
		return a.belowMinimum = i.length - t.length, {
			units: t,
			skipped: a,
			droppedParts: l
		};
	}
	return {
		units: i,
		skipped: a,
		droppedParts: l
	};
}
async function Cn(e, t) {
	let n = t.method !== "scaled" && t.method !== "dorling" ? t.minPartPercent ?? Qt : 0, { units: r, skipped: i, droppedParts: a } = Sn(e, t.field, t.minValuePercent ?? 0, n);
	if (!r.length) throw Error(`No features have a usable number in "${t.field}".`);
	let o = r.reduce((e, t) => e + t.area, 0) / r.reduce((e, t) => e + t.value, 0), s = null, c = [], l = (t.method === "dorling" ? Wn(r, o, t.iterations ?? en) : t.method === "scaled" ? Un(r, o) : t.method === "contiguous" ? Ln(r, o, t.passes ?? Fn) : t.method === "flow" ? (() => {
		let e = Tn(r, t.onProgress);
		return s = e.medianAreaError, c = e.warnings, e.features;
	})() : await wn(r, t.wasmUrl)).map((e) => e.geometry ? {
		...e,
		geometry: cn(e.geometry)
	} : e);
	return {
		features: {
			type: "FeatureCollection",
			features: l
		},
		skipped: i,
		droppedParts: a,
		medianAreaError: s ?? On(l, r, o),
		methodWarnings: c
	};
}
async function wn(e, t) {
	let n = await Mn(t), r = Kn(e), i = {
		type: "FeatureCollection",
		features: e.map((e, t) => ({
			type: "Feature",
			properties: {
				[kn]: e.value,
				[An]: t
			},
			geometry: Dn(_n(e.feature.geometry, (e) => r.forward(e)))
		}))
	};
	return n.makeCartogram(i, kn).features.map((t, n) => {
		let i = Number(t.properties?.[An] ?? n);
		if (!t.geometry || !("coordinates" in t.geometry)) throw Error("The diffusion cartogram could not use this layer's geometry. Try the classic method, or repair the polygons first.");
		return {
			type: "Feature",
			properties: { ...e[i]?.feature.properties ?? {} },
			geometry: _n(t.geometry, (e) => r.inverse(e))
		};
	});
}
function Tn(e, t) {
	let n = Jt({
		type: "FeatureCollection",
		features: e.map((e, t) => ({
			type: "Feature",
			properties: {
				[kn]: e.value,
				[An]: t
			},
			geometry: e.feature.geometry
		}))
	}, {
		method: "flow",
		value: kn,
		missing: "error",
		metrics: !0,
		grid: "auto",
		...t ? { onIteration: (e) => t(e) } : {}
	}), r = n.featureCollection.features.map((t, n) => ({
		type: "Feature",
		properties: { ...e[Number(t.properties?.[An] ?? n)]?.feature.properties ?? {} },
		geometry: t.geometry
	})), i = (n.warnings ?? []).filter((e) => !e.includes("reached outside the world"));
	return {
		features: r,
		medianAreaError: En(n.diagnostics),
		warnings: i
	};
}
function En(e) {
	if (!e || e.length === 0) return 0;
	let t = 0;
	for (let n of e) Number.isFinite(n.value) && n.value > 0 && (t += n.value);
	if (!(t > 0)) return e.reduce((e, t) => e + (Number.isFinite(t.error) ? t.error : 0), 0) / e.length;
	let n = 0;
	for (let r of e) !Number.isFinite(r.error) || !Number.isFinite(r.value) || r.value <= 0 || (n += r.error * (r.value / t));
	return n;
}
function Dn(e) {
	let t = (e, t) => {
		let n = 0;
		for (let t = 0; t < e.length; t++) {
			let r = e[(t + 1) % e.length];
			n += e[t][0] * r[1] - r[0] * e[t][1];
		}
		return n > 0 === t ? [...e].reverse() : e;
	}, n = (e) => e.map((e, n) => t(e, n === 0));
	return e.type === "Polygon" ? {
		...e,
		coordinates: n(e.coordinates)
	} : e.type === "MultiPolygon" ? {
		...e,
		coordinates: e.coordinates.map(n)
	} : e;
}
function On(e, t, n) {
	if (!e.length) return 0;
	let r = e.map((e, r) => {
		let i = (t[r]?.value ?? 0) * n;
		return i ? Math.abs(g(e.geometry) - i) / i : null;
	}).filter((e) => e !== null).sort((e, t) => e - t);
	return r.length ? r[r.length >> 1] : 0;
}
var kn = "__webmapx_value", An = "__webmapx_index", jn = /* @__PURE__ */ new Map();
function Mn(e) {
	let t = e ?? "", n = jn.get(t);
	if (n) return n;
	let r = import("./go-cart-BMiCUJx7.js").then((t) => t.default(e ? { locateFile: () => e } : void 0)).catch((e) => {
		throw jn.delete(t), e;
	});
	return jn.set(t, r), r;
}
var Nn = 1e-4, Pn = 4, Fn = 12, In = .02;
function Ln(e, t, n) {
	let r = Kn(e), { xs: i, ys: a, ringStart: o, ringEnd: s, shapes: c } = Rn(e, r, t), l = new Float64Array(c.length), u = new Float64Array(c.length), d = new Float64Array(c.length), f = new Float64Array(c.length);
	for (let e = 0; e < n; e++) {
		let e = 0;
		for (let t = 0; t < c.length; t++) {
			let n = c[t], r = zn(n, i, a, o, s), p = Vn(n, i, a, o, s);
			l[t] = p[0], u[t] = p[1], d[t] = Math.sqrt(Math.abs(r) / Math.PI), f[t] = Math.sqrt(n.target / Math.PI) - d[t], e += Math.abs(n.target - r) / Math.max(n.target, r, 1);
		}
		let t = e / c.length;
		if (t < In) break;
		let n = 1 / (1 + t);
		for (let e = 0; e < i.length; e++) {
			let t = i[e], r = a[e], o = 0, s = 0;
			for (let e = 0; e < c.length; e++) {
				let n = d[e];
				if (n <= 0) continue;
				let i = t - l[e], a = r - u[e], c = Math.sqrt(i * i + a * a);
				if (c < 1e-9) continue;
				let p = c / n, m = c > n ? f[e] / p : f[e] * p * p * (4 - 3 * p);
				o += i / c * m, s += a / c * m;
			}
			i[e] = t + o * n, a[e] = r + s * n;
		}
	}
	return c.map((e) => ({
		type: "Feature",
		properties: { ...e.unit.feature.properties ?? {} },
		geometry: Hn(e.polygons.map((e) => e.map((e) => {
			let t = [];
			for (let n = o[e]; n < s[e]; n++) t.push(r.inverse([i[n], a[n]]));
			return t;
		})))
	}));
}
function Rn(e, t, n) {
	let r = [], i = [], a = [], o = [], s = [];
	for (let c of e) {
		let e = [];
		for (let n of _(c.feature.geometry)) {
			let s = [];
			for (let e of n) {
				a.push(r.length);
				for (let n of e) {
					let [e, a] = t.forward(n);
					r.push(e), i.push(a);
				}
				o.push(r.length), s.push(a.length - 1);
			}
			e.push(s);
		}
		s.push({
			unit: c,
			target: c.value * n,
			polygons: e
		});
	}
	return {
		xs: Float64Array.from(r),
		ys: Float64Array.from(i),
		ringStart: Int32Array.from(a),
		ringEnd: Int32Array.from(o),
		shapes: s
	};
}
function zn(e, t, n, r, i) {
	let a = 0;
	for (let o of e.polygons) {
		let e = 0, s = 0;
		o.forEach((a, o) => {
			let c = Math.abs(Bn(a, t, n, r, i));
			o === 0 ? e = c : s += c;
		}), a += Math.max(e - s, 0);
	}
	return a;
}
function Bn(e, t, n, r, i) {
	let a = 0;
	for (let o = r[e]; o < i[e] - 1; o++) a += t[o] * n[o + 1] - t[o + 1] * n[o];
	return a / 2;
}
function Vn(e, t, n, r, i) {
	let a = 0, o = 0, s = 0;
	for (let c of e.polygons) {
		let e = c[0];
		if (e === void 0) continue;
		let l = 0, u = 0, d = 0;
		for (let a = r[e]; a < i[e] - 1; a++) {
			let e = t[a] * n[a + 1] - t[a + 1] * n[a];
			d += e, l += (t[a] + t[a + 1]) * e, u += (n[a] + n[a + 1]) * e;
		}
		if (d /= 2, Math.abs(d) < 1e-12) continue;
		let f = Math.abs(d);
		a += l / (6 * d) * f, o += u / (6 * d) * f, s += f;
	}
	return s ? [a / s, o / s] : [0, 0];
}
function Hn(e) {
	return e.length === 1 ? {
		type: "Polygon",
		coordinates: e[0]
	} : {
		type: "MultiPolygon",
		coordinates: e
	};
}
function Un(e, t) {
	return e.map((e) => {
		let n = e.value * t, r = Math.sqrt(n / e.area), i = yn(e.feature.geometry, r);
		for (let t = 0; t < Pn; t++) {
			let t = g(i);
			if (!t) break;
			let a = t / n - 1;
			if (Math.abs(a) < Nn) break;
			r *= Math.sqrt(n / t), i = yn(e.feature.geometry, r);
		}
		return {
			type: "Feature",
			properties: {
				...e.feature.properties ?? {},
				cartogram_scale: Yn(r)
			},
			geometry: i
		};
	});
}
function Wn(e, t, n) {
	let r = e.reduce((e, t) => e + t.centre[1], 0) / e.length, i = Jn(e.reduce((e, t) => e + t.centre[0], 0) / e.length, r), a = e.map((e) => {
		let [n, r] = i.forward(e.centre);
		return {
			unit: e,
			x: n,
			y: r,
			r: Math.sqrt(e.value * t / Math.PI)
		};
	});
	for (let e = 0; e < n; e++) {
		let e = !1;
		for (let t = 0; t < a.length; t++) for (let n = t + 1; n < a.length; n++) {
			let r = a[t], o = a[n], s = o.x - r.x, c = o.y - r.y, l = Math.hypot(s, c), u = r.r + o.r;
			if (l >= u) continue;
			l < 1e-9 && (s = 1, c = 0, l = 1);
			let d = (u - l) / 2, f = s / l * d, p = c / l * d;
			r.x -= f, r.y = Gn(r.y - p, i), o.x += f, o.y = Gn(o.y + p, i), e = !0;
		}
		if (!e) break;
	}
	return a.map((e) => {
		let t = i.inverse([e.x, e.y]);
		return {
			type: "Feature",
			properties: {
				...e.unit.feature.properties ?? {},
				cartogram_radius_m: Math.round(e.r)
			},
			geometry: bn(t, e.r)
		};
	});
}
function Gn(e, t) {
	let n = t.forward([0, 88])[1];
	return Math.min(Math.max(e, -n), n);
}
function Kn(e) {
	let t = Infinity, n = -Infinity, r = Infinity, i = -Infinity, a = 0, o = 0;
	for (let { centre: s } of e) t = Math.min(t, s[0]), n = Math.max(n, s[0]), r = Math.min(r, s[1]), i = Math.max(i, s[1]), a += s[0], o += s[1];
	let s = Math.max(n - t, i - r), c = [a / e.length, o / e.length];
	return s < 40 ? sn(c) : qn(c[0]);
}
function qn(e) {
	let t = 1.340264, n = -.081106, r = 893e-6, i = .003796, a = Math.sqrt(3) / 2, o = (e) => t + n * e * e + e ** 6 * (r + i * e * e), s = (e) => t + 3 * n * e * e + e ** 6 * (7 * r + 9 * i * e * e);
	return {
		forward([t, n]) {
			let r = v(e, t) * U, i = Math.asin(a * Math.sin(n * U));
			return [H * r * Math.cos(i) / (a * s(i)), H * i * o(i)];
		},
		inverse([t, n]) {
			let r = n / H;
			for (let e = 0; e < 12; e++) {
				let e = (r * o(r) - n / H) / s(r);
				if (r -= e, Math.abs(e) < 1e-12) break;
			}
			let i = Math.min(Math.max(Math.sin(r) / a, -1), 1);
			return [e + a * t * s(r) / (H * Math.max(Math.cos(r), 1e-6)) * tn, Math.asin(i) * tn];
		}
	};
}
function Jn(e, t) {
	let n = Math.max(Math.cos(t * U), .05);
	return {
		forward([t, r]) {
			return [H * (t - e) * U * n, H * Math.sin(r * U) / n];
		},
		inverse([t, r]) {
			let i = Math.min(Math.max(r * n / H, -1), 1);
			return [e + t / (H * n) * tn, Math.asin(i) * tn];
		}
	};
}
function Yn(e) {
	return Math.round(e * 1e3) / 1e3;
}
//#endregion
//#region node_modules/topojson-server/src/object.js
var Xn = Object.prototype.hasOwnProperty;
//#endregion
//#region node_modules/topojson-server/src/bounds.js
function Zn(e) {
	var t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	function a(e) {
		e != null && Xn.call(o, e.type) && o[e.type](e);
	}
	var o = {
		GeometryCollection: function(e) {
			e.geometries.forEach(a);
		},
		Point: function(e) {
			s(e.coordinates);
		},
		MultiPoint: function(e) {
			e.coordinates.forEach(s);
		},
		LineString: function(e) {
			c(e.arcs);
		},
		MultiLineString: function(e) {
			e.arcs.forEach(c);
		},
		Polygon: function(e) {
			e.arcs.forEach(c);
		},
		MultiPolygon: function(e) {
			e.arcs.forEach(l);
		}
	};
	function s(e) {
		var a = e[0], o = e[1];
		a < t && (t = a), a > r && (r = a), o < n && (n = o), o > i && (i = o);
	}
	function c(e) {
		e.forEach(s);
	}
	function l(e) {
		e.forEach(c);
	}
	for (var u in e) a(e[u]);
	return r >= t && i >= n ? [
		t,
		n,
		r,
		i
	] : void 0;
}
//#endregion
//#region node_modules/topojson-server/src/hash/hashset.js
function Qn(e, t, n, r, i) {
	arguments.length === 3 && (r = Array, i = null);
	for (var a = new r(e = 1 << Math.max(4, Math.ceil(Math.log(e) / Math.LN2))), o = e - 1, s = 0; s < e; ++s) a[s] = i;
	function c(r) {
		for (var s = t(r) & o, c = a[s], l = 0; c != i;) {
			if (n(c, r)) return !0;
			if (++l >= e) throw Error("full hashset");
			c = a[s = s + 1 & o];
		}
		return a[s] = r, !0;
	}
	function l(r) {
		for (var s = t(r) & o, c = a[s], l = 0; c != i;) {
			if (n(c, r)) return !0;
			if (++l >= e) break;
			c = a[s = s + 1 & o];
		}
		return !1;
	}
	function u() {
		for (var e = [], t = 0, n = a.length; t < n; ++t) {
			var r = a[t];
			r != i && e.push(r);
		}
		return e;
	}
	return {
		add: c,
		has: l,
		values: u
	};
}
//#endregion
//#region node_modules/topojson-server/src/hash/hashmap.js
function $n(e, t, n, r, i, a) {
	arguments.length === 3 && (r = a = Array, i = null);
	for (var o = new r(e = 1 << Math.max(4, Math.ceil(Math.log(e) / Math.LN2))), s = new a(e), c = e - 1, l = 0; l < e; ++l) o[l] = i;
	function u(r, a) {
		for (var l = t(r) & c, u = o[l], d = 0; u != i;) {
			if (n(u, r)) return s[l] = a;
			if (++d >= e) throw Error("full hashmap");
			u = o[l = l + 1 & c];
		}
		return o[l] = r, s[l] = a, a;
	}
	function d(r, a) {
		for (var l = t(r) & c, u = o[l], d = 0; u != i;) {
			if (n(u, r)) return s[l];
			if (++d >= e) throw Error("full hashmap");
			u = o[l = l + 1 & c];
		}
		return o[l] = r, s[l] = a, a;
	}
	function f(r, a) {
		for (var l = t(r) & c, u = o[l], d = 0; u != i;) {
			if (n(u, r)) return s[l];
			if (++d >= e) break;
			u = o[l = l + 1 & c];
		}
		return a;
	}
	function p() {
		for (var e = [], t = 0, n = o.length; t < n; ++t) {
			var r = o[t];
			r != i && e.push(r);
		}
		return e;
	}
	return {
		set: u,
		maybeSet: d,
		get: f,
		keys: p
	};
}
//#endregion
//#region node_modules/topojson-server/src/hash/point-equal.js
function G(e, t) {
	return e[0] === t[0] && e[1] === t[1];
}
//#endregion
//#region node_modules/topojson-server/src/hash/point-hash.js
var er = /* @__PURE__ */ new ArrayBuffer(16), tr = new Float64Array(er), nr = new Uint32Array(er);
function rr(e) {
	tr[0] = e[0], tr[1] = e[1];
	var t = nr[0] ^ nr[1];
	return t = t << 5 ^ t >> 7 ^ nr[2] ^ nr[3], t & 2147483647;
}
//#endregion
//#region node_modules/topojson-server/src/join.js
function ir(e) {
	var t = e.coordinates, n = e.lines, r = e.rings, i = S(), a = new Int32Array(t.length), o = new Int32Array(t.length), s = new Int32Array(t.length), c = new Int8Array(t.length), l = 0, u, d, f, p, m;
	for (u = 0, d = t.length; u < d; ++u) a[u] = o[u] = s[u] = -1;
	for (u = 0, d = n.length; u < d; ++u) {
		var h = n[u], g = h[0], _ = h[1];
		for (p = i[g], m = i[++g], ++l, c[p] = 1; ++g <= _;) x(u, f = p, p = m, m = i[g]);
		++l, c[m] = 1;
	}
	for (u = 0, d = t.length; u < d; ++u) a[u] = -1;
	for (u = 0, d = r.length; u < d; ++u) {
		var v = r[u], y = v[0] + 1, b = v[1];
		for (f = i[b - 1], p = i[y - 1], m = i[y], x(u, f, p, m); ++y <= b;) x(u, f = p, p = m, m = i[y]);
	}
	function x(e, t, n, r) {
		if (a[n] !== e) {
			a[n] = e;
			var i = o[n];
			if (i >= 0) {
				var u = s[n];
				(i !== t || u !== r) && (i !== r || u !== t) && (++l, c[n] = 1);
			} else o[n] = t, s[n] = r;
		}
	}
	function S() {
		for (var e = $n(t.length * 1.4, C, w, Int32Array, -1, Int32Array), n = new Int32Array(t.length), r = 0, i = t.length; r < i; ++r) n[r] = e.maybeSet(r, r);
		return n;
	}
	function C(e) {
		return rr(t[e]);
	}
	function w(e, n) {
		return G(t[e], t[n]);
	}
	a = o = s = null;
	var T = Qn(l * 1.4, rr, G), E;
	for (u = 0, d = t.length; u < d; ++u) c[E = i[u]] && T.add(t[E]);
	return T;
}
//#endregion
//#region node_modules/topojson-server/src/cut.js
function ar(e) {
	var t = ir(e), n = e.coordinates, r = e.lines, i = e.rings, a, o, s;
	for (o = 0, s = r.length; o < s; ++o) for (var c = r[o], l = c[0], u = c[1]; ++l < u;) t.has(n[l]) && (a = {
		0: l,
		1: c[1]
	}, c[1] = l, c = c.next = a);
	for (o = 0, s = i.length; o < s; ++o) for (var d = i[o], f = d[0], p = f, m = d[1], h = t.has(n[f]); ++p < m;) t.has(n[p]) && (h ? (a = {
		0: p,
		1: d[1]
	}, d[1] = p, d = d.next = a) : (or(n, f, m, m - p), n[m] = n[f], h = !0, p = f));
	return e;
}
function or(e, t, n, r) {
	sr(e, t, n), sr(e, t, t + r), sr(e, t + r, n);
}
function sr(e, t, n) {
	for (var r = t + (n-- - t >> 1), i; t < r; ++t, --n) i = e[t], e[t] = e[n], e[n] = i;
}
//#endregion
//#region node_modules/topojson-server/src/dedup.js
function cr(e) {
	var t = e.coordinates, n = e.lines, r, i = e.rings, a, o = n.length + i.length, s, c;
	for (delete e.lines, delete e.rings, s = 0, c = n.length; s < c; ++s) for (r = n[s]; r = r.next;) ++o;
	for (s = 0, c = i.length; s < c; ++s) for (a = i[s]; a = a.next;) ++o;
	var l = $n(o * 2 * 1.4, rr, G), u = e.arcs = [];
	for (s = 0, c = n.length; s < c; ++s) {
		r = n[s];
		do
			d(r);
		while (r = r.next);
	}
	for (s = 0, c = i.length; s < c; ++s) if (a = i[s], a.next) do
		d(a);
	while (a = a.next);
	else f(a);
	function d(e) {
		var n, r, i, a, o, s, c, d;
		if (i = l.get(n = t[e[0]])) {
			for (c = 0, d = i.length; c < d; ++c) if (a = i[c], p(a, e)) {
				e[0] = a[0], e[1] = a[1];
				return;
			}
		}
		if (o = l.get(r = t[e[1]])) {
			for (c = 0, d = o.length; c < d; ++c) if (s = o[c], m(s, e)) {
				e[1] = s[0], e[0] = s[1];
				return;
			}
		}
		i ? i.push(e) : l.set(n, [e]), o ? o.push(e) : l.set(r, [e]), u.push(e);
	}
	function f(e) {
		var n, r, i, a, o;
		if (r = l.get(n = t[e[0]])) for (a = 0, o = r.length; a < o; ++a) {
			if (i = r[a], h(i, e)) {
				e[0] = i[0], e[1] = i[1];
				return;
			}
			if (g(i, e)) {
				e[0] = i[1], e[1] = i[0];
				return;
			}
		}
		if (r = l.get(n = t[e[0] + _(e)])) for (a = 0, o = r.length; a < o; ++a) {
			if (i = r[a], h(i, e)) {
				e[0] = i[0], e[1] = i[1];
				return;
			}
			if (g(i, e)) {
				e[0] = i[1], e[1] = i[0];
				return;
			}
		}
		r ? r.push(e) : l.set(n, [e]), u.push(e);
	}
	function p(e, n) {
		var r = e[0], i = n[0], a = e[1], o = n[1];
		if (r - a !== i - o) return !1;
		for (; r <= a; ++r, ++i) if (!G(t[r], t[i])) return !1;
		return !0;
	}
	function m(e, n) {
		var r = e[0], i = n[0], a = e[1], o = n[1];
		if (r - a !== i - o) return !1;
		for (; r <= a; ++r, --o) if (!G(t[r], t[o])) return !1;
		return !0;
	}
	function h(e, n) {
		var r = e[0], i = n[0], a = e[1], o = n[1], s = a - r;
		if (s !== o - i) return !1;
		for (var c = _(e), l = _(n), u = 0; u < s; ++u) if (!G(t[r + (u + c) % s], t[i + (u + l) % s])) return !1;
		return !0;
	}
	function g(e, n) {
		var r = e[0], i = n[0], a = e[1], o = n[1], s = a - r;
		if (s !== o - i) return !1;
		for (var c = _(e), l = s - _(n), u = 0; u < s; ++u) if (!G(t[r + (u + c) % s], t[o - (u + l) % s])) return !1;
		return !0;
	}
	function _(e) {
		for (var n = e[0], r = e[1], i = n, a = i, o = t[i]; ++i < r;) {
			var s = t[i];
			(s[0] < o[0] || s[0] === o[0] && s[1] < o[1]) && (a = i, o = s);
		}
		return a - n;
	}
	return e;
}
//#endregion
//#region node_modules/topojson-server/src/delta.js
function lr(e) {
	for (var t = -1, n = e.length; ++t < n;) {
		for (var r = e[t], i = 0, a = 1, o = r.length, s = r[0], c = s[0], l = s[1], u, d; ++i < o;) s = r[i], u = s[0], d = s[1], (u !== c || d !== l) && (r[a++] = [u - c, d - l], c = u, l = d);
		a === 1 && (r[a++] = [0, 0]), r.length = a;
	}
	return e;
}
//#endregion
//#region node_modules/topojson-server/src/extract.js
function ur(e) {
	var t = -1, n = [], r = [], i = [];
	function a(e) {
		e && Xn.call(o, e.type) && o[e.type](e);
	}
	var o = {
		GeometryCollection: function(e) {
			e.geometries.forEach(a);
		},
		LineString: function(e) {
			e.arcs = s(e.arcs);
		},
		MultiLineString: function(e) {
			e.arcs = e.arcs.map(s);
		},
		Polygon: function(e) {
			e.arcs = e.arcs.map(c);
		},
		MultiPolygon: function(e) {
			e.arcs = e.arcs.map(l);
		}
	};
	function s(e) {
		for (var r = 0, a = e.length; r < a; ++r) i[++t] = e[r];
		var o = {
			0: t - a + 1,
			1: t
		};
		return n.push(o), o;
	}
	function c(e) {
		for (var n = 0, a = e.length; n < a; ++n) i[++t] = e[n];
		var o = {
			0: t - a + 1,
			1: t
		};
		return r.push(o), o;
	}
	function l(e) {
		return e.map(c);
	}
	for (var u in e) a(e[u]);
	return {
		type: "Topology",
		coordinates: i,
		lines: n,
		rings: r,
		objects: e
	};
}
//#endregion
//#region node_modules/topojson-server/src/geometry.js
function dr(e) {
	var t = {}, n;
	for (n in e) t[n] = fr(e[n]);
	return t;
}
function fr(e) {
	return e == null ? { type: null } : (e.type === "FeatureCollection" ? pr : e.type === "Feature" ? mr : hr)(e);
}
function pr(e) {
	var t = {
		type: "GeometryCollection",
		geometries: e.features.map(mr)
	};
	return e.bbox != null && (t.bbox = e.bbox), t;
}
function mr(e) {
	var t = hr(e.geometry), n;
	for (n in e.id != null && (t.id = e.id), e.bbox != null && (t.bbox = e.bbox), e.properties) {
		t.properties = e.properties;
		break;
	}
	return t;
}
function hr(e) {
	if (e == null) return { type: null };
	var t = e.type === "GeometryCollection" ? {
		type: "GeometryCollection",
		geometries: e.geometries.map(hr)
	} : e.type === "Point" || e.type === "MultiPoint" ? {
		type: e.type,
		coordinates: e.coordinates
	} : {
		type: e.type,
		arcs: e.coordinates
	};
	return e.bbox != null && (t.bbox = e.bbox), t;
}
//#endregion
//#region node_modules/topojson-server/src/prequantize.js
function gr(e, t, n) {
	var r = t[0], i = t[1], a = t[2], o = t[3], s = a - r ? (n - 1) / (a - r) : 1, c = o - i ? (n - 1) / (o - i) : 1;
	function l(e) {
		return [Math.round((e[0] - r) * s), Math.round((e[1] - i) * c)];
	}
	function u(e, t) {
		for (var n = -1, a = 0, o = e.length, l = Array(o), u, d, f, p, m; ++n < o;) u = e[n], p = Math.round((u[0] - r) * s), m = Math.round((u[1] - i) * c), (p !== d || m !== f) && (l[a++] = [d = p, f = m]);
		for (l.length = a; a < t;) a = l.push([l[0][0], l[0][1]]);
		return l;
	}
	function d(e) {
		return u(e, 2);
	}
	function f(e) {
		return u(e, 4);
	}
	function p(e) {
		return e.map(f);
	}
	function m(e) {
		e != null && Xn.call(h, e.type) && h[e.type](e);
	}
	var h = {
		GeometryCollection: function(e) {
			e.geometries.forEach(m);
		},
		Point: function(e) {
			e.coordinates = l(e.coordinates);
		},
		MultiPoint: function(e) {
			e.coordinates = e.coordinates.map(l);
		},
		LineString: function(e) {
			e.arcs = d(e.arcs);
		},
		MultiLineString: function(e) {
			e.arcs = e.arcs.map(d);
		},
		Polygon: function(e) {
			e.arcs = p(e.arcs);
		},
		MultiPolygon: function(e) {
			e.arcs = e.arcs.map(p);
		}
	};
	for (var g in e) m(e[g]);
	return {
		scale: [1 / s, 1 / c],
		translate: [r, i]
	};
}
//#endregion
//#region node_modules/topojson-server/src/topology.js
function _r(e, t) {
	var n = Zn(e = dr(e)), r = t > 0 && n && gr(e, n, t), i = cr(ar(ur(e))), a = i.coordinates, o = $n(i.arcs.length * 1.4, vr, yr);
	e = i.objects, i.bbox = n, i.arcs = i.arcs.map(function(e, t) {
		return o.set(e, t), a.slice(e[0], e[1] + 1);
	}), delete i.coordinates, a = null;
	function s(e) {
		e && Xn.call(c, e.type) && c[e.type](e);
	}
	var c = {
		GeometryCollection: function(e) {
			e.geometries.forEach(s);
		},
		LineString: function(e) {
			e.arcs = l(e.arcs);
		},
		MultiLineString: function(e) {
			e.arcs = e.arcs.map(l);
		},
		Polygon: function(e) {
			e.arcs = e.arcs.map(l);
		},
		MultiPolygon: function(e) {
			e.arcs = e.arcs.map(u);
		}
	};
	function l(e) {
		var t = [];
		do {
			var n = o.get(e);
			t.push(e[0] < e[1] ? n : ~n);
		} while (e = e.next);
		return t;
	}
	function u(e) {
		return e.map(l);
	}
	for (var d in e) s(e[d]);
	return r && (i.transform = r, i.arcs = lr(i.arcs)), i;
}
function vr(e) {
	var t = e[0], n = e[1], r;
	return n < t && (r = t, t = n, n = r), t + 31 * n;
}
function yr(e, t) {
	var n = e[0], r = e[1], i = t[0], a = t[1], o;
	return r < n && (o = n, n = r, r = o), a < i && (o = i, i = a, a = o), n === i && r === a;
}
//#endregion
//#region node_modules/topojson-simplify/src/planar.js
function br(e) {
	var t = e[0], n = e[1], r = e[2];
	return Math.abs((t[0] - r[0]) * (n[1] - t[1]) - (t[0] - n[0]) * (r[1] - t[1])) / 2;
}
//#endregion
//#region node_modules/topojson-simplify/src/heap.js
function xr(e, t) {
	return e[1][2] - t[1][2];
}
function Sr() {
	var e = {}, t = [], n = 0;
	e.push = function(e) {
		return r(t[e._ = n] = e, n++), n;
	}, e.pop = function() {
		if (!(n <= 0)) {
			var e = t[0], r;
			return --n > 0 && (r = t[n], i(t[r._ = 0] = r, 0)), e;
		}
	}, e.remove = function(e) {
		var a = e._, o;
		if (t[a] === e) return a !== --n && (o = t[n], (xr(o, e) < 0 ? r : i)(t[o._ = a] = o, a)), a;
	};
	function r(e, n) {
		for (; n > 0;) {
			var r = (n + 1 >> 1) - 1, i = t[r];
			if (xr(e, i) >= 0) break;
			t[i._ = n] = i, t[e._ = n = r] = e;
		}
	}
	function i(e, r) {
		for (;;) {
			var i = r + 1 << 1, a = i - 1, o = r, s = t[o];
			if (a < n && xr(t[a], s) < 0 && (s = t[o = a]), i < n && xr(t[i], s) < 0 && (s = t[o = i]), o === r) break;
			t[s._ = r] = s, t[e._ = r = o] = e;
		}
	}
	return e;
}
//#endregion
//#region node_modules/topojson-simplify/src/presimplify.js
function Cr(e) {
	return [
		e[0],
		e[1],
		0
	];
}
function wr(e, t) {
	var n = e.transform ? c(e.transform) : Cr, r = Sr();
	t ??= br;
	var i = e.arcs.map(function(e) {
		var i = [], o = 0, s, c, l;
		for (e = e.map(n), c = 1, l = e.length - 1; c < l; ++c) s = [
			e[c - 1],
			e[c],
			e[c + 1]
		], s[1][2] = t(s), i.push(s), r.push(s);
		for (e[0][2] = e[l][2] = Infinity, c = 0, l = i.length; c < l; ++c) s = i[c], s.previous = i[c - 1], s.next = i[c + 1];
		for (; s = r.pop();) {
			var u = s.previous, d = s.next;
			s[1][2] < o ? s[1][2] = o : o = s[1][2], u && (u.next = d, u[2] = s[2], a(u)), d && (d.previous = u, d[0] = s[0], a(d));
		}
		return e;
	});
	function a(e) {
		r.remove(e), e[1][2] = t(e), r.push(e);
	}
	return {
		type: "Topology",
		bbox: e.bbox,
		objects: e.objects,
		arcs: i
	};
}
//#endregion
//#region node_modules/topojson-simplify/src/spherical.js
var Tr = Math.PI;
2 * Tr, Tr / 4, Tr / 180;
//#endregion
//#region src/utils/geoprocessing-operations.ts
var Er = [
	{
		value: "sum",
		label: "total",
		sql: "SUM",
		suffix: "total",
		numericOnly: !0
	},
	{
		value: "mean",
		label: "average",
		sql: "AVG",
		suffix: "average",
		numericOnly: !0
	},
	{
		value: "min",
		label: "lowest",
		sql: "MIN",
		suffix: "min"
	},
	{
		value: "max",
		label: "highest",
		sql: "MAX",
		suffix: "max"
	},
	{
		value: "count",
		label: "number of values",
		sql: "COUNT",
		suffix: "count"
	},
	{
		value: "list",
		label: "list the values",
		sql: "",
		suffix: "list"
	}
];
function K(e) {
	return `"${e.replace(/"/g, "\"\"")}"`;
}
function q(e, t, n = "") {
	return t.length ? t.map((t) => `${e}.${K(t)} AS ${K(n + t)}`).join(", ") : "";
}
function Dr(e, t, n, r) {
	return Array.isArray(t) ? t.filter((e) => e?.field).map((t) => {
		let i = Er.find((e) => e.value === t.fn) ?? Er[0], a = K(`${t.field}_${i.suffix}`);
		return t.fn === "list" ? `${Or(e, t, n, r)} AS ${a}` : `${i.sql}(${e}.${K(t.field)}) AS ${a}`;
	}).join(", ") : "";
}
function Or(e, t, n, r) {
	let i = t.separator ?? ", ", a = t.unique ? "DISTINCT " : "", o = t.order === "desc" ? "DESC" : "ASC", s = r ? `WHERE inner_row.${K(r)} IS ${e}.${K(r)}` : "";
	return `(SELECT group_concat(v, ${kr(i)}) FROM (
                SELECT ${a}inner_row.${K(t.field)} AS v
                FROM ${K(n)} inner_row ${s}
                ORDER BY v ${o}))`;
}
function kr(e) {
	return `'${e.replace(/'/g, "''")}'`;
}
function J(...e) {
	return e.filter((e) => e.length > 0).join(", ");
}
function Ar(e, t) {
	return e.includes(t) ? `${t}_2` : t;
}
function jr(e, t) {
	return t.map((t) => `b.${K(t)} AS ${K(Ar(e, t))}`).join(", ");
}
function Mr(e, t, n, r, i) {
	let a = e.map((e) => n === "b" ? `NULL AS ${K(e)}` : `a.${K(e)} AS ${K(e)}`), o = t.map((t) => {
		let r = K(Ar(e, t));
		return n === "a" ? `NULL AS ${r}` : `b.${K(t)} AS ${r}`;
	});
	return J(...a, ...o, `'${r}' AS part`, `${i} AS geometry`);
}
var Nr = .001, Pr = .1, Fr = .02;
function Ir(e) {
	let t = 0;
	for (let n = 0; n < e.length - 1; n++) t += e[n][0] * e[n + 1][1] - e[n + 1][0] * e[n][1];
	return Math.abs(t / 2);
}
function Lr(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	for (let [a, o] of e) a < t && (t = a), a > r && (r = a), o < n && (n = o), o > i && (i = o);
	return Math.max(r - t, i - n);
}
function Rr(e, t) {
	let n = String(t.holes ?? "keep");
	if (n !== "auto" && n !== "size") return e;
	let r = Number(t.holeSize) || 0, i = (e, t) => n === "auto" ? Ir(e) >= Nr * t : Lr(e) >= r, a = (e) => {
		if (e.length < 2) return e;
		let t = Ir(e[0]);
		return [e[0], ...e.slice(1).filter((e) => i(e, t))];
	};
	return {
		...e,
		features: e.features.map((e) => {
			let t = e.geometry;
			return t?.type === "Polygon" ? {
				...e,
				geometry: {
					...t,
					coordinates: a(t.coordinates)
				}
			} : t?.type === "MultiPolygon" ? {
				...e,
				geometry: {
					...t,
					coordinates: t.coordinates.map(a)
				}
			} : e;
		})
	};
}
var zr = [{
	kind: "select",
	key: "holes",
	label: "Small gaps",
	default: "auto",
	options: [
		{
			value: "auto",
			label: "remove (relative to each shape)"
		},
		{
			value: "size",
			label: "remove up to a given width"
		},
		{
			value: "keep",
			label: "keep every hole"
		}
	],
	hint: "Merging tile-based data leaves gaps where neighbouring borders do not meet exactly. Real holes such as a large lake are kept."
}, {
	kind: "number",
	key: "holeSize",
	label: "Gaps narrower than",
	default: 1e3,
	min: 0,
	step: 100,
	unit: "m",
	showWhen: (e) => e.holes === "size"
}];
function Br(e, t) {
	if (!e.length || e[0].length < 4) return null;
	let n = D(e, t);
	return !Number.isFinite(n[0]) || !Number.isFinite(n[1]) ? null : {
		point: [n[0], n[1]],
		distance: n.distance
	};
}
function Vr(e) {
	return e ? e.type === "Polygon" ? [e.coordinates] : e.type === "MultiPolygon" ? e.coordinates : e.type === "GeometryCollection" ? e.geometries.flatMap(Vr) : [] : [];
}
function Hr(e, t) {
	let n = Math.max(Number(t.precision) || 1, .001), r = [];
	for (let t of e.features) {
		let e = Vr(t.geometry), i = null;
		for (let t of e) {
			let e = Br(t, n);
			e && (!i || e.distance > i.distance) && (i = e);
		}
		i && r.push({
			type: "Feature",
			properties: { ...t.properties ?? {} },
			geometry: {
				type: "Point",
				coordinates: i.point
			}
		});
	}
	return {
		type: "FeatureCollection",
		features: r
	};
}
function Ur(e) {
	if (!e) return null;
	if (e.type === "GeometryCollection") {
		let t = e.geometries.map(Ur).filter(Boolean);
		return t.length ? Zr(t) : null;
	}
	let t = Wr(e);
	if (!t.length) return null;
	let n = Jr(t), r = (e) => [Yr(e[0], n), e[1]];
	switch (e.type) {
		case "Polygon":
		case "MultiPolygon": {
			let t = Gr((e.type === "MultiPolygon" ? e.coordinates : [e.coordinates]).map((e) => e.map((e) => e.map(r))));
			if (t) return Xr(t);
			break;
		}
		case "LineString":
		case "MultiLineString": {
			let t = Kr((e.type === "MultiLineString" ? e.coordinates : [e.coordinates]).map((e) => e.map(r)));
			if (t) return Xr(t);
			break;
		}
		default: break;
	}
	return Zr(t);
}
function Wr(e) {
	let t = [], n = (e) => {
		if (Array.isArray(e)) {
			if (typeof e[0] == "number") {
				t.push([e[0], e[1]]);
				return;
			}
			for (let t of e) n(t);
		}
	};
	return n(e.coordinates), t;
}
function Gr(e) {
	let t = 0, n = 0, r = 0;
	for (let i of e) for (let e = 0; e < i.length; e++) {
		let a = i[e], o = 0, s = 0, c = 0;
		for (let e = 0; e + 1 < a.length; e++) {
			let [t, n] = a[e], [r, i] = a[e + 1], l = t * i - r * n;
			o += l, s += (t + r) * l, c += (n + i) * l;
		}
		if (!o) continue;
		let l = Math.abs(o / 2), u = e === 0 ? 1 : -1;
		t += u * l, n += u * l * (s / (3 * o)), r += u * l * (c / (3 * o));
	}
	return t ? [n / t, r / t] : null;
}
function Kr(e) {
	let t = 0;
	for (let n of e) for (let e = 0; e + 1 < n.length; e++) t += qr(n[e], n[e + 1]);
	if (!t) return null;
	let n = t / 2;
	for (let t of e) for (let e = 0; e + 1 < t.length; e++) {
		let r = qr(t[e], t[e + 1]);
		if (r >= n) {
			let i = r ? n / r : 0;
			return [t[e][0] + (t[e + 1][0] - t[e][0]) * i, t[e][1] + (t[e + 1][1] - t[e][1]) * i];
		}
		n -= r;
	}
	return null;
}
function qr(e, t) {
	return Math.sqrt((t[0] - e[0]) ** 2 + (t[1] - e[1]) ** 2);
}
function Jr(e) {
	let t = Infinity, n = -Infinity, r = Infinity, i = -Infinity;
	for (let [a] of e) {
		let e = a < 0 ? a + Y : a;
		t = Math.min(t, a), n = Math.max(n, a), r = Math.min(r, e), i = Math.max(i, e);
	}
	return i - r < n - t;
}
function Yr(e, t) {
	return t && e < 0 ? e + Y : e;
}
function Xr(e) {
	let t = Y / 2;
	return [e[0] > t ? e[0] - Y : e[0], e[1]];
}
function Zr(e) {
	let t = 0, n = 0, r = 0, i = Infinity, a = -Infinity, o = Infinity, s = -Infinity;
	for (let [c, l] of e) {
		let e = c < 0 ? c + Y : c;
		t += c, r += e, n += l, i = Math.min(i, c), a = Math.max(a, c), o = Math.min(o, e), s = Math.max(s, e);
	}
	let c = (s - o < a - i ? r : t) / e.length, l = n / e.length;
	return [c > Y / 2 ? c - Y : c, l];
}
var Y = 2 * 20037508.342789244;
function Qr(e) {
	if (e.length < 2) return;
	let t = Infinity, n = -Infinity, r = Infinity, i = -Infinity;
	for (let { point: a } of e) {
		let e = a[0] < 0 ? a[0] + Y : a[0];
		t = Math.min(t, a[0]), n = Math.max(n, a[0]), r = Math.min(r, e), i = Math.max(i, e);
	}
	if (!(i - r >= n - t)) for (let t of e) t.point[0] < 0 && (t.point = [t.point[0] + Y, t.point[1]]);
}
function $r(e) {
	let t = [];
	return e.features.forEach((e, n) => {
		let r = Ur(e.geometry);
		r && Number.isFinite(r[0]) && Number.isFinite(r[1]) && t.push({
			point: r,
			feature: e,
			index: n + 1
		});
	}), Qr(t), t;
}
var ei = [
	-40075016.68557849,
	0,
	Y
];
function ti(e) {
	let t = Infinity, n = -Infinity;
	for (let { point: r } of e) t = Math.min(t, r[0]), n = Math.max(n, r[0]);
	return {
		min: t,
		max: n,
		middle: (t + n) / 2
	};
}
function ni(e) {
	let { min: t, max: n } = ti(e);
	return n - t > Y / 2 ? ei : [0];
}
function ri(e, t) {
	return t.flatMap((t) => e.map((e) => [e.point[0] + t, e.point[1]]));
}
function ii(e, t) {
	let n = Infinity, r = Infinity, i = -Infinity, a = -Infinity;
	for (let { point: t } of e) n = Math.min(n, t[0]), i = Math.max(i, t[0]), r = Math.min(r, t[1]), a = Math.max(a, t[1]);
	let o = Math.max(Number(t.padding) || 0, 0) || Math.max(i - n, a - r) * .1 || 1e3, s = Y / 2, c = (n + i) / 2;
	return [
		Math.max(n - o, c - s),
		Math.max(r - o, -20037508.342789244),
		Math.min(i + o, c + s),
		Math.min(a + o, s)
	];
}
function ai(e) {
	let t = Y / 2, n = [], r = e.length > 1 && e[0][0] === e[e.length - 1][0] && e[0][1] === e[e.length - 1][1] ? e.slice(0, -1) : e;
	for (let e of [
		-40075016.68557849,
		0,
		Y
	]) {
		let i = r.map(([t, n]) => [t + e, n]);
		if (i = oi(i, -20037508.342789244, !0), i = oi(i, t, !1), i.length < 3) continue;
		let a = [...i, i[0]];
		Ir(a) < 1 || n.push(a);
	}
	return n;
}
function oi(e, t, n) {
	let r = (e) => n ? e[0] >= t : e[0] <= t, i = [];
	for (let n = 0; n < e.length; n++) {
		let a = e[n], o = e[(n + e.length - 1) % e.length], s = r(a);
		if (s !== r(o)) {
			let e = (t - o[0]) / (a[0] - o[0]);
			i.push([t, o[1] + e * (a[1] - o[1])]);
		}
		s && i.push(a);
	}
	return i;
}
function si(e, t) {
	let n = $r(e);
	if (!n.length) throw Error("Voronoi needs at least one point.");
	let r = ii(n, t), i = ni(n), a = ri(n, i), o = ce.from(a).voronoi(r), s = [];
	return n.forEach((e, t) => {
		let r = [];
		for (let e = 0; e < i.length; e++) {
			let i = o.cellPolygon(e * n.length + t);
			if (!(!i || i.length < 4)) for (let e of ai(i.map(([e, t]) => [e, t]))) r.push([e]);
		}
		r.length && s.push({
			type: "Feature",
			properties: { ...e.feature.properties ?? {} },
			geometry: r.length === 1 ? {
				type: "Polygon",
				coordinates: r[0]
			} : {
				type: "MultiPolygon",
				coordinates: r
			}
		});
	}), {
		type: "FeatureCollection",
		features: s
	};
}
function ci(e) {
	let t = $r(e);
	if (t.length < 3) throw Error("A Delaunay triangulation needs at least three points.");
	let n = ni(t), r = ri(t, n), i = ce.from(r);
	if (i.collinear) throw Error("All points lie on one line, so there are no triangles to build.");
	let a = [], o = Y / 2, s = ti(t).middle;
	for (let e = 0; e < i.triangles.length; e += 3) {
		let c = [
			i.triangles[e],
			i.triangles[e + 1],
			i.triangles[e + 2]
		], l = c.map((e) => r[e][0]);
		if (n.length > 1) {
			let e = (l[0] + l[1] + l[2]) / 3;
			if (e < s - o || e >= s + o || Math.max(...l) - Math.min(...l) > o) continue;
		}
		let u = c.map((e) => [r[e][0], r[e][1]]), d = ai([...u, u[0]]);
		d.length && a.push({
			type: "Feature",
			properties: {
				triangle: a.length + 1,
				point_1: t[c[0] % t.length].index,
				point_2: t[c[1] % t.length].index,
				point_3: t[c[2] % t.length].index
			},
			geometry: d.length === 1 ? {
				type: "Polygon",
				coordinates: [d[0]]
			} : {
				type: "MultiPolygon",
				coordinates: d.map((e) => [e])
			}
		});
	}
	return {
		type: "FeatureCollection",
		features: a
	};
}
function li(e) {
	return `ST_Union(ST_MakeValid(${e}))`;
}
function ui(e, t) {
	return `SELECT ${J(t.map((e) => K(e)).join(", "), "geometry")} FROM (${e}) WHERE geometry IS NOT NULL AND NOT ST_IsEmpty(geometry)`;
}
function di(e, t) {
	return `ST_Difference(${e}, (SELECT ${li("geometry")} FROM ${t}))`;
}
function fi(e, t, n) {
	if (!e) throw Error("indexedPairs called without a second input table");
	return `${t}.ROWID IN (SELECT ROWID FROM SpatialIndex WHERE f_table_name='${e}' AND search_frame=${n})`;
}
var pi = 8, mi = 4e3;
function hi(e) {
	return e.type === "GeometryCollection" ? e.geometries.flatMap(hi) : e.type === "Polygon" ? e.arcs : e.type === "MultiPolygon" ? e.arcs.flat() : [];
}
function gi(e, t) {
	let n = [];
	for (let r of e) {
		let e = r < 0 ? [...t[~r]].reverse() : t[r];
		n.push(...n.length ? e.slice(1) : e);
	}
	return n;
}
function _i(e, t, n, r) {
	let i = (e, t, n) => Math.sign((t[0] - e[0]) * (n[1] - e[1]) - (t[1] - e[1]) * (n[0] - e[0])), a = i(e, t, n), o = i(e, t, r), s = i(n, r, e), c = i(n, r, t);
	return a !== o && s !== c && a !== 0 && o !== 0 && s !== 0 && c !== 0;
}
function vi(e) {
	let t = e.length - 1;
	if (t < 4 || e.length > mi) return !1;
	for (let n = 0; n < t; n++) for (let r = n + 2; r < t; r++) if (!(n === 0 && r === t - 1) && _i(e[n], e[n + 1], e[r], e[r + 1])) return !0;
	return !1;
}
function yi(e) {
	let t = e.length - 1;
	if (t < 4 || e.length > mi) return !1;
	let n = /* @__PURE__ */ new Map();
	for (let r = 0; r < t; r++) {
		let i = `${e[r][0]},${e[r][1]}`, a = n.get(i);
		if (a !== void 0 && Math.min(r - a, t - (r - a)) > 1) return !0;
		n.set(i, r);
	}
	return !1;
}
function bi(e) {
	if (new Set(e.slice(0, -1).map(([e, t]) => `${e},${t}`)).size < 3) return !1;
	let t = 0;
	for (let n = 0; n + 1 < e.length; n++) t += e[n][0] * e[n + 1][1] - e[n + 1][0] * e[n][1];
	return Math.abs(t) > 1e-9;
}
function xi(e) {
	return new Set(e.map(([e, t]) => `${e},${t}`)).size >= 2;
}
function Si(e) {
	if (!e) return null;
	switch (e.type) {
		case "Polygon": {
			let [t, ...n] = e.coordinates;
			return !t || !bi(t) ? null : {
				type: "Polygon",
				coordinates: [t, ...n.filter(bi)]
			};
		}
		case "MultiPolygon": {
			let t = e.coordinates.filter(([e]) => e && bi(e)).map(([e, ...t]) => [e, ...t.filter(bi)]);
			return t.length ? {
				type: "MultiPolygon",
				coordinates: t
			} : null;
		}
		case "LineString": return xi(e.coordinates) ? e : null;
		case "MultiLineString": {
			let t = e.coordinates.filter(xi);
			return t.length ? {
				type: "MultiLineString",
				coordinates: t
			} : null;
		}
		default: return e;
	}
}
function Ci(e, t) {
	let n = (e) => Math.round(e / t) * t, r = (e) => Array.isArray(e) ? typeof e[0] == "number" ? [
		n(e[0]),
		n(e[1]),
		...e.slice(2)
	] : e.map(r) : e;
	return {
		...e,
		features: e.features.map((e) => ({
			...e,
			geometry: e.geometry && {
				...e.geometry,
				coordinates: r(e.geometry.coordinates)
			}
		}))
	};
}
function wi(e, t) {
	let n = Math.max(Number(t.tolerance) || 0, 0);
	if (!n) return e;
	let r = n * n, i = Math.max(Number(t.snap) || 0, 0), a = wr(_r({ layer: i > 0 ? Ci(e, i) : e })), o = a.arcs.map(() => r), s = () => a.arcs.map((e, t) => e.filter((e) => e[2] >= o[t]).map(([e, t]) => [e, t])), c = hi(a.objects.layer), u = s(), d = c;
	for (let e = 0; e < pi && d.length; e++) {
		let t = d.filter((e) => vi(gi(e, u)));
		if (!t.length) break;
		let n = e === pi - 1;
		for (let e of t) for (let t of e) {
			let e = t < 0 ? ~t : t;
			o[e] = n ? 0 : o[e] / 4;
		}
		u = s(), d = t;
	}
	let f = c.filter((e) => {
		let t = gi(e, u);
		return vi(t) || yi(t);
	}), p = f.length ? [`${f.length} ${f.length === 1 ? "shape still self-intersects" : "shapes still self-intersect"} after simplifying${i > 0 ? " — the snap distance may be merging points that were meant to stay apart; try a smaller value" : ""}.`] : void 0, m = l({
		...a,
		arcs: u
	}, a.objects.layer);
	return {
		type: "FeatureCollection",
		features: (m.type === "FeatureCollection" ? m.features : [m]).map((e) => ({
			...e,
			geometry: Si(e.geometry)
		})),
		...p ? { warnings: p } : {}
	};
}
var Ti = {
	intersects: (e, t) => `ST_Intersects(${e}, ${t})`,
	contains: (e, t) => `ST_Contains(${e}, ${t})`,
	within: (e, t) => `ST_Within(${e}, ${t})`
};
function Ei(e, t, n) {
	return (Ti[String(e)] ?? Ti.intersects)(t, n);
}
var Di = [
	{
		id: "clip",
		label: "Clip",
		category: "overlay",
		description: "Cuts the input layer down to the area covered by the clip layer, like a cookie cutter. Keeps the input’s features and attributes — only their shape changes.",
		inputs: [{
			key: "a",
			label: "Layer to clip",
			hint: "Its features and attributes are kept"
		}, {
			key: "b",
			label: "Clip with",
			hint: "Used as one shape; its attributes are ignored"
		}],
		params: [],
		outputGeometry: "same",
		outputName: (e, t) => `${e} clipped by ${t}`,
		buildSql: ({ layerA: e, refB: t, fieldsA: n }) => ui(`
            SELECT ${J(q("a", n), `ST_Intersection(a.geometry, (SELECT ${li("geometry")} FROM ${t})) AS geometry`)}
            FROM ${K(e)} a`, n)
	},
	{
		id: "erase",
		label: "Erase",
		category: "overlay",
		description: "Removes from the input layer everything covered by the erase layer. The opposite of clip.",
		inputs: [{
			key: "a",
			label: "Layer to erase from",
			hint: "Its attributes are kept"
		}, {
			key: "b",
			label: "Erase with",
			hint: "These areas are cut away"
		}],
		params: [],
		outputGeometry: "same",
		outputName: (e, t) => `${e} minus ${t}`,
		buildSql: ({ layerA: e, refB: t, fieldsA: n }) => ui(`
            SELECT ${J(q("a", n), `${di("a.geometry", t)} AS geometry`)}
            FROM ${K(e)} a`, n)
	},
	{
		id: "intersect",
		label: "Intersect",
		category: "overlay",
		description: "Keeps the overlapping parts of both layers and combines their attributes: every pair that overlaps becomes its own feature, so one input feature can be split into several.",
		inputs: [{
			key: "a",
			label: "First layer",
			hint: "Both layers’ attributes end up in the result"
		}, {
			key: "b",
			label: "Second layer"
		}],
		params: [],
		outputGeometry: "polygon",
		outputName: (e, t) => `${e} ∩ ${t}`,
		buildSql: ({ layerA: e, refB: t, fieldsA: n, fieldsB: r }) => `
            SELECT ${J(q("a", n), jr(n, r), "ST_Intersection(a.geometry, b.geometry) AS geometry")}
            FROM ${K(e)} a
            JOIN ${t} b ON ${fi(t, "b", "a.geometry")}
            WHERE ST_Intersects(a.geometry, b.geometry)`
	},
	{
		id: "union",
		label: "Union (overlay)",
		category: "overlay",
		description: "Combines both layers and splits them where they overlap. Every piece keeps the attributes of the layers it came from, and a \"part\" column saying whether it belongs to the first layer, the second, or both.",
		inputs: [{
			key: "a",
			label: "First layer"
		}, {
			key: "b",
			label: "Second layer"
		}],
		params: [],
		outputGeometry: "polygon",
		outputName: (e, t) => `${e} ∪ ${t}`,
		buildSql: ({ layerA: e, refB: t, fieldsA: n, fieldsB: r }) => `
            SELECT ${Mr(n, r, "both", "both", "ST_Intersection(a.geometry, b.geometry)")}
            FROM ${K(e)} a
            JOIN ${t} b ON ${fi(t, "b", "a.geometry")}
            WHERE ST_Intersects(a.geometry, b.geometry)
            UNION ALL
            SELECT ${Mr(n, r, "a", "first", di("a.geometry", t))}
            FROM ${K(e)} a
            UNION ALL
            SELECT ${Mr(n, r, "b", "second", di("b.geometry", e))}
            FROM ${t} b`
	},
	{
		id: "selectByLocation",
		label: "Select by location",
		category: "selection",
		description: "Keeps whole features from the input layer based on how they sit relative to the second layer. Geometry is not changed.",
		inputs: [{
			key: "a",
			label: "Layer to select from"
		}, {
			key: "b",
			label: "Compare with"
		}],
		params: [{
			kind: "select",
			key: "mode",
			label: "Keep features that",
			default: "intersects",
			options: [
				{
					value: "intersects",
					label: "touch or overlap the second layer"
				},
				{
					value: "within",
					label: "lie completely inside the second layer"
				},
				{
					value: "disjoint",
					label: "do not touch the second layer"
				}
			]
		}],
		outputGeometry: "same",
		outputName: (e, t) => `${e} selected by ${t}`,
		buildSql: ({ layerA: e, refB: t, fieldsA: n, params: r }) => {
			let i = r.mode === "within" ? "ST_Within(a.geometry, b.geometry)" : "ST_Intersects(a.geometry, b.geometry)", a = `${r.mode === "disjoint" ? "NOT EXISTS" : "EXISTS"} (SELECT 1 FROM ${t} b WHERE ${fi(t, "b", "a.geometry")} AND ${i})`;
			return `
            SELECT ${J(q("a", n), "a.geometry AS geometry")}
            FROM ${K(e)} a
            WHERE ${a}`;
		}
	},
	{
		id: "spatialJoin",
		label: "Spatial join",
		category: "selection",
		description: "Copies attributes from the second layer onto features of the first, based on their spatial relationship. Geometry is not changed.",
		inputs: [{
			key: "a",
			label: "Layer to add attributes to"
		}, {
			key: "b",
			label: "Take attributes from"
		}],
		params: [{
			kind: "select",
			key: "relation",
			label: "Match when the first layer’s feature",
			default: "intersects",
			options: [
				{
					value: "intersects",
					label: "touches or overlaps"
				},
				{
					value: "within",
					label: "lies inside"
				},
				{
					value: "contains",
					label: "contains"
				}
			]
		}],
		outputGeometry: "same",
		outputName: (e, t) => `${e} joined with ${t}`,
		buildSql: ({ layerA: e, refB: t, fieldsA: n, fieldsB: r, params: i }) => `
            SELECT ${J(q("a", n), jr(n, r), "a.geometry AS geometry")}
            FROM ${K(e)} a
            LEFT JOIN ${t} b
              ON ${fi(t, "b", "a.geometry")} AND ${Ei(i.relation, "a.geometry", "b.geometry")}`
	},
	{
		id: "dissolve",
		label: "Dissolve",
		category: "aggregate",
		description: "Merges features into one shape, removing the boundaries between them. Group by an attribute to get one shape per value — municipalities into provinces, for example. Summarise attributes to carry them through: totals, averages, lowest, highest, a count, or the values listed.",
		inputs: [{
			key: "a",
			label: "Layer to dissolve"
		}],
		params: [
			{
				kind: "field",
				key: "groupBy",
				label: "Group by attribute",
				from: "a",
				optional: !0,
				hint: "Leave empty to merge everything into one feature"
			},
			{
				kind: "aggregations",
				key: "stats",
				label: "Summarise attributes",
				from: "a",
				hint: "Merging provinces into countries usually means adding up their populations"
			},
			...zr
		],
		outputGeometry: "polygon",
		outputName: (e) => `${e} dissolved`,
		postProcess: Rr,
		postProcessNeeded: (e) => e.holes === "auto" || e.holes === "size",
		buildSql: ({ layerA: e, params: t }) => {
			let n = String(t.groupBy ?? ""), r = Dr("a", t.stats, e, n);
			return `
            SELECT ${J(n ? `a.${K(n)} AS ${K(n)}` : "", "COUNT(*) AS feature_count", r, `${li("a.geometry")} AS geometry`)}
            FROM ${K(e)} a
            ${n ? `GROUP BY a.${K(n)}` : ""}`;
		}
	},
	{
		id: "statistics",
		label: "Statistics",
		category: "aggregate",
		description: "Counts and summarises attributes per group and shows the result as a table. Nothing is drawn on the map — use this to answer questions like “how many inhabitants per continent?”.",
		inputs: [{
			key: "a",
			label: "Input layer"
		}],
		params: [{
			kind: "field",
			key: "groupBy",
			label: "Group by attribute",
			from: "a",
			optional: !0,
			hint: "Leave empty for one row covering the whole layer"
		}, {
			kind: "aggregations",
			key: "stats",
			label: "Summarise attributes",
			from: "a"
		}],
		outputGeometry: "table",
		outputName: (e) => `${e} statistics`,
		buildSql: ({ layerA: e, params: t }) => {
			let n = String(t.groupBy ?? ""), r = Dr("a", t.stats, e, n);
			return `
            SELECT ${J(n ? `a.${K(n)} AS ${K(n)}` : "", "COUNT(*) AS feature_count", r)}
            FROM ${K(e)} a
            ${n ? `GROUP BY a.${K(n)}` : ""}`;
		}
	},
	{
		id: "centroid",
		label: "Centroid",
		category: "transform",
		description: "Replaces each feature by a single point at its centre, keeping all attributes.",
		inputs: [{
			key: "a",
			label: "Input layer"
		}],
		params: [],
		outputGeometry: "point",
		outputName: (e) => `${e} centroids`,
		buildSql: ({ layerA: e, fieldsA: t }) => `
            SELECT ${J(q("a", t), "ST_Centroid(a.geometry) AS geometry")}
            FROM ${K(e)} a`
	},
	{
		id: "labelPoint",
		label: "Label point",
		category: "transform",
		description: "Puts a point at the roomiest spot inside each polygon — the best place for a label. Unlike a centroid, it is always inside the shape, even for a crescent or a country with a long inlet.",
		inputs: [{
			key: "a",
			label: "Input layer",
			hint: "Polygons only; other geometry is skipped"
		}],
		params: [{
			kind: "number",
			key: "precision",
			label: "Precision",
			default: 100,
			min: 1,
			step: 10,
			unit: "m",
			hint: "Smaller is more exact but slower"
		}],
		outputGeometry: "point",
		outputName: (e) => `${e} label points`,
		compute: Hr
	},
	{
		id: "buffer",
		label: "Buffer",
		category: "transform",
		description: "Draws a zone at a fixed distance around every feature — the area within 500 m of a road, for example. A negative distance shrinks polygons instead.",
		inputs: [{
			key: "a",
			label: "Input layer"
		}],
		params: [{
			kind: "number",
			key: "distance",
			label: "Distance",
			default: 1e3,
			step: 100,
			unit: "m",
			hint: "Negative shrinks polygons inwards"
		}, {
			kind: "select",
			key: "merge",
			label: "Overlapping zones",
			default: "separate",
			options: [{
				value: "separate",
				label: "one buffer per feature, keeping its attributes"
			}, {
				value: "merged",
				label: "merge everything into one zone"
			}],
			hint: "Merging answers “which area is within this distance of anything?”; separate buffers answer it per feature."
		}],
		outputGeometry: "polygon",
		outputName: (e) => `${e} buffer`,
		buildSql: ({ layerA: e, fieldsA: t, params: n }) => {
			let r = Number(n.distance) || 0;
			return n.merge === "merged" ? `SELECT COUNT(*) AS feature_count, ${li(`ST_Buffer(geometry, ${r})`)} AS geometry FROM ${K(e)}` : `
            SELECT ${J(q("a", t), `ST_Buffer(a.geometry, ${r}) AS geometry`)}
            FROM ${K(e)} a`;
		}
	},
	{
		id: "cartogram",
		label: "Cartogram",
		category: "transform",
		description: "Resizes every polygon so that its area shows a number — population, production, votes — instead of showing ground area. The map keeps its total size, so only the distribution changes.",
		inputs: [{
			key: "a",
			label: "Input layer",
			hint: "Polygons with a number to size them by"
		}],
		params: [
			{
				kind: "field",
				key: "field",
				label: "Size by",
				from: "a",
				numericOnly: !0,
				hint: "Features without a positive number in this attribute are left out"
			},
			{
				kind: "select",
				key: "method",
				label: "Cartogram type",
				default: "flow",
				options: [
					{
						value: "flow",
						label: "keep the map joined up, exact areas"
					},
					{
						value: "contiguous",
						label: "keep the map joined up (classic, faster)"
					},
					{
						value: "diffusion",
						label: "keep the map joined up, exact areas (go-cart WASM)"
					},
					{
						value: "scaled",
						label: "resize each shape on the spot"
					},
					{
						value: "dorling",
						label: "replace each by a circle (Dorling)"
					}
				],
				hint: "The joined-up types stretch one sheet, so countries still touch. The default solves the flow that equalises the areas, and matches the numbers to a percent or two; the classic one pushes boundaries around instead — quicker, and rougher. The last two leave gaps but keep every shape exactly."
			},
			{
				kind: "number",
				key: "passes",
				label: "Detail",
				default: 12,
				min: 1,
				max: 40,
				step: 1,
				showWhen: (e) => (e.method ?? "flow") === "contiguous",
				hint: "More passes fit the areas better and take longer"
			},
			{
				kind: "number",
				key: "minValuePercent",
				label: "Leave out anything below",
				default: 0,
				min: 0,
				max: 5,
				step: .001,
				unit: "%",
				hint: "Share of the layer total. A region asked to shrink ten-thousandfold cannot get there, and it drags the rest of the map with it. 0 keeps every feature."
			},
			{
				kind: "number",
				key: "minPartPercent",
				label: "Leave out islands smaller than",
				default: .05,
				min: 0,
				max: 5,
				step: .01,
				unit: "%",
				showWhen: (e) => (e.method ?? "flow") !== "scaled" && e.method !== "dorling",
				hint: "Share of the country (or region) the island belongs to. The joined-up types stretch a small island into a thread instead of shrinking it, which is what draws lines across the map. 0 keeps every island."
			},
			{
				kind: "number",
				key: "iterations",
				label: "Separation rounds",
				default: 60,
				min: 0,
				max: 500,
				step: 10,
				showWhen: (e) => e.method === "dorling",
				hint: "How hard overlapping circles are pushed apart"
			}
		],
		outputGeometry: "polygon",
		outputName: (e) => `${e} cartogram`,
		attribution: (e) => e.method === "diffusion" ? "Any images generated with this method must be referenced to: Gastner, M., Seguy, V., & More, P. (2018). Fast flow-based algorithm for creating density-equalizing map projections. PNAS 115:E2156-E2164. https://doi.org/10.1073/pnas.1712674115" : void 0,
		computeSpace: "lonlat",
		compute: async (e, t, n) => {
			let r = await Cn(e, {
				field: String(t.field ?? ""),
				method: t.method === "dorling" ? "dorling" : t.method === "scaled" ? "scaled" : t.method === "diffusion" ? "diffusion" : t.method === "contiguous" ? "contiguous" : "flow",
				iterations: Number(t.iterations) || void 0,
				passes: Number(t.passes) || void 0,
				minValuePercent: Number(t.minValuePercent) || 0,
				minPartPercent: Number.isFinite(Number(t.minPartPercent)) ? Number(t.minPartPercent) : void 0,
				wasmUrl: n.goCartWasmUrl,
				onProgress: n.onProgress ? (e) => n.onProgress(`pass ${e}`) : void 0
			}), i = r.medianAreaError, a = [];
			i > Pr && a.push(`The areas are still about ${(i * 100).toFixed(0)}% away from the values. ${t.method === "contiguous" ? "Raise \"Detail\" for more rounds, or leave the smallest features out." : "This method struggles when a layer mixes very large values with very small ones — try the classic method, or leave the smallest features out."}`), a.push(...r.methodWarnings);
			let { skipped: o } = r, s = (e, t) => `${e} ${e === 1 ? "feature" : "features"} ${e === 1 ? "was" : "were"} left out: ${t}`;
			return o.zeroValue > 0 && a.push(s(o.zeroValue, "a value of 0. A cartogram sizes a shape by its value, so there is nothing left to draw.")), o.negativeValue > 0 && a.push(s(o.negativeValue, "a negative value, and an area cannot be negative.")), o.missingValue > 0 && a.push(s(o.missingValue, "no number in this field.")), o.noArea > 0 && a.push(s(o.noArea, "no area to resize (a point or a line).")), o.belowMinimum > 0 && a.push(s(o.belowMinimum, "a value below the minimum share.")), r.droppedParts.count > 0 && r.droppedParts.areaShare > Fr && a.push(`${r.droppedParts.count} small islands were left out, ${(r.droppedParts.areaShare * 100).toFixed(0)}% of the layer's area. Lower "Leave out islands smaller than" to keep more of them.`), {
				...r.features,
				warnings: a.length ? a : void 0
			};
		}
	},
	{
		id: "voronoi",
		label: "Voronoi",
		category: "transform",
		description: "Divides the map into one area per point, each covering everything that is closer to that point than to any other — catchment areas of shops, schools or weather stations.",
		inputs: [{
			key: "a",
			label: "Input layer",
			hint: "Points; other features use their centre"
		}],
		params: [{
			kind: "number",
			key: "padding",
			label: "Extend beyond the points by",
			default: 0,
			min: 0,
			step: 1e3,
			unit: "m",
			hint: "The diagram is infinite, so it is cut off here. 0 uses a tenth of the area covered by the points."
		}],
		outputGeometry: "polygon",
		outputName: (e) => `${e} Voronoi`,
		compute: si
	},
	{
		id: "delaunay",
		label: "Delaunay",
		category: "transform",
		description: "Connects the points into triangles, avoiding thin slivers wherever possible. The mirror image of the Voronoi diagram, and the usual first step in building a surface from measurements.",
		inputs: [{
			key: "a",
			label: "Input layer",
			hint: "Points; other features use their centre"
		}],
		params: [],
		outputGeometry: "polygon",
		outputName: (e) => `${e} triangles`,
		compute: ci
	},
	{
		id: "convexHull",
		label: "Convex hull",
		category: "aggregate",
		description: "Draws the smallest polygon that contains all features — like stretching an elastic band around them.",
		inputs: [{
			key: "a",
			label: "Input layer"
		}],
		params: [{
			kind: "select",
			key: "scope",
			label: "Compute",
			default: "all",
			options: [{
				value: "all",
				label: "one hull around all features"
			}, {
				value: "each",
				label: "a hull per feature"
			}]
		}],
		outputGeometry: "polygon",
		outputName: (e) => `${e} convex hull`,
		buildSql: ({ layerA: e, fieldsA: t, params: n }) => n.scope === "each" ? `
            SELECT ${J(q("a", t), "ST_ConvexHull(a.geometry) AS geometry")}
            FROM ${K(e)} a` : `SELECT COUNT(*) AS feature_count, ST_ConvexHull(ST_Collect(geometry)) AS geometry FROM ${K(e)}`
	},
	{
		id: "simplify",
		label: "Simplify",
		category: "transform",
		description: "Removes detail from lines and outlines, keeping the overall shape. Borders shared by neighbouring polygons stay identical on both sides, so no gaps or overlaps appear.",
		inputs: [{
			key: "a",
			label: "Input layer"
		}],
		params: [{
			kind: "number",
			key: "tolerance",
			label: "Tolerance",
			default: 100,
			min: 1,
			step: 10,
			unit: "m",
			hint: "Bends smaller than this disappear"
		}, {
			kind: "number",
			key: "snap",
			label: "Snap distance",
			default: 0,
			min: 0,
			step: 1,
			unit: "m",
			hint: "Snap coordinates this close together before simplifying, so a border traced twice by different sources is treated as one shared line. Too wide a value can pinch a narrow neck or pull two nearby shapes together instead — a warning appears if that happens. Leave at 0 for data from a single source."
		}],
		outputGeometry: "same",
		outputName: (e) => `${e} simplified`,
		compute: wi
	}
];
function Oi(e) {
	return Di.find((t) => t.id === e);
}
function ki(e) {
	let t = {};
	for (let n of e.params) n.kind === "field" ? t[n.key] = "" : n.kind === "aggregations" ? t[n.key] = [] : t[n.key] = n.default;
	return t;
}
var Ai = {
	overlay: "Combine two layers",
	selection: "Select and join",
	aggregate: "Summarise",
	transform: "Reshape"
}, X = "var(--webmapx-data-tool, #0f62fe)", ji = "var(--webmapx-data-end, #e63946)", Z = "var(--webmapx-data-start, #22c55e)", Mi = "M14 10 H58 V44 H14 Z", Ni = "M42 10 H86 V44 H42 Z", Pi = "M42 10 H58 V44 H42 Z", Fi = "M14 10 H42 V44 H14 Z", Ii = "M58 10 H86 V44 H58 Z";
function Q(e) {
	return n`
        <svg viewBox="0 0 100 52" role="img" aria-hidden="true" focusable="false">
            ${e}
        </svg>`;
}
function Li(e, t, r) {
	return n`<path class=${e} d=${t} fill="none" stroke=${r} stroke-width="1.5" stroke-dasharray="3 2" />`;
}
var Ri = Li("gp-a", Mi, X), zi = Li("gp-b", Ni, ji);
function Bi(e) {
	return n`<path class="gp-result" d=${e} fill=${Z} fill-opacity="0.55" stroke=${Z} stroke-width="2" />`;
}
var Vi = {
	clip: Q(n`
        ${Ri}${zi}
        ${Bi(Pi)}`),
	erase: Q(n`
        ${Ri}${zi}
        ${Bi(Fi)}`),
	intersect: Q(n`
        ${Ri}
        <g class="gp-b">
            <path d="M42 10 H86 V26 H42 Z" fill="none" stroke=${ji} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M42 28 H86 V44 H42 Z" fill="none" stroke=${ji} stroke-width="1.5" stroke-dasharray="3 2" />
        </g>
        <g class="gp-result">
            <path d="M42 10 H58 V26 H42 Z" fill=${Z} fill-opacity="0.55" stroke=${Z} stroke-width="2" />
            <path d="M42 28 H58 V44 H42 Z" fill=${Z} fill-opacity="0.55" stroke=${Z} stroke-width="2" />
        </g>`),
	union: Q(n`
        ${Ri}${zi}
        <g class="gp-result">
            <path d=${Fi} fill=${Z} fill-opacity="0.3" stroke=${Z} stroke-width="2" />
            <path d=${Pi} fill=${Z} fill-opacity="0.7" stroke=${Z} stroke-width="2" />
            <path d=${Ii} fill=${Z} fill-opacity="0.3" stroke=${Z} stroke-width="2" />
        </g>`),
	selectByLocation: Q(n`
        <g class="gp-a">
            <circle cx="20" cy="16" r="3.5" fill="none" stroke=${X} stroke-width="1.5" />
            <circle cx="24" cy="38" r="3.5" fill="none" stroke=${X} stroke-width="1.5" />
            <circle cx="52" cy="20" r="3.5" fill="none" stroke=${X} stroke-width="1.5" />
            <circle cx="62" cy="34" r="3.5" fill="none" stroke=${X} stroke-width="1.5" />
            <circle cx="76" cy="22" r="3.5" fill="none" stroke=${X} stroke-width="1.5" />
        </g>
        ${Li("gp-b", Ni, ji)}
        <g class="gp-result">
            <circle cx="52" cy="20" r="3.5" fill=${Z} />
            <circle cx="62" cy="34" r="3.5" fill=${Z} />
            <circle cx="76" cy="22" r="3.5" fill=${Z} />
        </g>`),
	spatialJoin: Q(n`
        <g class="gp-a">
            <circle cx="18" cy="20" r="3.5" fill="none" stroke=${X} stroke-width="1.5" />
            <circle cx="18" cy="36" r="3.5" fill="none" stroke=${X} stroke-width="1.5" />
        </g>
        <g class="gp-b">
            <path d=${Ni} fill=${ji} fill-opacity="0.12" stroke=${ji} stroke-width="1.5" stroke-dasharray="3 2" />
            <text x="48" y="17" font-size="8" fill=${ji}>abc</text>
        </g>
        <g class="gp-result">
            <circle cx="56" cy="30" r="3.5" fill=${Z} />
            <circle cx="70" cy="36" r="3.5" fill=${Z} />
            <text x="52" y="48" font-size="8" fill=${Z}>abc</text>
        </g>`),
	dissolve: Q(n`
        ${Bi("M14 10 H86 V44 H14 Z")}
        <g class="gp-a">
            <path d="M14 10 H50 V44 H14 Z" fill="none" stroke=${X} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M50 10 H86 V44 H50 Z" fill="none" stroke=${X} stroke-width="1.5" stroke-dasharray="3 2" />
        </g>`),
	labelPoint: Q(n`
        <g class="gp-a">
            <path d="M12 12 H28 V30 H44 V12 H60 V42 H12 Z"
                  fill="none" stroke=${X} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M70 14 H88 V40 H70 Z" fill="none" stroke=${X} stroke-width="1.5" stroke-dasharray="3 2" />
        </g>
        <g class="gp-result">
            <circle cx="20" cy="25" r="4" fill=${Z} />
            <circle cx="79" cy="27" r="4" fill=${Z} />
        </g>`),
	statistics: Q(n`
        <g class="gp-a">
            <path d="M10 12 H30 V26 H10 Z" fill="none" stroke=${X} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M10 30 H30 V44 H10 Z" fill="none" stroke=${X} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M34 12 H50 V44 H34 Z" fill="none" stroke=${X} stroke-width="1.5" stroke-dasharray="3 2" />
        </g>
        <g class="gp-result">
            <path d="M60 12 H92 M60 22 H92 M60 32 H92 M60 42 H92" stroke=${Z} stroke-width="1.5" opacity="0.5" />
            <path d="M60 12 V44" stroke=${Z} stroke-width="1.5" opacity="0.5" />
            <rect x="62" y="15" width="12" height="4" fill=${Z} />
            <rect x="78" y="15" width="10" height="4" fill=${Z} />
            <rect x="62" y="25" width="8" height="4" fill=${Z} />
            <rect x="78" y="25" width="13" height="4" fill=${Z} />
            <rect x="62" y="35" width="14" height="4" fill=${Z} />
            <rect x="78" y="35" width="7" height="4" fill=${Z} />
        </g>`),
	centroid: Q(n`
        <g class="gp-a">
            <path d="M14 10 H50 V44 H14 Z" fill="none" stroke=${X} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M54 10 H86 V44 H54 Z" fill="none" stroke=${X} stroke-width="1.5" stroke-dasharray="3 2" />
        </g>
        <g class="gp-result">
            <circle cx="32" cy="27" r="4" fill=${Z} />
            <circle cx="70" cy="27" r="4" fill=${Z} />
        </g>`),
	convexHull: Q(n`
        <g class="gp-a">
            <circle cx="20" cy="34" r="2.5" fill=${X} />
            <circle cx="34" cy="12" r="2.5" fill=${X} />
            <circle cx="62" cy="10" r="2.5" fill=${X} />
            <circle cx="84" cy="26" r="2.5" fill=${X} />
            <circle cx="66" cy="44" r="2.5" fill=${X} />
            <circle cx="30" cy="42" r="2.5" fill=${X} />
            <circle cx="48" cy="26" r="2.5" fill=${X} />
            <circle cx="58" cy="32" r="2.5" fill=${X} />
        </g>
        <path class="gp-result" d="M20 34 L34 12 L62 10 L84 26 L66 44 L30 42 Z"
              fill=${Z} fill-opacity="0.35" stroke=${Z} stroke-width="2" />`),
	buffer: Q(n`
        <path class="gp-result" d="M22 40 Q34 8 50 26 Q64 42 78 14"
              fill="none" stroke=${Z} stroke-width="14" stroke-opacity="0.4"
              stroke-linecap="round" stroke-linejoin="round" />
        <path class="gp-a" d="M22 40 Q34 8 50 26 Q64 42 78 14"
              fill="none" stroke=${X} stroke-width="1.5" stroke-dasharray="3 2" />`),
	cartogram: Q(n`
        <g class="gp-a">
            <path d="M14 12 H36 V34 H14 Z" fill="none" stroke=${X} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M42 12 H64 V34 H42 Z" fill="none" stroke=${X} stroke-width="1.5" stroke-dasharray="3 2" />
            <path d="M70 12 H92 V34 H70 Z" fill="none" stroke=${X} stroke-width="1.5" stroke-dasharray="3 2" />
        </g>
        <g class="gp-result">
            <path d="M20 18 H30 V28 H20 Z" fill=${Z} fill-opacity="0.55" stroke=${Z} stroke-width="2" />
            <path d="M40 10 H66 V36 H40 Z" fill=${Z} fill-opacity="0.55" stroke=${Z} stroke-width="2" />
            <path d="M74 15 H88 V31 H74 Z" fill=${Z} fill-opacity="0.55" stroke=${Z} stroke-width="2" />
        </g>`),
	voronoi: Q(n`
        <g class="gp-result">
            <path d="M12 26 L34 20 L38 6" fill="none" stroke=${Z} stroke-width="2" />
            <path d="M34 20 L58 30 L54 46" fill="none" stroke=${Z} stroke-width="2" />
            <path d="M34 20 L48 12 L52 2" fill="none" stroke=${Z} stroke-width="2" />
            <path d="M58 30 L80 24 L92 32" fill="none" stroke=${Z} stroke-width="2" />
            <path d="M58 30 L64 48" fill="none" stroke=${Z} stroke-width="2" />
            <path d="M48 12 L74 16 L80 24" fill="none" stroke=${Z} stroke-width="2" />
            <path d="M74 16 L78 4" fill="none" stroke=${Z} stroke-width="2" />
        </g>
        <g class="gp-a">
            <circle cx="22" cy="14" r="2.5" fill=${X} />
            <circle cx="26" cy="38" r="2.5" fill=${X} />
            <circle cx="48" cy="34" r="2.5" fill=${X} />
            <circle cx="56" cy="12" r="2.5" fill=${X} />
            <circle cx="74" cy="36" r="2.5" fill=${X} />
            <circle cx="84" cy="12" r="2.5" fill=${X} />
        </g>`),
	delaunay: Q(n`
        <g class="gp-result">
            <path d="M22 14 L26 38 L48 34 Z" fill=${Z} fill-opacity="0.25" stroke=${Z} stroke-width="2" />
            <path d="M22 14 L48 34 L56 12 Z" fill=${Z} fill-opacity="0.25" stroke=${Z} stroke-width="2" />
            <path d="M48 34 L74 36 L56 12 Z" fill=${Z} fill-opacity="0.25" stroke=${Z} stroke-width="2" />
            <path d="M56 12 L74 36 L84 12 Z" fill=${Z} fill-opacity="0.25" stroke=${Z} stroke-width="2" />
        </g>
        <g class="gp-a">
            <circle cx="22" cy="14" r="2.5" fill=${X} />
            <circle cx="26" cy="38" r="2.5" fill=${X} />
            <circle cx="48" cy="34" r="2.5" fill=${X} />
            <circle cx="56" cy="12" r="2.5" fill=${X} />
            <circle cx="74" cy="36" r="2.5" fill=${X} />
            <circle cx="84" cy="12" r="2.5" fill=${X} />
        </g>`),
	simplify: Q(n`
        <path class="gp-a" d="M12 38 L22 18 L30 30 L38 12 L48 32 L58 14 L68 34 L78 16 L88 30"
              fill="none" stroke=${X} stroke-width="1.5" stroke-dasharray="3 2" />
        <path class="gp-result" d="M12 38 L38 14 L68 32 L88 18" fill="none" stroke=${Z} stroke-width="2.5" />`)
};
function Hi(e) {
	return Vi[e] ?? null;
}
//#endregion
//#region src/components/webmapx-geoprocessing-tool.ts
var Ui = "webmapx-geoprocessing-out:", Wi = "webmapx-geoprocessing-src:", Gi = new Set([
	"fill",
	"line",
	"circle",
	"symbol",
	"geojson",
	"vector",
	"label",
	"fill-extrusion"
]), $ = class extends u {
	constructor(...e) {
		super(...e), this.toolId = "geoprocessing", this.pinnedOperation = "", this.availableLayers = [], this.operationId = "", this.slots = {
			a: {
				layerId: "",
				sourceLayer: ""
			},
			b: {
				layerId: "",
				sourceLayer: ""
			}
		}, this.params = {}, this.openHints = /* @__PURE__ */ new Set(), this.outputName = "", this.outputNameEdited = !1, this.overwrite = !0, this.busy = !1, this.error = null, this.notice = null, this.summary = null, this.table = null, this.elapsed = 0, this.busyDetail = "", this.elapsedTimer = null, this.lastOutputLayerId = null, this.fieldNames = {
			a: [],
			b: []
		}, this.numericFieldNames = {
			a: [],
			b: []
		}, this.fieldsLoading = !1, this.lastMapLayers = null, this.lastMapBusy = !1, this.escHandler = null, this.fieldLoadToken = 0, this.hintWidthObserver = null;
	}
	static {
		this.styles = [
			f,
			w,
			r`
        :host { display: block; }

        :host(:not([active])) .tool-content { display: none; }

        .tool-content {
            padding: var(--sl-spacing-medium);
            display: flex;
            flex-direction: column;
            gap: var(--sl-spacing-small);
            font-size: var(--sl-font-size-small);
        }

        .category {
            margin-bottom: var(--sl-spacing-x-small);
        }

        /* Two columns, so the panel keeps the shared 300px default width. */
        .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: var(--sl-spacing-x-small);
        }

        .op {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            padding: 6px 4px;
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--webmapx-radius-md, 6px);
            background: none;
            color: inherit;
            font: inherit;
            font-size: var(--sl-font-size-x-small);
            line-height: 1.2;
            text-align: center;
            cursor: pointer;
        }

        .op:hover { border-color: var(--color-primary, #3a6ea5); }

        .op:focus-visible {
            outline: var(--webmapx-focus-width, 2px) solid var(--webmapx-focus-color, #3a6ea5);
            outline-offset: var(--webmapx-focus-offset, 2px);
        }

        .op svg { width: 100%; height: auto; display: block; }

        /*
         * Hover walks the diagram through the operation: first input A, then B is
         * added, then the result appears. At rest everything is shown at once, so
         * the grid still reads without pointing at anything — and touch devices,
         * which never hover, lose nothing.
         *
         * Selectors are on the group classes the diagram module emits (.gp-a /
         * .gp-b / .gp-result), so a new diagram animates without extra CSS.
         *
         * Hover only, deliberately not :focus-visible: the panel moves focus to
         * the first tool control on activation, which would leave the first
         * operation looping the moment the panel opens.
         */
        .op:hover .gp-b,
        .chosen:hover .gp-b {
            animation: gp-show-b 2.4s ease-in-out infinite;
        }

        .op:hover .gp-result,
        .chosen:hover .gp-result {
            animation: gp-show-result 2.4s ease-in-out infinite;
        }

        /* B joins a third of the way in, the result two thirds in — both share the
           2.4s cycle so the three phases stay locked together. */
        @keyframes gp-show-b {
            0%, 28% { opacity: 0; }
            36%, 100% { opacity: 1; }
        }

        @keyframes gp-show-result {
            0%, 61% { opacity: 0; }
            69%, 100% { opacity: 1; }
        }

        /* Stacked, not side by side: at the panel's 300px the description would be
           squeezed into a ~90px column and run to a dozen lines. */
        .chosen {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: var(--sl-spacing-x-small);
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--webmapx-radius-md, 6px);
        }

        .chosen-head {
            display: flex;
            align-items: center;
            gap: var(--sl-spacing-x-small);
        }

        .chosen svg { width: 72px; height: auto; flex: none; }

        .chosen .name { flex: 1; min-width: 0; font-weight: 600; }

        .chosen .description {
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
        }

        .hint {
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
            margin-top: 2px;
        }

        /* Not an sl-alert: this sits under a form field and must not shout, but
           it does need to be distinguishable from the neutral hint above it. */
        .hint.warning {
            display: flex;
            align-items: baseline;
            gap: 4px;
            color: var(--sl-color-warning-700, #915930);
        }

        /* A clipped hint is one line: the text takes what room there is and ends
           in an ellipsis, and the more-link sits at the end of that line. Baseline
           alignment so the link sits on the text's line, not on the box. */
        .hint.clipped {
            display: flex;
            align-items: baseline;
            gap: 4px;
        }

        /* min-width:0 is what actually lets a flex child shrink far enough to
           overflow — without it the text refuses to clip and pushes the
           more-link out of the panel. */
        .hint.clipped .hint-text {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* Hidden until the text is measured as actually clipped, so a hint that
           already fits gets no more-link. markClippedHints adds the class. */
        .hint-more { display: none; }
        .hint.is-clipped .hint-more { display: inline; }

        /* Blue, because it is a link in everything but markup: it reveals the
           rest of a sentence rather than performing an action. */
        .hint-more {
            flex: none;
            border: 0;
            padding: 0;
            background: none;
            font: inherit;
            color: var(--color-primary, #1b6ec2);
            cursor: pointer;
        }

        .hint-more:hover { text-decoration: underline; }

        /* Never strip a focus ring without putting an equivalent back. */
        .hint-more:focus-visible {
            outline: var(--webmapx-focus-ring-width, 2px) solid var(--webmapx-focus-ring-color, #1b6ec2);
            outline-offset: 2px;
            border-radius: 2px;
        }

        .field-label {
            display: block;
            margin-bottom: 4px;
        }

        .agg-row {
            display: grid;
            grid-template-columns: 1fr 1fr auto;
            align-items: center;
            gap: 4px;
            margin-bottom: 4px;
        }

        /* Indented under its row: these belong to the list function above them,
           and only appear when it is chosen. Wrapping, not a fixed grid — three
           controls do not fit across a 300px panel. */
        .agg-options {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 4px;
            margin: 0 0 8px 12px;
        }

        .agg-options sl-input { flex: 1 1 90px; min-width: 70px; }
        .agg-options sl-select { flex: 0 1 110px; }

        /* The table scrolls inside its own box: at 300px it cannot be shown in
           full, and widening the panel would push the buttons off screen. */
        .table-wrap {
            max-height: 240px;
            overflow: auto;
            border: 1px solid var(--color-border, #d5dbe1);
            border-radius: var(--webmapx-radius-md, 6px);
        }

        table {
            border-collapse: collapse;
            font-size: var(--sl-font-size-x-small);
            white-space: nowrap;
        }

        th, td {
            padding: 3px 8px;
            text-align: left;
            border-bottom: 1px solid var(--color-border, #d5dbe1);
        }

        th {
            position: sticky;
            top: 0;
            background: var(--color-surface, #ffffff);
            font-weight: 600;
        }

        td:not(:first-child) { text-align: right; }

        tbody tr:last-child td { border-bottom: none; }

        .summary {
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
            border-top: 1px solid var(--color-border, #d5dbe1);
            padding-top: var(--sl-spacing-x-small);
        }

        .actions {
            display: flex;
            align-items: center;
            gap: var(--sl-spacing-x-small);
            justify-content: flex-end;
            margin-top: var(--sl-spacing-x-small);
        }

        .status {
            display: flex;
            align-items: center;
            gap: var(--sl-spacing-x-small);
            margin-right: auto;
            font-size: var(--sl-font-size-x-small);
            color: var(--color-text-secondary, #5a6773);
        }

        sl-alert { font-size: var(--sl-font-size-x-small); }

        sl-select, sl-input {
            --sl-input-height-medium: 28px;
            --sl-input-font-size-medium: var(--sl-font-size-small);
        }

        /* The animation is explanatory, not decorative — but it loops, so it must
           stop entirely rather than merely shorten when motion is unwelcome. */
        @media (prefers-reduced-motion: reduce) {
            .op:hover .gp-b,
            .op:focus-visible .gp-b,
            .chosen:hover .gp-b,
            .op:hover .gp-result,
            .op:focus-visible .gp-result,
            .chosen:hover .gp-result {
                animation: none;
            }
        }
    `
		];
	}
	onActivate() {
		this.pinnedOperation && this.operationId !== this.pinnedOperation && this.handleOperationSelect(this.pinnedOperation), this.escHandler = (e) => {
			e.key === "Escape" && this.deactivate();
		}, document.addEventListener("keydown", this.escHandler), this.afterPaint().then(() => x());
	}
	onDeactivate() {
		this.escHandler && document.removeEventListener("keydown", this.escHandler), this.escHandler = null;
	}
	onStateChanged(e) {
		let t = e.mapLayers ?? {};
		this.lastMapLayers = t, this.availableLayers = Object.entries(t).filter(([, e]) => {
			let t = e.layerType;
			return !t || Gi.has(t);
		}).map(([e, t]) => ({
			id: e,
			label: t.label ?? e
		}));
		for (let e of ["a", "b"]) {
			let t = this.slots[e];
			t.layerId && !this.availableLayers.some((e) => e.id === t.layerId) && (this.setSlot(e, {
				layerId: "",
				sourceLayer: ""
			}), this.clearFieldNames(e));
		}
		this.lastOutputLayerId && !t[this.lastOutputLayerId] && (this.lastOutputLayerId = null), this.autoSelectLayers();
		let n = e.mapBusy === !0, r = this.lastMapBusy && !n;
		if (this.lastMapBusy = n, r) for (let e of ["a", "b"]) this.slots[e].layerId && !this.fieldNames[e].length && this.loadFieldNames(e);
	}
	dropUnknownFieldParams(e) {
		let t = this.operation;
		if (!t) return;
		let n = this.params;
		for (let r of t.params) if (!(r.kind !== "field" && r.kind !== "aggregations") && r.from === e) {
			if (r.kind === "field") {
				let t = r.numericOnly ? this.numericFieldNames[e] : this.fieldNames[e], i = String(n[r.key] ?? "");
				i && !t.includes(i) && (n = {
					...n,
					[r.key]: ""
				});
			} else if (r.kind === "aggregations") {
				let t = this.aggregationsFor(r.key), i = t.filter((t) => this.fieldNames[e].includes(t.field));
				i.length !== t.length && (n = {
					...n,
					[r.key]: i
				});
			}
		}
		n !== this.params && (this.params = n, this.syncOutputName());
	}
	clearFieldNames(e) {
		this.fieldNames = {
			...this.fieldNames,
			[e]: []
		}, this.numericFieldNames = {
			...this.numericFieldNames,
			[e]: []
		};
	}
	get operation() {
		return Oi(this.operationId);
	}
	labelOf(e) {
		return this.availableLayers.find((t) => t.id === e)?.label ?? e;
	}
	sourceLayers(e) {
		let t = (this.lastMapLayers ?? {})[e]?.sublayers;
		if (!Array.isArray(t)) return [];
		let n = /* @__PURE__ */ new Set(), r = (e) => {
			for (let t of e) {
				if (!t || typeof t != "object") continue;
				let e = t, i = e["source-layer"];
				typeof i == "string" && i && n.add(i), Array.isArray(e.sublayers) && r(e.sublayers);
			}
		};
		return r(t), [...n];
	}
	isViewportLimited(e) {
		let t = (this.lastMapLayers ?? {})[e]?.sourceId;
		return h(this.adapter, t);
	}
	get mapElement() {
		return this.mapHost;
	}
	setSlot(e, t) {
		this.slots = {
			...this.slots,
			[e]: {
				...this.slots[e],
				...t
			}
		};
	}
	autoSelectLayers() {
		let e = this.operation;
		if (e) {
			for (let t of e.inputs) {
				if (this.slots[t.key].layerId) continue;
				let n = new Set(e.inputs.map((e) => this.slots[e.key].layerId).filter(Boolean)), r = this.availableLayers.find((e) => !n.has(e.id));
				r && this.selectLayer(t.key, r.id, !1);
			}
			this.syncOutputName();
		}
	}
	selectLayer(e, t, n = !0) {
		let r = this.sourceLayers(t);
		this.setSlot(e, {
			layerId: t,
			sourceLayer: r[0] ?? ""
		}), this.clearFieldNames(e), this.error = null, n && (this.lastOutputLayerId = null, this.syncOutputName()), this.loadFieldNames(e);
	}
	handleOperationSelect(e) {
		let t = Oi(e);
		t && (this.operationId = e, this.params = ki(t), this.error = null, this.notice = null, this.summary = null, this.table = null, this.lastOutputLayerId = null, this.outputNameEdited = !1, this.autoSelectLayers(), this.loadFieldNames("a"), t.inputs.some((e) => e.key === "b") && this.loadFieldNames("b"));
	}
	syncOutputName() {
		if (this.outputNameEdited) return;
		let e = this.operation;
		if (!e) return;
		let t = this.slots.a.sourceLayer || this.labelOf(this.slots.a.layerId), n = this.slots.b.sourceLayer || this.labelOf(this.slots.b.layerId);
		this.outputName = e.outputName(t || "layer", n || "layer");
	}
	async loadFieldNames(e) {
		let t = this.operation;
		if (!t || !t.params.some((t) => (t.kind === "field" || t.kind === "aggregations") && t.from === e) || !this.slots[e].layerId || !this.adapter) return;
		let n = ++this.fieldLoadToken;
		this.fieldsLoading = !0;
		try {
			if (await this.afterPaint(), n !== this.fieldLoadToken) return;
			let t = await this.queryFeatures(e);
			if (n !== this.fieldLoadToken) return;
			let r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
			for (let e of t.features) for (let [t, n] of Object.entries(e.properties ?? {})) !t || typeof n == "object" && n || (r.add(t), typeof n == "number" ? i.add(t) : n !== null && a.add(t));
			for (let e of a) i.delete(e);
			this.fieldNames = {
				...this.fieldNames,
				[e]: [...r]
			}, this.numericFieldNames = {
				...this.numericFieldNames,
				[e]: [...i]
			}, this.dropUnknownFieldParams(e);
		} catch {
			n === this.fieldLoadToken && (this.fieldNames = {
				...this.fieldNames,
				[e]: []
			}, this.numericFieldNames = {
				...this.numericFieldNames,
				[e]: []
			});
		} finally {
			n === this.fieldLoadToken && (this.fieldsLoading = !1);
		}
	}
	async afterPaint() {
		await this.updateComplete, await new Promise((e) => requestAnimationFrame(() => e(null)));
	}
	queryFeatures(e) {
		let t = this.slots[e], n = t.sourceLayer ? { sourceLayer: t.sourceLayer } : void 0;
		return this.adapter.queryLayerFeatures(t.layerId, n);
	}
	async handleRun() {
		let e = this.operation;
		if (!e || !this.adapter || this.busy) return;
		let t = e.inputs.some((e) => e.key === "b");
		if (!this.slots.a.layerId || t && !this.slots.b.layerId) {
			this.error = "Choose an input layer for every slot.";
			return;
		}
		this.busy = !0, this.error = null, this.notice = null, this.summary = null, this.table = null, this.busyDetail = "", this.startElapsedTimer();
		try {
			let n = await this.queryFeatures("a");
			if (!n.features.length) {
				this.error = this.emptyInputMessage("a");
				return;
			}
			let r;
			if (t && (r = await this.queryFeatures("b"), !r.features.length)) {
				this.error = this.emptyInputMessage("b");
				return;
			}
			let i = r ? `${n.features.length} × ${r.features.length} features` : `${n.features.length} features`;
			this.busyDetail = i;
			let a = await y({
				op: "geoprocess",
				operationId: e.id,
				inputA: n,
				inputB: r,
				params: this.params,
				centerLat: this.adapter.getViewportState().center[1] ?? 0
			}, (e) => {
				this.busyDetail = `${i} — ${e}`;
			});
			this.summary = this.runSummary(e, n, r, a);
			let o = a.warnings ?? [];
			if (o.length && (this.notice = o.join(" ")), !a.features.length) {
				this.notice = [`${e.label} produced no features — the layers may not overlap.`, ...o].join(" ");
				return;
			}
			if (e.outputGeometry === "table") {
				this.table = a.features.map((e) => e.properties ?? {});
				return;
			}
			await this.addResultLayer(e, a);
		} catch (t) {
			t instanceof S ? (this.notice = `${e.label} cancelled after ${this.elapsed} s.`, this.summary = null) : (console.error(`[geoprocessing] ${e.id} failed`, t), this.error = t instanceof Error ? t.message : String(t));
		} finally {
			this.busy = !1, this.stopElapsedTimer();
		}
	}
	startElapsedTimer() {
		this.stopElapsedTimer(), this.elapsed = 0;
		let e = Date.now();
		this.elapsedTimer = setInterval(() => {
			this.elapsed = Math.round((Date.now() - e) / 1e3);
		}, 1e3);
	}
	stopElapsedTimer() {
		this.elapsedTimer && clearInterval(this.elapsedTimer), this.elapsedTimer = null;
	}
	handleCancel() {
		this.busy && b();
	}
	emptyInputMessage(e) {
		let t = this.labelOf(this.slots[e].layerId);
		return this.isViewportLimited(this.slots[e].layerId) ? `“${t}” has no features in view. Only what the map has drawn is used, so make sure the layer is switched on, is within its zoom range, and that the features you need are on screen — a layer filter also removes features here.` : `“${t}” has no features.`;
	}
	runSummary(e, t, n, r) {
		let i = (e) => `${e} ${e === 1 ? "feature" : "features"}`, a = [`${i(t.features.length)} from “${this.labelOf(this.slots.a.layerId)}”`];
		return n && a.push(`${i(n.features.length)} from “${this.labelOf(this.slots.b.layerId)}”`), `${e.label} used ${a.join(" and ")} → ${i(r.features.length)}.`;
	}
	resultAbstract(e) {
		let t = [this.labelOf(this.slots.a.layerId), this.slots.b.layerId ? this.labelOf(this.slots.b.layerId) : null].filter((e) => !!e).join(", "), n = Object.entries(this.params).map(([e, t]) => `${e}: ${t}`).join(", "), r = `Created with webmapx tool ${e.label}, parameters: {${n}} from layer: ${t}`, i = e.attribution?.(this.params);
		return i ? `${r}. ${i}` : r;
	}
	async addResultLayer(e, t) {
		let n = this.overwrite ? "" : `-${Date.now()}`, r = `${Ui}${e.id}:${this.slots.a.layerId}${n}`, i = `${Wi}${e.id}:${this.slots.a.layerId}${n}`;
		if (this.overwrite && this.lastOutputLayerId && this.mapElement) {
			this.adapter?.getSource(i)?.setData({
				type: "FeatureCollection",
				features: []
			});
			try {
				this.mapElement.removeInlineLayer(this.lastOutputLayerId);
			} catch {}
		}
		let a = this.outputName.trim() || e.outputName(this.labelOf(this.slots.a.layerId), this.labelOf(this.slots.b.layerId)), o = this.resultAbstract(e), s = {
			id: r,
			source: i,
			sources: { [i]: {
				id: i,
				type: "geojson",
				data: t
			} },
			...this.styleFor(t),
			metadata: {
				label: a,
				abstract: o,
				dynamic: !0,
				legendRole: "overlay"
			}
		};
		await this.mapElement?.addLayerRequest(s), this.lastOutputLayerId = r;
		let c = Array.isArray(t.features) ? t.features.length : 0;
		C(this, `${a} added to the map, ${c} ${c === 1 ? "feature" : "features"}`);
	}
	styleFor(e) {
		let t = new Set(e.features.map((e) => e.geometry?.type).filter(Boolean)), n = (...e) => e.some((e) => t.has(e));
		return n("Polygon", "MultiPolygon") ? {
			type: "fill",
			paint: {
				"fill-color": p,
				"fill-opacity": .35,
				"fill-outline-color": m
			}
		} : n("LineString", "MultiLineString") ? {
			type: "line",
			paint: {
				"line-color": p,
				"line-width": 3
			}
		} : {
			type: "circle",
			paint: {
				"circle-color": p,
				"circle-radius": 5,
				"circle-stroke-color": "#ffffff",
				"circle-stroke-width": 1.5
			}
		};
	}
	render() {
		return o`
            <div class="tool-content">
                ${this.operation ? this.renderChosenOperation(this.operation) : this.pinnedOperation ? t : this.renderOperationGrid()}
                ${this.operation ? this.renderForm(this.operation) : t}
                ${this.table ? this.renderTable(this.table) : t}
                ${this.summary ? o`<div class="summary">${this.summary}</div>` : t}
                ${this.renderMessages()}
                ${this.renderActions()}
            </div>
        `;
	}
	renderOperationGrid() {
		return o`
            <div class="hint">Choose what you want to do:</div>
            ${[...new Set(Di.map((e) => e.category))].map((e) => o`
                <section class="panel-section">
                <div class="category section-heading">${Ai[e]}</div>
                <div class="grid">
                    ${Di.filter((t) => t.category === e).map((e) => o`
                        <button
                            class="op"
                            type="button"
                            title=${e.description}
                            @click=${() => this.handleOperationSelect(e.id)}
                        >
                            ${Hi(e.id)}
                            <span>${e.label}</span>
                        </button>
                    `)}
                </div>
                </section>
            `)}
        `;
	}
	renderChosenOperation(e) {
		return o`
            <div class="chosen">
                <div class="chosen-head">
                    ${Hi(e.id)}
                    <!-- A pinned operation is the panel's own title ("Cartogram"),
                         so naming it again here only repeats it. -->
                    ${this.pinnedOperation ? t : o`<div class="name">${e.label}</div>`}
                    ${this.pinnedOperation ? t : o`
                        <sl-button
                            size="small"
                            variant="text"
                            ?disabled=${this.busy}
                            @click=${() => {
			this.operationId = "", this.error = null, this.notice = null, this.summary = null, this.table = null;
		}}
                        >Change</sl-button>
                    `}
                </div>
                <div class="description">${e.description}</div>
            </div>
        `;
	}
	renderForm(e) {
		let n = this.availableLayers.length > 0;
		return o`
            ${e.inputs.map((e) => {
			let r = this.slots[e.key], i = this.sourceLayers(r.layerId);
			return o`
                    <div>
                        <sl-select
                            label=${e.label}
                            size="small"
                            value=${r.layerId}
                            ?disabled=${!n || this.busy}
                            @sl-change=${(t) => this.selectLayer(e.key, t.target.value)}
                        >
                            ${n ? this.availableLayers.map((e) => o`<sl-option value=${e.id}>${e.label}</sl-option>`) : o`<sl-option value="">No vector layers on the map</sl-option>`}
                        </sl-select>
                        ${this.renderHint(`input:${e.key}`, e.hint)}
                        ${r.layerId && this.isViewportLimited(r.layerId) ? o`
                            <div class="hint warning">
                                <sl-icon name="exclamation-triangle"></sl-icon>
                                Only the features drawn in the current view are used.
                            </div>
                        ` : t}
                        ${i.length > 1 ? o`
                            <sl-select
                                label="Sub-layer"
                                size="small"
                                value=${r.sourceLayer}
                                ?disabled=${this.busy}
                                @sl-change=${(t) => {
				this.setSlot(e.key, { sourceLayer: t.target.value }), this.fieldNames = {
					...this.fieldNames,
					[e.key]: []
				}, this.syncOutputName(), this.loadFieldNames(e.key);
			}}
                            >
                                ${i.map((e) => o`<sl-option value=${e}>${e}</sl-option>`)}
                            </sl-select>
                        ` : t}
                    </div>
                `;
		})}

            ${e.params.filter((e) => e.showWhen?.(this.params) !== !1).map((e) => this.renderParam(e))}

            ${e.outputGeometry === "table" ? t : o`
                <sl-input
                    label="Output layer name"
                    size="small"
                    .value=${this.outputName}
                    ?disabled=${this.busy}
                    @sl-change=${(e) => {
			this.outputName = e.target.value, this.outputNameEdited = !0;
		}}
                ></sl-input>
            `}

            ${this.lastOutputLayerId ? o`
                <sl-checkbox
                    size="small"
                    ?checked=${this.overwrite}
                    ?disabled=${this.busy}
                    @sl-change=${(e) => {
			this.overwrite = e.target.checked;
		}}
                >Replace previous result</sl-checkbox>
            ` : t}
        `;
	}
	updated(e) {
		super.updated?.(e), this.markClippedHints(), e.has("error") && this.error && C(this, this.error), e.has("notice") && this.notice && C(this, this.notice);
	}
	markClippedHints() {
		let e = this.shadowRoot?.querySelectorAll(".hint.clipped");
		if (e) for (let t of e) {
			let e = t.querySelector(".hint-text");
			e && t.classList.toggle("is-clipped", e.scrollWidth > e.clientWidth + 1);
		}
	}
	firstUpdated(e) {
		super.firstUpdated?.(e), !(typeof ResizeObserver > "u") && (this.hintWidthObserver = new ResizeObserver(() => this.markClippedHints()), this.hintWidthObserver.observe(this));
	}
	renderHint(e, n) {
		if (!n) return t;
		let r = this.openHints.has(e);
		return o`
            <div class="hint ${r ? "open" : "clipped"}" data-hint=${e}>
                <span class="hint-text">${n}</span>
                ${r ? t : o`
                    <button
                        type="button"
                        class="hint-more"
                        title=${n}
                        @click=${() => {
			this.openHints = new Set([...this.openHints, e]);
		}}
                    >more…</button>
                `}
            </div>
        `;
	}
	renderParamHint(e) {
		return this.renderHint(`param:${e.key}`, e.hint);
	}
	renderParam(e) {
		let n = (t) => {
			this.params = {
				...this.params,
				[e.key]: t
			};
		};
		if (e.kind === "number") return o`
                <div>
                    <sl-input
                        label=${e.label}
                        size="small"
                        type="number"
                        min=${e.min ?? t}
                        max=${e.max ?? t}
                        step=${e.step ?? t}
                        value=${String(this.params[e.key] ?? e.default)}
                        ?disabled=${this.busy}
                        @sl-change=${(e) => {
			let t = parseFloat(e.target.value);
			Number.isNaN(t) || n(t);
		}}
                    >
                        ${e.unit ? o`<span slot="suffix">${e.unit}</span>` : t}
                    </sl-input>
                    ${this.renderParamHint(e)}
                </div>
            `;
		if (e.kind === "select") return o`
                <div>
                    <sl-select
                        label=${e.label}
                        size="small"
                        value=${String(this.params[e.key] ?? e.default)}
                        ?disabled=${this.busy}
                        @sl-change=${(e) => n(e.target.value)}
                    >
                        ${e.options.map((e) => o`<sl-option value=${e.value}>${e.label}</sl-option>`)}
                    </sl-select>
                    ${this.renderParamHint(e)}
                </div>
            `;
		if (e.kind === "aggregations") return this.renderAggregations(e);
		let r = e.numericOnly ? this.numericFieldNames[e.from] : this.fieldNames[e.from];
		return o`
            <div>
                <sl-select
                    label=${e.label}
                    size="small"
                    value=${String(this.params[e.key] ?? "")}
                    ?disabled=${this.busy || !r.length}
                    @sl-change=${(e) => n(e.target.value)}
                >
                    ${e.optional ? o`<sl-option value="">(all features together)</sl-option>` : t}
                    ${r.map((e) => o`<sl-option value=${e}>${e}</sl-option>`)}
                </sl-select>
                ${this.renderParamHint(e)}
            </div>
        `;
	}
	renderAggregations(e) {
		let n = this.aggregationsFor(e.key), r = this.fieldNames[e.from], i = this.numericFieldNames[e.from], a = (e) => i.includes(e), s = (e) => Er.filter((t) => !t.numericOnly || a(e)), c = (t) => {
			this.params = {
				...this.params,
				[e.key]: t
			};
		}, l = (t, n) => {
			c(this.aggregationsFor(e.key).map((e, r) => r === t ? {
				...e,
				...n
			} : e));
		};
		return o`
            <div>
                <label class="field-label">${e.label}</label>
                ${n.map((n, i) => o`
                    <div class="agg-row">
                        <sl-select
                            size="small"
                            value=${n.field}
                            ?disabled=${this.busy || !r.length}
                            @sl-change=${(e) => {
			let t = e.target.value, r = s(t);
			l(i, {
				field: t,
				fn: r.some((e) => e.value === n.fn) ? n.fn : r[0].value
			});
		}}
                        >
                            ${r.map((e) => o`<sl-option value=${e}>${e}</sl-option>`)}
                        </sl-select>
                        <sl-select
                            size="small"
                            value=${n.fn}
                            ?disabled=${this.busy}
                            @sl-change=${(e) => l(i, { fn: e.target.value })}
                        >
                            ${s(n.field).map((e) => o`
                                <sl-option value=${e.value}>${e.label}</sl-option>
                            `)}
                        </sl-select>
                        <sl-icon-button
                            name="x-lg"
                            label="Remove"
                            ?disabled=${this.busy}
                            @click=${() => c(this.aggregationsFor(e.key).filter((e, t) => t !== i))}
                        ></sl-icon-button>
                    </div>
                    ${n.fn === "list" ? o`
                        <div class="agg-options">
                            <sl-input
                                size="small"
                                placeholder="separator"
                                .value=${n.separator ?? ", "}
                                ?disabled=${this.busy}
                                @sl-change=${(e) => l(i, { separator: e.target.value })}
                            ></sl-input>
                            <sl-select
                                size="small"
                                value=${n.order ?? "asc"}
                                ?disabled=${this.busy}
                                @sl-change=${(e) => l(i, { order: e.target.value })}
                            >
                                <sl-option value="asc">A → Z</sl-option>
                                <sl-option value="desc">Z → A</sl-option>
                            </sl-select>
                            <sl-checkbox
                                size="small"
                                ?checked=${n.unique ?? !1}
                                ?disabled=${this.busy}
                                @sl-change=${(e) => l(i, { unique: e.target.checked })}
                            >once</sl-checkbox>
                        </div>
                    ` : t}
                `)}
                <sl-button
                    size="small"
                    variant="text"
                    ?disabled=${this.busy || !r.length}
                    @click=${() => c([...this.aggregationsFor(e.key), i.length ? {
			field: i[0],
			fn: "sum"
		} : {
			field: r[0] ?? "",
			fn: "count"
		}])}
                >
                    <sl-icon slot="prefix" name="plus-lg"></sl-icon>
                    Add attribute
                </sl-button>
                ${this.renderParamHint(e)}
            </div>
        `;
	}
	aggregationsFor(e) {
		let t = this.params[e];
		return Array.isArray(t) ? t : [];
	}
	renderTable(e) {
		let t = [...new Set(e.flatMap((e) => Object.keys(e)))], n = (e) => typeof e == "number" ? Number(e.toFixed(3)).toLocaleString() : String(e ?? "");
		return o`
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>${t.map((e) => o`<th>${e}</th>`)}</tr>
                    </thead>
                    <tbody>
                        ${e.map((e) => o`
                            <tr>${t.map((t) => o`<td>${n(e[t])}</td>`)}</tr>
                        `)}
                    </tbody>
                </table>
            </div>
            <sl-button
                size="small"
                variant="text"
                @click=${() => this.copyTable(t, e)}
            >
                <sl-icon slot="prefix" name="clipboard"></sl-icon>
                Copy as text
            </sl-button>
        `;
	}
	async copyTable(e, t) {
		let n = [e.join("	"), ...t.map((t) => e.map((e) => String(t[e] ?? "")).join("	"))];
		try {
			await navigator.clipboard.writeText(n.join("\n")), this.notice = "Table copied to the clipboard.";
		} catch {
			this.error = "Could not copy — your browser blocked clipboard access.";
		}
	}
	renderMessages() {
		return this.error ? o`
                <sl-alert variant="danger" open>
                    <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
                    ${this.error}
                </sl-alert>
            ` : this.notice ? o`
                <sl-alert variant="warning" open>
                    <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
                    ${this.notice}
                </sl-alert>
            ` : t;
	}
	hasMissingRequiredField() {
		let e = this.operation;
		return e ? e.params.some((e) => e.kind === "field" && !e.optional && !String(this.params[e.key] ?? "").trim()) : !1;
	}
	renderActions() {
		let e = this.operation;
		return o`
            <div class="actions">
                ${this.busy ? o`
                    <div class="status">
                        <sl-spinner></sl-spinner>
                        <span>
                            Calculating${this.busyDetail ? o` ${this.busyDetail}` : t}…
                            ${this.elapsed > 2 ? o`${this.elapsed} s` : t}
                        </span>
                    </div>
                ` : t}
                ${this.busy ? o`
                        <sl-button size="small" variant="danger" outline @click=${this.handleCancel}>
                            Cancel
                        </sl-button>` : o`
                        <sl-button
                            size="small"
                            variant="primary"
                            ?disabled=${!e || !this.availableLayers.length || this.hasMissingRequiredField()}
                            @click=${this.handleRun}
                        >Calculate</sl-button>`}
            </div>`;
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.stopElapsedTimer(), this.hintWidthObserver?.disconnect(), this.hintWidthObserver = null;
	}
};
s([e({
	type: String,
	attribute: "operation"
})], $.prototype, "pinnedOperation", void 0), s([i()], $.prototype, "availableLayers", void 0), s([i()], $.prototype, "operationId", void 0), s([i()], $.prototype, "slots", void 0), s([i()], $.prototype, "params", void 0), s([i()], $.prototype, "openHints", void 0), s([i()], $.prototype, "outputName", void 0), s([i()], $.prototype, "outputNameEdited", void 0), s([i()], $.prototype, "overwrite", void 0), s([i()], $.prototype, "busy", void 0), s([i()], $.prototype, "error", void 0), s([i()], $.prototype, "notice", void 0), s([i()], $.prototype, "summary", void 0), s([i()], $.prototype, "table", void 0), s([i()], $.prototype, "elapsed", void 0), s([i()], $.prototype, "busyDetail", void 0), s([i()], $.prototype, "lastOutputLayerId", void 0), s([i()], $.prototype, "fieldNames", void 0), s([i()], $.prototype, "numericFieldNames", void 0), s([i()], $.prototype, "fieldsLoading", void 0), $ = s([a("webmapx-geoprocessing-tool")], $);
//#endregion
export { $ as t };
