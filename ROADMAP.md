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

### 2026 Q3
- [x] Menu tool (`type: "menu"`) — drill-in list container with submenus, breadcrumb and cross-level search; sub-tool containers now nest to any depth
- [x] Stories tool — guided tours with per-step camera/layer state, HTML content, per-story panel width
- [x] Visual story builder in `testpages/setup.html`
- [x] `BaseAdapter` — generic adapter behaviour (camera pass-throughs, store mirroring for visibility/opacity/terrain/projection) hoisted out of the four engine adapters
- [x] Buffer, routing and isochrone tools
- [x] Print map (A4 PDF)
- [x] Fully lazy tool loading (`tool-loader.ts`, `extractToolIds`)
- [x] Config setup page (`testpages/setup.html`) — tools, layers, map tabs, live preview, publish to GitHub

### 2026 Q2
- [x] Permalink — shareable URL encoding map state (layers, viewport, transparency, projection) with multi-map support via DOM index (`?s=`, `?s.1=`, `?config=`, `?config.1=`)
- [x] Map state moved to `IMapState` — `mapBearing`, `mapPitch`, layer `visible` and `transparency` now in store; base-adapter publishes bearing/pitch from `view-change-end` event
- [x] Draw tool (point, line, polygon — all engines)
- [x] Globe / projection tool (CRS switching, globe sky, MapLibre globe projection)
- [x] TrueArea tool (drag polygons for size comparison, TopoJSON/GeoJSON auto-detection)
- [x] Hillshade layer + 3D terrain toggle (MapLibre)
- [x] Layer drag reorder (legend drag-to-reorder with drop indicator)
- [x] Layer style editor (inline vector paint editor with color picker, symbol text/halo)
- [x] Layer legends (vector legend with style groups, zoom-range hints)
- [x] Save layer(s) dialog (export to file — GeoJSON/zip with style)
- [x] Zoom to layer extent
- [x] Add layer from URL (WMS/WMTS/WFS/Esri/ArcGIS/MVT discovery)
- [x] Layer search in layer tree
- [x] Language switcher tool (OSM vector label language at runtime)
- [x] Fullscreen toggle control
- [x] Layer style source inspection dialog
- [x] Map state persistence (MapLibre GL v5 upgrade)
- [x] Catalog decoupling — engines no longer aware of catalog; sources inlined before engine sees spec
- [x] `mapLayers` as sole authoritative layer state (removed redundant `visibleLayers`)
- [x] Refactor remaining tools to follow new architecture pattern
- [x] Accessibility — see Accessibility section in Planned Features

### 2026 Q1
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

### Tool UX Modes

Proposal: unified `uiMode` for all tools — `"control"` (always on map), `"panel"` (button + panel), `"headless"` (behavior only) — plus a `default` block for settings applied before user interaction. See [`docs/developer/tool-ux-modes-proposal.md`](./docs/developer/tool-ux-modes-proposal.md).

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
- [x] Layer legends
- [x] Layer drag reorder (drag-and-drop in layer tree)
- [x] Layer style update tool (runtime paint/layout changes)
- [x] Save layer as (export to file)
- [x] File import (drag-and-drop or file picker — GeoJSON, GPX, KML, KMZ, CSV, shapefile ZIP with QML style)
- [ ] Layer filter tool

### Data Formats
- [ ] PMTiles support
- [ ] GeoBuffer (geobuf) support
- [ ] 3D Tiles support

### Drawing & Editing
- [x] Draw tool (point, line, polygon)

### Geoprocessing Tools
- [x] Buffer tool
- [x] Routing tool
- [x] Isochrone tool
- [ ] Merge tool
- [ ] Overlay tool (union, intersection, difference)

### Visualization & View
- [x] Projection tool (CRS switching)
- [x] Globe view (MapLibre globe projection + sky layer)
- [x] TrueArea tool (drag-to-compare polygon sizes)
- [x] Zoom to layer extent
- [x] 3D terrain + hillshade (MapLibre GL)
- [x] Fullscreen toggle
- [ ] Home button (zoom to initial map extent)
- [x] 3D tool (tilt, camera controls — Cesium + MapLibre GL)
- [x] Layer transparency tool
- [x] Print map (A4 PDF via browser print; MapLibre offscreen render, CSS-transform for OL/Leaflet/Cesium; legend, attribution, title, viewer link)

### Tool Organization
- [x] Toolbox container — scrolling icon row of sub-tools
- [x] Menu container — drill-in list with submenus, breadcrumb, cross-level search
- [ ] Recursive submenu editing in the config setup page (only the top level of a container is editable there today)
- [ ] Favourites / recently-used section in the menu
- [ ] Keyboard navigation inside the menu (arrow keys, Enter to drill in, Escape to go back)

### Storytelling
- [x] Stories tool — chapters/steps with camera, layer visibility, transparency, projection and terrain state
- [x] Visual story builder in the setup page
- [ ] Story permalink (deep-link into a chapter/step)

### Internationalization (i18n)
- [x] Language switcher tool — change map label language (OSM vector tile name fields) at runtime
- [ ] i18n support — translatable UI strings in all built-in components
- [ ] Locale switcher — change UI locale at runtime

### Accessibility
- [x] ARIA labels on all interactive controls (buttons, sliders, toggles) — audited 2026-08-04; unlabelled selects/ranges fixed in view-mode, routing, isochrone, truearea, layer-overview, maplanguage, config-edit, and the toolbox/menu search boxes
- [x] Keyboard-reachable click targets — click handlers on plain `div`/`li` converted to real buttons in stories, search, import-layer, draw, draw-layer-dialog, layer-legend, coordinates
- [ ] Keyboard navigation & logical tab order across toolbar, layer tree, tool panels (roving tabindex / arrow keys still missing in the toolbar, toolbox and menu)
- [ ] Live regions for tool results (only coordinates and the stories step content announce today)
- [ ] Focus management for dialogs (trap focus on open, restore on close)
- [ ] Screen-reader announcements for dynamic state changes (layer added/removed, tool activated)
- [ ] Keyboard-operable map controls (pan/zoom via keyboard)
- [ ] High-contrast mode support (respect `prefers-contrast`)
- [ ] Reduced-motion support (respect `prefers-reduced-motion` in animations/transitions)
- [ ] WCAG 2.1 AA audit

### Sharing & Navigation
- [x] Permalinks — shareable URL encoding current map state:
  - Config file URL (which config is loaded)
  - Active layer IDs + hidden layer IDs
  - Map center (lng/lat), zoom, bearing, pitch, projection
  - Per-layer transparency overrides

### Known Issues
- [ ] Cesium fill polygons render at double opacity on highly detailed/concave shapes (Russia, Antarctica) — `PolygonGeometry` ear-clipping triangulation produces overlapping triangles; proposed fix is pre-triangulating with `earcut`
- [ ] Cesium layer reorder across types is inherently impossible (imagery is baked into the globe surface; vector primitives always draw on top) — only within-type reorder works
- [ ] `public/data/world-countries-simplified.topojson` has slivers and self-intersections; needs a rebuild with `ogr2ogr -makevalid` / `mapshaper -clean` (surfaces as buffer-tool topology exceptions)

### Configuration
- [x] Config edit tool — runtime UI for editing layer/map/tool config (add/remove/reorder layers, change sources, configure tools)

### And more…
