//#region node_modules/@turf/distance/node_modules/@turf/helpers/dist/esm/index.js
var e = 6371008.8, t = {
	centimeters: e * 100,
	centimetres: e * 100,
	degrees: 360 / (2 * Math.PI),
	feet: e * 3.28084,
	inches: e * 39.37,
	kilometers: e / 1e3,
	kilometres: e / 1e3,
	meters: e,
	metres: e,
	miles: e / 1609.344,
	millimeters: e * 1e3,
	millimetres: e * 1e3,
	nauticalmiles: e / 1852,
	radians: 1,
	yards: e * 1.0936
};
function n(e, n = "kilometers") {
	let r = t[n];
	if (!r) throw Error(n + " units is invalid");
	return e * r;
}
function r(e) {
	return e % 360 * Math.PI / 180;
}
//#endregion
//#region node_modules/@turf/distance/node_modules/@turf/invariant/dist/esm/index.js
function i(e) {
	if (!e) throw Error("coord is required");
	if (!Array.isArray(e)) {
		if (e.type === "Feature" && e.geometry !== null && e.geometry.type === "Point") return [...e.geometry.coordinates];
		if (e.type === "Point") return [...e.coordinates];
	}
	if (Array.isArray(e) && e.length >= 2 && !Array.isArray(e[0]) && !Array.isArray(e[1])) return [...e];
	throw Error("coord must be GeoJSON Point or an Array of numbers");
}
//#endregion
//#region node_modules/@turf/distance/dist/esm/index.js
function a(e, t, a = {}) {
	var o = i(e), s = i(t), c = r(s[1] - o[1]), l = r(s[0] - o[0]), u = r(o[1]), d = r(s[1]), f = Math.sin(c / 2) ** 2 + Math.sin(l / 2) ** 2 * Math.cos(u) * Math.cos(d);
	return n(2 * Math.atan2(Math.sqrt(f), Math.sqrt(1 - f)), a.units);
}
var o = a;
//#endregion
export { o as t };
