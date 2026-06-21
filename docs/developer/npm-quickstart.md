# npm Quickstart

For projects using a bundler (Vite, webpack, rollup).

## Install

The map engine is a peer dependency — install it alongside webmapx:

```bash
npm install @edugis-org/webmapx maplibre-gl
```

For other engines:

```bash
npm install @edugis-org/webmapx ol          # OpenLayers
npm install @edugis-org/webmapx leaflet     # Leaflet
```

## Mount

```ts
import WebMapX from '@edugis-org/webmapx';

WebMapX.mount('#map', {
  config: {
    engine: 'maplibre',
    tools: ['draw', 'measure'],
    layers: [
      {
        id: 'osm',
        type: 'background',
        source: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256
        }
      }
    ]
  }
});
```

The container element (`#map`) must have explicit width and height in CSS before `mount` is called.

## Config as imported JSON

With Vite or webpack (with `resolveJsonModule`), import the config directly:

```ts
import WebMapX from '@edugis-org/webmapx';
import config from './mymap.json';

WebMapX.mount('#map', { config });
```

Or pass a URL string and webmapx fetches it at runtime:

```ts
WebMapX.mount('#map', { config: '/assets/mymap.json' });
```

## TypeScript types

Types are bundled. Import them directly:

```ts
import type { AppConfig, ToolConfig, AnyLayerConfig } from '@edugis-org/webmapx';

const config: AppConfig = {
  engine: 'maplibre',
  locale: 'en',
  tools: ['draw'],
  layers: []
};
```

## Tree-shaking and lazy loading

Only the tools listed in `config.tools` are downloaded at runtime. A config with `tools: ['draw']` never loads the measure, search, or routing bundles. No manual code-splitting required.

The map engine itself also lazy-loads — importing `@edugis-org/webmapx` does not pull in `maplibre-gl`. The engine bundle is fetched only when `mount` runs and the engine module resolves.

## Switching locale

Pass `locale` in the config:

```ts
WebMapX.mount('#map', {
  config: { engine: 'maplibre', locale: 'nl', tools: [] }
});
```

Built-in locales (`en`, `nl`, `de`, `fr`) are included in the webmapx package.

### Self-hosting locale files (advanced)

If you need to serve locale JSON from your own infrastructure, set `localeLoader` to a URL prefix. webmapx appends `/{locale}.json` and fetches from there:

```ts
WebMapX.mount('#map', {
  localeLoader: 'https://assets.myapp.com/webmapx/locales',
  config: { engine: 'maplibre', locale: 'nl', tools: [] }
});
```

This is useful for air-gapped environments or when you need to customise built-in strings.

## Building the library

The webmapx repo ships a `build:lib` npm script that produces the self-contained bundle at `dist-lib/webmapx.js`. This is the file published to npm and referenced by the CDN URL. When consuming from npm you import from the package root and your bundler resolves the correct entry point automatically.

```bash
npm run build:lib   # produces dist-lib/webmapx.js
```
