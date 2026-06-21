# CDN Quickstart

Use webmapx directly from a `<script>` tag — no build tools, no npm required.

> **Version**: examples use `@latest` for convenience. For production, pin to a specific version
> (e.g. `@edugis-org/webmapx@0.1.16`) to avoid unexpected breaking changes.

## Minimal working example

Copy this HTML and open it in a browser or serve it with any static server:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Map</title>

  <!-- Import map: tells the browser where to find webmapx peer dependencies -->
  <script type="importmap">
  {
    "imports": {
      "maplibre-gl": "https://esm.sh/maplibre-gl@5",
      "lit": "https://cdn.jsdelivr.net/npm/lit@3/index.js",
      "lit/": "https://cdn.jsdelivr.net/npm/lit@3/",
      "lit-html": "https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js",
      "lit-html/": "https://cdn.jsdelivr.net/npm/lit-html@3/",
      "@lit/reactive-element": "https://cdn.jsdelivr.net/npm/@lit/reactive-element@2/reactive-element.js",
      "@lit/reactive-element/": "https://cdn.jsdelivr.net/npm/@lit/reactive-element@2/",
      "lit-element/": "https://cdn.jsdelivr.net/npm/lit-element@4/",
      "@shoelace-style/shoelace/dist/": "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2/cdn/",
      "@shoelace-style/shoelace/": "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2/cdn/"
    }
  }
  </script>

  <!-- Styles -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2/cdn/themes/light.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@edugis-org/webmapx@latest/dist-lib/webmapx.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplibre-gl@5/dist/maplibre-gl.css">

  <style>
    html, body { margin: 0; padding: 0; overflow: hidden; }
    #map { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="map"></div>

  <script type="module">
    import { WebMapX } from 'https://cdn.jsdelivr.net/npm/@edugis-org/webmapx@latest/dist-lib/webmapx.js';

    WebMapX.mount('#map', {
      config: {
        engine: 'maplibre',
        tools: ['draw', 'measure'],
        map: { center: [5, 52], zoom: 4, type: 'maplibre' },
        layerData: {
          sources: {
            'osm-source': {
              type: 'raster',
              service: 'xyz',
              url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              tileSize: 256,
              attribution: '&copy; OpenStreetMap contributors'
            }
          },
          layers: {
            'osm': { id: 'osm', type: 'raster', source: 'osm-source', title: 'OpenStreetMap' }
          }
        },
        state: {
          activeLayers: [{ ref: 'osm', visible: true }]
        }
      }
    });
  </script>
</body>
</html>
```

## Load config from a file

```js
WebMapX.mount('#map', { config: './mymap.json' });
```

The JSON file follows the same structure as the inline config above.

## Available tools

Pass tool names in the `tools` array:

```js
tools: ['draw', 'measure', 'search', 'print', 'import', 'geolocation', 'info', '3d', 'truearea', 'settings']
```

## Switch locale

```js
config: { engine: 'maplibre', locale: 'nl', tools: ['draw'] }
```

English is built-in. Other locales lazy-load from CDN on first use.

## Add a plugin

```js
config: {
  engine: 'maplibre',
  plugins: ['https://cdn.jsdelivr.net/npm/@my-org/wmx-plugin@1.0/dist/plugin.js']
}
```

Plugins from trusted CDNs (jsdelivr, unpkg, esm.sh) load automatically. Others are skipped with a console warning.

If your page enforces CSP, add:
```
Content-Security-Policy: script-src 'self' https://cdn.jsdelivr.net https://esm.sh;
```

## Use a different engine

Replace `maplibre` with `openlayers`, `leaflet`, or `cesium` in both `engine` and `map.type`, and update the importmap entry accordingly (e.g. `"ol": "https://cdn.jsdelivr.net/npm/ol@10/+esm"`).
