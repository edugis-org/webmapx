# Configuration

WebMapX uses JSON configuration files to define maps, data sources, layers, and tools. The app can load a page-level config via `?config=` or a per-map config via the `src` attribute on `<webmapx-map>`.

## Loading Configuration

### URL Parameter

Pass a config file via the `config` query parameter:

```
https://example.com/?config=./config/demo.json
https://example.com/?config=/api/configs/production.json
```

When present, this overrides per-map configuration sources for maps on the page.

### Per-Map Configuration

Individual `<webmapx-map>` elements can specify their own config via the `src` attribute. See [webmapx-map](./components/webmapx-map.md) for details.

## Configuration File Format

A configuration file usually has four main sections:

```json
{
  "map": { ... },
  "layerData": { ... },
  "state": { ... },
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
    "type": "maplibre",
    "style": {
      "sources": {
        "osm": {
          "type": "raster",
          "tiles": ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          "tileSize": 256
        }
      },
      "layers": [
        { "id": "background", "type": "raster", "source": "osm" }
      ]
    }
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
| `type` | string | Yes | Declared adapter type in the schema: `maplibre`, `openlayers`, `leaflet`, or `cesium` |
| `style` | object or string | No | Initial background style (see below) |

At runtime, the active adapter is resolved from the map-scoped Settings preference first, then the element `adapter` attribute, then the resolved `map.type`, then the default adapter. The `type` field is part of the configuration schema and now participates in runtime selection when no explicit override is present.

#### Style Property

The `style` property defines the initial background layers for the map. It can be:

1. **An inline style object** (MapLibre-compatible format)
2. **A URL string** pointing to a style JSON file

If `style` is omitted or empty, the map starts with no background layers.

**Inline style example:**
```json
{
  "style": {
    "sources": {
      "osm": {
        "type": "raster",
        "tiles": ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        "tileSize": 256,
        "attribution": "© OpenStreetMap contributors"
      }
    },
    "layers": [
      { "id": "osm-layer", "type": "raster", "source": "osm" }
    ]
  }
}
```

**URL reference example:**
```json
{
  "style": "https://demotiles.maplibre.org/style.json"
}
```

**Style object properties:**

| Property | Type | Description |
|----------|------|-------------|
| `sources` | object | Map of source ID to source definition |
| `layers` | array | Array of layer definitions |
| `glyphs` | string | URL template for fonts (optional) |
| `sprite` | string | URL for sprite images (optional) |

**Source definition:**

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | `raster`, `vector`, `geojson`, `image`, or `video` |
| `tiles` | array | Array of tile URL templates (for raster/vector) |
| `url` | string | URL to data source |
| `data` | string or object | GeoJSON URL or inline data |
| `tileSize` | number | Tile size in pixels |
| `attribution` | string | Attribution text |

**Layer definition:**

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique layer identifier |
| `type` | string | `raster`, `fill`, `line`, `circle`, `symbol`, or `background` |
| `source` | string | Reference to a source ID |
| `minzoom` | number | Minimum visibility zoom |
| `maxzoom` | number | Maximum visibility zoom |
| `paint` | object | Paint properties (colors, opacity, etc.) |
| `layout` | object | Layout properties |

> **Note:** The style format is compatible with MapLibre GL style specification. The `version` property is optional and defaults to 8.

### LayerData Section

Defines runtime data sources and layers. This section is tree-agnostic.

```json
{
  "layerData": {
    "sources": [ ... ],
    "layers": [ ... ]
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

There are three layer types. All share common base properties.

**Common base properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (referenced by tool tree nodes) |
| `type` | string | Yes | Layer type — see below |
| `title` | string | No | Display name (used in legend and tree when no `label` override is set) |
| `singleGroup` | string | No | Exclusive group key — adding this layer removes any existing layer with the same key |
| `fallbackLayerId` | string | No | Layer to use if this one fails to load |
| `metadata` | object | No | Engine-specific or custom metadata |

---

**Standard layer** (`type: "raster"` | `"fill"` | `"line"` | `"circle"` | `"symbol"` | `"background"` | `"fill-extrusion"` | `"heatmap"`)

A single MapLibre-spec render layer referencing a global source.

```json
{
  "id": "osm",
  "type": "raster",
  "source": "osm-tiles",
  "title": "OpenStreetMap"
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `source` | string | Yes | Reference to a `layerData.sources` entry |
| `source-layer` | string | No | Vector tile layer name |
| `minzoom` | number | No | Minimum visibility zoom |
| `maxzoom` | number | No | Maximum visibility zoom |
| `paint` | object | No | MapLibre paint properties |
| `layout` | object | No | MapLibre layout properties |
| `filter` | array | No | MapLibre filter expression |

---

**Composite style layer** (`type: "style"`)

One or more sub-layers, optionally loaded from a remote style URL.

```json
{
  "id": "earthquakes",
  "type": "style",
  "title": "Earthquakes",
  "layers": [
    {
      "id": "eq-circles",
      "type": "circle",
      "source": "earthquake-source",
      "filter": ["==", ["get", "type"], "earthquake"],
      "paint": {
        "circle-color": "#fa6c07",
        "circle-radius": 6,
        "circle-stroke-color": "#818181",
        "circle-stroke-width": 1
      }
    }
  ]
}
```

To load a full style from a URL (e.g. a vector basemap), set `metadata.styleUrl`:

```json
{
  "id": "openfreemap-liberty",
  "type": "style",
  "title": "OpenFreeMap Liberty",
  "singleGroup": "basemap",
  "fallbackLayerId": "osm",
  "metadata": {
    "styleUrl": "https://tiles.openfreemap.org/styles/liberty"
  },
  "layers": []
}
```

| Property | Type | Description |
|----------|------|-------------|
| `layers` | array | Sub-layer specs (MapLibre-spec casing: `source-layer`, `minzoom`, `maxzoom`) |
| `sources` | object | Inline local source definitions (keyed by source id). Sub-layers referencing these keys are scoped automatically; otherwise global `layerData.sources` are used |
| `metadata.styleUrl` | string | URL of a remote MapLibre style JSON to expand at runtime |

Sub-layer properties follow the MapLibre spec (`source`, `source-layer`, `minzoom`, `maxzoom`, `paint`, `layout`, `filter`).

---

**Allmaps layer** (`type: "allmaps"`)

Renders a georeferenced historical map via the [Allmaps](https://allmaps.org) platform.

```json
{
  "id": "nyc-historical",
  "type": "allmaps",
  "title": "NYC 1836",
  "annotation": "https://annotations.allmaps.org/images/d180902cb93d5bf2"
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `annotation` | string | Yes | Allmaps annotation URL |

### Tools Section

Enables and configures UI tools.

The layer tree belongs to the layer-tree tool configuration (not `layerData`).

```json
{
  "tools": {
    "mainToolbar": {
      "type": "toolbar",
      "enabled": true,
      "items": [
        {
          "id": "layers",
          "type": "layerTree",
          "enabled": true,
          "tree": [
            {
              "label": "Base Maps",
              "expanded": true,
              "children": [
                { "label": "OpenStreetMap", "layerId": "osm" }
              ]
            },
            {
              "label": "Data Layers",
              "expanded": true,
              "children": [
                { "label": "Earthquakes", "layerId": "earthquakes" }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

#### Toolbar Item `label` and `icon`

Each toolbar item can carry a human-facing `label` and a Shoelace `icon`.  
Built-in tool types (e.g. `search`, `measure`, `legend`) have sensible defaults; you only need these fields to override them or when using a custom `element`.

```json
{
  "id": "my-search",
  "type": "search",
  "label": "Zoeken",
  "icon": "search"
}
```

#### 3D Tool Terrain Fallback

The `3d` tool can define engine-specific terrain fallback URLs. These URLs are only used when the map configuration does not provide a terrain layer/source for the active adapter.

```json
{
  "id": "3d",
  "type": "3d",
  "enabled": true,
  "maplibre-terrain-fallback-url": "https://example.com/raster-dem/{z}/{x}/{y}.png",
  "cesium-terrain-fallback-url": "https://example.com/cesium-terrain"
}
```

`icon` accepts either a Shoelace icon name string or an object:

| Form | Example | Notes |
|------|---------|-------|
| string | `"search"` | Uses the default Shoelace icon library |
| `{ name, library? }` | `{ "name": "star", "library": "my-lib" }` | Named icon from a registered library |
| `{ src }` | `{ "src": "/icons/custom.svg" }` | Inline SVG loaded by URL — **see security note below** |

> **Security note — `icon.src` and SVG injection**
>
> When `src` is set, Shoelace fetches the SVG file and injects it as `innerHTML`.
> SVG files can contain `<script>` elements and `on*` event-handler attributes that
> execute JavaScript in the page's origin.
>
> WebMapX blocks cross-origin `src` URLs at config-load time and logs a console
> warning if one is detected.  Same-origin SVGs are passed through without further
> sanitization.
>
> **Recommended mitigations:**
> - Prefer `name` + `library` over `src`; named icons go through Shoelace's library
>   mutator callback where you can sanitize the SVG DOM before injection.
> - If `src` is required, serve the SVG from the same origin and audit its content.
> - Add a `Content-Security-Policy` header with `script-src 'self'` to prevent
>   inline SVG scripts from executing even if a malicious file is injected:
>   ```
>   Content-Security-Policy: script-src 'self'; object-src 'none'
>   ```

#### Layer Tree Node Properties

| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Display text. Optional on leaf nodes — falls back to the referenced layer's `title`, then the `layerId`. Required on group nodes (no `layerId` to fall back to) |
| `layerId` | string | Reference to a layer ID (leaf nodes) |
| `expanded` | boolean | Initial expanded state (group nodes) |
| `children` | array | Child nodes (group nodes) |
| `selectionMode` | string | Group selection mode: `multiple` (default, checkbox behavior) or `single` (radio behavior) |
| `selectionGroup` | string | Optional cross-branch exclusivity key; nodes with the same key behave as one exclusive group |
| `allowNone` | boolean | For `single` groups: whether no option may be selected (`false` by default) |
| `stackOrder` | number | Optional stable rendering slot. Lower renders below higher |

#### Exclusive Overlay Groups (Time-Slice Example)

Exclusive groups are not only for basemaps. They are useful for overlay time slices where exactly one timestamp should be visible.

```json
{
  "tools": {
    "mainToolbar": {
      "items": [
        {
          "id": "layers",
          "type": "layerTree",
          "tree": [
            {
              "label": "Weather",
              "expanded": true,
              "children": [
                {
                  "label": "Rainfall Timeslice",
                  "selectionMode": "single",
                  "selectionGroup": "rainfall-time",
                  "allowNone": false,
                  "stackOrder": 40,
                  "children": [
                    { "label": "10:00", "layerId": "rain-1000" },
                    { "label": "11:00", "layerId": "rain-1100" },
                    { "label": "12:00", "layerId": "rain-1200" }
                  ]
                },
                {
                  "label": "Static Overlays",
                  "selectionMode": "multiple",
                  "stackOrder": 60,
                  "children": [
                    { "label": "Road labels", "layerId": "roads-labels" },
                    { "label": "Admin boundaries", "layerId": "admin-boundaries" }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  },
  "state": {
    "activeExclusiveLayers": {
      "rainfall-time": "rain-1100"
    },
    "activeLayers": ["roads-labels"]
  }
}
```

Order guidance when mixing exclusive and non-exclusive overlays:

- Assign each exclusive group a fixed `stackOrder` slot.
- The selected layer in that group occupies that slot.
- Non-exclusive overlays use their own group/node `stackOrder` slots.
- This keeps ordering stable when switching radio options.

#### Runtime LayerData Shape

`layerData` can be authored as arrays or as keyed objects. The loader normalizes both forms.

Array form:

```json
{
  "layerData": {
    "sources": [
      { "id": "osm", "type": "raster", "service": "xyz", "url": "https://tile.openstreetmap.org/{z}/{x}/{y}.png" }
    ],
    "layers": [
      { "id": "osm", "type": "raster", "source": "osm", "title": "OpenStreetMap" }
    ]
  }
}
```

Object-map form (id is inferred from the key):

```json
{
  "layerData": {
    "sources": {
      "osm": { "type": "raster", "service": "xyz", "url": "https://tile.openstreetmap.org/{z}/{x}/{y}.png" }
    },
    "layers": {
      "osm": {
        "type": "raster",
        "source": "osm",
        "title": "OpenStreetMap"
      }
    }
  }
}
```

## API Keys

Some tile services require API keys (Mapbox, OpenWeatherMap, Bing, etc.). WebMapX keeps keys out of config files using a placeholder convention and a separate `config/apikeys.json` file.

### Placeholders

In source URLs, use `{key-<name>}` where `<name>` matches a key in `apikeys.json`:

```json
{
  "url": "https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.webp?access_token={key-mapbox}"
}
```

At load time, `{key-mapbox}` is replaced with the value of `"mapbox"` from `apikeys.json`.

### apikeys.json

Create `config/apikeys.json` alongside your config files:

```json
{
  "mapbox": "pk.your-mapbox-token",
  "openweathermap": "your-openweathermap-key",
  "bing": "your-bing-key"
}
```

See `config/apikeys.example.json` for all supported keys. The file is optional — missing keys leave placeholders as-is. Add `config/apikeys.json` to `.gitignore` to keep keys out of source control.

### GitHub Actions / CI

To inject keys during a static build without committing them, store the full JSON as a repository secret named `APIKEYS_JSON` and write it in your workflow before building:

```yaml
- run: echo '${{ secrets.APIKEYS_JSON }}' > config/apikeys.json
- run: npm run build
```

### Key security

API keys in tile URLs are visible to anyone using browser devtools — this is inherent to client-side map apps. Restrict key usage by setting allowed referrer domains in each provider's dashboard (Mapbox token settings, Google API console, etc.).

## Validation

Configuration files are validated at load time. The validator checks:

- Required properties are present
- Values have correct types
- Cross-references are valid (e.g., `layerId` references existing layer)
- Source IDs are unique

Errors prevent the config from loading. Warnings are logged to the console.

## Example

See `config/demo.json` for a complete example configuration.

## Legacy Compatibility

- `catalog` is deprecated in favor of `layerData`.
- `catalog.tree` is deprecated in favor of `tools.*.items[].tree` on `type: "layerTree"` tool items.
- `layerset` on layer definitions is deprecated — use `type: "style"` with a `layers` array instead.
- Inline `style: { sources, layers }` on layer definitions is deprecated — use `type: "style"` with inline `sources` and `layers` instead.
- Legacy `library`/`catalogs` input is still normalized by the loader for backward compatibility.
- The loader normalizes all deprecated forms at load time; no runtime behavior changes.
