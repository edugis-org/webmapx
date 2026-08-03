# Creating Tools in WebMapX

This is the primary reference for building new tools. Read it before writing any tool code.

The companion file [creating-modal-tools.md](creating-modal-tools.md) has deeper detail on the modal lifecycle; this file covers the full picture: non-modal tools, map controls, toolbar and container (toolbox/menu) integration, config wiring, and accessibility.

---

## Tool taxonomy

Every interactive or display component in WebMapX is a **tool**. There are three kinds:

| Kind | Base class | Description | Examples |
|------|-----------|-------------|---------|
| **Non-modal tool** | `WebmapxBaseTool` | Passively observes map state. Multiple can be active simultaneously. | coordinates display, zoom level, scale bar, spinner |
| **Modal tool** | `WebmapxModalTool` | Captures user interaction exclusively. Only one active at a time. | measure, info, draw, search, geolocation |
| **Map control** | `WebmapxBaseTool` | Visual control embedded in the map viewport. Treated as a tool for registration, icon, label, and optional toggle visibility. | navigation control, fullscreen, attribution, inset map |

Map controls are **not a separate base class** — they extend `WebmapxBaseTool` (or `WebmapxModalTool` when they need exclusive activation). What makes them "controls" is their position inside the map viewport and their self-contained rendering (no tool panel). They still MUST have a `label` and, where applicable, an icon so that a toolbar button can optionally show/hide them.

---

## Decision tree: which base class?

```
Does the tool need exclusive map-event capture
(click, pointer-move, drag)?
  └─ Yes → WebmapxModalTool
  └─ No → Does it render inside the map viewport
            as a floating widget?
              └─ Yes → WebmapxBaseTool  (map control)
              └─ No  → WebmapxBaseTool  (non-modal tool / panel content)
```

---

## WebmapxBaseTool — non-modal tools and controls

`src/components/webmapx-base-tool.ts`

### What it provides

- Automatic connection to `IMap` adapter and `MapStateStore` when the component is inserted inside `<webmapx-map>`.
- Waits for `webmapx-map-ready` if the map is not yet initialized.
- Provides `this.adapter`, `this.store`, `this.config`, `this.toolsConfig`, `this.mapHost`.
- Calls `onMapAttached(adapter)` once connected, then `onStateChanged(state)` on every store update.
- Handles the **temporary-muting** pattern: set `this.isSettingValue = true` before dispatching to the store, reset it after, so `onStateChanged` is not re-entered from your own dispatch.

### Minimum implementation

```typescript
import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { WebmapxBaseTool } from './webmapx-base-tool';
import type { IMapState } from '../store/IMapState';

@customElement('webmapx-my-display')
export class WebmapxMyDisplay extends WebmapxBaseTool {
  static styles = css`:host { display: block; }`;

  protected onStateChanged(state: IMapState): void {
    // react to store state, e.g. state.zoomLevel
    this.requestUpdate();
  }

  protected render() {
    return html`<span>Hello map</span>`;
  }
}
```

### Key lifecycle hooks

```typescript
// Map adapter is now available; subscribe to adapter.events here.
protected onMapAttached(adapter: IMap): void { }

// Adapter is gone; unsubscribe everything here.
protected onMapDetached(): void { }

// Store state changed (and is not muted). Update reactive properties here.
protected onStateChanged(state: IMapState): void { }

// Called once when config is loaded (opt-in: call subscribeToConfig() in connectedCallback).
protected onConfigReady(config: AppConfig): void { }
```

### Subscribing to map events (non-modal)

Use `adapter.events.on(...)` directly. Keep the unsub function and call it in `onMapDetached`.

```typescript
private unsubView: (() => void) | null = null;

protected onMapAttached(adapter: IMap): void {
  super.onMapAttached(adapter);
  this.unsubView = adapter.events.on('view-change', (e) => {
    this.zoom = e.zoom;
  });
}

protected onMapDetached(): void {
  this.unsubView?.();
  this.unsubView = null;
  super.onMapDetached();
}
```

---

## WebmapxModalTool — modal tools

`src/components/webmapx-modal-tool.ts`

Extends `WebmapxBaseTool` and adds:

- **ToolManager registration** — auto-registers on map attach, auto-unregisters on detach.
- **Mutual exclusion** — activating one modal tool deactivates all others via `ToolManager`.
- `active` property (reflected to attribute) — drives `onActivate()` / `onDeactivate()`.
- `toggle()`, `activate()`, `deactivate()` public methods.
- **Portal rendering** via `render-target` attribute (optional).

