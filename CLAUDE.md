# webmapx

Modular web map UI with adapters for MapLibre, OpenLayers, Leaflet, and Cesium.

## Stack

- **Framework**: Lit (web components), TypeScript, Vite
- **Map engines**: MapLibre GL, OpenLayers (ol), Leaflet, Cesium
- **Overlays**: @allmaps (leaflet, maplibre, openlayers)
- **UI**: Shoelace components
- **State**: `src/store/map-state-store.ts`

## Architecture

```
src/
  map/                    # Engine adapters + services
    IMapInterfaces.ts     # Shared interfaces
    base-adapter.ts       # Abstract base: store, hasLayer, layer bookkeeping
    maplibre-adapter.ts   # MapLibre adapter (extends BaseAdapter)
    openlayers-adapter.ts
    leaflet-adapter.ts
    cesium-adapter.ts
    maplibre-services/    # Engine-specific services (pure engine, no store bookkeeping)
    openlayers-services/
    leaflet-services/
    cesium-services/
    layer-source-utils.ts
    logical-layer-executor.ts
    runtime-layer-utils.ts
    visible-layer-utils.ts
    adapter-registry.ts
  components/             # Lit web components (webmapx-*)
  store/                  # Map state (IMapState.ts, map-state-store.ts, map-events.ts)
  config/                 # Config types
  tools/                  # Map tools
  utils/                  # Shared utilities
  workers/                # Web workers
```

## Key patterns

