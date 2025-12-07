# `gis-inset-map`

Provides a miniature map that mirrors the main map's center/zoom so users always know where they are relative to the broader area.

## What It Does
- Renders its own MapLibre instance with a lightweight basemap (override via `style-url`).
- Subscribes to the central store; whenever the main map's center or zoom changes, the inset updates automatically.
- Applies a configurable `zoom-offset` so the inset can stay more zoomed out (default `-3`).

## Usage
```html
<gis-map-layout>
  <gis-inset-map slot="top-right" zoom-offset="-4" style-url="https://demotiles.maplibre.org/style.json"></gis-inset-map>
</gis-map-layout>
```

## Attributes
| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `zoom-offset` | number | `-3` | Added to the main map's zoom before rendering the inset. Use negative values to zoom out. |
| `style-url` | string | MapLibre demo style | Optional custom style URL for the inset. |
| `base-scale` | number | `0.5` | Base CSS scale applied to the 512×512 inset canvas. For derived zoom ≤ 0, the inset stays at zoom 0 and holds this scale steady.

## Behavior
- Host element defines its own size via CSS variables `--gis-inset-width` / `--gis-inset-height` (defaults 256px). Internally, the map renders on a 512×512 canvas that is scaled down via CSS. The controller animates `--gis-inset-scale` between the configured base value (for derived zoom ≤ 0) and 1 (as zoom increases) before handing off additional zoom to MapLibre.
- Interactions are disabled—this map is a passive indicator. If you want it to drive the main map, wire that through a dedicated adapter/controller per the architecture guidelines.
