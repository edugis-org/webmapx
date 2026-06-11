# `webmapx-map`

Host element for the mapping library canvas plus any overlay UI. It injects a `[slot="map-view"]` surface automatically, so you can simply drop it in your markup.

## Usage

```html
<webmapx-map id="map-container">
  <!-- Optional: overlays, layouts, tools -->
  <webmapx-layout>
    <webmapx-zoom-level slot="bottom-left"></webmapx-zoom-level>
  </webmapx-layout>
</webmapx-map>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | string | Required. Identifies the map for initialization. |
| `src` | string | URL to a JSON config file. Overrides individual attributes. |
| `center` | JSON | Initial center as `[longitude, latitude]`. Example: `center="[4.9, 52.4]"` |
| `zoom` | number | Initial zoom level (0-24). |
| `min-zoom` | number | Minimum allowed zoom level. |
| `max-zoom` | number | Maximum allowed zoom level. |
| `adapter` | string | Preferred map adapter. Takes precedence over config. |
| `type` | string | Legacy alias for `adapter`. |

### Configuration Priority

When the app initializes a map, configuration is resolved with this priority (highest to lowest):

1. App-level config (see [Configuration](../configuration.md))
2. `src` attribute (map-specific config file)
3. Individual attributes (`center`, `zoom`, etc.)
4. Default values

Adapter selection is resolved separately. The order is:

1. A map-scoped Settings preference stored under `webmapx-adapter:<map-id>`
2. `adapter` attribute on the element
3. The resolved map config's `type`
4. Default adapter (`maplibre`)

### Examples

```html
<!-- Minimal: uses defaults -->
<webmapx-map id="map1"></webmapx-map>

<!-- With inline attributes -->
<webmapx-map id="map2" center="[10, 50]" zoom="8" adapter="openlayers"></webmapx-map>

<!-- With config file -->
<webmapx-map id="map3" src="./config/my-map.json"></webmapx-map>
```

## Behavior

- Automatically creates a map surface if none is provided, styles it (`position:absolute; top/right/bottom/left:0; width/height:100%`).
- Keeps the surface synchronized if you later insert your own `[slot="map-view"]` node.
- Leaves default slot content untouched, so any overlay component can be appended directly.

## Drag-and-drop file import

Dropping files onto the map adds them as new layers. Supported formats:

- **GeoJSON** (`.geojson`/`.json`) and **TopoJSON** — added as a vector layer (one source per object, for TopoJSON with multiple objects).
- **Shapefiles** — `.shp` + `.dbf` + `.prj` (projection used for reprojection to WGS84), individually or zipped together. Parsing/reprojection runs in a Web Worker.
- **MapLibre `style.json`** — added as a composite style layer with all its sub-layers/sources.
- **QGIS `.qml`** style files — when dropped alongside a matching shapefile/GeoJSON, its symbology is applied to the generated layer.
- A **`.zip`** containing any combination of the above (e.g. `.shp`/`.dbf`/`.prj`/`.qml`) is unzipped and processed as one group.

Dropped vector data gets default fill/line/point styling based on the geometry types present, or the `.qml` style if one was included. If a layer with the same id already exists, the new layer is added with a numeric suffix (`_1`, `_2`, ...).

While processing, the map shows its busy spinner. Unsupported or unrecognized files (e.g. `.csv`, `.gpx`, `.kml`, `.xlsx`) are not added — a summary of detected file types is shown in an alert instead.

## JavaScript API

Access the map adapter via the `adapter` property:

```js
const mapElement = document.getElementById('map-container');
const map = mapElement.adapter;

// Get current viewport
const { center, zoom } = map.getViewportState();

// Set viewport
map.setViewport([5.0, 52.0], 10);
```
