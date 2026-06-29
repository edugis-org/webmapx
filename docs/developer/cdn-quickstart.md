# CDN Quickstart

Use webmapx directly from a `<script>` tag — no build tools, no npm required.

> **Version**: examples use `@latest` for convenience. Pin to a specific version
> (e.g. `@edugis-org/webmapx@0.2.0`) in production to avoid unexpected breaking changes.

---

## 1 — Just a map

The minimum: a MapLibre map with an OpenStreetMap background. No tools yet.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Map</title>

  <script type="importmap">
  { "imports": { "maplibre-gl": "https://esm.sh/maplibre-gl@5" } }
  </script>

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplibre-gl@5/dist/maplibre-gl.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@edugis-org/webmapx@latest/dist-lib/webmapx.css">

  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>

  <script type="module">
    import { WebMapX } from 'https://cdn.jsdelivr.net/npm/@edugis-org/webmapx@latest/dist-lib/webmapx.js';

    WebMapX.mount('#map', {
      config: {
        engine: 'maplibre',
        map: { center: [5, 52], zoom: 7 },
        layerData: {
          sources: {
            osm: {
              type: 'raster', service: 'xyz',
              url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              tileSize: 256,
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
          },
          layers: { osm: { id: 'osm', type: 'raster', source: 'osm', title: 'OpenStreetMap' } }
        },
        state: { activeLayers: [{ ref: 'osm', visible: true }] }
      }
    });
  </script>
</body>
</html>
```

A map alone has limited value. Real users need to navigate, measure, inspect features, print, and switch backgrounds. That's what tools are for.

---

## 2 — Map with tools

Add a toolbar with the most common tools:

```js
WebMapX.mount('#map', {
  config: {
    engine: 'maplibre',
    tools: ['coordinates', 'scale', 'fullscreen', 'info', 'measure', 'draw', 'search', 'print', 'layer-overview'],
    map: { center: [5, 52], zoom: 7 },
    layerData: { /* same as above */ },
    state: { activeLayers: [{ ref: 'osm', visible: true }] }
  }
});
```

Each string in `tools` is a tool id. Tools load on demand — only what you list is fetched.

→ [All available tools and what they do](./cdn-tools/overview.md)

---

## 3 — Load config from a file

Keep config in a separate JSON file instead of inlining it:

```js
WebMapX.mount('#map', { config: './mymap.json' });
```

The JSON file uses the same structure as the inline config above.

**Build your config visually:** open [setup.html](https://edugis-org.github.io/webmapx/testpages/setup.html), configure tools and layers interactively, then download the resulting JSON and point `config` at it.

---

## 4 — Switch engine

Replace `maplibre` with `openlayers`, `leaflet`, or `cesium` and update the importmap:

| Engine | importmap key | CDN URL |
|---|---|---|
| MapLibre (default) | `maplibre-gl` | `https://esm.sh/maplibre-gl@5` |
| OpenLayers | `ol` | `https://cdn.jsdelivr.net/npm/ol@10/+esm` |
| Leaflet | `leaflet` | `https://esm.sh/leaflet@1` |
| Cesium | `cesium` | `https://esm.sh/cesium@1` |

---

## 5 — Switch locale

```js
config: { engine: 'maplibre', locale: 'nl', tools: ['measure'] }
```

English is built-in. Other locales load from CDN on first use.

---

## 6 — Add a plugin

```js
config: {
  engine: 'maplibre',
  plugins: ['https://cdn.jsdelivr.net/npm/@my-org/wmx-plugin@1.0/dist/plugin.js']
}
```

Plugins from trusted CDNs (jsdelivr, unpkg, esm.sh) load automatically. Others are skipped with a console warning.

---

## Next steps

- [Tool reference](./cdn-tools/overview.md) — all tools, one page each with copy-paste examples
- [npm quickstart](./npm-quickstart.md) — use webmapx in a Vite/webpack project
- [GitHub quickstart](./github-quickstart.md) — clone and run locally
