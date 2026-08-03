# Configuration

WebMapX uses JSON configuration files to define maps, data sources, layers, and tools. The app can load a page-level config via `?config=` or a per-map config via the `src` attribute on `<webmapx-map>`.

## Loading Configuration

### URL Parameter

Pass a config file via the `config` query parameter:

```
https://example.com/?config=./config/demo.json
https://example.com/?config=/api/configs/production.json
```

This applies to the **first** `<webmapx-map>` in DOM order. On pages with multiple maps, use indexed params to target specific maps (see [Multi-map pages](#multi-map-pages) below).

### Per-Map Configuration

Individual `<webmapx-map>` elements can specify their own config via the `src` attribute. See [webmapx-map](./components/webmapx-map.md) for details.

### Multi-map pages

Pages with multiple `<webmapx-map>` elements can supply a separate config URL for each map via indexed query parameters. Maps are identified by their **DOM order** — no `id` attribute required.

```
?config=<url>        config for the first map (index 0)
?config.0=<url>      same as above — explicit index 0 form
?config.1=<url>      config for the second map
?config.2=<url>      config for the third map
```

**Precedence:** the explicit indexed form (`config.0=`) takes precedence over the short alias (`config=`) when both appear in the URL.

**Example — two maps on one page:**

```html
<webmapx-map src="./config/world.json">…</webmapx-map>
<webmapx-map src="./config/inset.json">…</webmapx-map>
```

```
https://example.com/?config=https://example.com/world.json&config.1=https://example.com/inset.json
```

Maps that have no matching URL param fall back to their `src` attribute.

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
| `minZoom` | number | No | Minimum zoom level (deprecated — use `runtimeMap.minZoom`) |
| `maxZoom` | number | No | Maximum zoom level (deprecated — use `runtimeMap.maxZoom`) |
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

### RuntimeMap Section

Optional runtime constraints on the map viewport. Prefer these over the deprecated `map.minZoom`/`map.maxZoom`/`map.minPitch`/`map.maxPitch` fields.

```json
{
  "runtimeMap": {
    "minZoom": 6,
    "maxZoom": 19,
    "minPitch": 0,
    "maxPitch": 60,
    "maxBounds": [3.2, 50.7, 7.3, 53.6]
  }
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `minZoom` | number | No | Minimum zoom level (0-24) |
| `maxZoom` | number | No | Maximum zoom level (0-24) |
| `minPitch` | number | No | Minimum pitch in degrees (0-85) |
| `maxPitch` | number | No | Maximum pitch in degrees (0-85) |
| `maxBounds` | [number, number, number, number] | No | Restricts panning and zoom-out to a bounding box: `[west, south, east, north]` in longitude/latitude degrees (MapLibre `LngLatBoundsLike` flat form) |

**`maxBounds` behavior:**

- Works across all four engines (MapLibre, OpenLayers, Leaflet, Cesium; Cesium enforcement is a soft per-frame clamp).
- "Cover" semantics: the visible map always stays inside the box. When the viewport aspect ratio differs from the box's, the whole box is never visible at once — zoom-out stops when the tighter screen dimension reaches the box edge, and the user pans along the longer axis.
- The zoom-out limit is derived from the box and viewport size automatically and re-derived when the map container resizes; an explicit `minZoom` is combined with it (the stricter one wins).
- Boxes crossing the antimeridian (`west > east`) are not supported and rejected by validation.
- If `map.center` lies outside the box, the map clamps to the box on load (validation warns about this).

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

#### Container Items: `toolbox` and `menu`

Two item types hold other tools instead of being a tool themselves. Both take an `items` array of ordinary toolbar items, and both open in a single tool panel:

- **`toolbox`** — a horizontal scrolling row of icon buttons, with a search box once the row overflows.
- **`menu`** — a vertical list of labelled rows with drill-in submenus, a back button and a breadcrumb trail. A search box appears from 8 tools onward and matches across all levels. See [`webmapx-menu-tool`](./components/webmapx-menu-tool.md).

```json
{
  "type": "menu",
  "id": "tools",
  "label": "Tools",
  "icon": "list",
  "items": [
    { "type": "measure", "id": "measure" },
    {
      "type": "menu",
      "id": "analysis",
      "label": "Analysis",
      "icon": "diagram-3",
      "items": [
        { "type": "buffer", "id": "buffer" },
        { "type": "isochrone", "id": "isochrone" }
      ]
    }
  ]
}
```

Containers nest to any depth and may be mixed: a `menu` inside a `menu` becomes a submenu, while a nested container inside a `toolbox` is flattened into the same icon row (the toolbox has no submenu UI). Sub-item `id`s must be unique within one container.

A tool placed inside a container is not registered with the map-wide `ToolManager` — the container decides which of its sub-tools is active. Tools that read their own settings from a top-level `tools.<id>` object (such as `search`) still do so when nested.

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

### Stories Section

Defines guided-tour content for the [`webmapx-stories-tool`](./components/webmapx-stories-tool.md) — a top-level sibling of `tools`, not nested inside it. Each story is a sequence of chapters/steps that fly the camera and toggle layer visibility/opacity/projection/terrain; step state is written in a human-readable form (`layers`, `hiddenLayers`, `view`, `transparency`, `projection`, `terrain`).

```json
{
  "stories": {
    "stories": [
      {
        "name": "Demo tour",
        "chapters": [
          {
            "id": "intro",
            "title": "Introduction",
            "steps": [
              {
                "title": "Welcome",
                "html": "<p>Use Next to continue.</p>",
                "state": {
                  "layers": ["osm"],
                  "view": { "center": [-74.0, 40.7], "zoom": 4 }
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
```

See [`webmapx-stories-tool`](./components/webmapx-stories-tool.md) for the full `StoryConfig`/`StoryStepConfigState` field reference.

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
