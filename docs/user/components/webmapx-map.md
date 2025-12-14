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
| `type` | string | Map adapter: `maplibre` or `openlayers`. |
| `adapter` | string | Alias for `type`. |

### Configuration Priority

When the app initializes a map, configuration is resolved with this priority (highest to lowest):

1. App-level config (see [Configuration](../configuration.md))
2. `src` attribute (map-specific config file)
3. Individual attributes (`center`, `zoom`, etc.)
4. Default values

### Examples

```html
<!-- Minimal: uses defaults -->
<webmapx-map id="map1"></webmapx-map>

<!-- With inline attributes -->
<webmapx-map id="map2" center="[10, 50]" zoom="8" type="openlayers"></webmapx-map>

<!-- With config file -->
<webmapx-map id="map3" src="./config/my-map.json"></webmapx-map>
```

## Behavior

- Automatically creates a map surface if none is provided, styles it (`position:absolute; top/right/bottom/left:0; width/height:100%`).
- Keeps the surface synchronized if you later insert your own `[slot="map-view"]` node.
- Leaves default slot content untouched, so any overlay component can be appended directly.

## JavaScript API

Access the map adapter via the `adapter` property:

```js
const mapElement = document.getElementById('map-container');
const adapter = mapElement.adapter;

// Get current viewport
const { center, zoom } = adapter.core.getViewportState();

// Set viewport
adapter.core.setViewport([5.0, 52.0], 10);
```
