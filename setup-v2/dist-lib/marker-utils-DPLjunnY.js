var e = {
	$version: 8,
	$root: {
		version: {
			required: !0,
			type: "enum",
			values: [8]
		},
		name: { type: "string" },
		metadata: { type: "*" },
		center: {
			type: "array",
			value: "number",
			length: 2
		},
		centerAltitude: { type: "number" },
		zoom: { type: "number" },
		bearing: {
			type: "number",
			default: 0,
			period: 360,
			units: "degrees"
		},
		pitch: {
			type: "number",
			default: 0,
			units: "degrees"
		},
		roll: {
			type: "number",
			default: 0,
			units: "degrees"
		},
		state: {
			type: "state",
			default: {}
		},
		light: { type: "light" },
		sky: { type: "sky" },
		projection: { type: "projection" },
		terrain: { type: "terrain" },
		sources: {
			required: !0,
			type: "sources"
		},
		sprite: { type: "sprite" },
		glyphs: { type: "string" },
		"font-faces": { type: "fontFaces" },
		transition: { type: "transition" },
		layers: {
			required: !0,
			type: "array",
			value: "layer"
		}
	},
	sources: { "*": { type: "source" } },
	source: [
		"source_vector",
		"source_raster",
		"source_raster_dem",
		"source_geojson",
		"source_video",
		"source_image"
	],
	source_vector: {
		type: {
			required: !0,
			type: "enum",
			values: { vector: {} }
		},
		url: { type: "string" },
		tiles: {
			type: "array",
			value: "string"
		},
		bounds: {
			type: "array",
			value: "number",
			length: 4,
			default: [
				-180,
				-85.051129,
				180,
				85.051129
			]
		},
		scheme: {
			type: "enum",
			values: {
				xyz: {},
				tms: {}
			},
			default: "xyz"
		},
		minzoom: {
			type: "number",
			default: 0
		},
		maxzoom: {
			type: "number",
			default: 22
		},
		attribution: { type: "string" },
		promoteId: { type: "promoteId" },
		volatile: {
			type: "boolean",
			default: !1
		},
		encoding: {
			type: "enum",
			values: {
				mvt: {},
				mlt: {}
			},
			default: "mvt"
		},
		"*": { type: "*" }
	},
	source_raster: {
		type: {
			required: !0,
			type: "enum",
			values: { raster: {} }
		},
		url: { type: "string" },
		tiles: {
			type: "array",
			value: "string"
		},
		bounds: {
			type: "array",
			value: "number",
			length: 4,
			default: [
				-180,
				-85.051129,
				180,
				85.051129
			]
		},
		minzoom: {
			type: "number",
			default: 0
		},
		maxzoom: {
			type: "number",
			default: 22
		},
		tileSize: {
			type: "number",
			default: 512,
			units: "pixels"
		},
		scheme: {
			type: "enum",
			values: {
				xyz: {},
				tms: {}
			},
			default: "xyz"
		},
		attribution: { type: "string" },
		volatile: {
			type: "boolean",
			default: !1
		},
		"*": { type: "*" }
	},
	source_raster_dem: {
		type: {
			required: !0,
			type: "enum",
			values: { "raster-dem": {} }
		},
		url: { type: "string" },
		tiles: {
			type: "array",
			value: "string"
		},
		bounds: {
			type: "array",
			value: "number",
			length: 4,
			default: [
				-180,
				-85.051129,
				180,
				85.051129
			]
		},
		minzoom: {
			type: "number",
			default: 0
		},
		maxzoom: {
			type: "number",
			default: 22
		},
		tileSize: {
			type: "number",
			default: 512,
			units: "pixels"
		},
		attribution: { type: "string" },
		encoding: {
			type: "enum",
			values: {
				terrarium: {},
				mapbox: {},
				custom: {}
			},
			default: "mapbox"
		},
		redFactor: {
			type: "number",
			default: 1
		},
		blueFactor: {
			type: "number",
			default: 1
		},
		greenFactor: {
			type: "number",
			default: 1
		},
		baseShift: {
			type: "number",
			default: 0
		},
		volatile: {
			type: "boolean",
			default: !1
		},
		"*": { type: "*" }
	},
	source_geojson: {
		type: {
			required: !0,
			type: "enum",
			values: { geojson: {} }
		},
		data: {
			required: !0,
			type: "*"
		},
		maxzoom: {
			type: "number",
			default: 18
		},
		attribution: { type: "string" },
		buffer: {
			type: "number",
			default: 128,
			maximum: 512,
			minimum: 0
		},
		filter: { type: "filter" },
		tolerance: {
			type: "number",
			default: .375
		},
		cluster: {
			type: "boolean",
			default: !1
		},
		clusterRadius: {
			type: "number",
			default: 50,
			minimum: 0
		},
		clusterMaxZoom: { type: "number" },
		clusterMinPoints: { type: "number" },
		clusterProperties: { type: "*" },
		lineMetrics: {
			type: "boolean",
			default: !1
		},
		generateId: {
			type: "boolean",
			default: !1
		},
		promoteId: { type: "promoteId" }
	},
	source_video: {
		type: {
			required: !0,
			type: "enum",
			values: { video: {} }
		},
		urls: {
			required: !0,
			type: "array",
			value: "string"
		},
		coordinates: {
			required: !0,
			type: "array",
			length: 4,
			value: {
				type: "array",
				length: 2,
				value: "number"
			}
		}
	},
	source_image: {
		type: {
			required: !0,
			type: "enum",
			values: { image: {} }
		},
		url: {
			required: !0,
			type: "string"
		},
		coordinates: {
			required: !0,
			type: "array",
			length: 4,
			value: {
				type: "array",
				length: 2,
				value: "number"
			}
		}
	},
	layer: {
		id: {
			type: "string",
			required: !0
		},
		type: {
			type: "enum",
			values: {
				fill: {},
				line: {},
				symbol: {},
				circle: {},
				heatmap: {},
				"fill-extrusion": {},
				raster: {},
				hillshade: {},
				"color-relief": {},
				background: {}
			},
			required: !0
		},
		metadata: { type: "*" },
		source: { type: "string" },
		"source-layer": { type: "string" },
		minzoom: {
			type: "number",
			minimum: 0,
			maximum: 24
		},
		maxzoom: {
			type: "number",
			minimum: 0,
			maximum: 24
		},
		filter: { type: "filter" },
		layout: { type: "layout" },
		paint: { type: "paint" }
	},
	layout: [
		"layout_fill",
		"layout_line",
		"layout_circle",
		"layout_heatmap",
		"layout_fill-extrusion",
		"layout_symbol",
		"layout_raster",
		"layout_hillshade",
		"layout_color-relief",
		"layout_background"
	],
	layout_background: { visibility: {
		type: "enum",
		values: {
			visible: {},
			none: {}
		},
		default: "visible",
		expression: {
			interpolated: !1,
			parameters: ["global-state"]
		},
		"property-type": "data-constant"
	} },
	layout_fill: {
		"fill-sort-key": {
			type: "number",
			expression: {
				interpolated: !1,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		visibility: {
			type: "enum",
			values: {
				visible: {},
				none: {}
			},
			default: "visible",
			expression: {
				interpolated: !1,
				parameters: ["global-state"]
			},
			"property-type": "data-constant"
		}
	},
	layout_circle: {
		"circle-sort-key": {
			type: "number",
			expression: {
				interpolated: !1,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		visibility: {
			type: "enum",
			values: {
				visible: {},
				none: {}
			},
			default: "visible",
			expression: {
				interpolated: !1,
				parameters: ["global-state"]
			},
			"property-type": "data-constant"
		}
	},
	layout_heatmap: { visibility: {
		type: "enum",
		values: {
			visible: {},
			none: {}
		},
		default: "visible",
		expression: {
			interpolated: !1,
			parameters: ["global-state"]
		},
		"property-type": "data-constant"
	} },
	"layout_fill-extrusion": { visibility: {
		type: "enum",
		values: {
			visible: {},
			none: {}
		},
		default: "visible",
		expression: {
			interpolated: !1,
			parameters: ["global-state"]
		},
		"property-type": "data-constant"
	} },
	layout_line: {
		"line-cap": {
			type: "enum",
			values: {
				butt: {},
				round: {},
				square: {}
			},
			default: "butt",
			expression: {
				interpolated: !1,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"line-join": {
			type: "enum",
			values: {
				bevel: {},
				round: {},
				miter: {}
			},
			default: "miter",
			expression: {
				interpolated: !1,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"line-miter-limit": {
			type: "number",
			default: 2,
			requires: [{ "line-join": "miter" }],
			expression: {
				interpolated: !0,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"line-round-limit": {
			type: "number",
			default: 1.05,
			requires: [{ "line-join": "round" }],
			expression: {
				interpolated: !0,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"line-sort-key": {
			type: "number",
			expression: {
				interpolated: !1,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		visibility: {
			type: "enum",
			values: {
				visible: {},
				none: {}
			},
			default: "visible",
			expression: {
				interpolated: !1,
				parameters: ["global-state"]
			},
			"property-type": "data-constant"
		}
	},
	layout_symbol: {
		"symbol-placement": {
			type: "enum",
			values: {
				point: {},
				line: {},
				"line-center": {}
			},
			default: "point",
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"symbol-spacing": {
			type: "number",
			default: 250,
			minimum: 1,
			units: "pixels",
			requires: [{ "symbol-placement": "line" }],
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"symbol-avoid-edges": {
			type: "boolean",
			default: !1,
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"symbol-sort-key": {
			type: "number",
			expression: {
				interpolated: !1,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"symbol-z-order": {
			type: "enum",
			values: {
				auto: {},
				"viewport-y": {},
				source: {}
			},
			default: "auto",
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"icon-allow-overlap": {
			type: "boolean",
			default: !1,
			requires: ["icon-image", { "!": "icon-overlap" }],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"icon-overlap": {
			type: "enum",
			values: {
				never: {},
				always: {},
				cooperative: {}
			},
			requires: ["icon-image"],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"icon-ignore-placement": {
			type: "boolean",
			default: !1,
			requires: ["icon-image"],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"icon-optional": {
			type: "boolean",
			default: !1,
			requires: ["icon-image", "text-field"],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"icon-rotation-alignment": {
			type: "enum",
			values: {
				map: {},
				viewport: {},
				auto: {}
			},
			default: "auto",
			requires: ["icon-image"],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"icon-size": {
			type: "number",
			default: 1,
			minimum: 0,
			units: "factor of the original icon size",
			requires: ["icon-image"],
			expression: {
				interpolated: !0,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"icon-text-fit": {
			type: "enum",
			values: {
				none: {},
				width: {},
				height: {},
				both: {}
			},
			default: "none",
			requires: ["icon-image", "text-field"],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"icon-text-fit-padding": {
			type: "array",
			value: "number",
			length: 4,
			default: [
				0,
				0,
				0,
				0
			],
			units: "pixels",
			requires: [
				"icon-image",
				"text-field",
				{ "icon-text-fit": [
					"both",
					"width",
					"height"
				] }
			],
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"icon-image": {
			type: "resolvedImage",
			tokens: !0,
			expression: {
				interpolated: !1,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"icon-rotate": {
			type: "number",
			default: 0,
			period: 360,
			units: "degrees",
			requires: ["icon-image"],
			expression: {
				interpolated: !0,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"icon-padding": {
			type: "padding",
			default: [2],
			units: "pixels",
			requires: ["icon-image"],
			expression: {
				interpolated: !0,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"icon-keep-upright": {
			type: "boolean",
			default: !1,
			requires: [
				"icon-image",
				{ "icon-rotation-alignment": "map" },
				{ "symbol-placement": ["line", "line-center"] }
			],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"icon-offset": {
			type: "array",
			value: "number",
			length: 2,
			default: [0, 0],
			requires: ["icon-image"],
			expression: {
				interpolated: !0,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"icon-anchor": {
			type: "enum",
			values: {
				center: {},
				left: {},
				right: {},
				top: {},
				bottom: {},
				"top-left": {},
				"top-right": {},
				"bottom-left": {},
				"bottom-right": {}
			},
			default: "center",
			requires: ["icon-image"],
			expression: {
				interpolated: !1,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"icon-pitch-alignment": {
			type: "enum",
			values: {
				map: {},
				viewport: {},
				auto: {}
			},
			default: "auto",
			requires: ["icon-image"],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"text-pitch-alignment": {
			type: "enum",
			values: {
				map: {},
				viewport: {},
				auto: {}
			},
			default: "auto",
			requires: ["text-field"],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"text-rotation-alignment": {
			type: "enum",
			values: {
				map: {},
				viewport: {},
				"viewport-glyph": {},
				auto: {}
			},
			default: "auto",
			requires: ["text-field"],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"text-field": {
			type: "formatted",
			default: "",
			tokens: !0,
			expression: {
				interpolated: !1,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"text-font": {
			type: "array",
			value: "string",
			default: ["Open Sans Regular", "Arial Unicode MS Regular"],
			requires: ["text-field"],
			expression: {
				interpolated: !1,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"text-size": {
			type: "number",
			default: 16,
			minimum: 0,
			units: "pixels",
			requires: ["text-field"],
			expression: {
				interpolated: !0,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"text-max-width": {
			type: "number",
			default: 10,
			minimum: 0,
			units: "ems",
			requires: ["text-field"],
			expression: {
				interpolated: !0,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"text-line-height": {
			type: "number",
			default: 1.2,
			units: "ems",
			requires: ["text-field"],
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"text-letter-spacing": {
			type: "number",
			default: 0,
			units: "ems",
			requires: ["text-field"],
			expression: {
				interpolated: !0,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"text-justify": {
			type: "enum",
			values: {
				auto: {},
				left: {},
				center: {},
				right: {}
			},
			default: "center",
			requires: ["text-field"],
			expression: {
				interpolated: !1,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"text-radial-offset": {
			type: "number",
			units: "ems",
			default: 0,
			requires: ["text-field"],
			"property-type": "data-driven",
			expression: {
				interpolated: !0,
				parameters: ["zoom", "feature"]
			}
		},
		"text-variable-anchor": {
			type: "array",
			value: "enum",
			values: {
				center: {},
				left: {},
				right: {},
				top: {},
				bottom: {},
				"top-left": {},
				"top-right": {},
				"bottom-left": {},
				"bottom-right": {}
			},
			requires: ["text-field", { "symbol-placement": ["point"] }],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"text-variable-anchor-offset": {
			type: "variableAnchorOffsetCollection",
			requires: ["text-field", { "symbol-placement": ["point"] }],
			expression: {
				interpolated: !0,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"text-anchor": {
			type: "enum",
			values: {
				center: {},
				left: {},
				right: {},
				top: {},
				bottom: {},
				"top-left": {},
				"top-right": {},
				"bottom-left": {},
				"bottom-right": {}
			},
			default: "center",
			requires: ["text-field", { "!": "text-variable-anchor" }],
			expression: {
				interpolated: !1,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"text-max-angle": {
			type: "number",
			default: 45,
			units: "degrees",
			requires: ["text-field", { "symbol-placement": ["line", "line-center"] }],
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"text-writing-mode": {
			type: "array",
			value: "enum",
			values: {
				horizontal: {},
				vertical: {}
			},
			requires: ["text-field", { "symbol-placement": ["point"] }],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"text-rotate": {
			type: "number",
			default: 0,
			period: 360,
			units: "degrees",
			requires: ["text-field"],
			expression: {
				interpolated: !0,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"text-padding": {
			type: "number",
			default: 2,
			minimum: 0,
			units: "pixels",
			requires: ["text-field"],
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"text-keep-upright": {
			type: "boolean",
			default: !0,
			requires: [
				"text-field",
				{ "text-rotation-alignment": "map" },
				{ "symbol-placement": ["line", "line-center"] }
			],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"text-transform": {
			type: "enum",
			values: {
				none: {},
				uppercase: {},
				lowercase: {}
			},
			default: "none",
			requires: ["text-field"],
			expression: {
				interpolated: !1,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"text-offset": {
			type: "array",
			value: "number",
			units: "ems",
			length: 2,
			default: [0, 0],
			requires: ["text-field", { "!": "text-radial-offset" }],
			expression: {
				interpolated: !0,
				parameters: ["zoom", "feature"]
			},
			"property-type": "data-driven"
		},
		"text-allow-overlap": {
			type: "boolean",
			default: !1,
			requires: ["text-field", { "!": "text-overlap" }],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"text-overlap": {
			type: "enum",
			values: {
				never: {},
				always: {},
				cooperative: {}
			},
			requires: ["text-field"],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"text-ignore-placement": {
			type: "boolean",
			default: !1,
			requires: ["text-field"],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"text-optional": {
			type: "boolean",
			default: !1,
			requires: ["text-field", "icon-image"],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		visibility: {
			type: "enum",
			values: {
				visible: {},
				none: {}
			},
			default: "visible",
			expression: {
				interpolated: !1,
				parameters: ["global-state"]
			},
			"property-type": "data-constant"
		}
	},
	layout_raster: { visibility: {
		type: "enum",
		values: {
			visible: {},
			none: {}
		},
		default: "visible",
		expression: {
			interpolated: !1,
			parameters: ["global-state"]
		},
		"property-type": "data-constant"
	} },
	layout_hillshade: { visibility: {
		type: "enum",
		values: {
			visible: {},
			none: {}
		},
		default: "visible",
		expression: {
			interpolated: !1,
			parameters: ["global-state"]
		},
		"property-type": "data-constant"
	} },
	"layout_color-relief": { visibility: {
		type: "enum",
		values: {
			visible: {},
			none: {}
		},
		default: "visible",
		expression: {
			interpolated: !1,
			parameters: ["global-state"]
		},
		"property-type": "data-constant"
	} },
	filter: {
		type: "boolean",
		expression: {
			interpolated: !1,
			parameters: ["zoom", "feature"]
		},
		"property-type": "data-driven"
	},
	filter_operator: {
		type: "enum",
		values: {
			"==": {},
			"!=": {},
			">": {},
			">=": {},
			"<": {},
			"<=": {},
			in: {},
			"!in": {},
			all: {},
			any: {},
			none: {},
			has: {},
			"!has": {}
		}
	},
	geometry_type: {
		type: "enum",
		values: {
			Point: {},
			LineString: {},
			Polygon: {}
		}
	},
	function: {
		expression: { type: "expression" },
		stops: {
			type: "array",
			value: "function_stop"
		},
		base: {
			type: "number",
			default: 1,
			minimum: 0
		},
		property: {
			type: "string",
			default: "$zoom"
		},
		type: {
			type: "enum",
			values: {
				identity: {},
				exponential: {},
				interval: {},
				categorical: {}
			},
			default: "exponential"
		},
		colorSpace: {
			type: "enum",
			values: {
				rgb: {},
				lab: {},
				hcl: {}
			},
			default: "rgb"
		},
		default: {
			type: "*",
			required: !1
		}
	},
	function_stop: {
		type: "array",
		minimum: 0,
		maximum: 24,
		value: ["number", "color"],
		length: 2
	},
	expression: {
		type: "array",
		value: "expression_name",
		minimum: 1
	},
	light: {
		anchor: {
			type: "enum",
			default: "viewport",
			values: {
				map: {},
				viewport: {}
			},
			"property-type": "data-constant",
			transition: !1,
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			}
		},
		position: {
			type: "array",
			default: [
				1.15,
				210,
				30
			],
			length: 3,
			value: "number",
			"property-type": "data-constant",
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			}
		},
		color: {
			type: "color",
			"property-type": "data-constant",
			default: "#ffffff",
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			transition: !0
		},
		intensity: {
			type: "number",
			"property-type": "data-constant",
			default: .5,
			minimum: 0,
			maximum: 1,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			transition: !0
		}
	},
	sky: {
		"sky-color": {
			type: "color",
			"property-type": "data-constant",
			default: "#88C6FC",
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			transition: !0
		},
		"horizon-color": {
			type: "color",
			"property-type": "data-constant",
			default: "#ffffff",
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			transition: !0
		},
		"fog-color": {
			type: "color",
			"property-type": "data-constant",
			default: "#ffffff",
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			transition: !0
		},
		"fog-ground-blend": {
			type: "number",
			"property-type": "data-constant",
			default: .5,
			minimum: 0,
			maximum: 1,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			transition: !0
		},
		"horizon-fog-blend": {
			type: "number",
			"property-type": "data-constant",
			default: .8,
			minimum: 0,
			maximum: 1,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			transition: !0
		},
		"sky-horizon-blend": {
			type: "number",
			"property-type": "data-constant",
			default: .8,
			minimum: 0,
			maximum: 1,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			transition: !0
		},
		"atmosphere-blend": {
			type: "number",
			"property-type": "data-constant",
			default: .8,
			minimum: 0,
			maximum: 1,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			transition: !0
		}
	},
	terrain: {
		source: {
			type: "string",
			required: !0
		},
		exaggeration: {
			type: "number",
			minimum: 0,
			default: 1
		}
	},
	projection: { type: {
		type: "projectionDefinition",
		default: "mercator",
		"property-type": "data-constant",
		transition: !1,
		expression: {
			interpolated: !0,
			parameters: ["zoom"]
		}
	} },
	paint: [
		"paint_fill",
		"paint_line",
		"paint_circle",
		"paint_heatmap",
		"paint_fill-extrusion",
		"paint_symbol",
		"paint_raster",
		"paint_hillshade",
		"paint_color-relief",
		"paint_background"
	],
	paint_fill: {
		"fill-antialias": {
			type: "boolean",
			default: !0,
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"fill-opacity": {
			type: "number",
			default: 1,
			minimum: 0,
			maximum: 1,
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"fill-layer-opacity": {
			type: "number",
			default: 1,
			minimum: 0,
			maximum: 1,
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"fill-color": {
			type: "color",
			default: "#000000",
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"fill-outline-color": {
			type: "color",
			transition: !0,
			requires: [{ "!": "fill-pattern" }, { "fill-antialias": !0 }],
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"fill-translate": {
			type: "array",
			value: "number",
			length: 2,
			default: [0, 0],
			transition: !0,
			units: "pixels",
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"fill-translate-anchor": {
			type: "enum",
			values: {
				map: {},
				viewport: {}
			},
			default: "map",
			requires: ["fill-translate"],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"fill-pattern": {
			type: "resolvedImage",
			transition: !0,
			expression: {
				interpolated: !1,
				parameters: ["zoom", "feature"]
			},
			"property-type": "cross-faded-data-driven"
		}
	},
	"paint_fill-extrusion": {
		"fill-extrusion-opacity": {
			type: "number",
			default: 1,
			minimum: 0,
			maximum: 1,
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"fill-extrusion-color": {
			type: "color",
			default: "#000000",
			transition: !0,
			requires: [{ "!": "fill-extrusion-pattern" }],
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"fill-extrusion-translate": {
			type: "array",
			value: "number",
			length: 2,
			default: [0, 0],
			transition: !0,
			units: "pixels",
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"fill-extrusion-translate-anchor": {
			type: "enum",
			values: {
				map: {},
				viewport: {}
			},
			default: "map",
			requires: ["fill-extrusion-translate"],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"fill-extrusion-pattern": {
			type: "resolvedImage",
			transition: !0,
			expression: {
				interpolated: !1,
				parameters: ["zoom", "feature"]
			},
			"property-type": "cross-faded-data-driven"
		},
		"fill-extrusion-height": {
			type: "number",
			default: 0,
			minimum: 0,
			units: "meters",
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"fill-extrusion-base": {
			type: "number",
			default: 0,
			minimum: 0,
			units: "meters",
			transition: !0,
			requires: ["fill-extrusion-height"],
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"fill-extrusion-vertical-gradient": {
			type: "boolean",
			default: !0,
			transition: !1,
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		}
	},
	paint_line: {
		"line-opacity": {
			type: "number",
			default: 1,
			minimum: 0,
			maximum: 1,
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"line-layer-opacity": {
			type: "number",
			default: 1,
			minimum: 0,
			maximum: 1,
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"line-color": {
			type: "color",
			default: "#000000",
			transition: !0,
			requires: [{ "!": "line-pattern" }],
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"line-translate": {
			type: "array",
			value: "number",
			length: 2,
			default: [0, 0],
			transition: !0,
			units: "pixels",
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"line-translate-anchor": {
			type: "enum",
			values: {
				map: {},
				viewport: {}
			},
			default: "map",
			requires: ["line-translate"],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"line-width": {
			type: "number",
			default: 1,
			minimum: 0,
			transition: !0,
			units: "pixels",
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"line-gap-width": {
			type: "number",
			default: 0,
			minimum: 0,
			transition: !0,
			units: "pixels",
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"line-offset": {
			type: "number",
			default: 0,
			transition: !0,
			units: "pixels",
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"line-blur": {
			type: "number",
			default: 0,
			minimum: 0,
			transition: !0,
			units: "pixels",
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"line-dasharray": {
			type: "array",
			value: "number",
			minimum: 0,
			transition: !0,
			units: "line widths",
			requires: [{ "!": "line-pattern" }],
			expression: {
				interpolated: !1,
				parameters: ["zoom", "feature"]
			},
			"property-type": "cross-faded-data-driven"
		},
		"line-pattern": {
			type: "resolvedImage",
			transition: !0,
			expression: {
				interpolated: !1,
				parameters: ["zoom", "feature"]
			},
			"property-type": "cross-faded-data-driven"
		},
		"line-gradient": {
			type: "color",
			transition: !1,
			requires: [
				{ "!": "line-dasharray" },
				{ "!": "line-pattern" },
				{
					source: "geojson",
					has: { lineMetrics: !0 }
				}
			],
			expression: {
				interpolated: !0,
				parameters: ["line-progress"]
			},
			"property-type": "color-ramp"
		}
	},
	paint_circle: {
		"circle-radius": {
			type: "number",
			default: 5,
			minimum: 0,
			transition: !0,
			units: "pixels",
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"circle-color": {
			type: "color",
			default: "#000000",
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"circle-blur": {
			type: "number",
			default: 0,
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"circle-opacity": {
			type: "number",
			default: 1,
			minimum: 0,
			maximum: 1,
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"circle-translate": {
			type: "array",
			value: "number",
			length: 2,
			default: [0, 0],
			transition: !0,
			units: "pixels",
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"circle-translate-anchor": {
			type: "enum",
			values: {
				map: {},
				viewport: {}
			},
			default: "map",
			requires: ["circle-translate"],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"circle-pitch-scale": {
			type: "enum",
			values: {
				map: {},
				viewport: {}
			},
			default: "map",
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"circle-pitch-alignment": {
			type: "enum",
			values: {
				map: {},
				viewport: {}
			},
			default: "viewport",
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"circle-stroke-width": {
			type: "number",
			default: 0,
			minimum: 0,
			transition: !0,
			units: "pixels",
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"circle-stroke-color": {
			type: "color",
			default: "#000000",
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"circle-stroke-opacity": {
			type: "number",
			default: 1,
			minimum: 0,
			maximum: 1,
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		}
	},
	paint_heatmap: {
		"heatmap-radius": {
			type: "number",
			default: 30,
			minimum: 1,
			transition: !0,
			units: "pixels",
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"heatmap-weight": {
			type: "number",
			default: 1,
			minimum: 0,
			transition: !1,
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"heatmap-intensity": {
			type: "number",
			default: 1,
			minimum: 0,
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"heatmap-color": {
			type: "color",
			default: [
				"interpolate",
				["linear"],
				["heatmap-density"],
				0,
				"rgba(0, 0, 255, 0)",
				.1,
				"royalblue",
				.3,
				"cyan",
				.5,
				"lime",
				.7,
				"yellow",
				1,
				"red"
			],
			transition: !1,
			expression: {
				interpolated: !0,
				parameters: ["heatmap-density"]
			},
			"property-type": "color-ramp"
		},
		"heatmap-opacity": {
			type: "number",
			default: 1,
			minimum: 0,
			maximum: 1,
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		}
	},
	paint_symbol: {
		"icon-opacity": {
			type: "number",
			default: 1,
			minimum: 0,
			maximum: 1,
			transition: !0,
			requires: ["icon-image"],
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"icon-color": {
			type: "color",
			default: "#000000",
			transition: !0,
			requires: ["icon-image"],
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"icon-halo-color": {
			type: "color",
			default: "rgba(0, 0, 0, 0)",
			transition: !0,
			requires: ["icon-image"],
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"icon-halo-width": {
			type: "number",
			default: 0,
			minimum: 0,
			transition: !0,
			units: "pixels",
			requires: ["icon-image"],
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"icon-halo-blur": {
			type: "number",
			default: 0,
			minimum: 0,
			transition: !0,
			units: "pixels",
			requires: ["icon-image"],
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"icon-translate": {
			type: "array",
			value: "number",
			length: 2,
			default: [0, 0],
			transition: !0,
			units: "pixels",
			requires: ["icon-image"],
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"icon-translate-anchor": {
			type: "enum",
			values: {
				map: {},
				viewport: {}
			},
			default: "map",
			requires: ["icon-image", "icon-translate"],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"text-opacity": {
			type: "number",
			default: 1,
			minimum: 0,
			maximum: 1,
			transition: !0,
			requires: ["text-field"],
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"text-color": {
			type: "color",
			default: "#000000",
			transition: !0,
			overridable: !0,
			requires: ["text-field"],
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"text-halo-color": {
			type: "color",
			default: "rgba(0, 0, 0, 0)",
			transition: !0,
			requires: ["text-field"],
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"text-halo-width": {
			type: "number",
			default: 0,
			minimum: 0,
			transition: !0,
			units: "pixels",
			requires: ["text-field"],
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"text-halo-blur": {
			type: "number",
			default: 0,
			minimum: 0,
			transition: !0,
			units: "pixels",
			requires: ["text-field"],
			expression: {
				interpolated: !0,
				parameters: [
					"zoom",
					"feature",
					"feature-state"
				]
			},
			"property-type": "data-driven"
		},
		"text-translate": {
			type: "array",
			value: "number",
			length: 2,
			default: [0, 0],
			transition: !0,
			units: "pixels",
			requires: ["text-field"],
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"text-translate-anchor": {
			type: "enum",
			values: {
				map: {},
				viewport: {}
			},
			default: "map",
			requires: ["text-field", "text-translate"],
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		}
	},
	paint_raster: {
		"raster-opacity": {
			type: "number",
			default: 1,
			minimum: 0,
			maximum: 1,
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"raster-hue-rotate": {
			type: "number",
			default: 0,
			period: 360,
			transition: !0,
			units: "degrees",
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"raster-brightness-min": {
			type: "number",
			default: 0,
			minimum: 0,
			maximum: 1,
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"raster-brightness-max": {
			type: "number",
			default: 1,
			minimum: 0,
			maximum: 1,
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"raster-saturation": {
			type: "number",
			default: 0,
			minimum: -1,
			maximum: 1,
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"raster-contrast": {
			type: "number",
			default: 0,
			minimum: -1,
			maximum: 1,
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		resampling: {
			type: "enum",
			values: {
				linear: {},
				nearest: {}
			},
			default: "linear",
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"raster-resampling": {
			type: "enum",
			values: {
				linear: {},
				nearest: {}
			},
			default: "linear",
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"raster-fade-duration": {
			type: "number",
			default: 300,
			minimum: 0,
			transition: !1,
			units: "milliseconds",
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		}
	},
	paint_hillshade: {
		"hillshade-illumination-direction": {
			type: "numberArray",
			default: 335,
			minimum: 0,
			maximum: 359,
			transition: !1,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"hillshade-illumination-altitude": {
			type: "numberArray",
			default: 45,
			minimum: 0,
			maximum: 90,
			transition: !1,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"hillshade-illumination-anchor": {
			type: "enum",
			values: {
				map: {},
				viewport: {}
			},
			default: "viewport",
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"hillshade-exaggeration": {
			type: "number",
			default: .5,
			minimum: 0,
			maximum: 1,
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"hillshade-shadow-color": {
			type: "colorArray",
			default: "#000000",
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"hillshade-highlight-color": {
			type: "colorArray",
			default: "#FFFFFF",
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"hillshade-accent-color": {
			type: "color",
			default: "#000000",
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"hillshade-method": {
			type: "enum",
			values: {
				standard: {},
				basic: {},
				combined: {},
				igor: {},
				multidirectional: {}
			},
			default: "standard",
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		resampling: {
			type: "enum",
			values: {
				linear: {},
				nearest: {}
			},
			default: "linear",
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		}
	},
	"paint_color-relief": {
		"color-relief-opacity": {
			type: "number",
			default: 1,
			minimum: 0,
			maximum: 1,
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"color-relief-color": {
			type: "color",
			transition: !1,
			expression: {
				interpolated: !0,
				parameters: ["elevation"]
			},
			"property-type": "color-ramp"
		},
		resampling: {
			type: "enum",
			values: {
				linear: {},
				nearest: {}
			},
			default: "linear",
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		}
	},
	paint_background: {
		"background-color": {
			type: "color",
			default: "#000000",
			transition: !0,
			requires: [{ "!": "background-pattern" }],
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		},
		"background-pattern": {
			type: "resolvedImage",
			transition: !0,
			expression: {
				interpolated: !1,
				parameters: ["zoom"]
			},
			"property-type": "cross-faded"
		},
		"background-opacity": {
			type: "number",
			default: 1,
			minimum: 0,
			maximum: 1,
			transition: !0,
			expression: {
				interpolated: !0,
				parameters: ["zoom"]
			},
			"property-type": "data-constant"
		}
	},
	transition: {
		duration: {
			type: "number",
			default: 300,
			minimum: 0,
			units: "milliseconds"
		},
		delay: {
			type: "number",
			default: 0,
			minimum: 0,
			units: "milliseconds"
		}
	},
	"property-type": {
		"data-driven": { type: "property-type" },
		"cross-faded": { type: "property-type" },
		"cross-faded-data-driven": { type: "property-type" },
		"color-ramp": { type: "property-type" },
		"data-constant": { type: "property-type" },
		constant: { type: "property-type" }
	},
	promoteId: { "*": { type: "string" } },
	interpolation: {
		type: "array",
		value: "interpolation_name",
		minimum: 1
	},
	interpolation_name: {
		type: "enum",
		values: {
			linear: { syntax: {
				overloads: [{
					parameters: [],
					"output-type": "interpolation"
				}],
				parameters: []
			} },
			exponential: { syntax: {
				overloads: [{
					parameters: ["base"],
					"output-type": "interpolation"
				}],
				parameters: [{
					name: "base",
					type: "number literal"
				}]
			} },
			"cubic-bezier": { syntax: {
				overloads: [{
					parameters: [
						"x1",
						"y1",
						"x2",
						"y2"
					],
					"output-type": "interpolation"
				}],
				parameters: [
					{
						name: "x1",
						type: "number literal"
					},
					{
						name: "y1",
						type: "number literal"
					},
					{
						name: "x2",
						type: "number literal"
					},
					{
						name: "y2",
						type: "number literal"
					}
				]
			} }
		}
	}
}, t = class {
	constructor(e, t, n, r) {
		this.message = (e ? `${e}: ` : "") + n, r && (this.identifier = r), t != null && t.__line__ && (this.line = t.__line__);
	}
};
function n(e, ...t) {
	for (let n of t) for (let t in n) e[t] = n[t];
	return e;
}
var r = class extends Error {
	constructor(e, t) {
		super(t), this.message = t, this.key = e;
	}
}, i = class e {
	constructor(e, t = []) {
		this.parent = e, this.bindings = {};
		for (let [e, n] of t) this.bindings[e] = n;
	}
	concat(t) {
		return new e(this, t);
	}
	get(e) {
		if (this.bindings[e]) return this.bindings[e];
		if (this.parent) return this.parent.get(e);
		throw Error(`${e} not found in scope.`);
	}
	has(e) {
		return this.bindings[e] ? !0 : this.parent ? this.parent.has(e) : !1;
	}
}, a = { kind: "null" }, o = { kind: "number" }, s = { kind: "string" }, c = { kind: "boolean" }, l = { kind: "color" }, u = { kind: "projectionDefinition" }, d = { kind: "object" }, f = { kind: "value" }, p = { kind: "error" }, m = { kind: "collator" }, h = { kind: "formatted" }, ee = { kind: "padding" }, g = { kind: "colorArray" }, te = { kind: "numberArray" }, ne = { kind: "resolvedImage" }, re = { kind: "variableAnchorOffsetCollection" };
function _(e, t) {
	return {
		kind: "array",
		itemType: e,
		N: t
	};
}
function v(e) {
	if (e.kind === "array") {
		let t = v(e.itemType);
		return typeof e.N == "number" ? `array<${t}, ${e.N}>` : e.itemType.kind === "value" ? "array" : `array<${t}>`;
	} else return e.kind;
}
var ie = [
	a,
	o,
	s,
	c,
	l,
	u,
	h,
	d,
	_(f),
	ee,
	te,
	g,
	ne,
	re
];
function ae(e, t) {
	if (t.kind === "error") return null;
	if (e.kind === "array") {
		if (t.kind === "array" && (t.N === 0 && t.itemType.kind === "value" || !ae(e.itemType, t.itemType)) && (typeof e.N != "number" || e.N === t.N)) return null;
	} else if (e.kind === t.kind) return null;
	else if (e.kind === "value") {
		for (let e of ie) if (!ae(e, t)) return null;
	}
	return `Expected ${v(e)} but found ${v(t)} instead.`;
}
function oe(e, t) {
	return t.some((t) => t.kind === e.kind);
}
function y(e, t) {
	return t.some((t) => t === "null" ? e === null : t === "array" ? Array.isArray(e) : t === "object" ? e && !Array.isArray(e) && typeof e == "object" : t === typeof e);
}
function b(e, t) {
	return e.kind === "array" && t.kind === "array" ? e.itemType.kind === t.itemType.kind && typeof e.N == "number" : e.kind === t.kind;
}
var se = .96422, ce = 1, le = .82521, ue = 4 / 29, x = 6 / 29, de = 3 * x * x, fe = x * x * x, pe = Math.PI / 180, me = 180 / Math.PI;
function he(e) {
	return e %= 360, e < 0 && (e += 360), e;
}
function ge([e, t, n, r]) {
	e = _e(e), t = _e(t), n = _e(n);
	let i, a, o = ve((.2225045 * e + .7168786 * t + .0606169 * n) / ce);
	e === t && t === n ? i = a = o : (i = ve((.4360747 * e + .3850649 * t + .1430804 * n) / se), a = ve((.0139322 * e + .0971045 * t + .7141733 * n) / le));
	let s = 116 * o - 16;
	return [
		s < 0 ? 0 : s,
		500 * (i - o),
		200 * (o - a),
		r
	];
}
function _e(e) {
	return e <= .04045 ? e / 12.92 : ((e + .055) / 1.055) ** 2.4;
}
function ve(e) {
	return e > fe ? e ** (1 / 3) : e / de + ue;
}
function ye([e, t, n, r]) {
	let i = (e + 16) / 116, a = isNaN(t) ? i : i + t / 500, o = isNaN(n) ? i : i - n / 200;
	return i = ce * xe(i), a = se * xe(a), o = le * xe(o), [
		be(3.1338561 * a - 1.6168667 * i - .4906146 * o),
		be(-.9787684 * a + 1.9161415 * i + .033454 * o),
		be(.0719453 * a - .2289914 * i + 1.4052427 * o),
		r
	];
}
function be(e) {
	return e = e <= .00304 ? 12.92 * e : 1.055 * e ** (1 / 2.4) - .055, e < 0 ? 0 : e > 1 ? 1 : e;
}
function xe(e) {
	return e > x ? e * e * e : de * (e - ue);
}
function Se(e) {
	let [t, n, r, i] = ge(e), a = Math.sqrt(n * n + r * r);
	return [
		Math.round(a * 1e4) ? he(Math.atan2(r, n) * me) : NaN,
		a,
		t,
		i
	];
}
function Ce([e, t, n, r]) {
	return e = isNaN(e) ? 0 : e * pe, ye([
		n,
		Math.cos(e) * t,
		Math.sin(e) * t,
		r
	]);
}
function we([e, t, n, r]) {
	e = he(e), t /= 100, n /= 100;
	function i(r) {
		let i = (r + e / 30) % 12, a = t * Math.min(n, 1 - n);
		return n - a * Math.max(-1, Math.min(i - 3, 9 - i, 1));
	}
	return [
		i(0),
		i(8),
		i(4),
		r
	];
}
var Te = Object.hasOwn || function(e, t) {
	return Object.prototype.hasOwnProperty.call(e, t);
};
function Ee(e, t) {
	return Te(e, t) ? e[t] : void 0;
}
function De(e) {
	if (e = e.toLowerCase().trim(), e === "transparent") return [
		0,
		0,
		0,
		0
	];
	let t = Ee(je, e);
	if (t) {
		let [e, n, r] = t;
		return [
			e / 255,
			n / 255,
			r / 255,
			1
		];
	}
	if (e.startsWith("#") && /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(e)) {
		let t = e.length < 6 ? 1 : 2, n = 1;
		return [
			Oe(e.slice(n, n += t)),
			Oe(e.slice(n, n += t)),
			Oe(e.slice(n, n += t)),
			Oe(e.slice(n, n + t) || "ff")
		];
	}
	if (e.startsWith("rgb")) {
		let t = e.match(/^rgba?\(\s*([\de.+-]+)(%)?(?:\s+|\s*(,)\s*)([\de.+-]+)(%)?(?:\s+|\s*(,)\s*)([\de.+-]+)(%)?(?:\s*([,\/])\s*([\de.+-]+)(%)?)?\s*\)$/);
		if (t) {
			let [e, n, r, i, a, o, s, c, l, u, d, f] = t, p = [
				i || " ",
				s || " ",
				u
			].join("");
			if (p === "  " || p === "  /" || p === ",," || p === ",,,") {
				let e = [
					r,
					o,
					l
				].join(""), t = e === "%%%" ? 100 : e === "" ? 255 : 0;
				if (t) {
					let e = [
						S(+n / t, 0, 1),
						S(+a / t, 0, 1),
						S(+c / t, 0, 1),
						d ? ke(+d, f) : 1
					];
					if (Ae(e)) return e;
				}
			}
			return;
		}
	}
	let n = e.match(/^hsla?\(\s*([\de.+-]+)(?:deg)?(?:\s+|\s*(,)\s*)([\de.+-]+)%(?:\s+|\s*(,)\s*)([\de.+-]+)%(?:\s*([,\/])\s*([\de.+-]+)(%)?)?\s*\)$/);
	if (n) {
		let [e, t, r, i, a, o, s, c, l] = n, u = [
			r || " ",
			a || " ",
			s
		].join("");
		if (u === "  " || u === "  /" || u === ",," || u === ",,,") {
			let e = [
				+t,
				S(+i, 0, 100),
				S(+o, 0, 100),
				c ? ke(+c, l) : 1
			];
			if (Ae(e)) return we(e);
		}
	}
}
function Oe(e) {
	return parseInt(e.padEnd(2, e), 16) / 255;
}
function ke(e, t) {
	return S(t ? e / 100 : e, 0, 1);
}
function S(e, t, n) {
	return Math.min(Math.max(t, e), n);
}
function Ae(e) {
	return !e.some(Number.isNaN);
}
var je = {
	aliceblue: [
		240,
		248,
		255
	],
	antiquewhite: [
		250,
		235,
		215
	],
	aqua: [
		0,
		255,
		255
	],
	aquamarine: [
		127,
		255,
		212
	],
	azure: [
		240,
		255,
		255
	],
	beige: [
		245,
		245,
		220
	],
	bisque: [
		255,
		228,
		196
	],
	black: [
		0,
		0,
		0
	],
	blanchedalmond: [
		255,
		235,
		205
	],
	blue: [
		0,
		0,
		255
	],
	blueviolet: [
		138,
		43,
		226
	],
	brown: [
		165,
		42,
		42
	],
	burlywood: [
		222,
		184,
		135
	],
	cadetblue: [
		95,
		158,
		160
	],
	chartreuse: [
		127,
		255,
		0
	],
	chocolate: [
		210,
		105,
		30
	],
	coral: [
		255,
		127,
		80
	],
	cornflowerblue: [
		100,
		149,
		237
	],
	cornsilk: [
		255,
		248,
		220
	],
	crimson: [
		220,
		20,
		60
	],
	cyan: [
		0,
		255,
		255
	],
	darkblue: [
		0,
		0,
		139
	],
	darkcyan: [
		0,
		139,
		139
	],
	darkgoldenrod: [
		184,
		134,
		11
	],
	darkgray: [
		169,
		169,
		169
	],
	darkgreen: [
		0,
		100,
		0
	],
	darkgrey: [
		169,
		169,
		169
	],
	darkkhaki: [
		189,
		183,
		107
	],
	darkmagenta: [
		139,
		0,
		139
	],
	darkolivegreen: [
		85,
		107,
		47
	],
	darkorange: [
		255,
		140,
		0
	],
	darkorchid: [
		153,
		50,
		204
	],
	darkred: [
		139,
		0,
		0
	],
	darksalmon: [
		233,
		150,
		122
	],
	darkseagreen: [
		143,
		188,
		143
	],
	darkslateblue: [
		72,
		61,
		139
	],
	darkslategray: [
		47,
		79,
		79
	],
	darkslategrey: [
		47,
		79,
		79
	],
	darkturquoise: [
		0,
		206,
		209
	],
	darkviolet: [
		148,
		0,
		211
	],
	deeppink: [
		255,
		20,
		147
	],
	deepskyblue: [
		0,
		191,
		255
	],
	dimgray: [
		105,
		105,
		105
	],
	dimgrey: [
		105,
		105,
		105
	],
	dodgerblue: [
		30,
		144,
		255
	],
	firebrick: [
		178,
		34,
		34
	],
	floralwhite: [
		255,
		250,
		240
	],
	forestgreen: [
		34,
		139,
		34
	],
	fuchsia: [
		255,
		0,
		255
	],
	gainsboro: [
		220,
		220,
		220
	],
	ghostwhite: [
		248,
		248,
		255
	],
	gold: [
		255,
		215,
		0
	],
	goldenrod: [
		218,
		165,
		32
	],
	gray: [
		128,
		128,
		128
	],
	green: [
		0,
		128,
		0
	],
	greenyellow: [
		173,
		255,
		47
	],
	grey: [
		128,
		128,
		128
	],
	honeydew: [
		240,
		255,
		240
	],
	hotpink: [
		255,
		105,
		180
	],
	indianred: [
		205,
		92,
		92
	],
	indigo: [
		75,
		0,
		130
	],
	ivory: [
		255,
		255,
		240
	],
	khaki: [
		240,
		230,
		140
	],
	lavender: [
		230,
		230,
		250
	],
	lavenderblush: [
		255,
		240,
		245
	],
	lawngreen: [
		124,
		252,
		0
	],
	lemonchiffon: [
		255,
		250,
		205
	],
	lightblue: [
		173,
		216,
		230
	],
	lightcoral: [
		240,
		128,
		128
	],
	lightcyan: [
		224,
		255,
		255
	],
	lightgoldenrodyellow: [
		250,
		250,
		210
	],
	lightgray: [
		211,
		211,
		211
	],
	lightgreen: [
		144,
		238,
		144
	],
	lightgrey: [
		211,
		211,
		211
	],
	lightpink: [
		255,
		182,
		193
	],
	lightsalmon: [
		255,
		160,
		122
	],
	lightseagreen: [
		32,
		178,
		170
	],
	lightskyblue: [
		135,
		206,
		250
	],
	lightslategray: [
		119,
		136,
		153
	],
	lightslategrey: [
		119,
		136,
		153
	],
	lightsteelblue: [
		176,
		196,
		222
	],
	lightyellow: [
		255,
		255,
		224
	],
	lime: [
		0,
		255,
		0
	],
	limegreen: [
		50,
		205,
		50
	],
	linen: [
		250,
		240,
		230
	],
	magenta: [
		255,
		0,
		255
	],
	maroon: [
		128,
		0,
		0
	],
	mediumaquamarine: [
		102,
		205,
		170
	],
	mediumblue: [
		0,
		0,
		205
	],
	mediumorchid: [
		186,
		85,
		211
	],
	mediumpurple: [
		147,
		112,
		219
	],
	mediumseagreen: [
		60,
		179,
		113
	],
	mediumslateblue: [
		123,
		104,
		238
	],
	mediumspringgreen: [
		0,
		250,
		154
	],
	mediumturquoise: [
		72,
		209,
		204
	],
	mediumvioletred: [
		199,
		21,
		133
	],
	midnightblue: [
		25,
		25,
		112
	],
	mintcream: [
		245,
		255,
		250
	],
	mistyrose: [
		255,
		228,
		225
	],
	moccasin: [
		255,
		228,
		181
	],
	navajowhite: [
		255,
		222,
		173
	],
	navy: [
		0,
		0,
		128
	],
	oldlace: [
		253,
		245,
		230
	],
	olive: [
		128,
		128,
		0
	],
	olivedrab: [
		107,
		142,
		35
	],
	orange: [
		255,
		165,
		0
	],
	orangered: [
		255,
		69,
		0
	],
	orchid: [
		218,
		112,
		214
	],
	palegoldenrod: [
		238,
		232,
		170
	],
	palegreen: [
		152,
		251,
		152
	],
	paleturquoise: [
		175,
		238,
		238
	],
	palevioletred: [
		219,
		112,
		147
	],
	papayawhip: [
		255,
		239,
		213
	],
	peachpuff: [
		255,
		218,
		185
	],
	peru: [
		205,
		133,
		63
	],
	pink: [
		255,
		192,
		203
	],
	plum: [
		221,
		160,
		221
	],
	powderblue: [
		176,
		224,
		230
	],
	purple: [
		128,
		0,
		128
	],
	rebeccapurple: [
		102,
		51,
		153
	],
	red: [
		255,
		0,
		0
	],
	rosybrown: [
		188,
		143,
		143
	],
	royalblue: [
		65,
		105,
		225
	],
	saddlebrown: [
		139,
		69,
		19
	],
	salmon: [
		250,
		128,
		114
	],
	sandybrown: [
		244,
		164,
		96
	],
	seagreen: [
		46,
		139,
		87
	],
	seashell: [
		255,
		245,
		238
	],
	sienna: [
		160,
		82,
		45
	],
	silver: [
		192,
		192,
		192
	],
	skyblue: [
		135,
		206,
		235
	],
	slateblue: [
		106,
		90,
		205
	],
	slategray: [
		112,
		128,
		144
	],
	slategrey: [
		112,
		128,
		144
	],
	snow: [
		255,
		250,
		250
	],
	springgreen: [
		0,
		255,
		127
	],
	steelblue: [
		70,
		130,
		180
	],
	tan: [
		210,
		180,
		140
	],
	teal: [
		0,
		128,
		128
	],
	thistle: [
		216,
		191,
		216
	],
	tomato: [
		255,
		99,
		71
	],
	turquoise: [
		64,
		224,
		208
	],
	violet: [
		238,
		130,
		238
	],
	wheat: [
		245,
		222,
		179
	],
	white: [
		255,
		255,
		255
	],
	whitesmoke: [
		245,
		245,
		245
	],
	yellow: [
		255,
		255,
		0
	],
	yellowgreen: [
		154,
		205,
		50
	]
};
function C(e, t, n) {
	return e + n * (t - e);
}
function Me(e, t, n) {
	return e.map((e, r) => C(e, t[r], n));
}
var w = class e {
	constructor(e, t, n, r = 1, i = !0) {
		this.r = e, this.g = t, this.b = n, this.a = r, i || (this.r *= r, this.g *= r, this.b *= r, r || this.overwriteGetter("rgb", [
			e,
			t,
			n,
			r
		]));
	}
	static {
		this.black = new e(0, 0, 0, 1);
	}
	static {
		this.white = new e(1, 1, 1, 1);
	}
	static {
		this.transparent = new e(0, 0, 0, 0);
	}
	static {
		this.red = new e(1, 0, 0, 1);
	}
	static parse(t) {
		if (t instanceof e) return t;
		if (typeof t != "string") return;
		let n = De(t);
		if (n) return new e(...n, !1);
	}
	get rgb() {
		let { r: e, g: t, b: n, a: r } = this, i = r || Infinity;
		return this.overwriteGetter("rgb", [
			e / i,
			t / i,
			n / i,
			r
		]);
	}
	get hcl() {
		return this.overwriteGetter("hcl", Se(this.rgb));
	}
	get lab() {
		return this.overwriteGetter("lab", ge(this.rgb));
	}
	overwriteGetter(e, t) {
		return Object.defineProperty(this, e, { value: t }), t;
	}
	toString() {
		let [e, t, n, r] = this.rgb;
		return `rgba(${[
			e,
			t,
			n
		].map((e) => Math.round(e * 255)).join(",")},${r})`;
	}
	static interpolate(t, n, r, i = "rgb") {
		switch (i) {
			case "rgb": {
				let [i, a, o, s] = Me(t.rgb, n.rgb, r);
				return new e(i, a, o, s, !1);
			}
			case "hcl": {
				let [i, a, o, s] = t.hcl, [c, l, u, d] = n.hcl, f, p;
				if (!isNaN(i) && !isNaN(c)) {
					let e = c - i;
					c > i && e > 180 ? e -= 360 : c < i && i - c > 180 && (e += 360), f = i + r * e;
				} else isNaN(i) ? isNaN(c) ? f = NaN : (f = c, (o === 1 || o === 0) && (p = l)) : (f = i, (u === 1 || u === 0) && (p = a));
				let [m, h, ee, g] = Ce([
					f,
					p ?? C(a, l, r),
					C(o, u, r),
					C(s, d, r)
				]);
				return new e(m, h, ee, g, !1);
			}
			case "lab": {
				let [i, a, o, s] = ye(Me(t.lab, n.lab, r));
				return new e(i, a, o, s, !1);
			}
		}
	}
}, Ne = class {
	constructor(e, t, n) {
		e ? this.sensitivity = t ? "variant" : "case" : this.sensitivity = t ? "accent" : "base", this.locale = n, this.collator = new Intl.Collator(this.locale ? this.locale : [], {
			sensitivity: this.sensitivity,
			usage: "search"
		});
	}
	compare(e, t) {
		return this.collator.compare(e, t);
	}
	resolvedLocale() {
		return new Intl.Collator(this.locale ? this.locale : []).resolvedOptions().locale;
	}
}, Pe = [
	"bottom",
	"center",
	"top"
], Fe = class {
	constructor(e, t, n, r, i, a) {
		this.text = e, this.image = t, this.scale = n, this.fontStack = r, this.textColor = i, this.verticalAlign = a;
	}
}, Ie = class e {
	constructor(e) {
		this.sections = e;
	}
	static fromString(t) {
		return new e([new Fe(t, null, null, null, null, null)]);
	}
	isEmpty() {
		return this.sections.length === 0 ? !0 : !this.sections.some((e) => e.text.length !== 0 || e.image && e.image.name.length !== 0);
	}
	static factory(t) {
		return t instanceof e ? t : e.fromString(t);
	}
	toString() {
		return this.sections.length === 0 ? "" : this.sections.map((e) => e.text).join("");
	}
}, T = class e {
	constructor(e) {
		this.values = e.slice();
	}
	static parse(t) {
		if (t instanceof e) return t;
		if (typeof t == "number") return new e([
			t,
			t,
			t,
			t
		]);
		if (Array.isArray(t) && !(t.length < 1 || t.length > 4)) {
			for (let e of t) if (typeof e != "number") return;
			switch (t.length) {
				case 1:
					t = [
						t[0],
						t[0],
						t[0],
						t[0]
					];
					break;
				case 2:
					t = [
						t[0],
						t[1],
						t[0],
						t[1]
					];
					break;
				case 3:
					t = [
						t[0],
						t[1],
						t[2],
						t[1]
					];
					break;
			}
			return new e(t);
		}
	}
	toString() {
		return JSON.stringify(this.values);
	}
	static interpolate(t, n, r) {
		return new e(Me(t.values, n.values, r));
	}
}, E = class e {
	constructor(e) {
		this.values = e.slice();
	}
	static parse(t) {
		if (t instanceof e) return t;
		if (typeof t == "number") return new e([t]);
		if (Array.isArray(t)) {
			for (let e of t) if (typeof e != "number") return;
			return new e(t);
		}
	}
	toString() {
		return JSON.stringify(this.values);
	}
	static interpolate(t, n, r) {
		return new e(Me(t.values, n.values, r));
	}
}, D = class e {
	constructor(e) {
		this.values = e.slice();
	}
	static parse(t) {
		if (t instanceof e) return t;
		if (typeof t == "string") {
			let n = w.parse(t);
			return n ? new e([n]) : void 0;
		}
		if (!Array.isArray(t)) return;
		let n = [];
		for (let e of t) {
			if (typeof e != "string") return;
			let t = w.parse(e);
			if (!t) return;
			n.push(t);
		}
		return new e(n);
	}
	toString() {
		return JSON.stringify(this.values);
	}
	static interpolate(t, n, r, i = "rgb") {
		let a = [];
		if (t.values.length != n.values.length) throw Error(`colorArray: Arrays have mismatched length (${t.values.length} vs. ${n.values.length}), cannot interpolate.`);
		for (let e = 0; e < t.values.length; e++) a.push(w.interpolate(t.values[e], n.values[e], r, i));
		return new e(a);
	}
}, O = class extends Error {
	constructor(e) {
		super(e), this.name = "RuntimeError";
	}
	toJSON() {
		return this.message;
	}
}, Le = new Set([
	"center",
	"left",
	"right",
	"top",
	"bottom",
	"top-left",
	"top-right",
	"bottom-left",
	"bottom-right"
]), k = class e {
	constructor(e) {
		this.values = e.slice();
	}
	static parse(t) {
		if (t instanceof e) return t;
		if (!(!Array.isArray(t) || t.length < 1 || t.length % 2 != 0)) {
			for (let e = 0; e < t.length; e += 2) {
				let n = t[e], r = t[e + 1];
				if (typeof n != "string" || !Le.has(n) || !Array.isArray(r) || r.length !== 2 || typeof r[0] != "number" || typeof r[1] != "number") return;
			}
			return new e(t);
		}
	}
	toString() {
		return JSON.stringify(this.values);
	}
	static interpolate(t, n, r) {
		let i = t.values, a = n.values;
		if (i.length !== a.length) throw new O(`Cannot interpolate values of different length. from: ${t.toString()}, to: ${n.toString()}`);
		let o = [];
		for (let e = 0; e < i.length; e += 2) {
			if (i[e] !== a[e]) throw new O(`Cannot interpolate values containing mismatched anchors. from[${e}]: ${i[e]}, to[${e}]: ${a[e]}`);
			o.push(i[e]);
			let [t, n] = i[e + 1], [s, c] = a[e + 1];
			o.push([C(t, s, r), C(n, c, r)]);
		}
		return new e(o);
	}
}, A = class e {
	constructor(e) {
		this.name = e.name, this.available = e.available;
	}
	toString() {
		return this.name;
	}
	static fromString(t) {
		return t ? new e({
			name: t,
			available: !1
		}) : null;
	}
}, Re = class e {
	constructor(e, t, n) {
		this.from = e, this.to = t, this.transition = n;
	}
	static interpolate(t, n, r) {
		return new e(t, n, r);
	}
	static parse(t) {
		if (t instanceof e) return t;
		if (Array.isArray(t) && t.length === 3 && typeof t[0] == "string" && typeof t[1] == "string" && typeof t[2] == "number") return new e(t[0], t[1], t[2]);
		if (typeof t == "object" && typeof t.from == "string" && typeof t.to == "string" && typeof t.transition == "number") return new e(t.from, t.to, t.transition);
		if (typeof t == "string") return new e(t, t, 1);
	}
};
function ze(e, t, n, r) {
	return typeof e == "number" && e >= 0 && e <= 255 && typeof t == "number" && t >= 0 && t <= 255 && typeof n == "number" && n >= 0 && n <= 255 ? r === void 0 || typeof r == "number" && r >= 0 && r <= 1 ? null : `Invalid rgba value [${[
		e,
		t,
		n,
		r
	].join(", ")}]: 'a' must be between 0 and 1.` : `Invalid rgba value [${(typeof r == "number" ? [
		e,
		t,
		n,
		r
	] : [
		e,
		t,
		n
	]).join(", ")}]: 'r', 'g', and 'b' must be between 0 and 255.`;
}
function Be(e) {
	if (e === null || typeof e == "string" || typeof e == "boolean" || typeof e == "number" || e instanceof Re || e instanceof w || e instanceof Ne || e instanceof Ie || e instanceof T || e instanceof E || e instanceof D || e instanceof k || e instanceof A) return !0;
	if (Array.isArray(e)) {
		for (let t of e) if (!Be(t)) return !1;
		return !0;
	} else if (typeof e == "object") {
		for (let t in e) if (!Be(e[t])) return !1;
		return !0;
	} else return !1;
}
function j(e) {
	if (e === null) return a;
	if (typeof e == "string") return s;
	if (typeof e == "boolean") return c;
	if (typeof e == "number") return o;
	if (e instanceof w) return l;
	if (e instanceof Re) return u;
	if (e instanceof Ne) return m;
	if (e instanceof Ie) return h;
	if (e instanceof T) return ee;
	if (e instanceof E) return te;
	if (e instanceof D) return g;
	if (e instanceof k) return re;
	if (e instanceof A) return ne;
	if (Array.isArray(e)) {
		let t = e.length, n;
		for (let t of e) {
			let e = j(t);
			if (!n) n = e;
			else if (n === e) continue;
			else {
				n = f;
				break;
			}
		}
		return _(n || f, t);
	} else return d;
}
function Ve(e) {
	let t = typeof e;
	return e === null ? "" : t === "string" || t === "number" || t === "boolean" ? String(e) : e instanceof w || e instanceof Re || e instanceof Ie || e instanceof T || e instanceof E || e instanceof D || e instanceof k || e instanceof A ? e.toString() : JSON.stringify(e);
}
var He = class e {
	constructor(e, t) {
		this.type = e, this.value = t;
	}
	static parse(t, n) {
		if (t.length !== 2) return n.error(`'literal' expression requires exactly one argument, but found ${t.length - 1} instead.`);
		if (!Be(t[1])) return n.error("invalid value");
		let r = t[1], i = j(r), a = n.expectedType;
		return i.kind === "array" && i.N === 0 && a && a.kind === "array" && (typeof a.N != "number" || a.N === 0) && (i = a), new e(i, r);
	}
	evaluate() {
		return this.value;
	}
	eachChild() {}
	outputDefined() {
		return !0;
	}
}, Ue = {
	string: s,
	number: o,
	boolean: c,
	object: d
}, M = class e {
	constructor(e, t) {
		this.type = e, this.args = t;
	}
	static parse(t, n) {
		if (t.length < 2) return n.error("Expected at least one argument.");
		let r = 1, i, a = t[0];
		if (a === "array") {
			let e;
			if (t.length > 2) {
				let i = t[1];
				if (typeof i != "string" || !(i in Ue) || i === "object") return n.error("The item type argument of \"array\" must be one of string, number, boolean", 1);
				e = Ue[i], r++;
			} else e = f;
			let a;
			if (t.length > 3) {
				if (t[2] !== null && (typeof t[2] != "number" || t[2] < 0 || t[2] !== Math.floor(t[2]))) return n.error("The length argument to \"array\" must be a positive integer literal", 2);
				a = t[2], r++;
			}
			i = _(e, a);
		} else {
			if (!Ue[a]) throw Error(`Types doesn't contain name = ${a}`);
			i = Ue[a];
		}
		let o = [];
		for (; r < t.length; r++) {
			let e = n.parse(t[r], r, f);
			if (!e) return null;
			o.push(e);
		}
		return new e(i, o);
	}
	evaluate(e) {
		for (let t = 0; t < this.args.length; t++) {
			let n = this.args[t].evaluate(e);
			if (!ae(this.type, j(n))) return n;
			if (t === this.args.length - 1) throw new O(`Expected value to be of type ${v(this.type)}, but found ${v(j(n))} instead.`);
		}
		throw Error();
	}
	eachChild(e) {
		this.args.forEach(e);
	}
	outputDefined() {
		return this.args.every((e) => e.outputDefined());
	}
}, We = {
	"to-boolean": c,
	"to-color": l,
	"to-number": o,
	"to-string": s
}, N = class e {
	constructor(e, t) {
		this.type = e, this.args = t;
	}
	static parse(t, n) {
		if (t.length < 2) return n.error("Expected at least one argument.");
		let r = t[0];
		if (!We[r]) throw Error(`Can't parse ${r} as it is not part of the known types`);
		if ((r === "to-boolean" || r === "to-string") && t.length !== 2) return n.error("Expected one argument.");
		let i = We[r], a = [];
		for (let e = 1; e < t.length; e++) {
			let r = n.parse(t[e], e, f);
			if (!r) return null;
			a.push(r);
		}
		return new e(i, a);
	}
	evaluate(e) {
		switch (this.type.kind) {
			case "boolean": return !!this.args[0].evaluate(e);
			case "color": {
				let t, n;
				for (let r of this.args) {
					if (t = r.evaluate(e), n = null, t instanceof w) return t;
					if (typeof t == "string") {
						let n = e.parseColor(t);
						if (n) return n;
					} else if (Array.isArray(t) && (n = t.length < 3 || t.length > 4 ? `Invalid rgba value ${JSON.stringify(t)}: expected an array containing either three or four numeric values.` : ze(t[0], t[1], t[2], t[3]), !n)) return new w(t[0] / 255, t[1] / 255, t[2] / 255, t[3]);
				}
				throw new O(n || `Could not parse color from value '${typeof t == "string" ? t : JSON.stringify(t)}'`);
			}
			case "padding": {
				let t;
				for (let n of this.args) {
					t = n.evaluate(e);
					let r = T.parse(t);
					if (r) return r;
				}
				throw new O(`Could not parse padding from value '${typeof t == "string" ? t : JSON.stringify(t)}'`);
			}
			case "numberArray": {
				let t;
				for (let n of this.args) {
					t = n.evaluate(e);
					let r = E.parse(t);
					if (r) return r;
				}
				throw new O(`Could not parse numberArray from value '${typeof t == "string" ? t : JSON.stringify(t)}'`);
			}
			case "colorArray": {
				let t;
				for (let n of this.args) {
					t = n.evaluate(e);
					let r = D.parse(t);
					if (r) return r;
				}
				throw new O(`Could not parse colorArray from value '${typeof t == "string" ? t : JSON.stringify(t)}'`);
			}
			case "variableAnchorOffsetCollection": {
				let t;
				for (let n of this.args) {
					t = n.evaluate(e);
					let r = k.parse(t);
					if (r) return r;
				}
				throw new O(`Could not parse variableAnchorOffsetCollection from value '${typeof t == "string" ? t : JSON.stringify(t)}'`);
			}
			case "number": {
				let t = null;
				for (let n of this.args) {
					if (t = n.evaluate(e), t === null) return 0;
					let r = Number(t);
					if (!isNaN(r)) return r;
				}
				throw new O(`Could not convert ${JSON.stringify(t)} to number.`);
			}
			case "formatted": return Ie.fromString(Ve(this.args[0].evaluate(e)));
			case "resolvedImage": return A.fromString(Ve(this.args[0].evaluate(e)));
			case "projectionDefinition": return this.args[0].evaluate(e);
			default: return Ve(this.args[0].evaluate(e));
		}
	}
	eachChild(e) {
		this.args.forEach(e);
	}
	outputDefined() {
		return this.args.every((e) => e.outputDefined());
	}
}, Ge = [
	"Unknown",
	"Point",
	"LineString",
	"Polygon"
], Ke = class {
	constructor() {
		this.globals = null, this.feature = null, this.featureState = null, this.formattedSection = null, this._parseColorCache = /* @__PURE__ */ new Map(), this.availableImages = null, this.canonical = null;
	}
	id() {
		return this.feature && "id" in this.feature ? this.feature.id : null;
	}
	geometryType() {
		return this.feature ? typeof this.feature.type == "number" ? Ge[this.feature.type] : this.feature.type : null;
	}
	geometry() {
		return this.feature && "geometry" in this.feature ? this.feature.geometry : null;
	}
	canonicalID() {
		return this.canonical;
	}
	properties() {
		return this.feature && this.feature.properties || {};
	}
	parseColor(e) {
		let t = this._parseColorCache.get(e);
		return t || (t = w.parse(e), this._parseColorCache.set(e, t)), t;
	}
}, qe = class e {
	constructor(e, t, n = [], r, a = new i(), o = []) {
		this.registry = e, this.path = n, this.key = n.map((e) => `[${e}]`).join(""), this.scope = a, this.errors = o, this.expectedType = r, this._isConstant = t;
	}
	parse(e, t, n, r, i = {}) {
		return t ? this.concat(t, n, r)._parse(e, i) : this._parse(e, i);
	}
	_parse(e, t) {
		(e === null || typeof e == "string" || typeof e == "boolean" || typeof e == "number") && (e = ["literal", e]);
		function n(e, t, n) {
			return n === "assert" ? new M(t, [e]) : n === "coerce" ? new N(t, [e]) : e;
		}
		if (Array.isArray(e)) {
			if (e.length === 0) return this.error("Expected an array with at least one element. If you wanted a literal array, use [\"literal\", []].");
			let r = e[0];
			if (typeof r != "string") return this.error(`Expression name must be a string, but found ${typeof r} instead. If you wanted a literal array, use ["literal", [...]].`, 0), null;
			let i = this.registry[r];
			if (i) {
				let r = i.parse(e, this);
				if (!r) return null;
				if (this.expectedType) {
					let e = this.expectedType, i = r.type;
					if ((e.kind === "string" || e.kind === "number" || e.kind === "boolean" || e.kind === "object" || e.kind === "array") && i.kind === "value") r = n(r, e, t.typeAnnotation || "assert");
					else if (e.kind === "projectionDefinition" && ["string", "array"].includes(i.kind) || [
						"color",
						"formatted",
						"resolvedImage"
					].includes(e.kind) && ["value", "string"].includes(i.kind) || ["padding", "numberArray"].includes(e.kind) && [
						"value",
						"number",
						"array"
					].includes(i.kind) || e.kind === "colorArray" && [
						"value",
						"string",
						"array"
					].includes(i.kind) || e.kind === "variableAnchorOffsetCollection" && ["value", "array"].includes(i.kind)) r = n(r, e, t.typeAnnotation || "coerce");
					else if (this.checkSubtype(e, i)) return null;
				}
				if (!(r instanceof He) && r.type.kind !== "resolvedImage" && this._isConstant(r)) {
					let e = new Ke();
					try {
						r = new He(r.type, r.evaluate(e));
					} catch (e) {
						return this.error(e.message), null;
					}
				}
				return r;
			}
			return this.error(`Unknown expression "${r}". If you wanted a literal array, use ["literal", [...]].`, 0);
		} else if (e === void 0) return this.error("'undefined' value invalid. Use null instead.");
		else if (typeof e == "object") return this.error("Bare objects invalid. Use [\"literal\", {...}] instead.");
		else return this.error(`Expected an array, but found ${typeof e} instead.`);
	}
	concat(t, n, r) {
		let i = typeof t == "number" ? this.path.concat(t) : this.path, a = r ? this.scope.concat(r) : this.scope;
		return new e(this.registry, this._isConstant, i, n || null, a, this.errors);
	}
	error(e, ...t) {
		let n = `${this.key}${t.map((e) => `[${e}]`).join("")}`;
		this.errors.push(new r(n, e));
	}
	checkSubtype(e, t) {
		let n = ae(e, t);
		return n && this.error(n), n;
	}
}, Je = class e {
	constructor(e, t) {
		this.type = t.type, this.bindings = [].concat(e), this.result = t;
	}
	evaluate(e) {
		return this.result.evaluate(e);
	}
	eachChild(e) {
		for (let t of this.bindings) e(t[1]);
		e(this.result);
	}
	static parse(t, n) {
		if (t.length < 4) return n.error(`Expected at least 3 arguments, but found ${t.length - 1} instead.`);
		let r = [];
		for (let e = 1; e < t.length - 1; e += 2) {
			let i = t[e];
			if (typeof i != "string") return n.error(`Expected string, but found ${typeof i} instead.`, e);
			if (/[^a-zA-Z0-9_]/.test(i)) return n.error("Variable names must contain only alphanumeric characters or '_'.", e);
			let a = n.parse(t[e + 1], e + 1);
			if (!a) return null;
			r.push([i, a]);
		}
		let i = n.parse(t[t.length - 1], t.length - 1, n.expectedType, r);
		return i ? new e(r, i) : null;
	}
	outputDefined() {
		return this.result.outputDefined();
	}
}, Ye = class e {
	constructor(e, t) {
		this.type = t.type, this.name = e, this.boundExpression = t;
	}
	static parse(t, n) {
		if (t.length !== 2 || typeof t[1] != "string") return n.error("'var' expression requires exactly one string literal argument.");
		let r = t[1];
		return n.scope.has(r) ? new e(r, n.scope.get(r)) : n.error(`Unknown variable "${r}". Make sure "${r}" has been bound in an enclosing "let" expression before using it.`, 1);
	}
	evaluate(e) {
		return this.boundExpression.evaluate(e);
	}
	eachChild() {}
	outputDefined() {
		return !1;
	}
}, Xe = class e {
	constructor(e, t, n) {
		this.type = e, this.index = t, this.input = n;
	}
	static parse(t, n) {
		if (t.length !== 3) return n.error(`Expected 2 arguments, but found ${t.length - 1} instead.`);
		let r = n.parse(t[1], 1, o), i = n.parse(t[2], 2, _(n.expectedType || f));
		if (!r || !i) return null;
		let a = i.type;
		return new e(a.itemType, r, i);
	}
	evaluate(e) {
		let t = this.index.evaluate(e), n = this.input.evaluate(e);
		if (t < 0) throw new O(`Array index out of bounds: ${t} < 0.`);
		if (t >= n.length) throw new O(`Array index out of bounds: ${t} > ${n.length - 1}.`);
		if (t !== Math.floor(t)) throw new O(`Array index must be an integer, but found ${t} instead.`);
		return n[t];
	}
	eachChild(e) {
		e(this.index), e(this.input);
	}
	outputDefined() {
		return !1;
	}
}, Ze = class e {
	constructor(e, t) {
		this.type = c, this.needle = e, this.haystack = t;
	}
	static parse(t, n) {
		if (t.length !== 3) return n.error(`Expected 2 arguments, but found ${t.length - 1} instead.`);
		let r = n.parse(t[1], 1, f), i = n.parse(t[2], 2, f);
		return !r || !i ? null : oe(r.type, [
			c,
			s,
			o,
			a,
			f
		]) ? new e(r, i) : n.error(`Expected first argument to be of type boolean, string, number or null, but found ${v(r.type)} instead`);
	}
	evaluate(e) {
		let t = this.needle.evaluate(e), n = this.haystack.evaluate(e);
		if (!n) return !1;
		if (!y(t, [
			"boolean",
			"string",
			"number",
			"null"
		])) throw new O(`Expected first argument to be of type boolean, string, number or null, but found ${v(j(t))} instead.`);
		if (!y(n, ["string", "array"])) throw new O(`Expected second argument to be of type array or string, but found ${v(j(n))} instead.`);
		return n.indexOf(t) >= 0;
	}
	eachChild(e) {
		e(this.needle), e(this.haystack);
	}
	outputDefined() {
		return !0;
	}
}, Qe = class e {
	constructor(e, t, n) {
		this.type = o, this.needle = e, this.haystack = t, this.fromIndex = n;
	}
	static parse(t, n) {
		if (t.length <= 2 || t.length >= 5) return n.error(`Expected 2 or 3 arguments, but found ${t.length - 1} instead.`);
		let r = n.parse(t[1], 1, f), i = n.parse(t[2], 2, f);
		if (!r || !i) return null;
		if (!oe(r.type, [
			c,
			s,
			o,
			a,
			f
		])) return n.error(`Expected first argument to be of type boolean, string, number or null, but found ${v(r.type)} instead`);
		if (t.length === 4) {
			let a = n.parse(t[3], 3, o);
			return a ? new e(r, i, a) : null;
		} else return new e(r, i);
	}
	evaluate(e) {
		let t = this.needle.evaluate(e), n = this.haystack.evaluate(e);
		if (!y(t, [
			"boolean",
			"string",
			"number",
			"null"
		])) throw new O(`Expected first argument to be of type boolean, string, number or null, but found ${v(j(t))} instead.`);
		let r;
		if (this.fromIndex && (r = this.fromIndex.evaluate(e)), y(n, ["string"])) {
			let e = n.indexOf(t, r);
			return e === -1 ? -1 : [...n.slice(0, e)].length;
		} else if (y(n, ["array"])) return n.indexOf(t, r);
		else throw new O(`Expected second argument to be of type array or string, but found ${v(j(n))} instead.`);
	}
	eachChild(e) {
		e(this.needle), e(this.haystack), this.fromIndex && e(this.fromIndex);
	}
	outputDefined() {
		return !1;
	}
}, $e = class e {
	constructor(e, t, n, r, i, a) {
		this.inputType = e, this.type = t, this.input = n, this.cases = r, this.outputs = i, this.otherwise = a;
	}
	static parse(t, n) {
		if (t.length < 5) return n.error(`Expected at least 4 arguments, but found only ${t.length - 1}.`);
		if (t.length % 2 != 1) return n.error("Expected an even number of arguments.");
		let r, i;
		n.expectedType && n.expectedType.kind !== "value" && (i = n.expectedType);
		let a = {}, o = [];
		for (let e = 2; e < t.length - 1; e += 2) {
			let s = t[e], c = t[e + 1];
			Array.isArray(s) || (s = [s]);
			let l = n.concat(e);
			if (s.length === 0) return l.error("Expected at least one branch label.");
			for (let e of s) {
				if (typeof e != "number" && typeof e != "string") return l.error("Branch labels must be numbers or strings.");
				if (typeof e == "number" && Math.abs(e) > 2 ** 53 - 1) return l.error(`Branch labels must be integers no larger than ${2 ** 53 - 1}.`);
				if (typeof e == "number" && Math.floor(e) !== e) return l.error("Numeric branch labels must be integer values.");
				if (!r) r = j(e);
				else if (l.checkSubtype(r, j(e))) return null;
				if (a[String(e)] !== void 0) return l.error("Branch labels must be unique.");
				a[String(e)] = o.length;
			}
			let u = n.parse(c, e, i);
			if (!u) return null;
			i ||= u.type, o.push(u);
		}
		let s = n.parse(t[1], 1, f);
		if (!s) return null;
		let c = n.parse(t[t.length - 1], t.length - 1, i);
		return !c || s.type.kind !== "value" && n.concat(1).checkSubtype(r, s.type) ? null : new e(r, i, s, a, o, c);
	}
	evaluate(e) {
		let t = this.input.evaluate(e);
		return (j(t) === this.inputType && this.outputs[this.cases[t]] || this.otherwise).evaluate(e);
	}
	eachChild(e) {
		e(this.input), this.outputs.forEach(e), e(this.otherwise);
	}
	outputDefined() {
		return this.outputs.every((e) => e.outputDefined()) && this.otherwise.outputDefined();
	}
}, et = class e {
	constructor(e, t, n) {
		this.type = e, this.branches = t, this.otherwise = n;
	}
	static parse(t, n) {
		if (t.length < 4) return n.error(`Expected at least 3 arguments, but found only ${t.length - 1}.`);
		if (t.length % 2 != 0) return n.error("Expected an odd number of arguments.");
		let r;
		n.expectedType && n.expectedType.kind !== "value" && (r = n.expectedType);
		let i = [];
		for (let e = 1; e < t.length - 1; e += 2) {
			let a = n.parse(t[e], e, c);
			if (!a) return null;
			let o = n.parse(t[e + 1], e + 1, r);
			if (!o) return null;
			i.push([a, o]), r ||= o.type;
		}
		let a = n.parse(t[t.length - 1], t.length - 1, r);
		if (!a) return null;
		if (!r) throw Error("Can't infer output type");
		return new e(r, i, a);
	}
	evaluate(e) {
		for (let [t, n] of this.branches) if (t.evaluate(e)) return n.evaluate(e);
		return this.otherwise.evaluate(e);
	}
	eachChild(e) {
		for (let [t, n] of this.branches) e(t), e(n);
		e(this.otherwise);
	}
	outputDefined() {
		return this.branches.every(([e, t]) => t.outputDefined()) && this.otherwise.outputDefined();
	}
}, tt = class e {
	constructor(e, t, n, r) {
		this.type = e, this.input = t, this.beginIndex = n, this.endIndex = r;
	}
	static parse(t, n) {
		if (t.length <= 2 || t.length >= 5) return n.error(`Expected 2 or 3 arguments, but found ${t.length - 1} instead.`);
		let r = n.parse(t[1], 1, f), i = n.parse(t[2], 2, o);
		if (!r || !i) return null;
		if (!oe(r.type, [
			_(f),
			s,
			f
		])) return n.error(`Expected first argument to be of type array or string, but found ${v(r.type)} instead`);
		if (t.length === 4) {
			let a = n.parse(t[3], 3, o);
			return a ? new e(r.type, r, i, a) : null;
		} else return new e(r.type, r, i);
	}
	evaluate(e) {
		let t = this.input.evaluate(e), n = this.beginIndex.evaluate(e), r;
		if (this.endIndex && (r = this.endIndex.evaluate(e)), y(t, ["string"])) return [...t].slice(n, r).join("");
		if (y(t, ["array"])) return t.slice(n, r);
		throw new O(`Expected first argument to be of type array or string, but found ${v(j(t))} instead.`);
	}
	eachChild(e) {
		e(this.input), e(this.beginIndex), this.endIndex && e(this.endIndex);
	}
	outputDefined() {
		return !1;
	}
};
function nt(e, t) {
	let n = e.length - 1, r = 0, i = n, a = 0, o, s;
	for (; r <= i;) if (a = Math.floor((r + i) / 2), o = e[a], s = e[a + 1], o <= t) {
		if (a === n || t < s) return a;
		r = a + 1;
	} else if (o > t) i = a - 1;
	else throw new O("Input is not a number.");
	return 0;
}
var rt = class e {
	constructor(e, t, n) {
		this.type = e, this.input = t, this.labels = [], this.outputs = [];
		for (let [e, t] of n) this.labels.push(e), this.outputs.push(t);
	}
	static parse(t, n) {
		if (t.length - 1 < 4) return n.error(`Expected at least 4 arguments, but found only ${t.length - 1}.`);
		if ((t.length - 1) % 2 != 0) return n.error("Expected an even number of arguments.");
		let r = n.parse(t[1], 1, o);
		if (!r) return null;
		let i = [], a = null;
		n.expectedType && n.expectedType.kind !== "value" && (a = n.expectedType);
		for (let e = 1; e < t.length; e += 2) {
			let r = e === 1 ? -Infinity : t[e], o = t[e + 1], s = e, c = e + 1;
			if (typeof r != "number") return n.error("Input/output pairs for \"step\" expressions must be defined using literal numeric values (not computed expressions) for the input values.", s);
			if (i.length && i[i.length - 1][0] >= r) return n.error("Input/output pairs for \"step\" expressions must be arranged with input values in strictly ascending order.", s);
			let l = n.parse(o, c, a);
			if (!l) return null;
			a ||= l.type, i.push([r, l]);
		}
		return new e(a, r, i);
	}
	evaluate(e) {
		let t = this.labels, n = this.outputs;
		if (t.length === 1) return n[0].evaluate(e);
		let r = this.input.evaluate(e);
		if (r <= t[0]) return n[0].evaluate(e);
		let i = t.length;
		return r >= t[i - 1] ? n[i - 1].evaluate(e) : n[nt(t, r)].evaluate(e);
	}
	eachChild(e) {
		e(this.input);
		for (let t of this.outputs) e(t);
	}
	outputDefined() {
		return this.outputs.every((e) => e.outputDefined());
	}
};
function it(e, t, n, r) {
	let i = 3 * e, a = 3 * (n - e) - i, o = 1 - i - a, s = 3 * t, c = 3 * (r - t) - s, l = 1 - s - c;
	return function(e, t = 1e-6) {
		if (e <= 0) return 0;
		if (e >= 1) return 1;
		let n = e;
		for (let r = 0; r < 8; r++) {
			let r = ((o * n + a) * n + i) * n - e;
			if (Math.abs(r) < t) return ((l * n + c) * n + s) * n;
			let u = (3 * o * n + 2 * a) * n + i;
			if (Math.abs(u) < 1e-6) break;
			n -= r / u;
		}
		let r = 0, u = 1;
		n = e;
		for (let s = 0; s < 20; s++) {
			let s = ((o * n + a) * n + i) * n;
			if (Math.abs(s - e) < t) break;
			e > s ? r = n : u = n, n = (r + u) * .5;
		}
		return ((l * n + c) * n + s) * n;
	};
}
var P = class e {
	constructor(e, t, n, r, i) {
		this.type = e, this.operator = t, this.interpolation = n, this.input = r, this.labels = [], this.outputs = [];
		for (let [e, t] of i) this.labels.push(e), this.outputs.push(t);
	}
	static interpolationFactor(e, t, n, r) {
		let i = 0;
		if (e.name === "exponential") i = at(t, e.base, n, r);
		else if (e.name === "linear") i = at(t, 1, n, r);
		else if (e.name === "cubic-bezier") {
			let a = e.controlPoints;
			i = it(a[0], a[1], a[2], a[3])(at(t, 1, n, r));
		}
		return i;
	}
	static parse(t, n) {
		let [r, i, a, ...s] = t;
		if (!Array.isArray(i) || i.length === 0) return n.error("Expected an interpolation type expression.", 1);
		if (i[0] === "linear") i = { name: "linear" };
		else if (i[0] === "exponential") {
			let e = i[1];
			if (typeof e != "number") return n.error("Exponential interpolation requires a numeric base.", 1, 1);
			i = {
				name: "exponential",
				base: e
			};
		} else if (i[0] === "cubic-bezier") {
			let e = i.slice(1);
			if (e.length !== 4 || e.some((e) => typeof e != "number" || e < 0 || e > 1)) return n.error("Cubic bezier interpolation requires four numeric arguments with values between 0 and 1.", 1);
			i = {
				name: "cubic-bezier",
				controlPoints: e
			};
		} else return n.error(`Unknown interpolation type ${String(i[0])}`, 1, 0);
		if (t.length - 1 < 4) return n.error(`Expected at least 4 arguments, but found only ${t.length - 1}.`);
		if ((t.length - 1) % 2 != 0) return n.error("Expected an even number of arguments.");
		if (a = n.parse(a, 2, o), !a) return null;
		let c = [], d = null;
		(r === "interpolate-hcl" || r === "interpolate-lab") && n.expectedType != g ? d = l : n.expectedType && n.expectedType.kind !== "value" && (d = n.expectedType);
		for (let e = 0; e < s.length; e += 2) {
			let t = s[e], r = s[e + 1], i = e + 3, a = e + 4;
			if (typeof t != "number") return n.error("Input/output pairs for \"interpolate\" expressions must be defined using literal numeric values (not computed expressions) for the input values.", i);
			if (c.length && c[c.length - 1][0] >= t) return n.error("Input/output pairs for \"interpolate\" expressions must be arranged with input values in strictly ascending order.", i);
			let o = n.parse(r, a, d);
			if (!o) return null;
			d ||= o.type, c.push([t, o]);
		}
		return !b(d, o) && !b(d, u) && !b(d, l) && !b(d, ee) && !b(d, te) && !b(d, g) && !b(d, re) && !b(d, _(o)) ? n.error(`Type ${v(d)} is not interpolatable.`) : new e(d, r, i, a, c);
	}
	evaluate(t) {
		let n = this.labels, r = this.outputs;
		if (n.length === 1) return r[0].evaluate(t);
		let i = this.input.evaluate(t);
		if (i <= n[0]) return r[0].evaluate(t);
		let a = n.length;
		if (i >= n[a - 1]) return r[a - 1].evaluate(t);
		let o = nt(n, i), s = n[o], c = n[o + 1], l = e.interpolationFactor(this.interpolation, i, s, c), u = r[o].evaluate(t), d = r[o + 1].evaluate(t);
		switch (this.operator) {
			case "interpolate": switch (this.type.kind) {
				case "number": return C(u, d, l);
				case "color": return w.interpolate(u, d, l);
				case "padding": return T.interpolate(u, d, l);
				case "colorArray": return D.interpolate(u, d, l);
				case "numberArray": return E.interpolate(u, d, l);
				case "variableAnchorOffsetCollection": return k.interpolate(u, d, l);
				case "array": return Me(u, d, l);
				case "projectionDefinition": return Re.interpolate(u, d, l);
			}
			case "interpolate-hcl": switch (this.type.kind) {
				case "color": return w.interpolate(u, d, l, "hcl");
				case "colorArray": return D.interpolate(u, d, l, "hcl");
			}
			case "interpolate-lab": switch (this.type.kind) {
				case "color": return w.interpolate(u, d, l, "lab");
				case "colorArray": return D.interpolate(u, d, l, "lab");
			}
		}
	}
	eachChild(e) {
		e(this.input);
		for (let t of this.outputs) e(t);
	}
	outputDefined() {
		return this.outputs.every((e) => e.outputDefined());
	}
};
function at(e, t, n, r) {
	let i = r - n, a = e - n;
	return i === 0 ? 0 : t === 1 ? a / i : (t ** +a - 1) / (t ** +i - 1);
}
w.interpolate, T.interpolate, E.interpolate, D.interpolate, k.interpolate;
var ot = class e {
	constructor(e, t) {
		this.type = e, this.args = t;
	}
	static parse(t, n) {
		if (t.length < 2) return n.error("Expected at least one argument.");
		let r = null, i = n.expectedType;
		i && i.kind !== "value" && (r = i);
		let a = [];
		for (let e of t.slice(1)) {
			let t = n.parse(e, 1 + a.length, r, void 0, { typeAnnotation: "omit" });
			if (!t) return null;
			r ||= t.type, a.push(t);
		}
		if (!r) throw Error("No output type");
		return i && a.some((e) => ae(i, e.type)) ? new e(f, a) : new e(r, a);
	}
	evaluate(e) {
		let t = null, n = 0, r;
		for (let i of this.args) if (n++, t = i.evaluate(e), t && t instanceof A && !t.available && (r ||= t.name, t = null, n === this.args.length && (t = r)), t !== null) break;
		return t;
	}
	eachChild(e) {
		this.args.forEach(e);
	}
	outputDefined() {
		return this.args.every((e) => e.outputDefined());
	}
};
function st(e, t) {
	return e === "==" || e === "!=" ? t.kind === "boolean" || t.kind === "string" || t.kind === "number" || t.kind === "null" || t.kind === "value" : t.kind === "string" || t.kind === "number" || t.kind === "value";
}
function ct(e, t, n) {
	return t === n;
}
function lt(e, t, n) {
	return t !== n;
}
function ut(e, t, n) {
	return t < n;
}
function dt(e, t, n) {
	return t > n;
}
function ft(e, t, n) {
	return t <= n;
}
function pt(e, t, n) {
	return t >= n;
}
function mt(e, t, n, r) {
	return r.compare(t, n) === 0;
}
function ht(e, t, n, r) {
	return !mt(e, t, n, r);
}
function gt(e, t, n, r) {
	return r.compare(t, n) < 0;
}
function _t(e, t, n, r) {
	return r.compare(t, n) > 0;
}
function vt(e, t, n, r) {
	return r.compare(t, n) <= 0;
}
function yt(e, t, n, r) {
	return r.compare(t, n) >= 0;
}
function F(e, t, n) {
	let r = e !== "==" && e !== "!=";
	return class i {
		constructor(e, t, n) {
			this.type = c, this.lhs = e, this.rhs = t, this.collator = n, this.hasUntypedArgument = e.type.kind === "value" || t.type.kind === "value";
		}
		static parse(e, t) {
			if (e.length !== 3 && e.length !== 4) return t.error("Expected two or three arguments.");
			let n = e[0], a = t.parse(e[1], 1, f);
			if (!a) return null;
			if (!st(n, a.type)) return t.concat(1).error(`"${n}" comparisons are not supported for type '${v(a.type)}'.`);
			let o = t.parse(e[2], 2, f);
			if (!o) return null;
			if (!st(n, o.type)) return t.concat(2).error(`"${n}" comparisons are not supported for type '${v(o.type)}'.`);
			if (a.type.kind !== o.type.kind && a.type.kind !== "value" && o.type.kind !== "value") return t.error(`Cannot compare types '${v(a.type)}' and '${v(o.type)}'.`);
			r && (a.type.kind === "value" && o.type.kind !== "value" ? a = new M(o.type, [a]) : a.type.kind !== "value" && o.type.kind === "value" && (o = new M(a.type, [o])));
			let s = null;
			if (e.length === 4) {
				if (a.type.kind !== "string" && o.type.kind !== "string" && a.type.kind !== "value" && o.type.kind !== "value") return t.error("Cannot use collator to compare non-string types.");
				if (s = t.parse(e[3], 3, m), !s) return null;
			}
			return new i(a, o, s);
		}
		evaluate(i) {
			let a = this.lhs.evaluate(i), o = this.rhs.evaluate(i);
			if (r && this.hasUntypedArgument) {
				let t = j(a), n = j(o);
				if (t.kind !== n.kind || !(t.kind === "string" || t.kind === "number")) throw new O(`Expected arguments for "${e}" to be (string, string) or (number, number), but found (${t.kind}, ${n.kind}) instead.`);
			}
			if (this.collator && !r && this.hasUntypedArgument) {
				let e = j(a), n = j(o);
				if (e.kind !== "string" || n.kind !== "string") return t(i, a, o);
			}
			return this.collator ? n(i, a, o, this.collator.evaluate(i)) : t(i, a, o);
		}
		eachChild(e) {
			e(this.lhs), e(this.rhs), this.collator && e(this.collator);
		}
		outputDefined() {
			return !0;
		}
	};
}
var bt = F("==", ct, mt), xt = F("!=", lt, ht), St = F("<", ut, gt), Ct = F(">", dt, _t), wt = F("<=", ft, vt), Tt = F(">=", pt, yt), Et = class e {
	constructor(e, t, n) {
		this.type = m, this.locale = n, this.caseSensitive = e, this.diacriticSensitive = t;
	}
	static parse(t, n) {
		if (t.length !== 2) return n.error("Expected one argument.");
		let r = t[1];
		if (typeof r != "object" || Array.isArray(r)) return n.error("Collator options argument must be an object.");
		let i = n.parse(r["case-sensitive"] === void 0 ? !1 : r["case-sensitive"], 1, c);
		if (!i) return null;
		let a = n.parse(r["diacritic-sensitive"] === void 0 ? !1 : r["diacritic-sensitive"], 1, c);
		if (!a) return null;
		let o = null;
		return r.locale && (o = n.parse(r.locale, 1, s), !o) ? null : new e(i, a, o);
	}
	evaluate(e) {
		return new Ne(this.caseSensitive.evaluate(e), this.diacriticSensitive.evaluate(e), this.locale ? this.locale.evaluate(e) : null);
	}
	eachChild(e) {
		e(this.caseSensitive), e(this.diacriticSensitive), this.locale && e(this.locale);
	}
	outputDefined() {
		return !1;
	}
}, Dt = class e {
	constructor(e, t, n, r, i, a) {
		this.type = s, this.number = e, this.locale = t, this.currency = n, this.unit = r, this.minFractionDigits = i, this.maxFractionDigits = a;
	}
	static parse(t, n) {
		if (t.length !== 3) return n.error("Expected two arguments.");
		let r = n.parse(t[1], 1, o);
		if (!r) return null;
		let i = t[2];
		if (typeof i != "object" || Array.isArray(i)) return n.error("NumberFormat options argument must be an object.");
		let a = null;
		if (i.locale && (a = n.parse(i.locale, 1, s), !a)) return null;
		let c = null;
		if (i.currency && (c = n.parse(i.currency, 1, s), !c)) return null;
		let l = null;
		if (i.unit && (l = n.parse(i.unit, 1, s), !l)) return null;
		if (c && l) return n.error("NumberFormat options `currency` and `unit` are mutually exclusive");
		let u = null;
		if (i["min-fraction-digits"] && (u = n.parse(i["min-fraction-digits"], 1, o), !u)) return null;
		let d = null;
		return i["max-fraction-digits"] && (d = n.parse(i["max-fraction-digits"], 1, o), !d) ? null : new e(r, a, c, l, u, d);
	}
	evaluate(e) {
		return new Intl.NumberFormat(this.locale ? this.locale.evaluate(e) : [], {
			style: this.currency ? "currency" : this.unit ? "unit" : "decimal",
			currency: this.currency ? this.currency.evaluate(e) : void 0,
			unit: this.unit ? this.unit.evaluate(e) : void 0,
			minimumFractionDigits: this.minFractionDigits ? this.minFractionDigits.evaluate(e) : void 0,
			maximumFractionDigits: this.maxFractionDigits ? this.maxFractionDigits.evaluate(e) : void 0
		}).format(this.number.evaluate(e));
	}
	eachChild(e) {
		e(this.number), this.locale && e(this.locale), this.currency && e(this.currency), this.unit && e(this.unit), this.minFractionDigits && e(this.minFractionDigits), this.maxFractionDigits && e(this.maxFractionDigits);
	}
	outputDefined() {
		return !1;
	}
}, Ot = class e {
	constructor(e) {
		this.type = h, this.sections = e;
	}
	static parse(t, n) {
		if (t.length < 2) return n.error("Expected at least one argument.");
		let r = t[1];
		if (!Array.isArray(r) && typeof r == "object") return n.error("First argument must be an image or text section.");
		let i = [], a = !1;
		for (let e = 1; e <= t.length - 1; ++e) {
			let r = t[e];
			if (a && typeof r == "object" && !Array.isArray(r)) {
				a = !1;
				let e = null;
				if (r["font-scale"] && (e = n.parse(r["font-scale"], 1, o), !e)) return null;
				let t = null;
				if (r["text-font"] && (t = n.parse(r["text-font"], 1, _(s)), !t)) return null;
				let c = null;
				if (r["text-color"] && (c = n.parse(r["text-color"], 1, l), !c)) return null;
				let u = null;
				if (r["vertical-align"]) {
					if (typeof r["vertical-align"] == "string" && !Pe.includes(r["vertical-align"])) return n.error(`'vertical-align' must be one of: 'bottom', 'center', 'top' but found '${r["vertical-align"]}' instead.`);
					if (u = n.parse(r["vertical-align"], 1, s), !u) return null;
				}
				let d = i[i.length - 1];
				d.scale = e, d.font = t, d.textColor = c, d.verticalAlign = u;
			} else {
				let r = n.parse(t[e], 1, f);
				if (!r) return null;
				let o = r.type.kind;
				if (o !== "string" && o !== "value" && o !== "null" && o !== "resolvedImage") return n.error("Formatted text type must be 'string', 'value', 'image' or 'null'.");
				a = !0, i.push({
					content: r,
					scale: null,
					font: null,
					textColor: null,
					verticalAlign: null
				});
			}
		}
		return new e(i);
	}
	evaluate(e) {
		return new Ie(this.sections.map((t) => {
			let n = t.content.evaluate(e);
			return j(n) === ne ? new Fe("", n, null, null, null, t.verticalAlign ? t.verticalAlign.evaluate(e) : null) : new Fe(Ve(n), null, t.scale ? t.scale.evaluate(e) : null, t.font ? t.font.evaluate(e).join(",") : null, t.textColor ? t.textColor.evaluate(e) : null, t.verticalAlign ? t.verticalAlign.evaluate(e) : null);
		}));
	}
	eachChild(e) {
		for (let t of this.sections) e(t.content), t.scale && e(t.scale), t.font && e(t.font), t.textColor && e(t.textColor), t.verticalAlign && e(t.verticalAlign);
	}
	outputDefined() {
		return !1;
	}
}, kt = class e {
	constructor(e) {
		this.type = ne, this.input = e;
	}
	static parse(t, n) {
		if (t.length !== 2) return n.error("Expected two arguments.");
		let r = n.parse(t[1], 1, s);
		return r ? new e(r) : n.error("No image name provided.");
	}
	evaluate(e) {
		let t = this.input.evaluate(e), n = A.fromString(t);
		return n && e.availableImages && (n.available = e.availableImages.indexOf(t) > -1), n;
	}
	eachChild(e) {
		e(this.input);
	}
	outputDefined() {
		return !1;
	}
}, At = class e {
	constructor(e) {
		this.type = o, this.input = e;
	}
	static parse(t, n) {
		if (t.length !== 2) return n.error(`Expected 1 argument, but found ${t.length - 1} instead.`);
		let r = n.parse(t[1], 1);
		return r ? r.type.kind !== "array" && r.type.kind !== "string" && r.type.kind !== "value" ? n.error(`Expected argument of type string or array, but found ${v(r.type)} instead.`) : new e(r) : null;
	}
	evaluate(e) {
		let t = this.input.evaluate(e);
		if (typeof t == "string") return [...t].length;
		if (Array.isArray(t)) return t.length;
		throw new O(`Expected value to be of type string or array, but found ${v(j(t))} instead.`);
	}
	eachChild(e) {
		e(this.input);
	}
	outputDefined() {
		return !1;
	}
}, I = 8192;
function jt(e, t) {
	let n = Nt(e[0]), r = Ft(e[1]), i = 2 ** t.z;
	return [Math.round(n * i * I), Math.round(r * i * I)];
}
function Mt(e, t) {
	let n = 2 ** t.z, r = (e[0] / I + t.x) / n, i = (e[1] / I + t.y) / n;
	return [Pt(r), It(i)];
}
function Nt(e) {
	return (180 + e) / 360;
}
function Pt(e) {
	return e * 360 - 180;
}
function Ft(e) {
	return (180 - 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + e * Math.PI / 360))) / 360;
}
function It(e) {
	return 360 / Math.PI * Math.atan(Math.exp((180 - e * 360) * Math.PI / 180)) - 90;
}
function Lt(e, t) {
	e[0] = Math.min(e[0], t[0]), e[1] = Math.min(e[1], t[1]), e[2] = Math.max(e[2], t[0]), e[3] = Math.max(e[3], t[1]);
}
function Rt(e, t) {
	return !(e[0] <= t[0] || e[2] >= t[2] || e[1] <= t[1] || e[3] >= t[3]);
}
function zt(e, t, n) {
	return t[1] > e[1] != n[1] > e[1] && e[0] < (n[0] - t[0]) * (e[1] - t[1]) / (n[1] - t[1]) + t[0];
}
function Bt(e, t, n) {
	let r = e[0] - t[0], i = e[1] - t[1], a = e[0] - n[0], o = e[1] - n[1];
	return r * o - a * i === 0 && r * a <= 0 && i * o <= 0;
}
function Vt(e, t, n, r) {
	let i = [t[0] - e[0], t[1] - e[1]];
	return Kt([r[0] - n[0], r[1] - n[1]], i) === 0 ? !1 : !!(qt(e, t, n, r) && qt(n, r, e, t));
}
function Ht(e, t, n) {
	for (let r of n) for (let n = 0; n < r.length - 1; ++n) if (Vt(e, t, r[n], r[n + 1])) return !0;
	return !1;
}
function L(e, t, n = !1) {
	let r = !1;
	for (let i of t) for (let t = 0; t < i.length - 1; t++) {
		if (Bt(e, i[t], i[t + 1])) return n;
		zt(e, i[t], i[t + 1]) && (r = !r);
	}
	return r;
}
function Ut(e, t) {
	for (let n of t) if (L(e, n)) return !0;
	return !1;
}
function Wt(e, t) {
	for (let n of e) if (!L(n, t)) return !1;
	for (let n = 0; n < e.length - 1; ++n) if (Ht(e[n], e[n + 1], t)) return !1;
	return !0;
}
function Gt(e, t) {
	for (let n of t) if (Wt(e, n)) return !0;
	return !1;
}
function Kt(e, t) {
	return e[0] * t[1] - e[1] * t[0];
}
function qt(e, t, n, r) {
	let i = e[0] - n[0], a = e[1] - n[1], o = t[0] - n[0], s = t[1] - n[1], c = r[0] - n[0], l = r[1] - n[1], u = i * l - c * a, d = o * l - c * s;
	return u > 0 && d < 0 || u < 0 && d > 0;
}
function Jt(e, t, n) {
	let r = [];
	for (let i = 0; i < e.length; i++) {
		let a = [];
		for (let r = 0; r < e[i].length; r++) {
			let o = jt(e[i][r], n);
			Lt(t, o), a.push(o);
		}
		r.push(a);
	}
	return r;
}
function Yt(e, t, n) {
	let r = [];
	for (let i = 0; i < e.length; i++) {
		let a = Jt(e[i], t, n);
		r.push(a);
	}
	return r;
}
function Xt(e, t, n, r) {
	if (e[0] < n[0] || e[0] > n[2]) {
		let t = r * .5, i = e[0] - n[0] > t ? -r : n[0] - e[0] > t ? r : 0;
		i === 0 && (i = e[0] - n[2] > t ? -r : n[2] - e[0] > t ? r : 0), e[0] += i;
	}
	Lt(t, e);
}
function Zt(e) {
	e[0] = e[1] = Infinity, e[2] = e[3] = -Infinity;
}
function Qt(e, t, n, r) {
	let i = 2 ** r.z * I, a = [r.x * I, r.y * I], o = [];
	for (let r of e) for (let e of r) {
		let r = [e.x + a[0], e.y + a[1]];
		Xt(r, t, n, i), o.push(r);
	}
	return o;
}
function $t(e, t, n, r) {
	let i = 2 ** r.z * I, a = [r.x * I, r.y * I], o = [];
	for (let n of e) {
		let e = [];
		for (let r of n) {
			let n = [r.x + a[0], r.y + a[1]];
			Lt(t, n), e.push(n);
		}
		o.push(e);
	}
	if (t[2] - t[0] <= i / 2) {
		Zt(t);
		for (let e of o) for (let r of e) Xt(r, t, n, i);
	}
	return o;
}
function en(e, t) {
	let n = [
		Infinity,
		Infinity,
		-Infinity,
		-Infinity
	], r = [
		Infinity,
		Infinity,
		-Infinity,
		-Infinity
	], i = e.canonicalID();
	if (t.type === "Polygon") {
		let a = Jt(t.coordinates, r, i), o = Qt(e.geometry(), n, r, i);
		if (!Rt(n, r)) return !1;
		for (let e of o) if (!L(e, a)) return !1;
	}
	if (t.type === "MultiPolygon") {
		let a = Yt(t.coordinates, r, i), o = Qt(e.geometry(), n, r, i);
		if (!Rt(n, r)) return !1;
		for (let e of o) if (!Ut(e, a)) return !1;
	}
	return !0;
}
function tn(e, t) {
	let n = [
		Infinity,
		Infinity,
		-Infinity,
		-Infinity
	], r = [
		Infinity,
		Infinity,
		-Infinity,
		-Infinity
	], i = e.canonicalID();
	if (t.type === "Polygon") {
		let a = Jt(t.coordinates, r, i), o = $t(e.geometry(), n, r, i);
		if (!Rt(n, r)) return !1;
		for (let e of o) if (!Wt(e, a)) return !1;
	}
	if (t.type === "MultiPolygon") {
		let a = Yt(t.coordinates, r, i), o = $t(e.geometry(), n, r, i);
		if (!Rt(n, r)) return !1;
		for (let e of o) if (!Gt(e, a)) return !1;
	}
	return !0;
}
var nn = class e {
	constructor(e, t) {
		this.type = c, this.geojson = e, this.geometries = t;
	}
	static parse(t, n) {
		if (t.length !== 2) return n.error(`'within' expression requires exactly one argument, but found ${t.length - 1} instead.`);
		if (Be(t[1])) {
			let n = t[1];
			if (n.type === "FeatureCollection") {
				let t = [];
				for (let e of n.features) {
					let { type: n, coordinates: r } = e.geometry;
					n === "Polygon" && t.push(r), n === "MultiPolygon" && t.push(...r);
				}
				if (t.length) return new e(n, {
					type: "MultiPolygon",
					coordinates: t
				});
			} else if (n.type === "Feature") {
				let t = n.geometry.type;
				if (t === "Polygon" || t === "MultiPolygon") return new e(n, n.geometry);
			} else if (n.type === "Polygon" || n.type === "MultiPolygon") return new e(n, n);
		}
		return n.error("'within' expression requires valid geojson object that contains polygon geometry type.");
	}
	evaluate(e) {
		if (e.geometry() != null && e.canonicalID() != null) {
			if (e.geometryType() === "Point") return en(e, this.geometries);
			if (e.geometryType() === "LineString") return tn(e, this.geometries);
		}
		return !1;
	}
	eachChild() {}
	outputDefined() {
		return !0;
	}
}, rn = class {
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
};
function an(e, t, n = 0, r = e.length - 1, i = sn) {
	for (; r > n;) {
		if (r - n > 600) {
			let a = r - n + 1, o = t - n + 1, s = Math.log(a), c = .5 * Math.exp(2 * s / 3), l = .5 * Math.sqrt(s * c * (a - c) / a) * (o - a / 2 < 0 ? -1 : 1);
			an(e, t, Math.max(n, Math.floor(t - o * c / a + l)), Math.min(r, Math.floor(t + (a - o) * c / a + l)), i);
		}
		let a = e[t], o = n, s = r;
		for (on(e, n, t), i(e[r], a) > 0 && on(e, n, r); o < s;) {
			for (on(e, o, s), o++, s--; i(e[o], a) < 0;) o++;
			for (; i(e[s], a) > 0;) s--;
		}
		i(e[n], a) === 0 ? on(e, n, s) : (s++, on(e, s, r)), s <= t && (n = s + 1), t <= s && (r = s - 1);
	}
}
function on(e, t, n) {
	let r = e[t];
	e[t] = e[n], e[n] = r;
}
function sn(e, t) {
	return e < t ? -1 : +(e > t);
}
function cn(e, t) {
	if (e.length <= 1) return [e];
	let n = [], r, i;
	for (let t of e) {
		let e = un(t);
		e !== 0 && (t.area = Math.abs(e), i === void 0 && (i = e < 0), i === e < 0 ? (r && n.push(r), r = [t]) : r.push(t));
	}
	if (r && n.push(r), t > 1) for (let e = 0; e < n.length; e++) n[e].length <= t || (an(n[e], t, 1, n[e].length - 1, ln), n[e] = n[e].slice(0, t));
	return n;
}
function ln(e, t) {
	return t.area - e.area;
}
function un(e) {
	let t = 0;
	for (let n = 0, r = e.length, i = r - 1, a, o; n < r; i = n++) a = e[n], o = e[i], t += (o.x - a.x) * (a.y + o.y);
	return t;
}
var dn = 6378.137, fn = 1 / 298.257223563, pn = fn * (2 - fn), mn = Math.PI / 180, hn = class {
	constructor(e) {
		let t = mn * dn * 1e3, n = Math.cos(e * mn), r = 1 / (1 - pn * (1 - n * n)), i = Math.sqrt(r);
		this.kx = t * i * n, this.ky = t * i * r * (1 - pn);
	}
	distance(e, t) {
		let n = this.wrap(e[0] - t[0]) * this.kx, r = (e[1] - t[1]) * this.ky;
		return Math.sqrt(n * n + r * r);
	}
	pointOnLine(e, t) {
		let n = Infinity, r, i, a, o;
		for (let s = 0; s < e.length - 1; s++) {
			let c = e[s][0], l = e[s][1], u = this.wrap(e[s + 1][0] - c) * this.kx, d = (e[s + 1][1] - l) * this.ky, f = 0;
			(u !== 0 || d !== 0) && (f = (this.wrap(t[0] - c) * this.kx * u + (t[1] - l) * this.ky * d) / (u * u + d * d), f > 1 ? (c = e[s + 1][0], l = e[s + 1][1]) : f > 0 && (c += u / this.kx * f, l += d / this.ky * f)), u = this.wrap(t[0] - c) * this.kx, d = (t[1] - l) * this.ky;
			let p = u * u + d * d;
			p < n && (n = p, r = c, i = l, a = s, o = f);
		}
		return {
			point: [r, i],
			index: a,
			t: Math.max(0, Math.min(1, o))
		};
	}
	wrap(e) {
		for (; e < -180;) e += 360;
		for (; e > 180;) e -= 360;
		return e;
	}
}, gn = 100, _n = 50;
function vn(e, t) {
	return t[0] - e[0];
}
function yn(e) {
	return e[1] - e[0] + 1;
}
function R(e, t) {
	return e[1] >= e[0] && e[1] < t;
}
function bn(e, t) {
	if (e[0] > e[1]) return [null, null];
	let n = yn(e);
	if (t) {
		if (n === 2) return [e, null];
		let t = Math.floor(n / 2);
		return [[e[0], e[0] + t], [e[0] + t, e[1]]];
	}
	if (n === 1) return [e, null];
	let r = Math.floor(n / 2) - 1;
	return [[e[0], e[0] + r], [e[0] + r + 1, e[1]]];
}
function xn(e, t) {
	if (!R(t, e.length)) return [
		Infinity,
		Infinity,
		-Infinity,
		-Infinity
	];
	let n = [
		Infinity,
		Infinity,
		-Infinity,
		-Infinity
	];
	for (let r = t[0]; r <= t[1]; ++r) Lt(n, e[r]);
	return n;
}
function Sn(e) {
	let t = [
		Infinity,
		Infinity,
		-Infinity,
		-Infinity
	];
	for (let n of e) for (let e of n) Lt(t, e);
	return t;
}
function Cn(e) {
	return e[0] !== -Infinity && e[1] !== -Infinity && e[2] !== Infinity && e[3] !== Infinity;
}
function wn(e, t, n) {
	if (!Cn(e) || !Cn(t)) return NaN;
	let r = 0, i = 0;
	return e[2] < t[0] && (r = t[0] - e[2]), e[0] > t[2] && (r = e[0] - t[2]), e[1] > t[3] && (i = e[1] - t[3]), e[3] < t[1] && (i = t[1] - e[3]), n.distance([0, 0], [r, i]);
}
function z(e, t, n) {
	let r = n.pointOnLine(t, e);
	return n.distance(e, r.point);
}
function Tn(e, t, n, r, i) {
	let a = Math.min(z(e, [n, r], i), z(t, [n, r], i)), o = Math.min(z(n, [e, t], i), z(r, [e, t], i));
	return Math.min(a, o);
}
function En(e, t, n, r, i) {
	if (!(R(t, e.length) && R(r, n.length))) return Infinity;
	let a = Infinity;
	for (let o = t[0]; o < t[1]; ++o) {
		let t = e[o], s = e[o + 1];
		for (let e = r[0]; e < r[1]; ++e) {
			let r = n[e], o = n[e + 1];
			if (Vt(t, s, r, o)) return 0;
			a = Math.min(a, Tn(t, s, r, o, i));
		}
	}
	return a;
}
function Dn(e, t, n, r, i) {
	if (!(R(t, e.length) && R(r, n.length))) return NaN;
	let a = Infinity;
	for (let o = t[0]; o <= t[1]; ++o) for (let t = r[0]; t <= r[1]; ++t) if (a = Math.min(a, i.distance(e[o], n[t])), a === 0) return a;
	return a;
}
function On(e, t, n) {
	if (L(e, t, !0)) return 0;
	let r = Infinity;
	for (let i of t) {
		let t = i[0], a = i[i.length - 1];
		if (t !== a && (r = Math.min(r, z(e, [a, t], n)), r === 0)) return r;
		let o = n.pointOnLine(i, e);
		if (r = Math.min(r, n.distance(e, o.point)), r === 0) return r;
	}
	return r;
}
function kn(e, t, n, r) {
	if (!R(t, e.length)) return NaN;
	for (let r = t[0]; r <= t[1]; ++r) if (L(e[r], n, !0)) return 0;
	let i = Infinity;
	for (let a = t[0]; a < t[1]; ++a) {
		let t = e[a], o = e[a + 1];
		for (let e of n) for (let n = 0, a = e.length, s = a - 1; n < a; s = n++) {
			let a = e[s], c = e[n];
			if (Vt(t, o, a, c)) return 0;
			i = Math.min(i, Tn(t, o, a, c, r));
		}
	}
	return i;
}
function An(e, t) {
	for (let n of e) for (let e of n) if (L(e, t, !0)) return !0;
	return !1;
}
function jn(e, t, n, r = Infinity) {
	let i = Sn(e), a = Sn(t);
	if (r !== Infinity && wn(i, a, n) >= r) return r;
	if (Rt(i, a)) {
		if (An(e, t)) return 0;
	} else if (An(t, e)) return 0;
	let o = Infinity;
	for (let r of e) for (let e = 0, i = r.length, a = i - 1; e < i; a = e++) {
		let i = r[a], s = r[e];
		for (let e of t) for (let t = 0, r = e.length, a = r - 1; t < r; a = t++) {
			let r = e[a], c = e[t];
			if (Vt(i, s, r, c)) return 0;
			o = Math.min(o, Tn(i, s, r, c, n));
		}
	}
	return o;
}
function Mn(e, t, n, r, i, a) {
	if (!a) return;
	let o = wn(xn(r, a), i, n);
	o < t && e.push([
		o,
		a,
		[0, 0]
	]);
}
function Nn(e, t, n, r, i, a, o) {
	if (!a || !o) return;
	let s = wn(xn(r, a), xn(i, o), n);
	s < t && e.push([
		s,
		a,
		o
	]);
}
function Pn(e, t, n, r, i = Infinity) {
	let a = Math.min(r.distance(e[0], n[0][0]), i);
	if (a === 0) return a;
	let o = new rn([[
		0,
		[0, e.length - 1],
		[0, 0]
	]], vn), s = Sn(n);
	for (; o.length > 0;) {
		let i = o.pop();
		if (i[0] >= a) continue;
		let c = i[1], l = t ? _n : gn;
		if (yn(c) <= l) {
			if (!R(c, e.length)) return NaN;
			if (t) {
				let t = kn(e, c, n, r);
				if (isNaN(t) || t === 0) return t;
				a = Math.min(a, t);
			} else for (let t = c[0]; t <= c[1]; ++t) {
				let i = On(e[t], n, r);
				if (a = Math.min(a, i), a === 0) return 0;
			}
		} else {
			let n = bn(c, t);
			Mn(o, a, r, e, s, n[0]), Mn(o, a, r, e, s, n[1]);
		}
	}
	return a;
}
function Fn(e, t, n, r, i, a = Infinity) {
	let o = Math.min(a, i.distance(e[0], n[0]));
	if (o === 0) return o;
	let s = new rn([[
		0,
		[0, e.length - 1],
		[0, n.length - 1]
	]], vn);
	for (; s.length > 0;) {
		let a = s.pop();
		if (a[0] >= o) continue;
		let c = a[1], l = a[2], u = t ? _n : gn, d = r ? _n : gn;
		if (yn(c) <= u && yn(l) <= d) {
			if (!R(c, e.length) && R(l, n.length)) return NaN;
			let a;
			if (t && r) a = En(e, c, n, l, i), o = Math.min(o, a);
			else if (t && !r) {
				let t = e.slice(c[0], c[1] + 1);
				for (let e = l[0]; e <= l[1]; ++e) if (a = z(n[e], t, i), o = Math.min(o, a), o === 0) return o;
			} else if (!t && r) {
				let t = n.slice(l[0], l[1] + 1);
				for (let n = c[0]; n <= c[1]; ++n) if (a = z(e[n], t, i), o = Math.min(o, a), o === 0) return o;
			} else a = Dn(e, c, n, l, i), o = Math.min(o, a);
		} else {
			let a = bn(c, t), u = bn(l, r);
			Nn(s, o, i, e, n, a[0], u[0]), Nn(s, o, i, e, n, a[0], u[1]), Nn(s, o, i, e, n, a[1], u[0]), Nn(s, o, i, e, n, a[1], u[1]);
		}
	}
	return o;
}
function In(e, t) {
	let n = e.geometry(), r = n.flat().map((t) => Mt([t.x, t.y], e.canonical));
	if (n.length === 0) return NaN;
	let i = new hn(r[0][1]), a = Infinity;
	for (let e of t) {
		switch (e.type) {
			case "Point":
				a = Math.min(a, Fn(r, !1, [e.coordinates], !1, i, a));
				break;
			case "LineString":
				a = Math.min(a, Fn(r, !1, e.coordinates, !0, i, a));
				break;
			case "Polygon":
				a = Math.min(a, Pn(r, !1, e.coordinates, i, a));
				break;
		}
		if (a === 0) return a;
	}
	return a;
}
function Ln(e, t) {
	let n = e.geometry(), r = n.flat().map((t) => Mt([t.x, t.y], e.canonical));
	if (n.length === 0) return NaN;
	let i = new hn(r[0][1]), a = Infinity;
	for (let e of t) {
		switch (e.type) {
			case "Point":
				a = Math.min(a, Fn(r, !0, [e.coordinates], !1, i, a));
				break;
			case "LineString":
				a = Math.min(a, Fn(r, !0, e.coordinates, !0, i, a));
				break;
			case "Polygon":
				a = Math.min(a, Pn(r, !0, e.coordinates, i, a));
				break;
		}
		if (a === 0) return a;
	}
	return a;
}
function Rn(e, t) {
	let n = e.geometry();
	if (n.length === 0 || n[0].length === 0) return NaN;
	let r = cn(n, 0).map((t) => t.map((t) => t.map((t) => Mt([t.x, t.y], e.canonical)))), i = new hn(r[0][0][0][1]), a = Infinity;
	for (let e of t) for (let t of r) {
		switch (e.type) {
			case "Point":
				a = Math.min(a, Pn([e.coordinates], !1, t, i, a));
				break;
			case "LineString":
				a = Math.min(a, Pn(e.coordinates, !0, t, i, a));
				break;
			case "Polygon":
				a = Math.min(a, jn(t, e.coordinates, i, a));
				break;
		}
		if (a === 0) return a;
	}
	return a;
}
function zn(e) {
	return e.type === "MultiPolygon" ? e.coordinates.map((e) => ({
		type: "Polygon",
		coordinates: e
	})) : e.type === "MultiLineString" ? e.coordinates.map((e) => ({
		type: "LineString",
		coordinates: e
	})) : e.type === "MultiPoint" ? e.coordinates.map((e) => ({
		type: "Point",
		coordinates: e
	})) : [e];
}
var Bn = class e {
	constructor(e, t) {
		this.type = o, this.geojson = e, this.geometries = t;
	}
	static parse(t, n) {
		if (t.length !== 2) return n.error(`'distance' expression requires exactly one argument, but found ${t.length - 1} instead.`);
		if (Be(t[1])) {
			let n = t[1];
			if (n.type === "FeatureCollection") return new e(n, n.features.map((e) => zn(e.geometry)).flat());
			if (n.type === "Feature") return new e(n, zn(n.geometry));
			if ("type" in n && "coordinates" in n) return new e(n, zn(n));
		}
		return n.error("'distance' expression requires valid geojson object that contains polygon geometry type.");
	}
	evaluate(e) {
		if (e.geometry() != null && e.canonicalID() != null) {
			if (e.geometryType() === "Point") return In(e, this.geometries);
			if (e.geometryType() === "LineString") return Ln(e, this.geometries);
			if (e.geometryType() === "Polygon") return Rn(e, this.geometries);
		}
		return NaN;
	}
	eachChild() {}
	outputDefined() {
		return !0;
	}
}, Vn = class e {
	constructor(e) {
		this.type = f, this.key = e;
	}
	static parse(t, n) {
		if (t.length !== 2) return n.error(`Expected 1 argument, but found ${t.length - 1} instead.`);
		let r = t[1];
		return r == null ? n.error("Global state property must be defined.") : typeof r == "string" ? new e(r) : n.error(`Global state property must be string, but found ${typeof t[1]} instead.`);
	}
	evaluate(e) {
		let t = e.globals?.globalState;
		return !t || Object.keys(t).length === 0 ? null : Ee(t, this.key) ?? null;
	}
	eachChild() {}
	outputDefined() {
		return !1;
	}
}, Hn = {
	"==": bt,
	"!=": xt,
	">": Ct,
	"<": St,
	">=": Tt,
	"<=": wt,
	array: M,
	at: Xe,
	boolean: M,
	case: et,
	coalesce: ot,
	collator: Et,
	format: Ot,
	image: kt,
	in: Ze,
	"index-of": Qe,
	interpolate: P,
	"interpolate-hcl": P,
	"interpolate-lab": P,
	length: At,
	let: Je,
	literal: He,
	match: $e,
	number: M,
	"number-format": Dt,
	object: M,
	slice: tt,
	step: rt,
	string: M,
	"to-boolean": N,
	"to-color": N,
	"to-number": N,
	"to-string": N,
	var: Ye,
	within: nn,
	distance: Bn,
	"global-state": Vn
}, B = class e {
	constructor(e, t, n, r) {
		this.name = e, this.type = t, this._evaluate = n, this.args = r;
	}
	evaluate(e) {
		return this._evaluate(e, this.args);
	}
	eachChild(e) {
		this.args.forEach(e);
	}
	outputDefined() {
		return !1;
	}
	static parse(t, n) {
		let r = t[0], i = e.definitions[r];
		if (!i) return n.error(`Unknown expression "${r}". If you wanted a literal array, use ["literal", [...]].`, 0);
		let a = Array.isArray(i) ? i[0] : i.type, o = Array.isArray(i) ? [[i[1], i[2]]] : i.overloads, s = o.filter(([e]) => !Array.isArray(e) || e.length === t.length - 1), c = null;
		for (let [i, o] of s) {
			c = new qe(n.registry, Jn, n.path, null, n.scope);
			let s = [], l = !1;
			for (let e = 1; e < t.length; e++) {
				let n = t[e], r = Array.isArray(i) ? i[e - 1] : i.type, a = c.parse(n, 1 + s.length, r);
				if (!a) {
					l = !0;
					break;
				}
				s.push(a);
			}
			if (!l) {
				if (Array.isArray(i) && i.length !== s.length) {
					c.error(`Expected ${i.length} arguments, but found ${s.length} instead.`);
					continue;
				}
				for (let e = 0; e < s.length; e++) {
					let t = Array.isArray(i) ? i[e] : i.type, n = s[e];
					c.concat(e + 1).checkSubtype(t, n.type);
				}
				if (c.errors.length === 0) return new e(r, a, o, s);
			}
		}
		if (s.length === 1) n.errors.push(...c.errors);
		else {
			let e = (s.length ? s : o).map(([e]) => qn(e)).join(" | "), r = [];
			for (let e = 1; e < t.length; e++) {
				let i = n.parse(t[e], 1 + r.length);
				if (!i) return null;
				r.push(v(i.type));
			}
			n.error(`Expected arguments of type ${e}, but found (${r.join(", ")}) instead.`);
		}
		return null;
	}
	static register(t, n) {
		e.definitions = n;
		for (let r in n) t[r] = e;
	}
};
function Un(e, [t, n, r, i]) {
	t = t.evaluate(e), n = n.evaluate(e), r = r.evaluate(e);
	let a = i ? i.evaluate(e) : 1, o = ze(t, n, r, a);
	if (o) throw new O(o);
	return new w(t / 255, n / 255, r / 255, a, !1);
}
function Wn(e, t) {
	return e in t;
}
function Gn(e, t) {
	let n = t[e];
	return n === void 0 ? null : n;
}
function Kn(e, t, n, r) {
	for (; n <= r;) {
		let i = n + r >> 1;
		if (t[i] === e) return !0;
		t[i] > e ? r = i - 1 : n = i + 1;
	}
	return !1;
}
function V(e) {
	return { type: e };
}
B.register(Hn, {
	error: [
		p,
		[s],
		(e, [t]) => {
			throw new O(t.evaluate(e));
		}
	],
	typeof: [
		s,
		[f],
		(e, [t]) => v(j(t.evaluate(e)))
	],
	"to-rgba": [
		_(o, 4),
		[l],
		(e, [t]) => {
			let [n, r, i, a] = t.evaluate(e).rgb;
			return [
				n * 255,
				r * 255,
				i * 255,
				a
			];
		}
	],
	rgb: [
		l,
		[
			o,
			o,
			o
		],
		Un
	],
	rgba: [
		l,
		[
			o,
			o,
			o,
			o
		],
		Un
	],
	has: {
		type: c,
		overloads: [[[s], (e, [t]) => Wn(t.evaluate(e), e.properties())], [[s, d], (e, [t, n]) => Wn(t.evaluate(e), n.evaluate(e))]]
	},
	get: {
		type: f,
		overloads: [[[s], (e, [t]) => Gn(t.evaluate(e), e.properties())], [[s, d], (e, [t, n]) => Gn(t.evaluate(e), n.evaluate(e))]]
	},
	"feature-state": [
		f,
		[s],
		(e, [t]) => Gn(t.evaluate(e), e.featureState || {})
	],
	properties: [
		d,
		[],
		(e) => e.properties()
	],
	"geometry-type": [
		s,
		[],
		(e) => e.geometryType()
	],
	id: [
		f,
		[],
		(e) => e.id()
	],
	zoom: [
		o,
		[],
		(e) => e.globals.zoom
	],
	"heatmap-density": [
		o,
		[],
		(e) => e.globals.heatmapDensity || 0
	],
	elevation: [
		o,
		[],
		(e) => e.globals.elevation || 0
	],
	"line-progress": [
		o,
		[],
		(e) => e.globals.lineProgress || 0
	],
	accumulated: [
		f,
		[],
		(e) => e.globals.accumulated === void 0 ? null : e.globals.accumulated
	],
	"+": [
		o,
		V(o),
		(e, t) => {
			let n = 0;
			for (let r of t) n += r.evaluate(e);
			return n;
		}
	],
	"*": [
		o,
		V(o),
		(e, t) => {
			let n = 1;
			for (let r of t) n *= r.evaluate(e);
			return n;
		}
	],
	"-": {
		type: o,
		overloads: [[[o, o], (e, [t, n]) => t.evaluate(e) - n.evaluate(e)], [[o], (e, [t]) => -t.evaluate(e)]]
	},
	"/": [
		o,
		[o, o],
		(e, [t, n]) => t.evaluate(e) / n.evaluate(e)
	],
	"%": [
		o,
		[o, o],
		(e, [t, n]) => t.evaluate(e) % n.evaluate(e)
	],
	ln2: [
		o,
		[],
		() => Math.LN2
	],
	pi: [
		o,
		[],
		() => Math.PI
	],
	e: [
		o,
		[],
		() => Math.E
	],
	"^": [
		o,
		[o, o],
		(e, [t, n]) => t.evaluate(e) ** +n.evaluate(e)
	],
	sqrt: [
		o,
		[o],
		(e, [t]) => Math.sqrt(t.evaluate(e))
	],
	log10: [
		o,
		[o],
		(e, [t]) => Math.log(t.evaluate(e)) / Math.LN10
	],
	ln: [
		o,
		[o],
		(e, [t]) => Math.log(t.evaluate(e))
	],
	log2: [
		o,
		[o],
		(e, [t]) => Math.log(t.evaluate(e)) / Math.LN2
	],
	sin: [
		o,
		[o],
		(e, [t]) => Math.sin(t.evaluate(e))
	],
	cos: [
		o,
		[o],
		(e, [t]) => Math.cos(t.evaluate(e))
	],
	tan: [
		o,
		[o],
		(e, [t]) => Math.tan(t.evaluate(e))
	],
	asin: [
		o,
		[o],
		(e, [t]) => Math.asin(t.evaluate(e))
	],
	acos: [
		o,
		[o],
		(e, [t]) => Math.acos(t.evaluate(e))
	],
	atan: [
		o,
		[o],
		(e, [t]) => Math.atan(t.evaluate(e))
	],
	min: [
		o,
		V(o),
		(e, t) => Math.min(...t.map((t) => t.evaluate(e)))
	],
	max: [
		o,
		V(o),
		(e, t) => Math.max(...t.map((t) => t.evaluate(e)))
	],
	abs: [
		o,
		[o],
		(e, [t]) => Math.abs(t.evaluate(e))
	],
	round: [
		o,
		[o],
		(e, [t]) => {
			let n = t.evaluate(e);
			return n < 0 ? -Math.round(-n) : Math.round(n);
		}
	],
	floor: [
		o,
		[o],
		(e, [t]) => Math.floor(t.evaluate(e))
	],
	ceil: [
		o,
		[o],
		(e, [t]) => Math.ceil(t.evaluate(e))
	],
	"filter-==": [
		c,
		[s, f],
		(e, [t, n]) => e.properties()[t.value] === n.value
	],
	"filter-id-==": [
		c,
		[f],
		(e, [t]) => e.id() === t.value
	],
	"filter-type-==": [
		c,
		[s],
		(e, [t]) => e.geometryType() === t.value
	],
	"filter-<": [
		c,
		[s, f],
		(e, [t, n]) => {
			let r = e.properties()[t.value], i = n.value;
			return typeof r == typeof i && r < i;
		}
	],
	"filter-id-<": [
		c,
		[f],
		(e, [t]) => {
			let n = e.id(), r = t.value;
			return typeof n == typeof r && n < r;
		}
	],
	"filter->": [
		c,
		[s, f],
		(e, [t, n]) => {
			let r = e.properties()[t.value], i = n.value;
			return typeof r == typeof i && r > i;
		}
	],
	"filter-id->": [
		c,
		[f],
		(e, [t]) => {
			let n = e.id(), r = t.value;
			return typeof n == typeof r && n > r;
		}
	],
	"filter-<=": [
		c,
		[s, f],
		(e, [t, n]) => {
			let r = e.properties()[t.value], i = n.value;
			return typeof r == typeof i && r <= i;
		}
	],
	"filter-id-<=": [
		c,
		[f],
		(e, [t]) => {
			let n = e.id(), r = t.value;
			return typeof n == typeof r && n <= r;
		}
	],
	"filter->=": [
		c,
		[s, f],
		(e, [t, n]) => {
			let r = e.properties()[t.value], i = n.value;
			return typeof r == typeof i && r >= i;
		}
	],
	"filter-id->=": [
		c,
		[f],
		(e, [t]) => {
			let n = e.id(), r = t.value;
			return typeof n == typeof r && n >= r;
		}
	],
	"filter-has": [
		c,
		[f],
		(e, [t]) => t.value in e.properties()
	],
	"filter-has-id": [
		c,
		[],
		(e) => e.id() !== null && e.id() !== void 0
	],
	"filter-type-in": [
		c,
		[_(s)],
		(e, [t]) => t.value.indexOf(e.geometryType()) >= 0
	],
	"filter-id-in": [
		c,
		[_(f)],
		(e, [t]) => t.value.indexOf(e.id()) >= 0
	],
	"filter-in-small": [
		c,
		[s, _(f)],
		(e, [t, n]) => n.value.indexOf(e.properties()[t.value]) >= 0
	],
	"filter-in-large": [
		c,
		[s, _(f)],
		(e, [t, n]) => Kn(e.properties()[t.value], n.value, 0, n.value.length - 1)
	],
	all: {
		type: c,
		overloads: [[[c, c], (e, [t, n]) => t.evaluate(e) && n.evaluate(e)], [V(c), (e, t) => {
			for (let n of t) if (!n.evaluate(e)) return !1;
			return !0;
		}]]
	},
	any: {
		type: c,
		overloads: [[[c, c], (e, [t, n]) => t.evaluate(e) || n.evaluate(e)], [V(c), (e, t) => {
			for (let n of t) if (n.evaluate(e)) return !0;
			return !1;
		}]]
	},
	"!": [
		c,
		[c],
		(e, [t]) => !t.evaluate(e)
	],
	"is-supported-script": [
		c,
		[s],
		(e, [t]) => {
			let n = e.globals && e.globals.isSupportedScript;
			return n ? n(t.evaluate(e)) : !0;
		}
	],
	upcase: [
		s,
		[s],
		(e, [t]) => t.evaluate(e).toUpperCase()
	],
	downcase: [
		s,
		[s],
		(e, [t]) => t.evaluate(e).toLowerCase()
	],
	concat: [
		s,
		V(f),
		(e, t) => t.map((t) => Ve(t.evaluate(e))).join("")
	],
	split: [
		_(s),
		[s, s],
		(e, [t, n]) => t.evaluate(e).split(n.evaluate(e))
	],
	join: [
		s,
		[_(s), s],
		(e, [t, n]) => t.evaluate(e).join(n.evaluate(e))
	],
	"resolved-locale": [
		s,
		[m],
		(e, [t]) => t.evaluate(e).resolvedLocale()
	]
});
function qn(e) {
	return Array.isArray(e) ? `(${e.map(v).join(", ")})` : `(${v(e.type)}...)`;
}
function Jn(e) {
	if (e instanceof Ye) return Jn(e.boundExpression);
	if (e instanceof B && e.name === "error" || e instanceof Et || e instanceof nn || e instanceof Bn || e instanceof Vn) return !1;
	let t = e instanceof N || e instanceof M, n = !0;
	return e.eachChild((e) => {
		t ? n &&= Jn(e) : n &&= e instanceof He;
	}), n ? Yn(e) && Zn(e, [
		"zoom",
		"heatmap-density",
		"elevation",
		"line-progress",
		"accumulated",
		"is-supported-script"
	]) : !1;
}
function Yn(e) {
	if (e instanceof B && (e.name === "get" && e.args.length === 1 || e.name === "feature-state" || e.name === "has" && e.args.length === 1 || e.name === "properties" || e.name === "geometry-type" || e.name === "id" || /^filter-/.test(e.name)) || e instanceof nn || e instanceof Bn) return !1;
	let t = !0;
	return e.eachChild((e) => {
		t && !Yn(e) && (t = !1);
	}), t;
}
function Xn(e) {
	if (e instanceof B && e.name === "feature-state") return !1;
	let t = !0;
	return e.eachChild((e) => {
		t && !Xn(e) && (t = !1);
	}), t;
}
function Zn(e, t) {
	if (e instanceof B && t.indexOf(e.name) >= 0) return !1;
	let n = !0;
	return e.eachChild((e) => {
		n && !Zn(e, t) && (n = !1);
	}), n;
}
function Qn(e) {
	return {
		result: "success",
		value: e
	};
}
function H(e) {
	return {
		result: "error",
		value: e
	};
}
function $n(e) {
	return e["property-type"] === "data-driven" || e["property-type"] === "cross-faded-data-driven";
}
function er(e) {
	return !!e.expression && e.expression.parameters.indexOf("zoom") > -1;
}
function tr(e) {
	return !!e.expression && e.expression.interpolated;
}
function U(e) {
	return e instanceof Number ? "number" : e instanceof String ? "string" : e instanceof Boolean ? "boolean" : Array.isArray(e) ? "array" : e === null ? "null" : typeof e;
}
function nr(e) {
	return typeof e == "object" && !!e && !Array.isArray(e) && j(e) === d;
}
var rr = class {
	constructor(e, t, n) {
		this.expression = e, this._warningHistory = {}, this._evaluator = new Ke(), this._defaultValue = t ? dr(t) : null, this._enumValues = t && t.type === "enum" ? t.values : null, this._globalState = n;
	}
	evaluateWithoutErrorHandling(e, t, n, r, i, a) {
		return this._globalState && (e = G(e, this._globalState)), this._evaluator.globals = e, this._evaluator.feature = t, this._evaluator.featureState = n, this._evaluator.canonical = r, this._evaluator.availableImages = i || null, this._evaluator.formattedSection = a, this.expression.evaluate(this._evaluator);
	}
	evaluate(e, t, n, r, i, a) {
		this._globalState && (e = G(e, this._globalState)), this._evaluator.globals = e, this._evaluator.feature = t || null, this._evaluator.featureState = n || null, this._evaluator.canonical = r, this._evaluator.availableImages = i || null, this._evaluator.formattedSection = a || null;
		try {
			let e = this.expression.evaluate(this._evaluator);
			if (e == null || typeof e == "number" && e !== e) return this._defaultValue;
			if (this._enumValues && !(e in this._enumValues)) throw new O(`Expected value to be one of ${Object.keys(this._enumValues).map((e) => JSON.stringify(e)).join(", ")}, but found ${JSON.stringify(e)} instead.`);
			return e;
		} catch (e) {
			return this._warningHistory[e.message] || (this._warningHistory[e.message] = !0, typeof console < "u" && console.warn(e.message)), this._defaultValue;
		}
	}
};
function ir(e) {
	return Array.isArray(e) && e.length > 0 && typeof e[0] == "string" && e[0] in Hn;
}
function W(e, t, n) {
	let r = new qe(Hn, Jn, [], t ? ur(t) : void 0), i = r.parse(e, void 0, void 0, void 0, t && t.type === "string" ? { typeAnnotation: "coerce" } : void 0);
	return i ? Qn(new rr(i, t, n)) : H(r.errors);
}
var ar = class {
	constructor(e, t, n) {
		this.kind = e, this._styleExpression = t, this.isStateDependent = e !== "constant" && !Xn(t.expression), this.globalStateRefs = lr(t.expression), this._globalState = n;
	}
	evaluateWithoutErrorHandling(e, t, n, r, i, a) {
		return this._globalState && (e = G(e, this._globalState)), this._styleExpression.evaluateWithoutErrorHandling(e, t, n, r, i, a);
	}
	evaluate(e, t, n, r, i, a) {
		return this._globalState && (e = G(e, this._globalState)), this._styleExpression.evaluate(e, t, n, r, i, a);
	}
}, or = class {
	constructor(e, t, n, r, i) {
		this.kind = e, this.zoomStops = n, this._styleExpression = t, this.isStateDependent = e !== "camera" && !Xn(t.expression), this.globalStateRefs = lr(t.expression), this.interpolationType = r, this._globalState = i;
	}
	evaluateWithoutErrorHandling(e, t, n, r, i, a) {
		return this._globalState && (e = G(e, this._globalState)), this._styleExpression.evaluateWithoutErrorHandling(e, t, n, r, i, a);
	}
	evaluate(e, t, n, r, i, a) {
		return this._globalState && (e = G(e, this._globalState)), this._styleExpression.evaluate(e, t, n, r, i, a);
	}
	interpolationFactor(e, t, n) {
		return this.interpolationType ? P.interpolationFactor(this.interpolationType, e, t, n) : 0;
	}
};
function sr(e, t, n) {
	let i = W(e, t, n);
	if (i.result === "error") return i;
	let a = i.value.expression, o = Yn(a);
	if (!o && !$n(t)) return H([new r("", "data expressions not supported")]);
	let s = Zn(a, ["zoom"]);
	if (!s && !er(t)) return H([new r("", "zoom expressions not supported")]);
	let c = cr(a);
	if (!c && !s) return H([new r("", "\"zoom\" expression may only be used as input to a top-level \"step\" or \"interpolate\" expression.")]);
	if (c instanceof r) return H([c]);
	if (c instanceof P && !tr(t)) return H([new r("", "\"interpolate\" expressions cannot be used with this property")]);
	if (!c) return Qn(o ? new ar("constant", i.value, n) : new ar("source", i.value, n));
	let l = c instanceof P ? c.interpolation : void 0;
	return Qn(o ? new or("camera", i.value, c.labels, l, n) : new or("composite", i.value, c.labels, l, n));
}
function cr(e) {
	let t = null;
	if (e instanceof Je) t = cr(e.result);
	else if (e instanceof ot) {
		for (let n of e.args) if (t = cr(n), t) break;
	} else (e instanceof rt || e instanceof P) && e.input instanceof B && e.input.name === "zoom" && (t = e);
	return t instanceof r || e.eachChild((e) => {
		let n = cr(e);
		n instanceof r ? t = n : !t && n ? t = new r("", "\"zoom\" expression may only be used as input to a top-level \"step\" or \"interpolate\" expression.") : t && n && t !== n && (t = new r("", "Only one zoom-based \"step\" or \"interpolate\" subexpression may be used in an expression."));
	}), t;
}
function lr(e, t = /* @__PURE__ */ new Set()) {
	return e instanceof Vn && t.add(e.key), e.eachChild((e) => {
		lr(e, t);
	}), t;
}
function ur(e) {
	let t = {
		color: l,
		string: s,
		number: o,
		enum: s,
		boolean: c,
		formatted: h,
		padding: ee,
		numberArray: te,
		colorArray: g,
		projectionDefinition: u,
		resolvedImage: ne,
		variableAnchorOffsetCollection: re
	};
	return e.type === "array" ? _(t[e.value] || f, e.length) : t[e.type];
}
function dr(e) {
	if (e.type === "color" && nr(e.default)) return new w(0, 0, 0, 0);
	switch (e.type) {
		case "color": return w.parse(e.default) || null;
		case "padding": return T.parse(e.default) || null;
		case "numberArray": return E.parse(e.default) || null;
		case "colorArray": return D.parse(e.default) || null;
		case "variableAnchorOffsetCollection": return k.parse(e.default) || null;
		case "projectionDefinition": return Re.parse(e.default) || null;
		default: return e.default === void 0 ? null : e.default;
	}
}
function G(e, t) {
	let { zoom: n, heatmapDensity: r, elevation: i, lineProgress: a, isSupportedScript: o, accumulated: s } = e ?? {};
	return {
		zoom: n,
		heatmapDensity: r,
		elevation: i,
		lineProgress: a,
		isSupportedScript: o,
		accumulated: s,
		globalState: t
	};
}
function fr(e) {
	if (e === !0 || e === !1) return !0;
	if (!Array.isArray(e) || e.length === 0) return !1;
	switch (e[0]) {
		case "has": return e.length >= 2 && e[1] !== "$id" && e[1] !== "$type";
		case "in": return e.length >= 3 && (typeof e[1] != "string" || Array.isArray(e[2]));
		case "!in":
		case "!has":
		case "none": return !1;
		case "==":
		case "!=":
		case ">":
		case ">=":
		case "<":
		case "<=": return e.length !== 3 || Array.isArray(e[1]) || Array.isArray(e[2]);
		case "any":
		case "all":
			for (let t of e.slice(1)) if (!fr(t) && typeof t != "boolean") return !1;
			return !0;
		default: return !0;
	}
}
var pr = {
	type: "boolean",
	default: !1,
	transition: !1,
	"property-type": "data-driven",
	expression: {
		interpolated: !1,
		parameters: ["zoom", "feature"]
	}
};
function mr(e, t) {
	if (e == null) return {
		filter: () => !0,
		needGeometry: !1,
		getGlobalStateRefs: () => /* @__PURE__ */ new Set()
	};
	fr(e) || (e = _r(e));
	let n = W(e, pr, t);
	if (n.result === "error") throw Error(n.value.map((e) => `${e.key}: ${e.message}`).join(", "));
	return {
		filter: (e, t, r) => n.value.evaluate(e, t, {}, r),
		needGeometry: gr(e),
		getGlobalStateRefs: () => lr(n.value.expression)
	};
}
function hr(e, t) {
	return e < t ? -1 : +(e > t);
}
function gr(e) {
	if (!Array.isArray(e)) return !1;
	if (e[0] === "within" || e[0] === "distance") return !0;
	for (let t = 1; t < e.length; t++) if (gr(e[t])) return !0;
	return !1;
}
function _r(e) {
	if (!e) return !0;
	let t = e[0];
	return e.length <= 1 ? t !== "any" : t === "==" ? vr(e[1], e[2], "==") : t === "!=" ? Sr(vr(e[1], e[2], "==")) : t === "<" || t === ">" || t === "<=" || t === ">=" ? vr(e[1], e[2], t) : t === "any" ? yr(e.slice(1)) : t === "all" ? ["all"].concat(e.slice(1).map(_r)) : t === "none" ? ["all"].concat(e.slice(1).map(_r).map(Sr)) : t === "in" ? br(e[1], e.slice(2)) : t === "!in" ? Sr(br(e[1], e.slice(2))) : t === "has" ? xr(e[1]) : t === "!has" ? Sr(xr(e[1])) : !0;
}
function vr(e, t, n) {
	switch (e) {
		case "$type": return [`filter-type-${n}`, t];
		case "$id": return [`filter-id-${n}`, t];
		default: return [
			`filter-${n}`,
			e,
			t
		];
	}
}
function yr(e) {
	return ["any"].concat(e.map(_r));
}
function br(e, t) {
	if (t.length === 0) return !1;
	switch (e) {
		case "$type": return ["filter-type-in", ["literal", t]];
		case "$id": return ["filter-id-in", ["literal", t]];
		default: return t.length > 200 && !t.some((e) => typeof e != typeof t[0]) ? [
			"filter-in-large",
			e,
			["literal", t.sort(hr)]
		] : [
			"filter-in-small",
			e,
			["literal", t]
		];
	}
}
function xr(e) {
	switch (e) {
		case "$type": return !0;
		case "$id": return ["filter-has-id"];
		default: return ["filter-has", e];
	}
}
function Sr(e) {
	return ["!", e];
}
function Cr(e) {
	let n = e.key, r = e.value;
	return r ? [new t(n, r, "constants have been deprecated as of v8")] : [];
}
function K(e) {
	return e instanceof Number || e instanceof String || e instanceof Boolean ? e.valueOf() : e;
}
function q(e) {
	if (Array.isArray(e)) return e.map(q);
	if (e instanceof Object && !(e instanceof Number || e instanceof String || e instanceof Boolean)) {
		let t = {};
		for (let n in e) t[n] = q(e[n]);
		return t;
	}
	return K(e);
}
function J(e) {
	let n = e.key, r = e.value, i = e.valueSpec || {}, a = e.objectElementValidators || {}, o = e.style, s = e.styleSpec, c = e.validateSpec, l = [], u = U(r);
	if (u !== "object") return [new t(n, r, `object expected, ${u} found`)];
	for (let e in r) {
		let u = e.split(".")[0], d = Ee(i, u) || i["*"], f;
		if (Ee(a, u)) f = a[u];
		else if (Ee(i, u)) {
			if (r[e] === void 0) continue;
			f = c;
		} else if (a["*"]) f = a["*"];
		else if (i["*"]) f = c;
		else {
			l.push(new t(n, r[e], `unknown property "${e}"`));
			continue;
		}
		l = l.concat(f({
			key: (n && `${n}.`) + e,
			value: r[e],
			valueSpec: d,
			style: o,
			styleSpec: s,
			object: r,
			objectKey: e,
			validateSpec: c
		}, r));
	}
	for (let e in i) a[e] || i[e].required && i[e].default === void 0 && r[e] === void 0 && l.push(new t(n, r, `missing required property "${e}"`));
	return l;
}
function wr(e) {
	let n = e.value, r = e.valueSpec, i = e.validateSpec, a = e.style, o = e.styleSpec, s = e.key, c = e.arrayElementValidator || i;
	if (U(n) !== "array") return [new t(s, n, `array expected, ${U(n)} found`)];
	if (r.length && n.length !== r.length) return [new t(s, n, `array length ${r.length} expected, length ${n.length} found`)];
	let l = {
		type: r.value,
		values: r.values
	};
	o.$version < 7 && (l.function = r.function), U(r.value) === "object" && (l = r.value);
	let u = [];
	for (let t = 0; t < n.length; t++) u = u.concat(c({
		array: n,
		arrayIndex: t,
		value: n[t],
		valueSpec: l,
		validateSpec: e.validateSpec,
		style: a,
		styleSpec: o,
		key: `${s}[${t}]`
	}));
	return u;
}
function Tr(e) {
	let n = e.key, r = e.value, i = e.valueSpec, a = U(r);
	return a === "number" && r !== r && (a = "NaN"), a === "number" ? "minimum" in i && r < i.minimum ? [new t(n, r, `${r} is less than the minimum value ${i.minimum}`)] : "maximum" in i && r > i.maximum ? [new t(n, r, `${r} is greater than the maximum value ${i.maximum}`)] : [] : [new t(n, r, `number expected, ${a} found`)];
}
function Er(e) {
	let n = e.valueSpec, r = K(e.value.type), i, a = {}, o, s, c = r !== "categorical" && e.value.property === void 0, l = !c, u = U(e.value.stops) === "array" && U(e.value.stops[0]) === "array" && U(e.value.stops[0][0]) === "object", d = J({
		key: e.key,
		value: e.value,
		valueSpec: e.styleSpec.function,
		validateSpec: e.validateSpec,
		style: e.style,
		styleSpec: e.styleSpec,
		objectElementValidators: {
			stops: f,
			default: h
		}
	});
	return r === "identity" && c && d.push(new t(e.key, e.value, "missing required property \"property\"")), r !== "identity" && !e.value.stops && d.push(new t(e.key, e.value, "missing required property \"stops\"")), r === "exponential" && e.valueSpec.expression && !tr(e.valueSpec) && d.push(new t(e.key, e.value, "exponential functions not supported")), e.styleSpec.$version >= 8 && (l && !$n(e.valueSpec) ? d.push(new t(e.key, e.value, "property functions not supported")) : c && !er(e.valueSpec) && d.push(new t(e.key, e.value, "zoom functions not supported"))), (r === "categorical" || u) && e.value.property === void 0 && d.push(new t(e.key, e.value, "\"property\" property is required")), d;
	function f(e) {
		if (r === "identity") return [new t(e.key, e.value, "identity function may not have a \"stops\" property")];
		let n = [], i = e.value;
		return n = n.concat(wr({
			key: e.key,
			value: i,
			valueSpec: e.valueSpec,
			validateSpec: e.validateSpec,
			style: e.style,
			styleSpec: e.styleSpec,
			arrayElementValidator: p
		})), U(i) === "array" && i.length === 0 && n.push(new t(e.key, i, "array must have at least one stop")), n;
	}
	function p(e) {
		let r = [], i = e.value, c = e.key;
		if (U(i) !== "array") return [new t(c, i, `array expected, ${U(i)} found`)];
		if (i.length !== 2) return [new t(c, i, `array length 2 expected, length ${i.length} found`)];
		if (u) {
			if (U(i[0]) !== "object") return [new t(c, i, `object expected, ${U(i[0])} found`)];
			if (i[0].zoom === void 0) return [new t(c, i, "object stop key must have zoom")];
			if (i[0].value === void 0) return [new t(c, i, "object stop key must have value")];
			if (s && s > K(i[0].zoom)) return [new t(c, i[0].zoom, "stop zoom values must appear in ascending order")];
			K(i[0].zoom) !== s && (s = K(i[0].zoom), o = void 0, a = {}), r = r.concat(J({
				key: `${c}[0]`,
				value: i[0],
				valueSpec: { zoom: {} },
				validateSpec: e.validateSpec,
				style: e.style,
				styleSpec: e.styleSpec,
				objectElementValidators: {
					zoom: Tr,
					value: m
				}
			}));
		} else r = r.concat(m({
			key: `${c}[0]`,
			value: i[0],
			valueSpec: {},
			validateSpec: e.validateSpec,
			style: e.style,
			styleSpec: e.styleSpec
		}, i));
		return ir(q(i[1])) ? r.concat([new t(`${c}[1]`, i[1], "expressions are not allowed in function stops.")]) : r.concat(e.validateSpec({
			key: `${c}[1]`,
			value: i[1],
			valueSpec: n,
			validateSpec: e.validateSpec,
			style: e.style,
			styleSpec: e.styleSpec
		}));
	}
	function m(e, s) {
		let c = U(e.value), l = K(e.value), u = e.value === null ? s : e.value;
		if (!i) i = c;
		else if (c !== i) return [new t(e.key, u, `${c} stop domain type must match previous stop domain type ${i}`)];
		if (c !== "number" && c !== "string" && c !== "boolean") return [new t(e.key, u, "stop domain value must be a number, string, or boolean")];
		if (c !== "number" && r !== "categorical") {
			let i = `number expected, ${c} found`;
			return $n(n) && r === void 0 && (i += "\nIf you intended to use a categorical function, specify `\"type\": \"categorical\"`."), [new t(e.key, u, i)];
		}
		return r === "categorical" && c === "number" && (!isFinite(l) || Math.floor(l) !== l) ? [new t(e.key, u, `integer expected, found ${l}`)] : r !== "categorical" && c === "number" && o !== void 0 && l < o ? [new t(e.key, u, "stop domain values must appear in ascending order")] : (o = l, r === "categorical" && l in a ? [new t(e.key, u, "stop domain values must be unique")] : (a[l] = !0, []));
	}
	function h(e) {
		return e.validateSpec({
			key: e.key,
			value: e.value,
			valueSpec: n,
			validateSpec: e.validateSpec,
			style: e.style,
			styleSpec: e.styleSpec
		});
	}
}
function Y(e) {
	let n = (e.expressionContext === "property" ? sr : W)(q(e.value), e.valueSpec);
	if (n.result === "error") return n.value.map((n) => new t(`${e.key}${n.key}`, e.value, n.message));
	let r = n.value.expression || n.value._styleExpression.expression;
	if (e.expressionContext === "property" && e.propertyKey === "text-font" && !r.outputDefined()) return [new t(e.key, e.value, `Invalid data expression for "${e.propertyKey}". Output values must be contained as literals within the expression.`)];
	if (e.expressionContext === "property" && e.propertyType === "layout" && !Xn(r)) return [new t(e.key, e.value, "\"feature-state\" data expressions are not supported with layout properties.")];
	if (e.expressionContext === "filter" && !Xn(r)) return [new t(e.key, e.value, "\"feature-state\" data expressions are not supported with filters.")];
	if (e.expressionContext && e.expressionContext.indexOf("cluster") === 0) {
		if (!Zn(r, ["zoom", "feature-state"])) return [new t(e.key, e.value, "\"zoom\" and \"feature-state\" expressions are not supported with cluster properties.")];
		if (e.expressionContext === "cluster-initial" && !Yn(r)) return [new t(e.key, e.value, "Feature data expressions are not supported with initial expression part of cluster properties.")];
	}
	return [];
}
function Dr(e) {
	let n = e.value, r = e.key, i = U(n);
	return i === "boolean" ? [] : [new t(r, n, `boolean expected, ${i} found`)];
}
function Or(e) {
	let n = e.key, r = e.value, i = U(r);
	return i === "string" ? w.parse(String(r)) ? [] : [new t(n, r, `color expected, "${r}" found`)] : [new t(n, r, `color expected, ${i} found`)];
}
function kr(e) {
	let n = e.key, r = e.value, i = e.valueSpec, a = [];
	return Array.isArray(i.values) ? i.values.indexOf(K(r)) === -1 && a.push(new t(n, r, `expected one of [${i.values.join(", ")}], ${JSON.stringify(r)} found`)) : Object.keys(i.values).indexOf(K(r)) === -1 && a.push(new t(n, r, `expected one of [${Object.keys(i.values).join(", ")}], ${JSON.stringify(r)} found`)), a;
}
function Ar(e) {
	return fr(q(e.value)) ? Y(n({}, e, {
		expressionContext: "filter",
		valueSpec: { value: "boolean" }
	})) : jr(e);
}
function jr(e) {
	let n = e.value, r = e.key;
	if (U(n) !== "array") return [new t(r, n, `array expected, ${U(n)} found`)];
	let i = e.styleSpec, a, o = [];
	if (n.length < 1) return [new t(r, n, "filter array must have at least 1 element")];
	switch (o = o.concat(kr({
		key: `${r}[0]`,
		value: n[0],
		valueSpec: i.filter_operator,
		style: e.style,
		styleSpec: e.styleSpec
	})), K(n[0])) {
		case "<":
		case "<=":
		case ">":
		case ">=": n.length >= 2 && K(n[1]) === "$type" && o.push(new t(r, n, `"$type" cannot be use with operator "${n[0]}"`));
		case "==":
		case "!=": n.length !== 3 && o.push(new t(r, n, `filter array for operator "${n[0]}" must have 3 elements`));
		case "in":
		case "!in":
			n.length >= 2 && (a = U(n[1]), a !== "string" && o.push(new t(`${r}[1]`, n[1], `string expected, ${a} found`)));
			for (let s = 2; s < n.length; s++) a = U(n[s]), K(n[1]) === "$type" ? o = o.concat(kr({
				key: `${r}[${s}]`,
				value: n[s],
				valueSpec: i.geometry_type,
				style: e.style,
				styleSpec: e.styleSpec
			})) : a !== "string" && a !== "number" && a !== "boolean" && o.push(new t(`${r}[${s}]`, n[s], `string, number, or boolean expected, ${a} found`));
			break;
		case "any":
		case "all":
		case "none":
			for (let t = 1; t < n.length; t++) o = o.concat(jr({
				key: `${r}[${t}]`,
				value: n[t],
				style: e.style,
				styleSpec: e.styleSpec
			}));
			break;
		case "has":
		case "!has":
			a = U(n[1]), n.length === 2 ? a !== "string" && o.push(new t(`${r}[1]`, n[1], `string expected, ${a} found`)) : o.push(new t(r, n, `filter array for "${n[0]}" operator must have 2 elements`));
			break;
	}
	return o;
}
function Mr(e, n) {
	let r = e.key, i = e.validateSpec, a = e.style, o = e.styleSpec, s = e.value, c = e.objectKey, l = o[`${n}_${e.layerType}`];
	if (!l) return [];
	let u = c.match(/^(.*)-transition$/);
	if (n === "paint" && u && l[u[1]] && l[u[1]].transition) return i({
		key: r,
		value: s,
		valueSpec: o.transition,
		style: a,
		styleSpec: o
	});
	let d = e.valueSpec || l[c];
	if (!d) return [new t(r, s, `unknown property "${c}"`)];
	let f;
	if (U(s) === "string" && $n(d) && !d.tokens && (f = /^{([^}]+)}$/.exec(s))) return [new t(r, s, `"${c}" does not support interpolation syntax\nUse an identity property function instead: \`{ "type": "identity", "property": ${JSON.stringify(f[1])} }\`.`)];
	let p = [];
	return e.layerType === "symbol" && c === "text-font" && nr(q(s)) && K(s.type) === "identity" && p.push(new t(r, s, "\"text-font\" does not support identity functions")), p.concat(i({
		key: e.key,
		value: s,
		valueSpec: d,
		style: a,
		styleSpec: o,
		expressionContext: "property",
		propertyType: n,
		propertyKey: c
	}));
}
function Nr(e) {
	return Mr(e, "paint");
}
function Pr(e) {
	return Mr(e, "layout");
}
function Fr(e) {
	let r = [], i = e.value, a = e.key, o = e.style, s = e.styleSpec;
	if (U(i) !== "object") return [new t(a, i, `object expected, ${U(i)} found`)];
	!i.type && !i.ref && r.push(new t(a, i, "either \"type\" or \"ref\" is required"));
	let c = K(i.type), l = K(i.ref);
	if (i.id) {
		let n = K(i.id);
		for (let s = 0; s < e.arrayIndex; s++) {
			let e = o.layers[s];
			K(e.id) === n && r.push(new t(a, i.id, `duplicate layer id "${i.id}", previously used at line ${e.id.__line__}`));
		}
	}
	if ("ref" in i) {
		[
			"type",
			"source",
			"source-layer",
			"filter",
			"layout"
		].forEach((e) => {
			e in i && r.push(new t(a, i[e], `"${e}" is prohibited for ref layers`));
		});
		let e;
		o.layers.forEach((t) => {
			K(t.id) === l && (e = t);
		}), e ? e.ref ? r.push(new t(a, i.ref, "ref cannot reference another ref layer")) : c = K(e.type) : r.push(new t(a, i.ref, `ref layer "${l}" not found`));
	} else if (c !== "background") if (!i.source) r.push(new t(a, i, "missing required property \"source\""));
	else {
		let e = o.sources && o.sources[i.source], n = e && K(e.type);
		e ? n === "vector" && c === "raster" ? r.push(new t(a, i.source, `layer "${i.id}" requires a raster source`)) : n !== "raster-dem" && c === "hillshade" || n !== "raster-dem" && c === "color-relief" ? r.push(new t(a, i.source, `layer "${i.id}" requires a raster-dem source`)) : n === "raster" && c !== "raster" ? r.push(new t(a, i.source, `layer "${i.id}" requires a vector source`)) : n === "vector" && !i["source-layer"] ? r.push(new t(a, i, `layer "${i.id}" must specify a "source-layer"`)) : n === "raster-dem" && c !== "hillshade" && c !== "color-relief" ? r.push(new t(a, i.source, "raster-dem source can only be used with layer type 'hillshade' or 'color-relief'.")) : c === "line" && i.paint && i.paint["line-gradient"] && (n !== "geojson" || !e.lineMetrics) && r.push(new t(a, i, `layer "${i.id}" specifies a line-gradient, which requires a GeoJSON source with \`lineMetrics\` enabled.`)) : r.push(new t(a, i.source, `source "${i.source}" not found`));
	}
	return c === "raster" && i.paint?.resampling && i.paint?.["raster-resampling"] && r.push(new t(a, i.paint, `layer "${i.id}" redundantly specifies "resampling" and "raster-resampling" paint properties, but only one is allowed. It is advised to use "resampling".`)), r = r.concat(J({
		key: a,
		value: i,
		valueSpec: s.layer,
		style: e.style,
		styleSpec: e.styleSpec,
		validateSpec: e.validateSpec,
		objectElementValidators: {
			"*"() {
				return [];
			},
			type() {
				return e.validateSpec({
					key: `${a}.type`,
					value: i.type,
					valueSpec: s.layer.type,
					style: e.style,
					styleSpec: e.styleSpec,
					validateSpec: e.validateSpec,
					object: i,
					objectKey: "type"
				});
			},
			filter: Ar,
			layout(e) {
				return J({
					layer: i,
					key: e.key,
					value: e.value,
					style: e.style,
					styleSpec: e.styleSpec,
					validateSpec: e.validateSpec,
					objectElementValidators: { "*"(e) {
						return Pr(n({ layerType: c }, e));
					} }
				});
			},
			paint(e) {
				return J({
					layer: i,
					key: e.key,
					value: e.value,
					style: e.style,
					styleSpec: e.styleSpec,
					validateSpec: e.validateSpec,
					objectElementValidators: { "*"(e) {
						return Nr(n({ layerType: c }, e));
					} }
				});
			}
		}
	})), r;
}
function X(e) {
	let n = e.value, r = e.key, i = U(n);
	return i === "string" ? [] : [new t(r, n, `string expected, ${i} found`)];
}
function Ir(e) {
	let n = e.sourceName ?? "", r = e.value, i = e.styleSpec, a = i.source_raster_dem, o = e.style, s = [], c = U(r);
	if (r === void 0) return s;
	if (c !== "object") return s.push(new t("source_raster_dem", r, `object expected, ${c} found`)), s;
	let l = K(r.encoding) === "custom", u = [
		"redFactor",
		"greenFactor",
		"blueFactor",
		"baseShift"
	], d = e.value.encoding ? `"${e.value.encoding}"` : "Default";
	for (let c in r) !l && u.includes(c) ? s.push(new t(c, r[c], `In "${n}": "${c}" is only valid when "encoding" is set to "custom". ${d} encoding found`)) : a[c] ? s = s.concat(e.validateSpec({
		key: c,
		value: r[c],
		valueSpec: a[c],
		validateSpec: e.validateSpec,
		style: o,
		styleSpec: i
	})) : s.push(new t(c, r[c], `unknown property "${c}"`));
	return s;
}
var Lr = { promoteId: zr };
function Rr(e) {
	let n = e.value, r = e.key, i = e.styleSpec, a = e.style, o = e.validateSpec;
	if (!n.type) return [new t(r, n, "\"type\" is required")];
	let s = K(n.type), c;
	switch (s) {
		case "vector":
		case "raster": return c = J({
			key: r,
			value: n,
			valueSpec: i[`source_${s.replace("-", "_")}`],
			style: e.style,
			styleSpec: i,
			objectElementValidators: Lr,
			validateSpec: o
		}), c;
		case "raster-dem": return c = Ir({
			sourceName: r,
			value: n,
			style: e.style,
			styleSpec: i,
			validateSpec: o
		}), c;
		case "geojson":
			if (c = J({
				key: r,
				value: n,
				valueSpec: i.source_geojson,
				style: a,
				styleSpec: i,
				validateSpec: o,
				objectElementValidators: Lr
			}), n.cluster) for (let e in n.clusterProperties) {
				let [t, i] = n.clusterProperties[e], a = typeof t == "string" ? [
					t,
					["accumulated"],
					["get", e]
				] : t;
				c.push(...Y({
					key: `${r}.${e}.map`,
					value: i,
					validateSpec: o,
					expressionContext: "cluster-map"
				})), c.push(...Y({
					key: `${r}.${e}.reduce`,
					value: a,
					validateSpec: o,
					expressionContext: "cluster-reduce"
				}));
			}
			return c;
		case "video": return J({
			key: r,
			value: n,
			valueSpec: i.source_video,
			style: a,
			validateSpec: o,
			styleSpec: i
		});
		case "image": return J({
			key: r,
			value: n,
			valueSpec: i.source_image,
			style: a,
			validateSpec: o,
			styleSpec: i
		});
		case "canvas": return [new t(r, null, "Please use runtime APIs to add canvas sources, rather than including them in stylesheets.", "source.canvas")];
		default: return kr({
			key: `${r}.type`,
			value: n.type,
			valueSpec: { values: [
				"vector",
				"raster",
				"raster-dem",
				"geojson",
				"video",
				"image"
			] },
			style: a,
			validateSpec: o,
			styleSpec: i
		});
	}
}
function zr({ key: e, value: t }) {
	if (U(t) === "string") return X({
		key: e,
		value: t
	});
	{
		let n = [];
		for (let r in t) n.push(...X({
			key: `${e}.${r}`,
			value: t[r]
		}));
		return n;
	}
}
function Br(e) {
	let n = e.value, r = e.styleSpec, i = r.light, a = e.style, o = [], s = U(n);
	if (n === void 0) return o;
	if (s !== "object") return o = o.concat([new t("light", n, `object expected, ${s} found`)]), o;
	for (let s in n) {
		let c = s.match(/^(.*)-transition$/);
		o = c && i[c[1]] && i[c[1]].transition ? o.concat(e.validateSpec({
			key: s,
			value: n[s],
			valueSpec: r.transition,
			validateSpec: e.validateSpec,
			style: a,
			styleSpec: r
		})) : i[s] ? o.concat(e.validateSpec({
			key: s,
			value: n[s],
			valueSpec: i[s],
			validateSpec: e.validateSpec,
			style: a,
			styleSpec: r
		})) : o.concat([new t(s, n[s], `unknown property "${s}"`)]);
	}
	return o;
}
function Vr(e) {
	let n = e.value, r = e.styleSpec, i = r.sky, a = e.style, o = U(n);
	if (n === void 0) return [];
	if (o !== "object") return [new t("sky", n, `object expected, ${o} found`)];
	let s = [];
	for (let o in n) s = i[o] ? s.concat(e.validateSpec({
		key: o,
		value: n[o],
		valueSpec: i[o],
		style: a,
		styleSpec: r
	})) : s.concat([new t(o, n[o], `unknown property "${o}"`)]);
	return s;
}
function Hr(e) {
	let n = e.value, r = e.styleSpec, i = r.terrain, a = e.style, o = [], s = U(n);
	if (n === void 0) return o;
	if (s !== "object") return o = o.concat([new t("terrain", n, `object expected, ${s} found`)]), o;
	for (let s in n) o = i[s] ? o.concat(e.validateSpec({
		key: s,
		value: n[s],
		valueSpec: i[s],
		validateSpec: e.validateSpec,
		style: a,
		styleSpec: r
	})) : o.concat([new t(s, n[s], `unknown property "${s}"`)]);
	return o;
}
function Ur(e) {
	return X(e).length === 0 ? [] : Y(e);
}
function Wr(e) {
	return X(e).length === 0 ? [] : Y(e);
}
function Gr(e) {
	let n = e.key, r = e.value;
	if (U(r) === "array") {
		if (r.length < 1 || r.length > 4) return [new t(n, r, `padding requires 1 to 4 values; ${r.length} values found`)];
		let i = { type: "number" }, a = [];
		for (let t = 0; t < r.length; t++) a = a.concat(e.validateSpec({
			key: `${n}[${t}]`,
			value: r[t],
			validateSpec: e.validateSpec,
			valueSpec: i
		}));
		return a;
	} else return Tr({
		key: n,
		value: r,
		valueSpec: {}
	});
}
function Kr(e) {
	let n = e.key, r = e.value;
	if (U(r) === "array") {
		let i = { type: "number" };
		if (r.length < 1) return [new t(n, r, "array length at least 1 expected, length 0 found")];
		let a = [];
		for (let t = 0; t < r.length; t++) a = a.concat(e.validateSpec({
			key: `${n}[${t}]`,
			value: r[t],
			validateSpec: e.validateSpec,
			valueSpec: i
		}));
		return a;
	} else return Tr({
		key: n,
		value: r,
		valueSpec: {}
	});
}
function qr(e) {
	let n = e.key, r = e.value;
	if (U(r) === "array") {
		if (r.length < 1) return [new t(n, r, "array length at least 1 expected, length 0 found")];
		let e = [];
		for (let t = 0; t < r.length; t++) e = e.concat(Or({
			key: `${n}[${t}]`,
			value: r[t],
			valueSpec: {}
		}));
		return e;
	} else return Or({
		key: n,
		value: r,
		valueSpec: {}
	});
}
function Jr(e) {
	let n = e.key, r = e.value, i = U(r), a = e.styleSpec;
	if (i !== "array" || r.length < 1 || r.length % 2 != 0) return [new t(n, r, "variableAnchorOffsetCollection requires a non-empty array of even length")];
	let o = [];
	for (let t = 0; t < r.length; t += 2) o = o.concat(kr({
		key: `${n}[${t}]`,
		value: r[t],
		valueSpec: a.layout_symbol["text-anchor"]
	})), o = o.concat(wr({
		key: `${n}[${t + 1}]`,
		value: r[t + 1],
		valueSpec: {
			length: 2,
			value: "number"
		},
		validateSpec: e.validateSpec,
		style: e.style,
		styleSpec: a
	}));
	return o;
}
function Yr(e) {
	let n = [], r = e.value, i = e.key;
	if (Array.isArray(r)) {
		let a = [], o = [];
		for (let s in r) r[s].id && a.includes(r[s].id) && n.push(new t(i, r, `all the sprites' ids must be unique, but ${r[s].id} is duplicated`)), a.push(r[s].id), r[s].url && o.includes(r[s].url) && n.push(new t(i, r, `all the sprites' URLs must be unique, but ${r[s].url} is duplicated`)), o.push(r[s].url), n = n.concat(J({
			key: `${i}[${s}]`,
			value: r[s],
			valueSpec: {
				id: {
					type: "string",
					required: !0
				},
				url: {
					type: "string",
					required: !0
				}
			},
			validateSpec: e.validateSpec
		}));
		return n;
	} else return X({
		key: i,
		value: r
	});
}
function Xr(e) {
	let n = e.value, r = e.styleSpec, i = r.projection, a = e.style, o = U(n);
	if (n === void 0) return [];
	if (o !== "object") return [new t("projection", n, `object expected, ${o} found`)];
	let s = [];
	for (let o in n) s = i[o] ? s.concat(e.validateSpec({
		key: o,
		value: n[o],
		valueSpec: i[o],
		style: a,
		styleSpec: r
	})) : s.concat([new t(o, n[o], `unknown property "${o}"`)]);
	return s;
}
function Zr(e) {
	let n = e.key, r = e.value;
	r = r instanceof String ? r.valueOf() : r;
	let i = U(r);
	return i === "array" && !$r(r) && !Qr(r) ? [new t(n, r, `projection expected, invalid array ${JSON.stringify(r)} found`)] : ["array", "string"].includes(i) ? [] : [new t(n, r, `projection expected, invalid type "${i}" found`)];
}
function Qr(e) {
	return !![
		"interpolate",
		"step",
		"literal"
	].includes(e[0]);
}
function $r(e) {
	return Array.isArray(e) && e.length === 3 && typeof e[0] == "string" && typeof e[1] == "string" && typeof e[2] == "number";
}
function ei(e) {
	return !!e && e.constructor === Object;
}
function ti(e) {
	return ei(e.value) ? [] : [new t(e.key, e.value, `object expected, ${U(e.value)} found`)];
}
function ni(e) {
	let n = e.key, r = e.value, i = e.validateSpec, a = e.styleSpec, o = e.style;
	if (!ei(r)) return [new t(n, r, `object expected, ${U(r)} found`)];
	let s = [];
	for (let e in r) {
		let c = r[e], l = U(c);
		if (l === "string") s.push(...X({
			key: `${n}.${e}`,
			value: c
		}));
		else if (l === "array") {
			let t = {
				url: {
					type: "string",
					required: !0
				},
				"unicode-range": {
					type: "array",
					value: "string"
				}
			};
			for (let [r, l] of c.entries()) s.push(...J({
				key: `${n}.${e}[${r}]`,
				value: l,
				valueSpec: t,
				styleSpec: a,
				style: o,
				validateSpec: i
			}));
		} else s.push(new t(`${n}.${e}`, c, `string or array expected, ${l} found`));
	}
	return s;
}
var ri = {
	"*"() {
		return [];
	},
	array: wr,
	boolean: Dr,
	number: Tr,
	color: Or,
	constants: Cr,
	enum: kr,
	filter: Ar,
	function: Er,
	layer: Fr,
	object: J,
	source: Rr,
	light: Br,
	sky: Vr,
	terrain: Hr,
	projection: Xr,
	projectionDefinition: Zr,
	string: X,
	formatted: Ur,
	resolvedImage: Wr,
	padding: Gr,
	numberArray: Kr,
	colorArray: qr,
	variableAnchorOffsetCollection: Jr,
	sprite: Yr,
	state: ti,
	fontFaces: ni
};
function ii(e) {
	let t = e.value, r = e.valueSpec, i = e.styleSpec;
	return e.validateSpec = ii, r.expression && nr(K(t)) ? Er(e) : r.expression && ir(q(t)) ? Y(e) : r.type && ri[r.type] ? ri[r.type](e) : J(n({}, e, { valueSpec: r.type ? i[r.type] : r }));
}
function ai(e) {
	let n = e.value, r = e.key, i = X(e);
	return i.length ? i : (n.indexOf("{fontstack}") === -1 && i.push(new t(r, n, "\"glyphs\" url must include a \"{fontstack}\" token")), n.indexOf("{range}") === -1 && i.push(new t(r, n, "\"glyphs\" url must include a \"{range}\" token")), i);
}
function Z(t, n = e) {
	let r = [];
	return r = r.concat(ii({
		key: "",
		value: t,
		valueSpec: n.$root,
		styleSpec: n,
		style: t,
		validateSpec: ii,
		objectElementValidators: {
			glyphs: ai,
			"*"() {
				return [];
			}
		}
	})), t.constants && (r = r.concat(Cr({
		key: "constants",
		value: t.constants,
		style: t,
		styleSpec: n,
		validateSpec: ii
	}))), oi(r);
}
Z.source = $(Q(Rr)), Z.sprite = $(Q(Yr)), Z.glyphs = $(Q(ai)), Z.light = $(Q(Br)), Z.sky = $(Q(Vr)), Z.terrain = $(Q(Hr)), Z.state = $(Q(ti)), Z.layer = $(Q(Fr)), Z.filter = $(Q(Ar)), Z.paintProperty = $(Q(Nr)), Z.layoutProperty = $(Q(Pr));
function Q(e) {
	return function(t) {
		return e(Object.assign({}, t, { validateSpec: ii }));
	};
}
function oi(e) {
	return [].concat(e).sort((e, t) => e.line - t.line);
}
function $(e) {
	return function(...t) {
		return oi(e.apply(this, t));
	};
}
//#endregion
//#region src/utils/maplibre-expression-evaluator.ts
function si(e) {
	return {
		type: Si(e.geometry?.type),
		id: e.id,
		properties: e.properties ?? {}
	};
}
var ci = {
	type: "color",
	"property-type": "data-driven",
	transition: !1,
	overridable: !1,
	expression: {
		interpolated: !0,
		parameters: ["zoom", "feature"]
	}
}, li = {
	type: "number",
	"property-type": "data-driven",
	transition: !1,
	overridable: !1,
	expression: {
		interpolated: !0,
		parameters: ["zoom", "feature"]
	}
}, ui = {
	type: "boolean",
	"property-type": "data-driven",
	transition: !1,
	overridable: !1,
	expression: {
		interpolated: !1,
		parameters: ["zoom", "feature"]
	}
}, di = {
	type: "string",
	"property-type": "data-driven",
	transition: !1,
	overridable: !1,
	expression: {
		interpolated: !1,
		parameters: ["zoom", "feature"]
	}
}, fi = /* @__PURE__ */ new WeakMap(), pi = /* @__PURE__ */ new WeakMap(), mi = /* @__PURE__ */ new WeakMap(), hi = /* @__PURE__ */ new WeakMap(), gi = /* @__PURE__ */ new WeakMap();
function _i(e, t, n, r) {
	if (typeof e == "string") return e;
	if (!Array.isArray(e)) return r;
	let i = fi.get(e);
	if (i || (i = W(e, ci), fi.set(e, i)), i.result !== "success") return r;
	try {
		let e = console.warn;
		console.warn = () => {};
		let a;
		try {
			a = i.value.evaluate({ zoom: n }, si(t));
		} finally {
			console.warn = e;
		}
		let o = a?.toString?.() ?? r;
		return o && o !== "null" ? o : r;
	} catch {
		return r;
	}
}
function vi(e, t, n, r) {
	if (typeof e == "number") return e;
	if (!Array.isArray(e)) return r;
	let i = pi.get(e);
	if (i || (i = W(e, li), pi.set(e, i)), i.result !== "success") return r;
	try {
		let e = i.value.evaluate({ zoom: n }, si(t));
		return typeof e == "number" && Number.isFinite(e) ? e : r;
	} catch {
		return r;
	}
}
function yi(e, t, n, r) {
	if (typeof e == "boolean") return e;
	if (!Array.isArray(e)) return r;
	let i = mi.get(e);
	if (i || (i = W(e, ui), mi.set(e, i)), i.result !== "success") return r;
	try {
		return !!i.value.evaluate({ zoom: n }, si(t));
	} catch {
		return r;
	}
}
function bi(e, t) {
	return e.replace(/\{([^{}]+)\}/g, (e, n) => {
		let r = t.properties?.[n];
		return r == null ? "" : String(r);
	});
}
function xi(e, t, n, r) {
	if (typeof e == "string") return /\{[^{}]+\}/.test(e) ? bi(e, t) : e;
	if (!Array.isArray(e)) return r;
	let i = hi.get(e);
	if (i || (i = W(e, di), hi.set(e, i)), i.result !== "success") return r;
	try {
		let e = i.value.evaluate({ zoom: n }, si(t));
		return e == null ? r : String(e);
	} catch {
		return r;
	}
}
function Si(e = "Point") {
	switch (e) {
		case "MultiPoint": return "Point";
		case "MultiLineString": return "LineString";
		case "MultiPolygon": return "Polygon";
		case "Point":
		case "LineString":
		case "Polygon":
		case "Unknown": return e;
		default: return "Unknown";
	}
}
function Ci(e, t, n = 0) {
	if (!e || !Array.isArray(e)) return !0;
	try {
		let r = gi.get(e);
		r || (r = mr(e), gi.set(e, r));
		let i = {
			type: Si(t.geometry?.type),
			id: t.id,
			properties: t.properties ?? {}
		};
		return r.filter({ zoom: n }, i);
	} catch {
		return yi(e, t, n, !0);
	}
}
//#endregion
//#region src/utils/reduced-motion.ts
function wi() {
	return typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
//#endregion
//#region src/map/marker-utils.ts
function Ti(e = "#e63946") {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
  <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z" fill="${e}" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>
  <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
</svg>`;
}
function Ei(e = "#e63946") {
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(Ti(e))}`;
}
//#endregion
export { vi as a, _i as i, Ti as n, xi as o, wi as r, Ci as s, Ei as t };
