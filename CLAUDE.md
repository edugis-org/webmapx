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
    maplibre-adapter.ts   # MapLibre adapter
    openlayers-adapter.ts
    leaflet-adapter.ts
    cesium-adapter.ts
    maplibre-services/    # Engine-specific services
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

- Layer ordering: handled in generic layer code, not per-engine
- Background switching: `background-group-policy` controls single/exclusive groups
- Layer config: JSON close to mapbox/maplibre spec (`config/layers.json`, `config/world.json`)
- Allmaps overlay layers integrate with all three 2D engines

## Commands

```bash
npm run dev          # Start dev server (vite)
npm run build        # Build
npm run test         # Run tests
npm run check:architecture  # Architecture lint
npx tsc --noEmit    # Type check
```
