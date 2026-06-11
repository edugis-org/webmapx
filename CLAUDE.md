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

- Layer ordering: handled in generic layer code, not per-engine. Drag-reorder in the legend (`webmapx-layer-overview.ts`) calls `adapter.moveLayer(layerId, beforeLayerId)`, which reorders `store.mapLayers` (key order = bottom-to-top stack, legend shows it reversed) and delegates to each engine's `MapLayerService.moveLayer`.
  - **Cesium limitation (inherent, not fixable):** imagery layers are baked into the globe surface texture; vector primitives/entities always render above all imagery. Vector-vs-raster reorder has no effect — only within-type reorder (`reapplyImageryOrder` for imagery) works.
  - **Leaflet limitation (TODO, fixable):** raster uses `tilePane` (z=200), vector uses `overlayPane` (z=400) — Leaflet's default panes, fixed relative stacking. `moveLayer`/`reapplyLogicalOrder` only reorders DOM order within a pane, so cross-type reorder has no visual effect. Fix: give each logical layer its own `map.createPane()` with z-index reflecting its position in `logicalOrder`, set via `pane` option in `LeafletLayerFactory`.
  - **`logicalOrder` vs `mapLayers` divergence (cesium/leaflet):** both engines track imagery/vector layer order in their own `logicalOrder` array, separate from the generic `store.mapLayers`. Layers whose source type isn't handled by that engine's `MapLayerService.addLayer` (e.g. `vector` source type in leaflet/cesium) fall back to `core.addLayer` and are never added to `logicalOrder`. `moveLayer`'s `beforeLayerId` can reference such an untracked layer — both services resolve this by walking `mapLayers` order forward to the nearest layer that IS in `logicalOrder`, instead of falling back to "push to top".
- Background switching: `background-group-policy` controls single/exclusive groups
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
