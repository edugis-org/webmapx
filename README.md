# 🗺️ WebMapX - Modular Web Map UI

A web component library that provides ready-to-use, extensible, and customizable UI tools for web maps, with an extensibility API for registering custom map adapters and tools (MapLibre, OpenLayers, Leaflet, Cesium).

## 🚀 Architecture Rules

1.  **Adapter = Thin Wrapper:** The adapter layer provides fixed methods/events only. It translates library-specific APIs (MapLibre, OpenLayers, etc.) to generic interfaces. **No business logic in the adapter.**

2.  **Tools = Composite Logic:** All business logic, calculations, and orchestration live in the tool components. Tools use the adapter's thin wrappers and decide their own throttling/rate-limiting.

3.  **OOP Map API:** Tools create and manage maps via an object-oriented interface:
    ```typescript
    const map = adapter.mapFactory.createMap(container, { interactive: false });
    map.onReady(() => {
      const source = map.createSource('viewport', emptyGeoJSON);
      const layer = map.createLayer({ id: 'fill', type: 'fill', sourceId: 'viewport' });
      source.setData(newGeoJSON);
    });
    map.setViewport(center, zoom);
    map.destroy();
    ```

4.  **Map State Management:** Each map owns a scoped state store (`/src/store/map-state-store.ts`). State changes are tagged with `source` ('UI' or 'MAP') to prevent feedback loops.

5.  **Consumer-Side Throttling:** The adapter emits all events immediately. Consumers (tools, stores) use the `throttle` utility to rate-limit as needed.

6.  **Theming:** All UI elements use CSS Custom Properties from `/src/theme`. Rule: never use z-index unless proven necessary.

## 📂 Project Structure Overview

| Directory | Role | Example File Path | Key Architectural Element |
| :--- | :--- | :--- | :--- |
| `/src/components/modules` | Tools (UI + Logic) | [`./src/components/modules/webmapx-inset-map.ts`](./src/components/modules/webmapx-inset-map.ts) | **Composite Logic** (creates maps, layers, handles state) |
| `/src/store` | Application State | [`./src/store/map-state-store.ts`](./src/store/map-state-store.ts) | **Map State Store** (Source of Truth, Loop Prevention) |
| `/src/map` | Adapter Layer | [`./src/map/maplibre-adapter.ts`](./src/map/maplibre-adapter.ts) | **Thin Wrapper** (translates to MapLibre/OL/Leaflet) |
| `/src/map/IMapInterfaces.ts` | Contracts | [`./src/map/IMapInterfaces.ts`](./src/map/IMapInterfaces.ts) | **IMap, ILayer, ISource, IMapFactory** interfaces |
| `/src/utils` | Shared Utilities | [`./src/utils/throttle.ts`](./src/utils/throttle.ts) | **Throttle utility** (consumers decide rate-limiting) |

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
- Component authoring pattern: `.ts` files in `src/components/modules` export Lit elements that are registered once and side-effect imported from `src/app.js`, keeping TypeScript (for DX) while Vite handles bundling and dev-time transpilation automatically.

## 🎛️ Map Initialization (OSM demo)
- The entry `src/app.js` initializes the map with a custom viewport and an OpenStreetMap style via MapLibre:
    - `mapAdapter.core.initialize('map-container', { center: [4.9041, 52.3676], zoom: 11, styleUrl: 'https://demotiles.maplibre.org/style.json' })`
- Change `center`, `zoom`, or `styleUrl` to use your own basemap.

## 📡 Current Status
- **Adapter:** Thin wrapper pattern implemented. `MapCoreService` translates MapLibre events to generic `MapEventBus` events. No controllers.
- **IMapFactory:** OOP API for creating maps (`IMap`), sources (`ISource`), and layers (`ILayer`).
- **Inset Map:** Refactored to use new architecture. Tool contains all composite logic, uses `mapFactory.createMap()` and manages its own throttling.
- **Events:** `view-change`, `view-change-end`, `pointer-move`, `click`, `dblclick`, `contextmenu`, `pointer-leave` available via `adapter.events`.

## 🔌 Extensibility

This project exposes clear extension points for adapters and tools rather than a generic "plugin" runtime. Two common extension patterns are:

- **Registering a custom map adapter** — use the `registerMapAdapter` API to make a new adapter available by name. See [`src/map/adapter-registry.ts`](src/map/adapter-registry.ts) for details. Example:

```typescript
import { registerMapAdapter } from './src/map/adapter-registry';
import { MyLeafletAdapter } from './src/map/leaflet-adapter';

registerMapAdapter('leaflet', () => new MyLeafletAdapter());
```

- **Creating a custom tool** — extend `WebmapxModalTool` or `WebmapxBaseTool` in `src/components/modules` to build tools that auto-register with the `ToolManager`. See [`src/components/modules/webmapx-modal-tool.ts`](src/components/modules/webmapx-modal-tool.ts) and [`src/tools/tool-manager.ts`](src/tools/tool-manager.ts). Minimal example:

```typescript
import { WebmapxModalTool } from './src/components/modules/webmapx-modal-tool';

export class MyMeasureTool extends WebmapxModalTool {
    readonly toolId = 'my-measure';

    protected onActivate(): void {
        // subscribe to adapter events, create layers, etc.
    }

    protected onDeactivate(): void {
        // cleanup
    }
}

customElements.define('my-measure', MyMeasureTool);
```

These extension points are documented further in the Developer Guide: [`docs/DEVELOPER_GUIDE.md`](./docs/DEVELOPER_GUIDE.md).