# Configuration

WebMapX uses JSON configuration files to define maps, data sources, layers, and tools. The app loads configuration at startup and applies it to all maps on the page.

## Loading Configuration

### URL Parameter

Pass a config file via the `config` query parameter:

```
https://example.com/?config=./config/demo.json
https://example.com/?config=/api/configs/production.json
```

When present, this overrides all other configuration sources for maps on the page.

### Per-Map Configuration

Individual `<webmapx-map>` elements can specify their own config via the `src` attribute. See [webmapx-map](./components/webmapx-map.md) for details.

## Configuration File Format

A configuration file has three main sections:

```json
{
  "map": { ... },
  "catalog": { ... },
  "tools": { ... }
}
```

### Map Section

Defines the base map settings.

```json
{
  "map": {
    "label": "My Map",
    "center": [4.9041, 52.3676],
    "zoom": 10,
    "minZoom": 1,
    "maxZoom": 18,
    "type": "maplibre"
  }
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `label` | string | No | Display name for the map |
| `center` | [number, number] | Yes | Initial center as [longitude, latitude] |
| `zoom` | number | Yes | Initial zoom level (0-24) |
| `minZoom` | number | No | Minimum zoom level |
| `maxZoom` | number | No | Maximum zoom level |
| `type` | string | Yes | Map adapter: `maplibre` or `openlayers` |

### Catalog Section

Defines data sources, layers, and the layer tree structure.

```json
{
  "catalog": {
    "label": "My Catalog",
    "sources": [ ... ],
    "layers": [ ... ],
    "tree": [ ... ]
  }
}
```

#### Sources

Data sources that layers reference.

```json
{
  "sources": [
    {
      "id": "osm-tiles",
      "type": "raster",
      "service": "xyz",
      "url": "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      "tileSize": 256,
      "attribution": "© OpenStreetMap contributors"
    },
    {
      "id": "earthquakes",
      "type": "geojson",
      "data": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
      "attribution": "USGS"
    }
  ]
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `type` | string | Yes | `raster`, `geojson`, or `vector` |
| `attribution` | string | No | Attribution text |

**Raster sources** (`type: "raster"`):
| Property | Type | Description |
|----------|------|-------------|
| `service` | string | `xyz`, `wms`, or `wmts` |
| `url` | string | Tile URL template or service endpoint |
| `tileSize` | number | Tile size in pixels (default: 256) |

**GeoJSON sources** (`type: "geojson"`):
| Property | Type | Description |
|----------|------|-------------|
| `data` | string or object | URL to GeoJSON file or inline GeoJSON |

**Vector sources** (`type: "vector"`):
| Property | Type | Description |
|----------|------|-------------|
| `url` | string | URL to vector tiles or TileJSON |

#### Layers

Layers reference sources and define how data is rendered.

```json
{
  "layers": [
    {
      "id": "osm",
      "layerset": [
        { "type": "raster", "source": "osm-tiles" }
      ]
    },
    {
      "id": "earthquakes",
      "layerset": [
        { "type": "circle", "source": "earthquakes" }
      ]
    }
  ]
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (referenced by tree) |
| `layerset` | array | Yes | One or more style layers |

**Style layer properties:**
| Property | Type | Description |
|----------|------|-------------|
| `type` | string | `fill`, `line`, `circle`, `symbol`, or `raster` |
| `source` | string | Reference to a source ID |
| `sourceLayer` | string | Source layer name (for vector tiles) |
| `minZoom` | number | Minimum visibility zoom |
| `maxZoom` | number | Maximum visibility zoom |
| `paint` | object | Paint properties (colors, widths, etc.) |
| `layout` | object | Layout properties |
| `filter` | array | Filter expression |

#### Tree

Hierarchical structure for the layer tree UI.

```json
{
  "tree": [
    {
      "label": "Base Maps",
      "expanded": true,
      "children": [
        { "label": "OpenStreetMap", "layerId": "osm", "checked": true }
      ]
    },
    {
      "label": "Data Layers",
      "expanded": true,
      "children": [
        { "label": "Earthquakes", "layerId": "earthquakes", "checked": false }
      ]
    }
  ]
}
```

| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Display text |
| `layerId` | string | Reference to a layer ID (leaf nodes) |
| `checked` | boolean | Initial visibility state |
| `expanded` | boolean | Initial expanded state (group nodes) |
| `children` | array | Child nodes (group nodes) |

### Tools Section

Enables and configures UI tools.

```json
{
  "tools": {
    "coordinates": { "enabled": true },
    "layerTree": { "enabled": true },
    "legend": { "enabled": false }
  }
}
```

## Validation

Configuration files are validated at load time. The validator checks:

- Required properties are present
- Values have correct types
- Cross-references are valid (e.g., `layerId` references existing layer)
- Source IDs are unique

Errors prevent the config from loading. Warnings are logged to the console.

## Example

See `config/demo.json` for a complete example configuration.
