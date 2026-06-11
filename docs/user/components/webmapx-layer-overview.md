# Webmapx Layer Overview

The `<webmapx-layer-overview>` component renders the currently active layers as a scrollable list split into two sections:

- overview layers (added/overlay layers)
- background layers (base maps)

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

The component reads `mapLayers` from the map state store — the engine-neutral registry of all layers currently known to the map. Layers are split into the overview/background sections based on `legendRole` metadata (or the `background-group-label` fallback).

Layers are rendered top-first: the most recently added (or most recently moved-to-top) layer appears first in the list.

## Per-layer controls

Each layer card shows:

- **Visibility toggle** — show/hide the layer.
- **Collapse/expand** — expand a layer to reveal its details (legend, opacity, actions).
- **Drag handle** — appears on hover (when more than one layer is present); drag to reorder layers. A black line shows where the layer will be dropped. See [Reordering layers](#reordering-layers).

When a layer is expanded and visible, its details show:

- **Opacity slider** — adjusts layer transparency (0–100%). The current value is shown briefly while dragging.
- **Legend** (`webmapx-layer-legend`, internal) — automatically renders swatches/rows for the layer's paint style (fill, line, circle, symbol, raster, composite styles), or an image from `metadata.legendurl` if provided.
- **Group label** — shown if the layer config sets `topLevelGroup`.
- **Info button** — opens a dialog (`webmapx-layer-info-dialog`, internal) with the layer's `metadata.abstract` (HTML, sanitized) and attribution, if configured.
- **Delete button** (overview section only) — removes the layer from the map.

A **"Save layer(s)…"** button is shown below the overview section (UI placeholder for future export functionality).

## Reordering layers

Drag a layer card by its handle to change its stacking order. While dragging:

- A thin black line indicates the drop target — above or below the legend item the dragged card currently overlaps.
- Dropping commits the new order: it updates `store.mapLayers` and reorders the layer in the map engine via `adapter.moveLayer()`.

**Engine-specific limits:**

- **Cesium**: vector layers (entities/primitives) always render above all imagery layers — this is inherent to Cesium's rendering model. Reordering across raster/vector boundaries has no visual effect; only within-type order changes.
- **Leaflet**: raster and vector layers currently use Leaflet's default panes (fixed relative stacking), so cross-type reordering also has no visual effect yet. This is a known limitation, planned to be fixed.
- **MapLibre** and **OpenLayers** support full single-stack reordering.

## Attributes

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `background-group-label` | string | `Base Maps` | Fallback group label treated as background when `legendRole` is not set. |
| `background-title` | string | `Achtergrondlagen` | Heading label for the background section. |
| `overview-title` | string | `Gekozen kaartlagen` | Heading label for the overview section. |

## Notes

- If the list grows taller than the available panel space, the component scrolls vertically (auto-scrolling also occurs near the edges while dragging).
- Layers that are visible but have no metadata label fall back to their layer id.