### Required additions

```typescript
readonly toolId = 'my-tool';   // unique; must match toolbar button name=""
```

### Minimum implementation

```typescript
import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WebmapxModalTool } from './webmapx-modal-tool';
import type { ClickEvent } from '../store/map-events';

@customElement('webmapx-my-tool')
export class WebmapxMyTool extends WebmapxModalTool {
  readonly toolId = 'my-tool';

  @state() private result: string | null = null;
  private unsubClick: (() => void) | null = null;

  protected onActivate(): void {
    this.result = null;
    this.unsubClick = this.adapter?.events.on('click', (e: ClickEvent) => {
      this.result = `${e.coords[0].toFixed(4)}, ${e.coords[1].toFixed(4)}`;
    }) ?? null;
  }

  protected onDeactivate(): void {
    this.unsubClick?.();
    this.unsubClick = null;
  }

  protected render() {
    // IMPORTANT: root element must have class="tool-content" for portal support
    return html`
      <div class="tool-content">
        ${this.result ?? 'Click on the map'}
        <sl-button size="small" @click=${() => this.deactivate()}>Close</sl-button>
      </div>
    `;
  }
}
```

### Do not call native engine APIs directly

Tools MUST NOT call MapLibre / OpenLayers / Leaflet / Cesium APIs directly. Use:

- `this.adapter.*` — the engine-agnostic `IMap` interface methods.
- `this.adapter.events.on(...)` — engine-agnostic event bus.
- Store dispatch for state mutations.

This keeps tools engine-independent and testable.

---

## Map controls

Map controls are `WebmapxBaseTool` subclasses that render floating widgets inside the map viewport (zoom buttons, compass, scale bar, attribution, etc.).

Design rules:
- Always set `label` (and `icon` where an icon fits) so a toolbar button can optionally control visibility.
- Use only `adapter.*` and `adapter.events.*` — never native engine APIs.
- Subscribe to view events (`view-change`, `view-change-end`) in `onMapAttached`; unsubscribe in `onMapDetached`.
- Respect `adapter.getNavigationCapabilities()` before exposing bearing/pitch controls — not all engines support them.

Example control stub:

```typescript
@customElement('webmapx-my-control')
export class WebmapxMyControl extends WebmapxBaseTool {
  readonly label = 'My Control';
  readonly icon = { name: 'map' };

  protected onStateChanged(_state: IMapState): void { }

  protected render() {
    return html`<div class="control-shell">…</div>`;
  }
}
```

---

## Toolbar integration

`webmapx-toolbar` recognizes `sl-button` children by their `name` attribute.

```html
<webmapx-toolbar>
  <!-- Modal tool: ToolManager.toggle('my-tool') called on click -->
  <sl-button name="my-tool" title="My Tool">
    <sl-icon name="map" slot="prefix"></sl-icon>
  </sl-button>
</webmapx-toolbar>
```

Rules:
- `name` on the button must equal the tool's `toolId`.
- The toolbar syncs button active state automatically from `webmapx-tool-activated` / `webmapx-tool-deactivated` events.
- For non-modal tools (controls, displays) that have no `toolId` registered with `ToolManager`, the toolbar fires `webmapx-tool-select` and manages button state itself.

---

## Container integration (toolbox and menu)

Two components hold other tools inside one tool panel: `webmapx-toolbox-tool` (scrollable icon bar) and `webmapx-menu-tool` (drill-in list with submenus). Both call `activate()` / `deactivate()` on their children when switching, and both keep their children out of the global `ToolManager` — `webmapx-modal-tool` skips registration for anything inside a container, so the container alone decides which sub-tool is active. A modal tool that registered globally would be deactivated behind the container's back.

### Toolbox

Slot any tool inside it; the toolbox reads these attributes from each child:

| Attribute | Purpose |
|-----------|---------|
| `tool-id` (or `name`) | Unique ID used to activate/deactivate |
| `label` | Display label and search keyword |
| `toolbox-icon` | Shoelace icon name for the tab button |
| `toolbox-keywords` | Comma-separated extra search terms |

```html
<webmapx-toolbox-tool>
  <webmapx-measure-tool
    tool-id="measure"
    label="Measure"
    toolbox-icon="rulers">
  </webmapx-measure-tool>

  <webmapx-my-tool
    tool-id="my-tool"
    label="My Tool"
    toolbox-icon="map">
  </webmapx-my-tool>
</webmapx-toolbox-tool>
```