- **Stories tool** (`webmapx-stories-tool.ts`, config `stories` section, `src/config/types.ts`): a guided-tour tool — `StoryConfig` → `StoryChapterConfig` → `StoryStepConfig`. Each step's `state` is authored as human-readable `StoryStepConfigState` (`layers`, `hiddenLayers`, `view: { center, zoom, bearing?, pitch? }`, `transparency`, `projection`, `terrain`) and converted via `toStoryStepState` (`src/config/story-step-state.ts`) into the short-key `StoryStepState` — the same shape as a decoded permalink (`PermalinkState` in `src/utils/permalink.ts`) — camera + layer visibility/opacity + terrain, with no tool state — so applying a step is a set of direct `adapter.setViewport`/`setBearing`/`setPitch`/`setLayerVisibility`/`setLayerOpacity`/`setProjection`/`setTerrainEnabled` calls (no `store.dispatch`), leaving it a transient overlay that never leaks into the main map's persisted state or permalink. Unlike permalink restore (which only toggles layers already loaded and reports the rest as missing), a story step lazily adds any referenced layer that isn't loaded yet via `mapHost.addLayerRequest({ layerId })` — the same catalog-lookup path `webmapx-search-tool.ts`/`webmapx-buffer-tool.ts` use — and tracks which ones it added so they're fully removed again (not just hidden) when the story closes. Step content is `html` (inline, sanitized) or `htmlUrl` (fetched, resolved relative to the config file's URL at load time in `config/loader.ts`; relative `src`/`href` inside the fetched HTML are then resolved against that URL too, via `sanitizeAbstractHtml(html, baseUrl)` in `utils/sanitize-html.ts`).
- **Tool panel width override**: `webmapx-tool-panel.ts` defaults to a fixed 300px width but any tool can widen it — statically via a `panel-width` attribute on the tool element, or dynamically by dispatching a bubbling `webmapx-panel-width` event (`detail: { toolId, width }`, ignored unless `toolId` matches the currently active tool). The stories tool uses the dynamic form to apply `StoryConfig.width` per story and reset to default on close.
- Layer ordering: handled in generic layer code, not per-engine. Drag-reorder in the legend (`webmapx-layer-overview.ts`) calls `adapter.moveLayer(layerId, beforeLayerId)`, which reorders `store.mapLayers` (key order = bottom-to-top stack, legend shows it reversed) and delegates to each engine's `MapLayerService.moveLayer`.
  - **Cesium limitation (inherent, not fixable):** imagery layers are baked into the globe surface texture; vector primitives/entities always render above all imagery. Vector-vs-raster reorder has no effect — only within-type reorder (`reapplyImageryOrder` for imagery) works.
  - **Leaflet (pane-per-layer):** each logical layer gets its own `map.createPane()` (`webmapx-<id>`, created in `MapLayerService.ensurePane`, passed via `pane` option through `LeafletLayerFactory` and the Allmaps `WarpedMapLayer`). `reapplyLogicalOrder` sets pane z-index = 300 + position in `logicalOrder`, so cross-type (raster vs vector) reorder works. Base 300 keeps catalog layers above `tilePane` (200) and below `overlayPane` (400), where runtime/tool layers (draw, measure, highlights) live in default panes and always render on top; those inline layers are still reordered by remove/re-add within their pane. Panes are removed on `removeLayer` (no Leaflet API — deletes from `map._panes`).
  - **`logicalOrder` vs `mapLayers` divergence (cesium/leaflet):** both engines track imagery/vector layer order in their own `logicalOrder` array, separate from the generic `store.mapLayers`. Layers whose source type isn't handled by that engine's `MapLayerService.addLayer` (e.g. `vector` source type in leaflet/cesium) fall back to `core.addLayer` and are never added to `logicalOrder`. `moveLayer`'s `beforeLayerId` can reference such an untracked layer — both services resolve this by walking `mapLayers` order forward to the nearest layer that IS in `logicalOrder`, instead of falling back to "push to top".
- **Legend empty-label convention:** For `match`/`case` expressions, the fallback (default) value is always pushed with label `''`. The legend skips any case where `label === ''`. To hide a case from the legend — including the fallback — give it an empty string label. To show it, give it an explicit label like `'other'`, `'unknown'`, `'overige'`, etc. This matches the EduGIS convention.
- **Attribute metadata (`metadata.attributes`):** Controls display of feature properties in the info tool and legend labels for `match`/`case` expressions. Defined as `{ translations: [{ name, translation, unit, valuemap?, ... }] }`.
  - **`valuemap`** — array of `{ value, label, operator? }` entries. Used by both the info tool (translates raw feature property values) and the legend (translates `match` keys and `case` condition thresholds into display labels). For `case` expressions, `operator` (`'=='`, `'<'`, `'<='`, etc.) disambiguates between conditions on the same threshold value, enabling range labels like `"0 - 20 inh/km²"` instead of `"< 20 inh/km²"`.
  - **String reference** — `metadata.attributes` can be a string key instead of an inline object, e.g. `"attributes": "pop_dens"`. The legend resolves it from `layerData.attributeMetadata[key]` (stored in `state.attributeMetadata`). Use this to share one definition across many layers that use the same property names, avoiding repetition in config. Define the catalog in `layerData.attributeMetadata` in the config JSON.
- Background switching: `background-group-policy` controls single/exclusive groups
- **`runtimeMap.maxBounds`** `[west, south, east, north]` (lon/lat, MapLibre LngLatBoundsLike flat form) restricts pan/zoom-out to a bbox; "cover" semantics — view stays inside bbox, so with mismatched aspect ratios the full bbox is never visible at once. Antimeridian-crossing boxes rejected by validator. Engine mapping: maplibre `maxBounds` (native), openlayers `View.extent` in 3857 (native), leaflet `maxBounds` + `maxBoundsViscosity: 1` + derived min-zoom re-applied on container resize (`applyMaxBoundsZoomFloor`), cesium soft clamp on `camera.changed` (`enforceMaxBounds` + zoom floor in `clampZoom`/`applyZoomDistanceLimits`).
- Layer config: JSON close to mapbox/maplibre spec (`config/layers.json`, `config/world.json`)
- Allmaps overlay layers integrate with all three 2D engines
- Generic/engine boundary: `BaseAdapter` owns all `store.mapLayers` bookkeeping; engine services are pure engine code and MUST NOT call `registerMapLayer`/`unregisterMapLayer`

## Commands

```bash
npm run dev          # Start dev server (vite)
npm run build        # Build
npm run test         # Run tests
npm run check:architecture  # Architecture lint
npx tsc --noEmit    # Type check
```
