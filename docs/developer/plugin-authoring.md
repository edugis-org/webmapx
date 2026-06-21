# Plugin Authoring Guide

Plugins extend WebMapX without forking. Two patterns:

1. **New tool** — add capability (buffer, routing, 3D, etc.)
2. **Override** — change look, feel, or behaviour of an existing tool

Both patterns work as plain npm packages that import from `webmapx`.

---

## Distribution & Loading

### Package structure

A plugin is a standard npm package. The entry point must export a default object with a `register` function:

```ts
// my-plugin/src/index.ts
import './my-buffer-tool';  // side-effect: customElements.define(...)

export default {
  register() {
    // Called once by webmapx after the module loads.
    // Register locale strings, hook into registries, etc.
  }
};
```

webmapx calls `plugin.register()` immediately after dynamic import resolves. The `register` function is synchronous; use it to set up anything that must happen before the first render.

### Config entry

Add the plugin's full CDN URL to the `plugins` array in your map config:

```json
{
  "engine": "maplibre",
  "tools": ["draw"],
  "plugins": [
    "https://cdn.jsdelivr.net/npm/@my-org/wmx-routing-plugin@2.1/dist/plugin.js"
  ]
}
```

webmapx fetches and registers each plugin in order before completing mount.

### Trusted CDN list

For security, webmapx only loads plugin URLs whose origin is in the trusted list:

| CDN | Origin |
| :-- | :----- |
| jsDelivr | `https://cdn.jsdelivr.net` |
| unpkg | `https://unpkg.com` |
| esm.sh | `https://esm.sh` |

A URL from any other origin is skipped with a console warning. Self-hosted plugins must be served from the same origin as the page (no restriction applies to same-origin URLs).

### CSP requirement

If your page sets a `Content-Security-Policy`, add the CDNs you use to `script-src`:

```
Content-Security-Policy: script-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://esm.sh;
```

Without this header, browsers will block the dynamic import and the plugin silently fails to load.

### Registering locale strings

Inside `register()`, add your plugin's translation strings using i18next's `addResourceBundle`:

```ts
import i18n from 'webmapx/i18n';

export default {
  register() {
    i18n.addResourceBundle('en', 'my-routing-plugin', {
      startPoint: 'Start point',
      endPoint: 'End point',
      calculate: 'Calculate route'
    });
    i18n.addResourceBundle('nl', 'my-routing-plugin', {
      startPoint: 'Startpunt',
      endPoint: 'Eindpunt',
      calculate: 'Bereken route'
    });
  }
};
```

In your tool component, use the namespace directly:

```ts
this.t('my-routing-plugin:startPoint')
```

### Version pinning

Always pin an exact version in the CDN URL for production configs. Floating `@latest` will pick up breaking changes on the next user visit:

```json
// good
"https://cdn.jsdelivr.net/npm/@my-org/wmx-routing-plugin@2.1.3/dist/plugin.js"

// avoid in production
"https://cdn.jsdelivr.net/npm/@my-org/wmx-routing-plugin@latest/dist/plugin.js"
```

---

## Setup

Install WebMapX as a peer dependency:

```bash
npm install webmapx
```

Your plugin is a TypeScript/JavaScript module that defines one or more custom elements. No plugin manifest, no registration call beyond `customElements.define`.

---

## Pattern 1: New Tool

### Step 1 — Choose a base class

| Base class | Use when |
| :--- | :--- |
| `WebmapxBaseTool` | Passive tool (always visible, no exclusive activation) |
| `WebmapxModalTool` | Modal tool (exclusive — only one active at a time, captures map events) |

Both are exported from `webmapx`.

### Step 2 — Implement the tool

```typescript
import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxBaseTool } from 'webmapx';
import type { IMap, IMapState } from 'webmapx';

@customElement('my-buffer-tool')
export class MyBufferTool extends WebmapxBaseTool {

  @state() private radius = 500;

  static styles = css`
    :host { display: block; padding: 0.5rem; }
  `;

  protected onMapAttached(adapter: IMap): void {
    // Map is ready — set up sources, layers, event listeners
  }

  protected onStateChanged(state: IMapState): void {
    // React to map state changes
  }

  protected onMapDetached(): void {
    // Clean up sources, layers, listeners
  }

  render() {
    return html`<button @click=${this.runBuffer}>Buffer ${this.radius}m</button>`;
  }

  private runBuffer() {
    if (!this.adapter) return;
    // Use this.adapter (IMap) to read state, add layers, etc.
  }
}
```

