# CDN Quickstart

Use webmapx directly from a `<script>` tag — no build tools, no npm required.

> **Version**: examples use `@latest` for convenience. For production, pin to a specific version:
> `@edugis-org/webmapx@0.1.1/` to avoid unexpected breaking changes.

## Minimal working example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Map</title>

  <!-- Import map: resolve bare specifiers (lit, shoelace) used by webmapx -->
  <script type="importmap">
  {
    "imports": {
      "lit": "https://cdn.jsdelivr.net/npm/lit@3/index.js",
      "lit/": "https://cdn.jsdelivr.net/npm/lit@3/",
      "lit-html": "https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js",
      "lit-html/": "https://cdn.jsdelivr.net/npm/lit-html@3/",
      "@lit/reactive-element": "https://cdn.jsdelivr.net/npm/@lit/reactive-element@2/reactive-element.js",
      "@lit/reactive-element/": "https://cdn.jsdelivr.net/npm/@lit/reactive-element@2/",
      "lit-element/": "https://cdn.jsdelivr.net/npm/lit-element@4/",
      "@shoelace-style/shoelace/": "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2/"
    }
  }
  </script>

  <!-- MapLibre peer dep -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplibre-gl@5/dist/maplibre-gl.css">
  <script src="https://cdn.jsdelivr.net/npm/maplibre-gl@5/dist/maplibre-gl.js"></script>

  <!-- webmapx -->
  <script type="module">
    import { WebMapX } from 'https://cdn.jsdelivr.net/npm/@edugis-org/webmapx@latest/dist-lib/webmapx.js';

    WebMapX.mount('#map', {
      config: {
        engine: 'maplibre',
        tools: ['draw', 'measure'],
        layers: [
          {
            type: 'background',
            source: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 }
          }
        ]
      }
    });
  </script>
  <style>
    #map { width: 100vw; height: 100vh; margin: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
</body>
</html>
```

## Loading peer map engine deps

webmapx treats the map engine as a peer dependency. Load it from its own CDN before webmapx.

| Engine | CDN script |
| :----- | :--------- |
| MapLibre GL | `https://cdn.jsdelivr.net/npm/maplibre-gl@4/dist/maplibre-gl.js` |
| OpenLayers | `https://cdn.jsdelivr.net/npm/ol@9/dist/ol.js` |
| Leaflet | `https://cdn.jsdelivr.net/npm/leaflet@1/dist/leaflet.js` |

The engine exposes itself on `window` (`maplibregl`, `ol`, `L`). webmapx detects whichever is present when the config requests it.

## Config JSON structure

The `config` option accepts an inline object or a URL to a JSON file:

```js
WebMapX.mount('#map', { config: './mymap.json' });
```

```json
{
  "engine": "maplibre",
  "locale": "en",
  "tools": ["draw", "measure", "search"],
  "plugins": [],
  "viewport": { "center": [5.3, 52.1], "zoom": 8 },
  "layers": [
    {
      "id": "osm",
      "type": "background",
      "label": "OpenStreetMap",
      "source": {
        "type": "raster",
        "tiles": ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        "tileSize": 256
      }
    }
  ]
}
```

## Switching locale

Pass `locale` in the config. webmapx lazy-loads the matching strings:

```js
WebMapX.mount('#map', {
  config: {
    engine: 'maplibre',
    locale: 'nl',
    tools: ['draw', 'measure']
  }
});
```

The `nl` bundle ships with webmapx. For a custom locale, set `localeLoader` to a URL prefix pointing to your own JSON files (see the npm quickstart for details).

## Using a plugin from CDN

Add a full CDN URL to the `plugins` array. webmapx fetches and registers it after mount:

```json
{
  "engine": "maplibre",
  "tools": ["draw"],
  "plugins": [
    "https://cdn.jsdelivr.net/npm/@my-org/wmx-routing-plugin@2.1/dist/plugin.js"
  ]
}
```

### CSP headers

If your page enforces a Content Security Policy, allow the CDNs you use:

```
Content-Security-Policy: script-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://esm.sh;
```

Plugins loaded from origins not in webmapx's trusted list (jsdelivr, unpkg, esm.sh) are skipped with a console warning.

## Multiple engines on the same page

Instantiate `WebMapX.mount` once per container, each with its own config:

```html
<div id="map-a"></div>
<div id="map-b"></div>

<script type="module">
  import WebMapX from 'https://cdn.jsdelivr.net/npm/@edugis-org/webmapx@latest/dist-lib/webmapx.js';

  // MapLibre instance
  WebMapX.mount('#map-a', {
    config: { engine: 'maplibre', tools: ['measure'] }
  });

  // OpenLayers instance — load OL peer dep first (see above)
  WebMapX.mount('#map-b', {
    config: { engine: 'openlayers', tools: ['draw'] }
  });
</script>
```

Each call is independent; engines lazy-load only what the config requests.
