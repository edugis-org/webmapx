# WebMapX

Config-driven web map UI with adapters for MapLibre, OpenLayers, Leaflet, and Cesium.

**[Live demo](https://edugis-org.github.io/webmapx/)**

## What it does

- Drop a config file, get a full map UI — toolbar, layer tree, legend, tools
- Switch map engines (MapLibre / OpenLayers / Leaflet / Cesium) without rewriting tools
- 15+ built-in tools: draw, measure, search, print, import, geolocation, 3D, …
- Lazy loading — only tools and engines the config requests download
- Plugin system for custom tools
- i18n — English built-in, other locales lazy-loaded from CDN

## Quick start

### CDN (no build tools needed)

```html
<script type="module">
  import { WebMapX } from 'https://cdn.jsdelivr.net/npm/@edugis-org/webmapx@latest/dist-lib/webmapx.js'
  WebMapX.mount('#map', { config: './mymap.json' })
</script>
```

→ [CDN quickstart](./docs/developer/cdn-quickstart.md)

### npm

```bash
npm install @edugis-org/webmapx maplibre-gl
```

```js
import { WebMapX } from '@edugis-org/webmapx'
WebMapX.mount('#map', { config: './mymap.json' })
```

→ [npm quickstart](./docs/developer/npm-quickstart.md)

### Clone and run locally

```bash
git clone https://github.com/edugis-org/webmapx.git
cd webmapx && npm install && npm run dev
```

→ [GitHub / contributor quickstart](./docs/developer/github-quickstart.md)

## Documentation

- [CDN quickstart](./docs/developer/cdn-quickstart.md)
- [npm quickstart](./docs/developer/npm-quickstart.md)
- [GitHub / contributor quickstart](./docs/developer/github-quickstart.md)
- [Plugin authoring](./docs/developer/plugin-authoring.md)
- [Developer guide](./docs/DEVELOPER_GUIDE.md)

## License

ISC
