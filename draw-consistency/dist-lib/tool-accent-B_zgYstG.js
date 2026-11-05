//#endregion
//#region src/tools/tool-registry.ts
var e = [
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
		label: "Draw and edit layers",
		description: "What do you want to draw or edit?",
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
		icon: { src: "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%206.3%206.4'%20height='16'%20width='16'%20fill='currentColor'%3e%3cpath%20d='M4.6%201.4C4.6%201.4%201.7%204.6%201.7%204.6%201.7%204.6%201.8%204.7%201.8%204.7%201.8%204.7%204.8%201.6%204.8%201.6%204.8%201.6%204.6%201.4%204.6%201.4'/%3e%3cpath%20d='M4.2%200.1C4.2%200.1%204.2%200.1%204.2%200.1%204.2%200.1%204.2%200.1%204.2%200.1%204.2%200.1%204%200.2%204%200.2%204%200.2%204.1%200.6%204.1%200.6%204.1%200.6%204.3%200.6%204.3%200.6%204.3%200.6%204.5%200.5%204.5%200.5%204.5%200.5%204.5%200.1%204.5%200.1%204.5%200.1%204.2%200.1%204.2%200.1M4.9%200.5C4.9%200.5%204.8%200.6%204.8%200.6%204.8%200.6%204.8%200.6%204.8%200.6%204.8%200.6%204.8%200.6%204.8%200.6%204.8%200.6%204.9%200.6%204.9%200.6%204.9%200.6%205.1%200.8%205.1%200.8%205.1%200.8%205.2%200.8%205.2%200.8%205.2%200.8%205.2%200.7%205.2%200.7%205.2%200.7%205.5%200.4%205.5%200.4%205.5%200.4%205.4%200.4%205.4%200.4%205.4%200.4%205.4%200.4%205.4%200.4%205.4%200.4%205.4%200.4%205.4%200.4%205.4%200.4%205%200.2%205%200.2%205%200.2%205%200.2%205%200.2%205%200.2%205%200.2%205%200.2%205%200.2%204.9%200.2%204.9%200.2%204.9%200.2%204.9%200.5%204.9%200.5M3.3%200.6C3.3%200.6%203.3%200.6%203.3%200.6%203.3%200.6%203.3%200.6%203.3%200.6%203.3%200.6%203.2%200.8%203.2%200.8%203.2%200.8%203.5%201.1%203.5%201.1%203.5%201.1%203.6%200.9%203.6%200.9%203.6%200.9%203.6%200.9%203.6%200.9%203.6%200.9%203.7%200.9%203.7%200.9%203.7%200.9%203.8%200.8%203.8%200.8%203.8%200.8%203.5%200.4%203.5%200.4%203.5%200.4%203.3%200.6%203.3%200.6M5.4%201.1C5.4%201.1%205.5%201.3%205.5%201.3%205.5%201.3%205.6%201.4%205.6%201.4%205.6%201.4%206%201.3%206%201.3%206%201.3%206%201.1%206%201.1%206%201.1%205.9%201.1%205.9%201.1%205.9%201.1%205.9%201.1%205.9%201.1%205.9%201.1%205.8%200.8%205.8%200.8%205.8%200.8%205.4%201.1%205.4%201.1M2.6%201.4C2.6%201.4%202.9%201.8%202.9%201.8%202.9%201.8%203.2%201.4%203.2%201.4%203.2%201.4%202.9%201.1%202.9%201.1%202.9%201.1%202.6%201.4%202.6%201.4M1.9%202.1C1.9%202.1%202.3%202.4%202.3%202.4%202.3%202.4%202.6%202.1%202.6%202.1%202.6%202.1%202.2%201.8%202.2%201.8%202.2%201.8%201.9%202.1%201.9%202.1M5.6%201.9C5.6%201.9%205.5%202.2%205.5%202.2%205.5%202.2%205.9%202.3%205.9%202.3%205.9%202.3%206%202%206%202%206%202%206%202%206%202%206%202%206%201.9%206%201.9%206%201.9%206.1%201.8%206.1%201.8%206.1%201.8%205.6%201.8%205.6%201.8%205.6%201.8%205.6%201.9%205.6%201.9M1.3%202.8C1.3%202.8%201.6%203.1%201.6%203.1%201.6%203.1%202%202.8%202%202.8%202%202.8%201.6%202.5%201.6%202.5%201.6%202.5%201.3%202.8%201.3%202.8M5%202.8C5%202.8%205.3%203.1%205.3%203.1%205.3%203.1%205.6%202.8%205.6%202.8%205.6%202.8%205.3%202.5%205.3%202.5%205.3%202.5%205%202.8%205%202.8M0.7%203.5C0.7%203.5%201%203.8%201%203.8%201%203.8%201.3%203.5%201.3%203.5%201.3%203.5%201%203.1%201%203.1%201%203.1%200.7%203.5%200.7%203.5M4.3%203.5C4.3%203.5%204.7%203.8%204.7%203.8%204.7%203.8%205%203.5%205%203.5%205%203.5%204.7%203.2%204.7%203.2%204.7%203.2%204.3%203.5%204.3%203.5M3.7%204.2C3.7%204.2%204.1%204.5%204.1%204.5%204.1%204.5%204.4%204.2%204.4%204.2%204.4%204.2%204%203.8%204%203.8%204%203.8%203.7%204.2%203.7%204.2M0.3%204.1C0.3%204.1%200.3%204.1%200.3%204.1%200.3%204.1%200.3%204.1%200.3%204.1%200.3%204.1%200.2%204.4%200.2%204.4%200.2%204.4%200.2%204.4%200.2%204.4%200.2%204.4%200.2%204.4%200.2%204.4%200.2%204.4%200.2%204.4%200.2%204.4%200.2%204.4%200.5%204.4%200.5%204.4%200.5%204.4%200.7%204.5%200.7%204.5%200.7%204.5%200.7%204.3%200.7%204.3%200.7%204.3%200.8%204.1%200.8%204.1%200.8%204.1%200.4%203.9%200.4%203.9%200.4%203.9%200.3%204.1%200.3%204.1M3.1%204.9C3.1%204.9%203.4%205.2%203.4%205.2%203.4%205.2%203.8%204.8%203.8%204.8%203.8%204.8%203.4%204.5%203.4%204.5%203.4%204.5%203.1%204.9%203.1%204.9M0.2%204.9C0.2%204.9%200.3%205%200.3%205%200.3%205%200.3%205%200.3%205%200.3%205%200.3%205%200.3%205%200.3%205%200.4%205.3%200.4%205.3%200.4%205.3%200.4%205.3%200.4%205.3%200.4%205.3%200.4%205.3%200.4%205.3%200.4%205.3%200.5%205.5%200.5%205.5%200.5%205.5%200.8%205.2%200.8%205.2%200.8%205.2%200.8%205.1%200.8%205.1%200.8%205.1%200.7%204.9%200.7%204.9%200.7%204.9%200.7%204.9%200.7%204.9%200.7%204.9%200.2%204.9%200.2%204.9M2.7%205.4C2.7%205.4%202.6%205.4%202.6%205.4%202.6%205.4%202.6%205.4%202.6%205.4%202.6%205.4%202.5%205.5%202.5%205.5%202.5%205.5%202.8%205.9%202.8%205.9%202.8%205.9%203%205.7%203%205.7%203%205.7%203%205.7%203%205.7%203%205.7%203%205.7%203%205.7%203%205.7%203.1%205.5%203.1%205.5%203.1%205.5%202.8%205.2%202.8%205.2%202.8%205.2%202.7%205.4%202.7%205.4M0.8%205.9C0.8%205.9%201.2%206.1%201.2%206.1%201.2%206.1%201.2%206.1%201.2%206.1%201.2%206.1%201.2%206.1%201.2%206.1%201.2%206.1%201.3%206.1%201.3%206.1%201.3%206.1%201.4%205.8%201.4%205.8%201.4%205.8%201.4%205.7%201.4%205.7%201.4%205.7%201.4%205.7%201.4%205.7%201.4%205.7%201.4%205.7%201.4%205.7%201.4%205.7%201.4%205.7%201.4%205.7%201.4%205.7%201.1%205.5%201.1%205.5%201.1%205.5%200.8%205.9%200.8%205.9M2%205.8C2%205.8%201.8%205.8%201.8%205.8%201.8%205.8%201.8%206%201.8%206%201.8%206%201.8%206.2%201.8%206.2%201.8%206.2%201.8%206.2%201.8%206.2%201.8%206.2%201.8%206.2%201.8%206.2%201.8%206.2%201.8%206.2%201.8%206.2%201.8%206.2%202.1%206.2%202.1%206.2%202.1%206.2%202.1%206.2%202.1%206.2%202.1%206.2%202.1%206.2%202.1%206.2%202.1%206.2%202.3%206.1%202.3%206.1%202.3%206.1%202.2%205.7%202.2%205.7%202.2%205.7%202%205.8%202%205.8'/%3e%3c/svg%3e" }
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
		id: "megaReset",
		tag: "webmapx-mega-reset",
		placement: "standalone",
		label: "Mega reset",
		icon: "arrow-counterclockwise"
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
		id: "megaSlider",
		tag: "webmapx-mega-slider",
		placement: "standalone",
		label: "Mega slider",
		icon: "sliders"
	},
	{
		id: "megaCompare",
		tag: "webmapx-mega-compare",
		placement: "standalone",
		label: "Mega compare",
		icon: "arrow-left-right"
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
], t = (e) => e.placement !== "standalone", n = (e) => e.placement !== "toolbar";
function r(e) {
	return [e.id, ...e.aliases ?? []];
}
var i = [], a = i, o = {}, s = {}, c = {}, l = [], u = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Set(), f = d, p = /* @__PURE__ */ new Set(), m = p, h = /* @__PURE__ */ new Set(), g = h;
function _(e, a) {
	i.push(e);
	let f = r(e), m = e.offered !== !1;
	if (e.tag) {
		for (let r of f) t(e) && (o[r] = e.tag), n(e) && (s[r] = e.tag);
		m && l.push({
			id: e.id,
			label: e.label,
			icon: e.icon,
			...e.placement === "standalone" ? { standalone: !0 } : {},
			...a ? { plugin: !0 } : {}
		});
	} else for (let e of f) h.add(e);
	if (t(e) && m) {
		let t = {
			label: e.label,
			...e.description ? { description: e.description } : {},
			icon: e.icon
		};
		for (let n of [...f, ...e.metadataAliases ?? []]) c[n] = t;
	}
	for (let t of [...f, ...e.metadataAliases ?? []]) u.set(t, e.id);
	if (e.bundled) for (let t of [...f, ...e.loaderAliases ?? []]) d.add(t);
	if (e.container) for (let e of f) p.add(e);
}
for (let t of e) _(t, !1);
function v(e) {
	let t = y(e);
	if (t) return console.warn(`[webmapx] registerTool: ${t} — tool not registered`), !1;
	let n = i.find((t) => t.id === e.id);
	if (n) return n.tag === e.tag ? !0 : (console.warn(`[webmapx] registerTool: "${e.id}" is already registered as <${n.tag ?? "no element"}> — tool not registered`), !1);
	let a = [...r(e)].find((e) => u.has(e));
	if (a) return console.warn(`[webmapx] registerTool: "${a}" already names the "${u.get(a)}" tool — tool not registered`), !1;
	let o = i.find((t) => t.tag === e.tag);
	return o ? (console.warn(`[webmapx] registerTool: <${e.tag}> already belongs to "${o.id}" — tool not registered`), !1) : (_({
		...e,
		bundled: !0
	}, !0), !0);
}
function y(e) {
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
function b(e) {
	return u.get(e) ?? e;
}
//#endregion
//#region src/utils/tool-accent.ts
var x = [
	"cyan",
	"green",
	"yellow",
	"orange",
	"purple",
	"blue"
];
function S(e) {
	return `var(--webmapx-tool-palette-${e})`;
}
function C(e) {
	return x.includes(e);
}
function w(e) {
	if (typeof e != "string") return;
	let t = e.trim();
	if (t) {
		if (C(t.toLowerCase())) return S(t.toLowerCase());
		if (!(typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", t))) return t;
	}
}
var T = class {
	constructor() {
		this.next = 0;
	}
	take(e) {
		let t = w(e);
		return t || (t = S(x[this.next % x.length]), this.next++, t === this.previous && (t = S(x[this.next % x.length]), this.next++)), this.previous = t, t;
	}
};
//#endregion
export { l as a, g as c, b as d, v as f, c as i, o as l, T as n, s as o, f as r, m as s, x as t, a as u };