For modal tools (exclusive activation, captures clicks):

```typescript
import { WebmapxModalTool } from 'webmapx';

@customElement('my-draw-tool')
export class MyDrawTool extends WebmapxModalTool {
  readonly toolId = 'my-draw-tool';  // required, must be unique

  protected onActivate(): void {
    // Tool became active — subscribe to click events
    this.adapter?.events.on('click', this.handleClick);
  }

  protected onDeactivate(): void {
    // Tool deactivated — remove listeners, clean up state
    this.adapter?.events.off('click', this.handleClick);
  }

  private handleClick = (e: ClickEvent) => { /* ... */ };

  render() { return html`...`; }
}
```

### Step 3 — Add to the page

Import your plugin module, then place the element in a toolbar:

```html
<script type="module" src="./my-plugin.js"></script>

<webmapx-map src="config/demo.json">
  <webmapx-layout>
    <webmapx-control-group slot="top-left">
      <webmapx-toolbar>
        <my-buffer-tool tool-id="buffer"></my-buffer-tool>
      </webmapx-toolbar>
    </webmapx-control-group>
  </webmapx-layout>
</webmapx-map>
```

### Step 4 — Wire config (optional)

Add tool settings to the map config JSON:

```json
"tools": {
  "buffer": {
    "enabled": true,
    "element": "my-buffer-tool",
    "radius": 1000
  }
}
```

Then use `<webmapx-plugin-tool>` to instantiate from config automatically:

```html
<webmapx-toolbar>
  <webmapx-plugin-tool tool-id="buffer"></webmapx-plugin-tool>
</webmapx-toolbar>
```

The `element` field names the custom element to create. All extra config keys are forwarded as properties onto the element.

---

## Pattern 2: Override an Existing Tool

### Option A — CSS custom properties (theming)

Every built-in component exposes `--webmapx-*` CSS custom properties. Override in your stylesheet:

```css
webmapx-map {
  /* Toolbar */
  --webmapx-toolbar-bg: #1e1e2e;

  /* Coordinates display */
  --webmapx-coordinates-bg: rgba(0, 0, 0, 0.7);
  --webmapx-coordinates-color: #e0e0e0;
  --webmapx-coordinates-border: 1px solid rgba(255,255,255,0.1);

  /* Zoom level */
  --webmapx-zoom-bg: rgba(0, 0, 0, 0.7);
  --webmapx-zoom-color: #e0e0e0;

  /* Navigation control */
  --webmapx-navigation-bg: #1e1e2e;
  --webmapx-navigation-color: #cdd6f4;
  --webmapx-navigation-border: 1px solid #45475a;

  /* Scale bar */
  --webmapx-scale-bg: transparent;
  --webmapx-scale-color: #cdd6f4;
  --webmapx-scale-border-color: #cdd6f4;

  /* Tool panel */
  --webmapx-panel-bg: #1e1e2e;

  /* Search */
  --webmapx-search-bg: #1e1e2e;
  --webmapx-search-color: #cdd6f4;
}
```

Full list of available properties per component:

| Component | Variables |
| :--- | :--- |
| `webmapx-toolbar` | `--webmapx-toolbar-bg` |
| `webmapx-tool-panel` | `--webmapx-panel-bg`, `--webmapx-panel-max-height`, `--webmapx-panel-header-min-height`, `--webmapx-panel-content-max-height`, `--webmapx-panel-min-content` |
| `webmapx-coordinates-tool` | `--webmapx-coordinates-bg`, `--webmapx-coordinates-color`, `--webmapx-coordinates-border`, `--webmapx-coordinates-font-size` |
| `webmapx-zoom-level` | `--webmapx-zoom-bg`, `--webmapx-zoom-color`, `--webmapx-zoom-border`, `--webmapx-zoom-font-size` |
| `webmapx-navigation-control` | `--webmapx-navigation-bg`, `--webmapx-navigation-color`, `--webmapx-navigation-border`, `--webmapx-navigation-shadow`, `--webmapx-navigation-font-size`, `--webmapx-navigation-button-size`, `--webmapx-navigation-radius`, `--webmapx-navigation-separator-color`, `--webmapx-navigation-hover-bg`, `--webmapx-navigation-hover-color` |
| `webmapx-scale-control` | `--webmapx-tool-margin`, `--webmapx-scale-bg`, `--webmapx-scale-color`, `--webmapx-scale-border-color`, `--webmapx-scale-border-thickness` |
| `webmapx-search-tool` | `--webmapx-search-bg`, `--webmapx-search-color`, `--webmapx-search-border` |
| `webmapx-layer-overview` | `--webmapx-legend-bg`, `--webmapx-legend-color`, `--webmapx-legend-title-color` |
| `webmapx-layer-tree` | `--webmapx-layer-tree-bg` |
| `webmapx-inset-map` | `--webmapx-inset-width`, `--webmapx-inset-height`, `--webmapx-inset-scale`, `--webmapx-inset-internal-size` |
| `webmapx-layout` | `--webmapx-layout-inset`, `--webmapx-layout-inset-vertical`, `--webmapx-layout-slot-gap` |

### Option B — Named slots (markup injection)

Inject custom markup into built-in components without subclassing:

```html
<!-- Custom toolbar header/footer -->
<webmapx-toolbar>
  <div slot="before" class="logo">MyApp</div>
  <webmapx-layer-tree tool-id="layers"></webmapx-layer-tree>
  <my-buffer-tool tool-id="buffer"></my-buffer-tool>
  <div slot="after" style="flex:1"></div>
</webmapx-toolbar>

<!-- Custom panel header -->
<webmapx-tool-panel label="Tools">
  <span slot="header" class="my-header">🗺 Tools</span>
  <webmapx-measure-tool tool-id="measure"></webmapx-measure-tool>
  <div slot="footer" class="my-footer">v1.0</div>
</webmapx-tool-panel>
```

Available slots:

| Component | Slots |
| :--- | :--- |
| `webmapx-toolbar` | `before` (prepend), `after` (append), default (tool buttons) |
| `webmapx-tool-panel` | `header` (replaces title), `footer` (below content), default (tool panels) |

### Option C — Subclass and re-register

Override behaviour by extending the built-in class and re-defining the custom element:

```typescript
import { WebmapxCoordinatesTool } from 'webmapx/components/webmapx-coordinates-tool';

class MyCoordinatesTool extends WebmapxCoordinatesTool {
  // Override render, onStateChanged, etc.
  render() {
    return html`<my-custom-display .state=${this.store?.getState()}></my-custom-display>`;
  }
}

// Re-register before the default definition runs (import order matters)
customElements.define('webmapx-coordinates-tool', MyCoordinatesTool);
```

> **Note:** Import your override module before importing the built-in components. If the element is already defined, `customElements.define` will throw. Use `customElements.get('webmapx-coordinates-tool')` to check first if needed.

---

## Available Public API

Import from `webmapx`:

```typescript
import {
  // Base classes
  WebmapxBaseTool,
  WebmapxPluginTool,

  // Map interfaces
  IMap, ISubMap, ISubMapFactory,
  ISource, ILayer, LayerSpec, LayerInsertOptions,
  MarkerOptions, MapCreateOptions,

  // State
  IMapState, MapStateStore, ActiveToolState,

  // Events
  MapEventBus, ClickEvent, ViewChangeEvent, // ...all event types

  // Config types
  AppConfig, ToolConfig, AnyLayerConfig, // ...all config types

  // Adapter registry (to add a new map engine)
  registerMapAdapter, getRegisteredAdapters,

  // Map context resolver
  resolveMapAdapter,
} from 'webmapx';
```

---

## Rules

- Tools never import MapLibre / OpenLayers / Leaflet / Cesium directly — use `IMap` only.
- Tools own their own throttling — use `throttle` from `webmapx/utils/throttle` if needed.
- Clean up in `onMapDetached` / `disconnectedCallback` — remove layers, sources, event listeners.
- Use `tool-id` attribute to participate in the ToolManager activation system.
- Config keys in `ToolConfig` beyond `enabled` and `element` are plugin-defined — document them in your plugin.
