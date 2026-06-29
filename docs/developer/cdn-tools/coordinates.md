# Tool: coordinates

Shows cursor coordinates in the map corner. Click to copy to clipboard. Supports multiple formats (decimal degrees, DMS, RD, etc.).

**Tool id:** `coordinates`  
**Load:** lazy

## Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Coordinates tool</title>
  <script type="importmap">
  { "imports": { "maplibre-gl": "https://esm.sh/maplibre-gl@5" } }
  </script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplibre-gl@5/dist/maplibre-gl.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@edugis-org/webmapx@latest/dist-lib/webmapx.css">
  <style>html,body{margin:0;width:100%;height:100%;overflow:hidden}#map{width:100%;height:100%}</style>
</head>
<body>
  <div id="map"></div>
  <script type="module">
    import { WebMapX } from 'https://cdn.jsdelivr.net/npm/@edugis-org/webmapx@latest/dist-lib/webmapx.js';
    WebMapX.mount('#map', {
      config: {
        engine: 'maplibre',
        tools: ['coordinates'],
        map: { center: [5, 52], zoom: 7 },
        layerData: {
          sources: { osm: { type: 'raster', service: 'xyz', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', tileSize: 256, attribution: '&copy; OpenStreetMap contributors' } },
          layers: { osm: { id: 'osm', type: 'raster', source: 'osm', title: 'OpenStreetMap' } }
        },
        state: { activeLayers: [{ ref: 'osm', visible: true }] }
      }
    });
  </script>
</body>
</html>
```

## Config options

The coordinates tool reads its default format from the app config:

```json
{
  "tools": {
    "coordinatesTool": {
      "type": "coordinates",
      "defaultFormat": "dms"
    }
  }
}
```

Available formats: `"dd"` (decimal degrees), `"dms"`, `"rd"` (Dutch RD New), `"utm"`.

← [All tools](./overview.md)
