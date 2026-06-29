# Tool: layerOverview

A legend panel showing all active layers. Each layer has a visibility toggle, opacity slider, and legend entries (color swatches for styled layers).

Users can reorder layers by dragging. Background layers are shown separately and can be switched.

**Tool id:** `layerOverview`  
**Load:** bundled (always available)

## Example

```js
tools: ['layerOverview']
```

## Background layer switching

Define background layers with `background-group-policy: 'single'` to make them mutually exclusive (radio-button behavior):

```json
{
  "layerData": {
    "sources": {
      "osm": { "type": "raster", "service": "xyz", "url": "https://tile.openstreetmap.org/{z}/{x}/{y}.png", "tileSize": 256 },
      "satellite": { "type": "raster", "service": "xyz", "url": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", "tileSize": 256 }
    },
    "layers": {
      "osm":       { "id": "osm",       "type": "raster", "source": "osm",       "title": "OpenStreetMap", "metadata": { "background-group": "base", "background-group-policy": "single" } },
      "satellite": { "id": "satellite", "type": "raster", "source": "satellite", "title": "Satellite",     "metadata": { "background-group": "base", "background-group-policy": "single" } }
    }
  },
  "state": {
    "activeLayers": [
      { "ref": "osm",       "visible": true  },
      { "ref": "satellite", "visible": false }
    ]
  }
}
```

← [All tools](./overview.md)
