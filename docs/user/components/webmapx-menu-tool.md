# Webmapx Menu Tool

`<webmapx-menu-tool>` is a *container* tool: it holds other tools and presents them as a labelled, drill-in list inside a single tool panel. It is the alternative to [`webmapx-toolbox-tool`](#relation-to-the-toolbox), which shows the same kind of sub-tools as a flat row of icon buttons.

Use it when a toolbar has more tools than fit comfortably as buttons, or when the tools group naturally into categories ("Analysis", "Data", "Export").

## Features

- **Labelled rows** — each sub-tool is a row with icon and name, so tools stay recognisable without hovering for a tooltip.
- **Submenus, any depth** — a menu can contain menus. Clicking a submenu drills into it; a back button and breadcrumb trail lead back out.
- **Search** — appears once the menu holds 8 or more tools. It matches across every level and shows each hit's submenu path.
- **Single active tool** — opening a tool replaces the list; closing it returns to the submenu the tool lives in.
- **Transient** — closing the tool panel resets the menu to its top level.

## Configuration

Add an item of `type: "menu"` to a toolbar. Nest further `menu` items for submenus:

```json
{
  "tools": {
    "mainToolbar": {
      "type": "toolbar",
      "enabled": true,
      "items": [
        {
          "type": "menu",
          "id": "tools",
          "label": "Tools",
          "icon": "list",
          "items": [
            { "type": "measure", "id": "measure" },
            { "type": "info", "id": "info" },
            {
              "type": "menu",
              "id": "analysis",
              "label": "Analysis",
              "icon": "diagram-3",
              "items": [
                { "type": "buffer", "id": "buffer" },
                { "type": "isochrone", "id": "isochrone" }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

The menu's own `label` and `icon` are used for its toolbar button and panel title; a submenu's `label` and `icon` are used for its row in the parent list. Both fall back to sensible defaults per tool type. Sub-item `id`s must be unique within one menu, at every depth.

Set `enabled: false` on any item (including a submenu) to leave it out.

The [config editor](../config-editor.md) (`testpages/setup.html`) lists `Menu` among the toolbar tools and shows a "contents" section for it. Submenus nested more than one level deep are preserved when saving, but are edited by hand in the config JSON.

## Markup usage

When writing HTML directly instead of using a config file, sub-tools are **direct children** of the menu at every depth — nesting is expressed by the `menu-path` attribute, not by nesting elements. This keeps deep sub-tools reachable by the menu's content slot.

```html
<webmapx-menu-tool
  tool-id="tools"
  label="Tools"
  groups='[{"path":"analysis","label":"Analysis","icon":"diagram-3"}]'>

  <webmapx-measure-tool
    tool-id="measure"
    label="Measure"
    menu-icon="rulers">
  </webmapx-measure-tool>

  <webmapx-buffer-tool
    tool-id="buffer"
    label="Buffer"
    menu-path="analysis">
  </webmapx-buffer-tool>
</webmapx-menu-tool>
```

### Attributes on the menu

| Attribute | Type | Description |
|-----------|------|-------------|
| `tool-id` | string | ID matching the toolbar button that opens the menu. |
| `label` | string | Panel title. |
| `groups` | JSON string | Array of `{ path, label, icon }` describing each submenu. A submenu with no entry here falls back to its path segment as label. |

### Attributes read from each sub-tool

| Attribute | Purpose |
|-----------|---------|
| `tool-id` (or `name`) | Unique ID used to activate/deactivate |
| `label` | Row label and search keyword |
| `menu-path` | Slash-joined submenu ids this tool lives in; absent or empty = top level |
| `menu-icon` | Shoelace icon name for the row |
| `menu-icon-src` | URL of a same-origin SVG, for tools with a custom icon |
| `menu-keywords` | Comma-separated extra search terms |

`toolbox-icon` / `toolbox-keywords` are accepted as fallbacks, so a tool list can move between the two containers unchanged.

## Relation to the toolbox

Both containers hold sub-tools, call `activate()` / `deactivate()` on them when switching, and keep them out of the global `ToolManager` — a modal sub-tool inside a container is managed by the container, not by the map-wide mutual exclusion.

| | `webmapx-toolbox-tool` | `webmapx-menu-tool` |
|---|---|---|
| Presentation | Horizontal scrolling row of icon buttons | Vertical list of labelled rows |
| Nesting | Flattened — nested containers contribute their tools to one row | Drill-in submenus with back button and breadcrumb |
| Search | Shown when the icon row overflows | Shown from 8 tools onward, matches every level |
| Best for | A handful of frequently-used tools | Many tools, or tools that group into categories |

A toolbar can hold both, and either may be nested inside the other in config (a toolbox flattens whatever it is given).

## See also

- [`webmapx-toolbar`](./webmapx-toolbar.md)
- [`webmapx-tool-panel`](./webmapx-tool-panel.md)
- [Toolbar and Panel Interaction Guide](./interaction-guide.md)
- [Creating tools](../../developer/creating-tools.md) — container integration for tool authors
