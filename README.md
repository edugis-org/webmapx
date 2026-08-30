# WebMapX

Config-driven web map UI with adapters for MapLibre, OpenLayers, Leaflet, and Cesium.

**[Live demo](https://webmapx.com/)**

<!-- TODO: add screenshot of map with toolbar, legend, and tools visible -->

## What it does

- Drop a config file, get a full map UI — toolbar, layer tree, legend, tools
- Switch map engines (MapLibre / OpenLayers / Leaflet / Cesium) without rewriting tools
- 15+ built-in tools: draw, measure, search, print, import, geolocation, 3D, …
- Lazy loading — only tools and engines the config requests download
- Plugin system for custom tools
- i18n — English built-in, other locales lazy-loaded from CDN

---

## Quick start

### CDN (no build tools needed)

Copy this HTML, save as `index.html`, open in a browser. You get a map with coordinates display, scale bar, fullscreen toggle, feature info, measure, and layer legend — all loaded from CDN.

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
        tools: ['coordinates', 'scaleControl', 'fullscreen', 'info', 'measure', 'layerOverview'],
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

Or load config from a file: `WebMapX.mount('#map', { config: './mymap.json' })`

**Build your config visually:** [setup.html](https://edugis-org.github.io/webmapx/testpages/setup.html) lets you configure tools and layers interactively, then download the JSON.

→ [Full CDN quickstart](https://github.com/edugis-org/webmapx/blob/main/docs/developer/cdn-quickstart.md) · [All tools](https://github.com/edugis-org/webmapx/blob/main/docs/developer/cdn-tools/overview.md)

---

### npm

```bash
npm install @edugis-org/webmapx maplibre-gl
```

```js
import { WebMapX } from '@edugis-org/webmapx'
WebMapX.mount('#map', { config: './mymap.json' })
```

→ [npm quickstart](https://github.com/edugis-org/webmapx/blob/main/docs/developer/npm-quickstart.md)

**On package size.** The published package is large because it carries GDAL
compiled to WebAssembly — the engine behind buffering, overlay analysis and
file import. **Visitors never download it unless they use those tools.** The
spatial worker, and the ~38 MB of wasm with it, is fetched the first time an
analysis panel is opened; a map that only pans, zooms and switches layers
fetches none of it. The weight is on your build server's disk, not on your
users' connections.


---

### Clone and run locally

```bash
git clone https://github.com/edugis-org/webmapx.git
cd webmapx && npm install && npm run configs && npm run dev
```

`npm run configs` puts the [config repository](https://github.com/edugis-org/webmapx-configs)
at `public/config` — the maps webmapx serves are content of their own, on their own
release cadence. It links a sibling `../webmapx-configs` clone if you have one (a
junction on Windows) and clones otherwise; `npm run configs:status` shows which
commit you are on. This repository pins nothing: a pin is a publication decision,
and it is recorded by whatever publishes a site (for webmapx.com, the `site.lock`
in [edugis-org/webmapx-demo](https://github.com/edugis-org/webmapx-demo)). Point
`WEBMAPX_CONFIGS_LOCK` at such a lock to check out exactly what it names.

→ [GitHub / contributor quickstart](https://github.com/edugis-org/webmapx/blob/main/docs/developer/github-quickstart.md)

---

## Documentation

- [CDN quickstart](https://github.com/edugis-org/webmapx/blob/main/docs/developer/cdn-quickstart.md)
- [All tools](https://github.com/edugis-org/webmapx/blob/main/docs/developer/cdn-tools/overview.md)
- [npm quickstart](https://github.com/edugis-org/webmapx/blob/main/docs/developer/npm-quickstart.md)
- [GitHub / contributor quickstart](https://github.com/edugis-org/webmapx/blob/main/docs/developer/github-quickstart.md)
- [Plugin authoring](https://github.com/edugis-org/webmapx/blob/main/docs/developer/plugin-authoring.md)
- [Developer guide](https://github.com/edugis-org/webmapx/blob/main/docs/DEVELOPER_GUIDE.md)

## License

ISC
