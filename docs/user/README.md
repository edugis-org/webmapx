# User Guide

This guide explains how to assemble the Modular GIS Web UI as an application developer. It focuses on markup usage and available components rather than the internals described in the Developer Guide.

## Quick Start
1. Install dependencies: `npm install`.
2. Start the dev server: `npm run start` (Vite provides hot reloads).
3. Place `<gis-map>` on your page. It auto-creates the map canvas, so you only add overlay tools:
   ```html
   <gis-map id="map-container">
     <gis-map-layout>
       <gis-zoom-display slot="bottom-left"></gis-zoom-display>
       <gis-new-tool slot="top-right"></gis-new-tool>
     </gis-map-layout>
   </gis-map>
   ```
4. Initialize the map in `src/app-main.js` via `mapAdapter.core.initialize('map-container', config)`.

## Core Concepts
- **Map Host (`<gis-map>`):** Wraps the mapping library surface and any overlay elements. No knowledge of internal slots is required—the element injects a canvas automatically if none is provided.
- **Layout Overlay (`<gis-map-layout>`):** Optional helper that floats nine slot zones over the map (top/middle/bottom × left/center/right) while keeping the host pointer-transparent.
- **Tools:** Components such as `<gis-new-tool>` and `<gis-zoom-display>` include their own styling so they render correctly whether or not they live inside the layout helper.

## Component Reference
- [`gis-map`](./components/gis-map.md)
- [`gis-map-layout`](./components/gis-map-layout.md)
- [`gis-new-tool`](./components/gis-new-tool.md)
- [`gis-zoom-display`](./components/gis-zoom-display.md)

Refer to the individual pages for usage tips, attributes, and slot details.
