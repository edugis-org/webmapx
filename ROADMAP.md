# Roadmap

> Architecture rules live in [`docs/DEVELOPER_GUIDE.md#i-architecture-rules`](./docs/DEVELOPER_GUIDE.md#i-architecture-rules).

## Guardrails
- Tools never import MapLibre/OL/Leaflet directly
- Adapter only translates events and delegates to map library
- Keep interfaces in `src/map/IMapInterfaces.ts` authoritative
- Throttling decisions belong in tools, not adapter

## Milestones
- M1: ~~Adapter architecture~~ (done 2025-12-14)
- M2: ~~Multi-library support~~ (done 2025-12-24 — MapLibre, OpenLayers, Leaflet, Cesium)
- M3: Layer management, draw tools, selection tools
- M4: Accessibility checks, performance optimization

## Completed

### 2026 Q1–Q2
- [x] Cross-engine marker API
- [x] Info tool (cross-engine)
- [x] Fix layer ordering for custom layers after background switches (OL, Leaflet)
- [x] Fix Allmaps layer-order persistence in Leaflet
- [x] Move shared engine helper code to `src/utils/`
- [x] Attribution tool
- [x] Layer tree refactor (remove tree deps, add tests)
- [x] Single/exclusive background-group policy
- [x] Geolocation tool (all engines)
- [x] Search tool

### 2025 Q4
- [x] Leaflet adapter (`2025-12-23`)
- [x] Cesium adapter (`2025-12-24`)
- [x] Allmaps WarpedMapLayer support (MapLibre, OpenLayers, Leaflet)
- [x] Measure tool (cross-engine, including Leaflet)
- [x] WMS layer support in OpenLayers
- [x] Config-driven layer tree and background layers
- [x] `IMapFactory` / `ISubMapFactory` OOP API
- [x] OpenLayers adapter (`2025-12-14`)
- [x] Refactor `webmapx-inset-map` — all logic in tool
- [x] Remove adapter controllers (InsetController, PointerController)

## Near-Term Tasks
- [ ] Refactor remaining tools to follow new architecture pattern
- [ ] Accessibility checks

## Plugin Support

Goal: allow external packages to extend WebMapX without forking — custom tools and engine overrides as npm packages.

### Done
- [x] Export public API surface (`src/index.ts`) — base classes, interfaces, events, config types, adapter registry
- [x] CSS custom property audit — `--webmapx-*` vars on all major components (coordinates, zoom, navigation, scale, search, legend, layer-tree, toolbar, tool-panel, inset-map, layout)
- [x] Named slots — `before`/`after` on toolbar; `header`/`footer` on tool-panel
- [x] Config-driven tool injection — `element` field in `ToolConfig`; `<webmapx-plugin-tool tool-id="...">` instantiates plugin element from config

- [x] Plugin authoring guide — [`docs/developer/plugin-authoring.md`](./docs/developer/plugin-authoring.md)

## Planned Features

### Layer Management
- [ ] Layer legends
- [ ] Layer style update tool (runtime paint/layout changes)
- [ ] Layer transparency tool
- [ ] Drop GeoJSON on map (drag-and-drop file import)
- [ ] Save layer as (export to file)
- [ ] Layer filter tool

### Data Formats
- [ ] PMTiles support
- [ ] GeoBuffer (geobuf) support
- [ ] 3D Tiles support

### Drawing & Editing
- [ ] Draw tool (point, line, polygon)

### Geoprocessing Tools
- [ ] Buffer tool
- [ ] Merge tool
- [ ] Overlay tool (union, intersection, difference)
- [ ] Routing tool

### Visualization & View
- [ ] Projection tool (CRS switching)
- [ ] 3D tool (tilt, terrain, camera controls — Cesium + MapLibre GL)

### Internationalization (i18n)
- [ ] i18n support — translatable UI strings in all built-in components
- [ ] Language switcher tool — change UI locale and map label language (vector tile name fields) at runtime

### And more…
