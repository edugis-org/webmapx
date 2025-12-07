# 🗺️ WebMapX - Modular Web Map UI

A highly modular and map-library-agnostic User Interface built for dynamic Web GIS applications. This project is architected to allow easy swapping of map backends (MapLibre, OpenLayers, Cesium) and features a scoped, per-map state management system to ensure consistency and performance.

## 🚀 Architectural Pillars

1.  **Map Library Agnosticism (Adapter Pattern):** All UI components interact with the map through specialized interfaces (e.g., ILayerStyleEditor), shielding the UI from MapLibre-specific APIs.
2.  **Map State Management:** Each map owns a scoped state store (`/src/store/map-state-store.ts`) so components stay synchronized with their host map instance while remaining isolated from other maps.
3.  **Robustness and Performance:** Solutions for common web map challenges are built directly into the architecture:
    * **Feedback Loop Prevention:** State changes are tagged with their `source` ('UI' or 'MAP') to prevent components from endlessly updating themselves.
    * **Throttling:** Expensive map API calls are rate-limited to maintain high frame rates during continuous interactions (like slider drags).
4.  **Theming and Consistency (Design System):** All UI elements rely on **CSS Custom Properties** defined in the `/src/theme` directory, allowing for instant, global theme switching (Dark/Light). Rule: never use css z-index unless proven necessary (unlikely).

## 📂 Project Structure Overview

| Directory | Role | Example File Path | Key Architectural Element |
| :--- | :--- | :--- | :--- |
| `/src/components/modules` | Feature Components | [`./src/components/modules/webmapx-tool-template.ts`](./src/components/modules/webmapx-tool-template.ts) | **Low Complexity** (Reads State, Dispatches Intent) |
| `/src/store` | Application State | [`./src/store/map-state-store.ts`](./src/store/map-state-store.ts) | **Map State Store** (Source of Truth, Loop Prevention) |
| `/src/map` | Map Abstraction Layer | [`./src/map/maplibre-adapter.ts`](./src/map/maplibre-adapter.ts) | **Modular Adapter Pattern** (Composition / Proxy) |
| `/src/utils` | Shared Code | [`./src/utils/throttle.ts`](./src/utils/throttle.ts) | **Performance Utilities** (Throttling) |

## 🛠️ Getting Started

For a detailed guide on creating new components, understanding the data flow, and adhering to architectural rules, please read the **Developer Experience Guide:** [`DEVELOPER_GUIDE.md`](./docs/DEVELOPER_GUIDE.md). To follow project-wide decisions or session history, see [`DEV_JOURNAL.md`](./DEV_JOURNAL.md) and the current [`CHANGELOG.md`](./CHANGELOG.md).

## 📘 User Documentation
- High-level usage guide plus per-component reference lives in [`docs/user/README.md`](./docs/user/README.md).
- Each user doc links to deeper component write-ups under `docs/user/components/` (map host, layout, zoom display, new tool templates, etc.).

## 🧱 Map Layout System
- `<webmapx-map>` now self-manages its map surface: if you omit a `[slot="map-view"]`, it injects one, styles it with the required absolute positioning, and keeps it in sync if you replace the node later. Consumers no longer need to know about the internal slot to get a working canvas.
- `<webmapx-layout>` is an optional overlay scaffold that sits above the map, is pointer-transparent by default, and exposes nine positional slots (`top-left`, `middle-left`, … `bottom-right`). Each slot wrapper is absolutely positioned so your tools retain intrinsic sizing without requiring grid/flex boilerplate.
- Tools placed outside the layout (`<webmapx-tool-template>`, `<webmapx-zoom-level>`, custom components) still render correctly thanks to their own `inline-flex` host styling; use regular CSS if you want to anchor them without the layout helper.
- `<webmapx-inset-map>` consumes the shared store (center + zoom) to render a passive overview map with a configurable zoom offset. Place it in any layout slot to give users spatial context.

## ⚙️ Build & Dev Workflow
- `npm install` once after cloning to pull dependencies.
- `npm run start` launches the Vite dev server; its "magic" (module graph, hot-module reload, CSS/asset handling) lets you edit files under `src/` and see the result instantly without manual builds.
- `npm run build` invokes `vite build`, emitting the optimized static bundle into `dist/`—this folder is what you deploy to any static host or edge worker.
- `npm run preview` serves the fresh `dist/` output locally so you can smoke-test the optimized build before shipping.

## 🧾 TypeScript Configuration
- The repo compiles via Vite using the `tsconfig.json` at the root. Key options:
    - `"target": "es2020"` and `"module": "esnext"` so emitted code matches modern evergreen browsers.
    - `"experimentalDecorators": true` and `"useDefineForClassFields": false` enable Lit's decorator syntax (`@customElement`, `@state`, etc.) and align with its class-field semantics.
    - `"moduleResolution": "node"` ensures bare module specifiers (Shoelace, Lit, MapLibre) resolve the same way in both TS and Vite.
- Component authoring pattern: `.ts` files in `src/components/modules` export Lit elements that are registered once and side-effect imported from `src/app-main.js`, keeping TypeScript (for DX) while Vite handles bundling and dev-time transpilation automatically.

## 🎛️ Map Initialization (OSM demo)
- The entry `src/app-main.js` initializes the map with a custom viewport and an OpenStreetMap style via MapLibre:
    - `mapAdapter.core.initialize('map-container', { center: [4.9041, 52.3676], zoom: 11, styleUrl: 'https://demotiles.maplibre.org/style.json' })`
- Change `center`, `zoom`, or `styleUrl` to use your own basemap.

## 📡 Current Status
- Zoom: wired via `MapZoomController` using `IMapCore` methods (`setZoom`, `onZoomEnd`).
- Geoprocessing: service present with throttling; map operations are stubs pending full integration.