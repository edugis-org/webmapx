# Changelog
All notable changes to this project will be documented here.

## [Unreleased]

### Added
- **Menu tool (`type: "menu"`)** — container tool showing its sub-tools as a labelled, drill-in list with submenus, back button, breadcrumb and cross-level search. Keyboard navigable per the ARIA menu pattern (roving tabindex, arrows, Home/End, ←/→ to walk submenus). Alternative to the toolbox's icon row; configurable in the visual builder (`testpages/setup.html`). See [`webmapx-menu-tool`](docs/user/components/webmapx-menu-tool.md).

### Fixed
- **Modal dialogs are usable when webmapx is embedded in a host page's own modal `<dialog>`.** Layer info, permalink, save layers, draw layer and clear layers used to reparent themselves to `document.body` on open, to escape the containing block an ancestor's `backdrop-filter` creates for `position: fixed`. On a page whose own modal dialog was open, that put them outside it — where everything is inert — so they rendered behind it and could not be clicked, close button included. They now stay where they are in the DOM and rise into the top layer via a native `<dialog>` opened with `showModal()` (`src/components/internal/top-layer-dialog.ts`): top-layer elements ignore an ancestor's `backdrop-filter`, `transform` and `overflow`, and modals stack in open order, so no reparenting and no z-index. `testpages/embedded-in-modal.html` reproduces the case. `webmapx-layer-style-dialog` takes the modeless route to the same place: `popover`, plus a move to the map element so that closing the legend it was opened from no longer leaves it open-but-unrendered. It stays out of `showModal()`, which would make the map it is styling inert.
- Sub-tool containers nested inside another container are no longer dropped when building the layout — `dynamic-layout.ts` now builds sub-tools recursively.
- Modal tools nested in a container (draw, measure, info, …) no longer register with the global `ToolManager`, which previously deactivated them behind the container's back.

### Changed
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
