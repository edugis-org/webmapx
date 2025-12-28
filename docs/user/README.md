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
4. Load a configuration via URL parameter: `http://localhost:5173/?config=./config/demo.json`

## Core Concepts
- **Map Host (`<webmapx-map>`):** Wraps the mapping library surface and any overlay elements. No knowledge of internal slots is required—the element injects a canvas automatically if none is provided.
- **Layout Overlay (`<webmapx-layout>`):** Optional helper that floats nine slot zones over the map (top/middle/bottom × left/center/right) while keeping the host pointer-transparent.
- **Tools:** Components such as `<webmapx-tool-template>` and `<webmapx-zoom-level>` include their own styling so they render correctly whether or not they live inside the layout helper.
- **Configuration:** JSON files define map settings, data sources, layers, and tools. Load via URL parameter `?config=path/to/config.json`.

## Toolbar + Panel Example

```html
<webmapx-control-group slot="bottom-left" orientation="horizontal" panel-position="before">
  <webmapx-toolbar id="main-toolbar">
    <sl-button name="layers" circle>
      <sl-icon name="layers"></sl-icon>
    </sl-button>
    <sl-button name="search" circle>
      <sl-icon name="search"></sl-icon>
    </sl-button>
    <sl-button name="measure" circle>
      <sl-icon name="rulers"></sl-icon>
    </sl-button>
    <sl-button name="settings" circle>
      <sl-icon name="gear"></sl-icon>
    </sl-button>
  </webmapx-toolbar>

  <webmapx-tool-panel id="tool-panel" label="Tools">
    <webmapx-layer-tree tool-id="layers"></webmapx-layer-tree>
    <webmapx-search-tool tool-id="search"></webmapx-search-tool>
    <webmapx-measure-tool tool-id="measure"></webmapx-measure-tool>
    <webmapx-settings tool-id="settings"></webmapx-settings>
  </webmapx-tool-panel>
</webmapx-control-group>
```

## Configuration
See [Configuration](./configuration.md) for details on:
- Loading config files via URL parameter
- Config file format (map, catalog, tools sections)
- Source and layer definitions
- Layer tree structure

## Component Reference
- [`webmapx-map`](./components/webmapx-map.md)
- [`webmapx-layout`](./components/webmapx-layout.md)
- [`webmapx-control-group`](./components/webmapx-control-group.md)
- [`webmapx-toolbar`](./components/webmapx-toolbar.md)
- [`webmapx-tool-panel`](./components/webmapx-tool-panel.md)
- [`webmapx-layer-tree`](./components/webmapx-layer-tree.md)
- [`webmapx-inset-map`](./components/webmapx-inset-map.md)
- [`webmapx-settings`](./components/webmapx-settings.md)
- [`webmapx-tool-template`](./components/webmapx-tool-template.md)
- [`webmapx-search-tool`](./components/webmapx-search-tool.md)
- [`webmapx-coordinates-tool`](./components/webmapx-coordinates-tool.md)
- [`webmapx-zoom-level`](./components/webmapx-zoom-level.md)

See also: [Toolbar and Panel Interaction Guide](./components/interaction-guide.md)

Refer to the individual pages for usage tips, attributes, and slot details.

## Tool Documentation
- [`webmapx-measure-tool`](./components/webmapx-measure-tool.md)
- [`webmapx-search-tool`](./components/webmapx-search-tool.md)
- [`webmapx-spinner`](./components/webmapx-spinner.md)
- [`webmapx-layer-tree`](./components/webmapx-layer-tree.md)
- [`webmapx-inset-map`](./components/webmapx-inset-map.md)
- [`webmapx-settings`](./components/webmapx-settings.md)
- [`webmapx-coordinates-tool`](./components/webmapx-coordinates-tool.md)
- [`webmapx-tool-template`](./components/webmapx-tool-template.md)
- [`webmapx-zoom-level`](./components/webmapx-zoom-level.md)