### Menu

`webmapx-menu-tool` shows the same kind of children as labelled rows and adds submenus. Nesting is expressed by a `menu-path` attribute rather than by nested elements — every sub-tool stays a *direct* child at any depth, so the menu's single content slot can reach it. Submenu labels/icons come from a `groups` attribute (JSON array of `{ path, label, icon }`).

| Attribute | Purpose |
|-----------|---------|
| `tool-id` (or `name`) | Unique ID used to activate/deactivate |
| `label` | Row label and search keyword |
| `menu-path` | Slash-joined submenu ids ('' or absent = top level) |
| `menu-icon` | Shoelace icon name for the row |
| `menu-icon-src` | Same-origin SVG URL, for tools with a custom icon |
| `menu-keywords` | Comma-separated extra search terms |

```html
<webmapx-menu-tool
  tool-id="tools"
  label="Tools"
  groups='[{"path":"analysis","label":"Analysis","icon":"diagram-3"}]'>

  <webmapx-measure-tool tool-id="measure" label="Measure" menu-icon="rulers">
  </webmapx-measure-tool>

  <webmapx-buffer-tool tool-id="buffer" label="Buffer" menu-path="analysis">
  </webmapx-buffer-tool>
</webmapx-menu-tool>
```

`toolbox-icon` / `toolbox-keywords` are read as fallbacks, so the same children work in either container.

Children must implement `activate()` / `deactivate()` (modal tools get this for free). Hide inactive children with `[hidden]` + `inert` rather than a forced `display` value — both containers do this, so a sub-tool keeps whatever `display` its own `:host` rule sets.

