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

- `visibleLayers` from the map state store for the currently active layers
- `runtimeLayerMetadata` from the map state store for labels and optional grouping/legend role

Visible layers are rendered top-first, so the most recently added layer appears first in the list.

## Attributes

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `background-group-label` | string | `Base Maps` | Fallback group label treated as background when `runtimeLayerMetadata.legendRole` is not set. |
| `background-title` | string | `Achtergrondlagen` | Heading label for the background section. |
| `overview-title` | string | `Gekozen kaartlagen` | Heading label for the overview section. |

## Notes

- If the list grows taller than the available panel space, the component scrolls vertically.
- Layers that are visible but have no metadata label fall back to their layer id.
- This version does not yet render legends or support manual reordering.
