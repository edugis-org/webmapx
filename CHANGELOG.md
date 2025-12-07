# Changelog
All notable changes to this project will be documented here.

## [Unreleased]
- Added `IMapAdapter` contract plus `adapter-registry` so `<webmapx-map>` can instantiate adapters by name (default `maplibre`) and remain map-library agnostic.
- Introduced per-component map context helpers so every tool resolves its host map instead of depending on global singletons.
- Renamed `central-state` to `map-state-store`; each adapter now owns an isolated `MapStateStore` instance with updated documentation across README, roadmap, and developer/user guides.
- Renamed project to WebMapX; all `gis-*` components renamed to `webmapx-*`:
  - `gis-map` → `webmapx-map`
  - `gis-map-layout` → `webmapx-layout`
  - `gis-zoom-display` → `webmapx-zoom-level`
  - `gis-inset-map` → `webmapx-inset-map`
  - `gis-new-tool` → `webmapx-tool-template`
  - `gis-style-core.css` → `webmapx-style-core.css`
- Refactor `webmapx-zoom-level` to adapter-based zoom controller.
- Implement real MapLibre calls in services.
- Added `mapCenter` state, MapLibre move tracking, inset controller, and `<webmapx-inset-map>` component for overview maps.

## [2025-12-06]
### Added
- `ROADMAP.md` to outline goals and milestones.
- `DEV_JOURNAL.md` to track session context and decisions.
 - Mermaid architecture diagram and legend in `docs/DEVELOPER_GUIDE.md`.

### Changed
- Exposed `zoomController` via adapter and bound to core internally; removed unsafe casts.
- `IMapCore.initialize` accepts `{ center, zoom, styleUrl }`; `src/app.js` configures OSM demo style and non-default viewport.