In config, both containers are declared as an item with an `items` array; `dynamic-layout.ts` builds the children recursively (`appendSubTools`) — see [configuration.md](../user/configuration.md#container-items-toolbox-and-menu).

---

## Config wiring

Tools can be declared in `config/demo.json` (or any config JSON) under `tools`:

```json
{
  "tools": {
    "mainToolbar": {
      "type": "toolbar",
      "enabled": true,
      "position": "top-left",
      "items": [
        { "type": "my-tool", "id": "my-tool", "enabled": true, "label": "My Tool" }
      ]
    },
    "my-tool": {
      "enabled": true,
      "label": "My Tool",
      "icon": { "name": "map" }
    }
  }
}
```

To make the config loader instantiate your tool automatically:

1. **Register the element tag** in `src/utils/dynamic-layout.ts`:

```typescript
// In TOOL_ELEMENT_TAGS:
'my-tool': 'webmapx-my-tool',

// In DEFAULT_TOOL_METADATA:
'my-tool': { label: 'My Tool', icon: 'map' },

// In KNOWN_TOOLS (makes it appear in setup.html):
{ id: 'my-tool', label: 'My Tool', icon: 'map' },
```

2. **Import your component** wherever the app entry point imports tools (check `src/components/index.ts` or the main entry).

Standalone / non-toolbar tools (controls, displays) go in `STANDALONE_TAGS` instead of `TOOL_ELEMENT_TAGS`.

---

## Reading tool config at runtime

Inside any tool, access the tools section of the loaded config:

```typescript
protected onConfigReady(config: AppConfig): void {
  const myConfig = config.tools?.['my-tool'];
  if (myConfig) {
    this.someOption = (myConfig as MyToolConfig).someOption ?? defaultValue;
  }
}
```

Call `this.subscribeToConfig()` in `connectedCallback` to receive `onConfigReady` callbacks.

---

## Accessibility checklist

- `WebmapxBaseTool.connectedCallback` auto-sets `aria-label` from `label` attribute or `toolId`. Provide a `label` on every tool.
- All interactive elements inside your render must be keyboard-operable (`button`, `input`, `sl-button`, etc.).
- Icon-only buttons need an accessible label: either a visually hidden `<span>`, `title`, or `aria-label`.
- Use `aria-pressed` on toggle buttons, `aria-expanded` on disclosure buttons.
- Toolbar arrow-key navigation is handled by `webmapx-toolbar`; you do not need to implement it.
- When tool is deactivated, `active` attribute is removed; use `[active]` CSS selectors rather than JS checks where possible.
- Use `inert` (already applied by the toolbox and menu containers) rather than `display:none` when hiding panels, so focus can never reach hidden content.
- Escape key should deactivate modal tools:

```typescript
protected onActivate(): void {
  this._escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') this.deactivate(); };
  document.addEventListener('keydown', this._escHandler);
}
protected onDeactivate(): void {
  document.removeEventListener('keydown', this._escHandler!);
  this._escHandler = null;
}
```

---

## File layout

Put new tools in `src/components/`:

```
src/components/
  webmapx-my-tool.ts        ← tool component
  webmapx-my-tool-dialog.ts ← separate dialog if needed (optional)
```

Register in `src/utils/dynamic-layout.ts` and import in `src/components/index.ts` (or equivalent entry point).

---

## Quick-start checklist

- [ ] Extend `WebmapxModalTool` (exclusive capture) or `WebmapxBaseTool` (passive / control)
- [ ] Set `toolId` (modal) or `label` + `icon` (control)
- [ ] Never call native engine APIs; use `adapter.*` and `adapter.events.*`
- [ ] Subscribe to map events in `onMapAttached` / `onActivate`; unsubscribe in `onMapDetached` / `onDeactivate`
- [ ] Wrap rendered content in `<div class="tool-content">` (modal tools, for portal support)
- [ ] Add `aria-label`, keyboard access, and Escape to close
- [ ] Register in `dynamic-layout.ts` (`TOOL_ELEMENT_TAGS`, `DEFAULT_TOOL_METADATA`, `KNOWN_TOOLS`)
- [ ] Declare in config JSON under `tools`
- [ ] Test in `testpages/setup.html` — tool should appear in the tool list

---

## Testing with setup.html / preview.html

The dev workflow for testing a new tool interactively:

### Setup

1. Start the dev server: `npm run dev`
2. Open `http://localhost:5173/testpages/setup.html` in one tab — this is the config builder.
3. Open `http://localhost:5173/testpages/preview.html` in a second tab (or use the link at the top of setup.html) — this is the live map.

### How it works

- **setup.html** reads `config/demo.json` (or `?config=path/to/other.json`), shows all known tools as checkboxes, and lets you toggle them on/off and edit their props.
- Clicking **"Update preview"** serialises the assembled config to `localStorage` key `webmapx-setup-config` and opens/reloads preview.html.
- **preview.html** reads that key from `localStorage` and mounts the full `WebMapX` app. It also listens for `storage` events, so it reloads automatically each time you push from setup.html.
- Overrides are **session-only** (in-memory in setup.html): refreshing setup.html starts fresh from `demo.json`.

### Making your tool appear in setup.html

setup.html builds its tool list from `KNOWN_TOOLS` exported by `src/utils/dynamic-layout.ts`. Your tool MUST be registered there (see "Config wiring" above). Without that registration setup.html will not know the tool exists.

Toolbar tools appear in the **"Toolbar"** section with drag-to-reorder handles. Standalone/control tools appear in the **"Map controls"** section.

### Testing checklist

1. Register the tool in `dynamic-layout.ts`, then verify it appears in setup.html with its label and icon.
2. Check the tool in setup.html, click **"Update preview"** — confirm the element is rendered in the live map.
3. Open the browser devtools console in preview.html and confirm no errors on mount.
4. Test activation / deactivation (toolbar button click, keyboard, Escape to close for modal tools).
5. Test in at least MapLibre and one other engine (switch `map.type` in demo.json or via the active-adapter control).
6. Test **keyboard navigation**: Tab to the toolbar button, Enter to activate, Escape to deactivate, arrow keys to move between toolbar buttons.
7. Run `npx tsc --noEmit` and `npm run check:architecture` before committing.

### Prop editing in setup.html

Each tool's ⚙ icon (appears on hover) opens a prop editor popup. Fields are generated from the tool's config object in `demo.json`. Add a well-typed entry for your tool in `demo.json` and users can tweak it without editing JSON.

### Download config

"Download config" in setup.html saves the fully assembled JSON (with all overrides baked in) as a file. Use this to capture a specific test configuration for bug reports or regression testing.

---

## See also

- [creating-modal-tools.md](creating-modal-tools.md) — deep dive on modal lifecycle and patterns
- [tool-manager.md](tool-manager.md) — ToolManager API reference
- `src/components/webmapx-example-tool.ts` — minimal annotated modal tool
- `src/components/webmapx-navigation-control.ts` — example map control
- `src/components/webmapx-coordinates-tool.ts` — example non-modal display tool
