# Changelog
All notable changes to this project will be documented here.

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
