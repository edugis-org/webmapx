# Webmapx Layer Overview

The `<webmapx-layer-overview>` component renders the currently visible layers as a flat, scrollable list split into two sections:

- overview layers
- background layers

This is the first slice of a richer layer-management UI. It currently shows titles only; legends and drag-reordering are future work.

## Usage

Place the component inside a tool panel and give it a matching `tool-id` if you want to open it from the toolbar.

```html
<webmapx-tool-panel label="Lagen">
  <webmapx-layer-overview tool-id="layer-overview"></webmapx-layer-overview>
</webmapx-tool-panel>

<webmapx-toolbar>
  <sl-button name="layer-overview" circle>
    <sl-icon name="layers"></sl-icon>
  </sl-button>
</webmapx-toolbar>
```

## Data Source

The component reads:

- `catalog.tree` for layer labels and top-level grouping
- `visibleLayers` from the map state store for the currently active layers

Visible layers are rendered top-first, so the most recently added layer appears first in the list.

## Attributes

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `background-group-label` | string | `Base Maps` | Top-level tree group treated as background layers. |
| `background-title` | string | `Achtergrondlagen` | Heading label for the background section. |
| `overview-title` | string | `Gekozen kaartlagen` | Heading label for the overview section. |

## Notes

- If the list grows taller than the available panel space, the component scrolls vertically.
- Layers that are visible but not present in `catalog.tree` fall back to their layer id as the label.
- This version does not yet render legends or support manual reordering.
