import { t as e } from "./buffer-BDDrHjXc.js";
//#endregion
//#region src/tools/tool-registry.ts
var t = [
	{
		id: "search",
		tag: "webmapx-search-tool",
		placement: "toolbar",
		label: "Search",
		description: "Find a place, address or feature on the map",
		icon: "search"
	},
	{
		id: "layerTree",
		tag: "webmapx-layer-tree",
		placement: "toolbar",
		label: "Catalog",
		description: "Choose which layers to show on the map",
		icon: "layers",
		bundled: !0,
		metadataAliases: [
			"layers",
			"catalog",
			"datacatalog"
		]
	},
	{
		id: "measure",
		tag: "webmapx-measure-tool",
		placement: "toolbar",
		label: "Measure",
		description: "Measure a distance or an area on the map",
		icon: "rulers"
	},
	{
		id: "info",
		tag: "webmapx-info-tool",
		placement: "toolbar",
		label: "Feature info",
		description: "See the details of a feature on the map",
		icon: "info-circle"
	},
	{
		id: "draw",
		tag: "webmapx-draw-tool",
		placement: "toolbar",
		label: "Draw",
		description: "Draw points, lines and shapes on the map",
		icon: "pencil"
	},
	{
		id: "geolocation",
		tag: "webmapx-geolocation-tool",
		placement: "toolbar",
		label: "Geolocation",
		description: "Show where you are on the map",
		icon: "crosshair",
		metadataAliases: ["geolocate"]
	},
	{
		id: "projection",
		tag: "webmapx-projection-tool",
		placement: "toolbar",
		label: "Projection",
		description: "Choose a different way to project the map",
		icon: "globe-americas",
		aliases: ["view-mode"]
	},
	{
		id: "timeSlider",
		tag: "webmapx-time-slider-tool",
		placement: "toolbar",
		label: "Time",
		description: "Set the date and time the map shows",
		icon: "clock",
		aliases: ["time-slider"]
	},
	{
		id: "cartogram",
		tag: "webmapx-cartogram-tool",
		placement: "toolbar",
		label: "Cartogram",
		description: "Resize areas to show a number, like population",
		icon: "pie-chart"
	},
	{
		id: "3d",
		tag: "webmapx-3d-tool",
		placement: "toolbar",
		label: "3D",
		description: "View the map in 3D, with terrain and tilt",
		icon: "box"
	},
	{
		id: "import-layer",
		tag: "webmapx-import-layer-tool",
		placement: "toolbar",
		label: "Import layer",
		description: "Add layers from a file or a web service",
		icon: "file-earmark-arrow-up"
	},
	{
		id: "layerOverview",
		tag: "webmapx-layer-overview",
		placement: "toolbar",
		label: "Legend",
		description: "See and arrange the layers on the map",
		icon: "card-list",
		bundled: !0,
		metadataAliases: ["legend"]
	},
	{
		id: "layerLegend3d",
		tag: "webmapx-layer-legend3d",
		placement: "toolbar",
		label: "Legend 3D",
		description: "See the map’s layers as a stack",
		icon: "stack"
	},
	{
		id: "maplanguage",
		tag: "webmapx-language-osmvector",
		placement: "both",
		label: "Map language",
		description: "Choose the language of the map labels",
		icon: "translate",
		aliases: ["language-osmvector"]
	},
	{
		id: "print",
		tag: "webmapx-print-tool",
		placement: "toolbar",
		label: "Print",
		description: "Print the map or save it as a PDF",
		icon: "printer"
	},
	{
		id: "truearea",
		tag: "webmapx-truearea-tool",
		placement: "toolbar",
		label: "True area",
		description: "Compare the real size of countries and areas",
		icon: "bounding-box-circles"
	},
	{
		id: "routing",
		tag: "webmapx-routing-tool",
		placement: "toolbar",
		label: "Routing",
		description: "Plan a route from point to point",
		icon: "signpost-split"
	},
	{
		id: "isochrone",
		tag: "webmapx-isochrone-tool",
		placement: "toolbar",
		label: "Isochrone",
		description: "Show how far you can travel within a time or distance",
		icon: "broadcast"
	},
	{
		id: "settings",
		tag: "webmapx-settings",
		placement: "toolbar",
		label: "Settings",
		description: "Change the map engine, style and theme",
		icon: "gear"
	},
	{
		id: "toolbox",
		tag: "webmapx-toolbox-tool",
		placement: "toolbar",
		label: "Toolbox",
		icon: "grid",
		bundled: !0,
		container: !0
	},
	{
		id: "menu",
		tag: "webmapx-menu-tool",
		placement: "toolbar",
		label: "Tools",
		icon: "list",
		bundled: !0,
		container: !0
	},
	{
		id: "buffer",
		tag: "webmapx-buffer-tool",
		placement: "toolbar",
		label: "Buffer",
		description: "Create a buffer zone around the features of a layer",
		icon: { src: e }
	},
	{
		id: "geoprocessing",
		tag: "webmapx-geoprocessing-tool",
		placement: "toolbar",
		label: "Analysis",
		description: "Combine, select or reshape map layers",
		icon: "intersect"
	},
	{
		id: "segment",
		tag: "webmapx-segment-tool",
		placement: "toolbar",
		label: "Segment",
		description: "Outline areas on an aerial photo with a machine-learning model",
		icon: "magic"
	},
	{
		id: "data-analyzer",
		tag: "webmapx-data-analyzer-tool",
		placement: "toolbar",
		label: "Data analyzer",
		description: "Discover patterns in a layer’s data",
		icon: "bar-chart-line"
	},
	{
		id: "stories",
		tag: "webmapx-stories-tool",
		placement: "toolbar",
		label: "Stories",
		description: "Follow a guided tour through the map",
		icon: "book"
	},
	{
		id: "deeptime",
		tag: "webmapx-deeptime-tool",
		placement: "toolbar",
		label: "Deep time",
		description: "Travel back through millions of years of Earth’s history",
		icon: { src: "data:image/svg+xml,%3c!--%20A%20sauropod%20for%20the%20Deep%20time%20tool.%20Traced%20artwork,%20reduced%20to%20the%20four%20parts%20that%20survive%2016px%20—%20body%20outline,%20neck,%20tail%20and%20legs;%20the%20finer%20details%20mushed%20into%20a%20smudge%20at%20rail%20size%20and%20are%20gone.%20The%20viewBox%20is%20cropped%20to%20the%20drawing's%20own%20bounds%20rather%20than%20the%20original%201920%20square,%20which%20was%2023%25%20empty%20margin:%20at%2016px%20that%20margin%20is%20what%20made%20the%20animal%20too%20small%20to%20recognise.%20Stroke%2095%20of%20a%20~1580%20box%20is%20about%201px%20there,%20matching%20the%20clock%20and%20gear%20beside%20it.%20No%20fill:%20an%20outline%20like%20every%20other%20icon%20in%20the%20rail,%20and%20`currentColor`%20so%20it%20follows%20the%20theme%20—%20sl-icon%20inlines%20this%20file%20into%20its%20shadow%20root,%20which%20is%20what%20makes%20that%20work.%20--%3e%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='170.9%20193.9%201578.2%201532.3'%20fill='none'%20stroke='currentColor'%20stroke-width='95'%20stroke-linecap='round'%20stroke-linejoin='round'%3e%3cpath%20d='M1702.9%201394c-1.1.2-9.8%201.7-25.2%204-78.2%2011.6-278.2%2059.2-581.5%2034.3l-26%2056.5s39.5%2026.6%2039.5%20191.4h-98.6'/%3e%3cpath%20d='M1703.1%201394s-.1%200%200%200h-.1c-8.2%201.7-16.6%203-25.2%204-222.2%2025.6-497.7-162.9-497.7-162.9s-278-211-502.3-204.6c-224.4%206.4-246.7-214-224-479.7%2022.8-265.7-134.4-288-134.4-288-5.6-27.9-33.9-22.5-33.9-22.5s-23.1%203.8-27.3%2036.3c0%200-57.7%2011.5-36.7%2052.4s88.1-43%20136.3%2096.5C406%20565%20200%201034.4%20546.2%201242.1c0%200%208.5%20158.2%2046.6%20196.4%200%200-14.1%20227.5-38.2%20241.6h103.2s1.4-7.7%203.7-20.3c9-49.8%2031-176.5%2028.8-211.5-.8-12.8-2.1-31.5-4-52.4-4.6-50.7-12.6-114.3-25.6-138.3'/%3e%3cpath%20d='M686.4%201396c19%2015.1%2045.1%2032.7%2077.3%2047%2030.4%2013.4%2066.4%2023.8%20107%2026.3'/%3e%3cpath%20d='M1011.2%201680.2H905.6s38.3-32.8%207.4-87.1c-20.4-35.9-34.9-90.8-42.3-123.8%2025.7%201.6%2053.2%200%2082.4-6.1.2%201.1.4%202.2.5%203.2%205.4%2035.9%2070%20108.6%2074.5%20150.8%204.5%2042.1-16.9%2063-16.9%2063z'/%3e%3c/svg%3e" }
	},
	{
		id: "sealevel",
		tag: "webmapx-sealevel-tool",
		placement: "toolbar",
		label: "Sea level",
		description: "See which land floods when the sea rises or falls",
		icon: "water"
	},
	{
		id: "compare",
		tag: "webmapx-compare-tool",
		placement: "toolbar",
		label: "Compare",
		description: "Compare the map before and after a change",
		icon: "layout-split"
	},
	{
		id: "navigation",
		tag: "webmapx-navigation-control",
		placement: "standalone",
		label: "Navigation",
		icon: "compass",
		bundled: !0
	},
	{
		id: "scale",
		tag: "webmapx-scale-control",
		placement: "standalone",
		label: "Scale bar",
		icon: "rulers",
		bundled: !0,
		loaderAliases: ["scaleControl"]
	},
	{
		id: "coordinates",
		tag: "webmapx-coordinates-tool",
		placement: "standalone",
		label: "Coordinates",
		icon: "crosshair2"
	},
	{
		id: "fullscreen",
		tag: "webmapx-fullscreen-control",
		placement: "standalone",
		label: "Fullscreen",
		icon: "fullscreen",
		bundled: !0
	},
	{
		id: "zoomLevel",
		tag: "webmapx-zoom-level",
		placement: "standalone",
		label: "Zoom level",
		icon: "zoom-in",
		bundled: !0
	},
	{
		id: "attribution",
		tag: "webmapx-attribution-control",
		placement: "standalone",
		label: "Attribution",
		icon: "info-circle",
		bundled: !0,
		loaderAliases: ["attributionControl"]
	},
	{
		id: "insetMap",
		tag: "webmapx-inset-map",
		placement: "standalone",
		label: "Inset map",
		icon: "map",
		bundled: !0
	},
	{
		id: "activeAdapter",
		tag: "webmapx-active-adapter",
		placement: "standalone",
		label: "Engine label",
		icon: "cpu",
		aliases: ["active-adapter"],
		bundled: !0
	},
	{
		id: "spinner",
		tag: "webmapx-spinner",
		placement: "standalone",
		label: "Spinner",
		icon: "arrow-repeat",
		bundled: !0
	},
	{
		id: "spacer",
		placement: "toolbar",
		label: "Spacer",
		bundled: !0,
		offered: !1
	},
	{
		id: "config-edit",
		placement: "toolbar",
		label: "Edit config",
		icon: "pencil-square",
		offered: !1
	}
], n = (e) => e.placement !== "standalone", r = (e) => e.placement !== "toolbar";
function i(e) {
	return [e.id, ...e.aliases ?? []];
}
var a = [], o = a, s = {}, c = {}, l = {}, u = [], d = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new Set(), p = f, m = /* @__PURE__ */ new Set(), h = m, g = /* @__PURE__ */ new Set(), _ = g;
function v(e, t) {
	a.push(e);
	let o = i(e), p = e.offered !== !1;
	if (e.tag) {
		for (let t of o) n(e) && (s[t] = e.tag), r(e) && (c[t] = e.tag);
		p && u.push({
			id: e.id,
			label: e.label,
			icon: e.icon,
			...e.placement === "standalone" ? { standalone: !0 } : {},
			...t ? { plugin: !0 } : {}
		});
	} else for (let e of o) g.add(e);
	if (n(e) && p) {
		let t = {
			label: e.label,
			...e.description ? { description: e.description } : {},
			icon: e.icon
		};
		for (let n of [...o, ...e.metadataAliases ?? []]) l[n] = t;
	}
	for (let t of [...o, ...e.metadataAliases ?? []]) d.set(t, e.id);
	if (e.bundled) for (let t of [...o, ...e.loaderAliases ?? []]) f.add(t);
	if (e.container) for (let e of o) m.add(e);
}
for (let e of t) v(e, !1);
function y(e) {
	let t = b(e);
	if (t) return console.warn(`[webmapx] registerTool: ${t} — tool not registered`), !1;
	let n = a.find((t) => t.id === e.id);
	if (n) return n.tag === e.tag ? !0 : (console.warn(`[webmapx] registerTool: "${e.id}" is already registered as <${n.tag ?? "no element"}> — tool not registered`), !1);
	let r = [...i(e)].find((e) => d.has(e));
	if (r) return console.warn(`[webmapx] registerTool: "${r}" already names the "${d.get(r)}" tool — tool not registered`), !1;
	let o = a.find((t) => t.tag === e.tag);
	return o ? (console.warn(`[webmapx] registerTool: <${e.tag}> already belongs to "${o.id}" — tool not registered`), !1) : (v({
		...e,
		bundled: !0
	}, !0), !0);
}
function b(e) {
	if (!e || typeof e != "object") return "entry must be an object";
	if (typeof e.id != "string" || !/^[A-Za-z][\w-]*$/.test(e.id)) return `invalid id ${JSON.stringify(e?.id)}`;
	if (typeof e.tag != "string" || !/^[a-z][a-z0-9]*-[a-z0-9-]*$/.test(e.tag)) return `"${e.id}" needs a custom element tag containing a hyphen, got ${JSON.stringify(e.tag)}`;
	if (![
		"toolbar",
		"standalone",
		"both"
	].includes(e.placement)) return `"${e.id}" has invalid placement ${JSON.stringify(e.placement)}`;
	if (typeof e.label != "string" || !e.label) return `"${e.id}" needs a label`;
	let t = e.configTemplate;
	return t !== void 0 && (typeof t != "object" || !t || Array.isArray(t)) ? `"${e.id}" configTemplate must be a plain object` : null;
}
function x(e) {
	return d.get(e) ?? e;
}
//#endregion
export { h as a, o as c, c as i, x as l, l as n, _ as o, u as r, s, p as t, y as u };
