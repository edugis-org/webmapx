//#region src/utils/solar.ts
var e = Math.PI / 180, t = {
	sunset: -.833,
	horizon: 0,
	civil: -6,
	nautical: -12,
	astronomical: -18
}, n = 149597870.7;
function r(e) {
	return (e.getTime() / 864e5 + 2440587.5 - 2451545) / 36525;
}
function i(t = /* @__PURE__ */ new Date()) {
	let i = r(t), o = (280.46646 + i * (36000.76983 + i * 3032e-7)) % 360, s = 357.52911 + i * (35999.05029 - 1537e-7 * i), c = .016708634 - i * (42037e-9 + 1.267e-7 * i), l = Math.sin(s * e) * (1.914602 - i * (.004817 + 14e-6 * i)) + Math.sin(2 * s * e) * (.019993 - 101e-6 * i) + Math.sin(3 * s * e) * 289e-6, u = o + l, d = 125.04 - 1934.136 * i, f = u - .00569 - .00478 * Math.sin(d * e), p = 23 + (26 + (21.448 - i * (46.815 + i * (59e-5 - i * .001813))) / 60) / 60 + .00256 * Math.cos(d * e), m = Math.asin(Math.sin(p * e) * Math.sin(f * e)) / e, h = Math.tan(p * e / 2) ** 2, g = 4 * (h * Math.sin(2 * o * e) - 2 * c * Math.sin(s * e) + 4 * c * h * Math.sin(s * e) * Math.cos(2 * o * e) - .5 * h * h * Math.sin(4 * o * e) - 1.25 * c * c * Math.sin(2 * s * e)) / e, _ = a(-(t.getUTCHours() * 60 + t.getUTCMinutes() + t.getUTCSeconds() / 60 + t.getUTCMilliseconds() / 6e4 + g - 720) / 4), v = s + l;
	return {
		lon: _,
		lat: m,
		declination: m,
		equationOfTime: g,
		distanceKm: 1.000001018 * (1 - c * c) / (1 + c * Math.cos(v * e)) * n
	};
}
function a(e) {
	let t = ((e + 180) % 360 + 360) % 360 - 180;
	return t === -180 ? 180 : t;
}
function o(t, n, r, i = 720) {
	let a = n * e, o = r * e, c = [];
	for (let n = 0; n <= i; n++) {
		let r = n / i * 2 * Math.PI, s = Math.sin(a) * Math.cos(o) + Math.cos(a) * Math.sin(o) * Math.cos(r), l = Math.asin(Math.min(1, Math.max(-1, s))), u = t * e + Math.atan2(Math.sin(r) * Math.sin(o) * Math.cos(a), Math.cos(o) - Math.sin(a) * Math.sin(l));
		c.push([u / e, l / e]);
	}
	let u = 90 - n < r, d = 90 + n < r;
	return u || d ? [s(c, u ? 90 : -90)] : l(c);
}
function s(e, t) {
	let n = c(e).map(([e, t]) => [a(e), t]);
	n.sort((e, t) => e[0] - t[0]);
	let r = [
		[-180, n[0][1]],
		...n,
		[180, n[n.length - 1][1]]
	];
	return r.push([180, t], [-180, t], [-180, r[0][1]]), r;
}
function c(e) {
	let t = [], n = 0;
	for (let r = 0; r < e.length; r++) {
		if (r > 0) {
			let t = e[r][0] - e[r - 1][0];
			t > 180 ? n -= 360 : t < -180 && (n += 360);
		}
		t.push([e[r][0] + n, e[r][1]]);
	}
	return t;
}
function l(e) {
	let t = e.map(([e, t]) => [a(e), t]), n = t.length > 1 && t[0][0] === t[t.length - 1][0] && t[0][1] === t[t.length - 1][1] ? t.slice(0, -1) : t, r = n.length;
	if (r < 2) return [f(n.map(([e, t]) => [e, t]))];
	let i = [];
	for (let e = 0; e < r; e++) {
		let t = n[(e - 1 + r) % r];
		Math.abs(n[e][0] - t[0]) > 180 && i.push(e);
	}
	if (i.length === 0) return [f(n.map(([e, t]) => [e, t]))];
	let o = (e) => {
		let t = n[(e - 1 + r) % r], [i, a] = n[e], o = t[0] > 0 ? 180 : -180, s = Math.abs(i - t[0]), c = Math.abs(o - t[0]) / (360 - s);
		return {
			edge: o,
			lat: t[1] + (a - t[1]) * c
		};
	}, s = [];
	for (let e = 0; e < i.length; e++) {
		let t = i[e], a = i[(e + 1) % i.length], c = o(t), l = o(a), u = [[-c.edge, c.lat]];
		for (let e = 0; e < r; e++) {
			let i = (t + e) % r;
			if (e > 0 && i === a) break;
			u.push([n[i][0], n[i][1]]);
		}
		u.push([l.edge, l.lat]), s.push(f(u));
	}
	return s;
}
function u(e) {
	let t = e[0], n = -1;
	for (let r of e) {
		let e = 180 - Math.abs(r[0]);
		e > n && (n = e, t = r);
	}
	return t;
}
function d(e, t) {
	let [n, r] = t, i = !1;
	for (let t = 0, a = e.length - 1; t < e.length; a = t++) {
		let [o, s] = e[t], [c, l] = e[a];
		s > r != l > r && n < (c - o) * (r - s) / (l - s) + o && (i = !i);
	}
	return i;
}
function f(e) {
	let t = e[0], n = e[e.length - 1];
	return (t[0] !== n[0] || t[1] !== n[1]) && e.push([t[0], t[1]]), e;
}
var p = [
	{
		id: "sunset",
		description: "Sunrise and sunset",
		from: -t.sunset,
		to: t.sunset
	},
	{
		id: "civil",
		description: "Civil twilight",
		from: t.sunset,
		to: t.civil
	},
	{
		id: "nautical",
		description: "Nautical twilight",
		from: t.civil,
		to: t.nautical
	},
	{
		id: "astronomical",
		description: "Astronomical twilight",
		from: t.nautical,
		to: t.astronomical
	},
	{
		id: "night",
		description: "Night",
		from: t.astronomical,
		to: -90
	}
];
function m(e, t, n, r) {
	let i = o(e, t, Math.max(n, 0)).map((e) => [e]);
	if (r <= 0) return i;
	for (let n of o(e, t, r)) {
		let e = i.find((e) => d(e[0], u(n)));
		e && e.push(n.slice().reverse());
	}
	return i;
}
function h(e = /* @__PURE__ */ new Date()) {
	let t = i(e), n = a(t.lon + 180), r = -t.lat;
	return {
		type: "FeatureCollection",
		features: p.map((t) => {
			let i = 90 + t.from, o = 90 + t.to, s = i > 90 && Math.abs(r) < i - 90 ? [...m(n, r, 90, o), ...m(a(n + 180), -r, 90, 180 - i)] : m(n, r, i, o);
			return {
				type: "Feature",
				properties: {
					id: t.id,
					description: t.description,
					from: t.from,
					to: t.to,
					timestamp: e.toISOString()
				},
				geometry: s.length === 1 ? {
					type: "Polygon",
					coordinates: s[0]
				} : {
					type: "MultiPolygon",
					coordinates: s
				}
			};
		})
	};
}
function g(e = /* @__PURE__ */ new Date()) {
	let t = i(e);
	return {
		type: "FeatureCollection",
		features: [{
			type: "Feature",
			properties: {
				description: "Subsolar point",
				declination: Number(t.declination.toFixed(4)),
				equationOfTime: Number(t.equationOfTime.toFixed(3)),
				timestamp: e.toISOString()
			},
			geometry: {
				type: "Point",
				coordinates: [Number(t.lon.toFixed(5)), Number(t.lat.toFixed(5))]
			}
		}]
	};
}
function _(e, t) {
	let n = 720 - 4 * t;
	for (let r = 0; r < 2; r++) {
		let r = new Date(e + n * 6e4);
		n = 720 - 4 * t - i(r).equationOfTime;
	}
	return new Date(e + n * 6e4);
}
function v(e) {
	let t = (e) => Math.floor(e / 864e5) * 864e5 + 432e5, n = (e) => i(new Date(t(e))).declination, r = (e) => {
		let t = n(e - 864e5), r = n(e), i = n(e + 864e5);
		return r >= t && r >= i || r <= t && r <= i;
	}, a = t(e.getTime()), o = a;
	for (let e = 0; e <= 200; e++) {
		let t = a - e * 864e5;
		if (r(t)) {
			o = t;
			break;
		}
	}
	let s = o + 183 * 864e5;
	for (let e = 150; e <= 200; e++) {
		let t = o + e * 864e5;
		if (r(t)) {
			s = t;
			break;
		}
	}
	return {
		start: o,
		end: s
	};
}
function y(e = /* @__PURE__ */ new Date(), t = {}) {
	let n = Math.min(30, Math.max(.5, t.stepDegrees ?? 2)), r = [], a = e.getUTCFullYear(), o = Math.floor(e.getTime() / 864e5) * 864e5, s = v(e), { first: c, last: l } = (() => {
		switch (t.span) {
			case "day": return {
				first: o,
				last: o
			};
			case "half-year": return {
				first: o - 91 * 864e5,
				last: o + 91 * 864e5
			};
			case "year": return {
				first: Date.UTC(a, 0, 1),
				last: Date.UTC(a + 1, 0, 1) - 864e5
			};
			default: return {
				first: s.start - 432e5,
				last: s.end - 432e5
			};
		}
	})(), u = Math.round((l - c) / 864e5) + 1;
	for (let e = 0; e < u; e++) {
		let t = c + e * 864e5, a = [];
		for (let e = -180; e <= 180; e += n) {
			let n = _(t, e);
			a.push([Number(e.toFixed(4)), Number(i(n).lat.toFixed(5))]);
		}
		let o = new Date(t + 432e5), l = i(o).declination;
		r.push({
			type: "Feature",
			properties: {
				date: o.toISOString().slice(0, 10),
				month: o.getUTCMonth() + 1,
				declination: Number(l.toFixed(4)),
				solstice: o.getTime() === s.start || o.getTime() === s.end ? l > 0 ? "june" : "december" : null
			},
			geometry: {
				type: "LineString",
				coordinates: a
			}
		});
	}
	return {
		type: "FeatureCollection",
		features: r
	};
}
function b(t = /* @__PURE__ */ new Date()) {
	let n = r(t);
	return 23 + (26 + (21.448 - n * (46.815 + n * (59e-5 - n * .001813))) / 60) / 60 + .00256 * Math.cos((125.04 - 1934.136 * n) * e);
}
function x(e = (/* @__PURE__ */ new Date()).getUTCFullYear(), t = {}) {
	let n = t.hourUtc ?? 12, r = t.today ?? /* @__PURE__ */ new Date(), a = `${String(n).padStart(2, "0")}:00 UTC`, o = (Date.UTC(e + 1, 0, 1) - Date.UTC(e, 0, 1)) / 864e5, s = [];
	for (let t = 0; t < o; t++) {
		let r = i(new Date(Date.UTC(e, 0, 1) + t * 864e5 + n * 36e5));
		s.push([Number(r.lon.toFixed(5)), Number(r.lat.toFixed(5))]);
	}
	let c = s.map((t, r) => {
		let i = new Date(Date.UTC(e, 0, 1) + r * 864e5).toISOString().slice(0, 10);
		return {
			type: "Feature",
			properties: {
				description: `The sun stands here at ${a} on ${i}`,
				date: i,
				dayOfYear: r + 1,
				year: e,
				hourUtc: n,
				longitude: t[0],
				latitude: t[1],
				equationOfTimeMinutes: Number(((t[0] - (12 - n) * 15) * 4).toFixed(2))
			},
			geometry: {
				type: "LineString",
				coordinates: [t, s[(r + 1) % s.length]]
			}
		};
	}), l = r.toISOString().slice(0, 10), u = c.find((e) => e.properties?.date === l);
	return u && c.push({
		type: "Feature",
		properties: {
			...u.properties,
			today: !0
		},
		geometry: {
			type: "Point",
			coordinates: u.geometry.coordinates[0]
		}
	}), {
		type: "FeatureCollection",
		features: c
	};
}
function S(e = /* @__PURE__ */ new Date()) {
	let t = i(e), n = [];
	for (let r = -11; r <= 12; r++) {
		let i = a(t.lon + r * 15);
		n.push({
			type: "Feature",
			properties: {
				solarHour: ((12 + r) % 24 + 24) % 24,
				noon: r === 0,
				timestamp: e.toISOString()
			},
			geometry: {
				type: "LineString",
				coordinates: [
					[i, -85],
					[i, 0],
					[i, 85]
				]
			}
		});
	}
	return {
		type: "FeatureCollection",
		features: n
	};
}
function C(t = /* @__PURE__ */ new Date(), n = {}) {
	let r = i(t).declination, a = n.hours ?? [
		0,
		2,
		4,
		6,
		8,
		10,
		12,
		14,
		16,
		18,
		20,
		22,
		24
	], o = [];
	for (let n of a) {
		let i = n / 2 * 15 * e, a = -Math.cos(i) / Math.tan(r * e), s = Math.atan(a) / e;
		!Number.isFinite(s) || Math.abs(s) > 89.5 || o.push({
			type: "Feature",
			properties: {
				hours: n,
				description: n === 12 ? "Twelve hours of daylight" : n === 24 ? "Midnight sun begins" : n === 0 ? "Polar night begins" : `${n} hours of daylight`,
				date: t.toISOString().slice(0, 10)
			},
			geometry: {
				type: "LineString",
				coordinates: Array.from({ length: 181 }, (e, t) => [-180 + t * 2, Number(s.toFixed(5))])
			}
		});
	}
	return {
		type: "FeatureCollection",
		features: o
	};
}
//#endregion
//#region src/utils/graticule.ts
var w = [
	30,
	15,
	10,
	5,
	2,
	1,
	.5,
	.25,
	.1
], T = 2;
function E(e, t, n) {
	let r = Number(e.toFixed(4));
	return r === 0 ? "0°" : `${Math.abs(r)}° ${r > 0 ? t : n}`;
}
function D(e = {}) {
	let t = w.includes(e.spacingDegrees ?? 0) ? e.spacingDegrees : 15, n = [];
	for (let e = -180; e < 180; e += t) {
		let t = [];
		for (let n = -90; n <= 90; n += T) t.push([e, n]);
		n.push({
			type: "Feature",
			properties: {
				kind: "meridian",
				degrees: e,
				label: E(e, "E", "W")
			},
			geometry: {
				type: "LineString",
				coordinates: t
			}
		});
	}
	for (let e = -90 + t; e < 90; e += t) {
		let t = [];
		for (let n = -180; n <= 180; n += T) t.push([n, e]);
		n.push({
			type: "Feature",
			properties: {
				kind: "parallel",
				degrees: e,
				label: E(e, "N", "S")
			},
			geometry: {
				type: "LineString",
				coordinates: t
			}
		});
	}
	return {
		type: "FeatureCollection",
		features: n
	};
}
function O(e = /* @__PURE__ */ new Date()) {
	let t = b(e);
	return {
		type: "FeatureCollection",
		features: [
			{
				id: "arctic",
				description: "Arctic Circle",
				lat: 90 - t
			},
			{
				id: "cancer",
				description: "Tropic of Cancer",
				lat: t
			},
			{
				id: "equator",
				description: "Equator",
				lat: 0
			},
			{
				id: "capricorn",
				description: "Tropic of Capricorn",
				lat: -t
			},
			{
				id: "antarctic",
				description: "Antarctic Circle",
				lat: -(90 - t)
			}
		].map((n) => ({
			type: "Feature",
			properties: {
				id: n.id,
				description: n.description,
				latitude: Number(n.lat.toFixed(5)),
				axialTilt: Number(t.toFixed(5)),
				date: e.toISOString().slice(0, 10)
			},
			geometry: {
				type: "LineString",
				coordinates: Array.from({ length: 181 }, (e, t) => [-180 + t * 2, Number(n.lat.toFixed(5))])
			}
		}))
	};
}
//#endregion
//#region src/utils/geodesy-features.ts
var k = Math.PI / 180, A = 6371008.8;
function j(e, t, n, r) {
	let i = r / A, a = n * k, o = t * k, s = e * k, c = Math.asin(Math.sin(o) * Math.cos(i) + Math.cos(o) * Math.sin(i) * Math.cos(a));
	return [ee((s + Math.atan2(Math.sin(a) * Math.sin(i) * Math.cos(o), Math.cos(i) - Math.sin(o) * Math.sin(c))) / k), c / k];
}
function ee(e) {
	return ((e + 180) % 360 + 360) % 360 - 180;
}
function te(e, t, n, r = 180) {
	let i = [];
	for (let a = 0; a <= r; a++) i.push(j(e, t, a / r * 360, n));
	let a = [], o = [i[0]];
	for (let e = 1; e < i.length; e++) Math.abs(i[e][0] - i[e - 1][0]) > 180 && (a.push(o), o = []), o.push(i[e]);
	return a.push(o), a.filter((e) => e.length > 1);
}
function ne(e, t, n = [
	500,
	1e3,
	2e3,
	5e3
]) {
	let r = [];
	for (let i of n) {
		let n = te(e, t, i * 1e3);
		r.push({
			type: "Feature",
			properties: {
				radiusKm: i,
				centre: [e, t],
				description: `${i} km`
			},
			geometry: n.length === 1 ? {
				type: "LineString",
				coordinates: n[0]
			} : {
				type: "MultiLineString",
				coordinates: n
			}
		});
	}
	return {
		type: "FeatureCollection",
		features: r
	};
}
function re(e, t, n = 128) {
	let [r, i] = [e[0] * k, e[1] * k], [a, o] = [t[0] * k, t[1] * k], s = 2 * Math.asin(Math.sqrt(Math.sin((o - i) / 2) ** 2 + Math.cos(i) * Math.cos(o) * Math.sin((a - r) / 2) ** 2)), c = [];
	for (let e = 0; e <= n; e++) {
		let t = e / n, l = s === 0 ? 1 - t : Math.sin((1 - t) * s) / Math.sin(s), u = s === 0 ? t : Math.sin(t * s) / Math.sin(s), d = l * Math.cos(i) * Math.cos(r) + u * Math.cos(o) * Math.cos(a), f = l * Math.cos(i) * Math.sin(r) + u * Math.cos(o) * Math.sin(a), p = l * Math.sin(i) + u * Math.sin(o);
		c.push([ee(Math.atan2(f, d) / k), Math.atan2(p, Math.hypot(d, f)) / k]);
	}
	let l = [], u = [c[0]];
	for (let e = 1; e < c.length; e++) Math.abs(c[e][0] - c[e - 1][0]) > 180 && (l.push(u), u = []), u.push(c[e]);
	l.push(u);
	let d = s * A / 1e3;
	return {
		type: "FeatureCollection",
		features: [{
			type: "Feature",
			properties: {
				description: "Shortest path over the ground",
				distanceKm: Number(d.toFixed(1)),
				from: e,
				to: t
			},
			geometry: l.length === 1 ? {
				type: "LineString",
				coordinates: l[0]
			} : {
				type: "MultiLineString",
				coordinates: l.filter((e) => e.length > 1)
			}
		}]
	};
}
function ie(e, t) {
	let n = [ee(e + 180), -t];
	return {
		type: "FeatureCollection",
		features: [{
			type: "Feature",
			properties: {
				description: "Here",
				role: "origin"
			},
			geometry: {
				type: "Point",
				coordinates: [e, t]
			}
		}, {
			type: "Feature",
			properties: {
				description: "Straight through the Earth from here",
				role: "antipode"
			},
			geometry: {
				type: "Point",
				coordinates: n
			}
		}]
	};
}
function ae(e = {}) {
	let t = Math.min(60, Math.max(10, e.spacingDegrees ?? 30)), n = (e.radiusKm ?? 500) * 1e3, r = [];
	for (let e = -75; e <= 75; e += t) for (let i = -180; i < 180; i += t) {
		let t = [];
		for (let r = 0; r <= 72; r++) t.push(j(i, e, r / 72 * 360, n));
		t.some((e, n) => n > 0 && Math.abs(e[0] - t[n - 1][0]) > 180) || r.push({
			type: "Feature",
			properties: {
				centre: [i, e],
				radiusKm: n / 1e3,
				description: `${n / 1e3} km circle at ${e}°, ${i}°`
			},
			geometry: {
				type: "Polygon",
				coordinates: [t]
			}
		});
	}
	return {
		type: "FeatureCollection",
		features: r
	};
}
//#endregion
//#region src/utils/moon.ts
var M = Math.PI / 180;
function oe(e) {
	return (e.getTime() / 864e5 + 2440587.5 - 2451545) / 36525;
}
function se(e, t) {
	return (280.46061837 + 360.98564736629 * (e.getTime() / 864e5 + 2440587.5 - 2451545) + 387933e-9 * t * t) % 360;
}
function N(e = /* @__PURE__ */ new Date()) {
	let t = oe(e), n = 218.316 + 481267.8813 * t, r = (134.963 + 477198.8676 * t) * M, o = (93.272 + 483202.0175 * t) * M, s = (297.8502 + 445267.1115 * t) * M, c = (n + 6.289 * Math.sin(r) - 1.274 * Math.sin(r - 2 * s) + .658 * Math.sin(2 * s) + .214 * Math.sin(2 * r) - .186 * Math.sin((357.5291 + 35999.0503 * t) * M) - .114 * Math.sin(2 * o)) * M, l = (5.128 * Math.sin(o) + .281 * Math.sin(r + o) - .278 * Math.sin(o - r) - .173 * Math.sin(o - 2 * s)) * M, u = 385001 - 20905 * Math.cos(r) - 3699 * Math.cos(2 * s - r) - 2956 * Math.cos(2 * s) - 570 * Math.cos(2 * r), d = 23.4393 * M, f = Math.asin(Math.sin(l) * Math.cos(d) + Math.cos(l) * Math.sin(d) * Math.sin(c)), p = a(Math.atan2(Math.sin(c) * Math.cos(d) - Math.tan(l) * Math.sin(d), Math.cos(c)) / M - se(e, t)), m = i(e), h = a(c / M - (m.lon + 180)) * M, g = (1 - Math.cos(s * 2 == 0 ? h : s)) / 2, _ = (s / M % 360 + 360) % 360 / 360;
	return {
		lon: p,
		lat: f / M,
		phase: _,
		illumination: Math.min(1, Math.max(0, g)),
		distanceKm: Math.round(u)
	};
}
function P(e) {
	return [
		"New moon",
		"Waxing crescent",
		"First quarter",
		"Waxing gibbous",
		"Full moon",
		"Waning gibbous",
		"Last quarter",
		"Waning crescent"
	][Math.round(e * 8) % 8];
}
function ce(e = /* @__PURE__ */ new Date()) {
	let t = N(e);
	return {
		type: "FeatureCollection",
		features: [{
			type: "Feature",
			properties: {
				description: "Sublunar point",
				phase: Number(t.phase.toFixed(4)),
				phaseName: P(t.phase),
				illumination: Number(t.illumination.toFixed(3)),
				distanceKm: t.distanceKm,
				timestamp: e.toISOString()
			},
			geometry: {
				type: "Point",
				coordinates: [Number(t.lon.toFixed(5)), Number(t.lat.toFixed(5))]
			}
		}]
	};
}
function le(e = /* @__PURE__ */ new Date()) {
	let t = N(e), n = o(t.lon, t.lat, 90).map((e) => [e]);
	return {
		type: "FeatureCollection",
		features: [{
			type: "Feature",
			properties: {
				description: "The moon is above the horizon here",
				phaseName: P(t.phase),
				illumination: Number(t.illumination.toFixed(3)),
				timestamp: e.toISOString()
			},
			geometry: n.length === 1 ? {
				type: "Polygon",
				coordinates: n[0]
			} : {
				type: "MultiPolygon",
				coordinates: n
			}
		}]
	};
}
function ue(e, t, n, r, i, a) {
	let s = (i, a) => {
		let o = Math.hypot(i, a) * n;
		return o === 0 ? [e, t] : me(e, t, r + Math.atan2(i, a) / M, o);
	}, c = [];
	for (let e = 0; e <= a; e++) {
		let t = -Math.PI / 2 + e / a * Math.PI;
		c.push(s(Math.sin(t), Math.cos(t)));
	}
	let u = 1 - 2 * i, d = [];
	for (let e = 0; e <= a; e++) {
		let t = Math.PI / 2 - e / a * Math.PI;
		d.push(s(Math.sin(t), u * Math.cos(t)));
	}
	return {
		disc: o(e, t, n),
		lit: l([...c, ...d])
	};
}
function de(e = /* @__PURE__ */ new Date(), t = {}) {
	let n = N(e), r = i(e), a = t.radiusDegrees && t.radiusDegrees > 0 ? t.radiusDegrees : 7, o = t.steps && t.steps > 3 ? t.steps : 96, s = pe(n.lon, n.lat, r.lon, r.lat), c = t.observer ? _e(t.observer[0], t.observer[1], e) : null, { disc: l, lit: u } = ue(n.lon, n.lat, a, c ? c.tilt : s, n.illumination, o), d = t.observer ? ye(t.observer[0], t.observer[1], e) : null, f = {
		phase: Number(n.phase.toFixed(4)),
		phaseName: P(n.phase),
		illumination: Number(n.illumination.toFixed(3)),
		timestamp: e.toISOString(),
		...t.observer && c ? {
			observerLon: Number(t.observer[0].toFixed(3)),
			observerLat: Number(t.observer[1].toFixed(3)),
			tilt: Number(c.tilt.toFixed(1)),
			altitude: Number(c.altitude.toFixed(1)),
			sunAltitude: Number((d ?? 0).toFixed(1)),
			belowHorizon: c.altitude <= 0,
			daylight: (d ?? 0) >= 0,
			nearZenith: c.altitude > 80
		} : {}
	};
	return {
		type: "FeatureCollection",
		features: [
			{
				type: "Feature",
				properties: {
					...f,
					id: "disc",
					description: "The moon"
				},
				geometry: fe(l.map((e) => [e]))
			},
			{
				type: "Feature",
				properties: {
					...f,
					id: "lit",
					description: `Lit: ${Math.round(n.illumination * 100)}%`
				},
				geometry: fe(u.map((e) => [e]))
			},
			...t.observer && c ? [{
				type: "Feature",
				properties: {
					...f,
					id: "horizon",
					description: "The chosen observer's horizon"
				},
				geometry: {
					type: "MultiLineString",
					coordinates: xe(n.lon, n.lat, a)
				}
			}, {
				type: "Feature",
				properties: {
					...f,
					id: "observer",
					description: c.altitude <= 0 ? "Seen from here — but the moon is below this horizon" : `Seen from here: ${c.tilt.toFixed(0)}° from straight up, moon ${c.altitude.toFixed(0)}° up`
				},
				geometry: {
					type: "Point",
					coordinates: [t.observer[0], t.observer[1]]
				}
			}] : []
		]
	};
}
function fe(e) {
	return e.length === 1 ? {
		type: "Polygon",
		coordinates: e[0]
	} : {
		type: "MultiPolygon",
		coordinates: e
	};
}
function pe(e, t, n, r) {
	let i = (n - e) * M, a = Math.sin(i) * Math.cos(r * M), o = Math.cos(t * M) * Math.sin(r * M) - Math.sin(t * M) * Math.cos(r * M) * Math.cos(i);
	return Math.atan2(a, o) / M;
}
function me(e, t, n, r) {
	let i = r * M, o = n * M, s = t * M, c = Math.asin(Math.sin(s) * Math.cos(i) + Math.cos(s) * Math.sin(i) * Math.cos(o));
	return [a((e * M + Math.atan2(Math.sin(o) * Math.sin(i) * Math.cos(s), Math.cos(i) - Math.sin(s) * Math.sin(c))) / M), c / M];
}
function he(e = /* @__PURE__ */ new Date(), t = {}) {
	let n = t.days && t.days > 0 ? t.days : 27.32, r = t.stepHours && t.stepHours > 0 ? t.stepHours : 1, i = [], a = Math.round(n * 24 / r);
	for (let t = 0; t <= a; t++) {
		let { lon: n, lat: a } = N(new Date(e.getTime() + t * r * 36e5));
		i.push([Number(n.toFixed(4)), Number(a.toFixed(4))]);
	}
	let o = ge(i), s = i.map(([, e]) => e);
	return {
		type: "FeatureCollection",
		features: [{
			type: "Feature",
			properties: {
				description: "Where the moon stands overhead, over the next month",
				days: Number(n.toFixed(2)),
				northernmost: Number(Math.max(...s).toFixed(2)),
				southernmost: Number(Math.min(...s).toFixed(2)),
				timestamp: e.toISOString()
			},
			geometry: {
				type: "MultiLineString",
				coordinates: o
			}
		}]
	};
}
function ge(e) {
	let t = [], n = [];
	for (let r = 0; r < e.length; r++) {
		let [i, a] = e[r];
		if (r > 0) {
			let [o, s] = e[r - 1];
			if (Math.abs(i - o) > 180) {
				let e = o > 0 ? 180 : -180, r = Math.abs(i - o), c = Math.abs(e - o) / (360 - r), l = s + (a - s) * c;
				n.push([e, l]), n.length > 1 && t.push(n), n = [[-e, l]];
			}
		}
		n.push([i, a]);
	}
	return n.length > 1 && t.push(n), t;
}
function _e(e, t, n = /* @__PURE__ */ new Date()) {
	let r = N(n), a = i(n), o = (a.lon - r.lon) * M, s = Math.atan2(Math.cos(a.lat * M) * Math.sin(o), Math.sin(a.lat * M) * Math.cos(r.lat * M) - Math.cos(a.lat * M) * Math.sin(r.lat * M) * Math.cos(o)), c = (e - r.lon) * M, l = Math.atan2(Math.sin(c), Math.tan(t * M) * Math.cos(r.lat * M) - Math.sin(r.lat * M) * Math.cos(c)), u = Math.asin(Math.sin(t * M) * Math.sin(r.lat * M) + Math.cos(t * M) * Math.cos(r.lat * M) * Math.cos(c)) / M;
	return {
		tilt: ((u > 89.9 ? pe(e, t, a.lon, a.lat) : (l - s) / M) % 360 + 360) % 360,
		altitude: u,
		illumination: r.illumination
	};
}
function ve(e = /* @__PURE__ */ new Date(), t = {}) {
	let n = N(e), r = t.fromLat ?? -60, i = t.toLat ?? 60, a = t.stepLat && t.stepLat > 0 ? t.stepLat : 15, o = (t.lon === void 0 ? be(e, r, i, a) : {
		lon: t.lon,
		daylight: !1
	}).lon, s = t.radiusDegrees && t.radiusDegrees > 0 ? t.radiusDegrees : 4, c = t.steps && t.steps > 3 ? t.steps : 64, l = [];
	for (let t = r; t <= i + 1e-9; t += a) {
		let r = _e(o, t, e);
		if (r.altitude <= 0) continue;
		let { disc: i, lit: a } = ue(o, t, s, r.tilt, r.illumination, c), u = ye(o, t, e), d = {
			latitude: Number(t.toFixed(2)),
			longitude: Number(o.toFixed(2)),
			tilt: Number(r.tilt.toFixed(1)),
			altitude: Number(r.altitude.toFixed(1)),
			sunAltitude: Number(u.toFixed(1)),
			daylight: u >= 0,
			nearZenith: r.altitude > 80,
			illumination: Number(r.illumination.toFixed(3)),
			phaseName: P(n.phase),
			timestamp: e.toISOString()
		};
		l.push({
			type: "Feature",
			properties: {
				...d,
				id: "disc",
				description: `As seen from ${Math.abs(t).toFixed(0)}°${t < 0 ? "S" : "N"}`
			},
			geometry: fe(i.map((e) => [e]))
		}), l.push({
			type: "Feature",
			properties: {
				...d,
				id: "lit",
				description: `Lit side ${r.tilt.toFixed(0)}° from straight up`
			},
			geometry: fe(a.map((e) => [e]))
		}), l.push({
			type: "Feature",
			properties: {
				...d,
				id: "horizon",
				description: "The observer's horizon"
			},
			geometry: {
				type: "MultiLineString",
				coordinates: xe(o, t, s)
			}
		});
	}
	return {
		type: "FeatureCollection",
		features: l
	};
}
function ye(e, t, n) {
	let r = i(n), a = (e - r.lon) * M;
	return Math.asin(Math.sin(t * M) * Math.sin(r.lat * M) + Math.cos(t * M) * Math.cos(r.lat * M) * Math.cos(a)) / M;
}
function be(e, t, n, r) {
	let o = a(i(e).lon + 90), s = {
		lon: o,
		dark: -1,
		up: -1,
		fromDusk: 0
	};
	for (let i = -180; i < 180; i += 15) {
		let c = a(o + i), l = 0, u = 0;
		for (let i = t; i <= n + 1e-9; i += r) _e(c, i, e).altitude <= 0 || (u += 1, ye(c, i, e) < 0 && (l += 1));
		let d = Math.abs(i);
		(l === s.dark ? u === s.up ? d < s.fromDusk : u > s.up : l > s.dark) && (s = {
			lon: c,
			dark: l,
			up: u,
			fromDusk: d
		});
	}
	return {
		lon: s.lon,
		daylight: s.dark === 0
	};
}
function xe(e, t, n) {
	let r = me(e, t, 180, n * 1.45);
	return ge([me(r[0], r[1], 270, n * 1.3), me(r[0], r[1], 90, n * 1.3)]);
}
//#endregion
//#region src/utils/tides.ts
var F = Math.PI / 180, Se = 6371, Ce = .0123000371, we = 332946.0487;
function Te(e, t) {
	return e * (Se ** 4 / t ** 3) * 1e3;
}
function Ee(e, t, n, r) {
	let i = Math.sin(t * F) * Math.sin(r * F) + Math.cos(t * F) * Math.cos(r * F) * Math.cos((n - e) * F);
	return Math.min(1, Math.max(-1, i));
}
function De(e) {
	return (3 * e * e - 1) / 2;
}
function Oe(e = /* @__PURE__ */ new Date()) {
	let t = N(e), n = i(e), r = Math.acos(Ee(t.lon, t.lat, n.lon, n.lat)) / F;
	return {
		moon: {
			lon: t.lon,
			lat: t.lat,
			phase: t.phase,
			amplitude: Te(Ce, t.distanceKm)
		},
		sun: {
			lon: n.lon,
			lat: n.lat,
			amplitude: Te(we, n.distanceKm)
		},
		springFactor: Math.abs(Math.cos(r * F))
	};
}
function ke(e, t, n) {
	return n.moon.amplitude * De(Ee(n.moon.lon, n.moon.lat, e, t)) + n.sun.amplitude * De(Ee(n.sun.lon, n.sun.lat, e, t));
}
function Ae(e = /* @__PURE__ */ new Date()) {
	let t = Oe(e), n = (e) => {
		let n = {
			lon: 0,
			lat: 0,
			metres: -Infinity
		};
		for (let r = -90; r <= 90; r += 2) for (let i = -180; i < 180; i += 2) {
			if (!e(i, r)) continue;
			let a = ke(i, r, t);
			a > n.metres && (n = {
				lon: i,
				lat: r,
				metres: a
			});
		}
		for (let e = n.lat - 2; e <= n.lat + 2; e += .25) if (!(e < -90 || e > 90)) for (let r = n.lon - 2; r <= n.lon + 2; r += .25) {
			let i = ke(r, e, t);
			i > n.metres && (n = {
				lon: r,
				lat: e,
				metres: i
			});
		}
		return n;
	}, r = n(() => !0);
	return [r, n((e, t) => Ee(r.lon, r.lat, e, t) < 0)].map((t) => ({
		type: "Feature",
		properties: {
			id: "high",
			description: "Tidal bulge",
			metres: Number(t.metres.toFixed(3)),
			timestamp: e.toISOString()
		},
		geometry: {
			type: "Point",
			coordinates: [a(t.lon), Number(t.lat.toFixed(3))]
		}
	}));
}
function je(e = /* @__PURE__ */ new Date(), t = {}) {
	let n = Oe(e), r = t.stepDegrees && t.stepDegrees > 0 ? t.stepDegrees : 2, i = t.levels ?? [
		-.2,
		-.15,
		-.1,
		-.05,
		0,
		.05,
		.1,
		.2,
		.3,
		.4,
		.5
	], a = [];
	for (let e = -180; e <= 180; e += r) a.push(e);
	let o = [];
	for (let e = -90; e <= 90; e += r) o.push(e);
	let s = o.map((e) => a.map((t) => ke(t, e, n))), c = [];
	for (let t of i) {
		let r = Me(a, o, s, t);
		r.length !== 0 && c.push({
			type: "Feature",
			properties: {
				id: t > 0 ? "high" : t < 0 ? "low" : "mean",
				description: `${t > 0 ? "+" : ""}${t.toFixed(2)} m`,
				metres: t,
				springFactor: Number(n.springFactor.toFixed(3)),
				phase: Number(n.moon.phase.toFixed(4)),
				phaseName: P(n.moon.phase),
				lunarAmplitude: Number(n.moon.amplitude.toFixed(3)),
				solarAmplitude: Number(n.sun.amplitude.toFixed(3)),
				timestamp: e.toISOString()
			},
			geometry: {
				type: "MultiLineString",
				coordinates: r
			}
		});
	}
	return {
		type: "FeatureCollection",
		features: c
	};
}
function Me(e, t, n, r) {
	let i = [], a = (e, t) => {
		let n = t - e;
		return n === 0 ? .5 : (r - e) / n;
	};
	for (let o = 0; o + 1 < t.length; o++) for (let s = 0; s + 1 < e.length; s++) {
		let c = n[o + 1][s], l = n[o + 1][s + 1], u = n[o][s + 1], d = n[o][s], f = (c > r ? 8 : 0) | (l > r ? 4 : 0) | (u > r ? 2 : 0) | d > r;
		if (f === 0 || f === 15) continue;
		let p = e[s], m = e[s + 1], h = t[o], g = t[o + 1], _ = () => [p + (m - p) * a(c, l), g], v = () => [p + (m - p) * a(d, u), h], y = () => [p, h + (g - h) * a(d, c)], b = () => [m, h + (g - h) * a(u, l)];
		switch (f) {
			case 1:
			case 14:
				i.push([y(), v()]);
				break;
			case 2:
			case 13:
				i.push([v(), b()]);
				break;
			case 3:
			case 12:
				i.push([y(), b()]);
				break;
			case 4:
			case 11:
				i.push([_(), b()]);
				break;
			case 6:
			case 9:
				i.push([_(), v()]);
				break;
			case 7:
			case 8:
				i.push([y(), _()]);
				break;
			case 5:
			case 10: {
				let e = (c + l + u + d) / 4;
				(f === 5 ? e > r : e <= r) ? i.push([y(), _()], [v(), b()]) : i.push([y(), v()], [_(), b()]);
				break;
			}
		}
	}
	return i;
}
function Ne(e = /* @__PURE__ */ new Date(), t = {}) {
	let n = je(e, t);
	return t.extremes === !1 ? n : {
		type: "FeatureCollection",
		features: [...n.features, ...Ae(e)]
	};
}
//#endregion
//#region src/utils/utm-zones.ts
var Pe = "CDEFGHJKLMNPQRSTUVWX";
function Fe(e, t) {
	let n = -180 + (e - 1) * 6, r = n + 6;
	if (t === "V" && e === 31) return {
		west: n,
		east: 3,
		exception: "narrowed for Norway"
	};
	if (t === "V" && e === 32) return {
		west: 3,
		east: r,
		exception: "widened for Norway"
	};
	if (t === "X") {
		if (e === 32 || e === 34 || e === 36) return {
			west: NaN,
			east: NaN,
			exception: "not used (Svalbard)"
		};
		if (e === 31) return {
			west: 0,
			east: 9,
			exception: "widened for Svalbard"
		};
		if (e === 33) return {
			west: 9,
			east: 21,
			exception: "widened for Svalbard"
		};
		if (e === 35) return {
			west: 21,
			east: 33,
			exception: "widened for Svalbard"
		};
		if (e === 37) return {
			west: 33,
			east: 42,
			exception: "widened for Svalbard"
		};
	}
	return {
		west: n,
		east: r,
		exception: null
	};
}
function Ie(e) {
	let t = -80 + Pe.indexOf(e) * 8;
	return {
		south: t,
		north: e === "X" ? 84 : t + 8
	};
}
function Le() {
	let e = [];
	for (let t of Pe) {
		let { south: n, north: r } = Ie(t);
		for (let i = 1; i <= 60; i++) {
			let { west: a, east: o, exception: s } = Fe(i, t);
			Number.isFinite(a) && e.push({
				zone: i,
				band: t,
				west: a,
				east: o,
				south: n,
				north: r,
				exception: s
			});
		}
	}
	return e;
}
function Re() {
	return {
		type: "FeatureCollection",
		features: Le().map((e) => ({
			type: "Feature",
			properties: {
				designation: `${e.zone}${e.band}`,
				zone: e.zone,
				band: e.band,
				epsg: e.south >= 0 ? 32600 + e.zone : 32700 + e.zone,
				centralMeridian: e.west + (e.east - e.west) / 2,
				exception: e.exception
			},
			geometry: {
				type: "Polygon",
				coordinates: [[
					[e.west, e.south],
					[e.east, e.south],
					[e.east, e.north],
					[e.west, e.north],
					[e.west, e.south]
				]]
			}
		}))
	};
}
//#endregion
//#region node_modules/d3-array/src/fsum.js
var ze = class {
	constructor() {
		this._partials = new Float64Array(32), this._n = 0;
	}
	add(e) {
		let t = this._partials, n = 0;
		for (let r = 0; r < this._n && r < 32; r++) {
			let i = t[r], a = e + i, o = Math.abs(e) < Math.abs(i) ? e - (a - i) : i - (a - e);
			o && (t[n++] = o), e = a;
		}
		return t[n] = e, this._n = n + 1, this;
	}
	valueOf() {
		let e = this._partials, t = this._n, n, r, i, a = 0;
		if (t > 0) {
			for (a = e[--t]; t > 0 && (n = a, r = e[--t], a = n + r, i = r - (a - n), !i););
			t > 0 && (i < 0 && e[t - 1] < 0 || i > 0 && e[t - 1] > 0) && (r = i * 2, n = a + r, r == n - a && (a = n));
		}
		return a;
	}
};
//#endregion
//#region node_modules/d3-array/src/merge.js
function* Be(e) {
	for (let t of e) yield* t;
}
function Ve(e) {
	return Array.from(Be(e));
}
//#endregion
//#region node_modules/d3-geo/src/math.js
var I = 1e-6, L = Math.PI, R = L / 2, He = L / 4, z = L * 2, B = 180 / L, V = L / 180, H = Math.abs, Ue = Math.atan, U = Math.atan2, W = Math.cos, G = Math.sin, We = Math.sign || function(e) {
	return e > 0 ? 1 : e < 0 ? -1 : 0;
}, Ge = Math.sqrt;
function Ke(e) {
	return e > 1 ? 0 : e < -1 ? L : Math.acos(e);
}
function K(e) {
	return e > 1 ? R : e < -1 ? -R : Math.asin(e);
}
//#endregion
//#region node_modules/d3-geo/src/noop.js
function q() {}
//#endregion
//#region node_modules/d3-geo/src/stream.js
function qe(e, t) {
	e && Ye.hasOwnProperty(e.type) && Ye[e.type](e, t);
}
var Je = {
	Feature: function(e, t) {
		qe(e.geometry, t);
	},
	FeatureCollection: function(e, t) {
		for (var n = e.features, r = -1, i = n.length; ++r < i;) qe(n[r].geometry, t);
	}
}, Ye = {
	Sphere: function(e, t) {
		t.sphere();
	},
	Point: function(e, t) {
		e = e.coordinates, t.point(e[0], e[1], e[2]);
	},
	MultiPoint: function(e, t) {
		for (var n = e.coordinates, r = -1, i = n.length; ++r < i;) e = n[r], t.point(e[0], e[1], e[2]);
	},
	LineString: function(e, t) {
		Xe(e.coordinates, t, 0);
	},
	MultiLineString: function(e, t) {
		for (var n = e.coordinates, r = -1, i = n.length; ++r < i;) Xe(n[r], t, 0);
	},
	Polygon: function(e, t) {
		Ze(e.coordinates, t);
	},
	MultiPolygon: function(e, t) {
		for (var n = e.coordinates, r = -1, i = n.length; ++r < i;) Ze(n[r], t);
	},
	GeometryCollection: function(e, t) {
		for (var n = e.geometries, r = -1, i = n.length; ++r < i;) qe(n[r], t);
	}
};
function Xe(e, t, n) {
	var r = -1, i = e.length - n, a;
	for (t.lineStart(); ++r < i;) a = e[r], t.point(a[0], a[1], a[2]);
	t.lineEnd();
}
function Ze(e, t) {
	var n = -1, r = e.length;
	for (t.polygonStart(); ++n < r;) Xe(e[n], t, 1);
	t.polygonEnd();
}
function Qe(e, t) {
	e && Je.hasOwnProperty(e.type) ? Je[e.type](e, t) : qe(e, t);
}
//#endregion
//#region node_modules/d3-geo/src/area.js
var $e = new ze(), et = new ze(), tt, nt, rt, it, at, J = {
	point: q,
	lineStart: q,
	lineEnd: q,
	polygonStart: function() {
		$e = new ze(), J.lineStart = ot, J.lineEnd = st;
	},
	polygonEnd: function() {
		var e = +$e;
		et.add(e < 0 ? z + e : e), this.lineStart = this.lineEnd = this.point = q;
	},
	sphere: function() {
		et.add(z);
	}
};
function ot() {
	J.point = ct;
}
function st() {
	lt(tt, nt);
}
function ct(e, t) {
	J.point = lt, tt = e, nt = t, e *= V, t *= V, rt = e, it = W(t = t / 2 + He), at = G(t);
}
function lt(e, t) {
	e *= V, t *= V, t = t / 2 + He;
	var n = e - rt, r = n >= 0 ? 1 : -1, i = r * n, a = W(t), o = G(t), s = at * o, c = it * a + s * W(i), l = s * r * G(i);
	$e.add(U(l, c)), rt = e, it = a, at = o;
}
function ut(e) {
	return et = new ze(), Qe(e, J), et * 2;
}
//#endregion
//#region node_modules/d3-geo/src/cartesian.js
function dt(e) {
	return [U(e[1], e[0]), K(e[2])];
}
function Y(e) {
	var t = e[0], n = e[1], r = W(n);
	return [
		r * W(t),
		r * G(t),
		G(n)
	];
}
function ft(e, t) {
	return e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
}
function pt(e, t) {
	return [
		e[1] * t[2] - e[2] * t[1],
		e[2] * t[0] - e[0] * t[2],
		e[0] * t[1] - e[1] * t[0]
	];
}
function mt(e, t) {
	e[0] += t[0], e[1] += t[1], e[2] += t[2];
}
function ht(e, t) {
	return [
		e[0] * t,
		e[1] * t,
		e[2] * t
	];
}
function gt(e) {
	var t = Ge(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]);
	e[0] /= t, e[1] /= t, e[2] /= t;
}
//#endregion
//#region node_modules/d3-geo/src/compose.js
function _t(e, t) {
	function n(n, r) {
		return n = e(n, r), t(n[0], n[1]);
	}
	return e.invert && t.invert && (n.invert = function(n, r) {
		return n = t.invert(n, r), n && e.invert(n[0], n[1]);
	}), n;
}
//#endregion
//#region node_modules/d3-geo/src/rotation.js
function vt(e, t) {
	return H(e) > L && (e -= Math.round(e / z) * z), [e, t];
}
vt.invert = vt;
function yt(e, t, n) {
	return (e %= z) ? t || n ? _t(xt(e), St(t, n)) : xt(e) : t || n ? St(t, n) : vt;
}
function bt(e) {
	return function(t, n) {
		return t += e, H(t) > L && (t -= Math.round(t / z) * z), [t, n];
	};
}
function xt(e) {
	var t = bt(e);
	return t.invert = bt(-e), t;
}
function St(e, t) {
	var n = W(e), r = G(e), i = W(t), a = G(t);
	function o(e, t) {
		var o = W(t), s = W(e) * o, c = G(e) * o, l = G(t), u = l * n + s * r;
		return [U(c * i - u * a, s * n - l * r), K(u * i + c * a)];
	}
	return o.invert = function(e, t) {
		var o = W(t), s = W(e) * o, c = G(e) * o, l = G(t), u = l * i - c * a;
		return [U(c * i + l * a, s * n + u * r), K(u * n - s * r)];
	}, o;
}
//#endregion
//#region node_modules/d3-geo/src/circle.js
function Ct(e, t, n, r, i, a) {
	if (n) {
		var o = W(t), s = G(t), c = r * n;
		i == null ? (i = t + r * z, a = t - c / 2) : (i = wt(o, i), a = wt(o, a), (r > 0 ? i < a : i > a) && (i += r * z));
		for (var l, u = i; r > 0 ? u > a : u < a; u -= c) l = dt([
			o,
			-s * W(u),
			-s * G(u)
		]), e.point(l[0], l[1]);
	}
}
function wt(e, t) {
	t = Y(t), t[0] -= e, gt(t);
	var n = Ke(-t[1]);
	return ((-t[2] < 0 ? -n : n) + z - I) % z;
}
//#endregion
//#region node_modules/d3-geo/src/clip/buffer.js
function Tt() {
	var e = [], t;
	return {
		point: function(e, n, r) {
			t.push([
				e,
				n,
				r
			]);
		},
		lineStart: function() {
			e.push(t = []);
		},
		lineEnd: q,
		rejoin: function() {
			e.length > 1 && e.push(e.pop().concat(e.shift()));
		},
		result: function() {
			var n = e;
			return e = [], t = null, n;
		}
	};
}
//#endregion
//#region node_modules/d3-geo/src/pointEqual.js
function Et(e, t) {
	return H(e[0] - t[0]) < 1e-6 && H(e[1] - t[1]) < 1e-6;
}
//#endregion
//#region node_modules/d3-geo/src/clip/rejoin.js
function Dt(e, t, n, r) {
	this.x = e, this.z = t, this.o = n, this.e = r, this.v = !1, this.n = this.p = null;
}
function Ot(e, t, n, r, i) {
	var a = [], o = [], s, c;
	if (e.forEach(function(e) {
		if (!((t = e.length - 1) <= 0)) {
			var t, n = e[0], r = e[t], c;
			if (Et(n, r)) {
				if (!n[2] && !r[2]) {
					for (i.lineStart(), s = 0; s < t; ++s) i.point((n = e[s])[0], n[1]);
					i.lineEnd();
					return;
				}
				r[0] += 2 * I;
			}
			a.push(c = new Dt(n, e, null, !0)), o.push(c.o = new Dt(n, null, c, !1)), a.push(c = new Dt(r, e, null, !1)), o.push(c.o = new Dt(r, null, c, !0));
		}
	}), a.length) {
		for (o.sort(t), kt(a), kt(o), s = 0, c = o.length; s < c; ++s) o[s].e = n = !n;
		for (var l = a[0], u, d;;) {
			for (var f = l, p = !0; f.v;) if ((f = f.n) === l) return;
			u = f.z, i.lineStart();
			do {
				if (f.v = f.o.v = !0, f.e) {
					if (p) for (s = 0, c = u.length; s < c; ++s) i.point((d = u[s])[0], d[1]);
					else r(f.x, f.n.x, 1, i);
					f = f.n;
				} else {
					if (p) for (u = f.p.z, s = u.length - 1; s >= 0; --s) i.point((d = u[s])[0], d[1]);
					else r(f.x, f.p.x, -1, i);
					f = f.p;
				}
				f = f.o, u = f.z, p = !p;
			} while (!f.v);
			i.lineEnd();
		}
	}
}
function kt(e) {
	if (t = e.length) {
		for (var t, n = 0, r = e[0], i; ++n < t;) r.n = i = e[n], i.p = r, r = i;
		r.n = i = e[0], i.p = r;
	}
}
//#endregion
//#region node_modules/d3-geo/src/polygonContains.js
function At(e) {
	return H(e[0]) <= L ? e[0] : We(e[0]) * ((H(e[0]) + L) % z - L);
}
function jt(e, t) {
	var n = At(t), r = t[1], i = G(r), a = [
		G(n),
		-W(n),
		0
	], o = 0, s = 0, c = new ze();
	i === 1 ? r = R + I : i === -1 && (r = -R - I);
	for (var l = 0, u = e.length; l < u; ++l) if (f = (d = e[l]).length) for (var d, f, p = d[f - 1], m = At(p), h = p[1] / 2 + He, g = G(h), _ = W(h), v = 0; v < f; ++v, m = b, g = S, _ = C, p = y) {
		var y = d[v], b = At(y), x = y[1] / 2 + He, S = G(x), C = W(x), w = b - m, T = w >= 0 ? 1 : -1, E = T * w, D = E > L, O = g * S;
		if (c.add(U(O * T * G(E), _ * C + O * W(E))), o += D ? w + T * z : w, D ^ m >= n ^ b >= n) {
			var k = pt(Y(p), Y(y));
			gt(k);
			var A = pt(a, k);
			gt(A);
			var j = (D ^ w >= 0 ? -1 : 1) * K(A[2]);
			(r > j || r === j && (k[0] || k[1])) && (s += D ^ w >= 0 ? 1 : -1);
		}
	}
	return (o < -1e-6 || o < 1e-6 && c < -1e-12) ^ s & 1;
}
//#endregion
//#region node_modules/d3-geo/src/clip/index.js
function Mt(e, t, n, r) {
	return function(i) {
		var a = t(i), o = Tt(), s = t(o), c = !1, l, u, d, f = {
			point: p,
			lineStart: h,
			lineEnd: g,
			polygonStart: function() {
				f.point = _, f.lineStart = v, f.lineEnd = y, u = [], l = [];
			},
			polygonEnd: function() {
				f.point = p, f.lineStart = h, f.lineEnd = g, u = Ve(u);
				var e = jt(l, r);
				u.length ? (c ||= (i.polygonStart(), !0), Ot(u, Pt, e, n, i)) : e && (c ||= (i.polygonStart(), !0), i.lineStart(), n(null, null, 1, i), i.lineEnd()), c &&= (i.polygonEnd(), !1), u = l = null;
			},
			sphere: function() {
				i.polygonStart(), i.lineStart(), n(null, null, 1, i), i.lineEnd(), i.polygonEnd();
			}
		};
		function p(t, n) {
			e(t, n) && i.point(t, n);
		}
		function m(e, t) {
			a.point(e, t);
		}
		function h() {
			f.point = m, a.lineStart();
		}
		function g() {
			f.point = p, a.lineEnd();
		}
		function _(e, t) {
			d.push([e, t]), s.point(e, t);
		}
		function v() {
			s.lineStart(), d = [];
		}
		function y() {
			_(d[0][0], d[0][1]), s.lineEnd();
			var e = s.clean(), t = o.result(), n, r = t.length, a, f, p;
			if (d.pop(), l.push(d), d = null, r) {
				if (e & 1) {
					if (f = t[0], (a = f.length - 1) > 0) {
						for (c ||= (i.polygonStart(), !0), i.lineStart(), n = 0; n < a; ++n) i.point((p = f[n])[0], p[1]);
						i.lineEnd();
					}
					return;
				}
				r > 1 && e & 2 && t.push(t.pop().concat(t.shift())), u.push(t.filter(Nt));
			}
		}
		return f;
	};
}
function Nt(e) {
	return e.length > 1;
}
function Pt(e, t) {
	return ((e = e.x)[0] < 0 ? e[1] - R - I : R - e[1]) - ((t = t.x)[0] < 0 ? t[1] - R - I : R - t[1]);
}
//#endregion
//#region node_modules/d3-geo/src/clip/antimeridian.js
var Ft = Mt(function() {
	return !0;
}, It, Rt, [-L, -R]);
function It(e) {
	var t = NaN, n = NaN, r = NaN, i;
	return {
		lineStart: function() {
			e.lineStart(), i = 1;
		},
		point: function(a, o) {
			var s = a > 0 ? L : -L, c = H(a - t);
			H(c - L) < 1e-6 ? (e.point(t, n = (n + o) / 2 > 0 ? R : -R), e.point(r, n), e.lineEnd(), e.lineStart(), e.point(s, n), e.point(a, n), i = 0) : r !== s && c >= L && (H(t - r) < 1e-6 && (t -= r * I), H(a - s) < 1e-6 && (a -= s * I), n = Lt(t, n, a, o), e.point(r, n), e.lineEnd(), e.lineStart(), e.point(s, n), i = 0), e.point(t = a, n = o), r = s;
		},
		lineEnd: function() {
			e.lineEnd(), t = n = NaN;
		},
		clean: function() {
			return 2 - i;
		}
	};
}
function Lt(e, t, n, r) {
	var i, a, o = G(e - n);
	return H(o) > 1e-6 ? Ue((G(t) * (a = W(r)) * G(n) - G(r) * (i = W(t)) * G(e)) / (i * a * o)) : (t + r) / 2;
}
function Rt(e, t, n, r) {
	var i;
	if (e == null) i = n * R, r.point(-L, i), r.point(0, i), r.point(L, i), r.point(L, 0), r.point(L, -i), r.point(0, -i), r.point(-L, -i), r.point(-L, 0), r.point(-L, i);
	else if (H(e[0] - t[0]) > 1e-6) {
		var a = e[0] < t[0] ? L : -L;
		i = n * a / 2, r.point(-a, i), r.point(0, i), r.point(a, i);
	} else r.point(t[0], t[1]);
}
//#endregion
//#region node_modules/d3-geo/src/clip/circle.js
function zt(e) {
	var t = W(e), n = 2 * V, r = t > 0, i = H(t) > I;
	function a(t, r, i, a) {
		Ct(a, e, n, i, t, r);
	}
	function o(e, n) {
		return W(e) * W(n) > t;
	}
	function s(e) {
		var t, n, a, s, u;
		return {
			lineStart: function() {
				s = a = !1, u = 1;
			},
			point: function(d, f) {
				var p = [d, f], m, h = o(d, f), g = r ? h ? 0 : l(d, f) : h ? l(d + (d < 0 ? L : -L), f) : 0;
				if (!t && (s = a = h) && e.lineStart(), h !== a && (m = c(t, p), (!m || Et(t, m) || Et(p, m)) && (p[2] = 1)), h !== a) u = 0, h ? (e.lineStart(), m = c(p, t), e.point(m[0], m[1])) : (m = c(t, p), e.point(m[0], m[1], 2), e.lineEnd()), t = m;
				else if (i && t && r ^ h) {
					var _;
					!(g & n) && (_ = c(p, t, !0)) && (u = 0, r ? (e.lineStart(), e.point(_[0][0], _[0][1]), e.point(_[1][0], _[1][1]), e.lineEnd()) : (e.point(_[1][0], _[1][1]), e.lineEnd(), e.lineStart(), e.point(_[0][0], _[0][1], 3)));
				}
				h && (!t || !Et(t, p)) && e.point(p[0], p[1]), t = p, a = h, n = g;
			},
			lineEnd: function() {
				a && e.lineEnd(), t = null;
			},
			clean: function() {
				return u | (s && a) << 1;
			}
		};
	}
	function c(e, n, r) {
		var i = Y(e), a = Y(n), o = [
			1,
			0,
			0
		], s = pt(i, a), c = ft(s, s), l = s[0], u = c - l * l;
		if (!u) return !r && e;
		var d = t * c / u, f = -t * l / u, p = pt(o, s), m = ht(o, d);
		mt(m, ht(s, f));
		var h = p, g = ft(m, h), _ = ft(h, h), v = g * g - _ * (ft(m, m) - 1);
		if (!(v < 0)) {
			var y = Ge(v), b = ht(h, (-g - y) / _);
			if (mt(b, m), b = dt(b), !r) return b;
			var x = e[0], S = n[0], C = e[1], w = n[1], T;
			S < x && (T = x, x = S, S = T);
			var E = S - x, D = H(E - L) < I, O = D || E < 1e-6;
			if (!D && w < C && (T = C, C = w, w = T), O ? D ? C + w > 0 ^ b[1] < (H(b[0] - x) < 1e-6 ? C : w) : C <= b[1] && b[1] <= w : E > L ^ (x <= b[0] && b[0] <= S)) {
				var k = ht(h, (-g + y) / _);
				return mt(k, m), [b, dt(k)];
			}
		}
	}
	function l(t, n) {
		var i = r ? e : L - e, a = 0;
		return t < -i ? a |= 1 : t > i && (a |= 2), n < -i ? a |= 4 : n > i && (a |= 8), a;
	}
	return Mt(o, s, a, r ? [0, -e] : [-L, e - L]);
}
//#endregion
//#region node_modules/d3-geo/src/clip/line.js
function Bt(e, t, n, r, i, a) {
	var o = e[0], s = e[1], c = t[0], l = t[1], u = 0, d = 1, f = c - o, p = l - s, m = n - o;
	if (!(!f && m > 0)) {
		if (m /= f, f < 0) {
			if (m < u) return;
			m < d && (d = m);
		} else if (f > 0) {
			if (m > d) return;
			m > u && (u = m);
		}
		if (m = i - o, !(!f && m < 0)) {
			if (m /= f, f < 0) {
				if (m > d) return;
				m > u && (u = m);
			} else if (f > 0) {
				if (m < u) return;
				m < d && (d = m);
			}
			if (m = r - s, !(!p && m > 0)) {
				if (m /= p, p < 0) {
					if (m < u) return;
					m < d && (d = m);
				} else if (p > 0) {
					if (m > d) return;
					m > u && (u = m);
				}
				if (m = a - s, !(!p && m < 0)) {
					if (m /= p, p < 0) {
						if (m > d) return;
						m > u && (u = m);
					} else if (p > 0) {
						if (m < u) return;
						m < d && (d = m);
					}
					return u > 0 && (e[0] = o + u * f, e[1] = s + u * p), d < 1 && (t[0] = o + d * f, t[1] = s + d * p), !0;
				}
			}
		}
	}
}
//#endregion
//#region node_modules/d3-geo/src/clip/rectangle.js
var X = 1e9, Vt = -X;
function Ht(e, t, n, r) {
	function i(i, a) {
		return e <= i && i <= n && t <= a && a <= r;
	}
	function a(i, a, s, l) {
		var u = 0, d = 0;
		if (i == null || (u = o(i, s)) !== (d = o(a, s)) || c(i, a) < 0 ^ s > 0) do
			l.point(u === 0 || u === 3 ? e : n, u > 1 ? r : t);
		while ((u = (u + s + 4) % 4) !== d);
		else l.point(a[0], a[1]);
	}
	function o(r, i) {
		return H(r[0] - e) < 1e-6 ? i > 0 ? 0 : 3 : H(r[0] - n) < 1e-6 ? i > 0 ? 2 : 1 : H(r[1] - t) < 1e-6 ? +(i > 0) : i > 0 ? 3 : 2;
	}
	function s(e, t) {
		return c(e.x, t.x);
	}
	function c(e, t) {
		var n = o(e, 1), r = o(t, 1);
		return n === r ? n === 0 ? t[1] - e[1] : n === 1 ? e[0] - t[0] : n === 2 ? e[1] - t[1] : t[0] - e[0] : n - r;
	}
	return function(o) {
		var c = o, l = Tt(), u, d, f, p, m, h, g, _, v, y, b, x = {
			point: S,
			lineStart: E,
			lineEnd: D,
			polygonStart: w,
			polygonEnd: T
		};
		function S(e, t) {
			i(e, t) && c.point(e, t);
		}
		function C() {
			for (var t = 0, n = 0, i = d.length; n < i; ++n) for (var a = d[n], o = 1, s = a.length, c = a[0], l, u, f = c[0], p = c[1]; o < s; ++o) l = f, u = p, c = a[o], f = c[0], p = c[1], u <= r ? p > r && (f - l) * (r - u) > (p - u) * (e - l) && ++t : p <= r && (f - l) * (r - u) < (p - u) * (e - l) && --t;
			return t;
		}
		function w() {
			c = l, u = [], d = [], b = !0;
		}
		function T() {
			var e = C(), t = b && e, n = (u = Ve(u)).length;
			(t || n) && (o.polygonStart(), t && (o.lineStart(), a(null, null, 1, o), o.lineEnd()), n && Ot(u, s, e, a, o), o.polygonEnd()), c = o, u = d = f = null;
		}
		function E() {
			x.point = O, d && d.push(f = []), y = !0, v = !1, g = _ = NaN;
		}
		function D() {
			u && (O(p, m), h && v && l.rejoin(), u.push(l.result())), x.point = S, v && c.lineEnd();
		}
		function O(a, o) {
			var s = i(a, o);
			if (d && f.push([a, o]), y) p = a, m = o, h = s, y = !1, s && (c.lineStart(), c.point(a, o));
			else if (s && v) c.point(a, o);
			else {
				var l = [g = Math.max(Vt, Math.min(X, g)), _ = Math.max(Vt, Math.min(X, _))], u = [a = Math.max(Vt, Math.min(X, a)), o = Math.max(Vt, Math.min(X, o))];
				Bt(l, u, e, t, n, r) ? (v || (c.lineStart(), c.point(l[0], l[1])), c.point(u[0], u[1]), s || c.lineEnd(), b = !1) : s && (c.lineStart(), c.point(a, o), b = !1);
			}
			g = a, _ = o, v = s;
		}
		return x;
	};
}
//#endregion
//#region node_modules/d3-geo/src/identity.js
var Ut = (e) => e, Z = Infinity, Wt = Z, Q = -Z, Gt = Q, Kt = {
	point: qt,
	lineStart: q,
	lineEnd: q,
	polygonStart: q,
	polygonEnd: q,
	result: function() {
		var e = [[Z, Wt], [Q, Gt]];
		return Q = Gt = -(Wt = Z = Infinity), e;
	}
};
function qt(e, t) {
	e < Z && (Z = e), e > Q && (Q = e), t < Wt && (Wt = t), t > Gt && (Gt = t);
}
//#endregion
//#region node_modules/d3-geo/src/transform.js
function Jt(e) {
	return function(t) {
		var n = new Yt();
		for (var r in e) n[r] = e[r];
		return n.stream = t, n;
	};
}
function Yt() {}
Yt.prototype = {
	constructor: Yt,
	point: function(e, t) {
		this.stream.point(e, t);
	},
	sphere: function() {
		this.stream.sphere();
	},
	lineStart: function() {
		this.stream.lineStart();
	},
	lineEnd: function() {
		this.stream.lineEnd();
	},
	polygonStart: function() {
		this.stream.polygonStart();
	},
	polygonEnd: function() {
		this.stream.polygonEnd();
	}
};
//#endregion
//#region node_modules/d3-geo/src/projection/fit.js
function Xt(e, t, n) {
	var r = e.clipExtent && e.clipExtent();
	return e.scale(150).translate([0, 0]), r != null && e.clipExtent(null), Qe(n, e.stream(Kt)), t(Kt.result()), r != null && e.clipExtent(r), e;
}
function Zt(e, t, n) {
	return Xt(e, function(n) {
		var r = t[1][0] - t[0][0], i = t[1][1] - t[0][1], a = Math.min(r / (n[1][0] - n[0][0]), i / (n[1][1] - n[0][1])), o = +t[0][0] + (r - a * (n[1][0] + n[0][0])) / 2, s = +t[0][1] + (i - a * (n[1][1] + n[0][1])) / 2;
		e.scale(150 * a).translate([o, s]);
	}, n);
}
function Qt(e, t, n) {
	return Zt(e, [[0, 0], t], n);
}
function $t(e, t, n) {
	return Xt(e, function(n) {
		var r = +t, i = r / (n[1][0] - n[0][0]), a = (r - i * (n[1][0] + n[0][0])) / 2, o = -i * n[0][1];
		e.scale(150 * i).translate([a, o]);
	}, n);
}
function en(e, t, n) {
	return Xt(e, function(n) {
		var r = +t, i = r / (n[1][1] - n[0][1]), a = -i * n[0][0], o = (r - i * (n[1][1] + n[0][1])) / 2;
		e.scale(150 * i).translate([a, o]);
	}, n);
}
//#endregion
//#region node_modules/d3-geo/src/projection/resample.js
var tn = 16, nn = W(30 * V);
function rn(e, t) {
	return +t ? on(e, t) : an(e);
}
function an(e) {
	return Jt({ point: function(t, n) {
		t = e(t, n), this.stream.point(t[0], t[1]);
	} });
}
function on(e, t) {
	function n(r, i, a, o, s, c, l, u, d, f, p, m, h, g) {
		var _ = l - r, v = u - i, y = _ * _ + v * v;
		if (y > 4 * t && h--) {
			var b = o + f, x = s + p, S = c + m, C = Ge(b * b + x * x + S * S), w = K(S /= C), T = H(H(S) - 1) < 1e-6 || H(a - d) < 1e-6 ? (a + d) / 2 : U(x, b), E = e(T, w), D = E[0], O = E[1], k = D - r, A = O - i, j = v * k - _ * A;
			(j * j / y > t || H((_ * k + v * A) / y - .5) > .3 || o * f + s * p + c * m < nn) && (n(r, i, a, o, s, c, D, O, T, b /= C, x /= C, S, h, g), g.point(D, O), n(D, O, T, b, x, S, l, u, d, f, p, m, h, g));
		}
	}
	return function(t) {
		var r, i, a, o, s, c, l, u, d, f, p, m, h = {
			point: g,
			lineStart: _,
			lineEnd: y,
			polygonStart: function() {
				t.polygonStart(), h.lineStart = b;
			},
			polygonEnd: function() {
				t.polygonEnd(), h.lineStart = _;
			}
		};
		function g(n, r) {
			n = e(n, r), t.point(n[0], n[1]);
		}
		function _() {
			u = NaN, h.point = v, t.lineStart();
		}
		function v(r, i) {
			var a = Y([r, i]), o = e(r, i);
			n(u, d, l, f, p, m, u = o[0], d = o[1], l = r, f = a[0], p = a[1], m = a[2], tn, t), t.point(u, d);
		}
		function y() {
			h.point = g, t.lineEnd();
		}
		function b() {
			_(), h.point = x, h.lineEnd = S;
		}
		function x(e, t) {
			v(r = e, t), i = u, a = d, o = f, s = p, c = m, h.point = v;
		}
		function S() {
			n(u, d, l, f, p, m, i, a, r, o, s, c, tn, t), h.lineEnd = y, y();
		}
		return h;
	};
}
//#endregion
//#region node_modules/d3-geo/src/projection/index.js
var sn = Jt({ point: function(e, t) {
	this.stream.point(e * V, t * V);
} });
function cn(e) {
	return Jt({ point: function(t, n) {
		var r = e(t, n);
		return this.stream.point(r[0], r[1]);
	} });
}
function ln(e, t, n, r, i) {
	function a(a, o) {
		return a *= r, o *= i, [t + e * a, n - e * o];
	}
	return a.invert = function(a, o) {
		return [(a - t) / e * r, (n - o) / e * i];
	}, a;
}
function un(e, t, n, r, i, a) {
	if (!a) return ln(e, t, n, r, i);
	var o = W(a), s = G(a), c = o * e, l = s * e, u = o / e, d = s / e, f = (s * n - o * t) / e, p = (s * t + o * n) / e;
	function m(e, a) {
		return e *= r, a *= i, [c * e - l * a + t, n - l * e - c * a];
	}
	return m.invert = function(e, t) {
		return [r * (u * e - d * t + f), i * (p - d * e - u * t)];
	}, m;
}
function dn(e) {
	return fn(function() {
		return e;
	})();
}
function fn(e) {
	var t, n = 150, r = 480, i = 250, a = 0, o = 0, s = 0, c = 0, l = 0, u, d = 0, f = 1, p = 1, m = null, h = Ft, g = null, _, v, y, b = Ut, x = .5, S, C, w, T, E;
	function D(e) {
		return w(e[0] * V, e[1] * V);
	}
	function O(e) {
		return e = w.invert(e[0], e[1]), e && [e[0] * B, e[1] * B];
	}
	D.stream = function(e) {
		return T && E === e ? T : T = sn(cn(u)(h(S(b(E = e)))));
	}, D.preclip = function(e) {
		return arguments.length ? (h = e, m = void 0, A()) : h;
	}, D.postclip = function(e) {
		return arguments.length ? (b = e, g = _ = v = y = null, A()) : b;
	}, D.clipAngle = function(e) {
		return arguments.length ? (h = +e ? zt(m = e * V) : (m = null, Ft), A()) : m * B;
	}, D.clipExtent = function(e) {
		return arguments.length ? (b = e == null ? (g = _ = v = y = null, Ut) : Ht(g = +e[0][0], _ = +e[0][1], v = +e[1][0], y = +e[1][1]), A()) : g == null ? null : [[g, _], [v, y]];
	}, D.scale = function(e) {
		return arguments.length ? (n = +e, k()) : n;
	}, D.translate = function(e) {
		return arguments.length ? (r = +e[0], i = +e[1], k()) : [r, i];
	}, D.center = function(e) {
		return arguments.length ? (a = e[0] % 360 * V, o = e[1] % 360 * V, k()) : [a * B, o * B];
	}, D.rotate = function(e) {
		return arguments.length ? (s = e[0] % 360 * V, c = e[1] % 360 * V, l = e.length > 2 ? e[2] % 360 * V : 0, k()) : [
			s * B,
			c * B,
			l * B
		];
	}, D.angle = function(e) {
		return arguments.length ? (d = e % 360 * V, k()) : d * B;
	}, D.reflectX = function(e) {
		return arguments.length ? (f = e ? -1 : 1, k()) : f < 0;
	}, D.reflectY = function(e) {
		return arguments.length ? (p = e ? -1 : 1, k()) : p < 0;
	}, D.precision = function(e) {
		return arguments.length ? (S = rn(C, x = e * e), A()) : Ge(x);
	}, D.fitExtent = function(e, t) {
		return Zt(D, e, t);
	}, D.fitSize = function(e, t) {
		return Qt(D, e, t);
	}, D.fitWidth = function(e, t) {
		return $t(D, e, t);
	}, D.fitHeight = function(e, t) {
		return en(D, e, t);
	};
	function k() {
		var e = un(n, 0, 0, f, p, d).apply(null, t(a, o)), m = un(n, r - e[0], i - e[1], f, p, d);
		return u = yt(s, c, l), C = _t(t, m), w = _t(u, C), S = rn(C, x), A();
	}
	function A() {
		return T = E = null, D;
	}
	return function() {
		return t = e.apply(this, arguments), D.invert = t.invert && O, k();
	};
}
//#endregion
//#region node_modules/d3-geo/src/projection/equirectangular.js
function pn(e, t) {
	return [e, t];
}
pn.invert = pn;
function mn() {
	return dn(pn).scale(152.63);
}
//#endregion
//#region src/utils/spherical-geojson.ts
var hn = mn().translate([0, 0]).scale(180 / Math.PI).precision(.5), gn = 1e-4;
function _n(e) {
	for (let t = 0; t < e.length; t++) if (Math.abs(e[t][0]) > 180 || Math.abs(e[t][1]) > 80 || t > 0 && Math.abs(e[t][0] - e[t - 1][0]) > 180) return !0;
	return !1;
}
function vn(e) {
	return ut({
		type: "Polygon",
		coordinates: [e]
	}) > 2 * Math.PI ? [...e].reverse() : e;
}
function yn(e) {
	if (new Set(e.map(([e, t]) => `${e},${t}`)).size < 3) return !1;
	let t = ut({
		type: "Polygon",
		coordinates: [e]
	}), n = ut({
		type: "Polygon",
		coordinates: [[...e].reverse()]
	});
	return Math.min(t, n) > 1e-12;
}
function bn(e) {
	let t = (e) => e.filter(yn).map(vn);
	if (e.type === "Polygon") {
		let n = t(e.coordinates);
		return n.length ? {
			type: "Polygon",
			coordinates: n
		} : null;
	}
	if (e.type === "MultiPolygon") {
		let n = e.coordinates.map(t).filter((e) => e.length > 0);
		return n.length ? {
			type: "MultiPolygon",
			coordinates: n
		} : null;
	}
	return e;
}
function xn(e) {
	let t = [], n = null, r = {
		point(e, t) {
			let r = -t;
			n?.push([e, Math.max(-89.9999, Math.min(90 - gn, r))]);
		},
		lineStart() {
			n = [];
		},
		lineEnd() {
			n && n.length >= 3 && t.push([...n, n[0]]), n = null;
		},
		polygonStart() {},
		polygonEnd() {},
		sphere() {}
	}, i = bn(e);
	return !i || (Qe(i, hn.stream(r)), t.length === 0) ? null : t.length === 1 ? {
		type: "Polygon",
		coordinates: [t[0]]
	} : {
		type: "MultiPolygon",
		coordinates: t.map((e) => [e])
	};
}
//#endregion
//#region src/utils/plate-rotation.ts
var Sn = 180 / Math.PI, Cn = Math.PI / 180, wn = [
	1,
	0,
	0,
	0
];
function Tn(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let [e, r] of Object.entries(t.rotations)) n.set(Number(e), r);
	let r = /* @__PURE__ */ new Map();
	for (let [e, n] of Object.entries(t.validTo ?? {})) r.set(Number(e), n);
	return {
		model: t.model,
		ages: t.ages,
		maxAge: t.ages[t.ages.length - 1] ?? 0,
		rotations: n,
		validTo: r,
		coastlines: e
	};
}
function En(e, t, n) {
	let [r, i, a, o] = t, s = e[0] * r + e[1] * i + e[2] * a + e[3] * o;
	if (s < 0 && (r = -r, i = -i, a = -a, o = -o, s = -s), s > .9995) {
		let t = e[0] + (r - e[0]) * n, s = e[1] + (i - e[1]) * n, c = e[2] + (a - e[2]) * n, l = e[3] + (o - e[3]) * n, u = Math.hypot(t, s, c, l) || 1;
		return [
			t / u,
			s / u,
			c / u,
			l / u
		];
	}
	let c = Math.acos(s), l = Math.sin(c), u = Math.sin((1 - n) * c) / l, d = Math.sin(n * c) / l;
	return [
		e[0] * u + r * d,
		e[1] * u + i * d,
		e[2] * u + a * d,
		e[3] * u + o * d
	];
}
function Dn(e, t, n) {
	let r = e.rotations.get(t);
	if (!r || r.length === 0) return wn;
	let { ages: i } = e;
	if (n <= i[0]) return r[0];
	if (n >= i[i.length - 1]) return r[r.length - 1];
	let a = 1;
	for (; a < i.length - 1 && i[a] < n;) a++;
	let o = a - 1, s = i[a] - i[o];
	return En(r[o], r[a], s > 0 ? (n - i[o]) / s : 0);
}
function On(e, t, n) {
	let [r, i, a, o] = e, s = n * Cn, c = t * Cn, l = Math.cos(s), u = l * Math.cos(c), d = l * Math.sin(c), f = Math.sin(s), p = 2 * (a * f - o * d), m = 2 * (o * u - i * f), h = 2 * (i * d - a * u), g = u + r * p + (a * h - o * m), _ = d + r * m + (o * p - i * h), v = f + r * h + (i * m - a * p);
	return [Math.atan2(_, g) * Sn, Math.asin(v < -1 ? -1 : v > 1 ? 1 : v) * Sn];
}
function kn(e) {
	let t = e[0][0], n = t;
	for (let r = 1; r < e.length; r++) {
		let i = e[r][0] - e[r - 1][0];
		i > 180 ? e[r][0] -= 360 : i < -180 && (e[r][0] += 360), e[r][0] < t && (t = e[r][0]), e[r][0] > n && (n = e[r][0]);
	}
	let r = -Math.round((t + n) / 2 / 360) * 360;
	if (r !== 0) for (let t of e) t[0] += r;
	return e;
}
function An(e, t) {
	let n = e;
	if (n.length === 0) return [];
	if (typeof n[0] == "number") {
		let n = e;
		return On(t, n[0], n[1]);
	}
	return typeof n[0][0] == "number" ? kn(n.map((e) => On(t, e[0], e[1]))) : n.map((e) => An(e, t));
}
function jn(e) {
	return e.type === "Polygon" ? e.coordinates : e.type === "MultiPolygon" ? e.coordinates.flat() : [];
}
function Mn(e, t) {
	let n = [];
	for (let r of e.coastlines.features) {
		if (!r.geometry) continue;
		let i = r.properties ?? {}, a = Number(i.fromAge);
		if (Number.isFinite(a) && t > a) continue;
		let o = Number(i.plateId), s = e.validTo.get(o);
		if (s !== void 0 && t > s) continue;
		let c = Number.isFinite(o) ? Dn(e, o, t) : wn, l = {
			type: r.geometry.type,
			coordinates: An(r.geometry.coordinates, c)
		}, u = jn(l).some(_n) ? xn(l) : l;
		u && n.push({
			type: "Feature",
			properties: {
				...i,
				ma: t
			},
			geometry: u
		});
	}
	return {
		type: "FeatureCollection",
		features: n
	};
}
//#endregion
//#region src/utils/computed-source-ready.ts
var Nn = /* @__PURE__ */ new Set();
function Pn(e) {
	return Nn.add(e), () => Nn.delete(e);
}
function Fn() {
	for (let e of Nn) e();
}
//#endregion
//#region src/utils/paleo-coastlines.ts
var In = {
	type: "FeatureCollection",
	features: []
};
function Ln(e, t) {
	return `${e.replace(/\/$/, "")}/rotations-${t}.json`;
}
function Rn(e) {
	return `${e.replace(/\/$/, "")}/coastlines-present.geojson`;
}
function zn(e) {
	let t = e.replace(/\/$/, "").split("/");
	return t[t.length - 1] ?? "";
}
var Bn = /* @__PURE__ */ new Map(), Vn = /* @__PURE__ */ new Map();
async function Hn(e, t) {
	let n = t || zn(e), r = `${e}|${n}`, i = Bn.get(r);
	if (i) return i;
	let a = Vn.get(r);
	if (a) return a;
	let o = (async () => {
		try {
			let [t, i] = await Promise.all([fetch(Rn(e)).then((t) => {
				if (!t.ok) throw Error(`${t.status} ${Rn(e)}`);
				return t.json();
			}), fetch(Ln(e, n)).then((t) => {
				if (!t.ok) throw Error(`${t.status} ${Ln(e, n)}`);
				return t.json();
			})]), a = Tn(t, i);
			return Bn.set(r, a), Fn(), a;
		} catch (t) {
			return console.warn(`[paleo-coastlines] could not load the plate model from ${e}:`, t), null;
		} finally {
			Vn.delete(r);
		}
	})();
	return Vn.set(r, o), o;
}
function Un(e, t) {
	return Bn.get(`${e}|${t || zn(e)}`) ?? null;
}
function Wn(e) {
	let t = e.get("data");
	if (!t) return console.warn("[paleo-coastlines] needs ?data=<directory holding the plate model>"), In;
	let n = e.get("model") ?? void 0, r = Un(t, n);
	if (!r) return Hn(t, n), In;
	let i = Number(e.get("ma"));
	return Mn(r, Number.isFinite(i) ? Math.max(0, Math.min(r.maxAge, i)) : 0);
}
//#endregion
//#region src/utils/paleo-plates.ts
var Gn = {
	type: "FeatureCollection",
	features: []
}, Kn = /* @__PURE__ */ new Map(), qn = /* @__PURE__ */ new Map(), Jn = /* @__PURE__ */ new Map(), Yn = /* @__PURE__ */ new Set();
function Xn(e) {
	return `${e.replace(/\/$/, "")}/plates-index.json`;
}
function Zn(e, t) {
	return `${e.replace(/\/$/, "")}/plates-${String(t).padStart(4, "0")}.geojson`;
}
function Qn(e, t) {
	if (e.length === 0) return null;
	let n = e[0];
	for (let r of e) Math.abs(r - t) < Math.abs(n - t) && (n = r);
	return n;
}
async function $n(e) {
	let t = Kn.get(e);
	if (t) return t;
	let n = qn.get(e);
	if (n) return n;
	let r = (async () => {
		try {
			let t = await fetch(Xn(e));
			if (!t.ok) throw Error(`${t.status} ${t.statusText}`);
			let n = await t.json();
			return !Array.isArray(n?.ages) || n.ages.length === 0 ? null : (Kn.set(e, n), n);
		} catch (t) {
			return console.warn(`[paleo-plates] no plate boundaries in ${e}:`, t), null;
		} finally {
			qn.delete(e);
		}
	})();
	return qn.set(e, r), r;
}
async function er(e, t) {
	let n = `${e}|${t}`;
	if (!(Jn.has(n) || Yn.has(n))) {
		Yn.add(n);
		try {
			let r = await fetch(Zn(e, t));
			if (!r.ok) throw Error(`${r.status} ${r.statusText}`);
			Jn.set(n, await r.json()), Fn();
		} catch (n) {
			console.warn(`[paleo-plates] ${t} Ma unavailable in ${e}:`, n);
		} finally {
			Yn.delete(n);
		}
	}
}
function tr(e) {
	let t = e.get("data");
	if (!t) return console.warn("[paleo-plates] needs ?data=<directory holding plates-index.json>"), Gn;
	let n = Kn.get(t);
	if (!n) return $n(t).then((e) => {
		e && Fn();
	}), Gn;
	let r = Number(e.get("ma")), i = Qn(n.ages, Number.isFinite(r) ? Math.max(0, r) : 0);
	if (i === null) return Gn;
	let a = Jn.get(`${t}|${i}`);
	if (a) return a;
	er(t, i);
	for (let e of [...n.ages].sort((e, t) => Math.abs(e - i) - Math.abs(t - i))) {
		let n = Jn.get(`${t}|${e}`);
		if (n) return n;
	}
	return Gn;
}
//#endregion
//#region src/utils/internal-sources.ts
function $(e, t) {
	let n = (e.get(t) ?? "").split(",").map((e) => e.trim()).filter((e) => e.length > 0).map(Number).filter(Number.isFinite);
	return n.length > 0 ? n : void 0;
}
function nr(e, t, n) {
	let r = $(e, t);
	return r?.length === 2 ? [r[0], r[1]] : n;
}
var rr = {
	click: "{click}",
	ma: "{ma}"
};
function ir(e) {
	return Object.values(rr).some((t) => e.includes(t));
}
function ar(e, t) {
	return e.includes(t);
}
function or(e, t) {
	if (!ir(e)) return e;
	let n = Array.isArray(t) ? { click: t } : t ?? {}, r = e;
	if (n.click && (r = r.split(rr.click).join(`${n.click[0]},${n.click[1]}`)), n.ma !== null && n.ma !== void 0 && (r = r.split(rr.ma).join(String(n.ma))), !ir(r)) return r;
	let [i, a = ""] = r.split("?"), o = a.split("&").filter((e) => e.length > 0 && !Object.values(rr).some((t) => e.includes(t)));
	return o.length > 0 ? `${i}?${o.join("&")}` : i;
}
var sr = "internalfunc:", cr = {
	"day-night": ({ at: e }) => h(e),
	"sun-position": ({ at: e }) => g(e),
	"sun-path": ({ at: e, query: t }) => y(t.get("year") ? new Date(Date.UTC(Number(t.get("year")), 6, 1)) : e, {
		stepDegrees: Number(t.get("step")) || void 0,
		span: t.get("span") ?? "solstice-to-solstice"
	}),
	graticule: ({ query: e }) => D({ spacingDegrees: Number(e.get("spacing")) || void 0 }),
	"reference-circles": ({ at: e }) => O(e),
	tissot: ({ query: e }) => ae({
		spacingDegrees: Number(e.get("spacing")) || void 0,
		radiusKm: Number(e.get("radius")) || void 0
	}),
	"day-length": ({ at: e, query: t }) => C(e, { hours: $(t, "hours") }),
	"solar-time": ({ at: e }) => S(e),
	analemma: ({ at: e, query: t }) => x(Number(t.get("year")) || e.getUTCFullYear(), {
		hourUtc: t.get("hour") === null ? void 0 : Number(t.get("hour")),
		today: e
	}),
	"equilibrium-tide": ({ at: e, query: t }) => Ne(e, {
		levels: $(t, "levels"),
		stepDegrees: Number(t.get("step")) || void 0,
		extremes: t.get("extremes") !== "no"
	}),
	"moon-position": ({ at: e }) => ce(e),
	"moon-phase": ({ at: e, query: t }) => de(e, {
		radiusDegrees: Number(t.get("radius")) || void 0,
		observer: $(t, "observer")?.length === 2 ? [$(t, "observer")[0], $(t, "observer")[1]] : void 0
	}),
	"moon-visibility": ({ at: e }) => le(e),
	"moon-in-sky": ({ at: e, query: t }) => ve(e, {
		lon: t.get("lon") === null ? void 0 : Number(t.get("lon")),
		fromLat: t.get("from") === null ? void 0 : Number(t.get("from")),
		toLat: t.get("to") === null ? void 0 : Number(t.get("to")),
		stepLat: Number(t.get("step")) || void 0,
		radiusDegrees: Number(t.get("radius")) || void 0
	}),
	"moon-path": ({ at: e, query: t }) => he(e, {
		days: Number(t.get("days")) || void 0,
		stepHours: Number(t.get("step")) || void 0
	}),
	"range-rings": ({ query: e }) => {
		let [t, n] = nr(e, "at", [5, 52]);
		return ne(t, n, $(e, "radii"));
	},
	"great-circle": ({ query: e }) => re(nr(e, "from", [4.9, 52.4]), nr(e, "to", [139.7, 35.7])),
	antipode: ({ query: e }) => {
		let [t, n] = nr(e, "at", [5, 52]);
		return ie(t, n);
	},
	"utm-zones": () => Re(),
	"paleo-coastlines": ({ query: e }) => Wn(e),
	"paleo-plates": ({ query: e }) => tr(e)
};
function lr(e) {
	return new URLSearchParams(e.split("?")[1] ?? "").get("refresh") === "auto";
}
function ur(e) {
	return !new URLSearchParams(e.split("?")[1] ?? "").get("at");
}
function dr(e, t) {
	let n = [];
	if (!e || typeof e != "object") return n;
	let r = e.sources;
	if (!r || typeof r != "object") return n;
	for (let [e, i] of Object.entries(r)) {
		let r = i, a = r?.internalFuncUrl ?? r?.data ?? r?.url;
		pr(a) && (n.push({
			sourceId: `${t}:${e}`,
			url: a
		}), n.push({
			sourceId: e,
			url: a
		}));
	}
	return n;
}
function fr(e, t) {
	return dr(e, t).filter((e) => lr(e.url));
}
function pr(e) {
	return typeof e == "string" && e.startsWith("internalfunc://");
}
function mr(e, t = /* @__PURE__ */ new Date()) {
	let [n, r = ""] = e.slice(`${sr}//`.length).split("?"), i = cr[n];
	if (!i) return console.warn(`[internalfunc] no generator called "${n}". Known: ${Object.keys(cr).join(", ")}`), {
		type: "FeatureCollection",
		features: []
	};
	let a = new URLSearchParams(r), o = a.get("at"), s = o ? new Date(o) : t;
	return i({
		query: a,
		at: Number.isNaN(s.getTime()) ? t : s
	});
}
function hr(e, t = /* @__PURE__ */ new Date(), n = (e) => e) {
	if (!e || typeof e != "object") return e;
	if (Array.isArray(e)) {
		let r = e.map((e) => hr(e, t, n));
		return r.some((t, n) => t !== e[n]) ? r : e;
	}
	let r = !1, i = {};
	for (let [a, o] of Object.entries(e)) {
		if (a === "data" && typeof o == "object" && o) {
			i[a] = o;
			continue;
		}
		if ((a === "data" || a === "url") && pr(o)) {
			i.data = mr(n(o), t), i.type = "geojson", i.internalFuncUrl = o, r = !0;
			continue;
		}
		let e = hr(o, t, n);
		e !== o && (r = !0), i[a] = e;
	}
	return r ? i : e;
}
//#endregion
//#region src/utils/map-clock.ts
function gr(e) {
	if (e?.mode !== "pinned") return /* @__PURE__ */ new Date();
	let t = new Date(e.at);
	return Number.isNaN(t.getTime()) ? /* @__PURE__ */ new Date() : t;
}
function _r(e) {
	return e?.mode !== "pinned";
}
function vr(e, t) {
	return e?.mode === t?.mode ? e?.mode !== "pinned" || e.at === t.at : !1;
}
//#endregion
export { or as a, ur as c, hr as d, ar as f, rr as i, pr as l, Pn as m, vr as n, dr as o, Hn as p, gr as r, fr as s, _r as t, mr as u };
