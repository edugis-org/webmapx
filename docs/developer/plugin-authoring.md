# Plugin Authoring Guide

Plugins extend WebMapX without forking. Two patterns:

1. **New tool** — a tool a config can name, with a toolbar button, a panel and
   an entry in `testpages/setup.html`, exactly like a built-in one
2. **Override** — change the look, feel or behaviour of an existing tool

A complete, working example is `public/plugins/bookmarks.js` (named map views):
one plain `.js` file, no build step, no imports.

---

## Pattern 1: New Tool

### The module

A plugin is an ES module whose default export has a `register(api)` function:

```js
export default {
  register(api) {
    const { WebmapxModalTool, html, css, registerTool } = api;

    class MyTool extends WebmapxModalTool {
      get toolId() { return 'mytool'; }
      onStateChanged(state) { /* react to map state */ }
      render() { return html`<div class="tool-content">Hello</div>`; }
    }

    customElements.define('my-tool', MyTool);
    registerTool({ id: 'mytool', tag: 'my-tool', placement: 'toolbar', label: 'My tool', icon: 'star' });
  },
};
```

**Use the classes in `api`, don't import webmapx.** A plugin loaded from a CDN
or its own bundle that imports `@edugis-org/webmapx` gets a *second copy* of
it — a different tool registry, ToolManager and Lit — and a tool registered
there never appears on this page. `api` holds the live instances:

| Member | What it is |
| :-- | :-- |
| `registerTool(entry)` | Adds a tool to the registry (see below). Returns `false` and warns if refused. |
| `WebmapxModalTool` | Base class for a toolbar tool with a panel (exclusive activation). |
| `WebmapxBaseTool` | Base class for a passive, always-visible tool or control. |
| `LitElement`, `html`, `css`, `svg`, `nothing` | This page's Lit. |
| `i18n`, `t` | This page's i18next instance. |

Plain JavaScript has no decorators, so declare reactive state with
`static properties = { name: { state: true } }` and initialise it in the
constructor — not as a class field, which would shadow Lit's accessor.

### `registerTool(entry)`

| Field | |
| :-- | :-- |
| `id` | The name a config uses: a toolbar item's `type`, or a standalone section name. |
| `tag` | The custom element to build. Must contain a hyphen and be defined before or right after registering. |
| `placement` | `toolbar` (item in a toolbar, opens a panel), `standalone` (map furniture placed by its own `tools.<id>` section), or `both`. |
| `label`, `icon` | Toolbar button caption/tooltip and Shoelace icon name; also what setup.html shows. |
| `aliases` | Optional other spellings. |
| `offered` | `false` to keep it out of setup.html's lists. |
| `configTemplate` | Optional object: the default `tools.<id>` section, used by setup.html. |

A plugin cannot replace a built-in tool: an `id`, alias or `tag` that is
already taken is refused. To change a built-in tool, see Pattern 2.

Tool parameters live in the config section named after the id, and the tool
reads them as `this.toolsConfig?.<id>`:

```json
"tools": {
  "bookmarks": { "enabled": true, "views": [{ "label": "Amsterdam", "center": [4.9, 52.37], "zoom": 12 }] }
}
```

A plugin can register a `configTemplate`: its default config section. In
`testpages/setup.html` a plugin tool's ⚙ button edits that section (arrays and
objects as JSON), starting from the template when the config has none, and a
plugin tool placed on a toolbar without a section gets the template written
into the config. The bookmarks plugin's template holds World, Amsterdam and the
Eiffel Tower; the plugin itself has no built-in views, so what the config says
is what it shows.

### Naming the plugin in a config

```json
{
  "plugins": ["../plugins/bookmarks.js"],
  "tools": {
    "mainToolbar": { "type": "toolbar", "enabled": true, "items": [{ "type": "bookmarks" }] }
  }
}
```

Each plugin is imported and its `register()` awaited **before** the config is
validated and its toolbars built, so its tool ids are known at that point. This
happens on every entry point: `?config=`, a map's `src`, a dropped config, and
`WebMapX.mount`. A plugin named by several configs on one page is loaded once.

In `testpages/setup.html` the Tools tab has a **Plugins** section: the plugins
of the loaded config are loaded, their tools appear in the toolbar and
standalone lists, and a plugin can be added by URL (it is written into the
config's `plugins`).

### Where a plugin may be loaded from

- **The page's own origin**, by a path relative to the config file — so a
  plugin can sit beside the configs on a passive web server.
- **A trusted CDN**: `https://cdn.jsdelivr.net/npm/`, `https://unpkg.com/`,
  `https://esm.sh/`. Pin an exact version; `@latest` changes under your users.

Anything else is skipped with a console warning. A relative path in a config
fetched from another origin resolves to *that* origin and is refused.

A plugin is code running with the page's full rights, and the CDN list only
limits *where* it comes from, not *who* published it: anyone can publish to npm.
Only name plugins you trust. If your page sets a `Content-Security-Policy`, add
the CDNs you use to `script-src`.

### Validation

The browser validator knows a plugin's tools once it has loaded. The CLI
validator (`webmapx-validate`) never runs plugins, so it reports their tool
names as unknown — with a hint that they may come from a plugin — as warnings,
not errors.

### Locale strings

```js
register(api) {
  api.i18n.addResourceBundle('en', 'my-plugin', { add: 'Add view' });
  api.i18n.addResourceBundle('nl', 'my-plugin', { add: 'Weergave toevoegen' });
  // in render(): api.t('my-plugin:add')
}
```

Most of webmapx's own UI is not translated yet, so this only affects the
plugin's own text.

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

For a plugin loaded through `plugins`, take runtime values from `register(api)`
and use these imports for **types only** (`import type`). An app that bundles
webmapx itself (one copy) may import them directly, including `registerTool`:

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
