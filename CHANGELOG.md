# Changelog
All notable changes to this project will be documented here.

## [Unreleased]

### Added
- **`metadata.queryable: false` keeps a layer out of the info tool.** One switch for every layer type and every engine — vector tiles, GeoJSON, WMS, composite styles — with absent meaning yes. It exists because "what is here?" has two different wrong answers: a basemap composite returns a dozen sublayers (landcover, water, every label) and buries the answer the click was about, and a WMS layer that cannot answer still costs a GetFeatureInfo request per click. `layer-discovery` now records `queryable: false` when a capabilities document says the layer is not queryable, so no request is sent to find that out again, and a config can set the flag on any layer — a server being willing to answer is not the same as the answer being wanted on this map. The filtering is one generic step in `DeferredQueryService`, narrowing the `layerIds` allowlist every engine's query service already honours: the vector hit test is a single native call that is filtered afterwards, while WMS layers are filtered *before* they are fetched, so a layer turned off costs no request. Feature info only — analysis still reads a layer's data through `queryLayerFeatures`, since a basemap nobody may click is still a layer to clip against. Measured on one click over a composite basemap, a WMS layer and a GeoJSON layer: 20 features and one GetFeatureInfo request became 1 feature and none.
- **Compare tool (`type: "compare"`)** — a vertical handle across the map: left of it the map as it was when the comparison started, right of it the map as you keep changing it. One camera, so every difference is a difference in content. Built as two overlaid `<webmapx-map>` elements with the upper one `clip-path`-clipped, which works on all four engines; the frozen half is reproduced by replaying the live map's clocks, layer requests, source data and `store.mapLayers` rather than by serialising a config, so paint survives. An open comparison is shareable through the permalink (`cmp=<percent>` plus the second map's ordinary `s.1` state).
- **Menu tool (`type: "menu"`)** — container tool showing its sub-tools as a labelled, drill-in list with submenus, back button, breadcrumb and cross-level search. Keyboard navigable per the ARIA menu pattern (roving tabindex, arrows, Home/End, ←/→ to walk submenus). Alternative to the toolbox's icon row; configurable in the visual builder (`testpages/setup.html`). See [`webmapx-menu-tool`](docs/user/components/webmapx-menu-tool.md).

