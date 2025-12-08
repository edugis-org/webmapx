# User Guide

This guide explains how to assemble the Modular GIS Web UI as an application developer. It focuses on markup usage and available components rather than the internals described in the Developer Guide.

## Quick Start
1. Install dependencies: `npm install`.
2. Start the dev server: `npm run start` (Vite provides hot reloads).
3. Place `<webmapx-map>` on your page. It auto-creates the map canvas, so you only add overlay tools:
   ```html
   <webmapx-map id="map-container">
     <webmapx-layout>
       <webmapx-zoom-level slot="bottom-left"></webmapx-zoom-level>
       <webmapx-tool-template slot="top-right"></webmapx-tool-template>
     </webmapx-layout>
   </webmapx-map>
   ```
4. Initialize the map in `src/app.js` via `mapAdapter.core.initialize('map-container', config)`.

## Core Concepts
- **Map Host (`<webmapx-map>`):** Wraps the mapping library surface and any overlay elements. No knowledge of internal slots is required—the element injects a canvas automatically if none is provided.
- **Layout Overlay (`<webmapx-layout>`):** Optional helper that floats nine slot zones over the map (top/middle/bottom × left/center/right) while keeping the host pointer-transparent.
- **Tools:** Components such as `<webmapx-tool-template>` and `<webmapx-zoom-level>` include their own styling so they render correctly whether or not they live inside the layout helper.

## Component Reference
- [`webmapx-map`](./components/webmapx-map.md)
- [`webmapx-layout`](./components/webmapx-layout.md)
- [`webmapx-control-group`](./components/webmapx-control-group.md)
- [`webmapx-toolbar`](./components/webmapx-toolbar.md)
- [`webmapx-tool-panel`](./components/webmapx-tool-panel.md)
- [`webmapx-inset-map`](./components/webmapx-inset-map.md)
- [`webmapx-tool-template`](./components/webmapx-tool-template.md)
- [`webmapx-zoom-level`](./components/webmapx-zoom-level.md)

See also: [Toolbar and Panel Interaction Guide](./components/interaction-guide.md)

Refer to the individual pages for usage tips, attributes, and slot details.
