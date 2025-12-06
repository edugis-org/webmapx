# Dev Journal

Use this journal to hand off context between sessions.

Template
- Date:
- Context:
- Changes:
- Decisions:
- Next steps:

Entry 2025-12-06
- Context: Components act as plugins; adapter used; Shoelace base path set in `src/app-main.js`; MapLibre installed.
- Changes: Exposed `zoomController` via `mapAdapter.core` in `src/map/maplibre-adapter.ts`.
- Decisions: Unify adapter surface; keep state source tagging consistent.
- Next steps: Refactor `gis-zoom-display` to use `mapAdapter.core.zoomController`; wire real MapLibre calls; add feedback-loop guards.

Entry 2025-12-06 (later)
- Context: Need better visual feedback on map load and clearer docs.
- Changes: `IMapCore.initialize` now supports `{ center, zoom, styleUrl }`. `app-main.js` initializes OSM demo style with Amsterdam viewport. Simplified Mermaid diagram and added legend in `docs/DEVELOPER_GUIDE.md`. Updated `README.md` and `ROADMAP.md` to reflect current state.
- Decisions: Avoid attaching controllers to `core` via casts; expose controllers via adapter, bind to core internally. Keep components calling controller/service via adapter.
- Next steps: Refactor `gis-zoom-display` to consume `mapAdapter.zoomController`; implement real geoprocessing map calls; consider adapter-factory for runtime library selection.