### Fixed
- **Every worker loads again when webmapx is not served from the site root.** The library build emitted `new Worker(new URL("/assets/…", import.meta.url))` — a root-absolute path, which ignores where `dist-lib` actually sits. On webmapx.com the file is served from `/dist-lib/assets/` and the request went to `/assets/`, a 404; on a CDN it is further away still. A Worker built from a 404 page dies at once with an *empty* error event, so the spatial worker reported "the spatial worker crashed. Try again with fewer features" — a message pointing at GDAL and the size of the data, a mile from the cause. Dropping a 2.4 MB GeoPackage of 1798 NUTS regions failed for this reason while the same file converted in 0.7 s in Node. All three workers (spatial, shapefile, EPSG lookup) were affected, and with them every GDAL-backed feature for anyone whose `dist-lib` is not at the origin root. Fixed with `base: './'`, and a build plugin now fails the build if a root-absolute asset URL reappears.
- **The style panel counts an attribute's distinct values over every feature.** It read the first 200, which for a file sorted by region id is a faithful account of the first tenth and a wrong account of the file: 1798 NUTS regions carrying 39 country codes were reported as 8, because the first 200 features are AL, AT, BE, BG, CH, CY, CZ and DE. The count is not cosmetic — it decides whether a column is offered for colouring at all and whether it is dismissed as a key. Type inference still reads a bounded sample, since a hundred thousand values prove nothing the first hundred did not. The two copies of this code (`webmapx-layer-overview`, `webmapx-layer-legend3d`) are now one `collectAttributeInfo` in `utils/attribute-info.ts`.
- **An outline colour in the legend's style editor is drawn as a line.** The fill and outline rows both rendered a filled block, so two identical swatches sat side by side saying nothing about which was which. An outline row now draws its colour as a bar across the middle of the swatch.
- **A layer with no paint is drawn in the same colour by every engine and by the legend.** A layer definition may carry no `paint` at all — which is exactly what a catalog that only knows the service produces, such as a harvested WFS layer (`{ type: 'fill', source, metadata }` and nothing more). Each engine then answered with its own default: MapLibre follows the style spec (`fill-color` `#000000`, opaque), while this codebase's Leaflet and Cesium factories fall back to `#3388ff`, as does the legend. So the same layer came out solid black on the map while its legend swatch showed blue, and two halves of one screen disagreed about its colour. `withDefaultPaint` (`src/map/default-paint.ts`) now fills the paint in once, in `BaseAdapter.addLayer`, before any engine sees it. Only a wholly absent paint is filled in: a layer that sets one property and leaves the rest to the spec means that.
- **The colour picker works inside a host page's modal `<dialog>`.** Pickr builds its popup on `document.body`, so a map embedded in someone else's modal dialog — a layer repository's preview — got a popup outside that dialog, and everything outside a modal dialog is inert. The top layer does not exempt it: inertness follows the DOM, not the paint order. The pointer fell straight through to the map canvas (measured: `elementFromPoint` over the picker returned the MapLibre canvas), Pickr's own outside-click handler then saw a path without its popup in it, and clicking anywhere on the picker closed it without changing the colour. The popup is now re-parented into the enclosing modal dialog, which makes it live again. Only a dialog in the light DOM is used, since the nano theme is a document stylesheet and the popup would come out unstyled inside a shadow root.
- **The colour picker opens above the panel that opened it.** Pickr renders its popup into `document.body` with a z-index, and the panels that open it are in the browser's top layer — the style panel is a popover, the layer dialogs are modal `<dialog>`s — so the popup was painted underneath, appearing below the map. It is now a `popover` of its own: top-layer elements stack in the order they are shown, so one opened from a panel lands on top of it. Its placement comes with that (a popover is positioned against the viewport, not the document), so Pickr's `autoReposition` is off and the popup is put beside its swatch, flipping above when there is no room below. Browsers without popover support keep the old behaviour. Both callers are covered: the styling panel and the legend's inline editor. The UA stylesheet's popover chrome — `border: solid`, `padding`, `overflow: auto`, none of which the nano theme overrides — is undone so the panel keeps its own background and box shadow rather than gaining a black frame.
- **ArcGIS Server layers answer the info tool.** ESRI's `FeatureInfoResponse` carries its values as attributes of a self-closing `<FIELDS GEOID="47143" NAME="Rhea County" .../>` element, and `parseGMLResponse` only walked child elements — of which a self-closing element has none — so a queryable ArcGIS layer returned nothing at all, silently. Attributes are now read alongside child elements. ArcGIS ignores `INFO_FORMAT=application/json` and answers this XML whatever is asked of it, so there was no JSON path that would have worked instead. Seen on the US Census TIGERweb Counties layer.
- **Modal dialogs are usable when webmapx is embedded in a host page's own modal `<dialog>`.** Layer info, permalink, save layers, draw layer and clear layers used to reparent themselves to `document.body` on open, to escape the containing block an ancestor's `backdrop-filter` creates for `position: fixed`. On a page whose own modal dialog was open, that put them outside it — where everything is inert — so they rendered behind it and could not be clicked, close button included. They now stay where they are in the DOM and rise into the top layer via a native `<dialog>` opened with `showModal()` (`src/components/internal/top-layer-dialog.ts`): top-layer elements ignore an ancestor's `backdrop-filter`, `transform` and `overflow`, and modals stack in open order, so no reparenting and no z-index. `testpages/embedded-in-modal.html` reproduces the case. `webmapx-layer-style-dialog` takes the modeless route to the same place: `popover`, plus a move to the map element so that closing the legend it was opened from no longer leaves it open-but-unrendered. It stays out of `showModal()`, which would make the map it is styling inert.
- Sub-tool containers nested inside another container are no longer dropped when building the layout — `dynamic-layout.ts` now builds sub-tools recursively.
- Modal tools nested in a container (draw, measure, info, …) no longer register with the global `ToolManager`, which previously deactivated them behind the container's back.

### Changed
- **"Give every value a colour" is on by default** when a categorical field has more values than classes. Showing every area beats showing a fraction of them: 39 country codes over 1798 regions came out as 8 colours and a grey remainder. The cost — a colour no longer names one value, and so there is no legend — is stated under the checkbox and reversed in one click, whereas a map that quietly drew most of its data in one grey announces nothing.
- **The `flow` cartogram method no longer projects anything itself.** `@edugis/cartogram@0.1.3` bounds its own output and picks Equal Earth for world-scale data, so the projection to Equal Earth, the shrink-to-fit and the unprojection this file used to do around it all came out — with them the `plane` option and this file's only use of proj4. Measured on 177 world countries by population, ground-area error against value is 0.440% through the library on its own against 0.447% through the old route, so nothing was given up for it.

---

## [2026 Q1–Q2] - Marker API, Info Tool, Layer Order Fixes

### Added
- **Cross-engine marker API** — create/remove markers via unified interface across all engines
- **Info tool** — click-to-inspect feature info, works on all engines
- **Geolocation tool** — position circle on all engines (MapLibre, OpenLayers, Leaflet, Cesium)
- **Search tool**
- **Attribution tool**

### Fixed
- Layer ordering for custom layers after background switches (OpenLayers, Leaflet)
- Allmaps layer-order persistence in Leaflet
- TSC warnings

### Changed
- Moved duplicate engine helper code to `src/utils/` shared modules
- Layer tree refactored: removed tree-library dependency, added tests
- Background group policy split into `single` / `exclusive` modes

---

## [2025-12-28] - Search & Geolocation Tools

### Added
- `webmapx-search` tool
- `webmapx-geolocation` tool

---

## [2025-12-24] - Cesium Adapter & Allmaps

