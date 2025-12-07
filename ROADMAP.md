# Roadmap

Goals: keep components plugin-like, map-agnostic, and state-driven.

- Adapter cohesion: access map services via `mapAdapter.core.*`.
- Central state: all UI/MAP updates tagged with `source` ('UI'|'MAP'|'INIT').
- Performance: throttle expensive map ops; avoid feedback loops.
- Theming: use `src/theme/webmapx-style-core.css` variables; avoid z-index.

## Near-Term Tasks
- Expose `zoomController` via adapter (done).
- Refactor `webmapx-zoom-level` to use `mapAdapter.zoomController`.
- Wire MapLibre zoom via `IMapCore.setZoom` and `onZoomEnd` (done).
- Implement geoprocessing actions using MapLibre+worker where applicable.
- Ensure `MapCoreService` dispatches tool activation state to `central-state`.
- Formalize state updates: validate shapes and sources before merge.

## Recent Updates
- `IMapCore.initialize` accepts `{ center, zoom, styleUrl }` for runtime configuration.
- `app-main.js` initializes OSM demo style and Amsterdam viewport.
- Mermaid architecture diagram added to `docs/DEVELOPER_GUIDE.md`.

## Guardrails
- Components never import MapLibre directly.
- Services encapsulate map instance via `MapCoreService.initialize()`.
- Prevent UI jitter: temporary mute on optimistic updates when needed.
- Keep interfaces in `src/map/IMapInterfaces.ts` authoritative.

## Milestones
- M1: Zoom + style polish, adapter surface unified.
- M2: Geoprocessing basic ops, worker offloading.
- M3: Layer management, selection tools, accessibility checks.
