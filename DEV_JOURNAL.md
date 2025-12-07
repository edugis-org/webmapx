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
