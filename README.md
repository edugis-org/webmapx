# 🗺️ Modular GIS Web UI

A highly modular and map-library-agnostic User Interface built for dynamic Web GIS applications. This project is architected to allow easy swapping of map backends (MapLibre, OpenLayers, Cesium) and features a centralized, robust state management system to ensure consistency and performance.

## 🚀 Architectural Pillars

1.  **Map Library Agnosticism (Adapter Pattern):** All UI components interact with the map through specialized interfaces (e.g., ILayerStyleEditor), shielding the UI from MapLibre-specific APIs.
2.  **Central State Management:** The entire application state is stored in a single source of truth (`/src/store/central-state.ts`) to ensure components are synchronized and reactive.
3.  **Robustness and Performance:** Solutions for common web map challenges are built directly into the architecture:
    * **Feedback Loop Prevention:** State changes are tagged with their `source` ('UI' or 'MAP') to prevent components from endlessly updating themselves.
    * **Throttling:** Expensive map API calls are rate-limited to maintain high frame rates during continuous interactions (like slider drags).
4.  **Theming and Consistency (Design System):** All UI elements rely on **CSS Custom Properties** defined in the `/src/theme` directory, allowing for instant, global theme switching (Dark/Light). Rule: never use css z-index unless proven necessary (unlikely).

## 📂 Project Structure Overview

| Directory | Role | Example File Path | Key Architectural Element |
| :--- | :--- | :--- | :--- |
| `/src/components/modules` | Feature Components | [`./src/components/modules/gis-legend.ts`](./src/components/modules/gis-legend.ts) | **Low Complexity** (Reads State, Dispatches Intent) |
| `/src/store` | Application State | [`./src/store/central-state.ts`](./src/store/central-state.ts) | **Central State Store** (Source of Truth, Loop Prevention) |
| `/src/map` | Map Abstraction Layer | [`./src/map/maplibre-adapter.ts`](./src/map/maplibre-adapter.ts) | **Modular Adapter Pattern** (Composition / Proxy) |
| `/src/utils` | Shared Code | [`./src/utils/throttle.ts`](./src/utils/throttle.ts) | **Performance Utilities** (Throttling) |

## 🛠️ Getting Started

For a detailed guide on creating new components, understanding the data flow, and adhering to architectural rules, please read the **Developer Experience Guide:** [`DEVELOPER_GUIDE.md`](./docs/DEVELOPER_GUIDE.md).

## 🎛️ Map Initialization (OSM demo)
- The entry `src/app-main.js` initializes the map with a custom viewport and an OpenStreetMap style via MapLibre:
    - `mapAdapter.core.initialize('map-container', { center: [4.9041, 52.3676], zoom: 11, styleUrl: 'https://demotiles.maplibre.org/style.json' })`
- Change `center`, `zoom`, or `styleUrl` to use your own basemap.

## 📡 Current Status
- Zoom: wired via `MapZoomController` using `IMapCore` methods (`setZoom`, `onZoomEnd`).
- Geoprocessing: service present with throttling; map operations are stubs pending full integration.