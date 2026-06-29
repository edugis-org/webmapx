# Tool Reference

All tools load on demand — only what you list in `tools: [...]` is fetched.

**Bundled** tools are always available (no extra load). **Lazy** tools are fetched the first time a page using them loads.

## Map controls (bundled)

| Tool id | What it does | Doc |
|---|---|---|
| `fullscreen` | Toggle fullscreen | [→](./fullscreen.md) |
| `navigation` | Zoom +/− and compass buttons | [→](./navigation.md) |
| `scaleControl` | Scale bar | [→](./scale.md) |
| `zoomLevel` | Shows current zoom level | [→](./zoom-level.md) |
| `layerOverview` | Layer legend + visibility toggle | [→](./layer-overview.md) |
| `layerTree` | Layer tree (alternative to layerOverview) | [→](./layer-overview.md) |
| `attributionControl` | Map attribution text | built-in |

## Interactive tools (lazy-loaded)

| Tool id | What it does | Doc |
|---|---|---|
| `coordinates` | Show cursor coordinates; click to copy | [→](./coordinates.md) |
| `info` | Click features to inspect properties | [→](./info.md) |
| `measure` | Measure distances and areas | [→](./measure.md) |
| `draw` | Draw and edit geometries | [→](./draw.md) |
| `search` | Geocoder / place search | [→](./search.md) |
| `print` | Export map as PNG/PDF | [→](./print.md) |
| `geolocation` | Show and follow device location | [→](./geolocation.md) |
| `importLayer` | Import local files (GeoJSON, GPX, KML, Shapefile, GML, FlatGeobuf, GPKG) | [→](./import.md) |
| `buffer` | Create buffer zones around features | [→](./buffer.md) |
| `truearea` | Calculate area corrected for map projection | [→](./truearea.md) |
| `3d` | Switch between 2D / 3D (pitch/bearing) view | [→](./3d.md) |
| `view-mode` | Toggle map projection (mercator ↔ globe) | [→](./view-mode.md) |
| `routing` | Route planning between two points | [→](./routing.md) |
| `isochrone` | Reachability areas from a point | [→](./isochrone.md) |
| `maplanguage` | Switch OSM vector tile label language | [→](./maplanguage.md) |
| `settings` | User settings panel | built-in |

## Quick-copy: all tools

```js
tools: [
  'fullscreen', 'navigation', 'scaleControl', 'zoomLevel',
  'layerOverview', 'coordinates', 'info', 'measure', 'draw',
  'search', 'print', 'geolocation', 'importLayer',
  'buffer', 'truearea', '3d', 'view-mode', 'routing', 'isochrone'
]
```