### Added
- **Cesium adapter** — 3D globe engine support (`adapter="cesium"`)
- Allmaps WarpedMapLayer: lazy-loaded, integrated with MapLibre, OpenLayers, and Leaflet
- Measure tool support for Leaflet
- Config and favicon bundled into build output

---

## [2025-12-23] - Leaflet Adapter

### Added
- **Leaflet adapter** — full Leaflet support (`adapter="leaflet"`, `adapter="l"`)
  - `src/map/leaflet-adapter.ts`
  - `src/map/leaflet-services/MapCoreService.ts`
  - `src/map/leaflet-services/MapFactoryService.ts`
- Allmaps Amsterdam demo layer

---

## [2025-12-22] - Measure Tool

### Added
- Measure tool (distance/area) with cross-engine abstract calls
- Auto-scroll measurements into view
- Documentation for measure tool

---

## [2025-12-19] - WMS & Layer Config

### Added
- WMS layer implementation for OpenLayers
- WMS URL builder utility
- `style` property support in layer config

### Changed
- Layers config brought closer to Mapbox/MapLibre spec
- Config refactor: tools, layers, roles restructured

---

## [2025-12-14] - OpenLayers Support & Adapter Switcher

### Added
- **OpenLayers adapter** - Full OpenLayers support as an alternative to MapLibre GL
  - `src/map/openlayers-adapter.ts` - Main adapter composing OL services
  - `src/map/openlayers-services/MapCoreService.ts` - Core map functionality
  - `src/map/openlayers-services/MapFactoryService.ts` - IMap/ISource/ILayer implementations
  - `src/map/openlayers-services/MapServiceTemplate.ts` - Tool service template
- **Adapter switcher in Settings tool** - UI to switch between MapLibre and OpenLayers at runtime
  - Preserves viewport state (center, zoom) when switching
  - Stores adapter preference in localStorage
- **Zoom level normalization** - Consistent zoom levels between MapLibre (512px tiles) and OpenLayers (256px tiles)
  - Added `ZOOM_OFFSET = 1` constant to compensate for tile size difference
  - Switching adapters now shows the same geographic extent

### Changed
- `webmapx-map` now reads adapter preference from localStorage (priority: localStorage > attribute > default)
- `webmapx-settings` includes "Map Engine" dropdown with available adapters
- `adapter-registry.ts` registers OpenLayers under both `'openlayers'` and `'ol'` aliases

### Technical Notes
- MapLibre uses 512px tiles, OpenLayers/OSM uses 256px tiles
- This causes a 1-level zoom offset: OL zoom 5 ≈ MapLibre zoom 4
- The adapter normalizes this internally so tools see consistent "logical" zoom levels

---

## [2025-12-14] - Architecture Refactoring

### Added
- `IMapFactory` interface for creating map instances via OOP API
- `IMap` interface with methods: `setViewport`, `createSource`, `getSource`, `createLayer`, `getLayer`, `onReady`, `destroy`
- `ISource` interface with `id` property and `setData` method
- `ILayer` interface with `id` property, `getSource`, and `remove` methods
- `MapCreateOptions`, `LayerSpec`, `FillPaint`, `LinePaint` types in `IMapInterfaces.ts`
- `MapLibreMap`, `MapLibreLayer`, `MapLibreSource` implementations in `MapFactoryService.ts`
- Consumer-side throttling in `webmapx-inset-map` tool

### Changed
- **Architecture:** Adapter is now thin wrapper only, tools contain all composite logic
- `IMapAdapter` now exposes `mapFactory: IMapFactory` instead of `inset: IInsetController`
- `MapCoreService` now handles all event normalization (view + pointer events)
- Removed throttling from adapter layer - consumers decide rate-limiting
- Refactored `webmapx-inset-map` to use new architecture:
  - Tool creates map via `adapter.mapFactory.createMap()`
  - Tool creates sources/layers via `map.createSource()` and `map.createLayer()`
  - Tool manages its own throttling
  - Tool contains all zoom/scale calculation logic

### Removed
- `IInsetController` interface from `IMapAdapter`
- `MapInsetController.ts` - logic moved to `webmapx-inset-map` tool
- `MapPointerController.ts` - merged into `MapCoreService`
- `MapRegistry.ts` - no longer needed with OOP API
- `GeoJSONSourceService.ts` - consolidated into `IMap.createSource`
- `LayerService.ts` - consolidated into `IMap.createLayer`
- `IGeoJSONSourceService` and `ILayerService` interfaces
- Throttling from `MapCoreService` (moved to consumers)

## [Unreleased]

## [2025-12-06]
### Added
- `ROADMAP.md` to outline goals and milestones.
- `DEV_JOURNAL.md` to track session context and decisions.
 - Mermaid architecture diagram and legend in `docs/DEVELOPER_GUIDE.md`.

### Changed
- Exposed `zoomController` via adapter and bound to core internally; removed unsafe casts.
- `IMapCore.initialize` accepts `{ center, zoom, styleUrl }`; `src/app.js` configures OSM demo style and non-default viewport.
