//#region src/utils/view-projections.ts
var e = "EPSG:3857", t = [
	{
		id: "EPSG:3857",
		label: "Web Mercator",
		description: "The usual web map. Shapes and angles are right everywhere, areas are inflated towards the poles.",
		equalArea: !1,
		metric: !1
	},
	{
		id: "ESRI:54001",
		label: "Equirectangular (Plate Carrée)",
		description: "Longitude and latitude drawn as a plain grid. Simple, but stretches everything away from the equator.",
		proj4: "+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
		equalArea: !1,
		metric: !0
	},
	{
		id: "EPSG:8857",
		label: "Equal Earth",
		description: "Equal-area world map that still looks like a map. Good default for comparing countries.",
		proj4: "+proj=eqearth +lon_0=0 +datum=WGS84 +units=m +no_defs",
		equalArea: !0,
		metric: !0
	},
	{
		id: "ESRI:54009",
		label: "Mollweide",
		description: "Equal-area ellipse. Areas are exact; shapes stretch badly near the edges.",
		proj4: "+proj=moll +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
		equalArea: !0,
		metric: !0
	},
	{
		id: "EPSG:6933",
		label: "Equal-area cylindrical (NSIDC EASE-Grid 2.0)",
		description: "Equal-area with a straight grid, like Mercator without the area distortion. Squashes the poles flat.",
		proj4: "+proj=cea +lon_0=0 +lat_ts=30 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
		equalArea: !0,
		metric: !0
	},
	{
		id: "EPSG:3575",
		label: "North Pole equal-area",
		description: "Equal-area view from above the North Pole. For the Arctic, where every world map lies worst.",
		proj4: "+proj=laea +lat_0=90 +lon_0=10 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
		latitudeRange: [0, 90],
		equalArea: !0,
		metric: !0
	},
	{
		id: "EPSG:3031",
		label: "South Pole (Antarctic)",
		description: "Polar stereographic, the standard for Antarctica. Shapes are right, areas grow away from the pole.",
		proj4: "+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
		latitudeRange: [-90, -50],
		equalArea: !1,
		metric: !0
	}
];
function n(e) {
	return t.find((t) => t.id === e);
}
function r(e) {
	return n(e)?.latitudeRange ?? [-89.9, 89.9];
}
function i(e) {
	let [t, n] = r(e);
	return t > -89.9 || n < 89.9;
}
function a(e, t) {
	let [n, i] = r(e);
	return t[1] >= n && t[1] <= i ? t : [t[0], (n + i) / 2];
}
function o(e, t) {
	return n(e)?.metric ? 1 : 1 / Math.max(Math.cos(t * Math.PI / 180), 1e-6);
}
//#endregion
export { i as a, n as i, t as n, r as o, a as r, o as s, e as t };
