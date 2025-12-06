# Changelog
All notable changes to this project will be documented here.

## [Unreleased]
- Refactor `gis-zoom-display` to adapter-based zoom controller.
- Implement real MapLibre calls in services.

## [2025-12-06]
### Added
- `ROADMAP.md` to outline goals and milestones.
- `DEV_JOURNAL.md` to track session context and decisions.
 - Mermaid architecture diagram and legend in `docs/DEVELOPER_GUIDE.md`.

### Changed
- Exposed `zoomController` via adapter and bound to core internally; removed unsafe casts.
- `IMapCore.initialize` accepts `{ center, zoom, styleUrl }`; `src/app-main.js` configures OSM demo style and non-default viewport.
