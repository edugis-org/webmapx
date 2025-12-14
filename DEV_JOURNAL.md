# Dev Journal

Use this journal to hand off context between sessions.

Template
- Date:
- Context:
- Changes:
- Decisions:
- Next steps:

Entry 2025-12-06
- Context: Components act as plugins; adapter used; Shoelace base path set in `src/app.js`; MapLibre installed.
- Changes: Exposed `zoomController` via `mapAdapter.core` in `src/map/maplibre-adapter.ts`.
- Decisions: Unify adapter surface; keep state source tagging consistent.
- Next steps: Refactor `webmapx-zoom-level` to use `mapAdapter.core.zoomController`; wire real MapLibre calls; add feedback-loop guards.

Entry 2025-12-06 (later)
- Context: Need better visual feedback on map load and clearer docs.
- Changes: `IMapCore.initialize` now supports `{ center, zoom, styleUrl }`. `app.js` initializes OSM demo style with Amsterdam viewport. Simplified Mermaid diagram and added legend in `docs/DEVELOPER_GUIDE.md`. Updated `README.md` and `ROADMAP.md` to reflect current state.
- Decisions: Avoid attaching controllers to `core` via casts; expose controllers via adapter, bind to core internally. Keep components calling controller/service via adapter.
- Next steps: Refactor `webmapx-zoom-level` to consume `mapAdapter.zoomController`; implement real geoprocessing map calls; consider adapter-factory for runtime library selection.

Entry 2025-12-07
- Context: Inset map, layout, and user docs updated; current architecture still assumes a single global store tied to the document.
- Changes: None yet—planning for next session.
- Decisions: None.
- Next steps:
	1. Move the map state store from global scope into each `<webmapx-map>` instance (one store per map) so multiple maps can coexist without shared state collisions.
	2. Allow tools to live outside `<webmapx-map>` but reference the intended map via an attribute (e.g., `map-target="map-container"`); automatically resolve the host map when a tool is slotted inside `<webmapx-map>` so authors only set the attribute for out-of-map tools.

Entry 2025-12-09
- Context: Introduced `webmapx-control-group` to orchestrate toolbar + tool-panel positioning with `orientation`, `panel-position`, and `alignment` attributes. Toolbar now supports vertical/horizontal modes.
- Changes: Added `webmapx-control-group.ts`; updated `webmapx-toolbar.ts` to accept `orientation`; created user docs for control group, toolbar, tool panel, and the interaction guide; updated docs overview.
- Decisions: Keep components loosely coupled via events (`webmapx-tool-select`, `webmapx-panel-close`). Avoid z-index; rely on DOM order for stacking. Use percentage-based `max-height` when parent height is constrained.
- To do:
	1. Verify behavior when toolbar/panel content exceeds map bounds: scrollbars must appear on the panel; empty layout areas remain click-through.
	2. Ensure toolbar wraps buttons: when vertical, wrap to 2+ columns; when horizontal, wrap to 2+ rows if needed.
	3. Confirm alignment on right-side placement: toolbar should remain right-aligned relative to the panel when expanding.
	4. Add examples to docs demonstrating overflow/wrap scenarios for both orientations.

Entry 2025-12-14
- Context: Major architecture refactoring session. Established new rules: adapter = thin wrapper, tools = composite logic, no business logic in adapter.
- Changes:
	- Created `IMapFactory` interface with OOP API returning `IMap` objects
	- Created `IMap`, `ILayer`, `ISource` interfaces for object-oriented map management
	- Implemented `MapLibreMap`, `MapLibreLayer`, `MapLibreSource` classes in `MapFactoryService.ts`
	- Removed `IInsetController` from adapter (was in `IMapAdapter`)
	- Removed `MapInsetController.ts` - logic moved to tool
	- Removed `MapPointerController.ts` - merged into `MapCoreService`
	- Removed `MapRegistry.ts`, `GeoJSONSourceService.ts`, `LayerService.ts` (consolidated)
	- Removed all throttling from `MapCoreService` - adapter now emits all events immediately
	- Refactored `webmapx-inset-map.ts` to contain all composite logic and use `adapter.mapFactory.createMap()`
	- Added consumer-side throttling to inset-map tool using `throttle` utility
- Decisions:
	1. Adapter is thin wrapper only - translates library events to generic events, no logic
	2. Tools contain all composite logic - calculations, state management, layer setup
	3. Consumers decide throttling - use `throttle` utility from `/src/utils/throttle.ts`
	4. OOP API - `map.createSource()` returns `ISource`, `map.createLayer()` returns `ILayer`
	5. No separate controller classes - either in adapter (translation) or in tool (logic)
- Next steps:
	1. Refactor remaining tools to follow new architecture
	2. Implement OpenLayers adapter using same interfaces
	3. Implement Leaflet adapter
	4. Add layer management tools using new `IMap.createLayer` API
