# Roadmap

## Architecture Rules

1. **Adapter = Thin Wrapper:** Fixed methods/events only. Translates library-specific APIs to generic interfaces. **No business logic.**
2. **Tools = Composite Logic:** All calculations, orchestration, and state management live in tools.
3. **Consumer-Side Throttling:** Adapter emits all events immediately. Tools use `throttle` utility as needed.
4. **OOP Map API:** `IMapFactory` → `IMap` → `ISource` / `ILayer`

## Completed (2025-12-14)
- [x] Implement `IMapFactory` with OOP API (`createMap` → `IMap`)
- [x] Implement `IMap` interface (`setViewport`, `createSource`, `createLayer`, `destroy`)
- [x] Implement `ISource` interface (`setData`)
- [x] Implement `ILayer` interface (`getSource`, `remove`)
- [x] Remove all controllers (InsetController, PointerController)
- [x] Move pointer event handling into `MapCoreService`
- [x] Remove throttling from adapter layer
- [x] Refactor `webmapx-inset-map` to use new architecture (tool contains all logic)
- [x] Add consumer-side throttling to inset-map tool

## Near-Term Tasks
- [ ] Refactor remaining tools to follow new architecture pattern
- [ ] Add OpenLayers adapter implementation
- [ ] Add Leaflet adapter implementation
- [ ] Implement layer management tools using `IMap.createLayer`
- [ ] Add draw/edit tools using new architecture

## Guardrails
- Tools never import MapLibre/OL/Leaflet directly
- Adapter only translates events and delegates to map library
- Keep interfaces in `src/map/IMapInterfaces.ts` authoritative
- Throttling decisions belong in tools, not adapter

## Milestones
- M1: ~~Adapter architecture~~ (done)
- M2: Multi-library support (OpenLayers, Leaflet adapters)
- M3: Layer management, draw tools, selection tools
- M4: Accessibility checks, performance optimization
