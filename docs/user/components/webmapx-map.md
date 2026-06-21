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

Dropping files onto the map (or using the Import layer tool) adds them as new layers. The same formats are supported in both cases.

### Supported formats

| Format | Extensions | Notes |
|--------|-----------|-------|
| GeoJSON | `.geojson`, `.json` | Added as a vector layer |
| TopoJSON | `.topojson`, `.json` | One source per object; multi-object files create multiple sources |
| Shapefile | `.shp` + `.dbf` + `.prj` | Drop all three files together, or in a ZIP; reprojection to WGS84 runs in a Web Worker. Include a matching `.qml` for styling (see below). |
| GPX | `.gpx` | Tracks, routes and waypoints converted to GeoJSON |
| KML | `.kml` | Placemarks and styles converted to GeoJSON |
| KMZ | `.kmz` | ZIP containing KML; KML is extracted and converted |
| CSV | `.csv` | Rows with coordinate columns converted to GeoJSON Point features — see [CSV import](#csv-import) below |
| MapLibre style | `style.json` | Added as a composite style layer with all sub-layers/sources |
| ZIP archive | `.zip` | Contents unzipped and processed as a group. Common use cases: shapefile bundle (`.shp` + `.dbf` + `.prj` + optional `.qml`), GeoJSON + style.json, multiple GeoJSON files |
| QGIS style | `.qml` | Dropped alongside (or zipped with) a matching data file — fill, line and circle symbology applied to the generated layer |
| WebMapX config | `.json` | Detected automatically; reloads the page with the dropped config |

Dropped vector data gets default fill/line/point styling based on geometry types present, or the `.qml` style if one was included. If a layer with the same id already exists, the new layer is added with a numeric suffix (`_1`, `_2`, ...).

While processing, the map shows its busy spinner. Unrecognized files are listed in an alert.

### CSV import

CSV files are converted to GeoJSON Point features. A longitude and latitude column must be present. Column names are matched case-insensitively; the following names are recognized:

| Coordinate | Recognized column names |
|-----------|------------------------|
| Longitude | `lon`, `lng`, `longitude`, `long`, `x`, `longitud` (ES), `lengtegraad` / `lengte` (NL), `längengrad` / `laengengrad` / `länge` / `laenge` (DE) |
| Latitude | `lat`, `latitude`, `y`, `latitud` (ES), `breedtegraad` / `breedte` (NL), `breitengrad` / `breite` (DE) |

All other columns become feature properties. Rows with missing or non-numeric coordinates are skipped. If no coordinate columns are found, a warning is logged to the console and the file is skipped.

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
